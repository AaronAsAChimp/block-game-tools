import { atom, computed } from 'nanostores';

/**
 * @typedef {Object} ArtGenOptions
 * @property {number} width
 * @property {number} height
 * @property {string} ditheringAlgo
 * @property {HTMLImageElement | null} image
 */

const DEFAULT_SIZE = 16;

/** @type {ArtGenOptions} */
const ART_GEN_DEFAULTS = {
	width: DEFAULT_SIZE,
	height: DEFAULT_SIZE,
	ditheringAlgo: 'floydSteinberg',
	image: null
};

/** @type {import('nanostores').WritableAtom<ArtGenOptions>} */
export const artGenOptionsStore = atom(ART_GEN_DEFAULTS);

export const aspectRatio = computed(artGenOptionsStore, store => {
	if (!store.image) {
		return 1;
	}

	if (!store.image.height) {
		return 1;
	}

	return store.image.width / store.image.height;
});

/**
 * @param  {File} file
 */
export function loadImageFromFile(file) {
	const image = new Image();
	const reader = new FileReader();
	reader.onload = (e) => {
		image.src = reader.result;
	};
	reader.onerror = (e) => {
		console.error('Error loading image:', e)
	};

	reader.readAsDataURL(file);

	image.onload = (e) => {
		artGenOptionsStore.set({
			...artGenOptionsStore.value,
			image
		})
	}
}
