// nonlinear-regression.ts: "Quadratic and exponential regression" (HS Statistics 3; secondary-t7-19) on the shared
// lesson runtime. Every graph is the shared kit's Plane (src/lesson/kit/Plane.ts); data and technology output are
// linear-regression's DataCard; difference tables are function-families' DiffTable.
//   1 The question   one patient, 9 blood samples over 8 hours, a quadratic and an exponential fit that both hug the
//                    data; the nurse needs 12 hours. Cards: quadratic, exponential (right), either (equal-fits-predict-
//                    alike) + how sure
//   2 Worked example fit both (recorded equations), one residual each at 2 hours (−0.61, −0.06), the two residual plots
//                    (a wave vs no pattern), both extended to 12 hours (9.5 rising vs 0.8); "why only an estimate?"
//   3 Your turn      a thrown ball, QuadReg output: record the equation, predict h(1.5) = 29.1 ft, report only the
//                    admissible landing time (2.63 s, not −0.11 s); callback to the commit
//   4 Prove it       Jamal: equal fits of 8 weeks of app sign-ups predict alike at week 23. Judge, then a because-chain
//                    (compounding vs adding, data pin the curves only inside, residuals bound only the data)
//   5 Practice       all 21 sub-goals one after another, then mixed (runtime/practice.ts); scatter and residual plots,
//                    data and output cards, difference tables; the worked solution replays on the picture after a miss
// Voiced lines: src/lesson/topics/nonlinear-regression/script.ts -> voice/lines.json. Every answer is logged.
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { type Frame, frame, tryBlock } from '../../src/blocks/block';
import { MF, bigLine, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { Plane, fmtN, type PFocus, type PItem, type PlaneBlock } from '../../src/lesson/kit/Plane';
import { drawWords, wordsBox } from '../../src/lesson/words';
import { DataCard, type DataCardBlock, type CardStep } from '../../src/lesson/topics/linear-regression/DataCard';
import { DiffTable, type DiffBlock, type DKind } from '../../src/lesson/topics/function-families/DiffTable';
import type { Card, DiffPic, NG, NItem } from '../../src/lesson/topics/nonlinear-regression/nkit';
import { FAMILY_NAMES, GENERATORS, MC, type NItemQ } from '../../src/lesson/topics/nonlinear-regression/items';
import { PLAN } from '../../src/lesson/topics/nonlinear-regression/plan';
import { explain } from '../../src/lesson/topics/nonlinear-regression/explain';
import { LINES } from '../../src/lesson/topics/nonlinear-regression/script';
import { fnOf, evalM, type Model } from '../../src/lesson/topics/nonlinear-regression/nlMaths';
import { BALL, BALL_Q, DRUG, DRUG_E, DRUG_Q, SIGNUPS, SIGN_E, SIGN_Q } from '../../src/lesson/topics/nonlinear-regression/lessonData';

const SLUG = 'nonlinear-regression';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  const L = LINES[id];
  if (!L) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, L?.html ?? id);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, LINES[id]?.html ?? id); }

// ===================== layout of parts 1-4: a plane on the left, a wide slate on the right =====================
const PF = frame(40, 70, 880, 940);
const SLATE = box(960, 70, 1880, 1010), LX2 = SLATE.x0 + 50, W2 = SLATE.w - 100;
function line2(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > W2) s -= 2;
  return { key, F, x: LX2, y, size: s, tags, col };
}
const lime = { col: 'link' as Paint }, teal = { col: 'second' as Paint }, blue = { col: 'water' as Paint }, wrong = { col: 'wrong' as Paint };

