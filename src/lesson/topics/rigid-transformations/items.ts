// items.ts: exercise families for "translations, reflections and rotations" (grade 8, 8.G.A.1-3). One family per
// sub-goal of the topic JSON (plan.ts), generated with that sub-goal's cases, checked exactly (motionMaths.ts), and
// every classic wrong answer tagged with its misconception id (math-curriculum-essentials/misconceptions.json).
// Pure: no DOM, no canvas. A seeded rng makes sessions repeatable. Pictures are MotionGrid pictures (GridPic).
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import type { GridPic, FigSpec } from './MotionGrid';
import {
  type Motion, type V, add, angleAt, apply, applyAll, area2, clean, describe, dist, eqV, lineName, orient, pt, ptTex, rot,
  sgn, slideWords, sub,
} from './motionMaths';
import { ans as mark, endOnChoice } from '../../runtime/explain';

export const MC = {
  position: 'mc.transformations.matches-parts-by-position-or-letters',
  anyMove: 'mc.transformations.calls-any-move-a-translation',
  gap: 'mc.transformations.translation-measured-as-gap',
  notPerp: 'mc.transformations.reflects-not-perpendicular-to-line',
  oneCond: 'mc.transformations.reflection-one-condition-only',
  wrongCenter: 'mc.transformations.rotates-about-wrong-center',
  reverse: 'mc.transformations.reverses-rotation-direction',
  ignoreDist: 'mc.transformations.rotation-ignores-distance-to-center',
  rotRefl: 'mc.transformations.rotation-and-reflection-confused',
  orientTrans: 'mc.transformations.preserved-orientation-proves-translation',
  oneMotion: 'mc.transformations.end-image-determines-one-motion',
  ignoreLabels: 'mc.transformations.ignores-vertex-labels-when-matching-images',
  diagUnit: 'mc.coordinate-geometry.diagonal-square-as-unit-length',
  oneAnchor: 'mc.transformations.transforms-one-anchor-sketches-rest',
  edgeDist: 'mc.transformations.reflection-distance-taken-from-figure-edge',
  asSlide: 'mc.transformations.reflection-as-slide',
  atVertex: 'mc.transformations.rotation-angle-measured-at-vertex',
  vertsDiffer: 'mc.transformations.translation-vertices-move-differently',
  bend: 'mc.transformations.segment-image-may-bend',
  unmatched: 'mc.transformations.verifies-lengths-of-noncorresponding-parts',
  sameMove: 'mc.transformations.equal-distance-means-same-displacement',
  armLength: 'mc.angles.angle-size-from-arm-length',
  supplement: 'mc.transformations.measures-change-when-figure-faces-another-way',
  parallel: 'mc.transformations.direction-change-destroys-parallelism',
  mixedSigns: 'mc.integers.add-magnitudes-mixed-signs',
  shiftWrong: 'mc.transformations.translation-shift-to-wrong-coordinate',
  negNamed: 'mc.transformations.reflect-negates-named-coordinate',
  axisRule: 'mc.transformations.axis-rule-for-other-lines-or-centers',
  opposite: 'mc.transformations.opposite-turn-directions-never-match',
  swap: 'mc.transformations.coordinate-swap-as-motion-rule',
  fullTurn: 'mc.transformations.full-turn-changes-position',
  remeasure: 'mc.transformations.rigid-image-measures-require-new-measurement',
  partial: 'mc.transformations.partial-measure-agreement-proves-rigid-mapping',
  sizeChange: 'mc.transformations.size-change-confused-with-rigid-motion',
  examples: 'mc.reasoning-language.examples-as-proof',
  primeLabels: 'mc.transformations.prime-labels-not-tied-to-correspondence',
} as const;

export type FamilyId = 'match' | 'nameT' | 'isMirror' | 'nameR' | 'order' | 'howMany' | 'slide' | 'flipGrid' | 'turnGrid'
  | 'flipDiag' | 'turnAngle' | 'whole' | 'straight' | 'keepLen' | 'keepAngle' | 'keepPar' | 'ruleT' | 'ruleAx' | 'ruleLine'
  | 'rule180' | 'rule90' | 'predict' | 'rigid' | 'proof';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'match', name: 'Match the corners' },
  { id: 'nameT', name: 'Is it a slide?' },
  { id: 'isMirror', name: 'Is it a reflection?' },
  { id: 'nameR', name: 'Name the rotation' },
  { id: 'order', name: 'Kept or reversed?' },
  { id: 'howMany', name: 'One motion or more?' },
  { id: 'slide', name: 'Slide on the grid' },
  { id: 'flipGrid', name: 'Reflect on the grid' },
  { id: 'turnGrid', name: 'Turn on the grid' },
  { id: 'flipDiag', name: 'Reflect across a slanted line' },
  { id: 'turnAngle', name: 'Turn by any angle' },
  { id: 'whole', name: 'Move every corner' },
  { id: 'straight', name: 'Lines stay lines' },
  { id: 'keepLen', name: 'Lengths are kept' },
  { id: 'keepAngle', name: 'Angles are kept' },
  { id: 'keepPar', name: 'Parallel stays parallel' },
  { id: 'ruleT', name: 'Translation rule' },
  { id: 'ruleAx', name: 'Reflect in an axis' },
  { id: 'ruleLine', name: 'Reflect in x = h or y = k' },
  { id: 'rule180', name: 'Half-turn rule' },
  { id: 'rule90', name: 'Quarter-turn rule' },
  { id: 'predict', name: 'Find it without measuring' },
  { id: 'rigid', name: 'Rigid or not?' },
  { id: 'proof', name: 'Examples or proof?' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

/** what the page draws for an item: a MotionGrid picture; `hide` = progress keys that appear only after a miss */
/** ring: a point circled after a miss (the right candidate); angles: angle marks shown with the picture */
export type Pic = { grid: GridPic; hide?: string[]; order?: number[]; ring?: V; angles?: { fig: number; i: number }[] };
export interface MotionItem extends Item {
  family: FamilyId;
  picture?: Pic;
  /** TeX written on the board after a miss */
  work?: string;
}
type Gen = (R: () => number, n: number, sg?: string) => MotionItem;

// ---------- small helpers ----------
const LETTERS = [['A', 'B', 'C'], ['D', 'E', 'F'], ['P', 'Q', 'R'], ['J', 'K', 'L']] as const;
/** the name of a turn center: O at the origin, a vertex's own letter on that vertex, else P (C when the figure has a P) */
function pinName(c: V, L: readonly string[], P: readonly V[]): string {
  if (eqV(c, ORIGIN)) return 'O';
  const k = P.findIndex(p => eqV(p, c));
  return k >= 0 && L[k] ? L[k]! : L.includes('P') ? 'C' : 'P';
}
const pr = (s: string) => `${s}′`;
const A = (s: string | number) => `<b class="a">${s}</b>`;
const B = (s: string | number) => `<b class="b">${s}</b>`;
const S = (s: string | number) => `<b class="s">${s}</b>`;
const T = (s: string) => `\\text{${s}}`;
const LIM = 7;
const inLim = (P: readonly V[], lim = LIM) => P.every(p => Math.abs(p[0]) <= lim && Math.abs(p[1]) <= lim);
const isInt = (p: V) => Number.isInteger(p[0]) && Number.isInteger(p[1]);
const pickN = <X>(R: () => number, xs: readonly X[], n: number): X[] => shuffle(R, [...xs]).slice(0, n);
const sides = (P: readonly V[]) => P.map((p, i) => dist(p, P[(i + 1) % P.length]!));

/** a scalene triangle with integer corners in the box: fat (angles >= 28°), sides >= 2 */
function triangle(R: () => number, x0: number, x1: number, y0: number, y1: number): V[] {
  for (let t = 0; t < 500; t++) {
    const P: V[] = [[int(R, x0, x1), int(R, y0, y1)], [int(R, x0, x1), int(R, y0, y1)], [int(R, x0, x1), int(R, y0, y1)]];
    if (Math.abs(area2(P)) < 7) continue;
    const s = sides(P);
    if (Math.min(...s) < 2) continue;
    if (Math.abs(s[0]! - s[1]!) < 0.4 || Math.abs(s[1]! - s[2]!) < 0.4 || Math.abs(s[0]! - s[2]!) < 0.4) continue;
    if ([0, 1, 2].some(i => angleAt(P, i) < 28)) continue;
    return P;
  }
  return [[x0, y0], [x0 + 3, y0], [x0, y0 + 2]];
}
/** a picture that reads: a mirror does not cut through the preimage, and the image is not piled onto it */
function apart(m: Motion, P: readonly V[], Q: readonly V[]): boolean {
  if (m.kind === 'M') {
    const s = P.map(p => Math.sign((m.q[0] - m.p[0]) * (p[1] - m.p[1]) - (m.q[1] - m.p[1]) * (p[0] - m.p[0])));
    if (s.some(x => x > 0) && s.some(x => x < 0)) return false;
  }
  const c = (X: readonly V[]): V => [X.reduce((a, p) => a + p[0], 0) / X.length, X.reduce((a, p) => a + p[1], 0) / X.length];
  return dist(c(P), c(Q)) >= 2.5;
}
/** retry a builder until it returns a value (deterministic for a seed) */
function retry<X>(R: () => number, f: () => X | null, what: string): X {
  for (let i = 0; i < 400; i++) { const v = f(); if (v !== null) return v; }
  throw new Error(`${what}: no valid case found`);
}

// ---------- checking ----------
interface Opt { t: string; ok: boolean; mc?: string; say: string }
function choiceItem(R: () => number, base: Omit<MotionItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[]): MotionItem {
  const O = shuffle(R, [...opts]);
  if (new Set(O.map(o => o.t)).size !== O.length) throw new Error(`choices not unique: ${O.map(o => o.t).join(' | ')}`);
  return {
    ...base, input: 'choice', choices: O.map(o => o.t), answer: { kind: 'choice', i: O.findIndex(o => o.ok) }, solution: endOnChoice(base.solution, O.find(o => o.ok)!.t),
    check: (r: Response): Verdict => { const o = r.kind === 'choice' ? O[r.i] : undefined; return o ? { ok: o.ok, mc: o.mc, say: o.say } : { ok: false, say: 'Pick one.' }; },
  };
}
interface PWrong { v: V; mc?: string; say: string }
/** a coordinate answer: right, or a recognised wrong point (its misconception), or a plain miss */
function pairItem(base: Omit<MotionItem, 'input' | 'answer' | 'check'>, ans: V, okSay: string, wrongs: PWrong[], missSay: string): MotionItem {
  const W = wrongs.filter((w, i) => !eqV(w.v, ans) && wrongs.findIndex(x => eqV(x.v, w.v)) === i);
  return {
    ...base, input: 'pair', answer: { kind: 'pair', x: ans[0], y: ans[1] },
    check: (r: Response): Verdict => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type both coordinates.' };
      const v: V = [r.x, r.y];
      if (eqV(v, ans, 1e-6)) return { ok: true, say: okSay };
      const w = W.find(x => eqV(x.v, v, 1e-6));
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: missSay };
    },
  };
}
interface NWrong { v: number; mc?: string; say: string }
function numItem(base: Omit<MotionItem, 'input' | 'answer' | 'check'>, ans: number, okSay: string, wrongs: NWrong[], missSay: string): MotionItem {
  const W = wrongs.filter(w => Math.abs(w.v - ans) > 1e-9);
  return {
    ...base, input: 'num', answer: { kind: 'num', v: ans },
    check: (r: Response): Verdict => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (Math.abs(r.v - ans) < 1e-6) return { ok: true, say: okSay };
      const w = W.find(x => Math.abs(x.v - r.v) < 1e-6);
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: missSay };
    },
  };
}

