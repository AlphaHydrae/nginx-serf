var bodyParser = require('body-parser'),
    express = require('express'),
    logger = require('morgan'),
    path = require('path');

var api = require('./api');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.text());

app.use('/api', api);

// Catch 404 and forward to error handler.
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handler.
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message
  });
});

module.exports = app;
