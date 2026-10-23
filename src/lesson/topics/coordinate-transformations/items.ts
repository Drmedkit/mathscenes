// items.ts: exercise families for "transformations in the coordinate plane: reflect and translate" (grade 8, 8.G.A.1,
// 8.G.A.3), generated from templates, checked exactly, every wrong answer classified against the misconception
// catalogue (math-curriculum-essentials/misconceptions.json ids). A generator gets the SUB-GOAL it practises (plan.ts)
// and uses that sub-goal's cases from the topic JSON. Pure: no DOM, no canvas; a seeded rng.
// PROBES records, per item, typical wrong responses and the id they must get (tests).
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import type { CGFocus, CGParams } from './CoordGrid';
import { type Move, type V, angleAt, apply, applyAll, area2, centroid, collinear, dist, fmt, orient, pair, pairTex, ruleText, same, slideWords, tn } from './coordMaths';
import { endOnChoice } from '../../runtime/explain';

export type FamilyId = 'isSlide' | 'slideVector' | 'moveOne' | 'whichChanges' | 'reflectPlot' | 'fixedPoint' | 'reflectCalc' | 'axisRule'
  | 'matchPrime' | 'primeMeaning' | 'writeRule' | 'ruleMeaning' | 'readRule' | 'translateCalc' | 'signedStep' | 'mixedPoint'
  | 'polygonVertex' | 'polygonCheck' | 'nameMove' | 'straightImage' | 'sideLength' | 'lengthKept' | 'angleImage' | 'angleKept'
  | 'parallelKept' | 'orientation' | 'checkImage' | 'contextMove' | 'contextCheck' | 'rationalPoint' | 'rationalChoice'
  | 'reflectLine' | 'rigidOrNot';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  isSlide: 'Is it a slide?', slideVector: 'Describe the slide', moveOne: 'Move one point', whichChanges: 'Which coordinate changes?',
  reflectPlot: 'Reflect a point', fixedPoint: 'Which point stays put?', reflectCalc: 'Reflect without a grid', axisRule: 'Pick the reflection rule',
  matchPrime: 'Find the matching image', primeMeaning: 'What A′ means', writeRule: 'Words to arrow rule', ruleMeaning: 'Arrow rule to words',
  readRule: 'Use an arrow rule', translateCalc: 'Slide by calculating', signedStep: 'Across zero', mixedPoint: 'Slide or reflect',
  polygonVertex: 'One vertex of the image', polygonCheck: 'The whole image', nameMove: 'Name the move', straightImage: 'Points on a line',
  sideLength: 'Length of a side', lengthKept: 'Do lengths change?', angleImage: 'Size of an angle', angleKept: 'Do angles change?',
  parallelKept: 'Parallel sides', orientation: 'Which way round?', checkImage: 'Is this the image?', contextMove: 'On a screen or a map',
  contextCheck: 'Close enough?', rationalPoint: 'Halves and decimals', rationalChoice: 'Between grid points', reflectLine: 'Other mirror lines',
  rigidOrNot: 'Slide, reflection, or neither?',
};

// ---------- pictures ----------
/** what the page draws for an item: a CoordGrid, the steps shown at the start, the steps of the worked solution */
export interface CTPic { p: CGParams; at: string[]; solve: string[]; focus?: CGFocus; solved?: CGFocus }
export interface CTItem extends Item { family: FamilyId; pic?: CTPic; hero?: string }
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, r: Response, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r, mc }); PROBES.set(it, l); };

// ---------- misconception ids (math-curriculum-essentials/misconceptions.json) ----------
export const MC = {
  diagonal: 'mc.coordinate-geometry.diagonal-square-as-unit-length',
  movesDiff: 'mc.transformations.translation-vertices-move-differently',
  leftNeg: 'mc.integers.left-move-forces-negative-coordinate',
  wrongCoord: 'mc.transformations.translation-shift-to-wrong-coordinate',
  named: 'mc.transformations.reflect-negates-named-coordinate',
  diag: 'mc.transformations.axis-reflection-moves-point-diagonally',
  jumps: 'mc.transformations.reflection-jumps-whole-figure',
  both: 'mc.transformations.reflect-negates-both-coordinates',
  minus: 'mc.integers.minus-sign-means-negative',
  primeOrder: 'mc.transformations.prime-labels-not-tied-to-correspondence',
  primeFree: 'mc.transformations.primed-point-unrelated-to-original',
  leftRight: 'mc.coordinate-geometry.left-right-confused-on-grid',
  shiftBoth: 'mc.transformations.translation-shift-to-both-coordinates',
  arrowEq: 'mc.transformations.arrow-read-as-equals',
  addMag: 'mc.integers.add-magnitudes-mixed-signs',
  signRule: 'mc.transformations.reflection-sign-rule-without-axis-check',
  anchor: 'mc.transformations.transforms-one-anchor-sketches-rest',
  order: 'mc.coordinate-geometry.vertex-order-ignored',
  asSlide: 'mc.transformations.reflection-as-slide',
  reversed: 'mc.integers.translation-direction-reversed',
  oppSides: 'mc.transformations.opposite-sides-suffice-for-reflection',
  onePoint: 'mc.transformations.one-point-checked-for-whole-figure',
  interior: 'mc.transformations.omits-requested-interior-point-check',
  bend: 'mc.transformations.segment-image-may-bend',
  oneSide: 'mc.transformations.one-matching-side-proves-congruence',
  flipNotCong: 'mc.transformations.turned-or-flipped-copy-not-congruent',
  axisOnly: 'mc.transformations.preserves-only-axis-aligned-lengths',
  armLength: 'mc.angles.angle-size-from-arm-length',
  facesWay: 'mc.transformations.measures-change-when-figure-faces-another-way',
  lengthsOnly: 'mc.transformations.side-lengths-alone-verify-motion',
  parallelLost: 'mc.transformations.direction-change-destroys-parallelism',
  orientMeasures: 'mc.transformations.orientation-reversal-changes-measures',
  anyCopy: 'mc.transformations.reflection-equals-any-congruent-copy',
  approx: 'mc.transformations.context-permits-approximate-image',
  fracMag: 'mc.transformations.axis-reflection-changes-fraction-magnitude',
  gridOnly: 'mc.transformations.transforms-only-grid-points',
  axisRule: 'mc.transformations.axis-rule-for-other-lines-or-centers',
  anyMove: 'mc.transformations.calls-any-move-a-translation',
  pictureOnly: 'mc.transformations.transformation-moves-picture-not-points',
} as const;

// ---------- small helpers ----------
const NAMES3 = [['A', 'B', 'C'], ['P', 'Q', 'R'], ['D', 'E', 'F'], ['J', 'K', 'L'], ['R', 'S', 'T'], ['U', 'V', 'W'], ['G', 'H', 'J']] as const;
const NAMES4 = [['A', 'B', 'C', 'D'], ['P', 'Q', 'R', 'S'], ['J', 'K', 'L', 'M'], ['E', 'F', 'G', 'H']] as const;
const ONE = ['A', 'B', 'P', 'Q', 'K', 'M', 'N', 'T', 'R', 'S'] as const;
const LIM = 9;
const inLim = (P: readonly V[], lim = LIM) => P.every(p => Math.abs(p[0]) <= lim && Math.abs(p[1]) <= lim);
const nz = (R: () => number, lo: number, hi: number) => { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } };
const pr = (s: string | undefined) => `${s ?? ''}′`;
/** HTML spans in the role colours */
const A = (s: string) => `<b class="a">${s}</b>`, Bm = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;
const plus = (v: number) => (v >= 0 ? `+ ${fmt(v)}` : `− ${fmt(-v)}`);
const signed = (v: number) => (v > 0 ? `+${fmt(v)}` : fmt(v));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const numOf = (r: Response): number | null => (r.kind === 'num' && Number.isFinite(r.v) ? r.v : null);
const r6 = (v: number) => { const r = Math.round(v * 1e6) / 1e6; return Object.is(r, -0) ? 0 : r; };

/** an asymmetric triangle with whole-number corners in a box: no two sides equal, not too thin */
function triangle(R: () => number, xr: [number, number], yr: [number, number]): V[] {
  for (;;) {
    const P: V[] = [0, 1, 2].map(() => [int(R, xr[0], xr[1]), int(R, yr[0], yr[1])] as V);
    const a2 = Math.abs(area2(P));
    if (a2 < 6) continue;
    const L = [dist(P[0]!, P[1]!), dist(P[1]!, P[2]!), dist(P[2]!, P[0]!)];
    if (Math.abs(L[0]! - L[1]!) < 1e-9 || Math.abs(L[1]! - L[2]!) < 1e-9 || Math.abs(L[0]! - L[2]!) < 1e-9) continue;
    if (Math.min(...L) < 2) continue;
    // not too thin: every angle at least 20 degrees
    if ([0, 1, 2].some(i => angleAt(P, i) < 20)) continue;
    return P;
  }
}
/** an asymmetric convex quadrilateral (counterclockwise order) */
function quad(R: () => number, xr: [number, number], yr: [number, number]): V[] {
  for (;;) {
    const P: V[] = [0, 1, 2, 3].map(() => [int(R, xr[0], xr[1]), int(R, yr[0], yr[1])] as V);
    const c = centroid(P);
    P.sort((a, b) => Math.atan2(a[1] - c[1], a[0] - c[0]) - Math.atan2(b[1] - c[1], b[0] - c[0]));
    let ok = true;
    for (let i = 0; i < 4; i++) {
      const a = P[i]!, b = P[(i + 1) % 4]!, d = P[(i + 2) % 4]!;
      const cr = (b[0] - a[0]) * (d[1] - b[1]) - (b[1] - a[1]) * (d[0] - b[0]);
      if (cr <= 0) ok = false;
      if (dist(a, b) < 2) ok = false;
    }
    if (!ok || Math.abs(area2(P)) < 16) continue;
    const L = [0, 1, 2, 3].map(i => dist(P[i]!, P[(i + 1) % 4]!));
    if (new Set(L.map(l => l.toFixed(6))).size < 4) continue;
    return P;
  }
}
const randSlide = (R: () => number, lo = 1, hi = 5, oneZero = false): Move => {
  if (oneZero) return R() < 0.5 ? { kind: 'slide', dx: nz(R, -hi, hi), dy: 0 } : { kind: 'slide', dx: 0, dy: nz(R, -hi, hi) };
  let dx = int(R, lo, hi), dy = int(R, lo, hi);
  if (R() < 0.5) dx = -dx; if (R() < 0.5) dy = -dy;
  return { kind: 'slide', dx, dy };
};
const randAxis = (R: () => number): Move => ({ kind: 'reflect', axis: R() < 0.5 ? 'x' : 'y' });
/** the move in words (HTML, teal) */
function moveHtml(m: Move): string {
  if (m.kind === 'slide') return `slides ${Bm(slideWords(m.dx, m.dy))}`;
  if (m.kind === 'reflect') return `is reflected across the ${Bm(m.axis + '-axis')}`;
  if (m.kind === 'mirror') return `is reflected across the line ${Bm(`${m.line} = ${fmt(m.k)}`)}`;
  return `is moved by ${Bm(ruleText(m))}`;
}
/** the move on the board, TeX (' | ' starts a new line) */
function moveTex(m: Move): string {
  if (m.kind === 'slide') return `\\text{${slideWords(m.dx, m.dy, ', ')}}`;
  if (m.kind === 'reflect') return `\\text{reflect across} | \\text{the }${m.axis}\\text{-axis}`;
  if (m.kind === 'mirror') return `\\text{reflect across} | ${m.line}=${tn(m.k)}`;
  return `(x,\\,y)\\to(${m.kind === 'stretch' ? `${m.a}x` : 'x'},\\,${m.kind === 'shear' ? 'y+x' : 'y'})`;
}
const ptTex = (name: string, p: V) => `${name}${pairTex(p)}`;
const askTex = (name: string) => `${name}'=(\\,?\\,,\\,?\\,)`;

// ---------- worked solutions ----------
function solvePoint(name: string, p: V, m: Move): string[] {
  const q = apply(m, p), [x, y] = p;
  if (m.kind === 'slide') {
    const out = [`${cap(slideWords(m.dx, m.dy))}: ${m.dx ? `x changes by ${signed(m.dx)}` : 'x stays'}, ${m.dy ? `y changes by ${signed(m.dy)}` : 'y stays'}.`];
    if (m.dx) out.push(`x: ${fmt(x)} ${plus(m.dx)} = ${fmt(q[0])}`);
    if (m.dy) out.push(`y: ${fmt(y)} ${plus(m.dy)} = ${fmt(q[1])}`);
    out.push(`So ${S(`${pr(name)} = ${pair(q)}`)}.`);
    return out;
  }
  if (m.kind === 'reflect') {
    const on = m.axis === 'x' ? y === 0 : x === 0;
    if (on) return [`${name} is on the ${m.axis}-axis, the mirror itself, so it stays put.`, `${S(`${pr(name)} = ${name} = ${pair(q)}`)}.`];
    return m.axis === 'x'
      ? [`Across the x-axis a point moves straight up or down, so x stays ${fmt(x)}.`, `y becomes its opposite: ${fmt(y)} → ${fmt(-y)}.`, `So ${S(`${pr(name)} = ${pair(q)}`)}.`]
      : [`Across the y-axis a point moves straight across, so y stays ${fmt(y)}.`, `x becomes its opposite: ${fmt(x)} → ${fmt(-x)}.`, `So ${S(`${pr(name)} = ${pair(q)}`)}.`];
  }
  if (m.kind === 'mirror') {
    const c = m.line === 'x' ? x : y, d = r6(Math.abs(c - m.k));
    if (d === 0) return [`${name} is on the mirror line ${m.line} = ${fmt(m.k)}, so it stays put.`, `${S(`${pr(name)} = ${pair(q)}`)}.`];
    const side = m.line === 'x' ? (c < m.k ? 'left' : 'right') : (c < m.k ? 'below' : 'above');
    const other = m.line === 'x' ? (c < m.k ? 'right' : 'left') : (c < m.k ? 'above' : 'below');
    return [`${name} is ${fmt(d)} ${side === 'left' || side === 'right' ? side + ' of' : side} the line ${m.line} = ${fmt(m.k)}.`,
      `${pr(name)} is ${fmt(d)} ${other === 'left' || other === 'right' ? other + ' of' : other} it: ${m.line} = ${fmt(m.k)} ${c < m.k ? '+' : '−'} ${fmt(d)} = ${fmt(m.line === 'x' ? q[0] : q[1])}. The other coordinate stays.`,
      `So ${S(`${pr(name)} = ${pair(q)}`)}.`];
  }
  return [`Use the rule ${ruleText(m)} on ${name}${pair(p)}.`, `So ${S(`${pr(name)} = ${pair(q)}`)}.`];
}

