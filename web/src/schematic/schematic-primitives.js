import * as NBT from 'nbt-zero';

/** @type {import('nbt-zero').NBTSchema} */
export const POSITION_SCHEMA = {
	x: NBT.int,
	y: NBT.int,
	z: NBT.int
};

export class SchematicPosition {
	/** @type {number} */
	x;

	/** @type {number} */
	y;

	/** @type {number} */
	z;

	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	toNbt() {
		return {
			x: this.x,
			y: this.y,
			z: this.z
		};
	}
}