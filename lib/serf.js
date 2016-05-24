var _ = require('lodash'),
    config = require('./config'),
    cp = require('child_process'),
    p = require('bluebird');

var serf = {
  members: []
};

serf.refreshMembers = function() {
  serf.members = getSerfMembers();
  return p.resolve(serf.members);
};

serf.findMembers = function(tags, members) {
  members = members || serf.members;

  if (!tags || _.isEmpty(tags)) {
    return members;
  }

  return _.filter(members, function(member) {
    return _.isMatch(member.tags, tags);
  });
};

serf.parseTagStrings = function(tagStrings) {
  return _.reduce(tagStrings, function(memo, tagString) {

    var parts = tagString.split('=');
    if (parts.length == 2) {
      memo[parts[0]] = parts[1];
    }

    return memo;
  }, {});
};

serf.parseEventMembers = function(text) {
  return _.reduce(text.trim().split("\n"), function(memo, line) {

    var parts = line.split(/\s+/);
    if (parts.length < 2 || parts.length > 4) {
      return memo;
    }

    var member = {
      name: parts[0],
      address: parts[1],
      tags: {}
    };

    if (parts.length == 3) {
      member.tags = serf.parseTagStrings(parts[2].split(/,/));
    }

    if (parts.length == 4) {
      member.role = parts[2];
      member.tags = serf.parseTagStrings(parts[3].split(/,/));
    }

    memo.push(member);
    return memo;
  }, []);
};

function getSerfMembers() {

  var tagOptions = _.reduce(config.serf.tags, function(memo, value, key) {
    return memo + ' --tag ' + key + '=' + value;
  }, '');

  var memberStrings;
  try {
    var rawMembers = cp.execSync('/opt/bin/serf members' + tagOptions);
    return parseSerfMembers(rawMembers.toString());
  } catch (err) {
    return [];
  }
}

function parseSerfMembers(text) {
  return _.reduce(text.trim().split("\n"), function(memo, member) {

    var parts = member.split(/\s+/);
    if (parts.length == 3 || parts.length == 4) {

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

module.exports = serf;
