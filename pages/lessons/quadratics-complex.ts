// quadratics-complex.ts: "Quadratics with complex solutions" (Algebra 2, lesson 2; secondary-t7-09) on the lesson runtime.
//   1 The question   the parabola y = x² − 4x + 13 misses the x-axis: how many solutions does x² − 4x + 13 = 0 have?
//                    3 cards (two non-real; none = no-solution-vs-no-real; one = one-complex-solution) + how sure
//   2 Worked example the formula, picture first: b² − 4ac = −36 (the gap under the vertex), √(−36) = 6i, split
//                    (4 ± 6i)/2 = 2 ± 3i (the vertex line x = 2, then the plane turns into the complex plane where
//                    the two roots sit on that line, mirrored), check 2 + 3i. One "why?": the shared real part
//   3 Your turn      x² + 6x + 25 = 0, faded from the end: the kid writes √(−64) = 8i and splits to −3 ± 4i; the
//                    roots land on the complex plane above the vertex x = −3. Callback to the card
//   4 Prove it       Jordan: three examples, "so it is always true". Judge, then the general because-chain on the
//                    complex plane (ticks unlabelled): i√(4ac − b²), split over 2a, both parts real → p ± qi.
//                    Distractor chips = examples as proof, roots are opposites, conjugate flips both parts
//   5 Practice       all 14 sub-goals in order, then mixed; pictures: the parabola (late when it would give the
//                    answer away), the complex plane with the roots, the completed-square area
// Voiced lines: src/lesson/topics/quadratics-complex/script.ts -> pages/lessons/quadratics-complex/voice/lines.json.
import { type Canvas, strike, withAlpha } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, pairInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { Plane, type PItem, type PlaneBlock } from '../../src/lesson/kit/Plane';
import { CompleteSquare, type SqStep } from '../../src/lesson/topics/completing-the-square/CompleteSquare';
import { FAMILY_NAMES, GENERATORS, MC, type QItem } from '../../src/lesson/topics/quadratics-complex/items';
import type { GraphPic, RootsPic } from '../../src/lesson/topics/quadratics-complex/common';
import { fmtIm, graphParams, rootsParams } from '../../src/lesson/topics/quadratics-complex/pic';
import { PLAN } from '../../src/lesson/topics/quadratics-complex/plan';
import { explain } from '../../src/lesson/topics/quadratics-complex/explain';
import { SCRIPT } from '../../src/lesson/topics/quadratics-complex/script';
import LINES from './quadratics-complex/voice/lines.json';

const SLUG = 'quadratics-complex';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, SCRIPT[id]?.html ?? id);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]?.html ?? id); }
const I = '<i>i</i>', X = '<i>x</i>';

// ===================== layout: the model on the left, a wide board on the right =====================
const MF = frame(60, 90, 960, 900);
const PB = box(1070, 70, 1860, 1010), PX = PB.x0 + 44, PW = PB.w - 88;
const W = (s: Paint) => ({ col: s });
const REAL = W('second'), IMAG = W('first'), ANS = W('link');
function splitEq(src: string): string[] {
  const out: string[] = []; let d = 0, last = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (ch === '{' || ch === '(') d++; else if (ch === '}' || ch === ')') d--;
    else if (d === 0 && i > last && src.startsWith(' = ', i)) { out.push(src.slice(last, i)); last = i + 1; }
  }
  out.push(src.slice(last));
  return out;
}
interface Spec { key: string; src: string; size?: number; tags?: Record<string, { col: Paint }>; col?: Paint; gap?: number; center?: boolean }
/** board lines from the top down; a line too wide at 62 px breaks at its top-level = signs (same key) */
function stack(specs: Spec[], y0 = 170, area: { x: number; w: number } = { x: PX, w: PW }): { lines: Line[]; at: Record<string, Line[]>; y: number } {
  const lines: Line[] = [], at: Record<string, Line[]> = {};
  let y = y0, top = -1;
  for (const sp of specs) {
    const size = sp.size ?? 80;
    const fitS = (src: string) => { const F = tex(src) as Formula; let s = size; while (s > 62 && texWidth(F, s) > area.w) s -= 2; return { F, s }; };
    let rows = [sp.src];
    if (texWidth(fitS(sp.src).F, fitS(sp.src).s) > area.w) rows = splitEq(sp.src).map((r, i) => (i ? r.trim() : r));
    const s = Math.min(...rows.map(r => fitS(r).s));
    // rows sit by their real ink box (a fraction is taller than a plain line), so nothing overlaps
    if (top < 0) top = y0 - texBox(tex(rows[0]!) as Formula, 0, 0, { size: s, align: 'left' }).h / 2;
    at[sp.key] = rows.map(r => {
      const F = tex(r) as Formula, b = texBox(F, 0, 0, { size: s, align: 'left' });
      const x = sp.center ? area.x + (area.w - texWidth(F, s)) / 2 : area.x + (r === rows[0] ? 0 : 60);
      const L: Line = { key: sp.key, F, x, y: top - b.y0, size: s, tags: sp.tags, col: sp.col };
      top = L.y + b.y1 + s * 0.42;
      lines.push(L); return L;
    });
    top += sp.gap ?? s * 0.1;
    y = top;
  }
  return { lines, at, y };
}
const lineBox = (L: Line): Box => texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });

