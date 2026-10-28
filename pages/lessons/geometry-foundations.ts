// geometry-foundations.ts: "Definitions, postulates and first proofs" (Geometry, lesson 2) on the shared runtime.
//   1 The question   Rita starts a proof with "AM = MB" beside a drawing where M only looks halfway: what may go in
//                    the reason column? (it looks that way = appearance; I measured = measurement; nothing yet = right)
//   2 Worked example the first two-column proof: A, B, C, D in order on a line, AC = BD, prove AB = CD. Givens and
//                    target -> split each whole (Segment Addition) -> substitute -> subtract the shared BC (the ticks
//                    on AB and CD are earned last); why not write AB = CD in line 1?
//   3 Your turn      the Vertical Angles Theorem, faded: lines 1-2 written; the student picks the reason of line 3, the
//                    statement of line 4, the reason of line 5, then its status (theorem); the crossing swings
//   4 Prove it       Kai measured five drawings: proved? Then the Alternate Interior Angles Theorem with the proof
//                    frame: Parsons ordering with two decoys, then a reason menu per line; the transversal swings
//   5 Practice       all 31 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/geometry-foundations/script.ts -> voice/lines.json. Every answer is logged.
import type { Canvas } from '../../src/core/draw';
import { box, type Box, clamp } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import type { Paint } from '../../src/core/theme';
import { th, setScene, seq, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { tryBlock } from '../../src/blocks/block';
import { wash } from '../../src/lesson/wash';
import { drawWords } from '../../src/lesson/words';
import { type Fig, type Frame, type Pt, FR_LEFT, FR_LESSON, FR_RIGHT, FR_WIDE, fitFig, galleryFrames, toScreen } from '../../src/lesson/topics/geometry-foundations/geo';
import { type Look, drawFig, sheet } from '../../src/lesson/topics/geometry-foundations/GeoFig';
import { ProofFrame, type ProofStep } from '../../src/lesson/topics/geometry-foundations/ProofFrame';
import { proofPanel } from '../../src/lesson/topics/geometry-foundations/proofPanel';
import { drawGlobe } from '../../src/lesson/topics/geometry-foundations/Globe';
import { cardPainter, cardsPainter } from '../../src/lesson/topics/geometry-foundations/Card';
import { crossing, onLine, slotMeasure, transversal } from '../../src/lesson/topics/geometry-foundations/figs';
import { RS, htm } from '../../src/lesson/topics/geometry-foundations/proofs';
import { FAMILY_NAMES, GENERATORS, MC, type GFItem } from '../../src/lesson/topics/geometry-foundations/items';
import { PLAN } from '../../src/lesson/topics/geometry-foundations/plan';
import { explain } from '../../src/lesson/topics/geometry-foundations/explain';
import { SCRIPT } from '../../src/lesson/topics/geometry-foundations/script';
import LINES from './geometry-foundations/voice/lines.json';

const SLUG = 'geometry-foundations';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = '', extra = ''): HTMLElement {
  const s = SCRIPT[id];
  if (!s) throw new Error(`no script line ${id}`);
  if (!(id in LINES)) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, s.html + extra);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]!.html); }
const plainOf = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<');
const K = (key: string) => tr.k(key);
const steps = (pre: string) => progressOf<ProofStep>(s => tr.k(`${pre}pf.${s}`));
const pf = (pre: string, s: string, to = 1, d = 0.8, delay = 0) => tr.set(`${pre}pf.${s}`, to, d, delay);
const RIGHT_FR: Frame = { x: FR_RIGHT.x, y: FR_RIGHT.y, w: FR_RIGHT.w, h: FR_RIGHT.h };

/** a one-shot choice question in the panel: logs, gives feedback, runs `after` on the right one */
function ask(part: "turn" | "prove" | "example", item: string, prompt: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], after: () => void): HTMLElement {
  const bx = h('div', { class: 'opts' }), fbHost = h('div');
  let done = false;
  opts.forEach((o, k) => bx.append(btn(o.t, () => {
    if (done) return;
    bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
    ctx.store.log({ part, item, prompt, response: plainOf(o.t), expected: plainOf(opts.find(x => x.ok)!.t), correct: o.ok, mc: o.mc });
    fbHost.replaceChildren(voicedFb(o.id, o.ok));
    if (o.ok) { done = true; after(); }
  })));
  return h('div', {}, bx, fbHost);
}

