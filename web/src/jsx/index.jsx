import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { DATA_DIR } from "./consts.js";

    const params = new URLSearchParams(window.location.search);

if (params.has('url')) {
    window.history.replaceState(null, null, decodeURIComponent(params.get('url')));
}

/**
 * @param {string} url The URL of the JSON to load
 */
function loadJson(url) {
  return async () => {
    const res = await fetch(url);

    // Doing it this way will assert that its actually JSON.
    return await res.json();
  }
}

const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('./pages/home/index.jsx')
  }, {
    path: '/map/',
    lazy: () => import('./pages/map/index.jsx'),
    loader: loadJson(DATA_DIR + 'blocks.json')
  }, {
    path: '/gradient/',
    lazy: () => import('./pages/gradient/index.jsx'),
    loader: loadJson(DATA_DIR + 'gradient-blocks.json')
  }, {
    path: '/gradient/:colors',
    lazy: () => import('./pages/gradient/index.jsx'),
    loader: loadJson(DATA_DIR + 'gradient-blocks.json')
  }, {
    path: '/texturizer',
    lazy: () => import('./pages/texturizer/index.jsx'),
    loader: loadJson(DATA_DIR + 'gradient-blocks.json')
  }, {
    path: '/data/',
    lazy: () => import('./pages/data/index.jsx'),
    loader: loadJson(DATA_DIR + 'all-blocks.json')
  }
], {
basename: process.env.PUBLIC_URL ?? '/'
});

const root = createRoot(document.getElementById("root"));
root.render(
<StrictMode>
  <RouterProvider router={router} />
</StrictMode>
);
