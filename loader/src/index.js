import got from 'got';
import fs, { read } from 'fs';
import path from 'path';
import sanitize from 'sanitize-filename';
import Zip from 'adm-zip';
import {MC_VERSION} from 'shared';

const VERSION_MANIFEST_ENDPOINT = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';

/**
 * @typedef {'release' | 'snapshot' | 'old_alpha' | 'old_beta'} MinecraftVersionType
 */

/**
 * @typedef {Object} MinecraftVersion
 * @property {string} id  The version number of this version of Minecraft.
 * @property {MinecraftVersionType} type  The type of version.
 * @property {string} url  The URL to download the detailed metadata.
 * @property {string} time The... time...?
 * @property {string} releaseTime  The time that this version was released.
 * @property {string} sha1  The SHA1 checksum of the release.
 * @property {number} complianceLevel The... compliance... level?
 */

class MinecraftManifest {
	#manifest;

	async getManifest() {
		if (!this.#manifest) {
			this.#manifest = await got.get(VERSION_MANIFEST_ENDPOINT).json();
		}

		return this.#manifest;
	}

	async getReleases() {
		let manifest = await this.getManifest();

		return manifest.versions
			.filter(version => {
				return version.type === 'release';
			});
	}

	/**
	 * Get the specific version.
	 * @param  {Set<string>} versions A set of versions to get.
	 * @return {Promise<MinecraftVersion[]>}     The version metadata.
	 */
	async getSpecificVersions(versions) {
		let manifest = await this.getManifest();

		return manifest.versions
			.filter(version => {
				return versions.has(version.id);
			});
	}
}


/**
 * @typedef {Object} VersionDownload
 * @property {string} sha1 The SHA1 hash of the file
 * @property {number} size The size of the file in bytes
 * @property {string} url  The URL of the file
 */

/**
 * @typedef {Object} VersionManifestJson
 * @property {{[name: string]: VersionDownload}} downloads The downloads for this version.
 */



class VersionManifest {
	/**
	 * @type {VersionManifestJson}
	 */
	#manifest;

	/**
	 * Download the client JAR to the specified directory.
	 * @param  {string} dest     The destination directory
	 * @return {Promise<void>}   A promise that resolves once the file has
	 *                           been downloaded.
	 */
	async downloadClient(dest) {
		return new Promise((resolve, reject) => {
			const readable = got.stream(this.#manifest.downloads.client.url);
			const writable = fs.createWriteStream(path.join(dest, 'minecraft.jar'));

			readable.pipe(writable);

			readable.on('error', (err) => {
				reject(err);
			})

			writable.on('error', (err) => {
				reject(err);
			});

			writable.on('close', () => {
				resolve();
			})
		});
	}

	/**
	 * Load the version manifest.
	 * @param  {MinecraftVersion} version The description of the version from the global manifest.
	 * @return {Promise<VersionManifest>} The manifest for this version.
	 */
	static async loadManifest(version) {
		const json = await got.get(version.url).json();
		const manifest = new VersionManifest();

		manifest.#manifest = json;

		return manifest;
	}
}

const manifest = new MinecraftManifest();
const versions = new Set([MC_VERSION]);
const releases = await manifest.getSpecificVersions(versions);
const root = './jars';

for (const release of releases) {
	console.log(`- v${ release.id } - ${release.url}`);
	const manifest = await VersionManifest.loadManifest(release);
	const jarFolder = path.join(root, sanitize(release.id));

	await fs.promises.mkdir(jarFolder, {
		recursive: true
	});

	await manifest.downloadClient(jarFolder);

	const jarFile = path.join(jarFolder, 'minecraft.jar');
	const zip = new Zip(jarFile);

	// zip.extractEntryTo('assets/minecraft/textures/', jarFolder, false, true);
	
	for (const entry of zip.getEntries()) {
		if (entry.entryName.startsWith('assets/minecraft/textures/block/')) {
			zip.extractEntryTo(entry, jarFolder);
		}
	}
}
