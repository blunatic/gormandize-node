angular.module('gormandize', ['datatables']);

// factory for consuming web services and returning data to controller
angular.module('gormandize').factory('searchService', function($http) {
    return {
        getSearch: function(query, location) {
            // return promise to data
            return $http.get('/search?q=' + query + '&loc=' + location).then(function(response) {
                // resolve the promise as the data
                // console.log(response);
                return response;
            });
        }
    };
});

// factory for consuming web services and returning data to controller
angular.module('gormandize').factory('photosService', function($http) {
    return {
        getPhotos: function(venueId) {
            // return promise to data
            return $http.get('/fs_photos?venue=' + venueId).then(function(response) {
                // resolve the promise as the data
                // console.log(response);
                return response;
            });
        }
    };
});