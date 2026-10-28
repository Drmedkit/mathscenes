// proofs.ts: the course's starting facts (reason names and their types) and the bank of short proofs the lesson and
// its practice use. Pure: no DOM. Every proof row has a statement (TeX), a reason, the type of that reason, the rows
// it uses (so an order can be checked: a row may only use rows above it), and the other reasons that would ALSO be
// valid for it (never offered as a wrong choice). Letters and figures are chosen per item, so the same proof comes
// with different names and drawings.
import { type Fig, type GAngle, type GSeg, type GPoint, type Pt, add, at, dirv, mul, norm } from './geo';
import { LETTERS as LETTERS2, crossing, fan, letters, mark, onLine, transversal } from './figs';

// ---------- the reasons of the course ----------
export const RS = {
  given: 'Given',
  defMid: 'Definition of midpoint',
  defBis: 'Definition of angle bisector',
  defPerp: 'Definition of perpendicular lines',
  defCongSeg: 'Definition of congruent segments',
  defCongAng: 'Definition of congruent angles',
  defSupp: 'Definition of supplementary angles',
  defComp: 'Definition of complementary angles',
  segAdd: 'Segment Addition Postulate',
  angAdd: 'Angle Addition Postulate',
  linPair: 'Linear Pair Postulate',
  corr: 'Corresponding Angles Postulate',
  vert: 'Vertical Angles Theorem',
  congSupp: 'Congruent Supplements Theorem',
  altInt: 'Alternate Interior Angles Theorem',
  altExt: 'Alternate Exterior Angles Theorem',
  consInt: 'Consecutive Interior Angles Theorem',
  refl: 'Reflexive Property of Equality',
  sym: 'Symmetric Property of Equality',
  trans: 'Transitive Property of Equality',
  subst: 'Substitution Property of Equality',
  addP: 'Addition Property of Equality',
  subP: 'Subtraction Property of Equality',
} as const;
export type ReasonKey = keyof typeof RS;
export type ReasonType = 'given' | 'definition' | 'postulate' | 'theorem' | 'property';
export const TYPE_OF: Record<ReasonKey, ReasonType> = {
  given: 'given', defMid: 'definition', defBis: 'definition', defPerp: 'definition', defCongSeg: 'definition', defCongAng: 'definition', defSupp: 'definition', defComp: 'definition',
  segAdd: 'postulate', angAdd: 'postulate', linPair: 'postulate', corr: 'postulate',
  vert: 'theorem', congSupp: 'theorem', altInt: 'theorem', altExt: 'theorem', consInt: 'theorem',
  refl: 'property', sym: 'property', trans: 'property', subst: 'property', addP: 'property', subP: 'property',
};
export const TYPE_WORD: Record<ReasonType, string> = { given: 'A given', definition: 'A definition', postulate: 'A postulate', theorem: 'An earlier theorem', property: 'A property of equality' };

