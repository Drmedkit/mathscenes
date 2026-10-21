// plan.ts: the practice walk-through, one entry per sub-goal of primary.fractions.multiply-fraction-by-fraction in
// topic JSON order, with the families that practise it (a family may serve several sub-goals; the generator gets the
// sub-goal id and uses that sub-goal's number ranges).
import type { SubgoalPlan } from '../../runtime/practice';
import type { FamilyId } from './items';

interface Plan extends SubgoalPlan { families: FamilyId[] }
export const PLAN: Plan[] = [
  { id: 'fraction-times-whole', title: 'A fraction of a whole number', families: ['ofWhole'] },
  { id: 'unit-of-unit', title: 'One part of one part', families: ['areaRead'] },
  { id: 'unit-of-nonunit', title: 'One share of several parts', families: ['areaRead'] },
  { id: 'nonunit-of-nonunit', title: 'Several shares: rows × columns', families: ['areaRead', 'rule'] },
  { id: 'equation-and-story', title: '“Of” means times', families: ['equation'] },
  { id: 'model-to-rule', title: 'Why tops × tops, bottoms × bottoms', families: ['rule'] },
  { id: 'fractional-side-area', title: 'Tiles with fraction sides', families: ['tiles'] },
  { id: 'compute-proper', title: 'Multiply without a picture', families: ['compute'] },
  { id: 'simplify-product', title: 'Simplest form', families: ['simplify'] },
  { id: 'cancel-before', title: 'Simplify first (optional)', families: ['cancel'] },
  { id: 'improper-factors', title: 'Factors bigger than 1', families: ['compute', 'areaRead'] },
  { id: 'identity-zero', title: 'Times 1 and times 0', families: ['compute', 'predict'] },
  { id: 'mixed-number-factors', title: 'Mixed numbers', families: ['compute'] },
  { id: 'times-as-much', title: 'A resized amount', families: ['predict'] },
  { id: 'predict-size', title: 'Bigger or smaller, without computing', families: ['predict'] },
  { id: 'explain-scaling', title: 'Why it shrinks or grows', families: ['explain'] },
  { id: 'apply-context', title: 'Word problems with a size check', families: ['story'] },
  { id: 'rectangle-perimeter-area-rational', title: 'Perimeter and area', families: ['rect'] },
];
