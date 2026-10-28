// linear-regression.ts: "Scatter plots, correlation and the regression line" (HS Statistics 2; secondary-t6-16) on the
// shared lesson runtime. Every graph is the shared kit's Plane (src/lesson/kit/Plane.ts); tables and technology output
// are the topic's DataCard.
//   1 The question   8 used cars (mileage, price) and three lines: A joins the first and last car, B goes through 3 cars,
//                    C through none. Which fits best? Cards A (line-through-first-and-last), B (line-through-most-points),
//                    C (right) + how sure
//   2 Worked example one car's residual (observed − predicted, a vertical stick), least squares (the sticks of A, B and
//                    C; sums of squares 19.8, 62.0, 8.6), slope and intercept in context (slope triangle, the observed
//                    interval, the intercept outside it), r = −0.96 and the residual plot (no pattern); one "why?"
//   3 Your turn      10 students (hours studied, score), LinReg(a+bx) output given: the student writes the line (choice),
//                    predicts at 8 hours (90.7), finds the residual of the student who scored 81 (−9.7) and says what
//                    it means; then the callback to the commit
//   4 Prove it       Riley: "r = 0.99 for stopping distance against speed, so a straight line is right". The residual
//                    plot is U-shaped; a because-chain from reason chips (distractors = catalogue misconceptions)
//   5 Practice       all 27 sub-goals one after another, then mixed (runtime/practice.ts); scatter plots, residual
//                    plots, data tables and technology output, the worked solution replayed on the picture after a miss
// Voiced lines: src/lesson/topics/linear-regression/script.ts -> voice/lines.json. Every answer is logged.
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
import type { GItem } from '../../src/lesson/topics/linear-functions-slope/graphPic';
import { DataCard, type DataCardBlock, type CardStep } from '../../src/lesson/topics/linear-regression/DataCard';
import type { Card, RG } from '../../src/lesson/topics/linear-regression/kit';
import { FAMILY_NAMES, GENERATORS, MC, type RItem } from '../../src/lesson/topics/linear-regression/items';
import { PLAN } from '../../src/lesson/topics/linear-regression/plan';
import { explain } from '../../src/lesson/topics/linear-regression/explain';
import { LINES } from '../../src/lesson/topics/linear-regression/script';
import { CARS, CAR_LINES, STOP, STUDY } from '../../src/lesson/topics/linear-regression/lessonData';

const SLUG = 'linear-regression';
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

// ===================== layout of parts 1-4: a wider board than the standard one (regression notation is long) =====================
const PF = frame(40, 70, 880, 940);
const SLATE = box(960, 70, 1880, 1010), LX2 = SLATE.x0 + 50, W2 = SLATE.w - 100;
function line2(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > W2) s -= 2;
  return { key, F, x: LX2, y, size: s, tags, col };
}
const lime = { col: 'link' as Paint }, amber = { col: 'first' as Paint }, teal = { col: 'second' as Paint }, lav = { col: 'pick' as Paint }, blue = { col: 'water' as Paint };

