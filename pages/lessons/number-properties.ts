// number-properties.ts: "Properties and the real numbers" (Algebra 1, lesson 1) on the shared lesson runtime.
//   1 The question   add two irrational numbers: is the sum always irrational? (always / sometimes / never + how sure)
//   2 Worked example on the number-set map: place the numbers, try pairs (they stay irrational, but examples prove
//                    nothing), hunt for a counterexample (√2 + (−√2) = 0 lands in Whole: not closed), compare with the
//                    rationals ((ad + bc)/(bd): always rational); one "why?" with 3 reasons
//   3 Your turn      irrational × irrational: pick the counterexample (one stays inside, one breaks the premise), work
//                    out √3 · √3 = 3, name every set 3 is in
//   4 Prove it       Sam thinks 3 + √2 might be rational: an indirect proof from reason chips (distractors =
//                    catalogue misconceptions); the map shows √2 forced into Rational, which is impossible
//   5 Practice       all 25 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: pages/lessons/number-properties/voice/lines.json. Every answer is logged (runtime/store.ts).
import { type Canvas, strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from "../../src/blocks/block";
/** practice claims get the whole stage (no board): the table is the picture and the question */
const CLAIM_FRAME = frame(300, 110, 1320, 860);
import { BOARD, BOARD_W, MF, bigLine, bump, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { slate } from '../../src/lesson/annotate';
import { drawWords } from '../../src/lesson/words';
import { type MapFocus, type MapStep, type Region, type Token, SetMap, type SetMapBlock } from '../../src/lesson/topics/number-properties/SetMap';
import { ClaimTable, type ClaimRow } from '../../src/lesson/topics/number-properties/ClaimTable';
import { AreaSplit, type AreaStep } from '../../src/lesson/topics/number-properties/AreaSplit';
import { FAMILY_NAMES, GENERATORS, MC, type NPItem } from '../../src/lesson/topics/number-properties/items';
import { PLAN } from '../../src/lesson/topics/number-properties/plan';
import { explain } from '../../src/lesson/topics/number-properties/explain';
import { R as num, add, neg, sqrt, frac } from '../../src/lesson/topics/number-properties/numbers';
import LINES from './number-properties/voice/lines.json';

const SLUG = 'number-properties';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
const R2 = '√<span class="rad">2</span>', R3 = '√<span class="rad">3</span>', R5 = '√<span class="rad">5</span>';
/** a voiced panel line: the HTML shown is the line's text with colour marks; the narrator says lines.json[id] */
function voiced(id: string, htmlText: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, htmlText);
}
function voicedFb(id: string, ok: boolean, htmlText: string): HTMLElement { say(id); return feedback(ok, htmlText); }

// ===================== board helpers =====================
function centred(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BOARD_W) s -= 2;
  if (texWidth(F, s) > BOARD_W + 40) console.warn('board line too wide:', src);
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: BOARD.cx - b.cx, y, size: s, tags, col };
}
/** strike a board line (a claim that turned out false) */
function strikeLine(c: Canvas, L: Line, k: number): void {
  if (k <= 0) return;
  const b = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });
  strike(c, b.x0 - 12, b.cy + 6, b.x1 + 12, b.cy - 6, k, { col: 'wrong' });
}

// ===================== the map rig: SetMap + named animated focus =====================
interface MapRig { M: SetMapBlock; draw(c: Canvas): void; regions(d?: number, dur?: number): void; jumpRegions(): void }
interface RigOpts { rings?: { at: Region; col: Paint }[]; arrows?: { from: number; to: number; col: Paint }[]; glow?: Record<number, Paint> }
function mapRig(pre: string, tokens: readonly Token[], o: RigOpts = {}): MapRig {
  const M = SetMap({ tokens }, MF, th);
  const P = progressOf<MapStep>(s => tr.k(`${pre}m.${s}`));
  const focus = (): MapFocus => ({
    rings: (o.rings ?? []).map((r, j) => ({ at: r.at, col: r.col, k: tr.k(`${pre}ring${j}`) })),
    arrows: (o.arrows ?? []).map((a, j) => ({ ...a, k: tr.k(`${pre}arr${j}`) })),
    glows: Object.entries(o.glow ?? {}).map(([i, col]) => ({ i: Number(i), col, k: tr.k(`${pre}glow${i}`) })),
    strikes: tokens.map((_, i) => ({ i, k: tr.k(`${pre}strike${i}`) })),
    fade: Object.fromEntries(tokens.map((_, i) => [i, tr.k(`${pre}fade${i}`)])),
  });
  const RS = ['real', 'rational', 'integer', 'whole', 'counting', 'irrational'];
  return {
    M, draw: c => M.draw(c, P, focus()),
    regions(d = 0, dur = 0.8) { RS.forEach((s, i) => tr.set(`${pre}m.${s}`, 1, dur, d + i * 0.25)); },
    jumpRegions() { RS.forEach(s => tr.jump(`${pre}m.${s}`, 1)); },
  };
}
const drop = (pre: string, i: number, d = 0, dur = 0.8) => tr.set(`${pre}m.t${i}`, 1, dur, d);

