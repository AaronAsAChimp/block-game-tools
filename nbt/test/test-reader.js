import test from 'ava';
import { readTagged, toObject, TAG_BYTE, TAG_SHORT, TAG_INT, TAG_LONG, TAG_FLOAT, TAG_DOUBLE, TAG_BYTE_ARRAY, TAG_STRING, TAG_LIST, TAG_COMPOUND, TAG_INT_ARRAY, TAG_LONG_ARRAY, TAG_END } from '../low-level.js';

test('Can read byte from buffer', t => {
	// Arrange
	const buf = Uint8Array.from([0x01, 0x00, 0x01, 0x61, 0x2A]);
	const view = new DataView(buf.buffer);
	const nbt = [];

	// Act
	readTagged(view, nbt);

	// Assert
	t.is(nbt[0], TAG_BYTE);
	t.is(nbt[1], 'a');
	t.is(nbt[2], 42);
});

test('Can read short from buffer', t => {
	// Arrange
	const buf = Uint8Array.from([0x02, 0x00, 0x02, 0x61, 0x62, 0x2A, 0xAA]);
	const view = new DataView(buf.buffer);
	const nbt = [];

	// Act
	readTagged(view, nbt);

	// Assert
	t.is(nbt[0], TAG_SHORT);
	t.is(nbt[1], 'ab');
	t.is(nbt[2], 10922);
});

test('Can read int from buffer', t => {
	// Arrange
	const buf = Uint8Array.from([0x03, 0x00, 0x03, 0x61, 0x62, 0x63, 0x2A, 0xAA, 0xAA, 0xAA]);
	const view = new DataView(buf.buffer);
	const nbt = [];

	// Act
	readTagged(view, nbt);

	// Assert
	t.is(nbt[0], TAG_INT);
	t.is(nbt[1], 'abc');
	t.is(nbt[2], 715827882);
});

test('Can read long from buffer', t => {
	// Arrange
	const buf = Uint8Array.from([0x04, 0x00, 0x04, 0x61, 0x62, 0x63, 0x64, 0x2A, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA]);
	const view = new DataView(buf.buffer);
	const nbt = [];

	// Act
	readTagged(view, nbt);

	// Assert
	t.is(nbt[0], TAG_LONG);
	t.is(nbt[1], 'abcd');
	t.is(nbt[2], 3074457345618258602n);
});

test('Can read float from buffer', t => {
	// Arrange
	const buf = Uint8Array.from([0x05, 0x00, 0x05, 0x61, 0x62, 0x63, 0x64, 0x65, 0x40, 0x49, 0x0f, 0xd8]);
	const view = new DataView(buf.buffer);
	const nbt = [];

	// Act
	readTagged(view, nbt);

	// Assert
	t.is(nbt[0], TAG_FLOAT);
	t.is(nbt[1], 'abcde');
	t.assert(Math.abs(nbt[2] - 3.14159203) < 0.0000001);
});

test('Can read double from buffer', t => {
	// Arrange
	const buf = Uint8Array.from([0x06, 0x00, 0x06, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x40, 0x05, 0xBF, 0x0A, 0x8B, 0x14, 0x57, 0x69]);
	const view = new DataView(buf.buffer);
	const nbt = [];

	// Act
	readTagged(view, nbt);

	// Assert
	t.is(nbt[0], TAG_DOUBLE);
	t.is(nbt[1], 'abcdef');
	t.assert(Math.abs(nbt[2] - 2.718281828459045) < 0.00000000000001);
});

test('Can read byte array from buffer', t => {
	// Arrange
	const buf = Uint8Array.from([0x07, 0x00, 0x01, 0x61, 0x00, 0x00, 0x00, 0x04, 0xCA, 0xFE, 0xBE, 0xBE]);
	const view = new DataView(buf.buffer);
	const nbt = [];

	// Act
	readTagged(view, nbt);

	// Assert
	t.is(nbt[0], TAG_BYTE_ARRAY);
	t.is(nbt[1], 'a');

	const arr = Uint8Array.from([0xCA, 0xFE, 0xBE, 0xBE]);
	t.deepEqual(nbt[2], arr.buffer);
});

test('Can read string from buffer', t => {
	// Arrange
	const buf = Uint8Array.from([0x08, 0x00, 0x01, 0x61, 0x00, 0x04, 0xF0, 0x9F, 0x94, 0xA5]);
	const view = new DataView(buf.buffer);
	const nbt = [];

	// Act
	readTagged(view, nbt);

	// Assert
	t.is(nbt[0], TAG_STRING);
	t.is(nbt[1], 'a');
	t.deepEqual(nbt[2], '🔥');
});


test('Can read list from buffer', t => {
	// Arrange
	const buf = Uint8Array.from([0x09, 0x00, 0x01, 0x61, 0x01, 0x00, 0x00, 0x00, 0x04, 0x01, 0x02, 0x03, 0x04]);
	const view = new DataView(buf.buffer);
	const nbt = [];

	// Act
	readTagged(view, nbt);

	// Assert
	t.is(nbt[0], TAG_LIST);
	t.is(nbt[1], 'a');
	t.deepEqual(nbt[2], [TAG_BYTE, 1, 2, 3, 4]);
});

test('Can read compound from buffer', t => {
	// Arrange
	const buf = Uint8Array.from([0x0A, 0x00, 0x01, 0x61, 0x01, 0x00, 0x01, 0x62, 0x2A, 0x00]);
	const view = new DataView(buf.buffer);
	const nbt = [];

	// Act
	readTagged(view, nbt);

	// Assert
	t.is(nbt[0], TAG_COMPOUND);
	t.is(nbt[1], 'a');
	t.deepEqual(nbt[2], [TAG_BYTE, 'b', 42, TAG_END]);
});

test('Can read int array from buffer', t => {
	// Arrange
	const buf = Uint8Array.from([0x0B, 0x00, 0x01, 0x61, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x02]);
	const view = new DataView(buf.buffer);
	const nbt = [];

	// Act
	readTagged(view, nbt);

	// Assert
	t.is(nbt[0], TAG_INT_ARRAY);
	t.is(nbt[1], 'a');
	t.deepEqual(nbt[2], new Int32Array([1, 2]));
});

test('Can read long array from buffer', t => {
	// Arrange
	const buf = Uint8Array.from([0x0C, 0x00, 0x01, 0x61, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02]);
	const view = new DataView(buf.buffer);
	const nbt = [];

	// Act
	readTagged(view, nbt);

	// Assert
	t.is(nbt[0], TAG_LONG_ARRAY);
	t.is(nbt[1], 'a');
	t.deepEqual(nbt[2], new BigInt64Array([1n, 2n]));
});

test('Can convert parsed NBT to an object.', t => {
	// Arrange
	const nbt = [
		TAG_SHORT,
		'answer',
		42,
		TAG_COMPOUND,
		'nested',
		[TAG_LONG, 'bignumber', 10n, TAG_END],
		TAG_STRING,
		'wordsOfWisdom',
		'Wisdom, wisdom, wisdom'
	];

	// Act
	const obj = toObject(nbt);

	// Assert
	t.deepEqual(obj, {
		'answer': 42,
		'nested': {
			'bignumber': 10n
		},
		'wordsOfWisdom': 'Wisdom, wisdom, wisdom'
	});
});

