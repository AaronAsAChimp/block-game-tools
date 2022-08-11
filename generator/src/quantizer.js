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
		 * The totals for each component
		 * @type {Color}
		 */
		this._sum = {
			r: 0,
			g: 0,
			b: 0
		};

		/**
		 * The pixels in this VBox
		 * @type {Color[]}
		 */
		this._pixels = [];
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

		this._sum.r += r;
		this._sum.g += g;
		this._sum.b += b;

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

		if (colors.length >= 5) {
			const above = new VBox();
			const below = new VBox();

			const longestSide = this.identifyLongestSide();
			const median = this._sum[longestSide] / colors.length; // Technically this is a MEAN cut.

			for (const pixel of colors) {
				if (pixel[longestSide] < median) {
					below.addPixel(pixel);
				} else {
					above.addPixel(pixel);
				}
			}

			return [
				above,
				below
			];
		} else {
			return null;
		}
	}

	/**
	 * Get a color that represents this VBox.
	 * 
	 * @return {QuantizedColor} The color.
	 */
	getRepresentitveColor() {
		const r = (this._max.r - this._min.r) / 2;
		const g = (this._max.g - this._min.g) / 2;
		const b = (this._max.b - this._min.b) / 2;

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


const NUMBER_OF_SPLITS = 3;


/**
 * Reduce the list of colors to a small set.
 * 
 * @param  {Buffer | number[]} pixels The pixels
 * @param  {number} width    The width of the image.
 * @param  {number} height   The height of the image.
 * @return {QuantizedColor[]}   The colors.
 */
export function quantize(pixels, width, height) {
	const initialVBox = new VBox();

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = (width * y + x) << 2;

			initialVBox.addPixel({
				r: pixels[idx],
				g: pixels[idx + 1],
				b: pixels[idx + 2],
				a: pixels[idx + 3]
			})
		}
	}

	let splitVBoxes = [initialVBox];

	for (let i = 0; i < NUMBER_OF_SPLITS; i++) {
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

	return splitVBoxes
		.map(vbox => vbox.getRepresentitveColor())
		.sort((a, b) => {
			return b.population - a.population;
		});
}
