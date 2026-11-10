import { useStore } from '@nanostores/react';
import { artGenOptionsStore, aspectRatio, loadImageFromFile } from '../../context/art-store.js';
import { PaletteSelector } from '../palette-selector/index.jsx';
import styles from './styles.module.css';
import { blockGrid } from '../../context/block-grid-store.js';
import { DownloadSchematicButton } from '../download-schematic-button/index.js';

export function ArtControls() {
	const texturizerOptions = useStore(artGenOptionsStore);
	const textureBlocks = useStore(blockGrid);

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

			loadImageFromFile(file);
		}
	}

	return <div className={styles['texturizer-controls'] + ' form-controls'}>
		<PaletteSelector />
		<label>
			Image:
			<input onInput={updateImageFile} type="file" accept="image/*" />
		</label>
		<label>
			Size:
			<span className={styles['size-input']}>
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

		<DownloadSchematicButton width={texturizerOptions.width} height={texturizerOptions.height} textureBlocks={textureBlocks} />
	</div>
}