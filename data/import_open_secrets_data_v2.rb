require 'csv'
require 'mysql'
require '../config.rb'

module CostOfAVote; end;

FILEPATH = File.expand_path(File.dirname(__FILE__))

CLIENT = Mysql.connect(CostOfAVote::Config[:mysql][:hostname], CostOfAVote::Config[:mysql][:username], nil, CostOfAVote::Config[:mysql][:database])

# Note the contributions do not have foreign key constraint to industry
CostOfAVote::CreateTableSql = [
  """CREATE TABLE IF NOT EXISTS industries (
     id varchar(5) NOT NULL,
     name varchar(255) NOT NULL,
     PRIMARY KEY (id)
   ) ENGINE=InnoDB;""",

   """CREATE TABLE IF NOT EXISTS contributors (
    id varchar(12) NOT NULL,
    industry_id varchar(5),
    name varchar(255) NOT NULL,
    PRIMARY KEY (id),
    KEY (industry_id)
  ) ENGINE=InnoDB;""",

  """CREATE TABLE IF NOT EXISTS candidates (
    opensecrets_id varchar(9) NOT NULL,
    thomas_id int,
    govtrack_id int,
    name varchar(255) NOT NULL,
    party varchar(3),
    PRIMARY KEY (opensecrets_id),
    KEY(thomas_id),
    KEY(govtrack_id),
    KEY(party)
  ) ENGINE=InnoDB AUTO_INCREMENT=1;""",

  """CREATE TABLE IF NOT EXISTS contributions (
    cycle smallint unsigned,
    candidate_opensecrets_id varchar(9),
    contributor_id varchar(12),
    industry_id varchar(5),
    amount int,
    type varchar(3),
    KEY (candidate_opensecrets_id),
    KEY (contributor_id),
    KEY (industry_id)
  ) ENGINE=InnoDB;""",

  # This table is temporary for individual contributions, the contributors from
  # it will be loaded into contributor, and the contributions into contribution
  """CREATE TABLE IF NOT EXISTS individual_contributions (
    cycle smallint unsigned NOT NULL,
    individual_id varchar(12),
    individual_name varchar(255),
    candidate_opensecrets_id varchar(9),
    industry_id varchar(5),
    amount int
  ) ENGINE=InnoDB;""",

  """CREATE TABLE IF NOT EXISTS pac_contributions (
    cycle smallint unsigned NOT NULL,
    pac_id varchar(12) NOT NULL,
    candidate_opensecrets_id varchar(9) NOT NULL,
    amount int,
    industry_id varchar(5),
    type varchar(3)
  ) ENGINE=InnoDB;"""
]
CostOfAVote::LoadDataSql = [
  # Load Candidates into the candidate table
  """LOAD DATA INFILE '#{FILEPATH}/open_secrets_data/cands12.txt' REPLACE INTO TABLE candidates
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '|' LINES TERMINATED BY '\r\n'
  (@dummy, @dummy, opensecrets_id, name, party, @dummy, @dummy, @dummy, @dummy, @dummy,
  @dummy, @dummy);""",

  # Load PACs into the contributor table
  """LOAD DATA INFILE '#{FILEPATH}/open_secrets_data/cmtes12.txt' INTO TABLE contributors
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '|' LINES TERMINATED BY '\r\n'
  (@dummy, id, name, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, industry_id,
  @dummy, @dummy, @dummy, @dummy);""",

  # Load PAC contributions into the pac_contributions table
  """LOAD DATA INFILE '#{FILEPATH}/open_secrets_data/pacs12.txt' INTO TABLE pac_contributions
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '|' LINES TERMINATED BY '\r\n'
  (cycle, @dummy, pac_id, candidate_opensecrets_id, amount, @dummy, industry_id, type, @dummy, @dummy);""",

  # Load pac_contributions into the contributions table
  """INSERT INTO contributions (cycle, candidate_opensecrets_id, contributor_id, industry_id, amount, type)
  SELECT cycle, candidate_opensecrets_id, pac_id, industry_id, amount, type
  FROM pac_contributions;"""

  # Load individual contributions into the individual_contributions table
  """LOAD DATA INFILE '#{FILEPATH}/open_secrets_data/indivs12.txt' INTO TABLE individual_contributions
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '|' LINES TERMINATED BY '\r\n'
  (cycle, @dummy, individual_id, individual_name, candidate_opensecrets_id, @dummy,
  @dummy, industry_id, @dummy, amount, @dummy, @dummy, @dummy, @dummy, @dummy,
  @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy);""",

  # For every contribution direct to candidate, add that to the contributions
  # table
  """REPLACE INTO contributors (id, industry_id, name)
  SELECT individual_id, industry_id, individual_name
  FROM individual_contributions WHERE candidate_opensecrets_id LIKE 'N%';""",

  # 24K is a direct contribution
  """INSERT INTO contributions (cycle, candidate_opensecrets_id, contributor_id, industry_id, amount, type)
  SELECT cycle, candidate_opensecrets_id, individual_id, industry_id, amount, '24K'
  FROM individual_contributions WHERE candidate_opensecrets_id LIKE 'N%';"""
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
  industries.each { |industry| insert_record("industries", industry) }
end

create_tables
import_industries
import_contributions
