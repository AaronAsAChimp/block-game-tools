import fs from 'fs';
import {PNG} from 'pngjs';
import Vibrant from 'node-vibrant';
import { quantize } from './quantizer.js';

/**
 * @typedef {Object} Color
 *
 * @property {number} r The Red component
 * @property {number} g The Green component
 * @property {number} b The Blue component
 * @property {number} [a] The Alpha component
 */

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
	async extract(filename) {}
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
			return {
				r: Math.sqrt(r / num), 
				g: Math.sqrt(g / num), 
				b: Math.sqrt(b / num),
				a: Math.sqrt(a / num)
			};
		} else {
			return {
				r: 0,
				g: 0,
				b: 0,
				a: 0
			};
		}
	}

	async extract(filename, file) {
		return {
			average: this.#computeAverage(file.data, file.width, file.height)
		};
	}
}

const RANKED_VIBRANT = [
	'Vibrant',
	'Muted',
	'DarkVibrant',
	'DarkMuted',
	'LightVibrant',
	'LightMuted',
];

export class VibrantJsColorExtractor extends ColorExtractor {
	async extract(filename, _file) {
		const vibrant = new Vibrant(filename, {
			quality: 1
		})
		const palette = await vibrant.getPalette();

		// console.log(filename);

		let average = null;

		for (const ranked of RANKED_VIBRANT) {
			if (palette[ranked]) {
				average = palette[ranked];
				break;
			} else {
				// console.log('Missing ' + ranked);
			}
		}

		return {
			vibrant: average ? {
				r: average.r,
				g: average.g,
				b: average.b,
				a: 1
			} : null
		};
	}
}

export class SaturatedColorExtractor extends ColorExtractor {
	async extract(filename, file) {
		const mostCommon = quantize(file.data, file.width, file.height);

		return {
			saturated: mostCommon[0].color
		};
	}
}


export class QuantizerColorExtractor extends ColorExtractor {
	async extract(filename, file) {
		const mostCommon = quantize(file.data, file.width, file.height);

		return {
			mostCommon: mostCommon[0].color
		};
	}
}