// ---------- notation: board TeX -> panel text (a real overline that survives plain text) ----------
export function htm(t: string): string {
  return t
    .replace(/\\overline\{([^}]*)\}/g, (_, s: string) => [...s].map(ch => ch + '̅').join(''))
    .replace(/\\overrightarrow\{([^}]*)\}/g, (_, s: string) => `ray ${s}`)
    .replace(/\\overleftrightarrow\{([^}]*)\}/g, (_, s: string) => `line ${s}`)
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/m\\angle\s*/g, 'm∠').replace(/\\angle\s*/g, '∠')
    .replace(/\^\\circ/g, '°').replace(/\\cong/g, '≅').replace(/\\parallel/g, '∥').replace(/\\perp/g, '⊥').replace(/\\ell/g, 'ℓ').replace(/\\ne\b/g, '≠')
    .replace(/\\cdot/g, '·').replace(/\\[,;: ]/g, ' ').replace(/\\quad/g, ' ').replace(/[{}]/g, '')
    .replace(/(^|[\s(=+])-(?=[\d\sx(])/g, '$1−')
    .replace(/\s+/g, ' ').trim();
}
/** an expression for the panel: (3x + 4)° etc. */
export const exprHtm = (s: string) => s.replace(/-/g, '−');

// ---------- proofs ----------
export interface Row { st: string; rs: ReasonKey; uses: number[]; also?: ReasonKey[] }
export interface Decoy { st: string; rs: string; mc: string; why: string }
export interface Proof {
  id: string;
  /** given lines (TeX), prove (TeX) */
  given: string[]; prove: string;
  rows: Row[];
  /** the theorem this proof establishes (citing it inside is circular) */
  theorem?: ReasonKey;
  fig: Fig;
  /** decoy lines for Parsons */
  decoys: Decoy[];
  /** the givens in words (for the panel) */
  givenHtml: string;
  proveHtml: string;
}
const ov = (s: string) => `\\overline{${s}}`;
const MCX = {
  appearance: 'mc.geometric-proof.diagram-appearance-as-given',
  circular: 'mc.geometric-proof.circular-reasoning',
  wrongPair: 'mc.angles.cites-wrong-pair-name',
  noHyp: 'mc.geometric-proof.cites-theorem-without-checking-hypotheses',
  suppEqual: 'mc.angles.supplementary-pair-set-equal',
} as const;

export type ProofId = 'segOverlap' | 'segBack' | 'midTrans' | 'midDouble' | 'bisDouble' | 'vertical' | 'congSupp' | 'congComp' | 'altInt' | 'altExt' | 'consInt';
export const SEG_PROOFS: ProofId[] = ['segOverlap', 'segBack', 'midTrans', 'midDouble'];
export const ANGLE_PROOFS: ProofId[] = ['bisDouble', 'vertical', 'congSupp', 'congComp'];
export const PAR_PROOFS: ProofId[] = ['altInt', 'altExt', 'consInt'];

export function makeProof(id: ProofId, R: () => number): Proof {
  const r = (lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
  switch (id) {
    case 'segOverlap': case 'segBack': {
      const [A, B, C, D] = letters(R, 4) as [string, string, string, string];
      const a = r(150, 200), b = r(110, 170);
      const back = id === 'segBack';
      const fig = onLine([A, B, C, D], [0, a, a + b, 2 * a + b], { kind: 'line', ticks: back ? [1, undefined, 1] : undefined, deg: r(-8, 8) });
      const order = `${A}, ${B}, ${C}, ${D}\\text{ in order on a line}`;
      if (!back) return {
        id, fig, given: [order, `${A}${C} = ${B}${D}`], prove: `${A}${B} = ${C}${D}`,
        givenHtml: `${A}, ${B}, ${C}, ${D} lie on a line in that order, and ${A}${C} = ${B}${D}`, proveHtml: `${A}${B} = ${C}${D}`,
        rows: [
          { st: `${A}${C} = ${B}${D}`, rs: 'given', uses: [] },
          { st: `${A}${C} = ${A}${B} + ${B}${C}`, rs: 'segAdd', uses: [] },
          { st: `${B}${D} = ${B}${C} + ${C}${D}`, rs: 'segAdd', uses: [] },
          { st: `${A}${B} + ${B}${C} = ${B}${C} + ${C}${D}`, rs: 'subst', uses: [1, 2, 3], also: ['trans'] },
          { st: `${A}${B} = ${C}${D}`, rs: 'subP', uses: [4] },
        ],
        decoys: [
          { st: `${A}${B} = ${C}${D}`, rs: 'It looks that way', mc: MCX.appearance, why: 'The drawing only shows the order of the points, not lengths.' },
          { st: `${A}${B} = ${B}${C}`, rs: RS.defMid, mc: MCX.noHyp, why: `Nothing says ${B} is a midpoint.` },
        ],
      };
      return {
        id, fig, given: [order, `${A}${B} = ${C}${D}`], prove: `${A}${C} = ${B}${D}`,
        givenHtml: `${A}, ${B}, ${C}, ${D} lie on a line in that order, and ${A}${B} = ${C}${D}`, proveHtml: `${A}${C} = ${B}${D}`,
        rows: [
          { st: `${A}${B} = ${C}${D}`, rs: 'given', uses: [] },
          { st: `${A}${B} + ${B}${C} = ${C}${D} + ${B}${C}`, rs: 'addP', uses: [1] },
          { st: `${A}${C} = ${A}${B} + ${B}${C}`, rs: 'segAdd', uses: [] },
          { st: `${B}${D} = ${B}${C} + ${C}${D}`, rs: 'segAdd', uses: [] },
          { st: `${A}${C} = ${B}${D}`, rs: 'subst', uses: [2, 3, 4], also: ['trans'] },
        ],
        decoys: [
          { st: `${A}${C} = ${B}${D}`, rs: 'It looks that way', mc: MCX.appearance, why: 'Looks are not a reason.' },
          { st: `${A}${B} + ${B}${C} = ${C}${D}`, rs: RS.addP, mc: 'mc.linear-equations.one-side-only', why: `${B}${C} has to be added to both sides.` },
        ],
      };
    }
    case 'midTrans': case 'midDouble': {
      const L0 = letters(R, 5).filter(x => x !== 'M');
      const [A, M, B] = [L0[0]!, 'M', L0[L0.length - 1]!];
      const a = r(170, 230);
      const two = id === 'midDouble';
      const L1 = onLine([A, M, B], [0, a, 2 * a], { ticks: [1, 1] });
      let fig = L1;
      let C = '', D = '';
      if (!two) {
        const pool = LETTERS2.filter(x => ![A, M, B].includes(x));
        const i0 = Math.floor(R() * (pool.length - 1));
        [C, D] = [pool[i0]!, pool[i0 + 1]!];
        const shift: Pt = [-a / 2, -190];
        const seg: GSeg = { id: 'cd', a: shift, b: add(shift, [a, 0]), ticks: 1 };
        fig = { ...L1, segs: [...L1.segs.map(s => ({ ...s, a: add(s.a, [0, 40]), b: add(s.b, [0, 40]) })), seg], points: [...L1.points.map(p => ({ ...p, at: add(p.at, [0, 40]) })), { at: seg.a, name: C, dir: 270 }, { at: seg.b, name: D, dir: 270 }] };
      }
      const midT = `${M}\\text{ is the midpoint of }${ov(A + B)}`;
      if (two) return {
        id, fig, given: [midT], prove: `${A}${M} + ${A}${M} = ${A}${B}`, givenHtml: `${M} is the midpoint of ${htm(ov(A + B))}`, proveHtml: `${A}${M} + ${A}${M} = ${A}${B}`,
        rows: [
          { st: midT, rs: 'given', uses: [] },
          { st: `${A}${M} = ${M}${B}`, rs: 'defMid', uses: [1] },
          { st: `${A}${M} + ${M}${B} = ${A}${B}`, rs: 'segAdd', uses: [] },
          { st: `${A}${M} + ${A}${M} = ${A}${B}`, rs: 'subst', uses: [2, 3] },
        ],
        decoys: [
          { st: `${A}${M} = ${M}${B}`, rs: 'It looks that way', mc: MCX.appearance, why: 'The tick marks and the given say it, not the look.' },
          { st: `${A}${M} = ${A}${B}`, rs: RS.defMid, mc: MCX.noHyp, why: 'A midpoint makes the two halves equal, not a half and the whole.' },
        ],
      };
      return {
        id, fig, given: [midT, `${A}${M} = ${C}${D}`], prove: `${M}${B} = ${C}${D}`, givenHtml: `${M} is the midpoint of ${htm(ov(A + B))}, and ${A}${M} = ${C}${D}`, proveHtml: `${M}${B} = ${C}${D}`,
        rows: [
          { st: midT, rs: 'given', uses: [] },
          { st: `${A}${M} = ${M}${B}`, rs: 'defMid', uses: [1] },
          { st: `${A}${M} = ${C}${D}`, rs: 'given', uses: [] },
          { st: `${M}${B} = ${A}${M}`, rs: 'sym', uses: [2] },
          { st: `${M}${B} = ${C}${D}`, rs: 'trans', uses: [3, 4], also: ['subst'] },
        ],
        decoys: [
          { st: `${M}${B} = ${C}${D}`, rs: 'It looks that way', mc: MCX.appearance, why: 'Looks are not a reason.' },
          { st: `${C}${D} = ${A}${B}`, rs: RS.trans, mc: MCX.noHyp, why: `Nothing says ${C}${D} equals the whole of ${A}${B}.` },
        ],
      };
    }
    case 'bisDouble': {
      const [A, B, C, D] = letters(R, 4) as [string, string, string, string];
      const h = r(30, 40), a0 = r(-10, 20);
      const F = fan(B, [{ name: A, deg: a0 }, { name: D, deg: a0 + h }, { name: C, deg: a0 + 2 * h }]);
      F.fig.angles = [mark('x', F.end, B, A, D, { text: '1', col: 'second', r: 80 }), mark('y', F.end, B, D, C, { text: '2', col: 'second', r: 80 })];
      const bis = `\\overrightarrow{${B}${D}}\\text{ bisects }\\angle ${A}${B}${C}`;
      const W = `m\\angle ${A}${B}${C}`;
      return {
        id, fig: F.fig, given: [bis], prove: `m\\angle 1 + m\\angle 1 = ${W}`,
        givenHtml: htm(bis), proveHtml: htm(`m\\angle 1 + m\\angle 1 = ${W}`),
        rows: [
          { st: bis, rs: 'given', uses: [] },
          { st: 'm\\angle 1 = m\\angle 2', rs: 'defBis', uses: [1] },
          { st: `m\\angle 1 + m\\angle 2 = ${W}`, rs: 'angAdd', uses: [] },
          { st: `m\\angle 1 + m\\angle 1 = ${W}`, rs: 'subst', uses: [2, 3] },
        ],
        decoys: [
          { st: 'm\\angle 1 = m\\angle 2', rs: 'It looks that way', mc: MCX.appearance, why: 'The arcs and the given say it, not the look.' },
          { st: `m\\angle 1 = ${W}`, rs: RS.defBis, mc: MCX.noHyp, why: 'A bisector makes the two parts equal, not a part and the whole.' },
        ],
      };
    }
    case 'vertical': {
      const th = R() < 0.5 ? r(52, 72) : r(108, 128), turn = r(-12, 12);
      const X = crossing(th, turn, ['A', 'B', 'C', 'D', 'E']);
      const fig: Fig = { ...X.fig, points: [] };
      fig.angles = fig.angles.filter(a => a.id !== 'a4');
      return {
        id, fig, theorem: 'vert', given: ['\\angle 1, \\angle 2\\text{ form a linear pair}', '\\angle 2, \\angle 3\\text{ form a linear pair}'], prove: 'm\\angle 1 = m\\angle 3',
        givenHtml: '∠1 and ∠2 form a linear pair, and ∠2 and ∠3 form a linear pair', proveHtml: 'm∠1 = m∠3',
        rows: [
          { st: 'm\\angle 1 + m\\angle 2 = 180^\\circ', rs: 'linPair', uses: [] },
          { st: 'm\\angle 2 + m\\angle 3 = 180^\\circ', rs: 'linPair', uses: [] },
          { st: 'm\\angle 1 + m\\angle 2 = m\\angle 2 + m\\angle 3', rs: 'subst', uses: [1, 2], also: ['trans'] },
          { st: 'm\\angle 1 = m\\angle 3', rs: 'subP', uses: [3] },
        ],
        decoys: [
          { st: 'm\\angle 1 = m\\angle 3', rs: RS.vert, mc: MCX.circular, why: 'That is the theorem being proved: it cannot be its own reason.' },
          { st: 'm\\angle 1 = m\\angle 2', rs: RS.linPair, mc: MCX.suppEqual, why: 'A linear pair adds to 180°; it is not equal.' },
        ],
      };
    }
    case 'congSupp': case 'congComp': {
      const comp = id === 'congComp', tot = comp ? 90 : 180;
      const a = comp ? r(28, 62) : r(40, 140);
      const one = (n: number, m: number, o: Pt, d0: number): { segs: GSeg[]; angles: GAngle[] } => {
        const p = at(o, d0, 210), q = at(o, d0 + m, 210);
        return { segs: [{ id: 'r' + n + 'a', a: o, b: p, kind: 'ray' }, { id: 'r' + n + 'b', a: o, b: q, kind: 'ray' }], angles: [{ id: 'a' + n, v: o, p, q, text: String(n), nameOnly: true }] };
      };
      const d1 = r(0, 20), d3 = r(0, 20), d2 = r(-10, 10);
      const parts = [one(1, a, [-330, 120], d1), one(3, a, [150, 120], d3), one(2, tot - a, [comp ? -120 : -60, -240], d2)];
      const fig: Fig = { segs: parts.flatMap(p => p.segs), angles: parts.flatMap(p => p.angles), points: [], pad: 70 };
      const w = comp ? 'complementary' : 'supplementary', dk: ReasonKey = comp ? 'defComp' : 'defSupp';
      return {
        id, fig, theorem: comp ? undefined : 'congSupp', given: [`\\angle 1, \\angle 2\\text{ are ${w}}`, `\\angle 3, \\angle 2\\text{ are ${w}}`], prove: '\\angle 1 \\cong \\angle 3',
        givenHtml: `∠1 and ∠2 are ${w}, and ∠3 and ∠2 are ${w}`, proveHtml: '∠1 ≅ ∠3',
        rows: [
          { st: `m\\angle 1 + m\\angle 2 = ${tot}^\\circ`, rs: dk, uses: [] },
          { st: `m\\angle 3 + m\\angle 2 = ${tot}^\\circ`, rs: dk, uses: [] },
          { st: 'm\\angle 1 + m\\angle 2 = m\\angle 3 + m\\angle 2', rs: 'subst', uses: [1, 2], also: ['trans'] },
          { st: 'm\\angle 1 = m\\angle 3', rs: 'subP', uses: [3] },
          { st: '\\angle 1 \\cong \\angle 3', rs: 'defCongAng', uses: [4] },
        ],
        decoys: [
          { st: '\\angle 1 \\cong \\angle 3', rs: 'It looks that way', mc: MCX.appearance, why: 'Looks are not a reason.' },
          { st: `m\\angle 1 + m\\angle 3 = ${tot}^\\circ`, rs: RS[dk], mc: MCX.noHyp, why: `Nothing says ∠1 and ∠3 are ${w}.` },
        ],
      };
    }
    case 'altInt': case 'altExt': case 'consInt': {
      const th = R() < 0.5 ? r(52, 70) : r(110, 128);
      const v = R() < 0.5 ? 0 : 1;
      const fig = transversal({ theta: th, marks: true, turn: r(-6, 6), W: 290 });
      const P = (a: number) => `m\\angle ${a}`;
      // [corresponding pair (x = y), vertical / linear step, target]
      const spec = id === 'altInt'
        ? (v ? { c: [2, 6], k: [3, 2], t: [3, 6], th: 'altInt' as ReasonKey } : { c: [1, 5], k: [4, 1], t: [4, 5], th: 'altInt' as ReasonKey })
        : id === 'altExt'
          ? (v ? { c: [1, 5], k: [5, 8], t: [1, 8], th: 'altExt' as ReasonKey } : { c: [2, 6], k: [6, 7], t: [2, 7], th: 'altExt' as ReasonKey })
          : (v ? { c: [1, 5], k: [1, 3], t: [5, 3], th: 'consInt' as ReasonKey } : { c: [2, 6], k: [2, 4], t: [6, 4], th: 'consInt' as ReasonKey });
      const g = '\\ell \\parallel m';
      const cons = id === 'consInt';
      const stK = cons ? `${P(spec.k[0]!)} + ${P(spec.k[1]!)} = 180^\\circ` : `${P(spec.k[0]!)} = ${P(spec.k[1]!)}`;
      const stT = cons ? `${P(spec.t[0]!)} + ${P(spec.t[1]!)} = 180^\\circ` : `${P(spec.t[0]!)} = ${P(spec.t[1]!)}`;
      return {
        id, fig, theorem: spec.th, given: [g], prove: stT, givenHtml: 'ℓ ∥ m', proveHtml: htm(stT),
        rows: [
          { st: g, rs: 'given', uses: [] },
          { st: `${P(spec.c[0]!)} = ${P(spec.c[1]!)}`, rs: 'corr', uses: [1] },
          { st: stK, rs: cons ? 'linPair' : 'vert', uses: [] },
          { st: stT, rs: cons ? 'subst' : 'trans', uses: [2, 3], also: cons ? [] : ['subst'] },
        ],
        decoys: [
          { st: stT, rs: RS[spec.th], mc: MCX.circular, why: 'That is the theorem being proved: it cannot be its own reason.' },
          { st: cons ? `${P(spec.t[0]!)} = ${P(spec.t[1]!)}` : `${P(spec.t[0]!)} + ${P(spec.t[1]!)} = 180^\\circ`, rs: cons ? RS.corr : RS.linPair, mc: cons ? MCX.suppEqual : MCX.wrongPair, why: cons ? 'These two angles are not corresponding angles.' : 'These two angles do not form a linear pair.' },
        ],
      };
    }
  }
}

/** a row order is valid when every row comes after the rows it uses (orders list row numbers 1..n) */
export function validOrder(p: Proof, order: number[]): boolean {
  if (order.length !== p.rows.length || new Set(order).size !== order.length) return false;
  const pos = new Map(order.map((r, i) => [r, i]));
  return p.rows.every((row, i) => row.uses.every(u => (pos.get(u) ?? 99) < (pos.get(i + 1) ?? -1))) && order[order.length - 1] === p.rows.length;
}
/** the proof as a paragraph (HTML) */
export function paragraph(p: Proof, rows: { st: string; rs: string }[] = p.rows.map(r => ({ st: r.st, rs: RS[r.rs] }))): string {
  const s = rows.map((r, i) => {
    const st = htm(r.st);
    if (r.rs === RS.given) return i === 0 ? `We are given ${st}.` : `We are also given ${st}.`;
    return `By the ${r.rs.startsWith('Definition') ? 'd' + r.rs.slice(1) : r.rs}, ${st}.`;
  });
  return s.join(' ');
}
export { dirv, mul, norm };
export type { GPoint };
