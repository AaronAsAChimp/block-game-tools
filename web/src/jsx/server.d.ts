type RGBColor = {
	r: number,
	g: number,
	b: number,
	a: number,
}

type LabColor = {
	l: number,
	a: number,
	b: number,
}

type XYZColor = {
	x: number,
	y: number,
	z: number,
}

type Color = {
	rgb: RGBAColor,
	lab: LabColor,
	xyz: XYZColor
};

type Label = {
	name: string,
	rgb: RGBColor,
	lab: LabColor,
}

export type Block = {
	name: string,
	animated: boolean,
	palette: {
		average: Color | null,
		vibrant: Color | null
		mostCommon: Color | null
		mostSaturated: Color | null
	}
};

export type BlocksResponse = {
	minecraft_version: string,
	labels: Label[],
	blocks: Blocks[],
}
