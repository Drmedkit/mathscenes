// items.ts: exercise families for "Angle relationships with parallel lines and triangles" (secondary-t5-37),
// generated from templates, checked exactly, and every typical wrong answer classified against the misconception
// catalogue (math-curriculum-essentials ids). A generator gets the SUB-GOAL it practises (plan.ts) and uses that
// sub-goal's cases from the topic JSON. Every item with a figure carries it (picture.fig) with the answer hidden
// (labels 'x' / '?' that turn into the value only in the worked solution). Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import {
  type Fig, type FAngle, type FSeg, type MarkCol, type Rel, type Slot, type TransMark, type TriMark, type V3, angOf,
  POLY_NAME, REL_NAME, SLOT, SLOTS, add, dirv, figProblems, mapFig, measure, meet, mul, partner, poly, polySum as pSum,
  relFact, relation, rotP, slotMeasure, sub, trans, tri, unit,
} from './figMaths';

// ---------- misconception ids (all in misconceptions.json) ----------
export const MC = {
  protoTrans: 'mc.angles.transversal-requires-prototype-features',
  interiorLocal: 'mc.angles.interior-means-inside-local-angle',
  collapse: 'mc.angles.collapses-two-transversal-crossings',
  parNoPar: 'mc.angles.parallel-rules-without-parallel-lines',
  proto: 'mc.shapes.prototype-only-recognition',
  rejectNoPar: 'mc.angles.rejects-relations-without-parallel',
  misPos: 'mc.angles.misidentifies-transversal-pair-positions',
  congSupp: 'mc.angles.congruent-pair-treated-as-supplementary',
  ssShared: 'mc.angles.same-side-interior-requires-shared-vertex',
  suppEqual: 'mc.angles.supplementary-pair-set-equal',
  suppObtuse: 'mc.angles.supplementary-needs-obtuse',
  appearance: 'mc.geometric-proof.diagram-appearance-as-given',
  sumSize: 'mc.angles.angle-sum-depends-on-size-or-shape',
  allEqual: 'mc.angles.assumes-all-angles-equal',
  anyOutside: 'mc.angles.any-outside-angle-is-triangle-exterior',
  extReflex: 'mc.angles.exterior-angle-misidentified',
  extUsesAdj: 'mc.angles.exterior-theorem-uses-adjacent-angle',
  extAdjEqual: 'mc.angles.exterior-equals-adjacent-interior',
  ignoresBox: 'mc.shapes.ignores-right-angle-box-value',
  oneKnown: 'mc.angles.subtracts-only-one-known-part',
  fixed360: 'mc.angles.fixed-180-or-360-polygon-sum',
  halve: 'mc.angles.forgets-to-halve-equal-angles',
  copyUnmarked: 'mc.shapes.copies-unmarked-angle-into-marked-pair',
  assumes180: 'mc.angles.assumes-whole-is-90-or-180',
  nTimes180: 'mc.angles.polygon-sum-n-times-180',
  const180: 'mc.angles.constant-180-or-360-polygon-sum',
  divWrong: 'mc.angles.divides-sum-by-wrong-count',
  invalidLink: 'mc.angles.invalid-chain-link',
  intermediate: 'mc.reasoning-language.reports-intermediate-result',
  collectOne: 'mc.expressions.collects-only-one-term-type',
  reportsX: 'mc.linear-equations.reports-x-not-asked-quantity',
  wrongName: 'mc.angles.cites-wrong-pair-name',
  stopsEarly: 'mc.geometric-proof.stops-after-some-conditions',
  citesNoCheck: 'mc.geometric-proof.cites-theorem-without-checking-hypotheses',
  anyThree: 'mc.angles.any-three-angles-sum-180',
  examples: 'mc.reasoning-language.examples-as-proof',
  anyRot: 'mc.transformations.any-rotation-maps-line-to-parallel',
  circular: 'mc.geometric-proof.circular-reasoning',
} as const;

export type FamilyId =
  | 'tcWhere' | 'tcWhichTrans' | 'findPartner' | 'pairName' | 'pairValue' | 'classify' | 'ssRight' | 'needsParallel'
  | 'triSum' | 'third' | 'thirdRight' | 'extFind' | 'extName' | 'extRemote' | 'extWrite' | 'allEight' | 'isoBase' | 'isoApex'
  | 'extValue' | 'extRemoteMissing' | 'polyTriangles' | 'polySum' | 'polySides' | 'regAngle' | 'regSides' | 'regNot'
  | 'chainTri' | 'chainExt' | 'zigzag' | 'exprPair' | 'exprTri' | 'polyExpr' | 'reasonPick' | 'findBadStep' | 'sumCheck'
  | 'motionPick' | 'critique' | 'triArgReason' | 'extArgGeneral';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'tcWhere', name: 'Where is the angle?' },
  { id: 'tcWhichTrans', name: 'Find the transversal' },
  { id: 'findPartner', name: 'Find the partner angle' },
  { id: 'pairName', name: 'Name the pair' },
  { id: 'pairValue', name: 'One step with parallel lines' },
  { id: 'classify', name: 'What do you know for sure?' },
  { id: 'ssRight', name: 'Equal, supplementary, or both?' },
  { id: 'needsParallel', name: 'Which facts need parallel lines?' },
  { id: 'triSum', name: 'The triangle angle sum' },
  { id: 'third', name: 'The third angle' },
  { id: 'thirdRight', name: 'Right triangles' },
  { id: 'extFind', name: 'Spot the exterior angle' },
  { id: 'extName', name: 'Name the exterior angle' },
  { id: 'extRemote', name: 'Remote interior angles' },
  { id: 'extWrite', name: 'Write the exterior angle' },
  { id: 'allEight', name: 'All eight from one' },
  { id: 'isoBase', name: 'Matching arcs: find a marked angle' },
  { id: 'isoApex', name: 'Matching arcs: find the other angle' },
  { id: 'extValue', name: 'Find the exterior angle' },
  { id: 'extRemoteMissing', name: 'Find a remote angle' },
  { id: 'polyTriangles', name: 'Split a polygon into triangles' },
  { id: 'polySum', name: 'Polygon angle sum' },
  { id: 'polySides', name: 'How many sides?' },
  { id: 'regAngle', name: 'One angle of a regular polygon' },
  { id: 'regSides', name: 'Sides from one angle' },
  { id: 'regNot', name: 'Regular or not?' },
  { id: 'chainTri', name: 'Two steps: parallel lines, then a triangle' },
  { id: 'chainExt', name: 'Two steps: straight line, then a triangle' },
  { id: 'zigzag', name: 'The zig-zag between parallels' },
  { id: 'exprPair', name: 'Angle pair equations' },
  { id: 'exprTri', name: 'Triangle equations' },
  { id: 'polyExpr', name: 'Polygon equations' },
  { id: 'reasonPick', name: 'Pick the reason' },
  { id: 'findBadStep', name: 'Find the wrong step' },
  { id: 'sumCheck', name: 'Which sum is justified?' },
  { id: 'motionPick', name: 'Which motion moves the angle?' },
  { id: 'critique', name: 'Is it a proof?' },
  { id: 'triArgReason', name: 'Why the triangle sum works' },
  { id: 'extArgGeneral', name: 'Why the exterior angle works' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

/** what the page draws: the figure, the angles that light up and get their value in the solution, segments and
 *  washes that only appear in the solution */
export interface GeoPic { fig: Fig; reveal?: string[]; focus?: string[]; draw?: string[]; fills?: string[] }
export interface GeoItem extends Item { family: FamilyId; picture?: { fig: Fig; reveal?: string[]; focus?: string[]; draw?: string[]; fills?: string[] }; givens: string[]; work: string[] }
type Gen = (R: () => number, n: number, sg?: string) => GeoItem;

// ---------- small helpers ----------
const D = (v: number | string) => `${v}^\\circ`;
/** TeX degrees with a thousands comma (1{,}440°) */
const DT = (v: number) => D(v.toLocaleString('en-US').replace(',', '{,}'));
const d = (v: number | string) => `${v}°`;
const A = (s: string | number) => `<b class="a">${s}</b>`;
const Sx = (s: string | number) => `<b class="s">${s}</b>`;
const ang = (s: string | number) => `∠${s}`;
const tang = (s: string | number) => `\\angle ${s}`;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
interface Names { l: string; m: string; t: string; L: string; M: string; T: string }
const NAMESETS: readonly Names[] = [
  { l: 'ℓ', m: 'm', t: 't', L: '\\ell', M: 'm', T: 't' },
  { l: 'p', m: 'q', t: 't', L: 'p', M: 'q', T: 't' },
  { l: 'j', m: 'k', t: 'n', L: 'j', M: 'k', T: 'n' },
  { l: 'r', m: 's', t: 'u', L: 'r', M: 's', T: 'u' },
  { l: 'g', m: 'h', t: 'v', L: 'g', M: 'h', T: 'v' },
];
const iN = (s: string) => `<i>${s}</i>`;
const parH = (N: Names) => `${iN(N.l)} ∥ ${iN(N.m)}`;
const parT = (N: Names) => `${N.L} \\parallel ${N.M}`;
function randTau(R: () => number, lo = 44, hi = 136): number { let t: number; do t = int(R, lo, hi); while (Math.abs(t - 90) < 12); return t; }
function place(R: () => number, vert = 0.3): { rot: number; mirror: boolean } {
  return { rot: R() < vert ? 90 + int(R, -12, 12) : int(R, -16, 16), mirror: R() < 0.5 };
}
/** the drawn tau that gives slot s the measure v (lines parallel) */
const tauFor = (s: Slot, v: number) => ([2, 3, 6, 7].includes(s) ? v : 180 - v);
const numbered = (o: { except?: Slot[]; col?: MarkCol } = {}): Partial<Record<Slot, TransMark>> =>
  Object.fromEntries(SLOTS.filter(s => !(o.except ?? []).includes(s)).map(s => [s, { text: String(s), col: o.col ?? 'plain', id: `s${s}` }])) as Partial<Record<Slot, TransMark>>;

type Opt = { t: string; ok?: boolean; mc?: string; say?: string };
interface Base { id: string; family: FamilyId; prompt: string; board?: string; givens: string[]; work: string[]; solution: string[]; picture?: GeoItem['picture'] }
function choiceItem(R: () => number, b: Base, opts: Opt[], okSay: string, hint: string, keepOrder = false): GeoItem {
  const o = keepOrder ? opts : shuffle(R, opts.slice());
  const right = o.findIndex(x => x.ok);
  return {
    ...b, board: b.board ?? (b.givens.join(',\\ ') || '?'), input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: right },
    check(r: Response): Verdict {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one answer.' };
      const x = o[r.i];
      if (!x) return { ok: false, say: 'Pick one answer.' };
      return x.ok ? { ok: true, say: x.say ?? okSay } : { ok: false, mc: x.mc, say: x.say ?? hint };
    },
  };
}
type Wrong = [number, string | undefined, string];
function numItem(b: Base, ans: number, wrongs: Wrong[], okSay: string, hint: string, unit = 'degrees'): GeoItem {
  const W = wrongs.filter(w => !near(w[0], ans) && Number.isFinite(w[0]));
  return {
    ...b, board: b.board ?? (b.givens.join(',\\ ') || '?'), input: 'num', unit, answer: { kind: 'num', v: ans },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, ans)) return { ok: true, say: okSay };
      const w = W.find(x => near(x[0], r.v));
      return w ? { ok: false, mc: w[1], say: w[2] } : { ok: false, say: hint };
    },
  };
}
/** a pair answer: x and an angle measure */
function pairItem(b: Base, x: number, y: number, lead: string, op: string, tail: string, classify: (rx: number, ry: number) => Verdict | null, okSay: string, hint: string): GeoItem {
  return {
    ...b, board: b.board ?? b.givens.join(',\\ '), input: 'pair', pairLead: lead, pairOp: op, pairTail: tail, answer: { kind: 'pair', x, y },
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes.' };
      if (near(r.x, x) && near(r.y, y)) return { ok: true, say: okSay };
      return classify(r.x, r.y) ?? { ok: false, say: hint };
    },
  };
}
/** re-roll an item until its figure passes the layout rules (the rng moves on, so the next roll differs) */
const fits = (it: GeoItem) => !it.picture || figProblems(it.picture.fig).length === 0;
const G = (f: Gen): Gen => (R, n, sg) => { let it = f(R, n, sg); for (let i = 0; i < 24 && !fits(it); i++) it = f(R, n, sg); return it; };
const at = <T>(xs: readonly T[], i: number) => xs[((i % xs.length) + xs.length) % xs.length]!;

// =====================================================================================================
// 1. transversal-configuration
// =====================================================================================================
const tcWhere: Gen = G((R, n) => {
  const N = pick(R, NAMESETS), par = R() < 0.5, tau = randTau(R), pl = place(R);
  const k = pick(R, SLOTS), j = pick(R, SLOTS.filter(s => s !== k));
  const marks = numbered();
  marks[k] = { text: String(k), col: 'pick', id: `s${k}` }; marks[j] = { text: String(j), col: 'second', id: `s${j}` };
  const T = trans({ tau, delta: par ? 0 : pick(R, [-1, 1]) * int(R, 7, 12), ...pl, par, names: { l: N.l, m: N.m, t: N.t }, marks });
  const io = SLOT[k].io, same = SLOT[k].s === SLOT[j].s;
  const word = (i: 'in' | 'out', s: boolean) => `${i === 'in' ? 'Interior' : 'Exterior'}, ${s ? 'same side of' : 'opposite side of'} ${iN(N.t)} as ${ang(j)}`;
  const opts: Opt[] = (['in', 'out'] as const).flatMap(i => [true, false].map(s => ({
    t: word(i, s), ok: i === io && s === same,
    mc: i !== io ? MC.interiorLocal : undefined,
    say: i !== io ? `Interior means between the two lines ${iN(N.l)} and ${iN(N.m)}, not inside a corner. ${ang(k)} is ${io === 'in' ? 'between' : 'outside'} them.` : undefined,
  })));
  return choiceItem(R, {
    id: `tcWhere-${n}`, family: 'tcWhere', prompt: `Lines ${iN(N.l)} and ${iN(N.m)} are cut by transversal ${iN(N.t)}. Where is ${ang(k)}?`,
    givens: [], work: [], board: `\\text{where is } ${tang(k)}\\text{?}\\ (${N.L}, ${N.M}, ${N.T})`,
    solution: [`${ang(k)} is ${io === 'in' ? 'between' : 'outside'} lines ${iN(N.l)} and ${iN(N.m)}: it is ${io === 'in' ? 'interior' : 'exterior'}.`,
      `${ang(k)} and ${ang(j)} are on ${same ? 'the same side' : 'opposite sides'} of ${iN(N.t)}.`],
    picture: { fig: T.fig, focus: [`s${k}`] },
  }, opts, 'Yes.', `Check two things: is ${ang(k)} between the lines? Is it on the same side of ${iN(N.t)} as ${ang(j)}?`, true);
});

const tcWhichTrans: Gen = G((R, n) => {
  const letters = shuffle(R, pick(R, [['p', 'q', 'r'], ['a', 'b', 'c'], ['j', 'k', 'n'], ['u', 'v', 'w']]));
  const [l, m, t] = letters as [string, string, string];
  const par = R() < 0.5, tau = randTau(R, 50, 130), flat = R() < 0.55;
  // half the time the transversal runs level and the two crossed lines slant
  const rot = flat ? -tau + int(R, -6, 6) : int(R, -14, 14);
  const T = trans({ tau, delta: par ? 0 : pick(R, [-1, 1]) * int(R, 8, 14), rot, mirror: R() < 0.5, par: par && R() < 0.5, names: { l, m, t } });
  const opts: Opt[] = letters.map(x => ({ t: `Line ${x}`, ok: x === t, mc: x === t ? undefined : MC.protoTrans,
    say: x === t ? undefined : `Line ${iN(x)} crosses only one of the other lines… look for the line that crosses BOTH others, at two different points. It does not have to be slanted, and the other two do not have to be parallel.` }));
  const order = shuffle(R, letters.slice());
  return choiceItem(R, {
    id: `tcWhichTrans-${n}`, family: 'tcWhichTrans',
    prompt: `Lines ${order.map(iN).join(', ')}: which one is a transversal of the other two?${par ? '' : ' (The lines are not parallel.)'}`,
    givens: [], work: [], board: `${order.join(',\\ ')}:\\ \\text{transversal?}`,
    solution: [`Line ${iN(t)} crosses line ${iN(l)} and line ${iN(m)} at two different points, so ${iN(t)} is the transversal.`,
      'A transversal can run in any direction, and the lines it crosses need not be parallel.'],
    picture: { fig: T.fig },
  }, opts, `Yes: ${iN(t)} crosses both other lines.`, 'A transversal crosses two lines at two different points.', true);
});

