// exponential-functions.ts: "Exponential growth and decay" (Algebra 1, secondary-t6-13) on the shared lesson runtime.
// The model is the GrowthTable (src/lesson/topics/exponential-functions/GrowthTable.ts): a table of values with a
// bracket between rows carrying the ratio (×1.1, teal) and the difference (+110, water) of the last column, so
// "same factor every step" is something you can see; graphs use the shared kit's Plane.
//   1 The question   two accounts from $1,000: +$100 a year vs 10% a year; after 3 years, which has more?
//                    cards A / the same / B
//   2 Worked example year by year (the table fills in) → compare the changes (differences grow, ratios equal ×1.1)
//                    → the model B(t) = 1000(1.1)^t (a = value at 0, b = 1 + r) → the graph (line vs curve, 20 years);
//                    one "why $110 in year 2?"
//   3 Your turn      a $24,000 car loses 20% a year: year 1 done for you; the kid picks b, picks the model, types the
//                    value after 2 years, and decides whether it ever reaches $0 (the decay curve and its asymptote)
//   4 Prove it       Maya checks three ratios of f(t) = 5·3^t and calls it proved. Judge, then a because-chain:
//                    substitute t + 1 / product rule / divide by a nonzero f(t) (distractors = catalogue)
//   5 Practice       all 26 sub-goals one after another, then mixed (runtime/practice.ts); the table and / or graph of
//                    each item, answers hidden until the replay after a miss
// Voiced lines: src/lesson/topics/exponential-functions/script.ts (→ voice/lines.json). Every answer is logged.
import { type Canvas, withAlpha } from '../../src/core/draw';
import { type Box, box, clamp } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, MF, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { Plane, type PItem, type PlaneBlock } from '../../src/lesson/kit/Plane';
import { GrowthTable, type TabBlock, type TabFocus } from '../../src/lesson/topics/exponential-functions/GrowthTable';
import { type Pic, planeOf, stepOf, tableOf } from '../../src/lesson/topics/exponential-functions/pictures';
import { FAMILY_NAMES, GENERATORS, MC, type QItem } from '../../src/lesson/topics/exponential-functions/items';
import { PLAN } from '../../src/lesson/topics/exponential-functions/plan';
import { explain } from '../../src/lesson/topics/exponential-functions/explain';
import { SCRIPT } from '../../src/lesson/topics/exponential-functions/script';
import { nH } from '../../src/lesson/topics/exponential-functions/expo';

const SLUG = 'exponential-functions';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = '', extra = ''): HTMLElement {
  const L0 = SCRIPT[id];
  if (!L0) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, (L0?.html ?? id) + extra);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]?.html ?? id); }

// ===================== board helpers =====================
function centred(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint, cx = BOARD.cx, maxW = BOARD_W): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: cx - b.cx, y, size: s, tags, col };
}
const amber = { col: 'first' as Paint }, teal = { col: 'second' as Paint };
const P = (pre: string) => (s: string) => tr.k(pre + s);
type Painter = (c: Canvas) => void;
function scene(model: Painter, lines: Line[], extra?: Painter): void { setScene({ table: 1080, lines, leads: [], extra, model }); }
/** a table drawn with the steps `${pre}card`, `rows`, `ratios`, `diffs`, `reveal` and an alpha key */
const drawTab = (T: TabBlock, pre: string, f?: () => TabFocus, alphaKey?: string): Painter => c => {
  const al = alphaKey ? 1 - tr.k(alphaKey) : 1;
  if (al <= 0.01) return;
  withAlpha(c, al, () => T.draw(c, progressOf(s => tr.k(pre + s)), f?.()));
};
/** a Plane whose step k is `${pre}${key}` (points `key#i` come in one after another) */
const drawPlane = (G: PlaneBlock, pre: string, counts: Record<string, number> = {}, f?: () => Parameters<PlaneBlock['draw']>[2]): Painter => c =>
  G.draw(c, progressOf(s => {
    if (s === 'axes') return tr.k(pre + 'axes');
    const { key, i } = stepOf(s);
    const k = tr.k(pre + key);
    return i < 0 ? k : clamp(k * ((counts[key] ?? 1) + 1) - i);
  }), f?.());

