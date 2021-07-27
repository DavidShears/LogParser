// Readline

const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');


// Add option to specify log type - if anything other than IIS assume original Joomla logic
var logtype = process.argv.slice(2);

console.log(logtype);

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

/* const rl = readline.createInterface({
    input: fs.createReadStream('error.php'),
    output: process.stdout,
    terminal: false
}); */

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
		if (logtype == 'IIS') {
			// Position varies by 1 digit depending on GET/POST request
			if (string.indexOf('GET') !== -1) {
				var urlreq = string.substring(string.indexOf('GET') + 4,string.indexOf(' ',string.indexOf('GET') + 4));
			} else if (string.indexOf('POST') !== -1) {
				var urlreq = string.substring(string.indexOf('POST') + 5,string.indexOf(' ',string.indexOf('POST') + 5));
			}
			// Figure out where IP address is
			var IPStart = string.indexOf(' HTTP');
			var IPStart = string.lastIndexOf(' ',IPStart - 1);
			var IPAdd = string.substring(IPStart + 1,string.indexOf(' ',IPStart + 1));
			// Build CurrentLine from the various elements we've picked up
			CurrentLine = (IPAdd + ' ' + urlreq);
		} else {
			// Starts in position 31, end at next tab character
			var IPAdd = string.substring(31,string.indexOf('	',31));
			// Add 46 characters to length - gets us to error message
			nextpos = IPAdd.length + 46;
			CurrentLine = (IPAdd + ' ' + string.substring(nextpos));
		}
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