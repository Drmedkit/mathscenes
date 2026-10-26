// solving-linear-equations.ts: "Solving linear equations and inequalities" (Algebra 1, secondary-t6-07) on the shared
// lesson runtime. The model is SetLine (src/lesson/topics/solving-linear-equations/SetLine.ts): number lines that show
// solution SETS, with arrows that carry every number through a step (parallel for + / −, crossing for × or ÷ by a
// negative) and test points with a check or a cross.
//   1 The question   −5 ≤ 1 − 2x < 3: which x? cards −1 < x ≤ 3 / x < −1 (one symbol turned) / no number (none turned)
//   2 Worked example subtract 1 from all three parts (the band slides) → divide by −2 (the arrows cross, both symbols
//                    turn) → read it smallest first → test the closed end, a point inside and one outside; one "why?"
//   3 Your turn      7 − 2x ≤ 3x + 2, faded from the end: x-terms left and the numbers are done; the kid picks the next
//                    line after −5x ≤ −5, tests x = 0 in the original, sees the other way (collect on the right)
//   4 Prove it       Jay: 2x + 3 > 7 "is x > 1" after two agreeing tests. Because-chain: tests can't prove a ray /
//                    reversible steps give exactly x > 2 / x = 2 is a counterexample. Distractors = catalogue ids
//   5 Practice       all 21 sub-goals one after another, then mixed (runtime/practice.ts); number-line pictures for the
//                    inequality families (the set, tests and arrows appear in the replay), a stacked slate otherwise
// Voiced lines: src/lesson/topics/solving-linear-equations/script.ts (→ voice/lines.json). Every answer is logged.
import { type Canvas, strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, MF, bigLine, bump, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { SetLine, type SetLineBlock, type SLFocus, type SLParams, axisFor, estW } from '../../src/lesson/topics/solving-linear-equations/SetLine';
import { L, ray, solveChain } from '../../src/lesson/topics/solving-linear-equations/sets';
import { FAMILY_NAMES, GENERATORS, MC, type SItem } from '../../src/lesson/topics/solving-linear-equations/items';
import { PLAN } from '../../src/lesson/topics/solving-linear-equations/plan';
import { picBlock } from '../../src/lesson/topics/solving-linear-equations/pictures';
import { explain } from '../../src/lesson/topics/solving-linear-equations/explain';
import { SCRIPT } from '../../src/lesson/topics/solving-linear-equations/script';

const SLUG = 'solving-linear-equations';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: shows SCRIPT[id].html, the narrator says SCRIPT[id].say (voice/lines.json) */
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = '', extra = ''): HTMLElement {
  const L0 = SCRIPT[id];
  if (!L0) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, (L0?.html ?? id) + extra);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]?.html ?? id); }

// ===================== board helpers =====================
function centred(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BOARD_W) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: BOARD.cx - b.cx, y, size: s, tags, col };
}
/** a short formula centred under a point (the move under each part) */
function under(key: string, src: string, cx: number, y: number, size: number, col: Paint = 'pick'): Line {
  const F = tex(src) as Formula, b = texBox(F, 0, y, { size });
  return { key, F, x: cx - b.cx, y, size, col };
}
const amber = { col: 'first' as Paint }, teal = { col: 'second' as Paint }, lime = { col: 'link' as Paint }, lav = { col: 'pick' as Paint }, red = { col: 'wrong' as Paint };
function lineScene(pre: string, blocks: { B: SetLineBlock; pre?: string; focus?: () => SLFocus }[], lines: Line[], extra?: (c: Canvas) => void): void {
  setScene({
    table: 1080, lines, leads: [], extra,
    model: c => { for (const k of blocks) { const p = k.pre ?? pre; k.B.draw(c, progressOf<string>(s => tr.k(p + s)), k.focus?.()); } },
  });
}
/** the line width a set of row names leaves (SetLine's own layout) */
const widthFor = (names: string[]) => MF.w - Math.max(150, ...names.map(n => estW(n, 64) + 40)) - 100;

