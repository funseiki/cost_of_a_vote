var _ = require('underscore'),
    async = require('async'),
    mysql = require('mysql'),
    restler = require('restler'),
    fs = require('fs'),
    config = require('./config'),
    db_manager = require('./db_manager'),
    candidates = require("../data/candidates.json"),

    organization_contributions = [],
    industry_contributions = [],
    organization_lookup = {},
    industry_lookup = {};

function error_handler(error) {
  console.log(error);
  throw error;
}

// Warning: this function is pretty ugly
function populate_contributions(candidate, callback) {
  var base_url = 'http://www.opensecrets.org/api/?cycle=2012&output=json&cid=' + candidate.cid + '&apikey=' + config.open_secrets_key,
      organization_contributions_url = base_url + '&method=candContrib',
      industry_url = base_url + '&method=candIndustry';

  // TODO for some candidates there will be no data (like tim) handle
  // that case!!
  // TODO you might not really need this parallel call here... KISS!
  async.parallel([
    function(callback) {
      restler.get(organization_contributions_url, {'parser': restler.parsers.json}).on('success', function(data) {
        var organizations = data['response']['contributors']['contributor'];

        async.each(organizations, function(organization, callback) {
          var org_name = organization["@attributes"]["org_name"],
              total = organization["@attributes"]["total"];

          organization_lookup[org_name] = {name: org_name}
          // org_name will be replaced by the organization id after
          // organizations are inserted into the db
          organization_contributions.push({name: org_name, candidate_id: candidate.id, total: total});

          callback();
        }, callback);
      }).on('error', error_handler);
    },

  function(callback) {
    restler.get(industry_url, {'parser': restler.parsers.json}).on('success', function(data) {
      var industries = data['response']['industries']['industry'];

      async.each(industries, function(industry, callback) {
        var industry_name = industry['@attributes']['industry_name'],
            individual = industry['@attributes']['indivs'],
            pacs = industry['@attributes']['pacs'],
            total = industry['@attributes']['total'];

        industry_lookup[industry_name] = {name: industry_name};
        industry_contributions.push({name: industry_name, candidate_id: candidate.id, individual: individual, pacs: pacs, total: total});

        callback();
      }, callback);
    }).on('error', error_handler);
  }], callback);
}


async.series([
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
    //TODO ERROR HANDLING FOR POPULATE CONTRIBUTIONS... BIOTCH!
    populate_contributions({id: 1, cid: 'N00007360'}, callback);
    //async.each(candidates, populate_contributions,  callback);
  },

  /* insert organizations and industries into the db and update our lookups
   */
  function(callback) {
    async.parallel([
      function(callback) {
        async.each(_(organization_lookup).values(), function(organization, callback) {
          db_manager.insert_organization(organization, function(err, organization) {
            if (err) callback(err);

            organization_lookup[organization.name] = organization;
            callback();
          });
        }, callback);
      },

      function(callback) {
        async.each(_(industry_lookup).values(), function(industry, callback) {
          db_manager.insert_industry(industry, function(err, industry) {
            if (err) callback(err);

            industry_lookup[industry.name] = industry;
            callback();
          });
        }, callback);
      }
    ], callback);
  },

  /* finally insert the contributions!
   */
  function(callback) {
    async.each(industry_contributions, function(contribution, callback) {
      contribution.industry_id = industry_lookup[contribution.name].id;
      delete contribution['name'];

      db_manager.insert_contribution(contribution);
      callback();
    });

    async.each(organization_contributions, function(contribution, callback) {
      contribution.organization_id = organization_lookup[contribution.name].id;
      delete contribution['name'];

      db_manager.insert_contribution(contribution);
      callback();
    }, callback);
  }

], function(err, results) { console.log(err);});
