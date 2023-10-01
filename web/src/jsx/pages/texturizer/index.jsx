import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { RGBColor } from "shared";
import { Gradient } from "shared/src/gradient";
import { createNoise2D } from "simplex-noise";
import { AppTitleBar } from "../../../components/app-title-bar";
import { TextureSwatch } from "../../../components/texture-swatch";
import { PaletteContext } from "../../../context/palette-context";
import { BlockLookup } from "../../blocks";
import * as styles from './styles.module.css';
import { GradientHelpContent } from "../../../components/content";
import { LazyDialog } from "../../../components/lazy-dialog";

const DEFAULT_SIZE = 16;

/**
 * @typedef {import('../../../jsx/server.d.ts').Block} Block
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
	return <div style={{display: 'grid', gridTemplateColumns: `repeat(${width}, 1fr`}}>
		{ blocks ? blocks.map((block, idx) => <TextureSwatch block={block} key={idx} />) : null }
	</div>
}

function coordToIndex(width, x, y) {
	return y * (width * 4) + x * 4;
}


/**
 * @callback DitheringAlgo
 * @param {ImageData} pixels
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {number} g
 * @param {number} b
 */

const FLOYD_STEINBERG_7 = 7 / 16;
const FLOYD_STEINBERG_5 = 5 / 16;
const FLOYD_STEINBERG_3 = 3 / 16;
const FLOYD_STEINBERG_1 = 1 / 16;

const STUCKI_8 = 8 / 42;
const STUCKI_4 = 4 / 42;
const STUCKI_2 = 2 / 42;
const STUCKI_1 = 1 / 42;

const ATKINSON_1 = 1 / 8;

const STEVENSON_ARCE_32 = 32 / 200;
const STEVENSON_ARCE_30 = 30 / 200;
const STEVENSON_ARCE_26 = 26 / 200;
const STEVENSON_ARCE_16 = 16 / 200;
const STEVENSON_ARCE_12 = 12 / 200;
const STEVENSON_ARCE_5 = 5 / 200;
/**
 * @type {Record<string, DitheringAlgo | null>}
 */
