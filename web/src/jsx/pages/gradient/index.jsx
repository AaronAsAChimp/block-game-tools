import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import { Color, RGBColor } from "shared/src/color";
import { AppTitleBar } from "../../../components/app-title-bar";
import { GradientKnob } from "../../../components/gradient-knob";
import { TextureSwatch } from "../../../components/texture-swatch";
import { PaletteContext } from "../../../context/palette-context";
import { BlockLookup } from "../../blocks";
import './styles.css';
import { LazyDialog } from "../../../components/lazy-dialog";
import { GradientHelpContent } from "../../../components/content";
import { Share } from "../../../components/share";


export function Component() {
	const {colors: colorsParam} = useParams();
	const [initialStart, initialEnd, initialSteps] = useMemo(() => {
		const colors = colorsParam ? colorsParam.split('-') : [];

		if (colors.length > 0) {
			colors[0] = '#' + colors[0];
		}

		if (colors.length > 1) {
			colors[1] = '#' + colors[1];
		}

		return colors;
	}, [colorsParam]);

	const navigate = useNavigate();

	const [palette, setPalette] = useState('average');
	const [startColor, setStartColor] = useState(initialStart ?? '#000000');
	const [endColor, setEndColor] = useState(initialEnd ?? '#ffffff');
	const [helpOpen, setHelpOpen] = useState(false);
	const [steps, setSteps] = useState(initialSteps ?? 5);

	/** @type {import("../../server").BlocksResponse} */
	const blocks = useLoaderData();

	const gradient = useMemo(() => {
		return Color.gradient(RGBColor.parseCSSHex(startColor), RGBColor.parseCSSHex(endColor), steps);
	}, [startColor, endColor, steps]);

	const blockLookup = useMemo(() => {
		return new BlockLookup(blocks.blocks);
	}, [blocks]);

	useEffect(() => {
		navigate(`/gradient/${ startColor.substring(1) }-${ endColor.substring(1) }-${ steps }`, {
			replace: true
		});
	}, [startColor, endColor, steps]);

	function paletteChange(e) {
		const select = e.target;
		setPalette(select.options[select.selectedIndex].value);
	}

	return <div className="page-gradient">
		<PaletteContext.Provider value={palette}>
			<AppTitleBar title="Gradient Editor">
				<label>
					Color Extraction:
					<select className="pallette-select" onInput={paletteChange} value={palette}>
						<option value="average">Average</option>
						<option value="mostSaturated">Most Saturated</option>
						<option value="mostCommon">Most Common</option>
					</select>
				</label>
				<button onClick={() => setHelpOpen(true)}><FontAwesomeIcon icon={faQuestion} /></button>
			</AppTitleBar>
			<div className="gradient-editor">
				<div className="gradient-display-container">
					<div className="gradient-display" style={{background: `linear-gradient(to right, ${startColor}, ${endColor})`}}>
					</div>
					<GradientKnob value={startColor} offset={0} onChange={e => {setStartColor(e.target.value)} }></GradientKnob>
					<GradientKnob value={endColor} offset={1} onChange={e => {setEndColor(e.target.value)} }></GradientKnob>
				</div>

				<div className="gradient-controls">
					<label>
						Number of blocks:
						<input type="number" min="2" onInput={(e) => setSteps(+e.target.value)} value={steps} />
					</label>
				</div>

				<div className="gradient-share">
					<Share href={window.location} subject="Block Game Tools - Block Gradient" body="" />
				</div>

				<div className="gradient-swatches">
					{ gradient.map((color, idx) => {
						const blockMatch = blockLookup.find(color, palette);

						return <div className="gradient-swatch-container" key={idx}>
							<TextureSwatch block={blockMatch.block} title={Math.sqrt(blockMatch.magnitude) >= 10 ? 'Out of gamut' : null } />
						</div>
					}) }
				</div>
			</div>
		</PaletteContext.Provider>
		<LazyDialog open={helpOpen} onClose={() => setHelpOpen(false)}>
			<GradientHelpContent />
		</LazyDialog>
	</div>;
}