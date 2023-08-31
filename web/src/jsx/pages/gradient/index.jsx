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
const DEFAULT_STEPS = 5;


/**
 * A hook for projecting gradient objects to steps.
 * @param  {Gradient} gradient The gradient to project.
 * @param  {number} initialSteps      The number of steps in the gradient
 * @return {[Color[], (steps: number) => void]}
 *   The gradient interpolated to the number of steps and a method to set the number of steps
 */
function useGradientSteps(gradient, initialSteps) {
	const [steps, setSteps] = useState(initialSteps);
	const gradientSteps = useMemo(() => {
		if (gradient && gradient.getStops().length) {
			return gradient.getSteps(steps);
		} else {
			return [];
		}
	}, [gradient, steps]);

	return [
		gradientSteps,
		setSteps
	];
}

export function Component() {
	const {colors: colorsParam} = useParams();
	const [initialStart, initialEnd, initialSteps] = useMemo(() => {
		const colors = colorsParam ? colorsParam.split('-') : [];
		const initialStart = colors.length > 0 ? '#' + colors[0] : null;
		const initialEnd = colors.length > 1 ? '#' + colors[1] : null;
		let initialSteps = DEFAULT_STEPS;

		if (colors.length > 2) {
			const steps = parseInt(colors[2], 10);

			if (steps > MIN_STEPS) {
				initialSteps = steps;
			}
		}

		return [
			initialStart,
			initialEnd,
			initialSteps
		];
	}, [colorsParam]);

	const gradientRef = useRef(new Gradient());
	const gradient = gradientRef.current;

	useEffect(() => {
		gradient.clear(); // In case of re-renders
		gradient.addStop(0, RGBColor.parseCSSHex(initialStart ?? '#000000'));
		gradient.addStop(1, RGBColor.parseCSSHex(initialEnd ?? '#ffffff'));

		rerender()
	}, [initialStart, initialEnd]);

	const [gradientStops, setGradientStops] = useState([]);
	const [numSteps, setNumSteps] = useState(initialSteps ?? DEFAULT_STEPS);
	const [gradientSteps, setGradientSteps] = useState([]);
	const [gradientBg, setGradientBg] = useState('');

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

	// useEffect(() => {
	// 	navigate(`/gradient/${ startColor.substring(1) }-${ endColor.substring(1) }-${ steps }`, {
	// 		replace: true
	// 	});
	// }, [startColor, endColor, steps]);

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