// =====================================================================================================
// 2, 4, 6. positions: find the partner, name the pair
// =====================================================================================================
type NamedRel = 'corresponding' | 'altInt' | 'altExt' | 'ssInt';
const POS_WORDS: Record<NamedRel, string> = {
  corresponding: 'in the same position at the two crossings: on the same side of the transversal, and on the same side of their own line',
  altInt: 'between the two lines, on opposite sides of the transversal',
  altExt: 'outside the two lines, on opposite sides of the transversal',
  ssInt: 'between the two lines, on the same side of the transversal, at different crossings',
};
const SHORT: Record<NamedRel, string> = { corresponding: 'corresponding', altInt: 'alternate interior', altExt: 'alternate exterior', ssInt: 'same-side interior' };
function relFor(R: () => number, sg?: string): NamedRel {
  if (sg === 'corresponding-position' || sg === 'corresponding-congruent-if-parallel') return 'corresponding';
  if (sg === 'alternate-position' || sg === 'alternate-congruent-if-parallel') return R() < 0.6 ? 'altInt' : 'altExt';
  if (sg === 'same-side-interior-position' || sg === 'same-side-supplementary') return 'ssInt';
  return pick(R, ['corresponding', 'altInt', 'altExt', 'ssInt'] as const);
}
function slotFor(R: () => number, r: Rel): Slot {
  const ok = SLOTS.filter(s => SLOTS.some(t => relation(s, t) === r));
  return pick(R, ok);
}
const findPartner: Gen = G((R, n, sg) => {
  const r = relFor(R, sg), k = slotFor(R, r), p = partner(k, r as never);
  const N = pick(R, NAMESETS), par = R() < 0.6, pl = place(R, 0.35);
  const PRI: Record<NamedRel, Rel[]> = {
    corresponding: ['altInt', 'altExt', 'ssInt', 'ssExt', 'vertical', 'none', 'linear'],
    altInt: ['ssInt', 'corresponding', 'vertical', 'none', 'linear'],
    altExt: ['ssExt', 'corresponding', 'vertical', 'none', 'linear'],
    ssInt: ['linear', 'altInt', 'corresponding', 'none', 'vertical'],
  };
  const others: Slot[] = [];
  for (const rr of PRI[r]) { const s = SLOTS.find(t => t !== k && t !== p && relation(k, t) === rr && !others.includes(t)); if (s && others.length < 3) others.push(s); }
  const marks = numbered(); marks[k] = { text: String(k), col: 'pick', id: `s${k}` };
  const T = trans({ tau: randTau(R), delta: par ? 0 : pick(R, [-1, 1]) * int(R, 6, 10), ...pl, par, names: { l: N.l, m: N.m, t: N.t }, marks });
  const mcOf = (s: Slot) => { const rr = relation(k, s); if (r === 'ssInt' && rr === 'linear') return MC.ssShared; if (rr === 'vertical') return undefined; return Math.abs(pl.rot) > 45 && r === 'corresponding' ? MC.proto : MC.misPos; };
  const opts: Opt[] = [{ t: ang(p), ok: true }, ...others.map(s => ({ t: ang(s), mc: mcOf(s),
    say: relation(k, s) === 'linear' && r === 'ssInt' ? `${ang(s)} shares a vertex with ${ang(k)}: that is a linear pair. Same-side interior angles sit at the two different crossings.`
      : `${ang(s)} and ${ang(k)} are ${REL_NAME[relation(k, s)]}. ${SHORT[r][0]!.toUpperCase() + SHORT[r].slice(1)} angles are ${POS_WORDS[r]}.` }))];
  const ask = r === 'corresponding' ? `Which angle corresponds to ${ang(k)}?` : `Which angle is the ${SHORT[r]} partner of ${ang(k)}?`;
  return choiceItem(R, {
    id: `findPartner-${n}`, family: 'findPartner', prompt: `${ask}${par ? '' : ' (The lines are not parallel: the positions still count.)'}`,
    givens: [], work: [], board: `${tang(k)}:\\ \\text{${SHORT[r]} partner?}\\ (${N.L}, ${N.M}, ${N.T})`,
    solution: [`${SHORT[r][0]!.toUpperCase() + SHORT[r].slice(1)} angles are ${POS_WORDS[r]}.`, `So the partner of ${ang(k)} is ${Sx(ang(p))}.`],
    picture: { fig: T.fig, focus: [`s${k}`, `s${p}`] },
  }, opts, `Yes: ${ang(k)} and ${ang(p)} are ${REL_NAME[r]}.`, 'Look at the position: between or outside the lines, and which side of the transversal.');
});

const pairName: Gen = G((R, n, sg) => {
  const r: NamedRel = R() < 0.6 ? relFor(R, sg) : pick(R, ['corresponding', 'altInt', 'altExt', 'ssInt'] as const);
  const k = slotFor(R, r), p = partner(k, r as never);
  const N = pick(R, NAMESETS), par = R() < 0.6, pl = place(R, 0.35);
  const marks: Partial<Record<Slot, TransMark>> = { [k]: { text: String(k), col: 'pick', id: `s${k}` }, [p]: { text: String(p), col: 'pick', id: `s${p}` } };
  const T = trans({ tau: randTau(R), delta: par ? 0 : pick(R, [-1, 1]) * int(R, 6, 10), ...pl, par, names: { l: N.l, m: N.m, t: N.t }, marks });
  const all: NamedRel[] = ['corresponding', 'altInt', 'altExt', 'ssInt'];
  const opts: Opt[] = all.map(x => ({ t: SHORT[x][0]!.toUpperCase() + SHORT[x].slice(1), ok: x === r,
    mc: x === r ? undefined : (r === 'corresponding' && Math.abs(pl.rot) > 45 ? MC.proto : MC.misPos),
    say: x === r ? undefined : `${SHORT[x][0]!.toUpperCase() + SHORT[x].slice(1)} angles are ${POS_WORDS[x]}. Check where ${ang(k)} and ${ang(p)} sit.` }));
  const [a, b] = [k, p].sort((x, y) => x - y) as [Slot, Slot];
  return choiceItem(R, {
    id: `pairName-${n}`, family: 'pairName', prompt: `What kind of pair are ${ang(a)} and ${ang(b)}?`,
    givens: [], work: [], board: `${tang(a)},\\ ${tang(b)}:\\ \\text{which pair?}\\ (${N.L}, ${N.M})`,
    solution: [`${ang(k)} and ${ang(p)} are ${POS_WORDS[r]}.`, `So they are ${Sx(REL_NAME[r])}.`],
    picture: { fig: T.fig, focus: [`s${k}`, `s${p}`] },
  }, opts, `Yes: ${REL_NAME[r]}.`, 'Between or outside the lines? Same side of the transversal or opposite sides?', true);
});

// =====================================================================================================
// 3, 5, 7, 12. one step with parallel lines
// =====================================================================================================
const STREETS: readonly [string, string, string][] = [['Elm St', 'Oak St', 'the rail line'], ['Main St', 'Park Ave', 'the bike path'], ['1st Ave', '2nd Ave', 'Diagonal Rd'], ['the top rail', 'the bottom rail', 'the brace']];
const pairValue: Gen = G((R, n, sg) => {
  const rels: Rel[] = sg === 'missing-angle-parallel-one-step' ? ['corresponding', 'altInt', 'altExt', 'ssInt', 'vertical', 'linear'] : [relFor(R, sg)];
  const r = pick(R, rels), g = slotFor(R, r), k = SLOTS.find(t => relation(g, t) === r)!;
  let v: number; do v = int(R, 38, 142); while (Math.abs(v - 90) < 10);
  const tau = tauFor(g, v), ans = slotMeasure(k, tau), eq = relFact(r).eq;
  const N = pick(R, NAMESETS), pl = place(R, 0.3);
  const ctx = (sg === 'missing-angle-parallel-one-step' || sg === 'corresponding-congruent-if-parallel') && R() < 0.4 ? pick(R, STREETS) : null;
  const marks: Partial<Record<Slot, TransMark>> = { [g]: { text: d(v), col: 'second', id: 'g' }, [k]: { text: 'x', alt: d(ans), col: 'link', id: 'x' } };
  const T = trans({ tau, ...pl, par: !ctx, names: ctx ? {} : { l: N.l, m: N.m, t: N.t }, marks, words: ctx ? { l: ctx[0], m: ctx[1] } : undefined, gap: ctx ? 360 : 330 });
  const lead = ctx ? `${ctx[0]} and ${ctx[1]} are parallel, and ${ctx[2]} crosses both.` : `Lines ${iN(N.l)} and ${iN(N.m)} are parallel.`;
  const why = eq ? `${r === 'vertical' ? 'Vertical angles are always equal' : 'The lines are parallel, so they are equal'}: x = ${d(v)}.`
    : `${r === 'linear' ? 'A linear pair adds to 180°' : 'The lines are parallel, so they add to 180°'}: x = 180° − ${d(v)} = ${d(ans)}.`;
  return numItem({
    id: `pairValue-${n}`, family: 'pairValue', prompt: `${lead} Find ${Sx('x')}.`,
    givens: [ctx ? `\\text{${ctx[0]}} \\parallel \\text{${ctx[1]}}` : parT(N), `\\text{given: }\\ ${D(v)}`], work: eq ? [`x = ${D(v)}`] : [`x = 180^\\circ - ${D(v)}`, `x = ${D(ans)}`],
    board: `${ctx ? '\\text{parallel streets}' : parT(N)},\\ ${D(v)},\\ x = \\,?`,
    solution: [`x and the ${d(v)} angle are ${REL_NAME[r]}.`, why],
    picture: { fig: T.fig, reveal: ['x'], focus: ['g', 'x'] },
  }, ans, [[180 - ans, eq ? MC.congSupp : MC.suppEqual, eq ? `These two are ${REL_NAME[r]}: they are equal, not supplementary.` : `These two are ${REL_NAME[r]}: they add to 180°, they are not equal.`]],
  `Yes: x = ${d(ans)}.`, `Name the pair first: ${REL_NAME[r]}. Equal, or adding to 180°?`);
});

// =====================================================================================================
// 3, 5, 8. classify a pair: equal / supplementary / both / can't tell
// =====================================================================================================
const CL = ['They are equal', 'They add to 180°', 'Both: equal, and they add to 180°', 'Can’t tell from what is given'] as const;
const classify: Gen = G((R, n, sg) => {
  const N = pick(R, NAMESETS);
  const menu: Rel[] = sg === 'corresponding-congruent-if-parallel' ? ['corresponding', 'corresponding', 'corresponding', 'vertical', 'linear']
    : sg === 'alternate-congruent-if-parallel' ? ['altInt', 'altInt', 'altExt', 'vertical', 'linear']
      : ['corresponding', 'altInt', 'altExt', 'ssInt', 'vertical', 'linear'];
  const r = pick(R, menu), k = slotFor(R, r), p = SLOTS.find(t => relation(k, t) === r)!;
  const parMode = pick(R, ['arrows', 'words', 'looks', 'not'] as const);
  const par = parMode === 'arrows' || parMode === 'words';
  const perp = sg === 'classify-pair-relation' && par && R() < 0.15;
  const tau = perp ? 90 : randTau(R), delta = parMode === 'looks' ? pick(R, [-1, 1]) * int(R, 3, 5) : parMode === 'not' ? pick(R, [-1, 1]) * int(R, 9, 13) : 0;
  const marks: Partial<Record<Slot, TransMark>> = { [k]: { text: String(k), col: 'pick', id: `s${k}`, box: perp }, [p]: { text: String(p), col: 'pick', id: `s${p}` } };
  const T = trans({ tau, delta, ...place(R, 0.3), par: parMode === 'arrows', names: { l: N.l, m: N.m, t: N.t }, marks });
  const f = relFact(r);
  const right = !f.needsPar || par ? (perp ? 2 : f.eq ? 0 : 1) : 3;
  const opts: Opt[] = CL.map((t, i) => {
    if (i === right) return { t, ok: true };
    let mc: string | undefined, say: string;
    if (right === 3) { mc = parMode === 'looks' ? MC.appearance : MC.parNoPar; say = `${ang(k)} and ${ang(p)} sit at different crossings, so ${f.eq ? 'being equal' : 'adding to 180°'} needs ${iN(N.l)} ∥ ${iN(N.m)}. Nothing says the lines are parallel${parMode === 'looks' ? ': looking parallel is not enough' : ''}.`; }
    else if (i === 3) { mc = f.needsPar ? undefined : MC.rejectNoPar; say = f.needsPar ? 'The lines are given as parallel, so the parallel-line facts hold.' : `${REL_NAME[r][0]!.toUpperCase() + REL_NAME[r].slice(1)} need no parallel lines: they hold at any crossing.`; }
    else if (right === 2) { mc = i === 0 ? MC.suppObtuse : undefined; say = 'The box says 90°, so both are right angles: 90° = 90°, and 90° + 90° = 180°. Both hold.'; }
    else if (i === 2) { mc = MC.appearance; say = 'Both would need right angles, and no box says so.'; }
    else { mc = f.eq ? MC.congSupp : MC.suppEqual; say = `${REL_NAME[r][0]!.toUpperCase() + REL_NAME[r].slice(1)} ${f.eq ? 'are equal' : 'add to 180°'}${f.needsPar ? ' when the lines are parallel' : ''}.`; }
    return { t, mc, say };
  });
  const given = parMode === 'arrows' ? 'The arrows mark the lines as parallel.' : parMode === 'words' ? `Lines ${iN(N.l)} and ${iN(N.m)} are parallel.` : 'Nothing says the lines are parallel.';
  return choiceItem(R, {
    id: `classify-${n}`, family: 'classify', prompt: `${given} What do you know for sure about ${ang(k)} and ${ang(p)}?`,
    givens: par ? [parT(N)] : [], work: [], board: `${par ? parT(N) : '\\text{no } \\parallel'},\\ ${tang(k)} \\text{ and } ${tang(p)}`,
    solution: [`${ang(k)} and ${ang(p)} are ${REL_NAME[r]}.`,
      right === 3 ? `That pair needs parallel lines, and the lines are not given as parallel: you can’t tell.`
        : right === 2 ? 'Both are right angles (the box), so they are equal AND add to 180°.'
          : `${f.needsPar ? 'The lines are parallel, so they' : 'At any crossing they'} ${f.eq ? 'are equal' : 'add to 180°'}.`],
    picture: { fig: T.fig, focus: [`s${k}`, `s${p}`] },
  }, opts, 'Yes.', 'Name the pair, then ask: does that fact need parallel lines? Are they given?', true);
});

// =====================================================================================================
// 7. same-side interior: equal, supplementary, or both
// =====================================================================================================
const ssRight: Gen = G((R, n) => {
  const N = pick(R, NAMESETS), mode = pick(R, ['box', 'box', 'near', 'clear'] as const);
  const tau = mode === 'box' ? 90 : mode === 'near' ? pick(R, [86, 87, 88, 92, 93, 94]) : randTau(R, 48, 132);
  const k = pick(R, [3, 4, 5, 6] as Slot[]), p = partner(k, 'ssInt');
  const marks: Partial<Record<Slot, TransMark>> = { [k]: { text: String(k), col: 'pick', id: `s${k}`, box: mode === 'box' }, [p]: { text: String(p), col: 'pick', id: `s${p}`, box: mode === 'box' } };
  const T = trans({ tau, ...place(R, 0.3), par: true, names: { l: N.l, m: N.m, t: N.t }, marks });
  const right = mode === 'box' ? 2 : 1;
  const opts: Opt[] = CL.slice(0, 3).map((t, i) => i === right ? { t, ok: true } : {
    t, mc: mode === 'box' ? (i === 0 ? MC.suppObtuse : MC.ignoresBox) : i === 2 ? MC.appearance : MC.suppEqual,
    say: mode === 'box' ? 'The boxes make both angles 90°: 90° = 90° and 90° + 90° = 180°. Both hold.'
      : i === 2 ? 'They may look like right angles, but no box says so. Only the sum is sure.' : 'Same-side interior angles add to 180°. They are equal only when both are right angles.',
  });
  opts.push({ t: 'Neither', say: 'The lines are parallel, so same-side interior angles add to 180°.' });
  return choiceItem(R, {
    id: `ssRight-${n}`, family: 'ssRight', prompt: `${iN(N.l)} ∥ ${iN(N.m)}. ${ang(k)} and ${ang(p)} are same-side interior angles.${mode === 'box' ? ' The boxes mark right angles.' : ''} What is sure?`,
    givens: [parT(N)], work: [], board: `${parT(N)},\\ ${tang(k)},\\ ${tang(p)}${mode === 'box' ? '\\ \\text{(boxes)}' : ''}`,
    solution: ['Same-side interior angles at parallel lines add to 180°.', mode === 'box' ? 'Here both are 90° (the boxes), so they are also equal.' : 'They are equal only if both are 90°, and nothing says so here.'],
    picture: { fig: T.fig, focus: [`s${k}`, `s${p}`] },
  }, opts, 'Yes.', 'Same-side interior angles add to 180°. When are they also equal?', true);
});

