# LogParser
Parsing error.php from Joomla (tested on 3.9.2x, should also read logs back to 2.5.28) - Read all records and output a spreadsheet with all unique combinations of user/error along with count and last/first date it happened.

Reads all records into a set of 4 arrays, one for each data point, and then goes through array to dump each element as a row in the spreadsheet.

Also has the option to pass in 'IIS' to instead parse IIS logs (tested on IIS 8.5)

Tested on 134mb IIS file with approx. 10 minute runtime.


## Running
node app.js IIS - to trigger new logic and get detailed results

node app.js IIS summstat - summarise by IP & HTTP status (exclude url request)

node app.js IIS summurl - summarise by IP & url request (exclude HTTP status)

node app.js IIS summip - summarise by IP (exclude HTTP status & url request)

node app.js (or any parm after) - to trigger original Joomla logic

## Requirements
ExcelJS is used to generate spreadsheet output.

## To-do:
1. ~~Combine both sets in the output to give record & count side-by-side~~ Handled by ExcelJS (although could be neater inline processing.)
2. ~~Currently capturing date & time, add "last date/time" to the output.~~ Extra logic added for first & last date found
3. ~~Output somewhere other than console (either CSV file or email.)~~ Handled by ExcelJS
4. ~~Optimize runtime, additional logic to handle non-date ordered logs and 404/403 exceptions appears to have raised the processing time.~~ Amending date handling took approx. 25% off runtime.
5. ~~Find a unique identifier to avoid list of if statements for HTTP status (perhaps pass in the URL of the website as another parameter?)~~ Replace hardcoded list of HTTP status exceptions with regex statement
