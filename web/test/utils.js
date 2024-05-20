import fs from 'fs/promises';
import nbt from 'prismarine-nbt';

export async function loadSchematic(filename, compressed) {
	const dataPath = new URL(`./data/${ filename }`, import.meta.url);
	const file = await fs.readFile(dataPath);

	if (compressed) {
		return (await nbt.parse(file)).parsed;
	} else {
		return nbt.parseUncompressed(file);
	}
}