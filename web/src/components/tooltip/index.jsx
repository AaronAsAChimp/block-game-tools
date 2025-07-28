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
	const [visible, setVisible] = useState(false);
	/** @type {import('react').MutableRefObject<HTMLDivElement>} */
	const tooltipRef = useRef();

	function updateXy(e) {
		if (tooltipRef.current && tooltipRef.current instanceof HTMLElement) {
			const bodyRect = tooltipRef.current.getBoundingClientRect();
			const windowWidth = window.innerWidth;

			tooltipRef.current.style.top = e.pageY + 'px';

			if ((e.pageX + bodyRect.width) > windowWidth) {
				tooltipRef.current.style.right = (windowWidth - e.pageX + 20) + 'px';
				tooltipRef.current.style.left = null;
			} else {
				tooltipRef.current.style.right = null;	
				tooltipRef.current.style.left = e.pageX + 'px';	
			}
		}
	}

	function showTooltip() {
		setVisible(true);
	}

	function hideTooltip() {
		setVisible(false);
	}

	return <div className={className} onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={updateXy}>
		{ children }
		{ (title && visible) ? createPortal(
			<div ref={tooltipRef} className={styles['info-tooltip']}>{title}</div>,
			document.body
		) : null }
	</div>
}
