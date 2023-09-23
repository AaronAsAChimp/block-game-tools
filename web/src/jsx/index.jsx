import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { DATA_DIR } from "./consts.js";

const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('./pages/home/index.jsx')
  }, {
  	path: '/map/',
  	lazy: () => import('./pages/map/index.jsx'),
    loader: () => {
      return fetch(DATA_DIR + 'blocks.json');
    }
  }, {
    path: '/gradient/',
    lazy: () => import('./pages/gradient/index.jsx'),
    loader: () => {
      return fetch(DATA_DIR + 'gradient-blocks.json');
    }
  }, {
    path: '/gradient/:colors',
    lazy: () => import('./pages/gradient/index.jsx'),
    loader: () => {
      return fetch(DATA_DIR + 'gradient-blocks.json');
    }
  }, {
    path: '/texturizer',
    lazy: () => import('./pages/texturizer/index.jsx'),
    loader: () => {
      return fetch(DATA_DIR + 'gradient-blocks.json');
    }
  }, {
    path: '/data/',
    lazy: () => import('./pages/data/index.jsx'),
    loader: () => {
      return fetch(DATA_DIR + 'blocks.json');
    }
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