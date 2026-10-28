// complex-numbers.ts: "Complex numbers" (Algebra 2, lesson 1; secondary-t7-01) on the shared lesson runtime.
//   1 The question   i is a new number with i² = −1: (2 + 3i)(4 + i) = ? on the empty product box. 3 cards
//                    (5 + 14i; 11 + 14i = i² as +1; 5 = firsts and lasts only) + how sure
//   2 Worked example meet i on the complex plane (×i is a quarter turn: 1 → i → −1, so i² = −1), then the product
//                    box: every term times every term, the i² cell turns real (3i² = −3), collect real with real and
//                    i with i: 5 + 14i. The board writes beside it; one "why?" with 3 reasons
//   3 Your turn      (3 − 2i)(1 + 4i), faded from the end: the box is filled; the kid turns −8i² into 8 and collects
//                    11 + 10i. Callback to the card
//   4 Prove it       Sam: √(−4) · √(−9) = √36 = 6. Judge, then a because-chain on the plane (2i and 3i, 6 · i · i,
//                    6 turns two quarter turns to −6); distractor chips = product rule, root of a negative as negative,
//                    i · i = i
//   5 Practice       all 21 sub-goals one after another, then mixed (runtime/practice.ts); pictures: the complex
//                    plane, the product box, the number sets, a column of worked lines, the graph of y = x² + k
// Voiced lines: src/lesson/topics/complex-numbers/script.ts -> pages/lessons/complex-numbers/voice/lines.json.
import { type Canvas, arrow, strike, withAlpha } from '../../src/core/draw';
import { type Box, type Pt, box, clamp } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { E } from '../../src/core/easing';
import { rectPts } from '../../src/core/pts';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock, type Frame } from '../../src/blocks/block';
import { bigLine, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, pairInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { slate } from '../../src/lesson/annotate';
import { drawWords } from '../../src/lesson/words';
import { wash } from '../../src/lesson/wash';
import { Plane, type PItem, type PlaneBlock, fmtN } from '../../src/lesson/kit/Plane';
import { ProductBox, type BoxBlock, type BoxFocus, type BoxStep } from '../../src/lesson/topics/polynomials/ProductBox';
import { degRole } from '../../src/lesson/topics/polynomials/poly';
import { ComplexSets } from '../../src/lesson/topics/complex-numbers/ComplexSets';
import { monoT } from '../../src/lesson/topics/complex-numbers/cx';
import { FAMILY_NAMES, GENERATORS, MC, type CxItem } from '../../src/lesson/topics/complex-numbers/items';
import type { BoxPic, PlanePic, PP } from '../../src/lesson/topics/complex-numbers/common';
import { PLAN } from '../../src/lesson/topics/complex-numbers/plan';
import { explain } from '../../src/lesson/topics/complex-numbers/explain';
import { SCRIPT } from '../../src/lesson/topics/complex-numbers/script';
import LINES from './complex-numbers/voice/lines.json';

const SLUG = 'complex-numbers';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line from the script (html shown, lines.json spoken) */
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, SCRIPT[id]?.html ?? id);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]?.html ?? id); }
const I = '<i>i</i>';

// ===================== layout: the model on the left, a wide board on the right =====================
const MF = frame(60, 90, 960, 900);
const PB = box(1070, 70, 1860, 1010), PX = PB.x0 + 44, PW = PB.w - 88;
const W = (s: Paint) => ({ col: s });
const REAL = W('second'), IMAG = W('first'), SQ = W('water'), ANS = W('link');
/** split TeX at its top-level " = " (never inside braces or parentheses) */
function splitEq(src: string): string[] {
  const out: string[] = []; let d = 0, last = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (ch === '{' || ch === '(') d++; else if (ch === '}' || ch === ')') d--;
    else if (d === 0 && i > last && src.startsWith(' = ', i)) { out.push(src.slice(last, i)); last = i + 1; }
  }
  out.push(src.slice(last));
  return out;
}
interface Spec { key: string; src: string; size?: number; tags?: Record<string, { col: Paint }>; col?: Paint; gap?: number; center?: boolean }
/** board lines from the top down; a line too wide at 62 px breaks at its top-level = signs (same key) */
function stack(specs: Spec[], y0 = 170, area: { x: number; w: number } = { x: PX, w: PW }): { lines: Line[]; at: Record<string, Line[]>; y: number } {
  const lines: Line[] = [], at: Record<string, Line[]> = {};
  let y = y0;
  for (const sp of specs) {
    const size = sp.size ?? 80;
    const fitS = (src: string) => { const F = tex(src) as Formula; let s = size; while (s > 62 && texWidth(F, s) > area.w) s -= 2; return { F, s }; };
    let rows = [sp.src];
    if (texWidth(fitS(sp.src).F, fitS(sp.src).s) > area.w) rows = splitEq(sp.src).map((r, i) => (i ? r.trim() : r));
    const s = Math.min(...rows.map(r => fitS(r).s));
    at[sp.key] = rows.map((r, i) => {
      const F = tex(r) as Formula;
      const x = sp.center ? area.x + (area.w - texWidth(F, s)) / 2 : area.x + (i ? 60 : 0);
      const L: Line = { key: sp.key, F, x, y: y + i * s * 1.3, size: s, tags: sp.tags, col: sp.col };
      lines.push(L); return L;
    });
    y += rows.length * s * 1.3 + (sp.gap ?? s * 0.15);
  }
  return { lines, at, y };
}
const lineBox = (L: Line): Box => texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });
function strikeLine(c: Canvas, L: Line, k: number): void {
  if (k <= 0) return;
  const b = lineBox(L);
  strike(c, b.x0 - 10, b.cy + 6, b.x1 + 10, b.cy - 6, k, { col: 'wrong' });
}