// =====================================================================================================
// 8. which facts still hold without parallel lines
// =====================================================================================================
const needsParallel: Gen = G((R, n) => {
  const N = pick(R, NAMESETS), looks = R() < 0.5;
  const T = trans({ tau: randTau(R), delta: pick(R, [-1, 1]) * (looks ? int(R, 3, 5) : int(R, 9, 13)), ...place(R, 0.3), par: false, names: { l: N.l, m: N.m, t: N.t }, marks: numbered() });
  const stmt = (a: Slot, b: Slot) => relFact(relation(a, b)).eq ? `${ang(a)} = ${ang(b)}` : `${ang(a)} + ${ang(b)} = 180°`;
  const goodRel = pick(R, ['vertical', 'linear'] as const), ga = pick(R, SLOTS), gb = SLOTS.find(t => relation(ga, t) === goodRel)!;
  const bads: Opt[] = [];
  for (const rr of shuffle(R, ['corresponding', 'altInt', 'altExt', 'ssInt'] as Rel[])) {
    const a = slotFor(R, rr), b = SLOTS.find(t => relation(a, t) === rr)!;
    const t = stmt(a, b);
    if (bads.length < 3 && !bads.some(x => x.t === t)) bads.push({ t, mc: looks ? MC.appearance : MC.parNoPar, say: `${ang(a)} and ${ang(b)} are ${REL_NAME[rr]}: that fact needs parallel lines${looks ? ', and looking parallel is not enough' : ''}.` });
  }
  if (R() < 0.4) {
    // the inverse question: which ONE statement needs parallel lines (the other three sit at one crossing)
    const need = bads[0]!, locals: Opt[] = [];
    for (let i = 0; i < 40 && locals.length < 3; i++) {
      const rr = pick(R, ['vertical', 'linear'] as Rel[]), a = pick(R, SLOTS), b = SLOTS.find(t => relation(a, t) === rr)!, t = stmt(a, b);
      if (!locals.some(x => x.t === t)) locals.push({ t, mc: MC.rejectNoPar, say: `${ang(a)} and ${ang(b)} are ${REL_NAME[rr]}: they sit at one crossing and need no parallel lines.` });
    }
    return choiceItem(R, {
      id: `needsParallel-${n}`, family: 'needsParallel', prompt: `Which statement is true ONLY if lines ${iN(N.l)} and ${iN(N.m)} are parallel?`,
      givens: [], work: [], board: `\\text{only if } ${N.L} \\parallel ${N.M}?\\ ${looks ? '(looks)' : ''}`,
      solution: [`${need.t}: those angles sit at different crossings, so it needs ${parH(N)}.`, 'Vertical angles and linear pairs sit at one crossing: they hold anyway.'],
      picture: { fig: T.fig },
    }, [{ t: need.t, ok: true, say: undefined }, ...locals], 'Yes: that pair sits at two different crossings.', 'Which pair sits at two DIFFERENT crossings?');
  }
  return choiceItem(R, {
    id: `needsParallel-${n}`, family: 'needsParallel', prompt: `Lines ${iN(N.l)} and ${iN(N.m)} are NOT given as parallel${looks ? ' (even if they look it)' : ''}. Which statement is still true for sure?`,
    givens: [], work: [], board: `${N.L} \\not\\parallel ${N.M}?\\ \\text{(not given)}`,
    solution: [`${stmt(ga, gb)}: they are ${REL_NAME[goodRel]}, and that holds at any crossing.`, 'Corresponding, alternate and same-side facts need parallel lines.'],
    picture: { fig: T.fig, focus: [`s${ga}`, `s${gb}`] },
  }, [{ t: stmt(ga, gb), ok: true }, ...bads], 'Yes: that pair sits at one crossing.', 'Which pair sits at ONE crossing?');
});

// =====================================================================================================
// 9, 13. triangle angle sum, third angle
// =====================================================================================================
function triAngles(R: () => number, lo = 32, obtuse = 0.3): [number, number, number] {
  for (;;) {
    const a = R() < obtuse ? int(R, 95, 125) : int(R, lo, 88);
    const b = int(R, lo, 180 - a - lo);
    const c = 180 - a - b;
    if (c >= lo && b >= lo) return shuffle(R, [a, b, c]) as [number, number, number];
  }
}
const TRI_NAMES: readonly [string, string, string][] = [['A', 'B', 'C'], ['P', 'Q', 'R'], ['J', 'K', 'L'], ['X', 'Y', 'Z'], ['D', 'E', 'F']];
const EXT_LETTER: Record<string, string> = { A: 'D', P: 'S', J: 'M', X: 'W', D: 'G' };
const triSum: Gen = G((R, n) => {
  const mode = pick(R, ['compare', 'compare', 'possible', 'equal'] as const);
  if (mode === 'compare') {
    const [a1, b1] = triAngles(R, 45, 0), big = tri({ A: a1, B: b1, C: 180 - a1 - b1, size: 520, fillBody: true });
    const ta = int(R, 118, 140), tb = int(R, 14, 24);
    const t2 = tri({ A: ta, B: tb, C: 180 - ta - tb, size: 420, rot: int(R, -30, 30) });
    const F1 = mapFig(big.fig, p => [p[0] - 210, p[1] + 150]), F2 = mapFig(t2.fig, p => [p[0] + 220, p[1] - 250]);
    const fig: Fig = { segs: [...F1.segs, ...F2.segs], angles: [], points: [], fills: [...F1.fills, ...F2.fills], words: [{ at: [-210, 150], text: '1' }, { at: [220 + 0, -250 + 70], text: '2' }] };
    const opts: Opt[] = [
      { t: 'Triangle 1: it is bigger', mc: MC.sumSize, say: 'Size does not change angles: a bigger copy has the same angles. Every triangle’s angles add to 180°.' },
      { t: 'Triangle 2: it has a wide angle', mc: MC.sumSize, say: 'A wide angle makes the other two small. The three still add to 180°.' },
      { t: 'Neither: both sums are 180°', ok: true },
      { t: 'You can only tell by measuring', say: 'No measuring needed: the angle sum of every triangle is 180°.' },
    ];
    return choiceItem(R, {
      id: `triSum-${n}`, family: 'triSum', prompt: `Triangle 1 is ${pick(R, ['large', 'big and roomy'])}. Triangle 2 is ${pick(R, ['long and thin', 'flat, with one wide angle'])} (its wide angle is ${A(d(ta))}). Which has the bigger angle sum?`,
      givens: [], work: [`180^\\circ = 180^\\circ`], board: `\\text{sum 1 vs sum 2},\\ ${D(ta)}`,
      solution: ['The angles of every triangle add to 180°, whatever its size or shape.', 'So the sums are equal: 180° and 180°.'],
      picture: { fig },
    }, opts, 'Yes: 180° each, whatever the size or shape.', 'Does the angle sum depend on size?', true);
  }
  if (mode === 'possible') {
    const ok = R() < 0.45;
    let a: number, b: number, c: number;
    if (ok) [a, b, c] = triAngles(R, 25, 0.3); else { a = int(R, 30, 100); b = int(R, 25, 90); c = int(R, 20, 80); if (a + b + c === 180) c += 10; }
    const s = a + b + c;
    const opts: Opt[] = [
      { t: 'Yes', ok, say: ok ? undefined : `${a} + ${b} + ${c} = ${s}, not 180.` },
      { t: 'No', ok: !ok, say: !ok ? undefined : `${a} + ${b} + ${c} = 180: it works.` },
      { t: 'Only if the triangle is big enough', mc: MC.sumSize, say: 'Size never changes the angle sum: it is always 180°.' },
    ];
    return choiceItem(R, {
      id: `triSum-${n}`, family: 'triSum', prompt: `Can a triangle have angles of ${A(d(a))}, ${A(d(b))} and ${A(d(c))}?`,
      givens: [`${D(a)},\\ ${D(b)},\\ ${D(c)}`], work: [`${a} + ${b} + ${c} = ${s}`], board: `${D(a)},\\ ${D(b)},\\ ${D(c)}`,
      solution: [`Add them: ${a} + ${b} + ${c} = ${s}.`, ok ? 'That is 180°, so yes.' : `A triangle needs exactly 180°, so no.`],
    }, opts, ok ? 'Yes: they add to 180°.' : `Right: they add to ${s}°, not 180°.`, 'Add the three angles.', true);
  }
  const big = 2 * int(R, 48, 65), rest = 180 - big;
  const b1 = int(R, 22, rest - 22);
  const T = tri({ A: big, B: b1, C: rest - b1, rot: int(R, -40, 40), mirror: R() < 0.5, marks: { A: { text: d(big), col: 'second' }, B: { text: '?', col: 'plain' }, C: { text: '?', col: 'plain', id: 'C2' } } });
  const opts: Opt[] = [
    { t: `Yes: the angles of a triangle are shared equally`, mc: MC.allEqual, say: 'Only matching marks (or words) say angles are equal. Here nothing does.' },
    { t: `No: they add to ${rest}°, but they need not be equal`, ok: true },
    { t: `No: they add to ${360 - big}°`, mc: MC.fixed360, say: 'A triangle’s angles add to 180°, not 360°.' },
  ];
  return choiceItem(R, {
    id: `triSum-${n}`, family: 'triSum', prompt: `One angle of this triangle is ${A(d(big))}. Must the other two be ${d(rest / 2)} each?`,
    givens: [`${D(big)}`], work: [`180 - ${big} = ${rest}`], board: `${D(big)},\\ \\text{the other two?}`,
    solution: [`The other two add to 180° − ${d(big)} = ${d(rest)}.`, 'Nothing marks them as equal, so they need not be equal.'],
    picture: { fig: T.fig },
  }, opts, 'Yes: they share 180° − the big angle, in any split.', 'What do the other two add to? Does anything say they are equal?', true);
});

/** a triangle figure with two given angles and an unknown (or more marks); letters optional */
function triFig(R: () => number, ang3: [number, number, number], marks: Partial<Record<V3, TriMark>>, o: { names?: boolean; ext?: Parameters<typeof tri>[0]['ext']; rot?: number } = {}) {
  const N = o.names ? pick(R, TRI_NAMES) : null;
  return { T: tri({ A: ang3[0], B: ang3[1], C: ang3[2], rot: o.rot ?? int(R, -35, 35), mirror: R() < 0.5, names: N, marks, ext: o.ext }), N };
}
const third: Gen = G((R, n, sg) => {
  const [a, b, c] = triAngles(R, 30, sg === 'triangle-third-angle' ? 0.45 : 0.3);
  const unk = pick(R, ['A', 'B', 'C'] as V3[]), vals = { A: a, B: b, C: c };
  const known = (['A', 'B', 'C'] as V3[]).filter(v => v !== unk);
  const marks = Object.fromEntries((['A', 'B', 'C'] as V3[]).map(v => [v, v === unk ? { text: 'x', alt: d(vals[v]), col: 'link' as MarkCol, id: 'x' } : { text: d(vals[v]), col: 'second' as MarkCol, id: v }])) as Partial<Record<V3, TriMark>>;
  const { T } = triFig(R, [a, b, c], marks, { names: R() < 0.4 });
  const [p, q] = known.map(v => vals[v]) as [number, number], ans = vals[unk];
  return numItem({
    id: `third-${n}`, family: 'third', prompt: `Two angles of the triangle are ${A(d(p))} and ${A(d(q))}. Find ${Sx('x')}.`,
    givens: [`${D(p)},\\ ${D(q)}`], work: [`x = 180^\\circ - (${p}^\\circ + ${q}^\\circ)`, `x = ${D(ans)}`],
    solution: [`The three angles of a triangle add to 180°.`, `x = 180° − (${d(p)} + ${d(q)}) = 180° − ${d(p + q)} = ${d(ans)}.`],
    picture: { fig: T.fig, reveal: ['x'], focus: ['x', ...known] },
  }, ans, [
    [180 - p, MC.oneKnown, `Take away BOTH known angles: 180° − ${d(p)} − ${d(q)}.`],
    [180 - q, MC.oneKnown, `Take away BOTH known angles: 180° − ${d(p)} − ${d(q)}.`],
    [360 - p - q, MC.fixed360, 'A triangle’s angles add to 180°, not 360°.'],
  ], `Yes: x = ${d(ans)}.`, 'The three angles add to 180°.');
});

const thirdRight: Gen = G((R, n) => {
  const a = int(R, 24, 66), x = 90 - a, ladder = R() < 0.45;
  // B is the right angle (box), C the given angle, A the unknown
  const T = tri({ A: x, B: 90, C: a, rot: ladder ? 0 : int(R, -40, 40), mirror: R() < 0.5, size: 600, marks: { B: { box: true, col: 'first', text: '' }, C: { text: d(a), col: 'second' }, A: { text: 'x', alt: d(x), col: 'link', id: 'x' } } });
  if (ladder) {
    const P = T.P, mAB = mul(add(P.A, P.B), 0.5), mBC = mul(add(P.B, P.C), 0.5);
    const out = (m: [number, number], o: [number, number]) => add(m, mul(unit(sub(m, o)), 70));
    T.fig.words = [{ at: out(mAB, P.C), text: 'wall' }, { at: out(mBC, P.A), text: 'ground' }];
  }
  return numItem({
    id: `thirdRight-${n}`, family: 'thirdRight',
    prompt: ladder ? `A ladder leans against a wall. It makes a ${A(d(a))} angle with the ground. Find ${Sx('x')}, the angle at the top.` : `One angle is ${A(d(a))}. The box marks a right angle. Find ${Sx('x')}.`,
    givens: [`${D(a)},\\ \\text{right angle}`], work: [`x = 180^\\circ - (90^\\circ + ${D(a)})`, `x = ${D(x)}`],
    solution: ['The box means 90°.', `x = 180° − (90° + ${d(a)}) = ${d(x)}.`],
    picture: { fig: T.fig, reveal: ['x'], focus: ['x', 'B', 'C'] },
  }, x, [[180 - a, MC.ignoresBox, 'The box is an angle too: 90°. Take it away as well.'], [90 + a, undefined, 'The three angles add to 180°: 90° + ' + d(a) + ' + x = 180°.']],
  `Yes: x = ${d(x)}.`, 'The box is 90°. The three angles add to 180°.');
});

// =====================================================================================================
// 10, 11, 15. exterior angles
// =====================================================================================================
const EXT_PICK: readonly [V3, V3][] = [['C', 'B'], ['C', 'A'], ['B', 'C'], ['B', 'A'], ['A', 'B'], ['A', 'C']];
const other3 = (x: V3, y: V3): V3 => (['A', 'B', 'C'] as V3[]).find(z => z !== x && z !== y)!;
const extFind: Gen = G((R, n) => {
  const [a, b, c] = triAngles(R, 36, 0.2);
  const [Y, X] = pick(R, EXT_PICK), Z = other3(Y, X);
  const V = pick(R, (['A', 'B', 'C'] as V3[]).filter(v => v !== Y));
  const W = (['A', 'B', 'C'] as V3[]).find(v => v !== Y && v !== V)!;
  const letters = shuffle(R, ['a', 'b', 'c']);
  const base = tri({ A: a, B: b, C: c, rot: int(R, -30, 30), mirror: R() < 0.5, size: 640, ext: { at: Y, from: X, mark: { text: letters[0]!, col: 'pick', id: 'e' }, len: 300 } });
  const P = base.P;
  // b: the reflex angle outside the triangle at another vertex; c: an angle between a side and a stray ray
  const reflex: FAngle = { id: 'r', v: P[V], p: P[Y], q: P[W], reflex: true, text: letters[1], col: 'pick', r: 40 };
  // the stray ray leaves W 50° outside side WV (turned away from the triangle): an outside angle, not an exterior one
  const u = unit(sub(P[V], P[W])), w = unit(sub(P[Y], P[W])), turn = u[0] * w[1] - u[1] * w[0] > 0 ? -50 : 50;
  const strayEnd = add(P[W], mul(rotP(u, turn), 260));
  const stray: FSeg = { id: 'stray', a: P[W], b: strayEnd, arrows: 1 };
  const strayAng: FAngle = { id: 's', v: P[W], p: strayEnd, q: add(P[W], mul(u, 100)), text: letters[2], col: 'pick' };
  void Z;
  base.fig.segs.push(stray); base.fig.angles.push(reflex, strayAng);
  base.fig.pad = 110;
  const opts: Opt[] = [
    { t: `Angle ${letters[0]}`, ok: true },
    { t: `Angle ${letters[1]}`, mc: MC.extReflex, say: `Angle ${letters[1]} goes all the way around the outside of a corner. An exterior angle is the small angle between one side and the EXTENSION of the next side.` },
    { t: `Angle ${letters[2]}`, mc: MC.anyOutside, say: `Angle ${letters[2]} is outside, but its ray is not an extension of a side. An exterior angle needs a side extended straight past a vertex.` },
  ];
  return choiceItem(R, {
    id: `extFind-${n}`, family: 'extFind', prompt: pick(R, ['Which marked angle is an exterior angle of the triangle?', 'One marked angle is an exterior angle of the triangle. Which one?', 'Pick the exterior angle of the triangle.']),
    givens: [], work: [], board: `\\text{exterior angle: } ${letters.join(',\\ ')}\\,?`,
    solution: ['An exterior angle is made by extending one side straight past a vertex.', `It sits between that extension and the other side at the vertex: angle ${letters[0]}.`],
    picture: { fig: base.fig, focus: ['e'] },
  }, opts.sort((p, q) => p.t.localeCompare(q.t)), 'Yes: one side extended, and the next side.', 'Look for a side extended straight past a vertex.', true);
});

