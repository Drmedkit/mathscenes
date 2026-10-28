// counterexamples-and-proof.ts: "Counterexamples, inference and proof" (Geometry, lesson 3) on the shared runtime.
//   1 The question   Lena checks n² + n + 41 for n = 0..5: all prime. Is "for every whole number n" proved?
//                    (proved = examples-as-proof; not proved = right; false because too few checks = failed-argument
//                    -as-disproof) + how sure. A value table with the six checks.
//   2 Worked example the sum of two even integers is even: an example in dots (4 + 6, five pairs) is one case only ->
//                    name any even integer (2m, m an integer; the other gets its own letter, 2n) -> join the pairs
//                    (2(m + n)) -> conclude (m + n is an integer), in the course's proof frame beside the dots;
//                    why two letters?
//   3 Your turn      the sum of two odd integers is even, faded: the student writes line 1 (two letters, declared
//                    integers), line 3 (2(m + n + 1): the two extra dots pair up) and the reason of line 5. Callback:
//                    n = 40 gives 1681 = 41 × 41.
//   4 Prove it       Mateo's "n is even if and only if n + 1 is odd" with one direction proved: proved? Then the other
//                    direction in the proof frame (Parsons with two decoys, then the reason menu); the Euler picture
//                    shows the two regions as one.
//   5 Practice       all 15 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/counterexamples-and-proof/script.ts -> voice/lines.json. Every answer is logged.
import type { Canvas } from '../../src/core/draw';
import { box, type Box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import type { Paint } from '../../src/core/theme';
import { type Frame, frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import { Euler, type EulerStep } from '../../src/lesson/topics/conditional-statements/Euler';
import { CaseTable, type CaseStep } from '../../src/lesson/topics/conditional-statements/CaseTable';
import { ProofFrame, type ProofStep } from '../../src/lesson/topics/geometry-foundations/ProofFrame';
import { proofPanel } from '../../src/lesson/topics/geometry-foundations/proofPanel';
import { drawFig, sheet } from '../../src/lesson/topics/geometry-foundations/GeoFig';
import { FR_LEFT } from '../../src/lesson/topics/geometry-foundations/geo';
import { cardPainter } from '../../src/lesson/topics/geometry-foundations/Card';
import { Pairs, type PairsParams, type PairsStep } from '../../src/lesson/topics/counterexamples-and-proof/Pairs';
import { Nest, type NestStep } from '../../src/lesson/topics/counterexamples-and-proof/Nest';
import { CARD_TOP, frameOf } from '../../src/lesson/topics/counterexamples-and-proof/kit';
import { FAMILY_NAMES, GENERATORS, MC, type CPItem } from '../../src/lesson/topics/counterexamples-and-proof/items';
import { PLAN } from '../../src/lesson/topics/counterexamples-and-proof/plan';
import { explain } from '../../src/lesson/topics/counterexamples-and-proof/explain';
import { SCRIPT } from '../../src/lesson/topics/counterexamples-and-proof/script';
import LINES from './counterexamples-and-proof/voice/lines.json';

const SLUG = 'counterexamples-and-proof';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = '', extra = ''): HTMLElement {
  const s = SCRIPT[id];
  if (!s) throw new Error(`no script line ${id}`);
  if (!(id in LINES)) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, s.html + extra);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]!.html); }
const plainOf = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<');
const K = (key: string) => tr.k(key);
const pfSteps = (pre: string) => progressOf<ProofStep>(s => tr.k(`${pre}pf.${s}`));
const pf = (pre: string, s: string, to = 1, d = 0.8, delay = 0) => tr.set(`${pre}pf.${s}`, to, d, delay);
const paSteps = (key: string) => progressOf<PairsStep>(s => tr.k(`${key}.${s}`));

