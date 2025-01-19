import { useEffect, useRef, useState } from "react";
import { RGBColor } from "shared/src/color";
import { Gradient } from "shared/src/gradient";
import { GradientKnob } from "../gradient-knob";
import styles from './styles.module.css';


/**
 * @typedef {Object} GradientDisplayProps
 * @prop {(gradient: Gradient) => void} onGradientChange An event fired when the gradient changes
 * @prop {import('shared/src/gradient').SimpleGradientStop[]} initialGradientStops The gradient stops to initialize the editor with.
 */


/**
 * A component for choosing a color for a gradient
 * @param {GradientDisplayProps} props
 */
export function GradientDisplay({onGradientChange, initialGradientStops}) {
	const gradientRef = useRef(new Gradient());
	const gradient = gradientRef.current;

	const [gradientBg, setGradientBg] = useState('');
	const [gradientStops, setGradientStops] = useState([]);
	const gradientDisplayRef = useRef(null);

	useEffect(() => {
		gradient.clear();

		for (const [color, offset] of initialGradientStops) {
			gradient.addStop(offset, color)
		}

		rerender();

		onGradientChange(gradient);
	}, [initialGradientStops]);

	function setStopColor(idx, color) {
		gradient.setStopColor(idx, RGBColor.parseCSSHex(color));

		rerender()

		onGradientChange(gradient);
	}

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

		onGradientChange(gradient);

		rerender()
	}

	function deleteStop(idx) {
		gradient.removeStop(idx);

		onGradientChange(gradient);

		rerender();
	}

	function rerender() {
		setGradientStops([
			...gradient.getStops()
		]);

		setGradientBg(gradient.toCSS());
	}

	function onKnobDown(e) {
		const idx = +e.currentTarget.dataset.stopIdx;
		const labelEl = e.target.closest('label');

		const startX = e.pageX;
		const startY = e.pageY;

		e.preventDefault();
	
		function pointerMove(e) {
			if (Math.abs(e.pageX - startX) > 5 || Math.abs(e.pageY - startY) > 5) {
				labelEl.style.pointerEvents = 'none';
			}

			gradient.setStopOffset(idx, calculateOffset(gradientDisplayRef.current, e.clientX));

			setGradientBg(gradient.toCSS());

			onGradientChange(gradient);
		}

		function pointerUp() {			
			labelEl.style.pointerEvents = '';

			document.removeEventListener('pointermove', pointerMove);
			document.removeEventListener('pointerup', pointerUp);
		}

		document.addEventListener('pointermove', pointerMove);
		document.addEventListener('pointerup', pointerUp);
	}

	return <div className={ styles['gradient-display-container'] }>
		<div className={ styles['gradient-display'] } ref={gradientDisplayRef} style={{ background: gradientBg }} onDoubleClick={(e) => addStop(e.target, e.clientX)}>
		</div>
		{
			gradientStops.map((stop, idx) => {
				return <GradientKnob
					value={stop.color.toCSS()}
					offset={stop.offset}
					key={idx}
					stopIdx={idx}
					onChange={e => {setStopColor(idx, e.target.value)}}
					onDelete={() => deleteStop(idx)}
					onPointerDown={onKnobDown}
				/>
			})
		}
	</div>
}