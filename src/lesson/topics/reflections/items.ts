// items.ts: exercise families for "Reflect shapes and points across a line" (primary.geometry.reflect-2d-shapes).
// One family per deep structure; every family draws its situation on the Mirror block (a MirrorPic), checks the
// answer exactly with mirrorMaths, and classifies wrong answers with misconception ids from
// math-curriculum-essentials/misconceptions.json. A generator gets the SUB-GOAL it practises (plan.ts) and uses that
// sub-goal's cases (vertical / horizontal / 45° / oblique lines, distances, figures that touch or cross the line).
// Pure: no DOM, no canvas. PROBES records typical wrong responses per item and the id they must get (tests).
import { type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import {
  type CandLine, type MLine, type MirrorPic, type Poly, type Pt, type Solve, aLine, add, centroid, dLine, dist, foot, hLine,
  halfTurn, lineFrame, offset, oLine, onLine, orientation, picFits, reflect, reflectAll, samePt, shift, stepToward, stepsTo, vLine,
} from './mirrorMaths';

export type FamilyId = 'move' | 'fold' | 'perp' | 'distance' | 'fixed' | 'marks' | 'count' | 'stepsNum' | 'tool' | 'transfer'
  | 'vertex' | 'crossing' | 'diag' | 'half' | 'oblique' | 'extend' | 'verify' | 'audit' | 'sameShape' | 'orient' | 'bisect'
  | 'locate' | 'slip' | 'exact';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'move', name: 'Which move?' },
  { id: 'fold', name: 'Fold and match' },
  { id: 'perp', name: 'At a right angle?' },
  { id: 'distance', name: 'How far across?' },
  { id: 'fixed', name: 'Who stays put?' },
  { id: 'marks', name: 'Read the marks' },
  { id: 'count', name: 'Count from the line' },
  { id: 'stepsNum', name: 'Count the steps' },
  { id: 'tool', name: 'The right-angle tool' },
  { id: 'transfer', name: 'Transfer the length' },
  { id: 'vertex', name: 'Vertex by vertex' },
  { id: 'crossing', name: 'Touching and crossing' },
  { id: 'diag', name: 'A 45° line' },
  { id: 'half', name: 'Small steps' },
  { id: 'oblique', name: 'A slanted line' },
  { id: 'extend', name: 'The line goes on' },
  { id: 'verify', name: 'Check a pair' },
  { id: 'audit', name: 'Check every vertex' },
  { id: 'sameShape', name: 'Same shape is not enough' },
  { id: 'orient', name: 'The vertex order' },
  { id: 'bisect', name: 'Find the fold' },
  { id: 'locate', name: 'Find the line' },
  { id: 'slip', name: 'Spot the slip' },
  { id: 'exact', name: 'Measured or given?' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

/** an item of this topic: a runtime Item plus its picture */
export interface RefItem extends Item { family: FamilyId; pic: MirrorPic }
type Gen = (R: () => number, n: number, sg?: string) => RefItem;
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, v: number, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r: { kind: 'num', v }, mc }); PROBES.set(it, l); };

// misconception ids
const MC = {
  slide: 'mc.transformations.reflection-as-slide',
  partners: 'mc.transformations.reflection-has-no-unique-point-partners',
  notPerp: 'mc.transformations.reflects-not-perpendicular-to-line',
  eye: 'mc.shapes.judges-parallel-perpendicular-by-eye',
  slanted: 'mc.shapes.distance-along-slanted-segment',
  oneCond: 'mc.transformations.reflection-one-condition-only',
  jumps: 'mc.transformations.reflection-jumps-whole-figure',
  ticks: 'mc.shapes.misreads-tick-and-right-angle-marks',
  looks: 'mc.angles.trusts-diagram-appearance',
  points: 'mc.count.counts-points-not-intervals',
  fromP: 'mc.transformations.reflection-distance-from-point-not-line',
  hv: 'mc.shapes.parallel-perpendicular-tied-to-horizontal-vertical',
  incidence: 'mc.shapes.perpendicular-construction-omits-incidence',
  order: 'mc.coordinate-geometry.vertex-order-ignored',
  overlap: 'mc.transformations.reflection-images-cannot-overlap',
  wholly: 'mc.transformations.reflected-figure-must-be-wholly-across-line',
  gridOnly: 'mc.transformations.transforms-only-grid-points',
  crossing: 'mc.transformations.diagonal-mirror-grid-crossings',
  lineEnds: 'mc.shapes.line-ends-where-drawing-ends',
  oppSides: 'mc.transformations.opposite-sides-suffice-for-reflection',
  wholeLooks: 'mc.shapes.accepts-work-because-whole-looks-right',
  onePoint: 'mc.transformations.one-point-checked-for-whole-figure',
  anyCopy: 'mc.transformations.reflection-equals-any-congruent-copy',
  necessary: 'mc.geometric-proof.necessary-property-as-sufficient-test',
  notBisector: 'mc.transformations.mirror-line-not-perpendicular-bisector',
  onlyVertical: 'mc.transformations.line-symmetry-only-vertical-lines',
  straightedge: 'mc.geometric-proof.straightedge-misaligned',
  reason: 'mc.reasoning-language.reason-not-linked-to-task',
  exact: 'mc.measurement-units.measurement-treated-as-exact',
} as const;

// ---------- html bits ----------
/** a TeX label (A') as HTML (A′) */
const nm = (t: string) => t.replace(/'/g, '′');
const Pp = (s: string) => `<b class="p">${s}</b>`;
const M = B('line m');
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const sq = (n: number) => plural(n, 'square', 'squares');

// ---------- picture transforms (more variety from one generator) ----------
/** every point of a picture through f, the line through g */
function mapPic(p: MirrorPic, f: (q: Pt) => Pt, g: (L: MLine) => MLine, dir: (d: Pt) => Pt, cols: number, rows: number): MirrorPic {
  const poly = (P: Poly): Poly => ({ ...P, pts: P.pts.map(f) });
  const s = p.solve;
  return {
    ...p, cols, rows,
    line: p.line ? g(p.line) : null,
    part: p.part ? [f(p.part[0]), f(p.part[1])] : undefined,
    figure: p.figure?.map(poly), image: p.image?.map(poly),
    pins: p.pins?.map(q => ({ ...q, at: f(q.at) })), imagePins: p.imagePins?.map(q => ({ ...q, at: f(q.at) })),
    spots: p.spots?.map(q => ({ ...q, at: f(q.at) })),
    cands: p.cands?.map(q => ({ ...q, a: f(q.a), b: f(q.b) })),
    segs: p.segs?.map(q => ({ ...q, a: f(q.a), b: f(q.b) })),
    marks: p.marks?.map(q => ({ at: f(q.at), u: dir(q.u), v: dir(q.v) })),
    notes: p.notes?.map(q => ({ ...q, a: f(q.a), b: f(q.b) })),
    solve: s ? { ...s, pts: s.pts.map(q => ({ ...q, from: f(q.from) })), poly: s.poly ? poly(s.poly) : undefined, line: s.line ? g(s.line) : undefined, orient: s.orient?.map(P => P.map(f)) } : undefined,
  };
}
/** mirror the whole picture left-right (x -> cols - x) */
function flipPic(p: MirrorPic): MirrorPic {
  const W = p.cols;
  const g = (L: MLine): MLine => {
    switch (L.kind) {
      case 'v': return vLine(W - L.c);
      case 'h': return L;
      case 'd': return aLine(W + L.c);
      case 'a': return dLine(L.c - W);
      case 'o': return oLine([W - L.at![0], L.at![1]], 180 - L.deg!);
    }
  };
  return mapPic(p, q => [W - q[0], q[1]], g, d => [-d[0], d[1]], p.cols, p.rows);
}
/** swap x and y (a vertical line becomes horizontal) */
function swapPic(p: MirrorPic): MirrorPic {
  const g = (L: MLine): MLine => {
    switch (L.kind) {
      case 'v': return hLine(L.c);
      case 'h': return vLine(L.c);
      case 'd': return dLine(-L.c);
      case 'a': return L;
      case 'o': return oLine([L.at![1], L.at![0]], 90 - L.deg!);
    }
  };
  return mapPic(p, q => [q[1], q[0]], g, d => [d[1], d[0]], p.rows, p.cols);
}
/** a random variant: flipped and / or swapped (swap only when `swap` allows it) */
function vary(R: () => number, p: MirrorPic, swap: boolean | 'force'): MirrorPic {
  let q = p;
  if (R() < 0.5) q = flipPic(q);
  if (swap === 'force' || (swap && R() < 0.5)) q = swapPic(q);
  return q;
}

// ---------- shapes ----------
const SHAPES: { name: string; pts: Pt[] }[] = [
  { name: 'F-shape', pts: [[0, 0], [1, 0], [1, 2], [2, 2], [2, 3], [1, 3], [1, 4], [3, 4], [3, 5], [0, 5]] },
  { name: 'L-shape', pts: [[0, 0], [3, 0], [3, 1], [1, 1], [1, 4], [0, 4]] },
  { name: 'flag', pts: [[0, 0], [0.5, 0], [0.5, 2.5], [2.5, 3.25], [0.5, 4], [0, 4]] },
  { name: 'P-shape', pts: [[0, 0], [1, 0], [1, 2], [3, 2], [3, 4], [0, 4]] },
];
const ext = (P: readonly Pt[]) => ({ x0: Math.min(...P.map(p => p[0])), x1: Math.max(...P.map(p => p[0])), y0: Math.min(...P.map(p => p[1])), y1: Math.max(...P.map(p => p[1])) });
/** a scalene lattice triangle inside [x0, x1] x [y0, y1] (no two sides equal: no symmetry to fool the eye) */
function triangle(R: () => number, x0: number, x1: number, y0: number, y1: number): Pt[] {
  for (let t = 0; t < 200; t++) {
    const P: Pt[] = [[int(R, x0, x1), int(R, y0, y1)], [int(R, x0, x1), int(R, y0, y1)], [int(R, x0, x1), int(R, y0, y1)]];
    const a = dist(P[0]!, P[1]!), b = dist(P[1]!, P[2]!), c = dist(P[2]!, P[0]!);
    const ar = Math.abs((P[1]![0] - P[0]![0]) * (P[2]![1] - P[0]![1]) - (P[2]![0] - P[0]![0]) * (P[1]![1] - P[0]![1]));
    // a readable triangle: area at least 3 squares and no angle under 25° (no slivers)
    const angOk = [[a, c, b], [a, b, c], [b, c, a]].every(([p, q, o]) => Math.acos(Math.max(-1, Math.min(1, (p! * p! + q! * q! - o! * o!) / (2 * p! * q!)))) > (25 * Math.PI) / 180);
    if (ar >= 6 && angOk && Math.abs(a - b) > 0.3 && Math.abs(b - c) > 0.3 && Math.abs(a - c) > 0.3 && Math.min(a, b, c) >= 2) return P;
  }
  return [[x0, y0], [x0 + 2, y0], [x0, y0 + 3]];
}
const TRI = ['A', 'B', 'C', 'D'];
const primes = (n: number) => TRI.slice(0, n).map(t => t + "'");

// ---------- shared builders ----------
interface Opt { t: string; ok: boolean; mc?: string; say: string }
function retry<T>(f: () => T | null): T { for (let i = 0; i < 600; i++) { const v = f(); if (v) return v; } throw new Error('reflections: generator found no item'); }
function verdictOf(opts: readonly Opt[], r: Response): Verdict {
  if (r.kind !== 'choice') return { ok: false, say: 'Pick one of the answers.' };
  const o = opts[r.i];
  if (!o) return { ok: false, say: 'Pick one of the answers.' };
  return { ok: o.ok, mc: o.ok ? undefined : o.mc, say: o.say };
}
interface Base { family: FamilyId; n: number; prompt: string; board: string; pic: MirrorPic; solution: string[]; solveTex?: string[] }
function choiceItem(b: Base, opts: Opt[]): RefItem {
  const right = opts.findIndex(o => o.ok);
  b.pic.solveTex = b.solveTex ?? b.pic.solveTex;
  return {
    id: `${b.family}-${b.n}`, family: b.family, prompt: b.prompt, board: b.board, input: 'choice', choices: opts.map(o => o.t), pic: b.pic,
    solution: b.solution, answer: { kind: 'choice', i: right }, check: r => verdictOf(opts, r),
  };
}
/** numbered spots on the picture; `extra` are text answers after the spots */
interface Cand { at: Pt; ok: boolean; mc?: string; say: string }
function spotItem(R: () => number, b: Base, cands: Cand[], extra: Opt[] = [], swap: boolean | null = null): RefItem {
  const order = shuffle(R, [...cands]);
  b.pic.spots = order.map((c, i) => ({ at: c.at, n: i + 1 }));
  const k = order.findIndex(c => c.ok);
  if (k >= 0 && b.pic.solve) b.pic.solve.spot = k + 1;
  const it = choiceItem(b, [...order.map((c, i) => ({ t: `Spot ${i + 1}`, ok: c.ok, mc: c.mc, say: c.say })), ...extra]);
  // flip / swap the finished picture (spots included) for variety
  if (swap !== null) it.pic = vary(R, it.pic, swap);
  return it;
}
function numItem(b: Base, answer: number, unit: string, classify: (v: number) => Verdict): RefItem {
  b.pic.solveTex = b.solveTex ?? b.pic.solveTex;
  return {
    id: `${b.family}-${b.n}`, family: b.family, prompt: b.prompt, board: b.board, input: 'num', unit, pic: b.pic,
    solution: b.solution, answer: { kind: 'num', v: answer },
    check: r => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      return classify(r.v);
    },
  };
}
/** keep candidates that are on the sheet, apart from each other and from the given points */
function clean(cands: Cand[], cols: number, rows: number, avoid: Pt[], minD = 0.95): Cand[] {
  const out: Cand[] = [];
  for (const c of cands) {
    if (c.at[0] < 0.3 || c.at[0] > cols - 0.3 || c.at[1] < 0.3 || c.at[1] > rows - 0.3) { if (c.ok) return []; continue; }
    if (avoid.some(p => dist(p, c.at) < minD)) { if (c.ok) return []; continue; }
    if (out.some(o => dist(o.at, c.at) < minD)) { if (c.ok) return []; continue; }
    out.push(c);
  }
  return out;
}
const fits = (it: RefItem): RefItem | null => (picFits(it.pic) === null ? it : null);
/** the horizontal / vertical "straight across the page" image (a misconception for slanted lines) */
function across(P: Pt, L: MLine, axis: 'x' | 'y'): Pt | null {
  const { q, u } = lineFrame(L);
  if (axis === 'x') { if (Math.abs(u[1]) < 1e-9) return null; const t = (P[1] - q[1]) / u[1]; const xl = q[0] + t * u[0]; return [2 * xl - P[0], P[1]]; }
  if (Math.abs(u[0]) < 1e-9) return null; const t = (P[0] - q[0]) / u[0]; const yl = q[1] + t * u[1]; return [P[0], 2 * yl - P[1]];
}
const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
const lineWord = (L: MLine) => (L.kind === 'v' || L.kind === 'h' ? 'squares' : 'steps');
/** the counting in a solution, for any grid line */
function countLines(P: Pt, L: MLine, name = 'P'): { html: string[]; tex: string[] } {
  const st = stepsTo(P, L), img = nm(name + "'");
  if (L.kind === 'v' || L.kind === 'h') {
    const d = st.squares;
    return { html: [`Count from ${A(name)} to m, at a right angle: ${sq(d)}.`, `Count ${sq(d)} on beyond m: that is ${S(img)}.`], tex: [`${name}M = ${d}`, `M${name}' = ${d}`] };
  }
  if (L.kind === 'd' || L.kind === 'a') {
    if (st.whole !== null) return { html: [`Step diagonally, corner to corner, at a right angle to m: ${plural(st.whole, 'step', 'steps')} from ${A(name)} to the line.`, `The same ${plural(st.whole, 'step', 'steps')} beyond m lands on ${S(img)}.`], tex: [`${name}M = ${st.whole}\\ \\text{${st.whole === 1 ? 'step' : 'steps'}}`, `M${name}' = ${st.whole}\\ \\text{${st.whole === 1 ? 'step' : 'steps'}}`] };
    return { html: [`Step diagonally in small steps (corner to middle of a square, middle to corner): ${plural(st.small, 'small step', 'small steps')} to m.`, `The same ${plural(st.small, 'small step', 'small steps')} beyond m lands on ${S(img)}.`], tex: [`${name}M = ${st.small}\\ \\text{small ${st.small === 1 ? 'step' : 'steps'}}`, `M${name}' = ${st.small}\\ \\text{small ${st.small === 1 ? 'step' : 'steps'}}`] };
  }
  return { html: [`Slide the right-angle tool along m until its other edge passes through ${A(name)}: that is the perpendicular.`, `Lay the length ${A(name + 'M')} off again beyond M: that is ${S(img)}.`], tex: [`${name}M \\perp m`, `M${name}' = ${name}M`] };
}
const hopsOf = (L: MLine, P: Pt): Solve['hops'] => (L.kind === 'v' || L.kind === 'h' ? 'square' : L.kind === 'o' ? 'none' : stepsTo(P, L).whole === null ? 'half' : 'diag');

