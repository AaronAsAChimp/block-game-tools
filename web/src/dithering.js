import { RGBColor } from "shared/src/color";

export function coordToIndex(width, x, y) {
	return y * (width * 4) + x * 4;
}


/**
 * @callback DitheringAlgo
 * @param {ImageData} pixels
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {number} g
 * @param {number} b
 */

const FLOYD_STEINBERG_7 = 7 / 16;
const FLOYD_STEINBERG_5 = 5 / 16;
const FLOYD_STEINBERG_3 = 3 / 16;
const FLOYD_STEINBERG_1 = 1 / 16;

const STUCKI_8 = 8 / 42;
const STUCKI_4 = 4 / 42;
const STUCKI_2 = 2 / 42;
const STUCKI_1 = 1 / 42;

const ATKINSON_1 = 1 / 8;

const STEVENSON_ARCE_32 = 32 / 200;
const STEVENSON_ARCE_30 = 30 / 200;
const STEVENSON_ARCE_26 = 26 / 200;
const STEVENSON_ARCE_16 = 16 / 200;
const STEVENSON_ARCE_12 = 12 / 200;
const STEVENSON_ARCE_5 = 5 / 200;
/**
 * @type {Record<string, DitheringAlgo | null>}
 */
const DITHERING_ALGOS = {
	none: null,
	floydSteinberg(pixels, x, y, r, g, b,) {
		const width = pixels.width;
		const nextRed = coordToIndex(width, x + 1, y);

		pixels.data[nextRed] += r * FLOYD_STEINBERG_7;
		pixels.data[nextRed + 1] += g * FLOYD_STEINBERG_7;
		pixels.data[nextRed + 2] += b * FLOYD_STEINBERG_7;

		const belowPrevRed = coordToIndex(width, x - 1, y + 1);

		pixels.data[belowPrevRed] += r * FLOYD_STEINBERG_3;
		pixels.data[belowPrevRed + 1] += g * FLOYD_STEINBERG_3;
		pixels.data[belowPrevRed + 2] += b * FLOYD_STEINBERG_3;

		const belowRed = coordToIndex(width, x, y + 1);

		pixels.data[belowRed] += r * FLOYD_STEINBERG_5;
		pixels.data[belowRed + 1] += g * FLOYD_STEINBERG_5;
		pixels.data[belowRed + 2] += b * FLOYD_STEINBERG_5;

		const belowNextRed = coordToIndex(width, x + 1, y + 1);

		pixels.data[belowNextRed] += r * FLOYD_STEINBERG_1;
		pixels.data[belowNextRed + 1] += g * FLOYD_STEINBERG_1;
		pixels.data[belowNextRed + 2] += b * FLOYD_STEINBERG_1;
	},
	// 'stucki': {
	// 	'divisor': 42,
	// 	'weights': [
	// 		[0, 0, 0, 8, 4],
	// 		[2, 4, 8, 4, 2],
	// 		[1, 2, 4, 2, 1]
	// 	]
	// },
	stucki(pixels, x, y, r, g, b) {
		const width = pixels.width;
		let pixel = coordToIndex(width, x + 1, y);

		pixels.data[pixel] += r * STUCKI_8;
		pixels.data[pixel + 1] += g * STUCKI_8;
		pixels.data[pixel + 2] += b * STUCKI_8;

		pixel = coordToIndex(width, x + 2, y);

		pixels.data[pixel] += r * STUCKI_4;
		pixels.data[pixel + 1] += g * STUCKI_4;
		pixels.data[pixel + 2] += b * STUCKI_4;

		pixel = coordToIndex(width, x - 2, y + 1);

		pixels.data[pixel] += r * STUCKI_2;
		pixels.data[pixel + 1] += g * STUCKI_2;
		pixels.data[pixel + 2] += b * STUCKI_2;

		pixel = coordToIndex(width, x - 1, y + 1);

		pixels.data[pixel] += r * STUCKI_4;
		pixels.data[pixel + 1] += g * STUCKI_4;
		pixels.data[pixel + 2] += b * STUCKI_4;

		pixel = coordToIndex(width, x, y + 1);

		pixels.data[pixel] += r * STUCKI_8;
		pixels.data[pixel + 1] += g * STUCKI_8;
		pixels.data[pixel + 2] += b * STUCKI_8;

		pixel = coordToIndex(width, x + 1, y + 1);

		pixels.data[pixel] += r * STUCKI_4;
		pixels.data[pixel + 1] += g * STUCKI_4;
		pixels.data[pixel + 2] += b * STUCKI_4;

		pixel = coordToIndex(width, x + 2, y + 1);

		pixels.data[pixel] += r * STUCKI_2;
		pixels.data[pixel + 1] += g * STUCKI_2;
		pixels.data[pixel + 2] += b * STUCKI_2;

		pixel = coordToIndex(width, x - 2, y + 2);

		pixels.data[pixel] += r * STUCKI_1;
		pixels.data[pixel + 1] += g * STUCKI_1;
		pixels.data[pixel + 2] += b * STUCKI_1;

		pixel = coordToIndex(width, x - 1, y + 2);

		pixels.data[pixel] += r * STUCKI_2;
		pixels.data[pixel + 1] += g * STUCKI_2;
		pixels.data[pixel + 2] += b * STUCKI_2;

		pixel = coordToIndex(width, x, y + 2);

		pixels.data[pixel] += r * STUCKI_4;
		pixels.data[pixel + 1] += g * STUCKI_4;
		pixels.data[pixel + 2] += b * STUCKI_4;

		pixel = coordToIndex(width, x + 1, y + 2);

		pixels.data[pixel] += r * STUCKI_2;
		pixels.data[pixel + 1] += g * STUCKI_2;
		pixels.data[pixel + 2] += b * STUCKI_2;

		pixel = coordToIndex(width, x + 2, y + 2);

		pixels.data[pixel] += r * STUCKI_1;
		pixels.data[pixel + 1] += g * STUCKI_1;
		pixels.data[pixel + 2] += b * STUCKI_1;
	},
	// 'atkinson': {
	// 	'divisor': 8,
	// 	'weights': [
	// 		[0, 0, 0, 1, 1],
	// 		[0, 1, 1, 1, 0],
	// 		[0, 0, 1, 0, 0]
	// 	]
	// }
	atkinson(pixels, x, y, r, g, b) {
		const width = pixels.width;
		let pixel = coordToIndex(width, x + 1, y);

		pixels.data[pixel] += r * ATKINSON_1;
		pixels.data[pixel + 1] += g * ATKINSON_1;
		pixels.data[pixel + 2] += b * ATKINSON_1;

		pixel = coordToIndex(width, x + 2, y);

		pixels.data[pixel] += r * ATKINSON_1;
		pixels.data[pixel + 1] += g * ATKINSON_1;
		pixels.data[pixel + 2] += b * ATKINSON_1;

		pixel = coordToIndex(width, x - 1, y + 1);

		pixels.data[pixel] += r * ATKINSON_1;
		pixels.data[pixel + 1] += g * ATKINSON_1;
		pixels.data[pixel + 2] += b * ATKINSON_1;

		pixel = coordToIndex(width, x, y + 1);

		pixels.data[pixel] += r * ATKINSON_1;
		pixels.data[pixel + 1] += g * ATKINSON_1;
		pixels.data[pixel + 2] += b * ATKINSON_1;

		pixel = coordToIndex(width, x + 1, y + 1);

		pixels.data[pixel] += r * ATKINSON_1;
		pixels.data[pixel + 1] += g * ATKINSON_1;
		pixels.data[pixel + 2] += b * ATKINSON_1;

		pixel = coordToIndex(width, x, y + 2);

		pixels.data[pixel] += r * ATKINSON_1;
		pixels.data[pixel + 1] += g * ATKINSON_1;
		pixels.data[pixel + 2] += b * ATKINSON_1;
	},
	// 'stevensonArce': {
	// 	'divisor': 200,
	// 	'weights': [
	// 		[ 0,  0,  0,  0,  0, 32,  0],
	// 		[12,  0, 26,  0, 30,  0, 16],
	// 		[ 0, 12,  0, 26,  0, 12,  0],
	// 		[ 5,  0, 12,  0, 12,  0,  5]
	// 	]
	// }
	stevensonArce(pixels, x, y, r, g, b) {
		const width = pixels.width;
		let pixel = coordToIndex(width, x + 2, y);

		pixels.data[pixel] += r * STEVENSON_ARCE_32;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_32;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_32;

		pixel = coordToIndex(width, x - 3, y + 1);

		pixels.data[pixel] += r * STEVENSON_ARCE_12;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_12;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_12;

		pixel = coordToIndex(width, x - 1, y + 1);

		pixels.data[pixel] += r * STEVENSON_ARCE_26;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_26;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_26;

		pixel = coordToIndex(width, x + 1, y + 1);

		pixels.data[pixel] += r * STEVENSON_ARCE_30;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_30;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_30;

		pixel = coordToIndex(width, x + 3, y + 1);

		pixels.data[pixel] += r * STEVENSON_ARCE_16;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_16;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_16;

		pixel = coordToIndex(width, x - 2, y + 2);

		pixels.data[pixel] += r * STEVENSON_ARCE_12;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_12;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_12;

		pixel = coordToIndex(width, x, y + 2);

		pixels.data[pixel] += r * STEVENSON_ARCE_26;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_26;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_26;

		pixel = coordToIndex(width, x - 2, y + 2);

		pixels.data[pixel] += r * STEVENSON_ARCE_12;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_12;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_12;

		pixel = coordToIndex(width, x - 3, y + 3);

		pixels.data[pixel] += r * STEVENSON_ARCE_5;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_5;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_5;

		pixel = coordToIndex(width, x - 1, y + 3);

		pixels.data[pixel] += r * STEVENSON_ARCE_12;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_12;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_12;

		pixel = coordToIndex(width, x + 1, y + 3);

		pixels.data[pixel] += r * STEVENSON_ARCE_12;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_12;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_12;

		pixel = coordToIndex(width, x + 3, y + 3);

		pixels.data[pixel] += r * STEVENSON_ARCE_5;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_5;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_5;
	}
};

