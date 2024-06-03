import fs from "fs";
import path from 'path';
import { PNG } from 'pngjs';

import blockTextures from '../data/block-textures.json' with { type: "json" };
import colorBlocks from '../data/color-blocks.json' with { type: "json" };
import textureTags from '../data/texture-tags.json' with { type: "json" };

import { MC_VERSION } from "shared";
import { Color, LabColor, RGBColor, XYZColor } from "shared/src/color.js";
import { Animation } from './animation.js';
import { BoundingBox } from "./bounding-box.js";
import { BasicColorExtractor, QuantizerColorExtractor, SaturatedColorExtractor } from './color-extractor.js';
import { buildTintMap, tintTexture } from './color-shift.js';
import { OBJFile } from './objfile.js';
import { createAnimatedTexture } from "./animated-texture.js";

/**
 * @typedef {{[blockId: string]: string[] }} TextureMap
 */


/**
 * Walk a directory and yield PNG files.
 * @param {string} dirPath       The directory to walk.
 * @yield {string} The path to the PNG file that was found
 */
async function* walk(dirPath) {
	const dirs = await fs.promises.opendir(dirPath);
    for await (const dir of dirs) {
        const entry = path.join(dirPath, dir.name);
        
        if (dir.isFile()) {
        	const ext = path.extname(dir.name);

        	if (ext === '.png') {
        		yield entry;
        	}
        }
    }
}


/**
 * Add all of the textures for a block to the list of excludes
 * @param {string} blockId  The id of the block
 * @param {TextureMap} blockTextures The block to texture map.
 * @param {Set<string>} excludes The set of excludes.
 */
function addBlockExcludes(blockId, blockTextures, excludes) {
	const textures = blockTextures[blockId]

	if (textures) {
		for (const texture of textures) {
			excludes.add(texture);
		}
	}
}

function buildExcludes(colorBlocks, blockTextures) {
	const excludes = new Set();

	excludes.add("water_overlay");

	// destroy stages
	for (let i = 0; i <= 9; i++) {
		excludes.add(`destroy_stage_${i}`);
	}

	excludes.add("debug");
	excludes.add("debug2");

	return excludes;
}

function buildBlockIdMap(blockTextures) {
	const blockIdMap = {};

	for (const blockId of Object.keys(blockTextures)) {
		for (const textureName of blockTextures[blockId]) {
			let blockIds = blockIdMap[textureName];

			if (!blockIds) {
				blockIds = [];
				blockIdMap[textureName] = blockIds;
			}

			blockIds.push(blockId);
		}
	}

	return blockIdMap;
}

async function loadPng(filename) {
		return new Promise((resolve, reject) => {
			fs.createReadStream(filename)
				.pipe(
					new PNG({
						filterType: 4,
					})
					)
				.on("parsed", function () {
					resolve(this);
				})
				.on("error", (err) => {
					reject(err);
				})
		});
}

async function savePng(texture, filename) {
	return new Promise((resolve, reject) => {
		const writeStream = fs.createWriteStream(filename);

		texture.pack().pipe(writeStream);

		writeStream.on('close', () => {
			resolve();
		})

		writeStream.on('error', (err) => {
			reject(err);
		})
	});
}


/**
 * @typedef {Object} PaletteEntry
 * @property {RGBColor} rgb The RGB value of the color
 * @property {LabColor} lab The Lab value of the color
 * @property {XYZColor} xyz The XYZ value of the color
 */

/**
 * Build a palette entry
 * @param  {Color} color The color of the entry.
 * @return {PaletteEntry | null}     The palette entry.
 */
function buildPaletteEntry(color) {
	if (color) {	
		const xyz = color.toXYZColor();

		return {
			rgb: color.toRGBColor(),
			lab: xyz.toLabColor(),
			xyz,
		}
	} else {
		return null;
	}
}

/**
 * @typedef {Object} ColorLabel
 * @property {string} name The text of the label
 * @property {RGBColor} rgb The RGB color of the label
 * @property {LabColor} lab The Lab color of the label
 * @property {LabColor} pos The position of the label in Lab space.
 */

/**
 * Build a label to display in the UI
 * @param  {string} name  The text of the label
 * @param  {Color} color The color of the label
 * @param  {BoundingBox} bounds The bounding box of the colors to position the labels outside of.
 * @return {ColorLabel}       [description]
 */
