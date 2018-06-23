const express = require('express');
const router = express.Router();
const request = require('request');
const mcache = require('memory-cache');

const GEOCODES_BASEURL = 'https://api.opencagedata.com/geocode/v1/google-v3-json';
const MEDIAWIKI_BASEURL = 'https://en.wikipedia.org/w/api.php';
const MEDIAWIKI_PARAMS = 'action=query&prop=coordinates|pageimages|pageterms&colimit=50&piprop=thumbnail' +
    '&pithumbsize=144&pilimit=50&wbptterms=description&generator=geosearch&ggsradius=10000&ggslimit=50&format=json';
const OPENCAGE_APIKEY = '23b141d50e944d458861c370a25b401f';


const saveToCache = (key, value) => {
    mcache.put(key, value);
};

/*
    GET geolocation by address
 */
router.get('/geocode', function (req, res) {
    let address = req.query.address;
    if (!address) {
        res.status(422);
        return res.send('Missing address required parameter');
    }

    request(`${GEOCODES_BASEURL}?address=${address}&pretty=1&key=${OPENCAGE_APIKEY}&no_annotations=1`, {json: true},
        (err, response, body) => {
            if (err) {
                return res.send(err);
            }
            let results = body.results;
            if (results.length > 0) {
                //TODO if no location is found, return 500 a data cannot be retrieved
                let location = results[0].geometry.location;
                let locationFormatted = {
                    lat: location.lat,
                    lon: location.lng,
                };
                saveToCache(req.originalUrl, locationFormatted);
                return res.send(locationFormatted);
            }
            else {
                res.status(500);
                return res.send('A data cannot be retrieved.')
            }
        });
});

/*
    GET wiki nearby data by coordinates
 */
router.get('/wikiNearby', function (req, res) {
    let {lon, lat} = req.query;
    if (!lon || !lat) {
        res.status(422);
        return res.send('Missing one or more required parameters');
    }
    let coordinates = `${lat}|${lon}`;
    request.get(`${MEDIAWIKI_BASEURL}?${MEDIAWIKI_PARAMS}&ggscoord=${coordinates}`, {json: true},
        (err, response, body) => {
            if (err) {
                res.statusCode(500);
                return res.send(err);
            }
            let result = body.query;
            let pages = result ? result.pages : null;
            if (!result || !pages) {
                res.status(500);
                return res.send('A data cannot be retrieved.')
            }
            let reducedResult = Object.keys(pages).reduce((accumulator, key) => {
                let currentValue = pages[key];
                accumulator.push({
                    title: currentValue.title,
                    thumbnailUrl: currentValue.thumbnail ? currentValue.thumbnail.source : '',
                    coordinates: currentValue.coordinates.length > 0 ? {
                        lat: currentValue.coordinates[0].lat,
                        lon: currentValue.coordinates[0].lon
                    } : {}
                });
                return accumulator;
            }, []);

            saveToCache(req.originalUrl, reducedResult);
            res.send(reducedResult);
        });
});

/* POST clears in-memory cache.*/
router.post('/purgeCache', function (req, res) {
    mcache.clear();
    res.send('OK');
});

module.exports = router;