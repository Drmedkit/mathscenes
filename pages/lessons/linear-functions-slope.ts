// linear-functions-slope.ts: "Linear functions and slope" (Algebra 1, lesson 5; secondary-t6-09) on the shared lesson
// runtime. Every graph is the shared kit's Plane (src/lesson/kit/Plane.ts).
//   1 The question   the line through A(−2, 7) and B(4, −2): what is its slope? 3 cards (−3/2; −2/3 = rise and run
//                    swapped; 3/2 = opposite subtraction orders) + how sure
//   2 Worked example four steps on the plane: slope from two points (run and rise arrows), ANY point P(x, y) has the
//                    same slope from A (a trace point rides the line) -> point-slope form, y alone -> slope-intercept
//                    form and the y-intercept, clear the fraction -> standard form, the zero and the check; one "why?"
//   3 Your turn      C(−1, 5), D(3, −3), faded from the end: the slope is given; the kid writes point-slope form,
//                    finds b, picks the standard form; the plane backs each answer
//   4 Prove it       Riley: (2, 5), (2, −1) "slope 0, a flat line, a function". A because-chain from reason chips
//                    (distractors = catalogue misconceptions): undefined, not 0 / a flat line has rise 0 / x = 2 is
//                    not a function
//   5 Practice       all 31 sub-goals one after another, then mixed (runtime/practice.ts); Plane, table and number
//                    line pictures, the worked solution replayed on the picture after a miss
// Voiced lines: src/lesson/topics/linear-functions-slope/script.ts -> voice/lines.json. Every answer is logged.
import { type Canvas, strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { MF, bigLine, type Line, line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { PFocus, PlaneBlock } from '../../src/lesson/kit/Plane';
import { drawWords } from '../../src/lesson/words';
import { type GItem, type GPic, planeOf, riseRun, stepOf } from '../../src/lesson/topics/linear-functions-slope/graphPic';
import { TableCard, type TableStep } from '../../src/lesson/topics/linear-functions-slope/TableCard';
import { NumberLine, type NLStep } from '../../src/lesson/topics/linear-functions-slope/NumberLine';
import { FAMILY_NAMES, GENERATORS, MC, type LItem } from '../../src/lesson/topics/linear-functions-slope/items';
import { PLAN } from '../../src/lesson/topics/linear-functions-slope/plan';
import { explain } from '../../src/lesson/topics/linear-functions-slope/explain';
import { LINES } from '../../src/lesson/topics/linear-functions-slope/script';
import { fr } from '../../src/lesson/runtime/item';

const SLUG = 'linear-functions-slope';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: shows LINES[id].html and speaks it */
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  const L = LINES[id];
  if (!L) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, L?.html ?? id);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, LINES[id]?.html ?? id); }

// ===================== the plane of a part: a GPic drawn with the kit's Plane, steps under a prefix =====================
interface Scene2 { P: PlaneBlock; draw(c: Canvas, f?: PFocus): void }
function planeScene(pre: string, g: GPic): Scene2 {
  const P = planeOf(g, MF, th);
  const prog = progressOf<string>(s => tr.k(pre + stepOf(s)));
  return { P, draw: (c, f) => P.draw(c, prog, f) };
}
const ring = (pre: string, key: string, col: 'link' | 'pick' | 'wrong' | 'first' | 'second' = 'pick') => ({ key, col, k: tr.k(pre + 'r.' + key) });