// ======================= families =======================

// 1 flip-not-slide: one move took the figure to the copy. Which?
const move: Gen = (R, n, sg) => retry(() => {
  const sh = pick(R, SHAPES), g = int(R, 1, 2);
  const e = ext(sh.pts), w = Math.ceil(e.x1), h = Math.ceil(e.y1);
  const c = 1 + w + g, cols = c + g + w + 1, rows = h + 2;
  const fig = shift(sh.pts, [1, 1]);
  const L = vLine(c), refl = reflectAll(fig, L);
  const kind = pick(R, ['reflect', 'reflect', 'slide', 'turn'] as const);
  const img = kind === 'reflect' ? refl : kind === 'slide' ? shift(fig, [ext(refl).x0 - 1, 0]) : halfTurn(fig, [c, 1 + e.y1 / 2]);
  const base: MirrorPic = { cols, rows, grid: true, line: L, figure: [{ pts: fig, role: 'first' }], image: [{ pts: img, role: 'pick' }], solve: { pts: [], hops: 'none', poly: { pts: refl, role: 'link' } } };
  // the topic's cases: a vertical line first, then horizontal ones
  const pic = vary(R, base, sg === 'flip-not-slide' ? R() < 0.5 : true);
  const what = sh.name;
  const opts: Opt[] = [
    { t: 'A reflection in line m', ok: kind === 'reflect', mc: kind === 'slide' ? MC.slide : undefined,
      say: kind === 'reflect' ? `Yes. The copy faces the other way: it is flipped over m, each point just as far beyond m.` : kind === 'slide' ? `It is on the other side of m, but it faces the same way as the ${what}: that is a slide. A reflection flips it.` : `A reflection keeps every point at its place along m. This copy is turned end over end as well: a half turn.` },
    { t: 'A slide', ok: kind === 'slide', mc: kind === 'reflect' ? MC.slide : undefined,
      say: kind === 'slide' ? 'Yes. It faces the same way, just moved across: a slide (a translation).' : kind === 'reflect' ? 'A slide keeps the shape facing the same way. This copy faces the other way: it is flipped.' : 'A slide keeps it facing the same way. This copy is upside down: a half turn.' },
    { t: 'A half turn', ok: kind === 'turn',
      say: kind === 'turn' ? 'Yes. It is turned end over end about a point on m: a half turn.' : kind === 'reflect' ? 'A half turn would turn it end over end. Here every point stays level with its partner across m: a reflection.' : 'A half turn turns it end over end. This copy faces the same way as before: a slide.' },
  ];
  return fits(choiceItem({
    family: 'move', n, pic, board: '\\text{which move?}',
    prompt: `One move took the ${A(what)} to the ${Pp('purple copy')}. Which move was it?`,
    solution: ['A reflection flips the figure across m: each point goes across at a right angle and lands the same distance beyond.', `The lime outline shows the true reflection of the ${what}. Compare which way the purple copy faces.`,
      kind === 'reflect' ? 'The purple copy matches it: a reflection.' : kind === 'slide' ? 'The purple copy faces the same way as the original: a slide.' : 'The purple copy is turned end over end: a half turn.'],
  }, opts));
});

// 2 fold-correspondence: fold along m; which spot does this point land on?
const fold: Gen = (R, n) => retry(() => {
  const c = int(R, 4, 7), cols = 2 * c, rows = int(R, 6, 8);
  const k = int(R, 2, 4);
  const pts: Pt[] = [];
  for (let t = 0; t < 40 && pts.length < k; t++) {
    const p: Pt = [int(R, 1, c - 1), int(R, 1, rows - 1)];
    if (pts.some(q => dist(q, p) < 1.5)) continue;
    pts.push(p);
  }
  if (pts.length < 2) return null;
  const L = vLine(c), ti = int(R, 0, pts.length - 1), T = pts[ti]!, name = TRI[ti]!;
  const cands: Cand[] = pts.map((p, i) => ({ at: reflect(p, L), ok: i === ti, mc: i === ti ? undefined : MC.partners,
    say: i === ti ? `Yes. ${name} goes straight across m and lands just as far beyond it.` : `That spot is where ${TRI[i]} lands. Every point has its own partner: follow ${name} straight across m.` }));
  if (pts.length === 2) {
    const sh: Pt = add(reflect(T, L), [0, pick(R, [-2, 2])]);
    cands.push({ at: sh, ok: false, mc: MC.oneCond, say: `That spot is as far from m as ${name}, but moved along m. A fold sends ${name} straight across.` });
  }
  const cl = clean(cands, cols, rows, pts);
  if (cl.length < 3) return null;
  const pic: MirrorPic = { cols, rows, grid: true, line: L, pins: pts.map((p, i) => ({ at: p, label: TRI[i], role: 'first' })), solve: { pts: [{ from: T, label: name + "'" }], hops: 'square' } };
  const cnt = countLines(T, L, name);
  return fits(spotItem(R, {
    family: 'fold', n, pic, board: `${name} \\to\\ ?`, solveTex: cnt.tex,
    prompt: `The sheet is folded along ${M}. Which spot does ${A(name)} land on?`,
    solution: [`A fold sends ${A(name)} straight across m, at a right angle.`, ...cnt.html, `${S(nm(name + "'"))} is ${name}'s own partner: each point has exactly one image.`],
  }, cl, [], true));
});