// ===================== 1. The question =====================
const CARDS = [
  { name: 'It looks that way', t: 'M sits right in the middle', mc: MC.appearance as string | undefined, cb: 'q.cb.look', right: false },
  { name: 'I measured', t: 'AM = 3.2 cm and MB = 3.2 cm', mc: 'mc.geometric-proof.procedure-or-measurement-as-proof' as string | undefined, cb: 'q.cb.measure', right: false },
  { name: 'Nothing yet', t: 'no given, marking or accepted statement says it', mc: undefined as string | undefined, cb: 'q.cb.none', right: true },
];
const Q_FIG: Fig = onLine(['A', 'M', 'B'], [0, 260, 520], { deg: 0 });
function partQuestion(): void {
  tr.reset('q.');
  const P = ProofFrame({ given: ['\\text{only the drawing}'], prove: 'AM = MB', rows: [{ st: 'AM = MB', rs: '' }] }, { x: RIGHT_FR.x, y: 160, w: RIGHT_FR.w, h: 560 }, th);
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_LESSON, K('q.sheet'));
      drawFig(c, Q_FIG, FR_LESSON, { k: K('q.fig') });
      P.draw(c, steps('q.'), { ask: [{ i: 0, cell: 'rs' }], rings: [{ i: 0, col: 'pick', k: K('q.ring') }] });
    },
  });
  tr.set('q.sheet', 1, 0.6); tr.set('q.fig', 1, 0.9, 0.3); pf('q.', 'frame', 1, 0.8, 1.0); pf('q.', 's0', 1, 0.9, 1.6); tr.set('q.ring', 1, 0.6, 2.4);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Rita writes AM = MB beside a drawing with nothing marked. What may go in the reason column?', response: `${c.name}: ${c.t}`, expected: 'Nothing yet', correct: c.right, mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.name}<small>${cd.t}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'What counts as a reason?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== the worked-example figure: A, B, C, D with the two wholes as bands =====================