// ===================== parts 1-2: the line through A(−2, 7) and B(4, −2) =====================
const A_: [number, number] = [-2, 7], B_: [number, number] = [4, -2];
const f1 = (x: number) => -1.5 * x + 4;
const G1: GPic = {
  x: { min: -6, max: 8, step: 1, name: 'x' }, y: { min: -4, max: 10, step: 1, name: 'y' }, equal: true,
  items: [
    { kind: 'line', key: 'L', m: -1.5, b: 4 },
    // A's name below-left of A, away from the run arrow and the line (the kit places names off curves, not off segments)
    { kind: 'point', key: 'A', x: A_[0], y: A_[1] },
    { kind: 'text', key: 'An', x: -2.35, y: 6.2, text: 'A(−2, 7)', col: 'first', align: 'right' },
    { kind: 'point', key: 'B', x: B_[0], y: B_[1], name: 'B(4, −2)' },
    ...riseRun('', A_, B_, 1, 1, 'run 6', 'rise −9'),
    { kind: 'point', key: 'Y', x: 0, y: 4, name: '(0, 4)', col: 'link' },
    { kind: 'point', key: 'Z', x: 8 / 3, y: 0, name: '(8/3, 0)', col: 'link' },
  ],
  show: [], solve: [],
};
/** the general point P(x, y) on the line and the dashed run / rise from A to it (step 2 of the example) */
function apTriangle(c: Canvas, S: Scene2, x: number, k: number): void {
  if (k <= 0) return;
  const a = S.P.px(A_[0], A_[1]), corner = S.P.px(x, A_[1]), p = S.P.px(x, f1(x)), { g } = c;
  g.save(); g.globalAlpha *= k; g.setLineDash([12, 10]); g.lineWidth = 4; g.lineCap = 'round';
  g.strokeStyle = '#F2B66B'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(corner[0], corner[1]); g.stroke();
  g.strokeStyle = '#7FD6C8'; g.beginPath(); g.moveTo(corner[0], corner[1]); g.lineTo(p[0], p[1]); g.stroke();
  g.restore();
  drawWords(c, 'x + 2', (a[0] + corner[0]) / 2, a[1] - 36, 'first', k, { size: 44, align: 'center', weight: 700 });
  drawWords(c, 'y − 7', corner[0] + 18, (corner[1] + p[1]) / 2, 'second', k, { size: 44, weight: 700 });
}

