import * as THREE from 'three';
import {OBJLoader as ThreeOBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js'
import {Font as ThreeFont} from 'three/examples/jsm/loaders/FontLoader.js'
import {OrbitControls as ThreeOrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {TextGeometry as ThreeTextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js'
import helvetikerFont from 'three/examples/fonts/droid/droid_sans_regular.typeface.json';

import {DATA_DIR} from './consts.js';

import './components/cm-texture-image.js';
import './components/cm-texture-animation.js';

/**
 * @typedef {Object} RGBColor
 * @property {number} r The red component.
 * @property {number} g The green component.
 * @property {number} b The blue component
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


function buildBlockSwatch(name, isAnimated, tooltip) {
	let textureEl = null; 

	if (!isAnimated) {
		textureEl = document.createElement('cm-texture-image');
		textureEl.textureName = name;
	} else {
		textureEl = document.createElement('cm-texture-animation');
		textureEl.textureName = name;
	}

	textureEl.setAttribute('aria-label', name);

	textureEl.addEventListener('mouseenter', (e) => {
		tooltip.show();
	});

	textureEl.addEventListener('mousemove', (e) => {
		let target = e.currentTarget;

		if (target instanceof HTMLElement) {
			tooltip.update(e.clientX, e.clientY, target.getAttribute('aria-label'));
		}
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

/**
 * Reposition the labels relative to the bounds.
 *
 * @param  {THREE.Group} boundsObj The bounds
 * @param  {THREE.Group} uiGroup  The containing the labels.
 */
function repositionLabels(boundsObj, uiGroup) {
	const boundsCenter = new THREE.Vector3();
	const boundsBoundingBox = new THREE.Box3();

	boundsBoundingBox.setFromObject(boundsObj);
	boundsBoundingBox.getCenter(boundsCenter);

	if (uiGroup.children.length > 1) {

		for (const obj of uiGroup.children) {
			if (obj !== boundsObj) {
				console.log(obj);
				const axis = obj.position.clone().sub(boundsCenter).normalize();

				obj.translateOnAxis(axis, 2);
			}
		}
	}
}

/**
 * Position the camer so that the whole bounds object is visible.
 * 
 * From: https://wejn.org/2020/12/cracking-the-threejs-object-fitting-nut/
 * @param {THREE.PerspectiveCamera} camera The camera
 * @param {THREE.Group} boundsObj THe bounds object to center in view.
 * @param {ThreeOrbitControls} orbitControls
 */
function repositionCamera(camera, boundsObj, orbitControls) {
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(boundsObj);

    var middle = new THREE.Vector3();
    var size = new THREE.Vector3();
    boundingBox.getSize(size);
    boundingBox.getCenter(middle);

    // figure out how to fit the box in the view:
    // 1. figure out horizontal FOV (on non-1.0 aspects)
    // 2. figure out distance from the object in X and Y planes
    // 3. select the max distance (to fit both sides in)
    //
    // The reason is as follows:
    //
    // Imagine a bounding box (BB) is centered at (0,0,0).
    // Camera has vertical FOV (camera.fov) and horizontal FOV
    // (camera.fov scaled by aspect, see fovh below)
    //
    // Therefore if you want to put the entire object into the field of view,
    // you have to compute the distance as: z/2 (half of Z size of the BB
    // protruding towards us) plus for both X and Y size of BB you have to
    // figure out the distance created by the appropriate FOV.
    //
    // The FOV is always a triangle:
    //
    //  (size/2)
    // +--------+
    // |       /
    // |      /
    // |     /
    // | F° /
    // |   /
    // |  /
    // | /
    // |/
    //
    // F° is half of respective FOV, so to compute the distance (the length
    // of the straight line) one has to: `size/2 / Math.tan(F)`.
    //
    // FTR, from https://threejs.org/docs/#api/en/cameras/PerspectiveCamera
    // the camera.fov is the vertical FOV.

    const fov = camera.fov * ( Math.PI / 180 );
    const fovh = 2*Math.atan(Math.tan(fov/2) * camera.aspect);
    let dx = size.z / 2 + Math.abs( size.x / 2 / Math.tan( fovh / 2 ) );
    let dy = size.z / 2 + Math.abs( size.y / 2 / Math.tan( fov / 2 ) );
    let cameraZ = Math.max(dx, dy);

    // offset the camera, if desired (to avoid filling the whole canvas)
    // if( offset !== undefined && offset !== 0 ) cameraZ *= offset;

    camera.position.set( 0, 0, cameraZ );
    camera.lookAt(middle);

    // set the far plane of the camera so that it easily encompasses the whole object
    const minZ = boundingBox.min.z;
    const cameraToFarEdge = ( minZ < 0 ) ? -minZ + cameraZ : cameraZ - minZ;

    camera.far = cameraToFarEdge * 3;
    camera.updateProjectionMatrix();

    if ( orbitControls !== undefined ) {
        // set camera to rotate around the center
        orbitControls.target = middle;

        // prevent camera from zooming out far enough to create far plane cutoff
        orbitControls.maxDistance = cameraToFarEdge * 2;
    }
}


/**
 * Create a CSS color value.
 * 
 * @param  {RGBColor} color The color.
 * @return {string}         The color formatted as a string.
 */
function rgbToCSS(color) {
	return `rgb(${ color.r }, ${ color.g }, ${ color.b })`;
}

class Tooltip {
	/**
	 * Create a new Tooltip.
	 * 
	 * @param  {HTMLElement} tooltipEl The element of the tooltip
	 */
	constructor(tooltipEl) {
		this.tooltipEl = tooltipEl;
		this.nameEl = this.tooltipEl.querySelector('.name');
	}

	/**
	 * Show the tooltip
	 */
	show() {
		this.tooltipEl.style.display = 'block';
	}

	/**
	 * Update the position and text of the tooltip.
	 * 
	 * @param  {number} x    The X coordinate.
	 * @param  {number} y    The Y coordinate.
	 * @param  {string} text The text to show in the tooltip
	 */
	update(x, y, text) {
		const tooltipEl = this.tooltipEl;

		tooltipEl.style.left = x + 'px';
		tooltipEl.style.top = y + 'px';

		this.nameEl.textContent = text;
	}

	/**
	 * Hide the tooltip.
	 */
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
		this.paletteEntry = null;

		this.moreEl.addEventListener('click', (e) => {
			const display = this.secondBestEl.style.display;

			this.secondBestEl.style.display = display === 'block' ? 'none' : 'block';
		});
	}

	update(blocks) {
		const best = blocks.slice(0, MAX_SIMILAR_BLOCKS);
		const secondBest = blocks.slice(MAX_SIMILAR_BLOCKS);
		const paletteEntry = this.paletteEntry;

		this.clear();

		this.moreEl.style.display = secondBest.length > 0 ? '' : 'none';

		for (const blockMatch of best) {
			const block = blockMatch.block;
			const item = buildBlockSwatch(block.name, block.animated, infoTooltip);

			if (paletteEntry) {
				item.swatchColor = rgbToCSS(block.palette[paletteEntry].rgb);
			}

			this.bestEl.appendChild(item);
		}

		for (const blockMatch of secondBest) {
			const block = blockMatch.block;
			const item = buildBlockSwatch(block.name, block.animated, infoTooltip);

			if (paletteEntry) {
				item.swatchColor = rgbToCSS(block.palette[paletteEntry].rgb);
			}

			this.secondBestEl.appendChild(item);
		}
	}

	setPaletteEntry(paletteEntry) {
		this.paletteEntry = paletteEntry;
	}

	clear() {
		this.moreEl.style.display = 'none';
		this.bestEl.textContent = '';
		this.secondBestEl.textContent = '';
	}
}

class Dialog {
	/**
	 * Construct a new Dialog
	 * @param  {HTMLDialogElement} dialogEl  The element of the dialog.
	 */
	constructor(dialogEl) {
		/**
		 * The dialog element.
		 *
		 * @type {HTMLDialogElement}
		 */
		this.dialogEl = dialogEl;

		const closeButtons = this.dialogEl.querySelectorAll('.close');

		for (const button of closeButtons) {
			button.addEventListener('click', () => {
				this.close();
			});
		}
	}

	open() {
		this.dialogEl.show();
	}

	close() {
		this.dialogEl.close();
	}
}


class ContrastManager {
	#rootEl;
	#lastState;

	#bottomColor;
	#topColor;
	#betweenColor = new THREE.Color();
	#inverseBetweenColor = new THREE.Color();

	constructor(rootEl) {
		const props = window.getComputedStyle(rootEl)

		this.#rootEl = rootEl;

		const bgColor = props['background-color'];
		const inverseColor = props['color'];

		this.#bottomColor = new THREE.Color(inverseColor);
		this.#topColor = new THREE.Color(bgColor);
	}

	/**
	 * Update the UI to maximize the contrast.
	 * @param {THREE.Camera} camera The camera
	 * @param {THREE.Mesh} selectionMesh The mesh for the selection ring.
	 * @param {THREE.MeshBasicMaterial} boundsMaterial The material of the bounds object.
	 */
	updateUi(camera, selectionMesh, boundsMaterial) {
		const alpha = Math.max(Math.min(camera.position.y / 100, 1), 0) > 0.5 ? 1 : 0;

		if (alpha !== this.#lastState) {
			this.#betweenColor.lerpColors(this.#bottomColor, this.#topColor, alpha)
			this.#inverseBetweenColor.lerpColors(this.#topColor, this.#bottomColor, alpha);

			if (selectionMesh.material instanceof THREE.MeshBasicMaterial) {
				selectionMesh.material.color = this.#inverseBetweenColor;
			}

			this.#rootEl.style.setProperty('--background-color', this.#betweenColor.getStyle());
			this.#rootEl.style.setProperty('--inverse-color', this.#inverseBetweenColor.getStyle());

			if (boundsMaterial) {
				boundsMaterial.color = this.#inverseBetweenColor;
			}
		}

		this.#lastState = alpha;
	}
}


let allBlocks = [];
let paletteEntry = 'mostCommon';
let blockMap = {};

const infoTooltip = new Tooltip(document.querySelector('.info-tooltip'));
const similar = new SimilarBlocks();
const aboutDialog = new Dialog(document.querySelector('.about-dialog'));
const helpDialog = new Dialog(document.querySelector('.help-dialog'));
const constrastMgr = new ContrastManager(document.body);

similar.setPaletteEntry(paletteEntry);

const selectedBlockEl = document.querySelector('.selected-block');
const selectedBlockNameEl = document.querySelector('.selected-block .name');
const controlsPaletteSelectEl = document.querySelector('.controls .pallette-select');
const controlBlockSearchEl = document.querySelector('.controls .block-search');
const controlBlockListEl = document.querySelector('.controls #block-list');
const controlAboutButtonEl = document.querySelector('.controls .about');
const controlHelpButtonEl = document.querySelector('.controls .help');


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const font = new ThreeFont(helvetikerFont);
const loader = new ThreeOBJLoader();

const renderer = new THREE.WebGLRenderer({
	alpha: true
});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new ThreeOrbitControls( camera, renderer.domElement );

const XYZ_SELECTION_RADIUS = 0.025;
const LAB_SELECTION_RADIUS = 4;
const SELECTION_RADIUS = LAB_SELECTION_RADIUS;
const BLOCK_SIZE = SELECTION_RADIUS / 8;
const MAX_SIMILAR_BLOCKS = 8;

// Show the selection
const selectionGeom = new THREE.RingGeometry( SELECTION_RADIUS, SELECTION_RADIUS + 0.1, 32 );
const selectionMat = new THREE.MeshBasicMaterial({
	color: 0xffffff,
	transparent: true,
	opacity: 0.6,
});
const selectionMesh = new THREE.Mesh( selectionGeom, selectionMat );
let boundsObj = null;
let boundsMaterial = null;

selectionMat.visible = false;

scene.add( selectionMesh );

// UI Group

const uiGroup = new THREE.Group();

scene.add(uiGroup);

// Block group

const blockGroup = new THREE.Group();

scene.add(blockGroup);


controlsPaletteSelectEl.value = paletteEntry;

fetch(DATA_DIR + 'blocks.json')
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

		for (const label of json.labels) {
			const geometry = new ThreeTextGeometry(label.name, {
				font,
				size: 2.5,
				height: 1
			});
			const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF});
			const labelMesh = new THREE.Mesh( geometry, material );

			geometry.center();

			labelMesh.position.x = label.lab.a;
			labelMesh.position.y = label.lab.l;
			labelMesh.position.z = label.lab.b;

			material.color.setRGB(label.rgb.r / 255, label.rgb.g / 255, label.rgb.b / 255);

			uiGroup.add(labelMesh);
		}

		repositionLabels(boundsObj, uiGroup);
	});

