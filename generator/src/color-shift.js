import chalk from 'chalk';

import {RGBColor} from 'shared';

/**
 * These values were copied from the wiki at:
 * https://minecraft.fandom.com/wiki/Block_colors
 */
const BLOCK_COLORS = {
    // Hard code the color shift to be the forest biome. The forest biome is the
    // most common biome.
	'grass': RGBColor.fromInteger(0x79C05A),
	'foliage': RGBColor.fromInteger(0x59AE30),
	'water': RGBColor.fromInteger(0x3F76E4),

    // The color for the stem at growth stage 7, the stage it will stay
    // at indefinately
    'stem': RGBColor.fromInteger(0xE0C71C),

    // These colors don't change.
    'constant': {
        'birch_leaves': RGBColor.fromInteger(0x80A755),
        'spruce_leaves': RGBColor.fromInteger(0x619961),
        'lily_pad': RGBColor.fromInteger(0x619961),
        'attached_melon_stem': RGBColor.fromInteger(0xE0C71C),
        'attached_pumpkin_stem': RGBColor.fromInteger(0xE0C71C),
    }
};

export function buildTintMap(colorBlocks, blockTextures) {
    const tintMap = {};

    for (const key in colorBlocks) {
        for (const blockId of colorBlocks[key]) {
            console.log(blockId);
            if (blockId in blockTextures) {
                for (const texName of blockTextures[blockId]) {
                    if (key === 'constant') {
                        if (texName in BLOCK_COLORS.constant) {
                            tintMap[texName] = BLOCK_COLORS.constant[texName];
                        } else {
                            throw new Error(`Unknown tint color for "${ texName }"`)
                        }
                    } else if (key in BLOCK_COLORS) {
                        tintMap[texName] = BLOCK_COLORS[key];
                    } else {
                        throw new Error(`Unknown color block type "${ key }".`);
                    }
                }
            } else {
                throw new Error(`Unknown block ${blockId}, please add this block to block-textures.json`)
            }
        }
    }

    return tintMap;
}

export function tintTexture(texture, color) {
    const rgbColor = color.toRGBColor();

    const r = rgbColor.r / 255;
    const g = rgbColor.g / 255;
    const b = rgbColor.b / 255;

    for (let y = 0; y < texture.height; y++) {
        for (let x = 0; x < texture.width; x++) {
            const idx = (texture.width * y + x) << 2;

            texture.data[idx] = Math.round(texture.data[idx] * r);
            texture.data[idx + 1] = Math.round(texture.data[idx + 1] * g);
            texture.data[idx + 2] = Math.round(texture.data[idx + 2] * b);
        }
    }

    // printImage(texture);
}

export function printImage(texture) {
    let image = '';
    for (let y = 0; y < texture.height; y++) {
        for (let x = 0; x < texture.width; x++) {
            const idx = (texture.width * y + x) << 2;

            if (texture.data[idx + 3] > 0) {
                image += chalk.rgb(
                    texture.data[idx],
                    texture.data[idx + 1],
                    texture.data[idx + 2]
                )('\u2588\u2588');
            } else {
                image += '  ';
            }
        }

        image += '\n';
    }

    console.log(image);
}