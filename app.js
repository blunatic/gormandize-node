// Get all packages needed
var express = require('express');
var router = express.Router();
var app = express();

var request = require('request');
var bodyParser = require('body-parser');
var config = require('config');
var async = require('async');
var apicache = require('apicache').options({ debug: true }).middleware;

var yelp_consumer_key, yelp_consumer_secret, yelp_token, yelp_token_secret, fs_client_id, fs_client_secret, fs_push_secret, fs_api_version;

if (process.env.NODE_ENV === 'production') {
    // heroku config vars
    yelp_consumer_key = process.env.YELP_CONSUMER_KEY;
    yelp_consumer_secret = process.env.YELP_CONSUMER_SECRET;
    yelp_token = process.env.YELP_TOKEN;
    yelp_token_secret = process.env.YELP_TOKEN_SECRET;
    fs_client_id = process.env.FS_CLIENT_ID;
    fs_client_secret = process.env.FS_CLIENT_SECRET;
    fs_push_secret = process.env.FS_PUSH_SECRET;
    fs_api_version = process.env.FS_API_VERSION;
} else {
    // development config vars
    yelp_consumer_key = config.get('yelp-consumer-key');
    yelp_consumer_secret = config.get('yelp-consumer-secret');
    yelp_token = config.get('yelp-token');
    yelp_token_secret = config.get('yelp-token-secret');
    fs_client_id = config.get('fs-client-id');
    fs_client_secret = config.get('fs-client-secret');
    fs_push_secret = config.get('fs-push-secret');
    fs_api_version = config.get('fs-api-version');
}

var yelp = require('yelp').createClient({
    consumer_key: yelp_consumer_key,
    consumer_secret: yelp_consumer_secret,
    token: yelp_token,
    token_secret: yelp_token_secret
});

console.log(process.env.YELP_CONSUMER_KEY);
console.log(process.env.YELP_CONSUMER_SECRET);
console.log(process.env.YELP_TOKEN);
console.log(process.env.YELP_TOKEN_SECRET);


var foursquare = require('node-foursquare-venues')(fs_client_id, fs_client_secret, fs_api_version);

var port = process.env.PORT || 8080;

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// set view engine to ejs
app.set('view engine', 'ejs');

router.use(function(req, res, next) {
    console.log(req.method, req.url);
    next();
});

// main page
router.get('/', function(req, res) {
    res.render('pages/index');
});

// base search route for yelp
router.get('/search?', apicache('5 minutes'), function(req, res) {
    var q = req.query.q;
    var loc = req.query.loc;
    var results = [];

    // yelp.search({term: q, location: loc, limit: 20}, function(error, data){
    async.parallel([
            /*
             * Yelp external request
             */
            function(callback) {
                yelp.search({
                    term: q,
                    location: loc,
                    limit: 20
                }, function(error, response) {
                    if (error) {
                        console.log(error);
                        callback(true);
                        return;
                    } else {
                        results.push(response);
                        callback(false, response);
                    }
                });
            },
            /*
             * Foursquare external request
             */
            function(callback) {
                foursquare.venues.explore({
                    query: q,
                    near: loc,
                    limit: 20
                }, function(error, response) {
                    if (error) {
                        console.log(error);
                        callback(true);
                        return;
                    } else {
                        results.push(response);
                        callback(false, response);
                    }
                });
            },
        ],
        /*
         * Combine both results
         */
        function(err, results) {
            if (err) {
                console.log(err);
                return;
            } else {
                // verify there's results from yelp
                if (results[0].total !== 0) {
                    console.log(results);
                    res.send({
                        yelp_response: results[0],
                        fs_response: results[1]
                    });
                } else{
                    // no results, return 204 - no content
                    res.status(204).send('Sorry we cannot find that!');
                }
            }

        });

});

router.get('/fs_photos?', function(req, res) {
    var venueId = req.query.venue;

    foursquare.venues.photos(venueId, {
        limit: 18
    }, function(error, response) {
        if (error) {
            console.log(error);
            res.send("Error!" + error);
        } else {
            res.send(response);
        }
    });

});


router.get('/about', function(req, res) {
    res.render('pages/about');
});

router.get('/help', function(req, res) {
    res.render('pages/help');
});

// 404 handling
router.use(function(req, res, next) {
    res.status(404).send('Sorry cant find that!');
});

app.use('/', router);

app.listen(port);
console.log("Server started!");