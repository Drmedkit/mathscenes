// lessonPics.ts: the four pictures of parts 1-4 as PlanSheet params (pure data, so the tests can build every one).
//   question / example  a bedroom plan, 3 1/2 in by 2 1/2 in at 1 in : 4 ft, a ruler under the long wall
//   turn                a school garden, 6 cm by 4.5 cm at 1 cm : 3 m, a 2 cm shed drawn in at the end
//   prove               a room 3 in by 2 in at 1 in : 4 ft; one square inch blown up into 4 x 4 square feet
import type { PlanParams } from './PlanSheet';

const R4 = (w: number, h: number): [number, number][] => [[0, 0], [w, 0], [w, h], [0, h]];
const LEG_BED = '\\text{Scale } \\cssId{d}{1\\text{ in}} : \\cssId{a}{4\\text{ ft}}';

export const EXAMPLE: PlanParams = {
  unit: 'in', legend: LEG_BED, maxPx: 120,
  figs: [{
    pts: R4(3.5, 2.5), col: 'first', right: true,
    labels: [null, '2\\tfrac{1}{2}\\text{ in}', '3\\tfrac{1}{2}\\text{ in}', null],
    labels2: [null, '10\\text{ ft}', '14\\text{ ft}', null], label2Col: 'link', labels2Keys: [null, 'labels2b', 'labels2', null],
  }],
  ruler: { len: 4, ticks: 4, seg: [0, 3.5], segCol: 'first', actual: { per: 4, unit: 'ft' }, proj: { fig: 0, side: 2 } },
};
/** the question shows the same plan (same layout as the worked example), without the ruler and the answers */
export const QUESTION: PlanParams = EXAMPLE;
export const TURN: PlanParams = {
  unit: 'cm', legend: '\\text{Scale } \\cssId{d}{1\\text{ cm}} : \\cssId{a}{3\\text{ m}}',
  figs: [
    { pts: R4(6, 4.5), col: 'first', right: true, labels: [null, '4.5\\text{ cm}', '6\\text{ cm}', null], labels2: [null, '13.5\\text{ m}', '18\\text{ m}', null], label2Col: 'link', labels2Keys: [null, 'labels2b', 'labels2', null] },
    { pts: R4(2, 1), at: [0.5, 0.5], col: 'link', key: 'shed' },
  ],
  ruler: { len: 6, ticks: 2, seg: [0, 6], segCol: 'first', actual: { per: 3, unit: 'm' }, proj: { fig: 0, side: 2 } },
};
export const PROVE: PlanParams = {
  unit: 'in', legend: LEG_BED,
  figs: [{ pts: R4(3, 2), col: 'first', right: true, labels: [null, null, '3\\text{ in}', '2\\text{ in}'], labels2: [null, null, '12\\text{ ft}', '8\\text{ ft}'], label2Col: 'second' }],
  zoom: { cell: [2, 0], k: 4, side: '4\\text{ ft}' },
};
export const LESSON_PLANS: Record<string, PlanParams> = { question: QUESTION, example: EXAMPLE, turn: TURN, prove: PROVE };
