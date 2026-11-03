// kid.mjs: a browser an agent can drive step by step, to play a lesson the way a kid does (no peeking at answers).
// One headless, MUTED Chrome per port (audio still plays and ends at its real length, nothing reaches the speakers).
// Every voice line is logged: which mp3, HTTP status, played, ended, length.
//
//   node tools/qa/kid.mjs serve <port> [--base https://math-path-3vc.pages.dev] [--out out/kid-<port>]
//   node tools/qa/kid.mjs <port> open lessons/<slug>        go to a page (no leading slash), then look
//   node tools/qa/kid.mjs <port> look                       screenshot + visible text + numbered controls + new audio/errors
//   node tools/qa/kid.mjs <port> click <n>                  click control n from the last look, then look
//   node tools/qa/kid.mjs <port> clickxy <x> <y>            click a point (screenshot pixels), then look
//   node tools/qa/kid.mjs <port> fill <n> <text>            type into input n (replaces its value), then look
//   node tools/qa/kid.mjs <port> key <Key>                  press a key (Enter, Tab, Backspace...), then look
//   node tools/qa/kid.mjs <port> drag <x1> <y1> <x2> <y2>   drag with the mouse, then look
//   node tools/qa/kid.mjs <port> wait <seconds>             wait (e.g. for the narrator), then look
//   node tools/qa/kid.mjs <port> audio                      the full voice log so far
//   node tools/qa/kid.mjs <port> quit
import puppeteer from 'puppeteer';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };

if (argv[0] === 'serve') await serve(Number(argv[1]));
else await send(Number(argv[0]), argv[1], argv.slice(2));

async function send(port, cmd, args) {
  if (!port || !cmd) { console.error('usage: see the header of tools/qa/kid.mjs'); process.exit(2); }
  const q = new URLSearchParams({ cmd, args: JSON.stringify(args) });
  const res = await fetch(`http://127.0.0.1:${port}/?${q}`).catch(e => ({ ok: false, text: async () => `no driver on port ${port}: ${e.message}` }));
  const body = await res.text();
  if (!res.ok) { console.log(body); process.exit(1); }
  const r = JSON.parse(body);
  if (r.look === undefined) { console.log(JSON.stringify(r, null, 1)); return; }
  // compact text for an agent: what a kid sees, what it can press, what it heard, what broke
  const lines = [`look ${r.look}  ${r.title}  ${r.url}`, `screenshot: ${r.shot}`, '--- text', r.text, '--- controls'];
  for (const c of r.controls) lines.push(`[${c.n}] ${c.kind} "${c.label}"${c.disabled ? ' (disabled)' : ''}${c.below ? ' (below the screen: scroll to see it)' : c.above ? ' (above the screen)' : ''} @${c.x},${c.y}`);
  lines.push('--- audio since last look');
  for (const a of r.audio) lines.push(`${a.at} ${a.event || `http ${a.http ?? a.failed}`} ${a.file}${a.seconds ? ` (${a.seconds}s)` : ''}${a.why ? ` ${a.why}` : ''}${a.at_second !== undefined ? ` at ${a.at_second}s` : ''}`);
  if (!r.audio.length) lines.push('(none)');
  lines.push('--- errors since last look', ...(r.errors.length ? r.errors : ['(none)']));
  console.log(lines.join('\n'));
}

