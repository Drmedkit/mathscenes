// plan.ts: the practice walk-through, one entry per sub-goal of secondary-t5-23-cross-sections-and-composite-area-volume
// in topic JSON order, with the families that practise it (a family may serve several sub-goals; the generator gets
// the sub-goal id and uses that sub-goal's cases).
import type { SubgoalPlan } from '../../runtime/practice';
import type { FamilyId } from './items';

interface Plan extends SubgoalPlan { families: FamilyId[] }
export const PLAN: Plan[] = [
  { id: 'cs-plane-section-parallel', title: 'A flat slice, parallel to a face', families: ['name', 'dims'] },
  { id: 'cs-perpendicular-orientation', title: 'Which way the cut faces', families: ['orient', 'dims', 'name'] },
  { id: 'cs-pyramid-tapering', title: 'Pyramid slices shrink', families: ['taper', 'half'] },
  { id: 'cs-pyramid-perpendicular', title: 'Triangle or trapezoid', families: ['upright', 'bottom'] },
  { id: 'cs-oblique-trace', title: 'Trace it face by face', families: ['join', 'count', 'equi'] },
  { id: 'cs-section-possibility', title: 'Which shapes are possible', families: ['possible', 'most'] },
];
