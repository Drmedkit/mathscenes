// rotations.ts: "Rotate: quarter turn and half turn" (grades 7-8, 8.G.A.1) on the shared lesson runtime.
//   1 The question   an L-block on a clear sheet pinned at P makes a quarter turn clockwise: 3 pictures (one right,
//                    one turned about its own corner, one flipped down) + how sure
//   2 Worked example Pin it -> Turn one corner -> Turn every corner -> Join and check; the steps of a corner turn like a
//                    pointer, every symbol on the board is linked to its dot; one "why did C move farther than B?"
//   3 Your turn      a triangle, a quarter turn counterclockwise; pin and corner A are given, the kid turns B (tap a
//                    dot), then checks what the turn kept; the callback to part 1
//   4 Prove it       Riley: "my upside-down L is a half turn"; a because-chain from reason chips (corner order)
//   5 Practice       all 22 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/rotations/script.ts (panel HTML) = voice/lines.json (spoken text).
import type { Canvas } from '../../src/core/draw';
import { strike } from '../../src/core/draw';
import { type Box, box, padBox } from '../../src/core/math';
import { frame } from '../../src/blocks/block';
import { BOARD, MF, line, type Lead, type Line, partOf, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { wash } from '../../src/lesson/wash';
import { FAMILY_NAMES, GENS, type TurnItem } from '../../src/lesson/topics/rotations/items';
import { PLAN } from '../../src/lesson/topics/rotations/plan';
import { LINES } from '../../src/lesson/topics/rotations/script';
import {
  type Fig, type GridPic, type Mark, type Motion, type V, type Win, fitWin, moveFig, picPoints, rotA, rotQ, vadd,
} from '../../src/lesson/topics/rotations/turnMaths';
import {
  type DotState, type PanelState, type View, arrowStart, drawCandDot, drawClockRef, drawFig, drawGridPic, drawMarks, drawMirror,
  drawOrderArrow, drawPanels, drawPin, drawPoint, drawSheet, drawSpinner, drawString, drawTilt, drawTurnArrow, dotPaper, px, viewOf,
} from '../../src/lesson/topics/rotations/TurnBoard';
import { arrow } from '../../src/core/draw';
import { E } from '../../src/core/easing';

const SLUG = 'rotations';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
const T = (id: string) => LINES[id]?.html ?? id;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function say_(id: string, cls = '', tag: keyof HTMLElementTagNameMap = 'p'): HTMLElement { void ctx.say(id); return html(tag, cls, T(id)); }
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, T(id), extra); };
const NOTABLE = 1080;

// ---------- canvas taps (pick a dot by tapping it) ----------
let onTap: ((x: number, y: number) => void) | null = null;
let tapWired = false;
function wireTaps(): void {
  if (tapWired) return;
  tapWired = true;
  const cv = document.getElementById('cv') as HTMLCanvasElement;
  cv.addEventListener('click', e => {
    if (!onTap) return;
    const r = cv.getBoundingClientRect();
    onTap(((e.clientX - r.left) / r.width) * 1920, ((e.clientY - r.top) / r.height) * 1080);
  });
}
function tapDots(v: View, dots: readonly Mark[], pickIt: (label: string) => void): void {
  onTap = (x, y) => {
    for (const d of dots) { const [X, Y] = px(v, d.p); if (Math.hypot(X - x, Y - y) < Math.max(40, v.u * 0.45)) { pickIt(d.label); return; } }
  };
}

/** the dot paper sits on a slightly lighter sheet of paper on the dusk wall */
function paper(c: Canvas, v: View): void {
  const b = padBox(v.box, Math.min(46, v.u * 0.6));
  wash(c, [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]], '#1B1F45', { seed: 12, rough: 1.2, ink: null, shade: 0.08 });
}
const leadTo = (v: View, p: V, r = 18): (() => Box) => () => { const [x, y] = px(v, p); return box(x - r, y - r, x + r, y + r); };

