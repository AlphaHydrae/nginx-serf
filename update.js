#!/usr/bin/env node

var _ = require('lodash'),
    cp = require('child_process'),
    fs = require('fs'),
    glob = require('glob'),
    handlebars = require('handlebars'),
    path = require('path'),
    yaml = require('js-yaml');

var config = loadConfig(),
    members = getSerfMembers();

handlebars.registerHelper('value_or', function(value, defaultValue) {
  return value !== undefined ? value : defaultValue;
});

handlebars.registerHelper('render_partial', function(indent, partial, server) {

  var serverOptions = _.omit(server, 'server_defaults', 'servers');
  var compiled = config.partials[partial.partial](_.extend({}, serverOptions, partial.options));

  return _.reduce(compiled.split("\n"), function(memo, line, i) {
    memo.push(i == 0 ? line : new Array(indent + 1).join(' ') + line);
    return memo;
  }, []).join("\n");
});

var nginxTemplate = loadHandlebarsTemplate('nginx'),
    defaultServerTemplate = loadHandlebarsTemplate('server.default'),
    serverTemplate = loadHandlebarsTemplate('server');

var nginxOptions = {};
fs.writeFileSync('/etc/nginx/nginx.conf', nginxTemplate(nginxOptions), { encoding: 'utf-8' });

if (!_.isEmpty(config.servers)) {
  _.each(config.servers, function(server) {
    updateServer(server, config, members);
  });

  cleanServers(true);
} else {
  fs.writeFileSync('/etc/nginx/conf.d/default.conf', defaultServerTemplate({}), { encoding: 'utf-8' });
  cleanServers();
}

function updateServer(server, config, members) {

  var requiredTags = _.extend({}, config.tags, server.tags);

  var matchingMembers = _.filter(members, function(member) {
    return _.every(requiredTags, function(value, name) {
      return member.tags[name] == value;
    });
  });

  var templateOptions = _.extend({}, server, {
    members: !_.isEmpty(matchingMembers) ? matchingMembers : null
  });

  fs.writeFileSync('/etc/nginx/conf.d/' + server.id + '.conf', serverTemplate(templateOptions), { encoding: 'utf-8' });
}

function cleanServers(cleanDefault) {

  var serverConfs = glob.sync('*.serf.conf', { cwd: '/etc/nginx/conf.d' });

  var confsToDelete = _.filter(serverConfs, function(filename) {
    var id = filename.replace(/\.serf\.conf$/, '');
    return id == 'default' ? !!cleanDefault : !config.servers[id];
  });

  _.each(confsToDelete, function(id) {
    fs.unlinkSync('/etc/nginx/conf.d/' + filename);
  });
}

function loadHandlebarsTemplate(name) {
  return handlebars.compile(fs.readFileSync('/opt/nginx-serf/templates/' + name + '.conf.handlebars', { encoding: 'utf-8' }));
}

function loadConfig() {

  var config;
  try {
    config = yaml.safeLoad(fs.readFileSync('/etc/nginx-serf/config.yml', { encoding: 'utf-8' }));
  } catch (err) {
    config = {};
  }

  var serverFiles;
  try {
    serverFiles = glob.sync('*.yml', { cwd: '/etc/nginx-serf/servers' });
  } catch (err) {
    serverFiles = [];
  }

  if (!_.isObject(config.partials)) {
    config.partials = {};
  } else {
    config.partials = _.reduce(config.partials, function(memo, template, name) {
      memo[name] = handlebars.compile(template);
      return memo;
    }, {});
  }

  config.servers = _.reduce(serverFiles, function(memo, filename) {
    if (!filename.match(/\.yml$/)) {
      return memo;
    }

    var id = filename.replace(/\.yml$/, ''),
        server;

    try {
      server = yaml.safeLoad(fs.readFileSync('/etc/nginx-serf/servers/' + filename, { encoding: 'utf-8' }));
    } catch (err) {
      server = null;
    }

    if (server) {
      server.id = id;
      memo[id] = server;

      _.each(server.servers, function(currentServer) {

        if (!_.isArray(currentServer.config)) {
          currentServer.config = [];
        }

        var listen = currentServer.listen;
        if (listen) {
          currentServer.config.unshift({
            partial: 'directive',
            options: {
              name: 'listen',
              values: String(listen).split(/\+/)
            }
          });
        }

        _.each(server.server_defaults || [], function(defaults) {
          currentServer.config.unshift(defaults);
        });

        _.each(currentServer.config, function(partial, i) {
          if (_.isObject(partial) && _.keys(partial).length == 1 && _.keys(partial)[0] != 'partial') {
            currentServer.config[i] = {
              partial: 'directive',
              options: {
                name: _.keys(partial)[0],
                values: String(_.values(partial)[0]).split(/\s+/)
              }
            };
          } else if (!_.isObject(partial)) {
            currentServer.config[i] = {
              partial: partial,
              options: {}
            };
          }
        });
      });
    }

    return memo;
  }, {});

  console.log(JSON.stringify(config, null, 2));

  return config;
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

function log(message) {
  console.log(message);
  logToFile('/dev/stdout', message);
}

function warn(message) {
  console.warn(message);
  logToFile('/dev/stderr', message);
}

function logToFile(file, message) {
  try {
    fs.writeFileSync(file, message + "\n", { encoding: 'utf-8' });
  } catch (err) {
    // ignore
  }
}
