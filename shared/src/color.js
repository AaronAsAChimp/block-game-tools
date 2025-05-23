// X, Y, Z of a "D65" light source.
// "D65" is a standard 6500K Daylight light source.
// https://en.wikipedia.org/wiki/Illuminant_D65
const D65 = [95.047, 100, 108.883];
export const GAMMA = 2.4;
const GAMMA_INV = 1 / GAMMA;

function lerp(val1, val2, frac) {
	return val1 * (1 - frac) + val2 * frac;
}

/**
 * The RGB transfer function. This converts from linear RGB to
 * gamma-corrected RGB.
 * 
 * @param  {number} c The component to convert.
 * @return {number}   The converted component.
 */
function transfer(c) {
	if (c <= 0.0031308) {
		return c * 12.92;
	} else {
		return (1.055 * Math.pow(c, GAMMA_INV)) - 0.055;
	}
}

/**
 * The inverse RGB transfer function. This converts from gamma-corrected RGB
 * to linear RGB.
 * 
 * @param  {number} c The component to convert.
 * @return {number}   The converted component.
 */
function transferInv(c) {
	if(c <= 0.04045) {
		return c / 12.92;
	} else {
		return Math.pow((c + 0.055)/1.055, GAMMA);
	}
}

export class Color {

	/**
	 * Convert this color to an RGB representation of it.
	 *
	 * @abstract
	 * @return {RGBColor} The color.
	 */
	toRGBColor() {
		throw new Error('Not Implemented');
	}

	/**
	 * Convert this color to a CIE XYZ representation of it.
	 *
	 * @abstract
	 * @return {XYZColor} The color.
	 */
	toXYZColor() {
		throw new Error('Not Implemented');
	}

	/**
	 * Convert this color to Linear RGB.
	 * 
	 * @return {LinearRGBColor} The color.
	 */
	toLinearRGBColor() {
		const rgb = this.toRGBColor();

		var rLinear = transferInv(rgb.r / 255);
		var gLinear = transferInv(rgb.g / 255);
		var bLinear = transferInv(rgb.b / 255);

		return new LinearRGBColor(rLinear, gLinear, bLinear);
	}

	/**
	 * Convert this color to a HSL representation of it.
	 *
	 * @return {HSLColor} The color.
	 */
	toHSLColor() {
		const rgb = this.toRGBColor();

		const r = rgb.r / 255;
		const g = rgb.g / 255;
		const b = rgb.b / 255;

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

		return new HSLColor(h, s, l);
	}

	/**
	 * Convert this color to a Lab representation of it.
	 * Converts CIE 1931 XYZ colors to CIE L*a*b*.
	 * The conversion formula comes from <http://www.easyrgb.com/en/math.php>.
	 * https://github.com/cangoektas/xyz-to-lab/blob/master/src/index.js
	 * @return {LabColor} The color.
	 */
	toLabColor() {
		const xyz = this.toXYZColor();
		const [x, y, z] = [xyz.x, xyz.y, xyz.z].map((v, i) => {
			v = v / D65[i]
			return v > 0.008856 ? Math.pow(v, 1 / 3) : v * 7.787 + 16 / 116
		});

		return new LabColor(
			116 * y - 16,
			500 * (x - y),
			200 * (y - z)
		);
	}

	/**
	 * Convert this color to a CSS string.
	 * @return {string} The CSS representation of this color.
	 */
	toCSS() {
		const rgb = this.toRGBColor();
		const r = Math.round(rgb.r).toString(16).padStart(2, '0');
		const g = Math.round(rgb.g).toString(16).padStart(2, '0');
		const b = Math.round(rgb.b).toString(16).padStart(2, '0');

		return `#${ r }${ g }${ b }`;
	}
}

export class RGBColor extends Color {
	r;
	g;
	b;

	/**
	 * Construct a new RGBColor
	 * @param  {number} r The red component, 0 - 255
	 * @param  {number} g The green component, 0 - 255
	 * @param  {number} b The blue component, 0 - 255
	 */
	constructor(r, g, b) {
		super();

		this.r = r;
		this.g = g;
		this.b = b;
	}

	toRGBColor() {
		return this;
	}

	/**
	 * @inheritdoc
	 *
	 * Uses the sRGB color profile.
	 *
	 * from https://gist.github.com/mnito/da28c930d270f280f0989b9a707d71b5
	 */
	toXYZColor() {
		const sxm = [
			[0.4124564, 0.3575761, 0.1804375],
			[0.2126729, 0.7151522, 0.0721750],
			[0.0193339, 0.1191920, 0.9503041]
		];

		const linear = this.toLinearRGBColor();

		const rLinear = linear.r;
		const gLinear = linear.g;
		const bLinear = linear.b;

		return new XYZColor(
			(rLinear * sxm[0][0] + gLinear * sxm[0][1] + bLinear * sxm[0][2]) * 100,
			(rLinear * sxm[1][0] + gLinear * sxm[1][1] + bLinear * sxm[1][2]) * 100,
			(rLinear * sxm[2][0] + gLinear * sxm[2][1] + bLinear * sxm[2][2]) * 100
		);
	}

