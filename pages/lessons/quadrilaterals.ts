// quadrilaterals.ts: "Parallelograms and other quadrilaterals" (Geometry, lesson 8) on the shared runtime.
//   1 The question   a framer measures both diagonals of a picture frame (34 in. each): is it a rectangle? yes / not
//                    until it is a parallelogram / only the four corners can tell
//   2 Worked example one parallelogram, three moves: its sides and angles, the diagonals bisect each other, corners
//                    pushed to 90° (a rectangle: congruent diagonals), sides made equal (a rhombus: perpendicular
//                    diagonals); the numbers are measured live. Why does the rectangle still bisect? (inheritance)
//   3 Your turn      a rhombus with m∠DAB = 64°: m∠ABC worked, then m∠DAC and m∠ABD typed
//   4 Prove it       a parallelogram with congruent diagonals is a rectangle (Parsons with two decoys, then reasons);
//                    back to the frame: the rectangle slides into an isosceles trapezoid with the same 34 in. diagonals;
//                    what the framer must add. Callback to part 1.
//   5 Practice       all 41 sub-goals one after another, then mixed (runtime/practice.ts)
// Reused read-only: geometry-foundations geo.ts + GeoFig.ts, ProofFrame.ts + proofPanel.ts, Card.ts;
// triangle-congruence tri.ts; conditional-statements Euler.ts (rectangles and rhombuses).
import type { Canvas } from '../../src/core/draw';
import { box, type Box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import type { Paint } from '../../src/core/theme';
import { th, setScene, seq, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { tryBlock } from '../../src/blocks/block';
import { drawWords } from '../../src/lesson/words';
import { slate } from '../../src/lesson/annotate';
import { type Fig, type Fit, type Frame, type Pt, FR_LEFT, FR_LESSON, FR_RIGHT, FR_WIDE, dist, fitFig, galleryFrames, lerpP, measure, sub, toScreen } from '../../src/lesson/topics/geometry-foundations/geo';
import { drawFig, label, sheet } from '../../src/lesson/topics/geometry-foundations/GeoFig';
import { ProofFrame, type ProofStep } from '../../src/lesson/topics/geometry-foundations/ProofFrame';
import { proofPanel } from '../../src/lesson/topics/geometry-foundations/proofPanel';
import { cardPainter, cardsPainter } from '../../src/lesson/topics/geometry-foundations/Card';
import { Euler, type EulerStep } from '../../src/lesson/topics/conditional-statements/Euler';
import { PRACTICE_FRAME } from '../../src/lesson/topics/conditional-statements/eulerLayout';
import { type Q4, diagMeet, paraPts, par, qfig, trapPts } from '../../src/lesson/topics/quadrilaterals/quad';
import { MC, albl, box as boxM, tick } from '../../src/lesson/topics/quadrilaterals/qkit';
import { RS } from '../../src/lesson/topics/quadrilaterals/qProofs';
import { treeLayout, drawTree } from '../../src/lesson/topics/quadrilaterals/Tree';
import { FAMILY_NAMES, GENERATORS, type QItem } from '../../src/lesson/topics/quadrilaterals/items';
import { PLAN } from '../../src/lesson/topics/quadrilaterals/plan';
import { explain } from '../../src/lesson/topics/quadrilaterals/explain';
import { SCRIPT } from '../../src/lesson/topics/quadrilaterals/script';
import LINES from './quadrilaterals/voice/lines.json';

const SLUG = 'quadrilaterals';
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
const ov = (s: string) => [...s].map(ch => ch + '̅').join('');
const RIGHT_FR: Frame = { x: FR_RIGHT.x, y: FR_RIGHT.y, w: FR_RIGHT.w, h: FR_RIGHT.h };
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** a one-shot choice question in the panel: logs, gives feedback, runs `after` on the right one */
function ask(part: 'turn' | 'prove' | 'example', item: string, prompt: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], after: () => void): HTMLElement {
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
/** a readout slate on the right: lines of words (live numbers) */
function readout(c: Canvas, b: Box, lines: { t: string; col: Paint; k: number }[], k: number): void {
  if (k <= 0) return;
  slate(c, b, k);
  lines.forEach((l, i) => { if (l.k > 0) label(c, l.t, [b.cx, b.y0 + 90 + i * 96], 56, l.col, k * l.k); });
}

// ===================== the frame (parts 1 and 4): a rectangle that slides into an isosceles trapezoid =====================
const IN = 13;   // model units per inch
const FW = 30, FH = 16;   // 30 × 16 in.: diagonals 34 in.
/** u = 0: the 30 × 16 rectangle; u = 1: an isosceles trapezoid with bases 37.5 and 16.5 in., diagonals still 34 in. */
function frameQ(u: number): Q4 {
  const a = FW * (1 + 0.25 * u), c = FW * (1 - 0.45 * u), hgt = Math.sqrt(34 * 34 - ((a + c) / 2) ** 2);
  return trapPts(a * IN, c * IN, ((a - c) / 2) * IN, hgt * IN);
}
const FRAME_FR: Frame = { x: 100, y: 80, w: 1100, h: 920 };
const FRAME_FIT: Fit = (() => { const P = [...frameQ(0), ...frameQ(1)]; return fitFig({ segs: P.map(p => ({ a: p, b: p })), angles: [], points: [], pad: 110, maxS: 3 }, FRAME_FR); })();
const READ_BOX = box(1260, 180, 1840, 700);
function frameScene(p: string): (c: Canvas) => void {
  return c => {
    const u = K(p + 'morph');
    const Q = frameQ(u);
    sheet(c, FRAME_FR, K(p + 'sheet'));
    const f = qfig(Q, [], { diags: 'whole', segStyle: { AC: { col: 'second' }, BD: { col: 'second' } } });
    drawFig(c, f, FRAME_FR, { k: K(p + 'fig'), letters: K(p + 'letters') }, FRAME_FIT);
    // the two tape measures: "34 in." beside each diagonal, a third of the way along
    const kd = K(p + 'diag');
    for (const [a, b, side] of [[Q[0], Q[2], 1], [Q[1], Q[3], -1]] as [Pt, Pt, number][]) {
      const P = toScreen(FRAME_FIT, lerpP(a, b, 0.24)), Q2 = toScreen(FRAME_FIT, lerpP(a, b, 0.3));
      const d = sub(Q2, P), L = Math.hypot(d[0], d[1]) || 1, n: Pt = [(-d[1] / L) * side, (d[0] / L) * side];
      label(c, '34 in.', [P[0] + n[0] * 52, P[1] + n[1] * 52], 56, 'second', kd);
    }
    const sides = [0, 1, 2, 3].map(i => dist(Q[i]!, Q[(i + 1) % 4]!) / IN), ang = measure(Q[0], Q[3], Q[1]);
    readout(c, READ_BOX, [
      { t: `AC = ${(dist(Q[0], Q[2]) / IN).toFixed(1)} in.`, col: 'second', k: 1 },
      { t: `BD = ${(dist(Q[1], Q[3]) / IN).toFixed(1)} in.`, col: 'second', k: 1 },
      { t: `AB = ${sides[0]!.toFixed(1)}, DC = ${sides[2]!.toFixed(1)}`, col: u > 0.05 ? 'wrong' : 'ink', k: K(p + 'sides') },
      { t: `m∠DAB = ${Math.round(ang)}°`, col: u > 0.05 ? 'wrong' : 'ink', k: K(p + 'angle') },
    ], K(p + 'read'));
  };
}

// ===================== 1. The question =====================
const CARDS = [
  { name: 'Yes', t: 'equal diagonals make a rectangle', mc: MC.necAsSuff as string | undefined, cb: 'q.cb.yes', right: false },
  { name: 'Not yet', t: 'it must also be a parallelogram; then equal diagonals make it a rectangle', mc: undefined as string | undefined, cb: 'q.cb.para', right: true },
  { name: 'No', t: 'only measuring all four corners can tell', mc: MC.unmarkedFalse as string | undefined, cb: 'q.cb.corners', right: false },
];
function partQuestion(): void {
  tr.reset('q.');
  setScene({ boardBox: null, lines: [], leads: [], model: frameScene('q.') });
  tr.set('q.sheet', 1, 0.6); tr.set('q.fig', 1, 0.9, 0.3); tr.set('q.letters', 1, 0.6, 0.8); tr.set('q.diag', 1, 0.8, 1.0); tr.set('q.read', 1, 0.7, 1.4);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A frame has two diagonals of 34 in. each. Is it a rectangle?', response: `${c.name}: ${c.t}`, expected: 'Not yet', correct: c.right, mc: c.mc, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'Is the frame a rectangle?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: one parallelogram, three moves =====================
const CM = 34;   // model units per cm
const PARA0 = { a: 10, b: 6, th: 62 }, RECT0 = { a: 10, b: 6, th: 90 }, RHOMB0 = { a: 8, b: 8, th: 60 };
type PS = typeof PARA0;
const mixS = (x: PS, y: PS, u: number): PS => ({ a: x.a + (y.a - x.a) * u, b: x.b + (y.b - x.b) * u, th: x.th + (y.th - x.th) * u });
const EX_FR: Frame = { x: 80, y: 80, w: 1120, h: 920 };
const EX_FIT: Fit = (() => { const P = [PARA0, RECT0, RHOMB0, mixS(RECT0, RHOMB0, 0.5)].flatMap(s => paraPts(s.a * CM, s.b * CM, s.th)); return fitFig({ segs: P.map(p => ({ a: p, b: p })), angles: [], points: [], pad: 120, maxS: 3 }, EX_FR); })();
function exState(): PS {
  const m1 = K('e.rect'), m2 = K('e.rhomb');
  return m2 > 0 ? mixS(RECT0, RHOMB0, m2) : mixS(PARA0, RECT0, m1);
}
function exFig(s: PS, diags: boolean): Fig {
  const Q = paraPts(s.a * CM, s.b * CM, s.th);
  const right = s.th === 90, rhomb = s.a === s.b;
  const marks = [par('AB', 1), par('DC', 1), par('AD', 2), par('BC', 2)];
  if (right) marks.push(boxM('DAB'), boxM('ABC'), boxM('BCD'), boxM('CDA'));
  if (rhomb) marks.push(tick('AB', 1), tick('BC', 1), tick('DC', 1), tick('AD', 1));
  if (diags) {
    // the halves: E is the midpoint of each diagonal (in a rectangle all four halves match)
    const t1 = rhomb ? 2 : 1, t2 = rhomb ? 3 : right ? 1 : 2;
    marks.push(tick('AE', t1), tick('EC', t1), tick('BE', t2), tick('ED', t2));
    if (rhomb) marks.push(boxM('AEB'));
  }
  return qfig(Q, marks, { diags: diags ? 'halves' : undefined, segStyle: diags ? { AE: { col: 'second' }, EC: { col: 'second' }, BE: { col: 'first' }, ED: { col: 'first' } } : {} });
}
function partExample(): void {
  tr.reset('e.');
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      const s = exState(), kd = K('e.diag');
      sheet(c, EX_FR, K('e.sheet'));
      const m1 = K('e.rect'), m2 = K('e.rhomb');
      // marks only on a settled shape (a moving shape is unmarked: its marks would not be true yet)
      const exact = m2 === 1 ? RHOMB0 : m2 === 0 && m1 === 1 ? RECT0 : m2 === 0 && m1 === 0 ? PARA0 : null;
      const f = exact ? exFig(exact, kd > 0.5) : qfig(paraPts(s.a * CM, s.b * CM, s.th), [], { diags: kd > 0.5 ? 'halves' : undefined });
      drawFig(c, f, EX_FR, { k: K('e.fig') }, EX_FIT);
      const Q = paraPts(s.a * CM, s.b * CM, s.th), E = diagMeet(Q);
      const cm = (x: number) => (x / CM).toFixed(1);
      readout(c, box(1250, 120, 1850, 880), [
        { t: `AB = ${cm(dist(Q[0], Q[1]))}, CD = ${cm(dist(Q[2], Q[3]))}`, col: 'ink', k: K('e.r0') },
        { t: `m∠A = ${Math.round(measure(Q[0], Q[3], Q[1]))}°, m∠C = ${Math.round(measure(Q[2], Q[1], Q[3]))}°`, col: 'ink', k: K('e.r0') },
        { t: `AE = ${cm(dist(Q[0], E))}, EC = ${cm(dist(E, Q[2]))}`, col: 'second', k: K('e.r1') },
        { t: `BE = ${cm(dist(Q[1], E))}, ED = ${cm(dist(E, Q[3]))}`, col: 'first', k: K('e.r1') },
        { t: `AC = ${cm(dist(Q[0], Q[2]))}, BD = ${cm(dist(Q[1], Q[3]))}`, col: K('e.rect') > 0.99 && K('e.rhomb') < 0.01 ? 'link' : 'ink', k: K('e.r2') },
        { t: `m∠AEB = ${Math.round(measure(E, Q[0], Q[1]))}°`, col: K('e.rhomb') > 0.99 ? 'link' : 'ink', k: K('e.r3') },
      ], K('e.read'));
    },
  });
  tr.set('e.sheet', 1, 0.5); tr.set('e.fig', 1, 0.8, 0.2); tr.set('e.read', 1, 0.6, 0.6);
  let step = 0;
  const STEPS = [
    { t: 'A parallelogram', why: 'Sides and angles.', act: 'Measure' },
    { t: 'Its diagonals', why: 'Where do they meet?', act: 'Draw' },
    { t: 'Right corners: a rectangle', why: 'What changes?', act: 'Push' },
    { t: 'Equal sides: a rhombus', why: 'And now?', act: 'Squeeze' },
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
      if (i === 0) { tr.set('e.r0', 1, 0.8); await wait(1.2); }
      else if (i === 1) { tr.set('e.diag', 1, 0.6); await wait(0.6); if (!alive()) return; tr.set('e.r1', 1, 0.8); await wait(1.2); }
      else if (i === 2) { tr.set('e.r2', 1, 0.6); tr.set('e.rect', 1, 2.2, 0.4); await wait(2.9); }
      else { tr.set('e.r3', 1, 0.6); tr.set('e.rhomb', 1, 2.4, 0.4); await wait(3.1); }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    after.replaceChildren(voiced('e.why', 'div', 'label'), ask('example', 'example.why', 'Why do the rectangle\'s diagonals still bisect each other?', [
      { t: 'because its diagonals are congruent', ok: false, id: 'e.why.cong', mc: MC.diagWords },
      { t: 'every rectangle is a parallelogram, and parallelogram diagonals bisect each other', ok: true, id: 'e.why.ok' },
      { t: 'it looks symmetric', ok: false, id: 'e.why.look', mc: MC.appearance },
    ], () => after.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')))));
  }
  drawPlan();
  setPanel(h('h2', {}, 'One parallelogram, three moves'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: a rhombus =====================
const T_Q = paraPts(400, 400, 64);
const T_FIG: Fig = (() => {
  const f = qfig(T_Q, [tick('AB', 1), tick('BC', 1), tick('DC', 1), tick('AD', 1), albl('DAB', '64°'), albl('ABC', '?'), albl('CAD', '?'), albl('ABD', '?')], { diags: 'whole' });
  const alt: Record<string, string> = { ABC: '116°', CAD: '32°', ABD: '58°' };
  // the whole angles sit on a wide arc with their label near one side, clear of the diagonal that halves them
  const lab: Record<string, { r: number; lab: number }> = { DAB: { r: 150, lab: 0.14 }, ABC: { r: 130, lab: 0.14 } };
  f.angles = f.angles.map(a => ({ ...a, ...(alt[a.id] ? { alt: alt[a.id] } : {}), ...(lab[a.id] ?? {}) }));
  return f;
})();
function partTurn(): void {
  tr.reset('t.');
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_WIDE, K('t.sheet'));
      drawFig(c, T_FIG, FR_WIDE, {
        k: K('t.fig'),
        labels: { ABC: K('t.abcl'), CAD: K('t.dacl'), ABD: K('t.abdl') }, marks: { ABC: K('t.abcl'), CAD: K('t.dacl'), ABD: K('t.abdl') },
        solved: { ABC: K('t.abc'), CAD: K('t.dac'), ABD: K('t.abd') },
        glow: { ABC: K('t.abcg') * (1 - K('t.abc')), CAD: K('t.dacg') * (1 - K('t.dac')), ABD: K('t.abdg') * (1 - K('t.abd')) },
      });
    },
  });
  tr.set('t.sheet', 1, 0.5); tr.set('t.fig', 1, 0.8, 0.2);
  const work = h('div');
  seq(async alive => {
    await wait(1.2); if (!alive()) return;
    tr.set('t.abcl', 1, 0.5); tr.set('t.abcg', 1, 0.6); await wait(0.9); if (!alive()) return;
    tr.set('t.abc', 1, 0.9);
    work.replaceChildren(voiced('t.abc'));
    await wait(1.4); if (!alive()) return;
    askDAC();
  });
  function numAsk(id: string, item: string, prompt: string, right: number, wrongs: { v: number; id: string; mc?: string }[], other: string, onRight: () => void): HTMLElement {
    const fbHost = h('div'), inp = numInput('°', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) return;
      const w = wrongs.find(x => Math.abs(x.v - r.v) < 1e-9);
      const good = Math.abs(r.v - right) < 1e-9;
      ctx.store.log({ part: 'turn', item, prompt, response: r.v, expected: right, correct: good, mc: good ? undefined : w?.mc });
      if (!good) { fbHost.replaceChildren(voicedFb(w?.id ?? other, false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb(`${id}.ok`, true));
      onRight();
    }
    const d = h('div', {}, voiced(`${id}.ask`), inp.node, h('div', { class: 'row' }, ok), fbHost);
    setTimeout(() => inp.focus(), 50);
    return d;
  }
  function askDAC(): void {
    tr.set('t.dacl', 1, 0.5); tr.set('t.dacg', 1, 0.6);
    work.append(numAsk('t.dac', 'turn.dac', 'ABCD is a rhombus with m∠DAB = 64°. What is m∠DAC?', 32, [
      { v: 64, id: 't.dac.whole', mc: MC.wholeHalf }, { v: 58, id: 't.dac.cross', mc: MC.vertexCross }, { v: 116, id: 't.dac.whole', mc: MC.swapAng },
    ], 't.dac.other', () => { tr.set('t.dac', 1, 0.9); seq(async alive => { await wait(1.6); if (alive()) askABD(); }); }));
  }
  function askABD(): void {
    tr.set('t.abdl', 1, 0.5); tr.set('t.abdg', 1, 0.6);
    work.append(numAsk('t.abd', 'turn.abd', 'What is m∠ABD?', 58, [
      { v: 32, id: 't.abd.a', mc: MC.vertexCross }, { v: 116, id: 't.abd.whole', mc: MC.wholeHalf }, { v: 64, id: 't.abd.a', mc: MC.swapAng },
    ], 't.abd.other', () => {
      tr.set('t.abd', 1, 0.9);
      seq(async alive => { await wait(1.6); if (!alive()) return; work.append(voiced('t.done'), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go'))); ctx.panel.scrollTop = ctx.panel.scrollHeight; });
    }));
    ctx.panel.scrollTop = ctx.panel.scrollHeight;
  }
  setPanel(h('h2', {}, 'Your turn: a rhombus'), voiced('t.intro'), work);
}

// ===================== 4. Prove it: a parallelogram with congruent diagonals is a rectangle =====================
const P_Q = paraPts(430, 250, 90);
const P_FIG: Fig = qfig(P_Q, [par('AB', 1), par('DC', 1), par('AD', 2), par('BC', 2)], { diags: 'whole', segStyle: { AC: { col: 'second' }, BD: { col: 'second' } } });
const cgT = (a: string, b: string) => `\\overline{${a}} \\cong \\overline{${b}}`;
const P_LINES = [
  { st: `${ov('AB')} ≅ ${ov('DC')}`, tex: cgT('AB', 'DC'), rs: RS.oppSides, uses: [] as number[] },
  { st: `${ov('BC')} ≅ ${ov('CB')}`, tex: cgT('BC', 'CB'), rs: RS.refl, uses: [] as number[] },
  { st: '△ABC ≅ △DCB', tex: '\\triangle ABC \\cong \\triangle DCB', rs: RS.SSS, uses: [1, 2] },
  { st: '∠ABC ≅ ∠DCB', tex: '\\angle ABC \\cong \\angle DCB', rs: RS.cpctc, uses: [3] },
  { st: 'm∠ABC = 90°', tex: 'm\\angle ABC = 90^\\circ', rs: RS.consSupp, uses: [4] },
  { st: 'ABCD is a rectangle', tex: 'ABCD \\text{ is a rectangle}', rs: RS.rectTest, uses: [5] },
];
const P_DECOYS = [
  { st: `${ov('AC')} ⊥ ${ov('DB')}`, why: 'congruent diagonals need not be perpendicular; nothing marks a right angle at their crossing.', mc: MC.congPerp },
  { st: 'm∠ABC = 90° (Given)', why: 'the right angle is what the proof must reach; it is not given.', mc: MC.circular },
];
const P_MENU = [
  { t: RS.given }, { t: RS.oppSides }, { t: RS.refl }, { t: RS.SSS }, { t: RS.cpctc }, { t: RS.consSupp }, { t: RS.rectTest },
  { t: RS.SAS, mc: MC.beforeEst, why: 'No angle pair is known yet: the three pairs are sides.' },
  { t: RS.diagCongRect, mc: MC.converse, why: 'That theorem goes the other way: from a rectangle to congruent diagonals.' },
];
function partProve(): void {
  tr.reset('p.');
  const placed: number[] = [], reasons: string[] = [];
  const make = () => ProofFrame({ given: ['ABCD \\text{ is a parallelogram}', cgT('AC', 'DB')], prove: 'ABCD \\text{ is a rectangle}', rows: P_LINES.map((_, k) => ({ st: placed[k] ? P_LINES[placed[k]! - 1]!.tex : '', rs: reasons[k] ?? '' })), reserve: P_LINES.map(l => l.tex), reserveRs: P_MENU.map(m => m.t) }, RIGHT_FR, th);
  let P = make();
  const frame = frameScene('p.');
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      const fw = K('p.frame');
      if (fw < 1) {
        const a = 1 - fw;
        sheet(c, FR_LESSON, K('p.sheet') * a);
        const gl = (k: string) => K(`p.${k}`) * (1 - K(`p.${k}off`));
        drawFig(c, P_FIG, FR_LESSON, { k: K('p.fig') * a, glow: { AB: gl('g1'), DC: gl('g1'), BC: gl('g2'), AC: gl('g3'), BD: gl('g3') } });
        c.g.save(); c.g.globalAlpha *= a; P.draw(c, progressOf<ProofStep>(s => tr.k(`p.pf.${s}`)), {}); c.g.restore();
      }
      if (fw > 0) { c.g.save(); c.g.globalAlpha *= fw; frame(c); c.g.restore(); }
    },
  });
  tr.set('p.sheet', 1, 0.5); tr.set('p.fig', 1, 0.8, 0.2); tr.set('p.pf.frame', 1, 0.8, 0.5);
  const host = h('div'), fbHost = h('div'), nextHost = h('div');
  const panel = proofPanel({
    lines: P_LINES.map(l => ({ st: l.st, rs: l.rs, uses: l.uses })),
    decoys: P_DECOYS, menu: P_MENU, order: [5, 7, 2, 0, 4, 6, 1, 3],
    say: { order: 'Tap the lines in an order that works (two are decoys).', reasons: 'Now pick the reason for each line, top to bottom.' },
    onPlace(line, pos) {
      placed[pos] = line; P = make(); tr.set(`p.pf.s${pos}`, 1, 0.8);
      for (const k of ['g1', 'g2', 'g3']) if (K(`p.${k}`) > 0) tr.set(`p.${k}off`, 1, 0.4);
      if (line <= 3) tr.set(`p.g${line}`, 1, 0.5);
      ctx.store.log({ part: 'prove', item: `prove.order${pos + 1}`, prompt: `Line ${pos + 1} of the proof`, response: P_LINES[line - 1]!.st, correct: true });
    },
    onReason(pos, _line, reason) {
      reasons[pos] = reason; P = make(); tr.set(`p.pf.r${pos}`, 1, 0.7);
      ctx.store.log({ part: 'prove', item: `prove.reason${pos + 1}`, prompt: `Reason for line ${pos + 1}`, response: reason, correct: true });
      fbHost.replaceChildren();
    },
    onWrong(e) {
      ctx.store.log({ part: 'prove', item: `prove.${e.phase}`, prompt: e.prompt, response: e.response, correct: false, mc: e.mc });
      void ctx.say('p.wrong');
    },
    onDone() {
      seq(async alive => {
        fbHost.replaceChildren(voicedFb('p.proved', true));
        await wait(1.8); if (!alive()) return;
        tr.set('p.frame', 1, 1.0); tr.set('p.fig', 1, 0.1); tr.set('p.sheet', 1, 0.1); tr.set('p.letters', 1, 0.1); tr.set('p.diag', 1, 0.6, 0.8); tr.set('p.read', 1, 0.6, 1.0); tr.set('p.sides', 1, 0.6, 1.2); tr.set('p.angle', 1, 0.6, 1.2);
        await wait(2.0); if (!alive()) return;
        tr.set('p.morph', 1, 2.6);
        host.replaceChildren(nextHost);
        nextHost.replaceChildren(voiced('p.frame'));
        await wait(3.0); if (!alive()) return;
        nextHost.append(voiced('p.next', 'div', 'label'), ask('prove', 'prove.check', 'What should the framer add to her check?', [
          { t: 'measure the diagonals again, more carefully', ok: false, id: 'p.next.again', mc: MC.examples },
          { t: 'check that both pairs of opposite sides are equal', ok: true, id: 'p.next.ok' },
          { t: 'look at it: it is close enough to a rectangle', ok: false, id: 'p.next.look', mc: MC.appearance },
        ], () => seq(async alive2 => {
          tr.set('p.morph', 0, 2.2); await wait(2.6); if (!alive2()) return;
          nextHost.append(voicedFb('p.done', true)); await wait(4.0); if (!alive2()) return;
          nextHost.append(callback()); ctx.panel.scrollTop = ctx.panel.scrollHeight;
        })));
        ctx.panel.scrollTop = ctx.panel.scrollHeight;
      });
    },
  });
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.cb : 'q.cb.para', 'p', '', (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
    return c;
  }
  host.replaceChildren(panel.node, fbHost);
  setPanel(h('h2', {}, 'Prove it'), voiced('p.intro'), host);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as QItem),
  });
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
function showItem(item: QItem): Solve {
  tr.reset('x.');
  (window as unknown as { __practiceItem: QItem }).__practiceItem = item;
  const p = item.picture ?? {};
  const rv = p.reveal ?? {};
  const draws: ((c: Canvas) => void)[] = [];
  const keysOn: string[] = [];
  const set = (ids: string[] | undefined, key: string): Record<string, number> => Object.fromEntries((ids ?? []).map(id => [id, K(key)]));
  const besideFig = !!(p.proof || p.card || p.cards);
  if (p.euler) {
    const e = p.euler, rvE = e.reveal;
    const made = tryBlock(() => Euler(e, PRACTICE_FRAME, th));
    if (made.ok) {
      const E = made.value;
      const P = progressOf<EulerStep>(s => tr.k(`x.eu.${s}`));
      draws.push(c => E.draw(c, P, {
        zones: (rvE.zones ?? []).map(([at, col], j) => ({ at, col, k: K(`x.z${j}`) })),
        glow: (rvE.glow ?? []).map(([i, col], j) => ({ i, col, k: K(`x.g${j}`) })),
      }));
      tr.set('x.eu.domain', 1, 0.6); tr.set('x.eu.P', 1, 0.7, 0.3); tr.set('x.eu.Q', 1, 0.7, 0.5); tr.set('x.eu.tokens', 1, 1.0, 0.6);
      setScene({ model: c => draws.forEach(d => d(c)), lines: [], leads: [], boardBox: null });
      return {
        solve: async alive => {
          tr.set('x.eu.sort', 1, 1.6); await wait(1.9); if (!alive()) return;
          (rvE.zones ?? []).forEach((_, j) => tr.set(`x.z${j}`, 1, 0.6, 0.2 * j));
          (rvE.glow ?? []).forEach((_, j) => tr.set(`x.g${j}`, 1, 0.5, 0.3));
        },
      };
    }
    console.warn('euler picture failed', made.error);
  }
  if (p.tree) {
    const L = treeLayout(FR_WIDE), tp = p.tree;
    draws.push(c => {
      sheet(c, FR_WIDE, K('x.fig'));
      drawTree(c, L, {
        k: K('x.fig'),
        hide: Object.fromEntries((tp.hide ?? []).map(k => [k, 1 - K('x.solve')])),
        glow: Object.fromEntries([...(tp.glow ?? []).map(k => [k, 1] as const), ...(tp.hide ?? []).map(k => [k, K('x.solve')] as const)]),
      });
    });
    keysOn.push('x.fig');
  }
  if (p.gallery) {
    const g = p.gallery, frs = galleryFrames(g.figs.length);
    draws.push(c => g.figs.forEach((f, i) => {
      const fr = frs[i]!;
      sheet(c, fr, K('x.fig'), 30 + i);
      drawFig(c, f, fr, { k: K('x.fig'), glow: rv.cell === i ? Object.fromEntries(f.segs.map(s => [s.id ?? '', K('x.solve')])) : undefined });
      drawWords(c, g.caps[i] ?? '', fr.x + fr.w / 2, fr.y + fr.h + 52, rv.cell === i && K('x.solve') > 0.5 ? 'link' : 'dim', K('x.fig'), { size: 52, align: 'center' });
    }));
    keysOn.push('x.fig');
  }
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
    const askedRow = new Set((pr.ask ?? []).map(a => a.i));
    const fill = new Map((rv.fill ?? []).filter(x => askedRow.has(x.i)).map(x => [x.i, x]));
    const rows = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
    const fr: Frame = p.fig ? { x: RIGHT_FR.x, y: 60, w: RIGHT_FR.w, h: 960 } : { x: 260, y: 60, w: 1400, h: 960 };
    const made = tryBlock(() => ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first }, fr, th));
    if (made.ok) {
      const B = made.value, asked = new Set((pr.ask ?? []).map(a => `${a.cell === 'st' ? 's' : 'r'}${a.i}`));
      const P = progressOf<ProofStep>(s => (s === 'frame' ? K('x.fig') : asked.has(s) ? K('x.fill') : K('x.fig')));
      draws.push(c => B.draw(c, P, {
        ask: pr.ask, rings: [...(pr.ask ?? []).map(a => ({ i: a.i, col: 'pick' as Paint, k: K('x.fig') })), ...(rv.rings ?? []).map(i => ({ i, col: 'link' as Paint, k: K('x.rings') }))],
        strike: [...(pr.strike ?? []).map(i => ({ i, k: K('x.fig') })), ...(rv.strike ?? []).map(i => ({ i, k: K('x.strike') }))],
      }));
    } else console.warn('proof frame failed', made.error);
  }
  if (p.card) {
    const b = p.fig ? box(RIGHT_FR.x, 160, RIGHT_FR.x + RIGHT_FR.w, 920) : box(190, 140, 1730, 940);
    const C = cardPainter([...p.card.lines, ...(rv.lines ?? [])], b, { nFirst: p.card.lines.length, size: p.fig ? 46 : 52, align: p.fig || p.card.lines.length > 2 ? 'left' : 'center' });
    if (!C.fits) console.warn('card does not fit', item.family);
    draws.push(c => C.draw(c, K('x.card'), K('x.lines')));
    keysOn.push('x.card');
  }
  if (p.cards) {
    const C = cardsPainter(p.cards, box(80, 160, 1840, 920));
    draws.push(c => C.draw(c, K('x.card')));
    keysOn.push('x.card');
  }
  if (!draws.length) {
    const C = cardPainter([plainOf(item.prompt)], box(190, 140, 1730, 940));
    draws.push(c => C.draw(c, K('x.card')));
    keysOn.push('x.card');
  }
  setScene({ model: c => draws.forEach(d => d(c)), lines: [], leads: [], boardBox: null });
  keysOn.forEach((k, i) => tr.set(k, 1, 0.7, 0.1 + 0.2 * i));
  return {
    solve: async alive => {
      tr.set('x.solve', 1, 0.8); tr.set('x.solved', 1, 0.9, 0.2); tr.set('x.glow', 1, 0.6, 0.2); tr.set('x.col', 1, 0.4);
      tr.set('x.fill', 1, 0.9, 0.3); tr.set('x.rings', 1, 0.6, 0.5); tr.set('x.strike', 1, 0.6, 0.6); tr.set('x.lines', 1, 0.9, 0.3);
      void alive;
    },
  };
}
void clamp01;

void runLesson({
  slug: SLUG,
  warm: ['\\overline{AB} \\cong \\overline{DC} \\ \\overline{BC} \\cong \\overline{CB} \\ \\triangle ABC \\cong \\triangle DCB \\ \\angle ABC \\cong \\angle DCB \\ m\\angle ABC = 90^\\circ \\ ABCD \\text{ is a rectangle parallelogram Given Prove}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
