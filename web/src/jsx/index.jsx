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
  }
]);

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);