// figMaths.ts: exact maths of composite figures (pure: no DOM, no canvas).
//   PN          a measure a + b·π with exact (dyadic) a and b: 96 + 8π, 4.5π. Combine like terms, format TeX / HTML.
//   Fig         a figure in plan view (units, y up): its parts (+ added / − removed, each with an exact area), its
//               boundary as closed loops of pieces (straight segments and arcs, each with an exact length), the
//               seams (shared sides: inside the figure, never on the boundary), the straight edge a notch removed,
//               and the dimension labels it can show.
//   templates   rectSemi (full or partial side), track, rectQuarter, triSemi, trapSemi, rectHole, squareInscribed,
//               ring, cornerCut, edgeNotch, semiOnly, quarterOnly, circleOnly, lShape; rotFig turns any of them.
//   checkFig    asserts the figure against itself: every piece's length, the loops close, the area of the region the
//               loops enclose (sampled) equals the sum of the parts, each seam lies inside the figure.
export type Pt = [number, number];

// ------------------------------------------------------------------------------------------------ a + bπ
export interface PN { readonly a: number; readonly b: number }
const tidy = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? Math.round(x) : Math.round(x * 1e6) / 1e6);
export const pn = (a: number, b = 0): PN => ({ a: tidy(a), b: tidy(b) });
export const pnAdd = (...xs: PN[]): PN => pn(xs.reduce((s, x) => s + x.a, 0), xs.reduce((s, x) => s + x.b, 0));
export const pnSub = (x: PN, y: PN): PN => pn(x.a - y.a, x.b - y.b);
export const pnScale = (x: PN, k: number): PN => pn(x.a * k, x.b * k);
export const pnEq = (x: PN, y: PN): boolean => Math.abs(x.a - y.a) < 1e-9 && Math.abs(x.b - y.b) < 1e-9;
export const pnVal = (x: PN): number => x.a + x.b * Math.PI;
/** a number as a kid writes it: 12, 4.5, 0.25 */
export const fmt = (x: number): string => { const t = tidy(x); return Number.isInteger(t) ? String(t) : String(t); };
/** a + bπ as TeX: 96 + 8\pi, 8\pi, \pi, 60 - 2\pi */
export function pnTex(x: PN): string {
  const piPart = (b: number) => (b === 1 ? '\\pi' : `${fmt(b)}\\pi`);
  if (x.b === 0) return fmt(x.a);
  if (x.a === 0) return x.b < 0 ? `-${piPart(-x.b)}` : piPart(x.b);
  return x.b < 0 ? `${fmt(x.a)} - ${piPart(-x.b)}` : `${fmt(x.a)} + ${piPart(x.b)}`;
}
/** a + bπ as panel text: 96 + 8π, 60 − 2π */
export const pnText = (x: PN): string => pnTex(x).replace(/\\pi/g, 'π').replace(/ - /g, ' − ').replace(/^-/, '−');
/** the decimal value rounded to `dp` places (π from Math.PI, rounded once, at the end) */
export const approx = (x: PN, dp = 1): number => { const f = 10 ** dp; return Math.round(pnVal(x) * f + 1e-9) / f; };

// ------------------------------------------------------------------------------------------------ figures
export interface Seg { kind: 'seg'; id: string; a: Pt; b: Pt; len: PN }
/** an arc from angle t0 to t1 (radians, y up; t1 < t0 runs clockwise) around c */
export interface Arc { kind: 'arc'; id: string; c: Pt; r: number; t0: number; t1: number; len: PN; frac: number }
export type Piece = Seg | Arc;
export type PartKind = 'rect' | 'tri' | 'trap' | 'para' | 'semi' | 'quarter' | 'circle';
export interface Part {
  id: string; kind: PartKind; sign: 1 | -1; area: PN;
  /** the outline in units (sampled), for drawing and for leaders */
  outline: Pt[];
  /** the area as the kid writes it (TeX), e.g. 12 \cdot 8, \tfrac12 \pi \cdot 4^2 */
  areaTex: string;
  /** a round part: its centre and radius */
  c?: Pt; r?: number;
}
export type Dim =
  /** a dimension line beside a straight feature, outside the figure (n = outward unit normal) */
  | { id: string; kind: 'edge'; a: Pt; b: Pt; n: Pt; value: number; extra?: number; fa?: Pt; fb?: Pt }
  /** the length of an arc, written outside its midpoint */
  | { id: string; kind: 'arc'; piece: string; value: PN }
  /** a radius or a diameter drawn inside a round part; the label sits on the `toward` side of the line */
  | { id: string; kind: 'rad'; c: Pt; r: number; ang: number; diam: boolean; toward: Pt; value: number };
