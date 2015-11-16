// main app controller
angular.module('gormandize').controller('MainController', function($scope, $filter, $http, $sce, $location, DTOptionsBuilder, DTColumnDefBuilder, searchService, photosService) {
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
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', false).withDisplayLength(5).withLanguage({
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
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            console.log("Geolocation is not supported by this browser.");
            alert('Unabled to get location due to browser location settings being disabled.');
        }
    };

    // show position on map based on user location entered
    function showPosition(position) {
        var locCurrent = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setView(new L.LatLng(position.coords.latitude, position.coords.longitude), 15, {
            animate: true
        });
        var singleMarker = new L.marker([position.coords.latitude, position.coords.longitude]).addTo(map)
            .bindPopup('<strong>Your Location!</strong><br>Gormandize Example.')
            .openPopup();

        markers.push(singleMarker);
        map.addLayer(markers[0]);

        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            'latLng': locCurrent
        }, function(results, status) {
            console.log(results);
            var locCountryNameCount = 0;
            var finalLocation = results[locCountryNameCount].formatted_address;
            console.log(finalLocation);
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

        searchService.getSearch($scope.query, $scope.location).then(function(response) {
            console.log(response);
            if (response.status == 200) {
                $scope.yelpResults = response.data.yelp_response;
                $scope.fsResults = response.data.fs_response.response;

                // clear out any previous venues on map
                venuesLayerGroup.clearLayers();

                // display results from both Yelp and Foursquare
                displayYelpResults($scope.yelpResults);
                displayFoursquareResults($scope.fsResults);
            } else {
                $scope.noResults = true;
                $scope.loadingQuery = false;
            }
        });

    }

    function displayYelpResults(results) {
        $scope.loadingQuery = false;
        $scope.displayMap = true;
        $scope.displayTable = true;
        $scope.displayTips = true;
        $scope.displayCharts = true;

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

            var nextMarker = L.marker([new_latitude, new_longitude]).bindPopup('<strong>' + results.businesses[i].name + '</strong><br>' + results.businesses[i].location.address);
            var venueName = results.businesses[i].name;

            if ($.inArray(venueName, markers) == -1) {
                markers.push(venueName);
                venuesLayerGroup.addLayer(nextMarker);
                console.log("Markers contains: " + markers);
            }
        }

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
            "fontFamily": "Lato",
            "theme": "none",
            "handDrawn": true,
            "handDrawScatter": 3,
            "legend": {
                "useGraphSettings": true,
                "markerSize": 12,
                "valueWidth": 0,
                "verticalGap": 0
            },
            "titles": [],
            "dataProvider": chart1data,
            "valueAxes": [{
                "minorGridAlpha": 0.08,
                "minorGridEnabled": true,
                "position": "top",
                "axisAlpha": 0
            }],
            "startDuration": 1,
            "graphs": [{
                "balloonText": "<span style='font-size:13px;'>[[title]] for [[category]]:<b>[[value]]</b></span>",
                "title": "Number of Reviews",
                "type": "column",
                "fillAlphas": 1,
                "fillColors": "#F0AD4E",
                "lineColor": "#F0AD4E",
                "valueField": "numberofratings",
            }, {
                "balloonText": "<span style='font-size:13px;'>[[title]] for [[category]]:<b>[[value]]</b></span>",
                "bullet": "round",
                "bulletBorderAlpha": 1,
                "bulletColor": "#3A6D9A",
                "useLineColorForBulletBorder": true,
                "fillAlphas": 0,
                "lineThickness": 2,
                "lineAlpha": 1,
                "lineColor": "#3A6D9A",
                "bulletSize": 20,
                "title": "Average Rating",
                "valueField": "ratings"
            }],
            "rotate": true,
            "categoryField": "name",
            "categoryAxis": {
                "gridPosition": "start"
            }
        });
    }

    function displayFoursquareResults(results) {
        $scope.venueMenus = [];
        $scope.venueIds = [];

        // display first venue's photos by default
        $scope.currentVenueID = 0;

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

            var nextMarker = L.marker([new_latitude, new_longitude]).bindPopup('<strong>' + results.groups[0].items[i].venue.name + '</strong><br>' + results.groups[0].items[i].venue.location.address);
            var venueName = results.groups[0].items[i].venue.name;

            // check if marker has already been added to map for each venue (by name)
            if ($.inArray(venueName, markers) == -1) {
                markers.push(venueName);
                venuesLayerGroup.addLayer(nextMarker);
                console.log("Markers contains: " + markers);
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
                    "y": results.groups[0].items[k].venue.price.tier,
                    "x": results.groups[0].items[k].venue.rating,
                    "value": results.groups[0].items[k].venue.name
                });
            } else {
                chart2data.push({
                    "y": "Unavailable"
                });
            }

            chart3data.push({
                "venueName": results.groups[0].items[k].venue.name,
                "checkins": results.groups[0].items[k].venue.stats.checkinsCount
            });
        }

        var chart2 = AmCharts.makeChart("chart-2", {
            "type": "xy",
            "fontFamily": "Lato",
            "pathToImages": "http://www.amcharts.com/lib/3/images/",
            "plotAreaBorderAlpha": 0.35,
            "plotAreaBorderColor": "#F0AD4E",
            "plotAreaFillAlphas": 0.50,
            "plotAreaFillColors": "#F0AD4E",
            "startDuration": 1.5,
            "borderColor": "#FFFFFF",
            "color": "#333",
            "fontSize": 13,
            "hideBalloonTime": 154,
            "trendLines": [],
            "theme": "light",
            "titles": [],
            "dataProvider": chart2data,
            "valueAxes": [{
                "position": "bottom",
                "axisAlpha": 0,
                "title": "Restaurant Average Rating"
            }, {
                "minMaxMultiplier": 1.2,
                "axisAlpha": 0,
                "position": "left",
                "title": "Restaurant Price Tier"
            }],
            "graphs": [{
                "balloonText": "Average Rating: <b>[[x]]</b><br> Price Tier: <b>[[y]]</b><br>Restaurant: <b>[[value]]</b>",
                "bullet": "circle",
                "bulletBorderAlpha": 0.2,
                "bulletAlpha": 0.8,
                "bulletSize": 30,
                "lineAlpha": 0,
                "lineColor": "#3a6d9a",
                "fillAlphas": 0,
                "valueField": "value",
                "xField": "x",
                "yField": "y",
                "maxBulletSize": 100
            }],
            "marginLeft": 46,
            "marginBottom": 35
        });

        var chart3 = AmCharts.makeChart("chart-3", {
            "type": "pie",
            "fontFamily": "Lato",
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

        console.log("current is " + $scope.currentVenueID);
        if ($scope.currentVenueID >= $scope.venueIds.length) {
            $scope.currentVenueID = 0;
        }
        if ($scope.currentVenueID < 0) {
            $scope.currentVenueID = $scope.venueIds.length - 1;
        }

        photosService.getPhotos(venueId).then(function(response) {
            console.log(response);
            if (response.status == 200) {
                $scope.currentVenuePhotos = response.data.response.photos;
            } else {
                console.log("error!");
            }
        });
    }

    $scope.nextPhoto = function() {
        $scope.currentVenueID++;
        displayFoursquarePhotos($scope.venueIds[$scope.currentVenueID]);
    };

    $scope.previousPhoto = function() {
        $scope.currentVenueID--;
        displayFoursquarePhotos($scope.venueIds[$scope.currentVenueID]);
    };
});