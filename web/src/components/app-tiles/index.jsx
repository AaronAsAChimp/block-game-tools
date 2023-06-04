import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCubes, faRulerHorizontal } from '@fortawesome/free-solid-svg-icons'
import * as styles from './styles.module.css';
import { Link } from "react-router-dom";

function AppTileLink({children, href, title}) {
	return <Link className={styles['tiles-item']} to={href}>
		<div className={styles['tiles-icon']}>{ children }</div>
		<div className={styles['tiles-title']}>{ title }</div>
	</Link>
}

export function AppTiles() {
	return <div className={styles['tiles']}>
		<AppTileLink href="/map/" title="Color Map"><FontAwesomeIcon icon={faCubes} /></AppTileLink>
		<AppTileLink href="/gradient/" title="Gradient Editor"><FontAwesomeIcon icon={faRulerHorizontal} /></AppTileLink>
	</div>
}