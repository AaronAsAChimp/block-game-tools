
/**
 * @typedef {import('shared/src/block').Block} Block
 */

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
					distSquared: dist,
					candidate
				});
			}
		}
	}

	near.sort((a, b) => {
		return a.distSquared - b.distSquared;
	});

	return near;
}

/**
 * Like findNear but finds the one block that is the closest or null if there
 * are none.
 *
 * @returns {Block}
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

/**
 * @typedef {Object} BlockMatch
 * @property {number} magnitude How close is the match
 * @property {Block} block The matched block
 */


export class BlockLookup {
	/** @type {{[key: string]: BlockMatch[]}} The blocks organized for fast look up based on RGB */
	#cache = {};

	/** @type {Block[]} The unprocessed blocks */
	#blocks = [];

	/**
	 * Construct a new BlockLookup
	 *
	 * @param  {Block[]} blocks The initial set of blocks.
	 */
	constructor(blocks) {
		this.#blocks = blocks;
	}

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
	 * @param  {import('shared/src/color').Color} color The color.
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
	 * @return {import('shared/src/color').Color[]}  The colors
	 */
	getPaletteColors(palette) {
		return this.#blocks.map(block => block.palette[palette]);
	}
}
