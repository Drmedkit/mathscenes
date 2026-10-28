// normal-distribution.ts: "The normal distribution" (HS Statistics 7, S-ID.A.4, S-IC.A.2) on the shared lesson runtime.
//   1 The question   Women's heights N(64, 2.5): what share is taller than 69 in? Cards: 2.5% (right), 5% (both tails:
//                    central-benchmark-misassigned-to-tail), 47.5% (half of 95: tail-as-half-central-percent) + how sure
//   2 Worked example on the kit Plane (a normal curve is a `curve`, its areas are `shade`s): the SD-scaled axis (69 is
//                    2 SD up), 68-95-99.7 as areas, the tail (100 - 95) / 2 = 2.5%, then 67 in: z = 1.2, table 0.8849,
//                    1 - 0.8849 = 0.1151; one "why?" with 3 reasons
//   3 Your turn      Men's heights N(69, 3), faded from the end: the axis and benchmarks given; the student types the
//                    asymmetric whole-SD share 66-75 in (81.5%), z for 73.5 in (1.5), the right tail 1 - 0.9332 = 0.0668
//   4 Prove it       Riley: "the band from 1 to 2 SD above the mean holds 95 - 68 = 27%". A because-chain on the curve
//                    (95 region, 68 inside it, the two bands, one band = 13.5%); distractors = catalogue misconceptions
//   5 Practice       all 30 sub-goals in topic order, then mixed (runtime/practice.ts): curve cards, z-table excerpts and
//                    calculator screens (linear-regression DataCard), simulated samples (one-variable-data DataPlot)
// Voiced lines: src/lesson/topics/normal-distribution/script.ts -> voice/lines.json. Every answer is logged.
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { Plane, type PlaneBlock, type PFocus } from '../../src/lesson/kit/Plane';
import { DataCard, type DataCardBlock } from '../../src/lesson/topics/linear-regression/DataCard';
import type { Card } from '../../src/lesson/topics/linear-regression/kit';
import { DataPlot, type DataPlotBlock } from '../../src/lesson/topics/one-variable-data/DataPlot';
import { FAMILY_NAMES, GENERATORS, MC, type NItem, type NPic } from '../../src/lesson/topics/normal-distribution/items';
import { PLAN } from '../../src/lesson/topics/normal-distribution/plan';
import { explain } from '../../src/lesson/topics/normal-distribution/explain';
import { LINES } from '../../src/lesson/topics/normal-distribution/script';
import { planeParams } from '../../src/lesson/topics/normal-distribution/NormalView';
import { tableArea } from '../../src/lesson/topics/normal-distribution/normMaths';

const SLUG = 'normal-distribution';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = '', after = ''): HTMLElement {
  const L = LINES[id];
  if (!L) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, (L?.html ?? id) + after);
}
function voicedFb(id: string, ok: boolean): HTMLElement { const L = LINES[id]; if (!L) console.warn('no voice line', id); say(id); return feedback(ok, L?.html ?? id); }

// the lesson's facts, checked when the page builds (a wrong script can not render)
const T12 = tableArea(1.2), T15 = tableArea(1.5);
if (T12 !== 0.8849 || T15 !== 0.9332 || (67 - 64) / 2.5 !== 1.2 || (73.5 - 69) / 3 !== 1.5) throw new Error('normal-distribution: the lesson numbers do not hold');

// ===================== the stage: a wide curve card on the left, the board on the right =====================
const PF = frame(50, 70, 1140, 940);
type Painter = (c: Canvas) => void;
function centred(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint, cx = BOARD.cx, maxW = BOARD_W): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: cx - b.cx, y, size: s, tags, col };
}
const lime = { col: 'link' as Paint }, teal = { col: 'second' as Paint }, amber = { col: 'first' as Paint };
interface Rows { key: string; src: string; y: number; tags?: Record<string, { col: Paint }>; col?: Paint; size?: number }
const boardOf = (rows: Rows[]) => rows.map(r => centred(r.key, r.src, r.y, r.size ?? 66, r.tags, r.col));
function cardScene(P: PlaneBlock, pre: string, lines: Line[], focus?: () => PFocus, extra?: Painter): void {
  setScene({ table: 1080, model: c => P.draw(c, progressOf(s => tr.k(pre + s)), focus?.()), lines, leads: [], extra });
}
const plane = (card: NonNullable<NPic['card']>) => Plane(planeParams(card), PF, th);

