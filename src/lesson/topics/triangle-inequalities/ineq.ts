// ineq.ts: the exact maths and the figures of "Isosceles triangles and side-angle order" (Geometry, lesson 5).
// Pure: no DOM, no canvas.
//   triples      triKind (yes / flat = collinear / no) with exact decimal comparison, the third-side range |a − b| < x < a + b,
//                the whole numbers strictly inside it
//   order        sides and angles of one triangle by index (vertex i, angle i, side i opposite vertex i), their order
//                and ties
//   figures      every figure is computed: an isosceles triangle from its apex angle, a triangle from three sides
//                (SSS) or two angles (ASA), sticks at scale, the compass check (base + two arcs at their true radii),
//                exterior angles (one per vertex), the angle-sum figure (a parallel through a vertex) and the
//                triangle-inequality proof figure (BA extended to D with AD = AC). Marks go through tri.ts buildFig,
//                which throws when a tick group or an arc group is not exactly equal.
// The figure block itself is the course's GeoFig (geometry-foundations/geo.ts + GeoFig.ts), used read-only.
import { type Fig, type GAngle, type GSeg, type MarkCol, type Pt, add, at, dist, dirv, measure, mul, sub, unit } from '../geometry-foundations/geo';
import { type FMark, type Tri, buildFig, circleSegs, sideName, triASA, triSSS, triSAS, turnT } from '../triangle-congruence/tri';

// ---------- numbers ----------
/** a measure for the panel: whole numbers as they are, decimals to at most two places */
export const fmt = (x: number): string => { const v = Math.round(x * 100) / 100; return Number.isInteger(v) ? String(v) : String(v); };
export const r2 = (x: number) => Math.round(x * 100) / 100;
const q = (x: number) => Math.round(x * 1000);
export type Kind = 'yes' | 'flat' | 'no';
/** does a triple make a triangle? exact for lengths with up to three decimals */
export function triKind(L: readonly number[]): Kind {
  const s = [...L].sort((a, b) => a - b);
  const d = q(s[0]!) + q(s[1]!) - q(s[2]!);
  return d > 0 ? 'yes' : d === 0 ? 'flat' : 'no';
}
/** the third side of a triangle with sides a and b: lo < x < hi */
export const thirdRange = (a: number, b: number) => ({ lo: r2(Math.abs(a - b)), hi: r2(a + b) });
/** whole numbers strictly between lo and hi */
export function wholeIn(lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let k = Math.floor(lo) + 1; q(k) < q(hi); k++) if (q(k) > q(lo)) out.push(k);
  return out;
}

// ---------- one triangle by index ----------
export const sideLen = (T: Tri, i: number): number => dist(T[(i + 1) % 3]!, T[(i + 2) % 3]!);
export const angAt = (T: Tri, i: number): number => measure(T[i]!, T[(i + 1) % 3]!, T[(i + 2) % 3]!);
/** angle i named by its three letters (vertex in the middle) */
export const ang3 = (n: string, i: number) => n[(i + 1) % 3]! + n[i]! + n[(i + 2) % 3]!;
/** the vertex indexes sorted by a value (ascending) */
export const orderBy = (v: readonly number[]) => [0, 1, 2].sort((a, b) => v[a]! - v[b]!);
/** turn a triangle's vertex order so that vertex 0 of T lands at index k */
export function rotTo(T: Tri, k: number): Tri { const o = T.slice() as Tri; for (let j = 0; j < 3; j++) o[(j + k) % 3] = T[j]!; return o; }

/** an isosceles triangle: apex (vertex 0) angle v, legs L (V0V1 = V0V2), base horizontal below the apex */
export function isoTri(v: number, L: number): Tri {
  const h = L * Math.cos((v / 2) * Math.PI / 180), w = L * Math.sin((v / 2) * Math.PI / 180);
  return [[0, h], [-w, 0], [w, 0]];
}
/** an isosceles triangle from its legs and base (V0 the apex) */
export function isoTriSides(leg: number, base: number): Tri {
  return [[0, Math.sqrt(leg * leg - (base * base) / 4)], [-base / 2, 0], [base / 2, 0]];
}
export { triASA, triSSS, triSAS, turnT };

