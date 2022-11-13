import fs from "fs";
import path from 'path';
import blockTextures from '../data/block-textures.json' assert {type: "json"};
import colorBlocks from '../data/color-blocks.json' assert {type: "json"};
import {PNG} from 'pngjs';

import {Animation} from './animation.js';
import {BasicColorExtractor, VibrantJsColorExtractor, QuantizerColorExtractor} from './color-extractor.js';
import {OBJFile} from './objfile.js';

/**
 * @typedef {{[blockId: string]: string[] }} TextureMap
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


// from https://gist.github.com/mnito/da28c930d270f280f0989b9a707d71b5
function srgb_to_xyz(srgb) {
	var sxm = [
		[0.4124000, 0.3576000, 0.1805000],
		[0.2126000, 0.7152000, 0.0722000],
		[0.0193000, 0.1192000, 0.9505000]
		];

	var inverted_transfer = function (c) {
		if(c <= 0.04045) {
			return c / 12.92;
		} else {
			return Math.pow((c + 0.055)/1.055, 2.4);
		}
	};

	var rLinear = inverted_transfer(srgb.r / 255);
	var gLinear = inverted_transfer(srgb.g / 255);
	var bLinear = inverted_transfer(srgb.b / 255);

	var xyz = { };
	xyz.x = rLinear * sxm[0][0] + gLinear * sxm[0][1] + bLinear * sxm[0][2];
	xyz.y = rLinear * sxm[1][0] + gLinear * sxm[1][1] + bLinear * sxm[1][2];
	xyz.z = rLinear * sxm[2][0] + gLinear * sxm[2][1] + bLinear * sxm[2][2];

	return xyz;
}

/**
 * Converts CIE 1931 XYZ colors to CIE L*a*b*.
 * The conversion formula comes from <http://www.easyrgb.com/en/math.php>.
 * https://github.com/cangoektas/xyz-to-lab/blob/master/src/index.js
 * @param   {number[]} color The CIE 1931 XYZ color to convert which refers to
 *                           the D65/2° standard illuminant.
 * @returns {number[]}       The color in the CIE L*a*b* color space.
 */
// X, Y, Z of a "D65" light source.
// "D65" is a standard 6500K Daylight light source.
// https://en.wikipedia.org/wiki/Illuminant_D65
const D65 = [95.047, 100, 108.883]
export function xyzToLab({x, y, z}) {
  [x, y, z] = [x, y, z].map((v, i) => {
    v = v / D65[i]
    return v > 0.008856 ? Math.pow(v, 1 / 3) : v * 7.787 + 16 / 116
  })

  return {
  	l: 116 * y - 16,
  	a: 500 * (x - y),
  	b: 200 * (y - z)
  };
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

	// For now just exclude all colored blocks.
	for (const key of Object.keys(colorBlocks)) {
		for (const blockId of colorBlocks[key]) {
			addBlockExcludes(blockId, blockTextures, excludes);
		}
	}

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

function buildPaletteEntry(color) {
	if (color) {	
		const xyz = srgb_to_xyz(color);

		return {
			rgb: color,
			lab: xyzToLab(xyz)
		}
	} else {
		return null;
	}
}

const version = '1.19';
const dirPath = `./jars/${ version }/minecraft-${ version }-client/assets/minecraft/textures/block/`;
const extractPath = `./web/data/${ version }/`;
const extractedTexturesPath = path.join(extractPath, 'textures');
const json = [];
const excludes = buildExcludes(colorBlocks, blockTextures);
const averageExtractor = new BasicColorExtractor();
const vibrantExtractor = new VibrantJsColorExtractor();
const quantizerExtractor = new QuantizerColorExtractor();
const animationCssFile = fs.createWriteStream(path.join(extractPath, `texture-animations.css`));


await fs.promises.mkdir(extractPath, {
	recursive: true
});

await fs.promises.mkdir(extractedTexturesPath, {
	recursive: true
});


for await (const filename of walk(dirPath)) {
	const name = path.basename(filename, '.png');

	if (excludes.has(name)) {
		continue;
	}

	const mcmetaName = filename + '.mcmeta';

	const file = await loadPng(filename);

	const [, averagePalette, vibrantPalette, quantizerPalette] = await Promise.all([
		fs.promises.copyFile(filename, path.join(extractedTexturesPath, name + '.png')),
		averageExtractor.extract(filename, file),
		vibrantExtractor.extract(filename, file),
		quantizerExtractor.extract(filename, file),
	]);
	const palette = Object.assign(averagePalette, vibrantPalette, quantizerPalette);
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
			}
		});

	} else {
		console.log(filename);
	}
}

const jsonOutput = fs.createWriteStream(path.join(extractPath, `blocks.json`));

jsonOutput.write(JSON.stringify({
	minecraft_version: version,
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
		const rgb = {
			r: start.r + (step.r * i),
			g: start.g + (step.g * i),
			b: start.b + (step.b * i),
		};
		const xyz = srgb_to_xyz(rgb);
		const lab = xyzToLab(xyz);

		points[i] = [
			lab.a,
			lab.l,
			lab.b
		];
	}

	return points;
}

const objFile = new OBJFile();
const STEPS = 16;

const bottom = {
	r: 0,
	g: 0,
	b: 0
};

const top = {
	r: 255,
	g: 255,
	b: 255,
}

const red = {
	r: 255,
	g: 0,
	b: 0
};

const yellow = {
	r: 255,
	g: 255,
	b: 0
};

const green = {
	r: 0,
	g: 255,
	b: 0
};

const cyan = {
	r: 0,
	g: 255,
	b: 255
};

const blue = {
	r: 0,
	g: 0,
	b: 255
};

const magenta = {
	r: 255,
	g: 0,
	b: 255
};

// Front Face

objFile.line(drawLine(bottom, red, STEPS));
objFile.line(drawLine(red, yellow, STEPS));
objFile.line(drawLine(yellow, green, STEPS));
objFile.line(drawLine(green, bottom, STEPS));

// Back Face

objFile.line(drawLine(blue, magenta, STEPS));
objFile.line(drawLine(magenta, top, STEPS));
objFile.line(drawLine(top, cyan, STEPS));
objFile.line(drawLine(cyan, blue, STEPS));

// Side Faces

objFile.line(drawLine(bottom, blue, STEPS));
objFile.line(drawLine(red, magenta, STEPS));
objFile.line(drawLine(yellow, top, STEPS));
objFile.line(drawLine(green, cyan, STEPS));


const objOutput = fs.createWriteStream(path.join(extractPath, `bounds.obj`));

objOutput.write(objFile.toString());
objOutput.close();


