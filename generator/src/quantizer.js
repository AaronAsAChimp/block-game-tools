import chalk from 'chalk';

/**
 * @typedef {Object} Color
 * @property {number} r The red component.
 * @property {number} g The green component.
 * @property {number} b The blue component.
 * @property {number} [a] The alpha component.
 */

/**
 * @typedef {[number, number, number, number]} FlatColor
 */

/**
 * @typedef {Object} QuantizedColor
 * @property {Color} color    The color in this sample
 * @property {number} population  The number of pixels that had this color
 */

export class VBox {
	constructor() {
		/**
		 * The minimum point of the VBox
		 * @type {Color}
		 */
		this._min = {
			r: Infinity,
			g: Infinity,
			b: Infinity,
		};

		/**
		 * The maximum point of the VBox
		 * @type {Color}
		 */
		this._max = {
			r: -Infinity,
			g: -Infinity,
			b: -Infinity,
		};

		/**
		 * The pixels in this VBox
		 * @type {Color[]}
		 */
		this._pixels = [];
	}

	/**
	 * Find the median of the given values. This method only works for values
	 * from 0 to 255.
	 *
	 * @param  {number[]} values The values to find the median of.
	 * @return {number}          The median value.
	 */
	#findMedian(values) {
		// This is a disgustingly slow implementation of an algorithm to find
		// the median.
		values = values.sort((a, b) => a - b);

		return values[Math.floor(values.length / 2)];
	}

	/**
	 * Add a pixel to this VBox.
	 *
	 * @param {Color} pixel The pixel to add.
	 */
	addPixel(pixel) {
		const {r, g, b, a} = pixel;

		if (a === 0) {
			return;
		}

		if (this._min.r > r) {
			this._min.r = r;
		}

		if (this._min.g > g) {
			this._min.g = g;
		}

		if (this._min.b > b) {
			this._min.b = b;
		}

		if (this._max.r < r) {
			this._max.r = r;
		}

		if (this._max.g < g) {
			this._max.g = g;
		}

		if (this._max.b < b) {
			this._max.b = b;
		}

		this._pixels.push(pixel);
	}

	/**
	 * Get the points in this VBox.
	 * 
	 * @return {Color[]} The colors
	 */
	getPixels() {
		return this._pixels;
	}

	isNotEmpty() {
		return !!this._pixels.length;
	}

	getRedLength() {
		return this._max.r - this._min.r;
	}

	getGreenLength() {
		return this._max.g - this._min.g;
	}

	getBlueLength() {
		return this._max.b - this._min.b;
	}

	/**
	 * Return the name of the component that has the longest side of this VBox.
	 *
	 * @return {'r' | 'g' | 'b'}  The name of the component.
	 */
	identifyLongestSide() {
		const rLength = this.getRedLength()
		const gLength = this.getGreenLength();
		const bLength = this.getBlueLength();

		if (rLength > gLength) {
			if (rLength > bLength) {
				return 'r';
			} else {
				return 'b';
			}
		} else {
			if (gLength > bLength) {
				return 'g';
			} else {
				return 'b';
			}
		}
	}

	/**
	 * Split the VBox by moving any pixels that are below the median into a new
	 * VBox. If there aren't enough pixels to split the VBox returns
	 * null instead.
	 *
	 * @return {[VBox, VBox]} The below median pixels or null if there aren't any.
	 */
	split() {
		const colors = this._pixels;

		/**
		 * @type {[VBox, VBox]}
		 */
		let splitBoxes = null;

		if (colors.length >= 5) {
			const above = new VBox();
			const below = new VBox();

			const longestSide = this.identifyLongestSide();

			// TODO: implement an optimized algorithm that combines splitting
			// the vbox with with finding the median algorithm.
			// 
			// Most algorithms to find the median end up partially sorting the
			// list this could probably be leveraged to optimize this
			// whole method.
			const median = this.#findMedian(colors.map(p => p[longestSide]));

			for (const pixel of colors) {
				// This can sometimes provide undesirable results in the case of 
				// something like:
				// 
				// [22,22,22,22,25,25]
				// 
				// The median is 22, but none of the other pixels are below it
				// meaning it never gets split.
				if (pixel[longestSide] < median) {
					below.addPixel(pixel);
				} else {
					above.addPixel(pixel);
				}
			}

			// console.log('Median: ' + longestSide + median + ', Above length: ' + above.getPixels().length + ', Below Length: ' + below.getPixels().length);

			if (above.isNotEmpty() && below.isNotEmpty()) {
				splitBoxes = [
					above,
					below
				];
			} else {
				// console.log('Values:', colors);
			}
		}

		return splitBoxes;
	}

	/**
	 * Get a color that represents this VBox.
	 * 
	 * @return {QuantizedColor} The color.
	 */
	getRepresentitveColor() {
		let rSum = 0;
		let gSum = 0;
		let bSum = 0;

		for (const pixel of this._pixels) {
			rSum += pixel.r;
			gSum += pixel.g;
			bSum += pixel.b;
		}

		// After finding the average pixel color for the vbox, do a
		// nearest neighbor search to find an actual pixel to reprisent
		// this vbox.

		const r = rSum / this._pixels.length;
		const g = gSum / this._pixels.length;
		const b = bSum / this._pixels.length;

		let bestSoFar = Infinity;
		let bestColor = null;

		// Do a nearest neighbor search for the color that is the closest point.
		for (const color of this._pixels) {
			const distSquared = Math.abs(Math.pow(r - color.r, 2) + Math.pow(g - color.g, 2) + Math.pow(b - color.b, 2));

			if (distSquared < bestSoFar) {
				bestSoFar = distSquared;
				bestColor = color;
			}
		}

		return {
			color: bestColor,
			population: this._pixels.length
		};
	}
}


