import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { memo } from 'react';
import styles from './styles.module.css';

/**
 * @typedef {Object} BlockListProps
 * @property {import('shared/src/block').Block[]} blocks The textures to list
 */

/**
 * The datalist of texture names.
 *
 * @param {BlockListProps} options.blocks [description]
 */
function BlockList({blocks}) {
	return <datalist id="block-list">
		{ blocks.map((block) => {
			return <option key={block.name}>{ block.name }</option>
		}) }
	</datalist>
}

const BlockListMemoized = memo(BlockList);

/**
 * @typedef {Object} BlockSearchProps
 * @property {import('shared/src/block').Block[]} blocks
 * @property {string} value
 * @property {(e: React.ChangeEvent<HTMLInputElement>) => void} onChange
 */

/**
 * @param {BlockSearchProps} options
 */
export function BlockSearch({blocks, value, onChange}) {
	return <label className={styles['block-search']}>
		<FontAwesomeIcon icon={faMagnifyingGlass} />
		<input list="block-list" className="block-search" type="search" placeholder="Search texture or hex code" value={value} onChange={onChange} />
		<BlockListMemoized blocks={blocks} />
	</label>
}