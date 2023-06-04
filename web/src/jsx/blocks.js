
/**
 * @typedef {import('./server.d.ts').Block} Block
 */

import { Color } from 'shared/src/color.js';

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
	/** @type {{[key: string]: Block[]}} The blocks organized for fast look up based on RGB */
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

		return findNearest(this.#blocks, palette, lab);
	}

	/**
	 * Find the closest block for the given color.
	 * @param  {Color} color The color.
	 * @param  {string} palette The palette for the chose block.
	 * @return {Block}       The block.
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
}
