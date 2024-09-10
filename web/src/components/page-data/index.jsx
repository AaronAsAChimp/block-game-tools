import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useRef, useState } from "react";
import blockIds from '../../../data/block-ids.json';
import { MultiSelect } from "../../components/multi-select";
import { TextureSwatch } from "../../components/texture-swatch";
import { loadBlocks } from "../../blocks";
import "./styles.css";

const TEXTURE_TAGS = [
	"transparent",
	"redstone",
	"unobtainable",
	"block-entity",
	"model:other",
	"model:pane",
	"model:crops",
	"model:block",
	"model:slab",
	"model:stair",
	"model:flower",
	"model:on-ground",
	"model:door",
	"model:trapdoor",
	"model:farmland",
	"model:candle",
	"direction:any",
	"direction:top",
	"direction:bottom",
	"direction:north",
	"direction:south",
	"direction:east",
	"direction:west",
	"direction:side"
];

function useQueue(initialItems) {
	const [current, setCurrent] = useState(null);
	const [queue, setQueue] = useState(initialItems ?? []);

	return [
		queue,
		current,
		function enqueue(item) {
			setQueue([
				...queue,
				item
			]);
		},
		function dequeue() {
			const current = queue[0];

			setCurrent(current);
			setQueue(queue.slice(1));

			return current;
		}
	];
}

/**
 * Sorts the keys of an aobject
 * @param {Record<string, any>} obj The object ot be sorted.
 * @return {Record<string, any>} A new object with sorted keys that reference the origninal values
 */
function toSortedRecord(obj) {
	return Object.keys(obj).sort().reduce((newObj, key) => {
		newObj[key] = obj[key];
		return newObj;
	}, {});
}

function buildBlockTexturesFile(blocks) {
	const newFile = {};

	for (const block of blocks) {

		if (block.blockIds) {
			for (const id of block.blockIds) {
				let blockIds = newFile[id];

				if (!blockIds) {
					blockIds = [];
					newFile[id] = blockIds;
				}

				blockIds.push(block.name);
			}
		}
	}

	return newFile;
}


export function Data() {
	const [blocks, setBlocks] = useState([]);
	const [textureTagsFile, setTextureTagsFile] = useState({});

	const todos = useMemo(() => {
		return blocks.filter((block) => {
			return !block.tags || !block.blockIds;
		})
	}, [blocks]);

	const [queue, current,, dequeue] = useQueue(todos);

	/** @type {React.MutableRefObject<HTMLAnchorElement>} */
	const blockTexturesRef = useRef(null);

	/** @type {React.MutableRefObject<HTMLAnchorElement>} */
	const textureTagsRef = useRef(null);

	useEffect(() => {
		loadBlocks('all-blocks')
			.then((blocks) => {
				setBlocks(blocks.blocks)
			});
	}, [])

	useEffect(() => {
		const newTags = {};
		const newBlockIds = {};

		for (const block of blocks) {
			if (block.tags) {
				newTags[block.name] = block.tags;
			}

			if (block.blockIds) {
				if (!(block.blockIds in newBlockIds)) {
					newBlockIds[block.blockIds] = [];
				}

				newBlockIds[block.blockIds].push(block.name);
			}
		}

		setTextureTagsFile(toSortedRecord(newTags));

		onDoneChoosing();
	}, [blocks]);

	const [selectedTags, setSelectedTags] = useState({});
	const [selectedBlockIds, setSelectedBlockIds] = useState([]);

	/**
	 * Select the specified tag
	 * @param  {string} tag      The tag name
	 * @param  {boolean} selected True if selected
	 */
	function onSelectTag(tag, selected) {
		setSelectedTags({
			...selectedTags,
			[tag]: selected
		})
	}

	function onDoneChoosing() {
		if (current) {
			const newTextureTagsFile = {
				...textureTagsFile,
				[current.name]: Object.keys(selectedTags)
					.map((selectedTag) => {
						const isSelected = selectedTags[selectedTag];

						return isSelected ? selectedTag : null
					})
					.filter((selected) => {
						return selected !== null;
					})
					.sort()
			};

			setTextureTagsFile(toSortedRecord(newTextureTagsFile));

			current.blockIds = selectedBlockIds;
		}

		const next = dequeue();
		const tags = next?.tags ?? [];

		setSelectedTags(tags.reduce((current, key) => {
			current[key] = true;
			return current;
		}, {}));

		setSelectedBlockIds(next?.blockIds ?? null);
	}

	function computePercent(queueLength, blocksLength) {
		return Math.floor(((blocksLength - queueLength) / blocksLength) * 100);
	}

	const [valid, setValid] = useState(false);

	useEffect(() => {
		setValid(selectedBlockIds && selectedBlockIds.length > 0);
	}, [selectedBlockIds])

	return <div className="page-data">
		<div className="page-container">
			<div className="texture-queue">
				<div className="textures-left">Textures left: { queue.length } ({computePercent(queue.length, blocks.length)}%)</div>
				{
					queue.map((block) => {
						return <div key={block.name}>
							{ block.name }
						</div>
					})
				}
			</div>
			<div className="texture-properties">
				{
					current ? <>
						<h1>{current.name}</h1>
						<TextureSwatch block={current} showColor={false} />
					</> : null
				}
			</div>
			<div className="tags-editor">
				<h2>Block ID</h2>
				<MultiSelect
					selected={selectedBlockIds}
					setSelected={(ids) => setSelectedBlockIds(ids)}
					options={blockIds} />
				<h2>Tags</h2>
				<div className="tags-choices">
					{
						TEXTURE_TAGS.map((tag) => {
							return <label className="tags-choice" key={tag}>
								{tag}
								<input type="checkbox" value={tag} onChange={(e) => {
									if (e.target instanceof HTMLInputElement) {
										onSelectTag(e.target.value, e.target.checked);
									}
								}} checked={ !!selectedTags[tag] } />
							</label>
						})
					}
				</div>
				<button onClick={onDoneChoosing} disabled={!valid}>Done</button>
			</div>
			<a className="download download-block-textures" download="block-textures.json" href="#" ref={blockTexturesRef} onClick={() => {blockTexturesRef.current.href = 'data:application/json;base64,' + btoa(JSON.stringify(buildBlockTexturesFile(blocks), null, '    ')) }}>
				block-textures.json
				<FontAwesomeIcon icon={faDownload} />
			</a>
			<a className="download download-texture-tags" download="texture-tags.json" href="#" ref={textureTagsRef} onClick={() => {textureTagsRef.current.href = 'data:application/json;base64,' + btoa(JSON.stringify(textureTagsFile, null, '    ')) }}>
				texture-tags.json
				<FontAwesomeIcon icon={faDownload} />
			</a>
			<textarea className="file-output" readOnly value={JSON.stringify(buildBlockTexturesFile(blocks), null, '    ')}></textarea>
		</div>
	</div>;
}
