// DecPic: one picture card of "Using probability to make decisions": the decision tree (DecTree, this folder) or any
// expected-value/DistPic card (payoff bars on the balance beam, tables, running means, CondPic trees). Read-only reuse.
import type { Box } from '../../../core/math';
import type { Canvas } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import type { Theme } from '../../../core/theme';
import type { Frame } from '../../../blocks/block';
import { DistPic, type DFocus, type DPic } from '../expected-value/DistPic';
import { DecTree, type TreePic } from './DecTree';

export type PPic = DPic | TreePic;
export interface DecPicBlock {
  readonly box: Box;
  readonly steps: readonly string[];
  where(key: string): Box;
  px?(x: number): number;
  draw(c: Canvas, P: Progress<string>, f?: DFocus): void;
}
export function DecPic(pic: PPic, fr: Frame, th: Theme): DecPicBlock {
  if (pic.kind === 'dtree') { const B = DecTree(pic, fr, th); return { box: B.box, steps: B.steps, where: B.where, draw: (c, P) => B.draw(c, P) }; }
  return DistPic(pic, fr, th);
}
