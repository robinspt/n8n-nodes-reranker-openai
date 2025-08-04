const gulp = require('gulp');

gulp.task('build:icons', function() {
	return gulp.src('nodes/**/*.{png,svg}')
		.pipe(gulp.dest('dist/nodes/'));
});

gulp.task('build', gulp.series('build:icons'));
