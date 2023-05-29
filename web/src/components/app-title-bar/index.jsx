
import { AppMenu } from '../app-menu';
import * as styles from './styles.module.css';

export function AppTitleBar({title, children}) {
	return 	<div className={styles['app-title-bar']}>
		<div className={styles['app-title']}>
			{ title }
		</div>
		<div className={styles['app-title-tool-specific']}>
			{ children }
		</div>
		<AppMenu />
	</div>
}
