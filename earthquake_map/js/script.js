var app = app || {};

app.main = (function() {

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ queuing data calls
	function callGlobeData(){
		d3.queue(2)				// calling map data
		.defer(d3.json, "data/countries-and-states.json")
		.defer(d3.json, "data/tec_boundaries.json")
		.defer(d3.json, "data/history_data.json")
		.defer(d3.json, "http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson")
		.awaitAll(function(error, results){
			if (error) throw error;
			console.log(results)
			drawGlobeData(results);
		})
	}

	function drawGlobeData(data){
		var mapData = data[0]
		
		var states = topojson.feature(mapData, mapData.objects.states).features;
	    drawMap('state map', states, true);
	    
	    var countries = topojson.feature(mapData, mapData.objects.countries).features;	    
	    drawMap('country map', countries, true);

		var tectonicPlates = data[1]
	    drawMap('plates', tectonicPlates.features, false)

	    var earthquakes = []
	    for (i = 0; i <data[2].features.length; i++){ earthquakes.push(data[2].features[i]) }
	    for (i = 0; i <data[3].features.length; i++){ earthquakes.push(data[3].features[i]) }
		earthquakes.sort( function(a, b) {  return d3.ascending(a.properties.time, b.properties.time) });
		
		drawData(earthquakes)
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ instantiating templates

	var retm_template;

	var source   = $("#retm_template").html();
	var retm_template = Handlebars.compile(source);

	function showTemplate(div, template, data){
		$(div).html(template(data));
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ RETM
	// d3.json("js/retm_data.json", function(error, data){					// WILL NEED TO REPLACE THIS WITH ACTUAL LINK WHEN PUBLISHING
	// 	console.log("getting RETM data")
	// 	// console.log(data)
	// 	filterRETM(data, function(filtered){
	// 		showTemplate("#retm_container", retm_template, filtered)
	// 	})
	
	// })

	// function filterRETM(data, callback) {
	// 	// placeNames is an array populated in the drawMap function in globe.js
	// 	var filteredData = [];

	// 	for (var i = 0; i < data.length; i++) {
	// 		var name = data[i].short_region;
 //            name = name.replace(/\s+/g, '');
 //            name = name.toLowerCase()

	// 		var locOnGlobe = false;

	// 		for(var j = 0; j < placeNames.length; j++){
	// 			if (name == placeNames[j]) {
	// 				locOnGlobe = true;
	// 				filteredData.push(data[i])
	// 				break;
	// 			}
	// 		}		
	// 	}

	// 	console.log(filteredData)
	// 	callback( filteredData );
	// }

	// MAKE GET REQUEST TO 
	// http://www.iris.edu/hq/api/json-dmc-evid-retm?callback=function_name

	// http://ds.iris.edu/ds/nodes/dmc/tools/event/###### - use iris_dmc_event_id to get info for each earthquake. 


	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ INTERACTION


	var attachEvents = function(){
		var drag = d3.drag()								// rotate on drag
		    .on("start", dragstarted)
		    .on("drag", dragged)
		svg.call(drag);

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
