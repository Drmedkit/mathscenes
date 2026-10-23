// items.ts: practice families for "Angle relationships" (grade 7, 7.G.B.5). Each family is one deep structure; a
// generator receives the sub-goal id and uses that sub-goal's cases (topic JSON `cases`). Every wrong option or typed
// answer the classifier recognises carries its catalogue misconception (math-curriculum-essentials/misconceptions.json).
// Pure: no DOM, no canvas. Pictures are plain data (angleMaths.ts) the page draws; every one must lay out (picFits).
// PROBES records, per item, typical wrong responses and the misconception they must get (tests).
import { type Gen, type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import { type AMark, type Fan, type Pic, crossing, fanFrom, exprText, norm, picFits } from './angleMaths';
import { endOnChoice } from '../../runtime/explain';

export type FamilyId = 'rays' | 'names' | 'evidence' | 'adjacent' | 'addParts' | 'armLength' | 'pairName' | 'linearPair'
  | 'vertical' | 'equalPick' | 'allNames' | 'findPair' | 'findVertical' | 'missingPart' | 'lineParts' | 'aroundPoint'
  | 'mixed' | 'chain' | 'reason' | 'critique' | 'argument' | 'expr' | 'exprCombined' | 'context';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  rays: 'Rays and opposite rays',
  names: 'Read the angle name',
  evidence: 'What the figure says',
  adjacent: 'Adjacent or not?',
  addParts: 'Parts of an angle',
  armLength: 'Long sides, short sides',
  pairName: 'Complementary or supplementary?',
  linearPair: 'Linear pair?',
  vertical: 'Find the vertical angle',
  equalPick: 'Vertical angles are equal',
  allNames: 'Every name that fits',
  findPair: 'Find the partner angle',
  findVertical: 'Across or next door?',
  missingPart: 'The missing part',
  lineParts: 'Several angles on a line',
  aroundPoint: 'All the way around',
  mixed: 'Which relationship?',
  chain: 'Two steps to the target',
  reason: 'Give the reason',
  critique: 'Check the step',
  argument: 'Always, not just here',
  expr: 'An angle with x in it',
  exprCombined: 'x in two angles',
  context: 'Angles in the real world',
};

export interface AngleItem extends Item {
  family: FamilyId;
  picture: Pic & Record<string, unknown>;
  /** TeX lines on the board from the start (the givens) */
  givens: string[];
  /** TeX lines written on the board after a miss (the worked solution) */
  work: string[];
  /** paint streets under the lines (context items) */
  road?: boolean;
}
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();

export const MC = {
  anyTwo: 'mc.angles.any-two-rays-opposite',
  rayOrder: 'mc.angles.ray-name-order-ignored',
  vertexFirst: 'mc.angles.misreads-three-letter-angle-names',
  lastLetter: 'mc.angles.ignores-last-letter-in-angle-name',
  measureDrawing: 'mc.angles.measures-not-to-scale-drawing-as-exact',
  rejectsGiven: 'mc.angles.rejects-drawn-labeled-info',
  looks: 'mc.angles.trusts-diagram-appearance',
  whole90or180: 'mc.angles.assumes-whole-is-90-or-180',
  adjacentTouch: 'mc.angles.misidentifies-adjacent-angles',
  overlapAdd: 'mc.angles.adds-overlapping-angles',
  armLength: 'mc.angles.angle-size-from-arm-length',
  swapped: 'mc.angles.complementary-supplementary-swapped',
  mustTouch: 'mc.angles.pair-must-be-adjacent',
  each90: 'mc.angles.each-complementary-angle-90',
  needsObtuse: 'mc.angles.supplementary-needs-obtuse',
  nonadjVertical: 'mc.angles.any-nonadjacent-pair-is-vertical',
  upDown: 'mc.angles.misidentifies-vertical-angles',
  equalMeansVertical: 'mc.angles.equal-measures-imply-pair-relation',
  equalAsSupp: 'mc.angles.congruent-pair-treated-as-supplementary',
  oneName: 'mc.shapes.figure-gets-only-one-name',
  reportsWhole: 'mc.angles.reports-whole-as-missing-part',
  adjSpecial: 'mc.angles.adjacency-implies-special-total',
  omitsKnown: 'mc.angles.omits-known-parts-from-angle-total',
  straightFull: 'mc.angles.swaps-straight-and-full-turn-totals',
  lastRule: 'mc.angles.last-practiced-rule',
  original: 'mc.transformations.applies-sequence-steps-to-original',
  unknowable: 'mc.angles.unlabeled-unknowable',
  wrongAngle: 'mc.angles.wrong-angle-in-figure',
  noHypotheses: 'mc.geometric-proof.cites-theorem-without-checking-hypotheses',
  noReason: 'mc.geometric-proof.step-without-reason',
  drawnCase: 'mc.geometric-proof.proof-covers-only-drawn-case',
  examples: 'mc.reasoning-language.examples-as-proof',
  suppEqual: 'mc.angles.supplementary-pair-set-equal',
  reportsX: 'mc.linear-equations.reports-x-not-asked-quantity',
  collapsed: 'mc.expressions.repeated-addends-collapsed-or-multiplied',
  minusLost: 'mc.integers.minus-sign-detached-from-term',
} as const;

// ---------- shared helpers ----------
interface Opt { t: string; ok?: boolean; say: string; mc?: string }
type Base = Omit<AngleItem, 'input' | 'choices' | 'answer' | 'check'>;
function choiceItem(R: () => number, base: Base, opts: Opt[], keep = false): AngleItem {
  const seen = new Set<string>();
  const uniq = opts.filter(o => (seen.has(o.t) ? false : (seen.add(o.t), true)));
  const o = keep ? uniq : shuffle(R, uniq.slice());
  const right = o.findIndex(x => x.ok);
  if (right < 0 || o.filter(x => x.ok).length !== 1) throw new Error(`${base.id}: needs exactly one right option`);
  const says = o.map(x => ({ say: x.say, mc: x.mc }));
  const it: AngleItem = {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: right }, solution: endOnChoice(base.solution, o[right]!.t),
    check: (r: Response): Verdict => {
      if (r.kind !== 'choice' || !says[r.i]) return { ok: false, say: 'Pick one answer.' };
      return { ok: r.i === right, mc: r.i === right ? undefined : says[r.i]!.mc, say: says[r.i]!.say };
    },
  };
  PROBES.set(it, o.flatMap((x, i) => (x.mc && !x.ok ? [{ r: { kind: 'choice', i } as Response, mc: x.mc }] : [])));
  return it;
}
interface Wrong { v: number; mc?: string; say: string }
/** a typed whole number of degrees; known wrong answers get their misconception */
function numItem(base: Base, ans: number, okSay: string, wrongs: Wrong[], other: string, unit = '°'): AngleItem {
  const ws: Wrong[] = [];
  for (const w of wrongs) if (Number.isInteger(w.v) && w.v !== ans && !ws.some(x => x.v === w.v)) ws.push(w);
  const it: AngleItem = {
    ...base, input: 'num', unit, answer: { kind: 'num', v: ans },
    check: (r: Response): Verdict => {
      if (r.kind !== 'num' || Number.isNaN(r.v)) return { ok: false, say: 'Type a number.' };
      if (r.v === ans) return { ok: true, say: okSay };
      const w = ws.find(x => x.v === r.v);
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: other };
    },
  };
  PROBES.set(it, ws.filter(w => w.mc).map(w => ({ r: { kind: 'num', v: w.v } as Response, mc: w.mc! })));
  return it;
}
/** retry a generator until its picture lays out readably */
function fitted(make: () => AngleItem | null, tries = 80): AngleItem {
  let last = '';
  for (let i = 0; i < tries; i++) {
    const it = make();
    if (!it) continue;
    const why = picFits(it.picture);
    if (why === null) return it;
    last = why;
  }
  throw new Error(`angle-relationships: no drawable item after many tries (${last})`);
}
const POINTS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'W', 'X', 'Y', 'Z'];
const VERTS = ['O', 'O', 'O', 'P', 'K', 'M', 'V'];
/** a vertex letter and n point letters (in alphabetical runs, like a textbook: A B C D or P Q R S) */
function letters(R: () => number, n: number): { O: string; L: string[] } {
  const O = pick(R, VERTS);
  const pool = POINTS.filter(p => p !== O);
  const runs: string[][] = [];
  for (let i = 0; i + n <= pool.length; i++) runs.push(pool.slice(i, i + n));
  const L = R() < 0.7 ? pick(R, runs.slice(0, Math.min(runs.length, 6))) : shuffle(R, pool.slice()).slice(0, n).sort();
  return { O, L: L.slice() };
}
const WHO = ['Maya', 'Leo', 'Ana', 'Sam', 'Kai', 'Ravi', 'Jo', 'Eli', 'Noor', 'Theo', 'Zoe', 'Omar'];
const ang = (a: string, O: string, b: string) => `∠${a}${O}${b}`;
const tAng = (a: string, O: string, b: string) => `\\angle ${a}${O}${b}`;
const m = (a: string, O: string, b: string) => `m∠${a}${O}${b}`;
const tm = (a: string, O: string, b: string) => `m\\angle ${a}${O}${b}`;
const dg = (n: number | string) => `${n}°`;
const td = (n: number | string) => `${n}^\\circ`;
const pic = (fans: Fan[], o: Partial<Pic> = {}): Pic & Record<string, unknown> => ({ fans, ...o }) as Pic & Record<string, unknown>;
const mk = (id: string, a: string, b: string, o: Partial<AMark> = {}): AMark => ({ id, a, b, ...o });
const rot = (R: () => number) => int(R, 0, 71) * 5;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ================= 1 rays-opposite-rays =================
const rays: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['pair', 'pair', 'name', 'count', 'bent'] as const);
  const { O, L } = letters(R, 4);
  const [a, b, c, d] = L as [string, string, string, string];
  const s = rot(R);
  if (v === 'pair') {
    const two = R() < 0.5;
    const theta = int(R, 7, 29) * 5;
    let f: Fan;
    if (two) f = { ...crossing([a, b, c, d], s, theta, O) };
    else { f = fanFrom([a, b, c], s, [theta, 180 - theta], { O, lines: [[a, c]] }); }
    const prompt = two ? `Lines ${a}${c} and ${b}${d} cross at ${O}. Which two rays are opposite rays?` : `Line ${a}${c} is drawn through ${O}, and ray ${O}${b} starts at ${O}. Which two rays are opposite rays?`;
    const opts: Opt[] = [
      { t: `ray ${O}${a} and ray ${O}${c}`, ok: true, say: `Yes: ${O}${a} and ${O}${c} start at ${O} and together make line ${a}${c}.` },
      { t: `ray ${O}${a} and ray ${O}${b}`, mc: MC.anyTwo, say: `${O}${a} and ${O}${b} start at the same point but make an angle. Opposite rays together make one straight line.` },
      { t: `ray ${a}${O} and ray ${O}${c}`, mc: MC.rayOrder, say: `Ray ${a}${O} starts at ${a}, not at ${O}. The first letter of a ray is where it starts.` },
      { t: `ray ${O}${b} and ray ${O}${c}`, mc: MC.anyTwo, say: `${O}${b} and ${O}${c} make an angle, not one line.` },
    ];
    return choiceItem(R, { id: `rays-pair-${n}`, family: 'rays', prompt, board: '', givens: [two ? `\\text{lines } ${a}${c},\\ ${b}${d}` : `\\text{line } ${a}${c}`], work: [], picture: pic([f]),
      solution: ['Opposite rays start at the same point and point in exactly opposite directions.', `Together ${O}${a} and ${O}${c} make line ${a}${c}, which is drawn.`] }, opts);
  }
  if (v === 'name') {
    // one ray: it starts at its vertex and passes through the other point
    const f: Fan = { O: a, rays: [{ p: b, deg: s }], lines: [], marks: [] };
    const opts: Opt[] = [
      { t: `ray ${a}${b}`, ok: true, say: `Yes: the ray starts at ${a} and goes through ${b}, so it is ray ${a}${b}.` },
      { t: `ray ${b}${a}`, mc: MC.rayOrder, say: `Ray ${b}${a} would start at ${b}. A ray is named from its starting point.` },
      { t: `line ${a}${b}`, say: `A line goes on both ways. This one stops at ${a}.` },
    ];
    return choiceItem(R, { id: `rays-name-${n}`, family: 'rays', prompt: `The arrow starts at ${a} and passes through ${b}. What is its name?`, board: '', givens: [], work: [], picture: pic([f]),
      solution: [`A ray starts at its first letter and passes through its second.`, `This one starts at ${a}: ray ${a}${b}. Ray ${b}${a} is a different ray.`] }, opts);
  }
  if (v === 'count') {
    const f = crossing([a, b, c, d], s, int(R, 8, 28) * 5, O);
    const opts: Opt[] = [
      { t: '2', ok: true, say: `Yes: ${O}${a} with ${O}${c} (line ${a}${c}) and ${O}${b} with ${O}${d} (line ${b}${d}).` },
      { t: '4', mc: MC.anyTwo, say: 'Neighbouring rays make angles, not lines. Only the two rays of one line are opposite.' },
      { t: '6', mc: MC.anyTwo, say: 'Not every pair: only the two rays that make one line together are opposite.' },
      { t: '1', say: `Each line gives a pair: ${O}${a} and ${O}${c}, and ${O}${b} and ${O}${d}.` },
    ];
    return choiceItem(R, { id: `rays-count-${n}`, family: 'rays', prompt: `Lines ${a}${c} and ${b}${d} cross at ${O}. How many pairs of opposite rays are there?`, board: '', givens: [`\\text{lines } ${a}${c},\\ ${b}${d}`], work: [], picture: pic([f]),
      solution: ['A pair of opposite rays makes one line.', 'Two lines, so two pairs.'] }, opts, true);
  }
  const theta = int(R, 22, 32) * 5;
  const f = fanFrom([a, b], s, [theta], { O });
  const opts: Opt[] = [
    { t: 'No: together they make a bent angle, not one line', ok: true, say: `Right: ${O}${a} and ${O}${b} make an angle. Opposite rays make one straight line.` },
    { t: `Yes: they both start at ${O}`, mc: MC.anyTwo, say: 'Starting at the same point is not enough: opposite rays must make one line together.' },
    { t: 'No: opposite rays must point left and right', say: 'Opposite rays can point any way. What matters is that together they make one line.' },
  ];
  return choiceItem(R, { id: `rays-bent-${n}`, family: 'rays', prompt: `Rays ${O}${a} and ${O}${b} start at ${O}. Are they opposite rays?`, board: '', givens: [], work: [], picture: pic([f]),
    solution: ['Opposite rays: same starting point, one straight line together.', `${O}${a} and ${O}${b} bend at ${O}, so they are not opposite.`] }, opts);
});

