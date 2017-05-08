var app = app || {};

app.main = (function() {

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ instantiating templates

	var retm_template;

	var source   = $("#retm_template").html();
	var retm_template = Handlebars.compile(source);

	function showTemplate(div, template, data){
		$(div).html(template(data));
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ RETM
	d3.json("js/retm_data.json", function(error, data){					// WILL NEED TO REPLACE THIS WITH ACTUAL LINK WHEN PUBLISHING
		console.log("getting RETM data")
		// console.log(data)
		showTemplate("#retm_container", retm_template, data)	
	})

	// MAKE GET REQUEST TO 
	// http://www.iris.edu/hq/api/json-dmc-evid-retm?callback=function_name

	// http://ds.iris.edu/ds/nodes/dmc/tools/event/###### - use iris_dmc_event_id to get info for each earthquake. 

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ drawing globe
	
	d3.json("data/countries-and-states.json", function(error, data) {		// drawing map
	    console.log("getting map data")
	    states = topojson.feature(data, data.objects.states).features;
	    countries = topojson.feature(data, data.objects.countries).features;
	    
	    stateSet = drawMap('state map', states, true);
	    countrySet = drawMap('country map', countries, true);
	    
	});

	d3.json("data/tec_boundaries.json", function(error, data){
		console.log("getting tectonic plate data")
		tectonicSet = drawMap('plates', data.features, false)
	})

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ code to draw earthquakes
	
	// getEQdata(function(data){
	// 	data.sort( function(a, b) {  return d3.ascending(a.properties.time, b.properties.time) });
   	//	drawData(data);
	// });

	function getEQdata(callback) {
		var allEQs = [];
		d3.json('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson', function(error, data) {              // load/draw EARTHQUAKES
			console.log("getting eq data!");
			allEQs = data.features;
		});

		d3.json('data/history_data.json', function(error, hist){
			allEQs = allEQs.concat(hist.features);
			callback(allEQs)
		});
	}

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
		setup();
		attachEvents();
	}

	return {
		init: init,
	};

})();

window.addEventListener('DOMContentLoaded', app.main.init);
