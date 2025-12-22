import { memo, useEffect, useMemo, useRef, useState } from "react";
import { TextureSwatch } from "../texture-swatch";
import { PaletteContext } from "../../context/palette-context";
import { BlockLookup, loadBlocks } from "../../blocks";
import { paletteStore } from '../../context/palette-store';

import styles from './styles.module.css';
import { useStore } from '@nanostores/react';
import { artGenOptionsStore, loadImageFromFile } from '../../context/art-store.js';
import { imageAsBlocks } from '../../image.js';
import { blockGrid } from '../../context/block-grid-store.js';

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


export function ArtBlocker() {
	/** @type {React.MutableRefObject<HTMLCanvasElement>} */
	const canvasRef = useRef(null);

	/** @type {React.MutableRefObject<HTMLDivElement>} */
	const dropperRef = useRef(null);

	const texturizerOptions = useStore(artGenOptionsStore);
	const textureBlocks = useStore(blockGrid);
	const [imageData, setImageData] = useState(null);

	const [blocks, setBlocks] = useState([]);
	const [dragging, setDraggingg] = useState(false);
	const [dragOver, setDragOver] = useState(false);

	const palette = useStore(paletteStore);

	useEffect(() => {
		paletteStore.set('average');

		loadBlocks('gradient-blocks')
			.then((blocks) => {
				setBlocks(blocks.blocks)
			});

		const dropperEl = dropperRef.current;

		/**
		 * @param  {DragEvent} e 
		 */
		function onDragOver(e) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
		}

		function initDragDrop(e) {
			setDraggingg(true);
			setDragOver(true);
			dropperEl.addEventListener('dragover', onDragOver);
			dropperEl.addEventListener('dragleave', onDragLeave);
			dropperEl.addEventListener('drop', onDrop);
		}

		function onDragLeave() {
			setDragOver(false);
		}

		/**
		 * @param  {DragEvent} e 
		 */
		function onDrop(e) {
			e.preventDefault();

			if (e.dataTransfer.files.length) {
				console.log('drop', e.dataTransfer.files[0]);

				loadImageFromFile(e.dataTransfer.files[0]);
			}

			setDraggingg(false);
			setDragOver(false);
			dropperEl.removeEventListener('dragover', onDragOver);
			dropperEl.removeEventListener('dragleave', onDragLeave);
			dropperEl.removeEventListener('drop', onDrop);
		}

		dropperEl.addEventListener('dragenter', initDragDrop);

		return () => {
			dropperEl.removeEventListener('dragenter', initDragDrop)
		}
	}, [])


	const blockLookup = useMemo(() => {
		if (!(blocks && blocks.length)) {
			return null;
		}

		const globalBlockLookup = new BlockLookup(blocks);
		let blockLookup = globalBlockLookup;

		return blockLookup;
	}, [palette, blocks]);

	useEffect(() => {
		const width = texturizerOptions.width;
		const height = texturizerOptions.height;

		if (width <= 0 || height <= 0) {
			return;
		}

		if (!blockLookup) {
			console.log('No block lookup.');
			return;
		}

		if (!imageData) {
			console.log('No image data lookup.');
			return;
		}

		const ctx = canvasRef.current.getContext('2d');

		const textureBlocks = imageAsBlocks(imageData, palette, texturizerOptions.ditheringAlgo, blockLookup);

		blockGrid.set(textureBlocks);

		ctx.putImageData(imageData, 0, 0);

	}, [texturizerOptions, palette, blockLookup, imageData])


	useEffect(() => {
		const image = texturizerOptions.image;

		if (!image) {
			return;
		}

		if (texturizerOptions.width > 0 && texturizerOptions.height > 0) {
			const canvas = canvasRef.current;
			const ctx = canvas.getContext('2d');

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

			setImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
		}
	}, [texturizerOptions.image, texturizerOptions.width, texturizerOptions.height, texturizerOptions.ditheringAlgo])


	return <div ref={dropperRef} className={ styles['art-container'] + (dragOver ? ' ' + styles['accepts-drop'] : '') }>
		<PaletteContext.Provider value={palette}>
			{
				texturizerOptions.image
					? <>
						<canvas className={styles['texturizer-canvas']} ref={canvasRef} width={texturizerOptions.width} height={texturizerOptions.height} />
						<SwatchGrid width={texturizerOptions.width} height={texturizerOptions.height} blocks={textureBlocks} />
					</> 
					: <div className={styles['art-placeholder']}>Drag and drop an image here to begin.</div>
			}
		</PaletteContext.Provider>
	</div>;
}