// ===================== the example: −5 ≤ 1 − 2x < 3 =====================
const EXV = { lo: -5, m: -2, b: 1, hi: 3 };
const EX_SET = solveChain(-5, '<=', L(-2, 1), '<', 3);   // −1 < x ≤ 3
function exampleLine(): SetLineBlock {
  const P: SLParams = {
    ...axisFor([-5, 3, -6, 2, -1, 3], widthFor(['1 - 2x'])),
    rows: [
      { key: 'top', name: '1 - 2x', name2: '-2x', nameRole: 'first', set: solveChain(-5, '<=', L(1, 0), '<', 3), role: 'first', numbers: 'above', shift: -1 },
      { key: 'x', name: 'x', nameRole: 'second', set: EX_SET, role: 'link', numbers: 'below' },
    ],
    maps: [{ key: 'm', from: 'top', to: 'x', vs: [-6, 2], op: { kind: 'mul', by: -0.5 } }],
    tests: [{ key: 't1', row: 'x', v: 3 }, { key: 't2', row: 'x', v: 1 }, { key: 't3', row: 'x', v: -2 }],
  };
  return SetLine(P, MF, th);
}
interface ExBoard { lines: Line[] }
function exampleBoard(pre: string): ExBoard {
  const s = 80, os = 62;
  const E1 = centred(pre + 'E1', '\\cssId{a}{-5} \\le \\cssId{m}{1 - 2x} < \\cssId{b}{3}', 150, s, { m: amber });
  const E2 = centred(pre + 'E2', '\\cssId{a}{-6} \\le \\cssId{m}{-2x} < \\cssId{b}{2}', 320, s, { m: amber });
  const E3 = centred(pre + 'E3', '\\cssId{a}{3} \\cssId{s1}{\\ge} \\cssId{m}{x} \\cssId{s2}{>} \\cssId{b}{-1}', 490, s, { m: teal, s1: lav, s2: lav });
  const E4 = centred(pre + 'E4', '-1 < x \\le 3', 610, s, undefined, 'link');
  const at = (L0: Line, t: string) => partOf(L0, t).cx;
  const O1 = ['a', 'm', 'b'].map(t => under(pre + 'O1', '-\\,1', at(E1, t), 235, os));
  const O2 = [centred(pre + 'O2', '\\div(-2)', 405, os, undefined, 'pick')];
  const K1 = centred(pre + 'K1', '1 - 2(3) = -5 \\ \\cssId{ok}{\\checkmark}', 735, 70, { ok: lime });
  const K2 = centred(pre + 'K2', '1 - 2(1) = -1 \\ \\cssId{ok}{\\checkmark}', 825, 70, { ok: lime });
  const K3 = centred(pre + 'K3', '1 - 2(-2) = 5 \\ \\cssId{no}{\\times}', 915, 70, { no: red });
  return { lines: [E1, ...O1, E2, ...O2, E3, E4, K1, K2, K3] };
}

