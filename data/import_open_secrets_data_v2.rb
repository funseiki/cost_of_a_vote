require 'csv'
require 'mysql'
require './config.rb'

module CostOfAVote; end;

FILEPATH = File.expand_path(File.dirname(__FILE__))

CLIENT = Mysql.connect(CostOfAVote::Config[:mysql][:hostname], CostOfAVote::Config[:mysql][:username], nil, CostOfAVote::Config[:mysql][:database])

# Note the contributions do not have foreign key constraint to industry
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
    KEY (industry_id)
  ) ENGINE=InnoDB;""",

  # This table is temporary for individual contributions, the contributors from
  # it will be loaded into contributor, and the contributions into contribution
  """CREATE TABLE IF NOT EXISTS individual_contributions (
    contributor_id varchar(12),
    contributor_name varchar(255),
    candidate_id varchar(9),
    industry_id varchar(5),
    amount int unsigned
  ) ENGINE=InnoDB;"""
]
CostOfAVote::LoadDataSql = [
  # Load PACs into the contributor table
  """LOAD DATA INFILE '#{FILEPATH}/open_secrets_data/cmtes12.txt' INTO TABLE contributor
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '|' LINES TERMINATED BY '\n'
  (@dummy, id, name, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, industry_id,
  @dummy, @dummy, @dummy, @dummy);""",

  # Load individual contributions into the individual_contributions table
  """LOAD DATA INFILE '#{FILEPATH}/open_secrets_data/indivs12.txt' INTO TABLE individual_contributions
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '|' LINES TERMINATED BY '\n'
  (@dummy, @dummy, contributor_id, contributor_name, candidate_id, @dummy,
  @dummy, industry_id, @dummy, amount, @dummy, @dummy, @dummy, @dummy, @dummy,
  @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy);
  """

  # Load individual contributions into the individual_contributions table

]

def create_tables
  CostOfAVote::CreateTableSql.each { |sql| CLIENT.query(sql) }
end

def import_contributions
  CostOfAVote::LoadDataSql.each { |sql| CLIENT.query(sql) }
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

create_tables
import_industries
import_candidates
import_contributions
