import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { buildGradientParam, parseGradientParam } from "shared/src/gradient";
// import { AppTitleBar } from "../../../components/app-title-bar";
import { GradientHelpContent } from "../content";
import { GradientDisplay } from "../gradient-display";
import { LazyDialog } from "../lazy-dialog";
import { Share } from "../share";
import { TextureSwatch } from "../texture-swatch";
import { PaletteContext } from "../../context/palette-context";
import { BlockLookup, loadBlocks } from "../../blocks";
import './styles.css';

const MIN_STEPS = 0;
const DEFAULT_START = 0x000000;
const DEFAULT_END = 0xFFFFFF;
const DEFAULT_STEPS = 5;

const TextureSwatchMemo = memo(TextureSwatch);

/**
 * @typedef {[import('shared/src/gradient').Gradient, number]} InitialGradient
 */

export function Gradient() {
	const gradientRef = useRef(null);

	const [numSteps, setNumSteps] = useState(DEFAULT_STEPS);
	const [gradientSteps, setGradientSteps] = useState([]);
	const [initialStops, setInitialStops] = useState([]);
	const [blocks, setBlocks] = useState([]);

	useEffect(() => {
		const params = new URLSearchParams(document.location.search)
		const gradientDef = params.get('g');
		console.log(gradientDef);

		const {steps, stops} = parseGradientParam(gradientDef);

		setInitialStops(stops);

		setNumSteps(steps);
	}, []);

	function stepsChange(e) {
		const num = +e.target.value;

		if (num >= MIN_STEPS) {
			setNumSteps(num);

			if (gradientRef.current) {
				setGradientSteps([
					...gradientRef.current.getSteps(num)
				]);
			}
		}
	}

	// const navigate = useNavigate();

	const [palette, setPalette] = useState('average');
	const [helpOpen, setHelpOpen] = useState(false);

	useEffect(() => {
		loadBlocks('gradient-blocks')
			.then((blocks) => {
				setBlocks(blocks.blocks)
			});
	}, [])

	const blockLookup = useMemo(() => {
		if (blocks && blocks.length) {
			return new BlockLookup(blocks);
		}

		return null;
	}, [blocks]);

	function paletteChange(e) {
		const select = e.target;
		setPalette(select.options[select.selectedIndex].value);
	}

	useEffect(() => {
		window.history.replaceState(null, null, '?g=' + buildGradientParam(gradientRef.current, numSteps));
	}, [gradientSteps])

	function gradientChange(gradient) {
		gradientRef.current = gradient;

		if (gradientRef.current !== null && gradientRef.current.getStops().length) {
			setGradientSteps([
				...gradient.getSteps(numSteps)
			]);
		}
	}

	/**
	 * 
	 * @param  {MouseEvent} e
	 */
    // function onSchematicDownload(e) {
    //     if (e.currentTarget instanceof HTMLAnchorElement) {
    //     	const schematic = new LitematicaSchematic({}, )
    //     	e.currentTarget.href = 'data:application/octet-stream;base64,' + btoa()
    //     }
    // }

	return <div className="page-gradient">
		<PaletteContext.Provider value={palette}>
			{/*<AppTitleBar title="Gradient Editor">*/}
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
			<div className="gradient-editor">
				<div className="gradient-display-panel">
					<GradientDisplay onGradientChange={gradientChange} initialGradientStops={initialStops} />
				</div>

				<div className="gradient-controls">
					<label>
						Number of blocks:
						<input type="number" min={MIN_STEPS} onInput={stepsChange} value={numSteps} />
					</label>
{/*					<a onClick={ onSchematicDownload } download="schematic.lightmatic">
						Schematic
					</a>*/}
				</div>

				<div className="gradient-share">
					<Share href={window.location} subject="Block Game Tools - Block Gradient" body="" />
				</div>

				<div className="gradient-swatches">
					{ gradientSteps.length && blockLookup
						? gradientSteps.map((color, idx) => {
							const blockMatch = blockLookup.find(color, palette);

							return <div className="gradient-swatch-container" key={idx}>
								<TextureSwatchMemo block={blockMatch.block} title={Math.sqrt(blockMatch.magnitude) >= 10 ? 'Out of gamut' : null } />
							</div>
						})
						: null
					}
				</div>
			</div>
		</PaletteContext.Provider>
		<LazyDialog open={helpOpen} onClose={() => setHelpOpen(false)}>
			<GradientHelpContent />
		</LazyDialog>
	</div>;
}