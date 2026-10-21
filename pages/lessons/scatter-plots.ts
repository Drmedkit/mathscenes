// scatter-plots.ts: "Scatter plots and bivariate data" (grade 8, 8.SP.A.1-4) on the shared lesson runtime.
//   1 The question   12 summer days at a smoothie stand (high °F, smoothies sold), two of them at 80°F: tomorrow is
//                    80°F, how many to plan for? Cards 72 (one day: single-case), about 65 (the trend), can't tell
//                    (the 80°F days disagree: expects-points-on-fitted-line) + how sure
//   2 Worked example four sub-goal steps on the plot: one day = one dot (rows become dots, both 80°F days kept),
//                    describe the cloud (direction arrow, straight edge, closeness), fit a trend line (slope triangle,
//                    y = 2.5x - 135), predict at 80°F (guide up to the line and across: 65; the real days 58 and 72
//                    sit on either side); one "why?" with 3 reasons
//   3 Your turn      faded from the end: plot, description and line are given; the kid predicts at 86°F (80), reads
//                    the slope (on average) and the intercept (-135 at 0°F means nothing here)
//   4 Prove it       Riley: "at 120°F she'll sell 165": a because-chain (extrapolation, the data are silent past
//                    94°F, 65 at 80°F stays fair); distractor chips are catalogue misconceptions
//   5 Practice       all 22 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: pages/lessons/scatter-plots/voice/lines.json (texts in src/lesson/topics/scatter-plots/script.ts).
import { type Canvas, drawOn, strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { rectPts } from '../../src/core/pts';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { MF, bigLine, type Lead, type Line, line, partOf, seq, setScene, tr, wait, markDirty } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { drawWords } from '../../src/lesson/words';
import { type PlotSpec, type TableSpec, SM_LINE, SM_PLOT, SM_WIDE, SMOOTHIE } from '../../src/lesson/topics/scatter-plots/bivariate';
import { Scatter, type ScatterBlock, type ScatterFocus } from '../../src/lesson/topics/scatter-plots/Scatter';
import { TableCard, type TableBlock, type TableFocus } from '../../src/lesson/topics/scatter-plots/TableCard';
import { FAMILY_NAMES, GENERATORS, MC, type SPItem } from '../../src/lesson/topics/scatter-plots/items';
import { PLAN } from '../../src/lesson/topics/scatter-plots/plan';
import { BOARD_TEX as BT, PANEL } from '../../src/lesson/topics/scatter-plots/script';
import LINES from './scatter-plots/voice/lines.json';

const SLUG = 'scatter-plots';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the panel shows PANEL[id], the narrator says lines.json[id] */
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, PANEL[id] ?? id);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, PANEL[id] ?? id); }

// ===================== shared pieces =====================
const k = (key: string) => tr.k(key);
const SM_TREND = { m: SM_LINE.m, b: SM_LINE.b, x0: 66, x1: 95, col: 'link' as const };
const smTable: TableSpec = { head: ['°F', 'sold'], rows: SMOOTHIE.map(p => [String(p.x), String(p.y)]), split: true };
const I80 = SMOOTHIE.map((p, i) => (p.x === 80 ? i : -1)).filter(i => i >= 0);
/** a lesson scene: the plot on the left, notation on the board, maybe the data table on the board */
function lessonScene(S: ScatterBlock, focus: () => ScatterFocus, lines: Line[], leads: Lead[], table?: { T: TableBlock; k: () => number; f: () => TableFocus }, extra?: (c: Canvas) => void): void {
  setScene({
    model: c => S.draw(c, focus()), lines, leads,
    extra: c => { if (table) { const a = table.k(); if (a > 0) { c.g.save(); c.g.globalAlpha *= a; table.T.draw(c, table.f()); c.g.restore(); } } extra?.(c); },
  });
}
const BOARD_TABLE = frame(1250, 96, 600, 640);

