// coordinate-proofs.ts: "Distance, midpoint and coordinate proofs" (Geometry, lesson 11) on the shared runtime.
//   1 The question   four stakes of a garden bed, a "square turned on its corner": is it a square? yes / a rhombus,
//                    not a square / you would need to measure the corners
//   2 Worked example one triangle, four tools on the kit Plane: distance as Pythagoras (the dashed legs), slopes
//                    and their product (a right angle), the midpoint as an average, the circle through B (MB = MA).
//                    Why is AB² = 6² + 2²? (the legs meet at a right angle)
//   3 Your turn      P(−3, 2), Q(5, −4): the length PQ (typed), the midpoint M (typed pair), the perpendicular slope
//                    (typed fraction); the perpendicular bisector draws in
//   4 Prove it       the diagonals of every parallelogram bisect each other: a general placement (choice), then a
//                    Parsons proof with two decoys and a reason menu; back to the garden bed: which check settles it?
//                    Callback to part 1.
//   5 Practice       all 33 sub-goals one after another, then mixed (runtime/practice.ts)
// Reused read-only: kit Plane; geometry-foundations ProofFrame.ts + proofPanel.ts + Card.ts.
import type { Canvas } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import type { Paint } from '../../src/core/theme';
import { paint } from '../../src/core/theme';
import { frame, tryBlock, type Frame } from '../../src/blocks/block';
import { type Line, BOARD, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { type Formula, tex, texWidth } from '../../src/core/tex';
import { btn, feedback, h, html, numInput, pairInput } from '../../src/lesson/runtime/panel';
import { slate } from '../../src/lesson/annotate';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { plain } from '../../src/lesson/runtime/item';
import { Plane, type PItem, type PlaneBlock } from '../../src/lesson/kit/Plane';
import { ProofFrame, type ProofStep } from '../../src/lesson/topics/geometry-foundations/ProofFrame';
import { proofPanel } from '../../src/lesson/topics/geometry-foundations/proofPanel';
import { cardPainter } from '../../src/lesson/topics/geometry-foundations/Card';
import { FAMILY_NAMES, GENERATORS, type CItem } from '../../src/lesson/topics/coordinate-proofs/items';
import { MC, type PlanePic } from '../../src/lesson/topics/coordinate-proofs/ckit';
import { keysOf, planeParams } from '../../src/lesson/topics/coordinate-proofs/pic';
import { PLAN } from '../../src/lesson/topics/coordinate-proofs/plan';
import { explain } from '../../src/lesson/topics/coordinate-proofs/explain';
import { SCRIPT } from '../../src/lesson/topics/coordinate-proofs/script';
import LINES from './coordinate-proofs/voice/lines.json';

const SLUG = 'coordinate-proofs';
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
const K = (key: string) => tr.k(key);
const P = (pre: string) => progressOf(s => tr.k(pre + s));

/** a one-shot choice question in the panel: logs, gives feedback, runs `after` on the right one */
function ask(part: 'turn' | 'prove' | 'example', item: string, prompt: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], after: () => void): HTMLElement {
  const bx = h('div', { class: 'opts' }), fbHost = h('div');
  let done = false;
  opts.forEach((o, k) => bx.append(btn(o.t, () => {
    if (done) return;
    bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
    ctx.store.log({ part, item, prompt, response: plain(o.t), expected: plain(opts.find(x => x.ok)!.t), correct: o.ok, mc: o.mc });
    fbHost.replaceChildren(voicedFb(o.id, o.ok));
    if (o.ok) { done = true; after(); }
  })));
  return h('div', {}, bx, fbHost);
}

