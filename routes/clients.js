const express = require('express');
const router = express.Router();
const auth = require('basic-auth');
const compare = require('tsscmp');

const checkCredentials = (name, pass) => {
    let valid = true;
    // Simple method to prevent short-circut and use timing-safe compare
    valid = compare(name, 'eleonora') && valid;
    valid = compare(pass, 'secret') && valid;
    return valid;
};

/* GET API stats*/
router.get('/usage', function (req, res) {
    let credentials = auth(req);
    if (!credentials || !checkCredentials(credentials.name, credentials.pass)) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic');
        res.end('Access denied')
    } else {
        let clientsStorage = req.app.get('clients');
        res.send(clientsStorage);
    }
});

module.exports = router;