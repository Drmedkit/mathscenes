// Vite: multi-page app (pages/*.html, pages/lessons/*.html) + Vitest config.
// MathJax 4 is imported as plain ES modules straight from node_modules (no CDN, no pre-bundling): the font's dynamic
// files (src/core/mathjax.ts, DYNAMIC) must resolve to the SAME module instance as the font class, so both MathJax
// packages are excluded from dependency optimisation. In `vite build` Rollup bundles them (dynamic files -> chunks).
// Lesson pages are found by name (pages/lessons/*.html); their narration (pages/lessons/<slug>/voice/*.mp3) is not
// imported by code, so it is copied into dist after the bundle (with topics.json, which the path page fetches).
import { defineConfig, type Plugin } from 'vitest/config';
import { resolve } from 'node:path';
import { cpSync, existsSync, readdirSync } from 'node:fs';

const root = resolve(import.meta.dirname, 'pages');
const outDir = resolve(import.meta.dirname, 'dist');
const lessonsDir = resolve(root, 'lessons');
const lessons = existsSync(lessonsDir) ? readdirSync(lessonsDir).filter(f => f.endsWith('.html')) : [];

const copyVoice: Plugin = {
  name: 'lesson-voice',
  apply: 'build',
  closeBundle() {
    for (const d of readdirSync(lessonsDir, { withFileTypes: true })) {
      const v = resolve(lessonsDir, d.name, 'voice');
      if (d.isDirectory() && existsSync(v)) cpSync(v, resolve(outDir, 'lessons', d.name, 'voice'), { recursive: true });
    }
    // the course path page fetches topics.json at run time
    cpSync(resolve(lessonsDir, 'topics.json'), resolve(outDir, 'lessons', 'topics.json'));
  },
};

export default defineConfig({
  root,
  base: './',
  publicDir: false,
  plugins: [copyVoice],
  server: { port: 5200, strictPort: false, fs: { allow: [import.meta.dirname] } },
  preview: { port: 5201, strictPort: false },
  optimizeDeps: { exclude: ['@mathjax/src', '@mathjax/mathjax-newcm-font'] },
  build: {
    outDir,
    emptyOutDir: true,
    target: 'es2022',
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        gallery: resolve(root, 'gallery.html'),
        interactive: resolve(root, 'interactive.html'),
        player: resolve(root, 'player.html'),
        ...Object.fromEntries(lessons.map(f => [`lesson-${f.replace('.html', '')}`, resolve(lessonsDir, f)])),
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
