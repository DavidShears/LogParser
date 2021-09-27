//Initial setup
const express = require('express');
const webapp = express();
const http = require('http').Server(webapp);
const io = require('socket.io')(http);
const port = process.env.PORT || 3007;
const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');
// Test whether nodemailer is installed
try {
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        host:"172.16.0.25",
        port: 25,
        tls: {
            rejectUnauthorized: false
        }
    });
    var nodemail = "Y";
} catch (er) {
    var nodemail = "N";
}
// Test whether express-fileupload is installed
try {
    var fileupload = require('express-fileupload');
    var fileup = "Y";
} catch (er) {
    var fileup = "N";
}

var functions = require('./includes/logparse-process.js');
var checkip = functions.checkip;
var checkbot = functions.checkbot;
var buildline = functions.buildline;
var buildcols = functions.buildcols;
var getip = functions.getip;
var checkinclude = functions.checkinclude;

webapp.use(express.static('includes'));
if (fileup == 'Y') {
    webapp.use(fileupload());
}
webapp.set('views','./src/views');
webapp.set('view engine', 'ejs');

io.on('connection', function(socket){
    var reccnt = 0;
    var totalreccnt = 0;
    var exccnt = 0;
    var excludedreccnt = 0;

    socket.on('checkfile',(logtype) => {
        if ( (logtype == 'IIS' && fs.existsSync('IIS.log') )
        || (logtype != 'IIS' && fs.existsSync('error.php') ) ) {
            // Test if output file is locked - if so no point running
            fs.open('./output.xlsx','r+', function(err,fd) {
	            if (err && err.code === 'EBUSY') {
		            socket.emit('error','Output file locked - try again later');
	            } else if (err == null || err.code != 'ENOENT') {
		            fs.close(fd);
                    socket.emit('filegood');
	            } else {
                    socket.emit('filegood');
                }
            })
            } else {
                socket.emit('error','log file does not exist!');
            }
    });


    socket.on('procfile',(logtype,modetype,bottype,emailaddress,blocked,internal) => {

        if (logtype == 'IIS') {
                var rl = readline.createInterface({
                    input: fs.createReadStream('IIS.log'),
                    output: process.stdout,
                    terminal: false
                })
        } else {
            // Check if file exists before building readline interface
                var rl = readline.createInterface({
                    input: fs.createReadStream('error.php'),
                    output: process.stdout,
                    terminal: false
                })
        };

        // Test if output file is locked - if so no point running
        fs.open('./output.xlsx','r+', function(err,fd) {
	        if (err && err.code === 'EBUSY') {
		        socket.emit('error','Output file locked - try again later');
	        } else if (err == null || err.code != 'ENOENT') {
		        fs.close(fd);
	        }
        })
        var UniqueRecs = [];
        var CountRecs = [];
        var FirstDate = [];
        var LastDate = [];
        var Notes = [];    

        rl.on('line', (string) => {
            // Check ip & bot now to allow us to update the notes field if required
            var IPAdd = getip(string,logtype);
            var checkedip = checkip(IPAdd,bottype);
            var checkedbot = checkbot(string,IPAdd,bottype);
            // First test - remove header records by testing for #
            if (string.indexOf('#') !== 0) {
                var checkedinclude = checkinclude(bottype,blocked,internal,checkedbot,checkedip)
            }
            // Now if we got a Y back then lets proceed
            if (checkedinclude == 'Y')
                {
                var CurrentLine = buildline(string,logtype,modetype);
                if (CurrentLine != "") {
                    // Test if record is already in array - if it is then increment counter and update last date
                    // If it isn't then add to arrays and stamp first date
                    var DateNew = new Date(string.substring(0,19));
                    if (UniqueRecs.includes(CurrentLine)) {
                        CountRecs[UniqueRecs.indexOf(CurrentLine)] = CountRecs[UniqueRecs.indexOf(CurrentLine)] + 1;
                        // New test - although log normally in date/time order lets not assume that and only update
                        // the date/time if we're happy it's more recent
                        if (DateNew > LastDate[UniqueRecs.indexOf(CurrentLine)]) {
                            LastDate[UniqueRecs.indexOf(CurrentLine)] = DateNew;
                        } else if (DateNew < FirstDate[UniqueRecs.indexOf(CurrentLine)]) {
                            FirstDate[UniqueRecs.indexOf(CurrentLine)] = DateNew;
                        }
                        // New test - check whether we now have an ID on an IP Address that we didn't previously
                        if ((checkedip != "" || checkedbot != "") && Notes[UniqueRecs.indexOf(CurrentLine)] == "") {
                            if (checkedip != "" && checkedbot != "") {
                                Notes[UniqueRecs.indexOf(CurrentLine)] = (checkedip + ", " + checkedbot);
                            } else if (checkedip == "") {
                                Notes[UniqueRecs.indexOf(CurrentLine)] = (checkedbot);
                            } else if (checkedbot == "") {
                                Notes[UniqueRecs.indexOf(CurrentLine)] = (checkedip);
                            }
                        }
                    // Record not in array - write as long as there's an IP Address
                    } else {
                        UniqueRecs.push(CurrentLine);
                        CountRecs.push(1);
                        FirstDate.push(DateNew);
                        LastDate.push(DateNew);
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
                if (reccnt == 100 || exccnt == 100) {
                    socket.emit('progress',totalreccnt,excludedreccnt);
                    reccnt = 0;
                    exccnt = 0;
                }
                reccnt += 1;
                totalreccnt +=1;
            } else if (string.indexOf('#') !== 0) {
                exccnt +=1;
                excludedreccnt +=1;
                if (reccnt == 100 || exccnt == 100) {
                    socket.emit('progress',totalreccnt,excludedreccnt);
                    reccnt = 0;
                    exccnt = 0;
                }
            }
        })
        .on('close', function() {
            // Set up workbook and worksheet
            var workbook = new Excel.Workbook();
            // Minor thing - Joomla is specifically error logging, IIS isn't
	        if (logtype == 'IIS') {
		        var worksheet = workbook.addWorksheet("Traffic Logging");
	        } else {
		        var worksheet = workbook.addWorksheet("Error Logging");
	        }
            // Call external function to generate column headers
	        worksheet.columns = buildcols(logtype,modetype);
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
                // If email address is not blank and nodemailer installed then attempt email
                if (emailaddress != '' && nodemail == 'Y') {
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
                socket.emit('finished',totalreccnt,excludedreccnt);
            })
            // Add error handling, primarily for if output file is locked
            .catch(err => {
                socket.emit('error',err.message);
            });
        });
    })
})

// Default page display
webapp.get('/',function(req, res){
    res.render('logparse', {
        nodemail,
        fileup
    });
});

// Check the output exists before running a download request
webapp.post('/checkdownload',function(req, res) {
    if (fs.existsSync('output.xlsx') ) {
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
})

// Handle download request once checkdownload confirms available
webapp.get('/download',function(req, res) {
    res.download('./output.xlsx', 'output.xlsx', function(err) {
        if (err) {
            console.log(err);
        }
    });
});

// Upload function for new log file
webapp.post('/', (req, res) => {
    if (req.files) {
        const file = req.files.file
        const fileName = file.name
        // Check that filename is one we want
        if (fileName == 'IIS.log' || fileName == 'error.php') {
            file.mv(`${__dirname}/${fileName}`, err => {
                if (err) {
                    console.log(err)
                } else {
                    res.render('logparse', {
                        nodemail,
                        fileup
                    });
                }
            })
        } else {
            res.render('logparse', {
                nodemail,
                fileup
            });
        }
    }
})

//http version of the listen
http.listen(port, function(err){
    console.log('The server is running on port: ' + port);
});