// ======================================================================================================
// The L-block of parts 1 and 2: pin P at (0, 0), a quarter turn clockwise. Corners A -> B -> C clockwise.
const P0: V = [0, 0];
const LBLOCK: Fig = { pts: [[1, 1], [3, 1], [3, 2], [2, 2], [2, 4], [1, 4]], marks: [{ p: [3, 1], label: 'A' }, { p: [1, 1], label: 'B' }, { p: [1, 4], label: 'C' }] };
const TURN1: Motion = { kind: 'turn', c: P0, q: -1 };
const IMG1 = moveFig(TURN1, LBLOCK, true);
const WIN1: Win = { x0: -3, y0: -5, x1: 6, y1: 5 };
/** the three pictures of part 1 */
const Q_CARDS: { label: string; fig: Fig; mc: string; cb: string }[] = [
  { label: '1', fig: moveFig({ kind: 'turn', c: [3, 1], q: -1 }, LBLOCK), mc: 'mc.transformations.rotates-about-wrong-center', cb: 't.cb-center' },
  { label: '2', fig: IMG1, mc: '', cb: 't.cb-right' },
  { label: '3', fig: moveFig({ kind: 'flip', line: { kind: 'h', y: 0 } }, LBLOCK), mc: 'mc.transformations.reflection-treated-as-rotation', cb: 't.cb-flip' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.'); onTap = null;
  const v = viewOf(WIN1, MF);
  const pic: GridPic = { kind: 'grid', win: WIN1, pin: P0, pinLabel: 'P', sheet: true, start: LBLOCK, arrows: [{ q: -1, r: 0.95 }], cands: Q_CARDS.map(c => ({ label: c.label, fig: c.fig })) };
  pic.win = fitWin(picPoints(pic), 6);   // the three pictures share one tight window (bigger in their panels)
  const st: Record<string, PanelState> = {};
  setScene({
    table: NOTABLE, lines: [], leads: [],
    model: c => { paper(c, v); drawGridPic(c, v, { ...pic, win: WIN1, cands: undefined }, { k: tr.k('q.fig') }); },
    extra: c => drawPanels(c, pic, box(BOARD.x0 + 20, BOARD.y0 + 30, BOARD.x1 - 20, BOARD.y1 - 20), st, tr.k('q.panels')),
  });
  tr.set('q.fig', 1, 1.0); tr.set('q.panels', 1, 0.9, 1.0);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = Q_CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'An L-block on a clear sheet pinned at P makes a quarter turn clockwise about P. Which picture shows where it lands?', response: `picture ${p.label}`, expected: 'picture 2', correct: p.label === '2', mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  Q_CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.label}<small>picture</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'The block turns'), say_('q.intro'), html('p', '', T('q.ask')), cards, html('div', 'label', T('q.sure')), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: the L-block, a quarter turn clockwise about P =====
