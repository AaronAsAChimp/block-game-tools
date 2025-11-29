import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { Writable } from 'stream';


interface CacheEntry {
	id: string
	path: string

	/**
	 * The contents of the ETag header when it was last retrieved from
	 * the server.
	 */
	etag?: string

	/**
	 * The contents of the Last-Modified header when it was last retrieved from
	 * the server.
	 */
	lastModified?: string

	/**
	 * The contents of the Date header when it was last retrieved from
	 * the server.
	 */
	date?: string,

	/**
	 * Millisecond timestamp in UTC when the cache expires or never if null
	 * or undefined.
	 */
	expires?: number
}

let cacheDescriptors: Record<string, CacheEntry> | null = null;

async function checkAndLoadDescriptors(cacheDir: string) {
	if (!cacheDescriptors) {
		try {
			const file = await fs.readFile(path.join(cacheDir, 'cache.json'), 'utf8');

			cacheDescriptors = JSON.parse(file);

			await cleanupCache(cacheDir);
		} catch (e) {
			if (e.code !== 'ENOENT' && !(e instanceof SyntaxError)) {
				console.log('ENOENT')
				throw e;
			} else {
				cacheDescriptors = {};
			}
		}
	}
}

async function cleanupCache(cacheDir: string) {
	const cleanupDepth = Math.random() * 100;

	// if (cacheDescriptors && 'https://piston-meta.mojang.com/v1/packages/2d948bd014404ae62486c225ca0157d899872cfa/1.21.10.json' in cacheDescriptors) {
	// 	console.log('Expires', cacheDescriptors);
	// }

	if (cleanupDepth < 20) {
		const currentDate = new Date().getTime();
		const accountedForPaths = new Set([
			path.join(cacheDir, 'cache.json')
		]);
		const deletes = [];

		for (const [url, cacheDesc] of Object.entries(cacheDescriptors)) {
			accountedForPaths.add(cacheDesc.path);

			if (cacheDesc?.expires && cacheDesc.expires > currentDate) {

				deletes.push(fs.unlink(cacheDesc.path));

				delete cacheDescriptors[url];
			}
		}

		if (cleanupDepth < 2) {
			const files = await fs.readdir(cacheDir);

			for (const file of files) {
				const filePath = path.join(cacheDir, file);

				if (!accountedForPaths.has(filePath)) {
					deletes.push(fs.unlink(filePath));
				}
			}
		}

		deletes.push(writeDescriptors(cacheDir));

		await Promise.all(deletes);
	}
}

async function writeDescriptors(cacheDir: string) {
	const file = JSON.stringify(cacheDescriptors, null, 4);

	console.log('Write Descriptors');

	await fs.writeFile(path.join(cacheDir, 'cache.json'), file);	
}

async function getCacheDescriptor(url: string, cacheDir: string): Promise<CacheEntry | null> {
	await checkAndLoadDescriptors(cacheDir);

	return cacheDescriptors[url] ?? null;
}

async function setCacheDescriptor(url: string, cacheDir: string, entry: CacheEntry): Promise<void> {
	await checkAndLoadDescriptors(cacheDir);

	console.log('Set cache descriptors', url, entry);

	cacheDescriptors[url] = entry;

	await writeDescriptors(cacheDir);
}


// See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control#directives
interface CacheControl {
	maxAge?: number
	sMaxage?: number
	staleWhileRevalidate?: number
	staleIfError?: number

	noCache?: boolean
	noStore?: boolean
	noTransform?: boolean
	mustRevalidate?: boolean
	proxyRevalidate?: boolean
	mustUnderstand?: boolean
	privateRequired?: boolean
	publicAllowed?: boolean
	immutable?: boolean
}


/**
 * Parse the response-side Cache-Control header.
 */
function parseCacheControl(cacheControl: string): CacheControl {
	const parsed: CacheControl = {};
	const headerParts = cacheControl.split(',');

	for (let i = 0; i < headerParts.length; i++) {
		const part = headerParts[i];

		switch (part) {
			case 'no-cache':
				parsed.noCache = true;
				break;
			case 'must-revalidate':
				parsed.mustRevalidate = true;
				break;
			case 'proxy-revalidate':
				parsed.proxyRevalidate = true;
				break;
			case 'private':
				parsed.privateRequired = true;
				break;
			case 'public':
				parsed.publicAllowed = true;
				break;
			case 'must-understand':
				parsed.mustUnderstand = true;
				break;
			case 'no-transform':
				parsed.noTransform = true;
				break;
			case 'immutable':
				parsed.immutable = true;
				break;
			default:
				if (typeof part === 'string' && part.length > 3) {
					let partKeyValueParts = part.trim().split('=', 2);
					let numericPart = parseInt(partKeyValueParts[1], 10);

					if (isFinite(numericPart)) {
						switch (partKeyValueParts[0]) {
							case 'max-age':
								parsed.maxAge = numericPart;
								break;
							case 's-maxage':
								parsed.sMaxage = numericPart;
								break;
							case 'stale-while-revalidate':
								parsed.staleWhileRevalidate = numericPart;
								break;
							case 'stale-if-error':
								parsed.staleIfError = numericPart;
								break;
							default:
								break;
						}
					} // Otherwised an unknown part or malformed part e.g.: "cheesecake"  or  "max-age="
				} // Otherwise an undefined or malformed part
		}
	}

	return parsed;
}


