// triangleMaths.ts: the exact maths of "draw triangles from given conditions" (7.G.A.2), pure (no DOM, no canvas).
// Triangle ABC: A at the origin, the base AB along +x, C above the base (y > 0). Sides are named by their vertices
// (AB, AC, BC); angles are in degrees. Every solver checks its own result (sides and angles measured back from the
// coordinates) and throws a readable message when the conditions make no triangle.
import { BlockError } from '../../../blocks/block';

export type Unit = 'in' | 'cm';
export type P2 = [number, number];
const NAME = 'triangleMaths';
const EPS = 1e-9;
export const rad = (d: number) => (d * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;
export const dist = (p: P2, q: P2) => Math.hypot(q[0] - p[0], q[1] - p[1]);
function fail(msg: string): never { throw new BlockError(NAME, msg); }

export interface Tri { A: P2; B: P2; C: P2; AB: number; AC: number; BC: number; angA: number; angB: number; angC: number }

/** the angle at P between the rays P->Q and P->R, in degrees */
export function angleAt(P: P2, Q: P2, R: P2): number {
  const u = [Q[0] - P[0], Q[1] - P[1]], v = [R[0] - P[0], R[1] - P[1]];
  const c = (u[0]! * v[0]! + u[1]! * v[1]!) / (Math.hypot(u[0]!, u[1]!) * Math.hypot(v[0]!, v[1]!));
  return deg(Math.acos(Math.max(-1, Math.min(1, c))));
}
function measure(A: P2, B: P2, C: P2): Tri {
  const t: Tri = { A, B, C, AB: dist(A, B), AC: dist(A, C), BC: dist(B, C), angA: angleAt(A, B, C), angB: angleAt(B, A, C), angC: angleAt(C, A, B) };
  if (Math.abs(t.angA + t.angB + t.angC - 180) > 1e-6) fail(`angle sum ${t.angA + t.angB + t.angC} is not 180`);
  if (C[1] <= EPS) fail('the third corner is not above the base (flat triangle)');
  return t;
}

// ---------- existence: three sides ----------
export type Exists = 'yes' | 'flat' | 'short';
/** do three lengths close up into a triangle? 'flat' = the two shorter add up to exactly the longest */
export function existsSSS(a: number, b: number, c: number): Exists {
  const [x, y, z] = [a, b, c].sort((p, q) => p - q) as [number, number, number];
  const s = x + y;
  if (Math.abs(s - z) < EPS) return 'flat';
  return s > z ? 'yes' : 'short';
}
/** the whole-number third sides that make a triangle with sides p and q: from |p-q|+1 to p+q-1 */
export function thirdSideRange(p: number, q: number): [number, number] {
  if (!Number.isInteger(p) || !Number.isInteger(q) || p <= 0 || q <= 0) fail(`third side range needs whole sides (got ${p}, ${q})`);
  return [Math.abs(p - q) + 1, p + q - 1];
}

// ---------- solvers ----------
/** three sides: AB on the base, C where the arc of radius AC around A meets the arc of radius BC around B */
export function solveSSS(AB: number, AC: number, BC: number): Tri {
  const e = existsSSS(AB, AC, BC);
  if (e !== 'yes') fail(`sides ${AB}, ${AC}, ${BC}: ${e === 'flat' ? 'the two shorter sides add up to exactly the longest (flat)' : 'the two shorter sides are too short'}`);
  const x = (AC * AC + AB * AB - BC * BC) / (2 * AB), y = Math.sqrt(AC * AC - x * x);
  const t = measure([0, 0], [AB, 0], [x, y]);
  if (Math.abs(t.AC - AC) > 1e-6 || Math.abs(t.BC - BC) > 1e-6) fail('SSS check failed');
  return t;
}
/** two sides and the included angle at A */
export function solveSAS(AB: number, AC: number, angA: number): Tri {
  if (!(angA > 0 && angA < 180)) fail(`the angle between the sides must be between 0 and 180 degrees (got ${angA})`);
  const t = measure([0, 0], [AB, 0], [AC * Math.cos(rad(angA)), AC * Math.sin(rad(angA))]);
  if (Math.abs(t.angA - angA) > 1e-6) fail('SAS check failed');
  return t;
}
/** one side and the angles at its two ends: C where the two rays meet */
export function solveASA(AB: number, angA: number, angB: number): Tri {
  if (angA <= 0 || angB <= 0) fail('the end angles must be more than 0');
  if (angA + angB >= 180 - EPS) fail(`end angles ${angA} + ${angB} = ${angA + angB} is 180 or more: the rays never meet above the base`);
  const angC = 180 - angA - angB, AC = (AB * Math.sin(rad(angB))) / Math.sin(rad(angC));
  const t = measure([0, 0], [AB, 0], [AC * Math.cos(rad(angA)), AC * Math.sin(rad(angA))]);
  if (Math.abs(t.angB - angB) > 1e-6) fail('ASA check failed');
  return t;
}
/** the two points where circles (c1, r1) and (c2, r2) meet (above first), or [] / one point when tangent */
export function circleMeet(c1: P2, r1: number, c2: P2, r2: number): P2[] {
  const d = dist(c1, c2);
  if (d < EPS) return [];
  if (d > r1 + r2 + EPS || d < Math.abs(r1 - r2) - EPS) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h2 = r1 * r1 - a * a, h = h2 > 0 ? Math.sqrt(h2) : 0;
  const ux = (c2[0] - c1[0]) / d, uy = (c2[1] - c1[1]) / d, mx = c1[0] + a * ux, my = c1[1] + a * uy;
  if (h < 1e-7) return [[mx, my]];
  const pts: P2[] = [[mx - h * uy, my + h * ux], [mx + h * uy, my - h * ux]];
  return pts.sort((p, q) => q[1] - p[1]);
}

// ---------- angle sum and side / angle order ----------
export function thirdAngle(a: number, b: number): number {
  const c = 180 - a - b;
  if (c <= 0) fail(`angles ${a} and ${b} already make ${a + b} degrees: no room for a third angle`);
  return c;
}
/** the side opposite a vertex */
export const OPP: Record<'A' | 'B' | 'C', 'BC' | 'AC' | 'AB'> = { A: 'BC', B: 'AC', C: 'AB' };
/** the sides touching a vertex */
export const ADJ: Record<'A' | 'B' | 'C', ['AB' | 'AC' | 'BC', 'AB' | 'AC' | 'BC']> = { A: ['AB', 'AC'], B: ['AB', 'BC'], C: ['AC', 'BC'] };
/** law of sines: the side opposite angle x, given the side s opposite angle y */
export const sideOpposite = (x: number, y: number, s: number) => (s * Math.sin(rad(x))) / Math.sin(rad(y));

// ---------- how many triangles do the conditions allow? ----------
export type Spec =
  | { kind: 'SSS'; AB: number; AC: number; BC: number }
  | { kind: 'SAS'; AB: number; AC: number; angA: number }
  | { kind: 'ASA'; AB: number; angA: number; angB: number }
  | { kind: 'AAA'; angA: number; angB: number; angC: number };
export type Count = 'none' | 'one' | 'many';
export function countTriangles(s: Spec): Count {
  switch (s.kind) {
    case 'SSS': return existsSSS(s.AB, s.AC, s.BC) === 'yes' ? 'one' : 'none';
    case 'SAS': return s.angA > 0 && s.angA < 180 ? 'one' : 'none';
    case 'ASA': return s.angA + s.angB < 180 ? 'one' : 'none';
    case 'AAA': return Math.abs(s.angA + s.angB + s.angC - 180) < EPS ? 'many' : 'none';
  }
}

// ---------- tolerance audit ----------
export interface Cond { what: string; want: number; got: number; tol: number; unit: string }
export const within = (c: Cond) => Math.abs(c.got - c.want) <= c.tol + EPS;

// ---------- numbers as text ----------
/** 3.5 -> "3½" (halves and quarters as glyphs, for canvas and HTML) */
export function lenText(x: number): string {
  const w = Math.floor(x + EPS), f = Math.round((x - w) * 4);
  const g = ['', '¼', '½', '¾'][f] ?? '';
  if (f === 0) return String(w);
  return (w ? String(w) : '') + g;
}
/** 3.5 -> "3\tfrac{1}{2}" for TeX */
export function lenTex(x: number): string {
  const w = Math.floor(x + EPS), f = Math.round((x - w) * 4);
  const g = ['', '\\tfrac{1}{4}', '\\tfrac{1}{2}', '\\tfrac{3}{4}'][f] ?? '';
  if (f === 0) return String(w);
  return (w ? String(w) : '') + g;
}
/** cm lengths with a decimal point ("6.5"), inches with fraction glyphs */
export const len = (x: number, u: Unit) => (u === 'cm' ? String(Math.round(x * 10) / 10) : lenText(x));
export const lenT = (x: number, u: Unit) => (u === 'cm' ? String(Math.round(x * 10) / 10) : lenTex(x));