// ===================== the complex plane (kit Plane: real across, imaginary up) =====================
const fmtIm = (v: number) => (Math.abs(v) < 1e-9 ? '' : Math.abs(v - 1) < 1e-9 ? 'i' : Math.abs(v + 1) < 1e-9 ? '−i' : `${fmtN(v)}i`);
/** points become Plane points (a name on a plate); arrows become segments from `from` (default 0) with a dot at the tip */
function planeItems(pts: readonly PP[], pre = ''): PItem[] {
  const out: PItem[] = [];
  for (const p of pts) {
    if (p.arrow) out.push({ kind: 'seg', key: pre + p.key + '.a', a: p.from ?? [0, 0], b: p.at, arrow: true, col: (p.col ?? 'first') as Paint, w: 6 });
    if (p.arrow === false) out.push({ kind: 'seg', key: pre + p.key + '.a', a: p.from ?? [0, 0], b: p.at, dash: true, col: (p.col ?? 'link') as Paint, w: 5 });
    if (p.name || !p.arrow) out.push({ kind: 'point', key: pre + p.key, x: p.at[0], y: p.at[1], name: p.name, col: (p.col ?? 'first') as Paint, open: p.open });
  }
  return out;
}
const keysOf = (items: PItem[]) => items.map(i => i.key);
function complexPlane(x: [number, number], y: [number, number], step: number, items: PItem[], fr: Frame): PlaneBlock {
  return Plane({ x: { min: x[0], max: x[1], step, name: 'real' }, y: { min: y[0], max: y[1], step, name: 'imaginary', fmt: fmtIm }, equal: true, items }, fr, th);
}
/** an arrow from 0 that turns by `q` quarter turns (counterclockwise +), its length scaled by `scale`, with an arc */
function drawTurn(c: Canvas, B: PlaneBlock, from: readonly [number, number], q: number, k: number, scale = 1, arcAt = 0.42): void {
  if (k <= 0) return;
  const r0 = Math.hypot(from[0], from[1]), a0 = Math.atan2(from[1], from[0]);
  const a = a0 + q * (Math.PI / 2), r = r0 * (1 + (scale - 1) * clamp(k));
  const O = B.px(0, 0);
  if (Math.abs(q) > 0.05) {
    const ra = r0 * arcAt, n = Math.max(8, Math.ceil(Math.abs(q) * 16));
    const arc: Pt[] = Array.from({ length: n + 1 }, (_, j) => { const t = a0 + (a - a0) * j / n; return B.px(ra * Math.cos(t), ra * Math.sin(t)); });
    arrow(c, arc, 1, { col: 'pick', lw: 4.5, head: 18, alpha: clamp(k * 2) });
  }
  arrow(c, [O, B.px(r * Math.cos(a), r * Math.sin(a))], 1, { col: 'link', lw: 7, head: 26, alpha: clamp(k * 3) });
}

