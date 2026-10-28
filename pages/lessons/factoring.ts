// factoring.ts: "Factoring" (Algebra 1, lesson 16; secondary-t6-05) on the shared lesson runtime.
//   1 The question   a patio of area x² + 7x + 12 sq ft: which product gives its sides? 3 cards ((x + 3)(x + 4);
//                    (x + 2)(x + 6) = a pair with the right product, sum unchecked; x = −3 or −4 = solving instead
//                    of factoring) + how sure. The product box is full but its sides are '?'
//   2 Worked example the box read backwards: corners (x² = x · x; 12 = the two numbers multiplied) → the pair search
//                    (product 12 AND sum 7) → read the sides → expand to check ((x + 2)(x + 6) gives 8x: struck).
//                    One "why?" with 3 reasons
//   3 Your turn      x² − 2x − 15, faded: the kid picks the pair (opposite signs), checks the middle by expanding.
//                    Callback to the card
//   4 Prove it       Sam: 2x² − 18 = (2x + 6)(x − 3) "multiplies back, so it is complete". Because-chain: the
//                    product is correct (middle cells cancel) → 2x + 6 still has the factor 2 → 2(x + 3)(x − 3)
//   5 Practice       all 24 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/factoring/script.ts -> pages/lessons/factoring/voice/lines.json.
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { bigLine, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { ProductBox, type BoxBlock, type BoxFocus, type BoxStep } from '../../src/lesson/topics/polynomials/ProductBox';
import { degRole } from '../../src/lesson/topics/polynomials/poly';
import { FAMILY_NAMES, GENERATORS, MC, type FacItem } from '../../src/lesson/topics/factoring/items';
import type { Side } from '../../src/lesson/topics/factoring/common';
import { PLAN } from '../../src/lesson/topics/factoring/plan';
import { explain } from '../../src/lesson/topics/factoring/explain';
import { SCRIPT } from '../../src/lesson/topics/factoring/script';
import LINES from './factoring/voice/lines.json';

const SLUG = 'factoring';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, SCRIPT[id]?.html ?? id);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]?.html ?? id); }

// ===================== layout: the box on the left, a wider board on the right =====================
const MF = frame(60, 90, 970, 900);
const PB = box(1070, 70, 1860, 1010), PX = PB.x0 + 44, PW = PB.w - 88;
function chunks(src: string): string[] {
  const out: string[] = []; let d = 0, last = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (ch === '{' || ch === '(') d++; else if (ch === '}' || ch === ')') d--;
    else if (d === 0 && i > last && (src.startsWith(' + ', i) || src.startsWith(' - ', i) || src.startsWith(' = ', i))) { out.push(src.slice(last, i)); last = i + 1; }
  }
  out.push(src.slice(last));
  return out;
}
interface Spec { key: string; src: string; size?: number; tags?: Record<string, { col: Paint }>; col?: Paint; gap?: number }
/** board lines from the top down; a line that does not fit at 64 px wraps at a top-level + − or = */
function stack(specs: Spec[], y0 = 160): { lines: Line[]; at: Record<string, Line[]> } {
  const lines: Line[] = [], at: Record<string, Line[]> = {};
  let y = y0;
  for (const sp of specs) {
    const size = sp.size ?? 80;
    const one = tex(sp.src) as Formula;
    let s = size;
    while (s > 64 && texWidth(one, s) > PW) s -= 2;
    let rows: string[];
    if (texWidth(one, s) <= PW) rows = [sp.src];
    else {
      s = Math.min(size, 72); rows = []; let cur = '';
      for (const c of chunks(sp.src)) {
        const tryS = cur ? `${cur} ${c}` : c;
        const pre = rows.length ? '\\quad ' : '';
        if (cur && texWidth(tex(pre + tryS) as Formula, s) > PW) { rows.push(pre + cur); cur = c; } else cur = tryS;
      }
      rows.push((rows.length ? '\\quad ' : '') + cur);
      while (s > 60 && rows.some(r => texWidth(tex(r) as Formula, s) > PW)) s -= 2;
    }
    at[sp.key] = rows.map((r, i) => { const L: Line = { key: sp.key, F: tex(r) as Formula, x: PX, y: y + i * s * 1.3, size: s, tags: sp.tags, col: sp.col }; lines.push(L); return L; });
    y += rows.length * s * 1.3 + (sp.gap ?? s * 0.12);
  }
  return { lines, at };
}
const W = (s: string) => ({ col: s as Paint });
const lineBox = (L: Line): Box => texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });
function strikeLine(c: Canvas, L: Line | undefined, k: number): void {
  if (!L || k <= 0) return;
  const b = lineBox(L);
  strike(c, b.x0 - 10, b.cy + 6, b.x1 + 10, b.cy - 6, k, { col: 'wrong' });
}
const boxP = (pre: string) => progressOf<BoxStep>(s => (s === 'sides' ? 0 : tr.k(pre + 'b.' + s)));

