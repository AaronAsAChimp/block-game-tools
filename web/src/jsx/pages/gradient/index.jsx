import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import { Color, RGBColor } from "shared/src/color";
import { Gradient } from "shared/src/gradient";
import { AppTitleBar } from "../../../components/app-title-bar";
import { GradientHelpContent } from "../../../components/content";
import { GradientKnob } from "../../../components/gradient-knob";
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
 * @returns {{steps: number, stops: [Color, number?][]}}
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

	const gradientRef = useRef(new Gradient());
	const gradient = gradientRef.current;

	const [numSteps, setNumSteps] = useState(DEFAULT_STEPS);
	const [gradientStops, setGradientStops] = useState([]);
	const [gradientSteps, setGradientSteps] = useState([]);
	const [gradientBg, setGradientBg] = useState('');

	useEffect(() => {
		gradient.clear(); // In case of re-renders

		const {steps, stops} = parseGradientParam(colorsParam);

		for (const [color, offset] of stops) {
			gradient.addStop(offset, color)
		}

		setGradientStops([
			...gradient.getStops()
		]);

		setGradientBg(gradient.toCSS());

		setNumSteps(steps);

		setGradientSteps([
			...gradient.getSteps(steps)
		]);
	}, []);

	function calculateOffset(ele, x) {
		const rect = ele.getBoundingClientRect();

		return (x - rect.left) / rect.width;
	}

	/**
	 * Add a stop to the gradient
	 * @param {HTMLElement} target The gradient display
	 * @param {number} x
	 */
	function addStop(target, x) {
		const offset = calculateOffset(target, x);

		gradient.addStop(offset, gradient.interpolate(offset));

		rerender()
	}

	function deleteStop(idx) {
		gradient.removeStop(idx);

		rerender();
	}

	function setStopColor(idx, color) {
		gradient.setStopColor(idx, RGBColor.parseCSSHex(color));

		rerender()
	}


	const [isDragging, setIsDragging] = useState(false);
	const gradientDisplayRef = useRef(null);

	function onKnobDown(e) {
		const idx = +e.currentTarget.dataset.stopIdx;

		setIsDragging(true);
	
		function pointerMove(e) {
			gradient.setStopOffset(idx, calculateOffset(gradientDisplayRef.current, e.clientX));

			const steps = gradient.getSteps(numSteps);

			setGradientBg(gradient.toCSS());

			setGradientSteps([
				...steps
			]);
		}

		function pointerUp() {
			setIsDragging(false);

			document.removeEventListener('pointermove', pointerMove);
			document.removeEventListener('pointerup', pointerUp);
		}

		document.addEventListener('pointermove', pointerMove);
		document.addEventListener('pointerup', pointerUp);
	}


	function stepsChange(e) {
		const num = +e.target.value;

		if (num >= MIN_STEPS) {
			setNumSteps(num);
			setGradientSteps([
				...gradient.getSteps(num)
			]);
		}
	}

	function rerender() {
		setGradientStops([
			...gradient.getStops()
		]);

		setGradientBg(gradient.toCSS());

		console.log('rerender', numSteps);

		setGradientSteps([
			...gradient.getSteps(numSteps)
		]);
	}

	const navigate = useNavigate();

	const [palette, setPalette] = useState('average');
	const [helpOpen, setHelpOpen] = useState(false);
	// const [steps, setSteps] = useState(initialSteps ?? DEFAULT_STEPS);

	/** @type {import("../../server").BlocksResponse} */
	const blocks = useLoaderData();

	const blockLookup = useMemo(() => {
		return new BlockLookup(blocks.blocks);
	}, [blocks]);

	useEffect(() => {
		navigate(`/gradient/${ buildGradientParam(gradient, numSteps) }`, {
			replace: true
		});
	}, [numSteps, gradientStops, isDragging]);

	function paletteChange(e) {
		const select = e.target;
		setPalette(select.options[select.selectedIndex].value);
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
				<div className="gradient-display-container">
					<div className="gradient-display" ref={gradientDisplayRef} style={{ background: gradientBg }} onDoubleClick={(e) => addStop(e.target, e.clientX)}>
					</div>
					{
						gradientStops.map((stop, idx) => {
							return <GradientKnob
								value={stop.color.toCSS()}
								offset={stop.offset}
								key={idx}
								stopIdx={idx}
								onChange={e => {setStopColor(idx, e.target.value)}}
								onDelete={e => deleteStop(idx)}
								onPointerDown={onKnobDown}
							/>
						})
					}
				</div>

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
					{ gradientStops.length
						? gradientSteps.map((color, idx) => {
							const blockMatch = blockLookup.find(color, palette);

							return <div className="gradient-swatch-container" key={idx}>
								<TextureSwatch block={blockMatch.block} title={Math.sqrt(blockMatch.magnitude) >= 10 ? 'Out of gamut' : null } />
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