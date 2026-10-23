// slope-and-lines.ts: "Proportional and linear relationships: slope, graphs, and equations" (grade 8, 8.EE.B.5-6,
// 8.F.A.3, 8.F.B.4) on the shared lesson runtime.
//   1 The question   y = 2/3 x + 1 with Jo's small slope triangle (3 across, 2 up): what slope does Kai's big one
//                    (6 across, 4 up) show? Cards 2/3, 4/3 (slope-depends-on-points), 4 (ignores-input-step)
//   2 Worked example four steps on the graph: rise over run; same angles (AA: parallel legs + right angles, the
//                    triangles are similar); same ratio (4/6 = 2/3, anywhere on the line); the equation from a general
//                    point (x, y): (y - 1)/x = 2/3, y = 2/3 x + 1. One "why?" with 3 reasons
//   3 Your turn      a candle y = -1/2 x + 6, faded from the end: the small triangle is given, the kid finds the big
//                    triangle's rise, its slope, then the equation
//   4 Prove it       Riley: "constant slope, so y/x is constant: y = 2x + 3 is proportional". Judge, then a
//                    because-chain from reason chips (distractors = catalogue misconceptions); the graph backs each line
//   5 Practice       all 27 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/slope-and-lines/script.ts (panel HTML) = voice/lines.json (spoken text).
import type { Canvas } from '../../src/core/draw';
import { strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, MF, type Lead, type Line, partOf, seq, setScene, th, tr, wait, bump } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { fr } from '../../src/lesson/runtime/item';
import { SlopeGrid, type GridFocus, type SlopeGridBlock } from '../../src/lesson/topics/slope-and-lines/SlopeGrid';
import { TableCard } from '../../src/lesson/topics/slope-and-lines/TableCard';
import { FAMILY_NAMES, GENERATORS, MC, PIC_FRAME, type SlItem } from '../../src/lesson/topics/slope-and-lines/items';
import { explain } from '../../src/lesson/topics/slope-and-lines/explain';
import { PLAN } from '../../src/lesson/topics/slope-and-lines/plan';
import { LINES } from '../../src/lesson/topics/slope-and-lines/script';
import { SCENES } from '../../src/lesson/topics/slope-and-lines/scenes';

const SLUG = 'slope-and-lines';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
const T = SCENES.tex, GR = SCENES.graphs;
/** the painted table edge sits below the graph's tick labels */
const TABLE = 1040;
/** say a scripted line (the narrator) */
function sayOnly(id: string): void { if (!LINES[id]) console.warn('no voice line', id); void ctx.say(id); }
/** a voiced panel paragraph: the HTML from the script; the narrator says it */
function para(id: string, cls = ''): HTMLElement { sayOnly(id); return html('p', cls, LINES[id]?.html ?? id); }
function fb(ok: boolean, id: string, extra: Kid[] = []): HTMLElement { sayOnly(id); return feedback(ok, LINES[id]?.html ?? id, extra); }
const half = fr(1, 2), twoThirds = fr(2, 3);

// ===================== board helpers =====================
const TAGS: Record<string, { col: Paint }> = { n: { col: 'second' }, d: { col: 'first' }, ri: { col: 'second' }, ru: { col: 'first' }, m: { col: 'link' }, b: { col: 'pick' } };
/** a line centred on the board, shrunk to fit (never below 60 px) */
function centred(key: string, src: string, y: number, size: number, tags = TAGS): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BOARD_W) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: BOARD.cx - b.cx, y, size: s, tags };
}
/** split TeX at top-level separators (\qquad, \quad, ",\ ") when it is too wide for one board line */
function splitTex(src: string, size: number, width: number): string[] {
  if (texWidth(tex(src) as Formula, size) <= width) return [src];
  const parts: string[] = [];
  let depth = 0, cur = '';
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (ch === '{' || ch === '(') depth++;
    if (ch === '}' || ch === ')') depth--;
    const rest = src.slice(i);
    const sep = depth === 0 ? (rest.match(/^(\\qquad|:\\quad|\\quad|,\\ )/)?.[0] ?? null) : null;
    if (sep) { parts.push(cur + (sep.startsWith(',') ? ',' : '')); cur = ''; i += sep.length - 1; continue; }
    cur += ch;
  }
  parts.push(cur);
  // join greedily into lines that fit
  const out: string[] = [];
  let acc = '';
  for (const p of parts.map(x => x.trim()).filter(Boolean)) {
    const tryA = acc ? `${acc}\\ ${p}` : p;
    if (!acc || texWidth(tex(tryA) as Formula, size) <= width) acc = tryA; else { out.push(acc); acc = p; }
  }
  if (acc) out.push(acc);
  return out;
}