// ---------- figures ----------
/** a triangle figure named n (letters in vertex order), with marks and a washed body */
export function triFig(T: Tri, n: string, marks: FMark[] = [], o: { pad?: number; extra?: GSeg[]; bare?: string[]; pts?: Record<string, Pt>; segs?: string[]; maxS?: number } = {}): Fig {
  const pts: Record<string, Pt> = { [n[0]!]: T[0], [n[1]!]: T[1], [n[2]!]: T[2], ...(o.pts ?? {}) };
  // practice figures fill their frame (default 2x model units; labels keep their size, so they get more room)
  if (o.maxS !== 0) return { ...triFig(T, n, marks, { ...o, maxS: 0 }), maxS: o.maxS ?? 2 };
  return buildFig({ pts, segs: [...[0, 1, 2].map(i => sideName(n, i)), ...(o.segs ?? [])], marks, fills: [{ pts: n }], pad: o.pad ?? 80, extra: o.extra, bare: o.bare });
}
/** angle arcs at vertices of T, drawn only in the worked solution */
export function solveArcs(f: Fig, T: Tri, idx: readonly number[], col: MarkCol = 'link', arcs = 1): Fig {
  const add1: GAngle[] = idx.map(i => ({ id: `sol${i}`, v: T[i]!, p: T[(i + 1) % 3]!, q: T[(i + 2) % 3]!, arcs, col, solve: 'only' as const, r: 70 }));
  return { ...f, angles: [...f.angles, ...add1] };
}
/** tick marks on sides of T, drawn only in the worked solution (as short solve-only segments across the side) */
export function solveTicks(f: Fig, T: Tri, sides: readonly number[], n = 1): Fig {
  const segs: GSeg[] = [];
  for (const i of sides) {
    const a = T[(i + 1) % 3]!, b = T[(i + 2) % 3]!, m = mul(add(a, b), 0.5), u = unit(sub(b, a)), nn: Pt = [-u[1], u[0]];
    for (let k = 0; k < n; k++) { const c = add(m, mul(u, (k - (n - 1) / 2) * 11)); segs.push({ id: `tk${i}${k}`, a: add(c, mul(nn, 14)), b: add(c, mul(nn, -14)), solve: true, col: 'link' }); }
  }
  return { ...f, segs: [...f.segs, ...segs] };
}
/** a segment that glows / changes colour in the solve: helper to find a side's id in a triangle figure */
export const sideId = (n: string, i: number) => sideName(n, i);

/** three sticks at scale, one above the other, each labelled above (lengths in `unit`) */
export function sticksFig(L: readonly number[], unitWord: string, k = 70, cols?: readonly (MarkCol | 'ink')[]): Fig {
  const names = ['ab', 'cd', 'ef'];
  const pts: Record<string, Pt> = {};
  const gap = Math.max(...L) * k * 0.2 + 120;
  L.forEach((x, i) => { pts[names[i]![0]!] = [0, -i * gap]; pts[names[i]![1]!] = [x * k, -i * gap]; });
  return buildFig({
    pts, segs: names, bare: Object.keys(pts), pad: 120,
    marks: L.map((x, i) => ({ seg: names[i]!, text: `${fmt(x)} ${unitWord}`, lone: true })),
    segStyle: Object.fromEntries(names.map((s, i) => [s, { side: 1 as const, col: cols?.[i] ?? 'first' }])),
  });
}

/** the compass check: the longest length c as base AB, an arc of radius r1 about A and of radius r2 about B (all
 *  in units, scaled by k). The arcs are upper half circles; a dashed radius with its length shows each setting.
 *  When the arcs cross, the solve draws the two sides to the crossing point. */
export function arcsFig(c: number, r1: number, r2: number, unitWord: string, names: [string, string] = ['A', 'B'], k = 60): { fig: Fig; P: Pt | null; kind: Kind } {
  const A: Pt = [0, 0], B: Pt = [c * k, 0];
  const kind = triKind([c, r1, r2]);
  let P: Pt | null = null;
  if (kind !== 'no') {
    const x = (r1 * r1 - r2 * r2 + c * c) / (2 * c), y = Math.sqrt(Math.max(0, r1 * r1 - x * x));
    P = [x * k, y * k];
  }
  const arcA = circleSegs('arcA', A, r1 * k, { d0: 0, d1: 150, col: 'first', n: 40 });
  const arcB = circleSegs('arcB', B, r2 * k, { d0: 30, d1: 180, col: 'second', n: 40 });
  const RA = at(A, 112, r1 * k), RB = at(B, 68, r2 * k);
  const extra: GSeg[] = [...arcA, ...arcB];
  const pts: Record<string, Pt> = { [names[0]]: A, [names[1]]: B, u: RA, w: RB };
  const segs = [names[0] + names[1], names[0] + 'u', names[1] + 'w'];
  const marks: FMark[] = [
    { seg: names[0] + names[1], text: `${fmt(c)} ${unitWord}`, lone: true },
    { seg: names[0] + 'u', text: `${fmt(r1)} ${unitWord}`, lone: true, col: 'first' },
    { seg: names[1] + 'w', text: `${fmt(r2)} ${unitWord}`, lone: true, col: 'second' },
  ];
  const f = buildFig({
    pts, segs, marks, bare: ['u', 'w'], extra, pad: 70, dirs: { [names[0]]: 225, [names[1]]: 315 },
    segStyle: { [names[0] + 'u']: { dash: true, col: 'first', side: 1 }, [names[1] + 'w']: { dash: true, col: 'second', side: -1 }, [names[0] + names[1]]: { side: -1 } },
  });
  if (P && kind === 'yes') f.segs.push({ id: 'sA', a: A, b: P, col: 'link', solve: true }, { id: 'sB', a: B, b: P, col: 'link', solve: true });
  return { fig: f, P, kind };
}

