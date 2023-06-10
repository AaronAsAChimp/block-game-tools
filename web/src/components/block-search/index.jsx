/**
 * @typedef {import('../../jsx/server.d').Block} Block
 */

import { memo } from 'react';

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
 * @property {Block[]} blocks
 * @property {string} value
 * @property {(e: React.ChangeEvent<HTMLInputElement>) => void} onChange
 */

/**
 * @param {BlockSearchProps} options
 */
export function BlockSearch({blocks, value, onChange}) {
	return <div>
		<input list="block-list" className="block-search" type="search" placeholder="Search texture or hex code" value={value} onChange={onChange} />
		<BlockListMemoized blocks={blocks} />
	</div>
}