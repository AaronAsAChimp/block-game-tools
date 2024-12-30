import { MC_DATA_VERSION } from 'shared';
import { LITEMATICA_REGION_SCHEMA, SchematicRegion } from './schematic-region.js';
import { streamToUint8Array } from './stream-to-array.js';
import * as NBT from 'nbt-zero';


const SCHEMATIC_VERSION = 6;
const SCHEMATIC_MINOR_VERSION = 1;

/** @type {import('nbt-zero').NBTSchema} */
const LITEMATICA_SCHEMA = {
	MinecraftDataVersion: NBT.int,
	Regions: NBT.record(LITEMATICA_REGION_SCHEMA),
	SubVersion: NBT.int,
	Version: NBT.int,
	Metadata: {
		Author: NBT.string,
		Description: NBT.string,
		EnclosingSize: {
			x: NBT.int,
			y: NBT.int,
			z: NBT.int
		},
		Name: NBT.string,
		RegionCount: NBT.int,
		TimeCreated: NBT.long,
		TimeModified: NBT.long,
		TotalBlocks: NBT.int,
		TotalVolume: NBT.int
	}
};

export class LitematicaSchematic {
	#metadata;
	#regions;
	/** @type {number} */
	#minecraft_version;

	/**
	 * Construct a new LitematicaSchematic
	 * 
	 * @param  {SchematicMetadata} metadata The metadata for this schematic.
	 * @param  {number} minecraft_version The data version of Minecraft that this schematic is compatible with.
	 */
	constructor(metadata, minecraft_version=MC_DATA_VERSION) {
		this.#metadata = metadata;
		this.#regions = {};
		this.#minecraft_version = minecraft_version
	}

	/**
	 * Convert the metadata into NBT
	 * @param  {SchematicMetadata} metadata The metadata to convert
	 * @return {any}
	 */
	#buildMetadataNbt(metadata) {
		if (!metadata) {
			return null;
		}

		const bounds = SchematicRegion.getBoundsForRegions(Object.values(this.#regions));

		return {
			Author: metadata.author,
			Description: metadata.description,
			EnclosingSize: this.#buildCuboid(bounds),
			Name: metadata.name,
			RegionCount: Object.keys(this.#regions).length,
			TimeCreated: this.#buildDate(metadata.timeCreated),
			TimeModified: this.#buildDate(metadata.timeModified),
			TotalBlocks: bounds.x * bounds.y * bounds.z,
			TotalVolume: bounds.x * bounds.y * bounds.z
		};
	}

	/**
	 * Turn a Date into NBT
	 * @param  {Date} date The date object
	 * @return {bigint}
	 */
	#buildDate(date) {
		return BigInt(Math.round(date.getTime() / 1000));
	}

	/**
	 * Convert the metadata into NBT
	 * @param  {SchematicCuboid} enclosingSize The metadata to convert
	 * @return {BasicPosition}
	 */
	#buildCuboid(enclosingSize) {

		return {
			x: enclosingSize.x,
			y: enclosingSize.y,
			z: enclosingSize.z
		};
	}

	#buildRegions(regions) {
		const regionBuffers = {};

		for (const key in regions) {
			regionBuffers[key] = regions[key].toNbt();
		}

		// const regionsNbt = regionBuffers;

		// Schematics don't have a name property on the regions property, but
		// there is no way of doing this with prismarine-nbt.
		// delete regionsNbt.name;

		return regionBuffers;
	}

	/**
	 * Add a region to the schematic.
	 * 
	 * @param {string} name   The name of the region
	 * @param {SchematicRegion} region The region to add
	 */
	addRegion(name, region) {
		this.#regions[name] = region;
	}

	toNbt() {
		const schematic = {
			MinecraftDataVersion: this.#minecraft_version,
			Version: SCHEMATIC_VERSION,
			SubVersion: SCHEMATIC_MINOR_VERSION,
			Regions: this.#buildRegions(this.#regions),
		};

		if (this.#metadata) {
			schematic.Metadata = this.#buildMetadataNbt(this.#metadata);
		}

		return schematic;
	}

	/**
     * @param {LitematicaSchematic} schematic
     * @return {Uint8Array}
     */
	static writeUncompressed(schematic) {
		return NBT.bufferify(schematic.toNbt(), LITEMATICA_SCHEMA);
	}

	/**
     * @param {LitematicaSchematic} schematic
     * @return {Promise<Uint8Array>}
     */
	static async writeCompressed(schematic) {
		const buffer = LitematicaSchematic.writeUncompressed(schematic);

		const gzip = new Blob([buffer]).stream().pipeThrough(new CompressionStream('gzip'));

		return await streamToUint8Array(gzip);
	}
}