// 3 common-perpendicular: which segment from P crosses m at a right angle?
function lineFor(R: () => number, kinds: readonly MLine['kind'][], cols: number, rows: number): MLine {
  const k = pick(R, kinds);
  if (k === 'v') return vLine(int(R, Math.floor(cols / 2) - 1, Math.ceil(cols / 2) + 1));
  if (k === 'h') return hLine(int(R, Math.floor(rows / 2) - 1, Math.ceil(rows / 2) + 1));
  if (k === 'd') return dLine(int(R, -2, 2) + Math.round((rows - cols) / 2));
  if (k === 'a') return aLine(int(R, -2, 2) + Math.round((rows + cols) / 2));
  return oLine([cols / 2 + (R() - 0.5), rows / 2 + (R() - 0.5)], pick(R, [24, 30, 36, 54, 60, 66, 114, 120, 126, 146, 152]));
}
const perp: Gen = (R, n) => retry(() => {
  const cols = int(R, 10, 12), rows = int(R, 9, 10);
  const L = lineFor(R, ['v', 'h', 'd', 'a', 'd', 'a', 'o', 'o'], cols, rows);
  const grid = L.kind !== 'o';
  const { u, n: nn } = lineFrame(L);
  let P: Pt;
  if (grid) P = [int(R, 1, cols - 1), int(R, 1, rows - 1)];
  else { const F0 = add(lineFrame(L).q, u, (R() - 0.5) * 4); P = add(F0, nn, (R() < 0.5 ? -1 : 1) * (1.8 + R() * 1.4)); }
  const off = offset(P, L);
  if (Math.abs(off) < (L.kind === 'v' || L.kind === 'h' ? 2 : 2.5)) return null;
  const Mf = foot(P, L), s = Math.sign(off);
  // the right one: on the perpendicular through P, on the other side, any distance (no length work here)
  const k = grid ? (L.kind === 'v' || L.kind === 'h' ? int(R, 1, 4) : int(R, 1, 3)) : 1 + R() * 2.2;
  const right: Pt = L.kind === 'v' || L.kind === 'h' ? add(Mf, nn, -s * k) : grid ? add(P, stepToward(P, L), Math.floor(Math.abs(off) / 2) + k) : add(Mf, nn, -s * k);
  const cands: Cand[] = [{ at: right, ok: true, say: 'Yes. That segment meets m at a right angle: it is on the perpendicular through P.' }];
  if (L.kind === 'v' || L.kind === 'h') {
    for (const j of shuffle(R, [-3, -2, 2, 3]).slice(0, 2)) cands.push({ at: add(right, u, j), ok: false, mc: MC.eye, say: 'That segment is slanted against m. Check it with a right-angle tool: the square corner does not fit.' });
  } else {
    const H = across(P, L, 'x'), V = across(P, L, 'y');
    if (H) cands.push({ at: H, ok: false, mc: MC.notPerp, say: 'That one goes straight across the page, level with P. For a slanted line, the right angle is with m, not with the page.' });
    if (V) cands.push({ at: V, ok: false, mc: MC.notPerp, say: 'That one goes straight up or down the page. The right angle has to be with m itself.' });
    cands.push({ at: grid ? add(right, [Math.sign(u[0]) || 1, Math.sign(u[1])], pick(R, [-2, 2])) : add(right, u, pick(R, [-1.6, 1.6])), ok: false, mc: MC.eye, say: 'That segment is slanted against m. Lay the square corner of a card along m: it does not fit.' });
  }
  const cl = clean(cands, cols, rows, [P]);
  if (cl.length < 3) return null;
  const pic: MirrorPic = { cols, rows, grid, line: L, pins: [{ at: P, label: 'P', role: 'first' }], segs: cl.map(c => ({ a: P, b: c.at, role: 'dim' as const, dash: true })), solve: { pts: [{ from: P }], hops: 'none', tool: !grid } };
  return fits(spotItem(R, {
    family: 'perp', n, pic, board: '\\overline{PQ} \\perp m\\ ?',
    prompt: `Each dashed segment runs from ${A('P')} to a spot across ${M}. Which one crosses m at a right angle?`,
    solution: ['The image of P is always on the line through P at a right angle to m (the perpendicular).', grid && L.kind !== 'v' && L.kind !== 'h' ? 'For a 45° line the perpendicular is the other diagonal: corner to corner the other way.' : 'Check with the square corner of a card: one edge along m, the other edge along the segment.', 'Only one segment fits.'],
  }, cl, [], grid ? true : null));
});

// 4 equal-distance-opposite-side: the perpendicular is drawn; which spot is P'?
const distance: Gen = (R, n) => retry(() => {
  const d = int(R, 1, 6), x = 1 + int(R, 0, 1), c = x + d, cols = c + d + int(R, 2, 3), rows = int(R, 6, 8), y = int(R, 2, rows - 2);
  const L = vLine(c), P: Pt = [x, y], I = reflect(P, L);
  const cands: Cand[] = [
    { at: I, ok: true, say: `Yes. P is ${sq(d)} from m, and P′ is ${sq(d)} beyond it, on the same perpendicular.` },
    { at: [c, y], ok: false, mc: MC.fromP, say: `That spot is on the line: it is ${sq(d)} from P, not ${sq(d)} beyond the line. Count from the line.` },
    { at: [c + d + pick(R, [-1, 1]), y], ok: false, mc: MC.points, say: `Count again from the line, one square at a time: P is ${sq(d)} from m, so P′ is exactly ${sq(d)} beyond it.` },
    { at: [c + d, y + pick(R, [-2, -1, 1, 2])], ok: false, mc: MC.oneCond, say: 'That spot is as far from m as P, but moved along m. P′ has to be on the perpendicular through P too.' },
  ];
  if (x + 2 < c) cands.push({ at: [x + 1, y], ok: false, say: 'That spot is on the same side of m as P. The image is on the other side.' });
  const cl = clean(cands, cols, rows, [P]);
  if (cl.length < 3) return null;
  const pic: MirrorPic = { cols, rows, grid: true, line: L, pins: [{ at: P, label: 'P', role: 'first' }], segs: [{ a: [0, y], b: [cols, y], role: 'dim', dash: true }], solve: { pts: [{ from: P, label: "P'" }], hops: 'square' } };
  const cnt = countLines(P, L);
  return fits(spotItem(R, {
    family: 'distance', n, pic, board: "P \\to P'\\ ?", solveTex: cnt.tex,
    prompt: `The dashed line is the perpendicular from ${A('P')} to ${M}. Which spot is ${S('P′')}?`,
    solution: ['P′ is on the perpendicular, on the other side of m.', ...cnt.html, 'm passes through the middle of PP′.'],
  }, cl, [], true));
});

// 5 fixed-points: how many squares does a vertex move? (points on m stay put)
const fixed: Gen = (R, n) => retry(() => {
  const cols = int(R, 9, 11), rows = int(R, 8, 10);
  const moving = R() < 0.35;
  const L = lineFor(R, moving ? ['v', 'h'] : ['v', 'h', 'd', 'a'], cols, rows);
  // a triangle with C on the line
  const Cp: Pt = (() => { for (let t = 0; t < 60; t++) { const p: Pt = [int(R, 2, cols - 2), int(R, 2, rows - 2)]; if (onLine(p, L)) return p; } return null; })() as Pt;
  if (!Cp) return null;
  const side = R() < 0.5 ? 1 : -1;
  const pts: Pt[] = [];
  for (let t = 0; t < 80 && pts.length < 2; t++) {
    const p: Pt = [int(R, 1, cols - 1), int(R, 1, rows - 1)];
    const o = offset(p, L) * side;
    if (o < 1 || o > 4 || dist(p, Cp) < 2 || pts.some(q => dist(q, p) < 2)) continue;
    pts.push(p);
  }
  if (pts.length < 2) return null;
  const tri: Pt[] = [pts[0]!, pts[1]!, Cp];
  if (Math.abs(area2t(tri)) < 8) return null;
  const ask = moving ? 0 : 2, name = TRI[ask]!, Q = tri[ask]!, d = Math.abs(offset(Q, L));
  const ans = moving ? 2 * d : 0;
  const pic: MirrorPic = { cols, rows, grid: true, line: L, figure: [{ pts: tri, labels: ['A', 'B', 'C'], role: 'first' }], solve: { pts: [{ from: Q, label: moving ? name + "'" : undefined }], hops: hopsOf(L, Q), poly: { pts: reflectAll(tri, L), role: 'link' } } };
  const it = numItem({
    family: 'fixed', n, pic, board: `${name} \\to ${name}'`, solveTex: moving ? [`${name}M = ${d}`, `${name}${name}' = ${ans}`] : [`${name}M = 0`, `${name}' = ${name}`],
    prompt: `${A('Triangle ABC')} is reflected in ${M}. How many squares does vertex ${A(name)} move?`,
    solution: moving ? [`${name} is ${sq(d)} from m.`, `${S(nm(name + "'"))} is ${sq(d)} beyond m, so ${name} moves ${d} + ${d} = ${ans} squares.`]
      : [`${name} is on m: it is 0 squares from the line.`, `0 squares beyond the line is still on the line, so ${S(nm(name + "'"))} = ${name}.`, 'Points on the line of reflection stay where they are.'],
  }, ans, 'squares', v => {
    if (v === ans) return { ok: true, say: moving ? `Yes: ${d} squares to m and ${d} beyond, ${ans} in all.` : `Yes: ${name} is on m, so it stays where it is.` };
    if (!moving) return { ok: false, mc: MC.jumps, say: `${name} is ON m: its distance to the line is 0, so its image is 0 squares beyond, at ${name} itself. Points on the line stay put.` };
    if (v === d) return { ok: false, mc: MC.fromP, say: `${d} squares only gets ${name} to the line. It keeps going ${d} more beyond m: ${ans} squares.` };
    return { ok: false, say: `${name} is ${sq(d)} from m and its image is ${sq(d)} beyond: ${ans} squares in all.` };
  });
  if (moving) probe(it, d, MC.fromP); else { probe(it, 1, MC.jumps); probe(it, 2, MC.jumps); }
  return fits(it);
});

// 6 read-diagram-marks: what do the marks say?
const MARK_OPTS = ['Yes: Q is the image of P', 'Not shown: PM and MQ are not marked equal', 'Not shown: no right angle is marked at M'];
const marks: Gen = (R, n) => retry(() => {
  const cols = 12, rows = 9;
  const kase = pick(R, ['same', 'same', 'ticks', 'noRight', 'contra'] as const);
  const deg = pick(R, [25, 35, 145, 155, 70, 110]);
  const L = oLine([6 + R() - 0.5, 4.5 + R() - 0.5], deg), { u, n: nn } = lineFrame(L);
  const Mf = add(lineFrame(L).q, u, (R() - 0.5) * 2);
  const dP = 2.2 + R() * 0.8;
  const P = add(Mf, nn, dP);
  // how it is drawn: 'contra' and 'ticks' look off on purpose (not to scale)
  const Q = kase === 'contra' ? add(add(Mf, nn, -dP * 0.62), u, 0.9) : kase === 'ticks' ? add(Mf, nn, -dP) : add(Mf, nn, -dP);
  const right = kase !== 'noRight';
  const qDir = (() => { const d: Pt = [Q[0] - Mf[0], Q[1] - Mf[1]], l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l] as Pt; })();
  const pic: MirrorPic = {
    cols, rows, grid: false, line: L, notToScale: true,
    pins: [{ at: P, label: 'P', role: 'first' }, { at: Q, label: 'Q', role: 'pick' }, { at: Mf, label: 'M', role: 'dim' }],
    segs: [{ a: P, b: Mf, role: 'dim', ticks: 1 }, { a: Mf, b: Q, role: 'dim', ticks: kase === 'ticks' ? 2 : 1 }],
    marks: right ? [{ at: Mf, u, v: qDir }] : [],
  };
  const okI = kase === 'ticks' ? 1 : kase === 'noRight' ? 2 : 0;
  const opts: Opt[] = MARK_OPTS.map((t, i) => ({ t, ok: i === okI, say: '' }));
  const sayRight = ['Yes. The square at M gives the right angle, and the matching ticks give PM = MQ. Those marks are facts, however the drawing looks.',
    'Right. One tick and two ticks are different marks: nothing says PM = MQ.', 'Right. The ticks say PM = MQ, but nothing says PQ meets m at a right angle.'][okI]!;
  opts[okI]!.say = sayRight;
  opts.forEach((o, i) => {
    if (i === okI) return;
    if (i === 0) { o.mc = kase === 'ticks' ? MC.ticks : MC.looks; o.say = kase === 'ticks' ? 'Look at the ticks again: one tick and two ticks mean different lengths, not equal ones.' : 'It looks like a right angle, but no square is marked at M. A diagram only tells you what is marked.'; }
    else if (kase === 'contra') { o.mc = MC.looks; o.say = 'The drawing looks off, but it is not to scale. The marks say PQ ⊥ m and PM = MQ: those are the facts.'; }
    else o.say = i === 1 ? 'PM and MQ carry matching ticks: they are marked equal.' : 'There is a small square at M: the right angle is marked.';
  });
  return fits(choiceItem({
    family: 'marks', n, pic, board: "Q = P'\\ ?",
    prompt: `The diagram is not to scale. Using only its marks: is ${Pp('Q')} the image of ${A('P')} in ${M}?`,
    solution: ['A small square at M is a given right angle. Matching tick marks are given equal lengths; different tick marks are not.', 'Q is the image only when BOTH are given: PQ ⊥ m and PM = MQ.', 'Do not trust how the drawing looks: it is not to scale.'],
  }, opts));
});

