require 'csv'
require 'json'

candidates_txt = File.open("candidates.txt").read
csv = CSV.new(candidates_txt, {:col_sep => ' '})

candidates = [];
csv.each_with_index do |row, i|
  next if i == 0
  row[1] = row[1].chomp(',')
  row.pop
  candidates << row
end

json_file = File.open("candidates.json", "w")
json_file.write(JSON.dump(candidates))
