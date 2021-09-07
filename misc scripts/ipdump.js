// Script to output records for specified IP address

// Readline

const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');

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
	} 
}else {
	console.log('no log type passed so cannot process')
	process.exit(1);
}

if (argv.ip == null) {
	console.log('no IP provided so cannot process');
	process.exit(1);
}

var Recs = [];

rl.on('line', (string) => {
	// replace false positives, such as checking robots.txt and any files with 'bot' in the name
	if (string.indexOf(argv.ip) != -1) {
			Recs.push(string);	
	}
})
.on('close', function() {
	// Set up workbook and worksheet
	var workbook = new Excel.Workbook();
	var worksheet = workbook.addWorksheet("Records");
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
	workbook.xlsx.writeFile("ipdump.xlsx");
});