// ===================== 1. The question =====================
const CARDS = [
  { t: 'Always irrational', mc: MC.examplesProof as string | undefined, why: 'q.cb.always' },
  { t: 'Sometimes irrational', mc: undefined, why: 'q.cb.right' },
  { t: 'Never irrational', mc: undefined, why: 'q.cb.never' },
];
const QTOK: Token[] = [
  { tex: '\\sqrt{2}', x: sqrt(2) }, { tex: '\\pi', at: 'irrational' }, { tex: '\\sqrt{3}', x: sqrt(3) },
  { tex: '7', x: num(7) }, { tex: '0', x: num(0) }, { tex: '-4', x: num(-4) }, { tex: '\\frac{2}{3}', x: frac(2, 3) },
];
function partQuestion(): void {
  tr.reset('q.');
  const rig = mapRig('q.', QTOK, { rings: [{ at: 'irrational', col: 'pick' }] });
  const L1 = centred('q.L1', 'x,\\ y\\ \\text{irrational}', 200, 76);
  const L2 = centred('q.L2', 'x + y\\ \\text{irrational?}', 310, 76, undefined, 'pick');
  setScene({ model: rig.draw, lines: [L1, L2], leads: [] });
  rig.regions(0.2);
  QTOK.forEach((_, i) => drop('q.', i, 1.8 + i * 0.22));
  tr.set('q.ring0', 1, 0.6, 3.8); tr.set('q.L1', 1, 1.0, 3.6); tr.set('q.L2', 1, 1.0, 4.3);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Add two irrational numbers. Is the sum always, sometimes or never irrational?', board: 'x, y irrational: x + y irrational?', response: c.t, expected: 'Sometimes irrational', correct: c.t === 'Sometimes irrational', mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = cd.t.replace(' ', '<small>') + '</small>'; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'Two irrational numbers'),
    voiced('q.intro', `Every real number has a place on this map. ${R2}, ${R3} and π sit in <b class="b">Irrational</b>: their decimals never end and never repeat. Add two irrational numbers. Is the sum always irrational, sometimes, or never? Pick one, and say how sure you are.`),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn),
  );
}

