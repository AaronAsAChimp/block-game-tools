import { useState } from "react";
import styles from './styles.module.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export function MultiSelect({selected, setSelected, options}) {
	const [selectedItem, setSelectedItem] = useState(selected && selected.length ? selected[0] : null);

	function onSelected(e) {
		let items;

		e.preventDefault();

		if (selectedItem !== null) {
			if (selected) {
				items = [...selected, selectedItem];
			} else {
				items = [selectedItem];
			}

			setSelected(Array.from(new Set(items)));
			setSelectedItem(null);
		}
	}

	function onDeleted(item) {
		setSelected(selected.filter(select => select !== item))
	}

	return <>
		<div>
		{ selected ? selected.map(item => <span className={styles['multi-select-item']} key={item}>{item} <FontAwesomeIcon className={ styles['multi-select-item-delete'] } onClick={() => onDeleted(item)} icon={faXmark} /></span>) : null }
		</div>
		<form onSubmit={ onSelected }>
			<input type="text" list="block-id-list" value={selectedItem ?? ''} onInput={ e => { setSelectedItem(e.currentTarget.value) }}/>
			<datalist id="block-id-list">
				{ options.map(option => <option key={option}>{option}</option>) }
			</datalist>
			<button>Add</button>
		</form>
	</>
}