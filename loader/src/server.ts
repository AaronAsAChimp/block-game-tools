import { z } from 'zod';


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
