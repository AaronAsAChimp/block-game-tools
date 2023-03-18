import { icon } from '@fortawesome/fontawesome-svg-core';

import * as styles from '../css/menu.module.css';

/**
 * @typedef { import("@fortawesome/fontawesome-common-types").IconDefinition } IconDefinition
 */

/**
 * @typedef {Object} MenuItemDefinition
 * @property {string} text The text to be displayed in the menu.
 * @property {string} [href] The URL of the menu item
 * @property {IconDefinition} [icon] The name of the icon to show with the menu item.
 * @property {() => void} [onClick] Load the `href` into a dialog.
 */

export class Menu {
	/**
	 * @type {HTMLDialogElement}
	 */
	#rootEl;

	/**
	 * @type {HTMLElement}
	 */
	#menuListEl;

	/**
	 * @type {HTMLElement}
	 */
    #closeEl;

	constructor() {
		this.#rootEl = document.createElement('dialog');
		this.#rootEl.className = styles['menu'];

		this.#closeEl = document.createElement('button');
		// this.#closeEl.className = styles['menu-close'];
		this.#closeEl.innerHTML = '&times';

		this.#menuListEl = document.createElement('ul');
		this.#menuListEl.className = styles['menu-items'];

		this.#rootEl.append(this.#closeEl);
		this.#rootEl.append(this.#menuListEl);

		this.#bindEvents();
	}

	#bindEvents() {
		this.#closeEl.addEventListener('click', (e) => {
			this.close();
		});
	}

	getRootElement() {
		return this.#rootEl;
	}

	/**
	 * Build an individual menu item.
	 * @param  {MenuItemDefinition} menuItem The menu item to build.
	 * @return {HTMLElement}   The rendered menu item.
	 */
	#buildMenuItem(menuItem) {
		const itemEl = document.createElement('li');

		itemEl.className = styles['menu-item'];
		itemEl.textContent = menuItem.text;

		if (menuItem.icon) {
			itemEl.appendChild(icon(menuItem.icon).node[0]);
		}

		if (menuItem.onClick) {
			itemEl.addEventListener('click', () => {
				this.close();
				menuItem.onClick();
			});
		}

		return itemEl;
	}

	/**
	 * Set the menu items.
	 * @param {MenuItemDefinition[]} menuItems The menu items for this menu.
	 */
	setMenuItems(menuItems) {
		// empty the menu.
		this.#menuListEl.replaceChildren();

		for (const item of menuItems) {
			const itemEl = this.#buildMenuItem(item);

			this.#menuListEl.append(itemEl);
		}		
	}

	open() {
		this.#rootEl.showModal();
	}

	close() {
		this.#rootEl.close();
	}
}