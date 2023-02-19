import { printQuantizedImage, quantize } from './quantizer.js';
import chalk from 'chalk';

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


export class SaturatedColorExtractor extends ColorExtractor {
	async extract(filename, file) {
		const pixels = [];

		for (let i = 0; i < file.data.length; i += 4) {
			const r = file.data[i];
			const g = file.data[i + 1];
			const b = file.data[i + 2];
			const a = file.data[i + 3];

			const rgb = new RGBColor(r, g, b);
			const hsl = rgb.toHSLColor();

			if (a !== 0) {
				pixels.push({
					hsl,
					rgb,
					distance: Math.pow(Math.abs(hsl.l - 0.5), 2) + Math.pow(hsl.s, 2)
				});
			}
		}

		const mostCommon = pixels
			.sort((a, b) => {
				return b.distance - a.distance;
			});

		// if (filename.includes('tall_seagrass')) {
		// 	console.log(filename);
		// 	console.log(mostCommon
		// 		.map(c => {
		// 			return `${toPixel(c.rgb)} - ${c.rgb.toCSS()} - ${c.distance}`;
		// 		})
		// 		.join('\n'));
		// }

		return {
			mostSaturated: mostCommon[0].rgb
		};
	}
}


function toPixel(color) {
	const {r, g, b} = color;

	return chalk.rgb(r, g, b)('\u2588\u2588')
}

export class QuantizerColorExtractor extends ColorExtractor {
	async extract(filename, file) {
		const mostCommon = quantize(file.data, file.width, file.height)
			.sort((a, b) => {
				return b.population - a.population;
			});

		// if (filename.includes('bookshelf')) {
		// if (filename.includes('rail')) {
		// 	printQuantizedImage(file.data, file.width, file.height);
		// 	console.log(mostCommon.map(c => {
		// 		return `${toPixel(c.color)} - ${toHex(c.color)} - ${c.population}`
		// 	}).join('\n'));
		// }

		return {
			mostCommon: mostCommon[0].color
		};
	}
}
