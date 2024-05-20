import nbt from 'prismarine-nbt';
import { MC_DATA_VERSION } from 'shared';
import { SchematicRegion } from './schematic-region.js';
import { streamToBlob } from './stream-to-blob.js';

const SCHEMATIC_VERSION = 6;
const SCHEMATIC_MINOR_VERSION = 1;

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
	 * @return {ReturnType<import('prismarine-nbt').comp>}
	 */
	#buildMetadataNbt(metadata) {
		if (!metadata) {
			return null;
		}

		const bounds = SchematicRegion.getBoundsForRegions(Object.values(this.#regions));

		return nbt.comp({
			Author: nbt.string(metadata.author),
			Description: nbt.string(metadata.description),
			EnclosingSize: this.#buildCuboid(bounds),
			Name: nbt.string(metadata.name),
			RegionCount: nbt.int(Object.keys(this.#regions).length),
			TimeCreated: this.#buildDate(metadata.timeCreated),
			TimeModified: this.#buildDate(metadata.timeModified),
			TotalBlocks: nbt.int(bounds.x * bounds.y * bounds.z),
			TotalVolume: nbt.int(bounds.x * bounds.y * bounds.z)
		});
	}

	/**
	 * Turn a Date into NBT
	 * @param  {Date} date The date object
	 * @return {ReturnType<import('prismarine-nbt').long>}
	 */
	#buildDate(date) {
		return nbt.long(BigInt(Math.round(date.getTime() / 1000)));
	}

	/**
	 * Convert the metadata into NBT
	 * @param  {SchematicCuboid} enclosingSize The metadata to convert
	 * @return {ReturnType<import('prismarine-nbt').comp>}
	 */
	#buildCuboid(enclosingSize) {

		return nbt.comp({
			x: nbt.int(enclosingSize.x),
			y: nbt.int(enclosingSize.y),
			z: nbt.int(enclosingSize.z)
		})
	}

	#buildRegions(regions) {
		/** @type {Record<string, import('prismarine-nbt').NBT>} */
		const regionBuffers = {};

		for (const key in regions) {
			regionBuffers[key] = regions[key].toNbt();
		}

		const regionsNbt = nbt.comp(regionBuffers);

		// Schematics don't have a name property on the regions property, but
		// there is no way of doing this with prismarine-nbt.
		delete regionsNbt.name;

		return regionsNbt;
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
		const metadata = this.#buildMetadataNbt(this.#metadata);
		const schematic = {
			MinecraftDataVersion: nbt.int(this.#minecraft_version),
			Version: nbt.int(SCHEMATIC_VERSION),
			SubVersion: nbt.int(SCHEMATIC_MINOR_VERSION),
			Regions: this.#buildRegions(this.#regions),
		};

		if (metadata) {
			schematic.Metadata = this.#buildMetadataNbt(this.#metadata);
		}

		return nbt.comp(schematic, '');
	}

	/**
     * @param {LitematicaSchematic} schematic
     * @return {Blob}
     */
	static writeUncompressed(schematic) {
		return new Blob([nbt.writeUncompressed(schematic.toNbt())]);
	}

	/**
     * @param {LitematicaSchematic} schematic
     * @return {Promise<Blob>}
     */
	static async writeCompressed(schematic) {
		const blob = LitematicaSchematic.writeUncompressed(schematic);

		const gzip = blob.stream().pipeThrough(new CompressionStream('gzip'));

		return await streamToBlob(gzip);
	}
}