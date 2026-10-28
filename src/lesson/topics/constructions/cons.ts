// cons.ts: the exact maths of "Constructions with compass and straightedge" (Geometry, lesson 6). Pure: no DOM.
// A construction (Cons) is the given figure plus a list of STEPS. Every step names its tool:
//   compass       an arc (or a few arcs) about a known point, with a known or transferred width
//   straightedge  a line / ray / segment through two known points
//   mark          naming a point that is already determined (an intersection), or a freely chosen point
//   ruler | protractor | eye   NOT construction moves: measuring with a scale, or placing by eye
// Every point lists the steps it depends on (an intersection exists once both of its curves are drawn); a step
// lists the points it needs and the steps that must come before it (a "keep the same width" step needs the step
// that set the width). An order of steps is valid when every step comes after what it needs (validOrder). All
// positions are computed (circle-circle, line-circle, line-line intersections), never typed in.
// Model coordinates: px-like, y UP (as geometry-foundations/geo.ts).
import { type Pt, add, angOf, at, dirv, dist, lerpP, measure, mul, norm, rotP, sub, unit } from '../geometry-foundations/geo';

export type Tool = 'compass' | 'straightedge' | 'mark' | 'ruler' | 'protractor' | 'eye';
export const LEGAL: readonly Tool[] = ['compass', 'straightedge', 'mark'];
export const isLegal = (t: Tool) => LEGAL.includes(t);
/** an arc: centre, radius, start angle (degrees, y up, counter-clockwise) and span */
export interface Arc { c: Pt; r: number; a0: number; span: number }
export type LnRole = 'given' | 'aux' | 'result';
export interface Ln { a: Pt; b: Pt; kind: 'seg' | 'ray' | 'line'; role: LnRole; name?: string; dash?: boolean }
export interface CPt { name: string; at: Pt; deps: string[]; /** preferred label direction (degrees, y up) */ dir?: number }
export interface Step {
  id: string; tool: Tool;
  /** what the step does, HTML (segment names with overlines) */
  text: string;
  /** points the step needs (they must exist before it) */
  needs: string[];
  /** steps that must come first (the width this step keeps was set there) */
  after: string[];
  arcs: Arc[]; lines: Ln[];
  /** compass: the needle point (the glyph stands on it) */
  needle?: Pt;
  /** a freely chosen auxiliary element (any width big enough, any line through P): legal */
  free?: boolean;
}
export type Kind = 'copySeg' | 'equilateral' | 'perpBis' | 'angleBis' | 'perpAt' | 'perpFrom' | 'copyAngle' | 'parallelPerp' | 'parallelCorr' | 'hexagon' | 'square';
export interface Cons { kind: Kind; given: Ln[]; givenArcs: Arc[]; pts: CPt[]; steps: Step[]; /** a deliberate flaw (for diagnosis items) */ flaw?: string }