// 7 grid-point-reflect: count from the line, then the same count beyond
const count: Gen = (R, n) => retry(() => {
  const d = int(R, 1, 10), cols = Math.min(22, Math.max(8, 2 * d + 3)), x0 = Math.max(1, Math.floor((cols - 2 * d) / 2)), c = x0 + d, rows = int(R, 4, 6), y = int(R, 1, rows - 1);
  const L = vLine(c), P: Pt = [x0, y], I = reflect(P, L);
  const cands: Cand[] = [
    { at: I, ok: true, say: `Yes: ${sq(d)} to m, and ${sq(d)} beyond.` },
    { at: [c, y], ok: false, mc: MC.fromP, say: `That spot is on m: you went ${sq(d)} from P. Count ${sq(d)} beyond the LINE.` },
    { at: [c + d + 1, y], ok: false, mc: MC.points, say: `One too far. Count the squares (the gaps), not the grid lines: P is ${sq(d)} from m.` },
  ];
  if (d >= 2) cands.push({ at: [c + d - 1, y], ok: false, mc: MC.points, say: `One short. Count the squares from m, one gap at a time: ${d} of them.` });
  const cl = clean(cands, cols, rows, [P], 0.95);
  if (cl.length < 3) return null;
  const pic: MirrorPic = { cols, rows, grid: true, line: L, pins: [{ at: P, label: 'P', role: 'first' }], solve: { pts: [{ from: P, label: "P'" }], hops: 'square' } };
  const cnt = countLines(P, L);
  return fits(spotItem(R, {
    family: 'count', n, pic, board: "P \\to P'\\ ?", solveTex: cnt.tex,
    prompt: `Reflect ${A('P')} in ${M}. Which spot is ${S('P′')}?`,
    solution: cnt.html.concat(['Count from the line, not from P.']),
  }, cl, [], true));
});

// 7 / 12 / 13: count the steps (a number)
const stepsNum: Gen = (R, n, sg) => retry(() => {
  if (sg === 'diagonal-grid-reflect' || sg === 'diagonal-half-steps') {
    const half = sg === 'diagonal-half-steps' || (sg !== 'diagonal-grid-reflect' && R() < 0.5);
    const cols = int(R, 9, 11), rows = int(R, 9, 10);
    const L = lineFor(R, ['d', 'a'], cols, rows);
    const P: Pt = [int(R, 1, cols - 1), int(R, 1, rows - 1)], s = Math.abs(offset(P, L));
    if (half ? s % 2 === 0 || s > 7 : s % 2 === 1 || s < 2 || s > 8) return null;
    if (!onSheet(reflect(P, L), cols, rows)) return null;
    const ans = half ? s : s / 2;
    const pic: MirrorPic = { cols, rows, grid: true, line: L, pins: [{ at: P, label: 'P', role: 'first' }], solve: { pts: [{ from: P, label: "P'" }], hops: half ? 'half' : 'diag' } };
    const cnt = countLines(P, L);
    const it = numItem({
      family: 'stepsNum', n, pic, board: half ? 'PM = \\ ?\\ \\text{small steps}' : 'PM = \\ ?\\ \\text{steps}', solveTex: cnt.tex,
      prompt: half ? `Line m crosses the squares through their middles. Count SMALL steps from ${A('P')} to ${M}, at a right angle to m (a small step goes from a grid corner to the middle of a square, or from the middle to the next corner).`
        : `Count whole diagonal steps (grid corner to grid corner) from ${A('P')} to ${M}, at a right angle to m.`,
      solution: cnt.html,
    }, ans, half ? 'small steps' : 'steps', v => {
      if (v === ans) return { ok: true, say: `Yes: ${plural(ans, half ? 'small step' : 'step', half ? 'small steps' : 'steps')} to the line.` };
      if (half && v === ans - 1) return { ok: false, mc: MC.crossing, say: 'You stopped at the last grid corner. m crosses in the MIDDLE of a square: count that last small step too.' };
      if (!half && v === s) return { ok: false, mc: MC.notPerp, say: `${s} is the count straight across the page. At a right angle to m you step diagonally: ${ans} steps.` };
      if (v === ans + 1) return { ok: false, mc: MC.points, say: 'Count the steps (the gaps), not the corners you pass: start counting after P.' };
      return { ok: false, say: `Step from P toward m along the other diagonal and count: ${ans}.` };
    });
    if (half) { if (ans >= 1) probe(it, ans - 1, MC.crossing); } else probe(it, s, MC.notPerp);
    if (half || ans + 1 !== s) probe(it, ans + 1, MC.points);
    return fits(it);
  }
  const apart = R() < 0.45;
  const d = int(R, 1, 10), cols = Math.min(22, Math.max(8, 2 * d + 3)), x0 = Math.max(1, Math.floor((cols - 2 * d) / 2)), c = x0 + d, rows = int(R, 4, 6), y = int(R, 1, rows - 1);
  const L = vLine(c), P: Pt = [x0, y];
  const pic = vary(R, { cols, rows, grid: true, line: L, pins: [{ at: P, label: 'P', role: 'first' }], solve: { pts: [{ from: P, label: "P'" }], hops: 'square' } }, true);
  const ans = apart ? 2 * d : d;
  const it = numItem({
    family: 'stepsNum', n, pic, board: apart ? "PP' = \\ ?" : 'PM = \\ ?', solveTex: [`PM = ${d}`, `MP' = ${d}`, `PP' = ${2 * d}`],
    prompt: apart ? `${A('P')} is reflected in ${M}. How many squares apart are ${A('P')} and ${S('P′')}?` : `How many squares is ${A('P')} from ${M}? Count from the line, at a right angle to it.`,
    solution: [`P is ${sq(d)} from m.`, `P′ is ${sq(d)} beyond m, so P and P′ are ${d} + ${d} = ${2 * d} squares apart.`],
  }, ans, 'squares', v => {
    if (v === ans) return { ok: true, say: apart ? `Yes: ${d} to m and ${d} beyond.` : `Yes: ${sq(d)}.` };
    if (apart && v === d) return { ok: false, mc: MC.fromP, say: `${d} only gets you from P to the line. P′ is another ${d} beyond it: ${ans}.` };
    if (v === ans + 1 || v === ans - 1) return { ok: false, mc: MC.points, say: 'Count the squares (the gaps between grid lines), not the grid lines themselves.' };
    return { ok: false, say: `Count the squares from P to m: ${d}${apart ? `, then ${d} beyond` : ''}.` };
  });
  if (apart) probe(it, d, MC.fromP);
  probe(it, ans + 1, MC.points);
  return fits(it);
});
const onSheet = (p: Pt, cols: number, rows: number) => p[0] >= 0.5 && p[0] <= cols - 0.5 && p[1] >= 0.5 && p[1] <= rows - 0.5;

// 8 / 14: which line does the right-angle tool draw?
const tool: Gen = (R, n, sg) => retry(() => {
  const cols = 12, rows = 9;
  const oblique = sg === 'oblique-line-tools';
  const L = oblique ? lineFor(R, ['o'], cols, rows) : lineFor(R, ['v', 'h'], cols, rows);
  const { u, n: nn } = lineFrame(L);
  // the foot near the middle of the sheet, so the three candidate lines have room
  const Mf = add(foot([cols / 2, rows / 2], L), u, (R() - 0.5) * 3), P = add(Mf, nn, (R() < 0.5 ? -1 : 1) * (2 + R() * 1.5));
  // P well inside the sheet: its label and the three candidate lines need room
  if (P[0] < 1.5 || P[0] > cols - 1.5 || P[1] < 1.5 || P[1] > rows - 1.5 || !onSheet(reflect(P, L), cols, rows)) return null;
  const miss = add(Mf, u, pick(R, [-1, 1]) * (1.6 + R()));
  const rot = (d: Pt, a: number): Pt => [d[0] * Math.cos(a) - d[1] * Math.sin(a), d[0] * Math.sin(a) + d[1] * Math.cos(a)];
  let third: { a: Pt; b: Pt; mc: string; say: string };
  if (oblique) {
    const vert = Math.abs(u[0]) > Math.abs(u[1]);   // a flatter line: the wrong pick is the page's vertical
    third = { a: P, b: add(P, vert ? [0, 1] : [1, 0]), mc: MC.hv, say: `That line runs straight ${vert ? 'up the page' : 'across the page'}. The right angle has to be with m, which is slanted.` };
  } else third = { a: P, b: add(P, rot(nn, pick(R, [-1, 1]) * (0.3 + R() * 0.12))), mc: MC.eye, say: 'That line passes through P but leans: the square corner of the tool would not fit against m.' };
  const lines: (CandLine & Opt)[] = [
    { a: P, b: Mf, n: 0, t: '', ok: true, say: 'Yes. One edge of the tool lies on m and the other edge passes through P.' },
    { a: miss, b: add(miss, nn), n: 0, t: '', ok: false, mc: MC.incidence, say: 'That line meets m at a right angle, but it misses P. Slide the tool along m until its edge passes through P.' },
    { ...third, n: 0, t: '', ok: false },
  ];
  const order = shuffle(R, lines).map((l, i) => ({ ...l, n: i + 1, t: `Line ${i + 1}` }));
  const right = order.find(l => l.ok)!;
  const pic: MirrorPic = { cols, rows, grid: false, line: L, pins: [{ at: P, label: 'P', role: 'first' }], cands: order.map(l => ({ a: l.a, b: l.b, n: l.n })), solve: { pts: [{ from: P, label: "P'" }], hops: 'none', tool: true, cand: right.n } };
  return fits(choiceItem({
    family: 'tool', n, pic, board: '\\perp m\\ \\text{through}\\ P',
    prompt: `You need the line through ${A('P')} at a right angle to ${M}. You slide a right-angle tool along m. Which dashed line do you draw?`,
    solution: ['Put one edge of the right-angle tool ON m (even when m is slanted).', 'Slide it along m until the other edge passes through P. Draw along that edge.', 'That line meets m at a right angle AND passes through P.'],
  }, order));
});

// 9 transfer-distance: PM is given; how far apart are P and P'?
const transfer: Gen = (R, n) => retry(() => {
  const inches = R() < 0.4;
  const Lg = inches ? pick(R, [1.5, 2, 2.5, 3, 3.5]) : int(R, 2, 6);
  const unit = inches ? 'in' : 'cm';
  const txt = (x: number) => (Number.isInteger(x) ? String(x) : `${Math.floor(x)}½`);
  const c = Math.ceil(Lg) + 1, cols = Math.max(8, Math.ceil(c + Lg + 2)), rows = int(R, 6, 8), y = int(R, 2, rows - 2);
  const L = vLine(c), P: Pt = [c - Lg, y], Mf: Pt = [c, y];
  const base: MirrorPic = { cols, rows, grid: false, line: L, pins: [{ at: P, label: 'P', role: 'first' }, { at: Mf, label: 'M', role: 'dim' }], segs: [{ a: P, b: Mf, role: 'pick', dash: true }], marks: [{ at: Mf, u: [0, 1], v: [-1, 0] }], notes: [{ a: P, b: Mf, text: `${txt(Lg)} ${unit}` }], solve: { pts: [{ from: P, label: "P'" }], hops: 'none', tool: false } };
  const pic = vary(R, base, true);
  const ans = 2 * Lg;
  const it = numItem({
    family: 'transfer', n, pic, board: `PM = ${fmt(Lg)}\\ \\text{${unit}}`, solveTex: [`PM = ${fmt(Lg)}\\ \\text{${unit}}`, `MP' = ${fmt(Lg)}\\ \\text{${unit}}`, `PP' = ${fmt(ans)}\\ \\text{${unit}}`],
    prompt: `The perpendicular ${A('PM')} from ${A('P')} to ${M} is ${txt(Lg)} ${unit} long. You mark P′ by laying PM off again beyond M. How far is ${S('P′')} from ${A('P')}?`,
    solution: [`Lay a paper strip along PM and mark its length: ${txt(Lg)} ${unit}.`, `Lay the same length off from M, beyond the line: MP′ = ${txt(Lg)} ${unit}.`, `So PP′ = ${txt(Lg)} + ${txt(Lg)} = ${txt(ans)} ${unit}.`],
  }, ans, unit, v => {
    if (Math.abs(v - ans) < 1e-9) return { ok: true, say: `Yes: ${txt(Lg)} ${unit} to M and ${txt(Lg)} ${unit} beyond.` };
    if (Math.abs(v - Lg) < 1e-9) return { ok: false, mc: MC.fromP, say: `${txt(Lg)} ${unit} only reaches the line, at M. P′ is another ${txt(Lg)} ${unit} beyond M.` };
    return { ok: false, say: `P to M is ${txt(Lg)} ${unit}; M to P′ is the same. Add them.` };
  });
  probe(it, Lg, MC.fromP);
  return fits(it);
});