// ---------- motions the grid can show ----------
const ORIGIN: V = [0, 0];
function mirrorAxisParallel(R: () => number, lo = -3, hi = 3): { m: Motion; name: string } {
  const v = R() < 0.5, h = int(R, lo, hi);
  const m: Motion = v ? { kind: 'M', p: [h, 0], q: [h, 1] } : { kind: 'M', p: [0, h], q: [1, h] };
  return { m, name: lineName(m.p, m.q) };
}
function mirrorDiag(R: () => number): { m: Motion; name: string; s: 1 | -1; c: number } {
  const s = R() < 0.5 ? 1 : -1, c = int(R, -2, 2);
  const m: Motion = { kind: 'M', p: [0, c], q: [1, c + s] };
  return { m, name: lineName(m.p, m.q), s, c };
}
const quarter = (R: () => number) => pick(R, [90, -90, 180] as const);
const turnWords = (deg: number) => (Math.abs(deg) === 180 ? '180°' : `${Math.abs(deg)}° ${deg > 0 ? 'counterclockwise' : 'clockwise'}`);
/** a figure in amber with letters */
const pre = (pts: readonly V[], names: readonly string[], open = false): FigSpec => ({ pts, names, role: 'first', open });
const img = (pts: readonly V[], names: readonly (string | null)[], open = false): FigSpec => ({ pts, names, role: 'link', open });
const motionMarks = (m: Motion, centerName = 'P'): Partial<GridPic> => {
  if (m.kind === 'M') return { mirror: { p: m.p, q: m.q, name: lineName(m.p, m.q).replace('the ', '') } };
  if (m.kind === 'R') return { center: { p: m.c, name: eqV(m.c, ORIGIN) ? 'O' : centerName } };
  return {};
};
/** the marks of a motion on a figure lettered L: a turn center gets its own name (pinName), unnamed on a vertex */
const marksFor = (m: Motion, L: readonly string[], P: readonly V[]): Partial<GridPic> =>
  (m.kind === 'R' && P.some(p => eqV(p, m.c)) ? { center: { p: m.c } } : motionMarks(m, m.kind === 'R' ? pinName(m.c, L, P) : 'P'));
const centerOf = (m: Motion, L: readonly string[], P: readonly V[]) => (m.kind === 'R' ? pinName(m.c, L, P) : 'P');
const motionTex = (m: Motion, centerName = 'P'): string => {
  if (m.kind === 'T') return T(`translate ${slideWords(m.a, m.b)}`);
  if (m.kind === 'M') return `${T('reflect across ')}${lineTex(m)}`;
  if (m.kind === 'R') return `${T(`turn ${turnWords(m.deg).replace('counterclockwise', 'ccw').replace('clockwise', 'cw')} about `)}${eqV(m.c, ORIGIN) ? 'O' : `${centerName}${ptTex(m.c)}`}`;
  return T('stretch');
};
function lineTex(m: Extract<Motion, { kind: 'M' }>): string {
  const n = lineName(m.p, m.q);
  if (n === 'the x-axis') return T('the ') + 'x' + T('-axis');
  if (n === 'the y-axis') return T('the ') + 'y' + T('-axis');
  return n.replace(/−/g, '-');
}
const wordsOf = (m: Motion, centerName = 'P') => describe(m, centerName).replace(/^an? /, '');

// =====================================================================================================================
// 1 correspondence: which corner of the image is A′?
const match: Gen = R => retry(R, () => {
  const L = pick(R, LETTERS);
  const P = triangle(R, -6, 6, -6, 6);
  const kind = pick(R, ['M', 'R'] as const);
  const m: Motion = kind === 'M' ? mirrorAxisParallel(R, -2, 2).m : { kind: 'R', c: ORIGIN, deg: quarter(R) };
  const Q = applyAll(m, P);
  if (!inLim([...P, ...Q]) || !apart(m, P, Q)) return null;
  const order = shuffle(R, [0, 1, 2]);                       // corner numbers on the image: number k sits at Q[order[k]]
  const ask = int(R, 0, 2);
  const right = order.indexOf(ask);
  // the page-position mistake: the image corner with the same left-to-right rank (else top-to-bottom)
  const rank = (X: readonly V[], i: number, ax: 0 | 1) => [...X].map((p, j) => [p[ax], j] as const).sort((a, b) => a[0] - b[0] || a[1] - b[1]).findIndex(e => e[1] === i);
  let posJ = -1;
  for (const ax of [0, 1] as const) {
    const r = rank(P, ask, ax);
    const j = [0, 1, 2].find(q => rank(Q, q, ax) === r)!;
    if (j !== ask && new Set(P.map(p => p[ax])).size === 3 && new Set(Q.map(p => p[ax])).size === 3) { posJ = j; break; }
  }
  if (posJ < 0) return null;
  const pos = order.indexOf(posJ);
  const other = [0, 1, 2].find(k => k !== right && k !== pos)!;
  const nameAt: (string | null)[] = [null, null, null];
  order.forEach((qi, k) => { nameAt[qi] = String(k + 1); });
  const fig = img(Q, nameAt);
  const what = m.kind === 'M' ? `reflected across ${lineName(m.p, m.q)}` : `turned ${turnWords(m.kind === 'R' ? m.deg : 0)} about the origin`;
  return choiceItem(R, {
    id: `match-${L[ask]}-${P.flat().join('')}`, family: 'match',
    prompt: `Triangle ${A(L.join(''))} is ${B(what)}. The corners of the image are numbered. Which corner is ${S(pr(L[ask]!))}, the image of ${A(L[ask]!)}?`,
    board: `\\triangle ${L.join('')} \\to \\triangle ${L.map(x => x + "'").join('')}`,
    picture: { grid: { figs: [pre(P, L), { ...fig, role: 'pick' }], ...motionMarks(m), ghost: { fig: 0, m } }, hide: ['ghost', 'move'] },
    work: `${L[ask]} \\to \\text{corner } ${right + 1}`,
    solution: [`Follow ${L[ask]} itself through the move: ${wordsOf(m, 'P')}.`, `${L[ask]} lands on corner ${right + 1}, so corner ${right + 1} is ${pr(L[ask]!)}.`, 'Match points by the move, never by where they sit on the page.'],
  }, [
    { t: `Corner ${right + 1}`, ok: true, say: `Right: ${L[ask]} lands on corner ${right + 1}.` },
    { t: `Corner ${pos + 1}`, ok: false, mc: MC.position, say: `Corner ${pos + 1} sits in the same spot on the page as ${L[ask]} does in its triangle, but the move carries ${L[ask]} to corner ${right + 1}.` },
    { t: `Corner ${other + 1}`, ok: false, say: `Follow ${L[ask]} through the move: it lands on corner ${right + 1}.` },
  ]);
}, 'match');

// 2 recog-translation: the same displacement for every point
const nameT: Gen = R => retry(R, () => {
  const L = pick(R, LETTERS);
  const P = triangle(R, -6, 6, -6, 6);
  const rotCase = R() < 0.3;
  const links = (Q: readonly V[]) => P.map((p, i) => ({ a: p, b: Q[i]! }));
  if (rotCase) {
    const m: Motion = { kind: 'R', c: [int(R, -2, 2), int(R, -2, 2)], deg: pick(R, [90, -90, 180]) };
    const Q = applyAll(m, P);
    if (!inLim([...P, ...Q])) return null;
    const d = sub(Q[0]!, P[0]!);
    return choiceItem(R, {
      id: `nameT-r-${P.flat().join('')}-${m.deg}`, family: 'nameT',
      prompt: `Is the move from ${A(L.join(''))} to ${S(L.map(pr).join(''))} a translation? The dashed segments join each point to its image.`,
      board: `${L[0]} \\to ${L[0]}',\\ ${L[1]} \\to ${L[1]}',\\ ${L[2]} \\to ${L[2]}'`,
      picture: { grid: { figs: [pre(P, L), img(Q, L.map(pr))], links: links(Q) } },
      solution: ['In a translation every point moves the same distance in the same direction.', `Here the dashed segments point in different directions: the figure turned.`, `It is ${describe(m, centerOf(m, L, P))}.`],
    }, [
      { t: 'No: the points move in different directions', ok: true, say: 'Right: the dashed segments point different ways, so it is not a slide.' },
      { t: 'Yes: every point moved, so it is a translation', ok: false, mc: MC.anyMove, say: 'Every motion moves points. A translation moves every point the same way: these segments point in different directions.' },
      { t: `Yes: a translation ${slideWords(d[0], d[1])}`, ok: false, mc: MC.anyMove, say: `That slide fits ${L[0]} only. ${L[1]} and ${L[2]} move in other directions.` },
    ]);
  }
  const a = int(R, -5, 5), b = int(R, -5, 5);
  if (a === 0 && b === 0) return null;
  const m: Motion = { kind: 'T', a, b };
  const Q = applyAll(m, P);
  if (!inLim([...P, ...Q])) return null;
  const wX = Math.max(...P.map(p => p[0])) - Math.min(...P.map(p => p[0])), wY = Math.max(...P.map(p => p[1])) - Math.min(...P.map(p => p[1]));
  const opts: Opt[] = [{ t: `A translation ${slideWords(a, b)}`, ok: true, say: `Right: every point moves ${slideWords(a, b)}.` }];
  if (Math.abs(a) > wX && b === 0) opts.push({ t: `A translation ${slideWords(Math.sign(a) * (Math.abs(a) - wX), 0)}`, ok: false, mc: MC.gap, say: `That is the gap between the triangles. Measure from a point to its own image: ${L[0]} to ${pr(L[0])} is ${Math.abs(a)}.` });
  else if (Math.abs(b) > wY && a === 0) opts.push({ t: `A translation ${slideWords(0, Math.sign(b) * (Math.abs(b) - wY))}`, ok: false, mc: MC.gap, say: `That is the gap between the triangles. Measure from a point to its own image: ${L[0]} to ${pr(L[0])} is ${Math.abs(b)}.` });
  else if (Math.abs(a) > wX) opts.push({ t: `A translation ${slideWords(Math.sign(a) * (Math.abs(a) - wX), b)}`, ok: false, mc: MC.gap, say: `The across part is the gap between the triangles. Count from ${L[0]} to ${pr(L[0])}: ${slideWords(a, b)}.` });
  if (opts.length < 2 && a !== b && a !== 0 && b !== 0) opts.push({ t: `A translation ${slideWords(b, a)}`, ok: false, say: `Count across first, then up or down: ${L[0]} to ${pr(L[0])} is ${slideWords(a, b)}.` });
  if (opts.length < 2) opts.push({ t: `A translation ${slideWords(-a, -b)}`, ok: false, say: `That is the way back. From ${L[0]} to ${pr(L[0])} is ${slideWords(a, b)}.` });
  opts.push({ t: 'Not a translation: the figure turned', ok: false, mc: undefined, say: 'The dashed segments are all parallel and the same length: one slide for every point.' });
  return choiceItem(R, {
    id: `nameT-${P.flat().join('')}-${a}-${b}`, family: 'nameT',
    prompt: `Which motion maps ${A(L.join(''))} onto ${S(L.map(pr).join(''))}? The dashed segments join each point to its image.`,
    board: `${L[0]}${ptTex(P[0]!)} \\to ${L[0]}'${ptTex(Q[0]!)}`,
    picture: { grid: { figs: [pre(P, L), img(Q, L.map(pr))], links: links(Q), arrow: { from: P[0]!, to: Q[0]! } }, hide: ['arrow'] },
    work: T(`slide ${slideWords(a, b)}`),
    solution: [`Measure from one point to its own image: ${L[0]}${pt(P[0]!)} to ${pr(L[0])}${pt(Q[0]!)}.`, `That is ${slideWords(a, b)}, and every other point moves the same.`],
  }, opts);
}, 'nameT');

