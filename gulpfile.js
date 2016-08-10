'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var injectSvg = require('gulp-inject-svg');

gulp.task('default', ['browser-sync','styles', 'watch']);

gulp.task('watch', function(){
	gulp.watch('./assets/styles/**/*.scss', ['styles']);
	gulp.watch('./dev/**/*.html', reload);
});

gulp.task('browser-sync', function(){
  browserSync.init({
    server: './'  
  })
});

gulp.task('styles', function(){
	return gulp.src('./assets/styles/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
		.pipe(concat('main.css'))
		.pipe(gulp.dest('./assets/styles/'))
		.pipe(reload({stream: true}));
});

gulp.task('injectSvg', function(){
	return gulp.src('./dev/**/*.html')
		.pipe(injectSvg())
		.pipe(gulp.dest('./'));
});
