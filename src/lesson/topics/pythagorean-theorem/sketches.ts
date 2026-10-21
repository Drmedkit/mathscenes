// sketches.ts: the pictures of this topic as plain data (SketchSpec, drawn by Sketch.ts). Pure: items and tests import
// it. A SketchPic names the steps drawn at once (`now`) and the steps the worked-solution replay draws (`solve`).
//   rtSketch    a right triangle in a situation: ladder on a wall, TV screen, walk east then north, ramp, park
//               shortcut, deck corner with a brace (the right-angle mark only when it is established)
//   boxSketch   an l x w x h box in an oblique drawing (hidden edges dashed), floor diagonal, edge up, space diagonal,
//               the right-angle mark at the foot of the edge (a projected square corner)
//   rectSketch / isoSketch   a right triangle inside a bigger figure (a rectangle cut by a diagonal, an isosceles
//               triangle cut by its height)
//   converseSketch   the converse proof: the given triangle and a constructed right triangle that turns onto it
//   lineSketch  a number line with a square root between two whole numbers
//   squareSketch  one upright square with its area inside and its side under it
//   sssSketch   a triangle drawn true to three lengths, side labels, an optional "?" at the angle across from the longest
import type { Pt } from '../../../core/math';
import type { Paint } from '../../../core/theme';
import type { SketchSpec, SkLabel, SkSeg } from './Sketch';
import { BOX_EDGES, type BoxV, box3, converseFigure, drawnBox, mark3, project, sssPts } from './theoremMaths';

export interface SketchPic { kind: 'sketch'; spec: SketchSpec; now: string[]; solve: string[] }
const pic = (spec: SketchSpec, now: string[] = [], solve: string[] = []): SketchPic => ({ kind: 'sketch', spec, now, solve });
/** drawn proportions of two legs: the ratio stays between 0.45 and 2.2 (the labels carry the numbers) */
export function drawn2(a: number, b: number, big = 6): [number, number] {
  const r = Math.min(2.2, Math.max(0.45, a / b));
  return r >= 1 ? [big, big / r] : [big * r, big];
}

// ---------- right triangles in a situation ----------
export type Shape = 'ladder' | 'tv' | 'walk' | 'ramp' | 'park' | 'deck' | 'plain';
export interface RtLabels { h?: string; v?: string; c?: string; c2?: string }
/** h = the horizontal leg, v = the vertical leg, c = the slanted side; `mark` draws the right-angle mark; `ask` puts a
 *  "?" in the corner (is it a right angle?) */
