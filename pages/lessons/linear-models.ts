// linear-models.ts: "Linear equations from a context" (Algebra 1, lesson 6; secondary-t6-32) on the shared lesson
// runtime. Every graph is the shared kit's Plane (src/lesson/kit/Plane.ts); the model of a counted quantity is drawn
// as DOTS at whole numbers, a limit as a line with its allowed side shaded.
//   1 The question   Sam's arcade card: 4 games $13, 10 games $28, $40 to spend. How many games? 3 cards (14; 15 =
//                    rounds to the nearest; 12 = treats it as proportional) + how sure
//   2 Worked example four steps on the plane: name the quantities (axes with units), the rate from the two receipts,
//                    walk back to g = 0 (C = 2.5g + 3, the unit check, dots for whole games), the $40 limit (2.5g + 3
//                    ≤ 40, g ≤ 14.8, the 15th game breaks it: 14); one "why?"
//   3 Your turn      a car wash, (10, −$80) and (25, $40), rate $8 given: the kid finds b = −160, picks the inequality
//                    for "at least $250", rounds 51.25 in the right direction (52); callback to the part-1 card
//   4 Prove it       Ava: "51 posters cost exactly $50". Judge, then a because-chain from reason chips (distractors =
//                    catalogue misconceptions): 51 cost $50.25 / no whole number hits $50 / "at most $50" does: 50
//   5 Practice       all 18 sub-goals one after another, then mixed (runtime/practice.ts); Plane, table and restriction
//                    pictures, the worked solution replayed on the picture after a miss
// Voiced lines: src/lesson/topics/linear-models/script.ts -> voice/lines.json. Every answer is logged.
import { type Canvas, strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { MF, bigLine, type Line, line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { PFocus, PlaneBlock } from '../../src/lesson/kit/Plane';
import { type MPic, planeOfM, stepOf } from '../../src/lesson/topics/linear-models/modelPic';
import { TableCard, type TableStep } from '../../src/lesson/topics/linear-functions-slope/TableCard';
import { Restrictions } from '../../src/lesson/topics/linear-models/Restrictions';
import { FAMILY_NAMES, GENERATORS, MC, type LItem } from '../../src/lesson/topics/linear-models/items';
import { PLAN } from '../../src/lesson/topics/linear-models/plan';
import { explain } from '../../src/lesson/topics/linear-models/explain';
import { LINES } from '../../src/lesson/topics/linear-models/script';

const SLUG = 'linear-models';
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

// ===================== the plane of a part: an MPic drawn with the kit's Plane, steps under a prefix =====================
interface Scene2 { P: PlaneBlock; draw(c: Canvas, f?: PFocus): void }
function planeScene(pre: string, g: MPic): Scene2 {
  const P = planeOfM(g, MF, th);
  const prog = progressOf<string>(s => tr.k(pre + stepOf(s)));
  return { P, draw: (c, f) => P.draw(c, prog, f) };
}
const ring = (pre: string, key: string, col: 'link' | 'pick' | 'wrong' | 'first' | 'second' = 'pick') => ({ key, col, k: tr.k(pre + 'r.' + key.replace('#', '')) });
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ===================== parts 1-2: Sam's arcade card, C = 2.5g + 3 =====================
const G1: MPic = {
  x: { min: 0, max: 16, step: 1, name: 'games played (g)' }, y: { min: 0, max: 45, step: 5, name: 'total cost (C, $)', money: true },
  items: [
    { kind: 'band', key: 'S', y: 40, side: 'below', lo: 0, hi: 16 },
    { kind: 'line', key: 'L', m: 2.5, b: 3, lo: 0, dash: true, col: 'dim' },
    { kind: 'hline', key: 'T', y: 40 },
    { kind: 'seg', key: 'run', a: [4, 13], b: [10, 13], col: 'first', arrow: true },
    { kind: 'seg', key: 'rise', a: [10, 13], b: [10, 28], col: 'second', arrow: true },
    { kind: 'text', key: 'runT', x: 7, y: 10.2, text: '6 games', col: 'first' },
    { kind: 'text', key: 'riseT', x: 10.4, y: 20.5, text: '+$15', col: 'second', align: 'left' },
    { kind: 'seg', key: 'back', a: [4, 13], b: [0, 3], dash: true, col: 'pick' },
    { kind: 'dots', key: 'W', m: 2.5, b: 3, xs: range(0, 14) },
    { kind: 'dots', key: 'X', m: 2.5, b: 3, xs: [15, 16], col: 'link' },
    { kind: 'dots', key: 'Xw', m: 2.5, b: 3, xs: [15, 16], col: 'wrong' },
    { kind: 'point', key: 'A', x: 4, y: 13, name: '(4, $13)', col: 'first' },
    { kind: 'point', key: 'B', x: 10, y: 28, name: '(10, $28)', col: 'first' },
    { kind: 'point', key: 'Y', x: 0, y: 3, name: '(0, $3)', col: 'link' },
  ],
  show: [], solve: [],
};

// ===================== 1. The question =====================
const CARDS = [
  { v: '14', id: '', why: 'q.cb.right' },
  { v: '15', id: MC.nearest, why: 'q.cb.near' },
  { v: '12', id: MC.scalesNonProp, why: 'q.cb.prop' },
];
function partQuestion(): void {
  tr.reset('q.');
  const S = planeScene('q.', G1);
  const lines = [line('q.T1', '4 \\to \\$13,\\quad 10 \\to \\$28', 170, 70), line('q.T2', '\\$40:\\ \\ g = \\,?', 320, 84)];
  setScene({ model: c => S.draw(c), lines, leads: [] });
  tr.set('q.axes', 1, 1.0); tr.set('q.A', 1, 0.6, 1.0); tr.set('q.B', 1, 0.6, 1.4); tr.set('q.T', 1, 1.0, 1.8);
  tr.set('q.T1', 1, 1.0, 2.2); tr.set('q.T2', 1, 0.8, 2.8);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Arcade card: 4 games $13 in total, 10 games $28. With $40, how many games?', board: '$40: g = ?', response: c.v, expected: '14', correct: c.id === '', mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const order = [1, 2, 0];
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', commit().pick === order[j]));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  order.forEach(i => { const cd = CARDS[i]!; const b = h('button'); b.innerHTML = `<span>${cd.v}</span><small>games</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Forty dollars of games'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const S = planeScene('e.', G1);
  const lime = { col: 'link' as const }, amber = { col: 'first' as const }, teal = { col: 'second' as const };
  const lines = [
    line('e.bD1', '\\cssId{g}{g}:\\ \\text{games played}', 120, 60, { g: amber }),
    line('e.bD2', '\\cssId{c}{C}:\\ \\text{total dollars}', 215, 60, { c: teal }),
    line('e.bR', 'm = \\frac{\\cssId{dy}{28 - 13}}{\\cssId{dx}{10 - 4}} = \\frac{15}{6} = \\cssId{m}{2.5}', 345, 64, { dy: teal, dx: amber, m: lime }),
    line('e.bB', 'b = 13 - 2.5(4) = \\cssId{b}{3}', 480, 64, { b: lime }),
    line('e.bM', '\\cssId{e}{C = 2.5g + 3}', 590, 70, { e: lime }),
    line('e.bI', '2.5g + 3 \\le 40', 710, 66),
    line('e.bS', 'g \\le 14.8\\ \\Rightarrow\\ \\cssId{a}{g = 14}', 815, 64, { a: lime }),
    line('e.bK', 'C(15) = 40.5 > 40', 925, 60),
  ];
  setScene({
    model: c => S.draw(c, {
      heads: tr.k('e.heads'), dim: tr.k('e.dimRR') > 0.5 ? ['run', 'rise', 'runT', 'riseT', 'back'] : [],
      ring: [ring('e.', 'A', 'first'), ring('e.', 'Y', 'link'), ring('e.', 'W#14', 'link'), ring('e.', 'Xw#0', 'wrong')],
    }),
    lines, leads: [],
  });
  for (const k of ['axes', 'A', 'B']) tr.jump('e.' + k, 1);
  let step = 0;
  const STEPS = [
    { t: 'Name the quantities', why: 'Input and output, with units.', act: 'Set up' },
    { t: 'Rate from two receipts', why: 'Change over change.', act: 'Compare' },
    { t: 'Back to g = 0', why: 'The start, the model, a unit check.', act: 'Walk back' },
    { t: 'The $40 limit', why: 'An inequality, then a whole number.', act: 'Apply the limit' },
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
        tr.set('e.heads', 1, 0.6); await wait(0.9); if (!alive()) return;
        tr.set('e.bD1', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.bD2', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.heads', 0, 0.6);
      } else if (i === 1) {
        tr.set('e.run', 1, 1.1); tr.set('e.runT', 1, 0.6, 0.8); await wait(1.4); if (!alive()) return;
        tr.set('e.rise', 1, 1.2); tr.set('e.riseT', 1, 0.6, 0.9); await wait(1.5); if (!alive()) return;
        tr.set('e.bR', 1, 1.4); await wait(1.6);
      } else if (i === 2) {
        tr.set('e.dimRR', 1, 0.3); tr.set('e.r.A', 1, 0.5); await wait(0.6); if (!alive()) return;
        tr.set('e.back', 1, 1.4); await wait(1.4); if (!alive()) return;
        tr.set('e.r.A', 0, 0.5); tr.set('e.Y', 1, 0.7); tr.set('e.r.Y', 1, 0.5, 0.3); tr.set('e.bB', 1, 1.2, 0.3); await wait(1.6); if (!alive()) return;
        tr.set('e.r.Y', 0, 0.6); tr.set('e.bR:dim', 1, 0.5); tr.set('e.bM', 1, 1.2); await wait(1.4); if (!alive()) return;
        // games come whole: dots on the dashed formula line
        tr.set('e.L', 1, 1.2); tr.set('e.W', 1, 1.4, 0.6); tr.set('e.X', 1, 0.6, 1.8); await wait(2.4);
      } else {
        tr.set('e.bD1:dim', 1, 0.5); tr.set('e.bD2:dim', 1, 0.5); tr.set('e.bB:dim', 1, 0.5);
        tr.set('e.T', 1, 1.0); tr.set('e.S', 1, 1.0, 0.6); await wait(1.4); if (!alive()) return;
        tr.set('e.bI', 1, 1.2); await wait(1.3); if (!alive()) return;
        // the 15th game is past the limit: those dots turn wrong, then the board checks the neighbour
        tr.set('e.Xw', 1, 0.6); tr.set('e.r.Xw0', 1, 0.5, 0.3); tr.set('e.bK', 1, 1.2, 0.3); await wait(1.6); if (!alive()) return;
        tr.set('e.r.Xw0', 0, 0.5); tr.set('e.r.W14', 1, 0.5); tr.set('e.bI:dim', 1, 0.5); tr.set('e.bS', 1, 1.2, 0.2); await wait(1.4);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: '15 games would cost $40.50: more than Sam has.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'Round 14.8 to the nearest whole number.', ok: false, id: 'e.why.near', mc: MC.nearest as string | undefined },
      { t: 'Always drop the decimal part of an answer.', ok: false, id: 'e.why.drop', mc: MC.remainder as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why 14 games, when 14.8 is closer to 15?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: the car wash, P = 8w − 160 =====================
const G3: MPic = {
  x: { min: 0, max: 60, step: 5, name: 'cars washed (w)' }, y: { min: -250, max: 300, step: 50, name: 'profit (P, $)', money: true },
  items: [
    { kind: 'band', key: 'S', y: 250, side: 'above', lo: 0, hi: 60 },
    { kind: 'line', key: 'L', m: 8, b: -160, lo: 0 },
    { kind: 'hline', key: 'T', y: 250 },
    { kind: 'seg', key: 'run', a: [10, -80], b: [25, -80], col: 'first', arrow: true },
    { kind: 'seg', key: 'rise', a: [25, -80], b: [25, 40], col: 'second', arrow: true },
    { kind: 'text', key: 'runT', x: 17.5, y: -112, text: '15 cars', col: 'first' },
    { kind: 'text', key: 'riseT', x: 26.5, y: -58, text: '+$120', col: 'second', align: 'left' },
    { kind: 'seg', key: 'back', a: [10, -80], b: [0, -160], dash: true, col: 'pick' },
    { kind: 'point', key: 'A', x: 10, y: -80, name: '(10, −$80)', col: 'first' },
    { kind: 'point', key: 'B', x: 25, y: 40, name: '(25, $40)', col: 'first' },
    { kind: 'point', key: 'Y', x: 0, y: -160, name: '(0, −$160)', col: 'link' },
    { kind: 'point', key: 'K', x: 52, y: 256, col: 'link' },
  ],
  show: [], solve: [],
};
function partTurn(): void {
  tr.reset('t.');
  const S = planeScene('t.', G3);
  const lime = { col: 'link' as const };
  const lines = [
    line('t.bR', 'm = \\frac{40 - (-80)}{25 - 10} = \\cssId{m}{8}', 150, 66, { m: lime }),
    line('t.bB', 'b = -80 - 80 = \\cssId{b}{-160}', 290, 64, { b: lime }),
    line('t.bM', '\\cssId{e}{P = 8w - 160}', 410, 70, { e: lime }),
    line('t.bI', '8w - 160 \\ge 250', 540, 68),
    line('t.bS', 'w \\ge 51.25\\ \\Rightarrow\\ \\cssId{a}{w = 52}', 670, 64, { a: lime }),
    line('t.bK', 'P(51) = 248 < 250', 800, 60),
  ];
  setScene({ model: c => S.draw(c, { dim: tr.k('t.dimRR') > 0.5 ? ['run', 'rise', 'runT', 'riseT', 'back'] : [], ring: [ring('t.', 'A', 'first'), ring('t.', 'Y', 'link'), ring('t.', 'K', 'link')] }), lines, leads: [] });
  tr.set('t.axes', 1, 0.9); tr.set('t.A', 1, 0.6, 0.8); tr.set('t.B', 1, 0.6, 1.1);
  let step = 0;
  const STEPS = [
    { t: 'Rate from two data points', why: 'Done for you.' },
    { t: 'Back to w = 0', why: 'Your step.' },
    { t: 'The goal as an inequality', why: 'Your step.' },
    { t: 'Whole cars', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: the car wash'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(1.6); if (!alive()) return;
    tr.set('t.run', 1, 1.0); tr.set('t.runT', 1, 0.6, 0.6); tr.set('t.rise', 1, 1.2, 0.9); tr.set('t.riseT', 1, 0.6, 1.8); tr.set('t.bR', 1, 1.2, 2.0);
    await wait(3.4); if (!alive()) return;
    step = 1; drawPlan(); askB();
  });
  /** a typed number step with voice ids for the slips */
  function numStep(promptId: string, item: string, prompt: string, right: number, slips: { v: number; id: string; mc?: string }[], otherId: string, then: () => void): void {
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.b.empty', false)); return; }
      const v = r.v, isRight = Math.abs(v - right) < 1e-9, sl = slips.find(s => Math.abs(s.v - v) < 1e-9);
      ctx.store.log({ part: 'turn', item, prompt, response: v, expected: right, correct: isRight, mc: isRight ? undefined : sl?.mc });
      if (!isRight) { fbHost.replaceChildren(voicedFb(sl?.id ?? otherId, false)); return; }
      ok.disabled = true;
      then();
    }
    work.replaceChildren(voiced(promptId), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askB(): void {
    numStep('t.b', 'turn.start', 'Car wash: (10, −$80), (25, $40), rate $8 per car. Profit at w = 0?', -160, [
      { v: -80, id: 't.b.first', mc: MC.firstOut }, { v: 0, id: 't.b.sign' }, { v: 160, id: 't.b.sign' },
    ], 't.b.no', () => {
      work.append(voicedFb('t.b.ok', true));
      seq(async alive => {
        tr.set('t.dimRR', 1, 0.3); tr.set('t.r.A', 1, 0.5); tr.set('t.back', 1, 1.3, 0.3); await wait(1.5); if (!alive()) return;
        tr.set('t.r.A', 0, 0.5); tr.set('t.Y', 1, 0.7); tr.set('t.r.Y', 1, 0.5, 0.3); tr.set('t.bB', 1, 1.1, 0.3); await wait(1.5); if (!alive()) return;
        tr.set('t.r.Y', 0, 0.5); tr.set('t.bR:dim', 1, 0.5); tr.set('t.bM', 1, 1.1); tr.set('t.L', 1, 1.4, 0.4); await wait(2.0); if (!alive()) return;
        step = 2; drawPlan(); askIneq();
      });
    });
  }
  function askIneq(): void {
    const opts = [
      { t: '8<i>w</i> − 160 > 250', ok: false, id: 't.ineq.strict', mc: MC.strict },
      { t: '8<i>w</i> − 160 ≥ 250', ok: true, id: 't.ineq.ok' },
      { t: '8<i>w</i> − 160 ≤ 250', ok: false, id: 't.ineq.rev', mc: MC.reversed },
      { t: '8<i>w</i> − 160 = 250', ok: false, id: 't.ineq.eq', mc: MC.eqBound },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.inequality', prompt: 'P = 8w − 160: a profit of at least $250. Which inequality?', response: o.t.replace(/<[^>]+>/g, ''), expected: '8w − 160 ≥ 250', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.T', 1, 1.0); tr.set('t.S', 1, 1.0, 0.5); tr.set('t.bI', 1, 1.1, 0.3); await wait(1.7); if (!alive()) return;
        step = 3; drawPlan(); askW();
      });
    })));
    work.replaceChildren(voiced('t.ineq'), bx, fbHost);
  }
  function askW(): void {
    numStep('t.w', 'turn.whole', '8w − 160 ≥ 250 gives w ≥ 51.25. How many cars must they wash?', 52, [
      { v: 51, id: 't.w.near', mc: MC.nearest }, { v: 51.25, id: 't.w.frac', mc: MC.fractions },
    ], 't.w.no', () => {
      work.append(voicedFb('t.w.ok', true));
      seq(async alive => {
        // the board: w ≥ 51.25 → 52, then the check on the excluded neighbour; the plane rings the 52nd car
        tr.set('t.bI:dim', 1, 0.5); tr.set('t.bS', 1, 1.1); tr.set('t.K', 1, 0.7, 0.4); tr.set('t.r.K', 1, 0.5, 0.7); await wait(1.5); if (!alive()) return;
        tr.set('t.bK', 1, 1.1); await wait(1.4); if (!alive()) return;
        tr.set('t.r.K', 0, 0.6);
        step = 4; drawPlan(); work.append(callback());
      });
    });
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const v = voiced(cd ? cd.why : 'q.cb.none');
    if (cd) v.append(html('span', 'dim', ` (You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)`));
    c.append(v, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Ava's 51 posters =====================
const G4: MPic = {
  x: { min: 44, max: 56, step: 1, name: 'posters (p)' }, y: { min: 44, max: 56, step: 1, name: 'cost (C, $)', money: true },
  items: [
    { kind: 'line', key: 'L', m: 0.75, b: 12, dash: true, col: 'dim' },
    { kind: 'hline', key: 'T', y: 50 },
    { kind: 'dots', key: 'W', m: 0.75, b: 12, xs: range(44, 56) },
    { kind: 'point', key: 'Z', x: 152 / 3, y: 50, open: true, col: 'pick' },
    { kind: 'point', key: 'P51', x: 51, y: 50.25, name: '$50.25', col: 'wrong' },
    { kind: 'point', key: 'P50', x: 50, y: 49.5, name: '$49.50', col: 'link' },
  ],
  show: [], solve: [],
};
function partProve(): void {
  tr.reset('p.');
  const S = planeScene('p.', G4);
  const lines = [
    line('p.R0', '0.75p + 12 = 50', 150, 70),
    line('p.R1', 'p = 50.67 \\cssId{z}{\\approx 51}', 270, 68),
    line('p.R2', '0.75(51) + 12 = 50.25', 420, 64),
    line('p.R3', '0.75(50) + 12 = 49.5', 560, 64),
    line('p.R4', 'p \\le 50.67\\ \\Rightarrow\\ p = 50', 720, 62),
  ];
  const R1 = lines[1]!;
  setScene({
    model: c => S.draw(c, { ring: [ring('p.', 'P51', 'wrong'), ring('p.', 'P50', 'link'), ring('p.', 'Z', 'pick')] }),
    lines, leads: [],
    extra: c => { const k = tr.k('p.strike'); if (k > 0) { const z = partOf(R1, 'z'); strike(c, z.x0 - 8, z.cy + 6, z.x1 + 8, z.cy - 6, k, { col: 'wrong' }); } },
  });
  tr.set('p.axes', 1, 0.9); tr.set('p.L', 1, 1.2, 0.6); tr.set('p.T', 1, 1.0, 1.2); tr.set('p.R0', 1, 1.0, 1.6); tr.set('p.R1', 1, 1.0, 2.4);
  const CHIPS = [
    { t: '0.75 × 51 + 12 = 50.25, not 50.', fits: 0 },
    { t: 'Posters come whole, and the cost jumps from $49.50 straight to $50.25.', fits: 1 },
    { t: '50 posters cost $49.50, and the 51st would push the total over $50.', fits: 2 },
    { t: '50.67 rounds to 51, and close enough counts as exact.', fits: -1, mc: MC.roundsExact, id: 'p.no.round' },
    { t: 'The equation has a solution, so the story has one too.', fits: -1, mc: MC.allReals, id: 'p.no.eq' },
    { t: 'Drop the decimal: 50 posters cost exactly $50.', fits: -1, mc: MC.remainder, id: 'p.no.drop' },
  ];
  const CLAIMS = [
    '<b>51 posters</b> do not cost exactly $50,',
    '<b>No order</b> costs exactly $50,',
    'The question “<b>at most</b> $50” does have an answer, <b>50 posters</b>,',
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
    if (filled >= 3 || used.has(i)) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) {
        tr.set('p.P51', 1, 0.7); tr.set('p.r.P51', 1, 0.5, 0.3); tr.set('p.R2', 1, 1.0, 0.4); await wait(1.4); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(1.0); if (!alive()) return; tr.set('p.r.P51', 0, 0.5);
      }
      if (n === 2) {
        tr.set('p.W', 1, 1.4); await wait(1.2); if (!alive()) return;
        tr.set('p.P50', 1, 0.7); tr.set('p.R3', 1, 1.0, 0.3); tr.set('p.Z', 1, 0.6, 0.6); tr.set('p.r.Z', 1, 0.5, 0.8); await wait(1.8); if (!alive()) return;
        tr.set('p.r.Z', 0, 0.5);
      }
      if (n === 3) {
        tr.set('p.r.P50', 1, 0.5); tr.set('p.R4', 1, 1.0, 0.3); await wait(1.8); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Ava is right', () => judge(true)), no = btn('Ava is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Print shop C = 0.75p + 12. Ava: (50 − 12) ÷ 0.75 = 50.67, so 51 posters cost exactly $50. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.roundsExact : undefined });
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
  const out = [line('x.B', item.board, 160, 76)];
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
      return { solve: g.solve.length ? async alive => { for (const k of g.solve) { tr.set('x.' + k, 1, 1.0); await wait(0.6); if (!alive()) return; } await writeTex(item, alive); } : undefined };
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
  if (pic?.r) {
    const r = pic.r;
    const made = tryBlock(() => Restrictions(r, MF, th));
    if (made.ok) {
      const B = made.value, P = progressOf<string>(s => tr.k('x.' + s));
      setScene({ model: c => B.draw(c, P), lines: boardLines(item), leads: [] });
      tr.set('x.card', 1, 0.8); r.rows.forEach((_, i) => tr.set(`x.r${i}`, 1, 1.0, 0.4 + 0.5 * i)); tr.set('x.B', 1, 0.8, 0.3);
      return { solve: async alive => { tr.set('x.res', 1, 1.4); await wait(1.4); if (!alive()) return; await writeTex(item, alive); } };
    }
    console.warn('restrictions picture did not fit', item.id, made.error);
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
  warm: ['m = \\frac{28 - 13}{10 - 4}', '\\$40:\\ g = \\,?', '\\le \\ge \\Rightarrow \\approx \\square \\cdot', '\\text{games played}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
