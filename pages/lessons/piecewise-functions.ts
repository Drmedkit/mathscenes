// piecewise-functions.ts: "Piecewise and step functions" (Algebra 1, secondary-t7-12) on the shared lesson runtime.
// The model is the shared kit's Plane (src/lesson/kit/Plane.ts): every piece drawn only over its interval, a filled
// dot where the condition includes the end, an open dot where it leaves it out (pictures as data: topics/piecewise-
// functions/pic.ts, drawn by graph.ts).
//   1 The question   f(x) = x + 2 for x ≤ 3, 2x − 4 for x > 3: what is f(3)? cards 5 / 2 (second listed) / undefined
//   2 Worked example f(1) inside a piece → the first rule only over x ≤ 3 (filled end) → the second only over x > 3
//                    (open end) → read f(3) at the filled dot; one "why?" with 3 reasons
//   3 Your turn      a garage's $4 per started hour, faded: two steps drawn; the kid picks the third step's dots, then
//                    prices 2 h 20 min on the staircase
//   4 Prove it       Mia: "g is not a function, its graph breaks". Because-chain: covered / one output at the jump (the
//                    open dot is not on the graph) / one output per input is the whole test; a vertical line sweeps
//   5 Practice       all 24 sub-goals one after another, then mixed (runtime/practice.ts); a Plane per item (answer
//                    parts come in on the replay after a miss), option graphs A-C, or the rule on a slate
// Voiced lines: src/lesson/topics/piecewise-functions/script.ts (→ voice/lines.json). Every answer is logged.
import type { Canvas } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { type Frame, frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, MF, bigLine, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { PlaneBlock, PFocus } from '../../src/lesson/kit/Plane';
import { drawWords } from '../../src/lesson/words';
import { FAMILY_NAMES, GENERATORS, MC, type PWItem } from '../../src/lesson/topics/piecewise-functions/items';
import { PLAN } from '../../src/lesson/topics/piecewise-functions/plan';
import { cst, lin } from '../../src/lesson/topics/piecewise-functions/pw';
import type { GPart, GPic } from '../../src/lesson/topics/piecewise-functions/pic';
import { planeOf, stepOf } from '../../src/lesson/topics/piecewise-functions/graph';
import { explain } from '../../src/lesson/topics/piecewise-functions/explain';
import { SCRIPT } from '../../src/lesson/topics/piecewise-functions/script';

const SLUG = 'piecewise-functions';
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
const lime = { col: 'link' as Paint }, amber = { col: 'first' as Paint }, teal = { col: 'water' as Paint };

// ===================== board + plane helpers =====================
function centred(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 56 && texWidth(F, s) > BOARD_W) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: BOARD.cx - b.cx, y, size: s, tags, col };
}
/** a Plane scene: the block on the left (steps read as pre + key), board lines on the right */
function planeScene(pre: string, B: PlaneBlock, lines: Line[], focus?: () => PFocus, extra?: (c: Canvas) => void, boardBox?: ReturnType<typeof box>): void {
  setScene({ table: 1080, lines, leads: [], extra, boardBox, model: c => B.draw(c, progressOf<string>(s => tr.k(pre + stepOf(s))), focus?.()) });
}
const RULE = '\\cssId{r1}{x + 2}, & x \\le 3 \\\\ \\cssId{r2}{2x - 4}, & x > 3';
const ruleLine = (pre: string, y = 190) => centred(pre + 'R', `f(x) = \\begin{cases} ${RULE} \\end{cases}`, y, 72, { r1: lime, r2: teal });

// the example: f(x) = x + 2 (x ≤ 3), 2x − 4 (x > 3)
function examplePic(): GPic {
  return {
    x: { min: -3, max: 7, step: 1, name: 'x' }, y: { min: -2, max: 10, step: 1, name: 'y' },
    parts: [
      { kind: 'piece', key: 'g1', fn: lin(1, 2), dash: true, col: 'dim', w: 4 },
      { kind: 'piece', key: 'g2', fn: lin(2, -4), dash: true, col: 'dim', w: 4 },
      { kind: 'piece', key: 'p0', fn: lin(1, 2), hi: 3, ends: ['none', 'closed'], col: 'link', arrow: true },
      { kind: 'piece', key: 'p1', fn: lin(2, -4), lo: 3, ends: ['open', 'none'], col: 'water', arrow: true },
      { kind: 'point', key: 'pt1', x: 1, y: 3, col: 'first', name: '(1, 3)' },
      { kind: 'vline', key: 'vx', x: 3, col: 'pick', dash: true },
      { kind: 'point', key: 'own', x: 3, y: 5, col: 'link', name: '(3, 5)' },
    ],
  };
}

