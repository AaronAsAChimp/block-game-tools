import { printImage, quantize, quantizedImageBuffer } from './quantizer.js';

import {RGBColor, RGBAColor, Color} from 'shared';


/**
 * @typedef {{[name: string]: Color}} Palette
 */


/**
 * @abstract
 */
class ColorExtractor {
	/**
	 * @method extract
	 * @abstract
	 *
	 * @param {string} filename The name of the image file.
	 * @return {Promise<Palette>}  The colors that make up the image.
	 */
	async extract(filename) {
		throw new Error('Not Implemented!');
	}
}

export class BasicColorExtractor extends ColorExtractor {
	/**
	 * @return {Color}  The average color
	 */
	#computeAverage(pixels, height, width) {
		let r = 0;
		let g = 0;
		let b = 0;
		let a = 0;
		let num = 0;

		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				const idx = (width * y + x) << 2;
				const alpha = pixels[idx + 3];

				// Skip transparent pixels.
				if (alpha !== 0) {
					r += pixels[idx] * pixels[idx];
					g += pixels[idx + 1] * pixels[idx + 1];
					b += pixels[idx + 2] * pixels[idx + 2];
					a += alpha * alpha;
					num++;
				}
			}
		}

		if (num !== 0) {
			return new RGBAColor(
				Math.sqrt(r / num), 
				Math.sqrt(g / num), 
				Math.sqrt(b / num),
				Math.sqrt(a / num)
			);
		} else {
			return new RGBAColor(0, 0, 0, 0);
		}
	}

	async extract(filename, file) {
		return {
			average: this.#computeAverage(file.data, file.width, file.height)
		};
	}
}


/**
 * Alpha values below this are treated as invisible. A PNG still stores RGB
 * values for transparent pixels, but those values are meaningless, so letting
 * them vote can hand the palette a color nobody ever sees.
 */
const MIN_ALPHA = 128;

/**
 * How many low bits of each channel to throw away when grouping pixels.
 *
 * Dropping three bits leaves five per channel, which is coarse enough that a
 * couple of stray pixels can't form a group of their own, but fine enough to
 * keep genuinely different colors in different groups.
 */
const BUCKET_SHIFT = 3;

/**
 * Treat every color as at least this colorful.
 *
 * A neutral gray has a chroma of about 0.00001, which is just rounding noise,
 * so a block with no color in it at all would otherwise be decided by which
 * shade of gray happened to sit closest to the gray axis. The floor is well
 * above that noise but well below the ~54 chroma of the dullest color worth
 * calling saturated, so it only matters when an image has no real color.
 */
const MIN_CHROMA = 1;

export class SaturatedColorExtractor extends ColorExtractor {
	/**
	 * Measure how colorful a color is as its distance from the neutral gray
	 * axis in CIE L*a*b*.
	 *
	 * HSL saturation is a poor stand-in here because it stays pinned at 1.0
	 * for very light colors, so #ff8080 looks exactly as saturated as
	 * #ff0000. Chroma doesn't have that problem, and it is 0 for black,
	 * white and every gray on its own, which is why no lightness correction
	 * term is needed here.
	 *
	 * @param {RGBColor} color   The color to measure.
	 * @return {number}          The perceptual chroma of the color.
	 */
	#chroma(color) {
		const lab = color.toLabColor();

		return Math.sqrt(lab.a * lab.a + lab.b * lab.b);
	}

	async extract(filename, file) {
		/**
		 * @type {Map<number, {r: number, g: number, b: number, count: number}>}
		 */
		const groups = new Map();

		for (let i = 0; i < file.data.length; i += 4) {
			if (file.data[i + 3] < MIN_ALPHA) {
				continue;
			}

			const r = file.data[i];
			const g = file.data[i + 1];
			const b = file.data[i + 2];
			const key = ((r >> BUCKET_SHIFT) << 10) | ((g >> BUCKET_SHIFT) << 5) | (b >> BUCKET_SHIFT);

			let group = groups.get(key);

			if (group === undefined) {
				group = {r: 0, g: 0, b: 0, count: 0};
				groups.set(key, group);
			}

			group.r += r;
			group.g += g;
			group.b += b;
			group.count++;
		}

		// Weighting by population stops a lone outlier pixel from winning just
		// for being the most extreme value in the image. The logarithm is
		// there to keep a small but genuinely vivid detail, like the red of a
		// poppy, competitive with the block's main tone.
		//
		// Most Minecraft textures collapse into a handful of groups, so this
		// only converts a few colors to Lab rather than every pixel.
		let mostSaturated = null;
		let bestScore = -Infinity;

		for (const group of groups.values()) {
			const color = new RGBColor(
				Math.round(group.r / group.count),
				Math.round(group.g / group.count),
				Math.round(group.b / group.count)
			);
			const score = (this.#chroma(color) + MIN_CHROMA) * Math.log1p(group.count);

			if (score > bestScore) {
				bestScore = score;
				mostSaturated = color;
			}
		}

		return {
			mostSaturated
		};
	}
}


export class QuantizerColorExtractor extends ColorExtractor {
	async extract(filename, file) {
		const mostCommon = quantize(file.data, file.width, file.height)
			.sort((a, b) => {
				return b.population - a.population;
			});

		// if (filename.includes('bookshelf')) {
		// if (filename.includes('rail')) {
			// const image = quantizedImageBuffer(file.data, file.width, file.height);
			// printImage(image, file.width, file.height);
		// 	console.log(mostCommon.map(c => {
		// 		return `${toPixel(c.color)} - ${toHex(c.color)} - ${c.population}`
		// 	}).join('\n'));
		// }

		return {
			mostCommon: mostCommon.length ? mostCommon[0].color : null
		};
	}
}
