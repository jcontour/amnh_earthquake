var express		= require('express'),
	bodyParser	= require('body-parser'),
    http        = require('http');
var app = express();						
var PORT = 4000;

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));// parse application/x-www-form-urlencoded
app.use(bodyParser.json());							// parse application/json

// Express server
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('incoming request from ---> ' + ip);
    var url = req.originalUrl;
    console.log('### requesting ---> ' + url);
    next();
});

app.use('/', express.static(__dirname + '/public'));


// -----> Socket.io setup
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(PORT, function(){
    console.log('Express server is running at ' + PORT);
});

// var getData = function(callback){

//     http.get("http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson", function(res) {

//       console.log("Got response: " + res);
//       callback(res);
//     //   if(res.statusCode == 200) {
//     //     console.log("Got value: " + res);
//     //   }

//     // }).on('error', function(e) {
//     //   console.log("Got error: " + e.message);

//     });
// }


io.on('connection', function(socket) {
    /*––––––––––– SOCKET.IO starts here –––––––––––––––*/

    // .on(identifier, callback(data))      listens to 
    // .emit(identifier, data)              sends data to every user
    // .broadcast.emit(identifier, data)    sends data to every user,
    //                                      except the newly created
    
    console.log('A new user has connected: ' + socket.id);
    
    // getData(function(mapData){
        // socket.emit('init', mapData);
        socket.emit('init');
    // })

    // listeners
    socket.on('disconnect', function() {
        io.sockets.emit('bye', 'See you, ' + socket.id + '!');
    });

    socket.on('msg-to-server', function(data) {
        io.sockets.emit('msg-to-clients', {
            id: socket.id,
            msg: data
        });
    });
    /*--------------------------------------------------------------*/
});