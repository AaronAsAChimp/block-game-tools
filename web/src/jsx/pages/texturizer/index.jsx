import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { RGBColor } from "shared";
import { Gradient } from "shared/src/gradient";
import { createNoise2D } from "simplex-noise";
import { AppTitleBar } from "../../../components/app-title-bar";
import { GradientHelpContent } from "../../../components/content";
import { LazyDialog } from "../../../components/lazy-dialog";
import { TextureSwatch } from "../../../components/texture-swatch";
import { PaletteContext } from "../../../context/palette-context";
import { BlockLookup } from "../../blocks";
import { coordToIndex, dither, ordered } from "../../dithering";
import * as styles from './styles.module.css';
import { GradientButton } from "../../../components/gradient-button";
import { GradientDisplay } from "../../../components/gradient-display";
import { LitematicaSchematic } from "../../../js/schematic";
import { SchematicRegion } from "../../../js/schematic-region";

const DEFAULT_SIZE = 16;
const MONOCHROME_STEPS = 32;
const TextureSwatchMemo = memo(TextureSwatch);

const DEFAULT_START = 0x000000;
const DEFAULT_END = 0xFFFFFF;
const INITIAL_GRADIENT = [
	[RGBColor.fromInteger(DEFAULT_START), 0],
	[RGBColor.fromInteger(DEFAULT_END), 1]
];

/**
 * @typedef {import('shared/src/block').Block} Block
 */

/**
 * @typedef {Object} SwatchGridProps
 * @property {number} width  The width of the grid
 * @property {number} height The height of the grid
 * @property {Block[]} blocks The blocks to display.
 */

/**
 * Display a grid of swatches.
 *
 * @param {SwatchGridProps} props
 */
function SwatchGrid({width, height, blocks}) {
	return <div style={{display: 'grid', gridTemplateColumns: `repeat(${width}, 64px)`, gridTemplateRows: `repeat(${height}, 64px)`}}>
		{ blocks ? blocks.map((block, idx) => <TextureSwatchMemo block={block} key={idx} showColor={false} />) : null }
	</div>
}

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