// ================= 2 read-angle-names =================
const names: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['marked', 'marked', 'sides', 'crossing'] as const);
  const { O, L } = letters(R, 4);
  const [a, b, c, d] = L as [string, string, string, string];
  const s = rot(R);
  if (v === 'marked') {
    const sp = [int(R, 8, 16) * 5, int(R, 8, 16) * 5, int(R, 8, 16) * 5];
    const f = fanFrom([a, b, c, d], s, sp, { O, marks: [mk('t', b, c, { col: 'pick' })] });
    const right = R() < 0.5 ? ang(b, O, c) : ang(c, O, b);
    const opts: Opt[] = [
      { t: right, ok: true, say: `Yes: the vertex ${O} is in the middle, and the sides are ${O}${b} and ${O}${c}.` },
      { t: ang(O, b, c), mc: MC.vertexFirst, say: `The vertex goes in the MIDDLE of the name. ${ang(O, b, c)} would have its corner at ${b}.` },
      { t: ang(b, O, d), mc: MC.lastLetter, say: `${ang(b, O, d)} has the side ${O}${d}, not ${O}${c}. Every letter counts.` },
      { t: `∠${O}`, say: `Several angles have their corner at ${O}, so ∠${O} does not say which one.` },
    ];
    return choiceItem(R, { id: `names-marked-${n}`, family: 'names', prompt: `Which name fits the ${S('marked')} angle?`.replace('class="s"', 'class="p"'), board: '', givens: [], work: [], picture: { ...pic([f]), solve: { focus: ['t'] } },
      solution: ['The middle letter is the vertex; the other two letters are points on the two sides.', `The marked angle: vertex ${O}, sides ${O}${b} and ${O}${c}: ${ang(b, O, c)} (or ${ang(c, O, b)}).`] }, opts);
  }
  if (v === 'sides') {
    const sp = [int(R, 8, 18) * 5, int(R, 8, 18) * 5];
    const f = fanFrom([a, c, d], s, sp, { O: b });
    const opts: Opt[] = [
      { t: `${b}${a} and ${b}${c}`, ok: true, say: `Yes: ${b} is the middle letter, so it is the vertex; the sides go to ${a} and ${c}.` },
      { t: `${a}${b} and ${a}${c}`, mc: MC.vertexFirst, say: `The first letter is not the vertex: in ${ang(a, b, c)} the middle letter ${b} is.` },
      { t: `${b}${a} and ${b}${d}`, mc: MC.lastLetter, say: `The last letter is ${c}, so the second side goes to ${c}, not ${d}.` },
    ];
    return choiceItem(R, { id: `names-sides-${n}`, family: 'names', prompt: `Which two rays are the sides of ${ang(a, b, c)}?`, board: tAng(a, b, c), givens: [tAng(a, b, c)], work: [], picture: pic([f]),
      solution: [`In ${ang(a, b, c)} the middle letter ${b} is the vertex.`, `The sides are the rays ${b}${a} and ${b}${c}.`] }, opts);
  }
  const theta = int(R, 9, 27) * 5;
  const f = crossing([a, b, c, d], s, theta, O);
  const order = shuffle(R, [1, 2, 3, 4]);
  const [n1, n2, n3, n4] = order as [number, number, number, number];
  f.marks = [mk('m1', a, b, { text: String(n1) }), mk('m2', b, c, { text: String(n2) }), mk('m3', c, d, { text: String(n3) }), mk('m4', d, a, { text: String(n4) })];
  const opts: Opt[] = [
    { t: `angle ${n2}`, ok: true, say: `Yes: angle ${n2} has its corner at ${O} and sides ${O}${b} and ${O}${c}.` },
    { t: `angle ${n1}`, mc: MC.lastLetter, say: `Angle ${n1} is ${ang(b, O, a)}: it has side ${O}${b}, but its other side goes to ${a}, not ${c}.` },
    { t: `angle ${n3}`, say: `Angle ${n3} is ${ang(c, O, d)}. Find the angle between ${O}${b} and ${O}${c}.` },
    { t: `angle ${n4}`, say: `Angle ${n4} is ${ang(d, O, a)}. Find the angle between ${O}${b} and ${O}${c}.` },
  ].sort((x, y) => Number(x.t.slice(6)) - Number(y.t.slice(6)));
  return choiceItem(R, { id: `names-cross-${n}`, family: 'names', prompt: `Lines ${a}${c} and ${b}${d} cross at ${O}. Which numbered angle is ${ang(b, O, c)}?`, board: tAng(b, O, c), givens: [tAng(b, O, c)], work: [], picture: { ...pic([f]), solve: { focus: ['m2'] } },
    solution: [`${ang(b, O, c)}: the vertex is ${O}, the sides go to ${b} and ${c}.`, `That is angle ${n2}.`] }, opts, true);
});

// ================= 3 diagram-conventions =================
const evidence: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['nobox', 'box', 'nts', 'line', 'rays'] as const);
  const { O, L } = letters(R, 3);
  const [a, b, c] = L as [string, string, string];
  const s = rot(R);
  if (v === 'nobox' || v === 'box') {
    const f = fanFrom([a, b], s, [90], { O, marks: v === 'box' ? [mk('t', a, b, { box: true, col: 'first' })] : [] });
    const opts: Opt[] = v === 'nobox' ? [
      { t: 'Nothing marks it as 90°: there is no box and no number', ok: true, say: 'Right: a right angle needs a box, a number or words. Looking square is not evidence.' },
      { t: 'It is 90°: it looks square', mc: MC.looks, say: 'Looks are not evidence. With no box, no number and no words, it could be 88° or 93°.' },
      { t: 'It is 90°: measure the drawing with a protractor', mc: MC.measureDrawing, say: 'A drawing can be off. Only marks, numbers and words count.' },
    ] : [
      { t: '90°: the box marks a right angle', ok: true, say: 'Yes: the little box is how a figure says “right angle”.' },
      { t: 'You can’t tell: no number is written there', mc: MC.rejectsGiven, say: 'The box IS the information: it says the angle is exactly 90°.' },
      { t: 'About what the protractor shows on the drawing', mc: MC.measureDrawing, say: 'The marks decide, not a measurement of the drawing. The box says 90°.' },
    ];
    return choiceItem(R, { id: `evidence-${v}-${n}`, family: 'evidence', prompt: v === 'nobox' ? `${WHO[n % WHO.length]} says ${ang(a, O, b)} is a right angle. What does the figure tell you?` : `What is ${m(a, O, b)}?`, board: '', givens: [], work: v === 'box' ? [`${tm(a, O, b)} = ${td(90)}`] : [], picture: pic([f]),
      solution: v === 'nobox' ? ['Only marks (a box, arcs), numbers, labels and words count as evidence.', 'This angle has none of them, so its size is not known.'] : ['The right-angle box is a mark: it says 90°.', `${m(a, O, b)} = 90°.`] }, opts);
  }
  if (v === 'nts') {
    const t = int(R, 7, 14) * 5, drawn = t + pick(R, [-1, 1]) * int(R, 6, 9) * 5;
    if (drawn < 15 || drawn > 165) return null;   // a "−10°" drawing would be a 350° arc under a 35° label
    const f = fanFrom([a, b], s, [drawn], { O, marks: [mk('t', a, b, { text: dg(t), col: 'second' })] });
    const opts: Opt[] = [
      { t: dg(t), ok: true, say: `Yes: the label says ${t}°. The drawing is not to scale, so it only shows the shape of the idea.` },
      { t: `${dg(drawn)}, what a protractor shows on the drawing`, mc: MC.measureDrawing, say: `The caption says “not drawn to scale”: measuring the drawing gives the wrong answer. Use the label.` },
      { t: 'You can’t tell: the drawing does not match', mc: MC.rejectsGiven, say: 'The label is the given. The drawing is only a sketch.' },
    ];
    return choiceItem(R, { id: `evidence-nts-${n}`, family: 'evidence', prompt: `The figure is not drawn to scale. What is ${m(a, O, b)}?`, board: '', givens: [`${tm(a, O, b)} = ${td(t)}`], work: [], picture: pic([f], { nts: true }),
      solution: ['A label is a given. “Not drawn to scale” means: do not measure.', `${m(a, O, b)} = ${t}°.`] }, opts);
  }
  const theta = int(R, 8, 26) * 5;
  if (v === 'line') {
    const f = fanFrom([a, b, c], s, [theta, 180 - theta], { O, lines: [[a, c]] });
    const opts: Opt[] = [
      { t: `Yes: line ${a}${c} is drawn through ${O}`, ok: true, say: `Yes: a drawn and labeled line counts. ${O}${a} and ${O}${c} are its two halves.` },
      { t: 'Only if the text says the angle is 180°', mc: MC.rejectsGiven, say: 'A drawn, labeled line is evidence on its own.' },
      { t: 'Only if a protractor shows 180° on the drawing', mc: MC.measureDrawing, say: 'You never need to measure: the line is drawn and named.' },
    ];
    return choiceItem(R, { id: `evidence-line-${n}`, family: 'evidence', prompt: `Line ${a}${c} is drawn through ${O}. Are ${O}${a} and ${O}${c} opposite rays?`, board: '', givens: [`\\text{line } ${a}${c}`], work: [], picture: pic([f]),
      solution: [`Line ${a}${c} is drawn and named, so A, O, C are on one line.`, `${O}${a} and ${O}${c} are opposite rays.`] }, opts);
  }
  const bend = pick(R, [-4, -3, 3, 4]);
  const f: Fan = { O, rays: [{ p: a, deg: norm(s) }, { p: b, deg: norm(s + theta) }, { p: c, deg: norm(s + 180 + bend) }], lines: [], marks: [] };
  const opts: Opt[] = [
    { t: 'You can’t tell: no line is drawn or stated, they only look aligned', ok: true, say: 'Right: two separate rays can look straight and be a few degrees off.' },
    { t: 'Yes: they look like one straight line', mc: MC.looks, say: `Looking straight is not evidence. Nothing says ${a}, ${O} and ${c} are on one line.` },
    { t: 'Yes: a protractor on the drawing shows about 180°', mc: MC.measureDrawing, say: 'A drawing is not evidence: only drawn lines, marks, labels and words are.' },
  ];
  return choiceItem(R, { id: `evidence-rays-${n}`, family: 'evidence', prompt: `Three separate rays start at ${O}. Do ${O}${a} and ${O}${c} make one line?`, board: '', givens: [], work: [], picture: pic([f]),
    solution: ['A line counts when it is drawn as a line, labeled, or stated in words.', `Here ${O}${a} and ${O}${c} are separate rays, so you can’t be sure.`] }, opts);
});

// ================= 4 identify-adjacent =================
const adjacent: Gen = (R, n) => fitted(() => {
  const { O, L } = letters(R, 4);
  const [a, b, c, d] = L as [string, string, string, string];
  const s = rot(R);
  if (R() < 0.6) {
    const sp = [int(R, 8, 15) * 5, int(R, 8, 15) * 5, int(R, 8, 15) * 5];
    const f = fanFrom([a, b, c, d], s, sp, { O });
    const opts: Opt[] = [
      { t: `${ang(a, O, b)} and ${ang(b, O, c)}`, ok: true, say: `Yes: same vertex ${O}, a shared side ${O}${b}, and they do not overlap.` },
      { t: `${ang(a, O, b)} and ${ang(a, O, c)}`, mc: MC.adjacentTouch, say: `${ang(a, O, b)} sits INSIDE ${ang(a, O, c)}: they overlap, so they are not adjacent.` },
      { t: `${ang(a, O, b)} and ${ang(c, O, d)}`, mc: MC.adjacentTouch, say: 'They only share the vertex. Adjacent angles also share a side.' },
    ];
    return choiceItem(R, { id: `adjacent-pick-${n}`, family: 'adjacent', prompt: 'Which two angles are adjacent?', board: '', givens: [], work: [], picture: pic([f]),
      solution: ['Adjacent: same vertex, a shared side, no overlap.', `${ang(a, O, b)} and ${ang(b, O, c)} share side ${O}${b} and sit side by side.`] }, opts);
  }
  let p = int(R, 6, 15) * 5, q = int(R, 6, 15) * 5;
  while (p + q === 90 || p + q === 180) q += 5;
  const f = fanFrom([a, b, c], s, [p, q], { O, marks: [mk('p', a, b, { text: dg(p), col: 'second' }), mk('q', b, c, { text: dg(q), col: 'second' })] });
  const opts: Opt[] = [
    { t: `${p} + ${q} = ${p + q}°: adjacent says nothing about the total`, ok: true, say: 'Yes: adjacent tells you where two angles are, not how big they are together.' },
    { t: 'They must add to 180°', mc: MC.whole90or180, say: `Only a linear pair (outer sides make a line) adds to 180°. Here ${p} + ${q} = ${p + q}.` },
    { t: 'They must add to 90°', mc: MC.whole90or180, say: `Only when they fill a marked right angle. Here ${p} + ${q} = ${p + q}.` },
  ];
  return choiceItem(R, { id: `adjacent-total-${n}`, family: 'adjacent', prompt: `${ang(a, O, b)} and ${ang(b, O, c)} are adjacent. What can you say about their total?`, board: '', givens: [`${tm(a, O, b)} = ${td(p)}`, `${tm(b, O, c)} = ${td(q)}`], work: [`${p} + ${q} = ${p + q}`], picture: pic([f]),
    solution: ['Adjacent is about position: shared vertex, shared side, no overlap.', `The total is just the sum: ${p} + ${q} = ${p + q}°.`] }, opts);
});

