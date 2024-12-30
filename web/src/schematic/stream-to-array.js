/**
 * Convert a stream to a blob
 * @param  {Readonly<ReadableStream>} stream A browser stream
 * @return {Promise<Uint8Array>}
 */
export async function streamToUint8Array(stream) {
	/** @type {Uint8Array[]} */
	const parts = [];
	let length = 0;

	for await (const chunk of stream) {
		parts.push(chunk);
		length += chunk.length;
	}

	const result = new Uint8Array(length);
	let offset = 0;

	for (const part of parts) {
		result.set(part, offset);
		offset += part.length;
	}

	return result;
}