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
var getip = functions.getip;
var checkinclude = functions.checkinclude;
var checkexclude = functions.checkexclude;
var checksusurl = functions.checksusurl;

// Try using yargs to handle combinations of parameters
var argv = require('yargs/yargs')(process.argv.slice(2)).argv;

// Test if valid combination of arguments provided

// Cannot have multiple flags set to only - error and stop
if (argv.blocked == 'O' && argv.internal == 'O') {
	console.log('Both blocked & Internal set to only - cannot process');
	return;
}

if (argv.bot == 'only' && (argv.internal == 'O' || argv.blocked == 'O')) {
	console.log('bot set to only along with internal/blocked - cannot process');
	return;
}

// If a flag set to only, and another one set to Y, then warn and set to N

if ((argv.blocked && argv.blocked != 'N') && argv.internal == 'O') {
	argv.blocked = 'N';
	console.log('blocked IPs specified but internal set to Only - blocked ignored');
}

if ((argv.internal && argv.internal != 'N') && argv.blocked == 'O') {
	argv.internal = 'N';
	console.log('internal IPs specified but blocked set to Only - internal ignored');
}

// Some flags only valid if processing IIS log, warn but continue

if (argv.log != 'IIS' && argv.mode) {
	console.log('Mode passed without IIS log, mode will be ignored.');
}

if (argv.log != 'IIS' && argv.highlight == 'Y') {
	console.log('Highlight suspect URL specified without IIS log, flag ignored');
	argv.highlight == 'N';
}

if (argv.log != 'IIS' && (argv.noimages || argv.nocss || argv.nojs || argv.notemp
	|| argv.extensions)) {
	console.log('File type exclusion specified without IIS log, flags ignored');
}

// Any other misc validation checks

if ((argv.bot && (argv.bot != 'exclude' && argv.bot != 'excludesus'))
	 && (argv.blocked == 'O' || argv.internal == 'O')) {
	argv.bot == 'exclude';
	console.log('bot passed as: ' + argv.bot + ' but Only flag set for Blocked/Internal, bot ignored');
}

if (argv.highlight =='Y' && (argv.mode == 'summstat' || argv.mode == 'summip')) {
	console.log('Highlight suspect URL specified but mode excludes URL on output. Highlight ignored');
	argv.highlight == 'N';
}

// Add option to specify log type - if anything other than IIS assume original Joomla logic

if (argv.log) {
	switch(argv.log.toUpperCase()) {
		case 'IIS':
			var rl = readline.createInterface({
				input: fs.createReadStream('IIS.log'),
				output: process.stdout,
				terminal: false
			});
			break;	
		default:
			var rl = readline.createInterface({
				input: fs.createReadStream('error.php'),
				output: process.stdout,
				terminal: false
			});
			break;
	} 
} else {
	var rl = readline.createInterface({
		input: fs.createReadStream('error.php'),
		output: process.stdout,
		terminal: false
	});
}

// Test if output file is locked - if so no point running
fs.open('./output.xlsx','r+', function(err,fd) {
	if (err && err.code === 'EBUSY') {
		console.log('Output file locked - try again later');
		process.exit(1);
	} else if (err == null || err.code != 'ENOENT') {
		fs.close(fd);
	}
})

var UniqueRecs = [];
var CountRecs = [];
var FirstDate = [];
var LastDate = [];
var Notes = [];