// ===================== the box read backwards: sides drawn here, '?' until they are found =====================
const QF = tex('?') as Formula;
interface SideLabels { left: Side[]; top: Side[] }
/** side labels at the ProductBox's own places; each side i has its own reveal key (pre + 'sL' + i / 'sT' + j);
 *  `shown` = always-visible sides (e.g. the x's after step 1). */
function drawSides(c: Canvas, B: BoxBlock, S: SideLabels, pre: string, kQ: number): void {
  const all = B.where.all;
  const one = (src: string, deg: number, x: number, y: number, align: 'right' | 'center', key: string) => {
    const k = tr.k(key);
    if (kQ > 0 && k < 1) texDraw(c, QF, x, y, { size: 72, align, alpha: kQ * (1 - k), col: 'pick' });
    if (k > 0) texDraw(c, tex(src) as Formula, x, y, { size: 72, align, k, col: degRole(deg) });
  };
  S.left.forEach((s, i) => one(s.tex, s.deg, all.x0 - 28, B.where.cell(i, 0).cy, 'right', pre + 'sL' + i));
  S.top.forEach((s, j) => one(s.tex, s.deg, B.where.cell(0, j).cx, all.y0 - 60, 'center', pre + 'sT' + j));
}
const PATIO = (): BoxBlock => ProductBox({
  left: [{ tex: 'x', deg: 1 }, { tex: '3', deg: 0 }], top: [{ tex: 'x', deg: 1 }, { tex: '4', deg: 0 }],
  cells: [['x^{2}', '4x'], ['3x', '12']], deg: [[2, 1], [1, 0]], noteL: 'feet', noteT: 'feet',
}, MF, th);
const PATIO_SIDES: SideLabels = { left: [{ tex: 'x', deg: 1 }, { tex: '3', deg: 0 }], top: [{ tex: 'x', deg: 1 }, { tex: '4', deg: 0 }] };

