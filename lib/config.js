var _ = require('lodash'),
    fs = require('fs'),
    glob = require('glob'),
    handlebars = require('handlebars'),
    p = require('bluebird'),
    yaml = require('js-yaml');

var config = {
  nginxTemplateOptions: {},
  serversTemplateOptions: {},
  templates: {
    servers: {}
  },
  serf: {
    tags: {}
  }
};

config.load = function() {

  var fileConfig;
  try {
    fileConfig = yaml.safeLoad(fs.readFileSync('/etc/nginx-serf/config.yml', { encoding: 'utf-8' }));
  } catch (err) {
    fileConfig = {};
  }

  try {
    config.serverNames = _.map(glob.sync('*.conf.hbs', { cwd: '/etc/nginx-serf/sites' }), function(filename) {
      return filename.replace(/\.conf.hbs$/, '');
    });
  } catch (err) {
    config.serverNames = [];
  }

  config.templates.nginx = loadHandlebarsTemplate('/opt/nginx-serf/templates/nginx.conf.hbs');
  config.templates.defaultServer = loadHandlebarsTemplate('/opt/nginx-serf/templates/default.conf.hbs');

  _.each(config.serverNames, function(name) {
    config.templates.servers[name] = loadHandlebarsTemplate('/etc/nginx-serf/sites/' + name + '.conf.hbs');
  });

  if (_.isObject(fileConfig.nginx_template_options)) {
    config.nginxTemplateOptions = fileConfig.nginx_template_options;
  }

  if (_.isObject(fileConfig.servers_template_options)) {
    config.serversTemplateOptions = _.reduce(fileConfig.servers_template_options, function(memo, value, key) {
      if (_.isObject(value)) {
        memo[key] = value;
      }

      return memo;
    }, {});
  }

  if (_.isObject(fileConfig.serf)) {
    if (_.isObject(fileConfig.serf.tags)) {
      config.serf.tags = fileConfig.serf.tags;
    }
  }

  return p.resolve(config);
};

function loadHandlebarsTemplate(path) {
  return handlebars.compile(fs.readFileSync(path, { encoding: 'utf-8' }));
}

module.exports = config;
