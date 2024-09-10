import {MC_VERSION} from 'shared';

function removeTrailingSlash(url) {
	if (url.endsWith('/')) {
		return url.substring(0, url.length - 1);
	} else {
		return url;
	}
}

export const DATA_DIR = `${ removeTrailingSlash(import.meta.env?.BASE_URL ?? '') }/data/${ MC_VERSION }/`;
const XYZ_SELECTION_RADIUS = 0.025;
const LAB_SELECTION_RADIUS = 4;
export const SELECTION_RADIUS = LAB_SELECTION_RADIUS;