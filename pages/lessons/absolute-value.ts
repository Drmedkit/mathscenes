// absolute-value.ts: "Absolute value functions and equations" (Algebra 1, secondary-t7-13) on the shared lesson runtime.
// The model is the shared kit's Plane (src/lesson/kit/Plane.ts): y = a|mx + b| + k as two linear pieces meeting where
// the inside is 0, with horizontal lines y = c for equations (pictures as piecewise-functions GPic data, drawn by its
// graph.ts); number lines for distances and inequality sets are the solving-linear-equations SetLine.
//   1 The question   |x − 4| = 3: cards x = 1 or 7 / 7 only (only-one-number-per-abs) / ±3 (ignores the inside)
//   2 Worked example the breakpoint x − 4 = 0 → the two pieces x − 4 and 4 − x (the V) → the line y = 3 meets both →
//                    solve each piece; one "why?" with 3 reasons
//   3 Your turn      2|x − 2| − 4 = 6, faded: the kid isolates (|x − 2| = 5; split-before-isolating as a distractor),
//                    then types both solutions; the line y = 6 meets the V at them
//   4 Prove it       Jordan: |2x − 3| = −5 has the solutions −1 and 4. Because-chain: −1 fails its case condition / 4
//                    fails its case / so no solution (the V never reaches y = −5). Distractors: case-condition-ignored,
//                    negative-target-made-positive, must-satisfy-both-conditions. Jordan's line is struck.
//   5 Practice       all 27 sub-goals one after another, then mixed (runtime/practice.ts); a Plane per item (answer
//                    parts come in on the replay after a miss), option graphs A-C, a number line, or a slate
// Voiced lines: src/lesson/topics/absolute-value/script.ts (→ voice/lines.json). Every answer is logged.
import type { Canvas } from '../../src/core/draw';
import { box, type Box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { type Frame, frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, MF, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, pairInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { PlaneBlock, PFocus } from '../../src/lesson/kit/Plane';
import { drawWords } from '../../src/lesson/words';
import { planeOf, stepOf } from '../../src/lesson/topics/piecewise-functions/graph';
import type { GPart, GPic } from '../../src/lesson/topics/piecewise-functions/pic';
import { FAMILY_NAMES, GENERATORS, MC, type AVItem } from '../../src/lesson/topics/absolute-value/items';
import { PLAN } from '../../src/lesson/topics/absolute-value/plan';
import { type AbsF, crossParts, vParts } from '../../src/lesson/topics/absolute-value/av';
import { LINE_Y, lineBlock } from '../../src/lesson/topics/absolute-value/line';
import { explain } from '../../src/lesson/topics/absolute-value/explain';
import { SCRIPT } from '../../src/lesson/topics/absolute-value/script';

const SLUG = 'absolute-value';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = '', extra = ''): HTMLElement {
  const L0 = SCRIPT[id];
  if (!L0) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, (L0?.html ?? id) + extra);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]?.html ?? id); }
const lime = { col: 'link' as Paint }, teal = { col: 'water' as Paint };

// ===================== board + plane helpers =====================
function centred(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint, b: { w: number; cx: number } = { w: BOARD_W + 108, cx: BOARD.cx }): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 56 && texWidth(F, s) > b.w - 108) s -= 2;
  const bb = texBox(F, 0, y, { size: s });
  return { key, F, x: b.cx - bb.cx, y, size: s, tags, col };
}
/** a Plane scene: the block on the left (steps read as pre + key), board lines on the right */
function planeScene(pre: string, B: PlaneBlock, lines: Line[], focus?: () => PFocus, extra?: (c: Canvas) => void, boardBox?: Box): void {
  setScene({ table: 1080, lines, leads: [], extra, boardBox, model: c => B.draw(c, progressOf<string>(s => tr.k(pre + stepOf(s))), focus?.()) });
}
function strike(c: Canvas, L: Line, k: number): void {
  if (k <= 0) return;
  const bb = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });
  const { g } = c;
  g.save(); g.globalAlpha = k; g.strokeStyle = '#FF6B6B'; g.lineWidth = 6; g.beginPath(); g.moveTo(bb.x0 - 10, bb.cy + 6); g.lineTo(bb.x0 - 10 + (bb.w + 20) * k, bb.cy - 6); g.stroke(); g.restore();
}

