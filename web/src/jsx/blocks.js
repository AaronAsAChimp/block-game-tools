
/**
 * @typedef {import('./server.d.ts').Block} Block
 */

function distanceSquared(pos1, pos2) {
	const delta = {
		l: pos2.l - pos1.l,
		a: pos2.a - pos1.a,
		b: pos2.b - pos1.b
	};

	return (delta.l * delta.l) +
		(delta.a * delta.a) +
		(delta.b * delta.b);
}

export function findNear(block, blocks, paletteEntry, radius) {
	const radiusSquared = radius * radius;
	const pos = block.palette[paletteEntry].lab;
	const near = [];

	for (const candidate of blocks) { 
		const color = candidate.palette[paletteEntry];

		if (color !== null) {
			const dist = distanceSquared(pos, color.lab);

			if (dist < radiusSquared) {
				near.push({
					distSquared: dist,
					candidate
				});
			}
		}
	}

	near.sort((a, b) => {
		return a.distSquared - b.distSquared;
	});

	return near;
}

/**
 * Like findNear but finds the one block that is the closest or null if there
 * are none.
 */
export function findNearest(blocks, paletteEntry, pos) {
	let nearest = null;
	let nearestDistanceSquared = Infinity;

	for (const block of blocks) { 
		const color = block.palette[paletteEntry];

		if (color !== null) {
			const dist = distanceSquared(pos, color.lab);

			if (dist < nearestDistanceSquared) {
				nearest = block;
				nearestDistanceSquared = dist;
			}
		}
	}

	return nearest;
}
