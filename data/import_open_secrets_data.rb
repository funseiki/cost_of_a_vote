require 'csv'
require 'json'
require 'mysql'
require './config.rb'

module CostOfAVote; end;

CLIENT = Mysql.connect(CostOfAVote::Config[:mysql][:hostname], CostOfAVote::Config[:mysql][:username], nil, CostOfAVote::Config[:mysql][:database])

CostOfAVote::CreateTableSql = [
  """CREATE TABLE IF NOT EXISTS industry (
     id varchar(5) NOT NULL,
     name varchar(255) NOT NULL,
     PRIMARY KEY (id)
   ) ENGINE=InnoDB;""",
   """CREATE TABLE IF NOT EXISTS contributor (
    id varchar(12) NOT NULL,
    industry_id varchar(5),
    name varchar(255) NOT NULL,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB;""",
  """CREATE TABLE IF NOT EXISTS candidate (
    id varchar(9) NOT NULL,
    name varchar(255) NOT NULL,
    party varchar(3),
    PRIMARY KEY (id)
  ) ENGINE=InnoDB AUTO_INCREMENT=1;""",
  """CREATE TABLE IF NOT EXISTS contribution (
    candidate_id varchar(9),
    contributor_id varchar(12),
    industry_id varchar(5),
    amount int unsigned,
    FOREIGN KEY (candidate_id) REFERENCES candidate(id),
    FOREIGN KEY (contributor_id) REFERENCES contributor(id),
    FOREIGN KEY (industry_id) REFERENCES industry(id)
  ) ENGINE=InnoDB;"""
]

def create_tables
  CostOfAVote::CreateTableSql.each { |sql| CLIENT.query(sql) }
end

def insert_record(table, record)
  sql = "INSERT INTO #{table} (#{record.keys.join(',')}) VALUES (#{record.keys.length.times.map{"?"}.join(',')})"

  stmnt = CLIENT.prepare(sql)
  stmnt.execute(*record.values)
end

def convert_industries
  industries_txt = File.open("crp_categories.txt")

  industries = []
  industries_txt.each_line do |line|
    line.match(/([A-Z]*\d*)\s(.*)[A-Z]\d\d.*/)
    industries << {:id => $1.strip, :name => $2.strip}
  end

  industries
end

def import_industries
  industries = convert_industries
  industries.each { |industry| insert_record("industry", industry) }
end

def convert_candidates
  candidates_txt = File.open("open_secrets_data/cands12.txt").read
  # get rid of nicnames, it causes an illegal quoting error
  candidates_txt.gsub!(/"\w*"\s/, '') 
  csv = CSV.new(candidates_txt, {:col_sep => ','})

  candidates = {}
  csv.each do |row|
    # to know where the magic numbers come from, look at the raw data, there are
    # pipes (|) everywhere
    candidate = {
      :id => row[2][1...-1],
      :name => row[3][1...-5],
      :party => row[4][1...-1]
    }
    candidates[candidate[:id]] = candidate
  end

  return candidates.values
end

def import_candidates
  candidates = convert_candidates
  candidates.each { |candidate| insert_record("candidate", candidate) }
end

def convert_individual_contributions
  file = File.open("open_secrets_data/indivs12.txt")

  file.each_line.with_index do |line, idx|
    begin
      row = CSV.parse_line(line)
      contributor_id = row[2][1...-1]
      name = row[4][1...-1] + ' ' + row[3][1..-1]
      candidate_id = row[5][1...-1]
      industry_id = row[8][1...-1]
      amount = row[10].to_i

      contributor = {
        :id => contributor_id,
        :name => name,
        :industry_id => industry_id
      }

      contribution = {
        :contributor_id => contributor_id,
        :candidate_id => candidate_id,
        :industry_id => industry_id,
        :amount => amount
      }

      yield contributor, contribution
    rescue
      puts "fuck"
      # fuckit
    end
  end
end

def import_individual_contributions
  convert_individual_contributions do |contributor, contribution|
    begin
      insert_record("contributor", contributor)
    rescue
      # Most of these are simply duplicate primary key exceptions, which is okay
      # here
    end

    begin
      insert_record("contribution", contribution)
    rescue Exception => e
      # TODO this is happening a lot because we are not taking into account
      # committes (who's id starts with "C")...
    end
  end
end

create_tables
import_industries
import_candidates
import_individual_contributions
