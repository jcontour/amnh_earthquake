const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

let mainWindow

const {ipcMain} = require('electron')

var cors = require('cors'),
    request = require('request'),
    fs = require('fs'),
    d3 = require('d3');

/*----------------------------------------  Johhny-Five */

var five = require("johnny-five")

var isConnected = false
var board = new five.Board()
var time_pot, size_pot;
var time_pot_val = 0;
var size_pot_val = 0; 
var curr_time_val, curr_size_val;

function remap_vals(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

board.on('ready', function () {
  isConnected = true
  console.log("board connected!")

  size_pot = new five.Sensor({
      pin: "A1",
      freq: 250
  });

  time_pot = new five.Sensor({
      pin: "A0",
      freq: 250
  });

  board.repl.inject({
      pot: size_pot, 
      pot: time_pot
  });

  time_pot.on("data", function() {
    curr_time_val = Math.floor(remap_vals(this.value, 0, 1023, 6, 1))
    if (time_pot_val !== curr_time_val){      // if value has changed, send it to the front for filtering
      time_pot_val = curr_time_val;
      var pot_data = {time: time_pot_val, size: size_pot_val}
      mainWindow.webContents.send('filter', pot_data );
    }
  });

  size_pot.on("data", function() {
    curr_size_val = Math.floor(remap_vals(this.value, 0, 1023, 6, 1))
    if (size_pot_val !== curr_size_val){    // if value has changed, send it to the front for filtering
      size_pot_val = curr_size_val;
      var pot_data = {time: time_pot_val, size: size_pot_val}
      mainWindow.webContents.send('filter', pot_data );
    }
  });
})

/*----------------------------------------  Globe Data */

function checkHowManyBackups(folder) {
  fs.readdir('public/data/'+folder, function (err, files) {         // reading back up file dir
    if (err) {
        throw err;
    } 
    files.sort();
    files.reverse();
    if (files.length > 5) {                                         // if there's more than 5, delete the oldest one
      fs.unlink('public/data/'+folder+"/"+files[files.length-1], (err) => {
        if (err) throw err;
        // console.log('successfully deleted ', files[files.length-1]);
      });
    }
  })
}

function checkGlobeData(data) {
  var new_data = data[0].features;
  var old_data = data[1].features;

  if (new_data[0].id != old_data[0].id){                                // if the two most recent eqs in each file don't match
    var eqs_string = JSON.stringify(old_data)
    var currtime = Date.parse(new Date)
    fs.writeFile('public/data/eq_data_backup/backup_'+ currtime +'.json', eqs_string, (err) => {    // back up the current data
      if (err) throw err;
      // console.log("successfully backed up old eqs")
      checkHowManyBackups("eq_data_backup")
    })
    var new_eqs_string = JSON.stringify(new_data)
    fs.writeFile('public/data/earthquake_data.json', eqs_string, (err) => {                 // save new current data
      if (err) throw err;
      // console.log("successfully cached new eqs")
    })
  } else {
    // console.log("no new earthquakes")
  }
}

function getGlobeData(){
  fs.readFile('public/data/history.json', (err, history) => {   // get history data first
    var hist = JSON.parse(history);
    request({
      url: "http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"      //find the info about the earthquake
    }, function(error, response, body){
      if (error) {                                                                            // if there's an error, use the saved data
        fs.readFile('public/data/earthquake_data.json', (err, eqs) => {
          // console.log("got error, using cached data")
          mainWindow.webContents.send('return-globe-data', [hist, eqs])
        })
      } else {
        var eqdata = JSON.parse(body)                                                         // otherwise, use the new data and then cache it
        mainWindow.webContents.send('return-globe-data', [eqdata, hist])
        checkGlobeData([eqdata, hist])
      }
    }) 
  })
}

/*----------------------------------------  RETM */

function findLatLon(loc, callback){             // get location data of place from google
 d3.json("http://maps.googleapis.com/maps/api/geocode/json?address=" + loc + "&sensor=true", 
  function(err, res){
     callback(err, res['results'][0]['geometry']['location'] )
  })
}

function findWaveForm(id, callback){
  request({
      url: "http://service.iris.edu/fdsnws/event/1/query?format=text&eventid="+id+"&nodata=404"      //find the info about the earthquake
    }, function(error, response, body){
      var list = body.split("|")
      var time = list[13]   
      var mag = list[22]                                                                              //get the start time data
      var date = time.split("T")
      var pngurl = "http://service.iris.edu/irisws/timeseries/1/query?output=plot&width=550&height=250&net=IU&sta=HNR&loc=00&cha=BHZ&starttime="+time+"&duration=1800"
      request(pngurl).pipe(fs.createWriteStream("public/data/"+id+"_waveform.png"))                  //download the waveform image tot data folder
      callback(error, {time: date[0], mag: mag})
    })  
}

function getRETMinfo(data) {

  var q = d3.queue(1);
  for (var i = 0; i < data.length; i++){
    q.defer(findLatLon, data[i].short_region);
  }
  for (var i = 0; i < data.length; i++){
    q.defer(findWaveForm, data[i]["iris_dmc_event_id"]);
  }

  q.awaitAll(function(err, res) {
    // console.log("retm queue done");

    for (var i = 0; i < data.length; i++){
      data[i].location = res[i]
      data[i].eqinfo = res[data.length+i]
    }

    // console.log(data)
    var retm_string = JSON.stringify(data)
    fs.writeFile('public/data/retm_data.json', retm_string, (err) => {
      if (err) throw err;
      // console.log("wrote retm to file")
    })
    mainWindow.webContents.send('return-retm', data)
  });
}

function checkIfNewRETMEntry(data){       // checking most recent entries against each other to see if it's been updated

  var parse = data.substr(2, data.length-4);
  var retmdata = JSON.parse(parse)
  var retmlist = [];
  var namelist = [];

  for (var i = 0; i < retmdata.dmc_evid_retm.length; i++) {
    var name = retmdata.dmc_evid_retm[i].short_region;

    if (namelist.indexOf(name) == -1) {  
      retmlist.push(retmdata.dmc_evid_retm[i])
      namelist.push(name)
      if (namelist.length >= 5) {
        break;
      }
    }
  }

  fs.readFile('public/data/retm_data.json', (err, data) => {
    if (err) throw err;
    var old_retm = JSON.parse(data);

    if(retmlist[0]['iris_dmc_event_id'] == old_retm[0]['iris_dmc_event_id']){
      // console.log("no new retm")
      mainWindow.webContents.send('return-retm', old_retm)
    } else {
      // console.log("yes, getting new retm info")
      getRETMinfo(retmlist)
    }
  });
}


function useCachedRETM(){
  fs.readFile('public/data/retm_data.json', (err, data) => {
    if (err) throw err;
    var old_retm = JSON.parse(data);
    mainWindow.webContents.send('return-retm', old_retm)
  })
}

/*----------------------------------------  IPC LISTENERS */

ipcMain.on('get-retm', (event, arg) => {
  request({
    url: arg.url
  }, function(error, response, body){
    if (error){
      useCachedRETM();
    } else {
      checkIfNewRETMEntry(body)
    }
  })
})

ipcMain.on('knob', (event, arg) =>{
  event.sender.send('knob-status', isConnected)
})

ipcMain.on('get-globe-data', (event, arg) => {
  getGlobeData();
})

/*----------------------------------------  create window */


function createWindow () {
  mainWindow = new BrowserWindow({width: 1920, height: 1080})

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '/public/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow() 
  }

})