rl.on('line', (string) => {
	// Check ip & bot now to allow us to update the notes field if required
		var IPAdd = getip(string,argv.log);
        var checkedip = checkip(IPAdd,argv.bot);
        var checkedbot = checkbot(string,IPAdd,argv.bot);
	// First test - remove header records by testing for #
	if (string.indexOf('#') !== 0) {
		var checkedinclude = checkinclude(argv.bot,argv.blocked,argv.internal,checkedbot,checkedip)
	}
	var checkedexclude = 'N';
	if (argv.log == 'IIS' && (argv.noimages || argv.nojs || argv.nocss || argv.notemp)) {
		var noimages = 'N';
		var nojs = 'N';
		var nocss = 'N';
		var notemp = 'N';
		if (argv.noimages) {
			noimages = 'Y'
		}
		if (argv.nojs) {
			nojs = 'Y'
		}
		if (argv.nocss) {
			nocss = 'Y'
		}
		if (argv.notemp) {
			notemp = 'Y'
		}
		if (argv.extensions) {
			var extarr = argv.extensions.split(",")
		}
		var checkedexclude = checkexclude(string,noimages,nojs,nocss,notemp,extarr);
	}
	// Now if we got a Y back then lets proceed
	if (checkedinclude == 'Y' && checkedexclude == 'N')
		{
		// Extract date and time
		var CurrentLine = buildline(string,argv.log,argv.mode);
		if (CurrentLine != "") {
			// Test if record is already in array - if it is then increment counter and update last date
			// If it isn't then add to arrays and stamp first date
			var DateNew = new Date(string.substring(0,19));
			if (UniqueRecs.includes(CurrentLine)) {
				CountRecs[UniqueRecs.indexOf(CurrentLine)] = CountRecs[UniqueRecs.indexOf(CurrentLine)] + 1;
				// New test - although log normally in date/time order lets not assume that and only update
				// the date/time if we're happy it's more recent
				if (DateNew > LastDate[UniqueRecs.indexOf(CurrentLine)]) {
					LastDate[UniqueRecs.indexOf(CurrentLine)] = DateNew;
				} else if (DateNew < FirstDate[UniqueRecs.indexOf(CurrentLine)]) {
					FirstDate[UniqueRecs.indexOf(CurrentLine)] = DateNew;
				}
				// New test - check whether we now have an ID on an IP Address that we didn't previously
				if ((checkedip != "" || checkedbot != "") && Notes[UniqueRecs.indexOf(CurrentLine)] == "") {
					if (checkedip != "" && checkedbot != "") {
						Notes[UniqueRecs.indexOf(CurrentLine)] = (checkedip + ", " + checkedbot);
					} else if (checkedip == "") {
						Notes[UniqueRecs.indexOf(CurrentLine)] = (checkedbot);
					} else if (checkedbot == "") {
						Notes[UniqueRecs.indexOf(CurrentLine)] = (checkedip);
					}
				}
			// Record not in array - write as long as there's an IP Address
			} else {
				UniqueRecs.push(CurrentLine);
				CountRecs.push(1);
				FirstDate.push(DateNew);
				LastDate.push(DateNew);
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
	// Minor thing - Joomla is specifically error logging, IIS isn't
	if (argv.log == 'IIS') {
		var worksheet = workbook.addWorksheet("Traffic Logging");
	} else {
		var worksheet = workbook.addWorksheet("Error Logging");
	}
	// Call external function to generate column headers
	worksheet.columns = buildcols(argv.log,argv.mode);
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
					// Test whether url is on the suspect list
					if (argv.highlight == 'Y') {
						var flag = checksusurl(rowdef[2])
					}
					var nextcol = 3;
					break;
				case 'summip':
					rowdef[1] = element
					var nextcol = 2;
					break;
				default:
					rowdef[1] = element.substring(0,element.indexOf(' '));
					rowdef[2] = element.substring(element.indexOf(' '),element.lastIndexOf(' '));
					// Test whether url is on the suspect list
					if (argv.highlight == 'Y') {
						var flag = checksusurl(rowdef[2])
					}
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
		// If we determined this is a suspect URL then set the URL cell to Orange
		if (argv.highlight == 'Y' && flag == 'Y') {
			var cell = ('B' + (counter + 1));
			worksheet.getCell(cell).fill = {
				type: 'pattern',
				pattern:'solid',
				fgColor:{argb:'FF8C01'},
			};
		}
	})
	workbook.xlsx.writeFile("output.xlsx");
});