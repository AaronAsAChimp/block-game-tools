/**
 * @typedef {[number, number, number]} OBJPoint
 */

export class OBJFile {
	constructor() {
		/**
		 * The points contained in this file.
		 * 
		 * @type {OBJPoint[]}
		 */
		this._points = [];

		/**
		 * The lines contained in this file.
		 * @type {number[][]}
		 */
		this._lines = [];

		/**
		 * The polygons contained in this file.
		 * @type {number[][]}
		 */
		this._polygons = [];
	}

	/**
	 * Add a line to this OBJ file.
	 * 
	 * @param  {OBJPoint[]} points  The points in the line.
	 */
	line(points) {
		const line = [];

		for (const point of points) {
			if (!point) {
				throw new Error('Missing point in ' + JSON.stringify(points));
			}

			const length = this._points.push(point);

			line.push(length);
		}

		this._lines.push(line);
	}

	/**
	 * Add a triangle to this OBJ file.
	 *
	 * @param  {OBJPoint} p1 The first point
	 * @param  {OBJPoint} p2 The second point
	 * @param  {OBJPoint} p3 The third point
	 */
	triangle(p1, p2, p3) {
		const tri = new Array(3);

		if (!p1) {
			throw new Error('p1 is not defined.');
		}

		const p1_idx = this._points.push(p1);
		tri[0] = p1_idx;

		if (!p2) {
			throw new Error('p2 is not defined.');
		}

		const p2_idx = this._points.push(p2);
		tri[1] = p2_idx;

		if (!p3) {
			throw new Error('p3 is not defined.');
		}

		const p3_idx = this._points.push(p3);
		tri[2] = p3_idx;

		this._polygons.push(tri);
	}

	toString() {
		let output = '';

		for (const point of this._points) {
			output += 'v';

			for (const coord of point) {
				output += ' ' + coord;
			}

			output += '\n';
		}

		for (const line of this._lines) {
			output += 'l';

			for (let idx = 0; idx < line.length - 1; idx++) {
				output += ' ' + line[idx] + ' ' + line[idx + 1];
			}

			output += '\n';
		}

		for (const poly of this._polygons) {
			output += 'f';

			for (let idx = 0; idx < poly.length; idx++) {
				output += ' ' + poly[idx];
			}

			output += '\n';
		}

		return output;
	}
}