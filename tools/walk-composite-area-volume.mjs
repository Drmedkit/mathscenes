// walk-composite-area-volume.mjs: click through parts 1-4 of the composite area / volume lesson like a kid would (the
// right answer AND one wrong answer per part) and screenshot every state. Practice: tools/walk-practice.mjs.
//   node tools/walk-composite-area-volume.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute); the Vite client is blocked so
// edits by other topics in this worktree cannot reload the page mid-walk.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/composite-area-volume.html?mute&fresh';
const out = process.argv[3] ?? 'out/walk-composite-area-volume';
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
await page.setRequestInterception(true);
page.on('request', r => (new URL(r.url()).pathname.endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: 'export {}' }) : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/vite|ERR_FAILED|favicon/.test(m.text())) errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
let n = 0;
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
async function shot(name) { n++; const f = path.join(out, `${String(n).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); console.log(f); }
async function click(text, sel = 'button') {
  const ok = await page.evaluate((text, sel) => {
    const b = [...document.querySelectorAll(sel)].find(x => x.textContent.replace(/\s+/g, ' ').trim().startsWith(text) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`no button "${text}"`);
}
async function typeNum(v) { await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = String(v); }, v); await click('Check'); }

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  // 1. the question
  await sleep(3.4); await shot('question');
  await click('54 ft²'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // 2. worked example
  await sleep(0.8); await shot('example-start');
  await click('Split'); await sleep(3.6); await shot('example-split');
  await click('Volume'); await sleep(2.0); await shot('example-volume');
  await click('Surface'); await sleep(2.6); await shot('example-surface');
  await click('Glue'); await sleep(5.6); await shot('example-glue');
  await click('Only the top block'); await sleep(0.4); await shot('example-why-wrong');
  await click('Each block had'); await sleep(0.3); await click('Your turn');
  // 3. your turn
  await sleep(22.5); await shot('turn-ask-contact');
  await typeNum(100); await sleep(0.4); await shot('turn-contact-wrong');
  await typeNum(36); await sleep(4.2); await shot('turn-ask-total');
  await typeNum(492); await sleep(0.4); await shot('turn-total-wrong');
  await typeNum(456); await sleep(7.0); await shot('turn-done');
  await click('Prove it');
  // 4. prove it
  await sleep(3.0); await click('Riley is wrong'); await sleep(0.4); await shot('prove-start');
  await click('Nothing is lost'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('They fill the block'); await sleep(3.0); await shot('prove-1');
  await click('The cut surface was'); await sleep(2.2); await shot('prove-2');
  await click('The cut made two'); await sleep(3.2); await shot('prove-3');
  const log = await page.evaluate(() => window.mathscenesLessons.log('composite-area-volume'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
