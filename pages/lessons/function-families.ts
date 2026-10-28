// function-families.ts: "Linear, quadratic or exponential?" (Algebra 1, lesson 19, secondary-t6-34) on the shared
// lesson runtime. The model is the DiffTable (src/lesson/topics/function-families/DiffTable.ts): a table of values with
// the three family tests as staggered columns beside it (the x-steps, 1st differences, 2nd differences, ratios), each
// ringed when it passes and drawn in the wrong colour when it fails. Graphs use the shared kit's Plane.
//   1 The question   a sensor logs 2, 4, 8, 14, 22: linear, quadratic or exponential? (cards; the first rows double)
//   2 Worked example check the x-steps → ratios (×2, ×2, ×1.75: not exponential) → 1st differences (not linear) →
//                    2nd differences +2, +2, +2 (quadratic, y = x² + x + 2); one "why did the doubling not prove it?"
//   3 Your turn      x = 0, 2, 4, 6, 8; y = 3, 6, 12, 24, 48: the kid checks the steps, types a 1st difference, decides
//                    whether changing differences mean quadratic, types a ratio, and names the family (×2 per step of 2)
//   4 Prove it       Sam: equal differences in a table, "so linear, proved". Judge (a second rule g agrees on all five
//                    rows and differs at x = 5), then a because-chain for the true direction: f(x + h) − f(x) = mh
//   5 Practice       all 26 sub-goals one after another, then mixed (runtime/practice.ts); each item's table or graph,
//                    the test columns and solve items waiting for the replay after a miss
// Voiced lines: src/lesson/topics/function-families/script.ts (→ voice/lines.json). Every answer is logged.
import { type Canvas } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, MF, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { Plane, type PlaneBlock } from '../../src/lesson/kit/Plane';
import { DiffTable, type DiffBlock, type DFocus, type DKind } from '../../src/lesson/topics/function-families/DiffTable';
import { planeParams, tableParams } from '../../src/lesson/topics/function-families/pictures';
import { FAMILY_NAMES, GENERATORS, MC, type QItem } from '../../src/lesson/topics/function-families/items';
import type { Pic } from '../../src/lesson/topics/function-families/common';
import { PLAN } from '../../src/lesson/topics/function-families/plan';
import { explain } from '../../src/lesson/topics/function-families/explain';
import { SCRIPT } from '../../src/lesson/topics/function-families/script';

const SLUG = 'function-families';
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
function centred(key: string, src: string, y: number, size: number, col?: Paint, cx = BOARD.cx, maxW = BOARD_W): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: cx - b.cx, y, size: s, col };
}
type Painter = (c: Canvas) => void;
function scene(model: Painter, lines: Line[], extra?: Painter): void { setScene({ table: 1080, lines, leads: [], extra, model }); }
/** a DiffTable whose steps are `${pre}card`, `rows`, `dx`, `d1`, `d2`, `rt`, `reveal` */
const drawTab = (T: DiffBlock, pre: string, f?: () => DFocus): Painter => c => T.draw(c, progressOf(s => tr.k(pre + s)), f?.());
/** the steps of the change columns, glowing when `${pre}glow.<k>` is set, hot when `${pre}hot.<k>` is */
const focusOf = (pre: string, kinds: DKind[]): DFocus => ({
  glow: Object.fromEntries(kinds.map(k => [k, tr.k(`${pre}glow.${k}`)])),
  hot: Object.fromEntries(kinds.map(k => [k, tr.k(`${pre}hot.${k}`) > 0.5])),
});
function choices(list: { t: string; ok: boolean; id: string; mc?: string }[], log: { part: 'example' | 'turn'; item: string; prompt: string; expected: string }, onOk: () => void): HTMLElement {
  const fbHost = h('div'), bx = h('div', { class: 'opts' });
  let done = false;
  list.forEach((o, k) => bx.append(btn(o.t, () => {
    if (done) return;
    bx.querySelectorAll('button').forEach((b0, j) => { b0.classList.remove('right', 'nope'); if (j === k) b0.classList.add(o.ok ? 'right' : 'nope'); });
    ctx.store.log({ part: log.part, item: log.item, prompt: log.prompt, response: o.t.replace(/<[^>]+>/g, ''), expected: log.expected, correct: o.ok, mc: o.mc });
    fbHost.replaceChildren(voicedFb(o.id, o.ok));
    if (o.ok) { done = true; onOk(); }
  })));
  return h('div', {}, bx, fbHost);
}

