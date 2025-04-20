import { useStore } from '@nanostores/react';
import { texturizerOptionsStore } from '../../context/texturizer-store';
import { GradientDisplay } from "../gradient-display";
import { RGBColor } from "shared";
import { PaletteSelector } from '../palette-selector/index.jsx';
import styles from './styles.module.css';
import { useEffect, useState } from 'react';

const DEFAULT_START = 0x000000;
const DEFAULT_END = 0xFFFFFF;


const BUILTIN_GRADIENTS = {
	"grayscale": {
		"display": "Grayscale",
		"gradient": [
			{
				"offset": 0,
				"color": 0x000000
			},
			{
				"offset": 1,
				"color": 0xFFFFFF
			}
		]
	},
	"goldenSunrise": {
		"display": "Golden Sunrise",
		"gradient": [
			{
				"offset": 0,
				"color": 0x33252e
			},
			{
				"offset": 0.4437,
				"color": 0xff9b1b
			},
			{
				"offset": 0.7281,
				"color": 0xfbd26f
			},
			{
				"offset": 1,
				"color": 0xffe1b8
			}
		]
	},
};

/** @type {import('shared/src/gradient').SimpleGradientStop[]}  */
const INITIAL_GRADIENT = [
	[RGBColor.fromInteger(DEFAULT_START), 0],
	[RGBColor.fromInteger(DEFAULT_END), 1]
];

export function TexturizerControls() {

	const texturizerOptions = useStore(texturizerOptionsStore);
	const [gradientName, setGradientName] = useState('grayscale');
	const [presetGradient, setPresetGradient] = useState(INITIAL_GRADIENT);

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

	function updateNoiseVersion() {
		texturizerOptionsStore.set({
			...texturizerOptionsStore.value,
			noiseVersion: texturizerOptionsStore.value.noiseVersion + 1
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

	useEffect(() => {
		if (gradientName) {
			const gradientPreset = BUILTIN_GRADIENTS[gradientName];
			const stops = new Array(gradientPreset.gradient.length);

			for (let i = 0; i < gradientPreset.gradient.length; i++) {
				const stop = gradientPreset.gradient[i];

				stops[i] = [
					RGBColor.fromInteger(stop.color),
					stop.offset
				]
			}

			setPresetGradient(stops);
		}

	}, [gradientName])

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
			<select value={gradientName ?? ''} onInput={(e) => setGradientName(e.target.value)}>
				<option value="" key=""></option>
				{ Object.entries(BUILTIN_GRADIENTS).map(([name, gradient]) => {
					return <option value={name} key={name}>{ gradient.display }</option>
				}) }
			</select>
		</label>
		<div className={styles['texturizer-gradient']}>
			<GradientDisplay onGradientChange={updateGradient} initialGradientStops={presetGradient} />
		</div>

		<button type="button" onClick={updateNoiseVersion}>Randomize</button>
	</div>
}