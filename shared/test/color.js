import test from 'ava';

import {RGBColor, RGBAColor} from '../src/color.js';

test('an RGB color from an integer', t => {
	// Arrange
	const integer = 0x123456;

	// Act
	const color = RGBColor.fromInteger(integer);

	// Assert
	t.is(color.r, 0x12, 'check that the red component is correct.');
	t.is(color.g, 0x34, 'check that the green component is correct.');
	t.is(color.b, 0x56, 'check that the blue component is correct.');
});

test('an RGBA color from an integer', t => {
	// Arrange
	const integer = 0x12345678;

	// Act
	const color = RGBAColor.fromInteger(integer);

	// Assert
	t.is(color.r, 0x12, 'check that the red component is correct.');
	t.is(color.g, 0x34, 'check that the green component is correct.');
	t.is(color.b, 0x56, 'check that the blue component is correct.');
	t.is(color.a, 0x78, 'check that the alpha component is correct.');
});

test('an RGB color to CSS when components have fractional parts', t => {
	// Arrange
	const color = new RGBColor(33.333, 33.333, 33.333);

	// Act
	const css = color.toCSS();

	// Assert
	t.is(css, '#212121', 'check that the CSS output is correct.');
});

