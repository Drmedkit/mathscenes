// plan.ts: the practice walks through every sub-goal of secondary.scientific-notation-and-order-of-magnitude, in
// topic JSON order, with the families that practise it (the generator gets the sub-goal id).
import type { SubgoalPlan } from '../../runtime/practice';
import type { FamilyId } from './items';

interface Plan extends SubgoalPlan { families: FamilyId[] }
export const PLAN: Plan[] = [
  { id: 'sci-notation-structure', title: 'What scientific notation looks like', families: ['isSci', 'negMeaning'] },
  { id: 'convert-sci-to-decimal', title: 'Scientific notation to decimal', families: ['toDecimal'] },
  { id: 'convert-decimal-to-sci', title: 'Decimal to scientific notation', families: ['toSci'] },
  { id: 'renormalize', title: 'Fix the number in front', families: ['renorm'] },
  { id: 'multiply-sci', title: 'Multiply', families: ['multiply'] },
  { id: 'divide-sci', title: 'Divide', families: ['divide'] },
  { id: 'add-subtract-same-power', title: 'Add and subtract, same power', families: ['addSame', 'distribute'] },
  { id: 'align-unequal-powers', title: 'Line up the powers first', families: ['align'] },
  { id: 'mixed-notation-arithmetic', title: 'Decimals and scientific notation together', families: ['mixed', 'sameNumber'] },
  { id: 'e-notation', title: 'Calculator E-notation', families: ['eNote', 'eDecimal'] },
  { id: 'estimate-single-digit-power', title: 'One digit times a power of 10', families: ['estimate'] },
  { id: 'compare-times-as-much', title: 'How many times as big?', families: ['times'] },
  { id: 'order-of-magnitude-convention', title: 'Order of magnitude or exact ratio?', families: ['band', 'bandVsRatio'] },
  { id: 'choose-unit', title: 'A clear unit for huge and tiny', families: ['convertUnit', 'pickUnit'] },
  { id: 'sci-notation-word-problems', title: 'Real-world problems', families: ['story', 'storyOp', 'report'] },
];
