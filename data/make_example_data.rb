require 'mysql2'
require 'json'
require '../config.rb'

module CostOfAVote
  class DB
    def self.client
      Mysql2::Client.new(:host => CostOfAVote::Config[:mysql][:hostname],
                         :username => CostOfAVote::Config[:mysql][:username],
                         :password => CostOfAVote::Config[:mysql][:password],
                         :database => CostOfAVote::Config[:mysql][:database])
    end

    def self.ids_to_list(ids)
      ids.map{|i| "'#{i}'"}.join(',')
    end
  end

  class ExampleData
    def initialize
      @db = DB::client()
    end

    def top_contributor_ids(limit = 10)
      sql = """SELECT co.contributor_id
        FROM contributions co INNER JOIN candidates ca
        ON co.candidate_opensecrets_id = ca.opensecrets_id
        WHERE ca.thomas_id IS NOT NULL
        AND co.type IN ('24C', '24F', '24K', '24Z')
        GROUP BY contributor_id
        ORDER BY SUM(amount) DESC LIMIT #{limit};"""

      @db.query(sql, :as => :array).to_a.flatten.reject {|id| id.strip.empty?}
    end

    def top_contributors_for_candidates(candidate_ids, limit = 10)
      sql = """SELECT co.contributor_id
        FROM contributions co INNER JOIN candidates ca
        ON co.candidate_opensecrets_id = ca.opensecrets_id
        WHERE ca.thomas_id IS NOT NULL
        AND co.type IN ('24C', '24F', '24K', '24Z')
        AND co.candidate_opensecrets_id IN (#{DB::ids_to_list(candidate_ids)})
        GROUP BY contributor_id
        ORDER BY SUM(amount) DESC LIMIT #{limit};"""

      @db.query(sql, :as => :array).to_a.flatten.reject {|id| id.strip.empty?}
    end

    def contributors(contributor_ids)
      sql = "SELECT * FROM contributors WHERE id IN (#{DB::ids_to_list(contributor_ids)});";
      contributors = {}
      @db.query(sql, :as => :hash).each do |contributor|
        contributors[contributor["id"]] = contributor
      end

      contributors
    end

    def candidate_ids_contributed_to(contributor_ids, limit = 10)
      sql = """SELECT DISTINCT(co.candidate_opensecrets_id)
        FROM contributions co INNER JOIN candidates ca
        ON co.candidate_opensecrets_id = ca.opensecrets_id
        WHERE co.contributor_id IN (#{DB::ids_to_list(contributor_ids)})
        AND ca.thomas_id IS NOT NULL
        AND co.type IN ('24C', '24F', '24K', '24Z')
        LIMIT #{limit};"""

      @db.query(sql, :as => :array).to_a.flatten
    end

    def candidates(candidate_ids)
      sql = "SELECT * FROM candidates WHERE opensecrets_id IN (#{DB::ids_to_list(candidate_ids)});";
      candidates = {}
      @db.query(sql, :as => :hash).each do |candidate|
        candidates[candidate["opensecrets_id"]] = candidate
      end

      candidates
    end

    def contributions(contributor_ids, candidate_ids)
      sql = """SELECT *, SUM(amount) FROM contributions
        WHERE candidate_opensecrets_id IN (#{DB::ids_to_list(candidate_ids)})
        AND contributor_id IN (#{DB::ids_to_list(contributor_ids)})
        AND type IN ('24C', '24F', '24K', '24Z')
        GROUP BY contributor_id, candidate_opensecrets_id;"""

      contributions = @db.query(sql).map do |h|
        {
          :source => h["contributor_id"],
          :target => h["candidate_opensecrets_id"],
          :value => h["SUM(amount)"]
        }
      end

      contributions
    end

    def voted_on_bill_ids(candidate_ids, limit = 10)
      sql = """SELECT v.bill_id
        FROM votes v INNER JOIN candidates c
        ON v.govtrack_id = c.govtrack_id
        WHERE c.opensecrets_id  IN (#{DB::ids_to_list(candidate_ids)})
        GROUP BY v.bill_id
        ORDER BY count(*) DESC
        LIMIT #{limit};"""

      @db.query(sql, :as => :array).to_a.flatten
    end

    def bills(bill_ids, limit = 10)
      sql = """SELECT * FROM bills
      WHERE id IN (#{DB::ids_to_list(bill_ids)})
      LIMIT #{limit};"""

      bills = {}
      @db.query(sql, :as => :hash).each do |bill|
        bills[bill["id"]] = bill
      end

      bills
    end

    def votes(candidate_ids, bill_ids)
      sql = """SELECT votes.bill_id, candidates.opensecrets_id, votes.status
        FROM candidates INNER JOIN votes
        ON candidates.govtrack_id = votes.govtrack_id
        WHERE candidates.opensecrets_id IN (#{DB::ids_to_list(candidate_ids)})
        AND votes.bill_id IN (#{DB::ids_to_list(bill_ids)});"""

      votes = @db.query(sql).map do |h|
        {
          :source => h["opensecrets_id"],
          :target => h["bill_id"],
          :value => h["status"]
        }
      end

      votes
    end
  end
end

example_data = CostOfAVote::ExampleData.new()
#contributor_ids = example_data.top_contributor_ids
#candidate_ids = example_data.candidate_ids_contributed_to(contributor_ids)


candidate_ids =  ["N00003675", "N00007360" , "N00000826", "N00025413", "N00031401", "N00028986"]
contributor_ids = example_data.top_contributors_for_candidates(candidate_ids)
bill_ids = example_data.voted_on_bill_ids(candidate_ids)
puts "have top contributors and candidate ids"

candidates = example_data.candidates(candidate_ids)
contributors = example_data.contributors(contributor_ids)
#bills = example_data.bills(candidate_ids)
bills = example_data.bills(bill_ids)

contributions = example_data.contributions(contributor_ids, candidate_ids)
votes = example_data.votes(candidate_ids, bills.keys)
puts "preparing to dump!"

`mkdir -p example_data`
JSON.dump(candidates, File.open('example_data/candidates.json', 'w'))
JSON.dump(contributors, File.open('example_data/contributors.json', 'w'))
JSON.dump(bills, File.open('example_data/bills.json', 'w'))
JSON.dump(contributions, File.open('example_data/contributions.json', 'w'))
JSON.dump(votes, File.open('example_data/votes.json', 'w'))
puts "done"