export function rtSketch(shape: Shape, h: number, v: number, L: RtLabels, o: { mark?: boolean; ask?: boolean; solveC?: boolean } = {}): SketchPic {
  const [x, y] = drawn2(h, v);
  const mark = o.mark ?? true;
  const pts: Record<string, Pt> = {};
  const segs: SkSeg[] = [], labels: SkLabel[] = [];
  const polys: SketchSpec['polys'] = [];
  // the corner K is the right angle, H the end of the horizontal leg, V the end of the vertical leg
  let K: Pt = [0, 0], H: Pt = [x, 0], V: Pt = [0, y];
  if (shape === 'ladder') { K = [0, 0]; H = [x, 0]; V = [0, y]; pts.w0 = [-0.7, 0]; pts.w1 = [-0.7, y + 0.6]; pts.w2 = [0, y + 0.6]; pts.g1 = [x + 0.9, 0]; pts.g0 = [-0.7, 0]; }
  if (shape === 'ramp') { K = [x, 0]; H = [0, 0]; V = [x, y]; }
  if (shape === 'walk') { K = [x, 0]; H = [0, 0]; V = [x, y]; }
  if (shape === 'deck') { K = [0, 0]; H = [x, 0]; V = [0, y]; }
  Object.assign(pts, { K, H, V });
  if (shape === 'tv' || shape === 'park') {
    // a rectangle; the right triangle is its bottom and right side with the diagonal
    pts.K = [x, 0]; pts.H = [0, 0]; pts.V = [x, y]; pts.TL = [0, y];
    polys.push({ pts: ['H', 'K', 'V', 'TL'], col: shape === 'tv' ? '#2A2F5C' : '#2F6B4F', alpha: 0.95 });
    if (shape === 'tv') { pts.s0 = [x / 2 - 0.5, -0.05]; pts.s1 = [x / 2 + 0.5, -0.05]; pts.s2 = [x / 2 + 0.7, -0.6]; pts.s3 = [x / 2 - 0.7, -0.6]; polys.push({ pts: ['s0', 's1', 's2', 's3'], col: '#4A4580' }); }
    if (shape === 'park') segs.push({ a: 'H', b: 'TL', col: 'faint', w: 3 }, { a: 'TL', b: 'V', col: 'faint', w: 3 });
  }
  if (shape === 'ladder') {
    polys.push({ pts: ['w0', 'K', 'w2', 'w1'], col: '#7A4E35', alpha: 0.9 });
    segs.push({ a: 'g0', b: 'g1', col: 'faint', w: 4 });
  }
  if (shape === 'ramp') polys.push({ pts: ['H', 'K', 'V'], col: '#7A4E35', alpha: 0.85 });
  if (shape === 'plain') polys.push({ pts: ['H', 'K', 'V'], col: '#4A4580', alpha: 0.9 });
  segs.push({ a: 'K', b: 'H', col: 'first', w: shape === 'deck' ? 12 : 6 }, { a: 'K', b: 'V', col: 'second', w: shape === 'deck' ? 12 : 6 });
  segs.push({ a: 'H', b: 'V', col: 'link', w: shape === 'ladder' ? 9 : 6, dash: shape === 'walk' || shape === 'park', step: o.solveC ? 'c' : undefined });
  if (L.h) labels.push({ a: 'K', b: 'H', t: L.h, col: 'first', ref: 'V' });
  if (L.v) labels.push({ a: 'K', b: 'V', t: L.v, col: 'second', ref: shape === 'ladder' ? 'w0' : 'H' });
  if (L.c) labels.push({ a: 'H', b: 'V', t: L.c, col: 'link', ref: 'K', t2: L.c2, step2: L.c2 ? 'swap' : undefined, step: o.solveC ? 'c' : undefined });
  const spec: SketchSpec = { pts, polys, segs, labels, maxUnit: 120 };
  if (mark) spec.rights = [{ at: 'K', a: 'H', b: 'V' }];
  if (o.ask) spec.angles = [{ at: 'K', a: 'H', b: 'V', t: '?' }];
  return pic(spec, [], [...(o.solveC ? ['c'] : []), ...(L.c2 ? ['swap'] : [])]);
}

