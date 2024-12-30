/**
 * Payload: -
 * 
 * Description: Used to mark the end of compound tags. This tag does not have a
 * name, so it is always a single byte 0. It may also be the type of empty List
 * tags.
 *
 * @type {number}
 */
export const TAG_END = 0;

/**
 * Payload: 1 byte / 8 bits
 *
 * Description: A signed integral type. Sometimes used for booleans.
 *
 * @type {number}
 */
export const TAG_BYTE = 1;

/**
 * Payload: 2 bytes / 16 bits, signed, big endian 
 *
 * Description: A signed integral type. 
 *
 * @type {number}
 */
export const TAG_SHORT = 2;

/**
 * Payload: 4 bytes / 32 bits, signed, big endian
 *
 * Description: A signed integral type.
 *
 * @type {number}
 */
export const TAG_INT = 3;

/**
 * Payload: 8 bytes / 64 bits, signed, big endian
 *
 * Description: A signed integral type.
 *
 * @type {number}
 */
export const TAG_LONG = 4;

/**
 * Payload: 4 bytes / 32 bits, signed, big endian, IEEE 754-2008, binary32
 *
 * Description: A signed floating point type.
 *
 * @type {number}
 */
export const TAG_FLOAT = 5;


/**
 * Payload: 8 bytes / 64 bits, signed, big endian, IEEE 754-2008, binary64
 *
 * Description: A signed floating point type.
 *
 * @type {number}
 */
export const TAG_DOUBLE = 6;

/**
 * Payload: A signed integer (4 bytes) size, then the bytes comprising an array
 * of length size.
 *
 * Description: An array of bytes.
 *
 * @type {number}
 */
export const TAG_BYTE_ARRAY = 7;

/**
 * Payload: An unsigned short (2 bytes)[3] payload length, then a UTF-8 string
 * resembled by length bytes.
 *
 * Description: A UTF-8 string. It has a size, rather than being null terminated.
 *
 * @type {number}
 */
export const TAG_STRING = 8;

/**
 * Payload: A byte denoting the tag ID of the list's contents, followed by the
 * list's length as a signed integer (4 bytes), then length number of payloads
 * that correspond to the given tag ID.
 *
 * Description: A list of tag payloads, without tag IDs or names, apart from the
 * one before the length. 
 *
 * @type {number}
 */
export const TAG_LIST = 9;

/**
 * Payload: Fully formed tags, followed by a TAG_End.
 *
 * Description: A list of fully formed tags, including their IDs, names, and
 * payloads. No two tags may have the same name.
 *
 * @type {number}
 */
export const TAG_COMPOUND = 10;

/**
 * Payload: A signed integer size, then size number of TAG_Int's payloads.
 *
 * Description: An array of TAG_Int's payloads.
 *
 * @type {number}
 */
export const TAG_INT_ARRAY = 11;

/**
 * Payload: A signed integer size, then size number of TAG_Long's payloads.
 *
 * Description: An array of TAG_Long's payloads.
 *
 * @type {number}
 */
export const TAG_LONG_ARRAY = 12;


const TEXT_DECODER = new TextDecoder('utf-8');
const TEXT_ENCODER = new TextEncoder('utf-8');


/**
 * Read untagged values from the buffer and add it to parsed.
 *
 * ```js
 * [value value, ...]
 * ```
 *
 * @param  {DataView} buffer The buffer to read from.
 * @param  {number} offset The offset to start parsing at.
 * @param  {number} tag    The tag to use to interpret the value.
 * @param  {any[]} parsed   An array to put the values in
 *
 * @return {number} The new offset.
 */
