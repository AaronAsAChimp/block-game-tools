import { useContext, useMemo } from 'react';

import { SELECTION_RADIUS } from '../../consts.js';
import { TextureSwatch } from '../texture-swatch/index.jsx';
import { PaletteContext } from '../../context/palette-context.js';
import { findNear } from '../../blocks.js';

import styles from './styles.module.css';
import { useStore } from '@nanostores/react';
import { blockMapOptionsStore } from '../../context/block-map-store.js';


/**
 * A component to show the selected block.
 */
export function BlockMapSelection() {
	const palette = useContext(PaletteContext);
	const blockMapOptions = useStore(blockMapOptionsStore);

	const nearest = useMemo(() => {
		if (!blockMapOptions.selected) {
			return [];
		}

		const inRange = findNear(blockMapOptions.selected, blockMapOptions.blocks, palette, SELECTION_RADIUS);

		return inRange;
	}, [blockMapOptions.selected, blockMapOptions.blocks, palette]);

	return 	(blockMapOptions.selected ?
		<div className={styles['selected-block']}>
			<div className="name">{blockMapOptions.selected.name}</div>

			<h3>Similar Blocks</h3>
			<div className="similar">
				{ nearest.map(block => <TextureSwatch block={block.candidate} key={block.candidate.name} />) }
			</div>
		</div> :
		null);
}
