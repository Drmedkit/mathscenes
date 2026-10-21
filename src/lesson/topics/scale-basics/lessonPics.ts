// lessonPics.ts: the pictures of parts 1-4 as ScalePair params (pure data, so the tests can build every one).
//   question / example  a skateboard drawn 4 in by 1 in; the actual board is 32 in by 8 in (8 copies each way)
//   turn                a laptop drawn 6 cm by 4 cm; the actual laptop is 30 cm by 20 cm (5 copies each way)
//   prove               a hallway on a 1 : 100 plan, 5 cm by 2 cm; each plan centimeter maps onto 100 cm of hallway
import { frame } from '../../../blocks/block';
import type { PairParams } from './ScalePair';

/** the picture's frame: the left of the stage up to just before the board (x 60..1200, y 70..1010) */
export const PF = frame(60, 70, 1140, 940);
export const SKATE: PairParams = {
  unit: 'in', draw: [4, 1], real: [32, 8], shape: 'board', name: 'actual skateboard',
  tag: '\\text{scale } \\cssId{d}{1} : \\cssId{a}{8}',
};
export const LAPTOP: PairParams = {
  unit: 'cm', draw: [6, 4], real: [30, 20], shape: 'rect', name: 'actual laptop',
  tag: '\\text{scale } \\cssId{d}{1} : \\cssId{a}{5}',
};
export const HALLWAY: PairParams = {
  unit: 'cm', draw: [5, 2], real: [500, 200], mode: 'units', shape: 'rect', name: 'actual hallway', sam: true,
  tag: '\\text{scale } \\cssId{d}{1} : \\cssId{a}{100}',
};
export const LESSON_PICS: Record<string, PairParams> = { question: SKATE, turn: LAPTOP, prove: HALLWAY };
