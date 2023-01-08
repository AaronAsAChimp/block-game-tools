import Vibrant from 'node-vibrant';
import { printQuantizedImage, quantize } from './quantizer.js';
import chalk from 'chalk';

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

function toHSL(r, g, b) {
	r = r / 255;
	g = g / 255;
	b = b / 255;

	const xMax = Math.max(r, g, b);
	const xMin = Math.min(r, g, b);

	const chroma = xMax - xMin;

	const l = (xMax + xMin) / 2;

	let h = 0;

	if (chroma === 0) {
		h = 0;
	} else if (r === xMax) {
		h = 60 * ((g - b) / chroma);
	} else if (g === xMax) {
		h = 60 * (2 + ((b - r) / chroma));
	} else if (b === xMax) {
		h = 60 * (4 + ((r - g) / chroma));
	}

	let s = 0;

	if (l === 0 || l === 1) {
		s = 0;
	} else {
		s = chroma / (1 - Math.abs(2 * xMax - chroma - 1));
	}

	return { h, s, l };
}

export class SaturatedColorExtractor extends ColorExtractor {
	async extract(filename, file) {
		const pixels = [];

		for (let i = 0; i < file.data.length; i += 4) {
			const r = file.data[i];
			const g = file.data[i + 1];
			const b = file.data[i + 2];
			const a = file.data[i + 3];
			const hsl = toHSL(r, g, b);

			if (a !== 0) {
				pixels.push({
					hsl,
					rgb: { r, g, b },
					distance: Math.abs(hsl.l - 0.5)
				});
			}
		}

		// This isn't really sorting by most saturated, but by the amount of
		// effect that lightness has.
		const mostCommon = pixels
			.sort((a, b) => {
				return a.distance - b.distance;
			});

		if (filename.includes('tall_seagrass')) {
			// printQuantizedImage(file.data, file.width, file.height);
			console.log(filename);
			console.log(mostCommon
				.map(c => {
					return `${toPixel(c.rgb)} - ${toHex(c.rgb)} - ${c.distance}`;
				})
				.join('\n'));
		}

		return {
			mostSaturated: mostCommon[0].rgb
		};
	}
}

function toSat(color) {
	const hsl = toHSL(color.r, color.g, color.b);

	return hsl.s;
}

function toHex(color) {
	const {r, g, b} = color;

	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
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
