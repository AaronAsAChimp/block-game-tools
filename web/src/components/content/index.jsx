import { lazy } from 'react';

class Writer {
	#buffer;

	constructor() {
		this.#buffer = ''
	}

	getBuffer(){
		return this.#buffer;
	}

	write(chunk) {
		console.log('chunk', chunk);
		if (typeof chunk.type === 'undefined') {
			this.#buffer += chunk;
		}
	}
}

export const AboutContent = lazy(async () => {
	const markdownContent = await import('../../md/about.md');
	const content = new Writer();
	
	await markdownContent.default({}, null, null).render(content);

	return {
		default: function () {

			return <div dangerouslySetInnerHTML={{
				__html: content.getBuffer()
			}}></div>
		}
	}
});

export const MapHelpContent = lazy(async () => {
	const markdownContent = await import('../../md/help/map.md');
	const content = new Writer();
	
	await markdownContent.default({}, null, null).render(content);

	return {
		default: function () {
			return <div dangerouslySetInnerHTML={{
				__html: content.getBuffer()
			}}></div>
		}
	}
});

export const GradientHelpContent = lazy(async () => {
	const markdownContent = await import('../../md/help/gradient.md');
	const content = new Writer();
	
	await markdownContent.default({}, null, null).render(content);

	return {
		default: function () {
			return <div dangerouslySetInnerHTML={{
				__html: content.getBuffer()
			}}></div>
		}
	}
});