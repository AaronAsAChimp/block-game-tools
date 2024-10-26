import { useMemo } from 'react';

import { SELECTION_RADIUS } from '../../consts.js';
import { TextureSwatch } from '../texture-swatch/index.jsx';
import { findNear } from '../../blocks.js';

import { useStore } from '@nanostores/react';
import { blockMapOptionsStore } from '../../context/block-map-store.js';
import { paletteStore } from '../../context/palette-store.js';


/**
 * A component to show the selected block.
 */
export function BlockMapSelection() {
	const palette = useStore(paletteStore);
	const blockMapOptions = useStore(blockMapOptionsStore);

	const nearest = useMemo(() => {
		if (!blockMapOptions.selected) {
			return [];
		}

		const inRange = findNear(blockMapOptions.selected, blockMapOptions.blocks, palette, SELECTION_RADIUS);

		for (let i = 0; i < inRange.length; i++) {
			if (inRange[i].candidate.name === blockMapOptions.selected.name) {
				inRange.splice(i, 1);
				break;
			}
		}

		return inRange;
	}, [blockMapOptions.selected, blockMapOptions.blocks, palette]);

	return 	(blockMapOptions.selected ?
		<div>
			<h3>Selected</h3>
			<div>{blockMapOptions.selected.name}</div>
			<TextureSwatch block={blockMapOptions.selected} />

			<h3>Similar Blocks</h3>
			<div className="similar">
				{ nearest.map(block => <TextureSwatch block={block.candidate} key={block.candidate.name} />) }
			</div>
		</div> :
		<p>
			Select a colored block on the map to view information on it and blocks with similar colors.
		</p>);
}
