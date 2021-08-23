// Arrays for holding IPs flagged
// Will be used to build notes column
var InternalIPs = [];
var SuspectIPs = [];
var badIPs = [];
// botIPs array moved to external javascript file
var botIPs = require('./bots.js').botIPs;
var botagents = require('./bots.js').botagents;


// Main function - called when user hits submit
function logparse(){
  var totalrecs = 0;
  document.getElementById("results").value = ("");
	var socket = io();
	// Get the values the user has entered
  var logtype = (document.getElementById("logType").value);
	var modetype = (document.getElementById("modeType").value);
	var bottype = (document.getElementById("botType").value);
  socket.emit('procfile', logtype, modetype, bottype);

  socket.on('progress', function(reccnt) {
    totalrecs = totalrecs + reccnt;
    console.log('total records: ' + totalrecs);
    document.getElementById("results").value = (totalrecs + " records read");
  })
  socket.on('finished', function(reccnt) {
    document.getElementById("results").value = 
    document.getElementById("results").value + ", processing complete!";
  })
}

// checkmode disables non-applicable fields for Joomla processing
function checkmode(){
    var mode = document.getElementById("logType").value;
    if (mode == 'IIS') {
        document.getElementById("modeType").disabled = false;
		document.getElementById("botType").disabled = false;
    }
    else {
		document.getElementById("modeType").disabled = true;
		document.getElementById("botType").disabled = true;
    }
}

function checkip(IPaddress){
	// Allow a 3 part match i.e. 127.0.0.* - currently only for bots
	var subnet = IPaddress.substring(0,IPaddress.lastIndexOf('.') + 1)
	if (InternalIPs.includes(IPaddress) ) {
		return("Internal Address");
	} else if (SuspectIPs.includes(IPaddress) ) {
		return("Monitored Address");
	} else if (badIPs.includes(IPaddress) ) {
		return("Blocked Address");
	} else if (botIPs.includes(IPaddress) && bottype != "agent") {
		return("Bot Address");
	} else if (botIPs.includes(subnet) && botIPs[botIPs.indexOf(subnet)].substr(-1) == '.' && bottype != "agent"){
		return ("Bot Subnet");
	} else {
		return("");
	}
};


//Debugging function - check for various bot agents and see if we already have the IP address on record
function checkbot(string,IPAdd) {
	let i = 0;
	while (botagents[i]) {
		var tempstring = string.toLowerCase();
		if (tempstring.indexOf(botagents[i]) != -1) {
			if (bottype != "agent"){
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

module.exports = {checkip,checkbot};