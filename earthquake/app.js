/*---------------------------------------- NODE SETUP ----------------------------------------*/
var express = require('express'),
	socket = require("socket.io"), 
	five = require("johnny-five"),
    cors = require('cors'),
    request = require('request'),
    fs = require('fs');
	
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

app.use(cors())
// var whitelist = ['http://ds.iris.edu']
// var corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// }

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
    socket.on('get-waveform', function(data, fn){
        
        request({
            url: "http://service.iris.edu/fdsnws/event/1/query?format=text&eventid="+data.id+"&nodata=404"      //find the info about the earthquake
          }, function(error, response, body){
            var list = body.split("|")
            var time = list[13]   
            var mag = list[22]                                                                              //get the start time data
            console.log(time, mag)
            var date = time.split("T")
            var pngurl = "http://service.iris.edu/irisws/timeseries/1/query?output=plot&width=550&height=250&net=IU&sta=HNR&loc=00&cha=BHZ&starttime="+time+"&duration=1800"
            request(pngurl).pipe(fs.createWriteStream("public/data/"+data.id+"_waveform.png"))                  //download the waveform image tot data folder
            fn({time: date[0], mag: mag})
          })
        
    })

    socket.on('get-url', function(data){
        request({
            url: data.url
          }, function(error, response, body){
            // console.log('--------------------------------',body)
            // res.send(body);
            socket.emit('return-requested-data', {which: data.which, body: body})
          })
    })

    socket.on('disconnect', function(data){
        console.log("disconnected")
    });

})


/* ---------------------------------------------------- ***END*** ---------------------------------------------------- */