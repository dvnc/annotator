var gulp            = require('gulp'); 
var connect         = require('gulp-connect');
var autoprefixer    = require('gulp-autoprefixer');
var sourcemaps      = require('gulp-sourcemaps');


// JS Concat + Uglify
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
 
gulp.task('scriptsmin', function() {
  gulp.src(['./src/scripts/*.js'])
    .pipe(sourcemaps.init())
    .pipe(stripDebug())
    .pipe(uglify()).on('error', errorHandler)
    .pipe(gulp.dest('./build/scripts/min'))
    .pipe(connect.reload());
});




// Sass
var sass = require('gulp-sass');
gulp.task('sass', function() {
    return gulp.src('./src/styles/**/*.scss')
    .pipe(sass()).on('error', errorHandler)
    .pipe(autoprefixer(['>5%', 'ie >= 9']))
    .pipe(gulp.dest('./build/css'))
    .pipe(connect.reload());
});


gulp.task('copy', function(){
  gulp.src(['./src/scripts/**/*.js'])
    .pipe(gulp.dest('./build/scripts')).on('error', errorHandler);
    gulp.src('./src/*.html')
    .pipe(gulp.dest('./build'));
});



// Server
gulp.task('webserver', function() {
    connect.server({
        root: ['build', './bower_components'],
        livereload: true
    });
});


gulp.task('htmlreload', function () {
  gulp.src('./src/*.html')
    .pipe(connect.reload());
});


function errorHandler (error) {
  console.log(error.toString());
  this.emit('end');
}


// watch
gulp.task('watch', function() {
    // gulp.watch('./src/*.html', ['htmlreload', 'copy']);
    gulp.watch('./src/styles/**/*.scss', ['sass']);
    gulp.watch('./src/scripts/**/*.js', ['copy']);
    gulp.watch('./src/**/*.html', ['copy']);
});

gulp.task('default', ['htmlreload', 'copy', 'sass', 'webserver', 'watch']);