import { useState } from "react";
import { LazyDialog } from "../lazy-dialog";
import { GradientDisplay } from "../gradient-display";

/**
 * A component for choosing a color for a gradient
 * @param {import("../gradient-display").GradientDisplayProps} props
 */
export function GradientButton({onGradientChange, initialGradientStops}) {
	const [editorOpen, setEditorOpen] = useState(false);
	return <>
		<button onClick={() => setEditorOpen(true)}>Gradient</button>
		<LazyDialog open={editorOpen} onClose={() => setEditorOpen(false)} >
			<GradientDisplay onGradientChange={onGradientChange} initialGradientStops={initialGradientStops}/>
		</LazyDialog>
	</>
}