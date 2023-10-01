import { RGBColor } from "shared/src/color";
import { BlockLookup } from "./blocks";

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
 * @param  {BlockLookup} blockLookup The lookup to find the block color.
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
