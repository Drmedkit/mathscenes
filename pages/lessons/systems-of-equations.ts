// systems-of-equations.ts: "Systems of linear equations" (grade 8, 8.EE.C.8) on the shared lesson runtime.
//   1 The question   x + y = 7 and x − y = 1: which marked point makes BOTH true? (4, 3); (5, 2) fits one equation only;
//                    (3, 4) is the pair in the wrong order
//   2 Worked example the solutions of x + y = 7 appear as dots and fill a line; the second line; the crossing is on both
//                    (checked in both equations); then add the equations: 2x = 8 is the vertical line x = 4 through the
//                    crossing, and 4 + y = 7 gives y = 3. One "why?" with 3 reasons
//   3 Your turn      y = 2x − 1 and x + y = 8 by substitution, faded from the end: the lines are given, the kid
//                    substitutes (parentheses!), solves for x, and reports the pair
//   4 Prove it       Riley sets y = 2x + 3 equal to y = 2x − 1, gets 3 = −1 and writes x = 0, (0, 3): a because-chain
//                    from reason chips (distractors = catalogue misconceptions); the plane backs each claim
//   5 Practice       all 23 sub-goals one after another, then mixed (runtime/practice.ts), the system on a plane
// Voiced lines: pages/lessons/systems-of-equations/voice/lines.json. Every answer is logged (runtime/store.ts).
import { type Canvas, strike, strokePts } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { bigLine, bump, type Line, seq, setScene as setStage, type Scene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, pairInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { PLANE_AREA, WIDE_BOARD, SysPlane, type SysBlock, type SysMark, type SysState } from '../../src/lesson/topics/systems-of-equations/SysPlane';
import { lin, pairP, ySlope, type V } from '../../src/lesson/topics/systems-of-equations/sysMaths';
import { FAMILY_NAMES, GENERATORS, MC, type SysItem } from '../../src/lesson/topics/systems-of-equations/items';
import { PLAN } from '../../src/lesson/topics/systems-of-equations/plan';
import LINES from './systems-of-equations/voice/lines.json';

const SLUG = 'systems-of-equations';
const NOTABLE = 1080;
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
const X = '<i>x</i>', Y = '<i>y</i>';
/** a voiced panel line: the HTML shown is the line's text with colour marks; the narrator says lines.json[id] */
function voiced(id: string, htmlText: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, htmlText);
}
function voicedFb(id: string, ok: boolean, htmlText: string): HTMLElement { if (!(id in LINES)) console.warn('no voice line', id); say(id); return feedback(ok, htmlText); }

// ===================== the board: a wide slate, equations aligned on their = sign =====================
// the runtime board (about 512 px of text) is too narrow for a system and its work: every part uses WIDE_BOARD
const BOARD = WIDE_BOARD, LX = BOARD.x0 + 54, BOARD_W = BOARD.w - 108;
const setScene = (s: Scene) => setStage({ boardBox: BOARD, ...s });
/** a line of TeX at the left of the wide board (shrinks to fit) */
function line(key: string, src: string, y: number, size: number, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BOARD_W) s -= 2;
  return { key, F, x: LX, y, size: s, col };
}
interface Row { key: string; t: string; y: number; col?: Paint; tags?: Record<string, { col: Paint }> }
const withEq = (t: string) => t.replace(' = ', ' \\cssId{eq}{=} ');
/** rows with every = sign in one column, the widest row centred on the board (shrinks to fit) */
function alignRows(rows: Row[], size: number): Line[] {
  const Fs = rows.map(r => tex(withEq(r.t)) as Formula);
  let s = size, eqx = 0;
  for (;;) {
    let mL = 0, mR = 0;
    for (const F of Fs) { const all = texBox(F, 0, 0, { size: s }), e = texBox(F, 0, 0, { size: s }, 'eq'); mL = Math.max(mL, e.cx - all.x0); mR = Math.max(mR, all.x1 - e.cx); }
    if (mL + mR <= BOARD_W || s <= 60) { eqx = LX + mL + (BOARD_W - mL - mR) / 2; break; }
    s -= 2;
  }
  return rows.map((r, i) => { const F = Fs[i]!, e = texBox(F, 0, r.y, { size: s }, 'eq'); return { key: r.key, F, x: eqx - e.cx, y: r.y, size: s, tags: r.tags, col: r.col }; });
}
/** a line centred on the board */
function centred(key: string, src: string, y: number, size: number, col?: Paint, tags?: Record<string, { col: Paint }>): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BOARD_W) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: BOARD.cx - b.cx, y, size: s, col, tags };
}
const lineBox = (L: Line): Box => texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });
/** strike a board line (a wrong claim), after the evidence is on screen */
const strikeLine = (c: Canvas, L: Line, k: number) => { if (k <= 0) return; const b = lineBox(L); strike(c, b.x0 - 10, b.cy + 4, b.x1 + 10, b.cy - 4, k, { col: 'wrong' }); };

