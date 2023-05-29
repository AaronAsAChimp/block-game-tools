import test from 'ava';

import {Router} from '../src/js/router.js';

test('a router can add and execute a route.', t => {
	// Arrange
	let loadCalls = 0;
	let unloadCalls = 0;
	const router = new Router();

	router.add('/test/route', {
		load() {
			loadCalls++;
		},
		unload() {
			unloadCalls++;
		}
	});

	// Act
	router.loadPage('/test/route');

	// Assert
	t.is(loadCalls, 1, 'check that the load method was called.');
	t.is(unloadCalls, 0, 'check that the unload method was not called.');
});

test('a router can execute an error route.', t => {
	// Arrange
	let loadCalls = 0;
	let unloadCalls = 0;
	const router = new Router();

	router.setErrorRoute({
		load() {
			loadCalls++;
		},
		unload() {
			unloadCalls++;
		}
	});

	// Act
	router.loadPage('/test/route');

	// Assert
	t.is(loadCalls, 1, 'check that the load method was called.');
	t.is(unloadCalls, 0, 'check that the unload method was not called.');
});

test('a router can execute two routes.', t => {
	// Arrange
	let loadCalls = 0;
	let unloadCalls = 0;
	const router = new Router();

	router
		.add('/test/route', {
			load() {
				loadCalls++;
			},
			unload() {
				unloadCalls++;
			}
		})
		.add('/test/route2', {
			load() {
				loadCalls++;
			},
			unload() {
				unloadCalls++;
			}
		});

	// Act
	router.loadPage('/test/route');
	router.loadPage('/test/route2');

	// Assert
	t.is(loadCalls, 2, 'check that the load method was called.');
	t.is(unloadCalls, 1, 'check that the unload method was not called.');
});

test('a router will remove a trailing slash when loaded.', t => {
	// Arrange
	let loadCalls = 0;
	let unloadCalls = 0;
	const router = new Router();

	router.add('/test/route', {
		load() {
			loadCalls++;
		},
		unload() {
			unloadCalls++;
		}
	});

	// Act
	router.loadPage('/test/route/');

	// Assert
	t.is(loadCalls, 1, 'check that the load method was called.');
	t.is(unloadCalls, 0, 'check that the unload method was not called.');
});

test('a router will remove a trailing slash when defined.', t => {
	// Arrange
	let loadCalls = 0;
	let unloadCalls = 0;
	const router = new Router();

	router.add('/test/route/', {
		load() {
			loadCalls++;
		},
		unload() {
			unloadCalls++;
		}
	});

	// Act
	router.loadPage('/test/route');

	// Assert
	t.is(loadCalls, 1, 'check that the load method was called.');
	t.is(unloadCalls, 0, 'check that the unload method was not called.');
});
