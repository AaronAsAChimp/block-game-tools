import {relative} from 'path';

const MS_PER_TICK = 1000 / 20;


/**
 * Describes a frame base animation for textures.
 */
export class Animation {
	constructor(name) {
		this._interpolate = false;
		this._frametime = MS_PER_TICK;

		/**
		 * The URL path of the file.
		 * @type {string}
		 */
		this._path = null;

		/**
		 * The name of the animation.
		 * @type {string}
		 */
		this._name = name ?? '[unnamed]';

		/**
		 * The individual frames of the animation.
		 * @type {number[]}
		 */
		this._frames = [];
	}

	/**
	 * Generate a CSS animation.
	 *
	 * @return {string}          The CSS>
	 */
	toCSS() {
		const name = this._name;
		const frameCount = this._frames.length;
		const percentStep = 100 / (frameCount - 1);

		let keyframes = ``;

		for (let i = 0; i < this._frames.length; i++) {
			const frame = this._frames[i];
			keyframes += `
	${ i * percentStep }% {
		background-position: 0 ${ -frame * 64 }px;
	}

`;
		}

		console.log(name, frameCount, this._frametime);

		return `
/*
Animation: ${ name }
 */
.texture-animation.texture-${ name } {
	background-image: url(${this._path}/${name}.png);
	animation-name: ${ name };
	animation-duration: ${ frameCount * this._frametime}ms;
}

@keyframes ${ name } {
${ keyframes }
}
`;
	}

	static fromMcmeta(json, name, path, width, height) {
		const frameCount = Math.floor(height / width);
		const animation = new Animation(name);

		animation._path = path;
		animation._interpolate = json.animation.interpolate ?? false;
		animation._frametime = json.animation.frametime ? json.animation.frametime * MS_PER_TICK : MS_PER_TICK;

		if (json.animation.frames) {
			animation._frames = json.animation.frames;
		} else {
			for (let i = 0; i < frameCount; i++) {
				animation._frames.push(i);
			}
		}

		return animation;
	}
}