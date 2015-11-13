foursquare-venues [![Build Status](https://travis-ci.org/Woorank/node-foursquare-venues.svg)](https://travis-ci.org/Woorank/node-foursquare-venues)
=================

This a simple nodejs implementation of the Foursquare Venues API with userless access (no OAuth token requried).
It will make the API call and return the parsed json result.

## Install

Just run as usual: `npm install foursquare-venues`

## Test

Test suites are built with Mocha and chai.js. To run the suite execute: `npm test`
This will check for code quality with jshint and run through the entire test suite.

## Exemple

```js
var Foursquare = require('foursquareVenues');

var foursquare = new Foursquare('CLEINT_ID', 'SECRET_ID');

foursquare.getCategories(function(error, response) {
  if (error) { return console.error(error) }
  console.log(response);
});

foursquare.getVenue('SOME_VENUE_ID', function(error, response) {
  if (error) { return console.error(error) }
  console.log(response);
});

foursquare.searchVenues({ near: 'New York' }, function(error, response) {
  if (error) { return console.error(error) }
  console.log(response);
});

foursquare.exploreVenues({ near: 'New York' }, function(error, response) {
  if (error) { return console.error(error) }
  console.log(response);
});
```

## Note

*Please report any bug, issue, ... on the issue list*
