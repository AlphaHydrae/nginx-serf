var _ = require('lodash'),
    config = require('./config'),
    nginx = require('./nginx'),
    p = require('bluebird'),
    serf = require('./serf');

exports.initialize = function() {
  return p.resolve()
    .then(config.load)
    .then(logConfig)
    .then(serf.refreshMembers)
    .then(logMembers)
    .then(nginx.initialize)
    .then(logNginx);
};

exports.refreshServers = function() {
  return p.resolve()
    .then(serf.refreshMembers)
    .then(logMembers)
    .then(nginx.applyServerConfigurations)
    .then(logNginx)
    .catch(function(err) {
      console.warn(err.stack);
    });
};

exports.handleSerfEvent = function(input, options) {
  options = _.extend({}, options);

  if (_.includes([ 'member-join', 'member-leave', 'member-failed' ], options.event)) {

    var eventMembers = serf.parseEventMembers(input),
        relevantMembers = serf.findMembers(config.serf.tags, eventMembers);

    if (!relevantMembers.length) {
      console.log('nginx-serf serf event handled (no matching members)');
      return;
    }
  }

  exports.refreshServers().then(function() {
    console.log('nginx-serf' + (options.event ? ' ' + options.event : '') + ' event handled');
  });
};

function logConfig() {
  console.log('nginx-serf config loaded: ' + JSON.stringify(_.omit(config, 'templates')));
}

function logMembers() {
  console.log('nginx-serf members refreshed: ' + serf.members.length + ' matching members');
}

function logNginx() {
  console.log('nginx-serf servers updated');
}
