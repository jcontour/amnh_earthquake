var app = app || {};

app.main = (function() {

	// --------------------------------------------------------------------------------------------------------------------------------------------
	//                                          D3 MAP CODE
	// --------------------------------------------------------------------------------------------------------------------------------------------
	
	var today = Date.now()
	var thisday = today - (1000*60*60*24)           	
	var thisweek = today - (1000*60*60*24*7)
	var thismonth = today - (1000*60*60*24*14)       
	var thisyear = today - (1000*60*60*24*21)

	var eq_color = function(time) {  // mapping color to time of eq
	    var color = d3.scaleLinear()
	        .domain([today,thisyear])
	        .range(["#FF0000","#FFFF50"])
	        .clamp(true);
	    return color(time)
	}

	var projection, svg, path, g, label, eq_size, zoom;

	var setup = function(){
		document.getElementById("nTime").value = "1";
		document.getElementById("nSize").value = "0";

		var width = window.innerWidth,
		    height = window.innerHeight;

		label = d3.select("body").append("div")
			.attr("class", "label")
			.style("opacity", 0);

		projection = d3.geoOrthographic()
		    .translate([width / 2, height / 2])
		    .scale(450)
		    .clipAngle(90)
		    .precision(0.1);

		zoom = d3.zoom()
    		.scaleExtent([1, 8])
    		.on("zoom", zoomed);

		svg = d3.select("body").append("svg")
		    .attr("width", width)
		    .attr("height", height);

		path = d3.geoPath()
		    .projection(projection);

		g = svg.append("g");

		g.append('path')                            // ocean color
		  .datum({type: 'Sphere'})
		  .attr('class', 'ocean')
		  .attr('d', path);

		var latlon = d3.geoGraticule();          // lat/lon lines
		    g.append('path')  
		      .datum(latlon)
		      .attr('class', 'latlon')
		      .attr('d', path);

		svg.call(zoom)

		eq_size = d3.scalePow().exponent(3)
		 	.domain([1, 7])
		 	.range([1, 50])
		 	.clamp(true);

		d3.json("topojsondata/countries-and-states.json", function(error, data) {		// drawing map
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


		d3.json("data/history_data.json", function(error, data){				// https://earthquake.usgs.gov/earthquakes/search/
			console.log("getting history data")
			// console.log(data.features)
			drawHistory(data.features)
		})

		d3.json('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson', function(error, data) {              // load/draw EARTHQUAKES
    		console.log("getting eq data!");
    		data.features.sort( function(a, b) { 
    			return d3.ascending(a.properties.time, b.properties.time)
    		});
    		drawData(data.features);
    	});



		// GETTING RETM DATA
		// d3.request('http://www.iris.edu/hq/api/json-dmc-evid-retm?callback=function_name')
		//     // .header("X-Requested-With", "XMLHttpRequest")
		//     .header("Access-Control-Allow-Origin", "*")
		//     .get(function(error, data){
		//     	console.log(data);
		//     });

		d3.json("js/retm_data.json", function(error, data){					// WILL NEED TO REPLACE THIS WITH ACTUAL LINK WHEN PUBLISHING
			console.log("getting RETM data")
			// console.log(data)
		})
	}

	function zoomed() {
		return d3.event.transform
	  // g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	}

	function drawMap(className, featureSet, drawLabels) {
		console.log("drawing " + className)
		// console.log(featureSet)
	    var set  = g.selectAll('.' + className)
	        .data(featureSet)
	        .enter()
	        .append('g')
	        .attr('class', className)
	        ;

	    set.append('path')
	        .attr('class', 'land')
	        .attr('d', path)
	        .attr('id', function(d) {
	            var name = d.properties.name;
	            name = name.replace(/\s+/g, '');
	            name = name.toLowerCase()
	            return name;
	        })
	        ;

	    set.append('path')
	        .attr('class', 'overlay')
	        .attr('d', path)

	    return set;
	}

	function drawData(data){
		console.log("drawing data")

		var nodes = g.selectAll("circle")
	       .data(data)
	       .enter()
	       .append("circle")
	       .attr("class", function(d){
	       		//TESTING SOMETHING FOR RETM
	   //     		if (d.properties.place.includes("Papua New Guinea") && d.properties.mag > 6){
				// 	console.log(d)
				// }

	       		if (d.properties.time > thisday){
	       			return "new-eq";
	       		}
	       })
	       .attr("cx", function(d) {
	               return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0];
	       })
	       .attr("cy", function(d) {
	               return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1];
	       })
	       .attr("r", function(d){
	            return eq_size(d.properties.mag);

	            // return Math.exp(parseFloat(d.properties.mag)) * 0.05 + 2
	       })
	       .style("fill", function(d){
	            return eq_color(d.properties.time);
	       })
	       .attr("opacity", function(d) {
	            var geoangle = d3.geoDistance(
	                    d.geometry.coordinates,
	                    [
	                        -projection.rotate()[0],
	                        projection.rotate()[1]
	                    ]);
	            if (geoangle > 1.57079632679490)
	            {
	                return "0";
	            } else {
	                return "0.7";
	            }
	        })
	        .on("mouseover", function(d){
	        	if (d3.select(this).style("opacity") > 0 ){
					label.style("opacity", .9)
		       		label .html(d.properties.title)
		       		.style("left", (d3.event.pageX) + "px")		
	                .style("top", (d3.event.pageY) + "px");
	       			}
	       		})
	        .on("mouseout", function(d){
	        	label.style("opacity", 0);	
	        })
	       ;
	}

	function drawHistory(data){
		var nodes = g.selectAll("circle")
	       .data(data)
	       .enter()
	       .append("circle")
	       .attr("class", "history")
	       .attr("cx", function(d) {
	               return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0];
	       })
	       .attr("cy", function(d) {
	               return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1];
	       })
	       .attr("r", 2)
	       .style("fill", "#C600FF")
	       .attr("opacity", function(d) {
	            var geoangle = d3.geoDistance(
	                    d.geometry.coordinates,
	                    [
	                        -projection.rotate()[0],
	                        projection.rotate()[1]
	                    ]);
	            if (geoangle > 1.57079632679490)
	            {
	                return "0";
	            } else {
	                return "0.7";
	            }
	        })
	       ;
	}

	var sortData = function(data){
		data.sort(function(a, b){ return d3.ascending(a.finished_at, b.finished_at);
	}

	// --------------------------------------------------------------------------------------------------------------------------------------------
	//                                          INTERACTION EVENTS
	// --------------------------------------------------------------------------------------------------------------------------------------------
	
	var attachEvents = function(){
		var drag = d3.drag()								// rotate on drag
		    .on("start", dragstarted)
		    .on("drag", dragged)
		svg.call(drag);

		// var drag = d3.drag()
		// 	.origin(Object)
  //           .on('drag', function(d) {
  //   	        projection.rotate([(d.x = d3.event.x) / 2, -(d.y = d3.event.y) / 2]);
  //               svg.selectAll('path').attr('d', function(u) {
  //               // The circles are not properly generated when the
  //               // projection has the clipAngle option set.
  //                   return path(u) ? path(u) : 'M 10 10';
  //               });
  //           });
  //       svg.call(drag);


		// var zoom = d3.zoom()
		// 	// .center([width / 2, height / 2])
		// 	.on("zoom", zoomed)
		// svg.call(zoom)

		d3.select("#nTime").on("input", function() {		// time filter
			setOpacity();
		})

		d3.select("#nSize").on("input", function() {		// time filter
			setOpacity();
		})

		$('#test1').on("click", function(){
			rotateTo("brazil");
		})
		$('#test2').on("click", function(){
			rotateTo("papuanewguinea");
		})
		$('#test3').on("click", function(){
			rotateTo("saudiarabia");
		})
	}

	// function zoomed(){
	// 	g.attr("transform", function(){
	// 		// var t = d3.zoomIdentity.translate(width/2, height/2).scale(3);
 //        	return d3.event.transform
 //        	return t;
 //        })
 //        g.selectAll("path")  
 //            .attr("d", path.projection(projection)); 
 //        g.selectAll("circle")
 //            .attr("d", path.projection(projection));
	// }

	function rotateTo(place){
		var loc = d3.select("#" + place)
		var p = d3.geoPath().centroid(loc.datum())
	    d3.transition()
	        .duration(2000)
	        .tween("rotate", function() {
	        	r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
				return function(t) {
					projection.rotate(r(t));
					updateElements();	
					setOpacity();
					};
	        });
	}

	var setOpacity = function(){
		var filterTime = document.getElementById("nTime").value;
		var filterSize = document.getElementById("nSize").value;

		// g.selectAll('circle').attr('d', function(u) {
	 //        // The circles are not properly generated when the
	 //        // projection has the clipAngle option set.
	 //            return path(u) ? path(u) : 'M 10 10';
	 //        });

		var nodes = g.selectAll("circle")
			.attr("opacity", function(d){
				// console.log(d.properties)
				var geoangle = d3.geoDistance(
		            d.geometry.coordinates,
		            [
		                -projection.rotate()[0],
		                projection.rotate()[1]
		            ]);

				if (geoangle > 1.57079632679490 || d.properties.mag < filterSize) {
                	return "0";
           		} else {
					if(filterTime == 1){
				        return "0.7"
				    } else if (filterTime == 2) {
				        if (d.properties.time > thisyear) { return "0.7" } else { return "0" }
				    } else if (filterTime == 3) {
				        if (d.properties.time > thismonth) { return "0.7" } else { return "0" }
				    } else if (filterTime == 4) {
				        if (d.properties.time > thisweek) { return "0.7" } else { return "0" }
				    } else {
				        if (d.properties.time > thisday) { return "0.7" } else { return "0" }
				    }
				}
			})
	}

	var render = function() {},
	    v0, // Mouse position in Cartesian coordinates at start of drag gesture.
	    r0, // Projection rotation as Euler angles at start.
	    q0; // Projection rotation as versor at start.

	function dragstarted() {
		v0 = versor.cartesian(projection.invert(d3.mouse(this)));
		r0 = projection.rotate();
		q0 = versor(r0);
	}

	function dragged() {
		var v1 = versor.cartesian(projection.rotate(r0).invert(d3.mouse(this))),
			q1 = versor.multiply(q0, versor.delta(v0, v1)),
			r1 = versor.rotation(q1);
		projection.rotate(r1);
		render();
		updateElements();
		setOpacity();
	}	

	function updateElements(){
	    svg.selectAll("path")
	        .attr("d", path.projection(projection));
	    
	    // var labels = g.selectAll("maplabel")
	    // labels.each(function(d,i){
	    // 	var self = d3.select(this)
	    // 	self.attr("transform", function(d){ return "translate(" + path.centroid(d) + ")"; })
    	// })

	    var nodes = svg.selectAll("circle")
	   
	    nodes.each(function(d, i) {
	        var self = d3.select(this)
	        self.attr("cx", projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0])
	        self.attr("cy", projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1])
	    })

	    // var labels = g.selectAll('text')
	    // labels.each(function(d, i) {
	    //     var self = d3.select(this)
	    //     self.attr("cx", projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0])
	    //     self.attr("cy", projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1])
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

