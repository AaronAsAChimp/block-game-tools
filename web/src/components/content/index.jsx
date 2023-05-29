import { lazy } from 'react';

export const AboutContent = lazy(async () => {
	const markdownContent = await import('../../md/about.md');

	return {
		default: function () {
			return <div dangerouslySetInnerHTML={{
				__html: markdownContent.default
			}}></div>
		}
	}
});

export const MapHelpContent = lazy(async () => {
	const markdownContent = await import('../../md/help.md');

	return {
		default: function () {
			return <div dangerouslySetInnerHTML={{
				__html: markdownContent.default
			}}></div>
		}
	}
});