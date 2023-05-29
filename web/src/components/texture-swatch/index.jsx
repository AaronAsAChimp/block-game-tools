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
	const palette = useContext(PaletteContext);

	return <TooltipWrapper className={styles['texture']} title={block.name}>
		<img className={styles['texture-image']} src={DATA_DIR + 'textures/' + block.name + '.png'} />
		<div className={styles['texture-image-swatch']} style={{ backgroundColor: cssColor(block, palette) }}></div>
	</TooltipWrapper>
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
	const palette = useContext(PaletteContext);

	return <div className={styles['texture']}>
		<div className={styles['texture-animation'] + ' texture-' + block.name}></div>
		<div className={styles['texture-image-swatch']} style={{ backgroundColor: cssColor(block, palette) }}></div>
	</div>
}

/**
 * @typedef {Object} TextureSwatchProps
 * @property {Block} block The block to display.
 */

/**
 * A component for displaying a texture image
 * @param {TextureAnimationProps} props
 */
export function TextureSwatch({block}) {
	if (block.animated) {
		return <TextureAnimation block={block} />
	} else {
		return <TextureImage block={block} />
	}
}