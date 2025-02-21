import test from 'ava';

import {Tetrahedron, Tetrahedralization} from '../src/delaunay.js';
import { BoundingBox3D } from '../src/bounding-box.js';

test('find the circumsphere of a tetrahedron', t => {
	// Arrange
	const catalog = [
		[1, 1, 1],
		[-1, -1, 1],
		[-1, 1, -1],
		[1, -1, -1]
	]
	const tetrahedron = new Tetrahedron(catalog);
	tetrahedron.points[0] = 0;
	tetrahedron.points[1] = 1;
	tetrahedron.points[2] = 2;
	tetrahedron.points[3] = 3;

	// Act
	const sphere = tetrahedron.circumsphere();

	// Assert
	t.deepEqual(sphere.center, [0, 0, 0], 'check the center');
	t.is(sphere.radius, Math.sqrt(3), 'check the radius');
});

test('make a basic tetrahedralization.', async t => {
	// Arrange
	const bbox = new BoundingBox3D()
	bbox.add(0, 0, 0);
	bbox.add(1, 1, 1);

	const tetrahedralization = new Tetrahedralization(bbox);

	// Act
	tetrahedralization.add([0.5, 0.5, 0.5]);
	tetrahedralization.add([0.75, 0.5, 0.5]);
	tetrahedralization.add([0.5, 0.75, 0.5]);
	tetrahedralization.add([0.5, 0.5, 0.75]);

	// Assert
	const tetras = tetrahedralization.getTetrahedrons();

	t.is(tetras.length, 1, 'check the length of the tetrahedrons')
	console.log(tetras[0]);
});
