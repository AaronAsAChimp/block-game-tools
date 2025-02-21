import { distanceSquared3D, distance3D, crossProduct3D, mult, dotProduct3D, isPointInSphere, isPointInTetrahedron, sub } from './geom.js';

class Sphere {
	/** @type {import('./geom.js').Point3D} */
	center;

	/** @type {number} radius */
	radius;

	constructor() {
		this.center = [0, 0, 0];
		this.radius = 0;
	}
}

/** @typedef {[number, number]} TetrahedronEdge */


const TETRAHEDRON_NUM_VERTICES = 4;

export class Tetrahedron {
	/** @type {import('./geom.js').Point3D[]} */
	#catalog;

	/** @type {number[]} */
	points;

	/** @type {[TetrahedronEdge, TetrahedronEdge, TetrahedronEdge, TetrahedronEdge, TetrahedronEdge, TetrahedronEdge ]} */
	edges;


	/**
	 * Construct a new Tetrahedron
	 *
	 * @param  {import('./geom.js').Point3D[]} catalog The points for all geometry
	 */
	constructor(catalog) {
		this.#catalog = catalog;

		this.points = [
			0,
			1,
			2,
			3,
		]

		this.edges = [
			[0, 1],
			[0, 2],
			[0, 3],
			[1, 2],
			[2, 3],
			[3, 1],
		];
	}

	point(idx) {
		return this.#catalog[this.points[idx]];
	}

	volume() {
		/** @type {import('./geom.js').Point3D} */
		const a = [0, 0, 0];

		/** @type {import('./geom.js').Point3D} */
		const b = [0, 0, 0];

		/** @type {import('./geom.js').Point3D} */
		const c = [0, 0, 0];

		/** @type {import('./geom.js').Point3D} */
		const axb = [0, 0, 0];

		const basePoint = this.point(0);

		sub(basePoint, this.point(1), a);
		sub(basePoint, this.point(2), b);
		sub(basePoint, this.point(3), c);

		crossProduct3D(a, b, axb);
		return dotProduct3D(axb, c)
	}

	centroid() {
		const point0 = this.#catalog[this.points[0]];
		const point1 = this.#catalog[this.points[1]];
		const point2 = this.#catalog[this.points[2]];
		const point3 = this.#catalog[this.points[3]];

		return [
			(point0[0] + point1[0] + point2[0] + point3[0]) / 4,
			(point0[1] + point1[1] + point2[1] + point3[1]) / 4,
			(point0[2] + point1[2] + point2[2] + point3[2]) / 4,
		]
	}

