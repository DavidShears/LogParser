// Script to strip out non-bot traffic based on scanning for common identifiers

// Readline

const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');

var rl = readline.createInterface({
	input: fs.createReadStream('IIS.log'),
	output: process.stdout,
	terminal: false
});

// Try using yargs to handle combinations of parameters
var argv = require('yargs/yargs')(process.argv.slice(2)).argv;

// Use general check/get ip functions
var functions = require('../includes/logparse-process.js');
var checkip = functions.checkip;
var getip = functions.getip;

var Recs = [];

var botagents = require('../includes/bots.js').botagents;

rl.on('line', (string) => {
	// First things first, if we're excluding blocked/internal lets find out now
	if (argv.noblocked || argv.nointernal) {
		var IPAdd = getip(string,'IIS');
		var checkedip = checkip(IPAdd,' ');
	}
	// If we're excluding blocked/internal then below if will skip adding to array
	if ( (!argv.noblocked || argv.noblocked && checkedip != 'Blocked Address!')
	&& (!argv.nointernal || argv.nointernal && checkedip != 'Internal Address!')) {
		// replace false positives, such as any files with 'bot' in the name
		// robots.txt can be excluded as well, although odds are if something is accessing it then it's a bot?
		//string = string.replace(/robots.txt/gi,"");
		string = string.replace(/bottom/gi,"");
		// convert string to lowercase to make matching easier
		var tempstring = string.toLowerCase();
		// now check for the term 'bot', 'crawler', 'spider'
		if (string.indexOf('bot') != -1 
		|| string.indexOf('crawler') != -1
		|| string.indexOf('spider') != -1) {
			var unknown = checkbot(tempstring);
			if (unknown == '') {
				Recs.push(string);
			}
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