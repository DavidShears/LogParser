// These are substrings which if discovered in the URL should be flagged for closer investigation
// primarily as it might indicate bad intent on the part of the requester
var susURLs = [
    "admin",
    "alfacgiapi",
    "author=",
    "backoffice",
    "config",
    "credentials",
    "database",
    "download",
    "evil.php",
    "githubusercontent",
    "gutsevich",
    "install",
    "login",
    "passwd",
    "password",
    "phpinfo",
    "phpmyadmin",
    "pma",
    "upload",
    "wlwmanifest",
    "xmlrpc",
    "\%20",
    ".env"
];
module.exports = {susURLs}