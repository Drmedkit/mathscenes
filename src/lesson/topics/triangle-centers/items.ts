// items.ts: practice families for "Midsegments and points of concurrency" (secondary-t6-20-properties-of-triangles,
// 35 sub-goals). Every figure is exact (computed midpoints, feet, centers; tick groups equal, arc groups equal, boxes
// 90°, labelled lengths and angles drawn at their size); every choice item has exactly one right choice (special
// triangles where centers or segments coincide are avoided or asked about on purpose); every recognised slip carries
// its catalogue id. Pictures (item.picture): fig (the course's GeoFig), proof (ProofFrame), card, cons (the
// constructions lesson's player). famA: stage 1 (identify, centers); famB: stage 2 (measures, constructions, mixed);
// famC: stage 3 (proofs, critique, contexts).
import type { Gen } from './tkit';
import { abEquiNum, abEquiWhich, altitudeCase, bisectorMid, centerFig, centerMatch, centroidLines, circumWhere, circumWhich, inRadius, inWhich, medianWhich, midsegId, orthoWhere, pbEquiNum, pbEquiWhich, perpBisCheck, segKind, thirdMedian } from './famA';
import { bisectAlg, bisectAngle, centerDist, centroidAlg, centroidPart, chainAlt, chainBisAlt, chainExt, circNext, circRadius, enoughInfo, equiAlg, inNext, inRadiusCons, medialPerim, medianLength, medianParts, midsegAlg, midsegAngle, midsegLen, midsegParallel, mixedNum, pythCirc, pythIn } from './famB';
import { abConvReason, abProofReason, concurChain, contextBrace, contextTowns, converseState, critique, inConcur, medConcur, midProofStep, midProofWhy, pbConvReason, pbProofOrder, pbProofReason, twoThirdsStep } from './famC';

export type { TCItem, TCPicture } from './tkit';

export const GENERATORS: Record<string, Gen> = {
  segKind, midsegId, medianWhich, altitudeCase, bisectorMid, perpBisCheck, thirdMedian, centroidLines, pbEquiNum, pbEquiWhich,
  circumWhere, circumWhich, abEquiNum, abEquiWhich, inWhich, inRadius, orthoWhere, centerFig, centerMatch,
  midsegAngle, midsegParallel, midsegLen, medialPerim, midsegAlg, medianParts, medianLength, bisectAngle, bisectAlg, centroidPart,
  centroidAlg, chainAlt, chainBisAlt, chainExt, equiAlg, centerDist, pythIn, pythCirc, circNext, circRadius, inNext, inRadiusCons,
  mixedNum, enoughInfo,
  pbProofReason, pbProofOrder, pbConvReason, converseState, concurChain, abProofReason, abConvReason, inConcur, midProofStep,
  midProofWhy, twoThirdsStep, medConcur, critique, contextBrace, contextTowns,
};

export const FAMILY_NAMES: Record<string, string> = {
  segKind: 'Read the marks', midsegId: 'Is it a midsegment?', medianWhich: 'Find the median', altitudeCase: 'Where the altitude goes',
  bisectorMid: 'What a bisector gives', perpBisCheck: 'Perpendicular bisector or not', thirdMedian: 'The third median', centroidLines: 'The centroid',
  pbEquiNum: 'On the perpendicular bisector', pbEquiWhich: 'Which point is equidistant?', circumWhere: 'Where the circumcenter lies', circumWhich: 'Equidistant from what?',
  abEquiNum: 'On the angle bisector', abEquiWhich: 'Distance to a side', inWhich: 'The incenter', inRadius: 'The inscribed circle',
  orthoWhere: 'Where the orthocenter lies', centerFig: 'Which center?', centerMatch: 'Name the center',
  midsegAngle: 'Midsegment angles', midsegParallel: 'Parallel to which side?', midsegLen: 'Half the third side', medialPerim: 'The medial triangle',
  midsegAlg: 'Midsegment equations', medianParts: 'Median halves', medianLength: 'What a median does not tell', bisectAngle: 'Halves and wholes',
  bisectAlg: 'Bisector equations', centroidPart: 'The 2 : 1 split', centroidAlg: 'Centroid equations', chainAlt: 'Altitude angle chains',
  chainBisAlt: 'Altitude and bisector', chainExt: 'Bisector and exterior angle', equiAlg: 'Equidistance equations', centerDist: 'Center distances',
  pythIn: 'Incenter and Pythagoras', pythCirc: 'Circumcenter and Pythagoras', circNext: 'Build the circumscribed circle', circRadius: 'The circumscribed radius',
  inNext: 'Build the inscribed circle', inRadiusCons: 'The inscribed radius', mixedNum: 'Mixed: pick the theorem', enoughInfo: 'Enough information?',
  pbProofReason: 'Perpendicular bisector proof', pbProofOrder: 'Order the proof', pbConvReason: 'The converse proof', converseState: 'State the converse',
  concurChain: 'Why three bisectors meet', abProofReason: 'Angle bisector proof', abConvReason: 'Angle bisector converse', inConcur: 'Why the incenter exists',
  midProofStep: 'Midsegment proof', midProofWhy: 'What counts as proof', twoThirdsStep: 'The two-thirds proof', medConcur: 'Why medians meet',
  critique: 'Find the bad step', contextBrace: 'The truss brace', contextTowns: 'The water tower',
};
