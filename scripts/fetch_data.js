var mysql = require('mysql'),
    config = require('./config'),
    db_manager = require('./db_manager');

db_manager.open(function(err) {
  console.log(err);
  db_manager.create_tables(function(err) {
    console.log('in create callback');
    console.log(err);
    db_manager.close(console.log);
  });
});

