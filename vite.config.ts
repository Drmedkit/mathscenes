// Vite: multi-page app (pages/*.html) + Vitest config.
// MathJax 4 is imported as plain ES modules straight from node_modules (no CDN, no pre-bundling): the font's dynamic
// files (src/core/mathjax.ts, DYNAMIC) must resolve to the SAME module instance as the font class, so both MathJax
// packages are excluded from dependency optimisation. In `vite build` Rollup bundles them (dynamic files -> chunks).
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, 'pages');

export default defineConfig({
  root,
  base: './',
  publicDir: false,
  server: { port: 5200, strictPort: false, fs: { allow: [import.meta.dirname] } },
  preview: { port: 5201, strictPort: false },
  optimizeDeps: { exclude: ['@mathjax/src', '@mathjax/mathjax-newcm-font'] },
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        gallery: resolve(root, 'gallery.html'),
        interactive: resolve(root, 'interactive.html'),
        player: resolve(root, 'player.html'),
        lessonFractionsAsDivision: resolve(root, 'lessons/fractions-as-division.html'),
      },
    },
  },
  test: {
    root: import.meta.dirname,
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30000,
  },
});
