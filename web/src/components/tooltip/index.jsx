import { createPortal } from "react-dom";

import { useRef, useState } from "react";
import styles from './styles.module.css';

/**
 * @typedef {Object} TooltipWrapperProps
 * @property {string} title
 * @property {string} [className]
 */

/**
 * A wrapper component that will add a tooltip to the wrapped component.
 *
 * @param {import('react').PropsWithChildren<TooltipWrapperProps>} props
 */
export function TooltipWrapper({title, className='', children}) {
	const [xy, setXy] = useState({x: 0, y: 0});
	const [visible, setVisible] = useState(false);
	const wrapperRef = useRef();

	function updateXy(e) {
		setXy({x: e.pageX, y: e.pageY});
	}

	function showTooltip() {
		setVisible(true);
	}

	function hideTooltip() {
		setVisible(false)
	}

	return <div className={className} ref={wrapperRef} onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateXy}>
		{ children }
		{ (title && visible) ? <Tooltip title={title} x={xy.x} y={xy.y} /> : null }
	</div>
}

/**
 * @typedef {Object} TooltipProps
 * @property {string} title
 * @property {number} x
 * @property {number} y
 */

/**
 * A tooltip.
 *
 * @param {TooltipProps} props
 */
export function Tooltip({title, x, y}) {
	return <>{
		createPortal(
			<div className={styles['info-tooltip']} style={{top: y + 'px', left: x + 'px'}}>{ title }</div>,
			document.body
		)
	}</>
}