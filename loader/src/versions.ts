import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { z } from 'zod';

import type { MinecraftVersion } from './manifest.ts';

const EndpointReferenceSchema = z.object({
      sha1: z.string(),
      size: z.number(),
      url: z.string()
});


export const VersionManifestJsonSchema = z.object({
	/**
	 * The downloads for this version
	 */
	downloads: z.record(z.string(), EndpointReferenceSchema),

	/**
	 * The asset index for this version.
	 */
	assetIndex: EndpointReferenceSchema,
});

export type VersionManifestJson = z.infer<typeof VersionManifestJsonSchema>;


/**
 * Load the version manifest.
 * 
 * @param  {MinecraftVersion} version The description of the version from the global manifest.
 * @return {Promise<VersionManifestJson>} The manifest for this version.
 */
export async function loadVersionManifesta(version: MinecraftVersion): Promise<VersionManifestJson> {
	const res = await fetch(version.url);
	const manifest = await res.json();

	// console.log(manifest);

	return VersionManifestJsonSchema.parse(manifest);
}


/**
 * Download the client JAR to the specified directory.
 *
 * @param  {VersionManifestJson} manifest       The version manifest
 * @param  {string} dest     The destination directory
 * @return {Promise<void>}   A promise that resolves once the file has
 *                           been downloaded.
 */
export async function downloadClient(manifest: VersionManifestJson, dest: string): Promise<void> {
	const res = await fetch(manifest.downloads.client.url);

	await new Promise<void>((resolve, reject) => {
		const readable = Readable.fromWeb(res.body);
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

