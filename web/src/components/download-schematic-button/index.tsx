import { useRef, useCallback } from 'react';
import { LitematicaSchematic } from '../../schematic/schematic';
import { SchematicRegion } from '../../schematic/schematic-region';
import type { Block } from 'shared/src/block';

interface DownloadSchematicButtonProps {
	width: number;
	height: number;
	textureBlocks: Block[]
}

export function DownloadSchematicButton({width, height, textureBlocks}: DownloadSchematicButtonProps) {
	const downloadSchematicRef = useRef(null);

	const downloadSchematic = useCallback(async function () {
		const schematic = new LitematicaSchematic({
			author: 'Block Game Tools',
			description: "",
			name: 'Texturizer',
			timeCreated: new Date(),
			timeModified: new Date(),
		});

		const region = new SchematicRegion({x: 0, y: 0, z: 0}, {x: width, y: 1, z: height});

		for (let idx = 0; idx < textureBlocks.length; idx++) {
			const block = textureBlocks[idx];
			const properties = {};

			if (block.name === 'polished_basalt_side') {
				console.log(block);
			}

			// Hacky way of determining the axis
			// TODO: this should be added to the preprocessed data instead
			if (block.name.endsWith('_side') || block.name.endsWith('_log')) {
				properties.axis = 'z';
			} else if (block.name.endsWith('_top')) {
				properties.axis = 'y';
			}

			region.setBlock('minecraft:' + block.blockIds[0], properties, {
				x: idx % width,
				y: 0,
				z: Math.floor(idx / width),
			});
		}

		schematic.addRegion('region', region);

		const blob = await LitematicaSchematic.writeCompressed(schematic);
		const url = URL.createObjectURL(new Blob([blob]));
		const anchor = document.createElement('a');

		anchor.href = url.toString();
		anchor.download = 'schematic.litematic';

		document.body.appendChild(anchor);

		anchor.click();
		anchor.remove();

		window.URL.revokeObjectURL(url);
	}, [width, height, textureBlocks]);

	return <button ref={downloadSchematicRef} onClick={downloadSchematic}>Download Litematica Schematic</button>
}
