import Zip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import sanitize from 'sanitize-filename';
import { MC_VERSION } from 'shared';
import progress from 'cli-progress';

import { downloadResource, loadAssetIndex } from './resources.ts';
import { downloadClient, loadVersionManifesta } from './versions.ts';
import { findSpecificVersions, loadManifest } from './manifest.ts';


const manifest = await loadManifest();
const versions = new Set([MC_VERSION]);
const releases = findSpecificVersions(manifest, versions);
const root = './jars';

// check for existing paths and delete them

for (const release of releases) {
	const jarFolder = path.join(root, sanitize(release.id));

	if (fs.existsSync(jarFolder)) {
		await fs.promises.rm(jarFolder, {
			recursive: true,
		});
	}
}

// process the release

for (const release of releases) {
	console.log(`- v${ release.id } - ${release.url}`);
	const manifest = await loadVersionManifesta(release);

	// Download the JAR file

	const jarFolder = path.join(root, sanitize(release.id));

	await fs.promises.mkdir(jarFolder, {
		recursive: true
	});


	const bar = new progress.SingleBar({}, progress.Presets.shades_classic);

	bar.start(1, 0);

	await downloadClient(manifest, jarFolder);

	bar.increment();

	// Extract the block textures

	const jarFile = path.join(jarFolder, 'minecraft.jar');
	const zip = new Zip(jarFile);
	const zipEntries = zip.getEntries();

	bar.setTotal(zipEntries.length + 1);
	
	for (const entry of zipEntries) {
		// console.log('  - ' + entry.entryName);
		if (entry.entryName.startsWith('assets/minecraft/textures/block/')) {
			zip.extractEntryTo(entry, jarFolder);
		}

		bar.increment();
	}

	// Download the noteblock sounds

	const assetIndex = await loadAssetIndex(manifest);
	const entries = Object.entries(assetIndex.objects);

	bar.setTotal(zipEntries.length + entries.length + 1);

	for (const [assetPath, ref] of entries) {
		if (assetPath.startsWith('minecraft/sounds/note/')) {
			const downloadPath = path.join(jarFolder, 'assets', assetPath);

			fs.promises.mkdir(path.dirname(downloadPath), {
				recursive: true
			});

			downloadResource(ref.hash, downloadPath);
		}

		bar.increment();
	}

	bar.stop();
}
