General notes taken out of the readme file once completed. Nearest you'll find to a changelog currently.

* Combine both sets in the output to give record & count side-by-side
  * Handled by ExcelJS (although could be neater inline processing.)
* Currently capturing date & time, add "last date/time" to the output.
  * Extra logic added for first & last date found
* Output somewhere other than console (either CSV file or email.)
  * Handled by ExcelJS
* Optimize runtime, additional logic to handle non-date ordered logs and 404/403 exceptions appears to have raised the processing time.
  * Amending date handling took approx. 25% off runtime.
* Find a unique identifier to avoid list of if statements for HTTP status (perhaps pass in the URL of the website as another parameter?)
  * Replace hardcoded list of HTTP status exceptions with regex statement
* Amend checkip function to wildcard match, allow 123.123.123.x rather than having to list out each IP in the subnet.
  * Added draft wildcard logic for botIP matches
* Identify suitable method to extract useragent so lookup against array possible rather than list of "if" statements in checkbot function.
  * Replaced with while loop over array.
* Add browser interface to avoid need to specify arguments in commandline interface
  * webapp.js and associated ejs view created.
* Add option to upload log to webapp & option to download from browser as well as / instead of email.
  * Basic upload & download logic added
* Add exclude Internal/Blocked logic from webapp back into commandline app
  * yargs implemented to allow various combinations of arguments.
* Test for workbook lock earlier in the process, avoid running the whole script and then losing the output at the end.
  * Logic added to both commandline and webapp to handle.
* colour code notes field for 'botblocked'
  * Code added