// ---------- classifying a wrong image of one point ----------
interface Cand { r: V; mc?: string; say: string }
function wrongCands(name: string, p: V, m: Move, mixed: boolean): Cand[] {
  const [x, y] = p, q = apply(m, p), out: Cand[] = [];
  const add = (r: V, mc: string | undefined, say: string) => { if (!same(r, q) && !out.some(c => same(c.r, r))) out.push({ r: [r6(r[0]), r6(r[1])], mc, say }); };
  if (m.kind === 'slide') {
    const { dx, dy } = m;
    add([x + dy, y + dx], MC.wrongCoord, `Left and right change x; up and down change y. ${cap(slideWords(dx, dy))}: x ${dx ? plus(dx) : 'stays'}, y ${dy ? plus(dy) : 'stays'}.`);
    if (dx === 0 || dy === 0) { const d = dx || dy; add([x + d, y + d], MC.shiftBoth, `A move ${dx ? 'left or right' : 'up or down'} changes only ${dx ? 'x' : 'y'}. The other coordinate stays.`); }
    else add([x + dx + dy, y + dx + dy], MC.shiftBoth, `Each part of the move changes only its own coordinate: x ${plus(dx)}, y ${plus(dy)}.`);
    if (dx !== 0) add([x - dx, y + dy], MC.leftRight, `${dx > 0 ? 'Right adds to x' : 'Left subtracts from x'}: ${fmt(x)} ${plus(dx)} = ${fmt(q[0])}.`);
    if (x !== 0 && dx !== 0 && Math.sign(x) !== Math.sign(dx)) add([-(Math.abs(x) + Math.abs(dx)), q[1]], MC.addMag, `${fmt(x)} ${plus(dx)}: start at ${fmt(x)} and go ${fmt(Math.abs(dx))} ${dx > 0 ? 'right' : 'left'}. You land on ${fmt(q[0])}.`);
    if (y !== 0 && dy !== 0 && Math.sign(y) !== Math.sign(dy)) add([q[0], -(Math.abs(y) + Math.abs(dy))], MC.addMag, `${fmt(y)} ${plus(dy)}: start at ${fmt(y)} and go ${fmt(Math.abs(dy))} ${dy > 0 ? 'up' : 'down'}. You land on ${fmt(q[1])}.`);
    if (dx < 0 && q[0] > 0) add([-q[0], q[1]], MC.leftNeg, `Moving left makes x smaller, not always negative: ${fmt(x)} ${plus(dx)} = ${fmt(q[0])}, still right of the y-axis.`);
    if (dy !== 0) add([q[0], y - dy], undefined, `${dy > 0 ? 'Up adds to y' : 'Down subtracts from y'}: ${fmt(y)} ${plus(dy)} = ${fmt(q[1])}.`);
    add(p, undefined, `${name} moves: ${pr(name)} is ${slideWords(dx, dy)} from ${name}.`);
    return out;
  }
  if (m.kind === 'reflect') {
    const ax = m.axis, on = ax === 'x' ? y === 0 : x === 0;
    if (on) {
      add([-x, -y], MC.jumps, `${name} is ON the mirror, the ${ax}-axis. A point on the mirror stays where it is.`);
      add(ax === 'x' ? [-x, y] : [x, -y], MC.jumps, `${name} is on the ${ax}-axis, the mirror itself, so it does not move.`);
      return out;
    }
    const named: V = ax === 'x' ? [-x, y] : [x, -y];
    add(named, mixed ? MC.signRule : MC.named, mixed
      ? `That is the rule for the ${ax === 'x' ? 'y' : 'x'}-axis. Check the axis first: across the ${ax}-axis, ${ax === 'x' ? 'y' : 'x'} changes.`
      : `Across the ${ax}-axis the point moves ${ax === 'x' ? 'up or down' : 'sideways'}, so ${ax === 'x' ? 'y' : 'x'} changes, not ${ax}.`);
    add([-x, -y], MC.both, `Only one coordinate changes. Changing both signs is a half turn around the origin. ${ax === 'x' ? 'x' : 'y'} stays ${fmt(ax === 'x' ? x : y)}.`);
    const c = ax === 'x' ? y : x;
    if (c < 0) add(p, MC.minus, `The opposite of ${fmt(c)} is ${fmt(-c)}, a positive number. ${pr(name)} is on the other side of the ${ax}-axis.`);
    else add(p, undefined, `${pr(name)} is on the other side of the ${ax}-axis, the same distance away.`);
    // a diagonal slip: the swapped pair (a mirror along y = -x)
    add([-y, -x], MC.diag, `${pr(name)} is straight ${ax === 'x' ? 'above or below' : 'across from'} ${name}: ${ax === 'x' ? 'x' : 'y'} stays ${fmt(ax === 'x' ? x : y)}.`);
    return out;
  }
  if (m.kind === 'mirror') {
    const c = m.line === 'x' ? x : y;
    if (c === m.k) {
      add(m.line === 'x' ? [-x, y] : [x, -y], MC.jumps, `${name} is ON the mirror line ${m.line} = ${fmt(m.k)}, so it stays put.`);
      return out;
    }
    add(m.line === 'x' ? [-x, y] : [x, -y], MC.axisRule, `The opposite-sign rule only works for the axes. Measure from the line ${m.line} = ${fmt(m.k)}: ${name} is ${fmt(r6(Math.abs(c - m.k)))} away, so ${pr(name)} is ${fmt(r6(Math.abs(c - m.k)))} away on the other side.`);
    add([-x, -y], MC.axisRule, `Only one coordinate changes, and the mirror is the line ${m.line} = ${fmt(m.k)}, not an axis.`);
    return out;
  }
  return out;
}
const dirOf = (m: Move): 'x' | 'y' | 'both' => (m.kind === 'reflect' ? (m.axis === 'x' ? 'y' : 'x') : m.kind === 'mirror' ? m.line : m.kind === 'slide' ? (m.dx && m.dy ? 'both' : m.dx ? 'x' : 'y') : 'both');

interface PointSpec { id: string; family: FamilyId; prompt: string; board: string; name: string; p: V; m: Move; mixed?: boolean; pic?: CTPic; extra?: Cand[]; okSay?: string }
function pointItem(s: PointSpec): CTItem {
  const q = apply(s.m, s.p);
  const cands = [...(s.extra ?? []).filter(c => !same(c.r, q)), ...wrongCands(s.name, s.p, s.m, !!s.mixed)];
  const reflection = s.m.kind === 'reflect' || s.m.kind === 'mirror';
  const it: CTItem = {
    id: s.id, family: s.family, prompt: s.prompt, board: s.board, input: 'pair', pairLead: `${pr(s.name)} = (`, pairOp: ',', pairTail: ')',
    pic: s.pic, hero: `${s.name}'=${pairTex(q)}`, solution: solvePoint(s.name, s.p, s.m), answer: { kind: 'pair', x: q[0], y: q[1] },
    check: r => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type a number in each box.' };
      const v: V = [r.x, r.y];
      if (same(v, q)) return { ok: true, say: s.okSay ?? `Yes: ${pr(s.name)} = ${pair(q)}.` };
      const c = cands.find(c2 => same(c2.r, v));
      if (c) return { ok: false, mc: c.mc, say: c.say };
      // an axis reflection that changes the coordinate along the mirror: a diagonal move
      if (s.m.kind === 'reflect') {
        const keep = s.m.axis === 'x' ? 0 : 1, on = s.m.axis === 'x' ? s.p[1] === 0 : s.p[0] === 0;
        if (!on && Math.abs(v[keep] - s.p[keep]) > 1e-9) return { ok: false, mc: MC.diag, say: `A reflection across the ${s.m.axis}-axis moves the point straight ${s.m.axis === 'x' ? 'up or down' : 'across'}: ${s.m.axis === 'x' ? 'x' : 'y'} stays ${fmt(s.p[keep])}.` };
      }
      // a point on the mirror line stays put: any move of it is the "everything jumps" slip
      if (reflection && same(q, s.p)) return { ok: false, mc: MC.jumps, say: `${s.name} is on the mirror line itself, so it stays put: ${pr(s.name)} = ${pair(q)}.` };
      const d = dirOf(s.m);
      return { ok: false, say: `Not quite. ${reflection ? 'Fold' : 'Slide'} ${s.name}${pair(s.p)}: ${d === 'both' ? 'both coordinates change' : `only ${d} changes`}. ${pr(s.name)} = ${pair(q)}.` };
    },
  };
  const seen: V[] = [q];
  for (const c of cands) { if (seen.some(z => same(z, c.r))) continue; seen.push(c.r); if (c.mc) probe(it, { kind: 'pair', x: c.r[0], y: c.r[1] }, c.mc); }
  return it;
}

// ---------- choice items ----------
interface Opt { t: string; ok: boolean; mc?: string; say: string }
function choices(R: () => number, opts: Opt[]): { choices: string[]; check: (r: Response) => Verdict; answer: Response; right: string; wrong: { i: number; mc: string }[] } {
  const o = shuffle(R, [...opts]);
  const right = o.findIndex(x => x.ok);
  return {
    choices: o.map(x => x.t),
    check: r => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const x = o[r.i]!;
      return { ok: x.ok, mc: x.mc, say: x.say };
    },
    answer: { kind: 'choice', i: right }, right: o[right]!.t,
    wrong: o.map((x, i) => ({ i, mc: x.mc ?? '' })).filter(x => x.mc),
  };
}
const uniqueOpts = (opts: Opt[]) => new Set(opts.map(o => o.t)).size === opts.length && opts.filter(o => o.ok).length === 1;
function choiceItem(R: () => number, base: Omit<CTItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[]): CTItem {
  const ch = choices(R, opts);
  const it: CTItem = { ...base, solution: endOnChoice(base.solution, ch.right), input: 'choice', choices: ch.choices, answer: ch.answer, check: ch.check };
  for (const w of ch.wrong) probe(it, { kind: 'choice', i: w.i }, w.mc);
  return it;
}
/** the list of image vertices as text: A′(3, −1), B′(6, 0), C′(4, −3) */
const listOf = (names: readonly string[], P: readonly V[]) => P.map((p, i) => `${pr(names[i]!)}${pair(p)}`).join(', ');
const figTex = (names: readonly string[], P: readonly V[], prime = false) => P.map((p, i) => `${names[i]}${prime ? "'" : ''}${pairTex(p)}`);
/** board lines for a figure: one vertex per line (two coordinate pairs side by side do not fit the slate) */
const figLines = (names: readonly string[], P: readonly V[], prime = false) => figTex(names, P, prime).join(' | ');

// =====================================================================================================================
// 1. isSlide: is the copy a translation (every vertex the same move)? (translation-uniform-slide)
const isSlide = (R: () => number, n: number): CTItem => {
  for (;;) {
    const names = pick(R, NAMES3), pre = triangle(R, [-7, -1], [-1, 6]);
    const m = randSlide(R, 1, 6) as Extract<Move, { kind: 'slide' }>;
    const kind = pick(R, ['yes', 'yes', 'off', 'off', 'turned'] as const);
    let img = applyAll(m, pre);
    let odd = -1;
    if (kind === 'off') { odd = int(R, 1, 2); const d = pick(R, [[1, 0], [-1, 0], [0, 1], [0, -1]] as V[]); img[odd] = [img[odd]![0] + d[0], img[odd]![1] + d[1]]; }
    if (kind === 'turned') { const ox = int(R, -2, 4), oy = int(R, -3, 3); img = pre.map(p => [ox * 2 - p[0] + m.dx, oy * 2 - p[1] + m.dy] as V); }
    if (!inLim([...pre, ...img])) continue;
    const v0: V = [img[0]![0] - pre[0]![0], img[0]![1] - pre[0]![1]];
    if (v0[0] === 0 && v0[1] === 0) continue;
    if (kind === 'off' && Math.abs(area2(img)) < 4) continue;
    const vw = slideWords(v0[0], v0[1]);
    const opts: Opt[] = [
      { t: `Yes: every vertex moves ${vw}`, ok: kind === 'yes', mc: kind === 'off' ? MC.movesDiff : kind === 'turned' ? MC.anyMove : undefined,
        say: kind === 'yes' ? `Yes. Every vertex moves ${vw}: one move, the same for every point. That is a slide.` : kind === 'off' ? `${pr(names[0])} moves ${vw}, but ${pr(names[odd])} does not: it is one square off. In a slide every point makes the SAME move.` : `Only ${names[0]} moves ${vw}. The copy is turned around, and a slide never turns a figure.` },
      { t: 'No: one vertex moves a different amount', ok: kind === 'off', say: kind === 'off' ? `Right: ${pr(names[odd])} is one square off. A slide moves every point the same amount.` : kind === 'yes' ? `Check them all: every vertex moves ${vw}. It is a slide.` : 'Every vertex moves differently here, because the copy is turned around.' },
      { t: 'No: the copy is turned around', ok: kind === 'turned', say: kind === 'turned' ? 'Right: the copy is upside down. A slide never turns a figure.' : kind === 'yes' ? `It faces the same way, and every vertex moves ${vw}: a slide.` : `It faces the same way. The problem is ${pr(names[odd])}: it is one square off.` },
    ];
    return choiceItem(R, {
      id: `isSlide-${n}`, family: 'isSlide',
      prompt: `A sprite ${A(`${names.join('')}`)} is copied to ${S(`${names.map(pr).join('')}`)}. Is the copy a translation (a slide) of ${names.join('')}?`,
      board: `\\text{a slide?}`,
      pic: { p: { pre: { pts: pre, names: [...names] }, img: { pts: img, names: names.map(pr) } }, at: ['grid', 'pre', 'img'], solve: ['arrows'], solved: odd >= 0 ? { ring: [{ fig: 'img', i: odd, col: 'wrong' }] } : {} },
      hero: kind === 'yes' ? `\\text{${slideWords(v0[0], v0[1], ', ')}}` : `\\text{not one slide}`,
      solution: [`Follow every vertex from ${names[0]} to ${pr(names[0])}, ${names[1]} to ${pr(names[1])}, ${names[2]} to ${pr(names[2])}.`, kind === 'yes' ? `Each one moves ${vw}: a slide.` : kind === 'off' ? `${pr(names[odd])} moves a different amount, so it is not a slide.` : 'The moves are all different: the copy is turned, so it is not a slide.'],
    }, opts);
  }
};

// 2. slideVector: describe the slide from a figure and its image (translation-uniform-slide)
const slideVector = (R: () => number, n: number): CTItem => {
  for (;;) {
    const names = pick(R, NAMES3), pre = triangle(R, [-7, 0], [-6, 2]);
    const diag = R() < 0.45;
    const a = int(R, 2, 5);
    const m: Move = diag ? { kind: 'slide', dx: a * pick(R, [1, -1]), dy: a * pick(R, [1, -1]) } : randSlide(R, 1, 5);
    if (m.kind !== 'slide' || (!diag && Math.abs(m.dx) === Math.abs(m.dy))) continue;
    const img = applyAll(m, pre);
    if (!inLim([...pre, ...img])) continue;
    const w = slideWords(m.dx, m.dy);
    const opts: Opt[] = [{ t: cap(w), ok: true, say: `Yes: ${names[0]} to ${pr(names[0])} is ${w}, and so is every other vertex.` }];
    opts.push({ t: cap(slideWords(-m.dx, -m.dy)), ok: false, mc: MC.reversed, say: `That is the move from ${pr(names[0])} back to ${names[0]}. Go from the figure to its image: ${w}.` });
    if (diag) opts.push({ t: `${a} squares along the slant`, ok: false, mc: MC.diagonal, say: `A step across a square corner to corner is longer than 1 unit. Say how far across and how far up or down: ${w}.` });
    else opts.push({ t: cap(slideWords(m.dy, m.dx)), ok: false, mc: MC.wrongCoord, say: `Count across first (x), then up or down (y): ${names[0]} goes ${w}.` });
    if (!uniqueOpts(opts)) continue;
    return choiceItem(R, {
      id: `slideVector-${n}`, family: 'slideVector',
      prompt: `${A(names.join(''))} slides to ${S(names.map(pr).join(''))}. How does every point move?`,
      board: `\\text{the slide?}`,
      pic: { p: { pre: { pts: pre, names: [...names] }, move: m }, at: ['grid', 'pre', 'img'], solve: ['arrows'], solved: { legs: 0 } },
      hero: `\\text{${slideWords(m.dx, m.dy, ', ')}}`,
      solution: [`Go from ${names[0]}${pair(pre[0]!)} to ${pr(names[0])}${pair(img[0]!)}: ${slideWords(m.dx, 0)} (x ${plus(m.dx)}), then ${slideWords(0, m.dy)} (y ${plus(m.dy)}).`, `Every point moves the same: ${S(w)}.`],
    }, opts);
  }
};