// 3 recog-reflection: fixed on the line, perpendicular bisector for the rest
const isMirror: Gen = R => retry(R, () => {
  const L = pick(R, LETTERS);
  const diag = R() < 0.45;
  const mm = diag ? mirrorDiag(R) : mirrorAxisParallel(R, -2, 2);
  const m = mm.m as Extract<Motion, { kind: 'M' }>;
  const P = triangle(R, -6, 6, -6, 6);
  // the triangle on one side (or touching the line)
  const side = (p: V) => Math.sign((m.q[0] - m.p[0]) * (p[1] - m.p[1]) - (m.q[1] - m.p[1]) * (p[0] - m.p[0]));
  const ss = P.map(side);
  if (ss.some(s => s > 0) && ss.some(s => s < 0)) return null;
  const kind = pick(R, diag ? ['true', 'glide', 'slant'] as const : ['true', 'glide'] as const);
  const dir = sub(m.q, m.p);
  let Q = applyAll(m, P);
  if (kind === 'glide') { const s = pick(R, [-2, -1, 1, 2]); Q = Q.map(q => add(q, [dir[0] * s, dir[1] * s])); }
  if (kind === 'slant') {
    // the horizontal-doubling mistake: across the line along a horizontal, not a perpendicular
    const s = (m.q[1] - m.p[1]) / (m.q[0] - m.p[0]), c = m.p[1] - s * m.p[0];
    Q = P.map(p => [clean(2 * ((p[1] - c) / s) - p[0]), p[1]] as V);
  }
  if (!inLim([...P, ...Q]) || P.some((p, i) => eqV(p, Q[i]!)) && kind !== 'true') return null;
  if (kind === 'true' && P.every((p, i) => eqV(p, Q[i]!))) return null;
  const base = {
    id: `isMirror-${kind}-${P.flat().join('')}-${mm.name}`, family: 'isMirror' as const,
    prompt: `Is ${S(L.map(pr).join(''))} the reflection of ${A(L.join(''))} across line ${B('m')}? The dashed segments join each point to its image.`,
    board: `${T('line ')}m: ${mm.name.replace('the ', '').replace(/−/g, '-')}`,
    picture: { grid: { figs: [pre(P, L), img(Q, L.map(pr))], mirror: { p: m.p, q: m.q, name: 'm' }, links: P.map((p, i) => ({ a: p, b: Q[i]! })) } } as Pic,
  };
  const yes = 'Yes: each segment is cut in half by m, at a right angle';
  const noSlid = 'No: the image is the right distance from m, but slid along it';
  const noPerp = 'No: the dashed segments do not cross m at a right angle';
  if (kind === 'true') return choiceItem(R, { ...base, solution: ['For a reflection, m must cut every segment from a point to its image in half, at a right angle.', 'Here it does, for every point.'] }, [
    { t: yes, ok: true, say: 'Right: both conditions hold for every point.' },
    { t: noSlid, ok: false, say: `Each image sits straight across m from its point: ${L[0]} and ${pr(L[0])} are mirror partners.` },
    { t: 'No: a reflection would be a slide across m', ok: false, mc: MC.asSlide, say: 'A reflection flips the figure over m; it does not slide it. This image is flipped, point by point.' },
  ]);
  if (kind === 'glide') return choiceItem(R, { ...base, solution: ['Equal distances from m are not enough: m must also cut each segment in half at a right angle.', 'Here the image is shifted along m, so the segments cross m at a slant.', 'It is not one reflection.'] }, [
    { t: noSlid, ok: true, say: 'Right: equal distances, but shifted along m, so not a reflection.' },
    { t: 'Yes: every point is as far from m as its image', ok: false, mc: MC.oneCond, say: 'Equal distances are only half of it. The segment from a point to its image must also cross m at a right angle, and here the image is slid along m.' },
    { t: yes, ok: false, mc: MC.oneCond, say: 'Look at a dashed segment: it crosses m at a slant, not at a right angle. The image is slid along m.' },
  ]);
  return choiceItem(R, { ...base, solution: ['For a reflection the segment from a point to its image must cross m at a right angle.', 'Here the segments run straight across (horizontal), and m is slanted: not a right angle.', 'This is not the reflection across m.'] }, [
    { t: noPerp, ok: true, say: 'Right: the segments are horizontal, so they do not cross the slanted line at a right angle.' },
    { t: 'Yes: each point is as far across m as its image', ok: false, mc: MC.notPerp, say: 'Across a slanted line you measure along the perpendicular, not straight across. These segments are horizontal.' },
    { t: yes, ok: false, mc: MC.notPerp, say: 'Check the angle: the dashed segments are horizontal and m is slanted, so they do not meet at a right angle.' },
  ]);
}, 'isMirror');

// 4 recog-rotation: center, angle, direction
const nameR: Gen = R => retry(R, () => {
  const L = pick(R, LETTERS);
  const P = triangle(R, -5, 5, -5, 5);
  const where = pick(R, ['origin', 'vertex', 'inside', 'outside'] as const);
  const c: V = where === 'origin' ? ORIGIN : where === 'vertex' ? P[int(R, 0, 2)]! : where === 'inside' ? [Math.round((P[0]![0] + P[1]![0] + P[2]![0]) / 3), Math.round((P[0]![1] + P[1]![1] + P[2]![1]) / 3)] : [int(R, -4, 4), int(R, -4, 4)];
  const deg = quarter(R);
  const m: Motion = { kind: 'R', c, deg };
  const Q = applyAll(m, P);
  if (!inLim([...P, ...Q]) || eqV(c, ORIGIN) && where !== 'origin') return null;
  const cn = pinName(c, L, P);
  const fv = L[P.findIndex(p => !eqV(p, c))]!;   // a corner that moves
  const opts: Opt[] = [{ t: `${turnWords(deg)} about ${cn}`, ok: true, say: `Right: ${turnWords(deg)} about ${cn}.` }];
  if (deg !== 180) opts.push({ t: `${turnWords(-deg)} about ${cn}`, ok: false, mc: MC.reverse, say: `Follow ${fv} to ${pr(fv)}: it turns ${deg > 0 ? 'counterclockwise' : 'clockwise'}, the other way.` });
  else opts.push({ t: `90° clockwise about ${cn}`, ok: false, say: `${fv} and ${pr(fv)} are on opposite sides of ${cn}: that is a half turn, 180°.` });
  if (cn !== 'O') opts.push({ t: `${turnWords(deg)} about the origin`, ok: false, mc: MC.wrongCenter, say: `The point that stays put is ${cn}, not the origin. The turn is about ${cn}.` });
  else {
    const v = [0, 1, 2].find(i => !eqV(P[i]!, c))!;
    opts.push({ t: `${turnWords(deg)} about ${L[v]}`, ok: false, mc: MC.wrongCenter, say: `${L[v]} moves, so it cannot be the center. The fixed point is O.` });
  }
  return choiceItem(R, {
    id: `nameR-${where}-${P.flat().join('')}-${deg}`, family: 'nameR',
    prompt: `${A(L.join(''))} is rotated onto ${S(L.map(pr).join(''))}. ${B(cn)} is the center. Name the rotation.`,
    board: `${T('center ')}${cn}${ptTex(c)}`,
    picture: { grid: { figs: [pre(P, L), img(Q, L.map(pr))], center: { p: c, name: cn }, turn: { c, from: P.find(p => !eqV(p, c))!, deg }, ghost: { fig: 0, m } }, hide: ['turn', 'ghost', 'move'] },
    work: `${T(turnWords(deg).replace('counterclockwise', 'ccw').replace('clockwise', 'cw') + ' about ')}${cn}`,
    solution: [`The center ${cn} stays fixed; every other point keeps its distance to ${cn}.`, `Follow ${fv}: it turns ${deg === 180 ? 'to the opposite side of ' + cn + ', 180°' : `a quarter turn ${deg > 0 ? 'counterclockwise' : 'clockwise'}`}.`],
  }, opts);
}, 'nameR');

// 5 orientation-test: vertex order kept or reversed, then confirm
const order: Gen = R => retry(R, () => {
  const L = pick(R, LETTERS);
  const P = triangle(R, -5, 5, -5, 5);
  const look = R() < 0.5;                 // the 180° / horizontal-mirror look-alike pair
  const isRot = R() < 0.5;
  const k = int(R, -2, 2);
  const m: Motion = isRot ? { kind: 'R', c: [int(R, -2, 2), int(R, -2, 2)], deg: look ? 180 : pick(R, [90, -90]) }
    : look ? { kind: 'M', p: [0, k], q: [1, k] } : mirrorAxisParallel(R, -2, 2).m;
  const Q = applyAll(m, P);
  if (!inLim([...P, ...Q]) || !apart(m, P, Q) || P.some((p, i) => eqV(p, Q[i]!))) return null;
  const okRot = 'A rotation: the order is kept, and the figure has turned';
  const okRef = 'A reflection: the order is reversed';
  const opts: Opt[] = isRot ? [
    { t: okRot, ok: true, say: `Right: ${L.join(' → ')} goes the same way round in both, and the figure turned.` },
    { t: 'A reflection: it looks upside down', ok: false, mc: MC.rotRefl, say: `Upside down is not a test. Go round ${L.join(' → ')} and round ${L.map(pr).join(' → ')}: the same way, so it is not a flip.` },
    { t: 'A translation: the order is kept', ok: false, mc: MC.orientTrans, say: 'A kept order rules out a flip, but a turn keeps it too. The figure points a new way, so it turned.' },
  ] : [
    { t: okRef, ok: true, say: `Right: ${L.join(' → ')} and ${L.map(pr).join(' → ')} go round opposite ways.` },
    { t: 'A rotation: it looks turned around', ok: false, mc: MC.rotRefl, say: `A turn keeps the order. ${L.join(' → ')} goes one way, ${L.map(pr).join(' → ')} the other: a flip.` },
    { t: 'A translation: every point moved', ok: false, mc: MC.anyMove, say: 'A slide keeps the order, and here it is reversed. It is a flip.' },
  ];
  return choiceItem(R, {
    id: `order-${isRot}-${look}-${P.flat().join('')}`, family: 'order',
    prompt: `Go round ${A(L.join(' → '))} and round ${S(L.map(pr).join(' → '))}. Which single motion maps one onto the other?`,
    board: `${L.join('')} \\to ${L.map(x => x + "'").join('')}`,
    picture: { grid: { figs: [pre(P, L), img(Q, L.map(pr))], ...marksFor(m, L, P), ghost: { fig: 0, m } }, hide: ['mirror', 'center', 'ghost', 'move'], order: [0, 1] },
    work: isRot ? T('order kept: a turn') : T('order reversed: a flip'),
    solution: [`${L.join(' → ')} goes ${orient(P) > 0 ? 'counterclockwise' : 'clockwise'}; ${L.map(pr).join(' → ')} goes ${orient(Q) > 0 ? 'counterclockwise' : 'clockwise'}.`,
      isRot ? 'Kept order: a slide or a turn. The figure points a new way, so it is a turn.' : 'Reversed order: only a reflection does that.', `It is ${describe(m, centerOf(m, L, P))}.`],
  }, opts);
}, 'order');

// 6 nonuniqueness: a symmetric unlabeled figure can be carried by more than one motion
const howMany: Gen = R => retry(R, () => {
  const sq = R() < 0.5;
  const x0 = int(R, -6, -3), y0 = int(R, -3, 1), w = sq ? int(R, 2, 3) : 2 * int(R, 1, 2), hgt = sq ? w : int(R, 2, 4);
  const P: V[] = sq ? [[x0, y0], [x0 + w, y0], [x0 + w, y0 + w], [x0, y0 + w]] : [[x0, y0], [x0 + w, y0], [x0 + w / 2, y0 + hgt]];
  const h = x0 + w + int(R, 1, 2);
  const m: Motion = { kind: 'M', p: [h, 0], q: [h, 1] };
  const Q = applyAll(m, P);
  const d = 2 * (h - (x0 + w / 2));
  if (!inLim([...P, ...Q])) return null;
  const shape = sq ? 'square' : 'isosceles triangle';
  const labeled = R() < 0.5;
  const L = sq ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C'];
  if (!labeled) return choiceItem(R, {
    id: `howMany-u-${sq}-${x0}-${y0}-${w}-${h}`, family: 'howMany',
    prompt: `An unlabeled ${shape} is mapped onto the lime copy. Which statement is true?`,
    board: T('no letters on the corners'),
    picture: { grid: { figs: [{ pts: P, role: 'first' }, { pts: Q, role: 'link' }], mirror: { p: m.p, q: m.q, name: lineName(m.p, m.q) }, ghost: { fig: 0, m: { kind: 'T', a: d, b: 0 } } }, hide: ['ghost', 'move'] },
    work: T(`flip, or slide ${d} right`),
    solution: [`The reflection across ${lineName(m.p, m.q)} lands the ${shape} on the copy.`, `So does a translation ${d} right: without letters, the outlines match either way.`, 'With no labels, more than one motion can do the job.'],
  }, [
    { t: `Both the reflection across ${lineName(m.p, m.q)} and a slide ${d} right work`, ok: true, say: 'Right: without letters the outline lands on the copy either way.' },
    { t: 'Only one motion can map it onto the copy', ok: false, mc: MC.oneMotion, say: `Try the slide ${d} right: the outline lands exactly on the copy too. Without letters, both moves work.` },
    { t: 'Only a slide works: a reflection would flip it', ok: false, say: `It is symmetric, so the flipped ${shape} looks the same. The reflection works too.` },
  ]);
  const QL = Q;
  // which image label sits where the slide takes A
  const slid = add(P[0]!, [d, 0]);
  const j = QL.findIndex(q => eqV(q, slid));
  if (j <= 0) return null;
  return choiceItem(R, {
    id: `howMany-l-${sq}-${x0}-${y0}-${w}-${h}`, family: 'howMany',
    prompt: `${A(L.join(''))} is reflected across ${B(lineName(m.p, m.q))} onto ${S(L.map(pr).join(''))}. Does a slide ${d} right also map ${A(L.join(''))} onto ${S(L.map(pr).join(''))}, letters included?`,
    board: `${L[0]} \\to ${L[0]}' \\ ?`,
    picture: { grid: { figs: [pre(P, L), img(Q, L.map(pr))], mirror: { p: m.p, q: m.q, name: lineName(m.p, m.q) }, ghost: { fig: 0, m: { kind: 'T', a: d, b: 0 } } }, hide: ['ghost', 'move'] },
    work: `${T('slide: ')}${L[0]} \\to ${L[j]}'`,
    solution: [`Slide ${L[0]} ${d} right: it lands where ${pr(L[j]!)} is, not on ${pr(L[0]!)}.`, 'The outlines match, but the letters do not. With labels, only the reflection works.'],
  }, [
    { t: `No: the slide sends ${L[0]} to where ${pr(L[j]!)} is`, ok: true, say: `Right: the letters land on the wrong corners.` },
    { t: 'Yes: the outlines match exactly', ok: false, mc: MC.ignoreLabels, say: `Outlines are not enough once the corners have names. The slide takes ${L[0]} to ${pr(L[j]!)}'s spot.` },
    { t: 'No: a slide can never land on a reflected figure', ok: false, say: `It can when the figure is symmetric: the outline does land. Here it fails only because ${L[0]} goes to ${pr(L[j]!)}'s spot.` },
  ]);
}, 'howMany');

