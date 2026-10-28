// triProofs.ts: the reasons of this lesson and its bank of short triangle-congruence proofs (pure, no DOM).
// Every proof row has a statement (TeX), a reason, the rows it uses (an order is valid when every row comes after
// the rows it uses and the target is last) and, for decoys, the misconception a wrong line shows. The figures are the
// exact configs (configs.ts) with the givens marked; a pair that must be derived (a shared side, vertical angles,
// alternate interior angles, a definition) is left unmarked, as in a textbook.
import type { Fig } from '../geometry-foundations/geo';
import { type Config, bowtie, kite, overlapAngle, overlapBase, parZ, perp } from './configs';
import { type Crit, type FMark, type Part, type Tri, NAME_SETS, PERMS, buildFig, mapFig, names2, relabeler, tw, copyBeside, critOf, ov, pairFig, pairTex, permName, randTri, sideName } from './tri';

export const RS = {
  given: 'Given',
  refl: 'Reflexive Property of Congruence',
  vert: 'Vertical Angles Theorem',
  altInt: 'Alternate Interior Angles Theorem',
  defMid: 'Definition of midpoint',
  defBis: 'Definition of angle bisector',
  defPerp: 'Definition of perpendicular lines',
  SSS: 'SSS', SAS: 'SAS', ASA: 'ASA', AAS: 'AAS', HL: 'HL',
  cpctc: 'CPCTC',
} as const;
export type RKey = keyof typeof RS;
export const MC = {
  appearance: 'mc.geometric-proof.diagram-appearance-as-given',
  onlyMarked: 'mc.geometric-proof.only-marked-parts-count',
  circular: 'mc.geometric-proof.circular-reasoning',
  beforeEst: 'mc.geometric-proof.uses-fact-before-established',
  noHyp: 'mc.geometric-proof.cites-theorem-without-checking-hypotheses',
  noReason: 'mc.geometric-proof.step-without-reason',
  wrongPair: 'mc.angles.cites-wrong-pair-name',
  wrongPart: 'mc.geometric-proof.given-attached-to-wrong-part',
  midMis: 'mc.geometric-proof.midpoint-bisector-misdefined',
  ssa: 'mc.transformations.ssa-accepted-as-criterion',
  order: 'mc.transformations.congruence-criterion-order-has-no-geometric-meaning',
  aaa: 'mc.transformations.equal-angles-prove-congruence',
  misAAS: 'mc.transformations.misapplies-aas',
  aasNonCorr: 'mc.transformations.aas-with-noncorresponding-sides',
  hlMis: 'mc.transformations.hl-misapplied',
  hlLegHyp: 'mc.transformations.hl-pairs-leg-with-hypotenuse',
  validSSA: 'mc.transformations.valid-ssa-cases-rejected',
  flipped: 'mc.transformations.turned-or-flipped-copy-not-congruent',
  vertexOrder: 'mc.transformations.statement-vertex-order-ignored',
  byPosition: 'mc.transformations.matches-parts-by-position-or-letters',
  ignoreCorr: 'mc.transformations.part-equalities-ignore-correspondence',
  overlap: 'mc.geometric-proof.overlapping-triangle-parts-misidentified',
  examples: 'mc.reasoning-language.examples-as-proof',
  wholeFig: 'mc.geometric-proof.whole-figure-coincidence-asserted',
  cxPremise: 'mc.reasoning-language.counterexample-violates-premise',
  cxException: 'mc.reasoning-language.counterexample-as-exception',
  drawnCase: 'mc.geometric-proof.proof-covers-only-drawn-case',
  conclHyp: 'mc.geometric-proof.conclusion-added-to-hypotheses',
  wrongClause: 'mc.geometric-proof.wrong-clause-as-hypothesis',
  sketch: 'mc.geometric-proof.sketch-accepted-without-data-check',
  rightSpecial: 'mc.geometric-proof.special-case-right-angle-as-hypothesis',
  circlesMany: 'mc.circles.two-circles-many-intersections',
  circlesUnrel: 'mc.circles.circle-intersections-unrelated',
  bisArb: 'mc.angles.misdefines-angle-bisector',
  anyMid: 'mc.shapes.any-on-segment-point-is-midpoint',
  hypVisual: 'mc.right-triangles-trig.hypotenuse-from-visual-cues',
  reportsX: 'mc.linear-equations.reports-x-not-asked-quantity',
  wholeAsPart: 'mc.angles.reports-whole-as-missing-part',
  measureProof: 'mc.geometric-proof.procedure-or-measurement-as-proof',
  markWrongPart: 'mc.geometric-proof.diagram-marking-attached-to-wrong-part',
} as const;

