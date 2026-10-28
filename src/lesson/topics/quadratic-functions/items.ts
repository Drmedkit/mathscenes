// items.ts: the exercise families of "Quadratic functions and their graphs"
// (secondary-t6-11-quadratic-functions-graphing-and-key-features), generated from templates, checked exactly, every
// typical wrong answer classified against the misconception catalogue. The families live in fam1.ts (sub-goals 1-11),
// fam2.ts (12-22) and fam3.ts (23-33); builders, picture data and misconception ids in common.ts. Pure: no DOM.
import type { Gen } from './common';
import * as F1 from './fam1';
import * as F2 from './fam2';
import * as F3 from './fam3';

export { MC, type QItem, type GPic, type GItem } from './common';
export const FAMILIES: readonly { id: string; name: string; gen: Gen }[] = [
  { id: 'tableY', name: 'Fill in the table', gen: F1.tableY },
  { id: 'linVsQuad', name: 'Line or parabola?', gen: F1.linVsQuad },
  { id: 'vertexRead', name: 'Read the vertex', gen: F1.vertexRead },
  { id: 'extremeVal', name: 'Maximum or minimum', gen: F1.extremeVal },
  { id: 'axisRead', name: 'The axis of symmetry', gen: F1.axisRead },
  { id: 'axisTable', name: 'The axis from a table', gen: F1.axisTable },
  { id: 'zeroCount', name: 'How many zeros?', gen: F1.zeroCount },
  { id: 'zerosRead', name: 'Read the zeros', gen: F1.zerosRead },
  { id: 'mirrorPt', name: 'The mirror point', gen: F1.mirrorPt },
  { id: 'axisMid', name: 'Halfway between the zeros', gen: F1.axisMid },
  { id: 'vfVertex', name: 'Vertex form: the vertex', gen: F1.vfVertex },
  { id: 'openDir', name: 'Up or down?', gen: F1.openDir },
  { id: 'offsetY', name: 'Steps from the vertex', gen: F1.offsetY },
  { id: 'narrowest', name: 'Narrow or wide', gen: F1.narrowest },
  { id: 'transformName', name: 'Name the move', gen: F1.transformName },
  { id: 'mapPoint', name: 'Where does the point go?', gen: F1.mapPoint },
  { id: 'fbxPoint', name: 'Squeeze sideways', gen: F1.fbxPoint },
  { id: 'fbxSame', name: 'f(bx) as a stretch', gen: F1.fbxSame },
  { id: 'countZeros', name: 'Zeros from the vertex', gen: F1.countZeros },
  { id: 'sqrtZeros', name: 'Zeros by square roots', gen: F2.sqrtZeros },
  { id: 'sqrtExact', name: 'Exact zeros', gen: F2.sqrtExact },
  { id: 'facZeros', name: 'Zeros from factors', gen: F2.facZeros },
  { id: 'facRepeat', name: 'Repeated and x factors', gen: F2.facRepeat },
  { id: 'facVertex', name: 'Vertex from factored form', gen: F2.facVertex },
  { id: 'yInt', name: 'The y-intercept', gen: F2.yInt },
  { id: 'cMeaning', name: 'What c tells you', gen: F2.cMeaning },
  { id: 'stdAxis', name: 'Axis from standard form', gen: F2.stdAxis },
  { id: 'stdPair', name: 'The mirror of the y-intercept', gen: F2.stdPair },
  { id: 'techWindow', name: 'Choose a window', gen: F2.techWindow },
  { id: 'techTrace', name: 'Trust the trace', gen: F2.techTrace },
  { id: 'whichGraph', name: 'Which graph?', gen: F2.whichGraph },
  { id: 'hiddenZero', name: 'Off the screen', gen: F2.hiddenZero },
  { id: 'rangeOf', name: 'Domain and range', gen: F2.rangeOf },
  { id: 'riseFall', name: 'Rising or falling', gen: F2.riseFall },
  { id: 'incInterval', name: 'Where it increases', gen: F2.incInterval },
  { id: 'posNeg', name: 'Positive or negative', gen: F2.posNeg },
  { id: 'expandVF', name: 'Same function, standard form', gen: F3.expandVF },
  { id: 'proofOrCheck', name: 'Checks or proof?', gen: F3.proofOrCheck },
  { id: 'findA', name: 'Find a from a point', gen: F3.findA },
  { id: 'findACtx', name: 'Arches, balls and profits', gen: F3.findACtx },
  { id: 'zerosToA', name: 'From zeros to a', gen: F3.zerosToA },
  { id: 'zerosToForm', name: 'Build it from its zeros', gen: F3.zerosToForm },
  { id: 'factorZeros', name: 'Factor to find the zeros', gen: F3.factorZeros },
  { id: 'methodPick', name: 'Factor or not?', gen: F3.methodPick },
  { id: 'csVertexForm', name: 'Complete the square', gen: F3.csVertexForm },
  { id: 'csMin', name: 'The extreme value', gen: F3.csMin },
  { id: 'chooseForm', name: 'The form that shows it', gen: F3.chooseForm },
  { id: 'bestFormValue', name: 'Read it from the best form', gen: F3.bestFormValue },
  { id: 'zeroProd', name: 'Why the factors give the zeros', gen: F3.zeroProd },
  { id: 'boundWhy', name: 'Why the vertex is extreme', gen: F3.boundWhy },
  { id: 'symProof', name: 'Why it is symmetric', gen: F3.symProof },
  { id: 'projectile', name: 'Up and down again', gen: F3.projectile },
  { id: 'penMax', name: 'The biggest pen', gen: F3.penMax },
  { id: 'compareMax', name: 'Which goes higher?', gen: F3.compareMax },
];
export const GENERATORS: Record<string, Gen> = Object.fromEntries(FAMILIES.map(f => [f.id, f.gen]));
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));
