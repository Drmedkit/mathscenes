// quadratic-functions.ts: "Quadratic functions and their graphs" (Algebra 1, lesson 17).
//   1 The question   y = (x + 1)(x − 5): the two zeros on the kit Plane; where is the lowest point? Cards (2, −9) /
//                    (0, −5) (the parabola centred on the y-axis) / (2, 0) (the vertex height as 0)
//   2 Worked example zeros from the factors → the axis halfway between them (mirror points) → the vertex height f(2)
//                    → the y-intercept and its mirror, then the curve through all of it; one function, three forms.
//                    Why is the axis halfway? (3 reasons)
//   3 Your turn      y = −(x + 2)(x − 4), faded from the end: the zeros are given; the kid types the axis (1), the
//                    vertex height (9, a maximum) and the y-intercept (8)
//   4 Prove it       Sam checked f(1) = f(5) for f(x) = (x − 3)² − 4 and calls it a proof of symmetry. A
//                    because-chain with a general distance d proves f(3 + d) = f(3 − d) for every d
//   5 Practice       all 33 sub-goals in order, then mixed (runtime/practice.ts), every picture on the kit Plane
// Voiced lines: pages/lessons/quadratic-functions/voice/lines.json. Every answer is logged (runtime/store.ts).
// Step keys: Plane items are '<part>.g.<key>', board lines '<part>.E<n>' / '<part>.T<n>' / '<part>.P<n>' / 'x.B'.
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { bigLine, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { Plane, type PFocus, type PItem, type PlaneBlock } from '../../src/lesson/kit/Plane';
import { FAMILY_NAMES, GENERATORS, MC, type QItem } from '../../src/lesson/topics/quadratic-functions/items';
import { PLAN } from '../../src/lesson/topics/quadratic-functions/plan';
import { explain } from '../../src/lesson/topics/quadratic-functions/explain';
import { planeParams } from '../../src/lesson/topics/quadratic-functions/pic';
import { fn, fromV, fromZ } from '../../src/lesson/topics/quadratic-functions/qf';
import LINES from './quadratic-functions/voice/lines.json';

const SLUG = 'quadratic-functions';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
const X = '<i>x</i>', Y = '<i>y</i>';
function voiced(id: string, htmlText: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, htmlText);
}
function voicedFb(id: string, ok: boolean, htmlText: string): HTMLElement { if (!(id in LINES)) console.warn('no voice line', id); say(id); return feedback(ok, htmlText); }

// ===================== layout: the plane on the left, a wide board on the right =====================
const FR = frame(40, 70, 780, 940);
const BB = box(860, 70, 1860, 1010), BX0 = BB.x0 + 50, BW = BB.w - 100;
const lime = { col: 'link' as Paint }, amber = { col: 'first' as Paint }, teal = { col: 'second' as Paint }, lav = { col: 'pick' as Paint };
/** a board line, left-aligned, shrinking to fit (>= 60 px) */
function bl(key: string, src: string, y: number, size = 72, tags?: Line['tags']): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BW) s -= 2;
  return { key, F, x: BX0, y, size: s, tags };
}
function planeScene(pre: string, B: PlaneBlock, lines: Line[], focus?: () => PFocus): void {
  const P = progressOf<string>(s => tr.k(pre + 'g.' + s));
  setScene({ model: c => B.draw(c, P, focus?.() ?? {}), lines, leads: [], boardBox: BB });
}
const ring = (pre: string, key: string, col: Paint = 'pick') => ({ key, col, k: tr.k(`${pre}r.${key}`) });

// ===================== the function of parts 1 and 2: y = (x + 1)(x − 5) =====================
const S1 = fromZ(1, -1, 5);
function plane1(): PlaneBlock {
  const items: PItem[] = [
    { kind: 'vline', key: 'axis', x: 2, col: 'pick' },
    { kind: 'curve', key: 'f', f: fn(S1), col: 'link' },
    { kind: 'seg', key: 'd0', a: [-1, 0], b: [1.85, 0], col: 'first', arrow: true, w: 6 },
    { kind: 'seg', key: 'd1', a: [5, 0], b: [2.15, 0], col: 'first', arrow: true, w: 6 },
    { kind: 'seg', key: 'cm', a: [0, -5], b: [4, -5], col: 'pick', dash: true },
    { kind: 'point', key: 'z0', x: -1, y: 0, col: 'second', name: '−1' },
    { kind: 'point', key: 'z1', x: 5, y: 0, col: 'second', name: '5' },
    { kind: 'point', key: 'V', x: 2, y: -9, col: 'link', name: '(2, −9)' },
    { kind: 'point', key: 'C', x: 0, y: -5, col: 'water', name: '(0, −5)' },
    { kind: 'point', key: 'M', x: 4, y: -5, col: 'water', name: '(4, −5)' },
  ];
  return Plane({ x: { min: -3, max: 7, step: 1, name: 'x' }, y: { min: -10, max: 6, step: 2, name: 'y' }, items }, FR, th);
}