// ================= 5 angle-additivity =================
const addParts: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['sum', 'three', 'overlap', 'right'] as const);
  const { O, L } = letters(R, 4);
  const [a, b, c, d] = L as [string, string, string, string];
  const s = rot(R);
  if (v === 'sum' || v === 'three') {
    const k = v === 'three' ? 3 : 2;
    const parts = Array.from({ length: k }, () => int(R, 6, 13) * 5 + pick(R, [0, 0, 1, 2, 3, 4]));
    const W = parts.reduce((x, y) => x + y, 0);
    if (W >= 175 || W === 90) return null;
    const lets = [a, b, c, d].slice(0, k + 1);
    const marks = parts.map((p, i) => mk(`p${i}`, lets[i]!, lets[i + 1]!, { text: dg(p), col: 'second' }));
    marks.push(mk('w', lets[0]!, lets[k]!, { text: '?', alt: dg(W), col: 'link', lvl: 1 }));
    const f = fanFrom(lets, s, parts, { O, marks });
    const last = lets[k]!;
    return numItem({ id: `addParts-${v}-${n}`, family: 'addParts', prompt: `Ray${k === 3 ? 's' : ''} ${lets.slice(1, k).map(x => O + x).join(' and ')} split${k === 3 ? '' : 's'} ${ang(a, O, last)} into ${k} parts. Find ${S(m(a, O, last))}.`, board: '', givens: parts.map((p, i) => `${tm(lets[i]!, O, lets[i + 1]!)} = ${td(p)}`), work: [`${parts.join(' + ')} = ${W}`], picture: { ...pic([f]), solve: { reveal: ['w'], focus: ['w'] } },
      solution: ['The parts do not overlap and fill the whole angle, so their measures add.', `${parts.join(' + ')} = ${W}°.`] }, W, `Yes: ${parts.join(' + ')} = ${W}°.`,
    [{ v: 180 - W, mc: MC.whole90or180, say: `Nothing makes ${ang(a, O, last)} a straight angle. Just add the parts.` }], 'Add the parts: they fill the whole angle with no overlap.');
  }
  if (v === 'overlap') {
    const p = int(R, 6, 12) * 5, q = int(R, 6, 12) * 5, W = p + q;
    if (W === 90) return null;   // an unmarked 90° whole would look like a hidden right angle
    const f = fanFrom([a, b, c], s, [p, q], { O, marks: [mk('w', a, c, { text: dg(W), col: 'first', lvl: 1 }), mk('p', a, b, { text: dg(p), col: 'second' }), mk('x', b, c, { text: '?', alt: dg(q), col: 'link' })] });
    return numItem({ id: `addParts-overlap-${n}`, family: 'addParts', prompt: `${A(m(a, O, c) + ' = ' + dg(W))} and ${B(m(a, O, b) + ' = ' + dg(p))}. Find ${S(m(b, O, c))}.`, board: '', givens: [`${tm(a, O, c)} = ${td(W)}`, `${tm(a, O, b)} = ${td(p)}`], work: [`${p} + x = ${W}`, `x = ${q}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x'] } },
      solution: [`${ang(a, O, b)} is INSIDE ${ang(a, O, c)}: it is a part, not a neighbour.`, `${ang(a, O, b)} + ${ang(b, O, c)} = ${ang(a, O, c)}, so ${p} + x = ${W} and x = ${q}°.`] }, q, `Yes: ${W} − ${p} = ${q}°.`,
    [{ v: W + p, mc: MC.overlapAdd, say: `${ang(a, O, b)} is part of ${ang(a, O, c)}; adding counts it twice. Take it away instead.` }], 'The whole is the two parts together: whole − part = the other part.');
  }
  const p = int(R, 5, 13) * 5 + pick(R, [0, 2, 3]), q = 90 - p;
  const f = fanFrom([a, b, c], s, [p, q], { O, marks: [mk('w', a, c, { box: true, col: 'first' }), mk('p', a, b, { text: dg(p), col: 'second' }), mk('x', b, c, { text: '?', alt: dg(q), col: 'link' })] });
  return numItem({ id: `addParts-right-${n}`, family: 'addParts', prompt: `The box marks ${A(ang(a, O, c))} as a right angle, and ${B(m(a, O, b) + ' = ' + dg(p))}. Find ${S(m(b, O, c))}.`, board: '', givens: [`${tm(a, O, c)} = ${td(90)}`, `${tm(a, O, b)} = ${td(p)}`], work: [`${p} + x = 90`, `x = ${q}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x'] } },
    solution: ['The two parts fill the right angle, so they add to 90°.', `${p} + x = 90, x = ${q}°.`] }, q, `Yes: ${p} + ${q} = 90.`,
  [{ v: 180 - p, mc: MC.whole90or180, say: 'The whole here is the right angle (the box): 90°, not 180°.' }, { v: 90, mc: MC.reportsWhole, say: '90° is the whole angle. The question asks for one part of it.' }], 'The two parts fill the right angle: they add to 90°.');
});
const armLength: Gen = (R, n) => fitted(() => {
  const big = int(R, 12, 20) * 5, small = big - int(R, 4, 7) * 5;
  const longFirst = R() < 0.5;
  const s1 = rot(R) % 90, s2 = rot(R) % 90;
  const fP: Fan = { O: 'P', rays: [{ p: 'p1', deg: s1, len: 1, noLetter: true }, { p: 'p2', deg: s1 + small, len: 1, noLetter: true }], lines: [], marks: [mk('a', 'p1', 'p2', { col: 'plain' })] };
  const fQ: Fan = { O: 'Q', rays: [{ p: 'q1', deg: s2, len: 0.42, noLetter: true }, { p: 'q2', deg: s2 + big, len: 0.42, noLetter: true }], lines: [], marks: [mk('b', 'q1', 'q2', { col: 'plain' })] };
  const fans = longFirst ? [fP, fQ] : [fQ, fP];
  const opts: Opt[] = [
    { t: '∠Q: it opens wider', ok: true, say: 'Yes: the size of an angle is how far it opens, not how long its sides are drawn.' },
    { t: '∠P: its sides are longer', mc: MC.armLength, say: 'Longer sides are only drawn longer. Compare how wide each angle opens.' },
    { t: 'They are the same size', say: 'Put one on top of the other: ∠Q opens wider.' },
  ];
  return choiceItem(R, { id: `armLength-${n}`, family: 'armLength', prompt: 'Which angle is bigger, ∠P or ∠Q?', board: '', givens: [], work: [], picture: { ...pic(fans), solve: { focus: ['b'] } },
    solution: ['An angle measures the opening between its sides.', 'The length of the drawn sides does not change it: ∠Q opens wider.'] }, opts);
});

// ================= 6-7 identify-complementary / identify-supplementary =================
function sepFans(p: number, q: number, s1: number, s2: number, tp: string, tq: string): Fan[] {
  return [
    { O: 'P', rays: [{ p: 'p1', deg: s1, noLetter: true }, { p: 'p2', deg: s1 + p, noLetter: true }], lines: [], marks: [mk('P', 'p1', 'p2', { text: tp, col: 'second' })] },
    { O: 'Q', rays: [{ p: 'q1', deg: s2, noLetter: true }, { p: 'q2', deg: s2 + q, noLetter: true }], lines: [], marks: [mk('Q', 'q1', 'q2', { text: tq, col: 'second' })] },
  ];
}
const pairName: Gen = (R, n, sg) => fitted(() => {
  const supp = sg === 'identify-supplementary' || (sg !== 'identify-complementary' && R() < 0.5);
  const T = supp ? 180 : 90, name = supp ? 'supplementary' : 'complementary', other = supp ? 'complementary' : 'supplementary';
  const v = supp ? pick(R, ['pair', 'pair', 'right2', 'near', 'adj'] as const) : pick(R, ['pair', 'pair', 'near', 'none', 'adj'] as const);
  const s1 = int(R, 0, 6) * 10, s2 = int(R, 0, 6) * 10;
  if (v === 'none') {
    let p = int(R, 19, 33) * 5;
    if (p === 135) p = 140;   // 180 - 135 = 135 - 90: two options would read the same
    const f: Fan = { O: 'P', rays: [{ p: 'p1', deg: s1, noLetter: true }, { p: 'p2', deg: s1 + p, noLetter: true }], lines: [], marks: [mk('P', 'p1', 'p2', { text: dg(p), col: 'second' })] };
    const opts: Opt[] = [
      { t: `None: ${p}° is already more than 90°`, ok: true, say: 'Right: a complement adds up to 90°, and this angle is past 90° on its own.' },
      { t: dg(180 - p), mc: MC.swapped, say: `${180 - p}° is its SUPPLEMENT (they make 180°). Complementary means 90°.` },
      { t: dg(p - 90), say: `${p} + ${p - 90} is not 90. No positive angle adds to ${p}° to make 90°.` },
    ];
    return choiceItem(R, { id: `pairName-none-${n}`, family: 'pairName', prompt: `${B('m∠P = ' + dg(p))}. What is the complement of ∠P?`, board: '', givens: [`m\\angle P = ${td(p)}`], work: [], picture: pic([f]),
      solution: ['Complementary angles add to 90°.', `${p}° is more than 90°, so ∠P has no complement (its supplement is ${180 - p}°).`] }, opts);
  }
  let p: number, q: number;
  if (v === 'right2') { p = 90; q = 90; }
  else if (v === 'near') { p = int(R, supp ? 25 : 20, supp ? 140 : 65); q = T - p + pick(R, [-1, 1, -10, 10, 2]); }
  else { p = int(R, supp ? 25 : 20, supp ? 140 : 65); q = T - p; }
  if (q < 20 || p < 20) return null;
  const sum = p + q, isPair = sum === T;
  const adj = v === 'adj';
  const fans: Fan[] = adj ? [fanFrom(['A', 'B', 'C'], rot(R), [p, q], { O: 'O', marks: [mk('P', 'A', 'B', { text: dg(p), col: 'second' }), mk('Q', 'B', 'C', { text: dg(q), col: 'second' })] })]
    : sepFans(p, q, s1, s2, dg(p), dg(q));
  if (adj && supp) fans[0]!.lines = [];   // two rays, no line drawn: the pair is named by its sum only
  const nm = adj ? [ang('A', 'O', 'B'), ang('B', 'O', 'C')] : ['∠P', '∠Q'];
  const opts: Opt[] = isPair ? [
    { t: `${cap(name)}: ${p} + ${q} = ${T}`, ok: true, say: `Yes: ${p} + ${q} = ${T}, so they are ${name}.` },
    { t: cap(other), mc: MC.swapped, say: `${cap(other)} angles add to ${supp ? 90 : 180}°. These add to ${T}°: ${name}.` },
    ...(adj ? [] : [{ t: 'Neither: they do not share a side', mc: MC.mustTouch, say: `${cap(name)} is about the SUM only. The angles can be anywhere.` }]),
    ...(supp && v === 'right2' ? [{ t: 'Neither: one of them would have to be obtuse', mc: MC.needsObtuse, say: '90 + 90 = 180: two right angles are supplementary.' }]
      : !supp ? [{ t: 'Neither: complementary angles are each 90°', mc: MC.each90, say: 'Complementary angles add up to 90° TOGETHER; each one is smaller.' }] : [{ t: 'Neither: they are not equal', say: `${cap(name)} angles do not have to be equal; they add to ${T}°.` }]),
  ] : [
    { t: `Neither: ${p} + ${q} = ${sum}`, ok: true, say: `Right: ${p} + ${q} = ${sum}, not ${T}. Close is not enough.` },
    { t: cap(name), say: `${p} + ${q} = ${sum}, not ${T}. ${cap(name)} needs exactly ${T}°.` },
    { t: cap(other), say: `${cap(other)} angles add to ${supp ? 90 : 180}°. These add to ${sum}°.` },
  ];
  return choiceItem(R, { id: `pairName-${v}-${n}`, family: 'pairName', prompt: `${B('m' + nm[0] + ' = ' + dg(p))} and ${B('m' + nm[1] + ' = ' + dg(q))}. Are they complementary, supplementary or neither?`, board: '', givens: [], work: [`${p} + ${q} = ${sum}`], picture: pic(fans),
    solution: ['Complementary: the two measures add to 90°. Supplementary: they add to 180°. Where the angles are does not matter.', `${p} + ${q} = ${sum}, so ${isPair ? `they are ${name}` : 'they are neither'}.`] }, opts);
});

// ================= 8 identify-linear-pair =================
const linearPair: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['yes', 'look', 'bent', 'why'] as const);
  const { O, L } = letters(R, 4);
  const [a, b, c, d] = L as [string, string, string, string];
  const s = rot(R);
  const theta = int(R, 8, 26) * 5;
  if (v === 'yes' || v === 'look') {
    const f: Fan = v === 'yes' ? fanFrom([a, b, c], s, [theta, 180 - theta], { O, lines: [[a, c]] })
      : { O, rays: [{ p: a, deg: s }, { p: b, deg: norm(s + theta) }, { p: c, deg: norm(s + 180 + pick(R, [-3, 3, 4, -4])) }], lines: [], marks: [] };
    const opts: Opt[] = v === 'yes' ? [
      { t: `Yes: they are adjacent, and ${O}${a} and ${O}${c} are opposite rays of line ${a}${c}`, ok: true, say: 'Yes: adjacent, and the two outer sides make a drawn line.' },
      { t: 'No: a linear pair must be two equal angles', mc: MC.suppEqual, say: 'A linear pair adds to 180°; the two angles are usually different.' },
      { t: 'No: nothing says they add to 180°', mc: MC.rejectsGiven, say: `The drawn line ${a}${c} says it: the two angles fill a straight angle.` },
    ] : [
      { t: `You can’t tell: no line through ${a}, ${O} and ${c} is drawn or stated`, ok: true, say: `Right: ${O}${a} and ${O}${c} are separate rays. They only look aligned.` },
      { t: 'Yes: the outer sides look like one straight line', mc: MC.looks, say: 'Looking straight is not evidence. A linear pair needs a drawn or stated line.' },
      { t: 'Yes: any two adjacent angles are a linear pair', mc: MC.whole90or180, say: 'Adjacent is not enough: the outer sides must be opposite rays.' },
    ];
    return choiceItem(R, { id: `linearPair-${v}-${n}`, family: 'linearPair', prompt: v === 'yes' ? `Line ${a}${c} is drawn, and ray ${O}${b} starts at ${O}. Are ${ang(a, O, b)} and ${ang(b, O, c)} a linear pair?` : `Rays ${O}${a}, ${O}${b} and ${O}${c} start at ${O}. Are ${ang(a, O, b)} and ${ang(b, O, c)} a linear pair?`, board: '', givens: v === 'yes' ? [`\\text{line } ${a}${c}`] : [], work: [], picture: pic([f]),
      solution: ['A linear pair: two adjacent angles whose outer sides are opposite rays (one drawn or stated line).', v === 'yes' ? `Line ${a}${c} is drawn: ${ang(a, O, b)} + ${ang(b, O, c)} = 180°.` : `No line ${a}${c} is drawn or stated, so you can’t tell.`] }, opts);
  }
  if (v === 'bent') {
    const t2 = int(R, 6, Math.floor((180 - theta) / 5) - 6) * 5;
    const f = fanFrom([a, b, d, c], s, [theta, t2, 180 - theta - t2], { O, lines: [[a, c]] });
    const opts: Opt[] = [
      { t: `No: ${O}${a} and ${O}${d} are not opposite rays`, ok: true, say: `Right: the outer sides ${O}${a} and ${O}${d} bend, so the two angles do not fill a straight angle.` },
      { t: 'Yes: they are adjacent', mc: MC.whole90or180, say: 'Adjacent is not enough. The outer sides must make one line.' },
      { t: `Yes: they both touch line ${a}${c}`, say: `Only ${ang(a, O, b)} has a side on the line. ${O}${d} is not part of line ${a}${c}.` },
    ];
    return choiceItem(R, { id: `linearPair-bent-${n}`, family: 'linearPair', prompt: `Line ${a}${c} is drawn; rays ${O}${b} and ${O}${d} start at ${O}. Are ${ang(a, O, b)} and ${ang(b, O, d)} a linear pair?`, board: '', givens: [`\\text{line } ${a}${c}`], work: [], picture: pic([f]),
      solution: ['A linear pair: adjacent, and the outer sides are opposite rays.', `The outer sides are ${O}${a} and ${O}${d}: not one line. So no.`] }, opts);
  }
  const f = fanFrom([a, b, c], s, [theta, 180 - theta], { O, lines: [[a, c]], marks: [mk('p', a, b, { text: dg(theta), col: 'second' }), mk('x', b, c, { text: 'x', col: 'link' })] });
  const opts: Opt[] = [
    { t: `${O}${a} and ${O}${c} are opposite rays of line ${a}${c}, so the two angles fill a straight angle`, ok: true, say: 'Yes: the straight angle is 180°, and the two parts fill it.' },
    { t: 'Adjacent angles always add to 180°', mc: MC.whole90or180, say: 'Not always: only when the outer sides make a line.' },
    { t: 'Together they look like half a circle', mc: MC.looks, say: 'Looks are not a reason. The reason is the drawn line.' },
  ];
  return choiceItem(R, { id: `linearPair-why-${n}`, family: 'linearPair', prompt: `Why is ${B(m(a, O, b))} + ${S(m(b, O, c))} = 180°?`, board: '', givens: [`\\text{line } ${a}${c}`, `${tm(a, O, b)} + ${tm(b, O, c)} = ${td(180)}`], work: [], picture: pic([f]),
    solution: [`Line ${a}${c} is drawn, so ${O}${a} and ${O}${c} are opposite rays.`, 'Two adjacent angles that fill a straight angle add to 180°.'] }, opts);
});

