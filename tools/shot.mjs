// shot.mjs: screenshots.
//   node tools/shot.mjs <file.html> <out.png> [width]                 a local HTML file, full page (as before)
//   node tools/shot.mjs page <page?query> <out.png> [--w 1400] [--wait <js expr>] [--canvas <css selector>] [--dist]
//        a page of this package, served by Vite (dev server, or the built dist with --dist); waits for the expression
//        (default: window.galleryReady || window.interactiveReady || window.sceneInfo), then a full-page shot or
//        just one canvas element.
//   node tools/shot.mjs batch <jobs.json> [--dist]      [{page, out, w?, wait?, canvas?}, ...] with one server/browser
import puppeteer from 'puppeteer';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { startPages } from './serve.mjs';

const argv = process.argv.slice(2);
const flag = (name, def) => { const i = argv.indexOf(`--${name}`); return i < 0 ? def : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true; };

async function shootPage(browser, url, out, { w = 1400, h = 900, wait, canvas } = {}) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
  try {
    await page.waitForFunction(wait ?? '(window.galleryReady || window.interactiveReady || window.sceneInfo)', { timeout: 120000 });
  } catch (e) {
    const msg = await page.evaluate(() => document.getElementById('msg')?.textContent ?? '').catch(() => '');
    console.error(`${out}: page never became ready. ${errors.join(' | ')} ${msg}`);
    await page.close();
    process.exitCode = 1;
    return;
  }
  await new Promise(r => setTimeout(r, 400));
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  if (canvas) { const el = await page.$(canvas); await el.screenshot({ path: out }); }
  else await page.screenshot({ path: out, fullPage: true });
  await page.close();
  console.log(`${out}${errors.length ? `   [page errors] ${errors.join(' | ')}` : ''}`);
}

if (argv[0] === 'page' || argv[0] === 'batch') {
  const jobs = argv[0] === 'page'
    ? [{ page: argv[1], out: argv[2], w: flag('w', 1400), wait: flag('wait'), canvas: flag('canvas') }]
    : JSON.parse(fs.readFileSync(argv[1], 'utf8'));
  const srv = await startPages({ dist: !!flag('dist', false) });
  const browser = await puppeteer.launch({ headless: true, args: ['--disable-renderer-backgrounding'] });
  try {
    for (const j of jobs) await shootPage(browser, srv.url(j.page), j.out, j);
  } finally { await browser.close(); await srv.close(); }
} else {
  const [file, out, width = '1400'] = argv;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: +width, height: 900, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.resolve(file)).href);
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
}