// ===================== the two planes =====================
/** the parabola y = s0 x² + s1 x + s2 on the x-y plane, with extra items (vertex, the gap under it, the axis) */
function xyPlane(x: [number, number, number], y: [number, number, number], items: PItem[]): PlaneBlock {
  return Plane({ x: { min: x[0], max: x[1], step: x[2], name: 'x' }, y: { min: y[0], max: y[1], step: y[2], name: 'y' }, items }, MF, th);
}
/** the complex plane (square cells; imaginary ticks 2i, −i) */
function cPlane(r: number, step: number, items: PItem[], blank = false): PlaneBlock {
  const fmt = blank ? () => '' : undefined;
  return Plane({ x: { min: -r, max: r, step, name: 'real', fmt }, y: { min: -r, max: r, step, name: 'imaginary', fmt: blank ? () => '' : fmtIm }, equal: true, items }, MF, th);
}
const P = (pre: string) => progressOf(s => tr.k(pre + s));

// ===================== 1. The question =====================
const CARDS = [
  { v: 'No solutions', t: 'no solutions', id: MC.noSolution, why: 't.cb-none', ok: false },
  { v: 'Two non-real solutions', t: 'two non-real solutions', id: '', why: 't.cb-right', ok: true },
  { v: 'One non-real solution', t: 'one non-real solution', id: MC.oneComplex, why: 't.cb-one', ok: false },
];
const F1 = (x: number) => x * x - 4 * x + 13;
function exPlane(): PlaneBlock {
  return xyPlane([-2, 6, 1], [-4, 28, 4], [
    { kind: 'curve', key: 'c', f: F1, col: 'link' },
    { kind: 'point', key: 'v', x: 2, y: 9, col: 'second', name: '(2, 9)' },
    { kind: 'seg', key: 'gap', a: [2, 0], b: [2, 9], col: 'first', dash: true, w: 5 },
    { kind: 'vline', key: 'ax', x: 2, col: 'pick' },
  ]);
}
function partQuestion(): void {
  tr.reset('q.');
  const B = exPlane();
  const st = stack([
    { key: 'q.l0', src: 'x^{2} - 4x + 13 = 0', size: 92, center: true, gap: 70 },
    { key: 'q.l1', src: '\\text{how many solutions?}', size: 72, center: true },
  ], 360);
  setScene({ model: c => B.draw(c, P('q.')), lines: st.lines, leads: [], boardBox: PB });
  tr.set('q.axes', 1, 1.0); tr.set('q.c', 1, 1.6, 0.6); tr.set('q.v', 1, 0.6, 2.2); tr.set('q.l0', 1, 1.0, 1.4); tr.set('q.l1', 1, 0.8, 2.4);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'The parabola y = x^2 - 4x + 13 misses the x-axis. How many solutions does x^2 - 4x + 13 = 0 have?', board: 'x^2 - 4x + 13 = 0', response: c.t, expected: 'two non-real solutions', correct: c.ok, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.v}</span>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'No x-intercepts'), voiced('q.intro'), voiced('q.ask'), cards, voiced('q.sure', 'div', 'label'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: x² − 4x + 13 = 0 =====================
function partExample(): void {
  tr.reset('e.');
  const B = exPlane();
  const C2 = cPlane(5, 1, [
    { kind: 'vline', key: 'vl', x: 2, col: 'pick' },
    { kind: 'point', key: 'p', x: 2, y: 3, col: 'link', name: '2 + 3i' },
    { kind: 'point', key: 'm', x: 2, y: -3, col: 'link', name: '2 − 3i' },
  ]);
  const st = stack([
    { key: 'e.l0', src: 'x^{2} - 4x + 13 = 0', size: 80 },
    { key: 'e.l1', src: 'b^{2} - 4ac = 16 - 52 = \\cssId{a}{-36}', size: 76, tags: { a: IMAG } },
    { key: 'e.l2', src: '\\sqrt{-36} = i\\sqrt{36} = \\cssId{a}{6i}', size: 76, tags: { a: IMAG } },
    { key: 'e.l3', src: 'x = \\dfrac{4 \\pm 6i}{2} = \\cssId{a}{2} \\pm \\cssId{b}{3i}', size: 76, tags: { a: REAL, b: IMAG } },
    { key: 'e.l4', src: '(2 + 3i)^{2} - 4(2 + 3i) + 13', size: 70 },
    { key: 'e.l5', src: '= -5 + 12i - 8 - 12i + 13 = \\cssId{a}{0}', size: 70, tags: { a: ANS } },
  ], 150);
  setScene({
    model: c => {
      withAlpha(c, 1 - tr.k('e.swap'), () => B.draw(c, P('e.'), { ring: [{ key: 'v', col: 'first', k: tr.k('e.ringV') }] }));
      withAlpha(c, tr.k('e.swap'), () => C2.draw(c, P('e.c.'), { ring: [{ key: 'p', col: 'link', k: tr.k('e.ringP') }] }));
    },
    lines: st.lines, leads: [], boardBox: PB,
  });
  tr.jump('e.axes', 1); tr.jump('e.c', 1); tr.jump('e.v', 1); tr.set('e.l0', 1, 0.8, 0.2);
  let step = 0;
  const STEPS = [
    { t: 'Find b² − 4ac', why: 'Its sign says what kind of solutions there are.', act: 'Compute it' },
    { t: 'Take the root of a negative', why: '√(−k) = i√k.', act: 'Take the root' },
    { t: 'Split into a ± bi', why: 'Divide both terms by 2a.', act: 'Split' },
    { t: 'Check a root', why: 'Substitute, with i² = −1.', act: 'Check' },
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
        tr.set('e.ringV', 1, 0.6); tr.set('e.gap', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('e.l1', 1, 1.2); await wait(1.4);
      } else if (i === 1) {
        tr.set('e.l2', 1, 1.2); await wait(1.4);
      } else if (i === 2) {
        tr.set('e.ringV', 0, 0.4); tr.set('e.ax', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.swap', 1, 1.2); tr.set('e.c.axes', 1, 0.8, 0.3); tr.set('e.c.vl', 1, 0.8, 0.7); await wait(1.7); if (!alive()) return;
        tr.set('e.c.p', 1, 0.7); tr.set('e.c.m', 1, 0.7, 0.4); tr.set('e.l3', 1, 1.2, 0.3); await wait(1.6);
      } else {
        tr.set('e.ringP', 1, 0.6); tr.set('e.l4', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('e.l5', 1, 1.2); await wait(1.4);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.s${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Because the ± only touches the root: −b/(2a) = 2 is in both.', ok: true, id: 'e.w-ok', mc: undefined as string | undefined },
      { t: 'Because the second root is the opposite of the first.', ok: false, id: 'e.w-opp', mc: MC.opposites as string | undefined },
      { t: 'Because the parabola crosses the <i>x</i>-axis at 2.', ok: false, id: 'e.w-cross', mc: undefined as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why do both solutions of x^2 - 4x + 13 = 0 have the real part 2?', response: o.t.replace(/<[^>]+>/g, ''), correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: x² + 6x + 25 = 0 =====================
function partTurn(): void {
  tr.reset('t.');
  const B = xyPlane([-8, 2, 1], [-5, 45, 5], [
    { kind: 'curve', key: 'c', f: x => x * x + 6 * x + 25, col: 'link' },
    { kind: 'point', key: 'v', x: -3, y: 16, col: 'second', name: '(−3, 16)' },
    { kind: 'seg', key: 'gap', a: [-3, 0], b: [-3, 16], col: 'first', dash: true, w: 5 },
    { kind: 'vline', key: 'ax', x: -3, col: 'pick' },
  ]);
  const C2 = cPlane(6, 1, [
    { kind: 'vline', key: 'vl', x: -3, col: 'pick' },
    { kind: 'point', key: 'p', x: -3, y: 4, col: 'link', name: '−3 + 4i' },
    { kind: 'point', key: 'm', x: -3, y: -4, col: 'link', name: '−3 − 4i' },
  ]);
  const st = stack([
    { key: 't.l0', src: 'x^{2} + 6x + 25 = 0', size: 80 },
    { key: 't.l1', src: 'b^{2} - 4ac = \\cssId{a}{-64}', size: 76, tags: { a: IMAG } },
    { key: 't.l2', src: '\\sqrt{-64} = i\\sqrt{64} = \\cssId{a}{8i}', size: 76, tags: { a: IMAG } },
    { key: 't.l3', src: 'x = \\dfrac{-6 \\pm 8i}{2} = \\cssId{a}{-3} \\pm \\cssId{b}{4i}', size: 76, tags: { a: REAL, b: IMAG } },
  ], 170);
  setScene({
    model: c => {
      withAlpha(c, 1 - tr.k('t.swap'), () => B.draw(c, P('t.')));
      withAlpha(c, tr.k('t.swap'), () => C2.draw(c, P('t.c.')));
    },
    lines: st.lines, leads: [], boardBox: PB,
  });
  tr.set('t.axes', 1, 0.8); tr.set('t.c', 1, 1.4, 0.4); tr.set('t.v', 1, 0.6, 1.6); tr.set('t.gap', 1, 0.8, 2.0);
  tr.set('t.l0', 1, 1.0, 0.6); tr.set('t.l1', 1, 1.2, 1.8);
  let step = 1;
  const STEPS = [
    { t: 'Find b² − 4ac', why: 'Done for you: −64.' },
    { t: 'Take the root of a negative', why: 'Your step.' },
    { t: 'Split into a ± bi', why: 'Your step.' },
    { t: 'See the roots', why: 'On the complex plane.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn'), voiced('t.intro'), plan, work);
  seq(async alive => { await wait(3.2); if (!alive()) return; askRoot(); });
  function askRoot(): void {
    const fbHost = h('div'), inp = numInput('i', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.num', false)); return; }
      const v = r.v, good = v === 8;
      const mc = v === -8 ? MC.rootNegReal : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.root', prompt: 'sqrt(-64) = ? i', board: '\\sqrt{-64}', response: v, expected: 8, correct: good, mc });
      fbHost.replaceChildren(voicedFb(good ? 't.root-ok' : v === -8 ? 't.root-neg' : 't.root-no', good));
      if (!good) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.l2', 1, 1.2); await wait(1.4); if (!alive()) return;
        step = 2; drawPlan(); askSplit();
      });
    }
    work.replaceChildren(voiced('t.root'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askSplit(): void {
    const fbHost = h('div'), inp = pairInput(`${X} =`, '±', () => check(), I), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(voicedFb('t.pair', false)); return; }
      const y = Math.abs(r.y), good = r.x === -3 && y === 4;
      const id = good ? 't.split-ok' : r.x === 3 && y === 4 ? 't.split-b' : (r.x === -6 && y === 4) || (r.x === -3 && y === 8) ? 't.split-half' : 't.split-no';
      const mc = r.x === 3 && y === 4 ? MC.useB : (r.x === -6 && y === 4) || (r.x === -3 && y === 8) ? MC.selTerm : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.split', prompt: 'x = (-6 ± 8i)/2 in the form a ± bi', board: '\\frac{-6 \\pm 8i}{2}', response: `${r.x} ± ${r.y}i`, expected: '-3 ± 4i', correct: good, mc });
      fbHost.replaceChildren(voicedFb(id, good));
      if (!good) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.l3', 1, 1.2); tr.set('t.ax', 1, 0.9, 0.4); await wait(1.6); if (!alive()) return;
        tr.set('t.swap', 1, 1.2); tr.set('t.c.axes', 1, 0.8, 0.3); tr.set('t.c.vl', 1, 0.8, 0.7); await wait(1.6); if (!alive()) return;
        tr.set('t.c.p', 1, 0.7); tr.set('t.c.m', 1, 0.7, 0.4); await wait(1.2); if (!alive()) return;
        step = 4; drawPlan(); fbHost.append(callback());
      });
    }
    work.replaceChildren(voiced('t.split'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const p = voiced(cd ? cd.why : 't.cb-skip');
    if (cd) p.insertAdjacentHTML('beforeend', ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>`);
    c.append(p, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: why the roots are always a conjugate pair =====================
function partProve(): void {
  tr.reset('p.');
  const B = cPlane(5, 1, [
    { kind: 'seg', key: 'up', a: [2, 0], b: [2, 3], arrow: true, col: 'first', w: 6 },
    { kind: 'seg', key: 'dn', a: [2, 0], b: [2, -3], arrow: true, col: 'first', w: 6 },
    { kind: 'vline', key: 'vl', x: 2, col: 'second' },
    { kind: 'point', key: 'p', x: 2, y: 3, col: 'link', name: 'p + qi' },
    { kind: 'point', key: 'm', x: 2, y: -3, col: 'link', name: 'p − qi' },
    { kind: 'text', key: 'lab', x: 2, y: -4.5, text: 'real part p = −b/2a', col: 'second', size: 44 },
  ], true);
  const st = stack([
    { key: 'p.l0', src: 'x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}', size: 76 },
    { key: 'p.l1', src: '\\sqrt{b^{2} - 4ac} = \\cssId{a}{i}\\sqrt{4ac - b^{2}}', size: 72, tags: { a: IMAG } },
    { key: 'p.l2', src: 'x = \\cssId{a}{-\\dfrac{b}{2a}} \\pm \\cssId{b}{\\dfrac{\\sqrt{4ac - b^{2}}}{2a}}\\,i', size: 72, tags: { a: REAL, b: IMAG } },
    { key: 'p.l3', src: 'x = \\cssId{a}{p} \\pm \\cssId{b}{q}\\,i', size: 84, tags: { a: REAL, b: IMAG } },
  ], 170);
  setScene({ model: c => B.draw(c, P('p.'), { ring: [{ key: 'p', col: 'link', k: tr.k('p.ring') }, { key: 'm', col: 'link', k: tr.k('p.ring') }] }), lines: st.lines, leads: [], boardBox: PB });
  tr.set('p.axes', 1, 1.0); tr.set('p.l0', 1, 1.2, 0.8);
  const CHIPS = [
    { t: '√(−k) = <i>i</i>√k for k &gt; 0, and 4ac − b² is positive here.', fits: 0 },
    { t: 'Dividing a sum by 2a divides each of its terms.', fits: 1 },
    { t: 'a, b, c are real, so −b/(2a) and √(4ac − b²)/(2a) are real numbers.', fits: 2 },
    { t: 'It worked for three equations, so it works for all of them.', fits: -1, mc: MC.examples, id: 'p.no.ex' },
    { t: 'The second root is always the opposite of the first.', fits: -1, mc: MC.opposites, id: 'p.no.opp' },
    { t: 'A conjugate changes the sign of both parts.', fits: -1, mc: MC.conjBoth, id: 'p.no.conj' },
  ];
  const CLAIMS = [
    `b² − 4ac is negative, so √(b² − 4ac) = <b>${I}√(4ac − b²)</b>,`,
    `so ${X} = <b>−b/(2a) ± (√(4ac − b²)/(2a))${I}</b>,`,
    `= <b class="s">p ± q${I}</b> with p and q real: a conjugate pair,`,
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t.replace(/<[^>]+>/g, '').replace('&gt;', '>'), correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) { tr.set('p.up', 1, 1.0); tr.set('p.dn', 1, 1.0, 0.3); await wait(1.3); if (!alive()) return; tr.set('p.l1', 1, 1.2); }
      if (n === 2) { tr.set('p.vl', 1, 1.0); tr.set('p.lab', 1, 0.8, 0.6); await wait(1.4); if (!alive()) return; tr.set('p.l2', 1, 1.2); }
      if (n === 3) {
        tr.set('p.p', 1, 0.7); tr.set('p.m', 1, 0.7, 0.3); await wait(1.1); if (!alive()) return;
        tr.set('p.ring', 1, 0.6); tr.set('p.l3', 1, 1.2, 0.2); await wait(1.6); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Yes, that proves it', () => judge(true)), no = btn('No, examples are not a proof', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: three examples had conjugate roots, so it is always true. Is that a proof?', response: right ? 'yes' : 'no', expected: 'no', correct: !right, mc: right ? MC.examples : undefined });
    proofHost.replaceChildren(right ? voiced('p.yes') : voiced('p.build'), chain, chipBox, fbHost);
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
    show: it => showItem(it as QItem),
  });
}
type Show = { solve?: (alive: () => boolean) => Promise<void> };
const fN = (v: number) => { const r = Math.round(v * 1e6) / 1e6; return String(Math.abs(r)); };
/** the answer line on the board after a miss: x = a ± bi, or a + bi */
function answerTex(it: QItem): string | null {
  const a = it.answer;
  if (a.kind !== 'pair' || it.pairTail !== I) return null;
  const x = a.x, y = Math.abs(a.y);
  const yi = y === 1 ? 'i' : `${fN(y)}i`;
  if (it.pairOp === '±') return x === 0 ? `x = \\pm ${yi}` : `x = ${x < 0 ? '-' : ''}${fN(x)} \\pm ${yi}`;
  if (a.y === 0) return `= ${x < 0 ? '-' : ''}${fN(x)}`;
  if (x === 0) return `= ${a.y < 0 ? '-' : ''}${yi}`;
  return `= ${x < 0 ? '-' : ''}${fN(x)} ${a.y < 0 ? '-' : '+'} ${yi}`;
}
/** the item's board: one TeX line, or several separated by a TeX line break */
const boardRows = (b: string) => b.split(' \\\\ ');
function boardFor(it: QItem, y0 = 200): Line[] {
  const ans = answerTex(it);
  return stack([...boardRows(it.board).map(src => ({ key: 'x.L0', src, size: 84, gap: 30 })), ...(ans ? [{ key: 'x.LA', src: ans, size: 88, col: 'link' as Paint, gap: 0 }] : [])], y0).lines;
}
function graphScene(it: QItem, g: GraphPic): Show | null {
  const made = tryBlock(() => Plane(graphParams(g), MF, th));
  if (!made.ok) { console.info('graph fallback', it.family, made.error); return null; }
  const B = made.value, lines = boardFor(it);
  setScene({ model: c => B.draw(c, P('x.')), lines, leads: [], boardBox: PB });
  tr.set('x.axes', 1, 0.8); tr.set('x.L0', 1, 0.9, 0.4);
  const main = ['c', 'T', 'ax', 'v'];
  const extra = (g.reveal?.xints ?? []).map((_, i) => `z${i}`);
  if (!g.late) main.forEach((k, j) => tr.set('x.' + k, 1, k === 'c' ? 1.4 : 0.7, 0.5 + j * 0.3));
  return {
    solve: async alive => {
      if (g.late) { main.forEach((k, j) => tr.set('x.' + k, 1, k === 'c' ? 1.4 : 0.7, j * 0.3)); await wait(1.8); if (!alive()) return; }
      extra.forEach((k, j) => tr.set('x.' + k, 1, 0.7, j * 0.3));
      tr.set('x.LA', 1, 1.0);
    },
  };
}
function rootsScene(it: QItem, r: RootsPic): Show | null {
  const made = tryBlock(() => Plane(rootsParams(r), MF, th));
  if (!made.ok) { console.info('roots fallback', it.family, made.error); return null; }
  const B = made.value, lines = boardFor(it);
  setScene({ model: c => B.draw(c, P('x.')), lines, leads: [], boardBox: PB });
  tr.set('x.axes', 1, 0.8); tr.set('x.L0', 1, 0.9, 0.4);
  r.given.forEach((p, j) => tr.set('x.' + p.key, 1, 0.7, 0.6 + j * 0.2));
  if (r.vline !== undefined) tr.set('x.vl', 1, 0.8, 0.5);
  return {
    solve: async alive => {
      if (r.reveal?.vline !== undefined) { tr.set('x.r.vl', 1, 0.8); await wait(0.8); if (!alive()) return; }
      (r.reveal?.pts ?? []).forEach((p, j) => tr.set('x.r.' + p.key, 1, 0.8, j * 0.35));
      await wait(0.8); if (!alive()) return;
      tr.set('x.LA', 1, 1.0);
    },
  };
}
const SQ_FR = frame(60, 110, 940, 860);
function squareScene(it: QItem, hh: number): Show | null {
  const made = tryBlock(() => CompleteSquare({ hT: String(hh), stripT: `${2 * hh}x`, halfT: `${hh}x`, cornerT: String(hh * hh) }, SQ_FR, th));
  if (!made.ok) { console.info('square fallback', it.family, made.error); return null; }
  const B = made.value, lines = boardFor(it);
  const Pq = progressOf<SqStep>(s => tr.k('x.s.' + s));
  setScene({ model: c => B.draw(c, Pq), lines, leads: [], boardBox: PB });
  tr.set('x.s.sq', 1, 0.8); tr.set('x.s.strip', 1, 0.8, 0.5); tr.set('x.s.halve', 1, 1.0, 1.2); tr.set('x.s.corner', 1, 0.6, 2.2); tr.set('x.L0', 1, 0.9, 0.4);
  return { solve: async alive => { tr.set('x.s.fill', 1, 0.8); await wait(0.9); if (!alive()) return; tr.set('x.s.side', 1, 0.8); } };
}
function showItem(it: QItem): Show {
  tr.reset('x.');
  const pic = it.picture;
  if (pic?.graph) { const r = graphScene(it, pic.graph); if (r) return r; }
  if (pic?.roots) { const r = rootsScene(it, pic.roots); if (r) return r; }
  if (pic?.square) { const r = squareScene(it, pic.square.h); if (r) return r; }
  const big = box(200, 200, 1720, 880);
  const ans = answerTex(it);
  const st = stack([...boardRows(it.board).map(src => ({ key: 'x.T', src, size: 110, center: true, gap: 40 })), ...(ans ? [{ key: 'x.LA', src: ans, size: 100, col: 'link' as Paint, center: true }] : [])], ans ? 420 : 540, { x: big.x0 + 70, w: big.w - 140 });
  setScene({ lines: st.lines, leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return { solve: ans ? async () => { tr.set('x.LA', 1, 1.0); } : undefined };
}

void runLesson({
  slug: SLUG,
  warm: ['x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a} = 2 \\pm 3i \\sqrt{-36} \\square', '(x - 3)^{2} = -4'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
void strike; void lineBox; void ((c: Canvas) => c);