// ---------- boxes ----------
export type Hl = 'AC' | 'CG' | 'AG' | 'AF' | 'BG' | 'ABC' | 'ACG' | 'ABF';
export interface BoxOpts {
  /** edge labels (TeX): l on AB, w on BC, h on CG */
  l?: string; w?: string; h?: string;
  /** highlights drawn at once / in the solve replay */
  now?: Hl[]; solve?: Hl[];
  /** corner letters to show */
  verts?: BoxV[];
  /** the projected right-angle mark at C between CA and CG (at once / in the solve) */
  mark?: 'now' | 'solve';
}
const HL: Record<Exclude<Hl, 'ABC' | 'ACG' | 'ABF'>, { a: BoxV; b: BoxV; col: Paint }> = {
  AC: { a: 'A', b: 'C', col: 'first' }, CG: { a: 'C', b: 'G', col: 'second' }, AG: { a: 'A', b: 'G', col: 'link' },
  AF: { a: 'A', b: 'F', col: 'pick' }, BG: { a: 'B', b: 'G', col: 'pick' },
};
const TRI: Record<'ABC' | 'ACG' | 'ABF', BoxV[]> = { ABC: ['A', 'B', 'C'], ACG: ['A', 'C', 'G'], ABF: ['A', 'B', 'F'] };
export function boxSketch(l: number, w: number, h: number, o: BoxOpts = {}): SketchPic {
  const [dl, dw, dh] = drawnBox(l, w, h);
  const V3 = box3(dl, dw, dh);
  const pts: Record<string, Pt> = {};
  for (const k of Object.keys(V3) as BoxV[]) pts[k] = project(V3[k]);
  const m = mark3(V3.C, V3.A, V3.G, Math.min(dl, dw, dh) * 0.16);
  pts.m1 = m[0]; pts.m2 = m[1]; pts.m3 = m[2];
  const polys: SketchSpec['polys'] = [
    { pts: ['A', 'B', 'F', 'E'], col: '#2A2F5C', alpha: 0.55 },
    { pts: ['B', 'C', 'G', 'F'], col: '#252A55', alpha: 0.55 },
    { pts: ['E', 'F', 'G', 'H'], col: '#30366A', alpha: 0.55 },
  ];
  const step = (x: Hl) => (o.solve?.includes(x) ? x : (o.now ?? []).includes(x) ? undefined : null);
  for (const t of ['ABC', 'ACG', 'ABF'] as const) { const s = step(t); if (s !== null) polys.push({ pts: TRI[t], col: 'pick', alpha: 0.5, step: s }); }
  const segs: SkSeg[] = BOX_EDGES.map(([a, b, hid]) => ({ a, b, col: hid ? 'faint' : 'dim', w: hid ? 3 : 3.5, dash: hid }));
  for (const k of Object.keys(HL) as (keyof typeof HL)[]) { const s = step(k); if (s !== null) segs.push({ a: HL[k].a, b: HL[k].b, col: HL[k].col, w: 7, step: s, glow: 'g' + k }); }
  const labels: SkLabel[] = [];
  if (o.l) labels.push({ a: 'A', b: 'B', t: o.l, col: 'ink', ref: 'E' });
  if (o.w) labels.push({ a: 'B', b: 'C', t: o.w, col: 'ink', ref: 'A' });
  if (o.h) labels.push({ a: 'C', b: 'G', t: o.h, col: 'ink', ref: 'A' });
  const spec: SketchSpec = { pts, polys, segs, labels, verts: (o.verts ?? []).map(v => ({ at: v, t: `\\text{${v}}` })), maxUnit: 130 };
  if (o.mark) spec.marks = [{ pts: ['m1', 'm2', 'm3'], step: o.mark === 'solve' ? 'mark' : undefined, glow: 'gmark' }];
  const solve = [...(o.solve ?? []), ...(o.mark === 'solve' ? ['mark'] : [])];
  return pic(spec, [], solve);
}

// ---------- a right triangle inside a bigger figure ----------
/** rectangle ABCD (A bottom left, counter-clockwise), cut by one diagonal; `tri` is the triangle asked about */
export function rectSketch(w: number, h: number, diag: 'AC' | 'BD', tri: string, letters: [string, string, string, string]): SketchPic {
  const [x, y] = drawn2(w, h, 6);
  const [A, B, C, D] = letters;
  const pts: Record<string, Pt> = { [A]: [0, 0], [B]: [x, 0], [C]: [x, y], [D]: [0, y] };
  const triV = tri.split('');
  const right = triV.find(v => { const i = letters.indexOf(v); const d = diag === 'AC' ? [0, 2] : [1, 3]; return !d.includes(i); })!;
  const others = triV.filter(v => v !== right);
  return pic({
    pts,
    polys: [{ pts: [A, B, C, D], col: '#2A2F5C', alpha: 0.7 }, { pts: triV, col: 'pick', alpha: 0.42 }],
    segs: [{ a: A, b: B, col: 'dim', w: 4 }, { a: B, b: C, col: 'dim', w: 4 }, { a: C, b: D, col: 'dim', w: 4 }, { a: D, b: A, col: 'dim', w: 4 },
      { a: diag === 'AC' ? A : B, b: diag === 'AC' ? C : D, col: 'dim', w: 4 }],
    rights: letters.map((v, i) => ({ at: v, a: letters[(i + 1) % 4]!, b: letters[(i + 3) % 4]! })),
    verts: letters.map(v => ({ at: v, t: `\\text{${v}}` })),
    maxUnit: 120,
  }, [], others.length ? [] : []);
}
/** isosceles triangle P (top), Q, R (base), M the foot of the height from P; the right triangle PQM or PRM */
export function isoSketch(base: number, height: number, letters: [string, string, string, string]): SketchPic {
  const [x, y] = drawn2(base / 2, height, 5);
  const [P, Q, R, M] = letters;
  return pic({
    pts: { [P]: [x, y], [Q]: [0, 0], [R]: [2 * x, 0], [M]: [x, 0] },
    polys: [{ pts: [P, Q, R], col: '#2A2F5C', alpha: 0.7 }],
    segs: [{ a: P, b: Q, col: 'dim', w: 4 }, { a: P, b: R, col: 'dim', w: 4 }, { a: Q, b: R, col: 'dim', w: 4 }, { a: P, b: M, col: 'dim', w: 4, dash: true }],
    rights: [{ at: M, a: R, b: P }],
    verts: [P, Q, R, M].map(v => ({ at: v, t: `\\text{${v}}` })),
    maxUnit: 120,
  });
}