const E_X = [0, 170, 320, 490];
const E_FIG: Fig = (() => { const f = onLine(['A', 'B', 'C', 'D'], E_X, { kind: 'line' }); f.segs = f.segs.map(s => (s.id === 'p0' || s.id === 'p2' ? { ...s, ticks: 1, col: 'link' as const } : s)); return f; })();
function bands(c: Canvas, pre: string): void {
  const fit = fitFig(E_FIG, FR_LESSON);
  const X = E_X.map(x => toScreen(fit, [x - 245, 0]));
  const band = (x0: number, x1: number, y: number, col: Paint, a: number, seed: number) => {
    if (a <= 0) return;
    wash(c, [[x0 + 4, y - 16], [x1 - 4, y - 16], [x1 - 4, y + 16], [x0 + 4, y + 16]], col, { alpha: a, ink: null, rough: 1, seed, shade: 0.05 });
  };
  const y0 = X[0]![1], up = y0 - 92, dn = y0 + 92;
  const kW = K(pre + 'whole'), kS = K(pre + 'split'), kSh = K(pre + 'shared');
  const whole = kW * (1 - kS);
  band(X[0]![0], X[2]![0], up, 'first', 0.75 * whole, 3); band(X[1]![0], X[3]![0], dn, 'second', 0.75 * whole, 4);
  drawWords(c, 'AC', (X[0]![0] + X[2]![0]) / 2, up - 52, 'first', whole, { size: 46, align: 'center' });
  drawWords(c, 'BD', (X[1]![0] + X[3]![0]) / 2, dn + 52, 'second', whole, { size: 46, align: 'center' });
  // split: AB | BC above, BC | CD below; the shared BC dims when it is taken away
  const shared = 1 - 0.8 * kSh;
  band(X[0]![0], X[1]![0], up, kSh > 0.5 ? 'link' : 'first', 0.75 * kS, 5); band(X[1]![0], X[2]![0], up, 'first', 0.5 * kS * shared, 6);
  band(X[1]![0], X[2]![0], dn, 'second', 0.5 * kS * shared, 7); band(X[2]![0], X[3]![0], dn, kSh > 0.5 ? 'link' : 'second', 0.75 * kS, 8);
  const lab = (t: string, x0: number, x1: number, y: number, col: Paint, a: number) => drawWords(c, t, (x0 + x1) / 2, y, col, a, { size: 46, align: 'center' });
  lab('AB', X[0]![0], X[1]![0], up - 52, kSh > 0.5 ? 'link' : 'first', kS); lab('BC', X[1]![0], X[2]![0], up - 52, 'first', kS * shared);
  lab('BC', X[1]![0], X[2]![0], dn + 52, 'second', kS * shared); lab('CD', X[2]![0], X[3]![0], dn + 52, kSh > 0.5 ? 'link' : 'second', kS);
}
const E_ROWS = [
  { st: 'AC = BD', rs: RS.given },
  { st: 'AC = AB + BC', rs: RS.segAdd },
  { st: 'BD = BC + CD', rs: RS.segAdd },
  { st: 'AB + BC = BC + CD', rs: RS.subst },
  { st: 'AB = CD', rs: RS.subP },
];

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const P = ProofFrame({ given: ['A, B, C, D\\text{ in order on a line}', 'AC = BD'], prove: 'AB = CD', rows: E_ROWS }, RIGHT_FR, th);
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_LESSON, K('e.sheet'));
      drawFig(c, E_FIG, FR_LESSON, { k: K('e.fig'), ticks: { p0: K('e.ticks'), p2: K('e.ticks') }, col: K('e.ticks') > 0 ? {} : { p0: 'plain', p2: 'plain' } });
      bands(c, 'e.');
      P.draw(c, steps('e.'), { rings: [0, 1, 2, 3, 4].map(i => ({ i, col: (i === 4 ? 'link' : 'pick') as Paint, k: K(`e.ring${i}`) })) });
    },
  });
  tr.set('e.sheet', 1, 0.5); tr.set('e.fig', 1, 0.8, 0.2); pf('e.', 'frame', 1, 0.8, 0.5);
  let step = 0;
  const STEPS = [
    { t: 'Givens and target', why: 'What may the proof start from?', act: 'Start' },
    { t: 'Split each whole', why: 'B and C sit between other points.', act: 'Split' },
    { t: 'Substitute', why: 'Two sums are both equal to equal things.', act: 'Substitute' },
    { t: 'Take away the shared part', why: 'Both sides contain BC.', act: 'Subtract' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const ringOnly = (...on: number[]) => { for (let i = 0; i < 5; i++) tr.set(`e.ring${i}`, on.includes(i) ? 1 : 0, 0.5); };
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) { tr.set('e.whole', 1, 1.0); await wait(1.0); if (!alive()) return; pf('e.', 's0', 1, 0.8); pf('e.', 'r0', 1, 0.7, 0.6); ringOnly(0); await wait(1.4); }
      else if (i === 1) { tr.set('e.split', 1, 1.2); await wait(1.4); if (!alive()) return; pf('e.', 's1', 1, 0.8); pf('e.', 'r1', 1, 0.7, 0.5); ringOnly(1); await wait(1.2); if (!alive()) return; pf('e.', 's2', 1, 0.8); pf('e.', 'r2', 1, 0.7, 0.5); ringOnly(1, 2); await wait(1.3); }
      else if (i === 2) { ringOnly(0, 1, 2); await wait(1.2); if (!alive()) return; pf('e.', 's3', 1, 0.9); pf('e.', 'r3', 1, 0.7, 0.6); ringOnly(3); await wait(1.4); }
      else { tr.set('e.shared', 1, 1.0); await wait(1.2); if (!alive()) return; pf('e.', 's4', 1, 0.9); pf('e.', 'r4', 1, 0.7, 0.6); ringOnly(4); await wait(0.9); if (!alive()) return; tr.set('e.ticks', 1, 0.8); await wait(1.0); }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'A drawing may show how points lie, not lengths: AB = CD needs reasons', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'It could: the drawing is accurate enough', ok: false, id: 'e.why.look', mc: MC.appearance as string | undefined },
      { t: 'It could: it is what we are proving, so it is true anyway', ok: false, id: 'e.why.circ', mc: MC.circular as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why not write AB = CD in line 1, since they look equal?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch a proof being built'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: the Vertical Angles Theorem =====================
const T_THETA = 62;
function tFig(theta: number, swing: boolean): Fig {
  const X = crossing(theta, -8, ['A', 'B', 'C', 'D', 'E'], swing ? { texts: { 1: `${theta}°`, 3: `${theta}°` }, cols: { 1: 'link', 3: 'link' } } : {});
  X.fig.points = [];
  X.fig.angles = X.fig.angles.filter(a => a.id !== 'a4').filter(a => !swing || a.id !== 'a2').map(a => (swing ? a : { ...a, nameOnly: false, r: 78 }));
  return X.fig;
}
function partTurn(): void {
  tr.reset('t.');
  let r3 = '';
  const rowsOf = () => [
    { st: 'm\\angle 1 + m\\angle 2 = 180^\\circ', rs: RS.linPair },
    { st: 'm\\angle 2 + m\\angle 3 = 180^\\circ', rs: RS.linPair },
    { st: 'm\\angle 1 + m\\angle 2 = m\\angle 2 + m\\angle 3', rs: r3 },
    { st: 'm\\angle 1 = m\\angle 3', rs: RS.subP },
    { st: '\\angle 1 \\cong \\angle 3', rs: RS.defCongAng },
  ];
  let P = ProofFrame({ given: ['\\angle 1, \\angle 2\\text{ and }\\angle 2, \\angle 3\\text{ are linear pairs}'], prove: '\\angle 1 \\cong \\angle 3', rows: rowsOf() }, RIGHT_FR, th);
  const rebuild = () => { P = ProofFrame({ given: ['\\angle 1, \\angle 2\\text{ and }\\angle 2, \\angle 3\\text{ are linear pairs}'], prove: '\\angle 1 \\cong \\angle 3', rows: rowsOf() }, RIGHT_FR, th); };
  const fig = tFig(T_THETA, false);
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_LESSON, K('t.sheet'));
      const sw = K('t.swing');
      if (sw > 0) { const t = Math.round(T_THETA + 56 * (1 - Math.cos(sw * Math.PI * 2)) / 2); drawFig(c, tFig(t, true), FR_LESSON, {}); }
      else {
        const k1 = K('t.p1'), k2 = K('t.p2'), take = K('t.take'), arcs = K('t.arcs');
        const look: Look = { k: K('t.fig'), col: { a1: k1 > 0.5 || arcs > 0.5 ? (arcs > 0.5 ? 'link' : 'first') : 'plain', a2: k1 > 0.5 && k2 < 0.5 ? 'first' : k2 > 0.5 ? 'second' : 'plain', a3: k2 > 0.5 || arcs > 0.5 ? (arcs > 0.5 ? 'link' : 'second') : 'plain' }, marks: { a2: 1 - 0.7 * take }, glow: { a1: arcs, a3: arcs } };
        drawFig(c, fig, FR_LESSON, look);
      }
      P.draw(c, steps('t.'), { ask: [{ i: 2, cell: 'rs' }, { i: 3, cell: 'st' }, { i: 4, cell: 'rs' }], rings: [2, 3, 4].map(i => ({ i, col: 'pick' as Paint, k: K(`t.ring${i}`) })) });
    },
  });
  tr.set('t.sheet', 1, 0.5); tr.set('t.fig', 1, 0.8, 0.2); pf('t.', 'frame', 1, 0.8, 0.4);
  ['s0', 'r0'].forEach((s, j) => pf('t.', s, 1, 0.8, 1.2 + j * 0.3)); tr.set('t.p1', 1, 0.6, 1.2);
  ['s1', 'r1'].forEach((s, j) => pf('t.', s, 1, 0.8, 2.4 + j * 0.3)); tr.set('t.p2', 1, 0.6, 2.4);
  pf('t.', 's2', 1, 0.8, 3.4); pf('t.', 's4', 1, 0.8, 3.6); pf('t.', 'r3', 1, 0.8, 3.8);
  let step = 0;
  const STEPS = [
    { t: 'Lines 1 and 2', why: 'Done for you: two linear pairs.' },
    { t: 'Line 3: the reason', why: 'Your step.' },
    { t: 'Line 4: the statement', why: 'Your step.' },
    { t: 'Line 5: the reason', why: 'Your step.' },
    { t: 'What it is now', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: vertical angles'), voiced('t.intro'), plan, work);
  seq(async alive => { await wait(5.5); if (!alive()) return; step = 1; drawPlan(); askR3(); });
  const ring = (i: number) => [2, 3, 4].forEach(j => tr.set(`t.ring${j}`, j === i ? 1 : 0, 0.5));
  function askR3(): void {
    ring(2);
    const pick3 = (t: string) => { r3 = t; rebuild(); };
    work.replaceChildren(voiced('t.r3'), ask('turn', 'turn.r3', 'Reason for m∠1 + m∠2 = m∠2 + m∠3', [
      { t: RS.vert, ok: false, id: 't.r3.circ', mc: MC.circular },
      { t: RS.subst, ok: true, id: 't.r3.ok' },
      { t: RS.addP, ok: false, id: 't.r3.add' },
    ], () => seq(async alive => { pick3(RS.subst); pf('t.', 'r2', 1, 0.7); await wait(1.8); if (!alive()) return; step = 2; drawPlan(); askS4(); })));
  }
  function askS4(): void {
    ring(3);
    work.replaceChildren(voiced('t.s4'), ask('turn', 'turn.s4', 'Statement by the Subtraction Property (take m∠2 from both sides)', [
      { t: '∠1 = ∠3', ok: false, id: 't.s4.fig', mc: MC.figMeasure },
      { t: 'm∠1 + m∠2 = m∠3', ok: false, id: 't.s4.side', mc: MC.oneSide },
      { t: 'm∠1 = m∠3', ok: true, id: 't.s4.ok' },
    ], () => seq(async alive => { tr.set('t.take', 1, 0.8); pf('t.', 's3', 1, 0.8, 0.4); await wait(2.0); if (!alive()) return; step = 3; drawPlan(); askR5(); })));
  }
  function askR5(): void {
    ring(4);
    work.replaceChildren(voiced('t.r5'), ask('turn', 'turn.r5', 'Reason for ∠1 ≅ ∠3 from m∠1 = m∠3', [
      { t: RS.defCongAng, ok: true, id: 't.r5.ok' },
      { t: RS.vert, ok: false, id: 't.r5.circ', mc: MC.circular },
      { t: RS.linPair, ok: false, id: 't.r5.lp', mc: MC.wrongPair },
    ], () => seq(async alive => { pf('t.', 'r4', 1, 0.7); tr.set('t.arcs', 1, 0.8, 0.3); ring(-1); await wait(2.0); if (!alive()) return; step = 4; drawPlan(); askStatus(); })));
  }
  function askStatus(): void {
    work.replaceChildren(voiced('t.status'), ask('turn', 'turn.status', 'Vertical angles are congruent: what is it now?', [
      { t: 'A conjecture', ok: false, id: 't.status.conj', mc: MC.examples },
      { t: 'A postulate', ok: false, id: 't.status.post', mc: 'mc.geometric-proof.postulate-theorem-status-confused' },
      { t: 'A theorem', ok: true, id: 't.status.ok' },
    ], () => seq(async alive => {
      step = 5; drawPlan();
      tr.set('t.swing', 1, 6.0); await wait(1.0); if (!alive()) return;
      work.append(callback());
      await wait(5.2); if (!alive()) return;
      tr.jump('t.swing', 0);
    })));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.cb : 'q.cb.none', 'p', '', cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : ''), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: the Alternate Interior Angles Theorem =====================
const P_THETA = 64;
const P_LINES = [
  { st: 'ℓ ∥ m', tex: '\\ell \\parallel m', rs: RS.given, uses: [] as number[] },
  { st: 'm∠2 = m∠6', tex: 'm\\angle 2 = m\\angle 6', rs: RS.corr, uses: [1] },
  { st: 'm∠3 = m∠2', tex: 'm\\angle 3 = m\\angle 2', rs: RS.vert, uses: [] as number[] },
  { st: 'm∠3 = m∠6', tex: 'm\\angle 3 = m\\angle 6', rs: RS.trans, uses: [2, 3], also: [RS.subst] },
];
const P_DECOYS = [
  { st: '∠3 and ∠6 are vertical angles', why: 'they are at different crossings; vertical angles share a vertex.', mc: MC.wrongPair },
  { st: 'm∠3 + m∠6 = 180°', why: 'nothing above gives a sum of 180°, and with ℓ ∥ m these angles turn out equal.', mc: 'mc.angles.congruent-pair-treated-as-supplementary' },
];
const P_MENU = [
  { t: RS.given }, { t: RS.corr }, { t: RS.vert }, { t: RS.trans }, { t: RS.subst },
  { t: RS.altInt, mc: MC.circular, why: 'That is the theorem being proved: it cannot be a reason in its own proof.' },
  { t: RS.linPair, mc: MC.wrongPair, why: 'A linear pair gives a sum of 180°; this line says two angles are equal.' },
];
function pFig(theta: number, swing: boolean): Fig {
  return transversal({ theta, marks: true, numbers: !swing, only: swing ? [3, 6] : undefined, texts: swing ? { 3: `${slotMeasure(3, theta)}°`, 6: `${slotMeasure(6, theta)}°` } : { 3: '3', 6: '6' }, cols: { 3: 'pick', 6: 'pick' }, turn: 0, W: 300 });
}
function partProve(): void {
  tr.reset('p.');
  const placed: number[] = [], reasons: string[] = [];
  const RESERVE = P_LINES.map(l => l.tex);
  let P = ProofFrame({ given: ['\\ell \\parallel m'], prove: 'm\\angle 3 = m\\angle 6', rows: P_LINES.map(() => ({ st: '', rs: '' })), reserve: RESERVE, reserveRs: P_MENU.map(m => m.t) }, RIGHT_FR, th);
  const rebuild = () => { P = ProofFrame({ given: ['\\ell \\parallel m'], prove: 'm\\angle 3 = m\\angle 6', rows: P_LINES.map((_, k) => ({ st: placed[k] ? P_LINES[placed[k]! - 1]!.tex : '', rs: reasons[k] ?? '' })), reserve: RESERVE, reserveRs: P_MENU.map(m => m.t) }, RIGHT_FR, th); };
  const fig = pFig(P_THETA, false);
  const glowOf = (n: number): Record<string, number> => ({ a2: K(`p.g2`) * (n ? 1 : 0), a6: K('p.g6'), a3: K('p.g3') });
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_LESSON, K('p.sheet'));
      const sw = K('p.swing');
      if (sw > 0) { const t = Math.round(P_THETA + 52 * (1 - Math.cos(sw * Math.PI * 2)) / 2); drawFig(c, pFig(t, true), FR_LESSON, { glow: { a3: 0.6, a6: 0.6 }, col: { a3: 'link', a6: 'link' } }); }
      else drawFig(c, fig, FR_LESSON, { k: K('p.fig'), glow: glowOf(1), col: K('p.done') > 0.5 ? { a3: 'link', a6: 'link' } : {} });
      P.draw(c, steps('p.'), {});
    },
  });
  tr.set('p.sheet', 1, 0.5); tr.set('p.fig', 1, 0.8, 0.2);
  const host = h('div'), fbHost = h('div');
  const yes = btn('Proved', () => judge(true)), no = btn('Not proved yet', () => judge(false));
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Kai measured alternate interior angles in five drawings: always equal. Proved?', response: right ? 'proved' : 'not proved yet', expected: 'not proved yet', correct: !right, mc: right ? MC.examples : undefined });
    pf('p.', 'frame', 1, 0.8);
    // pool order: fixed per lesson (a seeded shuffle would change between visits)
    const panel = proofPanel({
      lines: P_LINES.map(l => ({ st: l.st, rs: l.rs, uses: l.uses, also: l.also })),
      decoys: P_DECOYS, menu: P_MENU, order: [3, 4, 0, 2, 5, 1],
      say: { order: 'Tap the lines in an order that works (two are decoys).', reasons: 'Now pick the reason for each line, top to bottom.' },
      onPlace(line, pos) {
        placed[pos] = line; rebuild(); pf('p.', `s${pos}`, 1, 0.8);
        if (line === 2) { tr.set('p.g2', 1, 0.5); tr.set('p.g6', 1, 0.5); } else if (line === 3) { tr.set('p.g3', 1, 0.5); tr.set('p.g2', 1, 0.5); } else if (line === 4) { tr.set('p.g3', 1, 0.5); tr.set('p.g6', 1, 0.5); tr.set('p.g2', 0, 0.5); }
        ctx.store.log({ part: 'prove', item: `prove.order${pos + 1}`, prompt: `Line ${pos + 1} of the proof`, response: P_LINES[line - 1]!.st, correct: true });
        placed.length === P_LINES.length && fbHost.replaceChildren(voicedFb('p.order-done', true));
      },
      onReason(pos, _line, reason) {
        reasons[pos] = reason; rebuild(); pf('p.', `r${pos}`, 1, 0.7);
        ctx.store.log({ part: 'prove', item: `prove.reason${pos + 1}`, prompt: `Reason for line ${pos + 1}`, response: reason, correct: true });
        fbHost.replaceChildren();
      },
      onWrong(e) {
        ctx.store.log({ part: 'prove', item: `prove.${e.phase}`, prompt: e.prompt, response: e.response, correct: false, mc: e.mc });
        void ctx.say('p.wrong');
      },
      onDone() {
        seq(async alive => {
          tr.set('p.done', 1, 0.6); await wait(0.6); if (!alive()) return;
          fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
          await wait(1.4); if (!alive()) return;
          tr.set('p.swing', 1, 6.0); await wait(6.1); if (!alive()) return;
          tr.jump('p.swing', 0);
        });
      },
    });
    host.replaceChildren(voiced(right ? 'p.build-test' : 'p.build'), panel.node, fbHost);
  }
  setPanel(h('h2', {}, 'Prove it'), voiced('p.intro'), h('div', { class: 'row' }, yes, no), host);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as GFItem),
  });
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
const fr2box = (f: Frame): Box => box(f.x, f.y, f.x + f.w, f.y + f.h);
function showItem(item: GFItem): Solve {
  tr.reset('x.');
  const p = item.picture ?? {};
  const rv = p.reveal ?? {};
  const draws: ((c: Canvas) => void)[] = [];
  const keysOn: string[] = [];
  const set = (ids: string[] | undefined, key: string): Record<string, number> => Object.fromEntries((ids ?? []).map(id => [id, K(key)]));
  if (p.gallery) {
    const g = p.gallery, frs = galleryFrames(g.figs.length);
    draws.push(c => {
      g.figs.forEach((f, i) => {
        const fr = frs[i]!;
        sheet(c, fr, K('x.fig'), 30 + i);
        if (rv.cell === i) { const b = fr2box(fr), k = K('x.cell'); if (k > 0) { c.g.save(); c.g.globalAlpha *= clamp(k); c.g.strokeStyle = '#C3AEF6'; c.g.lineWidth = 6; c.g.beginPath(); c.g.roundRect(b.x0 - 14, b.y0 - 14, b.w + 28, b.h + 100, 22); c.g.stroke(); c.g.restore(); } }
        drawFig(c, f, fr, { k: K('x.fig') });
        drawWords(c, g.caps[i] ?? '', fr.x + fr.w / 2, fr.y + fr.h + 52, rv.cell === i && K('x.cell') > 0.5 ? 'pick' : 'dim', K('x.fig'), { size: 44, align: 'center' });
      });
    });
    keysOn.push('x.fig');
    return finish(draws, keysOn, async () => { tr.set('x.cell', 1, 0.6); });
  }
  if (p.globe) {
    const gl = p.globe, withCard = !!p.card;
    const G = { paths: gl.paths, tri: gl.tri, cx: withCard ? 520 : 960, cy: 545, R: withCard ? 400 : 430, tilt: 22, spin: gl.tri ? gl.tri / 2 : 0 };
    const card = p.card ? cardPainter(p.card.lines, box(1000, 200, 1840, 880), { size: 50 }) : null;
    draws.push(c => {
      drawGlobe(c, G, { k: K('x.fig'), tri: gl.tri ? 1 : 0, triLabels: gl.tri ? 1 : 0, glow: gl.paths.map((_, i) => ((rv.paths ?? []).includes(i) ? K('x.glow') : 0)) });
      card?.draw(c, K('x.card'));
    });
    keysOn.push('x.fig', 'x.card');
    return finish(draws, keysOn, async () => { tr.set('x.glow', 1, 0.6); });
  }
  const besideFig = !!p.fig && !!(p.proof || p.card || p.cards);
  if (p.fig) {
    const fr = besideFig ? FR_LEFT : FR_WIDE, f = p.fig;
    draws.push(c => {
      sheet(c, fr, K('x.fig'));
      drawFig(c, f, fr, { k: K('x.fig'), solve: K('x.solve'), solved: set(rv.solved, 'x.solved'), glow: set(rv.glow, 'x.glow'), col: K('x.col') > 0.5 ? rv.col : undefined });
    });
    keysOn.push('x.fig');
  }
  if (p.proof) {
    const pr = p.proof;
    // a solve fills only cells that wait as '?' (an answer is never drawn before the student answers)
    const askedRow = new Set((pr.ask ?? []).map(a => a.i));
    const fill = new Map((rv.fill ?? []).filter(x => askedRow.has(x.i)).map(x => [x.i, x]));
    const rows = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
    const fr: Frame = p.fig ? { x: RIGHT_FR.x, y: 60, w: RIGHT_FR.w, h: 960 } : p.card ? { x: 40, y: 60, w: 1100, h: 960 } : { x: 260, y: 60, w: 1400, h: 960 };
    const made = tryBlock(() => ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first }, fr, th));
    if (made.ok) {
      const B = made.value, asked = new Set((pr.ask ?? []).map(a => `${a.cell === 'st' ? 's' : 'r'}${a.i}`));
      const P = progressOf<ProofStep>(s => (s === 'frame' ? K('x.fig') : asked.has(s) ? K('x.fill') : K('x.fig')));
      draws.push(c => B.draw(c, P, {
        ask: pr.ask, rings: [...(pr.ring !== undefined ? [{ i: pr.ring, col: 'pick' as Paint, k: K('x.fig') }] : []), ...(rv.rings ?? []).map(i => ({ i, col: 'link' as Paint, k: K('x.rings') }))],
        strike: [...(pr.strike ?? []).map(i => ({ i, k: K('x.fig') })), ...(rv.strike ?? []).map(i => ({ i, k: K('x.strike') }))],
      }));
    } else console.warn('proof frame failed', made.error);
  }
  if (p.card) {
    const b = p.fig || p.proof ? (p.proof && !p.fig ? box(1170, 80, 1880, 1000) : box(RIGHT_FR.x, 200, RIGHT_FR.x + RIGHT_FR.w, 880)) : box(190, 140, 1730, 940);
    const C = cardPainter([...p.card.lines, ...(rv.lines ?? [])], b, { nFirst: p.card.lines.length, size: p.proof && !p.fig ? 44 : 52, align: p.proof && !p.fig ? 'left' : 'center' });
    if (!C.fits) console.warn('card does not fit', item.family);
    draws.push(c => C.draw(c, K('x.card'), K('x.lines')));
    keysOn.push('x.card');
  }
  if (p.cards) {
    const area = p.fig ? box(RIGHT_FR.x, 80, RIGHT_FR.x + RIGHT_FR.w, 1000) : p.cards.length === 1 ? box(260, 200, 1660, 880) : box(80, 80, 1840, 1000);
    const C = cardsPainter(p.cards, area);
    draws.push(c => C.draw(c, K('x.card')));
    keysOn.push('x.card');
  }
  if (!draws.length) {
    const C = cardPainter([plainOf(item.prompt)], box(190, 140, 1730, 940));
    draws.push(c => C.draw(c, K('x.card')));
    keysOn.push('x.card');
  }
  return finish(draws, keysOn, async alive => {
    tr.set('x.solve', 1, 0.8); tr.set('x.solved', 1, 0.9, 0.2); tr.set('x.glow', 1, 0.6, 0.2); tr.set('x.col', 1, 0.4);
    tr.set('x.fill', 1, 0.9, 0.3); tr.set('x.rings', 1, 0.6, 0.5); tr.set('x.strike', 1, 0.6, 0.6); tr.set('x.lines', 1, 0.9, 0.3);
    void alive;
  });
}
function finish(draws: ((c: Canvas) => void)[], keys: string[], solve: (alive: () => boolean) => Promise<void>): Solve {
  setScene({ model: c => draws.forEach(d => d(c)), lines: [], leads: [], boardBox: null });
  keys.forEach((k, i) => tr.set(k, 1, 0.7, 0.1 + 0.2 * i));
  return { solve };
}
void (null as unknown as Pt);

void runLesson({
  slug: SLUG,
  warm: ['AM = MB \\ AC = BD \\ AB + BC = BC + CD \\ m\\angle 1 + m\\angle 2 = 180^\\circ \\ \\angle 1 \\cong \\angle 3 \\ \\ell \\parallel m \\ \\overline{AB} \\ \\overrightarrow{BD} \\ \\text{Given Prove only the drawing in order on a line are linear pairs}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
