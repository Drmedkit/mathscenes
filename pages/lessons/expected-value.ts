// expected-value.ts: "Probability distributions and expected value" (HS Statistics 8, HSS-MD.A.1-4, B.5) on the
// shared lesson runtime.
//   1 The question   a booth spinner, 8 equal sectors: 4 x $0, 3 x $2, 1 x $10. Average payout per spin? Cards $0
//                    (the most likely prize), $2 (right), $4 (the plain average of the prizes) + how sure
//   2 Worked example X = prize: the table (sums to 1); the bar graph on a beam (heights = probabilities); 800 spins in
//                    proportion: $1,600 / 800 = $2 = sum of x P(x); the pivot at $4 tips, slid to $2 it balances:
//                    E(X) is the balance point. One "why?" with 3 reasons
//   3 Your turn      guess on 3 four-choice questions, X = number right: P(X = 0) given, P(X = 1) = 27/64 (typed),
//                    E(X) = 0.75 (typed), "can one quiz give 0.75?" (choice), faded from the end; callback to the card
//   4 Prove it       Ana: "a distribution balances at its most likely value". The pivot at $0 tips; a because-chain
//                    shows the turning effect about m is E(X) - m (zero only at m = E(X)); decoys = misconceptions
//   5 Practice       all 24 sub-goals in topic order, then mixed (runtime/practice.ts); DistPic pictures, hidden values
//                    and highlights come in on the replay after a miss
// Voiced lines: src/lesson/topics/expected-value/script.ts -> voice/lines.json. Every answer is logged.
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { type Frame, frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, fracInput, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { DistPic, type DistPicBlock, type DFocus, type DPic } from '../../src/lesson/topics/expected-value/DistPic';
import { FAMILY_NAMES, GENERATORS, MC, type DItem } from '../../src/lesson/topics/expected-value/items';
import { PLAN } from '../../src/lesson/topics/expected-value/plan';
import { explain } from '../../src/lesson/topics/expected-value/explain';
import { SCRIPT } from '../../src/lesson/topics/expected-value/script';
import LINES from './expected-value/voice/lines.json';

const SLUG = 'expected-value';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
const line = (id: string): string => { const s = SCRIPT[id]; if (!s) throw new Error(`no script line ${id}`); return s.html; };
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, line(id));
}
function voicedFb(id: string, ok: boolean): HTMLElement { if (!(id in LINES)) console.warn('no voice line', id); say(id); return feedback(ok, line(id)); }

// ===================== the stage: picture cards on the left, the board on the right =====================
const PF = frame(50, 70, 1140, 940);
/** parts 2-4: a narrower picture and a wider slate (the sums need the room) */
const SLATE = box(990, 70, 1860, 1010);
const PFn = (y: number, hh: number): Frame => frame(50, y, 900, hh);
type Painter = (c: Canvas) => void;
function centred(key: string, src: string, y: number, size: number, col?: Paint, cx = BOARD.cx, maxW = BOARD_W): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: cx - b.cx, y, size: s, col };
}
interface Rows { key: string; src: string; y: number; col?: Paint; size?: number }
const boardOf = (rows: Rows[], area?: Box) => rows.map(r => centred(r.key, r.src, r.y, r.size ?? 70, r.col, area ? area.cx : BOARD.cx, area ? area.w - 90 : BOARD_W));
interface Card { B: () => DistPicBlock; pre: string; alpha?: () => number; focus?: () => DFocus }
function cardsScene(cards: Card[], lines: Line[], extra?: Painter, boardBox?: Box): void {
  setScene({
    table: 1080, lines, leads: [], extra, boardBox,
    model: c => {
      for (const cd of cards) {
        const a = cd.alpha ? cd.alpha() : 1;
        if (a <= 0) continue;
        c.g.save(); c.g.globalAlpha *= a;
        cd.B().draw(c, progressOf(s => tr.k(cd.pre + s)), cd.focus?.() ?? {});
        c.g.restore();
      }
    },
  });
}
function showAll(B: DistPicBlock, pre: string, skip: readonly string[] = [], d = 0.9, delay = 0): void {
  // many steps (a histogram's bars) share about 2.5 s, so the picture is complete before the kid reads the question
  const gap = Math.min(0.25, 2.5 / Math.max(1, B.steps.length));
  B.steps.forEach((s, i) => { if (!skip.includes(s)) tr.set(pre + s, 1, d, delay + i * gap); });
}
const fixed = (B: DistPicBlock) => () => B;

