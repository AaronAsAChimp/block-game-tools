import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";


// https://astro.build/config
export default defineConfig({
  site: 'https://blockgametools.com/',
  integrations: [
    react(),
    sitemap()
  ],
  vite: {
    // build: {
    //   commonjsOptions: {
    //     include: [
    //       stdLibBrowser.crypto
    //     ]
    //   }
    // },
    resolve: {
      alias: {
      },
    },
    optimizeDeps: {
    },
    plugins: [],
  },
});