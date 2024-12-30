import { defineConfig } from 'astro/config';
import react from "@astrojs/react";


// https://astro.build/config
export default defineConfig({
  integrations: [react()],
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