const DITHERING_ALGOS = {
	none: null,
	floydSteinberg(pixels, x, y, r, g, b,) {
		const width = pixels.width;
		const nextRed = coordToIndex(width, x + 1, y);

		pixels.data[nextRed] += r * FLOYD_STEINBERG_7;
		pixels.data[nextRed + 1] += g * FLOYD_STEINBERG_7;
		pixels.data[nextRed + 2] += b * FLOYD_STEINBERG_7;

		const belowPrevRed = coordToIndex(width, x - 1, y + 1);

		pixels.data[belowPrevRed] += r * FLOYD_STEINBERG_3;
		pixels.data[belowPrevRed + 1] += g * FLOYD_STEINBERG_3;
		pixels.data[belowPrevRed + 2] += b * FLOYD_STEINBERG_3;

		const belowRed = coordToIndex(width, x, y + 1);

		pixels.data[belowRed] += r * FLOYD_STEINBERG_5;
		pixels.data[belowRed + 1] += g * FLOYD_STEINBERG_5;
		pixels.data[belowRed + 2] += b * FLOYD_STEINBERG_5;

		const belowNextRed = coordToIndex(width, x + 1, y + 1);

		pixels.data[belowNextRed] += r * FLOYD_STEINBERG_1;
		pixels.data[belowNextRed + 1] += g * FLOYD_STEINBERG_1;
		pixels.data[belowNextRed + 2] += b * FLOYD_STEINBERG_1;
	},
	// 'stucki': {
	// 	'divisor': 42,
	// 	'weights': [
	// 		[0, 0, 0, 8, 4],
	// 		[2, 4, 8, 4, 2],
	// 		[1, 2, 4, 2, 1]
	// 	]
	// },
	stucki(pixels, x, y, r, g, b) {
		const width = pixels.width;
		let pixel = coordToIndex(width, x + 1, y);

		pixels.data[pixel] += r * STUCKI_8;
		pixels.data[pixel + 1] += g * STUCKI_8;
		pixels.data[pixel + 2] += b * STUCKI_8;

		pixel = coordToIndex(width, x + 2, y);

		pixels.data[pixel] += r * STUCKI_4;
		pixels.data[pixel + 1] += g * STUCKI_4;
		pixels.data[pixel + 2] += b * STUCKI_4;

		pixel = coordToIndex(width, x - 2, y + 1);

		pixels.data[pixel] += r * STUCKI_2;
		pixels.data[pixel + 1] += g * STUCKI_2;
		pixels.data[pixel + 2] += b * STUCKI_2;

		pixel = coordToIndex(width, x - 1, y + 1);

		pixels.data[pixel] += r * STUCKI_4;
		pixels.data[pixel + 1] += g * STUCKI_4;
		pixels.data[pixel + 2] += b * STUCKI_4;

		pixel = coordToIndex(width, x, y + 1);

		pixels.data[pixel] += r * STUCKI_8;
		pixels.data[pixel + 1] += g * STUCKI_8;
		pixels.data[pixel + 2] += b * STUCKI_8;

		pixel = coordToIndex(width, x + 1, y + 1);

		pixels.data[pixel] += r * STUCKI_4;
		pixels.data[pixel + 1] += g * STUCKI_4;
		pixels.data[pixel + 2] += b * STUCKI_4;

		pixel = coordToIndex(width, x + 2, y + 1);

		pixels.data[pixel] += r * STUCKI_2;
		pixels.data[pixel + 1] += g * STUCKI_2;
		pixels.data[pixel + 2] += b * STUCKI_2;

		pixel = coordToIndex(width, x - 2, y + 2);

		pixels.data[pixel] += r * STUCKI_1;
		pixels.data[pixel + 1] += g * STUCKI_1;
		pixels.data[pixel + 2] += b * STUCKI_1;

		pixel = coordToIndex(width, x - 1, y + 2);

		pixels.data[pixel] += r * STUCKI_2;
		pixels.data[pixel + 1] += g * STUCKI_2;
		pixels.data[pixel + 2] += b * STUCKI_2;

		pixel = coordToIndex(width, x, y + 2);

		pixels.data[pixel] += r * STUCKI_4;
		pixels.data[pixel + 1] += g * STUCKI_4;
		pixels.data[pixel + 2] += b * STUCKI_4;

		pixel = coordToIndex(width, x + 1, y + 2);

		pixels.data[pixel] += r * STUCKI_2;
		pixels.data[pixel + 1] += g * STUCKI_2;
		pixels.data[pixel + 2] += b * STUCKI_2;

		pixel = coordToIndex(width, x + 2, y + 2);

		pixels.data[pixel] += r * STUCKI_1;
		pixels.data[pixel + 1] += g * STUCKI_1;
		pixels.data[pixel + 2] += b * STUCKI_1;
	},
	// 'atkinson': {
	// 	'divisor': 8,
	// 	'weights': [
	// 		[0, 0, 0, 1, 1],
	// 		[0, 1, 1, 1, 0],
	// 		[0, 0, 1, 0, 0]
	// 	]
	// }
	atkinson(pixels, x, y, r, g, b) {
		const width = pixels.width;
		let pixel = coordToIndex(width, x + 1, y);

		pixels.data[pixel] += r * ATKINSON_1;
		pixels.data[pixel + 1] += g * ATKINSON_1;
		pixels.data[pixel + 2] += b * ATKINSON_1;

		pixel = coordToIndex(width, x + 2, y);

		pixels.data[pixel] += r * ATKINSON_1;
		pixels.data[pixel + 1] += g * ATKINSON_1;
		pixels.data[pixel + 2] += b * ATKINSON_1;

		pixel = coordToIndex(width, x - 1, y + 1);

		pixels.data[pixel] += r * ATKINSON_1;
		pixels.data[pixel + 1] += g * ATKINSON_1;
		pixels.data[pixel + 2] += b * ATKINSON_1;

		pixel = coordToIndex(width, x, y + 1);

		pixels.data[pixel] += r * ATKINSON_1;
		pixels.data[pixel + 1] += g * ATKINSON_1;
		pixels.data[pixel + 2] += b * ATKINSON_1;

		pixel = coordToIndex(width, x + 1, y + 1);

		pixels.data[pixel] += r * ATKINSON_1;
		pixels.data[pixel + 1] += g * ATKINSON_1;
		pixels.data[pixel + 2] += b * ATKINSON_1;

		pixel = coordToIndex(width, x, y + 2);

		pixels.data[pixel] += r * ATKINSON_1;
		pixels.data[pixel + 1] += g * ATKINSON_1;
		pixels.data[pixel + 2] += b * ATKINSON_1;
	},
	// 'stevensonArce': {
	// 	'divisor': 200,
	// 	'weights': [
	// 		[ 0,  0,  0,  0,  0, 32,  0],
	// 		[12,  0, 26,  0, 30,  0, 16],
	// 		[ 0, 12,  0, 26,  0, 12,  0],
	// 		[ 5,  0, 12,  0, 12,  0,  5]
	// 	]
	// }
	stevensonArce(pixels, x, y, r, g, b) {
		const width = pixels.width;
		let pixel = coordToIndex(width, x + 2, y);

		pixels.data[pixel] += r * STEVENSON_ARCE_32;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_32;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_32;

		pixel = coordToIndex(width, x - 3, y + 1);

		pixels.data[pixel] += r * STEVENSON_ARCE_12;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_12;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_12;

		pixel = coordToIndex(width, x - 1, y + 1);

		pixels.data[pixel] += r * STEVENSON_ARCE_26;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_26;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_26;

		pixel = coordToIndex(width, x + 1, y + 1);

		pixels.data[pixel] += r * STEVENSON_ARCE_30;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_30;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_30;

		pixel = coordToIndex(width, x + 3, y + 1);

		pixels.data[pixel] += r * STEVENSON_ARCE_16;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_16;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_16;

		pixel = coordToIndex(width, x - 2, y + 2);

		pixels.data[pixel] += r * STEVENSON_ARCE_12;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_12;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_12;

		pixel = coordToIndex(width, x, y + 2);

		pixels.data[pixel] += r * STEVENSON_ARCE_26;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_26;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_26;

		pixel = coordToIndex(width, x - 2, y + 2);

		pixels.data[pixel] += r * STEVENSON_ARCE_12;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_12;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_12;

		pixel = coordToIndex(width, x - 3, y + 3);

		pixels.data[pixel] += r * STEVENSON_ARCE_5;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_5;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_5;

		pixel = coordToIndex(width, x - 1, y + 3);

		pixels.data[pixel] += r * STEVENSON_ARCE_12;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_12;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_12;

		pixel = coordToIndex(width, x + 1, y + 3);

		pixels.data[pixel] += r * STEVENSON_ARCE_12;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_12;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_12;

		pixel = coordToIndex(width, x + 3, y + 3);

		pixels.data[pixel] += r * STEVENSON_ARCE_5;
		pixels.data[pixel + 1] += g * STEVENSON_ARCE_5;
		pixels.data[pixel + 2] += b * STEVENSON_ARCE_5;
	}
}

