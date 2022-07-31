
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

function findNear(blocks, pos, radius) {
	const radiusSquared = radius * radius;
	const near = [];

	for (const block of blocks) {
		const color = block.palette[paletteEntry];

		if (color !== null) {
			const dist = distanceSquared(pos, color.lab);

			if (dist < radiusSquared) {
				near.push({
					distSquared: dist,
					block
				});
			}
		}
	}

	near.sort((a, b) => {
		return a.distSquared - b.distSquared;
	});

	return near;
}

function buildTextureImage(name) {
	const img = document.createElement('img');

	img.className = 'texture-image';
	img.src = dataDir + 'textures/' + name + '.png';

	return img;
}

function buildBlockSwatch(name, tooltip) {
	const textureEl = buildTextureImage(name);

	textureEl.addEventListener('mouseenter', (e) => {
		tooltip.show();
	});

	textureEl.addEventListener('mousemove', (e) => {
		tooltip.update(e.clientX, e.clientY, e.target.alt);
	});

	textureEl.addEventListener('mouseleave', () => {
		tooltip.hide();
	});

	return textureEl;
}

function selectBlock(block, similar, selectionMesh, selectedBlockNameEl) {
	if (block) {
		const blockData = block.userData.block;
		const color = blockData.palette[paletteEntry];
		const near = findNear(allBlocks, color.lab, SELECTION_RADIUS);

		similar.update(near);

		selectedBlockNameEl.textContent = blockData.name;

		// Position the selection ring
		selectionMesh.position.x = color.lab.a;
		selectionMesh.position.y = color.lab.l;
		selectionMesh.position.z = color.lab.b;
		selectionMesh.material.visible = true;
	} else {
		selectedBlockNameEl.textContent = '';
		selectionMesh.material.visible = false;
		similar.clear();
	}
}

class Tooltip {
	constructor() {
		this.tooltipEl = document.querySelector('.info-tooltip');
		this.nameEl = this.tooltipEl.querySelector('.name');
	}

	show() {
		this.tooltipEl.style.display = 'block';
	}

	update(x, y, text) {
		const tooltipEl = this.tooltipEl;

		tooltipEl.style.left = x + 'px';
		tooltipEl.style.top = y + 'px';

		this.nameEl.textContent = text;
	}

	hide() {
		this.tooltipEl.style.display = 'none';

		this.nameEl.textContent = '';
	}
}

class SimilarBlocks {
	constructor() {
		const selectedBlockEl = document.querySelector('.selected-block');

		this.moreEl = selectedBlockEl.querySelector('.similar-toggle');
		this.bestEl = selectedBlockEl.querySelector('.similar-best');
		this.secondBestEl = selectedBlockEl.querySelector('.similar-second');

		this.moreEl.addEventListener('click', (e) => {
			const display = this.secondBestEl.style.display;

			this.secondBestEl.style.display = display === 'block' ? 'none' : 'block';
		});
	}

	update(blocks) {
		const best = blocks.slice(0, MAX_SIMILAR_BLOCKS);
		const secondBest = blocks.slice(MAX_SIMILAR_BLOCKS);

		this.clear();

		this.moreEl.style.display = secondBest.length > 0 ? '' : 'none';

		for (const blockMatch of best) {
			const block = blockMatch.block;
			const item = buildBlockSwatch(block.name, infoTooltip);

			item.alt = block.name;

			this.bestEl.appendChild(item);
		}

		for (const blockMatch of secondBest) {
			const block = blockMatch.block;
			const item = buildBlockSwatch(block.name, infoTooltip);

			item.alt = block.name;

			this.secondBestEl.appendChild(item);
		}
	}

	clear() {
		this.moreEl.style.display = 'none';
		this.bestEl.textContent = '';
		this.secondBestEl.textContent = '';
	}
}


let allBlocks = [];
let paletteEntry = 'mostCommon';
let blockMap = {};

const dataDir = '/data/1.19/';
const infoTooltipEl = document.querySelector('.info-tooltip');
const infoTooltipNameEl = infoTooltipEl.querySelector('.name');

const infoTooltip = new Tooltip();
const similar = new SimilarBlocks();

const selectedBlockNameEl = document.querySelector('.selected-block .name');
const controlsPaletteSelectEl = document.querySelector('.controls .pallette-select');
const controlBlockSearchEl = document.querySelector('.controls .block-search');
const controlBlockListEl = document.querySelector('.controls #block-list');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new THREE.OrbitControls( camera, renderer.domElement );

const XYZ_SELECTION_RADIUS = 0.025;
const LAB_SELECTION_RADIUS = 0.4;
const SELECTION_RADIUS = LAB_SELECTION_RADIUS;
const BLOCK_SIZE = SELECTION_RADIUS / 10;
const MAX_SIMILAR_BLOCKS = 8;