export interface TRow { st: string; rs: RKey; uses: number[] }
export interface TDecoy { st: string; mc: string; why: string }
export interface TProof {
  id: ProofId;
  crit: Crit;
  given: string[]; prove: string;
  rows: TRow[];
  fig: Fig;
  decoys: TDecoy[];
  /** a CPCTC conclusion that follows once the proof is done: [statement TeX, a non-corresponding decoy TeX] */
  next: [string, string];
  /** the two triangles, letters in corresponding order */
  t1: string; t2: string;
}
export type ProofId = 'bowtieSAS' | 'bowtieASA' | 'kiteSSS' | 'kiteASA' | 'perpSAS' | 'parZSAS' | 'overlapSAS' | 'overlapSSS' | 'sep';
export const BANK: ProofId[] = ['bowtieSAS', 'bowtieASA', 'kiteSSS', 'kiteASA', 'perpSAS', 'parZSAS', 'overlapSAS', 'overlapSSS', 'sep'];
/** proofs with a hidden pair (a shared side, vertical or alternate interior angles, a definition) */
export const HIDDEN_BANK: ProofId[] = ['bowtieSAS', 'bowtieASA', 'kiteSSS', 'kiteASA', 'perpSAS', 'parZSAS', 'overlapSAS', 'overlapSSS'];

const fig = (c: Config, marks: FMark[], fills: string[]) => buildFig({ ...c, marks, fills: fills.map(p => ({ pts: p })) });
const T = (s: string) => `\\triangle ${s}`;
const cg = (a: string, b: string) => `${a} \\cong ${b}`;
const sg = (a: string, b: string) => cg(ov(a), ov(b));
const an = (a: string, b: string) => cg(`\\angle ${a}`, `\\angle ${b}`);

export function makeProof(id: ProofId, R: () => number): TProof {
  const roles: Partial<Record<ProofId, [string, string]>> = { bowtieSAS: ['ABCDE', ''], bowtieASA: ['ABCDE', ''], kiteSSS: ['ABCD', ''], kiteASA: ['ABCD', ''], perpSAS: ['ABCM', 'M'], parZSAS: ['ABCD', ''], overlapSAS: ['ABCDE', ''], overlapSSS: ['ABCD', ''] };
  const p = givensFromHeader(makeProof0(id, R)), ro = roles[id];
  if (!ro) return p;
  const t = relabeler(R, ro[0], ro[1]);
  return {
    ...p, given: p.given.map(t), prove: t(p.prove), t1: t(p.t1), t2: t(p.t2), next: [t(p.next[0]), t(p.next[1])],
    rows: p.rows.map(r => ({ ...r, st: t(r.st) })), decoys: p.decoys.map(d => ({ ...d, st: t(d.st), why: tw(d.why, t) })), fig: mapFig(p.fig, t),
  };
}
/** the lesson's one rule: a given is cited straight from the Given header. A row that only restates a given which is
 *  not itself a congruent pair (a midpoint, a bisector, parallel or perpendicular lines) is dropped, and the rows that
 *  used it now use nothing; given congruent pairs stay as rows (the criterion line cites them). */
