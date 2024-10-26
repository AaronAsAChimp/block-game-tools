import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { LazyDialog } from '../lazy-dialog';

import styles from './styles.module.css';

export function HelpButton({content}) {
	const [helpOpen, setHelpOpen] = useState(false);

	return <>
		<button className={styles['help-button']} onClick={() => setHelpOpen(true)}><FontAwesomeIcon icon={faQuestion} /></button>
		<LazyDialog open={helpOpen} onClose={() => setHelpOpen(false)}>
			<div dangerouslySetInnerHTML={{__html: content}}></div>
		</LazyDialog>
	</>	
}