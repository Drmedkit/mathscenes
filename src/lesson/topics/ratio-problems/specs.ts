// specs.ts: the double number lines of parts 1-4 (the page draws them; the tests check their maths and layout).
import type { DLSpec } from './DoubleLine';

/** parts 1-2: 4 lb of cherries cost $10; 6 lb? (× 1.5 = ÷ 2 then × 3; $2.50 per pound; the additive claim $12) */
export const CHERRY: DLSpec = {
  top: { name: 'pounds' }, bot: { name: 'dollars', money: true },
  given: [4, 10], target: [6, null], pieces: { cut: 2, count: 3 }, unit: true,
  arcs: [{ from: 'given', to: 'target', label: '×1.5' }],
  within: [{ at: 'given', label: '×2.5' }, { at: 'target', label: '×2.5' }],
  claim: 12,
};
/** part 3: Maya hikes 12 miles in 4 hours; 9 miles? (× 0.75 on both; 3 miles per hour) */
export const HIKE: DLSpec = {
  top: { name: 'hours' }, bot: { name: 'miles' },
  given: [4, 12], target: [null, 9], pieces: { cut: 4, count: 3 },
  arcs: [{ from: 'given', to: 'target', label: '×0.75' }],
  within: [{ at: 'given', label: '×3' }, { at: 'target', label: '×3' }],
};
/** part 4: 7 lb of pears cost $20; 12 lb = 240/7 dollars, $34.29 (Alex rounds first: $34.32) */
export const PEARS: DLSpec = {
  top: { name: 'pounds' }, bot: { name: 'dollars', money: true },
  given: [7, 20], target: [12, null], pieces: { cut: 7, count: 12 },
  arcs: [{ from: 'given', to: 'target', label: '×12/7' }], fillText: '$34.29',
};
