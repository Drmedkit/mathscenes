// plan.ts: the practice walks through every sub-goal of secondary-t5-20-scale-drawings-and-geometric-constructions,
// in topic JSON order (13 sub-goals, 16 families). Titles are short and kid-facing; the ids are the topic JSON ids.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'scale-copy-factor', title: 'Same factor, same angles', families: ['copy', 'copyLen'] },
  { id: 'scale-legend', title: 'Read a scale as a ratio', families: ['legend', 'legendNum'] },
  { id: 'drawing-to-actual', title: 'From the plan to the real thing', families: ['toActual'] },
  { id: 'actual-to-drawing', title: 'From the real thing to the plan', families: ['toDrawing'] },
  { id: 'unit-fraction-legend', title: 'A ¼-inch scale', families: ['fracLegend', 'fracRewrite'] },
  { id: 'draw-computed-length', title: 'Draw a length with a ruler', families: ['ruler'] },
  { id: 'make-scale-drawing', title: 'Make the whole plan', families: ['makePlan'] },
  { id: 'rescale-drawing', title: 'Redraw at a new scale', families: ['rescale'] },
  { id: 'area-from-drawing', title: 'Real area from a plan', families: ['area'] },
  { id: 'check-scale-drawing', title: 'Check a drawing: every side, every angle', families: ['audit'] },
  { id: 'choose-scale', title: 'Pick a scale that fits the page', families: ['fit'] },
  { id: 'area-factor-justify', title: 'Why area grows by k × k', families: ['areaWhy'] },
  { id: 'scale-context-application', title: 'From a plan to a price', families: ['cost'] },
];
