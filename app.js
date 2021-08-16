// Readline

const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');

// Add option to specify log type - if anything other than IIS assume original Joomla logic

var args = process.argv;

if (args[2] != null) {
	var logtype = args[2].toUpperCase();
}
if (args[3] != null) {
	var modetype = args[3].toLowerCase();
}

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

// Arrays for holding IPs flagged as internal/suspect/blocked
// Will be used to build notes column
var InternalIPs = [];
var SuspectIPs = [];
var badIPs = [];

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
			// Get HTTP status using Regex to find 3 digits followed by a series of 
			// 5 spaces seperated by any number of digits
			// 200 0 0 15669 344 546
			var HTTPstart = string.search(/\d{3}(?=( (\d*)){5})/g);
			var HTTPstat = string.substring(HTTPstart,HTTPstart + 3);
			// Build CurrentLine from the various elements we've picked up
			// If a mode has been specified, use that
			switch (modetype) {
				case 'summstat':
					CurrentLine = (IPAdd + ' ' + HTTPstat);
					break;
				case 'summurl':
					CurrentLine = (IPAdd + ' ' + urlreq);
					break;
				case 'summip':
					CurrentLine = (IPAdd);
					break;
				default:
					CurrentLine = (IPAdd + ' ' + urlreq + ' ' + HTTPstat);
					break;
			}
			//CurrentLine = (IPAdd + ' ' + urlreq + ' ' + HTTPstat);
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
		var DateNew = new Date(datetime);
		if (UniqueRecs.includes(CurrentLine)) {
			CountRecs[UniqueRecs.indexOf(CurrentLine)] = CountRecs[UniqueRecs.indexOf(CurrentLine)] + 1;
			// New test - although log normally in date/time order lets not assume that and only update
			// the date/time if we're happy it's more recent
			if (DateNew > LastDate[UniqueRecs.indexOf(CurrentLine)]) {
				LastDate[UniqueRecs.indexOf(CurrentLine)] = DateNew;
			} else if (DateNew < FirstDate[UniqueRecs.indexOf(CurrentLine)]) {
				FirstDate[UniqueRecs.indexOf(CurrentLine)] = DateNew;
			}
		} else if (IPAdd != '' && IPAdd != ' ') {
			UniqueRecs.push(CurrentLine);
			CountRecs.push(1);
			FirstDate.push(DateNew);
			LastDate.push(DateNew);
		}
	}
})
.on('close', function() {
	// Set up workbook and worksheet
	var workbook = new Excel.Workbook();
	var worksheet = workbook.addWorksheet("Error Logging");
	// If in IIS mode then include column for HTTP status code
	if (logtype == 'IIS') {
		// Build column headings depending on mode, all require IP address
		var coldef = [];
		var counter = 0;
		coldef[counter] = { header: "IP Address", key:"IPADD"};
		counter++;
		switch (modetype) {
			case 'summstat':
				coldef[counter] = { header: "HTTP Status", key:"HTTPSTAT"};
				counter++;
				break;
			case 'summurl':
				coldef[counter] = { header: "Record", key:"RECORD"};
				counter++;
				break;
			case 'summip':
				break;
			default:
				coldef[counter] = { header: "Record", key:"RECORD"};
				counter++;
				coldef[counter] = { header: "HTTP Status", key:"HTTPSTAT"};
				counter++;
				break;
		}
		// All then have the final 4 columns the same
		coldef[counter] = { header: "Times Found", key:"COUNT"};
		counter++;
		coldef[counter] = { header: "First Found", key:"FIRST"};
		counter++;
		coldef[counter] = { header: "Last Found", key:"LAST"};
		counter++;
		coldef[counter] = { header: "Notes", key:"NOTES"};
		counter++;
		worksheet.columns = coldef;
	} else {
		worksheet.columns = [
			{ header: "IP Address", key:"IPADD"},
			{ header: "Record", key:"RECORD"},
			{ header: "Times Found", key:"COUNT"},
			{ header: "First Found", key:"FIRST"},
			{ header: "Last Found", key:"LAST"},
			{ header: "Notes", key:"NOTES"}
		];
	}
	worksheet.getRow(1).font = { name: "Calibri", size: 11, bold: true};
	// Loop array of unique records
	var counter = 0;
	UniqueRecs.forEach(function(element){
		const rowdef = [];
		// Again additional column for IIS records
		if (logtype == 'IIS') {
			switch (modetype) {
				case 'summstat':
					rowdef[1] = element.substring(0,element.indexOf(' '));
					rowdef[2] = element.substring(element.lastIndexOf(' '));
					rowdef[3] = CountRecs[counter];
					rowdef[4] = FirstDate[counter];
					rowdef[5] = LastDate[counter];
					rowdef[6] = checkip(element.substring(0,element.indexOf(' ')));
					break;
				case 'summurl':
					rowdef[1] = element.substring(0,element.indexOf(' '));
					rowdef[2] = element.substring(element.indexOf(' '));
					rowdef[3] = CountRecs[counter];
					rowdef[4] = FirstDate[counter];
					rowdef[5] = LastDate[counter];
					rowdef[6] = checkip(element.substring(0,element.indexOf(' ')));
					break;
				case 'summip':
					rowdef[1] = element
					rowdef[2] = CountRecs[counter];
					rowdef[3] = FirstDate[counter];
					rowdef[4] = LastDate[counter];
					rowdef[5] = checkip(element.substring(0,element.indexOf(' ')));
					break;
				default:
					rowdef[1] = element.substring(0,element.indexOf(' '));
					rowdef[2] = element.substring(element.indexOf(' '),element.lastIndexOf(' '));
					rowdef[3] = element.substring(element.lastIndexOf(' '));
					rowdef[4] = CountRecs[counter];
					rowdef[5] = FirstDate[counter];
					rowdef[6] = LastDate[counter];
					rowdef[7] = checkip(element.substring(0,element.indexOf(' ')));
					break;
			}
		} else {
			rowdef[1] = element.substring(0,element.indexOf(' '));
			rowdef[2] = element.substring(element.indexOf(' '));
			rowdef[3] = CountRecs[counter];
			rowdef[4] = FirstDate[counter];
			rowdef[5] = LastDate[counter];
			rowdef[6] = checkip(element.substring(0,element.indexOf(' ')));
		}
		worksheet.addRow(rowdef);
		counter++;
	})
	workbook.xlsx.writeFile("output.xlsx");
});

// Function to test IP address against each of the three arrays
// If found then return note value

function checkip(IPaddress){
	if (InternalIPs.includes(IPaddress)) {
		return("Internal Address");
	} else if (SuspectIPs.includes(IPaddress)) {
		return("Monitored Address");
	} else if (badIPs.includes(IPaddress)) {
		return("Blocked Address");
	} else {
		return("");
	}
};