/**
 * Dither the given image.
 * @param  {keyof typeof DITHERING_ALGOS} algo  The name of the dithering algorithm.
 * @param  {ImageData} pixels The pixels to dither.
 * @param  {string} palette The name of the palette.
 * @param  {import('./blocks').BlockLookup} blockLookup The lookup to find the block color.
 */
export function dither(algo, pixels, palette, blockLookup) {
	const height = pixels.height;
	const width = pixels.width;
	const ditheringMethod = DITHERING_ALGOS[algo];
	const color = new RGBColor(0, 0, 0);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const red = coordToIndex(width, x, y);

			color.r = pixels.data[red];
			color.g = pixels.data[red + 1];
			color.b = pixels.data[red + 2]

			const block = blockLookup.find(color, palette).block;
			const matchedColor = block.palette[palette].rgb;

			const rDelta = color.r - matchedColor.r;
			const gDelta = color.g - matchedColor.g;
			const bDelta = color.b - matchedColor.b;

			if (ditheringMethod) {
				ditheringMethod(pixels, x, y, rDelta, gDelta, bDelta);
			}

			pixels.data[red] = matchedColor.r;
			pixels.data[red + 1] = matchedColor.g;
			pixels.data[red + 2] = matchedColor.b;
		}
	}
}


function bayerNormalize(mat, size) {
	const newMat = [];
	for (let y = 0; y < size; y++) {
		newMat[y] = [];

		for (let x = 0; x < size; x++) {
			newMat[y][x] = (mat[y][x] / (size * size)) - 0.5;
		}
	}

	return newMat;
}

