var viewer, scene, handler, points;

var today = Date.now()
var thisday = today - (1000*60*60*24)               // TIMES ARE CURRENTLY SCALED FOR TESTING ONE MONTH OF DATA
var thisweek = today - (1000*60*60*24*7)            // USE OTHER SET OF VARIABLES BELOW FOR ONE YEAR OF DATA
var thismonth = today - (1000*60*60*24*14)       
var thisyear = today - (1000*60*60*24*21)
var historical = today - (1000*60*60*24*30)

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ REMAPPING VALUES

var eq_opacity = "1"

var eq_color = function(time) {  // mapping color to time of eq
    if ( time > historical ){
        var color = d3.scaleLinear()
        .domain([today,thisyear])
        // .range(["#FF0000","#FFFF50"])
        .range(["#A52710","#FFD13F"])
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

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SETUP CESIUM

var setupGlobe = function(){
    console.log("setting up globe")
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
        selectionIndicator : false,
        navigationHelpButton: false
    });

    scene = viewer.scene;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DRAWING ALL ENTITIES ON GLOBE

var drawData = function(earthquakes){
    console.log("drawing earthquakes")

    for (var i = 0; i < earthquakes.length; i++) {
    // for (var i = earthquakes.length - 1; i > earthquakes.length - 101; i--) {
    // for (var i = 0; i < 100; i++) {
        var lat = earthquakes[i].geometry.coordinates[0];
        var lon = earthquakes[i].geometry.coordinates[1];
        var mag = earthquakes[i].properties.mag;
        var name = earthquakes[i].properties.place;
        var date = new Date(earthquakes[i].properties.time);

        viewer.entities.add({
            // name : mag,
            description : eq_time(date)+" "+mag,
            label : {
                        text : earthquakes[i].properties.title,
                        show : false,
                        scale : 0.5,
                        horizontalOrigin : Cesium.HorizontalOrigin.LEFT,
                        pixelOffset : new Cesium.Cartesian2(15, 0),
                        scaleByDistance : new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5),
                    },
            position : Cesium.Cartesian3.fromDegrees(lat, lon, eq_time(date)*1000),
            point : {
                pixelSize : eq_size(date, mag),
                color : Cesium.Color.fromCssColorString(eq_color(date)),
                outlineWidth: eq_time(date)/4
            }
        });
    }
}

var addQuestions = function(data){
    // console.log("adding question areas")
    for (var i = 0; i < data.length; i++){
        viewer.entities.add({
            position : Cesium.Cartesian3.fromDegrees(data[i]["coordinates"][1], data[i]["coordinates"][0], 200000),
            billboard :{
                image : 'data/question.png',
                scale: 0.05,
            },
            id : data[i]["id"],
            name : "questionSpot",
            description : data[i]["name"]
        });
    }
}

var addRETMtoGlobe = function(data){
    // console.log(data)
    for (var i = 0; i < data.length; i++){
        viewer.entities.add({
            position : Cesium.Cartesian3.fromDegrees(data[i]["location"]["lng"], data[i]["location"]["lat"], 200000),
            point : {
                pixelSize : 50,
                color : Cesium.Color.fromCssColorString('#A527FF'),
                outlineWidth: 1
            },
            id : "retm" + i,
            name : "retm",
            description : data[i]["iris_dmc_event_id"]
        });
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ INTERACTION

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ MOUSEOVER
var currPickedObject, pickedObject, prevPickedObject = undefined;

var highlightPoint = function(type, object, isHighlighted){
    if (type == "eq"){
        var desc = object["id"]["_description"]["_value"]                 // check if it's a historical eq
        var split = desc.split(" ")
        if (split[0] != 0){
            if (isHighlighted){
                object["id"]["_label"]["_show"]["_value"] = true;
            } else {
                object["id"]["_label"]["_show"]["_value"] = false;
            }
        }
    } else if (type == "question"){
        var id = object["id"]["_id"]
        if (isHighlighted){
            $('#'+id).addClass("highlighted")
            $('#'+id).children("i").css("border", "solid black").css("border-width", "0 3px 3px 0")
        } else {
            $('#'+id).removeClass("highlighted")
            $('#'+id).children("i").css("border", "solid white").css("border-width", "0 3px 3px 0")
        }
    } else {            // retm
        var id = object["id"]["_id"]
        var eqid = object["id"]["_description"]["_value"]

        if (isHighlighted){
            $('#'+id).addClass("highlighted")
            var info = $('#'+id).attr("data-earthquake")
            console.log(info)
            $('#retm-info').text(info);
            $('#retm-waveform').attr("src", "data/" + eqid + "_waveform.png");
            $('#retm-view').slideDown();
        } else {
            $('#'+id).removeClass("highlighted")
            $('#retm-view').slideUp();
        }
    }
}

var initMouseoverInteraction = function(){

    var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(function(movement) {
        currPickedObject = scene.pick(movement.endPosition);
        if (currPickedObject !== undefined && currPickedObject["id"] !== undefined){
            if (pickedObject !== currPickedObject){
                prevPickedObject = pickedObject
                pickedObject = currPickedObject
                
                if (prevPickedObject !== pickedObject && prevPickedObject !== undefined ){
                    if (prevPickedObject["id"]["_name"] == "questionSpot"){
                        highlightPoint("question", prevPickedObject, false)
                    } else if(prevPickedObject["id"]["_name"] == "retm"){
                        highlightPoint("retm", prevPickedObject, false)
                    } else {
                        highlightPoint("eq", prevPickedObject, false)
                    }
                }

                if (pickedObject["id"]["_name"] == "questionSpot"){
                    highlightPoint("question", pickedObject, true)
                } else if (pickedObject["id"]["_name"] == "retm"){
                    highlightPoint("retm", pickedObject, true)
                } else {
                    highlightPoint("eq", pickedObject, true)
                }
            }
        } else if (currPickedObject == undefined || currPickedObject["id"] !== undefined){
            if (pickedObject !== undefined ){
                if (pickedObject["id"]["_name"] == "questionSpot"){                     
                    highlightPoint("question", pickedObject, false)
                } else if (pickedObject["id"]["_name"] == "retm"){
                    highlightPoint("retm", pickedObject, false)
                } else {
                    highlightPoint("eq", pickedObject, false)
                }
                pickedObject = undefined
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

var spinGlobe = function(angle) {
    viewer.camera.rotateRight(angle);
}

var rotateTo = function(lat, lon, time){               // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ rotate globe to location
    viewer.camera.flyTo({
        destination : Cesium.Cartesian3.fromDegrees(lon, lat, 15000000),
        duration: time
    });
}

var filterData = function(timeval, sizeval){        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ filter with knob/slider
    for (var i = 0; i < viewer.entities.values.length; i ++){
        var val = viewer.entities.values[i].description["_value"]
        var vals = val.split(" ")       // [time, size]
        if (vals[0] == 0){
            viewer.entities.values[i].show = true;
        } else if (vals[0] < timeval || vals[1] < sizeval) {
            viewer.entities.values[i].show = false;
        } else {
            viewer.entities.values[i].show = true;
        }
    }
}

