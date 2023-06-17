import {MC_VERSION} from 'shared';

export const DATA_DIR = `${ process.env.PUBLIC_URL ?? '' } /data/${ MC_VERSION }/`;
const XYZ_SELECTION_RADIUS = 0.025;
const LAB_SELECTION_RADIUS = 4;
export const SELECTION_RADIUS = LAB_SELECTION_RADIUS;