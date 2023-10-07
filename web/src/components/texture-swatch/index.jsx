import { useContext } from 'react';
import { RGBColor } from 'shared/src/color';
import { PaletteContext } from '../../context/palette-context';
import { DATA_DIR } from '../../jsx/consts';

import { TooltipWrapper } from '../tooltip/index';
import * as styles from './styles.module.css';

/**
 * @typedef {import('../../jsx/server.d.ts').Block} Block
 */

/**
 * Make the CSS color from the block.
 * @param  {Block} block The block
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
 * @property {Block} block The block to display.
 */

/**
 * A component for displaying a texture image
 * @param {TextureImageProps} props
 */
export function TextureImage({block}) {
	return <img className={styles['texture-image']} height="64" width="64" loading="lazy" src={DATA_DIR + 'textures/' + block.name + '.png'} />
}

/**
 * @typedef {Object} TextureAnimationProps
 * @property {Block} block The block to display.
 */

/**
 * A component for displaying a texture image
 * @param {TextureAnimationProps} props
 */
export function TextureAnimation({block}) {
	return <div className={styles['texture-animation'] + ' texture-' + block.name}></div>
}

/**
 * @typedef {Object} TextureSwatchProps
 * @property {Block} block The block to display.
 * @property {string} [title] Additional information
 * @property {boolean} [showColor]
 *   Show the extracted color overlaid on the texture.
 */

/**
 * A component for displaying a texture image
 * @param {TextureSwatchProps} props
 */
export function TextureSwatch({block, title, showColor}) {
	const palette = useContext(PaletteContext);
	let tooltip = block.name;

	if (title) {
		tooltip += ' ' + title;
	}

	return <TooltipWrapper className={styles['texture']} title={tooltip}>
		{
			block.animated ?
				<TextureAnimation block={block} /> :
				<TextureImage block={block} />
		}
		{
			showColor || typeof showColor === 'undefined' ?
				<div className={styles['texture-image-swatch']} style={{ backgroundColor: cssColor(block, palette) }}></div> :
				null
		}
	</TooltipWrapper>
}