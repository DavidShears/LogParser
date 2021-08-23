function logparse(){
	var socket = io();
	// Get the values the user has entered
  var logtype = (document.getElementById("logType").value);
	var modetype = (document.getElementById("modeType").value);
	var bottype = (document.getElementById("botType").value);
  fetch('/process=' + logtype + '-' + modetype + '-' + bottype,  {method:'POST'})
}

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