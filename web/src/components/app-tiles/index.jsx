import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCubes } from '@fortawesome/free-solid-svg-icons'
import * as styles from './styles.module.css';

function AppTileLink({children, href, title}) {
	return <li><a className={styles['tiles-item']} href={href}>
		<div className={styles['tiles-icon']}>{ children }</div>
		<div className={styles['tiles-title']}>{ title }</div>
	</a></li>
}

export function AppTiles() {
	return <ul className={styles['tiles']}>
		<AppTileLink href="/map/" title="Color Map"><FontAwesomeIcon icon={faCubes} /></AppTileLink>
	</ul>
}