// 7 translate-grid: slide by a description or an arrow
const slide: Gen = R => retry(R, () => {
  if (R() < 0.25) {
    const n = int(R, 2, 5), sx = pick(R, [1, -1]), sy = pick(R, [1, -1]);
    const from: V = [int(R, -5, 5 - n), int(R, -5, 5 - n)];
    const fromA: V = [sx > 0 ? from[0] : from[0] + n, sy > 0 ? from[1] : from[1] + n];
    const to = add(fromA, [sx * n, sy * n]);
    const len = Math.round(n * Math.SQRT2 * 10) / 10;
    return choiceItem(R, {
      id: `slide-len-${n}-${sx}-${sy}-${from.join('')}`, family: 'slide',
      prompt: `This slide arrow goes ${B(slideWords(sx * n, sy * n))}. How long is the slide?`,
      board: `${T('arrow: ')}${T(slideWords(sx * n, sy * n))}`,
      picture: { grid: { figs: [], arrow: { from: fromA, to }, axes: false } },
      work: `\\sqrt{${n}^2 + ${n}^2} \\approx ${len}`,
      solution: [`Each diagonal of a square is longer than a side: about 1.414 units.`, `${n} diagonals ≈ ${n} × 1.414 ≈ ${len} units (to the nearest tenth).`],
    }, [
      { t: `About ${len} units`, ok: true, say: `Right: ${n} square diagonals, each about 1.4 units.` },
      { t: `${n} units: it crosses ${n} squares`, ok: false, mc: MC.diagUnit, say: `A diagonal of a square is longer than its side (about 1.4). ${n} diagonals are about ${len} units.` },
      { t: `${2 * n} units: ${n} across plus ${n} ${sy > 0 ? 'up' : 'down'}`, ok: false, say: `That is the path along the grid lines. The arrow cuts straight across: about ${len} units.` },
    ]);
  }
  const a = int(R, -5, 5), b = int(R, -5, 5);
  if (a === 0 && b === 0) return null;
  const L = pick(R, LETTERS);
  const seg = R() < 0.5;
  const P = seg ? [[int(R, -5, 5), int(R, -5, 5)], [int(R, -5, 5), int(R, -5, 5)]] as V[] : [[int(R, -5, 5), int(R, -5, 5)]] as V[];
  if (seg && dist(P[0]!, P[1]!) < 2) return null;
  const Q = applyAll({ kind: 'T', a, b }, P);
  const from: V = [int(R, -6, 6), int(R, -6, 6)], to = add(from, [a, b]);
  if (!inLim([...P, ...Q, from, to])) return null;
  const ask = seg ? 1 : 0;
  const pa = P[ask]!, ans = Q[ask]!;
  return pairItem({
    id: `slide-${a}-${b}-${P.flat().join('')}`, family: 'slide',
    prompt: seg ? `Slide segment ${A(L[0] + L[1])} along the teal arrow. ${S(pr(L[0]))} is drawn. Where does ${S(pr(L[1]))} land?` : `Slide point ${A(L[0])} along the teal arrow. Where does ${S(pr(L[0]))} land?`,
    board: `${L[ask]}${ptTex(pa)} \\to ${L[ask]}'(?,\\ ?)`,
    pairLead: `${pr(L[ask]!)} = (`, pairOp: ',',
    picture: {
      grid: { figs: [pre(P, seg ? [L[0]!, L[1]!] : [L[0]!], seg), img(Q, seg ? [null, pr(L[1]!)] : [pr(L[0]!)], seg), ...(seg ? [img([Q[0]!], [pr(L[0]!)])] : [])], arrow: { from, to }, ghost: { fig: 0, m: { kind: 'T', a, b } } },
      hide: ['f1', 'n1', 'ghost', 'move'],
    },
    work: `${L[ask]}' = ${ptTex(ans)}`,
    solution: [`The arrow goes ${slideWords(a, b)}.`, `Move ${L[ask]}${pt(pa)} the same way: ${pr(L[ask]!)}${pt(ans)}.`],
  }, ans, `Right: ${slideWords(a, b)} lands on ${pt(ans)}.`, [
    { v: [pa[0] + b, pa[1] + a], say: `Count across with the arrow's across part (${slideWords(a, 0)}) and up or down with its other part.` },
    { v: [pa[0] - a, pa[1] - b], say: 'That is the way back. Follow the arrow from its tail to its tip.' },
    { v: pa, say: `${L[ask]} has to move: every point slides ${slideWords(a, b)}.` },
  ], `Count the arrow: ${slideWords(a, b)}. Move ${L[ask]} the same way.`);
}, 'slide');

// 8 reflect-grid-line: across x = h or y = k by perpendicular counting
const flipGrid: Gen = R => retry(R, () => {
  const L = pick(R, LETTERS);
  const { m, name } = mirrorAxisParallel(R, -3, 3);
  const mm = m as Extract<Motion, { kind: 'M' }>;
  const vert = mm.p[0] === mm.q[0];
  const P: V[] = [[int(R, -6, 6), int(R, -6, 6)], [int(R, -6, 6), int(R, -6, 6)]];
  const dOf = (p: V) => (vert ? p[0] - mm.p[0] : p[1] - mm.p[1]);
  if (dist(P[0]!, P[1]!) < 2 || dOf(P[0]!) === 0 || dOf(P[0]!) === dOf(P[1]!)) return null;
  const Q = applyAll(m, P);
  if (!inLim([...P, ...Q])) return null;
  const ans = Q[1]!;
  const edge = add(P[1]!, sub(Q[0]!, P[0]!));
  return pairItem({
    id: `flipGrid-${name}-${P.flat().join('')}`, family: 'flipGrid',
    prompt: `Reflect segment ${A(L[0] + L[1])} across ${B(name)}. ${S(pr(L[0]))} is drawn. Where does ${S(pr(L[1]))} land?`,
    board: `${L[1]}${ptTex(P[1]!)} \\to ${L[1]}'(?,\\ ?)`,
    pairLead: `${pr(L[1]!)} = (`, pairOp: ',',
    picture: { grid: { figs: [pre(P, [L[0]!, L[1]!], true), img(Q, [null, pr(L[1]!)], true), img([Q[0]!], [pr(L[0]!)])], mirror: { p: mm.p, q: mm.q, name: name.replace('the ', '') }, links: [{ a: P[1]!, b: Q[1]! }], ghost: { fig: 0, m } }, hide: ['f1', 'n1', 'l0', 'ghost', 'move'] },
    work: `${L[1]}' = ${ptTex(ans)}`,
    solution: [`${L[1]} is ${Math.abs(dOf(P[1]!))} ${Math.abs(dOf(P[1]!)) === 1 ? 'unit' : 'units'} from ${name}${dOf(P[1]!) === 0 ? ' (on the line, so it stays put)' : ''}.`, `Go straight across ${name} (at a right angle) the same distance on the other side: ${pr(L[1]!)}${pt(ans)}.`],
  }, ans, `Right: as far past ${name} as ${L[1]} was before it.`, [
    { v: edge, mc: MC.edgeDist, say: `That moves ${L[1]} as far as ${L[0]} moved. Each point uses its own distance to the line: ${L[1]} is ${Math.abs(dOf(P[1]!))} away.` },
    { v: vert ? [-P[1]![0], P[1]![1]] : [P[1]![0], -P[1]![1]], mc: MC.axisRule, say: `That reflects across the ${vert ? 'y' : 'x'}-axis. The mirror is ${name}: count from it.` },
    { v: vert ? [P[1]![0], 2 * mm.p[1] - P[1]![1]] : [2 * mm.p[0] - P[1]![0], P[1]![1]], say: `Across ${name} only the ${vert ? 'x' : 'y'}-coordinate changes.` },
  ], `Count from ${L[1]} straight to ${name}, then the same distance past it.`);
}, 'flipGrid');

// 9 rotate-tracing: 90 or 180 degrees about the origin, a vertex, or another grid point
const turnGrid: Gen = R => retry(R, () => {
  const L = pick(R, LETTERS);
  const seg = R() < 0.6;
  const P: V[] = seg ? [[int(R, -5, 5), int(R, -5, 5)], [int(R, -5, 5), int(R, -5, 5)]] : [[int(R, -5, 5), int(R, -5, 5)]];
  if (seg && dist(P[0]!, P[1]!) < 2) return null;
  const where = pick(R, seg ? ['origin', 'vertex', 'other'] as const : ['origin', 'other'] as const);
  const c: V = where === 'origin' ? ORIGIN : where === 'vertex' ? P[0]! : [int(R, -4, 4), int(R, -4, 4)];
  if (where !== 'origin' && eqV(c, ORIGIN)) return null;
  const deg = quarter(R);
  const m: Motion = { kind: 'R', c, deg };
  const Q = applyAll(m, P);
  const ask = seg ? 1 : 0, pa = P[ask]!, ans = Q[ask]!;
  if (!inLim([...P, ...Q]) || eqV(pa, c)) return null;
  const cn = pinName(c, L, P);
  const wrongs: PWrong[] = [];
  if (deg !== 180) wrongs.push({ v: rot(pa, c, -deg), mc: MC.reverse, say: `That turns ${deg > 0 ? 'clockwise' : 'counterclockwise'}, the other way. Follow the teal arrow.` });
  if (cn !== 'O') wrongs.push({ v: rot(pa, ORIGIN, deg), mc: MC.wrongCenter, say: `That turns about the origin. The pin is at ${cn}${pt(c)}: count from ${cn}.` });
  wrongs.push({ v: [pa[1], pa[0]], mc: MC.swap, say: 'Swapping the coordinates is not a turn. Count the steps from the center and turn them.' });
  const off = sub(pa, c);
  return pairItem({
    id: `turnGrid-${where}-${P.flat().join('')}-${deg}`, family: 'turnGrid',
    prompt: `Turn ${seg ? `segment ${A(L[0] + L[1])}` : `point ${A(L[0])}`} ${B(turnWords(deg))} about ${B(cn === 'O' ? 'the origin O' : `${cn}${pt(c)}`)}. Where does ${S(pr(L[ask]!))} land?`,
    board: `${L[ask]}${ptTex(pa)} \\to ${L[ask]}'(?,\\ ?)`,
    pairLead: `${pr(L[ask]!)} = (`, pairOp: ',',
    picture: {
      grid: { figs: [pre(P, seg ? [L[0]!, L[1]!] : [L[0]!], seg), img(Q, seg ? [pr(L[0]!), pr(L[1]!)] : [pr(L[0]!)], seg)], center: { p: c, name: cn }, turn: { c, from: pa, deg }, ghost: { fig: 0, m } },
      hide: ['f1', 'n1', 'ghost', 'move'],
    },
    work: `${L[ask]}' = ${ptTex(ans)}`,
    solution: [`From ${cn}, ${L[ask]} is ${slideWords(off[0], off[1])}.`, `Turn those steps ${turnWords(deg)}: they become ${slideWords(ans[0] - c[0], ans[1] - c[1])}.`, `So ${pr(L[ask]!)} is at ${pt(ans)}.`],
  }, ans, `Right: ${pr(L[ask]!)}${pt(ans)}, the same distance from ${cn}.`, wrongs, `Count the steps from ${cn} to ${L[ask]}, then turn the whole set of steps ${turnWords(deg)}.`);
}, 'turnGrid');

