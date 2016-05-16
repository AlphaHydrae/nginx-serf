#!/usr/bin/env node

var _ = require('lodash'),
    cp = require('child_process'),
    fs = require('fs'),
    handlebars = require('handlebars'),
    path = require('path');

var config;
try {
  config = require('/etc/nginx-serf/config.json');
} catch (err) {
  config = {};
}

var nginxTemplate = loadHandlebarsTemplate('nginx'),
    defaultServerTemplate = loadHandlebarsTemplate('server.default'),
    proxyServerTemplate = loadHandlebarsTemplate('server.proxy'),
    staticServerTemplate = loadHandlebarsTemplate('server.static');

var nginxOptions = {};
fs.writeFileSync('/etc/nginx/nginx.conf', nginxTemplate(nginxOptions), { encoding: 'utf-8' });

fs.writeFileSync('/etc/nginx/conf.d/default.conf', defaultServerTemplate({}), { encoding: 'utf-8' });

cleanServers();

function cleanServers() {

  var serverConfs = _.without(fs.readdirSync('/etc/nginx/conf.d'), 'default.conf');

  var confsToDelete = _.filter(serverConfs, function(filename) {
    var name = filename.replace(/\.conf$/, '');
    return !_.some(config.servers, function(server) {
      return server.name == name;
    });
  });

  _.each(confsToDelete, function(name) {
    fs.unlinkSync('/etc/nginx/conf.d/' + name);
  });
}

function loadHandlebarsTemplate(name) {
  return handlebars.compile(fs.readFileSync('/opt/nginx-serf/templates/' + name + '.conf.handlebars', { encoding: 'utf-8' }));
}

function getSerfMembers() {

  var members;
  try {
    members = cp.execSync('/opt/bin/serf members').toString().trim().split("\n");
  } catch (err) {
    return;
  }

  return _.reduce(members, function(memo, member) {

    var parts = member.split(/\s+/);
    if (parts.length == 4) {

      var addressParts = parts[1].split(':'),
          tagMappings = parts[3].split(',');

      memo.push({
        id: parts[0],
        host: addressParts[0],
        port: addressParts[1],
        status: parts[2],
        tags: _.reduce(tagMappings, function(memo, tagMapping) {
          var tagMappingParts = tagMapping.split('=');
          memo[tagMappingParts[0]] = tagMappingParts[1];
          return memo;
        }, {})
      });
    }

    return memo;
  }, []);
}
