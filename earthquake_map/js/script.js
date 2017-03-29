var app = app || {};

app.main = (function() {

	// --------------------------------------------------------------------------------------------------------------------------------------------
	//                                          D3 MAP CODE
	// --------------------------------------------------------------------------------------------------------------------------------------------
	
	var today = Date.now()
	var thisday = today - (1000*60*60*24)           	// TIMES ARE CURRENTLY SCALED FOR TESTING ONE MONTH OF DATA
	var thisweek = today - (1000*60*60*24*7)            // USE OTHER SET OF VARIABLES BELOW FOR ONE YEAR OF DATA
	var thismonth = today - (1000*60*60*24*14)       
	var thisyear = today - (1000*60*60*24*21)
	var historical = today - (1000*60*60*24*30)

	var eq_opacity = "1"

	var eq_color = function(time) {  // mapping color to time of eq
	    if ( time > historical ){
	    	var color = d3.scaleLinear()
	        .domain([today,thisyear])
	        .range(["#FF0000","#FFFF50"])
	        .clamp(true);
	    	return color(time)
	    } else { return '#000000' }			// color for "history" earthquakes
	}

	var projection, svg, path, g, label, eq_size;

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

		// eq_size = d3.scaleLinear()			// scaling size of data to magnitude
		//     .domain([2,7])
		//     .range([1,25])
		//     .clamp(true);

		 eq_size = d3.scalePow().exponent(3)
		 	.domain([1, 7])
		 	.range([1, 50])
		 	.clamp(true);

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

		getEQdata(function(data){
			data.sort( function(a, b) {  return d3.ascending(a.properties.time, b.properties.time) });
    		drawData(data);
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

	function drawMap(className, featureSet, drawLabels) {
		console.log("drawing " + className)
		var set  = g.selectAll('.' + className)
	        .data(featureSet)
	        .enter()
	        .append('g')
	        .attr('class', className)
	        // .attr('data-name', function(d) {
	        //     return d.properties.name;
	        // })
	        // .attr('data-id', function(d) {
	        //     return d.id;
	        // })
	        ;

	    set.append('path')
	        .attr('class', 'land')
	        .attr('d', path)
	        .attr('id', function(d) {			// setting place name ID for retm rotation
	            var name = d.properties.name;
	            name = name.replace(/\s+/g, '');
	            name = name.toLowerCase()
	            return name;
	        });

	    set.append('text')
	    	.attr('class', 'maplabel')
	    	.attr('transform', function(d) {
	            return "translate(" + path.centroid(d) + ")";
	        })
	        .attr('fill', '#D7DBBD')
	        .style('text-anchor', 'middle')
	        .text(function(d) {
	            return d.properties.name
	        });

	 //    if (drawLabels) {
	 //    set.append('text')
		// 	.attr('class', 'maplabel')
		// 	// .attr("x", function(d){
		//         // return path.centroid(d)[0];
		//     // })
		//     .attr("transform", function(d){
		//         // return  path.centroid(d)[1];
		//         return "translate(" + path.centroid(d) + ")";
		//     })
		// 	.text(function(d) {
		// 		return d.properties.name;
		// 	})
		// 	.style('text-anchor', 'middle')
		// 	;
		// }

	    return set;
	}

	function drawData(data){
		console.log("drawing data")
		var nodes = g.selectAll("circle")
	       .data(data)
	       .enter()
	       .append("circle")
	       .attr("class", function(d){ if (d.properties.time > thisday){ return "new-eq"; } })
	       .attr("cx", function(d) { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0]; })
	       .attr("cy", function(d) { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1]; })
	       .attr("r", function(d){
	       		if (d.properties.time > historical){
	            	return eq_size(d.properties.mag);
	        	} else { return 3; }
	       })
	       .style("fill", function(d){ return eq_color(d.properties.time); })
	       .attr("opacity", function(d) {
	            var geoangle = d3.geoDistance(
	                    d.geometry.coordinates, [ -projection.rotate()[0], projection.rotate()[1] ]);
	            if (geoangle > 1.57079632679490)
	            { return "0"; } else { return eq_opacity; }
	        })
	        .on("mouseover", function(d){
	        	if (d.properties.time > historical){
		        	if (d3.select(this).style("opacity") > 0 ){
						label.style("opacity", .9)
			       		label .html(d.properties.title)
			       		.style("left", (d3.event.pageX) + "px")		
		                .style("top", (d3.event.pageY) + "px");
		       		}
		       	}
	    	})
	        .on("mouseout", function(d){
	        	label.style("opacity", 0);	
	        })
	       ;
	}

	// --------------------------------------------------------------------------------------------------------------------------------------------
	//                                          INTERACTION EVENTS
	// --------------------------------------------------------------------------------------------------------------------------------------------
	
	var attachEvents = function(){
		var drag = d3.drag()								// rotate on drag
		    .on("start", dragstarted)
		    .on("drag", dragged)
		svg.call(drag);

		var zoom = d3.zoom()
			.on("zoom",function() {
		    	g.attr("transform", d3.event.transform)
		        g.selectAll("path")  
		            .attr("d", path.projection(projection)); 
		        g.selectAll("circle")
		            .attr("d", path.projection(projection));
		        })
			.scaleExtent([1,5])

		// console.log(zoom.scale())
		    
		svg.call(zoom)

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

	function rotateTo(place){
		var loc = d3.select("#" + place)
		console.log(loc)
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
				var geoangle = d3.geoDistance(
		            d.geometry.coordinates, [ -projection.rotate()[0], projection.rotate()[1] ]);
				if (geoangle > 1.57079632679490 || d.properties.mag < filterSize) {
                	return "0";
           		} else {
					if(filterTime == 1){
				        return eq_opacity
				    } else if (filterTime == 2) {
				        if (d.properties.time > thisyear) { return eq_opacity } else { return "0" }
				    } else if (filterTime == 3) {
				        if (d.properties.time > thismonth) { return eq_opacity } else { return "0" }
				    } else if (filterTime == 4) {
				        if (d.properties.time > thisweek) { return eq_opacity } else { return "0" }
				    } else {
				        if (d.properties.time > thisday) { return eq_opacity } else { return "0" }
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

	    var nodes = svg.selectAll("circle")	   
	    nodes.each(function(d, i) {
	        var self = d3.select(this)
	        self.attr("cx", projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0])
	        self.attr("cy", projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1])
	    })

		svg.selectAll("text")
			.attr('transform', function(d) {
				return "translate(" + path.centroid(d) + ")";
			})
	}

	// --------------------------------------------------------------------------------------------------------------------------------------------
	//                                          ROTATE ON DRAG FUNCTIONS
	//                                          http://bl.ocks.org/ivyywang/7c94cb5a3accd9913263
	// --------------------------------------------------------------------------------------------------------------------------------------------

	var to_radians = Math.PI / 180;
	var to_degrees = 180 / Math.PI;
	function cross(v0, v1) {
	    return [v0[1] * v1[2] - v0[2] * v1[1], v0[2] * v1[0] - v0[0] * v1[2], v0[0] * v1[1] - v0[1] * v1[0]];
	}
	function dot(v0, v1) {
	    for (var i = 0, sum = 0; v0.length > i; ++i) sum += v0[i] * v1[i];
	    return sum;
	}
	function lonlat2xyz( coord ){
	    var lon = coord[0] * to_radians;
	    var lat = coord[1] * to_radians;
	    var x = Math.cos(lat) * Math.cos(lon);
	    var y = Math.cos(lat) * Math.sin(lon);
	    var z = Math.sin(lat);
	    return [x, y, z];
	}
	function quaternion(v0, v1) {
	    if (v0 && v1) {
	        var w = cross(v0, v1),  // vector pendicular to v0 & v1
	            w_len = Math.sqrt(dot(w, w)); // length of w     
	        if (w_len == 0)
	            return;
	        var theta = .5 * Math.acos(Math.max(-1, Math.min(1, dot(v0, v1)))),
	            qi  = w[2] * Math.sin(theta) / w_len; 
	            qj  = - w[1] * Math.sin(theta) / w_len; 
	            qk  = w[0]* Math.sin(theta) / w_len;
	            qr  = Math.cos(theta);
	        return theta && [qr, qi, qj, qk];
	    }
	}
	function euler2quat(e) {
	    if(!e) return;
	    var roll = .5 * e[0] * to_radians,
	        pitch = .5 * e[1] * to_radians,
	        yaw = .5 * e[2] * to_radians,
	        sr = Math.sin(roll),
	        cr = Math.cos(roll),
	        sp = Math.sin(pitch),
	        cp = Math.cos(pitch),
	        sy = Math.sin(yaw),
	        cy = Math.cos(yaw),
	        qi = sr*cp*cy - cr*sp*sy,
	        qj = cr*sp*cy + sr*cp*sy,
	        qk = cr*cp*sy - sr*sp*cy,
	        qr = cr*cp*cy + sr*sp*sy;
	    return [qr, qi, qj, qk];
	}
	function quatMultiply(q1, q2) {
	    if(!q1 || !q2) return;
	    var a = q1[0],
	        b = q1[1],
	        c = q1[2],
	        d = q1[3],
	        e = q2[0],
	        f = q2[1],
	        g = q2[2],
	        h = q2[3];
	    return [
	     a*e - b*f - c*g - d*h,
	     b*e + a*f + c*h - d*g,
	     a*g - b*h + c*e + d*f,
	     a*h + b*g - c*f + d*e];
	}
	function quat2euler(t){
	    if(!t) return;
	    return [ Math.atan2(2 * (t[0] * t[1] + t[2] * t[3]), 1 - 2 * (t[1] * t[1] + t[2] * t[2])) * to_degrees, 
	             Math.asin(Math.max(-1, Math.min(1, 2 * (t[0] * t[2] - t[3] * t[1])))) * to_degrees, 
	             Math.atan2(2 * (t[0] * t[3] + t[1] * t[2]), 1 - 2 * (t[2] * t[2] + t[3] * t[3])) * to_degrees
	            ]
	}
	function eulerAngles(v0, v1, o0) {
	    var t = quatMultiply( euler2quat(o0), quaternion(lonlat2xyz(v0), lonlat2xyz(v1) ) );
	    return quat2euler(t);   
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