// 10 / 11: vertex by vertex: which spot is B'?
const vertex: Gen = (R, n, sg) => retry(() => {
  const cols = int(R, 11, 13), rows = int(R, 8, 10);
  const touchOrCross = sg === 'polygon-touching-crossing';
  const c = Math.floor(cols / 2) + int(R, -1, 0), L = vLine(c);
  let fig: Pt[];
  if (!touchOrCross) {
    const quad = R() < 0.3;
    fig = triangle(R, 1, c - 1, 1, rows - 1);
    if (quad) { const extra: Pt = [int(R, 1, c - 1), int(R, 1, rows - 1)]; const Q = [...fig, extra]; if (!simpleQuad(Q)) return null; fig = Q; }
  } else {
    fig = triangle(R, Math.max(1, c - 4), Math.min(cols - 1, c + 3), 1, rows - 1);
    const offs = fig.map(p => Math.sign(offset(p, L)));
    if (R() < 0.45) { const j = int(R, 0, 2); fig[j] = [c, fig[j]![1]]; if (fig.filter(p => onLine(p, L)).length !== 1) return null; }
    else if (!(offs.includes(1) && offs.includes(-1))) return null;
    if (Math.abs(area2t(fig)) < 3) return null;
  }
  const labels = TRI.slice(0, fig.length);
  const moving = fig.map((p, i) => i).filter(i => !onLine(fig[i]!, L));
  if (moving.length < 2) return null;
  const ti = pick(R, moving), name = labels[ti]!;
  const imgs = reflectAll(fig, L);
  const cands: Cand[] = moving.map(i => ({ at: imgs[i]!, ok: i === ti, mc: i === ti ? undefined : MC.order, say: i === ti ? `Yes. ${name} goes across m at a right angle, just as far beyond.` : `That spot is ${nm(labels[i]! + "'")}, the image of ${labels[i]}. Follow ${name} itself straight across m.` }));
  if (fig.length === 3) {
    const C0 = centroid(fig), sl = 2 * (c - C0[0]);
    cands.push({ at: [fig[ti]![0] + sl, fig[ti]![1]], ok: false, mc: MC.slide, say: `That is where ${name} lands if the whole shape slides across. A reflection flips it: ${name} goes straight across m.` });
  }
  const cl = clean(cands, cols, rows, fig, 0.95);
  if (cl.length < 3) return null;
  const pic: MirrorPic = { cols, rows, grid: true, line: L, figure: [{ pts: fig, labels, role: 'first' }], solve: { pts: [{ from: fig[ti]!, label: name + "'" }], hops: 'square', poly: { pts: imgs, role: 'link' } } };
  const cnt = countLines(fig[ti]!, L, name);
  const what = fig.length === 3 ? 'triangle' : 'quadrilateral';
  return fits(spotItem(R, {
    family: 'vertex', n, pic, board: `${name} \\to ${name}'\\ ?`, solveTex: cnt.tex,
    prompt: `Reflect ${A(`${what} ${labels.join('')}`)} in ${M}, one vertex at a time. Which spot is ${S(nm(name + "'"))}?`,
    solution: [...cnt.html, touchOrCross ? 'A vertex on m stays put; the image may overlap the original.' : 'Do the same for every vertex, then join them in order: A′B′C′.'],
  }, cl, [], true));
});
function area2t(P: Pt[]): number { return (P[1]![0] - P[0]![0]) * (P[2]![1] - P[0]![1]) - (P[2]![0] - P[0]![0]) * (P[1]![1] - P[0]![1]); }
/** a quadrilateral whose sides do not cross and with no three vertices in a line */
function simpleQuad(Q: Pt[]): boolean {
  const cross = (a: Pt, b: Pt, c: Pt, d: Pt) => {
    const o = (p: Pt, q: Pt, r: Pt) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  };
  if (cross(Q[0]!, Q[1]!, Q[2]!, Q[3]!) || cross(Q[1]!, Q[2]!, Q[3]!, Q[0]!)) return false;
  for (let i = 0; i < 4; i++) if (Math.abs(area2t([Q[i]!, Q[(i + 1) % 4]!, Q[(i + 2) % 4]!])) < 2) return false;
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (dist(Q[i]!, Q[j]!) < 2) return false;
  return true;
}

// 11: a figure that touches or crosses m: is the proposed image right?
const crossing: Gen = (R, n) => retry(() => {
  const cols = int(R, 11, 12), rows = int(R, 8, 9), c = Math.floor(cols / 2), L = vLine(c);
  const touch = R() < 0.45;
  const fig = triangle(R, c - 4, c + 3, 1, rows - 1);
  if (touch) { const j = int(R, 0, 2); fig[j] = [c, fig[j]![1]]; if (fig.filter(p => onLine(p, L)).length !== 1 || Math.abs(area2t(fig)) < 3) return null; const o = fig.filter(p => !onLine(p, L)).map(p => Math.sign(offset(p, L))); if (o[0] !== o[1]) return null; }
  else { const o = fig.map(p => Math.sign(offset(p, L))); if (!(o.includes(1) && o.includes(-1)) || o.includes(0)) return null; }
  const truth = reflectAll(fig, L);
  const right = R() < 0.5;
  // the "jumped" copy: the whole figure moved over so it lies on one side of m, away from the original
  let img = truth;
  if (!right) {
    const s = touch ? -Math.sign(fig.map(p => offset(p, L)).find(o => o !== 0)!) : (R() < 0.5 ? 1 : -1);
    const need = touch ? 1 : Math.max(...truth.map(p => -s * offset(p, L))) + 1;
    img = shift(truth, [s * Math.ceil(need), 0]);
    if (img.some(p => !onSheet(p, cols, rows))) return null;
  }
  const opts: Opt[] = touch ? [
    { t: 'Yes: C is on m, so its image is C itself', ok: right, mc: right ? undefined : MC.jumps, say: right ? 'Yes. The vertex on m stays put; the other two go across.' : 'Look at the vertex on m: in the purple copy it moved. A point on m is 0 squares from m, so it stays put.' },
    { t: 'No: the vertex on m must stay where it is', ok: !right, say: right ? 'It does stay where it is: the purple copy shares that vertex with the triangle.' : 'Right. The vertex on m stays put, so the image touches the triangle there.' },
    { t: 'No: every point moves to the other side of m', ok: false, mc: MC.jumps, say: 'Not a point ON m: it is 0 squares from the line, so its image is 0 squares beyond, the point itself.' },
    { t: 'No: an image can not touch the original', ok: false, mc: MC.overlap, say: 'It can. When a vertex is on m, the image shares that vertex with the original.' },
  ] : [
    { t: 'Yes: every vertex is reflected, so the image crosses m too', ok: right, mc: right ? undefined : MC.wholly, say: right ? 'Yes. The vertices on each side go across, so the image crosses m and overlaps the triangle.' : 'Check one vertex: in the purple copy it is not as far beyond m as the vertex is in front of it.' },
    { t: 'No: each vertex must go straight across, just as far', ok: !right, say: right ? 'Each vertex DID go straight across, just as far: check them one by one.' : 'Right. Reflected vertex by vertex, the image crosses m and overlaps the triangle.' },
    { t: 'No: the image must lie all on the other side of m', ok: false, mc: MC.wholly, say: 'Not when the figure crosses m: the part on each side goes to the other side, so the image crosses m too.' },
    { t: 'No: an image can not overlap the original', ok: false, mc: MC.overlap, say: 'It can. A figure that crosses m overlaps its own image.' },
  ];
  const vName = touch ? TRI[fig.findIndex(p => onLine(p, L))]! : '';
  if (touch) { opts[0]!.t = `Yes: ${vName} is on m, so its image is ${vName} itself`; }
  const base: MirrorPic = { cols, rows, grid: true, line: L, figure: [{ pts: fig, labels: ['A', 'B', 'C'], role: 'first' }], image: [{ pts: img, role: 'pick' }], solve: { pts: fig.map((p, i) => ({ from: p, label: onLine(p, L) ? undefined : TRI[i] + "'" })), hops: 'square', poly: { pts: truth, role: 'link' } } };
  const pic = vary(R, base, true);
  return fits(choiceItem({
    family: 'crossing', n, pic, board: '\\triangle ABC \\to\\ ?',
    prompt: touch ? `Triangle ${A('ABC')} touches ${M}. Ben says the ${Pp('purple triangle')} is its reflection. Is he right?` : `Triangle ${A('ABC')} crosses ${M}. Ben says the ${Pp('purple triangle')} is its reflection. Is he right?`,
    solution: ['Reflect vertex by vertex: each goes across m at a right angle, just as far beyond.', touch ? 'A vertex ON m is its own image, so the image touches the original there.' : 'Vertices on each side swap sides, so the image crosses m and overlaps the original.', `The lime triangle is the true image. ${right ? 'Ben is right.' : 'Ben moved the whole triangle instead.'}`],
  }, opts));
});

// 12: 45° line, whole diagonal steps
const diag: Gen = (R, n) => retry(() => {
  const cols = int(R, 9, 11), rows = int(R, 9, 10);
  const L = lineFor(R, ['d', 'a'], cols, rows);
  const P: Pt = [int(R, 1, cols - 1), int(R, 1, rows - 1)], s = Math.abs(offset(P, L));
  if (s % 2 === 1 || s < 2 || s > 8) return null;
  const I = reflect(P, L), st = stepToward(P, L), w = s / 2;
  const H = across(P, L, 'x'), V = across(P, L, 'y');
  const cands: Cand[] = [
    { at: I, ok: true, say: `Yes: ${plural(w, 'diagonal step', 'diagonal steps')} to m and the same beyond.` },
    ...(H ? [{ at: H, ok: false, mc: MC.notPerp, say: 'That spot is straight across the page, level with P. At a right angle to a 45° line you step diagonally.' }] : []),
    ...(V ? [{ at: V, ok: false, mc: MC.notPerp, say: 'That spot is straight up or down the page. The right angle is with m: step along the other diagonal.' }] : []),
    { at: add(I, st, -1), ok: false, mc: MC.points, say: `One diagonal step too far. Count the steps (corner to corner), not the corners: ${w} to m, ${w} beyond.` },
    ...(w >= 2 ? [{ at: add(I, st, 1), ok: false, mc: MC.points, say: `One diagonal step short: ${w} to m, then ${w} beyond.` }] : []),
  ];
  const cl = clean(shuffle(R, cands.slice(1)).slice(0, 3).concat(cands.slice(0, 1)), cols, rows, [P]);
  if (cl.length < 3) return null;
  const pic: MirrorPic = { cols, rows, grid: true, line: L, pins: [{ at: P, label: 'P', role: 'first' }], solve: { pts: [{ from: P, label: "P'" }], hops: 'diag' } };
  const cnt = countLines(P, L);
  return fits(spotItem(R, {
    family: 'diag', n, pic, board: "P \\to P'\\ ?", solveTex: cnt.tex,
    prompt: `${M} runs at 45° through grid corners. Reflect ${A('P')} in m. Which spot is ${S('P′')}?`,
    solution: ['At a right angle to a 45° line, you move along the OTHER diagonal.', ...cnt.html],
  }, cl));
});

