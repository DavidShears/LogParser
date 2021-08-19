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
	// replace false positives, such as checking robots.txt and any files with 'bot' in the name
	string = string.replace(/robots.txt/gi,"");
	string = string.replace(/bottom/gi,"");
	if (string.indexOf('Bot') != -1 || string.indexOf('bot') != -1) {
		var unknown = checkbot(string);
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
		var counter = 0;
		coldef[counter] = { header: "Record", key:"RECORD"};
		counter++;
		worksheet.columns = coldef;
	worksheet.getRow(1).font = { name: "Calibri", size: 11, bold: true};
	// Loop array of unique records
	var counter = 0;
	Recs.forEach(function(element){
		const rowdef = [];
		rowdef[1] = element;
		worksheet.addRow(rowdef);
		counter++;
	})
	workbook.xlsx.writeFile("pruned.xlsx");
});

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