// ===================== planes from picture data =====================
const stepOf = (key: string) => key.split('#')[0]!;
function toP(it: GItem): PItem {
  if (it.kind === 'line') return { kind: 'curve', key: it.key, f: x => it.m * x + it.b, lo: it.lo, hi: it.hi, col: it.col, dash: it.dash, name: it.name };
  if (it.kind === 'vline') return { kind: 'vline', key: it.key, x: it.x, col: it.col ?? 'dim', dash: it.dash ?? true };
  if (it.kind === 'seg') return { kind: 'seg', key: it.key, a: it.a, b: it.b, col: it.col, arrow: it.arrow, dash: it.dash, w: it.w };
  if (it.kind === 'dots') throw new Error('dots are not used here');
  return it as PItem;
}
interface PlaneView { P: PlaneBlock; g: RG; draw(c: Canvas, k: (s: string) => number, f?: PFocus): void }
/** a Plane for picture data; a residual plot gets its x tick labels under the grid (not on the 0 line), a title top right */
function planeView(g: RG, fr: Frame): PlaneView {
  const x = g.resid ? { ...g.x, fmt: () => '' } : g.x;
  const P = Plane({ x, y: g.y, items: [...g.items, ...(g.solveItems ?? [])].map(toP) }, fr, th);
  const ticks: { t: string; x: number }[] = [];
  if (g.resid) {
    const n = Math.round((g.x.max - g.x.min) / g.x.step), vals = Array.from({ length: n + 1 }, (_, i) => g.x.min + i * g.x.step);
    const w = Math.max(...vals.map(v => wordsBox(fmtN(v), 0, 0, { size: 56 }).w)), cell = P.grid.w / n;
    const stride = [1, 2, 3, 4, 5].find(s => cell * s >= w + 20) ?? 5;
    vals.forEach((v, i) => { if (i % stride === 0) ticks.push({ t: fmtN(v), x: P.px(v, 0)[0] }); });
  }
  return {
    P, g,
    draw(c, k, f) {
      P.draw(c, progressOf<string>(s => k(stepOf(s))), f);
      const ka = k('axes');
      for (const t of ticks) drawWords(c, t.t, t.x, P.grid.y1 + 44, 'dim', ka, { size: 56, align: 'center' });
      if (g.title) drawWords(c, g.title, P.box.x1 - 24, P.box.y0 + 42, 'ink', ka, { size: 48, align: 'right', weight: 700 });
    },
  };
}
const ringOn = (key: string, col: Paint, k: number) => ({ key, col, k });

// ===================== the cars: one plane with every item the first two parts need =====================
const carX = { min: 0, max: 120, step: 10, name: 'Mileage (thousand miles)' }, carY = { min: 4, max: 28, step: 2, name: 'Price ($ thousands)' };
function carItems(): GItem[] {
  const { xs, ys } = CARS, L = CAR_LINES;
  const its: GItem[] = [];
  its.push({ kind: 'vline', key: 'v20', x: 20, col: 'dim', dash: true }, { kind: 'vline', key: 'v110', x: 110, col: 'dim', dash: true });
  its.push({ kind: 'line', key: 'LA', m: L.A.b, b: L.A.a, lo: 0, hi: 120, col: 'water', name: 'A' });
  its.push({ kind: 'line', key: 'LB', m: L.B.b, b: L.B.a, lo: 0, hi: 120, col: 'first', name: 'B' });
  its.push({ kind: 'line', key: 'LC', m: L.C.b, b: L.C.a, lo: 0, hi: 120, col: 'pick', name: 'C' });
  for (const [k, l, col] of [['sA', L.A, 'water'], ['sB', L.B, 'first'], ['sC', L.C, 'pick']] as const)
    xs.forEach((x, i) => { const yh = l.a + l.b * x; if (Math.abs(yh - ys[i]!) > 1e-6) its.push({ kind: 'seg', key: `${k}#${i}`, a: [x, yh], b: [x, ys[i]!], col, w: 4 }); });
  its.push({ kind: 'seg', key: 'e95', a: [95, 12.5], b: [95, 14], col: 'link', w: 6 });
  its.push({ kind: 'point', key: 'p95', x: 95, y: 12.5, col: 'link' });
  its.push({ kind: 'seg', key: 'run', a: [40, 19.1], b: [70, 19.1], col: 'second', arrow: true }, { kind: 'seg', key: 'rise', a: [70, 19.1], b: [70, 15.5], col: 'first', arrow: true });
  its.push({ kind: 'text', key: 'runT', x: 55, y: 20.4, text: '+30', col: 'second' }, { kind: 'text', key: 'riseT', x: 73, y: 17.3, text: '−3.6', col: 'first', align: 'left' });
  its.push({ kind: 'point', key: 'icpt', x: 0, y: 23.9, col: 'link' });
  its.push({ kind: 'text', key: 'icptT', x: 4, y: 25.6, text: '(0, 23.9)', col: 'link', align: 'left' });
  xs.forEach((x, i) => its.push({ kind: 'point', key: i === 6 ? 'car95' : `pts#${i}`, x, y: ys[i]!, col: 'ink' }));
  return its;
}
function carPlane(): PlaneView { return planeView({ x: carX, y: carY, items: carItems() }, PF); }
function carResidPlane(): PlaneView {
  const es = CARS.xs.map((x, i) => Math.round((CARS.ys[i]! - (CAR_LINES.C.a + CAR_LINES.C.b * x)) * 100) / 100);
  return planeView({ x: { ...carX, name: carX.name }, y: { min: -2.5, max: 2.5, step: 0.5, name: 'Residual ($ thousands)' }, resid: true,
    items: [{ kind: 'line', key: 'zero', m: 0, b: 0, lo: 0, hi: 120, col: 'dim' }, ...CARS.xs.map((x, i) => ({ kind: 'point', key: `rpt#${i}`, x, y: es[i]!, col: 'second' }) as GItem)] }, PF);
}

