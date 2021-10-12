// webapp function - called when user hits submit
function logparse(){
    document.getElementById("results").value = ("");
    var socket = io();
    // Get the values the user has entered
    var logtype = (document.getElementById("logType").value);
    var modetype = (document.getElementById("modeType").value);
    var bottype = (document.getElementById("botType").value);
    if (document.getElementById("email") && document.getElementById("email").checked == true) {
        var emailaddress = (document.getElementById("emailaddress").value);
    } else {
        var emailaddress = "";
    }
    var blocked = (document.getElementById("blockedType").value);
    var internal = (document.getElementById("internalType").value);
    if (document.getElementById("excludeImages").checked == true) {
        var noimages = 'Y';
    } else {
        var noimages = 'N';
    }
    if (document.getElementById("excludeJS").checked == true) {
        var nojs = 'Y';
    } else {
        var nojs = 'N';
    }
    if (document.getElementById("excludeCSS").checked == true) {
        var nocss = 'Y';
    } else {
        var nocss = 'N';
    }
    // Disable input until we're done processing
    lockscreen();
    // First ask for check of file
    socket.emit('checkfile',logtype);
    // If we get the all clear, then process file
    socket.on('filegood', function() {
        socket.emit('procfile', logtype, modetype, bottype, emailaddress, blocked, internal, 
        noimages, nojs, nocss);
    })
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
        unlockscreen();
        if (excluded != 0) {
            document.getElementById("results").value = 
            "Processing Complete! " + totalrecs + " records included."
            + excluded + " records excluded.";
        } else {
            document.getElementById("results").value = 
            "Processing Complete! " + totalrecs + " records included."
        }
    })
    socket.on('error', function(err) {
        // if error occurred, display in results field then unlock screen
        document.getElementById("results").value = 
        err;
        unlockscreen();
    });
}

// webapp function - checkmode disables non-applicable fields for Joomla processing
function checkmode(){
    var mode = document.getElementById("logType").value;
    if (mode == 'IIS') {
        document.getElementById("modeType").disabled = false;
        document.getElementById("excludeImages").disabled = false;
        document.getElementById("excludeJS").disabled = false;
        document.getElementById("excludeCSS").disabled = false;
    }
    else {
        document.getElementById("modeType").disabled = true;
        document.getElementById("excludeImages").disabled = true;
        document.getElementById("excludeImages").checked = false;
        document.getElementById("excludeJS").disabled = true;
        document.getElementById("excludeJS").checked = false;
        document.getElementById("excludeCSS").disabled = true;
        document.getElementById("excludeCSS").checked = false;
    }
}

// webapp function - check various "only" flags and condition fields accordingly
function checkinclusion(){
    var blockedmode = document.getElementById("blockedType").value;
    var internalmode = document.getElementById("internalType").value;
    var botmode = document.getElementById("botType").value;
    if (blockedmode == 'O') {
        document.getElementById("internalType").disabled = true;
        document.getElementById("internalType").value = 'N';
        document.getElementById("botType").disabled = true;
        document.getElementById("botType").value = 'exclude';
    } else if (internalmode == 'O') {
        document.getElementById("blockedType").disabled = true;
        document.getElementById("blockedType").value = 'N';
        document.getElementById("botType").disabled = true;
        document.getElementById("botType").value = 'exclude';
    } else if (botmode == 'only') {
    document.getElementById("blockedType").disabled = true;
    document.getElementById("blockedType").value = 'N';
    document.getElementById("internalType").disabled = true;
    document.getElementById("internalType").value = 'N';
    } else {
        document.getElementById("blockedType").disabled = false;
        document.getElementById("internalType").disabled = false;
        document.getElementById("botType").disabled = false;
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

// webapp function - resetflags sets everything back to default behaviour
function resetflags() {
    document.getElementById("logType").disabled = false;
    document.getElementById("logType").value = 'Joomla';
    document.getElementById("modeType").value = 'detail';
    checkmode();
    document.getElementById("blockedType").value = 'Y';
    document.getElementById("internalType").value = 'Y';
    document.getElementById("botType").value = 'default';
    checkinclusion();
    if (document.getElementById("emailaddress") ) {
        document.getElementById("email").disabled = false;
        document.getElementById("email").checked == false;
        checkmail();
    };
    document.getElementById("submitbutton").disabled = false;
}

function lockscreen() {
    if (document.getElementById("emailaddress") ) {
        document.getElementById("emailaddress").disabled = true;
        document.getElementById("email").disabled = true;
    }
    document.getElementById("modeType").disabled = true;
    document.getElementById("botType").disabled = true;
    document.getElementById("logType").disabled = true;
    document.getElementById("submitbutton").disabled = true;
    document.getElementById("resetbutton").disabled = true;
    document.getElementById("downbutton").disabled = true;
    document.getElementById("blockedType").disabled = true;
    document.getElementById("internalType").disabled = true;
    document.getElementById("excludeImages").disabled = true;
    document.getElementById("excludeJS").disabled = true;
    document.getElementById("excludeCSS").disabled = true;
}

function unlockscreen() {
    document.getElementById("logType").disabled = false;
    if (document.getElementById("emailaddress") ) {
        document.getElementById("email").disabled = false;
        checkmail();
    }
    document.getElementById("submitbutton").disabled = false;
    document.getElementById("resetbutton").disabled = false;
    document.getElementById("downbutton").disabled = false;
    document.getElementById("blockedType").disabled = false;
    document.getElementById("internalType").disabled = false;
    document.getElementById("botType").disabled = false;
    checkmode();
    checkinclusion();
}

function download() {
    fetch('/checkdownload',{method:'POST'})
    .then(function(response) {
        if (response.ok) {
            window.open('/download');
        } else {
            document.getElementById("results").value = 
            response.statusText;           
            return;
        }
    })
    .catch(function(error) {
        document.getElementById("results").value = 
            error;           
            return;
    })
}