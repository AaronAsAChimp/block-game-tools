
type Label = {
	name: string,
	rgb: RGBColor,
	lab: LabColor,
	pos: LabColor,
}

export type BlocksResponse = {
	minecraft_version: string,
	labels: Label[],
	blocks: Blocks[],
}
