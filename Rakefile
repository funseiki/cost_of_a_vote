require 'json'
require_relative './lib/models.rb'

namespace :static do
  task :ensure_destination_directory do
    FileUtils.mkdir_p(File.join('public', 'data'))
  end

  task :legislator_autocomplete => [:ensure_destination_directory] do
    legislators = CostOfAVote::Candidate.current_legislators.map do |legislator|
      {:label => legislator[:name],
       :value => legislator[:opensecrets_id]}
    end

    path = File.join('public', 'data', 'legislator_autocomplete.json')
    f = File.open(path, 'w+')
    JSON.dump(legislators, f)
  end

  # generates a static json file with all the current legislators for use on the
  # sankey plugin. Format is [{opensecrets_id => {leglislator attributes}}]
  task :legislators => [:ensure_destination_directory] do
    legislators = {}
    CostOfAVote::Candidate.current_legislators.each do |legislator|
      legislators[legislator[:opensecrets_id]] = legislator
    end

    path = File.join('public', 'data', 'legislators.json')
    f = File.open(path, 'w+')
    JSON.dump(legislators, f)
  end

end
