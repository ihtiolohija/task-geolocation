const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express();
const mcache = require('memory-cache');

const clients = require('./routes/clients');
const locations = require('./routes/locations');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/*
    Stores client details to memory storage
 */
const storeClient = (req, res, next) => {
    let client = {
        ip: req.ip,
        url: req.originalUrl,
        dateTime: Date.now()
    };
    let clients = app.get('clients') || [];

    clients.push(client);

    app.set('clients', clients);
    next();
};

/*
    Checks if request data is available in-cache; if yes, returns cached value
 */
const cache = (req, res, next) => {
    let key = req.originalUrl;
    let cachedValue = mcache.get(key);
    if (cachedValue) {
        return res.send(cachedValue);
    }
    next();
};


app.all('*', storeClient, cache);

app.use('/', clients);
app.use('/', locations);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;