import { RGBColor } from 'shared/src/color.js';
import { DATA_DIR } from '../../consts';

import { TooltipWrapper } from '../tooltip/index';
import styles from './styles.module.css';
import { useStore } from '@nanostores/react';
import { paletteStore } from '../../context/palette-store.js';

/**
 * Make the CSS color from the block.
 * @param  {import('shared/src/block').Block} block The block
 * @param  {string} palette The palette
 * @return {string}      THe color
 */
function cssColor(block, palette) {
	const entry = block.palette[palette].rgb;
	const color = new RGBColor(entry.r, entry.g, entry.b);

	return color.toCSS();
}

/**
 * @typedef {Object} TextureImageProps
 * @property {import('shared/src/block').Block} block The block to display.
 */

/**
 * A component for displaying a texture image
 * @param {TextureImageProps} props
 */
export function TextureImage({block}) {
	const ext = block.animated ? '.webp' : '.png';

	return <img className={styles['texture-image']} height="64" width="64" loading="lazy" src={DATA_DIR + 'textures/' + block.name + ext} />
}

/**
 * @typedef {Object} TextureAnimationProps
 * @property {import('shared/src/block').Block} block The block to display.
 */

/**
 * A component for displaying a texture image
 * @param {TextureAnimationProps} props
 */
export function TextureAnimation({block}) {
	return <img className={styles['texture-image']} height="64" width="64" loading="lazy" src={DATA_DIR + 'textures/' + block.name + '.webp'} />
}

/**
 * @typedef {Object} TextureSwatchProps
 * @property {import('shared/src/block').Block} block The block to display.
 * @property {string} [title] Additional information
 * @property {boolean} [showColor]
 *   Show the extracted color overlaid on the texture.
 */

/**
 * A component for displaying a texture image
 * @param {TextureSwatchProps} props
 */
export function TextureSwatch({block, title, showColor}) {
	const palette = useStore(paletteStore);
	const ext = block.animated ? '.webp' : '.png';
	let tooltip = block.name;

	if (title) {
		tooltip += ' ' + title;
	}

	return <TooltipWrapper className={styles['texture']} title={tooltip}>
		<img className={styles['texture-image']} height="64" width="64" loading="lazy" src={DATA_DIR + 'textures/' + block.name + ext} />
		{
			showColor || typeof showColor === 'undefined' ?
				<div className={styles['texture-image-swatch']} style={{ backgroundColor: cssColor(block, palette) }}></div> :
				null
		}
	</TooltipWrapper>
}