/** exterior angles, one per vertex, going around: at vertex i the side from vertex i−1 is extended past vertex i
 *  (to the bare point x / y / z) and the exterior angle sits between that extension and the side to vertex i+1.
 *  Vertex order must be counterclockwise (as triASA gives). Labels: texts[i] for the exterior angle at vertex i. */
export function extFig(T: Tri, n: string, texts: readonly (string | null)[], o: { cols?: readonly (MarkCol | undefined)[]; ext?: number } = {}): Fig {
  const E = 'xyz', ext = o.ext ?? 190;
  const pts: Record<string, Pt> = {};
  const segs: string[] = [];
  const marks: FMark[] = [];
  for (let i = 0; i < 3; i++) {
    const V = T[i]!, Pv = T[(i + 2) % 3]!;
    pts[E[i]!] = add(V, mul(unit(sub(V, Pv)), ext));
    segs.push(n[i]! + E[i]!);
    const t = texts[i];
    if (t !== null && t !== undefined) marks.push({ ang: E[i]! + n[i]! + n[(i + 1) % 3]!, text: t, lone: true, col: o.cols?.[i] ?? 'first', r: 58 });
  }
  return triFig(T, n, marks, { pts, segs, bare: [...E] });
}
/** the exterior angle at vertex i (as drawn by extFig) */
export const extAt = (T: Tri, i: number) => 180 - angAt(T, i);

/** the angle-sum figure: apex B (index 1 of n = 'ABC' roles) with the line through B parallel to AC; ∠1 and ∠3 are the
 *  outside angles at B (numbers, textbook style), chevrons on the parallels */
export function sumFig(T: Tri, n: string, o: { arcs?: boolean } = {}): Fig {
  // T: vertex 0 = A (left), 1 = B (apex), 2 = C (right), AC horizontal
  const [A, B, C] = T;
  const u = unit(sub(C, A)), Lx = 300;
  const D = sub(B, mul(u, Lx)), E2 = add(B, mul(u, Lx));
  const pts: Record<string, Pt> = { [n[0]!]: A, [n[1]!]: B, [n[2]!]: C, d: D, e: E2 };
  const AB = n[0]! + n[1]!, BC = n[1]! + n[2]!, AC = n[0]! + n[2]!;
  const marks: FMark[] = [
    { seg: 'de', par: 1 }, { seg: AC, par: 1 },
    { ang: `d${n[1]}${n[0]}`, text: '1', lone: true, col: 'second', r: 64 },
    { ang: `${n[2]}${n[1]}e`, text: '3', lone: true, col: 'first', r: 64 },
    { ang: `${n[0]}${n[1]}${n[2]}`, text: '2', lone: true, col: 'pick', r: 64 },
  ];
  if (o.arcs !== false) marks.push({ ang: `${n[1]}${n[0]}${n[2]}`, n: 1, col: 'second' }, { ang: `${n[0]}${n[2]}${n[1]}`, n: 2, col: 'first' });
  const f = buildFig({ pts, segs: [AB, BC, AC, 'de'], marks, bare: ['d', 'e'], fills: [{ pts: n }], segStyle: { de: { kind: 'line', name: 'ℓ' } }, pad: 80 });
  // the outside angles are named by their numbers only (textbook style)
  f.angles = f.angles.map(a => (a.text === '1' || a.text === '2' || a.text === '3' ? { ...a, nameOnly: true, arcs: 0 } : a));
  f.maxS = 2;
  return f;
}

/** the triangle-inequality proof figure: roles B, C on the base, A the apex, D on ray BA beyond A with AD = AC.
 *  Ticks on AD and AC (equal by construction), matching arcs on ∠ACD and ∠ADC (the isosceles base angles). */
export function extensionTri(Bx: number, Ax: number, Ay: number, c: number): { B: Pt; C: Pt; A: Pt; D: Pt } {
  const B: Pt = [0, 0], C: Pt = [c, 0], A: Pt = [Ax, Ay];
  const D = add(A, mul(unit(sub(A, B)), dist(A, C)));
  void Bx;
  return { B, C, A, D };
}
export function extensionFig(names: { A: string; B: string; C: string; D: string }, P: { B: Pt; C: Pt; A: Pt; D: Pt }, o: { arcs?: boolean; ticks?: boolean; cd?: boolean } = {}): Fig {
  const { A, B, C, D } = names;
  const pts: Record<string, Pt> = { [A]: P.A, [B]: P.B, [C]: P.C, [D]: P.D };
  const marks: FMark[] = [];
  if (o.ticks !== false) marks.push({ seg: A + D, n: 1, col: 'first' }, { seg: A + C, n: 1, col: 'first' });
  if (o.arcs !== false) marks.push({ ang: A + C + D, n: 1, col: 'second' }, { ang: A + D + C, n: 1, col: 'second' });
  const segs = [B + A, A + D, B + C, A + C, ...(o.cd !== false ? [C + D] : [])];
  return { ...buildFig({ pts, segs, marks, fills: [{ pts: B + C + A }, ...(o.cd !== false ? [{ pts: A + C + D, col: 'second' as const, alpha: 0.2 }] : [])], pad: 80 }), maxS: 2 };
}

/** a direction helper re-exported for generators */
export { dirv };
