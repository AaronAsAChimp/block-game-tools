import { atom } from 'nanostores';

/**
 * @typedef {Object} BlockMapOptions
 * @property {import('shared/src/block').Block | null} selected
 * @property {import('shared/src/block').Block[]} blocks
 */

/** @type {BlockMapOptions} */
const BLOCK_MAP_DEFAULTS = {
	selected: null,
	blocks: []
}

/** @type {import('nanostores').WritableAtom<BlockMapOptions>} */
export const blockMapOptionsStore = atom(BLOCK_MAP_DEFAULTS);
