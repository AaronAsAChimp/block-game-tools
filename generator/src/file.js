import fs from 'fs';
import path from 'path';

/**
 * Walk a directory and yield PNG files.
 * @param {string} dirPath   The directory to walk.
 * @param {string} ext       The the extension to filter for.
 * @yield {string} The path to the PNG file that was found
 */
export async function* walk(dirPath, ext) {
	const dirs = await fs.promises.opendir(dirPath);
    for await (const dir of dirs) {
        const entry = path.join(dirPath, dir.name);
        
        if (dir.isFile()) {
        	const fileExt = path.extname(dir.name);

        	if (fileExt === ext) {
        		yield entry;
        	}
        }
    }
}