async function serve(port) {
  const base = opt('base', 'https://math-path-3vc.pages.dev');
  const out = opt('out', path.join('out', `kid-${port}`));
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required',
    '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });   // a school laptop
  const audio = [], errors = [];
  let seenAudio = 0, seenErr = 0, n = 0, controls = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(`console: ${m.text()}`); });
  page.on('response', r => { if (/\.mp3(\?|$)/.test(r.url())) audio.push({ at: stamp(), file: short(r.url()), http: r.status() }); });
  page.on('requestfailed', r => { if (/\.mp3(\?|$)/.test(r.url())) audio.push({ at: stamp(), file: short(r.url()), failed: r.failure()?.errorText }); });
  await page.exposeFunction('__kidAudio', e => audio.push({ at: stamp(), ...e, file: short(e.file) }));
  await page.evaluateOnNewDocument(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const el = this, file = el.currentSrc || el.src;
      if (!el.__kid) {
        el.__kid = true;
        el.addEventListener('ended', () => window.__kidAudio({ event: 'ended', file: el.currentSrc || el.src, seconds: Math.round(el.duration * 10) / 10 }));
        el.addEventListener('error', () => window.__kidAudio({ event: 'error', file: el.currentSrc || el.src }));
        el.addEventListener('pause', () => { if (!el.ended) window.__kidAudio({ event: 'cut off', file: el.currentSrc || el.src, at_second: Math.round(el.currentTime * 10) / 10 }); });
      }
      const p = play.call(this);
      p.then(() => window.__kidAudio({ event: 'playing', file }), e => window.__kidAudio({ event: 'play refused', file, why: String(e) }));
      return p;
    };
  });
  const t0 = Date.now();
  function stamp() { return `${((Date.now() - t0) / 1000).toFixed(1)}s`; }
  function short(u) { try { return new URL(u).pathname.replace(/^\/lessons\//, ''); } catch { return u; } }
  const sleep = s => new Promise(r => setTimeout(r, s * 1000));

  async function look() {
    n++;
    const shot = path.resolve(out, `${String(n).padStart(3, '0')}.png`);
    await page.screenshot({ path: shot });
    const info = await page.evaluate(() => {
      const vis = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el);
        return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
      const sel = 'button, input, select, textarea, a[href], [role=button], [draggable=true], [tabindex]:not([tabindex="-1"])';
      const els = [...document.querySelectorAll(sel)].filter(vis);
      // pointer-cursor SVG/divs that are not covered by the list above (drag handles, clickable pictures)
      for (const el of document.querySelectorAll('svg *, div, span')) {
        if (els.length > 80) break;
        if (getComputedStyle(el).cursor === 'pointer' && vis(el) && !els.some(e => e.contains(el) || el.contains(e))) els.push(el);
      }
      window.__kidEls = els;
      const ctl = els.map((el, i) => { const r = el.getBoundingClientRect();
        const label = (el.getAttribute('aria-label') || el.innerText || el.value || el.getAttribute('placeholder') || el.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 60);
        return { n: i, kind: el.tagName.toLowerCase() + (el.type && el.tagName === 'INPUT' ? `:${el.type}` : ''), label,
          ...(el.disabled ? { disabled: true } : {}), ...(r.top >= innerHeight ? { below: true } : r.bottom <= 0 ? { above: true } : {}), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; });
      const text = (document.querySelector('main') || document.body).innerText.replace(/\n{2,}/g, '\n').trim();
      return { url: location.pathname + location.search, title: document.title, text: text.slice(0, 1800) + (text.length > 1800 ? ' …' : ''), controls: ctl };
    });
    controls = info.controls;
    const res = { look: n, shot, ...info, audio: audio.slice(seenAudio), errors: errors.slice(seenErr) };
    seenAudio = audio.length; seenErr = errors.length;
    return res;
  }

  async function run(cmd, args) {
    switch (cmd) {
      case 'open': {   // "lessons/<slug>" (no leading slash: Git Bash rewrites "/lessons/..." into a Windows path)
        const p = String(args[0]).replace(/\\/g, '/').replace(/^.*?\/Git\//i, '');
        await page.goto(/^https?:/.test(p) ? p : new URL(p.replace(/^\/?/, '/'), base).href, { waitUntil: 'networkidle2', timeout: 60000 });
        await sleep(1); return look();
      }
      case 'look': return look();
      case 'click': {
        const i = Number(args[0]);
        const ok = await page.evaluate(i => { const el = window.__kidEls?.[i]; if (!el) return false; el.scrollIntoView({ block: 'center' }); return true; }, i);
        if (!ok) return { error: `no control ${i}; run look first` };
        const p = await page.evaluate(i => { const r = window.__kidEls[i].getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, i);
        await page.mouse.click(p[0], p[1]); await sleep(0.9); return look();
      }
      case 'clickxy': await page.mouse.click(Number(args[0]), Number(args[1])); await sleep(0.9); return look();
      case 'fill': {
        const i = Number(args[0]);
        const ok = await page.evaluate(i => { const el = window.__kidEls?.[i]; if (!el) return false; el.focus(); if ('value' in el) el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); return true; }, i);
        if (!ok) return { error: `no control ${i}; run look first` };
        await page.keyboard.type(args.slice(1).join(' '), { delay: 60 }); await sleep(0.5); return look();
      }
      case 'key': await page.keyboard.press(args[0]); await sleep(0.9); return look();
      case 'drag': {
        const [x1, y1, x2, y2] = args.map(Number);
        await page.mouse.move(x1, y1); await page.mouse.down();
        for (let k = 1; k <= 12; k++) { await page.mouse.move(x1 + (x2 - x1) * k / 12, y1 + (y2 - y1) * k / 12); await sleep(0.03); }
        await page.mouse.up(); await sleep(0.9); return look();
      }
      case 'wait': await sleep(Math.min(30, Number(args[0]) || 2)); return look();
      case 'audio': return { audio };
      case 'eval': return { value: await page.evaluate(`(async () => (${args.join(' ')}))()`) };   // lead debugging only, not for kid testers
      case 'quit': setTimeout(async () => { await browser.close(); process.exit(0); }, 100); return { bye: true };
      default: return { error: `unknown command ${cmd}` };
    }
  }

  let busy = Promise.resolve();
  http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    busy = busy.then(async () => {
      try { const r = await run(u.searchParams.get('cmd'), JSON.parse(u.searchParams.get('args') || '[]')); res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(r, null, 1)); }
      catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: String(e?.message || e) })); }
    });
  }).listen(port, '127.0.0.1', () => console.log(`kid driver on ${port}, base ${base}, screenshots in ${out}`));
}
