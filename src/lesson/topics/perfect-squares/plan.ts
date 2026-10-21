// plan.ts: the practice walks through every sub-goal of primary.numbers.square-roots-of-perfect-squares, in topic
// JSON order, with the families that practise it (a family may serve several sub-goals; the generator gets the
// sub-goal id and uses that sub-goal's number ranges).
import type { SubgoalPlan } from '../../runtime/practice';
import type { FamilyId } from './items';

interface Plan extends SubgoalPlan { families: FamilyId[] }
export const PLAN: Plan[] = [
  { id: 'perfect-square-as-area', title: 'Perfect squares are square areas', families: ['squareOf', 'arrangement'] },
  { id: 'side-from-area', title: 'The side from the area', families: ['sideFromArea', 'sideUnits'] },
  { id: 'radical-notation', title: 'Read and write √', families: ['translate', 'evalRoot'] },
  { id: 'zero-and-nonnegative', title: '√0 = 0, never negative', families: ['zeroRoot'] },
  { id: 'evaluate-roots-to-100', title: 'Roots up to 100', families: ['evalRoot', 'checkRoot'] },
  { id: 'evaluate-roots-to-225', title: 'Roots up to 225', families: ['squareOf', 'evalRoot', 'whichSquare', 'checkRoot'] },
  { id: 'perfect-square-test', title: 'Perfect square or not?', families: ['isSquare', 'whichSquare'] },
  { id: 'consecutive-squares-around-n', title: 'Between two squares', families: ['between'] },
  { id: 'bound-root-between-integers', title: 'A root between two whole numbers', families: ['boundRoot'] },
  { id: 'nearer-integer', title: 'Which whole number is nearer? (optional)', families: ['nearer'] },
  { id: 'sqrt-vs-halving', title: 'A root is not a half', families: ['halving'] },
  { id: 'coincidence-counterexample', title: 'One counterexample is enough', families: ['counterexample'] },
  { id: 'apply-side-from-area', title: 'Real squares, real units', families: ['context', 'sideUnits'] },
];
