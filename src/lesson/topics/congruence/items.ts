// items.ts: practice families for "Congruence via transformations" (grade 8, 8.G.A.2). Each family is one deep
// structure; a generator receives the sub-goal id and uses that sub-goal's cases (topic JSON `cases`). Every wrong
// option carries the catalogue misconception it shows (math-curriculum-essentials/misconceptions.json).
// Pure: no DOM, no canvas. Pictures are plain data (congMaths.ts) the page draws. PROBES records, per item, typical
// wrong responses and the misconception id they must get (tests).
import { type Gen, type Item, type Response, type Verdict, A as Am, B as Bm, int, pick, shuffle } from '../../runtime/item';
/** the figure we try to reach (lavender in the picture) */
const Pm = (s: string | number) => `<b class="p">${s}</b>`;
import {
  type CongPic, type Move, type PFig, type V, area2, congruentSets, dil, fitWin, flipH, flipV, flipX, flipY, gridLen, inverse,
  inverseSeq, isRigid, lensOf, mapPts, mapsOnto, moveTex, moveWords, mv, n2, orient, picFits, ptTex, ptWords, reverses, roundWord,
  ruleOf, ruleTex, ruleWordsOf, runSeq, sameMap, sameSet, seqWords, slide, symmetric, turn, veq,
} from './congMaths';

export type FamilyId = 'cover' | 'partner' | 'invariant' | 'orient' | 'whichMove' | 'specify' | 'sequence' | 'order' | 'verify'
  | 'plan' | 'finish' | 'twoWays' | 'undo' | 'dilate' | 'identity' | 'table' | 'rule' | 'justify';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  cover: 'Can the tracing cover it?',
  partner: 'Partner corners',
  invariant: 'Rule it out',
  orient: 'Which way round?',
  whichMove: 'Slide, turn or flip?',
  specify: 'Name the move exactly',
  sequence: 'Two moves in a row',
  order: 'Does the order matter?',
  verify: 'Check every corner',
  plan: 'Plan the moves',
  finish: 'Finish with a flip',
  twoWays: 'Two right answers?',
  undo: 'Move it back',
  dilate: 'Bigger or smaller',
  identity: 'Scale factor 1',
  table: 'The summary table',
  rule: 'Rigid or not?',
  justify: 'Justify it',
};

export interface CongItem extends Item { family: FamilyId; picture: CongPic & Record<string, unknown> }
/** wrong responses with the misconception they must be classified as (tests) */
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();

export const MC = {
  flipNot: 'mc.transformations.turned-or-flipped-copy-not-congruent',
  looks: 'mc.transformations.visual-resemblance-proves-congruence',
  stmtOrder: 'mc.transformations.statement-vertex-order-ignored',
  byPosition: 'mc.transformations.matches-parts-by-position-or-letters',
  areaPerim: 'mc.transformations.equal-area-or-perimeter-proves-congruence',
  failedSearch: 'mc.transformations.failed-search-proves-impossible',
  turnReverses: 'mc.transformations.rotation-or-dilation-reverses-orientation',
  parallel: 'mc.transformations.parallel-sides-prove-translation',
  rotRefl: 'mc.transformations.rotation-and-reflection-confused',
  wrongCenter: 'mc.transformations.rotates-about-wrong-center',
  noParams: 'mc.transformations.names-motion-without-parameters',
  namedCoord: 'mc.transformations.reflect-negates-named-coordinate',
  toOriginal: 'mc.transformations.applies-sequence-steps-to-original',
  orderAlways: 'mc.transformations.order-of-motions-always-matters',
  orderNever: 'mc.transformations.order-of-motions-never-matters',
  partial: 'mc.geometric-proof.partial-match-as-whole-mapping',
  oneStep: 'mc.transformations.sequence-must-have-one-step',
  oneSeq: 'mc.transformations.end-image-determines-one-motion',
  labels: 'mc.transformations.ignores-vertex-labels-when-matching-images',
  twoVertices: 'mc.transformations.two-matched-vertices-force-triangle-coincidence',
  undoOrder: 'mc.transformations.undoes-sequence-wrongly',
  reverseOnly: 'mc.coordinate-geometry.return-reverses-order-only',
  repeat: 'mc.transformations.undoes-sequence-by-repeating-it',
  sizeRigid: 'mc.transformations.size-change-confused-with-rigid-motion',
  anySlide: 'mc.transformations.calls-any-move-a-translation',
  angles: 'mc.transformations.equal-angles-prove-congruence',
  disjoint: 'mc.transformations.dilation-and-rigid-motion-disjoint',
  sizeShape: 'mc.shapes.size-changes-shape-or-counts',
  orientCong: 'mc.transformations.preserved-orientation-proves-congruence',
  examples: 'mc.reasoning-language.examples-as-proof',
  stretch: 'mc.transformations.stretched-copy-is-enlargement',
  signChange: 'mc.transformations.coordinate-sign-change-means-nonrigid',
  undoResize: 'mc.transformations.rigid-motion-can-undo-resizing',
  noReason: 'mc.transformations.omits-invariant-obstruction',
} as const;

// ---------- shared helpers ----------
interface Opt { t: string; ok?: boolean; say: string; mc?: string }
function choiceCheck(right: number, says: { say: string; mc?: string }[]) {
  return (r: Response): Verdict => {
    if (r.kind !== 'choice' || !says[r.i]) return { ok: false, say: 'Pick one answer.' };
    const s = says[r.i]!;
    return { ok: r.i === right, mc: r.i === right ? undefined : s.mc, say: s.say };
  };
}
type Base = Omit<CongItem, 'input' | 'choices' | 'answer' | 'check'>;
/** a choice item from options (shuffled unless keep), with probes for every tagged wrong option */
function choiceItem(R: () => number, base: Base, opts: Opt[], keep = false): CongItem {
  const seen = new Set<string>();
  const uniq = opts.filter(o => (seen.has(o.t) ? false : (seen.add(o.t), true)));
  const o = keep ? uniq : shuffle(R, uniq.slice());
  const right = o.findIndex(x => x.ok);
  if (right < 0 || o.filter(x => x.ok).length !== 1) throw new Error(`${base.id}: needs exactly one right option`);
  const it: CongItem = { ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: right }, check: choiceCheck(right, o.map(x => ({ say: x.say, mc: x.mc }))) };
  PROBES.set(it, o.flatMap((x, i) => (x.mc && !x.ok ? [{ r: { kind: 'choice', i } as Response, mc: x.mc }] : [])));
  return it;
}
/** a typed point (x, y) */
function pointItem(base: Base, ans: V, lead: string, okSay: string, wrongs: { v: V; mc?: string; say: string }[], other: string): CongItem {
  const it: CongItem = {
    ...base, input: 'pair', pairLead: lead, pairOp: ',', pairTail: ')', answer: { kind: 'pair', x: ans[0], y: ans[1] },
    check: r => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type two numbers.' };
      if (r.x === ans[0] && r.y === ans[1]) return { ok: true, say: okSay };
      const w = wrongs.find(q => q.v[0] === r.x && q.v[1] === r.y);
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: other };
    },
  };
  const seen = new Set<string>([String(ans)]);
  PROBES.set(it, wrongs.flatMap(w => (w.mc && !seen.has(String(w.v)) ? (seen.add(String(w.v)), [{ r: { kind: 'pair', x: w.v[0], y: w.v[1] } as Response, mc: w.mc }]) : [])));
  return it;
}
/** retry a generator until its picture fits (pictures come from random placements) */
function fitted(make: () => CongItem | null, tries = 200): CongItem {
  for (let i = 0; i < tries; i++) {
    const it = make();
    if (it && picFits(it.picture) === null) return it;
  }
  throw new Error('congruence: no drawable item after many tries');
}
function pic(p: Omit<CongPic, 'kind' | 'win'>, min = 8): CongPic & Record<string, unknown> {
  const g: CongPic = { kind: 'plane', win: { x0: 0, y0: 0, x1: 1, y1: 1 }, ...p };
  g.win = fitWin(g, min);
  return g as CongPic & Record<string, unknown>;
}
const WHO = ['Maya', 'Leo', 'Ana', 'Sam', 'Kim', 'Ravi', 'Jo', 'Eli', 'Noor', 'Theo', 'Lin', 'Kai'];
const two = (R: () => number): [string, string] => { const a = pick(R, WHO); let b = pick(R, WHO); while (b === a) b = pick(R, WHO); return [a, b]; };

// ---------- shapes ----------
/** asymmetric outlines (counterclockwise, bottom-left at the origin) */
const TRIS: V[][] = [[[0, 0], [4, 0], [0, 3]], [[0, 0], [3, 0], [1, 2]], [[0, 0], [4, 0], [3, 2]], [[0, 0], [2, 0], [0, 3]], [[0, 0], [4, 0], [1, 2]], [[0, 0], [3, 0], [3, 2]], [[0, 0], [3, 0], [0, 2]]];
const QUADS: V[][] = [[[0, 0], [4, 0], [3, 2], [0, 1]], [[0, 0], [3, 0], [3, 2], [1, 3]], [[0, 0], [3, 0], [2, 2], [0, 2]]];
const normal = (P: V[]): V[] => {
  const Q = orient(P) > 0 ? P : P.slice().reverse();
  const x0 = Math.min(...Q.map(p => p[0])), y0 = Math.min(...Q.map(p => p[1]));
  return Q.map(p => [p[0] - x0, p[1] - y0] as V);
};
/** a random asymmetric outline in a random grid orientation */
function shapeOf(R: () => number, quad = false): V[] {
  const P = pick(R, quad ? QUADS : TRIS).map(p => [p[0], p[1]] as V);
  const q = int(R, 0, 3);
  let Q = P.map(p => mv(turn(q), p));
  if (R() < 0.5) Q = Q.map(p => [-p[0], p[1]] as V);
  return normal(Q);
}
const at = (P: readonly V[], dx: number, dy: number): V[] => P.map(p => [p[0] + dx, p[1] + dy] as V);
const bbox = (P: readonly V[]) => ({ x0: Math.min(...P.map(p => p[0])), x1: Math.max(...P.map(p => p[0])), y0: Math.min(...P.map(p => p[1])), y1: Math.max(...P.map(p => p[1])) });
const inRange = (P: readonly V[], r = 6) => P.every(p => Math.abs(p[0]) <= r && Math.abs(p[1]) <= r);
const apart = (P: readonly V[], Q: readonly V[], gap = 1) => { const a = bbox(P), b = bbox(Q); return a.x1 + gap <= b.x0 || b.x1 + gap <= a.x0 || a.y1 + gap <= b.y0 || b.y1 + gap <= a.y0; };
/** place a shape at a random spot with every vertex within [-r, r] */
function placed(R: () => number, P: readonly V[], r = 6): V[] {
  const b = bbox(P);
  return at(P, int(R, -r, r - b.x1), int(R, -r, r - b.y1));
}
const ABC = (n: number) => 'ABCD'.slice(0, n).split('');
const DEF = (n: number) => 'DEFG'.slice(0, n).split('');
const primes = (n: number, k = 1) => ABC(n).map(l => l + '′'.repeat(k));
const triName = (L: readonly string[]) => (L.length === 3 ? '△' : '') + L.join('');
const figWord = (n: number) => (n === 3 ? 'triangle' : 'quadrilateral');
/** a random single rigid motion of the coordinate route (axes, the origin, small slides) */
function coordMove(R: () => number, kinds: readonly ('slide' | 'flip' | 'turn' | 'half')[] = ['slide', 'flip', 'turn', 'half']): Move {
  const k = pick(R, kinds);
  if (k === 'slide') { let a = int(R, -6, 6), b = int(R, -6, 6); if (!a && !b) a = 3; return slide(a, b); }
  if (k === 'flip') return R() < 0.5 ? flipX : flipY;
  if (k === 'turn') return turn(R() < 0.5 ? 1 : -1);
  return turn(2);
}
/** A and its image under seq, inside [-r, r], apart from each other */
function pairUnder(R: () => number, seq: Move[], quad = false, r = 6, gap = 1): { A: V[]; B: V[] } | null {
  const A = placed(R, shapeOf(R, quad), r);
  const B = mapPts(seq, A);
  if (!inRange(B, r) || !apart(A, B, gap)) return null;
  for (let s = 1; s < seq.length; s++) if (!inRange(mapPts(seq.slice(0, s), A), r)) return null;
  return { A, B };
}
const F1 = (pts: V[], role: PFig['role'], labels?: string[], extra: Partial<PFig> = {}): PFig => ({ pts, role, labels, ...extra });
const lensLabels = (P: V[]) => lensOf(P);

