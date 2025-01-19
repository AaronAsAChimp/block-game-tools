import { atom } from 'nanostores';

/**
 * @typedef {Object} TexturizerOptions
 * @property {boolean} isMonochrome
 * @property {number} noiseScale
 * @property {number} noiseVersion
 * @property {number} width
 * @property {number} height
 * @property {string} ditheringAlgo
 * @property {import('shared/src/gradient').Gradient | null} gradient
 */

const DEFAULT_SIZE = 16;

/** @type {TexturizerOptions} */
const TEXTURIZER_DEFAULTS = {
	isMonochrome: false,
	noiseScale: 1,
	noiseVersion: 0,
	width: DEFAULT_SIZE,
	height: DEFAULT_SIZE,
	ditheringAlgo: 'floydSteinberg',
	gradient: null
};

/** @type {import('nanostores').WritableAtom<TexturizerOptions>} */
export const texturizerOptionsStore = atom(TEXTURIZER_DEFAULTS);