// ===================== a graph scene =====================
interface GScene { G: SlopeGridBlock; P: { k(s: string): number }; pre: string; focus: () => GridFocus }
function graphScene(pre: string, params: (typeof GR)[keyof typeof GR], lines: Line[], leads: Lead[] = [], focus: () => GridFocus = () => ({}), extra?: (c: Canvas) => void): GScene {
  const G = SlopeGrid(params, MF, th), P = progressOf<string>(s => tr.k(pre + s));
  setScene({ table: TABLE, model: c => G.draw(c, P, focus()), lines, leads, extra });
  return { G, P, pre, focus };
}
const ringAt = (b: Box, key: string, col: 'pick' | 'link' | 'first' | 'second' | 'wrong' = 'pick') => ({ b, col, k: tr.k(key) });
function showAll(pre: string, steps: string[], d0 = 0, gap = 0.25): void { steps.forEach((s, i) => tr.set(pre + s, 1, 0.8, d0 + i * gap)); }

// ===================== 1. The question =====================
const CARDS = [
  { v: fr(2, 3), val: '2/3', mc: undefined as string | undefined, cb: 't.cb.right' },
  { v: fr(4, 3), val: '4/3', mc: MC.depends, cb: 't.cb.double' },
  { v: '4', val: '4', mc: MC.step, cb: 't.cb.rise' },
];
function partQuestion(): void {
  tr.reset('q.');
  const L1 = centred('q.jo', T['q.jo']!, 330, 84), L2 = centred('q.kai', T['q.kai']!, 560, 84);
  graphScene('q.', GR.lesson, [L1, L2]);
  showAll('q.', ['axes', 'line:L', 'pt:J0', 'pt:J1', 'ptl:J1', 'pt:K1', 'ptl:K1'], 0, 0.15);
  tr.set('q.tri:jo', 1, 1.0, 1.4); tr.set('q.run:jo', 1, 0.6, 2.2); tr.set('q.rise:jo', 1, 0.6, 2.4); tr.set('q.jo', 1, 0.9, 2.6);
  tr.set('q.tri:kai', 1, 1.2, 3.4); tr.set('q.run:kai', 1, 0.6, 4.4); tr.set('q.rise:kai', 1, 0.6, 4.6); tr.set('q.kai', 1, 0.8, 5.0);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: "Jo's slope triangle: 3 across, 2 up (2/3). Kai's on the same line: 6 across, 4 up. What slope does Kai's show?", board: 'm_Kai = ?', response: c.val, expected: '2/3', correct: !c.mc, mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>slope</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Two triangles, one line'), para('q.intro'), para('q.ask'), cards, html('div', 'label', LINES['q.sure']!.html), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const Y = { L1: 150, L2: 300, L3: 432, L4: 600, L5: 752, L6: 888 };
  const L = {
    L1: centred('e.L1', T['e.L1']!, Y.L1, 78), L2: centred('e.L2', T['e.L2']!, Y.L2, 78), L3: centred('e.L3', T['e.L3']!, Y.L3, 78),
    L4: centred('e.L4', T['e.L4']!, Y.L4, 78), L5: centred('e.L5', T['e.L5']!, Y.L5, 78), L6: centred('e.L6', T['e.L6']!, Y.L6, 84),
  };
  let derive = false;
  const lessonFocus = (): GridFocus => ({
    rings: [ringAt(lesson.G.where.point('J0'), 'e.rJ0', 'pick')],
    legs: [{ id: 'jo', leg: 'run', k: tr.k('e.gRun') }, { id: 'kai', leg: 'run', k: tr.k('e.gRun') }, { id: 'jo', leg: 'rise', k: tr.k('e.gRise') }, { id: 'kai', leg: 'rise', k: tr.k('e.gRise4') }],
    triAlpha: { jo: 1 - tr.k('e.fade'), kai: 1 - tr.k('e.fade') },
  });
  const allLines = [L.L1, L.L2, L.L3, L.L4, L.L5, L.L6];
  const leads: Lead[] = [{ key: 'e.ld4', from: () => partOf(L.L3, 'n'), to: () => lesson.G.where.riseLeg('kai'), col: 'second' }];
  const lesson = graphScene('e.', GR.lesson, allLines, leads, lessonFocus);
  const dG = SlopeGrid(GR.derive, MF, th), dP = progressOf<string>(s => tr.k('e.' + s));
  const toDerive = () => {
    derive = true;
    setScene({ table: TABLE, model: c => dG.draw(c, dP, { rings: [ringAt(dG.where.point('J0'), 'e.rJ0', 'pick')], legs: [{ id: 'gen', leg: 'run', k: tr.k('e.gX') }, { id: 'gen', leg: 'rise', k: tr.k('e.gY') }] }), lines: allLines, leads: [] });
  };
  for (const s of ['axes', 'line:L', 'pt:J0', 'pt:J1', 'ptl:J1', 'pt:K1', 'ptl:K1']) tr.jump('e.' + s, 1);
  let step = 0;
  const STEPS = [
    { t: 'Rise over run', why: "Jo's small triangle.", act: 'Show it' },
    { t: 'Same angles', why: "Kai's big triangle on the same line.", act: 'Compare' },
    { t: 'Same ratio', why: 'Similar triangles, the same slope.', act: 'Divide' },
    { t: 'The equation', why: 'Any point (x, y) on the line.', act: 'Write it' },
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
        tr.set('e.tri:jo', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('e.run:jo', 1, 0.6); tr.set('e.rise:jo', 1, 0.6, 0.3); await wait(0.9); if (!alive()) return;
        tr.set('e.L1', 1, 1.2); void bump('e.gRise', alive); await wait(1.4);
      } else if (i === 1) {
        tr.set('e.L1:dim', 1, 0.5);
        tr.set('e.tri:kai', 1, 1.6); await wait(1.7); if (!alive()) return;
        void bump('e.gRun', alive); await wait(1.0); if (!alive()) return;
        tr.set('e.ang:jo', 1, 0.9); tr.set('e.ang:kai', 1, 0.9, 0.5); await wait(1.6); if (!alive()) return;
        tr.set('e.L2', 1, 1.0); await wait(1.2);
      } else if (i === 2) {
        tr.set('e.L2:dim', 1, 0.5);
        tr.set('e.run:kai', 1, 0.6); tr.set('e.rise:kai', 1, 0.6, 0.3); await wait(1.0); if (!alive()) return;
        tr.set('e.L3', 1, 1.2); tr.set('e.ld4', 1, 0.9, 0.6); void bump('e.gRise4', alive); await wait(2.0); if (!alive()) return;
        tr.set('e.ld4', 0, 0.6, 1.0);
      } else {
        tr.set('e.L3:dim', 1, 0.5); tr.set('e.ld4', 0, 0.3);
        tr.set('e.fade', 1, 0.9); tr.set('e.ang:jo', 0, 0.6); tr.set('e.ang:kai', 0, 0.6); await wait(1.0); if (!alive()) return;
        toDerive();
        tr.set('e.pt:G', 1, 0.6); tr.set('e.ptl:G', 1, 0.6, 0.2); tr.set('e.rJ0', 1, 0.5, 0.3); await wait(0.9); if (!alive()) return;
        tr.set('e.tri:gen', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('e.run:gen', 1, 0.6); tr.set('e.rise:gen', 1, 0.6, 0.3); await wait(0.9); if (!alive()) return;
        tr.set('e.L4', 1, 1.1); void bump('e.gX', alive); void bump('e.gY', alive); await wait(1.5); if (!alive()) return;
        tr.set('e.L5', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.L6', 1, 1.1); tr.set('e.rJ0', 0, 0.5, 1.2); await wait(1.4);
      }
      if (!alive()) return;
      sayBox.replaceChildren(para(`e.s${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The triangles are similar, so rise ÷ run is the same ratio.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'They look like the same shape.', ok: false, id: 'e.why.look', mc: MC.looks as string | undefined },
      { t: 'A coincidence: bigger triangles usually show bigger slopes.', ok: false, id: 'e.why.size', mc: MC.depends as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: "Why does Kai's big triangle give the same slope as Jo's small one?", response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(sayOnlyLabel('e.why'), bx, fbHost);
  }
  void derive;
  drawPlan();
  setPanel(h('h2', {}, 'Why one line has one slope'), para('e.intro', 'dim'), plan, sayBox, after);
}
function sayOnlyLabel(id: string): HTMLElement { sayOnly(id); return html('div', 'label', LINES[id]!.html); }

// ===================== 3. Your turn: the candle =====================
function partTurn(): void {
  tr.reset('t.');
  const L1 = centred('t.L1', T['t.L1']!, 190, 78), L2 = centred('t.L2', T['t.L2']!, 420, 78), L2a = centred('t.L2a', T['t.L2a']!, 420, 78),
    L2b = centred('t.L2b', T['t.L2b']!, 420, 78), L3 = centred('t.L3', T['t.L3']!, 660, 84);
  const S = graphScene('t.', GR.turn, [L1, L2, L2a, L2b, L3], [], () => ({
    rings: [ringAt(S.G.where.point('S'), 't.rS', 'pick')],
    legs: [{ id: 'bg', leg: 'rise', k: tr.k('t.gRise') }],
  }));
  showAll('t.', ['axes', 'line:L', 'pt:S', 'pt:A', 'ptl:A', 'pt:B', 'ptl:B'], 0, 0.15);
  let step = 0;
  const STEPS = [
    { t: 'Rise over run', why: 'Done for you: the small triangle.' },
    { t: 'A bigger triangle', why: 'Your step: its rise.' },
    { t: 'Its slope', why: 'Your step.' },
    { t: 'The equation', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: a candle'), para('t.intro'), plan, work);
  seq(async alive => {
    await wait(2.0); if (!alive()) return;
    tr.set('t.tri:sm', 1, 1.2); await wait(1.3); if (!alive()) return;
    tr.set('t.run:sm', 1, 0.6); tr.set('t.rise:sm', 1, 0.6, 0.3); await wait(0.8); if (!alive()) return;
    tr.set('t.L1', 1, 1.1); await wait(1.2); if (!alive()) return;
    step = 1; drawPlan(); work.replaceChildren(para('t.s0'));
    tr.set('t.L1:dim', 1, 0.5);
    tr.set('t.tri:bg', 1, 1.4); await wait(1.5); if (!alive()) return;
    tr.set('t.run:bg', 1, 0.6); tr.set('t.L2', 1, 0.9, 0.3); await wait(1.2); if (!alive()) return;
    askRise();
  });
  function askRise(): void {
    const fbHost = h('div'), inp = numInput('inches', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fb(false, 't.empty')); return; }
      const right = r.v === -3, mc = r.v === 3 ? MC.sign : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.rise', prompt: 'The big triangle from (2, 5) to (8, 2) runs 6. What is its rise?', board: 'm = rise/6', response: r.v, expected: -3, correct: right, mc });
      if (!right) { fbHost.replaceChildren(fb(false, r.v === 3 ? 't.rise.sign' : 't.rise.no')); if (r.v === 3) seq(async alive => { await bump('t.gRise', alive); }); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fb(true, 't.rise.ok'));
      seq(async alive => {
        tr.set('t.rise:bg', 1, 0.6); void bump('t.gRise', alive); tr.set('t.L2', 0, 0.4, 0.4); tr.set('t.L2a', 1, 0.9, 0.5); await wait(1.6); if (!alive()) return;
        step = 2; drawPlan(); askSlope();
      });
    }
    work.replaceChildren(para('t.rise'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function choose(id: string, item: string, prompt: string, expected: string, opts: { t: string; ok?: boolean; id: string; mc?: string }[], onRight: () => void): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    let done = false;
    opts.forEach((o, k) => { const b = btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((x, j) => { x.classList.remove('right', 'nope'); if (j === k) x.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item, prompt, response: o.t.replace(/<[^>]+>/g, ''), expected, correct: !!o.ok, mc: o.mc });
      fbHost.replaceChildren(fb(!!o.ok, o.id));
      if (o.ok) { done = true; onRight(); }
    }); bx.append(b); });
    work.replaceChildren(para(id), bx, fbHost);
  }
  function askSlope(): void {
    choose('t.slope', 'turn.slope', 'Slope of the big triangle: rise -3, run 6?', '-1/2', [
      { t: `−${half}`, ok: true, id: 't.slope.ok' },
      { t: half, id: 't.slope.sign', mc: MC.sign },
      { t: '−2', id: 't.slope.inv', mc: MC.inverted },
      { t: '−3', id: 't.slope.rise', mc: MC.step },
    ], () => seq(async alive => {
      tr.set('t.L2a', 0, 0.4); tr.set('t.L2b', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return;
      step = 3; drawPlan(); askEq();
    }));
  }
  function askEq(): void {
    const X = '<i>x</i>', Y = '<i>y</i>';
    choose('t.eq', 'turn.equation', "Which equation is the candle's line?", 'y = -1/2 x + 6', [
      { t: `${Y} = −${half}${X} + 6`, ok: true, id: 't.eq.ok' },
      { t: `${Y} = 6${X} − ${half}`, id: 't.eq.swap', mc: MC.swapMB },
      { t: `${Y} = −${half}${X}`, id: 't.eq.drop', mc: MC.dropB },
      { t: `${Y} = ${half}${X} + 6`, id: 't.eq.sign', mc: MC.sign },
    ], () => seq(async alive => {
      tr.set('t.rS', 1, 0.5); tr.set('t.L3', 1, 1.1, 0.3); await wait(1.6); if (!alive()) return;
      step = 4; drawPlan(); work.append(callback());
    }));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(para(cd ? cd.cb : 't.cb.none'));
    if (cd && cd.mc && commit().sure === 2) c.append(para('t.cb.sure', 'dim'));
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Riley's y = 2x + 3 =====================
function partProve(): void {
  tr.reset('p.');
  const R0 = centred('p.R', T['p.R']!, 140, 70), RP = centred('p.R', T['p.PQ']!, 238, 66), R1 = centred('p.S', T['p.S']!, 340, 70);
  const L1 = centred('p.L1', T['p.L1']!, 520, 78), L2 = centred('p.L2', T['p.L2']!, 690, 78), L3 = centred('p.L3', T['p.L3']!, 850, 84);
  const extra = (c: Canvas) => {
    const k = tr.k('p.strike'); if (k <= 0) return;
    const b = texBox(R1.F, R1.x, R1.y, { size: R1.size, align: 'left' });
    strike(c, b.x0 - 10, b.cy + 6, b.x1 + 10, b.cy - 6, k, { col: 'wrong' });
  };
  const S = graphScene('p.', GR.prove, [R0, RP, R1, L1, L2, L3], [], () => ({
    rings: [ringAt(S.G.where.point('B'), 'p.rB', 'pick'), ringAt(box(S.G.where.at(0, 0)[0] - 15, S.G.where.at(0, 0)[1] - 15, S.G.where.at(0, 0)[0] + 15, S.G.where.at(0, 0)[1] + 15), 'p.rO', 'wrong')],
  }), extra);
  showAll('p.', ['axes', 'line:L', 'pt:B', 'pt:P', 'ptl:P', 'pt:Q', 'ptl:Q'], 0, 0.15);
  tr.set('p.R', 1, 0.9, 1.4); tr.set('p.S', 1, 0.9, 2.1);
  const CHIPS = [
    { t: 'slope triangles on one line are similar, so rise ÷ run never changes.', fits: 0 },
    { t: 'y/x divides the values themselves, and the + 3 is inside every y.', fits: 1 },
    { t: 'a proportional line has b = 0: it goes through (0, 0), and this one starts at 3.', fits: 2 },
    { t: 'every straight line is proportional.', fits: -1, mc: MC.linProp, id: 'p.no.prop' },
    { t: 'a constant slope means a constant y/x.', fits: -1, mc: MC.scalesNP, id: 'p.no.ratio' },
  ];
  const X = '<i>x</i>', Y = '<i>y</i>';
  const CLAIMS = [
    `Between any two points of ${Y} = 2${X} + 3, the slope is <b>2</b>,`,
    `but ${Y}/${X} is <b>5</b> at P(1, 5) and <b>3</b> at Q(3, 9),`,
    `so the line is <b>linear but not proportional</b>,`,
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
    if (ch.fits !== filled) { fbHost.replaceChildren(fb(false, ch.id ?? 'p.no.other')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(fb(true, `p.c${n}`));
    seq(async alive => {
      if (n === 1) {
        tr.set('p.tri:t1', 1, 1.2); tr.set('p.run:t1', 1, 0.6, 1.0); tr.set('p.rise:t1', 1, 0.6, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('p.tri:t2', 1, 1.2); tr.set('p.run:t2', 1, 0.6, 1.0); tr.set('p.rise:t2', 1, 0.6, 1.2); await wait(1.6); if (!alive()) return;
        tr.set('p.L1', 1, 1.0);
      }
      if (n === 2) {
        tr.set('p.ray:p', 1, 1.2); await wait(1.0); if (!alive()) return;
        tr.set('p.ray:q', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('p.L2', 1, 1.0);
      }
      if (n === 3) {
        tr.set('p.rO', 1, 0.5); await wait(0.9); if (!alive()) return;
        tr.set('p.rB', 1, 0.5); await wait(0.9); if (!alive()) return;
        tr.set('p.L3', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('p.strike', 1, 0.7); await wait(1.0); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: y = 2x + 3 has a constant slope, so y/x is constant and it is proportional. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.scalesNP : undefined });
    proofHost.replaceChildren(right ? para('p.test') : para('p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), para('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as SlItem),
  });
}
function showItem(item: SlItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  const made = pic && (pic.graph || pic.table) ? tryBlock(() => (pic.graph ? SlopeGrid(pic.graph, PIC_FRAME, th) : TableCard(pic.table!, PIC_FRAME, th))) : null;
  if (pic && made && made.ok) {
    const B = made.value, hide = new Set(pic.hide ?? []), P = progressOf<string>(s => tr.k('x.' + s));
    const rows = splitTex(item.board, 76, BOARD_W);
    const lines: Line[] = rows.map((src, i) => centred('x.T', src, 190 + i * 118, 76, {}));
    const yS = 190 + rows.length * 118 + 90;
    const sol = (pic.solveTex ?? []).flatMap(src => splitTex(src, 72, BOARD_W)).map((src, i) => centred('x.S' + i, src, yS + i * 140, 72, {}));
    setScene({ table: TABLE, model: c => (B as { draw(c: Canvas, p: typeof P): void }).draw(c, P), lines: [...lines, ...sol], leads: [] });
    B.steps.filter(s => !hide.has(s)).forEach((s, i) => tr.set('x.' + s, 1, 0.7, 0.05 + Math.min(i, 10) * 0.1));
    tr.set('x.T', 1, 0.9, 0.4);
    return {
      solve: async alive => {
        for (const s of pic.hide ?? []) { tr.set('x.' + s, 1, 0.8); await wait(0.55); if (!alive()) return; }
        for (let i = 0; i < sol.length; i++) { tr.set('x.S' + i, 1, 0.9); await wait(0.9); if (!alive()) return; }
      },
    };
  }
  // no picture: a big slate where the picture would be
  const big = box(160, 200, 1760, 860);
  const rows = splitTex(item.board, 120, big.w - 160);
  const lines: Line[] = rows.map((src, i) => {
    const F = tex(src) as Formula;
    let s = 130; while (s > 70 && texWidth(F, s) > big.w - 140) s -= 4;
    return { key: 'x.T', F, x: big.cx - texWidth(F, s) / 2, y: big.cy + (i - (rows.length - 1) / 2) * s * 1.7, size: s };
  });
  setScene({ table: TABLE, lines, leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\frac{\\text{rise}}{\\text{run}} = \\tfrac{2}{3}', '\\triangle_{\\text{Jo}} \\sim \\triangle', '\\ne \\Rightarrow \\to \\dots \\Delta'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