// ===================== 1. The question =====================
const CARDS = [
  { t: '5', why: 'q.cb.right', ok: true, mc: undefined as string | undefined },
  { t: '2', why: 'q.cb.second', ok: false, mc: MC.second as string | undefined },
  { t: 'undefined', why: 'q.cb.undef', ok: false, mc: MC.undefBreak as string | undefined },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = planeOf(examplePic(), MF, th);
  planeScene('q.', B, [ruleLine('q.'), centred('q.Q', 'f(3) = \\,?', 420, 90)]);
  tr.set('q.axes', 1, 1.2, 0.2); tr.set('q.R', 1, 1.2, 0.9); tr.set('q.Q', 1, 0.9, 1.8);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'f(x) = x + 2 for x ≤ 3, 2x − 4 for x > 3. What is f(3)?', board: 'f(3)', response: c.t, expected: '5', correct: c.ok, mc: c.mc, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'What is f(3)?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const B = planeOf(examplePic(), MF, th);
  const R = ruleLine('e.');
  const E0 = centred('e.E0', '1 \\le 3:\\ \\ f(1) = 1 + 2 = 3', 400, 66, undefined, 'first');
  const E1 = centred('e.E1', 'x \\le 3:\\ \\ \\text{filled at } (3, 5)', 510, 64, undefined, 'link');
  const E2 = centred('e.E2', 'x > 3:\\ \\ \\text{open at } (3, 2)', 620, 64, undefined, 'water');
  const E3 = centred('e.E3', 'f(3) = 5', 770, 96, undefined, 'link');
  planeScene('e.', B, [R, E0, E1, E2, E3], () => ({ ring: [{ key: 'own', col: 'pick', k: tr.k('e.ring') }] }));
  tr.jump('e.axes', 1); tr.jump('e.R', 1);
  let step = 0;
  const STEPS = [
    { t: 'Evaluate inside a piece: f(1)', why: 'Test the input against each condition.', act: 'Test 1' },
    { t: 'Draw the first rule only for x ≤ 3', why: 'Where does it stop, and is 3 in?', act: 'Draw it' },
    { t: 'Draw the second rule only for x > 3', why: 'Same question at its end.', act: 'Draw it' },
    { t: 'Read f(3)', why: 'Which dot is on the graph?', act: 'Read it' },
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
        tr.set('e.g1', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('e.pt1', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('e.E0', 1, 1.0); await wait(1.1);
      } else if (i === 1) {
        tr.set('e.pt1', 0, 0.5); tr.set('e.E0:dim', 1, 0.5);
        tr.set('e.p0', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('e.g1', 0, 0.8); tr.set('e.E1', 1, 1.0); await wait(1.1);
      } else if (i === 2) {
        tr.set('e.E1:dim', 1, 0.5);
        tr.set('e.g2', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('e.p1', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('e.g2', 0, 0.8); tr.set('e.E2', 1, 1.0); await wait(1.1);
      } else {
        tr.set('e.E2:dim', 1, 0.5);
        tr.set('e.vx', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.own', 1, 0.6); tr.set('e.ring', 1, 0.5); await wait(0.7); if (!alive()) return;
        tr.set('e.E3', 1, 1.0); await wait(1.1);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The symbols decide: x ≤ 3 includes 3, and x > 3 leaves it out.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'The first rule is listed first, so it wins at the breakpoint.', ok: false, id: 'e.why.second', mc: MC.looks as string | undefined },
      { t: 'Both rules apply at 3, but we pick the bigger output.', ok: false, id: 'e.why.two', mc: MC.several as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does the first rule get 3?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: $4 per started hour =====================
function turnPic(): GPic {
  const st = (k: number, ends: ['open' | 'closed', 'open' | 'closed'], col: Paint = 'link', key = `s${k}`): GPart => ({ kind: 'piece', key, fn: cst(4 * k), lo: k - 1, hi: k, ends, col });
  return {
    x: { min: 0, max: 5, step: 1, name: 'hours parked' }, y: { min: 0, max: 18, step: 2, name: 'cost ($)' }, money: 'y',
    parts: [st(1, ['open', 'closed']), st(2, ['open', 'closed']), st(3, ['open', 'closed']), st(4, ['open', 'closed']),
      st(3, ['closed', 'open'], 'wrong', 'w1'), st(3, ['closed', 'closed'], 'wrong', 'w2'),
      { kind: 'vline', key: 'vt', x: 7 / 3, col: 'pick', dash: true }],
  };
}
function partTurn(): void {
  tr.reset('t.');
  const B = planeOf(turnPic(), MF, th);
  const T1 = centred('t.T1', '\\$4 \\text{ per started hour}', 190, 76, undefined, 'first');
  const T2 = centred('t.T2', '0 < t \\le 4', 300, 76);
  const T3 = centred('t.T3', '2 < t \\le 3:\\ \\ \\$12', 450, 72, undefined, 'link');
  const T4 = centred('t.T4', '2\\tfrac{1}{3} \\text{ h} \\to 3 \\text{ hours} \\to \\$12', 600, 66, undefined, 'link');
  planeScene('t.', B, [T1, T2, T3, T4], () => ({ trace: { key: 's3', x: 7 / 3, k: tr.k('t.trace'), col: 'pick' } }));
  tr.set('t.axes', 1, 1.0, 0.2); tr.set('t.T1', 1, 1.0, 0.6); tr.set('t.T2', 1, 0.8, 1.2); tr.set('t.s1', 1, 1.0, 1.6); tr.set('t.s2', 1, 1.0, 2.4);
  const work = h('div');
  setPanel(h('h2', {}, 'Your turn'), voiced('t.intro'), work);
  seq(async alive => { await wait(3.4); if (!alive()) return; askDots(); });
  function askDots(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'Open at (2, $12), filled at (3, $12)', ok: true, id: 't.dots.ok', mc: undefined as string | undefined, show: 's3' },
      { t: 'Filled at (2, $12), open at (3, $12)', ok: false, id: 't.dots.left', mc: MC.wrongPiece as string | undefined, show: 'w1' },
      { t: 'Filled at both ends', ok: false, id: 't.dots.both', mc: MC.fill as string | undefined, show: 'w2' },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.dots', prompt: '$4 per started hour: the dots of the $12 step?', response: o.t, expected: 'Open at (2, $12), filled at (3, $12)', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      tr.set('t.w1', 0, 0.3); tr.set('t.w2', 0, 0.3);
      if (!o.ok) { seq(async alive => { await wait(0.35); if (!alive()) return; tr.set('t.' + o.show, 1, 0.9); }); return; }
      done = true;
      seq(async alive => {
        tr.set('t.s3', 1, 1.0); tr.set('t.T3', 1, 1.0, 0.4); await wait(1.4); if (!alive()) return;
        tr.set('t.s4', 1, 1.0); await wait(1.4); if (!alive()) return;
        askCost();
      });
    })));
    work.replaceChildren(voiced('t.dots'), bx, fbHost);
  }
  function askCost(): void {
    const fbHost = h('div');
    let done = false;
    const inp = numInput('dollars', () => check());
    const check = () => {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number of dollars.')); return; }
      const ok = Math.abs(r.v - 12) < 1e-9, rounded = Math.abs(r.v - 8) < 1e-9;
      ctx.store.log({ part: 'turn', item: 'turn.cost', prompt: '$4 per started hour: what do 2 h 20 min cost?', response: r, expected: { kind: 'num', v: 12 }, correct: ok, mc: rounded ? MC.nearest : undefined });
      if (!ok) { fbHost.replaceChildren(voicedFb(rounded ? 't.cost.round' : 't.cost.other', false)); tr.set('t.vt', 1, 0.8); return; }
      done = true;
      fbHost.replaceChildren(voicedFb('t.cost.ok', true));
      seq(async alive => {
        tr.set('t.vt', 1, 0.8); tr.set('t.trace', 1, 0.8, 0.4); tr.set('t.T4', 1, 1.0, 0.6); await wait(1.6); if (!alive()) return;
        fbHost.append(callback());
      });
    };
    work.replaceChildren(voiced('t.cost'), inp.node, h('div', { class: 'row' }, btn('Check', check, 'go')), fbHost);
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

// ===================== 4. Prove it: Mia's "g is not a function" =====================
function provePic(): GPic {
  return {
    x: { min: -4, max: 5, step: 1, name: 'x' }, y: { min: -1, max: 9, step: 1, name: 'y' },
    parts: [
      { kind: 'piece', key: 'q0', fn: cst(2), hi: 1, ends: ['none', 'open'], col: 'link', arrow: true },
      { kind: 'piece', key: 'q1', fn: lin(1, 3), lo: 1, ends: ['closed', 'none'], col: 'link', arrow: true },
      { kind: 'point', key: 'hole', x: 1, y: 2, open: true, col: 'link' },
      { kind: 'point', key: 'fill', x: 1, y: 4, col: 'link' },
      { kind: 'vline', key: 'v1', x: 1, col: 'pick', dash: true },
    ],
  };
}
function partProve(): void {
  tr.reset('p.');
  const B = planeOf(provePic(), MF, th);
  const G = centred('p.G', 'g(x) = \\begin{cases} 2, & x < 1 \\\\ x + 3, & x \\ge 1 \\end{cases}', 190, 72);
  const M = centred('p.M', '\\text{Mia: not a function}', 380, 64, undefined, 'pick');
  const C1 = centred('p.C1', 'x < 1 \\ \\text{or}\\ x \\ge 1:\\ \\text{all } x', 520, 60, undefined, 'dim');
  const C2 = centred('p.C2', 'g(1) = 1 + 3 = 4', 620, 66, undefined, 'link');
  const C3 = centred('p.C3', '\\text{one output per input}', 740, 64, undefined, 'link');
  const g = (x: number) => (x < 1 ? 2 : x + 3);
  const extra = (c: Canvas) => {
    const k = tr.k('p.sweep');
    if (k > 0 && k < 1.0) {
      const x = -4 + 9 * k, a = B.px(x, -1), b = B.px(x, 9), d = B.px(x, g(x));
      const { g: G2 } = c;
      G2.save(); G2.strokeStyle = '#B9A8FF'; G2.lineWidth = 4; G2.setLineDash([12, 10]); G2.beginPath(); G2.moveTo(a[0], a[1]); G2.lineTo(b[0], b[1]); G2.stroke(); G2.setLineDash([]);
      G2.fillStyle = '#B9A8FF'; G2.beginPath(); G2.arc(d[0], d[1], 13, 0, Math.PI * 2); G2.fill(); G2.restore();
    }
    const ks = tr.k('p.strike');
    if (ks > 0) {
      const bb = texBox(M.F, M.x, M.y, { size: M.size, align: 'left' });
      const { g: G2 } = c;
      G2.save(); G2.globalAlpha = ks; G2.strokeStyle = '#FF6B6B'; G2.lineWidth = 6; G2.beginPath(); G2.moveTo(bb.x0 - 10, bb.cy + 6); G2.lineTo(bb.x0 - 10 + (bb.w + 20) * ks, bb.cy - 6); G2.stroke(); G2.restore();
    }
  };
  planeScene('p.', B, [G, M, C1, C2, C3], () => ({ ring: [{ key: 'hole', col: 'wrong', k: tr.k('p.rh') }, { key: 'fill', col: 'link', k: tr.k('p.rf') }] }), extra);
  tr.set('p.axes', 1, 1.0, 0.2); tr.set('p.G', 1, 1.0, 0.8); tr.set('p.q0', 1, 1.2, 1.4); tr.set('p.q1', 1, 1.2, 1.4); tr.set('p.hole', 1, 0.6, 2.6); tr.set('p.fill', 1, 0.6, 2.6); tr.set('p.M', 1, 0.9, 3.0);
  const CHIPS = [
    { t: '<i>x</i> &lt; 1 and <i>x</i> ≥ 1 together cover every number, 1 included.', fits: 0 },
    { t: '1 meets only <i>x</i> ≥ 1; the open dot at (1, 2) is not on the graph.', fits: 1 },
    { t: 'A function needs exactly one output per input; it does not have to be connected.', fits: 2 },
    { t: 'A function’s graph is one unbroken line.', fits: -1, mc: MC.connected, id: 'p.no.connected' },
    { t: 'Two formulas make two functions.', fits: -1, mc: MC.narrow, id: 'p.no.narrow' },
    { t: 'At <i>x</i> = 1 both dots count, so 1 has the outputs 2 and 4.', fits: -1, mc: MC.openPt, id: 'p.no.open' },
  ];
  const CLAIMS = ['Every input gets an output,', 'no input gets two outputs,', 'so <b><i>g</i> is a function</b>, jump and all,'];
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
      if (n === 1) { tr.set('p.C1', 1, 1.0); await wait(1.0); }
      if (n === 2) {
        tr.set('p.v1', 1, 0.9); await wait(0.9); if (!alive()) return;
        tr.set('p.rh', 1, 0.5); tr.set('p.rf', 1, 0.5, 0.5); tr.set('p.C2', 1, 1.0, 0.6); await wait(1.6);
      }
      if (n === 3) {
        tr.set('p.rh', 0, 0.4); tr.set('p.rf', 0, 0.4); tr.set('p.v1', 0, 0.4);
        tr.set('p.sweep', 0.999, 4.0); await wait(4.1); if (!alive()) return;
        tr.set('p.sweep', 0, 0.01); tr.set('p.C3', 1, 1.0); tr.set('p.strike', 1, 0.6, 0.4); await wait(1.2); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Mia is right', () => judge(true)), no = btn('Mia is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Mia: g is not a function because its graph breaks into two pieces. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.connected : undefined });
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
    show: it => showItem(it as PWItem),
  });
}
/** practice boards are wider than the lesson board: a three-piece rule with double inequalities must fit at >= 56 px */
const PBOARD = box(1060, 70, 1860, 1010);
/** a formula centred in a box, shrunk to its width (and height) */
function fitIn(key: string, src: string, b: { w: number; cx: number }, y: number, size: number, maxH = Infinity, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 56 && (texWidth(F, s) > b.w - 100 || texBox(F, 0, 0, { size: s }).h > maxH)) s -= 2;
  const bb = texBox(F, 0, y, { size: s });
  return { key, F, x: b.cx - bb.cx, y, size: s, col };
}
/** the item's board, split at \qquad into lines on the practice board */
function boardLines(src: string): Line[] {
  const parts = src.split(/\s*\\qquad\s*/).filter(Boolean);
  let y = 230;
  return parts.map((p, i) => { const cases = /cases/.test(p), L = fitIn(`x.B${i}`, p, PBOARD, y + (cases ? 40 : 0), cases ? 76 : 88); y += cases ? 330 : 160; return L; });
}
const keysOf = (parts: readonly GPart[]) => parts.map(p => p.key);
function showItem(item: PWItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.g) {
    const g = pic.g, made = tryBlock(() => planeOf(g, MF, th));
    if (made.ok) {
      const B = made.value, lines = boardLines(item.board);
      const toPlane = () => planeScene('x.', B, lines, () => (g.reveal?.trace ? { trace: { key: g.reveal.trace.key, x: g.reveal.trace.x, k: tr.k('x.trace') } } : {}), undefined, PBOARD);
      // nothing to show before the answer (the graph IS the answer): the rule on the big slate, the graph in the replay
      const hidden = g.parts.length === 0;
      if (hidden) {
        const big = box(260, 230, 1660, 790);
        setScene({ lines: [fitIn('x.T', item.board, big, big.cy, 110, big.h - 60)], leads: [], boardBox: big, table: 1080 });
        tr.set('x.T', 1, 0.8, 0.1);
      } else {
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
          for (const k of keysOf(g.reveal?.parts ?? [])) { tr.set('x.' + k, 1, 0.9); await wait(0.45); if (!alive()) return; }
          if (g.reveal?.trace) { await wait(0.5); if (!alive()) return; tr.set('x.trace', 1, 0.8); }
        },
      };
    }
    console.warn('piecewise picture did not fit', made.error);
  }
  if (pic?.opts) {
    const tall = /cases/.test(item.board), top = box(60, 60, 1860, tall ? 330 : 230);
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
  }
  const big = box(260, 230, 1660, 790);
  setScene({ lines: [fitIn('x.T', item.board, big, big.cy, 110, big.h - 60)], leads: [], boardBox: big, table: 1080 });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['f(x) = \\begin{cases} x + 2, & x \\le 3 \\\\ 2x - 4, & x > 3 \\end{cases}', '\\$4 \\text{ per started hour} \\tfrac13 \\to', '\\lfloor x \\rfloor \\ge \\square'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
