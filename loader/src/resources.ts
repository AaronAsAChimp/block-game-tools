import fs from 'fs';
import { Readable } from 'stream';
import { z } from 'zod';

import type { VersionManifestJson } from './versions.ts';
import { download, downloadJson } from './download.ts';

const AssetReferenceSchema = z.object({
	hash: z.string(),
	size: z.number()
});

export const AssetIndexJsonSchema = z.object({
	objects: z.record(z.string(), AssetReferenceSchema)
});

export type AssetIndexJson = z.infer<typeof AssetIndexJsonSchema>;

/**
 * Load the asset index referenced in the manifest.
 *
 * @param  {VersionManifestJson} manifest The manifest
 *
 * @return {Promise<AssetIndexJson>}  The asset index.
 */
export async function loadAssetIndex(manifest: VersionManifestJson): Promise<AssetIndexJson> {
	const json = await downloadJson(manifest.assetIndex.url, './cache');

	// console.log(json);

	return AssetIndexJsonSchema.parse(json);
}

/**
 * Download a resource to a folder
 *
 * @param  {string} hash The assets hash.
 * @param  {string} dest The destination folder
 *
 * @return {Promise<void>}
 */
export async function downloadResource(hash: string, dest: string): Promise<void> {
	await download(`https://resources.download.minecraft.net/${hash.slice(0, 2)}/${hash}`, './cache', dest);
}
