// Readline

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: fs.createReadStream('error.php'),
    output: process.stdout,
    terminal: false
});

var UniqueRecs = [];

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

		} else {
			UniqueRecs.push(CurrentLine);
		}
	}
})
.on('close', function() {
	console.log(UniqueRecs);
});