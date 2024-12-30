# nbt-zero

## A no-nonsense NBT reader and writer

Specific types of nonsense:

- ❎ Native modules
- ❎ Platform APIs (Node.js, Browser, etc.)
- ❎ Dependencies
- ❎ Bespoke build processes

### Usage

NBT uses the Java type system which doesn't cleanly map to JavaScript types. You
will need to create a schema to map the JavaScript objects to the appropriate
NBT types.

#### API

```js
import NBT from 'nbt-zero';

const metadataSchema = {
	Author: NBT.string,
	Description: NBT.string,
	EnclosingSize: {
		x: NBT.int,
		y: NBT.int,
		z: NBT.int
	},
	Name: NBT.string,
	RegionCount: NBT.int,
	TimeCreated: NBT.long,
	TimeModified: NBT.long,
	TotalBlocks: NBT.int,
	TotalVolume: NBT.int
};

const metadata = NBT.parse(buffer, metadataSchema);
const bytes = NBT.bufferify(metadata, metadataSchema);
```


### Q & A

#### Q: Is it blazingly fast?

A: Its fast enough.

#### Q: What do you have against the other NBT libraries?

A: Nothing really. I just got tired of trying to make them work in a browser and the polyfills add sooooo much bloat.