let _tempDir: string | null = null;

/**
 * Lazily create a temp directory.
 */
async function getTempDir() {
	if (!_tempDir) {
		_tempDir = await fs.mkdtemp(path.join(tmpdir(), 'net-cache-'));
	}

	return _tempDir;
}


/**
 * Update the downloaded response in the cache.
 */
async function checkAndRefreshCache(url: string, cacheDir: string): Promise<CacheEntry> {
	let cacheDesc = await getCacheDescriptor(url, cacheDir);

	console.log('cacheDesc', !!cacheDesc)

	if (cacheDesc?.expires && cacheDesc.expires > new Date().getTime()) {
		console.log(`Cache still valid for ${url}`);
		return cacheDesc;
	}

	const headers = new Headers();

	if (cacheDesc?.etag) {
		headers.set('If-None-Match', cacheDesc.etag);
	}

	if (cacheDesc?.lastModified) {
		headers.set('If-Modified-Since', cacheDesc.lastModified);
	}

	const res = await fetch(url, {
		headers,
	});

	if (!cacheDesc) {
		const id = crypto.randomUUID();

		cacheDesc = {
			id,
			path: path.join(cacheDir, id + '.bin')
		};
	}

	if (res.status === 200) {
		const etag = res.headers.get('ETag');
		const lastModified = res.headers.get('Last-Modified');
		const date = res.headers.get('Date');

		await fs.mkdir(cacheDir, {
			recursive: true
		})

		let requestDate: Date | null = null;
		let modifiedDate: Date | null = null;
		let cacheControl: CacheControl | null = null;

		if (res.headers.has('Cache-Control')) {
			cacheControl = parseCacheControl(res.headers.get('Cache-Control'))
		}

		if (date) {
			cacheDesc.date = date;
			requestDate = new Date(date);
		} else {
			requestDate = new Date();
		}

		if (etag) {
			cacheDesc.etag = etag;
		}

		if (lastModified) {
			cacheDesc.lastModified = lastModified;
			modifiedDate = new Date(modifiedDate);
			// cacheDesc.expires = new Date().getTime() + DEFAULT_CACHE_TTL;
		}

		console.log('Cache control', cacheControl);

		if (cacheControl?.maxAge) {
			console.log('Max age', requestDate.getTime(), (cacheControl?.maxAge * 1000));
			cacheDesc.expires = requestDate.getTime() + (cacheControl?.maxAge * 1000);
		} else if (modifiedDate) {
			let delta = requestDate.getTime() - modifiedDate.getTime();

			if (delta > 0) {
				// Standard heuristic is 10% of the total time its been since it was last modified
				// https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching#heuristic_caching
				cacheDesc.expires = requestDate.getTime() + (delta / 10)
			}
		}

		// console.log(`Downloading ${url}`);
		// // console.log('Headers', res.headers);

		const tempDir = await getTempDir();
		const tempFile = path.join(tempDir, cacheDesc.id + '.bin');
		const writable = Writable.toWeb(createWriteStream(tempFile));
		const writer = writable.getWriter();

		try {
			if (res.body) {
				const reader = res.body.getReader();
				let done = false;

				while (!done) {
					await writer.ready;

					const chunk = await reader.read();

					if (!chunk.done) {
						await writer.write(chunk.value);
					}

					done = chunk.done;
				}
			}
		} finally {
			await writer.ready;
			await writer.close();
		}

		await fs.rename(tempFile, cacheDesc.path);

		await setCacheDescriptor(url, cacheDir, cacheDesc);
	} else if (res.status === 304) {
		console.log(`No update needed for ${url}`);
	} else {
		throw new Error(`Error downloading ${url}: ${ res.status } ${ res.statusText }`)
	}

	return cacheDesc;
}

export async function download(url: string, cacheDir: string, destFilename: string) {
	const cacheDesc = await checkAndRefreshCache(url, cacheDir);

	await fs.copyFile(cacheDesc.path, destFilename);
}

export async function downloadJson(url: string, cacheDir: string) {
	const cacheDesc = await checkAndRefreshCache(url, cacheDir);

	// TODO: properly handle encoding
	return JSON.parse(await fs.readFile(cacheDesc.path, 'utf8'));
}
