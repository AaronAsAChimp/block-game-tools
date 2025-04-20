import { atom } from 'nanostores';

/** @type {import('shared/src/block').Block[]} */
const BLOCK_GRID_DEFAULT = []

export const blockGrid = atom(BLOCK_GRID_DEFAULT);
