import test from 'ava';

import {VBox, quantize} from '../src/quantizer.js';

test('adding colors to a VBox', t => {
	// Arrange
	const vbox = new VBox();

	// Act
	vbox.addPixel({
		r: 255,
		g: 128,
		b: 0
	});

	// Assert
	const colors = vbox.getPixels();

	t.is(colors.length, 1, 'check the colors length');
	t.is(colors[0].r, 255, 'check the red component');
	t.is(colors[0].g, 128, 'check the green component');
	t.is(colors[0].b, 0, 'check the blue component');
});

test('getting the red length of the VBox', t => {
	// Arrange
	const vbox = new VBox();

	// Act
	vbox.addPixel({r: 255, g: 0, b: 0});
	vbox.addPixel({r: 128, g: 0, b: 0});

	// Assert
	const rLength = vbox.getRedLength();
	const gLength = vbox.getGreenLength();
	const bLength = vbox.getBlueLength();
	const longest = vbox.identifyLongestSide();

	t.is(rLength, 127, 'check the red length of the VBox');
	t.is(gLength, 0, 'check the green length of the VBox');
	t.is(bLength, 0, 'check the blue length of the VBox');
	t.is(longest, 'r', 'check that the longest side is identified.');
});

test('getting the green length of the VBox', t => {
	// Arrange
	const vbox = new VBox();

	// Act
	vbox.addPixel({r: 0, g: 255, b: 0});
	vbox.addPixel({r: 0, g: 128, b: 0});

	// Assert
	const rLength = vbox.getRedLength();
	const gLength = vbox.getGreenLength();
	const bLength = vbox.getBlueLength();
	const longest = vbox.identifyLongestSide();

	t.is(rLength, 0, 'check the red length of the VBox');
	t.is(gLength, 127, 'check the green length of the VBox');
	t.is(bLength, 0, 'check the blue length of the VBox');
	t.is(longest, 'g', 'check that the longest side is identified.');
});

test('getting the blue length of the VBox', t => {
	// Arrange
	const vbox = new VBox();

	// Act
	vbox.addPixel({r: 0, g: 0, b: 255});
	vbox.addPixel({r: 0, g: 0, b: 128});

	// Assert
	const rLength = vbox.getRedLength();
	const gLength = vbox.getGreenLength();
	const bLength = vbox.getBlueLength();
	const longest = vbox.identifyLongestSide();

	t.is(rLength, 0, 'check the red length of the VBox');
	t.is(gLength, 0, 'check the green length of the VBox');
	t.is(bLength, 127, 'check the blue length of the VBox');
	t.is(longest, 'b', 'check that the longest side is identified.');
});

test('splitting the VBox along the red axis', t => {
	// Arrange
	const vbox = new VBox();

	vbox.addPixel({r: 255, g: 0, b: 0});
	vbox.addPixel({r: 1, g: 0, b: 0});

	// Act
	const vboxes = vbox.split();

	// Assert
	t.is(vboxes.length, 2, 'check that there are the correct number of VBoxes.');

	const abovePixels = vboxes[0].getPixels();
	t.is(abovePixels.length, 1, 'check that a pixel was added');
	t.is(abovePixels[0].r, 255, 'check that the correct pixel was added.');

	const belowPixels = vboxes[1].getPixels();
	t.is(belowPixels.length, 1, 'check that a pixel was added');
	t.is(belowPixels[0].r, 1, 'check that the correct pixel was added.');
});

test('getting the representative color for a VBox.', t => {
	// Arrange
	const vbox = new VBox();

	vbox.addPixel({r: 255, g: 0, b: 0});
	vbox.addPixel({r: 129, g: 0, b: 0});
	vbox.addPixel({r: 1, g: 0, b: 0});

	// Act
	const color = vbox.getRepresentitveColor();

	// Assert
	t.is(color.population, 3, 'check the red component');
	t.is(color.color.r, 129, 'check the red component');
	t.is(color.color.g, 0, 'check the green component');
	t.is(color.color.b, 0, 'check the blue component');
});

test('quantizing a red gradient.', t => {
	// Arrange
	const SIZE = 256;
	const BYTES_PER_PIXEL = 4;
	const pixels = new Array(SIZE * BYTES_PER_PIXEL);

	for (let i = 0; i < pixels.length; i += BYTES_PER_PIXEL) {
		pixels[i] = i / BYTES_PER_PIXEL;
		pixels[i + 1] = 0;
		pixels[i + 2] = 0;
		pixels[i + 3] = 255;
	}

	// Act
	const colors = quantize(pixels, SIZE, 1);

	// Assert
	t.is(colors.length, 16, 'check the number of colors returned.');
	t.is(colors[0].population, 16, 'check the number of pixels for each color.');
	t.is(colors[0].color.r, 240, 'check the red value of the color');
});
