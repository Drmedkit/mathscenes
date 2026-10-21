// plan.ts: practice walks through every sub-goal of secondary-t5-39-volume-cones-cylinders-spheres, in topic JSON order.
// Each sub-goal has a short kid-friendly title and the families that practise it (items.ts; a family that serves
// several sub-goals uses each sub-goal's own number ranges).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'identify-r-h', title: 'Find r and h on the solid', families: ['id-lengths', 'id-sphere', 'id-lying'] },
  { id: 'cylinder-bh', title: 'A cylinder is layers: V = Bh', families: ['bh-layers', 'bh-twin', 'bh-layer-area'] },
  { id: 'cone-third', title: 'A cone fills one third', families: ['cone-pour', 'cone-match'] },
  { id: 'sphere-two-thirds', title: 'A ball fills two thirds of its can', families: ['sph-pour', 'sph-can'] },
  { id: 'cylinder-volume-calc', title: 'Cylinder volume, exactly', families: ['calc-pic', 'calc-story'] },
  { id: 'cone-volume-calc', title: 'Cone volume, exactly', families: ['calc-pic', 'calc-story'] },
  { id: 'sphere-volume-calc', title: 'Sphere volume, exactly', families: ['calc-pic', 'calc-story'] },
  { id: 'hemisphere-volume', title: 'Half a sphere', families: ['calc-pic', 'calc-story'] },
  { id: 'diameter-given', title: 'Given the diameter', families: ['calc-pic', 'calc-story'] },
  { id: 'mixed-formula-choice', title: 'Pick the right formula', families: ['mix-formula', 'calc-pic', 'calc-story'] },
  { id: 'exact-vs-approx', title: 'Exact and rounded', families: ['approx-round', 'approx-signs'] },
  { id: 'decimal-dimensions', title: 'Decimal and fraction lengths', families: ['calc-pic', 'dec-frac-r'] },
  { id: 'sa-prism-lateral-total', title: 'Prisms: lateral and total area', families: ['sa-prism-net', 'sa-prism-story'] },
  { id: 'sa-cylinder', title: 'Cylinders: label and total area', families: ['sa-cyl-net', 'sa-or-vol'] },
  { id: 'common-length-unit', title: 'One length unit first', families: ['unit-mixed', 'unit-trap'] },
  { id: 'cubic-unit-conversion', title: 'Convert cubic units', families: ['cubic-conv', 'cubic-cube'] },
  { id: 'capacity-conversion', title: 'Volume as gallons or liters', families: ['cap-tank', 'cap-liter'] },
  { id: 'estimate-check', title: 'Estimate to check', families: ['est-judge', 'est-nearest'] },
  { id: 'audit-inputs', title: 'Find the wrong input', families: ['audit-input', 'audit-fix'] },
  { id: 'solve-for-height', title: 'Find the height', families: ['solve-h', 'solve-story'] },
  { id: 'solve-for-radius', title: 'Find the radius', families: ['solve-r', 'solve-story'] },
  { id: 'scale-height-only', title: 'Change only the height', families: ['scale-one', 'scale-compare'] },
  { id: 'scale-radius-only', title: 'Change only the radius', families: ['scale-one', 'scale-compare'] },
  { id: 'model-practical', title: 'Real containers and piles', families: ['model-inside', 'model-pile', 'calc-story'] },
  { id: 'scale-uniform-k3', title: 'Extension: every length × k', families: ['scale-one', 'scale-compare'] },
];