function buildLabel(name, color, bounds) {
	const labColor = color.toLabColor();
	const center = bounds.centroid();
	let axisL = center.l - labColor.l;
	let axisA = center.a - labColor.a;
	let axisB = center.b - labColor.b;
	const magnitude = Math.sqrt(axisL * axisL + axisA * axisA + axisB * axisB);

	axisL /= magnitude;
	axisA /= magnitude;
	axisB /= magnitude;

	return {
		name,
		rgb: color.toRGBColor(), 
		lab: labColor,

		// Move the label outside of the bounds so that it is legible.
		pos: new LabColor(
			labColor.l + (axisL * -3),
			labColor.a + (axisA * -3),
			labColor.b + (axisB * -3)
		)
	};
}

function writeBlockSet(version, blocks, path, filter) {
	const jsonOutput = fs.createWriteStream(path);

	if (filter) {
		blocks = blocks.filter(filter);
	}

	jsonOutput.write(JSON.stringify({
		minecraft_version: version,
		labels,
		blocks,
	}, null, '    '));

	jsonOutput.close();
}

/**
 * Write the blocks to a GIMP palette file.
 *
 * @param  {string} name   The name of the palette.
 * @param  {import('shared/src/block').Block[]} blocks The blocks
 * @param  {string} path   The path to write the file to.
 * @param  {() => boolean} [filter] A function to filter the blocks by.
 */
function writeGimpPalette(name, blocks, path, filter) {
	const gplOut = fs.createWriteStream(path);

	if (filter) {
		blocks = blocks.filter(filter);
	}

	function palComponent(n) {
		return Math.round(n).toString().padStart(3, ' ')
	}

	gplOut.write('GIMP Palette\n');
	gplOut.write('Name: ' + name + '\n');
	gplOut.write('Columns: 16\n');
	gplOut.write('#\n');

	for (const block of blocks) {
		const rgb = block.palette.average.rgb;
		gplOut.write(`${ palComponent(rgb.r) } ${ palComponent(rgb.g) } ${ palComponent(rgb.b) }\t${ block.name }\n`)
	}

	gplOut.close();
}

//
// Primaries
// 

const black = RGBColor.fromInteger(0x000000);
const white = RGBColor.fromInteger(0xFFFFFF);

const red = RGBColor.fromInteger(0xFF0000);
const yellow = RGBColor.fromInteger(0xFFFF00);

const green = RGBColor.fromInteger(0x00FF00);
const cyan = RGBColor.fromInteger(0x00FFFF);

const blue = RGBColor.fromInteger(0x0000FF);
const magenta = RGBColor.fromInteger(0xFF00FF);

const bounds = new BoundingBox();

bounds.add(black);
bounds.add(white);
bounds.add(red);
bounds.add(yellow);
bounds.add(green);
bounds.add(cyan);
bounds.add(blue);
bounds.add(magenta);

const EXIT_CODE_NO_JAR = 1;

const dirPath = `./jars/${ MC_VERSION }/assets/minecraft/textures/block/`;
const extractPath = `./web/data/${ MC_VERSION }/`;
const extractedTexturesPath = path.join(extractPath, 'textures');
const json = [];
const labels = [
	buildLabel('R', red, bounds),
	buildLabel('G', green, bounds),
	buildLabel('B', blue, bounds),
	buildLabel('C', cyan, bounds),
	buildLabel('M', magenta, bounds),
	buildLabel('Y', yellow, bounds),
	buildLabel('K', black, bounds),
	buildLabel('W', white, bounds)
];
const excludes = buildExcludes(colorBlocks, blockTextures);
const averageExtractor = new BasicColorExtractor();
const quantizerExtractor = new QuantizerColorExtractor();
const saturatedExtractor = new SaturatedColorExtractor();
const tintMap = buildTintMap(colorBlocks, blockTextures);

const blockIdMap = buildBlockIdMap(blockTextures);

await fs.promises.mkdir(extractPath, {
	recursive: true
});

await fs.promises.mkdir(extractedTexturesPath, {
	recursive: true
});

//
// Build the block data
//

if (!fs.existsSync(dirPath)) {
	console.error(`ERROR: Could not find the unpacked JAR file, make sure you've run the loader for Minecraft version ${ MC_VERSION }`);
	process.exit(EXIT_CODE_NO_JAR)
}

