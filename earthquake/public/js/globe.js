var viewer, points;

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

var eq_time = function(time) {  // mapping time to filter values
    if ( time > historical ){
        var color = d3.scaleLinear()
        .domain([today,thisyear])
        .range([1,6])
        .clamp(true);
        return Math.floor(color(time))
    } else { return 0 }         // color for "history" earthquakes
}

var eq_size = function(date, mag){
    var size = d3.scalePow().exponent(3)
        .domain([1, 7])
        .range([7, 50])
        .clamp(true);

    if (date > historical){
        return size(mag);
    } else { return 3; }
}

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

}

var drawData = function(earthquakes){
    console.log("drawing earthquakes")
    // console.log(earthquakes[0])

    // points = new Cesium.CustomDataSource("points")

    for (var i = 0; i < earthquakes.length; i++) {
    // for (var i = earthquakes.length - 1; i > earthquakes.length - 101; i--) {
        var lat = earthquakes[i].geometry.coordinates[0];
        var lon = earthquakes[i].geometry.coordinates[1];
        var mag = earthquakes[i].properties.mag;
        var name = earthquakes[i].properties.place;
        var date = new Date(earthquakes[i].properties.time);

        viewer.entities.add({
            // name : mag,
            description : eq_time(date)+" "+mag,
            label : earthquakes[i].properties.title,
            position : Cesium.Cartesian3.fromDegrees(lat, lon, eq_time(date)*25000),
            point : {
                pixelSize : eq_size(date, mag),
                color : Cesium.Color.fromCssColorString(eq_color(date)),
                outlineWidth: eq_time(date)/4
            }
        });
    }

}

var rotateTo = function(lat, lon){
    viewer.camera.flyTo({
        destination : Cesium.Cartesian3.fromDegrees(lon, lat, viewer.camera.positionCartographic.height)
    });
}

var filterData = function(value, type){
    console.log(value, type)
    if (type == "time"){
        for (var i = 0; i < viewer.entities.values.length; i ++){
        // for (var i = 0; i < 10; i ++){
            var val = viewer.entities.values[i].description["_value"]
            var vals = val.split(" ")
            // console.log(vals)
            if (vals[0] < value){
                viewer.entities.values[i].show = false;
            } else {
                viewer.entities.values[i].show = true;
            }
        }
    } else {
        for (var i = 0; i < viewer.entities.values.length; i ++){
            var val = viewer.entities.values[i].description["_value"]
            var vals = val.split(" ")
            // console.log(vals)
            if (vals[1] < value){
                viewer.entities.values[i].show = false;
            } else {
                viewer.entities.values[i].show = true;
            }
        }
    }
}

