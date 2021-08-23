//Initial setup
const express = require('express');
const webapp = express();
const http = require('http').Server(webapp);
const io = require('socket.io')(http);
const port = process.env.PORT || 3007;
const fs = require('fs');
const readline = require('readline');
var Excel = require('exceljs');

webapp.use(express.static('includes'));

webapp.set('views','./src/views');
webapp.set('view engine', 'ejs');

io.on('connection', function(socket){
    console.log('we have contact');
})

webapp.get('/',function(req, res){
    res.render('logparse');
});

//http version of the listen
http.listen(port, function(err){
    console.log('The server is running on port: ' + port);
});