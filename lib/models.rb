require_relative './db.rb'

# TODO it would be nice to have an ORM like datamapper to help with more
# complicated / interesting queries. In the interest of time I'll be doing the
# bare minimum / copy paster right now.
module CostOfAVote
  class Base
    def self.db
      DB.client
    end
  end

  class Contribution < Base
    def self.links(contributor_ids, candidate_ids)
      sql = """SELECT *, SUM(amount) FROM contributions
        WHERE candidate_opensecrets_id IN (#{DB::ids_to_list(candidate_ids)})
        AND contributor_id IN (#{DB::ids_to_list(contributor_ids)})
        AND type IN ('24C', '24F', '24K', '24Z')
        GROUP BY contributor_id, candidate_opensecrets_id;"""

      contributions = db.query(sql).map do |h|
        {
          :source => h["contributor_id"],
          :target => h["candidate_opensecrets_id"],
          :value => h["SUM(amount)"]
        }
      end

      contributions
    end
  end

  class Vote < Base
    def self.links(candidate_ids, bill_ids)
      sql = """SELECT votes.bill_id, candidates.opensecrets_id, votes.status
        FROM candidates INNER JOIN votes
        ON candidates.govtrack_id = votes.govtrack_id
        WHERE candidates.opensecrets_id IN (#{DB::ids_to_list(candidate_ids)})
        AND votes.bill_id IN (#{DB::ids_to_list(bill_ids)});"""

      votes = db.query(sql).map do |h|
        {
          :source => h["opensecrets_id"],
          :target => h["bill_id"],
          :value => h["status"]
        }
      end

      votes
    end
  end

  class Candidate < Base
    # TODO this is using thomas_id as an indicator as they are a legislator when
    # we add in a legislators table, this will need to change
    def self.current_legislators
      sql = "SELECT * FROM candidates WHERE thomas_id IS NOT NULL;";
      db.query(sql, :as => :hash, :symbolize_keys => true)
    end
  end

end
