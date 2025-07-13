import { z } from 'zod';

const VERSION_MANIFEST_ENDPOINT = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';


export const MinecraftVersionSchema = z.object({
	/**
	 * The version number of this version of Minecraft.
	 */
	id: z.string(),

	/**
	 * The type of version.
	 */
	type: z.enum(['release', 'snapshot', 'old_alpha', 'old_beta']),

	/**
	 * The URL to download the detailed metadata.
	 */
	url: z.string().url(),

	/**
	 * The... time...?
	 */
	time: z.string(),

	/**
	 * The time that this version was released.
	 */
	releaseTime: z.string(),

	/**
	 * The SHA1 checksum of the release.
	 */
	sha1: z.string(),

	/**
	 * The... compliance... level?
	 */
	complianceLevel: z.number(),
});

export type MinecraftVersion = z.infer<typeof MinecraftVersionSchema>;

const ManifestSchema = z.object({
	latest: z.object({
		release: z.string(),
		snapshot: z.string()
	}),
	versions: z.array(MinecraftVersionSchema)
});

type Manifest = z.infer<typeof ManifestSchema>;

/**
 * Load the manifest
 *
 * @return {Promise<AssetIndexJson>}  The manifest.
 */
export async function loadManifest(): Promise<Manifest> {
	const res = await fetch(VERSION_MANIFEST_ENDPOINT);
	const json = await res.json();

	// console.log(json);

	return ManifestSchema.parse(json);
}

export function findReleaseVersions(manifest: Manifest): MinecraftVersion[] {
	return manifest.versions
		.filter(version => {
			return version.type === 'release';
		});
}


export function findSpecificVersions(manifest: Manifest, versions: Set<string>): MinecraftVersion[] {
	return manifest.versions
		.filter(version => {
			return versions.has(version.id);
		});
}
