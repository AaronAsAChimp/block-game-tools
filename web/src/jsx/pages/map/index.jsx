import { memo, useMemo, useRef, useState } from "react";
import { useLoaderData } from "react-router-dom";

import { AppTitleBar } from "../../../components/app-title-bar/index.jsx";
import { BlockSearch } from "../../../components/block-search/index.jsx";
import { BlockMap } from "../../../components/block-map/index.jsx";
import { SelectedBlock } from "../../../components/selected-block/index.jsx";
import { PaletteContext } from "../../../context/palette-context.js";
import { ContrastContext } from "../../../context/contrast-context.js";
import { findNearest } from "../../blocks.js";
import { RGBColor } from "shared/src/color.js";

import './styles.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import { LazyDialog } from "../../../components/lazy-dialog/index.jsx";
import { MapHelpContent } from "../../../components/content/index.jsx";

/**
 * @typedef {import('../../server.d.ts').BlocksResponse} BlocksResponse
 */

export function Component() {
	const [searchTerm, setSearchTerm] = useState('');
	const [palette, setPalette] = useState('mostCommon');
	const [selection, setSelection] = useState(null);
	const [helpOpen, setHelpOpen] = useState(false);
	const rootRef = useRef(null);
	const initialColors = useMemo(function () {
		const root = rootRef.current;

		if (!root) {
			return {
				color: null,
				inverse: null
			}
		}

		const props = window.getComputedStyle(root);

		return {
			color: props['background-color'],
			inverse: props['color']
		}
	}, [rootRef.current]);
	const [colors, setColors] = useState(null);

	/** @type {BlocksResponse} */
	const blocks = useLoaderData();

	const blockNameMap = useMemo(() => {
		const result = {};

		for (const block of blocks.blocks) {
			result[block.name] = block;
		}

		return result;
	}, [blocks]);

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
			const block = findNearest(blocks.blocks, palette, lab);

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
			setSelection(cube);
		}
	}

	function paletteChange(e) {
		const select = e.target;
		setPalette(select.options[select.selectedIndex].value);
	}

	function selectionChange(selection) {
		setSelection(selection);
	}

	function alphaChange(alpha) {
		const root = rootRef.current;
		const colors = {
			color: alpha > 0.5 ? initialColors.color : initialColors.inverse,
			inverse: alpha > 0.5 ? initialColors.inverse : initialColors.color
		};

		setColors(colors);

		if (root) {
			root.style.setProperty('--background-color', colors.color);
			root.style.setProperty('--inverse-color', colors.inverse);
		}
	}

	return <div className="page-map" ref={rootRef}>
		<PaletteContext.Provider value={palette}>
			<ContrastContext.Provider value={colors}>
				<BlockMap
					labels={blocks.labels}
					blocks={blocks.blocks}
					selected={selection}
					onSelected={selectionChange}
					onAlphaChange={alphaChange} />

				<AppTitleBar title="Block Game Color Map">
					<BlockSearch value={searchTerm} onChange={searchHandler} blocks={blocks.blocks} />
					<label>
						Color Extraction:
						<select className="pallette-select" onInput={paletteChange} value={palette}>
							<option value="average">Average</option>
							<option value="mostSaturated">Most Saturated</option>
							<option value="mostCommon">Most Common</option>
						</select>
					</label>
					<button onClick={() => setHelpOpen(true)}><FontAwesomeIcon icon={faQuestion} /></button>
				</AppTitleBar>
				<SelectedBlock selected={selection} blocks={blocks.blocks} />
			</ContrastContext.Provider>
		</PaletteContext.Provider>
		<LazyDialog open={helpOpen} onClose={() => setHelpOpen(false)}>
			<MapHelpContent />
		</LazyDialog>
	</div>;
}
