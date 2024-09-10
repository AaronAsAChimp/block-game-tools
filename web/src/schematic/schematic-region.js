import nbt from 'prismarine-nbt';
import { SchematicPosition } from './schematic-primitives.js';
import { emptyList } from './nbt.js';

/**
 * Pack the list of block states.
 * @param  {number[]} states    The states as an array of numbers.
 * @param  {number} paletteSize The size of the palette.
 * @return {bigint[]}           The block states packed into a bigint array.
 */
function packBlockStates(states, paletteSize) {
	const bitLength = Math.max(2, 32 - Math.clz32(paletteSize - 1));
	const arraySize = Math.ceil(bitLength * (states.length / 64));

	/** @type {bigint[]} */
	const packed = new Array(arraySize);

	packed.fill(0n);

	for (let index = 0; index < states.length; index++)  {
		const value = BigInt(states[index]);

		const startOffset = index * bitLength;
		const startArrIndex = Math.floor(startOffset / 64);
		const endArrIndex = Math.floor(((startOffset + bitLength) - 1) / 64);
		const startBitOffset = startOffset % 64;

		packed[startArrIndex] = BigInt.asIntN(64, packed[startArrIndex] | (value << BigInt(startBitOffset)));

		if (startArrIndex !== endArrIndex) {
			const endOffset = 64 - startBitOffset;
			packed[endArrIndex] = BigInt.asIntN(64, packed[endArrIndex] << BigInt(bitLength - endOffset) | value >> BigInt(endOffset));
		}
	}

	return packed;
}

export class SchematicRegion {
	/** @type {{name: string, properties: any}[]} */
	#palette;

	/** @type {number[]} */
	#states;

	/**
	 * The position of the bounding box.
	 *
	 * @type {SchematicPosition}
	 */
	#position;

	/**
	 * The dimensions of the bounding box.
	 * 
	 * @type {SchematicPosition}
	 */
	#bounds;

	/**
	 * Construct a new SchematicRegion
	 *
	 * @param  {BasicPosition} position The position of the region.
	 * @param  {SchematicCuboid} bounds   The bounds of the region.
	 */
	constructor(position, bounds) {
		this.#position = new SchematicPosition(position.x, position.y, position.z);
		this.#bounds = new SchematicPosition(bounds.x, bounds.y, bounds.z);
		this.#states = new Array(bounds.x * bounds.y * bounds.z);

		this.#palette = [
			{
				name: 'minecraft:air',
				properties: {}
			}
		];
	}

	#jsonToNbt(json) {
		const nbtEntry = {};

		for (let key in json) {
			let value = null;

			switch (typeof json[key]) {
				case 'string':
					value = nbt.string(json[key]);
					break;
				default:
					throw new Error('Unknown type');
			}

			nbtEntry[key] = value;
		}

		return nbt.comp(nbtEntry);
	}

	#buildPalette() {
		const palette = [];

		for (let i = 0; i < this.#palette.length; i++) {
			const entry = this.#palette[i];
			const nbtEntry = {
				Name: nbt.string(this.#palette[i].name),
			};

			if (entry.properties && Object.keys(entry.properties).length) {
				nbtEntry.Properties = this.#jsonToNbt(this.#palette[i].properties);
			}

			palette[i] = nbtEntry;
		}

		return nbt.list(nbt.comp(palette));
	}

	#buildStates() {
		return nbt.longArray(packBlockStates(this.#states, this.#palette.length));
		// return nbt.longArray(packBlockStates([1, 1], this.#palette.length));
	}

	/**
	 * Check that the position exists in the bounds in this region
	 * @param  {SchematicPosition} position The position to check
	 * @return {boolean}          True if the position is within bounds.
	 */
	#isPositionInBounds(position) {
		const xPos = position.x - this.#position.x
		const yPos = position.y - this.#position.y;
		const zPos = position.z - this.#position.z;

		if (xPos < 0 || xPos >= this.#bounds.x) {
			return false;
		}

		if (yPos < 0 || yPos >= this.#bounds.y) {
			return false;
		}

		if (zPos < 0 || zPos >= this.#bounds.z) {
			return false;
		}

		return true;
	}


	/**
	 * Calculate the index offset in the states buffer
	 * @param  {SchematicPosition} position The position to convert	
	 * @return {number}          The index
	 */
	#positionToOffset(position) {
		const xPos = position.x - this.#position.x
		const yPos = position.y - this.#position.y;
		const zPos = position.z - this.#position.z;

		const size = this.#bounds.x * this.#bounds.z;

		// return (xPos + (yPos * this.#bounds.x)) + (zPos * this.#bounds.x * this.#bounds.y);
		return (yPos * size) + (zPos * this.#bounds.x) + xPos;
	}

	setBlock(name, properties, position) {
		let blockIdx = null;

		if (!this.#isPositionInBounds(position)) {
			throw new RangeError("Position must be within the bounds of this position.");
		}

		for (let i = 0; i < this.#palette.length; i++) {
			const block = this.#palette[i];

			if (name === block.name) {
				let isDifferent = false;

				for (const key in properties) {
					if (properties[key] !== block.properties[key]) {
						isDifferent = true;

						break;
					}
				}

				if (!isDifferent) {
					blockIdx = i;
					break;
				}
			}
		}

		if (blockIdx === null) {
			blockIdx = this.#palette.length;

			this.#palette.push({
				name,
				properties
			});
		}

		this.#states[this.#positionToOffset(position)] = blockIdx;
	}

	/**
	 * Convert this to NBT
	 * @return {import('prismarine-nbt').NBT}
	 */
	toNbt() {
		return nbt.comp({
			BlockStatePalette: this.#buildPalette(),
			BlockStates: this.#buildStates(),
			Entities: emptyList(),
			PendingBlockTicks: emptyList(),
			PendingFluidTicks: emptyList(),
			Position: this.#position.toNbt(),
			Size: this.#bounds.toNbt(),
			TileEntities: emptyList()
		});
	}


	/**
	 * Get a bounding cuboid for the given regions.
	 * @param  {SchematicRegion[]} regions The regions.
	 * @return {SchematicCuboid}           The bounding cuboid
	 */
	static getBoundsForRegions(regions) {
		if (!regions.length) {
			return {
				x: 0,
				y: 0,
				z: 0
			};
		}

		const mins = {
			x: Infinity,
			y: Infinity,
			z: Infinity
		};

		const maxs = {
			x: -Infinity,
			y: -Infinity,
			z: -Infinity
		};

		for (const region of regions) {
			const pos = region.#position;
			const bounds = region.#bounds;

			if (mins.x > pos.x) {
				mins.x = pos.x;
			}

			if (mins.y > pos.y) {
				mins.y = pos.y;
			}

			if (mins.z > pos.z) {
				mins.z = pos.z;
			}

			if (maxs.x < pos.x + bounds.x) {
				maxs.x = pos.x + bounds.x;
			}

			if (maxs.y < pos.y + bounds.y) {
				maxs.y = pos.y + bounds.y;
			}

			if (maxs.z < pos.z + bounds.z) {
				maxs.z = pos.z + bounds.z;
			}
		}

		return {
			x: maxs.x - mins.x,
			y: maxs.y - mins.y,
			z: maxs.z - mins.z
		};
	}
}