// ===================== 1. The question =====================
const ACC = { P: 1000, add: 100, b: 1.1 };
const yrs = [0, 1, 2, 3];
const accA = yrs.map(t => ACC.P + ACC.add * t), accB = yrs.map(t => Math.round(ACC.P * ACC.b ** t * 100) / 100);
function accountTable(hide: boolean): TabBlock {
  return GrowthTable({
    tName: 'year', ts: yrs.map(String),
    cols: [
      { name: 'A ($)', vals: accA.map((v, i) => (hide && i > 0 ? null : nH(v))), reveal: hide ? accA.map((v, i) => (i > 0 ? nH(v) : null)) : undefined, col: 'water' },
      { name: 'B ($)', vals: accB.map((v, i) => (hide && i > 0 ? null : nH(v))), reveal: hide ? accB.map((v, i) => (i > 0 ? nH(v) : null)) : undefined },
    ],
    ratios: ['×1.1', '×1.1', '×1.1'], diffs: ['+100', '+110', '+121'],
  }, MF, th);
}
const CARDS = [
  { t: 'A', sub: 'has more', id: 'q.cb.a', ok: false, mc: undefined as string | undefined },
  { t: 'Same', sub: '$1,300 each', id: 'q.cb.same', ok: false, mc: MC.constAmount as string | undefined },
  { t: 'B', sub: 'has more', id: 'q.cb.right', ok: true, mc: undefined as string | undefined },
];
function partQuestion(): void {
  tr.reset('q.');
  const T = accountTable(true);
  const L1 = centred('q.L1', '\\text{A: } +\\$100\\ \\text{per year}', 170, 76, undefined, 'water');
  const L2 = centred('q.L2', '\\text{B: } +10\\%\\ \\text{per year}', 290, 76, undefined, 'first');
  const L3 = centred('q.L3', '\\text{year } 3:\\ \\text{A or B?}', 420, 76);
  scene(drawTab(T, 'q.'), [L1, L2, L3]);
  tr.set('q.card', 1, 1.0, 0.2); tr.set('q.rows', 1, 1.6, 0.8); tr.set('q.L1', 1, 0.9, 1.0); tr.set('q.L2', 1, 0.9, 1.8); tr.set('q.L3', 1, 0.9, 2.6);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Two accounts from $1,000: A +$100 per year, B +10% per year. After 3 years, which has more?', board: 'A or B?', response: c.t, expected: 'B', correct: c.ok, mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button', {}); b.innerHTML = `<span>${cd.t}</span><small>${cd.sub}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Two accounts'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function accountPlane(): PlaneBlock {
  const items: PItem[] = [
    { kind: 'curve', key: 'A', f: t => ACC.P + ACC.add * t, lo: 0, hi: 20, col: 'water', name: 'A' },
    { kind: 'curve', key: 'B', f: t => ACC.P * ACC.b ** t, lo: 0, hi: 20, col: 'link', name: 'B' },
    ...[5, 10, 15, 20].map((t, i) => ({ kind: 'point' as const, key: `pB#${i}`, x: t, y: ACC.P * ACC.b ** t, col: 'first' as Paint })),
  ];
  return Plane({ x: { min: 0, max: 20, step: 2, name: 'years' }, y: { min: 0, max: 7000, step: 1000, name: 'balance ($)', fmt: v => (v ? nH(v) : '0') }, items }, MF, th);
}
function partExample(): void {
  tr.reset('e.');
  const T = accountTable(true), G = accountPlane();
  const s = 70;
  const L1 = centred('e.L1', 'A(3) = 1300', 130, 66, undefined, 'water');
  const L2 = centred('e.L2', 'B(3) = 1331', 225, 66, undefined, 'first');
  const L3 = centred('e.L3', '+100,\\ +110,\\ +121', 330, 64, undefined, 'water');
  const L4 = centred('e.L4', '\\times 1.1,\\ \\times 1.1,\\ \\times 1.1', 425, 64, undefined, 'second');
  const L5 = centred('e.L5', 'B(t) = \\cssId{a}{1000}\\,(\\cssId{b}{1.1})^{t}', 550, 80, { a: amber, b: teal });
  const L6 = centred('e.L6', '\\cssId{b}{1.1} = 1 + 0.10', 655, 64, { b: teal });
  const L7 = centred('e.L7', 'A(20) = 3000', 780, 64, undefined, 'water');
  const L8 = centred('e.L8', 'B(20) \\approx 6727.50', 875, 64, undefined, 'link');
  scene(c => { drawTab(T, 'e.', () => ({ dimD: tr.k('e.dimD') }), 'e.gone')(c); if (tr.k('e.axes') > 0) drawPlane(G, 'e.', { pB: 4 })(c); }, [L1, L2, L3, L4, L5, L6, L7, L8]);
  tr.jump('e.card', 1); tr.jump('e.rows', 1);
  let step = 0;
  const STEPS = [
    { t: 'Year by year', why: 'Fill in both accounts.', act: 'Fill in' },
    { t: 'Compare the changes', why: 'Differences, then ratios.', act: 'Compare' },
    { t: 'Write the model', why: 'Start and factor.', act: 'Write' },
    { t: 'Graph 20 years', why: 'Line or curve?', act: 'Graph' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s0, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s0.t), html('span', 'why', s0.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s0.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.reveal', 1, 2.0); await wait(2.1); if (!alive()) return;
        tr.set('e.L1', 1, 1.0); tr.set('e.L2', 1, 1.0, 0.5); await wait(1.6);
      } else if (i === 1) {
        tr.set('e.diffs', 1, 2.2); tr.set('e.L3', 1, 1.0, 1.2); await wait(2.6); if (!alive()) return;
        tr.set('e.dimD', 1, 0.6); tr.set('e.ratios', 1, 2.2); tr.set('e.L4', 1, 1.0, 1.2); await wait(2.6);
      } else if (i === 2) {
        tr.set('e.L1:dim', 1, 0.5); tr.set('e.L2:dim', 1, 0.5); tr.set('e.L3:dim', 1, 0.5);
        tr.set('e.L5', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.L6', 1, 1.0); await wait(1.1);
      } else {
        tr.set('e.gone', 1, 0.8); await wait(0.6); if (!alive()) return;
        tr.set('e.axes', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('e.A', 1, 1.6); tr.set('e.B', 1, 2.2, 0.4); await wait(2.4); if (!alive()) return;
        tr.set('e.pB', 1, 1.2); tr.set('e.L7', 1, 0.9); tr.set('e.L8', 1, 0.9, 0.5); await wait(1.5);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The 10% is taken of the balance at that moment, $1,100, not of the first $1,000.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'The interest rate goes up to 11% in year 2.', ok: false, id: 'e.why.rate', mc: undefined as string | undefined },
      { t: 'B gets $100 plus a $10 bonus for each year that has passed.', ok: false, id: 'e.why.add', mc: MC.constAmount as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does B gain $110 in year 2, not $100?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: a $24,000 car loses 20% a year =====================
const CAR = { P: 24000, b: 0.8 };
const carT = [0, 1, 2, 3, 4], carV = carT.map(t => Math.round(CAR.P * CAR.b ** t * 100) / 100);
function partTurn(): void {
  tr.reset('t.');
  const T = GrowthTable({
    tName: 'year', ts: carT.map(String),
    cols: [{ name: 'value ($)', vals: carV.map((v, i) => (i < 2 ? nH(v) : null)), reveal: carV.map((v, i) => (i < 2 ? null : nH(v))) }],
    ratios: carV.slice(1).map(() => '×0.8'), diffs: carV.slice(1).map((v, i) => '−' + nH(Math.round((carV[i]! - v) * 100) / 100)),
  }, MF, th);
  const G = Plane({ x: { min: 0, max: 14, step: 1, name: 'years' }, y: { min: 0, max: 28000, step: 4000, name: 'value ($)', fmt: v => (v ? nH(v) : '0') }, items: [
    { kind: 'curve', key: 'C', f: t => CAR.P * CAR.b ** t, lo: 0, hi: 14, ends: ['closed', 'none'], col: 'link', name: 'V(t)' },
    ...carT.concat([5, 6, 8, 10, 12, 14]).map((t, i) => ({ kind: 'point' as const, key: `p#${i}`, x: t, y: CAR.P * CAR.b ** t, col: 'first' as Paint })),
  ] }, MF, th);
  const s = 72;
  const L1 = centred('t.L1', 'V(0) = 24{,}000', 140, s, undefined, 'first');
  const L2 = centred('t.L2', '\\cssId{b}{b} = 1 - 0.20 = \\cssId{v}{0.8}', 250, s, { b: teal, v: teal });
  const L3 = centred('t.L3', 'V(t) = 24{,}000\\,(0.8)^{t}', 370, s, undefined, 'link');
  const L4 = centred('t.L4', 'V(2) = 15{,}360', 490, 72);
  const L5 = centred('t.L5', 'V(t) > 0\\ \\text{for every } t', 610, 70, undefined, 'link');
  scene(c => { drawTab(T, 't.', undefined, 't.gone')(c); if (tr.k('t.axes') > 0) drawPlane(G, 't.', { p: 11 })(c); }, [L1, L2, L3, L4, L5]);
  tr.set('t.card', 1, 1.0, 0.2); tr.set('t.rows', 1, 1.4, 0.6); tr.set('t.L1', 1, 0.9, 1.0);
  let step = 0;
  const STEPS = [
    { t: 'Year 1', why: 'Done for you: 24,000 → 19,200.' },
    { t: 'The factor b', why: 'Your step.' },
    { t: 'The model', why: 'Your step.' },
    { t: 'After 2 years', why: 'Your step.' },
    { t: 'Ever $0?', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s0, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s0.t), h('span', { class: 'why' }, s0.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(3.0); if (!alive()) return;
    step = 1; drawPlan(); askB();
  });
  function opts(id: string, list: { t: string; ok: boolean; id: string; mc?: string }[], log: { item: string; prompt: string; expected: string }, onOk: () => void): HTMLElement {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    let done = false;
    list.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: log.item, prompt: log.prompt, response: o.t.replace(/<[^>]+>/g, ''), expected: log.expected, correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (o.ok) { done = true; onOk(); }
    })));
    return h('div', {}, voiced(id), bx, fbHost);
  }
  function askB(): void {
    work.replaceChildren(opts('t.b', [
      { t: '<i>b</i> = 0.8', ok: true, id: 't.b.ok' },
      { t: '<i>b</i> = 0.2', ok: false, id: 't.b.rate', mc: MC.rate },
      { t: '<i>b</i> = −0.2', ok: false, id: 't.b.neg', mc: MC.negFactor },
      { t: '<i>b</i> = 1.2', ok: false, id: 't.b.up' },
    ], { item: 'turn.factor', prompt: 'A car loses 20% of its value each year: the yearly factor b?', expected: '0.8' }, () => seq(async alive => {
      tr.set('t.ratios', 1, 2.0); tr.set('t.L2', 1, 1.0, 0.6); await wait(2.2); if (!alive()) return;
      step = 2; drawPlan(); askModel();
    })));
  }
  function askModel(): void {
    work.replaceChildren(opts('t.model', [
      { t: '<i>V</i>(<i>t</i>) = 24,000(0.8)<sup><i>t</i></sup>', ok: true, id: 't.model.ok' },
      { t: '<i>V</i>(<i>t</i>) = 24,000 − 4,800<i>t</i>', ok: false, id: 't.model.lin', mc: MC.constAmount },
      { t: '<i>V</i>(<i>t</i>) = (24,000 · 0.8)<sup><i>t</i></sup>', ok: false, id: 't.model.part', mc: MC.wrongPart },
    ], { item: 'turn.model', prompt: '$24,000 car, loses 20% a year: V(t)?', expected: 'V(t) = 24,000(0.8)^t' }, () => seq(async alive => {
      tr.set('t.L3', 1, 1.0); tr.set('t.L2:dim', 1, 0.5); await wait(1.4); if (!alive()) return;
      step = 3; drawPlan(); askV2();
    })));
  }
  function askV2(): void {
    const fbHost = h('div'), inp = numInput('dollars', () => check()), chk = btn('Check', () => check(), 'go');
    let done = false;
    function check(): void {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number of dollars.')); return; }
      const ok = Math.abs(r.v - 15360) < 0.005, lin = Math.abs(r.v - 14400) < 0.005;
      ctx.store.log({ part: 'turn', item: 'turn.value2', prompt: 'V(t) = 24,000(0.8)^t: value after 2 years?', response: r, expected: 15360, correct: ok, mc: lin ? MC.constAmount : undefined });
      fbHost.replaceChildren(voicedFb(ok ? 't.v2.ok' : lin ? 't.v2.lin' : 't.v2.other', ok));
      if (!ok) return;
      done = true; chk.disabled = true;
      seq(async alive => {
        tr.set('t.reveal', 1, 1.6); tr.set('t.diffs', 1, 1.8, 0.4); tr.set('t.L4', 1, 1.0, 0.4); tr.set('t.L3:dim', 1, 0.5); await wait(2.4); if (!alive()) return;
        step = 4; drawPlan(); askZero();
      });
    }
    work.replaceChildren(voiced('t.v2'), inp.node, h('div', { class: 'row' }, chk), fbHost);
    setTimeout(() => inp.focus(), 50);
  }
  function askZero(): void {
    work.replaceChildren(opts('t.zero', [
      { t: 'No: 80% of a positive value is still positive, so it only gets closer to $0', ok: true, id: 't.zero.ok' },
      { t: 'Yes: after 5 years, because 5 × 20% = 100%', ok: false, id: 't.zero.five', mc: MC.addPct },
      { t: 'Yes: after about 5 years it drops below $0', ok: false, id: 't.zero.neg', mc: MC.negOut },
    ], { item: 'turn.zero', prompt: 'V(t) = 24,000(0.8)^t: does the value ever reach $0?', expected: 'No' }, () => seq(async alive => {
      tr.set('t.gone', 1, 0.8); await wait(0.6); if (!alive()) return;
      tr.set('t.axes', 1, 1.0); await wait(0.8); if (!alive()) return;
      tr.set('t.p', 1, 2.0); tr.set('t.C', 1, 2.4, 0.6); await wait(2.6); if (!alive()) return;
      tr.set('t.L5', 1, 1.0); tr.set('t.L4:dim', 1, 0.5); await wait(1.2); if (!alive()) return;
      step = 5; drawPlan();
      work.append(callback());
    })));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.id : 'q.cb.none', 'p', '', cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : ''), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Maya's three ratios =====================
function partProve(): void {
  tr.reset('p.');
  const T = GrowthTable({
    tName: 't', ts: ['0', '1', '2', '3', 't', 't + 1'],
    cols: [{ name: 'f(t)', vals: ['5', '15', '45', '135', '5 · 3ᵗ', null], reveal: [null, null, null, null, null, '5 · 3ᵗ · 3'] }],
    ratios: ['×3', '×3', '×3', null, '×3'],
  }, MF, th);
  const s = 70;
  const B1 = centred('p.B1', 'f(t) = \\cssId{a}{5}\\cdot \\cssId{b}{3}^{t}', 140, 80, { a: amber, b: teal });
  const K = centred('p.K', '\\text{Maya: } t = 0, 1, 2\\ \\checkmark', 250, 62, undefined, 'pick');
  const C1 = centred('p.C1', 'f(t+1) = 5\\cdot 3^{t+1}', 380, s);
  const C2 = centred('p.C2', '= 5\\cdot 3^{t}\\cdot 3 = 3\\,f(t)', 490, s);
  const C3 = centred('p.C3', '\\dfrac{f(t+1)}{f(t)} = 3', 640, s, undefined, 'link');
  const C4 = centred('p.C4', '\\text{for every } t', 770, 66, undefined, 'link');
  const focus = (): TabFocus => ({
    ring: [...[0, 1, 2, 3].map(r => ({ row: r, col: 'pick' as Paint, k: tr.k('p.maya') })), { row: 4, col: 'second', k: tr.k('p.rt') }, { row: 5, col: 'link', k: tr.k('p.rt1') }],
    rUpto: tr.k('p.gen') > 0.5 ? 5 : 3,
    rowA: i => (i >= 4 ? tr.k('p.gen') : 1),
  });
  scene(drawTab(T, 'p.', focus), [B1, K, C1, C2, C3, C4]);
  tr.set('p.card', 1, 1.0, 0.2); tr.set('p.rows', 1, 1.6, 0.6); tr.set('p.ratios', 1, 1.6, 1.6);
  tr.set('p.B1', 1, 0.9, 1.0); tr.set('p.K', 1, 0.9, 2.6); tr.set('p.maya', 1, 0.6, 2.8);
  const CHIPS = [
    { t: 'Put t + 1 in place of t in f(t) = 5 · 3ᵗ.', fits: 0 },
    { t: '3ᵗ⁺¹ = 3ᵗ · 3¹: multiplying powers of 3 adds exponents.', fits: 1 },
    { t: 'f(t) = 5 · 3ᵗ is never 0, so we may divide by it, and t was any number.', fits: 2 },
    { t: 'It works for t = 0, 1 and 2.', fits: -1, mc: MC.examples, id: 'p.no.examples' },
    { t: 'f(t + 1) = f(t) + 1.', fits: -1, mc: MC.shiftAdd, id: 'p.no.shift' },
    { t: '3ᵗ⁺¹ = 3ᵗ + 3.', fits: -1, mc: MC.distrib, id: 'p.no.sum' },
  ];
  const CLAIMS = ['f(t + 1) = 5 · 3ᵗ⁺¹,', '= 5 · 3ᵗ · 3 = 3 · f(t),', 'So f(t + 1) ÷ f(t) = 3 for every t,'];
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!, response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) { tr.set('p.maya', 0, 0.4); tr.set('p.K:dim', 1, 0.5); tr.set('p.gen', 1, 1.0); tr.set('p.rt', 1, 0.6, 0.6); tr.set('p.C1', 1, 1.0, 0.4); await wait(1.4); }
      if (n === 2) { tr.set('p.reveal', 1, 1.0); tr.set('p.rt1', 1, 0.6, 0.4); tr.set('p.C2', 1, 1.0, 0.6); await wait(1.6); }
      if (n === 3) {
        tr.set('p.rt', 0, 0.4); tr.set('p.rt1', 0, 0.4); tr.set('p.C3', 1, 1.0); tr.set('p.C4', 1, 0.9, 0.5); await wait(1.4); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Yes, that proves it', () => judge(true)), no = btn('No, not a proof yet', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Maya: f(t) = 5·3^t has ratio 3 at t = 0, 1, 2, so the ratio is 3 for every t. A proof?', response: right ? 'yes' : 'no', expected: 'no', correct: !right, mc: right ? MC.examples : undefined });
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
    show: it => showItem(it as QItem),
  });
}
/** the board TeX of an item as lines (split at \qquad), centred in `area` */
function boardLines(src: string, area: Box, size: number): Line[] {
  const parts = src.split(/\\qquad\s*/).map(p0 => p0.trim()).filter(Boolean);
  if (!parts.length) return [];
  let sz = size;
  while (sz > 60 && parts.some(p0 => texWidth(tex(p0) as Formula, sz) > area.w - 90)) sz -= 2;
  const gap = Math.min(sz * 1.6, (area.h - 60) / parts.length);
  const y0 = area.y0 + 40 + gap / 2;
  return parts.map((p0, i) => centred(`x.B${i}`, p0, y0 + i * gap, sz, undefined, undefined, area.cx, area.w - 90));
}
function showItem(item: QItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic: Pic = item.picture ?? {};
  // the plane on the left; with a graph, the table sits on the board above the notation
  let G: PlaneBlock | null = null, T: TabBlock | null = null, tOnBoard = false;
  if (pic.g) { const m = tryBlock(() => planeOf(pic.g!, MF, th)); if (m.ok) G = m.value; else console.warn(m.error); }
  if (pic.t) {
    const rows = pic.t.ts.length;
    if (G) {
      const hT = Math.min(110 + rows * 86, 640);
      const m = tryBlock(() => tableOf(pic.t!, frame(BOARD.x0 + 16, BOARD.y0 + 20, BOARD.w - 32, hT), th, true));
      if (m.ok) { T = m.value; tOnBoard = true; } else console.warn(m.error);
    } else {
      const m = tryBlock(() => tableOf(pic.t!, MF, th));
      if (m.ok) T = m.value; else console.warn(m.error);
    }
  }
  if (!G && !T) {
    // no picture: a big slate with the board
    const big = box(200, 200, 1720, 880);
    const lines = boardLines(item.board || '\\text{?}', big, 100);
    const total = lines.length > 1 ? lines[lines.length - 1]!.y - lines[0]!.y : 0;
    const dy = big.cy - total / 2 - (lines[0]?.y ?? 0);
    for (const L of lines) L.y += dy;
    setScene({ lines, leads: [], boardBox: big, table: 1080 });
    lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.1 + i * 0.25));
    return {};
  }
  const area = tOnBoard ? box(BOARD.x0, T!.box.y1 + 20, BOARD.x1, BOARD.y1) : box(BOARD.x0, BOARD.y0, BOARD.x1, BOARD.y0 + 560);
  const lines = area.h > 160 ? boardLines(item.board, area, tOnBoard ? 64 : 76) : [];
  const counts: Record<string, number> = {};
  for (const it of [...(pic.g?.items ?? []), ...(pic.g?.solveItems ?? [])]) if (it.kind === 'pts') counts[it.key] = it.xs.length; else if (it.kind === 'dots') counts[it.key] = it.pts.length;
  const solveKeys = (pic.g?.solveItems ?? []).map(i => i.key);
  const hot = pic.t?.hot;
  // question labels (leading entries of ratios / diffs) show with the question; the rest wait for the replay
  const lead = (xs?: (string | null)[]) => { if (!xs) return 0; const i = xs.findIndex(x => x === null); return i < 0 ? xs.length : i; };
  const qR = lead(pic.t?.ratios), qD = lead(pic.t?.diffs), nRows = pic.t?.ts.length ?? 0;
  const tab: Painter = c => {
    const done = tr.k('x.solved') > 0.5;
    if (T) drawTab(T, 'x.t.', () => ({ hot: tr.k('x.hot') > 0.5 ? hot : undefined, rUpto: done ? nRows : qR, dUpto: done ? nRows : qD }))(c);
  };
  // a table on the board is drawn after the board's slate (extra), else it would sit under it
  scene(c => { if (G) drawPlane(G, 'x.g.', counts)(c); if (!tOnBoard) tab(c); }, lines, tOnBoard ? tab : undefined);
  tr.set('x.g.axes', 1, 0.8, 0.1);
  for (const it of pic.g?.items ?? []) tr.set('x.g.' + it.key, 1, it.kind === 'exp' || it.kind === 'line' ? 1.6 : 1.0, 0.6);
  tr.set('x.t.card', 1, 0.8, 0.1); tr.set('x.t.rows', 1, 1.0, 0.4);
  if (qR) tr.set('x.t.ratios', 1, 1.2, 1.0);
  if (qD) tr.set('x.t.diffs', 1, 1.2, 1.2);
  lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.2 + i * 0.25));
  return {
    solve: async alive => {
      if (pic.t?.cols.some(c0 => c0.reveal)) { tr.set('x.t.reveal', 1, 1.2); await wait(1.2); if (!alive()) return; }
      tr.set('x.solved', 1, 0.1);
      if (pic.t?.solveDiffs && !qD) { tr.set('x.t.diffs', 1, 1.4); await wait(1.4); if (!alive()) return; }
      if (pic.t?.solveRatios && !qR) { tr.set('x.t.ratios', 1, 1.4); await wait(1.4); if (!alive()) return; }
      if (hot?.length) tr.set('x.hot', 1, 0.3);
      for (const k of solveKeys) { tr.set('x.g.' + k, 1, 1.2); await wait(1.0); if (!alive()) return; }
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['B(t) = 1000\\,(1.1)^{t} \\to \\times 1.1 \\approx 6727.50 \\checkmark \\dfrac{f(t+1)}{f(t)}', '\\text{differences: } +100,\\ \\$ 24{,}000 \\cdot 0.8^{2} \\left(\\tfrac{1}{2}\\right) \\le \\ge'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
