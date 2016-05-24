module.exports = function(grunt) {

  grunt.initConfig({
    bump: {
      options: {
        files: [ 'package.json' ],
        commit: false,
        createTag: false,
        push: false
      }
    },

    jshint: {
      files: [ 'Gruntfile.js', 'bin/**/*', 'lib/**/*.js', 'spec/**/*.js' ]
    },

    jasmine_nodejs: {
      all: {
        specs: [
          "spec/**"
        ],
        helpers: [
          "spec/helpers/**"
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jasmine-nodejs');

  grunt.registerTask('default', [ 'jshint', 'jasmine_nodejs' ]);
};
