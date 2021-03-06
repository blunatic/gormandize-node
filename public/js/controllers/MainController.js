// main app controller
angular.module('gormandize').controller('MainController', function($scope, $filter, $http, $sce, DTOptionsBuilder, DTColumnDefBuilder, searchService, photosService) {
    var pendingSearch;
    var map;
    var markers = [];
    var venuesLayerGroup = new L.layerGroup();

    $scope.Math = window.Math;

    $scope.yelpResults = null;
    $scope.fsResults = null;
    $scope.fsPhotos = null;

    $scope.load = function() {
        // load map
        var default_latitude = 37.7733;
        var default_longitude = -122.4367;

        map = L.map('map', {
            center: [default_latitude, default_longitude],
            zoom: 12,
            scrollWheelZoom: false
        });

        L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            detectRetina: true
        }).addTo(map);

        $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('responsive', true).withOption('bFilter', false).withDisplayLength(5).withLanguage({
            "sLengthMenu": ""
        });
        $scope.dtColumnDefs = [
            DTColumnDefBuilder.newColumnDef(2).notSortable(),
            DTColumnDefBuilder.newColumnDef(3).notSortable()
        ];
    };

    $scope.getLocation = function() {
        // geolocation for finding user's location (Google Maps API)
        $scope.loadingLoc = true;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(getPosition);
        } else {
            console.log("Geolocation is not supported by this browser.");
            alert('Unabled to get location due to browser location settings being disabled.');
        }
    };

    // show position on map based on user location entered
    function getPosition(position) {
        var locCurrent = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setView(new L.LatLng(position.coords.latitude, position.coords.longitude), 12, {
            animate: true
        });

        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            'latLng': locCurrent
        }, function(results, status) {
            // console.log(results);
            var locCountryNameCount = 0;
            var finalLocation = results[locCountryNameCount].formatted_address;
            // console.log("final location is: " + finalLocation);
            $scope.location = finalLocation;
            $scope.loadingLoc = false;
            $scope.$apply();
        });

    }

    $scope.change = function() {
        if (pendingSearch) {
            clearTimeout(pendingSearch);
        }
        if ($scope.location && $scope.query) {
            pendingSearch = setTimeout(fetch, 1000);
        }
    };

    function fetch() {
        $scope.loadingQuery = true;
        $scope.noResults = false;

        // clear out markers each time
        markers.length = 0;

        searchService.getSearch($scope.query, $scope.location).then(function(response) {
            // console.log(response);
            if (response.status == 200) {

                $scope.yelpResults = response.data.yelp_response;
                $scope.fsResults = response.data.fs_response.response;

                // clear out any previous venues on map
                venuesLayerGroup.clearLayers();

                // show all sections
                $scope.loadingQuery = false;
                $scope.displayResults = true;

                // display results from both Yelp and Foursquare
                displayYelpResults($scope.yelpResults);
                displayFoursquareResults($scope.fsResults);

                // scroll to map after map's DOM element is visible
                setTimeout(scrollToMap, 100);

            } else {
                // show no results text
                $scope.noResults = true;
                $scope.loadingQuery = false;
            }
        });

    }

    function displayYelpResults(results) {

        var orangeMarker = L.AwesomeMarkers.icon({
            prefix: 'fa',
            icon: 'yelp',
            markerColor: 'orange'
        });
        // sanitize phone number (remove '+1-)
        // & add each venue marker to map
        for (var i = 0; i < results.businesses.length; i++) {
            if (typeof(results.businesses[i].display_phone) != "undefined") {
                results.businesses[i].display_phone = results.businesses[i].display_phone.replace('+1-', '');
            } else {
                results.businesses[i].display_phone = "Not Available";
            }

            var new_latitude = results.businesses[i].location.coordinate.latitude;
            var new_longitude = results.businesses[i].location.coordinate.longitude;

            var nextMarker = L.marker([new_latitude, new_longitude], {
                icon: orangeMarker,
                riseOnHover: true
            }).bindPopup('<strong>' + results.businesses[i].name + '</strong><br>' + results.businesses[i].location.address);
            var venueName = results.businesses[i].name;

            if ($.inArray(venueName, markers) == -1) {
                markers.push(venueName);
                venuesLayerGroup.addLayer(nextMarker);
            }
        }

        map.setView(new L.LatLng(results.businesses[0].location.coordinate.latitude, results.businesses[0].location.coordinate.longitude), 16, {
            animate: true
        });

        map.addLayer(venuesLayerGroup);

        // grab only top 10 business results for chart 1
        // limit if more than 10 results
        var chart1data = [];
        var chart1Count = results.businesses.length;
        if (chart1Count > 10) {
            chart1Count = 10;
        }

        // set data values for chart 1
        for (var m = 0; m < chart1Count; m++) {
            chart1data.push({
                "name": results.businesses[m].name,
                "numberofratings": results.businesses[m].review_count,
                "ratings": results.businesses[m].rating
            });
        }

        var chart1 = AmCharts.makeChart("chart-1", {
            "type": "serial",
            "fontFamily": "Cabin",
            "theme": "none",
            "legend": {
                "useGraphSettings": true,
                "markerSize": 12,
                "valueWidth": 0,
                "verticalGap": 0
            },
            "titles": [],
            "dataProvider": chart1data,
            "valueAxes": [{
                "gridColor": "#FFFFFF",
                "gridAlpha": 0.0,
                "dashLength": 0
            }],
            "startDuration": 1,
            "graphs": [{
                "balloonText": "[[title]]: <b>[[value]]</b><br>Average Rating: <b>[[ratings]]</b>",
                "labelText": "[[ratings]]",
                "labelColorField": "#fff",
                "labelPosition": "top",
                "title": "Number of Reviews",
                "type": "column",
                "fillAlphas": 1,
                "fillColors": "#F0AD4E",
                "lineColor": "#F0AD4E",
                "valueField": "numberofratings",
                "color": "#3A6D9A"
            }],
            "rotate": false,
            "categoryField": "name",
            "categoryAxis": {
                "gridPosition": "start",
                "gridAlpha": 0,
                "autoWrap": true
            }
        });
    }

    function displayFoursquareResults(results) {
        $scope.venueMenus = [];
        $scope.venueIds = [];

        // display first venue's photos by default
        $scope.currentVenueID = 0;

        var orangeMarker = L.AwesomeMarkers.icon({
            prefix: 'fa',
            icon: 'foursquare',
            markerColor: 'orange'
        });

        // sanitize venue urls
        for (var i = 0; i < results.groups[0].items.length; i++) {
            // gather venue ids
            $scope.venueIds.push(results.groups[0].items[i].venue.id);

            results.groups[0].items[i].venue.id = "https://foursquare.com/v/" + name.replace(/\s+/g, '-').toLowerCase() + results.groups[0].items[i].venue.id;
            if (!results.groups[0].items[i].venue.hasMenu) {
                $scope.venueMenus[i] = "No Menu Available";
            } else {
                $scope.venueMenus[i] = "View Menu";
            }

            var new_latitude = results.groups[0].items[i].venue.location.lat;
            var new_longitude = results.groups[0].items[i].venue.location.lng;

            var nextMarker = L.marker([new_latitude, new_longitude], {
                icon: orangeMarker,
                riseOnHover: true
            }).bindPopup('<strong>' + results.groups[0].items[i].venue.name + '</strong><br>' + results.groups[0].items[i].venue.location.address);
            var venueName = results.groups[0].items[i].venue.name;

            // check if marker has already been added to map for each venue (uniqueness is by venue name)
            // only add marker if one doesn't exist already
            if ($.inArray(venueName, markers) == -1) {
                markers.push(venueName);
                venuesLayerGroup.addLayer(nextMarker);
            }
        }

        map.addLayer(venuesLayerGroup);

        // display first venue's photos by default
        displayFoursquarePhotos($scope.venueIds[$scope.currentVenueID]);


        var chart2data = [];
        var chart3data = [];

        var chart2Count = results.groups[0].items.length;

        if (chart2Count > 10) {
            chart2Count = 10;
        }

        var priceTier;
        // grab only top 10 results for chart 2 and 3
        for (var k = 0; k < chart2Count; k++) {
            priceTier = results.groups[0].items[k].venue.price;

            if (typeof(priceTier) != "undefined") {
                chart2data.push({
                    "name": results.groups[0].items[k].venue.name,
                    "averagerating": results.groups[0].items[k].venue.rating,
                    "pricetier": results.groups[0].items[k].venue.price.tier
                });
            } else {
                chart2data.push({
                    "name": "Unavailable"
                });
            }

            chart3data.push({
                "venueName": results.groups[0].items[k].venue.name,
                "checkins": results.groups[0].items[k].venue.stats.checkinsCount
            });
        }

        var chart2 = AmCharts.makeChart("chart-2", {
            "type": "serial",
            "fontFamily": "Cabin",
            "theme": "none",
            "legend": {
                "useGraphSettings": true,
                "markerSize": 12,
                "valueWidth": 0,
                "verticalGap": 0
            },
            "titles": [],
            "dataProvider": chart2data,
            "valueAxes": [{
                "gridColor": "#FFFFFF",
                "gridAlpha": 0.0,
                "dashLength": 0
            }],
            "startDuration": 1,
            "graphs": [{
                "balloonText": "[[title]]: <b>[[pricetier]]</b><br>Average Rating: <b>[[averagerating]]</b>",
                "labelText": "[[pricetier]]",
                "labelColorField": "#fff",
                "labelPosition": "top",
                "title": "Average Rating",
                "type": "column",
                "fillAlphas": 1,
                "fillColors": "#3A6D9A",
                "lineColor": "#3A6D9A",
                "valueField": "averagerating",
                "color": "#F0AD4E"
            }],
            "rotate": false,
            "categoryField": "name",
            "categoryAxis": {
                "gridPosition": "start",
                "gridAlpha": 0,
                "autoWrap": true
            }
        });
    

        var chart3 = AmCharts.makeChart("chart-3", {
            "type": "pie",
            "fontFamily": "Cabin",
            "pathToImages": "http://cdn.amcharts.com/lib/3/images/",
            "balloonText": "[[title]]<br><span style='font-size:14px'><b>[[value]]</b> ([[percents]]%)</span>",
            "labelRadius": 27,
            "pullOutRadius": "9%",
            "startRadius": "300%",
            "alpha": 0.65,
            "baseColor": "",
            "brightnessStep": 56.1,
            "hoverAlpha": 0.47,
            "outlineColor": "",
            "outlineThickness": 17,
            "titleField": "venueName",
            "valueField": "checkins",
            "borderColor": "",
            "color": "#888888",
            "fontSize": 12,
            "theme": "default",
            "allLabels": [],
            "balloon": {},
            "legend": {
                "markerType": "circle",
                "position": "right",
                "marginRight": 80,
                "autoMargins": false
            },
            "titles": [],
            "dataProvider": chart3data
        });

    }

    function displayFoursquarePhotos(venueId) {
        $scope.displayPhotos = true;

        // console.log("current venue is " + $scope.currentVenueID);

        photosService.getPhotos(venueId).then(function(response) {
            // console.log(response);
            if (response.status == 200) {
                $scope.currentVenuePhotos = response.data.response.photos;
            } else {
                console.log("error!");
            }
        });
    }

    function scrollToMap() {
        $("html, body").animate({
            scrollTop: $('.map').offset().top - 80
        }, 1000);

    }

    $scope.nextPhoto = function() {
        $scope.currentVenueID++;
        if ($scope.currentVenueID >= $scope.venueIds.length) {
            $scope.currentVenueID = 0;
        }
        if ($scope.currentVenueID < 0) {
            $scope.currentVenueID = $scope.venueIds.length - 1;
        }
        displayFoursquarePhotos($scope.venueIds[$scope.currentVenueID]);
    };

    $scope.previousPhoto = function() {
        $scope.currentVenueID--;
        if ($scope.currentVenueID >= $scope.venueIds.length) {
            $scope.currentVenueID = 0;
        }
        if ($scope.currentVenueID < 0) {
            $scope.currentVenueID = $scope.venueIds.length - 1;
        }
        displayFoursquarePhotos($scope.venueIds[$scope.currentVenueID]);
    };
});