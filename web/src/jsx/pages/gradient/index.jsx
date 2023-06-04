import { useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { Color, RGBColor } from "shared/src/color";
import { AppTitleBar } from "../../../components/app-title-bar";
import { BlockLookup } from "../../blocks";
import './styles.css';
import { TextureSwatch } from "../../../components/texture-swatch";



export function Component() {
	const [palette, setPalette] = useState('mostCommon');
	const [startColor, setStartColor] = useState('#000000');
	const [endColor, setEndColor] = useState('#ffffff');
	const [steps, setSteps] = useState(5);

	/** @type {import("../../server").BlocksResponse} */
	const blocks = useLoaderData();

	const gradient = useMemo(() => {
		return Color.gradient(RGBColor.parseCSSHex(startColor), RGBColor.parseCSSHex(endColor), steps);
	}, [startColor, endColor, steps]);

	const blockLookup = useMemo(() => {
		return new BlockLookup(blocks.blocks);
	}, [blocks]);

	function paletteChange(e) {
		const select = e.target;
		setPalette(select.options[select.selectedIndex].value);
	}

	return <div className="page-gradient">
		<AppTitleBar title="Gradient Editor">
			<label>
				Color Extraction:
				<select className="pallette-select" onInput={paletteChange} value={palette}>
					<option value="average">Average</option>
					<option value="mostSaturated">Most Saturated</option>
					<option value="mostCommon">Most Common</option>
				</select>
			</label>
		</AppTitleBar>
		<input type="color" onInput={(e) => setStartColor(e.target.value)} value={startColor} />
		<input type="color" onInput={(e) => setEndColor(e.target.value)} value={endColor} />
		<input type="number" onInput={(e) => setSteps(+e.target.value)} value={steps} />

		<div>
			{ gradient.map((color) => {
				const cssColor = color.toCSS();

				return <div key={cssColor} style={{background: cssColor}}>{cssColor} <TextureSwatch block={blockLookup.find(color, palette)} /></div>
			}) }
		</div>
	</div>;
}