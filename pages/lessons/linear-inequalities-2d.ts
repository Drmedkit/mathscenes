// linear-inequalities-2d.ts: "Graphing inequalities in two variables" (Algebra 1, lesson 7; secondary-t6-33) on the
// shared lesson runtime. Every graph is the shared kit's Plane (src/lesson/kit/Plane.ts) through ineqPic.ts.
//   1 The question   which points make y > x + 1 true? 3 cards (only the line = boundary-only-solution; above and the
//                    line too = strict-includes-boundary; every point above, the line left out) + how sure
//   2 Worked example four steps on the plane: test single points (one between grid lines, one ON the line) -> the
//                    points with equal sides form the boundary y = x + 1, dashed because > leaves equal out -> one test
//                    point (0, 0) picks the side, shade above -> straight up from the line at x = 3: y > 4, the same at
//                    every x: a half-plane; one "why?" (why one test point is enough)
//   3 Your turn      3x − 2y ≥ 6, faded from the end: the x-intercept is given; the kid types the y-intercept, picks the
//                    line style, then the side after the (0, 0) test (the ≥ sign says "above", the test says below)
//   4 Prove it       Jordan shades the strip between y ≥ 2x + 1 and y ≤ 2x − 3. Judge, then a because-chain: a point of
//                    the strip fails / the half-planes face away / 1 ≤ −3 for every x: no solution
//   5 Practice       all 27 sub-goals one after another, then mixed (runtime/practice.ts); plane pictures, the worked
//                    solution replayed on the picture after a miss; items with nothing to draw yet start on a slate and
//                    turn into the plane on the solve
// Voiced lines: src/lesson/topics/linear-inequalities-2d/script.ts -> voice/lines.json. Every answer is logged.
import type { Canvas } from '../../src/core/draw';
import type { Paint } from '../../src/core/theme';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { MF, bigLine, type Line, line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { PFocus, PlaneBlock } from '../../src/lesson/kit/Plane';
import { type GPic, planeOf } from '../../src/lesson/topics/linear-inequalities-2d/ineqPic';
import { FAMILY_NAMES, GENERATORS, MC, type IItem } from '../../src/lesson/topics/linear-inequalities-2d/items';
import { PLAN } from '../../src/lesson/topics/linear-inequalities-2d/plan';
import { explain } from '../../src/lesson/topics/linear-inequalities-2d/explain';
import { LINES } from '../../src/lesson/topics/linear-inequalities-2d/script';
import { type Form, halfOf, rel } from '../../src/lesson/topics/linear-inequalities-2d/ineq';
import type { GItem } from '../../src/lesson/topics/linear-inequalities-2d/ineqPic';

const SLUG = 'linear-inequalities-2d';
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

// ===================== the plane of a part: a GPic drawn with the kit's Plane, steps under a prefix =====================
interface Scene2 { P: PlaneBlock; draw(c: Canvas, f?: PFocus): void }
function planeScene(pre: string, g: GPic): Scene2 {
  const P = planeOf(g, MF, th);
  const prog = progressOf<string>(s => tr.k(pre + s));
  return { P, draw: (c, f) => P.draw(c, prog, f) };
}
const ring = (pre: string, key: string, col: 'link' | 'pick' | 'wrong' | 'first' | 'second' = 'pick') => ({ key, col, k: tr.k(pre + 'r.' + key) });
const bline = (key: string, F: Form, o: { dash?: boolean; col?: Paint; name?: string } = {}): GItem => {
  const r = rel(F);
  return { kind: 'bline', key, A: r.A, B: r.B, C: r.C, dash: o.dash ?? (r.op === '<' || r.op === '>'), col: o.col, name: o.name };
};
const shade = (key: string, Fs: Form[], col?: 'link' | 'first' | 'second' | 'wrong', alpha?: number): GItem => ({ kind: 'shade', key, parts: Fs.map(halfOf), col, alpha });
const q1 = (p: number, d = 1) => ({ p, q: d });

// ===================== parts 1-2: y > x + 1 =====================
const F1: Form = { f: 'si', m: q1(1), b: q1(1), op: '>' };
const G1: GPic = {
  x: { min: -5, max: 5, step: 1, name: 'x' }, y: { min: -4, max: 6, step: 1, name: 'y' }, equal: true,
  items: [
    shade('sh', [F1]),
    bline('ref', { ...F1, op: '>=' }, { col: 'dim', dash: false }),
    { kind: 'text', key: 'refT', x: -4.6, y: 4.6, text: 'y = x + 1', col: 'ink', align: 'left' },
    bline('L', F1),
    { kind: 'point', key: 'A', x: 0, y: 3, col: 'pick', name: '(0, 3)' }, { kind: 'point', key: 'Av', x: 0, y: 3, col: 'link' },
    { kind: 'point', key: 'B', x: 3, y: 1, col: 'pick', name: '(3, 1)' }, { kind: 'point', key: 'Bv', x: 3, y: 1, col: 'wrong' },
    { kind: 'point', key: 'C', x: -2, y: 0.5, col: 'pick', name: '(−2, 0.5)' }, { kind: 'point', key: 'Cv', x: -2, y: 0.5, col: 'link' },
    { kind: 'point', key: 'D', x: 2, y: 3, col: 'pick', name: '(2, 3)' }, { kind: 'point', key: 'Dv', x: 2, y: 3, col: 'wrong', open: true },
    { kind: 'point', key: 'O', x: 0, y: 0, col: 'wrong', name: '(0, 0)' },
    { kind: 'seg', key: 'up', a: [3, 4], b: [3, 6], col: 'link', arrow: true, w: 6 },
    { kind: 'point', key: 'M', x: 3, y: 4, col: 'first' },
    { kind: 'text', key: 'Mt', x: 3.35, y: 5.2, text: 'y > 4', col: 'link', align: 'left' },
  ],
  show: [], solve: [],
};

// ===================== 1. The question =====================
const CARDS = [
  { v: 'Every point above the line,', s: 'the line left out', t: 'every point above, not the line', id: '', why: 'q.cb.right' },
  { v: 'Only the points', s: 'on the line y = x + 1', t: 'only the points on the line', id: MC.bOnly, why: 'q.cb.line' },
  { v: 'Every point above the line,', s: 'and the line too', t: 'above, and the line too', id: MC.strictIn, why: 'q.cb.incl' },
];
function partQuestion(): void {
  tr.reset('q.');
  const S = planeScene('q.', G1);
  const lines = [line('q.T1', 'y > x + 1', 170, 84), line('q.T2', '(x,\\ y) = \\,?', 320, 72)];
  setScene({ model: c => S.draw(c), lines, leads: [] });
  tr.set('q.axes', 1, 1.0); tr.set('q.ref', 1, 1.2, 0.8); tr.set('q.refT', 1, 0.6, 1.8);
  tr.set('q.T1', 1, 1.0, 1.6); tr.set('q.T2', 1, 0.8, 2.3);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Which points make y > x + 1 true?', board: 'y > x + 1', response: c.t, expected: CARDS[0]!.t, correct: c.id === '', mc: c.id || undefined, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'All the solutions'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const S = planeScene('e.', G1);
  const lime = { col: 'link' as const }, red = { col: 'wrong' as const };
  const lines = [
    line('e.TA', '(0,\\,3)\\!:\\ \\cssId{v}{3 > 1}\\,\\checkmark', 140, 62, { v: lime }),
    line('e.TB', '(3,\\,1)\\!:\\ \\cssId{v}{1 > 4}\\,\\times', 235, 62, { v: red }),
    line('e.TC', '(-2,\\,0.5)\\!:\\ \\cssId{v}{0.5 > -1}\\,\\checkmark', 330, 60, { v: lime }),
    line('e.TD', '(2,\\,3)\\!:\\ \\cssId{v}{3 > 3}\\,\\times', 425, 62, { v: red }),
    line('e.TL', '\\cssId{e}{y = x + 1}:\\ \\text{dashed}', 545, 64, { e: lime }),
    line('e.TO', '(0,\\ 0):\\ 0 > 1\\ \\times', 660, 62),
    line('e.TM', 'x = 3:\\ \\ \\cssId{e}{y > 4}', 775, 62, { e: lime }),
    line('e.TF', '\\cssId{e}{y > x + 1}:\\ \\text{above}', 895, 64, { e: lime }),
  ];
  setScene({ model: c => S.draw(c, { dim: tr.k('e.dimPts') > 0.5 ? ['A', 'B', 'C', 'Av', 'Bv', 'Cv'] : [], ring: [ring('e.', 'D', 'wrong'), ring('e.', 'O', 'wrong'), ring('e.', 'M', 'link')] }), lines, leads: [] });
  tr.jump('e.axes', 1);
  let step = 0;
  const STEPS = [
    { t: 'Test single points', why: 'True or false, point by point.', act: 'Test four points' },
    { t: 'The boundary', why: 'Where the two sides are equal.', act: 'Draw the boundary' },
    { t: 'One test point', why: 'Pick the side, shade it.', act: 'Test (0, 0)' },
    { t: 'Why a whole side', why: 'Straight up from the line.', act: 'Look at x = 3' },
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
        for (const k of ['A', 'B', 'C', 'D']) {
          tr.set('e.' + k, 1, 0.6); await wait(0.5); if (!alive()) return;
          tr.set('e.T' + k, 1, 0.9); await wait(0.7); if (!alive()) return;
          tr.set('e.' + k + 'v', 1, 0.5); await wait(0.5); if (!alive()) return;
        }
      } else if (i === 1) {
        tr.set('e.r.D', 1, 0.5); await wait(0.6); if (!alive()) return;
        tr.set('e.L', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('e.TL', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.r.D', 0, 0.6);
      } else if (i === 2) {
        tr.set('e.dimPts', 1, 0.3);
        tr.set('e.O', 1, 0.6); tr.set('e.r.O', 1, 0.5, 0.3); await wait(0.9); if (!alive()) return;
        tr.set('e.TO', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.r.O', 0, 0.5); tr.set('e.sh', 1, 1.4); await wait(1.6);
      } else {
        tr.set('e.M', 1, 0.6); tr.set('e.r.M', 1, 0.5, 0.3); await wait(0.9); if (!alive()) return;
        tr.set('e.up', 1, 1.0); tr.set('e.Mt', 1, 0.6, 0.6); await wait(1.3); if (!alive()) return;
        tr.set('e.TM', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.r.M', 0, 0.5); tr.set('e.TF', 1, 1.0); await wait(1.2);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'To change from false to true you would have to cross a point where the sides are equal, and those are all on the line.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'It is just the rule: always test one point.', ok: false, id: 'e.why.trick', mc: MC.tpTrick as string | undefined },
      { t: 'It does not: test several points on each side to be safe.', ok: false, id: 'e.why.many', mc: MC.tpDistrust as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does one test point decide the whole side?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: 3x − 2y ≥ 6 =====================
const F3: Form = { f: 'std', A: 3, B: -2, C: 6, op: '>=' };
const G3: GPic = {
  x: { min: -3, max: 6, step: 1, name: 'x' }, y: { min: -5, max: 4, step: 1, name: 'y' }, equal: true,
  items: [
    shade('sh', [F3]),
    bline('Ln', F3, { col: 'dim', dash: false }),
    bline('L', F3, { dash: false }),
    { kind: 'point', key: 'X', x: 2, y: 0, col: 'first', name: '(2, 0)' },
    { kind: 'point', key: 'Y', x: 0, y: -3, col: 'second', name: '(0, −3)' },
    { kind: 'point', key: 'O', x: 0, y: 0, col: 'wrong', name: '(0, 0)' },
    { kind: 'point', key: 'K', x: 4, y: 0, col: 'link', name: '(4, 0)' },
  ],
  show: [], solve: [],
};
function partTurn(): void {
  tr.reset('t.');
  const S = planeScene('t.', G3);
  const lines = [
    line('t.TF', '3x - 2y \\ge 6', 150, 80),
    line('t.TX', '3x = 6,\\ \\ x = 2', 300, 64),
    line('t.TY', '-2y = 6,\\ \\ y = -3', 420, 64),
    line('t.TS', '\\ge:\\ \\text{solid}', 540, 64),
    line('t.TO', '(0,\\ 0):\\ 0 \\ge 6\\ \\times', 660, 62),
    line('t.TK', '(4,\\ 0):\\ 12 \\ge 6\\ \\checkmark', 780, 62),
  ];
  setScene({ model: c => S.draw(c, { ring: [ring('t.', 'Y', 'second'), ring('t.', 'O', 'wrong'), ring('t.', 'K', 'link')] }), lines, leads: [] });
  tr.set('t.axes', 1, 0.9); tr.set('t.TF', 1, 1.0, 0.5); tr.set('t.X', 1, 0.6, 1.4); tr.set('t.TX', 1, 1.0, 1.6);
  let step = 0;
  const STEPS = [
    { t: 'x-intercept', why: 'Done for you.' },
    { t: 'y-intercept', why: 'Your step.' },
    { t: 'Solid or dashed', why: 'Your step.' },
    { t: 'Pick the side', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  step = 1; drawPlan();
  setPanel(h('h2', {}, 'Your turn: 3x − 2y ≥ 6'), voiced('t.intro'), plan, work);
  seq(async alive => { await wait(2.6); if (!alive()) return; askY(); });

  function choiceStep(promptId: string, item: string, prompt: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], then: () => void): void {
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item, prompt, response: o.t.replace(/<[^>]+>/g, ''), expected: opts.find(x => x.ok)!.t.replace(/<[^>]+>/g, ''), correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (o.ok) { done = true; then(); }
    })));
    work.replaceChildren(voiced(promptId), bx, fbHost);
  }
  function askY(): void {
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.y.empty', false)); return; }
      const v = r.v, right = v === -3;
      const mc = v === 2 ? MC.izSwap : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.yint', prompt: '3x − 2y ≥ 6: the y-intercept of the boundary (x = 0), y = ?', board: '3x - 2y = 6', response: v, expected: -3, correct: right, mc });
      if (!right) { fbHost.replaceChildren(voicedFb(v === 2 ? 't.y.swap' : v === 3 ? 't.y.sign' : 't.y.no', false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.y.ok', true));
      seq(async alive => {
        tr.set('t.Y', 1, 0.6); tr.set('t.r.Y', 1, 0.5, 0.2); tr.set('t.TY', 1, 1.0, 0.3); await wait(1.2); if (!alive()) return;
        tr.set('t.Ln', 1, 1.4); await wait(1.6); if (!alive()) return;
        tr.set('t.r.Y', 0, 0.5); step = 2; drawPlan(); askStyle();
      });
    }
    work.replaceChildren(voiced('t.y'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askStyle(): void {
    choiceStep('t.st', 'turn.style', '3x − 2y ≥ 6: is the boundary solid or dashed?', [
      { t: 'Dashed: the points on the line are not solutions', ok: false, id: 't.st.no', mc: MC.inclOut },
      { t: 'Solid: the points on the line are solutions', ok: true, id: 't.st.ok' },
    ], () => seq(async alive => {
      tr.set('t.Ln', 0, 0.4); tr.set('t.L', 1, 1.2); tr.set('t.TS', 1, 1.0, 0.4); await wait(1.6); if (!alive()) return;
      step = 3; drawPlan();
      tr.set('t.O', 1, 0.6); tr.set('t.r.O', 1, 0.5, 0.2); tr.set('t.TO', 1, 1.0, 0.3); await wait(1.3); if (!alive()) return;
      askSide();
    }));
  }
  function askSide(): void {
    choiceStep('t.side', 'turn.side', '3x − 2y ≥ 6, and (0, 0) gives 0 ≥ 6, false: which side do you shade?', [
      { t: 'Above the line: ≥ means above', ok: false, id: 't.side.above', mc: MC.aboveGreater },
      { t: 'The side with (0, 0)', ok: false, id: 't.side.origin', mc: MC.tpSide },
      { t: 'Below the line, away from (0, 0)', ok: true, id: 't.side.ok' },
    ], () => seq(async alive => {
      tr.set('t.r.O', 0, 0.4); tr.set('t.sh', 1, 1.4); await wait(1.5); if (!alive()) return;
      tr.set('t.K', 1, 0.6); tr.set('t.r.K', 1, 0.5, 0.2); tr.set('t.TK', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return;
      tr.set('t.r.K', 0, 0.5); step = 4; drawPlan(); work.append(callback());
    }));
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

// ===================== 4. Prove it: Jordan's strip =====================
const FU: Form = { f: 'si', m: q1(2), b: q1(1), op: '>=' }, FL: Form = { f: 'si', m: q1(2), b: q1(-3), op: '<=' };
const G4: GPic = {
  x: { min: -6, max: 6, step: 1, name: 'x' }, y: { min: -6, max: 6, step: 1, name: 'y' }, equal: true,
  items: [
    shade('strip', [{ ...FU, op: '<=' }, { ...FL, op: '>=' }], 'wrong', 0.28),
    shade('shU', [FU], 'first', 0.3), shade('shL', [FL], 'second', 0.3),
    bline('U', FU, { col: 'first' }), bline('Lo', FL, { col: 'second' }),
    { kind: 'point', key: 'J', x: 0, y: -1, col: 'wrong', name: '(0, −1)' },
  ],
  show: [], solve: [],
};
function partProve(): void {
  tr.reset('p.');
  const S = planeScene('p.', G4);
  const lines = [
    line('p.R0', '\\cssId{a}{y \\ge 2x + 1}', 150, 70, { a: { col: 'first' } }),
    line('p.R0b', '\\cssId{b}{y \\le 2x - 3}', 255, 70, { b: { col: 'second' } }),
    line('p.R1', '(0,\\,-1)\\!:\\ -1 \\ge 1\\,\\times', 400, 62),
    line('p.R2', '2x + 1 \\le y \\le 2x - 3', 540, 62),
    line('p.R3', '\\Rightarrow\\ 1 \\le -3\\ \\times', 660, 64),
    line('p.R4', '\\text{no solution}', 790, 66),
  ];
  lines[5]!.col = 'link';
  setScene({ model: c => S.draw(c, { dim: tr.k('p.dimStrip') > 0.5 ? ['strip'] : [], ring: [ring('p.', 'J', 'wrong')] }), lines, leads: [] });
  tr.set('p.axes', 1, 0.9); tr.set('p.U', 1, 1.0, 0.6); tr.set('p.Lo', 1, 1.0, 0.9); tr.set('p.strip', 1, 1.0, 1.6); tr.set('p.R0', 1, 1.0, 1.0); tr.set('p.R0b', 1, 1.0, 1.4);
  const CHIPS = [
    { t: '−1 ≥ 2(0) + 1 is false: it breaks y ≥ 2x + 1.', fits: 0 },
    { t: 'y ≥ 2x + 1 shades above the upper line, y ≤ 2x − 3 below the lower one.', fits: 1 },
    { t: 'Both at once need 2x + 1 ≤ y ≤ 2x − 3, so 1 ≤ −3, which is false.', fits: 2 },
    { t: 'Two inequalities always share some region.', fits: -1, mc: MC.alwaysRegion, id: 'p.no.always' },
    { t: 'A point only has to make one of them true.', fits: -1, mc: MC.oneCond, id: 'p.no.one' },
    { t: '(0, 0) breaks the first one, so no point works.', fits: -1, mc: MC.examples, id: 'p.no.example' },
  ];
  const CLAIMS = [
    'The point <b>(0, −1)</b> in Jordan’s strip is <b>not a solution</b>,',
    'The two half-planes <b>face away</b> from each other,',
    '<b>No point</b> makes both true: the system has <b>no solution</b>,',
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
      if (n === 1) { tr.set('p.J', 1, 0.6); tr.set('p.r.J', 1, 0.5, 0.3); tr.set('p.R1', 1, 1.0, 0.5); await wait(1.6); if (!alive()) return; tr.set('p.r.J', 0, 0.5); }
      if (n === 2) { tr.set('p.dimStrip', 1, 0.2); tr.set('p.shU', 1, 1.2); await wait(1.0); if (!alive()) return; tr.set('p.shL', 1, 1.2); await wait(1.4); }
      if (n === 3) {
        tr.set('p.R2', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('p.R3', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('p.strip', 0, 0.8); tr.set('p.R4', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
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
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan shades the strip between y ≥ 2x + 1 and y ≤ 2x − 3: "two inequalities always make a region". Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.alwaysRegion : undefined });
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
    show: it => showItem(it as IItem),
  });
}
/** the board of a practice item: its TeX and the given lines on top, the worked TeX lines under them on the solve */
function boardLines(item: IItem): Line[] {
  const given = item.picture?.bd ?? [];
  const out = [line('x.board', item.board, 150, 76), ...given.map((t, i) => line(`x.given${i}`, t, 270 + i * 110, 64))];
  const y0 = 270 + given.length * 110 + 40;
  (item.picture?.tex ?? []).forEach((t, i) => { const L = line(`x.sol${i}`, t, y0 + i * 130, 68); L.col = 'link'; out.push(L); });
  return out;
}
async function writeTex(item: IItem, alive: () => boolean): Promise<void> {
  for (let i = 0; i < (item.picture?.tex ?? []).length; i++) { tr.set(`x.sol${i}`, 1, 1.0); await wait(0.9); if (!alive()) return; }
}
function showBoard(item: IItem): void {
  tr.set('x.board', 1, 0.8, 0.3);
  (item.picture?.bd ?? []).forEach((_, i) => tr.set(`x.given${i}`, 1, 0.8, 0.5 + 0.2 * i));
}
/** a big slate for an item with nothing to draw yet: the board, the given lines, the worked lines */
function slateLines(item: IItem): Line[] {
  const big = box(200, 160, 1720, 920);
  const given = item.picture?.bd ?? [], sol = item.picture?.tex ?? [];
  const rows = 1 + given.length + sol.length, hRow = Math.min(240, (big.h - 60) / Math.max(rows, 2));
  const out: Line[] = [bigLine('x.board', item.board, box(big.x0, big.y0 + 30, big.x1, big.y0 + 30 + hRow), given.length ? 110 : 130)];
  given.forEach((t, i) => out.push(bigLine(`x.given${i}`, t, box(big.x0, big.y0 + 30 + (i + 1) * hRow, big.x1, big.y0 + 30 + (i + 2) * hRow), 90)));
  sol.forEach((t, i) => { const L = bigLine(`x.sol${i}`, t, box(big.x0, big.y0 + 30 + (1 + given.length + i) * hRow, big.x1, big.y0 + 30 + (2 + given.length + i) * hRow), 100); L.col = 'link'; out.push(L); });
  return out;
}
function showItem(item: IItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const g = item.picture?.g;
  const made = g ? tryBlock(() => planeScene('x.', g)) : null;
  if (g && made && !made.ok) console.warn('plane picture did not fit', item.id, made.error);
  if (g && made?.ok) {
    const S = made.value;
    const onPlane = () => {
      setScene({ model: c => S.draw(c), lines: boardLines(item), leads: [] });
    };
    if (g.show.length) {
      onPlane();
      tr.set('x.axes', 1, 0.8);
      g.show.forEach((k, i) => tr.set('x.' + k, 1, 0.9, 0.3 + 0.12 * i));
      showBoard(item);
      return { solve: async alive => { for (const k of g.solve) { tr.set('x.' + k, 1, 1.0); await wait(g.solve.length > 8 ? 0.08 : 0.6); if (!alive()) return; } await writeTex(item, alive); } };
    }
    // nothing to draw before the answer: a slate now, the plane on the worked solution
    setScene({ lines: slateLines(item), leads: [], boardBox: box(200, 160, 1720, 920) });
    showBoard(item);
    return {
      solve: async alive => {
        onPlane(); tr.jump('x.board', 1); (item.picture?.bd ?? []).forEach((_, i) => tr.jump(`x.given${i}`, 1));
        tr.set('x.axes', 1, 0.8); await wait(0.8); if (!alive()) return;
        for (const k of g.solve) { tr.set('x.' + k, 1, 1.0); await wait(g.solve.length > 8 ? 0.08 : 0.6); if (!alive()) return; }
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
  warm: ['y > x + 1 \\ge \\le \\checkmark \\times', '\\text{dashed}\\ \\Rightarrow', '(-2,\\ 0.5)', '\\tfrac{2}{3}', '\\square'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
