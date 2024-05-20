import nbt from 'prismarine-nbt';

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
		return nbt.comp({
			x: nbt.int(this.x),
			y: nbt.int(this.y),
			z: nbt.int(this.z)
		});
	}
}