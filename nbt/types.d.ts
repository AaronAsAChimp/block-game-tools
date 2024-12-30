export const byte: Symbol;
export const short: Symbol;
export const int: Symbol;
export const long: Symbol;
export const float: Symbol;
export const double: Symbol;
export const byteArray: Symbol;
export const string: Symbol;
export const intArray: Symbol;
export const longArray: Symbol;

class NbtRecord {
	type: NBTSchema;

	constructor(type: NBTSchema);
}

export function record(type: NBTSchema): NbtRecord;

export type NBTSchema = Symbol | NbtRecord | [NBTSchema] | [] | { [key: string]: NBTSchema };

export function bufferify(obj: any, schema: NBTSchema): Uint8Array;
