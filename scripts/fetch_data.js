var async = require('async'),
    mysql = require('mysql'),
    Client = require('node-rest-client').Client,
    fs = require('fs'),
    config = require('./config'),
    db_manager = require('./db_manager'),
    candidates = require("../data/candidates.json"),

    client = new Client(),
    organization_contributions = [],
    industry_contributions = [],
    organization_lookup = {},
    industry_lookup = {};

function populate_contributions(candidate, callback) {
  var base_url = 'http://www.opensecrets.org/api/?cycle=2012&output=json&cid=' + candidate.cid + '&apikey=' + config.open_secrets_key,
      contributions_url = base_url + '&method=candContrib',
      industry_url = base_url + '&method=candIndustry';

  client.get(contributions_url, function(data, response) {
    console.log(data);
  });

  client.get(industry_url, function(data, response) {
    console.log(data);
  });
}


async.series([
  db_manager.open,
  //db_manager.create_tables,

  //function(callback) {
    //async.map(candidates, db_manager.insert_candidate, function(err, results) {
      //candidates = results;
      //callback();
    //});
  //},

  /* Populate the organization and industry contributions
   */
  function(callback) {
    populate_contributions({cid: 'N00007360'});
    //async.each(candidates, populate_contributions,  callback);
  },

  db_manager.close
], function(err, results) { console.log(err);});
