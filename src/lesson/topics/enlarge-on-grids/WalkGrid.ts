// WalkGrid: the model block of "enlarge on grids". Grid paper with an original figure, a marked start dot on it and
// on the copy, and the copy WALKED OUT move by move: each move of the original (right 2, up 3, or a slanted side as
// left 1 + up 1) is multiplied by the scale factor and walked from the copy's start dot, leg after leg, until the
// walk is back at the dot. It draws with the ScaleGrid painter of the scale-factor topic (imported read-only), so the
// two topics share one look: washes with a crisp outline, labels outside the sides on paper pads, dashed run / rise
// legs, dots.
//   Roles: original = first (amber), copy = second (teal), the start dots and the side in focus = pick (lavender),
//          the answer = link (lime), a stretched copy = wrong (red).
//   Steps (Progress keys; `keys` names them): grid; f0 (the original) + f0L / f0l<j> (its labels); d0, d1 (the start
//          dots); leg(j) (the copy's leg j draws on); rr0(j) / rr1(j) (run / rise legs of side j); f1 (the copy's
//          wash, at the end of the walk) + lab1(j) (its label j) + ans1(j) (label j turns into its answer); extra(i).
//   Checks at build time: the original's walk closes, every copy move is k x the original's, the copy is a scaled
//   copy (scaledCopy), plus ScaleGrid's own honesty and readability checks (labels = drawn lengths, layout rules).
import type { Box } from '../../../core/math';
import type { Canvas } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import type { Theme } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { type GridFocus, type ScaleGridBlock, ScaleGrid } from '../scale-factor/ScaleGrid';
import { type WalkPic, type WalkSpec, closes, isWalkCopy, walkPic } from './walkMaths';

const NAME = 'WalkGrid';
export interface WalkGridBlock {
  readonly kind: 'WalkGrid';
  readonly w: WalkPic;
  readonly g: ScaleGridBlock;
  readonly box: Box;
  readonly keys: {
    leg(j: number): string; rr0(j: number): string; rr1(j: number): string;
    lab0(j: number): string; lab1(j: number): string; ans1(j: number): string; extra(i: number): string;
  };
  readonly where: ScaleGridBlock['where'] & { leg(j: number): Box; side0(j: number): Box };
  /** a glow along side j of the original / leg j of the copy (focus helpers) */
  glow0(j: number, k: number): NonNullable<GridFocus['sides']>[number];
  glow1(j: number, k: number): NonNullable<GridFocus['sides']>[number];
  draw(c: Canvas, p: Progress<string>, f?: GridFocus): void;
}

export function WalkGrid(spec: WalkSpec, fr: Frame, th: Theme): WalkGridBlock {
  const w = walkPic(spec);
  check(closes(w.moves0), NAME, 'the original walk does not close');
  check(closes(w.moves1), NAME, 'the copy walk does not close');
  check(isWalkCopy(w.P0, w.P1, w.k), NAME, `the copy is not a x${w.k} walk of the original`);
  const g = ScaleGrid(w.pic, fr, th);
  const keys = {
    leg: (j: number) => `f${w.legs[j]}`,
    rr0: (j: number) => (w.rr0[j] === null || w.rr0[j] === undefined ? 'none' : `m${w.rr0[j]}`),
    rr1: (j: number) => (w.rr1[j] === null || w.rr1[j] === undefined ? 'none' : `m${w.rr1[j]}`),
    lab0: (j: number) => `f0l${j}`, lab1: (j: number) => `f1l${j}`, ans1: (j: number) => `f1a${j}`,
    extra: (i: number) => `f${w.extra[i]}`,
  };
  const where = { ...g.where, leg: (j: number) => g.where.fig(w.legs[j]!), side0: (j: number) => g.where.side(0, j) };
  return {
    kind: 'WalkGrid', w, g, box: g.box, keys, where,
    glow0: (j, k) => ({ f: 0, i: j, k, col: 'pick' }),
    glow1: (j, k) => ({ f: 1, i: j, k, col: 'link' }),
    draw: (c, p, f) => g.draw(c, p, f),
  };
}
