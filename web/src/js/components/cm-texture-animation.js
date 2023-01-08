import * as styles from '../../css/components/cm-texture-image.module.css';

class CmTextureAnimation extends HTMLElement {
	/**
	 * The root element of the component
	 */
	#rootEl;

	/**
	 * The image element of the component.
	 * @type {HTMLImageElement}
	 */
	#imageEl;

	/**
	 * The color swatch of this texture.
	 * @type {HTMLElement}
	 */
	#swatchEl;

	/**
	 * The name of the texture;
	 * @type {string}
	 */
	#textureName;

	/**
	 * The color of the swatch.
	 * @type {string}
	 */
	#swatchColor;

	constructor() {
		super();

		const root = document.createElement('div');
		const img = document.createElement('div');
		const swatch = document.createElement('div');

		root.className = styles['texture'];
		img.className = styles['texture-animation'];
		swatch.className = styles['texture-image-swatch'];

		this.#rootEl = root;
		this.#imageEl = img;
		this.#swatchEl = swatch;

		root.appendChild(img);
		root.appendChild(swatch);
	}

	connectedCallback() {
		this.appendChild(this.#rootEl);
	}

	/**
	 * Get the texture name.
	 * @return {string} The texture name.
	 */
	get textureName() {
		return this.#textureName;
	}

	/**
	 * Set the texture name.
	 * @param  {string} value The texture name.
	 */
	set textureName(value) {
		this.#textureName = value;

		this.#imageEl.classList.add('texture-' + value);
	}

	get swatchColor() {
		return this.#swatchColor;
	}

	set swatchColor(value) {
		this.#swatchColor = value;

		this.#swatchEl.style.backgroundColor = value;
	}
}

customElements.define("cm-texture-animation", CmTextureAnimation);