// =====================================================================================================
// 1 congruence-definition: can a tracing of P be slid, turned and flipped to cover Q exactly?
const cover: Gen = (R, n) => fitted(() => {
  const mode = pick(R, ['pick', 'pick', 'exact', 'near', 'slid'] as const);
  const base = { id: `cover-${mode}-${n}`, family: 'cover' as const, board: '' };
  const P = shapeOf(R, false);
  /** the same outline with one corner moved one square: it looks alike, it is not congruent */
  const nearOf = (Q: V[]): V[] | null => {
    for (let t = 0; t < 12; t++) {
      const i = int(R, 0, Q.length - 1), d = pick(R, [[1, 0], [-1, 0], [0, 1], [0, -1]] as V[]);
      const N = Q.map((p, j) => (j === i ? [p[0] + d[0], p[1] + d[1]] as V : p));
      if (area2(N) > 0 && !congruentSets(N, Q) && !symmetric(N)) return N;
    }
    return null;
  };
  if (mode === 'pick') {
    const A = at(P, 0, 0);
    const mv1: Move = pick(R, [flipY, flipX, turn(1), turn(-1), turn(2)]);
    const right = normal(mapPts([mv1], A));
    const n1 = nearOf(A), n2_ = nearOf(A);
    if (!n1 || !n2_ || sameSet(n1, n2_)) return null;
    const near1 = normal(n1), near2 = normal(R() < 0.5 ? n2_ : mapPts([pick(R, [turn(1), turn(-1)])], n2_));
    if (congruentSets(near2, right) || sameSet(near1, near2)) return null;
    const cands = shuffle(R, [{ f: right, ok: true }, { f: near1, ok: false }, { f: near2, ok: false }]);
    const labels = ['1', '2', '3'];
    const w = Math.max(...[A, ...cands.map(c => c.f)].flatMap(Q => Q.map(p => Math.max(p[0], p[1]))));
    const picture = pic({ axes: false, figs: [F1(A, 'first', undefined, { tag: 'P' })], cands: cands.map((c, i) => ({ label: labels[i]!, fig: F1(c.f, 'pick') })) }, Math.max(6, w + 2));
    picture.win = { x0: -1, y0: -1, x1: w + 1, y1: w + 1 };
    const ri = cands.findIndex(c => c.ok);
    const turned = mv1.kind === 'flip' ? 'flipped over' : 'turned';
    return choiceItem(R, { ...base, prompt: `Trace ${Am('figure P')}. Which tile can your tracing cover exactly, if you may slide, turn and flip the tracing paper?`, picture,
      solution: [`Tile ${labels[ri]} is P ${turned}: a ${mv1.kind === 'flip' ? 'flip' : 'turn'} puts the tracing on it, corner on corner.`, 'The other two look alike, but one corner is a square off: no move can stretch a side.'] }, [
      ...cands.map((c, i) => (c.ok
        ? { t: `Tile ${labels[i]}`, ok: true, say: `Yes. Tile ${labels[i]} is P ${turned}. Turning or flipping the tracing paper is allowed, and it covers the tile exactly.` }
        : { t: `Tile ${labels[i]}`, mc: MC.looks, say: `It looks alike, but count the squares: one side is a square longer or shorter. A tracing never stretches, so it cannot cover tile ${labels[i]} exactly.` })),
      { t: 'None of them', mc: MC.flipNot, say: `Tile ${labels[ri]} faces another way, but that is allowed: ${turned === 'flipped over' ? 'flip' : 'turn'} the tracing paper and it covers the tile exactly.` },
    ], true);
  }
  const A = placed(R, P, 6);
  const seq: Move[] = mode === 'slid' ? [slide(int(R, -6, 6) || 3, int(R, -5, 5))] : [pick(R, [flipY, flipX, turn(1), turn(-1), turn(2)]), slide(int(R, -3, 3), int(R, -3, 3))];
  const B0 = mapPts(seq, A);
  const B = mode === 'near' ? nearOf(B0) : B0;
  if (!B || !inRange(B) || !apart(A, B)) return null;
  const picture = pic({ axes: true, figs: [F1(A, 'first', undefined, { tag: 'P' }), F1(B, 'pick', undefined, { tag: 'Q' })], solve: { fig: 0, seq, to: 1, miss: mode === 'near' } });
  const how = seqWords(seq.filter(m => !(m.kind === 'slide' && !m.d[0] && !m.d[1])));
  const prompt = `Is ${Pm('figure Q')} congruent to ${Am('figure P')}? You may slide, turn and flip a tracing of P.`;
  if (mode === 'near') return choiceItem(R, { ...base, prompt, picture, solution: [`Move the tracing as far as it goes: ${how}.`, 'Two corners land, but one corner is a square off: one side is longer or shorter. Not congruent.'] }, [
    { t: 'No: one side is a square longer or shorter, so the tracing can’t fit exactly', ok: true, say: 'Right. Congruent means the tracing fits exactly, corner on corner. One side is off, so it can’t.' },
    { t: 'Yes: they look the same', mc: MC.looks, say: 'Looking alike is not enough. Count the squares along each side: one side is a square off.' },
    { t: 'Yes: the tracing lands close enough', mc: MC.looks, say: 'Congruent means exactly, not close. One corner misses by a whole square.' },
    { t: 'No: Q faces a different way', mc: MC.flipNot, say: 'Facing another way is fine: you may turn and flip the tracing. The real problem is one side that is off.' },
  ]);
  if (mode === 'slid') return choiceItem(R, { ...base, prompt, picture, solution: [`Slide the tracing ${how.replace('slide ', '')}.`, 'It lands on Q exactly, corner on corner: congruent.'] }, [
    { t: 'Yes: a slide puts the tracing exactly on Q', ok: true, say: `Yes: ${how}, and every corner lands on Q.` },
    { t: 'No: Q is in a different place', say: 'Being somewhere else is fine: a slide is one of the allowed moves.' },
    { t: 'You can’t tell without a ruler', say: 'The tracing is the test: slide it, and it covers Q exactly.' },
  ]);
  const kind = seq[0]!.kind === 'flip' ? 'flip' : 'turn';
  return choiceItem(R, { ...base, prompt, picture, solution: [`Move the tracing: ${how}.`, 'It covers Q exactly, corner on corner. Turned or flipped copies are congruent too.'] }, [
    { t: `Yes: a ${kind} and a slide put the tracing exactly on Q`, ok: true, say: `Yes: ${how}. Every corner lands on Q.` },
    { t: `No: Q is ${kind === 'flip' ? 'a mirror image' : 'turned'}, so it is a different figure`, mc: MC.flipNot, say: `A ${kind === 'flip' ? 'mirror image' : 'turned copy'} is still congruent: ${kind} the tracing paper and it fits exactly.` },
    { t: 'You can’t tell without a ruler', say: 'The tracing is the test: move it, and it covers Q exactly.' },
  ]);
});

// 2 correspondence: partners are decided by the mapping, not by letters or page position
const partner: Gen = (R, n) => fitted(() => {
  const mode = pick(R, ['corner', 'corner', 'statement', 'side'] as const);
  const seq: Move[] = R() < 0.5 ? [coordMove(R, ['flip', 'turn', 'half'])] : [coordMove(R, ['flip', 'turn', 'half']), coordMove(R, ['slide'])];
  const pr = pairUnder(R, seq);
  if (!pr) return null;
  const { A, B } = pr;
  // page position: the k-th vertex from the left
  const rank = (P: V[]) => P.map(p => P.filter(q => q[0] < p[0]).length);
  const ra = rank(A), rb = rank(B);
  if (new Set(A.map(p => p[0])).size < 3 || new Set(B.map(p => p[0])).size < 3) return null;
  const letters = shuffle(R, DEF(3));
  const lab = (i: number) => letters[i]!;                    // the letter of the partner of vertex i
  const posPartner = (i: number) => lab(rb.indexOf(ra[i]!));  // the letter in the same page position
  const alpha = (i: number) => DEF(3)[i]!;
  const picture = pic({ axes: true, figs: [F1(A, 'first', ABC(3)), F1(B, 'pick', letters)], solve: { fig: 0, seq, to: 1 } });
  const base = { id: `partner-${mode}-${n}`, family: 'partner' as const, board: '' };
  const lead = `A sequence of slides, turns and flips maps ${Am('△ABC')} onto ${Pm('the other triangle')}.`;
  const sol = [`Move the tracing: ${seqWords(seq)}.`, `A lands on ${lab(0)}, B on ${lab(1)}, C on ${lab(2)}: △ABC ≅ △${lab(0)}${lab(1)}${lab(2)}.`];
  if (mode === 'corner') {
    const i = int(R, 0, 2), right = lab(i);
    if (alpha(i) === right && posPartner(i) === right) return null;
    return choiceItem(R, { ...base, prompt: `${lead} Which corner is the partner of ${Am(ABC(3)[i]!)}?`, picture, solution: sol },
      DEF(3).map(L => (L === right ? { t: L, ok: true, say: `Yes: the tracing carries ${ABC(3)[i]} onto ${L}.` }
        : L === posPartner(i) ? { t: L, mc: MC.byPosition, say: `${L} is in the same place on the page, but partners are decided by the move. Follow the tracing: ${ABC(3)[i]} lands on ${right}.` }
          : L === alpha(i) ? { t: L, mc: MC.byPosition, say: `The letters don’t decide it. Follow the tracing: ${ABC(3)[i]} lands on ${right}.` }
            : { t: L, say: `Follow the tracing: ${ABC(3)[i]} lands on ${right}.` })), true);
  }
  if (mode === 'side') {
    const i = int(R, 0, 2), j = (i + 1) % 3;
    const right = [lab(i), lab(j)].sort().join(''), name = ABC(3)[i]! + ABC(3)[j]!;
    const wrongAlpha = [alpha(i), alpha(j)].sort().join('');
    const sides = ['DE', 'EF', 'DF'];
    return choiceItem(R, { ...base, prompt: `${lead} Which side of ${Pm('the other triangle')} is the partner of side ${Am(name)}?`, picture, solution: [...sol, `So side ${name} lands on side ${right}.`] },
      sides.map(s => (s === right ? { t: `side ${s}`, ok: true, say: `Yes: ${name[0]} lands on ${lab(i)} and ${name[1]} on ${lab(j)}, so ${name} lands on ${right}.` }
        : s === wrongAlpha ? { t: `side ${s}`, mc: MC.byPosition, say: `Matching letters is not the test. Follow the tracing: ${name} lands on ${right}.` }
          : { t: `side ${s}`, say: `Follow both ends: ${name[0]} lands on ${lab(i)} and ${name[1]} on ${lab(j)}, so the partner is ${right}.` })), true);
  }
  const right = lab(0) + lab(1) + lab(2);
  const pos = posPartner(0) + posPartner(1) + posPartner(2);
  if (right === 'DEF') return null;
  const opts: Opt[] = [
    { t: `△ABC ≅ △${right}`, ok: true, say: `Yes: the letters are in partner order, A with ${lab(0)}, B with ${lab(1)}, C with ${lab(2)}.` },
    { t: '△ABC ≅ △DEF', mc: MC.stmtOrder, say: `The order of the letters matters: A goes with ${lab(0)}, so the statement starts △${lab(0)}…: △ABC ≅ △${right}.` },
  ];
  if (pos !== right && pos !== 'DEF' && new Set(pos).size === 3) opts.push({ t: `△ABC ≅ △${pos}`, mc: MC.byPosition, say: `That pairs corners by where they sit on the page. Follow the tracing: △ABC ≅ △${right}.` });
  for (const p of ['DFE', 'EDF', 'EFD', 'FDE', 'FED']) if (opts.length < 4 && !opts.some(o => o.t.endsWith(p))) opts.push({ t: `△ABC ≅ △${p}`, say: `Follow the tracing: A lands on ${lab(0)}, so it is △ABC ≅ △${right}.` });
  return choiceItem(R, { ...base, prompt: `${lead} Which congruence statement is right?`, picture, solution: sol }, opts);
});

