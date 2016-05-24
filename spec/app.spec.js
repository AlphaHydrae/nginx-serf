var app = require('../lib/app'),
    expect = require('chai').expect,
    pkg = require('../package'),
    request = require('supertest');

describe("API", function() {
  describe("GET /", function() {
    it("should return its version", function(done) {
      request(app)
        .get('/api')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          expect(res.body).to.eql({
            version: pkg.version
          });
        })
        .end(function(err, res) {
          return err ? done.fail(err) : done();
        });
    });
  });
});
