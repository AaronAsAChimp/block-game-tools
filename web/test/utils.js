import fs from 'fs/promises';
import { promisify } from 'util';
import { gunzip as gz } from 'zlib';
import { readTagged, sortKeys, writeTagged} from 'nbt/low-level.js';


const gunzip = promisify(gz);

export async function loadSchematic(filename, compressed) {
	const dataPath = new URL(`./data/${ filename }`, import.meta.url);
	const file = await fs.readFile(dataPath);

	let buffer = null;

	if (compressed) {
		const unzipped = await gunzip(file);
		buffer = unzipped.buffer.slice(0, unzipped.byteLength);
	} else {
		buffer = file.buffer;
	}

	return buffer;
}

export function compareNbt(test, actual, expected, message) {
	const parsed = [];

	if (!(actual instanceof ArrayBuffer)) {
		actual = actual.buffer;
	}

	if (!(expected instanceof ArrayBuffer)) {
		expected = expected.buffer;
	}

	readTagged(new DataView(expected), parsed);

	const expectedParsed = sortKeys(parsed);

	parsed.length = 0;

	readTagged(new DataView(actual), parsed);

	const actualParsed = sortKeys(parsed);

	test.deepEqual(actualParsed, expectedParsed, message);
}