// walk-enlarge-on-grids.mjs: click through parts 1-4 of the enlarge-on-grids lesson like a kid would (one wrong and
// the right answer per part) and screenshot every state.   node tools/walk-enlarge-on-grids.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute). Vite's HMR client is blocked so
// edits by other agents in the worktree cannot reload the page mid-walk. Practice: tools/walk-practice.mjs.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/enlarge-on-grids.html?mute&fresh';
const out = process.argv[3] ?? 'out/walk-enlarge-on-grids';
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
// (the aborted /@vite/client request below is ours, not a page error)
page.on('console', m => { if (m.type() === 'error' && !(m.location()?.url ?? '').includes('/@vite/client')) errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.setRequestInterception(true);
page.on('request', r => (r.url().includes('/@vite/client') ? r.abort() : r.continue()));
await page.evaluateOnNewDocument(() => { const W = window.WebSocket; window.WebSocket = function (url, p) { if (String(p).includes('vite-hmr')) return { addEventListener() {}, removeEventListener() {}, send() {}, close() {}, readyState: 0 }; return new W(url, p); }; });
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
async function fill(vals) {
  await page.evaluate(vals => { [...document.querySelectorAll('.panel .ans input')].forEach((el, i) => { el.value = vals[i] ?? ''; }); }, vals.map(String));
}

await page.goto(base, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.lessonReady');
// 1 the question: pick 5 (adding 2), pretty sure
await sleep(3.5); await shot('question');
await click('5'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
// 2 worked example
await sleep(0.8); await shot('example-start');
await click('Factor'); await sleep(3.6); await shot('example-factor');
await click('Walk'); await sleep(7.5); await shot('example-walk');
await click('Multiply'); await sleep(10.5); await shot('example-multiply');
await click('Check'); await sleep(7.5); await shot('example-check');
await click('Adding 2'); await sleep(0.4); await shot('example-why-wrong');
await click('Every length'); await sleep(0.4); await shot('example-why-right'); await click('Your turn');
// 3 your turn: the slanted side (one step only, then right), back to the dot, the corners (arm length, then right)
await sleep(5.5); await shot('turn-ask-slant');
await fill([3, 3]); await click('Check'); await sleep(0.4); await shot('turn-slant-onestep');
await fill([3, 9]); await click('Check'); await sleep(3.5); await shot('turn-ask-back');
await fill([2, 3]); await click('Check'); await sleep(0.4); await shot('turn-back-wrong');
await fill([6, 9]); await click('Check'); await sleep(4.5); await shot('turn-ask-angle');
await click('Their angles are bigger'); await sleep(0.4); await shot('turn-angle-wrong');
await click('The angles are the same'); await sleep(3.2); await shot('turn-done');
await click('Prove it');
// 4 prove it: always (wrong), a wrong chip, then the three reasons
await sleep(2.5); await shot('prove-start');
await click('Always true'); await sleep(0.4); await shot('prove-chain');
await click('Adding the same amount'); await sleep(0.3); await shot('prove-wrong-chip');
await click('2 + 2 = 4'); await sleep(5.5); await shot('prove-1');
await click('1 → 2'); await sleep(7.0); await shot('prove-2');
await click('It works only'); await sleep(3.5); await shot('prove-3');
await click('Practice'); await sleep(2.0); await shot('practice-first');
const log = await page.evaluate(() => window.mathscenesLessons.log('enlarge-on-grids'));
fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
