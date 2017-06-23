'use strict';

var app = app || {};

app.main = (function() {

	const {ipcRenderer} = require('electron') 

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ queuing data calls

	function drawGlobeData(data){		
		// console.log("drawing globe")
		var earthquakes = [];
	    
	    for (var i = 0; i <data[0].features.length; i++){ earthquakes.push(data[0].features[i]) }		// put all eqs into one array for drawing
	    for (var i = 0; i <data[1].features.length; i++){ earthquakes.push(data[1].features[i]) };
		// not sure if this step is necessary now that not using d3... but this sorts eqs by time before drawing them. 
	    earthquakes.sort( function(a, b) {  return d3.ascending(a.properties.time, b.properties.time) });
		
		drawData(earthquakes);

		initTemplates();
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ instantiating templates
	var source, question_template, definition_template, retm_template, news_template;

	function initTemplates(){
		// console.log("initializing templates")

		source = $("#question_template").html();
		question_template = Handlebars.compile(source);

		source = $("#definition_template").html();
		definition_template = Handlebars.compile(source);

		source = $("#retm_template").html();
		retm_template = Handlebars.compile(source);

		source = $("#news_template").html();
		news_template = Handlebars.compile(source);

		ipcRenderer.send("get-retm", {url:"http://www.iris.edu/hq/api/json-dmc-evid-retm?callback=a", which: "retm"})

		d3.json("data/defs_and_questions.json", function(err, res){
				var questions = res["questions"]
				addQuestions(questions);

				showTemplate("#question_container", question_template, res);
				showTemplate("#definition_container", definition_template, res);
				showTemplate("#news_container", news_template, res)
		})
	}

	function showTemplate(div, template, data){
		// console.log("showing template " + div);
		$(div).html(template(data));
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ RETM

	var retm_data = [];

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ IPC COMMUNICATION STUFF

	var ipcSetup = function(){

		ipcRenderer.on('filter', (event, arg) => {
			filterData(arg.time, arg.size);
		});

		ipcRenderer.on('return-retm', (event, arg) => {
			// console.log(arg)
			retm_data = arg;
			addRETMtoGlobe(arg);
			showTemplate("#retm_container", retm_template, {"retm": arg}); 
			attachEvents();
		});
		
		ipcRenderer.on('knob-status', (event, arg) => {
			// console.log("arduino connected: ", arg);
			if (arg) {
				$('#filter_container').hide();				
			} else {
				setupFilters();
			}
		})

		ipcRenderer.on('return-globe-data', (event, arg) => {
			drawGlobeData(arg);
		})
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ INTERACTION
	

	var checkInactivity = function(){
		var idleTime = 0;
		var isInactive = false;
		$(document).ready(function () {
		    var idleInterval = setInterval(timerIncrement, 100); // testing w 5 seconds
		    $(this).mousemove(function (e) {
		        idleTime = 0;
		        isInactive = false;
		    });
		});

		function timerIncrement() {
			var delay = 300	// delay = 2 min
		    idleTime = idleTime + 1;
		    if (idleTime > delay) {
		        isInactive = true;
		        if(isInactive && idleTime < delay + 20) {
		        	rotateTo(11.241288, -76.651682, 1)
		        } else {
		        	spinGlobe(0.005)
		        }
		    }
		}
	}

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

		$('.locate').click( function(){
			checkifthingsareopen(isVideoOpen, isNewsOpen);
			var num = $(this).attr("data-id")
			rotateTo(retm_data[num].location.lat, retm_data[num].location.lng, 2)
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
					rotateTo(loc[0], loc[1], 2)
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

		$('.q-entry').mouseenter(function(){
			$(this).addClass("highlighted")
			$(this).children("i").css("border", "solid black").css("border-width", "0 3px 3px 0")
		}).mouseleave(function(){
			$(this).removeClass("highlighted")
			$(this).children("i").css("border", "solid white").css("border-width", "0 3px 3px 0")
		})

		$('.d-entry').mouseenter(function(){
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
			isNewsOpen = false;

			isVideoOpen = true;
			$('#usarray-view').slideDown();

			setTimeout(function(){
			  if (isVideoOpen){
			  	$('#usarray-view').slideUp();
			  	isVideoOpen = false;
			  }
			}, 100000);

		})

		$('#close-usarray').click(function(){
			isVideoOpen = false;
			$('#usarray-view').slideUp();
		})

		$('.news').click(function(){
			$('#usarray-view').slideUp();
			isVideoOpen = false;
			
			if ($(this).siblings('.view-news').hasClass("closed")) {
				$('.news').each(function(){
					$(this).siblings('.view-news').removeClass("open").addClass("closed").slideUp();
				})
				$(this).siblings('.view-news').removeClass("closed").addClass("open").slideDown();
				isNewsOpen = true;
			} else {
				$(this).siblings('.view-news').removeClass("open").addClass("closed").slideUp();
			}

			setTimeout(function(){
				if (isNewsOpen){
					$('.news').each(function(){
						$(this).siblings('.view-news').removeClass("open").addClass("closed").slideUp();
					})
					isNewsOpen = false;
				}
			}, 60000);
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
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ INIT 

	var setupFilters = function(){
		document.getElementById("nTime").value = "0";	//if there's no arduino, set the filters to min values
		document.getElementById("nSize").value = "0";
	}

	var init = function(){
		ipcSetup();	// setup communication
		setupGlobe();  // setup globe
		ipcRenderer.send('get-globe-data');
		attachEvents();	// setup interaction
		checkInactivity(); 

		setTimeout(function(){
		  ipcRenderer.send('knob', 'test');
		}, 2000);
	}

	return {
		init: init,
	};

})();

window.addEventListener('DOMContentLoaded', app.main.init);
