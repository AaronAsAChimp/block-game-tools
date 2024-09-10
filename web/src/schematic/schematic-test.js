import fs from 'fs/promises';
import { LitematicaSchematic } from "./schematic.js";
import { MC_DATA_VERSION } from 'shared';
import { SchematicRegion } from './schematic-region.js';

const schematic = new LitematicaSchematic({
	author: 'Me',
	description: '',
	name: 'Test Schematic',
	timeCreated: new Date(),
	timeModified: new Date()
}, MC_DATA_VERSION);

const region = new SchematicRegion({x: 0, y: 0, z: 0}, {x: 4, y: 1, z: 2});

region.setBlock('minecraft:redstone_block', {}, {x: 0, y: 0, z: 0});
region.setBlock('minecraft:redstone_block', {}, {x: 1, y: 0, z: 0});
region.setBlock('minecraft:redstone_ore', {}, {x: 2, y: 0, z: 0});
region.setBlock('minecraft:redstone_ore', {}, {x: 3, y: 0, z: 0});

region.setBlock('minecraft:lapis_block', {}, {x: 0, y: 0, z: 1});
region.setBlock('minecraft:lapis_block', {}, {x: 1, y: 0, z: 1});
region.setBlock('minecraft:lapis_ore', {}, {x: 2, y: 0, z: 1});
region.setBlock('minecraft:lapis_ore', {}, {x: 3, y: 0, z: 1});

schematic.addRegion('Test Region', region);

const blob = await LitematicaSchematic.writeCompressed(schematic);
const buffer = await blob.arrayBuffer();

fs.writeFile('test.litematic', new Int8Array(buffer));