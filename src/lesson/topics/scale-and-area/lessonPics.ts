// lessonPics.ts: the three pictures of parts 1-4 (the rug of the question and the worked example, the photo of
// "your turn", Riley's triangle of "prove it"), and the lesson's model frame. The test checks that they fit.
import { frame } from '../../../blocks/block';
import type { AreaPic } from './areaMaths';

/** the model's frame in parts 1-4 (left of the notation board) */
export const LESSON_FRAME = frame(60, 70, 940, 940);
/** a 3 ft by 2 ft rug and its copy with every length x 3 (9 by 6): 3 rows of 3 rugs */
export const RUG: AreaPic = { shape: { kind: 'rect', w: 3, h: 2 }, kx: 3, ky: 3, arrange: 'stack', labels: { ow: '3', oh: '2', cw: '9', ch: '6' }, area: { o: '6', c: '54' }, tile: 'copies', count: true };
/** a 4 in by 3 in photo and its print with every length x 2 (8 by 6) */
export const PHOTO: AreaPic = { shape: { kind: 'rect', w: 4, h: 3 }, kx: 2, ky: 2, arrange: 'stack', labels: { ow: '4', oh: '3', cw: '8', ch: '6' }, area: { o: '12', c: '48' }, tile: 'copies', count: true };
/** Riley's right triangle (base 4, height 3) scaled by 2: four copies, the middle one turned */
export const TRI: AreaPic = { shape: { kind: 'tri', w: 4, h: 3, a: 0 }, kx: 2, ky: 2, arrange: 'stack', labels: { ow: '4', oh: '3', cw: '8', ch: '6' }, area: { o: '6' }, tile: 'copies', count: true };
export const LESSON_PICS = { rug: RUG, photo: PHOTO, tri: TRI } as const;
