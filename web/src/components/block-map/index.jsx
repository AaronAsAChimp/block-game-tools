/**
 * @typedef {import('shared/src/block').Block} Block
 */

import { animated, useSpring } from '@react-spring/three';
import { Billboard, OrbitControls, Text3D } from '@react-three/drei';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { forwardRef, memo, useContext, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import droidSansRegular from 'three/examples/fonts/droid/droid_sans_regular.typeface.json';

import { OBJLoader as ThreeOBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { ContrastContext } from '../../context/contrast-context.js';
import { PaletteContext } from '../../context/palette-context.js';
import { DATA_DIR, SELECTION_RADIUS } from '../../consts.js';
import { TooltipWrapper } from '../tooltip/index.jsx';

const BLOCK_SIZE = SELECTION_RADIUS / 8;

const SPRING_CONFIG = {
	mass: 1,
	tension: 200,
	friction: 30,
	clamp: true
};


/**
 * Position the camer so that the whole bounds object is visible.
 * 
 * From: https://wejn.org/2020/12/cracking-the-threejs-object-fitting-nut/
 * 
 * @param {THREE.Group} boundsObj THe bounds object to center in view.
 * @param {import('three/examples/jsm/controls/OrbitControls.js').OrbitControls} orbitControls
 */
function repositionCamera(boundsObj, orbitControls) {
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(boundsObj);
    const camera = orbitControls.object;

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
        orbitControls.update();
    }

	// return {
	// 	camera: {
	// 		position: new THREE.Vector3(0, 0, cameraZ),
	// 		lookAt: middle,
	// 		far: cameraToFarEdge * 3
	// 	},
	// 	controls: {
	// 		// set camera to rotate around the center
	// 		target: middle,

	// 		// prevent camera from zooming out far enough to create far plane cutoff
	// 		maxDistance: cameraToFarEdge * 2
	// 	}
	// };
}


const BoundsMesh = forwardRef(({}, ref) => {
	const boundsObj = useLoader(ThreeOBJLoader, DATA_DIR + 'bounds.obj');
	const contrast = useContext(ContrastContext);

	if (contrast) {
		boundsObj.children[0].material.color.set(contrast.inverse);
	}

	return <primitive ref={ref} object={boundsObj}></primitive>
});
BoundsMesh.displayName = 'BoundsMesh';

const AnimatedBillboard = animated(Billboard);

/**
 * @typedef {Object} SelectionMeshProps
 * @property {Block} block The block to highlight with the mesh.
 */

/**
 * A mesh for a selection
 * @param {SelectionMeshProps} props
 */
function SelectionMesh({block}) {
	const palette = useContext(PaletteContext);
	/** @type {import('shared/src/block').Color} */
	const color = block.palette[palette];
	const contrast = useContext(ContrastContext);

	const {position} = useSpring({
		position: [
			color.lab.a,
			color.lab.l,
			color.lab.b,
		],
		config: SPRING_CONFIG
	});

	return <AnimatedBillboard
		follow={true}
		lockX={false}
		lockY={false}
		position={position}> 
		<mesh>
			<ringGeometry args={[SELECTION_RADIUS, SELECTION_RADIUS + 0.1, 32]} />
			<meshBasicMaterial color={contrast.inverse} transparent={true} opacity={0.6} />
		</mesh>
	</AnimatedBillboard>
}


/**
 * @typedef {Object} LabelsProps
 * @property {import('../../jsx/server.d.ts').Label[]} labels The label to make into a mesh.
 */

/**
 * A mesh for a block
 * @param {LabelsProps} props
 */
function Labels({labels}) {
	return <group>
		{ labels.map((label) => {
			const pos = new THREE.Vector3(
				label.pos.a,
				label.pos.l,
				label.pos.b,
			);

			const lightPos = new THREE.Vector3(
				label.pos.a + 2.2,
				label.pos.l,
				label.pos.b + 5,
			)

			return <group key={label.name}>
				<Text3D font={droidSansRegular} size={2.5} height={1} position={pos}>
					{label.name}
					<meshStandardMaterial color={[
						label.rgb.r / 255,
						label.rgb.g / 255,
						label.rgb.b / 255
					]} />
				</Text3D>
				<pointLight position={lightPos} distance={8} intensity={5} decay={0.8} />
			</group>
		}) }

	</group>
}

const LabelsMemoized = memo(Labels);


/**
 * @typedef {Object} BlockMeshProps
 * @property {Block} block The block to make into a mesh.
 * @property {SelectedCallback} onSelect An event handler fired when the block is clicked.
 * @property {() => void} onMouseEnter
 * @property {() => void} onMouseLeave
 */

/**
 * A mesh for a block
 * @param {BlockMeshProps} props
 */
function BlockMesh({block, onSelect, onMouseEnter, onMouseLeave}) {
	const palette = useContext(PaletteContext);
	const color = block.palette[palette];
	const {position} = useSpring({
		position: [
			color.lab.a,
			color.lab.l,
			color.lab.b,
		],
		config: SPRING_CONFIG
	});

	function selectHandler() {
		onSelect(block);
	}

	return <animated.mesh position={position} onClick={selectHandler} onPointerEnter={onMouseEnter} onPointerLeave={onMouseLeave}>
		<boxGeometry args={[
			BLOCK_SIZE,
			BLOCK_SIZE,
			BLOCK_SIZE]} />
		<meshBasicMaterial color={[
			color.rgb.r / 255,
			color.rgb.g / 255,
			color.rgb.b / 255
		]} />
	</animated.mesh>
}


function Blocks({blocks, onSelected, onHovered}) {
	return <group>
		{ blocks.map((block) => {
			return <BlockMesh block={block} key={block.name} onSelect={onSelected} onMouseEnter={() => onHovered(block)} onMouseLeave={() => onHovered(null)} />
		}) }
	</group>
}

const BlocksMemoied = memo(Blocks);

function Centerer({boundsObj, onChange, children}) {
	const controls = useThree(three => three.controls);

	useEffect(() => {
		if (boundsObj.current && controls) {
			repositionCamera(boundsObj.current, controls);
		}
	}, [boundsObj, controls]);

	return <>
		{children}
	</>
}


/**
 * @callback SelectedCallback
 * @param {Block | null} selected The name of the selected block 
 */

/**
 * @typedef {Object} BlockMapProps
 * @property {Label[]} labels
 * @property {Block[]} blocks
 * @property {Block | null} selected
 *   The name of the selected block or null if no selection.
 * @property {SelectedCallback} onSelected
 *   This event is fired when the blockmap changes the selection.
 * @property {(alpha:number) => void} onAlphaChange
 *   This event is fired when the camera breaks the plane and the contrast needs
 *   to change.
 */

/**
 * @param {BlockMapProps} props
 */
export function BlockMap({labels, blocks, selected, onSelected, onAlphaChange}) {
	const [alpha, setAlpha] = useState(null);
	const [hovered, setHovered] = useState(null);
	const [grabbing, setGrabbing] = useState(false);
	const controlsRef = useRef(null);
	const boundsRef = useRef(null);
	const canvasRef = useRef(null);


	function updateAlpha(camera) {
		const newAlpha = Math.max(Math.min(camera.position.y / 100, 1), 0) > 0.5 ? 1 : 0;

		if (alpha !== newAlpha) {
			onAlphaChange(newAlpha);
			setAlpha(newAlpha);
		}
	}

	function cursorGrab() {
		setGrabbing(true);
	}

	function cursorRelease() {
		setGrabbing(false);
	}

	function cursorMove(e) {
		if (!grabbing) {
			if (hovered !== null) {
				canvasRef.current.style.cursor = 'pointer';
			} else {
				canvasRef.current.style.cursor = 'grab';
			}
		} else {
			canvasRef.current.style.cursor = 'grabbing';
		}
	}

	return <TooltipWrapper title={hovered?.name}>
		<Canvas linear flat ref={canvasRef} style={{width: '100%', height: '100vh'}} onPointerDown={cursorGrab} onPointerUp={cursorRelease} onPointerMove={cursorMove}>
			<Centerer boundsObj={boundsRef} onChange={(camera) => updateAlpha(camera) }>
				<ambientLight intensity={0.8} />
				<BoundsMesh ref={boundsRef} />
				{ selected
					? <SelectionMesh block={selected} />
					: null }
				<LabelsMemoized labels={labels} />
				<BlocksMemoied blocks={blocks} onSelected={onSelected} onHovered={setHovered} />
				<OrbitControls ref={controlsRef} makeDefault onChange={(e) => updateAlpha(e.target.object)} />
			</Centerer>
		</Canvas>
	</TooltipWrapper>
}
