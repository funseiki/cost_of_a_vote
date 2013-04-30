require 'sinatra'
require 'json'
require './lib/models.rb'

get '/data/:filename' do
  content_type 'application/json'
  begin
    File.read(File.join('public', 'example_data', params[:filename]))
  rescue
    nil
  end
end

get '/contributions' do
  content_type 'application/json'
  contributor_ids = params[:contributor_ids] || []
  candidate_ids = params[:candidate_ids] || []

  if (contributor_ids.empty? || candidate_ids.empty?)
    [].to_json
  else
    contributions =
      CostOfAVote::Contribution.links(contributor_ids, candidate_ids)
    contributions.to_json
  end
end

get '/votes' do
  content_type 'application/json'
  candidate_ids = params[:candidate_ids] || []
  bill_ids = params[:bill_ids] || []


  if (candidate_ids.empty? || bill_ids.empty?)
    [].to_json
  else
    votes = CostOfAVote::Vote.links(candidate_ids, bill_ids)
    votes.to_json
  end
end
