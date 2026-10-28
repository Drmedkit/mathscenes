// linear-systems.ts: "Systems of equations" (Algebra 1, lesson 8; secondary-t6-08) on the shared lesson runtime. Every
// graph is the shared kit's Plane (src/lesson/kit/Plane.ts) through sysPic.ts: two lines and their crossing.
//   1 The question   Ana keeps 3x + 2y = 16 and replaces 5x − 4y = 12 by second + 2 × first (11x = 44). Same solution?
//                    3 cards (same = right; a new one = transformed-equation-new-solution; only 11x = 44 is left =
//                    keeps-only-combined-equation) + how sure
//   2 Worked example four steps on the plane: graph (an estimate near (4, 2)) -> 2 × first is the SAME line (dashed on
//                    top) -> add: 11x = 44 is the upright line x = 4 through the same crossing -> back-substitute and
//                    check (4, 2); one "why?" (why x = 4 passes through the crossing)
//   3 Your turn      4x + 3y = 5, 3x − 2y = 8, faded from the end: the variable is chosen for you; the kid picks the
//                    multipliers (× 2 and × 3), solves 17x = 34, and reports (2, −1); the dashed scaled lines and x = 2
//                    land on the plane
//   4 Prove it       Sam gets 0 = 0 for 2x − 3y = 6, −4x + 6y = −12 and writes (0, 0). Judge, then a because-chain:
//                    (0, 0) breaks the first / the second is −2 × the first, one line / every point of that line and
//                    nothing else; decoys = zero-vs-no-solution, infinite-means-every-point, infinite-means-many-crossings
//   5 Practice       all 27 sub-goals one after another, then mixed (runtime/practice.ts); plane pictures, the worked
//                    solution replayed on the picture after a miss; algebra items start on a slate and turn into the
//                    plane on the solve (never an empty grid with a question)
// Voiced lines: src/lesson/topics/linear-systems/script.ts -> voice/lines.json. Every answer is logged.
import type { Canvas } from '../../src/core/draw';
import type { Paint } from '../../src/core/theme';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { MF, bigLine, type Line, line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, pairInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { PFocus, PlaneBlock } from '../../src/lesson/kit/Plane';
import { type GPic, planeOf } from '../../src/lesson/topics/linear-systems/sysPic';
import { FAMILY_NAMES, GENERATORS, MC, type SItem } from '../../src/lesson/topics/linear-systems/items';
import { PLAN } from '../../src/lesson/topics/linear-systems/plan';
import { explain } from '../../src/lesson/topics/linear-systems/explain';
import { LINES } from '../../src/lesson/topics/linear-systems/script';
import { eq } from '../../src/lesson/topics/linear-systems/sysMaths';

const SLUG = 'linear-systems';
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

// ===================== the plane of a part: a GPic drawn with the kit's Plane, its steps under '<part>g.' =====================
interface Scene2 { P: PlaneBlock; draw(c: Canvas, f?: PFocus): void }
/** plane item keys live under pre + 'g.' so they never clash with the board's step keys (pre + 'T…') */
function planeScene(pre: string, g: GPic): Scene2 {
  const P = planeOf(g, MF, th);
  const prog = progressOf<string>(s => tr.k(s === 'axes' ? pre + 'axes' : pre + 'g.' + s));
  return { P, draw: (c, f) => P.draw(c, prog, f) };
}
const ring = (pre: string, key: string, col: 'link' | 'pick' | 'wrong' | 'first' | 'second' = 'pick') => ({ key, col, k: tr.k(pre + 'r.' + key) });
const show = (pre: string, key: string, d = 1.0, delay = 0) => tr.set(pre + 'g.' + key, 1, d, delay);
const colored = (L: Line, col: Paint) => { L.col = col; return L; };

// ===================== parts 1-2: Ana's system =====================
const A1 = eq(3, 2, 16), A2 = eq(5, -4, 12);
const G1: GPic = {
  x: { min: -2, max: 8, step: 1, name: 'x' }, y: { min: -4, max: 9, step: 1, name: 'y' }, equal: true,
  items: [
    { kind: 'line', key: 'L1', E: A1, col: 'first' },
    { kind: 'line', key: 'L2', E: A2, col: 'second' },
    { kind: 'line', key: 'K', E: eq(6, 4, 32), col: 'link', dash: true, w: 3 },
    { kind: 'line', key: 'V', E: eq(11, 0, 44), col: 'link' },
    { kind: 'point', key: 'G', x: 4, y: 2, col: 'pick' },
    { kind: 'point', key: 'S', x: 4, y: 2, col: 'link', name: '(4, 2)' },
  ],
  show: [], solve: [],
};

// ===================== 1. The question =====================
const CARDS = [
  { v: 'Yes, the same solution', s: 'replacing one equation keeps the crossing', t: 'the same solution', id: '', why: 'q.cb.right' },
  { v: 'No, a new solution', s: 'the numbers changed, so the crossing moves', t: 'a new solution', id: MC.newSol, why: 'q.cb.new' },
  { v: '11x = 44 is all that is left', s: 'the first equation is not needed now', t: 'only 11x = 44 is left', id: MC.keepsOnly, why: 'q.cb.keep' },
];
function partQuestion(): void {
  tr.reset('q.');
  const S = planeScene('q.', G1);
  const lines = [
    colored(line('q.T1', '3x + 2y = 16', 170, 80), 'first'),
    colored(line('q.T2', '5x - 4y = 12', 290, 80), 'second'),
    line('q.T3', '\\text{second} + 2\\times\\text{first}', 430, 60),
    colored(line('q.T4', '11x = 44', 540, 80), 'link'),
    line('q.T5', '(x,\\ y) = \\,?', 690, 72),
  ];
  setScene({ model: c => S.draw(c), lines, leads: [] });
  tr.set('q.axes', 1, 1.0); show('q.', 'L1', 1.2, 0.8); show('q.', 'L2', 1.2, 1.3);
  tr.set('q.T1', 1, 1.0, 1.0); tr.set('q.T2', 1, 1.0, 1.5); tr.set('q.T3', 1, 0.8, 2.2); tr.set('q.T4', 1, 0.8, 2.6); tr.set('q.T5', 1, 0.8, 3.0);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Ana keeps 3x + 2y = 16 and replaces 5x − 4y = 12 by second + 2 × first (11x = 44). Same solution?', board: '11x = 44', response: c.t, expected: CARDS[0]!.t, correct: c.id === '', mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const order = [1, 0, 2];
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', commit().pick === order[j]));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  order.forEach(i => { const cd = CARDS[i]!; const b = h('button'); b.innerHTML = `<span style="font-size:17px">${cd.v}</span> <small>${cd.s}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Replace one equation'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const S = planeScene('e.', G1);
  const lines = [
    colored(line('e.T1', '3x + 2y = 16', 140, 70), 'first'),
    colored(line('e.T2', '5x - 4y = 12', 240, 70), 'second'),
    line('e.TG', '\\approx (4,\\ 2)\\ ?', 360, 64),
    colored(line('e.TK', '2\\times\\!:\\ 6x + 4y = 32', 475, 64), 'link'),
    line('e.TA', '11x = 44,\\ \\ x = 4', 590, 64),
    line('e.TB', '3(4) + 2y = 16,\\ \\ y = 2', 700, 62),
    line('e.TC', '5(4) - 4(2) = 12\\ \\checkmark', 810, 62),
    colored(line('e.TS', '(4,\\ 2)', 925, 72), 'link'),
  ];
  setScene({ model: c => S.draw(c, { dim: tr.k('e.dimL2') > 0.5 ? ['L2'] : [], ring: [ring('e.', 'G', 'pick'), ring('e.', 'S', 'link')] }), lines, leads: [] });
  tr.jump('e.axes', 1); tr.jump('e.g.L1', 1); tr.jump('e.g.L2', 1); tr.jump('e.T1', 1); tr.jump('e.T2', 1);
  let step = 0;
  const STEPS = [
    { t: 'Graph: an estimate', why: 'Where the lines seem to cross.', act: 'Read the graph' },
    { t: 'Scale the first equation', why: 'Same line, new numbers.', act: 'Multiply by 2' },
    { t: 'Add the equations', why: 'y cancels.', act: 'Add them' },
    { t: 'Back-substitute and check', why: 'Find y, check both.', act: 'Find y' },
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
        show('e.', 'G', 0.6); tr.set('e.r.G', 1, 0.5, 0.3); await wait(0.9); if (!alive()) return;
        tr.set('e.TG', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.r.G', 0, 0.5);
      } else if (i === 1) {
        tr.set('e.TK', 1, 1.0); await wait(1.1); if (!alive()) return;
        show('e.', 'K', 1.6); await wait(1.8);
      } else if (i === 2) {
        tr.set('e.TA', 1, 1.0); await wait(1.1); if (!alive()) return;
        show('e.', 'V', 1.4); await wait(1.5); if (!alive()) return;
        tr.set('e.dimL2', 1, 0.3); tr.set('e.r.G', 1, 0.5); await wait(1.0); if (!alive()) return;
        tr.set('e.r.G', 0, 0.5);
      } else {
        tr.set('e.TB', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.dimL2', 0, 0.3); show('e.', 'S', 0.7); tr.set('e.r.S', 1, 0.5, 0.3); await wait(1.0); if (!alive()) return;
        tr.set('e.TC', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.TS', 1, 0.8); tr.set('e.r.S', 0, 0.6, 0.4); await wait(1.0);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: '(4, 2) makes both equations true, so it makes any sum of them true too.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: '4 is where the amber line meets the x-axis.', ok: false, id: 'e.why.icpt', mc: MC.intercept as string | undefined },
      { t: 'Luck: with other numbers it could miss.', ok: false, id: 'e.why.luck', mc: MC.newSol as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does the line x = 4 pass through the same crossing?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: 4x + 3y = 5, 3x − 2y = 8 =====================
const G3: GPic = {
  x: { min: -3, max: 6, step: 1, name: 'x' }, y: { min: -5, max: 4, step: 1, name: 'y' }, equal: true,
  items: [
    { kind: 'line', key: 'L1', E: eq(4, 3, 5), col: 'first' },
    { kind: 'line', key: 'L2', E: eq(3, -2, 8), col: 'second' },
    { kind: 'line', key: 'K1', E: eq(8, 6, 10), col: 'link', dash: true, w: 3 },
    { kind: 'line', key: 'K2', E: eq(9, -6, 24), col: 'link', dash: true, w: 3 },
    { kind: 'line', key: 'V', E: eq(17, 0, 34), col: 'link' },
    { kind: 'point', key: 'S', x: 2, y: -1, col: 'link', name: '(2, −1)' },
  ],
  show: [], solve: [],
};
function partTurn(): void {
  tr.reset('t.');
  const S = planeScene('t.', G3);
  const lines = [
    colored(line('t.T1', '4x + 3y = 5', 150, 72), 'first'),
    colored(line('t.T2', '3x - 2y = 8', 250, 72), 'second'),
    line('t.TM1', '\\times 2\\!:\\ 8x + 6y = 10', 370, 62),
    line('t.TM2', '\\times 3\\!:\\ 9x - 6y = 24', 470, 62),
    line('t.TX', '17x = 34,\\ \\ x = 2', 590, 64),
    line('t.TY', '4(2) + 3y = 5,\\ \\ y = -1', 700, 62),
    line('t.TC', '3(2) - 2(-1) = 8\\ \\checkmark', 810, 62),
    colored(line('t.TS', '(2,\\ -1)', 925, 72), 'link'),
  ];
  setScene({ model: c => S.draw(c, { ring: [ring('t.', 'S', 'link')] }), lines, leads: [] });
  tr.set('t.axes', 1, 0.9); show('t.', 'L1', 1.1, 0.4); show('t.', 'L2', 1.1, 0.8); tr.set('t.T1', 1, 1.0, 0.5); tr.set('t.T2', 1, 1.0, 0.9);
  let step = 0;
  const STEPS = [
    { t: 'Pick the letter', why: 'Done for you: y.' },
    { t: 'Multipliers', why: 'Your step.' },
    { t: 'Add, solve for x', why: 'Your step.' },
    { t: 'Find y, report', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  step = 1; drawPlan();
  setPanel(h('h2', {}, 'Your turn: 4x + 3y = 5, 3x − 2y = 8'), voiced('t.intro'), plan, work);
  seq(async alive => { await wait(2.2); if (!alive()) return; askMult(); });

  function askMult(): void {
    const opts = [
      { t: 'First × 3, second × 2', ok: false, id: 't.mult.swap', mc: MC.mismatch as string | undefined },
      { t: 'First × 2, second × 3', ok: true, id: 't.mult.ok', mc: undefined as string | undefined },
      { t: 'First × 2 only', ok: false, id: 't.mult.one', mc: MC.mismatch as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.multipliers', prompt: 'Which multipliers turn 3y and −2y into opposites?', response: o.t, expected: 'First × 2, second × 3', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.TM1', 1, 1.0); show('t.', 'K1', 1.4, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('t.TM2', 1, 1.0); show('t.', 'K2', 1.4, 0.3); await wait(1.6); if (!alive()) return;
        step = 2; drawPlan(); askX();
      });
    })));
    work.replaceChildren(voiced('t.mult'), bx, fbHost);
  }
  function askX(): void {
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.x.empty', false)); return; }
      const v = r.v, right = v === 2;
      ctx.store.log({ part: 'turn', item: 'turn.x', prompt: 'Add 8x + 6y = 10 and 9x − 6y = 24: x = ?', board: '17x = 34', response: v, expected: 2, correct: right, mc: v === 34 ? MC.stops : undefined });
      if (!right) { fbHost.replaceChildren(voicedFb(v === 34 || v === 17 ? 't.x.stop' : 't.x.no', false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.x.ok', true));
      seq(async alive => {
        tr.set('t.TX', 1, 1.0); show('t.', 'V', 1.4, 0.3); await wait(1.8); if (!alive()) return;
        tr.set('t.g.K1', 0, 0.6); tr.set('t.g.K2', 0, 0.6);
        step = 3; drawPlan(); askPair();
      });
    }
    work.replaceChildren(voiced('t.x'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askPair(): void {
    const fbHost = h('div'), inp = pairInput('(', ',', () => check(), ')'), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(voicedFb('t.pair.empty', false)); return; }
      const right = r.x === 2 && r.y === -1, rev = r.x === -1 && r.y === 2, sign = r.x === 2 && r.y === 1;
      ctx.store.log({ part: 'turn', item: 'turn.pair', prompt: '4x + 3y = 5, 3x − 2y = 8 with x = 2: the solution (x, y)?', response: [r.x, r.y], expected: [2, -1], correct: right, mc: rev ? MC.order : undefined });
      if (!right) { fbHost.replaceChildren(voicedFb(rev ? 't.pair.rev' : sign ? 't.pair.sign' : 't.pair.no', false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.pair.ok', true));
      seq(async alive => {
        tr.set('t.TY', 1, 1.0); await wait(1.0); if (!alive()) return;
        show('t.', 'S', 0.7); tr.set('t.r.S', 1, 0.5, 0.3); tr.set('t.TC', 1, 1.0, 0.4); await wait(1.4); if (!alive()) return;
        tr.set('t.TS', 1, 0.8); tr.set('t.r.S', 0, 0.6, 0.5); await wait(1.0); if (!alive()) return;
        step = 4; drawPlan(); work.append(callback());
      });
    }
    work.replaceChildren(voiced('t.pair'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const v = voiced(cd ? cd.why : 'q.cb.none');
    if (cd) v.append(html('span', 'dim', ` (You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)`));
    c.append(v, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Sam's (0, 0) =====================
const G4: GPic = {
  x: { min: -5, max: 7, step: 1, name: 'x' }, y: { min: -6, max: 4, step: 1, name: 'y' }, equal: true,
  items: [
    { kind: 'line', key: 'L1', E: eq(2, -3, 6), col: 'first' },
    { kind: 'line', key: 'L2', E: eq(-4, 6, -12), col: 'second', dash: true, w: 6 },
    { kind: 'point', key: 'O', x: 0, y: 0, col: 'wrong', name: '(0, 0)' },
    { kind: 'point', key: 'Q', x: 1, y: 1, col: 'wrong', open: true, name: '(1, 1)' },
    { kind: 'point', key: 'p1', x: 3, y: 0, col: 'link' }, { kind: 'point', key: 'p2', x: 0, y: -2, col: 'link' },
    { kind: 'point', key: 'p3', x: 6, y: 2, col: 'link' }, { kind: 'point', key: 'p4', x: -3, y: -4, col: 'link' },
  ],
  show: [], solve: [],
};
function partProve(): void {
  tr.reset('p.');
  const S = planeScene('p.', G4);
  const lines = [
    colored(line('p.R0', '2x - 3y = 6', 150, 70), 'first'),
    colored(line('p.R0b', '-4x + 6y = -12', 255, 70), 'second'),
    line('p.R1', '(0,\\,0)\\!:\\ 0 = 6\\ \\times', 390, 62),
    line('p.R2', '\\text{second} = -2\\times\\text{first}', 520, 62),
    line('p.R3', '0 = 0\\!:\\ \\text{one line}', 640, 62),
    colored(line('p.R4', '\\text{every point on}', 770, 62), 'link'),
    colored(line('p.R5', '2x - 3y = 6', 870, 70), 'link'),
  ];
  setScene({ model: c => S.draw(c, { ring: [ring('p.', 'O', 'wrong'), ring('p.', 'L2', 'second')] }), lines, leads: [] });
  tr.set('p.axes', 1, 0.9); show('p.', 'L1', 1.2, 0.6); tr.set('p.R0', 1, 1.0, 1.0); tr.set('p.R0b', 1, 1.0, 1.4);
  const CHIPS = [
    { t: '2(0) − 3(0) = 0, not 6: it breaks the first equation.', fits: 0 },
    { t: '−4x + 6y = −12 is −2 times 2x − 3y = 6: every pair that fits one fits the other.', fits: 1 },
    { t: '0 = 0 is always true, but the first equation still has to hold: (3, 0) works, (1, 1) does not.', fits: 2 },
    { t: 'When the letters cancel, they are equal to 0.', fits: -1, mc: MC.zeroNo, id: 'p.no.zero' },
    { t: '0 = 0 means every pair (x, y) works.', fits: -1, mc: MC.everyPoint, id: 'p.no.every' },
    { t: 'The lines cross at many separate points.', fits: -1, mc: MC.manyCross, id: 'p.no.many' },
  ];
  const CLAIMS = [
    'Sam’s <b>(0, 0)</b> is <b>not a solution</b>,',
    'The two equations describe <b>the same line</b>,',
    'The solutions are <b>all the points of that line</b>: infinitely many, and nothing else,',
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
      if (n === 1) { show('p.', 'O', 0.6); tr.set('p.r.O', 1, 0.5, 0.3); tr.set('p.R1', 1, 1.0, 0.5); await wait(1.6); if (!alive()) return; tr.set('p.r.O', 0, 0.5); }
      if (n === 2) { show('p.', 'L2', 1.4); tr.set('p.r.L2', 1, 0.5, 1.2); tr.set('p.R2', 1, 1.0, 0.3); await wait(1.8); if (!alive()) return; tr.set('p.R3', 1, 1.0); tr.set('p.r.L2', 0, 0.5, 0.6); await wait(1.2); }
      if (n === 3) {
        for (const k of ['p1', 'p2', 'p3', 'p4']) { show('p.', k, 0.5); await wait(0.35); if (!alive()) return; }
        show('p.', 'Q', 0.6); await wait(0.8); if (!alive()) return;
        tr.set('p.R4', 1, 1.0); tr.set('p.R5', 1, 1.0, 0.4); await wait(1.6); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam gets 0 = 0 for 2x − 3y = 6, −4x + 6y = −12 and writes the solution (0, 0). Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.zeroNo : undefined });
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
/** the board of a practice item: its TeX and the given lines on top (system colours), the worked TeX lines under them */
function boardLines(item: SItem): Line[] {
  const given = item.picture?.bd ?? [], cols = item.picture?.cols ?? [];
  const gap = given.length > 3 ? 96 : 110;
  const top = line('x.board', item.board, 150, 76);
  if (cols[0]) top.col = cols[0];
  const out = [top, ...given.map((t, i) => { const L = line(`x.given${i}`, t, 150 + (i + 1) * gap, 64); if (cols[i + 1]) L.col = cols[i + 1]; return L; })];
  const y0 = 150 + (given.length + 1) * gap + 30;
  (item.picture?.tex ?? []).forEach((t, i) => { const L = line(`x.sol${i}`, t, y0 + i * 110, 64); L.col = 'link'; out.push(L); });
  return out;
}
async function writeTex(item: SItem, alive: () => boolean): Promise<void> {
  for (let i = 0; i < (item.picture?.tex ?? []).length; i++) { tr.set(`x.sol${i}`, 1, 1.0); await wait(0.9); if (!alive()) return; }
}
function showBoard(item: SItem): void {
  tr.set('x.board', 1, 0.8, 0.3);
  (item.picture?.bd ?? []).forEach((_, i) => tr.set(`x.given${i}`, 1, 0.8, 0.5 + 0.2 * i));
}
/** a big slate for an item with nothing to draw yet: the board, the given lines, the worked lines */
function slateLines(item: SItem): Line[] {
  const big = box(200, 160, 1720, 920);
  const given = item.picture?.bd ?? [], sol = item.picture?.tex ?? [], cols = item.picture?.cols ?? [];
  const rows = 1 + given.length + sol.length, hRow = Math.min(220, (big.h - 60) / Math.max(rows, 2));
  const out: Line[] = [bigLine('x.board', item.board, box(big.x0, big.y0 + 30, big.x1, big.y0 + 30 + hRow), given.length ? 110 : 130)];
  if (cols[0]) out[0]!.col = cols[0];
  given.forEach((t, i) => { const L = bigLine(`x.given${i}`, t, box(big.x0, big.y0 + 30 + (i + 1) * hRow, big.x1, big.y0 + 30 + (i + 2) * hRow), 100); if (cols[i + 1]) L.col = cols[i + 1]; out.push(L); });
  sol.forEach((t, i) => { const L = bigLine(`x.sol${i}`, t, box(big.x0, big.y0 + 30 + (1 + given.length + i) * hRow, big.x1, big.y0 + 30 + (2 + given.length + i) * hRow), 100); L.col = 'link'; out.push(L); });
  return out;
}
function showItem(item: SItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const g = item.picture?.g;
  const made = g ? tryBlock(() => planeScene('x.', g)) : null;
  if (g && made && !made.ok) console.warn('plane picture did not fit', item.id, made.error);
  if (g && made?.ok) {
    const S = made.value;
    const onPlane = () => setScene({ model: c => S.draw(c), lines: boardLines(item), leads: [] });
    if (g.show.length) {
      onPlane();
      tr.set('x.axes', 1, 0.8);
      g.show.forEach((k, i) => show('x.', k, 0.9, 0.3 + 0.12 * i));
      showBoard(item);
      return { solve: async alive => { for (const k of g.solve) { show('x.', k, 1.0); await wait(0.6); if (!alive()) return; } await writeTex(item, alive); } };
    }
    // nothing to draw before the answer: a slate now, the plane on the worked solution
    setScene({ lines: slateLines(item), leads: [], boardBox: box(200, 160, 1720, 920) });
    showBoard(item);
    return {
      solve: async alive => {
        onPlane(); tr.jump('x.board', 1); (item.picture?.bd ?? []).forEach((_, i) => tr.jump(`x.given${i}`, 1));
        tr.set('x.axes', 1, 0.8); await wait(0.8); if (!alive()) return;
        for (const k of g.solve) { show('x.', k, 1.0); await wait(0.6); if (!alive()) return; }
        await writeTex(item, alive);
      },
    };
  }
  setScene({ lines: slateLines(item), leads: [], boardBox: box(200, 160, 1720, 920) });
  showBoard(item);
  return { solve: (item.picture?.tex ?? []).length ? async alive => writeTex(item, alive) : undefined };
}

void runLesson({
  slug: SLUG,
  warm: ['3x + 2y = 16 \\approx \\checkmark \\times', '\\text{second} + 2\\times\\text{first}', '(4,\\ 2)\\ (x,\\ y) = \\,?', '\\tfrac{2}{3}\\ \\frac{3}{4}', '\\downarrow'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
