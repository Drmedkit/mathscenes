// constructions.ts: "Constructions with compass and straightedge" (Geometry, lesson 6) on the shared runtime.
//   1 The question   Jun measures the midpoint with a ruler; Ava swings equal arcs and joins the crossings. Whose
//                    midpoint is exact even in principle? (Jun: construction-by-eye-or-measure; Ava: right; "both
//                    just draw a point": construction-arcs-seen-as-decoration)
//   2 Worked example Ava's perpendicular bisector on the construction player, step by step: arcs about A (distance w),
//                    same width about B (P and Q inherit both distances), join PQ (M), read the result; why keep the
//                    width? (neat = decoration, any arcs = compass-width-changed)
//   3 Your turn      bisect an angle: tap the steps in an order that works (any valid order; a protractor decoy and
//                    steps that come too early are refused), each step plays on the player; then why it works (SSS)
//   4 Prove it       always, or only when drawn carefully? A because-chain on Ava's figure: equal arcs -> SSS -> SAS +
//                    a congruent linear pair (decoys: looks like the middle, a protractor reads 90°). Callback.
//   5 Practice       all 34 sub-goals one after another, then mixed (runtime/practice.ts)
// Reused read-only from geometry-foundations: geo.ts + GeoFig.ts (figures), ProofFrame.ts (proof frame), Card.ts.
// The construction player is this lesson's block (src/lesson/topics/constructions/Construct.ts).
import type { Canvas } from '../../src/core/draw';
import { box, type Box, clamp } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import type { Paint } from '../../src/core/theme';
import { th, setScene, seq, tr, wait, line, type Line } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { rng } from '../../src/lesson/runtime/item';
import { tryBlock } from '../../src/blocks/block';
import { drawWords } from '../../src/lesson/words';
import { type Frame, FR_LEFT, FR_RIGHT, FR_WIDE, galleryFrames } from '../../src/lesson/topics/geometry-foundations/geo';
import { drawFig, sheet } from '../../src/lesson/topics/geometry-foundations/GeoFig';
import { ProofFrame, type ProofStep } from '../../src/lesson/topics/geometry-foundations/ProofFrame';
import { cardPainter, cardsPainter } from '../../src/lesson/topics/geometry-foundations/Card';
import { type Cons, angleBis, canDo, perpBis } from '../../src/lesson/topics/constructions/cons';
import { type Over, drawCons, fitCons, layoutCons } from '../../src/lesson/topics/constructions/Construct';
import { type CItem, MC } from '../../src/lesson/topics/constructions/ckit';
import { FAMILY_NAMES, GENERATORS } from '../../src/lesson/topics/constructions/items';
import { PLAN } from '../../src/lesson/topics/constructions/plan';
import { explain } from '../../src/lesson/topics/constructions/explain';
import { SCRIPT } from '../../src/lesson/topics/constructions/script';
import LINES from './constructions/voice/lines.json';

const SLUG = 'constructions';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = '', extra = ''): HTMLElement {
  const s = SCRIPT[id];
  if (!s) throw new Error(`no script line ${id}`);
  if (!(id in LINES)) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, s.html + extra);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]!.html); }
const plainOf = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<');
const K = (key: string) => tr.k(key);
/** the figure frame of parts 1-4 (the board on the right) */
const FIG: Frame = { x: 60, y: 70, w: 1130, h: 940 };
const BOARD_LINE = (key: string, src: string, i: number): Line => line(key, src, 190 + 130 * i, 72);

/** a one-shot choice question in the panel: logs, gives feedback, runs `after` on the right one */
function ask(part: 'turn' | 'prove' | 'example', item: string, prompt: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], after: () => void): HTMLElement {
  const bx = h('div', { class: 'opts' }), fbHost = h('div');
  let done = false;
  opts.forEach((o, k) => bx.append(btn(o.t, () => {
    if (done) return;
    bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
    ctx.store.log({ part, item, prompt, response: plainOf(o.t), expected: plainOf(opts.find(x => x.ok)!.t), correct: o.ok, mc: o.mc });
    fbHost.replaceChildren(voicedFb(o.id, o.ok));
    if (o.ok) { done = true; after(); }
  })));
  return h('div', {}, bx, fbHost);
}

