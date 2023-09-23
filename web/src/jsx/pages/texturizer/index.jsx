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

export function Component() {
	/** @type {React.MutableRefObject<HTMLCanvasElement>} */
	const canvasRef = useRef(null);
	const noiserRef = useRef(null);
	const [width, setWidth] = useState(DEFAULT_SIZE);
	const [height, setHeight] = useState(DEFAULT_SIZE);
	const [noiseScale, setNoiseScale] = useState(1);
	const [textureBlocks, setTextureBlocks] = useState(null);

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

		gradient.addStop(0, RGBColor.fromInteger(0x33252e));
		gradient.addStop(0.4437, RGBColor.fromInteger(0xff9b1b));
		gradient.addStop(0.7281, RGBColor.fromInteger(0xfbd26f));
		gradient.addStop(1, RGBColor.fromInteger(0xffe1b8));

		// gradient.addStop(0, RGBColor.fromInteger(0x20180d));
		// gradient.addStop(1, RGBColor.fromInteger(0x207d3d));


		for (let x = 0; x < width; x++) {
			for (let y = 0; y < width; y++) {
				const noise = (noiserRef.current(x/noiseScale, y/noiseScale) / 2) + 0.5;
				const red = y * (width * 4) + x * 4;
				const color = gradient.interpolate(noise).toRGBColor();

				console.log(noise);

				pixels.data[red] = color.r;
				pixels.data[red + 1] = color.g;
				pixels.data[red + 2] = color.b;
				pixels.data[red + 3] = 255;
			}
		}

		const blocks = new Array(pixels.data.length / 4);

		for (let pixelIdx = 0; pixelIdx < pixels.data.length / 4; pixelIdx++) {
			const red = pixelIdx * 4;
			const blockColor = new RGBColor(pixels.data[red], pixels.data[red + 1], pixels.data[red + 2]);

			blocks.push(blockLookup.find(blockColor, palette).block);
		}

		setTextureBlocks(blocks);

		// pixels.data[0] = 255;
		// pixels.data[1] = 0;
		// pixels.data[2] = 0;
		// pixels.data[3] = 255;

		ctx.putImageData(pixels, 0, 0);
	}, [width, height, noiseScale, palette])

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
			<input type="range" value={noiseScale} onInput={ (e) => setNoiseScale(+e.target.value) } min={1} max={ Math.max(width, height) * 2} />
			<canvas className={styles['texturizer-canvas']} ref={canvasRef} width={width} height={height} />
			<SwatchGrid width={width} height={height} blocks={textureBlocks} />
		</PaletteContext.Provider>
		<LazyDialog open={helpOpen} onClose={() => setHelpOpen(false)}>
			<GradientHelpContent />
		</LazyDialog>
	</div>;
}
