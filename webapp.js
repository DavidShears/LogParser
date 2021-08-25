//Initial setup
const express = require('express');
const webapp = express();
const http = require('http').Server(webapp);
const io = require('socket.io')(http);
const port = process.env.PORT || 3007;
const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    host:"172.16.0.25",
    port: 25,
    tls: {
        rejectUnauthorized: false
    }
});

var functions = require('./includes/logparse-process.js');
var checkip = functions.checkip;
var checkbot = functions.checkbot;
var buildline = functions.buildline;
var buildcols = functions.buildcols;

webapp.use(express.static('includes'));

webapp.set('views','./src/views');
webapp.set('view engine', 'ejs');

io.on('connection', function(socket){
    var reccnt = 0;
    var totalreccnt = 0;
    var excludedreccnt = 0;
    socket.on('procfile',(logtype,modetype,bottype,emailaddress,blocked,internal) => {

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
    
        var UniqueRecs = [];
        var CountRecs = [];
        var FirstDate = [];
        var LastDate = [];
        var Notes = [];    

        rl.on('line', (string) => {
            var IPAdd = "";
            if (bottype == "exclude") {
                var checkedbot = checkbot(string,IPAdd,bottype);
            }
            if (blocked == "N" || internal == "N") {
                if (modetype == "IIS") {
                    var IPStart = string.search(/(\d*\.){3}\d*(?<=( (.*)){10})/g);
                    var IPAdd = string.substring(IPStart,string.indexOf(' ',IPStart));
                } else {
                    var IPStart = string.search(/(\d*\.){3}\d*/g);
		            var IPAdd = string.substring(IPStart,string.indexOf('	',IPStart));
                }
                var checkedip = checkip(IPAdd,bottype);
            }
            // First test - remove header records by testing for #
            if (
                (string.indexOf('#') !== 0) &&
                // Also good opportunity to test if we've asked to exclude bots
                (bottype != "exclude" || (bottype == "exclude" && checkedbot == "") ) && 
                // Or we're excluding blocked IP addresses
                (blocked != "N" || (blocked == "N" && checkedip != "Blocked Address") ) &&
                // Or we're excluding internal IP addresses
                (internal != "N" || (internal == "N" && checkedip != "Internal Address") ) )
                {
                // Extract date and time
                var datetime = string.substring(0,19);
                var CurrentLine = buildline(string,logtype,modetype);
                if (CurrentLine != "") {
                    // Test if record is already in array - if it is then increment counter and update last date
                    // If it isn't then add to arrays and stamp first date
                    var DateNew = new Date(datetime);
                    if (UniqueRecs.includes(CurrentLine)) {
                        CountRecs[UniqueRecs.indexOf(CurrentLine)] = CountRecs[UniqueRecs.indexOf(CurrentLine)] + 1;
                        // New test - although log normally in date/time order lets not assume that and only update
                        // the date/time if we're happy it's more recent
                        if (DateNew > LastDate[UniqueRecs.indexOf(CurrentLine)]) {
                            LastDate[UniqueRecs.indexOf(CurrentLine)] = DateNew;
                        } else if (DateNew < FirstDate[UniqueRecs.indexOf(CurrentLine)]) {
                            FirstDate[UniqueRecs.indexOf(CurrentLine)] = DateNew;
                        }
                    // Record not in array - write as long as there's an IP Address
                    } else {
                        UniqueRecs.push(CurrentLine);
                        CountRecs.push(1);
                        FirstDate.push(DateNew);
                        LastDate.push(DateNew);
                        // if blocked/internal excluded then we've already done this test
                        if (blocked != "N" && internal != "N") {
                            var IPAdd = CurrentLine.substring(0,CurrentLine.indexOf(' '));
				            var checkedip = checkip(IPAdd,bottype);
                        }
                        //Check if there's a bot agent identifier but IP isn't in bot ranges
                        // don't bother if running in exclude mode as already checked earlier.
                        if (bottype != "ip" && bottype != "exclude") {
                            var checkedbot = checkbot(string,IPAdd,bottype);
                        }
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
                if (reccnt == 100) {
                    socket.emit('progress',totalreccnt,excludedreccnt);
                    reccnt = 0;
                }
                reccnt += 1;
                totalreccnt +=1;
            } else if ((bottype == "exclude" && checkedbot != "")
                        || (blocked == "N" && checkedip == "Blocked Address")
                        || (internal == "N" && checkedip == "Internal Address")) {
                excludedreccnt +=1;
            }
        })
        .on('close', function() {
            // Set up workbook and worksheet
            var workbook = new Excel.Workbook();
            var worksheet = workbook.addWorksheet("Error Logging");
            // Call external function to generate column headers
	        var coldef = buildcols(logtype,modetype);
            worksheet.columns = coldef;
            worksheet.getRow(1).font = { name: "Calibri", size: 11, bold: true};
            // Loop array of unique records
            var counter = 0;
            UniqueRecs.forEach(function(element){
            const rowdef = [];
            // Again additional column for IIS records
            if (logtype == 'IIS') {
                switch (modetype) {
                    case 'summstat':
                        rowdef[1] = element.substring(0,element.indexOf(' '));
                        rowdef[2] = element.substring(element.lastIndexOf(' '));
                        var nextcol = 3;
                        break;
                    case 'summurl':
                        rowdef[1] = element.substring(0,element.indexOf(' '));
                        rowdef[2] = element.substring(element.indexOf(' '));
                        var nextcol = 3;
                        break;
                    case 'summip':
                        rowdef[1] = element
                        var nextcol = 2;
                        break;
                    default:
                        rowdef[1] = element.substring(0,element.indexOf(' '));
                        rowdef[2] = element.substring(element.indexOf(' '),element.lastIndexOf(' '));
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
            })
            workbook.xlsx.writeFile("output.xlsx").then(() => {

                if (emailaddress != '') {
                    var message = {
                        from: "mitc@mnis.co.uk",
                        to: emailaddress,
                        subject: "Download of results",
                        html: "<b>Sent from IBM i</b>",
                        attachments: [{
                        path: "./output.xlsx"
                    }]
                }
                    transporter.sendMail(message, function(error, info) {
                        if (error) {
                            console.log(error);
                        }
                    });
                }
            });
            socket.emit('finished',totalreccnt,excludedreccnt);
        });
    })
})

webapp.get('/',function(req, res){
    res.render('logparse');
});

//http version of the listen
http.listen(port, function(err){
    console.log('The server is running on port: ' + port);
});