// ================= 9 identify-vertical =================
const vertical: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['two', 'two', 'three', 'bent'] as const);
  const { O, L } = letters(R, 6);
  if (v === 'two') {
    const [a, b, c, d] = L as [string, string, string, string];
    // the asked angle opens sideways half of the time (the up-and-down belief)
    const theta = int(R, 8, 26) * 5;
    const side = R() < 0.6;
    const s = side ? norm(180 - theta / 2 + pick(R, [0, 180])) : rot(R);
    const f = crossing([a, b, c, d], s, theta, O);
    f.marks = [mk('m1', a, b, { text: '1' }), mk('m2', b, c, { text: '2' }), mk('m3', c, d, { text: '3' }), mk('m4', d, a, { text: '4' })];
    const opts: Opt[] = [
      { t: '∠3', ok: true, say: 'Yes: ∠1 and ∠3 are opposite each other at the crossing: their sides are opposite rays.' },
      { t: '∠2', mc: side ? MC.upDown : undefined, say: '∠2 is next to ∠1 (they share a side). Vertical angles are across the crossing, whichever way they open.' },
      { t: '∠4', mc: side ? MC.upDown : undefined, say: '∠4 is next to ∠1. Vertical angles are across the crossing.' },
      ...(side ? [{ t: 'None: vertical angles open up and down', mc: MC.upDown, say: '“Vertical” is about the vertex, not up and down. ∠1 and ∠3 open sideways and are vertical.' }] : []),
    ];
    return choiceItem(R, { id: `vertical-two-${n}`, family: 'vertical', prompt: `Lines ${a}${c} and ${b}${d} cross at ${O}. Which angle is vertical to ∠1?`, board: '', givens: [`\\text{lines } ${a}${c},\\ ${b}${d}`], work: [], picture: { ...pic([f]), solve: { focus: ['m1', 'm3'] } },
      solution: ['Vertical angles are the opposite angles at a crossing of two lines.', '∠1 and ∠3: the sides of one are the opposite rays of the sides of the other.'] }, opts, true);
  }
  if (v === 'three') {
    const [a, b, c, d, e, g] = L as [string, string, string, string, string, string];
    let t1 = int(R, 8, 14) * 5, t2 = int(R, 8, 14) * 5; const t3 = 180 - t1 - t2;
    if (t3 < 40) { t1 = 60; t2 = 60; }
    const f = fanFrom([a, b, c, d, e, g], rot(R), [t1, t2, 180 - t1 - t2, t1, t2], { O, lines: [[a, d], [b, e], [c, g]] });
    f.marks = [mk('m1', a, b, { text: '1' }), mk('m2', b, c, { text: '2' }), mk('m3', c, d, { text: '3' }), mk('m4', d, e, { text: '4' }), mk('m5', e, g, { text: '5' }), mk('m6', g, a, { text: '6' })];
    const opts: Opt[] = [
      { t: '∠4', ok: true, say: 'Yes: ∠1 and ∠4 are opposite: their sides lie on the same two lines.' },
      { t: '∠3', mc: MC.nonadjVertical, say: '∠3 does not touch ∠1, but its sides are not the opposite rays of ∠1’s sides.' },
      { t: '∠5', mc: MC.nonadjVertical, say: '∠5 does not touch ∠1, but it is not across from it along both lines.' },
      { t: '∠2', say: '∠2 shares a side with ∠1: it is adjacent.' },
    ];
    return choiceItem(R, { id: `vertical-three-${n}`, family: 'vertical', prompt: `Three lines cross at ${O}. Which angle is vertical to ∠1?`, board: '', givens: [`\\text{lines } ${a}${d},\\ ${b}${e},\\ ${c}${g}`], work: [], picture: { ...pic([f]), solve: { focus: ['m1', 'm4'] } },
      solution: ['Vertical angles: the sides of one are the opposite rays of the sides of the other.', `∠1 has sides ${O}${a} and ${O}${b}; their opposite rays ${O}${d} and ${O}${e} make ∠4.`] }, opts, true);
  }
  const [a, b, c, d] = L as [string, string, string, string];
  const theta = int(R, 9, 22) * 5, bend = pick(R, [-1, 1]) * int(R, 4, 6) * 5;
  const s = rot(R);
  const f: Fan = { O, rays: [{ p: a, deg: s }, { p: b, deg: norm(s + theta) }, { p: c, deg: norm(s + 180) }, { p: d, deg: norm(s + 180 + theta + bend) }], lines: [[a, c]], marks: [] };
  f.marks = [mk('m1', a, b, { text: '1' }), mk('m3', c, d, { text: '3' })];
  const opts: Opt[] = [
    { t: `No: ${O}${b} and ${O}${d} are not one line`, ok: true, say: `Right: only one line is drawn. ${O}${b} and ${O}${d} bend at ${O}.` },
    { t: 'Yes: they are across from each other and do not touch', mc: MC.nonadjVertical, say: 'Not touching is not enough: vertical angles need TWO crossing lines.' },
    { t: 'Yes: they look the same size', mc: MC.looks, say: 'Size from the drawing is not evidence, and vertical angles need two lines.' },
  ];
  return choiceItem(R, { id: `vertical-bent-${n}`, family: 'vertical', prompt: `Line ${a}${c} is drawn; rays ${O}${b} and ${O}${d} start at ${O}. Are ∠1 and ∠3 vertical angles?`, board: '', givens: [`\\text{line } ${a}${c}`], work: [], picture: pic([f]),
    solution: ['Vertical angles come from two crossing lines.', `${O}${b} and ${O}${d} are separate rays (they bend), so ∠1 and ∠3 are not vertical.`] }, opts);
});

// ================= 10 vertical-angles-equal =================
const equalPick: Gen = (R, n) => fitted(() => {
  const { O, L } = letters(R, 4);
  const [a, b, c, d] = L as [string, string, string, string];
  if (R() < 0.75) {
    const t = int(R, 7, 31) * 5 + pick(R, [0, 2, 3]);
    if (t === 90) return null;   // every angle at a right crossing is 90°: "m∠2 = 90°" would be true too
    const f = crossing([a, b, c, d], rot(R), t, O);
    f.marks = [mk('m1', a, b, { text: dg(t), col: 'second' }), mk('m2', b, c, { text: '2' }), mk('m3', c, d, { text: '3', alt: dg(t) }), mk('m4', d, a, { text: '4' })];
    const opts: Opt[] = [
      { t: `m∠3 = ${t}°: vertical angles are equal`, ok: true, say: `Yes: ∠3 is across the crossing from the ${t}° angle, so it is also ${t}°.` },
      { t: `m∠3 = ${180 - t}°`, mc: MC.equalAsSupp, say: `${180 - t}° is the angle NEXT to it (a linear pair). Across the crossing the angle is equal: ${t}°.` },
      { t: `m∠2 = ${t}°`, mc: MC.suppEqual, say: `∠2 is next to the ${t}° angle on a line: together they make 180°, so ∠2 = ${180 - t}°.` },
      ...(t < 90 ? [{ t: `m∠2 = ${90 - t}°`, mc: MC.swapped, say: `A straight angle is 180°, not 90°: ∠2 = ${180 - t}°.` }] : []),
    ];
    return choiceItem(R, { id: `equalPick-${n}`, family: 'equalPick', prompt: `Lines ${a}${c} and ${b}${d} cross at ${O}. Which statement is true?`, board: '', givens: [`${tm(a, O, b)} = ${td(t)}`], work: [`m\\angle 3 = ${td(t)}`], picture: { ...pic([f]), solve: { focus: ['m1', 'm3'], reveal: ['m3'] } },
      solution: ['Vertical angles (across a crossing) are equal.', `∠3 is vertical to the ${t}° angle: m∠3 = ${t}°.`] }, opts);
  }
  const t = int(R, 7, 16) * 5;
  const fans = sepFans(t, t, int(R, 0, 8) * 10, int(R, 0, 8) * 10, dg(t), dg(t));
  const opts: Opt[] = [
    { t: 'No: vertical angles are made by the same two crossing lines', ok: true, say: 'Right: equal size is not enough. Vertical is about where the angles are.' },
    { t: 'Yes: they have equal measures', mc: MC.equalMeansVertical, say: 'Equal measures do not make angles vertical. Vertical angles sit across one crossing.' },
    { t: 'Yes: they open the same way', mc: MC.upDown, say: 'Which way they open does not matter. Vertical angles sit across one crossing of two lines.' },
  ];
  return choiceItem(R, { id: `equalPick-sep-${n}`, family: 'equalPick', prompt: `∠P and ∠Q are two separate angles, both ${t}°. Are they vertical angles?`, board: '', givens: [`m\\angle P = m\\angle Q = ${td(t)}`], work: [], picture: pic(fans),
    solution: ['Vertical angles are equal, but equal angles need not be vertical.', 'Vertical angles must be across one crossing of two lines.'] }, opts);
});

// ================= 11 cross-classify =================
const allNames: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['linear', 'adjComp', 'vertRight', 'adjNone', 'sepSupp'] as const);
  const { O, L } = letters(R, 4);
  const [a, b, c, d] = L as [string, string, string, string];
  const s = rot(R);
  let f: Fan[], q1: string, q2: string;
  let opts: Opt[];
  if (v === 'linear') {
    const t = int(R, 7, 29) * 5;
    f = [fanFrom([a, b, c], s, [t, 180 - t], { O, lines: [[a, c]], marks: [mk('p', a, b, { text: dg(t), col: 'second' }), mk('q', b, c, { text: dg(180 - t), col: 'second' })] })];
    q1 = ang(a, O, b); q2 = ang(b, O, c);
    opts = [
      { t: 'Adjacent and supplementary: a linear pair', ok: true, say: 'Yes: they share a side (adjacent) and add to 180° (supplementary). Together: a linear pair.' },
      { t: 'Only adjacent', mc: MC.oneName, say: `They are adjacent, AND ${t} + ${180 - t} = 180: supplementary too. A pair can have several names.` },
      { t: 'Only supplementary', mc: MC.oneName, say: 'They are supplementary, AND they share a side: adjacent too.' },
      { t: 'Vertical and supplementary', say: 'Vertical angles are across a crossing. These sit side by side.' },
    ];
  } else if (v === 'adjComp') {
    const t = int(R, 5, 13) * 5;
    f = [fanFrom([a, b, c], s, [t, 90 - t], { O, marks: [mk('p', a, b, { text: dg(t), col: 'second' }), mk('q', b, c, { text: dg(90 - t), col: 'second' })] })];
    q1 = ang(a, O, b); q2 = ang(b, O, c);
    opts = [
      { t: 'Adjacent and complementary', ok: true, say: `Yes: they share side ${O}${b}, and ${t} + ${90 - t} = 90.` },
      { t: 'Only adjacent', mc: MC.oneName, say: `They are adjacent, AND ${t} + ${90 - t} = 90: complementary too.` },
      { t: 'Only complementary', mc: MC.oneName, say: 'They are complementary, AND they share a side: adjacent too.' },
      { t: 'A linear pair', mc: MC.whole90or180, say: `They add to 90°, not 180°: the outer sides do not make a line.` },
    ];
  } else if (v === 'vertRight') {
    const fc = crossing([a, b, c, d], s, 90, O);
    fc.marks = [mk('box', a, b, { box: true, col: 'first' }), mk('q', c, d, { text: '3', col: 'second' }), mk('p2', b, c, { text: '2' }), mk('p4', d, a, { text: '4' })];
    f = [fc];
    q1 = `${ang(a, O, b)} (the right angle)`; q2 = '∠3';
    opts = [
      { t: 'Vertical and supplementary', ok: true, say: 'Yes: they are across the crossing (vertical), and 90 + 90 = 180 (supplementary).' },
      { t: 'Only vertical', mc: MC.oneName, say: 'They are vertical, so ∠3 is 90° too; 90 + 90 = 180, so they are also supplementary.' },
      { t: 'Only supplementary', mc: MC.oneName, say: 'They are supplementary, AND across one crossing: vertical too.' },
      { t: 'Adjacent and supplementary', say: 'They do not share a side: not adjacent.' },
    ];
  } else if (v === 'adjNone') {
    let p = int(R, 6, 14) * 5; const q = int(R, 6, 14) * 5;
    if (p + q === 90 || p + q === 180) p += 5;
    f = [fanFrom([a, b, c], s, [p, q], { O, marks: [mk('p', a, b, { text: dg(p), col: 'second' }), mk('q', b, c, { text: dg(q), col: 'second' })] })];
    q1 = ang(a, O, b); q2 = ang(b, O, c);
    opts = [
      { t: `Only adjacent: ${p} + ${q} = ${p + q}`, ok: true, say: `Yes: they share a side, and ${p + q}° is neither 90° nor 180°.` },
      { t: 'Adjacent and supplementary', mc: MC.whole90or180, say: `Sharing a side does not make 180°: ${p} + ${q} = ${p + q}.` },
      { t: 'Adjacent and complementary', mc: MC.whole90or180, say: `${p} + ${q} = ${p + q}, not 90.` },
      { t: 'No name fits', say: `They share vertex ${O} and side ${O}${b}: adjacent.` },
    ];
  } else {
    const t = int(R, 7, 29) * 5;
    f = sepFans(t, 180 - t, int(R, 0, 6) * 10, int(R, 0, 6) * 10, dg(t), dg(180 - t));
    q1 = '∠P'; q2 = '∠Q';
    opts = [
      { t: 'Only supplementary', ok: true, say: `Yes: ${t} + ${180 - t} = 180, and they are separate, so not adjacent.` },
      { t: 'Supplementary and adjacent', say: 'They do not share a vertex or a side: not adjacent.' },
      { t: 'A linear pair', mc: MC.mustTouch, say: 'A linear pair must share a side. These are supplementary but apart.' },
      { t: 'Neither: they do not touch', mc: MC.mustTouch, say: `Supplementary is about the sum only: ${t} + ${180 - t} = 180.` },
    ];
  }
  return choiceItem(R, { id: `allNames-${v}-${n}`, family: 'allNames', prompt: `Which names fit ${q1} and ${q2}? Give every name that applies.`, board: '', givens: [], work: [], picture: pic(f!),
    solution: ['Position names: adjacent (shared side), vertical (across a crossing), linear pair. Measure names: complementary (90°), supplementary (180°).', 'One pair can have a position name AND a measure name.'] }, opts);
});

