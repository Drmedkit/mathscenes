// Vite: multi-page app (pages/*.html, pages/lessons/*.html) + Vitest config.
// MathJax 4 is imported as plain ES modules straight from node_modules (no CDN, no pre-bundling): the font's dynamic
// files (src/core/mathjax.ts, DYNAMIC) must resolve to the SAME module instance as the font class, so both MathJax
// packages are excluded from dependency optimisation. In `vite build` Rollup bundles them (dynamic files -> chunks).
// Lesson pages are found by name (pages/lessons/*.html); their narration (pages/lessons/<slug>/voice/*.mp3) is not
// imported by code, so it is copied into dist after the bundle (with topics.json and topics-hs.json, which the path page fetches).
import { defineConfig, type Plugin } from 'vitest/config';
import { resolve } from 'node:path';
import { cpSync, existsSync, readdirSync, readFileSync } from 'node:fs';

const root = resolve(import.meta.dirname, 'pages');
const outDir = resolve(import.meta.dirname, 'dist');
const lessonsDir = resolve(root, 'lessons');
// only finished lessons go into the build (live in topics.json / topics-hs.json), plus the path and check-in pages;
// lessons still being built in this worktree stay out
const liveSlugs = new Set(['index', 'placement', ...['topics.json', 'topics-hs.json']
  .flatMap(f => (existsSync(resolve(lessonsDir, f)) ? JSON.parse(readFileSync(resolve(lessonsDir, f), 'utf8')) as { slug: string; live?: boolean }[] : []))
  .filter(t => t.live).map(t => t.slug)]);
const lessons = existsSync(lessonsDir) ? readdirSync(lessonsDir).filter(f => f.endsWith('.html') && liveSlugs.has(f.replace('.html', ''))) : [];

const copyVoice: Plugin = {
  name: 'lesson-voice',
  apply: 'build',
  closeBundle() {
    for (const d of readdirSync(lessonsDir, { withFileTypes: true })) {
      const v = resolve(lessonsDir, d.name, 'voice');
      if (d.isDirectory() && existsSync(v)) cpSync(v, resolve(outDir, 'lessons', d.name, 'voice'), { recursive: true });
    }
    // the course path page fetches topics.json and topics-hs.json at run time
    for (const f of ['topics.json', 'topics-hs.json']) cpSync(resolve(lessonsDir, f), resolve(outDir, 'lessons', f));
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