for await (const filename of walk(dirPath)) {
	const name = path.basename(filename, '.png');

	if (excludes.has(name)) {
		continue;
	}

	// console.log(name);

	const mcmetaName = filename + '.mcmeta';

	const file = await loadPng(filename);
	const destName = path.join(extractedTexturesPath, name + '.png');
	let copyTask;

	if (name in tintMap) {
		tintTexture(file, tintMap[name]);

		// Write texture instead of copying it now that we've tinted it.
		copyTask = savePng(file, destName);
	} else {
		// copy texture
		copyTask = fs.promises.copyFile(filename, destName);
	}

	const [, averagePalette, quantizerPalette, saturatedPalette] = await Promise.all([
		copyTask,
		averageExtractor.extract(filename, file),
		quantizerExtractor.extract(filename, file),
		saturatedExtractor.extract(filename, file),
	]);
	const palette = Object.assign(averagePalette, quantizerPalette, saturatedPalette);
	const hasMcmeta = fs.existsSync(mcmetaName);

	if (hasMcmeta) {
		const mcmeta = await fs.promises.readFile(mcmetaName);
		const animation = Animation.fromMcmeta(JSON.parse(mcmeta.toString()), name, `./textures`, file.width, file.height);

		createAnimatedTexture(animation, file, path.join(extractedTexturesPath, name + '.webp'))
	}

	if (palette.average) {
		json.push({
			name,
			animated: hasMcmeta,
			blockIds: blockIdMap[name],
			tags: textureTags[name] ?? null,
			palette: {
				average: buildPaletteEntry(palette.average),
				mostCommon: buildPaletteEntry(palette.mostCommon),
				mostSaturated: buildPaletteEntry(palette.mostSaturated),
			}
		});

	} else {
		console.log('No color:', filename);
	}
}

const gradientBlocksFilter = (block) => {
	return block?.tags && block.tags.includes('model:block') && block.tags.includes('direction:any')
		&& !block.tags.includes('unobtainable') && !block.tags.includes('transparent')
		&& !block.tags.includes('ore') && !block.tags.includes('redstone') && !block.tags.includes('block-entity');
};

const NON_BUILDING_BLOCKS = new Set([
	// Exclude the grass block because it uses overlays that the current tinting
	// algorithm doesn't really know how to handle
	"grass_block",

	"jigsaw",
	"structure_block",
	"redstone_wire",
	"repeating_command_block",
	"chain_command_block",
	"command_block",
]);

const nonBuildingBlocksFilter = (block) => {
	return !block?.blockIds || block.blockIds.filter(blockId => NON_BUILDING_BLOCKS.has(blockId)).length === 0;
}

writeBlockSet(MC_VERSION, json, path.join(extractPath, `all-blocks.json`));
writeBlockSet(MC_VERSION, json, path.join(extractPath, `blocks.json`), nonBuildingBlocksFilter);
writeBlockSet(MC_VERSION, json, path.join(extractPath, `gradient-blocks.json`), (blockId) => {
	return gradientBlocksFilter(blockId) && nonBuildingBlocksFilter(blockId);
});

writeGimpPalette(`Minecraft v${ MC_VERSION } Blocks - Average`, json, path.join(extractPath, 'blocks.gpl'));
writeGimpPalette(`Minecraft v${ MC_VERSION } Gradient Blocks - Average`, json, path.join(extractPath, 'gradient-blocks.gpl'), gradientBlocksFilter);


// Build the bounds geometry.

function drawLine(start, end, steps) {
	if (!steps) {
		throw new Error('steps is a required parameter.');
	}

	const points = new Array(steps + 1);
	const step = {
		r: (end.r - start.r) / steps,
		g: (end.g - start.g) / steps,
		b: (end.b - start.b) / steps
	};

	for (let i = 0; i <= steps; i++) {
		const rgb = new RGBColor(
			start.r + (step.r * i),
			start.g + (step.g * i),
			start.b + (step.b * i),
		);
		const xyz = rgb.toXYZColor();
		const lab = xyz.toLabColor();

		points[i] = [
			lab.a,
			lab.l,
			lab.b
		];
	}

	return points;
}

const objFile = new OBJFile();
const STEPS = 32;

// Front Face

objFile.line(drawLine(black, red, STEPS));
objFile.line(drawLine(red, yellow, STEPS));
objFile.line(drawLine(yellow, green, STEPS));
objFile.line(drawLine(green, black, STEPS));

// Back Face

objFile.line(drawLine(blue, magenta, STEPS));
objFile.line(drawLine(magenta, white, STEPS));
objFile.line(drawLine(white, cyan, STEPS));
objFile.line(drawLine(cyan, blue, STEPS));

// Side Faces

objFile.line(drawLine(black, blue, STEPS));
objFile.line(drawLine(red, magenta, STEPS));
objFile.line(drawLine(yellow, white, STEPS));
objFile.line(drawLine(green, cyan, STEPS));


const objOutput = fs.createWriteStream(path.join(extractPath, `bounds.obj`));

objOutput.write(objFile.toString());
objOutput.close();


