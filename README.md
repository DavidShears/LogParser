# LogParser
Parsing error.php from Joomla (tested on 3.9.2x, should also read logs back to 2.5.28) - Read all records and output a spreadsheet with all unique combinations of user/error along with count and last/first date it happened.

Reads all records into a set of arrays, one for each data point, and then goes through array to dump each element as a row in the spreadsheet.

Notes array exists to allow classification of IP addresses as:

* Internal - self descriptive
* Blocked - self descriptive
* Suspicious - Used for watching IPs that have not been blocked yet, but may need to be
* Bots - Can be recorded as exact IP, or with the last element wildcarded. Optional function (checkbot) exists to scan for known useragent strings and flag accordingly.

Also has the option to pass in 'IIS' to instead parse IIS logs (tested on IIS 8.5) and a webapp version to give a basic GUI frontend.

Tested on 142mb IIS file for detailed output with approx runtime of 12 minutes.

## Requirements
ExcelJS is used to generate spreadsheet output and is the only "required" dependency.

Optional dependencies exist for the webapp version of the script:
* Expressjs/ejs - to handle the general process
* socket.io - used to pass progress from the server to the client (useful on larger files)
* nodemailer - used to allow email of spreadsheet once extract is complete

## Running

node app.js (or any parm not listed) - trigger original Joomla logic

node app.js IIS - to trigger new logic and get detailed results

node app.js IIS summstat - summarise by IP & HTTP status (exclude url request)

node app.js IIS summurl - summarise by IP & url request (exclude HTTP status)

node app.js IIS summip - summarise by IP (exclude HTTP status & url request)

node app.js IIS (summstat/summurl/summip if required) agent - only use checkbot, not checkip to report on bots

node app.js IIS (summstat/summurl/summip if required) ip - only use checkip, not checkbot to report on bots

### Misc Scripts

node "misc scripts"\pruner.js - to run a quick script aimed at identifying any botagents not already registered in bots.js (IIS only)

### Browser Interface

node webapp.js - runs a localhost http server on port 3007 as a front-end rather than using the commandline arguments above

## To-do:
1. ~~Combine both sets in the output to give record & count side-by-side~~ Handled by ExcelJS (although could be neater inline processing.)
2. ~~Currently capturing date & time, add "last date/time" to the output.~~ Extra logic added for first & last date found
3. ~~Output somewhere other than console (either CSV file or email.)~~ Handled by ExcelJS
4. ~~Optimize runtime, additional logic to handle non-date ordered logs and 404/403 exceptions appears to have raised the processing time.~~ Amending date handling took approx. 25% off runtime.
5. ~~Find a unique identifier to avoid list of if statements for HTTP status (perhaps pass in the URL of the website as another parameter?)~~ Replace hardcoded list of HTTP status exceptions with regex statement
6. ~~Amend checkip function to wildcard match, allow 123.123.123.x rather than having to list out each IP in the subnet.~~ Added draft wildcard logic for botIP matches
7. ~~Identify suitable method to extract useragent so lookup against array possible rather than list of "if" statements in checkbot function.~~ Replaced with while loop over array.
8. ~~Add browser interface to avoid need to specify arguments in commandline interface~~ webapp.js and associated ejs view created.
