// plan.ts: the practice walk-through, one entry per sub-goal of secondary-t6-29-area-and-perimeter-of-composite-figures
// in topic JSON order, with the families that practise it (a family may serve several sub-goals; the generator gets
// the sub-goal id and uses that sub-goal's cases).
import type { SubgoalPlan } from '../../runtime/practice';
import type { FamilyId } from './items';

interface Plan extends SubgoalPlan { families: FamilyId[] }
export const PLAN: Plan[] = [
  { id: 's1-region-vs-boundary', title: 'The surface or the edge', families: ['shown'] },
  { id: 's1-context-measure-unit', title: 'Perimeter or area, and the unit', families: ['measure'] },
  { id: 's1-seam-exclusion', title: 'Seams are not edges', families: ['inventory', 'shown'] },
  { id: 's1-hole-boundary', title: 'A hole’s edge, the outer edge', families: ['shown', 'inventory'] },
  { id: 's1-arc-part-of-circumference', title: 'A curve is part of a circle', families: ['arcVs', 'arcEst'] },
  { id: 's2-exact-pi-notation', title: 'Exact answers with π', families: ['exact', 'readPi'] },
  { id: 's2-fraction-circle-area', title: 'Area of a half or quarter circle', families: ['partArea'] },
  { id: 's2-arc-length', title: 'Length of a curved edge', families: ['arcLen'] },
  { id: 's2-infer-dimensions', title: 'Find the missing length', families: ['infer'] },
  { id: 's2-combine-pi-terms', title: 'Combine the π terms', families: ['combine', 'likeTerms'] },
  { id: 's2-composite-area-add', title: 'Add the areas of the parts', families: ['areaAdd'] },
  { id: 's2-composite-perimeter', title: 'Walk the edge once', families: ['perimAdd'] },
  { id: 's2-cutout-area', title: 'Area after a cut-out', families: ['cutArea', 'cutPick'] },
  { id: 's2-notch-perimeter', title: 'Perimeter after a notch', families: ['notch'] },
  { id: 's2-exact-and-approx', title: 'Exact first, round at the end', families: ['round', 'approx'] },
  { id: 's3-hole-area-and-boundary', title: 'A hole: less area, more edge', families: ['hole'] },
  { id: 's3-parts-inventory-justification', title: 'Check the parts table', families: ['critique', 'inventory'] },
  { id: 's3-counterexample-area-perimeter', title: 'Less area, more perimeter?', families: ['counter'] },
  { id: 's3-context-model', title: 'What the job needs', families: ['which', 'job'] },
];
