// figures.ts: the fixed figures of parts 1-4 (pure data, checked by the tests).
//   QUESTION  two parallel streets (Elm St, Oak St) and a rail line: 65° at Oak St (slot 6), x at Elm St (slot 4,
//             same-side interior), y (slot 2, the corresponding angle) and the straight angle at P for the example
//   TURN      lines ℓ and m (nearly vertical) cut by t: 108° given (slot 3), a = alternate interior (6),
//             b = same-side interior (5), c = corresponding (7), the midpoint M of PQ for the half turn
//   proofFig  triangle ABC with line ℓ drawn through A parallel to BC; angles 1 and 3 beside A on ℓ; A slides along ℓ
import type { Pt } from '../../../core/math';
import { type FAngle, type Fig, type FSeg, add, angOf, mul, sub, trans, unit } from './figMaths';

export const Q_TAU = 65;
export function questionTrans() {
  const T = trans({
    tau: Q_TAU, rot: -6, par: true, gap: 360, band: true, words: { l: 'Elm St', m: 'Oak St' }, cross: ['P', 'Q'],
    marks: { 6: { text: '65°', col: 'second', id: 'g' }, 4: { text: 'x', alt: '115°', col: 'link', id: 'x' }, 2: { text: 'y', alt: '65°', col: 'pick', id: 'y' } },
  });
  T.fig.angles.push(T.straight(0, 'R', 'w'));
  return T;
}
export const QUESTION = questionTrans();

export const T_TAU = 108;
export function turnTrans() {
  const T = trans({
    tau: T_TAU, rot: 78, par: true, gap: 420, band: true, names: { l: 'ℓ', m: 'm', t: 't' }, cross: ['P', 'Q'],
    marks: {
      3: { text: '108°', col: 'second', id: 'g' }, 6: { text: 'a', alt: '108°', col: 'plain', id: 'a' },
      5: { text: 'b', alt: '72°', col: 'plain', id: 'b' }, 7: { text: 'c', col: 'plain', id: 'c' },
    },
  });
  // the straight angle along line m at Q, on the side between the lines (a and b together)
  const [e6] = T.sides(6), [e5] = T.sides(5);
  const Qc = sub(e6, mul(sub(e6, e5), 0.5));
  const inward = unit(sub(T.sides(6)[1], Qc));
  void Qc; void inward;
  const tv = sub(T.P, T.Q);
  T.fig.points.push({ at: T.M, name: 'M', dir: angOf([-tv[1], tv[0]]), dot: true, dist: 46 });
  return T;
}
export const TURN = turnTrans();

/** the proof figure with A at x = ax on line ℓ */
export function proofFig(ax = 0): { fig: Fig; A: Pt; B: Pt; C: Pt } {
  const B: Pt = [-300, -230], C: Pt = [300, -230], A: Pt = [ax, 230];
  const W = 440;
  const segs: FSeg[] = [
    { id: 'BC', a: B, b: C, par: 2, parAt: 0.62 }, { id: 'AB', a: A, b: B }, { id: 'CA', a: C, b: A },
    { id: 'l', a: [-W, 230], b: [W, 230], arrows: 2, par: 2, parAt: 0.9, name: 'ℓ' },
  ];
  const angles: FAngle[] = [
    { id: 'B', v: B, p: C, q: A, col: 'second', text: '' },
    { id: 'C', v: C, p: A, q: B, col: 'second', text: '', arcs: 2 },
    { id: 'A', v: A, p: B, q: C, col: 'first', text: '' },
    { id: 'one', v: A, p: add(A, [-100, 0]), q: B, col: 'pick', text: '1' },
    { id: 'three', v: A, p: add(A, [100, 0]), q: C, col: 'pick', text: '3', arcs: 2 },
    { id: 'w', v: A, p: add(A, [100, 0]), q: add(A, [-100, -8]), whole: true, col: 'first' },
  ];
  return {
    A, B, C,
    fig: {
      segs, angles,
      points: [{ at: A, name: 'A', dir: 90, dist: 46 }, { at: B, name: 'B', dir: 220 }, { at: C, name: 'C', dir: 320 }],
      fills: [{ id: 'body', pts: [A, B, C], col: 'body' }],
      words: [{ at: [W - 150, 300], text: 'drawn ∥ BC', size: 44 }],
      pad: 90,
    },
  };
}
export const PROOF = proofFig(0);