function readUntagged(buffer, offset, tag, parsed) {
	switch (tag) {
		case TAG_BYTE:
			parsed.push(buffer.getInt8(offset));
			return offset + 1;
		case TAG_SHORT:
			parsed.push(buffer.getInt16(offset));
			return offset + 2;
		case TAG_INT:
			parsed.push(buffer.getInt32(offset));
			return offset + 4;
		case TAG_LONG:
			parsed.push(buffer.getBigInt64(offset));
			return offset + 8;
		case TAG_FLOAT:
			parsed.push(buffer.getFloat32(offset));
			return offset + 4;
		case TAG_DOUBLE:
			parsed.push(buffer.getFloat64(offset));
			return offset + 8;
		case TAG_BYTE_ARRAY:
			const arrayLen = buffer.getInt32(offset);
			offset += 4;

			parsed.push(buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + arrayLen));

			return offset + arrayLen;
		case TAG_STRING:
			// This is the only signed length in NBT
			const stringLen = buffer.getUint16(offset);
			offset += 2;

			parsed.push(TEXT_DECODER.decode(buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + stringLen)));
			
			return offset + stringLen;
		case TAG_LIST:
			const listType = buffer.getUint8(offset);
			offset += 1;

			let remaining = buffer.getInt32(offset);
			offset += 4;

			const listValues = [listType];

			while (remaining > 0) {
				offset = readUntagged(buffer, offset, listType, listValues);

				remaining--;
			}

			parsed.push(listValues);

			return offset;
		case TAG_COMPOUND:
			const compoundValues = [];
			offset = readTagged(buffer, compoundValues, offset);
			parsed.push(compoundValues);

			return offset;
		case TAG_INT_ARRAY:
			const intArrayLen = buffer.getUint32(offset);
			offset += 4;

			// This can't be an Int32Array view of the buffer because of
			// endianness-- the code wont be portable.
			const intArray = new Int32Array(intArrayLen);

			for (let i = 0; i < intArrayLen; i++) {
				intArray[i] = buffer.getInt32(offset);
				offset += 4;
			}

			parsed.push(intArray);

			return offset;
		case TAG_LONG_ARRAY:
			const longArrayLen = buffer.getUint32(offset);
			offset += 4;

			// This can't be an Int32Array view of the buffer because of
			// endianness-- the code wont be portable.
			const longArray = new  BigInt64Array(longArrayLen);

			for (let i = 0; i < longArrayLen; i++) {
				longArray[i] = buffer.getBigInt64(offset);
				offset += 8;
			}

			parsed.push(longArray);

			return offset;
		case TAG_END:
			throw new Error(`End tags have no value.`);
		default:
			throw new Error(`Unknown tag 0x${ tag.toString(16) }.`);
	}
}

/**
 * Read NBT from the given buffer into `parsed`.
 * 
 * ```js
 * [tag ID, name, value, tag ID, name, value, ...]
 * ```
 *
 * @param  {DataView} buffer The buffer to read from.
 * @param  {any[]} parsed   An array to put the values in
 * @param  {number} [offset] The offset to start parsing at.
 *
 * @return {number} The new offset.
 */
export function readTagged(buffer, parsed, offset) {
	if (!offset) {
		offset = 0;
	}

	if (!parsed) {
		parsed = [];
	}

	while (offset < buffer.byteLength) {
		const tag = buffer.getUint8(offset);
		parsed.push(tag);
		offset += 1;

		if (tag !== TAG_END) {
			const nameLength = buffer.getUint16(offset);
			offset += 2;

			const name = TEXT_DECODER.decode(buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + nameLength));
			parsed.push(name);
			offset += nameLength;
		} else {
			break;
		}

		offset = readUntagged(buffer, offset, tag, parsed);
	}

	return offset;
}

/**
 * Take the parsed NBT from `readTagged` and convert it to a javascript object
 * for ease of use.
 *
 * @param  {any[]} parsed   An array to put the values in
 *
 * @return {any} The object
 */
export function toObject(compound) {
	const obj = {};

	for (let i = 0; i < compound.length; i += 3) {
		const tag = compound[i];
		const name = compound[i + 1];
		let value = compound[i + 2];

		if (tag === TAG_COMPOUND) {
			value = toObject(value);	
		} else if (tag === TAG_END) {
			continue;
		}

		obj[name] = value;
	}

	return obj;
}


