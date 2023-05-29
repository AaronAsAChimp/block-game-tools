import { LabColor, Color } from "shared";

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
}