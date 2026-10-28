// triangle-inequalities.ts: "Isosceles triangles and side-angle order" (Geometry, lesson 5) on the shared runtime.
//   1 The question   three sticks, 9 in, 4 in and 5 in: can they be the sides of a triangle? (yes, a flat one =
//                    degenerate accepted; yes, 9 + 4 > 5 and 9 + 5 > 4 = the wrong pair checked; no)
//   2 Worked example the isosceles theorem from the marks to the proof: read the marks -> compare △ABC with its mirror
//                    image △ACB (the copy flips over, SAS) -> ∠B ≅ ∠C (CPCTC) -> stretch AC: the angle facing it grows
//                    (side-angle order). Why does the mirror match prove it?
//   3 Your turn      three triangles: a base angle from the vertex angle (num), the converse (equal angles -> which
//                    side), the order of the sides from two angles (the third by the angle sum)
//   4 Prove it       back to the sticks: the triangle inequality for any triangle (extend BA to D with AD = AC; a
//                    because-chain: isosceles base angles, the larger angle, the longer side), then the boundary case
//                    (C on AB: AC + CB = AB, collinear) shown with the compass arcs of 4, 5, 9 meeting on the base.
//                    Callback to part 1.
//   5 Practice       all 12 sub-goals one after another, then mixed (runtime/practice.ts)
// Reused read-only from geometry-foundations: geo.ts + GeoFig.ts (exact figures), ProofFrame.ts (the proof frame),
// Card.ts (statement cards); from triangle-congruence: tri.ts (buildFig with exact mark groups). Voiced lines:
// src/lesson/topics/triangle-inequalities/script.ts.
import type { Canvas } from '../../src/core/draw';
import { box, type Box, clamp } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import type { Paint } from '../../src/core/theme';
import { line, type Line, setScene, seq, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { tryBlock } from '../../src/blocks/block';
import { wash } from '../../src/lesson/wash';
import { drawWords } from '../../src/lesson/words';
import { type Fig, type Frame, type Pt, FR_LEFT, FR_LESSON, FR_RIGHT, FR_WIDE, add, fitFig, galleryFrames, mul, sub, toScreen, unit } from '../../src/lesson/topics/geometry-foundations/geo';
import { type Look, drawFig, label, sheet } from '../../src/lesson/topics/geometry-foundations/GeoFig';
import { ProofFrame, type ProofStep } from '../../src/lesson/topics/geometry-foundations/ProofFrame';
import { cardPainter, cardsPainter } from '../../src/lesson/topics/geometry-foundations/Card';
import { type Tri, buildFig } from '../../src/lesson/topics/triangle-congruence/tri';
import { angAt, arcsFig, isoTri, isoTriSides, triASA, triFig } from '../../src/lesson/topics/triangle-inequalities/ineq';
import { drawStrip } from '../../src/lesson/topics/triangle-inequalities/RangeStrip';
import { FR_PLEFT, FR_PROOF, FR_TOP, MC, RS_RESERVE, STRIP_BOX, type TIItem } from '../../src/lesson/topics/triangle-inequalities/tkit';
import { PROOFS } from '../../src/lesson/topics/triangle-inequalities/famC';
import { FAMILY_NAMES, GENERATORS } from '../../src/lesson/topics/triangle-inequalities/items';
import { PLAN } from '../../src/lesson/topics/triangle-inequalities/plan';
import { explain } from '../../src/lesson/topics/triangle-inequalities/explain';
import { SCRIPT } from '../../src/lesson/topics/triangle-inequalities/script';
import LINES from './triangle-inequalities/voice/lines.json';

const SLUG = 'triangle-inequalities';
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
const steps = (pre: string) => progressOf<ProofStep>(s => tr.k(`${pre}pf.${s}`));
const pf = (pre: string, s: string, to = 1, d = 0.8, delay = 0) => tr.set(`${pre}pf.${s}`, to, d, delay);
const ease = (u: number) => { const x = clamp(u); return x * x * (3 - 2 * x); };
const ov = (s: string) => [...s].map(ch => ch + '̅').join('');

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

// ===================== 1. The question: three sticks =====================
const STICKS = [{ len: 9, col: 'first' as Paint, y: 330 }, { len: 4, col: 'second' as Paint, y: 520 }, { len: 5, col: 'second' as Paint, y: 710 }];
const PX_IN = 118, STICK_X = 960 - (9 * PX_IN) / 2;
/** a painted stick: a long washed bar with an ink edge, its length above it */
function stick(c: Canvas, x: number, y: number, len: number, col: Paint, k: number, lab = true): void {
  if (k <= 0) return;
  const w = len * PX_IN * clamp(k * 1.2), hh = 26;
  wash(c, [[x, y - hh / 2], [x + w, y - hh / 2], [x + w, y + hh / 2], [x, y + hh / 2]], col, { alpha: clamp(k), rough: 0.8, seed: 3 + len, shade: 0.2 });
  if (lab) label(c, `${len} in`, [x + (len * PX_IN) / 2, y - 66], 60, col, clamp(k * 2 - 1));
}
const CARDS = [
  { name: 'Yes, a very flat one', t: '4 + 5 = 9, so the short sticks just fit along the long one', mc: MC.degenerate as string | undefined, cb: 'q.cb.flat', right: false },
  { name: 'Yes', t: '9 + 4 is more than 5, and 9 + 5 is more than 4', mc: MC.wrongPair as string | undefined, cb: 'q.cb.pair', right: false },
  { name: 'No', t: 'the two short sticks only reach across the long one lying flat', mc: undefined as string | undefined, cb: 'q.cb.no', right: true },
];
function partQuestion(): void {
  tr.reset('q.');
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      STICKS.forEach((s, i) => stick(c, STICK_X, s.y, s.len, s.col, K(`q.s${i}`)));
      drawWords(c, 'Three sides of one triangle?', 960, 900, 'dim', K('q.cap'), { size: 54, align: 'center' });
    },
  });
  STICKS.forEach((_, i) => tr.set(`q.s${i}`, 1, 0.9, 0.2 + 0.35 * i));
  tr.set('q.cap', 1, 0.6, 1.4);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Sticks of 9 in, 4 in and 5 in: can they be the sides of a triangle?', response: `${c.name}: ${c.t}`, expected: 'No', correct: c.right, mc: c.mc, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'Three sticks'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: the isosceles theorem, then side-angle order =====================
