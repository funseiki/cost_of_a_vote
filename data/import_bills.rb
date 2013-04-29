require 'mysql'
require '../config.rb'
require 'nokogiri'
require 'yaml'
require 'json'

module CostOfAVote; end;

CLIENT = Mysql.connect(CostOfAVote::Config[:mysql][:hostname], CostOfAVote::Config[:mysql][:username], nil, CostOfAVote::Config[:mysql][:database])

# Note the contributions do not have foreign key constraint to industry
CostOfAVote::CreateTableSql = [
  # id is like hr1135
  """CREATE TABLE IF NOT EXISTS bills (
     id varchar(12) NOT NULL,
     official_title TEXT,
     short_title TEXT,
     PRIMARY KEY (id)
   ) ENGINE=InnoDB;""",

   """CREATE TABLE IF NOT EXISTS votes (
    bill_id varchar(12) NOT NULL,
    govtrack_id int,
    status varchar(1) NOT NULL,
    KEY (bill_id),
    KEY (govtrack_id),
    KEY (status)
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

def import_candidate_alternate_ids
  sql = "UPDATE candidates SET thomas_id=?, govtrack_id=? WHERE opensecrets_id=?;"
  stmnt = CLIENT.prepare(sql)

  Dir["./members_of_congress/*"].each do |filename|
    members = YAML.load_file(filename)
    members.each do |member|
      thomas_id = member["id"]["thomas"]
      govtrack_id = member["id"]["govtrack"]
      opensecrets_id = member["id"]["opensecrets"]

      stmnt.execute(thomas_id, govtrack_id, opensecrets_id)
    end
  end
end

def import_bills
  Dir["./bills/*"].each do |folder|
    next if folder.match(/placeholder/)

    (Dir["#{folder}/s/*/*"] + Dir["#{folder}/hr/*/*"]).each do |bill_path|
      bill = JSON.parse(File.open(bill_path).read)
      record = {:id => bill["bill_id"], :official_title => bill["official_title"], :short_title => bill["short_title"]}

      insert_record("bills", record)
    end
  end
end

def import_votes
  Dir["./votes/*"].each do |vote_path|
    file = File.open(vote_path)
    xml_doc = Nokogiri::XML(file.read)

    roll = xml_doc.xpath("//roll").first
    bill_id = get_bill_id(roll)

    voters = xml_doc.xpath("//voter")
    voters.each do |voter|
      record = {:bill_id => bill_id, :status => voter["vote"], :govtrack_id => voter["id"]}

      insert_record("votes", record)
    end
  end
end

def get_bill_id(roll)
  id = ""
  if roll["where"] == "house"
    id << "hr"
  else
    id << "s"
  end

  id << roll["roll"] << "-" << roll["session"]
end

create_tables
import_candidate_alternate_ids
import_bills
import_votes
