import test from 'ava';
import { readTagged, toObject, TAG_BYTE, TAG_SHORT, TAG_INT, TAG_LONG, TAG_FLOAT, TAG_DOUBLE, TAG_BYTE_ARRAY, TAG_STRING, TAG_LIST, TAG_COMPOUND, TAG_INT_ARRAY, TAG_LONG_ARRAY, TAG_END, sortKeys } from '../low-level.js';

test('Can sort the keys of a NBT file.', t => {
	// Arrange
	const nbt = [
		TAG_BYTE,
		'A',
		12,
		TAG_BYTE,
		'Z',
		12,
		TAG_BYTE,
		'R',
		12
	];

	// Act
	const sortedNbt = sortKeys(nbt);

	// Assert
	t.is(sortedNbt[1], 'A');
	t.is(sortedNbt[4], 'R');
	t.is(sortedNbt[7], 'Z');
});

test('Can sort the keys of a NBT file with a compound element.', t => {
	// Arrange
	const nbt = [
		TAG_BYTE,
		'A',
		12,
		TAG_COMPOUND,
		'Z',
		[
			TAG_BYTE,
			'Oranges',
			9,
			TAG_BYTE,
			'Apples',
			3,
			0
		],
		TAG_BYTE,
		'R',
		12
	];

	// Act
	const sortedNbt = sortKeys(nbt);

	// Assert
	t.is(sortedNbt[1], 'A');
	t.is(sortedNbt[4], 'R');
	t.is(sortedNbt[7], 'Z');
	t.is(sortedNbt[8][1], 'Apples');
	t.is(sortedNbt[8][4], 'Oranges');
	t.is(sortedNbt[8][6], 0);

});