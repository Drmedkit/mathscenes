// choose-the-form.ts: "Choose a fraction, decimal, or percent form to calculate with" (grade 7, 7.EE.B.3) on the
// shared lesson runtime. The model is one bar on a double number line (FormLine): one point, three names.
//   1 The question   25% off a $48 jacket: Mia uses 1/4 of 48, Leo 0.25 × 48. Who is right? (only Leo = one method
//                    is right; both but different = methods can disagree; both, same amount = right)
//   2 Worked example name it three ways, the fraction route (cut the bar in 4), the decimal route (same point, same
//                    $12), choose and report; one "why?" with 3 reasons
//   3 Your turn      an 18% tip on $45, faded from the end: the names are given, the kid picks the route (10% + 8%),
//                    finds 10%, then the whole tip
//   4 Prove it       Ava splits $900 three ways with 33% and calls it exactly a third: a because-chain from reason
//                    chips (distractors = catalogue misconceptions); a zoom lens shows the $9 her shares miss
//   5 Practice       all 16 sub-goals one after another, then mixed (runtime/practice.ts)
// Panel text and spoken text: src/lesson/topics/choose-the-form/script.ts (lines.json = its `say` texts).
import { type Canvas, strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { type Progress, progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint, Role } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { BOARD_W, LX, MF, bigLine, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { FormLine, type FormLineBlock, type FormLineParams } from '../../src/lesson/topics/choose-the-form/FormLine';
import { FAMILY_NAMES, GENERATORS, MC, type FormItem } from '../../src/lesson/topics/choose-the-form/items';
import { PLAN } from '../../src/lesson/topics/choose-the-form/plan';
import { LINES as SCRIPT } from '../../src/lesson/topics/choose-the-form/script';
import LINES from './choose-the-form/voice/lines.json';

const SLUG = 'choose-the-form';
const TABLE = 1040;
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the panel shows script[id].html, the narrator says lines.json[id] */
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES) || !SCRIPT[id]) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, SCRIPT[id]?.html ?? id);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]?.html ?? id); }

// ===================== the board =====================
/** a board line, left-aligned, shrunk to fit the slate (>= 60 px) */
function bl(key: string, src: string, y: number, size = 76, col?: Paint, tags?: Record<string, { col: Paint }>): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BOARD_W) s -= 2;
  return { key, F, x: LX, y, size: s, col, tags };
}
const lineBox = (L: Line) => texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });

// ===================== the model: one FormLine driven by named tracks =====================
interface Model { m: FormLineBlock; P: Progress<string>; show(steps: string[], d?: number, delay?: number, gap?: number): void; jump(steps: string[]): void; hide(step: string, d?: number): void }
function model(pre: string, p: FormLineParams): Model {
  const m = FormLine(p, MF, th);
  return {
    m, P: progressOf<string>(s => tr.k(pre + 'm.' + s)),
    show(steps, d = 0.9, delay = 0, gap = 0.25) { steps.forEach((s, i) => tr.set(pre + 'm.' + s, 1, d, delay + i * gap)); },
    jump(steps) { for (const s of steps) tr.jump(pre + 'm.' + s, 1); },
    hide(step, d = 0.6) { tr.set(pre + 'm.' + step, 0, d); },
  };
}
const RINGS: { at: string; col: Role }[] = [{ at: 'stack', col: 'pick' }, { at: 'fill0', col: 'link' }, { at: 'fill1', col: 'second' }, { at: 'top2', col: 'link' }, { at: 'top3', col: 'link' }, { at: 'bar', col: 'first' }, { at: 'gap', col: 'wrong' }];
function scene(pre: string, M: Model, lines: Line[], extra?: (c: Canvas) => void): void {
  setScene({ table: TABLE, model: c => M.m.draw(c, M.P, { rings: RINGS.map(r => ({ ...r, k: tr.k(pre + 'r.' + r.at) })), dim: tr.k(pre + 'dim') }), lines, leads: [], extra });
}
async function ring(pre: string, at: string, alive: () => boolean, hold = 1.1): Promise<void> {
  tr.set(pre + 'r.' + at, 1, 0.35); await wait(hold); if (!alive()) return; tr.set(pre + 'r.' + at, 0, 0.6);
}

