import { TAG_BYTE, TAG_BYTE_ARRAY, TAG_COMPOUND, TAG_DOUBLE, TAG_END, TAG_FLOAT, TAG_INT, TAG_INT_ARRAY, TAG_LIST, TAG_LONG, TAG_LONG_ARRAY, TAG_SHORT, TAG_STRING, writeTagged } from './low-level.js';

export const byte = Symbol('nbt:byte');
export const short = Symbol('nbt:short');
export const int = Symbol('nbt:int');
export const long = Symbol('nbt:long');
export const float = Symbol('nbt:float');
export const double = Symbol('nbt:double');
export const byteArray = Symbol('nbt:byte-array');
export const string = Symbol('nbt:string');
export const intArray = Symbol('nbt:int-array');
export const longArray = Symbol('nbt:long-array');

class NbtRecord {
	type;

	constructor(type) {
		this.type = type;
	}
}

export function record(type) {
	return new NbtRecord(type);
}

const BASIC_TYPES = {};

BASIC_TYPES[byte] = TAG_BYTE;
BASIC_TYPES[short] = TAG_SHORT;
BASIC_TYPES[int] = TAG_INT;
BASIC_TYPES[long] = TAG_LONG;
BASIC_TYPES[float] = TAG_FLOAT;
BASIC_TYPES[double] = TAG_DOUBLE;
BASIC_TYPES[byteArray] = TAG_BYTE_ARRAY;
BASIC_TYPES[string] = TAG_STRING;
BASIC_TYPES[intArray] = TAG_INT_ARRAY;
BASIC_TYPES[longArray] = TAG_LONG_ARRAY;


/**
 * Deserialize `buf` to a JavaScript object using `schema`.
 *
 * @param  {Uint8Array} buf   The buffer to deserialize
 * @param  {import('./types.d.ts').NBTSchema} schema The schema
 *
 * @return {any}        The object.
 */
export function parse(buf, schema) {

}

function describeType(type, prefix='') {
	if (type.description) {
		return type.description;
	} else if (Array.isArray(type)) {
		if (type.length) {
			return `list[${describeType(type[0], prefix)}]`
		} else {
			return 'list[empty]';
		}
	} else {
		let description = '{\n';

		for (const key of Object.keys(type)) {
			description += `${ prefix }"${ key }": ${ describeType(type[key], prefix + '    ') },\n`;
		}

		return description + '}\n';
	}
}

function _flattenValue(type, value) {
	// console.log('Flattening', type, value);
	const tag_id = BASIC_TYPES[type];

	if (tag_id) {
		return value;
	} else if (Array.isArray(type)) {
		if (type.length === 1) {
			return [_mapType(type[0]), ...value.map(item => _flattenValue(type[0], item))];
		} else if (type.length === 0) {
			return [TAG_END];
		} else {
			throw new Error('Lists must have only one type.')
		}
	} else if (type instanceof NbtRecord) {
		return flattenRecord(value, type);
	} else if (typeof type !== 'undefined' && type !== null) {
		return flattenObject(value, type);
	} else {
		throw new Error(`Unknown type (${ type }) for value (${ value })`)
	}
}

function _mapType(type) {
	const tag_id = BASIC_TYPES[type];

	if (tag_id) {
		return tag_id;
	} else if (Array.isArray(type)) {
		return TAG_LIST;
	} else if (type instanceof NbtRecord) {
		return TAG_COMPOUND;
	} else if (typeof type !== 'undefined' && type !== null) {
		return TAG_COMPOUND;
	} else {
		throw new Error(`Unknown type (${ type })`);
	}
}

/**
 * Flatten the object into a list that can be passed to `writeTagged`.
 *
 * @param  {any} obj    The object to serialize
 * @param  {NbtRecord} schema The schemaa.
 *
 * @return {any[]} The buffer.
 */
function flattenRecord(obj, schema) {
	let nbt = [];

	for (const key of Object.keys(obj)) {
		const type = schema.type;

		if (!obj.hasOwnProperty(key) || typeof obj[key] === 'undefined' || obj[key] === null) {
			// throw new Error(`Value missing for ${ key }, expected value of type ${ describeType(type) }. NBT does not support null or undefined values.`)
			continue;
		}

		const value = obj[key];
		const tag_id = _mapType(type);

		nbt.push(tag_id, key, _flattenValue(type, value));
	}

	nbt.push(TAG_END);

	return nbt;
}


/**
 * Flatten the object into a list that can be passed to `writeTagged`.
 *
 * @param  {any} obj    The object to serialize
 * @param  {import('./types.d.ts').NBTSchema} schema The schemaa.
 *
 * @return {any[]} The buffer.
 */
function flattenObject(obj, schema) {
	let nbt = [];

	for (const key of Object.keys(schema)) {
		const type = schema[key];

		if (!obj.hasOwnProperty(key) || typeof obj[key] === 'undefined' || obj[key] === null) {
			// throw new Error(`Value missing for ${ breadcrumb }${ key }, expected value of type ${ describeType(type) }. NBT does not support null or undefined values.`)
			continue;
		}

		const value = obj[key];
		const tag_id = _mapType(type);

		nbt.push(tag_id, key, _flattenValue(type, value));
	}

	nbt.push(TAG_END);

	return nbt;
}

/**
 * Serialize `obj` to a Uint8Array using `schema`.
 *
 * @param  {any} obj    The object to serialize
 * @param  {import('./types.d.ts').NBTSchema} schema The schemaa.
 *
 * @return {Uint8Array} The buffer.
 */
export function bufferify(obj, schema) {
	const flattened = _flattenValue(schema, obj);

	return writeTagged([_mapType(schema), '', flattened]);
}
