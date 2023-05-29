import { useContext, useMemo, useState } from 'react';

import { SELECTION_RADIUS } from '../../jsx/consts.js';
import { TextureSwatch } from '../texture-swatch/index.jsx';
import { PaletteContext } from '../../context/palette-context.js';
import { findNear } from '../../jsx/blocks.js';

import * as styles from './styles.module.css';

/**
 * @typedef {import('../../jsx/server.d.ts').Block} Block
 */

const MAX_SIMILAR_BLOCKS = 8;


function Accordion({children}) {
	const [moreShown, setMoreShown] = useState(false);

	return <div>
		<a className="similar-toggle" onClick={ () => setMoreShown(!moreShown) }>More...</a>
		{ moreShown ? <div className="similar-second">{ children }</div> : null }
	</div>
}

/**
 * @typedef {Object} BlockSearchProps
 * @property {Block} selected
 * @property {Block[]} blocks
 */

/**
 * A component to show the selected block.
 * @param {BlockSearchProps} props
 */
export function SelectedBlock({selected, blocks}) {
	if (!selected) {
		return null;
	}

	const palette = useContext(PaletteContext);

	const nearest = useMemo(() => {
		const inRange = findNear(selected, blocks, palette, SELECTION_RADIUS);

		return {
			best: inRange.slice(0, MAX_SIMILAR_BLOCKS),
			second: inRange.slice(MAX_SIMILAR_BLOCKS)
		};
	}, [selected, blocks, palette]);

	return 	<div className={styles['selected-block']}>
		<div className="name">{selected.name}</div>

		<h3>Similar Blocks</h3>
		<div className="similar-best">
			{ nearest.best.map(block => <TextureSwatch block={block.candidate} key={block.candidate.name} />) }
		</div>
		{
			nearest.second.length > 0 ?
				<Accordion>
					{ nearest.second.map(block => <TextureSwatch block={block.candidate} key={block.candidate.name} />) }
				</Accordion>
			: null
		}
		
	</div>
}