
/**
 * A size in a schematic in the x, y, and z axes.
 */
interface SchematicCuboid {
	x: number,
	y: number,
	z: number
}

/**
 * A position in a schematic
 */
interface BasicPosition {
	x: number,
	y: number,
	z: number
}


interface SchematicMetadata {
	author: string,
	description: string,
	name: string,
	timeCreated: Date,
	timeModified: Date
}