/** a named triangle with side XY extended past Y to a new point */
function extNamed(R: () => number, ang3: [number, number, number], marks: Parameters<typeof tri>[0]['marks'], extMark?: { text: string; alt?: string; col: MarkCol; id?: string }) {
  const N = pick(R, TRI_NAMES), Dn = EXT_LETTER[N[0]]!;
  const [Y, X] = pick(R, EXT_PICK), Z = other3(Y, X);
  const nm = (v: V3) => N[['A', 'B', 'C'].indexOf(v)]!;
  const T = tri({ A: ang3[0], B: ang3[1], C: ang3[2], rot: int(R, -30, 30), mirror: R() < 0.5, size: 560, names: N, marks, ext: { at: Y, from: X, mark: extMark, name: Dn, len: 280 } });
  return { T, N, Dn, X, Y, Z, nm };
}
const extName: Gen = G((R, n) => {
  const [a, b, c] = triAngles(R, 34, 0.2);
  const E = extNamed(R, [a, b, c], {});
  const { nm, X, Y, Z, Dn } = E;
  const x = nm(X), y = nm(Y), z = nm(Z);
  const opts: Opt[] = [
    { t: `∠${z}${y}${Dn}`, ok: true },
    { t: `∠${z}${y}${x}`, say: `∠${z}${y}${x} is the interior angle at ${y}. The exterior angle uses the extension ${y}${Dn}.` },
    { t: `∠${x}${y}${Dn}`, mc: MC.extReflex, say: `${x}, ${y} and ${Dn} are on one straight line: ∠${x}${y}${Dn} is a straight angle (180°), not an exterior angle.` },
    { t: `∠${y}${z}${Dn}`, mc: MC.anyOutside, say: `∠${y}${z}${Dn} has its vertex at ${z}, and ${z}${Dn} is not a side or an extension. Being outside is not enough.` },
  ];
  return choiceItem(R, {
    id: `extName-${n}`, family: 'extName', prompt: `Side ${x}${y} is extended past ${y} to ${Dn}. Which angle is the exterior angle at ${y}?`,
    givens: [`${x}${y} \\text{ extended to } ${Dn}`], work: [], board: `\\overline{${x}${y}} \\to ${Dn}:\\ \\text{exterior angle at } ${y}?`,
    solution: [`The extension is ray ${y}${Dn}. The other side at ${y} is ${y}${z}.`, `So the exterior angle at ${y} is ${Sx(`∠${z}${y}${Dn}`)}.`],
    picture: { fig: E.T.fig },
  }, opts, `Yes: ∠${z}${y}${Dn}.`, `Use the extension ${y}${Dn} and the other side at ${y}.`);
});

const extRemote: Gen = G((R, n) => {
  const [a, b, c] = triAngles(R, 34, 0.2);
  const E = extNamed(R, [a, b, c], {}, { text: '', col: 'pick', id: 'e' });
  const { nm, X, Y, Z, Dn } = E, x = nm(X), y = nm(Y), z = nm(Z);
  const ext = `∠${z}${y}${Dn}`, adj = `∠${x}${y}${z}`;
  const opts: Opt[] = [
    { t: `∠${x} + ∠${z}`, ok: true },
    { t: `∠${x} + ${adj}`, mc: MC.extUsesAdj, say: `${adj} is right next to the exterior angle (a linear pair). Use the two angles FAR from it: ∠${x} and ∠${z}.` },
    { t: `∠${x} + ∠${z} + ${adj}`, mc: MC.extUsesAdj, say: 'All three interior angles add to 180°. The exterior angle uses only the two remote ones.' },
    { t: adj, mc: MC.extAdjEqual, say: `${adj} and ${ext} together make a straight line: they add to 180°, they are not equal.` },
  ];
  return choiceItem(R, {
    id: `extRemote-${n}`, family: 'extRemote', prompt: `${ext} is an exterior angle of triangle ${x}${y}${z}. It is equal to which sum?`,
    givens: [`${tang(z + y + Dn)}`], work: [`${tang(z + y + Dn)} = ${tang(x)} + ${tang(z)}`], board: `${tang(z + y + Dn)} = \\,?`,
    solution: [`The remote interior angles are the two not next to ${ext}: ∠${x} and ∠${z}.`, `${ext} = ∠${x} + ∠${z}.`],
    picture: { fig: E.T.fig, focus: ['e'] },
  }, opts, `Yes: ${ext} = ∠${x} + ∠${z}.`, 'Use the two interior angles far from the exterior angle.');
});

const extWrite: Gen = G((R, n) => {
  const [a, b, c] = triAngles(R, 34, 0.2), vals = { A: a, B: b, C: c };
  const [Y, X] = pick(R, EXT_PICK), Z = other3(Y, X);
  const marks = { [X]: { text: d(vals[X]), col: 'second' as MarkCol }, [Z]: { text: d(vals[Z]), col: 'second' as MarkCol } } as Partial<Record<V3, TriMark>>;
  const T = tri({ A: a, B: b, C: c, rot: int(R, -30, 30), mirror: R() < 0.5, size: 580, marks, ext: { at: Y, from: X, mark: { text: 'x', col: 'link', id: 'x', alt: d(180 - vals[Y]) }, len: 280 } });
  const p = vals[X], q = vals[Z], yv = vals[Y];
  const opts: Opt[] = [
    { t: `${d(p)} + ${d(q)}`, ok: true },
    { t: `180° − ${d(p)} − ${d(q)}`, mc: MC.extAdjEqual, say: `180° − ${d(p)} − ${d(q)} is the interior angle next to x. x is the angle on the other side of the straight line.` },
    { t: `180° − ${d(q)}`, mc: MC.assumes180, say: 'x is not on a straight line with that angle. Use the two remote interior angles.' },
    { t: `${d(p)} + ${d(q)} + ${d(yv)}`, mc: MC.extUsesAdj, say: 'That adds all three interior angles (180°). x uses only the two far ones.' },
  ];
  return choiceItem(R, {
    id: `extWrite-${n}`, family: 'extWrite', prompt: `Which expression equals the exterior angle ${Sx('x')}?`,
    givens: [`${D(p)},\\ ${D(q)}`], work: [`x = ${D(p)} + ${D(q)}`], board: `${D(p)},\\ ${D(q)},\\ x = \\,?`,
    solution: ['An exterior angle equals the sum of the two remote interior angles.', `x = ${d(p)} + ${d(q)}.`],
    picture: { fig: T.fig, focus: ['x'] },
  }, opts, `Yes: x = ${d(p)} + ${d(q)}.`, 'An exterior angle = the two far interior angles added.');
});

const extValue: Gen = G((R, n) => {
  const [a, b, c] = triAngles(R, 38, 0.2), vals = { A: a, B: b, C: c };
  const [Y, X] = pick(R, EXT_PICK), Z = other3(Y, X), p = vals[X], q = vals[Z], ans = p + q;
  const T = tri({ A: a, B: b, C: c, rot: int(R, -30, 30), mirror: R() < 0.5, size: 580, marks: { [X]: { text: d(p), col: 'second' }, [Z]: { text: d(q), col: 'second' }, [Y]: { text: '', col: 'plain', id: 'adj' } }, ext: { at: Y, from: X, mark: { text: 'x', alt: d(ans), col: 'link', id: 'x' }, len: 280 } });
  return numItem({
    id: `extValue-${n}`, family: 'extValue', prompt: `Find the exterior angle ${Sx('x')}.`,
    givens: [`${D(p)},\\ ${D(q)}`], work: [`x = ${D(p)} + ${D(q)}`, `x = ${D(ans)}`],
    solution: ['An exterior angle equals the sum of the two remote interior angles.', `x = ${d(p)} + ${d(q)} = ${d(ans)}.`],
    picture: { fig: T.fig, reveal: ['x'], focus: ['x', X, Z] },
  }, ans, [
    [180 - ans, MC.extAdjEqual, `${d(180 - ans)} is the interior angle next to x. x is its partner on the straight line: 180° − ${d(180 - ans)}.`],
    [180 - p, MC.assumes180, 'x and that angle do not make a straight line. Add the two remote interior angles.'],
    [180 - q, MC.assumes180, 'x and that angle do not make a straight line. Add the two remote interior angles.'],
    [180, MC.extUsesAdj, 'That adds all three interior angles. x uses only the two remote ones.'],
  ], `Yes: x = ${d(ans)}.`, 'Add the two interior angles far from x.');
});

const extRemoteMissing: Gen = G((R, n) => {
  const [a, b, c] = triAngles(R, 38, 0.2);
  const vals = { A: a, B: b, C: c };
  const [Y, X] = pick(R, EXT_PICK), Z = other3(Y, X), E = 180 - vals[Y], p = vals[X], ans = vals[Z];
  const T = tri({ A: a, B: b, C: c, rot: int(R, -30, 30), mirror: R() < 0.5, size: 580, marks: { [X]: { text: d(p), col: 'second' }, [Z]: { text: 'y', alt: d(ans), col: 'link', id: 'y' } }, ext: { at: Y, from: X, mark: { text: d(E), col: 'first', id: 'E' }, len: 280 } });
  return numItem({
    id: `extRemoteMissing-${n}`, family: 'extRemoteMissing', prompt: `The exterior angle is ${A(d(E))} and one remote interior angle is ${A(d(p))}. Find ${Sx('y')}.`,
    givens: [`${D(E)} = ${D(p)} + y`], work: [`y = ${D(E)} - ${D(p)}`, `y = ${D(ans)}`],
    solution: [`The exterior angle equals the two remote interior angles: ${d(E)} = ${d(p)} + y.`, `y = ${d(E)} − ${d(p)} = ${d(ans)}.`],
    picture: { fig: T.fig, reveal: ['y'], focus: ['y', 'E'] },
  }, ans, [
    [180 - p, MC.assumes180, `The whole here is the exterior angle, ${d(E)}, not 180°: y = ${d(E)} − ${d(p)}.`],
    [180 - E - p, MC.assumes180, `${d(E)} already equals ${d(p)} + y. Subtract only ${d(p)} from ${d(E)}.`],
    [180 - E, MC.extUsesAdj, `${d(180 - E)} is the interior angle next to the exterior angle. y is a remote one.`],
    [E + p, undefined, `y is a part of ${d(E)}: subtract, ${d(E)} − ${d(p)}.`],
  ], `Yes: y = ${d(ans)}.`, `The exterior angle = ${d(p)} + y.`);
});

// =====================================================================================================
// 12. all eight from one
// =====================================================================================================
const allEight: Gen = G((R, n) => {
  const N = pick(R, NAMESETS), g = pick(R, SLOTS), k = pick(R, SLOTS.filter(s => s !== g));
  let v: number; do v = int(R, 40, 140); while (Math.abs(v - 90) < 10);
  const tau = tauFor(g, v), ans = slotMeasure(k, tau);
  const marks = numbered(); marks[g] = { text: String(g), col: 'second', id: `s${g}` }; marks[k] = { text: String(k), col: 'link', id: `s${k}` };
  const T = trans({ tau, ...place(R, 0.3), par: true, names: { l: N.l, m: N.m, t: N.t }, marks });
  const sameSize = near(ans, v), r = relation(g, k);
  return numItem({
    id: `allEight-${n}`, family: 'allEight', prompt: `${iN(N.l)} ∥ ${iN(N.m)} and ${ang(g)} = ${A(d(v))}. Find ${Sx(ang(k))}.`,
    givens: [parT(N), `${tang(g)} = ${D(v)}`], work: [`${tang(k)} = ${sameSize ? D(v) : `180^\\circ - ${D(v)} = ${D(ans)}`}`],
    board: `${parT(N)},\\ ${tang(g)} = ${D(v)},\\ ${tang(k)} = \\,?`,
    solution: [`At each crossing two sizes repeat: ${d(v)} and 180° − ${d(v)} = ${d(180 - v)}.`, 'The lines are parallel, so the other crossing has the same two sizes in the same places.',
      `${ang(k)} is ${sameSize ? 'the same size as' : 'the other size from'} ${ang(g)}: ${ang(k)} = ${d(ans)}${r !== 'none' ? ` (${REL_NAME[r]})` : ''}.`],
    picture: { fig: T.fig, focus: [`s${g}`, `s${k}`] },
  }, ans, [[180 - ans, sameSize ? MC.congSupp : MC.suppEqual, sameSize ? `${ang(k)} matches ${ang(g)} in size: both ${v < 90 ? 'small' : 'wide'}.` : `${ang(k)} is ${v < 90 ? 'wide' : 'small'} while ${ang(g)} is ${v < 90 ? 'small' : 'wide'}: they add to 180°.`]],
  `Yes: ${ang(k)} = ${d(ans)}.`, 'Only two sizes appear: the given one and 180° minus it.');
});

// =====================================================================================================
// 14. matching arcs
// =====================================================================================================
const isoBase: Gen = G((R, n) => {
  const mode = pick(R, ['arcs', 'arcs', 'written', 'all'] as const);
  if (mode === 'all') {
    const T = tri({ A: 60, B: 60, C: 60, rot: int(R, -60, 60), size: 560, marks: { A: { arcs: 1, col: 'second', text: '' }, B: { arcs: 1, col: 'second', text: '' }, C: { arcs: 1, col: 'link', text: 'x', alt: '60°', id: 'x' } } });
    const nm = pick(R, TRI_NAMES);
    return numItem({
      id: `isoBase-${n}`, family: 'isoBase', prompt: `All three angles of triangle ${nm.join('')} carry the same arc mark. Find ${Sx('x')}.`,
      givens: [`\\text{three equal angles}`], work: ['3x = 180^\\circ', 'x = 60^\\circ'], board: `${nm.join('')}:\\ 3\\text{ equal angles}`,
      solution: ['The matching arcs say the three angles are equal.', 'Three equal angles share 180°: x = 180° ÷ 3 = 60°.'],
      picture: { fig: T.fig, reveal: ['x'], focus: ['x'] },
    }, 60, [[180, MC.halve, 'The three equal angles SHARE 180°: divide by 3.'], [90, MC.halve, 'There are three equal angles, not two: 180° ÷ 3.']], 'Yes: 60° each.', 'Three equal angles share 180°.');
  }
  const apex = 2 * int(R, 12, 64), base = (180 - apex) / 2;
  const N = pick(R, TRI_NAMES);
  const arcs = mode === 'arcs' ? 2 : undefined;
  const T = tri({ A: apex, B: base, C: base, rot: int(R, -45, 45), mirror: R() < 0.5, size: 600, names: mode === 'written' ? N : null,
    marks: { A: { text: d(apex), col: 'second' }, B: { text: 'x', alt: d(base), col: 'link', id: 'x', arcs }, C: { text: '', col: 'link', arcs, id: 'C' } } });
  return numItem({
    id: `isoBase-${n}`, family: 'isoBase',
    prompt: mode === 'written' ? `In triangle ${N.join('')}, m∠${N[1]} = m∠${N[2]} and m∠${N[0]} = ${A(d(apex))}. Find ${Sx('x')}.` : `The matching arcs mark two equal angles. The third angle is ${A(d(apex))}. Find ${Sx('x')}.`,
    givens: mode === 'written' ? [`m\\angle ${N[1]} = m\\angle ${N[2]}`, `m\\angle ${N[0]} = ${D(apex)}`] : [`${D(apex)}`, '\\text{two equal angles}'],
    work: [`2x = 180^\\circ - ${D(apex)} = ${D(180 - apex)}`, `x = ${D(base)}`],
    solution: [`The two equal angles share what is left: 180° − ${d(apex)} = ${d(180 - apex)}.`, `Each one is half: x = ${d(180 - apex)} ÷ 2 = ${d(base)}.`],
    picture: { fig: T.fig, reveal: ['x'], focus: ['x', 'C'] },
  }, base, [[180 - apex, MC.halve, `${d(180 - apex)} is for BOTH equal angles together. Halve it.`], [apex, MC.copyUnmarked, 'The arcs mark the two equal angles; the third angle is not one of them.']],
  `Yes: x = ${d(base)}.`, 'The two equal angles share 180° minus the third.');
});