// ===================== the system x + y = 7, x − y = 1 (parts 1 and 2) =====================
const E1 = lin(1, 1, 7), E2 = lin(1, -1, 1);
const WIN_Q = { x0: -1, y0: -1, x1: 8, y1: 8 };
const D1: V[] = [[0, 7], [1, 6], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1], [7, 0]];
const D2: V[] = [[1, 0], [2, 1], [3, 2], [4, 3], [5, 4], [6, 5], [7, 6]];
const k = (key: string) => tr.k(key);

// ===================== 1. The question =====================
const CARDS = [
  { p: [5, 2] as V, lab: 'A', mc: MC.oneCond, why: 'q.cb.one' },
  { p: [4, 3] as V, lab: 'B', mc: '', why: 'q.cb.right' },
  { p: [3, 4] as V, lab: 'C', mc: MC.reversed, why: 'q.cb.rev' },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = SysPlane({ win: WIN_Q }, PLANE_AREA);
  const rows = alignRows([{ key: 'q.R1', t: 'x + y = 7', y: 200, col: 'first' }, { key: 'q.R2', t: 'x - y = 1', y: 310, col: 'second' }, { key: 'q.R3', t: '(x, y) = \\,?', y: 470 }], 84);
  setScene({ table: NOTABLE, lines: rows, leads: [], model: c => B.draw(c, { grid: k('q.grid'), marks: CARDS.map((cd, i) => ({ p: cd.p, col: 'pick', k: k('q.p' + i), label: cd.lab })) }) });
  tr.set('q.grid', 1, 0.8); CARDS.forEach((_, i) => tr.set('q.p' + i, 1, 0.5, 1.0 + i * 0.35));
  tr.set('q.R1', 1, 0.9, 0.6); tr.set('q.R2', 1, 0.9, 1.3); tr.set('q.R3', 1, 0.7, 2.1);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'x + y = 7 and x − y = 1: which point makes both true? A (5, 2), B (4, 3), C (3, 4)', board: 'x + y = 7, x - y = 1', response: pairP(c.p), expected: '(4, 3)', correct: c.lab === 'B', mc: c.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${pairP(cd.p).replace('-', '−')}<small>point ${cd.lab}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'One pair, two equations'),
    voiced('q.intro', `Two equations share the same ${X} and the same ${Y}: <b class="a">${X} + ${Y} = 7</b> and <b class="b">${X} − ${Y} = 1</b>. Which marked point makes both of them true? Pick one, and say how sure you are.`),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn),
  );
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const B = SysPlane({ win: WIN_Q }, PLANE_AREA);
  const rows = alignRows([
    { key: 'e.R1', t: 'x + y = 7', y: 150, col: 'first' }, { key: 'e.R2', t: 'x - y = 1', y: 245, col: 'second' },
    { key: 'e.S', t: '2x = 8', y: 360 }, { key: 'e.x', t: 'x = 4', y: 450 },
    { key: 'e.b', t: '4 + y = 7', y: 560 }, { key: 'e.y', t: 'y = 3', y: 650 },
    { key: 'e.c1', t: '4 + 3 = 7\\ \\checkmark', y: 600, col: 'first' }, { key: 'e.c2', t: '4 - 3 = 1\\ \\checkmark', y: 690, col: 'second' },
  ], 76);
  const [R1, R2] = rows as [Line, Line];
  const s1 = centred('e.s1', '(1, 6)\\quad (2, 5)\\quad (5, 2)\\quad \\dots', 370, 62, 'first');
  const s2 = centred('e.s2', '(1, 0)\\quad (3, 2)\\quad (6, 5)\\quad \\dots', 470, 62, 'second');
  const P = centred('e.P', '(x, y) = (4, 3)', 820, 80, 'link');
  const plusL: Line = { key: 'e.plus', F: tex('+') as Formula, x: lineBox(R2).x0 - 78, y: R2.y, size: R2.size, col: 'pick' };
  const lines = [...rows, s1, s2, P, plusL];
  const extra = (c: Canvas) => {
    const kr = k('e.rule');
    if (kr > 0) { const a = lineBox(plusL), b = lineBox(R1), r = lineBox(R2); const y = r.y1 + 26; strokePts(c, [[a.x0 - 6, y], [a.x0 - 6 + (Math.max(b.x1, r.x1) + 12 - a.x0) * kr, y]], { col: 'dim', lw: 4 }); }
  };
  const state = (): SysState => ({
    grid: 1,
    lines: [{ L: E1, col: 'first', k: k('e.L1') }, { L: E2, col: 'second', k: k('e.L2') }],
    dots: [{ pts: D1, col: 'first', k: k('e.d1') }, { pts: D2, col: 'second', k: k('e.d2') }],
    guides: [{ x: 4, col: 'link', k: k('e.gx') }, { y: 3, col: 'link', k: k('e.gy') }],
    marks: [{ p: [5, 2], col: 'pick', k: k('e.A'), ring: k('e.Ar'), label: '(5, 2)' }, { p: [4, 3], col: 'link', k: k('e.X'), ring: k('e.Xr'), label: '(4, 3)', big: true }],
  });
  setScene({ table: NOTABLE, lines, leads: [], model: c => B.draw(c, state()), extra });
  tr.jump('e.R1', 1); tr.jump('e.R2', 1);
  let step = 0;
  const STEPS = [
    { t: 'One equation, many solutions', why: `Pairs that make ${X} + ${Y} = 7 true.`, act: 'Show them' },
    { t: 'A second equation, a second line', why: `Pairs that make ${X} − ${Y} = 1 true.`, act: 'Show them' },
    { t: 'Where the lines cross', why: 'The one point on both lines.', act: 'Find it' },
    { t: 'Find it without drawing', why: 'Add the two equations.', act: 'Add them' },
  ];
  const SAY = [
    `Every pair that adds to 7 is a solution: (1, 6), (2, 5), (5, 2) and more. They all sit on one line: <b class="a">the line of ${X} + ${Y} = 7</b>.`,
    `The pairs whose difference is 1 sit on a second line: <b class="b">the line of ${X} − ${Y} = 1</b>.`,
    `The lines cross at <b class="s">(4, 3)</b>, the one point on both. Check: 4 + 3 = 7 and 4 − 3 = 1, both true. (5, 2) is on the first line only: 5 − 2 = 3, not 1.`,
    `Add the equations: the ${Y}'s cancel, 2${X} = 8, so ${X} = 4. That is the line ${X} = 4, through the crossing. Then 4 + ${Y} = 7, so ${Y} = 3: <b class="s">(4, 3)</b>.`,
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, html('strong', '', s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.d1', 1, 2.2); await wait(2.4); if (!alive()) return;
        tr.set('e.L1', 1, 1.4); await wait(1.0); if (!alive()) return; tr.set('e.s1', 1, 1.2); await wait(1.4);
      } else if (i === 1) {
        tr.set('e.s1:dim', 1, 0.5); tr.set('e.d1', 0.35, 0.6);
        tr.set('e.d2', 1, 2.0); await wait(2.2); if (!alive()) return;
        tr.set('e.L2', 1, 1.4); await wait(1.0); if (!alive()) return; tr.set('e.s2', 1, 1.2); await wait(1.4);
      } else if (i === 2) {
        tr.set('e.d1', 0, 0.6); tr.set('e.d2', 0, 0.6); tr.set('e.s2:dim', 1, 0.5);
        tr.set('e.X', 1, 0.6); void bump('e.Xr', alive); await wait(1.2); if (!alive()) return;
        tr.set('e.s1', 0, 0.4); tr.set('e.s2', 0, 0.4);
        tr.set('e.c1', 1, 1.0, 0.3); tr.set('e.c2', 1, 1.0, 1.2); await wait(2.4); if (!alive()) return;
        tr.set('e.A', 1, 0.5); tr.set('e.Ar', 1, 0.5); await wait(1.4); if (!alive()) return; tr.set('e.Ar', 0, 0.6);
      } else {
        tr.set('e.c1', 0, 0.5); tr.set('e.c2', 0, 0.5); tr.set('e.A', 0, 0.5);
        tr.set('e.plus', 1, 0.6, 0.4); tr.set('e.rule', 1, 0.8, 0.9); await wait(1.8); if (!alive()) return;
        tr.set('e.S', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.x', 1, 0.9); tr.set('e.gx', 1, 1.2, 0.4); await wait(1.9); if (!alive()) return;
        tr.set('e.b', 1, 0.9); await wait(1.1); if (!alive()) return;
        tr.set('e.y', 1, 0.9); tr.set('e.gy', 1, 1.2, 0.4); await wait(1.9); if (!alive()) return;
        tr.set('e.P', 1, 1.0); void bump('e.Xr', alive); await wait(1.4);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`, SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: `It is on both lines, so its ${X} and ${Y} make both equations true.`, ok: true, id: 'e.why.ok', mc: undefined as string | undefined, say: 'Yes. A point on a line makes that line’s equation true. On both lines means both equations.' },
      { t: 'It is where a line meets an axis.', ok: false, id: 'e.why.axis', mc: MC.intercept as string | undefined, say: '(7, 0) is where the first line meets the x-axis. But 7 − 0 = 7, not 1: it is on one line only.' },
      { t: 'Any point on one of the lines works.', ok: false, id: 'e.why.one', mc: MC.oneCond as string | undefined, say: '(5, 2) is on the first line: 5 + 2 = 7. But 5 − 2 = 3, not 1. A solution has to fit both.' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, j) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, i) => { b.classList.remove('right', 'nope'); if (i === j) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the crossing point the solution of the system?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'Quick check: why is the crossing point the solution of the system?', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'Four steps. Press each one: the graph moves first, then the notation.', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: y = 2x − 1, x + y = 8 (faded from the end) =====================
const T1 = ySlope(2, -1), T2 = lin(1, 1, 8);
function partTurn(): void {
  tr.reset('t.');
  const B = SysPlane({ win: { x0: -1, y0: -2, x1: 8, y1: 9 } }, PLANE_AREA);
  const rows = alignRows([
    { key: 't.R1', t: 'y = 2x - 1', y: 150, col: 'first' }, { key: 't.R2', t: 'x + y = 8', y: 240, col: 'second' },
    { key: 't.W2', t: '3x - 1 = 8', y: 460 }, { key: 't.W3', t: '3x = 9', y: 550 }, { key: 't.W4', t: 'x = 3', y: 640, col: 'link' },
  ], 74);
  rows.push(centred('t.W1', 'x + \\cssId{p}{(2x - 1)} = 8', 370, 74, undefined, { p: { col: 'first' } }), centred('t.W5', 'y = 2(3) - 1 = 5', 730, 74));
  const P = centred('t.P', '(x, y) = (3, 5)', 860, 80, 'link');
  const state = (): SysState => ({
    grid: 1,
    lines: [{ L: T1, col: 'first', k: k('t.L1') }, { L: T2, col: 'second', k: k('t.L2') }],
    guides: [{ x: 3, col: 'link', k: k('t.gx') }, { y: 5, col: 'link', k: k('t.gy') }],
    marks: [{ p: [3, 5], col: 'link', k: k('t.X'), ring: k('t.Xr'), label: '(3, 5)', big: true }],
  });
  setScene({ table: NOTABLE, lines: [...rows, P], leads: [], model: c => B.draw(c, state()) });
  let step = 0;
  const STEPS = [
    { t: 'Graph both lines', why: 'Done for you.' },
    { t: 'Substitute', why: 'Your step.' },
    { t: `Solve for ${X}`, why: 'Your step.' },
    { t: `Find ${Y}, give the pair`, why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, html('strong', '', s.t), html('span', 'why', s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: substitution'), voiced('t.intro', `Solve <b class="a">${Y} = 2${X} − 1</b> and <b class="b">${X} + ${Y} = 8</b>. The graph is done for you; the algebra is yours.`), plan, work);
  seq(async alive => {
    tr.set('t.R1', 1, 0.9, 0.3); tr.set('t.R2', 1, 0.9, 0.9);
    tr.set('t.L1', 1, 1.3, 1.2); tr.set('t.L2', 1, 1.3, 2.2); await wait(3.8); if (!alive()) return;
    step = 1; drawPlan(); askSub();
  });
  function askSub(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: `${X} + (2${X} − 1) = 8`, ok: true, id: 't.sub.ok', mc: undefined as string | undefined, say: `Yes: ${Y} is the whole 2${X} − 1, so it goes in with its parentheses.` },
      { t: `${X} + 2${X} = 8`, ok: false, id: 't.sub.first', mc: MC.firstTerm as string | undefined, say: `${Y} equals all of 2${X} − 1, not just 2${X}. Keep the − 1.` },
      { t: `${Y} + (2${X} − 1) = 8`, ok: false, id: 't.sub.wrong', mc: undefined as string | undefined, say: `The first equation tells what ${Y} is, so ${Y} is the letter you replace.` },
    ];
    let done = false;
    opts.forEach((o, j) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, i) => { b.classList.remove('right', 'nope'); if (i === j) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.sub', prompt: 'y = 2x − 1 into x + y = 8: which equation?', board: 'x + y = 8', response: o.t.replace(/<[^>]+>/g, ''), expected: 'x + (2x − 1) = 8', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.W1', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('t.W2', 1, 0.9); await wait(1.1); if (!alive()) return;
        step = 2; drawPlan(); askX();
      });
    })));
    work.replaceChildren(voiced('t.sub', `Put the first equation into the second: ${Y} is replaced by 2${X} − 1. Which equation do you get?`), bx, fbHost);
  }
  function askX(): void {
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false, 'Type a number first.')); return; }
      const v = r.v, right = v === 3;
      const mc = undefined;
      ctx.store.log({ part: 'turn', item: 'turn.x', prompt: '3x − 1 = 8: x = ?', board: '3x - 1 = 8', response: v, expected: 3, correct: right, mc });
      if (!right) {
        fbHost.replaceChildren(Math.abs(v - 7 / 3) < 0.01 ? voicedFb('t.x.sign', false, `3${X} − 1 = 8: add 1 on both sides, so 3${X} = 9.`)
          : v === 9 ? voicedFb('t.x.nine', false, `9 is 3${X}. One more step: divide by 3.`)
            : voicedFb('t.x.no', false, `Add 1 on both sides, then divide by 3.`));
        return;
      }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.x.ok', true, `Yes: 3${X} = 9, so <b class="s">${X} = 3</b>. That is the line ${X} = 3, through the crossing.`));
      seq(async alive => {
        tr.set('t.W3', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('t.W4', 1, 0.8); tr.set('t.gx', 1, 1.2, 0.3); await wait(1.7); if (!alive()) return;
        step = 3; drawPlan(); askPair();
      });
    }
    work.replaceChildren(voiced('t.x', `Solve 3${X} − 1 = 8. ${X} = ?`), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askPair(): void {
    const fbHost = h('div'), inp = pairInput(`(${X}, ${Y}) = (`, ',', () => check(), ')'), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(voicedFb('t.empty2', false, 'Type both numbers of the pair.')); return; }
      const right = r.x === 3 && r.y === 5;
      const mc = r.x === 5 && r.y === 3 ? MC.reversed : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.pair', prompt: 'x = 3: what is the solution (x, y)?', board: 'y = 2x - 1', response: r, expected: { x: 3, y: 5 }, correct: right, mc });
      if (!right) {
        fbHost.replaceChildren(mc ? voicedFb('t.pair.rev', false, `Right numbers, wrong order: ${X} comes first in (${X}, ${Y}).`)
          : r.x === 3 ? voicedFb('t.pair.y', false, `${X} = 3 is right. Put it into ${Y} = 2${X} − 1 to find ${Y}.`)
            : voicedFb('t.pair.no', false, `${X} = 3. Put it into ${Y} = 2${X} − 1, then write (${X}, ${Y}).`));
        return;
      }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.pair.ok', true, `Yes: ${Y} = 2(3) − 1 = 5. The solution is <b class="s">(3, 5)</b>, right where the lines cross.`));
      seq(async alive => {
        tr.set('t.W5', 1, 0.9); tr.set('t.gy', 1, 1.2, 0.3); await wait(1.6); if (!alive()) return;
        tr.set('t.X', 1, 0.6); tr.set('t.P', 1, 1.0); void bump('t.Xr', alive); await wait(1.6); if (!alive()) return;
        step = 4; drawPlan(); fbHost.append(callback());
      });
    }
    work.replaceChildren(voiced('t.pair', `Now find ${Y} and give the solution as a pair.`), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const text: Record<string, string> = {
      'q.cb.right': 'At the start you picked (4, 3), and you were right: it is the one point on both lines.',
      'q.cb.one': 'At the start you picked (5, 2). It fits the first equation, but not the second. A solution has to fit both.',
      'q.cb.rev': 'At the start you picked (3, 4). Those are the right numbers in the wrong order: x comes first.',
      'q.cb.none': 'A solution of a system is the one pair that fits both equations: where the lines cross.',
    };
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, text[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Riley's y = 2x + 3, y = 2x − 1 =====================
const P1 = ySlope(2, 3), P2 = ySlope(2, -1);
function partProve(): void {
  tr.reset('p.');
  const B = SysPlane({ win: { x0: -4, y0: -6, x1: 4, y1: 8 } }, PLANE_AREA);
  const rows = alignRows([
    { key: 'p.R1', t: 'y = 2x + 3', y: 130, col: 'first' }, { key: 'p.R2', t: 'y = 2x - 1', y: 215, col: 'second' },
    { key: 'p.S1', t: '2x + 3 = 2x - 1', y: 320, col: 'dim' }, { key: 'p.S2', t: '3 = -1', y: 405, col: 'dim' },
    { key: 'p.S3', t: 'x = 0,\\ (0, 3)', y: 490, col: 'dim' },
    { key: 'p.C1', t: '2(0) - 1 = -1 \\neq 3', y: 620 },
  ], 70);
  const C2 = centred('p.C2', '\\text{slopes } 2 \\text{ and } 2,\\ \\text{gap } 4', 720, 64);
  const C3 = centred('p.C3', '\\text{no solution}', 850, 80, 'link');
  const S3 = rows[4]!;
  const extra = (c: Canvas) => strikeLine(c, S3, k('p.strike'));
  const state = (): SysState => {
    const marks: SysMark[] = [
      { p: [0, 3], col: 'pick', k: k('p.riley'), ring: k('p.rr'), label: '(0, 3)' },
      { p: [0, -1], col: 'second', k: k('p.other'), label: '(0, −1)' },
    ];
    return {
      grid: 1, lines: [{ L: P1, col: 'first', k: k('p.L1') }, { L: P2, col: 'second', k: k('p.L2') }],
      gaps: { L1: P1, L2: P2, xs: [-2, -0.75, 0.75, 2], col: 'pick', k: k('p.gap') }, marks,
    };
  };
  setScene({ table: NOTABLE, lines: [...rows, C2, C3], leads: [], model: c => B.draw(c, state()), extra });
  tr.set('p.L1', 1, 1.2, 0.3); tr.set('p.L2', 1, 1.2, 0.9); tr.set('p.R1', 1, 0.8, 0.3); tr.set('p.R2', 1, 0.8, 0.9);
  tr.set('p.S1', 1, 0.9, 1.8); tr.set('p.S2', 1, 0.8, 2.5); tr.set('p.S3', 1, 0.8, 3.1); tr.set('p.riley', 1, 0.5, 3.4);
  const CHIPS = [
    { t: 'It is on the first line, but 2(0) − 1 = −1, not 3.', fits: 0 },
    { t: 'Both lines have slope 2 and different intercepts, 3 and −1: they are parallel.', fits: 1 },
    { t: '3 = −1 is false whatever x is, so no pair makes both equations true.', fits: 2 },
    { t: 'When the x’s cancel, x = 0.', fits: -1, mc: MC.zeroVsNone, id: 'p.no.zero', say: 'The x’s cancelling does not make x zero. It left 3 = −1, a false statement, whatever x is.' },
    { t: 'Parallel lines meet if you draw them far enough.', fits: -1, mc: MC.offscreen, id: 'p.no.far', say: 'The gap between these lines is 4 everywhere. Draw them as far as you like: it never closes.' },
  ];
  const CLAIMS = [
    `Riley’s point <b>(0, 3)</b> is not a solution of the system,`,
    'The two lines never meet,',
    'So the system has <b class="s">no solution</b>,',
  ];
  const SAYC = [
    `Right. (0, 3) is on the first line only. At ${X} = 0, the second line is at −1.`,
    'Right. Same slope, different starting points: the gap between the lines is 4 everywhere.',
    'Right. 3 = −1 is false for every x, so no pair fits both. That is what parallel lines look like in algebra.',
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
        tr.set('p.rr', 1, 0.5); await wait(0.6); if (!alive()) return;
        tr.set('p.other', 1, 0.6); await wait(0.8); if (!alive()) return;
        tr.set('p.C1', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); tr.set('p.rr', 0, 0.6, 0.6);
      }
      if (n === 2) { tr.set('p.gap', 1, 1.8); await wait(1.4); if (!alive()) return; tr.set('p.C2', 1, 1.0); }
      if (n === 3) {
        tr.set('p.C3', 1, 1.0); await wait(1.4); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true, 'That’s a proof: three claims, each with its reason, and the graph backs every one. When the letters cancel and leave a false statement, there is no solution.'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: y = 2x + 3, y = 2x − 1 → 3 = −1, so x = 0 and the solution is (0, 3). Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.zeroVsNone : undefined });
    proofHost.replaceChildren(
      right ? voiced('p.test', 'Let’s test it. Build the argument, and see where it leads.') : voiced('p.build', 'Now prove it. Fill each “because” with the reason that makes the line true.'),
      chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'),
    voiced('p.intro', `Riley solves <b class="a">${Y} = 2${X} + 3</b> and <b class="b">${Y} = 2${X} − 1</b>: setting them equal, the ${X}’s cancel and leave 3 = −1. Riley writes ${X} = 0, so the solution is (0, 3). Is Riley right?`),
    h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as SysItem),
  });
}
function showItem(item: SysItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture?.sys;
  const made = pic ? tryBlock(() => SysPlane({ win: pic.win, gx: pic.gx, gy: pic.gy, names: pic.names }, PLANE_AREA)) : null;
  if (pic && made && made.ok) {
    const B: SysBlock = made.value;
    const cols: Paint[] = ['first', 'second'];
    // the system (two rows) aligned on =; any further given rows (worked steps to check) left-aligned under it
    const eqRows = [...alignRows(pic.eqs.slice(0, 2).map((t, i) => ({ key: 'x.E' + i, t, y: 150 + i * 96, col: cols[i] })), 74),
      ...pic.eqs.slice(2).map((t, i) => line('x.E' + (i + 2), t, 150 + (i + 2) * 96, 70))];
    const top = 150 + pic.eqs.length * 96 + 40;
    const step = Math.min(92, (960 - top) / Math.max(1, pic.work.length));
    const work = pic.work.map((t, i) => line('x.W' + i, t, top + i * step, 64));
    const at = (w: 'start' | 'solve') => (w === 'start' ? 'x.start' : 'x.solve');
    const state = (): SysState => ({
      grid: 1,
      lines: pic.lines.map(l => ({ L: l.L, col: l.col, k: k(at(l.at)), dashed: l.dashed })),
      guides: (pic.guides ?? []).map(g => ({ x: g.x, y: g.y, col: g.col, k: k(at(g.at)) })),
      gaps: pic.gaps && pic.lines.length >= 2 ? { L1: pic.lines[0]!.L, L2: pic.lines[1]!.L, xs: pic.gaps, col: 'pick', k: k('x.gap') } : null,
      marks: [
        ...(pic.pts ?? []).map(p => ({ p: p.p, col: p.col, k: k(at(p.at)), label: p.label } as SysMark)),
        ...(pic.cross ? [{ p: pic.cross, col: 'link', k: k('x.X'), ring: k('x.Xr'), label: pic.crossLabel ?? pairP(pic.cross), big: true } as SysMark] : []),
      ],
    });
    setScene({ table: NOTABLE, lines: [...eqRows, ...work], leads: [], model: c => B.draw(c, state()) });
    tr.set('x.start', 1, 1.0, 0.2);
    eqRows.forEach((L, i) => tr.set(L.key, 1, 0.8, 0.1 + i * 0.4));
    return {
      solve: async alive => {
        tr.set('x.solve', 1, 1.3); await wait(1.4); if (!alive()) return;
        if (pic.gaps) { tr.set('x.gap', 1, 1.4); await wait(1.2); if (!alive()) return; }
        if (pic.cross) { tr.set('x.X', 1, 0.6); void bump('x.Xr', alive); await wait(0.8); if (!alive()) return; }
        for (const L of work) { tr.set(L.key, 1, 0.8); await wait(0.9); if (!alive()) return; }
      },
    };
  }
  const big = box(260, 230, 1660, 790);
  setStage({ table: NOTABLE, lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['x + y = 7 \\cssId{eq}{=} \\neq \\checkmark \\dots', '\\tfrac{x}{2} + \\tfrac{y}{3}', '\\text{add: subtract: no solution slopes gap}', '\\Rightarrow \\times', '\\$12'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