	/**
     * @param {number} p1
     * @param {number} p2
     */
	hasEdge(p1, p2) {
		for (const edge of this.edges) {
			if ((edge[0] === p1 && edge[1] === p2) || (edge[0] === p2 && edge[1] === p1)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Find a circumsphere for this tetrahedron.
	 *
	 * @return {Sphere} The circumsphere
	 */
	circumsphere() {
		const point0 = this.#catalog[this.points[0]];
		const point1 = this.#catalog[this.points[1]];
		const point2 = this.#catalog[this.points[2]];
		const point3 = this.#catalog[this.points[3]];

		const a = distanceSquared3D(point0, point1);
		const b = distanceSquared3D(point0, point2);
		const c = distanceSquared3D(point0, point3);

		/** @type {import('./geom.js').Point3D} */
		const u1 = [
			point1[0] - point0[0],
			point1[1] - point0[1],
			point1[2] - point0[2],
		];

		/** @type {import('./geom.js').Point3D} */
		const u2 = [
			point2[0] - point0[0],
			point2[1] - point0[1],
			point2[2] - point0[2],
		];

		/** @type {import('./geom.js').Point3D} */
		const u3 = [
			point3[0] - point0[0],
			point3[1] - point0[1],
			point3[2] - point0[2],
		];

		/** @type {import('./geom.js').Point3D} */
		const top1 = [0, 0, 0];

		crossProduct3D(u2, u3, top1)
		mult(top1, a, top1);

		/** @type {import('./geom.js').Point3D} */
		const top2 = [0, 0, 0];

		crossProduct3D(u3, u1, top2)
		mult(top2, b, top2);

		/** @type {import('./geom.js').Point3D} */
		const top3 = [0, 0, 0];

		crossProduct3D(u1, u2, top3)
		mult(top3, c, top3);

		/** @type {import('./geom.js').Point3D} */
		const bottom1 = [0, 0, 0];

		mult(u1, 2, bottom1);

		/** @type {import('./geom.js').Point3D} */
		const bottom2 = [0, 0, 0];

		crossProduct3D(u2, u3, bottom2);

		const bottom = dotProduct3D(bottom1, bottom2);

		if (bottom !== 0) {
			const circumsphere = new Sphere();

			circumsphere.center[0] = point0[0] + ((top1[0] + top2[0] + top3[0]) / bottom);
			circumsphere.center[1] = point0[1] + ((top1[1] + top2[1] + top3[1]) / bottom);
			circumsphere.center[2] = point0[2] + ((top1[2] + top2[2] + top3[2]) / bottom);

			circumsphere.radius = distance3D(circumsphere.center, point0);

			return circumsphere;
		} else {
			console.group('is NaN')
			console.log('bottom', bottom, bottom1, bottom2);
			console.log('Point 0', point0);

			// console.log('Center', circumsphere.center);
			// console.log('Radius', circumsphere.radius);
			console.groupEnd()

			return null;
		}
	}
}


/**
 * Write a tetrahedron to an OBJ file.
 *
 * @param  {import('./objfile').OBJFile} objfile     The file to write ti
 * @param  {Tetrahedron} tetrahedron The tetrahedron to write.
 */
export function writeTetrahedron(objfile, tetrahedron) {
	for (let pointIdx = 0; pointIdx < TETRAHEDRON_NUM_VERTICES; pointIdx++) {
		objfile.triangle(
			tetrahedron.point(pointIdx),
			tetrahedron.point((pointIdx + 1) % TETRAHEDRON_NUM_VERTICES),
			tetrahedron.point((pointIdx + 2) % TETRAHEDRON_NUM_VERTICES),
		);
	}
}


/**
 * Fills a space with tetrahedrons where each point added is a vertex in a
 * tetrahedron and none of the tetrahedra overlap and have the largest angles.
 */
export class Tetrahedralization {
	/**
	 * @type {import('./geom.js').Point3D[]}
	 */
	#points;

	/**
	 * @type {import('./bounding-box.js').BoundingBox3D}
	 */
	#bbox;

	/**
	 * @type {Tetrahedron}
	 */
	#superTetrahedron;

	#searchSpace;

	/**
	 * Create a new tetrahedrealization
	 *
	 * @param  {import('./bounding-box.js').BoundingBox3D} bbox The bounding box for all of the points.
	 */
	constructor(bbox) {
		const min = bbox.minimum();
		const max = bbox.maximum();

		/** @type {import('./geom.js').Point3D} */
		const pointDown = [
			min.x,
			max.y + bbox.height(),
			min.z
		];

		/** @type {import('./geom.js').Point3D} */
		const pointRight = [
			max.x + bbox.width(),
			min.y,
			min.z
		];

		/** @type {import('./geom.js').Point3D} */
		const pointInward = [
			min.x,
			min.y,
			max.z + bbox.depth()
		];

		this.#points = [
			[min.x, min.y, min.z],
			pointDown,
			pointRight,
			pointInward
		];
		this.#bbox = bbox;

		const superTetrahedron = new Tetrahedron(this.#points);

		this.#superTetrahedron = superTetrahedron;

		this.#searchSpace = [
			{
				tetrahedron: this.#superTetrahedron,
				circumsphere: this.#superTetrahedron.circumsphere()
			}
		];
	}

	/**
     * @param {import('./geom.js').Point3D} point
     */
	add(point) {
		const badSpheres = [];
		let pointIndex = this.#points.length;

		this.#points.push(point);

		for (const sphere of this.#searchSpace)	 {
			if (isPointInSphere(point, sphere.circumsphere.center, sphere.circumsphere.radius)) {
				badSpheres.push(sphere);
			}
		}

		// console.log('Bad Spheres:', badSpheres);

		for (let badSphereIdx = 0; badSphereIdx < badSpheres.length; badSphereIdx++) {
			const badSphere = badSpheres[badSphereIdx];
			const badTetrahedron = badSphere.tetrahedron;
			const isInTetra = isPointInTetrahedron(
				point,
				badTetrahedron.point(0),
				badTetrahedron.point(1),
				badTetrahedron.point(2),
				badTetrahedron.point(3)
			);

			if (!isInTetra) {
				continue;
			}

			const edges = badSphere.tetrahedron.edges;
			const sphereIdx = this.#searchSpace.indexOf(badSphere);

			this.#searchSpace.splice(sphereIdx, 1);

			for (const sphere of badSpheres) {
				const tetrahedron = sphere.tetrahedron;

				if (badSphere !== sphere) {
					for (let i = edges.length - 1; i >= 0; i--) {
						if (tetrahedron.hasEdge(...edges[i])) {
							edges.splice(i, 1);
						}
					}
				}
			}

			const badPoints = badSphere.tetrahedron.points;

			// We can choose 3 arbitrary points from the bad tetrahedron as long
			// as the each set of points is unique. Here we are just passing a
			// window over the points of the tetrahedron
			// 
			// This is because any three points of a tetrahedron is a face. Its
			// just a property of a tetrahedron. We can then create our new
			// tetrahedron by adding our new point.
			for (let pointIdx = 0; pointIdx < TETRAHEDRON_NUM_VERTICES; pointIdx++) {
				const tetrahedron = new Tetrahedron(this.#points);

				tetrahedron.points[0] = badPoints[pointIdx];
				tetrahedron.points[1] = badPoints[(pointIdx + 1) % TETRAHEDRON_NUM_VERTICES];
				tetrahedron.points[2] = badPoints[(pointIdx + 2) % TETRAHEDRON_NUM_VERTICES];
				tetrahedron.points[3] = pointIndex;

				const sphere = tetrahedron.circumsphere();

				if (sphere) {
					this.#searchSpace.push({
						tetrahedron: tetrahedron,
						circumsphere: sphere
					});
				} else {
					console.warn('Found tetrahedron with an volume of 0, the mesh may contain voids.');
				}
			}

		}

		// TODO: Go through the badSpheres to restore the Delaunay condition.
	}

	getTetrahedrons() {
		const tetrahedrons = [];

		for (const item of this.#searchSpace) {
			const tetra = item.tetrahedron;
			let excluded = false;

			for (const point of tetra.points) {
				if (point < TETRAHEDRON_NUM_VERTICES) {
					excluded = true;
					break;
				}
			}

			if (excluded) {
				 continue;
			}

			tetrahedrons.push(tetra);
		}

		return tetrahedrons;
	}
}