// 10 reflect-slanted-line: y = x + c or y = −x + c
const flipDiag: Gen = R => retry(R, () => {
  const L = pick(R, LETTERS);
  const { m, name, s, c } = mirrorDiag(R);
  const on = R() < 0.12;
  let p: V = [int(R, -5, 5), int(R, -5, 5)];
  if (on) { const x = int(R, -4, 4); p = [x, s * x + c]; }
  const onLine = p[1] === s * p[0] + c;
  if (on !== onLine) return null;
  const ans = apply(m, p);
  if (!inLim([p, ans]) || (!on && dist(p, ans) < 2)) return null;
  const hor: V = [(2 * (p[1] - c)) / s - p[0], p[1]], ver: V = [p[0], 2 * (s * p[0] + c) - p[1]];
  return pairItem({
    id: `flipDiag-${name}-${p.join('')}`, family: 'flipDiag',
    prompt: `Reflect point ${A(L[0])}${A(pt(p))} across the slanted line ${B(name)}. Where does ${S(pr(L[0]))} land?`,
    board: `${L[0]}${ptTex(p)} \\to ${L[0]}'(?,\\ ?)`,
    pairLead: `${pr(L[0])} = (`, pairOp: ',',
    picture: { grid: { figs: [pre([p], [L[0]!]), img([ans], [pr(L[0]!)])], mirror: { p: m.kind === 'M' ? m.p : ORIGIN, q: m.kind === 'M' ? m.q : ORIGIN, name }, links: [{ a: p, b: ans }] }, hide: ['f1', 'n1', 'l0'] },
    work: `${L[0]}' = ${ptTex(ans)}`,
    solution: on ? [`${L[0]}${pt(p)} is on the line ${name}.`, `A point on the mirror stays where it is: ${pr(L[0])}${pt(ans)}.`] : [`Go from ${L[0]} straight toward the line at a right angle: diagonally, one square corner at a time.`, `Count the diagonal steps to the line, then the same number past it: ${pr(L[0])}${pt(ans)}.`],
  }, ans, on ? `Right: ${L[0]} is on the line, so it stays put.` : `Right: straight across ${name}, at a right angle.`, [
    { v: hor, mc: MC.notPerp, say: `That goes straight across sideways. Across a slanted line you go at a right angle to it: diagonally.` },
    { v: ver, mc: MC.notPerp, say: 'That goes straight up or down. Across a slanted line you go at a right angle to it: diagonally.' },
    { v: [p[1], p[0]], mc: c !== 0 || s !== 1 ? MC.axisRule : undefined, say: `Swapping x and y reflects across y = x only. This line is ${name}.` },
  ], `Go at a right angle to the line (diagonally on the grid), the same distance on the other side.`);
}, 'flipDiag');

// 11 rotate-any-angle: 60° (or 45°, 120°) about a center, by protractor; candidates on the canvas
const turnAngle: Gen = R => retry(R, () => {
  const deg = pick(R, [60, -60, 45, -45, 120, -120]);
  const c: V = [int(R, -3, 3), int(R, -3, 3)];
  const segCase = R() < 0.5;
  const q: V = add(c, [pick(R, [-4, -3, 3, 4]), pick(R, [-2, -1, 0, 1, 2])]);
  const p0: V = add(q, [pick(R, [-2, 2]), pick(R, [-2, 2])]);
  const ans = rot(q, c, deg);
  const cands: { v: V; mc?: string; say: string; ok?: boolean }[] = [
    { v: ans, ok: true, say: `Right: ${Math.abs(deg)}° ${deg > 0 ? 'counterclockwise' : 'clockwise'}, and the same distance from C.` },
    { v: rot(q, c, -deg), mc: MC.reverse, say: `That one turned ${deg > 0 ? 'clockwise' : 'counterclockwise'}: the other way.` },
    segCase ? { v: rot(q, p0, deg), mc: MC.atVertex, say: `That one turned about P, the end of the segment. Measure the turn at the center C.` }
      : { v: [c[0] + (ans[0] - c[0]) * 0.6, c[1] + (ans[1] - c[1]) * 0.6], mc: MC.ignoreDist, say: 'Right turn, but it moved closer to C. A turn keeps the distance to the center.' },
  ];
  const P = cands.map(x => x.v);
  const pts = [c, q, ...P, ...(segCase ? [p0] : [])];
  if (!inLim(pts, 7)) return null;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) if (dist(P[i]!, P[j]!) < 1.4) return null;
  const order_ = shuffle(R, [0, 1, 2]);
  const dots = order_.map((k, j) => ({ p: P[k]!, name: String(j + 1), role: 'pick' as const }));
  const figs: FigSpec[] = segCase ? [pre([p0, q], ['P', 'Q'], true)] : [pre([q], ['Q'])];
  const opts: Opt[] = order_.map((k, j) => ({ t: `Point ${j + 1}`, ok: !!cands[k]!.ok, mc: cands[k]!.mc, say: cands[k]!.say }));
  return choiceItem(R, {
    id: `turnAngle-${deg}-${c.join('')}-${q.join('')}-${segCase}`, family: 'turnAngle',
    prompt: `Turn ${segCase ? `segment ${A('PQ')}` : `point ${A('Q')}`} ${B(`${Math.abs(deg)}° ${deg > 0 ? 'counterclockwise' : 'clockwise'}`)} about the center ${B('C')}. Which point is ${S('Q′')}?`,
    board: `${T('turn ')}${Math.abs(deg)}^\\circ ${T(deg > 0 ? ' ccw' : ' cw')} ${T(' about ')}C`,
    picture: { grid: { figs, center: { p: c, name: 'C' }, dots, turn: { c, from: q, deg, r: 1 }, axes: false }, hide: ['turn'], ring: ans },
    solution: [`Put the protractor's center on C, not on the figure.`, `Turn the ray CQ ${Math.abs(deg)}° ${deg > 0 ? 'counterclockwise' : 'clockwise'} and keep Q's distance to C.`],
  }, opts);
}, 'turnAngle');

// 12 whole-figure: the same motion for every vertex
const whole: Gen = R => retry(R, () => {
  const L = pick(R, LETTERS);
  const P = triangle(R, -5, 5, -5, 5);
  const k = pick(R, ['T', 'M', 'D', 'R'] as const);
  const m: Motion = k === 'T' ? { kind: 'T', a: int(R, -5, 5), b: int(R, -5, 5) } : k === 'M' ? mirrorAxisParallel(R, -2, 2).m : k === 'D' ? mirrorDiag(R).m
    : { kind: 'R', c: R() < 0.4 ? P[0]! : [int(R, -3, 3), int(R, -3, 3)], deg: quarter(R) };
  if (m.kind === 'T' && m.a === 0 && m.b === 0) return null;
  const Q = applyAll(m, P);
  if (!inLim([...P, ...Q]) || !apart(m, P, Q)) return null;
  const ans = Q[2]!;
  const anchor = add(Q[0]!, sub(P[2]!, P[0]!));
  const wrongs: PWrong[] = [];
  if (m.kind !== 'T') wrongs.push({ v: anchor, mc: MC.oneAnchor, say: `That copies the triangle's shape from ${pr(L[0])} without moving ${L[2]} itself. Apply the motion to ${L[2]} too.` });
  else wrongs.push({ v: add(P[2]!, [m.b, m.a]), mc: MC.vertsDiffer, say: `Every corner moves the same way: ${slideWords(m.a, m.b)}.` });
  const cn = centerOf(m, L, P);
  const marks = marksFor(m, L, P);
  return pairItem({
    id: `whole-${k}-${P.flat().join('')}`, family: 'whole',
    prompt: `Apply ${B(describe(m, cn).replace(/^an? /, 'the ') )} to triangle ${A(L.join(''))}. ${S(pr(L[0]) + ' and ' + pr(L[1]))} are drawn. Where does ${S(pr(L[2]))} land?`,
    board: `${L[2]}${ptTex(P[2]!)} \\to ${L[2]}'(?,\\ ?)`,
    pairLead: `${pr(L[2])} = (`, pairOp: ',',
    picture: {
      grid: { figs: [pre(P, L), img(Q, [null, null, pr(L[2]!)]), img([Q[0]!], [pr(L[0]!)]), img([Q[1]!], [pr(L[1]!)])], ...marks, ...(m.kind === 'T' ? { arrow: { from: P[0]!, to: Q[0]! } } : {}), ghost: { fig: 0, m } },
      hide: ['f1', 'n1', 'ghost', 'move'],
    },
    work: `${L[2]}' = ${ptTex(ans)}`,
    solution: [`Do to ${L[2]} exactly what was done to ${L[0]} and ${L[1]}: ${describe(m, cn)}.`, `${L[2]}${pt(P[2]!)} goes to ${pr(L[2])}${pt(ans)}. Then join the corners in the same order.`],
  }, ans, `Right: ${pr(L[2])}${pt(ans)}.`, wrongs, `Apply ${describe(m, cn)} to ${L[2]} itself, the same way as to the other corners.`);
}, 'whole');

// 13 verify-lines: a point on a segment stays on the image segment, the same fraction along
const straight: Gen = R => retry(R, () => {
  const A0: V = [int(R, -6, 0), int(R, -6, 6)];
  const n = 3, d: V = [pick(R, [1, 2]) * pick(R, [1, -1]), pick(R, [0, 1, 2]) * pick(R, [1, -1])];
  const B0 = add(A0, [d[0] * n, d[1] * n]);
  const j = pick(R, [1, 2]);
  const M0 = add(A0, [d[0] * j, d[1] * j]);
  const m: Motion = R() < 0.5 ? { kind: 'R', c: [int(R, -2, 2), int(R, -2, 2)], deg: quarter(R) } : mirrorAxisParallel(R, -2, 2).m;
  const [A1, B1, M1] = applyAll(m, [A0, B0, M0]);
  const back = applyAll(m, [add(A0, [d[0] * (n - j), d[1] * (n - j)])])[0]!;
  const perp: V = [-(B1![1] - A1![1]) / n, (B1![0] - A1![0]) / n];
  const off = add(M1!, [Math.sign(perp[0]) * pick(R, [1, 2]), Math.sign(perp[1]) * 1]);
  const pts = [A0, B0, M0, A1!, B1!, M1!, back, off];
  if (!inLim(pts)) return null;
  const P3 = [M1!, back, off];
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) if (dist(P3[a]!, P3[b]!) < 1.2) return null;
  if (Math.abs(area2([A1!, B1!, off])) < 1e-6) return null;
  const ord = shuffle(R, [0, 1, 2]);
  const info = [
    { ok: true, say: 'Right: on the image segment, the same fraction along from A′.' },
    { ok: false, mc: MC.position, say: `That one is ${j} ${j === 1 ? 'step' : 'steps'} from B′, not from A′. M is ${j} of ${n} steps from A, so M′ is ${j} of ${n} steps from A′.` },
    { ok: false, mc: MC.bend, say: 'A rigid motion takes a segment to a segment: M′ must be on A′B′, not off it.' },
  ];
  return choiceItem(R, {
    id: `straight-${A0.join('')}-${d.join('')}-${j}-${JSON.stringify(m)}`, family: 'straight',
    prompt: `${A('M')} is on segment ${A('AB')}, ${j} of ${n} equal steps from A. After ${B(describe(m, 'P'))}, which point is ${S('M′')}?`,
    board: `AM = \\tfrac{${j}}{${n}}\\,AB`,
    picture: { grid: { figs: [pre([A0, B0], ['A', 'B'], true), pre([M0], ['M']), img([A1!, B1!], ['A′', 'B′'], true)], ...motionMarks(m), dots: ord.map((k, i) => ({ p: P3[k]!, name: String(i + 1), role: 'pick' as const })) } },
    solution: ['A rigid motion takes the segment AB to the segment A′B′: straight stays straight.', `M is ${j} of ${n} steps from A, so M′ is ${j} of ${n} steps from A′ along A′B′.`],
  }, ord.map((k, i) => ({ t: `Point ${i + 1}`, ...info[k]! })));
}, 'straight');

