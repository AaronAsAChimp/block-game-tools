import { Suspense, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import * as styles from './styles.module.css';

export function LazyDialog({open=false, onClose, children}) {
	const dialogRef = useRef(null);

	useEffect(() => {
		if (open) {
			dialogRef.current.showModal();
		}

		return () => {
			if (dialogRef.current) {
				dialogRef.current.close();
			}
		}
	}, [open])

	return <>
		{ createPortal(
			<dialog className={styles['lazy-dialog']} ref={dialogRef}>
				<button onClick={onClose}>Close</button>
				<Suspense fallback={<div>Loading...</div>}>
					{ open ? children : null }
				</Suspense>
			</dialog>,
			document.body
		) }
	</>
}