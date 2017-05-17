var viewer;

var today = Date.now()
var thisday = today - (1000*60*60*24)               // TIMES ARE CURRENTLY SCALED FOR TESTING ONE MONTH OF DATA
var thisweek = today - (1000*60*60*24*7)            // USE OTHER SET OF VARIABLES BELOW FOR ONE YEAR OF DATA
var thismonth = today - (1000*60*60*24*14)       
var thisyear = today - (1000*60*60*24*21)
var historical = today - (1000*60*60*24*30)

var eq_opacity = "1"

var eq_color = function(time) {  // mapping color to time of eq
    if ( time > historical ){
        var color = d3.scaleLinear()
        .domain([today,thisyear])
        // .range(["#FF0000","#FFFF50"])
        .range(["#D25F27","#FFD13F"])
        .clamp(true);
        return color(time)
    } else { return '#000000' }         // color for "history" earthquakes
}

var eq_size = function(date, mag){
    var size = d3.scalePow().exponent(3)
        .domain([1, 7])
        .range([5, 50])
        .clamp(true);

    if (date > historical){
        return size(mag);
    } else { return 3; }
}

// var eq_height = function(date, mag){
//     var height = d3.scaleLinear()
//         .domain([today, historical])
//         .range([100, 20000])
//         .clamp(true);

//     if (date > historical){
//         return height(mag);
//     } else { return 0; }
// }

var setupGlobe = function(){
    //new Cesium object, displays planet, generic zoom/display level
    viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer'
        }),
        baseLayerPicker: false,
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        fullscreenButton: false,
        navigationHelpButton: false
    });

    // viewer.scene.globe.enableLighting = true;
}

var drawData = function(earthquakes){
    console.log("drawing earthquakes")

    for (var i = 0; i < earthquakes.length; i++) {
        var lat = earthquakes[i].geometry.coordinates[0];
        var lon = earthquakes[i].geometry.coordinates[1];
        var mag = earthquakes[i].properties.mag;
        var name = earthquakes[i].properties.place;
        var date = new Date(earthquakes[i].properties.time);

        var eqs = viewer.entities.add({
            position : Cesium.Cartesian3.fromDegrees(lat, lon),
            point : {
                pixelSize : eq_size(date, mag),
                color : new Cesium.Color.fromCssColorString(eq_color(date))
            },
            outlinewidth: 1
            // height: eq_height(date, mag)
        });
    }
}

var rotateTo = function(lat, lon){
    viewer.camera.flyTo({
        destination : Cesium.Cartesian3.fromDegrees(lon, lat, viewer.camera.positionCartographic.height)
    });
}


