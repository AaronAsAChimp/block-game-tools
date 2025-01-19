import { useStore } from '@nanostores/react';
import { texturizerOptionsStore } from '../../context/texturizer-store';
import { GradientDisplay } from "../gradient-display";
import { RGBColor } from "shared";
import { PaletteSelector } from '../palette-selector/index.jsx';
import styles from './styles.module.css';

const DEFAULT_START = 0x000000;
const DEFAULT_END = 0xFFFFFF;

/** @type {import('..//gradient-display/index.jsx').GradientStop[]} [description] */
const INITIAL_GRADIENT = [
	[RGBColor.fromInteger(DEFAULT_START), 0],
	[RGBColor.fromInteger(DEFAULT_END), 1]
];

export function TexturizerControls() {

	const texturizerOptions = useStore(texturizerOptionsStore);

	function updateIsMonochrome(e) {
		texturizerOptionsStore.set({
			...texturizerOptionsStore.value,
			isMonochrome: e.target.checked
		})
	}

	function updateNoiseScale(e) {
		texturizerOptionsStore.set({
			...texturizerOptionsStore.value,
			noiseScale: +e.target.value
		})
	}

	function updateWidth(e) {
		texturizerOptionsStore.set({
			...texturizerOptionsStore.value,
			width: +e.target.value
		})
	}

	function updateHeight(e) {
		texturizerOptionsStore.set({
			...texturizerOptionsStore.value,
			height: +e.target.value
		})
	}

	function updateDitheringAlgo(e) {
		texturizerOptionsStore.set({
			...texturizerOptionsStore.value,
			ditheringAlgo: e.target.value
		})
	}

	/**
     * @param {import('shared/src/gradient').Gradient} gradient
     */
	function updateGradient(gradient) {
		texturizerOptionsStore.set({
			...texturizerOptionsStore.value,
			gradient: gradient,
		})
	}

	return <div className={styles['texturizer-controls'] + ' ' + styles['form-controls']}>
		<PaletteSelector />
		<label className={styles['checkbox-control']}>
			Monochrome:
			<input type="checkbox" checked={texturizerOptions.isMonochrome} onChange={ updateIsMonochrome } />
		</label>
		<label>
			Scale:
			<input type="range"
				value={texturizerOptions.noiseScale}
				onInput={ updateNoiseScale }
				min={1}
				max={ Math.max(texturizerOptions.width, texturizerOptions.height) * 2}
			/>
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
		<label>
			Gradient:
{/*					<select value={gradientName} onInput={(e) => setGradientName(e.target.value)}>
				{ Object.entries(BUILTIN_GRADIENTS).map(([name, gradient]) => {
					return <option value={name} key={name}>{ gradient.display }</option>
				}) }
			</select>*/}
		</label>
		<div className={styles['texturizer-gradient']}>
			<GradientDisplay onGradientChange={updateGradient} initialGradientStops={INITIAL_GRADIENT} />
		</div>
	</div>
}