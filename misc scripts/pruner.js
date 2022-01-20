// Script to strip out non-bot traffic based on scanning for the word "bot"

// Readline

const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');

var rl = readline.createInterface({
	input: fs.createReadStream('IIS.log'),
	output: process.stdout,
	terminal: false
});

var Recs = [];

var botagents = require('../includes/bots.js').botagents;

rl.on('line', (string) => {
	// replace false positives, such as any files with 'bot' in the name
	// robots.txt can be excluded as well, although odds are if something is accessing it then it's a bot?
	//string = string.replace(/robots.txt/gi,"");
	string = string.replace(/bottom/gi,"");
	// convert string to lowercase to make matching easier
	var tempstring = string.toLowerCase();
	// now check for the term 'bot' and 'crawler'
	if (string.indexOf('bot') != -1 
	|| string.indexOf('crawler') != -1) {
		var unknown = checkbot(tempstring);
		if (unknown == '') {
			Recs.push(string);
		}
	}
})
.on('close', function() {
	// Set up workbook and worksheet
	var workbook = new Excel.Workbook();
	var worksheet = workbook.addWorksheet("Bot Records");
	var coldef = [];
	coldef[0] = { header: "Record", key:"RECORD"};
	worksheet.columns = coldef;
	worksheet.getRow(1).font = { name: "Calibri", size: 11, bold: true};
	// Loop array of unique records
	Recs.forEach(function(element){
		const rowdef = [];
		rowdef[1] = element;
		worksheet.addRow(rowdef);
	})
	workbook.xlsx.writeFile("pruned.xlsx");
});

// stripdown version of normal checkbot function - just check if the agent is already known

function checkbot(string) {
	let i = 0;
	while (botagents[i]) {
		if (string.indexOf(botagents[i]) != -1) {
				return(botagents[i] + " address!");
			}
		i++;
		}
	return("");
}