// ---------- the converse proof ----------
/** the given triangle (no mark: is its corner square?) and a constructed right triangle with legs a and b that turns
 *  and slides onto it at step 'lay'. Steps: 'built' (the new triangle), 'hyp' (its hypotenuse label "?" -> c), 'lay',
 *  'mark' (the corner of the given triangle gets its mark). */
export function converseSketch(a: number, b: number, c: string, aT: string, bT: string): SketchPic {
  const [x, y] = drawn2(b, a, 7);   // x along b, y along a
  const turn = 0.36;
  const f = converseFigure(y, x, turn, [0.6, -y - 2.6]);
  return pic({
    pts: { R: f.R, P: f.P, Q: f.Q, Z: f.Z, X: f.X, Y: f.Y },
    polys: [{ pts: ['R', 'P', 'Q'], col: '#4A4580', alpha: 0.9 }, { pts: ['Z', 'X', 'Y'], col: '#2C6B6A', alpha: 0.85, step: 'built', group: 'g' }],
    segs: [
      { a: 'R', b: 'P', col: 'first', w: 6 }, { a: 'R', b: 'Q', col: 'second', w: 6 }, { a: 'P', b: 'Q', col: 'link', w: 6 },
      { a: 'Z', b: 'X', col: 'first', w: 6, step: 'built', group: 'g' }, { a: 'Z', b: 'Y', col: 'second', w: 6, step: 'built', group: 'g' },
      { a: 'X', b: 'Y', col: 'link', w: 6, step: 'built', group: 'g' },
    ],
    rights: [{ at: 'Z', a: 'X', b: 'Y', step: 'built', group: 'g', glow: 'gZ' }, { at: 'R', a: 'P', b: 'Q', step: 'mark', glow: 'gR' }],
    angles: [{ at: 'R', a: 'P', b: 'Q', t: '?', step: 'ask' }],
    labels: [
      { a: 'R', b: 'P', t: aT, col: 'first', ref: 'Q' }, { a: 'R', b: 'Q', t: bT, col: 'second', ref: 'P' }, { a: 'P', b: 'Q', t: c, col: 'link', ref: 'R' },
      { a: 'Z', b: 'X', t: aT, col: 'first', ref: 'Y', step: 'built', group: 'g', hide: 'lay' },
      { a: 'Z', b: 'Y', t: bT, col: 'second', ref: 'X', step: 'built', group: 'g', hide: 'lay' },
      { a: 'X', b: 'Y', t: '?', t2: c, step2: 'hyp', col: 'link', ref: 'Z', step: 'built', group: 'g', hide: 'lay' },
    ],
    groups: [{ id: 'g', key: 'lay', about: 'Z', rot: f.rot, dx: f.dx, dy: f.dy }],
    maxUnit: 100,
  }, ['ask'], ['built', 'hyp', 'lay', 'mark']);
}

