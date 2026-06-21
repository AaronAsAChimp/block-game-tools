import { memo, useEffect, useMemo, useRef, useState } from "react";
import classnames from 'classnames';
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


function Minimap({naturalWidth, naturalHeight}) {
	const imageAspectRatio = naturalWidth / naturalHeight;
	const [viewWidth, setViewWidth] = useState(1);
	const [viewHeight, setViewHeight] = useState(1);
	const observerRef = useRef(null);

	/** @type {React.RefObject<HTMLDivElement>} */
	const minimapRef = useRef();

	const scrollParent = useMemo(() => {
		/** @type {HTMLElement} */
		let parentEl = minimapRef.current;
		let scrollParentEl = null;

		if (!parentEl) {
			return;
		}

		while (parentEl.parentElement && !scrollParentEl) {
			const style = getComputedStyle(parentEl);

			if (style.overflow === 'auto' || style.overflow === 'scroll') {
				scrollParentEl = parentEl;
			}

			parentEl = parentEl.parentElement;
		}

		const rect = scrollParentEl.getBoundingClientRect();

		setViewWidth(rect.width);
		setViewHeight(rect.height);

		console.log('Rect', rect.width, rect.height);

		return scrollParentEl;
	}, [minimapRef.current]);

	function onScrollHandler(e) {
		const cursor = minimapRef.current.children[0];

		if (cursor instanceof HTMLElement) {
			const scroller = e.currentTarget;

			cursor.style.top = ((scroller.scrollTop / scroller.scrollHeight) * 100) + '%';
			cursor.style.left = ((scroller.scrollLeft / scroller.scrollWidth) * 100) + '%';

			// console.log('top', e.currentTarget.scrollTop, ((naturalHeight * 64) - viewHeight));
			console.log('left', (scroller.scrollLeft / scroller.scrollWidth));
			// console.log('left', naturalWidth);
		}
	}

	useEffect(() => {
		if (!scrollParent) {
			return;
		}

		scrollParent.addEventListener('scroll', onScrollHandler, {
			passive: true
		});

		observerRef.current = new ResizeObserver((entries) => {
			const entry = entries[0];
			const rect = entry.contentRect

			setViewWidth(rect.width);
			setViewHeight(rect.height);

			console.log('Rect', rect.width, rect.height);
		});

		observerRef.current.observe(scrollParent);		

		return () => {
			scrollParent.removeEventListener('scroll', onScrollHandler);

			observerRef.current.unobserve(scrollParent);
			observerRef.current = null;
		}
	}, [scrollParent, naturalHeight, naturalWidth]);

	return <div ref={minimapRef} className={classnames(styles['minimap'], imageAspectRatio > 1 ? styles['wide'] : styles['tall'])} style={{ aspectRatio: imageAspectRatio }}>
		<div className={styles['minimap-cursor']} style={{ aspectRatio: viewWidth / viewHeight, width: ((viewWidth / (naturalWidth * 64)) * 100) + '%' }}></div>
	</div>
}


export function ArtBlocker() {
	/** @type {React.RefObject<HTMLCanvasElement>} */
	const canvasRef = useRef(null);

	/** @type {React.RefObject<HTMLDivElement>} */
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


	return <div ref={dropperRef} className={classnames([
			styles['art-container'],
			{
				[styles['accepts-drop']]: dragOver,
				[styles['no-image']]: !texturizerOptions.image
			}
		])}>
		<PaletteContext.Provider value={palette}>
			{
				texturizerOptions.image
					? <>
						{ imageData
							? <Minimap naturalWidth={imageData.width} naturalHeight={imageData.height} viewWidth={texturizerOptions.width * 64} viewHeight={texturizerOptions.height * 64} scale={64} />
							: null }
						<canvas className={styles['texturizer-canvas']} ref={canvasRef} width={texturizerOptions.width} height={texturizerOptions.height} />
						<SwatchGrid width={texturizerOptions.width} height={texturizerOptions.height} blocks={textureBlocks} />
					</> 
					: <div className={styles['art-placeholder']}>Drag and drop an image here to begin.</div>
			}
		</PaletteContext.Provider>
	</div>;
}
