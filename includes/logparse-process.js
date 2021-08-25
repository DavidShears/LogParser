// Arrays for holding IPs flagged
// Will be used to build notes column
var InternalIPs = [];
var SuspectIPs = [];
var badIPs = [];
// botIPs array moved to external javascript file
var botIPs = require('./bots.js').botIPs;
var botagents = require('./bots.js').botagents;

//buildline - accepts string from readline and builds for output
function buildline(string,logtype,modetype){
	// Extract IP address
	if (logtype == 'IIS') {
		// Start of URL will be first instance of a forward slash
		// End of URL will be before the port number, normally 443/80
		// If URL is under a certain length then IIS appears to add a - before the port
		// So test for both scenarios
		var urlend = string.indexOf(' 443 ');
		if (urlend == -1) {
			var urlend = string.indexOf(' 80 ');
		}
		if (string.lastIndexOf(' - ',urlend) !== -1) {
			var urlend = string.indexOf(' - ');
		}
		var urlreq = string.substring(string.indexOf('/'),urlend);
		// IIS not displaying ? in url request so put it back in
		urlreq = urlreq.replace(" ","?");
		// Figure out where IP address is - search for 3 sets of digits
		// with a decimal inbetween, followed by a 4th set of digits.
		// Must also have 10 spaces preceeding it to not pick up host IP
		var IPStart = string.search(/(\d*\.){3}\d*(?<=( (.*)){10})/g);
		var IPAdd = string.substring(IPStart,string.indexOf(' ',IPStart));
		// Get HTTP status using Regex to find 3 digits followed by a series of 
		// 5 spaces seperated by any number of digits
		// 200 0 0 15669 344 546
		var HTTPstart = string.search(/\d{3}(?=( (\d*)){5})/g);
		var HTTPstat = string.substring(HTTPstart,HTTPstart + 3);
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
		var IPStart = string.search(/(\d*\.){3}\d*/g);
		var IPAdd = string.substring(IPStart,string.indexOf('	',IPStart));
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
		coldef[counter] = { header: "IP Address", key:"IPADD"};
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
		coldef[counter] = { header: "First Found", key:"FIRST"};
		counter++;
		coldef[counter] = { header: "Last Found", key:"LAST"};
		counter++;
		coldef[counter] = { header: "Notes", key:"NOTES"};
	} else {
		coldef[counter] = { header: "IP Address", key:"IPADD"}
		counter++;
		coldef[counter] = { header: "Record", key:"RECORD"}
		counter++;
		coldef[counter] = { header: "Times Found", key:"COUNT"}
		counter++;
		coldef[counter] = { header: "First Found", key:"FIRST"}
		counter++;
		coldef[counter] = { header: "Last Found", key:"LAST"}
		counter++;
		coldef[counter] = { header: "Notes", key:"NOTES"}
	}
	return (coldef)
}

function checkip(IPaddress,bottype){
	// Allow a 3 part match i.e. 127.0.0.* - currently only for bots
	var subnet = IPaddress.substring(0,IPaddress.lastIndexOf('.') + 1)
	if (InternalIPs.includes(IPaddress) ) {
		return("Internal Address");
	} else if (SuspectIPs.includes(IPaddress) ) {
		return("Monitored Address");
	} else if (badIPs.includes(IPaddress) ) {
		return("Blocked Address");
	} else if (botIPs.includes(IPaddress) && bottype != "agent" && bottype != "exclude") {
		return("Bot Address");
	} else if (botIPs.includes(subnet) && botIPs[botIPs.indexOf(subnet)].substr(-1) == '.' 
				&& bottype != "agent" && bottype != "exclude"){
		return ("Bot Subnet");
	} else {
		return("");
	}
};


//Debugging function - check for various bot agents and see if we already have the IP address on record
function checkbot(string,IPAdd,bottype) {
	let i = 0;
	while (botagents[i]) {
		var tempstring = string.toLowerCase();
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

// webapp function - called when user hits submit
function logparse(){
	var totalrecs = 0;
  	document.getElementById("results").value = ("");
	var socket = io();
	// Get the values the user has entered
  	var logtype = (document.getElementById("logType").value);
	var modetype = (document.getElementById("modeType").value);
	var bottype = (document.getElementById("botType").value);
	var emailaddress = (document.getElementById("emailaddress").value);
	var blocked = 'Y';
	var internal = 'Y';
	if (document.getElementById("blocked").checked == true) {
		var blocked = 'N';
	}
	if (document.getElementById("internal").checked == true) {
		var internal = 'N';
	}
	// Disable input until we're done processing
	document.getElementById("emailaddress").disabled = true;
	document.getElementById("email").disabled = true;
	document.getElementById("modeType").disabled = true;
	document.getElementById("botType").disabled = true;
	document.getElementById("logType").disabled = true;
	document.getElementById("submitbutton").disabled = true;
	document.getElementById("blocked").disabled = true;
	document.getElementById("internal").disabled = true;

  	socket.emit('procfile', logtype, modetype, bottype, emailaddress, blocked, internal);

  	socket.on('progress', function(totalrecs,excluded) {
		// report on excluded records if there are any
		if (excluded != 0) {
			document.getElementById("results").value = (totalrecs + " records read, "
			+ excluded + " records excluded");
		} else {
    		document.getElementById("results").value = (totalrecs + " records read");
		}
  	})
  	socket.on('finished', function(totalrecs,excluded) {
		// once complete put screen back to how it should be
		document.getElementById("logType").disabled = false;
		document.getElementById("email").disabled = false;
		document.getElementById("submitbutton").disabled = false;
		document.getElementById("blocked").disabled = false;
		document.getElementById("internal").disabled = false;
		document.getElementById("botType").disabled = false;
		checkmode();
		checkmail();
		if (excluded != 0) {
    		document.getElementById("results").value = 
    		"Processing Complete! " + totalrecs + " records included."
			+ excluded + " records excluded.";
		} else {
			document.getElementById("results").value = 
    		"Processing Complete! " + totalrecs + " records included."
		}
  	})
}

// webapp function - checkmode disables non-applicable fields for Joomla processing
function checkmode(){
    var mode = document.getElementById("logType").value;
    if (mode == 'IIS') {
        document.getElementById("modeType").disabled = false;
    }
    else {
		document.getElementById("modeType").disabled = true;
    }
}

// webapp function - checkmail toggles email address field
function checkmail(){
    if (document.getElementById("email").checked == true) {
        document.getElementById("emailaddress").disabled = false;
		document.getElementById("emailaddress").placeholder = "please enter your email address";
    }
    else {
		document.getElementById("emailaddress").disabled = true;
		document.getElementById("emailaddress").placeholder = "";
		document.getElementById("emailaddress").value = "";
    }
}

module.exports = {checkip,checkbot,buildline,buildcols};