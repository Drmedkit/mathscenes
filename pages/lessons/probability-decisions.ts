// probability-decisions.ts: "Using probability to make decisions" (HS Statistics 9, HSS-MD.B.5-7) on the shared
// lesson runtime.
//   1 The question   an $800 phone, a $120 2-year plan, a $300 repair, P(break) = 0.15. Which choice costs less on
//                    average? Cards: buy (it saves $300: chooses by the prize), skip (right), no difference (50-50)
//   2 Worked example the decision tree (square = you, circles = chance); net payoffs on every leaf (costs negative);
//                    E(buy) = −$120, E(skip) = −$45; the downside: the skip bars balance at −$45 but one phone costs $0
//                    or $300, so: skip, unless $300 would hurt. One "why?" with 3 reasons
//   3 Your turn      a club fundraiser: outdoors $2,000 / −$500 (rain 0.2) vs the gym's sure $1,400. E(gym) given;
//                    E(outdoors) = $1,500 typed; the scenario table: where the better choice switches (choice); the
//                    club holds only $300: the recommendation (choice). Callback to the card
//   4 Prove it       Theo: "splitting a stake over two independent stalls raises the EV". Two balance beams; a
//                    because-chain: the four pairs (1/4 each), E = $200 unchanged, SD $400 -> about $283
//   5 Practice       all 17 sub-goals in topic order, then mixed (runtime/practice.ts); DecTree / DistPic pictures,
//                    hidden values come in on the replay after a miss
// Voiced lines: src/lesson/topics/probability-decisions/script.ts -> voice/lines.json. Every answer is logged.
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { type Frame, frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { DFocus } from '../../src/lesson/topics/expected-value/DistPic';
import { DecPic, type DecPicBlock, type PPic } from '../../src/lesson/topics/probability-decisions/DecPic';
import { FAMILY_NAMES, GENERATORS, MC, type PItem } from '../../src/lesson/topics/probability-decisions/items';
import { PLAN } from '../../src/lesson/topics/probability-decisions/plan';
import { explain } from '../../src/lesson/topics/probability-decisions/explain';
import { SCRIPT } from '../../src/lesson/topics/probability-decisions/script';
import LINES from './probability-decisions/voice/lines.json';

const SLUG = 'probability-decisions';
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
/** parts 2-4: a narrower picture and a wider slate */
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
interface Card { B: () => DecPicBlock; pre: string; alpha?: () => number; focus?: () => DFocus }
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
function showAll(B: DecPicBlock, pre: string, skip: readonly string[] = [], d = 0.9, delay = 0): void {
  const gap = Math.min(0.25, 2.5 / Math.max(1, B.steps.length));
  B.steps.forEach((s, i) => { if (!skip.includes(s)) tr.set(pre + s, 1, d, delay + i * gap); });
}
const fixed = (B: DecPicBlock) => () => B;

// ===================== the lesson's models =====================
/** the phone plan: buy ($120 for sure) or skip ($300 repair with probability 0.15) */
const phoneTree = (vals: boolean, ev: boolean): PPic => ({
  kind: 'dtree', title: 'An $800 phone: the 2-year plan?',
  opts: [
    { label: 'buy plan', outs: [{ label: 'breaks', p: '0.15', v: vals ? '-\\$120' : null }, { label: 'works', p: '0.85', v: vals ? '-\\$120' : null }] },
    { label: 'skip plan', outs: [{ label: 'breaks', p: '0.15', v: vals ? '-\\$300' : null }, { label: 'works', p: '0.85', v: vals ? '\\$0' : null }] },
  ],
  ev: ev ? ['E = -\\$120', 'E = -\\$45'] : undefined, hl: ev ? 1 : undefined,
});
const skipBars = (fulc?: number): PPic => ({ kind: 'bars', title: 'Skip the plan: your cost', xs: [-300, 0], ps: [0.15, 0.85], labs: ['0.15', '0.85'], axis: { min: -300, max: 0, step: 50, pre: '$', name: 'Net payoff (dollars)', only: true }, y: { max: 1, step: 0.25, dec: 2 }, fulc });

// ===================== 1. The question =====================
const CARDS = [
  { v: 'Buy the plan', sub: 'it saves the $300 repair', id: MC.byPrize, why: 'q.cb.prize', val: 0 },
  { v: 'Skip the plan', sub: 'a break is only 15% likely', id: '', why: 'q.cb.right', val: 1 },
  { v: 'No difference', sub: 'it breaks or it doesn’t: 50-50', id: MC.equiprob, why: 'q.cb.half', val: 2 },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = DecPic(phoneTree(true, false), PF, th);
  const lines = boardOf([
    { key: 'q.L1', src: '\\text{plan: } \\$120', y: 200 },
    { key: 'q.L2', src: '\\text{repair: } \\$300', y: 330 },
    { key: 'q.L3', src: 'P(\\text{break}) = 0.15', y: 460, col: 'second' },
    { key: 'q.L4', src: '\\text{cheaper on average?}', y: 620, col: 'pick' },
  ]);
  cardsScene([{ B: fixed(B), pre: 'q.' }], lines);
  showAll(B, 'q.', [], 0.9, 0.2);
  tr.set('q.L1', 1, 0.8, 1.4); tr.set('q.L2', 1, 0.8, 1.8); tr.set('q.L3', 1, 0.8, 2.2); tr.set('q.L4', 1, 0.8, 2.6);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '$800 phone: a $120 2-year plan, or skip it ($300 repair, P(break) = 0.15). Which costs less on average?', response: c.v, expected: 'Skip the plan', correct: c.val === 1, mc: c.id || undefined, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'The phone plan'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const T = DecPic(phoneTree(true, true), PFn(70, 940), th);
  const Bb = DecPic(skipBars(-120), PFn(70, 940), th);
  const lines = boardOf([
    { key: 'e.L1', src: '\\square\\ \\text{you choose},\\ \\ \\bigcirc\\ \\text{chance}', y: 140, size: 66 },
    { key: 'e.L2', src: '\\text{buy: } {-120},\\ {-120}', y: 255, col: 'first' },
    { key: 'e.L3', src: '\\text{skip: } {-300},\\ 0', y: 355, col: 'first' },
    { key: 'e.L4', src: 'E(\\text{buy}) = -\\$120', y: 480, col: 'link' },
    { key: 'e.L5', src: 'E(\\text{skip}) = 0.15(-300) + 0.85(0)', y: 590, size: 64 },
    { key: 'e.L6', src: '= -\\$45', y: 680, col: 'link' },
    { key: 'e.L7', src: '\\text{worst case: } {-\\$300}', y: 800, col: 'wrong' },
    { key: 'e.L8', src: '\\text{skip, unless } \\$300 \\text{ hurts}', y: 920, col: 'link' },
  ], SLATE);
  cardsScene([
    { B: fixed(T), pre: 'e.T.', alpha: () => 1 - tr.k('e.swap') },
    { B: fixed(Bb), pre: 'e.B.', alpha: () => tr.k('e.swap'), focus: () => ({ m: -120 + (-45 + 120) * tr.k('e.slide') }) },
  ], lines, undefined, SLATE);
  tr.set('e.T.card', 1, 0.8, 0.2);
  let step = 0;
  const STEPS = [
    { t: 'Lay out the decision', why: 'Your choices, then chance.', act: 'Lay out' },
    { t: 'Net payoff on every leaf', why: 'From your side; costs negative.', act: 'Payoffs' },
    { t: 'Expected value of each choice', why: 'Weight each payoff by its chance.', act: 'Average' },
    { t: 'Look at the downside', why: 'What can one phone cost?', act: 'Downside' },
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
        tr.set('e.T.sq', 1, 0.7); await wait(0.8); if (!alive()) return;
        tr.set('e.T.opts', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.T.fan', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('e.T.p', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.L1', 1, 0.9); await wait(1.0); if (!alive()) return;
      } else if (i === 1) {
        tr.set('e.T.v', 1, 1.4); await wait(1.6); if (!alive()) return;
        tr.set('e.L2', 1, 0.9); await wait(0.8); if (!alive()) return;
        tr.set('e.L3', 1, 0.9); await wait(1.0); if (!alive()) return;
      } else if (i === 2) {
        tr.set('e.T.ev', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.L4', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.L5', 1, 1.1); await wait(1.2); if (!alive()) return;
        tr.set('e.L6', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('e.T.hl', 1, 0.8); await wait(1.0); if (!alive()) return;
      } else {
        tr.set('e.swap', 1, 1.0);
        tr.set('e.B.card', 1, 0.6); tr.set('e.B.axis', 1, 1.0, 0.4); tr.set('e.B.bars', 1, 1.2, 1.0); tr.set('e.B.labs', 1, 0.8, 1.8); await wait(2.8); if (!alive()) return;
        tr.set('e.B.fulc', 1, 0.7); tr.set('e.B.tilt', 1, 1.2, 0.3); await wait(1.8); if (!alive()) return;
        tr.set('e.slide', 1, 2.0); await wait(2.4); if (!alive()) return;
        tr.set('e.L7', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.L8', 1, 0.9); await wait(1.0); if (!alive()) return;
      }
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The $300 only happens 15% of the time: 0.15 × $300 = $45, less than $120.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'Because $0 is the most likely cost when you skip.', ok: false, id: 'e.why.mode', mc: MC.mode },
      { t: 'Because skipping costs nothing.', ok: false, id: 'e.why.free', mc: MC.omitsBranch },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is skipping cheaper on average, though a break costs $300?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: the club fundraiser =====================
const CLUB = (ev: (string | null)[]): PPic => ({
  kind: 'dtree',
  opts: [
    { label: 'outdoors', outs: [{ label: 'dry', p: '0.8', v: '\\$2{,}000' }, { label: 'rain', p: '0.2', v: '-\\$500' }] },
    { label: 'gym', outs: [{ label: 'sure', p: '1', v: '\\$1{,}400' }] },
  ],
  ev, reveal: { ev: ['E = \\$1{,}500', 'E = \\$1{,}400'] },
});
const SENS: PPic = { kind: 'table', rows: [{ head: 'P(\\text{rain})', cells: ['0.1', '0.2', '0.3', '0.4'] }, { head: 'E_{\\text{out}}', cells: ['1750', '1500', '1250', '1000'] }, { head: 'E_{\\text{gym}}', cells: ['1400', '1400', '1400', '1400'] }], hl: [1, 2] };
function partTurn(): void {
  tr.reset('t.');
  let evKnown = false;
  const trees = [CLUB([null, 'E = \\$1{,}400']), CLUB(['E = \\$1{,}500', 'E = \\$1{,}400'])].map(p => DecPic(p, PFn(70, 490), th));
  const Tb = DecPic(SENS, PFn(580, 430), th);
  const lines = boardOf([
    { key: 't.L0', src: 'E(\\text{gym}) = \\$1{,}400', y: 140 },
    { key: 't.L1', src: 'E(\\text{out}) = 0.8(2000) + 0.2(-500)', y: 260, size: 64 },
    { key: 't.L2', src: '= \\$1{,}500', y: 360, col: 'link' },
    { key: 't.L3', src: '\\text{switch: between } 0.2 \\text{ and } 0.3', y: 500, col: 'second' },
    { key: 't.L4', src: '\\text{account: } \\$300 < \\$500 \\text{ loss}', y: 640, col: 'wrong' },
    { key: 't.L5', src: '\\text{recommend: the gym}', y: 780, col: 'link' },
  ], SLATE);
  cardsScene([
    { B: () => trees[evKnown ? 1 : 0]!, pre: 't.T.' },
    { B: fixed(Tb), pre: 't.S.', alpha: () => tr.k('t.S.on') },
  ], lines, undefined, SLATE);
  showAll(trees[0]!, 't.T.', ['hl'], 0.8, 0.2);
  let step = 0;
  const STEPS = [{ t: 'E(gym)', why: 'Done for you.' }, { t: 'E(outdoors)', why: 'Your step.' }, { t: 'What if the forecast is off?', why: 'Your step.' }, { t: 'Recommend', why: 'Your step.' }];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: the club fundraiser'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(3.2); if (!alive()) return;
    tr.set('t.L0', 1, 0.9); work.replaceChildren(voiced('t.gym')); await wait(2.0); if (!alive()) return;
    step = 1; drawPlan(); askEv();
  });
  function askEv(): void {
    const fbHost = h('div');
    const inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false)); return; }
      const is = (v: number) => Math.abs(r.v - v) < 1e-6;
      const right = is(1500), plain = is(750), drop = is(1600), sign = is(1700);
      ctx.store.log({ part: 'turn', item: 'turn.ev', prompt: 'Outdoors: $2,000 if dry (0.8), −$500 if rain (0.2). E(outdoors)?', response: String(r.v), expected: '1500', correct: right, mc: right ? undefined : plain ? MC.unweighted : drop ? MC.noChange : sign ? MC.direction : undefined });
      if (!right) { fbHost.replaceChildren(voicedFb(plain ? 't.ev.plain' : drop ? 't.ev.drop' : sign ? 't.ev.sign' : 't.ev.no', false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.ev.ok', true));
      seq(async alive => {
        tr.set('t.L1', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('t.L2', 1, 0.8); await wait(0.9); if (!alive()) return;
        evKnown = true; tr.jump('t.T.ev', 0); tr.set('t.T.ev', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('t.S.on', 1, 0.6); showAll(Tb, 't.S.', ['hl'], 0.8, 0.2); await wait(2.0); if (!alive()) return;
        step = 2; drawPlan(); askSwitch();
      });
    }
    work.replaceChildren(voiced('t.ev'), h('div', { class: 'row' }, inp.node, html('span', 'dim', 'dollars')), h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askSwitch(): void {
    const opts = [
      { t: 'Between 0.2 and 0.3', ok: true, id: 't.sens.ok', mc: undefined as string | undefined },
      { t: 'Between 0.3 and 0.4', ok: false, id: 't.sens.late', mc: undefined as string | undefined },
      { t: 'It never switches: outdoors is always better', ok: false, id: 't.sens.never', mc: MC.unqualified },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'turn', item: 'turn.switch', prompt: 'Scenario table E(outdoors) at P(rain) 0.1-0.4 vs the gym $1,400: where does the better choice switch?', response: o.t, expected: 'between 0.2 and 0.3', correct: o.ok, mc: o.mc });
      if (!o.ok) return;
      bx.querySelectorAll('button').forEach(b => ((b as HTMLButtonElement).disabled = true));
      seq(async alive => {
        tr.set('t.S.hl', 1, 0.8); tr.set('t.L3', 1, 0.9); await wait(1.4); if (!alive()) return;
        step = 3; drawPlan(); judge();
      });
    })));
    work.replaceChildren(voiced('t.sens'), bx, fbHost);
  }
  function judge(): void {
    const opts = [
      { t: 'The gym: outdoors is only $100 better on average, and a $500 loss is more than the club can cover', ok: true, id: 't.judge.ok', mc: undefined as string | undefined },
      { t: 'Outdoors: always take the higher expected value', ok: false, id: 't.judge.ev', mc: MC.prefModel },
      { t: 'The gym: rain or no rain is 50-50', ok: false, id: 't.judge.half', mc: MC.equiprob },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'turn', item: 'turn.judge', prompt: 'E(outdoors) $1,500 vs gym $1,400; the club holds only $300. Recommendation?', response: o.t, expected: 'the gym (downside)', correct: o.ok, mc: o.mc });
      if (!o.ok) return;
      bx.querySelectorAll('button').forEach(b => ((b as HTMLButtonElement).disabled = true));
      seq(async alive => {
        tr.set('t.L4', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('t.L5', 1, 0.9); await wait(1.0); if (!alive()) return;
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

// ===================== 4. Prove it: splitting the stake =====================
const ONE: PPic = { kind: 'bars', title: 'One stall: $2,000', xs: [-200, 600], ps: [0.5, 0.5], axis: { min: -200, max: 600, step: 200, pre: '$' }, fulc: 200 };
const SPLIT: PPic = { kind: 'bars', title: 'Split: $1,000 + $1,000', xs: [-200, 200, 600], ps: [null, null, null], axis: { min: -200, max: 600, step: 200, pre: '$' }, fulc: 200, reveal: { ps: [0.25, 0.5, 0.25] } };
function partProve(): void {
  tr.reset('p.');
  const B1 = DecPic(ONE, PFn(70, 460), th), B2 = DecPic(SPLIT, PFn(550, 460), th);
  const lines = boardOf([
    { key: 'p.S1', src: '\\text{Theo: splitting raises } E', y: 130, col: 'dim' },
    { key: 'p.L1', src: '{+600},\\ {+200},\\ {+200},\\ {-200}', y: 250, size: 66 },
    { key: 'p.L1b', src: '\\text{each pair: } \\tfrac12 \\cdot \\tfrac12 = \\tfrac14', y: 340, size: 64 },
    { key: 'p.L2', src: 'E = \\tfrac14(600) + \\tfrac12(200) + \\tfrac14(-200)', y: 460, size: 64 },
    { key: 'p.L3', src: '= \\$200 = E(\\text{one stall})', y: 560, col: 'link' },
    { key: 'p.L4', src: 'SD = \\sqrt{\\tfrac14(400)^2 + \\tfrac14(400)^2}', y: 700, size: 64 },
    { key: 'p.L5', src: '\\approx \\$283 < \\$400', y: 810, col: 'link' },
  ], SLATE);
  const extra = (c: Canvas) => {
    const k = tr.k('p.strike');
    if (k > 0) { const L = lines[0]!, b = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }); strike(c, b.x0 - 10, b.cy + 4, b.x1 + 10, b.cy - 4, k, { col: 'wrong' }); }
  };
  cardsScene([{ B: fixed(B1), pre: 'p.1.' }, { B: fixed(B2), pre: 'p.2.' }], lines, extra, SLATE);
  showAll(B1, 'p.1.', [], 0.8, 0.3); showAll(B2, 'p.2.', ['tilt', 'fulc'], 0.8, 1.0); tr.set('p.S1', 1, 0.8, 1.8);
  const CHIPS = [
    { t: 'The stalls are independent, so each of the four pairs has probability ½ × ½ = ¼.', fits: 0 },
    { t: 'Each $1,000 half has half the EV, $100, and $100 + $100 = $200.', fits: 1 },
    { t: 'The extremes drop to probability ¼ each and the middle +$200 takes ½, so results sit closer to $200.', fits: 2 },
    { t: 'There are three totals, so each has probability ⅓.', fits: -1, mc: MC.equiprob, id: 'p.no.equal' },
    { t: 'Two stalls are two chances to win, so the EV doubles.', fits: -1, mc: MC.divEv, id: 'p.no.double' },
    { t: 'Splitting lowers the risk even if one storm hits both stalls.', fits: -1, mc: MC.linked, id: 'p.no.linked' },
  ];
  const CLAIMS = [
    'With $1,000 each, every stall nets +$300 or −$100; the four pairs give +$600, +$200, +$200, −$200, each with probability ¼,',
    'so E = ¼($600) + ½($200) + ¼(−$200) = $200, the same as one stall,',
    `but the SD drops from $400 to √(¼ · 400² + ¼ · 400²) ≈ <b class="s">$283</b>: same reward, less risk, and Theo is wrong about the EV,`,
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
      if (n === 1) { tr.set('p.2.rev', 1, 1.4); tr.set('p.L1', 1, 0.9); await wait(1.0); if (!alive()) return; tr.set('p.L1b', 1, 0.9); await wait(1.0); }
      if (n === 2) { tr.set('p.L2', 1, 0.9); await wait(1.0); if (!alive()) return; tr.set('p.L3', 1, 0.9); await wait(1.0); if (!alive()) return; tr.set('p.2.fulc', 1, 0.7); tr.set('p.2.tilt', 1, 1.0, 0.4); await wait(1.6); }
      if (n === 3) {
        tr.set('p.L4', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('p.L5', 1, 0.9); await wait(1.2); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(0.9); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Theo is right', () => judge(true)), no = btn('Theo is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Theo: splitting $2,000 over two independent stalls raises the expected payoff. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.divEv : undefined });
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
    show: it => showItem(it as PItem),
  });
}
/** split a too-wide line at its top-level "=" signs (outside braces) */
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
function showItem(item: PItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pics = (item.picture?.pics ?? []) as PPic[];
  const parts = (item.board || '').split(/\\qquad\s*/).map(p0 => p0.trim()).filter(Boolean);
  const need = Math.max(0, ...parts.map(p0 => texWidth(tex(p0) as Formula, 64))) + 110;
  let bx0 = Math.min(BOARD.x0, Math.max(BOARD.x1 - need, 1010));
  const blocks: { B: DecPicBlock; pre: string }[] = [];
  let lastErr = '';
  const build = (wMax: number, compact = true): boolean => {
    blocks.length = 0;
    const PFi = frame(PF.x, PF.y, Math.min(PF.w, wMax), PF.h);
    const w = item.picture?.weights ?? pics.map(() => 1), gap = 30;
    const want = pics.map(p => (p.kind === 'table' && compact ? 150 + 125 * p.rows.length : 0));
    const free = PFi.h - gap * (pics.length - 1) - want.reduce((a, b) => a + b, 0);
    const tot = pics.reduce((a, _, i) => a + (want[i] ? 0 : w[i]!), 0);
    const hs = pics.map((_, i) => want[i] || (free * w[i]!) / tot);
    let y = PFi.y + (tot === 0 ? Math.max(0, free) * 0.4 : 0);
    const ok = pics.every((p, i) => {
      const hh = hs[i]!;
      const fr: Frame = frame(PFi.x, y, PFi.w, hh); y += hh + gap;
      const m = tryBlock(() => DecPic(p, fr, th));
      if (!m.ok) { lastErr = m.error; return false; }
      blocks.push({ B: m.value, pre: `x.${i}.` });
      return true;
    });
    if (!ok) blocks.length = 0;
    return ok;
  };
  if (pics.length && !build(bx0 - 60 - PF.x) && !build(bx0 - 60 - PF.x, false)) { bx0 = BOARD.x0; if (!build(PF.w) && !build(PF.w, false)) console.warn('DecPic does not fit', item.family, lastErr); }
  if (!blocks.length) {
    const big = box(200, 160, 1720, 920);
    const lines = boardLines(item.board || '\\text{?}', big, 110);
    setScene({ lines, leads: [], boardBox: big, table: 1080 });
    lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.1 + i * 0.2));
    return {};
  }
  const slateBox = bx0 < BOARD.x0 ? box(bx0, BOARD.y0, BOARD.x1, BOARD.y1) : undefined;
  const lines = boardLines(item.board, box(bx0, BOARD.y0, BOARD.x1, BOARD.y0 + 620), 76);
  cardsScene(blocks.map(b => ({ B: fixed(b.B), pre: b.pre })), lines, undefined, slateBox);
  blocks.forEach((b, i) => showAll(b.B, b.pre, ['tilt', 'hl'], 0.8, 0.1 + i * 0.4));
  lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.3 + i * 0.2));
  return {
    solve: async alive => {
      for (const b of blocks) { tr.set(b.pre + 'rev', 1, 1.2); if (b.B.steps.includes('hl')) tr.set(b.pre + 'hl', 1, 0.8, 0.6); await wait(0.6); if (!alive()) return; }
      await wait(1.0);
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['E(\\text{skip}) = 0.15(-300) + 0.85(0) = -\\$45 \\quad \\square\\ \\bigcirc \\quad \\tfrac14 \\sqrt{80000} \\approx 283 < \\$400 \\quad E_{\\text{out}} \\ge \\le'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