// 3. moveOne: the image of one point after a left / right / up / down move (translation-coordinate-effect)
const moveOne = (R: () => number, n: number, sg?: string): CTItem => {
  for (;;) {
    const name = pick(R, ONE);
    const kind = pick(R, ['h', 'h', 'v', 'v', 'both', 'cross', 'axis'] as const);
    let p: V = [int(R, -7, 7), int(R, -7, 7)];
    let m: Move;
    if (kind === 'h') m = { kind: 'slide', dx: nz(R, -5, 5), dy: 0 };
    else if (kind === 'v') m = { kind: 'slide', dx: 0, dy: nz(R, -5, 5) };
    else if (kind === 'axis') { p = R() < 0.5 ? [0, nz(R, -6, 6)] : [nz(R, -6, 6), 0]; m = randSlide(R, 1, 5, R() < 0.5); }
    else if (kind === 'cross') { const x = int(R, 1, 5); p = [x, int(R, -6, 6)]; m = { kind: 'slide', dx: -int(R, 1, x - 1 || 1), dy: R() < 0.5 ? 0 : nz(R, -4, 4) }; if (m.dx === -x) continue; }
    else m = randSlide(R, 1, 5);
    const q = apply(m, p);
    if (!inLim([p, q], 8)) continue;
    void sg;
    return pointItem({
      id: `moveOne-${n}`, family: 'moveOne', name, p, m,
      prompt: `${A(`${name}${pair(p)}`)} ${moveHtml(m).replace('slides', 'moves')}. Where is ${S(pr(name))}?`,
      board: `${ptTex(name, p)} | ${moveTex(m)} | ${askTex(name)}`,
      pic: { p: { pre: { pts: [p], names: [name] }, move: m }, at: ['grid', 'pre'], solve: ['move', 'arrows', 'img'], solved: { legs: 0 } },
    });
  }
};

// 4. whichChanges: a one-direction move: which coordinate changes, and to what? (translation-coordinate-effect)
const whichChanges = (R: () => number, n: number): CTItem => {
  for (;;) {
    const name = pick(R, ONE), p: V = [int(R, -7, 7), int(R, -7, 7)];
    const horiz = R() < 0.5, d = nz(R, -5, 5);
    const m: Move = { kind: 'slide', dx: horiz ? d : 0, dy: horiz ? 0 : d };
    const q = apply(m, p);
    if (!inLim([p, q], 8)) continue;
    const [x, y] = p;
    const st = (xa: number | null, ya: number | null) => `x ${xa === null ? `stays ${fmt(x)}` : `becomes ${fmt(xa)}`}, y ${ya === null ? `stays ${fmt(y)}` : `becomes ${fmt(ya)}`}`;
    const opts: Opt[] = horiz ? [
      { t: st(x + d, null), ok: true, say: `Yes: ${slideWords(d, 0)} is across, so only x changes: ${fmt(x)} ${plus(d)} = ${fmt(x + d)}.` },
      { t: st(null, y + d), ok: false, mc: MC.wrongCoord, say: `Left and right change x, not y. The point stays at height ${fmt(y)}.` },
      { t: st(x + d, y + d), ok: false, mc: MC.shiftBoth, say: `A move ${d > 0 ? 'right' : 'left'} changes only x. The height, y, stays ${fmt(y)}.` },
    ] : [
      { t: st(null, y + d), ok: true, say: `Yes: ${slideWords(0, d)} only changes the height, y: ${fmt(y)} ${plus(d)} = ${fmt(y + d)}.` },
      { t: st(x + d, null), ok: false, mc: MC.wrongCoord, say: `Up and down change y, not x. The point stays ${fmt(x)} across.` },
      { t: st(x + d, y + d), ok: false, mc: MC.shiftBoth, say: `A move ${d > 0 ? 'up' : 'down'} changes only y. x stays ${fmt(x)}.` },
    ];
    if (!uniqueOpts(opts)) continue;
    return choiceItem(R, {
      id: `whichChanges-${n}`, family: 'whichChanges',
      prompt: `${A(`${name}${pair(p)}`)} moves ${Bm(slideWords(m.dx, m.dy))}. What happens to its coordinates?`,
      board: `${ptTex(name, p)} | ${moveTex(m)}`,
      pic: { p: { pre: { pts: [p], names: [name] }, move: m }, at: ['grid', 'pre'], solve: ['move', 'arrows', 'img'], solved: { legs: 0, [horiz ? 'hline' : 'vline']: horiz ? y : x } },
      hero: `${name}'=${pairTex(q)}`,
      solution: [`${cap(slideWords(m.dx, m.dy))} is ${horiz ? 'across' : 'up or down'}: only ${horiz ? 'x' : 'y'} changes.`, `${S(`${pr(name)} = ${pair(q)}`)}.`],
    }, opts);
  }
};

// 5. reflectPlot: reflect a point across an axis on the grid (reflect-point-across-axis)
const reflectPlot = (R: () => number, n: number): CTItem => {
  const name = pick(R, ONE), m = randAxis(R) as Extract<Move, { kind: 'reflect' }>;
  const c = pick(R, ['q', 'q', 'q', 'q', 'on', 'other', 'origin'] as const);
  let p: V = [nz(R, -7, 7), nz(R, -7, 7)];
  if (c === 'on') p = m.axis === 'x' ? [nz(R, -7, 7), 0] : [0, nz(R, -7, 7)];
  if (c === 'other') p = m.axis === 'x' ? [0, nz(R, -7, 7)] : [nz(R, -7, 7), 0];
  if (c === 'origin') p = [0, 0];
  return pointItem({
    id: `reflectPlot-${n}`, family: 'reflectPlot', name, p, m,
    prompt: `Reflect ${A(`${name}${pair(p)}`)} across the ${Bm(m.axis + '-axis')}. Where is ${S(pr(name))}?`,
    board: `${ptTex(name, p)} | ${moveTex(m)} | ${askTex(name)}`,
    pic: { p: { pre: { pts: [p], names: [name] }, move: m }, at: ['grid', 'mirror', 'pre'], solve: ['move', 'arrows', 'img'], solved: { legs: 0 } },
  });
};

// 6. fixedPoint: which point stays put under an axis reflection? (reflect-point-across-axis)
const fixedPoint = (R: () => number, n: number): CTItem => {
  for (;;) {
    const m = randAxis(R) as Extract<Move, { kind: 'reflect' }>;
    const names = shuffle(R, ['P', 'Q', 'R']);
    const on: V = m.axis === 'x' ? [nz(R, -6, 6), 0] : [0, nz(R, -6, 6)];
    const other: V = m.axis === 'x' ? [0, nz(R, -6, 6)] : [nz(R, -6, 6), 0];
    const off: V = [nz(R, -6, 6), nz(R, -6, 6)];
    const pts = [on, other, off];
    if (dist(on, other) < 2 || dist(off, on) < 2 || dist(off, other) < 2) continue;
    const opts: Opt[] = [
      { t: `${names[0]}${pair(on)}`, ok: true, say: `Yes: ${names[0]} is on the ${m.axis}-axis, the mirror itself. It stays where it is.` },
      { t: `${names[1]}${pair(other)}`, ok: false, say: `${names[1]} is on the OTHER axis, not on the mirror. It flips to ${pair(apply(m, other))}.` },
      { t: `${names[2]}${pair(off)}`, ok: false, say: `${names[2]} is off the mirror, so it flips to ${pair(apply(m, off))}.` },
      { t: 'None: every point moves in a reflection', ok: false, mc: MC.jumps, say: `Points ON the mirror stay put. ${names[0]}${pair(on)} is on the ${m.axis}-axis.` },
    ];
    return choiceItem(R, {
      id: `fixedPoint-${n}`, family: 'fixedPoint',
      prompt: `Reflect the three points across the ${Bm(m.axis + '-axis')}. Which point stays exactly where it is?`,
      board: `\\text{reflect across} | \\text{the }${m.axis}\\text{-axis} | \\text{which stays?}`,
      pic: { p: { pre: { pts, names: names.slice(0, 3), loose: true }, move: m }, at: ['grid', 'mirror', 'pre'], solve: ['move', 'arrows', 'img'], solved: { ring: [{ fig: 'pre', i: 0, col: 'link' }] } },
      hero: `${names[0]}'=${names[0]}${pairTex(on)}`,
      solution: [`A reflection moves each point straight across the mirror, the same distance to the other side.`, `A point ON the mirror is 0 away: it stays. ${S(`${names[0]}${pair(on)}`)} is on the ${m.axis}-axis.`],
    }, opts);
  }
};

// 7. reflectCalc: reflect by the rule, no grid at first (x-axis-reflection-rule, y-axis-reflection-rule)
const reflectCalc = (R: () => number, n: number, sg?: string): CTItem => {
  const name = pick(R, ONE);
  const axis: 'x' | 'y' = sg === 'x-axis-reflection-rule' ? 'x' : sg === 'y-axis-reflection-rule' ? 'y' : R() < 0.5 ? 'x' : 'y';
  const m: Move = { kind: 'reflect', axis };
  const c = pick(R, ['neg', 'neg', 'neg', 'any', 'any', 'on', 'origin'] as const);
  let p: V = [nz(R, -9, 9), nz(R, -9, 9)];
  if (c === 'neg') p = axis === 'x' ? [nz(R, -9, 9), -int(R, 1, 9)] : [-int(R, 1, 9), nz(R, -9, 9)];
  if (c === 'on') p = axis === 'x' ? [nz(R, -9, 9), 0] : [0, nz(R, -9, 9)];
  if (c === 'origin') p = [0, 0];
  return pointItem({
    id: `reflectCalc-${n}`, family: 'reflectCalc', name, p, m,
    prompt: `Reflect ${A(`${name}${pair(p)}`)} across the ${Bm(axis + '-axis')}. Write ${S(pr(name))} without counting squares.`,
    board: `${ptTex(name, p)} | ${moveTex(m)} | ${askTex(name)}`,
    pic: { p: { pre: { pts: [p], names: [name] }, move: m }, at: [], solve: ['grid', 'mirror', 'pre', 'move', 'arrows', 'img'], solved: { legs: 0 } },
  });
};

// 8. axisRule: which arrow rule is the reflection across this axis? (x-axis-reflection-rule, y-axis-reflection-rule)
const axisRule = (R: () => number, n: number, sg?: string): CTItem => {
  for (;;) {
    const name = pick(R, ONE);
    const axis: 'x' | 'y' = sg === 'x-axis-reflection-rule' ? 'x' : sg === 'y-axis-reflection-rule' ? 'y' : R() < 0.5 ? 'x' : 'y';
    const p: V = [nz(R, -7, 7), nz(R, -7, 7)];
    const [x, y] = p;
    const with_ = (rule: string, q: V) => `${rule}, so ${pr(name)} = ${pair(q)}`;
    const opts: Opt[] = axis === 'x' ? [
      { t: with_('(x, y) → (x, −y)', [x, -y]), ok: true, say: 'Yes: across the x-axis a point moves up or down, so x stays and y becomes its opposite.' },
      { t: with_('(x, y) → (−x, y)', [-x, y]), ok: false, mc: MC.named, say: 'That rule flips x: it is the reflection across the y-axis. Across the x-axis, y changes.' },
      { t: with_('(x, y) → (−x, −y)', [-x, -y]), ok: false, mc: MC.both, say: 'Changing both signs is a half turn around the origin. A reflection across the x-axis changes only y.' },
    ] : [
      { t: with_('(x, y) → (−x, y)', [-x, y]), ok: true, say: 'Yes: across the y-axis a point moves sideways, so y stays and x becomes its opposite.' },
      { t: with_('(x, y) → (x, −y)', [x, -y]), ok: false, mc: MC.named, say: 'That rule flips y: it is the reflection across the x-axis. Across the y-axis, x changes.' },
      { t: with_('(x, y) → (−x, −y)', [-x, -y]), ok: false, mc: MC.both, say: 'Changing both signs is a half turn around the origin. A reflection across the y-axis changes only x.' },
    ];
    const c = axis === 'x' ? y : x;
    if (c < 0) opts.push({ t: with_(axis === 'x' ? '(x, y) → (x, −y)' : '(x, y) → (−x, y)', axis === 'x' ? [x, y] : [x, y]).replace(/so .*$/, `so ${pr(name)} = ${pair(p)}, still negative`), ok: false, mc: MC.minus, say: `−(${fmt(c)}) is the opposite of ${fmt(c)}, which is ${fmt(-c)}: positive.` });
    if (!uniqueOpts(opts)) continue;
    const m: Move = { kind: 'reflect', axis };
    return choiceItem(R, {
      id: `axisRule-${n}`, family: 'axisRule',
      prompt: `${A(`${name}${pair(p)}`)} is reflected across the ${Bm(axis + '-axis')}. Which rule moves ${name}, and every other point, the right way?`,
      board: `${ptTex(name, p)} | ${moveTex(m)}`,
      pic: { p: { pre: { pts: [p], names: [name] }, move: m }, at: ['grid', 'mirror', 'pre'], solve: ['move', 'arrows', 'img'], solved: { legs: 0 } },
      hero: axis === 'x' ? `(x,\\,y)\\to(x,\\,-y)` : `(x,\\,y)\\to(-x,\\,y)`,
      solution: solvePoint(name, p, m).concat(`The rule: ${S(axis === 'x' ? '(x, y) → (x, −y)' : '(x, y) → (−x, y)')}.`),
    }, opts);
  }
};

