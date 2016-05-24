var controller = require('.'),
    express = require('express'),
    pkg = require('../package'),
    router = express.Router();

router.get('/', function(req, res) {
  res.json({
    version: pkg.version
  });
});

router.post('/serfEvent', function(req, res) {
  res.sendStatus(202);
  controller.handleSerfEvent(req.body || '', {
    event: req.get('Serf-Event'),
    userEvent: req.get('Serf-User-Event')
  });
});

module.exports = router;