// ================= 12-13 find-complement / find-supplement =================
const findPair: Gen = (R, n, sg) => fitted(() => {
  const supp = sg === 'find-supplement' || (sg !== 'find-complement' && R() < 0.5);
  const T = supp ? 180 : 90, name = supp ? 'supplementary' : 'complementary';
  const v = pick(R, ['adj', 'adj', 'sep', 'bare'] as const);
  const { O, L } = letters(R, 3);
  const [a, b, c] = L as [string, string, string];
  const p = v === 'bare' ? (supp ? pick(R, [int(R, 1, 24), int(R, 156, 179)]) : pick(R, [int(R, 1, 19), int(R, 71, 89)])) : int(R, supp ? 25 : 20, supp ? 155 : 70);
  const x = T - p;
  let fans: Fan[] = [], prompt: string, given: string, nm: string;
  if (v === 'adj') {
    const marks: AMark[] = [mk('p', a, b, { text: dg(p), col: 'second' }), mk('x', b, c, { text: 'x', alt: dg(x), col: 'link' })];
    if (!supp) marks.unshift(mk('w', a, c, { box: true, col: 'first' }));
    fans = [fanFrom([a, b, c], rot(R), [p, x], { O, lines: supp ? [[a, c]] : [], marks })];
    nm = m(b, O, c); given = m(a, O, b);
    prompt = supp ? `Line ${A(a + c)} is drawn and ${B(m(a, O, b) + ' = ' + dg(p))}. Write an equation and find ${S('x = ' + nm)}.`
      : `The box marks ${A(ang(a, O, c))} as a right angle, and ${B(m(a, O, b) + ' = ' + dg(p))}. Write an equation and find ${S('x = ' + nm)}.`;
  } else {
    if (v === 'sep') fans = sepFans(p, x, int(R, 0, 6) * 10, int(R, 0, 6) * 10, dg(p), 'x');
    if (v === 'sep') fans[1]!.marks[0] = { ...fans[1]!.marks[0]!, col: 'link', alt: dg(x) };
    nm = 'm∠Q'; given = 'm∠P';
    prompt = `∠P and ∠Q are ${name}, and ${B('m∠P = ' + dg(p))}. Write an equation and find ${S('x = m∠Q')}.`;
  }
  const work = [`${p} + x = ${T}`, `x = ${T} - ${p}`, `x = ${x}`];
  return numItem({ id: `findPair-${v}-${n}`, family: 'findPair', prompt, board: '', givens: v === 'adj' ? [supp ? `\\text{line } ${a}${c}` : `${tm(a, O, c)} = ${td(90)}`, `${tm(a, O, b)} = ${td(p)}`] : [`m\\angle P = ${td(p)}`, `\\angle P,\\ \\angle Q\\ \\text{${name}}`], work, picture: { ...pic(fans), solve: { reveal: ['x', 'Q'], focus: ['x', 'Q'] } },
    solution: [`${cap(name)} angles add to ${T}°: ${given} + x = ${T}.`, `x = ${T} − ${p} = ${x}°.`] }, x, `Yes: ${p} + ${x} = ${T}.`,
  [supp ? { v: 90 - p, mc: MC.swapped, say: 'Supplementary angles add to 180°, not 90°.' } : { v: 180 - p, mc: MC.swapped, say: 'Complementary angles add to 90°, not 180°.' },
    { v: T, mc: MC.reportsWhole, say: `${T}° is the total of the pair. Take away the ${p}° you know.` }], `${cap(name)}: ${p} + x = ${T}. Solve for x.`);
});