/** the steps of a corner from the pin (horizontal, then vertical), turned by `ang` about the pin as one rigid piece */
function turnedSteps(c: Canvas, v: View, pin: V, d: V, ang: number, k: number, a = 1, nums = true): void {
  if (k <= 0 || a <= 0) return;
  const mid = rotA([pin[0] + d[0], pin[1]], pin, ang), to = rotA(vadd(pin, d), pin, ang);
  const kh = d[0] ? Math.min(1, k * 2) : 0, kv = d[1] ? Math.max(0, Math.min(1, k * 2 - (d[0] ? 1 : 0))) : 0;
  const lw = Math.max(4, v.u * 0.06), head = Math.max(16, v.u * 0.26);
  if (kh > 0) arrow(c, [px(v, pin), px(v, mid)], kh, { col: 'second', lw, head, alpha: a });
  if (kv > 0) arrow(c, [px(v, mid), px(v, to)], kv, { col: 'second', lw, head, alpha: a });
  if (!nums || k < 1) return;
  const lab = (t: string, at: V, away: V) => {
    const [X, Y] = px(v, at), [AX, AY] = px(v, away);
    let dx = X - AX, dy = Y - AY; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const { g } = c; g.save(); g.globalAlpha *= a; g.font = `700 60px "Segoe UI", system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 9; g.strokeStyle = 'rgba(16,18,42,0.92)'; g.strokeText(t, X + dx * 42, Y + dy * 42); g.fillStyle = '#4FD3CF'; g.fillText(t, X + dx * 42, Y + dy * 42); g.restore();
  };
  if (d[0]) lab(String(Math.abs(d[0])), rotA([pin[0] + d[0] / 2, pin[1]], pin, ang), rotA([pin[0] + d[0] / 2, pin[1] + Math.sign(d[1] || 1)], pin, ang));
  if (d[1]) lab(String(Math.abs(d[1])), rotA([pin[0] + d[0], pin[1] + d[1] / 2], pin, ang), rotA([pin[0] + d[0] - Math.sign(d[0] || 1), pin[1] + d[1] / 2], pin, ang));
}
interface ExampleSetup {
  pre: string; v: View; pin: V; fig: Fig; q: number; first: Mark; img: Fig;
  /** extra painters on top (candidate dots, order arrows) */ top?: (c: Canvas) => void;
}
/** the shared scene of parts 2 and 3: sheet + figure, strings and steps that swing, image dots, the sheet's final turn */
function exampleModel(S: ExampleSetup): (c: Canvas) => void {
  const { pre, v, pin, fig, q, first, img } = S;
  const k = (s: string) => tr.k(pre + s);
  const ang = (s: string) => (q * Math.PI) / 2 * E.smooth(k(s));
  const others = fig.marks.filter(m => m.label !== first.label);
  return c => {
    paper(c, v);
    dotPaper(c, v, 1);
    const around = [...fig.pts, pin];
    const ks = k('sheetTurn');
    drawSheet(c, v, around, pin, 0, k('sheet') * (ks > 0 ? 0.45 : 1));
    drawFig(c, v, fig.pts, 'first', { alpha: ks > 0 ? 0.55 : 1, seed: 4 });
    drawMarks(c, v, fig.marks, fig.pts, 'first', ks > 0 ? 0.6 : 1);
    // the first corner: its string and its steps swing as one piece
    if (k('str1') > 0) {
      const a1 = ang('turn1'), end = rotA(first.p, pin, a1);
      drawString(c, v, pin, end, k('str1') * (1 - 0.6 * k('dim1')));
      turnedSteps(c, v, pin, [first.p[0] - pin[0], first.p[1] - pin[1]], a1, k('steps1'), 1 - k('dim1'), k('turn1') <= 0 || k('turn1') >= 1);
      if (k('turn1') > 0) drawTurnArrow(c, v, pin, 1.25, arrowStart(pin, [first.p]), q * Math.min(1, k('turn1')), 1, 'second', 1 - k('dim1'));
    }
    // the other corners swing together
    if (k('str2') > 0) for (const m of others) drawString(c, v, pin, rotA(m.p, pin, ang('turn2')), k('str2') * (1 - 0.6 * k('dim2')));
    // the image dots
    const imgOf = (L: string) => img.marks.find(m => m.label.startsWith(L))!;
    // once the sheet has landed, the corner letters of the image take over from the dots' letters
    const dl = ks >= 1 ? 0 : undefined;
    if (k('dot1') > 0) drawPoint(c, v, { p: imgOf(first.label).p, label: first.label + '′' }, 'link', k('dot1'), dl);
    if (k('dot2') > 0) for (const m of others) drawPoint(c, v, { p: imgOf(m.label).p, label: m.label + '′' }, 'link', k('dot2'), dl);
    // the check: the whole sheet turns and lands on the dots
    if (ks > 0) {
      drawSheet(c, v, around, pin, ang('sheetTurn'), 0.9);
      const P = fig.pts.map(p => rotA(p, pin, ang('sheetTurn')));
      drawFig(c, v, P, ks >= 1 ? 'link' : 'first', { alpha: 0.95, seed: 8 });
      if (ks >= 1) drawMarks(c, v, img.marks, img.pts, 'link', 1);
    }
    if (k('order') > 0) { drawOrderArrow(c, v, fig.marks, 'first', k('order')); drawOrderArrow(c, v, img.marks, 'link', k('order')); }
    drawPin(c, v, pin, 'P', 1, k('pinGlow'));
    S.top?.(c);
  };
}

function partExample(): void {
  tr.reset('e.'); onTap = null;
  const v = viewOf(WIN1, MF);
  const A = LBLOCK.marks[0]!;
  const S: ExampleSetup = { pre: 'e.', v, pin: P0, fig: LBLOCK, q: -1, first: A, img: IMG1 };
  const y0 = BOARD.y0;
  const tags = { p: { col: 'second' as const }, a: { col: 'first' as const }, s: { col: 'link' as const } };
  const L0 = line('e.L0', '\\tfrac{1}{4}\\ \\text{turn}\\ \\circlearrowright\\ \\text{about}\\ \\cssId{p}{P}', y0 + 110, 76, tags);
  const L1 = line('e.L1', '\\cssId{a}{A}\\colon\\ 3\\ \\text{right},\\ 1\\ \\text{up}', y0 + 270, 68, tags);
  const L2 = line('e.L2', '\\cssId{s}{A\'}\\colon\\ 1\\ \\text{right},\\ 3\\ \\text{down}', y0 + 380, 68, tags);
  const L3 = line('e.L3', '\\cssId{s}{B\'}\\colon\\ 1\\ \\text{right},\\ 1\\ \\text{down}', y0 + 520, 62, tags);
  const L4 = line('e.L4', '\\cssId{s}{C\'}\\colon\\ 4\\ \\text{right},\\ 1\\ \\text{down}', y0 + 620, 62, tags);
  const L5 = line('e.L5', '\\text{every side kept}', y0 + 760, 62, undefined, 'link');
  const L5b = line('e.L5b', 'A \\to B \\to C\\ \\circlearrowright', y0 + 860, 62, undefined, 'link');
  const imgP = (L: string) => IMG1.marks.find(m => m.label.startsWith(L))!.p;
  const leads: Lead[] = [
    { key: 'e.ldP', from: () => partOf(L0, 'p'), to: leadTo(v, P0, 16), col: 'second' },
    { key: 'e.ldA', from: () => partOf(L2, 's'), to: leadTo(v, imgP('A')), col: 'link' },
  ];
  setScene({ table: NOTABLE, model: exampleModel(S), lines: [L0, L1, L2, L3, L4, L5, L5b], leads });
  tr.jump('e.sheet', 1);

  let step = 0;
  const STEPS = [
    { t: 'Pin it', why: 'The center stays still.', act: 'Pin it' },
    { t: 'Turn one corner', why: 'Its steps from P turn like a pointer.', act: 'Turn A' },
    { t: 'Turn every corner', why: 'Same amount, same way, same pin.', act: 'Turn B and C' },
    { t: 'Join and check', why: 'Turn the sheet: does it land on the dots?', act: 'Check it' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div');
  const after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.pinGlow', 1, 0.5); tr.set('e.L0', 1, 1.2, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('e.ldP', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.pinGlow', 0, 0.8);
      } else if (i === 1) {
        tr.set('e.ldP', 0, 0.4); tr.set('e.L0:dim', 1, 0.6);
        tr.set('e.str1', 1, 0.6); tr.set('e.steps1', 1, 1.3, 0.4); tr.set('e.L1', 1, 1.0, 0.9); await wait(2.4); if (!alive()) return;
        tr.set('e.turn1', 1, 2.2); await wait(2.4); if (!alive()) return;
        tr.set('e.dot1', 1, 0.5); tr.set('e.L2', 1, 1.0, 0.2); await wait(1.2); if (!alive()) return;
        tr.set('e.ldA', 1, 0.9); await wait(1.0);
      } else if (i === 2) {
        tr.set('e.ldA', 0, 0.4); tr.set('e.L1:dim', 1, 0.6); tr.set('e.L2:dim', 1, 0.6); tr.set('e.dim1', 1, 0.6);
        tr.set('e.str2', 1, 0.6); await wait(0.7); if (!alive()) return;
        tr.set('e.turn2', 1, 2.0); await wait(2.1); if (!alive()) return;
        tr.set('e.dot2', 1, 0.5); tr.set('e.dim2', 1, 0.8, 0.6); tr.set('e.L3', 1, 0.9, 0.2); tr.set('e.L4', 1, 0.9, 0.9); await wait(2.0);
      } else {
        tr.set('e.L3:dim', 1, 0.6); tr.set('e.L4:dim', 1, 0.6); tr.set('e.str1', 0, 0.5); tr.set('e.steps1', 0, 0.5); tr.set('e.str2', 0, 0.5);
        tr.set('e.sheetTurn', 1, 2.6, 0.3); await wait(3.0); if (!alive()) return;
        tr.set('e.order', 1, 1.2); tr.set('e.L5', 1, 1.0, 0.3); tr.set('e.L5b', 1, 1.0, 0.9); await wait(2.0);
      }
      if (!alive()) return;
      sayBox.replaceChildren(say_(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { id: 'e.w-ok', t: 'C is farther from the pin, and every point keeps its distance from the pin.', ok: true, mc: undefined as string | undefined },
      { id: 'e.w-arm', t: 'C turned more than B did.', ok: false, mc: 'mc.angles.angle-size-from-arm-length' },
      { id: 'e.w-slide', t: 'The block slid down as well as turning.', ok: false, mc: 'mc.transformations.calls-any-move-a-translation' },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...bx.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why did corner C move farther than corner B?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    void ctx.say('e.s4').then(() => ctx.say('e.why'));
    after.replaceChildren(html('div', 'label', T('e.why')), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say_('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: a triangle, a quarter turn counterclockwise about P (faded from the end) =====
const TRI: Fig = { pts: [[2, 1], [2, 3], [5, 1]], marks: [{ p: [2, 1], label: 'A' }, { p: [2, 3], label: 'B' }, { p: [5, 1], label: 'C' }] };
const TURN3: Motion = { kind: 'turn', c: P0, q: 1 };
const IMG3 = moveFig(TURN3, TRI, true);
const WIN3: Win = { x0: -5, y0: -3, x1: 6, y1: 7 };
/** where B can land: right, the clockwise way, only one step turned, one step short */
const B_DOTS: (Mark & { mc?: string; say: string; ok?: boolean })[] = [
  { p: [-3, 2], label: '1', ok: true, say: 't.b-ok' },
  { p: [3, -2], label: '2', mc: 'mc.transformations.reverses-rotation-direction', say: 't.b-rev' },
  { p: [0, 5], label: '3', mc: 'mc.transformations.rotates-one-step-component', say: 't.b-one' },
  { p: [-2, 2], label: '4', mc: 'mc.count.counts-points-not-intervals', say: 't.b-count' },
];
function partTurn(): void {
  tr.reset('t.'); onTap = null;
  if (rotQ(TRI.marks[1]!.p, P0, 1)[0] !== -3) throw new Error('your turn: B must land at 3 left, 2 up');
  const v = viewOf(WIN3, MF);
  const A = TRI.marks[0]!;
  const dotSt: Record<string, DotState> = {};
  let showDots = false;
  const S: ExampleSetup = { pre: 't.', v, pin: P0, fig: TRI, q: 1, first: A, img: IMG3,
    top: c => { if (showDots) for (const d of B_DOTS) drawCandDot(c, v, d, dotSt[d.label] ?? 'idle', tr.k('t.dots')); } };
  const y0 = BOARD.y0;
  const tags = { p: { col: 'second' as const }, a: { col: 'first' as const }, s: { col: 'link' as const } };
  const L0 = line('t.L0', '\\tfrac{1}{4}\\ \\text{turn}\\ \\circlearrowleft\\ \\text{about}\\ \\cssId{p}{P}', y0 + 110, 76, tags);
  const L1 = line('t.L1', '\\cssId{a}{A}\\colon\\ 2\\ \\text{right},\\ 1\\ \\text{up}', y0 + 260, 66, tags);
  const L2 = line('t.L2', '\\cssId{s}{A\'}\\colon\\ 1\\ \\text{left},\\ 2\\ \\text{up}', y0 + 360, 66, tags);
  const L3 = line('t.L3', '\\cssId{a}{B}\\colon\\ 2\\ \\text{right},\\ 3\\ \\text{up}', y0 + 500, 62, tags);
  const L4 = line('t.L4', '\\cssId{s}{B\'}\\colon\\ 3\\ \\text{left},\\ 2\\ \\text{up}', y0 + 600, 62, tags);
  const L5 = line('t.L5', '\\cssId{s}{C\'}\\colon\\ 1\\ \\text{left},\\ 5\\ \\text{up}', y0 + 700, 62, tags);
  const L6 = line('t.L6', '\\text{every side kept}', y0 + 780, 60, undefined, 'link');
  const L6b = line('t.L6b', 'A \\to B \\to C\\ \\circlearrowright', y0 + 870, 60, undefined, 'link');
  const leads: Lead[] = [{ key: 't.ldB', from: () => partOf(L4, 's'), to: leadTo(v, [-3, 2]), col: 'link' }];
  setScene({ table: NOTABLE, model: exampleModel(S), lines: [L0, L1, L2, L3, L4, L5, L6, L6b], leads });
  tr.jump('t.sheet', 1);

  let step = 0;
  const STEPS = [
    { t: 'Pin it', why: 'Done for you.' },
    { t: 'Turn one corner', why: 'Done for you.' },
    { t: 'Turn every corner', why: 'Your step.' },
    { t: 'Join and check', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'A triangle turns'), say_('t.intro'), plan, work);
  wireTaps();

  seq(async alive => {
    await wait(1.0); if (!alive()) return;
    tr.set('t.pinGlow', 1, 0.5); tr.set('t.L0', 1, 1.1, 0.2); await wait(1.6); if (!alive()) return;
    tr.set('t.pinGlow', 0, 0.6); step = 1; drawPlan();
    tr.set('t.L0:dim', 1, 0.6); tr.set('t.str1', 1, 0.6); tr.set('t.steps1', 1, 1.2, 0.3); tr.set('t.L1', 1, 0.9, 0.8); await wait(2.0); if (!alive()) return;
    tr.set('t.turn1', 1, 2.0); await wait(2.2); if (!alive()) return;
    tr.set('t.dot1', 1, 0.5); tr.set('t.L2', 1, 0.9, 0.2); await wait(1.4); if (!alive()) return;
    tr.set('t.L1:dim', 1, 0.6); tr.set('t.L2:dim', 1, 0.6); tr.set('t.dim1', 1, 0.6);
    step = 2; drawPlan(); askB();
  });

  function askB(): void {
    const fbHost = h('div');
    showDots = true; tr.set('t.dots', 1, 0.6); tr.set('t.L3', 1, 0.9);
    const bx = h('div', { class: 'opts dots' });
    let done = false;
    const pickB = (label: string) => {
      if (done) return;
      const d = B_DOTS.find(x => x.label === label)!;
      for (const k of Object.keys(dotSt)) delete dotSt[k];
      dotSt[label] = d.ok ? 'right' : 'wrong';
      tr.set('t.tick', 1, 0.01);
      bx.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', B_DOTS[i]!.label === label));
      ctx.store.log({ part: 'turn', item: 'turn.B', prompt: 'B is 2 right, 3 up from P. A quarter turn counterclockwise about P: which dot does B land on?', response: `dot ${label}`, expected: 'dot 1', correct: !!d.ok, mc: d.mc });
      fbHost.replaceChildren(fb(!!d.ok, d.say));
      if (!d.ok) return;
      done = true; onTap = null;
      seq(async alive => {
        tr.set('t.str2', 1, 0.5); await wait(0.5); if (!alive()) return;
        tr.set('t.turn2', 1, 1.8); await wait(1.9); if (!alive()) return;
        showDots = false; tr.set('t.dot2', 1, 0.5); tr.set('t.L4', 1, 0.9); tr.set('t.ldB', 1, 0.8, 0.9); tr.set('t.L5', 1, 0.9, 1.4); await wait(2.6); if (!alive()) return;
        fbHost.append(say_('t.c-auto'));
        step = 3; drawPlan(); askCheck();
      });
    };
    B_DOTS.forEach(d => bx.append(btn(`Dot ${d.label}`, () => pickB(d.label))));
    tapDots(v, B_DOTS, pickB);
    work.replaceChildren(say_('t.b-ask'), html('p', 'dim', T('t.b-tap')), bx, fbHost);
  }
  function askCheck(): void {
    const fbHost = h('div');
    const opts = [
      { id: 't.k-ok', t: 'Every side kept its length, and A → B → C still goes clockwise.', ok: true, mc: undefined as string | undefined },
      { id: 't.k-proto', t: 'It points left now, so it is a different triangle.', ok: false, mc: 'mc.shapes.prototype-only-recognition' },
      { id: 't.k-one', t: 'Only A has to land right; the rest follows.', ok: false, mc: 'mc.transformations.one-point-checked-for-whole-figure' },
    ];
    const bx = h('div', { class: 'opts' });
    opts.forEach(o => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...bx.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      ctx.store.log({ part: 'turn', item: 'turn.check', prompt: 'The sheet turned onto the dots. What did the turn keep?', response: o.t, correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fb(o.ok, o.id));
      if (!o.ok) return;
      bx.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      step = 4; drawPlan();
      seq(async alive => {
        tr.set('t.order', 1, 1.2); tr.set('t.L6', 1, 1.0, 0.4); tr.set('t.L6b', 1, 1.0, 0.9); await wait(2.0); if (!alive()) return;
        fbHost.append(callback());
      });
    })));
    tr.set('t.L3:dim', 1, 0.5); tr.set('t.L4:dim', 1, 0.5); tr.set('t.L5:dim', 1, 0.5); tr.set('t.ldB', 0, 0.4);
    tr.set('t.str1', 0, 0.5); tr.set('t.steps1', 0, 0.5); tr.set('t.str2', 0, 0.5);
    tr.set('t.sheetTurn', 1, 2.4, 0.3);
    work.replaceChildren(say_('t.k-ask'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick;
    const id = pick === null ? 't.cb-none' : Q_CARDS[pick]!.cb;
    c.innerHTML = (pick === null ? '' : `At the start you picked picture ${Q_CARDS[pick]!.label} and you were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `) + T(id);
    void ctx.say(id);
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Riley's upside-down L =====
const RL: Fig = { pts: [[-4, 1], [-2, 1], [-2, 2], [-3, 2], [-3, 4], [-4, 4]], marks: [{ p: [-2, 1], label: 'A' }, { p: [-4, 1], label: 'B' }, { p: [-4, 4], label: 'C' }] };
const MLINE = { kind: 'h' as const, y: 0 };
const RILEY = moveFig({ kind: 'flip', line: MLINE }, RL);
const WIN4: Win = { x0: -6, y0: -5, x1: 3, y1: 5 };
function partProve(): void {
  tr.reset('p.'); onTap = null;
  const v = viewOf(WIN4, MF);
  const flipAt = (p: V, k: number): V => { const f = (1 - Math.cos(Math.PI * k)) / 2; return [p[0], p[1] + (-2 * p[1]) * f]; };
  const y0 = BOARD.y0;
  const J = line('p.J', '\\text{Riley: a}\\ \\cssId{w}{\\tfrac{1}{2}\\ \\text{turn}}', y0 + 110, 78);
  const C1 = line('p.C1', '\\text{a turn keeps}\\ \\circlearrowright', y0 + 280, 66, undefined, 'link');
  const C2 = line('p.C2', '\\cssId{a}{\\circlearrowright}\\ \\text{became}\\ \\cssId{b}{\\circlearrowleft}', y0 + 420, 70, { a: { col: 'first' }, b: { col: 'pick' } });
  const H = line('p.hero', '\\text{a flip across}\\ \\cssId{m}{m}', y0 + 600, 80, { m: { col: 'second' } });
  setScene({
    table: NOTABLE, lines: [J, C1, C2, H], leads: [],
    model: c => {
      paper(c, v); dotPaper(c, v);
      drawMirror(c, v, MLINE, 'm', 1);
      drawFig(c, v, RILEY.pts, 'pick', { seed: 6 }); drawMarks(c, v, RILEY.marks, RILEY.pts, 'pick');
      const kf = tr.k('p.flip');
      if (kf > 0) {
        const m: Motion = { kind: 'flip', line: MLINE };
        drawSheet(c, v, RL.pts, [0, 0], 0, 0.8, m, E.smooth(kf));
      }
      drawFig(c, v, RL.pts, 'first', { seed: 4, alpha: kf > 0 ? 0.6 : 1 }); drawMarks(c, v, RL.marks, RL.pts, 'first');
      if (kf > 0) { const m: Motion = { kind: 'flip', line: MLINE }; drawFig(c, v, RL.pts.map(p => (kf >= 1 ? moveFig(m, { pts: [p], marks: [] }).pts[0]! : flipAt(p, kf))), 'link', { seed: 8, alpha: 0.9 }); }
      drawOrderArrow(c, v, RL.marks, 'first', tr.k('p.o1'));
      drawOrderArrow(c, v, RILEY.marks, 'pick', tr.k('p.o2'));
      // the turned sheet test: a turn of the L never lands on Riley's picture
      const kt = tr.k('p.turnTry');
      if (kt > 0) {
        // a real half turn (here about the dot (-1, 0)) lands as an L that is NOT mirrored
        const c0: V = [-1, 0], al = 1 - tr.k('p.turnFade');
        const P = RL.pts.map(p => rotA(p, c0, Math.PI * E.smooth(Math.min(1, kt))));
        drawFig(c, v, P, 'link', { ghost: true, alpha: 0.95 * al });
        if (kt >= 1) drawOrderArrow(c, v, RL.marks.map(m => ({ ...m, p: rotQ(m.p, c0, 2) })), 'link', 1, al);
        drawPin(c, v, c0, undefined, al * Math.min(1, kt * 3));
      }
    },
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  tr.set('p.J', 1, 1.0, 0.6);

  // shown in this order: the reasons mixed with the two distractors
  const CHIPS = [
    { t: 'Folding the sheet over line m puts the L exactly on Riley’s picture.', fits: 2 },
    { t: 'Upside down always means a half turn.', fits: -1, mc: 'mc.transformations.reflection-treated-as-rotation', id: 'p.x-upside' },
    { t: 'Turning the sheet never turns it over, so the corners keep their order.', fits: 0 },
    { t: 'Corner B lands on the right spot, so the whole picture matches.', fits: -1, mc: 'mc.transformations.one-point-checked-for-whole-figure', id: 'p.x-one' },
    { t: 'Trace A → B → C: clockwise in the L, counterclockwise in Riley’s picture.', fits: 1 },
  ];
  const CLAIMS = ['p.claim1', 'p.claim2', 'p.claim3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${T(id)}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: (LINES[CLAIMS[filled]!]?.say ?? ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      void ctx.say(`p.c${n}`);
      seq(async alive => {
        if (n === 1) { tr.set('p.C1', 1, 1.0); await wait(1.0); if (!alive()) return; tr.set('p.turnTry', 1, 2.2); }
        if (n === 2) { tr.set('p.turnFade', 1, 0.8); tr.set('p.C1:dim', 1, 0.5); tr.set('p.o1', 1, 1.0); await wait(1.1); if (!alive()) return; tr.set('p.o2', 1, 1.0); tr.set('p.C2', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return; tr.set('p.strike', 1, 0.6); }
        if (n === 3) {
          tr.set('p.C2:dim', 1, 0.5); tr.set('p.flip', 1, 2.4); await wait(2.6); if (!alive()) return;
          tr.set('p.hero', 1, 1.1); await wait(1.4); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    if (ch.id) { fbHost.replaceChildren(fb(false, ch.id)); return; }
    fbHost.replaceChildren(fb(false, 'p.x-other'));
  }
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: my upside-down L is a half turn of the L. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? 'mc.transformations.reflection-treated-as-rotation' : undefined });
    proofHost.replaceChildren(say_(right ? 'p.build-test' : 'p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say_('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed (runtime/practice.ts) =====
function partPractice(): void {
  tr.reset('x.'); onTap = null;
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as TurnItem),
  });
}
/** which choice the kid picked (the runtime marks it .on) and its label (the last character: "Dot 3", "Picture 2") */
function pickedLabel(item: TurnItem): string | null {
  const bs = [...document.querySelectorAll('.panel .opts button')];
  const i = bs.findIndex(b => b.classList.contains('on'));
  return i < 0 ? null : (item.choices?.[i] ?? '').slice(-1);
}
const WIDE = frame(260, 70, 1400, 940);
const CAND_MODEL = frame(50, 90, 800, 900), CAND_BOARD = box(910, 70, 1860, 1010);
function showItem(item: TurnItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  const hasBoard = item.board !== '';
  if (pic.kind === 'tilt') {
    setScene({ table: NOTABLE, lines: [], leads: [], boardBox: null, model: c => drawTilt(c, pic, box(160, 140, 1760, 900), tr.k('x.in')) });
    tr.set('x.in', 1, 0.8);
    return {};
  }
  if (pic.kind === 'spin') {
    const two = pic.spinners.length === 2, side = hasBoard || pic.clock;
    const centers: [number, number][] = two ? (side ? [[300, 520], [780, 520]] : [[600, 500], [1320, 500]]) : side ? [[530, 520]] : [[960, 520]];
    const R = two ? (side ? 200 : 300) : 330;
    const lines: Line[] = hasBoard ? [line('x.T', item.board, BOARD.y0 + 110, 72)] : [];
    const watching = pic.spinners.some(s => s.watch);
    setScene({
      table: NOTABLE, lines, leads: [], boardBox: side ? undefined : null,
      model: c => {
        pic.spinners.forEach((s, i) => {
          const solving = pic.solve && pic.solve.i === i && tr.k('x.solve') > 0;
          const turnNow = solving ? pic.solve!.turn * E.smooth(tr.k('x.solve')) : s.watch ? (s.turn ?? 0) * E.smooth(tr.k('x.watch')) : 0;
          drawSpinner(c, centers[i]![0], centers[i]![1], R, solving && !s.turn ? { ...s, turn: pic.solve!.turn } : s, { k: tr.k('x.in'), turnNow, trail: solving || s.watch ? 1 : 0, arrowK: s.watch ? 0 : solving && !s.turn ? tr.k('x.solve') : 1, ghostStart: !!(solving || s.watch) });
        });
      },
      // the clockwise reference sits on the board (drawn after the slate)
      extra: c => { if (pic.clock) drawClockRef(c, BOARD.cx, BOARD.y0 + (hasBoard ? 560 : 430), 130, tr.k('x.in')); },
    });
    tr.set('x.in', 1, 0.7); tr.set('x.T', 1, 0.8, 0.3);
    if (watching) seq(async alive => {
      await wait(0.8);
      while (alive()) {
        tr.jump('x.watch', 0); tr.set('x.watch', 1, Math.abs(pic.spinners[0]!.turn ?? 360) / 150); await wait(Math.abs(pic.spinners[0]!.turn ?? 360) / 150 + 1.6);
      }
    });
    return pic.solve ? { solve: async alive => { tr.jump('x.watch', 0); tr.set('x.solve', 1, 2.4); await wait(2.5); void alive; } } : {};
  }
  // grid pictures
  const cands = !!pic.cands?.length;
  const sideBoard = cands || hasBoard;
  // with candidate pictures: the main grid shows only the start, the pin and (later) the image; the panels get a
  // wide board of their own, all on one shared window so the pictures can be compared
  const mainWin = cands ? fitWin(picPoints({ ...pic, cands: undefined }), 7) : pic.win;
  const v = viewOf(mainWin, cands ? CAND_MODEL : sideBoard ? MF : WIDE);
  const slate = cands ? CAND_BOARD : BOARD;
  const panelArea = box(slate.x0 + 24, slate.y0 + (hasBoard ? 150 : 30), slate.x1 - 24, slate.y1 - 16);
  const lines: Line[] = hasBoard ? [cands ? { ...line('x.T', item.board, slate.y0 + 92, 68), x: slate.x0 + 54 } : line('x.T', item.board, BOARD.y0 + 120, 76)] : [];
  const dotSt: Record<string, DotState> = {}, panelSt: Record<string, PanelState> = {};
  setScene({
    table: NOTABLE, lines, leads: [], boardBox: cands ? CAND_BOARD : sideBoard ? undefined : null,
    model: c => { paper(c, v); drawGridPic(c, v, { ...pic, win: mainWin }, { k: tr.k('x.in'), watchK: E.smooth(tr.k('x.watch')), solveK: tr.k('x.solve'), dotSt }); },
    extra: c => { if (cands) drawPanels(c, pic, panelArea, panelSt, tr.k('x.in')); },
  });
  tr.set('x.in', 1, 0.7); tr.set('x.T', 1, 0.8, 0.3);
  if (pic.dots?.length && item.input === 'choice') {
    // tapping a dot on the canvas picks that choice
    tapDots(v, pic.dots, label => {
      const i = (item.choices ?? []).findIndex(t => t.slice(-1) === label);
      const b = document.querySelectorAll('.panel .opts button')[i] as HTMLButtonElement | undefined;
      if (b && !b.disabled) b.click();
    });
    wireTaps();
  } else onTap = null;
  let solving = false;
  if (pic.watch) seq(async alive => {
    await wait(0.8);
    while (alive() && !solving) { tr.jump('x.watch', 0); tr.set('x.watch', 1, 2.4); await wait(3.8); }
  });
  return {
    solve: async alive => {
      const right = (item.choices ?? [])[(item.answer as { i?: number }).i ?? -1]?.slice(-1);
      const picked = pickedLabel(item);
      if (right) { dotSt[right] = 'right'; panelSt[right] = 'right'; }
      if (picked && picked !== right) { dotSt[picked] = 'wrong'; panelSt[picked] = 'wrong'; }
      tr.set('x.T:dim', 1, 0.4);
      solving = true;
      if (pic.watch) { tr.jump('x.watch', 0); await wait(0.1); }
      if (!alive()) return;
      tr.set('x.solve', 1, 2.6);
      await wait(2.7);
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\circlearrowright', '\\circlearrowleft', '\\text{Riley: a}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
