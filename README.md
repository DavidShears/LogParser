# LogParser
Parsing error.php from Joomla (tested on 3.9.2x) - Read all records and output an array of unique combinations based on IP Address & error message. Second array holds the number of times a particular combination has appeared.

Also has the option to pass in 'IIS' to instead parse IIS logs (tested on IIS 8.5)

node app.js IIS - to trigger new logic
node app.js (or any parm after) - to trigger original Joomla logic

## To-do:
1. ~~Combine both sets in the output to give record & count side-by-side~~ Handled by ExcelJS (although could be neater inline processing.)
2. ~~Currently capturing date & time, add "last date/time" to the output.~~ Extra logic added for first & last date found
3. ~~Output somewhere other than console (either CSV file or email.)~~ Handled by ExcelJS