// the example: y = |x − 4| and y = 3
const EXF: AbsF = { a: 1, m: 1, b: -4, k: 0 };
function examplePic(): GPic {
  const [L0, R0, V] = vParts(EXF, 'p');
  return {
    x: { min: -2, max: 10, step: 1, name: 'x' }, y: { min: -2, max: 7, step: 1, name: 'y' },
    parts: [
      { ...(L0 as GPart & { kind: 'piece' }), col: 'water' }, R0!, { ...(V as GPart & { kind: 'point' }), col: 'first' },
      { kind: 'hline', key: 'c', y: 3, col: 'first', dash: true },
      ...crossParts([1, 7], 3),
      { kind: 'seg', key: 'd0', a: [4, 0], b: [1, 0], col: 'pick', arrow: true, w: 6 },
      { kind: 'seg', key: 'd1', a: [4, 0], b: [7, 0], col: 'pick', arrow: true, w: 6 },
    ],
  };
}

// ===================== 1. The question =====================
const CARDS = [
  { t: '<i>x</i> = 1 or <i>x</i> = 7', plain: 'x = 1 or x = 7', why: 'q.cb.right', ok: true, mc: undefined as string | undefined },
  { t: 'only <i>x</i> = 7', plain: 'x = 7 only', why: 'q.cb.one', ok: false, mc: MC.onlyOne as string | undefined },
  { t: '<i>x</i> = 3 or <i>x</i> = −3', plain: 'x = 3 or x = −3', why: 'q.cb.pm', ok: false, mc: MC.ignoreIn as string | undefined },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = planeOf(examplePic(), MF, th);
  planeScene('q.', B, [centred('q.R', '|x - 4| = 3', 260, 110), centred('q.Q', 'x = \\,?', 470, 100)]);
  tr.set('q.axes', 1, 1.2, 0.2); tr.set('q.R', 1, 1.2, 0.9); tr.set('q.Q', 1, 0.9, 1.8);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Which numbers x make |x − 4| = 3 true?', board: '|x - 4| = 3', response: c.plain, expected: 'x = 1 or x = 7', correct: c.ok, mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.t}</span>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Which x?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const B = planeOf(examplePic(), MF, th);
  const R = centred('e.R', '|x - 4| = 3', 150, 96);
  const E0 = centred('e.E0', 'x - 4 = 0 \\ \\Rightarrow\\ x = 4', 290, 72, undefined, 'first');
  const E1 = centred('e.E1', '\\begin{cases} \\cssId{r}{x - 4}, & x \\ge 4 \\\\ \\cssId{l}{4 - x}, & x < 4 \\end{cases}', 480, 72, { r: lime, l: teal });
  const E2 = centred('e.E2', '\\cssId{r}{x - 4} = 3 \\ \\ \\text{or}\\ \\ \\cssId{l}{4 - x} = 3', 680, 68, { r: lime, l: teal });
  const E3 = centred('e.E3', 'x = 7 \\ \\ \\text{or}\\ \\ x = 1', 830, 92, undefined, 'link');
  planeScene('e.', B, [R, E0, E1, E2, E3], () => ({ ring: [{ key: 'pV', col: 'pick', k: tr.k('e.ring') }] }));
  tr.jump('e.axes', 1); tr.jump('e.R', 1);
  let step = 0;
  const STEPS = [
    { t: 'Find where the inside is 0', why: 'That is where the bars switch rules.', act: 'Find it' },
    { t: 'Draw the two pieces', why: 'What do the bars do on each side?', act: 'Draw them' },
    { t: 'Where is the V at height 3?', why: 'A horizontal line y = 3.', act: 'Draw it' },
    { t: 'Solve each piece', why: 'One linear equation per piece.', act: 'Solve' },
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
        tr.set('e.pV', 1, 0.8); tr.set('e.ring', 1, 0.6, 0.3); await wait(1.0); if (!alive()) return;
        tr.set('e.E0', 1, 1.0); await wait(1.1);
      } else if (i === 1) {
        tr.set('e.ring', 0, 0.4); tr.set('e.E0:dim', 1, 0.5);
        tr.set('e.pR', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('e.pL', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('e.E1', 1, 1.0); await wait(1.1);
      } else if (i === 2) {
        tr.set('e.E1:dim', 1, 0.5);
        tr.set('e.c', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('e.s0', 1, 0.6); tr.set('e.s1', 1, 0.6, 0.3); await wait(1.0); if (!alive()) return;
        tr.set('e.E2', 1, 1.0); await wait(1.1);
      } else {
        tr.set('e.E2:dim', 1, 0.5);
        tr.set('e.s0d', 1, 0.8); tr.set('e.s1d', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('e.d0', 1, 0.9); tr.set('e.d1', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.E3', 1, 1.0); await wait(1.1);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Left of 4 the bars give 4 − <i>x</i>, so that piece must equal 3 too.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'The bars make every part positive: |<i>x</i> − 4| = <i>x</i> + 4.', ok: false, id: 'e.why.parts', mc: MC.parts as string | undefined },
      { t: 'Every absolute value equation has two solutions.', ok: false, id: 'e.why.always', mc: MC.fixedCount as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does 4 − x = 3 count too?', response: o.t.replace(/<[^>]+>/g, ''), correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: 2|x − 2| − 4 = 6 =====================
const TF: AbsF = { a: 2, m: 1, b: -2, k: -4 };
function turnPic(): GPic {
  return {
    x: { min: -5, max: 9, step: 1, name: 'x' }, y: { min: -5, max: 9, step: 1, name: 'y' },
    parts: [...vParts(TF, 'v'), { kind: 'hline', key: 'c', y: 6, col: 'first', dash: true }, ...crossParts([-3, 7], 6)],
  };
}
function partTurn(): void {
  tr.reset('t.');
  const B = planeOf(turnPic(), MF, th);
  const T1 = centred('t.T1', '2|x - 2| - 4 = 6', 190, 92);
  const T2 = centred('t.T2', '|x - 2| = 5', 360, 88, undefined, 'first');
  const T3 = centred('t.T3', 'x - 2 = 5 \\ \\text{or}\\ x - 2 = -5', 530, 62);
  const T4 = centred('t.T4', 'x = 7 \\ \\ \\text{or}\\ \\ x = -3', 690, 88, undefined, 'link');
  planeScene('t.', B, [T1, T2, T3, T4]);
  tr.set('t.axes', 1, 1.0, 0.2); tr.set('t.T1', 1, 1.0, 0.6); tr.set('t.vL', 1, 1.2, 1.2); tr.set('t.vR', 1, 1.2, 1.2); tr.set('t.vV', 1, 0.6, 2.2);
  const work = h('div');
  setPanel(h('h2', {}, 'Your turn'), voiced('t.intro'), work);
  seq(async alive => { await wait(2.8); if (!alive()) return; askIso(); });
  function askIso(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: '|<i>x</i> − 2| = 5', ok: true, id: 't.iso.ok', mc: undefined as string | undefined },
      { t: '2(<i>x</i> − 2) − 4 = 6 or 2(<i>x</i> − 2) − 4 = −6', ok: false, id: 't.iso.split', mc: MC.splitFirst as string | undefined },
      { t: '|<i>x</i> − 2| = 1', ok: false, id: 't.iso.sub', mc: undefined as string | undefined },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.isolate', prompt: '2|x − 2| − 4 = 6: the absolute value alone?', response: o.t.replace(/<[^>]+>/g, ''), expected: '|x − 2| = 5', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (!o.ok) return;
      done = true;
      seq(async alive => { tr.set('t.T2', 1, 1.0); await wait(1.4); if (!alive()) return; askSol(); });
    })));
    work.replaceChildren(voiced('t.iso'), bx, fbHost);
  }
  function askSol(): void {
    const fbHost = h('div');
    let done = false;
    const inp = pairInput('<i>x</i> =', 'or <i>x</i> =', () => check());
    const check = () => {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(feedback(false, 'Fill in both boxes.')); return; }
      const p = [r.x, r.y].sort((a, b) => a - b);
      const ok = p[0] === -3 && p[1] === 7, pm = p[0] === -5 && p[1] === 5;
      ctx.store.log({ part: 'turn', item: 'turn.solve', prompt: '|x − 2| = 5: both solutions', response: r, expected: { kind: 'pair', x: -3, y: 7 }, correct: ok, mc: pm ? MC.ignoreIn : undefined });
      if (!ok) { fbHost.replaceChildren(voicedFb(pm ? 't.sol.pm' : 't.sol.other', false)); tr.set('t.T3', 1, 0.8); return; }
      done = true;
      fbHost.replaceChildren(voicedFb('t.sol.ok', true));
      seq(async alive => {
        tr.set('t.T3', 1, 0.8); tr.set('t.c', 1, 1.0, 0.3); tr.set('t.s0', 1, 0.6, 1.2); tr.set('t.s1', 1, 0.6, 1.4); tr.set('t.s0d', 1, 0.7, 1.8); tr.set('t.s1d', 1, 0.7, 1.8); tr.set('t.T4', 1, 1.0, 1.6);
        await wait(2.8); if (!alive()) return;
        fbHost.append(callback());
      });
    };
    work.replaceChildren(voiced('t.sol'), inp.node, h('div', { class: 'row' }, btn('Check', check, 'go')), fbHost);
    setTimeout(() => inp.focus(), 50);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, 'p', '', cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : ''), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Jordan's |2x − 3| = −5 =====================
const PF: AbsF = { a: 1, m: 2, b: -3, k: 0 };
function provePic(): GPic {
  return {
    x: { min: -3, max: 6, step: 1, name: 'x' }, y: { min: -7, max: 8, step: 1, name: 'y' },
    parts: [
      ...vParts(PF, 'v'),
      { kind: 'hline', key: 'c', y: -5, col: 'first', dash: true },
      { kind: 'seg', key: 'j1', a: [-1, 0], b: [-1, 5], col: 'pick', dash: true },
      { kind: 'point', key: 'P1', x: -1, y: 5, col: 'wrong' },
      { kind: 'seg', key: 'j2', a: [4, 0], b: [4, 5], col: 'pick', dash: true },
      { kind: 'point', key: 'P2', x: 4, y: 5, col: 'wrong' },
    ],
  };
}
function partProve(): void {
  tr.reset('p.');
  const B = planeOf(provePic(), MF, th);
  const G = centred('p.G', '|2x - 3| = -5', 150, 88);
  const J1 = centred('p.J1', '2x - 3 = -5 \\ \\Rightarrow\\ x = -1', 270, 60, undefined, 'dim');
  const J2 = centred('p.J2', '2x - 3 = 5 \\ \\Rightarrow\\ x = 4', 360, 60, undefined, 'dim');
  const M = centred('p.M', '\\text{Jordan: } x = -1 \\text{ or } x = 4', 470, 62, undefined, 'pick');
  const C1 = centred('p.C1', '2(-1) - 3 = -5 < 0', 600, 64, undefined, 'wrong');
  const C2 = centred('p.C2', '2(4) - 3 = 5 \\ge 0', 700, 64, undefined, 'wrong');
  const C3 = centred('p.C3', '|2x - 3| \\ge 0 > -5', 830, 84, undefined, 'link');
  planeScene('p.', B, [G, J1, J2, M, C1, C2, C3], () => ({ ring: [{ key: 'P1', col: 'wrong', k: tr.k('p.r1') }, { key: 'P2', col: 'wrong', k: tr.k('p.r2') }] }), c => strike(c, M, tr.k('p.strike')));
  tr.set('p.axes', 1, 1.0, 0.2); tr.set('p.G', 1, 1.0, 0.6); tr.set('p.J1', 1, 0.8, 1.2); tr.set('p.J2', 1, 0.8, 1.6); tr.set('p.M', 1, 0.9, 2.2);
  tr.set('p.vL', 1, 1.2, 1.4); tr.set('p.vR', 1, 1.2, 1.4); tr.set('p.vV', 1, 0.6, 2.4); tr.set('p.c', 1, 1.0, 2.8);
  const CHIPS = [
    { t: 'It came from the case 2<i>x</i> − 3 ≥ 0, but 2(−1) − 3 = −5 is negative.', fits: 0 },
    { t: 'It came from the case 2<i>x</i> − 3 &lt; 0, but 2(4) − 3 = 5 is positive.', fits: 1 },
    { t: 'An absolute value is a distance, never negative: the V stays above the <i>x</i>-axis.', fits: 2 },
    { t: 'Both came from correct algebra, so both are solutions.', fits: -1, mc: MC.condIgnored, id: 'p.no.algebra' },
    { t: 'Drop the minus: |2<i>x</i> − 3| = 5 has the same solutions.', fits: -1, mc: MC.madePos, id: 'p.no.positive' },
    { t: 'A candidate must meet both case conditions.', fits: -1, mc: MC.bothConds, id: 'p.no.both' },
  ];
  const CLAIMS = ['<i>x</i> = −1 is not a solution,', '<i>x</i> = 4 is not a solution either,', 'so <b>|2<i>x</i> − 3| = −5 has no solution</b>,'];
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
    if (filled >= 3 || used.has(i)) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t.replace(/<[^>]+>/g, '').replace('&lt;', '<'), correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) { tr.set('p.j1', 1, 0.8); tr.set('p.P1', 1, 0.6, 0.6); tr.set('p.r1', 1, 0.5, 1.0); tr.set('p.C1', 1, 1.0, 1.0); await wait(2.0); }
      if (n === 2) { tr.set('p.r1', 0, 0.4); tr.set('p.j2', 1, 0.8); tr.set('p.P2', 1, 0.6, 0.6); tr.set('p.r2', 1, 0.5, 1.0); tr.set('p.C2', 1, 1.0, 1.0); await wait(2.0); }
      if (n === 3) {
        tr.set('p.r2', 0, 0.4);
        tr.set('p.C3', 1, 1.0, 0.3); tr.set('p.strike', 1, 0.6, 1.2); await wait(2.0); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: |2x − 3| = −5 has the solutions −1 and 4. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.negBranches : undefined });
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
    show: it => showItem(it as AVItem),
  });
}
/** the practice board, right of the model */
const PBOARD = box(1060, 70, 1860, 1010);
const BIG = box(220, 170, 1700, 900);
/** a formula centred in a box, shrunk to its width (and height) */
function fitIn(key: string, src: string, b: { w: number; cx: number }, y: number, size: number, maxH = Infinity, col?: Paint): Line {
  const F = tex(bars(src)) as Formula;
  let s = size;
  while (s > 56 && (texWidth(F, s) > b.w - 100 || texBox(F, 0, 0, { size: s }).h > maxH)) s -= 2;
  const bb = texBox(F, 0, y, { size: s });
  return { key, F, x: b.cx - bb.cx, y, size: s, col };
}
/** absolute value bars as a delimiter pair, so a minus right after | is a sign, not a subtraction: |−7|, −|x − 2| */
const bars = (src: string) => src.replace(/\|([^|]*)\|/g, (_m, inner: string) => `\\left|${inner}\\right|`);
/** the item's board, split at \qquad into lines */
const partsOf = (src: string) => src.split(/\s*\\qquad\s*/).filter(Boolean);
function boardLines(src: string, b: Box = PBOARD, y0 = 230): Line[] {
  let y = y0;
  return partsOf(src).map((p, i) => { const cases = /cases/.test(p), L = fitIn(`x.B${i}`, p, b, y + (cases ? 40 : 0), cases ? 76 : 88); y += cases ? 330 : 150; return L; });
}
/** lines stacked on the big slate, one under another, the same size */
function slateLines(texts: string[], b: Box = BIG, hi?: number): Line[] {
  const n = texts.length, gap = Math.min(170, (b.h - 80) / n);
  const Fs = texts.map(t => tex(bars(t)) as Formula);
  let size = Math.min(100, gap * 0.62);
  while (size > 56 && Fs.some(F => texWidth(F, size) > b.w - 140)) size -= 2;
  const y0 = b.cy - (gap * (n - 1)) / 2;
  return Fs.map((F, i) => { const bb = texBox(F, 0, 0, { size }); return { key: `x.L${i}`, F, x: b.cx - bb.cx, y: y0 + i * gap, size, col: hi === i ? 'pick' as Paint : undefined }; });
}
function slateScene(texts: string[]): void {
  const lines = slateLines(texts);
  setScene({ lines, leads: [], boardBox: BIG, table: 1080 });
  lines.forEach((l, i) => tr.set(l.key, 1, 0.7, 0.1 + i * 0.25));
}
const keysOf = (parts: readonly GPart[]) => parts.map(p => p.key);
function showItem(item: AVItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.g) {
    const g = pic.g, made = tryBlock(() => planeOf(g, MF, th));
    if (made.ok) {
      const B = made.value, lines = boardLines(item.board);
      const toPlane = () => planeScene('x.', B, lines, () => (g.reveal?.trace ? { trace: { key: g.reveal.trace.key, x: g.reveal.trace.x, k: tr.k('x.trace') } } : {}), undefined, PBOARD);
      // nothing to show before the answer (the graph IS the answer): the board on the big slate, the graph in the replay
      const hidden = g.parts.length === 0;
      if (hidden) slateScene(partsOf(item.board));
      else {
        toPlane();
        tr.set('x.axes', 1, 0.9, 0.1);
        keysOf(g.parts).forEach((k, i) => tr.set('x.' + k, 1, 0.9, 0.4 + i * 0.12));
        lines.forEach((L, i) => tr.set(L.key, 1, 0.8, 0.3 + i * 0.3));
      }
      return {
        solve: async alive => {
          if (hidden) {
            toPlane();
            tr.set('x.axes', 1, 0.8); lines.forEach(L => tr.jump(L.key, 1));
            await wait(0.8); if (!alive()) return;
          }
          for (const k of keysOf(g.reveal?.parts ?? [])) { tr.set('x.' + k, 1, 0.8); await wait(0.35); if (!alive()) return; }
          if (g.reveal?.trace) { await wait(0.4); if (!alive()) return; tr.set('x.trace', 1, 0.8); }
        },
      };
    }
    console.warn('absolute-value picture did not fit', made.error);
  }
  if (pic?.opts) {
    const top = box(60, 60, 1860, 230);
    const n = pic.opts.length, gap = 30, w = Math.min(600, (1800 - gap * (n - 1)) / n), x0 = 960 - (n * w + gap * (n - 1)) / 2;
    const fy = top.y1 + 90;
    const frames: Frame[] = pic.opts.map((_, i) => frame(x0 + i * (w + gap), fy, w, 1030 - fy));
    const made = pic.opts.map((g, i) => tryBlock(() => planeOf(g, frames[i]!, th)));
    if (made.every(m => m.ok)) {
      const Bs = made.map(m => (m as { ok: true; value: PlaneBlock }).value);
      const L = fitIn('x.T', item.board, top, top.cy, 96, top.h - 30);
      setScene({
        table: 1080, lines: [L], leads: [], boardBox: top,
        model: c => Bs.forEach((B, i) => {
          B.draw(c, progressOf<string>(s => tr.k('x.o' + i)));
          drawWords(c, `Graph ${'ABCD'[i]}`, frames[i]!.x + frames[i]!.w / 2, top.y1 + 46, 'ink', tr.k('x.o' + i), { size: 48, align: 'center', weight: 700 });
        }),
      });
      tr.set('x.T', 1, 0.8, 0.1);
      pic.opts.forEach((_, i) => tr.set('x.o' + i, 1, 1.0, 0.3 + i * 0.25));
      return {};
    }
    console.warn('absolute-value option graphs did not fit');
  }
  if (pic?.line) {
    const P = pic.line, made = tryBlock(() => lineBlock(P, th));
    if (made.ok) {
      const B = made.value, rv = P.reveal;
      const lines = boardLines(item.board, PBOARD, 300);
      const Rz = rv.result ? fitIn('x.R', rv.result, PBOARD, 620, 84, Infinity, 'link') : null;
      const extra = (c: Canvas) => {
        if (rv.center === undefined) return;
        const k = tr.k('x.arcs');
        if (k <= 0) return;
        const cx = B.where.x(rv.center), y = LINE_Y;
        const { g } = c;
        g.save(); g.globalAlpha = Math.min(1, k * 2); g.fillStyle = '#FFBE5C';
        g.beginPath(); g.moveTo(cx, y - 22); g.lineTo(cx - 16, y - 50); g.lineTo(cx + 16, y - 50); g.closePath(); g.fill(); g.restore();
        for (const a of rv.arcs ?? []) {
          const ax = B.where.x(a.to), mid = (cx + ax) / 2, hgt = Math.min(170, 40 + Math.abs(ax - cx) * 0.45);
          g.save(); g.globalAlpha = k; g.strokeStyle = '#B9A8FF'; g.lineWidth = 5; g.setLineDash([]);
          g.beginPath(); g.moveTo(cx, y - 56);
          const n = 30;
          for (let i = 1; i <= Math.round(n * k); i++) { const t = i / n; const px = cx + (ax - cx) * t, py = y - 56 - 4 * hgt * t * (1 - t) + 40 * t; g.lineTo(px, py); }
          g.stroke(); g.restore();
          drawWords(c, a.label, mid, y - 56 - hgt + 4, 'pick', k, { size: 52, align: 'center', weight: 700 });
        }
      };
      setScene({ table: 1080, lines: Rz ? [...lines, Rz] : lines, leads: [], boardBox: PBOARD, extra, model: c => B.draw(c, progressOf<string>(s => tr.k('x.' + s))) });
      tr.set('x.ax', 1, 1.0, 0.1); lines.forEach((L, i) => tr.set(L.key, 1, 0.8, 0.3 + i * 0.3));
      return {
        solve: async alive => {
          if (rv.center !== undefined) { tr.set('x.arcs', 1, 1.2); await wait(1.2); if (!alive()) return; }
          if (rv.set) { tr.set('x.x.set', 1, 1.0); await wait(1.0); if (!alive()) return; }
          if (Rz) tr.set('x.R', 1, 0.9);
          for (const t of rv.tests ?? []) { await wait(0.5); if (!alive()) return; tr.set('x.' + t.key, 1, 0.9); }
        },
      };
    }
    console.warn('absolute-value number line did not fit', made.error);
  }
  if (pic?.slate) { slateScene(pic.slate); return {}; }
  slateScene(partsOf(item.board));
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['|x - 4| = 3 \\begin{cases} x - 4, & x \\ge 4 \\\\ 4 - x, & x < 4 \\end{cases} \\Rightarrow \\text{or}', '2|x + 1| - 4 = 6 \\le \\ge \\text{Jordan: }', '\\qquad \\tfrac{1}{2}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
