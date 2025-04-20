import { useStore } from '@nanostores/react';
import { artGenOptionsStore, aspectRatio } from '../../context/art-store.js';
import { PaletteSelector } from '../palette-selector/index.jsx';
import { LitematicaSchematic } from "../../schematic/schematic.js";
import { SchematicRegion } from "../../schematic/schematic-region.js";
import styles from './styles.module.css';
import { blockGrid } from '../../context/block-grid-store.js';
import { useRef } from 'react';

export function ArtControls() {
	const texturizerOptions = useStore(artGenOptionsStore);
	const textureBlocks = useStore(blockGrid);
	const downloadSchematicRef = useRef(null);

	function updateWidth(e) {
		const width = +e.target.value;

		artGenOptionsStore.set({
			...artGenOptionsStore.value,
			width,
			height: Math.round(width / aspectRatio.get())
		})
	}

	function updateHeight(e) {
		const height = +e.target.value;

		artGenOptionsStore.set({
			...artGenOptionsStore.value,
			width: Math.round(height * aspectRatio.get()),
			height
		})
	}

	function updateDitheringAlgo(e) {
		artGenOptionsStore.set({
			...artGenOptionsStore.value,
			ditheringAlgo: e.target.value
		})
	}

	function updateImageFile(e) {
		if (e.target instanceof HTMLInputElement) {
			const file = e.target.files[0];

			const image = new Image();
			const reader = new FileReader();
			reader.onload = (e) => {
				image.src = reader.result;
			};
			reader.onerror = (e) => {
				console.error('Error loading image:', e)
			};

			reader.readAsDataURL(file);

			image.onload = (e) => {
				artGenOptionsStore.set({
					...artGenOptionsStore.value,
					image
				})
			}
		}
	}

	async function downloadSchematic() {
		const width = texturizerOptions.width;
		const height = texturizerOptions.height;

		const schematic = new LitematicaSchematic({
			author: 'Block Game Tools',
			description: "",
			name: 'Texturizer',
			timeCreated: new Date(),
			timeModified: new Date(),
		});

		const region = new SchematicRegion({x: 0, y: 0, z: 0}, {x: width, y: 1, z: height});

		for (let idx = 0; idx < textureBlocks.length; idx++) {
			/** @type {import('shared/src/block').Block} */
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
	}

	return <div className={styles['texturizer-controls'] + ' ' + styles['form-controls']}>
		<PaletteSelector />
		<label>
			Image:
			<input onInput={updateImageFile} type="file" accept="image/*" />
		</label>
		<label>
			Size:
			<span className={styles['custom-input']}>
				<input type="number" value={texturizerOptions.width} min={1} size={3} onInput={ updateWidth } /> &times; <input type="number" value={texturizerOptions.height} min={1} size={3} onInput={ updateHeight } />
			</span>
		</label>
		<label>
			Dithering:
			<select value={texturizerOptions.ditheringAlgo} onInput={updateDitheringAlgo}>
				<option value="none">None</option>
				<optgroup label="Error Diffusion">
					<option value="floydSteinberg">Floyd-Steinberg</option>
					<option value="stucki">Stucki</option>
					<option value="atkinson">Atkinson</option>
					<option value="stevensonArce">Stevenson-Arce</option>
				</optgroup>
				<optgroup label="Ordered">
					<option value="ordered2">Bayer 2x2</option>
					<option value="ordered4">Bayer 4x4</option>
					<option value="ordered8">Bayer 8x8</option>
				</optgroup>
			</select>
		</label>

		<button ref={downloadSchematicRef} onClick={downloadSchematic}>Download Litematica Schematic</button>
	</div>
}