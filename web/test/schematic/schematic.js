import test from 'ava';
import { LitematicaSchematic } from '../../src/schematic/schematic.js';
import { SchematicRegion } from '../../src/schematic/schematic-region.js';
import { compareNbt, loadSchematic } from '../utils.js';
import { streamToUint8Array } from '../../src/schematic/stream-to-array.js';

test('Can build an empty schematic', async t => {
	// Arrange
	const file = await loadSchematic('empty.lightmatic', false);
	const schematic = new LitematicaSchematic(null, 3578);

	// Act
	const result = LitematicaSchematic.writeUncompressed(schematic);

	// Assert
	compareNbt(t, result, file, "are the buffers the same");
});

test('Can build a schematic for a single block of cobblestone', async t => {
	// Arrange
	const file = await loadSchematic('cobblestone.litematic', true);
	const schematic = new LitematicaSchematic({
		author: 'AaronAsAChimp',
		description: '',
		name: 'Cobblestone',
		timeCreated: new Date(1714228543454000),
		timeModified: new Date(1714228543454000)
	}, 3700);

	// Act
	const region = new SchematicRegion({x: 0, y: 0, z: 0}, {x: 1, y: 1, z: 1});
	region.setBlock('minecraft:cobblestone', null, {x: 0, y: 0, z: 0});
	schematic.addRegion('Cobblestone', region);
	// Serialize and deserialize the the NBT to normalize the values
	const buffer = LitematicaSchematic.writeUncompressed(schematic);

	// Assert
	compareNbt(t, buffer, file, "is the NBT same");
});


test('Can build a schematic for a single block of oak wood pointed in the Y direction', async t => {
	// Arrange
	const file = await loadSchematic('oakwood.litematic', true);
	const schematic = new LitematicaSchematic({
		author: 'AaronAsAChimp',
		description: '',
		name: 'Oak wood',
		timeCreated: new Date(0),
		timeModified: new Date(0)
	}, 3700);

	// Act
	const region = new SchematicRegion({x: 0, y: 0, z: 0}, {x: 1, y: 1, z: 1});
	region.setBlock('minecraft:oak_log', {axis: 'y'}, {x: 0, y: 0, z: 0});
	schematic.addRegion('Oak wood', region);
	// Serialize and deserialize the the NBT to normalize the values
	const buffer = LitematicaSchematic.writeUncompressed(schematic);

	// Assert
	compareNbt(t, buffer, file, "is the NBT the same");
});

test('Can write to a stream', async t => {
	// Arrange
	const bytes = Buffer.from('This is a test string', 'utf8');
	const bytesIterable = (function* () {
		yield bytes.slice(0, 10);
		yield bytes.slice(10, 21);
	})();
	const stream = ReadableStream.from(bytesIterable);

	// Act
	const region = await streamToUint8Array(stream);

	// Assert
	t.deepEqual(new Uint8Array(bytes), region, "Was stream written properly.")
});
