// plan.ts: the practice walks through every sub-goal of primary.data.make-pie-chart, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'circle-is-whole', title: 'The circle is the whole', families: ['whole'] },
  { id: 'sector-share-by-central-angle', title: 'The angle sets the share', families: ['sameShare'] },
  { id: 'percent-degree-double-scale', title: '100% is 360°', families: ['toDeg', 'toPct'] },
  { id: 'estimate-sector-share', title: 'Estimate a slice', families: ['estimate'] },
  { id: 'relative-frequency', title: 'Count over total', families: ['share'] },
  { id: 'percent-from-relative-frequency', title: 'Share as a percent', families: ['pct'] },
  { id: 'round-displayed-percent', title: 'Round a percent', families: ['roundPct'] },
  { id: 'central-angle-from-share', title: 'Share of 360°', families: ['angle'] },
  { id: 'keep-unrounded-shares', title: 'Round only at the end', families: ['exact'] },
  { id: 'close-angle-list', title: 'Close the circle at 360°', families: ['close'] },
  { id: 'draw-adjacent-sectors', title: 'Next slice from the last edge', families: ['adjacent'] },
  { id: 'draw-reflex-sector', title: 'Slices over 180°', families: ['reflex'] },
  { id: 'label-circle-graph', title: 'Label the graph', families: ['label'] },
  { id: 'audit-against-source', title: 'Check against the data', families: ['audit'] },
  { id: 'rounding-error-bound', title: 'Rounding or a mistake?', families: ['bound'] },
  { id: 'disclose-rounding', title: 'Fix rounding honestly', families: ['disclose'] },
  { id: 'incomplete-whole', title: 'A missing part of the whole', families: ['gap'] },
  { id: 'reject-overlapping-categories', title: 'Does a circle graph fit?', families: ['fit'] },
];
