// Arrays for holding IPs flagged
// Will be used to build notes column
var InternalIPs = [];
var SuspectIPs = [];
var badIPs = [];
// botIPs array moved to external javascript file
var botIPs = require('./bots.js').botIPs;
var botagents = require('./bots.js').botagents;
var susURLs = require('./suspecturls.js').susURLs;

//buildline - accepts string from readline and builds for output
function buildline(string,logtype,modetype){
	// Extract IP address
	var IPAdd = getip(string,logtype);
	if (logtype == 'IIS') {
		// Start of URL will be first instance of a forward slash
		// End of URL will be before the port number, normally 443/80
		// If URL is under a certain length then IIS appears to add a - before the port
		// So test for both scenarios
		// 2021/12/23 - Rework checking for - to make a more accurate match if there are multiple instances
		var urlend = string.indexOf(' 443 ');
		if (urlend == -1) {
			var urlend = string.indexOf(' 80 ');
		}
		if (string.lastIndexOf(' - 443',urlend) !== -1 || string.lastIndexOf(' - 80',urlend) !== -1) {
		/* if (string.lastIndexOf(' - ',urlend) !== -1) { */
			/* var urlend = string.indexOf(' - '); */
			var urlend = string.lastIndexOf(' - ',urlend);
		}
		var urlreq = string.substring(string.indexOf('/'),urlend);
		// IIS not displaying ? in url request so put it back in
		urlreq = urlreq.replace(" ","?");
		// Get HTTP status using Regex to find 3 digits followed by a series of 
		// 5 spaces seperated by any number of digits
		// 200 0 0 15669 344 546
		// 2021/09/16 - add a preceding white character to ensure we don't pick up a port
		// on the website address
		var HTTPstart = string.search(/\s\d{3}(?=( (\d*)){5})/g);
		var HTTPstat = string.substring(HTTPstart + 1,HTTPstart + 4);
		// Build CurrentLine from the various elements we've picked up
		// If a mode has been specified, use that
		switch (modetype) {
			case 'summstat':
				CurrentLine = (IPAdd + ' ' + HTTPstat);
				break;
			case 'summurl':
				CurrentLine = (IPAdd + ' ' + urlreq);
				break;
			case 'summip':
				CurrentLine = (IPAdd);
				break;
			default:
				CurrentLine = (IPAdd + ' ' + urlreq + ' ' + HTTPstat);
				break;
		}
	// else use Joomla logic
	} else {
		// Handle older version of Joomla logging
		if (string.indexOf('Joomla FAILURE') !== -1) {
			// Add 43 characters to length - gets us to error message
			nextpos = IPAdd.length + 43;
		} else {
			// Add 46 characters to length - gets us to error message
			nextpos = IPAdd.length + 46;
		}
		CurrentLine = (IPAdd + ' ' + string.substring(nextpos));
	}
	if (IPAdd != '' && IPAdd != ' ') {
		return(CurrentLine);
	} else {
		return("");
	}
}

//buildcols - build column array and return
function buildcols(logtype,modetype){
	var coldef = [];
	var counter = 0;
	// If in IIS mode then include column for HTTP status code
	if (logtype == 'IIS') {
		// Build column headings depending on mode, all require IP address
		coldef[counter] = { header: "IP Address", key:"IPADD", width: 15};
		counter++;
		switch (modetype) {
			case 'summstat':
				coldef[counter] = { header: "HTTP Status", key:"HTTPSTAT"};
				counter++;
				break;
			case 'summurl':
				coldef[counter] = { header: "Record", key:"RECORD"};
				counter++;
				break;
			case 'summip':
				break;
			default:
				coldef[counter] = { header: "Record", key:"RECORD"};
				counter++;
				coldef[counter] = { header: "HTTP Status", key:"HTTPSTAT"};
				counter++;
				break;
		}
		// All then have the final 4 columns the same
		coldef[counter] = { header: "Times Found", key:"COUNT"};
		counter++;
		coldef[counter] = { header: "First Found", key:"FIRST", width: 11};
		counter++;
		coldef[counter] = { header: "Last Found", key:"LAST", width: 11};
		counter++;
		coldef[counter] = { header: "Notes", key:"NOTES"};
	} else {
		coldef[counter] = { header: "IP Address", key:"IPADD", width: 15}
		counter++;
		coldef[counter] = { header: "Record", key:"RECORD"}
		counter++;
		coldef[counter] = { header: "Times Found", key:"COUNT"}
		counter++;
		coldef[counter] = { header: "First Found", key:"FIRST", width: 11}
		counter++;
		coldef[counter] = { header: "Last Found", key:"LAST", width: 11}
		counter++;
		coldef[counter] = { header: "Notes", key:"NOTES"}
	}
	return (coldef)
}

