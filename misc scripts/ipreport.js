// Script to submit report to abuseIPDB

const fetch = require("node-fetch");
var argv = require('yargs/yargs')(process.argv.slice(2)).argv;

// --ip=127.0.0.1 --cats=8,23 --comment="test comments"

const params = new URLSearchParams();
params.append('ip',argv.ip);
params.append('categories',argv.cats);
params.append('comment',argv.comment);

console.log(params);

async function report() {

const res = await fetch('https://api.abuseipdb.com/api/v2/report', {
    method: 'post',
    // Line below is where you can put the API key you get from the website
	headers: {'Key': '',
    'Accept': 'application/json'},
    body: params
})
const data = await res.json();

console.log(data);
}

report();