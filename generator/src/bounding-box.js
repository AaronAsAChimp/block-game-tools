import { LabColor, Color } from "shared";

export class BoundingBox2D {
	#min;
	#max;

	constructor() {
		this.#min = {
			x: Infinity,
			y: Infinity
		};
		this.#max = {
			x: -Infinity,
			y: -Infinity
		};
	}

	/**
	 * Add a point to this bounding box.
	 * @param {number} x The X coordinate
	 * @param {number} y The Y coordinate
	 */
	add(x, y) {
		if (x > this.#max.x) {
			this.#max.x = x;
		}

		if (y > this.#max.y) {
			this.#max.y = y;
		}

		if (x < this.#min.x) {
			this.#min.x = x;
		}

		if (y < this.#min.y) {
			this.#min.y = y;
		}
	}
}

export class BoundingBox3D {
	#min;
	#max;

	constructor() {
		this.#min = {
			x: Infinity,
			y: Infinity,
			z: Infinity
		};
		this.#max = {
			x: -Infinity,
			y: -Infinity,
			z: -Infinity
		};
	}

	/**
	 * Add a point to this bounding box.
	 *
	 * @param {number} x The X coordinate.
	 * @param {number} y The Y coordinate.
	 * @param {number} z The Z coordinate.
	 */
	add(x, y, z) {
		if (x > this.#max.x) {
			this.#max.x = x;
		}

		if (y > this.#max.y) {
			this.#max.y = y;
		}

		if (z > this.#max.z) {
			this.#max.z = z;
		}

		if (x < this.#min.x) {
			this.#min.x = x;
		}

		if (y < this.#min.y) {
			this.#min.y = y;
		}

		if (z < this.#min.z) {
			this.#min.z = z;
		}
	}

	minimum() {
		return {
			...this.#min
		}
	}

	maximum() {
		return {
			...this.#max
		}
	}

	height() {
		return this.#max.y - this.#min.y;
	}

	width() {
		return this.#max.x - this.#min.x;
	}

	depth() {
		return this.#max.z - this.#min.z;
	}
}

export class BoundingBox {
	constructor() {
		this._min = new LabColor(Infinity, Infinity, Infinity);
		this._max = new LabColor(-Infinity, -Infinity, -Infinity);
	}

	/**
	 * Add a point to this bounding box.
	 * @param {Color} point The color to add
	 */
	add(point) {
		const labPoint = point.toLabColor();

		if (labPoint.l > this._max.l) {
			this._max.l = labPoint.l;
		}

		if (labPoint.a > this._max.a) {
			this._max.a = labPoint.a;
		}

		if (labPoint.b > this._max.b) {
			this._max.b = labPoint.b;
		}

		if (labPoint.l < this._min.l) {
			this._min.l = labPoint.l;
		}

		if (labPoint.a < this._min.a) {
			this._min.a = labPoint.a;
		}

		if (labPoint.b < this._min.b) {
			this._min.b = labPoint.b;
		}
	}

	centroid() {
		return new LabColor(
			this._max.l + this._min.l / 2,
			this._max.a + this._min.a / 2,
			this._max.b + this._min.b / 2
		);
	}

	toBoundingBox3d() {
		const bbox = new BoundingBox3D();

		bbox.add(this._min.a, this._min.l, this._min.b);
		bbox.add(this._max.a, this._max.l, this._max.b);

		return bbox;
	}
}