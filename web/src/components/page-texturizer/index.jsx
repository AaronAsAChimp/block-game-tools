import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createNoise2D } from "simplex-noise";
import { TextureSwatch } from "../texture-swatch";
import { PaletteContext } from "../../context/palette-context";
import { BlockLookup, loadBlocks } from "../../blocks";
import { coordToIndex } from "../../dithering";
import { paletteStore } from '../../context/palette-store';
import { imageAsBlocks } from '../../image.js';

import { useStore } from '@nanostores/react';
import { texturizerOptionsStore } from '../../context/texturizer-store.js';
import { Minimap } from '../minimap/index.jsx';
import { blockGrid } from '../../context/block-grid-store.js';

const MONOCHROME_STEPS = 32;
const TextureSwatchMemo = memo(TextureSwatch);


/**
 * @typedef {Object} SwatchGridProps
 * @property {number} width  The width of the grid
 * @property {number} height The height of the grid
 * @property {import('shared/src/block').Block[]} blocks The blocks to display.
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
	/** @type {React.MutableRefObject<HTMLCanvasElement | null>} */
	const canvasRef = useRef(null);
	const noiserRef = useRef(null);
	const texturizerOptions = useStore(texturizerOptionsStore);
	const textureBlocks = useStore(blockGrid);

	const [blocks, setBlocks] = useState([]);

	const palette = useStore(paletteStore);

	useEffect(() => {
		paletteStore.set('average');

		loadBlocks('gradient-blocks')
			.then((blocks) => {
				setBlocks(blocks.blocks)
			});
	}, [])

	useEffect(() => {
		noiserRef.current = createNoise2D();
	}, [texturizerOptions.noiseVersion])


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
		if (!canvasRef.current) {
			return;
		}

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

		const ctx = canvasRef.current.getContext('2d');

		if (!ctx) {
			return;
		}

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

		const textureBlocks = imageAsBlocks(pixels, palette, texturizerOptions.ditheringAlgo, blockLookup);

		blockGrid.set(textureBlocks);

		ctx.putImageData(pixels, 0, 0);
	}, [texturizerOptions, palette, blockLookup])

	return <>
		<PaletteContext.Provider value={palette}>
			<Minimap ref={canvasRef} naturalWidth={texturizerOptions.width} naturalHeight={texturizerOptions.height} scale={64}></Minimap>
			<SwatchGrid width={texturizerOptions.width} height={texturizerOptions.height} blocks={textureBlocks} />
		</PaletteContext.Provider>
	</>;
}