// the jacket: 25% of $48 (parts 1 and 2)
const JACKET: FormLineParams = {
  wholes: 1, top: [{ v: 0, t: '$0' }, { v: 1, t: '$48' }, { v: 0.25, t: '$12', col: 'link' }], bot: [{ v: 0, t: '0%' }, { v: 1, t: '100%' }],
  cut: 4, fills: [{ a: 0, b: 0.25, col: 'link' }], mark: 0.25, names: { pct: '25\\%', frac: '\\dfrac{1}{4}', dec: '0.25' },
};
const JACKET_PRE = ['bar', 'top0', 'top1', 'bot0', 'bot1', 'mark', 'pct'];

// ===================== 1. The question =====================
const CARDS = [
  { big: 'Only Leo', small: 'a percent must become a decimal', mc: MC.oneMethod, why: 'q.cb.one', right: false },
  { big: 'Both', small: 'they get the same amount', mc: '', why: 'q.cb.right', right: true },
  { big: 'Both, but', small: 'the amounts can differ', mc: MC.disagree, why: 'q.cb.differ', right: false },
];
function partQuestion(): void {
  tr.reset('q.');
  const M = model('q.', JACKET);
  const L = [
    bl('q.L0', '25\\%\\text{ off } \\$48', 170, 84, undefined, {}),
    bl('q.L1', '\\text{Mia: } \\dfrac{1}{4}\\text{ of } 48', 360, 76),
    bl('q.L2', '\\text{Leo: } 0.25 \\times 48', 540, 76),
  ];
  scene('q.', M, L);
  M.show(JACKET_PRE, 0.9, 0, 0.3);
  tr.set('q.L0', 1, 1.0, 2.0); tr.set('q.L1', 1, 1.0, 3.0); tr.set('q.L2', 1, 1.0, 3.8);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Mia: 1/4 of $48. Leo: 0.25 × 48. Who is right?', board: '25% off $48', response: c.big + ' ' + c.small, expected: 'Both: same amount', correct: c.right, mc: c.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.big}<small>${cd.small}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Two routes, one jacket'), voiced('q.intro'), cards, html('div', 'label', SCRIPT['q.sure']!.html), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: 25% of $48 =====================