	/**
	 * Create an integer representation of this color (e.g. 0xFFFFFF).
	 * @return {number}
	 */
	toInteger() {
		let value = this.b;
		value |= this.g << 8;
		value |= this.r << 16;

		return value;
	}

	/**
	 * Create a new RGBColor from an integer (e.g. 0xFFFFFF).
	 *
	 * @param {number} value The RGB color as an integer.
	 * @return {RGBColor} The new color
	 */
	static fromInteger(value) {
		const b = value & 0xFF;
		const g = (value >> 8) & 0xFF;
		const r = (value >> 16) & 0xFF;

		return new RGBColor(r, g, b);
	}

	/**
	 * Parse a color from a CSS Hex code such as #ffcc00.
	 *
	 * @param  {string} value The value to parse.
	 * @return {Color}        The parsed color or null if it is not a valid color.
	 */
	static parseCSSHex(value) {
		let result = null;

		if (value.length === 7 && value[0] === '#') {
			const r = parseInt(value.substring(1, 3), 16);
			const g = parseInt(value.substring(3, 5), 16);
			const b = parseInt(value.substring(5, 7), 16);

			result = new RGBColor(r, g, b);
		}

		return result;
	}
}

export class RGBAColor extends RGBColor {
	a;

	/**
	 * Construct a new RGBColor
	 * @param  {number} r The red component, 0 - 255
	 * @param  {number} g The green component, 0 - 255
	 * @param  {number} b The blue component, 0 - 255
	 * @param  {number} a The alpha component, 0 - 255
	 */
	constructor(r, g, b, a) {
		super(r, g, b);

		this.a = a;
	}

	/**
	 * Create a new RGBAColor from an integer (e.g.  0xFFFFFFFF).
	 *
	 * @param {number} value The RGBA color as an integer.
	 * @return {RGBAColor} The new color
	 */
	static fromInteger(value) {
		const a = value & 0xFF;
		const b = (value >> 8) & 0xFF;
		const g = (value >> 16) & 0xFF;
		const r = (value >> 24) & 0xFF;

		return new RGBAColor(r, g, b, a);
	}
}


/**
 * An RGB color space where the values are linear
 */
export class LinearRGBColor extends Color {
	/**
	 * Construct a new LinearRGBColor
	 * @param  {number} r The red component, 0 - 1
	 * @param  {number} g The green component, 0 - 1
	 * @param  {number} b The blue component, 0 - 1
	 */
	constructor(r, g, b) {
		super();

		this.r = r;
		this.g = g;
		this.b = b;
	}

	toRGBColor() {
		const r = transfer(this.r);
		const g = transfer(this.g);
		const b = transfer(this.b);

		return new RGBColor(Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255));
	}

	perceptualBrightness() {
		return Math.pow(this.r + this.g + this.b, GAMMA_INV);
	}
}


export class XYZColor extends Color {
	x;
	y;
	z;

	/**
	 * Construct a new XYZColor
	 * @param  {number} x The X component
	 * @param  {number} y The Y component
	 * @param  {number} z The Z component
	 */
	constructor(x, y, z) {
		super();

		this.x = x;
		this.y = y;
		this.z = z;
	}

	toXYZColor() {
		return this;
	}
}


export class HSLColor extends Color {
	h;
	s;
	l;

	/**
	 * Construct a new HSLColor
	 * @param  {number} h The hue component
	 * @param  {number} s The saturation  component
	 * @param  {number} l The lightness component
	 */
	constructor(h, s, l) {
		super();

		this.h = h;
		this.s = s;
		this.l = l;
	}
}


export class LabColor extends Color {
	l;
	a;
	b;

	/**
	 * Construct a new LabColor
	 * @param  {number} l The lightness component
	 * @param  {number} a The a component
	 * @param  {number} b The b component
	 */
	constructor(l, a, b) {
		super();

		this.l = l;
		this.a = a;
		this.b = b;
	}

	toXYZColor() {
		const l = ( this.l + 16 ) / 116;
		const a = this.a / 500 + l;
		const b = l - this.b / 200;

		const [x, y, z] = [l, a, b].map((v, i) => {
			return D65[i] * (Math.pow(v, 3) > 0.008856 ? Math.pow(v, 3) : ( v - 16 / 116 ) / 7.787);
		});

		return new XYZColor(
			x / 100,
			y / 100,
			z / 100
		);
	}

	toRGBColor() {
		const xyz = this.toXYZColor();

		const rLinear = xyz.x *  3.2406 + xyz.y * -1.5372 + xyz.z * -0.4986;
		const gLinear = xyz.x * -0.9689 + xyz.y *  1.8758 + xyz.z *  0.0415;
		const bLinear = xyz.x *  0.0557 + xyz.y * -0.2040 + xyz.z *  1.0570;

		const r = transfer(rLinear) * 255;
		const g = transfer(gLinear) * 255;
		const b = transfer(bLinear) * 255;

		return new RGBColor(r, g, b);
	}
}

