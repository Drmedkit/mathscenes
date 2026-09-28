// sheet.mjs: contact sheets and stills of a scene (look-and-fix rounds). One server, one page: the player renders
// frame t (window.renderFrame), the page itself tiles the frames into a sheet with the time under each.
//
//   node tools/sheet.mjs <scene> --from 0 --to 60 --step 2 [--cols 5] [--w 384] [--out out/sheet.jpg] [--theme ink]
//   node tools/sheet.mjs <scene> --times 6.7,8.8,13.6 [--full out/stills]     full-size PNG stills at those times
//   (a sheet holds at most --per frames (default 40); more frames make sheet_1.jpg, sheet_2.jpg, …)
import puppeteer from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs';
import { ROOT, startPages } from './serve.mjs';

const argv = process.argv.slice(2);
const flag = (name, def) => { const i = argv.indexOf(`--${name}`); return i < 0 ? def : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true; };
const scene = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'ratio';
const cols = Number(flag('cols', 5)), tw = Number(flag('w', 384)), per = Number(flag('per', 40)), theme = flag('theme', 'ink');
let times = [];
if (flag('times')) times = String(flag('times')).split(',').map(Number);
else {
  const from = Number(flag('from', 0)), to = Number(flag('to', 10)), step = Number(flag('step', 2));
  for (let t = from; t <= to + 1e-9; t += step) times.push(Math.round(t * 1000) / 1000);
}
const full = flag('full', null);
const out = path.resolve(ROOT, flag('out', `out/sheet_${scene}.jpg`));

const srv = await startPages({ dist: !!flag('dist', false) });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 0, args: ['--disable-renderer-backgrounding'] });
try {
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('[page error]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(srv.url(`player.html?scene=${scene}&theme=${theme}&render=1`), { waitUntil: 'networkidle0', timeout: 180000 });
  await page.evaluate(() => window.ready);
  if (full) {
    const dir = path.resolve(ROOT, full);
    fs.mkdirSync(dir, { recursive: true });
    for (const t of times) {
      const b64 = await page.evaluate(t => { window.renderFrame(t); return document.getElementById('cv').toDataURL('image/png'); }, t);
      const f = path.join(dir, `${scene}_${t.toFixed(2).padStart(7, '0')}.png`);
      fs.writeFileSync(f, Buffer.from(b64.split(',')[1], 'base64'));
      console.log(f);
    }
  } else {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    for (let s = 0; s * per < times.length; s++) {
      const chunk = times.slice(s * per, (s + 1) * per);
      const b64 = await page.evaluate(({ chunk, cols, tw }) => {
        const cv = document.getElementById('cv');
        const th = Math.round(tw * 9 / 16), lab = 26, rows = Math.ceil(chunk.length / cols);
        const sh = document.createElement('canvas');
        sh.width = cols * tw + (cols + 1) * 6; sh.height = rows * (th + lab) + (rows + 1) * 6;
        const g = sh.getContext('2d');
        g.fillStyle = '#000'; g.fillRect(0, 0, sh.width, sh.height);
        chunk.forEach((t, i) => {
          window.renderFrame(t);
          const x = 6 + (i % cols) * (tw + 6), y = 6 + Math.floor(i / cols) * (th + lab + 6);
          g.drawImage(cv, x, y, tw, th);
          g.fillStyle = '#ddd'; g.font = '18px system-ui'; g.fillText(`t = ${t.toFixed(2)}`, x + 4, y + th + 19);
        });
        return sh.toDataURL('image/jpeg', 0.9);
      }, { chunk, cols, tw });
      const f = s === 0 && times.length <= per ? out : out.replace(/(\.\w+)$/, `_${s + 1}$1`);
      fs.writeFileSync(f, Buffer.from(b64.split(',')[1], 'base64'));
      console.log(f, `${chunk[0]} … ${chunk[chunk.length - 1]}`);
    }
  }
} finally {
  await browser.close();
  await srv.close();
}