// ===================== 2. Worked example =====================
// tokens: 0 √2, 1 −√2, 2 √3, 3 √2 + √3, 4 0, 5 2/3, 6 5/7, 7 29/21
const ETOK: Token[] = [
  { tex: '\\sqrt{2}', x: sqrt(2) }, { tex: '-\\sqrt{2}', x: neg(sqrt(2)) }, { tex: '\\sqrt{3}', x: sqrt(3) },
  { tex: '\\sqrt{2} + \\sqrt{3}', at: 'irrational' }, { tex: '0', x: add(sqrt(2), neg(sqrt(2))) },
  { tex: '\\frac{2}{3}', x: frac(2, 3) }, { tex: '\\frac{5}{7}', x: frac(5, 7) }, { tex: '\\frac{29}{21}', x: frac(29, 21) },
];
function partExample(): void {
  tr.reset('e.');
  const rig = mapRig('e.', ETOK, {
    rings: [{ at: 'irrational', col: 'pick' }, { at: 'irrational', col: 'wrong' }, { at: 'whole', col: 'link' }, { at: 'rational', col: 'link' }],
    arrows: [{ from: 0, to: 3, col: 'second' }, { from: 2, to: 3, col: 'second' }, { from: 0, to: 4, col: 'first' }, { from: 1, to: 4, col: 'first' }, { from: 5, to: 7, col: 'link' }, { from: 6, to: 7, col: 'link' }],
    glow: { 0: 'second', 1: 'first', 2: 'second', 4: 'first', 7: 'link' },
  });
  const lime = { col: 'link' as Paint };
  const L = {
    c1: centred('e.c1', 'x,\\ y\\ \\text{irrational}', 140, 70),
    c2: centred('e.c2', 'x + y\\ \\text{irrational?}', 230, 70, undefined, 'pick'),
    t1: centred('e.t1', '\\sqrt{2} + \\sqrt{3}\\ \\ \\text{irrational}', 370, 66),
    t2: centred('e.t2', '\\sqrt{2} + (-\\sqrt{2}) = \\cssId{z}{0}', 480, 70, { z: lime }),
    t3: centred('e.t3', '0\\ \\text{is rational}', 570, 66, undefined, 'first'),
    r1: centred('e.r1', '\\frac{2}{3} + \\frac{5}{7} = \\frac{14 + 15}{21} = \\frac{29}{21}', 720, 66),
    r2: centred('e.r2', '\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}', 870, 72, undefined, 'link'),
  };
  setScene({ model: rig.draw, lines: Object.values(L), leads: [], extra: c => strikeLine(c, L.c2, tr.k('e.strike')) });
  rig.jumpRegions(); tr.jump('e.c1', 1); tr.jump('e.c2', 1); tr.jump('e.ring0', 1);
  let step = 0;
  const STEPS = [
    { t: 'Place the numbers', why: 'Where do they sit?', act: 'Place them' },
    { t: 'Try some pairs', why: 'Do the sums stay irrational?', act: 'Try pairs' },
    { t: 'Hunt for a counterexample', why: 'One pair that leaves the region.', act: 'Hunt' },
    { t: 'Compare: the rationals', why: 'Why do they never leave?', act: 'Compare' },
  ];
  const SAY = [
    `${R2}, −${R2} and ${R3} are all irrational: none of them is a ratio of integers. They sit in the <b class="b">Irrational</b> region, beside Rational, never inside it.`,
    `${R2} + ${R3} stays irrational. So does ${R2} + ${R2}. Two pairs that work. But the claim says <b>every</b> pair: a few examples can never check infinitely many pairs.`,
    `Try opposites: ${R2} + (−${R2}) = <b class="a">0</b>. Both inputs are irrational, and 0 lands in <b class="s">Whole</b>, outside Irrational. One pair is enough: the irrationals are <b>not closed</b> under addition. The answer is <b class="s">sometimes</b>.`,
    `The rationals are different. Any two are ${fr('<i>a</i>', '<i>b</i>')} and ${fr('<i>c</i>', '<i>d</i>')} with integers, <i>b</i>, <i>d</i> ≠ 0. The sum is ${fr('<i>ad</i> + <i>bc</i>', '<i>bd</i>')}: integers over a nonzero integer, for <b>every</b> pair. Rational + rational is always rational: <b class="s">closed</b>.`,
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
        for (const t of [0, 1, 2]) { drop('e.', t, 0, 0.7); await wait(0.6); if (!alive()) return; }
        await wait(0.6);
      } else if (i === 1) {
        tr.set('e.glow0', 1, 0.4); tr.set('e.glow2', 1, 0.4); tr.set('e.arr0', 1, 0.9, 0.3); tr.set('e.arr1', 1, 0.9, 0.5); await wait(1.3); if (!alive()) return;
        drop('e.', 3, 0, 0.8); tr.set('e.t1', 1, 1.0, 0.4); await wait(1.6); if (!alive()) return;
        tr.set('e.arr0', 0, 0.5); tr.set('e.arr1', 0, 0.5); tr.set('e.glow0', 0, 0.5); tr.set('e.glow2', 0, 0.5);
      } else if (i === 2) {
        tr.set('e.t1:dim', 1, 0.5);
        tr.set('e.glow0', 1, 0.4); tr.set('e.glow1', 1, 0.4); tr.set('e.arr2', 1, 1.0, 0.3); tr.set('e.arr3', 1, 1.0, 0.5); await wait(1.4); if (!alive()) return;
        drop('e.', 4, 0, 0.8); tr.set('e.glow4', 1, 0.5, 0.4); tr.set('e.t2', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('e.ring2', 1, 0.5); tr.set('e.t3', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.ring0', 0, 0.5); tr.set('e.ring1', 1, 0.6); tr.set('e.strike', 1, 0.7, 0.5); await wait(1.4);
      } else {
        for (const k of ['e.arr2', 'e.arr3', 'e.glow0', 'e.glow1', 'e.glow4', 'e.ring1', 'e.ring2']) tr.set(k, 0, 0.5);
        tr.set('e.t2:dim', 1, 0.5); tr.set('e.t3:dim', 1, 0.5);
        drop('e.', 5, 0.2); drop('e.', 6, 0.5); await wait(1.4); if (!alive()) return;
        tr.set('e.arr4', 1, 0.9); tr.set('e.arr5', 1, 0.9, 0.2); await wait(1.0); if (!alive()) return;
        drop('e.', 7, 0, 0.8); tr.set('e.glow7', 1, 0.5, 0.4); tr.set('e.r1', 1, 1.2, 0.2); await wait(1.6); if (!alive()) return;
        tr.set('e.ring3', 1, 0.6); tr.set('e.r2', 1, 1.2, 0.3); await wait(1.6);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`, SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The claim said every pair. One allowed pair that fails is enough to break it.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined, say: 'Yes. An "always" claim needs every case; one valid counterexample settles it, however many examples worked.' },
      { t: '0 is a special case: it does not really count.', ok: false, id: 'e.why.exc', mc: MC.exception, say: 'Both inputs were irrational, so the pair is allowed. A claim about every pair has no exceptions.' },
      { t: 'Two pairs worked and only one failed, so it is mostly true.', ok: false, id: 'e.why.most', mc: MC.examplesProof, say: '"Mostly" is not "always". The claim is false: the sum is only sometimes irrational.' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does the one pair √2 + (−√2) settle it, when two pairs that worked did not?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'Quick check: why does one pair settle it, when two pairs that worked did not?', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'Four steps. Press each one: the map moves first, then the notation.', 'p', 'dim'), plan, sayBox, after);
}
function fr(n: string, d: string): string { return `<span class="fr"><span>${n}</span><span>${d}</span></span>`; }

// ===================== 3. Your turn: irrational × irrational =====================
// tokens: 0 √3, 1 √5, 2 √15 (√3·√5), 3 3 (√3·√3), 4 0 (not irrational)
const TTOK: Token[] = [
  { tex: '\\sqrt{3}', x: sqrt(3) }, { tex: '\\sqrt{5}', x: sqrt(5) }, { tex: '\\sqrt{15}', x: sqrt(15) }, { tex: '3', x: num(3) }, { tex: '0', x: num(0) },
];
function partTurn(): void {
  tr.reset('t.');
  const rig = mapRig('t.', TTOK, {
    rings: [{ at: 'irrational', col: 'pick' }, { at: 'whole', col: 'wrong' }, { at: 'irrational', col: 'wrong' }, { at: 'counting', col: 'link' }, { at: 'irrational', col: 'link' }],
    arrows: [{ from: 0, to: 2, col: 'second' }, { from: 1, to: 2, col: 'second' }, { from: 0, to: 3, col: 'first' }],
    glow: { 0: 'first', 2: 'second', 3: 'link', 4: 'wrong' },
  });
  const lime = { col: 'link' as Paint };
  const L = {
    c1: centred('t.c1', 'x,\\ y\\ \\text{irrational}', 140, 70),
    c2: centred('t.c2', 'x \\cdot y\\ \\text{irrational?}', 230, 70, undefined, 'pick'),
    a1: centred('t.a1', '\\sqrt{3} \\cdot \\sqrt{5} = \\sqrt{15}', 380, 68),
    a2: centred('t.a2', '\\sqrt{3} \\cdot \\sqrt{3} = \\,?', 500, 72),
    a3: centred('t.a3', '\\sqrt{3} \\cdot \\sqrt{3} = \\cssId{v}{3}', 500, 72, { v: lime }),
    a4: centred('t.a4', '(\\sqrt{3})^2 = 3', 600, 64, undefined, 'dim'),
    a5: centred('t.a5', '3\\ \\text{is rational}', 720, 70, undefined, 'link'),
  };
  setScene({ model: rig.draw, lines: Object.values(L), leads: [], extra: c => strikeLine(c, L.c2, tr.k('t.strike')) });
  rig.regions(0.1, 0.6);
  drop('t.', 0, 1.6); drop('t.', 1, 1.9); tr.set('t.c1', 1, 0.9, 2.2); tr.set('t.c2', 1, 0.9, 2.7); tr.set('t.ring0', 1, 0.6, 3.0);
  let step = 0;
  const STEPS = [
    { t: 'Place the numbers', why: `Done for you: ${R3} and ${R5} are irrational.` },
    { t: 'Try a pair', why: `Done for you: ${R3} · ${R5} = √15 stays inside.` },
    { t: 'Hunt for a counterexample', why: 'Your step.' },
    { t: 'Classify the result', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: multiply'), voiced('t.intro', `Now <b class="b">multiply</b> two irrational numbers. Is the product always irrational? The first two steps are done for you.`), plan, work);
  seq(async alive => {
    await wait(3.6); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.arr0', 1, 0.9); tr.set('t.arr1', 1, 0.9, 0.2); await wait(1.1); if (!alive()) return;
    drop('t.', 2, 0, 0.8); tr.set('t.a1', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return;
    tr.set('t.arr0', 0, 0.5); tr.set('t.arr1', 0, 0.5); tr.set('t.a1:dim', 1, 0.5);
    step = 2; drawPlan(); askPair();
  });
  function askPair(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: `${R3} · ${R3}`, ok: true, id: 't.pair.ok', mc: undefined as string | undefined, say: `Yes: both inputs are irrational. Let's see where the product lands.` },
      { t: `${R3} · ${R5}`, ok: false, id: 't.pair.in', mc: undefined as string | undefined, say: 'That one stays inside: √15 is irrational. A counterexample has to land outside.' },
      { t: `0 · ${R3}`, ok: false, id: 't.pair.zero', mc: MC.premise as string | undefined, say: '0 is rational, not irrational: the claim says nothing about this pair. Both inputs must be irrational.' },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.pair', prompt: 'Irrational × irrational: which pair could be a counterexample?', response: o.t.replace(/<[^>]+>/g, ''), expected: '√3 · √3', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      if (o.id === 't.pair.zero') seq(async alive => { drop('t.', 4, 0, 0.6); tr.set('t.glow4', 1, 0.4, 0.3); tr.set('t.ring1', 1, 0.5, 0.4); await wait(2.6); if (!alive()) return; tr.set('t.ring1', 0, 0.6); tr.set('t.glow4', 0, 0.6); tr.set('t.fade4', 1, 0.6, 0.3); });
      if (o.id === 't.pair.in') seq(async alive => { tr.set('t.glow2', 1, 0.4); tr.set('t.ring4', 1, 0.5); await wait(2.4); if (!alive()) return; tr.set('t.glow2', 0, 0.5); tr.set('t.ring4', 0, 0.5); });
      if (!o.ok) return;
      done = true;
      seq(async alive => { tr.set('t.glow0', 1, 0.4); tr.set('t.a2', 1, 1.0, 0.3); await wait(1.3); if (!alive()) return; askValue(); });
    })));
    work.replaceChildren(voiced('t.pair', 'Which pair could break the claim? Both inputs must be irrational, and the product must land outside Irrational.'), bx, fbHost);
  }
  function askValue(): void {
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.v.empty', false, 'Type a number first.')); return; }
      const v = r.v, right = v === 3;
      ctx.store.log({ part: 'turn', item: 'turn.value', prompt: '√3 · √3 = ?', board: '\\sqrt{3} \\cdot \\sqrt{3}', response: v, expected: 3, correct: right, mc: undefined });
      if (!right) {
        fbHost.replaceChildren(v === 9 ? voicedFb('t.v.nine', false, `${R3} is not 3. ${R3} is the positive number whose square is 3. So ${R3} · ${R3} = ?`)
          : Math.abs(v - 3) < 0.05 ? voicedFb('t.v.approx', false, 'Close, but use the exact meaning, not a calculator: the square of √3 is exactly 3.')
            : voicedFb('t.v.no', false, `${R3} is the number whose square is 3. What is ${R3} · ${R3}?`));
        return;
      }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.v.ok', true, `Yes: exactly <b class="s">3</b>, by the meaning of the square root.`));
      seq(async alive => {
        tr.set('t.a2', 0, 0.4); tr.set('t.a3', 1, 0.9, 0.2); tr.set('t.a4', 1, 0.9, 0.8);
        tr.set('t.arr2', 1, 0.9, 0.4); drop('t.', 3, 1.2, 0.8); tr.set('t.glow3', 1, 0.5, 1.6); await wait(2.4); if (!alive()) return;
        tr.set('t.ring0', 0, 0.5); tr.set('t.ring2', 1, 0.6); tr.set('t.ring3', 1, 0.6, 0.3); tr.set('t.strike', 1, 0.7, 0.6); await wait(1.4); if (!alive()) return;
        step = 3; drawPlan(); askSets();
      });
    }
    work.replaceChildren(voiced('t.v', `What is ${R3} · ${R3}, exactly?`), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askSets(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'Counting, whole, integers, rational and real numbers', ok: true, id: 't.sets.ok', mc: undefined as string | undefined, say: 'Yes: 3 sits in Counting, and every region around it holds it too.' },
      { t: 'Rational numbers only', ok: false, id: 't.sets.only', mc: MC.notNested as string | undefined, say: 'The sets are nested: 3 is a counting number, so it is whole, an integer, rational and real too.' },
      { t: 'Irrational: it came from square roots', ok: false, id: 't.sets.root', mc: MC.radicalIrr as string | undefined, say: 'Classify by the value: the product is exactly 3, wherever it came from.' },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.sets', prompt: 'Which sets is 3 in?', response: o.t, expected: opts[0]!.t, correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      if (!o.ok) return;
      done = true;
      seq(async alive => { tr.set('t.a5', 1, 1.0); await wait(1.2); if (!alive()) return; step = 4; drawPlan(); fbHost.append(callback()); });
    })));
    work.replaceChildren(voiced('t.sets', 'The product is 3. Which list names every set that 3 belongs to?'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const text: Record<string, string> = {
      'q.cb.right': 'At the start you picked "sometimes", and you were right. Now you can show why: one pair that lands outside is enough.',
      'q.cb.always': 'At the start you picked "always". Examples like √2 + √3 make it look that way, but √2 + (−√2) = 0 breaks it.',
      'q.cb.never': 'At the start you picked "never". But √2 + √3 is irrational: the answer is "sometimes".',
      'q.cb.none': 'Irrational numbers are not closed under addition or multiplication: one counterexample each shows it.',
    };
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, text[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: 3 + √2 is irrational =====================
// tokens: 0 3, 1 √2, 2 "3 + √2 ?" (supposed rational), 3 q − 3 (rational), 4 √2 forced into Rational (struck), 5 3 + √2 (irrational)
const PTOK: Token[] = [
  { tex: '3', x: num(3) }, { tex: '\\sqrt{2}', x: sqrt(2) }, { tex: 'q', at: 'rational' }, { tex: 'q - 3', at: 'rational' },
  { tex: '\\sqrt{2}', at: 'rational' }, { tex: '3 + \\sqrt{2}', x: add(num(3), sqrt(2)) },
];
function partProve(): void {
  tr.reset('p.');
  const rig = mapRig('p.', PTOK, {
    rings: [{ at: 'rational', col: 'pick' }, { at: 'rational', col: 'wrong' }, { at: 'irrational', col: 'link' }],
    arrows: [{ from: 2, to: 3, col: 'first' }, { from: 3, to: 4, col: 'wrong' }],
    glow: { 2: 'pick', 3: 'first', 4: 'wrong', 5: 'link' },
  });
  const L = {
    s1: centred('p.s1', '\\text{Suppose } 3 + \\sqrt{2} = q', 140, 68, undefined, 'pick'),
    s1b: centred('p.s1', 'q\\ \\text{rational}', 228, 66, undefined, 'pick'),
    s2: centred('p.s2', '\\sqrt{2} = q - 3', 345, 72),
    s3: centred('p.s3', 'q - 3\\ \\text{is rational}', 455, 70),
    s4: centred('p.s4', '\\sqrt{2}\\ \\text{rational?}\\ \\ \\times', 565, 70, undefined, 'wrong'),
    s5: centred('p.s5', '3 + \\sqrt{2}\\ \\text{is irrational}', 710, 70, undefined, 'link'),
  };
  setScene({ model: rig.draw, lines: Object.values(L), leads: [], extra: c => { strikeLine(c, L.s1, tr.k('p.strike')); strikeLine(c, L.s1b, tr.k('p.strike')); } });
  rig.regions(0.1, 0.6); drop('p.', 0, 1.6); drop('p.', 1, 1.9);
  const CHIPS = [
    { t: 'We assume the opposite, to test where it leads.', fits: 0 },
    { t: 'Subtract 3 from both sides (add the opposite of 3).', fits: 1 },
    { t: 'The rationals are closed under subtraction.', fits: 2 },
    { t: 'No number is both rational and irrational.', fits: 3 },
    { t: 'We know 3 + √2 is rational, so q exists.', fits: -1, mc: MC.assumption, id: 'p.no.assume', say: 'We do not know that: it is only supposed, to see where it leads. The supposition is what gets tested.' },
    { t: 'It works for q = 5, so q − 3 is rational.', fits: -1, mc: MC.examplesProof, id: 'p.no.example', say: 'One value of q proves nothing about every q. The reason is closure: rational minus rational is always rational.' },
    { t: 'q − 3 can be written as a fraction, so it is rational.', fits: -1, mc: MC.fracDisplay, id: 'p.no.bar', say: 'Any number can be written with a fraction bar (√2 over 1). Rational means integers over a nonzero integer; closure gives that here.' },
  ];
  const CLAIMS = [
    `Suppose <b>3 + ${R2} = <i>q</i></b> for some rational <i>q</i>,`,
    `then <b>${R2} = <i>q</i> − 3</b>,`,
    `and <b><i>q</i> − 3 is rational</b>,`,
    `so ${R2} would be rational, which is impossible. <b class="s">3 + ${R2} is irrational.</b>`,
  ];
  const SAYC = [
    'Right. An indirect proof starts by supposing the opposite and following it.',
    'Right. Subtract 3 from both sides: the 3 and the minus 3 are opposites, and they cancel.',
    'Right. Rational minus rational is always rational: the rationals are closed under subtraction.',
    'Right. Rational and irrational never overlap. The supposition led to something impossible, so it is false.',
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
    if (filled >= 4) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(ch.id ? voicedFb(ch.id, false, ch.say!) : voicedFb('p.no.other', false, 'True, but it is the reason for a different line. Which reason makes this line true?')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true, SAYC[n - 1]!));
    seq(async alive => {
      if (n === 1) { tr.set('p.s1', 1, 1.0); drop('p.', 2, 0.3); tr.set('p.ring0', 1, 0.6, 0.6); tr.set('p.glow2', 1, 0.5, 0.8); }
      if (n === 2) { tr.set('p.s2', 1, 1.0); drop('p.', 3, 0.6); tr.set('p.glow3', 1, 0.5, 1.2); }
      if (n === 3) { tr.set('p.s3', 1, 1.0); tr.set('p.ring0', 1, 0.3); tr.set('p.glow3', 1, 0.3); }
      if (n === 4) {
        drop('p.', 4, 0.3); tr.set('p.glow4', 1, 0.5, 1.0); tr.set('p.s4', 1, 1.0, 0.6); await wait(1.8); if (!alive()) return;
        tr.set('p.ring0', 0, 0.4); tr.set('p.ring1', 1, 0.6); tr.set('p.strike4', 1, 0.6, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('p.strike', 1, 0.7); for (const k of [2, 3, 4]) tr.set(`p.fade${k}`, 1, 0.8, 0.6); tr.set('p.arr0', 0, 0.6); tr.set('p.arr1', 0, 0.6); tr.set('p.ring1', 0, 0.6, 0.6); await wait(1.6); if (!alive()) return;
        drop('p.', 5, 0, 0.9); tr.set('p.glow5', 1, 0.5, 0.6); tr.set('p.ring2', 1, 0.6, 0.6); tr.set('p.s5', 1, 1.0, 0.6); await wait(1.8); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true, 'That is an indirect proof: suppose the opposite, follow it to something impossible, conclude the opposite is false. Sam was wrong: no digits need checking.'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: 3 + √2 might be rational, nobody has checked all its digits. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.ratPlusIrr : undefined });
    proofHost.replaceChildren(
      right ? voiced('p.test', 'Let’s test it. Build the argument, and see where it leads.') : voiced('p.build', 'Now prove it. Fill each “because” with the reason that makes the line true.'),
      chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'),
    voiced('p.intro', `Sam says: <b>3 + ${R2}</b> might be rational. Nobody has checked all of its digits. Is Sam right?`),
    h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as NPItem),
  });
}
/** board rows for the item's TeX: a long list breaks at its commas */
function boardLines(src: string, y0: number): Line[] {
  const parts = src.split(',\\ \\ ');
  const rows: string[] = [];
  let cur = '';
  for (const p of parts) {
    const t = cur ? `${cur},\\ \\ ${p}` : p;
    if (cur && texWidth(tex(t) as Formula, 66) > BOARD_W) { rows.push(cur + ','); cur = p; } else cur = t;
  }
  rows.push(cur);
  return rows.map((r, i) => centred('x.B', r, y0 + i * 120, 76));
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
function showItem(item: NPItem): Solve {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.map) {
    const m = pic.map, rv = m.reveal ?? {};
    const toks: Token[] = [...m.tokens, ...(rv.tokens ?? [])].map(t => ({ tex: t.tex, at: t.at }));
    const rings: { at: Region; col: Paint }[] = [];
    if (m.ring) rings.push({ at: m.ring, col: 'pick' });
    if (rv.ring) rings.push({ at: rv.ring, col: rv.bad ? 'wrong' : 'link' });
    const made = tryBlock(() => mapRig('x.', toks, { rings, arrows: (rv.arrows ?? []).map(([from, to]) => ({ from, to, col: (rv.bad ? 'first' : 'link') as Paint })), glow: Object.fromEntries((rv.tokens ?? []).map((_, j) => [m.tokens.length + j, (rv.bad && j === (rv.tokens!.length - 1) ? 'wrong' : 'link') as Paint])) }));
    if (made.ok) {
      const rig = made.value;
      setScene({ model: rig.draw, lines: boardLines(item.board, 200), leads: [] });
      rig.regions(0, 0.5);
      m.tokens.forEach((_, i) => drop('x.', i, 1.0 + i * 0.15, 0.6));
      if (m.ring) tr.set('x.ring0', 1, 0.5, 1.2);
      tr.set('x.B', 1, 0.8, 0.4);
      return {
        solve: async alive => {
          const arrows = rv.arrows ?? [];
          const n0 = m.tokens.length, nr = (rv.tokens ?? []).length;
          const results = new Set(arrows.map(a => a[1]));
          // inputs first, then the arrows, then the result(s)
          for (let j = 0; j < nr; j++) { const i = n0 + j; if (results.has(i)) continue; drop('x.', i, 0, 0.6); await wait(0.35); if (!alive()) return; }
          arrows.forEach((_, j) => tr.set(`x.arr${j}`, 1, 0.8, 0.2 * j));
          if (arrows.length) { await wait(1.0); if (!alive()) return; }
          for (const i of results) { drop('x.', i, 0, 0.7); tr.set(`x.glow${i}`, 1, 0.4, 0.5); }
          await wait(0.9); if (!alive()) return;
          if (rv.ring) { if (m.ring && rv.bad) tr.set('x.ring0', 0, 0.4); tr.set(`x.ring${m.ring ? 1 : 0}`, 1, 0.6); }
        },
      };
    }
  }
  if (pic?.claim) {
    const cp = pic.claim, rv = cp.reveal ?? {};
    const start: ClaimRow[] = cp.rows.map(r => ({ vals: r.vals, left: r.left, right: r.right, ok: r.ok }));
    const made0 = tryBlock(() => ClaimTable({ left: cp.left, right: cp.right, vars: cp.vars, scope: cp.scope, rows: start }, CLAIM_FRAME, th));
    const full: ClaimRow[] = rv.rows ?? start;
    const made1 = tryBlock(() => ClaimTable({ left: cp.left, right: cp.right, vars: cp.vars, scope: cp.scope, rows: full }, CLAIM_FRAME, th));
    if (made0.ok && made1.ok) {
      let T = made0.value;
      const P = progressOf<string>(s => tr.k('x.c.' + s));
      setScene({ model: c => T.draw(c, P as never), lines: [], leads: [], boardBox: null });
      tr.set('x.c.claim', 1, 0.8, 0.1); tr.set('x.c.head', 1, 0.7, 0.5);
      start.forEach((r, i) => { tr.set(`x.c.r${i}`, 1, 0.6, 0.9 + i * 0.25); if (r.left !== undefined) { tr.set(`x.c.v${i}`, 1, 0.6, 1.1 + i * 0.25); tr.set(`x.c.m${i}`, 1, 0.5, 1.3 + i * 0.25); } });
      // a wide board to the right: the item's question in TeX is the claim itself, so the board shows the table's verdict
      return {
        solve: rv.rows || rv.strike ? async alive => {
          if (rv.rows) {
            T = made1.value;
            for (let i = 0; i < full.length; i++) {
              const old = start[i];
              const sameVals = old && old.vals.join('|') === full[i]!.vals.join('|');
              if (!sameVals) { tr.set(`x.c.r${i}`, 0, 0.01); tr.set(`x.c.r${i}`, 1, 0.6, 0.05); await wait(0.5); if (!alive()) return; }
              if (!old || old.left === undefined) { tr.set(`x.c.v${i}`, 1, 0.7); await wait(0.7); if (!alive()) return; tr.set(`x.c.m${i}`, 1, 0.5); await wait(0.5); if (!alive()) return; }
            }
          }
          if (rv.strike) tr.set('x.c.strike', 1, 0.7, 0.2);
        } : undefined,
      };
    }
  }
  if (pic?.area) {
    const a = pic.area, g = a.given, rv = a.reveal;
    const made = tryBlock(() => AreaSplit({ a: rv.a, b: rv.b, c: rv.c, ab: rv.ab, ac: rv.ac, op: a.op, wb: a.wb, wc: a.wc }, MF, th));
    if (made.ok) {
      const A = made.value, labelsFirst = g.a !== undefined;
      const P = progressOf<AreaStep>(s => tr.k('x.a.' + s));
      setScene({ model: c => A.draw(c, P), lines: boardLines(item.board, 220), leads: [] });
      tr.set('x.a.rect', 1, 0.8, 0.1); tr.set('x.a.split', 1, 0.9, 0.6); tr.set(labelsFirst ? 'x.a.labels' : 'x.a.areas', 1, 0.8, 1.2); tr.set('x.B', 1, 0.8, 0.4);
      return {
        solve: async alive => {
          tr.set(labelsFirst ? 'x.a.areas' : 'x.a.labels', 1, 0.9); await wait(1.0); if (!alive()) return;
          if (a.op === '-') tr.set('x.a.cut', 1, 0.8);
        },
      };
    }
  }
  if (pic?.chain) {
    const ch = pic.chain;
    const wide = box(200, 90, 1720, 990);
    const Fs = ch.lines.map((s, i) => tex(i === 0 ? s : `= ${s}`) as Formula);
    const size = Math.min(70, Math.floor(...[(wide.w - 360) / Math.max(...Fs.map(F => texWidth(F, 1)))]));
    const gap = Math.min(140, (wide.h - 100) / ch.lines.length);
    const x0 = wide.x0 + 260;
    setScene({
      model: c => {
        slate(c, wide, tr.k('x.slate'));
        ch.lines.forEach((_, i) => {
          const y = wide.y0 + 90 + i * gap, k = tr.k(`x.l${i}`);
          if (k <= 0) return;
          const hot = ch.ask !== undefined && (i === ch.ask || i === ch.ask - 1);
          if (i > 0) drawWords(c, `step ${i}`, wide.x0 + 60, y, ch.ask === i ? 'pick' : 'faint', k, { size: 44 });
          texDraw(c, Fs[i]!, x0 + (i === 0 ? texWidth(tex('= ') as Formula, size) : 0), y, { size, align: 'left', k, col: hot ? 'pick' : 'ink' });
        });
      },
      lines: [], leads: [], boardBox: null,
    });
    tr.set('x.slate', 1, 0.5);
    ch.lines.forEach((_, i) => tr.set(`x.l${i}`, 1, 0.6, 0.3 + i * 0.25));
    return {};
  }
  const big = box(260, 230, 1660, 790);
  setScene({ lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void bump;
void runLesson({
  slug: SLUG,
  warm: ['\\sqrt{2} + (-\\sqrt{2}) = 0 \\ \\frac{ad + bc}{bd} \\ \\pi \\ \\overline{6} \\ \\overset{?}{=} \\checkmark \\times \\cdot \\div', '\\text{Suppose irrational rational}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
