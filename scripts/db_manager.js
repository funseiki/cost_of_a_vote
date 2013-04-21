var async = require('async'),
    mysql = require('mysql'),
    config = require('./config'),
    connection = null;

module.exports = {
  open: function(callback) {
    connection = mysql.createConnection(config.mysql);
    connection.connect(callback);
  },

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
      connection.query(sql, callback);
    }, callback);
  },

  insert_candidate: function(candidate, callback) {
  },

  close: function(callback) {
    connection.end(callback);
  }
}