function checkip(IPaddress,bottype){
	// Allow a 3 part match i.e. 127.0.0.* - currently only for bots
	var subnet = IPaddress.substring(0,IPaddress.lastIndexOf('.') + 1)
	if (InternalIPs.includes(IPaddress) ) {
		return("Internal Address!");
	} else if (SuspectIPs.includes(IPaddress) ) {
		return("Monitored Address!");
	} else if (badIPs.includes(IPaddress) ) {
		return("Blocked Address!");
	} else if (botIPs.includes(IPaddress) && bottype != "agent" && bottype != "exclude") {
		return("Bot Address!");
	} else if (botIPs.includes(subnet) && botIPs[botIPs.indexOf(subnet)].substr(-1) == '.' 
				&& bottype != "agent" && bottype != "exclude"){
		return ("Bot Subnet!");
	} else {
		return("");
	}
};

//Check for various bot agents and see if we already have the IP address on record
function checkbot(string,IPAdd,bottype) {
	let i = 0;
	var tempstring = string.toLowerCase();
	while (botagents[i]) {
		if (tempstring.indexOf(botagents[i]) != -1) {
			if (bottype != "agent" && bottype != "exclude"){
				var found = checkip(IPAdd);
				if (found == '') {
					return("New " + botagents[i] + " address!");
				} else {
					return(botagents[i] + " address!");
				}
			} else {
				return(botagents[i] + " address!");
			}
		}
		i++;
	}
	return("");
}

function getip(string,log) {
	if (log == "IIS") {
		// Figure out where IP address is - search for 3 sets of digits
		// with a decimal inbetween, followed by a 4th set of digits.
		// Must also have 10 spaces preceeding it to not pick up host IP
		// 2021-12-21 Reduce from 10 spaces to 5 to cope with more IIS log formats
		var IPStart = string.search(/(\d{1,3}\.){3}\d{1,3}(?<=( (.*)){5})/g);
		var IPAdd = string.substring(IPStart,string.indexOf(' ',IPStart));
	} else {
		// Joomla only has a single IP address in the record, so no need for
		// additional checks. Uses a tab rather than a space after the IP address.
		var IPStart = string.search(/(\d{1,3}\.){3}\d{1,3}/g);
		var IPAdd = string.substring(IPStart,string.indexOf('	',IPStart));
	}
	return IPAdd;
}

// New function to handle checking inclusion (my head hurt having it in (web)app.js )
// Also splitting into individual if statements for now to make it easier to read
function checkinclude(bottype,blocked,internal,checkedbot,checkedip) {
	// excluding bots and checkbot found something
	if ((bottype == 'exclude' || bottype == "excludesus") && checkedbot != "") {
		return('N')
	}
	// excluding suspect bots and checkip found something
	// checkbot finding something should be caught above
	if ((bottype == 'excludesus') && (checkedip.indexOf('Bot') != -1)) {
		return('N')
	}
	// or we're only including bots
	if ((bottype == 'only') && checkedbot == '') {
		return('N')
	}
	// Excluding blocked IPs?
	if (blocked == 'N' && checkedip == 'Blocked Address!') {
		return('N')
	}
	// Only blocked IPs?
	if (blocked == 'O' && checkedip != 'Blocked Address!') {
		return('N')
	}
	// Excluding internal IPs?
	if (internal == 'N' && checkedip == 'Internal Address!') {
		return('N')
	}
	// Only blocked IPs?
	if (internal == 'O' && checkedip != 'Internal Address!') {
		return('N')
	}
	// otherwise lets return a Y
	return('Y')
}

// New function to handle checking exclusion based on images/js/css flags
function checkexclude(string,noimages,nojs,nocss) {
		// Below borrowed from buildline routine
		// may move checkexclude within it once flags are added to commandline
		// but for now since this is web-only we'll do it standalone.
		var urlend = string.indexOf(' 443 ');
		if (urlend == -1) {
			var urlend = string.indexOf(' 80 ');
		}
		if (string.lastIndexOf(' - ',urlend) !== -1) {
			var urlend = string.indexOf(' - ');
		}
		var urlreq = string.substring(string.indexOf('/'),urlend);
		var tempstring = urlreq.toLowerCase();
		if (tempstring.indexOf('.js') != -1 && nojs == 'Y') {
			return('Y');
		}
		if (tempstring.indexOf('.css') != -1 && nocss == 'Y') {
			return('Y');
		}
		if ((tempstring.indexOf('.png') != -1 ||
		tempstring.indexOf('.gif') != -1 ||
		tempstring.indexOf('.jpg') != -1 ||
		tempstring.indexOf('.jpeg') != -1 ||
		tempstring.indexOf('.svg') != -1 )
		&& noimages == 'Y') {
			return('Y');
		}
		return('N');
}

// Check whether the url includes a substring on the suspect list
function checksusurl(url) {
	var urlreq = url.toLowerCase();
	let i = 0;
	while (susURLs[i]) {
		if (urlreq.indexOf(susURLs[i]) != -1) {
			return "Y";
		}
		i++;
	}
	return("N");
}

module.exports = {checkip,checkbot,buildline,buildcols,getip,checkinclude,checkexclude,checksusurl};