'use strict';

var app = app || {};

app.main = (function() {

	const {ipcRenderer} = require('electron') 

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ queuing data calls
	
	function callGlobeData(){
		console.log("calling data for globe")
		d3.queue(2)				// calling map data
		.defer(d3.json, "data/history.json")
		.defer(d3.json, "http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson")
		.awaitAll(function(error, results){
			if (error) throw error;
			// console.log(results)
			drawGlobeData(results);
		})
	}

	function drawGlobeData(data){
		console.log("drawing globe")


		// var tectonicPlates = data[0];
	    // drawMap('plates', tectonicPlates.features, false);

	    var earthquakes = [];
	    
	    for (var i = 0; i <data[0].features.length; i++){ earthquakes.push(data[0].features[i]) }		// UNCOMMENT FOR MAJOR LAG 
	    for (var i = 0; i <data[1].features.length; i++){ earthquakes.push(data[1].features[i]) };
		earthquakes.sort( function(a, b) {  return d3.ascending(a.properties.time, b.properties.time) });
		
		drawData(earthquakes);

		initTemplates();
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ instantiating templates
	var source, question_template, definition_template, retm_template, news_template;

	function initTemplates(){
		console.log("initializing templates")

		source = $("#question_template").html();
		question_template = Handlebars.compile(source);

		source = $("#definition_template").html();
		definition_template = Handlebars.compile(source);

		source = $("#retm_template").html();
		retm_template = Handlebars.compile(source);

		source = $("#news_template").html();
		news_template = Handlebars.compile(source);

		// calling data for the templates
		ipcRenderer.send("get-url", {url:"http://www.iris.edu/hq/api/json-dmc-evid-retm?callback=a", which: "retm"})

		d3.json("data/defs_and_questions.json", function(err, res){
				var questions = res["questions"]
				addQuestions(questions);

				showTemplate("#question_container", question_template, res);
				showTemplate("#definition_container", definition_template, res);
				showTemplate("#news_container", news_template, res)
		})
	}

	function showTemplate(div, template, data){
		console.log("showing template " + div);
		$(div).html(template(data));
	}

	var findLatLon = function(loc, callback){
	    var coordinates

	    d3.json("http://maps.googleapis.com/maps/api/geocode/json?address=" + loc + "&sensor=true", function(err, res){
	    	// sconsole.log(res)
	        callback(err, {lat: res['results'][0]['geometry']['location']['lat'], lon: res['results'][0]['geometry']['location']['lng'] })
	    })
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ RETM
	// http://ds.iris.edu/ds/nodes/dmc/tools/event/ + iris_dmc_event_id
	// var findInParsed = function(html, selector){
	//     var check = $(selector, html).get(0);
	//     if(check)
	//         return $(check);
	//     check = $(html).filter(selector).get(0)
	//     return (check)? $(check) : false;
	// }

	function findInParsed(html, selector){
	    return $(selector, html).get(0) || $(html).filter(selector).get(0);
	}

	var findWaveForm = function(id, callback){
		console.log("finding waveform")

		$.ajax({								// check if picture exists before calling
		    url:"data/"+id+"_waveform.png",
		    type:'HEAD',
		    error:
		        function(){
		            ipcRenderer.send("get-waveform", {id: id, which: "waveform"}, function(res){
						callback(res);										// <<<<<<<<<<<<<<<<<<<< HOW DO I INSERT THIS INTO THE FILTERED RETM DATA ? ASYNC PROBLEMS
					});
		        },
		    success:
		        function(){
		            console.log("picture!" + id)
		        }
		});
	}

	var retm_data = [];

	function filterRETM(data, callback) {
		console.log("filtering retm")
		// console.log(data.length)
		var parse = data.substr(2, data.length-4);
		var retmdata = $.parseJSON(parse)
		// console.log(retmdata)
		var filteredData = [];
		var namelist = [];

		for (var i = 0; i < retmdata.dmc_evid_retm.length; i++) {
			var name = retmdata.dmc_evid_retm[i].short_region;

			if ($.inArray(name, namelist) == -1) {	
				filteredData.push(retmdata.dmc_evid_retm[i])
				namelist.push(name)
				if (namelist.length >= 5) {
					break;
				}
			}
		}

		// console.log("namelist", namelist)

		var q = d3.queue(1);

		for (var i = 0; i < filteredData.length; i++){
		  q.defer(findLatLon, filteredData[i].short_region);
		}

		q.awaitAll(function(err, res) {
			if (err) throw err;
			console.log("retm queue done");
			for (var i = 0; i < filteredData.length; i++){
				filteredData[i].location = res[i]
				findWaveForm(filteredData[i]["iris_dmc_event_id"], function(info){
					console.log(info)
				})

			}

			retm_data = filteredData
			callback({'retm': filteredData})
		});
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SOCKET STUFF

	var ipcSetup = function(){

		ipcRenderer.on('filter', (event, arg) => {
			console.log(arg)
			filterData(arg.time, arg.size);
		});

		ipcRenderer.on('return-requested-data', (event, arg) => {
			if (arg.which == "retm"){
				filterRETM(arg.body, function(filtered){
					addRETMtoGlobe(filtered['retm']);
					showTemplate("#retm_container", retm_template, filtered); 
					attachEvents();
				})
			} else if (arg.which == "waveform"){

			} else {
				console.log(arg)
			}
		})
		
		ipcRenderer.on('knob-status', (event, arg) => {
			console.log("arduino connected: ", arg);
			if (arg) {
				$('#filter_container').hide();				
			} else {
				setupFilters();
			}
		})

		ipcRenderer.on('return-requested-data', (event, arg) => {

		})

	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ INTERACTION
	var checkifthingsareopen = function(video, news){
		if (video || news) {
			$('#usarray-view').slideUp();
			$('.news').each(function(){
				$(this).siblings('.view-news').removeClass("open").addClass("closed").slideUp();
			})
			isVideoOpen = false;
			isNewsOpen = false;
		}
	}

	var isVideoOpen = false;
	var isNewsOpen = false;

	var attachEvents = function(){

		console.log("attaching events")

		$('.locate').click( function(){
			checkifthingsareopen(isVideoOpen, isNewsOpen);
			var num = $(this).attr("data-id")
			console.log("locate ", retm_data[num].short_region)
			rotateTo(retm_data[num].location.lat, retm_data[num].location.lon)
		})

		$('.q-entry').click(function(){
			checkifthingsareopen(isVideoOpen, isNewsOpen);
			if ($(this).children("i").hasClass("up")) {
				
				$('.q-entry').each(function(){
					$(this).children("i").removeClass("down").addClass("up").siblings('p').slideUp();
				})

				$(this).children("i").removeClass("up").addClass("down").siblings('p').slideDown();
				
				var data_loc = $(this).attr('data-loc')
				if (data_loc !== undefined){
					var loc = data_loc.split(",")
					rotateTo(loc[0], loc[1])
				}
			} else {
				$(this).children("i").removeClass("down").addClass("up").siblings('p').slideUp();
			}
		})

		$('.d-entry').click(function(){
			if ($(this).children("i").hasClass("up")) {

				$('.d-entry').each(function(){
					$(this).children("i").removeClass("down").addClass("up").siblings('p').slideUp();
				})

				$(this).children("i").removeClass("up").addClass("down").siblings('p').slideDown();

			} else {
				$(this).children("i").removeClass("down").addClass("up").siblings('p').slideUp();
			}
		})

		$('.entry').mouseenter(function(){
			$(this).addClass("highlighted")
			$(this).children("i").css("border", "solid black").css("border-width", "0 3px 3px 0")
		}).mouseleave(function(){
			$(this).removeClass("highlighted")
			$(this).children("i").css("border", "solid white").css("border-width", "0 3px 3px 0")
		})

		$('#usarray').click(function(){
			$('.news').each(function(){
				$(this).siblings('.view-news').removeClass("open").addClass("closed").slideUp();
			})

			isVideoOpen = true;
			$('#usarray-view').slideDown();

			setTimeout(function(){
			  if (isVideoOpen){
			  	$('#usarray-view').slideUp();
			  }
			}, 180000);

		})

		$('#close-usarray').click(function(){
			isVideoOpen = false;
			$('#usarray-view').slideUp();
		})

		$('.news').click(function(){
			if ($(this).siblings('.view-news').hasClass("closed")) {
				$('.news').each(function(){
					$(this).siblings('.view-news').removeClass("open").addClass("closed").slideUp();
				})
				$(this).siblings('.view-news').removeClass("closed").addClass("open").slideDown();
				isNewsOpen = true;
			} else {
				$(this).siblings('.view-news').removeClass("open").addClass("closed").slideUp();
			}
		})

		$('.close-view-news').click(function(){
			isNewsOpen = false;
			$(this).parent().removeClass("open").addClass("closed").slideUp()
		})

		d3.select("#nTime").on("input", function() {		// time filter
			var timeval = this.value;
			var sizeval = document.getElementById("nSize").value;
			filterData(timeval, sizeval);
		})

		d3.select("#nSize").on("input", function() {		// time filter
			var timeval = document.getElementById("nTime").value;
			var sizeval = this.value;
			filterData(timeval, sizeval);
		})
		
		initMouseoverInteraction();
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ INIT 

	var setupFilters = function(){
		document.getElementById("nTime").value = "0";
		document.getElementById("nSize").value = "0";
	}



	var init = function(){
		console.log('Initializing app.');
		ipcSetup();
		setupGlobe();
		callGlobeData();
		attachEvents();

		setTimeout(function(){
		  ipcRenderer.send('knob', 'test');
		}, 2000);
	}

	return {
		init: init,
	};

})();

window.addEventListener('DOMContentLoaded', app.main.init);
