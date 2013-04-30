require 'mysql2'
require_relative '../config.rb'

module CostOfAVote
  class DB
    def self.client
      Mysql2::Client.new(:host => CostOfAVote::Config[:mysql][:hostname],
                         :username => CostOfAVote::Config[:mysql][:username],
                         :password => CostOfAVote::Config[:mysql][:password],
                         :database => CostOfAVote::Config[:mysql][:database])
    end

    def self.ids_to_list(ids)
      ids.map{|i| "'#{i}'"}.join(',')
    end
  end
end
