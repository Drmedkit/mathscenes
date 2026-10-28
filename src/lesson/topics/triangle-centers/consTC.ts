// consTC.ts: the circumscribed and inscribed circle as compass-and-straightedge constructions, in the format of the
// constructions lesson (cons.ts Cons, drawn by its Construct.ts player). Every point is computed: arc crossings
// (circle-circle), the center (line-line), the foot of the perpendicular (line-line). Pure.
//   circum   perpendicular bisector of the 1st side, of the 2nd side, mark the center, circle through a vertex
//   incircle bisect the 1st angle, the 2nd angle, mark the center, perpendicular from the center to a side and its
//            foot, circle through the foot
import type { Pt } from '../geometry-foundations/geo';
import { add, angOf, at, dist, mul, sub, unit } from '../geometry-foundations/geo';
import { type Cons, type CPt, type Kind as CKind, type Step, arcAt, arcFromTo, ccx, fullCircle, llx, seg, sg } from '../constructions/cons';
import { type Tri, circumcenterOf, footOf, incenterOf } from './centers';

/** a line through p and q drawn so that it covers every point of `cover` (projected on it), with a margin */
function lineCover(p: Pt, q: Pt, cover: Pt[], m = 60): { a: Pt; b: Pt; kind: 'line'; role: 'aux' } {
  const u = unit(sub(q, p)), ts = [p, q, ...cover].map(x => (x[0] - p[0]) * u[0] + (x[1] - p[1]) * u[1]);
  return { a: add(p, mul(u, Math.min(...ts) - m)), b: add(p, mul(u, Math.max(...ts) + m)), kind: 'line', role: 'aux' };
}
/** names: [the three vertices, the center] */
export function circumCons(T: Tri, nm: [string, string, string, string]): Cons {
  const [a, b, c, o] = nm, [A, B, C] = T, O = circumcenterOf(T);
  const pb = (P: Pt, Q: Pt, id: string, p: string, q: string): Step => {
    const w = dist(P, Q) * 0.68, X = ccx(P, w, Q, w);
    if (X.length < 2) throw new Error('arcs');
    return { id, tool: 'compass', text: `Construct the perpendicular bisector of ${sg(p + q)}.`, needs: [p, q], after: [], arcs: [arcAt(P, w, X[0]!, 13), arcAt(P, w, X[1]!, 13), arcAt(Q, w, X[0]!, 13), arcAt(Q, w, X[1]!, 13)], lines: [lineCover(X[0]!, X[1]!, [O, X[0]!, X[1]!], 70)], free: true };
  };
  const steps: Step[] = [
    pb(A, B, 'pb1', a, b),
    pb(B, C, 'pb2', b, c),
    { id: 'ctr', tool: 'mark', text: `Mark ${o} where the two perpendicular bisectors meet.`, needs: [], after: ['pb1', 'pb2'], arcs: [], lines: [] },
    { id: 'circ', tool: 'compass', text: `Put the needle on ${o} and the pencil on ${a}; draw the circle.`, needs: [o, a], after: [], arcs: [fullCircle(O, dist(O, A))], lines: [], needle: O },
  ];
  const pts: CPt[] = [{ name: a, at: A, deps: [] }, { name: b, at: B, deps: [] }, { name: c, at: C, deps: [] }, { name: o, at: O, deps: ['ctr'] }];
  return { kind: 'perpBis' as CKind, given: [seg(A, B), seg(B, C), seg(C, A)], givenArcs: [], pts, steps };
}
/** names: [the three vertices, the center, the foot on the first side] */
export function inCons(T: Tri, nm: [string, string, string, string, string]): Cons {
  const [a, b, c, i, f] = nm, [A, B, C] = T, I = incenterOf(T), F = footOf(I, A, B);
  const bis = (V: Pt, P: Pt, Q: Pt, id: string, v: string): Step => {
    const r0 = Math.min(dist(V, P), dist(V, Q)) * 0.32, P1 = at(V, angOf(sub(P, V)), r0), Q1 = at(V, angOf(sub(Q, V)), r0);
    const w = dist(P1, Q1) * 0.75, X = ccx(P1, w, Q1, w).sort((x, y) => dist(y, V) - dist(x, V))[0]!;
    const tip = add(V, mul(unit(sub(I, V)), dist(V, I) + 80));
    return { id, tool: 'compass', text: `Bisect ∠${v}.`, needs: [v], after: [], arcs: [arcFromTo(V, r0, P1, Q1, 10), arcAt(P1, w, X, 13), arcAt(Q1, w, X, 13)], lines: [{ a: V, b: tip, kind: 'ray', role: 'aux' }], free: true };
  };
  // the perpendicular from I to AB: an arc about I cutting line AB twice, equal arcs below, the line through I
  const u = unit(sub(B, A)), d = dist(I, F), rr = d * 1.45, h = Math.sqrt(rr * rr - d * d);
  const Q1 = add(F, mul(u, -h)), Q2 = add(F, mul(u, h)), w = h * 1.25;
  const Y = ccx(Q1, w, Q2, w).sort((x, y) => dist(y, I) - dist(x, I))[0]!;
  const steps: Step[] = [
    bis(A, B, C, 'bis1', a),
    bis(B, C, A, 'bis2', b),
    { id: 'ctr', tool: 'mark', text: `Mark ${i} where the two angle bisectors meet.`, needs: [], after: ['bis1', 'bis2'], arcs: [], lines: [] },
    { id: 'perp', tool: 'compass', text: `Construct the perpendicular from ${i} to ${sg(a + b)}; mark its foot ${f}.`, needs: [i], after: [], arcs: [arcAt(I, rr, Q1, 9), arcAt(I, rr, Q2, 9), arcAt(Q1, w, Y, 12), arcAt(Q2, w, Y, 12)], lines: [{ a: I, b: add(Y, mul(unit(sub(Y, I)), 30)), kind: 'seg', role: 'aux' }], needle: I },
    { id: 'circ', tool: 'compass', text: `Put the needle on ${i} and the pencil on ${f}; draw the circle.`, needs: [i, f], after: [], arcs: [fullCircle(I, d)], lines: [], needle: I },
  ];
  const pts: CPt[] = [{ name: a, at: A, deps: [] }, { name: b, at: B, deps: [] }, { name: c, at: C, deps: [] }, { name: i, at: I, deps: ['ctr'] }, { name: f, at: F, deps: ['perp'] }];
  void llx;
  return { kind: 'angleBis' as CKind, given: [seg(A, B), seg(B, C), seg(C, A)], givenArcs: [], pts, steps };
}
