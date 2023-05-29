import { createPortal } from "react-dom";

import { useRef, useState } from "react";
import * as styles from './styles.module.css';

export function TooltipWrapper({title, className='', children}) {
	const [xy, setXy] = useState({x: 0, y: 0});
	const [visible, setVisible] = useState(false);
	const wrapperRef = useRef();

	function updateXy(e) {
		setXy({x: e.clientX, y: e.clientY});
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

export function Tooltip({title, x, y}) {
	return <>{
		createPortal(
			<div className={styles['info-tooltip']} style={{top: y + 'px', left: x + 'px'}}>{ title }</div>,
			document.body
		)
	}</>
}