// 14 verify-distance: which image length must match
const keepLen: Gen = R => retry(R, () => {
  const L = pick(R, LETTERS);
  const P = triangle(R, -5, 5, -5, 5);
  const i = [0, 1, 2].find(k => P[k]![0] === P[(k + 1) % 3]![0] || P[k]![1] === P[(k + 1) % 3]![1]);
  if (i === undefined) return null;
  const m: Motion = pick(R, [{ kind: 'R', c: [int(R, -2, 2), int(R, -2, 2)], deg: quarter(R) }, mirrorAxisParallel(R, -2, 2).m, { kind: 'T', a: int(R, -5, 5), b: int(R, -5, 5) }] as Motion[]);
  const Q = applyAll(m, P);
  if (!inLim([...P, ...Q]) || !apart(m, P, Q) || P.some((p, k) => eqV(p, Q[k]!))) return null;
  const a = L[i]!, b = L[(i + 1) % 3]!, c = L[(i + 2) % 3]!;
  const len = clean(dist(P[i]!, P[(i + 1) % 3]!));
  const moved = dist(P[i]!, Q[i]!);
  if (Math.abs(moved - len) < 1e-6) return null;
  return choiceItem(R, {
    id: `keepLen-${P.flat().join('')}-${JSON.stringify(m)}`, family: 'keepLen',
    prompt: `${A(L.join(''))} is mapped onto ${S(L.map(pr).join(''))} by ${B(describe(m, centerOf(m, L, P)))}. Side ${A(a + b)} is ${len} units long. Which length must also be ${len} units?`,
    board: `${a}${b} = ${len}`,
    picture: { grid: { figs: [pre(P, L), img(Q, L.map(pr))], ...marksFor(m, L, P) } },
    work: `${a}'${b}' = ${a}${b} = ${len}`,
    solution: [`${a} goes to ${pr(a)} and ${b} goes to ${pr(b)}, so side ${a}${b} goes to side ${pr(a)}${pr(b)}.`, `A rigid motion keeps the distance between any two points: ${pr(a)}${pr(b)} = ${len}.`],
  }, [
    { t: `${pr(a)}${pr(b)}`, ok: true, say: `Right: the image of ${a}${b} is ${pr(a)}${pr(b)}, and lengths are kept.` },
    { t: `${pr(b)}${pr(c)}`, ok: false, mc: MC.unmatched, say: `${pr(b)}${pr(c)} is the image of ${b}${c}, a different side. Match the endpoints: ${a}${b} → ${pr(a)}${pr(b)}.` },
    { t: `${a}${pr(a)}, how far ${a} moved`, ok: false, mc: MC.sameMove, say: `“Lengths are kept” is about lengths inside the figure, not how far points travel. ${a}${pr(a)} can be any length.` },
  ]);
}, 'keepLen');

// 15 verify-angle: the measure is kept, even reflected or drawn with longer sides
const keepAngle: Gen = R => retry(R, () => {
  const L = pick(R, LETTERS);
  const P = triangle(R, -5, 5, -5, 5);
  const v = int(R, 0, 2);
  const ang = Math.round(angleAt(P, v));
  if (ang === 90 || Math.abs(ang - angleAt(P, v)) > 0.5) return null;
  const m: Motion = pick(R, [mirrorAxisParallel(R, -2, 2).m, mirrorDiag(R).m, { kind: 'R', c: [int(R, -2, 2), int(R, -2, 2)], deg: quarter(R) }] as Motion[]);
  const Q = applyAll(m, P);
  if (!inLim([...P, ...Q]) || !apart(m, P, Q) || P.some((p, k) => eqV(p, Q[k]!))) return null;
  const nm = `${L[(v + 2) % 3]}${L[v]}${L[(v + 1) % 3]}`, nmP = nm.split('').map(pr).join('');
  const base = {
    id: `keepAngle-${P.flat().join('')}-${v}-${JSON.stringify(m)}`, family: 'keepAngle' as const,
    board: `\\angle ${nm} \\approx ${ang}^\\circ`,
    picture: { grid: { figs: [pre(P, L), img(Q, L.map(pr))], ...marksFor(m, L, P) }, angles: [{ fig: 0, i: v }, { fig: 1, i: v }] } as Pic,
    work: `\\angle ${nm.split('').map(x => x + "'").join('')} = ${ang}^\\circ`,
    solution: [`The angle at ${L[v]} goes to the angle at ${pr(L[v]!)}.`, `A rigid motion keeps every angle: ∠${nmP} = ${ang}°, even when it faces another way.`],
  };
  if (R() < 0.3) return choiceItem(R, { ...base, prompt: `A protractor gives ∠${A(nm)} ≈ ${ang}°. ${A(L.join(''))} is mapped onto ${S(L.map(pr).join(''))} by ${B(describe(m, centerOf(m, L, P)))}. Someone redraws the image with the sides of ∠${nmP} twice as long. Compare ∠${S(nmP)} with ∠${A(nm)}.` }, [
    { t: `The same: ${ang}°`, ok: true, say: 'Right: an angle is the amount of turn between its sides; longer sides do not change it.' },
    { t: 'Bigger: its sides are longer', ok: false, mc: MC.armLength, say: 'Longer sides do not open an angle wider. The turn between the sides is still the same.' },
    { t: 'Smaller: it faces a new way', ok: false, mc: MC.supplement, say: 'Facing a new way does not change the size of the turn between the sides.' },
  ]);
  return numItem({ ...base, prompt: `A protractor gives ∠${A(nm)} ≈ ${ang}°. ${A(L.join(''))} is mapped onto ${S(L.map(pr).join(''))} by ${B(describe(m, centerOf(m, L, P)))}. How big is ∠${S(nmP)}?`, unit: '°' }, ang,
    `Right: ${ang}°. The angle is kept.`, [
      { v: 180 - ang, mc: MC.supplement, say: `${180 - ang}° is what is left of a straight angle. The image angle faces another way, but its size is still ${ang}°.` },
      ...[0, 1, 2].filter(k => k !== v).map(k => ({ v: Math.round(angleAt(P, k)), mc: MC.unmatched, say: `That is the angle at ${pr(L[k]!)}. The angle at ${L[v]} goes to the angle at ${pr(L[v]!)}.` })),
    ], `A rigid motion keeps angle measures: the angle at ${pr(L[v]!)} is the angle at ${L[v]}.`);
}, 'keepAngle');

// 16 verify-parallel: a parallelogram under a rotation or a reflection
const keepPar: Gen = R => retry(R, () => {
  const a0: V = [int(R, -5, 0), int(R, -5, 0)];
  const u: V = [int(R, 2, 4), int(R, -1, 1)], w: V = [int(R, -1, 2), int(R, 2, 3)];
  if (Math.abs(u[0] * w[1] - u[1] * w[0]) < 4) return null;
  const P: V[] = [a0, add(a0, u), add(add(a0, u), w), add(a0, w)];
  const m: Motion = R() < 0.5 ? { kind: 'R', c: [int(R, -2, 2), int(R, -2, 2)], deg: pick(R, [90, -90]) } : pick(R, [mirrorDiag(R).m, mirrorAxisParallel(R, -2, 2).m]);
  const Q = applyAll(m, P);
  if (!inLim([...P, ...Q]) || !apart(m, P, Q)) return null;
  const L = ['A', 'B', 'C', 'D'];
  return choiceItem(R, {
    id: `keepPar-${P.flat().join('')}-${JSON.stringify(m)}`, family: 'keepPar',
    prompt: `In parallelogram ${A('ABCD')}, side AB is parallel to side DC. After ${B(describe(m, 'P'))}, what about ${S('A′B′')} and ${S('D′C′')}?`,
    board: `AB \\parallel DC`,
    picture: { grid: { figs: [pre(P, L), img(Q, L.map(pr))], ...motionMarks(m) } },
    work: `A'B' \\parallel D'C'`,
    solution: ['A rigid motion takes lines to lines and keeps every angle.', 'Both sides turn (or flip) together by the same amount, so they stay parallel: A′B′ ∥ D′C′.'],
  }, [
    { t: 'Still parallel', ok: true, say: 'Right: both sides change direction together, so they stay parallel.' },
    { t: 'Not parallel any more: they point a new way', ok: false, mc: MC.parallel, say: 'Both sides point a new way, but by the same turn: they still never meet.' },
    { t: 'Parallel only if the move is a translation', ok: false, mc: MC.parallel, say: 'Turns and flips keep parallel lines parallel too: the whole figure moves as one piece.' },
  ]);
}, 'keepPar');

// 17 coord-translate: (x, y) -> (x + a, y + b), both directions
const addTex = (v: string, a: number) => (a === 0 ? v : a > 0 ? `${v} + ${a}` : `${v} - ${-a}`);
const ruleT: Gen = R => retry(R, () => {
  const a = int(R, -6, 6), b = int(R, -6, 6);
  if (a === 0 && b === 0) return null;
  const p: V = [int(R, -7, 7), int(R, -7, 7)];
  const q: V = [p[0] + a, p[1] + b];
  if (!inLim([p, q], 8)) return null;
  const rule = `(x, y) \\to (${addTex('x', a)},\\ ${addTex('y', b)})`;
  const pic: Pic = { grid: { figs: [pre([p], ['P']), img([q], ['P′'])], arrow: { from: p, to: q } }, hide: ['f1', 'n1', 'arrow'] };
  if (R() < 0.35) {
    return pairItem({
      id: `ruleT-rev-${p.join('')}-${a}-${b}`, family: 'ruleT',
      prompt: `A translation takes ${A('P' + pt(p))} to ${S('P′' + pt(q))}. Find the rule (x, y) → (x + a, y + b).`,
      board: `P${ptTex(p)} \\to P'${ptTex(q)}`,
      pairLead: 'a =', pairOp: 'b =',
      picture: { grid: { figs: [pre([p], ['P']), img([q], ['P′'])], arrow: { from: p, to: q } }, hide: ['arrow'] },
      work: `a = ${q[0]} - (${p[0]}) = ${a},\\ b = ${b}`,
      solution: [`a = new x − old x = ${sgn(q[0])} − (${sgn(p[0])}) = ${mark(sgn(a))}.`, `b = new y − old y = ${sgn(q[1])} − (${sgn(p[1])}) = ${mark(sgn(b))}.`, `Rule: (x, y) → (x ${a < 0 ? '−' : '+'} ${Math.abs(a)}, y ${b < 0 ? '−' : '+'} ${Math.abs(b)}).`],
    }, [a, b], `Right: every point moves ${slideWords(a, b)}.`, [
      { v: [-a, -b], say: 'That is the way back, from P′ to P. Subtract old from new: new − old.' },
      { v: [b, a], mc: MC.shiftWrong, say: 'a is the change in x (across), b the change in y (up or down).' },
    ], 'a is new x − old x; b is new y − old y.');
  }
  const wrongs: PWrong[] = [{ v: [p[0] + b, p[1] + a], mc: MC.shiftWrong, say: `The first number in the rule changes x (across), the second changes y. ${a !== 0 ? `x ${a < 0 ? '−' : '+'} ${Math.abs(a)}` : 'x stays'}.` }];
  const mag = (x: number, d: number) => (x !== 0 && d !== 0 && Math.sign(x) !== Math.sign(d) ? -(Math.abs(x) + Math.abs(d)) : x + d);
  const mm: V = [mag(p[0], a), mag(p[1], b)];
  if (!eqV(mm, q)) wrongs.push({ v: mm, mc: MC.mixedSigns, say: `Careful with the signs: ${sgn(p[0])} + (${sgn(a)}) = ${sgn(q[0])} and ${sgn(p[1])} + (${sgn(b)}) = ${sgn(q[1])}.` });
  wrongs.push({ v: [p[0] - a, p[1] - b], say: 'That goes the other way. Add a to x and b to y.' });
  return pairItem({
    id: `ruleT-${p.join('')}-${a}-${b}`, family: 'ruleT',
    prompt: `The translation ${B('(x, y) → (' + addTex('x', a).replace('-', '−') + ', ' + addTex('y', b).replace('-', '−') + ')')} moves ${A('P' + pt(p))}. Where is ${S('P′')}?`,
    board: rule, pairLead: 'P′ = (', pairOp: ',', picture: pic,
    work: `(${addTex(String(p[0]), a)},\\ ${addTex(String(p[1]), b)}) = ${ptTex(q)}`,
    solution: [`x: ${sgn(p[0])} + (${sgn(a)}) = ${sgn(q[0])}.`, `y: ${sgn(p[1])} + (${sgn(b)}) = ${sgn(q[1])}.`, `P′${pt(q)}: every point moves ${slideWords(a, b)}.`],
  }, q, `Right: P′${pt(q)}.`, wrongs, `Add ${sgn(a)} to x and ${sgn(b)} to y.`);
}, 'ruleT');

