// cconf.ts: small exact helpers the families share (pure): whole-degree arc partitions, arc names and what they
// denote, point placement on a circle, line intersections. Model units as cfig.ts (circle 0 at the origin, R0).
import { type Pt, at, dist, meet, norm, sub } from '../geometry-foundations/geo';
import { R0, span } from './cfig';
import { r } from './ckit';

/** n whole-degree arcs in [lo, hi] that add to 360 (in order around the circle) */
export function splitArcs(R: () => number, n: number, lo: number, hi: number, total = 360): number[] {
  for (let t = 0; t < 500; t++) {
    const a = Array.from({ length: n - 1 }, () => r(R, lo, hi));
    const last = total - a.reduce((s, x) => s + x, 0);
    if (last >= lo && last <= hi) return [...a, last];
  }
  throw new Error('splitArcs: no partition');
}
/** angles of points placed ccw from `start` with the given arcs between them (n arcs -> n points) */
export function placeCcw(start: number, arcs: readonly number[]): number[] {
  const out = [norm(start)];
  for (let i = 0; i < arcs.length - 1; i++) out.push(norm(out[i]! + arcs[i]!));
  return out;
}
/** is angle d strictly inside the ccw arc from a to b? */
export const inArc = (d: number, a: number, b: number): boolean => { const s = span(a, b), x = norm(d - a); return x > 1e-9 && x < s - 1e-9; };
/** what an arc name denotes on circle 0 (a canonical key "start:span"), or 'ambiguous' (two letters on a semicircle)
 *  or 'none' (a three-letter name whose middle point is not between its ends) */
export function arcKey(on: Record<string, number>, name: string): string {
  const d = (n: string) => { const x = on[n]; if (x === undefined) throw new Error(`arcKey: no point ${n}`); return norm(x); };
  const k = (a: number, b: number) => `${Math.round(norm(a) * 1000)}:${Math.round(span(a, b) * 1000)}`;
  if (name.length === 2) {
    const a = d(name[0]!), b = d(name[1]!), s = span(a, b);
    if (Math.abs(s - 180) < 1e-9) return 'ambiguous';
    return s < 180 ? k(a, b) : k(b, a);
  }
  const a = d(name[0]!), m = d(name[1]!), b = d(name[2]!);
  return inArc(m, a, b) ? k(a, b) : inArc(m, b, a) ? k(b, a) : 'none';
}
/** the measure of the arc a name denotes */
export function arcMeasureOf(on: Record<string, number>, name: string): number {
  const key = arcKey(on, name);
  if (key === 'ambiguous' || key === 'none') return NaN;
  return Number(key.split(':')[1]) / 1000;
}
export const P0 = (deg: number): Pt => at([0, 0], deg, R0);
/** where line p1-p2 meets line q1-q2 */
export const cross = (p1: Pt, p2: Pt, q1: Pt, q2: Pt): Pt => meet(p1, sub(p2, p1), q1, sub(q2, q1));
export const far = (p: Pt) => dist(p, [0, 0]) / R0;
export { span, norm };
