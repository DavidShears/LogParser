// Readline

const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');

// Add option to specify log type - if anything other than IIS assume original Joomla logic
var logtype = process.argv.slice(2);

if (logtype == 'IIS') {
		var rl = readline.createInterface({
			input: fs.createReadStream('IIS.log'),
			output: process.stdout,
			terminal: false
		});
} else {
		var rl = readline.createInterface({
			input: fs.createReadStream('error.php'),
			output: process.stdout,
			terminal: false
		});
}

var UniqueRecs = [];
var CountRecs = [];
var FirstDate = [];
var LastDate = [];

rl.on('line', (string) => {
	// First test - remove header records by testing for #)
	if (string.indexOf('#') !== 0) {
		// Extract date and time
		var datetime = string.substring(0,19);
		// Extract IP address
		if (logtype == 'IIS') {
			// Start of URL will be first instance of a forward slash
			// End of URL will be before the port number, normally 443/80
			// If URL is under a certain length then IIS appears to add a - before the port
			// So test for both scenarios
			var urlend = string.indexOf(' 443 ');
			if (urlend == -1) {
				var urlend = string.indexOf(' 80 ');
			}
			if (string.lastIndexOf(' - ',urlend) !== -1) {
				var urlend = string.indexOf(' - ');
			}
			var urlreq = string.substring(string.indexOf('/'),urlend);
			// Figure out where IP address is
			var IPStart = string.indexOf(' HTTP');
			var IPStart = string.lastIndexOf(' ',IPStart - 1);
			var IPAdd = string.substring(IPStart + 1,string.indexOf(' ',IPStart + 1));
			// Get HTTP status, currently achieved by looking for substatus
			// which seems to always return 0 - apart from where IIS introduces substatuses
			// https://docs.microsoft.com/en-GB/troubleshoot/iis/http-status-code
			if (string.indexOf(' 400 ') != -1) {
					var HTTPstat = '400';
			} else if (string.indexOf(' 401 ') != -1) {
					var HTTPstat = '401';
			} else if (string.indexOf(' 403 ') != -1) {
					var HTTPstat = '403';
			} else if (string.indexOf(' 404 ') != -1) {
					var HTTPstat = '404';
			} else if (string.indexOf(' 500 ') != -1) {
					var HTTPstat = '500';
			} else if (string.indexOf(' 502 ') != -1) {
					var HTTPstat = '502';
			} else if (string.indexOf(' 503 ') != -1) {
					var HTTPstat = '503';
			} else {
					var HTTPend = string.indexOf(' 0 ');
					var HTTPstat = string.substring(HTTPend - 3, HTTPend);	
			}
			// Build CurrentLine from the various elements we've picked up
			CurrentLine = (IPAdd + ' ' + urlreq + ' ' + HTTPstat);
		// else use Joomla logic
		} else {
			// Handle older version of Joomla logging
			if (string.indexOf('Joomla FAILURE') !== -1) {
				var IPAdd = string.substring(25,string.indexOf('	',25));
				// Add 46 characters to length - gets us to error message
				nextpos = IPAdd.length + 43;
			} else {
			// Starts in position 31, end at next tab character
				var IPAdd = string.substring(31,string.indexOf('	',31));
				// Add 46 characters to length - gets us to error message
				nextpos = IPAdd.length + 46;
			}
			CurrentLine = (IPAdd + ' ' + string.substring(nextpos));
		}
		// Test if record is already in array - if it is then increment counter and update last date
		// If it isn't then add to arrays and stamp first date
		if (UniqueRecs.includes(CurrentLine) && CurrentLine != ' ') {
			CountRecs[UniqueRecs.indexOf(CurrentLine)] = CountRecs[UniqueRecs.indexOf(CurrentLine)] + 1;
			// New test - although log normally in date/time order lets not assume that and only update
			// the date/time if we're happy it's more recent
			var DateLast = new Date(LastDate[UniqueRecs.indexOf(CurrentLine)]);
			var DateFirst = new Date(LastDate[UniqueRecs.indexOf(CurrentLine)]);
			var DateNew = new Date(datetime);
			if (DateNew > DateLast) {
				LastDate[UniqueRecs.indexOf(CurrentLine)] = datetime;
			} else if (DateNew < DateFirst) {
				FirstDate[UniqueRecs.indexOf(CurrentLine)] = datetime;
			}
		} else if (CurrentLine != ' ') {
			UniqueRecs.push(CurrentLine);
			CountRecs.push(1);
			FirstDate.push(datetime);
			LastDate.push(datetime);
		}
	}
})
.on('close', function() {
	// Set up workbook and worksheet
	var workbook = new Excel.Workbook();
	var worksheet = workbook.addWorksheet("Error Logging");
	// If in IIS mode then include column for HTTP status code
	if (logtype == 'IIS') {
		worksheet.columns = [
			{ header: "IP Address", key:"IPADD"},
			{ header: "Record", key:"RECORD"},
			{ header: "HTTP Status", key:"HTTPSTAT"},
			{ header: "Times Found", key:"COUNT"},
			{ header: "First Found", key:"FIRST"},
			{ header: "Last Found", key:"LAST"}
		]
	} else {
		worksheet.columns = [
			{ header: "IP Address", key:"IPADD"},
			{ header: "Record", key:"RECORD"},
			{ header: "Times Found", key:"COUNT"},
			{ header: "First Found", key:"FIRST"},
			{ header: "Last Found", key:"LAST"}
		];
	}
	worksheet.getRow(1).font = { name: "Calibri", size: 11, bold: true};
	// Loop array of unique records
	var counter = 0;
	UniqueRecs.forEach(function(element){
		// Again additional column for IIS records
		if (logtype == 'IIS') {
			worksheet.addRow({IPADD: element.substring(0,element.indexOf(' ')), 
				RECORD: element.substring(element.indexOf(' '),element.lastIndexOf(' ')), 
				HTTPSTAT: element.substring(element.lastIndexOf(' ')), COUNT: CountRecs[counter], 
				FIRST: FirstDate[counter], LAST: LastDate[counter]});
		} else {
			worksheet.addRow({IPADD: element.substring(0,element.indexOf(' ')), 
				RECORD: element.substring(element.indexOf(' ')), COUNT: CountRecs[counter], 
				FIRST: FirstDate[counter], LAST: LastDate[counter]});
		}
		counter++;
	})
	workbook.xlsx.writeFile("output.xlsx");
});