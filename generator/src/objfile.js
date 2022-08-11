export class OBJFile {
	constructor() {
		/**
		 * The points contained in this file.
		 * 
		 * @type {number[][]}
		 */
		this._points = [];

		/**
		 * The lines contained in this file.
		 * @type {number[][]}
		 */
		this._lines = [];
	}

	/**
	 * Add a line to this OBJ file.
	 * 
	 * @param  {number[][]} points  The points in the line.
	 */
	line(points) {
		const line = [];

		for (const point of points) {
			if (!point) {
				throw new Error('Missing point in ' + JSON.stringify(points));
			}

			const length = this._points.push(point);

			line.push(length - 1);
		}

		this._lines.push(line);
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
				output += ' ' + (line[idx] + 1) + ' ' + (line[idx + 1] + 1);
			}

			output += '\n';
		}

		return output;
	}
}