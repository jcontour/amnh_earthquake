const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

let mainWindow

const {ipcMain} = require('electron')

var cors = require('cors'),
    request = require('request'),
    fs = require('fs');

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

  time_pot.on("data", function() {
    curr_time_val = Math.floor(remap_vals(this.value, 0, 1023, 1, 6))
    if (time_pot_val !== curr_time_val){
      time_pot_val = curr_time_val;
      console.log( {time: time_pot_val, size: size_pot_val} );
      var pot_data = {time: time_pot_val, size: size_pot_val}
      mainWindow.webContents.send('filter', pot_data );
    }
  });

  size_pot.on("data", function() {
    curr_size_val = Math.floor(remap_vals(this.value, 0, 1023, 1, 6))
    if (size_pot_val !== curr_size_val){
      size_pot_val = curr_size_val;
      console.log( {time: time_pot_val, size: size_pot_val} );
      var pot_data = {time: time_pot_val, size: size_pot_val}
      mainWindow.webContents.send('filter', pot_data );
    }
  });
})

/*----------------------------------------  IPC COMMUNICATION */

ipcMain.on('get-url', (event, arg) => {
  request({
    url: arg.url
  }, function(error, response, body){
    // console.log('--------------------------------',body)
    event.sender.send('return-requested-data', {which: arg.which, body: body})
  })
})

ipcMain.on('knob', (event, arg) =>{
  event.sender.send('knob-status', isConnected)
})


/*----------------------------------------  create window */


function createWindow () {
  mainWindow = new BrowserWindow({width: 1920, height: 1080})

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '/public/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.webContents.openDevTools()

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