// ===================== 1. The question =====================
const CARDS = [
  { v: '72', small: 'like the last 80°F day', mc: MC.singleCase, why: 'q.cb.single', right: false },
  { v: 'about 65', small: 'from all 12 days', mc: '', why: 'q.cb.right', right: true },
  { v: 'can’t tell', small: 'the 80°F days disagree', mc: MC.onLine, why: 'q.cb.none', right: false },
];
function partQuestion(): void {
  tr.reset('q.');
  const S = Scatter(SM_PLOT, MF), T = TableCard(smTable, BOARD_TABLE);
  const Lq = line('q.L', BT.q, 870, 70);
  lessonScene(S, () => ({ shown: 12 * k('q.pts'), rings: I80.map(i => ({ i, col: 'pick' as Paint, k: k('q.r80') })) }), [Lq], [],
    { T, k: () => k('q.tab'), f: () => ({ rows: k('q.r80') > 0.3 ? Object.fromEntries(I80.map(i => [i, 'pick'])) : {} }) });
  tr.set('q.tab', 1, 0.8, 0.2); tr.set('q.pts', 1, 2.4, 0.9); tr.set('q.r80', 1, 0.8, 3.6); tr.set('q.L', 1, 1.0, 4.2);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '12 days of high temperature and smoothies sold; two 80°F days sold 58 and 72. Tomorrow is 80°F: how many to plan for?', board: 'x = 80, y = ?', response: c.v, expected: 'about 65', correct: c.right, mc: c.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>${cd.small}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Plan for tomorrow'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
const EX_SPEC: PlotSpec = { ...SM_PLOT, lines: [SM_TREND], marks: [{ x: 70, y: 40, tag: 'P' }, { x: 90, y: 90, tag: 'Q' }], ruler: { m: SM_LINE.m, b: SM_LINE.b } };
function exampleFocus(pre: string, cur: { i: number }): ScatterFocus {
  return {
    shown: tr.k(pre + 'shown'), cur: cur.i >= 0 ? { i: cur.i, k: k(pre + 'cur') } : undefined,
    arrow: k(pre + 'arrow'), ruler: k(pre + 'ruler'), lines: [k(pre + 'line')], marks: k(pre + 'marks'), markCol: { P: 'link', Q: 'link' },
    tri: { x1: 70, y1: 40, x2: 90, y2: 90, k: k(pre + 'tri'), run: '20', rise: '50' },
    sticks: { line: 0, k: k(pre + 'sticks') }, guide: { x: 80, line: 0, k: k(pre + 'guide') },
    rings: I80.map(i => ({ i, col: 'pick' as Paint, k: k(pre + 'r80') })),
  };
}
function partExample(): void {
  tr.reset('e.');
  const S = Scatter(EX_SPEC, MF), T = TableCard(smTable, BOARD_TABLE);
  const pick = { col: 'pick' as Paint }, link = { col: 'link' as Paint };
  const L = {
    dir: line('e.dir', BT.dir, 150, 62, { v: pick }), form: line('e.form', BT.form, 238, 62, { v: pick }), str: line('e.str', BT.str, 326, 62, { v: pick }),
    slope: line('e.slope', BT.slope, 470, 74, { r: pick, u: pick, m: link }), bl: line('e.bl', BT.bLine, 600, 68), eq: line('e.eq', BT.eq, 700, 74, { m: link, b: link }),
    pred: line('e.pred', BT.pred, 820, 70), predV: line('e.predV', BT.predV, 920, 74, { v: link }),
  };
  const cur = { i: -1 };
  let rowLit: Record<number, Paint> = {};
  lessonScene(S, () => exampleFocus('e.', cur), Object.values(L), [], { T, k: () => k('e.tab'), f: () => ({ rows: rowLit }) });
  tr.jump('e.tab', 1); tr.jump('e.shown', 0);
  let step = 0;
  const STEPS = [
    { t: 'One day, one dot', why: 'Each row of the table becomes one dot.', act: 'Plot the days' },
    { t: 'Describe the cloud', why: 'Direction, form and strength.', act: 'Describe it' },
    { t: 'Fit a trend line', why: 'Through the middle, close to the dots all along.', act: 'Fit a line' },
    { t: 'Predict at 80°F', why: 'Read the LINE, not one dot.', act: 'Predict' },
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
        for (let j = 0; j < SMOOTHIE.length; j++) {
          const slow = j < 3 || I80.includes(j), d = slow ? 1.1 : 0.42;
          cur.i = j; rowLit = { [j]: 'pick' }; tr.jump('e.cur', 0); tr.set('e.cur', 1, d * 0.8); markDirty();
          await wait(d * 0.8); if (!alive()) return;
          tr.set('e.shown', j + 1, 0.25); await wait(slow ? 0.45 : 0.2); if (!alive()) return;
        }
        cur.i = -1; rowLit = Object.fromEntries(I80.map(j => [j, 'pick'])); tr.set('e.r80', 1, 0.6); await wait(1.0); if (!alive()) return;
      } else if (i === 1) {
        rowLit = {}; tr.set('e.r80', 0, 0.5); tr.set('e.tab', 0, 0.7); await wait(0.6); if (!alive()) return;
        tr.set('e.arrow', 1, 1.1); await wait(0.9); if (!alive()) return; tr.set('e.dir', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('e.ruler', 1, 0.9); await wait(0.9); if (!alive()) return; tr.set('e.form', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('e.sticks', 1, 1.0); await wait(1.0); if (!alive()) return; tr.set('e.str', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.sticks', 0, 0.6); tr.set('e.arrow', 0, 0.6);
      } else if (i === 2) {
        for (const key of ['e.dir', 'e.form', 'e.str']) tr.set(key + ':dim', 1, 0.5);
        tr.set('e.ruler', 0, 0.6); tr.set('e.line', 1, 1.4, 0.3); await wait(1.8); if (!alive()) return;
        tr.set('e.marks', 1, 0.6); await wait(0.7); if (!alive()) return;
        tr.set('e.tri', 1, 1.6); await wait(1.4); if (!alive()) return; tr.set('e.slope', 1, 1.1); await wait(1.4); if (!alive()) return;
        tr.set('e.bl', 1, 1.0); await wait(1.2); if (!alive()) return; tr.set('e.eq', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.sticks', 1, 0.9); await wait(1.4); if (!alive()) return; tr.set('e.sticks', 0, 0.6);
      } else {
        for (const key of ['e.slope', 'e.bl']) tr.set(key + ':dim', 1, 0.5);
        tr.set('e.tri', 0, 0.6); tr.set('e.marks', 0, 0.6);
        tr.set('e.guide', 1, 1.8); await wait(1.9); if (!alive()) return;
        tr.set('e.pred', 1, 1.1); await wait(1.2); if (!alive()) return; tr.set('e.predV', 1, 0.9); await wait(1.1); if (!alive()) return;
        tr.set('e.r80', 1, 0.6); await wait(0.8); if (!alive()) return;
      }
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The line uses all 12 days; any single day can run high or low.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'The line says exactly 65 will sell on an 80°F day.', ok: false, id: 'e.why.exact', mc: MC.certain as string | undefined },
      { t: 'Only the 80°F days count, and 65 is their average.', ok: false, id: 'e.why.only', mc: MC.singleCase as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, j) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, m) => { b.classList.remove('right', 'nope'); if (m === j) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why plan for about 65 smoothies, and not 72?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn (faded from the end) =====================
function partTurn(): void {
  tr.reset('t.');
  const spec: PlotSpec = { ...SM_PLOT, lines: [SM_TREND], band: [68, 94] };
  const S = Scatter(spec, MF);
  const link = { col: 'link' as Paint }, pick = { col: 'pick' as Paint };
  const L = { eq: line('t.eq', BT.turnEq, 160, 76), pred: line('t.pred', BT.turnPred, 300, 70), predV: line('t.predV', BT.turnPredV, 395, 74, { v: link }), int: line('t.int', BT.turnInt, 540, 72, { v: pick }) };
  lessonScene(S, () => ({ shown: 12, lines: [k('t.line')], guide: { x: 86, line: 0, k: k('t.guide') }, band: k('t.band'), sticks: { line: 0, k: k('t.sticks') } }), Object.values(L), []);
  tr.set('t.line', 1, 1.2, 0.4); tr.set('t.eq', 1, 1.0, 1.4);
  let step = 3;
  const STEPS = [
    { t: 'One day, one dot', why: 'Done for you.' },
    { t: 'Describe the cloud', why: 'Done for you: positive, linear, strong.' },
    { t: 'Fit a trend line', why: 'Done for you: y = 2.5x − 135.' },
    { t: 'Predict at 86°F', why: 'Your step.' },
    { t: 'Read the slope', why: 'Your step.' },
    { t: 'Read the intercept', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: an 86°F day'), voiced('t.intro'), plan, work);
  seq(async alive => { await wait(2.6); if (!alive()) return; askPred(); });
  function askPred(): void {
    const fbHost = h('div'), inp = numInput('smoothies', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.pred.empty', false)); return; }
      const v = r.v, right = v === 80;
      const mc = v === 82 || v === 79 ? MC.nearest : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.predict', prompt: 'y = 2.5x - 135: predict smoothies at 86°F', board: 'y = 2.5x - 135', response: v, expected: 80, correct: right, mc });
      if (!right) { fbHost.replaceChildren(voicedFb(v === 215 ? 't.pred.mult' : mc ? 't.pred.near' : 't.pred.no', false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.pred.ok', true));
      seq(async alive => {
        tr.set('t.guide', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('t.pred', 1, 1.0); tr.set('t.predV', 1, 0.9, 0.9); await wait(2.0); if (!alive()) return;
        step = 4; drawPlan(); askSlope();
      });
    }
    work.replaceChildren(voiced('t.pred'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function choose(id: string, item: string, prompt: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], then: () => void, onPick?: (o: { ok: boolean; id: string }) => void): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    let done = false;
    opts.forEach((o, j) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, m) => { b.classList.remove('right', 'nope'); if (m === j) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item, prompt, response: o.t, expected: opts.find(x => x.ok)!.t, correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      onPick?.(o);
      if (o.ok) { done = true; then(); }
    })));
    work.replaceChildren(voiced(id), bx, fbHost);
  }
  function askSlope(): void {
    tr.set('t.pred:dim', 1, 0.5); tr.set('t.predV:dim', 1, 0.5); tr.set('t.guide', 0, 0.6);
    choose('t.slope', 'turn.slope', 'What does the slope 2.5 mean?', [
      { t: 'On average, each extra degree goes with about 2.5 more smoothies sold.', ok: true, id: 't.slope.ok' },
      { t: 'Every day that is 1°F warmer sells exactly 2.5 more smoothies.', ok: false, id: 't.slope.exact', mc: MC.slopeExact },
      { t: 'Each extra degree causes 2.5 more smoothies to sell.', ok: false, id: 't.slope.cause', mc: MC.cause },
    ], () => seq(async alive => { await wait(1.6); if (!alive()) return; step = 5; drawPlan(); askInt(); }),
    o => { if (o.id === 't.slope.exact') seq(async alive => { tr.set('t.sticks', 1, 0.8); await wait(2.4); if (!alive()) return; tr.set('t.sticks', 0, 0.6); }); });
  }
  function askInt(): void {
    tr.set('t.int', 1, 1.0); tr.set('t.band', 1, 0.9, 0.4);
    choose('t.int', 'turn.intercept', 'The equation gives -135 at 0°F. What does that mean?', [
      { t: 'Nothing real: 0°F is far outside the logged 68°F to 94°F, and sales can’t be negative.', ok: true, id: 't.int.ok' },
      { t: 'At 0°F the stand would sell −135 smoothies.', ok: false, id: 't.int.real', mc: MC.interceptReal },
      { t: 'The line must be wrong, so it is useless.', ok: false, id: 't.int.wrong', mc: MC.worthless },
    ], () => { step = 6; drawPlan(); work.append(callback()); });
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pk = commit().pick, cd = pk === null ? null : CARDS[pk]!;
    const id = cd ? cd.why : 'q.cb.skip';
    const p = voiced(id);
    if (cd) p.innerHTML += ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>`;
    c.append(p, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Riley at 120°F =====================
function partProve(): void {
  tr.reset('p.');
  const spec: PlotSpec = { ...SM_WIDE, lines: [{ ...SM_TREND, x1: 94 }, { m: SM_LINE.m, b: SM_LINE.b, x0: 94, x1: 120, col: 'wrong', dash: true }], band: [68, 94], marks: [{ x: 120, y: 165, tag: '?' }] };
  const S = Scatter(spec, MF);
  const wrong = { col: 'wrong' as Paint }, link = { col: 'link' as Paint }, pick = { col: 'pick' as Paint };
  const L = {
    ra: line('p.ra', BT.rileyA, 140, 60), rb: line('p.rb', BT.rileyB, 232, 70), rc: line('p.rc', BT.rileyC, 322, 70, { v: wrong }),
    p1: line('p.p1', BT.p1, 470, 72, {}, 'pick'), p2: line('p.p2', BT.p2, 575, 72, { v: wrong }), p3: line('p.p3', BT.p3, 690, 72, {}, 'wrong'), p4: line('p.p4', BT.p4, 810, 72, { v: link }),
  };
  void pick;
  const extra = (c: Canvas) => { const ks = k('p.strike'); if (ks > 0) { const b = partOf(L.rc, 'v'); strike(c, b.x0 - 10, b.cy + 6, b.x1 + 10, b.cy - 6, ks, { col: 'wrong' }); } };
  lessonScene(S, () => ({ shown: 12, lines: [1, k('p.ext')], lineDim: [0, k('p.extDim')], marks: k('p.mark'), markCol: { '?': 'wrong' }, band: k('p.band'), guide: { x: 80, line: 0, k: k('p.guide') } }), Object.values(L), [], undefined, extra);
  tr.set('p.ra', 1, 0.8, 0.6); tr.set('p.rb', 1, 1.0, 1.2); tr.set('p.rc', 1, 0.8, 2.0); tr.set('p.ext', 1, 1.4, 1.6); tr.set('p.mark', 1, 0.6, 2.9);
  const CHIPS = [
    { t: 'No day was exactly 120°F.', fits: -1, mc: MC.unobserved, id: 'p.no.exact' },
    { t: 'The logged days ran from 68°F to 94°F, and 120 is outside that.', fits: 0 },
    { t: 'A straight line goes on forever, so it still holds.', fits: -1, mc: MC.noLimit, id: 'p.no.line' },
    { t: 'The pattern was only seen from 68°F to 94°F. Past that it may bend or stop.', fits: 1 },
    { t: 'The plot’s axis stopped at 95°F.', fits: -1, mc: MC.axisRange, id: 'p.no.axis' },
    { t: '80°F is inside the logged range, where the line follows the dots.', fits: 2 },
    { t: 'No prediction about the future can be trusted.', fits: -1, mc: MC.worthless, id: 'p.no.worthless' },
  ];
  const CLAIMS = [
    '<b>120°F is an extrapolation</b>,',
    'the data say nothing about sales on a 120°F day,',
    'so 165 is only a guess, while about 65 at 80°F is a fair estimate,',
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
      if (n === 1) { tr.set('p.band', 1, 0.9); await wait(0.9); if (!alive()) return; tr.set('p.p1', 1, 1.0); await wait(1.1); if (!alive()) return; tr.set('p.p2', 1, 0.9); }
      if (n === 2) { tr.set('p.extDim', 1, 0.8); await wait(0.8); if (!alive()) return; tr.set('p.strike', 1, 0.6); tr.set('p.p3', 1, 0.9, 0.3); }
      if (n === 3) {
        tr.set('p.guide', 1, 1.6); await wait(1.6); if (!alive()) return; tr.set('p.p4', 1, 1.0); await wait(1.2); if (!alive()) return;
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
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: at 120°F the stand will sell 2.5(120) - 135 = 165 smoothies. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.noLimit : undefined });
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
    show: it => showItem(it as SPItem),
  });
}
const WIDE = frame(330, 70, 1260, 940), TWO = [frame(40, 130, 900, 890), frame(980, 130, 900, 890)] as const;
const TABLE_WIDE = frame(200, 110, 1520, 860);
function showItem(item: SPItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture.pic;
  const boardLines: Line[] = item.board ? [line('x.B', item.board, 200, 80)] : [];
  if (item.board) tr.set('x.B', 1, 0.8, 0.3);
  // state the solve changes
  const st = { best: -1, marks: {} as Record<string, Paint>, rings: [] as { i: number; col: Paint; key: string }[], guide: null as { x: number; line: number } | null, pickPlot: -1, rows: {} as Record<number, Paint>, cols: {} as Record<number, Paint>, cells: [] as { r: number; c: number; key: string }[], reveal: null as { r: number; c: number; t: string } | null };
  const step = (a: number) => wait(a);
  if (pic.kind === 'slate') {
    const big = box(260, 230, 1660, 790);
    setScene({ lines: item.board ? [bigLine('x.T', item.board, big, 120)] : [], leads: [], boardBox: big });
    tr.set('x.T', 1, 0.9, 0.1);
    return {};
  }
  if (pic.kind === 'table') {
    const fr = item.board ? MF : TABLE_WIDE;
    const made = tryBlock(() => TableCard(pic.table, fr));
    if (!made.ok) { console.error(made.error); return {}; }
    const T = made.value;
    setScene({ lines: boardLines, leads: [], boardBox: item.board ? undefined : null,
      model: c => T.draw(c, { rows: st.rows, cols: st.cols, cells: st.cells.map(q => ({ r: q.r, c: q.c, col: 'link' as Paint, k: k(q.key) })), dim: k('x.dim'), reveal: st.reveal ? { ...st.reveal, k: k('x.reveal') } : undefined }) });
    return { solve: pic.solve.length ? async alive => {
      tr.set('x.dim', 1, 0.5);
      for (const a of pic.solve) {
        if (a.a === 'row') st.rows = { ...st.rows, [a.r]: 'pick' };
        else if (a.a === 'col') st.cols = { ...st.cols, [a.c]: 'pick' };
        else if (a.a === 'cell') { const key = `x.cell${st.cells.length}`; st.cells.push({ r: a.r, c: a.c, key }); tr.set(key, 1, 0.8); }
        else if (a.a === 'reveal') { st.reveal = { r: a.r, c: a.c, t: a.t }; tr.set('x.reveal', 1, 0.8); }
        markDirty(); await step(1.1); if (!alive()) return;
      }
    } : undefined };
  }
  if (pic.kind === 'two') {
    const A = tryBlock(() => Scatter(pic.a, TWO[0])), B = tryBlock(() => Scatter(pic.b, TWO[1]));
    if (!A.ok || !B.ok) { console.error(A.ok ? '' : A.error, B.ok ? '' : B.error); return {}; }
    const blocks = [A.value, B.value];
    setScene({ boardBox: null, lines: [], leads: [],
      model: c => {
        blocks.forEach((S, i) => {
          S.draw(c, {});
          drawWords(c, `Plot ${i ? 'B' : 'A'}`, TWO[i]!.x + 40, TWO[i]!.y - 70, 'ink', 1, { size: 56, weight: 700 });
          const on = st.pickPlot === i || st.pickPlot === 2;
          if (on) { const p = S.where.plot; drawOn(c, rectPts(p.x0 - 26, p.y0 - 26, p.w + 52, p.h + 52, 18), k('x.pick'), { col: 'link', lw: 5, closed: true, glow: 10, glowCol: 'link' }); }
        });
      } });
    return { solve: async alive => {
      for (const a of pic.solve) if (a.a === 'pickPlot') { st.pickPlot = a.which; tr.set('x.pick', 1, 1.2); markDirty(); await step(1.3); if (!alive()) return; }
    } };
  }
  // a plot, maybe with a table or notation on the board
  const useBoard = !!(item.board || pic.table);
  const made = tryBlock(() => Scatter(pic.plot, useBoard ? MF : WIDE));
  if (!made.ok) { console.error(made.error); setScene({ lines: [bigLine('x.T', item.board || '\\,', box(260, 230, 1660, 790), 120)], leads: [], boardBox: box(260, 230, 1660, 790) }); tr.set('x.T', 1, 0.9); return {}; }
  const S = made.value;
  let T: TableBlock | null = null;
  if (pic.table) { const t = tryBlock(() => TableCard(pic.table!, frame(1250, item.board ? 280 : 100, 600, item.board ? 720 : 900))); if (t.ok) T = t.value; else console.error(t.error); }
  const show = pic.show ?? {};
  const nL = pic.plot.lines?.length ?? 0;
  const lineKeys = Array.from({ length: nL }, (_, i) => `x.L${i}`);
  lineKeys.forEach((key, i) => { if (!show.lines || show.lines.includes(i)) tr.set(key, 1, 1.0, 0.6 + 0.3 * i); });
  if (show.marks) tr.set('x.marks', 1, 0.6, 0.5);
  if (show.join) tr.set('x.join', 1, 1.4, 0.8);
  if (show.ruler) tr.set('x.ruler', 1, 0.8, 0.7);
  if (show.band) tr.set('x.band', 1, 0.8, 0.7);
  if (show.groups) tr.set('x.groups', 1, 1.0, 0.7);
  if (show.arrow) tr.set('x.arrow', 1, 1.0, 0.7);
  if (show.guide) { st.guide = show.guide; tr.set('x.guide', 1, 1.4, 0.9); }
  (show.rings ?? []).forEach((r, i) => { const key = `x.sr${i}`; st.rings.push({ i: r.i, col: r.col, key }); tr.set(key, 1, 0.7, 0.8); });
  tr.set('x.pts', 1, 1.0, 0.1);
  let sticksLine = 0;
  const focus = (): ScatterFocus => ({
    shown: pic.plot.pts.length * k('x.pts'),
    lines: lineKeys.map(key => k(key)),
    lineCol: lineKeys.map((_, i) => (st.best >= 0 && i === st.best ? 'link' : undefined)),
    lineDim: lineKeys.map((_, i) => (st.best >= 0 && i !== st.best ? k('x.best') : 0)),
    join: k('x.join'), ruler: k('x.ruler'), band: k('x.band'), groups: k('x.groups'), arrow: k('x.arrow'), marks: k('x.marks'), markCol: st.marks,
    guide: st.guide ? { ...st.guide, k: k('x.guide') } : undefined,
    sticks: { line: sticksLine, k: k('x.sticks') },
    rings: st.rings.map(r => ({ i: r.i, col: r.col, k: k(r.key) })),
  });
  setScene({ lines: boardLines, leads: [], boardBox: useBoard ? undefined : null, model: c => S.draw(c, focus()),
    extra: T ? c => T!.draw(c, { rows: st.rows, cols: st.cols, dim: k('x.tdim') }) : undefined });
  return { solve: pic.solve.length ? async alive => {
    for (const a of pic.solve) {
      switch (a.a) {
        case 'line': tr.set(`x.L${a.i}`, 1, 1.2); break;
        case 'best': st.best = a.i; tr.set('x.best', 1, 0.8); tr.set(`x.L${a.i}`, 1, 0.6); break;
        case 'guide': st.guide = { x: a.x, line: a.line }; tr.set(`x.L${a.line}`, 1, 0.6); tr.jump('x.guide', 0); tr.set('x.guide', 1, 1.6); break;
        case 'sticks': sticksLine = a.line; tr.set('x.sticks', 1, 1.0); break;
        case 'ring': a.i.forEach(i => { const key = `x.r${st.rings.length}`; st.rings.push({ i, col: a.col ?? 'link', key }); tr.set(key, 1, 0.8); }); break;
        case 'groups': tr.set('x.groups', 1, 1.2); break;
        case 'band': tr.set('x.band', 1, 0.9); break;
        case 'ruler': tr.set('x.ruler', 1, 1.0); break;
        case 'arrow': tr.set('x.arrow', 1, 1.0); break;
        case 'mark': st.marks = { ...st.marks, [a.tag]: 'link' }; tr.set('x.marks', 1, 0.4); break;
        case 'unjoin': tr.set('x.join', 0, 1.0); break;
        case 'row': st.rows = { ...st.rows, [a.r]: 'pick' }; tr.set('x.tdim', 1, 0.5); break;
        case 'col': st.cols = { ...st.cols, [a.c]: 'pick' }; break;
        default: break;
      }
      markDirty();
      await step(a.a === 'guide' ? 1.8 : 1.2); if (!alive()) return;
    }
  } : undefined };
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{direction: positive} \\frac{50}{20} = 2.5', 'y = 2.5x - 135 \\le \\Rightarrow \\square', '{}^{\\circ}\\mathrm{F}\\ 120^{\\circ}\\mathrm{F}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