const BAYER_MATRIX_2X2_SIZE = 2;
const BAYER_MATRIX_2X2 = bayerNormalize([
	[0, 2],
	[3, 1]
], BAYER_MATRIX_2X2_SIZE);


const BAYER_MATRIX_4X4_SIZE = 4;
const BAYER_MATRIX_4X4 = bayerNormalize([
	[0, 8, 2, 19],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5]
], BAYER_MATRIX_4X4_SIZE);


const BAYER_MATRIX_8X8_SIZE = 8;
const BAYER_MATRIX_8X8 = bayerNormalize([
	[ 0, 32,  8, 40,  2, 34, 10, 42],
	[48, 16, 56, 24, 50, 18, 58, 26],
	[12, 44,  4, 36, 14, 46,  6, 38],
	[60, 28, 52, 20, 62, 30, 54, 22],
	[ 3, 35, 11, 43,  1, 33,  9, 41],
	[51, 19, 59, 27, 49, 17, 57, 25],
	[15, 47,  7, 39, 13, 45,  5, 37],
	[63, 31, 55, 23, 61, 29, 53, 21],
], BAYER_MATRIX_8X8_SIZE);

/**
 * Dither the given image using the ordered dithering algorithm.
 * @param  {number} size The size of the matrix.
 * @param  {ImageData} pixels The pixels to dither.
 * @param  {string} palette The name of the palette.
 * @param  {import('./blocks').BlockLookup} blockLookup The lookup to find the block color.
 */
export function ordered(size, pixels, palette, blockLookup) {
	const height = pixels.height;
	const width = pixels.width;
	const color = new RGBColor(0, 0, 0);

	const thresholds = [0, 0, 0];

	const values = [new Set(), new Set(), new Set()];
	const paletteColors = blockLookup.getPaletteColors(palette);
	let mat = null;

	if (size === 2) {
		mat = BAYER_MATRIX_2X2;
	} else if (size === 4) {
		mat = BAYER_MATRIX_4X4;
	} else if (size === 8) {
		mat = BAYER_MATRIX_8X8;
	} else {
		throw new Error('Unsupported bayer size');
	}

	for (let idx = 0; idx < paletteColors.length; idx++) {
		values[0].add(paletteColors[idx].rgb.r);
		values[1].add(paletteColors[idx].rgb.g);
		values[2].add(paletteColors[idx].rgb.b);
	}

	for (const component of values) {
		const sorted = [...component].sort((a, b) => b - a);

		for (let idx = 1; idx < sorted.length; idx++) {
			thresholds[idx % 3] = Math.max(thresholds[idx % 3], sorted[idx - 1] - sorted[idx]);
		}
	}

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const red = coordToIndex(width, x, y);
			let factor = mat[y % size][x % size];

			color.r = pixels.data[red] + (thresholds[0] * factor);
			color.g = pixels.data[red + 1] + (thresholds[1] * factor);
			color.b = pixels.data[red + 2] + (thresholds[2] * factor);

			const block = blockLookup.find(color, palette).block;
			const matchedColor = block.palette[palette].rgb;

			pixels.data[red] = matchedColor.r;
			pixels.data[red + 1] = matchedColor.g;
			pixels.data[red + 2] = matchedColor.b;
		}
	}
}
