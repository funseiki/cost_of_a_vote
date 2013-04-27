You will need to get data from a variety of sources...

1) Campaign financial data goes in the `open_secrets_data` directory
  You will need to create and login to a opensecrets account:
  http://www.opensecrets.org/myos/signup.php

  Then download a "Campaign Finance Data" from: http://www.opensecrets.org/myos/bulk.php
  (note we are setup for 2012 cycle data and later) 
  (if you're curious about the files data dictionaries are available at:
   http://www.opensecrets.org/resources/create/data_doc.php)

  Unzip the finance data into `open_secrets_data`


2) After creating the MySQL database (specify in the config.rb file at root
  level) you can run `ruby import_open_secrets_data_v2.rb`


3) Then download the bills from: https://github.com/unitedstates/congress/wiki
  Unzip them into the `bills` folder and rename it such that from this directory
  it looks like: 

  bills/113/hconres
  bills/113/hjres
  bills/113/hr
  bills/113/hres
  bills/113/s
  bills/113/sconres
  bills/113/sjres
  bills/113/sres


4) Get votes data from govtrack: http://www.govtrack.us/developers/data
  You want it in the `votes` directory, essentially:
  `mkdir votes`
  `cd votes`
  `rsync -avz --delete --delete-excluded govtrack.us::govtrackdata/us/113/rolls/ .`

  where the 113 is the cycle of congress you want voting info for.


5) Get members of congress from here: https://github.com/unitedstates/congress-legislators
   Drop the legislators-current.yaml and legislators-historical.yaml (optional)
   into ths `members_of_congress` folder.


6) run `import_bills.rb`