const isoApex: Gen = G((R, n) => {
  const base = int(R, 30, 78), apex = 180 - 2 * base;
  const T = tri({ A: apex, B: base, C: base, rot: int(R, -45, 45), mirror: R() < 0.5, size: 600,
    marks: { A: { text: 'x', alt: d(apex), col: 'link', id: 'x' }, B: { text: d(base), col: 'second', arcs: 2 }, C: { text: '', col: 'second', arcs: 2, id: 'C' } } });
  return numItem({
    id: `isoApex-${n}`, family: 'isoApex', prompt: `The matching arcs mark two equal angles. One of them is ${A(d(base))}. Find ${Sx('x')}.`,
    givens: [`${D(base)}`, '\\text{two equal angles}'], work: [`x = 180^\\circ - 2 \\times ${D(base)}`, `x = ${D(apex)}`],
    solution: [`The arcs say the other marked angle is also ${d(base)}.`, `x = 180° − ${d(base)} − ${d(base)} = ${d(apex)}.`],
    picture: { fig: T.fig, reveal: ['x'], focus: ['x', 'B', 'C'] },
  }, apex, [[base, MC.copyUnmarked, `x has no arc mark: it is not one of the equal pair.`], [180 - base, MC.oneKnown, `The arcs give you a second ${d(base)} angle. Take both away from 180°.`], [(180 - base) / 2, MC.oneKnown, 'Two angles are ' + d(base) + ': x = 180° − 2 × ' + d(base) + '.']],
  `Yes: x = ${d(apex)}.`, 'Both marked angles are ' + d(base) + '.');
});

// =====================================================================================================
// 16, 17, 20. polygons
// =====================================================================================================
const wob = (R: () => number, n: number) => Array.from({ length: n }, () => R() * 2 - 1);
const polyTriangles: Gen = G((R, n) => {
  const k = int(R, 4, 10), Lt = pick(R, ['A', 'B', 'P', 'Q', 'K', 'M']), P = poly({ n: k, wobble: wob(R, k), diagonals: true, names: [Lt], size: 740 });
  const tf = Array.from({ length: k - 2 }, (_, i) => `t${i + 1}`);
  return numItem({
    id: `polyTriangles-${n}`, family: 'polyTriangles', prompt: `Draw every diagonal from vertex ${Lt} of this ${POLY_NAME[k]} (${k} sides). How many triangles do you get?`,
    givens: [`n = ${k}`], work: [`${k} - 2 = ${k - 2}\\ \\text{triangles}`, `${k - 2} \\times 180^\\circ = ${DT(pSum(k))}`],
    board: `\\text{${POLY_NAME[k]}},\\ n = ${k}`,
    solution: [`From ${Lt}, diagonals go to every vertex except ${Lt} and its two neighbors: ${k - 3} diagonals.`, `They cut the ${POLY_NAME[k]} into ${k} − 2 = ${k - 2} triangles.`],
    picture: { fig: P.fig, fills: tf },
  }, k - 2, [[k, MC.nTimes180, `The two sides at ${Lt} are not diagonals, so the triangles number ${k} − 2.`], [k - 3, undefined, `${k - 3} is the number of diagonals; they make one more triangle than that.`]],
  `Yes: ${k - 2} triangles.`, `Count the triangles the diagonals from ${Lt} make.`, 'triangles');
});

const polySum: Gen = G((R, n) => {
  const k = int(R, 4, 10), centre = R() < 0.3;
  const P = poly({ n: k, wobble: wob(R, k), diagonals: !centre, centre, size: 740, names: centre ? null : ['A'] });
  const ans = pSum(k);
  return numItem({
    id: `polySum-${n}`, family: 'polySum',
    prompt: centre ? `Lines from a point inside cut this ${POLY_NAME[k]} into ${k} triangles. What is the sum of its interior angles?` : `What is the sum of the interior angles of this ${POLY_NAME[k]} (${k} sides)?`,
    givens: [`n = ${k}`], work: centre ? [`${k} \\times 180^\\circ - 360^\\circ = ${DT(ans)}`] : [`(${k} - 2) \\times 180^\\circ = ${DT(ans)}`],
    board: `\\text{${POLY_NAME[k]}}:\\ \\text{sum} = \\,?`,
    solution: centre ? [`${k} triangles give ${k} × 180° = ${d(k * 180)}.`, `But the angles around the inside point (360°) are not angles of the ${POLY_NAME[k]}: ${d(k * 180)} − 360° = ${d(ans)}.`]
      : [`Diagonals from one vertex split it into ${k} − 2 = ${k - 2} triangles.`, `Their angles make up the polygon’s angles: ${k - 2} × 180° = ${d(ans)}.`],
    picture: { fig: P.fig, fills: centre ? [] : Array.from({ length: k - 2 }, (_, i) => `t${i + 1}`) },
  }, ans, [
    [k * 180, MC.nTimes180, centre ? 'The full turn around the inside point (360°) is not part of the polygon’s angles: subtract it.' : `Only ${k - 2} triangles fit, not ${k}.`],
    [360, k === 4 ? undefined : MC.const180, `360° is only right for 4 sides. More sides, more triangles.`],
    [180, MC.const180, '180° is only the triangle. Count the triangles inside.'],
  ], `Yes: ${d(ans)}.`, 'How many triangles fit inside?');
});

const polySides: Gen = (R, n, sg) => {
  const k = int(R, 5, 12), S = pSum(k), eqn = sg === 'polygon-angle-equations';
  const SC = S.toLocaleString('en-US').replace(',', '{,}');
  return numItem({
    id: `polySides-${n}`, family: 'polySides', prompt: `${pick(R, ['A polygon’s interior angles add to', 'The interior angle sum of a polygon is', `${pick(R, PEOPLE)} adds up all the interior angles of a polygon and gets`])} ${A(d(S.toLocaleString('en-US')))}. How many sides does it have?`,
    givens: eqn ? [`180(n - 2) = ${S.toLocaleString('en-US').replace(',', '{,}')}`] : ['n = 3:\\ 180^\\circ', 'n = 4:\\ 360^\\circ', '\\text{each extra side: } +180^\\circ', `\\text{sum} = ${D(S.toLocaleString('en-US').replace(',', '{,}'))}`],
    work: eqn ? [`n - 2 = ${SC} \\div 180 = ${k - 2}`, `n = ${k}`] : [`${SC} \\div 180 = ${k - 2}\\ \\text{triangles}`, `n = ${k - 2} + 2 = ${k}`],
    board: `\\text{sum} = ${D(S.toLocaleString('en-US').replace(',', '{,}'))},\\ n = \\,?`,
    solution: [`${d(S.toLocaleString('en-US'))} ÷ 180° = ${k - 2}: that is the number of triangles.`, `A polygon has 2 more sides than triangles: n = ${k - 2} + 2 = ${k}.`],
  }, k, [[k - 2, MC.intermediate, `${k - 2} is the number of triangles (n − 2). Add 2 to get the sides.`], [k - 1, undefined, `Check: (${k - 1} − 2) × 180 = ${pSum(k - 1)}, not ${S}.`]],
  `Yes: ${k} sides.`, 'Divide by 180° to count triangles, then add 2.', 'sides');
};

const REG = [4, 5, 6, 8, 9, 10, 12];
const regAngle: Gen = G((R, n) => {
  const k = pick(R, REG), ans = pSum(k) / k;
  const j = int(R, 0, k - 1), Lt = 'ABCDEFGHJKLM'.slice(0, k).split('');
  const marks = Array.from({ length: k }, (_, i) => i === j ? { at: i, text: 'x', alt: d(ans), col: 'link' as MarkCol, id: 'x' } : { at: i, text: '', col: 'second' as MarkCol });
  const P = poly({ n: k, regular: true, size: 720, marks, names: Lt });
  return numItem({
    id: `regAngle-${n}`, family: 'regAngle', prompt: `This is a regular ${POLY_NAME[k]} (${k} equal sides, ${k} equal angles). Find ${Sx('x')} = m∠${Lt[j]}.`,
    givens: [`n = ${k}`, '\\text{regular}'], work: [`\\text{sum} = (${k} - 2) \\times 180^\\circ = ${DT(pSum(k))}`, `x = ${pSum(k)} \\div ${k} = ${D(ans)}`],
    board: `\\text{regular ${POLY_NAME[k]}}:\\ x = \\,?`,
    solution: [`Angle sum: (${k} − 2) × 180° = ${d(pSum(k))}.`, `${k} equal angles share it: x = ${d(pSum(k))} ÷ ${k} = ${d(ans)}.`],
    picture: { fig: P.fig, reveal: ['x'], focus: ['x'] },
  }, ans, [[180, MC.divWrong, `Share the sum among ALL ${k} angles: divide by ${k}, not by ${k - 2}.`], [pSum(k), undefined, `${d(pSum(k))} is all ${k} angles together. Share it equally.`], [360 / k, undefined, `${d(360 / k)} is the turn at each corner (the exterior angle). The interior angle is 180° minus that.`]],
  `Yes: x = ${d(ans)}.`, 'Find the angle sum, then share it equally.');
});

const regSides: Gen = G((R, n) => {
  const k = pick(R, REG), a = pSum(k) / k;
  // just one corner of the polygon: two sides meeting at the given angle (the shape would give the count away)
  const V: [number, number] = [0, -160], p = add(V, mul(dirv(90 + a / 2), 420)), q = add(V, mul(dirv(90 - a / 2), 420));
  const fig: Fig = { segs: [{ a: V, b: p }, { a: V, b: q }], angles: [{ id: 'a', v: V, p, q, text: d(a), col: 'second' }], points: [], fills: [], words: [{ at: [0, -330], text: 'one corner' }] };
  return numItem({
    id: `regSides-${n}`, family: 'regSides', prompt: `Each interior angle of ${pick(R, ['a regular polygon', 'a regular polygon tile', 'a picture frame shaped like a regular polygon', 'a regular polygon garden bed'])} is ${A(d(a))}. How many sides does it have?`,
    givens: [`\\text{each angle} = ${D(a)}`], work: [`(${k} - 2) \\times 180 \\div ${k} = ${a}`, `n = ${k}`],
    board: `\\text{regular},\\ ${D(a)}\\text{ each}:\\ n = \\,?`,
    solution: [`Try values: each angle = (n − 2) × 180° ÷ n.`, `n = ${k}: (${k} − 2) × 180° ÷ ${k} = ${d(a)}. So it has ${k} sides.`],
    picture: { fig },
  }, k, [[k - 2, MC.intermediate, `${k - 2} is n − 2 (the triangles). The polygon has 2 more sides.`], [Math.round(360 / a), undefined, `Check with the formula: (n − 2) × 180 ÷ n should give ${a}.`]],
  `Yes: ${k} sides.`, 'Try n in (n − 2) × 180 ÷ n.', 'sides');
});

const regNot: Gen = G((R, n) => {
  const k = int(R, 5, 8), regular = R() < 0.4, each = pSum(k) / k;
  const Lt = 'ABCDEFGH'.slice(0, k).split(''), j = int(R, 0, k - 1);
  const P = poly({ n: k, regular, names: Lt, wobble: regular ? undefined : wob(R, k).map(x => x * 1.1), size: 720, marks: regular ? Array.from({ length: k }, (_, i) => ({ at: i, text: i === j ? '?' : '', col: (i === j ? 'pick' : 'second') as MarkCol })) : [{ at: j, text: '?', col: 'pick', id: 'q' }] });
  const eachS = Number.isInteger(each) ? d(each) : `${d(Math.floor(each))}…`;
  const opts: Opt[] = regular ? [
    { t: `Yes: it is regular, so each is ${d(pSum(k))} ÷ ${k}`, ok: true },
    { t: 'No: equal sides do not make equal angles', mc: MC.allEqual, say: 'Here the matching arcs mark every angle equal: the polygon is regular.' },
    { t: `No: its angles add to 360°`, mc: MC.const180, say: `Only quadrilaterals add to 360°. A ${POLY_NAME[k]} adds to ${d(pSum(k))}.` },
  ] : [
    { t: `No: the angles add to ${d(pSum(k))}, but they need not be equal`, ok: true },
    { t: `Yes: every ${POLY_NAME[k]} has ${eachS} angles`, mc: MC.allEqual, say: 'Sharing equally only works when the angles are marked equal (a regular polygon). These are not.' },
    { t: 'No: its angles add to 360°', mc: MC.const180, say: `A ${POLY_NAME[k]} has ${k - 2} triangles inside: ${d(pSum(k))}.` },
  ];
  return choiceItem(R, {
    id: `regNot-${n}`, family: 'regNot', prompt: `${regular ? 'The matching arcs mark all the angles of this ' + POLY_NAME[k] + ' equal.' : 'The sides and angles of this ' + POLY_NAME[k] + ' are not marked equal.'} Is m∠${Lt[j]} = ${eachS}?`,
    givens: [`n = ${k}`], work: [`\\text{sum} = ${DT(pSum(k))}`], board: `\\text{${POLY_NAME[k]}}${regular ? '\\text{, all angles equal}' : ''}:\\ ${D(Number.isInteger(each) ? each : Math.floor(each))}\\text{ each?}`,
    solution: [`The angle sum of any ${POLY_NAME[k]} is (${k} − 2) × 180° = ${d(pSum(k))}.`, regular ? `All ${k} angles are equal, so each is ${d(pSum(k))} ÷ ${k}.` : 'Nothing makes the angles equal, so they can be different sizes.'],
    picture: { fig: P.fig },
  }, opts, 'Yes.', 'The sum is fixed. Are the angles marked equal?');
});

// =====================================================================================================
// 18. multi-step chains
// =====================================================================================================
const chainTri: Gen = G((R, n) => {
  const [a, b, c] = triAngles(R, 34, 0.15), N = pick(R, NAMESETS), cev = R() < 0.35;
  const T = tri({ A: a, B: b, C: c, rot: int(R, -10, 10), mirror: R() < 0.5, size: 560, fillBody: true,
    marks: { A: { text: 'x', alt: d(a), col: 'link', id: 'x' }, B: { text: 'y', alt: d(b), col: 'pick', id: 'y' }, C: { text: d(c), col: 'second', id: 'C' } },
    between: { l: N.l, m: N.m, topLeft: { text: d(b), col: 'second', id: 'g' } }, cevian: cev ? 0.5 + (R() - 0.5) * 0.3 : undefined });
  return numItem({
    id: `chainTri-${n}`, family: 'chainTri', prompt: `${iN(N.l)} ∥ ${iN(N.m)}. Find ${Sx('x')}. (Label the angle you find on the way: ${Sx('y')}.)`,
    givens: [parT(N), `${D(b)},\\ ${D(c)}`], work: [`y = ${D(b)}\\ \\text{(alt. int.)}`, `x = 180^\\circ - ${D(b)} - ${D(c)}`, `x = ${D(a)}`],
    solution: [`Step 1: y and the ${d(b)} angle are alternate interior angles (${iN(N.l)} ∥ ${iN(N.m)}): y = ${d(b)}.`, `Step 2: the triangle’s angles add to 180°: x = 180° − ${d(b)} − ${d(c)} = ${d(a)}.`],
    picture: { fig: T.fig, reveal: ['y', 'x'], focus: ['g', 'y', 'C', 'x'] },
  }, a, [
    [b, MC.intermediate, `${d(b)} is y, the angle on the way. Keep going: the triangle sum gives x.`],
    [180 - c, MC.oneKnown, `Use y too: x = 180° − y − ${d(c)}.`],
    [180 - b, MC.oneKnown, `Use the ${d(c)} angle too: x = 180° − ${d(b)} − ${d(c)}.`],
    [c, MC.invalidLink, `x and the ${d(c)} angle are not a matched pair. Find y first, then use the triangle sum.`],
  ], `Yes: x = ${d(a)}.`, 'First y (parallel lines), then the triangle sum.');
});

