import test from 'ava';
import { writeTagged, TAG_BYTE, TAG_SHORT, TAG_INT, TAG_LONG, TAG_FLOAT, TAG_DOUBLE, TAG_BYTE_ARRAY, TAG_STRING, TAG_LIST, TAG_COMPOUND, TAG_INT_ARRAY, TAG_LONG_ARRAY, TAG_END } from '../low-level.js';

test('Can write byte to buffer', t => {
	// Arrange
	const parsed = [
		TAG_BYTE,
		'a',
		42
	];

	// Act
	const buf = writeTagged(parsed);

	// Assert
	t.deepEqual(buf, Uint8Array.from([0x01, 0x00, 0x01, 0x61, 0x2A]));
});

test('Can write short to buffer', t => {
	// Arrange
	const parsed = [
		TAG_SHORT,
		'ab',
		10922
	];

	// Act
	const buf = writeTagged(parsed);

	// Assert
	t.deepEqual(buf, Uint8Array.from([0x02, 0x00, 0x02, 0x61, 0x62, 0x2A, 0xAA]));
});

test('Can write int to buffer', t => {
	// Arrange
	const parsed = [
		TAG_INT,
		'abc',
		715827882
	];

	// Act
	const buf = writeTagged(parsed);

	// Assert
	t.deepEqual(buf, Uint8Array.from([0x03, 0x00, 0x03, 0x61, 0x62, 0x63, 0x2A, 0xAA, 0xAA, 0xAA]));
});

test('Can write long to buffer', t => {
	// Arrange
	const parsed = [
		TAG_LONG,
		'abcd',
		3074457345618258602n
	];

	// Act
	const buf = writeTagged(parsed);

	// Assert
	t.deepEqual(buf, Uint8Array.from([0x04, 0x00, 0x04, 0x61, 0x62, 0x63, 0x64, 0x2A, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA]));
});

test('Can write float to buffer', t => {
	// Arrange
	const parsed = [
		TAG_FLOAT,
		'abcde',
		3.14159203
	];

	// Act
	const buf = writeTagged(parsed);

	// Assert
	t.deepEqual(buf, Uint8Array.from([0x05, 0x00, 0x05, 0x61, 0x62, 0x63, 0x64, 0x65, 0x40, 0x49, 0x0f, 0xd8]));
});

test('Can write double to buffer', t => {
	// Arrange
	const parsed = [
		TAG_DOUBLE,
		'abcdef',
		2.718281828459045
	];

	// Act
	const buf = writeTagged(parsed);

	// Assert
	t.deepEqual(buf, Uint8Array.from([0x06, 0x00, 0x06, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x40, 0x05, 0xBF, 0x0A, 0x8B, 0x14, 0x57, 0x69]));
});

test('Can write byte array to buffer', t => {
	// Arrange
	const parsed = [
		TAG_BYTE_ARRAY,
		'a',
		Uint8Array.from([0xCA, 0xFE, 0xBE, 0xBE])
	];

	// Act
	const buf = writeTagged(parsed);

	// Assert
	t.deepEqual(buf, Uint8Array.from([0x07, 0x00, 0x01, 0x61, 0x00, 0x00, 0x00, 0x04, 0xCA, 0xFE, 0xBE, 0xBE]));
});

test('Can write string to buffer', t => {
	// Arrange
	const parsed = [
		TAG_STRING,
		'a',
		'🔥'
	];

	// Act
	const buf = writeTagged(parsed);

	// Assert
	t.deepEqual(buf, Uint8Array.from([0x08, 0x00, 0x01, 0x61, 0x00, 0x04, 0xF0, 0x9F, 0x94, 0xA5]));
});

test('Can write list to buffer', t => {
	// Arrange
	const parsed = [
		TAG_LIST,
		'a',
		[TAG_BYTE, 1, 2, 3, 4]
	];

	// Act
	const buf = writeTagged(parsed);

	// Assert
	t.deepEqual(buf, Uint8Array.from([
		0x09, 0x00, 0x01, 0x61,
		0x01, // TAG_BYTE
		0x00, 0x00, 0x00, 0x04, // Length: 4
		0x01, // Item 0
		0x02, // Item 1
		0x03, // Item 2
		0x04  // Item 3
	]));
});

test('Can write compound to buffer', t => {
	// Arrange
	const parsed = [
		TAG_COMPOUND,
		'a',
		[TAG_BYTE, 'b', 42, TAG_END]
	];

	// Act
	const buf = writeTagged(parsed);

	// Assert
	t.deepEqual(buf, Uint8Array.from([0x0A, 0x00, 0x01, 0x61, 0x01, 0x00, 0x01, 0x62, 0x2A, 0x00]));
});

test('Can write int array to buffer', t => {
	// Arrange
	const parsed = [
		TAG_INT_ARRAY,
		'a',
		new Int32Array([1, 2])
	];

	// Act
	const buf = writeTagged(parsed);

	// Assert
	t.deepEqual(buf, Uint8Array.from([0x0B, 0x00, 0x01, 0x61, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x02]));
});

test('Can write long array to buffer', t => {
	// Arrange
	const parsed = [
		TAG_LONG_ARRAY,
		'a',
		new BigInt64Array([1n, 2n])
	];

	// Act
	const buf = writeTagged(parsed);

	// Assert
	t.deepEqual(buf, Uint8Array.from([0x0C, 0x00, 0x01, 0x61, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02]));
});