// 13: 45° line crossed at a cell centre: small steps
const half: Gen = (R, n) => retry(() => {
  const cols = int(R, 9, 11), rows = int(R, 9, 10);
  const L = lineFor(R, ['d', 'a'], cols, rows);
  const P: Pt = [int(R, 1, cols - 1), int(R, 1, rows - 1)], s = Math.abs(offset(P, L));
  if (s % 2 === 0 || s > 7) return null;
  const I = reflect(P, L), st = stepToward(P, L), H = across(P, L, 'x');
  const cands: Cand[] = [{ at: I, ok: true, say: `Yes: ${plural(s, 'small step', 'small steps')} to the middle of the square on m, and ${s} beyond.` }];
  if (s >= 3) cands.push({ at: add(I, st, 1), ok: false, mc: MC.crossing, say: 'That spot is one diagonal step short: the count stopped at the last grid corner before m. m is crossed in the MIDDLE of a square.' });
  else cands.push({ at: add(I, st, -1), ok: false, mc: MC.points, say: 'One diagonal step too far. Count small steps: 1 to the middle of the square on m, 1 beyond.' });
  if (H) cands.push({ at: H, ok: false, mc: MC.notPerp, say: 'That is straight across the page. At a right angle to m you step diagonally.' });
  cands.push({ at: add(I, st, -1), ok: false, mc: MC.points, say: 'One diagonal step too far: count the small steps again.' });
  const cl = clean(cands, cols, rows, [P]);
  if (cl.length < 3) return null;
  const pic: MirrorPic = { cols, rows, grid: true, line: L, pins: [{ at: P, label: 'P', role: 'first' }], solve: { pts: [{ from: P, label: "P'" }], hops: 'half' } };
  const cnt = countLines(P, L);
  return fits(spotItem(R, {
    family: 'half', n, pic, board: "P \\to P'\\ ?", solveTex: cnt.tex,
    prompt: `Reflect ${A('P')} in ${M}. Stepping diagonally from P, you cross m in the middle of a square. Which spot is ${S('P′')}?`,
    solution: ['Step along the other diagonal, in small steps: grid corner to the middle of a square, middle to the next corner.', ...cnt.html, 'Any point can be reflected, also when m crosses a square in the middle.'],
  }, cl, [{ t: 'None: m crosses in the middle of a square, so P has no image', ok: false, mc: MC.gridOnly, say: 'P still has an image. Count small steps to the middle of the square on m, then the same number beyond.' }]));
});

// 14: an oblique line on plain paper
const oblique: Gen = (R, n) => retry(() => {
  const cols = 12, rows = 9;
  const L = lineFor(R, ['o'], cols, rows), { u, n: nn, q } = lineFrame(L);
  const Mf = add(q, u, (R() - 0.5) * 3), P = add(Mf, nn, (R() < 0.5 ? -1 : 1) * (2 + R() * 1.4)), I = reflect(P, L);
  const H = across(P, L, 'x'), V = across(P, L, 'y');
  const cands: Cand[] = [
    { at: I, ok: true, say: 'Yes: on the perpendicular through P, just as far beyond m.' },
    ...(H ? [{ at: H, ok: false, mc: MC.notPerp, say: 'That spot is straight across the page, level with P. The tool goes along m, not along the paper edge.' }] : []),
    ...(V ? [{ at: V, ok: false, mc: MC.hv, say: 'That spot is straight up or down the page. Perpendicular to m does not mean vertical when m is slanted.' }] : []),
    { at: add(I, u, pick(R, [-1.8, 1.8])), ok: false, mc: MC.oneCond, say: 'That spot is as far from m as P, but moved along m. P′ must be on the perpendicular through P.' },
  ];
  const cl = clean(cands, cols, rows, [P], 1.1);
  if (cl.length < 3) return null;
  const pic: MirrorPic = { cols, rows, grid: false, line: L, pins: [{ at: P, label: 'P', role: 'first' }], solve: { pts: [{ from: P, label: "P'" }], hops: 'none', tool: true } };
  const cnt = countLines(P, L);
  return fits(spotItem(R, {
    family: 'oblique', n, pic, board: "P \\to P'\\ ?", solveTex: cnt.tex,
    prompt: `Plain paper, a slanted ${M}. You use a ruler and a right-angle tool. Which spot is ${S('P′')}?`,
    solution: cnt.html.concat(['Check with tracing paper: fold along m and P lands on P′.']),
  }, cl));
});

// 15: only part of m is drawn
const extend: Gen = (R, n) => retry(() => {
  const cols = 11, rows = 9;
  const grid = R() < 0.5;
  let L: MLine, part: [Pt, Pt], P: Pt;
  if (grid) {
    const c = int(R, 4, 6); L = vLine(c);
    const y0 = int(R, 1, 2), y1 = y0 + int(R, 2, 3); part = [[c, y0], [c, y1]];
    const d = int(R, 2, 3);
    P = [c - d * (R() < 0.5 ? 1 : -1), int(R, y1 + 2, rows - 1)];
  } else {
    L = oLine([5 + R(), 3.5 + R()], pick(R, [28, 34, 146, 152, 62, 118]));
    const { u, n: nn, q } = lineFrame(L);
    part = [add(q, u, -1.6), add(q, u, 1.6)];
    const Mf = add(q, u, pick(R, [-1, 1]) * (3.2 + R() * 0.8));
    P = add(Mf, nn, (R() < 0.5 ? -1 : 1) * (1.6 + R() * 0.8));
  }
  const I = reflect(P, L), Mf = foot(P, L);
  // the foot must be beyond the drawn piece
  const { u } = lineFrame(L), tA = (part[0][0] - Mf[0]) * u[0] + (part[0][1] - Mf[1]) * u[1], tB = (part[1][0] - Mf[0]) * u[0] + (part[1][1] - Mf[1]) * u[1];
  if (Math.sign(tA) !== Math.sign(tB) || Math.min(Math.abs(tA), Math.abs(tB)) < 0.9) return null;
  const E = Math.abs(tA) < Math.abs(tB) ? part[0] : part[1];
  const cands: Cand[] = [
    { at: I, ok: true, say: 'Yes. m goes on past the drawn piece: extend it, and the perpendicular from P meets it there.' },
    { at: [2 * E[0] - P[0], 2 * E[1] - P[1]], ok: false, mc: MC.slanted, say: 'That spot uses the end of the drawn piece. The distance to m is measured at a right angle to m, after you extend the line.' },
    { at: add(I, u, pick(R, [-2, 2]) * (Math.sign(tA) || 1)), ok: false, mc: MC.oneCond, say: 'That spot is as far from m as P, but moved along m. It must be on the perpendicular through P.' },
  ];
  const cl = clean(cands, cols, rows, [P], 1.0);
  if (cl.length < 3) return null;
  const pic: MirrorPic = { cols, rows, grid, line: L, part, pins: [{ at: P, label: 'P', role: 'first' }], solve: { pts: [{ from: P, label: "P'" }], hops: grid ? 'square' : 'none', tool: !grid } };
  const cnt = countLines(P, L);
  return fits(spotItem(R, {
    family: 'extend', n, pic, board: "P \\to P'\\ ?", solveTex: cnt.tex,
    prompt: `Only part of ${M} is drawn; the arrowheads show it goes on. Reflect ${A('P')} in m. Which is ${S('P′')}?`,
    solution: ['A line has no ends: the drawn piece is only part of m. Extend it.', ...cnt.html],
  }, cl, [{ t: 'P has no image: it is past the end of m', ok: false, mc: MC.lineEnds, say: 'A line goes on forever; the arrowheads say so. Extend m and reflect P as usual.' }]));
});

// 16: is Q the image of P? name the failed condition
const VERIFY = ['Yes: Q is the image of P', 'No: PQ does not cross m at a right angle', 'No: Q is not as far from m as P', 'No: Q is on the same side of m as P'];
const verify: Gen = (R, n) => retry(() => {
  const cols = int(R, 10, 11), rows = int(R, 8, 9);
  const L = lineFor(R, ['v', 'h', 'd', 'a'], cols, rows);
  const kase = pick(R, ['ok', 'ok', 'shift', 'unequal', 'same', 'fixed'] as const);
  const vh = L.kind === 'v' || L.kind === 'h';
  let P: Pt = [int(R, 1, cols - 1), int(R, 1, rows - 1)];
  if (kase === 'fixed') { let t = 0; while (!onLine(P, L) && t++ < 80) P = [int(R, 1, cols - 1), int(R, 1, rows - 1)]; if (!onLine(P, L)) return null; }
  const s = Math.abs(offset(P, L));
  if (kase !== 'fixed' && (vh ? s < 2 || s > 4 : s % 2 === 1 || s < 2 || s > 6)) return null;
  const I = reflect(P, L), { u } = lineFrame(L), st = stepToward(P, L), along: Pt = vh ? u : [Math.sign(u[0]), Math.sign(u[1])];
  const Q: Pt = kase === 'ok' ? I : kase === 'shift' ? add(I, along, pick(R, [-2, -1, 1, 2])) : kase === 'unequal' ? add(I, st, pick(R, [-1, 1])) : kase === 'same' ? add(P, st, 1) : add(P, [Math.sign(lineFrame(L).n[0]), Math.sign(lineFrame(L).n[1])], vh ? 2 : 1);
  if (kase === 'same' && Math.abs(offset(Q, L)) < 0.5) return null;
  if (kase === 'unequal' && Math.sign(offset(Q, L)) !== -Math.sign(offset(P, L))) return null;
  if (!onSheet(Q, cols, rows) || dist(P, Q) < 0.9) return null;
  const opts: Opt[] = VERIFY.map(t => ({ t, ok: false, say: '' }));
  if (kase === 'fixed') opts[3] = { t: 'No: P is on m, so its image is P itself', ok: false, say: '' };
  const okI = { ok: 0, shift: 1, unequal: 2, same: 3, fixed: 3 }[kase];
  opts[okI]!.ok = true;
  opts[okI]!.say = ['Yes. PQ crosses m at a right angle and m cuts it in half.', 'Right. Q is as far from m as P, but PQ is slanted against m: Q is moved along the line.', 'Right. PQ meets m at a right angle, but Q is not as far from m as P is.', kase === 'fixed' ? 'Right. A point on m is its own image.' : 'Right. Q has not crossed m at all.'][okI]!;
  opts.forEach((o, i) => {
    if (o.ok) return;
    if (i === 0) { o.mc = kase === 'shift' ? MC.oneCond : kase === 'unequal' ? MC.oppSides : kase === 'fixed' ? MC.jumps : undefined; o.say = kase === 'shift' ? 'Equal distance is not enough: PQ must also cross m at a right angle. Here Q is moved along m.' : kase === 'unequal' ? 'Being on the other side is not enough: Q must be just as far from m as P.' : kase === 'fixed' ? 'P is on m: it is 0 from the line, so it stays put. Q is not P.' : 'Check both sides of m: Q has not crossed it.'; }
    else { o.mc = MC.reason; o.say = kase === 'ok' ? 'Check it: that condition holds here. Every condition holds, so Q is the image.' : 'That condition holds here. Check each one: right angle, equal distance, other side.'; }
  });
  const pic0: MirrorPic = { cols, rows, grid: true, line: L, pins: [{ at: P, label: 'P', role: 'first' }, { at: Q, label: 'Q', role: 'pick' }], segs: kase === 'fixed' ? [] : [{ a: P, b: Q, role: 'dim', dash: true }], solve: { pts: [{ from: P, label: kase === 'fixed' || kase === 'ok' ? undefined : "P'" }], hops: hopsOf(L, P) } };
  const pic = vary(R, pic0, true);
  return fits(choiceItem({
    family: 'verify', n, pic, board: "Q = P'\\ ?",
    prompt: `Is ${Pp('Q')} the image of ${A('P')} in ${M}? Check every condition.`,
    solution: ['Q is the image of P only if ALL of these hold:', 'PQ crosses m at a right angle; Q is just as far from m as P, on the other side. (A point on m is its own image.)', okI === 0 ? 'All hold here.' : `Here it fails: ${opts[okI]!.t.replace(/^No: /, '')}.`],
  }, opts));
});