// ===================== 1. The question =====================
const CARDS = [
  { v: 'A', t: 'Line A', small: 'first to last car', mc: MC.firstLast, why: 'q.cb.first' },
  { v: 'B', t: 'Line B', small: 'through 3 cars', mc: MC.mostPoints, why: 'q.cb.most' },
  { v: 'C', t: 'Line C', small: 'through no car', mc: '', why: 'q.cb.right' },
];
function partQuestion(): void {
  tr.reset('q.');
  const S = carPlane();
  const lines = [line2('q.T1', '\\cssId{a}{A}\\qquad \\cssId{b}{B}\\qquad \\cssId{c}{C}', 200, 110, { a: blue, b: amber, c: lav }), line2('q.T2', '\\text{best fit?}', 360, 84)];
  setScene({ model: c => S.draw(c, s => tr.k('q.' + s)), lines, leads: [], boardBox: SLATE });
  tr.set('q.axes', 1, 1.0); tr.set('q.pts', 1, 1.0, 0.6); tr.set('q.car95', 1, 0.6, 1.0);
  tr.set('q.LA', 1, 1.2, 1.4); tr.set('q.LB', 1, 1.2, 2.0); tr.set('q.LC', 1, 1.2, 2.6);
  tr.set('q.T1', 1, 1.0, 3.0); tr.set('q.T2', 1, 0.8, 3.4);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 2]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '8 used cars, 3 lines (A first to last, B through 3 cars, C through none): which fits best?', board: 'A B C', response: c.t, expected: 'Line C', correct: c.v === 'C', mc: c.mc || undefined, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'Three lines, one cloud'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const S = carPlane(), RS = carResidPlane();
  const lines = [
    line2('e.E1', '\\hat{y} = 23.9 - 0.12x', 140, 70, undefined, 'link'),
    line2('e.E2', '\\hat{y} = 23.9 - 0.12(95) = \\cssId{p}{12.5}', 235, 64, { p: lime }),
    line2('e.E3', 'e = y - \\hat{y} = 14 - 12.5 = \\cssId{e}{+1.5}', 330, 64, { e: lime }),
    line2('e.S1', '\\cssId{n}{\\text{A:}}\\ \\sum e^2 = 19.8', 450, 64, { n: blue }),
    line2('e.S2', '\\cssId{n}{\\text{B:}}\\ \\sum e^2 = 62.0', 540, 64, { n: amber }),
    line2('e.S3', '\\cssId{n}{\\text{C:}}\\ \\sum e^2 = \\cssId{v}{8.6}', 630, 64, { n: lav, v: lime }),
    line2('e.B1', '\\cssId{b}{b = -0.12}\\ \\text{per } 1{,}000 \\text{ mi}', 750, 64, { b: amber }),
    line2('e.B2', '\\cssId{a}{a = 23.9}\\ \\text{at } x = 0', 840, 64, { a: lime }),
    line2('e.R', 'r = -0.96', 950, 70, undefined, 'link'),
  ];
  const ks = (s: string) => tr.k('e.' + s);
  setScene({
    model: c => {
      const sw = tr.k('e.swap');
      if (sw < 1) { c.g.save(); c.g.globalAlpha *= 1 - sw; S.draw(c, ks, { dim: tr.k('e.dimAB') > 0.5 ? ['LA', 'LB'] : [], ring: [ringOn('car95', 'pick', tr.k('e.r95')), ringOn('icpt', 'link', tr.k('e.rI'))] }); c.g.restore(); }
      if (sw > 0) { c.g.save(); c.g.globalAlpha *= sw; RS.draw(c, s => (s === 'axes' ? sw : tr.k('e.R' + s))); c.g.restore(); }
    },
    lines, leads: [], boardBox: SLATE,
  });
  for (const k of ['axes', 'pts', 'car95', 'LA', 'LB', 'LC']) tr.jump('e.' + k, 1);
  let step = 0;
  const STEPS = [
    { t: 'One car, one residual', why: 'Observed minus predicted.', act: 'Show the car' },
    { t: 'Least squares', why: 'Square every residual, then add.', act: 'Add them up' },
    { t: 'Slope and intercept', why: 'What the numbers say about cars.', act: 'Read them' },
    { t: 'r and the residual plot', why: 'How strong, and is a line right?', act: 'Check' },
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
        tr.set('e.dimAB', 1, 0.3); tr.set('e.r95', 1, 0.5); await wait(0.9); if (!alive()) return;
        tr.set('e.E1', 1, 1.0); tr.set('e.p95', 1, 0.7, 0.3); await wait(1.3); if (!alive()) return;
        tr.set('e.E2', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.e95', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.E3', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.r95', 0, 0.5);
      } else if (i === 1) {
        tr.set('e.e95', 0, 0.4); tr.set('e.p95', 0, 0.4); tr.set('e.E2:dim', 1, 0.5); tr.set('e.E3:dim', 1, 0.5);
        tr.set('e.dimAB', 0, 0.2);
        tr.set('e.sB', 1, 1.4); await wait(1.4); if (!alive()) return;
        tr.set('e.S2', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.sB', 0, 0.6); tr.set('e.sA', 1, 1.4, 0.4); await wait(1.8); if (!alive()) return;
        tr.set('e.S1', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.sA', 0, 0.6); tr.set('e.sC', 1, 1.4, 0.4); await wait(1.8); if (!alive()) return;
        tr.set('e.S3', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.dimAB', 1, 0.5);
      } else if (i === 2) {
        tr.set('e.sC', 0, 0.6); tr.set('e.S1:dim', 1, 0.5); tr.set('e.S2:dim', 1, 0.5);
        tr.set('e.run', 1, 1.0, 0.3); tr.set('e.runT', 1, 0.6, 1.0); tr.set('e.rise', 1, 1.0, 1.3); tr.set('e.riseT', 1, 0.6, 2.0); await wait(2.6); if (!alive()) return;
        tr.set('e.B1', 1, 1.1); await wait(1.5); if (!alive()) return;
        tr.set('e.v20', 1, 0.8); tr.set('e.v110', 1, 0.8, 0.2); await wait(1.0); if (!alive()) return;
        tr.set('e.icpt', 1, 0.7); tr.set('e.icptT', 1, 0.7, 0.2); tr.set('e.rI', 1, 0.5, 0.4); await wait(1.2); if (!alive()) return;
        tr.set('e.B2', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('e.rI', 0, 0.5);
      } else {
        tr.set('e.B1:dim', 1, 0.5); tr.set('e.B2:dim', 1, 0.5); tr.set('e.E1:dim', 1, 0.5);
        tr.set('e.R', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.sC', 1, 1.0); await wait(1.6); if (!alive()) return;
        tr.set('e.swap', 1, 1.2); await wait(1.0); if (!alive()) return;
        tr.set('e.Rzero', 1, 0.8); tr.set('e.Rrpt', 1, 1.4, 0.3); await wait(1.8);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Positive and negative residuals would cancel: a bad line can still add up to 0.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'So the line goes through as many cars as possible.', ok: false, id: 'e.why.most', mc: MC.mostPoints as string | undefined },
      { t: 'Adding them works just as well; squaring is only a habit.', ok: false, id: 'e.why.sum', mc: MC.signedTotal as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does least squares square the residuals instead of adding them?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: hours studied and test score =====================
function partTurn(): void {
  tr.reset('t.');
  const { xs, ys } = STUDY;
  const items: GItem[] = [
    { kind: 'line', key: 'fit', m: 4.69, b: 53.18, lo: 0, hi: 10, col: 'link' },
    { kind: 'vline', key: 'g8', x: 8, col: 'dim', dash: true },
    { kind: 'point', key: 'p8', x: 8, y: 90.7, col: 'link' },
    { kind: 'seg', key: 'e8', a: [8, 90.7], b: [8, 81], col: 'second', w: 6 },
    ...xs.map((x, i) => ({ kind: 'point', key: i === 8 ? 's8' : `pts#${i}`, x, y: ys[i]!, col: i === 8 ? 'pick' : 'first' }) as GItem),
  ];
  const S = planeView({ x: { min: 0, max: 10, step: 1, name: 'Hours studied' }, y: { min: 50, max: 105, step: 5, name: 'Test score (points)' }, items }, PF);
  const card: Card = { title: 'LinReg', lines: ['y=a+bx', 'a=53.1792', 'b=4.6918', 'r²=.8849', 'r=.9407'] };
  const made = tryBlock(() => DataCard(card, frame(980, 80, 880, 580), th));
  const C: DataCardBlock | null = made.ok ? made.value : null;
  const lines = [
    line2('t.L1', '\\hat{y} = 53.18 + 4.69x', 740, 68, undefined, 'link'),
    line2('t.L2', '\\hat{y} = 53.18 + 4.69(8) = \\cssId{v}{90.7}', 840, 64, { v: lime }),
    line2('t.L3', 'e = 81 - 90.7 = \\cssId{v}{-9.7}', 940, 64, { v: lime }),
  ];
  setScene({
    model: c => S.draw(c, s => tr.k('t.' + s), { ring: [ringOn('s8', 'pick', tr.k('t.r8'))] }),
    lines, leads: [], boardBox: SLATE,
    // the output card sits on the slate, so it is drawn after it
    extra: c => C?.draw(c, progressOf<CardStep>(s => tr.k('t.c' + s))),
  });
  tr.set('t.axes', 1, 1.0); tr.set('t.pts', 1, 1.0, 0.5); tr.set('t.s8', 1, 0.6, 0.8); tr.set('t.ccard', 1, 0.8, 1.2); tr.set('t.crows', 1, 1.4, 1.5);
  let step = 2;
  const STEPS = [
    { t: 'Enter the pairs', why: 'Done for you: L1 = hours, L2 = scores, row by row.' },
    { t: 'Run LinReg(a+bx)', why: 'Done for you: the output is on the board.' },
    { t: 'Write the line', why: 'Your step.' },
    { t: 'Predict, then the residual', why: 'Your step.' },
    { t: 'Say what it means', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: study time'), voiced('t.intro'), plan, work);
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
  const numStep = (sayId: string, unit: string, judge: (v: number) => { ok: boolean; id: string; mc?: string }, logItem: string, prompt: string, expected: number, onOk: (fb: HTMLElement) => void) => {
    const fbHost = h('div'), inp = numInput(unit, () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number first.')); return; }
      const j = judge(r.v);
      ctx.store.log({ part: 'turn', item: logItem, prompt, response: r.v, expected, correct: j.ok, mc: j.mc });
      fbHost.replaceChildren(voicedFb(j.id, j.ok));
      if (j.ok) { ok.disabled = true; onOk(fbHost); }
    }
    work.replaceChildren(voiced(sayId), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  };
  seq(async alive => {
    await wait(2.6); if (!alive()) return;
    choiceStep('t.eq', [
      { t: 'ŷ = 4.69 + 53.18x', ok: false, id: 't.eq.swap', mc: MC.swapAB },
      { t: 'ŷ = 53.18 + 4.69x', ok: true, id: 't.eq.ok' },
      { t: 'ŷ = 53.18 + 0.94x', ok: false, id: 't.eq.r', mc: MC.summaries },
    ], 'turn.equation', 'LinReg(a+bx): a = 53.1792, b = 4.6918, r = .9407. Which equation?', () => seq(async alive2 => {
      tr.set('t.fit', 1, 1.4); tr.set('t.L1', 1, 1.0, 0.6); await wait(2.2); if (!alive2()) return;
      step = 3; drawPlan(); askPredict();
    }));
  });
  function askPredict(): void {
    numStep('t.pred', 'points', v => (Math.abs(v - 90.7) < 0.051 ? { ok: true, id: 't.pred.ok' } : Math.abs(v - 430.13) < 0.6 ? { ok: false, id: 't.pred.swap', mc: MC.swapMB } : Math.abs(v - 81) < 1e-9 ? { ok: false, id: 't.pred.obs', mc: MC.onLine } : { ok: false, id: 't.pred.no' }),
      'turn.predict', 'ŷ = 53.18 + 4.69x: predict for 8 hours', 90.7, () => seq(async alive => {
        tr.set('t.g8', 1, 0.8); tr.set('t.p8', 1, 0.7, 0.6); tr.set('t.L2', 1, 1.1, 0.8); await wait(2.2); if (!alive()) return;
        askResidual();
      }));
  }
  function askResidual(): void {
    numStep('t.res', 'points', v => (Math.abs(v + 9.7) < 0.051 ? { ok: true, id: 't.res.ok' } : Math.abs(v - 9.7) < 0.051 ? { ok: false, id: 't.res.sign', mc: MC.residSign } : { ok: false, id: 't.res.no' }),
      'turn.residual', 'Observed 81 at 8 hours, ŷ = 90.7: residual?', -9.7, () => seq(async alive => {
        tr.set('t.r8', 1, 0.5); tr.set('t.e8', 1, 1.0, 0.3); tr.set('t.L3', 1, 1.1, 0.8); await wait(2.2); if (!alive()) return;
        tr.set('t.r8', 0, 0.5); step = 4; drawPlan(); askMeaning();
      }));
  }
  function askMeaning(): void {
    choiceStep('t.mean', [
      { t: 'The model under-predicts this student\'s score by 9.7 points.', ok: false, id: 't.mean.under', mc: MC.residSign },
      { t: 'The model over-predicts this student\'s score by 9.7 points.', ok: true, id: 't.mean.ok' },
      { t: 'The student scored 9.7 points.', ok: false, id: 't.mean.bare', mc: MC.bare },
    ], 'turn.meaning', 'e = −9.7 for the student with 8 hours: what does it mean?', () => { step = 5; drawPlan(); work.append(callback()); });
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id), ...(cd ? [html('p', 'dim', `(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)`)] : []), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Riley's r = 0.99 for stopping distance =====================
function partProve(): void {
  tr.reset('p.');
  const { xs, ys, a, b } = STOP;
  const es = xs.map((x, i) => Math.round((ys[i]! - (a + b * x)) * 10) / 10);
  const S = planeView({ x: { min: 15, max: 75, step: 5, name: 'Speed (mph)' }, y: { min: 0, max: 350, step: 50, name: 'Stopping distance (feet)' }, items: [
    { kind: 'line', key: 'fit', m: b, b: a, lo: 15, hi: 75, col: 'link' },
    ...xs.map((x, i) => ({ kind: 'seg', key: `st#${i}`, a: [x, a + b * x], b: [x, ys[i]!], col: es[i]! > 0 ? 'second' : 'wrong', w: 4 }) as GItem),
    { kind: 'point', key: 'p70', x: 70, y: Math.round((a + b * 70) * 10) / 10, col: 'link' },
    ...xs.map((x, i) => ({ kind: 'point', key: i === xs.length - 1 ? 'd70' : `pts#${i}`, x, y: ys[i]!, col: i === xs.length - 1 ? 'pick' : 'first' }) as GItem),
  ] }, PF);
  const RS = planeView({ x: { min: 15, max: 75, step: 5, name: 'Speed (mph)' }, y: { min: -25, max: 25, step: 5, name: 'Residual (feet)' }, resid: true, items: [
    { kind: 'line', key: 'zero', m: 0, b: 0, lo: 15, hi: 75, col: 'dim' },
    { kind: 'line', key: 'bend', m: 0, b: 0, col: 'pick', dash: true, lo: 18, hi: 72 },
    ...xs.map((x, i) => ({ kind: 'point', key: `rpt#${i}`, x, y: es[i]!, col: es[i]! > 0 ? 'second' : 'wrong' }) as GItem),
  ] }, PF);
  // the U through the residuals: the least-squares parabola e = 0.0542(x - 45)² - 13.6 (drawn dashed on the residual plot)
  const U = (x: number) => 0.0542 * (x - 45) * (x - 45) - 13.6;
  const lines = [
    line2('p.R', '\\text{Riley: } r = 0.99 \\Rightarrow \\text{a line is right}', 150, 64, undefined, 'dim'),
    line2('p.M', '\\hat{y} = -91.0 + 5.52x', 270, 66, undefined, 'link'),
    line2('p.E', 'e:\\ \\cssId{p}{+\\,+\\,+}\\ \\cssId{m}{-\\,-\\,-\\,-\\,-\\,-}\\ \\cssId{q}{+\\,+}', 390, 66, { p: teal, m: { col: 'wrong' }, q: teal }),
    line2('p.P', '\\hat{y}(70) \\approx 295 < 315', 510, 66),
    line2('p.Z', '|r| \\approx 1 \\not\\Rightarrow \\text{right form}', 630, 66, undefined, 'link'),
  ];
  const extra = (c: Canvas) => {
    const k = tr.k('p.strike');
    if (k > 0) { const L = lines[0]!, bb = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }); strike(c, bb.x0 - 10, bb.cy + 4, bb.x1 + 10, bb.cy - 4, k, { col: 'wrong' }); }
    const ku = tr.k('p.U') * tr.k('p.swap');
    if (ku > 0) {
      const P = RS.P, { g } = c;
      g.save(); g.globalAlpha *= ku; g.strokeStyle = '#C3AEF6'; g.lineWidth = 5; g.setLineDash([16, 12]); g.beginPath();
      for (let x = 18; x <= 72; x += 1) { const q = P.px(x, U(x)); if (x === 18) g.moveTo(q[0], q[1]); else g.lineTo(q[0], q[1]); }
      g.stroke(); g.restore();
    }
  };
  setScene({
    model: c => {
      const sw = tr.k('p.swap');
      if (sw < 1) { c.g.save(); c.g.globalAlpha *= 1 - sw; S.draw(c, s => tr.k('p.' + s), { ring: [ringOn('d70', 'pick', tr.k('p.r70'))] }); c.g.restore(); }
      if (sw > 0) { c.g.save(); c.g.globalAlpha *= sw; RS.draw(c, s => (s === 'axes' ? sw : s === 'bend' ? 0 : tr.k('p.R' + s))); c.g.restore(); }
    },
    lines, leads: [], boardBox: SLATE, extra,
  });
  tr.set('p.axes', 1, 1.0); tr.set('p.pts', 1, 1.0, 0.5); tr.set('p.d70', 1, 0.6, 0.9); tr.set('p.fit', 1, 1.2, 1.2); tr.set('p.R', 1, 1.0, 1.8); tr.set('p.M', 1, 1.0, 2.4);
  const CHIPS = [
    { t: 'Its residuals are positive at both ends and negative in the middle.', fits: 0 },
    { t: 'The points curve upward, away from the straight line.', fits: 1 },
    { t: 'r only measures how close points are to some straight line, not whether a line is the right form.', fits: 2 },
    { t: 'r near 1 always means a straight line is the right model.', fits: -1, mc: MC.highR, id: 'p.no.highR' },
    { t: 'The residuals are small next to 315 feet, so their pattern does not matter.', fits: -1, mc: MC.smallIgnore, id: 'p.no.small' },
    { t: 'r = 0.99 means 99% of the predictions are right.', fits: -1, mc: MC.rPercent, id: 'p.no.pct' },
  ];
  const CLAIMS = [
    'The residual plot is U-shaped,',
    'so the line misses in a system: at 70 mph it predicts about 295 feet, but the car needs 315,',
    'and r = 0.99 does not rescue the line,',
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
        tr.set('p.st', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('p.swap', 1, 1.2); tr.set('p.Rzero', 1, 0.6, 0.6); tr.set('p.Rrpt', 1, 1.2, 0.9); await wait(2.2); if (!alive()) return;
        tr.set('p.U', 1, 1.2); tr.set('p.E', 1, 1.0, 0.4); await wait(1.6);
      }
      if (n === 2) {
        tr.set('p.U', 0, 0.5); tr.set('p.swap', 0, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('p.r70', 1, 0.5); tr.set('p.p70', 1, 0.7, 0.3); tr.set('p.P', 1, 1.0, 0.6); await wait(1.8); if (!alive()) return;
        tr.set('p.r70', 0, 0.6);
      }
      if (n === 3) {
        tr.set('p.Z', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('p.strike', 1, 0.7); await wait(1.0); if (!alive()) return;
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
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: r = 0.99 for stopping distance against speed, so a straight line is the right model. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.highR : undefined });
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
    show: it => showItem(it as RItem),
  });
}
/** the steps of a picture plane: shown with the question, and (solveItems) on the worked solution */
const stepsIn = (its: readonly GItem[] | undefined) => [...new Set((its ?? []).map(i => stepOf(i.key)))];
function showItem(item: RItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture ?? {}, g = pic.g as RG | undefined, g2 = pic.g2 as RG | undefined, card = pic.card as Card | undefined;
  const hasBoard = !!item.board;
  let fG: Frame = MF, fG2: Frame | null = null, fCard: Frame | null = null, bBox: Box | null = null;
  if (g && g2) { fG = frame(40, 70, 920, 940); fG2 = hasBoard ? frame(1000, 300, 880, 710) : frame(1000, 70, 880, 940); bBox = hasBoard ? box(1000, 70, 1880, 270) : null; }
  else if (g && card) { fG = frame(40, 70, 940, 940); fCard = hasBoard ? frame(1040, 260, 840, 750) : frame(1040, 70, 840, 940); bBox = hasBoard ? box(1040, 70, 1880, 240) : null; }
  else if (g) { bBox = hasBoard ? box(1060, 70, 1880, 300) : null; }
  else if (card) { fCard = frame(60, 70, 940, 940); bBox = hasBoard ? box(1060, 70, 1880, 300) : null; }
  const V1 = g ? tryBlock(() => planeView(g, fG)) : null, V2 = g2 && fG2 ? tryBlock(() => planeView(g2, fG2!)) : null;
  const VC = card && fCard ? tryBlock(() => DataCard(card, fCard!, th)) : null;
  for (const m of [V1, V2, VC]) if (m && !m.ok) console.warn('picture did not fit', item.id, m.error);
  const P1 = V1 && V1.ok ? V1.value : null, P2 = V2 && V2.ok ? V2.value : null, CB = VC && VC.ok ? VC.value : null;
  if (!P1 && !P2 && !CB) {
    // no picture: the board big on a wide slate
    const big = box(200, 180, 1720, 900);
    const top = bigLine('x.B', item.board || '\\text{?}', big, 120);
    setScene({ lines: item.board ? [top] : [], leads: [], boardBox: big });
    tr.set('x.B', 1, 0.8, 0.1);
    return {};
  }
  const lines = bBox && item.board ? [bigLine('x.B', item.board, bBox, 84)] : [];
  const ringRows = card?.ring ?? [];
  setScene({
    model: c => {
      P1?.draw(c, s => tr.k('x.' + s));
      P2?.draw(c, s => tr.k('x2.' + s));
      CB?.draw(c, progressOf<CardStep>(s => tr.k('x.c' + s)), { ring: ringRows.map(r => ({ row: r, col: 'pick' as Paint, k: tr.k('x.ring') })) });
    },
    lines, leads: [], boardBox: bBox,
  });
  if (P1) { tr.set('x.axes', 1, 0.8); stepsIn(g!.items).forEach((k, i) => tr.set('x.' + k, 1, 0.9, 0.2 + 0.15 * i)); }
  if (P2) { tr.set('x2.axes', 1, 0.8, 0.3); stepsIn(g2!.items).forEach((k, i) => tr.set('x2.' + k, 1, 0.9, 0.5 + 0.15 * i)); }
  if (CB) { tr.set('x.ccard', 1, 0.8, 0.2); tr.set('x.crows', 1, 1.2, 0.5); tr.set('x.ring', 1, 0.5, 1.2); }
  tr.set('x.B', 1, 0.8, 0.3);
  const solve1 = P1 ? stepsIn(g!.solveItems) : [], solve2 = P2 ? stepsIn(g2!.solveItems) : [], fill = !!(CB && card?.solveCells?.length);
  return {
    solve: solve1.length || solve2.length || fill ? async alive => {
      for (const k of solve1) { tr.set('x.' + k, 1, 1.0); await wait(0.6); if (!alive()) return; }
      for (const k of solve2) { tr.set('x2.' + k, 1, 1.0); await wait(0.6); if (!alive()) return; }
      if (fill) tr.set('x.cfill', 1, 0.9);
      await wait(0.8);
    } : undefined,
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\hat{y} = 23.9 - 0.12x \\quad \\sum e^2 \\quad r = -0.96 \\quad |r| \\approx 1 \\not\\Rightarrow \\text{right form}', '(x,\\ y - \\hat{y})\\quad r^2 = 0.77 \\quad SST'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