// ===================== 1. The question =====================
const XS = [0, 1, 2, 3, 4], YS = [2, 4, 8, 14, 22];
function sensorTable(): DiffBlock {
  return DiffTable({
    xName: 'x', xs: XS.map(String), cols: [{ name: 'y', vals: YS.map(String) }],
    dx: ['+1', '+1', '+1', '+1'], d1: ['+2', '+4', '+6', '+8'], d2: ['+2', '+2', '+2'], rt: ['×2', '×2', '×1.75', '≈×1.57'],
  }, MF, th);
}
const CARDS = [
  { t: 'Linear', sub: 'same change', id: 'q.cb.lin', ok: false, mc: undefined as string | undefined },
  { t: 'Quadratic', sub: 'steadily changing change', id: 'q.cb.right', ok: true, mc: undefined as string | undefined },
  { t: 'Exponential', sub: 'same factor', id: 'q.cb.exp', ok: false, mc: MC.initialRows as string | undefined },
];
function partQuestion(): void {
  tr.reset('q.');
  const T = sensorTable();
  const L1 = centred('q.L1', 'y:\\ 2,\\ 4,\\ 8,\\ 14,\\ 22', 200, 76, 'first');
  const L2 = centred('q.L2', '2 \\to 4 \\to 8\\ \\ldots', 330, 72);
  const L3 = centred('q.L3', '\\text{which family?}', 460, 72, 'pick');
  scene(drawTab(T, 'q.'), [L1, L2, L3]);
  tr.set('q.card', 1, 1.0, 0.2); tr.set('q.rows', 1, 1.6, 0.8); tr.set('q.L1', 1, 0.9, 1.0); tr.set('q.L2', 1, 0.9, 1.9); tr.set('q.L3', 1, 0.9, 2.7);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'y = 2, 4, 8, 14, 22 at x = 0..4: linear, quadratic or exponential?', board: 'which family?', response: c.t, expected: 'Quadratic', correct: c.ok, mc: c.mc, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'A sensor log'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const T = sensorTable();
  const L1 = centred('e.L1', '\\Delta x = +1\\ \\text{every row}', 130, 66, 'pick');
  const L2 = centred('e.L2', '\\times 2,\\ \\times 2,\\ \\times 1.75,\\ \\ldots', 245, 64, 'second');
  const L3 = centred('e.L3', '\\text{not exponential}', 340, 62, 'wrong');
  const L4 = centred('e.L4', '+2,\\ +4,\\ +6,\\ +8', 465, 64, 'water');
  const L5 = centred('e.L5', '\\text{not linear}', 560, 62, 'wrong');
  const L6 = centred('e.L6', '+2,\\ +2,\\ +2', 685, 66, 'first');
  const L7 = centred('e.L7', '\\text{quadratic}', 785, 66, 'link');
  const L8 = centred('e.L8', 'y = x^{2} + x + 2', 900, 72, 'link');
  scene(drawTab(T, 'e.', () => focusOf('e.', ['dx', 'd1', 'd2', 'rt'])), [L1, L2, L3, L4, L5, L6, L7, L8]);
  tr.jump('e.card', 1); tr.jump('e.rows', 1);
  let step = 0;
  const STEPS = [
    { t: 'Check the x-steps', why: 'Equal steps first.', act: 'Check' },
    { t: 'Ratios', why: 'Same factor every step?', act: 'Divide' },
    { t: '1st differences', why: 'Same change every step?', act: 'Subtract' },
    { t: '2nd differences', why: 'Does the change change steadily?', act: 'Subtract again' },
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
        tr.set('e.dx', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('e.glow.dx', 1, 0.6); tr.set('e.L1', 1, 1.0); await wait(1.2);
      } else if (i === 1) {
        tr.set('e.glow.dx', 0, 0.4); tr.set('e.L1:dim', 1, 0.5);
        tr.set('e.rt', 1, 2.2); tr.set('e.L2', 1, 1.0, 1.0); await wait(2.4); if (!alive()) return;
        tr.set('e.hot.rt', 1, 0.2); tr.set('e.L3', 1, 0.9); await wait(1.0);
      } else if (i === 2) {
        tr.set('e.L2:dim', 1, 0.5); tr.set('e.L3:dim', 1, 0.5);
        tr.set('e.d1', 1, 2.0); tr.set('e.L4', 1, 1.0, 1.0); await wait(2.2); if (!alive()) return;
        tr.set('e.hot.d1', 1, 0.2); tr.set('e.L5', 1, 0.9); await wait(1.0);
      } else {
        tr.set('e.L4:dim', 1, 0.5); tr.set('e.L5:dim', 1, 0.5);
        tr.set('e.d2', 1, 1.8); tr.set('e.L6', 1, 1.0, 0.9); await wait(2.0); if (!alive()) return;
        tr.set('e.glow.d2', 1, 0.6); tr.set('e.L7', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.L8', 1, 1.0); await wait(1.1);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    after.replaceChildren(voiced('e.why', 'div', 'label'), choices([
      { t: 'A test has to hold on every pair of neighbouring rows; the third ratio is ×1.75', ok: true, id: 'e.why.ok' },
      { t: 'Because 14 is an even number', ok: false, id: 'e.why.even' },
      { t: 'Because an exponential table cannot start at 2', ok: false, id: 'e.why.start' },
    ], { part: 'example', item: 'example.why', prompt: 'Why did the doubling in the first rows not prove exponential?', expected: 'every pair of rows' }, () => {
      after.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    }));
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: 3, 6, 12, 24, 48 at x = 0, 2, 4, 6, 8 =====================
function partTurn(): void {
  tr.reset('t.');
  const T = DiffTable({
    xName: 'x', xs: ['0', '2', '4', '6', '8'], cols: [{ name: 'y', vals: ['3', '6', '12', '24', '48'] }],
    dx: ['+2', '+2', '+2', '+2'], d1: ['+3', '+6', '+12', '+24'], d2: ['+3', '+6', '+12'], rt: ['×2', '×2', '×2', '×2'],
  }, MF, th);
  const L1 = centred('t.L1', '\\Delta x = +2\\ \\checkmark', 130, 66, 'pick');
  const L2 = centred('t.L2', '+3,\\ +6,\\ +12,\\ +24', 250, 64, 'water');
  const L3 = centred('t.L3', '+3,\\ +6,\\ +12', 370, 64, 'first');
  const L4 = centred('t.L4', '\\text{ratio: } \\times 2\\ \\text{every step}', 490, 62, 'second');
  const L5 = centred('t.L5', 'y = 3\\cdot 2^{x/2}', 630, 76, 'link');
  scene(drawTab(T, 't.', () => focusOf('t.', ['dx', 'd1', 'd2', 'rt'])), [L1, L2, L3, L4, L5]);
  tr.set('t.card', 1, 1.0, 0.2); tr.set('t.rows', 1, 1.4, 0.6);
  let step = 0;
  const STEPS = [
    { t: 'The x-steps', why: 'Your step.' }, { t: 'A 1st difference', why: 'Your step.' }, { t: 'Quadratic?', why: 'Your step.' },
    { t: 'A ratio', why: 'Your step.' }, { t: 'The family', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s0, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s0.t), h('span', { class: 'why' }, s0.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn'), voiced('t.intro'), plan, work);
  seq(async alive => { await wait(2.6); if (!alive()) return; askStep(); });
  const nextStep = (n: number, fn: () => void) => { step = n; drawPlan(); fn(); };
  function askStep(): void {
    work.replaceChildren(voiced('t.step'), choices([
      { t: 'Equal steps of +2: the tests apply', ok: true, id: 't.step.ok' },
      { t: 'Not usable: x does not go up by 1', ok: false, id: 't.step.one', mc: MC.inputStep },
      { t: 'Unequal steps: the tests do not apply', ok: false, id: 't.step.uneq' },
    ], { part: 'turn', item: 'turn.steps', prompt: 'x = 0, 2, 4, 6, 8: can the tests be used?', expected: 'equal steps of +2' }, () => seq(async alive => {
      tr.set('t.dx', 1, 1.4); await wait(1.4); if (!alive()) return;
      tr.set('t.glow.dx', 1, 0.5); tr.set('t.L1', 1, 0.9); await wait(1.0); if (!alive()) return;
      tr.set('t.glow.dx', 0, 0.5); nextStep(1, askD1);
    })));
  }
  function numStep(id: string, unit: string, right: number, wrong: [number, string, string | undefined][], other: string, item: string, prompt: string, then: () => void): void {
    const fbHost = h('div'), inp = numInput(unit, () => check()), chk = btn('Check', () => check(), 'go');
    let done = false;
    function check(): void {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number.')); return; }
      const ok = Math.abs(r.v - right) < 1e-9, w = wrong.find(x => Math.abs(r.v - x[0]) < 1e-9);
      ctx.store.log({ part: 'turn', item, prompt, response: r, expected: right, correct: ok, mc: ok ? undefined : w?.[2] });
      fbHost.replaceChildren(voicedFb(ok ? `${id}.ok` : w ? w[1] : other, ok));
      if (!ok) return;
      done = true; chk.disabled = true; then();
    }
    work.replaceChildren(voiced(id), inp.node, h('div', { class: 'row' }, chk), fbHost);
    setTimeout(() => inp.focus(), 50);
  }
  function askD1(): void {
    numStep('t.d1', '', 6, [[2, 't.d1.ratio', MC.expDiffs]], 't.d1.other', 'turn.diff', '1st difference from x = 2 to x = 4 (y = 6 to 12)?', () => seq(async alive => {
      tr.set('t.d1', 1, 1.8); await wait(1.9); if (!alive()) return;
      tr.set('t.hot.d1', 1, 0.2); tr.set('t.L2', 1, 0.9); await wait(1.2); if (!alive()) return;
      nextStep(2, askQuad);
    }));
  }
  function askQuad(): void {
    work.replaceChildren(voiced('t.quad'), choices([
      { t: 'Not yet: check the 2nd differences first', ok: true, id: 't.quad.ok' },
      { t: 'Yes: changing 1st differences mean quadratic', ok: false, id: 't.quad.no', mc: MC.diffOnly },
    ], { part: 'turn', item: 'turn.quad', prompt: '1st differences +3, +6, +12, +24: quadratic?', expected: 'check the 2nd differences' }, () => seq(async alive => {
      tr.set('t.d2', 1, 1.6); await wait(1.7); if (!alive()) return;
      tr.set('t.hot.d2', 1, 0.2); tr.set('t.L3', 1, 0.9); await wait(1.2); if (!alive()) return;
      nextStep(3, askRatio);
    })));
  }
  function askRatio(): void {
    numStep('t.ratio', '', 2, [[6, 't.ratio.diff', MC.expDiffs], [0.5, 't.ratio.other', undefined]], 't.ratio.other', 'turn.ratio', 'ratio 12 ÷ 6?', () => seq(async alive => {
      tr.set('t.rt', 1, 1.8); await wait(1.9); if (!alive()) return;
      tr.set('t.glow.rt', 1, 0.6); tr.set('t.L4', 1, 0.9); await wait(1.2); if (!alive()) return;
      nextStep(4, askFam);
    }));
  }
  function askFam(): void {
    work.replaceChildren(voiced('t.fam'), choices([
      { t: 'Exponential: ×2 for every step of 2 in x', ok: true, id: 't.fam.ok' },
      { t: 'Exponential: ×2 for every 1 unit of x', ok: false, id: 't.fam.unit', mc: MC.inputStep },
      { t: 'Quadratic', ok: false, id: 't.fam.quad', mc: MC.diffOnly },
    ], { part: 'turn', item: 'turn.family', prompt: 'x = 0, 2, 4, 6, 8; y = 3, 6, 12, 24, 48: which family?', expected: 'exponential, ×2 per step of 2' }, () => seq(async alive => {
      tr.set('t.L5', 1, 1.0); await wait(1.2); if (!alive()) return;
      step = 5; drawPlan(); work.append(callback());
    })));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.id : 'q.cb.none', 'p', '', cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : ''), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: equal differences in a table vs a linear rule =====================
function partProve(): void {
  tr.reset('p.');
  const gx = (x: number) => 3 * x + 1 + x * (x - 1) * (x - 2) * (x - 3) * (x - 4) / 4;
  const xs = [0, 1, 2, 3, 4, 5];
  const T = DiffTable({
    xName: 'x', xs: xs.map(String),
    cols: [
      { name: 'f (Sam)', vals: xs.map((x, i) => (i < 5 ? String(3 * x + 1) : null)), reveal: xs.map((x, i) => (i < 5 ? null : String(3 * x + 1))), col: 'water' },
      { name: 'g', vals: xs.map((x, i) => (i < 5 ? String(gx(x)) : null)), reveal: xs.map((x, i) => (i < 5 ? null : String(gx(x)))) },
    ],
    d1: ['+3', '+3', '+3', '+3', '+30'],
  }, MF, th);
  const B1 = centred('p.B1', '+3,\\ +3,\\ +3,\\ +3', 115, 66, 'water');
  const B2 = centred('p.B2', 'g(x) = 3x + 1', 215, 62);
  const B3 = centred('p.B3', '+ \\tfrac{1}{4}x(x-1)(x-2)', 305, 62);
  const B4 = centred('p.B4', '\\cdot (x-3)(x-4)', 395, 62);
  const C1 = centred('p.C1', 'f(x+h) - f(x)', 515, 66);
  const C2 = centred('p.C2', '= m(x+h) + c', 610, 62);
  const C2b = centred('p.C2', '- (mx + c)', 695, 62);
  const C3 = centred('p.C3', '= mh', 800, 76, 'link');
  const C4 = centred('p.C4', '\\text{for every } x', 900, 66, 'link');
  const focus = (): DFocus => ({ upto: { d1: tr.k('p.more') > 0.5 ? 5 : 4 }, ring: [{ row: 5, col: 'wrong', k: tr.k('p.r5') }] });
  scene(drawTab(T, 'p.', focus), [B1, B2, B3, B4, C1, C2, C2b, C3, C4]);
  tr.set('p.card', 1, 1.0, 0.2); tr.set('p.rows', 1, 1.6, 0.6); tr.set('p.d1', 1, 1.4, 1.8); tr.set('p.B1', 1, 0.9, 2.4);
  const CHIPS = [
    { t: 'Put x + h in place of x in f(x) = mx + c.', fits: 0 },
    { t: 'm(x + h) = mx + mh, and mx and c cancel.', fits: 1 },
    { t: 'mh has no x in it: where the step starts does not matter.', fits: 2 },
    { t: 'It works for every row in Sam’s table.', fits: -1, mc: MC.examples, id: 'p.no.examples' },
    { t: 'f(x + h) = f(x) + h.', fits: -1, mc: MC.shiftAdd, id: 'p.no.shift' },
    { t: 'Every table with equal differences comes from a line.', fits: -1, mc: MC.finite, id: 'p.no.converse' },
  ];
  const CLAIMS = ['f(x + h) − f(x) = m(x + h) + c − (mx + c),', '= mh,', 'the same for every x: equal steps give equal differences,'];
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
      tr.set(`p.C${n}`, 1, 1.0); await wait(1.1); if (!alive()) return;
      if (n === 3) {
        tr.set('p.C4', 1, 0.9); await wait(1.0); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Yes, that proves it', () => judge(true)), no = btn('No, not a proof', () => judge(false));
  const proofHost = h('div');
  function judge(said: boolean): void {
    yes.disabled = no.disabled = true;
    (said ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: equal 1st differences in my table, so the rule is linear. Proved?', response: said ? 'yes' : 'no', expected: 'no', correct: !said, mc: said ? MC.finite : undefined });
    seq(async alive => {
      tr.set('p.B2', 1, 0.9); tr.set('p.B3', 1, 0.9, 0.4); tr.set('p.B4', 1, 0.9, 0.8); await wait(1.4); if (!alive()) return;
      tr.set('p.reveal', 1, 1.2); tr.set('p.more', 1, 0.1); tr.set('p.r5', 1, 0.6, 0.6); await wait(1.4); if (!alive()) return;
      for (const k of ['B1', 'B2', 'B3', 'B4']) tr.set(`p.${k}:dim`, 1, 0.5);
    });
    proofHost.replaceChildren(...(said ? [voiced('p.test'), html('p', '', SCRIPT['p.build2']!.html)] : [voiced('p.build')]), chain, chipBox, fbHost);
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
  const gap = Math.min(sz * 1.7, (area.h - 60) / parts.length);
  const y0 = area.y0 + 40 + gap / 2;
  return parts.map((p0, i) => centred(`x.B${i}`, p0, y0 + i * gap, sz, undefined, area.cx, area.w - 90));
}
const KINDS: DKind[] = ['dx', 'd1', 'd2', 'rt'];
function tableOf(t: NonNullable<Pic['t']>, fr: ReturnType<typeof frame>): DiffBlock | null {
  for (const size of [60, 56, 52]) { const m = tryBlock(() => DiffTable(tableParams(t, size), fr, th)); if (m.ok) return m.value; if (size === 52) console.warn(m.error); }
  return null;
}
function showItem(item: QItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic: Pic = item.picture ?? {};
  let G: PlaneBlock | null = null, T: DiffBlock | null = null, tOnBoard = false;
  if (pic.g) { const m = tryBlock(() => Plane(planeParams(pic.g!), MF, th)); if (m.ok) G = m.value; else console.warn(m.error); }
  if (pic.t) {
    if (G) { T = tableOf(pic.t, frame(BOARD.x0 + 16, BOARD.y0 + 20, BOARD.w - 32, Math.min(110 + pic.t.xs.length * 86, 640))); tOnBoard = !!T; }
    else T = tableOf(pic.t, MF);
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
  const area = tOnBoard ? box(BOARD.x0, T!.box.y1 + 20, BOARD.x1, BOARD.y1) : box(BOARD.x0, BOARD.y0, BOARD.x1, BOARD.y0 + 620);
  const lines = area.h > 160 ? boardLines(item.board, area, tOnBoard ? 64 : 76) : [];
  const S = pic.t?.solve;
  const qKinds = KINDS.filter(k => pic.t?.[k]), sKinds = KINDS.filter(k => S?.[k]);
  const tab: Painter = c => { if (T) drawTab(T, 'x.t.', () => ({ hot: Object.fromEntries((S?.hot ?? []).map(k => [k, tr.k('x.solved') > 0.5])), glow: Object.fromEntries((S?.glow ?? []).map(k => [k, tr.k('x.glow')])) }))(c); };
  const plane: Painter = c => { if (G) G.draw(c, progressOf(s => tr.k('x.g.' + s))); };
  scene(c => { plane(c); if (!tOnBoard) tab(c); }, lines, tOnBoard ? tab : undefined);
  tr.set('x.g.axes', 1, 0.8, 0.1);
  for (const it of pic.g?.items ?? []) tr.set('x.g.' + it.key, 1, it.kind === 'fn' ? 1.6 : 0.8, 0.6);
  tr.set('x.t.card', 1, 0.8, 0.1); tr.set('x.t.rows', 1, 1.0, 0.4);
  qKinds.forEach((k, i) => tr.set('x.t.' + k, 1, 1.2, 1.0 + i * 0.4));
  lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.2 + i * 0.25));
  return {
    solve: async alive => {
      if (pic.t?.cols.some(c0 => c0.reveal)) { tr.set('x.t.reveal', 1, 1.2); await wait(1.2); if (!alive()) return; }
      for (const k of sKinds) { tr.set('x.t.' + k, 1, 1.4); await wait(1.3); if (!alive()) return; }
      if (S?.hot?.length || S?.glow?.length) { tr.set('x.solved', 1, 0.2); tr.set('x.glow', 1, 0.6); await wait(0.6); if (!alive()) return; }
      for (const it of pic.g?.solve ?? []) { tr.set('x.g.' + it.key, 1, 1.2); await wait(1.0); if (!alive()) return; }
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['y = x^{2} + x + 2 \\times 1.75 \\Delta x = +1 \\checkmark \\text{not exponential} 2 \\to 4 \\ldots', 'f(x+h) - f(x) = m(x+h) + c - (mx + c) = mh \\tfrac{1}{4}x(x-1) 3\\cdot 2^{x/2} \\dfrac{\\Delta y}{\\Delta x} \\le \\ge \\sqrt{x} \\sqrt[3]{x} \\left|x\\right| \\log_{2}(x)'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