// ================= 14 find-vertical =================
const findVertical: Gen = (R, n) => fitted(() => {
  const { O, L } = letters(R, 4);
  const [a, b, c, d] = L as [string, string, string, string];
  const t = int(R, 25, 155);
  if (t === 90) return null;
  const across = R() < 0.55;
  const f = crossing([a, b, c, d], rot(R), t, O);
  f.marks = [mk('g', a, b, { text: dg(t), col: 'second' }), across ? mk('x', c, d, { text: 'x', alt: dg(t), col: 'link' }) : mk('x', b, c, { text: 'x', alt: dg(180 - t), col: 'link' })];
  const ans = across ? t : 180 - t;
  const tgt = across ? m(c, O, d) : m(b, O, c);
  return numItem({ id: `findVertical-${across ? 'across' : 'next'}-${n}`, family: 'findVertical', prompt: `Lines ${a}${c} and ${b}${d} cross at ${O}, and ${B(m(a, O, b) + ' = ' + dg(t))}. Find ${S('x = ' + tgt)}.`, board: '', givens: [`\\text{lines } ${a}${c},\\ ${b}${d}`, `${tm(a, O, b)} = ${td(t)}`], work: across ? [`x = ${t}`] : [`${t} + x = 180`, `x = ${180 - t}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x', 'g'] } },
    solution: across ? [`${ang(c, O, d)} is across the crossing from ${ang(a, O, b)}: vertical angles.`, `Vertical angles are equal: x = ${t}°. No subtraction.`] : [`${ang(b, O, c)} is next to ${ang(a, O, b)} on line ${a}${c}: a linear pair.`, `${t} + x = 180, so x = ${180 - t}°.`] }, ans, across ? `Yes: vertical angles are equal, ${t}°.` : `Yes: a linear pair, ${t} + ${180 - t} = 180.`,
  across ? [{ v: 180 - t, mc: MC.equalAsSupp, say: `${180 - t}° is the angle next door. Across the crossing the angle is equal: ${t}°.` }]
    : [{ v: t, mc: MC.suppEqual, say: `${t}° is the angle across the crossing. This one is NEXT to it on a line: they add to 180°.` }], across ? 'Across the crossing: vertical angles are equal.' : 'Next door on a line: the two angles add to 180°.');
});

// ================= 15 find-missing-part =================
const missingPart: Gen = (R, n) => fitted(() => {
  const { O, L } = letters(R, 3);
  const [a, b, c] = L as [string, string, string];
  let W = pick(R, [int(R, 100, 170), int(R, 45, 85)]);
  if (W === 90 || W === 180) W += 5;
  const p = int(R, 25, W - 25);
  const q = W - p;
  const wholeKnown = R() < 0.75;
  const marks: AMark[] = wholeKnown
    ? [mk('w', a, c, { text: dg(W), col: 'first', lvl: 1 }), mk('p', a, b, { text: dg(p), col: 'second' }), mk('x', b, c, { text: 'x', alt: dg(q), col: 'link' })]
    : [mk('w', a, c, { text: 'x', alt: dg(W), col: 'link', lvl: 1 }), mk('p', a, b, { text: dg(p), col: 'second' }), mk('q', b, c, { text: dg(q), col: 'second' })];
  const f = fanFrom([a, b, c], rot(R), [p, q], { O, marks });
  if (wholeKnown) return numItem({ id: `missingPart-${n}`, family: 'missingPart', prompt: `${A(m(a, O, c) + ' = ' + dg(W))} and ${B(m(a, O, b) + ' = ' + dg(p))}. Find ${S('x = ' + m(b, O, c))}.`, board: '', givens: [`${tm(a, O, c)} = ${td(W)}`, `${tm(a, O, b)} = ${td(p)}`], work: [`${p} + x = ${W}`, `x = ${q}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x'] } },
    solution: [`The whole is ${ang(a, O, c)} = ${W}°; ${ang(a, O, b)} and ${ang(b, O, c)} are its parts.`, `${p} + x = ${W}, so x = ${q}°.`] }, q, `Yes: ${p} + ${q} = ${W}.`,
  [{ v: 180 - p, mc: MC.adjSpecial, say: `The whole here is ${W}°, not 180°. Use the whole you are given.` }, ...(p < 90 ? [{ v: 90 - p, mc: MC.adjSpecial, say: `The whole here is ${W}°, not 90°.` }] : []), { v: W + p, mc: MC.overlapAdd, say: `${ang(a, O, b)} is part of the ${W}° angle: take it away, do not add it.` }], `The parts add up to the whole: ${p} + x = ${W}.`);
  return numItem({ id: `missingPart-whole-${n}`, family: 'missingPart', prompt: `Ray ${O}${b} splits ${ang(a, O, c)}: ${B(m(a, O, b) + ' = ' + dg(p))} and ${B(m(b, O, c) + ' = ' + dg(q))}. Find ${S('x = ' + m(a, O, c))}.`, board: '', givens: [`${tm(a, O, b)} = ${td(p)}`, `${tm(b, O, c)} = ${td(q)}`], work: [`x = ${p} + ${q}`, `x = ${W}`], picture: { ...pic([f]), solve: { reveal: ['w'], focus: ['w'] } },
    solution: ['The whole angle is made of the two parts.', `x = ${p} + ${q} = ${W}°.`] }, W, `Yes: ${p} + ${q} = ${W}.`,
  [{ v: 180, mc: MC.adjSpecial, say: 'Nothing makes this a straight angle. Add the parts.' }, { v: Math.abs(p - q), say: 'Add the parts; do not subtract.' }], 'The whole is the two parts together.');
});

// ================= 16 several-parts-on-line =================
const lineParts: Gen = (R, n) => fitted(() => {
  const { O, L } = letters(R, 5);
  const right = R() < 0.35;
  const T = right ? 90 : 180;
  const k = right ? 3 : pick(R, [3, 3, 4]);
  const parts: number[] = [];
  for (let i = 0; i < k - 1; i++) parts.push(right ? int(R, 22, 34) : int(R, 30, 70));
  const xv = T - parts.reduce((x, y) => x + y, 0);
  if (xv < (right ? 22 : 30)) return null;
  const at = int(R, 0, k - 1);
  const all = parts.slice(); all.splice(at, 0, xv);
  const lets = L.slice(0, k + 1);
  const marks: AMark[] = all.map((p, i) => i === at ? mk('x', lets[i]!, lets[i + 1]!, { text: 'x', alt: dg(xv), col: 'link' }) : mk(`p${i}`, lets[i]!, lets[i + 1]!, { text: dg(p), col: 'second' }));
  if (right) marks.unshift(mk('w', lets[0]!, lets[k]!, { box: true, col: 'first' }));
  const f = fanFrom(lets, rot(R), all, { O, lines: right ? [] : [[lets[0]!, lets[k]!]], marks });
  const known = parts.join(' + ');
  const wrongs: Wrong[] = [];
  for (const p of parts) wrongs.push({ v: T - p, mc: MC.omitsKnown, say: `Take away ALL the known parts: ${T} − (${known}).` });
  if (!right) wrongs.push({ v: 360 - parts.reduce((x, y) => x + y, 0), mc: MC.straightFull, say: 'Angles on a straight line add to 180°; 360° is a full turn around a point.' });
  else wrongs.push({ v: 180 - parts.reduce((x, y) => x + y, 0), mc: MC.whole90or180, say: 'The whole is the marked right angle: 90°.' });
  return numItem({ id: `lineParts-${right ? 'right' : 'line'}-${n}`, family: 'lineParts', prompt: right ? `The box marks ${A(ang(lets[0]!, O, lets[k]!))} as a right angle, split into ${k} parts. Find ${S('x')}.` : `Line ${A(lets[0]! + lets[k]!)} is drawn; ${k} angles fill the straight angle at ${O}. Find ${S('x')}.`, board: '', givens: [right ? `${tm(lets[0]!, O, lets[k]!)} = ${td(90)}` : `\\text{line } ${lets[0]}${lets[k]}`], work: [`${all.map((p, i) => (i === at ? 'x' : String(p))).join(' + ')} = ${T}`, `x = ${T} - ${parts.reduce((x, y) => x + y, 0)}`, `x = ${xv}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x'] } },
    solution: [`The ${k} angles fill ${right ? 'the right angle: they add to 90°' : 'a straight angle: they add to 180°'}.`, `${all.map((p, i) => (i === at ? 'x' : String(p))).join(' + ')} = ${T}, so x = ${xv}°.`] }, xv, `Yes: ${all.join(' + ')} = ${T}.`, wrongs, `All ${k} parts add to ${T}°.`);
});

// ================= 17 angles-around-point =================
const aroundPoint: Gen = (R, n) => fitted(() => {
  const k = pick(R, [4, 4, 5]);
  const { O, L } = letters(R, k);
  const parts: number[] = [];
  for (let i = 0; i < k - 1; i++) parts.push(int(R, 45, 110));
  const xv = 360 - parts.reduce((x, y) => x + y, 0);
  if (xv < 40 || xv > 170) return null;
  const at = int(R, 0, k - 1);
  const all = parts.slice(); all.splice(at, 0, xv);
  const lets = [...L, L[0]!];
  const marks = all.map((p, i) => i === at ? mk('x', lets[i]!, lets[i + 1]!, { text: 'x', alt: dg(xv), col: 'link' }) : mk(`p${i}`, lets[i]!, lets[i + 1]!, { text: dg(p), col: 'second' }));
  const f = fanFrom(L, rot(R), all.slice(0, k - 1), { O, marks });
  const S0 = parts.reduce((x, y) => x + y, 0);
  const wrongs: Wrong[] = [];
  if (180 - S0 > 0) wrongs.push({ v: 180 - S0, mc: MC.straightFull, say: 'All the way around a point is a full turn: 360°, not 180°.' });
  for (const p of parts) wrongs.push({ v: 360 - (S0 - p), mc: MC.omitsKnown, say: `Take away ALL the known angles: 360 − (${parts.join(' + ')}).` });
  return numItem({ id: `aroundPoint-${n}`, family: 'aroundPoint', prompt: `${k} angles fill the whole turn around ${O}. Find ${S('x')}.`, board: '', givens: [], work: [`${all.map((p, i) => (i === at ? 'x' : String(p))).join(' + ')} = 360`, `x = 360 - ${S0}`, `x = ${xv}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x'] } },
    solution: ['Angles around a point fill a full turn: they add to 360°.', `x = 360 − ${S0} = ${xv}°.`] }, xv, `Yes: ${all.join(' + ')} = 360.`, wrongs, 'All the way around a point adds to 360°.');
});

// ================= 18 select-relationship =================
const mixed: Gen = (R, n) => {
  const kind = pick(R, ['vert', 'supp', 'comp', 'around', 'whole'] as const);
  const it = kind === 'vert' ? findVertical(R, n) : kind === 'supp' ? findPair(R, n, 'find-supplement') : kind === 'comp' ? findPair(R, n, 'find-complement') : kind === 'around' ? aroundPoint(R, n) : missingPart(R, n);
  const base = it as AngleItem;
  const ans = (base.answer as { v: number }).v;
  // the same problem, no name prompt; an answer that another rule would give is "the last rule practised"
  const probes = PROBES.get(base) ?? [];
  const prev = base.check;
  const out: AngleItem = { ...base, id: `mixed-${kind}-${n}`, family: 'mixed', prompt: base.prompt.replace(/ Write an equation and find /, ' Find ').replace(/^∠P and ∠Q are (complementary|supplementary), and /, (_, w: string) => `∠P and ∠Q are ${w}; `),
    check: r => {
      const v = prev(r);
      if (v.ok || v.mc || r.kind !== 'num') return v;
      const other = [180 - ans, 90 - ans, 360 - ans].includes(r.v) ? MC.lastRule : undefined;
      return other ? { ...v, mc: other, say: 'That fits a different relationship. Look at the figure first: across, next to on a line, a right angle, all the way round, or a given whole?' } : v;
    } };
  PROBES.set(out, probes);
  return out;
};

// ================= 19 chain-relationships =================
const chain: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['vp', 'vp', 'cv', 'sp', 'can'] as const);
  const { O, L } = letters(R, 5);
  const [a, b, c, d, e] = L as [string, string, string, string, string];
  const s = rot(R);
  if (v === 'vp' || v === 'can') {
    const t = int(R, 14, 26) * 5, p = int(R, 5, t / 5 - 5) * 5 + pick(R, [0, 2, 3]);
    const x = t - p;
    const f: Fan = { O, rays: [{ p: a, deg: s }, { p: b, deg: norm(s + t) }, { p: c, deg: norm(s + 180) }, { p: e, deg: norm(s + 180 + p) }, { p: d, deg: norm(s + 180 + t) }], lines: [[a, c], [b, d]],
      marks: [mk('g', a, b, { text: dg(t), col: 'second' }), mk('p', c, e, { text: dg(p), col: 'second' }), mk('x', e, d, { text: 'x', alt: dg(x), col: 'link' })] };
    if (v === 'can') {
      const opts: Opt[] = [
        { t: `Yes: ${m(c, O, d)} = ${t}° (vertical to ${ang(a, O, b)}), so x = ${t} − ${p} = ${x}°`, ok: true, say: `Yes: the unlabeled ${ang(c, O, d)} is known through vertical angles.` },
        { t: `No: ${ang(c, O, d)} has no number on it`, mc: MC.unknowable, say: `An angle without a number can still be known: ${ang(c, O, d)} is vertical to the ${t}° angle.` },
        { t: `Yes: x = ${t}°, the same as ${ang(a, O, b)}`, mc: MC.wrongAngle, say: `${t}° is all of ${ang(c, O, d)}. x is only the part ${ang(e, O, d)}.` },
      ];
      return choiceItem(R, { id: `chain-can-${n}`, family: 'chain', prompt: `Lines ${a}${c} and ${b}${d} cross at ${O}; ray ${O}${e} is inside ${ang(c, O, d)}. Can you find ${S('x')}?`, board: '', givens: [`${tm(a, O, b)} = ${td(t)}`, `${tm(c, O, e)} = ${td(p)}`], work: [`${tm(c, O, d)} = ${td(t)}`, `x = ${t} - ${p} = ${x}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x'] } },
        solution: [`Step 1: ${ang(c, O, d)} is vertical to ${ang(a, O, b)}, so it is ${t}°.`, `Step 2: ${p} + x = ${t}, so x = ${x}°.`] }, opts);
    }
    return numItem({ id: `chain-vp-${n}`, family: 'chain', prompt: `Lines ${a}${c} and ${b}${d} cross at ${O}; ray ${O}${e} is inside ${ang(c, O, d)}. ${B(m(a, O, b) + ' = ' + dg(t))}, ${B(m(c, O, e) + ' = ' + dg(p))}. Find ${S('x')}.`, board: '', givens: [`${tm(a, O, b)} = ${td(t)}`, `${tm(c, O, e)} = ${td(p)}`], work: [`${tm(c, O, d)} = ${td(t)}\\ \\text{(vertical)}`, `${p} + x = ${t}`, `x = ${x}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x', 'g'] } },
      solution: [`Step 1: ${ang(c, O, d)} is vertical to ${ang(a, O, b)}: ${m(c, O, d)} = ${t}°.`, `Step 2: ${ang(c, O, e)} + ${ang(e, O, d)} = ${ang(c, O, d)}: ${p} + x = ${t}, x = ${x}°.`] }, x, `Yes: ${m(c, O, d)} = ${t}°, then ${t} − ${p} = ${x}.`,
    [{ v: t, mc: MC.wrongAngle, say: `${t}° is the whole ${ang(c, O, d)}. x is only part of it.` }, { v: 180 - t - p, mc: MC.equalAsSupp, say: `${ang(c, O, d)} is ACROSS from ${ang(a, O, b)}: it is equal (${t}°), not ${180 - t}°.` }, { v: 180 - p, mc: MC.original, say: `Use the angle you found in step 1 (${m(c, O, d)} = ${t}°), not a straight angle.` }], `Find ${m(c, O, d)} first (vertical angles), then the part.`);
  }
  if (v === 'cv') {
    const p = int(R, 5, 13) * 5 + pick(R, [0, 2, 3]), y = 90 - p;
    // OB inside the right angle AOE; lines AC and BD; find angle COD = angle AOB = 90 - p
    const f: Fan = { O, rays: [{ p: a, deg: s }, { p: b, deg: norm(s + y) }, { p: e, deg: norm(s + 90) }, { p: c, deg: norm(s + 180) }, { p: d, deg: norm(s + 180 + y) }], lines: [[a, c], [b, d]],
      marks: [mk('w', a, e, { box: true, col: 'first' }), mk('p', b, e, { text: dg(p), col: 'second' }), mk('x', c, d, { text: 'x', alt: dg(y), col: 'link' })] };
    return numItem({ id: `chain-cv-${n}`, family: 'chain', prompt: `Lines ${a}${c} and ${b}${d} cross at ${O}; the box marks ${A(ang(a, O, e))} as a right angle, and ${B(m(b, O, e) + ' = ' + dg(p))}. Find ${S('x')}.`, board: '', givens: [`${tm(a, O, e)} = ${td(90)}`, `${tm(b, O, e)} = ${td(p)}`], work: [`${tm(a, O, b)} = 90 - ${p} = ${y}`, `x = ${tm(a, O, b)} = ${y}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x'] } },
      solution: [`Step 1: ${ang(a, O, b)} and ${ang(b, O, e)} fill the right angle: ${m(a, O, b)} = 90 − ${p} = ${y}°.`, `Step 2: ${ang(c, O, d)} is vertical to ${ang(a, O, b)}: x = ${y}°.`] }, y, `Yes: ${90 - p}° from the right angle, then vertical angles.`,
    [{ v: p, mc: MC.original, say: `Use the angle from step 1 (${m(a, O, b)} = ${y}°), not the ${p}° you started with.` }, { v: 90 + p, mc: MC.equalAsSupp, say: 'x is ACROSS from ∠' + a + O + b + ': vertical angles are equal.' }, { v: 180 - p, mc: MC.swapped, say: 'The box makes a right angle: the parts add to 90°, not 180°.' }], 'Two steps: the right angle first, then vertical angles.');
  }
  // sp: supplement, then a part
  const cc = int(R, 22, 30) * 5, pe = int(R, 5, Math.floor((180 - cc) / 5) - 4) * 5;
  const y = 180 - cc, x = y - pe;
  if (x < 22) return null;
  const f: Fan = { O, rays: [{ p: a, deg: s }, { p: e, deg: norm(s + pe) }, { p: b, deg: norm(s + y) }, { p: c, deg: norm(s + 180) }], lines: [[a, c]],
    marks: [mk('g', b, c, { text: dg(cc), col: 'second' }), mk('p', a, e, { text: dg(pe), col: 'second' }), mk('x', e, b, { text: 'x', alt: dg(x), col: 'link' })] };
  return numItem({ id: `chain-sp-${n}`, family: 'chain', prompt: `Line ${a}${c} is drawn; rays ${O}${e} and ${O}${b} start at ${O}. ${B(m(b, O, c) + ' = ' + dg(cc))}, ${B(m(a, O, e) + ' = ' + dg(pe))}. Find ${S('x')}.`, board: '', givens: [`\\text{line } ${a}${c}`, `${tm(b, O, c)} = ${td(cc)}`, `${tm(a, O, e)} = ${td(pe)}`], work: [`${tm(a, O, b)} = 180 - ${cc} = ${y}`, `${pe} + x = ${y}`, `x = ${x}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x'] } },
    solution: [`Step 1: ${ang(a, O, b)} and ${ang(b, O, c)} are a linear pair: ${m(a, O, b)} = 180 − ${cc} = ${y}°.`, `Step 2: ${pe} + x = ${y}, so x = ${x}°.`] }, x, `Yes: ${y}° first, then ${y} − ${pe} = ${x}.`,
  [{ v: y, mc: MC.wrongAngle, say: `${y}° is all of ${ang(a, O, b)}. x is only part of it.` }, { v: cc - pe, mc: MC.original, say: `Use the angle from step 1 (${m(a, O, b)} = ${y}°).` }, { v: 180 - pe, mc: MC.omitsKnown, say: `The straight angle holds three angles: take away ${cc} AND ${pe}.` }], 'Find the angle next to the given one on the line first, then the part.');
});

// ================= 20 justify-steps =================
const reason: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['vert', 'supp', 'comp', 'around'] as const);
  const { O, L } = letters(R, 4);
  const [a, b, c, d] = L as [string, string, string, string];
  const s = rot(R);
  const t = int(R, 7, 29) * 5;
  let f: Fan, step: string, opts: Opt[], work: string[];
  if (v === 'vert') {
    f = crossing([a, b, c, d], s, t, O);
    f.marks = [mk('g', a, b, { text: dg(t), col: 'second' }), mk('x', c, d, { text: dg(t), col: 'link' })];
    step = `${m(c, O, d)} = ${t}°`; work = [`${tm(c, O, d)} = ${td(t)}`];
    opts = [
      { t: `Vertical angles are equal: lines ${a}${c} and ${b}${d} cross at ${O}`, ok: true, say: 'Yes: the evidence (two drawn lines) and the relationship (vertical angles).' },
      { t: `${ang(a, O, b)} and ${ang(c, O, d)} are a linear pair`, mc: MC.noHypotheses, say: 'A linear pair shares a side. These are across the crossing: vertical angles.' },
      { t: `${ang(c, O, d)} looks the same size as ${ang(a, O, b)}`, mc: MC.looks, say: 'Looks are not a reason. Name the relationship and its evidence.' },
      { t: 'No reason needed: it is obvious', mc: MC.noReason, say: 'Every step needs a reason: here, vertical angles.' },
    ];
  } else if (v === 'supp') {
    f = fanFrom([a, b, c], s, [t, 180 - t], { O, lines: [[a, c]], marks: [mk('g', a, b, { text: dg(t), col: 'second' }), mk('x', b, c, { text: dg(180 - t), col: 'link' })] });
    step = `${m(b, O, c)} = 180° − ${t}° = ${180 - t}°`; work = [`${tm(b, O, c)} = 180 - ${t} = ${180 - t}`];
    opts = [
      { t: `Linear pair: ${O}${a} and ${O}${c} are opposite rays of line ${a}${c}`, ok: true, say: 'Yes: the drawn line makes the two angles a linear pair.' },
      { t: 'Vertical angles are equal', mc: MC.noHypotheses, say: 'Vertical angles sit across a crossing of two lines. Here there is one line and a ray.' },
      { t: `${ang(a, O, b)} and ${ang(b, O, c)} are adjacent, so they add to 180°`, mc: MC.adjSpecial, say: 'Adjacent alone does not give 180°. The reason is the drawn line.' },
      { t: 'No reason needed: it is obvious', mc: MC.noReason, say: 'Every step needs a reason: here, a linear pair.' },
    ];
  } else if (v === 'comp') {
    const p = int(R, 5, 13) * 5;
    f = fanFrom([a, b, c], s, [p, 90 - p], { O, marks: [mk('w', a, c, { box: true, col: 'first' }), mk('g', a, b, { text: dg(p), col: 'second' }), mk('x', b, c, { text: dg(90 - p), col: 'link' })] });
    step = `${m(b, O, c)} = 90° − ${p}° = ${90 - p}°`; work = [`${tm(b, O, c)} = 90 - ${p} = ${90 - p}`];
    opts = [
      { t: `The box marks ${ang(a, O, c)} as a right angle, and the two parts fill it`, ok: true, say: 'Yes: the box is the evidence; the parts add to 90°.' },
      { t: `${ang(a, O, b)} and ${ang(b, O, c)} are a linear pair`, mc: MC.noHypotheses, say: `A linear pair needs a line. ${O}${a} and ${O}${c} make a right angle.` },
      { t: 'Complementary angles are each 90°', mc: MC.each90, say: 'Complementary angles add to 90° together.' },
      { t: 'No reason needed: it is obvious', mc: MC.noReason, say: 'Every step needs a reason: here, the marked right angle.' },
    ];
  } else {
    const parts = [int(R, 9, 20) * 5, int(R, 9, 20) * 5, int(R, 9, 20) * 5];
    const xv = 360 - parts[0]! - parts[1]! - parts[2]!;
    if (xv < 45 || xv > 170) return null;
    f = fanFrom([a, b, c, d], s, parts, { O, marks: [mk('p0', a, b, { text: dg(parts[0]!), col: 'second' }), mk('p1', b, c, { text: dg(parts[1]!), col: 'second' }), mk('p2', c, d, { text: dg(parts[2]!), col: 'second' }), mk('x', d, a, { text: dg(xv), col: 'link' })] });
    step = `${m(d, O, a)} = 360° − ${parts[0]! + parts[1]! + parts[2]!}° = ${xv}°`; work = [`${tm(d, O, a)} = 360 - ${parts[0]! + parts[1]! + parts[2]!} = ${xv}`];
    opts = [
      { t: `The four angles fill the full turn around ${O}: 360°`, ok: true, say: 'Yes: angles around a point add to 360°.' },
      { t: 'Angles on a line add to 360°', mc: MC.straightFull, say: 'A straight angle is 180°; a full turn around a point is 360°.' },
      { t: `${ang(d, O, a)} and ${ang(a, O, b)} are a linear pair`, mc: MC.noHypotheses, say: 'No line is drawn here. The reason is the full turn.' },
      { t: 'No reason needed: it is obvious', mc: MC.noReason, say: 'Every step needs a reason: here, the full turn.' },
    ];
  }
  return choiceItem(R, { id: `reason-${v}-${n}`, family: 'reason', prompt: `A step in a solution says <b>${step}</b>. Which reason backs it up?`, board: '', givens: [], work, picture: { ...pic([f]), solve: { focus: ['x'] } },
    solution: ['A reason has two parts: the evidence in the figure and the relationship it gives.', opts.find(o => o.ok)!.t + '.'] }, opts);
});

