// plan.ts: the practice walk for "fraction of a quantity", one entry per sub-goal of the topic JSON, in its order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: SubgoalPlan[] = [
  { id: 'unit-fraction-of-set', title: 'One share of a set', families: ['setShare', 'groupChoice'] },
  { id: 'unit-fraction-tape-diagram', title: 'One part of a tape', families: ['tapeUnit', 'equalParts'] },
  { id: 'non-unit-iterate', title: 'Take some of the shares', families: ['iterate'] },
  { id: 'record-expression', title: 'Write it as an expression', families: ['expr'] },
  { id: 'unit-fraction-by-division', title: 'One share by dividing', families: ['bareUnit'] },
  { id: 'divide-then-multiply', title: 'Divide, then multiply', families: ['bareDTM', 'iterate'] },
  { id: 'fraction-at-least-one', title: 'The whole and more', families: ['overOne'] },
  { id: 'unit-preservation-check', title: 'Keep the unit', families: ['unitCheck'] },
  { id: 'size-prediction', title: 'Less, equal or more?', families: ['predict'] },
  { id: 'recover-unit-share', title: 'Back to one share', families: ['recover'] },
  { id: 'reconstruct-whole', title: 'Check by rebuilding the whole', families: ['verify'] },
  { id: 'select-whole-in-context', title: 'Which is the whole?', families: ['whichWhole'] },
  { id: 'fractional-unit-share', title: 'A share that is a fraction', families: ['fracShare'] },
  { id: 'fractional-non-unit-share', title: 'Some shares that make a fraction', families: ['fracNonUnit'] },
  { id: 'unknown-whole-extension', title: 'Find the whole (extra)', families: ['unknownWhole'] },
];
