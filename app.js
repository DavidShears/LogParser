// Readline

const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');



// checkip & checkbot outsourced
var functions = require('./includes/logparse-process.js');
var checkip = functions.checkip;
var checkbot = functions.checkbot;
var buildline = functions.buildline;
var buildcols = functions.buildcols;

// Add option to specify log type - if anything other than IIS assume original Joomla logic

// Try using yargs to handle combinations of parameters
var argv = require('yargs/yargs')(process.argv.slice(2)).argv;

if (argv.log == 'IIS') {
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

console.log(argv)

var UniqueRecs = [];
var CountRecs = [];
var FirstDate = [];
var LastDate = [];
var Notes = [];

rl.on('line', (string) => {
	// if excluding blocked/internal addresses now a good time to find out if we have one
    // This also catches blocked/internal being set to only since the other flag will be N
    if (argv.blocked == "N" || argv.internal == "N") {
        if (argv.log == "IIS") {
            var IPStart = string.search(/(\d*\.){3}\d*(?<=( (.*)){10})/g);
            var IPAdd = string.substring(IPStart,string.indexOf(' ',IPStart));
        } else {
            var IPStart = string.search(/(\d*\.){3}\d*/g);
		    var IPAdd = string.substring(IPStart,string.indexOf('	',IPStart));
        }
        var checkedip = checkip(IPAdd,argv.bot);
	}
    if (argv.bot == "exclude") {
        var checkedbot = checkbot(string,IPAdd,argv.bot);
    }
	// First test - remove header records by testing for #
	if ((string.indexOf('#') !== 0) && 
	// Also good opportunity to test if we've asked to exclude bots
		(argv.bot != "exclude"|| (argv.bot == "exclude" && checkedbot == "")) &&
		// Or we're excluding blocked IP addresses
		(argv.blocked != "N" || (argv.blocked == "N" && checkedip != "Blocked Address") ) &&
		// Or we're only after blocked IPs and this isn't one
		(argv.blocked != "O" || (argv.blocked == "O" && checkedip == "Blocked Address") ) &&
		// Or we're excluding internal IP addresses
		(argv.internal != "N" || (argv.internal == "N" && checkedip != "Internal Address") ) &&
		// Or we're only after internal IPs and this isn't one
		(argv.internal != "O" || (argv.internal == "O" && checkedip == "Internal Address") ) )
		{
		// Extract date and time
		var datetime = string.substring(0,19);
		var CurrentLine = buildline(string,argv.log,argv.mode);
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
				// if blocked/internal excluded then we've already done this test
				if (argv.blocked != "N" && argv.internal != "N") {
					var IPAdd = CurrentLine.substring(0,CurrentLine.indexOf(' '));
					var checkedip = checkip(IPAdd,argv.bot);
				}
				/* Notes.push(checkedip); */
				//Debugging - check if there's a bot agent identifier but IP isn't in bot ranges
				// don't bother if running in exclude mode as already checked earlier.
				if (argv.bot != "ip" && argv.bot != "exclude") {
					var checkedbot = checkbot(string,IPAdd,argv.bot);
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
	// Call external function to generate column headers
	var coldef = buildcols(argv.log,argv.mode);
    worksheet.columns = coldef;
	worksheet.getRow(1).font = { name: "Calibri", size: 11, bold: true};
	// Loop array of unique records
	var counter = 0;
	UniqueRecs.forEach(function(element){
		const rowdef = [];
		// Again additional column for IIS records
		if (argv.log == 'IIS') {
			switch (argv.mode) {
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