// 9. matchPrime: which image point is B′? (prime-labels)
const matchPrime = (R: () => number, n: number): CTItem => {
  for (;;) {
    const names = pick(R, NAMES3);
    const m: Move = R() < 0.6 ? randAxis(R) : randSlide(R, 2, 6);
    const pre = m.kind === 'reflect' ? triangle(R, m.axis === 'y' ? [-7, -1] : [-6, 6], m.axis === 'x' ? [1, 7] : [-6, 6]) : triangle(R, [-7, 0], [-6, 1]);
    const img = applyAll(m, pre);
    if (!inLim([...pre, ...img])) continue;
    const j = int(R, 0, 2), k = (j + int(R, 1, 2)) % 3;
    const opts: Opt[] = [
      { t: `${pr(names[j]!)} = ${pair(img[j]!)}`, ok: true, say: `Yes: ${pr(names[j]!)} is where ${names[j]} lands: ${names[j]}${pair(pre[j]!)} goes to ${pair(img[j]!)}.` },
      { t: `${pr(names[j]!)} = ${pair(img[k]!)}`, ok: false, mc: MC.primeOrder, say: `${pair(img[k]!)} is where ${names[k]} lands, so it is ${pr(names[k]!)}. The prime belongs to the image of ${names[j]} itself.` },
      { t: `${pr(names[j]!)} = ${pair(pre[j]!)}`, ok: false, mc: MC.primeFree, say: `${pair(pre[j]!)} is ${names[j]} itself. ${pr(names[j]!)} is the image of ${names[j]}: where ${names[j]} goes after the move.` },
    ];
    if (!uniqueOpts(opts)) continue;
    return choiceItem(R, {
      id: `matchPrime-${n}`, family: 'matchPrime',
      prompt: `${A(names.join(''))} ${moveHtml(m)}. Its image is drawn, without letters. Which point is ${S(pr(names[j]!))}?`,
      board: `${figLines(names, pre)} | ${names[j]}'=(\\,?\\,,\\,?\\,)`,
      pic: { p: { pre: { pts: pre, names: [...names] }, move: m, imgNames: [null, null, null] }, at: ['grid', 'mirror', 'pre', 'img'], solve: ['arrows'], solved: { ring: [{ fig: 'img', i: j, col: 'link' }, { fig: 'pre', i: j, col: 'first' }] } },
      hero: `${names[j]}'=${pairTex(img[j]!)}`,
      solution: [`Follow ${names[j]} itself: ${names[j]}${pair(pre[j]!)} ${m.kind === 'slide' ? 'slides' : 'flips'} to ${pair(img[j]!)}.`, `So ${S(`${pr(names[j]!)} = ${pair(img[j]!)}`)}: each prime names the image of its own letter.`],
    }, opts);
  }
};

// 10. primeMeaning: what does M′ name? (prime-labels)
const primeMeaning = (R: () => number, n: number): CTItem => {
  for (;;) {
    const name = pick(R, ONE), p: V = [nz(R, -6, 6), nz(R, -6, 6)];
    const m: Move = R() < 0.5 ? randSlide(R, 1, 5) : randAxis(R);
    const q = apply(m, p);
    if (!inLim([q], 8) || same(p, q)) continue;
    const verb = m.kind === 'slide' ? `the slide ${slideWords((m as { dx: number }).dx, (m as { dy: number }).dy)}` : `the reflection across the ${(m as { axis: string }).axis}-axis`;
    const opts: Opt[] = [
      { t: `${pr(name)} = ${pair(q)}: where ${name} lands after the move`, ok: true, say: `Yes: ${pr(name)} is the image of ${name}, the point ${name} moves to.` },
      { t: `${pr(name)} is a new point: it can be anywhere`, ok: false, mc: MC.primeFree, say: `The prime ties ${pr(name)} to ${name}: it is exactly where ${name} goes under ${verb}.` },
      { t: `${pr(name)} = ${pair(p)}: ${name} with a new name`, ok: false, mc: MC.primeFree, say: `${pair(p)} is ${name} before the move. ${pr(name)} is ${name} AFTER the move: ${pair(q)}.` },
    ];
    return choiceItem(R, {
      id: `primeMeaning-${n}`, family: 'primeMeaning',
      prompt: `${A(`${name}${pair(p)}`)} ${moveHtml(m)}. What is ${S(pr(name))}?`,
      board: `${ptTex(name, p)} | ${moveTex(m)} | ${name}'=\\ ?`,
      pic: { p: { pre: { pts: [p], names: [name] }, move: m }, at: ['grid', 'mirror', 'pre'], solve: ['move', 'arrows', 'img'], solved: { legs: 0 } },
      hero: `${name}'=${pairTex(q)}`,
      solution: [`${pr(name)}, “${name} prime”, is the image of ${name}: the same point after the move.`, ...solvePoint(name, p, m).slice(-1)],
    }, opts);
  }
};

// 11. writeRule: words to an arrow rule (coordinate-rule-notation)
const rt = (a: string, b: string) => `(x, y) → (${a}, ${b})`;
const comp = (v: 'x' | 'y', d: number) => (d === 0 ? v : `${v} ${d > 0 ? '+' : '−'} ${fmt(Math.abs(d))}`);
const writeRule = (R: () => number, n: number): CTItem => {
  for (;;) {
    const one = R() < 0.5;
    const m = randSlide(R, 1, 6, one) as Extract<Move, { kind: 'slide' }>;
    const { dx, dy } = m;
    const opts: Opt[] = [{ t: rt(comp('x', dx), comp('y', dy)), ok: true, say: `Yes: ${slideWords(dx, dy)} means x ${dx ? plus(dx) : 'stays'} and y ${dy ? plus(dy) : 'stays'}.` }];
    if (one) {
      const d = dx || dy;
      opts.push({ t: rt(comp('x', d), comp('y', d)), ok: false, mc: MC.shiftBoth, say: `${cap(slideWords(dx, dy))} changes only ${dx ? 'x' : 'y'}. The other coordinate stays the same.` });
      opts.push({ t: rt(comp('x', dy), comp('y', dx)), ok: false, mc: MC.wrongCoord, say: `${dx ? 'Left and right change x' : 'Up and down change y'}. That rule moves the point the wrong way.` });
      if (dx) opts.push({ t: rt(comp('x', -dx), 'y'), ok: false, mc: MC.leftRight, say: `${dx > 0 ? 'Right adds to x' : 'Left subtracts from x'}: x ${plus(dx)}.` });
      else opts.push({ t: rt('x', comp('y', -dy)), ok: false, say: `${dy > 0 ? 'Up adds to y' : 'Down subtracts from y'}: y ${plus(dy)}.` });
    } else {
      if (Math.abs(dx) === Math.abs(dy)) continue;
      opts.push({ t: rt(comp('x', dy), comp('y', dx)), ok: false, mc: MC.wrongCoord, say: `The across move goes with x and the up-down move with y: x ${plus(dx)}, y ${plus(dy)}.` });
      opts.push({ t: rt(comp('x', -dx), comp('y', dy)), ok: false, mc: MC.leftRight, say: `${dx > 0 ? 'Right adds to x' : 'Left subtracts from x'}: x ${plus(dx)}.` });
      opts.push({ t: rt(comp('x', dx), comp('y', -dy)), ok: false, say: `${dy > 0 ? 'Up adds to y' : 'Down subtracts from y'}: y ${plus(dy)}.` });
    }
    if (!uniqueOpts(opts)) continue;
    const name = pick(R, ONE), p: V = [int(R, -4, 4), int(R, -4, 4)];
    if (!inLim([apply(m, p)], 9)) continue;
    return choiceItem(R, {
      id: `writeRule-${n}`, family: 'writeRule',
      prompt: `Every point moves ${Bm(slideWords(dx, dy))}. Which arrow rule says that?`,
      board: `${moveTex(m)} | (x,\\,y)\\to(\\,?\\,,\\,?\\,)`,
      pic: { p: { pre: { pts: [p], names: [name] }, move: m }, at: ['grid', 'pre'], solve: ['move', 'arrows', 'img'], solved: { legs: 0 } },
      hero: `(x,\\,y)\\to(${comp('x', dx).replace('−', '-').replace(/ /g, '')},\\,${comp('y', dy).replace('−', '-').replace(/ /g, '')})`,
      solution: [`Across (right or left) changes x; up or down changes y. A move left or down is a subtraction.`, `${cap(slideWords(dx, dy))}: ${S(rt(comp('x', dx), comp('y', dy)))}.`],
    }, opts);
  }
};

// 12. ruleMeaning: an arrow rule in words (coordinate-rule-notation)
const ruleMeaning = (R: () => number, n: number): CTItem => {
  for (;;) {
    const refl = R() < 0.35;
    const m: Move = refl ? randAxis(R) : randSlide(R, 1, 6, R() < 0.4);
    let opts: Opt[];
    let ruleT: string;
    if (m.kind === 'reflect') {
      ruleT = m.axis === 'x' ? rt('x', '−y') : rt('−x', 'y');
      opts = [
        { t: `Reflect every point across the ${m.axis}-axis`, ok: true, say: `Yes: ${m.axis === 'x' ? 'x stays and y flips' : 'y stays and x flips'}, a reflection across the ${m.axis}-axis.` },
        { t: `Reflect every point across the ${m.axis === 'x' ? 'y' : 'x'}-axis`, ok: false, mc: MC.named, say: `The rule flips ${m.axis === 'x' ? 'y' : 'x'}, so points move ${m.axis === 'x' ? 'up or down' : 'sideways'}: across the ${m.axis}-axis.` },
        { t: `${m.axis === 'x' ? 'y equals −y' : 'x equals −x'}, so the point stays put`, ok: false, mc: MC.arrowEq, say: 'The arrow is not an equals sign. It says where each point GOES: the left pair is the point, the right pair is its image.' },
      ];
    } else {
      const { dx, dy } = m as Extract<Move, { kind: 'slide' }>;
      if (dx !== 0 && dy !== 0 && Math.abs(dx) === Math.abs(dy)) continue;
      ruleT = rt(comp('x', dx), comp('y', dy));
      opts = [
        { t: `Every point moves ${slideWords(dx, dy)}`, ok: true, say: `Yes: x ${dx ? plus(dx) : 'stays'} is ${dx ? slideWords(dx, 0) : 'no move across'}, y ${dy ? plus(dy) : 'stays'} is ${dy ? slideWords(0, dy) : 'no move up or down'}.` },
        { t: `Every point moves ${slideWords(dy, dx)}`, ok: false, mc: MC.wrongCoord, say: `The x part tells the move across, the y part the move up or down: ${slideWords(dx, dy)}.` },
        { t: `${dx ? `x equals ${comp('x', dx)}` : `y equals ${comp('y', dy)}`}, so the point stays put`, ok: false, mc: MC.arrowEq, say: 'The arrow is not an equals sign. It sends each point (x, y) to a NEW point, its image.' },
      ];
    }
    if (!uniqueOpts(opts)) continue;
    const name = pick(R, ONE), p: V = [nz(R, -5, 5), nz(R, -5, 5)];
    if (!inLim([apply(m, p)], 9)) continue;
    return choiceItem(R, {
      id: `ruleMeaning-${n}`, family: 'ruleMeaning',
      prompt: `What does the rule ${Bm(ruleT)} do?`,
      board: m.kind === 'reflect' ? (m.axis === 'x' ? `(x,\\,y)\\to(x,\\,-y)` : `(x,\\,y)\\to(-x,\\,y)`) : `(x,\\,y)\\to(${comp('x', (m as { dx: number }).dx).replace('−', '-').replace(/ /g, '')},\\,${comp('y', (m as { dy: number }).dy).replace('−', '-').replace(/ /g, '')})`,
      pic: { p: { pre: { pts: [p], names: [name] }, move: m }, at: ['grid', 'pre'], solve: ['mirror', 'move', 'arrows', 'img'], solved: { legs: 0 } },
      hero: m.kind === 'reflect' ? `\\text{across the }${m.axis}\\text{-axis}` : `\\text{${slideWords((m as { dx: number }).dx, (m as { dy: number }).dy, ', ')}}`,
      solution: [`Read the arrow as “goes to”: the point (x, y) goes to the point on the right.`, m.kind === 'reflect' ? `${m.axis === 'x' ? 'y' : 'x'} becomes its opposite: ${S(`a reflection across the ${m.axis}-axis`)}.` : `${S(`Every point moves ${slideWords((m as { dx: number }).dx, (m as { dy: number }).dy)}`)}.`],
    }, opts);
  }
};

// 13. readRule: use an arrow rule on a point (coordinate-rule-notation)
const readRule = (R: () => number, n: number): CTItem => {
  for (;;) {
    const name = pick(R, ONE);
    const m: Move = R() < 0.4 ? randAxis(R) : randSlide(R, 1, 6, R() < 0.35);
    const p: V = [nz(R, -7, 7), nz(R, -7, 7)];
    const q = apply(m, p);
    if (!inLim([q], 9)) continue;
    const extra: Cand[] = [];
    const c = m.kind === 'reflect' ? (m.axis === 'x' ? p[1] : p[0]) : 1;
    if (c > 0) extra.push({ r: p, mc: MC.arrowEq, say: 'The arrow is not an equals sign: the rule sends the point to a NEW point, its image.' });
    const rule = m.kind === 'reflect' ? (m.axis === 'x' ? `(x,\\,y)\\to(x,\\,-y)` : `(x,\\,y)\\to(-x,\\,y)`) : `(x,\\,y)\\to(${comp('x', (m as { dx: number }).dx).replace('−', '-').replace(/ /g, '')},\\,${comp('y', (m as { dy: number }).dy).replace('−', '-').replace(/ /g, '')})`;
    const ruleH = m.kind === 'reflect' ? (m.axis === 'x' ? rt('x', '−y') : rt('−x', 'y')) : rt(comp('x', (m as { dx: number }).dx), comp('y', (m as { dy: number }).dy));
    return pointItem({
      id: `readRule-${n}`, family: 'readRule', name, p, m, extra,
      prompt: `Use the rule ${Bm(ruleH)} on ${A(`${name}${pair(p)}`)}. Where is ${S(pr(name))}?`,
      board: `${rule} | ${ptTex(name, p)} | ${askTex(name)}`,
      pic: { p: { pre: { pts: [p], names: [name] }, move: m }, at: [], solve: ['grid', 'pre', 'mirror', 'move', 'arrows', 'img'], solved: { legs: 0 } },
    });
  }
};

// 14. translateCalc: a translation computed, not counted (translate-point-by-rule)
const translateCalc = (R: () => number, n: number): CTItem => {
  for (;;) {
    const name = pick(R, ONE);
    const zero = R() < 0.25;
    const m = randSlide(R, 1, 5, zero) as Extract<Move, { kind: 'slide' }>;
    // starts at negative coordinates and images that cross zero, often
    const p: V = [R() < 0.6 ? -int(R, 1, 9) : int(R, 0, 9), R() < 0.5 ? -int(R, 1, 9) : int(R, 0, 9)];
    const q = apply(m, p);
    if (!inLim([q], 10)) continue;
    const asRule = R() < 0.5;
    const ruleH = rt(comp('x', m.dx), comp('y', m.dy));
    return pointItem({
      id: `translateCalc-${n}`, family: 'translateCalc', name, p, m,
      prompt: asRule ? `Use ${Bm(ruleH)} on ${A(`${name}${pair(p)}`)}. Calculate ${S(pr(name))}, no counting.` : `${A(`${name}${pair(p)}`)} slides ${Bm(slideWords(m.dx, m.dy))}. Calculate ${S(pr(name))}, no counting.`,
      board: `${ptTex(name, p)} | ${asRule ? `(x,\\,y)\\to(${comp('x', m.dx).replace('−', '-').replace(/ /g, '')},\\,${comp('y', m.dy).replace('−', '-').replace(/ /g, '')})` : moveTex(m)} | ${askTex(name)}`,
      pic: { p: { pre: { pts: [p], names: [name] }, move: m }, at: [], solve: ['grid', 'pre', 'move', 'arrows', 'img'], solved: { legs: 0 } },
    });
  }
};