// ===================== 1. The question =====================
const CARDS = [
  { v: `−${fr(3, 2)}`, t: '−3/2', id: '', why: 'q.cb.right' },
  { v: `−${fr(2, 3)}`, t: '−2/3', id: MC.inverted, why: 'q.cb.inv' },
  { v: fr(3, 2), t: '3/2', id: MC.order, why: 'q.cb.order' },
];
function partQuestion(): void {
  tr.reset('q.');
  const S = planeScene('q.', G1);
  const lines = [line('q.T1', 'A(-2,\\ 7)\\quad B(4,\\ -2)', 170, 70), line('q.T2', 'm = \\,?', 320, 84)];
  setScene({ model: c => S.draw(c), lines, leads: [] });
  tr.set('q.axes', 1, 1.0); tr.set('q.L', 1, 1.2, 0.8); tr.set('q.A', 1, 0.6, 1.6); tr.set('q.An', 1, 0.6, 1.7); tr.set('q.B', 1, 0.6, 1.9);
  tr.set('q.T1', 1, 1.0, 2.2); tr.set('q.T2', 1, 0.8, 2.8);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'The line through A(−2, 7) and B(4, −2): what is its slope?', board: 'm = ?', response: c.t, expected: '−3/2', correct: c.id === '', mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  // the cards in a fixed order where the right one is not first; commit().pick is the CARDS index
  const order = [2, 0, 1];
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', commit().pick === order[j]));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  order.forEach(i => { const cd = CARDS[i]!; const b = h('button'); b.innerHTML = `<span>${cd.v}</span><small>slope</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'One slope, two points'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function exampleBoard(pre: string): Line[] {
  const lime = { col: 'link' as const }, amber = { col: 'first' as const }, teal = { col: 'second' as const };
  return [
    line(pre + 'F1', 'm = \\frac{\\cssId{dy}{y_2 - y_1}}{\\cssId{dx}{x_2 - x_1}}', 150, 72, { dy: teal, dx: amber }),
    line(pre + 'F2', '= \\frac{\\cssId{dy}{-2 - 7}}{\\cssId{dx}{4 - (-2)}} = \\cssId{m}{-\\frac{3}{2}}', 300, 68, { dy: teal, dx: amber, m: lime }),
    line(pre + 'P1', '\\frac{\\cssId{dy}{y - 7}}{\\cssId{dx}{x - (-2)}} = -\\frac{3}{2}', 445, 64, { dy: teal, dx: amber }),
    line(pre + 'P2', '\\cssId{e}{y - 7 = -\\tfrac{3}{2}(x + 2)}', 570, 66, { e: lime }),
    line(pre + 'S1', '\\cssId{e}{y = -\\tfrac{3}{2}x + \\cssId{b}{4}}', 680, 66, { e: lime }),
    line(pre + 'T1', '\\cssId{e}{3x + 2y = 8}', 790, 66, { e: lime }),
    line(pre + 'K', '3(4) + 2(-2) = 8\\ \\checkmark', 905, 60),
  ];
}
function partExample(): void {
  tr.reset('e.');
  const S = planeScene('e.', G1);
  const lines = exampleBoard('e.');
  const trX = () => 5 - 5 * tr.k('e.tx') + 2 * tr.k('e.tx2');
  setScene({
    model: c => {
      S.draw(c, { dim: tr.k('e.dimRR') > 0.5 ? ['run', 'rise'] : [], trace: { key: 'L', x: trX(), k: tr.k('e.P') }, ring: [ring('e.', 'A'), ring('e.', 'Y', 'link'), ring('e.', 'Z', 'link'), ring('e.', 'B')] });
      apTriangle(c, S, trX(), tr.k('e.tri'));
    },
    lines, leads: [],
  });
  for (const k of ['axes', 'L', 'A', 'An', 'B']) tr.jump('e.' + k, 1);
  let step = 0;
  const STEPS = [
    { t: 'Slope from two points', why: 'Run and rise from A to B.', act: 'Go A to B' },
    { t: 'Any point P(x, y)', why: 'The same slope from A: point-slope form.', act: 'Slide P' },
    { t: 'Get y alone', why: 'Slope-intercept form.', act: 'Solve for y' },
    { t: 'Clear the fraction', why: 'Standard form, the zero, a check.', act: 'Rewrite' },
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
        tr.set('e.run', 1, 1.2); await wait(1.0); if (!alive()) return;
        tr.set('e.runT', 1, 0.6); tr.set('e.rise', 1, 1.4, 0.3); await wait(1.5); if (!alive()) return;
        tr.set('e.riseT', 1, 0.6); tr.set('e.F1', 1, 1.2, 0.3); await wait(1.6); if (!alive()) return;
        tr.set('e.F2', 1, 1.6); await wait(1.8);
      } else if (i === 1) {
        tr.set('e.runT', 0, 0.5); tr.set('e.riseT', 0, 0.5); tr.set('e.dimRR', 1, 0.3); tr.set('e.F1:dim', 1, 0.5); tr.set('e.F2:dim', 1, 0.5);
        tr.set('e.P', 1, 0.6); tr.set('e.tri', 1, 0.8, 0.3); await wait(0.8); if (!alive()) return;
        tr.set('e.tx', 1, 3.0); await wait(3.1); if (!alive()) return;
        tr.set('e.tx2', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('e.P1', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.P2', 1, 1.2); tr.set('e.r.A', 1, 0.5, 0.4); await wait(1.6); if (!alive()) return;
        tr.set('e.r.A', 0, 0.6);
      } else if (i === 2) {
        tr.set('e.tri', 0, 0.6); tr.set('e.P', 0, 0.6); tr.set('e.P1:dim', 1, 0.5);
        tr.set('e.S1', 1, 1.2, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('e.Y', 1, 0.7); tr.set('e.r.Y', 1, 0.5, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('e.r.Y', 0, 0.6);
      } else {
        tr.set('e.P2:dim', 1, 0.5);
        tr.set('e.T1', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.Z', 1, 0.7); tr.set('e.r.Z', 1, 0.5, 0.3); await wait(1.3); if (!alive()) return;
        tr.set('e.r.Z', 0, 0.6); tr.set('e.r.B', 1, 0.5); tr.set('e.K', 1, 1.2, 0.2); await wait(1.5); if (!alive()) return;
        tr.set('e.r.B', 0, 0.6);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'A line has the same slope between any two of its points.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'Point-slope form only works with the first point you are given.', ok: false, id: 'e.why.first', mc: MC.uniqueEq as string | undefined },
      { t: 'Because x and y are the coordinates of A.', ok: false, id: 'e.why.slots', mc: MC.slots as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why could any point P(x, y) of the line go into the slope formula with A?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: C(−1, 5), D(3, −3) =====================
const C_: [number, number] = [-1, 5], D_: [number, number] = [3, -3];
const G3: GPic = {
  x: { min: -5, max: 7, step: 1, name: 'x' }, y: { min: -4, max: 8, step: 1, name: 'y' }, equal: true,
  items: [
    { kind: 'line', key: 'L', m: -2, b: 3 },
    { kind: 'point', key: 'C', x: C_[0], y: C_[1] },
    { kind: 'text', key: 'Cn', x: -1.3, y: 4.25, text: 'C(−1, 5)', col: 'first', align: 'right' },
    { kind: 'point', key: 'D', x: D_[0], y: D_[1], name: 'D(3, −3)' },
    ...riseRun('', C_, D_, 1, 1, 'run 4', 'rise −8', { riseY: 3 }),
    { kind: 'point', key: 'Y', x: 0, y: 3, name: '(0, 3)', col: 'link' },
    { kind: 'point', key: 'Z', x: 1.5, y: 0, name: '(3/2, 0)', col: 'link' },
  ],
  show: [], solve: [],
};
function partTurn(): void {
  tr.reset('t.');
  const S = planeScene('t.', G3);
  const lime = { col: 'link' as const };
  const lines = [
    line('t.M', 'm = \\frac{-3 - 5}{3 - (-1)} = \\cssId{m}{-2}', 160, 68, { m: lime }),
    line('t.PS', '\\cssId{e}{y - 5 = -2(x + 1)}', 330, 70, { e: lime }),
    line('t.SI', '\\cssId{e}{y = -2x + 3}', 470, 70, { e: lime }),
    line('t.ST', '\\cssId{e}{2x + y = 3}', 610, 70, { e: lime }),
    line('t.K', '2(3) + (-3) = 3\\ \\checkmark', 750, 64),
  ];
  setScene({ model: c => S.draw(c, { ring: [ring('t.', 'C'), ring('t.', 'Y', 'link'), ring('t.', 'Z', 'link'), ring('t.', 'D')] }), lines, leads: [] });
  tr.set('t.axes', 1, 0.9); tr.set('t.L', 1, 1.2, 0.6); tr.set('t.C', 1, 0.6, 1.2); tr.set('t.Cn', 1, 0.6, 1.3); tr.set('t.D', 1, 0.6, 1.4);
  let step = 0;
  const STEPS = [
    { t: 'Slope from two points', why: 'Done for you.' },
    { t: 'Point-slope form', why: 'Your step.' },
    { t: 'Get y alone', why: 'Your step.' },
    { t: 'Standard form', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: C and D'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(2.4); if (!alive()) return;
    tr.set('t.run', 1, 1.0); tr.set('t.runT', 1, 0.6, 0.6); tr.set('t.rise', 1, 1.2, 0.9); tr.set('t.riseT', 1, 0.6, 1.8); tr.set('t.M', 1, 1.2, 2.0);
    await wait(3.4); if (!alive()) return;
    step = 1; drawPlan(); askPS();
  });
  /** a choice step: options with voice ids and catalogue ids; on the right one, `then` */
  function choiceStep(promptId: string, item: string, prompt: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], then: () => void): void {
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item, prompt, response: o.t.replace(/<[^>]+>/g, ''), expected: opts.find(x => x.ok)!.t.replace(/<[^>]+>/g, ''), correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (o.ok) { done = true; then(); }
    })));
    work.replaceChildren(voiced(promptId), bx, fbHost);
  }
  const I = (s: string) => `<i>${s}</i>`;
  function askPS(): void {
    choiceStep('t.ps', 'turn.pointSlope', 'Write the line through C(−1, 5) and D(3, −3) in point-slope form, using C.', [
      { t: `${I('y')} + 5 = −2(${I('x')} − 1)`, ok: false, id: 't.ps.sign', mc: MC.wrongSign },
      { t: `${I('y')} − 5 = −2(${I('x')} + 1)`, ok: true, id: 't.ps.ok' },
      { t: `${I('y')} − 5 = −2(${I('x')} − 3)`, ok: false, id: 't.ps.mix', mc: MC.mixes },
    ], () => seq(async alive => {
      tr.set('t.r.C', 1, 0.5); tr.set('t.PS', 1, 1.2, 0.2); await wait(1.6); if (!alive()) return;
      tr.set('t.r.C', 0, 0.6); step = 2; drawPlan(); askB();
    }));
  }
  function askB(): void {
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.b.empty', false)); return; }
      const v = r.v, right = v === 3;
      const mc = v === 5 ? MC.firstOut : v === 6 ? MC.partialDist : v === -7 ? MC.noSignChange : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.b', prompt: 'y − 5 = −2(x + 1): y = −2x + b, what is b?', board: 'y = -2x + b', response: v, expected: 3, correct: right, mc });
      if (!right) { fbHost.replaceChildren(voicedFb(v === 5 ? 't.b.first' : v === 6 ? 't.b.part' : v === -7 ? 't.b.sign' : 't.b.no', false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.b.ok', true));
      seq(async alive => {
        tr.set('t.PS:dim', 1, 0.5); tr.set('t.SI', 1, 1.2); await wait(1.2); if (!alive()) return;
        tr.set('t.Y', 1, 0.7); tr.set('t.r.Y', 1, 0.5, 0.3); await wait(1.5); if (!alive()) return;
        tr.set('t.r.Y', 0, 0.6); step = 3; drawPlan(); askStd();
      });
    }
    work.replaceChildren(voiced('t.b'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askStd(): void {
    choiceStep('t.std', 'turn.standard', 'y = −2x + 3: which is the standard form Ax + By = C?', [
      { t: `−2${I('x')} + ${I('y')} = 3`, ok: false, id: 't.std.sign', mc: MC.noSignChange },
      { t: `${I('y')} = −2${I('x')} + 3`, ok: false, id: 't.std.alone', mc: MC.stdYAlone },
      { t: `2${I('x')} + ${I('y')} = 3`, ok: true, id: 't.std.ok' },
    ], () => seq(async alive => {
      tr.set('t.SI:dim', 1, 0.5); tr.set('t.ST', 1, 1.2); await wait(1.3); if (!alive()) return;
      tr.set('t.Z', 1, 0.7); tr.set('t.r.Z', 1, 0.5, 0.3); await wait(1.2); if (!alive()) return;
      tr.set('t.r.Z', 0, 0.5); tr.set('t.r.D', 1, 0.5); tr.set('t.K', 1, 1.2, 0.2); await wait(1.6); if (!alive()) return;
      tr.set('t.r.D', 0, 0.6); step = 4; drawPlan(); work.append(callback());
    }));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    const v = voiced(id);
    if (cd) v.append(html('span', 'dim', ` (You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)`));
    c.append(v, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Riley's (2, 5), (2, −1) =====================
const G4: GPic = {
  x: { min: -3, max: 7, step: 1, name: 'x' }, y: { min: -3, max: 7, step: 1, name: 'y' }, equal: true,
  items: [
    { kind: 'line', key: 'H', m: 0, b: 5, dash: true, col: 'wrong' },
    { kind: 'vline', key: 'V', x: 2, col: 'link' },
    { kind: 'seg', key: 'PQ', a: [2, 5], b: [2, -1], col: 'second', arrow: true, w: 7 },
    { kind: 'text', key: 'run0', x: 2.5, y: 1.5, text: 'run 0', col: 'first', align: 'left' },
    { kind: 'point', key: 'P', x: 2, y: 5, name: 'P(2, 5)' },
    { kind: 'point', key: 'Q', x: 2, y: -1, name: 'Q(2, −1)' },
    { kind: 'point', key: 'F', x: 6, y: 5, name: '(6, 5)', col: 'water' },
  ],
  show: [], solve: [],
};
function partProve(): void {
  tr.reset('p.');
  const S = planeScene('p.', G4);
  const lines = [
    line('p.R0', 'm = \\frac{-1 - 5}{2 - 2} \\cssId{z}{= 0}', 160, 72),
    line('p.R1', '\\Delta x = 2 - 2 = 0', 320, 66),
    line('p.R2', '\\frac{-6}{0}\\ \\text{has no value}', 440, 66),
    line('p.R3', '\\frac{5 - 5}{6 - 2} = \\frac{0}{4} = 0', 590, 66),
    line('p.R4', 'x = 2:\\ \\text{not a function}', 740, 64),
  ];
  lines[0]!.col = 'dim';
  const R0 = lines[0]!;
  setScene({
    model: c => S.draw(c, { dim: tr.k('p.Hdim') > 0.5 ? ['H'] : [], ring: [ring('p.', 'P', 'pick'), ring('p.', 'Q', 'pick'), ring('p.', 'F', 'link')] }),
    lines, leads: [],
    extra: c => { const k = tr.k('p.strike'); if (k > 0) { const z = partOf(R0, 'z'); strike(c, z.x0 - 8, z.cy + 6, z.x1 + 8, z.cy - 6, k, { col: 'wrong' }); } },
  });
  tr.set('p.axes', 1, 0.9); tr.set('p.P', 1, 0.6, 0.8); tr.set('p.Q', 1, 0.6, 1.1); tr.set('p.R0', 1, 1.2, 1.6);
  const CHIPS = [
    { t: 'Δx = 2 − 2 = 0, and −6 ÷ 0 has no value.', fits: 0 },
    { t: 'Its rise is 0 over a run of 4: 0 ÷ 4 = 0.', fits: 1 },
    { t: 'The input 2 has two outputs, 5 and −1.', fits: 2 },
    { t: '0 ÷ 6 and 6 ÷ 0 are both 0.', fits: -1, mc: MC.kOverZero, id: 'p.no.k0' },
    { t: 'No slope and slope 0 mean the same thing.', fits: -1, mc: MC.noSlope, id: 'p.no.none' },
    { t: 'A rule with no x in it, like y = 5, is not a function.', fits: -1, mc: MC.constNotFn, id: 'p.no.const' },
  ];
  const CLAIMS = [
    'The slope through P and Q is not 0: it is <b>undefined</b>,',
    'A slope of 0 is a <b>flat</b> line, like the one through (2, 5) and (6, 5),',
    'The line through P and Q is <b><i>x</i> = 2</b>, and it is <b>not a function</b>,',
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) {
        tr.set('p.PQ', 1, 1.0); tr.set('p.run0', 1, 0.6, 0.6); tr.set('p.R1', 1, 1.0, 0.4); await wait(1.6); if (!alive()) return;
        tr.set('p.R2', 1, 1.0); tr.set('p.strike', 1, 0.6, 0.8); await wait(1.6);
      }
      if (n === 2) {
        tr.set('p.Hdim', 0, 0.1); tr.set('p.F', 1, 0.7); tr.set('p.r.F', 1, 0.5, 0.3); tr.set('p.R3', 1, 1.0, 0.5); await wait(1.6); if (!alive()) return;
        tr.set('p.r.F', 0, 0.5); tr.set('p.r.Q', 1, 0.5); await wait(1.2); if (!alive()) return; tr.set('p.r.Q', 0, 0.5); tr.set('p.Hdim', 1, 0.3);
      }
      if (n === 3) {
        tr.set('p.V', 1, 1.2); await wait(1.2); if (!alive()) return;
        tr.set('p.r.P', 1, 0.5); tr.set('p.r.Q', 1, 0.5); tr.set('p.R4', 1, 1.0, 0.3); await wait(1.8); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: through (2, 5) and (2, −1) the slope is −6/0 = 0, a flat line and a function. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.kOverZero : undefined });
    // Riley's flat line through P: it misses Q
    tr.set('p.H', 1, 1.2); tr.set('p.r.Q', 1, 0.5, 1.0); tr.set('p.r.Q', 0, 0.5, 2.4);
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
    show: it => showItem(it as LItem),
  });
}
/** the board of a practice item: its TeX on top, the worked TeX lines under it on the solve */
function boardLines(item: LItem): Line[] {
  const out = [line('x.B', item.board, 160, 80)];
  (item.picture?.tex ?? []).forEach((t, i) => { const L = line(`x.T${i}`, t, 330 + i * 140, 70); L.col = 'link'; out.push(L); });
  return out;
}
async function writeTex(item: LItem, alive: () => boolean): Promise<void> {
  for (let i = 0; i < (item.picture?.tex ?? []).length; i++) { tr.set(`x.T${i}`, 1, 1.0); await wait(0.9); if (!alive()) return; }
}
function showItem(item: LItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.g) {
    const g = pic.g;
    const made = tryBlock(() => planeScene('x.', g));
    if (made.ok) {
      const S = made.value;
      setScene({ model: c => S.draw(c), lines: boardLines(item), leads: [] });
      g.show.forEach((k, i) => tr.set('x.' + k, 1, 0.9, 0.15 * i));
      tr.set('x.B', 1, 0.8, 0.3);
      return { solve: async alive => { for (const k of g.solve) { tr.set('x.' + k, 1, 1.0); await wait(0.6); if (!alive()) return; } await writeTex(item, alive); } };
    }
    console.warn('plane picture did not fit', item.id, made.error);
  }
  if (pic?.t) {
    const t = pic.t;
    const made = tryBlock(() => TableCard(t, MF, th));
    if (made.ok) {
      const T = made.value, P = progressOf<TableStep>(s => tr.k('x.' + s));
      setScene({ model: c => T.draw(c, P, { ring: (t.ring ?? []).map(r => ({ row: r, col: 'link', k: tr.k('x.ring') })) }), lines: boardLines(item), leads: [] });
      tr.set('x.card', 1, 0.8); tr.set('x.rows', 1, 1.2, 0.3); tr.set('x.B', 1, 0.8, 0.3);
      return { solve: async alive => { tr.set('x.diffs', 1, 1.4); tr.set('x.fill', 1, 0.8); await wait(1.0); if (!alive()) return; tr.set('x.ring', 1, 0.6); await wait(0.6); if (!alive()) return; await writeTex(item, alive); } };
    }
    console.warn('table picture did not fit', item.id, made.error);
  }
  if (pic?.n) {
    const nl = pic.n;
    const made = tryBlock(() => NumberLine(nl, MF, th));
    if (made.ok) {
      const N = made.value, P = progressOf<NLStep>(s => tr.k('x.' + s));
      setScene({ model: c => N.draw(c, P), lines: boardLines(item), leads: [] });
      tr.set('x.axes', 1, 0.8); if (nl.given) tr.set('x.set', 1, 1.0, 0.4); tr.set('x.B', 1, 0.8, 0.3);
      return { solve: nl.given ? undefined : async alive => { tr.set('x.set', 1, 1.2); await wait(1.2); if (!alive()) return; await writeTex(item, alive); } };
    }
    console.warn('number line did not fit', item.id, made.error);
  }
  // no picture: the board big on a wide slate, the worked TeX under it
  const big = box(200, 180, 1720, 900);
  const top = bigLine('x.B', item.board, box(big.x0, big.y0, big.x1, big.y0 + 300), 130);
  const sol = (pic?.tex ?? []).map((t, i) => bigLine(`x.T${i}`, t, box(big.x0, big.y0 + 300 + i * 180, big.x1, big.y0 + 480 + i * 180), 100));
  for (const L of sol) L.col = 'link';
  setScene({ lines: [top, ...sol], leads: [], boardBox: big });
  tr.set('x.B', 1, 0.8, 0.1);
  return { solve: sol.length ? async alive => writeTex(item, alive) : undefined };
}

void runLesson({
  slug: SLUG,
  warm: ['m = \\frac{y_2 - y_1}{x_2 - x_1}', '\\checkmark', '\\Delta x\\ \\text{has no value}', '-\\tfrac{3}{2}(x + 2)', '\\le \\ge \\square \\Rightarrow \\cdot'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
