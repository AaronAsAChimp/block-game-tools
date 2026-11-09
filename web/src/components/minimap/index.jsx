import { useState } from 'react';
import styles from './styles.module.css';
import { useRef } from 'react';
import { useMemo } from 'react';
import { useEffect } from 'react';
import classNames from 'classnames';

/**
 * @typedef {Object} MinimapProps
 * @property {number} naturalWidth
 * @property {number} naturalHeight
 * @property {number} scale
 * @property {React.RefObject<HTMLCanvasElement | null>} ref
 */

/**
 * A component that represents a minimp
 *
 * @param {MinimapProps} options
 */
export function Minimap({naturalWidth, naturalHeight, scale, ref}) {
	const imageAspectRatio = naturalWidth / naturalHeight;
	const [viewWidth, setViewWidth] = useState(1);
	const [viewHeight, setViewHeight] = useState(1);

	/** @type {React.RefObject<ResizeObserver | null>} */
	const observerRef = useRef(null);

	/** @type {React.RefObject<HTMLDivElement | null>} */
	const minimapRef = useRef(null);

	/** @type {React.RefObject<HTMLDivElement | null>} */
	const cursorRef = useRef(null);

	const scrollParent = useMemo(() => {
		/** @type {HTMLElement | null} */
		let parentEl = minimapRef.current;

		/** @type {HTMLElement | null} */
		let scrollParentEl = null;

		if (!parentEl) {
			return null;
		}

		while (parentEl.parentElement && !scrollParentEl) {
			const style = getComputedStyle(parentEl);

			if (style.overflow === 'auto' || style.overflow === 'scroll') {
				scrollParentEl = parentEl;
			}

			parentEl = parentEl.parentElement;
		}

		if (!scrollParentEl) {
			return null;
		}

		const rect = scrollParentEl.getBoundingClientRect();

		setViewWidth(rect.width);
		setViewHeight(rect.height);

		console.log('Rect', rect.width, rect.height);

		return scrollParentEl;
	}, [minimapRef.current]);

	function onScrollHandler(e) {
		const cursor = cursorRef.current;

		if (cursor instanceof HTMLElement) {
			const scroller = e.currentTarget;

			cursor.style.top = ((scroller.scrollTop / scroller.scrollHeight) * 100) + '%';
			cursor.style.left = ((scroller.scrollLeft / scroller.scrollWidth) * 100) + '%';

			// console.log('top', e.currentTarget.scrollTop, ((naturalHeight * 64) - viewHeight));
			// console.log('left', (scroller.scrollLeft / scroller.scrollWidth));
			// console.log('left', naturalWidth);
		}
	}

	useEffect(() => {
		if (!scrollParent) {
			return;
		}

		scrollParent.addEventListener('scroll', onScrollHandler, {
			passive: true
		});

		observerRef.current = new ResizeObserver((entries) => {
			const entry = entries[0];
			const rect = entry.contentRect

			setViewWidth(rect.width);
			setViewHeight(rect.height);

			console.log('Rect', rect.width, rect.height);
		});

		observerRef.current.observe(scrollParent);		

		return () => {
			scrollParent.removeEventListener('scroll', onScrollHandler);

			if (!observerRef.current) {
				return;
			}

			observerRef.current.unobserve(scrollParent);
			observerRef.current = null;
		}
	}, [scrollParent, naturalHeight, naturalWidth]);


	/**
	 * @param  {React.PointerEvent<HTMLDivElement>} e
	 */
	function pointerDown(e) {
		if (!minimapRef.current) {
			return;
		}

		if (!scrollParent) {
			return;
		}

		if (e.currentTarget instanceof HTMLElement) {
			const xPct = e.offsetX / e.currentTarget.offsetWidth;
			const yPct = e.offsetY / e.currentTarget.offsetHeight;

			minimapRef.current.style.cursor = 'none';

			scrollParent.scrollLeft = scrollParent.scrollWidth * xPct;
			scrollParent.scrollTop = scrollParent.scrollHeight * yPct;
		}

		/**
		 * @param  {PointerEvent} e
		 */
		function pointerMove(e) {
			if (!scrollParent) {
				return;
			}

			if (e.currentTarget instanceof HTMLElement) {
				const xPct = e.offsetX / e.currentTarget.offsetWidth;
				const yPct = e.offsetY / e.currentTarget.offsetHeight;

				scrollParent.scrollLeft = scrollParent.scrollWidth * xPct;
				scrollParent.scrollTop = scrollParent.scrollHeight * yPct;
			}
		}

		/**
		 * @param  {PointerEvent} e
		 */
		function pointerUp(e) {
			if (minimapRef.current) {
				minimapRef.current.style.cursor = '';
				minimapRef.current.removeEventListener('pointermove', pointerMove);
			}
			document.addEventListener('pointerup', pointerUp);
		}

		minimapRef.current.addEventListener('pointermove', pointerMove);
		document.addEventListener('pointerup', pointerUp);
	}

	return (
		naturalWidth * 64 >= viewWidth  && naturalHeight * 64 >= viewHeight
		? <div ref={minimapRef} onPointerDown={pointerDown} className={classNames(styles['minimap'], imageAspectRatio > 1 ? styles['wide'] : styles['tall'])} style={{ aspectRatio: imageAspectRatio }}>
			<canvas className={styles['minimap-bg']} ref={ref} height={naturalHeight} width={naturalWidth} style={{aspectRatio: imageAspectRatio}} />
			<div className={styles['minimap-cursor']} ref={cursorRef} style={{ top: 0, left: 0, aspectRatio: viewWidth / viewHeight, width: ((viewWidth / (naturalWidth * scale)) * 100) + '%' }}></div>
		</div>
		: null
	)
}