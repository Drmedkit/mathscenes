// plan.ts: the practice walk-through, one entry per sub-goal of secondary-t5-28-square-roots-and-cube-roots in topic
// JSON order, with the families that practise it (a family may serve several sub-goals; the generator gets the
// sub-goal id and uses that sub-goal's number ranges).
import type { SubgoalPlan } from '../../runtime/practice';
import type { FamilyId } from './items';

interface Plan extends SubgoalPlan { families: FamilyId[] }
export const PLAN: Plan[] = [
  { id: 'undo-squaring', title: 'Undo squaring: the side of a square', families: ['sqSide'] },
  { id: 'radical-notation-principal', title: '√ names one number, 0 or more', families: ['principal'] },
  { id: 'undo-cubing', title: 'Undo cubing: the edge of a cube', families: ['cubeEdge'] },
  { id: 'cube-root-notation', title: 'The little 3: ∛ versus √', families: ['rootIndex'] },
  { id: 'sign-domain', title: 'Roots of negative numbers', families: ['signRoot'] },
  { id: 'eval-perfect-square-roots', title: 'Square roots up to 144', families: ['evalSq'] },
  { id: 'square-roots-to-225', title: 'Square roots of 169, 196, 225', families: ['evalSq'] },
  { id: 'eval-perfect-cube-roots', title: 'Cube roots up to 1,000', families: ['evalCube'] },
  { id: 'rational-radicand-roots', title: 'Roots of fractions and decimals', families: ['ratRoot'] },
  { id: 'exact-vs-approximate', title: 'Rational or irrational, = or ≈', families: ['rational'] },
  { id: 'bound-square-root-integers', title: 'A square root between whole numbers', families: ['boundSq'] },
  { id: 'bound-cube-root-integers', title: 'A cube root between whole numbers', families: ['boundCube'] },
  { id: 'refine-decimal-bounds', title: 'Close in to tenths', families: ['refine'] },
  { id: 'locate-compare-roots', title: 'Place, compare and order roots', families: ['compare'] },
  { id: 'round-root-nearest-tenth', title: 'Round with the midpoint square', families: ['roundRoot'] },
  { id: 'square-equation-two-solutions', title: 'x² = p has two solutions', families: ['solveSq'] },
  { id: 'square-equation-boundary-cases', title: 'One solution, or none', families: ['countSol'] },
  { id: 'cube-equation-one-solution', title: 'x³ = p has one solution', families: ['solveCube'] },
  { id: 'isolate-then-root', title: 'One step first, then the root', families: ['isolate'] },
  { id: 'context-select-root', title: 'Lengths, areas and volumes', families: ['context'] },
  { id: 'multistep-expressions-radicals', title: 'Roots inside longer expressions', families: ['multistep'] },
];
