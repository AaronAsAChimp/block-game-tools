import { faBars, faCircleInfo, faCubes, faGears, faHouse, faRulerHorizontal, faXmark, faWater, faPaintbrush } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { createPortal } from "react-dom";
import { AboutContent } from "../content/index.jsx";
// import { Content as AboutContent} from '../../md/about.md';
import { LazyDialog } from "../lazy-dialog";

import styles from './styles.module.css';


function AppMenuLink({children, href}) {
	return <li><a className={styles['menu-item']} href={href}>{ children }</a></li>
}

function AppMenuButton({children, onClick}) {
	return <li><span className={styles['menu-item']} onClick={onClick}>{ children }</span></li>
}

function AppMenuSlideout({children, open, onClose}) {
	return <div className={styles['menu'] + ' ' + (open ? styles['open'] : '')}>
		<button className={styles['close']} onClick={() => onClose()}><FontAwesomeIcon icon={faXmark} /></button>
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
		<button title="Menu" className={styles['menu-button']} onClick={() => setOpen(!open)}><FontAwesomeIcon icon={faBars} /></button>
		<LazyDialog open={aboutShown} onClose={() => setAboutShown(false)}>
			<AboutContent />
		</LazyDialog>
		{ createPortal(
			<AppMenuSlideout open={open} onClose={() => setOpen(false)}>
				<AppMenuLink href="/">Home <FontAwesomeIcon icon={faHouse} /></AppMenuLink>
				<AppMenuLink href="/map/">Color Map <FontAwesomeIcon icon={faCubes} /></AppMenuLink>
				<AppMenuLink href="/gradient/">Gradient Editor <FontAwesomeIcon icon={faRulerHorizontal} /></AppMenuLink>
				<AppMenuLink href="/texturizer/">Texturizer <FontAwesomeIcon icon={faWater} /></AppMenuLink>
				<AppMenuLink href="/art/">Art Generator <FontAwesomeIcon icon={faPaintbrush} /></AppMenuLink>
				<AppMenuLink href="/data/">Data Manager <FontAwesomeIcon icon={faGears} /></AppMenuLink>
				<AppMenuButton onClick={openAboutDialog}>About <FontAwesomeIcon icon={faCircleInfo} /></AppMenuButton>
			</AppMenuSlideout>,
			document.body
		) }
	</>
}