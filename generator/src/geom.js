
/** @typedef {[number, number, number]} Point3D */

/**
 * Multiply the vector by a scalar and put the result in out.
 *
 * @param  {Point3D} point 
 * @param  {number} scalar
 * @param  {Point3D} out
 */
export function mult(point, scalar, out) {
	out[0] = point[0] * scalar;
	out[1] = point[1] * scalar;
	out[2] = point[2] * scalar;
}

/**
 * Subtract two vectors.
 *
 * @param  {Point3D} v1  First point
 * @param  {Point3D} v2  Second point
 * @param  {Point3D} out The result
 */
export function sub(v1, v2, out) {
	out[0] = v1[0] - v2[0];
	out[1] = v1[1] - v2[1];
	out[2] = v1[2] - v2[2];
}

/**
 * Find the distance between two 3D points, but square it.
 *
 * @param  {Point3D} point1 The first point
 * @param  {Point3D} point2 The second point
 *
 * @return {number}        The distance squared
 */
export function distanceSquared3D(point1, point2) {
	const x = point1[0] - point2[0];
	const y = point1[1] - point2[1];
	const z = point1[2] - point2[2];

	return x * x + y * y + z * z;
}

/**
 * Find the distance between two 3D points
 *
 * @param  {Point3D} point1 The first point
 * @param  {Point3D} point2 The second point
 *
 * @return {number}         The distance
 */
export function distance3D(point1, point2) {
	const x = point1[0] - point2[0];
	const y = point1[1] - point2[1];
	const z = point1[2] - point2[2];

	return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Find the cross product between two 3D points
 *
 * @param  {Point3D} point1 The first point
 * @param  {Point3D} point2 The second point
 * @param  {Point3D} out The point to store the result
 */
export function crossProduct3D(point1, point2, out) {
	out[0] = point1[1] * point2[2] - point1[2] * point2[1];
	out[1] = point1[2] * point2[0] - point1[0] * point2[2];
	out[2] = point1[0] * point2[1] - point1[1] * point2[0];
}

/**
 * Find the dot product between two 3D points
 *
 * @param  {Point3D} point1 The first point
 * @param  {Point3D} point2 The second point
 *
 * @returns {number} 
 */
export function dotProduct3D(point1, point2) {
	return point1[0] * point2[0] + point1[1] * point2[1] + point1[2] * point2[2];
}

/**
 * Find the determinant of a 3 x 3 matrix
 *
 * @param  {number} m11
 * @param  {number} m12
 * @param  {number} m13
 * @param  {number} m21
 * @param  {number} m22
 * @param  {number} m23
 * @param  {number} m31
 * @param  {number} m32
 * @param  {number} m33
 *
 * @return {number} The determinant
 */
export function determinant3x3(m11, m12, m13,
						m21, m22, m23,
						m31, m32, m33) {
	return (m11 * m22 * m33)
		+ (m12 * m23 * m31)
		+ (m13 * m21 * m32)
		- (m13 * m22 * m31)
		- (m12 * m21 * m33)
		- (m11 * m23 * m32);
}

/**
 * Find the determinant of a 4 x 4 matrix.
 *
 * @param  {number} m11
 * @param  {number} m12
 * @param  {number} m13
 * @param  {number} m14
 * @param  {number} m21
 * @param  {number} m22
 * @param  {number} m23
 * @param  {number} m24
 * @param  {number} m31
 * @param  {number} m32
 * @param  {number} m33
 * @param  {number} m34
 * @param  {number} m41
 * @param  {number} m42
 * @param  {number} m43
 * @param  {number} m44
 *
 * @return {number} The determinant
 */
export function determinant4x4(m11, m12, m13, m14,
						m21, m22, m23, m24,
						m31, m32, m33, m34,
						m41, m42, m43, m44) {
	return m11 * determinant3x3(m22, m23, m24, m32, m33, m34, m42, m43, m44)
		- m12 * determinant3x3(m21, m23, m24, m31, m33, m34, m41, m43, m44)
		+ m13 * determinant3x3(m21, m22, m24, m31, m32, m34, m41, m42, m44)
		- m14 * determinant3x3(m21, m22, m23, m31, m32, m33, m41, m42, m43);
}


/**
 * Check if the givent point is inside a sphere.
 *
 * @param  {Point3D}  point  The point to check
 * @param  {Point3D}  center The center point of the sphere
 * @param  {number}  radius  The radius of the sphere
 *
 * @return {boolean} True if the point is inside the sphere, false otherwise.
 */
export function isPointInSphere(point, center, radius) {
	return distanceSquared3D(point, center) < (radius * radius);
}

export function isPointInTetrahedron(point, v1, v2, v3, v4) {
	const d0 = determinant4x4(
		v1[0], v1[1], v1[2], 1,
		v2[0], v2[1], v2[2], 1,
		v3[0], v3[1], v3[2], 1,
		v4[0], v4[1], v4[2], 1,
	);

	const d1 = determinant4x4(
		point[0], point[1], point[2], 1,
		v2[0], v2[1], v2[2], 1,
		v3[0], v3[1], v3[2], 1,
		v4[0], v4[1], v4[2], 1,
	);

	const d2 = determinant4x4(
		v1[0], v1[1], v1[2], 1,
		point[0], point[1], point[2], 1,
		v3[0], v3[1], v3[2], 1,
		v4[0], v4[1], v4[2], 1,
	);

	const d3 = determinant4x4(
		v1[0], v1[1], v1[2], 1,
		v2[0], v2[1], v2[2], 1,
		point[0], point[1], point[2], 1,
		v4[0], v4[1], v4[2], 1,
	);

	const d4 = determinant4x4(
		v1[0], v1[1], v1[2], 1,
		v2[0], v2[1], v2[2], 1,
		v3[0], v3[1], v3[2], 1,
		point[0], point[1], point[2], 1,
	);

	return Math.sign(d0) === Math.sign(d1) 
		&& Math.sign(d0) === Math.sign(d2)
		&& Math.sign(d0) === Math.sign(d3)
		&& Math.sign(d0) === Math.sign(d4);
}
