'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var rimraf = require('rimraf');
var browserSync = require('browser-sync');
var runSequence = require('run-sequence');
var gls = require('gulp-live-server');
var replace = require('gulp-replace');
var concat = require('gulp-concat');
var autoprefixer = require ('gulp-autoprefixer');

// DEVELOPMENT TASKS
//================================================

/*
* 1. Setup a webserver with livereload using BrowserSync
* 2. JS and CSS get processed and served from the 'build' folder
* */

 // BrowserSync Server
gulp.task('browser-sync', function() {
  browserSync.init([
    './build/css/*.css',
    './build/js/**/*.js',
    './**/*.html'
  ],
  {
    notify: false,
    server: {
      baseDir: ['./']
    },
    port: 3500,
    browser: [],
    tunnel: false
  });
});

// ENV
gulp.task('env', function() {
  process.env.APP_BASE_PATH = __dirname;
});


gulp.task('css', function() {
    // Extract the CSS from the JS Files and place into a single style with autoprefixer
    gulp.src('src/app/components/**/*.js')
    .pipe(replace(/(^[\s\S]*<style>|<\/style>[\s\S]*$)/gm, ''))
    .pipe(concat('style.css'))
    .pipe(autoprefixer({browsers: ['last 2 versions']}))
    .pipe(gulp.dest('build/app'));
});

// PUBLIC 
gulp.task('public', ['js', 'css'], function() {
  process.env.SYSTEM_JS_PATH = __dirname + "/build"
  gulp.src('jspm_packages/**/*.*')
  .pipe(gulp.dest('public/jspm_packages/'));

  gulp.src('build/app/**/*.css')
  .pipe(gulp.dest('public/build/app'));

  gulp.src('build/app/**/*.js')
  .pipe(gulp.dest('public/build/app'));

  gulp.src('build/client/**/*.js')
    .pipe(gulp.dest('public/build/client'));
});

// JS
gulp.task('js', function() {
    gulp.src('src/app/**/*.js')
      // remove the styles (they were extracted)
      .pipe(replace(/<style>[\s\S]*<\/style>/gm, ''))
      .pipe(gulp.dest('build/app'));
    gulp.src('src/client/**/*.js')
      .pipe(gulp.dest('build/client'));
    gulp.src('src/server/**/*.js')
      .pipe(gulp.dest('build/server'));
});

// HTML
gulp.task('html', function() {
  gulp.src(['./index.html'])
    .pipe(gulp.dest('./build'));
});

// serve task
gulp.task('serve', ['html', 'public', 'env'] , function(cb) {
  var server = gls.new('app.js');
  server.start();


  plugins.watch(
      './src/**/*.js',
      {
        name: 'JS'
      },
      function() {
        gulp.start('public');
        server.notify();
      }
  );
  gulp.watch('app.js', server.start);
});

gulp.task('browser', ['browser-sync', 'html', 'js'] , function(cb) {

  plugins.watch(
      './src/**/*.js',
      {
        name: 'JS'
      },
      function() {
        gulp.start('js');
      }
  );
});

// Delete build Directory
gulp.task('delete-build', function() {
  rimraf('./build', function(err) {
    plugins.util.log(err);
  });
});

//build (no server)
gulp.task('build', ['sass']);

// Default
gulp.task('default', ['serve']);



// DISTRIBUTION TASKS
//===============================================

// Delete dist Directory
gulp.task('delete-dist', function() {
  rimraf('./dist', function(err) {
    plugins.util.log(err);
  });
});

// CSS
/*
gulp.task('css', function() {
  return gulp.src('./build/css/main.css')
    .pipe(gulp.dest('./dist/css'))
    .pipe(plugins.csso())
    .pipe(plugins.rename('main.min.css'))
    .pipe(gulp.dest('./dist/css'))
    .on('error', plugins.util.log);
    });*/

// Bundle with jspm
gulp.task('bundle', ['js'], plugins.shell.task([
  'jspm bundle-sfx build/js/main dist/js/app.js'
]));

// Uglify the bundle
gulp.task('uglify', function() {
  return gulp.src('./dist/js/app.js')
    .pipe(plugins.sourcemaps.init({loadMaps: true}))
    .pipe(plugins.uglify())
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(plugins.rename('app.min.js'))
    .pipe(gulp.dest('./dist/js'))
    .on('error', plugins.util.log);
});

gulp.task('dist', function() {
  runSequence(
    'delete-dist',
    'build',
    ['css', 'html', 'bundle'],
    'uglify'
  );
});