export function Component() {
	/** @type {React.MutableRefObject<HTMLCanvasElement>} */
	const canvasRef = useRef(null);
	const noiserRef = useRef(null);
	const [width, setWidth] = useState(DEFAULT_SIZE);
	const [height, setHeight] = useState(DEFAULT_SIZE);
	const [noiseScale, setNoiseScale] = useState(1);
	const [textureBlocks, setTextureBlocks] = useState(null);
	const [ditheringAlgo, setDitheringAlgo] = useState('floydSteinberg');
	const [isMonochrome, setIsMonochrome] = useState(false);
	const [gradientName, setGradientName] = useState('goldenSunrise');
	const [redraws, setRedraws] = useState(0);


	const [palette, setPalette] = useState('average');
	const [helpOpen, setHelpOpen] = useState(false);

	function paletteChange(e) {
		const select = e.target;
		setPalette(select.options[select.selectedIndex].value);
	}

	function resetNoiser() {
		noiserRef.current = createNoise2D();

		setRedraws(redraws + 1);
	}

	const downloadSchematicRef = useRef(null);

	async function downloadSchematic() {
		const schematic = new LitematicaSchematic({
			author: 'Block Game Tools',
			description: "",
			name: 'Texturizer',
			timeCreated: new Date(),
			timeModified: new Date(),
		});

		const region = new SchematicRegion({x: 0, y: 0, z: 0}, {x: width, y: 1, z: height});

		for (let idx = 0; idx < textureBlocks.length; idx++) {
			/** @type {Block} */
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
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');

		anchor.href = url.toString();
		anchor.download = 'schematic.litematic';

		document.body.appendChild(anchor);

		anchor.click();
		anchor.remove();

		window.URL.revokeObjectURL(url);
	}

	/** @type {import("../../server").BlocksResponse} */
	const blocks = useLoaderData();

	const gradientRef = useRef(null);


	const blockLookup = useMemo(() => {
		const globalBlockLookup = new BlockLookup(blocks.blocks);
		let blockLookup = globalBlockLookup;

		console.log(redraws);

		if (isMonochrome) {
			const monochromeBlocks = new Array(MONOCHROME_STEPS);

			for (let i = 0; i < MONOCHROME_STEPS; i++) {
				monochromeBlocks[i] = blockLookup.find(gradientRef.current.interpolate(i / (MONOCHROME_STEPS - 1)), palette).block;
			}

			blockLookup = new BlockLookup([
				...new Set(monochromeBlocks)
			]);

			// console.log(blockLookup);
		}

		return blockLookup;
	}, [redraws, gradientName, palette, blocks, isMonochrome]);

	useEffect(() => {
		if (width <= 0 || height <= 0) {
			return;
		}

		if (!gradientRef.current) {
			return;
		}

		if (!noiserRef.current) {
			resetNoiser();
		}

		const ctx = canvasRef.current.getContext('2d');
		const pixels = ctx.getImageData(0, 0, width, height);

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const noise = (noiserRef.current(x/noiseScale, y/noiseScale) / 2) + 0.5;
				const red = coordToIndex(width, x, y);
				const color = gradientRef.current.interpolate(noise).toRGBColor();

				pixels.data[red] = color.r;
				pixels.data[red + 1] = color.g;
				pixels.data[red + 2] = color.b;
				pixels.data[red + 3] = 255;
			}
		}

		if (ditheringAlgo === 'ordered2') {
			ordered(2, pixels, palette, blockLookup);
		} else if (ditheringAlgo === 'ordered4') {			
			ordered(4, pixels, palette, blockLookup);
		} else if (ditheringAlgo === 'ordered8') {			
			ordered(8, pixels, palette, blockLookup);
		} else {
			dither(ditheringAlgo, pixels, palette, blockLookup);
		}

		const textureBlocks = new Array(pixels.data.length / 4);

		for (let pixelIdx = 0; pixelIdx < pixels.data.length / 4; pixelIdx++) {
			const red = pixelIdx * 4;
			const blockColor = new RGBColor(pixels.data[red], pixels.data[red + 1], pixels.data[red + 2]);

			textureBlocks[pixelIdx] = blockLookup.find(blockColor, palette).block;
		}

		setTextureBlocks(textureBlocks);

		ctx.putImageData(pixels, 0, 0);
	}, [width, height, redraws, gradientName, isMonochrome, noiseScale, ditheringAlgo, palette])

	return <div className="page-texturizer">
		<PaletteContext.Provider value={palette}>
			<AppTitleBar title="Texturizer">
				<label>
					Color Extraction:
					<select className="pallette-select" onInput={paletteChange} value={palette}>
						<option value="average">Average</option>
						<option value="mostSaturated">Most Saturated</option>
						<option value="mostCommon">Most Common</option>
					</select>
				</label>
				{/*<button onClick={() => setHelpOpen(true)}><FontAwesomeIcon icon={faQuestion} /></button>*/}
			</AppTitleBar>
			<div className={styles['texturizer-controls']}>
				<label>
					Monochrome:
					<input type="checkbox" checked={isMonochrome} onChange={ (e) => setIsMonochrome(e.target.checked) } />
				</label>
				<label>
					Scale:
					<input type="range" value={noiseScale} onInput={ (e) => setNoiseScale(+e.target.value) } min={1} max={ Math.max(width, height) * 2} />
				</label>
				<label>
					Size:
					<span>
						<input type="number" value={width} min={1} size={3} onInput={ (e) => setWidth(+e.target.value) } /> &times; <input type="number" value={height} min={1} size={3} onInput={ (e) => setHeight(+e.target.value) } />
					</span>
				</label>
				<label>
					Dithering:
					<select value={ditheringAlgo} onInput={(e) => setDitheringAlgo(e.target.value)}>
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
					<GradientDisplay onGradientChange={(gradient) => {gradientRef.current = gradient; setRedraws(redraws + 1)}} initialGradientStops={INITIAL_GRADIENT} />
				</div>

				<button type="button" onClick={resetNoiser}>Randomize</button>
				<button ref={downloadSchematicRef} onClick={downloadSchematic}>Download Litematica Schematic</button>
			</div>
			<canvas className={styles['texturizer-canvas']} ref={canvasRef} width={width} height={height} />
			<SwatchGrid width={width} height={height} blocks={textureBlocks} />
		</PaletteContext.Provider>
		<LazyDialog open={helpOpen} onClose={() => setHelpOpen(false)}>
			<GradientHelpContent />
		</LazyDialog>
	</div>;
}
