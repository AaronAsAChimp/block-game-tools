import test from 'ava';

import {BlockLookup} from '../src/blocks.js';
import {RGBColor, RGBAColor} from 'shared/src/color.js';

const COLOR_WHITE = RGBAColor.fromInteger(0xFFFFFFFF);
const COLOR_RED = RGBAColor.fromInteger(0xFF0000FF);

test('a block lookup can find a block', t => {
	// Arrange
	/** @type {import('shared/src/block').Block[]}  */
	const blocks = [
		{
			name: 'Test Block 1',
			animated: false,
			palette: {
				average: {
					rgb: COLOR_WHITE,
					lab: COLOR_WHITE.toLabColor(),
					xyz: COLOR_WHITE.toXYZColor()
				},
				mostCommon: {
					rgb: COLOR_RED,
					lab: COLOR_RED.toLabColor(),
					xyz: COLOR_RED.toXYZColor()
				},
				mostSaturated: {
					rgb: COLOR_RED,
					lab: COLOR_RED.toLabColor(),
					xyz: COLOR_RED.toXYZColor()
				}
			}
		}
	];
	const blockLookup = new BlockLookup(blocks);

	// Act
	const color = blockLookup.find(RGBColor.fromInteger(0xFFFFFF), 'average');

	// Assert
	t.is(color.block.name, 'Test Block 1', 'check that the correct block is returned.');
});
