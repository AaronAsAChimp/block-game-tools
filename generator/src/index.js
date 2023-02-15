import fs from "fs";
import path from 'path';
import {PNG} from 'pngjs';

import blockTextures from '../data/block-textures.json' assert {type: "json"};
import colorBlocks from '../data/color-blocks.json' assert {type: "json"};

import {Animation} from './animation.js';
import {BasicColorExtractor, SaturatedColorExtractor, QuantizerColorExtractor} from './color-extractor.js';
import {OBJFile} from './objfile.js';
import {RGBColor, LabColor, XYZColor, Color} from "./color.js";
import {buildTintMap, tintTexture} from './color-shift.js';

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

	// Exclude the grass block because it uses overlays that the current tinting
	// algorithm doesn't really know how to handle
	addBlockExcludes("grass_block", blockTextures, excludes);

	excludes.add("water_overlay");

	// destroy stages
	for (let i = 0; i <= 9; i++) {
		excludes.add(`destroy_stage_${i}`);
	}

	excludes.add("debug");
	excludes.add("debug2");

	addBlockExcludes("jigsaw", blockTextures, excludes);
	addBlockExcludes("structure_block", blockTextures, excludes);
	addBlockExcludes("redstone_wire", blockTextures, excludes);
	addBlockExcludes("repeating_command_block", blockTextures, excludes);
	addBlockExcludes("chain_command_block", blockTextures, excludes);
	addBlockExcludes("command_block", blockTextures, excludes);

	return excludes;
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
 */

/**
 * Build a label to display in the UI
 * @param  {string} name  The text of the label
 * @param  {Color} color The color of the label
 * @return {ColorLabel}       [description]
 */
function buildLabel(name, color) {
	return {
			name,
			rgb: color.toRGBColor(), 
			lab: color.toLabColor()
	};
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
const magenta = RGBColor.fromInteger(0xFF00FF)


const version = '1.19';
const dirPath = `./jars/${ version }/assets/minecraft/textures/block/`;
const extractPath = `./web/data/${ version }/`;
const extractedTexturesPath = path.join(extractPath, 'textures');
const json = [];
const labels = [
	buildLabel('R', red),
	buildLabel('G', green),
	buildLabel('B', blue),
	buildLabel('C', cyan),
	buildLabel('M', magenta),
	buildLabel('Y', yellow),
	buildLabel('K', black),
	buildLabel('W', white)
];
const excludes = buildExcludes(colorBlocks, blockTextures);
const averageExtractor = new BasicColorExtractor();
const quantizerExtractor = new QuantizerColorExtractor();
const saturatedExtractor = new SaturatedColorExtractor();
const tintMap = buildTintMap(colorBlocks, blockTextures);

await fs.promises.mkdir(extractPath, {
	recursive: true
});

const animationCssFile = fs.createWriteStream(path.join(extractPath, `texture-animations.css`));

await fs.promises.mkdir(extractedTexturesPath, {
	recursive: true
});

//
// Build the block data
// 

console.log(tintMap);

for await (const filename of walk(dirPath)) {
	const name = path.basename(filename, '.png');

	if (excludes.has(name)) {
		continue;
	}

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
		const animation = Animation.fromMcmeta(JSON.parse(mcmeta), name, `./textures`, file.width, file.height);

		animationCssFile.write(animation.toCSS());
	}

	if (palette.average) {
		json.push({
			name,
			animated: hasMcmeta,
			palette: {
				average: buildPaletteEntry(palette.average),
				vibrant: buildPaletteEntry(palette.vibrant),
				mostCommon: buildPaletteEntry(palette.mostCommon),
				mostSaturated: buildPaletteEntry(palette.mostSaturated),
			}
		});

	} else {
		console.log(filename);
	}
}

const jsonOutput = fs.createWriteStream(path.join(extractPath, `blocks.json`));

jsonOutput.write(JSON.stringify({
	minecraft_version: version,
	labels,
	blocks: json
}, null, '    '));
jsonOutput.close();

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