// ===================== the constructions of parts 1-4 (exact, computed once) =====================
const AVA: Cons = perpBis(rng(11), { orient: 'h', w: undefined, wk: 0.74, names: ['A', 'B', 'P', 'Q', 'M'] });
const AVA_OVER: Over = { segs: ['PA', 'PB', 'QA', 'QB'].map(s => ({ a: s[0]!, b: s[1]!, col: 'first' as const })) };
const AVA_LAY = layoutCons(AVA, FIG, AVA_OVER, fitCons(AVA, FIG, 110, 2.6));
const BIS: Cons = angleBis(rng(5), { deg: 74, names: ['O', 'A', 'B', 'X'] });
const BIS_LAY = layoutCons(BIS, FIG, { segs: [{ a: 'O', b: 'A', col: 'first' }, { a: 'X', b: 'B', col: 'first' }, { a: 'X', b: 'A', col: 'first' }] }, fitCons(BIS, FIG, 110, 2.6));

// ===================== 1. The question =====================
const CARDS = [
  { name: 'Jun’s ruler', t: 'a ruler gives the number, so the mark is exact', mc: MC.eye as string | undefined, cb: 'q.cb.jun', right: false },
  { name: 'Ava’s arcs', t: 'the equal arcs force the point, no reading needed', mc: undefined as string | undefined, cb: 'q.cb.ava', right: true },
  { name: 'Neither', t: 'both just draw a point; the arcs only guide the eye', mc: MC.decoration as string | undefined, cb: 'q.cb.same', right: false },
];
/** the length label under Ava's segment (screen) */
const Q_LABEL = ((): [number, number] => { const F = AVA_LAY.fit, A = AVA.pts[0]!.at, B = AVA.pts[1]!.at; return [F.ox + F.s * (A[0] + B[0]) / 2, F.oy - F.s * (A[1] + B[1]) / 2 + 80]; })();
function partQuestion(): void {
  tr.reset('q.');
  const card = cardPainter(['Jun: ruler, <b class="a">AB = 9.8 cm</b>, mark at 4.9 cm.', 'Ava: equal arcs from A and B, join the crossings.', 'Whose midpoint is exact?'], box(1230, 230, 1870, 850), { size: 50 });
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FIG, K('q.sheet'));
      drawCons(c, AVA, AVA_LAY, { upto: 0, k: K('q.fig') });
      if (K('q.fig') > 0) drawWords(c, '9.8 cm', Q_LABEL[0], Q_LABEL[1], 'first', K('q.fig'), { size: 60, align: 'center' });
      card.draw(c, K('q.card'));
    },
  });
  tr.set('q.sheet', 1, 0.6); tr.set('q.fig', 1, 0.9, 0.3); tr.set('q.card', 1, 0.8, 1.2);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Jun measures the midpoint with a ruler; Ava swings equal arcs and joins the crossings. Whose midpoint is exact, even in principle?', response: `${c.name}: ${c.t}`, expected: 'Ava’s arcs', correct: c.right, mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.name}<small>${cd.t}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Ruler or compass?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: the perpendicular bisector =====================