// ===================== planes from picture data =====================
const stepOf = (key: string) => key.split('#')[0]!;
function toP(it: NItem): PItem {
  if (it.kind === 'model') return { kind: 'curve', key: it.key, f: fnOf({ fam: it.fam, p: it.p } as Model), lo: it.lo, hi: it.hi, col: it.col, dash: it.dash, name: it.name };
  if (it.kind === 'hline') return { kind: 'hline', key: it.key, y: it.y, col: it.col ?? 'dim', dash: it.dash ?? true };
  if (it.kind === 'line') return { kind: 'curve', key: it.key, f: x => it.m * x + it.b, lo: it.lo, hi: it.hi, col: it.col, dash: it.dash, name: it.name };
  if (it.kind === 'vline') return { kind: 'vline', key: it.key, x: it.x, col: it.col ?? 'dim', dash: it.dash ?? true };
  if (it.kind === 'seg') return { kind: 'seg', key: it.key, a: it.a, b: it.b, col: it.col, arrow: it.arrow, dash: it.dash, w: it.w };
  if (it.kind === 'dots') throw new Error('dots are not used here');
  return it as PItem;
}
interface PlaneView { P: PlaneBlock; g: NG; draw(c: Canvas, k: (s: string) => number, f?: PFocus): void }
/** a Plane for picture data; a residual plot gets its x tick labels under the grid (not on the 0 line), a title top right */
function planeView(g: NG, fr: Frame): PlaneView {
  const x = g.resid ? { ...g.x, fmt: () => '' } : g.x;
  const P = Plane({ x, y: g.y, items: [...g.items, ...(g.solveItems ?? [])].map(toP) }, fr, th);
  const ticks: { t: string; x: number }[] = [];
  if (g.resid) {
    const n = Math.round((g.x.max - g.x.min) / g.x.step), vals = Array.from({ length: n + 1 }, (_, i) => g.x.min + i * g.x.step);
    const w = Math.max(...vals.map(v => wordsBox(fmtN(v), 0, 0, { size: 52 }).w)), cell = P.grid.w / n;
    const stride = [1, 2, 3, 4, 5].find(s => cell * s >= w + 20) ?? 5;
    vals.forEach((v, i) => { if (i % stride === 0) ticks.push({ t: fmtN(v), x: P.px(v, 0)[0] }); });
  }
  return {
    P, g,
    draw(c, k, f) {
      P.draw(c, progressOf<string>(s => k(stepOf(s))), f);
      const ka = k('axes');
      for (const t of ticks) drawWords(c, t.t, t.x, P.grid.y1 + 40, 'dim', ka, { size: 52, align: 'center' });
      if (g.title) drawWords(c, g.title, P.box.x1 - 24, P.box.y0 + 42, 'ink', ka, { size: 48, align: 'right', weight: 700 });
    },
  };
}
const ringOn = (key: string, col: Paint, k: number) => ({ key, col, k });
const curveIt = (key: string, m: Model, lo: number, hi: number, col: Paint, o: { dash?: boolean; name?: string } = {}): NItem => ({ kind: 'model', key, fam: m.fam, p: m.p.slice(), lo, hi, col: col as never, dash: o.dash, name: o.name });

// ===================== the drug: one plane for parts 1 and 2, two residual plots =====================
const drugX = { min: 0, max: 14, step: 2, name: 'Time since dose (hours)' }, drugY = { min: 0, max: 25, step: 5, name: 'Concentration (mg/L)' };
function drugPlane(): PlaneView {
  const its: NItem[] = [
    { kind: 'vline', key: 'v8', x: 8, col: 'dim', dash: true },
    curveIt('cQ', DRUG_Q, 0, 8, 'water', { name: 'quadratic' }), curveIt('cE', DRUG_E, 0, 8, 'link', { name: 'exponential' }),
    curveIt('cQx', DRUG_Q, 8, 13, 'water', { dash: true }), curveIt('cEx', DRUG_E, 8, 13, 'link', { dash: true }),
    { kind: 'vline', key: 'v12', x: 12, col: 'pick', dash: true },
    { kind: 'point', key: 'q12', x: 12, y: 9.481, col: 'water' }, { kind: 'point', key: 'e12', x: 12, y: 0.768, col: 'link' },
    ...DRUG.xs.map((x, i) => ({ kind: 'point', key: i === 2 ? 'p2' : `pts#${i}`, x, y: DRUG.ys[i]!, col: i === 2 ? 'pick' : 'first' }) as NItem),
  ];
  return planeView({ x: drugX, y: drugY, items: its }, PF);
}
/** a close-up around the sample at 2 hours: the two residual sticks are visible only zoomed in */
function drugZoom(): PlaneView | null {
  const made = tryBlock(() => planeView({ x: { min: 1, max: 3, step: 0.5, name: 'Time since dose (hours)' }, y: { min: 12, max: 15.5, step: 0.5, name: 'Concentration (mg/L)' }, items: [
    curveIt('cQ', DRUG_Q, 1.25, 3, 'water', { name: 'quadratic' }), curveIt('cE', DRUG_E, 1.25, 3, 'link', { name: 'exponential' }),
    { kind: 'seg', key: 'sQ', a: [2, 14.011], b: [2, 13.4], col: 'water', w: 8 },
    { kind: 'seg', key: 'sE', a: [2.06, 13.463], b: [2.06, 13.4], col: 'link', w: 8 },
    { kind: 'point', key: 'p2', x: 2, y: 13.4, col: 'pick' },
  ] }, PF));
  if (!made.ok) { console.warn(made.error); return null; }
  return made.value;
}
function drugResid(m: Model, key: string, fr: Frame, title: string, col: Paint): PlaneView | null {
  const es = DRUG.xs.map((x, i) => Math.round((DRUG.ys[i]! - evalM(m, x)) * 100) / 100);
  const made = tryBlock(() => planeView({ x: { min: 0, max: 8, step: 1, name: 'Hours' }, y: { min: -0.8, max: 0.8, step: 0.4, name: 'Residual (mg/L)' }, resid: true, title,
    items: [{ kind: 'hline', key: `${key}zero`, y: 0, col: 'dim', dash: false }, ...DRUG.xs.map((x, i) => ({ kind: 'point', key: `${key}#${i}`, x, y: es[i]!, col }) as NItem)] }, fr));
  if (!made.ok) { console.warn(made.error); return null; }
  return made.value;
}