// 17: audit every vertex of a proposed image
const AUDIT = ['It is the reflection: every vertex checks', 'Only A′ fails', 'Only B′ fails', 'Only C′ fails', 'Every vertex fails: it is reflected in a different line'];
const audit: Gen = (R, n) => retry(() => {
  const cols = int(R, 11, 13), rows = int(R, 8, 10), c = Math.floor(cols / 2), L = vLine(c);
  const fig = triangle(R, 1, c - 1, 1, rows - 1);
  const kase = pick(R, ['ok', 'one', 'one', 'parallel'] as const);
  let img = reflectAll(fig, L), bad = -1;
  if (kase === 'one') { bad = int(R, 0, 2); const d = pick(R, [[1, 0], [-1, 0], [0, 1], [0, -1]] as Pt[]); img = img.map((p, i) => (i === bad ? add(p, d) : p)); if (img.some(p => offset(p, L) <= 0)) return null; }
  if (kase === 'parallel') img = reflectAll(fig, vLine(c + pick(R, [-1, 1])));
  if (img.some(p => !onSheet(p, cols, rows))) return null;
  const okI = kase === 'ok' ? 0 : kase === 'one' ? 1 + bad : 4;
  const opts: Opt[] = AUDIT.map((t, i) => ({ t, ok: i === okI, say: '' }));
  opts.forEach((o, i) => {
    if (o.ok) { o.say = ['Yes. Each vertex pair crosses m at a right angle and is cut in half by m.', '', '', '', 'Right. Every image is one square off: the triangle was reflected in a line next to m.'][i] || `Right. ${AUDIT[i]!.replace('Only ', '').replace(' fails', '')} is one square off; the other two check.`; return; }
    if (i === 0) { o.mc = kase === 'one' ? MC.onePoint : MC.wholeLooks; o.say = kase === 'one' ? `It looks right, but check EVERY vertex: ${nm(TRI[bad]! + "'")} is one square off.` : 'It looks right, but count the squares for each pair: every image is one square off.'; }
    else o.say = kase === 'ok' ? 'Count again: that vertex is just as far beyond m as its partner is in front.' : 'Count the squares from m for each pair, one at a time.';
  });
  const pic = vary(R, { cols, rows, grid: true, line: L, figure: [{ pts: fig, labels: ['A', 'B', 'C'], role: 'first' }], image: [{ pts: img, labels: ["A'", "B'", "C'"], role: 'pick' }], solve: { pts: fig.map(p => ({ from: p })), hops: 'square', poly: { pts: reflectAll(fig, L), role: 'link' } } }, true);
  return fits(choiceItem({
    family: 'audit', n, pic, board: "\\triangle A'B'C'\\ ?",
    prompt: `Jada reflected ${A('triangle ABC')} in ${M} and drew ${Pp('A′B′C′')}. Check every vertex pair. What do you find?`,
    solution: ['Check each pair on its own: does AA′ cross m at a right angle, with A′ just as far beyond?', 'Then B and B′, then C and C′. One good pair says nothing about the others.', 'The lime triangle is the true image.'],
  }, opts));
});

// 18: same size and shape is not enough
const SAME = ['Yes: every vertex and its image check', 'No: it is flipped, then moved along m', 'No: it is the reflection in a different line', 'No: it is only slid, not flipped'];
const sameShape: Gen = (R, n) => retry(() => {
  const cols = int(R, 12, 14), rows = int(R, 8, 10), c = Math.floor(cols / 2), L = vLine(c);
  const fig = triangle(R, 1, c - 2, 1, rows - 1);
  const kase = pick(R, ['ok', 'glide', 'parallel', 'slide'] as const);
  const refl = reflectAll(fig, L);
  const img = kase === 'ok' ? refl : kase === 'glide' ? shift(refl, [0, pick(R, [-2, -1, 1, 2])]) : kase === 'parallel' ? reflectAll(fig, vLine(c + pick(R, [-1, 1]))) : shift(fig, [ext(refl).x0 - ext(fig).x0, 0]);
  if (img.some(p => !onSheet(p, cols, rows))) return null;
  const okI = { ok: 0, glide: 1, parallel: 2, slide: 3 }[kase];
  const opts: Opt[] = SAME.map((t, i) => ({ t, ok: i === okI, say: i === okI ? ['Yes. Every pair crosses m at a right angle, just as far beyond.', 'Right. It is flipped, but every vertex is shifted along m: the pairs are slanted.', 'Right. Every vertex is one square off: it is the reflection in a line next to m.', 'Right. It faces the same way: it was slid across, not flipped.'][i]! : '' }));
  opts.forEach((o, i) => {
    if (o.ok) return;
    if (i === 0) { o.mc = MC.anyCopy; o.say = 'Same size and shape is not enough. Check a vertex pair: does it cross m at a right angle, just as far beyond?'; }
    else o.say = 'Check a vertex pair against m: is it at a right angle? Just as far? And which way does the copy face?';
  });
  const pic = vary(R, { cols, rows, grid: true, line: L, figure: [{ pts: fig, labels: ['A', 'B', 'C'], role: 'first' }], image: [{ pts: img, labels: ["A'", "B'", "C'"], role: 'pick' }], solve: { pts: [], hops: 'none', poly: { pts: refl, role: 'link' } } }, true);
  return fits(choiceItem({
    family: 'sameShape', n, pic, board: "\\triangle A'B'C' \\cong \\triangle ABC",
    prompt: `${Pp('A′B′C′')} has the same size and shape as ${A('ABC')}. Is it the reflection of ABC in ${M}?`,
    solution: ['Same size and shape only says it is a copy. A reflection in m also puts each vertex in one exact place.', 'Check a pair: AA′ must cross m at a right angle, with A′ just as far beyond.', 'The lime triangle is the reflection in m.'],
  }, opts));
});

// 19: vertex order: a quick rejection test, never a proof
const ORIENT = ['Same way round: it can not be a reflection', 'Reversed: so it is the reflection in m', 'Reversed: that alone can not decide; check the vertex pairs'];
const orient: Gen = (R, n) => retry(() => {
  const cols = int(R, 12, 14), rows = int(R, 9, 11), c = Math.floor(cols / 2), L = vLine(c);
  const fig = triangle(R, 1, c - 2, 1, rows - 4);
  const kase = pick(R, ['slide', 'turn', 'reflect', 'glide', 'stretch'] as const);
  const refl = reflectAll(fig, L);
  let img: Pt[];
  if (kase === 'slide') img = shift(fig, [ext(refl).x0 - ext(fig).x0, int(R, -1, 1)]);
  else if (kase === 'turn') { const C: Pt = [c, Math.round(centroid(fig)[1])]; img = R() < 0.5 ? halfTurn(fig, C) : fig.map(p => [C[0] - (p[1] - C[1]), C[1] + (p[0] - C[0])] as Pt); }
  else if (kase === 'reflect') img = refl;
  else if (kase === 'glide') img = shift(refl, [0, pick(R, [-2, 2])]);
  else { const y0 = Math.min(...refl.map(p => p[1])); img = refl.map(p => [p[0], y0 + 2 * (p[1] - y0)] as Pt); }
  if (img.some(p => !onSheet(p, cols, rows)) || img.some(p => offset(p, L) <= 0)) return null;
  const same = kase === 'slide' || kase === 'turn';
  if ((orientation(img) === orientation(fig)) !== same) return null;
  const okI = same ? 0 : 2;
  const opts: Opt[] = ORIENT.map((t, i) => ({ t, ok: i === okI, say: '' }));
  opts[okI]!.say = same ? 'Right. A reflection always reverses the order; this one keeps it, so it is not a reflection.' : 'Right. Reversed order is needed, but it is not enough. Only the vertex pairs can decide.';
  opts.forEach((o, i) => {
    if (o.ok) return;
    if (i === 1) { o.mc = MC.necessary; o.say = 'Every reflection reverses the order, but so do other copies (shifted or stretched flips). Reversed order can not prove a reflection.'; }
    else o.say = same ? 'Read the order again: A′ → B′ → C′ turns the same way as A → B → C. A reflection would reverse it.' : 'Read the order again: A′ → B′ → C′ turns the other way. That rules nothing out.';
  });
  const pic = vary(R, { cols, rows, grid: true, line: L, figure: [{ pts: fig, labels: ['A', 'B', 'C'], role: 'first' }], image: [{ pts: img, labels: ["A'", "B'", "C'"], role: 'pick' }], solve: { pts: [], hops: 'none', orient: [fig, img] } }, true);
  return fits(choiceItem({
    family: 'orient', n, pic, board: "A \\to B \\to C",
    prompt: `Go around ${A('A → B → C')}, then around ${Pp('A′ → B′ → C′')}. What does the order ALONE tell you about a reflection in ${M}?`,
    solution: ['A reflection always reverses the order (clockwise becomes counterclockwise).', 'So the same order rules a reflection out at once.', 'Reversed order is not enough: a shifted or stretched flip reverses it too. Then check the vertex pairs.'],
  }, opts));
});

// 20: fold A onto A': which line is the crease?
const bisect: Gen = (R, n) => retry(() => {
  const cols = int(R, 10, 12), rows = int(R, 9, 10);
  const diagonal = R() < 0.4;
  const k = int(R, 1, 3);
  let A0: Pt, A1: Pt, right: CandLine, notPerp: CandLine, off: CandLine, line: MLine;
  if (!diagonal) {
    A0 = [int(R, 1, cols - 1 - 2 * k), int(R, 2, rows - 2)]; A1 = [A0[0] + 2 * k, A0[1]];
    const mx = A0[0] + k;
    line = vLine(mx);
    right = { a: [mx, 0], b: [mx, 1], n: 0 };
    notPerp = { a: [mx, A0[1]], b: [mx + 1, A0[1] + pick(R, [-1, 1])], n: 0 };
    const o = mx + pick(R, [-1, 1]); off = { a: [o, 0], b: [o, 1], n: 0 };
  } else {
    A0 = [int(R, 1, cols - 1 - 2 * k), int(R, 1, rows - 1 - 2 * k)]; A1 = [A0[0] + 2 * k, A0[1] + 2 * k];
    const m: Pt = [A0[0] + k, A0[1] + k];
    line = aLine(m[0] + m[1]);
    right = { a: m, b: [m[0] + 1, m[1] - 1], n: 0 };
    notPerp = { a: m, b: [m[0], m[1] + 1], n: 0 };
    const o: Pt = [m[0] + 1, m[1] + 1]; off = { a: o, b: [o[0] + 1, o[1] - 1], n: 0 };
  }
  const items: (CandLine & Opt)[] = shuffle(R, [
    { ...right, t: '', ok: true, say: 'Yes. That crease goes through the middle of AA′ and crosses it at a right angle.' },
    { ...notPerp, t: '', ok: false, mc: MC.notBisector, say: 'That line goes through the middle of AA′, but it is not at a right angle to it. The fold would not put A on A′.' },
    { ...off, t: '', ok: false, mc: MC.oppSides, say: 'That line is at a right angle to AA′, but not through its middle: A and A′ are not the same distance from it.' },
  ]).map((x, i) => ({ ...x, n: i + 1, t: `Line ${i + 1}` }));
  const pic0: MirrorPic = { cols, rows, grid: true, line: null, pins: [{ at: A0, label: 'A', role: 'first' }, { at: A1, label: "A'", role: 'link' }], segs: [{ a: A0, b: A1, role: 'dim', dash: true }], cands: items.map(x => ({ a: x.a, b: x.b, n: x.n })), solve: { pts: [], hops: 'none', line, cand: items.find(x => x.ok)!.n } };
  const pic = diagonal ? (R() < 0.5 ? flipPic(pic0) : pic0) : vary(R, pic0, true);
  return fits(choiceItem({
    family: 'bisect', n, pic, board: "A \\to A'",
    prompt: `You fold the paper so that ${A('A')} lands exactly on ${S('A′')}. Which dashed line is the crease?`,
    solution: ['The crease is the line of reflection that sends A to A′.', 'Count equal steps in from A and from A′ to find the middle of AA′.', 'The crease goes through that middle point at a right angle to AA′: the perpendicular bisector.'],
  }, items));
});