// ---------- a number line with a root ----------
export function lineSketch(k: number, rootT: string, pos: number): SketchPic {
  const pts: Record<string, Pt> = { L0: [-0.6, 0], L1: [3.6, 0], r0: [pos - k + 1, 0], r1: [pos - k + 1, 0.5], rt: [pos - k + 1, 1.15] };
  const segs: SkSeg[] = [{ a: 'L0', b: 'L1', col: 'dim', w: 4 }];
  const texts: NonNullable<SketchSpec['texts']> = [];
  for (let i = 0; i < 4; i++) {
    pts[`t${i}`] = [i, 0.28]; pts[`b${i}`] = [i, -0.28]; pts[`n${i}`] = [i, -0.85];
    segs.push({ a: `t${i}`, b: `b${i}`, col: 'dim', w: 4 });
    texts.push({ at: `n${i}`, t: String(k - 1 + i), col: 'ink' });
  }
  segs.push({ a: 'r0', b: 'r1', col: 'link', w: 6, step: 'root' });
  texts.push({ at: 'rt', t: rootT, col: 'link', step: 'root' });
  return pic({ pts, segs, texts, maxUnit: 260 }, [], ['root']);
}
/** one upright square, its area inside, its side under it ("?" -> the root at step swap) */
export function squareSketch(areaT: string, sideT: string, side2: string): SketchPic {
  return pic({
    pts: { A: [0, 0], B: [5, 0], C: [5, 5], D: [0, 5], M: [2.5, 2.5] },
    polys: [{ pts: ['A', 'B', 'C', 'D'], col: 'link', alpha: 0.9 }],
    texts: [{ at: 'M', t: areaT, size: 96 }],
    labels: [{ a: 'A', b: 'B', t: sideT, t2: side2, step2: 'swap', col: 'link', ref: 'C' }],
    maxUnit: 120,
  }, [], ['swap']);
}
/** a triangle drawn true to three lengths, labels in the order given (TeX); `ask` puts "?" at the corner across from
 *  the longest side, `mark` the right-angle mark there (only for a right triangle) */
export function sssSketch(s: [number, number, number], labels: [string, string, string], o: { ask?: boolean; mark?: 'now' | 'solve'; verts?: [string, string, string] } = {}): SketchPic {
  // sssPts gives [R, A, B] with |RA| = shortest, |RB| = middle, |AB| = longest
  const order = s.map((v, i) => [v, i] as const).sort((p, q) => p[0] - q[0]);
  const [R, A, B] = sssPts(s);
  const lab = (k: number) => labels[order[k]![1]]!;
  const spec: SketchSpec = {
    pts: { R, A, B },
    polys: [{ pts: ['R', 'A', 'B'], col: '#4A4580', alpha: 0.9 }],
    segs: [{ a: 'R', b: 'A', col: 'first', w: 6 }, { a: 'R', b: 'B', col: 'second', w: 6 }, { a: 'A', b: 'B', col: 'link', w: 6 }],
    labels: [{ a: 'R', b: 'A', t: lab(0), col: 'first', ref: 'B' }, { a: 'R', b: 'B', t: lab(1), col: 'second', ref: 'A' }, { a: 'A', b: 'B', t: lab(2), col: 'link', ref: 'R' }],
    maxUnit: 110,
  };
  if (o.ask) spec.angles = [{ at: 'R', a: 'A', b: 'B', t: '?', step: o.mark === 'solve' ? 'ask' : undefined }];
  if (o.mark) spec.rights = [{ at: 'R', a: 'A', b: 'B', step: o.mark === 'solve' ? 'mark' : undefined }];
  if (o.verts) spec.verts = [{ at: 'R', t: `\\text{${o.verts[0]}}` }, { at: 'A', t: `\\text{${o.verts[1]}}` }, { at: 'B', t: `\\text{${o.verts[2]}}` }];
  return pic(spec, o.ask && o.mark === 'solve' ? ['ask'] : [], o.mark === 'solve' ? ['mark'] : []);
}
