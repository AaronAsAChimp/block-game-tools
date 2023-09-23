import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import { Color, RGBColor } from "shared/src/color";
import { Gradient } from "shared/src/gradient.js";
import { AppTitleBar } from "../../../components/app-title-bar";
import { GradientHelpContent } from "../../../components/content";
import { LazyDialog } from "../../../components/lazy-dialog";
import { Share } from "../../../components/share";
import { TextureSwatch } from "../../../components/texture-swatch";
import { PaletteContext } from "../../../context/palette-context";
import { BlockLookup } from "../../blocks";
import './styles.css';
import { GradientDisplay } from "../../../components/gradient-display";

const MIN_STEPS = 0;
const DEFAULT_START = 0x000000;
const DEFAULT_END = 0xFFFFFF;
const DEFAULT_STEPS = 5;

const ShareMemo = memo(Share);
const TextureSwatchMemo = memo(TextureSwatch);

/**
 * @typedef {[Gradient, number]} InitialGradient
 */

function parseSteps(steps) {
	if (steps && steps.length) {
		 return parseInt(steps, 10);
	} else {
		return DEFAULT_STEPS;
	}
}

/**
 * Parse the gradient paraemter in the form of:
 *
 * FFFFFF-000000-12
 * FFFFFF@20-000000@40-12
 * 
 * @param  {string} colorsParam 
 * @returns {{steps: number, stops: import("../../../components/gradient-display").GradientStop[]}}
 */
function parseGradientParam(colorsParam) {
	if (!colorsParam) {
		colorsParam = '';
	}

	const colorParts = colorsParam.split('-');
	const steps = parseSteps(colorParts.pop());
	/** @type {[Color, number?][]} */
	const stops = [];

	for (const part of colorParts) {
		const [color, percent] = part.split('@');

		stops.push([RGBColor.parseCSSHex('#' + color), percent ? parseFloat(percent) / 100 : null])
	}

	if (stops.length === 0) {
		stops.push([RGBColor.fromInteger(DEFAULT_START), 0]);
		stops.push([RGBColor.fromInteger(DEFAULT_END), 1]);
	}

	if (!stops[0][1]) {
		stops[0][1] = 0;
	}

	if (!stops[stops.length - 1][1]) {
		stops[stops.length - 1][1] = 1;
	}

	return {
		steps,
		stops
	}
}

/**
 * Build the gradient parameter in the form of:
 *
 * FFFFFF@20-000000@40-12
 *  
 * @param  {Gradient} gradient
 * @param  {number} numSteps
 * @return  {string} The color param
 */
function buildGradientParam(gradient, numSteps) {
	const stops = gradient.getStops();
	let url = '';

	for (const stop of stops) {
		url += stop.color.toCSS().substring(1) + '@' + (Math.floor(stop.offset * 10000) / 100) + '-';
	}

	return url + numSteps;
}


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
				<GradientDisplay onGradientChange={gradientChange} initialGradientStops={initialStops} />

				<div className="gradient-controls">
					<label>
						Number of blocks:
						<input type="number" min={MIN_STEPS} onInput={stepsChange} value={numSteps} />
					</label>
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