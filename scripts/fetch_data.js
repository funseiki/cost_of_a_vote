var async = require('async'),
    mysql = require('mysql'),
    fs = require('fs'),
    config = require('./config'),
    db_manager = require('./db_manager'),
    candidates = require("../data/candidates.json");


async.series([
  db_manager.open,
  db_manager.create_tables,

  function(callback) {
    async.each(candidates, db_manager.insert_candidate, callback);
  },

  db_manager.close
], function(err, results) { console.log(err);});