// 18 coord-reflect-axes
const ruleAx: Gen = R => retry(R, () => {
  const xAxis = R() < 0.5;
  const kind = pick(R, ['gen', 'gen', 'gen', 'onAxis', 'origin'] as const);
  let p: V = [int(R, -7, 7), int(R, -7, 7)];
  if (kind === 'onAxis') p = R() < 0.5 ? [int(R, -6, 6), 0] : [0, int(R, -6, 6)];
  if (kind === 'origin') p = [0, 0];
  if (kind === 'gen' && (p[0] === 0 || p[1] === 0)) return null;
  const ans: V = xAxis ? [p[0], -p[1]] : [-p[0], p[1]];
  const named: V = xAxis ? [-p[0], p[1]] : [p[0], -p[1]];
  const m: Motion = xAxis ? { kind: 'M', p: [0, 0], q: [1, 0] } : { kind: 'M', p: [0, 0], q: [0, 1] };
  const ax = xAxis ? 'x' : 'y';
  return pairItem({
    id: `ruleAx-${ax}-${p.join('')}`, family: 'ruleAx',
    prompt: `Reflect ${A('P' + pt(p))} across the ${B(ax + '-axis')}. Where is ${S('P′')}?`,
    board: `${T('reflect across the ')}${ax}${T('-axis')}`,
    pairLead: 'P′ = (', pairOp: ',',
    picture: { grid: { figs: [pre([p], ['P']), img([ans], ['P′'])], mirror: { p: m.kind === 'M' ? m.p : ORIGIN, q: m.kind === 'M' ? m.q : ORIGIN }, links: eqV(p, ans) ? [] : [{ a: p, b: ans }] }, hide: ['f1', 'n1', 'l0'] },
    work: xAxis ? `(x, y) \\to (x, -y)` : `(x, y) \\to (-x, y)`,
    solution: [`Across the ${ax}-axis you move straight ${xAxis ? 'up or down' : 'left or right'}, the same distance on the other side.`, `So ${xAxis ? 'x stays and y changes sign' : 'y stays and x changes sign'}: (x, y) → ${xAxis ? '(x, −y)' : '(−x, y)'}.`, `P′${pt(ans)}.`],
  }, ans, eqV(p, ans) ? 'Right: a point on the mirror stays where it is.' : `Right: P′${pt(ans)}.`, [
    { v: named, mc: MC.negNamed, say: `That changes the ${ax}-coordinate. Reflecting across the ${ax}-axis moves the point ${xAxis ? 'up or down' : 'left or right'}, so the ${xAxis ? 'y' : 'x'}-coordinate changes sign.` },
    { v: [-p[0], -p[1]], say: 'Both signs changed: that is a half turn about the origin. A reflection in one axis changes one coordinate.' },
    { v: [p[1], p[0]], mc: MC.swap, say: 'Swapping the coordinates reflects across y = x, not an axis.' },
  ], `Across the ${ax}-axis: ${xAxis ? 'x stays, y changes sign' : 'y stays, x changes sign'}.`);
}, 'ruleAx');