export function Component() {
	/** @type {React.MutableRefObject<HTMLCanvasElement>} */
	const canvasRef = useRef(null);
	const noiserRef = useRef(null);
	const [width, setWidth] = useState(DEFAULT_SIZE);
	const [height, setHeight] = useState(DEFAULT_SIZE);
	const [noiseScale, setNoiseScale] = useState(1);
	const [textureBlocks, setTextureBlocks] = useState(null);
	const [ditheringAlgo, setDitheringAlgo] = useState('stucki');

	const [palette, setPalette] = useState('average');
	const [helpOpen, setHelpOpen] = useState(false);

	function paletteChange(e) {
		const select = e.target;
		setPalette(select.options[select.selectedIndex].value);
	}

	function resetNoiser() {
		noiserRef.current = createNoise2D();
	}

	/** @type {import("../../server").BlocksResponse} */
	const blocks = useLoaderData();

	const blockLookup = useMemo(() => {
		return new BlockLookup(blocks.blocks);
	}, [blocks]);

	useEffect(() => {

		if (!noiserRef.current) {
			resetNoiser();
		}

		const ctx = canvasRef.current.getContext('2d');
		const pixels = ctx.getImageData(0, 0, width, height);
		const gradient = new Gradient();
		const ditheringMethod = DITHERING_ALGOS[ditheringAlgo];

		gradient.addStop(0, RGBColor.fromInteger(0x33252e));
		gradient.addStop(0.4437, RGBColor.fromInteger(0xff9b1b));
		gradient.addStop(0.7281, RGBColor.fromInteger(0xfbd26f));
		gradient.addStop(1, RGBColor.fromInteger(0xffe1b8));

		// gradient.addStop(0, RGBColor.fromInteger(0x20180d));
		// gradient.addStop(1, RGBColor.fromInteger(0x207d3d));


		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const noise = (noiserRef.current(x/noiseScale, y/noiseScale) / 2) + 0.5;
				const red = coordToIndex(width, x, y);
				const color = gradient.interpolate(noise).toRGBColor();
				const block = blockLookup.find(color, palette).block;
				const matchedColor = block.palette[palette].rgb;

				pixels.data[red] = color.r;
				pixels.data[red + 1] = color.g;
				pixels.data[red + 2] = color.b;
				pixels.data[red + 3] = 255;

				const rDelta = color.r - matchedColor.r;
				const gDelta = color.g - matchedColor.g;
				const bDelta = color.b - matchedColor.b;


				pixels[red + 4] = rDelta * (7 / 16);
				pixels[red + 4 + 1] = gDelta * (7 / 16);
				pixels[red + 4 + 2] = bDelta * (7 / 16);
			}
		}

		const color = new RGBColor(0, 0, 0);

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const red = coordToIndex(width, x, y);

				color.r = pixels.data[red];
				color.g = pixels.data[red + 1];
				color.b = pixels.data[red + 2]

				const block = blockLookup.find(color, palette).block;
				const matchedColor = block.palette[palette].rgb;

				const rDelta = color.r - matchedColor.r;
				const gDelta = color.g - matchedColor.g;
				const bDelta = color.b - matchedColor.b;

				if (ditheringMethod) {
					ditheringMethod(pixels, x, y, rDelta, gDelta, bDelta);
				}

				pixels.data[red] = matchedColor.r;
				pixels.data[red + 1] = matchedColor.g;
				pixels.data[red + 2] = matchedColor.b;
			}
		}

		const textureBlocks = new Array(pixels.data.length / 4);

		for (let pixelIdx = 0; pixelIdx < pixels.data.length / 4; pixelIdx++) {
			const red = pixelIdx * 4;
			const blockColor = new RGBColor(pixels.data[red], pixels.data[red + 1], pixels.data[red + 2]);

			textureBlocks.push(blockLookup.find(blockColor, palette).block);
		}

		setTextureBlocks(textureBlocks);

		ctx.putImageData(pixels, 0, 0);
	}, [width, height, noiseScale, ditheringAlgo, palette])

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
			<label>
				Scale
				<input type="range" value={noiseScale} onInput={ (e) => setNoiseScale(+e.target.value) } min={1} max={ Math.max(width, height) * 2} />
			</label>
			<label>
				Dithering
				<select value={ditheringAlgo} onInput={(e) => setDitheringAlgo(e.target.value)}>
					<option value="none">None</option>
					<option value="floydSteinberg">Floyd-Steinberg</option>
					<option value="stucki">Stucki</option>
					<option value="atkinson">Atkinson</option>
					<option value="stevensonArce">Stevenson-Arce</option>
				</select>
			</label>
			<canvas className={styles['texturizer-canvas']} ref={canvasRef} width={width} height={height} />
			<SwatchGrid width={width} height={height} blocks={textureBlocks} />
		</PaletteContext.Provider>
		<LazyDialog open={helpOpen} onClose={() => setHelpOpen(false)}>
			<GradientHelpContent />
		</LazyDialog>
	</div>;
}
