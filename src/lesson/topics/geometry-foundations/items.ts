// items.ts: practice families for "Definitions, postulates and first proofs"
// (secondary-t6-17-foundations-of-geometry-definitions-postulates-and-reasoning, 31 sub-goals).
// Every figure is exact (computed points; a labelled measure is the drawn measure); every choice item has exactly one
// right choice (kit.choiceItem drops a wrong choice that means the same as the answer); every recognised slip carries
// its catalogue id (math-curriculum-essentials/misconceptions.json). Pictures (item.picture, solution-side data
// under `reveal`): fig (GeoFig), proof (ProofFrame), gallery (several figures), globe (Globe), card, cards.
// The families live in famA.ts (starting kit, sub-goals 1-9), famB.ts (notation, markings, one-step reasons,
// properties, sub-goals 11-21) and famC.ts (proofs, scope, evidence, counterexamples, parallels).
import type { Gen } from './kit';
import { angleAdd, conjOrThm, defVerdict, givenOrProve, holdsOnSphere, hypConc, kindOf, markVsObject, pickDef, proofOf, readGiven, segAdd, sphereLine, sphereTriangle, tiltedDef, toIfThen, undefTerm, whatMakesThm, whichBreaks, whichIsProof } from './famA';
import { bothWays, boxSplit, canAssume, chainNum, congSuppNum, defSwitch, figVsMeasure, matchReason, mayConclude, midAlg, nameAngle, partialDef, propApply, propName, readMark, validUse } from './famB';
import { afterCounter, algebraPar, angleChain, converseOf, everySome, evidenceVerdict, findLine, formatJudge, isParallel, notParallel, pairNameFam, parsons, pickCounter, planBack, proofFill, reasonType, redraw, repairCircular, scopeOf, tearCorners } from './famC';

export { MC, type GFItem, type GFPicture } from './kit';

export const GENERATORS: Record<string, Gen> = {
  undefTerm, markVsObject, tiltedDef, pickDef, defVerdict, whichBreaks, kindOf, segAdd, angleAdd,
  sphereLine, sphereTriangle, holdsOnSphere, hypConc, toIfThen, conjOrThm, whatMakesThm, whichIsProof, proofOf,
  givenOrProve, readGiven, reasonType, findLine, nameAngle, figVsMeasure, defSwitch, readMark, boxSplit,
  mayConclude, canAssume, matchReason, midAlg, validUse, bothWays, partialDef, propName, propApply, proofFill,
  chainNum, congSuppNum, formatJudge, repairCircular, parsons, planBack, scopeOf, everySome, redraw,
  evidenceVerdict, tearCorners, pickCounter, afterCounter, pairName: pairNameFam, notParallel, isParallel,
  converseOf, angleChain, algebraPar,
};

export const FAMILY_NAMES: Record<string, string> = {
  undefTerm: 'Undefined terms', markVsObject: 'The mark and the object', tiltedDef: 'Does it meet the definition?', pickDef: 'What a definition says',
  defVerdict: 'Test a definition', whichBreaks: 'Where a definition fails', kindOf: 'Definition, postulate, theorem or conjecture?', segAdd: 'Segment Addition',
  angleAdd: 'Angle Addition', sphereLine: 'Lines on a sphere', sphereTriangle: 'A triangle on a sphere', holdsOnSphere: 'Plane or sphere?',
  hypConc: 'Hypothesis and conclusion', toIfThen: 'Into if-then form', conjOrThm: 'Conjecture or theorem?', whatMakesThm: 'What makes a theorem',
  whichIsProof: 'Which card is a proof?', proofOf: 'Proof, theorem, definition or postulate', givenOrProve: 'Given and Prove', readGiven: 'Reading the givens',
  reasonType: 'Kinds of reasons', findLine: 'Find the line', nameAngle: 'Naming an angle', figVsMeasure: 'Figure or measure?',
  defSwitch: 'Congruent and equal measures', readMark: 'Reading the markings', boxSplit: 'The right-angle box', mayConclude: 'What the diagram shows',
  canAssume: 'May you use it?', matchReason: 'The reason for a step', midAlg: 'Midpoints and bisectors with x', validUse: 'Which direction?',
  bothWays: 'Both directions', partialDef: 'Every condition', propName: 'Name the property', propApply: 'Use the property',
  proofFill: 'Fill the missing line', chainNum: 'Chains with numbers', congSuppNum: 'Vertical angles and linear pairs', formatJudge: 'Layout or logic?',
  repairCircular: 'Repair a circular step', parsons: 'Put the proof in order', planBack: 'Plan backward', scopeOf: 'What a claim covers',
  everySome: 'Every, some or one', redraw: 'One drawing, every figure', evidenceVerdict: 'Evidence or proof?', tearCorners: 'Why every triangle?',
  pickCounter: 'Find the counterexample', afterCounter: 'After a counterexample', pairName: 'Angle pairs at a transversal', notParallel: 'Only with parallel lines',
  isParallel: 'Are the lines parallel?', converseOf: 'The converse', angleChain: 'Angle chains', algebraPar: 'Parallel lines with x',
};
