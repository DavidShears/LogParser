// Readline

const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');

// checkip & checkbot outsourced
var functions = require('./includes/logparse-process.js');
var checkip = functions.checkip;
var checkbot = functions.checkbot;
var buildline = functions.buildline;

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

rl.on('line', (string) => {
	// First test - remove header records by testing for #)
	if (string.indexOf('#') !== 0) {
		// Extract date and time
		var datetime = string.substring(0,19);
		var CurrentLine = buildline(string,logtype,modetype);
		if (CurrentLine != "") {
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
			} else {
				UniqueRecs.push(CurrentLine);
				CountRecs.push(1);
				FirstDate.push(DateNew);
				LastDate.push(DateNew);
				var IPAdd = CurrentLine.substring(0,CurrentLine.indexOf(' '));
				var checkedip = checkip(IPAdd,bottype);
				/* Notes.push(checkedip); */
				//Debugging - check if there's a bot agent identifier but IP isn't in bot ranges
				if (bottype != "ip") {
					var checkedbot = checkbot(string,IPAdd,bottype);
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