// 15. signedStep: the entry probe, a whole-number move from a signed start (translate-point-by-rule)
const signedStep = (R: () => number, n: number): CTItem => {
  for (;;) {
    const horiz = R() < 0.6;
    const start = R() < 0.75 ? -int(R, 1, 8) : int(R, 1, 8);
    const d = nz(R, -6, 6);
    const end = start + d;
    if (Math.abs(end) > 10) continue;
    if (Math.sign(start) === Math.sign(d) && R() < 0.6) continue;    // mostly moves toward and across zero
    const other = nz(R, -5, 5);
    const p: V = horiz ? [start, other] : [other, start];
    const m: Move = { kind: 'slide', dx: horiz ? d : 0, dy: horiz ? 0 : d };
    const v = horiz ? 'x' : 'y';
    const word = horiz ? (d > 0 ? 'right' : 'left') : (d > 0 ? 'up' : 'down');
    const wrongMag = Math.sign(start) !== Math.sign(d) ? -(Math.abs(start) + Math.abs(d)) : null;
    const it: CTItem = {
      id: `signedStep-${n}`, family: 'signedStep',
      prompt: `A point has ${v}-coordinate ${A(fmt(start))}. It moves ${Bm(`${Math.abs(d)} ${word}`)}. What is its new ${v}-coordinate?`,
      board: `${v}=${tn(start)} | \\text{${Math.abs(d)} ${word}} | ${v}'=\\ ?`, input: 'num', unit: '',
      pic: { p: { pre: { pts: [p], names: ['P'] }, move: m }, at: [], solve: ['grid', 'pre', 'move', 'arrows', 'img'], solved: { legs: 0 } },
      hero: `${tn(start)}${d > 0 ? '+' : '-'}${Math.abs(d)}=${tn(end)}`,
      solution: [`${cap(word)} ${d > 0 ? 'adds' : 'subtracts'} ${Math.abs(d)}: ${fmt(start)} ${plus(d)}.`, `Start at ${fmt(start)} and go ${Math.abs(d)} ${word}: you land on ${S(fmt(end))}.`],
      answer: { kind: 'num', v: end },
      check: r => {
        const x = numOf(r);
        if (x === null) return { ok: false, say: 'Type a number.' };
        if (x === end) return { ok: true, say: `Yes: ${fmt(start)} ${plus(d)} = ${fmt(end)}.` };
        if (wrongMag !== null && x === wrongMag) return { ok: false, mc: MC.addMag, say: `The signs differ, so the move goes toward zero first: ${fmt(start)} ${plus(d)} = ${fmt(end)}.` };
        if (x === start - d) return { ok: false, mc: horiz ? MC.leftRight : undefined, say: `${cap(word)} ${d > 0 ? 'adds' : 'subtracts'}: ${fmt(start)} ${plus(d)} = ${fmt(end)}.` };
        return { ok: false, say: `Count along the ${v}-axis from ${fmt(start)}: ${Math.abs(d)} ${word} lands on ${fmt(end)}.` };
      },
    };
    if (wrongMag !== null && wrongMag !== end) probe(it, { kind: 'num', v: wrongMag }, MC.addMag);
    if (horiz && start - d !== end && start - d !== wrongMag) probe(it, { kind: 'num', v: start - d }, MC.leftRight);
    return it;
  }
};

// 16. mixedPoint: slides and both axis reflections mixed: choose the rule (mixed-point-transformations)
const mixedPoint = (R: () => number, n: number): CTItem => {
  for (;;) {
    const name = pick(R, ONE);
    const m: Move = R() < 0.4 ? randSlide(R, 1, 5) : randAxis(R);
    const c = pick(R, ['q', 'q', 'q', 'axis', 'origin'] as const);
    const p: V = c === 'origin' ? [0, 0] : c === 'axis' ? (R() < 0.5 ? [0, nz(R, -8, 8)] : [nz(R, -8, 8), 0]) : [nz(R, -8, 8), nz(R, -8, 8)];
    const q = apply(m, p);
    if (!inLim([q], 9)) continue;
    const pictured = R() < 0.5;
    return pointItem({
      id: `mixedPoint-${n}`, family: 'mixedPoint', name, p, m, mixed: true,
      prompt: `${A(`${name}${pair(p)}`)} ${moveHtml(m)}. Where is ${S(pr(name))}?`,
      board: `${ptTex(name, p)} | ${moveTex(m)} | ${askTex(name)}`,
      pic: { p: { pre: { pts: [p], names: [name] }, move: m }, at: pictured ? ['grid', 'mirror', 'pre'] : [], solve: pictured ? ['move', 'arrows', 'img'] : ['grid', 'mirror', 'pre', 'move', 'arrows', 'img'], solved: { legs: 0 } },
    });
  }
};

// a figure for the polygon families: a triangle or quadrilateral on one side, across an axis, or touching the mirror
function polyCase(R: () => number): { names: string[]; pre: V[]; m: Move } {
  for (;;) {
    const four = R() < 0.35;
    const names: string[] = four ? [...pick(R, NAMES4)] : [...pick(R, NAMES3)];
    const m: Move = R() < 0.4 ? randSlide(R, 1, 5) : randAxis(R);
    const where = pick(R, ['side', 'side', 'cross', 'touch'] as const);
    let xr: [number, number] = [-7, 7], yr: [number, number] = [-7, 7];
    if (m.kind === 'reflect') {
      const away: [number, number] = where === 'cross' ? [-3, 6] : where === 'touch' ? [0, 6] : [1, 7];
      if (m.axis === 'x') yr = R() < 0.5 ? away : [-away[1], -away[0]]; else xr = R() < 0.5 ? away : [-away[1], -away[0]];
    } else { xr = where === 'cross' ? [-4, 4] : [-8, -1]; yr = where === 'cross' ? [-4, 4] : [-3, 6]; }
    const pre = four ? quad(R, xr, yr) : triangle(R, xr, yr);
    if (where === 'touch' && m.kind === 'reflect' && !pre.some(p => (m.axis === 'x' ? p[1] : p[0]) === 0)) continue;
    if (!inLim([...pre, ...applyAll(m, pre)])) continue;
    return { names, pre, m };
  }
}

// 17. polygonVertex: one vertex of a transformed polygon (transform-polygon)
const polygonVertex = (R: () => number, n: number): CTItem => {
  const { names, pre, m } = polyCase(R);
  const j = int(R, 0, pre.length - 1);
  const given = pre.map((_, i) => i).filter(i => i !== j);
  const img = applyAll(m, pre);
  return pointItem({
    id: `polygonVertex-${n}`, family: 'polygonVertex', name: names[j]!, p: pre[j]!, m,
    prompt: `${A(names.join(''))} ${moveHtml(m)}. ${given.map(i => `${pr(names[i]!)} = ${pair(img[i]!)}`).join(', ')}. Where is ${S(pr(names[j]!))}? Use the rule, not your eye.`,
    board: `${figLines(names, pre)} | ${moveTex(m)} | ${askTex(names[j]!)}`,
    pic: { p: { pre: { pts: pre, names }, move: m }, at: ['grid', 'mirror', 'pre', ...given.map(i => 'd' + i)], solve: ['move', 'arrows', 'img'], solved: { legs: j, ring: [{ fig: 'img', i: j, col: 'link' }] } },
  });
};

// 18. polygonCheck: the whole image as a list of vertices (transform-polygon)
const polygonCheck = (R: () => number, n: number): CTItem => {
  for (;;) {
    const { names, pre, m } = polyCase(R);
    const img = applyAll(m, pre);
    const opts: Opt[] = [{ t: listOf(names, img), ok: true, say: `Yes: one rule for every vertex, and each prime matches its own letter.` }];
    const swapped = [...img]; [swapped[0], swapped[1]] = [swapped[1]!, swapped[0]!];
    opts.push({ t: listOf(names, swapped), ok: false, mc: MC.order, say: `Those are the right points with the wrong letters: ${pr(names[0]!)} must be the image of ${names[0]}, which is ${pair(img[0]!)}.` });
    const off = img.map((p, i) => (i === 0 ? p : ([p[0] + (i % 2 ? 1 : 0), p[1] + (i % 2 ? 0 : -1)] as V)));
    opts.push({ t: listOf(names, off), ok: false, mc: MC.anchor, say: `${pr(names[0]!)} is right, but the others were placed by eye. Use the rule on EVERY vertex: ${pr(names[1]!)} = ${pair(img[1]!)}.` });
    if (m.kind === 'reflect') {
      const cs = pre.map(p => (m.axis === 'x' ? p[1] : p[0]));
      const s = -(Math.min(...cs) + Math.max(...cs));
      const slid = pre.map(p => (m.axis === 'x' ? [p[0], p[1] + s] : [p[0] + s, p[1]]) as V);
      opts.push({ t: listOf(names, slid), ok: false, mc: MC.asSlide, say: `That slides the figure across the ${m.axis}-axis without flipping it. A reflection flips each point: ${pr(names[0]!)} = ${pair(img[0]!)}.` });
    } else {
      const { dx, dy } = m as Extract<Move, { kind: 'slide' }>;
      opts.push({ t: listOf(names, applyAll({ kind: 'slide', dx: dy, dy: dx }, pre)), ok: false, mc: MC.wrongCoord, say: `Across changes x, up or down changes y: x ${plus(dx)}, y ${plus(dy)}.` });
    }
    if (!uniqueOpts(opts)) continue;
    if (opts.slice(1).some(o => o.t === opts[0]!.t)) continue;
    return choiceItem(R, {
      id: `polygonCheck-${n}`, family: 'polygonCheck',
      prompt: `${A(names.join(''))} ${moveHtml(m)}. Which list is its image?`,
      board: `${figLines(names, pre)} | ${moveTex(m)}`,
      pic: { p: { pre: { pts: pre, names }, move: m }, at: ['grid', 'mirror', 'pre'], solve: ['move', 'arrows', 'img'] },
      hero: `\\text{one rule, every vertex}`,
      solution: [`Use the rule on every vertex, in order: ${names.map((nm, i) => `${nm}${pair(pre[i]!)} → ${pair(img[i]!)}`).join('; ')}.`, `${S(listOf(names, img))}.`],
    }, opts);
  }
};

// 19. nameMove: a figure and its image are given: name the move, checking every pair (identify-transformation-from-pairs)
const nameMove = (R: () => number, n: number): CTItem => {
  for (;;) {
    const names = [...pick(R, NAMES3)];
    const kind = pick(R, ['slide', 'slide', 'reflect', 'reflect', 'off'] as const);
    let pre: V[], img: V[], m: Move, odd = -1;
    if (kind === 'reflect') {
      m = randAxis(R);
      const ax = (m as { axis: 'x' | 'y' }).axis;
      pre = triangle(R, ax === 'y' ? [-7, -1] : [-6, 6], ax === 'x' ? [1, 7] : [-6, 6]);
      if (R() < 0.5) pre = pre.map(p => (ax === 'x' ? [p[0], -p[1]] : [-p[0], p[1]]) as V);
      img = applyAll(m, pre);
    } else {
      // a slide that carries the figure across the y-axis, so "a reflection" looks tempting
      const dx = int(R, 4, 9) * pick(R, [1, -1]), dy = int(R, 0, 3) * pick(R, [1, -1]);
      m = { kind: 'slide', dx, dy };
      const x0 = dx > 0 ? [-7, -2] : [2, 7];
      pre = triangle(R, x0 as [number, number], [-5, 5]);
      img = applyAll(m, pre);
      if (!img.every(p => Math.sign(p[0]) === Math.sign(dx))) continue;
      if (kind === 'off') { odd = int(R, 1, 2); img[odd] = [img[odd]![0] + pick(R, [1, -1]), img[odd]![1]]; }
    }
    if (!inLim([...pre, ...img])) continue;
    const v0: V = [img[0]![0] - pre[0]![0], img[0]![1] - pre[0]![1]];
    const w0 = slideWords(v0[0], v0[1]);
    const opts: Opt[] = [];
    if (kind === 'slide') {
      opts.push({ t: `A slide ${w0}`, ok: true, say: `Yes: every vertex moves ${w0}. Check each pair: they all match.` });
      opts.push({ t: `A slide ${slideWords(-v0[0], -v0[1])}`, ok: false, mc: MC.reversed, say: `That goes from the image back to the figure. From ${names[0]} to ${pr(names[0]!)} is ${w0}.` });
      opts.push({ t: 'A reflection across the y-axis', ok: false, mc: MC.oppSides, say: `The figures are on opposite sides, but ${pr(names[0]!)} is not the mirror image of ${names[0]}: ${names[0]}${pair(pre[0]!)} would flip to ${pair([-pre[0]![0], pre[0]![1]])}.` });
    } else if (kind === 'reflect') {
      const ax = (m as { axis: 'x' | 'y' }).axis;
      opts.push({ t: `A reflection across the ${ax}-axis`, ok: true, say: `Yes: every pair has ${ax === 'x' ? 'the same x and opposite y' : 'the same y and opposite x'}.` });
      opts.push({ t: `A reflection across the ${ax === 'x' ? 'y' : 'x'}-axis`, ok: false, say: `Check a pair: ${names[0]}${pair(pre[0]!)} and ${pr(names[0]!)}${pair(img[0]!)} have the same ${ax === 'x' ? 'x' : 'y'}. The mirror is the ${ax}-axis.` });
      opts.push({ t: `A slide ${w0}`, ok: false, mc: MC.onePoint, say: `That slide works for ${names[0]} only. Check ${names[1]}: it would land on ${pair([pre[1]![0] + v0[0], pre[1]![1] + v0[1]])}, not on ${pr(names[1]!)}${pair(img[1]!)}.` });
    } else {
      opts.push({ t: `A slide ${w0}`, ok: false, mc: MC.onePoint, say: `${names[0]} fits, but check every pair: ${pr(names[odd]!)} is one square off. No single move works.` });
      opts.push({ t: `None of these: ${pr(names[odd]!)} does not fit`, ok: true, say: `Right: ${names[0]} moves ${w0}, but ${names[odd]} moves a different amount. One move must fit every pair.` });
      opts.push({ t: 'A reflection across the y-axis', ok: false, mc: MC.oppSides, say: `Opposite sides is not enough: ${names[0]}${pair(pre[0]!)} would flip to ${pair([-pre[0]![0], pre[0]![1]])}.` });
    }
    if (!uniqueOpts(opts)) continue;
    return choiceItem(R, {
      id: `nameMove-${n}`, family: 'nameMove',
      prompt: `${A(names.join(''))} and ${S(names.map(pr).join(''))} are shown. Which single move sends every vertex to its image?`,
      board: `${figLines(names, pre)} | ${figLines(names, img, true)}`,
      pic: { p: { pre: { pts: pre, names }, img: { pts: img, names: names.map(pr) } }, at: ['grid', 'pre', 'img'], solve: ['arrows'], solved: odd >= 0 ? { ring: [{ fig: 'img', i: odd, col: 'wrong' }] } : {} },
      hero: kind === 'slide' ? `\\text{${slideWords(v0[0], v0[1], ', ')}}` : kind === 'reflect' ? `\\text{across the }${(m as { axis: string }).axis}\\text{-axis}` : `\\text{no single move}`,
      solution: [`Check EVERY pair, not just one: ${names.map((nm, i) => `${nm}${pair(pre[i]!)} → ${pair(img[i]!)}`).join('; ')}.`,
        kind === 'slide' ? `Each moves ${w0}: ${S(`a slide ${w0}`)}.` : kind === 'reflect' ? `${S(`A reflection across the ${(m as { axis: string }).axis}-axis`)}: same ${(m as { axis: string }).axis === 'x' ? 'x' : 'y'}, opposite ${(m as { axis: string }).axis === 'x' ? 'y' : 'x'}.` : `${pr(names[odd]!)} moves differently: ${S('no single move fits')}.`],
    }, opts);
  }
};