// Show the selection
const selectionGeom = new THREE.RingGeometry( SELECTION_RADIUS, SELECTION_RADIUS + 0.01, 32 );
const selectionMat = new THREE.MeshBasicMaterial({
	color: 0xffffff,
	transparent: true,
	opacity: 0.6,
});
const selectionMesh = new THREE.Mesh( selectionGeom, selectionMat );

selectionMat.visible = false;

scene.add( selectionMesh );

// Block group

const blockGroup = new THREE.Group();

scene.add(blockGroup);


controlsPaletteSelectEl.value = paletteEntry;

fetch(dataDir + 'blocks.json')
	.then(async (res) => {
		return res.json();
	})
	.then((json) => {
		console.log(json);

		allBlocks = json.blocks;

		for (const block of json.blocks) {
			const color = block.palette[paletteEntry];
			const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
			const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF});
			const cube = new THREE.Mesh( geometry, material );
			cube.position.x = color.lab.a;
			cube.position.y = color.lab.l;
			cube.position.z = color.lab.b;
			cube.userData.block = block;

			material.color.setRGB(color.rgb.r / 255, color.rgb.g / 255, color.rgb.b / 255);

			blockGroup.add( cube );

			// Add to mapping
			blockMap[block.name] = cube;

			// Add to the search
			const blockOption = document.createElement('option');
			blockOption.value = block.name;
			controlBlockListEl.appendChild(blockOption);
		}
	});

camera.position.z = 5;
controls.update();

renderer.domElement.addEventListener('mousemove', (e) => {
	const mx = (e.offsetX / window.innerWidth) * 2 - 1;
	const my = -(e.offsetY / window.innerHeight) * 2 + 1;

	var vector = new THREE.Vector3( mx, my, 1 );
	vector.unproject( camera );
	var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
	var intersects = ray.intersectObjects( blockGroup.children );

	if (intersects.length > 0) {
		const blockData = intersects[0].object.userData.block;

		infoTooltip.show();
		infoTooltip.update(e.clientX, e.clientY, blockData.name);
	} else {
		infoTooltip.hide();
	}
});

renderer.domElement.addEventListener('click', (e) => {
	const mx = (e.offsetX / window.innerWidth) * 2 - 1;
	const my = -(e.offsetY / window.innerHeight) * 2 + 1;

	var vector = new THREE.Vector3( mx, my, 1 );
	vector.unproject( camera );
	var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
	var intersects = ray.intersectObjects( blockGroup.children );

	if (intersects.length) {
		selectBlock(intersects[0].object, similar, selectionMesh, selectedBlockNameEl);
	}
});

controlsPaletteSelectEl.addEventListener('change', (e) => {
	paletteEntry = e.target.value;

	for (const block of blockGroup.children) {
		const blockData = block.userData.block;
		const color = blockData.palette[paletteEntry];

		block.userData.mixer = new THREE.AnimationMixer(block);

		block.material.visible = color !== null;

		if (block.material.visible) {
			const postionKeyframe = new THREE.VectorKeyframeTrack(
				'.position',
				[0, 1],
				[
					block.position.x,
					block.position.y,
					block.position.z,
					color.lab.a,
					color.lab.l,
					color.lab.b
				]
			);
			const colorKeyframe = new THREE.ColorKeyframeTrack(
				'.material.color',
				[ 0, 1 ],
				[
					block.material.color.r,
					block.material.color.g,
					block.material.color.b,
					color.rgb.r / 255,
					color.rgb.g / 255,
					color.rgb.b / 255
				],
				THREE.InterpolateLinear
			);

			console.log(block.material.color, color.rgb);

			const clip = new THREE.AnimationClip(null, 5, [postionKeyframe, colorKeyframe]);
			const animationAction = block.userData.mixer.clipAction(clip);

			animationAction.clampWhenFinished = true;
			animationAction.setLoop(THREE.LoopOnce);
			animationAction.play();
			block.userData.clock = new THREE.Clock();

			// block.material.setValues({
			// 	color: color.css
			// });
		}

		// Hide the selection
		selectedBlockNameEl.textContent = '';
		selectionMesh.material.visible = false;

		similar.clear();
	}
});

controlBlockSearchEl.addEventListener('input', (e) => {
	const cube = blockMap[controlBlockSearchEl.value];
	console.log('selected', cube);

	if (cube) {
		// camera.position.copy(cube.position);
		camera.lookAt(cube.position);
		console.log(cube.position);
		controls.update();

		selectBlock(cube, similar, selectionMesh, selectedBlockNameEl);
	}
});

function animate() {
	for (const block of blockGroup.children) {
		if (block.userData.clock && block.userData.mixer) {
			const delta = block.userData.clock.getDelta();

			block.userData.mixer.update(delta);
		}
	}

	selectionMesh.quaternion.copy( camera.quaternion );
	renderer.render( scene, camera );

	requestAnimationFrame( animate );
}
animate();