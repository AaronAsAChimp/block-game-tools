import fs from 'fs/promises';
import path from 'path';
import { walk } from './file.js';
import { fileURLToPath } from 'url';


export async function copySounds(soundsDir, destDir) {
	const notes = [];

	for await (const filename of walk(soundsDir, '.ogg')) {
		const name = path.basename(filename, '.ogg');
		const dest = path.join(destDir, name + '.ogg');

		notes.push({
			'name': name,
		});

		await fs.copyFile(filename, dest);
	}

	const notesData = fileURLToPath(new URL('../data/notes.json', import.meta.url));

	fs.copyFile(notesData, path.join(destDir, 'notes.json'));
}