function partExample(): void {
  tr.reset('e.');
  let over: Over = {};
  const L = [
    BOARD_LINE('e.L0', 'PA = w,\\ QA = w', 0),
    BOARD_LINE('e.L1', 'PB = w,\\ QB = w', 1),
    BOARD_LINE('e.L2', 'PA = PB,\\ QA = QB', 2),
    BOARD_LINE('e.L3', 'AM = BM', 3),
    BOARD_LINE('e.L4', '\\overleftrightarrow{PQ} \\perp \\overline{AB}', 4),
  ];
  setScene({
    lines: L, leads: [],
    model: c => {
      sheet(c, FIG, K('e.sheet'));
      drawCons(c, AVA, AVA_LAY, { upto: K('e.up'), k: K('e.fig'), overlay: over, over: K('e.over'), focus: K('e.foc') > 0 ? (K('e.up') < 1.5 ? 'arcA' : 'arcB') : undefined, focusK: K('e.foc') });
    },
  });
  tr.set('e.sheet', 1, 0.5); tr.set('e.fig', 1, 0.8, 0.2);
  let step = 0;
  const STEPS = [
    { t: 'Arcs about A', why: 'Any width wider than half.', act: 'Swing' },
    { t: 'Same width about B', why: 'The crossings get both distances.', act: 'Swing' },
    { t: 'Join the crossings', why: 'A line through two known points.', act: 'Join' },
    { t: 'Read the result', why: 'What the line does to the segment.', act: 'Read' },
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
        tr.set('e.up', 1, 2.4); await wait(2.5); if (!alive()) return;
        over = { segs: [{ a: 'P', b: 'A', col: 'first', ticks: 1 }, { a: 'Q', b: 'A', col: 'first', ticks: 1 }] };
        tr.set('e.foc', 1, 0.4); await wait(0.5); if (!alive()) return;
        tr.set('e.L0', 1, 0.9); await wait(1.0);
      } else if (i === 1) {
        tr.set('e.foc', 0, 0.3); tr.set('e.up', 2, 2.4); await wait(2.6); if (!alive()) return;
        over = { segs: [{ a: 'P', b: 'A', col: 'first', ticks: 1 }, { a: 'Q', b: 'A', col: 'first', ticks: 1 }, { a: 'P', b: 'B', col: 'first', ticks: 1 }, { a: 'Q', b: 'B', col: 'first', ticks: 1 }] };
        tr.set('e.over', 1, 0.7); await wait(0.8); if (!alive()) return;
        tr.set('e.L1', 1, 0.9); await wait(1.1); if (!alive()) return;
        tr.set('e.L0:dim', 1, 0.5); tr.set('e.L1:dim', 1, 0.5); tr.set('e.L2', 1, 0.9); await wait(1.0);
      } else if (i === 2) {
        tr.set('e.over', 0, 0.5); tr.set('e.up', 4, 2.0); await wait(2.2);
      } else {
        over = { ring: ['M'], segs: [{ a: 'A', b: 'M', col: 'link', ticks: 2 }, { a: 'M', b: 'B', col: 'link', ticks: 2 }], angs: [{ v: 'M', p: 'B', q: 'P', col: 'link', box: true }] };
        tr.set('e.over', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('e.L2:dim', 1, 0.5); tr.set('e.L3', 1, 0.9); await wait(1.0); if (!alive()) return; tr.set('e.L4', 1, 0.9); await wait(1.0);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    after.replaceChildren(voiced('e.why', 'div', 'label'), ask('example', 'example.why', 'Why did the compass have to keep the same width from B?', [
      { t: 'So each crossing is exactly as far from A as from B', ok: true, id: 'e.why.ok' },
      { t: 'So the arcs look neat and even', ok: false, id: 'e.why.neat', mc: MC.decoration },
      { t: 'It does not matter: any two arcs that cross would do', ok: false, id: 'e.why.any', mc: MC.width },
    ], () => after.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')))));
  }
  drawPlan();
  setPanel(h('h2', {}, 'Ava’s construction'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: bisect an angle =====================
function partTurn(): void {
  tr.reset('t.');
  let over: Over = {};
  const L = [
    BOARD_LINE('t.L0', 'OA = OB', 0),
    BOARD_LINE('t.L1', 'AX = BX', 1),
    BOARD_LINE('t.L2', 'OX = OX', 2),
    BOARD_LINE('t.L3', '\\triangle OAX \\cong \\triangle OBX', 3),
    BOARD_LINE('t.L4', '\\angle AOX \\cong \\angle BOX', 4),
  ];
  const order: number[] = [];   // step indices placed, in tap order
  const cons = (): Cons => ({ ...BIS, steps: order.map(i => BIS.steps[i]!) });
  let shown = cons();
  setScene({
    lines: L, leads: [],
    model: c => { sheet(c, FIG, K('t.sheet')); drawCons(c, shown, BIS_LAY, { upto: K('t.up'), k: K('t.fig'), overlay: over, over: K('t.over') }); },
  });
  tr.set('t.sheet', 1, 0.5); tr.set('t.fig', 1, 0.8, 0.2);
  // the pool: the four real steps and a protractor decoy, mixed
  const DECOY = 'Measure ∠AOB with a protractor and draw a ray from O at half the measure.';
  const pool = [2, 4, 0, 3, 1];   // 4 = the decoy
  const chips = h('div', { class: 'chips pool' }), list = h('ol', { class: 'plan' }), fbHost = h('div'), nextHost = h('div');
  const used = new Set<number>();
  const drawPool = () => {
    chips.replaceChildren(...pool.map(k => { const b = btn(k === 4 ? DECOY : BIS.steps[k]!.text, () => tap(k)); if (used.has(k)) b.classList.add('used'); return b; }));
    list.replaceChildren(...order.map(i => h('li', { class: 'done' }, h('span', { class: 'mk' }), html('div', '', BIS.steps[i]!.text))));
  };
  function tap(k: number): void {
    if (used.has(k) || order.length >= 4) return;
    const prompt = `Step ${order.length + 1} of the angle bisector`;
    if (k === 4) {
      fbHost.replaceChildren(voicedFb('t.decoy', false));
      ctx.store.log({ part: 'turn', item: `turn.step${order.length + 1}`, prompt, response: plainOf(DECOY), correct: false, mc: MC.eye });
      return;
    }
    const done = new Set(order.map(i => BIS.steps[i]!.id));
    if (!canDo(BIS, BIS.steps[k]!, done)) {
      fbHost.replaceChildren(voicedFb('t.early', false));
      ctx.store.log({ part: 'turn', item: `turn.step${order.length + 1}`, prompt, response: plainOf(BIS.steps[k]!.text), correct: false, mc: MC.beforeEst });
      return;
    }
    used.add(k); order.push(k); fbHost.replaceChildren();
    ctx.store.log({ part: 'turn', item: `turn.step${order.length}`, prompt, response: plainOf(BIS.steps[k]!.text), correct: true });
    shown = cons(); drawPool();
    seq(async alive => {
      tr.set('t.up', order.length, 1.8); await wait(1.9); if (!alive()) return;
      if (order.length === 4) {
        over = { segs: [{ a: 'O', b: 'A', col: 'first', ticks: 1 }, { a: 'O', b: 'B', col: 'first', ticks: 1 }, { a: 'A', b: 'X', col: 'second', ticks: 2 }, { a: 'B', b: 'X', col: 'second', ticks: 2 }] };
        tr.set('t.over', 1, 0.8); tr.set('t.L0', 1, 0.9, 0.3); tr.set('t.L1', 1, 0.9, 1.1); tr.set('t.L2', 1, 0.9, 1.9);
        chips.remove();
        fbHost.replaceChildren(voicedFb('t.order-done', true));
        await wait(2.8); if (!alive()) return;
        why();
      }
    });
  }
  function why(): void {
    nextHost.replaceChildren(voiced('t.next', 'div', 'label'), ask('turn', 'turn.why', 'Why is the angle at O split into two congruent angles?', [
      { t: '△OAX ≅ △OBX by SSS, so ∠AOX ≅ ∠BOX', ok: true, id: 't.next.ok' },
      { t: 'Ray OX looks halfway between the sides', ok: false, id: 't.next.look', mc: MC.appearance },
      { t: '△OAX ≅ △OBX by SAS, with the angles at O', ok: false, id: 't.next.sas', mc: MC.circular },
    ], () => seq(async alive => {
      over = { ...over, tris: [{ pts: ['O', 'A', 'X'], col: 'first' }, { pts: ['O', 'B', 'X'], col: 'second' }], angs: [{ v: 'O', p: 'A', q: 'X', col: 'link' }, { v: 'O', p: 'X', q: 'B', col: 'link' }] };
      tr.set('t.L0:dim', 1, 0.5); tr.set('t.L1:dim', 1, 0.5); tr.set('t.L2:dim', 1, 0.5); tr.set('t.L3', 1, 0.9); await wait(1.0); if (!alive()) return;
      tr.set('t.L4', 1, 0.9); await wait(1.0); if (!alive()) return;
      nextHost.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    })));
  }
  drawPool();
  setPanel(h('h2', {}, 'Your turn: bisect the angle'), voiced('t.intro'), list, chips, fbHost, nextHost);
}

// ===================== 4. Prove it: Ava's line always bisects at a right angle =====================
function partProve(): void {
  tr.reset('p.');
  let over: Over = {};
  const L = [
    BOARD_LINE('p.L0', 'PA = PB,\\ QA = QB', 0),
    BOARD_LINE('p.L1', '\\triangle APQ \\cong \\triangle BPQ', 1),
    BOARD_LINE('p.L2', '\\triangle APM \\cong \\triangle BPM', 2),
    BOARD_LINE('p.L3', 'AM = BM', 3),
    BOARD_LINE('p.L4', '\\angle AMP = 90^\\circ', 4),
  ];
  setScene({
    lines: L, leads: [],
    model: c => { sheet(c, FIG, K('p.sheet')); drawCons(c, AVA, AVA_LAY, { upto: 4, k: K('p.fig'), overlay: over, over: K('p.over') }); },
  });
  tr.set('p.sheet', 1, 0.5); tr.set('p.fig', 1, 0.8, 0.2);
  const CHIPS = [
    { t: 'M looks like it is right in the middle.', fits: -1, mc: MC.appearance as string | undefined, id: 'p.x-look' },
    { t: 'Both arcs were drawn with one compass width.', fits: 0 },
    { t: 'PA ≅ PB, QA ≅ QB, and PQ is shared: SSS.', fits: 1 },
    { t: 'A protractor at M reads 90°.', fits: -1, mc: MC.measureProof as string | undefined, id: 'p.x-measure' },
    { t: 'SAS (PA ≅ PB, the angles at P, PM shared); the equal angles at M form a linear pair.', fits: 2 },
  ];
  const CLAIMS = ['p.claim1', 'p.claim2', 'p.claim3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), endHost = h('div');
  const usedC = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${SCRIPT[id]!.html}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (usedC.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: plainOf(SCRIPT[CLAIMS[filled]!]!.html), response: ch.t, correct: ch.fits === filled, mc: ch.fits === filled ? undefined : ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.x-other', false)); return; }
    usedC.add(i); filled++; drawChain(); fbHost.replaceChildren();
    const n = filled;
    void ctx.say(`p.c${n}`);
    seq(async alive => {
      if (n === 1) { over = { segs: [{ a: 'P', b: 'A', col: 'first', ticks: 1 }, { a: 'P', b: 'B', col: 'first', ticks: 1 }, { a: 'Q', b: 'A', col: 'second', ticks: 2 }, { a: 'Q', b: 'B', col: 'second', ticks: 2 }] }; tr.set('p.over', 1, 0.8); await wait(0.9); if (!alive()) return; tr.set('p.L0', 1, 0.9); }
      if (n === 2) { over = { ...over, tris: [{ pts: ['A', 'P', 'Q'], col: 'first' }, { pts: ['B', 'P', 'Q'], col: 'second' }], angs: [{ v: 'P', p: 'A', q: 'M', col: 'pick' }, { v: 'P', p: 'M', q: 'B', col: 'pick' }] }; await wait(0.9); if (!alive()) return; tr.set('p.L0:dim', 1, 0.5); tr.set('p.L1', 1, 0.9); }
      if (n === 3) {
        over = { segs: [{ a: 'A', b: 'M', col: 'link', ticks: 1 }, { a: 'M', b: 'B', col: 'link', ticks: 1 }], tris: [{ pts: ['A', 'P', 'M'], col: 'first' }, { pts: ['B', 'P', 'M'], col: 'second' }], angs: [{ v: 'M', p: 'B', q: 'P', col: 'link', box: true }, { v: 'M', p: 'P', q: 'A', col: 'link', box: true }], ring: ['M'] };
        await wait(0.9); if (!alive()) return; tr.set('p.L1:dim', 1, 0.5); tr.set('p.L2', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('p.L3', 1, 0.9); await wait(0.9); if (!alive()) return; tr.set('p.L4', 1, 0.9); await wait(1.4); if (!alive()) return;
        chipBox.remove(); fbHost.replaceChildren();
        setPanel(h('h2', {}, 'Prove it'), chain, endHost);
        endHost.replaceChildren(voicedFb('p.done', true));
        await wait(6.0); if (!alive()) return;
        endHost.append(callback()); ctx.panel.scrollTop = ctx.panel.scrollHeight;
      }
    });
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.cb : 'q.cb.ava', 'p', '', (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
    return c;
  }
  const yes = btn('Always', () => judge(true)), no = btn('Only when drawn carefully', () => judge(false));
  const proofHost = h('div');
  function judge(always: boolean): void {
    yes.disabled = no.disabled = true;
    (always ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Does Ava’s construction give the midpoint at a right angle for every segment and allowed width?', response: always ? 'always' : 'only when drawn carefully', expected: 'always', correct: always, mc: always ? undefined : MC.measureProof });
    proofHost.replaceChildren(voiced(always ? 'p.build' : 'p.build-test'), chain, chipBox, fbHost, endHost);
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
    show: it => showItem(it as CItem),
  });
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
const fr2box = (f: Frame): Box => box(f.x, f.y, f.x + f.w, f.y + f.h);
function showItem(item: CItem): Solve {
  tr.reset('x.');
  const p = item.picture ?? {};
  const rv = p.reveal ?? {};
  const draws: ((c: Canvas) => void)[] = [];
  const keysOn: string[] = [];
  const beside = !!(p.proof || p.card || p.cards);
  if (p.gallery) {
    const g = p.gallery, frs = galleryFrames(g.figs.length);
    draws.push(c => g.figs.forEach((f, i) => {
      const fr = frs[i]!;
      sheet(c, fr, K('x.fig'), 30 + i);
      drawFig(c, f, fr, { k: K('x.fig') });
      drawWords(c, g.caps[i] ?? '', fr.x + fr.w / 2, fr.y + fr.h + 52, 'dim', K('x.fig'), { size: 44, align: 'center' });
    }));
    keysOn.push('x.fig');
    return finish(draws, keysOn, async () => { void rv; });
  }
  if (p.cons) {
    const cp = p.cons, fr = beside ? FR_LEFT : FR_WIDE;
    const lay = layoutCons(cp.c, fr, cp.over);
    const up0 = cp.upto, up1 = cp.after ?? cp.upto;
    tr.jump('x.up', up0);
    draws.push(c => {
      sheet(c, fr, K('x.fig'));
      drawCons(c, cp.c, lay, { upto: K('x.up'), k: K('x.fig'), overlay: cp.over, over: cp.overLate ? K('x.over') : 1, focus: K('x.foc') > 0 ? cp.focus : undefined, focusK: K('x.foc') });
    });
    keysOn.push('x.fig');
    void up1;
  } else if (p.fig) {
    const fr = beside ? FR_LEFT : FR_WIDE, f = p.fig;
    draws.push(c => { sheet(c, fr, K('x.fig')); drawFig(c, f, fr, { k: K('x.fig'), solve: K('x.solve') }); });
    keysOn.push('x.fig');
  }
  if (p.proof) {
    const pr = p.proof;
    const fr: Frame = { x: FR_RIGHT.x, y: 60, w: FR_RIGHT.w, h: 960 };
    const made = tryBlock(() => ProofFrame({ given: pr.given, prove: pr.prove, rows: pr.rows, pool: pr.pool, first: pr.first }, fr, th));
    if (made.ok) {
      const B = made.value, asked = new Set((pr.ask ?? []).map(a => `${a.cell === 'st' ? 's' : 'r'}${a.i}`));
      const P = progressOf<ProofStep>(s => (s === 'frame' ? K('x.fig') : asked.has(s) ? K('x.fill') : K('x.fig')));
      draws.push(c => B.draw(c, P, { ask: pr.ask, rings: (pr.ask ?? []).map(a => ({ i: a.i, col: 'pick' as Paint, k: K('x.fig') })) }));
    } else console.warn('proof frame failed', made.error);
  }
  if (p.card) {
    const b = beside && (p.cons || p.fig) ? box(FR_RIGHT.x, 110, FR_RIGHT.x + FR_RIGHT.w, 970) : box(190, 140, 1730, 940);
    const lines = p.card.lines;
    const size = lines.length > 4 ? 42 : 46;
    const C = cardPainter(lines, b, { nFirst: lines.length, size: p.cons || p.fig ? size : 54, align: p.cons || p.fig ? 'left' : 'center' });
    if (!C.fits) console.warn('card does not fit', item.family);
    draws.push(c => C.draw(c, K('x.card'), 1));
    keysOn.push('x.card');
  }
  if (p.cards) {
    const C = cardsPainter(p.cards, box(80, 160, 1840, 920));
    draws.push(c => C.draw(c, K('x.card')));
    keysOn.push('x.card');
  }
  if (!draws.length) {
    const C = cardPainter([plainOf(item.prompt)], box(190, 140, 1730, 940));
    draws.push(c => C.draw(c, K('x.card')));
    keysOn.push('x.card');
  }
  void fr2box;
  return finish(draws, keysOn, async alive => {
    tr.set('x.solve', 1, 0.8); tr.set('x.fill', 1, 0.9, 0.3);
    if (p.cons) {
      const cp = p.cons, up1 = cp.after ?? cp.upto;
      if (up1 > cp.upto) { tr.set('x.foc', 1, 0.3); tr.set('x.up', up1, 1.6 * (up1 - cp.upto)); await wait(1.6 * (up1 - cp.upto) + 0.2); if (!alive()) return; tr.set('x.foc', 0, 0.6); }
      tr.set('x.over', 1, 0.7);
    }
  });
}
function finish(draws: ((c: Canvas) => void)[], keys: string[], solve: (alive: () => boolean) => Promise<void>): Solve {
  setScene({ model: c => draws.forEach(d => d(c)), lines: [], leads: [], boardBox: null });
  keys.forEach((k, i) => tr.set(k, 1, 0.7, 0.1 + 0.2 * i));
  return { solve };
}
void clamp;

void runLesson({
  slug: SLUG,
  warm: ['PA = w \\ QA = QB \\ AM = BM \\ \\overleftrightarrow{PQ} \\perp \\overline{AB} \\ \\triangle OAX \\cong \\triangle OBX \\ \\angle AOX \\ 90^\\circ \\ \\text{Given Prove the construction of}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