const chainExt: Gen = G((R, n) => {
  let a: number, b: number, c: number;
  do [a, b, c] = triAngles(R, 30, 0.2); while (b > 120);
  const e = 180 - b;
  const T = tri({ A: a, B: b, C: c, rot: int(R, -25, 25), mirror: R() < 0.5, size: 560,
    marks: { A: { text: d(a), col: 'second' }, B: { text: 'y', alt: d(b), col: 'pick', id: 'y' }, C: { text: 'x', alt: d(c), col: 'link', id: 'x' } },
    ext: { at: 'B', from: 'C', mark: { text: d(e), col: 'first', id: 'E' }, len: 300 } });
  return numItem({
    id: `chainExt-${n}`, family: 'chainExt', prompt: `Find ${Sx('x')}. (Find ${Sx('y')} on the way.)`,
    givens: [`${D(e)},\\ ${D(a)}`], work: [`y = 180^\\circ - ${D(e)} = ${D(b)}`, `x = 180^\\circ - ${D(a)} - ${D(b)}`, `x = ${D(c)}`],
    solution: [`Step 1: y and the ${d(e)} angle make a straight line: y = 180° − ${d(e)} = ${d(b)}.`, `Step 2: triangle sum: x = 180° − ${d(a)} − ${d(b)} = ${d(c)}.`],
    picture: { fig: T.fig, reveal: ['y', 'x'], focus: ['E', 'y', 'x'] },
  }, c, [
    [b, MC.intermediate, `${d(b)} is y. Keep going to x with the triangle sum.`],
    [180 - a, MC.oneKnown, `Take away y as well: x = 180° − ${d(a)} − y.`],
    [180 - a - e, MC.invalidLink, `The ${d(e)} angle is outside the triangle. Use y = 180° − ${d(e)} inside it.`],
    [e + a, undefined, `The exterior angle ${d(e)} equals ${d(a)} + x: subtract.`],
  ], `Yes: x = ${d(c)}.`, 'First y (straight line), then the triangle sum.');
});

const zigzag: Gen = G((R, n) => {
  const N = pick(R, NAMESETS), a = int(R, 24, 62), b = int(R, 24, 62), x = a + b;
  const vy = int(R, -50, 50), V: [number, number] = [170, vy], top = 230, bot = -230;
  const Ap = add(V, mul(dirv(180 - a), (top - vy) / Math.sin((a * Math.PI) / 180)));
  const Bp = add(V, mul(dirv(180 + b), (vy - bot) / Math.sin((b * Math.PI) / 180)));
  const H = 420;
  const fig0: Fig = {
    segs: [
      { id: 'l', a: [-H, top], b: [H, top], arrows: 2, par: 1, parAt: 0.84, name: N.l },
      { id: 'm', a: [-H, bot], b: [H, bot], arrows: 2, par: 1, parAt: 0.84, name: N.m },
      { id: 'va', a: Ap, b: V }, { id: 'vb', a: Bp, b: V },
      { id: 'help', a: [V[0] - 250, vy], b: [V[0] + 230, vy], dash: true, col: 'first', solve: true },
    ],
    angles: [
      { id: 'a', v: Ap, p: add(Ap, [100, 0]), q: V, text: d(a), col: 'second' },
      { id: 'b', v: Bp, p: add(Bp, [100, 0]), q: V, text: d(b), col: 'second' },
      { id: 'x', v: V, p: Ap, q: Bp, text: 'x', col: 'link', solve: 'hide' },
      { id: 'xa', v: V, p: add(V, [-100, 0]), q: Ap, text: d(a), col: 'second', solve: 'only', r: 80 },
      { id: 'xb', v: V, p: add(V, [-100, 0]), q: Bp, text: d(b), col: 'second', solve: 'only', r: 80 },
    ], points: [], fills: [],
  };
  const rot = int(R, -12, 12), mir = R() < 0.5;
  const fig = mapFig(fig0, p => rotP(mir ? [-p[0], p[1]] : p, rot));
  return numItem({
    id: `zigzag-${n}`, family: 'zigzag', prompt: `${iN(N.l)} ∥ ${iN(N.m)}. Find the angle ${Sx('x')} at the bend.`,
    givens: [parT(N), `${D(a)},\\ ${D(b)}`], work: [`x = ${D(a)} + ${D(b)}`, `x = ${D(x)}`],
    solution: [`Draw a third parallel line through the bend. It splits x into two parts.`, `Each part is an alternate interior angle: ${d(a)} and ${d(b)}. So x = ${d(a)} + ${d(b)} = ${d(x)}.`],
    picture: { fig, focus: ['a', 'b', 'xa', 'xb'] },
  }, x, [
    [180 - x, MC.invalidLink, 'There is no triangle here to use. Draw a parallel line through the bend: x splits into two alternate angles.'],
    [a, MC.intermediate, `That is only one part of x. The other part is ${d(b)}.`],
    [b, MC.intermediate, `That is only one part of x. The other part is ${d(a)}.`],
    [360 - x, undefined, 'x is the angle inside the bend, less than 180°.'],
  ], `Yes: x = ${d(x)}.`, 'Draw a parallel line through the bend.');
});

// =====================================================================================================
// 19, 20. expressions
// =====================================================================================================
const lin = (p: number, q: number) => `${p === 1 ? '' : p}x${q === 0 ? '' : q > 0 ? ` + ${q}` : ` − ${-q}`}`;
const linT = (p: number, q: number) => `${p === 1 ? '' : p}x${q === 0 ? '' : q > 0 ? ` + ${q}` : ` - ${-q}`}`;
const exprPair: Gen = G((R, n) => {
  const kind = pick(R, ['eqNum', 'suppNum', 'suppBoth', 'suppBoth'] as const);
  let p1 = 0, q1 = 0, p2 = 0, q2 = 0, x = 0, a1 = 0, a2 = 0;
  for (let i = 0; i < 400; i++) {
    x = int(R, 6, 32); p1 = int(R, 2, 5); q1 = int(R, -12, 40); a1 = p1 * x + q1;
    if (kind === 'eqNum') a2 = a1;
    else if (kind === 'suppNum') a2 = 180 - a1;
    else { a2 = 180 - a1; p2 = int(R, 1, 4); q2 = a2 - p2 * x; if (Math.abs(q2) > 45 || q2 === 0) continue; }
    if (a1 >= 40 && a1 <= 140 && Math.abs(a1 - 90) >= 10) break;
  }
  const eq = kind === 'eqNum', N = pick(R, NAMESETS);
  const r: Rel = eq ? pick(R, ['corresponding', 'altInt', 'vertical'] as const) : pick(R, ['ssInt', 'linear'] as const);
  const k = slotFor(R, r), p = SLOTS.find(t => relation(k, t) === r)!;
  const tau = tauFor(k, a1);
  const T = trans({ tau, ...place(R, 0.25), par: true, names: { l: N.l, m: N.m, t: N.t }, marks: { [k]: { text: '1', col: 'link', id: 'one', alt: d(a1) }, [p]: { text: '2', col: 'second', id: 'two', alt: kind === 'suppBoth' ? d(a2) : undefined } } });
  const e1 = `(${lin(p1, q1)})°`, e1T = `(${linT(p1, q1)})^\\circ`;
  const e2 = kind === 'suppBoth' ? `(${lin(p2, q2)})°` : d(a2), e2T = kind === 'suppBoth' ? `(${linT(p2, q2)})^\\circ` : D(a2);
  const equation = eq ? `${linT(p1, q1)} = ${a2}` : kind === 'suppNum' ? `${linT(p1, q1)} + ${a2} = 180` : `(${linT(p1, q1)}) + (${linT(p2, q2)}) = 180`;
  const collected = kind === 'suppBoth' ? `${p1 + p2}x ${q1 + q2 >= 0 ? '+' : '-'} ${Math.abs(q1 + q2)} = 180` : equation;
  // the x a kid gets by setting a supplementary pair equal, or by collecting only the x terms
  const xEqual = kind === 'suppNum' ? (a2 - q1) / p1 : kind === 'suppBoth' ? (q2 - q1) / (p1 - p2 || NaN) : NaN;
  const xSupp = eq ? (180 - a2 - q1) / p1 : NaN;
  const xCollect = kind === 'suppBoth' ? 180 / (p1 + p2) : NaN;
  return pairItem({
    id: `exprPair-${n}`, family: 'exprPair',
    prompt: `${iN(N.l)} ∥ ${iN(N.m)}. ${ang(1)} = ${A(e1)} and ${ang(2)} = ${A(e2)}. Find ${Sx('x')} and the measure of ${ang(1)}.`,
    givens: [parT(N), `${tang(1)} = ${e1T}`, `${tang(2)} = ${e2T}`],
    work: [equation, ...(kind === 'suppBoth' ? [collected] : []), `x = ${x}`, `${tang(1)} = ${D(a1)}`],
    solution: [`∠1 and ∠2 are ${REL_NAME[r]}, so they ${eq ? 'are equal' : 'add to 180°'}: ${equation.replace(/\\/g, '')}.`,
      ...(kind === 'suppBoth' ? [`Collect like terms: ${collected}.`] : []), `Solve: x = ${x}.`, `Then ∠1 = ${lin(p1, q1).replace('x', `(${x})`)} = ${d(a1)}.`],
    picture: { fig: T.fig, reveal: ['one', 'two'], focus: ['one', 'two'] },
  }, x, a1, '<i>x</i> =', '&ensp;m∠1 =', '°', (rx, ry) => {
    if (near(rx, x) && near(ry, x)) return { ok: false, mc: MC.reportsX, say: `x = ${x} is right. Now put it into ∠1: ${lin(p1, q1).replace('x', `(${x})`)}.` };
    if (near(rx, x)) return { ok: false, say: `x = ${x} is right. ∠1 = ${lin(p1, q1).replace('x', `(${x})`)} = ?` };
    if (near(rx, xEqual)) return { ok: false, mc: MC.suppEqual, say: `These angles are ${REL_NAME[r]}: they add to 180°, they are not equal.` };
    if (near(rx, xSupp)) return { ok: false, mc: MC.congSupp, say: `These angles are ${REL_NAME[r]}: they are equal, not supplementary.` };
    if (near(rx, xCollect)) return { ok: false, mc: MC.collectOne, say: `Collect the numbers too: ${q1} and ${q2} also go together.` };
    return null;
  }, `Yes: x = ${x}, so ∠1 = ${d(a1)}.`, `Name the pair: equal or adding to 180°? Write the equation and solve.`);
});

const exprTri: Gen = G((R, n) => {
  let ps: number[] = [], qs: number[] = [], x = 0, angs: number[] = [];
  for (let i = 0; i < 500; i++) {
    ps = [int(R, 1, 4), int(R, 1, 4), int(R, 1, 4)]; qs = [0, pick(R, [0, 10, 15, 20, -10]), pick(R, [0, 10, 20, -15, 30])];
    const P = ps[0]! + ps[1]! + ps[2]!, Q = qs[1]! + qs[2]!;
    if ((180 - Q) % P !== 0) continue;
    x = (180 - Q) / P; angs = ps.map((p, j) => p * x + qs[j]!);
    if (x >= 5 && angs.every(a => a >= 25) && new Set(angs).size === 3) break;
  }
  const N = pick(R, TRI_NAMES), order = shuffle(R, [0, 1, 2]);
  const vals = order.map(i => angs[i]!), pp = order.map(i => ps[i]!), qq = order.map(i => qs[i]!);
  const big = vals.indexOf(Math.max(...vals));
  const T = tri({ A: vals[0]!, B: vals[1]!, C: vals[2]!, rot: int(R, -30, 30), mirror: R() < 0.5, size: 600, names: N,
    marks: { A: { text: '', col: big === 0 ? 'link' : 'second', id: 'A' }, B: { text: '', col: big === 1 ? 'link' : 'second', id: 'B' }, C: { text: '', col: big === 2 ? 'link' : 'second', id: 'C' } } });
  const ex = (j: number) => `(${linT(pp[j]!, qq[j]!)})^\\circ`;
  const P = ps[0]! + ps[1]! + ps[2]!, Q = qs[1]! + qs[2]!;
  return pairItem({
    id: `exprTri-${n}`, family: 'exprTri',
    prompt: `In triangle ${N.join('')}: m∠${N[0]} = ${A(`(${lin(pp[0]!, qq[0]!)})°`)}, m∠${N[1]} = ${A(`(${lin(pp[1]!, qq[1]!)})°`)}, m∠${N[2]} = ${A(`(${lin(pp[2]!, qq[2]!)})°`)}. Find ${Sx('x')} and the largest angle, m∠${N[big]}.`,
    givens: [0, 1, 2].map(j => `m\\angle ${N[j]} = ${ex(j)}`),
    work: [`${P}x ${Q >= 0 ? '+' : '-'} ${Math.abs(Q)} = 180`, `x = ${x}`, `m\\angle ${N[big]} = ${D(vals[big]!)}`],
    solution: [`The three angles add to 180°: ${[0, 1, 2].map(j => `(${lin(pp[j]!, qq[j]!)})`).join(' + ')} = 180.`, `Collect like terms: ${P}x ${Q >= 0 ? '+' : '−'} ${Math.abs(Q)} = 180, so x = ${x}.`, `m∠${N[big]} = ${lin(pp[big]!, qq[big]!).replace('x', `(${x})`)} = ${d(vals[big]!)}.`],
    picture: { fig: T.fig, focus: ['A', 'B', 'C'] },
  }, x, vals[big]!, '<i>x</i> =', `&ensp;m∠${N[big]} =`, '°', (rx, ry) => {
    if (near(rx, x) && near(ry, x)) return { ok: false, mc: MC.reportsX, say: `x = ${x} is right. Now find m∠${N[big]} by putting ${x} in for x.` };
    if (near(rx, x)) return { ok: false, say: `x = ${x} is right. m∠${N[big]} = ${lin(pp[big]!, qq[big]!).replace('x', `(${x})`)} = ?` };
    if (Q !== 0 && near(rx, 180 / P)) return { ok: false, mc: MC.collectOne, say: `Collect the numbers too: ${Q} goes with the 180.` };
    if (near(rx, (360 - Q) / P)) return { ok: false, mc: MC.fixed360, say: 'A triangle’s angles add to 180°, not 360°.' };
    return null;
  }, `Yes: x = ${x}, m∠${N[big]} = ${d(vals[big]!)}.`, 'The three angles add to 180°. Collect like terms, then solve.');
});

const polyExpr: Gen = G((R, n) => {
  let k = 0, x = 0, coefs: number[] = [], nums: number[] = [];
  for (let i = 0; i < 800; i++) {
    k = int(R, 4, 7); const S = pSum(k), ne = int(R, 2, Math.min(3, k - 2));
    coefs = Array.from({ length: ne }, () => int(R, 1, 3)); if (new Set(coefs).size === 1 && ne > 1) coefs[0] = coefs[0] === 1 ? 2 : 1;
    x = int(R, 20, 60);
    const rest = S - coefs.reduce((s, c) => s + c * x, 0), m = k - ne;
    if (coefs.some(c => c * x < 40 || c * x > 170)) continue;
    nums = Array.from({ length: m - 1 }, () => 5 * int(R, 14, 32)); const last = rest - nums.reduce((s, v) => s + v, 0);
    if (last < 70 || last > 170) continue;
    nums.push(last); break;
  }
  const S = pSum(k), ne = coefs.length, Nm = 'ABCDEFG'.slice(0, k).split('');
  // vertex i: an expression for the first ne (shuffled around the shape), numbers for the rest
  const slots = shuffle(R, Array.from({ length: k }, (_, i) => i)), lab: string[] = Array(k).fill('');
  const isExpr: boolean[] = Array(k).fill(false);
  slots.forEach((v, j) => { if (j < ne) { lab[v] = `${coefs[j] === 1 ? '' : coefs[j]}x`; isExpr[v] = true; } else lab[v] = d(nums[j - ne]!); });
  const askV = slots[coefs.indexOf(Math.max(...coefs))]!, askC = Math.max(...coefs);
  const P = poly({ n: k, wobble: wob(R, k).map(w => w * 0.5), size: 760, names: Nm, nts: true,
    marks: Array.from({ length: k }, (_, i) => ({ at: i, text: lab[i]!, col: (i === askV ? 'link' : isExpr[i] ? 'pick' : 'second') as MarkCol, id: `v${i}`, alt: isExpr[i] ? d(Number(lab[i]!.replace('x', '') || 1) * x) : undefined })) });
  const sumC = coefs.reduce((s, c) => s + c, 0), sumN = nums.reduce((s, v) => s + v, 0);
  return pairItem({
    id: `polyExpr-${n}`, family: 'polyExpr', prompt: `Find ${Sx('x')} and m∠${Nm[askV]} in this ${POLY_NAME[k]}.`,
    givens: [`\\text{${POLY_NAME[k]}}`, ...Array.from({ length: Math.ceil(k / 3) }, (_, r) => Nm.slice(r * 3, r * 3 + 3).map((v, j) => `${v}{:}\\ ${lab[r * 3 + j]!.replace('°', '^\\circ')}`).join(',\\ '))],
    work: [`${sumC}x + ${sumN} = ${S}`, `${sumC}x = ${S - sumN}`, `x = ${x}`, `m\\angle ${Nm[askV]} = ${D(askC * x)}`],
    solution: [`A ${POLY_NAME[k]} has ${k} − 2 = ${k - 2} triangles inside: the angles add to ${d(S)}.`, `${sumC}x + ${sumN} = ${S}, so ${sumC}x = ${S - sumN} and x = ${x}.`, `m∠${Nm[askV]} = ${askC === 1 ? '' : askC}x = ${d(askC * x)}.`],
    picture: { fig: P.fig, reveal: Array.from({ length: k }, (_, i) => `v${i}`).filter((_, i) => isExpr[i]), focus: [`v${askV}`] },
  }, x, askC * x, '<i>x</i> =', `&ensp;m∠${Nm[askV]} =`, '°', (rx, ry) => {
    if (near(rx, x) && near(ry, x) && askC !== 1) return { ok: false, mc: MC.reportsX, say: `x = ${x} is right. m∠${Nm[askV]} is ${askC}x.` };
    if (near(rx, x)) return { ok: false, say: `x = ${x} is right. m∠${Nm[askV]} = ${askC}x = ?` };
    if (near(rx, (360 - sumN) / sumC)) return { ok: false, mc: MC.const180, say: `Only 4-sided shapes add to 360°. A ${POLY_NAME[k]} adds to ${d(S)}.` };
    if (near(rx, (k * 180 - sumN) / sumC)) return { ok: false, mc: MC.nTimes180, say: `A ${POLY_NAME[k]} holds ${k} − 2 triangles, not ${k}: ${d(S)}.` };
    return null;
  }, `Yes: x = ${x}, m∠${Nm[askV]} = ${d(askC * x)}.`, `First the angle sum of a ${POLY_NAME[k]}, then the equation.`);
});

