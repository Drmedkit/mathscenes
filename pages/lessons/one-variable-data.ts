// one-variable-data.ts: "Summarizing and comparing data" (HS Statistics 1, HSS-ID.A.1-3) on the shared lesson runtime.
//   1 The question   11 commute times with one long one (59 min): which number is the typical commute? Cards: 22 (the
//                    mean: mean-always-best-summary), 19 (the median), 33.5 (halfway between shortest and longest:
//                    midrange-as-median) + how sure
//   2 Worked example on the DataPlot (dot plot over a box plot on one axis): order and find the middle (median 19), the
//                    quartiles as medians of the halves (Q1 13, Q3 26, IQR 13), the 1.5 × IQR fence (45.5: 59 is an
//                    outlier, the modified box plot), then center and spread (mean 22 pulled up, median 19 stays: report
//                    median and IQR); one "why?" with 3 reasons
//   3 Your turn      11 phone battery lives with a LOW outlier (4 h), faded from the end: median and quartiles given,
//                    the student types the IQR, the two fences and picks where the lower whisker ends
//   4 Prove it       Sam: "every reading went up 5°F, so the SD went up 5°F too". Before/after dot plots slide; a
//                    because-chain from reason chips (distractors = catalogue misconceptions)
//   5 Practice       all 28 sub-goals in topic order, then mixed (runtime/practice.ts); DataPlot pictures, replays on a miss
// Voiced lines: pages/lessons/one-variable-data/voice/lines.json. Every answer is logged (runtime/store.ts).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, pairInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { DataPlot, type DataPlotBlock, type DFocus, type DParams } from '../../src/lesson/topics/one-variable-data/DataPlot';
import { FAMILY_NAMES, GENERATORS, MC, type DItem } from '../../src/lesson/topics/one-variable-data/items';
import { PLAN } from '../../src/lesson/topics/one-variable-data/plan';
import { explain } from '../../src/lesson/topics/one-variable-data/explain';
import LINES from './one-variable-data/voice/lines.json';

const SLUG = 'one-variable-data';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
function voiced(id: string, htmlText: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, htmlText);
}
function voicedFb(id: string, ok: boolean, htmlText: string): HTMLElement { if (!(id in LINES)) console.warn('no voice line', id); say(id); return feedback(ok, htmlText); }

// ===================== the stage: a wide plot card on the left, the board on the right =====================
/** the plot's frame: wider than the default model frame, so 1-unit steps on a 50-unit axis stay readable */
const PF = frame(50, 70, 1140, 940);
type Painter = (c: Canvas) => void;
function centred(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint, cx = BOARD.cx, maxW = BOARD_W): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: cx - b.cx, y, size: s, tags, col };
}
const lime = { col: 'link' as Paint }, amber = { col: 'first' as Paint }, teal = { col: 'second' as Paint }, lav = { col: 'pick' as Paint };
function plotScene(B: DataPlotBlock, pre: string, lines: Line[], focus?: () => DFocus, extra?: Painter): void {
  setScene({ table: 1080, model: c => B.draw(c, progressOf(s => tr.k(pre + s)), focus?.()), lines, leads: [], extra });
}
const idx = (n: number) => Array.from({ length: n }, (_, i) => i);

// ===================== the lesson's data =====================
/** 11 commute times (minutes): median 19, Q1 13, Q3 26, IQR 13, fences −6.5 and 45.5, 59 an outlier, mean 22 */
const COMMUTE = [8, 11, 13, 15, 17, 19, 21, 24, 26, 29, 59];
/** 11 battery lives (hours): median 21, Q1 18, Q3 24, IQR 6, fences 9 and 33, 4 a low outlier, whisker to 17 */
const BATTERY = [4, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27];
/** 8 daily highs (°F): mean 65, SD 2; + 5°F gives mean 70, SD 2 */
const TEMPS = [62, 64, 64, 64, 65, 65, 67, 69];

