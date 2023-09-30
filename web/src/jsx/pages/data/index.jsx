import { useEffect, useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { AppTitleBar } from "../../../components/app-title-bar";
import "./styles.css";
import { TextureSwatch } from "../../../components/texture-swatch";

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
			setCurrent(queue[0]);
			setQueue(queue.slice(1));
		}
	];
}

export function Component() {
	/** @type {import("../../server").BlocksResponse} */
	const blocks = useLoaderData();

	const untagged = useMemo(() => {
		return blocks.blocks.filter((block) => {
			return !block.tags;
		})
	}, [blocks]);

	const [queue, current, enqueue, dequeue] = useQueue(untagged);

	const [file, setFile] = useState({});

	useEffect(() => {
		const newTags = {};

		for (const block of blocks.blocks) {
			if (block.tags) {
				newTags[block.name] = block.tags;
			}
		}

		setFile(newTags);
	}, [blocks]);

	const [selectedTags, setSelectedTags] = useState({});

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
			let newFile = {
				...file,
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

			newFile = Object.keys(newFile).sort()
				.reduce((obj, key) => {
					obj[key] = newFile[key];

					return obj;
				}, {});

			setFile(newFile);
		}

		setSelectedTags({});

		dequeue();
	}

	function computePercent(queueLength, blocksLength) {
		return Math.floor(((blocksLength - queueLength) / blocksLength) * 100);
	}

	return <div className="page-data">
		<AppTitleBar title="Data Manager">
		</AppTitleBar>

		<div className="page-container">
			<div className="texture-queue">
				<div className="textures-left">Textures left: { queue.length } ({computePercent(queue.length, blocks.blocks.length)}%)</div>
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
						<TextureSwatch block={current} />
						{ current.name }
					</> : null
				}
			</div>
			<div className="tags-editor">
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
				<button onClick={onDoneChoosing}>Done</button>
			</div>
			<textarea className="file-output" readOnly value={JSON.stringify(file, null, '    ')}></textarea>
		</div>
	</div>;
}