const E_T: Tri = isoTri(46, 380);   // A apex (index 0), B left, C right
/** the figure with C moved out along ray AC by the factor 1 + 0.5 s (s = the stretch, 0..1) */
function eTri(s: number): Tri { const [A, B, C] = E_T; return [A, B, add(A, mul(sub(C, A), 1 + 0.5 * ease(s)))]; }
function eFig(s: number, measures: boolean): Fig {
  const T = eTri(s);
  const mk = (i: number) => `${Math.round(angAt(T, i))}°`;
  return triFig(T, 'ABC', [
    ...(s <= 0 ? [{ seg: 'AB', n: 1 }, { seg: 'AC', n: 1 }] : []),
    { ang: 'CBA', n: s <= 0 ? 1 : undefined, lone: s > 0, col: 'link', text: measures ? mk(1) : undefined, r: 64 },
    { ang: 'ACB', n: s <= 0 ? 1 : undefined, lone: s > 0, col: 'link', text: measures ? mk(2) : undefined, r: 64 },
    { ang: 'BAC', lone: true, col: 'pick', r: 70 },
  ]);
}
const E_FIG0 = eFig(0, false);
/** a lavender copy of the triangle folding over the axis of symmetry (x = 0): x scales by cos(π u) */
function copyFig(u: number): Fig {
  const T = E_T.map(p => [p[0] * Math.cos(Math.PI * ease(u)), p[1]] as Pt);
  return { segs: [0, 1, 2].map(i => ({ id: 'c' + i, a: T[i]!, b: T[(i + 1) % 3]!, col: 'pick' as const })), angles: [], points: [], fills: [{ pts: T, col: 'pick', alpha: 0.3 }] };
}
const E_PROOF = PROOFS.isoProof('ABC');
function partExample(): void {
  tr.reset('e.');
  const P = ProofFrame({ given: E_PROOF.given, prove: E_PROOF.prove, rows: E_PROOF.rows, reserveRs: RS_RESERVE }, FR_RIGHT, th);
  const Cd = cardPainter([
    '<b class="a">AB ≅ AC</b>, so <b class="s">∠C ≅ ∠B</b>: equal sides face equal angles.',
    'Converse, its own theorem (ASA): equal angles face equal sides.',
    'Stretch AC: <b class="b">∠B</b>, the angle facing it, grows.',
    '<b class="s">The longer side faces the larger angle.</b>',
  ], box(FR_RIGHT.x + 20, 200, FR_RIGHT.x + FR_RIGHT.w - 20, 860), { size: 50, nFirst: 2, align: 'left' });
  // the figure keeps one frame fit through the stretch, so nothing jumps
  const fitFig1 = eFig(1, true);
  const fitAll: Fig = { ...E_FIG0, segs: [...E_FIG0.segs, ...fitFig1.segs.map(s => ({ ...s, id: 'fit' + s.id, col: 'faint' as const }))], points: [...E_FIG0.points, ...fitFig1.points.map(p => ({ ...p, name: '' }))] };
  const fitE = fitFig(fitAll, FR_LESSON);
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_LESSON, K('e.sheet'));
      const st = K('e.stretch');
      const f = st > 0 ? eFig(st, true) : E_FIG0;
      const g0 = K('e.g0') * (1 - K('e.g0off'));
      const look: Look = {
        k: K('e.fig'),
        marks: { CBA: st > 0 ? 1 : K('e.arcs'), ACB: st > 0 ? 1 : K('e.arcs'), BAC: K('e.apex') * (1 - K('e.apexoff')) },
        glow: { AB: g0, CA: g0, CBA: K('e.arcs') * (1 - K('e.arcsoff')), ACB: K('e.arcs') * (1 - K('e.arcsoff')) },
        col: st > 0 ? { CA: 'second', CBA: 'second' } : {},
      };
      drawFig(c, f, FR_LESSON, look, fitE);
      if (K('e.copy') > 0) drawFig(c, copyFig(K('e.flip')), FR_LESSON, { k: K('e.copy') * (1 - K('e.copyoff')) }, fitE);
      P.draw(c, steps('e.'), { rings: [0, 1, 2, 3, 4].map(i => ({ i, col: (i >= 3 ? 'link' : 'pick') as Paint, k: K(`e.ring${i}`) })) });
      Cd.draw(c, K('e.card'), K('e.card2'));
    },
  });
  tr.set('e.sheet', 1, 0.5); tr.set('e.fig', 1, 0.8, 0.2); pf('e.', 'frame', 1, 0.8, 0.5);
  let step = 0;
  const STEPS = [
    { t: 'Read the marks', why: 'Which angle faces each marked side?', act: 'Read' },
    { t: 'Compare it with its mirror image', why: 'The same triangle, B and C swapped.', act: 'Flip' },
    { t: 'Read off the angles', why: 'Corresponding parts of the match.', act: 'Read off' },
    { t: 'Stretch one side', why: 'What happens when the sides differ?', act: 'Stretch' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const ringOnly = (...on: number[]) => { for (let i = 0; i < 5; i++) tr.set(`e.ring${i}`, on.includes(i) ? 1 : 0, 0.5); };
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.g0', 1, 0.6); await wait(0.8); if (!alive()) return;
        pf('e.', 's0', 1, 0.7); pf('e.', 'r0', 1, 0.6, 0.4); ringOnly(0); await wait(1.2);
      } else if (i === 1) {
        tr.set('e.g0off', 1, 0.4); tr.set('e.copy', 1, 0.5); tr.set('e.flip', 1, 2.2, 0.4); await wait(2.8); if (!alive()) return;
        pf('e.', 's1', 1, 0.7); pf('e.', 'r1', 1, 0.6, 0.3); ringOnly(1); await wait(1.0); if (!alive()) return;
        tr.set('e.apex', 1, 0.5); pf('e.', 's2', 1, 0.7); pf('e.', 'r2', 1, 0.6, 0.3); ringOnly(2); await wait(1.1); if (!alive()) return;
        pf('e.', 's3', 1, 0.8); pf('e.', 'r3', 1, 0.6, 0.3); ringOnly(3); await wait(1.2);
      } else if (i === 2) {
        tr.set('e.copyoff', 1, 0.5); tr.set('e.apexoff', 1, 0.4); tr.set('e.arcs', 1, 0.7); await wait(0.8); if (!alive()) return;
        pf('e.', 's4', 1, 0.8); pf('e.', 'r4', 1, 0.6, 0.3); ringOnly(4); await wait(1.3);
      } else {
        ringOnly(); tr.set('e.arcsoff', 1, 0.4);
        pf('e.', 'frame', 0, 0.6); for (let r = 0; r < 5; r++) { pf('e.', `s${r}`, 0, 0.5); pf('e.', `r${r}`, 0, 0.5); }
        tr.set('e.card', 1, 0.7, 0.4); await wait(1.2); if (!alive()) return;
        tr.set('e.stretch', 1, 2.6); tr.set('e.card2', 1, 0.8, 1.6); await wait(3.0);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    after.replaceChildren(voiced('e.why', 'div', 'label'), ask('example', 'example.why', 'Why does comparing △ABC with △ACB prove ∠B ≅ ∠C?', [
      { t: 'The match A→A, B→C, C→B is a congruence by SAS, and it sends ∠B onto ∠C', ok: true, id: 'e.why.ok' },
      { t: 'The triangle looks symmetric, so its two halves must match', ok: false, id: 'e.why.look', mc: MC.appearance },
      { t: 'It does not: a mirror image is not congruent, so a bisector is needed', ok: false, id: 'e.why.flip', mc: MC.flipped },
    ], () => after.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')))));
  }
  drawPlan();
  setPanel(h('h2', {}, 'Equal sides, equal angles'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}
// ===================== 3. Your turn: three triangles =====================
const T_FR: Frame = { x: 60, y: 70, w: 1120, h: 940 };
const TA_FIG = triFig(isoTri(40, 380), 'PQR', [{ seg: 'PQ', n: 1 }, { seg: 'PR', n: 1 }, { ang: 'QPR', text: '40°', lone: true, col: 'first' }, { ang: 'RQP', text: '?', lone: true, col: 'link' }]);
const TB_FIG = (() => {
  const T = isoTriSides(11 * 30, 15 * 30);   // Z apex (index 0), X left, Y right
  return triFig(T, 'ZXY', [{ ang: 'YXZ', n: 1 }, { ang: 'ZYX', n: 1 }, { seg: 'XZ', text: '11 cm', lone: true, col: 'first' }, { seg: 'XY', text: '15 cm', lone: true }, { seg: 'YZ', text: '?', lone: true, col: 'link' }]);
})();
const TC_FIG = (() => {
  const T = triASA(48, 420, 75);   // J (index 0) 48°, K (index 1) 75°, M (index 2)
  return triFig(T, 'JKM', [{ ang: 'KJM', text: '48°', lone: true, col: 'first' }, { ang: 'MKJ', text: '75°', lone: true, col: 'first' }, { ang: 'JMK', text: '57°', lone: true, col: 'link' }]);
})();
function partTurn(): void {
  tr.reset('t.');
  let fig = TA_FIG, which = 'a';
  let lines: Line[] = [];
  const setLines = (L: Line[]) => { lines = L; setScene({ boardBox: lines.length ? undefined : null, lines, leads: [], model }); };
  const model = (c: Canvas) => {
    sheet(c, T_FR, K('t.sheet'));
    const look: Look = { k: K('t.fig'), marks: which === 'c' ? { JMK: K('t.solve') } : {}, glow: which === 'b' ? { YZ: K('t.solve'), XZ: K('t.solve') } : which === 'a' ? { RQP: K('t.solve') } : {} };
    drawFig(c, fig, T_FR, look);
  };
  setLines([]);
  tr.set('t.sheet', 1, 0.5); tr.set('t.fig', 1, 0.8, 0.2);
  const host = h('div');
  const show = (f: Fig, w: string) => { tr.set('t.fig', 0, 0.3); setTimeout(() => { fig = f; which = w; tr.jump('t.solve', 0); tr.set('t.fig', 1, 0.7); }, 320); };
  function askA(): void {
    const inp = numInput('°', () => check()), fb = h('div');
    const ck = btn('Check', () => check(), 'go');
    let done = false;
    function check(): void {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fb.replaceChildren(feedback(false, 'Type a number.')); return; }
      const ok = Math.abs(r.v - 70) < 1e-9, id = ok ? 't.a.ok' : r.v === 40 ? 't.a.base' : r.v === 140 ? 't.a.both' : 't.a.other';
      ctx.store.log({ part: 'turn', item: 'turn.base', prompt: 'PQ ≅ PR, m∠P = 40°: m∠Q?', response: r, expected: { kind: 'num', v: 70 }, correct: ok, mc: r.v === 40 ? MC.baseMis : undefined });
      fb.replaceChildren(voicedFb(id, ok));
      if (!ok) return;
      done = true; ck.disabled = true;
      tr.set('t.solve', 1, 0.7);
      setLines([line('l1', 'm\\angle Q = m\\angle R', 240, 76), line('l2', '2\\,m\\angle Q = 180^\\circ - 40^\\circ', 400, 76), line('l3', 'm\\angle Q = 70^\\circ', 560, 76, undefined, 'link')]);
      seq(async alive => { tr.set('l1', 1, 0.7); await wait(0.8); if (!alive()) return; tr.set('l2', 1, 0.8); await wait(0.9); if (!alive()) return; tr.set('l3', 1, 0.7); await wait(1.0); if (!alive()) return; host.append(h('div', { class: 'row' }, btn('Next triangle', () => askB(), 'go'))); });
    }
    host.replaceChildren(voiced('t.a'), inp.node, h('div', { class: 'row' }, ck), fb);
    setTimeout(() => inp.focus(), 60);
  }
  function askB(): void {
    show(TB_FIG, 'b'); setLines([]);
    host.replaceChildren(voiced('t.b'), ask('turn', 'turn.converse', 'In △XYZ, ∠X ≅ ∠Y, XZ = 11 cm, XY = 15 cm. Which other side must be 11 cm?', [
      { t: `${ov('YZ')}`, ok: true, id: 't.b.ok' },
      { t: `${ov('XY')}`, ok: false, id: 't.b.adj', mc: MC.adjacent },
      { t: 'None: equal angles say nothing about sides', ok: false, id: 't.b.none' },
    ], () => seq(async alive => {
      tr.set('t.solve', 1, 0.7);
      setLines([line('l1', '\\angle X \\cong \\angle Y', 240, 76), line('l2', 'YZ = XZ = 11\\text{ cm}', 400, 76, undefined, 'link')]);
      tr.set('l1', 1, 0.7); await wait(0.8); if (!alive()) return; tr.set('l2', 1, 0.8); await wait(1.0); if (!alive()) return; host.append(h('div', { class: 'row' }, btn('Next triangle', () => askC(), 'go')));
    })));
  }
  function askC(): void {
    show(TC_FIG, 'c'); setLines([]);
    host.replaceChildren(voiced('t.c'), ask('turn', 'turn.order', 'In △JKM, m∠J = 48°, m∠K = 75°. Order the sides from shortest to longest.', [
      { t: 'KM, JK, JM', ok: true, id: 't.c.ok' },
      { t: 'JM, JK, KM', ok: false, id: 't.c.rev' },
      { t: 'KM, JM, JK', ok: false, id: 't.c.third' },
    ], () => seq(async alive => {
      tr.set('t.solve', 1, 0.7);
      setLines([line('l1', 'm\\angle M = 180^\\circ - 123^\\circ', 200, 72), line('l0', 'm\\angle M = 57^\\circ', 330, 76), line('l2', '48^\\circ < 57^\\circ < 75^\\circ', 480, 76), line('l3', 'KM < JK < JM', 630, 76, undefined, 'link')]);
      tr.set('l1', 1, 0.8); await wait(0.9); if (!alive()) return; tr.set('l0', 1, 0.6); await wait(0.7); if (!alive()) return; tr.set('l2', 1, 0.7); await wait(0.8); if (!alive()) return; tr.set('l3', 1, 0.7); await wait(1.0); if (!alive()) return;
      host.append(voiced('t.done', 'p', 'dim'), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    })));
  }
  askA();
  setPanel(h('h2', {}, 'Your turn'), voiced('t.intro', 'p', 'dim'), host);
}

// ===================== 4. Prove it: the triangle inequality, and the flat case =====================
const P_B: Pt = [0, 0], P_C: Pt = [420, 0], P_A: Pt = [150, 260];
const P_D: Pt = add(P_A, mul(unit(sub(P_A, P_B)), Math.hypot(P_C[0] - P_A[0], P_C[1] - P_A[1])));
const P_FIG: Fig = buildFig({
  pts: { A: P_A, B: P_B, C: P_C, D: P_D }, segs: ['BA', 'AD', 'BC', 'AC', 'CD'],
  marks: [{ seg: 'AD', n: 1, col: 'first' }, { seg: 'AC', n: 1, col: 'first' }, { ang: 'ACD', n: 1, col: 'second' }, { ang: 'ADC', n: 1, col: 'second' }, { ang: 'BCD', lone: true, col: 'pick', r: 130 }],
  fills: [{ pts: 'BCA' }], pad: 90,
});
const P_FIT = fitFig(P_FIG, FR_WIDE);
const P_ACD: Fig = { segs: [], angles: [], points: [], fills: [{ pts: [P_A, P_C, P_D], col: 'second', alpha: 0.24 }] };
const FLAT = arcsFig(9, 4, 5, 'in', ['A', 'B'], 100);
const FLAT_FIT = fitFig(FLAT.fig, FR_WIDE);
function partProve(): void {
  tr.reset('p.');
  const nA = FLAT.fig.segs.filter(s => s.id?.startsWith('arcA~')).length, nB = FLAT.fig.segs.filter(s => s.id?.startsWith('arcB~')).length;
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      const fl = K('p.flatfig');
      sheet(c, FR_WIDE, K('p.sheet'));
      if (fl < 1) {
        const a = 1 - fl;
        const look: Look = {
          k: K('p.fig') * a,
          segs: { AD: K('p.ad'), CD: K('p.cd') },
          ticks: { AD: K('p.tk'), AC: K('p.tk') },
          marks: { ACD: K('p.arcs'), ADC: K('p.arcs'), BCD: K('p.bcd') },
          glow: { BA: K('p.bd'), AD: K('p.bd'), BC: K('p.bc') },
          col: K('p.bd') > 0.5 ? { BA: 'link', AD: 'link' } : {},
          fills: 1,
        };
        drawFig(c, P_ACD, FR_WIDE, { k: K('p.cd') * a }, P_FIT);
        drawFig(c, { ...P_FIG, points: P_FIG.points.filter(p => p.name !== 'D' || K('p.ad') > 0.9) }, FR_WIDE, look, P_FIT);
      }
      if (fl > 0) {
        const segs: Record<string, number> = {};
        for (let i = 0; i < nA; i++) segs[`arcA~${i}`] = clamp(K('p.arcA') * nA - i);
        for (let i = 0; i < nB; i++) segs[`arcB~${i}`] = clamp(K('p.arcB') * nB - i);
        drawFig(c, FLAT.fig, FR_WIDE, { k: fl, segs: { ...segs, Au: K('p.arcA'), Bw: K('p.arcB') } }, FLAT_FIT);
        const kt = K('p.touch');
        if (kt > 0 && FLAT.P) {
          const S = toScreen(FLAT_FIT, FLAT.P);
          c.g.save(); c.g.globalAlpha *= clamp(kt); c.g.beginPath(); c.g.arc(S[0], S[1], 12, 0, Math.PI * 2); c.g.fillStyle = '#B5E36A'; c.g.fill(); c.g.restore();
          label(c, 'C', [S[0], S[1] - 64], 54, 'link', kt);
          drawWords(c, '4 + 5 = 9: the arcs meet only on the base', 960, 960, 'link', kt, { size: 50, align: 'center' });
        }
      }
    },
  });
  tr.set('p.sheet', 1, 0.5); tr.set('p.fig', 1, 0.8, 0.2);
  const CHIPS = [
    { t: 'BD looks longer than BC in the drawing.', fits: -1, mc: MC.appearance as string | undefined, id: 'p.x-look' },
    { t: 'AD = AC by construction, so △ACD is isosceles: its base angles are equal.', fits: 0 },
    { t: 'In △BCD the larger angle faces the longer side, so BD > BC; and BD = BA + AD = BA + AC.', fits: 2 },
    { t: 'It held in every triangle we drew.', fits: -1, mc: MC.examples as string | undefined, id: 'p.x-ex' },
    { t: '∠BCD is ∠BCA plus ∠ACD, and ∠ACD = ∠ADC, which is ∠BDC.', fits: 1 },
  ];
  const CLAIMS = ['p.claim1', 'p.claim2', 'p.claim3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), flatHost = h('div');
  const used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${SCRIPT[id]!.html}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: plainOf(SCRIPT[CLAIMS[filled]!]!.html), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      void ctx.say(`p.c${n}`);
      seq(async alive => {
        if (n === 1) { tr.set('p.ad', 1, 0.9); tr.set('p.tk', 1, 0.5, 0.9); tr.set('p.cd', 1, 0.7, 1.2); tr.set('p.arcs', 1, 0.6, 1.9); await wait(2.6); }
        if (n === 2) { tr.set('p.bcd', 1, 0.8); await wait(1.2); }
        if (n === 3) {
          tr.set('p.bc', 1, 0.6); tr.set('p.bd', 1, 0.8, 0.5); await wait(2.2); if (!alive()) return;
          chipBox.remove(); fbHost.replaceChildren();
          setPanel(h('h2', {}, 'Prove it'), chain, flatHost); askFlat();
        }
      });
      return;
    }
    fbHost.replaceChildren(voicedFb(ch.id ?? 'p.x-other', false));
  }
  function askFlat(): void {
    flatHost.replaceChildren(voiced('p.flat', 'div', 'label'), ask('prove', 'prove.flat', 'What if C lies on segment AB?', [
      { t: 'It is a very flat triangle ABC', ok: false, id: 'p.flat.deg', mc: MC.degenerate },
      { t: 'Then AC + CB = AB exactly: the points are collinear, no triangle', ok: true, id: 'p.flat.ok' },
      { t: 'That cannot happen: AC + CB is always more than AB', ok: false, id: 'p.flat.never', mc: MC.boundary },
    ], () => seq(async alive => {
      tr.set('p.flatfig', 1, 0.9); tr.set('p.arcA', 1, 1.6, 1.0); tr.set('p.arcB', 1, 1.6, 2.4); tr.set('p.touch', 1, 0.6, 4.2); await wait(5.2); if (!alive()) return;
      flatHost.append(voicedFb('p.done', true)); await wait(5.0); if (!alive()) return;
      flatHost.append(callback()); ctx.panel.scrollTop = ctx.panel.scrollHeight;
    })));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.cb : 'q.cb.no', 'p', '', (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
    return c;
  }
  const yes = btn('Always', () => judge(true)), no = btn('Not always', () => judge(false));
  const proofHost = h('div');
  function judge(always: boolean): void {
    yes.disabled = no.disabled = true;
    (always ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'In every triangle, is the longest side shorter than the other two together?', response: always ? 'always' : 'not always', expected: 'always', correct: always });
    proofHost.replaceChildren(voiced(always ? 'p.build' : 'p.build-test'), chain, chipBox, fbHost, flatHost);
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
    show: it => showItem(it as TIItem),
  });
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
const fr2box = (f: Frame): Box => box(f.x, f.y, f.x + f.w, f.y + f.h);
function showItem(item: TIItem): Solve {
  tr.reset('x.');
  const p = item.picture ?? {};
  const rv = p.reveal ?? {};
  const draws: ((c: Canvas) => void)[] = [];
  const keysOn: string[] = [];
  const set = (ids: string[] | undefined, key: string): Record<string, number> => Object.fromEntries((ids ?? []).map(id => [id, K(key)]));
  if (p.gallery) {
    const g = p.gallery, frs = galleryFrames(g.figs.length);
    draws.push(c => g.figs.forEach((f, i) => {
      const fr = frs[i]!;
      sheet(c, fr, K('x.fig'), 30 + i);
      if (rv.cell === i) { const b = fr2box(fr), k = K('x.cell'); if (k > 0) { c.g.save(); c.g.globalAlpha *= clamp(k); c.g.strokeStyle = '#C3AEF6'; c.g.lineWidth = 6; c.g.beginPath(); c.g.roundRect(b.x0 - 14, b.y0 - 14, b.w + 28, b.h + 100, 22); c.g.stroke(); c.g.restore(); } }
      drawFig(c, f, fr, { k: K('x.fig') });
      drawWords(c, g.caps[i] ?? '', fr.x + fr.w / 2, fr.y + fr.h + 52, rv.cell === i && K('x.cell') > 0.5 ? 'pick' : 'dim', K('x.fig'), { size: 44, align: 'center' });
    }));
    keysOn.push('x.fig');
    return finish(draws, keysOn, async () => { tr.set('x.cell', 1, 0.6); });
  }
  const figFr: Frame = p.strip ? FR_TOP : p.proof ? FR_PLEFT : p.card || p.cards ? FR_LEFT : FR_WIDE;
  if (p.fig) {
    const f = p.fig;
    draws.push(c => {
      sheet(c, figFr, K('x.fig'));
      drawFig(c, f, figFr, { k: K('x.fig'), solve: K('x.solve'), solved: set(rv.solved, 'x.solved'), glow: set(rv.glow, 'x.glow'), col: K('x.col') > 0.5 ? rv.col : undefined });
    });
    keysOn.push('x.fig');
  }
  if (p.strip) {
    const s = p.strip;
    draws.push(c => { sheet(c, { x: STRIP_BOX.x0, y: STRIP_BOX.y0, w: STRIP_BOX.w, h: STRIP_BOX.h }, K('x.fig'), 41); drawStrip(c, s, STRIP_BOX, K('x.fig'), K('x.solve')); });
  }
  if (p.proof) {
    const pr = p.proof;
    // a solve fills only cells that wait as '?' (an answer is never drawn before the student answers)
    const askedRow = new Set((pr.ask ?? []).map(a => a.i));
    const fill = new Map((rv.fill ?? []).filter(x => askedRow.has(x.i)).map(x => [x.i, x]));
    const rows = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
    const fr: Frame = p.fig ? FR_PROOF : { x: 260, y: 60, w: 1400, h: 960 };
    const made = tryBlock(() => ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first, reserveRs: RS_RESERVE }, fr, th));
    if (made.ok) {
      const B = made.value, asked = new Set((pr.ask ?? []).map(a => `${a.cell === 'st' ? 's' : 'r'}${a.i}`));
      const P = progressOf<ProofStep>(s => (s === 'frame' ? K('x.fig') : asked.has(s) ? K('x.fill') : K('x.fig')));
      draws.push(c => B.draw(c, P, {
        ask: pr.ask, rings: [...(pr.ring !== undefined ? [{ i: pr.ring, col: 'pick' as Paint, k: K('x.fig') }] : []), ...(rv.rings ?? []).map(i => ({ i, col: 'link' as Paint, k: K('x.rings') }))],
        strike: [...(pr.strike ?? []).map(i => ({ i, k: K('x.fig') })), ...(rv.strike ?? []).map(i => ({ i, k: K('x.strike') }))],
      }));
    } else console.warn('proof frame failed', made.error);
  }
  if (p.card) {
    const b = p.fig ? box(FR_RIGHT.x, 160, FR_RIGHT.x + FR_RIGHT.w, 920) : box(190, 140, 1730, 940);
    const C = cardPainter([...p.card.lines, ...(rv.lines ?? [])], b, { nFirst: p.card.lines.length, size: p.fig ? 46 : 54, align: p.fig ? 'left' : 'center' });
    if (!C.fits) console.warn('card does not fit', item.family);
    draws.push(c => C.draw(c, K('x.card'), K('x.lines')));
    keysOn.push('x.card');
  }
  if (p.cards) {
    const area = p.fig ? box(FR_RIGHT.x, 80, FR_RIGHT.x + FR_RIGHT.w, 1000) : p.cards.length === 1 ? box(260, 200, 1660, 880) : box(80, 160, 1840, 920);
    const C = cardsPainter(p.cards, area);
    draws.push(c => C.draw(c, K('x.card')));
    keysOn.push('x.card');
  }
  if (!draws.length) {
    const C = cardPainter([plainOf(item.prompt)], box(190, 140, 1730, 940));
    draws.push(c => C.draw(c, K('x.card')));
    keysOn.push('x.card');
  }
  return finish(draws, keysOn, async alive => {
    tr.set('x.solve', 1, 0.8); tr.set('x.solved', 1, 0.9, 0.2); tr.set('x.glow', 1, 0.6, 0.2); tr.set('x.col', 1, 0.4);
    tr.set('x.fill', 1, 0.9, 0.3); tr.set('x.rings', 1, 0.6, 0.5); tr.set('x.strike', 1, 0.6, 0.6); tr.set('x.lines', 1, 0.9, 0.3);
    void alive;
  });
}
function finish(draws: ((c: Canvas) => void)[], keys: string[], solve: (alive: () => boolean) => Promise<void>): Solve {
  setScene({ model: c => draws.forEach(d => d(c)), lines: [], leads: [], boardBox: null });
  keys.forEach((k, i) => tr.set(k, 1, 0.7, 0.1 + 0.2 * i));
  return { solve };
}

void runLesson({
  slug: SLUG,
  warm: ['\\overline{AB} \\cong \\overline{AC} \\ \\angle BAC \\cong \\angle CAB \\ \\triangle ABC \\cong \\triangle ACB \\ m\\angle Q = m\\angle R \\ 180^\\circ - 40^\\circ \\ KM < JK < JM \\ \\text{Given Prove}', '\\ell \\parallel \\overline{AC} \\ D\\text{ on }\\overrightarrow{BA} \\ m\\angle BCD > m\\angle BDC \\ BA + AC > BC \\ \\Rightarrow \\ 2x \\ ?'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
