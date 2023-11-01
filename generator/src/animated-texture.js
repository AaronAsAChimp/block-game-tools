import webp from "node-webpmux";
import { Animation } from "./animation.js";
import { BoundingBox2D } from "./bounding-box.js";

/**
 * Binary Block Transfer
 * @param  {Buffer} src      [description]
 * @param  {number} srcX     The coordinate in the source image.
 * @param  {number} srcY     The coordinate in the source image.
 * @param  {Buffer} dest     The destination image.
 * @param  {number} destX    The coordinate in the destination image.
 * @param  {number} destY    The coordinate in the destination image.
 * @param  {number} width    The width of the block to transfer.
 * @param  {number} height   The height of the block to transfer.
 */
function blit(src, srcX, srcY, dest, destX, destY, width, height) {
	const srcStartIdx = srcX + (srcY * width);
	const destStartIdx = destX + (destY * width);

	for (let y = 0; y < height; y++) {
		const srcIndex = srcStartIdx + (y * width);
		const destIndex = destStartIdx + (y * width);

		src.copy(dest, destIndex, srcIndex, srcIndex + width);
	}
}

/**
 * Determine if the image requires an alpha channel
 * @param  {Buffer}  buffer The pixel buffer. 
 * @return {boolean}        True if the image requires an alpha channel
 */
function hasAlpha(buffer) {
	let hasAlpha = false;

	for (let pixelIdx = 0; pixelIdx < buffer.length && !hasAlpha; pixelIdx += 4) {
		if (buffer[pixelIdx + 3] !== 0xFF) {
			hasAlpha = true;
			continue;
		}
	}

	return hasAlpha;
}

function deltaFrames(frames) {
	for (let i = frames.length - 2; i >= 0; i--) {
		const prev = frames[i];
		const current = frames[i + 1];

		for (let j = 0; j < current.length; j += 4) {
			if (current[j] === prev[j] && current[j + 1] === prev[j + 1] && current[j + 2] === prev[j + 2]) {
				current[j + 3] = 0;
			}
		}
	}
}

/**
 * Create an animated texture.
 * @param  {Animation} animation The animation information
 * @param  {import('pngjs').PNG} srcImage  The source image
 * @param  {string} outPath   The path to write the animation to.
 */
export async function createAnimatedTexture(animation, srcImage, outPath) {
	await webp.Image.initLib();

	const image = await webp.Image.getEmptyImage();
	// const isInterpolated = animation.isInterpolated();
	const frames = animation.getFrames();
	const srcFrames = srcImage.height / srcImage.width;
	const width = srcImage.width;
	const height = Math.floor(srcImage.height / srcFrames);
	const channels = 4;
	const destFrames = [];
	const srcHasAlpha = hasAlpha(srcImage.data);

	image.convertToAnim();

	const bufferFrames = new Array(frames.length);
	for (let frameIdx = 0; frameIdx < frames.length; frameIdx++) {
		const frame = frames[frameIdx];
		const destImage = Buffer.alloc(width * height * channels, 0);

		blit(srcImage.data, 0, frame * height, destImage, 0, 0, width * channels, height);

		bufferFrames[frameIdx] = destImage;
	}

	if (!srcHasAlpha) {
		deltaFrames(bufferFrames);
	}

	for (let frameIdx = 0; frameIdx < frames.length; frameIdx++) {
		const frame = bufferFrames[frameIdx];

		if (srcHasAlpha) {
			const frameBounds = new BoundingBox2D();

			for (let pixelIdx = 0; pixelIdx < frame.length; pixelIdx += 4) {
				if (frame[pixelIdx + 3] !== 0) {
					frameBounds.add((pixelIdx / 4) % width, pixelIdx / (width * 4));
				}
			}
		}

		const destFrame = await webp.Image.getEmptyImage();

		await destFrame.setImageData(frame, {
			width,
			height,
			preset: webp.presets.ICON,
			lossless: 9,
			method: 6,
		});

		destFrames.push(await webp.Image.generateFrame({
			x: 0,
			y: 0,
			img: destFrame
		}));
	}

	await image.save(outPath, {
		width,
		height,
		delay: animation.getFrameTime(),
		// blend: srcHasAlpha,
		frames: destFrames,
		dispose: srcHasAlpha
	});
}