function partExample(): void {
  tr.reset('e.');
  const M = model('e.', JACKET);
  const L0 = bl('e.L0', '25\\%\\text{ off } \\$48', 170, 84);
  const E1 = bl('e.E1', '\\cssId{p}{25\\%} = \\dfrac{1}{4} = 0.25', 330, 80, undefined, { p: { col: 'pick' } });
  const E2 = bl('e.E2', '\\dfrac{1}{4}\\text{ of } 48 = \\cssId{a}{12}', 500, 80, undefined, { a: { col: 'link' } });
  const E3 = bl('e.E3', '0.25 \\times 48 = \\cssId{a}{12}', 650, 80, undefined, { a: { col: 'link' } });
  const E4 = bl('e.E4', '\\text{discount} = \\$12', 800, 80, 'link');
  scene('e.', M, [L0, E1, E2, E3, E4]);
  M.jump(JACKET_PRE); tr.jump('e.L0', 1);
  let step = 0;
  const STEPS = [
    { t: 'Name it three ways', why: '25% as a fraction and a decimal.', act: 'Name it' },
    { t: 'The fraction route', why: '1/4 of $48: cut the bar.', act: 'Cut it' },
    { t: 'The decimal route', why: '0.25 × 48.', act: 'Multiply' },
    { t: 'Choose and report', why: 'Which was quicker? Say it as money.', act: 'Choose' },
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
        void ring('e.', 'stack', alive, 2.6);
        M.show(['frac'], 0.9, 0.2); M.show(['dec'], 0.9, 1.1); await wait(2.0); if (!alive()) return;
        tr.set('e.E1', 1, 1.2); await wait(1.4);
      } else if (i === 1) {
        tr.set('e.E1:dim', 1, 0.5);
        M.show(['cut'], 1.6); await wait(1.8); if (!alive()) return;
        M.show(['fill0'], 1.0); await wait(1.1); if (!alive()) return;
        M.show(['top2'], 0.8); void ring('e.', 'fill0', alive, 1.4); await wait(0.9); if (!alive()) return;
        tr.set('e.E2', 1, 1.2); await wait(1.4);
      } else if (i === 2) {
        tr.set('e.E2:dim', 1, 0.5);
        tr.set('e.E3', 1, 1.2); await wait(1.3); if (!alive()) return;
        void ring('e.', 'fill0', alive, 1.4); void ring('e.', 'top2', alive, 1.4); await wait(1.6);
      } else {
        tr.set('e.E3:dim', 1, 0.5); tr.set('e.E2:dim', 0, 0.5);
        tr.set('e.E4', 1, 1.0, 0.3); void ring('e.', 'top2', alive, 1.6); await wait(1.8);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: '25%, 1/4 and 0.25 are one number: the same point on the line.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'Here it was luck. Different routes often give different answers.', ok: false, id: 'e.why.differ', mc: MC.disagree as string | undefined },
      { t: 'The decimal route is the real one. The fraction only checks it.', ok: false, id: 'e.why.one', mc: MC.oneMethod as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why do both routes give $12?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: an 18% tip on $45 (faded from the end) =====================
const TIP: FormLineParams = {
  wholes: 1, top: [{ v: 0, t: '$0' }, { v: 1, t: '$45' }, { v: 0.1, t: '$4.50', col: 'link' }, { v: 0.18, t: '$8.10', col: 'link' }],
  bot: [{ v: 0, t: '0%' }, { v: 1, t: '100%' }], cut: 10, fills: [{ a: 0, b: 0.1, col: 'link' }, { a: 0.1, b: 0.18, col: 'second' }],
  mark: 0.18, names: { pct: '18\\%', frac: '\\dfrac{18}{100}', dec: '0.18' },
};
function partTurn(): void {
  tr.reset('t.');
  const M = model('t.', TIP);
  const T = [
    bl('t.T0', '18\\%\\text{ tip on } \\$45', 170, 84),
    bl('t.T1', '\\cssId{p}{18\\%} = \\dfrac{18}{100} = 0.18', 330, 76, undefined, { p: { col: 'pick' } }),
    bl('t.T2', '10\\% = \\$4.50', 490, 76, undefined, {}),
    bl('t.T3', '8\\% = \\$3.60', 600, 76, 'second'),
    bl('t.T4', '18\\% = \\$4.50 + \\$3.60', 710, 76),
    bl('t.T5', '\\text{tip} = \\$8.10', 830, 80, 'link'),
  ];
  scene('t.', M, T);
  M.show(JACKET_PRE, 0.9, 0, 0.3); tr.set('t.T0', 1, 1.0, 2.0);
  let step = 0;
  const STEPS = [
    { t: 'Name it three ways', why: 'Done for you.' },
    { t: 'Choose a route', why: 'Your step.' },
    { t: 'Find 10%', why: 'Your step.' },
    { t: 'Add the 8%', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: the tip'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(3.2); if (!alive()) return;
    void ring('t.', 'stack', alive, 2.4);
    M.show(['frac'], 0.9); M.show(['dec'], 0.9, 0.9); await wait(1.9); if (!alive()) return;
    tr.set('t.T1', 1, 1.2); await wait(1.4); if (!alive()) return;
    step = 1; drawPlan(); askRoute();
  });
  function askRoute(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'Split it: 10% + 8%', ok: true, id: 't.route.ok', mc: undefined as string | undefined },
      { t: 'Divide $45 by 18', ok: false, id: 't.route.div', mc: MC.onePth as string | undefined },
      { t: 'Multiply $45 by 18', ok: false, id: 't.route.times', mc: MC.numeral as string | undefined },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.route', prompt: '18% tip on $45: which route?', board: '18% of $45', response: o.t, expected: 'Split it: 10% + 8%', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (!o.ok) return;
      done = true;
      tr.set('t.T1:dim', 1, 0.5);
      seq(async alive => { M.show(['cut'], 1.6); await wait(2.4); if (!alive()) return; step = 2; drawPlan(); askTen(); });
    })));
    work.replaceChildren(voiced('t.route'), bx, fbHost);
  }
  function askTen(): void {
    const fbHost = h('div'), inp = numInput('dollars', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false)); return; }
      const v = r.v, right = Math.abs(v - 4.5) < 1e-9;
      const mc = Math.abs(v - 0.45) < 1e-9 || Math.abs(v - 45) < 1e-9 ? MC.centsPoint : Math.abs(v - 2.5) < 1e-9 ? MC.onePth : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.ten', prompt: '10% of $45 = ?', board: '10% of $45', response: v, expected: 4.5, correct: right, mc });
      if (!right) { fbHost.replaceChildren(voicedFb(mc === MC.centsPoint ? 't.ten.point' : 't.ten.no', false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.ten.ok', true));
      seq(async alive => {
        M.show(['fill0'], 1.0); await wait(1.0); if (!alive()) return;
        M.show(['top2'], 0.8); tr.set('t.T2', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return;
        step = 3; drawPlan(); askTotal();
      });
    }
    work.replaceChildren(voiced('t.ten'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askTotal(): void {
    const fbHost = h('div'), inp = numInput('dollars', () => check()), ok = btn('Check', () => check(), 'go');
    seq(async alive => { M.show(['fill1'], 1.0); await wait(0.6); if (!alive()) return; tr.set('t.T3', 1, 1.0); void ring('t.', 'fill1', alive, 1.4); });
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false)); return; }
      const v = r.v, right = Math.abs(v - 8.1) < 1e-9;
      const part = Math.abs(v - 3.6) < 1e-9 || Math.abs(v - 4.5) < 1e-9;
      const mc = part ? MC.intermediate : Math.abs(v - 810) < 1e-9 ? MC.numeral : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.total', prompt: '18% tip on $45 = 10% + 8% = ?', board: '$4.50 + $3.60', response: v, expected: 8.1, correct: right, mc });
      if (!right) { fbHost.replaceChildren(voicedFb(part ? 't.total.part' : 't.total.no', false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.total.ok', true));
      seq(async alive => {
        tr.set('t.T4', 1, 1.0); await wait(1.1); if (!alive()) return;
        M.hide('top2', 0.5); M.show(['top3'], 0.8, 0.3); tr.set('t.T5', 1, 1.0, 0.5); void ring('t.', 'stack', alive, 1.6); await wait(1.9); if (!alive()) return;
        step = 4; drawPlan(); fbHost.append(callback());
      });
    }
    work.replaceChildren(voiced('t.total'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    const el = voiced(id);
    if (cd) el.insertAdjacentHTML('beforeend', ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>`);
    c.append(el, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Ava's 33% shares of $900 =====================
const PRIZE: FormLineParams = {
  wholes: 1, top: [{ v: 0, t: '$0' }, { v: 1, t: '$900' }, { v: 1 / 3, t: '$300', col: 'link' }, { v: 2 / 3, t: '$600', col: 'link' }],
  bot: [{ v: 0, t: '0%' }], cut: 3,
  fills: [{ a: 0, b: 0.33, col: 'second' }, { a: 0.33, b: 0.66, col: 'pick' }, { a: 0.66, b: 0.99, col: 'second' }],
  lens: { a: 0.96, b: 1, ticks: [{ v: 0.99, t: '$891', col: 'second' }, { v: 1, t: '$900' }], gap: { a: 0.99, b: 1, t: '$9 short' } },
};
function partProve(): void {
  tr.reset('p.');
  const M = model('p.', PRIZE);
  const A1 = bl('p.A1', '0.33 \\times 900 = 297', 150, 72, 'dim');
  const A2 = bl('p.A2', '297 = \\dfrac{1}{3}\\text{ of } 900\\;?', 285, 72, 'dim');
  const C1 = bl('p.C1', '\\dfrac{1}{3} = 0.333\\ldots \\ne 0.33', 455, 74);
  const C2 = bl('p.C2', '\\dfrac{1}{3}\\text{ of } 900 = \\cssId{a}{300}', 625, 74, undefined, { a: { col: 'link' } });
  const C3 = bl('p.C3', '3 \\times 297 = 891', 775, 74, 'second');
  const C4 = bl('p.C4', '900 - 891 = \\cssId{w}{9}', 885, 74, undefined, { w: { col: 'wrong' } });
  const extra = (c: Canvas) => {
    const k = tr.k('p.strike');
    if (k > 0) { const b = lineBox(A2); strike(c, b.x0 - 8, b.cy + 4, b.x1 + 8, b.cy - 4, k, { col: 'wrong' }); }
  };
  scene('p.', M, [A1, A2, C1, C2, C3, C4], extra);
  M.show(['bar', 'top0', 'top1', 'bot0'], 0.9, 0, 0.3);
  M.show(['fill0', 'fill1', 'fill2'], 0.9, 1.6, 0.5);
  tr.set('p.A1', 1, 1.0, 2.0); tr.set('p.A2', 1, 1.0, 2.8);
  const CHIPS = [
    { t: 'One third is 0.333…: the 3s never stop, so 0.33 is rounded.', fits: 0 },
    { t: 'Cut $900 into 3 equal parts: each part is $300.', fits: 1 },
    { t: 'Three shares of $297 make $891, and $900 − $891 = $9.', fits: 2 },
    { t: 'Any decimal is only an estimate, so every route is rounded.', fits: -1, mc: MC.inexact, id: 'p.no.inexact' },
    { t: 'Rounding a little at the start can’t change the answer.', fits: -1, mc: MC.midRound, id: 'p.no.mid' },
    { t: '0.33 is one third: that is what the calculator shows.', fits: -1, mc: MC.truncation, id: 'p.no.calc' },
  ];
  const CLAIMS = [
    `33% is <b>not</b> exactly ${'<span class="fr"><span>1</span><span>3</span></span>'},`,
    'The exact share is <b>$300</b>,',
    'Ava’s three shares leave <b>$9</b> out,',
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
      if (n === 1) { M.show(['cut'], 1.4); await wait(1.2); if (!alive()) return; tr.set('p.C1', 1, 1.2); }
      if (n === 2) { M.show(['top2', 'top3'], 0.8, 0, 0.4); await wait(1.0); if (!alive()) return; tr.set('p.C2', 1, 1.2); }
      if (n === 3) {
        M.show(['lens'], 1.0); await wait(1.4); if (!alive()) return;
        tr.set('p.C3', 1, 1.0); await wait(1.2); if (!alive()) return;
        M.show(['gap'], 0.8); void ring('p.', 'gap', alive, 1.6); tr.set('p.C4', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(0.9); if (!alive()) return;
        tr.set('p.A1:dim', 1, 0.5); tr.set('p.A2:dim', 1, 0.5);
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
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Ava: each cousin gets 33% of $900 = $297, exactly one third. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.roundedExact : undefined });
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
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as FormItem),
  });
}
/** a task line too wide for the slate (at 60 px) is broken before its relation sign onto a second line */
function splitBoard(src: string): string[] {
  if (texWidth(tex(src) as Formula, 60) <= BOARD_W) return [src];
  for (const sep of ['\\;\\text{vs}\\;', '\\;\\overset{?}{=}\\;', '\\approx', '\\;\\;\\square\\;\\;', ' = ']) {
    const i = src.indexOf(sep);
    if (i > 0) return [src.slice(0, i), sep + ' ' + src.slice(i + sep.length)];
  }
  return [src];
}
function showItem(item: FormItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture?.form;
  const made = pic ? tryBlock(() => model('x.', pic.line)) : null;
  if (pic && made && made.ok) {
    const M = made.value;
    const parts = splitBoard(item.board);
    const B = parts.map((s, i) => bl('x.B', s, 170 + i * 165, 84));
    const y0 = 170 + parts.length * 165 + 20;
    const W = pic.work.map((s, i) => bl('x.W' + i, s, y0 + i * 140, 74));
    scene('x.', M, [...B, ...W]);
    M.show(pic.pre, 0.7, 0, 0.12); tr.set('x.B', 1, 0.8, 0.6);
    return {
      solve: async alive => {
        for (const s of pic.solve) { M.show([s], 0.8); await wait(0.6); if (!alive()) return; }
        for (let i = 0; i < W.length; i++) { tr.set('x.W' + i, 1, 0.9); await wait(0.9); if (!alive()) return; }
        void ring('x.', 'stack', alive, 1.4);
      },
    };
  }
  const big = box(260, 230, 1660, 790);
  setScene({ table: TABLE, lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['25\\% = \\dfrac{1}{4} = 0.25 \\times 48 \\div 4 \\text{ off } \\$12', '0.333\\ldots \\ne \\approx \\overset{?}{=} \\square \\left|\\,x\\,\\right|', '\\text{Mia: Leo: Ava: tip discount}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