export interface Fig {
  name: string;
  parts: Part[];
  outer: Piece[];
  holes: Piece[][];
  seams: Seg[];
  /** straight edge that a notch / corner cut took away (drawn as a ghost in "before and after") */
  removed: Seg[];
  dims: Dim[];
  area: PN;
  perimeter: PN;
  outerPerimeter: PN;
}

const d2 = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const seg = (id: string, a: Pt, b: Pt): Seg => ({ kind: 'seg', id, a, b, len: pn(d2(a, b)) });
/** an arc of a quarter-turn multiple: its length is an exact multiple of π */
function arc(id: string, c: Pt, r: number, t0: number, t1: number): Arc {
  const q = Math.round(Math.abs(t1 - t0) / (Math.PI / 2));
  return { kind: 'arc', id, c, r, t0, t1, len: pn(0, (r * q) / 2), frac: q / 4 };
}
export const arcEnd = (A: Arc, at: 0 | 1): Pt => { const t = at ? A.t1 : A.t0; return [A.c[0] + A.r * Math.cos(t), A.c[1] + A.r * Math.sin(t)]; };
export const pieceStart = (p: Piece): Pt => (p.kind === 'seg' ? p.a : arcEnd(p, 0));
export const pieceEnd = (p: Piece): Pt => (p.kind === 'seg' ? p.b : arcEnd(p, 1));
export function arcSample(c: Pt, r: number, t0: number, t1: number, n = 48): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => { const t = t0 + ((t1 - t0) * i) / n; return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)] as Pt; });
}
/** the points of a piece, start to end */
export function piecePts(p: Piece, n?: number): Pt[] {
  if (p.kind === 'seg') return [p.a, p.b];
  return arcSample(p.c, p.r, p.t0, p.t1, n ?? Math.max(12, Math.round(48 * Math.abs(p.t1 - p.t0) / Math.PI)));
}
/** a closed loop as one polygon */
export function loopPts(L: readonly Piece[], n?: number): Pt[] {
  const out: Pt[] = [];
  for (const p of L) { const P = piecePts(p, n); out.push(...P.slice(0, -1)); }
  return out;
}
const rectOutline = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const sum = (xs: PN[]) => pnAdd(pn(0), ...xs);
const half = '\\tfrac12', quarter = '\\tfrac14';
const sq = (r: number) => `${fmt(r)}^2`;

function finish(name: string, parts: Part[], outer: Piece[], holes: Piece[][], seams: Seg[], dims: Dim[], removed: Seg[] = []): Fig {
  const area = sum(parts.map(p => pnScale(p.area, p.sign)));
  const outerPerimeter = sum(outer.map(p => p.len));
  const perimeter = pnAdd(outerPerimeter, ...holes.map(H => sum(H.map(p => p.len))));
  return { name, parts, outer, holes, seams, removed, dims, area, perimeter, outerPerimeter };
}
const rectPart = (id: string, x: number, y: number, w: number, h: number, sign: 1 | -1 = 1): Part =>
  ({ id, kind: 'rect', sign, area: pn(w * h), outline: rectOutline(x, y, w, h), areaTex: `${fmt(w)} \\cdot ${fmt(h)}` });
