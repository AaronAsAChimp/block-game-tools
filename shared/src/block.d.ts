type RGBAColor = {
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

export type Block = {
	name: string,
	animated: boolean,
	blockIds: string[],
	palette: {
		average: Color | null,
		mostCommon: Color | null,
		mostSaturated: Color | null,
	}
};
