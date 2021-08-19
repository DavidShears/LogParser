// Readline

const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');

// Add option to specify log type - if anything other than IIS assume original Joomla logic

var args = process.argv;

if (args[2] != null) {
	var logtype = args[2].toUpperCase();
}

// check if 2nd parameter (third argument) is a mode or a bot report type
if (args[3] != null) {
	if (args[3].substring(0,4) == "summ") {
		var modetype = args[3].toLowerCase();
	} else {
		var bottype = args[3].toLowerCase();	
	}
}

// 3rd parameter (4th argument) will be a bot report type if 3rd was a mode
if (args[4] != null) {
	var bottype = args[4].toLowerCase();
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
var Notes = [];

// Arrays for holding IPs flagged
// Will be used to build notes column
var InternalIPs = [];
var SuspectIPs = [];
var badIPs = [];
// botIPs array moved to external javascript file
var botIPs = require('./includes/bots.js').botIPs;
var botagents = require('./includes/bots.js').botagents;

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
			// IIS not displaying ? in url request so put it back in
			urlreq = urlreq.replace(" ","?");
			// Figure out where IP address is - search for 3 sets of digits
			// with a decimal inbetween, followed by a 4th set of digits.
			// Must also have 10 spaces preceeding it to not pick up host IP
			var IPStart = string.search(/(\d*\.){3}\d*(?<=( (.*)){10})/g);
			var IPAdd = string.substring(IPStart,string.indexOf(' ',IPStart));
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
		// else use Joomla logic
		} else {
			var IPStart = string.search(/(\d*\.){3}\d*/g);
			var IPAdd = string.substring(IPStart,string.indexOf('	',IPStart));
			// Handle older version of Joomla logging
			if (string.indexOf('Joomla FAILURE') !== -1) {
				// Add 43 characters to length - gets us to error message
				nextpos = IPAdd.length + 43;
			} else {
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
		// Record not in array - write as long as there's an IP Address
		} else if (IPAdd != '' && IPAdd != ' ') {
			UniqueRecs.push(CurrentLine);
			CountRecs.push(1);
			FirstDate.push(DateNew);
			LastDate.push(DateNew);
			var checkedip = checkip(IPAdd);
			/* Notes.push(checkedip); */
			//Debugging - check if there's a bot agent identifier but IP isn't in bot ranges
			if (bottype != "ip") {
				var checkedbot = checkbot(string,IPAdd);
			}
			if (checkedip != "" && checkedbot != "") {
				Notes.push(checkedip + ", " + checkedbot);
			} else if (checkedip == "") {
				Notes.push(checkedbot);
			} else if (checkedbot == "") {
				Notes.push(checkedip);
			} else {
				Notes.push("");
			}
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
					var nextcol = 3;
					break;
				case 'summurl':
					rowdef[1] = element.substring(0,element.indexOf(' '));
					rowdef[2] = element.substring(element.indexOf(' '));
					var nextcol = 3;
					break;
				case 'summip':
					rowdef[1] = element
					var nextcol = 2;
					break;
				default:
					rowdef[1] = element.substring(0,element.indexOf(' '));
					rowdef[2] = element.substring(element.indexOf(' '),element.lastIndexOf(' '));
					rowdef[3] = element.substring(element.lastIndexOf(' '));
					var nextcol = 4;
					break;
			}
			// All then have the final 4 columns the same
			rowdef[nextcol] = CountRecs[counter];
			nextcol++;
			rowdef[nextcol] = FirstDate[counter];
			nextcol++;
			rowdef[nextcol] = LastDate[counter];
			nextcol++;
			rowdef[nextcol] = Notes[counter];
		} else {
			rowdef[1] = element.substring(0,element.indexOf(' '));
			rowdef[2] = element.substring(element.indexOf(' '));
			rowdef[3] = CountRecs[counter];
			rowdef[4] = FirstDate[counter];
			rowdef[5] = LastDate[counter];
			rowdef[6] = Notes[counter];
		}
		worksheet.addRow(rowdef);
		counter++;
	})
	workbook.xlsx.writeFile("output.xlsx");
});

// Function to test IP address against each of the three arrays
// If found then return note value

function checkip(IPaddress){
	// Allow a 3 part match i.e. 127.0.0.* - currently only for bots
	var subnet = IPaddress.substring(0,IPaddress.lastIndexOf('.') + 1)
	if (InternalIPs.includes(IPaddress) ) {
		return("Internal Address");
	} else if (SuspectIPs.includes(IPaddress) ) {
		return("Monitored Address");
	} else if (badIPs.includes(IPaddress) ) {
		return("Blocked Address");
	} else if (botIPs.includes(IPaddress) && bottype != "agent") {
		return("Bot Address");
	} else if (botIPs.includes(subnet) && botIPs[botIPs.indexOf(subnet)].substr(-1) == '.' && bottype != "agent"){
		return ("Bot Subnet");
	} else {
		return("");
	}
};


//Debugging function - check for various bot agents and see if we already have the IP address on record
function checkbot(string,IPAdd) {
	let i = 0;
	while (botagents[i]) {
		var tempstring = string.toLowerCase();
		if (tempstring.indexOf(botagents[i]) != -1) {
			if (bottype != "agent"){
				var found = checkip(IPAdd);
				if (found == '') {
					return("New " + botagents[i] + " address!");
				} else {
					return(botagents[i] + " address!");
				}
			} else {
				return(botagents[i] + " address!");
			}
		}
		i++;
	}
	return("");
/*	if (string.indexOf('MJ12bot') != -1) {
		var found = checkip(IPAdd);
		if (found == '') {
			return("New MJ12bot address!");
		} else {
			return("MJ12bot address!");
		}
	} */
}