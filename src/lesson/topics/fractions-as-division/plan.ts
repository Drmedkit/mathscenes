// plan.ts: the practice walks through every sub-goal of primary.fractions.fractions-as-division, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'share-one-whole', title: 'One whole, shared', families: ['story'] },
  { id: 'share-several-wholes-less-than-one', title: 'Fewer wholes than people', families: ['story'] },
  { id: 'share-one-or-more-wholes', title: 'As many wholes or more', families: ['story'] },
  { id: 'fraction-bar-means-divide', title: 'The fraction bar means ÷', families: ['toFrac', 'toDiv'] },
  { id: 'sharing-story-to-division', title: 'From story to division', families: ['storyToDiv', 'story'] },
  { id: 'quotient-as-mixed-number', title: 'Shares bigger than one', families: ['toMixed'] },
  { id: 'bound-between-wholes', title: 'Between which whole numbers?', families: ['between'] },
  { id: 'remainder-as-fraction-of-divisor', title: 'Share the leftover', families: ['remainder', 'slip'] },
  { id: 'conservation-check', title: 'Do the shares add back?', families: ['checkBack'] },
  { id: 'two-sharing-methods-agree', title: 'Two ways, one share', families: ['twoWays'] },
  { id: 'remainder-subdivide-or-keep', title: 'Cut it or keep it whole', families: ['cutOrKeep'] },
  { id: 'remainder-sharing-vs-grouping', title: 'What does the question ask?', families: ['groups'] },
];
