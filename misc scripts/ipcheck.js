// Script to read output from (web)app.js and check unique IPs against AbuseIPDB

const fs = require('fs');
const readline = require('readline');
const fetch = require("node-fetch");
var Excel = require('exceljs');

var functions = require('../includes/logparse-process.js');
var checkip = functions.checkip;
var getip = functions.getip;

var botagents = require('../includes/bots.js').botagents;

var argv = require('yargs/yargs')(process.argv.slice(2)).argv;

if (argv.log) {
	switch(argv.log.toUpperCase()) {
		case 'IIS':
			var rl = readline.createInterface({
				input: fs.createReadStream('IIS.log'),
				output: process.stdout,
				terminal: false
			});
			break;
		case 'JOOMLA':
			var rl = readline.createInterface({
				input: fs.createReadStream('error.php'),
				output: process.stdout,
				terminal: false
			});
			break;	
		default:
			console.log('invalid log type passed - cannot process')
			process.exit(1);
	} 
}else {
	console.log('no log type passed so cannot process')
	process.exit(1);
}

var IPs = [];
var IntNotes = [];

rl.on('line', (string) => {
	// Exclude lines beginning with # as they're comments
	if (string.indexOf('#') !== 0) {
		var IPAdd = getip(string,argv.log);
		if (IPs.includes(IPAdd)) { 
		} else if (IPAdd != null && IPAdd != '') {
			IPs.push(IPAdd);
			// CheckIP & checkbot used to provide internal notes
			var checkedip = checkip(IPAdd,' ');
			var checkedbot = checkbot(string);
			if (checkedip != '' && checkedbot != '') {
				IntNotes.push(checkedip + '-' + checkedbot)
			} else if (checkedbot == '') {
				IntNotes.push(checkedip);
			} else if (checkedip == '') {
				IntNotes.push(checkedbot);
			} else {
				IntNotes.push('');
			}
		}
	}
})
.on('close', async function() {
	// Set up workbook and worksheet
	var workbook = new Excel.Workbook();
	var worksheet = workbook.addWorksheet("Records");
	var coldef = [];
	coldef[0] = { header: "IP Address", key:"IPAdd", width: 15};
	coldef[1] = { header: "Physical Location", key:"PhysLoc", width: 17};
	coldef[2] = { header: "Internal Notes", key:"Int", width: 34};
	coldef[3] = { header: "Domain", key:"Domain", width: 34};
	coldef[4] = { header: "Host(s)", key:"Host", width: 55};
	coldef[5] = { header: "External Notes", key:"Ext", width: 91};
	worksheet.columns = coldef;
	worksheet.getRow(1).font = { name: "Calibri", size: 11, bold: true};
	// Loop array of unique records
	counter = 0;
	for (let x of IPs) {
		const rowdef = [];
		rowdef[0] = x;
		rowdef[1] = '';
		rowdef[2] = IntNotes[counter];
		rowdef[3] = '';
		rowdef[4] = '';
		rowdef[5] = '';
		// Now we ask AbuseIPDB for information
		const res = await fetch('https://api.abuseipdb.com/api/v2/check?ipAddress=' + x, {
		// Line below is where you can put the API key you get from the website
		headers: {'Key': '',
				'Accept': 'application/json'}
		})
		const data = await res.json();
		// If abuseconfidentscore > 0 then provide details
		if (data.data.abuseConfidenceScore != 0) {
			rowdef[5] = 'AbuseIPDB Score: ' + data.data.abuseConfidenceScore
			+ ' based on: ' + data.data.totalReports + ' reports from ' +
			data.data.numDistinctUsers + ' users, last reported at: '
			+ data.data.lastReportedAt;
		}
		// If a country was provided lets also stamp that
		if (data.data.countryCode != '') {
			rowdef[1] = data.data.countryCode;
		}
		if (data.data.domain != '') {
			rowdef[3] = data.data.domain;
		}
		if (data.data.hostnames != '') {
			rowdef[4] = data.data.hostnames;
		}
		worksheet.addRow(rowdef);
		counter++;
	}
	workbook.xlsx.writeFile("ipcheck.xlsx");		
});

// same stripdown version of checkbot from pruner.js

function checkbot(string) {
	let i = 0;
	while (botagents[i]) {
		var tempstring = string.toLowerCase();
		if (tempstring.indexOf(botagents[i]) != -1) {
				return(botagents[i] + " address!");
			}
		i++;
		}
	return("");
}