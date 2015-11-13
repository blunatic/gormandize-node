/* globals describe, it, after */

'use strict';

var expect = require('chai').expect;
var nock   = require('nock');
var FoursquareVenues = require('../foursquareVenues');

describe('Foursquare venues', function () {
  var foursquareVenues = new FoursquareVenues(
    'SOME_CLIENT_ID',
    'SOME_CLIENT_SECRET'
  );

  var scope = nock('https://api.foursquare.com')
  .filteringPath(/\?.*/g, '');

  after(function () {
    nock.cleanAll();
  });

  it('Should get all categories', function (done) {
    var fixture = require('./fixtures/categories.json');

    scope.get('/v2/venues/categories')
    .reply(200, fixture);

    foursquareVenues.getCategories(function (err, res) {
      if (err) { return done(err); }
      expect(res).to.deep.equal(fixture);

      done();
    });
  });

  it('Should get a single venue', function (done) {
    var fixture = require('./fixtures/venue.json');

    scope.get('/v2/venues/some_id')
    .reply(200, fixture);

    foursquareVenues.getVenue('some_id',  function (err, res) {
      if (err) { return done(err); }
      expect(res).to.deep.equal(fixture);

      done();
    });
  });

  it('Should search venues', function (done) {
    var fixture = require('./fixtures/venues.json');

    scope.get('/v2/venues/search')
    .reply(200, fixture);

    foursquareVenues.searchVenues({ near: 'New York' },  function (err, res) {
      if (err) { return done(err); }
      expect(res).to.deep.equal(fixture);

      done();
    });
  });

  it('Should explore venues', function (done) {
    var fixture = require('./fixtures/venues.json');

    scope.get('/v2/venues/explore')
    .reply(200, fixture);

    foursquareVenues.exploreVenues({ near: 'New York' },  function (err, res) {
      if (err) { return done(err); }
      expect(res).to.deep.equal(fixture);

      done();
    });
  });
});
