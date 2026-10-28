// lessonPics.ts: the Euler pictures of parts 1-4 (pure, so the test checks they fit the lesson frame).
import type { Frame } from '../../../blocks/block';
import type { EulerParams } from './eulerLayout';
import { type Shape, SHAPES, LETTERS, cmp, even, mult, range, shapePreds, zoneOf } from './logic';

/** the model's frame in parts 1-4: left of the board (the board starts at x = 1240) */
export const LESSON_FRAME: Frame = { x: 36, y: 66, w: 1168, h: 948 };

const numToks = (xs: number[], P: (n: number) => boolean, Q: (n: number) => boolean) => xs.map(v => ({ tex: String(v), zone: zoneOf(P(v), Q(v)) }));

/** 1 the promise: P (scored 90 or more) inside Q (got an A), no members yet */
export const Q_PIC: EulerParams = { layout: 'nested', domain: 'the students in Ms. Reyes’s class', P: 'scored 90 or more', Q: 'got an A', tokens: [] };
/** 2 if n is a multiple of 4, then n is even, over 1..12 */
export const E_XS = range(1, 12);
export const E_PIC: EulerParams = { layout: 'nested', domain: 'the integers 1 to 12', P: 'multiple of 4', Q: 'even', tokens: numToks(E_XS, mult(4).test, even.test) };
/** 3 if x > 6, then x > 3, over 0..9 */
export const T_XS = range(0, 9);
export const T_PIC: EulerParams = { layout: 'nested', domain: 'the integers 0 to 9', P: 'x > 6', Q: 'x > 3', tokens: numToks(T_XS, cmp('>', 6, 'x').test, cmp('>', 3, 'x').test) };
/** 4 Sam's quadrilaterals A-E: two squares, a rectangle (the counterexample), a rhombus, a kite */
export const P_SHAPES: Shape[] = [SHAPES.square(0, 38), SHAPES.rect(), SHAPES.rhombus(), SHAPES.square(20, 33), SHAPES.kite()];
export const P_PIC: EulerParams = {
  layout: 'overlap', domain: 'the quadrilaterals A to E', P: shapePreds.fourRight.label, Q: shapePreds.fourEqual.label,
  tokens: P_SHAPES.map((s, i) => ({ shape: s, letter: LETTERS[i], zone: zoneOf(shapePreds.fourRight.test(s), shapePreds.fourEqual.test(s)) })),
};