// ===================== the plane and the board =====================
const MF = frame(60, 70, 940, 940);
/** board rows (TeX) from the top of the board, each with its own step key */
const PB = box(1070, 70, 1860, 1010), PX = PB.x0 + 50, PW = PB.w - 100;
/** board rows (TeX) from the top of the wide board; a row too wide at 56 px breaks at its \quad gaps */
function board(rows: { key: string; src: string; col?: Paint }[], y0 = 170, gap = 130, size = 72): Line[] {
  const out: Line[] = [];
  let y = y0;
  const fit = (src: string) => { const F = tex(src) as Formula; let sz = size; while (sz > 56 && texWidth(F, sz) > PW) sz -= 2; return { F, sz, ok: texWidth(F, sz) <= PW }; };
  for (const r of rows) {
    let parts = [r.src];
    if (!fit(r.src).ok) {
      const bits = r.src.split(/\s*\\quad\s*/);
      parts = []; let cur = '';
      for (const b of bits) { const t = cur ? `${cur} \\quad ${b}` : b; if (cur && !fit(t).ok) { parts.push(cur); cur = b; } else cur = t; }
      if (cur) parts.push(cur);
    }
    for (const src of parts) { const { F, sz } = fit(src); out.push({ key: r.key, F, x: PX, y, size: sz, col: r.col }); y += gap; }
  }
  return out;
}
/** a wash inside a polygon (the kit Plane has no polygon fill) */
function fillPoly(c: Canvas, B: PlaneBlock, pts: readonly (readonly [number, number])[], col: Paint, k: number): void {
  if (k <= 0) return;
  const { g } = c;
  g.save(); g.globalAlpha *= 0.16 * Math.min(1, k); g.fillStyle = paint(th, col, 'fill');
  g.beginPath(); pts.forEach((p, i) => { const q = B.px(p[0], p[1]); if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.closePath(); g.fill(); g.restore();
}
const seg = (key: string, a: [number, number], b: [number, number], col: Paint, dash = false): PItem => ({ kind: 'seg', key, a, b, col, dash, w: 5 });
const pt = (key: string, x: number, y: number, name: string | undefined, col: Paint = 'first'): PItem => ({ kind: 'point', key, x, y, name, col });

// ===================== the garden bed (parts 1 and 4) =====================
const BED: [number, number][] = [[-6, 0], [0, -5], [6, 0], [0, 5]];
function bedPlane(): PlaneBlock {
  return Plane({ x: { min: -7, max: 7, step: 1, name: 'x (yd)' }, y: { min: -6, max: 6, step: 1, name: 'y (yd)' }, equal: true, items: [
    ...BED.map((p, i) => seg(`s${i}`, p, BED[(i + 1) % 4]!, 'first')),
    seg('ac', BED[0]!, BED[2]!, 'second', true), seg('bd', BED[1]!, BED[3]!, 'pick', true),
    ...BED.map((p, i) => pt(['A', 'B', 'C', 'D'][i]!, p[0], p[1], ['A', 'B', 'C', 'D'][i]!)),
  ] }, MF, th);
}
function bedScene(pre: string, B: PlaneBlock, lines: Line[]): void {
  setScene({ model: c => { B.draw(c, P(pre)); fillPoly(c, B, BED, 'first', K(pre + 's3')); }, lines, leads: [], boardBox: PB });
}
const bedOn = (pre: string, d0 = 0) => {
  tr.set(pre + 'axes', 1, 1.0, d0);
  BED.forEach((_, i) => tr.set(`${pre}s${i}`, 1, 0.6, d0 + 0.8 + i * 0.3));
  ['A', 'B', 'C', 'D'].forEach((k, i) => tr.set(pre + k, 1, 0.5, d0 + 0.6 + i * 0.25));
};

// ===================== 1. The question =====================
const CARDS = [
  { name: 'Yes', t: 'it looks like one, and its sides match', mc: MC.appearance as string | undefined, cb: 'q.cb.yes', right: false },
  { name: 'No', t: 'a rhombus: equal sides, but no right angle', mc: undefined as string | undefined, cb: 'q.cb.no', right: true },
  { name: 'Can\'t tell', t: 'you would need to measure the corners', mc: MC.rejectsProof as string | undefined, cb: 'q.cb.cant', right: false },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = bedPlane();
  bedScene('q.', B, board([{ key: 'q.L0', src: 'A(-6, 0) \\quad B(0, -5)' }, { key: 'q.L1', src: 'C(6, 0) \\quad D(0, 5)' }, { key: 'q.L2', src: '\\text{a square?}', col: 'pick' }], 200, 150, 76));
  bedOn('q.');
  tr.set('q.L0', 1, 0.9, 1.6); tr.set('q.L1', 1, 0.9, 2.0); tr.set('q.L2', 1, 0.8, 2.8);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A garden bed has corners A(−6, 0), B(0, −5), C(6, 0), D(0, 5). Is it a square?', response: `${c.name}: ${c.t}`, expected: 'No: a rhombus', correct: c.right, mc: c.mc, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'Is the garden bed a square?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: one triangle, four tools =====================
const TA: [number, number] = [1, 1], TB: [number, number] = [7, 3], TC: [number, number] = [5, 9], TM: [number, number] = [3, 5];
function exPlane(): PlaneBlock {
  const r = Math.sqrt(20);
  const circ = (s: number) => (x: number) => TM[1] + s * Math.sqrt(Math.max(0, 20 - (x - TM[0]) ** 2));
  return Plane({ x: { min: -2, max: 9, step: 1, name: 'x' }, y: { min: -1, max: 10, step: 1, name: 'y' }, equal: true, items: [
    { kind: 'curve', key: 'cu', f: circ(1), lo: TM[0] - r, hi: TM[0] + r, col: 'pick', w: 4 },
    { kind: 'curve', key: 'cd', f: circ(-1), lo: TM[0] - r, hi: TM[0] + r, col: 'pick', w: 4 },
    seg('ab', TA, TB, 'ink'), seg('bc', TB, TC, 'ink'), seg('ca', TC, TA, 'ink'),
    seg('run1', TA, [7, 1], 'first', true), seg('rise1', [7, 1], TB, 'second', true),
    seg('run2', TB, [5, 3], 'first', true), seg('rise2', [5, 3], TC, 'second', true),
    seg('mb', TM, TB, 'link', true),
    { kind: 'text', key: 't6', x: 4, y: 0.3, text: '6', col: 'first' }, { kind: 'text', key: 't2', x: 7.7, y: 2, text: '2', col: 'second' },
    { kind: 'text', key: 't2b', x: 6, y: 2.3, text: '2', col: 'first' }, { kind: 'text', key: 't6b', x: 4.3, y: 6, text: '6', col: 'second' },
    pt('A', 1, 1, 'A'), pt('B', 7, 3, 'B'), pt('C', 5, 9, 'C'), pt('M', 3, 5, 'M', 'link'),
  ] }, MF, th);
}
function partExample(): void {
  tr.reset('e.');
  const B = exPlane();
  const lines = board([
    { key: 'e.Lp', src: 'A(1, 1) \\quad B(7, 3) \\quad C(5, 9)' },
    { key: 'e.L0', src: 'AB^2 = 6^2 + 2^2 = 40' }, { key: 'e.L1', src: 'BC^2 = (-2)^2 + 6^2 = 40' },
    { key: 'e.L2', src: 'm_{AB} = \\tfrac{1}{3}, \\; m_{BC} = -3' }, { key: 'e.L3', src: '\\tfrac{1}{3} \\cdot (-3) = -1', col: 'link' },
    { key: 'e.L4', src: 'M = \\left(\\tfrac{1 + 5}{2}, \\tfrac{1 + 9}{2}\\right) = (3, 5)' }, { key: 'e.L5', src: 'MB^2 = 4^2 + (-2)^2 = 20', col: 'link' }, { key: 'e.L5', src: 'MA^2 = 2^2 + 4^2 = 20', col: 'link' },
  ], 140, 112, 62);
  setScene({ model: c => B.draw(c, P('e.'), { dim: K('e.dimLegs') > 0.5 ? ['run1', 'rise1', 'run2', 'rise2', 't6', 't2', 't2b', 't6b'] : [] }), lines, leads: [], boardBox: PB });
  tr.set('e.axes', 1, 1.0); ['ab', 'bc', 'ca'].forEach((k, i) => tr.set('e.' + k, 1, 0.7, 0.6 + i * 0.3)); ['A', 'B', 'C'].forEach((k, i) => tr.set('e.' + k, 1, 0.5, 0.5 + i * 0.25)); tr.set('e.Lp', 1, 0.9, 1.2);
  let step = 0;
  const STEPS = [
    { t: 'Distance is Pythagoras', why: 'The run and the rise are legs.', act: 'Measure' },
    { t: 'Slopes test the corner', why: 'Is ∠B a right angle?', act: 'Slopes' },
    { t: 'The midpoint is an average', why: 'Halfway in x, halfway in y.', act: 'Average' },
    { t: 'A point on a circle', why: 'Is B as far from M as A is?', act: 'Compare' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step && !(i === 1 && !whyDone)) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  let whyDone = false;
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.run1', 1, 0.7); tr.set('e.t6', 1, 0.5, 0.6); tr.set('e.rise1', 1, 0.7, 0.8); tr.set('e.t2', 1, 0.5, 1.4); tr.set('e.L0', 1, 1.0, 1.6);
        await wait(2.6); if (!alive()) return;
        tr.set('e.run2', 1, 0.7); tr.set('e.t2b', 1, 0.5, 0.6); tr.set('e.rise2', 1, 0.7, 0.8); tr.set('e.t6b', 1, 0.5, 1.4); tr.set('e.L1', 1, 1.0, 1.6);
        await wait(2.6);
      } else if (i === 1) { tr.set('e.dimLegs', 1, 0.3); tr.set('e.L2', 1, 1.0, 0.2); tr.set('e.L3', 1, 1.0, 1.4); await wait(2.4); }
      else if (i === 2) { tr.set('e.M', 1, 0.6); tr.set('e.L4', 1, 1.0, 0.4); await wait(1.8); }
      else { tr.set('e.mb', 1, 0.7); tr.set('e.L5', 1, 1.0, 0.5); tr.set('e.cu', 1, 1.4, 1.4); tr.set('e.cd', 1, 1.4, 1.4); await wait(3.0); }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 0) selfExplain();
      if (i === 3) after.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    });
  }
  function selfExplain(): void {
    after.replaceChildren(voiced('e.why', 'div', 'label'), ask('example', 'example.why', 'Why is AB² equal to 6² + 2²?', [
      { t: 'AB is the hypotenuse of a right triangle whose legs are the run, 6, and the rise, 2', ok: true, id: 'e.why.ok' },
      { t: 'AB is the run plus the rise, 6 + 2, squared', ok: false, id: 'e.why.adds', mc: MC.adds },
      { t: 'it is 7² − 1² plus 3² − 1²', ok: false, id: 'e.why.sq', mc: MC.diffSq },
    ], () => { whyDone = true; drawPlan(); }));
  }
  drawPlan();
  setPanel(h('h2', {}, 'One triangle, four tools'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn =====================
const UP: [number, number] = [-3, 2], UQ: [number, number] = [5, -4], UM: [number, number] = [1, -1];
function turnPlane(): PlaneBlock {
  return Plane({ x: { min: -5, max: 7, step: 1, name: 'x' }, y: { min: -6, max: 5, step: 1, name: 'y' }, equal: true, items: [
    { kind: 'curve', key: 'perp', f: x => UM[1] + (4 / 3) * (x - UM[0]), col: 'link', w: 4 },
    seg('pq', UP, UQ, 'ink'), seg('run', UP, [5, 2], 'first', true), seg('rise', [5, 2], UQ, 'second', true),
    { kind: 'text', key: 't8', x: 1, y: 2.75, text: '8', col: 'first' }, { kind: 'text', key: 't6', x: 6.1, y: -1, text: '6', col: 'second' },
    pt('P', UP[0], UP[1], 'P'), pt('Q', UQ[0], UQ[1], 'Q'), pt('M', UM[0], UM[1], 'M', 'link'),
  ] }, MF, th);
}
function partTurn(): void {
  tr.reset('t.');
  const B = turnPlane();
  const lines = board([
    { key: 't.L0', src: 'P(-3, 2) \\quad Q(5, -4)' }, { key: 't.L1', src: 'PQ = \\sqrt{8^2 + 6^2} = 10' },
    { key: 't.L2', src: 'M = (1, -1)' }, { key: 't.L3', src: 'm_{PQ} = -\\tfrac{3}{4}, \\; m_{\\perp} = \\tfrac{4}{3}', col: 'link' },
  ], 190, 160, 72);
  setScene({ model: c => B.draw(c, P('t.')), lines, leads: [], boardBox: PB });
  tr.set('t.axes', 1, 1.0); tr.set('t.pq', 1, 0.8, 0.6); tr.set('t.P', 1, 0.5, 0.5); tr.set('t.Q', 1, 0.5, 0.7); tr.set('t.L0', 1, 0.9, 0.8);
  tr.set('t.run', 1, 0.7, 1.4); tr.set('t.t8', 1, 0.5, 1.9); tr.set('t.rise', 1, 0.7, 2.0); tr.set('t.t6', 1, 0.5, 2.5);
  const work = h('div');
  function checker<T>(id: string, item: string, prompt: string, input: { node: HTMLElement; read(): T | null; focus(): void }, judge: (r: T) => { ok: boolean; id: string; mc?: string; resp: unknown }, expected: unknown, onRight: () => void): HTMLElement {
    const fbHost = h('div'), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = input.read();
      if (r === null) return;
      const v = judge(r);
      ctx.store.log({ part: 'turn', item, prompt, response: v.resp, expected, correct: v.ok, mc: v.ok ? undefined : v.mc });
      if (!v.ok) { fbHost.replaceChildren(voicedFb(v.id, false)); return; }
      ok.disabled = true; fbHost.replaceChildren(voicedFb(`${id}.ok`, true)); onRight();
    }
    const d = h('div', {}, voiced(`${id}.ask`), input.node, h('div', { class: 'row' }, ok), fbHost);
    setTimeout(() => input.focus(), 50);
    return d;
  }
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  function askPQ(): void {
    const inp = numInput('', () => undefined);
    work.append(checker('t.pq', 'turn.pq', 'P(−3, 2), Q(5, −4): how long is PQ?', inp, r => {
      const v = r.kind === 'num' ? r.v : NaN;
      return near(v, 10) ? { ok: true, id: 't.pq.ok', resp: v } : near(v, 14) ? { ok: false, id: 't.pq.adds', mc: MC.adds, resp: v } : { ok: false, id: 't.pq.other', resp: v };
    }, 10, () => { tr.set('t.L1', 1, 1.0); seq(async alive => { await wait(1.6); if (alive()) askM(); }); }));
  }
  function askM(): void {
    const inp = pairInput('M = (', ',', () => undefined, ')');
    work.append(checker('t.m', 'turn.m', 'The midpoint M of PQ', inp, r => {
      if (r.kind !== 'pair') return { ok: false, id: 't.m.other', resp: r };
      return near(r.x, 1) && near(r.y, -1) ? { ok: true, id: 't.m.ok', resp: [r.x, r.y] } : near(r.x, 4) && near(r.y, -3) ? { ok: false, id: 't.m.half', mc: MC.halfDiff, resp: [r.x, r.y] } : { ok: false, id: 't.m.other', resp: [r.x, r.y] };
    }, [1, -1], () => { tr.set('t.M', 1, 0.6); tr.set('t.L2', 1, 1.0, 0.3); seq(async alive => { await wait(1.6); if (alive()) askS(); }); }));
    ctx.panel.scrollTop = ctx.panel.scrollHeight;
  }
  function askS(): void {
    const inp = pairInput('', '/', () => undefined, '');
    work.append(checker('t.s', 'turn.slope', 'The slope of a line perpendicular to PQ (a fraction)', inp, r => {
      if (r.kind !== 'pair' || near(r.y, 0)) return { ok: false, id: 't.s.other', resp: r };
      const v = r.x / r.y;
      return near(v, 4 / 3) ? { ok: true, id: 't.s.ok', resp: `${r.x}/${r.y}` } : near(v, 3 / 4) ? { ok: false, id: 't.s.recip', mc: MC.perpRecip, resp: `${r.x}/${r.y}` }
        : near(v, -4 / 3) || near(v, 3 / 4) ? { ok: false, id: 't.s.opp', mc: MC.perpOpp, resp: `${r.x}/${r.y}` } : { ok: false, id: 't.s.other', resp: `${r.x}/${r.y}` };
    }, '4/3', () => {
      tr.set('t.L3', 1, 1.0); tr.set('t.perp', 1, 1.4, 0.6);
      seq(async alive => { await wait(2.4); if (!alive()) return; work.append(voiced('t.done'), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go'))); ctx.panel.scrollTop = ctx.panel.scrollHeight; });
    }));
    ctx.panel.scrollTop = ctx.panel.scrollHeight;
  }
  setPanel(h('h2', {}, 'Your turn: P and Q'), voiced('t.intro'), work);
  seq(async alive => { await wait(2.8); if (alive()) askPQ(); });
}

// ===================== 4. Prove it: the diagonals of every parallelogram bisect each other =====================
const FR_FIG: Frame = { x: 40, y: 110, w: 640, h: 860 };
const FR_PROOF: Frame = { x: 690, y: 70, w: 1190, h: 940 };
const PO: [number, number][] = [[0, 0], [6, 0], [8, 4], [2, 4]];
function parPlane(): PlaneBlock {
  const none = () => '';
  return Plane({ x: { min: -2, max: 11, step: 1, name: 'x', fmt: none }, y: { min: -2, max: 6, step: 1, name: 'y', fmt: none }, equal: true, items: [
    ...PO.map((p, i) => seg(`s${i}`, p, PO[(i + 1) % 4]!, 'first')),
    seg('ob', PO[0]!, PO[2]!, 'second', true), seg('ac', PO[1]!, PO[3]!, 'pick', true),
    { kind: 'text', key: 'tO', x: 0.9, y: -1.05, text: 'O(0, 0)', col: 'first' }, { kind: 'text', key: 'tA', x: 6.4, y: -1.05, text: 'A(a, 0)', col: 'first' },
    { kind: 'text', key: 'tB', x: 8.6, y: 5.1, text: 'B(a + b, c)', col: 'first' }, { kind: 'text', key: 'tC', x: 1.6, y: 5.1, text: 'C(b, c)', col: 'first' },
    pt('O', 0, 0, undefined), pt('A', 6, 0, undefined), pt('B', 8, 4, undefined), pt('C', 2, 4, undefined), pt('M', 4, 2, 'M', 'link'),
  ] }, FR_FIG, th);
}
const RS = {
  place: 'Moving keeps lengths and midpoints',
  mid: 'Midpoint formula',
  same: 'Same coordinates, same point',
  bis: 'A shared midpoint means they bisect',
  dist: 'Distance formula',
  circ: 'Parallelogram diagonals bisect each other',
};
const P_LINES = [
  { st: 'O(0, 0), A(a, 0), B(a + b, c), C(b, c)', tex: 'A(a,0),\\, B(a{+}b,c),\\, C(b,c)', rs: RS.place, uses: [] as number[] },
  { st: 'M₁ = midpoint of OB = ((a + b)/2, c/2)', tex: 'M_1 = \\left(\\tfrac{a+b}{2}, \\tfrac{c}{2}\\right)', rs: RS.mid, uses: [1] },
  { st: 'M₂ = midpoint of AC = ((a + b)/2, c/2)', tex: 'M_2 = \\left(\\tfrac{a+b}{2}, \\tfrac{c}{2}\\right)', rs: RS.mid, uses: [1] },
  { st: 'M₁ = M₂', tex: 'M_1 = M_2', rs: RS.same, uses: [2, 3] },
  { st: 'OB and AC bisect each other', tex: '\\overline{OB}, \\overline{AC} \\text{ bisect}', rs: RS.bis, uses: [4] },
];
const P_DECOYS = [
  { st: 'OB = AC', why: 'bisecting is about a shared midpoint, not equal lengths, and most parallelograms have diagonals of different lengths.', mc: MC.diagWords },
  { st: 'With a = 6, b = 2, c = 4, both midpoints are (4, 2)', why: 'numbers check one parallelogram; the letters already cover every one.', mc: MC.numbersIn },
];
const P_MENU = [
  { t: RS.place }, { t: RS.mid }, { t: RS.same }, { t: RS.bis },
  { t: RS.dist, mc: MC.diagWords, why: 'A midpoint comes from averaging the endpoints, not from a length.' },
  { t: RS.circ, mc: 'mc.geometric-proof.circular-reasoning', why: 'That is the claim itself: it cannot be a reason in its own proof.' },
];
function partProve(): void {
  tr.reset('p.');
  const placed: number[] = [], reasons: string[] = [];
  const make = () => ProofFrame({ given: ['OABC \\text{ is a parallelogram}'], prove: '\\overline{OB}, \\overline{AC} \\text{ bisect each other}', rows: P_LINES.map((_, k) => ({ st: placed[k] ? P_LINES[placed[k]! - 1]!.tex : '', rs: reasons[k] ?? '' })), reserve: P_LINES.map(l => l.tex), reserveRs: P_MENU.map(m => m.t) }, FR_PROOF, th);
  let PF = make();
  const Bp = parPlane(), Bed = bedPlane();
  const bedLines = board([{ key: 'p.b0', src: 'AB^2 = BC^2 = 61' }, { key: 'p.b0', src: 'CD^2 = DA^2 = 61' }, { key: 'p.b1', src: 'AC = 12', col: 'link' }, { key: 'p.b1', src: 'BD = 10', col: 'link' }], 220, 150, 72);
  setScene({
    model: c => {
      const fw = K('p.bed');
      if (fw < 1) {
        c.g.save(); c.g.globalAlpha *= 1 - fw;
        Bp.draw(c, P('p.f.'));
        fillPoly(c, Bp, PO, 'first', K('p.f.s3'));
        PF.draw(c, progressOf<ProofStep>(s => tr.k(`p.pf.${s}`)), {});
        c.g.restore();
      }
      if (fw > 0) { c.g.save(); c.g.globalAlpha *= fw; Bed.draw(c, P('p.q.')); fillPoly(c, Bed, BED, 'first', K('p.q.s3')); c.g.restore(); slate(c, PB, fw); }
    },
    lines: bedLines, leads: [], boardBox: null,
  });
  tr.set('p.f.axes', 1, 0.8); tr.set('p.pf.frame', 1, 0.8, 0.4);
  const host = h('div'), fbHost = h('div');
  const drawPar = () => {
    PO.forEach((_, i) => tr.set(`p.f.s${i}`, 1, 0.6, i * 0.25));
    ['O', 'A', 'B', 'C'].forEach((k, i) => { tr.set('p.f.' + k, 1, 0.5, 0.3 + i * 0.25); tr.set('p.f.t' + k, 1, 0.5, 0.5 + i * 0.25); });
  };
  function placement(): HTMLElement {
    return h('div', {}, voiced('p.place.ask', 'div', 'label'), ask('prove', 'prove.placement', 'Which placement covers every parallelogram, and nothing more?', [
      { t: 'O(0, 0), A(a, 0), B(a, c), C(0, c)', ok: false, id: 'p.place.rect', mc: MC.special },
      { t: 'O(0, 0), A(a, 0), B(a + b, c), C(b, c)', ok: true, id: 'p.place.ok' },
      { t: 'O(0, 0), A(a, 0), B(a, a), C(0, a)', ok: false, id: 'p.place.sq', mc: MC.special },
    ], () => { drawPar(); seq(async alive => { await wait(1.8); if (alive()) startProof(); }); }));
  }
  function startProof(): void {
    const panel = proofPanel({
      lines: P_LINES.map(l => ({ st: l.st, rs: l.rs, uses: l.uses })),
      decoys: P_DECOYS, menu: P_MENU, order: [5, 2, 0, 6, 3, 1, 4],
      say: { order: 'Tap the lines in an order that works (two are decoys).', reasons: 'Now pick the reason for each line, top to bottom.' },
      onPlace(line, pos) {
        placed[pos] = line; PF = make(); tr.set(`p.pf.s${pos}`, 1, 0.8);
        if (line === 2) tr.set('p.f.ob', 1, 0.7); if (line === 3) tr.set('p.f.ac', 1, 0.7); if (line === 4) tr.set('p.f.M', 1, 0.6);
        ctx.store.log({ part: 'prove', item: `prove.order${pos + 1}`, prompt: `Line ${pos + 1} of the proof`, response: P_LINES[line - 1]!.st, correct: true });
      },
      onReason(pos, _line, reason) {
        reasons[pos] = reason; PF = make(); tr.set(`p.pf.r${pos}`, 1, 0.7);
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
          await wait(2.4); if (!alive()) return;
          tr.set('p.bed', 1, 1.0); bedOn('p.q.', 0.4); tr.set('p.q.ac', 1, 0.8, 1.8); tr.set('p.q.bd', 1, 0.8, 2.2);
          tr.set('p.b0', 1, 0.9, 1.4); tr.set('p.b1', 1, 0.9, 2.6);
          host.replaceChildren(voiced('p.back'), voiced('p.back.ask', 'div', 'label'), ask('prove', 'prove.bed', 'The garden bed: which check settles whether it is a square?', [
            { t: 'AC² = 144 but BD² = 100: unequal diagonals, so no right angle', ok: true, id: 'p.back.ok' },
            { t: 'AB² = BC² = CD² = DA² = 61: four equal sides make a square', ok: false, id: 'p.back.four', mc: MC.skipsRight },
            { t: 'It looks like a square turned on its corner', ok: false, id: 'p.back.look', mc: MC.appearance },
          ], () => seq(async alive2 => { await wait(3.2); if (!alive2()) return; host.append(callback()); ctx.panel.scrollTop = ctx.panel.scrollHeight; })));
          ctx.panel.scrollTop = ctx.panel.scrollHeight;
        });
      },
    });
    host.replaceChildren(panel.node, fbHost);
    ctx.panel.scrollTop = 0;
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.cb : 'q.cb.no', 'p', '', (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
    return c;
  }
  host.replaceChildren(placement());
  setPanel(h('h2', {}, 'Prove it'), voiced('p.intro'), host);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as CItem),
  });
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
/** board rows of an item: its TeX split at \\ */
function itemBoard(it: CItem, y0 = 200): Line[] {
  const rows = (it.board || '').split(/\s*\\\\\s*/).filter(Boolean);
  return board(rows.map(src => ({ key: 'x.L', src: src.trim() })), y0, 150, 72);
}
function planeScene(it: CItem, p: PlanePic): Solve | null {
  const made = tryBlock(() => Plane(planeParams(p, true), MF, th));
  if (!made.ok) { console.info('plane fallback', it.family, made.error); return null; }
  const B = made.value, base = new Set(keysOf(p, 'base')), rev = new Set(keysOf(p, 'reveal'));
  const Pr = progressOf<string>(s => (s === 'axes' ? K('x.axes') : base.has(s) ? K('x.base') : rev.has(s) ? K('x.rev') : 0));
  setScene({
    model: c => {
      B.draw(c, Pr);
      for (const poly of p.polys ?? []) fillPoly(c, B, poly.pts, poly.col ?? 'first', K('x.base'));
      for (const poly of p.reveal?.polys ?? []) if (poly.col !== 'pick') fillPoly(c, B, poly.pts, poly.col ?? 'link', K('x.rev'));
    },
    lines: itemBoard(it), leads: [], boardBox: PB,
  });
  tr.set('x.axes', 1, 0.8); tr.set('x.base', 1, 0.8, 0.4); tr.set('x.L', 1, 0.9, 0.5);
  return { solve: async () => { tr.set('x.rev', 1, 1.0); } };
}
function showItem(it: CItem): Solve {
  tr.reset('x.');
  (window as unknown as { __practiceItem: CItem }).__practiceItem = it;
  const p = it.picture ?? {};
  if (p.plane) { const r = planeScene(it, p.plane); if (r) return r; }
  const lines = p.card ? p.card.lines : [plain(it.prompt)];
  const C = cardPainter(lines, box(190, 140, 1730, 940), { size: 52, align: lines.length > 1 ? 'left' : 'center' });
  if (!C.fits) console.warn('card does not fit', it.family);
  setScene({ model: c => C.draw(c, K('x.card')), lines: [], leads: [], boardBox: null });
  tr.set('x.card', 1, 0.7, 0.1);
  return {};
}
void (0 as unknown as Box); void BOARD;

void runLesson({
  slug: SLUG,
  warm: ['AB^2 = 6^2 + 2^2 = 40 \\quad m_{AB} = \\tfrac{1}{3} \\; \\cdot (-3) = -1 \\quad M = \\left(\\tfrac{1 + 5}{2}, \\tfrac{1 + 9}{2}\\right) \\sqrt{8^2} \\overline{OB} \\text{ bisect each other parallelogram a square?} m_{\\perp}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
