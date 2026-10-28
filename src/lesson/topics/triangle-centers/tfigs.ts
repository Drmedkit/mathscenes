// tfigs.ts: the exact figures of the lesson (pure). Role letters: the triangle is ABC; the page relabels them.
//   special   one special segment or line drawn from its defining marks: a median (ticks on the two halves of the
//             side), an altitude (a box at the foot, the side extended when the foot is outside), an angle bisector
//             (equal arcs at the vertex), a perpendicular bisector (ticks and a box, a line with two heads named ℓ),
//             a midsegment (ticks on both touched sides). Rejects a triangle where the drawn segment also LOOKS like
//             another kind (a median within 12° of perpendicular, a bisector foot near the midpoint ...).
//   lines     all three lines of one kind and the point P where they meet (the four centers)
// Every figure goes through tri.ts buildFig: tick groups equal, arc groups equal, boxes 90°, or it throws.
import type { Fig, GSeg, Pt } from '../geometry-foundations/geo';
import { add, dist, measure, mul, sub, unit } from '../geometry-foundations/geo';
import type { FMark } from '../triangle-congruence/tri';
import { type Kind, type Tri, altitudeFoot, bisectorFoot, centroidOf, circumcenterOf, footT, incenterOf, makeTri, mid, orthocenterOf, sideMid } from './centers';
import { arc, box, fig, lineEnds, tick } from './tkit';

export type SK = 'median' | 'altitude' | 'bisector' | 'perpbis' | 'midseg';
export const SK_WORD: Record<SK, string> = { median: 'a median', altitude: 'an altitude', bisector: 'an angle bisector', perpbis: 'a perpendicular bisector', midseg: 'a midsegment' };
export const ptsOf = (T: Tri): Record<string, Pt> => ({ A: T[0], B: T[1], C: T[2] });
const perp = (u: Pt): Pt => [-u[1], u[0]];
/** the unit normal of side b->c that points toward a */
export function inward(a: Pt, b: Pt, c: Pt): Pt {
  const n = perp(unit(sub(c, b)));
  return (a[0] - b[0]) * n[0] + (a[1] - b[1]) * n[1] > 0 ? n : mul(n, -1);
}
const near90 = (x: number, d = 12) => Math.abs(x - 90) < d;

/** one special segment of kind k from vertex A (or of side BC); null when it would look like another kind */
export function special(T: Tri, k: SK, o: { col?: 'link' | 'pick'; outside?: boolean } = {}): { fig: Fig; obj: string; D?: Pt } | null {
  const [A, B, C] = T;
  const P = ptsOf(T);
  const col = o.col;
  if (k === 'median') {
    const D = mid(B, C);
    if (near90(measure(D, A, B)) || Math.abs(measure(A, B, D) - measure(A, D, C)) < 8) return null;
    return { fig: fig({ pts: { ...P, D }, segs: ['AB', 'AC', 'BD', 'DC', 'AD'], marks: [tick('BD', 1), tick('DC', 1)], segStyle: col ? { AD: { col } } : {}, body: 'ABC' }), obj: 'AD', D };
  }
  if (k === 'altitude') {
    const D = altitudeFoot(T, 0), t = footT(A, B, C);
    const bis = Math.abs(measure(A, B, D) - measure(A, D, C));
    if (t > 0.08 && t < 0.92) {
      if (Math.abs(t - 0.5) < 0.12 || bis < 8) return null;
      return { fig: fig({ pts: { ...P, D }, segs: ['AB', 'AC', 'BD', 'DC', 'AD'], marks: [box('ADC')], segStyle: col ? { AD: { col } } : {}, body: 'ABC' }), obj: 'AD', D };
    }
    if (t < -0.12) return { fig: fig({ pts: { ...P, D }, segs: ['AB', 'AC', 'BC', 'DB', 'AD'], marks: [box('ADC')], segStyle: { DB: { dash: true, col: 'faint' }, ...(col ? { AD: { col } } : {}) }, body: 'ABC' }), obj: 'AD', D };
    return null;
  }
  if (k === 'bisector') {
    const D = bisectorFoot(T, 0), t = footT(D, B, C);
    if (Math.abs(t - 0.5) < 0.1 || near90(measure(D, A, B))) return null;
    return { fig: fig({ pts: { ...P, D }, segs: ['AB', 'AC', 'BD', 'DC', 'AD'], marks: [arc('BAD', 1), arc('DAC', 1)], segStyle: col ? { AD: { col } } : {}, body: 'ABC' }), obj: 'AD', D };
  }
  if (k === 'perpbis') {
    const M = mid(B, C), u = inward(A, B, C), h = dist(A, M);
    const [Pp, Q] = lineEnds(M, u, 0.32 * h, 1.15 * h);
    // the line must miss A clearly (else it is also an altitude / a median)
    const dA = Math.abs((A[0] - M[0]) * perp(u)[0] + (A[1] - M[1]) * perp(u)[1]);
    if (dA < 0.16 * dist(B, C)) return null;
    return { fig: fig({ pts: { ...P, M, P: Pp, Q }, bare: ['P', 'Q'], segs: ['AB', 'AC', 'BM', 'MC', 'PQ'], marks: [tick('BM', 1), tick('MC', 1), box('QMC')], segStyle: { PQ: { kind: 'line', name: 'ℓ', ...(col ? { col } : {}) } }, body: 'ABC' }), obj: 'line ℓ' };
  }
  const D = mid(A, B), E = mid(A, C);
  return { fig: fig({ pts: { ...P, D, E }, segs: ['AD', 'DB', 'AE', 'EC', 'BC', 'DE'], marks: [tick('AD', 1), tick('DB', 1), tick('AE', 2), tick('EC', 2)], segStyle: col ? { DE: { col } } : {}, body: 'ABC' }), obj: 'DE' };
}

