# amnh_earthquake
Earthquake Explorer

Interactive data vizualization about global earthquake events

Installed in AMNH Discovery Room Seismology Lab

## Phase 1: Google Maps Prototype

Version 1 started by utilizing the Google Maps API which has many built in features for map customization, XML layer visualization to show edges of tectonic plates, and style layers for showing earthquake data points. 

It was quick to get working, but the Google Maps API loads very slowly due to an excess of unnecessary features. 

Positives include the built in labeling systems for environment areas and countries, and being well documented API.

![Image of google maps prototype](http://jessiecontour.com/images/earthquake_explorer/earthquake_explorer02.png)

## Phase 2: D3.js Prototype

D3.js has more tools for customizing data markers, easier and less controlled methods for labeling and interaction with other features, and plays well with other javascript libraries. In addition, it allowed for the mapping of data onto a sphere, letting information be shown without the mapping errors of a mercator projection. 

However, when mapping the total dataset onto this globe, the browser could not handle the load and would either crash or freeze. 

![Image of d3 prototype](http://jessiecontour.com/images/earthquake_explorer/earthquake_explorer03.png)


## Phase 3: Implementation of WebGL Globe Cesium.js

Using webGL proved to be the best solution for smooth and responsive interaction of the entire dataset. The Cesium.js globe has great built in functionality for mapping points, camera movement, and interaction. 

![Image of cesium globe](http://jessiecontour.com/images/earthquake_explorer/earthquake_explorer01.png)

This initial version of Earthquake Explorer was built in-browser using Chrome and Node.js, but was ported over into the Electron Framework in order to function as a standalone app. 

## Setup

1. This is built using Node 6.11.0, Electron ~1.6.2

1. Clone the repo and run `npm install` in the electron folder to retrieve node modules.

1. To rebuild modules for current version of electron, run `./node_modules/.bin/electron-rebuild`. This will fix an error in the serialport module.

1. If using hardware interface, plug in Arduino with the StandardFirmataPlus to a USB port. There should be two potentiometers connected to A0 and A1. If an Arduino is not plugged in, the on-screen filtering options will show up. 

1. Run electron app with `npm start`

## Updating sidebar data

Data for Definitions, Questions, and News Articles for sidebars is stored in `electron/public/data/defs_and_questions.json`. 
Update info in that file to add or change content. Make sure to follow existing structure.

News articles must be saved as image files due to lack of functionality in electron to easily read pdfs. 

## Potential break points

1. app.js line 133 function `getGlobeData()` makes call to *earthquake.usgs.gov* earthquake API.
1. app.js line 230 request to *iris.edu/hq/api/json-dmc-evid-retm* to get list of RETM entries. 
1. app.js line 135 function `findLatLon()` makes call to Google Maps API to find lat/lon of RETM locations. 
1. app.js line 142 function `findWaveForm()` makes two calls in order to get RETM info and waveform:
    1. Call to *service.iris.edu/fdsnws* to find information about earthquake listed. This service might be discontinued in the future.
    1. Call to *service.iris.edu/irisws/timeseries* to retrieve waveform from specific date/time/location. 
