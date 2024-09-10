import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import inject from '@rollup/plugin-inject';
import stdLibBrowser from 'node-stdlib-browser';

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
        // 'crypto': stdLibBrowser.crypto,
        'util': stdLibBrowser.util
      },
    },
    optimizeDeps: {
      include: ['web-astro > node-stdlib-browser > buffer', 'process'],
    },
    plugins: [
      {
        ...inject({
          global: [
            import.meta.resolve('node-stdlib-browser/helpers/esbuild/shim'),
            'global',
          ],
          process: [
            import.meta.resolve('node-stdlib-browser/helpers/esbuild/shim'),
            'process',
          ],
          Buffer: [
            import.meta.resolve('node-stdlib-browser/helpers/esbuild/shim'),
            'Buffer',
          ],
        }),
        enforce: 'post',
      },
    ],
  },
});