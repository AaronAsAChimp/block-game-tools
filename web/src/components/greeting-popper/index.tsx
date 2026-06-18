import { GreetingContent } from '../content';
import {LazyDialog} from '../lazy-dialog';
import { useState } from 'react';

export function GreetingPopper() {
	const [open, setOpen] = useState(() => {
		const val = Math.random() <= 0.02;

		console.log(val);
		return val;
	});

	return <LazyDialog open={open} onClose={() => {setOpen(false)}}>
		<GreetingContent />
	</LazyDialog>
}