/** a one-shot choice question in the panel: logs, gives feedback, runs `after` on the right one */
function ask(part: 'turn' | 'prove' | 'example', item: string, prompt: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], after: () => void): HTMLElement {
  const bx = h('div', { class: 'opts' }), fbHost = h('div');
  let done = false;
  opts.forEach((o, k) => bx.append(btn(o.t, () => {
    if (done) return;
    bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
    ctx.store.log({ part, item, prompt, response: plainOf(o.t), expected: plainOf(opts.find(x => x.ok)!.t), correct: o.ok, mc: o.mc });
    fbHost.replaceChildren(voicedFb(o.id, o.ok));
    if (o.ok) { done = true; after(); }
  })));
  return h('div', {}, bx, fbHost);
}
function centred(key: string, src: string, y: number, size: number, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BOARD_W) s -= 2;
  if (texWidth(F, s) > BOARD_W + 40) console.warn('board line too wide:', src);
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: BOARD.cx - b.cx, y, size: s, col };
}

// ===================== 1. The question =====================
const CARDS = [
  { name: 'Proved', t: 'every check worked', mc: MC.examples as string | undefined, cb: 'q.cb.proved', right: false },
  { name: 'Not yet', t: 'checks cover only those n', mc: undefined as string | undefined, cb: 'q.cb.notyet', right: true },
  { name: 'False', t: 'six checks are too few', mc: MC.failedDisproof as string | undefined, cb: 'q.cb.false', right: false },
];
const Q_ROWS = [0, 1, 2, 3, 4, 5].map(x => [String(x), String(x * x + x + 41), 'T']);
function partQuestion(): void {
  tr.reset('q.');
  const T = CaseTable({ head: ['n', 'n^2 + n + 41', '\\text{prime?}'], headCol: ['dim', 'dim', 'second'], rows: Q_ROWS, keys: 2 }, frame(60, 90, 1120, 900), th);
  const TP = progressOf<CaseStep>(s => K(`q.tb.${s}`));
  const L = [
    centred('q.L1', 'n^2 + n + 41', 240, 76),
    centred('q.L2', '\\text{prime for}', 400, 66, 'second'),
    centred('q.L3', '\\text{every } n\\,?', 500, 70, 'wrong'),
  ];
  setScene({ model: c => T.draw(c, TP), lines: L, leads: [] });
  tr.set('q.tb.head', 1, 0.8, 0.2);
  Q_ROWS.forEach((_, i) => tr.set(`q.tb.r${i}`, 1, 0.6, 0.8 + 0.35 * i));
  tr.set('q.tb.c2', 1, 1.6, 3.0);
  tr.set('q.L1', 1, 1.0, 0.6); tr.set('q.L2', 1, 0.9, 3.6); tr.set('q.L3', 1, 0.9, 4.2);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Lena checked n² + n + 41 for n = 0 to 5: all prime. Is "for every whole number n, n² + n + 41 is prime" proved?', response: `${c.name}: ${c.t}`, expected: 'Not yet', correct: c.right, mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.name}<small>${cd.t}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Is it proved?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== the dots + proof layout of parts 2 and 3 =====================
const DOTS_TOP: Frame = { x: 40, y: 80, w: 760, h: 400 };
const DOTS_LOW: Frame = { x: 40, y: 520, w: 760, h: 480 };
const DOTS_ONE: Frame = { x: 40, y: 200, w: 760, h: 560 };
const PROOF_FR: Frame = { x: 820, y: 70, w: 1060, h: 940 };
const E_ROWS = [
  { st: 'a = 2m,\\ b = 2n', rs: 'Definition of even integer' },
  { st: 'a + b = 2m + 2n', rs: 'Substitution Property of Equality' },
  { st: 'a + b = 2(m + n)', rs: 'Distributive Property' },
  { st: 'm + n\\ \\text{is an integer}', rs: 'Integers are closed under addition' },
  { st: 'a + b\\ \\text{is even}', rs: 'Definition of even integer' },
];
const E_CONCRETE: PairsParams = { groups: [{ pairs: 2, col: 'first', label: '4' }, { pairs: 3, col: 'second', label: '6' }], total: '10 = 5\\ \\text{pairs}', title: 'one example: 4 + 6' };
const E_GENERAL: PairsParams = { groups: [{ pairs: 'm', col: 'first', label: 'a = 2m' }, { pairs: 'n', col: 'second', label: 'b = 2n' }], total: 'a + b = 2(m + n)', title: 'any two even integers' };

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const P1 = Pairs(E_CONCRETE, DOTS_TOP, th), P2 = Pairs(E_GENERAL, DOTS_LOW, th);
  const PF = ProofFrame({ given: ['a, b\\ \\text{even integers}'], prove: 'a + b\\ \\text{is even}', rows: E_ROWS, stCol: [undefined, undefined, undefined, undefined, 'link'] }, PROOF_FR, th);
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => { P1.draw(c, paSteps('e.c')); P2.draw(c, paSteps('e.g')); PF.draw(c, pfSteps('e.')); },
  });
  tr.set('e.c.g0', 1, 0.8, 0.3); tr.set('e.c.g1', 1, 0.8, 0.8); tr.set('e.c.brace', 1, 0.7, 1.4);
  pf('e.', 'frame', 1, 0.8, 0.6);
  let step = 0;
  const STEPS = [
    { t: 'Try an example', why: 'Does one case prove it?', act: 'Try 4 + 6' },
    { t: 'Name any even integer', why: 'A letter for every case.', act: 'Name them' },
    { t: 'Join the pairs', why: 'Add and regroup.', act: 'Join' },
    { t: 'Conclude', why: 'What does it cover?', act: 'Conclude' },
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
        tr.set('e.c.join', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('e.c.total', 1, 0.8); await wait(1.0);
      } else if (i === 1) {
        tr.set('e.g.g0', 1, 0.8); tr.set('e.g.g1', 1, 0.8, 0.4); tr.set('e.g.brace', 1, 0.8, 1.0); await wait(2.0); if (!alive()) return;
        pf('e.', 's0', 1, 0.9); pf('e.', 'r0', 1, 0.8, 0.6); await wait(1.4);
      } else if (i === 2) {
        tr.set('e.g.join', 1, 1.8); await wait(1.9); if (!alive()) return;
        tr.set('e.g.total', 1, 0.8); pf('e.', 's1', 1, 0.9, 0.2); pf('e.', 'r1', 1, 0.8, 0.6); await wait(1.4); if (!alive()) return;
        pf('e.', 's2', 1, 0.9); pf('e.', 'r2', 1, 0.8, 0.5); await wait(1.3);
      } else {
        pf('e.', 's3', 1, 0.9); pf('e.', 'r3', 1, 0.8, 0.5); await wait(1.4); if (!alive()) return;
        pf('e.', 's4', 1, 0.9); pf('e.', 'r4', 1, 0.8, 0.5); await wait(1.3);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The two even numbers can be different; one letter would make them equal.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'No reason: 2m + 2m would prove the same thing.', ok: false, id: 'e.why.one', mc: MC.oneLetter as string | undefined },
      { t: 'Because n is for negative numbers and m for positive ones.', ok: false, id: 'e.why.int', mc: undefined as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why two letters, m and n, for the two even integers?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn =====================
const T_ROWS = [
  { st: 'a = 2m + 1,\\ b = 2n + 1', rs: 'Definition of odd integer' },
  { st: 'a + b = 2m + 2n + 2', rs: 'Substitution Property of Equality' },
  { st: 'a + b = 2(m + n + 1)', rs: 'Distributive Property' },
  { st: 'm + n + 1\\ \\text{is an integer}', rs: 'Integers are closed under addition' },
  { st: 'a + b\\ \\text{is even}', rs: 'Definition of even integer' },
];
const T_GENERAL: PairsParams = { groups: [{ pairs: 'm', extra: true, col: 'first', label: 'a = 2m + 1' }, { pairs: 'n', extra: true, col: 'second', label: 'b = 2n + 1' }], total: 'a + b = 2(m + n + 1)', title: 'any two odd integers' };
function partTurn(): void {
  tr.reset('t.');
  const P = Pairs(T_GENERAL, DOTS_ONE, th);
  const PF = ProofFrame({ given: ['a, b\\ \\text{odd integers}'], prove: 'a + b\\ \\text{is even}', rows: T_ROWS, stCol: [undefined, undefined, undefined, undefined, 'link'] }, PROOF_FR, th);
  const asks = () => [...(K('t.ask0') > 0.5 ? [{ i: 0, cell: 'st' as const }] : []), ...(K('t.ask2') > 0.5 ? [{ i: 2, cell: 'st' as const }] : []), ...(K('t.ask4') > 0.5 ? [{ i: 4, cell: 'rs' as const }] : [])];
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => { P.draw(c, paSteps('t.d'), { extra: K('t.extra') }); PF.draw(c, pfSteps('t.'), { ask: asks() }); },
  });
  pf('t.', 'frame', 1, 0.8, 0.2);
  tr.set('t.ask0', 1, 0.1, 0.6); tr.set('t.ask2', 1, 0.1, 0.6); tr.set('t.ask4', 1, 0.1, 0.6);
  let step = 0;
  const STEPS = [
    { t: 'Name two odd integers', why: 'Your step.' },
    { t: 'Regroup into pairs', why: 'Your step.' },
    { t: 'The reason for the conclusion', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: odd plus odd'), voiced('t.intro'), plan, work);
  seq(async alive => { await wait(2.4); if (!alive()) return; askRep(); });
  const i = (s: string) => `<i>${s}</i>`;
  function askRep(): void {
    work.replaceChildren(voiced('t.rep'), ask('turn', 'turn.represent', 'Line 1: two odd integers that can be any odd integers', [
      { t: `${i('a')} = 2${i('m')} + 1, ${i('b')} = 2${i('m')} + 1 (${i('m')} an integer)`, ok: false, id: 't.rep.one', mc: MC.oneLetter },
      { t: `${i('a')} = 2${i('m')} + 1, ${i('b')} = 2${i('n')} + 1 (${i('m')}, ${i('n')} integers)`, ok: true, id: 't.rep.ok' },
      { t: `${i('a')} = 3, ${i('b')} = 5`, ok: false, id: 't.rep.num', mc: MC.numbersInside },
      { t: `${i('a')} = 2${i('m')} + 1, ${i('b')} = 2${i('n')} + 1 (${i('m')}, ${i('n')} any numbers)`, ok: false, id: 't.rep.any', mc: MC.varIncomplete },
    ], () => seq(async alive => {
      tr.set('t.ask0', 0, 0.2); pf('t.', 's0', 1, 0.9); pf('t.', 'r0', 1, 0.8, 0.4);
      tr.set('t.d.g0', 1, 0.8, 0.3); tr.set('t.d.g1', 1, 0.8, 0.7); tr.set('t.d.brace', 1, 0.8, 1.2); await wait(2.4); if (!alive()) return;
      pf('t.', 's1', 1, 0.9); pf('t.', 'r1', 1, 0.8, 0.4); await wait(1.4); if (!alive()) return;
      step = 1; drawPlan(); askFac();
    })));
  }
  function askFac(): void {
    work.replaceChildren(voiced('t.fac'), ask('turn', 'turn.factor', 'Line 3: 2m + 2n + 2 as 2 times something', [
      { t: `${i('a')} + ${i('b')} = 2(${i('m')} + ${i('n')}) + 1`, ok: false, id: 't.fac.drop' },
      { t: `${i('a')} + ${i('b')} = 2(${i('m')} + ${i('n')} + 1)`, ok: true, id: 't.fac.ok' },
      { t: `${i('a')} + ${i('b')} = 2(${i('m')} + ${i('n')})`, ok: false, id: 't.fac.mult' },
    ], () => seq(async alive => {
      tr.set('t.ask2', 0, 0.2);
      tr.set('t.d.join', 1, 1.8); tr.set('t.extra', 1, 0.6, 1.2); await wait(2.0); if (!alive()) return;
      tr.set('t.d.total', 1, 0.8); pf('t.', 's2', 1, 0.9); pf('t.', 'r2', 1, 0.8, 0.4); await wait(1.4); if (!alive()) return;
      pf('t.', 's3', 1, 0.9); pf('t.', 'r3', 1, 0.8, 0.4); pf('t.', 's4', 1, 0.9, 0.8); await wait(1.8); if (!alive()) return;
      step = 2; drawPlan(); askRs();
    })));
  }
  function askRs(): void {
    work.replaceChildren(voiced('t.rs'), ask('turn', 'turn.reason', 'Reason for line 5: a + b is even', [
      { t: 'Checked: 3 + 5 = 8 is even', ok: false, id: 't.rs.num', mc: MC.numbersInside },
      { t: 'Definition of odd integer', ok: false, id: 't.rs.odd' },
      { t: 'Definition of even integer', ok: true, id: 't.rs.ok' },
      { t: 'The sum of two odd integers is even', ok: false, id: 't.rs.circ', mc: MC.circular },
    ], () => seq(async alive => {
      tr.set('t.ask4', 0, 0.2); pf('t.', 'r4', 1, 0.8); await wait(1.4); if (!alive()) return;
      step = 3; drawPlan(); work.append(callback());
    })));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.cb : 'q.cb.none', 'p', '', cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : ''), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it =====================
const P_LINES = [
  { st: '<i>n</i> + 1 is odd', tex: 'n + 1\\ \\text{is odd}', rs: 'Given', uses: [] as number[] },
  { st: '<i>n</i> + 1 = 2<i>k</i> + 1 (<i>k</i> an integer)', tex: 'n + 1 = 2k + 1', rs: 'Definition of odd integer', uses: [1] },
  { st: '<i>n</i> = 2<i>k</i>', tex: 'n = 2k', rs: 'Subtraction Property of Equality', uses: [2] },
  { st: '<i>n</i> is even', tex: 'n\\ \\text{is even}', rs: 'Definition of even integer', uses: [3] },
];
const P_DECOYS = [
  { st: '<i>n</i> + 1 = 2<i>n</i> + 1', why: 'n already names the number; the number of pairs needs its own letter, k.', mc: MC.oneLetter },
  { st: '<i>n</i> = 4', why: 'one value is an example; the proof must work for every n.', mc: MC.numbersInside },
];
const P_MENU = [
  { t: 'Given' }, { t: 'Definition of odd integer' }, { t: 'Definition of even integer' }, { t: 'Subtraction Property of Equality' },
  { t: 'Checked with n = 3', mc: MC.numbersInside, why: 'A check with one number is an example, not a reason.' },
  { t: 'Mateo’s direction, read backward', mc: MC.converse, why: 'The direction Mateo proved does not run backward on its own: that is exactly what this proof has to show.' },
];
const P_FR: Frame = { x: 40, y: 70, w: 640, h: 940 };
const P_RIGHT: Frame = { x: 700, y: 70, w: 1180, h: 940 };
const P_XS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
function partProve(): void {
  tr.reset('p.');
  const E = Euler({ layout: 'same', domain: 'n = 1 to 10', P: 'n even', Q: 'n + 1 odd', tokens: P_XS.map(v => ({ tex: String(v), zone: v % 2 === 0 ? 'pq' : 'o' })) }, P_FR, th);
  const EP = progressOf<EulerStep>(s => K(`p.eu.${s}`));
  const placed: number[] = [], reasons: string[] = [];
  const RES = P_LINES.map(l => l.tex);
  const mk = () => ProofFrame({ given: ['n + 1\\ \\text{is odd}'], prove: 'n\\ \\text{is even}', rows: P_LINES.map((_, k) => ({ st: placed[k] ? P_LINES[placed[k]! - 1]!.tex : '', rs: reasons[k] ?? '' })), reserve: RES, reserveRs: P_MENU.map(m => m.t) }, P_RIGHT, th);
  let PF = mk();
  setScene({ boardBox: null, lines: [], leads: [], model: c => { E.draw(c, EP, { pulseP: K('p.pulse'), pulseQ: K('p.pulse') }); PF.draw(c, pfSteps('p.')); } });
  tr.set('p.eu.domain', 1, 0.6); tr.set('p.eu.tokens', 1, 1.2, 0.3);
  const host = h('div'), fbHost = h('div');
  const yes = btn('Proved', () => judge(true)), no = btn('Not yet', () => judge(false));
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Mateo proved "if n is even, then n + 1 is odd". Is "n is even if and only if n + 1 is odd" proved?', response: right ? 'proved' : 'not yet', expected: 'not yet', correct: !right, mc: right ? MC.iffOne : undefined });
    pf('p.', 'frame', 1, 0.8);
    const panel = proofPanel({
      lines: P_LINES.map(l => ({ st: l.st, rs: l.rs, uses: l.uses })),
      decoys: P_DECOYS, menu: P_MENU, order: [2, 4, 0, 5, 3, 1],
      say: { order: 'Tap the lines in an order that works (two are decoys).', reasons: 'Now pick the reason for each line, top to bottom.' },
      onPlace(line, pos) {
        placed[pos] = line; PF = mk(); pf('p.', `s${pos}`, 1, 0.8);
        ctx.store.log({ part: 'prove', item: `prove.order${pos + 1}`, prompt: `Line ${pos + 1} of the proof`, response: plainOf(P_LINES[line - 1]!.st), correct: true });
        if (placed.length === P_LINES.length) fbHost.replaceChildren(voicedFb('p.order-done', true));
      },
      onReason(pos, _line, reason) {
        reasons[pos] = reason; PF = mk(); pf('p.', `r${pos}`, 1, 0.7);
        ctx.store.log({ part: 'prove', item: `prove.reason${pos + 1}`, prompt: `Reason for line ${pos + 1}`, response: reason, correct: true });
        fbHost.replaceChildren();
      },
      onWrong(e) {
        ctx.store.log({ part: 'prove', item: `prove.${e.phase}`, prompt: e.prompt, response: e.response, correct: false, mc: e.mc });
        void ctx.say('p.wrong');
      },
      onDone() {
        seq(async alive => {
          tr.set('p.eu.P', 1, 0.9); tr.set('p.eu.Q', 1, 0.9, 0.5); tr.set('p.eu.sort', 1, 2.0, 1.2); await wait(3.4); if (!alive()) return;
          tr.set('p.pulse', 1, 0.4); await wait(1.0); if (!alive()) return; tr.set('p.pulse', 0, 0.6);
          fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        });
      },
    });
    host.replaceChildren(voiced(right ? 'p.build-test' : 'p.build'), panel.node, fbHost);
  }
  setPanel(h('h2', {}, 'Prove it'), voiced('p.intro'), h('div', { class: 'row' }, yes, no), host);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as CPItem),
  });
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
const fr2box = (f: Frame): Box => box(f.x, f.y, f.x + f.w, f.y + f.h);
function showItem(item: CPItem): Solve {
  tr.reset('x.');
  const p = item.picture ?? {};
  const draws: ((c: Canvas) => void)[] = [];
  const start: (() => void)[] = [], solve: (() => void)[] = [];
  const F = frameOf(p);
  if (p.card) {
    const b = Object.keys(p).some(k => k !== 'card') ? box(CARD_TOP.x0, CARD_TOP.y0, CARD_TOP.x1, CARD_TOP.y1) : box(190, 140, 1730, 940);
    const C = cardPainter([...p.card.lines, ...(p.card.reveal ?? [])], b, { nFirst: p.card.lines.length, size: Object.keys(p).length > 1 ? 46 : 52 });
    if (!C.fits) console.warn('card does not fit', item.family);
    draws.push(c => C.draw(c, K('x.card'), K('x.lines')));
    start.push(() => tr.set('x.card', 1, 0.6, 0.1));
    solve.push(() => tr.set('x.lines', 1, 0.9, 0.3));
  }
  if (p.table) {
    const t = p.table;
    const w = Math.min(F.w, 240 * t.head.length + 80), hh = Math.min(F.h, 130 + t.rows.length * 112 + 20);
    const made = tryBlock(() => CaseTable({ head: t.head, headCol: t.headCol, rows: t.rows, keys: t.keys }, frame(F.x + F.w / 2 - w / 2, F.y + Math.max(0, (F.h - hh) / 2), w, hh), th));
    if (made.ok) {
      const T = made.value, P = progressOf<CaseStep>(s => K('x.t.' + s));
      const rings = () => [...(t.ring !== undefined ? [{ i: t.ring, col: 'pick' as Paint, k: K('x.ring') }] : []), ...(t.reveal.rings ?? []).map(([i, col], j) => ({ i, col, k: K(`x.rr${j}`) }))];
      draws.push(c => T.draw(c, P, { rings: rings(), ask: t.ask }));
      start.push(() => {
        tr.set('x.t.head', 1, 0.7, 0.1);
        t.rows.forEach((_, i) => tr.set(`x.t.r${i}`, 1, 0.5, 0.4 + 0.12 * i));
        t.start.forEach(j => tr.set(`x.t.c${j}`, 1, 0.9, 1.0));
        if (t.ring !== undefined) tr.set('x.ring', 1, 0.5, 1.2);
      });
      solve.push(() => {
        t.reveal.cols.forEach((j, n) => tr.set(`x.t.c${j}`, 1, 1.1, 0.4 * n));
        (t.reveal.rings ?? []).forEach((_, j) => tr.set(`x.rr${j}`, 1, 0.5, 1.2 + 0.15 * j));
      });
    } else console.warn('table failed', item.family, made.error);
  }
  if (p.euler) {
    const e = p.euler, rv = e.reveal;
    const made = tryBlock(() => Euler(e, F, th));
    if (made.ok) {
      const E = made.value, P = progressOf<EulerStep>(s => K(`x.eu.${s}`));
      draws.push(c => E.draw(c, P, {
        zones: (rv.zones ?? []).map(([at, col], j) => ({ at, col, k: K(`x.z${j}`) })),
        glow: (rv.glow ?? []).map(([i, col], j) => ({ i, col, k: K(`x.g${j}`) })),
        cross: (rv.cross ?? []).map((i, j) => ({ i, k: K(`x.x${j}`) })),
      }));
      start.push(() => {
        tr.set('x.eu.domain', 1, 0.6);
        if (e.regions) { tr.set('x.eu.P', 1, 0.7, 0.4); tr.set('x.eu.Q', 1, 0.7, 0.6); }
        if (e.tokensFirst) tr.set('x.eu.tokens', 1, 1.0, 0.3);
        else tr.jump('x.eu.sort', 1);
      });
      solve.push(() => {
        tr.set('x.eu.P', 1, 0.6); tr.set('x.eu.Q', 1, 0.6, 0.2);
        if (e.tokensFirst) tr.set('x.eu.sort', 1, 1.6, 0.5); else tr.set('x.eu.tokens', 1, 0.9, 0.5);
        (rv.zones ?? []).forEach((_, j) => tr.set(`x.z${j}`, 1, 0.6, 1.8 + 0.2 * j));
        (rv.glow ?? []).forEach((_, j) => tr.set(`x.g${j}`, 1, 0.5, 1.6 + 0.1 * j));
        (rv.cross ?? []).forEach((_, j) => tr.set(`x.x${j}`, 1, 0.6, 2.0));
      });
    } else console.warn('euler failed', item.family, made.error);
  }
  if (p.pairs) {
    const pp = p.pairs;
    const made = tryBlock(() => Pairs(pp.params, F, th));
    if (made.ok) {
      const B = made.value;
      draws.push(c => B.draw(c, paSteps('x.pa'), { extra: K('x.pa.extra') }));
      start.push(() => pp.start.forEach((s, j) => tr.set(`x.pa.${s}`, 1, 0.8, 0.2 + 0.35 * j)));
      solve.push(() => { pp.reveal.forEach((s, j) => tr.set(`x.pa.${s}`, 1, 1.2, 0.2 + 1.2 * j)); tr.set('x.pa.extra', 1, 0.6, 0.8); });
    } else console.warn('pairs failed', item.family, made.error);
  }
  if (p.nest) {
    const nn = p.nest;
    const made = tryBlock(() => Nest(nn.params, F, th));
    if (made.ok) {
      const N = made.value, P = progressOf<NestStep>(s => K(`x.n.${s}`));
      draws.push(c => N.draw(c, P, { cross: nn.cross ? K('x.n.cross') : 0 }));
      start.push(() => nn.start.forEach((s, j) => tr.set(`x.n.${s}`, 1, 0.7, 0.2 + 0.35 * j)));
      solve.push(() => { nn.reveal.forEach((s, j) => tr.set(`x.n.${s}`, 1, 0.8, 0.2 + 0.6 * j)); if (nn.cross) tr.set('x.n.cross', 1, 0.6, 0.4); });
    } else console.warn('nest failed', item.family, made.error);
  }
  if (p.fig) {
    const f = p.fig;
    draws.push(c => { sheet(c, FR_LEFT, K('x.fig')); drawFig(c, f, FR_LEFT, { k: K('x.fig') }); });
    start.push(() => tr.set('x.fig', 1, 0.7, 0.1));
  }
  if (p.proof) {
    const pr = p.proof, rv = pr.reveal ?? {};
    const askedRow = new Set((pr.ask ?? []).map(a => a.i));
    const fill = new Map((rv.fill ?? []).filter(x => askedRow.has(x.i)).map(x => [x.i, x]));
    const rows = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
    const fr: Frame = p.fig ? { x: 690, y: 60, w: 1190, h: 960 } : { x: 230, y: 60, w: 1460, h: 960 };
    const made = tryBlock(() => ProofFrame({ given: pr.given, prove: pr.prove, rows }, fr, th));
    if (made.ok) {
      const B = made.value, asked = new Set((pr.ask ?? []).map(a => `${a.cell === 'st' ? 's' : 'r'}${a.i}`));
      const P = progressOf<ProofStep>(s => (s === 'frame' ? K('x.pf') : asked.has(s) ? K('x.fill') : K('x.pf')));
      draws.push(c => B.draw(c, P, {
        ask: pr.ask,
        rings: [...(pr.ring !== undefined ? [{ i: pr.ring, col: 'pick' as Paint, k: K('x.pf') }] : []), ...(rv.rings ?? []).map(i => ({ i, col: 'link' as Paint, k: K('x.rings') }))],
        strike: (rv.strike ?? []).map(i => ({ i, k: K('x.strike') })),
      }));
      start.push(() => tr.set('x.pf', 1, 0.8, 0.2));
      solve.push(() => { tr.set('x.fill', 1, 0.9, 0.3); tr.set('x.rings', 1, 0.6, 0.6); tr.set('x.strike', 1, 0.6, 0.6); });
    } else console.warn('proof frame failed', item.family, made.error);
  }
  if (!draws.length) {
    const C = cardPainter([plainOf(item.prompt)], box(190, 140, 1730, 940));
    draws.push(c => C.draw(c, K('x.card')));
    start.push(() => tr.set('x.card', 1, 0.6));
  }
  setScene({ model: c => draws.forEach(d => d(c)), lines: [], leads: [], boardBox: null });
  start.forEach(f => f());
  void fr2box;
  return { solve: async () => { solve.forEach(f => f()); } };
}

void runLesson({
  slug: SLUG,
  warm: ['n^2 + n + 41 \\ a = 2m,\\ b = 2n \\ a + b = 2(m + n) \\ 2(m + n + 1) \\ n + 1 = 2k + 1 \\ p \\to q \\ {\\sim}q \\to {\\sim}p \\ \\cdots \\ \\bigstar \\ \\tfrac{1}{2} \\ \\ell \\parallel m \\ m\\angle 1 + m\\angle 2 = 180^\\circ \\ \\angle 1 \\cong \\angle 3 \\ ab = 2m \\cdot b \\ x^2 \\ge x \\ 3j + 3k \\ \\text{T F prime for every is an integer is even is odd}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
