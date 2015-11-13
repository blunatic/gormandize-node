'use strict';

/**
 * Simple implementation of the Foursquare Venues API
 * For more information on search options please check :
 *   https://developer.foursquare.com/docs/venues/search
 *   https://developer.foursquare.com/docs/venues/categories
 *   https://developer.foursquare.com/docs/venues/explore
 */

var request = require('request');
var querystring = require('querystring');

var baseUrl = 'https://api.foursquare.com/v2/venues/';


// Used to handle the response for all the API calls
function createResponseHandler(callback) {
  return function (err, res, body) {
    if (err) {
      return callback(err, null);
    }
    if (res.statusCode >= 300) {
      return callback(body, null);
    }
    // Since JSON parse can fail
    var jsonData;
    try {
      jsonData = JSON.parse(body);
    } catch (error) {
      return callback(error, null);
    }

    return callback(null, jsonData);
  };
}

/**
 * Class constructor, setup the credentials for API calls
 *
 * @param  {String} clientId
 * @param  {String} clientSecret
 * @return {Undefined}
 */
var FoursquareVenues = function (clientId, clientSecret)  {
  this.credentials = {
    'client_id': clientId,
    'client_secret': clientSecret,
    // Param v should be a date format YYYYMMDD
    // >> see https://developer.foursquare.com/overview/auth#userless
    'v': '20140101'
  };
};

/**
 * Creates the API foursquare url (used internally)
 * @param  {String} path
 * @return {String}
 */
FoursquareVenues.prototype.createUrl = function (path, options) {
  var query = '';
  if (options) {
    query = querystring.stringify(options) + '&';
  }
  query += querystring.stringify(this.credentials);

  return [
    baseUrl,
    path,
    '?',
    query
  ].join('');
};

/**
 * Gets all the categories
 *
 * @param  {Function} callback
 * @return {Undefined}
 */
FoursquareVenues.prototype.getCategories = function (callback) {
  request(this.createUrl('categories'), createResponseHandler(callback));
};

/**
 * Search venues with the given options
 * options are : ll, near, llAcc, alt, altAcc, query, limit, intent,
 * radius, sw, ne, categoryId, url, providerId, linkedId
 *
 * @param  {Object}   options
 * @param  {Function} callback
 * @return {Undefined}
 */
FoursquareVenues.prototype.searchVenues = function (options, callback) {
  request(this.createUrl('search', options), createResponseHandler(callback));
};

/**
 * Expolre venue with the given options
 * options are: ll, near, llAcc, alt, altAcc, radius,
 * section, query, limit, novelty
 *
 * @param  {Object}   options
 * @param  {Function} callback
 * @return {Undefined}
 */
FoursquareVenues.prototype.exploreVenues = function (options, callback) {
  request(this.createUrl('explore', options), createResponseHandler(callback));
};

/**
 * Gets one venue matching the options
 *
 * @param  {String}   venueId
 * @param  {Function} callback
 * @return {Undefined}
 */
FoursquareVenues.prototype.getVenue = function (venueId, callback) {
  request(this.createUrl(venueId), createResponseHandler(callback));
};

module.exports = FoursquareVenues;