// ===================== the lesson's models =====================
const WM = 64, WS = 2.5, MM = 69, MS = 3;
const womenCard = (o: { shades?: NonNullable<NPic['card']>['shades']; texts?: NonNullable<NPic['card']>['texts']; vlines?: NonNullable<NPic['card']>['vlines'] } = {}): NonNullable<NPic['card']> => ({
  x: { min: WM - 4 * WS, max: WM + 4 * WS, step: WS, name: 'Height of adult women (inches)' },
  curves: [{ key: 'C', kind: 'normal', m: WM, s: WS, col: 'link' }], ...o,
});

// ===================== 1. The question =====================
const CARDS = [
  { v: '2.5%', sub: 'one tail beyond 2 SD', id: '', why: 'q.cb.right', val: 2.5 },
  { v: '5%', sub: 'outside 2 SD', id: MC.centralToTail, why: 'q.cb.five', val: 5 },
  { v: '47.5%', sub: 'half of 95%', id: MC.tailHalf, why: 'q.cb.half', val: 47.5 },
];
function partQuestion(): void {
  tr.reset('q.');
  const P = plane(womenCard({ vlines: [{ key: 'v69', x: 69, col: 'pick' }] }));
  const lines = boardOf([
    { key: 'q.L1', src: 'X \\sim N(64,\\ 2.5)', y: 220, size: 72 },
    { key: 'q.L2', src: 'P(X > 69) \\approx \\,?', y: 380, size: 80, col: 'pick' },
  ]);
  cardScene(P, 'q.', lines);
  tr.set('q.axes', 1, 1.0); tr.set('q.C', 1, 1.8, 0.5); tr.set('q.L1', 1, 0.8, 1.5); tr.set('q.v69', 1, 0.8, 2.2); tr.set('q.L2', 1, 0.8, 2.6);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Women N(64, 2.5) in: what share is taller than 69 in?', response: c.val, expected: 2.5, correct: c.val === 2.5, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>${cd.sub}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Who is "tall"?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const P = plane(womenCard({
    shades: [
      { key: 's95', lo: WM - 2 * WS, hi: WM + 2 * WS, on: 'C', col: 'second' },
      { key: 's68', lo: WM - WS, hi: WM + WS, on: 'C', col: 'first' },
      { key: 'tail', lo: 69, hi: 80, on: 'C', col: 'pick' },
      { key: 'r67', lo: 67, hi: 80, on: 'C', col: 'link' },
    ],
    vlines: [{ key: 'v1', x: WM - WS, col: 'first' }, { key: 'v2', x: WM + WS, col: 'first' }, { key: 'v3', x: WM - 2 * WS, col: 'second' }, { key: 'v4', x: WM + 2 * WS, col: 'second' }, { key: 'v67', x: 67, col: 'link' }],
    texts: [
      { key: 't68', x: WM, at: 0.3, text: '68%' },
      { key: 't95', x: WM - 1.5 * WS, at: 0.09, text: '13.5%' },
      { key: 't25', x: WM + 2.75 * WS, at: 0.2, text: '2.5%', col: 'pick' },
      { key: 't67', x: WM + 2.8 * WS, at: 0.3, text: '0.1151', col: 'link' },
    ],
  }));
  const lines = boardOf([
    { key: 'e.Ln', src: 'X \\sim N(64,\\ 2.5)', y: 130, col: 'dim' },
    { key: 'e.Lax', src: '64 + 2(2.5) = \\cssId{v}{69}', y: 225, tags: { v: teal } },
    { key: 'e.L68', src: '\\text{within } 1\\sigma:\\ \\cssId{v}{68\\%}', y: 330, tags: { v: amber } },
    { key: 'e.L95', src: '\\text{within } 2\\sigma:\\ \\cssId{v}{95\\%}', y: 410, tags: { v: teal } },
    { key: 'e.Ltail', src: '(100 - 95) \\div 2 = \\cssId{v}{2.5\\%}', y: 515, tags: { v: lime } },
    { key: 'e.Lz', src: 'z = \\dfrac{67 - 64}{2.5} = 1.2', y: 640 },
    { key: 'e.Ltab', src: '\\text{table: } 0.8849', y: 760, col: 'dim' },
    { key: 'e.Lright', src: '1 - 0.8849 = \\cssId{v}{0.1151}', y: 860, tags: { v: lime } },
  ]);
  cardScene(P, 'e.', lines);
  tr.jump('e.axes', 1); tr.jump('e.C', 1);
  let step = 0;
  const STEPS = [
    { t: 'An axis in SD steps', why: 'Where is 69 in?', act: 'Mark the SDs' },
    { t: '68-95-99.7 as areas', why: 'What share lies near the mean?', act: 'Shade' },
    { t: 'The tail above 69 in', why: 'What is left outside?', act: 'Find the tail' },
    { t: 'Between the benchmarks: z and the table', why: 'Taller than 67 in?', act: 'Standardize' },
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
        tr.set('e.Ln', 1, 0.7);
        for (const k of ['v1', 'v2', 'v3', 'v4']) { tr.set('e.' + k, 1, 0.6); await wait(0.5); if (!alive()) return; }
        tr.set('e.Lax', 1, 0.8); await wait(1.0); if (!alive()) return;
      } else if (i === 1) {
        tr.set('e.s95', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('e.L95', 1, 0.8); await wait(0.6); if (!alive()) return;
        tr.set('e.s68', 1, 1.0); tr.set('e.t68', 1, 0.8, 0.6); await wait(1.0); if (!alive()) return;
        tr.set('e.L68', 1, 0.8); await wait(1.0); if (!alive()) return;
      } else if (i === 2) {
        tr.set('e.s68', 0.3, 0.6); tr.set('e.s95', 0.3, 0.6); tr.set('e.t68', 0, 0.5);
        tr.set('e.tail', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('e.t25', 1, 0.7); tr.set('e.Ltail', 1, 0.8); await wait(1.2); if (!alive()) return;
      } else {
        for (const k of ['s68', 's95', 'tail', 't25', 'v1', 'v2', 'v3', 'v4']) tr.set('e.' + k, 0, 0.6);
        for (const k of ['Ln', 'Lax', 'L68', 'L95', 'Ltail']) tr.set(`e.${k}:dim`, 1, 0.5);
        tr.set('e.v67', 1, 0.8); tr.set('e.Lz', 1, 0.8, 0.4); await wait(1.4); if (!alive()) return;
        tr.set('e.Ltab', 1, 0.8); await wait(1.0); if (!alive()) return;
        tr.set('e.r67', 1, 1.0); tr.set('e.Lright', 1, 0.8, 0.5); tr.set('e.t67', 1, 0.7, 1.0); await wait(1.6); if (!alive()) return;
      }
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The table gives the area to the LEFT of z; taller than 67 in is the right side.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'z = 1.2 means 1.2% of women are taller, so we turn it around.', ok: false, id: 'e.why.pct', mc: MC.zPct as string | undefined },
      { t: 'There are two tails, so we double and subtract.', ok: false, id: 'e.why.double', mc: MC.doubleTail as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why 1 − 0.8849 for the share taller than 67 in?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: men's heights =====================
function partTurn(): void {
  tr.reset('t.');
  const P = plane({
    x: { min: MM - 4 * MS, max: MM + 4 * MS, step: MS, name: 'Height of adult men (inches)' },
    curves: [{ key: 'C', kind: 'normal', m: MM, s: MS, col: 'link' }],
    shades: [
      { key: 's68', lo: MM - MS, hi: MM + MS, on: 'C', col: 'first' },
      { key: 'band', lo: 66, hi: 75, on: 'C', col: 'link' },
      { key: 'r73', lo: 73.5, hi: 85, on: 'C', col: 'pick' },
    ],
    vlines: [{ key: 'v73', x: 73.5, col: 'pick' }],
    texts: [{ key: 't68', x: MM, at: 0.3, text: '68%' }, { key: 'tb', x: MM + 0.6 * MS, at: 0.3, text: '81.5%', col: 'link' }, { key: 'tr', x: MM + 2.6 * MS, at: 0.26, text: '0.0668', col: 'pick' }],
  });
  const card: Card = { title: 'Area left of z', cols: [{ head: 'z', cells: ['1.49', '1.50', '1.51'] }, { head: 'area', cells: [1.49, 1.5, 1.51].map(z => tableArea(z).toFixed(4)) }] };
  const madeC = tryBlock(() => DataCard(card, frame(1250, 500, 600, 510), th));
  const TC: DataCardBlock | null = madeC.ok ? madeC.value : null;
  if (!madeC.ok) console.warn(madeC.error);
  const lines = boardOf([
    { key: 't.Ln', src: 'X \\sim N(69,\\ 3)', y: 115, col: 'dim' },
    { key: 't.Lband', src: '34\\% + 47.5\\% = \\cssId{v}{81.5\\%}', y: 210, tags: { v: lime } },
    { key: 't.Lz', src: 'z = \\dfrac{73.5 - 69}{3} = \\cssId{v}{1.5}', y: 320, tags: { v: lime } },
    { key: 't.Lr', src: '1 - 0.9332 = \\cssId{v}{0.0668}', y: 430, tags: { v: lime } },
  ]);
  cardScene(P, 't.', lines, undefined, c => TC?.draw(c, progressOf(s => tr.k('t.card.' + s)), { ring: [{ row: 1, col: 'pick', k: tr.k('t.ring') }] }));
  tr.set('t.axes', 1, 0.9); tr.set('t.C', 1, 1.6, 0.3); tr.set('t.Ln', 1, 0.8, 1.0); tr.set('t.s68', 1, 0.9, 1.6); tr.set('t.t68', 1, 0.7, 2.0);
  let step = 0;
  const STEPS = [
    { t: 'The SD axis and 68-95', why: 'Done for you.' }, { t: 'An asymmetric whole-SD share', why: 'Your step.' },
    { t: 'The z-score of 73.5 in', why: 'Your step.' }, { t: 'The right tail from the table', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: men\'s heights'), voiced('t.intro'), plan, work);
  seq(async alive => { await wait(2.6); if (!alive()) return; step = 1; drawPlan(); askBand(); });
  function numStep(promptId: string, unit: string, logItem: string, logPrompt: string, expected: number, judge: (v: number) => { ok: boolean; id: string; mc?: string }, onOk: () => void): void {
    const fbHost = h('div'), inp = numInput(unit, () => check()), ok = btn('Check', () => check(), 'go');
    let done = false;
    function check(): void {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false)); return; }
      const J = judge(r.v);
      ctx.store.log({ part: 'turn', item: logItem, prompt: logPrompt, response: r.v, expected, correct: J.ok, mc: J.mc });
      fbHost.replaceChildren(voicedFb(J.id, J.ok));
      if (!J.ok) return;
      done = true; ok.disabled = true;
      onOk();
    }
    work.replaceChildren(voiced(promptId), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  const near = (v: number, w: number, t = 1e-6) => Math.abs(v - w) <= t;
  function askBand(): void {
    tr.set('t.band', 0.25, 0.6);
    numStep('t.band', '%', 'turn.band', 'N(69, 3): percent between 66 and 75 in?', 81.5, v => near(v, 81.5) || near(v, 0.815) ? { ok: true, id: 't.band.ok' }
      : near(v, 95) ? { ok: false, id: 't.band.c95', mc: MC.centered } : near(v, 68) ? { ok: false, id: 't.band.c68', mc: MC.centered } : { ok: false, id: 't.band.no' },
    () => seq(async alive => {
      tr.set('t.s68', 0, 0.5); tr.set('t.t68', 0, 0.4); tr.set('t.band', 1, 0.9); tr.set('t.tb', 1, 0.7, 0.4); tr.set('t.Lband', 1, 0.8);
      await wait(1.6); if (!alive()) return;
      step = 2; drawPlan(); askZ();
    }));
  }
  function askZ(): void {
    tr.set('t.v73', 1, 0.8);
    numStep('t.z', '', 'turn.z', 'N(69, 3): z-score of 73.5 in?', 1.5, v => near(v, 1.5) ? { ok: true, id: 't.z.ok' }
      : near(v, 4.5) ? { ok: false, id: 't.z.noScale', mc: MC.noScale } : near(v, -1.5) ? { ok: false, id: 't.z.sign', mc: MC.dropSign } : { ok: false, id: 't.z.no' },
    () => seq(async alive => {
      tr.set('t.Lz', 1, 0.8); await wait(1.4); if (!alive()) return;
      step = 3; drawPlan(); askArea();
    }));
  }
  function askArea(): void {
    tr.set('t.card.card', 1, 0.8); tr.set('t.card.rows', 1, 1.0, 0.3); tr.set('t.ring', 1, 0.6, 1.2);
    tr.set('t.tb', 0, 0.4); tr.set('t.band', 0.2, 0.5);
    numStep('t.area', '', 'turn.area', 'N(69, 3): proportion taller than 73.5 in (table 0.9332)?', 0.0668, v => near(v, 0.0668, 1e-4) || near(v, 6.68, 1e-2) ? { ok: true, id: 't.area.ok' }
      : near(v, 0.9332, 1e-4) ? { ok: false, id: 't.area.left', mc: MC.leftDefault } : { ok: false, id: 't.area.no' },
    () => seq(async alive => {
      tr.set('t.band', 0, 0.5); tr.set('t.r73', 1, 1.0); tr.set('t.tr', 1, 0.7, 0.5); tr.set('t.Lr', 1, 0.8, 0.6); await wait(2.0); if (!alive()) return;
      step = 4; drawPlan(); work.append(callback());
    }));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, 'p', '', cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : ''), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: the band from 1 to 2 SD =====================
function partProve(): void {
  tr.reset('p.');
  const P = plane(womenCard({
    shades: [
      { key: 's95', lo: WM - 2 * WS, hi: WM + 2 * WS, on: 'C', col: 'second' },
      { key: 's68', lo: WM - WS, hi: WM + WS, on: 'C', col: 'first' },
      { key: 'bL', lo: WM - 2 * WS, hi: WM - WS, on: 'C', col: 'pick' },
      { key: 'bR', lo: WM + WS, hi: WM + 2 * WS, on: 'C', col: 'link' },
    ],
    texts: [{ key: 'tR', x: WM + 1.5 * WS, at: 0.08, text: '13.5%', col: 'link' }, { key: 'tL', x: WM - 1.5 * WS, at: 0.08, text: '13.5%', col: 'pick' }],
  }));
  const lines = boardOf([
    { key: 'p.S1', src: '\\text{Riley: } 95\\% - 68\\% = 27\\%', y: 160, col: 'dim' },
    { key: 'p.L1', src: '\\cssId{a}{95\\%} \\supset \\cssId{b}{68\\%}', y: 330, tags: { a: teal, b: amber } },
    { key: 'p.L2', src: '\\text{two bands: } 27\\%', y: 450, col: 'pick' },
    { key: 'p.L3', src: '\\text{one band: } \\cssId{v}{13.5\\%}', y: 570, tags: { v: lime } },
  ]);
  const extra = (c: Canvas) => {
    const k = tr.k('p.strike');
    if (k > 0) { const L = lines[0]!, b = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }); strike(c, b.x0 - 10, b.cy + 4, b.x1 + 10, b.cy - 4, k, { col: 'wrong' }); }
  };
  cardScene(P, 'p.', lines, undefined, extra);
  tr.set('p.axes', 1, 0.9); tr.set('p.C', 1, 1.6, 0.3); tr.set('p.S1', 1, 0.8, 1.4);
  const CHIPS = [
    { t: 'The 68-95-99.7 rule holds for every normal curve.', fits: 0 },
    { t: 'The 1-SD region lies inside the 2-SD region, so their areas subtract.', fits: 1 },
    { t: 'The curve is symmetric about the mean, so the two bands are equal.', fits: 2 },
    { t: 'Every region of a normal curve is centered at the mean.', fits: -1, mc: MC.centered, id: 'p.no.centered' },
    { t: 'A band on one side gets the whole difference of the central percents.', fits: -1, mc: MC.oneSided, id: 'p.no.onesided' },
    { t: 'Halving a central percent gives the tail.', fits: -1, mc: MC.tailHalf, id: 'p.no.half' },
  ];
  const CLAIMS = [
    'About 95% lies within 2 SD of the mean, and 68% within 1 SD,',
    'The two bands from 1 to 2 SD (one on each side) hold 95 − 68 = 27% together,',
    'So the band above the mean holds 27 ÷ 2 = <b class="s">13.5%</b>, and Riley is wrong,',
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
      if (n === 1) { tr.set('p.s95', 1, 1.0); await wait(1.0); if (!alive()) return; tr.set('p.s68', 1, 1.0); await wait(1.0); if (!alive()) return; tr.set('p.L1', 1, 0.8); }
      if (n === 2) { tr.set('p.s68', 0, 0.8); tr.set('p.s95', 0, 0.8); tr.set('p.bL', 1, 0.9, 0.4); tr.set('p.bR', 1, 0.9, 0.4); await wait(1.6); if (!alive()) return; tr.set('p.L2', 1, 0.8); }
      if (n === 3) {
        tr.set('p.bL', 0.3, 0.6); tr.set('p.tR', 1, 0.7, 0.3); tr.set('p.tL', 1, 0.7, 0.6); await wait(1.2); if (!alive()) return;
        tr.set('p.L3', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(0.9); if (!alive()) return;
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
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: the band from 1 to 2 SD above the mean holds 95 − 68 = 27%. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.oneSided : undefined });
    proofHost.replaceChildren(voiced(right ? 'p.test' : 'p.build'), chain, chipBox, fbHost);
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
    show: it => showItem(it as NItem),
  });
}
/** the item's board TeX as lines (split at \qquad), centred in `area` */
function boardLines(src: string, area: Box, size: number): Line[] {
  const parts = src.split(/\\qquad\s*/).map(p0 => p0.trim()).filter(Boolean);
  if (!parts.length) return [];
  let sz = size;
  while (sz > 60 && parts.some(p0 => texWidth(tex(p0) as Formula, sz) > area.w - 90)) sz -= 2;
  const hs = parts.map(p0 => { const F = tex(p0) as Formula; return Math.max(1, (F.bottom - F.top) / 1000) * sz; });
  const gap = Math.min(sz * 1.6, (area.h - 40) / parts.length);
  const total = hs.reduce((s, x) => s + Math.max(x * 1.3, gap), 0);
  let y = area.cy - total / 2;
  return parts.map((p0, i) => { const hh = Math.max(hs[i]! * 1.3, gap); const L = centred(`x.B${i}`, p0, y + hh / 2, sz, undefined, undefined, area.cx, area.w - 90); y += hh; return L; });
}
function tableCard(pic: NPic): Card | null {
  if (pic.table) return { title: 'Area left of z', cols: [{ head: 'z', cells: pic.table.rows.map(r => r[0].toFixed(2).replace('-', '−')) }, { head: 'area', cells: pic.table.rows.map(r => r[1].toFixed(4)) }] };
  if (pic.calc) return { title: pic.calc.title, lines: pic.calc.lines };
  return null;
}
function showItem(item: NItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture ?? {};
  const card = tableCard(pic);
  let P: PlaneBlock | null = null, D: DataPlotBlock | null = null, C: DataCardBlock | null = null;
  if (pic.card) { const m = tryBlock(() => Plane(planeParams(pic.card!), PF, th)); if (m.ok) P = m.value; else console.warn('picture did not fit', item.id, m.error); }
  if (pic.samples) {
    const S0 = pic.samples;
    const m = tryBlock(() => DataPlot({ axis: S0.axis, panels: S0.panels.map(p => ({ key: p.key, kind: 'dot' as const, data: p.data, label: p.label })), marks: S0.mark === undefined ? [] : [{ kind: 'vline' as const, key: 'mk', x: S0.mark, col: 'link' as Paint, label: 'model', panels: S0.panels.map(p => p.key) }] }, PF, th));
    if (m.ok) D = m.value; else console.warn('samples did not fit', item.id, m.error);
  }
  const leftFree = !P && !D;
  if (card) {
    const m = tryBlock(() => DataCard(card, leftFree ? frame(160, 120, 900, 860) : frame(1250, 330, 600, 680), th));
    if (m.ok) C = m.value; else console.warn('card did not fit', item.id, m.error);
  }
  if (!P && !D && !C) {
    const big = box(200, 160, 1720, 920);
    const lines = boardLines(item.board || '\\text{?}', big, 96);
    setScene({ lines, leads: [], boardBox: big, table: 1080 });
    lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.1 + i * 0.2));
    return {};
  }
  const area = C && !leftFree ? box(BOARD.x0, BOARD.y0, BOARD.x1, BOARD.y0 + 250) : box(BOARD.x0, BOARD.y0, BOARD.x1, BOARD.y0 + 620);
  const lines = boardLines(item.board, area, C && !leftFree ? 64 : 72);
  const ex = (item as unknown as { ex?: { z?: number | number[] } }).ex;
  const zs = ex?.z === undefined ? [] : Array.isArray(ex.z) ? ex.z : [ex.z];
  const ringRows = pic.table ? pic.table.rows.map((r, i) => (zs.some(z => Math.abs(z - r[0]) < 1e-9) ? i : -1)).filter(i => i >= 0) : [];
  const cardDraw: Painter = c => C?.draw(c, progressOf(s => tr.k('x.card.' + s)), { ring: ringRows.map(row => ({ row, col: 'pick' as Paint, k: tr.k('x.ring') })) });
  if (P) {
    cardScene(P, 'x.', lines, undefined, cardDraw);
    tr.set('x.axes', 1, 0.7);
    const keys = planeParams(pic.card!).items!.map(i => i.key);
    keys.forEach((k, i) => tr.set('x.' + k, 1, 0.9, 0.3 + Math.min(i, 8) * 0.08));
  } else if (D) {
    setScene({ table: 1080, model: c => D!.draw(c, progressOf(s => tr.k('x.' + s))), lines, leads: [], extra: cardDraw });
    tr.set('x.axis', 1, 0.7);
    pic.samples!.panels.forEach((p, i) => tr.set('x.' + p.key, 1, 1.0, 0.2 + i * 0.3));
    tr.set('x.mk', 1, 0.8, 0.8);
  } else setScene({ table: 1080, model: cardDraw, lines, leads: [] });
  tr.set('x.card.card', 1, 0.7, 0.2); tr.set('x.card.rows', 1, 0.9, 0.4);
  lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.3 + i * 0.2));
  return { solve: ringRows.length ? async alive => { tr.set('x.ring', 1, 0.6); await wait(1.2); if (!alive()) return; } : undefined };
}

void runLesson({
  slug: SLUG,
  warm: ['X \\sim N(64,\\ 2.5) \\quad P(X > 69) \\approx \\,? \\quad z = \\dfrac{67 - 64}{2.5} \\quad 1\\sigma \\quad 13.5\\% \\supset \\le \\ge', 'P\\left(Z < \\dfrac{1}{2}\\right) \\tfrac{1}{2} \\bar{x} \\sigma^2 \\mu'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