// 3 rule-out-by-invariant: different collections of side lengths (or angles) mean no move can work
const RECT_AREA: [V, V, number][] = [[[6, 2], [4, 3], 12], [[8, 2], [4, 4], 16], [[6, 1], [3, 2], 6], [[8, 1], [4, 2], 8]];
const RECT_PERIM: [V, V, number][] = [[[6, 2], [5, 3], 16], [[5, 1], [4, 2], 12], [[5, 2], [4, 3], 14], [[6, 1], [4, 3], 14], [[7, 2], [5, 4], 18]];
const rect = (w: number, h: number, x = 0, y = 0): V[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const invariant: Gen = (R, n) => fitted(() => {
  const mode = pick(R, ['area', 'perim', 'rhombus', 'labels'] as const);
  const base = { id: `invariant-${mode}-${n}`, family: 'invariant' as const, board: '' };
  if (mode === 'area' || mode === 'perim') {
    const [p, q, val] = pick(R, mode === 'area' ? RECT_AREA : RECT_PERIM);
    const P = rect(p[0], p[1]), Q = rect(q[0], q[1], p[0] + 2, 0);
    const pl = [p[0], p[1]], ql = [q[0], q[1]];
    const odd = pl.find(x => !ql.includes(x))!;
    const what = mode === 'area' ? `the same area, ${val} square units` : `the same perimeter, ${val} units`;
    const picture = pic({ axes: false, figs: [F1(P, 'first', undefined, { tag: 'P', lens: lensOf(P).map((l, i) => (i < 2 ? l : null)) }), F1(Q, 'pick', undefined, { tag: 'Q', lens: lensOf(Q).map((l, i) => (i < 2 ? l : null)) })] });
    return choiceItem(R, { ...base, prompt: `${Am('Rectangle P')} is ${p[0]} by ${p[1]}. ${Pm('Rectangle Q')} is ${q[0]} by ${q[1]}. They have ${what}. Are they congruent?`, picture,
      solution: [`A slide, turn or flip never changes a length.`, `P has sides ${p[0]}, ${p[1]}, ${p[0]}, ${p[1]}; Q has ${q[0]}, ${q[1]}, ${q[0]}, ${q[1]}. P’s ${odd}-unit side has no partner in Q.`, 'So no sequence of moves can put P on Q: not congruent.'] }, [
      { t: `No: P has a side of ${odd} and Q has none, and moves never change a length`, ok: true, say: `Right. Whatever moves you try, P’s ${odd}-unit side would need a ${odd}-unit partner, and Q has none.` },
      { t: `Yes: ${mode === 'area' ? 'the same area' : 'the same perimeter'} means the same shape and size`, mc: MC.areaPerim, say: `${mode === 'area' ? 'Equal areas' : 'Equal perimeters'} can come from different rectangles. Compare the sides: ${p[0]} by ${p[1]} is not ${q[0]} by ${q[1]}.` },
      { t: 'No: a quarter turn of P does not fit on Q', mc: MC.failedSearch, say: 'One move that fails proves nothing: maybe another would work. The proof is the side lengths: no move changes them.' },
      { t: 'Yes: both are rectangles', mc: MC.looks, say: 'Being the same kind of shape is not enough. Count the sides: they are different lengths.' },
    ]);
  }
  if (mode === 'rhombus') {
    const s = 5;
    const P = rect(s, s), Q: V[] = [[s + 2, 0], [2 * s + 2, 0], [2 * s + 5, 4], [s + 5, 4]];
    const picture = pic({ axes: false, figs: [F1(P, 'first', undefined, { tag: 'P', lens: [String(s), String(s), null, null] }), F1(Q, 'pick', undefined, { tag: 'Q', lens: [String(s), String(s), null, null] })],
      rights: [{ fig: 0, at: 0 }], angles: [{ fig: 1, at: 0, text: '53°' }] });
    return choiceItem(R, { ...base, prompt: `${Am('Square P')} and ${Pm('rhombus Q')} both have four sides of ${s} units. The rhombus has angles of about 53° and 127°. Are they congruent?`, picture,
      solution: ['A slide, turn or flip never changes an angle.', 'P has four 90° angles; Q has none. A 90° corner of P has no partner in Q.', 'So no sequence of moves fits: not congruent.'] }, [
      { t: 'No: P’s angles are 90° and Q has no 90° angle, and moves never change an angle', ok: true, say: 'Right. Same sides are not enough: the angles must match too, and no move changes an angle.' },
      { t: `Yes: both have a perimeter of ${4 * s}`, mc: MC.areaPerim, say: 'The same perimeter does not make them congruent. Compare the angles: 90° against 53°.' },
      { t: 'Yes: every side matches', mc: MC.looks, say: 'Every side matches, but the angles don’t: the square has right angles, the rhombus has none.' },
      { t: 'No: turning P a quarter turn does not fit', mc: MC.failedSearch, say: 'One failed try proves nothing. The proof is the angles: 90° in P, none in Q.' },
    ]);
  }
  // a congruent pair, wrongly labeled: AB and DE differ, so the STATEMENT is wrong, not the congruence
  const T = normal([[0, 0], [4, 0], [0, 3]]);
  const seq: Move[] = [pick(R, [flipY, turn(1), turn(-1), turn(2)])];
  const A = at(T, int(R, -6, -4), int(R, -5, 2));
  const B = mapPts(seq, A);
  if (!inRange(B) || !apart(A, B)) return null;
  // letters for B so that side DE is NOT the image of AB
  const letters = pick(R, [['E', 'F', 'D'], ['F', 'D', 'E'], ['D', 'F', 'E'], ['E', 'D', 'F']]);
  const Pof = (L: string) => B[letters.indexOf(L)]!;
  const ab = gridLen(A[0]!, A[1]!), de = gridLen(Pof('D'), Pof('E'));
  if (!ab || !de || ab === de) return null;
  const [who] = two(R);
  const picture = pic({ axes: true, figs: [F1(A, 'first', ABC(3), { lens: lensOf(A) }), F1(B, 'pick', letters, { lens: lensOf(B) })], solve: { fig: 0, seq, to: 1 } });
  const right = letters.join('');
  return choiceItem(R, { ...base, prompt: `${who} wrote ${Am('△ABC')} ≅ ${Pm('△DEF')}. Then ${who} saw that AB = ${ab} but DE = ${de}. What can ${who} conclude?`, picture,
    solution: [`AB = ${ab} and DE = ${de}, so A, B cannot go to D, E in that order.`, `But the sides of both are 3, 4 and 5: a ${moveWords(seq[0]!)} maps A onto ${letters[0]}, B onto ${letters[1]}, C onto ${letters[2]}.`, `So the triangles are congruent; the right statement is △ABC ≅ △${right}.`] }, [
    { t: 'The statement pairs the wrong corners; the triangles can still be congruent', ok: true, say: `Right. The sides are 3, 4, 5 in both. Only the order was wrong: △ABC ≅ △${right}.` },
    { t: 'The triangles are not congruent', mc: MC.failedSearch, say: 'One wrong pairing doesn’t rule out every pairing. Both have sides 3, 4 and 5, and a move maps one onto the other.' },
    { t: 'A move must have changed the length of AB', mc: MC.sizeRigid, say: 'Slides, turns and flips never change a length. The pairing in the statement is what is wrong.' },
  ]);
});

// 4 vertex-orientation: which way round A -> B -> C goes, and which moves reverse it
const orientG: Gen = (R, n) => fitted(() => {
  const shown = R() < 0.5;
  const m = pick(R, [slide(int(R, -6, 6) || 2, int(R, -5, 5)), flipX, flipY, flipV(int(R, -2, 2)), flipH(int(R, -2, 2)), turn(1), turn(-1), turn(2), { kind: 'flip', line: { kind: 'd', p: [0, 0], s: 1 } } as Move]);
  let A = placed(R, shapeOf(R, R() < 0.3));
  if (R() < 0.5) A = A.slice().reverse();
  const Bp = mapPts([m], A);
  if (!inRange(Bp) || !apart(A, Bp)) return null;
  const n0 = A.length, o0 = orient(A), o1 = orient(Bp);
  const lettersA = ABC(n0), seqTxt = lettersA.join(' → '), img = primes(n0).join(' → ');
  const picture = pic({ axes: true, figs: [F1(A, 'first', lettersA), ...(shown ? [F1(Bp, 'pick', primes(n0))] : [])], orderArrows: [0], solve: { fig: 0, seq: [m], to: shown ? 1 : undefined } });
  const kind = m.kind === 'flip' ? 'flip' : m.kind === 'turn' ? 'turn' : 'slide';
  const prompt = shown
    ? `${Am(seqTxt)} goes ${roundWord(o0)}. A ${kind} maps it onto ${Pm(primes(n0).join(''))}. Which way does ${img} go?`
    : `${Am(seqTxt)} goes ${roundWord(o0)}. ${moveWords(m)[0]!.toUpperCase() + moveWords(m).slice(1)}. Which way does ${img} go?`;
  const base = { id: `orient-${kind}-${n}`, family: 'orient' as const, board: shown ? '' : moveTex(m), prompt, picture,
    solution: [`Trace ${img} in order on the image.`, reverses(m) ? 'A flip turns the tracing paper over, so the way round reverses.' : `A ${kind} keeps the tracing paper face up, so the way round stays the same.`, `${img} goes ${roundWord(o1)}.`] };
  return choiceItem(R, base, [
    { t: 'Counterclockwise', ok: o1 > 0, say: o1 > 0 ? `Yes: ${reverses(m) ? 'the flip reversed it' : `a ${kind} keeps the way round`}.` : (reverses(m) ? 'A flip turns the tracing over: the way round reverses. It goes clockwise.' : `A ${kind} never reverses the way round. It still goes clockwise.`), mc: o1 > 0 ? undefined : reverses(m) ? undefined : MC.turnReverses },
    { t: 'Clockwise', ok: o1 < 0, say: o1 < 0 ? `Yes: ${reverses(m) ? 'the flip reversed it' : `a ${kind} keeps the way round`}.` : (reverses(m) ? 'A flip turns the tracing over: the way round reverses. It goes counterclockwise.' : `A ${kind} never reverses the way round. It still goes counterclockwise.`), mc: o1 < 0 ? undefined : reverses(m) ? undefined : MC.turnReverses },
    { t: 'You can’t tell without measuring', say: `You can: only a flip reverses the way round. Here it goes ${roundWord(o1)}.` },
  ], true);
});

// 5 motion-type-by-orientation: one move; the way round and the direction of a side tell which kind
const whichMove: Gen = (R, n) => fitted(() => {
  const kind = pick(R, ['slide', 'flip', 'turn', 'half', 'half'] as const);
  const m: Move = kind === 'slide' ? slide(int(R, -6, 6) || 4, int(R, -5, 5)) : kind === 'flip' ? pick(R, [flipX, flipY, flipV(int(R, -2, 2)), flipH(int(R, -2, 2))])
    : kind === 'turn' ? turn(R() < 0.5 ? 1 : -1, pick(R, [[0, 0], [1, 0], [0, -1], [-1, 1]] as V[])) : turn(2, pick(R, [[0, 0], [1, 0], [0, 1]] as V[]));
  const A = placed(R, shapeOf(R));
  const Bp = mapPts([m], A);
  if (!inRange(Bp) || !apart(A, Bp)) return null;
  const picture = pic({ axes: true, figs: [F1(A, 'first', ABC(3)), F1(Bp, 'pick', primes(3))], orderArrows: [0, 1], solve: { fig: 0, seq: [m], to: 1 } });
  const kept = !reverses(m);
  const base = { id: `which-${kind}-${n}`, family: 'whichMove' as const, board: '', picture,
    prompt: `Exactly one move maps ${Am('△ABC')} onto ${Pm('△A′B′C′')}. Which kind of move is it?`,
    solution: [`A → B → C and A′ → B′ → C′ go ${kept ? 'the same way round' : 'opposite ways round'}${kept ? '' : ': only a flip does that'}.`,
      kind === 'slide' ? 'A′B′ points the same way as AB: a slide.' : kind === 'flip' ? `It is a flip: ${moveWords(m)}.` : kind === 'half' ? 'A′B′ is parallel to AB but points the opposite way: a half turn, not a slide.' : 'A′B′ points a new way: a turn.',
      `Check one more corner: ${moveWords(m)} takes C to C′ ${ptWords(mv(m, A[2]!))}.`] };
  const right = kind === 'slide' ? 0 : kind === 'flip' ? 2 : 1;
  const say = (i: number): Opt => {
    const t = ['A translation (a slide)', 'A rotation (a turn)', 'A reflection (a flip)'][i]!;
    if (i === right) return { t, ok: true, say: kind === 'half' ? 'Yes: a half turn. The sides stay parallel but point the opposite way.' : kind === 'flip' ? 'Yes: the way round reversed, and only a flip does that.' : kind === 'slide' ? 'Yes: same way round, and every side points the same way.' : 'Yes: same way round, but the sides point a new way.' };
    if (i === 0) return { t, mc: kind === 'half' ? MC.parallel : MC.anySlide, say: kind === 'half' ? 'The sides are parallel, but A′B′ points the opposite way to AB: that is a half turn.' : 'In a slide every side keeps pointing the same way. Here they don’t.' };
    if (i === 1) return { t, mc: kind === 'flip' ? MC.rotRefl : undefined, say: kind === 'flip' ? 'A turn keeps the way round. Here A → B → C reversed, so it is a flip.' : 'A turn would point the sides a new way. Here they all point the same way: a slide.' };
    return { t, mc: kind === 'turn' || kind === 'half' ? MC.rotRefl : undefined, say: kind === 'slide' ? 'A flip reverses the way round. Here it stayed the same.' : 'A flip would reverse the way round. It stayed the same, so it is a turn, even if it looks upside down.' };
  };
  return choiceItem(R, base, [say(0), say(1), say(2)], true);
});

// 6 specify-single-motion: every parameter, on the coordinate route
const specify: Gen = (R, n) => fitted(() => {
  const mode = pick(R, ['flip', 'turn', 'half', 'slide'] as const);
  const m: Move = mode === 'flip' ? (R() < 0.5 ? flipX : flipY) : mode === 'turn' ? turn(R() < 0.5 ? 1 : -1) : mode === 'half' ? turn(2) : slide(int(R, -6, 6) || 3, int(R, -6, 6) || -2);
  const A = placed(R, shapeOf(R));
  const Bp = mapPts([m], A);
  if (!inRange(Bp) || !apart(A, Bp) || A.some(p => veq(p, [0, 0]))) return null;
  const pa = A[0]!, pb = Bp[0]!;
  const picture = pic({ axes: true, figs: [F1(A, 'first', ABC(3)), F1(Bp, 'pick', primes(3))], solve: { fig: 0, seq: [m], to: 1 } });
  const base = { id: `specify-${mode}-${n}`, family: 'specify' as const, board: `A${ptTex(pa)} \\to A'${ptTex(pb)}`, picture };
  const lead = `One move maps ${Am('△ABC')} onto ${Pm('△A′B′C′')}.`;
  if (mode === 'slide') {
    const d = (m as { d: V }).d;
    const it = pointItem({ ...base, prompt: `${lead} It is a slide. Fill in its rule.`, solution: [`A ${ptWords(pa)} goes to A′ ${ptWords(pb)}.`, `x changes by ${n2(d[0])}, y by ${n2(d[1])}: the rule is (x, y) → (x ${d[0] < 0 ? '−' : '+'} ${Math.abs(d[0])}, y ${d[1] < 0 ? '−' : '+'} ${Math.abs(d[1])}).`] },
      d, '(x, y) → (x +', `Yes: every point moves ${n2(d[0])} across and ${n2(d[1])} up.`, [
        { v: [-d[0], -d[1]], say: 'That slide goes from A′ back to A. Count from A to A′.' },
        { v: [d[1], d[0]], say: 'The across change goes with x, the up change with y.' },
      ], `Count from A to A′: across ${n2(d[0])}, up ${n2(d[1])}.`);
    it.pairOp = ', y +';
    return it;
  }
  if (mode === 'flip') {
    const axis = veq(mv(flipX, pa), pb) ? 'x' : 'y';
    const rule = axis === 'x' ? '(x, −y)' : '(−x, y)', other = axis === 'x' ? '(−x, y)' : '(x, −y)';
    return choiceItem(R, { ...base, prompt: `${lead} Which description says exactly what the move is?`, solution: [`Each corner stays the same distance from the ${axis}-axis, on the other side.`, `${axis === 'x' ? 'y' : 'x'} changes sign: the flip over the ${axis}-axis, (x, y) → ${rule}.`] }, [
      { t: `A flip over the ${axis}-axis: (x, y) → ${rule}`, ok: true, say: `Yes: the ${axis}-axis is the mirror line, so ${axis === 'x' ? 'y' : 'x'} changes sign.` },
      { t: `A flip over the ${axis}-axis: (x, y) → ${other}`, mc: MC.namedCoord, say: `A flip over the ${axis}-axis keeps ${axis} and changes the sign of ${axis === 'x' ? 'y' : 'x'}: ${rule}.` },
      { t: `A flip over the ${axis === 'x' ? 'y' : 'x'}-axis: (x, y) → ${other}`, say: `Look at A: it went across the ${axis}-axis, so that is the mirror line.` },
      { t: 'A flip', mc: MC.noParams, say: `True, but which line? A flip is only fixed by its mirror line: the ${axis}-axis.` },
    ]);
  }
  const q = (m as { q: number }).q;
  const r = ruleOf(m)!, rw = ruleWordsOf(r);
  const turnAboutA = { t: `A turn of ${Math.abs(q) * 90}°${Math.abs(q) === 2 ? '' : q > 0 ? ' counterclockwise' : ' clockwise'} about A`, mc: MC.wrongCenter, say: 'Turning about A would keep A still, but A moved. The center is the origin.' };
  if (mode === 'half') return choiceItem(R, { ...base, prompt: `${lead} Which description says exactly what the move is?`, solution: ['Every corner went through the origin to the other side, just as far.', `A 180° turn about the origin: ${rw}.`] }, [
    { t: `A 180° turn about the origin: ${rw}`, ok: true, say: 'Yes: both coordinates change sign.' },
    turnAboutA,
    { t: 'A 180° turn', mc: MC.noParams, say: 'About which point? A turn is fixed by its center too: the origin.' },
    { t: 'A flip over the x-axis: (x, y) → (x, −y)', say: 'A flip would reverse the way round. Here both coordinates change sign: a 180° turn.' },
  ]);
  const other = ruleWordsOf(ruleOf(turn(-q))!);
  return choiceItem(R, { ...base, prompt: `${lead} Which description says exactly what the move is?`, solution: [`A ${ptWords(pa)} goes to A′ ${ptWords(pb)}: the coordinates swap and one changes sign.`, `A 90° turn ${q > 0 ? 'counterclockwise' : 'clockwise'} about the origin: ${rw}.`] }, [
    { t: `A 90° turn ${q > 0 ? 'counterclockwise' : 'clockwise'} about the origin: ${rw}`, ok: true, say: `Yes: check A ${ptWords(pa)} → ${ptWords(pb)}.` },
    { t: `A 90° turn ${q > 0 ? 'clockwise' : 'counterclockwise'} about the origin: ${other}`, say: `Check A: that rule sends it to ${ptWords(mv(turn(-q), pa))}, not ${ptWords(pb)}.` },
    turnAboutA,
    { t: 'A 90° turn', mc: MC.noParams, say: 'Which way, and about which point? A turn needs its center and direction: the origin, ' + (q > 0 ? 'counterclockwise.' : 'clockwise.') },
  ]);
});

// 7 execute-given-sequence: the output of step 1 is the input of step 2
const sequence: Gen = (R, n) => fitted(() => {
  const order = pick(R, ['slideFirst', 'moveFirst'] as const);
  const other = coordMove(R, ['flip', 'turn', 'half']), sl = coordMove(R, ['slide']);
  const seq = order === 'slideFirst' ? [sl, other] : [other, sl];
  const pr = pairUnder(R, seq, R() < 0.3);
  if (!pr) return null;
  const { A } = pr;
  const p = A[0]!, mid = mv(seq[0]!, p), end = runSeq(seq, p), skip = mv(seq[1]!, p);
  if (veq(skip, end) || veq(mid, end)) return null;
  const nV = A.length;
  const picture = pic({ axes: true, figs: [F1(A, 'first', ABC(nV))], more: ['\\text{then}\\ ' + moveTex(seq[1]!)], solve: { fig: 0, seq } });
  return pointItem({ id: `sequence-${order}-${n}`, family: 'sequence', board: moveTex(seq[0]!), picture,
    prompt: `${Am(`A is at ${ptWords(p)}`)}. ${Bm(moveWords(seq[0]!)[0]!.toUpperCase() + moveWords(seq[0]!).slice(1))}, then ${Bm(moveWords(seq[1]!))}. Where does A end up?`,
    solution: [`Step 1: ${moveWords(seq[0]!)} takes A ${ptWords(p)} to A′ ${ptWords(mid)}.`, `Step 2 starts from A′: ${moveWords(seq[1]!)} takes it to A″ ${ptWords(end)}.`] },
  end, 'A″ = (', `Yes: A′ is ${ptWords(mid)}, and step 2 takes it to ${ptWords(end)}.`, [
    { v: skip, mc: MC.toOriginal, say: `That is step 2 done to A itself. Step 2 starts where step 1 ended: A′ ${ptWords(mid)}.` },
    { v: mid, say: `That is A′, after step 1 only. Now do step 2 to it.` },
  ], `Do one step at a time: A′ = ${ptWords(mid)}, then step 2.`);
});

// 8 order-dependence: sometimes the order matters, sometimes not
const order: Gen = (R, n) => fitted(() => {
  const mode = pick(R, ['perp', 'perp', 'para', 'twoSlides', 'mixed'] as const);
  const a = (int(R, 2, 5)) * (R() < 0.5 ? -1 : 1);
  let m1: Move, m2: Move;
  if (mode === 'perp') { const f = R() < 0.5 ? flipY : flipX; m1 = f === flipY ? slide(a, 0) : slide(0, a); m2 = f; }
  else if (mode === 'para') { const f = R() < 0.5 ? flipY : flipX; m1 = f === flipY ? slide(0, a) : slide(a, 0); m2 = f; }
  else if (mode === 'twoSlides') { m1 = slide(a, 0); m2 = slide(0, int(R, 2, 4) * (R() < 0.5 ? -1 : 1)); }
  else { m1 = slide(a, int(R, 1, 3) * (R() < 0.5 ? -1 : 1)); m2 = R() < 0.5 ? flipY : flipX; }
  if (R() < 0.5) [m1, m2] = [m2, m1];
  const s1 = [m1, m2], s2 = [m2, m1];
  const pr = pairUnder(R, s1);
  if (!pr) return null;
  const B2 = mapPts(s2, pr.A);
  if (!inRange(B2) || mapPts([m1], pr.A).some(p => Math.abs(p[0]) > 6 || Math.abs(p[1]) > 6) || mapPts([m2], pr.A).some(p => Math.abs(p[0]) > 6 || Math.abs(p[1]) > 6)) return null;
  const same = sameMap(pr.B, B2);
  const picture = pic({ axes: true, figs: [F1(pr.A, 'first', ABC(3))], solve: { fig: 0, seq: s1, also: s2 } });
  const why = same
    ? (mode === 'twoSlides' ? 'Two slides add up the same either way.' : 'The slide runs along the mirror line, so it does not care which side of the line the figure is on.')
    : 'The slide moves the figure toward or away from the mirror line, so the flip sends it to a different place.';
  return choiceItem(R, { id: `order-${mode}-${n}`, family: 'order', board: `1.\\ ${moveTex(m1)},\\ ${moveTex(m2)}`, picture,
    prompt: `Order 1: ${Bm(moveWords(m1))}, then ${Bm(moveWords(m2))}. Order 2: the same two moves the other way round. Do both orders give the same image of ${Am('△ABC')}?`,
    solution: ['Do both orders on the tracing (lime: order 1, lavender: order 2).', same ? 'They land in the same place.' : 'They land in different places.', why] }, [
    { t: 'Yes: the same image', ok: same, mc: same ? undefined : MC.orderNever, say: same ? `Yes. ${why}` : `Try it: they land in different places. ${why}` },
    { t: 'No: different images', ok: !same, mc: same ? MC.orderAlways : undefined, say: same ? `Try it: both land in the same place. ${why}` : `Yes. ${why}` },
    { t: 'It depends on where △ABC starts', say: same ? `Not here: for every starting place the two orders agree. ${why}` : `Not here: for every starting place the two orders disagree. ${why}` },
  ], true);
});

// 9 verify-whole-figure: a proposed sequence must put EVERY corner on its partner
const verify: Gen = (R, n) => fitted(() => {
  const mode = pick(R, ['ok', 'partial', 'partial', 'labels'] as const);
  const seq = [coordMove(R, ['flip', 'turn', 'half']), coordMove(R, ['slide'])];
  const pr = pairUnder(R, seq);
  if (!pr) return null;
  const { A, B } = pr;
  let claim = seq, letters = DEF(3);
  if (mode === 'partial') {
    // one slide that takes A to D: it matches one corner only
    const d: V = [B[0]![0] - A[0]![0], B[0]![1] - A[0]![1]];
    claim = [slide(d[0], d[1])];
    if (mapsOnto(claim, A, B)) return null;
  }
  if (mode === 'labels') letters = pick(R, [['E', 'F', 'D'], ['F', 'D', 'E']]);
  const tgt = letters;  // the letter written at B[i]
  const [who] = two(R);
  const target: V[] = DEF(3).map(L => B[tgt.indexOf(L)]!);   // D, E, F in letter order
  const picture = pic({ axes: true, figs: [F1(A, 'first', ABC(3)), F1(B, 'pick', tgt)], more: claim.length > 1 ? ['\\text{then}\\ ' + moveTex(claim[1]!)] : undefined, solve: { fig: 0, seq: claim, to: 1, miss: mode !== 'ok' } });
  const end = mapPts(claim, A);
  const ok = sameMap(end, target);
  const lands = (i: number) => { const j = B.findIndex(q => veq(q, end[i]!)); return j < 0 ? 'nowhere on △DEF' : tgt[j]!; };
  return choiceItem(R, { id: `verify-${mode}-${n}`, family: 'verify', board: moveTex(claim[0]!), picture,
    prompt: `${who} says ${claim.length > 1 ? 'these moves map' : 'this move maps'} ${Am('△ABC')} onto ${Pm('△DEF')}, with A on D, B on E and C on F. Is ${who} right?`,
    solution: [`Do it on the tracing: ${seqWords(claim)}.`, `A lands on ${lands(0)}, B on ${lands(1)}, C on ${lands(2)}.`, ok ? 'Every corner is on its partner: it works.' : 'Not every corner lands on its partner, so it does not work.'] }, [
    { t: 'Yes: every corner lands on its partner', ok, mc: ok ? undefined : mode === 'labels' ? MC.labels : MC.partial, say: ok ? 'Yes: A on D, B on E, C on F.' : mode === 'labels' ? `The tracing lands on the triangle, but A lands on ${lands(0)}, not D. The corners must match too.` : 'A lands on D, but check the others: B and C miss. One corner is not enough.' },
    { t: 'No: A lands on D, but not every other corner lands on its partner', ok: mode === 'partial', say: mode === 'partial' ? 'Right: one corner matching is not enough; B and C miss.' : mode === 'ok' ? 'Check again: B lands on E and C on F too.' : `Look at A: it lands on ${lands(0)}, not D.` },
    { t: 'No: it lands on the triangle, but on the wrong corners', ok: mode === 'labels', say: mode === 'labels' ? `Right: the outline fits, but A lands on ${lands(0)}, not on D.` : mode === 'ok' ? 'Check the letters: A on D, B on E, C on F. They all match.' : 'It does not even land on the triangle: B and C miss.' },
  ], true);
});

// 10 plan-sequence: choose a sequence that works (any valid one; more than one step is fine)
const plan: Gen = (R, n) => fitted(() => {
  const first = coordMove(R, ['flip', 'turn', 'half']);
  const seq = [first, coordMove(R, ['slide'])];
  const pr = pairUnder(R, seq);
  if (!pr) return null;
  const { A, B } = pr;
  const d0: V = [B[0]![0] - A[0]![0], B[0]![1] - A[0]![1]];
  const wrongFirst: Move = first.kind === 'flip' ? (first === flipX ? flipY : flipX) : first.kind === 'turn' && Math.abs(first.q) === 1 ? turn(-first.q) : flipX;
  const wf = mv(wrongFirst, A[0]!);
  const c1 = [first, slide(d0[0], d0[1])];                      // the slide counted from the ORIGINAL corner
  const c2 = [wrongFirst, slide(B[0]![0] - wf[0], B[0]![1] - wf[1])];   // the wrong first move, then a slide fixing A only
  if (mapsOnto(c1, A, B) || mapsOnto(c2, A, B) || (c1[1] as { d: V }).d.every(x => x === 0) || seqWords(c1) === seqWords(seq)) return null;
  const picture = pic({ axes: true, figs: [F1(A, 'first', ABC(3)), F1(B, 'pick', DEF(3))], solve: { fig: 0, seq, to: 1 } });
  const mid = mapPts([first], A);
  return choiceItem(R, { id: `plan-${first.kind}-${n}`, family: 'plan', board: '', picture,
    prompt: `Which moves map ${Am('△ABC')} onto ${Pm('△DEF')} (A on D, B on E, C on F)?`,
    solution: [`First fix the way round and the direction: ${moveWords(first)} gives A′ ${ptWords(mid[0]!)}.`, `Then slide from A′ to D ${ptWords(B[0]!)}: ${moveWords(seq[1]!).replace('slide ', '')}.`, 'Check every corner: all three land on their partners.'] }, [
    { t: `${seqWords(seq)[0]!.toUpperCase()}${seqWords(seq).slice(1)}`, ok: true, say: 'Yes: every corner lands on its partner.' },
    { t: `${seqWords(c1)[0]!.toUpperCase()}${seqWords(c1).slice(1)}`, mc: MC.toOriginal, say: `That slide is counted from A, but the slide starts where the first move left A: at A′ ${ptWords(mid[0]!)}.` },
    { t: `${seqWords(c2)[0]!.toUpperCase()}${seqWords(c2).slice(1)}`, say: 'A lands on D, but B and C don’t: the first move has to make the triangle face the right way.' },
    { t: 'None: no single move maps △ABC onto △DEF', mc: MC.oneStep, say: 'A congruence may take more than one move. Two moves do it here.' },
  ]);
});

// 11 fix-mirror-placement: two corners matched, the third on the wrong side: flip over the matched side
const finish: Gen = (R, n) => fitted(() => {
  const T = shapeOf(R);
  // the target with side DE on a grid line (horizontal or vertical)
  let D: V[] = placed(R, T, 6);
  const i = [0, 1, 2].find(k => D[k]![0] === D[(k + 1) % 3]![0] || D[k]![1] === D[(k + 1) % 3]![1]);
  if (i === undefined) return null;
  D = [D[i]!, D[(i + 1) % 3]!, D[(i + 2) % 3]!];
  const L = D[0]![0] === D[1]![0] ? { kind: 'v' as const, x: D[0]![0] } : { kind: 'h' as const, y: D[0]![1] };
  const flip: Move = { kind: 'flip', line: L };
  const cur: V[] = [D[0]!, D[1]!, mv(flip, D[2]!)];
  if (!inRange(cur)) return null;
  const lineName = L.kind === 'v' ? `x = ${n2(L.x)}` : `y = ${n2(L.y)}`;
  const picture = pic({ axes: false, figs: [F1(D, 'pick', DEF(3)), F1(cur, 'first', ['', '', 'C′'])], solve: { fig: 1, seq: [flip], to: 0 } });
  return choiceItem(R, { id: `finish-${n}`, family: 'finish', board: '', picture,
    prompt: `A slide and a turn moved the tracing of △ABC so that ${Am('A′')} is on ${Pm('D')} and ${Am('B′')} is on ${Pm('E')}. Is the job done?`,
    solution: ['Check the third corner: C′ is not on F. It is F’s mirror image across side DE.', 'Flip the tracing over the line through D and E: D and E stay put, and C′ lands on F.'] }, [
    { t: 'Not yet: flip the tracing over the line through D and E', ok: true, say: 'Yes: D and E stay where they are, and C′ swings over onto F.' },
    { t: 'Yes: two corners match, so the triangle matches', mc: MC.twoVertices, say: 'Look at C′: it is on the wrong side of DE. Two corners are not enough: the mirror image also fits them.' },
    { t: 'Not yet: turn the tracing 180° about D', say: 'That moves E away from B′. Keep D and E still: flip over the line through them.' },
    { t: 'Not yet: slide the tracing until C′ is on F', say: 'A slide would pull A′ and B′ off D and E. Flip over the line through D and E instead.' },
  ]);
});

// 12 equivalent-sequences: different sequences can show the same congruence
const twoWays: Gen = (R, n) => fitted(() => {
  const mode = pick(R, ['half', 'para', 'swap', 'wrong', 'wrong'] as const);
  const a = int(R, 2, 5) * (R() < 0.5 ? -1 : 1), b = int(R, 2, 4) * (R() < 0.5 ? -1 : 1);
  let s1: Move[], s2: Move[];
  if (mode === 'half') { s1 = [turn(2)]; s2 = R() < 0.5 ? [flipX, flipY] : [flipY, flipX]; }
  else if (mode === 'para') { const f = R() < 0.5 ? flipY : flipX; const s = f === flipY ? slide(0, b) : slide(a, 0); s1 = [f, s]; s2 = [s, f]; }
  else if (mode === 'swap') { s1 = [flipY, slide(a, b)]; s2 = [slide(-a, b), flipY]; }
  else { const f = R() < 0.5 ? flipY : flipX; const s = f === flipY ? slide(a, b) : slide(a, b); s1 = [f, s]; s2 = [s, f]; }
  const pr = pairUnder(R, s1);
  if (!pr) return null;
  for (let k = 1; k <= s2.length; k++) if (!inRange(mapPts(s2.slice(0, k), pr.A))) return null;
  const ok2 = mapsOnto(s2, pr.A, pr.B);
  if ((mode === 'wrong') === ok2) return null;
  const [p1, p2] = two(R);
  const picture = pic({ axes: true, figs: [F1(pr.A, 'first', ABC(3)), F1(pr.B, 'pick', DEF(3))], solve: { fig: 0, seq: s1, to: 1, also: s2 } });
  return choiceItem(R, { id: `twoWays-${mode}-${n}`, family: 'twoWays', board: '', picture,
    prompt: `${p1}: ${Bm(seqWords(s1))}. ${p2}: ${Bm(seqWords(s2))}. Both say their moves map ${Am('△ABC')} onto △DEF. Who is right?`,
    solution: [`Do ${p1}’s moves (lime) and ${p2}’s moves (lavender) on the tracing.`, ok2 ? 'Both land on △DEF, corner on corner.' : `${p1}’s land on △DEF; ${p2}’s land somewhere else.`, ok2 ? 'Different sequences can show the same congruence.' : 'Each sequence has to be checked on its own.'] }, [
    { t: `Both of them`, ok: ok2, say: ok2 ? 'Yes: two different sequences, the same end. Any sequence that works is right.' : `Check ${p2}’s moves on the tracing: they land somewhere else.` },
    { t: `Only ${p1}: there is just one right sequence`, ok: !ok2, mc: ok2 ? MC.oneSeq : undefined, say: ok2 ? `${p2}’s moves land on △DEF too. More than one sequence can be right.` : `Yes: ${p1}’s moves work and ${p2}’s don’t, as the tracing shows.` },
    { t: `Only ${p2}`, mc: ok2 ? MC.oneSeq : undefined, say: ok2 ? `${p1}’s moves work too: both land on △DEF.` : `${p2}’s moves land somewhere else. ${p1}’s work.` },
    { t: 'Neither of them', say: `${p1}’s moves land on △DEF, corner on corner.` },
  ], true);
});

// 13 reverse-sequence: undo in reverse order, each step undone
const undo: Gen = (R, n) => fitted(() => {
  const kind = pick(R, ['slideTurn', 'slideFlip', 'turnSlide', 'flipSlide'] as const);
  const sl = coordMove(R, ['slide']), tu = turn(R() < 0.5 ? 1 : -1), fl = R() < 0.5 ? flipX : flipY;
  const seq = kind === 'slideTurn' ? [sl, tu] : kind === 'slideFlip' ? [sl, fl] : kind === 'turnSlide' ? [tu, sl] : [fl, sl];
  const pr = pairUnder(R, seq);
  if (!pr) return null;
  const { A, B } = pr;
  const right = inverseSeq(seq), sameOrder = seq.map(inverse), revOnly = seq.slice().reverse(), again = seq.slice();
  const wrongs: [Move[], string, string][] = [
    [sameOrder, MC.undoOrder, 'Each step is undone, but in the old order. Undo the last move first.'],
    [revOnly, MC.reverseOnly, 'The order is reversed, but each move still goes the old way. Each step has to be undone too.'],
    [again, MC.repeat, 'Doing the same moves again moves it further, not back.'],
  ];
  const texts = new Set([seqWords(right)]);
  const opts: Opt[] = [{ t: seqWords(right), ok: true, say: 'Yes: the last move is undone first, and each move goes back the other way.' }];
  for (const [s, mc, say] of wrongs) {
    const t = seqWords(s);
    if (texts.has(t) || mapsOnto(s, B, A)) continue;
    texts.add(t); opts.push({ t, mc, say });
  }
  if (opts.length < 3) return null;
  const picture = pic({ axes: true, figs: [F1(B, 'first', primes(3, 2)), F1(A, 'pick', ABC(3))], solve: { fig: 0, seq: right, to: 1 } });
  const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
  return choiceItem(R, { id: `undo-${kind}-${n}`, family: 'undo', board: moveTex(seq[0]!), picture: { ...picture, more: ['\\text{then}\\ ' + moveTex(seq[1]!)] },
    prompt: `${cap(seqWords(seq))}: these moves took △ABC to ${Am('△A″B″C″')}. Which moves take ${Am('△A″B″C″')} back onto ${Pm('△ABC')}?`,
    solution: [`The last move was ${moveWords(seq[1]!)}: undo it first, ${moveWords(inverse(seq[1]!))}.`, `Then undo the first: ${moveWords(inverse(seq[0]!))}.`, 'Check: every corner is back on its partner.'] },
  opts.map(o => ({ ...o, t: cap(o.t) })));
});

// 14 dilation-not-rigid: lengths change, so a dilation with k ≠ 1 is not a rigid motion
const dilate: Gen = (R, n) => fitted(() => {
  const mode = pick(R, ['num', 'num', 'rigid'] as const);
  const k = pick(R, [2, 2, 3, 0.5]);
  const center: V = pick(R, [[0, 0], [0, 0], [1, 1], [-1, 0]] as V[]);
  const L = k === 0.5 ? pick(R, [2, 4, 6]) : int(R, 1, k === 3 ? 2 : 3);
  const h = k === 0.5 ? pick(R, [2, 4]) : int(R, 1, 2);
  const x0 = k === 0.5 ? pick(R, [-4, -2, 0, 2]) : int(R, -2, 1), y0 = k === 0.5 ? pick(R, [-4, -2, 2]) : int(R, -2, 1);
  const A: V[] = R() < 0.5 ? [[x0, y0], [x0 + L, y0], [x0, y0 + h]] : [[x0, y0], [x0 + L, y0], [x0 + L, y0 + h]];
  const m = dil(k, center);
  const Bp = mapPts([m], A);
  if (!inRange(Bp, 7) || !inRange(A) || Bp.some((p, i) => veq(p, A[i]!))) return null;
  const kw = k === 0.5 ? '1/2' : String(k), ab = L * k;
  const base = { id: `dilate-${mode}-${n}`, family: 'dilate' as const, board: moveTex(m) };
  if (mode === 'num') {
    const picture = pic({ axes: true, figs: [F1(A, 'first', ABC(3), { lens: [String(L), null, null] })], pins: [{ p: center, label: veq(center, [0, 0]) ? undefined : 'P' }], solve: { fig: 0, seq: [m] } });
    const it: CongItem = { ...base, input: 'num', unit: 'units', picture,
      prompt: `${Am(`AB is ${L} units long`)}. ${Bm(`Dilate △ABC by a scale factor of ${kw}`)} about ${veq(center, [0, 0]) ? 'the origin' : 'P'}. How long is A′B′?`,
      solution: [`A dilation multiplies every length by the scale factor: ${L} × ${kw} = ${ab}.`, `A′B′ = ${ab}, not ${L}: the dilation changed a length, so it is not a rigid motion.`],
      answer: { kind: 'num', v: ab },
      check: r => r.kind !== 'num' ? { ok: false, say: 'Type a number.' } : Math.abs(r.v - ab) < 1e-9 ? { ok: true, say: `Yes: ${L} × ${kw} = ${ab}. The length changed, so this is not a rigid motion.` }
        : r.v === L ? { ok: false, mc: MC.sizeRigid, say: `A dilation is not a slide or a turn: it multiplies every length by ${kw}. A′B′ = ${ab}.` }
          : { ok: false, say: `Multiply by the scale factor: ${L} × ${kw} = ${ab}.` } };
    PROBES.set(it, [{ r: { kind: 'num', v: L }, mc: MC.sizeRigid }]);
    return it;
  }
  const picture = pic({ axes: true, figs: [F1(A, 'first', ABC(3), { lens: [String(L), null, null] }), F1(Bp, 'pick', primes(3), { lens: [String(ab), null, null] })], pins: [{ p: center, label: veq(center, [0, 0]) ? undefined : 'P' }], solve: { fig: 0, seq: [m], to: 1 } });
  return choiceItem(R, { ...base, picture, prompt: `${Bm(`A dilation by ${kw}`)} maps ${Am('△ABC')} onto △A′B′C′. Is this dilation a rigid motion?`,
    solution: [`AB = ${L} but A′B′ = ${ab}: a length changed.`, 'A rigid motion keeps every distance, so this dilation is not rigid, and △A′B′C′ is not congruent to △ABC.'] }, [
    { t: `No: AB is ${L} but A′B′ is ${ab}, and a rigid motion keeps every distance`, ok: true, say: 'Right. One length that changes is enough to show it is not rigid.' },
    { t: 'Yes: every angle stayed the same', mc: MC.angles, say: `The angles stayed the same, but the size did not: AB = ${L}, A′B′ = ${ab}. Equal angles don’t make a congruence.` },
    { t: 'Yes: the triangle only moved, like a slide', mc: MC.anySlide, say: `It did more than move: every length was multiplied by ${kw}.` },
    { t: 'Yes: transformations never change size', mc: MC.sizeRigid, say: `Slides, turns and flips don’t, but a dilation does: ${L} became ${ab}.` },
  ]);
});

// 15 identity-dilation: scale factor 1 changes nothing: the one dilation that is rigid
const identity: Gen = (R, n) => fitted(() => {
  const mode = pick(R, ['which', 'k1', 'center'] as const);
  const A = placed(R, shapeOf(R), 3);
  const center: V = mode === 'center' ? A[0]! : [0, 0];
  const base = { id: `identity-${mode}-${n}`, family: 'identity' as const };
  if (mode === 'which') {
    const k = pick(R, [2, 0.5]);
    const Bp = mapPts([dil(k)], A);
    if (!inRange(Bp, 7) || A.some(p => veq(p, [0, 0]))) return null;
    const picture = pic({ axes: true, figs: [F1(A, 'first', ABC(3))], pins: [{ p: [0, 0] }], solve: { fig: 0, seq: [dil(k)] } });
    return choiceItem(R, { ...base, board: '', picture, prompt: `△ABC can be dilated about the origin by different scale factors. Which dilation is a rigid motion?`,
      solution: ['A rigid motion keeps every distance.', 'Scale factor 1 multiplies every distance by 1: nothing changes. That dilation is rigid; every other one changes the lengths.'] }, [
      { t: 'Scale factor 2', say: 'Scale factor 2 doubles every length: not rigid.' },
      { t: 'Scale factor 1/2', say: 'Scale factor 1/2 halves every length: not rigid.' },
      { t: 'Scale factor 1', ok: true, say: 'Yes: every distance times 1 stays the same. It is the identity: a dilation AND a rigid motion.' },
      { t: 'None: a dilation is never a rigid motion', mc: MC.disjoint, say: 'Scale factor 1 is the exception: every distance stays the same, so it is rigid.' },
    ], true);
  }
  if (mode === 'k1') {
    const picture = pic({ axes: true, figs: [F1(A, 'first', ABC(3))], pins: [{ p: [0, 0] }] });
    return choiceItem(R, { ...base, board: moveTex(dil(1)), picture, prompt: `${Am('△ABC')} is ${Bm('dilated by a scale factor of 1')} about the origin. Is this dilation a rigid motion?`,
      solution: ['Every distance from the origin is multiplied by 1: every point stays where it is.', 'So every distance is kept: the dilation by 1 is a rigid motion (it does nothing at all).'] }, [
      { t: 'Yes: every point stays put, so every distance is kept', ok: true, say: 'Yes: scale factor 1 is the identity. It is a dilation and a rigid motion.' },
      { t: 'No: a dilation is never a rigid motion', mc: MC.disjoint, say: 'Usually not, but scale factor 1 keeps every distance, so this one is rigid.' },
      { t: 'No: only slides, turns and flips can be rigid', mc: MC.disjoint, say: 'Rigid means every distance is kept. Scale factor 1 keeps them all.' },
      { t: 'Yes: because its center stays fixed', say: 'Every dilation keeps its center fixed, even scale factor 2. The reason is that EVERY distance is kept.' },
    ]);
  }
  const k = pick(R, [2, 0.5]);
  const Bp = mapPts([dil(k, center)], A);
  if (!inRange(Bp, 7)) return null;
  const ab = gridLen(A[0]!, A[1]!), ab2 = gridLen(Bp[0]!, Bp[1]!);
  if (!ab || !ab2) return null;
  const picture = pic({ axes: true, figs: [F1(A, 'first', ABC(3), { lens: [ab, null, null] }), F1(Bp, 'pick', ['', 'B′', 'C′'], { lens: [ab2, null, null] })] });
  return choiceItem(R, { ...base, board: moveTex(dil(k, center)), picture, prompt: `${Bm(`A dilation by ${k === 0.5 ? '1/2' : k}`)} about corner A keeps A fixed. Is it a rigid motion?`,
    solution: [`AB = ${ab} but AB′ = ${ab2}.`, 'One fixed point is not enough: a rigid motion has to keep EVERY distance.'] }, [
    { t: `No: AB changes from ${ab} to ${ab2}; one fixed point is not enough`, ok: true, say: 'Right. Rigid means every distance is kept, not just that one point stays still.' },
    { t: 'Yes: point A does not move', say: `A stays put, but B moves: AB went from ${ab} to ${ab2}. Every distance must stay the same.` },
    { t: 'Yes: the angles stay the same', mc: MC.angles, say: `The angles do stay the same, but the lengths don’t: ${ab} became ${ab2}.` },
  ]);
});

// 16 transformation-properties-table: orientation kept or reversed; congruent or not
const table: Gen = (R, n) => fitted(() => {
  const mode = pick(R, ['row', 'row', 'row', 'shape', 'general'] as const);
  const kind = pick(R, ['slide', 'flip', 'turn', 'half', 'dil2', 'dilHalf', 'dil1'] as const);
  const m: Move = kind === 'slide' ? slide(int(R, -5, 5) || 3, int(R, -4, 4)) : kind === 'flip' ? (R() < 0.5 ? flipX : flipY) : kind === 'turn' ? turn(R() < 0.5 ? 1 : -1) : kind === 'half' ? turn(2) : dil(kind === 'dil2' ? 2 : kind === 'dilHalf' ? 0.5 : 1);
  const A = mode === 'shape' || kind.startsWith('dil') ? placed(R, (pick(R, [[[0, 0], [2, 0], [0, 1]], [[0, 0], [2, 0], [2, 1]], [[0, 0], [4, 0], [0, 2]]]) as V[]), 3) : placed(R, shapeOf(R));
  const mm = mode === 'shape' ? dil(pick(R, [2, 0.5])) : m;
  const Bp = mapPts([mm], A);
  if (!inRange(Bp, 7) || (mm.kind !== 'dil' && !apart(A, Bp)) || (mm.kind === 'dil' && mm.k !== 1 && A.some(p => veq(p, [0, 0])))) return null;
  if (mm.kind === 'dil' && Bp.some(p => !Number.isInteger(p[0] * 2) || !Number.isInteger(p[1] * 2))) return null;
  const rigid = isRigid(mm), rev = reverses(mm);
  const figs = [F1(A, 'first', ABC(3), { lens: lensOf(A) })];
  if (mm.kind !== 'dil' || mm.k !== 1) figs.push(F1(Bp, 'pick', primes(3), { lens: lensOf(Bp) }));
  const picture = pic({ axes: true, figs, orderArrows: [0], solve: { fig: 0, seq: [mm], to: figs.length > 1 ? 1 : undefined } });
  const base = { id: `table-${mode}-${kind}-${n}`, family: 'table' as const, board: moveTex(mm), picture };
  const name = moveWords(mm);
  if (mode === 'shape') {
    const k = (mm as { k: number }).k;
    return choiceItem(R, { ...base, prompt: `${Am('△ABC')} is ${Bm(name.replace('dilate', 'dilated'))}. Is the image the same shape as △ABC?`,
      solution: ['Every angle stays the same; every length is multiplied by ' + (k === 2 ? '2' : '1/2') + '.', 'Same shape, different size: similar, but not congruent.'] }, [
      { t: 'Yes: same angles, different size: similar but not congruent', ok: true, say: 'Right. A dilation keeps the shape and changes the size.' },
      { t: 'No: a bigger or smaller triangle is a different shape', mc: MC.sizeShape, say: 'The shape stays: every angle is the same. Only the size changed.' },
      { t: 'Yes, and it is congruent too', mc: MC.sizeRigid, say: 'Same shape, but not the same size: the lengths changed, so it is not congruent.' },
    ]);
  }
  if (mode === 'general') return choiceItem(R, { ...base, prompt: `The finished table has rows for slides, flips, turns and dilations by 2, 1/2 and 1. Which statement does it back up?`,
    solution: ['Orientation: only the flip rows say "reversed".', 'Congruent: only the slide, flip, turn and scale-factor-1 rows say "yes".'] }, [
    { t: 'Only flips reverse the orientation', ok: true, say: 'Yes: slides, turns and dilations keep A → B → C going the same way round.' },
    { t: 'Turns reverse the orientation too', mc: MC.turnReverses, say: 'A turn keeps the tracing paper face up: the way round stays the same.' },
    { t: 'Every move that keeps the orientation gives a congruent image', mc: MC.orientCong, say: 'A dilation by 2 keeps the orientation but doubles the lengths: not congruent.' },
    { t: 'Dilations reverse the orientation', mc: MC.turnReverses, say: 'A dilation with a positive scale factor keeps the way round; it only changes the size.' },
  ]);
  const combos: [boolean, boolean][] = [[false, true], [true, true], [false, false], [true, false]];
  return choiceItem(R, { ...base, prompt: `Fill in the table row for ${Bm(name)}. What happens to the orientation of ${Am('△ABC')}, and is the image congruent?`,
    solution: [`Orientation: ${rev ? 'a flip turns the tracing over, so A → B → C reverses' : 'A → B → C keeps going the same way round'}.`, `Congruent: ${rigid ? 'every length is kept, so yes' : 'the lengths change, so no'}.`] },
  combos.map(([r, c]) => {
    const t = `${r ? 'Reversed' : 'Kept'} orientation · ${c ? 'congruent' : 'not congruent'}`;
    if (r === rev && c === rigid) return { t, ok: true, say: `Yes: ${rev ? 'reversed' : 'kept'}, and ${rigid ? 'congruent' : 'not congruent'}.` };
    const mc = r && !rev && mm.kind !== 'flip' ? MC.turnReverses : !r && !rev && c && !rigid ? MC.orientCong : undefined;
    return { t, mc, say: r !== rev ? (rev ? 'A flip reverses the way round.' : `${mm.kind === 'dil' ? 'A dilation' : mm.kind === 'turn' ? 'A turn' : 'A slide'} keeps the way round.`) : (rigid ? 'Every length is kept, so the image is congruent.' : 'Keeping the way round is not enough: the lengths changed, so it is not congruent.') };
  }), true);
});

// 17 rule-length-test: one changed length disproves rigidity; unchanged test segments prove nothing
const RULES = ['slide', 'flipY', 'flipX', 'turn', 'stretch', 'stretchY', 'dil2', 'dilHalf'] as const;
const rule: Gen = (R, n) => fitted(() => {
  const kind = pick(R, RULES);
  const m: Move = kind === 'slide' ? slide(pick(R, [3, -2, 2, -3]), pick(R, [-1, 2, -2, 1])) : kind === 'flipY' ? flipY : kind === 'flipX' ? flipX : kind === 'turn' ? turn(R() < 0.5 ? 1 : -1)
    : kind === 'stretch' ? { kind: 'stretch', kx: 2, ky: 1 } : kind === 'stretchY' ? { kind: 'stretch', kx: 1, ky: 2 } : dil(kind === 'dil2' ? 2 : 0.5);
  const x0 = int(R, 1, 2), y0 = int(R, 1, 2), w = kind === 'dilHalf' ? 2 : int(R, 1, 2), hh = kind === 'dilHalf' ? 2 : 1;
  const Q: V[] = rect(w, hh, x0, y0);
  const Bp = mapPts([m], Q);
  if (!inRange(Bp, 7)) return null;
  const r = ruleOf(m)!, rt = ruleTex(r), rw = ruleWordsOf(r);
  const rigid = isRigid(m);
  const lensA = lensOf(Q), lensB = lensOf(Bp);
  const figs = [F1(Q, 'first', undefined, { lens: [lensA[0]!, lensA[1]!, null, null] })];
  if (!(kind === 'slide' || kind.startsWith('flip') || kind === 'turn') || apart(Q, Bp, 1)) figs.push(F1(Bp, 'pick', undefined, { lens: [lensB[0]!, lensB[1]!, null, null] }));
  else return null;
  const picture = pic({ axes: true, figs, solve: { fig: 0, seq: [m], to: 1 } });
  // the side that keeps its length and the one that changes (horizontal = side 0, vertical = side 1)
  const keepI = lensA[0] === lensB[0] ? 0 : 1, changeI = keepI === 0 ? 1 : 0;
  const seg = (i: number) => `the side from ${ptWords(Q[i]!)} to ${ptWords(Q[i + 1]!)}`;
  const base = { id: `rule-${kind}-${n}`, family: 'rule' as const, board: rt, picture, prompt: `Is the rule ${Bm(rw)} a rigid motion? Test it on ${Am('the rectangle')}.` };
  if (rigid) {
    const what = kind === 'slide' ? moveWords(m) : kind === 'turn' ? `a ${moveWords(m).replace('turn ', '')} turn` : moveWords(m).replace('flip', 'a flip');
    const name = kind === 'slide' ? 'a slide' : kind === 'turn' ? 'a 90° turn about the origin' : `a flip over ${kind === 'flipX' ? 'the x-axis' : 'the y-axis'}`;
    return choiceItem(R, { ...base, solution: [`The rule is ${name}${kind === 'slide' ? `: ${what.replace('slide ', '')}` : ''}.`, 'Slides, turns and flips keep every length and angle, so the rule is rigid.', 'Checking a few sides is a good test, but naming the move is the proof.'] }, [
      { t: `Yes: it is ${name}, and that keeps every length`, ok: true, say: `Yes: the rule is ${name}. Those always keep every length.` },
      kind === 'slide'
        ? { t: 'No: every point moves to a new place', mc: MC.anySlide, say: 'Moving is fine. A rigid motion keeps distances, and a slide keeps them all.' }
        : { t: 'No: the coordinates change sign, so the figure changes', mc: MC.signChange, say: 'A sign change just sends points to the other side. Check a length: they all stay the same.' },
      { t: `Yes: ${seg(keepI)} keeps its length, and that proves it`, mc: MC.examples, say: 'The answer is yes, but one side that stays the same proves nothing on its own. The proof: the rule is ' + name + '.' },
    ]);
  }
  const ch = `${seg(changeI)} is ${lensA[changeI]} long before and ${lensB[changeI]} long after`;
  const isDil = m.kind === 'dil';
  return choiceItem(R, { ...base, solution: [`Measure ${seg(changeI)} before and after: ${lensA[changeI]} becomes ${lensB[changeI]}.`, 'One length that changes is enough: the rule is not rigid.', isDil ? 'It is a dilation: every length is multiplied by the same number.' : 'It stretches one way only, so it is not even a dilation.'] }, [
    { t: `No: ${ch}`, ok: true, say: 'Right. One changed length is a counterexample: the rule is not rigid.' },
    isDil
      ? { t: 'Yes: all the angles stay 90°', mc: MC.angles, say: `The angles stay the same, but ${seg(changeI)} changes length. Not rigid.` }
      : { t: `Yes: ${seg(keepI)} stays ${lensA[keepI]} long`, mc: MC.examples, say: `That side happens to stay the same, but ${seg(changeI)} changes. One counterexample is enough.` },
    isDil
      ? { t: `Yes: ${seg(changeI)} keeps its shape`, say: `It keeps its direction, but its length changes from ${lensA[changeI]} to ${lensB[changeI]}.` }
      : { t: 'No: it is a dilation by 2', mc: MC.stretch, say: 'Not rigid, right, but it is no dilation: only one direction is stretched. The reason is the side that changed length.' },
  ]);
});

// 18 justify-congruence-claim: claim + evidence + reason, in real contexts (inches)
const justify: Gen = (R, n) => fitted(() => {
  const mode = pick(R, ['resized', 'enlarged', 'tiles', 'stencil', 'same'] as const);
  const base = { id: `justify-${mode}-${n}`, family: 'justify' as const, board: '' };
  if (mode === 'tiles') {
    const [p, q] = pick(R, [[[4, 2], [3, 3]], [[5, 2], [4, 3]], [[6, 2], [4, 3]], [[5, 3], [4, 4]], [[6, 1], [3, 2]]] as [V, V][]);
    const thing = pick(R, ['floor tiles', 'quilt pieces']);
    const P = rect(p[0], p[1]), Q = rect(q[0], q[1], p[0] + 2, 0);
    const odd = [p[0], p[1]].find(x => x !== q[0] && x !== q[1])!;
    const picture = pic({ axes: false, figs: [F1(P, 'first', undefined, { tag: 'P', lens: [String(p[0]), String(p[1]), null, null] }), F1(Q, 'pick', undefined, { tag: 'Q', lens: [String(q[0]), String(q[1]), null, null] })] });
    return choiceItem(R, { ...base, picture, prompt: `Two ${thing}: ${Am(`P is ${p[0]} by ${p[1]} inches`)}, ${Pm(`Q is ${q[0]} by ${q[1]} inches`)}. Which is the best justification?`,
      solution: ['Claim: P and Q are not congruent.', `Evidence: P has a ${odd}-inch side; Q has none.`, 'Reason: slides, turns and flips never change a length, so no sequence can put P on Q.'] }, [
      { t: `Not congruent: P has a ${odd}-inch side and Q has none, and moves never change a length`, ok: true, say: 'Yes: a claim, the evidence and the reason.' },
      { t: 'Not congruent: no sequence of moves fits', mc: MC.noReason, say: 'True, but why can no sequence fit? Name the side length that has no partner.' },
      { t: 'Not congruent: I turned P a quarter turn and it didn’t fit', mc: MC.failedSearch, say: 'One failed try doesn’t prove no try works. The side lengths do.' },
      { t: 'Congruent: they look about the same size', mc: MC.looks, say: `Measure, don’t guess: ${p[0]} by ${p[1]} is not ${q[0]} by ${q[1]}.` },
    ]);
  }
  const P = placed(R, shapeOf(R, R() < 0.4), 5);
  if (mode === 'stencil') {
    const seq: Move[] = [pick(R, [flipY, flipX]), slide(int(R, -2, 2), int(R, -2, 2))];
    const Q = mapPts(seq, P);
    if (!inRange(Q) || !apart(P, Q)) return null;
    const picture = pic({ axes: true, figs: [F1(P, 'first', undefined, { tag: 'S' }), F1(Q, 'pick', undefined, { tag: 'O' })], solve: { fig: 0, seq, to: 1 } });
    return choiceItem(R, { ...base, picture, prompt: `A stencil ${Am('S')} must fit an outline ${Pm('O')} exactly. Is the stencil congruent to the outline? Which justification is best?`,
      solution: ['Claim: congruent.', `Evidence: ${seqWords(seq)} puts the stencil on the outline, corner on corner.`, 'Reason: slides and flips are rigid motions.'] }, [
      { t: `Congruent: ${seqWords(seq)} puts every corner on the outline`, ok: true, say: 'Yes: the moves are the evidence, and they are rigid.' },
      { t: 'Not congruent: the outline faces the other way', mc: MC.flipNot, say: 'Flip the stencil over: then it faces the same way and fits exactly. Mirror images are congruent.' },
      { t: 'Congruent: they look the same', mc: MC.looks, say: 'Looking alike is not evidence. Give the moves that put it on the outline.' },
      { t: 'Not congruent: a quarter turn didn’t fit', mc: MC.failedSearch, say: 'One move that fails proves nothing. A flip and a slide do fit.' },
    ]);
  }
  const k = mode === 'resized' ? 0.5 : mode === 'enlarged' ? 2 : 1;
  const rm: Move = mode === 'enlarged' ? pick(R, [flipY, flipX]) : turn(pick(R, [1, -1, 2]));
  const c0 = P[0]!;
  const seq: Move[] = [dil(k, c0), rm];
  const Q = mapPts(seq, P);
  if (!inRange(Q) || !apart(P, Q) || (k === 0.5 && Q.some(p => !Number.isInteger(p[0]) || !Number.isInteger(p[1])))) return null;
  const thing = pick(R, ['logo', 'quilt square', 'sticker']);
  const kw = k === 0.5 ? '1/2' : String(k);
  const did = `${k === 1 ? `dilated by a scale factor of 1` : k === 2 ? 'enlarged by a scale factor of 2' : 'shrunk by a scale factor of 1/2'}, then ${moveWords(rm).replace('turn', 'turned').replace('flip', 'flipped')}`;
  const picture = pic({ axes: true, figs: [F1(P, 'first', undefined, { tag: 'A' }), ...(k === 1 ? [] : [F1(Q, 'pick', undefined, { tag: 'B' })])], solve: { fig: 0, seq, to: k === 1 ? undefined : 1 } });
  if (k === 1) return choiceItem(R, { ...base, picture, prompt: `A ${thing} A is ${Bm(did)}. Is the new ${thing} congruent to the old one?`,
    solution: ['Claim: congruent.', 'Evidence: a dilation by 1 changes no length; the turn changes no length either.', 'Reason: a sequence of rigid motions (the identity, then a turn) maps one onto the other.'] }, [
    { t: 'Congruent: a dilation by 1 changes nothing, and a turn keeps every length', ok: true, say: 'Yes: scale factor 1 is the identity, a rigid motion.' },
    { t: 'Not congruent: a dilation always changes the size', mc: MC.disjoint, say: 'Scale factor 1 multiplies every length by 1: no change. That dilation is rigid.' },
    { t: 'Not congruent: it is turned', mc: MC.flipNot, say: 'A turned copy is congruent: a turn is a rigid motion.' },
  ]);
  return choiceItem(R, { ...base, picture, board: moveTex(seq[0]!), prompt: `A ${thing} A is ${Bm(did)}. Is the new ${thing} B congruent to A?`,
    solution: ['Claim: not congruent.', `Evidence: the dilation multiplied every length by ${kw}.`, `Reason: a ${rm.kind === 'flip' ? 'flip' : 'turn'} keeps lengths as they are, so it cannot undo the size change.`] }, [
    { t: `Not congruent: every length was multiplied by ${kw}, and a ${rm.kind === 'flip' ? 'flip' : 'turn'} can’t change it back`, ok: true, say: 'Yes: claim, evidence and reason.' },
    { t: `Congruent: the ${rm.kind === 'flip' ? 'flip' : 'turn'} puts it back`, mc: MC.undoResize, say: `A ${rm.kind === 'flip' ? 'flip' : 'turn'} keeps every length: the size change stays.` },
    { t: 'Not congruent: no sequence of moves fits', mc: MC.noReason, say: `True, but say why: the lengths were multiplied by ${kw}, and moves keep lengths.` },
    { t: `Not congruent: it is ${rm.kind === 'flip' ? 'flipped' : 'turned'}`, mc: MC.flipNot, say: `${rm.kind === 'flip' ? 'Flipping' : 'Turning'} is allowed. The problem is the size: the lengths changed.` },
  ]);
});

export const GENS: Record<FamilyId, Gen> = {
  cover, partner, invariant, orient: orientG, whichMove, specify, sequence, order, verify, plan, finish, twoWays, undo, dilate, identity, table, rule, justify,
};
