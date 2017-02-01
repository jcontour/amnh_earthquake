var app = app || {};

app.main = (function() {

	// --------------------------------------------------------------------------------------------------------------------------------------------
	//                                          D3 MAP CODE
	// --------------------------------------------------------------------------------------------------------------------------------------------
	
	var today = Date.now()
	var thisday = today - (1000*60*60*24)           	// TIMES ARE CURRENTLY SCALED FOR TESTING ONE WEEK OF DATA
	var thisweek = today - (1000*60*60*24*2)            // USE OTHER SET OF VARIABLES BELOW FOR ONE YEAR OF DATA
	var thismonth = today - (1000*60*60*24*3)       
	var thisyear = today - (1000*60*60*24*4)
	// var thisday = today - (1000*60*60*24)           // millis * sec * min * hours
	// var thisweek = today - (1000*60*60*24*7)        // millis * sec * min * hour * days
	// var thismonth = today - (1000*60*60*24*7*4)     // millis * sec * min * hour * day * weeks
	// var thisyear = today - (1000*60*60*24*7*4*12)   // millis * sec * min * hour * day * weeks * months

	var eq_color = function(time) {  // mapping color to time of eq
	    var color = d3.scaleLinear()
	        .domain([today,thisyear])
	        .range(["#FF0000","#FFFF50"])
	        .clamp(true);
	    return color(time)
	}

	var projection, svg, path, g;

	var setup = function(){
		document.getElementById("nTime").value = "1";
		document.getElementById("nSize").value = "1";

		var width = window.innerWidth,
		    height = window.innerHeight;

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

		// var eq_size = d3.scaleLinear()			// scaling size of data to magnitude
		//     .domain([2,7])
		//     .range([1,25])
		//     .clamp(true);

		d3.json("topojsondata/countries-and-states.json", function(error, world) {		// drawing map
		    console.log("getting map data")
		    states = topojson.feature(world, world.objects.states).features;
		    countries = topojson.feature(world, world.objects.countries).features;
		    
		    stateSet = drawMap('state', states);
		    countrySet = drawMap('country', countries);
		    
		});

		d3.json('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson', function(error, data) {              // load/draw EARTHQUAKES
    		console.log("getting eq data");
    		drawData(data.features);
    	});

	}

	function drawMap(className, featureSet) {
		console.log("drawing " + className)
	    var set  = g.selectAll('.' + className)
	        .data(featureSet)
	        .enter()
	        .append('g')
	        .attr('class', className)
	        .attr('data-name', function(d) {
	            return d.properties.name;
	        })
	        .attr('data-id', function(d) {
	            return d.id;
	        });

	    set.append('path')
	        .attr('class', 'land')
	        .attr('d', path);

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
	       .attr("cx", function(d) {
	               return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0];
	       })
	       .attr("cy", function(d) {
	               return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1];
	       })
	       .attr("r", function(d){
	            // return eq_size(d.properties.mag);
	            return Math.exp(parseFloat(d.properties.mag)) * 0.08 + 2
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
	                return "0.8";
	            }
	        });
	}

	// --------------------------------------------------------------------------------------------------------------------------------------------
	//                                          INTERACTION EVENTS
	// --------------------------------------------------------------------------------------------------------------------------------------------
	
	var attachEvents = function(){
		var drag = d3.drag()								// rotate on drag
		    .on("start", dragstarted)
		    .on("drag", dragged)
		    .on("end", dragended);
		svg.call(drag);

		var zoom = d3.zoom()								// zoom on map
		    .on("zoom",function() {
		        g.attr("transform", d3.event.transform)
		        g.selectAll("path")  
		            .attr("d", path.projection(projection)); 
		        g.selectAll("circle")
		            .attr("d", path.projection(projection));
		        })
		svg.call(zoom)

		d3.select("#nTime").on("input", function() {		// time filter
			setOpacity();
		})
	}

	var setOpacity = function(){
		var filterNum = document.getElementById("nTime").value;

		var nodes = g.selectAll("circle")
			.attr("opacity", function(d){
				var geoangle = d3.geoDistance(
		            d.geometry.coordinates,
		            [
		                -projection.rotate()[0],
		                projection.rotate()[1]
		            ]);

				if (geoangle > 1.57079632679490) {
                	return "0";
           		} else {
					if(filterNum == 1){
				        return "0.8"
				    } else if (filterNum == 2) {
				        if (d.properties.time > thisyear) {
				            return "0.8"
				        } else {
				            return "0"
				        }
				    } else if (filterNum == 3) {
				        if (d.properties.time > thismonth) {
				            return "0.8"
				        } else {
				            return "0"
				        }
				    } else if (filterNum == 4) {
				        if (d.properties.time > thisweek) {
				            return "0.8"
				        } else {
				            return "0"
				        }
				    } else {
				        if (d.properties.time > thisday) {
				            return "0.8"
				        } else {
				            return "0"
				        }
				    }
				}
			})
	}

	function dragstarted(){
	    gpos0 = projection.invert(d3.mouse(this));
	    o0 = projection.rotate(); 
	}

	function dragged(){
	    var gpos1 = projection.invert(d3.mouse(this));
	    o0 = projection.rotate();
	    var o1 = eulerAngles(gpos0, gpos1, o0);
	    // console.log(o1);

	    // projection.rotate(o1);                               //normal rotation
	    projection.rotate([o1[0], o1[1], 0]);                   //limiting "tumble"    
	    svg.selectAll("path")
	        .attr("d", path.projection(projection));

	    var nodes = g.selectAll("circle")
	   
	    nodes.each(function(d, i) {
	        var self = d3.select(this)
	        self.attr("cx", projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0])
	        self.attr("cy", projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1])
	    })

	    setOpacity();
	}

	function dragended(){
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

