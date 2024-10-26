import test from 'ava';
import nbt from 'prismarine-nbt';
import { LitematicaSchematic } from '../../src/schematic/schematic.js';
import { SchematicRegion } from '../../src/schematic/schematic-region.js';
import { loadSchematic } from '../utils.js';

test('Can build an empty schematic', async t => {
	// Arrange
	const file = await loadSchematic('empty.lightmatic', false);
	const schematic = new LitematicaSchematic(null, 3578);

	// Act
	const result = schematic.toNbt();

	// Assert
	t.deepEqual(result, file, "are the buffers the same");
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
	const buffer = await LitematicaSchematic.writeUncompressed(schematic).arrayBuffer();
	const result = nbt.parseUncompressed(Buffer.from(buffer));

	// Assert
	t.deepEqual(result, file, "is the NBT same");
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
	const buffer = await LitematicaSchematic.writeUncompressed(schematic).arrayBuffer();
	const result = nbt.parseUncompressed(Buffer.from(buffer));
	// const result = schematic.toNbt();

	// Assert
	t.deepEqual(result, file, "is the NBT the same");
});
