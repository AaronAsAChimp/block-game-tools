import { AppMenu } from '../app-menu';
import * as styles from './styles.module.css';

/**
 * @typedef {import('react').PropsWithChildren<T>} PropsWithChildren<T>
 * @template T
 */

/**
 * @typedef {Object} AppTitleBarProps
 * @property {string} title The title to show in the title bar.
 */

/**
 * Display the title of the page.
 * @param {PropsWithChildren<AppTitleBarProps>} props
 */
export function AppTitleBar({title, children}) {
	return 	<div className={styles['app-title-bar']}>
		<div className={styles['app-title']}>
			{ title }
		</div>
		{ children ?
			<div className={styles['app-title-tool-specific']}>
				{ children }
			</div>
			: null
		}
		
		<AppMenu />
	</div>
}
