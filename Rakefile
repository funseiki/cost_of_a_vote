require 'json'
require_relative './lib/models.rb'

namespace :static do
  task :ensure_destination_directory do
    FileUtils.mkdir_p(File.join('public', 'data'))
  end

  task :legislators_autocomplete => [:ensure_destination_directory] do
    generate_node_autocomplete('legislators_autocomplete.json',
                               CostOfAVote::Candidate.current_legislators,
                               :name, :opensecrets_id)
  end

  task :legislators => [:ensure_destination_directory] do
    generate_node_json('legislators.json',
                       CostOfAVote::Candidate.current_legislators,
                       :opensecrets_id)
  end

  task :contributors_autocomplete => [:ensure_destination_directory] do
    contributors =
      CostOfAVote::Contributor.top_contributors_for_legislators(50000)
    generate_node_autocomplete(
      'contributors_autocomplete.json', contributors, :name, :id)
  end

  # generates a static json file for the top 50,000 contributors
  task :contributors => [:ensure_destination_directory] do
    contributors =
      CostOfAVote::Contributor.top_contributors_for_legislators(50000)
    generate_node_json('contributors.json', contributors, :id)
  end

  task :bills_autocomplete => [:ensure_destination_directory] do
    generate_node_autocomplete(
      'bills_autocomplete.json', CostOfAVote::Bill.all, :official_title, :id)
  end

  task :bills => [:ensure_destination_directory] do
    generate_node_json('bills.json', CostOfAVote::Bill.all, :id)
  end

  task :all =>  [:legislators_autocomplete, :legislators,
    :contributors_autocomplete, :contributors,
    :bills_autocomplete, :bills]

end

# generates a static json file with node information for the sankey plugin
# Format is {id => {item attributes}}
def generate_node_json(filename, items, id_key)
    items_lookup = {}
    items.each do |item|
      items_lookup[item[id_key]] = item
    end

    path = File.join('public', 'data', filename)
    f = File.open(path, 'w+')
    JSON.dump(items_lookup, f)
end

def generate_node_autocomplete(filename, items, label_id, value_id)
  autocomplete_data = items.map do |item|
    {:label => item[label_id],
     :value => item[value_id]}
  end

  path = File.join('public', 'data', filename)
  f = File.open(path, 'w+')
  JSON.dump(autocomplete_data, f)
end