const NUMBER_OF_SPLITS = 4;

/**
 * Split the pixes into VBoxes
 * 
 * @param  {Buffer | number[]} pixels The pixels
 * @param  {number} width    The width of the image.
 * @param  {number} height   The height of the image.
 * @return {VBox[]}   The colors.
 */
function splitVBoxes(pixels, width, height, splits = NUMBER_OF_SPLITS) {
	const initialVBox = new VBox();

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = (width * y + x) << 2;

			initialVBox.addPixel({
				pos: {x, y},
				r: pixels[idx],
				g: pixels[idx + 1],
				b: pixels[idx + 2],
				a: pixels[idx + 3]
			})
		}
	}

	let splitVBoxes = [initialVBox];

	for (let i = 0; i < splits; i++) {
		splitVBoxes = splitVBoxes.flatMap(vbox => {
			const splits = vbox.split();

			// If splits is null it couldn't bee split further.
			if (splits !== null) {
				return splits;
			} else {
				return vbox;
			}
		})
	}

	return splitVBoxes;
}


/**
 * Reduce the list of colors to a small set.
 * 
 * @param  {Buffer | number[]} pixels The pixels
 * @param  {number} width    The width of the image.
 * @param  {number} height   The height of the image.
 * @return {QuantizedColor[]}   The colors.
 */
export function quantize(pixels, width, height, splits = NUMBER_OF_SPLITS) {
	return splitVBoxes(pixels, width, height, splits)
		.map(vbox => vbox.getRepresentitveColor());
}

export function printQuantizedImage(pixels, width, height, splits = NUMBER_OF_SPLITS) {
	const vboxes = splitVBoxes(pixels, width, height, splits);
	const reconstructed = [];

	for (const vbox of vboxes) {
		const color = vbox.getRepresentitveColor();
		const pixels = vbox.getPixels();

		for (const pixel of pixels) {
			const {x, y} = pixel.pos;
			let row = reconstructed[y];

			if (!row) {
				row = [];
				reconstructed[y] = row;
			}

			row[x] = chalk.rgb(color.color.r, color.color.g, color.color.b)('\u2588\u2588')
		}

		// console.table(pixels);
		// console.log('Average: ' + chalk.rgb(color.color.r, color.color.g, color.color.b)('\u2588') + `(${color.color.r}, ${color.color.g}, ${color.color.b})`)
	}

	for (const row of reconstructed) {
		if (row) {
			for (let x = 0; x < row.length; x++) {
				if (!row[x]) {
					row[x] = '  ';
				}
			}

			console.log(row.join(''));
		} else {
			console.log('\n');
		}
	}}