// =====================================================================================================
// 21, 22. justify steps
// =====================================================================================================
const RNAME: Record<string, string> = { corresponding: 'Corresponding angles', altInt: 'Alternate interior angles', altExt: 'Alternate exterior angles', ssInt: 'Same-side interior angles', vertical: 'Vertical angles', linear: 'A linear pair' };
const reasonPick: Gen = G((R, n) => {
  const N = pick(R, NAMESETS), mode = pick(R, ['par', 'par', 'local', 'nopar'] as const);
  const r: Rel = mode === 'local' ? pick(R, ['vertical', 'linear'] as const) : pick(R, ['corresponding', 'altInt', 'altExt', 'ssInt'] as const);
  const k = slotFor(R, r), p = SLOTS.find(t => relation(k, t) === r)!, f = relFact(r);
  const par = mode !== 'nopar' && (mode === 'par' || R() < 0.5);
  const looks = mode === 'nopar' && R() < 0.6;
  const T = trans({ tau: randTau(R), delta: mode === 'nopar' ? pick(R, [-1, 1]) * (looks ? int(R, 3, 5) : int(R, 9, 12)) : 0, ...place(R, 0.3), par, names: { l: N.l, m: N.m, t: N.t },
    marks: { [k]: { text: String(k), col: 'pick', id: `s${k}` }, [p]: { text: String(p), col: 'pick', id: `s${p}` } } });
  const step = f.eq ? `${ang(k)} = ${ang(p)}` : `${ang(k)} + ${ang(p)} = 180°`, stepT = f.eq ? `${tang(k)} = ${tang(p)}` : `${tang(k)} + ${tang(p)} = 180^\\circ`;
  const wrongCands = (['corresponding', 'altInt', 'altExt', 'ssInt'] as Rel[]).filter(x => x !== r && relFact(x).eq === f.eq);
  const wrongRel: Rel = wrongCands.length ? pick(R, wrongCands) : f.eq ? 'vertical' : 'linear';
  let opts: Opt[];
  if (mode === 'par') opts = [
    { t: `${RNAME[r]}, and ${parH(N)} is given`, ok: true },
    { t: `${RNAME[r]}`, mc: MC.citesNoCheck, say: `${RNAME[r]} only ${f.eq ? 'match' : 'add to 180°'} when the lines are parallel. Name that condition too.` },
    { t: `${RNAME[wrongRel] ?? 'Vertical angles'}, and ${parH(N)} is given`, mc: MC.wrongName, say: `Check the position: ${ang(k)} and ${ang(p)} are ${REL_NAME[r]}.` },
    { t: f.eq ? 'They look equal' : 'They look like they add to 180°', mc: MC.appearance, say: 'Looks are not a reason. Name the pair and the condition.' },
  ];
  else if (mode === 'local') opts = [
    { t: RNAME[r]!, ok: true },
    { t: `${RNAME[r]}, but only because ${parH(N)}`, mc: MC.rejectNoPar, say: `${RNAME[r]} sit at one crossing: they need no parallel lines.` },
    { t: `${r === 'vertical' ? 'Corresponding angles' : 'Same-side interior angles'}${par ? `, and ${parH(N)} is given` : ''}`, mc: MC.wrongName, say: `Both angles are at the same crossing: ${REL_NAME[r]}.` },
    { t: f.eq ? 'They look equal' : 'They look like they add to 180°', mc: MC.appearance, say: 'Looks are not a reason. Name the pair.' },
  ];
  else opts = [
    { t: `No reason works: ${iN(N.l)} and ${iN(N.m)} are not given as parallel`, ok: true },
    { t: `${RNAME[r]}`, mc: MC.citesNoCheck, say: `${RNAME[r]} only ${f.eq ? 'match' : 'add to 180°'} at parallel lines, and that is not given.` },
    { t: `${RNAME[r]}: the lines look parallel`, mc: MC.appearance, say: 'Looking parallel is not being given as parallel.' },
    { t: f.eq ? 'Vertical angles' : 'A linear pair', mc: MC.wrongName, say: `${ang(k)} and ${ang(p)} are at different crossings, so they are not ${f.eq ? 'vertical angles' : 'a linear pair'}.` },
  ];
  return choiceItem(R, {
    id: `reasonPick-${n}`, family: 'reasonPick', prompt: `${par ? (R() < 0.5 ? `${parH(N)} is given. ` : 'The arrows mark the lines parallel. ') : 'Nothing says the lines are parallel. '}Which reason justifies the step ${step}?`,
    givens: [...(par ? [parT(N)] : []), stepT], work: [], board: `${par ? parT(N) + ',\\ ' : ''}${stepT}\\ \\text{why?}`,
    solution: [`${ang(k)} and ${ang(p)} are ${REL_NAME[r]}.`, mode === 'local' ? 'That needs no parallel lines.' : mode === 'par' ? `They ${f.eq ? 'are equal' : 'add to 180°'} BECAUSE the lines are parallel: name both.` : 'That fact needs parallel lines, and they are not given: the step is not justified.'],
    picture: { fig: T.fig, focus: [`s${k}`, `s${p}`] },
  }, opts, 'Yes.', 'A reason names the pair AND the condition it needs.');
});

const findBadStep: Gen = G((R, n, sg) => {
  if (sg === 'justify-angle-sum-equation' || (sg === undefined && R() < 0.5)) return sumSteps(R, n);
  const N = pick(R, NAMESETS);
  let v: number; do v = int(R, 40, 140); while (Math.abs(v - 90) < 10);
  const kind = pick(R, ['name', 'apply', 'cond', 'none'] as const);
  const g = pick(R, SLOTS), tau = tauFor(g, v);
  const r1 = pick(R, ['vertical', 'linear'] as const), s1 = SLOTS.find(t => relation(g, t) === r1)!;
  const crossRel = pick(R, (['corresponding', 'altInt', 'altExt', 'ssInt'] as Rel[]).filter(r => SLOTS.some(t => relation(s1, t) === r)));
  const s2c = SLOTS.find(t => relation(s1, t) === crossRel) ?? SLOTS.find(t => SLOT[t].c !== SLOT[s1].c)!;
  const r2 = relation(s1, s2c);
  const r3 = pick(R, ['vertical', 'linear'] as const), s3 = SLOTS.find(t => t !== s2c && SLOT[t].c === SLOT[s2c].c && relation(s2c, t) === r3)!;
  const val = (s: Slot) => slotMeasure(s, tau);
  const rs = (r: Rel) => r === 'vertical' ? 'vertical angles' : r === 'linear' ? 'linear pair' : `${REL_NAME[r]}, ${parH(N)}`;
  const steps = [
    { s: s1, v: val(s1), why: rs(relation(g, s1)) },
    { s: s2c, v: val(s2c), why: rs(r2) },
    { s: s3, v: val(s3), why: rs(relation(s2c, s3)) },
  ];
  const bad = kind === 'none' ? -1 : kind === 'cond' ? 1 : int(R, 0, 2);
  let mcMiss: string | undefined;
  if (kind === 'name') {
    const st = steps[bad]!, prev = bad === 0 ? g : steps[bad - 1]!.s, rr = relation(prev, st.s);
    const alt: Rel[] = rr === 'vertical' || rr === 'linear' ? (rr === 'vertical' ? ['corresponding', 'altInt'] : ['ssInt', 'corresponding']) : (['corresponding', 'altInt', 'altExt', 'ssInt'] as Rel[]).filter(x => x !== rr && relFact(x).eq === relFact(rr).eq);
    const wr = alt[0] ?? 'vertical';
    st.why = rs(wr); mcMiss = MC.wrongName;
  } else if (kind === 'apply') {
    const st = steps[bad]!; st.v = 180 - st.v;
    for (let j = bad + 1; j < 3; j++) { const prev = steps[j - 1]!.s; steps[j]!.v = relFact(relation(prev, steps[j]!.s)).eq ? steps[j - 1]!.v : 180 - steps[j - 1]!.v; }
    mcMiss = relFact(relation(bad === 0 ? g : steps[bad - 1]!.s, st.s)).eq ? MC.congSupp : MC.suppEqual;
  } else if (kind === 'cond') { steps[1]!.why = REL_NAME[r2]; mcMiss = MC.citesNoCheck; }
  const parGiven = kind !== 'cond';
  const T = trans({ tau, delta: parGiven ? 0 : pick(R, [-1, 1]) * int(R, 4, 7), ...place(R, 0.25), par: parGiven, names: { l: N.l, m: N.m, t: N.t },
    marks: { [g]: { text: d(v), col: 'second', id: 'g' }, ...Object.fromEntries(steps.map(st => [st.s, { text: String(st.s), col: 'pick' as MarkCol, id: `s${st.s}` }])) } });
  const list = steps.map((st, i) => `${i + 1}. ${ang(st.s)} = ${d(st.v)} (${st.why})`).join('<br>');
  const opts: Opt[] = [0, 1, 2].map(i => ({ t: `Step ${i + 1}`, ok: i === bad, say: i === bad ? undefined : `Step ${i + 1} is fine: ${steps[i]!.why}.` }));
  opts.push({ t: 'None: all three steps are right', ok: bad === -1, mc: bad === -1 ? undefined : mcMiss, say: bad === -1 ? undefined : `Check step ${bad + 1} again: the pair, the numbers, and the condition.` });
  const why = kind === 'name' ? `the pair is named wrong (it is ${REL_NAME[relation(bad === 0 ? g : steps[bad - 1]!.s, steps[bad]!.s)]})`
    : kind === 'apply' ? 'the measure is copied where it should be subtracted from 180° (or the other way round)'
      : kind === 'cond' ? `it uses ${REL_NAME[r2]}, but the lines are not given as parallel` : '';
  return choiceItem(R, {
    id: `findBadStep-${n}`, family: 'findBadStep', prompt: `${parGiven ? `${parH(N)}. ` : 'The lines are NOT marked parallel. '}The ${d(v)} angle is given. Which is the first wrong step?<br>${list}`,
    givens: [...(parGiven ? [parT(N)] : []), `${D(v)}\\ \\text{given}`], work: [], board: `${parGiven ? parT(N) + ',\\ ' : ''}${D(v)}:\\ \\text{which step is wrong?}`,
    solution: bad === -1 ? ['Each step names the right pair, uses it the right way, and the lines are parallel.', 'All three are right.'] : [`Step ${bad + 1}: ${why}.`, 'A step needs the right pair name, the right use (equal or 180°), and its condition.'],
    picture: { fig: T.fig, focus: steps.map(st => `s${st.s}`) },
  }, opts, 'Yes.', 'Check each step: pair name, equal or 180°, and is the condition given?', true);
});
/** the angle-sum version of "find the wrong step": a triangle with an exterior angle, angles numbered 1-4 */
function sumSteps(R: () => number, n: number): GeoItem {
  const F = sumFigure(R), { lab } = F;
  const good = [
    { t: `${ang(lab.a)} + ${ang(lab.b)} + ${ang(lab.c)} = 180°`, why: 'angles of one triangle' },
    { t: `${ang(lab.c)} + ${ang(lab.d)} = 180°`, why: 'linear pair' },
    { t: `${ang(lab.d)} = ${ang(lab.a)} + ${ang(lab.b)}`, why: 'exterior angle = the two remote interior angles' },
  ];
  const bads: { t: string; why: string; mc: string }[][] = [
    [{ t: `${ang(lab.a)} + ${ang(lab.b)} + ${ang(lab.d)} = 180°`, why: 'angles of one triangle', mc: MC.anyThree }],
    [{ t: `${ang(lab.b)} + ${ang(lab.d)} = 180°`, why: 'linear pair', mc: MC.citesNoCheck }, { t: `${ang(lab.a)} + ${ang(lab.d)} = 180°`, why: 'linear pair', mc: MC.citesNoCheck }],
    [{ t: `${ang(lab.d)} = ${ang(lab.c)}`, why: 'vertical angles', mc: MC.extAdjEqual }, { t: `${ang(lab.d)} = ${ang(lab.a)} + ${ang(lab.b)} + ${ang(lab.c)}`, why: 'exterior angle', mc: MC.extUsesAdj }],
  ];
  const bad = R() < 0.2 ? -1 : int(R, 0, 2);
  const steps = good.slice();
  let mcMiss: string | undefined;
  if (bad >= 0) { const b = pick(R, bads[bad]!); steps[bad] = b; mcMiss = b.mc; }
  const list = steps.map((st, i) => `${i + 1}. ${st.t} (${st.why})`).join('<br>');
  const opts: Opt[] = [0, 1, 2].map(i => ({ t: `Step ${i + 1}`, ok: i === bad, say: i === bad ? undefined : `Step ${i + 1} is fine.` }));
  opts.push({ t: 'None: all three steps are right', ok: bad === -1, mc: bad === -1 ? undefined : mcMiss, say: bad === -1 ? undefined : `Check step ${bad + 1}: do those angles really fit that fact?` });
  return choiceItem(R, {
    id: `findBadStep-${n}`, family: 'findBadStep', prompt: `Which step is wrong?<br>${list}`,
    givens: [], work: [], board: `\\text{which step is wrong? }(${lab.a},${lab.b},${lab.c},${lab.d})`,
    solution: bad === -1 ? ['Step 1 uses the three angles of one triangle, step 2 a real linear pair, step 3 follows from them.', 'All three are right.']
      : [`Step ${bad + 1} does not fit its fact: check which angles belong to the triangle and which make a straight line.`, `The real facts: ${good.map(g => g.t).join('; ')}.`],
    picture: { fig: F.fig },
  }, opts, 'Yes.', 'For each step: are those exactly the angles the fact talks about?', true);
}
/** triangle with its exterior angle; the four angles get the numbers 1-4 in a random order */
function sumFigure(R: () => number) {
  const [a, b, c] = triAngles(R, 36, 0.2), nums = shuffle(R, [1, 2, 3, 4]);
  const lab = { a: nums[0]!, b: nums[1]!, c: nums[2]!, d: nums[3]! };
  const T = tri({ A: a, B: b, C: c, rot: int(R, -25, 25), mirror: R() < 0.5, size: 560,
    marks: { A: { text: String(lab.a), col: 'second', id: 'a' }, B: { text: String(lab.b), col: 'second', id: 'b' }, C: { text: String(lab.c), col: 'pick', id: 'c' } },
    ext: { at: 'C', from: 'B', mark: { text: String(lab.d), col: 'first', id: 'd' }, len: 300 } });
  return { fig: T.fig, lab };
}
const sumCheck: Gen = G((R, n) => {
  const F = sumFigure(R), { lab } = F;
  const good = pick(R, [
    `${ang(lab.a)} + ${ang(lab.b)} + ${ang(lab.c)} = 180°`, `${ang(lab.c)} + ${ang(lab.d)} = 180°`, `${ang(lab.d)} = ${ang(lab.a)} + ${ang(lab.b)}`,
  ]);
  const bads: Opt[] = shuffle(R, [
    { t: `${ang(lab.a)} + ${ang(lab.b)} + ${ang(lab.d)} = 180°`, mc: MC.anyThree, say: `${ang(lab.d)} is outside the triangle: those three are not one triangle’s angles.` },
    { t: `${ang(lab.b)} + ${ang(lab.d)} = 180°`, mc: MC.citesNoCheck, say: `${ang(lab.b)} and ${ang(lab.d)} do not share a side: they are not a linear pair.` },
    { t: `${ang(lab.d)} = ${ang(lab.c)}`, mc: MC.extAdjEqual, say: `${ang(lab.c)} and ${ang(lab.d)} make a straight line: they add to 180°.` },
    { t: `${ang(lab.d)} = ${ang(lab.a)} + ${ang(lab.b)} + ${ang(lab.c)}`, mc: MC.extUsesAdj, say: 'That sum is 180°. The exterior angle uses only the two remote angles.' },
    { t: `${ang(lab.a)} + ${ang(lab.d)} = 180°`, mc: MC.citesNoCheck, say: `${ang(lab.a)} and ${ang(lab.d)} are not next to each other on a line.` },
  ]).slice(0, 3);
  return choiceItem(R, {
    id: `sumCheck-${n}`, family: 'sumCheck', prompt: 'Which equation does the figure justify?',
    givens: [], work: [], board: `\\text{justified? }(${lab.a},${lab.b},${lab.c},${lab.d})\\ ${good.length}`,
    solution: [`${ang(lab.a)}, ${ang(lab.b)} and ${ang(lab.c)} are the triangle’s angles; ${ang(lab.c)} and ${ang(lab.d)} make a straight line.`, `So ${good} is justified.`],
    picture: { fig: F.fig, focus: ['a', 'b', 'c', 'd'] },
  }, [{ t: good, ok: true }, ...bads], 'Yes.', 'Which angles are the triangle’s? Which make a straight line?');
});

