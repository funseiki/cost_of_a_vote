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
  create_tables: function(callback) {
    var table_sqls = [
      "CREATE TABLE IF NOT EXISTS industry (\
        id int(11) NOT NULL AUTO_INCREMENT,\
        name varchar(255) NOT NULL,\
        PRIMARY KEY (id)\
      ) ENGINE=InnoDB AUTO_INCREMENT=1;",

      "CREATE TABLE IF NOT EXISTS organization (\
        id int(11) NOT NULL AUTO_INCREMENT,\
        name varchar(255) NOT NULL,\
        PRIMARY KEY (id)\
      ) ENGINE=InnoDB AUTO_INCREMENT=1;",

      "CREATE TABLE IF NOT EXISTS candidate (\
        id int(11) NOT NULL AUTO_INCREMENT,\
        cid varchar(12) NOT NULL,\
        first_name varchar(255),\
        last_name varchar(255),\
        party varchar(3),\
        dist_id_run_for varchar(255),\
        fec_cand_id varchar(255),\
        PRIMARY KEY (id),\
        UNIQUE KEY cid_index (cid)\
      ) ENGINE=InnoDB AUTO_INCREMENT=1;",

      "CREATE TABLE IF NOT EXISTS contribution (\
        candidate_id int(11),\
        industry_id int(11),\
        organization_id int(11),\
        individual int unsigned,\
        pacs int unsigned,\
        total int unsigned,\
        FOREIGN KEY (candidate_id) REFERENCES candidate(id),\
        FOREIGN KEY (industry_id) REFERENCES industry(id),\
        FOREIGN KEY (organization_id) REFERENCES organization(id)\
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