// 20. straightImage: a point between two others stays on the image segment (verify-straightness)
const straightImage = (R: () => number, n: number): CTItem => {
  for (;;) {
    const names = pick(R, [['A', 'M', 'B'], ['P', 'M', 'Q'], ['J', 'K', 'L']] as const);
    const dir = pick(R, [[1, 0], [0, 1], [1, 1], [1, -1], [2, 1], [1, 2]] as V[]);
    const k = int(R, 1, 3), a: V = [int(R, -7, 3), int(R, -6, 6)];
    const pts: V[] = [a, [a[0] + k * dir[0], a[1] + k * dir[1]], [a[0] + 2 * k * dir[0], a[1] + 2 * k * dir[1]]];
    const m: Move = R() < 0.5 ? randSlide(R, 1, 5) : randAxis(R);
    const img = applyAll(m, pts);
    if (!inLim([...pts, ...img]) || !collinear(img[0]!, img[1]!, img[2]!)) continue;
    const q = img[1]!;
    const evidence = R() < 0.2;
    if (evidence) {
      const opts: Opt[] = [
        { t: 'No: a few checks are evidence; a proof needs a reason that works for every line', ok: true, say: 'Right. Checks show it worked so far. The reason it always works: one rule moves every point the same way, so nothing can bend.' },
        { t: 'Yes: three checks prove it for every line', ok: false, say: 'Three checks are good evidence, but a proof needs a reason that covers every line, not just the ones you tried.' },
        { t: 'No: some lines bend when they are moved', ok: false, mc: MC.bend, say: 'No line bends: the image of a straight segment is always a straight segment.' },
      ];
      return choiceItem(R, {
        id: `straightImage-${n}`, family: 'straightImage',
        prompt: `Sam moved three different lines and each image was still straight. Sam says: “That proves every line stays straight under every slide and reflection.” Is that a proof?`,
        board: `\\text{evidence or proof?}`,
        pic: { p: { pre: { pts, names: [...names], open: true }, move: m }, at: ['grid', 'mirror', 'pre'], solve: ['move', 'arrows', 'img'] },
        hero: `\\text{evidence, not proof}`,
        solution: ['Checking a few cases is evidence.', 'A proof gives a reason for every case: one rule moves every point the same way.'],
      }, opts);
    }
    const bendV: V = dir[0] === 0 ? [q[0] + 1, q[1]] : [q[0], q[1] + 1];
    const opts: Opt[] = [
      { t: `${pr(names[1])} = ${pair(q)}, on segment ${pr(names[0])}${pr(names[2])}`, ok: true, say: `Yes: ${names[1]} goes to ${pair(q)}, right between ${pr(names[0])} and ${pr(names[2])}. The image is still a straight segment.` },
      { t: `${pr(names[1])} = ${pair(bendV)}, just off the segment: an image can bend`, ok: false, mc: MC.bend, say: `Use the rule on ${names[1]}: it lands on ${pair(q)}, ON the segment. A slide or reflection never bends a line.` },
      { t: `Only ${pr(names[0])} and ${pr(names[2])} count, so skip ${pr(names[1])}`, ok: false, mc: MC.interior, say: `The question asks for ${pr(names[1])} too. Use the rule on it: ${pair(q)}, on the segment.` },
    ];
    if (!uniqueOpts(opts)) continue;
    return choiceItem(R, {
      id: `straightImage-${n}`, family: 'straightImage',
      prompt: `${A(`${names[0]}, ${names[1]}, ${names[2]}`)} lie on one straight line. The segment ${moveHtml(m)}. Where does ${names[1]}${pair(pts[1]!)} go?`,
      board: `${figLines([...names], pts)} | ${moveTex(m)}`,
      pic: { p: { pre: { pts, names: [...names], open: true }, move: m }, at: ['grid', 'mirror', 'pre', 'd0', 'd2'], solve: ['move', 'arrows', 'img'], solved: { ring: [{ fig: 'img', i: 1, col: 'link' }] } },
      hero: `${names[1]}'=${pairTex(q)}`,
      solution: [solvePoint(names[1], pts[1]!, m)[0]!, `${names[1]}${pair(pts[1]!)} → ${pr(names[1])}${pair(q)}, between ${pr(names[0])} and ${pr(names[2])}: the image is a straight segment.`],
    }, opts);
  }
};

// 21. sideLength: a horizontal or vertical side across zero keeps its length (verify-segment-length)
const sideLength = (R: () => number, n: number): CTItem => {
  for (;;) {
    const names = pick(R, NAMES3);
    const horiz = R() < 0.5;
    const a = -int(R, 1, 6), b = int(R, 1, 6), c = nz(R, -5, 5);
    const P: V = horiz ? [a, c] : [c, a], Q: V = horiz ? [b, c] : [c, b];
    const third: V = horiz ? [int(R, a, b), c + pick(R, [3, 4, -3, -4])] : [c + pick(R, [3, 4, -3, -4]), int(R, a, b)];
    const pre = [P, Q, third];
    if (Math.abs(area2(pre)) < 6) continue;
    const m: Move = R() < 0.5 ? randSlide(R, 1, 4) : randAxis(R);
    const img = applyAll(m, pre);
    if (!inLim([...pre, ...img])) continue;
    const L = b - a;
    const it: CTItem = {
      id: `sideLength-${n}`, family: 'sideLength',
      prompt: `${A(names.join(''))} ${moveHtml(m)}. ${names[0]}${pair(P)} and ${names[1]}${pair(Q)}. How long is ${S(`${pr(names[0])}${pr(names[1])}`)}?`,
      board: `${figLines([...names], pre.slice(0, 2))} | ${moveTex(m)} | ${names[0]}'${names[1]}'=\\ ?`, input: 'num', unit: 'units',
      pic: { p: { pre: { pts: pre, names: [...names] }, move: m }, at: ['grid', 'mirror', 'pre'], solve: ['move', 'arrows', 'img'], solved: { sides: [0] } },
      hero: `${names[0]}'${names[1]}'=${names[0]}${names[1]}=${L}`,
      solution: [`${names[0]}${names[1]} is ${horiz ? 'horizontal' : 'vertical'}: from ${fmt(a)} to ${fmt(b)} is ${fmt(-a)} + ${fmt(b)} = ${L} units (across zero, add the two distances).`, `A slide or a reflection keeps every length: ${S(`${pr(names[0])}${pr(names[1])} = ${L}`)}.`],
      answer: { kind: 'num', v: L },
      check: r => {
        const v = numOf(r);
        if (v === null) return { ok: false, say: 'Type a number.' };
        if (v === L) return { ok: true, say: `Yes: ${L} units, the same as ${names[0]}${names[1]}. The move keeps every length.` };
        if (v === Math.abs(b + a)) return { ok: false, say: `Across zero, add the distances: ${fmt(-a)} to the left of 0 and ${fmt(b)} to the right is ${L}.` };
        return { ok: false, say: `${names[0]}${names[1]} is ${L} units long, and a slide or reflection keeps the length: ${pr(names[0])}${pr(names[1])} = ${L}.` };
      },
    };
    return it;
  }
};

// 22. lengthKept: do lengths change? (verify-segment-length)
const lengthKept = (R: () => number, n: number): CTItem => {
  for (;;) {
    const names = pick(R, NAMES3);
    const m: Move = R() < 0.6 ? randAxis(R) : randSlide(R, 2, 5);
    const pre = triangle(R, [-7, 0], [1, 7]);
    const img = applyAll(m, pre);
    if (!inLim([...pre, ...img])) continue;
    // a slanted side
    const s = [0, 1, 2].find(i => pre[i]![0] !== pre[(i + 1) % 3]![0] && pre[i]![1] !== pre[(i + 1) % 3]![1]);
    if (s === undefined) continue;
    const a = names[s]!, b = names[(s + 1) % 3]!;
    const move = m.kind === 'slide' ? 'slide' : 'reflection';
    const variant = R() < 0.6;
    const opts: Opt[] = variant ? [
      { t: `Yes: a ${move} keeps every length, slanted sides too`, ok: true, say: `Right: ${pr(a)}${pr(b)} = ${a}${b}. The move carries the whole side along without stretching it.` },
      { t: 'No: only horizontal and vertical sides keep their length', ok: false, mc: MC.axisOnly, say: `Trace ${a}${b} and lay it on ${pr(a)}${pr(b)}: it fits exactly. Slanted sides keep their length too.` },
      { t: `No: the ${m.kind === 'slide' ? 'moved' : 'flipped'} triangle is a different shape`, ok: false, mc: MC.flipNotCong, say: `${m.kind === 'slide' ? 'Moved' : 'Flipped'} is not changed. Every side and angle stays the same: the triangles are congruent.` },
    ] : [
      { t: `No: one side is not enough; every side has to be checked`, ok: true, say: 'Right. One matching side says nothing about the other two. Here all three match, because the move keeps every length.' },
      { t: `Yes: one matching side proves the triangles match`, ok: false, mc: MC.oneSide, say: 'Many different triangles share one side length. Check every side, or know that the move keeps them all.' },
      { t: 'Yes: the triangles look the same', ok: false, say: 'Looking is not checking. Compare every side (or use the rule).' },
    ];
    return choiceItem(R, {
      id: `lengthKept-${n}`, family: 'lengthKept',
      prompt: variant
        ? `${A(names.join(''))} ${moveHtml(m)}. Is the slanted side ${S(`${pr(a)}${pr(b)}`)} as long as ${a}${b}?`
        : `${A(names.join(''))} ${moveHtml(m)}. Ana measures ${a}${b} and ${pr(a)}${pr(b)}: they match. She says the triangles must match. Is one side enough?`,
      board: `${figLines([...names], pre)} | ${moveTex(m)}`,
      pic: { p: { pre: { pts: pre, names: [...names] }, move: m }, at: ['grid', 'mirror', 'pre', 'img'], solve: ['move', 'arrows'], focus: { sides: [s] }, solved: { sides: variant ? [s] : [0, 1, 2] } },
      hero: `${a}'${b}'=${a}${b}`,
      solution: ['Slides and reflections are rigid: every length and every angle stays the same.', variant ? `So ${S(`${pr(a)}${pr(b)} = ${a}${b}`)}, slanted or not.` : `${S('Check all three sides')}; one match alone proves nothing.`],
    }, opts);
  }
};

// a triangle with a 45, 90 or 135 degree angle at vertex 1 (lattice arms)
function niceAngle(R: () => number): { pre: V[]; deg: number } {
  for (;;) {
    const deg = pick(R, [45, 90, 135, 45, 135]);
    const s = int(R, 2, 4), t = int(R, 2, 4);
    const B: V = [int(R, -6, 0), int(R, -2, 4)];
    const rot = int(R, 0, 3);
    const r = (v: V): V => { let [x, y] = v; for (let i = 0; i < rot; i++) [x, y] = [-y, x]; return [x, y]; };
    const u = r([s, 0]), v = r(deg === 90 ? [0, t] : deg === 45 ? [t, t] : [-t, t]);
    const pre: V[] = [[B[0] + u[0], B[1] + u[1]], B, [B[0] + v[0], B[1] + v[1]]];
    if (Math.abs(angleAt(pre, 1) - deg) > 1e-6) continue;
    if (!inLim(pre, 8) || Math.abs(dist(pre[0]!, pre[1]!) - dist(pre[1]!, pre[2]!)) < 1e-9) continue;
    return { pre, deg };
  }
}
// 23. angleImage: the measure of an image angle (verify-angle-measure)
const angleImage = (R: () => number, n: number): CTItem => {
  for (;;) {
    const names = pick(R, NAMES3);
    const { pre, deg } = niceAngle(R);
    const m: Move = R() < 0.65 ? randAxis(R) : randSlide(R, 1, 4);
    const img = applyAll(m, pre);
    if (!inLim([...pre, ...img])) continue;
    const ang = `∠${names[0]}${names[1]}${names[2]}`, angI = `∠${pr(names[0])}${pr(names[1])}${pr(names[2])}`;
    const it: CTItem = {
      id: `angleImage-${n}`, family: 'angleImage',
      prompt: `${A(names.join(''))} ${moveHtml(m)}. ${ang} = ${deg}°. What is ${S(angI)}?`,
      board: `\\angle ${names.join('')}=${deg}^\\circ | ${moveTex(m)} | \\angle ${names[0]}'${names[1]}'${names[2]}'=\\ ?`, input: 'num', unit: 'degrees',
      pic: { p: { pre: { pts: pre, names: [...names] }, move: m }, at: ['grid', 'mirror', 'pre'], solve: ['move', 'arrows', 'img'], focus: { angle: 1 }, solved: { angle: 1 } },
      hero: `\\angle ${names[0]}'${names[1]}'${names[2]}'=${deg}^\\circ`,
      solution: [`A ${m.kind === 'slide' ? 'slide' : 'reflection'} keeps every angle. The image may face another way, but its opening is the same.`, `${S(`${angI} = ${deg}°`)}.`],
      answer: { kind: 'num', v: deg },
      check: r => {
        const v = numOf(r);
        if (v === null) return { ok: false, say: 'Type a number.' };
        if (v === deg) return { ok: true, say: `Yes: ${deg}°. Trace the angle and lay it on the image: it fits.` };
        if (v === 180 - deg) return { ok: false, mc: MC.facesWay, say: `Facing the other way does not change the opening. ${angI} is still ${deg}°.` };
        return { ok: false, say: `The move keeps every angle: ${angI} = ${deg}°.` };
      },
    };
    if (deg !== 90) probe(it, { kind: 'num', v: 180 - deg }, MC.facesWay);
    return it;
  }
};

