var app = app || {};

app.main = (function() {
	console.log('Your code starts here!');

	var socket;

	// Initializing socket and adding listener functions
	var socketSetup = function(callback){
		
	    socket = io.connect();

		// Listeners
		// socket.on('init', function(data){
		// 	console.log(data)
		// 	// initMap(data);
		// });

		socket.on('init', function(){
			console.log("received socket init")
		});

		callback();
	};

	var attachEvents = function(){
		console.log("attaching events")
	};

	// var initMap = function(eqdata){
	// 	var styledMapType = new google.maps.StyledMapType(
 //        [{"featureType":"all","elementType":"labels.text","stylers":[{"visibility":"on"}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"geometry.fill","stylers":[{"color":"#EFF0E6"}]},{"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"gamma":"1.19"}]},{"featureType":"landscape.man_made","elementType":"geometry.stroke","stylers":[{"visibility":"on"},{"gamma":"0.00"},{"weight":"2.07"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#b2ac83"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#b2ac83"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#8ac0c4"}]}, {"featureType": 'water', "elementType": 'labels.text.fill', "stylers": [{"color": '#135960'}]}, { "featureType": 'poi.park', "elementType": 'geometry.fill', "stylers": [{"color": '#dde3c2'}] }],
 //          {name: 'Styled Map'}
 //          );

	// 	map = new google.maps.Map(document.getElementById('map'), {
 //          center: {lat: 38.996, lng: -98.769},
 //          zoom: 3,
 //          disableDefaultUI: true,
 //          mapTypeControlOptions: {
 //            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain',
 //                    'styled_map']
 //          }
 //        });

 //        map.mapTypes.set('styled_map', styledMapType);
 //        map.setMapTypeId('styled_map');

 //        //parsing XML for plate boundaries
 //        var myParser = new geoXML3.parser({map: map});
 //        myParser.parse('plate_boundaries.kml');

 //        var script = document.createElement('script');
 //        script.setAttribute('src', eq_feed);
 //        document.getElementsByTagName('head')[0].appendChild(script);

 //        map.data.addGeoJson(eqdata);
	// }	

	var init = function(){
		console.log('Initializing app.');
		socketSetup(attachEvents);	
	};

	return {
		init: init
	};

})();

window.addEventListener('DOMContentLoaded', app.main.init);