// items.ts: the practice families of "Summarizing and comparing data" (secondary-t6-15), one map for the runtime.
// Families live in famA (stage 1), famB (stage 2) and famC (stage 3); shared makers in common.ts. Pure: no DOM.
import type { Gen } from './common';
import { boxPercent, boxTruth, devBalance, devOne, differIn, madCompute, madMeaning, medianDots, medianList, sameCenter, sdRank, sdTransform, shapeFeature, shapeName, spreadMore, unusualMax, unusualWhere } from './famA';
import { binCount, binWidth, boundaryBin, comparableRow, dataType, displayChoice, dotStack, entryCheck, entryFix, fencesFam, iqr, isOutlierFam, modPlotPick, quartiles, scaleChoice, scaleRead, sdOutput, sdPlausible, stemLeaf, summaryPick, twoSet, weighted, weightedSense, whiskerEnd } from './famB';
import { choosePair, compareClaim, effectCenter, effectSpread, handleOutlier, iqrAfter, meanShift, typoFix } from './famC';

export type { DItem, Pic, PlotPic } from './common';
export { MC } from './common';

export const GENERATORS: Record<string, Gen> = {
  medianList, medianDots, differIn, sameCenter, spreadMore, shapeName, shapeFeature, boxPercent, boxTruth, unusualWhere, unusualMax,
  devOne, devBalance, madCompute, madMeaning, sdRank, sdTransform,
  binCount, dotStack, scaleChoice, scaleRead, boundaryBin, binWidth, quartiles, iqr, fences: fencesFam, isOutlier: isOutlierFam,
  whiskerEnd, modPlotPick, displayChoice, dataType, stemLeaf, entryCheck, entryFix, sdOutput, sdPlausible, weighted, weightedSense,
  summaryPick, twoSet, comparableRow,
  effectCenter, meanShift, effectSpread, iqrAfter, choosePair, compareClaim, handleOutlier, typoFix,
};
export const FAMILY_NAMES: Record<string, string> = {
  medianList: 'Median of a list', medianDots: 'Median from a dot plot', differIn: 'Center or spread?', sameCenter: 'Same center, same data?',
  spreadMore: 'Which is more spread out?', shapeName: 'Name the shape', shapeFeature: 'Gaps and clusters', boxPercent: 'Quarters of a box plot',
  boxTruth: 'What a box plot shows', unusualWhere: 'Unusual where?', unusualMax: 'Is the largest unusual?', devOne: 'Distance from the mean',
  devBalance: 'Balance the plot', madCompute: 'Find the MAD', madMeaning: 'What the MAD means', sdRank: 'Rank by SD', sdTransform: 'Shift or stretch',
  binCount: 'Build a histogram bar', dotStack: 'Build a dot plot', scaleChoice: 'Choose a scale', scaleRead: 'Read the scale',
  boundaryBin: 'Values on a bin edge', binWidth: 'Bin width and shape', quartiles: 'Find Q1 and Q3', iqr: 'Find the IQR', fences: 'The fences',
  isOutlier: 'Outlier or not?', whiskerEnd: 'Where the whisker ends', modPlotPick: 'Pick the modified box plot', displayChoice: 'Choose the display',
  dataType: 'What kind of data?', stemLeaf: 'Stem-and-leaf plots', entryCheck: 'Check the entry', entryFix: 'Fix a typo', sdOutput: 'Read 1-Var Stats',
  sdPlausible: 'Is that SD plausible?', weighted: 'Weighted average', weightedSense: 'Where the weighted average lands', summaryPick: 'Summarize in context',
  twoSet: 'Two data sets, same statistic', comparableRow: 'A fair comparison', effectCenter: 'Extremes and the center', meanShift: 'How far the mean moves',
  effectSpread: 'Extremes and the spread', iqrAfter: 'The IQR after a change', choosePair: 'Choose the measures', compareClaim: 'Compare two groups',
  handleOutlier: 'Handle the unusual value', typoFix: 'Fix and recompute',
};
