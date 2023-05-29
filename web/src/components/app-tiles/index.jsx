import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCubes } from '@fortawesome/free-solid-svg-icons'
import * as styles from './styles.module.css';
import { Link } from "react-router-dom";

function AppTileLink({children, href, title}) {
	return <li><Link className={styles['tiles-item']} to={href}>
		<div className={styles['tiles-icon']}>{ children }</div>
		<div className={styles['tiles-title']}>{ title }</div>
	</Link></li>
}

export function AppTiles() {
	return <ul className={styles['tiles']}>
		<AppTileLink href="/map/" title="Color Map"><FontAwesomeIcon icon={faCubes} /></AppTileLink>
	</ul>
}