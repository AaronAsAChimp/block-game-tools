import { faCubes, faGears, faRulerHorizontal, faWater } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import * as styles from './styles.module.css';

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
		<AppTileLink href="/texturizer/" title="Texturizer"><FontAwesomeIcon icon={faWater} /></AppTileLink>
		<AppTileLink href="/data/" title="Data Manager"><FontAwesomeIcon icon={faGears} /></AppTileLink>
	</div>
}