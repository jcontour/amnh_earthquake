/*---------------------------------------- NODE SETUP ----------------------------------------*/
var express = require('express'),
	socket = require("socket.io"), 
	five = require("johnny-five");
	
var app = express();
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

/*----------------------------------------  SETUP ----------------------------------------*/

var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(PORT, function(){
    console.log('Express server is running at ' + PORT); 
})

function remap_vals(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

var isConnected = false
var board = new five.Board()
var time_pot_val = 0;
var size_pot_val = 0; 
var curr_time_val, curr_size_val;

/*----------------------------------------  SOCKET.IO APP ----------------------------------------*/

board.on('ready', function () {         // ------------------------------ JOHNNY-FIVE SETUP
    isConnected = true
    console.log("board connected!")

    size_pot = new five.Sensor({
        pin: "A0",
        freq: 250
    });

    time_pot = new five.Sensor({
        pin: "A1",
        freq: 250
    });

    board.repl.inject({
        pot: size_pot, 
        pot: time_pot
    });
})

io.on('connection', function(socket){
    console.log("socket connection!");

    if (!isConnected) {
        console.log("no board connected")
        socket.emit("knob", false)
    } else {
        socket.emit("knob", true)
        time_pot.on("data", function() {
            curr_time_val = Math.floor(remap_vals(this.value, 0, 1023, 1, 6))
            if (time_pot_val !== curr_time_val){
                time_pot_val = curr_time_val;
                console.log( {time: time_pot_val, size: size_pot_val} )
                socket.emit('filter', {time: time_pot_val, size: size_pot_val})
            }
        });

        size_pot.on("data", function() {
            curr_size_val = Math.floor(remap_vals(this.value, 0, 1023, 1, 6))
            if (size_pot_val !== curr_size_val){
                size_pot_val = curr_size_val;
                console.log( {time: time_pot_val, size: size_pot_val} )
                socket.emit('filter', {time: time_pot_val, size: size_pot_val})
            }
        });
    }

    // LISTENERS
    socket.on('disconnect', function(data){
        console.log("disconnected")
    });

})


/* ---------------------------------------------------- ***END*** ---------------------------------------------------- */