function commutePlot(withBox: boolean): DParams {
  return {
    axis: { min: 5, max: 60, step: 5, name: 'Commute (minutes)' },
    panels: [{ key: 'D', kind: 'dot', data: COMMUTE, label: withBox ? 'Dot plot' : undefined, weight: 1.2 }, ...(withBox ? [{ key: 'B', kind: 'box' as const, data: COMMUTE, modified: true, label: 'Box plot' }] : [])],
    marks: withBox ? [
      { kind: 'vline', key: 'med', x: 19, label: 'median', col: 'link', panels: ['D', 'B'] },
      { kind: 'vline', key: 'q1', x: 13, label: 'Q1', col: 'second', panels: ['B'] },
      { kind: 'vline', key: 'q3', x: 26, label: 'Q3', col: 'second', panels: ['B'] },
      { kind: 'band', key: 'fz', a: 45.5, b: 60, col: 'wrong', panels: ['D', 'B'] },
      { kind: 'vline', key: 'fhi', x: 45.5, label: 'fence', col: 'pick', panels: ['D', 'B'] },
      { kind: 'fulcrum', key: 'mean', panel: 'D', x: 22, col: 'first' },
    ] : [],
  };
}

// ===================== 1. The question =====================
const CARDS = [
  { v: '22', sub: 'the mean', id: MC.meanBest, why: 'q.cb.mean', val: 22 },
  { v: '19', sub: 'the median', id: '', why: 'q.cb.right', val: 19 },
  { v: '33.5', sub: 'halfway between shortest and longest', id: MC.midrange, why: 'q.cb.mid', val: 33.5 },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = DataPlot(commutePlot(false), PF, th);
  const lines = [
    centred('q.L1', '\\text{commute times}', 200, 70),
    centred('q.L2', 'n = 11', 320, 80),
    centred('q.L3', '\\text{typical} = \\,?', 460, 84, undefined, 'pick'),
  ];
  plotScene(B, 'q.', lines, () => ({ dots: [{ panel: 'D', idx: [10], col: 'pick', k: tr.k('q.hot') }] }));
  tr.set('q.axis', 1, 1.0); tr.set('q.D', 1, 2.2, 0.6); tr.set('q.L1', 1, 0.8, 1.6); tr.set('q.L2', 1, 0.8, 2.0); tr.set('q.L3', 1, 0.8, 2.4); tr.set('q.hot', 1, 0.6, 3.0);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Eleven commute times, one of 59 minutes: which number best describes a typical commute?', response: c.val, expected: 19, correct: c.val === 19, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v} min<small>${cd.sub}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'A typical commute'),
    voiced('q.intro', `Eleven students timed their trip to school. Most take 8 to 29 minutes; one lives far out of town and takes <b class="a">59 minutes</b>. Which number best describes a <b>typical</b> commute? Pick one, and say how sure you are.`),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn),
  );
}