// ===================== 1. The question =====================
const CARDS = [
  { t: '−1 &lt; <i>x</i> ≤ 3', id: '', why: 'q.cb.right', ok: true },
  { t: '<i>x</i> &lt; −1', id: MC.oneSym, why: 'q.cb.one', ok: false },
  { t: 'No number works', id: MC.noRev, why: 'q.cb.empty', ok: false },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = exampleLine(), Bd = exampleBoard('q.');
  lineScene('q.', [{ B }], Bd.lines);
  tr.set('q.ax', 1, 1.2, 0.3); tr.set('q.top.set', 1, 1.2, 1.4); tr.set('q.E1', 1, 1.2, 1.0);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Which numbers x make −5 ≤ 1 − 2x < 3 true?', board: '-5 \\le 1 - 2x < 3', response: c.t.replace(/<[^>]+>/g, '').replace('&lt;', '<'), expected: '−1 < x ≤ 3', correct: c.ok, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button', { class: cd.ok || cd.id === MC.oneSym ? 'set' : 'set words' }); b.innerHTML = `<span>${cd.t}</span>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Which numbers?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const B = exampleLine(), Bd = exampleBoard('e.');
  lineScene('e.', [{ B, focus: () => ({ pulse: { 'name.top': tr.k('e.pN'), 'end.x.0': tr.k('e.pE') } }) }], Bd.lines);
  tr.jump('e.ax', 1); tr.jump('e.top.set', 1); tr.jump('e.E1', 1);
  let step = 0;
  const STEPS = [
    { t: 'Subtract 1 from all three parts', why: 'The band slides; the order stays.', act: 'Subtract 1' },
    { t: 'Divide all three parts by −2', why: 'Watch the arrows.', act: 'Divide' },
    { t: 'Write it smallest first', why: 'Open or closed at each end?', act: 'Write it' },
    { t: 'Test the ends and the middle', why: 'In the original inequality.', act: 'Test' },
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
        void bump('e.pN', alive); tr.set('e.O1', 1, 0.8); await wait(1.0); if (!alive()) return;
        tr.set('e.top.shift', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('e.E2', 1, 1.0); tr.set('e.E1:dim', 1, 0.5); tr.set('e.O1:dim', 1, 0.5); await wait(1.1);
      } else if (i === 1) {
        tr.set('e.O2', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('e.m', 1, 2.2); await wait(2.0); if (!alive()) return;
        tr.set('e.x.set', 1, 1.2); await wait(1.2); if (!alive()) return;
        tr.set('e.E3', 1, 1.0); tr.set('e.E2:dim', 1, 0.5); tr.set('e.O2:dim', 1, 0.5); await wait(1.1);
      } else if (i === 2) {
        tr.set('e.m:fade', 1, 0.8); void bump('e.pE', alive); tr.set('e.E3:dim', 1, 0.5); tr.set('e.E4', 1, 1.0); await wait(1.4);
      } else {
        for (const [t, k] of [['t1', 'K1'], ['t2', 'K2'], ['t3', 'K3']] as const) { tr.set('e.' + t, 1, 0.9); tr.set('e.' + k, 1, 1.0, 0.3); await wait(1.4); if (!alive()) return; }
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Dividing by −2 mirrors every number through 0, so the order turns on BOTH sides of the middle part.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'Only the symbol next to the negative number has to turn; the other one turned by accident.', ok: false, id: 'e.why.one', mc: MC.oneSym },
      { t: 'Symbols turn whenever a minus sign shows up in a step.', ok: false, id: 'e.why.any', mc: MC.revAny },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why did both symbols turn around?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: 7 − 2x ≤ 3x + 2 =====================
function turnLines(wrong: boolean): SetLineBlock {
  return SetLine({
    ...axisFor([-2, 0, 1, 2, 4], widthFor(['x'])),
    rows: [wrong ? { key: 'x', name: 'x', nameRole: 'second', set: ray('<=', 1), role: 'wrong', dashed: true } : { key: 'x', name: 'x', nameRole: 'second', set: ray('>=', 1), role: 'link' }],
    tests: wrong ? [{ key: 't0', row: 'x', v: 0, ok: false }] : [{ key: 't0', row: 'x', v: 0, ok: false }, { key: 't2', row: 'x', v: 3, ok: true }],
  }, MF, th);
}
function partTurn(): void {
  tr.reset('t.');
  const B = turnLines(false), W = turnLines(true);
  const s = 78, os = 60;
  const E1 = centred('t.E1', '\\cssId{L}{7 - 2x} \\le \\cssId{R}{3x + 2}', 170, s, { L: amber, R: amber });
  const E2 = centred('t.E2', '\\cssId{L}{7 - 5x} \\le \\cssId{R}{2}', 340, s);
  const E3 = centred('t.E3', '\\cssId{L}{-5x} \\le \\cssId{R}{-5}', 510, s, { L: teal });
  const E4 = centred('t.E4', 'x \\ge 1', 680, s, undefined, 'link');
  const at = (L0: Line, t: string) => partOf(L0, t).cx;
  const O1 = ['L', 'R'].map(t => under('t.O1', '-\\,3x', at(E1, t), 255, os));
  const O2 = ['L', 'R'].map(t => under('t.O2', '-\\,7', at(E2, t), 425, os));
  const O3 = ['L', 'R'].map(t => under('t.O3', '\\div(-5)', at(E3, t), 595, os - 4));
  const K = centred('t.K', 'x = 0:\\ \\ 7 \\le 2\\ \\ \\cssId{no}{\\text{false}}', 800, 66, { no: red });
  const A = centred('t.A', '\\text{or: } 5 \\le 5x,\\ \\ 1 \\le x', 910, 64, undefined, 'dim');
  lineScene('t.', [{ B }, { B: W, pre: 't.w.' }], [E1, ...O1, E2, ...O2, E3, ...O3, E4, K, A]);
  tr.set('t.ax', 1, 1.2, 0.3); tr.set('t.w.ax', 0, 0.01); tr.set('t.E1', 1, 1.0, 1.0);
  let step = 0;
  const STEPS = [
    { t: 'Collect the x-terms on the left', why: 'Done for you: −3x on both sides.' },
    { t: 'Then the numbers', why: 'Done for you: −7 on both sides.' },
    { t: 'Divide by −5', why: 'Your step.' },
    { t: 'Test a point in the original', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s0, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s0.t), h('span', { class: 'why' }, s0.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(3.0); if (!alive()) return;
    tr.set('t.O1', 1, 0.8); await wait(1.0); if (!alive()) return;
    tr.set('t.E2', 1, 1.0); tr.set('t.E1:dim', 1, 0.5); tr.set('t.O1:dim', 1, 0.5); step = 1; drawPlan(); await wait(1.4); if (!alive()) return;
    tr.set('t.O2', 1, 0.8); await wait(1.0); if (!alive()) return;
    tr.set('t.E3', 1, 1.0); tr.set('t.E2:dim', 1, 0.5); tr.set('t.O2:dim', 1, 0.5); step = 2; drawPlan(); await wait(1.2); if (!alive()) return;
    askMove();
  });
  function askMove(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: '<i>x</i> ≥ 1', ok: true, id: 't.move.ok', mc: undefined as string | undefined },
      { t: '<i>x</i> ≤ 1', ok: false, id: 't.move.keep', mc: MC.noRev as string | undefined },
      { t: '<i>x</i> ≥ −1', ok: false, id: 't.move.sign', mc: MC.signDrop as string | undefined },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.move', prompt: '−5x ≤ −5: the next line?', board: '-5x \\le -5', response: o.t.replace(/<[^>]+>/g, ''), expected: 'x ≥ 1', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (o.id === 't.move.keep') seq(async alive => {
        tr.set('t.w.ax', 1, 0.01); tr.set('t.ax', 0, 0.01); tr.set('t.w.x.set', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('t.w.t0', 1, 1.0); await wait(3.2); if (!alive()) return;
        tr.set('t.w.x.set', 0, 0.6); tr.set('t.w.t0', 0, 0.6); await wait(0.6); if (!alive()) return;
        tr.set('t.w.ax', 0, 0.01); tr.set('t.ax', 1, 0.01);
      });
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.w.ax', 0, 0.01); tr.set('t.w.x.set', 0, 0.01); tr.set('t.w.t0', 0, 0.01); tr.set('t.ax', 1, 0.01);
        tr.set('t.O3', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('t.E4', 1, 1.0); tr.set('t.E3:dim', 1, 0.5); tr.set('t.O3:dim', 1, 0.5); tr.set('t.x.set', 1, 1.2); await wait(1.4); if (!alive()) return;
        step = 3; drawPlan(); askTest();
      });
    })));
    work.replaceChildren(voiced('t.move'), bx, fbHost);
  }
  function askTest(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    let done = false;
    [{ t: 'True', ok: false }, { t: 'False', ok: true }].forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.test', prompt: 'x = 0 in 7 − 2x ≤ 3x + 2: true or false?', response: o.t, expected: 'False', correct: o.ok, mc: undefined });
      if (!o.ok) { fbHost.replaceChildren(voicedFb('t.test.no', false)); return; }
      done = true;
      fbHost.replaceChildren(voicedFb('t.test.ok', true));
      seq(async alive => {
        tr.set('t.K', 1, 1.0); tr.set('t.t0', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('t.t2', 1, 0.9); await wait(1.2); if (!alive()) return;
        tr.set('t.A', 1, 1.0); step = 4; drawPlan();
        fbHost.append(voiced('t.other'), callback());
      });
    })));
    work.replaceChildren(voiced('t.test'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, 'p', '', cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : ''), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Jay's 2x + 3 > 7 "is x > 1" =====================
function partProve(): void {
  tr.reset('p.');
  const B = SetLine({
    ...axisFor([-1, 0, 1, 2, 5, 6], widthFor(['\\text{Jay}', 'x'])),
    rows: [
      { key: 'jay', name: '\\text{Jay}', nameRole: 'pick', set: ray('>', 1), role: 'pick', dashed: true },
      { key: 'x', name: 'x', nameRole: 'second', set: ray('>', 2), role: 'link' },
    ],
    tests: [{ key: 'j0', row: 'jay', v: 0, ok: false }, { key: 'j5', row: 'jay', v: 5, ok: true }, { key: 'j2', row: 'jay', v: 2, ok: false }, { key: 'x2', row: 'x', v: 2, ok: false }],
  }, MF, th);
  const s = 76;
  const S1 = centred('p.S1', '2x + 3 > 7', 150, s, undefined, 'ink');
  const S2 = centred('p.S2', '\\text{Jay: } x > 1', 245, s, undefined, 'pick');
  const T0 = centred('p.T0', 'x = 0:\\ \\ 3 > 7\\ \\ \\text{no}', 335, 64, undefined, 'dim');
  const T5 = centred('p.T5', 'x = 5:\\ \\ 13 > 7\\ \\ \\text{yes}', 420, 64, undefined, 'dim');
  const C1 = centred('p.C1', '2x > 4', 540, s);
  const C2 = centred('p.C2', 'x > 2', 630, s, undefined, 'link');
  const C3 = centred('p.C3', 'x = 2:\\ \\ 7 > 7\\ \\ \\cssId{no}{\\text{false}}', 760, 68, { no: red });
  const extra = (c: Canvas) => {
    const k = tr.k('p.strike');
    if (k > 0) { const b0 = texBox(S2.F, S2.x, S2.y, { size: S2.size, align: 'left' }); strike(c, b0.x0 - 12, b0.cy + 6, b0.x1 + 12, b0.cy - 6, k, { col: 'wrong' }); }
  };
  lineScene('p.', [{ B, focus: () => ({ pulse: { j0: tr.k('p.pT'), j5: tr.k('p.pT') }, dim: { jay: tr.k('p.dimJ') } }) }], [S1, S2, T0, T5, C1, C2, C3], extra);
  tr.set('p.ax', 1, 1.2, 0.3); tr.set('p.S1', 1, 0.9, 1.2); tr.set('p.S2', 1, 0.9, 1.9); tr.set('p.jay.set', 1, 1.2, 2.2);
  tr.set('p.T0', 1, 0.8, 3.0); tr.set('p.j0', 1, 0.9, 3.0); tr.set('p.T5', 1, 0.8, 3.8); tr.set('p.j5', 1, 0.9, 3.8);
  const CHIPS = [
    { t: 'Tests check single numbers; his ray holds infinitely many he never tried.', fits: 0 },
    { t: 'Subtracting 3 and dividing by positive 2 can both be undone, so nothing is lost or gained.', fits: 1 },
    { t: 'One counterexample is enough to break a claim about a set.', fits: 2 },
    { t: 'Two tests that agree with the claim prove it.', fits: -1, mc: MC.oneTest, id: 'p.no.tests' },
    { t: 'The 3 moves to the other side and changes its sign.', fits: -1, mc: MC.moveSign, id: 'p.no.move' },
  ];
  const CLAIMS = [
    'Jay’s two tests do not settle his set,',
    '<b>2<i>x</i> + 3 &gt; 7</b> has exactly the solutions of <b><i>x</i> &gt; 2</b>,',
    'Jay’s set is wrong: <b>2</b> is in it, but 2(2) + 3 = 7 is not more than 7,',
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, '').replace('&gt;', '>'), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) { void bump('p.pT', alive); await wait(1.0); }
      if (n === 2) {
        tr.set('p.T0:dim', 1, 0.5); tr.set('p.T5:dim', 1, 0.5);
        tr.set('p.C1', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('p.C2', 1, 1.0); tr.set('p.x.set', 1, 1.3, 0.3); await wait(1.6);
      }
      if (n === 3) {
        tr.set('p.j2', 1, 1.0); tr.set('p.x2', 1, 1.0, 0.4); tr.set('p.C3', 1, 1.0, 0.6); await wait(2.0); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); tr.set('p.dimJ', 1, 0.8, 0.4); await wait(1.4); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Jay is right', () => judge(true)), no = btn('Jay is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jay: 2x + 3 > 7 has solution set x > 1 (x = 0 and x = 5 agree). Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.oneTest : undefined });
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
    show: it => showItem(it as SItem),
  });
}
function showItem(item: SItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.line) {
    const made = tryBlock(() => picBlock(pic.line!, th));
    if (made.ok) {
      const B = made.value, L0 = pic.line;
      const T = centred('x.T', item.board, 230, 84);
      const Rz = centred('x.R', L0.result ?? '', 420, 84, undefined, 'link');
      lineScene('x.', [{ B }], L0.result ? [T, Rz] : [T]);
      tr.set('x.ax', 1, 1.0, 0.1); tr.set('x.T', 1, 0.9, 0.3);
      for (const r of L0.rows) if (r.show) tr.set(`x.${r.key}.set`, 1, 1.0, 0.8);
      return {
        solve: async alive => {
          for (const r of L0.rows) if (r.shift !== undefined) { tr.set(`x.${r.key}.shift`, 1, 1.2); await wait(1.3); if (!alive()) return; }
          for (const m of L0.maps ?? []) { tr.set('x.' + m.key, 1, 1.6); await wait(1.6); if (!alive()) return; }
          for (const r of L0.rows) if (!r.show) { tr.set(`x.${r.key}.set`, 1, 1.0); await wait(0.6); if (!alive()) return; }
          for (const m of L0.maps ?? []) if ((L0.tests ?? []).some(t => t.row === m.to)) tr.set(`x.${m.key}:fade`, 1, 0.6);
          tr.set('x.R', 1, 1.0);
          for (const t of L0.tests ?? []) { await wait(0.5); if (!alive()) return; tr.set('x.' + t.key, 1, 0.9); }
        },
      };
    }
  }
  if (pic?.lines) {
    const big = box(200, 150, 1720, 930), n = pic.lines.tex.length;
    const gap = Math.min(150, (big.h - 80) / n);
    const Fs = pic.lines.tex.map(t => tex(t) as Formula);
    let size = Math.min(96, gap * 0.62);
    while (size > 60 && Fs.some(F => texWidth(F, size) > big.w - 140)) size -= 2;
    const maxW = Math.max(...Fs.map(F => texWidth(F, size)));
    const x0 = big.cx - maxW / 2, y0 = big.cy - (gap * (n - 1)) / 2;
    const lines: Line[] = Fs.map((F, i) => ({ key: `x.L${i}`, F, x: x0, y: y0 + i * gap, size, col: pic.lines!.hi === i ? 'pick' as Paint : undefined }));
    setScene({ lines, leads: [], boardBox: big, table: 1080 });
    lines.forEach((l, i) => tr.set(l.key, 1, 0.7, 0.1 + i * 0.25));
    return {};
  }
  const big = box(260, 230, 1660, 790);
  setScene({ lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big, table: 1080 });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['-5 \\le 1 - 2x < 3 \\ge \\div(-2) \\checkmark \\times', '\\text{Jay: } x > 1', '\\tfrac{1}{2}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