loader.load(DATA_DIR + 'bounds.obj', (obj) => {
	const mesh = obj.children[0];

	boundsObj = obj;

	uiGroup.add(obj);

	if (mesh instanceof THREE.LineSegments) {
		boundsMaterial = mesh.material;

		boundsMaterial.opacity = 0.35;
		boundsMaterial.transparent = true;
	}

	repositionLabels(boundsObj, uiGroup);
	repositionCamera(camera, boundsObj, controls);

	constrastMgr.updateUi(camera, selectionMesh, boundsMaterial);
})

camera.position.z = 5;
controls.update();

let grabbing = false;

renderer.domElement.addEventListener('mousedown', (e) => {
	grabbing = true;
});

renderer.domElement.addEventListener('mouseup', (e) => {
	grabbing = false;
});

renderer.domElement.addEventListener('mousemove', (e) => {
	if (!grabbing) {
		const mx = (e.offsetX / window.innerWidth) * 2 - 1;
		const my = -(e.offsetY / window.innerHeight) * 2 + 1;

		var vector = new THREE.Vector3( mx, my, 1 );
		vector.unproject( camera );
		var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
		var intersects = ray.intersectObjects( blockGroup.children );

		if (intersects.length > 0) {
			const blockData = intersects[0].object.userData.block;

			renderer.domElement.style.cursor = 'pointer';

			infoTooltip.show();
			infoTooltip.update(e.clientX, e.clientY, blockData.name);
		} else {
			renderer.domElement.style.cursor = 'grab';

			infoTooltip.hide();
		}
	} else {
		renderer.domElement.style.cursor = 'grabbing';

		constrastMgr.updateUi(camera, selectionMesh, boundsMaterial);
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
	if (!(e.target instanceof HTMLSelectElement)) {
		return;
	}

	paletteEntry = e.target.value;

	similar.setPaletteEntry(paletteEntry);

	for (const block of blockGroup.children) {
		if (block instanceof THREE.Mesh) {
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

				// console.log(block.material.color, color.rgb);

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

controlHelpButtonEl.addEventListener('click', (e) => {
	helpDialog.open();
})

controlAboutButtonEl.addEventListener('click', (e) => {
	aboutDialog.open();
});

window.addEventListener('resize', (e) => {
	const width = window.innerWidth;
	const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
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
