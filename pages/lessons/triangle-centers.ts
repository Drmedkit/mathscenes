// triangle-centers.ts: "Midsegments and points of concurrency" (Geometry, lesson 7) on the shared runtime.
//   1 The question   three towns want a water tower the same distance from all three town halls: the middle
//                    (centroid) / where the angle bisectors meet (incenter) / where the perpendicular bisectors meet
//   2 Worked example four centers, one test: medians -> G (distances differ), angle bisectors -> I (equal to the
//                    ROADS), perpendicular bisectors -> O (equal to the towns; outside: the angle at B is obtuse),
//                    altitudes -> H (outside, no equal distances). Why is O equidistant? (on two bisectors)
//   3 Your turn      the midsegment MN = AB/2 (worked), then the centroid: AG from AM, GN from BN (typed)
//   4 Prove it       the Perpendicular Bisector Theorem on the course's proof frame (Parsons with two decoys, then
//                    reasons), then the concurrency: why the third bisector passes through O (OA = OC + converse);
//                    the circle through the towns. Callback to part 1.
//   5 Practice       all 35 sub-goals one after another, then mixed (runtime/practice.ts)
// Reused read-only: geometry-foundations geo.ts + GeoFig.ts (exact figures), ProofFrame.ts + proofPanel.ts, Card.ts;
// triangle-congruence tri.ts (buildFig); constructions Construct.ts + cons.ts (the construction player).
import type { Canvas } from '../../src/core/draw';
import { dot, strokePts } from '../../src/core/draw';
import { box, type Box, clamp } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import type { Paint } from '../../src/core/theme';
import { th, setScene, seq, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { tryBlock } from '../../src/blocks/block';
import { drawWords } from '../../src/lesson/words';
import { type Fig, type Fit, type Frame, type Pt, FR_LEFT, FR_LESSON, FR_RIGHT, FR_WIDE, add, arcPts, dist, fitFig, galleryFrames, mul, sub, toScreen, unit } from '../../src/lesson/topics/geometry-foundations/geo';
import { type Look, drawFig, label, sheet } from '../../src/lesson/topics/geometry-foundations/GeoFig';
import { ProofFrame, type ProofStep } from '../../src/lesson/topics/geometry-foundations/ProofFrame';
import { proofPanel } from '../../src/lesson/topics/geometry-foundations/proofPanel';
import { cardPainter, cardsPainter } from '../../src/lesson/topics/geometry-foundations/Card';
import { buildFig, mapFig, triSSS } from '../../src/lesson/topics/triangle-congruence/tri';
import { drawCons, layoutCons } from '../../src/lesson/topics/constructions/Construct';
import { type Tri, centroidOf, circumcenterOf, footOf, incenterOf, mid, orthocenterOf } from '../../src/lesson/topics/triangle-centers/centers';
import { linesFig } from '../../src/lesson/topics/triangle-centers/tfigs';
import { MC } from '../../src/lesson/topics/triangle-centers/tkit';
import { MCX, RS } from '../../src/lesson/topics/triangle-centers/tcProofs';
import { FAMILY_NAMES, GENERATORS, type TCItem } from '../../src/lesson/topics/triangle-centers/items';
import { PLAN } from '../../src/lesson/topics/triangle-centers/plan';
import { explain } from '../../src/lesson/topics/triangle-centers/explain';
import { SCRIPT } from '../../src/lesson/topics/triangle-centers/script';
import LINES from './triangle-centers/voice/lines.json';

const SLUG = 'triangle-centers';
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
const ov = (s: string) => [...s].map(ch => ch + '̅').join('');
const RIGHT_FR: Frame = { x: FR_RIGHT.x, y: FR_RIGHT.y, w: FR_RIGHT.w, h: FR_RIGHT.h };

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

// ===================== the three towns (parts 1, 2, 4) =====================
const MI = 62;   // model units per mile
const TA: Pt = [0, 0], TB: Pt = [3.3 * MI, 3.7 * MI], TC: Pt = [10 * MI, 0];
const TT: Tri = [TA, TB, TC];
const G0 = centroidOf(TT), I0 = incenterOf(TT), O0 = circumcenterOf(TT), H0 = orthocenterOf(TT);
const R0 = dist(O0, TA);
const TOWN_FIG: Fig = buildFig({ pts: { A: TA, B: TB, C: TC }, segs: ['AB', 'BC', 'CA'], fills: [{ pts: 'ABC' }], dirs: { A: 200, B: 90, C: 340 } });
TOWN_FIG.words = [{ at: add(TA, [-20, -52]), text: 'Ashford' }, { at: add(TB, [0, 60]), text: 'Brook' }, { at: add(TC, [20, -52]), text: 'Cedar Falls' }];
/** the direction (degrees, y up) from c farthest from every given direction */
function freeDir(c: Pt, toward: Pt[]): number {
  const dirs = toward.filter(q => dist(q, c) > 1).map(q => (Math.atan2(q[1] - c[1], q[0] - c[0]) * 180) / Math.PI);
  let best = 90, bestGap = -1;
  for (let d = 0; d < 360; d += 5) { const gap = Math.min(...dirs.map(x => { const a = Math.abs((((d - x) % 360) + 540) % 360 - 180); return a; })); if (gap > bestGap) { bestGap = gap; best = d; } }
  return best;
}
/** a lines figure with its center letter renamed (placed in the freest direction) and the vertex letters left to the
 *  towns figure */
const ren = (f: Fig, to: string, ctr: Pt, busy: Pt[]): Fig => {
  const g = mapFig(f, s => s.replace(/P/g, to));
  const ends = g.segs.flatMap(x => [x.a, x.b]);
  return { ...g, fills: [], points: g.points.filter(p => p.name === to).map(p => ({ ...p, dist: 62, dir: freeDir(ctr, [...ends, ...busy]) })) };
};
const FEET = (c: Pt): Pt[] => [footOf(c, TA, TB), footOf(c, TB, TC), footOf(c, TC, TA)];
const FIG_MED = ren(linesFig(TT, 'centroid', { col: 'first' }), 'G', G0, TT);
const FIG_BIS = ren(linesFig(TT, 'incenter', { col: 'first' }), 'I', I0, [...TT, ...FEET(I0)]);
const FIG_PB = ren(linesFig(TT, 'circumcenter', { col: 'first' }), 'O', O0, TT);
const FIG_PB2 = ren(linesFig(TT, 'circumcenter', { col: 'first', only: [0, 2] }), 'O', O0, [...TT, mid(TA, TC), add(O0, [0, 400])]);
const FIG_ALT = ren(linesFig(TT, 'orthocenter', { col: 'first' }), 'H', H0, TT);
const span = (P: Pt[]): Fig => ({ segs: [{ a: P[0]!, b: P[0]! }, ...P.map(p => ({ a: p, b: p }))], angles: [], points: [], pad: 120, maxS: 3 });
const circlePts = (c: Pt, r: number): Pt[] => Array.from({ length: 49 }, (_, i) => add(c, mul([Math.cos((i * Math.PI) / 24), Math.sin((i * Math.PI) / 24)], r)));
const FIT_T = fitFig(span([TA, TB, TC, G0, I0]), FR_WIDE);
const FIT_O = fitFig(span([TA, TB, TC, ...circlePts(O0, R0)]), FR_WIDE);
const FIT_H = fitFig(span([TA, TB, TC, H0, ...circlePts(O0, R0)]), FR_WIDE);
const lerpFit = (a: Fit, b: Fit, u: number): Fit => ({ s: a.s + (b.s - a.s) * u, ox: a.ox + (b.ox - a.ox) * u, oy: a.oy + (b.oy - a.oy) * u, fr: a.fr });
/** the camera: 0 = the triangle, 1 = the circumscribed circle, 2 = the orthocenter too */
const camFit = (u: number): Fit => (u <= 1 ? lerpFit(FIT_T, FIT_O, clamp(u)) : lerpFit(FIT_O, FIT_H, clamp(u - 1)));
const miles = (a: Pt, b: Pt) => `${(dist(a, b) / MI).toFixed(1)} mi`;
/** a spoke from a center to a point with its length beside it */
function segDist(p: Pt, a: Pt, b: Pt): number {
  const d = sub(b, a), L2 = d[0] * d[0] + d[1] * d[1] || 1, t = clamp(((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / L2);
  return dist(p, [a[0] + d[0] * t, a[1] + d[1] * t]);
}
/** the model segments a label must keep clear of (screen coordinates are made per frame) */
let AVOID: [Pt, Pt][] = [];
function spoke(c: Canvas, F: Fit, from: Pt, to: Pt, col: Paint, k: number, text?: string, _side = 1): void {
  if (k <= 0) return;
  const P = toScreen(F, from), Q = toScreen(F, to);
  strokePts(c, [P, [P[0] + (Q[0] - P[0]) * clamp(k), P[1] + (Q[1] - P[1]) * clamp(k)]], { col, lw: 4, dash: [12, 10], cap: 'butt' });
  if (text && k > 0.6) {
    const segs = AVOID.map(([a, b]) => [toScreen(F, a), toScreen(F, b)] as [Pt, Pt]);
    const u = unit(sub(Q, P));
    let best: Pt = P, bestD = -1;
    for (const t of [0.5, 0.62, 0.38, 0.72, 0.28]) for (const side of [1, -1]) for (const off of [46, 64]) {
      const n: Pt = [u[1] * side, -u[0] * side], M: Pt = [P[0] + (Q[0] - P[0]) * t + n[0] * off, P[1] + (Q[1] - P[1]) * t + n[1] * off];
      const box4: Pt[] = [M, [M[0] - 70, M[1]], [M[0] + 70, M[1]], [M[0], M[1] - 22], [M[0], M[1] + 22]];
      const d = Math.min(...segs.flatMap(sg => box4.map(q => segDist(q, sg[0], sg[1]))));
      if (d > bestD + 4) { bestD = d; best = M; }
    }
    label(c, text, best, 48, col, clamp((k - 0.6) / 0.4));
  }
}
/** a center as a bright dot (its letter belongs to the lines figure) */
function centerDot(c: Canvas, F: Fit, p: Pt, _name: string, _dir: number, k: number, col: Paint = 'link'): void {
  if (k <= 0) return;
  const P = toScreen(F, p);
  dot(c, P[0], P[1], 11, col, k);
}
function circle(c: Canvas, F: Fit, ctr: Pt, r: number, k: number, col: Paint): void {
  if (k <= 0) return;
  const C = toScreen(F, ctr);
  strokePts(c, arcPts(C, r * F.s, 90, 360 * clamp(k)), { col, lw: 5 });
}
/** the towns scene of parts 1, 2 and 4: keys under `p` (prefix) */
function townsScene(p: string): (c: Canvas) => void {
  return c => {
    const F = camFit(K(p + 'cam'));
    sheet(c, FR_WIDE, K(p + 'sheet'));
    const on = (f: Fig, a: string, b: string) => (K(p + a) * (1 - K(p + b)) > 0.3 ? f.segs.map(x => [x.a, x.b] as [Pt, Pt]) : []);
    const sp = (ctr: Pt, key: string, off: string, to: Pt[]) => (K(p + key) * (1 - K(p + off)) > 0 ? to.map(q => [ctr, q] as [Pt, Pt]) : []);
    AVOID = [[TA, TB], [TB, TC], [TC, TA], ...on(FIG_MED, 'med', 'medoff'), ...on(FIG_BIS, 'bis', 'bisoff'), ...on(FIG_PB, 'pb', 'pboff'), ...on(FIG_PB2, 'pb2', 'pb2off'), ...on(FIG_ALT, 'alt', 'altoff'),
      ...sp(G0, 'gsp', 'medoff', TT), ...sp(I0, 'isp', 'bisoff', FEET(I0)), ...sp(I0, 'isp2', 'bisoff', [TA, TC]), ...sp(O0, 'osp', 'zz', TT)];
    const lay = (f: Fig, on: string, off: string) => { const k = K(p + on) * (1 - K(p + off)); if (k > 0) drawFig(c, f, FR_WIDE, { k }, F); };
    drawFig(c, TOWN_FIG, FR_WIDE, { k: K(p + 'fig'), words: K(p + 'words') }, F);
    lay(FIG_MED, 'med', 'medoff'); lay(FIG_BIS, 'bis', 'bisoff'); lay(FIG_PB, 'pb', 'pboff'); lay(FIG_PB2, 'pb2', 'pb2off'); lay(FIG_ALT, 'alt', 'altoff');
    const gk = K(p + 'gsp') * (1 - K(p + 'medoff'));
    spoke(c, F, G0, TA, 'pick', gk, miles(G0, TA), -1); spoke(c, F, G0, TB, 'pick', gk, miles(G0, TB), -1); spoke(c, F, G0, TC, 'pick', gk, miles(G0, TC), 1);
    const ik = K(p + 'isp') * (1 - K(p + 'bisoff'));
    const fe = [footOf(I0, TA, TB), footOf(I0, TB, TC), footOf(I0, TC, TA)];
    fe.forEach((q, i) => spoke(c, F, I0, q, 'second', ik, i === 2 ? miles(I0, q) : undefined, 1));
    const ik2 = K(p + 'isp2') * (1 - K(p + 'bisoff'));
    spoke(c, F, I0, TA, 'pick', ik2, miles(I0, TA), 1); spoke(c, F, I0, TC, 'pick', ik2, miles(I0, TC), -1);
    const ok = K(p + 'osp');
    spoke(c, F, O0, TA, 'link', ok, miles(O0, TA), 1); spoke(c, F, O0, TB, 'link', ok, miles(O0, TB), 1); spoke(c, F, O0, TC, 'link', ok, miles(O0, TC), -1);
    circle(c, F, O0, R0, K(p + 'circ'), 'link');
    // the third perpendicular bisector (part 4): drawn on through O
    const k3 = K(p + 'third');
    if (k3 > 0) { const M = mid(TA, TC), e0 = toScreen(F, add(M, [0, 90])), e1 = toScreen(F, add(O0, [0, -110])); strokePts(c, [e0, [e0[0] + (e1[0] - e0[0]) * k3, e0[1] + (e1[1] - e0[1]) * k3]], { col: 'link', lw: 6, glow: 12 }); }
    centerDot(c, F, O0, 'O', 0, K(p + 'O2'), 'link');
  };
}

// ===================== 1. The question =====================
const CARDS = [
  { name: 'The middle', t: 'where the three medians meet: the center of the triangle', mc: MC.central as string | undefined, cb: 'q.cb.mid', right: false },
  { name: 'Bisect the angles', t: 'where the three angle bisectors meet: the same distance from all three roads', mc: MC.swap as string | undefined, cb: 'q.cb.bis', right: false },
  { name: 'Bisect the roads', t: 'where the perpendicular bisectors of the three roads meet, wherever that is', mc: undefined as string | undefined, cb: 'q.cb.pb', right: true },
];
function partQuestion(): void {
  tr.reset('q.');
  setScene({ boardBox: null, lines: [], leads: [], model: townsScene('q.') });
  tr.set('q.sheet', 1, 0.6); tr.set('q.fig', 1, 0.9, 0.3); tr.set('q.words', 1, 0.8, 0.9);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Three towns want a water tower exactly the same distance from all three town halls. Where should it go?', response: `${c.name}: ${c.t}`, expected: 'Bisect the roads', correct: c.right, mc: c.mc, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'A fair spot for the tower'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: four centers =====================
function partExample(): void {
  tr.reset('e.');
  const scene = townsScene('e.');
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      scene(c);
      const F = camFit(K('e.cam'));
      centerDot(c, F, G0, 'G', 300, K('e.G') * (1 - K('e.medoff')), 'link');
      centerDot(c, F, I0, 'I', 250, K('e.I') * (1 - K('e.bisoff')), 'link');
      centerDot(c, F, O0, 'O', 0, K('e.O'), 'link');
      centerDot(c, F, H0, 'H', 0, K('e.H'), 'link');
    },
  });
  tr.set('e.sheet', 1, 0.5); tr.set('e.fig', 1, 0.8, 0.2);
  let step = 0;
  const STEPS = [
    { t: 'Medians: the centroid', why: 'The balance point.', act: 'Draw' },
    { t: 'Angle bisectors: the incenter', why: 'Equal to what?', act: 'Draw' },
    { t: 'Perpendicular bisectors: the circumcenter', why: 'The fair spot?', act: 'Draw' },
    { t: 'Altitudes: the orthocenter', why: 'The fourth center.', act: 'Draw' },
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
        tr.set('e.med', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.G', 1, 0.5); await wait(0.7); if (!alive()) return;
        tr.set('e.gsp', 1, 1.2); await wait(1.4);
      } else if (i === 1) {
        tr.set('e.medoff', 1, 0.6); tr.set('e.bis', 1, 1.0, 0.4); await wait(1.6); if (!alive()) return;
        tr.set('e.I', 1, 0.5); await wait(0.6); if (!alive()) return;
        tr.set('e.isp', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.isp2', 1, 1.0); await wait(1.2);
      } else if (i === 2) {
        tr.set('e.bisoff', 1, 0.6); tr.set('e.cam', 1, 1.6, 0.3); tr.set('e.pb', 1, 1.0, 1.4); await wait(2.6); if (!alive()) return;
        tr.set('e.O', 1, 0.5); await wait(0.6); if (!alive()) return;
        tr.set('e.osp', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.circ', 1, 1.6); await wait(1.8);
      } else {
        tr.set('e.pboff', 1, 0.6); tr.set('e.cam', 2, 1.6, 0.2); tr.set('e.alt', 1, 1.0, 1.2); await wait(2.4); if (!alive()) return;
        tr.set('e.H', 1, 0.5); await wait(0.8);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    after.replaceChildren(voiced('e.why', 'div', 'label'), ask('example', 'example.why', 'Why is O the same distance from all three towns?', [
      { t: 'O is in the middle of the triangle', ok: false, id: 'e.why.mid', mc: MC.central },
      { t: 'O is on the perpendicular bisectors of AB and BC: so OA = OB and OB = OC', ok: true, id: 'e.why.ok' },
      { t: 'O is on the angle bisectors, so it is equidistant', ok: false, id: 'e.why.bis', mc: MC.swap },
    ], () => after.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')))));
  }
  drawPlan();
  setPanel(h('h2', {}, 'Four centers, one test'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: midsegment and centroid =====================
const CM = 26;   // model units per cm
const Y_T: Tri = (() => { const T = triSSS(20 * CM, Math.sqrt(292) * CM, 14 * CM); return T; })();   // BC = 20, AC = √292, AB = 14: AM = 12, BN = 15
const Y_M = mid(Y_T[1], Y_T[2]), Y_N = mid(Y_T[0], Y_T[2]), Y_G = centroidOf(Y_T);
const Y_FIG: Fig = (() => {
  const f = buildFig({
    pts: { A: Y_T[0], B: Y_T[1], C: Y_T[2], M: Y_M, N: Y_N, G: Y_G }, segs: ['AB', 'BM', 'MC', 'CN', 'NA', 'AG', 'GM', 'BG', 'GN', 'MN'],
    marks: [{ seg: 'BM', n: 1 }, { seg: 'MC', n: 1 }, { seg: 'CN', n: 2 }, { seg: 'NA', n: 2 }, { seg: 'AB', text: '14 cm', lone: true }],
    fills: [{ pts: 'ABC' }], dirs: { G: 270 },
  });
  f.segs = f.segs.map(s => (s.id === 'MN' ? { ...s, text: '?', alt: '7 cm', col: 'second' as const } : s.id === 'AG' ? { ...s, text: '?', alt: '8 cm', side: -1 as const } : s.id === 'GN' ? { ...s, text: '?', alt: '5 cm', side: 1 as const } : s));
  return f;
})();
function partTurn(): void {
  tr.reset('t.');
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_WIDE, K('t.sheet'));
      const look: Look = {
        k: K('t.fig'), labels: { MN: K('t.mnl'), AG: K('t.agl'), GN: K('t.gnl') }, solved: { MN: K('t.mn'), AG: K('t.ag'), GN: K('t.gn') },
        glow: { MN: K('t.mng') * (1 - K('t.mn')), AG: K('t.agg') * (1 - K('t.ag')), GM: K('t.agg') * (1 - K('t.ag')), GN: K('t.gng') * (1 - K('t.gn')), BG: K('t.gng') * (1 - K('t.gn')) },
        col: { ...(K('t.ag') > 0.5 ? { AG: 'link' as const } : {}), ...(K('t.gn') > 0.5 ? { GN: 'link' as const } : {}) },
      };
      drawFig(c, Y_FIG, FR_WIDE, look);
    },
  });
  tr.set('t.sheet', 1, 0.5); tr.set('t.fig', 1, 0.8, 0.2); tr.set('t.mnl', 1, 0.6, 0.8);
  const work = h('div');
  seq(async alive => {
    await wait(1.4); if (!alive()) return;
    tr.set('t.mng', 1, 0.6); await wait(0.8); if (!alive()) return;
    tr.set('t.mn', 1, 0.9);
    work.replaceChildren(voiced('t.mn'));
    await wait(1.2); if (!alive()) return;
    askAG();
  });
  function numAsk(id: string, item: string, prompt: string, right: number, wrongs: { v: number; id: string; mc?: string }[], other: string, onRight: () => void): HTMLElement {
    const fbHost = h('div'), inp = numInput('cm', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) return;
      const w = wrongs.find(x => Math.abs(x.v - r.v) < 1e-9);
      const good = Math.abs(r.v - right) < 1e-9;
      ctx.store.log({ part: 'turn', item, prompt, response: r.v, expected: right, correct: good, mc: good ? undefined : w?.mc });
      if (!good) { fbHost.replaceChildren(voicedFb(w?.id ?? other, false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb(`${id}.ok`, true));
      onRight();
    }
    const d = h('div', {}, voiced(`${id}.ask`), inp.node, h('div', { class: 'row' }, ok), fbHost);
    setTimeout(() => inp.focus(), 50);
    return d;
  }
  function askAG(): void {
    tr.set('t.agl', 1, 0.5); tr.set('t.agg', 1, 0.6);
    work.append(numAsk('t.ag', 'turn.ag', 'AM = 12 cm and G is the centroid. How long is AG?', 8, [
      { v: 6, id: 't.ag.bisects', mc: MC.bisects }, { v: 4, id: 't.ag.ratio', mc: MC.ratioWrong }, { v: 9, id: 't.ag.three', mc: MC.threeOne },
    ], 't.ag.other', () => { tr.set('t.ag', 1, 0.9); seq(async alive => { await wait(1.6); if (alive()) askGN(); }); }));
  }
  function askGN(): void {
    tr.set('t.gnl', 1, 0.5); tr.set('t.gng', 1, 0.6);
    work.append(numAsk('t.gn', 'turn.gn', 'BN = 15 cm. How long is GN?', 5, [
      { v: 10, id: 't.gn.long', mc: MC.ratioWrong }, { v: 7.5, id: 't.gn.half', mc: MC.bisects }, { v: 3.75, id: 't.gn.other', mc: MC.threeOne },
    ], 't.gn.other', () => {
      tr.set('t.gn', 1, 0.9);
      seq(async alive => { await wait(1.6); if (!alive()) return; work.append(voiced('t.done'), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go'))); ctx.panel.scrollTop = ctx.panel.scrollHeight; });
    }));
    ctx.panel.scrollTop = ctx.panel.scrollHeight;
  }
  setPanel(h('h2', {}, 'Your turn: midsegment and centroid'), voiced('t.intro'), work);
}

// ===================== 4. Prove it: the Perpendicular Bisector Theorem, then concurrency =====================
const P_PTS = { A: [-170, 0] as Pt, B: [170, 0] as Pt, M: [0, 0] as Pt, P: [0, 290] as Pt, X: [0, -120] as Pt, Y: [0, 410] as Pt };
const P_FIG: Fig = buildFig({ pts: P_PTS, bare: ['X', 'Y'], segs: ['AM', 'MB', 'XY', 'PA', 'PB', 'PM'], marks: [{ seg: 'AM', n: 1 }, { seg: 'MB', n: 1 }, { ang: 'YMB', box: true }], segStyle: { XY: { kind: 'line', name: 'ℓ' }, PM: { col: 'faint' } }, fills: [{ pts: 'PMA', col: 'body' }, { pts: 'PMB', col: 'body', alpha: 0.5 }], dirs: { M: 225, P: 30 } });
const cgT = (a: string, b: string) => `\\overline{${a}} \\cong \\overline{${b}}`;
const P_LINES = [
  { st: `${ov('AM')} ≅ ${ov('BM')}`, tex: cgT('AM', 'BM'), rs: RS.defMid, uses: [] as number[] },
  { st: '∠PMA ≅ ∠PMB', tex: '\\angle PMA \\cong \\angle PMB', rs: RS.defPerp, uses: [] as number[] },
  { st: `${ov('PM')} ≅ ${ov('PM')}`, tex: cgT('PM', 'PM'), rs: RS.refl, uses: [] as number[] },
  { st: '△PMA ≅ △PMB', tex: '\\triangle PMA \\cong \\triangle PMB', rs: RS.SAS, uses: [1, 2, 3] },
  { st: `${ov('PA')} ≅ ${ov('PB')}`, tex: cgT('PA', 'PB'), rs: RS.cpctc, uses: [4] },
];
const P_DECOYS = [
  { st: '∠PAM ≅ ∠PBM', why: 'nothing gives that yet; it follows only once the triangles are congruent.', mc: MCX.beforeEst },
  { st: `${ov('PM')} ≅ ${ov('AM')}`, why: 'nothing marks PM ≅ AM; it only looks that way in this drawing.', mc: MC.appearance },
];
const P_MENU = [
  { t: RS.given }, { t: RS.defMid }, { t: RS.defPerp }, { t: RS.refl }, { t: RS.SAS }, { t: RS.cpctc },
  { t: 'SSA', mc: MC.ssa, why: 'SSA is not a criterion, and here the right angle is between the two sides.' },
  { t: RS.vert, mc: MCX.wrongPair, why: 'The two angles at M form a linear pair, not vertical angles.' },
  { t: RS.pbThm, mc: MC.circular, why: 'That is the theorem being proved: it cannot be its own reason.' },
];
function partProve(): void {
  tr.reset('p.');
  const placed: number[] = [], reasons: string[] = [];
  const make = () => ProofFrame({ given: ['\\ell \\perp \\overline{AB} \\text{ at its midpoint } M;\\ P \\text{ on } \\ell'], prove: cgT('PA', 'PB'), rows: P_LINES.map((_, k) => ({ st: placed[k] ? P_LINES[placed[k]! - 1]!.tex : '', rs: reasons[k] ?? '' })), reserve: P_LINES.map(l => l.tex), reserveRs: P_MENU.map(m => m.t) }, RIGHT_FR, th);
  let P = make();
  const towns = townsScene('p.');
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      const tw = K('p.towns');
      if (tw < 1) {
        const a = 1 - tw;
        sheet(c, FR_LESSON, K('p.sheet') * a);
        const gl = (k: string) => K(`p.${k}`) * (1 - K(`p.${k}off`));
        drawFig(c, P_FIG, FR_LESSON, {
          k: K('p.fig') * a,
          glow: { AM: gl('g1'), MB: gl('g1'), YMB: gl('g2'), PM: gl('g3'), PA: K('p.done'), PB: K('p.done') },
          col: K('p.done') > 0.5 ? { PA: 'link', PB: 'link' } : {},
        });
        c.g.save(); c.g.globalAlpha *= a; P.draw(c, progressOf<ProofStep>(s => tr.k(`p.pf.${s}`)), {}); c.g.restore();
      }
      if (tw > 0) { c.g.save(); c.g.globalAlpha *= tw; towns(c); c.g.restore(); }
    },
  });
  tr.set('p.sheet', 1, 0.5); tr.set('p.fig', 1, 0.8, 0.2); tr.set('p.pf.frame', 1, 0.8, 0.5);
  const host = h('div'), fbHost = h('div'), nextHost = h('div');
  const panel = proofPanel({
    lines: P_LINES.map(l => ({ st: l.st, rs: l.rs, uses: l.uses })),
    decoys: P_DECOYS, menu: P_MENU, order: [4, 6, 1, 0, 5, 3, 2],
    say: { order: 'Tap the lines in an order that works (two are decoys).', reasons: 'Now pick the reason for each line, top to bottom.' },
    onPlace(line, pos) {
      placed[pos] = line; P = make(); tr.set(`p.pf.s${pos}`, 1, 0.8);
      for (const k of ['g1', 'g2', 'g3']) if (K(`p.${k}`) > 0) tr.set(`p.${k}off`, 1, 0.4);
      if (line <= 3) tr.set(`p.g${line}`, 1, 0.5);
      ctx.store.log({ part: 'prove', item: `prove.order${pos + 1}`, prompt: `Line ${pos + 1} of the proof`, response: P_LINES[line - 1]!.st, correct: true });
    },
    onReason(pos, _line, reason) {
      reasons[pos] = reason; P = make(); tr.set(`p.pf.r${pos}`, 1, 0.7);
      ctx.store.log({ part: 'prove', item: `prove.reason${pos + 1}`, prompt: `Reason for line ${pos + 1}`, response: reason, correct: true });
      fbHost.replaceChildren();
    },
    onWrong(e) {
      ctx.store.log({ part: 'prove', item: `prove.${e.phase}`, prompt: e.prompt, response: e.response, correct: false, mc: e.mc });
      void ctx.say('p.wrong');
    },
    onDone() {
      tr.set('p.done', 1, 0.6);
      seq(async alive => {
        fbHost.replaceChildren(voicedFb('p.proved', true));
        await wait(1.6); if (!alive()) return;
        // to the towns: the two perpendicular bisectors and O
        tr.jump('p.cam', 1); tr.set('p.towns', 1, 1.0); tr.set('p.fig', 1, 0.1); tr.set('p.pb2', 1, 0.8, 0.6); tr.set('p.O2', 1, 0.5, 1.2);
        await wait(1.8); if (!alive()) return;
        host.replaceChildren(nextHost);
        nextHost.replaceChildren(voiced('p.next', 'div', 'label'), ask('prove', 'prove.concurrency', 'Why must the perpendicular bisector of AC pass through O too?', [
          { t: 'Any two lines meet, so all three meet', ok: false, id: 'p.next.two', mc: MC.twoMeet },
          { t: 'OA = OB and OB = OC, so OA = OC: and a point equidistant from A and C is on their perpendicular bisector', ok: true, id: 'p.next.ok' },
          { t: 'It looks like it passes through O', ok: false, id: 'p.next.look', mc: MC.appearance },
          { t: 'By the theorem just proved: O is on it, so OA = OC', ok: false, id: 'p.next.circ', mc: MC.circular },
        ], () => seq(async alive2 => {
          tr.set('p.third', 1, 1.4); await wait(1.6); if (!alive2()) return;
          tr.set('p.osp', 1, 1.0); tr.set('p.circ', 1, 1.6, 0.6); await wait(2.4); if (!alive2()) return;
          nextHost.append(voicedFb('p.done', true)); await wait(4.5); if (!alive2()) return;
          nextHost.append(callback()); ctx.panel.scrollTop = ctx.panel.scrollHeight;
        })));
      });
    },
  });
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.cb : 'q.cb.pb', 'p', '', (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
    return c;
  }
  host.replaceChildren(panel.node, fbHost);
  setPanel(h('h2', {}, 'Prove it'), voiced('p.intro'), host);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as TCItem),
  });
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
const fr2box = (f: Frame): Box => box(f.x, f.y, f.x + f.w, f.y + f.h);
function showItem(item: TCItem): Solve {
  tr.reset('x.');
  const p = item.picture ?? {};
  const rv = p.reveal ?? {};
  const draws: ((c: Canvas) => void)[] = [];
  const keysOn: string[] = [];
  const set = (ids: string[] | undefined, key: string): Record<string, number> => Object.fromEntries((ids ?? []).map(id => [id, K(key)]));
  const besideFig = !!(p.proof || p.card || p.cards);
  if (p.gallery) {
    const g = p.gallery, frs = galleryFrames(g.figs.length);
    draws.push(c => g.figs.forEach((f, i) => {
      const fr = frs[i]!;
      sheet(c, fr, K('x.fig'), 30 + i);
      drawFig(c, f, fr, { k: K('x.fig') });
      drawWords(c, g.caps[i] ?? '', fr.x + fr.w / 2, fr.y + fr.h + 52, 'dim', K('x.fig'), { size: 44, align: 'center' });
    }));
    keysOn.push('x.fig');
    void fr2box;
  }
  if (p.cons) {
    const cp = p.cons, fr = besideFig ? FR_LEFT : FR_WIDE;
    const lay = layoutCons(cp.c, fr, cp.over);
    tr.jump('x.up', cp.upto);
    draws.push(c => {
      sheet(c, fr, K('x.fig'));
      drawCons(c, cp.c, lay, { upto: K('x.up'), k: K('x.fig'), overlay: cp.over, over: 1 });
    });
    keysOn.push('x.fig');
  } else if (p.fig) {
    const fr = besideFig ? FR_LEFT : FR_WIDE, f = p.fig;
    draws.push(c => {
      sheet(c, fr, K('x.fig'));
      drawFig(c, f, fr, { k: K('x.fig'), solve: K('x.solve'), solved: set(rv.solved, 'x.solved'), glow: set(rv.glow, 'x.glow'), col: K('x.col') > 0.5 ? rv.col : undefined });
    });
    keysOn.push('x.fig');
  }
  if (p.proof) {
    const pr = p.proof;
    const askedRow = new Set((pr.ask ?? []).map(a => a.i));
    const fill = new Map((rv.fill ?? []).filter(x => askedRow.has(x.i)).map(x => [x.i, x]));
    const rows = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
    const fr: Frame = p.fig ? { x: RIGHT_FR.x, y: 60, w: RIGHT_FR.w, h: 960 } : { x: 260, y: 60, w: 1400, h: 960 };
    const made = tryBlock(() => ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first }, fr, th));
    if (made.ok) {
      const B = made.value, asked = new Set((pr.ask ?? []).map(a => `${a.cell === 'st' ? 's' : 'r'}${a.i}`));
      const P = progressOf<ProofStep>(s => (s === 'frame' ? K('x.fig') : asked.has(s) ? K('x.fill') : K('x.fig')));
      draws.push(c => B.draw(c, P, {
        ask: pr.ask, rings: [...(pr.ask ?? []).map(a => ({ i: a.i, col: 'pick' as Paint, k: K('x.fig') })), ...(rv.rings ?? []).map(i => ({ i, col: 'link' as Paint, k: K('x.rings') }))],
        strike: [...(pr.strike ?? []).map(i => ({ i, k: K('x.fig') })), ...(rv.strike ?? []).map(i => ({ i, k: K('x.strike') }))],
      }));
    } else console.warn('proof frame failed', made.error);
  }
  if (p.card) {
    const b = p.fig || p.cons ? box(RIGHT_FR.x, 160, RIGHT_FR.x + RIGHT_FR.w, 920) : box(190, 140, 1730, 940);
    const C = cardPainter([...p.card.lines, ...(rv.lines ?? [])], b, { nFirst: p.card.lines.length, size: p.fig ? 46 : 52, align: p.fig || p.card.lines.length > 2 ? 'left' : 'center' });
    if (!C.fits) console.warn('card does not fit', item.family);
    draws.push(c => C.draw(c, K('x.card'), K('x.lines')));
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
  setScene({ model: c => draws.forEach(d => d(c)), lines: [], leads: [], boardBox: null });
  keysOn.forEach((k, i) => tr.set(k, 1, 0.7, 0.1 + 0.2 * i));
  return {
    solve: async alive => {
      tr.set('x.solve', 1, 0.8); tr.set('x.solved', 1, 0.9, 0.2); tr.set('x.glow', 1, 0.6, 0.2); tr.set('x.col', 1, 0.4);
      tr.set('x.fill', 1, 0.9, 0.3); tr.set('x.rings', 1, 0.6, 0.5); tr.set('x.strike', 1, 0.6, 0.6); tr.set('x.lines', 1, 0.9, 0.3);
      if (p.cons && p.cons.after !== undefined) tr.set('x.up', p.cons.after, 1.6, 0.2);
      void alive;
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\overline{AM} \\cong \\overline{BM} \\ \\angle PMA \\cong \\angle PMB \\ \\triangle PMA \\cong \\triangle PMB \\ \\overline{PA} \\cong \\overline{PB} \\ \\ell \\perp \\text{ at its midpoint on Given Prove}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
