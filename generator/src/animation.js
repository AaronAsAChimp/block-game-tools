
const MS_PER_TICK = 1000 / 20;
export const FRAME_SIZE = 64;


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
	 * Determine if this animation is interpolated.
	 *
	 * @return {boolean} True if the animation is interpolated.
	 */
	isInterpolated() {
		return this._interpolate;
	}

	/**
	 * Get the frames for this animation.
	 *
	 * @return {number[]} An array containing the integer index of the frame at
	 *                    each step of the sequence.
	 */
	getFrames() {
		return this._frames;
	}

	getFrameTime() {
		return this._frametime;
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