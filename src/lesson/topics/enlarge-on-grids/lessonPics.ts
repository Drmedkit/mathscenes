// lessonPics.ts: the fixed pictures of parts 1-4 (pure data, checked by the tests like every practice picture).
//   HOUSE   parts 1 + 2: a house icon 2 wide, walls 3 tall, a roof 1 up; its x2 copy walked out from the start dot
//           (right 4, up 6, left 2 + up 2, left 2 + down 2, down 6); the "+2" house (walls 5) dashed red; two
//           amber 2-pieces along the copy's base (4 is 2 times as long as 2)
//   SAIL    part 3: a sail 3 wide (right 3, left 1 + up 3, left 2 + down 3) and its x3 copy; angle marks
//   SQUARES part 4: a 2 by 2 square and its +2 copy (4 by 4, also x2); a 1 by 3 strip, its +1 copy (2 by 4, red,
//           stretched) and the x2 copy it should have been (2 by 6, dashed lime)
import { frame } from '../../../blocks/block';
import { type Pic, move, rect } from '../scale-factor/scaleMaths';
import { type WalkSpec, house, tri } from './walkMaths';

/** the model frame in parts 1-4 (the board is on the right) */
export const LESSON_FRAME = frame(60, 70, 1100, 940);

/** extra figure indices of HOUSE: 0 the "+2" house, 1 and 2 the two amber 2-pieces on the copy's base */
export const HOUSE: WalkSpec = {
  shape: house(2, 3, 1, 1), k: 2, at0: [1, 1], at1: [5, 1], cols: 10, rows: 10,
  labels0: ['2', '3', null, null, null],
  labels1: ['4', { t: '6', col: 'link' }, null, null, null],
  extra: [
    { pts: move(house(4, 5, 2, 2), 5, 1), role: 'wrong', style: 'dash', labels: [null, null, null, null, '5'] },
    { pts: [[5, 1], [7, 1]], role: 'first', open: true, style: 'line' },
    { pts: [[7, 1], [9, 1]], role: 'first', open: true, style: 'line' },
  ],
  marks: [{ at: [9.7, 2.2], t: '?', role: 'second' }],
};

const CORNERS = [0, 1, 2].map(at => ({ at }));
export const SAIL: WalkSpec = {
  shape: tri(3, 2, 3), k: 3, at0: [1, 1], at1: [6, 1], cols: 16, rows: 11,
  labels0: ['3', null, null], labels1: ['9', null, null],
  angles0: CORNERS.map(a => ({ ...a, col: 'first' as const })), angles1: CORNERS.map(a => ({ ...a, col: 'second' as const })),
};

/** fig indices: 0 square, 1 its +2 copy (x2), 2 the 1 by 3 strip, 3 its +1 copy (red), 4 the x2 copy (dashed lime) */
export const SQUARES: Pic = {
  cols: 15, rows: 8, grid: true, umax: 90,
  figs: [
    { pts: move(rect(2, 2), 1, 1), role: 'first', labels: ['2', null, null, '2'] },
    { pts: move(rect(4, 4), 4, 1), role: 'second', labels: ['4', '4', null, null], of: { fig: 0, k: 2 } },
    { pts: move(rect(1, 3), 10, 1), role: 'first', labels: ['1', null, null, '3'] },
    { pts: move(rect(2, 4), 12, 1), role: 'wrong', labels: ['2', null, null, '4'] },
    { pts: move(rect(2, 6), 12, 1), role: 'link', style: 'dash', labels: [null, '6', null, null], of: { fig: 2, k: 2 } },
  ],
  order: [0, 1, 2, 4, 3],
};
