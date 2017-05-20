var _ = require('lodash'),
    config = require('./config'),
    cp = require('child_process'),
    fs = require('fs'),
    glob = require('glob'),
    handlebars = require('./handlebars');

exports.initialize = function() {

  if (!fs.existsSync('/etc/nginx/nginx.conf')) {
    var nginxOptions = _.extend({}, config.nginxTemplateOptions);
    fs.writeFileSync('/etc/nginx/nginx.conf', config.templates.nginx(nginxOptions), { encoding: 'utf-8' });
  }

  exports.applyServerConfigurations(false);
};

exports.applyServerConfigurations = function(reloadNginx) {

  if (!_.isEmpty(config.serverNames)) {
    _.each(config.serverNames, function(name) {
      var templateOptions = _.extend({}, config.serversTemplateOptions[name]);
      fs.writeFileSync('/etc/nginx/sites-serf/' + name + '.conf', config.templates.servers[name](templateOptions), { encoding: 'utf-8' });
    });

    cleanServers(true);
  } else {
    fs.writeFileSync('/etc/nginx/sites-serf/default.conf', config.templates.defaultServer({}), { encoding: 'utf-8' });
    cleanServers(false);
  }

  if (reloadNginx !== false) {
    try {
      cp.execSync('/usr/sbin/nginx -s reload');
      console.log('nginx reloaded');
    } catch (err) {
      // ignore
    }
  }
};

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
