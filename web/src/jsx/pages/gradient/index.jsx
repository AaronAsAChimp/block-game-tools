import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import { buildGradientParam, parseGradientParam } from "shared/src/gradient";
import { AppTitleBar } from "../../../components/app-title-bar";
import { GradientHelpContent } from "../../../components/content";
import { GradientDisplay } from "../../../components/gradient-display";
import { LazyDialog } from "../../../components/lazy-dialog";
import { Share } from "../../../components/share";
import { TextureSwatch } from "../../../components/texture-swatch";
import { PaletteContext } from "../../../context/palette-context";
import { BlockLookup } from "../../blocks";
import './styles.css';

const MIN_STEPS = 0;
const DEFAULT_START = 0x000000;
const DEFAULT_END = 0xFFFFFF;
const DEFAULT_STEPS = 5;

const TextureSwatchMemo = memo(TextureSwatch);

/**
 * @typedef {[import('shared/src/gradient').Gradient, number]} InitialGradient
 */

export function Component() {
	const {colors: colorsParam} = useParams();

	const gradientRef = useRef(null);

	const [numSteps, setNumSteps] = useState(DEFAULT_STEPS);
	const [gradientSteps, setGradientSteps] = useState([]);
	const [initialStops, setInitialStops] = useState([]);

	useEffect(() => {
		const {steps, stops} = parseGradientParam(colorsParam);

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

	const navigate = useNavigate();

	const [palette, setPalette] = useState('average');
	const [helpOpen, setHelpOpen] = useState(false);

	/** @type {import("../../server").BlocksResponse} */
	const blocks = useLoaderData();

	const blockLookup = useMemo(() => {
		return new BlockLookup(blocks.blocks);
	}, [blocks]);

	function paletteChange(e) {
		const select = e.target;
		setPalette(select.options[select.selectedIndex].value);
	}

	useEffect(() => {
		navigate(`/gradient/${ buildGradientParam(gradientRef.current, numSteps) }`, {
			replace: true
		});
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
			<AppTitleBar title="Gradient Editor">
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
					{ gradientSteps.length
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