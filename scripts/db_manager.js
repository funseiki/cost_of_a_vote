var _ = require('underscore'),
    async = require('async'),
    mysql = require('mysql'),
    config = require('./config'),
    pool = mysql.createPool(config.mysql);

function insert_and_return_record(sql, record, callback) {
  pool.getConnection(function(err, connection) {
    connection.query(sql, record, function(err, result){
      if (err) callback(err);
      record.id = result.insertId;
      connection.end();
      callback(null, record);
    });
  });
}

module.exports = {
  /* create_tables only creates the tables if they do not exist
   */
  // TODO make the primary keys strings... thince they already have those as
  // uniques anyway!
  create_tables: function(callback) {
    var table_sqls = [
      "CREATE TABLE IF NOT EXISTS industry (\
        id varchar(5) NOT NULL,\
        name varchar(255) NOT NULL,\
        PRIMARY KEY (id)\
      ) ENGINE=InnoDB;",

      "CREATE TABLE IF NOT EXISTS contributor (\
        id varchar(12) NOT NULL,\
        industry_id varchar(5),\
        name varchar(255) NOT NULL,\
        PRIMARY KEY (id)\
      ) ENGINE=InnoDB;",

      "CREATE TABLE IF NOT EXISTS candidate (\
        id varchar(9) NOT NULL,\
        name varchar(255) NOT NULL,\
        party varchar(3),\
        PRIMARY KEY (id),\
        UNIQUE KEY cid_index (cid)\
      ) ENGINE=InnoDB AUTO_INCREMENT=1;",

      "CREATE TABLE IF NOT EXISTS contribution (\
        candidate_id varchar(9),\
        contributor_id varchar(12),\
        industry_id varchar(5),\
        amount int unsigned,\
        FOREIGN KEY (candidate_id) REFERENCES candidate(id),\
        FOREIGN KEY (contributor_id) REFERENCES contributor(id),\
        FOREIGN KEY (industry_id) REFERENCES industry(id)\
      ) ENGINE=InnoDB;"
    ];

    async.eachSeries(table_sqls, function(sql, callback) {
      pool.getConnection(function(err, connection) {
        connection.query(sql, function(err) {
          connection.end();
          callback();
        });
      });
    }, callback);
  },

  /* Inserts a candidate
   * callback is caleld with  the candidate object with the id set
   */
  insert_candidate: function(candidate, callback) {
    insert_and_return_record("INSERT INTO candidate SET ?", candidate, callback);
  },

  // TODO return the industry with id set
  insert_industry: function(industry, callback) {
    insert_and_return_record("INSERT INTO industry SET ?", industry, callback);
  },

  // TODO return the organization with id set
  insert_organization: function(organization, callback) {
    insert_and_return_record("INSERT INTO organization SET ?", organization, callback);
  },

  /* insert_contribution expects a contribution object which consists of the
   * candidate_id, the industry_id or organization_id, and the total amount
   * (with individual and pacs amounts optional)
   */
  insert_contribution: function(contribution, callback) {
    pool.getConnection(function(err, connection) {
      connection.query("INSERT INTO contribution SET ?", contribution, callback);
      connection.end();
    });
  }
}
