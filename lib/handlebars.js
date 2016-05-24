var _ = require('lodash'),
    handlebars = require('handlebars'),
    serf = require('./serf');

handlebars.registerHelper('with_members', function() {

  var tagStrings = Array.prototype.slice.call(arguments),
      options = tagStrings.pop();

  var context = _.extend({}, this);

  var members = serf.findMembers(serf.parseTagStrings(tagStrings));
  if (members.length) {
    context.members = members;
    return options.fn(context);
  } else {
    return options.inverse(this);
  }
});

module.exports = handlebars;