export type CK = 'centroid' | 'circumcenter' | 'incenter' | 'orthocenter';
export const CK_WORD: Record<CK, string> = { centroid: 'the centroid', circumcenter: 'the circumcenter', incenter: 'the incenter', orthocenter: 'the orthocenter' };
export const CK_LINES: Record<CK, string> = { centroid: 'medians', circumcenter: 'perpendicular bisectors', incenter: 'angle bisectors', orthocenter: 'altitudes' };
export const centerOf = (T: Tri, k: CK): Pt => (k === 'centroid' ? centroidOf(T) : k === 'circumcenter' ? circumcenterOf(T) : k === 'incenter' ? incenterOf(T) : orthocenterOf(T));
/** the three lines of one kind with their marks, meeting at P (named P; the page relabels). Vertex letters A, B, C;
 *  feet and line ends are bare points. Throws for a right triangle's altitudes (the center is a vertex). */
export function linesFig(T: Tri, k: CK, o: { col?: 'link' | 'pick' | 'second' | 'first'; noP?: boolean; only?: number[] } = {}): Fig {
  const V = ['A', 'B', 'C'], P0 = centerOf(T, k), only = o.only ?? [0, 1, 2];
  const pts: Record<string, Pt> = { ...ptsOf(T), P: P0 };
  const segs: string[] = [], marks: FMark[] = [], style: Record<string, Partial<GSeg>> = {}, bare: string[] = [];
  const F = ['D', 'E', 'F'], X = ['x', 'y', 'z'], W = ['u', 'v', 'w'];
  const sideSplit = new Set<number>();
  for (const i of [0, 1, 2]) {
    const v = V[i]!, p = V[(i + 1) % 3]!, q = V[(i + 2) % 3]!, f = F[i]!;
    if (!only.includes(i)) continue;
    if (k === 'centroid') {
      pts[f] = sideMid(T, i); bare.push(f); sideSplit.add(i);
      segs.push(v + f); marks.push(tick(p + f, i + 1), tick(f + q, i + 1));
      if (o.col) style[v + f] = { col: o.col };
    } else if (k === 'incenter') {
      pts[f] = bisectorFoot(T, i); bare.push(f);
      segs.push(v + f); marks.push(arc(p + v + f, i + 1), arc(f + v + q, i + 1));
      if (o.col) style[v + f] = { col: o.col };
    } else if (k === 'circumcenter') {
      const M = sideMid(T, i), d = dist(P0, M);
      const u = d > 1e-6 * dist(T[0], T[1]) ? unit(sub(P0, M)) : inward(T[i]!, T[(i + 1) % 3]!, T[(i + 2) % 3]!);
      const L = Math.max(d + 70, 150);
      const [e0, e1] = lineEnds(M, u, 70, L);
      pts[f] = M; pts[X[i]!] = e1; pts[W[i]!] = e0; bare.push(f, X[i]!, W[i]!);
      sideSplit.add(i);
      segs.push(W[i]! + X[i]!);
      marks.push(tick(p + f, i + 1), tick(f + q, i + 1), box(X[i]! + f + q));
      style[W[i]! + X[i]!] = { ...(o.col ? { col: o.col } : {}) };
    } else {
      const D = altitudeFoot(T, i), t = footT(T[i]!, T[(i + 1) % 3]!, T[(i + 2) % 3]!);
      if (dist(D, T[(i + 1) % 3]!) < 1e-6 * dist(T[0], T[1]) || dist(D, T[(i + 2) % 3]!) < 1e-6 * dist(T[0], T[1])) throw new Error('right triangle altitudes');
      pts[f] = D; bare.push(f);
      segs.push(v + f);
      marks.push(box(v + f + (t < 0 ? q : p)));
      if (o.col) style[v + f] = { col: o.col };
      if (t < 0) { segs.push(f + p); style[f + p] = { dash: true, col: 'faint' }; }
      if (t > 1) { segs.push(q + f); style[q + f] = { dash: true, col: 'faint' }; }
      // the altitude line extended to meet the others outside
      const H = P0, beyond = ((H[0] - T[i]![0]) * (D[0] - T[i]![0]) + (H[1] - T[i]![1]) * (D[1] - T[i]![1])) / dist(T[i]!, D) ** 2;
      if (beyond > 1.02) { segs.push(f + 'P'); style[f + 'P'] = { dash: true, col: 'faint' }; }
      if (beyond < -0.02) { segs.push(v + 'P'); style[v + 'P'] = { dash: true, col: 'faint' }; }
    }
  }
  for (const i of [0, 1, 2]) {
    const p = V[(i + 1) % 3]!, q = V[(i + 2) % 3]!;
    if (sideSplit.has(i)) segs.push(p + F[i]!, F[i]! + q);
    else segs.push(p + q);
  }
  if (o.noP) { delete pts.P; }
  return fig({ pts, segs: [...new Set(segs)], marks, segStyle: style, bare, body: 'ABC' });
}

/** a random triangle for a center figure: acute / obtuse (right only when allowed), not too flat */
export function centerTri(R: () => number, k: CK, kind?: Kind): Tri {
  const kk: Kind = kind ?? (R() < 0.6 ? 'acute' : R() < 0.5 && k !== 'orthocenter' ? 'right' : 'obtuse');
  return makeTri(R, kk, { at: Math.floor(R() * 3), lo: kk === 'obtuse' ? 102 : undefined, hi: kk === 'obtuse' ? 118 : undefined });
}
export { add, mul };
