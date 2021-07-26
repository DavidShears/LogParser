// Readline

const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');

const rl = readline.createInterface({
    input: fs.createReadStream('error.php'),
    output: process.stdout,
    terminal: false
});

var UniqueRecs = [];
var CountRecs = [];
var FirstDate = [];
var LastDate = [];

rl.on('line', (string) => {
	// First test - remove header records by testing for #)
	if (string.indexOf('#') !== 0) {
		// Extract date and time
		var date = string.substring(0,10);
		var time = string.substring(11,19);
		// Extract IP address
		// Starts in position 31, end at next tab character
		var IPAdd = string.substring(31,string.indexOf('	',31));
		// Add 46 characters to length - gets us to error message
		nextpos = IPAdd.length + 46;
    	CurrentLine = (IPAdd + ' ' + string.substring(nextpos));
		if (UniqueRecs.includes(CurrentLine)) {
			CountRecs[UniqueRecs.indexOf(CurrentLine)] = CountRecs[UniqueRecs.indexOf(CurrentLine)] + 1;
			LastDate[UniqueRecs.indexOf(CurrentLine)] = date + ' ' + time;
		} else if (CurrentLine != ' ') {
			UniqueRecs.push(CurrentLine);
			CountRecs.push(1);
			FirstDate.push(date + ' ' + time);
			LastDate.push(date + ' ' + time);
		}
	}
})
.on('close', function() {
	// Set up workbook and worksheet
	var workbook = new Excel.Workbook();
	var worksheet = workbook.addWorksheet("Error Logging");
	worksheet.columns = [
		{ header: "IP Address", key:"IPADD"},
		{ header: "Record", key:"RECORD"},
		{ header: "Times Found", key:"COUNT"},
		{ header: "First Found", key:"FIRST"},
		{ header: "Last Found", key:"LAST"}
	];
	worksheet.getRow(1).font = { name: "Calibri", size: 11, bold: true};
	// Loop array of unique records
	var counter = 0;
	UniqueRecs.forEach(function(element){
			worksheet.addRow({IPADD: element.substring(0,element.indexOf(' ')), 
			RECORD: element.substring(element.indexOf(' ')), COUNT: CountRecs[counter], 
			FIRST: FirstDate[counter], LAST: LastDate[counter]});
		counter++;
	})
	workbook.xlsx.writeFile("output.xlsx");
});