// lessonPics.ts: the pictures of parts 1-4 (ScaleLines params) and the model frame, shared by the page and the test.
import { frame } from '../../../blocks/block';
import type { LinesParams } from './ScaleLines';

/** the model's frame: wider than the default (the lines need room), ending 50 px before the board */
export const LF = frame(60, 70, 1130, 940);
const SCALE_TAG = '1\\text{ in} : 8\\text{ ft}';
/** parts 1, 2: a 20 ft wall at 1 in : 8 ft is 2.5 in on the plan */
export const WALL: LinesParams = {
  rows: [{ unit: 'in', step: 1 }, { unit: 'ft', step: 8 }], n: 4, sub: 2, tag: SCALE_TAG, ops: ['\\times 8', '\\div 8'],
  given: { row: 1, v: 20 }, ask: { row: 0, v: 2.5 }, obj: { name: 'wall', len: 2.5 },
};
/** part 3: a 2.25 in bedroom wall is 18 ft */
export const BEDROOM: LinesParams = {
  rows: [{ unit: 'in', step: 1 }, { unit: 'ft', step: 8 }], n: 4, sub: 4, tag: SCALE_TAG, ops: ['\\times 8', '\\div 8'],
  given: { row: 0, v: 2.25 }, ask: { row: 1, v: 18 }, obj: { name: 'bedroom wall', len: 2.25 },
};
/** part 4: a 12 ft shed at 1 : 48 is 144 in, so a 3 in model (Sam: 0.25 "in") */
export const SHED: LinesParams = {
  rows: [{ unit: 'model in', step: 1 }, { unit: 'real in', step: 48 }, { unit: 'real ft', step: 4 }], n: 4, tag: '1 : 48', cap: 'model',
  ops: ['\\times 48', '\\div 48'], conv: ['\\div 12', '\\times 12'],
  given: { row: 2, v: 12 }, via: { row: 1, v: 144 }, ask: { row: 0, v: 3 }, wrong: { row: 0, v: 0.25 },
};
export const LESSON_PICS: Record<string, LinesParams> = { WALL, BEDROOM, SHED };
