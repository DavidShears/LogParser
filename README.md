# LogParser
Parsing error.php from Joomla (tested on 3.10.6, should also read logs back to 2.5.28) - Read all records and output a spreadsheet with all unique combinations of user/error along with count and last/first date it happened.

Reads all records into a set of arrays, one for each data point, and then goes through array to dump each element as a row in the spreadsheet.

Notes array exists to allow classification of IP addresses as:

* Internal - self descriptive
* Blocked - self descriptive
* Suspicious - Used for watching IPs that have not been blocked yet, but may need to be
* Bots - Can be recorded as exact IP, or with the last element wildcarded. Optional function (checkbot) exists to scan for known useragent strings and flag accordingly.

Also has the option to pass in 'IIS' to instead parse IIS logs (tested on IIS 8.5 and 10.0) and a webapp version to give a basic GUI frontend.

Tested on 142mb IIS file for detailed output with approx runtime of 12 minutes.

## Requirements
ExcelJS is used to generate spreadsheet output in both command line and webapp modes.
Yargs is used in the command line application to handle the various arguments that can be passed in.

Optional dependencies exist for the webapp version of the script:
* Expressjs/ejs - to handle the general process
* socket.io - used to pass progress from the server to the client (useful on larger files)
* nodemailer - used to allow email of spreadsheet once extract is complete
* express-fileupload - used to handle upload of new Joomla/IIS log for processing

Additionally node-fetch (V2) should be installed for the ipcheck.js script to run successfully.

## Running

### Command Line

node app.js - trigger original Joomla logic

The following arguments can be passed in as well:
* --log=IIS will trigger IIS logic instead of Joomla
* --mode=(summstat/summurl/summip) summarise by either IP & HTTP Status, IP & url requested, or just IP. Only applicable when --log=IIS

If not passed then detailed output including IP/Status/Url will be provided.

* --bot=(agent/ip/exclude/excludesus/only) only test for botagent, only test for botip, exclude bots based on agent, exclude bots based on agent or IP, or only output bot records

If not passed then both agent & ip will be used to identify bots

* --internal=(Y/N/O) specifies whether IP addresses flagged as Internal should be included/excluded, or the only records

If not passed then defaults to Y

* --blocked=(Y/N/O) specifies whether IP addresses flagged as Blocked should be included/excluded, or the only records

If not passed then defaults to Y

* --noimages / --nojs / --nocss used to exclude the referenced file type, can be mixed & matched

If not passed then the referenced file type is included

* --notemp used to exclude any files in a folder /cache/

If not passed then the files are included

* --extensions=(comma list, without dot) - excludes the extensions specified, for example --extensions=pdf,txt would exclude those files

If not passed then the files are included

* --highlight=Y Sets the URL field to orange if it includes a substring defined in suspecturls.js , only valid in IIS log mode.

If not passed then defaults to N

An example call using all the above would be:
node app.js --log=IIS --mode=summurl --bot=exclude --internal=N --blocked=N --noimages --nojs --nocss --notemp --extensions=pdf,txt --highlight=Y

### Browser Interface

node webapp.js - runs a localhost http server on port 3007 as a front-end rather than using the commandline arguments above. Also allows email of spreadsheet once processing complete, as well as uploading new version of the log file.

### Misc Scripts

node "misc scripts"\pruner.js - to run a quick script aimed at identifying any botagents not already registered in bots.js (IIS only) accepts optional --noblocked and --nointernal arguments to exclude based on checkip results.

node "misc scripts"\stringdump.js --log=(iis/joomla) --match=(ipaddress) - quickly spit out all records, as they are, into a spreadsheet. Previously named ipdump.js but now usable to match any type of substring.

node "misc scripts"\ipcheck.js --log=(iis/joomla) - reads log to build list of unique IPs and submits each one to AbuseIPDB, returns score/number of reports/number of reporters/last report date

**Important Note** - You'll need to register an account on AbuseIPDB and request an API key that is then put into line 92 of the script file.

node "misc scripts"\ipreport.js --ip=(ip address) --cats=(comma seperated list of category numbers) --comment=("this is the text of the report") - accepts parameters to submit a report to AbuseIPDB, returns success/error to console.

**Important Note** - You'll need to register an account on AbuseIPDB and request an API key that is then put into line 20 of the script file.

node "misc scripts"\crawlerLS.js - to run a script aimed at identifying the first and last time each botagent was seen (IIS only)

node "misc scripts"\modsecurity.js - script to run over audit log file from ModSecurity for IIS as used in Plesk control panel (tested on v2.9.2)

## To-do:
1. Implement system for multi-user environment. Need to handle multiple log files and multiple output files, primarily for web browser mode.
2. Amend ipreport.js to accept an input file (csv?) to handle reporting in bulk
