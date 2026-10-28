// items.ts: practice families for "Right triangle trigonometry" (secondary-t6-23-right-triangle-trigonometry,
// 29 sub-goals). Figures are exact (a labelled length or angle is drawn at its value, one unit per figure); every
// choice item has exactly one right choice (a wrong choice whose value equals the answer is dropped, so the sin A /
// cos B pair and opposite / adjacent swaps at 45° never appear as "wrong"); every rounded answer states its
// precision and is never a .x5 tie; every recognised slip carries its catalogue id. Pictures (item.picture, the
// course's GFPicture): fig (GeoFig), card, gallery.
// famA: stage 1 (sides, invariance, sin / cos / tan, bounds, covariation, co-functions); famB: stage 2 (calculator,
// choosing the ratio, missing sides and angles, solving, special triangles, triples, regular polygons); famC: stage 3
// (audits, mode errors, models, precision, elevation / depression, polygons in real objects).
import type { Gen } from './common';
import { cofMatch, cofMissing, cofTri, compareRatio, compositeSide, cosDec, doubleClaim, invClaim, nameSide, possible, sameAngle, scaleRatio, sinVar, sohMix, swapAngle, whichPossible, writeCos, writeSin, writeTan } from './famA';
import { apothemQ, carry, chooseEq, chooseFn, estimateTrig, evalTrig, exactSolve, exactVal, invCalc, invEq, invMeaning, invTable, methodPick, modeCheck, modeRead, polyArea_, polyDerive, roundCompare, sideDen, sideDenEq, sideNum, sideNumEq, solveAll, solvePlan, specialDerive, specialFwd, specialRev, specialRevNum, tripleMissing, tripleSpot } from './famB';
import { adaRamp, auditAngle, auditFix, auditSetup, depWhere, depression, elevation, kite, ladder, modeDiag, modeFix, polyContext, polyUnits, precision, precisionCritique, shadowTrig } from './famC';

export type { GFItem, GFPicture } from '../geometry-foundations/kit';

export const GENERATORS: Record<string, Gen> = {
  nameSide, swapAngle, compositeSide, scaleRatio, invClaim, sameAngle, writeSin, sinVar, writeCos, cosDec, writeTan, sohMix,
  possible, whichPossible, compareRatio, doubleClaim, cofMissing, cofMatch, cofTri,
  modeRead, modeCheck, evalTrig, estimateTrig, carry, roundCompare, chooseEq, chooseFn, sideNum, sideNumEq, sideDen, sideDenEq,
  invTable, invMeaning, invCalc, invEq, solveAll, solvePlan, specialDerive, specialFwd, specialRev, specialRevNum, exactVal,
  exactSolve, tripleSpot, tripleMissing, methodPick, polyArea: polyArea_, apothem: apothemQ, polyDerive,
  auditAngle, auditSetup, auditFix, modeDiag, modeFix, ladder, kite, shadowTrig, adaRamp, precision, precisionCritique,
  elevation, depression, depWhere, polyContext, polyUnits,
};

export const FAMILY_NAMES: Record<string, string> = {
  nameSide: 'Name the side', swapAngle: 'Same side, other angle', compositeSide: 'A triangle inside a figure',
  scaleRatio: 'Bigger triangle, same ratio', invClaim: 'Why the ratio stays', sameAngle: 'Same shape, same angle',
  writeSin: 'Sine from the sides', sinVar: 'Ratios with letters', writeCos: 'Cosine from the sides', cosDec: 'Cosine as a decimal',
  writeTan: 'Tangent from the sides', sohMix: 'Which ratio is it?', possible: 'Could that be right?', whichPossible: 'Possible values',
  compareRatio: 'Which is greater?', doubleClaim: 'Double the angle?', cofMissing: 'Complementary angles', cofMatch: 'Sine is cosine of the complement',
  cofTri: 'Both acute angles', modeRead: 'Read the mode', modeCheck: 'Test the mode', evalTrig: 'Key it in', estimateTrig: 'Estimate first',
  carry: 'Keep every digit', roundCompare: 'Who rounded too soon?', chooseEq: 'Pick the equation', chooseFn: 'Pick the function',
  sideNum: 'Unknown on top', sideNumEq: 'Solve: x on top', sideDen: 'Unknown below', sideDenEq: 'Solve: x below',
  invTable: 'Inverse from a table', invMeaning: 'What sin⁻¹ means', invCalc: 'Find the angle', invEq: 'Angle from a ratio',
  solveAll: 'Solve the triangle', solvePlan: 'Which tool?', specialDerive: 'Where the ratios come from', specialFwd: 'Special triangles: scale up',
  specialRev: 'Special triangles: work back', specialRevNum: 'Special triangles in use', exactVal: 'Exact values', exactSolve: 'Exact sides',
  tripleSpot: 'Spot the triple', tripleMissing: 'Triples as a shortcut', methodPick: 'Fastest method', polyArea: 'Regular polygon area',
  apothem: 'Find the apothem', polyDerive: 'Why ½aP', auditAngle: 'Check the angle', auditSetup: 'Size checks', auditFix: 'Fix the setup',
  modeDiag: 'Spot a mode error', modeFix: 'Redo it in degrees', ladder: 'Ladders', kite: 'Kites', shadowTrig: 'Shadows and the sun',
  adaRamp: 'Wheelchair ramps', precision: 'How precise?', precisionCritique: 'Too many digits', elevation: 'Angle of elevation',
  depression: 'Angle of depression', depWhere: 'Where is the angle?', polyContext: 'Signs, floors and tiles', polyUnits: 'Square units',
};