// =====================================================================================================
// 23, 24, 25. arguments
// =====================================================================================================
const motionPick: Gen = G((R, n) => {
  const N = pick(R, NAMESETS), r = pick(R, ['corresponding', 'corresponding', 'altInt', 'altExt'] as const);
  const k = pick(R, SLOTS.filter(s => SLOT[s].c === 0 && SLOTS.some(t => relation(s, t) === r)));
  const p = partner(k, r);
  const T = trans({ tau: randTau(R), ...place(R, 0.3), par: true, names: { l: N.l, m: N.m, t: N.t }, cross: ['P', 'Q'],
    marks: { [k]: { text: String(k), col: 'pick', id: `s${k}` }, [p]: { text: String(p), col: 'link', id: `s${p}` } } });
  const tv = sub(T.P, T.Q);
  T.fig.points.push({ at: T.M, name: 'M', dir: angOf([-tv[1], tv[0]]) + (R() < 0.5 ? 0 : 180), dot: true });
  const slide = r === 'corresponding';
  const opts: Opt[] = [
    { t: 'A slide (translation) along the transversal, from P to Q', ok: slide, say: slide ? undefined : 'A slide keeps every direction: it would carry the angle to its corresponding angle, not this one.' },
    { t: 'A half turn (180° rotation) about M, the midpoint of PQ', ok: !slide, say: !slide ? undefined : 'A half turn flips the angle to the other side of the transversal: that gives the alternate angle.' },
    { t: 'A reflection in the transversal', say: 'A reflection in the transversal does not carry line ' + N.l + ' onto line ' + N.m + '.' },
    { t: 'A quarter turn (90° rotation) about P', mc: MC.anyRot, say: 'A quarter turn makes the line point a new way: it is no longer parallel to where it was.' },
  ];
  return choiceItem(R, {
    id: `motionPick-${n}`, family: 'motionPick', prompt: `${parH(N)}. Which rigid motion carries ${ang(k)} exactly onto ${ang(p)}?`,
    givens: [parT(N)], work: [], board: `${parT(N)}:\\ ${tang(k)} \\to ${tang(p)}`,
    solution: slide ? ['Slide by the arrow from P to Q. The transversal slides along itself.', `Line ${N.l} lands on a line through Q parallel to ${N.l}: that can only be ${N.m}. So ${ang(k)} lands on ${ang(p)}.`]
      : ['Turn a half turn about M. P and Q swap, and the transversal turns onto itself.', `Line ${N.l} lands on a line through Q parallel to ${N.l}: that is ${N.m}. So ${ang(k)} lands on ${ang(p)}.`],
    picture: { fig: T.fig, focus: [`s${k}`, `s${p}`] },
  }, opts, 'Yes.', `Corresponding angles: a slide. Alternate angles: a half turn.`, true);
});

const PEOPLE = ['Jordan', 'Maya', 'Priya', 'Leo', 'Ana', 'Marcus', 'Kenji', 'Sofia'];
const critique: Gen = G((R, n, sg) => {
  const who = pick(R, PEOPLE);
  const topic = sg === 'rigid-motion-argument' ? 'motion' : sg === 'exterior-angle-argument' ? 'ext' : sg === 'triangle-sum-argument' ? 'tri' : pick(R, ['motion', 'tri', 'ext'] as const);
  const FL = {
    ex: 'It only checks examples',
    look: 'It treats a line that only looks parallel as parallel',
    circ: 'It uses the fact it is trying to prove',
    quarter: 'A quarter turn does not keep a line parallel',
    adj: 'The last step adds an extra angle',
    ok: 'Nothing: the argument works',
  };
  let arg = '', flaw: keyof typeof FL, fig: Fig;
  const meas = Array.from({ length: 3 }, () => int(R, 35, 140));
  if (topic === 'motion') {
    const N = pick(R, NAMESETS), k = pick(R, [1, 2, 3, 4] as Slot[]), p = partner(k, 'corresponding');
    fig = trans({ tau: randTau(R), ...place(R, 0.2), par: true, names: { l: N.l, m: N.m, t: N.t }, cross: ['P', 'Q'], marks: { [k]: { text: String(k), col: 'pick' }, [p]: { text: String(p), col: 'link' } } }).fig;
    flaw = pick(R, ['ex', 'quarter', 'ok'] as const);
    arg = flaw === 'ex' ? `${who} drew three pairs of parallel lines and measured: ${meas.map(m => `${d(m)} and ${d(m)}`).join('; ')}. “So corresponding angles are always equal.”`
      : flaw === 'quarter' ? `${who}: “Turn the top crossing a quarter turn about P. Any turn keeps a line parallel, so ${ang(k)} lands on ${ang(p)}.”`
        : `${who}: “Slide everything along the transversal from P to Q. The transversal stays on itself. ${N.l} lands on a line through Q parallel to ${N.l}, and the only one is ${N.m}. So ${ang(k)} lands on ${ang(p)}.”`;
  } else if (topic === 'tri') {
    const [a, b, c] = triAngles(R, 40, 0.2);
    flaw = pick(R, ['ex', 'look', 'circ', 'ok'] as const);
    fig = tri({ A: a, B: b, C: c, rot: int(R, -15, 15), mirror: R() < 0.5, size: 560, names: ['A', 'B', 'C'], parTop: { name: 'ℓ', marked: flaw !== 'look' },
      marks: { B: { text: '', col: 'second' }, C: { text: '', col: 'second', id: 'C' } } }).fig;
    arg = flaw === 'ex' ? `${who} measured the angles of ${meas.length + 2} triangles and always got about 180°. “So every triangle’s angles add to 180°.”`
      : flaw === 'look' ? `${who}: “I drew line ℓ through A. It looks parallel to BC, so ∠B and ∠C match the angles next to A on ℓ, and those three make 180°.”`
        : flaw === 'circ' ? `${who}: “ℓ is drawn through A parallel to BC. The angles at A along ℓ add to 180° because the angles of a triangle add to 180°.”`
          : `${who}: “ℓ is drawn through A parallel to BC. The angle left of A on ℓ equals ∠B, and the angle right of it equals ∠C (alternate interior angles). With ∠A they fill the straight line ℓ, so ∠A + ∠B + ∠C = 180°.”`;
  } else {
    const [a, b, c] = triAngles(R, 36, 0.2);
    fig = tri({ A: a, B: b, C: c, rot: int(R, -20, 20), mirror: R() < 0.5, size: 560, names: ['A', 'B', 'C'], ext: { at: 'C', from: 'B', name: 'D', mark: { text: '', col: 'first', id: 'd' }, len: 300 } }).fig;
    flaw = pick(R, ['ex', 'circ', 'adj', 'ok'] as const);
    arg = flaw === 'ex' ? `${who} measured three triangles: the exterior angle at C equaled ∠A + ∠B each time. “So it is always true.”`
      : flaw === 'circ' ? `${who}: “∠ACD = ∠A + ∠B, because an exterior angle equals the sum of the two remote interior angles.”`
        : flaw === 'adj' ? `${who}: “∠A + ∠B + ∠ACB = 180° (triangle) and ∠ACB + ∠ACD = 180° (linear pair). So ∠ACD = ∠A + ∠B + ∠ACB.”`
          : `${who}: “∠A + ∠B + ∠ACB = 180° (triangle) and ∠ACB + ∠ACD = 180° (linear pair). Both equal 180°, so ∠ACD = ∠A + ∠B.”`;
  }
  const menu: (keyof typeof FL)[] = topic === 'motion' ? ['ex', 'quarter', 'circ', 'ok'] : topic === 'tri' ? ['ex', 'look', 'circ', 'ok'] : ['ex', 'circ', 'adj', 'ok'];
  const mcOf: Record<keyof typeof FL, string | undefined> = { ex: MC.examples, look: MC.appearance, circ: MC.circular, quarter: MC.anyRot, adj: MC.extUsesAdj, ok: undefined };
  const opts: Opt[] = menu.map(k => ({ t: FL[k], ok: k === flaw, mc: k === 'ok' && flaw !== 'ok' ? mcOf[flaw] : undefined,
    say: k === flaw ? undefined : flaw === 'ok' ? 'Look again: each step has its reason, and none uses the fact being proved.' : `Look again at what ${who} relies on.` }));
  const what = topic === 'motion' ? 'corresponding angles at parallel lines are equal' : topic === 'tri' ? 'a triangle’s angles add to 180°' : 'an exterior angle equals the two remote interior angles';
  const sol: Record<keyof typeof FL, string> = {
    ex: 'Measured examples can’t cover every case, and measuring is never exact: that is not a proof.',
    look: 'The line has to be DRAWN parallel (given by the construction), not just look parallel.',
    circ: 'It uses the very fact it wants to prove as a reason: that is circular.',
    quarter: 'A quarter turn makes a line perpendicular to where it was. Only a slide or a half turn keeps it parallel.',
    adj: 'Subtracting the two equations gives ∠ACD = ∠A + ∠B. The extra ∠ACB should not be there.',
    ok: 'Every step has a reason that is already known, so it works for every case.',
  };
  return choiceItem(R, {
    id: `critique-${n}`, family: 'critique', prompt: `${who} wants to show that ${what}.<br>${arg}<br>What is wrong with this argument?`,
    givens: [], work: [], board: `\\text{${who}'s argument: ${topic === 'motion' ? 'corresponding angles' : topic === 'tri' ? 'triangle sum' : 'exterior angle'}}`,
    solution: [sol[flaw]],
    picture: { fig },
  }, opts, 'Yes.', 'Does every step rest on a fact that is already known, for every case?', true);
});

const triArgReason: Gen = G((R, n) => {
  const [a, b, c] = triAngles(R, 40, 0.25), N = pick(R, TRI_NAMES), [nA, nB, nC] = N;
  const T = tri({ A: a, B: b, C: c, rot: int(R, -15, 15), mirror: R() < 0.5, size: 560, names: N, parTop: { name: 'ℓ', marks: { left: { text: '1', col: 'pick', id: 'one' }, right: { text: '3', col: 'pick', id: 'three' } } },
    marks: { A: { text: '2', col: 'first', id: 'two' }, B: { text: '', col: 'second', id: 'B' }, C: { text: '', col: 'second', id: 'C' } } });
  const which = pick(R, ['one', 'three', 'sum'] as const);
  const side = which === 'one' ? nA + nB : nA + nC, base = which === 'one' ? nB : nC;
  const stepT = which === 'sum' ? '∠1 + ∠2 + ∠3 = 180°' : `${which === 'one' ? '∠1' : '∠3'} = ∠${base}`;
  const opts: Opt[] = which === 'sum' ? [
    { t: 'Together they make a straight angle along ℓ', ok: true },
    { t: 'They are the three angles of a triangle', mc: MC.anyThree, say: '∠1, ∠2 and ∠3 all sit at one point, on line ℓ: they are not a triangle’s three angles.' },
    { t: 'The angles of a triangle add to 180°', mc: MC.circular, say: 'That is the fact being proved: it can’t be its own reason.' },
    { t: 'Alternate interior angles', mc: MC.wrongName, say: 'Alternate interior angles make two angles equal, not a sum of 180°.' },
  ] : [
    { t: `Alternate interior angles: ℓ is drawn parallel to ${nB}${nC}, and ${side} is the transversal`, ok: true },
    { t: `Corresponding angles: ℓ is drawn parallel to ${nB}${nC}`, mc: MC.wrongName, say: `The two angles are on opposite sides of ${side}, between the parallel lines: alternate interior.` },
    { t: `ℓ looks parallel to ${nB}${nC}`, mc: MC.appearance, say: 'Looking parallel is not a reason. ℓ was DRAWN parallel: that is the reason.' },
    { t: 'The angles of a triangle add to 180°', mc: MC.circular, say: 'That is the fact being proved: it can’t be a reason inside its own proof.' },
  ];
  return choiceItem(R, {
    id: `triArgReason-${n}`, family: 'triArgReason', prompt: `Line ℓ is drawn through ${nA} parallel to ${nB}${nC}. Why is ${stepT}?`,
    givens: [`\\ell \\parallel ${nB}${nC}\\ \\text{(drawn)}`], work: [], board: `\\ell \\parallel ${nB}${nC}:\\ ${which === 'sum' ? '\\angle 1 + \\angle 2 + \\angle 3 = 180^\\circ' : `${which === 'one' ? '\\angle 1' : '\\angle 3'} = \\angle ${base}`}\\text{?}`,
    solution: which === 'sum' ? ['∠1, ∠2 and ∠3 sit side by side at one point and fill line ℓ.', 'A straight angle is 180°.'] : [`${side} crosses the two parallel lines ℓ and ${nB}${nC}.`, `${which === 'one' ? '∠1' : '∠3'} and ∠${base} are alternate interior angles, so they are equal.`],
    picture: { fig: T.fig, focus: which === 'sum' ? ['one', 'two', 'three'] : [which, base] },
  }, opts, 'Yes.', 'Which fact, already known, makes exactly this step true?');
});

const extArgGeneral: Gen = G((R, n) => {
  const F = sumFigure(R), { lab } = F;
  const roof = R() < 0.3;
  if (roof) F.fig.words = [];
  const opts: Opt[] = [
    { t: `${ang(lab.a)} + ${ang(lab.b)}`, ok: true },
    { t: ang(lab.c), mc: MC.extAdjEqual, say: `${ang(lab.c)} + ${ang(lab.d)} = 180°: they are a linear pair, not equal.` },
    { t: `${ang(lab.a)} + ${ang(lab.b)} + ${ang(lab.c)}`, mc: MC.extUsesAdj, say: 'That is the whole 180°. Take ' + ang(lab.c) + ' away from both equations.' },
    { t: `180° − ${ang(lab.a)}`, mc: MC.assumes180, say: `${ang(lab.a)} and ${ang(lab.d)} are not a linear pair.` },
  ];
  return choiceItem(R, {
    id: `extArgGeneral-${n}`, family: 'extArgGeneral',
    prompt: `${ang(lab.a)} + ${ang(lab.b)} + ${ang(lab.c)} = 180° (triangle sum) and ${ang(lab.c)} + ${ang(lab.d)} = 180° (linear pair). So ${ang(lab.d)} = ?`,
    givens: [`${tang(lab.a)} + ${tang(lab.b)} + ${tang(lab.c)} = 180^\\circ`, `${tang(lab.c)} + ${tang(lab.d)} = 180^\\circ`],
    work: [`${tang(lab.d)} = ${tang(lab.a)} + ${tang(lab.b)}`], board: `${tang(lab.d)} = \\,?\\ (${lab.a},${lab.b},${lab.c},${lab.d})`,
    solution: ['Both equations equal 180°, so their left sides are equal.', `Take ${ang(lab.c)} away from both: ${ang(lab.d)} = ${ang(lab.a)} + ${ang(lab.b)}. No measuring: it works for every triangle.`],
    picture: { fig: F.fig, focus: ['a', 'b', 'd'] },
  }, opts, 'Yes: the exterior angle equals the two remote interior angles.', `Both sums are 180°. What is left when ${ang(lab.c)} is taken away?`);
});

export const GENERATORS: Record<FamilyId, Gen> = {
  tcWhere, tcWhichTrans, findPartner, pairName, pairValue, classify, ssRight, needsParallel, triSum, third, thirdRight,
  extFind, extName, extRemote, extWrite, allEight, isoBase, isoApex, extValue, extRemoteMissing, polyTriangles, polySum,
  polySides, regAngle, regSides, regNot, chainTri, chainExt, zigzag, exprPair, exprTri, polyExpr, reasonPick, findBadStep,
  sumCheck, motionPick, critique, triArgReason, extArgGeneral,
};
void at; void meet; void measure;