// ================= 21 reject-unsupported =================
const critique: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['looksLine', 'noBox', 'wrongReason', 'supported'] as const);
  const { O, L } = letters(R, 4);
  const [a, b, c, d] = L as [string, string, string, string];
  const who = WHO[(n * 7) % WHO.length]!;
  const s = rot(R);
  const t = int(R, 7, 29) * 5;
  if (v === 'wrongReason' && t === 90) return null;   // 180° − 90° = 90°: the wrong rule would give the right angle
  let f: Fan, claim: string, opts: Opt[];
  if (v === 'looksLine' || v === 'supported') {
    f = v === 'supported' ? fanFrom([a, b, c], s, [t, 180 - t], { O, lines: [[a, c]] })
      : { O, rays: [{ p: a, deg: s }, { p: b, deg: norm(s + t) }, { p: c, deg: norm(s + 180 + pick(R, [-3, 3])) }], lines: [], marks: [] };
    f.marks = [mk('g', a, b, { text: dg(t), col: 'second' }), mk('x', b, c, { text: '?', col: 'link' })];
    claim = `${m(b, O, c)} = 180° − ${t}° = ${180 - t}°`;
    opts = v === 'supported' ? [
      { t: `Supported: line ${a}${c} is drawn, so it is a linear pair`, ok: true, say: 'Yes: the drawn line is the evidence the step needs.' },
      { t: 'Not supported: no text says the angles add to 180°', mc: MC.rejectsGiven, say: 'A drawn, labeled line is evidence. You do not need the words too.' },
      { t: 'Not supported: you would have to measure it', mc: MC.measureDrawing, say: 'Never measure: the drawn line is enough.' },
    ] : [
      { t: `Not supported: no line through ${a}, ${O} and ${c} is drawn or stated`, ok: true, say: `Right: ${O}${a} and ${O}${c} are separate rays that only look aligned.` },
      { t: 'Supported: they look like a straight line', mc: MC.looks, say: 'Looks are not evidence. The step needs a drawn or stated line.' },
      { t: `Supported: ${ang(a, O, b)} and ${ang(b, O, c)} are adjacent`, mc: MC.noHypotheses, say: 'Adjacent angles do not have to add to 180°. A line through A, O, C is missing.' },
    ];
  } else if (v === 'noBox') {
    const p = int(R, 5, 13) * 5;
    f = fanFrom([a, b, c], s, [p, 90 - p], { O, marks: [mk('g', a, b, { text: dg(p), col: 'second' }), mk('x', b, c, { text: '?', col: 'link' })] });
    claim = `${m(b, O, c)} = 90° − ${p}° = ${90 - p}°`;
    opts = [
      { t: `Not supported: nothing marks ${ang(a, O, c)} as a right angle`, ok: true, say: 'Right: no box, no number, no words. It only looks square.' },
      { t: 'Supported: the corner looks square', mc: MC.looks, say: 'Looking square is not evidence. A right angle needs a box, a number or words.' },
      { t: 'Supported: the two angles are complementary', mc: MC.noHypotheses, say: 'That is what the step claims, not a reason for it. Nothing shows the 90°.' },
    ];
  } else {
    f = crossing([a, b, c, d], s, t, O);
    f.marks = [mk('g', a, b, { text: dg(t), col: 'second' }), mk('x', c, d, { text: '?', col: 'link' })];
    claim = `vertical angles, so ${m(c, O, d)} = 180° − ${t}° = ${180 - t}°`;
    opts = [
      { t: `Wrong: vertical angles are equal, so ${m(c, O, d)} = ${t}°`, ok: true, say: 'Right: the relationship is correct, but vertical angles are EQUAL.' },
      { t: 'Right: vertical angles add to 180°', mc: MC.equalAsSupp, say: 'A linear pair adds to 180°. Vertical angles are equal.' },
      { t: 'Right: the two lines are drawn, so any step is fine', mc: MC.noHypotheses, say: 'The evidence is fine, but the fact used is wrong.' },
    ];
  }
  return choiceItem(R, { id: `critique-${v}-${n}`, family: 'critique', prompt: `${who} writes: <b>${claim}</b>. Is the step supported by the figure?`, board: '', givens: [], work: [], picture: pic([f]),
    solution: ['Check the evidence (drawn lines, boxes, labels, words) AND the relationship it gives.', opts.find(o => o.ok)!.t + '.'] }, opts);
});

// ================= 22 vertical-general-argument =================
const argument: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['which', 'transfer', 'fill'] as const);
  const { O, L } = letters(R, 4);
  const [a, b, c, d] = L as [string, string, string, string];
  const t = int(R, 7, 16) * 5;
  const f = crossing([a, b, c, d], rot(R), t, O);
  f.marks = [mk('m1', a, b, { text: '1', col: 'second' }), mk('m2', b, c, { text: '2', col: 'plain' }), mk('m3', c, d, { text: '3', col: 'link' })];
  const who = WHO[(n * 5) % WHO.length]!;
  let opts: Opt[], prompt: string;
  if (v === 'which') {
    prompt = 'Which argument shows that vertical angles are ALWAYS equal?';
    opts = [
      { t: 'm∠1 + m∠2 = 180° and m∠2 + m∠3 = 180° (two linear pairs), so m∠1 = m∠3 for any crossing', ok: true, say: 'Yes: it uses only the two lines, so it works for every crossing.' },
      { t: `${who} measured five crossings and the angles matched every time`, mc: MC.examples, say: 'Five examples are not every crossing. A proof has to cover them all.' },
      { t: 'In this picture ∠1 and ∠3 look the same size', mc: MC.looks, say: 'Looks are not a proof, and one picture is not every crossing.' },
      { t: 'It only works for this drawing; every other crossing needs its own check', mc: MC.drawnCase, say: 'The two-linear-pairs argument never uses the size of ∠1, so it covers every crossing.' },
    ];
  } else if (v === 'transfer') {
    const t2 = int(R, 9, 30) * 5;
    prompt = `${who} proved m∠1 = m∠3 like this, on a figure with m∠1 = ${t}°: m∠1 + m∠2 = 180 and m∠2 + m∠3 = 180, so m∠1 = m∠3. Does that prove it for a crossing with m∠1 = ${t2 === t ? t + 5 : t2}°?`;
    opts = [
      { t: `Yes: the steps used only the two linear pairs, never ${t}°`, ok: true, say: 'Yes: a general argument covers every figure that fits its givens.' },
      { t: 'No: it has to be done again with the new angle', mc: MC.drawnCase, say: `The argument never used ${t}°. It works for any two crossing lines.` },
      { t: 'Only after measuring the new crossing', mc: MC.examples, say: 'Measuring checks one case. The argument already covers them all.' },
    ];
  } else {
    prompt = 'Fill in the last step: m∠1 + m∠2 = 180° and m∠2 + m∠3 = 180°, so …';
    opts = [
      { t: 'm∠1 = m∠3', ok: true, say: 'Yes: both sums are 180°, so take m∠2 away from both: m∠1 = m∠3.' },
      { t: 'm∠1 + m∠3 = 180°', mc: MC.equalAsSupp, say: '∠1 and ∠3 are across the crossing: they are equal, not a pair that makes 180°.' },
      { t: 'm∠1 = m∠2', mc: MC.suppEqual, say: '∠1 and ∠2 are a linear pair: they add to 180°, they are not equal.' },
      { t: 'm∠2 = 90°', say: 'Nothing says ∠2 is a right angle.' },
    ];
  }
  return choiceItem(R, { id: `argument-${v}-${n}`, family: 'argument', prompt, board: '', givens: [`\\text{lines } ${a}${c},\\ ${b}${d}`], work: ['m\\angle 1 + m\\angle 2 = 180', 'm\\angle 2 + m\\angle 3 = 180', 'm\\angle 1 = m\\angle 3'], picture: { ...pic([f]), solve: { focus: ['m1', 'm3'] } },
    solution: ['∠1 and ∠2 are a linear pair; so are ∠2 and ∠3: both sums are 180°.', 'Take m∠2 from both: m∠1 = m∠3. Nothing in it depends on the size, so it covers every crossing.'] }, opts);
});

// ================= 23 angle-expressions =================
const expr: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['supp', 'comp', 'vert', 'line3'] as const);
  const askX = R() < 0.5;
  const { O, L } = letters(R, 4);
  const [a, b, c, d] = L as [string, string, string, string];
  const k = int(R, 2, 5), x = int(R, 4, 30), q = int(R, -12, 20);
  const e = k * x + q;
  if (q === 0) return null;
  const ex = `(${exprText(k, q)})°`, exT = `(${exprText(k, q, '-')})`;
  const s = rot(R);
  // `rest` = what the expression angle must make up with: its partner (pair) or the other two parts (line3)
  let f: Fan, rest: number, T: number, rel: string, given: string, others = '';
  if (v === 'supp') {
    rest = 180 - e; T = 180; rel = 'a linear pair';
    if (e < 30 || rest < 30) return null;
    f = fanFrom([a, b, c], s, [e, rest], { O, lines: [[a, c]], marks: [mk('e', a, b, { text: ex, alt: dg(e), col: 'link' }), mk('o', b, c, { text: dg(rest), col: 'second' })] });
    given = `Line ${a}${c} is drawn.`;
  } else if (v === 'comp') {
    rest = 90 - e; T = 90; rel = 'two parts of a right angle';
    if (e < 25 || rest < 25) return null;
    f = fanFrom([a, b, c], s, [e, rest], { O, marks: [mk('w', a, c, { box: true, col: 'first' }), mk('e', a, b, { text: ex, alt: dg(e), col: 'link' }), mk('o', b, c, { text: dg(rest), col: 'second' })] });
    given = `The box marks ${ang(a, O, c)} as a right angle.`;
  } else if (v === 'vert') {
    rest = e; T = 0; rel = 'vertical angles';
    if (e < 30 || e > 150 || e === 90) return null;
    f = crossing([a, b, c, d], s, e, O);
    f.marks = [mk('e', a, b, { text: ex, alt: dg(e), col: 'link' }), mk('o', c, d, { text: dg(e), col: 'second' })];
    given = `Lines ${a}${c} and ${b}${d} cross at ${O}.`;
  } else {
    const p2 = int(R, 30, 70), p3 = 180 - e - p2;
    rest = p2 + p3; T = 180; rel = 'three angles on a line'; others = `${p2} + ${p3}`;
    if (e < 30 || p3 < 30) return null;
    f = fanFrom([a, b, c, d], s, [e, p2, p3], { O, lines: [[a, d]], marks: [mk('e', a, b, { text: ex, alt: dg(e), col: 'link' }), mk('p', b, c, { text: dg(p2), col: 'second' }), mk('o', c, d, { text: dg(p3), col: 'second' })] });
    given = `Line ${a}${d} is drawn.`;
  }
  const sg = (z: number) => `${z >= 0 ? '+' : '-'} ${Math.abs(z)}`, sgu = (z: number) => `${z >= 0 ? '+' : '−'} ${Math.abs(z)}`;
  const eqn = v === 'vert' ? `${exprText(k, q, '-')} = ${e}` : v === 'line3' ? `${exT} + ${others} = 180` : `${exT} + ${rest} = ${T}`;
  const work = [eqn, ...(v === 'vert' ? [] : [`${k}x ${sg(q)} = ${e}`]), `${k}x = ${e - q}`, `x = ${x}`, ...(askX ? [] : [`${tm(a, O, b)} = ${e}`])];
  const wrongs: Wrong[] = [];
  if (v === 'supp' || v === 'comp') {
    // the pair set EQUAL instead of adding to the total
    const xe = (rest - q) / k;
    if (askX && Number.isInteger(xe) && xe > 0) wrongs.push({ v: xe, mc: MC.suppEqual, say: `The two angles are ${rel}: they ADD to ${T}°, they are not equal.` });
    if (!askX) wrongs.push({ v: rest, mc: MC.suppEqual, say: `The two angles are ${rel}: they ADD to ${T}°, they are not equal.` });
  }
  if (v === 'vert') {
    const xs = (180 - e - q) / k;
    if (askX && Number.isInteger(xs) && xs > 0) wrongs.push({ v: xs, mc: MC.equalAsSupp, say: 'Vertical angles are equal: set the expression EQUAL to the other angle.' });
    if (!askX) wrongs.push({ v: 180 - e, mc: MC.equalAsSupp, say: 'Vertical angles are equal, not supplementary.' });
  }
  if (!askX) wrongs.push({ v: x, mc: MC.reportsX, say: `x = ${x}, but the question asks for the ANGLE: put x back in, ${k}(${x}) ${sgu(q)} = ${e}°.` });
  else wrongs.push({ v: e, say: `${e}° is the angle. The question asks for x: ${k}x ${sgu(q)} = ${e}, so x = ${x}.` });
  return numItem({ id: `expr-${v}-${n}`, family: 'expr', prompt: `${given} Write an equation and find ${S(askX ? 'x' : m(a, O, b))}.`, board: '', givens: [`${tm(a, O, b)} = ${exT}^\\circ`], work, picture: { ...pic([f]), solve: { reveal: ['e'], focus: ['e'] } },
    solution: [`The angles are ${rel}: ${eqn.replace(/-/g, '−')}.`, `${k}x ${sgu(q)} = ${e}, so ${k}x = ${e - q} and x = ${x}.`, ...(askX ? [] : [`${m(a, O, b)} = ${k}(${x}) ${sgu(q)} = ${e}°.`])] }, askX ? x : e,
  askX ? `Yes: x = ${x}, and the angle is ${e}°.` : `Yes: x = ${x}, so the angle is ${e}°.`, wrongs, `Write the equation from the relationship (${rel}) and solve it.`, askX ? '' : '°');
});