// 24. angleKept: longer arms, another direction: is the angle bigger? (verify-angle-measure)
const angleKept = (R: () => number, n: number): CTItem => {
  for (;;) {
    const names = pick(R, NAMES3);
    const { pre, deg } = niceAngle(R);
    const m: Move = R() < 0.65 ? randAxis(R) : randSlide(R, 1, 4);
    const img = applyAll(m, pre);
    if (!inLim([...pre, ...img])) continue;
    const angI = `∠${pr(names[0])}${pr(names[1])}${pr(names[2])}`;
    const opts: Opt[] = [
      { t: `No: the opening is the same, so ${angI} = ${deg}°`, ok: true, say: 'Right: the size of an angle is its opening, not the length of its arms. The move keeps it.' },
      { t: `Yes: its arms are drawn longer, so it is bigger`, ok: false, mc: MC.armLength, say: 'Arm length does not change an angle. Lay a tracing of the angle on the image: the openings match.' },
    ];
    if (deg !== 90) opts.push({ t: `Yes: it faces the other way, so it is ${180 - deg}°`, ok: false, mc: MC.facesWay, say: `Facing another way does not change the opening: still ${deg}°.` });
    else opts.push({ t: 'It cannot be known without a protractor', ok: false, say: 'Tracing is enough: lay the traced angle on the image and it fits.' });
    return choiceItem(R, {
      id: `angleKept-${n}`, family: 'angleKept',
      prompt: `∠${names.join('')} = ${deg}°. The triangle ${moveHtml(m)}. Mia redraws ${S(angI)} with arms twice as long. Is her angle bigger than ${deg}°?`,
      board: `\\angle ${names.join('')}=${deg}^\\circ | ${moveTex(m)}`,
      pic: { p: { pre: { pts: pre, names: [...names] }, move: m }, at: ['grid', 'mirror', 'pre', 'img'], solve: ['move'], focus: { angle: 1 }, solved: { angle: 1 } },
      hero: `\\angle ${names[0]}'${names[1]}'${names[2]}'=${deg}^\\circ`,
      solution: ['The size of an angle is how wide it opens, not how long the arms are.', `Slides and reflections keep every angle: ${S(`${angI} = ${deg}°`)}.`],
    }, opts);
  }
};

// 25. parallelKept: parallel sides stay parallel (verify-parallelism)
const parallelKept = (R: () => number, n: number): CTItem => {
  for (;;) {
    const names = [...pick(R, NAMES4)];
    const u = pick(R, [[3, 0], [4, 0], [3, 1], [4, 1], [2, -1], [0, 3]] as V[]), v = pick(R, [[1, 3], [2, 3], [-1, 2], [3, 2], [2, 0], [3, 0]] as V[]);
    if (Math.abs(u[0] * v[1] - u[1] * v[0]) < 3) continue;
    const a: V = [int(R, -7, 2), int(R, -6, 3)];
    const pre: V[] = [a, [a[0] + u[0], a[1] + u[1]], [a[0] + u[0] + v[0], a[1] + u[1] + v[1]], [a[0] + v[0], a[1] + v[1]]];
    if (orient(pre) < 0) pre.reverse();
    const m: Move = R() < 0.65 ? randAxis(R) : randSlide(R, 1, 5);
    const img = applyAll(m, pre);
    if (!inLim([...pre, ...img])) continue;
    const s1 = `${pr(names[0]!)}${pr(names[1]!)}`, s2 = `${pr(names[3]!)}${pr(names[2]!)}`;
    const opts: Opt[] = [
      { t: `Yes: ${s1} is parallel to ${s2}`, ok: true, say: `Right: the move turns both sides the same way, so they stay parallel.` },
      { t: `No: they point a different way now, so not parallel`, ok: false, mc: MC.parallelLost, say: 'Both sides changed direction together. Two lines that were parallel are still parallel after a slide or reflection.' },
      { t: `Yes, because ${s1} and ${s2} have the same length`, ok: false, mc: MC.lengthsOnly, say: 'Equal lengths do not show parallel. Check the direction: both images line up the same way.' },
    ];
    return choiceItem(R, {
      id: `parallelKept-${n}`, family: 'parallelKept',
      prompt: `In ${A(names.join(''))}, side ${names[0]}${names[1]} is parallel to ${names[3]}${names[2]}. The shape ${moveHtml(m)}. Is ${S(s1)} parallel to ${S(s2)}?`,
      board: `${names[0]}${names[1]}\\parallel ${names[3]}${names[2]} | ${moveTex(m)}`,
      pic: { p: { pre: { pts: pre, names }, move: m }, at: ['grid', 'mirror', 'pre', 'img'], solve: ['move'], focus: { sides: [0, 2] }, solved: { sides: [0, 2] } },
      hero: `${names[0]}'${names[1]}'\\parallel ${names[3]}'${names[2]}'`,
      solution: ['A slide or reflection moves both sides by the same rule, so they keep pointing the same way as each other.', `${S(`${s1} ∥ ${s2}`)}.`],
    }, opts);
  }
};

// 26. orientation: a reflection reverses the vertex order, a slide keeps it (orientation-reversal)
const orientation = (R: () => number, n: number): CTItem => {
  for (;;) {
    const names = pick(R, NAMES3);
    const m: Move = R() < 0.6 ? randAxis(R) : randSlide(R, 2, 5);
    let pre = triangle(R, [-7, -1], [1, 7]);
    if (orient(pre) < 0) pre = [pre[0]!, pre[2]!, pre[1]!];
    const img = applyAll(m, pre);
    if (!inLim([...pre, ...img])) continue;
    const refl = m.kind !== 'slide';
    const opts: Opt[] = [
      { t: 'Clockwise; every length and angle stays the same', ok: refl, say: refl ? 'Right: a reflection reverses the order, and keeps every length and angle.' : 'A slide never flips a figure: the order stays counterclockwise.' },
      { t: 'Counterclockwise, the same way as ABC'.replace('ABC', names.join('')), ok: !refl, say: !refl ? 'Right: a slide keeps the order of the vertices.' : `A reflection flips the figure: ${names.map(pr).join('')} now goes the other way, clockwise.` },
      { t: 'Clockwise, so its angles changed too', ok: false, mc: MC.orientMeasures, say: refl ? 'The order flips, but nothing is stretched: every length and angle stays the same.' : 'A slide keeps the order, and no move here changes an angle.' },
    ];
    return choiceItem(R, {
      id: `orientation-${n}`, family: 'orientation',
      prompt: `Going ${names[0]} → ${names[1]} → ${names[2]} turns counterclockwise. ${A(names.join(''))} ${moveHtml(m)}. Which way does ${S(`${names.map(pr).join(' → ')}`)} turn?`,
      board: `${names.join('')}\\text{: counterclockwise} | ${moveTex(m)}`,
      pic: { p: { pre: { pts: pre, names: [...names] }, move: m }, at: ['grid', 'mirror', 'pre', 'img'], solve: ['move'], focus: {}, solved: { orient: 1 } },
      hero: refl ? `\\text{reflection: order reversed}` : `\\text{slide: order kept}`,
      solution: [refl ? 'A reflection flips the figure over, so the order of the vertices runs the other way: clockwise.' : 'A slide moves the figure without flipping it: the order stays counterclockwise.', 'Lengths and angles never change: only the direction of the order can.'],
    }, opts);
  }
};

// 27. checkImage: is the proposed figure really the image under the stated move? (check-proposed-image)
const checkImage = (R: () => number, n: number): CTItem => {
  for (;;) {
    const names = [...pick(R, NAMES3)];
    const m: Move = R() < 0.5 ? randAxis(R) : randSlide(R, 1, 5);
    const pre = m.kind === 'reflect' ? triangle(R, m.axis === 'y' ? [-7, -1] : [-6, 6], m.axis === 'x' ? [1, 7] : [-6, 6]) : triangle(R, [-6, 1], [-5, 2]);
    const img = applyAll(m, pre);
    const kind = pick(R, ['right', 'right', 'vertex', 'wrongmove', 'copy'] as const);
    let prop: V[] = img.map(p => [p[0], p[1]] as V);
    if (kind === 'vertex') { const j = int(R, 1, 2); prop[j] = [prop[j]![0] + pick(R, [1, -1]), prop[j]![1]]; }
    // a different move: the slide one square off, or the reflection across the other axis
    if (kind === 'wrongmove') prop = m.kind === 'slide' ? applyAll({ kind: 'slide', dx: m.dx + pick(R, [1, -1]), dy: m.dy }, pre) : applyAll({ kind: 'reflect', axis: (m as { axis: 'x' | 'y' }).axis === 'x' ? 'y' : 'x' }, pre);
    // a congruent copy in the wrong place: the slide's numbers swapped, or a reflection done as a slide across the axis
    if (kind === 'copy') {
      if (m.kind === 'slide') prop = applyAll({ kind: 'slide', dx: m.dy, dy: m.dx }, pre);
      else if (m.kind === 'reflect') { const cs = pre.map(q => (m.axis === 'x' ? q[1] : q[0])); const sh = -(Math.min(...cs) + Math.max(...cs)); prop = applyAll(m.axis === 'x' ? { kind: 'slide', dx: 0, dy: sh } : { kind: 'slide', dx: sh, dy: 0 }, pre); }
    }
    if (!inLim([...pre, ...img, ...prop])) continue;
    const ok = prop.every((p, i) => same(p, img[i]!));
    if ((kind === 'right') !== ok) continue;
    const bad = prop.findIndex((p, i) => !same(p, img[i]!));
    const congruent = kind !== 'vertex';
    const opts: Opt[] = [
      { t: 'Yes: every vertex follows the rule', ok, mc: ok ? undefined : congruent ? MC.anyCopy : MC.onePoint, say: ok ? 'Yes: check each vertex with the rule, and each one matches.' : congruent ? `It is the same size and shape, but not where the move sends it: ${pr(names[bad]!)} should be ${pair(img[bad]!)}.` : `Some vertices fit, but ${pr(names[bad]!)} should be ${pair(img[bad]!)}. Check every vertex.` },
    ];
    if (ok) {
      opts.push({ t: `No: ${pr(names[0]!)} should be ${pair([img[0]![0] + 1, img[0]![1]])}`, ok: false, say: `Use the rule on ${names[0]}${pair(pre[0]!)}: ${pair(img[0]!)}, which is where ${pr(names[0]!)} is.` });
      if (m.kind === 'reflect') opts.push({ t: 'No: the image must not face another way', ok: false, mc: MC.flipNotCong, say: 'A reflection is allowed to face the other way. What matters is that every vertex follows the rule.' });
      else { const sm = m as Extract<Move, { kind: 'slide' }>; const sw = apply({ kind: 'slide', dx: sm.dy, dy: sm.dx }, pre[0]!); if (same(sw, img[0]!)) continue; opts.push({ t: `No: ${pr(names[0]!)} should be ${pair(sw)}`, ok: false, mc: MC.wrongCoord, say: `${cap(slideWords(sm.dx, sm.dy))}: x ${plus(sm.dx)}, y ${plus(sm.dy)}. ${pr(names[0]!)} = ${pair(img[0]!)}, as Kim drew it.` }); }
    } else {
      opts.push({ t: `No: ${pr(names[bad]!)} should be ${pair(img[bad]!)}`, ok: true, say: `Right: the rule sends ${names[bad]}${pair(pre[bad]!)} to ${pair(img[bad]!)}, not to ${pair(prop[bad]!)}.` });
      opts.push({ t: 'Yes: every side has the same length as before', ok: false, mc: MC.lengthsOnly, say: `Same side lengths only says it is a copy. The move fixes WHERE each vertex goes: ${pr(names[bad]!)} should be ${pair(img[bad]!)}.` });
    }
    if (!uniqueOpts(opts)) continue;
    return choiceItem(R, {
      id: `checkImage-${n}`, family: 'checkImage',
      prompt: `${A(names.join(''))} ${moveHtml(m)}. Kim draws the image ${S(names.map(pr).join(''))} shown. Is Kim's image right?`,
      board: `${figLines(names, pre)} | ${moveTex(m)} | \\text{Kim: } | ${figLines(names, prop, true)}`,
      // Kim's figure is drawn as a proposal (not yet judged); the solution draws the true image over it
      pic: { p: { pre: { pts: pre, names }, move: m, wrong: { pts: prop, names: names.map(pr) }, imgNames: ok ? names.map(() => null) : undefined }, at: ['grid', 'mirror', 'pre', 'wrong'], solve: ['arrows', 'img'], focus: { proposal: true }, solved: ok ? { proposal: true } : { proposal: false, ring: [{ fig: 'wrong', i: bad, col: 'wrong' }] } },
      hero: ok ? `\\text{every vertex fits}` : `${names[bad]}'=${pairTex(img[bad]!)}`,
      solution: [`Use the rule on every vertex: ${names.map((nm, i) => `${nm} → ${pair(img[i]!)}`).join(', ')}.`, ok ? `Kim's image matches at every vertex: ${S('right')}.` : `Kim's ${pr(names[bad]!)} is ${pair(prop[bad]!)}, but it should be ${S(pair(img[bad]!))}. Same shape is not enough.`],
    }, opts);
  }
};

// ---------- contexts (apply-in-context) ----------
interface Ctx { what: string; who: string; slide: (w: string) => string; mirror: (ax: string) => string }
const CTXS: Ctx[] = [
  { what: 'a game sprite', who: 'the sprite', slide: w => `The game moves the sprite ${w} squares`, mirror: ax => `The game flips the sprite across the ${ax}-axis` },
  { what: 'a logo', who: 'the logo', slide: w => `A designer shifts the logo ${w} squares`, mirror: ax => `A designer mirrors the logo across the ${ax}-axis` },
  { what: 'a robot on a warehouse floor grid', who: 'the robot', slide: w => `The robot rolls ${w} squares`, mirror: ax => `A second robot copies the path, mirrored across the ${ax}-axis` },
  { what: 'a map pin on a city grid', who: 'the pin', slide: w => `The pin is dragged ${w} blocks`, mirror: ax => `The map is flipped across the ${ax}-axis` },
  { what: 'a stage light on a floor plan', who: 'the light', slide: w => `The crew slides the light ${w} squares`, mirror: ax => `A matching light goes across the ${ax}-axis` },
];
// 28. contextMove: a contextual instruction carried out on one vertex (apply-in-context)
const contextMove = (R: () => number, n: number): CTItem => {
  for (;;) {
    const cx = pick(R, CTXS), names = [...pick(R, NAMES3)];
    const m: Move = R() < 0.55 ? randSlide(R, 1, 6) : randAxis(R);
    const pre = triangle(R, [-7, 3], [-6, 6]);
    const img = applyAll(m, pre);
    if (!inLim([...pre, ...img])) continue;
    const j = int(R, 0, 2);
    const instr = m.kind === 'slide' ? cx.slide(slideWords(m.dx, m.dy)) : cx.mirror((m as { axis: string }).axis);
    return pointItem({
      id: `contextMove-${n}`, family: 'contextMove', name: names[j]!, p: pre[j]!, m,
      prompt: `${cap(cx.what)} has corners ${A(names.map((nm, i) => `${nm}${pair(pre[i]!)}`).join(', '))}. ${instr}. Where does corner ${S(pr(names[j]!))} end up?`,
      board: `${figLines(names, pre)} | ${moveTex(m)} | ${askTex(names[j]!)}`,
      pic: { p: { pre: { pts: pre, names }, move: m }, at: ['grid', 'pre'], solve: ['mirror', 'move', 'arrows', 'img'], solved: { legs: j, ring: [{ fig: 'img', i: j, col: 'link' }] } },
    });
  }
};
// 29. contextCheck: close enough is not enough (apply-in-context)
const contextCheck = (R: () => number, n: number): CTItem => {
  for (;;) {
    const cx = pick(R, CTXS), names = [...pick(R, NAMES3)];
    const d = int(R, 2, 6), horiz = R() < 0.5, dir = pick(R, [1, -1]);
    const m: Move = { kind: 'slide', dx: horiz ? d * dir : 0, dy: horiz ? 0 : d * dir };
    const pre = triangle(R, [-6, 2], [-5, 4]);
    const img = applyAll(m, pre);
    const j = int(R, 1, 2);
    const prop = img.map(p => [...p] as unknown as V);
    prop[j] = horiz ? [prop[j]![0] + dir, prop[j]![1]] : [prop[j]![0], prop[j]![1] + dir];
    if (!inLim([...pre, ...img, ...prop])) continue;
    const w = slideWords(m.dx, m.dy);
    const opts: Opt[] = [
      { t: `No: every corner must move exactly ${w}`, ok: true, say: `Right: a slide moves every point the same amount. ${pr(names[j]!)} should be ${pair(img[j]!)}.` },
      { t: 'Yes: one square off is close enough on a screen', ok: false, mc: MC.approx, say: `The instruction is exact: ${w}. ${pr(names[j]!)} must be ${pair(img[j]!)}, or the shape gets bent.` },
      { t: 'Yes: a slide may move each corner a different amount', ok: false, mc: MC.movesDiff, say: `In a slide every point makes the same move, ${w}. Otherwise the shape would stretch.` },
    ];
    return choiceItem(R, {
      id: `contextCheck-${n}`, family: 'contextCheck',
      prompt: `${cap(cx.who)} (${names.join('')}) has to move ${Bm(w)}. Dev moves ${names.filter((_, i) => i !== j).join(' and ')} ${w}, but corner ${names[j]} ${d + 1} ${horiz ? (dir > 0 ? 'right' : 'left') : (dir > 0 ? 'up' : 'down')}: “close enough.” Is that OK?`,
      board: `\\text{${w}}`,
      pic: { p: { pre: { pts: pre, names }, move: m, wrong: { pts: prop, names: names.map(pr) } }, at: ['grid', 'pre', 'wrong'], solve: ['arrows', 'img'], focus: { proposal: true }, solved: { proposal: false, ring: [{ fig: 'wrong', i: j, col: 'wrong' }] } },
      hero: `${names[j]}'=${pairTex(img[j]!)}`,
      solution: [`Every corner moves ${w}: ${names.map((nm, i) => `${nm} → ${pair(img[i]!)}`).join(', ')}.`, `Dev's ${pr(names[j]!)} is one square off: ${S('not OK')}.`],
    }, opts);
  }
};

