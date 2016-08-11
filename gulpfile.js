'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var injectSvg = require('gulp-inject-svg');

// Set default tasks (run with 'gulp')
gulp.task('default', ['browser-sync','styles', 'watch']);

// Watch for changes in the styles and dev folders
gulp.task('watch', function(){
	gulp.watch('./assets/styles/**/*.scss', ['styles']);
	gulp.watch('./dev/**/*.html', ['html', reload]);
});

// Sync browsers to root folder
gulp.task('browser-sync', function(){
  browserSync.init({
    server: './'  
  })
});

// Pipe changes made in development folder to root
gulp.task('html', function(){
	return gulp.src('./dev/**/*.html')
		.pipe(gulp.dest('./'));
});

// Compile CSS from SCSS files
gulp.task('styles', function(){
	return gulp.src('./assets/styles/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
		.pipe(concat('main.css'))
		.pipe(gulp.dest('./assets/styles/'))
		.pipe(reload({stream: true}));
});

// Inject SVG elements in html files and pipe to root folder
gulp.task('injectSvg', function(){
	return gulp.src('./dev/**/*.html')
		.pipe(injectSvg())
		.pipe(gulp.dest('./'));
});