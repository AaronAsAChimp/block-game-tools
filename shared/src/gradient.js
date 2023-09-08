import {Color, GAMMA, RGBColor, LinearRGBColor} from './color.js';

/**
 * @typedef {Object} GradientStop
 * @property {number} offset
 * @property {Color} color
 * @property {LinearRGBColor} linearColor
 */

function clamp(val) {
	if (val > 1) {
		return 1;
	} else if (val < 0) {
		return 0;
	} else {
		return val;
	}
}

function lerp(val1, val2, frac) {
	return val1 * (1 - frac) + val2 * frac;
}

/**
 * https://stackoverflow.com/questions/22607043/color-gradient-algorithm
 */
export class Gradient {
	/** @type {GradientStop[]} */
	#stops;

	constructor() {
		this.#stops = [];
	}

	clear() {
		this.#stops.length = 0;
	}

	getStops() {
		return this.#stops;
	}

	/**
	 * Find the stop that is immediately lower than the given offset. If the
	 * offset is outside of the range of this gradient it returns the first or
	 * last stop respectively.
	 *
	 * @param  {number} offset The offset in the gradient 0..1
	 * @return {number}        The index of the stop.
	 */
	findStop(offset) {
		if (this.#stops.length === 0) {
			// If there are no stops then this operation is undefined.
			return -1;
		}

		let start = 0;
		let end = this.#stops.length - 1;

		if (offset < this.#stops[start].offset) {
			return start;
		} else if( offset > this.#stops[end].offset) {
			return end;
		}

		while ((end - start) > 1) {
			const idx = (start + end) >> 1;
			const currentOffset = this.#stops[idx].offset;

			if (offset < currentOffset) {
				end = idx;
			} else if (offset > currentOffset) {
				start = idx;
			} else {
				break;
			}
		}

		return start;
	}

	/**
	 * Add a color stop to the gradient.
	 * @param {number} offset The offset between 0 and 1 where 0 is left most and 1 is right most.
	 * @param {Color} color  The color at this point in the gradient.
	 */
	addStop(offset, color) {
		const stopsLength = this.#stops.length;
		const linearColor = color.toLinearRGBColor();

		offset = clamp(offset);

		if (!stopsLength || offset >= this.#stops[stopsLength - 1].offset) {
			this.#stops.push({
				offset,
				color,
				linearColor
			});
		} else if (offset <= this.#stops[0].offset) {
			this.#stops.unshift({
				offset,
				color,
				linearColor
			})
		} else {
			const idx = this.findStop(offset);

			this.#stops.splice(idx + 1, 0, {
				offset,
				color,
				linearColor
			})
		}
	}

	removeStop(idx) {
		this.#stops.splice(idx, 1);
	}

	setStopColor(idx, color) {
		this.#stops[idx].color = color.toLinearRGBColor();
	}

	setStopOffset(oldIdx, offset) {
		offset = clamp(offset);

		const stop = this.#stops[oldIdx];

		stop.offset = offset;
		// this.#stops.splice(oldIdx, 1);

		// const newIdx = this.findStop(offset);

		// this.#stops.splice(newIdx, 0, stop);
	}

	/**
	 * Interpolate the gradient to a number of fixed spaced steps.
	 * @param  {number} steps The number of steps.
	 * @return {Color[]}      The steps in the gradient.
	 */
	getSteps(steps) {
		// Handle degerative cases
		if (steps < 1) {
			return [];
		} else if (steps === 1) {
			return [
				this.interpolate(0.5)
			];
		}

		const percent = 1 / (steps - 1);
		const gradientSteps = new Array(steps);

		for (let i = 0; i < steps; i++) {
			gradientSteps[i] = this.interpolate(percent * i);
		}

		return gradientSteps;
	}

	/**
	 * Find the color at a given point in the gradient.
	 * @param  {number} offset The point in which to sample the gradient.
	 * @return {Color}         The color at the point
	 */
	interpolate(offset) {
		const stops = this.#stops;

		if (stops.length === 0) {
			// If there are no stops then this operation is undefined.
			throw new Error('Can not interpolate, need at least one stop.');
		} else if (stops.length === 1){
			// If there is only one stop the gradient is a solid color.
			return stops[0].linearColor.toRGBColor();
		}

		if (offset < stops[0].offset) {
			return stops[0].color.toRGBColor();
		} else if (offset > stops[stops.length - 1].offset){
			return stops[stops.length - 1].color.toRGBColor();
		}

		const startIdx = this.findStop(offset);
		const endIdx = startIdx + 1;
		const color = new LinearRGBColor(0, 0, 0);

		const startOffset = stops[startIdx].offset;
		const endOffset = stops[endIdx].offset;
		const deltaOffset = endOffset - startOffset;

		const startLinear = stops[startIdx].linearColor;
		const endLinear = stops[endIdx].linearColor;

		const startBrightness = startLinear.perceptualBrightness();
		const endBrightness = endLinear.perceptualBrightness();

		const percent = deltaOffset !== 0 ? (offset - startOffset) / deltaOffset : 0;
		const intensity = Math.pow(lerp(startBrightness, endBrightness, percent), GAMMA);

		color.r = lerp(startLinear.r, endLinear.r, percent);
		color.g = lerp(startLinear.g, endLinear.g, percent);
		color.b = lerp(startLinear.b, endLinear.b, percent);
		const total = color.r + color.g + color.b;

		if (total !== 0) {
			color.r = color.r * intensity / total;
			color.g = color.g * intensity / total;
			color.b = color.b * intensity / total;
		}

		return color.toRGBColor();
	}

	toCSS() {
		if (this.#stops.length === 0) {
			return '';
		} else if (this.#stops.length === 1) {
			return this.#stops[0].color.toCSS();
		}

		let css = 'linear-gradient(to right, '

		for (let i = 0; i < this.#stops.length; i++) {
			const stop = this.#stops[i];

			css += (i > 0 ? ', ' : '')
				+ stop.color.toCSS()  + ' '
				+ (stop.offset * 100) + '%';
		}

		return css + ')';
	}
}