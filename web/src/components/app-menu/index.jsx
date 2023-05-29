import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faCubes, faHouse, faXmark, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { createPortal } from "react-dom";
import { useState } from "react";

import * as styles from './styles.module.css';
import { LazyDialog } from "../lazy-dialog";
import { AboutContent } from "../content";


function AppMenuLink({children, href}) {
	return <li><a className={styles['menu-item']} href={href}>{ children }</a></li>
}

function AppMenuButton({children, onClick}) {
	return <li><span className={styles['menu-item']} onClick={onClick}>{ children }</span></li>
}

function AppMenuSlideout({children, open, onClose}) {
	return <div className={styles.menu + ' ' + (open ? styles.open : '')}>
		<button className={styles.close} onClick={() => onClose()}><FontAwesomeIcon icon={faXmark} /></button>
		<ul className={styles['menu-items']}>
			{children}
		</ul>
	</div>
}

export function AppMenu() {
	const [open, setOpen] = useState(false);
	const [aboutShown, setAboutShown] = useState(false);

	function openAboutDialog() {
		setOpen(false);
		setAboutShown(true);
	}

	return <>
		<button title="Menu" onClick={() => setOpen(!open)}><FontAwesomeIcon icon={faBars} /></button>
		<LazyDialog open={aboutShown} onClose={() => setAboutShown(false)}>
			<AboutContent />
		</LazyDialog>
		{ createPortal(
			<AppMenuSlideout open={open} onClose={() => setOpen(false)}>
				<AppMenuLink href="/">Home <FontAwesomeIcon icon={faHouse} /></AppMenuLink>
				<AppMenuLink href="/map/">Color Map <FontAwesomeIcon icon={faCubes} /></AppMenuLink>
				<AppMenuButton onClick={openAboutDialog}>About <FontAwesomeIcon icon={faCircleInfo} /></AppMenuButton>
			</AppMenuSlideout>,
			document.body
		) }
	</>
}