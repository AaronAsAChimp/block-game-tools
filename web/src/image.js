import { ordered, dither } from './dithering';
import { RGBColor } from 'shared';

/**
 * Render an image as a sequence of bloks
 *
 * @param  {ImageData} pixels  The image
 * @param  {string} palette The palette to used.
 * @param  {string} ditheringAlgo The dithering algorithm.
 * @param  {import('./blocks').BlockLookup} blockLookup The block lookup.
 *
 * @return {import('shared/src/block').Block[]}
 */
export function imageAsBlocks(pixels, palette, ditheringAlgo, blockLookup) {
	if (!blockLookup) {
		return;
	}

	if (ditheringAlgo === 'ordered2') {
		ordered(2, pixels, palette, blockLookup);
	} else if (ditheringAlgo === 'ordered4') {			
		ordered(4, pixels, palette, blockLookup);
	} else if (ditheringAlgo === 'ordered8') {			
		ordered(8, pixels, palette, blockLookup);
	} else {
		dither(ditheringAlgo, pixels, palette, blockLookup);
	}

	// console.log(redraws);

	const textureBlocks = new Array(pixels.data.length / 4);

	for (let pixelIdx = 0; pixelIdx < pixels.data.length / 4; pixelIdx++) {
		const red = pixelIdx * 4;
		const blockColor = new RGBColor(pixels.data[red], pixels.data[red + 1], pixels.data[red + 2]);

		textureBlocks[pixelIdx] = blockLookup.find(blockColor, palette).block;
	}

	return textureBlocks;
}