/** a fraction (1/4, 1/2, 1) of a disc from angle t0 to t1 */
function roundPart(id: string, c: Pt, r: number, t0: number, t1: number, sign: 1 | -1 = 1): Part {
  const q = Math.round(Math.abs(t1 - t0) / (Math.PI / 2));
  const kind: PartKind = q === 1 ? 'quarter' : q === 2 ? 'semi' : 'circle';
  const outline = q === 4 ? arcSample(c, r, t0, t1, 96).slice(0, -1) : [c, ...arcSample(c, r, t0, t1, 24 * q)];
  const areaTex = q === 4 ? `\\pi \\cdot ${sq(r)}` : `${q === 1 ? quarter : half}\\pi \\cdot ${sq(r)}`;
  return { id, kind, sign, area: pn(0, (r * r * q) / 4), outline, areaTex, c, r };
}
const edgeDim = (id: string, a: Pt, b: Pt, extra?: number): Dim => {
  // outward normal of a -> b on a counter-clockwise loop (y up): the right-hand side
  const L = d2(a, b), n: Pt = [(b[1] - a[1]) / L, -(b[0] - a[0]) / L];
  return { id, kind: 'edge', a, b, n, value: tidy(L), extra };
};

/** rectangle w x h with a semicircle on its right side: diameter = h, or a centred diameter d < h (partial) */
export function rectSemi(w: number, h: number, d = h): Fig {
  const r = d / 2, cy = h / 2, partial = d < h - 1e-9;
  const outer: Piece[] = [seg('bottom', [0, 0], [w, 0])];
  if (partial) outer.push(seg('gapLow', [w, 0], [w, cy - r]));
  outer.push(arc('arc', [w, cy], r, -Math.PI / 2, Math.PI / 2));
  if (partial) outer.push(seg('gapHigh', [w, cy + r], [w, h]));
  outer.push(seg('top', [w, h], [0, h]), seg('left', [0, h], [0, 0]));
  const parts = [rectPart('rect', 0, 0, w, h), roundPart('semi', [w, cy], r, -Math.PI / 2, Math.PI / 2)];
  const dims: Dim[] = [edgeDim('w', [0, 0], [w, 0]), edgeDim('h', [0, h], [0, 0]), edgeDim('top', [w, h], [0, h]),
    { id: 'arc', kind: 'arc', piece: 'arc', value: outer.find(p => p.id === 'arc')!.len as PN },
    { id: 'r', kind: 'rad', c: [w, cy], r, ang: 0, diam: false, toward: [0, 1], value: r },
    { id: 'd', kind: 'rad', c: [w, cy], r, ang: Math.PI / 2, diam: true, toward: [1, 0], value: d }];
  if (partial) dims.push(edgeDim('gapLow', [w, 0], [w, cy - r]), edgeDim('gapHigh', [w, cy + r], [w, h]));
  return finish('rectSemi', parts, outer, [], [seg('seam', [w, cy - r], [w, cy + r])], dims);
}
/** a track (stadium): rectangle w x h with a semicircle (diameter h) on each end */
export function track(w: number, h: number): Fig {
  const r = h / 2;
  const outer: Piece[] = [seg('bottom', [0, 0], [w, 0]), arc('arcR', [w, r], r, -Math.PI / 2, Math.PI / 2), seg('top', [w, h], [0, h]), arc('arcL', [0, r], r, Math.PI / 2, 1.5 * Math.PI)];
  const parts = [rectPart('rect', 0, 0, w, h), roundPart('semiR', [w, r], r, -Math.PI / 2, Math.PI / 2), roundPart('semiL', [0, r], r, Math.PI / 2, 1.5 * Math.PI)];
  const dims: Dim[] = [edgeDim('w', [0, 0], [w, 0]), edgeDim('top', [w, h], [0, h]),
    { id: 'd', kind: 'rad', c: [w, r], r, ang: Math.PI / 2, diam: true, toward: [1, 0], value: h },
    { id: 'r', kind: 'rad', c: [w, r], r, ang: 0, diam: false, toward: [0, 1], value: r },
    { id: 'arcR', kind: 'arc', piece: 'arcR', value: pn(0, r) }, { id: 'arcL', kind: 'arc', piece: 'arcL', value: pn(0, r) },
    // the width across the ends: a dimension line right of the right-hand curve, from its two ends
    { id: 'h', kind: 'edge', a: [w + r, 0], b: [w + r, h], n: [1, 0], value: h, fa: [w, 0], fb: [w, h] }];
  return finish('track', parts, outer, [], [seg('seamR', [w, 0], [w, h]), seg('seamL', [0, h], [0, 0])], dims);
}
/** rectangle w x h with a quarter circle of radius h on its right side (centre at the bottom-right corner) */
export function rectQuarter(w: number, h: number): Fig {
  const r = h;
  const outer: Piece[] = [seg('bottom', [0, 0], [w, 0]), seg('base2', [w, 0], [w + r, 0]), arc('arc', [w, 0], r, 0, Math.PI / 2), seg('top', [w, h], [0, h]), seg('left', [0, h], [0, 0])];
  const parts = [rectPart('rect', 0, 0, w, h), roundPart('quarter', [w, 0], r, 0, Math.PI / 2)];
  const dims: Dim[] = [edgeDim('w', [0, 0], [w, 0]), edgeDim('base2', [w, 0], [w + r, 0]), edgeDim('h', [0, h], [0, 0]), edgeDim('top', [w, h], [0, h]),
    { id: 'arc', kind: 'arc', piece: 'arc', value: pn(0, r / 2) }];
  return finish('rectQuarter', parts, outer, [], [seg('seam', [w, 0], [w, h])], dims);
}
/** an isosceles triangle (base b, height t, slanted sides `leg`) under a semicircle on its base: a cone */
export function triSemi(b: number, t: number, leg: number): Fig {
  const r = b / 2;
  const outer: Piece[] = [seg('legR', [r, -t], [b, 0]), arc('arc', [r, 0], r, 0, Math.PI), seg('legL', [0, 0], [r, -t])];
  const tri: Part = { id: 'tri', kind: 'tri', sign: 1, area: pn((b * t) / 2), outline: [[0, 0], [r, -t], [b, 0]], areaTex: `${half} \\cdot ${fmt(b)} \\cdot ${fmt(t)}` };
  const parts = [tri, roundPart('semi', [r, 0], r, 0, Math.PI)];
  const dims: Dim[] = [edgeDim('legR', [r, -t], [b, 0]), edgeDim('legL', [0, 0], [r, -t]),
    { id: 'd', kind: 'rad', c: [r, 0], r, ang: 0, diam: true, toward: [0, 1], value: b },
    // the height: a dimension line right of the figure, from the tip's level to the base
    { id: 't', kind: 'edge', a: [b, -t], b: [b, 0], n: [1, 0], value: t, fa: [r, -t] },
    { id: 'arc', kind: 'arc', piece: 'arc', value: pn(0, r) }];
  if (Math.abs(Math.hypot(r, t) - leg) > 1e-9) throw new Error(`triSemi: slanted side ${leg} does not fit base ${b} and height ${t}`);
  return finish('triSemi', parts, outer, [], [seg('seam', [b, 0], [0, 0])], dims);
}
/** an isosceles trapezoid (bottom b1, top b2, height t, legs `leg`) with a semicircle on its top side */
export function trapSemi(b1: number, b2: number, t: number, leg: number): Fig {
  const o = (b1 - b2) / 2, r = b2 / 2;
  const outer: Piece[] = [seg('bottom', [0, 0], [b1, 0]), seg('legR', [b1, 0], [o + b2, t]), arc('arc', [o + r, t], r, 0, Math.PI), seg('legL', [o, t], [0, 0])];
  const trap: Part = { id: 'trap', kind: 'trap', sign: 1, area: pn(((b1 + b2) * t) / 2), outline: [[0, 0], [b1, 0], [o + b2, t], [o, t]], areaTex: `${half}(${fmt(b1)} + ${fmt(b2)}) \\cdot ${fmt(t)}` };
  const parts = [trap, roundPart('semi', [o + r, t], r, 0, Math.PI)];
  const dims: Dim[] = [edgeDim('bottom', [0, 0], [b1, 0]), edgeDim('legR', [b1, 0], [o + b2, t]), edgeDim('legL', [o, t], [0, 0]),
    { id: 'd', kind: 'rad', c: [o + r, t], r, ang: 0, diam: true, toward: [0, 1], value: b2 },
    { id: 't', kind: 'edge', a: [0, t], b: [0, 0], n: [-1, 0], value: t, fa: [o, t] },
    { id: 'arc', kind: 'arc', piece: 'arc', value: pn(0, r) }];
  if (Math.abs(Math.hypot(o, t) - leg) > 1e-9) throw new Error(`trapSemi: slanted side ${leg} does not fit`);
  return finish('trapSemi', parts, outer, [], [seg('seam', [o + b2, t], [o, t])], dims);
}
/** rectangle w x h with a round hole of radius r centred at (cx, cy); an optional seam at x = sx (two sections) */
export function rectHole(w: number, h: number, r: number, cx: number, cy: number, sx?: number): Fig {
  const outer: Piece[] = [seg('bottom', [0, 0], [w, 0]), seg('right', [w, 0], [w, h]), seg('top', [w, h], [0, h]), seg('left', [0, h], [0, 0])];
  const hole: Piece[] = [arc('hole', [cx, cy], r, 0, 2 * Math.PI)];
  const parts = [rectPart('rect', 0, 0, w, h), roundPart('hole', [cx, cy], r, 0, 2 * Math.PI, -1)];
  const dims: Dim[] = [edgeDim('w', [0, 0], [w, 0]), edgeDim('h', [0, h], [0, 0]), edgeDim('right', [w, 0], [w, h]), edgeDim('top', [w, h], [0, h]),
    { id: 'r', kind: 'rad', c: [cx, cy], r, ang: 0, diam: false, toward: [0, 1], value: r },
    { id: 'd', kind: 'rad', c: [cx, cy], r, ang: 0, diam: true, toward: [0, 1], value: 2 * r }];
  const seams = sx === undefined ? [] : [seg('seam', [sx, 0], [sx, h])];
  return finish('rectHole', parts, outer, [hole], seams, dims);
}
/** a square of side s with the circle that touches all four sides cut out (the four corners are left) */
export function squareInscribed(s: number): Fig {
  const f = rectHole(s, s, s / 2, s / 2, s / 2);
  return { ...f, name: 'squareInscribed' };
}
/** a ring: a circle of radius R with a circle of radius r cut from its middle */
export function ring(R: number, r: number): Fig {
  const outer: Piece[] = [arc('rim', [0, 0], R, 0, 2 * Math.PI)];
  const hole: Piece[] = [arc('hole', [0, 0], r, 0, 2 * Math.PI)];
  const parts = [roundPart('disc', [0, 0], R, 0, 2 * Math.PI), roundPart('hole', [0, 0], r, 0, 2 * Math.PI, -1)];
  const dims: Dim[] = [
    { id: 'R', kind: 'rad', c: [0, 0], r: R, ang: -Math.PI / 4, diam: false, toward: [Math.SQRT1_2, Math.SQRT1_2], value: R },
    { id: 'r', kind: 'rad', c: [0, 0], r, ang: (3 * Math.PI) / 4, diam: false, toward: [Math.SQRT1_2, Math.SQRT1_2], value: r }];
  return finish('ring', parts, outer, [hole], [], dims);
}
/** rectangle w x h with a quarter circle of radius r cut from its top-right corner (centred at the corner) */
export function cornerCut(w: number, h: number, r: number): Fig {
  const outer: Piece[] = [seg('bottom', [0, 0], [w, 0]), seg('right', [w, 0], [w, h - r]), arc('arc', [w, h], r, -Math.PI / 2, -Math.PI), seg('top', [w - r, h], [0, h]), seg('left', [0, h], [0, 0])];
  const parts = [rectPart('rect', 0, 0, w, h), roundPart('quarter', [w, h], r, -Math.PI, -Math.PI / 2, -1)];
  const dims: Dim[] = [edgeDim('w', [0, 0], [w, 0]), edgeDim('h', [0, h], [0, 0]), edgeDim('right', [w, 0], [w, h - r]), edgeDim('top', [w - r, h], [0, h]),
    { id: 'arc', kind: 'arc', piece: 'arc', value: pn(0, r / 2) },
    { id: 'r', kind: 'edge', a: [w - r, h], b: [w, h], n: [0, 1], value: r }];
  return finish('cornerCut', parts, outer, [], [], dims, [seg('cutTop', [w - r, h], [w, h]), seg('cutRight', [w, h - r], [w, h])]);
}
/** rectangle w x h with a semicircle of radius r cut from its bottom edge, centred at x = at */
export function edgeNotch(w: number, h: number, r: number, at = w / 2): Fig {
  const outer: Piece[] = [seg('bottomL', [0, 0], [at - r, 0]), arc('arc', [at, 0], r, Math.PI, 0), seg('bottomR', [at + r, 0], [w, 0]), seg('right', [w, 0], [w, h]), seg('top', [w, h], [0, h]), seg('left', [0, h], [0, 0])];
  const parts = [rectPart('rect', 0, 0, w, h), roundPart('semi', [at, 0], r, 0, Math.PI, -1)];
  const dims: Dim[] = [edgeDim('top', [w, h], [0, h]), edgeDim('h', [0, h], [0, 0]), edgeDim('right', [w, 0], [w, h]),
    { id: 'w', kind: 'edge', a: [0, 0], b: [w, 0], n: [0, -1], value: w, extra: 0 },
    { id: 'arc', kind: 'arc', piece: 'arc', value: pn(0, r) },
    { id: 'd', kind: 'rad', c: [at, 0], r, ang: 0, diam: true, toward: [0, -1], value: 2 * r }];
  return finish('edgeNotch', parts, outer, [], [], dims, [seg('cut', [at - r, 0], [at + r, 0])]);
}
/** a semicircle of radius r on its diameter (flat side down) */
export function semiOnly(r: number): Fig {
  const outer: Piece[] = [seg('diam', [-r, 0], [r, 0]), arc('arc', [0, 0], r, 0, Math.PI)];
  const dims: Dim[] = [edgeDim('diam', [-r, 0], [r, 0]), { id: 'arc', kind: 'arc', piece: 'arc', value: pn(0, r) },
    { id: 'r', kind: 'rad', c: [0, 0], r, ang: Math.PI / 2, diam: false, toward: [1, 0], value: r }];
  return finish('semiOnly', [roundPart('semi', [0, 0], r, 0, Math.PI)], outer, [], [], dims);
}
/** a quarter circle of radius r (the corner at the bottom left) */
export function quarterOnly(r: number): Fig {
  const outer: Piece[] = [seg('base', [0, 0], [r, 0]), arc('arc', [0, 0], r, 0, Math.PI / 2), seg('side', [0, r], [0, 0])];
  const dims: Dim[] = [edgeDim('base', [0, 0], [r, 0]), edgeDim('side', [0, r], [0, 0]), { id: 'arc', kind: 'arc', piece: 'arc', value: pn(0, r / 2) }];
  return finish('quarterOnly', [roundPart('quarter', [0, 0], r, 0, Math.PI / 2)], outer, [], [], dims);
}
/** a whole circle of radius r */
export function circleOnly(r: number): Fig {
  const outer: Piece[] = [arc('rim', [0, 0], r, 0, 2 * Math.PI)];
  const dims: Dim[] = [{ id: 'r', kind: 'rad', c: [0, 0], r, ang: 0, diam: false, toward: [0, 1], value: r },
    { id: 'd', kind: 'rad', c: [0, 0], r, ang: 0, diam: true, toward: [0, 1], value: 2 * r }, { id: 'arc', kind: 'arc', piece: 'rim', value: pn(0, 2 * r) }];
  return finish('circleOnly', [roundPart('disc', [0, 0], r, 0, 2 * Math.PI)], outer, [], [], dims);
}
/** an L: a wide rectangle a x b with a narrower c x d standing on its left end */
export function lShape(a: number, b: number, c: number, d: number): Fig {
  const outer: Piece[] = [seg('bottom', [0, 0], [a, 0]), seg('right', [a, 0], [a, b]), seg('step', [a, b], [c, b]), seg('upR', [c, b], [c, b + d]), seg('top', [c, b + d], [0, b + d]), seg('left', [0, b + d], [0, 0])];
  const parts = [rectPart('low', 0, 0, a, b), rectPart('high', 0, b, c, d)];
  const dims: Dim[] = [edgeDim('bottom', [0, 0], [a, 0]), edgeDim('right', [a, 0], [a, b]), edgeDim('top', [c, b + d], [0, b + d]), edgeDim('upR', [c, b], [c, b + d]), edgeDim('left', [0, b + d], [0, 0]), edgeDim('step', [a, b], [c, b])];
  return finish('lShape', parts, outer, [], [seg('seam', [0, b], [c, b])], dims);
}

