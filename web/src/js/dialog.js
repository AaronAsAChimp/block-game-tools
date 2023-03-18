export class Dialog {
	/**
	 * The dialog element.
	 *
	 * @type {HTMLDialogElement}
	 */
	#dialogEl;
	#contentEl;
	#closeEl;

	/**
	 * Construct a new Dialog
	 * @param  {HTMLDialogElement} dialogEl  The element of the dialog.
	 */
	constructor(dialogEl) {
		this.#dialogEl = dialogEl;

		const closeEl = document.createElement('button');

		closeEl.innerHTML = '&times;';

		dialogEl.append(closeEl);

		this.#closeEl = closeEl;

		const contentEl = document.createElement('div');

		dialogEl.append(contentEl);

		this.#contentEl = contentEl;

		this.#bindEvents();
	}

	#bindEvents() {
		this.#closeEl.addEventListener('click', () => {
			this.close();
		});
	}

	/**
	 * Set the content of this dialog.
	 * @param {string} html The HTML content.
	 */
	setHtml(html) {
		this.#contentEl.innerHTML = html;
	}

	open() {
		this.#dialogEl.show();
	}

	close() {
		this.#dialogEl.close();
	}
}
