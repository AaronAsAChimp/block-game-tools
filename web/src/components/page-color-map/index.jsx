import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useRef, useState } from "react";
import { RGBColor } from "shared";
import { BlockMap } from "../block-map/index.jsx";
import { BlockSearch } from "../block-search/index.jsx";
import { MapHelpContent } from "../content/index.jsx";
import { LazyDialog } from "../lazy-dialog/index.jsx";
import { SelectedBlock } from "../selected-block/index.jsx";
import { ContrastContext } from "../../context/contrast-context.js";
import { PaletteContext } from "../../context/palette-context.js";
import { findNearest, loadBlocks } from "../../blocks.js";
import './styles.css';


export function ColorMap() {
	const [searchTerm, setSearchTerm] = useState('');
	const [palette, setPalette] = useState('mostCommon');
	const [selection, setSelection] = useState(null);
	const [helpOpen, setHelpOpen] = useState(false);
	/** @type {React.MutableRefObject<HTMLDivElement>} */
	const rootRef = useRef(null);
	const [blocks, setBlocks] = useState([]);
	const [labels, setLabels] = useState([]);

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
				setBlocks(blocks.blocks)
				setLabels(blocks.labels)
			});
	}, [])

	const blockNameMap = useMemo(() => {
		const result = {};

		if (blocks) {
			for (const block of blocks) {
				result[block.name] = block;
			}
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
			const block = findNearest(blocks, palette, lab);

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
		<PaletteContext.Provider value={palette}>
			<ContrastContext.Provider value={colors}>
				<BlockMap
					labels={labels}
					blocks={blocks}
					selected={selection}
					onSelected={selectionChange}
					onAlphaChange={alphaChange} />

				{/*<AppTitleBar title="Block Game Color Map">*/}
					<BlockSearch value={searchTerm} onChange={searchHandler} blocks={blocks} />
					<label>
						Color Extraction:
						<select className="pallette-select" onInput={paletteChange} value={palette}>
							<option value="average">Average</option>
							<option value="mostSaturated">Most Saturated</option>
							<option value="mostCommon">Most Common</option>
						</select>
					</label>
					<button onClick={() => setHelpOpen(true)}><FontAwesomeIcon icon={faQuestion} /></button>
				{/*</AppTitleBar>*/}
				{ selection
					? <SelectedBlock selected={selection} blocks={blocks} />
					: null}
				
			</ContrastContext.Provider>
		</PaletteContext.Provider>
		<LazyDialog open={helpOpen} onClose={() => setHelpOpen(false)}>
			<MapHelpContent />
		</LazyDialog>
	</div>;
}