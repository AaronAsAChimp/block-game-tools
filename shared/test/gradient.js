import test from 'ava';

import {RGBColor} from '../src/color.js';
import {Gradient, buildGradientParam, parseGradientParam} from '../src/gradient.js';

test('a gradient to a CSS string', t => {
	// Arrange
	const gradient = new Gradient();
	gradient.addStop(0, RGBColor.fromInteger(0xFF0000));
	gradient.addStop(1, RGBColor.fromInteger(0x0000FF));

	// Act
	const color = gradient.toCSS();

	// Assert
	t.is(color, 'linear-gradient(to right, #ff0000 0%, #0000ff 100%)', 'check that the CSS conversion is correct.');
});

test('a gradient with multiple stops to a CSS string', t => {
	// Arrange
	const gradient = new Gradient();
	gradient.addStop(0, RGBColor.fromInteger(0xFF0000));
	gradient.addStop(1, RGBColor.fromInteger(0x0000FF));
	gradient.addStop(0.25, RGBColor.fromInteger(0x00FF00));
	gradient.addStop(0.75, RGBColor.fromInteger(0xF000F0));

	// Act
	const color = gradient.toCSS();

	// Assert
	t.is(color, 'linear-gradient(to right, #ff0000 0%, #00ff00 25%, #f000f0 75%, #0000ff 100%)', 'check that the CSS conversion is correct.');
});

test('a gradient with stops inserted in reverse order', t => {
	// Arrange
	const gradient = new Gradient();
	gradient.addStop(1, RGBColor.fromInteger(0x0000FF));
	gradient.addStop(0.75, RGBColor.fromInteger(0xF000F0));
	gradient.addStop(0.25, RGBColor.fromInteger(0x00FF00));
	gradient.addStop(0, RGBColor.fromInteger(0xFF0000));

	// Act
	const color = gradient.toCSS();

	// Assert
	t.is(color, 'linear-gradient(to right, #ff0000 0%, #00ff00 25%, #f000f0 75%, #0000ff 100%)', 'check that the CSS conversion is correct.');
});

test('a gradient with stops at the same location', t => {
	// Arrange
	const gradient = new Gradient();
	gradient.addStop(1, RGBColor.fromInteger(0x0000FF));
	gradient.addStop(0, RGBColor.fromInteger(0xFF0000));
	gradient.addStop(1, RGBColor.fromInteger(0x0000FF));
	gradient.addStop(1, RGBColor.fromInteger(0x0000FF));

	// Act
	const color = gradient.toCSS();

	// Assert
	t.is(color, 'linear-gradient(to right, #ff0000 0%, #0000ff 100%, #0000ff 100%, #0000ff 100%)', 'check that the CSS conversion is correct.');
});


test('a gradient with one stop in the middle extrapolating past the end', t => {
	// Arrange
	const gradient = new Gradient();
	gradient.addStop(0.5, RGBColor.fromInteger(0x0000FF));

	// Act
	const idx = gradient.findStop(1);

	// Assert
	t.is(idx, 0, 'check that the CSS conversion is correct.');
});

test('a gradient with one stop in the middle extrapolating before the start', t => {
	// Arrange
	const gradient = new Gradient();
	gradient.addStop(0.5, RGBColor.fromInteger(0x0000FF));

	// Act
	const idx = gradient.findStop(0);

	// Assert
	t.is(idx, 0, 'check that the CSS conversion is correct.');
});

test('a gradient with stops that don\'t reach the end', t => {
	// Arrange
	const gradient = new Gradient();
	gradient.addStop(0.4, RGBColor.fromInteger(0x0000FF));
	gradient.addStop(0, RGBColor.fromInteger(0xFF0000));

	// Act
	const color = gradient.interpolate(1);

	// Assert
	t.is(color.toCSS(), '#0000ff', 'check that the CSS conversion is correct.');
});

test('parsing a simple gradient from a string', t => {
	// Arrange
	const gradientString = 'FFFFFF-000000-12';

	// Act
	const gradient = parseGradientParam(gradientString);

	// Assert
	t.is(gradient.steps, 12, 'check that the number of stops is correct.');
	t.is(gradient.stops[0][0].toInteger(), 0xFFFFFF, 'check that the color of the first stop is correct.');
	t.is(gradient.stops[0][1], 0, 'check that the offset of the first stop is correct.');
	t.is(gradient.stops[1][0].toInteger(), 0x000000, 'check that the color of the first stop is correct.');
	t.is(gradient.stops[1][1], 1, 'check that the offset of the second stop is correct.');
});

test('parsing a complex gradient from a string', t => {
	// Arrange
	const gradientString = 'FFFFFF@20-000000@40-12';

	// Act
	const gradient = parseGradientParam(gradientString);

	// Assert
	t.is(gradient.steps, 12, 'check that the number of stops is correct.');
	t.is(gradient.stops[0][0].toInteger(), 0xFFFFFF, 'check that the color of the first stop is correct.');
	t.is(gradient.stops[0][1], 0.2, 'check that the offset of the first stop is correct.');
	t.is(gradient.stops[1][0].toInteger(), 0x000000, 'check that the color of the first stop is correct.');
	t.is(gradient.stops[1][1], 0.4, 'check that the offset of the second stop is correct.');
});

test('stringifying a gradient', t => {
	// Arrange
	const gradient = new Gradient();
	gradient.addStop(0, RGBColor.fromInteger(0xFF0000));
	gradient.addStop(1, RGBColor.fromInteger(0x0000FF));
	gradient.addStop(0.25, RGBColor.fromInteger(0x00FF00));
	gradient.addStop(0.75, RGBColor.fromInteger(0xF000F0));

	// Act
	const gradientString = buildGradientParam(gradient, 12);

	// Assert
	t.is(gradientString, 'ff0000@0-00ff00@25-f000f0@75-0000ff@100-12', 'check that the string is correct');
});
