// webapp function - called when user hits submit
function logparse(){
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