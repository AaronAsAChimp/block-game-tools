// X, Y, Z of a "D65" light source.
// "D65" is a standard 6500K Daylight light source.
// https://en.wikipedia.org/wiki/Illuminant_D65
const D65 = [95.047, 100, 108.883];

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

		return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
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
		var sxm = [
			[0.4124564, 0.3575761, 0.1804375],
			[0.2126729, 0.7151522, 0.0721750],
			[0.0193339, 0.1191920, 0.9503041]
		];

		var inverted_transfer = function (c) {
			if(c <= 0.04045) {
				return c / 12.92;
			} else {
				return Math.pow((c + 0.055)/1.055, 2.4);
			}
		};

		var rLinear = inverted_transfer(this.r / 255);
		var gLinear = inverted_transfer(this.g / 255);
		var bLinear = inverted_transfer(this.b / 255);

		return new XYZColor(
			(rLinear * sxm[0][0] + gLinear * sxm[0][1] + bLinear * sxm[0][2]) * 100,
			(rLinear * sxm[1][0] + gLinear * sxm[1][1] + bLinear * sxm[1][2]) * 100,
			(rLinear * sxm[2][0] + gLinear * sxm[2][1] + bLinear * sxm[2][2]) * 100
		);
	}

	/**
	 * Create a new RGBColor from an integer (e.g.  0xFFFFFF).
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
	 * @return {RGBColor} The new color
	 */
	static fromInteger(value) {
		const a = value & 0xFF;
		const b = (value >> 8) & 0xFF;
		const g = (value >> 16) & 0xFF;
		const r = (value >> 24) & 0xFF;

		return new RGBAColor(r, g, b, a);
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
}

