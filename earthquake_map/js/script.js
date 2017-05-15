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
		
		drawData(earthquakes);

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
				})
			})

	}

	function showTemplate(div, template, data){
		console.log("showing template " + div);
		$(div).html(template(data));
	}

	// checking to see if retm location matches a location on the globe
	// placeNames is an array populated in the drawMap function in globe.js
	function filterRETM(data, callback) {	
		var filteredData = [];
		var namelist = [];

		for (var i = 0; i < data['retm'].length; i++) {
			var name = data['retm'][i].short_region;

			//	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~<<<<<<<< PUT SOMETHING HERE TO FIND LAT/LON of NAME
			if ($.inArray(name, namelist) == -1) {	
				// console.log(name)
				filteredData.push(data['retm'][i])
				namelist.push(name)
				// break;
			}
					
		}

		// console.log(filteredData);
		callback( {"retm" : filteredData} );
	}


	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ INTERACTION


	var attachEvents = function(){
		// var drag = d3.drag()								// rotate on drag
		//     .on("start", dragstarted)
		//     .on("drag", dragged)
		// svg.call(drag);

		// var zoom = d3.zoom()
		// 	.on("zoom",function() {
		//     	g.attr("transform", d3.event.transform)
		//         g.selectAll("path")  
		//             .attr("d", path.projection(projection)); 
		//         g.selectAll("circle")
		//             .attr("d", path.projection(projection));
		//         })
		// 	.scaleExtent([1,10])


		// // console.log(zoom.scale())
		    
		// svg.call(zoom)


		// d3.select("#nTime").on("input", function() {		// time filter
		// 	setOpacity();
		// })

		// d3.select("#nSize").on("input", function() {		// time filter
		// 	setOpacity();
		// })

		// $('#test1').on("click", function(){
		// 	rotateTo("brazil");
		// })
		// $('#test2').on("click", function(){
		// 	rotateTo("papuanewguinea");
		// })
		// $('#test3').on("click", function(){
		// 	rotateTo("saudiarabia");
		// })
	}

	var init = function(){
		console.log('Initializing app.');
		setupGlobe();
		callGlobeData();
		attachEvents();
	}

	return {
		init: init,
	};

})();

window.addEventListener('DOMContentLoaded', app.main.init);
