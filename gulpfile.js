var gulp            = require('gulp'); 
var connect         = require('gulp-connect');
var autoprefixer    = require('gulp-autoprefixer');
var sourcemaps      = require('gulp-sourcemaps');


// JS Concat + Uglify
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var cssmin  = require('gulp-cssmin');
var rename  = require('gulp-rename');


 
gulp.task('dist', function() {
    gulp.src([
        './src/scripts/annotation.js', 
        './src/scripts/editor.js', 
        './src/scripts/annotator.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(stripDebug())
    .pipe(uglify()).on('error', errorHandler)
    .pipe(concat("annotator.min.js"))
    .pipe(gulp.dest("./dist"))

    gulp.src([
        './src/scripts/annotation.js', 
        './src/scripts/editor.js', 
        './src/scripts/annotator.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(stripDebug())
    .pipe(concat("annotator.js"))
    .pipe(gulp.dest("./dist"))


    gulp.src([
        './src/styles/annotator.scss'
    ])
    .pipe(sass()).on('error', errorHandler)
    .pipe(autoprefixer(['>5%', 'ie >= 9']))
    .pipe(cssmin())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./dist'))

    gulp.src([
        './src/styles/annotator.scss'
    ])
    .pipe(sass()).on('error', errorHandler)
    .pipe(autoprefixer(['>5%', 'ie >= 9']))
    .pipe(gulp.dest('./dist'))

});


// Sass
gulp.task('sass', function() {
    return gulp.src('./src/styles/**/*.scss')
    .pipe(sass()).on('error', errorHandler)
    .pipe(autoprefixer(['>5%', 'ie >= 9']))
    .pipe(gulp.dest('./example/css'))
    .pipe(connect.reload());
});


gulp.task('copy', function(){
  gulp.src(['./src/scripts/**/*.js'])
    .pipe(gulp.dest('./example/scripts')).on('error', errorHandler);
    gulp.src('./src/*.html')
    .pipe(gulp.dest('./example'));
});



// Server
gulp.task('webserver', function() {
    connect.server({
        root: ['example', './bower_components'],
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