// plan.ts: the practice walk-through, one entry per sub-goal of secondary.composite-area-volume-and-surface-area in
// topic JSON order, with the families that practise it (the generator gets the sub-goal id and uses its cases).
import type { SubgoalPlan } from '../../runtime/practice';
import type { FamilyId } from './items';

interface Plan extends SubgoalPlan { families: FamilyId[] }
export const PLAN: Plan[] = [
  { id: 'comp-partition', title: 'Split it with no overlaps or gaps', families: ['split'] },
  { id: 'comp-hidden-dimension', title: 'Find a missing length', families: ['hidden'] },
  { id: 'area-additive', title: 'Area by adding parts', families: ['areaAdd'] },
  { id: 'area-subtractive', title: 'Area by taking a part away', families: ['areaSub'] },
  { id: 'vol-additive', title: 'Volume by adding blocks', families: ['volAdd'] },
  { id: 'vol-subtractive', title: 'Volume with a part removed', families: ['volSub'] },
  { id: 'vol-prism-bh', title: 'Prisms: V = Bh', families: ['prismBh'] },
  { id: 'vol-composite-base-prism', title: 'One prism, a composite base', families: ['tent'] },
  { id: 'pyramid-one-third-prism', title: 'A pyramid is a third of its prism', families: ['third'] },
  { id: 'pyramid-volume', title: 'Pyramid volume', families: ['pyrVol'] },
  { id: 'partition-independence', title: 'Two ways, one answer', families: ['twoWays'] },
  { id: 'sa-contact-classify', title: 'Inside or outside?', families: ['classify'] },
  { id: 'sa-whole-face', title: 'Count the outside faces', families: ['faces'] },
  { id: 'sa-double-subtraction', title: 'Joined blocks: take the contact off twice', families: ['joinSA'] },
  { id: 'sa-partial-contact', title: 'A small block on a big face', families: ['partialSA'] },
  { id: 'sa-cut-join-invariance', title: 'Cut it, join it', families: ['cutJoin'] },
  { id: 'apply-choose-measure', title: 'Fill, cover or coat?', families: ['which'] },
  { id: 'cyl-volume-bh', title: 'Cylinder volume', families: ['cylVol'] },
  { id: 'cyl-surface-area-net', title: 'Cylinder surface from its net', families: ['cylSA'] },
  { id: 'vol-missing-dimension', title: 'Find a missing height', families: ['missing'] },
  { id: 'apply-cost-coverage', title: 'How much to buy?', families: ['cost'] },
];
