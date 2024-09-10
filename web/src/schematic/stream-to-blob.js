/**
 * Convert a stream to a blob
 * @param  {Readonly<ReadableStream>} stream A browser stream
 * @return {Promise<Blob>}
 */
export async function streamToBlob(stream) {
	const parts = []

	for await (const chunk of stream) {
		parts.push(chunk);
	}

	return new Blob(parts);
}