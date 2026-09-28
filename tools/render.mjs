// render.mjs: scene -> MP4 (1080p). Puppeteer opens player.html (served by a Vite dev server it starts itself, or the
// built dist with --dist), steps t at the frame rate, grabs the canvas of each frame and pipes the frames straight
// into ffmpeg (H.264, plus the narration mix lined up with the scene's time when you ask for audio).
//
//   node tools/render.mjs <scene> [--from s] [--to s] [--out out/x.mp4] [--fps 30] [--theme ink|paper]
//                          [--audio [file.wav]] [--audio-offset s] [--workers 4] [--dist] [--crf 18]
//   e.g. node tools/render.mjs ratio --from 120 --to 150 --out out/ratio_line.mp4          (silent)
//        node tools/render.mjs ratio --audio                                                (with the scene's own mix)
//
// Without --audio the video is silent. --audio without a file uses the scene's own mix (SceneDef.audio, made by
// audio/mix.py); if that file does not exist yet the render warns and stays silent. An explicit --audio <file> must
// exist. Audio time = scene time + offset (default: the scene's offset), so the segment [from, to] of the mix plays
// under the frames.
import puppeteer from 'puppeteer';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { ROOT, ffmpegBin, startPages } from './serve.mjs';

const argv = process.argv.slice(2);
const flag = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return def;
  const v = argv[i + 1];
  return v !== undefined && !v.startsWith('--') ? v : true;
};
const scene = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'ratio';
const fps = Number(flag('fps', 30)), workers = Number(flag('workers', 4)), theme = flag('theme', 'ink');
const t00 = Date.now();

const srv = await startPages({ dist: !!flag('dist', false) });
const browser = await puppeteer.launch({
  headless: true, protocolTimeout: 0,
  args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'],
});
let ff;
try {
  const url = srv.url(`player.html?scene=${encodeURIComponent(scene)}&theme=${theme}&render=1`);
  const open = async () => {
    const page = await browser.newPage();
    page.on('pageerror', e => console.error('[page error]', e.message));
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error(`[page ${m.type()}]`, m.text()); });
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 180000 });
    return { page, info: await page.evaluate(() => window.ready) };
  };
  const first = await open();
  const info = first.info;
  const from = Number(flag('from', info.t0)), to = Number(flag('to', info.t1));
  const out = path.resolve(ROOT, flag('out', `out/${scene}.mp4`));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const n = Math.round((to - from) * fps);
  const pages = [first.page, ...(await Promise.all(Array.from({ length: Math.max(0, Math.min(workers, n) - 1) }, async () => (await open()).page)))];
  console.log(`${scene} [${info.theme}] ${from}s -> ${to}s: ${n} frames @ ${fps} fps, ${pages.length} pages (ready in ${((Date.now() - t00) / 1000).toFixed(1)} s)`);

  // ffmpeg: JPEG frames on stdin (+ audio segment)
  const a = flag('audio', false);
  let audio = a === true ? (info.audio ? path.resolve(ROOT, info.audio.file) : null) : a ? path.resolve(a) : null;
  if (a === true && (!audio || !fs.existsSync(audio))) {
    console.warn(`no audio: ${audio ? `${path.relative(ROOT, audio)} does not exist (make it with audio/mix.py)` : 'the scene has no audio'}; rendering silently`);
    audio = null;
  } else if (a && !fs.existsSync(audio)) throw new Error(`audio not found: ${audio}`);
  const offset = Number(flag('audio-offset', info.audio?.offset ?? 0));
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-'];
  if (audio) args.push('-ss', (from + offset).toFixed(3), '-t', (to - from).toFixed(3), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', String(flag('crf', 18)), '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', out);
  ff = spawn(ffmpegBin(), args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((res, rej) => { ff.on('close', c => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))); ff.on('error', rej); });

  // frames in parallel, written in order
  const done = new Map();
  let nextWrite = 0, nextTake = 0, written = 0;
  const write = async () => {
    while (done.has(nextWrite)) {
      const buf = done.get(nextWrite); done.delete(nextWrite); nextWrite++;
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      written++;
      if (written % 60 === 0 || written === n) {
        const el = (Date.now() - t00) / 1000;
        process.stdout.write(`\r  ${written}/${n} frames  ${el.toFixed(0)} s   `);
      }
    }
  };
  let writing = Promise.resolve();
  await Promise.all(pages.map(async page => {
    while (nextTake < n) {
      const i = nextTake++;
      const t = from + i / fps;
      const b64 = await page.evaluate(t => { window.renderFrame(t); return document.getElementById('cv').toDataURL('image/jpeg', 0.95); }, t);
      done.set(i, Buffer.from(b64.slice(b64.indexOf(',') + 1), 'base64'));
      writing = writing.then(write);
      // keep memory bounded: wait if we run far ahead of the writer
      while (i - nextWrite > 120) await new Promise(r => setTimeout(r, 5));
    }
  }));
  await writing;
  ff.stdin.end();
  await ffDone;
  console.log(`\nencoded -> ${out}  (${((Date.now() - t00) / 1000).toFixed(1)} s)${audio ? `  audio ${path.basename(audio)} from ${(from + offset).toFixed(3)} s` : '  (silent)'}`);
} catch (e) {
  ff?.stdin?.destroy();
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
  await srv.close();
}
