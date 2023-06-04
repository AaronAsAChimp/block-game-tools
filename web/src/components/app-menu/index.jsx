import { faBars, faCircleInfo, faCubes, faHouse, faRulerHorizontal, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AboutContent } from "../content";
import { LazyDialog } from "../lazy-dialog";

import * as styles from './styles.module.css';


function AppMenuLink({children, href}) {
	return <li><Link className={styles['menu-item']} to={href}>{ children }</Link></li>
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
				<AppMenuLink href="/gradient/">Gradient Editor <FontAwesomeIcon icon={faRulerHorizontal} /></AppMenuLink>
				<AppMenuButton onClick={openAboutDialog}>About <FontAwesomeIcon icon={faCircleInfo} /></AppMenuButton>
			</AppMenuSlideout>,
			document.body
		) }
	</>
}