function givensFromHeader(p: TProof): TProof {
  const drop = p.rows.map((r, i) => (r.rs === 'given' && !r.st.includes('cong') ? i + 1 : 0)).filter(Boolean);
  if (!drop.length) return p;
  const newNo = (n: number) => n - drop.filter(d => d < n).length;
  const rows = p.rows.flatMap((r, i) => (drop.includes(i + 1) ? [] : [{ ...r, uses: r.uses.filter(u => !drop.includes(u)).map(newNo) }]));
  return { ...p, rows };
}
function makeProof0(id: ProofId, R: () => number): TProof {
  switch (id) {
    case 'bowtieSAS': {
      const c = bowtie(R);
      return {
        id, crit: 'SAS', t1: 'AEB', t2: 'CED',
        fig: fig(c, [{ seg: 'AE', n: 1 }, { seg: 'EC', n: 1 }, { seg: 'BE', n: 2 }, { seg: 'ED', n: 2 }], ['AEB', 'CED']),
        given: [`E\\text{ is the midpoint of }${ov('AC')}\\text{ and }${ov('BD')}`], prove: cg(T('AEB'), T('CED')),
        rows: [
          { st: `E\\text{ is the midpoint of }${ov('AC')}`, rs: 'given', uses: [] },
          { st: sg('AE', 'CE'), rs: 'defMid', uses: [1] },
          { st: `E\\text{ is the midpoint of }${ov('BD')}`, rs: 'given', uses: [] },
          { st: sg('BE', 'DE'), rs: 'defMid', uses: [3] },
          { st: an('AEB', 'CED'), rs: 'vert', uses: [] },
          { st: cg(T('AEB'), T('CED')), rs: 'SAS', uses: [2, 4, 5] },
        ],
        decoys: [
          { st: an('A', 'C'), mc: MC.appearance, why: 'nothing marks or gives ∠A ≅ ∠C yet; looking equal is not a reason.' },
          { st: sg('AB', 'CD'), mc: MC.beforeEst, why: 'that follows only after the triangles are proved congruent (CPCTC).' },
        ],
        next: [sg('AB', 'CD'), sg('AB', 'DE')],
      };
    }
    case 'bowtieASA': {
      const c = bowtie(R);
      return {
        id, crit: 'ASA', t1: 'AEB', t2: 'CED',
        fig: fig(c, [{ seg: 'AB', par: 1 }, { seg: 'DC', par: 1 }, { seg: 'AE', n: 1 }, { seg: 'EC', n: 1 }], ['AEB', 'CED']),
        given: [`${ov('AB')} \\parallel ${ov('CD')}`, `E\\text{ is the midpoint of }${ov('AC')}`], prove: cg(T('AEB'), T('CED')),
        rows: [
          { st: `${ov('AB')} \\parallel ${ov('CD')}`, rs: 'given', uses: [] },
          { st: an('BAE', 'DCE'), rs: 'altInt', uses: [1] },
          // the midpoint given stays in the Given block (a long statement would squeeze the reason column)
          { st: sg('AE', 'CE'), rs: 'defMid', uses: [] },
          { st: an('AEB', 'CED'), rs: 'vert', uses: [] },
          { st: cg(T('AEB'), T('CED')), rs: 'ASA', uses: [2, 3, 4] },
        ],
        decoys: [
          { st: sg('BE', 'DE'), mc: MC.appearance, why: 'only AC has a midpoint in the givens; BE ≅ DE is not marked or given.' },
          { st: an('AEB', 'BAE'), mc: MC.wrongPair, why: 'those two angles are in the same triangle; nothing makes them congruent.' },
        ],
        next: [sg('BE', 'DE'), sg('BE', 'CE')],
      };
    }
    case 'kiteSSS': {
      const c = kite(R);
      return {
        id, crit: 'SSS', t1: 'ABD', t2: 'CBD',
        fig: fig(c, [{ seg: 'AB', n: 1 }, { seg: 'CB', n: 1 }, { seg: 'AD', n: 2 }, { seg: 'CD', n: 2 }], ['ABD', 'CBD']),
        given: [`${sg('AB', 'CB')},\\ ${sg('AD', 'CD')}`], prove: cg(T('ABD'), T('CBD')),
        rows: [
          { st: sg('AB', 'CB'), rs: 'given', uses: [] },
          { st: sg('AD', 'CD'), rs: 'given', uses: [] },
          { st: sg('BD', 'BD'), rs: 'refl', uses: [] },
          { st: cg(T('ABD'), T('CBD')), rs: 'SSS', uses: [1, 2, 3] },
        ],
        decoys: [
          { st: an('A', 'C'), mc: MC.beforeEst, why: '∠A ≅ ∠C follows only after the triangles are proved congruent.' },
          { st: sg('AB', 'AD'), mc: MC.appearance, why: 'AB and AD carry different marks; nothing says they are congruent.' },
        ],
        next: [an('BAD', 'BCD'), an('BAD', 'CBD')],
      };
    }
    case 'kiteASA': {
      const c = kite(R);
      return {
        id, crit: 'ASA', t1: 'ABD', t2: 'CBD',
        fig: fig(c, [{ ang: 'ABD', n: 1 }, { ang: 'CBD', n: 1 }, { ang: 'ADB', n: 2 }, { ang: 'CDB', n: 2 }], ['ABD', 'CBD']),
        given: [`${ov('BD')}\\text{ bisects }\\angle ABC\\text{ and }\\angle ADC`], prove: cg(T('ABD'), T('CBD')),
        rows: [
          { st: `${ov('BD')}\\text{ bisects }\\angle ABC`, rs: 'given', uses: [] },
          { st: an('ABD', 'CBD'), rs: 'defBis', uses: [1] },
          { st: `${ov('BD')}\\text{ bisects }\\angle ADC`, rs: 'given', uses: [] },
          { st: an('ADB', 'CDB'), rs: 'defBis', uses: [3] },
          { st: sg('BD', 'BD'), rs: 'refl', uses: [] },
          { st: cg(T('ABD'), T('CBD')), rs: 'ASA', uses: [2, 4, 5] },
        ],
        decoys: [
          { st: sg('AB', 'CB'), mc: MC.beforeEst, why: 'AB ≅ CB follows only after the triangles are proved congruent (CPCTC).' },
          { st: an('ABD', 'ADB'), mc: MC.wrongPart, why: 'a bisector splits one angle into two congruent parts: ∠ABD with ∠CBD, not with an angle at D.' },
        ],
        next: [sg('AB', 'CB'), sg('AB', 'CD')],
      };
    }
    case 'perpSAS': {
      const c = perp(R);
      return {
        id, crit: 'SAS', t1: 'AMC', t2: 'BMC',
        fig: fig(c, [{ ang: 'AMC', box: true }, { ang: 'BMC', box: true }, { seg: 'AM', n: 1 }, { seg: 'MB', n: 1 }], ['AMC', 'BMC']),
        given: [`${ov('CM')} \\perp ${ov('AB')}`, `M\\text{ is the midpoint of }${ov('AB')}`], prove: cg(T('AMC'), T('BMC')),
        rows: [
          { st: `${ov('CM')} \\perp ${ov('AB')}`, rs: 'given', uses: [] },
          { st: an('AMC', 'BMC'), rs: 'defPerp', uses: [1] },
          { st: `M\\text{ is the midpoint of }${ov('AB')}`, rs: 'given', uses: [] },
          { st: sg('AM', 'BM'), rs: 'defMid', uses: [3] },
          { st: sg('CM', 'CM'), rs: 'refl', uses: [] },
          { st: cg(T('AMC'), T('BMC')), rs: 'SAS', uses: [2, 4, 5] },
        ],
        decoys: [
          { st: sg('AC', 'BC'), mc: MC.beforeEst, why: 'AC ≅ BC follows only after the triangles are proved congruent (CPCTC).' },
          { st: sg('CM', 'AM'), mc: MC.wrongPart, why: 'the midpoint splits AB into AM and MB; it says nothing about CM.' },
        ],
        next: [sg('AC', 'BC'), sg('AC', 'CM')],
      };
    }
    case 'parZSAS': {
      const c = parZ(R);
      return {
        id, crit: 'SAS', t1: 'BAC', t2: 'DCA',
        fig: fig(c, [{ seg: 'AB', par: 1 }, { seg: 'DC', par: 1 }, { seg: 'AB', n: 1 }, { seg: 'DC', n: 1 }], ['ABC', 'CDA']),
        given: [`${ov('AB')} \\parallel ${ov('DC')},\\ ${sg('AB', 'CD')}`], prove: cg(T('BAC'), T('DCA')),
        rows: [
          { st: `${ov('AB')} \\parallel ${ov('DC')}`, rs: 'given', uses: [] },
          { st: an('BAC', 'DCA'), rs: 'altInt', uses: [1] },
          { st: sg('AB', 'CD'), rs: 'given', uses: [] },
          { st: sg('AC', 'CA'), rs: 'refl', uses: [] },
          { st: cg(T('BAC'), T('DCA')), rs: 'SAS', uses: [2, 3, 4] },
        ],
        decoys: [
          { st: an('B', 'D'), mc: MC.appearance, why: '∠B ≅ ∠D is not marked or given; it follows only after the proof (CPCTC).' },
          { st: an('BAC', 'BCA'), mc: MC.wrongPair, why: 'those angles are not alternate interior angles for AB ∥ DC.' },
        ],
        next: [sg('BC', 'DA'), sg('BC', 'DC')],
      };
    }
    case 'overlapSAS': {
      const c = overlapAngle(R);
      return {
        id, crit: 'SAS', t1: 'ABE', t2: 'ACD',
        fig: fig(c, [{ seg: 'AD', n: 1 }, { seg: 'AE', n: 1 }], ['ABE', 'ACD']),
        given: [`${sg('AB', 'AC')},\\ ${sg('AE', 'AD')}`], prove: cg(T('ABE'), T('ACD')),
        rows: [
          { st: sg('AB', 'AC'), rs: 'given', uses: [] },
          { st: an('A', 'A'), rs: 'refl', uses: [] },
          { st: sg('AE', 'AD'), rs: 'given', uses: [] },
          { st: cg(T('ABE'), T('ACD')), rs: 'SAS', uses: [1, 2, 3] },
        ],
        decoys: [
          { st: sg('BE', 'CD'), mc: MC.beforeEst, why: 'BE ≅ CD follows only after the triangles are proved congruent (CPCTC).' },
          { st: sg('AD', 'DB'), mc: MC.appearance, why: 'nothing marks or gives AD ≅ DB; D only looks halfway.' },
        ],
        next: [sg('BE', 'CD'), sg('BE', 'AD')],
      };
    }
    case 'overlapSSS': {
      const c = overlapBase(R);
      return {
        id, crit: 'SSS', t1: 'ABC', t2: 'DCB',
        fig: fig(c, [{ seg: 'AB', n: 1 }, { seg: 'DC', n: 1 }, { seg: 'AC', n: 2 }, { seg: 'DB', n: 2 }], ['ABC', 'DCB']),
        given: [`${sg('AB', 'DC')},\\ ${sg('AC', 'DB')}`], prove: cg(T('ABC'), T('DCB')),
        rows: [
          { st: sg('AB', 'DC'), rs: 'given', uses: [] },
          { st: sg('AC', 'DB'), rs: 'given', uses: [] },
          { st: sg('BC', 'CB'), rs: 'refl', uses: [] },
          { st: cg(T('ABC'), T('DCB')), rs: 'SSS', uses: [1, 2, 3] },
        ],
        decoys: [
          { st: an('BAC', 'CDB'), mc: MC.beforeEst, why: 'that pair follows only after the triangles are proved congruent (CPCTC).' },
          { st: sg('AB', 'AC'), mc: MC.appearance, why: 'AB and AC carry different marks; nothing says they are congruent.' },
        ],
        next: [an('ABC', 'DCB'), an('ABC', 'DBC')],
      };
    }
    case 'sep': {
      // two separate triangles, all three pairs given (a 3-step proof)
      const [L1, L2] = names2(R);
      const perm = PERMS[Math.floor(R() * PERMS.length)]!;
      const n1 = L1, n2 = permName(L2, perm);
      const crit = (['SSS', 'SAS', 'ASA', 'AAS'] as Crit[])[Math.floor(R() * 4)]!;
      const parts = partsFor(crit, R);
      const T1 = randTri(R, { base: 300 });
      const { T2 } = copyBeside(R, T1, 'col');
      let nS = 0, nA = 0;
      const marks = parts.map(p => ({ k: p.k, i: p.i, n: p.k === 's' ? ++nS : ++nA }));
      const rows: TRow[] = parts.map(p => ({ st: pairTex(n1, n2, p), rs: 'given' as RKey, uses: [] }));
      rows.push({ st: cg(T(n1), T(n2)), rs: crit as RKey, uses: [1, 2, 3] });
      const free = [0, 1, 2].map(i => ({ k: 's' as const, i })).find(p => !parts.some(q => q.k === 's' && q.i === p.i)) ?? { k: 'a' as const, i: [0, 1, 2].find(i => !parts.some(q => q.k === 'a' && q.i === i))! };
      const wrongI = (free.i + 1) % 3;
      return {
        id, crit, t1: n1, t2: n2,
        fig: pairFig(T1, T2, n1, n2, marks),
        given: [parts.map(p => pairTex(n1, n2, p)).join(',\\ ')], prove: cg(T(n1), T(n2)),
        rows,
        decoys: [
          { st: pairTex(n1, n2, free), mc: MC.beforeEst, why: 'that pair is not marked; it follows only after the triangles are proved congruent.' },
          { st: cg(T(n1), T(permName(n2, [1, 0, 2]))), mc: MC.vertexOrder, why: 'that statement pairs the vertices in the wrong order.' },
        ],
        next: [pairTex(n1, n2, free), free.k === 's' ? sg(sideName(n1, free.i), sideName(n2, wrongI)) : an(n1[free.i]!, n2[wrongI]!)],
      };
    }
  }
}
/** three parts that make a criterion (index-wise; scattered over the triangle) */
export function partsFor(c: Crit, R: () => number): Part[] {
  const k = Math.floor(R() * 3), a = (k + 1) % 3, b = (k + 2) % 3;
  switch (c) {
    case 'SSS': return [{ k: 's', i: 0 }, { k: 's', i: 1 }, { k: 's', i: 2 }];
    case 'SAS': return [{ k: 's', i: a }, { k: 'a', i: k }, { k: 's', i: b }];
    case 'ASA': return [{ k: 'a', i: a }, { k: 's', i: k }, { k: 'a', i: b }];
    case 'AAS': { const s = R() < 0.5 ? a : b; return [{ k: 'a', i: a }, { k: 'a', i: b }, { k: 's', i: s }]; }
    case 'HL': return [{ k: 'a', i: k, right: true }, { k: 's', i: k }, { k: 's', i: a }];
    default: return R() < 0.5 ? [{ k: 'a', i: 0 }, { k: 'a', i: 1 }, { k: 'a', i: 2 }] : [{ k: 'a', i: k }, { k: 's', i: k }, { k: 's', i: a }];
  }
}
/** a row order is valid when every row comes after the rows it uses and the target is last */
export function validOrder(p: { rows: TRow[] }, order: number[]): boolean {
  if (order.length !== p.rows.length || new Set(order).size !== order.length) return false;
  const pos = new Map(order.map((r, i) => [r, i]));
  return p.rows.every((row, i) => row.uses.every(u => (pos.get(u) ?? 99) < (pos.get(i + 1) ?? -1))) && order[order.length - 1] === p.rows.length;
}
export { critOf };
export type { Tri };