// ---------- intersections ----------
/** circle-circle: [] / [tangent point] / [left of c1->c2, right of c1->c2] */
export function ccx(c1: Pt, r1: number, c2: Pt, r2: number): Pt[] {
  const d = dist(c1, c2);
  if (d < 1e-9 || d > r1 + r2 + 1e-7 || d < Math.abs(r1 - r2) - 1e-7) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h2 = r1 * r1 - a * a, u = unit(sub(c2, c1)), m = add(c1, mul(u, a));
  if (h2 <= 1e-7) return [m];
  const h = Math.sqrt(h2), n: Pt = [-u[1], u[0]];
  return [add(m, mul(n, h)), add(m, mul(n, -h))];
}
/** line p-q with a circle: points in order of the parameter along p->q */
export function lcx(p: Pt, q: Pt, c: Pt, r: number): Pt[] {
  const d = sub(q, p), f = sub(p, c);
  const A = d[0] * d[0] + d[1] * d[1], B = 2 * (f[0] * d[0] + f[1] * d[1]), C = f[0] * f[0] + f[1] * f[1] - r * r;
  const D = B * B - 4 * A * C;
  if (D < -1e-7) return [];
  if (D <= 1e-7 * A) return [add(p, mul(d, -B / (2 * A)))];
  const s = Math.sqrt(D);
  return [add(p, mul(d, (-B - s) / (2 * A))), add(p, mul(d, (-B + s) / (2 * A)))];
}
export function llx(p1: Pt, p2: Pt, q1: Pt, q2: Pt): Pt {
  const u = sub(p2, p1), w = sub(q2, q1), d = u[0] * w[1] - u[1] * w[0];
  if (Math.abs(d) < 1e-12) throw new Error('parallel lines do not meet');
  const s = ((q1[0] - p1[0]) * w[1] - (q1[1] - p1[1]) * w[0]) / d;
  return add(p1, mul(u, s));
}
/** the foot of the perpendicular from p to line a-b */
export function foot(p: Pt, a: Pt, b: Pt): Pt { const u = unit(sub(b, a)); const t = (p[0] - a[0]) * u[0] + (p[1] - a[1]) * u[1]; return add(a, mul(u, t)); }
/** the distance from p to line a-b */
export const lineDist = (p: Pt, a: Pt, b: Pt) => dist(p, foot(p, a, b));
/** signed side of p relative to a->b (+ = left) */
export const sideOf = (p: Pt, a: Pt, b: Pt) => Math.sign((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
/** the angle between two lines (0..90) */
export function lineAngle(a1: Pt, b1: Pt, a2: Pt, b2: Pt): number { const s = Math.abs(norm(angOf(sub(b1, a1)) - angOf(sub(b2, a2))) % 180); return s > 90 ? 180 - s : s; }

// ---------- arcs and lines ----------
/** a short arc about c through X (half-span in degrees) */
export const arcAt = (c: Pt, r: number, X: Pt, half = 15): Arc => ({ c, r, a0: angOf(sub(X, c)) - half, span: 2 * half });
/** an arc about c from the direction of X to the direction of Y (the shorter way), with pad degrees beyond both */
export function arcFromTo(c: Pt, r: number, X: Pt, Y: Pt, pad = 12): Arc {
  const ax = angOf(sub(X, c)), ay = angOf(sub(Y, c));
  let s = norm(ay - ax);
  if (s <= 180) return { c, r, a0: ax - pad, span: s + 2 * pad };
  s = 360 - s;
  return { c, r, a0: ay - pad, span: s + 2 * pad };
}
export const fullCircle = (c: Pt, r: number): Arc => ({ c, r, a0: 0, span: 360 });
/** sample an arc (model units) */
export function arcSample(A: Arc, n = 0): Pt[] {
  const m = n || Math.max(8, Math.ceil(A.span / 4)), P: Pt[] = [];
  for (let i = 0; i <= m; i++) P.push(at(A.c, A.a0 + (A.span * i) / m, A.r));
  return P;
}
/** a line through a and b, drawn past both by ext */
export function lineThru(a: Pt, b: Pt, ext: number, role: LnRole = 'result', o: Partial<Ln> = {}): Ln {
  const u = unit(sub(b, a));
  return { a: sub(a, mul(u, ext)), b: add(b, mul(u, ext)), kind: 'line', role, ...o };
}
export const seg = (a: Pt, b: Pt, role: LnRole = 'given', o: Partial<Ln> = {}): Ln => ({ a, b, kind: 'seg', role, ...o });
export const ray = (a: Pt, b: Pt, role: LnRole = 'given', o: Partial<Ln> = {}): Ln => ({ a, b, kind: 'ray', role, ...o });

// ---------- order ----------
export function pointsAfter(c: Cons, done: ReadonlySet<string>): Set<string> {
  return new Set(c.pts.filter(p => p.deps.every(d => done.has(d))).map(p => p.name));
}
export function canDo(c: Cons, s: Step, done: ReadonlySet<string>): boolean {
  if (done.has(s.id)) return false;
  const have = pointsAfter(c, done);
  return s.needs.every(n => have.has(n)) && s.after.every(a => done.has(a));
}
/** every step exactly once, each after what it needs */
export function validOrder(c: Cons, order: readonly string[]): boolean {
  if (order.length !== c.steps.length || new Set(order).size !== order.length) return false;
  const done = new Set<string>();
  for (const id of order) {
    const s = c.steps.find(x => x.id === id);
    if (!s || !canDo(c, s, done)) return false;
    done.add(id);
  }
  return true;
}
/** the steps that may come next after `done` */
export const nextSteps = (c: Cons, done: ReadonlySet<string>) => c.steps.filter(s => canDo(c, s, done));
export const pt = (c: Cons, name: string): Pt => { const p = c.pts.find(x => x.name === name); if (!p) throw new Error(`no point ${name}`); return p.at; };

// ---------- names ----------
const pickN = <T>(R: () => number, xs: readonly T[]) => xs[Math.floor(R() * xs.length)]!;
export const SEG_NAMES: [string, string][] = [['A', 'B'], ['C', 'D'], ['J', 'K'], ['R', 'S'], ['E', 'F'], ['G', 'H'], ['T', 'U']];
export const CROSS_NAMES: [string, string][] = [['P', 'Q'], ['X', 'Y'], ['U', 'V'], ['W', 'Z']];
/** overlined segment name (survives plain text) */
export const sg = (s: string) => [...s].map(ch => ch + '̅').join('');
export interface Opt { names?: Record<string, string> }

// ---------- the constructions ----------
const r = (R: () => number, lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
/** a direction: horizontal, vertical or slanted */
export type Orient = 'h' | 'v' | 's';
const orientDeg = (R: () => number, o: Orient) => (o === 'h' ? 0 : o === 'v' ? 90 : pickN(R, [1, -1]) * r(R, 18, 62));

/** copy a segment AB onto the ray from C (twice: CE = 2 AB) */
export function copySeg(R: () => number, o: { twice?: boolean; short?: boolean; names?: [string, string, string, string, string] } = {}): Cons {
  const [a, b, cN, d, e] = o.names ?? ['A', 'B', 'C', 'D', 'E'];
  const L = r(R, 180, 240), th = r(R, -35, 35);
  const A: Pt = [0, 0], B = at(A, th, L);
  const phi = th - r(R, 15, 45);   // the ray heads away from AB, in another direction
  const C: Pt = add(A, at([0, 0], th - 90, r(R, 170, 210)));
  const reach = o.twice ? 2 * L + 70 : L + 90;
  const D = at(C, phi, L), E = at(C, phi, 2 * L);
  const rayEnd = at(C, phi, o.short ? L * 0.6 : reach);
  const given: Ln[] = [seg(A, B), ray(C, rayEnd)];
  const steps: Step[] = [
    { id: 'set', tool: 'compass', text: `Put the needle on ${a} and open the compass to ${b}.`, needs: [a, b], after: [], arcs: [arcAt(A, L, B, 12)], lines: [], needle: A },
  ];
  if (o.short) steps.push({ id: 'ext', tool: 'straightedge', text: `The ray is shorter than ${sg(a + b)}: extend it with the straightedge.`, needs: [cN], after: [], arcs: [], lines: [ray(at(C, phi, L * 0.6), at(C, phi, reach), 'aux')] });
  steps.push({ id: 'arc1', tool: 'compass', text: `Keep that width. Put the needle on ${cN} and draw an arc across the ray: it crosses at ${d}.`, needs: [cN], after: ['set', ...(o.short ? ['ext'] : [])], arcs: [arcAt(C, L, D, 14)], lines: [], needle: C });
  if (o.twice) steps.push({ id: 'arc2', tool: 'compass', text: `Keep the same width. Put the needle on ${d} and draw an arc across the ray: it crosses at ${e}.`, needs: [d], after: ['arc1'], arcs: [arcAt(D, L, E, 14)], lines: [], needle: D });
  const pts: CPt[] = [{ name: a, at: A, deps: [] }, { name: b, at: B, deps: [] }, { name: cN, at: C, deps: [] }, { name: d, at: D, deps: ['arc1'] }];
  if (o.twice) pts.push({ name: e, at: E, deps: ['arc2'] });
  return { kind: 'copySeg', given, givenArcs: [], pts, steps };
}

/** an equilateral triangle on AB (both crossings: a rhombus) */
export function equilateral(R: () => number, o: { both?: boolean; orient?: Orient; names?: [string, string, string, string] } = {}): Cons {
  const [a, b, cN, c2] = o.names ?? ['A', 'B', 'C', 'D'];
  const L = r(R, 260, 330), th = orientDeg(R, o.orient ?? 'h');
  const A: Pt = [0, 0], B = at(A, th, L);
  const [C, C2] = ccx(A, L, B, L) as [Pt, Pt];
  const steps: Step[] = [
    { id: 'arcA', tool: 'compass', text: `Put the needle on ${a} and open the compass to ${b}. Draw an arc ${o.both ? 'on both sides of' : 'beside'} ${sg(a + b)}.`, needs: [a, b], after: [], arcs: o.both ? [arcAt(A, L, C, 16), arcAt(A, L, C2, 16)] : [arcAt(A, L, C, 18)], lines: [], needle: A },
    { id: 'arcB', tool: 'compass', text: `Keep that width. Put the needle on ${b} and draw an arc crossing the first${o.both ? ' twice' : ''}: ${o.both ? `at ${cN} and ${c2}` : `at ${cN}`}.`, needs: [b], after: ['arcA'], arcs: o.both ? [arcAt(B, L, C, 16), arcAt(B, L, C2, 16)] : [arcAt(B, L, C, 18)], lines: [], needle: B },
    { id: 'join', tool: 'straightedge', text: o.both ? `Join ${a} and ${b} to ${cN} and to ${c2} with the straightedge.` : `Join ${sg(a + cN)} and ${sg(b + cN)} with the straightedge.`, needs: o.both ? [a, b, cN, c2] : [a, b, cN], after: [], arcs: [], lines: [seg(A, C, 'result'), seg(B, C, 'result'), ...(o.both ? [seg(A, C2, 'result'), seg(B, C2, 'result')] : [])] },
  ];
  const pts: CPt[] = [{ name: a, at: A, deps: [] }, { name: b, at: B, deps: [] }, { name: cN, at: C, deps: ['arcA', 'arcB'] }];
  if (o.both) pts.push({ name: c2, at: C2, deps: ['arcA', 'arcB'] });
  return { kind: 'equilateral', given: [seg(A, B)], givenArcs: [], pts, steps };
}

/** the perpendicular bisector of AB: equal arcs from A and B wider than half AB cross at P and Q; line PQ; M */
export function perpBis(R: () => number, o: { orient?: Orient; w?: number; wk?: number; names?: [string, string, string, string, string]; wB?: number } = {}): Cons {
  const [a, b, p, q, m] = o.names ?? ['A', 'B', 'P', 'Q', 'M'];
  const L = r(R, 280, 360), th = orientDeg(R, o.orient ?? pickN(R, ['h', 'v', 's'] as Orient[]));
  const A: Pt = [0, 0], B = at(A, th, L);
  const w = o.w ?? L * (o.wk ?? 0.62 + 0.2 * R()), wB = o.wB ?? w;
  const X = ccx(A, w, B, wB);
  if (X.length < 2) throw new Error('perpBis: arcs do not cross');
  const [P, Q] = X as [Pt, Pt];
  const M = llx(P, Q, A, B);
  const same = Math.abs(w - wB) < 1e-9;
  const steps: Step[] = [
    { id: 'arcA', tool: 'compass', text: `Open the compass wider than half of ${sg(a + b)}. Put the needle on ${a} and draw arcs on both sides of ${sg(a + b)}.`, needs: [a, b], after: [], arcs: [arcAt(A, w, P, 15), arcAt(A, w, Q, 15)], lines: [], needle: A, free: true },
    { id: 'arcB', tool: 'compass', text: same ? `Keep that width. Put the needle on ${b} and draw arcs crossing the first two at ${p} and ${q}.` : `Open the compass a little ${wB > w ? 'wider' : 'narrower'}. Put the needle on ${b} and draw arcs crossing the first two at ${p} and ${q}.`, needs: [b], after: ['arcA'], arcs: [arcAt(B, wB, P, 15), arcAt(B, wB, Q, 15)], lines: [], needle: B },
    { id: 'line', tool: 'straightedge', text: `Draw line ${p}${q} with the straightedge.`, needs: [p, q], after: [], arcs: [], lines: [lineThru(P, Q, 70)] },
    { id: 'mid', tool: 'mark', text: `Label ${m}, where line ${p}${q} crosses ${sg(a + b)}.`, needs: [], after: ['line'], arcs: [], lines: [] },
  ];
  const pts: CPt[] = [{ name: a, at: A, deps: [] }, { name: b, at: B, deps: [] }, { name: p, at: P, deps: ['arcA', 'arcB'] }, { name: q, at: Q, deps: ['arcA', 'arcB'] }, { name: m, at: M, deps: ['mid'], dir: th - 135 }];
  return { kind: 'perpBis', given: [seg(A, B)], givenArcs: [], pts, steps, flaw: same ? undefined : 'widths' };
}

/** the bisector of angle AOB: an arc about O cuts the rays at A and B, equal arcs from A and B cross at X, ray OX.
 *  unequal: the marks on the rays at different distances (a flawed construction) */
export function angleBis(R: () => number, o: { deg?: number; unequal?: boolean; names?: [string, string, string, string] } = {}): Cons {
  const [oN, a, b, x] = o.names ?? ['O', 'A', 'B', 'X'];
  const deg = o.deg ?? r(R, 40, 140), th0 = r(R, -40, 40) + (deg > 110 ? -20 : 0);
  const O: Pt = [0, 0];
  const l1 = r(R, 330, 400), l2 = r(R, 250, 320);
  const swap = R() < 0.5;
  const E1 = at(O, th0, swap ? l2 : l1), E2 = at(O, th0 + deg, swap ? l1 : l2);
  const r1 = r(R, 150, 180), r2 = o.unequal ? r1 + pickN(R, [1, -1]) * r(R, 50, 70) : r1;
  const A = at(O, th0, r1), B = at(O, th0 + deg, r2);
  const w = dist(A, B) * (0.7 + 0.15 * R());
  const X = ccx(A, w, B, w).sort((p1, p2) => dist(p2, O) - dist(p1, O))[0]!;
  const tip = at(O, angOf(sub(X, O)), Math.max(dist(X, O) + 90, Math.min(l1, l2)));
  const steps: Step[] = [
    o.unequal
      ? { id: 'arcO', tool: 'compass', text: `Put the needle on ${oN}. Draw an arc crossing one ray at ${a}; open the compass ${r2 > r1 ? 'wider' : 'narrower'} and draw an arc crossing the other ray at ${b}.`, needs: [oN], after: [], arcs: [arcAt(O, r1, A, 14), arcAt(O, r2, B, 14)], lines: [], needle: O, free: true }
      : { id: 'arcO', tool: 'compass', text: `Put the needle on ${oN} and draw an arc crossing both rays, at ${a} and ${b}.`, needs: [oN], after: [], arcs: [arcFromTo(O, r1, A, B, 12)], lines: [], needle: O, free: true },
    { id: 'arcA', tool: 'compass', text: `Put the needle on ${a} and draw an arc inside the angle.`, needs: [a], after: [], arcs: [arcAt(A, w, X, 15)], lines: [], needle: A, free: true },
    { id: 'arcB', tool: 'compass', text: `Keep that width. Put the needle on ${b} and draw an arc crossing the last one at ${x}.`, needs: [b], after: ['arcA'], arcs: [arcAt(B, w, X, 15)], lines: [], needle: B },
    { id: 'ray', tool: 'straightedge', text: `Draw ray ${oN}${x} with the straightedge.`, needs: [oN, x], after: [], arcs: [], lines: [ray(O, tip, 'result')] },
  ];
  const pts: CPt[] = [{ name: oN, at: O, deps: [] }, { name: a, at: A, deps: ['arcO'] }, { name: b, at: B, deps: ['arcO'] }, { name: x, at: X, deps: ['arcA', 'arcB'] }];
  return { kind: 'angleBis', given: [ray(O, E1), ray(O, E2)], givenArcs: [], pts, steps, flaw: o.unequal ? 'rayMarks' : undefined };
}

/** the perpendicular to a line at P on it: arcs about P cut the line at A and B (PA = PB), wider equal arcs from A
 *  and B cross at X, line PX. off: A and B not symmetric about P (a bisector of some other segment) */
export function perpAt(R: () => number, o: { orient?: Orient; off?: boolean; names?: [string, string, string, string] } = {}): Cons {
  const [p, a, b, x] = o.names ?? ['P', 'A', 'B', 'X'];
  const th = orientDeg(R, o.orient ?? pickN(R, ['h', 's'] as Orient[]));
  const P: Pt = [0, 0], d = r(R, 120, 150), ra = o.off ? d + r(R, 45, 65) : d;
  const A = at(P, th + 180, ra), B = at(P, th, d);
  const w = dist(A, B) * (0.68 + 0.12 * R());
  const X = ccx(A, w, B, w)[0]!;
  const half = r(R, 300, 360);
  const steps: Step[] = [
    o.off
      ? { id: 'arcP', tool: 'compass', text: `Put the needle on ${p}. Draw an arc crossing the line at ${b}, then open wider and cross it at ${a} on the other side.`, needs: [p], after: [], arcs: [arcAt(P, ra, A, 12), arcAt(P, d, B, 12)], lines: [], needle: P, free: true }
      : { id: 'arcP', tool: 'compass', text: `Put the needle on ${p} and draw arcs crossing the line on both sides, at ${a} and ${b}.`, needs: [p], after: [], arcs: [arcAt(P, d, A, 12), arcAt(P, d, B, 12)], lines: [], needle: P, free: true },
    { id: 'arcA', tool: 'compass', text: `Open the compass wider. Put the needle on ${a} and draw an arc ${th === 0 ? 'above' : 'off'} the line.`, needs: [a], after: ['arcP'], arcs: [arcAt(A, w, X, 14)], lines: [], needle: A, free: true },
    { id: 'arcB', tool: 'compass', text: `Keep that width. Put the needle on ${b} and draw an arc crossing it at ${x}.`, needs: [b], after: ['arcA'], arcs: [arcAt(B, w, X, 14)], lines: [], needle: B },
    { id: 'line', tool: 'straightedge', text: `Draw line ${p}${x} with the straightedge.`, needs: [p, x], after: [], arcs: [], lines: [lineThru(P, X, 90)] },
  ];
  const pts: CPt[] = [{ name: p, at: P, deps: [], dir: th - 90 }, { name: a, at: A, deps: ['arcP'], dir: th - 90 }, { name: b, at: B, deps: ['arcP'], dir: th - 90 }, { name: x, at: X, deps: ['arcA', 'arcB'] }];
  return { kind: 'perpAt', given: [lineThru(at(P, th + 180, half), at(P, th, half), 0, 'given', { name: 'ℓ' })], givenArcs: [], pts, steps, flaw: o.off ? 'offCentre' : undefined };
}

/** the perpendicular from P (off the line): an arc about P cuts the line at A and B, equal arcs from A and B cross at X
 *  on the other side, line PX meets the line at F. radius: 'cut' (default) or 'tangent' (the arc only touches) */
export function perpFrom(R: () => number, o: { orient?: Orient; names?: [string, string, string, string, string] } = {}): Cons {
  const [p, a, b, x, f] = o.names ?? ['P', 'A', 'B', 'X', 'F'];
  const th = orientDeg(R, o.orient ?? pickN(R, ['h', 's'] as Orient[]));
  const F: Pt = [0, 0], dd = r(R, 130, 170), P = at(F, th + 90, dd);
  const off = r(R, -40, 40);
  const Fs = at(F, th, off), Ps = add(P, sub(Fs, F));   // shift along the line so P is not centred
  const rad = dd * (1.25 + 0.2 * R());
  const L1 = at(Fs, th + 180, 380), L2 = at(Fs, th, 380);
  const [A, B] = lcx(L1, L2, Ps, rad) as [Pt, Pt];
  const w = dist(A, B) * (0.7 + 0.12 * R());
  const X = ccx(A, w, B, w).find(q => sideOf(q, L1, L2) !== sideOf(Ps, L1, L2))!;
  const steps: Step[] = [
    { id: 'arcP', tool: 'compass', text: `Put the needle on ${p}. Open the compass wider than the distance to the line and draw an arc crossing the line at ${a} and ${b}.`, needs: [p], after: [], arcs: [arcAt(Ps, rad, A, 11), arcAt(Ps, rad, B, 11)], lines: [], needle: Ps, free: true },
    { id: 'arcA', tool: 'compass', text: `Put the needle on ${a} and draw an arc on the far side of the line.`, needs: [a], after: [], arcs: [arcAt(A, w, X, 14)], lines: [], needle: A, free: true },
    { id: 'arcB', tool: 'compass', text: `Keep that width. Put the needle on ${b} and draw an arc crossing it at ${x}.`, needs: [b], after: ['arcA'], arcs: [arcAt(B, w, X, 14)], lines: [], needle: B },
    { id: 'line', tool: 'straightedge', text: `Draw line ${p}${x} with the straightedge.`, needs: [p, x], after: [], arcs: [], lines: [lineThru(Ps, X, 60)] },
  ];
  const pts: CPt[] = [{ name: p, at: Ps, deps: [] }, { name: a, at: A, deps: ['arcP'] }, { name: b, at: B, deps: ['arcP'] }, { name: x, at: X, deps: ['arcA', 'arcB'] }, { name: f, at: Fs, deps: ['line'] }];
  return { kind: 'perpFrom', given: [lineThru(L1, L2, 0, 'given', { name: 'ℓ' })], givenArcs: [], pts, steps };
}

/** copy angle O onto the ray from O2: equal arcs about O and O2 (A, B and A2), the chord AB transferred from A2 (B2),
 *  ray O2B2. radiusOnly: the chord is not transferred (a second arc with the radius again: a flawed copy) */
export function copyAngle(R: () => number, o: { deg?: number; radiusOnly?: boolean; names?: [string, string, string, string, string, string]; long?: boolean } = {}): Cons {
  const [oN, a, b, o2, a2, b2] = o.names ?? ['O', 'A', 'B', 'K', 'C', 'D'];
  let deg = o.deg ?? r(R, 35, 125);
  if (o.deg === undefined && Math.abs(deg - 60) < 10) deg = deg < 60 ? deg - 10 : deg + 10;   // never chord = radius (the chord step would be redundant)
  const th0 = r(R, -20, 20);
  const O: Pt = [0, 0], E1 = at(O, th0, r(R, 260, 300)), E2 = at(O, th0 + deg, r(R, 230, 280));
  const ra = r(R, 120, 150);
  const A = at(O, th0, ra), B = at(O, th0 + deg, ra);
  const th2 = r(R, -30, 30), O2: Pt = add(O, [r(R, 60, 120), -r(R, 380, 430)]);
  const A2 = at(O2, th2, ra), chord = dist(A, B);
  const B2 = o.radiusOnly ? ccx(O2, ra, A2, ra)[0]! : ccx(O2, ra, A2, chord)[0]!;   // [0] = left of O2->A2: counter-clockwise
  const rayLen = o.long ? 420 : r(R, 270, 320);
  const E3 = at(O2, th2, rayLen), tip = at(O2, angOf(sub(B2, O2)), o.long ? 400 : r(R, 240, 290));
  const steps: Step[] = [
    { id: 'arcO', tool: 'compass', text: `Put the needle on ${oN} and draw an arc crossing both sides of the angle, at ${a} and ${b}.`, needs: [oN], after: [], arcs: [arcFromTo(O, ra, A, B, 12)], lines: [], needle: O, free: true },
    { id: 'arcO2', tool: 'compass', text: `Keep that width. Put the needle on ${o2} and draw a long arc crossing the new ray at ${a2}.`, needs: [o2], after: ['arcO'], arcs: [arcFromTo(O2, ra, A2, B2, 22)], lines: [], needle: O2 },
    o.radiusOnly
      ? { id: 'chord', tool: 'compass', text: `Keep the same width. Put the needle on ${a2} and draw an arc crossing the long arc at ${b2}.`, needs: [a2], after: ['arcO2'], arcs: [arcAt(A2, ra, B2, 14)], lines: [], needle: A2 }
      : { id: 'set', tool: 'compass', text: `Put the needle on ${a} and open the compass to ${b}.`, needs: [a, b], after: ['arcO2'], arcs: [arcAt(A, chord, B, 10)], lines: [], needle: A },
    ...(o.radiusOnly ? [] : [{ id: 'chord', tool: 'compass' as Tool, text: `Keep that width. Put the needle on ${a2} and draw an arc crossing the long arc at ${b2}.`, needs: [a2], after: ['set'], arcs: [arcAt(A2, chord, B2, 14)], lines: [], needle: A2 }]),
    { id: 'ray', tool: 'straightedge', text: `Draw ray ${o2}${b2} with the straightedge.`, needs: [o2, b2], after: [], arcs: [], lines: [ray(O2, tip, 'result')] },
  ];
  const pts: CPt[] = [{ name: oN, at: O, deps: [] }, { name: a, at: A, deps: ['arcO'] }, { name: b, at: B, deps: ['arcO'] }, { name: o2, at: O2, deps: [] }, { name: a2, at: A2, deps: ['arcO2'] }, { name: b2, at: B2, deps: ['arcO2', 'chord'] }];
  return { kind: 'copyAngle', given: [ray(O, E1), ray(O, E2), ray(O2, E3)], givenArcs: [], pts, steps, flaw: o.radiusOnly ? 'radiusOnly' : undefined };
}

/** a parallel through P with two perpendiculars: m from P to ℓ (foot F), then n at P perpendicular to m.
 *  atFoot: the second perpendicular is built at F (a flawed version: it is ℓ again) */
export function parallelPerp(R: () => number, o: { orient?: Orient; names?: [string, string, string] } = {}): Cons {
  const [p, f, y] = o.names ?? ['P', 'F', 'Y'];
  const th = orientDeg(R, o.orient ?? pickN(R, ['h', 's'] as Orient[]));
  const F: Pt = [0, 0], dd = r(R, 200, 240), P = at(F, th + 90, dd);
  const L1 = at(F, th + 180, 340), L2 = at(F, th, 340);
  // first perpendicular: arc about P cuts ℓ at A1, B1; equal arcs below cross at X1
  const rad = dd * 1.22, [A1, B1] = lcx(L1, L2, P, rad) as [Pt, Pt], w1 = dist(A1, B1) * 0.72;
  const X1 = ccx(A1, w1, B1, w1).find(q => sideOf(q, L1, L2) !== sideOf(P, L1, L2))!;
  // second: arcs about P cut m at C and D; equal wider arcs cross at Y
  const d2 = 95, C = at(P, th + 90, d2), D = at(P, th - 90, d2), w2 = 2 * d2 * 0.85;
  const Y = ccx(C, w2, D, w2).find(q => sideOf(q, F, P) < 0) ?? ccx(C, w2, D, w2)[0]!;
  const steps: Step[] = [
    { id: 'perp1', tool: 'compass', text: `Construct the perpendicular from ${p} to ℓ: an arc about ${p} crossing ℓ twice, then equal arcs from those two points. Their crossing and ${p} fix line m.`, needs: [p], after: [], arcs: [arcAt(P, rad, A1, 9), arcAt(P, rad, B1, 9), arcAt(A1, w1, X1, 12), arcAt(B1, w1, X1, 12)], lines: [], needle: P, free: true },
    { id: 'm', tool: 'straightedge', text: `Draw line m through ${p} and the crossing; it meets ℓ at ${f}.`, needs: [p], after: ['perp1'], arcs: [], lines: [lineThru(P, X1, 130, 'aux', { name: 'm' })] },
    { id: 'arcP', tool: 'compass', text: `Put the needle on ${p} and draw arcs crossing m on both sides of ${p}.`, needs: [p], after: ['m'], arcs: [arcAt(P, d2, C, 14), arcAt(P, d2, D, 14)], lines: [], needle: P, free: true },
    { id: 'arcCD', tool: 'compass', text: `Open wider. From each of those two points, draw equal arcs crossing at ${y}.`, needs: [], after: ['arcP'], arcs: [arcAt(C, w2, Y, 13), arcAt(D, w2, Y, 13)], lines: [], needle: C },
    { id: 'n', tool: 'straightedge', text: `Draw line ${p}${y}: it is parallel to ℓ.`, needs: [p, y], after: [], arcs: [], lines: [lineThru(P, Y, 280, 'result', { name: 'n' })] },
  ];
  const pts: CPt[] = [{ name: p, at: P, deps: [] }, { name: f, at: F, deps: ['m'] }, { name: y, at: Y, deps: ['arcCD'] }];
  return { kind: 'parallelPerp', given: [lineThru(L1, L2, 0, 'given', { name: 'ℓ' })], givenArcs: [], pts, steps };
}

/** a parallel through P by copying the corresponding angle at Q (t a freely chosen line through P meeting ℓ at Q).
 *  wrongSide: the angle is copied on the other side of t (not corresponding: the line is not parallel) */
export function parallelCorr(R: () => number, o: { orient?: Orient; wrongSide?: boolean; names?: [string, string, string, string, string, string] } = {}): Cons {
  const [p, q, a, b, b2, a2] = o.names ?? ['P', 'Q', 'A', 'B', 'C', 'D'];
  const th = orientDeg(R, o.orient ?? pickN(R, ['h', 's'] as Orient[]));
  const s = pickN(R, [r(R, 55, 75), r(R, 105, 125)]);   // t leans either way
  const Q: Pt = [0, 0], P = at(Q, th + s, r(R, 250, 290));
  const ra = r(R, 95, 115);
  const A = at(Q, th, ra), B = at(Q, th + s, ra);
  const B2 = at(P, th + s, ra);
  const chord = dist(A, B);
  const right = at(P, th, ra), wrong = at(P, th + 2 * s, ra);   // the two points of the arc about P at the chord from B2
  const A2 = o.wrongSide ? wrong : right;
  const L1 = at(Q, th + 180, 300), L2 = at(Q, th, 380);
  const tEnd = at(P, th + s, 170), tStart = at(Q, th + s + 180, 90);
  const steps: Step[] = [
    { id: 't', tool: 'straightedge', text: `Draw any line t through ${p} that crosses ℓ, at ${q}.`, needs: [p], after: [], arcs: [], lines: [lineThru(tStart, tEnd, 0, 'aux', { name: 't' })], free: true },
    { id: 'arcQ', tool: 'compass', text: `Put the needle on ${q} and draw an arc crossing ℓ at ${a} and t at ${b}.`, needs: [q], after: [], arcs: [arcFromTo(Q, ra, A, B, 12)], lines: [], needle: Q, free: true },
    { id: 'arcP', tool: 'compass', text: `Keep that width. Put the needle on ${p} and draw an arc crossing t at ${b2}, beyond ${p}.`, needs: [p], after: ['arcQ', 't'], arcs: [arcFromTo(P, ra, B2, A2, 18)], lines: [], needle: P },
    { id: 'set', tool: 'compass', text: `Put the needle on ${b} and open the compass to ${a}.`, needs: [a, b], after: ['arcP'], arcs: [arcAt(B, chord, A, 10)], lines: [], needle: B },
    { id: 'chord', tool: 'compass', text: `Keep that width. Put the needle on ${b2} and draw an arc crossing the last long arc at ${a2}, on the ${o.wrongSide ? 'other' : 'same'} side of t as ${a}.`, needs: [b2], after: ['set'], arcs: [arcAt(B2, chord, A2, 13)], lines: [], needle: B2 },
    { id: 'line', tool: 'straightedge', text: `Draw line ${p}${a2}.`, needs: [p, a2], after: [], arcs: [], lines: [lineThru(P, A2, 200)] },
  ];
  const pts: CPt[] = [{ name: p, at: P, deps: [] }, { name: q, at: Q, deps: ['t'] }, { name: a, at: A, deps: ['arcQ'] }, { name: b, at: B, deps: ['arcQ', 't'] }, { name: b2, at: B2, deps: ['arcP', 't'] }, { name: a2, at: A2, deps: ['arcP', 'chord'] }];
  return { kind: 'parallelCorr', given: [lineThru(L1, L2, 0, 'given', { name: 'ℓ' })], givenArcs: [], pts, steps, flaw: o.wrongSide ? 'wrongSide' : undefined };
}

/** a regular hexagon in a circle (O given): mark A, step the radius around six times, join (or join alternate marks:
 *  an equilateral triangle) */
export function hexagon(R: () => number, o: { tri?: boolean; names?: string[] } = {}): Cons {
  const N = o.names ?? ['O', 'A', 'B', 'C', 'D', 'E', 'F'];
  const rr = r(R, 230, 260), O: Pt = [0, 0], a0 = r(R, 0, 59);
  const V = [0, 1, 2, 3, 4, 5].map(i => at(O, a0 + 60 * i, rr));
  const steps: Step[] = [{ id: 'h0', tool: 'mark', text: `Mark any point ${N[1]} on the circle.`, needs: [], after: [], arcs: [], lines: [], free: true }];
  for (let i = 1; i < 6; i++) steps.push({ id: `h${i}`, tool: 'compass', text: i === 1 ? `Keep the compass at the radius. Put the needle on ${N[1]} and mark ${N[2]} on the circle.` : `Same width: needle on ${N[i]}, mark ${N[i + 1]}.`, needs: [N[i]!], after: i === 1 ? [] : [`h${i - 1}`], arcs: [arcAt(V[i - 1]!, rr, V[i]!, 13)], lines: [], needle: V[i - 1]! });
  const join = o.tri ? [0, 2, 4] : [0, 1, 2, 3, 4, 5];
  steps.push({ id: 'join', tool: 'straightedge', text: o.tri ? `Join every other mark: ${N[1]}, ${N[3]}, ${N[5]}.` : 'Join the marks in order around the circle.', needs: join.map(i => N[i + 1]!), after: [], arcs: [], lines: join.map((i, k) => seg(V[i]!, V[join[(k + 1) % join.length]!]!, 'result')) });
  const pts: CPt[] = [{ name: N[0]!, at: O, deps: [] }, ...V.map((P, i) => ({ name: N[i + 1]!, at: P, deps: [`h${i}`] }))];
  return { kind: 'hexagon', given: [], givenArcs: [fullCircle(O, rr)], pts, steps };
}

/** a square in a circle: a diameter AC, its perpendicular bisector through O (B, D), join. skew: the second diameter is
 *  just any other diameter (a rectangle) */
export function square(R: () => number, o: { skew?: boolean; names?: [string, string, string, string, string] } = {}): Cons {
  const [oN, a, b, cN, d] = o.names ?? ['O', 'A', 'B', 'C', 'D'];
  const rr = r(R, 220, 250), O: Pt = [0, 0], a0 = r(R, -30, 30);
  const A = at(O, a0, rr), C = at(O, a0 + 180, rr);
  const turn = o.skew ? pickN(R, [1, -1]) * r(R, 25, 40) : 0;
  const B = at(O, a0 + 90 + turn, rr), D = at(O, a0 + 270 + turn, rr);
  const w = rr * 1.45;
  const [X1, X2] = ccx(A, w, C, w) as [Pt, Pt];
  const steps: Step[] = [
    { id: 'diam', tool: 'straightedge', text: `Draw a diameter through ${oN}: it meets the circle at ${a} and ${cN}.`, needs: [oN], after: [], arcs: [], lines: [seg(A, C, 'aux')], free: true },
    o.skew
      ? { id: 'perp', tool: 'straightedge', text: `Draw another diameter through ${oN}: it meets the circle at ${b} and ${d}.`, needs: [oN], after: ['diam'], arcs: [], lines: [seg(B, D, 'aux')], free: true }
      : { id: 'perp', tool: 'compass', text: `Construct the perpendicular bisector of ${sg(a + cN)}: equal arcs from ${a} and ${cN}, then the line through their crossings. It meets the circle at ${b} and ${d}.`, needs: [a, cN], after: [], arcs: [arcAt(A, w, X1, 10), arcAt(A, w, X2, 10), arcAt(C, w, X1, 10), arcAt(C, w, X2, 10)], lines: [seg(B, D, 'aux')], needle: A },
    { id: 'join', tool: 'straightedge', text: `Join ${a}, ${b}, ${cN}, ${d} in order.`, needs: [a, b, cN, d], after: [], arcs: [], lines: [seg(A, B, 'result'), seg(B, C, 'result'), seg(C, D, 'result'), seg(D, A, 'result')] },
  ];
  const pts: CPt[] = [{ name: oN, at: O, deps: [], dir: a0 + 135 }, { name: a, at: A, deps: ['diam'] }, { name: cN, at: C, deps: ['diam'] }, { name: b, at: B, deps: ['perp'] }, { name: d, at: D, deps: ['perp'] }];
  return { kind: 'square', given: [], givenArcs: [fullCircle(O, rr)], pts, steps, flaw: o.skew ? 'skew' : undefined };
}

// ---------- fakes: a step that measures or guesses instead of constructing ----------
export interface Fake { replace: string[]; tool: 'ruler' | 'protractor' | 'eye'; text: (n: (k: string) => string) => string }
/** a construction with some steps replaced by one non-construction step (it makes the same points) */
export function withFake(c: Cons, f: { replace: string[]; tool: Tool; text: string }): Cons {
  const first = c.steps.findIndex(s => f.replace.includes(s.id));
  if (first < 0) throw new Error('withFake: nothing to replace');
  const rep = c.steps.filter(s => f.replace.includes(s.id));
  const fake: Step = { id: 'fake', tool: f.tool, text: f.text, needs: [...new Set(rep.flatMap(s => s.needs))].filter(n => !c.pts.find(p => p.name === n)?.deps.some(d => f.replace.includes(d))), after: [...new Set(rep.flatMap(s => s.after))].filter(a => !f.replace.includes(a)), arcs: [], lines: rep.flatMap(s => s.lines.map(l => ({ ...l, dash: true }))) };
  const steps = c.steps.filter(s => !f.replace.includes(s.id)).map(s => ({ ...s, after: s.after.map(a => (f.replace.includes(a) ? 'fake' : a)) }));
  steps.splice(first, 0, fake);
  const pts = c.pts.map(p => ({ ...p, deps: [...new Set(p.deps.map(d => (f.replace.includes(d) ? 'fake' : d)))] }));
  return { ...c, steps, pts };
}

// ---------- checks the tests and generators use ----------
/** PA = PB etc.: the length of a named segment */
export const lenOf = (c: Cons, s: string) => dist(pt(c, s[0]!), pt(c, s[1]!));
export const angOf3 = (c: Cons, s: string) => measure(pt(c, s[1]!), pt(c, s[0]!), pt(c, s[2]!));
export { rotP, dirv };