/** turn a figure by q quarter turns counter-clockwise (labels keep their values) */
export function rotFig(F: Fig, q: number): Fig {
  const k = ((q % 4) + 4) % 4;
  if (!k) return F;
  const t = (k * Math.PI) / 2, cs = Math.round(Math.cos(t)), sn = Math.round(Math.sin(t));
  const P = (p: Pt): Pt => [tidy(cs * p[0] - sn * p[1]), tidy(sn * p[0] + cs * p[1])];
  const V = P;
  const pc = (p: Piece): Piece => (p.kind === 'seg' ? { ...p, a: P(p.a), b: P(p.b) } : { ...p, c: P(p.c), t0: p.t0 + t, t1: p.t1 + t });
  const dim = (d: Dim): Dim => d.kind === 'edge' ? { ...d, a: P(d.a), b: P(d.b), n: V(d.n), fa: d.fa ? P(d.fa) : undefined, fb: d.fb ? P(d.fb) : undefined } : d.kind === 'rad' ? { ...d, c: P(d.c), ang: d.ang + t, toward: V(d.toward) } : d;
  return {
    ...F,
    parts: F.parts.map(p => ({ ...p, outline: p.outline.map(P), c: p.c ? P(p.c) : undefined })),
    outer: F.outer.map(pc), holes: F.holes.map(H => H.map(pc)),
    seams: F.seams.map(s => pc(s) as Seg), removed: F.removed.map(s => pc(s) as Seg), dims: F.dims.map(dim),
  };
}

