// Script to determine last time a web crawler was seen based on user agent

// Note that this means if a crawler can be triggered from multiple locations or multiple users
// then those will be grouped together.

// Readline

const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');

var rl = readline.createInterface({
	input: fs.createReadStream('IIS.log'),
	output: process.stdout,
	terminal: false
});

var agents = [];
var FirstDate = [];
var LastDate = [];

var botagents = require('../includes/bots.js').botagents;

rl.on('line', (string) => {
	// Exclude lines beginning with # as they're comments
	if (string.indexOf('#') !== 0) {
		// checkbot used to provide internal notes
		var checkedbot = checkbot(string);
		var DateNew = new Date(string.substring(0,19));
		if (agents.includes(checkedbot)) { 
			if (DateNew > LastDate[agents.indexOf(checkedbot)]) {
				LastDate[agents.indexOf(checkedbot)] = DateNew;
			} else if (DateNew < FirstDate[agents.indexOf(checkedbot)]) {
				FirstDate[agents.indexOf(checkedbot)] = DateNew;
			}
		} else if (checkedbot != '') {
			agents.push(checkedbot)
			FirstDate.push(DateNew);
			LastDate.push(DateNew);
		}
	}
})

.on('close', function() {
	// Set up workbook and worksheet
	var workbook = new Excel.Workbook();
	var worksheet = workbook.addWorksheet("Bot Records");
	var coldef = [];
	coldef[0] = { header: "BotAgent", key:"BOTAGENT"};
	coldef[1] = { header: "First Seen", key:"FIRST", width: 11};
	coldef[2] = { header: "Last Seen", key:"LAST", width: 11};
	worksheet.columns = coldef;
	worksheet.getRow(1).font = { name: "Calibri", size: 11, bold: true};
	// Loop array of unique records
	var counter = 0;
	agents.forEach(function(element){
		const rowdef = [];
		rowdef[0] = element;
		rowdef[1] = FirstDate[counter];
		rowdef[2] = LastDate[counter];
		worksheet.addRow(rowdef);
		counter++;
	})
	workbook.xlsx.writeFile("crawlers.xlsx");
});

// stripdown version of normal checkbot function - just check if the agent is already known

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