// ===================== 1. The question =====================
const CARDS = [
  { t: '(2, −9)', id: '', why: 'q.cb.right' },
  { t: '(0, −5)', id: MC.yAxis, why: 'q.cb.yaxis' },
  { t: '(2, 0)', id: MC.facHeight, why: 'q.cb.zero' },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = plane1();
  planeScene('q.', B, [bl('q.E1', 'y = (x + 1)(x - 5)', 260, 84), bl('q.E2', '\\text{lowest point: } (\\,?\\,,\\,?\\,)', 420, 72)], () => ({ ring: [ring('q.', 'z0', 'second'), ring('q.', 'z1', 'second')] }));
  tr.set('q.g.axes', 1, 1.0, 0.2); tr.set('q.g.z0', 1, 0.6, 1.0); tr.set('q.g.z1', 1, 0.6, 1.3); tr.set('q.E1', 1, 1.1, 1.7); tr.set('q.E2', 1, 0.8, 2.6);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'y = (x + 1)(x - 5) has zeros -1 and 5. Where is the lowest point of its graph?', board: 'y = (x + 1)(x - 5)', response: c.t, expected: '(2, −9)', correct: c.id === '', mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = cd.t; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'The lowest point'),
    voiced('q.intro', `The graph of <b>${Y} = (${X} + 1)(${X} − 5)</b> crosses the ${X}-axis at −1 and at 5. It is a parabola that opens up. Where is its lowest point? Pick an answer, and say how sure you are.`),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn),
  );
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const B = plane1();
  const lines = [
    bl('e.E1', 'y = (x + 1)(x - 5)', 150),
    bl('e.E2', 'x + 1 = 0 \\text{ or } x - 5 = 0', 270, 68),
    bl('e.E3', '\\cssId{z}{x = -1} \\text{ or } \\cssId{w}{x = 5}', 385, 68, { z: teal, w: teal }),
    bl('e.E4', '\\text{axis: } \\cssId{a}{x = \\frac{-1 + 5}{2} = 2}', 525, 68, { a: lav }),
    bl('e.E5', 'y = (2 + 1)(2 - 5) = \\cssId{v}{-9}', 670, 68, { v: lime }),
    bl('e.E6', 'f(0) = (1)(-5) = \\cssId{c}{-5}', 790, 68, { c: amber }),
    bl('e.E7', 'y = (x - 2)^2 - 9 = x^2 - 4x - 5', 920, 64),
  ];
  planeScene('e.', B, lines, () => ({ ring: ['z0', 'z1', 'V', 'C', 'M'].map(k => ring('e.', k, k === 'V' ? 'link' : 'pick')), trace: { key: 'f', x: tr.k('e.tx') * 6.6 - 1.8, k: tr.k('e.trk'), digits: 1 } }));
  tr.jump('e.g.axes', 1); tr.jump('e.E1', 1);
  let step = 0;
  const STEPS = [
    { t: 'Find the zeros', why: 'Each factor is 0 at one input.', act: 'Find them' },
    { t: 'Put the axis halfway', why: 'Both zeros have output 0.', act: 'Draw it' },
    { t: 'Find the vertex', why: 'The height on the axis.', act: 'Find it' },
    { t: 'Mirror the y-intercept, then sketch', why: 'f(0), and its partner.', act: 'Sketch it' },
  ];
  const SAY = [
    `${X} + 1 is 0 at ${X} = −1, and ${X} − 5 is 0 at ${X} = 5. A product is 0 when one factor is 0, so the zeros are <b class="s">−1 and 5</b>.`,
    `Both zeros have the same output, 0, so they are mirror images. The mirror line is halfway between them: (−1 + 5) ÷ 2 = 2. The axis of symmetry is <b class="s">${X} = 2</b>.`,
    `On the axis, ${X} = 2: ${Y} = (2 + 1)(2 − 5) = 3 · (−3) = −9. The vertex is <b class="s">(2, −9)</b>. The ${X}² term is positive, so the parabola opens up and −9 is the minimum.`,
    `At ${X} = 0, ${Y} = (1)(−5) = −5. Its mirror is as far on the other side of ${X} = 2, at (4, −5). The curve goes through all of these. One function, three forms: (${X} + 1)(${X} − 5) = (${X} − 2)² − 9 = ${X}² − 4${X} − 5.`,
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
        tr.set('e.g.z0', 1, 0.6); tr.set('e.r.z0', 1, 0.4, 0.3); await wait(0.9); if (!alive()) return;
        tr.set('e.g.z1', 1, 0.6); tr.set('e.r.z1', 1, 0.4, 0.3); await wait(1.0); if (!alive()) return;
        tr.set('e.r.z0', 0, 0.5); tr.set('e.r.z1', 0, 0.5); tr.set('e.E2', 1, 1.1); await wait(1.2); if (!alive()) return;
        tr.set('e.E3', 1, 1.0); await wait(1.1);
      } else if (i === 1) {
        tr.set('e.g.d0', 1, 1.2); tr.set('e.g.d1', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.g.axis', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('e.E2:dim', 1, 0.5); tr.set('e.E4', 1, 1.2); await wait(1.3);
      } else if (i === 2) {
        tr.set('e.g.d0', 0, 0.6); tr.set('e.g.d1', 0, 0.6);
        tr.set('e.g.V', 1, 0.7, 0.3); tr.set('e.r.V', 1, 0.5, 0.6); await wait(1.4); if (!alive()) return;
        tr.set('e.E5', 1, 1.2); await wait(1.2); if (!alive()) return; tr.set('e.r.V', 0, 0.6);
      } else {
        tr.set('e.g.C', 1, 0.6); tr.set('e.r.C', 1, 0.4, 0.3); await wait(0.9); if (!alive()) return;
        tr.set('e.E6', 1, 1.0); tr.set('e.g.cm', 1, 1.0, 0.4); await wait(1.4); if (!alive()) return;
        tr.set('e.g.M', 1, 0.6); tr.set('e.r.M', 1, 0.4, 0.2); tr.set('e.r.C', 0, 0.5, 0.4); await wait(1.0); if (!alive()) return;
        tr.set('e.r.M', 0, 0.5); tr.set('e.g.f', 1, 2.2); await wait(2.3); if (!alive()) return;
        tr.set('e.trk', 1, 0.4); tr.set('e.tx', 1, 3.2); await wait(3.4); if (!alive()) return; tr.set('e.trk', 0, 0.5);
        tr.set('e.E3:dim', 1, 0.5); tr.set('e.E7', 1, 1.3); await wait(1.4);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`, SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: `Both zeros have output 0. Points with equal outputs are mirror images, equally far from the axis, so it is halfway.`, ok: true, id: 'e.why.ok', mc: undefined as string | undefined, say: 'Yes. Equal outputs come in mirror pairs, and the zeros are one such pair.' },
      { t: `Every parabola is centred on the ${Y}-axis; halfway is just a coincidence here.`, ok: false, id: 'e.why.yaxis', mc: MC.yAxis, say: 'Look at the picture: this one is centred on x equals two, not on the y-axis.' },
      { t: `Halfway means half the distance: (5 − (−1)) ÷ 2 = 3, so the axis is ${X} = 3.`, ok: false, id: 'e.why.half', mc: MC.halfDiff, say: 'Three is half the distance. Start at minus one and go three: you land on two. Add the zeros and halve.' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the axis exactly halfway between the zeros?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'Quick check: why is the axis exactly halfway between the zeros?', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Zeros, axis, vertex'), voiced('e.intro', 'Four steps. Press each one: the picture moves first, then the algebra.', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: y = −(x + 2)(x − 4) =====================
const S3 = fromZ(-1, -2, 4);
function partTurn(): void {
  tr.reset('t.');
  const items: PItem[] = [
    { kind: 'vline', key: 'axis', x: 1, col: 'pick' },
    { kind: 'curve', key: 'f', f: fn(S3), col: 'link' },
    { kind: 'seg', key: 'cm', a: [0, 8], b: [2, 8], col: 'pick', dash: true },
    { kind: 'point', key: 'z0', x: -2, y: 0, col: 'second', name: '−2' },
    { kind: 'point', key: 'z1', x: 4, y: 0, col: 'second', name: '4' },
    { kind: 'point', key: 'V', x: 1, y: 9, col: 'link', name: '(1, 9)' },
    { kind: 'point', key: 'C', x: 0, y: 8, col: 'water' },
    { kind: 'point', key: 'M', x: 2, y: 8, col: 'water' },
  ];
  const B = Plane({ x: { min: -4, max: 6, step: 1, name: 'x' }, y: { min: -8, max: 12, step: 2, name: 'y' }, items }, FR, th);
  const lines = [
    bl('t.E1', 'y = -(x + 2)(x - 4)', 150),
    bl('t.E2', '\\cssId{z}{x = -2} \\text{ or } \\cssId{w}{x = 4}', 270, 68, { z: teal, w: teal }),
    bl('t.Q3', '\\text{axis: } x = \\,?', 410, 68),
    bl('t.E3', '\\text{axis: } \\cssId{a}{x = \\frac{-2 + 4}{2} = 1}', 410, 68, { a: lav }),
    bl('t.Q4', 'y = -(1 + 2)(1 - 4) = \\,?', 560, 68),
    bl('t.E4', 'y = -(1 + 2)(1 - 4) = \\cssId{v}{9}', 560, 68, { v: lime }),
    bl('t.E5', '\\text{vertex } (1, 9) \\text{, a maximum}', 680, 64),
    bl('t.Q6', 'f(0) = \\,?', 810, 68),
    bl('t.E6', 'f(0) = -(2)(-4) = \\cssId{c}{8}', 810, 68, { c: amber }),
  ];
  planeScene('t.', B, lines, () => ({ ring: [ring('t.', 'V', 'link'), ring('t.', 'C')] }));
  tr.set('t.g.axes', 1, 1.0, 0.2); tr.set('t.E1', 1, 1.0, 0.8); tr.set('t.g.z0', 1, 0.6, 1.4); tr.set('t.g.z1', 1, 0.6, 1.6); tr.set('t.E2', 1, 1.0, 2.0);
  let step = 0;
  const STEPS = [
    { t: 'Find the zeros', why: 'Done for you: −2 and 4.' },
    { t: 'Put the axis halfway', why: 'Your step.' },
    { t: 'Find the vertex', why: 'Your step.' },
    { t: 'Find the y-intercept', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: y = −(x + 2)(x − 4)'), voiced('t.intro', `Now <b>${Y} = −(${X} + 2)(${X} − 4)</b>. Its zeros are −2 and 4.`), plan, work);
  seq(async alive => { await wait(2.8); if (!alive()) return; step = 1; drawPlan(); askAxis(); });

  function askNum(id: string, prompt: string, right: number, wrong: (v: number) => { id: string; say: string; mc?: string } | null, item: string, onOk: () => void, okSay: string, noSay: string): void {
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false, 'Type a number first.')); return; }
      const v = r.v, isRight = v === right, w = isRight ? null : wrong(v);
      ctx.store.log({ part: 'turn', item, prompt: prompt.replace(/<[^>]+>/g, ''), board: 'y = -(x + 2)(x - 4)', response: v, expected: right, correct: isRight, mc: w?.mc });
      if (!isRight) { fbHost.replaceChildren(w ? voicedFb(w.id, false, w.say) : voicedFb(`${id}.no`, false, noSay)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb(`${id}.ok`, true, okSay));
      onOk();
    }
    work.replaceChildren(voiced(id, prompt), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askAxis(): void {
    tr.set('t.Q3', 1, 0.6);
    askNum('t.axis', `The axis of symmetry is halfway between the zeros. ${X} = ?`, 1, v =>
      v === 3 ? { id: 't.axis.half', mc: MC.halfDiff, say: `3 is half the distance between them. Start at −2 and go 3: add the zeros and halve.` }
        : v === -1 ? { id: 't.axis.sign', mc: MC.wrongSign, say: `The zeros are −2 and 4, as they are: (−2 + 4) ÷ 2.` } : null,
    'turn.axis', () => seq(async alive => {
      tr.set('t.Q3', 0, 0.3); tr.set('t.E3', 1, 1.0); tr.set('t.g.axis', 1, 1.2, 0.3); await wait(1.6); if (!alive()) return;
      step = 2; drawPlan(); askVertex();
    }), `Yes: ${X} = 1, halfway between −2 and 4.`, 'Add the two zeros, then divide by 2.');
  }
  function askVertex(): void {
    tr.set('t.Q4', 1, 0.6);
    askNum('t.vertex', `Put ${X} = 1 into −(${X} + 2)(${X} − 4). How high is the vertex?`, 9, v =>
      v === -9 ? { id: 't.vertex.sign', mc: MC.signA, say: `(1 + 2)(1 − 4) = −9, and the minus in front flips it: −(−9) = 9.` }
        : v === 0 || v === -1 ? { id: 't.vertex.zero', mc: MC.facHeight, say: `The vertex is not on the ${X}-axis. Work out −(1 + 2)(1 − 4).` } : null,
    'turn.vertex', () => seq(async alive => {
      tr.set('t.Q4', 0, 0.3); tr.set('t.E4', 1, 1.0); tr.set('t.g.V', 1, 0.7, 0.3); tr.set('t.r.V', 1, 0.5, 0.6); await wait(1.4); if (!alive()) return;
      tr.set('t.E5', 1, 1.0); tr.set('t.r.V', 0, 0.6, 0.6); await wait(1.2); if (!alive()) return;
      step = 3; drawPlan(); askIntercept();
    }), `Yes: 9. The minus in front makes it open down, so (1, 9) is the highest point: a maximum.`, 'Work out (1 + 2)(1 − 4) first, then apply the minus in front.');
  }
  function askIntercept(): void {
    tr.set('t.Q6', 1, 0.6);
    askNum('t.int', `Now the ${Y}-intercept: what is <i>f</i>(0)?`, 8, v =>
      v === -8 ? { id: 't.int.sign', say: `−(0 + 2)(0 − 4) = −(2)(−4): two minus signs, so it is positive.` }
        : v === 9 ? { id: 't.int.k', mc: MC.kAsInt, say: `9 is the vertex height. The ${Y}-intercept is the output at ${X} = 0.` } : null,
    'turn.intercept', () => seq(async alive => {
      tr.set('t.Q6', 0, 0.3); tr.set('t.E6', 1, 1.0); tr.set('t.g.C', 1, 0.6, 0.3); tr.set('t.r.C', 1, 0.4, 0.5); await wait(1.2); if (!alive()) return;
      tr.set('t.g.cm', 1, 0.8); tr.set('t.g.M', 1, 0.6, 0.6); tr.set('t.r.C', 0, 0.5, 0.6); await wait(1.4); if (!alive()) return;
      tr.set('t.g.f', 1, 2.2); await wait(2.3); if (!alive()) return;
      step = 4; drawPlan(); work.append(callback());
    }), `Yes: 8. Its mirror across ${X} = 1 is (2, 8). Now the curve fits through everything.`, `Put ${X} = 0 in: −(0 + 2)(0 − 4).`);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const text: Record<string, string> = {
      'q.cb.right': 'At the start you picked (2, −9), and you were right. Now you know why: halfway between the zeros, then the height there.',
      'q.cb.yaxis': `At the start you picked (0, −5). That is where the graph crosses the ${Y}-axis. A parabola turns halfway between its zeros, at ${X} = 2.`,
      'q.cb.zero': `At the start you picked (2, 0). The ${X} was right, but the vertex is not on the ${X}-axis: its height is f(2) = −9.`,
      'q.cb.none': 'Zeros, then the axis halfway, then the height there: that finds the vertex of any parabola in factored form.',
    };
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, text[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: the axis is a mirror line for every pair =====================
const S4 = fromV(1, 3, -4);
function partProve(): void {
  tr.reset('p.');
  const f4 = fn(S4), items: PItem[] = [{ kind: 'vline', key: 'axis', x: 3, col: 'pick' }, { kind: 'curve', key: 'f', f: f4, col: 'link' }];
  for (const d of [1, 2, 3]) {
    items.push({ kind: 'seg', key: `m${d}`, a: [3 - d, f4(3 - d)], b: [3 + d, f4(3 + d)], col: 'pick', dash: true });
    items.push({ kind: 'point', key: `R${d}`, x: 3 + d, y: f4(3 + d), col: d === 2 ? 'first' : 'second' });
    items.push({ kind: 'point', key: `L${d}`, x: 3 - d, y: f4(3 - d), col: d === 2 ? 'first' : 'water' });
  }
  const B = Plane({ x: { min: -1, max: 7, step: 1, name: 'x' }, y: { min: -6, max: 8, step: 2, name: 'y' }, items }, FR, th);
  const lines = [
    bl('p.L1', 'f(x) = (x - 3)^2 - 4', 160),
    bl('p.L2', 'f(\\cssId{a}{3 + d}) = (d)^2 - 4 = d^2 - 4', 320, 64, { a: teal }),
    bl('p.L3', 'f(\\cssId{b}{3 - d}) = (-d)^2 - 4 = d^2 - 4', 480, 64, { b: { col: 'water' } }),
    bl('p.L4', '\\cssId{e}{f(3 + d) = f(3 - d)} \\text{ for every } d', 640, 64, { e: lime }),
    bl('p.L5', '\\text{mirror line: } \\cssId{m}{x = 3}', 800, 68, { m: lav }),
  ];
  planeScene('p.', B, lines);
  tr.set('p.g.axes', 1, 1.0, 0.2); tr.set('p.g.f', 1, 1.8, 0.6); tr.set('p.g.axis', 1, 1.0, 1.6); tr.set('p.L1', 1, 1.0, 1.2);
  tr.set('p.g.R2', 1, 0.6, 2.4); tr.set('p.g.L2', 1, 0.6, 2.6);
  const CHIPS = [
    { t: `Substitute ${X} = 3 + d: the 3s cancel inside the square.`, fits: 0 },
    { t: `(−d)² = (−d)(−d) = d²: the two minus signs cancel.`, fits: 1 },
    { t: `Both outputs are d² − 4, whatever number d is.`, fits: 2 },
    { t: `Every point (3 + d, ${Y}) has a partner (3 − d, ${Y}) at the same height, as far on the other side.`, fits: 3 },
    { t: `(−d)² = −d², so the left side is lower.`, fits: -1, mc: MC.evenNeg, id: 'p.no.neg', say: 'Minus d times minus d is plus d squared. The minus signs cancel.' },
    { t: `f(3 + d) = f(3) + f(d), and f(d) = f(−d).`, fits: -1, mc: MC.distrib, id: 'p.no.split', say: 'A function does not split over a sum. Put three plus d into the formula instead.' },
    { t: `It worked for d = 2 (Sam's check), so it works for every d.`, fits: -1, mc: MC.examples, id: 'p.no.ex', say: 'One value of d is an example. The algebra has to hold for any d.' },
  ];
  const CLAIMS = [
    `For any distance d: <b><i>f</i>(3 + d) = d² − 4</b>,`,
    `and <b><i>f</i>(3 − d) = d² − 4</b>,`,
    `So <b><i>f</i>(3 + d) = <i>f</i>(3 − d)</b> for every d,`,
    `And <b class="s">${X} = 3 is a mirror line of the whole graph</b>,`,
  ];
  const SAYC = [
    'Right. Three plus d minus three is d, so the square is d squared.',
    'Right. Minus d, squared, is d squared again.',
    'Right. Both sides are the same expression, for every d at once.',
    'Right. Every pair of inputs the same distance from three has the same output. That is a mirror line.',
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t.replace(/<[^>]+>/g, ''), correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(ch.id ? voicedFb(ch.id, false, ch.say!) : voicedFb('p.no.other', false, 'True, but it is the reason for a different line. Which reason makes this line true?')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true, SAYC[n - 1]!));
    seq(async alive => {
      if (n === 1) { for (const d of [1, 3]) tr.set(`p.g.R${d}`, 1, 0.6, d * 0.15); await wait(0.9); if (!alive()) return; tr.set('p.L2', 1, 1.2); }
      if (n === 2) { for (const d of [1, 3]) tr.set(`p.g.L${d}`, 1, 0.6, d * 0.15); await wait(0.9); if (!alive()) return; tr.set('p.L3', 1, 1.2); }
      if (n === 3) { for (const d of [1, 2, 3]) tr.set(`p.g.m${d}`, 1, 0.9, d * 0.3); await wait(1.6); if (!alive()) return; tr.set('p.L4', 1, 1.2); }
      if (n === 4) {
        tr.set('p.L5', 1, 1.2); await wait(1.6); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true, 'That is a proof: it holds for every distance d at once, not just the pair Sam checked. Sam’s check was true, but it was an example.'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Sam has proved it', () => judge(true)), no = btn('Not yet', () => judge(false));
  const proofHost = h('div');
  function judge(proved: boolean): void {
    yes.disabled = no.disabled = true;
    (proved ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam checked f(1) = f(5) for f(x) = (x - 3)^2 - 4. Is that a proof that x = 3 is the axis of symmetry?', response: proved ? 'proved' : 'not yet', expected: 'not yet', correct: !proved, mc: proved ? MC.examples : undefined });
    proofHost.replaceChildren(
      proved ? voiced('p.test', 'One pair matched. But there are infinitely many pairs. Prove it for all of them at once, with a general distance d.') : voiced('p.build', 'Right: one pair is an example. Now prove it for every pair. Fill each “because” with the reason that makes the line true.'),
      chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'),
    voiced('p.intro', `Sam checked <b><i>f</i>(${X}) = (${X} − 3)² − 4</b> at ${X} = 1 and ${X} = 5: both give 0. Sam says: “Equal outputs, 2 either side of 3. That proves ${X} = 3 is the axis of symmetry.” Has Sam proved it?`),
    h('div', { class: 'row' }, yes, no), proofHost);
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
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
/** split TeX at its top-level ' = ' signs (outside braces) */
function splitEq(src: string): string[] {
  const out: string[] = []; let depth = 0, last = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++; else if (ch === '}') depth--;
    else if (depth === 0 && src.startsWith(' = ', i) && i > last) { out.push(src.slice(last, i)); last = i + 1; }
  }
  out.push(src.slice(last));
  return out;
}
/** the item's board on the right: one line as big as fits (>= 60 px), else broken at its = signs */
function boardLines(src: string): Line[] {
  const F = tex(src) as Formula;
  let s = 84;
  while (s > 60 && texWidth(F, s) > BW) s -= 2;
  if (texWidth(F, s) <= BW) return [{ key: 'x.B', F, x: BX0, y: 300, size: s }];
  const parts = splitEq(src), rows: string[] = [];
  for (const p of parts) {
    const cand = rows.length ? `${rows[rows.length - 1]} =${p.startsWith(' ') ? '' : ' '}${p.replace(/^=?\s*/, '')}` : p;
    if (rows.length && texWidth(tex(cand) as Formula, 64) <= BW) rows[rows.length - 1] = cand;
    else rows.push(rows.length ? `= ${p.replace(/^=?\s*/, '')}` : p);
  }
  return rows.map((r, i) => { const G = tex(r) as Formula; let z = 72; while (z > 60 && texWidth(G, z) > BW) z -= 2; return { key: 'x.B', F: G, x: BX0, y: 220 + i * 140, size: z }; });
}
function showItem(item: QItem): Solve {
  tr.reset('x.');
  const g = item.picture?.g;
  const big = box(260, 230, 1660, 790);
  const slate = () => { setScene({ lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big }); tr.set('x.T', 1, 0.8, 0.1); };
  if (g) {
    const made = tryBlock(() => Plane(planeParams(g), FR, th));
    if (made.ok) {
      const B = made.value;
      const toPlane = () => {
        planeScene('x.', B, boardLines(item.board));
        tr.set('x.g.axes', 1, 0.8, 0.1); tr.set('x.B', 1, 0.8, 0.3);
        g.show.forEach((it, i) => tr.set('x.g.' + it.key, 1, it.kind === 'curve' ? 1.4 : 0.6, 0.4 + i * 0.12));
      };
      if (g.slate) slate(); else toPlane();
      return {
        solve: async alive => {
          if (g.slate) { toPlane(); await wait(1.6); if (!alive()) return; }
          g.reveal.forEach((it, i) => tr.set('x.g.' + it.key, 1, it.kind === 'curve' ? 1.4 : 0.6, 0.2 + i * 0.25));
          await wait(1.6 + g.reveal.length * 0.25);
        },
      };
    }
    console.warn('practice picture did not build:', made.error);
  }
  slate();
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['y = (x + 1)(x - 5) \\frac{-1 + 5}{2} (x - 2)^2 - 9 = x^2 - 4x - 5 f(3 + d) = d^2 \\text{axis: } \\,? \\sqrt{5} \\pm \\le \\ge \\overset{?}{=}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
