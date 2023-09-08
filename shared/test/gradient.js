import test from 'ava';

import {RGBColor} from '../src/color.js';
import {Gradient} from '../src/gradient.js';

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