// ===================== the product box (polynomials' ProductBox; real teal, i amber, i² blue) =====================
interface CxBox { B: BoxBlock; turned: [number, number, string][]; real: [number, number][]; imag: [number, number][]; imagSum: number }
/** a product box of two complex factors as [coefficient, power of i] terms; the i² cells turn real at 'turn' */
function cxBox(a: [number, number][], b: [number, number][], fr: Frame, held = false): CxBox {
  const cells = a.map(([p, e]) => b.map(([q, f]) => monoT(p * q, e + f)));
  const deg = a.map(([, e]) => b.map(([, f]) => e + f));
  const B = ProductBox({ left: a.map(([p, e]) => ({ tex: monoT(p, e), deg: e })), top: b.map(([p, e]) => ({ tex: monoT(p, e), deg: e })), cells: held ? cells.map(r => r.map(() => '')) : cells, deg }, fr, th);
  const turned: [number, number, string][] = [], real: [number, number][] = [], imag: [number, number][] = [];
  let imagSum = 0;
  a.forEach(([p, e], r) => b.forEach(([q, f], cc) => {
    const d = e + f;
    if (d === 2) { turned.push([r, cc, String(-p * q)]); real.push([r, cc]); } else if (d === 0) real.push([r, cc]); else { imag.push([r, cc]); imagSum += p * q; }
  }));
  return { B, turned, real, imag, imagSum };
}
/** the i² cells, turned real: a teal wash over the cell and the real number (k 0..1) */
function drawTurned(c: Canvas, X: CxBox, k: number): void {
  if (k <= 0) return;
  for (const [r, cc, t] of X.turned) {
    const b = X.B.where.cell(r, cc);
    wash(c, rectPts(b.x0 + 9, b.y0 + 9, b.w - 18, b.h - 18, 8), degRole(0), { seed: 960 + r * 3 + cc, rough: 1.3, alpha: k * 0.97, inkW: 2.5 });
    texDraw(c, tex(t) as Formula, b.cx, b.cy, { size: 76, align: 'center', k, col: '#101330' as Paint });
  }
}
const boxP = (pre: string) => progressOf<BoxStep>(s => tr.k(pre + 'b.' + s));

// ===================== 1. The question =====================
const CARDS = [
  { v: `5 + 14${I}`, t: '5 + 14i', id: '', why: 't.cb-right', ok: true },
  { v: `11 + 14${I}`, t: '11 + 14i', id: MC.i2Plus, why: 't.cb-plus', ok: false },
  { v: '5', t: '5', id: MC.firstsLasts, why: 't.cb-fl', ok: false },
];
const QA: [number, number][] = [[2, 0], [3, 1]], QB: [number, number][] = [[4, 0], [1, 1]];
function partQuestion(): void {
  tr.reset('q.');
  const X = cxBox(QA, QB, MF);
  const st = stack([
    { key: 'q.l0', src: 'i^{2} = -1', size: 96, center: true, gap: 70, tags: {} },
    { key: 'q.l1', src: '(2 + 3i)(4 + i) = \\,?', size: 96, center: true },
  ], 300);
  setScene({ model: c => X.B.draw(c, boxP('q.')), lines: st.lines, leads: [], boardBox: PB });
  tr.set('q.b.frame', 1, 1.0); tr.set('q.b.sides', 1, 1.2, 0.8); tr.set('q.l0', 1, 1.0, 1.2); tr.set('q.l1', 1, 1.0, 2.0);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'i^2 = -1. What is (2 + 3i)(4 + i)?', board: '(2 + 3i)(4 + i)', response: c.t, expected: '5 + 14i', correct: c.ok, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.v}</span>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A new number'), voiced('q.intro'), voiced('q.ask'), cards, voiced('q.sure', 'div', 'label'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: meet i, then (2 + 3i)(4 + i) =====================
