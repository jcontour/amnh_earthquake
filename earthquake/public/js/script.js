'use strict';

var app = app || {};

app.main = (function() {


	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ queuing data calls
	function callGlobeData(){
		console.log("calling data for globe")
		d3.queue(2)				// calling map data
		.defer(d3.json, "data/tec_boundaries.json")
		.defer(d3.json, "data/history.json")
		.defer(d3.json, "http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson")
		.awaitAll(function(error, results){
			if (error) throw error;
			drawGlobeData(results);
		})
	}

	function drawGlobeData(data){
		console.log("drawing globe")

		var tectonicPlates = data[0];
	    // drawMap('plates', tectonicPlates.features, false);

	    var earthquakes = [];
	    
	    for (var i = 0; i <data[1].features.length; i++){ earthquakes.push(data[1].features[i]) }		// UNCOMMENT FOR MAJOR LAG 
	    for (var i = 0; i <data[2].features.length; i++){ earthquakes.push(data[2].features[i]) };
		earthquakes.sort( function(a, b) {  return d3.ascending(a.properties.time, b.properties.time) });
		
		// drawData(earthquakes);

		initTemplates();
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ instantiating templates

	function initTemplates(){
		console.log("initializing templates")

		var source, question_template, definition_template, retm_template, news_template;

		source = $("#question_template").html();
		question_template = Handlebars.compile(source);

		source = $("#definition_template").html();
		definition_template = Handlebars.compile(source);

		source = $("#retm_template").html();
		retm_template = Handlebars.compile(source);

		source = $("#news_template").html();
		news_template = Handlebars.compile(source);

		d3.queue()
			.defer(d3.json, "data/defs_and_questions.json")
			.defer(d3.json, "data/retm_data.json")	// <<<<<<<<<<<<<<< WILL NEED TO REPLACE THIS WITH ACTUAL LINK WHEN PUBLISHING

			// for list of retm entries
			// http://www.iris.edu/hq/api/json-dmc-evid-retm?callback=function_name

			// page for each entry use iris_dmc_event_id from
			// http://ds.iris.edu/ds/nodes/dmc/tools/event/###### 

			.awaitAll( function(error, results){
				console.log("filling templates");
				// console.log(results);

				showTemplate("#question_container", question_template, results[0]);
				showTemplate("#definition_container", definition_template, results[0]);
				showTemplate("#news_container", news_template, results[0])

				filterRETM(results[1], function(filtered){
					showTemplate("#retm_container", retm_template, filtered); 
					attachEvents();
				})
			})
	}

	function showTemplate(div, template, data){
		console.log("showing template " + div);
		$(div).html(template(data));
	}

	var findLatLon = function(loc, callback){
	    var coordinates

	    d3.json("http://maps.googleapis.com/maps/api/geocode/json?address=" + loc + "&sensor=true", function(err, res){
	        // console.log(loc, res['results'][0]['geometry']['location']['lat'], res['results'][0]['geometry']['location']['lng'] )
	        callback(err, {lat: res['results'][0]['geometry']['location']['lat'], lon: res['results'][0]['geometry']['location']['lng'] })
	    })
	}

	var retm_data = [];

	function filterRETM(data, callback) {
		console.log("filtering retm")	
		var filteredData = [];
		var namelist = [];

		for (var i = 0; i < data['retm'].length; i++) {
			var name = data['retm'][i].short_region;

			if ($.inArray(name, namelist) == -1) {	
				filteredData.push(data['retm'][i])
				namelist.push(name)
			}
		}

		var q = d3.queue(1);

		for (var i = 0; i < filteredData.length; i++){
		  q.defer(findLatLon, filteredData[i].short_region);
		}

		q.awaitAll(function(err, res) {
			if (err) throw err;
			console.log("retm queue done");
			for (var i = 0; i < filteredData.length; i++){
				filteredData[i].location = res[i]
			}

			retm_data = filteredData
			callback({'retm': filteredData.slice(0,10)})
		});
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SOCKET STUFF

	var socket;

	var socketSetup = function(){
		socket = io.connect();
		
		socket.on('welcome', function(data){
			console.log(data)
		});
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ INTERACTION

	var attachEvents = function(){
		console.log("attaching events")

		$('.locate').click( function(){
			var num = $(this).attr("data-id")
			console.log("locate ", retm_data[num].short_region)
			rotateTo(retm_data[num].location.lat, retm_data[num].location.lon)
		})

		$('.arrow').click(function(){
			if ($(this).hasClass("up")) {
				console.log("opening")
				$(this).removeClass("up").addClass("down").siblings('p').slideDown();
				socket.emit('led-on', true);
			} else {
				$(this).removeClass("down").addClass("up").siblings('p').slideUp();
				socket.emit('led-on', false);
			}
		})

	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ INIT 



	var init = function(){
		console.log('Initializing app.');
		socketSetup();
		setupGlobe();
		callGlobeData();
		attachEvents();
	}

	return {
		init: init,
	};

})();

window.addEventListener('DOMContentLoaded', app.main.init);
