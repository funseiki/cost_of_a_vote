require 'sinatra'
require 'mysql2'
require 'json'
require './config.rb'

get '/candidates' do
  sql = congress_members_sql
  results = {}
  db_client.query(congress_members_sql).
    each { |h| results[h["thomas_id"]]  = h}

  JSON.dump(results)
end

get '/contributors' do
  candidate_ids = ids_to_list(candidate_ids_lookup.keys)
  sql = "SELECT DISTINCT(contributor_id)  FROM contributions WHERE candidate_id IN (#{candidate_ids});"

  contributor_ids = ids_to_list(db_client.query(sql, :as => :array).to_a.flatten)
  sql = "SELECT * FROM contributors WHERE id IN (#{contributor_ids});"

  contributors = {}
  db_client.query(sql, :as => :hash).each do |h|
    contributors[h["id"]] = h
  end

  JSON.dump(contributors)
end

get '/bills' do
  sql = "SELECT * FROM bills;"
  bills = {}
  db_client.query(sql).each {|b| bills[b["id"]] = b}
  JSON.dump(bills)
end

get '/contributions' do
  candidate_ids = candidate_ids_lookup.keys.map{|k| "'#{k}'"}.join(',')
  sql = "SELECT * FROM contributions WHERE contributions.candidate_id IN (#{candidate_ids});"

  lookup = candidate_ids_lookup
  contributions = db_client.query(sql).map do |h|
    {
      :source => h["contributor_id"],
      :target => lookup[h["candidate_id"]],
      :value => h["amount"]
    }
  end

  JSON.dump(contributions);
end

get '/votes' do
  sql = "SELECT * FROM votes;"

  votes = db_client.query(sql).map do |v|
    {
      :source => v["thomas_id"],
      :target => v["bill_id"],
      :value => v["status"]
    }
  end
  JSON.dump(votes);
end

def ids_to_list(ids)
  ids.map{|i| "'#{i}'"}.join(',')
end



# TODO this query only works for current congressional members because we only
# loaded thomas_ids for current congressional members -- we should load the
# respective candidate's cycle and query by that
def congress_members_sql(fields = "*")
  "SELECT #{fields} FROM candidates WHERE thomas_id IS NOT NULL;"
end

def db_client
  @db ||= Mysql2::Client.new(:host => CostOfAVote::Config[:mysql][:hostname],
                :username => CostOfAVote::Config[:mysql][:username],
                :database => CostOfAVote::Config[:mysql][:database])
end

# provides hash from opensecrets_id to thomas_id
def candidate_ids_lookup
  @candidate_ids_lookup ||= begin
    candidate_ids_sql = congress_members_sql("opensecrets_id, thomas_id")
    lookup = {}
    db_client.query(candidate_ids_sql).each do |h|
      lookup[h["opensecrets_id"]] = h["thomas_id"]
    end

    lookup
  end
end