function partExample(): void {
  tr.reset('e.');
  const X = cxBox(QA, QB, MF);
  const P0 = complexPlane([-2, 2], [-2, 2], 1, [
    { kind: 'point', key: 'one', x: 1, y: 0, col: 'second' },
    { kind: 'point', key: 'i', x: 0, y: 1, col: 'first' },
    { kind: 'point', key: 'm1', x: -1, y: 0, col: 'link' },
  ], MF);
  const st = stack([
    { key: 'e.l0', src: 'i \\cdot 1 = \\cssId{a}{i}', size: 80, tags: { a: IMAG } },
    { key: 'e.l1', src: 'i \\cdot i = i^{2} = \\cssId{a}{-1}', size: 80, tags: { a: ANS }, gap: 50 },
    { key: 'e.l2', src: '(\\cssId{a}{2} + \\cssId{b}{3i})(\\cssId{c}{4} + \\cssId{d}{i})', size: 80, tags: { a: REAL, b: IMAG, c: REAL, d: IMAG } },
    { key: 'e.l3', src: '= \\cssId{a}{8} + \\cssId{b}{2i} + \\cssId{c}{12i} + \\cssId{d}{3i^{2}}', size: 80, tags: { a: REAL, b: IMAG, c: IMAG, d: SQ } },
    { key: 'e.l4', src: '= \\cssId{a}{8} + \\cssId{b}{2i} + \\cssId{c}{12i} \\cssId{d}{- 3}', size: 80, tags: { a: REAL, b: IMAG, c: IMAG, d: REAL } },
    { key: 'e.l5', src: '= \\cssId{a}{5} + \\cssId{b}{14i}', size: 92, tags: { a: ANS, b: ANS } },
  ], 160);
  const planeP = progressOf(s => tr.k('e.p.' + s));
  const focus = (): BoxFocus => ({ groups: [{ cells: X.real, col: 'second', k: tr.k('e.gR') }, { cells: X.imag, col: 'first', k: tr.k('e.gI') }] });
  setScene({
    model: c => {
      withAlpha(c, 1 - tr.k('e.swap'), () => { P0.draw(c, planeP); drawTurn(c, P0, [1, 0], tr.k('e.t1') + tr.k('e.t2'), tr.k('e.arrow')); });
      withAlpha(c, tr.k('e.swap'), () => { X.B.draw(c, boxP('e.'), focus()); drawTurned(c, X, tr.k('e.turn')); });
    },
    lines: st.lines, leads: [], boardBox: PB,
  });
  tr.jump('e.p.axes', 1); tr.jump('e.p.one', 1);
  let step = 0;
  const STEPS = [
    { t: 'Meet i', why: 'Multiplying by i is a quarter turn.', act: 'Turn it' },
    { t: 'Every term times every term', why: 'Fill the four cells of the box.', act: 'Fill the box' },
    { t: 'Replace i² with −1', why: 'The i² cell becomes a real number.', act: 'Replace it' },
    { t: 'Collect the parts', why: 'Real with real, i with i.', act: 'Collect' },
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
        tr.set('e.arrow', 1, 0.5); await wait(0.6); if (!alive()) return;
        tr.set('e.t1', 1, 1.4); await wait(1.4); if (!alive()) return;
        tr.set('e.p.i', 1, 0.6); tr.set('e.l0', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.t2', 1, 1.4); await wait(1.4); if (!alive()) return;
        tr.set('e.p.m1', 1, 0.6); tr.set('e.l1', 1, 1.2); await wait(1.4);
      } else if (i === 1) {
        tr.set('e.swap', 1, 1.0); tr.set('e.b.frame', 1, 0.8, 0.4); tr.set('e.b.sides', 1, 0.9, 0.9); tr.set('e.l2', 1, 1.0, 1.0);
        await wait(2.0); if (!alive()) return;
        tr.set('e.b.cells', 1, 3.0); await wait(3.0); if (!alive()) return;
        tr.set('e.l3', 1, 1.3); await wait(1.5);
      } else if (i === 2) {
        tr.set('e.turn', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.l3:dim', 1, 0.5); tr.set('e.l4', 1, 1.2); await wait(1.4);
      } else {
        tr.set('e.gR', 1, 0.7); await wait(1.2); if (!alive()) return;
        tr.set('e.gI', 1, 0.7); await wait(1.2); if (!alive()) return;
        tr.set('e.l4:dim', 1, 0.5); tr.set('e.l5', 1, 1.2); await wait(1.4);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.s${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: `Because ${I}<sup>2</sup> = −1, so 3${I}<sup>2</sup> = 3 · (−1).`, ok: true, id: 'e.w-ok', mc: undefined as string | undefined },
      { t: `Because ${I} = −1, so the cell is negative.`, ok: false, id: 'e.w-neg', mc: MC.iIsMinusOne as string | undefined },
      { t: `It should not: a square is never negative, so 3${I}<sup>2</sup> = 3.`, ok: false, id: 'e.w-pos', mc: MC.i2Plus as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why did the 3i^2 cell turn into -3?', response: o.t.replace(/<[^>]+>/g, ''), correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: (3 − 2i)(1 + 4i) =====================
function partTurn(): void {
  tr.reset('t.');
  const X = cxBox([[3, 0], [-2, 1]], [[1, 0], [4, 1]], MF);
  const st = stack([
    { key: 't.l0', src: '(\\cssId{a}{3} \\cssId{b}{- 2i})(\\cssId{c}{1} + \\cssId{d}{4i})', size: 84, tags: { a: REAL, b: IMAG, c: REAL, d: IMAG } },
    { key: 't.l1', src: '= \\cssId{a}{3} + \\cssId{b}{12i} \\cssId{c}{- 2i} \\cssId{d}{- 8i^{2}}', size: 80, tags: { a: REAL, b: IMAG, c: IMAG, d: SQ } },
    { key: 't.l2', src: '= \\cssId{a}{3} + \\cssId{b}{12i} \\cssId{c}{- 2i} \\cssId{d}{+ 8}', size: 80, tags: { a: REAL, b: IMAG, c: IMAG, d: REAL } },
    { key: 't.l3', src: '= \\cssId{a}{11} + \\cssId{b}{10i}', size: 92, tags: { a: ANS, b: ANS } },
  ], 190);
  const focus = (): BoxFocus => ({ groups: [{ cells: X.real, col: 'second', k: tr.k('t.gR') }, { cells: X.imag, col: 'first', k: tr.k('t.gI') }, { cells: [[1, 1]], col: 'pick', k: tr.k('t.ask') }] });
  setScene({ model: c => { X.B.draw(c, boxP('t.'), focus()); drawTurned(c, X, tr.k('t.turn')); }, lines: st.lines, leads: [], boardBox: PB });
  tr.set('t.b.frame', 1, 1.0); tr.set('t.b.sides', 1, 1.0, 0.5); tr.set('t.l0', 1, 1.0, 0.8); tr.set('t.b.cells', 1, 2.4, 1.4); tr.set('t.l1', 1, 1.2, 3.6);
  let step = 2;
  const STEPS = [
    { t: 'Meet i', why: 'Done for you: i² = −1.' },
    { t: 'Every term times every term', why: 'Done for you: the box is filled.' },
    { t: 'Replace i² with −1', why: 'Your step.' },
    { t: 'Collect the parts', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn'), voiced('t.intro'), plan, work);
  seq(async alive => { await wait(4.6); if (!alive()) return; askI2(); });
  function askI2(): void {
    tr.set('t.ask', 1, 0.5);
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.num', false)); return; }
      const v = r.v, good = v === 8;
      const mc = v === -8 ? MC.i2Plus : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.i2', prompt: '-8i^2 as a real number', board: '-8i^2', response: v, expected: 8, correct: good, mc });
      fbHost.replaceChildren(voicedFb(good ? 't.i2-ok' : v === -8 ? 't.i2-plus' : 't.i2-no', good));
      if (!good) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.ask', 0, 0.4); tr.set('t.turn', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('t.l1:dim', 1, 0.5); tr.set('t.l2', 1, 1.2); await wait(1.6); if (!alive()) return;
        step = 3; drawPlan(); askSum();
      });
    }
    work.replaceChildren(voiced('t.i2'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askSum(): void {
    tr.set('t.gR', 1, 0.6); tr.set('t.gI', 1, 0.6, 0.4);
    const fbHost = h('div'), inp = pairInput('', '+', () => check(), I), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(voicedFb('t.pair', false)); return; }
      const good = r.x === 11 && r.y === 10;
      const id = good ? 't.sum-ok' : r.x === -5 ? 't.sum-plus' : r.x === 11 && r.y === 14 ? 't.sum-sign' : 't.sum-mix';
      const mc = r.x === -5 ? MC.i2Plus : r.y === 0 && r.x === 21 ? MC.combines : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.collect', prompt: '(3 - 2i)(1 + 4i) = 3 + 12i - 2i + 8 in a + bi form', board: '3 + 12i - 2i + 8', response: `${r.x} + ${r.y}i`, expected: '11 + 10i', correct: good, mc });
      fbHost.replaceChildren(voicedFb(id, good));
      if (!good) return;
      ok.disabled = true;
      seq(async alive => { tr.set('t.l2:dim', 1, 0.5); tr.set('t.l3', 1, 1.2); await wait(1.4); if (!alive()) return; step = 4; drawPlan(); fbHost.append(callback()); });
    }
    work.replaceChildren(voiced('t.sum'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 't.cb-none';
    const p = voiced(id);
    if (cd) p.insertAdjacentHTML('beforeend', ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>`);
    c.append(p, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Sam's √(−4) · √(−9) = √36 = 6 =====================
function partProve(): void {
  tr.reset('p.');
  const P = complexPlane([-7, 7], [-7, 7], 1, [
    { kind: 'seg', key: 'bA', a: [0, 0], b: [0, 3], arrow: true, col: 'second', w: 6 },
    { kind: 'seg', key: 'aA', a: [0, 0], b: [0, 2], arrow: true, col: 'first', w: 6 },
    { kind: 'point', key: 'a', x: 0, y: 2, col: 'first' },
    { kind: 'point', key: 'b', x: 0, y: 3, col: 'second' },
    { kind: 'seg', key: 'sA', a: [0, 0], b: [6, 0], arrow: true, col: 'pick', w: 6 },
    { kind: 'point', key: 's', x: 6, y: 0, col: 'pick' },
    { kind: 'point', key: 'm', x: -6, y: 0, col: 'link' },
  ], MF);
  const st = stack([
    { key: 'p.sam', src: '\\sqrt{-4}\\cdot\\sqrt{-9} = \\sqrt{36} = 6', size: 72, col: 'dim', gap: 50 },
    { key: 'p.l1', src: '\\sqrt{-4} = \\cssId{a}{2i},\\ \\ \\sqrt{-9} = \\cssId{b}{3i}', size: 78, tags: { a: IMAG, b: REAL } },
    { key: 'p.l2', src: '\\cssId{a}{2i} \\cdot \\cssId{b}{3i} = 6 \\cdot i \\cdot i', size: 78, tags: { a: IMAG, b: REAL } },
    { key: 'p.l3', src: '= 6i^{2} = \\cssId{a}{-6}', size: 86, tags: { a: ANS } },
  ], 190);
  const PP_ = progressOf(s => tr.k('p.' + s));
  setScene({
    model: c => {
      P.draw(c, PP_, { ring: [{ key: 's', col: 'wrong', k: tr.k('p.ringS') }] });
      drawTurn(c, P, [6, 0], tr.k('p.t1') + tr.k('p.t2'), tr.k('p.turn'), 1, 0.8);
      const ks = tr.k('p.xS');
      if (ks > 0) { const b = P.where('s'); strike(c, b.x0 - 6, b.y1 + 6, b.x1 + 6, b.y0 - 6, ks, { col: 'wrong' }); }
    },
    lines: st.lines, leads: [], boardBox: PB, extra: c => strikeLine(c, st.at['p.sam']![0]!, tr.k('p.samX')),
  });
  tr.set('p.axes', 1, 1.0); tr.set('p.sam', 1, 1.2, 0.8);
  const CHIPS = [
    { t: `√(−k) = ${I}√k for k > 0: (2${I})<sup>2</sup> = 4${I}<sup>2</sup> = −4.`, fits: 0 },
    { t: 'Multiply the numbers and the i’s separately: 2 · 3 = 6.', fits: 1 },
    { t: `${I}<sup>2</sup> = −1: two quarter turns take 6 to −6.`, fits: 2 },
    { t: '√a · √b = √(ab) for all numbers a and b.', fits: -1, mc: MC.productRule, id: 'p.no.rule' },
    { t: '√(−4) = −2, because the root of a negative is negative.', fits: -1, mc: MC.rootNegReal, id: 'p.no.neg' },
    { t: `${I} · ${I} = ${I}, so the product is 6${I}.`, fits: -1, mc: MC.iTimesI, id: 'p.no.ii' },
  ];
  const CLAIMS = [
    `√(−4) = <b>2${I}</b> and √(−9) = <b>3${I}</b>,`,
    `so √(−4) · √(−9) = 2${I} · 3${I} = <b>6 · ${I} · ${I}</b>,`,
    `= 6${I}<sup>2</sup> = <b class="s">−6</b>, not 6,`,
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
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t.replace(/<[^>]+>/g, ''), correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) {
        tr.set('p.bA', 1, 0.9); tr.set('p.b', 1, 0.6, 0.6); tr.set('p.aA', 1, 0.9, 0.5); tr.set('p.a', 1, 0.6, 1.1);
        await wait(1.4); if (!alive()) return; tr.set('p.l1', 1, 1.2);
      }
      if (n === 2) {
        tr.set('p.sA', 1, 1.0); tr.set('p.s', 1, 0.6, 0.8); await wait(1.4); if (!alive()) return;
        tr.set('p.l2', 1, 1.2);
      }
      if (n === 3) {
        tr.set('p.turn', 1, 0.4); await wait(0.4); if (!alive()) return;
        tr.set('p.t1', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('p.t2', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('p.m', 1, 0.6); tr.set('p.l3', 1, 1.2); await wait(1.2); if (!alive()) return;
        tr.set('p.ringS', 1, 0.5); tr.set('p.xS', 1, 0.6, 0.3); tr.set('p.samX', 1, 0.7, 0.6); await wait(1.4); if (!alive()) return;
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
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: sqrt(-4) * sqrt(-9) = sqrt(36) = 6. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.productRule : undefined });
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
    show: it => showItem(it as CxItem),
  });
}
type Show = { solve?: (alive: () => boolean) => Promise<void> };
/** the answer line on the board after a miss (pair items: a + bi from the two parts) */
function answerTex(it: CxItem): string | null {
  const a = it.answer;
  if (a.kind !== 'pair' || it.pairOp !== '+') return null;
  const f = (v: number) => { const r = Math.round(v * 1e6) / 1e6; return String(Math.abs(r)); };
  const x = a.x, y = a.y;
  if (y === 0) return `= ${x < 0 ? '-' : ''}${f(x)}`;
  const yi = Math.abs(y) === 1 ? 'i' : `${f(y)}i`;
  if (x === 0) return `= ${y < 0 ? '-' : ''}${yi}`;
  return `= ${x < 0 ? '-' : ''}${f(x)} ${y < 0 ? '-' : '+'} ${yi}`;
}
function boardFor(it: CxItem, y0 = 200): { lines: Line[]; ans: string | null } {
  const ans = answerTex(it);
  const st = stack([{ key: 'x.L0', src: it.board, size: 88, gap: 40 }, ...(ans ? [{ key: 'x.LA', src: ans, size: 88, col: 'link' as Paint }] : [])], y0);
  return { lines: st.lines, ans };
}
function planeScene(it: CxItem, pic: PlanePic): Show | null {
  const step = pic.step ?? 1;
  const given = planeItems(pic.given), rev = planeItems(pic.reveal?.pts ?? [], 'r.');
  const made = tryBlock(() => complexPlane(pic.x, pic.y, step, [...given, ...rev], MF));
  if (!made.ok) { console.info('plane fallback', it.family, made.error); return null; }
  const B = made.value, turn = pic.reveal?.turn;
  const { lines } = boardFor(it);
  const P = progressOf(s => tr.k('x.' + s));
  setScene({ model: c => { B.draw(c, P); if (turn) drawTurn(c, B, turn.from, turn.quarters * tr.k('x.turnQ'), tr.k('x.turn'), turn.scale ?? 1); }, lines, leads: [], boardBox: PB });
  tr.set('x.axes', 1, 0.8); tr.set('x.L0', 1, 0.9, 0.4);
  keysOf(given).forEach((k, j) => tr.set('x.' + k, 1, 0.7, 0.6 + j * 0.15));
  return {
    solve: async alive => {
      if (turn) { tr.set('x.turn', 1, 0.4); await wait(0.4); if (!alive()) return; tr.set('x.turnQ', 1, Math.max(1.2, Math.abs(turn.quarters) * 0.9)); await wait(Math.max(1.2, Math.abs(turn.quarters) * 0.9) + 0.2); if (!alive()) return; }
      keysOf(rev).forEach((k, j) => tr.set('x.' + k, 1, 0.8, j * 0.3));
      await wait(0.8); if (!alive()) return;
      tr.set('x.LA', 1, 1.0);
    },
  };
}
function boxScene(it: CxItem, pic: BoxPic): Show | null {
  const made = tryBlock(() => cxBox(pic.a, pic.b, MF));
  if (!made.ok) { console.info('box fallback', it.family, made.error); return null; }
  const X = made.value;
  const { lines } = boardFor(it);
  const cancel = X.imag.length > 1 && X.imagSum === 0;
  const focus = (): BoxFocus => ({
    groups: [{ cells: X.real, col: 'second', k: tr.k('x.gR') }, { cells: X.imag, col: 'first', k: tr.k('x.gI') }],
    strike: cancel ? X.imag.map(([r, c]) => ({ r, c, k: tr.k('x.strike') })) : [],
  });
  setScene({ model: c => { X.B.draw(c, boxP('x.'), focus()); drawTurned(c, X, tr.k('x.turn')); }, lines, leads: [], boardBox: PB });
  tr.set('x.b.frame', 1, 0.8); tr.set('x.b.sides', 1, 0.9, 0.4); tr.set('x.L0', 1, 0.9, 0.5);
  return {
    solve: async alive => {
      tr.set('x.b.cells', 1, 2.0); await wait(2.1); if (!alive()) return;
      if (X.turned.length) { tr.set('x.turn', 1, 1.0); await wait(1.2); if (!alive()) return; }
      tr.set('x.gR', 1, 0.6); tr.set('x.gI', 1, 0.6, 0.3); await wait(1.0); if (!alive()) return;
      if (cancel) { tr.set('x.strike', 1, 0.7); await wait(0.9); if (!alive()) return; }
      tr.set('x.LA', 1, 1.0);
    },
  };
}
const SETS_FR = frame(40, 40, 1390, 1000), SETS_SLATE = box(1480, 330, 1860, 750);
function setsScene(it: CxItem): Show | null {
  const S = it.picture!.sets!, at = S.reveal?.at;
  if (!at) return null;
  const toks = [...S.others, { tex: S.token, at }];
  const made = tryBlock(() => ComplexSets(toks, SETS_FR, th));
  if (!made.ok) { console.info('sets fallback', it.family, made.error); return null; }
  const B = made.value, me = toks.length - 1;
  const L = bigLine('x.T', S.token, SETS_SLATE, 110);
  const P = progressOf(s => tr.k('x.' + s));
  setScene({ model: c => B.draw(c, P, { rings: [{ at, col: 'link', k: tr.k('x.ring') }], glows: [{ i: me, col: 'link', k: tr.k('x.ring') }] }), lines: [L], leads: [], boardBox: SETS_SLATE });
  ['complex', 'real', 'rational', 'integer', 'whole', 'counting', 'irrational', 'nonreal', 'imag'].forEach((s, j) => tr.set('x.' + s, 1, 0.6, j * 0.08));
  S.others.forEach((_, j) => tr.set('x.t' + j, 1, 0.6, 0.8 + j * 0.1));
  tr.set('x.T', 1, 0.8, 0.3);
  return { solve: async alive => { tr.set('x.T:dim', 1, 0.5); tr.set('x.t' + me, 1, 0.9); await wait(0.9); if (!alive()) return; tr.set('x.ring', 1, 0.6); } };
}
function linesScene(it: CxItem): Show {
  const pic = it.picture!.lines!, bad = pic.reveal?.bad ?? -1;
  const sl = box(110, 90, 1810, 990);
  const n = pic.lines.length, gap = Math.min(200, (sl.h - 200) / Math.max(1, n - 1));
  const Ls: Line[] = pic.lines.map((src, i) => {
    const F = tex(src) as Formula;
    let s = i === 0 ? 92 : 84;
    while (s > 62 && texWidth(F, s) > sl.w - 420) s -= 2;
    return { key: 'x.c' + i, F, x: sl.x0 + 260, y: sl.y0 + 140 + i * gap, size: s };
  });
  const extra = (c: Canvas) => {
    pic.lines.forEach((_, i) => { if (i > 0) drawWords(c, `Line ${i}`, sl.x0 + 50, Ls[i]!.y, i === bad && tr.k('x.bad') > 0.5 ? 'wrong' : 'dim', tr.k('x.c' + i), { size: 46 }); });
    const k = tr.k('x.bad');
    if (k > 0) {
      const target = bad > 0 ? Ls[bad]! : Ls[n - 1]!, b = lineBox(target);
      const { g } = c;
      g.save(); g.globalAlpha *= k; g.strokeStyle = bad > 0 ? '#FF6B6B' : '#B7E36A'; g.lineWidth = 5;
      g.beginPath(); g.roundRect(sl.x0 + 30, b.y0 - 18, sl.w - 60, b.h + 36, 14); g.stroke(); g.restore();
      if (bad <= 0) drawWords(c, 'not finished yet', sl.x1 - 60, b.cy + 70, 'link', k, { size: 44, align: 'right' });
    }
  };
  setScene({ model: c => slate(c, sl), lines: Ls, leads: [], boardBox: null, extra });
  Ls.forEach((L, i) => tr.set(L.key, 1, 0.8, 0.2 + i * 0.5));
  return { solve: async () => { tr.set('x.bad', 1, 0.6); } };
}
function graphScene(it: CxItem): Show | null {
  const k = it.picture!.graph!.k;
  const stepY = k <= 8 ? 2 : k <= 20 ? 4 : k <= 50 ? 10 : 20, top = Math.ceil((k + 16) / stepY) * stepY;
  const made = tryBlock(() => Plane({ x: { min: -4, max: 4, step: 1, name: 'x' }, y: { min: 0, max: top, step: stepY, name: 'y' }, items: [
    { kind: 'curve', key: 'c', f: x => x * x + k },
    { kind: 'point', key: 'v', x: 0, y: k, name: `(0, ${k})`, col: 'second' },
  ] }, MF, th));
  if (!made.ok) { console.info('graph fallback', it.family, made.error); return null; }
  const B = made.value;
  const { lines } = boardFor(it);
  setScene({ model: c => B.draw(c, progressOf(s => tr.k('x.' + s))), lines, leads: [], boardBox: PB });
  tr.set('x.axes', 1, 0.8); tr.set('x.c', 1, 1.4, 0.5); tr.set('x.v', 1, 0.6, 1.6); tr.set('x.L0', 1, 0.9, 0.4);
  return {};
}
function showItem(it: CxItem): Show {
  tr.reset('x.');
  const pic = it.picture;
  if (pic?.plane) { const r = planeScene(it, pic.plane); if (r) return r; }
  if (pic?.box) { const r = boxScene(it, pic.box); if (r) return r; }
  if (pic?.sets) { const r = setsScene(it); if (r) return r; }
  if (pic?.lines) return linesScene(it);
  if (pic?.graph) { const r = graphScene(it); if (r) return r; }
  const big = box(200, 200, 1720, 880);
  const ans = answerTex(it);
  const st = stack([{ key: 'x.T', src: it.board, size: 120, center: true, gap: 60 }, ...(ans ? [{ key: 'x.LA', src: ans, size: 110, col: 'link' as Paint, center: true }] : [])], ans ? 420 : 540, { x: big.x0 + 70, w: big.w - 140 });
  setScene({ lines: st.lines, leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return { solve: ans ? async () => { tr.set('x.LA', 1, 1.0); } : undefined };
}

void runLesson({
  slug: SLUG,
  warm: ['(2 + 3i)(4 + i) = 5 + 14i^{2} \\sqrt{-4} \\cdot \\overline{z} \\dfrac{3}{4} \\overset{?}{=} \\square \\checkmark', '\\mathbb{R} \\subset \\mathbb{C}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
void E;
