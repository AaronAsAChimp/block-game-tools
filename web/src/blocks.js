import { DATA_DIR } from './consts.js';


/**
 * @typedef {Object} BlockMatch
 * @property {number} magnitude How close is the match, the distance squared.
 * @property {import('shared/src/block.js').Block} block The matched block
 */


/**
 * Load a set of blocks from the server.
 *
 * @param  {string} blockSet The name of the set of blocks to load
 *
 * @return {Promise<import('./server.d.ts').BlocksResponse>} The blocks loaded from the server
 */
export async function loadBlocks(blockSet) {
	const res = await fetch(`${ DATA_DIR }${ blockSet }.json`);

	// Doing it this way will assert that its actually JSON.
	return await res.json();
}

function distanceSquared(pos1, pos2) {
	const delta = {
		l: pos2.l - pos1.l,
		a: pos2.a - pos1.a,
		b: pos2.b - pos1.b
	};

	return (delta.l * delta.l) +
		(delta.a * delta.a) +
		(delta.b * delta.b);
}


/**
 * Finds blocks that are close in color to the supplied block.
 *
 * @param {import('shared/src/block.js').Block} block The block to search for.
 * @param {import('shared/src/block.js').Block[]} blocks The blocks to search.
 * @param {string} paletteEntry The palette name
 * @param {number} radius the color to find in `blocks`
 * @returns {BlockMatch[]}
 */
export function findNear(block, blocks, paletteEntry, radius) {
	const radiusSquared = radius * radius;
	const pos = block.palette[paletteEntry].lab;
	const near = [];

	for (const candidate of blocks) { 
		const color = candidate.palette[paletteEntry];

		if (color !== null) {
			const dist = distanceSquared(pos, color.lab);

			if (dist < radiusSquared) {
				near.push({
					magnitude: dist,
					block: candidate
				});
			}
		}
	}

	near.sort((a, b) => {
		return a.magnitude - b.magnitude;
	});

	return near;
}

/**
 * Like findNear but finds the one block that is the closest or null if there
 * are none.
 *
 * @param {import('shared/src/block.js').Block[]} blocks The blocks to search.
 * @param {string} paletteEntry The palette name
 * @param {import('shared/src/color.js').LabColor} pos the color to find in `blocks`
 * @returns {import('shared/src/block.js').Block}
 */
export function findNearest(blocks, paletteEntry, pos) {
	let nearest = null;
	let nearestDistanceSquared = Infinity;

	for (const block of blocks) { 
		const color = block.palette[paletteEntry];

		if (color !== null) {
			const dist = distanceSquared(pos, color.lab);

			if (dist < nearestDistanceSquared) {
				nearest = block;
				nearestDistanceSquared = dist;
			}
		}
	}

	return nearest;
}


export class BlockLookup {
	/** @type {{[key: string]: BlockMatch[]}} The blocks organized for fast look up based on RGB */
	#cache = {};

	/** @type {import('shared/src/block.js').Block[]} The unprocessed blocks */
	#blocks = [];

	/**
	 * Construct a new BlockLookup
	 *
	 * @param  {import('shared/src/block.js').Block[]} blocks The initial set of blocks.
	 */
	constructor(blocks) {
		if (blocks.length === 0) {
			throw new Error('The provided blocks array is empty.');
		}

		this.#blocks = blocks;
	}

	/**
	 * Find a block in the lookup, uncached
	 *
	 * @param  {import('shared').Color} color   The color to look up
	 * @param  {string} palette The palette to use
	 *
	 * @return {BlockMatch}
	 */
	#findBlock(color, palette) {
		const lab = color.toLabColor();
		const block = findNearest(this.#blocks, palette, lab);

		return {
			magnitude: distanceSquared(lab, block.palette[palette].lab),
			block,
		}
	}

	/**
	 * Find the closest block for the given color.
	 * @param  {import('shared').Color} color The color.
	 * @param  {string} palette The palette for the chosen block.
	 * @return {BlockMatch}       The block.
	 */
	find(color, palette) {
		const rgb = color.toRGBColor();
		const colorInt = rgb.toInteger();

		if (!this.#cache[palette]) {
			this.#cache[palette] = [];
		}

		let block = this.#cache[palette][colorInt];

		if (!block) {
			block = this.#findBlock(color, palette);
			this.#cache[palette][colorInt] = block;
		}

		return block;
	}

	/**
	 * Get all of the colors for the given palette.
	 * @param  {string} palette The palette.
	 * @return {import('shared').Color[]}  The colors
	 */
	getPaletteColors(palette) {
		return this.#blocks.map(block => block.palette[palette]);
	}
}
