import { memo, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { RGBColor } from "shared";
import { createNoise2D } from "simplex-noise";
// import { AppTitleBar } from "../app-title-bar";
import { GradientHelpContent } from "../content";
import { LazyDialog } from "../lazy-dialog";
import { TextureSwatch } from "../texture-swatch";
import { PaletteContext } from "../../context/palette-context";
import { LitematicaSchematic } from "../../schematic/schematic.js";
import { SchematicRegion } from "../../schematic/schematic-region.js";
import { BlockLookup, loadBlocks } from "../../blocks";
import { coordToIndex, dither, ordered } from "../../dithering";
import { paletteStore } from '../../context/palette-store';

import styles from './styles.module.css';
import { useStore } from '@nanostores/react';
import { texturizerOptionsStore } from '../../context/texturizer-store.js';

const MONOCHROME_STEPS = 32;
const TextureSwatchMemo = memo(TextureSwatch);


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

export function Texturizer() {
	/** @type {React.MutableRefObject<HTMLCanvasElement>} */
	const canvasRef = useRef(null);
	const noiserRef = useRef(null);
	const [textureBlocks, setTextureBlocks] = useState(null);
	const texturizerOptions = useStore(texturizerOptionsStore);

	const [redraws, setRedraws] = useState(0);
	const [blocks, setBlocks] = useState([]);

	const palette = useStore(paletteStore);

	const [helpOpen, setHelpOpen] = useState(false);

	function resetNoiser() {
		noiserRef.current = createNoise2D();

		setRedraws(redraws + 1);
	}

	const downloadSchematicRef = useRef(null);

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
		const url = URL.createObjectURL(new Blob([blob]));
		const anchor = document.createElement('a');

		anchor.href = url.toString();
		anchor.download = 'schematic.litematic';

		document.body.appendChild(anchor);

		anchor.click();
		anchor.remove();

		window.URL.revokeObjectURL(url);
	}

	useEffect(() => {
		paletteStore.set('average');

		loadBlocks('gradient-blocks')
			.then((blocks) => {
				setBlocks(blocks.blocks)
			});
	}, [])


	const blockLookup = useMemo(() => {
		if (!(blocks && blocks.length)) {
			return null;
		}

		if (!texturizerOptions.gradient) {
			return null;
		}

		const globalBlockLookup = new BlockLookup(blocks);
		let blockLookup = globalBlockLookup;

		if (texturizerOptions.isMonochrome) {
			const monochromeBlocks = new Array(MONOCHROME_STEPS);

			for (let i = 0; i < MONOCHROME_STEPS; i++) {
				monochromeBlocks[i] = blockLookup.find(texturizerOptions.gradient.interpolate(i / (MONOCHROME_STEPS - 1)), palette).block;
			}

			blockLookup = new BlockLookup([
				...new Set(monochromeBlocks)
			]);

			// console.log(blockLookup);
		}

		return blockLookup;
	}, [palette, blocks, texturizerOptions.isMonochrome]);

	useEffect(() => {
		const width = texturizerOptions.width;
		const height = texturizerOptions.height;

		if (width <= 0 || height <= 0) {
			return;
		}

		if (!texturizerOptions.gradient) {
			return;
		}

		if (!blockLookup) {
			return;
		}

		if (!noiserRef.current) {
			resetNoiser();
		}

		const ctx = canvasRef.current.getContext('2d');
		const pixels = ctx.getImageData(0, 0, width, height);
		const noiseScale = texturizerOptions.noiseScale;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const noise = (noiserRef.current(x/noiseScale, y/noiseScale) / 2) + 0.5;
				const red = coordToIndex(width, x, y);
				const color = texturizerOptions.gradient.interpolate(noise).toRGBColor();

				pixels.data[red] = color.r;
				pixels.data[red + 1] = color.g;
				pixels.data[red + 2] = color.b;
				pixels.data[red + 3] = 255;
			}
		}

		const ditheringAlgo = texturizerOptions.ditheringAlgo;

		if (ditheringAlgo === 'ordered2') {
			ordered(2, pixels, palette, blockLookup);
		} else if (ditheringAlgo === 'ordered4') {			
			ordered(4, pixels, palette, blockLookup);
		} else if (ditheringAlgo === 'ordered8') {			
			ordered(8, pixels, palette, blockLookup);
		} else {
			dither(ditheringAlgo, pixels, palette, blockLookup);
		}

		console.log(redraws);

		const textureBlocks = new Array(pixels.data.length / 4);

		for (let pixelIdx = 0; pixelIdx < pixels.data.length / 4; pixelIdx++) {
			const red = pixelIdx * 4;
			const blockColor = new RGBColor(pixels.data[red], pixels.data[red + 1], pixels.data[red + 2]);

			textureBlocks[pixelIdx] = blockLookup.find(blockColor, palette).block;
		}

		setTextureBlocks(textureBlocks);

		ctx.putImageData(pixels, 0, 0);
	}, [redraws, texturizerOptions, palette, blockLookup])

	return <>
		<PaletteContext.Provider value={palette}>
			<div className={styles['texturizer-controls']}>
				<button type="button" onClick={resetNoiser}>Randomize</button>
				<button ref={downloadSchematicRef} onClick={downloadSchematic}>Download Litematica Schematic</button>
			</div>
			<canvas className={styles['texturizer-canvas']} ref={canvasRef} width={texturizerOptions.width} height={texturizerOptions.height} />
			<SwatchGrid width={texturizerOptions.width} height={texturizerOptions.height} blocks={textureBlocks} />
		</PaletteContext.Provider>
		<LazyDialog open={helpOpen} onClose={() => setHelpOpen(false)}>
			<GradientHelpContent />
		</LazyDialog>
	</>;
}
