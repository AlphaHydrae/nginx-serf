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

handlebars.registerHelper('with_members', function() {

  var tagStrings = Array.prototype.slice.call(arguments),
      options = tagStrings.pop();

  var context = _.extend({}, this);

  var serverMembers = filterMembers(tagStrings);
  if (serverMembers.length) {
    context.members = serverMembers;
    return options.fn(context);
  } else {
    return options.inverse(this);
  }
});

var nginxTemplate = loadHandlebarsTemplate('nginx'),
    defaultServerTemplate = loadHandlebarsTemplate('default');

var nginxOptions = _.extend({}, config.nginx_template_options);
fs.writeFileSync('/etc/nginx/nginx.conf', nginxTemplate(nginxOptions), { encoding: 'utf-8' });

if (!_.isEmpty(config.serverNames)) {
  _.each(config.serverNames, function(name) {
    updateServer(name);
  });

  cleanServers(true);
} else {
  fs.writeFileSync('/etc/nginx/sites-serf/default.conf', defaultServerTemplate({}), { encoding: 'utf-8' });
  cleanServers(false);
}

reloadNginx();

function updateServer(name) {
  var templateOptions = _.extend({}, config.servers_template_options[name]);
  fs.writeFileSync('/etc/nginx/sites-serf/' + name + '.conf', config.serverTemplates[name](templateOptions), { encoding: 'utf-8' });
}

function cleanServers(cleanDefault) {

  var serverConfs = glob.sync('*.conf', { cwd: '/etc/nginx/sites-serf' });

  var confsToDelete = _.filter(serverConfs, function(filename) {
    var name = filename.replace(/\.conf$/, '');
    return name == 'default' ? !!cleanDefault : !_.includes(config.serverNames, name);
  });

  _.each(confsToDelete, function(filename) {
    fs.unlinkSync('/etc/nginx/sites-serf/' + filename);
  });
}

function loadHandlebarsTemplate(name) {
  return handlebars.compile(fs.readFileSync('/opt/nginx-serf/templates/' + name + '.conf.hbs', { encoding: 'utf-8' }));
}

function loadConfig() {

  var config;
  try {
    config = yaml.safeLoad(fs.readFileSync('/etc/nginx-serf/config.yml', { encoding: 'utf-8' }));
  } catch (err) {
    config = {};
  }

  try {
    config.serverNames = _.map(glob.sync('*.conf.hbs', { cwd: '/etc/nginx-serf/sites' }), function(filename) {
      return filename.replace(/\.conf.hbs$/, '');
    });
  } catch (err) {
    config.serverNames = [];
  }

  config.serverTemplates = _.reduce(config.serverNames, function(memo, name) {
    memo[name] = handlebars.compile(fs.readFileSync('/etc/nginx-serf/sites/' + name + '.conf.hbs', { encoding: 'utf-8' }));
    return memo;
  }, {});

  if (!_.isObject(config.servers_template_options)) {
    config.servers_template_options = {};
  }

  console.log(JSON.stringify(config, null, 2));

  return config;
}

function filterMembers(tagStrings) {

  var tags = _.reduce(tagStrings, function(memo, tagString) {

    var parts = tagString.split('=');
    if (parts.length == 2) {
      memo[parts[0]] = parts[1];
    }

    return memo;
  }, {});

  return _.filter(members, function(member) {
    return _.isMatch(member.tags, _.extend({}, config.serf.tags, tags));
  });
}

function getSerfMembers() {

  var tagOptions = '';
  if (config.serf && config.serf.tags) {
    tagOptions = _.reduce(config.serf.tags, function(memo, value, key) {
      return memo + ' --tag ' + key + '=' + value;
    }, '');
  }

  var memberStrings;
  try {
    memberStrings = cp.execSync('/opt/bin/serf members' + tagOptions).toString().trim().split("\n");
  } catch (err) {
    return [];
  }

  return _.reduce(memberStrings, function(memo, member) {

    var parts = member.split(/\s+/);
    if (parts.length == 4) {

      var status = parts[2];
      if (status != 'alive') {
        return memo;
      }

      var addressParts = parts[1].split(':'),
          tagMappings = parts[3].split(',');

      memo.push({
        id: parts[0],
        address: addressParts[0],
        port: addressParts[1],
        status: status,
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

function reloadNginx() {
  try {
    cp.execSync('/usr/sbin/nginx -s reload');
  } catch (err) {
    // ignore
  }
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
