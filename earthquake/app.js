/*---------- BASIC SETUP ----------*/
var express = require('express'),		// helper for setting up web framework
	socket = require("socket.io"), 
	five = require("johnny-five");
	
var app = express();						// our Express app
var PORT = 4000;

// Express server
app.use(function(req, res, next) {
    // Setup a Cross Origin Resource sharing
    // See CORS at https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('incoming request from ---> ' + ip);
    var url = req.originalUrl;
    console.log('### requesting ---> ' + url);	// Show the URL user just hit by user
    next();
});

//will look inside this folder for front end of site
app.use('/', express.static(__dirname + '/public'));

/*------------------------------ SOCKET.IO SETUP ------------------------------*/

var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(PORT, function(){
    console.log('Express server is running at ' + PORT); 
})

/*------------------------------ JOHNNY-FIVE SETUP ------------------------------*/

var isConnected = false
var board = new five.Board()

board.on('ready', function () {
  isConnected = true
  console.log("board connected!")
})

setTimeout(function () {
  if (!isConnected) {
    console.log("no board connected")
  }
}, 5000)

/*----------------------------- APP -----------------------------*/

io.on('connection', function(socket){
    console.log("new connection!");


    //key value pair
    // 1 - a string that identifies the message
    // 2 - message(data)

    //socket refers to one user
    // socket.emit('welcome', 'Welcome! Your id is ' + socket.id);

    //io.sockets is everyone
    // io.sockets.emit('hey-everybody', 'hey everybody please welcome ' + socket.id);

    //listeners
    // socket.on('led-on', function(data){
    //     // console.log("button pressed")
    //     // ledon(data);
    // })

    socket.on('disconnect', function(data){
    	console.log("")
        // io.sockets.emit('msg-to-clients', {
        //     id: socket.id,
        //     msg: socket.id + ' has just disconnected'
        // })
    });

})

/* ------------------------------------------------------------------ */