// 19 coord-reflect-parallel: x = h or y = k
const ruleLine: Gen = R => retry(R, () => {
  const vert = R() < 0.5, h = pick(R, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
  let p: V = [int(R, -7, 7), int(R, -7, 7)];
  if (R() < 0.12) p = vert ? [h, p[1]] : [p[0], h];
  const ans: V = vert ? [2 * h - p[0], p[1]] : [p[0], 2 * h - p[1]];
  if (!inLim([p, ans], 8)) return null;
  const name = `${vert ? 'x' : 'y'} = ${sgn(h)}`;
  const m: Motion = vert ? { kind: 'M', p: [h, 0], q: [h, 1] } : { kind: 'M', p: [0, h], q: [1, h] };
  const onL = eqV(p, ans);
  const dd = vert ? p[0] - h : p[1] - h;
  return pairItem({
    id: `ruleLine-${name}-${p.join('')}`, family: 'ruleLine',
    prompt: `Reflect ${A('P' + pt(p))} across the line ${B(name)}. Where is ${S('P′')}?`,
    board: `${T('reflect across ')}${name.replace('−', '-')}`,
    pairLead: 'P′ = (', pairOp: ',',
    picture: { grid: { figs: [pre([p], ['P']), img([ans], ['P′'])], mirror: { p: m.kind === 'M' ? m.p : ORIGIN, q: m.kind === 'M' ? m.q : ORIGIN, name }, links: onL ? [] : [{ a: p, b: ans }] }, hide: ['f1', 'n1', 'l0'] },
    work: vert ? `x' = ${h} ${dd > 0 ? '-' : '+'} ${Math.abs(dd)} = ${ans[0]}` : `y' = ${h} ${dd > 0 ? '-' : '+'} ${Math.abs(dd)} = ${ans[1]}`,
    solution: onL ? [`P${pt(p)} is on the line ${name}.`, `A point on the mirror stays put: P′${pt(ans)}.`] : [`P is ${Math.abs(dd)} ${Math.abs(dd) === 1 ? 'unit' : 'units'} ${vert ? (dd > 0 ? 'right' : 'left') : (dd > 0 ? 'above' : 'below')} of ${name}.`, `P′ is ${Math.abs(dd)} on the other side: ${vert ? 'x' : 'y'} = ${sgn(h)} ${dd > 0 ? '−' : '+'} ${Math.abs(dd)} = ${sgn(vert ? ans[0] : ans[1])}. The other coordinate stays: P′${pt(ans)}.`],
  }, ans, onL ? 'Right: P is on the line, so it stays.' : `Right: P′${pt(ans)}.`, [
    { v: vert ? [-p[0], p[1]] : [p[0], -p[1]], mc: MC.axisRule, say: `That uses the ${vert ? 'y' : 'x'}-axis rule. The mirror is ${name}: count from it, not from the axis.` },
    { v: vert ? [p[0], 2 * h - p[1]] : [2 * h - p[0], p[1]], mc: MC.negNamed, say: `Across the ${vert ? 'vertical' : 'horizontal'} line ${name} only the ${vert ? 'x' : 'y'}-coordinate changes.` },
  ], `Count from P to ${name}, then the same distance past it. ${vert ? 'y' : 'x'} stays the same.`);
}, 'ruleLine');

// 20 coord-rotate-180
const rule180: Gen = R => retry(R, () => {
  const p: V = [int(R, -6, 6), int(R, -6, 6)];
  if (eqV(p, ORIGIN)) return null;
  const ans: V = [-p[0], -p[1]];
  const m: Motion = { kind: 'R', c: ORIGIN, deg: 180 };
  const pic: Pic = { grid: { figs: [pre([p], ['P']), img([ans], ['P′'])], center: { p: ORIGIN, name: 'O' }, ghost: { fig: 0, m } }, hide: ['f1', 'n1', 'ghost', 'move'] };
  if (R() < 0.3) return choiceItem(R, {
    id: `rule180-dir-${p.join('')}`, family: 'rule180',
    prompt: `Ana turns ${A('P' + pt(p))} 180° clockwise about the origin. Ben turns it 180° counterclockwise. What do they get?`,
    board: `P${ptTex(p)}`, picture: pic,
    work: `(x, y) \\to (-x, -y) = ${ptTex(ans)}`,
    solution: ['A half turn either way ends on the opposite side of the center.', `Both land on (−x, −y) = ${pt(ans)}.`],
  }, [
    { t: `The same point, ${pt(ans)}`, ok: true, say: 'Right: half a turn either way ends at the same spot.' },
    { t: 'Two different points', ok: false, mc: MC.opposite, say: 'Half a turn clockwise and half a turn counterclockwise both end straight across the center: the same point.' },
    { t: 'Only one of them made a real half turn', ok: false, mc: MC.opposite, say: 'Both are half turns. They take different routes but end at the same point.' },
  ]);
  return pairItem({
    id: `rule180-${p.join('')}`, family: 'rule180',
    prompt: `Rotate ${A('P' + pt(p))} 180° about the origin. Where is ${S('P′')}?`,
    board: `${T('turn ')}180^\\circ ${T(' about ')}O`, pairLead: 'P′ = (', pairOp: ',', picture: pic,
    work: `(x, y) \\to (-x, -y)`,
    solution: ['A half turn about O ends straight across O, the same distance away.', `Both coordinates change sign: (x, y) → (−x, −y) = ${pt(ans)}.`],
  }, ans, `Right: P′${pt(ans)}.`, [
    { v: [p[1], p[0]], mc: MC.swap, say: 'Swapping the coordinates is not a turn. A half turn changes the sign of both: (−x, −y).' },
    { v: [-p[1], -p[0]], mc: MC.swap, say: 'No swap in a half turn: just change both signs, (−x, −y).' },
    { v: [-p[0], p[1]], say: 'That changes one sign: a reflection in the y-axis. A half turn changes both.' },
    { v: [p[0], -p[1]], say: 'That changes one sign: a reflection in the x-axis. A half turn changes both.' },
  ], 'A half turn about the origin changes both signs: (x, y) → (−x, −y).');
}, 'rule180');

// 21 coord-rotate-90 (and 270, 360 by repeating quarter turns; a center off the origin as a contrast)
const rule90: Gen = R => retry(R, () => {
  const p: V = [int(R, -6, 6), int(R, -6, 6)];
  if (p[0] === 0 && p[1] === 0 || Math.abs(p[0]) === Math.abs(p[1])) return null;
  const kind = pick(R, ['q', 'q', 'q', 'q', '270', '360', 'off'] as const);
  const deg = kind === '270' ? pick(R, [270, -270]) : kind === '360' ? pick(R, [360, -360]) : pick(R, [90, -90]);
  const c: V = kind === 'off' ? [int(R, -3, 3), int(R, -3, 3)] : ORIGIN;
  if (kind === 'off' && eqV(c, ORIGIN)) return null;
  const ans = rot(p, c, deg);
  if (!inLim([p, ans, c], 8)) return null;
  const dirW = deg > 0 ? 'counterclockwise' : 'clockwise';
  const wrongs: PWrong[] = [];
  if (kind === '360') {
    for (const v of [rot(p, ORIGIN, 90), rot(p, ORIGIN, 180), rot(p, ORIGIN, -90), [p[1], p[0]] as V]) wrongs.push({ v, mc: MC.fullTurn, say: 'Four quarter turns make a full turn: every point comes back to where it started.' });
  } else {
    wrongs.push({ v: rot(p, c, -deg), mc: MC.reverse, say: `That turns ${deg > 0 ? 'clockwise' : 'counterclockwise'}, the other way.${Math.abs(deg) === 270 ? ' 270° one way is 90° the other way.' : ''}` });
    wrongs.push({ v: [p[1], p[0]], mc: MC.swap, say: `Swapping x and y alone is not a turn: one of them also changes sign. ${deg % 360 === 90 || deg === -270 ? '(x, y) → (−y, x)' : '(x, y) → (y, −x)'}.` });
    if (kind === 'off') wrongs.push({ v: rot(p, ORIGIN, deg), mc: MC.axisRule, say: `That is the rule for turning about the origin. Here the center is ${pt(c)}: count steps from the center.` });
  }
  const ruleTex = kind === 'off' ? '' : (((deg % 360) + 360) % 360 === 90 ? '(x, y) \\to (-y, x)' : ((deg % 360) + 360) % 360 === 270 ? '(x, y) \\to (y, -x)' : '(x, y) \\to (x, y)');
  const cn = kind === 'off' ? `C${pt(c)}` : 'the origin';
  return pairItem({
    id: `rule90-${kind}-${p.join('')}-${deg}-${c.join('')}`, family: 'rule90',
    prompt: `Rotate ${A('P' + pt(p))} ${B(`${Math.abs(deg)}° ${dirW}`)} about ${B(cn)}. Where is ${S('P′')}?`,
    board: `${Math.abs(deg)}^\\circ ${T(deg > 0 ? ' ccw' : ' cw')}${T(' about ')}${kind === 'off' ? `C${ptTex(c)}` : 'O'}`,
    pairLead: 'P′ = (', pairOp: ',',
    picture: { grid: { figs: [pre([p], ['P']), img([ans], ['P′'])], center: { p: c, name: kind === 'off' ? 'C' : 'O' }, turn: { c, from: p, deg: Math.abs(deg) === 360 ? Math.sign(deg) * 350 : deg }, ghost: { fig: 0, m: { kind: 'R', c, deg } } }, hide: ['f1', 'n1', 'turn', 'ghost', 'move'] },
    work: kind === 'off' ? `P' = ${ptTex(ans)}` : `${ruleTex} = ${ptTex(ans)}`,
    solution: kind === '360' ? ['360° is four quarter turns: a full turn.', `Every point ends where it started: P′ = P = ${pt(p)}.`]
      : kind === 'off' ? [`From C, P is ${slideWords(p[0] - c[0], p[1] - c[1])}.`, `Turn those steps ${Math.abs(deg)}° ${dirW}: ${slideWords(ans[0] - c[0], ans[1] - c[1])}.`, `P′${pt(ans)}. The origin rule only works for turns about the origin.`]
        : [Math.abs(deg) === 270 ? `${Math.abs(deg)}° ${dirW} is three quarter turns: the same as 90° ${deg > 0 ? 'clockwise' : 'counterclockwise'}.` : `A quarter turn ${dirW} about the origin.`, `Rule: ${ruleTex.replace(/\\to/g, '→').replace(/-/g, '−')}, so P′${pt(ans)}.`],
  }, ans, `Right: P′${pt(ans)}.`, wrongs, kind === '360' ? 'A full turn brings every point back.' : `Turn the steps from the center ${Math.abs(deg)}° ${dirW}.`);
}, 'rule90');

// 22 predict-measures: unknown image measures from the preimage, without measuring
const SHAPES = [
  { thing: 'a four-sided sign', sides: ['AB', 'BC', 'CD', 'DA'] },
  { thing: 'a floor-plan piece', sides: ['AB', 'BC', 'CD', 'DA'] },
  { thing: 'a garden-bed outline', sides: ['AB', 'BC', 'CD', 'DA'] },
  { thing: 'a logo tile', sides: ['AB', 'BC', 'CA'] },
] as const;
const predict: Gen = R => retry(R, () => {
  const sh = pick(R, SHAPES);
  const motion = pick(R, ['rotated 90° clockwise', 'reflected across a line', 'turned 180°', 'translated 12 in to the right', 'rotated 60° counterclockwise']);
  const lens = pickN(R, [7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24], sh.sides.length);
  let angB = int(R, 52, 128);
  if (sh.sides.length === 3) {
    // a triangle is fixed by its three sides: ∠B (between AB and BC) is the one they make, to the nearest degree
    const [ab, bc, ca] = lens as [number, number, number];
    if (ca >= ab + bc || ab >= bc + ca || bc >= ab + ca) return null;
    angB = Math.round((Math.acos((ab * ab + bc * bc - ca * ca) / (2 * ab * bc)) * 180) / Math.PI);
    if (angB < 40 || angB > 140) return null;
  } else {
    // a four-sided figure with these sides and this ∠B must close: the diagonal AC fits triangle ACD
    const [ab, bc, cd, da] = lens as [number, number, number, number];
    const ac = Math.sqrt(ab * ab + bc * bc - 2 * ab * bc * Math.cos((angB * Math.PI) / 180));
    if (ac <= Math.abs(cd - da) + 1 || ac >= cd + da - 1) return null;
  }
  if (angB === 90) return null;
  const askAngle = R() < 0.35;
  const i = int(R, 0, sh.sides.length - 1);
  const s = sh.sides[i]!, sP = s.split('').map(pr).join('');
  // the board: two sides per row, then the angle (bare items stack their rows on a wide slate)
  const parts = sh.sides.map((x, k) => `${x} = ${lens[k]}\\text{ in}`);
  const known = [parts.slice(0, 2).join(',\\ '), parts.slice(2).join(',\\ ')].filter(Boolean).join(' \\\\ ');
  const base = {
    id: `predict-${sh.thing}-${lens.join('-')}-${angB}-${i}-${askAngle}-${motion}`, family: 'predict' as const,
    board: `${known} \\\\ \\angle B = ${angB}^\\circ`,
    solution: [`A rigid motion keeps every length and every angle, so the image needs no new measuring.`, askAngle ? `∠B′ = ∠B = ${angB}°.` : `${sP} is the image of ${s}: ${sP} = ${lens[i]} in.`],
  };
  if (R() < 0.25) return choiceItem(R, { ...base, prompt: `${sh.thing[0]!.toUpperCase() + sh.thing.slice(1)} is ${B(motion)}. Can you know ${S(sP)} without measuring the image?` }, [
    { t: `Yes: ${sP} = ${lens[i]} in`, ok: true, say: 'Right: the motion keeps every length, so the image side equals the original.' },
    { t: 'No: the image has to be measured again', ok: false, mc: MC.remeasure, say: `A rigid motion keeps lengths, so ${sP} = ${s} = ${lens[i]} in, no ruler needed.` },
    { t: `No: it depends on how far it moved`, ok: false, mc: MC.sameMove, say: 'How far the figure travels does not change its sides: they keep their lengths.' },
  ]);
  if (askAngle) return numItem({ ...base, prompt: `${sh.thing[0]!.toUpperCase() + sh.thing.slice(1)} ${A(sh.sides.map(x => x[0]).join(''))} is ${B(motion)}. How big is ${S('∠B′')}?`, unit: '°' }, angB,
    `Right: ∠B′ = ${angB}°.`, [{ v: 180 - angB, mc: MC.supplement, say: `The angle faces another way, but its size is kept: ∠B′ = ${angB}°.` }], 'Angles are kept: ∠B′ = ∠B.');
  return numItem({ ...base, prompt: `${sh.thing[0]!.toUpperCase() + sh.thing.slice(1)} ${A(sh.sides.map(x => x[0]).join(''))} is ${B(motion)}. How long is ${S(sP)}?`, unit: 'in' }, lens[i]!,
    `Right: ${sP} = ${lens[i]} in.`, lens.map((v, k) => ({ v, mc: k !== i ? MC.unmatched : undefined, say: `That is the length of ${sh.sides[k]}. ${sP} is the image of ${s}.` })), `${sP} is the image of ${s}, and lengths are kept.`);
}, 'predict');

// 23 reject-nonrigid: one broken invariant is enough
const rigid: Gen = R => retry(R, () => {
  const L = ['A', 'B', 'C', 'D'];
  const x0 = int(R, 0, 2), y0 = int(R, 0, 2), w = int(R, 1, 3), hh = int(R, 1, 3);
  const rect = R() < 0.6;
  const P: V[] = rect ? [[x0, y0], [x0 + w, y0], [x0 + w, y0 + hh], [x0, y0 + hh]] : [[x0, y0], [x0 + w + 1, y0], [x0, y0 + hh + 1]];
  const kind = pick(R, ['stretchX', 'stretchY', 'dilate', 'real', 'real'] as const);
  const m: Motion = kind === 'stretchX' ? { kind: 'S', c: ORIGIN, sx: 2, sy: 1 } : kind === 'stretchY' ? { kind: 'S', c: ORIGIN, sx: 1, sy: 2 } : kind === 'dilate' ? { kind: 'S', c: ORIGIN, sx: 2, sy: 2 }
    : pick(R, [{ kind: 'R', c: ORIGIN, deg: 90 }, { kind: 'R', c: ORIGIN, deg: 180 }, { kind: 'M', p: [0, 0], q: [0, 1] }] as Motion[]);
  const Q = applyAll(m, P);
  if (!inLim([...P, ...Q]) || (kind === 'real' && !apart(m, P, Q))) return null;
  const n = P.length, Ln = L.slice(0, n);
  const ruleTex = kind === 'stretchX' ? '(x, y) \\to (2x, y)' : kind === 'stretchY' ? '(x, y) \\to (x, 2y)' : kind === 'dilate' ? '(x, y) \\to (2x, 2y)'
    : m.kind === 'M' ? '(x, y) \\to (-x, y)' : m.kind === 'R' && m.deg === 90 ? '(x, y) \\to (-y, x)' : '(x, y) \\to (-x, -y)';
  const ruleHtml = ruleTex.replace('\\to', '→').replace(/-/g, '−');
  const base = {
    id: `rigid-${kind}-${P.flat().join('')}-${JSON.stringify(m)}`, family: 'rigid' as const,
    prompt: `The rule ${B(ruleHtml)} maps ${A(Ln.join(''))} onto ${S(Ln.map(pr).join(''))}. Is it a rigid motion?`,
    board: ruleTex,
    picture: { grid: { figs: [pre(P, Ln), img(Q, Ln.map(pr))] } } as Pic,
  };
  const realTex = m.kind === 'M' ? `${T('flip in the ')}y${T('-axis')}` : m.kind === 'R' && m.deg === 90 ? `90^\\circ${T(' ccw about ')}O` : `180^\\circ${T(' about ')}O`;
  if (kind === 'real') return choiceItem(R, { ...base, work: realTex, solution: [`It is ${describe(m, 'O')}.`, 'A rotation or a reflection keeps every length and every angle: rigid.'] }, [
    { t: `Yes: it is ${describe(m, 'O')}`, ok: true, say: 'Right: every length and angle is kept.' },
    { t: 'No: the image is in a different place', ok: false, mc: MC.sizeChange, say: 'Moving is allowed. A rigid motion only has to keep lengths and angles, and this one does.' },
    { t: 'No: it faces a different way', ok: false, mc: MC.rotRefl, say: 'Turns and flips change which way a figure faces, and they are rigid motions.' },
  ]);
  const ab = clean(dist(P[0]!, P[1]!)), abP = clean(dist(Q[0]!, Q[1]!));
  const ad = clean(dist(P[0]!, P[n - 1]!)), adP = clean(dist(Q[0]!, Q[n - 1]!));
  const [s, sv, svP] = Math.abs(ab - abP) > 1e-9 ? ['AB', ab, abP] : [`A${L[n - 1]}`, ad, adP];
  const opts: Opt[] = [
    { t: `No: ${s} = ${sv} but ${s.split('').map(pr).join('')} = ${svP}`, ok: true, say: 'Right: one changed length is enough to rule it out.' },
    { t: 'Yes: it is the same shape, only bigger', ok: false, mc: MC.sizeChange, say: 'A rigid motion keeps the size too. A bigger copy is not a rigid image.' },
  ];
  const kept = Math.abs(ab - abP) < 1e-9 ? 'AB' : Math.abs(ad - adP) < 1e-9 ? `A${L[n - 1]}` : null;
  if (kept) opts.push({ t: `Yes: side ${kept} kept its length`, ok: false, mc: MC.partial, say: `One side matching is not enough: every length must be kept, and ${s} changed.` });
  else opts.push({ t: 'Yes: the right angle at A is still a right angle', ok: false, mc: MC.partial, say: `Angles alone are not enough: every length must be kept too, and ${s} changed.` });
  return choiceItem(R, { ...base, work: `${s} = ${sv},\\ ${s.split('').map(x => x + "'").join('')} = ${svP}`, solution: [`${s} = ${sv}, but ${s.split('').map(pr).join('')} = ${svP}.`, 'A rigid motion keeps every length. One changed length shows this is not one.'] }, opts);
}, 'rigid');

// 24 evidence-vs-proof
const PEOPLE = ['Maya', 'Jordan', 'Sam', 'Riley', 'Ana', 'Leo', 'Kai', 'Noor'];
const proof: Gen = R => {
  const who = pick(R, PEOPLE), n = int(R, 3, 6);
  const t = int(R, 0, 2);
  if (t === 2) {
    const a = pick(R, [4.5, 5.2, 6.8, 7.4, 3.6]);
    return choiceItem(R, {
      id: `proof-noise-${who}-${a}`, family: 'proof',
      prompt: `${who} reflects a segment and measures: AB = ${a.toFixed(1)} cm, A′B′ = ${(a + 0.1).toFixed(1)} cm. ${who} says: “So reflections stretch segments a little.” What do you say?`,
      board: `AB = ${a.toFixed(1)},\\ A'B' = ${(a + 0.1).toFixed(1)}`,
      solution: ['A measurement is never exact: 0.1 cm is ruler error.', 'A reflection keeps every length exactly; that is a property of every reflection, not something one measurement decides.'],
    }, [
      { t: 'The 0.1 cm is measuring error: reflections keep lengths exactly', ok: true, say: 'Right: measurements wobble a little; the property does not.' },
      { t: `${who} is right: the measurement shows it`, ok: false, mc: MC.examples, say: 'One rough measurement cannot overturn a property that holds for every reflection. 0.1 cm is ruler error.' },
      { t: 'Nobody can know: measurements are never exact', ok: false, say: 'We can know: reflections keep lengths for every segment. Only the ruler is rough.' },
    ]);
  }
  const what = t === 0 ? ['rotated', 'every side kept its length', 'rotations keep lengths'] : ['reflected', 'every angle kept its measure', 'reflections keep angles'];
  return choiceItem(R, {
    id: `proof-${t}-${who}-${n}`, family: 'proof',
    prompt: `${who} ${what[0]} ${n} triangles and measured: ${what[1]}. ${who} says: “That proves ${what[2]}, for every figure.” Is ${who} right?`,
    board: T(`${n} examples checked`),
    solution: [`${n} measured examples are evidence: they fit the rule.`, 'A proof has to cover every case, and examples can never check them all.'],
  }, [
    { t: `No: ${n} examples are evidence, not a proof for every figure`, ok: true, say: 'Right: examples support a rule; a proof covers every case.' },
    { t: `Yes: ${n} examples that all work prove it`, ok: false, mc: MC.examples, say: `However many examples work, they only show those ${n} cases. A proof must cover every figure.` },
    { t: 'No: the property is false', ok: false, say: `The property is true. The point is that ${n} examples alone do not prove it.` },
  ]);
};

export const GENERATORS: Record<FamilyId, Gen> = {
  match, nameT, isMirror, nameR, order, howMany, slide, flipGrid, turnGrid, flipDiag, turnAngle, whole, straight, keepLen, keepAngle,
  keepPar, ruleT, ruleAx, ruleLine, rule180, rule90, predict, rigid, proof,
};