// ===================== the lesson's models =====================
const SPIN: DPic = { kind: 'cond', pic: { kind: 'spinner', sectors: [{ label: '$0', w: 4, p: '\\tfrac{4}{8}' }, { label: '$2', w: 3, p: '\\tfrac{3}{8}' }, { label: '$10', w: 1, p: '\\tfrac{1}{8}' }], title: '8 equal sectors' } };
const SPIN_TABLE: DPic = { kind: 'table', rows: [{ head: 'x', cells: ['0', '2', '10'] }, { head: 'P(X = x)', cells: ['\\tfrac{4}{8}', '\\tfrac{3}{8}', '\\tfrac{1}{8}'] }] };
const spinBars = (fulc?: number): DPic => ({ kind: 'bars', xs: [0, 2, 10], ps: [0.5, 0.375, 0.125], labs: ['\\tfrac{4}{8}', '\\tfrac{3}{8}', '\\tfrac{1}{8}'], axis: { min: 0, max: 10, step: 1, pre: '$', name: 'Prize X (dollars)' }, fulc });

// ===================== 1. The question =====================
const CARDS = [
  { v: '$0', sub: 'the most likely prize', id: MC.mode, why: 'q.cb.mode', val: 0 },
  { v: '$2', sub: 'each prize weighted by its chance', id: '', why: 'q.cb.right', val: 2 },
  { v: '$4', sub: 'the average of $0, $2 and $10', id: MC.unweighted, why: 'q.cb.plain', val: 4 },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = DistPic(SPIN, PF, th);
  const lines = boardOf([
    { key: 'q.L1', src: '\\$0,\\ \\$2,\\ \\$10', y: 220 },
    { key: 'q.L2', src: '\\text{many spins}', y: 360, col: 'first' },
    { key: 'q.L3', src: '\\text{per spin} = \\,?', y: 500, col: 'pick' },
  ]);
  cardsScene([{ B: fixed(B), pre: 'q.' }], lines);
  showAll(B, 'q.', [], 0.9, 0.2);
  tr.set('q.L1', 1, 0.8, 1.4); tr.set('q.L2', 1, 0.8, 1.8); tr.set('q.L3', 1, 0.8, 2.2);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Spinner: 4 sectors $0, 3 sectors $2, 1 sector $10 (8 equal). Average payout per spin?', response: c.v, expected: '$2', correct: c.val === 2, mc: c.id || undefined, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'The booth spinner'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const T = DistPic(SPIN_TABLE, PFn(70, 290), th);
  const S = DistPic(SPIN, PFn(390, 620), th);
  const Bb = DistPic(spinBars(4), PFn(390, 620), th);
  const lines = boardOf([
    { key: 'e.L1', src: 'X = \\text{prize in dollars}', y: 140, col: 'first' },
    { key: 'e.L2', src: '\\tfrac{4}{8} + \\tfrac{3}{8} + \\tfrac{1}{8} = 1', y: 250, size: 66 },
    { key: 'e.L3', src: '\\text{height} = P(X = x)', y: 360, size: 66, col: 'second' },
    { key: 'e.L4', src: '400 \\cdot 0 + 300 \\cdot 2 + 100 \\cdot 10 = 1600', y: 465, size: 64 },
    { key: 'e.L4b', src: '\\tfrac{1600}{800} = 2 \\text{ per spin}', y: 560, size: 66 },
    { key: 'e.L5', src: 'E(X) = \\textstyle\\sum x\\,P(x)', y: 675, col: 'link' },
    { key: 'e.L6', src: '= 0 \\cdot \\tfrac{4}{8} + 2 \\cdot \\tfrac{3}{8} + 10 \\cdot \\tfrac{1}{8} = 2', y: 785, size: 66 },
    { key: 'e.L7', src: '\\text{balance point: } E(X) = \\$2', y: 925, col: 'link' },
  ], SLATE);
  cardsScene([
    { B: fixed(T), pre: 'e.T.' },
    { B: fixed(S), pre: 'e.S.', alpha: () => 1 - tr.k('e.swap') },
    { B: fixed(Bb), pre: 'e.B.', alpha: () => tr.k('e.swap'), focus: () => ({ m: 4 + (2 - 4) * tr.k('e.slide') }) },
  ], lines, undefined, SLATE);
  showAll(S, 'e.S.', [], 0.8, 0.2);
  let step = 0;
  const STEPS = [
    { t: 'Turn outcomes into numbers', why: 'X = the prize; a table of values and probabilities.', act: 'Table' },
    { t: 'Draw the distribution', why: 'Values on a number line, probabilities as heights.', act: 'Draw' },
    { t: 'Picture many spins', why: 'The long-run average per spin.', act: 'Average' },
    { t: 'Find the balance point', why: 'Where does the beam balance?', act: 'Balance' },
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
        tr.set('e.T.card', 1, 0.8); tr.set('e.T.r0', 1, 0.9, 0.4); await wait(1.4); if (!alive()) return;
        tr.set('e.L1', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.T.r1', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('e.L2', 1, 0.9); await wait(1.0); if (!alive()) return;
      } else if (i === 1) {
        tr.set('e.swap', 1, 1.0);
        tr.set('e.B.card', 1, 0.6); tr.set('e.B.axis', 1, 1.0, 0.4); tr.set('e.B.bars', 1, 1.2, 1.0); tr.set('e.B.labs', 1, 0.8, 1.8); await wait(2.8); if (!alive()) return;
        tr.set('e.L3', 1, 0.9); await wait(1.0); if (!alive()) return;
      } else if (i === 2) {
        tr.set('e.L4', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.L4b', 1, 0.9); await wait(1.1); if (!alive()) return;
        tr.set('e.L5', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.L6', 1, 1.2); await wait(1.4); if (!alive()) return;
      } else {
        tr.set('e.B.fulc', 1, 0.7); await wait(0.9); if (!alive()) return;
        tr.set('e.B.tilt', 1, 1.2); await wait(2.0); if (!alive()) return;
        tr.set('e.slide', 1, 2.2); await wait(2.6); if (!alive()) return;
        tr.set('e.L7', 1, 0.9); await wait(1.0); if (!alive()) return;
      }
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The prizes are not equally likely: $0 comes up four times as often as $10.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'Because $2 is the middle prize.', ok: false, id: 'e.why.mid', mc: MC.unweighted },
      { t: 'Because $2 is the prize you are most likely to win.', ok: false, id: 'e.why.mode', mc: MC.mode },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is E(X) $2 and not $4?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: guessing on a quiz =====================
function partTurn(): void {
  tr.reset('t.');
  const FULL = ['\\tfrac{27}{64}', '\\tfrac{27}{64}', '\\tfrac{9}{64}', '\\tfrac{1}{64}'], PS = [27, 27, 9, 1].map(v => v / 64);
  let known = 1;
  const tables = [1, 4].map(k => DistPic({ kind: 'table', rows: [{ head: 'x', cells: ['0', '1', '2', '3'] }, { head: 'P(X = x)', cells: FULL.map((s, i) => (i < k ? s : null)) }] }, PFn(70, 290), th));
  const bars = [1, 4].map(k => DistPic({ kind: 'bars', xs: [0, 1, 2, 3], ps: PS.map((p, i) => (i < k ? p : null)), labs: FULL.map((s, i) => (i < k ? s : null)), axis: { min: 0, max: 3, step: 1, name: 'X = number right' }, fulc: 0.75 }, PFn(390, 620), th));
  const lines = boardOf([
    { key: 't.L0', src: 'P(X = 0) = \\left(\\tfrac{3}{4}\\right)^{3} = \\tfrac{27}{64}', y: 150 },
    { key: 't.L1', src: 'P(X = 1) = 3 \\cdot \\tfrac{1}{4} \\cdot \\left(\\tfrac{3}{4}\\right)^{2} = \\tfrac{27}{64}', y: 300 },
    { key: 't.L2', src: 'E(X) = \\tfrac{0 + 27 + 18 + 3}{64} = 0.75', y: 470, col: 'link' },
    { key: 't.L3', src: '= np = 3 \\cdot \\tfrac{1}{4}', y: 590, size: 66 },
    { key: 't.L4', src: '0.75\\text{: an average, not a score}', y: 760, col: 'link' },
  ], SLATE);
  const tk = () => (known >= 4 ? 1 : 0);
  cardsScene([
    { B: () => tables[tk()]!, pre: 't.T.' },
    { B: () => bars[tk()]!, pre: 't.B.', focus: () => ({ m: 0.75 }) },
  ], lines, undefined, SLATE);
  showAll(tables[0]!, 't.T.', [], 0.8, 0.2);
  showAll(bars[0]!, 't.B.', ['fulc', 'tilt'], 0.8, 0.6);
  let step = 0;
  const STEPS = [{ t: 'P(X = 0)', why: 'Done for you.' }, { t: 'P(X = 1)', why: 'Your step.' }, { t: 'E(X)', why: 'Your step.' }, { t: 'One quiz?', why: 'Your step.' }];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: guessing on a quiz'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(2.4); if (!alive()) return;
    tr.set('t.L0', 1, 0.9); await wait(1.4); if (!alive()) return;
    step = 1; drawPlan(); askP1();
  });
  function askP1(): void {
    const fbHost = h('div');
    const inp = fracInput('', () => check(), false), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'frac' || !(r.d > 0)) { fbHost.replaceChildren(voicedFb('t.empty', false)); return; }
      const n0 = r.w * r.d + r.n, same = (a: number, b: number) => n0 * b === a * r.d;
      const right = same(27, 64), path = same(9, 64), eq = same(1, 4);
      ctx.store.log({ part: 'turn', item: 'turn.p1', prompt: 'Guess on 3 four-choice questions. P(X = 1)?', response: `${n0}/${r.d}`, expected: '27/64', correct: right, mc: right ? undefined : path ? MC.omitsOrder : eq ? MC.equiprob : undefined });
      if (!right) { fbHost.replaceChildren(voicedFb(path ? 't.p1.path' : eq ? 't.p1.equal' : 't.p1.no', false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.p1.ok', true));
      seq(async alive => {
        tr.set('t.L1', 1, 1.0); await wait(1.2); if (!alive()) return;
        known = 4;
        tr.jump('t.T.r1', 0); tr.set('t.T.r1', 1, 1.2); tr.jump('t.B.bars', 0); tr.set('t.B.bars', 1, 1.4); tr.jump('t.B.labs', 0); tr.set('t.B.labs', 1, 0.8, 1.2); await wait(2.4); if (!alive()) return;
        step = 2; drawPlan(); askEv();
      });
    }
    work.replaceChildren(voiced('t.p1'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askEv(): void {
    const fbHost = h('div');
    const inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false)); return; }
      const right = Math.abs(r.v - 0.75) < 1e-9, plain = Math.abs(r.v - 1.5) < 1e-9, sumP = Math.abs(r.v - 1) < 1e-9;
      ctx.store.log({ part: 'turn', item: 'turn.ev', prompt: 'X = number right of 3 guessed 4-choice questions, table 27/64, 27/64, 9/64, 1/64. E(X)?', response: String(r.v), expected: '0.75', correct: right, mc: right ? undefined : plain ? MC.unweighted : sumP ? MC.sumsP : undefined });
      if (!right) { fbHost.replaceChildren(voicedFb(plain ? 't.ev.plain' : sumP ? 't.ev.sumP' : 't.ev.no', false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.ev.ok', true));
      seq(async alive => {
        tr.set('t.L2', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('t.L3', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('t.B.fulc', 1, 0.8); tr.set('t.B.tilt', 1, 0.8, 0.6); await wait(1.6); if (!alive()) return;
        step = 3; drawPlan(); judge();
      });
    }
    work.replaceChildren(voiced('t.ev'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function judge(): void {
    const opts = [
      { t: 'No: one quiz gives 0, 1, 2 or 3 right; 0.75 is the long-run average', ok: true, id: 't.judge.ok', mc: undefined as string | undefined },
      { t: 'No, but you will get 1 right: 0.75 rounded', ok: false, id: 't.judge.round', mc: MC.roundsEv },
      { t: 'Yes: 0.75 is the most likely result', ok: false, id: 't.judge.mode', mc: MC.mode },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'turn', item: 'turn.judge', prompt: 'E(X) = 0.75. Can one quiz give 0.75 right?', response: o.t, expected: 'no: an average', correct: o.ok, mc: o.mc });
      if (!o.ok) return;
      bx.querySelectorAll('button').forEach(b => ((b as HTMLButtonElement).disabled = true));
      seq(async alive => {
        tr.set('t.L4', 1, 0.9); await wait(1.0); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(callback());
      });
    })));
    work.replaceChildren(voiced('t.judge'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    if (!(id in LINES)) console.warn('no voice line', id);
    say(id);
    c.append(html('p', '', line(id) + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: the balance point is E(X) =====================
function partProve(): void {
  tr.reset('p.');
  const Bb = DistPic(spinBars(0), PFn(70, 940), th);
  const lines = boardOf([
    { key: 'p.S1', src: '\\text{Ana: balances at } \\$0', y: 130, col: 'dim' },
    { key: 'p.L1', src: '\\textstyle\\sum (x - m)\\,P(x)', y: 270 },
    { key: 'p.L2', src: '= \\textstyle\\sum x\\,P(x) - m \\sum P(x)', y: 390 },
    { key: 'p.L3', src: '= E(X) - m \\cdot 1', y: 510 },
    { key: 'p.L4', src: '= 0 \\ \\text{only at } m = E(X) = 2', y: 640, col: 'link' },
    { key: 'p.L5', src: 'm = 0:\\ \\ 2 - 0 = 2 \\ne 0', y: 790 },
  ], SLATE);
  const extra = (c: Canvas) => {
    const k = tr.k('p.strike');
    if (k > 0) { const L = lines[0]!, b = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }); strike(c, b.x0 - 10, b.cy + 4, b.x1 + 10, b.cy - 4, k, { col: 'wrong' }); }
  };
  cardsScene([{ B: fixed(Bb), pre: 'p.', focus: () => ({ m: 2 * tr.k('p.slide') }) }], lines, extra, SLATE);
  showAll(Bb, 'p.', ['tilt', 'fulc'], 0.8, 0.3); tr.set('p.S1', 1, 0.8, 1.6);
  const CHIPS = [
    { t: 'Multiply out each term: (x − m)·P(x) = x·P(x) − m·P(x).', fits: 0 },
    { t: 'm is the same in every term, and the probabilities add to 1.', fits: 1 },
    { t: 'E(X) − m is zero exactly when m equals E(X).', fits: 2 },
    { t: 'Each value counts equally, so the beam balances at the middle value.', fits: -1, mc: MC.unweighted, id: 'p.no.equal' },
    { t: 'The tallest bar decides where the beam balances.', fits: -1, mc: MC.mode, id: 'p.no.mode' },
    { t: 'The probabilities add to the number of values, 3.', fits: -1, mc: MC.notOne, id: 'p.no.sum' },
  ];
  const CLAIMS = [
    'The turning effect about a pivot m is Σ(x − m)·P(x) = Σx·P(x) − m·ΣP(x),',
    'and that equals E(X) − m · 1 = E(X) − m,',
    'so it is 0 only at m = E(X) = $2: the beam balances at <b class="s">$2</b>, and Ana is wrong,',
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
      if (n === 1) { tr.set('p.L1', 1, 0.9); await wait(1.0); if (!alive()) return; tr.set('p.L2', 1, 0.9); await wait(1.0); }
      if (n === 2) { tr.set('p.L3', 1, 0.9); await wait(1.1); }
      if (n === 3) {
        tr.set('p.L4', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('p.L5', 1, 0.9); await wait(1.2); if (!alive()) return;
        tr.set('p.slide', 1, 2.2); await wait(2.6); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(0.9); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Ana is right', () => judge(true)), no = btn('Ana is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Ana: a distribution balances at its most likely value ($0). Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.mode : undefined });
    // the pivot goes where Ana says, and the beam answers
    tr.set('p.fulc', 1, 0.7); tr.set('p.tilt', 1, 1.2, 0.8);
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
    show: it => showItem(it as DItem),
  });
}
/** split a too-wide line at its top-level "=" signs (outside braces): "a = b = c" -> "a", "= b", "= c" */
function splitEq(src: string, maxW: number): string[] {
  if (texWidth(tex(src) as Formula, 60) <= maxW) return [src];
  const out: string[] = [];
  let depth = 0, cur = '';
  for (const ch of src) {
    if (ch === '{' || ch === '(') depth++;
    if (ch === '}' || ch === ')') depth--;
    if (ch === '=' && depth === 0 && cur.trim()) { out.push(cur.trim()); cur = ''; }
    cur += ch;
  }
  out.push(cur.trim());
  return out.length > 1 ? out : [src];
}
function boardLines(src: string, area: Box, size: number): Line[] {
  const parts = src.split(/\\qquad\s*/).map(p0 => p0.trim()).filter(Boolean).flatMap(p0 => splitEq(p0, area.w - 90));
  if (!parts.length) return [];
  let sz = size;
  while (sz > 60 && parts.some(p0 => texWidth(tex(p0) as Formula, sz) > area.w - 90)) sz -= 2;
  const hs = parts.map(p0 => { const F = tex(p0) as Formula; return Math.max(1, (F.bottom - F.top) / 1000) * sz; });
  const gap = Math.min(sz * 1.5, (area.h - 60) / parts.length);
  const total = hs.reduce((s, x) => s + Math.max(x, gap), 0);
  let y = area.cy - total / 2;
  return parts.map((p0, i) => { const hh = Math.max(hs[i]!, gap); const L = centred(`x.B${i}`, p0, y + hh / 2, sz, undefined, area.cx, area.w - 90); y += hh; return L; });
}
function showItem(item: DItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pics = (item.picture?.pics ?? []) as DPic[];
  // a wide notation line gets a wider slate (the picture card gives up the room), never type below 60 px
  const parts = (item.board || '').split(/\\qquad\s*/).map(p0 => p0.trim()).filter(Boolean);
  const need = Math.max(0, ...parts.map(p0 => texWidth(tex(p0) as Formula, 64))) + 110;
  let bx0 = Math.min(BOARD.x0, Math.max(BOARD.x1 - need, 1010));
  const blocks: { B: DistPicBlock; pre: string }[] = [];
  let lastErr = '';
  const build = (wMax: number, compact = true): boolean => {
    blocks.length = 0;
    const PFi = frame(PF.x, PF.y, Math.min(PF.w, wMax), PF.h);
    const w = item.picture?.weights ?? pics.map(() => 1), gap = 30;
    // a table takes the height it needs; the other cards share the rest (all tables: centred)
    const want = pics.map(p => (p.kind === 'table' && compact ? 150 + 125 * p.rows.length : 0));
    const free = PFi.h - gap * (pics.length - 1) - want.reduce((a, b) => a + b, 0);
    const tot = pics.reduce((a, _, i) => a + (want[i] ? 0 : w[i]!), 0);
    const hs = pics.map((_, i) => want[i] || (free * w[i]!) / tot);
    let y = PFi.y + (tot === 0 ? Math.max(0, free) * 0.4 : 0);
    const ok = pics.every((p, i) => {
      const hh = hs[i]!;
      const fr: Frame = frame(PFi.x, y, PFi.w, hh); y += hh + gap;
      const m = tryBlock(() => DistPic(p, fr, th));
      if (!m.ok) { lastErr = m.error; return false; }
      blocks.push({ B: m.value, pre: `x.${i}.` });
      return true;
    });
    if (!ok) blocks.length = 0;
    return ok;
  };
  if (pics.length && !build(bx0 - 60 - PF.x) && !build(bx0 - 60 - PF.x, false)) { bx0 = BOARD.x0; if (!build(PF.w) && !build(PF.w, false)) console.warn('DistPic does not fit', item.family, lastErr); }
  if (!blocks.length) {
    const big = box(200, 160, 1720, 920);
    const lines = boardLines(item.board || '\\text{?}', big, 110);
    setScene({ lines, leads: [], boardBox: big, table: 1080 });
    lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.1 + i * 0.2));
    return {};
  }
  const slateBox = bx0 < BOARD.x0 ? box(bx0, BOARD.y0, BOARD.x1, BOARD.y1) : undefined;
  const lines = boardLines(item.board, box(bx0, BOARD.y0, BOARD.x1, BOARD.y0 + 620), 76);
  // a beam is shown level (no fulcrum in practice pictures unless the item asks for one)
  cardsScene(blocks.map(b => ({ B: fixed(b.B), pre: b.pre })), lines, undefined, slateBox);
  blocks.forEach((b, i) => showAll(b.B, b.pre, ['tilt', 'hl'], 0.8, 0.1 + i * 0.4));
  lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.3 + i * 0.2));
  return {
    solve: async alive => {
      for (const b of blocks) { tr.set(b.pre + 'rev', 1, 1.2); await wait(0.6); if (!alive()) return; }
      await wait(1.0);
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['E(X) = \\textstyle\\sum x\\,P(x) = 0 \\cdot \\tfrac{4}{8} + 2 \\cdot \\tfrac{3}{8} + 10 \\cdot \\tfrac{1}{8} \\quad \\dfrac{400}{800} \\left(\\tfrac{3}{4}\\right)^{3} \\binom{5}{2} \\ge \\le \\ne \\$'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
