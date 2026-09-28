// serve.mjs: start this package's pages for headless tools. Default: a Vite dev server (no build needed);
// { dist: true }: `vite preview` of the built dist/ (run `npm run build` first).
//   const s = await startPages({ dist }); ... s.url('player.html?scene=ratio'); await s.close();
import { createServer, preview } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configFile = path.join(ROOT, 'vite.config.ts');

export async function startPages({ dist = false, port = 5230 } = {}) {
  let server, base;
  if (dist) {
    if (!fs.existsSync(path.join(ROOT, 'dist', 'player.html'))) throw new Error('no dist/ build: run `npm run build` first');
    server = await preview({ configFile, logLevel: 'error', preview: { port, strictPort: false, open: false } });
    base = server.resolvedUrls.local[0];
  } else {
    server = await createServer({ configFile, logLevel: 'error', server: { port, strictPort: false, open: false, hmr: false } });
    await server.listen();
    base = server.resolvedUrls.local[0];
  }
  return {
    base,
    url: (p) => new URL(p.replace(/^\//, ''), base).href,
    close: async () => { if (server.close) await server.close(); else await new Promise(r => server.httpServer.close(r)); },
  };
}

/** ffmpeg: $FFMPEG first, then PATH, then (Windows) a WinGet Gyan.FFmpeg install */
export function ffmpegBin() {
  if (process.env.FFMPEG && fs.existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  const exe = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  for (const d of (process.env.PATH ?? '').split(path.delimiter)) {
    const f = path.join(d, exe);
    if (d && fs.existsSync(f)) return f;
  }
  const base = path.join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(base)) {
    for (const d of fs.readdirSync(base).filter(d => d.startsWith('Gyan.FFmpeg'))) {
      for (const sub of fs.readdirSync(path.join(base, d)).filter(s => s.startsWith('ffmpeg-'))) {
        const f = path.join(base, d, sub, 'bin', exe);
        if (fs.existsSync(f)) return f;
      }
    }
  }
  throw new Error('ffmpeg not found: install it (https://ffmpeg.org) and put it on PATH, or set FFMPEG=/path/to/ffmpeg');
}