// 30. rationalPoint: halves and tenths (rational-coordinates)
const half = (R: () => number, lo: number, hi: number) => { for (;;) { const v = int(R, lo * 2, hi * 2) / 2; if (v !== 0 && !Number.isInteger(v)) return v; } };
const rationalPoint = (R: () => number, n: number): CTItem => {
  for (;;) {
    const name = pick(R, ONE);
    const tenths = R() < 0.3;
    const p: V = tenths ? [r6(nz(R, -48, 48) / 10), r6(nz(R, -48, 48) / 10)] : [R() < 0.7 ? half(R, -4, 4) : nz(R, -4, 4), half(R, -4, 4)];
    const m: Move = R() < 0.55 ? randAxis(R) : tenths ? { kind: 'slide', dx: r6(nz(R, -20, 20) / 10), dy: r6(nz(R, -20, 20) / 10) } : { kind: 'slide', dx: R() < 0.5 ? nz(R, -3, 3) : half(R, -2, 2), dy: R() < 0.5 ? nz(R, -3, 3) : half(R, -2, 2) };
    const q = apply(m, p);
    if (!inLim([q], 5)) continue;
    const extra: Cand[] = [];
    if (m.kind === 'reflect') {
      const i = m.axis === 'x' ? 1 : 0, c = p[i];
      for (const mag of [Math.round(Math.abs(c)), Math.floor(Math.abs(c))]) {
        if (mag === Math.abs(c) || mag === 0) continue;
        const r: V = i === 1 ? [p[0], -Math.sign(c) * mag] : [-Math.sign(c) * mag, p[1]];
        extra.push({ r, mc: MC.fracMag, say: `Only the sign changes, not the size: the opposite of ${fmt(c)} is ${fmt(-c)}.` });
      }
    }
    const halves = [p, q].every(v => Number.isInteger(v[0] * 2) && Number.isInteger(v[1] * 2));
    const it = pointItem({
      id: `rationalPoint-${n}`, family: 'rationalPoint', name, p, m, extra,
      prompt: `${A(`${name}${pair(p)}`)} ${moveHtml(m)}. Where is ${S(pr(name))}? (Decimals like 2.5 are fine.)`,
      board: `${ptTex(name, p)} | ${moveTex(m)} | ${askTex(name)}`,
      pic: halves ? { p: { pre: { pts: [p], names: [name] }, move: m, half: true, win: { x0: -6, x1: 6, y0: -6, y1: 6 } }, at: ['grid', 'mirror', 'pre'], solve: ['move', 'arrows', 'img'], solved: { legs: 0 } } : undefined,
    });
    if (m.kind === 'reflect') {
      // the sign flipped but the size changed: any such answer is the fraction-magnitude slip
      const base = it.check, i = m.axis === 'x' ? 1 : 0, c = p[i];
      it.check = r => {
        const v = base(r);
        if (v.ok || v.mc || r.kind !== 'pair') return v;
        const rv = [r.x, r.y];
        if (Math.abs(rv[1 - i]! - p[1 - i]!) < 1e-9 && Math.sign(rv[i]!) === -Math.sign(c) && Math.abs(Math.abs(rv[i]!) - Math.abs(c)) > 1e-9) return { ok: false, mc: MC.fracMag, say: `Only the sign changes, not the size: the opposite of ${fmt(c)} is ${fmt(-c)}.` };
        return v;
      };
    }
    return it;
  }
};
// 31. rationalChoice: a point between grid points can be reflected too (rational-coordinates)
const rationalChoice = (R: () => number, n: number): CTItem => {
  for (;;) {
    const name = pick(R, ONE);
    const m = randAxis(R) as Extract<Move, { kind: 'reflect' }>;
    const p: V = [half(R, -4, 4), half(R, -4, 4)];
    const q = apply(m, p);
    const i = m.axis === 'x' ? 1 : 0, c = p[i];
    const rounded: V = i === 1 ? [p[0], -Math.sign(c) * Math.ceil(Math.abs(c))] : [-Math.sign(c) * Math.ceil(Math.abs(c)), p[1]];
    const opts: Opt[] = [
      { t: `Yes: ${pr(name)} = ${pair(q)}`, ok: true, say: `Yes: the same rule works between grid points. ${m.axis === 'x' ? 'y' : 'x'} becomes its opposite: ${fmt(c)} → ${fmt(-c)}.` },
      { t: `No: ${name} is not on a grid point, so it cannot be reflected`, ok: false, mc: MC.gridOnly, say: `Every point of the plane can be reflected, grid point or not: ${pr(name)} = ${pair(q)}.` },
      { t: `Yes: ${pr(name)} = ${pair(rounded)}`, ok: false, mc: MC.fracMag, say: `A reflection changes only the sign: the opposite of ${fmt(c)} is ${fmt(-c)}, not ${fmt(rounded[i])}.` },
    ];
    if (!uniqueOpts(opts)) continue;
    return choiceItem(R, {
      id: `rationalChoice-${n}`, family: 'rationalChoice',
      prompt: `Can ${A(`${name}${pair(p)}`)} be reflected across the ${Bm(m.axis + '-axis')}? If so, where does it land?`,
      board: `${ptTex(name, p)} | ${moveTex(m)}`,
      pic: { p: { pre: { pts: [p], names: [name] }, move: m, half: true, win: { x0: -5, x1: 5, y0: -5, y1: 5 } }, at: ['grid', 'mirror', 'pre'], solve: ['move', 'arrows', 'img'], solved: { legs: 0 } },
      hero: `${name}'=${pairTex(q)}`,
      solution: solvePoint(name, p, m),
    }, opts);
  }
};

// 32. reflectLine: across x = k or y = k (reflect-non-axis-line, extension)
const reflectLine = (R: () => number, n: number): CTItem => {
  for (;;) {
    const name = pick(R, ONE);
    const m: Move = { kind: 'mirror', line: R() < 0.5 ? 'x' : 'y', k: nz(R, -4, 4) };
    const c = pick(R, ['q', 'q', 'q', 'on'] as const);
    let p: V = [int(R, -7, 7), int(R, -7, 7)];
    if (c === 'on') p = m.line === 'x' ? [m.k, int(R, -6, 6)] : [int(R, -6, 6), m.k];
    const q = apply(m, p);
    if (!inLim([p, q])) continue;
    if (c === 'q' && (m.line === 'x' ? p[0] === m.k || p[0] === 0 : p[1] === m.k || p[1] === 0)) continue;
    return pointItem({
      id: `reflectLine-${n}`, family: 'reflectLine', name, p, m,
      prompt: `Reflect ${A(`${name}${pair(p)}`)} across the line ${Bm(`${m.line} = ${fmt(m.k)}`)}. Where is ${S(pr(name))}?`,
      board: `${ptTex(name, p)} | ${moveTex(m)} | ${askTex(name)}`,
      pic: { p: { pre: { pts: [p], names: [name] }, move: m }, at: ['grid', 'mirror', 'pre'], solve: ['move', 'arrows', 'img'], solved: { legs: 0 } },
    });
  }
};

// 33. rigidOrNot: is a rule a translation, an axis reflection, or neither? (non-rigid-non-examples, extension)
const rigidOrNot = (R: () => number, n: number): CTItem => {
  for (;;) {
    const variant = R() < 0.25 ? 'outside' : 'classify';
    const names = ['A', 'B', 'C'];
    const pre: V[] = pick(R, [[[1, 1], [3, 1], [1, 3]], [[1, 1], [4, 1], [1, 2]], [[-2, 1], [0, 1], [-2, 4]], [[1, -2], [3, -2], [1, 1]]] as V[][]);
    if (variant === 'outside') {
      const m = randSlide(R, 1, 4) as Extract<Move, { kind: 'slide' }>;
      const P: V = [int(R, -6, 6), int(R, -6, 6)];
      if (pre.some(v => same(v, P))) continue;
      const q = apply(m, P);
      if (!inLim([q, ...applyAll(m, pre)])) continue;
      const ruleH = rt(comp('x', m.dx), comp('y', m.dy));
      if (m.dx === m.dy) continue;   // x + d, y + d: the swapped-coordinate distractor would be the right point too
      const opts: Opt[] = [
        { t: `Yes: P′ = ${pair(q)}; the rule moves every point of the plane`, ok: true, say: 'Right: a transformation moves the whole plane, not just the drawing.' },
        { t: 'No: the rule only moves the triangle', ok: false, mc: MC.pictureOnly, say: `The rule works on ANY point (x, y). P goes to ${pair(q)} too.` },
        { t: `Yes: P′ = ${pair([P[0] + m.dy, P[1] + m.dx])}`, ok: false, mc: MC.wrongCoord, say: `x ${plus(m.dx)} and y ${plus(m.dy)}: P′ = ${pair(q)}.` },
      ];
      if (!uniqueOpts(opts)) continue;
      return choiceItem(R, {
        id: `rigidOrNot-${n}`, family: 'rigidOrNot',
        prompt: `The rule ${Bm(ruleH)} moves triangle ${A('ABC')}. Point ${A(`P${pair(P)}`)} is not on the triangle. Does the rule move P?`,
        board: `(x,\\,y)\\to(${comp('x', m.dx).replace('−', '-').replace(/ /g, '')},\\,${comp('y', m.dy).replace('−', '-').replace(/ /g, '')}) | P${pairTex(P)}`,
        pic: { p: { pre: { pts: pre, names }, move: m, extra: { pts: [P], names: ['P'] } }, at: ['grid', 'pre', 'extra'], solve: ['move', 'arrows', 'img'], solved: { ring: [{ fig: 'extra', i: 0 }] } },
        hero: `P'=${pairTex(q)}`,
        solution: ['A rule like this is a transformation of the whole plane: every point moves.', `P${pair(P)} → ${S(`P′ = ${pair(q)}`)}.`],
      }, opts);
    }
    const kind = pick(R, ['slide', 'refl', 'stretch', 'stretch', 'shear'] as const);
    const m: Move = kind === 'slide' ? randSlide(R, 1, 3) : kind === 'refl' ? randAxis(R) : kind === 'stretch' ? { kind: 'stretch', a: 2 } : { kind: 'shear' };
    const img = applyAll(m, pre);
    if (!inLim([...pre, ...img])) continue;
    const ruleH = m.kind === 'slide' ? rt(comp('x', m.dx), comp('y', m.dy)) : m.kind === 'reflect' ? (m.axis === 'x' ? rt('x', '−y') : rt('−x', 'y')) : m.kind === 'stretch' ? rt('2x', 'y') : rt('x', 'y + x');
    const rigid = kind === 'slide' || kind === 'refl';
    const opts: Opt[] = [
      { t: 'A translation (a slide)', ok: kind === 'slide', mc: rigid ? undefined : MC.anyMove, say: kind === 'slide' ? 'Right: every point moves the same amount.' : rigid ? 'The points do not all move the same way: it flips.' : 'The triangle moves, but it also changes shape. A slide never changes lengths.' },
      { t: 'A reflection across an axis', ok: kind === 'refl', say: kind === 'refl' ? 'Right: one coordinate becomes its opposite.' : rigid ? 'Every point moves the same amount: that is a slide.' : 'A reflection keeps every length. This rule changes the side lengths.' },
      { t: 'Neither: it changes lengths or angles', ok: !rigid, say: !rigid ? 'Right: compare the sides of the image with the triangle. They are not the same length.' : 'Check a side: it keeps its length. This rule is a rigid move.' },
    ];
    return choiceItem(R, {
      id: `rigidOrNot-${n}`, family: 'rigidOrNot',
      prompt: `Apply ${Bm(ruleH)} to triangle ${A('ABC')}. Is the rule a translation, a reflection across an axis, or neither?`,
      board: ruleH.replace(/→/, '\\to').replace(/−/g, '-').replace(/, /g, ',\\,').replace(/ /g, ''),
      pic: { p: { pre: { pts: pre, names }, move: m }, at: ['grid', 'pre'], solve: ['move', 'arrows', 'img'] },
      hero: kind === 'slide' ? `\\text{a translation}` : kind === 'refl' ? `\\text{a reflection}` : `\\text{neither: not rigid}`,
      solution: ['Use the rule on each vertex and compare the image with the triangle.', kind === 'slide' ? `Every point moves the same: ${S('a translation')}.` : kind === 'refl' ? `One coordinate flips: ${S('a reflection across an axis')}.` : `The sides change length: ${S('neither')}; the rule is not rigid.`],
    }, opts);
  }
};

export const GENS: Record<FamilyId, (R: () => number, n: number, sg?: string) => CTItem> = {
  isSlide, slideVector, moveOne, whichChanges, reflectPlot, fixedPoint, reflectCalc, axisRule, matchPrime, primeMeaning, writeRule,
  ruleMeaning, readRule, translateCalc, signedStep, mixedPoint, polygonVertex, polygonCheck, nameMove, straightImage, sideLength,
  lengthKept, angleImage, angleKept, parallelKept, orientation, checkImage, contextMove, contextCheck, rationalPoint, rationalChoice,
  reflectLine, rigidOrNot,
};