// ------------------------------------------------------------------------------------------------ checks
function shoelace(P: readonly Pt[]): number { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i]!, b = P[(i + 1) % P.length]!; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
export function inPoly(p: Pt, P: readonly Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const a = P[i]!, b = P[j]!;
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
/** is a point inside the figure (inside the outer loop, outside every hole)? */
export function inFig(F: Fig, p: Pt): boolean {
  return inPoly(p, loopPts(F.outer, 96)) && !F.holes.some(H => inPoly(p, loopPts(H, 96)));
}
/** the figure checks its own maths; throws a readable message when a template is wrong */
export function checkFig(F: Fig): void {
  const fail = (m: string) => { throw new Error(`${F.name}: ${m}`); };
  for (const L of [F.outer, ...F.holes]) {
    for (let i = 0; i < L.length; i++) {
      const p = L[i]!, q = L[(i + 1) % L.length]!;
      if (d2(pieceEnd(p), pieceStart(q)) > 1e-6) fail(`the boundary does not close between ${p.id} and ${q.id}`);
      const P = piecePts(p, 400);
      let len = 0; for (let k = 1; k < P.length; k++) len += d2(P[k - 1]!, P[k]!);
      if (Math.abs(len - pnVal(p.len)) > 1e-3 * Math.max(1, len)) fail(`piece ${p.id} is ${len.toFixed(4)} long, not ${pnText(p.len)}`);
    }
  }
  const outerA = Math.abs(shoelace(loopPts(F.outer, 800)));
  const holesA = F.holes.reduce((s, H) => s + Math.abs(shoelace(loopPts(H, 800))), 0);
  const A = outerA - holesA;
  if (Math.abs(A - pnVal(F.area)) > 2e-4 * Math.max(1, A)) fail(`the region encloses ${A.toFixed(4)}, the parts add to ${pnText(F.area)}`);
  for (const s of F.seams) {
    const m: Pt = [(s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2];
    if (!inPoly(m, loopPts(F.outer, 400))) fail(`seam ${s.id} is not inside the figure`);
  }
  if (!pnEq(F.perimeter, pnAdd(F.outerPerimeter, ...F.holes.map(H => sum(H.map(p => p.len)))))) fail('perimeter does not add up');
}
/** the bounding box of the figure in units */
export function figBounds(F: Fig): { x0: number; y0: number; x1: number; y1: number } {
  const P = [...loopPts(F.outer, 96), ...F.parts.flatMap(p => p.outline)];
  return { x0: Math.min(...P.map(p => p[0])), y0: Math.min(...P.map(p => p[1])), x1: Math.max(...P.map(p => p[0])), y1: Math.max(...P.map(p => p[1])) };
}