// ================= 24 combined-expression-angles =================
const exprCombined: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['linear', 'linear', 'around', 'right'] as const);
  const { O, L } = letters(R, 6);
  const [a, b, c, d, e, g] = L as [string, string, string, string, string, string];
  const s = rot(R);
  const askX = R() < 0.5;
  if (v === 'linear') {
    const k1 = int(R, 2, 5), k2 = int(R, 2, 5), x = int(R, 8, 30), q1 = int(R, -10, 25);
    const e1 = k1 * x + q1, rest = 180 - e1, q2 = rest - k2 * x;
    if (e1 < 30 || rest < 30 || q2 < -15 || q2 > 30 || q1 === 0 || q2 === 0 || k1 === k2) return null;
    const ex1 = exprText(k1, q1), ex2 = exprText(k2, q2);
    const f = fanFrom([a, b, c], s, [e1, rest], { O, lines: [[a, c]], marks: [mk('e1', a, b, { text: `(${ex1})°`, alt: dg(e1), col: 'link' }), mk('e2', b, c, { text: `(${ex2})°`, alt: dg(rest), col: 'second' })] });
    const t1 = exprText(k1, q1, '-'), t2 = exprText(k2, q2, '-');
    const ans = askX ? x : e1;
    const wrongs: Wrong[] = [];
    const xe = (q2 - q1) / (k1 - k2);
    if (askX && Number.isInteger(xe) && xe > 0) wrongs.push({ v: xe, mc: MC.suppEqual, say: 'A linear pair ADDS to 180°: the two expressions are not equal.' });
    const xs = (180 - Math.abs(q1) - Math.abs(q2)) / (k1 + k2);
    if (askX && (q1 < 0 || q2 < 0) && Number.isInteger(xs) && xs !== x) wrongs.push({ v: xs, mc: MC.minusLost, say: 'Keep each minus sign with its number when you combine.' });
    if (!askX) wrongs.push({ v: x, mc: MC.reportsX, say: `x = ${x}, but the question asks for ${m(a, O, b)}: ${k1}(${x}) ${q1 >= 0 ? '+' : '−'} ${Math.abs(q1)} = ${e1}°.` });
    const sumQ = q1 + q2;
    return numItem({ id: `exprCombined-linear-${n}`, family: 'exprCombined', prompt: `Line ${a}${c} is drawn. Write one equation and find ${S(askX ? 'x' : m(a, O, b))}.`, unit: askX ? '' : '°', board: '', givens: [`${tm(a, O, b)} = (${t1})^\\circ`, `${tm(b, O, c)} = (${t2})^\\circ`], work: [`(${t1}) + (${t2}) = 180`, `${k1 + k2}x ${sumQ >= 0 ? '+' : '-'} ${Math.abs(sumQ)} = 180`, `x = ${x}`, ...(askX ? [] : [`${tm(a, O, b)} = ${e1}`])], picture: { ...pic([f]), solve: { reveal: ['e1', 'e2'], focus: ['e1'] } },
      solution: ['A linear pair adds to 180°: (' + ex1 + ') + (' + ex2 + ') = 180.', `Collect: ${k1 + k2}x ${sumQ >= 0 ? '+' : '−'} ${Math.abs(sumQ)} = 180, so x = ${x}.`, ...(askX ? [] : [`${m(a, O, b)} = ${e1}°.`])] }, ans, askX ? `Yes: x = ${x}; the angles are ${e1}° and ${rest}°.` : `Yes: x = ${x}, so ${m(a, O, b)} = ${e1}°.`, wrongs, 'Add the two expressions, set the sum to 180, collect the x-terms.', askX ? '' : '°');
  }
  if (v === 'around') {
    const x = int(R, 40, 75);
    const k = pick(R, [3, 3, 4]);
    const known: number[] = [];
    let left = 360 - 2 * x;
    for (let i = 0; i < k - 1; i++) { const p = int(R, 45, Math.min(120, left - 45 * (k - 1 - i))); known.push(p); left -= p; }
    known.push(left);
    if (known.some(p => p < 45 || p > 150)) return null;
    const all = [...known, x, x];
    const lets = [a, b, c, d, e, g].slice(0, all.length);
    const marks = all.map((p, i) => mk(`p${i}`, lets[i]!, lets[(i + 1) % lets.length]!, i >= known.length ? { text: 'x', alt: dg(x), col: 'link' } : { text: dg(p), col: 'second' }));
    const f = fanFrom(lets, s, all.slice(0, -1), { O, marks });
    const S0 = known.reduce((u, w) => u + w, 0);
    return numItem({ id: `exprCombined-around-${n}`, family: 'exprCombined', prompt: `The angles fill the whole turn around ${O}; the two marked x are equal. Find ${S('x')}.`, unit: '°', board: '', givens: [], work: [`${known.join(' + ')} + x + x = 360`, `2x + ${S0} = 360`, `2x = ${360 - S0}`, `x = ${x}`], picture: { ...pic([f]), solve: { reveal: [`p${known.length}`, `p${known.length + 1}`], focus: [`p${known.length}`, `p${known.length + 1}`] } },
      solution: ['Around a point: everything adds to 360°.', `${known.join(' + ')} + x + x = 360: 2x + ${S0} = 360, 2x = ${360 - S0}, x = ${x}°.`] }, x, `Yes: 2x = ${360 - S0}, x = ${x}.`,
    [{ v: 360 - S0, mc: MC.collapsed, say: `There are TWO x’s: x + x = 2x. So 2x = ${360 - S0}.` }, ...((180 - S0) % 2 === 0 && 180 - S0 > 0 ? [{ v: (180 - S0) / 2, mc: MC.straightFull, say: 'Around a point is 360°, not 180°.' }] : [])], 'Write x + x as 2x, then solve 2x + (the known angles) = 360.');
  }
  // right: (k1 x + q) and k2 x fill a marked right angle
  const k1 = int(R, 1, 3), k2 = int(R, 1, 3), q = int(R, -10, 15);
  if ((90 - q) % (k1 + k2) !== 0 || q === 0) return null;
  const x = (90 - q) / (k1 + k2), e1 = k1 * x + q, e2 = k2 * x;
  if (e1 < 25 || e2 < 25) return null;
  const ex1 = exprText(k1, q), ex2 = exprText(k2, 0);
  const f = fanFrom([a, b, c], s, [e1, e2], { O, marks: [mk('w', a, c, { box: true, col: 'first' }), mk('e1', a, b, { text: `(${ex1})°`, alt: dg(e1), col: 'link' }), mk('e2', b, c, { text: `${ex2}°`, alt: dg(e2), col: 'link' })] });
  const ans = askX ? x : e2;
  const wrongs: Wrong[] = [];
  if (!askX && e2 !== x) wrongs.push({ v: x, mc: MC.reportsX, say: `x = ${x}, but ${m(b, O, c)} = ${ex2} = ${e2}°.` });
  const xs = (90 - Math.abs(q)) / (k1 + k2);
  if (askX && q < 0 && Number.isInteger(xs)) wrongs.push({ v: xs, mc: MC.minusLost, say: 'Keep the minus sign with its number.' });
  if (askX && (180 - q) % (k1 + k2) === 0) wrongs.push({ v: (180 - q) / (k1 + k2), mc: MC.whole90or180, say: 'The box marks a right angle: the parts add to 90°, not 180°.' });
  return numItem({ id: `exprCombined-right-${n}`, family: 'exprCombined', prompt: `The box marks ${A(ang(a, O, c))} as a right angle. Find ${S(askX ? 'x' : m(b, O, c))}.`, unit: askX ? '' : '°', board: '', givens: [`${tm(a, O, b)} = (${exprText(k1, q, '-')})^\\circ`, `${tm(b, O, c)} = ${ex2}^\\circ`], work: [`(${exprText(k1, q, '-')}) + ${ex2} = 90`, `${k1 + k2}x ${q >= 0 ? '+' : '-'} ${Math.abs(q)} = 90`, `x = ${x}`, ...(askX ? [] : [`${tm(b, O, c)} = ${e2}`])], picture: { ...pic([f]), solve: { reveal: ['e1', 'e2'], focus: ['e2'] } },
    solution: ['The two parts fill the right angle: they add to 90°.', `${k1 + k2}x ${q >= 0 ? '+' : '−'} ${Math.abs(q)} = 90, so x = ${x}.`, ...(askX ? [] : [`${m(b, O, c)} = ${ex2} = ${e2}°.`])] }, ans, askX ? `Yes: x = ${x}.` : `Yes: x = ${x}, so the angle is ${e2}°.`, wrongs, 'Add the parts, set the sum to 90, collect the x-terms.', askX ? '' : '°');
});

// ================= 25 model-context =================
const context: Gen = (R, n) => fitted(() => {
  const v = pick(R, ['streets', 'streets', 'scissors', 'brace', 'ramp', 'ladder', 'assume'] as const);
  const s = rot(R);
  if (v === 'streets' || v === 'assume') {
    const t = int(R, 30, 150);
    if (t === 90) return null;
    const f = crossing(['A', 'B', 'C', 'D'], s, t, 'O');
    const across = R() < 0.5;
    f.marks = [mk('g', 'A', 'B', { text: dg(t), col: 'second' }), across ? mk('x', 'C', 'D', { text: '?', alt: dg(t), col: 'link' }) : mk('x', 'B', 'C', { text: '?', alt: dg(180 - t), col: 'link' })];
    if (v === 'assume') {
      const opts: Opt[] = [
        { t: 'Both streets are straight lines', ok: true, say: 'Yes: then they are two crossing lines, and the angle facts apply.' },
        { t: 'The map is to scale, so you can measure the angle', mc: MC.looks, say: 'Measuring a map is not reasoning. The straight streets give the facts.' },
        { t: 'Both streets are the same width', say: 'Width does not change an angle.' },
      ];
      return choiceItem(R, { id: `context-assume-${n}`, family: 'context', prompt: `Main St (A to C) and Oak Ave (B to D) cross at O. To say the corner across from the ${t}° corner is also ${t}°, what must you assume?`, board: '', givens: [], work: [], picture: pic([f]), road: true,
        solution: ['The vertical-angle fact needs two straight lines crossing.', 'So you assume (or are told) that both streets are straight.'] }, opts);
    }
    return numItem({ id: `context-streets-${n}`, family: 'context', prompt: `Main St (A to C) and Oak Ave (B to D) are straight and cross at O. The corner angle is ${B('m∠AOB = ' + dg(t))}. Find the angle at the ${across ? 'corner across the intersection, ∠COD' : 'next corner along Main St, ∠BOC'}.`, board: '', givens: [`m\\angle AOB = ${td(t)}`], work: across ? [`m\\angle COD = ${t}\\ \\text{(vertical)}`] : [`${t} + x = 180`, `x = ${180 - t}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x'] } }, road: true,
      solution: ['Draw the streets as two lines; mark the given angle.', across ? `Across the intersection: vertical angles, ${t}°.` : `Next to it on straight Main St: a linear pair, 180 − ${t} = ${180 - t}°.`] }, across ? t : 180 - t, 'Yes.',
    across ? [{ v: 180 - t, mc: MC.equalAsSupp, say: `That is the corner NEXT door. Across the intersection the angle is equal: ${t}°.` }] : [{ v: t, mc: MC.wrongAngle, say: `${t}° is the corner across the intersection. The next corner on Main St makes 180° with it.` }], across ? 'Across: vertical angles are equal.' : 'Next door on a straight street: they add to 180°.');
  }
  if (v === 'scissors') {
    const t = int(R, 25, 70);
    const f = crossing(['A', 'B', 'C', 'D'], norm(-t / 2 + pick(R, [0, 90])), t, 'O');
    f.marks = [mk('g', 'A', 'B', { text: dg(t), col: 'second' }), mk('x', 'C', 'D', { text: '?', alt: dg(t), col: 'link' })];
    return numItem({ id: `context-scissors-${n}`, family: 'context', prompt: `The blades of open scissors cross at the screw O like two straight lines (A to C and B to D). The blades open to ${B(dg(t))}. What angle do the handles open to?`, board: '', givens: [`m\\angle AOB = ${td(t)}`], work: [`x = ${t}\\ \\text{(vertical)}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x'] } },
      solution: ['Blades and handles are the two halves of two straight lines crossing at the screw.', `The handle angle is across from the blade angle: vertical, so ${t}°.`] }, t, `Yes: vertical angles, ${t}°.`,
    [{ v: 180 - t, mc: MC.equalAsSupp, say: 'The handles open ACROSS from the blades: vertical angles are equal.' }, { v: 90 - t, mc: MC.swapped, say: 'Nothing here is a right angle; across the screw the angle is equal.' }], 'The handle angle is across the screw from the blade angle.');
  }
  if (v === 'brace' || v === 'ladder') {
    const t = int(R, 25, 65);
    const f = fanFrom(['A', 'B', 'C'], v === 'ladder' ? 0 : 270, [t, 90 - t], { O: 'O', marks: [mk('w', 'A', 'C', { box: true, col: 'first' }), mk('g', 'A', 'B', { text: dg(t), col: 'second' }), mk('x', 'B', 'C', { text: '?', alt: dg(90 - t), col: 'link' })] });
    const nm = v === 'ladder' ? ['ground', 'ladder', 'wall'] : ['top', 'brace', 'side'];
    f.rays.forEach((r, i) => { r.name = nm[i]; });
    const prompt = v === 'brace' ? `The corner of a picture frame is a right angle (the box). A brace makes ${B(dg(t))} with the top side. What angle does it make with the other side?`
      : `A wall stands straight up from flat ground (the box). A ladder leans on it, making ${B(dg(t))} with the ground. What angle does the ladder make with the wall?`;
    return numItem({ id: `context-${v}-${n}`, family: 'context', prompt, board: '', givens: [`\\text{corner: }\\ ${td(90)}`, `\\text{${v === 'ladder' ? 'ladder, ground' : 'brace, top'}: }\\ ${td(t)}`], work: [`${t} + x = 90`, `x = ${90 - t}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x'] } },
      solution: ['The two angles fill the right angle: they add to 90°.', `${t} + x = 90, x = ${90 - t}°.`] }, 90 - t, `Yes: ${t} + ${90 - t} = 90.`,
    [{ v: 180 - t, mc: MC.swapped, say: 'The corner is a right angle: the two parts add to 90°, not 180°.' }, { v: t, mc: MC.wrongAngle, say: `${t}° is the angle you were given. The other angle fills the rest of the right angle.` }], 'The two parts fill a right angle.');
  }
  const t = int(R, 12, 35);
  const f = fanFrom(['A', 'B', 'C'], 0, [t, 180 - t], { O: 'O', lines: [['A', 'C']], marks: [mk('g', 'A', 'B', { text: dg(t), col: 'second' }), mk('x', 'B', 'C', { text: '?', alt: dg(180 - t), col: 'link' })] });
  f.rays.forEach((r, i) => { r.name = ['ground', 'ramp', 'ground'][i]; });
  return numItem({ id: `context-ramp-${n}`, family: 'context', prompt: `A skate ramp leaves flat ground at O, at ${B(dg(t))}. What is the angle between the ramp and the ground on the other side of O?`, board: '', givens: [`\\text{ground: a straight line}`, `\\text{ramp, ground: }\\ ${td(t)}`], work: [`${t} + x = 180`, `x = ${180 - t}`], picture: { ...pic([f]), solve: { reveal: ['x'], focus: ['x'] } },
    solution: ['The ground is a straight line through O, so the two angles are a linear pair.', `${t} + x = 180, x = ${180 - t}°.`] }, 180 - t, `Yes: ${t} + ${180 - t} = 180.`,
  [{ v: 90 - t, mc: MC.swapped, say: 'The ground is a straight line: the two angles add to 180°, not 90°.' }, { v: t, mc: MC.wrongAngle, say: `${t}° is the ramp angle you were given. The other side makes 180° with it.` }], 'The flat ground is a straight line: the two angles add to 180°.');
});

export const GENS: Record<FamilyId, Gen> = {
  rays, names, evidence, adjacent, addParts, armLength, pairName, linearPair, vertical, equalPick, allNames, findPair,
  findVertical, missingPart, lineParts, aroundPoint, mixed, chain, reason, critique, argument, expr, exprCombined, context,
};