// ===================== 2. Worked example =====================
interface Rows { key: string; src: string; y: number; tags?: Record<string, { col: Paint }>; col?: Paint; size?: number }
const boardOf = (rows: Rows[]) => rows.map(r => centred(r.key, r.src, r.y, r.size ?? 66, r.tags, r.col));
function partExample(): void {
  tr.reset('e.');
  const B = DataPlot(commutePlot(true), PF, th);
  const lines = boardOf([
    { key: 'e.n', src: '\\text{6th of } 11', y: 140, col: 'dim' },
    { key: 'e.med', src: '\\text{median} = \\cssId{v}{19}', y: 225, tags: { v: lime } },
    { key: 'e.q', src: 'Q_1 = \\cssId{a}{13} \\quad Q_3 = \\cssId{b}{26}', y: 330, tags: { a: teal, b: teal } },
    { key: 'e.iqr', src: '\\text{IQR} = 26 - 13 = \\cssId{v}{13}', y: 415, tags: { v: teal } },
    { key: 'e.st', src: '1.5 \\times 13 = 19.5', y: 520, col: 'pick' },
    { key: 'e.fh', src: '26 + 19.5 = \\cssId{v}{45.5}', y: 600, tags: { v: lav } },
    { key: 'e.out', src: '59 > 45.5', y: 680 },
    { key: 'e.mean', src: '\\bar{x} = \\cssId{a}{22}', y: 790, tags: { a: amber } },
    { key: 'e.rep', src: '\\text{median } 19,\\ \\text{IQR } 13', y: 885, col: 'link' },
  ]);
  const halfK = () => tr.k('e.halves');
  plotScene(B, 'e.', lines, () => ({
    dots: [
      { panel: 'D', idx: [0, 10], col: 'pick', k: tr.k('e.c1') * (1 - tr.k('e.halves')) }, { panel: 'D', idx: [1, 9], col: 'pick', k: tr.k('e.c2') * (1 - tr.k('e.halves')) },
      { panel: 'D', idx: [2, 8], col: 'pick', k: tr.k('e.c3') * (1 - tr.k('e.halves')) }, { panel: 'D', idx: [3, 7], col: 'pick', k: tr.k('e.c4') * (1 - tr.k('e.halves')) },
      { panel: 'D', idx: [4, 6], col: 'pick', k: tr.k('e.c5') * (1 - tr.k('e.halves')) }, { panel: 'D', idx: [5], col: 'link', k: tr.k('e.c6') },
      { panel: 'D', idx: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10], col: 'second', k: halfK() * (1 - tr.k('e.out')) },
      { panel: 'D', idx: [2, 8], col: 'ink', k: tr.k('e.qdots') },
      { panel: 'D', idx: [10], col: 'wrong', k: tr.k('e.out') },
    ],
  }));
  tr.jump('e.axis', 1); tr.jump('e.D', 1);
  let step = 0;
  const STEPS = [
    { t: 'Order it, find the middle', why: 'Count in from both ends.', act: 'Count in' },
    { t: 'Quartiles: the middle of each half', why: 'Q1 and Q3 build the box.', act: 'Split' },
    { t: 'The 1.5 × IQR fence', why: 'Is 59 an outlier?', act: 'Fence' },
    { t: 'Choose center and spread', why: 'Mean or median?', act: 'Compare' },
  ];
  const SAY = [
    `Eleven values, already in order on the axis. Count in from both ends: the 6th dot is the middle. <b class="s">Median = 19</b> minutes: 5 commutes below it, 5 above.`,
    `Leave the median out and take the middle of each half. The lower five give <b class="b">Q1 = 13</b>, the upper five <b class="b">Q3 = 26</b>. The box runs from Q1 to Q3: <b class="b">IQR = 13</b> minutes, the spread of the middle half.`,
    `The fence sits 1.5 IQR beyond the box: 26 + 19.5 = <b>45.5</b>. 59 lies beyond it, so it is an outlier: the whisker stops at 29, and 59 gets its own point. (The low fence, 13 − 19.5 = −6.5, is below every commute.)`,
    `The mean, 22, sits right of the median: the 59 drags it up. The median and IQR come from the middle of the ordered list and barely notice it. Report: <b class="s">median 19 min, IQR 13 min (n = 11)</b>.`,
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
        tr.set('e.n', 1, 0.8);
        for (let k = 1; k <= 6; k++) { tr.set('e.c' + k, 1, 0.45); await wait(0.6); if (!alive()) return; }
        tr.set('e.med', 1, 0.6); await wait(1.0); if (!alive()) return;
      } else if (i === 1) {
        tr.set('e.n:dim', 1, 0.5); tr.set('e.halves', 1, 0.8); await wait(1.2); if (!alive()) return;
        tr.set('e.qdots', 1, 0.6); tr.set('e.B.med', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('e.B.q', 1, 0.9); tr.set('e.q1', 1, 0.8); tr.set('e.q3', 1, 0.8); tr.set('e.q', 1, 0.9, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('e.B.box', 1, 1.0); tr.set('e.iqr', 1, 0.9, 0.5); await wait(1.6); if (!alive()) return;
      } else if (i === 2) {
        tr.set('e.st', 1, 0.8); await wait(1.0); if (!alive()) return;
        tr.set('e.fh', 1, 0.8); tr.set('e.fhi', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('e.fz', 1, 0.8); tr.set('e.out', 1, 0.6); await wait(0.9); if (!alive()) return;
        tr.set('e.B.whisk', 1, 1.0); tr.set('e.B.out', 1, 0.8, 0.8); await wait(1.9); if (!alive()) return;
      } else {
        tr.set('e.st:dim', 1, 0.5); tr.set('e.fh:dim', 1, 0.5); tr.set('e.out:dim', 1, 0.5);
        tr.set('e.mean', 1, 0.9); await wait(1.6); if (!alive()) return;
        tr.set('e.rep', 1, 0.9); await wait(1.2); if (!alive()) return;
      }
      sayBox.replaceChildren(voiced(`e.step${i}`, SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The 59 pulls the mean (and the SD); the median and IQR come from the middle of the ordered list.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined, say: 'Yes. With a long tail or an outlier, the median and IQR describe the typical student better.' },
      { t: 'The median is always the better center.', ok: false, id: 'e.why.always', mc: MC.purpose, say: 'Not always. For a symmetric shape the mean works well, and when the total matters you need the mean.' },
      { t: 'The 59 must be a mistake, so it should not count.', ok: false, id: 'e.why.error', mc: MC.mustBeError, say: 'It is a real commute: one student lives far away. We keep it; we just choose summaries it cannot drag around.' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why report the median and IQR for these commutes?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'Quick check: why report the median and IQR here?', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'Four steps on the same eleven commutes. Press each one: the plot moves first, then the notation.', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: battery lives with a low outlier =====================
function partTurn(): void {
  tr.reset('t.');
  const P: DParams = {
    axis: { min: 0, max: 30, step: 2, name: 'Battery life (hours)' },
    panels: [{ key: 'D', kind: 'dot', data: BATTERY, label: 'Dot plot', weight: 1.1 }, { key: 'B', kind: 'box', data: BATTERY, modified: true, label: 'Modified box plot' }],
    marks: [
      { kind: 'vline', key: 'med', x: 21, label: 'median', col: 'link', panels: ['D', 'B'] },
      { kind: 'vline', key: 'q1', x: 18, label: 'Q1', col: 'second', panels: ['B'] },
      { kind: 'vline', key: 'q3', x: 24, label: 'Q3', col: 'second', panels: ['B'] },
      { kind: 'band', key: 'fz', a: 0, b: 9, col: 'wrong', panels: ['D', 'B'] },
      { kind: 'vline', key: 'flo', x: 9, label: 'fence', col: 'pick', panels: ['D', 'B'] },
    ],
  };
  const B = DataPlot(P, PF, th);
  const lines = boardOf([
    { key: 't.med', src: '\\text{median} = \\cssId{v}{21}', y: 150, tags: { v: lime } },
    { key: 't.q', src: 'Q_1 = \\cssId{a}{18} \\qquad Q_3 = \\cssId{b}{24}', y: 250, tags: { a: teal, b: teal } },
    { key: 't.iqr', src: '\\text{IQR} = 24 - 18 = \\cssId{v}{6}', y: 360, tags: { v: teal } },
    { key: 't.st', src: '1.5 \\times 6 = 9', y: 470, col: 'pick' },
    { key: 't.fl', src: '18 - 9 = \\cssId{v}{9}', y: 555, tags: { v: lav } },
    { key: 't.fl', src: '24 + 9 = \\cssId{v}{33}', y: 635, tags: { v: lav } },
    { key: 't.out', src: '4 < 9', y: 735 },
    { key: 't.wh', src: '\\text{whisker to } \\cssId{v}{17}', y: 840, tags: { v: lime } },
  ]);
  plotScene(B, 't.', lines, () => ({ dots: [{ panel: 'D', idx: [0], col: 'wrong', k: tr.k('t.out') }, { panel: 'D', idx: [1], col: 'link', k: tr.k('t.wh') }] }));
  tr.set('t.axis', 1, 0.9); tr.set('t.D', 1, 2.0, 0.4);
  let step = 0;
  const STEPS = [
    { t: 'Median', why: 'Done for you.' }, { t: 'Quartiles and the box', why: 'Done for you.' },
    { t: 'IQR and the fences', why: 'Your step.' }, { t: 'Where the whisker ends', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: battery life'), voiced('t.intro', `Eleven phones ran until their batteries died. One phone, with a worn-out battery, lasted only <b class="a">4 hours</b>. The first two steps are done for you.`), plan, work);
  seq(async alive => {
    await wait(2.6); if (!alive()) return;
    tr.set('t.med', 1, 0.8); tr.set('t.B.med', 1, 0.8); await wait(1.4); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.B.q', 1, 0.8); tr.set('t.q1', 1, 0.7); tr.set('t.q3', 1, 0.7); tr.set('t.q', 1, 0.8); await wait(1.0); if (!alive()) return;
    tr.set('t.B.box', 1, 0.9); await wait(1.2); if (!alive()) return;
    step = 2; drawPlan(); askIqr();
  });
  function askIqr(): void {
    const fbHost = h('div'), inp = numInput('hours', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false, 'Type a number first.')); return; }
      const v = r.v, right = v === 6, mc = v === 23 ? MC.rangeSpread : v === 7 ? MC.iqrCount : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.iqr', prompt: 'Q1 = 18, Q3 = 24: what is the IQR?', response: v, expected: 6, correct: right, mc });
      if (!right) {
        fbHost.replaceChildren(v === 23 ? voicedFb('t.iqr.range', false, '23 is the range, 27 − 4. The IQR is the width of the box: Q3 − Q1.')
          : v === 7 ? voicedFb('t.iqr.count', false, '7 counts the phones from 18 to 24. The IQR is a distance on the axis: Q3 − Q1.')
            : voicedFb('t.iqr.no', false, 'The IQR is the width of the box: Q3 minus Q1.'));
        return;
      }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.iqr.ok', true, 'Yes: 24 − 18 = <b class="b">6</b> hours, the spread of the middle half.'));
      tr.set('t.iqr', 1, 0.8);
      seq(async alive => { await wait(1.0); if (!alive()) return; askFences(); });
    }
    work.replaceChildren(voiced('t.iqr', 'What is the IQR?'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askFences(): void {
    const fbHost = h('div'), inp = pairInput('Lower fence', ', upper fence', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(voicedFb('t.empty2', false, 'Fill in both boxes.')); return; }
      const right = r.x === 9 && r.y === 33;
      ctx.store.log({ part: 'turn', item: 'turn.fences', prompt: 'Q1 = 18, Q3 = 24, IQR = 6: the fences?', response: `${r.x}, ${r.y}`, expected: '9, 33', correct: right });
      if (!right) {
        fbHost.replaceChildren(r.x === 12 && r.y === 30 ? voicedFb('t.f.noOne', false, 'That steps one IQR away. The rule steps 1.5 × IQR = 9 below Q1 and above Q3.')
          : r.x === -5 && r.y === 36 ? voicedFb('t.f.ends', false, 'The fences start from the quartiles, not from the smallest and largest values.')
            : voicedFb('t.f.no', false, '1.5 × 6 = 9. Go 9 below Q1 and 9 above Q3.'));
        return;
      }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.f.ok', true, 'Yes: 18 − 9 = <b>9</b> and 24 + 9 = <b>33</b>. And 4 is below 9: an outlier.'));
      seq(async alive => {
        tr.set('t.st', 1, 0.7); tr.set('t.fl', 1, 0.8, 0.3); tr.set('t.flo', 1, 0.9, 0.5); await wait(1.4); if (!alive()) return;
        tr.set('t.fz', 1, 0.7); tr.set('t.out', 1, 0.7); await wait(1.2); if (!alive()) return;
        step = 3; drawPlan(); askWhisker();
      });
    }
    work.replaceChildren(voiced('t.fences', 'Now the fences: 1.5 IQR below Q1 and above Q3.'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askWhisker(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'At 17, the smallest value inside the fence', ok: true, id: 't.w.ok', mc: undefined as string | undefined, say: 'Yes: the whisker stops at the last real value inside the fence, and 4 is drawn as its own point.' },
      { t: 'At 9, the fence', ok: false, id: 't.w.fence', mc: MC.atFences as string | undefined, say: 'The fence is a cutoff, not a data value: no phone lasted 9 hours. The whisker ends at a real value.' },
      { t: 'At 4, the smallest value', ok: false, id: 't.w.min', mc: undefined as string | undefined, say: '4 is an outlier: it gets its own point, and the whisker stops before it.' },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.whisker', prompt: 'Modified box plot: where does the lower whisker end?', response: o.t, expected: '17', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.wh', 1, 0.8); tr.set('t.B.whisk', 1, 1.0, 0.3); tr.set('t.B.out', 1, 0.8, 1.0); await wait(2.2); if (!alive()) return;
        step = 4; drawPlan(); fbHost.append(callback());
      });
    })));
    work.replaceChildren(voiced('t.whisker', 'In the modified box plot, where does the lower whisker end?'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const text: Record<string, string> = {
      'q.cb.right': 'At the start you picked 19, the median, and you were right: the long commute could not drag it.',
      'q.cb.mean': 'At the start you picked 22, the mean. One long commute dragged it up; the median, 19, was the typical one.',
      'q.cb.mid': 'At the start you picked 33.5, halfway between the shortest and longest. That uses only the two extremes, and no student was near it.',
      'q.cb.none': 'With an outlier or a long tail, report the median and IQR; they come from the middle of the ordered data.',
    };
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, text[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: shifting every value does not change the SD =====================
function partProve(): void {
  tr.reset('p.');
  const after = TEMPS.map(v => v + 5);
  const P: DParams = {
    axis: { min: 60, max: 76, step: 1, name: 'Daily high (°F)' },
    panels: [{ key: 'A', kind: 'dot', data: TEMPS, label: 'Before' }, { key: 'C', kind: 'dot', data: after, label: 'After + 5°F' }],
    marks: [
      { kind: 'fulcrum', key: 'mA', panel: 'A', x: 65, col: 'first' }, { kind: 'fulcrum', key: 'mC', panel: 'C', x: 70, col: 'first' },
      { kind: 'devs', key: 'dA', panel: 'A', about: 65, col: 'pick' }, { kind: 'devs', key: 'dC', panel: 'C', about: 70, col: 'pick' },
    ],
  };
  const B = DataPlot(P, PF, th);
  const lines = boardOf([
    { key: 'p.S1', src: '\\sigma = 2\\ ^{\\circ}\\text{F}', y: 150, col: 'dim' },
    { key: 'p.S2', src: '\\text{Sam: } \\sigma_{\\text{new}} = 2 + 5 = 7', y: 240, col: 'dim' },
    { key: 'p.L1', src: '\\bar{x}:\\ 65 \\to \\cssId{v}{70}', y: 420, tags: { v: amber } },
    { key: 'p.L2', src: '|x - \\bar{x}|\\ \\text{unchanged}', y: 540, col: 'pick' },
    { key: 'p.L3', src: '\\sigma_{\\text{new}} = \\cssId{v}{2}\\ ^{\\circ}\\text{F}', y: 660, tags: { v: lime } },
  ]);
  const extra = (c: Canvas) => {
    const k = tr.k('p.strike');
    if (k > 0) { const L = lines[1]!, b = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }); strike(c, b.x0 - 10, b.cy + 4, b.x1 + 10, b.cy - 4, k, { col: 'wrong' }); }
  };
  plotScene(B, 'p.', lines, () => ({ shift: { panel: 'C', dx: -5, k: 1 - tr.k('p.slide') } }), extra);
  tr.set('p.axis', 1, 0.9); tr.set('p.A', 1, 1.6, 0.4); tr.set('p.S1', 1, 0.8, 1.2); tr.set('p.S2', 1, 0.8, 1.8);
  const CHIPS = [
    { t: 'Every value moved up 5, so their balance point moved up 5.', fits: 0 },
    { t: 'A value and the mean both moved 5, so the gap between them did not change.', fits: 1 },
    { t: 'The SD is built only from the distances to the mean.', fits: 2 },
    { t: 'Larger values always have a larger spread.', fits: -1, mc: MC.shiftSpread, id: 'p.no.larger', say: 'Spread is how far the values sit from each other, not how big they are. Sliding the plot keeps every gap.' },
    { t: 'The SD must be one of the data values, so it moves with them.', fits: -1, mc: MC.sdObserved, id: 'p.no.observed', say: 'The SD is a typical distance, not a data value. Distances do not move when the plot slides.' },
  ];
  const CLAIMS = [
    'The mean moves from 65°F to <b>70°F</b>,',
    'Each reading’s distance from the mean stays the same,',
    'So the SD stays <b class="s">2°F</b>, and Sam is wrong,',
  ];
  const SAYC = [
    'Right. Watch the After plot slide 5 degrees: its balance point slides with it.',
    'Right. The distance segments in both plots match, one for one.',
    'Right. Same distances, same SD: still 2 degrees.',
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
    if (ch.fits !== filled) { fbHost.replaceChildren(ch.id ? voicedFb(ch.id, false, ch.say!) : voicedFb('p.no.other', false, 'True, but it is the reason for a different line. Which reason makes this line true?')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true, SAYC[n - 1]!));
    seq(async alive => {
      if (n === 1) {
        tr.set('p.mA', 1, 0.7); tr.set('p.C', 1, 1.0); tr.set('p.mC', 1, 0.7, 0.2); await wait(1.2); if (!alive()) return;
        tr.set('p.slide', 1, 1.6); await wait(1.8); if (!alive()) return;
        tr.set('p.L1', 1, 0.8);
      }
      if (n === 2) { tr.set('p.dA', 1, 1.2); tr.set('p.dC', 1, 1.2, 0.6); await wait(2.0); if (!alive()) return; tr.set('p.L2', 1, 0.8); }
      if (n === 3) {
        tr.set('p.L3', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(0.9); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true, 'That’s a proof: three claims, each with its reason. Adding the same amount to every value moves the center and keeps the spread.'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: every reading went up 5°F, so the SD went up 5°F too (2 to 7). Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.shiftSpread : undefined });
    proofHost.replaceChildren(
      right ? voiced('p.test', 'Let’s test it. Build the argument, and see where it leads.') : voiced('p.build', 'Now prove it. Fill each “because” with the reason that makes the line true.'),
      chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'),
    voiced('p.intro', `A thermometer read 5°F too low all week. The eight daily highs had mean 65°F and SD 2°F. Sam says: “Every reading goes up 5°F, so the SD goes up 5°F too: from 2°F to 7°F.” Is Sam right?`),
    h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as DItem),
  });
}
/** the item's board TeX as lines (split at \qquad), centred in `area` */
function boardLines(src: string, area: Box, size: number): Line[] {
  const parts = src.split(/\\qquad\s*/).map(p0 => p0.trim()).filter(Boolean);
  if (!parts.length) return [];
  let sz = size;
  while (sz > 60 && parts.some(p0 => texWidth(tex(p0) as Formula, sz) > area.w - 90)) sz -= 2;
  const hs = parts.map(p0 => { const F = tex(p0) as Formula; return Math.max(1, (F.bottom - F.top) / 1000) * sz; });
  const gap = Math.min(sz * 1.5, (area.h - 60) / parts.length);
  const total = hs.reduce((s, x) => s + Math.max(x, gap), 0);
  let y = area.cy - total / 2;
  return parts.map((p0, i) => { const hh = Math.max(hs[i]!, gap); const L = centred(`x.B${i}`, p0, y + hh / 2, sz, undefined, undefined, area.cx, area.w - 90); y += hh; return L; });
}
function showItem(item: DItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture ?? {}, pp = pic.plot;
  let B: DataPlotBlock | null = null;
  if (pp) {
    const m = tryBlock(() => DataPlot({ axis: pp.axis, panels: pp.panels, marks: [...(pp.marks ?? []), ...(pp.solveMarks ?? [])] }, PF, th));
    if (m.ok) B = m.value; else console.warn(m.error);
  }
  if (!B) {
    const big = box(200, 160, 1720, 920);
    const lines = boardLines(item.board || '\\text{?}', big, 96);
    setScene({ lines, leads: [], boardBox: big, table: 1080 });
    lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.1 + i * 0.2));
    return {};
  }
  const lines = boardLines(item.board, box(BOARD.x0, BOARD.y0, BOARD.x1, BOARD.y0 + 620), 72);
  const empty = new Set(pp!.empty ?? []);
  const hot = pp!.hot;
  plotScene(B, 'x.', lines, () => ({ dots: hot ? [{ panel: hot.panel, idx: hot.idx, col: 'pick', k: tr.k('x.hot') }] : [] }));
  tr.set('x.axis', 1, 0.7);
  pp!.panels.forEach((p0, i) => { if (!empty.has(p0.key)) tr.set('x.' + p0.key, 1, 1.0, 0.2 + i * 0.25); });
  for (const mk of pp!.marks ?? []) tr.set('x.' + mk.key, 1, 0.8, 0.6);
  tr.set('x.hot', 1, 0.5, 1.0);
  lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.3 + i * 0.2));
  const solveKeys = [...[...empty].map(k => 'x.' + k), ...(pp!.solveMarks ?? []).map(m => 'x.' + m.key)];
  return {
    solve: solveKeys.length ? async alive => {
      for (const k of solveKeys) { tr.set(k, 1, 1.0); await wait(0.5); if (!alive()) return; }
      await wait(1.0);
    } : undefined,
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\bar{x} = 22 \\qquad Q_1 \\quad \\sigma_{\\text{new}} \\quad |x - \\bar{x}| \\quad 1.5 \\times 13 \\quad ^{\\circ}\\text{F}', '\\begin{array}{r|l} 1 & 2 \\end{array}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
