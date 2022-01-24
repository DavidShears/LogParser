// Script to output records for Plesk ModSecurity logs

// Readline

const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');

var rl = readline.createInterface({
		input: fs.createReadStream('audit.log'),
		output: process.stdout,
		terminal: false
	});

// Pull in functions and arrays for checking ip/bot status
var functions = require('../includes/logparse-process.js');
var checkip = functions.checkip;
	
var botagents = require('../includes/bots.js').botagents;

var UniqueRecs = [];
var IPAdds = [];
var CountRecs = [];
var FirstDate = [];
var LastDate = [];
var Notes = [];
var IDs = [];
var messages = [];
var HTTPCodes = [];
var DateNew = '';
var IPAdd = '';
var checkedip = '';

rl.on('line', (string) => {
	// Handle different segments of the log
	// If 127.0.0.1 then this is the datetime and IP line
	if (string.indexOf('127.0.0.1') != -1) {
		// Note that there are two IP addresses on the line, below will capture the first one
		// which is (normally?) the one we want.
		IPStart = string.search(/(\d{1,3}\.){3}\d{1,3}(?<=( (.*)){2})/g);
		IPAdd = string.substring(IPStart,string.indexOf(' ',IPStart));
		DateNew = new Date(string.substring(1,12) + ' ' + string.substring(14,21));
		checkedip = checkip(IPAdd,' ');
	};
	// If Message: then this is the details of why the record is in the log
	// Good time to update the holding arrays
	if (string.indexOf('Message:') != -1) {
		// Strip out certain elements of the string that we aren't interested in
		// first off the location of the conf file
		/* string = string.replace("\[file \"C:\\/Program Files (x86)/Plesk/ModSecurity/rules/tortix/hg_rules.conf\"\]",""); */
		// Grab the ID number triggered - and remove from the main string
		IDStart = string.indexOf("\[id \"");
		IDNumb = string.substring(IDStart + 5,string.indexOf('\"\]',IDStart));
		/* string = string.replace(IDNumb,"");
		string = string.replace("\[id \"\"\]",""); */
		// Grab the message - and remove from the main string
		MsgStart = string.indexOf("\[msg \"");
		MsgTxt = string.substring(MsgStart + 6,string.indexOf('\"\]',MsgStart));
		/* string = string.replace(MsgTxt,"");
		string = string.replace("\[msg \"\"\]",""); */
		// Grab the HTTP status if applicable - and remove from the main string
		HTTPStart = string.indexOf("(phase");
		if (HTTPStart != -1) {
			HTTPcode = string.substring(HTTPStart -4,HTTPStart -1);
		/* string = string.replace(HTTPcode,"");
			string = string.replace("Access denied with code", ""); */
		} else {
			HTTPcode = "";
		}
		var CurrentLine = string.substring(9);
		if (UniqueRecs.includes(CurrentLine) && IPAdds.includes(IPAdd)) {
			CountRecs[UniqueRecs.indexOf(CurrentLine)] = CountRecs[UniqueRecs.indexOf(CurrentLine)] + 1;
			if (DateNew > LastDate[UniqueRecs.indexOf(CurrentLine)]) {
				LastDate[UniqueRecs.indexOf(CurrentLine)] = DateNew;
			} else if (DateNew < FirstDate[UniqueRecs.indexOf(CurrentLine)]) {
				FirstDate[UniqueRecs.indexOf(CurrentLine)] = DateNew;
			}
			if (checkedip != '' && Notes.indexOf(CurrentLine) == '') {
				Notes.indexOf(CurrentLine) = checkedip;
			}
		} else {
			UniqueRecs.push(CurrentLine);
			IPAdds.push(IPAdd);
			CountRecs.push(1);
			FirstDate.push(DateNew);
			LastDate.push(DateNew);
			IDs.push(IDNumb);
			messages.push(MsgTxt);
			HTTPCodes.push(HTTPcode);
			if (checkedip != '') {
				Notes.push(checkedip);
			} else {
				Notes.push('');
			}
		}
	}
})
.on('close', function() {
	// Set up workbook and worksheet
	var workbook = new Excel.Workbook();
	var worksheet = workbook.addWorksheet("Records");
	var coldef = [];
	var nextcol = 0;
	coldef[nextcol] = { header: "IP Address", key:"IPADD", width: 15};
	nextcol++;
	coldef[nextcol] = { header: "ID Number", key:"IDNUMB", width: 11};
	nextcol++;
	coldef[nextcol] = { header: "HTTP Code", key:"HTTP", width: 11};
	nextcol++;
	/* coldef[nextcol] = { header: "Record", key:"RECORD"};
	nextcol++; */
	coldef[nextcol] = { header: "Message Text", key:"MSGTXT"};
	nextcol++;
	coldef[nextcol] = { header: "Times Found", key:"COUNT"};
	nextcol++;
	coldef[nextcol] = { header: "First Found", key:"FIRST", width: 11};
	nextcol++;
	coldef[nextcol] = { header: "Last Found", key:"LAST", width: 11};
	nextcol++;
	coldef[nextcol] = { header: "Notes", key:"NOTES"};
	worksheet.columns = coldef;
	worksheet.getRow(1).font = { name: "Calibri", size: 11, bold: true};
	// Loop array of unique records
	var counter = 0;
	UniqueRecs.forEach(function(element){
		nextcol = 0;
		const rowdef = [];
		rowdef[nextcol] = IPAdds[counter];
		nextcol++;
		rowdef[nextcol] = IDs[counter];
		nextcol++;
		rowdef[nextcol] = HTTPCodes[counter];
		nextcol++;
		/* rowdef[nextcol] = element;
		nextcol++; */
		rowdef[nextcol] = messages[counter];
		nextcol++;
		rowdef[nextcol] = CountRecs[counter];
		nextcol++;
		rowdef[nextcol] = FirstDate[counter];
		nextcol++;
		rowdef[nextcol] = LastDate[counter];
		nextcol++;
		rowdef[nextcol] = Notes[counter];
		worksheet.addRow(rowdef);
		counter++;
	})
	workbook.xlsx.writeFile("modsecurity.xlsx");
});