// 21: a figure and its image: which line is the line of reflection?
const locate: Gen = (R, n) => retry(() => {
  const cols = int(R, 11, 12), rows = int(R, 9, 11);
  const L = lineFor(R, ['v', 'h', 'd', 'a', 'd', 'a'], cols, rows);
  const fig = triangle(R, 1, cols - 1, 1, rows - 1);
  // sometimes one vertex sits on the line: it stays put, but alone it can not fix the line
  const onV = R() < 0.4 ? int(R, 0, 2) : -1;
  if (onV >= 0) { const F = foot(fig[onV]!, L); if (!Number.isInteger(F[0]) || !Number.isInteger(F[1])) return null; fig[onV] = F; if (Math.abs(area2t(fig)) < 4) return null; }
  const moving = fig.filter((_, i) => i !== onV);
  if (moving.some(p => Math.abs(offset(p, L)) < 1) || new Set(moving.map(p => Math.sign(offset(p, L)))).size !== 1) return null;
  const img = reflectAll(fig, L);
  if (img.some(p => !onSheet(p, cols, rows))) return null;
  const slanted = L.kind === 'd' || L.kind === 'a';
  const i0 = onV === 0 ? 1 : 0;
  const mA: Pt = onV >= 0 ? fig[onV]! : [(fig[i0]![0] + img[i0]![0]) / 2, (fig[i0]![1] + img[i0]![1]) / 2];
  const { u } = lineFrame(L);
  const thru = (L0: MLine): { a: Pt; b: Pt } => { const f = lineFrame(L0); return { a: f.q, b: add(f.q, f.u) }; };
  const right = thru(L);
  // a line through the midpoint of AA' only, turned 45°
  const turned: Pt = slanted ? (Math.abs(u[0] - u[1]) < 1e-9 ? [1, 0] : [0, 1]) : [1, L.kind === 'v' ? 1 : -1];
  const wrong1 = { a: mA, b: add(mA, turned) };
  const shiftN = lineFrame(L).n, wrong2 = { a: add(right.a, shiftN, slanted ? Math.SQRT2 : 1), b: add(right.b, shiftN, slanted ? Math.SQRT2 : 1) };
  const items: (CandLine & Opt)[] = shuffle(R, [
    { ...right, n: 0, t: '', ok: true, say: 'Yes. It is the perpendicular bisector of AA′, and it works for BB′ and CC′ too.' },
    onV >= 0 ? { ...wrong1, n: 0, t: '', ok: false, mc: MC.straightedge, say: `That line goes through ${TRI[onV]}, which stays put, but one point does not fix a line. Check a moving pair: it must be cut in half at a right angle.` }
      : { ...wrong1, n: 0, t: '', ok: false, mc: slanted ? MC.onlyVertical : MC.onePoint, say: slanted ? 'That line is level with the page, but the line of reflection can be slanted: it must cross AA′ at a right angle.' : 'That line goes through the middle of AA′ only. Check a second pair: BB′ is not cut in half at a right angle.' },
    { ...wrong2, n: 0, t: '', ok: false, mc: MC.onePoint, say: 'That line is parallel to the right one but one step off: it does not cut AA′ in half. Check the pairs.' },
  ]).map((x, i) => ({ ...x, n: i + 1, t: `Line ${i + 1}` }));
  const pic: MirrorPic = { cols, rows, grid: true, line: null, figure: [{ pts: fig, labels: ['A', 'B', 'C'], role: 'first' }], image: [{ pts: img, labels: ["A'", "B'", "C'"].map((t, i) => (i === onV ? null : t)), role: 'link' }], cands: items.map(x => ({ a: x.a, b: x.b, n: x.n })), solve: { pts: [], hops: 'none', line: L, cand: items.find(x => x.ok)!.n } };
  return fits(choiceItem({
    family: 'locate', n, pic, board: "\\triangle ABC \\to \\triangle A'B'C'",
    prompt: `${S('A′B′C′')} is the reflection of ${A('ABC')}. Which dashed line is the line of reflection?`,
    solution: ['Take one pair, A and A′. The line of reflection is the fold that puts A on A′: it crosses AA′ at a right angle, through its middle.', 'Check it with a second pair (B and B′).', 'It can be slanted: the right angle is with AA′, not with the page.'],
  }, items));
});

// 22: what went wrong in Riley's reflection?
const SLIPS = {
  slide: 'Riley slid the triangle across instead of flipping it',
  straight: 'Riley went straight across the page, not at a right angle to m',
  offByOne: 'Riley counted one square too many or too few beyond m',
  corner: 'Riley stopped at a grid corner, but m is crossed in the middle of a square',
  fromP: 'Riley counted the distance from P instead of from the line',
} as const;
type SlipId = keyof typeof SLIPS;
const slip: Gen = (R, n) => retry(() => {
  const kind = pick(R, Object.keys(SLIPS) as SlipId[]);
  const cols = int(R, 10, 12), rows = int(R, 8, 10);
  let pic: MirrorPic, what = 'P';
  if (kind === 'slide') {
    const c = Math.floor(cols / 2), L = vLine(c), fig = triangle(R, 1, c - 1, 1, rows - 1), refl = reflectAll(fig, L);
    const img = shift(fig, [ext(refl).x0 - ext(fig).x0, 0]);
    if (img.some(p => !onSheet(p, cols, rows))) return null;
    pic = vary(R, { cols, rows, grid: true, line: L, figure: [{ pts: fig, labels: ['A', 'B', 'C'], role: 'first' }], image: [{ pts: img, role: 'pick' }], solve: { pts: [], hops: 'none', poly: { pts: refl, role: 'link' } } }, true);
    what = 'triangle ABC';
  } else {
    const diagK = kind === 'straight' || kind === 'corner';
    const L = lineFor(R, diagK ? ['d', 'a'] : ['v', 'h'], cols, rows);
    const P: Pt = [int(R, 1, cols - 1), int(R, 1, rows - 1)], s = Math.abs(offset(P, L));
    let Rr: Pt | null;
    if (kind === 'straight') { if (s % 2 || s < 2 || s > 6) return null; Rr = across(P, L, R() < 0.5 ? 'x' : 'y'); }
    else if (kind === 'corner') { if (s % 2 === 0 || s < 3 || s > 7) return null; Rr = add(reflect(P, L), stepToward(P, L), 1); }
    else if (kind === 'offByOne') { if (s < 2 || s > 5) return null; Rr = add(reflect(P, L), stepToward(P, L), pick(R, [-1, 1])); }
    else { if (s < 2 || s > 5) return null; Rr = foot(P, L); }
    if (!Rr || !onSheet(Rr, cols, rows) || !onSheet(reflect(P, L), cols, rows) || dist(Rr, reflect(P, L)) < 0.9) return null;
    pic = { cols, rows, grid: true, line: L, pins: [{ at: P, label: 'P', role: 'first' }, { at: Rr, label: 'R', role: 'pick' }], solve: { pts: [{ from: P, label: "P'" }], hops: hopsOf(L, P) } };
  }
  const others = shuffle(R, (Object.keys(SLIPS) as SlipId[]).filter(k => k !== kind)).slice(0, 3);
  const opts: Opt[] = shuffle(R, [kind, ...others]).map(k => ({ t: SLIPS[k], ok: k === kind, mc: k === kind ? undefined : MC.reason,
    say: k === kind ? 'Right. That is the step that went wrong.' : 'That is a real slip, but not this one. Redo the reflection yourself and compare it with Riley\'s.' }));
  const sol = kind === 'slide' ? ['A reflection flips the triangle: each vertex goes across m at a right angle, just as far beyond.', 'Riley\'s copy faces the same way as ABC: it was slid. The lime triangle is the reflection.']
    : ['Reflect P yourself: perpendicular to m, count to the line, the same count beyond.', `Compare with Riley's R: ${SLIPS[kind].replace('Riley ', '')}.`];
  return fits(choiceItem({
    family: 'slip', n, pic, board: kind === 'slide' ? "\\text{Riley: } \\triangle A'B'C'" : "\\text{Riley: } R = P'",
    prompt: kind === 'slide' ? `Riley reflected ${A(what)} in ${M} and got the ${Pp('purple triangle')}. What went wrong?` : `Riley reflected ${A('P')} in ${M} and got ${Pp('R')}. What went wrong?`,
    solution: sol,
  }, opts));
});

// 23: a measured check versus given marks
const EXACT = ['It proves that Q is the image of P', 'It is good evidence, but it does not prove it exactly', 'It shows nothing at all'];
const exact: Gen = (R, n) => retry(() => {
  const cols = 12, rows = 9;
  const measured = R() < 0.5;
  const deg = pick(R, [25, 35, 145, 155, 65, 115]);
  const L = oLine([6 + R() - 0.5, 4.5 + R() - 0.5], deg), { u, n: nn, q } = lineFrame(L);
  const Mf = add(q, u, (R() - 0.5) * 2), dP = 2.3 + R() * 0.6, P = add(Mf, nn, dP);
  const Q = measured ? add(Mf, nn, -dP) : add(add(Mf, nn, -dP * 0.7), u, 0.6);
  const a = pick(R, [2.9, 3.1, 3.4, 4.2]), b = a + pick(R, [0, 0, 0.1]);
  const qDir = (() => { const d: Pt = [Q[0] - Mf[0], Q[1] - Mf[1]], l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l] as Pt; })();
  const pic: MirrorPic = measured
    ? { cols, rows, grid: false, line: L, pins: [{ at: P, label: 'P', role: 'first' }, { at: Q, label: 'Q', role: 'pick' }, { at: Mf, label: 'M', role: 'dim' }], segs: [{ a: P, b: Mf, role: 'dim' }, { a: Mf, b: Q, role: 'dim' }], notes: [{ a: P, b: Mf, text: `${a.toFixed(1)} cm` }, { a: Mf, b: Q, text: `${b.toFixed(1)} cm` }] }
    : { cols, rows, grid: false, line: L, notToScale: true, pins: [{ at: P, label: 'P', role: 'first' }, { at: Q, label: 'Q', role: 'pick' }, { at: Mf, label: 'M', role: 'dim' }], segs: [{ a: P, b: Mf, role: 'dim', ticks: 1 }, { a: Mf, b: Q, role: 'dim', ticks: 1 }], marks: [{ at: Mf, u, v: qDir }] };
  const okI = measured ? 1 : 0;
  const opts: Opt[] = EXACT.map((t, i) => ({ t, ok: i === okI, say: '' }));
  opts[okI]!.say = measured ? 'Right. A ruler reads to about a millimeter: PM and MQ could still differ a little. Strong evidence, not proof.' : 'Right. The square and the matching ticks are GIVEN facts: PQ ⊥ m and PM = MQ. That proves it, whatever the drawing looks like.';
  opts.forEach((o, i) => {
    if (o.ok) return;
    if (measured && i === 0) { o.mc = MC.exact; o.say = 'Measurements are never exact: two readings of 3.1 cm can hide a small difference. They are evidence, not proof.'; }
    else if (!measured && i === 1) { o.mc = MC.looks; o.say = 'The drawing is not to scale, so do not judge it by its look. The marks are given facts, and they prove it.'; }
    else o.say = measured ? 'Careful measuring does say something: it is good evidence.' : 'The marks are information: a right angle and two equal lengths.';
  });
  return fits(choiceItem({
    family: 'exact', n, pic, board: "Q = P'\\ ?",
    prompt: measured ? `Mia measured her drawing: PM and MQ as shown, and the angle at M with a protractor: 90°. What does that show about ${Pp('Q')} being the image of ${A('P')} in ${M}?`
      : `This diagram is not to scale. Its marks say PQ ⊥ m and PM = MQ. What does that show about ${Pp('Q')} being the image of ${A('P')} in ${M}?`,
    solution: ['A measurement is close, never exact: it is evidence.', 'Given information (marks or words) is exact: you can build a proof on it.', measured ? 'Here the numbers are measured: good evidence, not proof.' : 'Here the facts are given: it is proved.'],
  }, opts));
});

export const GENS: Record<FamilyId, Gen> = { move, fold, perp, distance, fixed, marks, count, stepsNum, tool, transfer, vertex, crossing, diag, half, oblique, extend, verify, audit, sameShape, orient, bisect, locate, slip, exact };
export const GENERATORS: Readonly<Record<string, Gen>> = GENS;
