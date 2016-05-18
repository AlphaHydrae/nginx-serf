#!/usr/bin/env node

var http = require('http');

var hostname = process.env.HOST || '0.0.0.0';
var port = process.env.PORT || 3000;
var name = process.env.NAME || 'World';

var server = http.createServer(function(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello ' + name + '!\n');
});

server.listen(port, hostname, function() {
  console.log('Server running at http://' + hostname + ':' + port);
});