// ===================== 1. The question =====================
const CARDS = [
  { v: 'Q', t: 'Quadratic', small: 'blue curve', mc: '', why: 'q.cb.quad' },
  { v: 'E', t: 'Exponential', small: 'green curve', mc: '', why: 'q.cb.exp' },
  { v: 'X', t: 'Either', small: 'both predict alike', mc: MC.equalFits, why: 'q.cb.either' },
];
function partQuestion(): void {
  tr.reset('q.');
  const S = drugPlane();
  const lines = [line2('q.T1', '\\text{data: } 0 \\text{ to } 8 \\text{ h}', 220, 84), line2('q.T2', '\\hat{y}(12) = \\,?', 380, 100, undefined, 'pick')];
  setScene({ model: c => S.draw(c, s => tr.k('q.' + s)), lines, leads: [], boardBox: SLATE });
  tr.set('q.axes', 1, 1.0); tr.set('q.pts', 1, 1.0, 0.6); tr.set('q.p2', 1, 0.6, 1.0);
  tr.set('q.cQ', 1, 1.4, 1.4); tr.set('q.cE', 1, 1.4, 2.0); tr.set('q.v8', 1, 0.6, 2.8); tr.set('q.v12', 1, 0.6, 3.2);
  tr.set('q.T1', 1, 1.0, 3.0); tr.set('q.T2', 1, 0.8, 3.6);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Drug concentration, 9 samples 0-8 h, quadratic and exponential fits: which model for 12 hours?', board: 'ŷ(12) = ?', response: c.t, expected: 'Exponential', correct: c.v === 'E', mc: c.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.t}</span><small>${cd.small}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Two curves, one patient'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const S = drugPlane(), Z = drugZoom();
  const RQ = drugResid(DRUG_Q, 'rq', PF, 'Quadratic', 'water'), RE = drugResid(DRUG_E, 're', PF, 'Exponential', 'link');
  const lines = [
    line2('e.Q', '\\cssId{q}{\\hat{y} = 0.349x^2 - 5.339x + 23.293}', 130, 64, { q: blue }),
    line2('e.E', '\\cssId{e}{\\hat{y} = 23.87(0.751)^{x}}', 225, 64, { e: lime }),
    line2('e.R1', '\\cssId{q}{e = 13.4 - 14.01 = -0.61}', 350, 62, { q: blue }),
    line2('e.R2', '\\cssId{e}{e = 13.4 - 13.46 = -0.06}', 440, 62, { e: lime }),
    line2('e.P1', '\\cssId{q}{\\text{quad: } +\\,-\\,-\\,-\\,-\\,+\\,+\\,+\\,-}', 565, 62, { q: blue }),
    line2('e.P2', '\\cssId{e}{\\text{exp: no pattern}}', 655, 62, { e: lime }),
    line2('e.X1', '\\cssId{q}{\\hat{y}(12) \\approx 9.5\\ \\text{(rising!)}}', 785, 62, { q: wrong }),
    line2('e.X2', '\\cssId{e}{\\hat{y}(12) \\approx 0.8\\ \\text{mg/L}}', 880, 66, { e: lime }),
  ];
  const ks = (s: string) => tr.k('e.' + s);
  setScene({
    model: c => {
      const sw = tr.k('e.swap'), zm = Z ? tr.k('e.zoom') : 0;
      if (sw < 1 && zm < 1) { c.g.save(); c.g.globalAlpha *= (1 - sw) * (1 - zm); S.draw(c, ks, { ring: [ringOn('p2', 'pick', tr.k('e.r2')), ringOn('q12', 'wrong', tr.k('e.rq')), ringOn('e12', 'link', tr.k('e.re'))] }); c.g.restore(); }
      if (zm > 0 && Z) { c.g.save(); c.g.globalAlpha *= zm; Z.draw(c, s => (s === 'axes' || s === 'cQ' || s === 'cE' || s === 'p2' ? zm : tr.k('e.' + s))); c.g.restore(); }
      const s2 = tr.k('e.swap2');
      if (sw > 0 && s2 < 1) { c.g.save(); c.g.globalAlpha *= sw * (1 - s2); RQ?.draw(c, s => (s === 'axes' ? 1 : tr.k('e.' + s))); c.g.restore(); }
      if (sw > 0 && s2 > 0) { c.g.save(); c.g.globalAlpha *= sw * s2; RE?.draw(c, s => (s === 'axes' ? 1 : tr.k('e.' + s))); c.g.restore(); }
    },
    lines, leads: [], boardBox: SLATE,
  });
  for (const k of ['axes', 'pts', 'p2']) tr.jump('e.' + k, 1);
  let step = 0;
  const STEPS = [
    { t: 'Fit both models', why: 'QuadReg and ExpReg, recorded with enough digits.', act: 'Fit' },
    { t: 'One residual each', why: 'Observed minus predicted, at 2 hours.', act: 'Measure' },
    { t: 'The residual plots', why: 'A pattern means the wrong form.', act: 'Plot them' },
    { t: 'Predict 12 hours', why: 'And say how far to trust it.', act: 'Extend' },
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
        tr.set('e.cQ', 1, 1.4); await wait(1.2); if (!alive()) return;
        tr.set('e.Q', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.cE', 1, 1.4); await wait(1.2); if (!alive()) return;
        tr.set('e.E', 1, 1.0); await wait(1.2);
      } else if (i === 1) {
        tr.set('e.r2', 1, 0.5); await wait(0.7); if (!alive()) return;
        tr.set('e.zoom', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.sQ', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.R1', 1, 1.1); await wait(1.4); if (!alive()) return;
        tr.set('e.sE', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.R2', 1, 1.1); await wait(1.4); if (!alive()) return;
        tr.set('e.r2', 0, 0.5);
      } else if (i === 2) {
        tr.set('e.Q:dim', 1, 0.5); tr.set('e.E:dim', 1, 0.5); tr.set('e.R1:dim', 1, 0.5); tr.set('e.R2:dim', 1, 0.5);
        tr.set('e.swap', 1, 1.2); tr.set('e.zoom', 0, 1.2); await wait(1.2); if (!alive()) return;
        tr.set('e.rqzero', 1, 0.6); tr.set('e.rq', 1, 1.6, 0.2); await wait(2.0); if (!alive()) return;
        tr.set('e.P1', 1, 1.0); await wait(1.6); if (!alive()) return;
        tr.set('e.swap2', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('e.rezero', 1, 0.6); tr.set('e.re', 1, 1.6, 0.2); await wait(2.0); if (!alive()) return;
        tr.set('e.P2', 1, 1.0); await wait(1.2);
      } else {
        tr.set('e.P1:dim', 1, 0.5); tr.set('e.P2:dim', 1, 0.5);
        tr.set('e.swap', 0, 1.2); tr.set('e.sQ', 0, 0.3); tr.set('e.sE', 0, 0.3); await wait(1.3); if (!alive()) return;
        tr.set('e.cQx', 1, 1.4); tr.set('e.cEx', 1, 1.4, 0.2); await wait(1.7); if (!alive()) return;
        tr.set('e.v12', 1, 0.6); tr.set('e.q12', 1, 0.6, 0.3); tr.set('e.rq', 1, 0.5, 0.5); await wait(1.2); if (!alive()) return;
        tr.set('e.X1', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.e12', 1, 0.6); tr.set('e.re', 1, 0.5, 0.3); await wait(1.0); if (!alive()) return;
        tr.set('e.X2', 1, 1.0); await wait(1.2);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: '12 hours is outside the data (0 to 8 hours): extrapolation.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'The exponential’s residuals show a pattern.', ok: false, id: 'e.why.pattern', mc: undefined as string | undefined },
      { t: 'It is not: the exponential fits so well that 0.8 is exact.', ok: false, id: 'e.why.exact', mc: MC.noLimit as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the 12-hour prediction of 0.8 mg/L only an estimate?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: a thrown ball =====================
function partTurn(): void {
  tr.reset('t.');
  const items: NItem[] = [
    curveIt('fit', BALL_Q, 0, 2.627, 'link'),
    { kind: 'vline', key: 'g15', x: 1.5, col: 'dim', dash: true },
    { kind: 'point', key: 'p15', x: 1.5, y: 29.06, col: 'link' },
    { kind: 'point', key: 'land', x: 2.627, y: 0, col: 'link' },
    ...BALL.xs.map((x, i) => ({ kind: 'point', key: i === 6 ? 'b15' : `pts#${i}`, x, y: BALL.ys[i]!, col: i === 6 ? 'pick' : 'first' }) as NItem),
  ];
  const S = planeView({ x: { min: 0, max: 3, step: 0.5, name: 'Time (seconds)' }, y: { min: 0, max: 35, step: 5, name: 'Height (feet)' }, items }, PF);
  const card: Card = { title: 'QuadReg', lines: ['y=ax²+bx+c', 'a=−15.9879', 'b=40.2200', 'c=4.7109', 'R²=.9976'] };
  const made = tryBlock(() => DataCard(card, frame(980, 80, 880, 600), th));
  const C: DataCardBlock | null = made.ok ? made.value : null;
  const lines = [
    line2('t.L1', 'h = -15.99t^2 + 40.22t + 4.71', 760, 66, undefined, 'link'),
    line2('t.L2', 'h(1.5) \\approx \\cssId{v}{29.1}\\ \\text{ft}', 860, 64, { v: lime }),
    line2('t.L3', 't \\approx \\cssId{n}{\\cancel{-0.11}},\\ \\cssId{v}{2.63}\\ \\text{s}', 960, 64, { v: lime, n: wrong }),
  ];
  setScene({
    model: c => S.draw(c, s => tr.k('t.' + s), { ring: [ringOn('b15', 'pick', tr.k('t.rb')), ringOn('land', 'link', tr.k('t.rl'))] }),
    lines, leads: [], boardBox: SLATE,
    extra: c => C?.draw(c, progressOf<CardStep>(s => tr.k('t.c' + s))),
  });
  tr.set('t.axes', 1, 1.0); tr.set('t.pts', 1, 1.0, 0.5); tr.set('t.b15', 1, 0.6, 0.8); tr.set('t.ccard', 1, 0.8, 1.2); tr.set('t.crows', 1, 1.4, 1.5);
  let step = 2;
  const STEPS = [
    { t: 'Enter the lists', why: 'Done for you: L1 = time, L2 = height.' },
    { t: 'Run QuadReg L1, L2', why: 'Done for you: the output is on the board.' },
    { t: 'Record the model', why: 'Your step.' },
    { t: 'Predict at 1.5 s', why: 'Your step.' },
    { t: 'Report the landing', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: a thrown ball'), voiced('t.intro'), plan, work);
  const choiceStep = (sayId: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], logItem: string, prompt: string, onOk: () => void) => {
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: logItem, prompt, response: o.t, expected: opts.find(x => x.ok)!.t, correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (o.ok) { done = true; onOk(); }
    })));
    work.replaceChildren(voiced(sayId), bx, fbHost);
  };
  const numStep = (sayId: string, unit: string, judge: (v: number) => { ok: boolean; id: string; mc?: string }, logItem: string, prompt: string, expected: number, onOk: () => void) => {
    const fbHost = h('div'), inp = numInput(unit, () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number first.')); return; }
      const j = judge(r.v);
      ctx.store.log({ part: 'turn', item: logItem, prompt, response: r.v, expected, correct: j.ok, mc: j.mc });
      fbHost.replaceChildren(voicedFb(j.id, j.ok));
      if (j.ok) { ok.disabled = true; onOk(); }
    }
    work.replaceChildren(voiced(sayId), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  };
  seq(async alive => {
    await wait(2.6); if (!alive()) return;
    choiceStep('t.eq', [
      { t: 'h = 4.71t² + 40.22t − 15.99', ok: false, id: 't.eq.rev' },
      { t: 'h = −15.99t² + 40.22t + 4.71', ok: true, id: 't.eq.ok' },
      { t: 'h = 40.22t + 4.71', ok: false, id: 't.eq.drop' },
    ], 'turn.equation', 'QuadReg a = −15.9879, b = 40.2200, c = 4.7109: which equation (2 decimals)?', () => seq(async alive2 => {
      tr.set('t.fit', 1, 1.4); tr.set('t.L1', 1, 1.0, 0.6); await wait(2.2); if (!alive2()) return;
      step = 3; drawPlan(); askPredict();
    }));
  });
  function askPredict(): void {
    numStep('t.pred', 'feet', v => (Math.abs(v - 29.1) < 0.051 ? { ok: true, id: 't.pred.ok' } : Math.abs(v - 28.9) < 1e-9 ? { ok: false, id: 't.pred.obs', mc: MC.onCurve } : { ok: false, id: 't.pred.no' }),
      'turn.predict', 'h = −15.99t² + 40.22t + 4.71: predict at t = 1.5 s (nearest tenth)', 29.1, () => seq(async alive => {
        tr.set('t.rb', 1, 0.5); tr.set('t.g15', 1, 0.8); tr.set('t.p15', 1, 0.7, 0.6); tr.set('t.L2', 1, 1.1, 0.8); await wait(2.2); if (!alive()) return;
        tr.set('t.rb', 0, 0.5); step = 4; drawPlan(); askLanding();
      }));
  }
  function askLanding(): void {
    choiceStep('t.land', [
      { t: 'Only t ≈ 2.63 s', ok: true, id: 't.land.ok' },
      { t: 't ≈ −0.11 s and t ≈ 2.63 s', ok: false, id: 't.land.both', mc: MC.allReals },
      { t: 'Only t ≈ −0.11 s', ok: false, id: 't.land.neg' },
    ], 'turn.landing', 'h = 0 at t ≈ −0.11 s and 2.63 s: what is the landing time?', () => seq(async alive => {
      tr.set('t.land', 1, 0.6); tr.set('t.rl', 1, 0.5, 0.4); await wait(1.2); if (!alive()) return;
      tr.set('t.L3', 1, 1.1); await wait(1.8); if (!alive()) return;
      tr.set('t.rl', 0, 0.5); step = 5; drawPlan(); work.append(callback());
    }));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id), ...(cd ? [html('p', 'dim', `(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)`)] : []), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: equal fits, equal predictions? =====================
function partProve(): void {
  tr.reset('p.');
  const { xs, ys } = SIGNUPS;
  const near = planeView({ x: { min: 0, max: 9, step: 1, name: 'Week' }, y: { min: 0, max: 16, step: 2, name: 'Sign-ups (thousands)' }, items: [
    curveIt('cQ', SIGN_Q, 0.5, 9, 'water', { name: 'quadratic' }), curveIt('cE', SIGN_E, 0.5, 9, 'first', { name: 'exponential' }),
    ...xs.map((x, i) => ({ kind: 'point', key: `pts#${i}`, x, y: ys[i]!, col: 'ink' }) as NItem),
  ] }, PF);
  const far = planeView({ x: { min: 0, max: 24, step: 4, name: 'Week' }, y: { min: 0, max: 800, step: 100, name: 'Sign-ups (thousands)' }, items: [
    { kind: 'vline', key: 'v8', x: 8, col: 'dim', dash: true },
    curveIt('cQ', SIGN_Q, 0.5, 24, 'water', { name: 'quadratic' }), curveIt('cE', SIGN_E, 0.5, 24, 'first', { name: 'exponential' }),
    { kind: 'point', key: 'q23', x: 23, y: 104.35, col: 'water' }, { kind: 'point', key: 'e23', x: 23, y: 767.7, col: 'first' },
    ...xs.map((x, i) => ({ kind: 'point', key: `pts#${i}`, x, y: ys[i]!, col: 'ink' }) as NItem),
  ] }, PF);
  const lines = [
    line2('p.R', '\\text{equal fits} \\Rightarrow \\text{same } \\hat{y}(23)', 150, 64, undefined, 'dim'),
    line2('p.M1', '\\cssId{q}{\\hat{y} = 0.202x^2 - 0.208x + 2.277}', 270, 62, { q: blue }),
    line2('p.M2', '\\cssId{e}{\\hat{y} = 1.625(1.307)^{x}}', 360, 62, { e: { col: 'first' } }),
    line2('p.T1', 'x = 13:\\ \\cssId{q}{33.7}\\ \\text{vs}\\ \\cssId{e}{52.8}', 490, 64, { q: blue, e: { col: 'first' } }),
    line2('p.T2', 'x = 23:\\ \\cssId{q}{104}\\ \\text{vs}\\ \\cssId{e}{768}', 590, 64, { q: blue, e: { col: 'first' } }),
    line2('p.Z', '|e| \\le 0.2 \\ \\text{only for}\\ 1 \\le x \\le 8', 720, 62, undefined, 'link'),
  ];
  const extra = (c: Canvas) => {
    const k = tr.k('p.strike');
    if (k > 0) { const L = lines[0]!, bb = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }); strike(c, bb.x0 - 10, bb.cy + 4, bb.x1 + 10, bb.cy - 4, k, { col: 'wrong' }); }
  };
  setScene({
    model: c => {
      const sw = tr.k('p.swap');
      if (sw < 1) { c.g.save(); c.g.globalAlpha *= 1 - sw; near.draw(c, s => tr.k('p.' + s)); c.g.restore(); }
      if (sw > 0) { c.g.save(); c.g.globalAlpha *= sw; far.draw(c, s => (s === 'axes' ? sw : tr.k('p.F' + s)), { ring: [ringOn('q23', 'water', tr.k('p.r23')), ringOn('e23', 'first', tr.k('p.r23'))] }); c.g.restore(); }
    },
    lines, leads: [], boardBox: SLATE, extra,
  });
  tr.set('p.axes', 1, 1.0); tr.set('p.pts', 1, 1.0, 0.5); tr.set('p.cQ', 1, 1.2, 1.2); tr.set('p.cE', 1, 1.2, 1.6); tr.set('p.R', 1, 1.0, 2.0); tr.set('p.M1', 1, 0.8, 2.4); tr.set('p.M2', 1, 0.8, 2.7);
  const CHIPS = [
    { t: 'Each week the exponential multiplies by 1.307, while the quadratic only adds a slowly growing amount.', fits: 0 },
    { t: 'The 8 data points pin the curves down only between weeks 1 and 8.', fits: 1 },
    { t: 'Residuals describe only the weeks that were observed.', fits: 2 },
    { t: 'Models that fit the same data equally well predict alike everywhere.', fits: -1, mc: MC.equalFits, id: 'p.no.equal' },
    { t: 'The residual range ±0.2 is a bound for every prediction.', fits: -1, mc: MC.bounds, id: 'p.no.bound' },
    { t: 'The model with the higher R² will be right at week 23.', fits: -1, mc: MC.highR, id: 'p.no.r2' },
  ];
  const CLAIMS = [
    'By week 23 the predictions are about 104 and 768 thousand,',
    'so fitting the same 8 weeks equally well does not make the models agree outside them,',
    'and ±0.2 is no bound at week 23,',
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
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b0 = btn(ch.t, () => place(i)); if (used.has(i)) b0.classList.add('used'); return b0; }));
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
      if (n === 1) {
        tr.set('p.swap', 1, 1.4); tr.set('p.Fpts', 1, 0.6, 0.8); tr.set('p.Fv8', 1, 0.6, 0.8); await wait(1.6); if (!alive()) return;
        tr.set('p.FcQ', 1, 1.6); tr.set('p.FcE', 1, 1.6, 0.3); await wait(2.0); if (!alive()) return;
        tr.set('p.T1', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('p.Fq23', 1, 0.6); tr.set('p.Fe23', 1, 0.6, 0.2); tr.set('p.r23', 1, 0.5, 0.4); tr.set('p.T2', 1, 1.0, 0.5); await wait(1.6); if (!alive()) return;
        tr.set('p.r23', 0, 0.6);
      }
      if (n === 2) { tr.set('p.r23', 1, 0.5); await wait(1.2); if (!alive()) return; tr.set('p.r23', 0, 0.5); }
      if (n === 3) {
        tr.set('p.Z', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('p.strike', 1, 0.7); await wait(1.0); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Jamal is right', () => judge(true)), no = btn('Jamal is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jamal: a quadratic and an exponential fit 8 weeks of sign-ups equally well, so at week 23 they predict about the same. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.equalFits : undefined });
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
    show: it => showItem(it as NItemQ),
  });
}
const stepsIn = (its: readonly NItem[] | undefined) => [...new Set((its ?? []).map(i => stepOf(i.key)))];
const KINDS: DKind[] = ['dx', 'd1', 'd2', 'rt'];
function diffOf(d: DiffPic, fr: Frame): DiffBlock | null {
  const all = { ...(d.show ?? {}), ...d.solveDiffs };
  for (const size of [60, 56, 52]) {
    const m = tryBlock(() => DiffTable({ xName: d.xName, xs: d.xs, cols: [{ name: d.yName, vals: d.ys }], ...all, size }, fr, th));
    if (m.ok) return m.value;
    if (size === 52) console.warn('table did not fit', m.error);
  }
  return null;
}
function showItem(item: NItemQ): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture ?? {}, g = pic.g, g2 = pic.g2, card = pic.card, card2 = pic.card2, diff = pic.diff;
  const hasBoard = !!item.board;
  let fG: Frame = MF, fG2: Frame | null = null, fCard: Frame | null = null, fCard2: Frame | null = null, bBox: Box | null = null, fDiff: Frame | null = null;
  if (diff) { fDiff = frame(30, 70, 1190, 940); bBox = hasBoard ? box(1240, 70, 1880, 330) : null; }
  else if (g && g2) { fG = frame(40, 70, 920, 940); fG2 = hasBoard ? frame(1000, 300, 880, 710) : frame(1000, 70, 880, 940); bBox = hasBoard ? box(1000, 70, 1880, 270) : null; }
  else if (g && card) { fG = frame(40, 70, 940, 940); fCard = hasBoard ? frame(1040, 260, 840, 750) : frame(1040, 70, 840, 940); bBox = hasBoard ? box(1040, 70, 1880, 240) : null; }
  else if (g) { bBox = hasBoard ? box(1060, 70, 1880, 300) : null; }
  else if (card && card2) { fCard = frame(40, 70, 920, 940); fCard2 = hasBoard ? frame(1000, 300, 880, 710) : frame(1000, 70, 880, 940); bBox = hasBoard ? box(1000, 70, 1880, 270) : null; }
  else if (card) { fCard = frame(60, 70, 940, 940); bBox = hasBoard ? box(1060, 70, 1880, 300) : null; }
  const V1 = g ? tryBlock(() => planeView(g, fG)) : null, V2 = g2 && fG2 ? tryBlock(() => planeView(g2, fG2!)) : null;
  const VC = card && fCard ? tryBlock(() => DataCard(card, fCard!, th)) : null, VC2 = card2 && fCard2 ? tryBlock(() => DataCard(card2, fCard2!, th)) : null;
  for (const m of [V1, V2, VC, VC2]) if (m && !m.ok) console.warn('picture did not fit', item.id, m.error);
  const P1 = V1 && V1.ok ? V1.value : null, P2 = V2 && V2.ok ? V2.value : null, CB = VC && VC.ok ? VC.value : null, CB2 = VC2 && VC2.ok ? VC2.value : null;
  const T = diff && fDiff ? diffOf(diff, fDiff) : null;
  if (!P1 && !P2 && !CB && !CB2 && !T) {
    const big = box(200, 180, 1720, 900);
    const top = bigLine('x.B', item.board || '\\text{?}', big, 110);
    setScene({ lines: item.board ? [top] : [], leads: [], boardBox: big });
    tr.set('x.B', 1, 0.8, 0.1);
    return {};
  }
  const lines = bBox && item.board ? [bigLine('x.B', item.board, bBox, 80)] : [];
  const ringRows = card?.ring ?? [];
  setScene({
    model: c => {
      P1?.draw(c, s => tr.k('x.' + s));
      P2?.draw(c, s => tr.k('x2.' + s));
      CB?.draw(c, progressOf<CardStep>(s => tr.k('x.c' + s)), { ring: ringRows.map(r => ({ row: r, col: 'pick' as Paint, k: tr.k('x.ring') })) });
      CB2?.draw(c, progressOf<CardStep>(s => tr.k('x.c' + s)));
      T?.draw(c, progressOf(s => tr.k('x.t' + s)));
    },
    lines, leads: [], boardBox: bBox,
  });
  if (P1) { tr.set('x.axes', 1, 0.8); stepsIn(g!.items).forEach((k, i) => tr.set('x.' + k, 1, 0.9, 0.2 + 0.15 * i)); }
  if (P2) { tr.set('x2.axes', 1, 0.8, 0.3); stepsIn(g2!.items).forEach((k, i) => tr.set('x2.' + k, 1, 0.9, 0.5 + 0.15 * i)); }
  if (CB || CB2) { tr.set('x.ccard', 1, 0.8, 0.2); tr.set('x.crows', 1, 1.2, 0.5); tr.set('x.ring', 1, 0.5, 1.2); }
  const qKinds = KINDS.filter(k => diff?.show?.[k]), sKinds = KINDS.filter(k => diff?.solveDiffs[k] && !diff?.show?.[k]);
  if (T) { tr.set('x.tcard', 1, 0.8, 0.1); tr.set('x.trows', 1, 1.0, 0.4); qKinds.forEach((k, i) => tr.set('x.t' + k, 1, 1.2, 1.0 + i * 0.4)); }
  tr.set('x.B', 1, 0.8, 0.3);
  const solve1 = P1 ? stepsIn(g!.solveItems) : [], solve2 = P2 ? stepsIn(g2!.solveItems) : [], fill = !!(CB && card?.solveCells?.length);
  return {
    solve: solve1.length || solve2.length || fill || sKinds.length ? async alive => {
      for (const k of sKinds) { tr.set('x.t' + k, 1, 1.2); await wait(1.0); if (!alive()) return; }
      for (const k of solve1) { tr.set('x.' + k, 1, 1.0); await wait(0.6); if (!alive()) return; }
      for (const k of solve2) { tr.set('x2.' + k, 1, 1.0); await wait(0.6); if (!alive()) return; }
      if (fill) tr.set('x.cfill', 1, 0.9);
      await wait(0.8);
    } : undefined,
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\hat{y} = 0.349x^2 - 5.339x + 23.293 \\quad \\hat{y} = 23.87(0.751)^{x} \\quad e = 13.4 - 14.01 = -0.61', 'h = -15.99t^2 + 40.22t + 4.71 \\quad \\cancel{-0.11} \\quad |e| \\le 0.2 \\quad \\ln y \\quad \\Delta^2 y'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