function writeUntagged(tag, value) {
	let valueBytes = null;

	switch (tag) {
		case TAG_BYTE:
			valueBytes = new Uint8Array(1);
			new DataView(valueBytes.buffer).setInt8(0, value);
			break;
		case TAG_SHORT:
			valueBytes = new Uint8Array(2);
			new DataView(valueBytes.buffer).setInt16(0, value);
			break;
		case TAG_INT:
			valueBytes = new Uint8Array(4);
			new DataView(valueBytes.buffer).setInt32(0, value);
			break;
		case TAG_LONG:
			valueBytes = new Uint8Array(8);
			new DataView(valueBytes.buffer).setBigInt64(0, value);
			break;
		case TAG_FLOAT:
			valueBytes = new Uint8Array(4);
			new DataView(valueBytes.buffer).setFloat32(0, value);
			break;
		case TAG_DOUBLE:
			valueBytes = new Uint8Array(8);
			new DataView(valueBytes.buffer).setFloat64(0, value);
			break;
		case TAG_BYTE_ARRAY:
			valueBytes = new Uint8Array(value.length + 4);
			new DataView(valueBytes.buffer).setInt32(0, value.length);
			valueBytes.set(value, 4);
			break;
		case TAG_STRING:
			const encoded = TEXT_ENCODER.encode(value);
			valueBytes = new Uint8Array(encoded.length + 2);
			// This is the only unsigned length in NBT
			new DataView(valueBytes.buffer).setUint16(0, encoded.length);
			valueBytes.set(encoded, 2);
			break;
		case TAG_LIST:
			const listType = value[0];
			const listValues = new Array(value.length);
			const headerBytes = new Uint8Array(5);
			const headerView = new DataView(headerBytes.buffer);

			headerView.setUint8(0, listType);
			headerView.setInt32(1, value.length - 1);

			listValues[0] = headerBytes;

			let totalListBytes = headerBytes.length;

			for (let i = 1; i < value.length; i++) {
				const untaggedValue = writeUntagged(listType, value[i]);
				totalListBytes += untaggedValue.length;
				listValues[i] = untaggedValue;
			}

			let offsetListBytes = 0;

			valueBytes = new Uint8Array(totalListBytes);

			for (const listValue of listValues) {
				valueBytes.set(listValue, offsetListBytes);
				offsetListBytes += listValue.length;
			}

			break;
		case TAG_COMPOUND:
			valueBytes = writeTagged(value);
			break;
		case TAG_INT_ARRAY:
			valueBytes = new Uint8Array((value.length * 4) + 4);
			const intArrView = new DataView(valueBytes.buffer);

			intArrView.setUint32(0, value.length);

			// We can't do a direct set of the data because of endianness.
			for (let i = 0; i < value.length; i++) {
				intArrView.setUint32((i * 4) + 4, value[i]);
			}
			break;
		case TAG_LONG_ARRAY:
			valueBytes = new Uint8Array((value.length * 8) + 4);
			const longArrView = new DataView(valueBytes.buffer);

			longArrView.setUint32(0, value.length);

			// We can't do a direct set of the data because of endianness.
			for (let i = 0; i < value.length; i++) {
				longArrView.setBigUint64((i * 8) + 4, value[i]);
			}

			break;
		case TAG_END:
			valueBytes = null;
			break;
		default:
			if (typeof tag === 'number') {
				throw new Error(`Unknown tag 0x${ tag.toString(16) }.`);
			} else {
				console.log('TAG', tag);
				throw new Error(`Tag type is not a number it is a ${ typeof tag }`)
			}
	}

	return valueBytes;
}


export function writeTagged(parsed) {
	// if (!offset) {
	// 	offset = 0;
	// }

	const parts = new Array(parsed.length);
	let length = 0;

	for (let i = 0; i < parsed.length; i += 3) {
		const tag = parsed[i];
		const name = parsed[i + 1];
		const value = parsed[i + 2];

		length += 1;
		parts[i] = tag;

		if (tag !== TAG_END) {
			const nameBytes = TEXT_ENCODER.encode(name);
			length += 2 + nameBytes.byteLength;
			parts[i + 1] = nameBytes;
		}

		const valueBytes = writeUntagged(tag, value);

		parts[i + 2] = valueBytes;
		length += valueBytes?.length ?? 0;
	}

	const outputBytes = new Uint8Array(length);
	const buffer = new DataView(outputBytes.buffer);
	let offset = 0;

	for (let i = 0; i < parts.length; i += 3) {
		const tag = parts[i];
		const name = parts[i + 1];
		const value = parts[i + 2];

		buffer.setUint8(offset, tag);
		offset += 1;

		if (tag !== TAG_END) {
			buffer.setInt16(offset, name.length);
			offset += 2;

			outputBytes.set(name, offset);
			offset += name.length;

			outputBytes.set(value, offset);
			offset += value.length;
		}
	}

	return outputBytes;
}

export function sortKeys(parsed) {
	if (!parsed.length) {
		return parsed;
	}

	/** @type {[string, number][]} */
	const names = [];

	for (let i = 1; i < parsed.length; i+=3) {
		names.push([parsed[i], i - 1]);
	}

	names.sort((a, b) => {
		return a[0].localeCompare(b[0]);
	});

	const result = new Array(parsed.length);
	let i  = 0;

	for (const name of names) {
		const type = parsed[name[1]];
		let value = parsed[name[1] + 2];

		if (type === TAG_COMPOUND) {
			value = sortKeys(value);
		}

		result[i] = type;
		result[i + 1] = parsed[name[1] + 1];
		result[i + 2] = value;
		i += 3;
	}

	if (i < parsed.length) {
		result[i] = parsed[i];
	}

	return result;
}
