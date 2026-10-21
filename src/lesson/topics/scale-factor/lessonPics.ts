// lessonPics.ts: the fixed pictures of parts 1-4 (pure data, checked by the tests like every practice picture).
//   sticker  parts 1 + 2: a 3 x 2 sticker, its copy 6 wide; the x2 hop; the copy's height; the original slides onto
//            the copy's corner and a diagonal ray runs through both top-right corners; the "+3" copy (6 x 5) misses it
//   logo     part 3: an L-shaped logo 6 x 4 and its copy 3 wide (k = 1/2); right-angle marks
//   photo    part 4: Riley's 6 x 4 photo and the 10 x 8 print (+4 each way), the ray, the 12 x 8 print that is scaled
import { frame } from '../../../blocks/block';
import { type Pic, ell, move, rect } from './scaleMaths';

/** the model frame in parts 1-4 (the board is on the right, leaders run between) */
export const LESSON_FRAME = frame(60, 70, 1100, 940);

/** fig indices: 0 original, 1 copy, 2 the copy's known bottom edge, 3 the "+3" copy */
export const STICKER: Pic = {
  cols: 13, rows: 10, grid: true, umax: 90,
  figs: [
    { pts: move(rect(3, 2), 1, 1), role: 'first', labels: ['3', null, null, '2'], slide: [5, 0], angles: [{ at: 1, right: true, col: 'first' }] },
    { pts: move(rect(6, 4), 6, 1), role: 'second', labels: [null, { t: '4', col: 'link' }, null, null], of: { fig: 0, k: 2 }, angles: [{ at: 1, right: true, col: 'second' }] },
    { pts: [[6, 1], [12, 1]], role: 'second', open: true, labels: ['6'] },
    { pts: move(rect(6, 5), 6, 1), role: 'wrong', style: 'dash', labels: [null, null, null, '5'] },
  ],
  marks: [{ at: [12.75, 2.1], t: '?', role: 'second' }],
  moves: [{ from: [12, 1], dx: 0, dy: 1.4, role: 'second', nums: false }],
  hops: [{ from: [2.5, 3], to: [9, 1.15], t: '\\times 2', lift: 3 }],
  order: [1, 2, 0, 3],
  ray: { from: [6, 1], to: [12.9, 5.6] },
  dots: [{ at: [12, 5], role: 'link' }, { at: [12, 6], role: 'wrong' }],
};

/** fig indices: 0 original L, 1 copy (k = 1/2), 2 the copy's known bottom edge */
const RIGHTS = [0, 1, 2, 4, 5].map(at => ({ at, right: true }));
export const LOGO: Pic = {
  cols: 14, rows: 8, grid: true, umax: 90,
  figs: [
    { pts: move(ell(6, 4, 2, 2), 1, 1), role: 'first', labels: ['6', '2', '4', '2', '2', '4'], angles: RIGHTS.map(a => ({ ...a, col: 'first' as const })) },
    { pts: move(ell(3, 2, 1, 1), 10, 1), role: 'second', of: { fig: 0, k: 0.5 },
      labels: [null, { t: '?', alt: '1', altCol: 'second' }, { t: '?', alt: '2', altCol: 'second' }, null, null, { t: '?', alt: '2' }],
      angles: RIGHTS.map(a => ({ ...a, col: 'second' as const })) },
    { pts: [[10, 1], [13, 1]], role: 'second', open: true, labels: ['3'] },
  ],
  hops: [{ from: [3, 5], to: [11, 3], t: '\\times \\tfrac{1}{2}', lift: 0.9 }],
};

/** fig indices: 0 the 10 x 8 print, 1 the original photo, 2 the 12 x 8 print that is a scaled copy */
export const PHOTO: Pic = {
  cols: 14, rows: 11, grid: true, umax: 90,
  figs: [
    { pts: move(rect(10, 8), 1, 1), role: 'second', labels: ['10', null, null, '8'], photo: [6, 4] },
    { pts: move(rect(6, 4), 1, 1), role: 'first', labels: ['6', null, null, '4'], photo: [6, 4] },
    { pts: move(rect(12, 8), 1, 1), role: 'link', style: 'dash', labels: [null, null, '12', null], of: { fig: 1, k: 2 } },
  ],
  ray: { from: [1, 1], to: [13.6, 9.4] },
  dots: [{ at: [11, 9], role: 'wrong' }, { at: [13, 9], role: 'link' }],
};

export const LESSON_PICS = { sticker: STICKER, logo: LOGO, photo: PHOTO } as const;
