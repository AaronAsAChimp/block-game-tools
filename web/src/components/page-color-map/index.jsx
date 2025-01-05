import { useEffect, useMemo, useRef, useState } from "react";
import { RGBColor } from "shared";
import { BlockMap } from "../block-map/index.jsx";
import { BlockSearch } from "../block-search/index.jsx";
import { ContrastContext } from "../../context/contrast-context.js";
import { paletteStore } from '../../context/palette-store.js';
import { findNearest, loadBlocks } from "../../blocks.js";
import './styles.css';
import { useStore } from '@nanostores/react';
import { blockMapOptionsStore } from '../../context/block-map-store.js';


export function ColorMap() {
	const [searchTerm, setSearchTerm] = useState('');
	const palette = useStore(paletteStore);
	/** @type {React.MutableRefObject<HTMLDivElement>} */
	const rootRef = useRef(null);
	const [labels, setLabels] = useState([]);
	const blockMapOptions = useStore(blockMapOptionsStore);

	const initialColors = useMemo(function () {
		let color = null;
		let inverse = null;

		if (rootRef.current) {
			const root = rootRef.current.closest('.page-map');
			const props = window.getComputedStyle(root);

			if (root) {
				color = props['background-color'];
				inverse = props['color'];
			}
		}

		return {
			color,
			inverse
		}
	}, [rootRef.current]);
	const [colors, setColors] = useState(null);
	
	useEffect(() => {
		loadBlocks('blocks')
			.then((blocks) => {
				blockMapOptionsStore.set({
					...blockMapOptions,
					blocks: blocks.blocks
				})
				setLabels(blocks.labels)
			});
	}, [])

	const blockNameMap = useMemo(() => {
		const result = {};
		const blocks = blockMapOptions.blocks;

		if (blocks) {
			for (const block of blocks) {
				result[block.name] = block;
			}
		}

		return result;
	}, [blockMapOptions.blocks]);

	function searchHandler(e) {
		const term = e.target.value.trim();
		let cube;

		setSearchTerm(e.target.value);

		// Attempt to parse the term as a color, all of the checks happen internally
		// to the parsing method.
		const color = RGBColor.parseCSSHex(term);

		// This logic is for special search types
		if (color !== null) {
			const lab = color.toLabColor();
			const block = findNearest(blockMapOptions.blocks, palette, lab);

			// TODO: consider refactoring this code to not use the name to look up
			//       the cube from the block.
			cube = blockNameMap[block.name];
		}

		// If no special search types were found just look it up if it were a name.
		if (!cube) {
			cube = blockNameMap[term];
		}

		// console.log('selected', cube);

		if (cube) {
			blockMapOptionsStore.set({
				...blockMapOptions,
				selected: cube
			});
		}
	}

	function selectionChange(selection) {
		blockMapOptionsStore.set({
			...blockMapOptions,
			selected: selection
		});
	}

	function alphaChange(alpha) {
		const root = rootRef.current.closest('.page-map');
		const colors = {
			color: alpha > 0.5 ? initialColors.color : initialColors.inverse,
			inverse: alpha > 0.5 ? initialColors.inverse : initialColors.color
		};

		setColors(colors);

		if (root instanceof HTMLElement) {
			root.style.setProperty('--background-color', colors.color);
			root.style.setProperty('--inverse-color', colors.inverse);
		}
	}

	return <div ref={rootRef}>
		<ContrastContext.Provider value={colors}>
			<BlockMap
				labels={labels}
				blocks={blockMapOptions.blocks}
				selected={blockMapOptions.selected}
				onSelected={selectionChange}
				onAlphaChange={alphaChange} />

			<BlockSearch value={searchTerm} onChange={searchHandler} blocks={blockMapOptions.blocks} />			
		</ContrastContext.Provider>
	</div>;
}
