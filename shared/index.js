export {RGBColor, RGBAColor, LabColor, XYZColor, Color} from './src/color.js';

export const MC_VERSION = '1.21.10';

// Can be looked up https://minecraft.wiki/w/Data_version
export const MC_DATA_VERSION = 4556;

// 
// Don't forget to update the list of block IDs in `web/data/block-ids.json`,
// the latest official list can be found here:
// 
// https://minecraft.wiki/w/Java_Edition_data_values#Blocks
// 
// The sort and JSONify using:
// 
// ```sh
// jq -cR "." "block-ids.txt" | jq -s --indent 4 "sort_by(.)" > web/data/block-ids.json
// ````
// 
// Also review the textures in the data editor.
// 