// ===================== 1. The question =====================
const CARDS = [
  { v: '(<i>x</i> + 2)(<i>x</i> + 6)', id: MC.sumUnchecked, why: 't.cb-sum', ok: false },
  { v: '(<i>x</i> + 3)(<i>x</i> + 4)', id: '', why: 't.cb-right', ok: true },
  { v: '<i>x</i> = −3 or <i>x</i> = −4', id: MC.vsSolving, why: 't.cb-solve', ok: false },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = PATIO();
  const L = [{ ...stack([{ key: 'q.L0', src: 'x^{2} + 7x + 12 = (\\;?\\;)(\\;?\\;)', size: 92 }], 320).lines[0]! }];
  const focus = (): BoxFocus => ({ ask: [{ r: 0, c: 1, reveal: 0 }, { r: 1, c: 0, reveal: 0 }] });
  setScene({ model: c => { B.draw(c, boxP('q.'), focus()); drawSides(c, B, PATIO_SIDES, 'q.', tr.k('q.q')); }, lines: L, leads: [], boardBox: PB });
  tr.set('q.b.frame', 1, 1.0); tr.set('q.b.cells', 1, 1.6, 0.6); tr.set('q.q', 1, 0.8, 1.6); tr.set('q.L0', 1, 1.0, 1.8);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A patio has area x^2 + 7x + 12 sq ft. Which product gives its sides?', board: 'x^2 + 7x + 12', response: c.v.replace(/<[^>]+>/g, ''), expected: '(x + 3)(x + 4)', correct: c.ok, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.v}</span><small>${i === 2 ? 'the answer' : 'the sides, in feet'}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A patio, backwards'), voiced('q.intro'), voiced('q.ask'), cards, voiced('q.sure', 'div', 'label'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: x² + 7x + 12 =====================
function partExample(): void {
  tr.reset('e.');
  const B = PATIO();
  const lime = W('link'), amber = W('first'), blue = W('water'), teal = W('second');
  const st = stack([
    { key: 'e.l0', src: '\\cssId{a}{x^{2}} + \\cssId{b}{7x} + \\cssId{c}{12}', size: 88, tags: { a: blue, b: amber, c: teal }, gap: 16 },
    { key: 'e.p1', src: '1 \\cdot 12:\\ \\ 1 + 12 = 13', size: 62 },
    { key: 'e.p2', src: '2 \\cdot 6:\\ \\ 2 + 6 = 8', size: 62 },
    { key: 'e.p3', src: '3 \\cdot 4:\\ \\ 3 + 4 = \\cssId{ok}{7\\ \\checkmark}', size: 62, tags: { ok: lime }, gap: 16 },
    { key: 'e.l1', src: '= (x + 3)(x + 4)', size: 84, col: 'link', gap: 20 },
    { key: 'e.k1', src: '= x^{2} + 4x + 3x + 12', size: 64 },
    { key: 'e.k2', src: '= x^{2} + 7x + 12\\ \\cssId{ok}{\\checkmark}', size: 64, tags: { ok: lime }, gap: 16 },
    { key: 'e.k3', src: '(x + 2)(x + 6):\\  \\text{middle } 8x', size: 64, col: 'wrong' },
  ]);
  const focus = (): BoxFocus => ({
    ask: [{ r: 0, c: 1, reveal: tr.k('e.mid') }, { r: 1, c: 0, reveal: tr.k('e.mid') }],
    groups: [{ cells: [[0, 1], [1, 0]], col: 'link', k: tr.k('e.g') }, { cells: [[0, 0], [1, 1]], col: 'pick', k: tr.k('e.corner') }],
  });
  setScene({ model: c => { B.draw(c, boxP('e.'), focus()); drawSides(c, B, PATIO_SIDES, 'e.', 1); }, lines: st.lines, leads: [], boardBox: PB, extra: c => strikeLine(c, st.at['e.k3']![0], tr.k('e.k3s')) });
  tr.jump('e.b.frame', 1); tr.jump('e.b.cells', 1); tr.jump('e.l0', 1);
  let step = 0;
  const STEPS = [
    { t: 'The corners', why: 'x² and 12 sit in the corners.', act: 'Corners' },
    { t: 'Search the pairs', why: 'Product 12 AND sum 7.', act: 'Search' },
    { t: 'Read the sides', why: 'The middle cells give them away.', act: 'Read' },
    { t: 'Expand to check', why: 'Multiply back, every cell.', act: 'Check' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.corner', 1, 0.7); await wait(0.9); if (!alive()) return;
        tr.set('e.sL0', 1, 0.9); tr.set('e.sT0', 1, 0.9, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('e.corner', 0, 0.6);
      } else if (i === 1) {
        tr.set('e.g', 1, 0.6); await wait(0.6); if (!alive()) return;
        tr.set('e.p1', 1, 0.9); await wait(1.1); if (!alive()) return;
        tr.set('e.p2', 1, 0.9); await wait(1.1); if (!alive()) return;
        tr.set('e.p3', 1, 0.9); await wait(1.2);
      } else if (i === 2) {
        tr.set('e.p1:dim', 1, 0.4); tr.set('e.p2:dim', 1, 0.4); tr.set('e.mid', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('e.g', 0, 0.5); tr.set('e.sL1', 1, 0.8); tr.set('e.sT1', 1, 0.8, 0.3); await wait(1.3); if (!alive()) return;
        tr.set('e.l1', 1, 1.1); await wait(1.2);
      } else {
        tr.set('e.p3:dim', 1, 0.4);
        tr.set('e.k1', 1, 1.1); await wait(1.3); if (!alive()) return;
        tr.set('e.k2', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('e.k3', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.k3s', 1, 0.7); await wait(0.8);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.s${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The two middle cells are 3x and 4x, and together they must make the 7x.', ok: true, id: 'e.w-ok', mc: undefined as string | undefined },
      { t: 'Any pair that multiplies to 12 works; the 7 is just there.', ok: false, id: 'e.w-any', mc: MC.sumUnchecked as string | undefined },
      { t: 'The pair has to multiply to 7 and add to 12.', ok: false, id: 'e.w-swap', mc: MC.rolesSwapped as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why must the pair for x^2 + 7x + 12 add to 7?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: x² − 2x − 15 =====================
function partTurn(): void {
  tr.reset('t.');
  const B = ProductBox({
    left: [{ tex: 'x', deg: 1 }, { tex: '3', deg: 0 }], top: [{ tex: 'x', deg: 1 }, { tex: '-5', deg: 0 }],
    cells: [['x^{2}', '-5x'], ['3x', '-15']], deg: [[2, 1], [1, 0]],
  }, MF, th);
  const S: SideLabels = { left: [{ tex: 'x', deg: 1 }, { tex: '3', deg: 0 }], top: [{ tex: 'x', deg: 1 }, { tex: '-5', deg: 0 }] };
  const amber = W('first');
  const st = stack([
    { key: 't.l0', src: 'x^{2} - 2x - 15', size: 92, gap: 30 },
    { key: 't.l1', src: '\\text{product } {-15},\\ \\text{sum } {-2}', size: 68, col: 'dim', gap: 30 },
    { key: 't.l2', src: '(x + 3)(x - 5) = x^{2} \\cssId{a}{- 5x + 3x} - 15', size: 68, tags: { a: amber } },
    { key: 't.l3', src: '= x^{2} \\cssId{a}{- 2x} - 15\\ \\checkmark', size: 72, tags: { a: amber }, gap: 30 },
    { key: 't.l4', src: 'x^{2} - 2x - 15 = (x + 3)(x - 5)', size: 76, col: 'link' },
  ]);
  const focus = (): BoxFocus => ({
    ask: [{ r: 0, c: 1, reveal: tr.k('t.mid') }, { r: 1, c: 0, reveal: tr.k('t.mid') }],
    groups: [{ cells: [[0, 1], [1, 0]], col: 'link', k: tr.k('t.g') }],
  });
  setScene({ model: c => { B.draw(c, boxP('t.'), focus()); drawSides(c, B, S, 't.', 1); }, lines: st.lines, leads: [], boardBox: PB });
  tr.set('t.b.frame', 1, 1.0); tr.set('t.b.cells', 1, 1.4, 0.4); tr.set('t.sL0', 1, 0.8, 1.2); tr.set('t.sT0', 1, 0.8, 1.4); tr.set('t.l0', 1, 1.0, 1.0);
  let step = 0;
  const STEPS = [
    { t: 'Corners and the x sides', why: 'Done for you.' },
    { t: 'Find the pair', why: 'Your step.' },
    { t: 'Check the middle', why: 'Your step.' },
    { t: 'Write the product', why: 'The sides.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: opposite signs'), voiced('t.intro'), plan, work);
  seq(async alive => { await wait(2.4); if (!alive()) return; step = 1; drawPlan(); askPair(); });
  function askPair(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: '−3 and 5', ok: false, id: 't.p-rev', mc: MC.largerReversed as string | undefined },
      { t: '3 and −5', ok: true, id: 't.p-ok', mc: undefined as string | undefined },
      { t: '−3 and −5', ok: false, id: 't.p-same', mc: undefined as string | undefined },
    ];
    let done = false;
    tr.set('t.l1', 1, 0.9); tr.set('t.g', 1, 0.6);
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.pair', prompt: 'two numbers with product -15 and sum -2', board: 'x^2 - 2x - 15', response: o.t, expected: '3 and -5', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.g', 0, 0.4); tr.set('t.mid', 1, 1.1); await wait(1.2); if (!alive()) return;
        tr.set('t.sL1', 1, 0.8); tr.set('t.sT1', 1, 0.8, 0.3); await wait(1.5); if (!alive()) return;
        step = 2; drawPlan(); askMid();
      });
    })));
    work.replaceChildren(voiced('t.pair'), bx, fbHost);
  }
  function askMid(): void {
    const fbHost = h('div'), inp = numInput('x', () => check()), ok = btn('Check', () => check(), 'go');
    tr.set('t.g', 1, 0.6);
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.num', false)); return; }
      const v = r.v, good = v === -2;
      const id = good ? 't.m-ok' : v === 2 ? 't.m-sign' : v === -15 ? 't.m-prod' : 't.m-no';
      ctx.store.log({ part: 'turn', item: 'turn.mid', prompt: 'coefficient of x in (x + 3)(x - 5)', response: v, expected: -2, correct: good, mc: v === 2 ? MC.largerReversed : v === -15 ? MC.firstLast : undefined });
      fbHost.replaceChildren(voicedFb(id, good));
      if (!good) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.l1:dim', 1, 0.4); tr.set('t.l2', 1, 1.1); await wait(1.2); if (!alive()) return;
        tr.set('t.l3', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('t.g', 0, 0.4); step = 3; drawPlan(); tr.set('t.l4', 1, 1.1); await wait(1.4); if (!alive()) return;
        step = 4; drawPlan(); fbHost.append(callback());
      });
    }
    work.replaceChildren(voiced('t.mid'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const p = voiced(cd ? cd.why : 't.cb-none');
    if (cd) p.insertAdjacentHTML('beforeend', ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>`);
    c.append(p, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Sam's "it multiplies back, so it is complete" =====================
function partProve(): void {
  tr.reset('p.');
  const B = ProductBox({
    left: [{ tex: '2x', deg: 1 }, { tex: '6', deg: 0 }], top: [{ tex: 'x', deg: 1 }, { tex: '-3', deg: 0 }],
    cells: [['2x^{2}', '-6x'], ['6x', '-18']], deg: [[2, 1], [1, 0]],
  }, MF, th);
  const S: SideLabels = { left: [{ tex: '2x', deg: 1 }, { tex: '6', deg: 0 }], top: [{ tex: 'x', deg: 1 }, { tex: '-3', deg: 0 }] };
  const st = stack([
    { key: 'p.l0', src: '2x^{2} - 18 = (2x + 6)(x - 3)', size: 72, gap: 24 },
    { key: 'p.sam', src: '\\text{Sam: complete}', size: 64, col: 'dim', gap: 36 },
    { key: 'p.k1', src: '= 2x^{2} - 6x + 6x - 18 = 2x^{2} - 18\\ \\checkmark', size: 64, gap: 30 },
    { key: 'p.k2', src: '2x + 6 = 2(x + 3)', size: 72, gap: 30 },
    { key: 'p.k3', src: '2x^{2} - 18 = 2(x^{2} - 9)', size: 72 },
    { key: 'p.k4', src: '= 2(x + 3)(x - 3)', size: 84, col: 'link' },
  ]);
  const focus = (): BoxFocus => ({
    strike: [{ r: 0, c: 1, k: tr.k('p.cancel') }, { r: 1, c: 0, k: tr.k('p.cancel') }],
    row: { i: 0, k: 0 },
    groups: [{ cells: [[0, 0], [0, 1]], col: 'pick', k: tr.k('p.even') }, { cells: [[1, 0], [1, 1]], col: 'pick', k: tr.k('p.even') }],
  });
  setScene({ model: c => { B.draw(c, boxP('p.'), focus()); drawSides(c, B, S, 'p.', 0); drawEven(c); }, lines: st.lines, leads: [], boardBox: PB, extra: c => strikeLine(c, st.at['p.sam']![0], tr.k('p.sams')) });
  function drawEven(c: Canvas): void {
    const k = tr.k('p.even');
    if (k <= 0) return;
    // the left side 2x + 6: both of its terms carry a factor 2 (a lavender pulse on the two left labels)
    const b0 = B.where.left(0), b1 = B.where.left(1);
    c.g.save(); c.g.globalAlpha *= k; c.g.strokeStyle = th.roles.pick.fill; c.g.lineWidth = 5;
    for (const b of [b0, b1]) { c.g.beginPath(); c.g.roundRect(b.x0 - 14, b.y0 - 10, b.w + 28, b.h + 20, 14); c.g.stroke(); }
    c.g.restore();
  }
  tr.set('p.b.frame', 1, 1.0); tr.set('p.b.cells', 1, 1.6, 0.4); tr.set('p.sL0', 1, 0.8, 1.2); tr.set('p.sL1', 1, 0.8, 1.3); tr.set('p.sT0', 1, 0.8, 1.4); tr.set('p.sT1', 1, 0.8, 1.5);
  tr.set('p.l0', 1, 1.0, 1.0); tr.set('p.sam', 1, 0.9, 1.8);
  const CHIPS = [
    { t: 'Expanding gives 2x² − 6x + 6x − 18: the middle cells cancel.', fits: 0 },
    { t: 'Both terms of 2x + 6 are multiples of 2.', fits: 1 },
    { t: 'x² − 9 is a difference of squares: (x + 3)(x − 3).', fits: 2 },
    { t: 'It multiplies back, so nothing is left to factor.', fits: -1, mc: MC.productComplete, id: 'p.no.prod' },
    { t: 'At x = 0 both sides are −18.', fits: -1, mc: MC.examples, id: 'p.no.ex' },
    { t: 'x² − 9 = (x − 3)².', fits: -1, mc: MC.dosSquared, id: 'p.no.sq' },
  ];
  const CLAIMS = [
    'Sam’s product is correct: (2<i>x</i> + 6)(<i>x</i> − 3) = 2<i>x</i><sup>2</sup> − 18,',
    'but it is not complete: 2<i>x</i> + 6 = 2(<i>x</i> + 3) still factors,',
    'So completely factored, <b class="s">2<i>x</i><sup>2</sup> − 18 = 2(<i>x</i> + 3)(<i>x</i> − 3)</b>,',
  ];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((t, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${t}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t.replace(/x²/g, '<i>x</i><sup>2</sup>'), () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) { tr.set('p.k1', 1, 1.2); await wait(1.0); if (!alive()) return; tr.set('p.cancel', 1, 0.8); }
      if (n === 2) { tr.set('p.even', 1, 0.7); await wait(0.8); if (!alive()) return; tr.set('p.k2', 1, 1.0); await wait(1.2); if (!alive()) return; tr.set('p.sams', 1, 0.7); }
      if (n === 3) {
        tr.set('p.even', 0, 0.5); tr.set('p.k1:dim', 1, 0.4);
        tr.set('p.k3', 1, 1.1); await wait(1.3); if (!alive()) return;
        tr.set('p.k4', 1, 1.1); await wait(1.4); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: '2x^2 - 18 = (2x + 6)(x - 3) multiplies back, so it is factored completely: right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.productComplete : undefined });
    proofHost.replaceChildren(right ? voiced('p.test') : voiced('p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), voiced('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as FacItem),
  });
}
/** the practice box: the given cells, the held-back cells and sides as '?'; at the solve the cells and sides fill,
 *  cancelling cells are struck, and the factored form writes on the board */
function boxScene(it: FacItem): { solve?: (alive: () => boolean) => Promise<void> } | null {
  const p = it.picture!.box!, rv = it.picture!.reveal ?? {};
  if (!rv.left || !rv.top || !rv.cells) return null;
  const made = tryBlock(() => ProductBox({ left: rv.left!, top: rv.top!, cells: rv.cells!, deg: p.deg, noteL: p.noteL, noteT: p.noteT }, MF, th));
  if (!made.ok) { console.info('box fallback', it.family, made.error); return null; }
  const B: BoxBlock = made.value;
  const S: SideLabels = { left: rv.left, top: rv.top };
  const hidden: [number, number][] = [];
  p.cells.forEach((r, i) => r.forEach((t, j) => { if (!t) hidden.push([i, j]); }));
  const st = stack([
    { key: 'x.L0', src: it.board, size: 84, gap: 40 },
    ...(rv.tex ? [{ key: 'x.L1', src: `= ${rv.tex}`, size: 80, col: 'link' as Paint }] : []),
  ]);
  const focus = (): BoxFocus => ({
    ask: hidden.map(([r, c]) => ({ r, c, reveal: tr.k('x.mid') })),
    strike: (rv.strike ?? []).map(([r, c]) => ({ r, c, k: tr.k('x.z') })),
  });
  setScene({ model: c => { B.draw(c, boxP('x.'), focus()); drawSides(c, B, S, 'x.', tr.k('x.q')); }, lines: st.lines, leads: [], boardBox: PB });
  tr.set('x.b.frame', 1, 0.7); tr.set('x.b.cells', 1, 1.2, 0.3); tr.set('x.q', 1, 0.6, 0.9); tr.set('x.L0', 1, 0.9, 0.5);
  // a divisor that the question gives is shown from the start
  if (it.family.startsWith('div')) S.left.forEach((_, i) => tr.jump('x.sL' + i, 1));
  return {
    solve: async alive => {
      if (hidden.length) { tr.set('x.mid', 1, 1.0); await wait(1.1); if (!alive()) return; }
      S.left.forEach((_, i) => tr.set('x.sL' + i, 1, 0.8, i * 0.2));
      S.top.forEach((_, j) => tr.set('x.sT' + j, 1, 0.8, 0.3 + j * 0.2));
      await wait(1.3); if (!alive()) return;
      if (rv.strike) { tr.set('x.z', 1, 0.6); await wait(0.8); if (!alive()) return; }
      tr.set('x.L0:dim', 1, 0.4); tr.set('x.L1', 1, 1.0);
    },
  };
}
function showItem(item: FacItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  if (item.picture?.box) { const r = boxScene(item); if (r) return r; }
  const big = box(240, 220, 1680, 800);
  setScene({ lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['x^{2} + 7x + 12 = (x + 3)(x + 4) \\checkmark \\neq \\overset{?}{=} \\tfrac{1}{2} \\square \\cdot \\text{product sum}', '\\frac{x^{2}}{x} \\;?\\;'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
