// items.ts: the practice families of "Dilations and similarity" (secondary-t5-36). Every family returns an Item with a
// DilPic picture (the page draws it with DilBoard and replays the worked solution there after a miss). The classifier
// maps typical slips to misconception ids of math-curriculum-essentials/misconceptions.json.
import { type Gen, type Item, type Response, A, B, S, fr, fracValue, int, pick, shuffle } from '../../runtime/item';
import { type Move, dil as dilM, flipX, flipY, mapPts, mv, slide, turn } from '../congruence/congMaths';
import {
  type DFig, type DilPic, type K, type V, angles, at, bbox, centroid, dilate, dilateAll, fix, kH, kInv, kT, kk, kv, lenS, numH,
  numT, orientOf, paperWin, paraP, picProblem, place, planeWin, ptH, ptT, rectP, row, sides, triAA, triSSS,
} from './dilMaths';

export interface DItem extends Item { picture: DilPic }
export const MC = {
  letters: 'mc.transformations.matches-parts-by-position-or-letters',
  apparent: 'mc.transformations.matches-sides-by-apparent-length',
  addKeep: 'mc.ratio-rate.additive-keep-difference',
  middle: 'mc.transformations.dilation-center-is-figure-middle',
  ignored: 'mc.transformations.dilation-center-ignored',
  additive: 'mc.transformations.additive-scaling',
  enlarge: 'mc.transformations.misjudges-enlarge-vs-reduce',
  sign: 'mc.integers.drops-sign-of-computed-result',
  oneStep: 'mc.transformations.scales-one-step-of-slanted-side',
  fracLess: 'mc.fractions-concept.fraction-must-be-less-than-one',
  rigid: 'mc.transformations.size-change-confused-with-rigid-motion',
  reverses: 'mc.transformations.rotation-or-dilation-reverses-orientation',
  scalesAngles: 'mc.transformations.scales-angles',
  flipped: 'mc.transformations.turned-or-flipped-copy-not-congruent',
  looks: 'mc.transformations.similarity-judged-by-appearance',
  larger: 'mc.ratio-rate.scale-factor-larger-over-smaller',
  subtract: 'mc.mul-div.missing-factor-by-subtraction',
  oneRatio: 'mc.transformations.checks-one-side-ratio',
  equalAngles: 'mc.transformations.equal-angles-make-polygons-similar',
  equalRatios: 'mc.transformations.equal-ratios-make-polygons-similar',
  wrongOp: 'mc.ratio-rate.scale-factor-wrong-operation',
  units: 'mc.measurement-units.arithmetic-on-unconverted-unit-numerals',
  ignoresLabels: 'mc.transformations.ignores-vertex-labels-when-matching-images',
  failedSearch: 'mc.transformations.failed-search-proves-impossible',
  failedArg: 'mc.geometric-proof.failed-argument-as-disproof',
  examples: 'mc.reasoning-language.examples-as-proof',
  partial: 'mc.geometric-proof.partial-match-as-whole-mapping',
  twoVertices: 'mc.transformations.two-matched-vertices-force-triangle-coincidence',
  noReason: 'mc.geometric-proof.step-without-reason',
  needsSides: 'mc.transformations.requires-side-measurements-despite-aa',
} as const;

// ======================================================================================================
// helpers
// ======================================================================================================
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const tri = (s: string) => `△${s}`;
const triT = (s: string) => `\\triangle ${s}`;
const nameH = (s: string) => (s.length === 3 ? tri(s) : s);
const nameT = (s: string) => (s.length === 3 ? triT(s) : s);
const simH = (a: string, b: string) => `${nameH(a)} ~ ${nameH(b)}`;
const simT = (a: string, b: string) => `${nameT(a)} \\sim ${nameT(b)}`;
const deg = (x: number) => `${Math.round(x)}°`;
const LET3: [string, string][] = [['ABC', 'DEF'], ['PQR', 'STU'], ['JKL', 'MNP'], ['RST', 'XYZ'], ['GHK', 'UVW']];
const LET4: [string, string][] = [['ABCD', 'EFGH'], ['PQRS', 'WXYZ'], ['JKLM', 'RSTU']];
/** names for a figure dilated about a center called P (no P in them) */
const LETC = ['ABC', 'DEF', 'RST', 'GHK', 'JKL', 'UVW', 'XYZ'];
const LETC4 = ['ABCD', 'EFGH', 'JKLM', 'RSTU', 'WXYZ'];
/** a fraction a/b in lowest terms, as HTML */
function ratioH(a: number, b: number): string {
  for (const m of [1, 10, 100]) if (Number.isInteger(Math.round(a * m * 1e6) / 1e6) && Number.isInteger(Math.round(b * m * 1e6) / 1e6)) {
    const A = Math.round(a * m), B = Math.round(b * m), k = kk(A, B);
    return kH(k);
  }
  return numH(a / b);
}
function ratioK(a: number, b: number): K {
  for (const m of [1, 10, 100]) { const A = Math.round(a * m), B = Math.round(b * m); if (near(A, a * m) && near(B, b * m)) return kk(A, B); }
  throw new Error('not a ratio of decimals');
}

interface Opt { t: string; ok?: boolean; mc?: string; say: string }
type Base = Omit<DItem, 'input' | 'answer' | 'check' | 'choices'>;
function choice(R: () => number, base: Base, opts: Opt[]): DItem {
  const o = shuffle(R, opts.slice());
  const ai = o.findIndex(x => x.ok);
  if (ai < 0 || o.filter(x => x.ok).length !== 1) throw new Error(`${base.family}: exactly one right choice`);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: ai },
    check: (r: Response) => { if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one answer.' }; const x = o[r.i]!; return { ok: !!x.ok, mc: x.mc, say: x.say }; },
  };
}
interface Wn { v: number; mc?: string; say: string }
function numItem(base: Base, ans: number, unit: string, okSay: string, wrongs: Wn[], hint: string): DItem {
  const ws = wrongs.filter(w => !near(w.v, ans));
  return {
    ...base, input: 'num', unit, answer: { kind: 'num', v: ans },
    check: (r: Response) => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, ans)) return { ok: true, say: okSay };
      const w = ws.find(x => near(x.v, r.v));
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
    },
  };
}
interface Wp { p: V; mc?: string; say: string }
function pairItem(base: Base, ans: V, lead: string, okSay: string, wrongs: Wp[], hint: string): DItem {
  const ws = wrongs.filter(w => !(near(w.p[0], ans[0]) && near(w.p[1], ans[1])));
  return {
    ...base, input: 'pair', pairLead: lead, pairOp: ',', pairTail: ')', answer: { kind: 'pair', x: ans[0], y: ans[1] },
    check: (r: Response) => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both coordinates.' };
      if (near(r.x, ans[0]) && near(r.y, ans[1])) return { ok: true, say: okSay };
      const w = ws.find(x => near(x.p[0], r.x) && near(x.p[1], r.y));
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
    },
  };
}
interface Wk { k: number; mc?: string; say: string }
/** a scale factor typed as a fraction (or a whole number): any equivalent form is right */
function kItem(base: Base, ans: K, okSay: string, wrongs: Wk[], hint: string): DItem {
  const ws = wrongs.filter(w => !near(w.k, kv(ans)));
  return {
    ...base, input: 'frac', unit: '', answer: { kind: 'frac', w: 0, n: ans.n, d: ans.d },
    check: (r: Response) => {
      if (r.kind !== 'frac') return { ok: false, say: 'Type the scale factor as a fraction or a whole number.' };
      const v = fracValue(r);
      if (!v || v[1] === 0) return { ok: false, say: 'Type the scale factor as a fraction or a whole number.' };
      const x = v[0] / v[1];
      if (near(x, kv(ans))) return { ok: true, say: okSay };
      const w = ws.find(q => near(q.k, x));
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
    },
  };
}
/** retry a picture builder until the painter can draw it */
function fit(make: () => DItem | null, what: string, tries = 600): DItem {
  for (let i = 0; i < tries; i++) {
    const x = make();
    if (x && picProblem(x.picture) === null) return x;
  }
  throw new Error(`${what}: no picture fits`);
}
/** two paper figures side by side (or stacked, whichever draws bigger) */
function paperPair(a: DFig, b: DFig, o: { note?: string; sim?: boolean } = {}): DilPic {
  const h = row([a, b], 0.35, false), v = row([a, b], 0.3, true);
  const sz = (fs: DFig[]) => { const w = paperWin(fs); return Math.min(880 / (w.x1 - w.x0), 860 / (w.y1 - w.y0)); };
  const figs = sz(h) >= sz(v) ? h : v;
  return { kind: 'paper', win: paperWin(figs), axes: false, figs, sim: o.sim === false ? undefined : { fig: 0, to: 1 }, note: o.note };
}
/** a scalene triangle's angles (whole degrees, clearly different) */
function triAngles(R: () => number): [number, number, number] {
  for (;;) {
    const a = int(R, 35, 85), b = int(R, 35, 85), c = 180 - a - b;
    if (c < 32 || c > 108) continue;
    if (Math.abs(a - b) < 9 || Math.abs(b - c) < 9 || Math.abs(a - c) < 9) continue;
    return [a, b, c];
  }
}
const validTri = (x: readonly number[]) => x[0]! + x[1]! > x[2]! + 0.3 && x[1]! + x[2]! > x[0]! + 0.3 && x[2]! + x[0]! > x[1]! + 0.3;
const SSS: [number, number, number][] = [[4, 5, 6], [5, 6, 7], [4, 6, 7], [5, 7, 8], [6, 7, 9], [6, 8, 9], [5, 6, 8], [3, 5, 6], [7, 8, 10], [5, 8, 9], [4, 5, 7], [6, 7, 8]];
/** a random way to show the second figure: turned, flipped or as is */
function look(R: () => number, sameWay: boolean): { rot: number; flip: boolean } {
  if (sameWay) return { rot: 0, flip: false };
  const flip = R() < 0.4;
  return { rot: pick(R, [90, 180, 270, 120, 240, 60, 300, 150, 210]), flip };
}
/** letters of the image, permuted: image corner i gets tgt[perm[i]] */
function permLetters(R: () => number, tgt: string, identityOk = false): { labels: string[]; perm: number[] } {
  const n = tgt.length;
  for (;;) {
    const perm = shuffle(R, Array.from({ length: n }, (_, i) => i));
    if (!identityOk && perm.every((p, i) => p === i)) continue;
    if (n === 4) { const s = (perm[1]! - perm[0]! + 4) % 4; if (!perm.every((p, i) => p === (perm[0]! + i * s) % 4) || (s !== 1 && s !== 3)) continue; }
    return { labels: perm.map(p => tgt[p]!), perm };
  }
}

// ---------- quads with whole-degree angles ----------
function quadShape(R: () => number, size: number): { pts: V[]; angs: number[] } {
  if (R() < 0.5) {
    const a = pick(R, [60, 65, 70, 75, 110, 115, 120]);
    const P = paraP(size, size * pick(R, [0.55, 0.65, 0.75]), a);
    return { pts: P, angs: [a, 180 - a, a, 180 - a] };
  }
  // a right trapezoid: right angles on the left, a whole-degree slant on the right
  const w = size, h = size * pick(R, [0.5, 0.6, 0.7]), a = pick(R, [50, 55, 60, 65, 70, 75]);
  const P: V[] = [[0, 0], [w, 0], [w - h / Math.tan((a * Math.PI) / 180), h], [0, h]];
  return { pts: P, angs: [90, a, 180 - a, 90] };
}

// ======================================================================================================
// 1. correspondence-from-mapping, 8. correspondence-across-orientation
// ======================================================================================================
/** which side / angle corresponds, read from a similarity statement (same orientation) */
const corrSide: Gen = (R, n) => {
  const quad = R() < 0.35;
  const [L1, L2] = pick(R, quad ? LET4 : LET3);
  const P0 = quad ? quadShape(R, 6).pts : triAA(6, ...triAngles(R).slice(0, 2) as [number, number]);
  const k = pick(R, [1.5, 2, 0.6, 0.5, 1.4]);
  const { labels: qL } = permLetters(R, L2);
  const src = L1.split(''), N = src.length;
  const Q = place(P0, { k });
  const askSide = R() < 0.55;
  const pic = paperPair({ pts: P0, role: 'first', labels: src }, { pts: Q, role: 'pick', labels: qL });
  const stmt = simH(L1, qL.join('')), stmtT = simT(L1, qL.join(''));
  const P1 = pic.figs[0]!.pts, Q1 = pic.figs[1]!.pts;
  const key = (a: string, b: string) => [a, b].sort().join('');
  if (askSide) {
    // a side whose letter-order partner is a different side
    const cand = Array.from({ length: N }, (_, i) => i).filter(i => key(qL[i]!, qL[(i + 1) % N]!) !== key(L2[i]!, L2[(i + 1) % N]!));
    const i = pick(R, cand.length ? cand : [0]);
    const sName = src[i]! + src[(i + 1) % N]!, right = qL[i]! + qL[(i + 1) % N]!, byLetters = L2[i]! + L2[(i + 1) % N]!;
    if (key(right[0]!, right[1]!) === key(byLetters[0]!, byLetters[1]!)) return corrSide(R, n);
    // the side of the image that LOOKS as long as sName
    const sl = sides(P1)[i]!, qs = sides(Q1);
    const others = Array.from({ length: N }, (_, j) => j).map(j => ({ j, name: qL[j]! + qL[(j + 1) % N]! })).filter(x => key(x.name[0]!, x.name[1]!) !== key(right[0]!, right[1]!) && key(x.name[0]!, x.name[1]!) !== key(byLetters[0]!, byLetters[1]!));
    const third = others.sort((a, b) => Math.abs(qs[a.j]! - sl) - Math.abs(qs[b.j]! - sl))[0]!;
    const looksLike = Math.abs(qs[third.j]! - sl) < Math.abs(qs[i]! - sl);
    pic.hi = [{ fig: 0, side: i }, { fig: 1, side: i }];
    return choice(R, {
      id: `corrSide-${n}`, family: 'corrSide', picture: pic, board: stmtT,
      prompt: `${stmt}. Which side of ${nameH(qL.join(''))} corresponds to ${A(sName)}?`,
      solution: [`The statement pairs the letters in order: ${src.map((s, j) => `${s} ↔ ${qL[j]}`).join(', ')}.`, `${sName} joins ${src[i]} and ${src[(i + 1) % N]}, so its partner joins ${qL[i]} and ${qL[(i + 1) % N]}: ${S(right)}.`],
    }, [
      { t: `side ${right}`, ok: true, say: `Yes. ${src[i]} ↔ ${qL[i]} and ${src[(i + 1) % N]} ↔ ${qL[(i + 1) % N]}, so ${sName} ↔ ${right}.` },
      { t: `side ${byLetters}`, mc: MC.letters, say: `That pairs the letters by alphabet order. Read the statement: ${src[i]} goes with ${qL[i]}, and ${src[(i + 1) % N]} with ${qL[(i + 1) % N]}.` },
      { t: `side ${third.name}`, mc: looksLike ? MC.apparent : undefined, say: `Don't match by how long a side looks. The statement says ${src[i]} ↔ ${qL[i]} and ${src[(i + 1) % N]} ↔ ${qL[(i + 1) % N]}.` },
    ]);
  }
  const cand = Array.from({ length: N }, (_, i) => i).filter(i => qL[i] !== L2[i]);
  const i = pick(R, cand);
  const right = qL[i]!, byLetters = L2[i]!;
  const third = L2.split('').filter(x => x !== right && x !== byLetters);
  const t3 = pick(R, third);
  pic.hiAng = [{ fig: 0, at: i }, { fig: 1, at: i }];
  return choice(R, {
    id: `corrSide-${n}`, family: 'corrSide', picture: pic, board: stmtT,
    prompt: `${stmt}. Which angle of ${nameH(qL.join(''))} corresponds to ${A('∠' + src[i])}?`,
    solution: [`The statement pairs the letters in order: ${src.map((s, j) => `${s} ↔ ${qL[j]}`).join(', ')}.`, `${src[i]} is letter ${i + 1} of ${L1}, so its partner is letter ${i + 1} of ${qL.join('')}: ${S('∠' + right)}.`],
  }, [
    { t: `∠${right}`, ok: true, say: `Yes. ${src[i]} is letter ${i + 1} of ${L1}, and letter ${i + 1} of ${qL.join('')} is ${right}.` },
    { t: `∠${byLetters}`, mc: MC.letters, say: `That pairs by alphabet order. In the statement, ${src[i]} sits in the same place as ${right}.` },
    { t: `∠${t3}`, say: `Count the places in the statement: ${src[i]} is letter ${i + 1}, so its partner is letter ${i + 1} of ${qL.join('')}.` },
  ]);
};

/** write the similarity statement from a mapping (sg1) or from the angles (sg8) */
const corrStatement: Gen = (R, n, sg) => {
  const turned = sg === 'correspondence-across-orientation';
  const [L1, L2] = pick(R, LET3);
  const [a, b, c] = triAngles(R);
  const P0 = triAA(6, a, b);
  const k = pick(R, [1.5, 2, 0.6, 0.5, 1.3]);
  const { labels: qL } = permLetters(R, L2);
  const lk = look(R, !turned);
  const Q = place(P0, { k, ...lk });
  const ang = [a, b, c];
  const pic = paperPair(
    { pts: P0, role: 'first', labels: L1.split(''), angs: turned ? ang.map(deg) : undefined },
    { pts: Q, role: 'pick', labels: qL, angs: turned ? ang.map(deg) : undefined },
  );
  const right = qL.join('');
  // by page position: the image's letters read in the order of the original's corners left to right
  const P1 = pic.figs[0]!.pts, Q1 = pic.figs[1]!.pts;
  const rank = (X: V[]) => X.map((_, i) => i).sort((p, q) => X[p]![0] - X[q]![0]);
  const rp = rank(P1), rq = rank(Q1), byPos = Array(3).fill('') as string[];
  rp.forEach((pi, j) => { byPos[pi] = qL[rq[j]!]!; });
  const pos = byPos.join(''), alpha = L2;
  const opts: Opt[] = [{ t: simH(L1, right), ok: true, say: turned ? `Yes. Equal angles go together: ${L1.split('').map((s, j) => `${s} ↔ ${qL[j]} (${deg(ang[j]!)})`).join(', ')}.` : `Yes. Write the partners in the same order: ${L1.split('').map((s, j) => `${s} → ${qL[j]}`).join(', ')}.` }];
  const seen = new Set([right]);
  if (!seen.has(alpha)) { seen.add(alpha); opts.push({ t: simH(L1, alpha), mc: MC.letters, say: `That just lists the letters in alphabet order. ${L1[0]} goes with ${qL[0]}${turned ? ', the corner with the same angle' : ''}.` }); }
  if (turned && !seen.has(pos)) { seen.add(pos); opts.push({ t: simH(L1, pos), mc: MC.letters, say: `That matches corners by where they sit on the page. The second triangle is ${lk.flip ? 'flipped' : 'turned'}: match equal angles instead.` }); }
  for (const p of ['012', '021', '102', '120', '201', '210']) {
    if (opts.length >= 3) break;
    const s = p.split('').map(d => L2[Number(d)]!).join('');
    if (!seen.has(s)) { seen.add(s); opts.push({ t: simH(L1, s), say: turned ? `Check the angles: ${L1[0]} is ${deg(ang[0]!)}, so its partner is the ${deg(ang[0]!)} corner, ${qL[0]}.` : `Use the mapping in order: ${L1[0]} → ${qL[0]}, ${L1[1]} → ${qL[1]}, ${L1[2]} → ${qL[2]}.` }); }
  }
  pic.hiAng = [{ fig: 0, at: 0 }, { fig: 1, at: 0 }];
  return choice(R, {
    id: `corrStatement-${n}`, family: 'corrStatement', picture: pic, board: `${triT(L1)} \\sim \\triangle\\,?`,
    prompt: turned
      ? `The triangles are similar; ${nameH(L1)} has angles ${L1[0]} = ${a}°, ${L1[1]} = ${b}°, ${L1[2]} = ${c}°. Use the angles to complete the statement ${nameH(L1)} ~ ${tri('___')}.`
      : `A dilation and a slide map ${L1[0]} → ${qL[0]}, ${L1[1]} → ${qL[1]}, ${L1[2]} → ${qL[2]}. Which statement is right?`,
    solution: turned
      ? [`Match equal angles: ${L1.split('').map((s, j) => `${s} ↔ ${qL[j]} (${deg(ang[j]!)})`).join(', ')}.`, `Write the partners in the same order: ${S(simH(L1, right))}.`]
      : [`The order of the letters carries the mapping: first with first, second with second, third with third.`, `${L1[0]} → ${qL[0]}, ${L1[1]} → ${qL[1]}, ${L1[2]} → ${qL[2]}: ${S(simH(L1, right))}.`],
  }, opts);
};

/** which corner / side corresponds when the second figure is turned or flipped (angle marks) */
const corrRotated: Gen = (R, n) => {
  const [L1, L2] = pick(R, LET3);
  const [a, b] = triAngles(R);
  const P0 = triAA(6, a, b);
  const k = pick(R, [1.5, 2, 0.6, 0.5, 1.3]);
  const { labels: qL } = permLetters(R, L2, true);
  const lk = look(R, false);
  const Q = place(P0, { k, ...lk });
  const useMarks = R() < 0.6;
  const ang = [a, b, 180 - a - b];
  // marks: 1, 2, 3 arcs by angle size order
  const order = [0, 1, 2].sort((p, q) => ang[p]! - ang[q]!), marks = [0, 0, 0];
  order.forEach((vi, j) => { marks[vi] = j + 1; });
  const pic = paperPair(
    { pts: P0, role: 'first', labels: L1.split(''), marks: useMarks ? marks : undefined, angs: useMarks ? undefined : ang.map(deg) },
    { pts: Q, role: 'pick', labels: qL, marks: useMarks ? marks : undefined, angs: useMarks ? undefined : ang.map(deg) },
  );
  const P1 = pic.figs[0]!.pts, Q1 = pic.figs[1]!.pts;
  const i = int(R, 0, 2);
  const rank = (X: V[], j: number) => X.map((_, t) => t).sort((p, q) => X[p]![0] - X[q]![0]).indexOf(j);
  const posJ = Q1.map((_, t) => t).sort((p, q) => Q1[p]![0] - Q1[q]![0])[rank(P1, i)]!;
  const right = qL[i]!, byPos = qL[posJ]!;
  const how = useMarks ? 'the arcs' : 'the angles';
  const opts: Opt[] = [{ t: right, ok: true, say: `Yes. ${L1[i]} and ${right} have the same ${useMarks ? `${marks[i]} arc${marks[i]! > 1 ? 's' : ''}` : `angle, ${deg(ang[i]!)}`}.` }];
  if (byPos !== right) opts.push({ t: byPos, mc: MC.letters, say: `${byPos} sits where ${L1[i]} sits on the page, but the triangle is ${lk.flip ? 'flipped' : 'turned'}. Match ${how}.` });
  const rest = L2.split('').filter(x => !opts.some(o => o.t === x));
  for (const x of rest) { if (opts.length >= 3) break; opts.push({ t: x, mc: x === L2[i] ? MC.letters : undefined, say: `Look at ${how}: ${L1[i]}'s partner has the same ${useMarks ? 'number of arcs' : 'angle'}.` }); }
  pic.hiAng = [{ fig: 0, at: i }, { fig: 1, at: i }];
  return choice(R, {
    id: `corrRotated-${n}`, family: 'corrRotated', picture: pic, board: `${triT(L1)} \\sim ${triT(L2)}\\ \\text{(some order)}`,
    prompt: `${nameH(L1)} and ${nameH(L2)} are similar, but the second one is ${lk.flip ? 'flipped' : 'turned'}. ${useMarks ? 'Equal arcs mark equal angles.' : ''} Which corner corresponds to ${A(L1[i]!)}?`,
    solution: [`Similar figures keep every angle, so partners have equal angles.`, `${L1[i]} has ${useMarks ? `${marks[i]} arc${marks[i]! > 1 ? 's' : ''}` : deg(ang[i]!)}; so does ${S(right)}.`],
  }, opts);
};

// ======================================================================================================
// 2. dilation-center-ray, 3. dilation-reduction-identity
// ======================================================================================================
const K23 = [kk(2), kk(3)];
/** k in front of a variable: 2x, ½x, 1 · x */
const kxT = (K: K) => (K.n === 1 && K.d === 1 ? '1 \\cdot ' : kT(K));
const KRED = [kk(1, 2), kk(1, 3), kk(3, 4), kk(3, 2), kk(1), kk(1, 2), kk(3, 2)];
function inTri(p: V, T: readonly V[]): boolean {
  const s = (a: V, b: V, c: V) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = s(T[0]!, T[1]!, p), d2 = s(T[1]!, T[2]!, p), d3 = s(T[2]!, T[0]!, p);
  return (d1 > 0 && d2 > 0 && d3 > 0) || (d1 < 0 && d2 < 0 && d3 < 0);
}
const fat = (P: readonly V[]) => angles(P).every(a => a >= 24);
function offsets(R: () => number, m: number): V[] | null {
  const w: V[] = [];
  for (let i = 0; i < 3; i++) w.push([int(R, -m, m), int(R, -m, m)]);
  const area = (w[1]![0] - w[0]![0]) * (w[2]![1] - w[0]![1]) - (w[1]![1] - w[0]![1]) * (w[2]![0] - w[0]![0]);
  if (Math.abs(area) < 2) return null;
  if (w.some((p, i) => w.some((q, j) => j > i && p[0] === q[0] && p[1] === q[1]))) return null;
  return fat(w) ? w : null;
}
const stepsH = (d: V) => {
  const p: string[] = [];
  if (d[0]) p.push(`${numH(Math.abs(d[0]))} ${d[0] > 0 ? 'right' : 'left'}`);
  if (d[1]) p.push(`${numH(Math.abs(d[1]))} ${d[1] > 0 ? 'up' : 'down'}`);
  return p.join(' and ') || 'no steps';
};
function dilWrongs(Pt: V, c: V, K: K, M: V): Wp[] {
  const k = kv(K);
  const w: Wp[] = [];
  if (c[0] !== 0 || c[1] !== 0) w.push({ p: [fix(k * Pt[0]), fix(k * Pt[1])], mc: MC.ignored, say: `That multiplies the coordinates, which dilates about the origin. Here the center is ${ptH(c)}: count from the center.` });
  w.push({ p: [Pt[0] + k, Pt[1] + k], mc: MC.additive, say: `That adds ${kH(K)} to each coordinate. A dilation multiplies the distance from the center by ${kH(K)}.` });
  const away: V = [Pt[0] + Math.sign(Pt[0] - c[0]) * k, Pt[1] + Math.sign(Pt[1] - c[1]) * k];
  w.push({ p: away, mc: MC.additive, say: `That moves ${kH(K)} more steps away. A dilation multiplies the steps from the center by ${kH(K)}.` });
  w.push({ p: dilate(Pt, M, k), mc: MC.middle, say: `That dilates about the middle of the triangle. The center is ${ptH(c)}, and it stays put.` });
  if (k !== 1) w.push({ p: dilate(Pt, c, 1 / k), mc: k < 1 ? MC.enlarge : K.d > 1 ? MC.fracLess : MC.enlarge, say: k < 1 ? `That moved it farther away. With k = ${kH(K)} (less than 1) the image comes closer to the center.` : `That brought it closer. k = ${kH(K)} is more than 1, so the image moves farther from the center.` });
  return w;
}
/** dilate a point about a center (not the origin): count the steps from the center, multiply them by k */
const dilPoint: Gen = (R, n, sg) => {
  const red = sg === 'dilation-reduction-identity';
  return fit(() => {
    const K = red ? pick(R, KRED) : pick(R, K23);
    const c: V = [int(R, -3, 3), int(R, -3, 3)];
    if (!red && c[0] === 0 && c[1] === 0) return null;
    const m = K.d >= 3 ? 1 : K.n >= 3 || K.d === 2 ? 1 : 2;
    const w = offsets(R, m);
    if (!w) return null;
    const P = w.map(q => [c[0] + K.d * q[0], c[1] + K.d * q[1]] as V);
    if (inTri(c, P) || P.some(q => q[0] === c[0] && q[1] === c[1])) return null;
    const L1 = pick(R, LETC);
    const ai = int(R, 0, 2), Pa = P[ai]!, Pi = dilate(Pa, c, kv(K));
    if (Pa[0] === c[0] || Pa[1] === c[1]) { if (R() < 0.6) return null; }
    const bb = bbox(P), M: V = [(bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2];
    const picture: DilPic = { kind: 'plane', win: planeWin([...P, c, ...dilateAll(P, c, kv(K)), [0, 0]], true), axes: true, figs: [{ pts: P, role: 'first', labels: L1.split('') }], center: { p: c, label: 'P' }, dil: { fig: 0, c, k: K, bars: [ai] } };
    const d: V = [Pa[0] - c[0], Pa[1] - c[1]], dk: V = [fix(d[0] * kv(K)), fix(d[1] * kv(K))];
    return pairItem({
      id: `dilPoint-${n}`, family: 'dilPoint', picture, board: `\\text{center}\\ P${ptT(c)},\\ \\ k = ${kT(K)}`,
      prompt: `Dilate ${tri(L1)} about the center ${B('P' + ptH(c))} with scale factor ${A('k = ' + kH(K))}. Where does ${L1[ai]}${ptH(Pa)} land?`,
      solution: [`From P to ${L1[ai]}: ${stepsH(d)}.`, `Multiply both by ${kH(K)}: ${stepsH(dk)} from P, along the same ray.`, `${L1[ai]}′ = ${S(ptH(Pi))}.`],
    }, Pi, `${L1[ai]}′ (`, `Yes: ${stepsH(dk)} from P puts ${L1[ai]}′ at ${ptH(Pi)}.`, dilWrongs(Pa, c, K, M), `Count the steps from P to ${L1[ai]}, multiply both by ${kH(K)}, and count them again from P.`);
  }, 'dilPoint');
};
/** the center on a vertex or inside the figure */
const dilCenterOn: Gen = (R, n) => fit(() => {
  const K = pick(R, K23), k = kv(K);
  const w = offsets(R, 2);
  if (!w) return null;
  const onVertex = R() < 0.5;
  const c0: V = [int(R, -2, 2), int(R, -2, 2)];
  let P: V[];
  if (onVertex) { const s: V = w[0]!; P = w.map(q => [c0[0] + q[0] - s[0], c0[1] + q[1] - s[1]] as V); }
  else { P = w.map(q => [c0[0] + q[0], c0[1] + q[1]] as V); if (!inTri(c0, P)) return null; }
  const c = c0;
  const L1 = pick(R, LETC);
  let ai = onVertex ? (R() < 0.25 ? 0 : int(R, 1, 2)) : int(R, 0, 2);
  const Pa = P[ai]!, Pi = dilate(Pa, c, k);
  const bb = bbox(P), M: V = [(bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2];
  const picture: DilPic = { kind: 'plane', win: planeWin([...P, c, ...dilateAll(P, c, k), [0, 0]], true), axes: true, figs: [{ pts: P, role: 'first', labels: L1.split('') }], center: { p: c, label: 'P' }, dil: { fig: 0, c, k: K, bars: Pa[0] === c[0] && Pa[1] === c[1] ? [] : [ai] } };
  const d: V = [Pa[0] - c[0], Pa[1] - c[1]];
  const where = onVertex ? `on the corner ${L1[0]}` : 'inside the triangle';
  void ai;
  return pairItem({
    id: `dilCenterOn-${n}`, family: 'dilCenterOn', picture, board: `\\text{center}\\ P${ptT(c)},\\ \\ k = ${kT(K)}`,
    prompt: `The center ${B('P' + ptH(c))} is ${where}. Dilate ${tri(L1)} about P with ${A('k = ' + kH(K))}. Where does ${L1[ai]}${ptH(Pa)} land?`,
    solution: d[0] === 0 && d[1] === 0
      ? [`${L1[ai]} IS the center.`, `The center never moves: ${L1[ai]}′ = ${S(ptH(Pi))}.`]
      : [`From P to ${L1[ai]}: ${stepsH(d)}.`, `${kH(K)} times as far: ${stepsH([d[0] * k, d[1] * k])} from P.`, `${L1[ai]}′ = ${S(ptH(Pi))}.`],
  }, Pi, `${L1[ai]}′ (`, d[0] === 0 && d[1] === 0 ? `Yes: the center stays where it is.` : `Yes: ${L1[ai]}′ is on ray P${L1[ai]}, ${kH(K)} times as far from P.`, dilWrongs(Pa, c, K, M), `Count the steps from P to ${L1[ai]}, multiply both by ${kH(K)}, and count again from P.`);
}, 'dilCenterOn');

/** larger, smaller or the same size? (k < 1, k = 1, k > 1; also as a coordinate rule) */
const kEffect: Gen = (R, n, sg) => {
  const rule = sg === 'coordinate-dilation-origin';
  return fit(() => {
    const K = pick(R, [kk(1, 2), kk(1, 3), kk(3, 4), kk(1), kk(3, 2), kk(5, 2), kk(2), kk(3), kk(2, 3), kk(3, 2)]);
    const k = kv(K), dec = K.d === 2 && K.n === 3 && R() < 0.5;
    const kS = dec ? '1.5' : kH(K);
    const c: V = rule ? [0, 0] : [int(R, -3, 3), int(R, -3, 3)];
    const w = offsets(R, K.d >= 3 ? 1 : 2);
    if (!w) return null;
    const P = w.map(q => [c[0] + K.d * q[0] + (rule ? int(R, -1, 1) * K.d : 0), c[1] + K.d * q[1]] as V);
    if (inTri(c, P) && !rule) return null;
    if (P.some(q => q[0] === c[0] && q[1] === c[1])) return null;
    const L1 = pick(R, LETC);
    const picture: DilPic = { kind: 'plane', win: planeWin([...P, c, ...dilateAll(P, c, k), [0, 0]], true), axes: true, figs: [{ pts: P, role: 'first', labels: L1.split('') }], center: rule ? undefined : { p: c, label: 'P' }, dil: { fig: 0, c, k: K, bars: [0] } };
    const kind = k < 1 ? 'smaller' : k > 1 ? 'larger' : 'same';
    const big = rule ? `an enlargement: every length × ${kS}` : `larger than ${tri(L1)}`;
    const small = rule ? `a reduction: every length × ${kS}` : `smaller than ${tri(L1)}`;
    const same = rule ? 'congruent: the same size and shape' : `the same size as ${tri(L1)}`;
    const why = k < 1 ? `k = ${kS} is less than 1, so every distance from the center shrinks.` : k > 1 ? `k = ${kS} is more than 1, so every distance from the center grows.` : 'k = 1 keeps every distance, so nothing moves.';
    const opts: Opt[] = [
      { t: big, ok: kind === 'larger', mc: kind === 'smaller' ? MC.enlarge : kind === 'same' ? MC.rigid : undefined, say: kind === 'larger' ? `Yes. ${why}` : why },
      { t: small, ok: kind === 'smaller', mc: kind === 'larger' && K.d > 1 ? MC.fracLess : undefined, say: kind === 'smaller' ? `Yes. ${why}` : kind === 'larger' && K.d > 1 ? `${kS} is a fraction, but it is more than 1. ${why}` : why },
      { t: same, ok: kind === 'same', mc: kind !== 'same' ? MC.rigid : undefined, say: kind === 'same' ? `Yes. ${why}` : `Only k = 1 keeps the size. ${why}` },
    ];
    return choice(R, {
      id: `kEffect-${n}`, family: 'kEffect', picture,
      board: rule ? `(x,\\ y) \\to (${dec ? '1.5' : kxT(K)}x,\\ ${dec ? '1.5' : kxT(K)}y)` : `\\text{center}\\ P${ptT(c)},\\ \\ k = ${dec ? '1.5' : kT(K)}`,
      prompt: rule ? `${tri(L1)} is dilated with the rule (x, y) → (${kS}x, ${kS}y). The image is…` : `Dilate ${tri(L1)} about P with ${A('k = ' + kS)}. The image is…`,
      solution: [why, k === 1 ? 'The image lies exactly on the figure: congruent.' : `Every side of the image is ${kS} times as long.`],
    }, opts);
  }, 'kEffect');
};

// ======================================================================================================
// 4. coordinate-dilation-origin
// ======================================================================================================
const KRULE = [kk(2), kk(3), kk(1, 2), kk(1, 3), kk(3, 4), kk(3, 2), kk(5, 2), kk(1), kk(1, 2), kk(2)];
/** (x, y) -> (kx, ky): the image of a vertex in any quadrant */
const ruleImage: Gen = (R, n) => fit(() => {
  const K = pick(R, KRULE), k = kv(K);
  const lim = Math.floor(7 / Math.max(1, k));
  const P: V[] = [];
  for (let i = 0; i < 3; i++) P.push([int(R, -lim, lim), int(R, -lim, lim)]);
  const area = (P[1]![0] - P[0]![0]) * (P[2]![1] - P[0]![1]) - (P[1]![1] - P[0]![1]) * (P[2]![0] - P[0]![0]);
  if (Math.abs(area) < 3 || !fat(P)) return null;
  if (P.some(q => q[0] === 0 && q[1] === 0)) return null;
  // the asked vertex has a negative coordinate and no zero
  const ai = P.findIndex(q => (q[0] < 0 || q[1] < 0) && q[0] !== 0 && q[1] !== 0);
  if (ai < 0) return null;
  if (K.d === 3 && (P[ai]![0] % 3 === 0 || P[ai]![1] % 3 === 0)) return null;
  const [L1] = pick(R, LET3);
  const Pa = P[ai]!, Pi = dilate(Pa, [0, 0], k);
  const picture: DilPic = { kind: 'plane', win: planeWin([...P, ...dilateAll(P, [0, 0], k)], true), axes: true, figs: [{ pts: P, role: 'first', labels: L1.split('') }], dil: { fig: 0, c: [0, 0], k: K, bars: [ai] } };
  const base: Base = {
    id: `ruleImage-${n}`, family: 'ruleImage', picture, board: `(x,\\ y) \\to (${kxT(K)}x,\\ ${kxT(K)}y)`,
    prompt: `Dilate ${tri(L1)} about the origin with ${A('k = ' + kH(K))}. What is the image of ${L1[ai]}${ptH(Pa)}?`,
    solution: [`About the origin, multiply BOTH coordinates by ${kH(K)}.`, `${kH(K)} × ${numH(Pa[0])} = ${numH(Pi[0])} and ${kH(K)} × ${numH(Pa[1])} = ${numH(Pi[1])}.`, `${L1[ai]}′ = ${S(ptH(Pi))}.`],
  };
  const signDrop: V = [Math.abs(Pi[0]), Math.abs(Pi[1])];
  const inv: V = [fix(Pa[0] / k), fix(Pa[1] / k)];
  if (K.d === 3) {
    const opts: Opt[] = [{ t: ptH(Pi), ok: true, say: `Yes: both coordinates times ${kH(K)}.` }];
    const add = (p: V, mc: string | undefined, say: string) => { if (!opts.some(o => o.t === ptH(p))) opts.push({ t: ptH(p), mc, say }); };
    add(inv, MC.enlarge, `That multiplied by 3. With k = ${kH(K)} each coordinate is divided by 3: the image shrinks.`);
    add(signDrop, MC.sign, 'The sizes are right, but a negative coordinate stays negative.');
    add([Pi[0], Pa[1]], MC.oneStep, `Both coordinates get multiplied by ${kH(K)}, not just x.`);
    add([Pa[0], Pi[1]], MC.oneStep, `Both coordinates get multiplied by ${kH(K)}, not just y.`);
    return choice(R, base, opts.slice(0, 4));
  }
  return pairItem(base, Pi, `${L1[ai]}′ (`, `Yes: (${kH(K)} × ${numH(Pa[0])}, ${kH(K)} × ${numH(Pa[1])}) = ${ptH(Pi)}.`, [
    { p: signDrop, mc: MC.sign, say: 'The sizes are right, but a negative coordinate stays negative when you multiply by a positive k.' },
    { p: [Pi[0], Pa[1]], mc: MC.oneStep, say: `Multiply BOTH coordinates by ${kH(K)}, not just x.` },
    { p: [Pa[0], Pi[1]], mc: MC.oneStep, say: `Multiply BOTH coordinates by ${kH(K)}, not just y.` },
    { p: [Pa[0] + k, Pa[1] + k], mc: MC.additive, say: `That adds ${kH(K)}. The rule multiplies: (${kH(K)}x, ${kH(K)}y).` },
    ...(k !== 1 ? [{ p: inv, mc: k < 1 ? MC.enlarge : MC.fracLess, say: k < 1 ? `That divided by ${kH(K)}. Multiply by it: the image comes closer to the origin.` : `That divided. Multiply both coordinates by ${kH(K)}.` }] : []),
  ], `Multiply both coordinates by ${kH(K)}; keep the signs.`);
}, 'ruleImage');

/** the contrast: multiplying the coordinates only works when the center is the origin */
const ruleCenterTrap: Gen = (R, n) => fit(() => {
  const K = pick(R, K23), k = kv(K);
  const c: V = [int(R, -3, 3), int(R, -3, 3)];
  if (c[0] === 0 && c[1] === 0) return null;
  const w = offsets(R, 2);
  if (!w) return null;
  const P = w.map(q => [c[0] + q[0], c[1] + q[1]] as V);
  if (inTri(c, P) || P.some(q => q[0] === c[0] && q[1] === c[1])) return null;
  const L1 = pick(R, LETC);
  const ai = int(R, 0, 2), Pa = P[ai]!, Pi = dilate(Pa, c, k), Mia: V = [k * Pa[0], k * Pa[1]];
  if (Mia[0] === Pi[0] && Mia[1] === Pi[1]) return null;
  const who = pick(R, ['Mia', 'Leo', 'Ava', 'Sam', 'Noah']);
  const picture: DilPic = { kind: 'plane', win: planeWin([...P, c, Mia, ...dilateAll(P, c, k), [0, 0]], true), axes: true, figs: [{ pts: P, role: 'first', labels: L1.split('') }], center: { p: c, label: 'P' }, dil: { fig: 0, c, k: K, bars: [ai] }, pts: [{ p: Mia, label: who[0]!, role: 'pick' }] };
  const add: V = [Pa[0] + k, Pa[1] + k];
  return choice(R, {
    id: `ruleCenterTrap-${n}`, family: 'ruleCenterTrap', picture, board: `\\text{center}\\ P${ptT(c)},\\ \\ k = ${k}`,
    prompt: `Dilate about ${B('P' + ptH(c))} with ${A('k = ' + k)}. ${who} multiplies the coordinates: ${L1[ai]}${ptH(Pa)} → ${ptH(Mia)} (point ${who[0]}). Is that ${L1[ai]}′?`,
    solution: [`(${k}x, ${k}y) dilates about the ORIGIN. This center is P${ptH(c)}.`, `From P to ${L1[ai]}: ${stepsH([Pa[0] - c[0], Pa[1] - c[1]])}; times ${k}: ${stepsH([(Pa[0] - c[0]) * k, (Pa[1] - c[1]) * k])}.`, `${L1[ai]}′ = ${S(ptH(Pi))}.`],
  }, [
    { t: `No: the center is not the origin. ${L1[ai]}′ is ${ptH(Pi)}.`, ok: true, say: `Right. Multiplying the coordinates dilates about (0, 0). About P, count the steps from P.` },
    { t: `Yes: a dilation by ${k} always multiplies both coordinates by ${k}.`, mc: MC.ignored, say: `Only when the center is the origin. Here the center is P${ptH(c)}, and P must stay put.` },
    { t: `No: ${L1[ai]}′ is ${ptH(add)}, ${k} added to each coordinate.`, mc: MC.additive, say: `A dilation multiplies distances from the center; it does not add ${k}.` },
  ]);
}, 'ruleCenterTrap');

// ======================================================================================================
// 5. angle-invariance, 13. missing-angle-direct
// ======================================================================================================
/** the angle at a corner of the image (a dilation keeps every angle) */
const angleKeep: Gen = (R, n) => fit(() => {
  const K = pick(R, [kk(2), kk(3), kk(1, 2), kk(3, 2), kk(5, 2)]), k = kv(K);
  const [a, b, c3] = triAngles(R);
  const T0 = triAA(3, a, b);
  const rot = int(R, -25, 25);
  const T = place(T0, { rot, at: [k < 1 ? 7.5 : 4.6, int(R, -1, 1) * 1.2] });
  const cen: V = [0, 0];
  const Q = dilateAll(T, cen, k);
  const L1 = pick(R, LETC);
  const ai = int(R, 0, 2), ang = [a, b, c3];
  const given = ang.map((x, i) => (i === ai || (i === (ai + 1) % 3 && R() < 0.5) ? deg(x) : null));
  const figs: DFig[] = [{ pts: T, role: 'first', labels: L1.split(''), angs: given }, { pts: Q, role: 'link', labels: L1.split('').map(s => s + '′'), ask: { angle: ai, ans: deg(ang[ai]!) } }];
  const picture: DilPic = { kind: 'paper', win: paperWin(figs, 0.12, [cen]), axes: false, figs, center: { p: cen, label: 'P' }, dil: { fig: 0, c: cen, k: K, given: true } };
  return numItem({
    id: `angleKeep-${n}`, family: 'angleKeep', picture, board: `k = ${kT(K)},\\ \\ \\angle ${L1[ai]} = ${ang[ai]}^\\circ`,
    prompt: `${tri(L1.split('').map(s => s + '′').join(''))} is the image of ${tri(L1)} under a dilation about P with ${A('k = ' + kH(K))}. ∠${L1[ai]} = ${ang[ai]}°. What is ∠${L1[ai]}′?`,
    solution: [`A dilation stretches the sides of an angle along their own lines; it does not turn them.`, `So ∠${L1[ai]}′ = ∠${L1[ai]} = ${S(deg(ang[ai]!))}. Only lengths get multiplied by ${kH(K)}.`],
  }, ang[ai]!, '°', `Yes: angles stay the same. Only lengths change.`, [
    { v: ang[ai]! * k, mc: MC.scalesAngles, say: `A dilation multiplies lengths by ${kH(K)}, not angles. The corner keeps its shape.` },
    { v: ang[ai]! / k, mc: MC.scalesAngles, say: `Angles are not scaled at all: the corner keeps its shape.` },
    { v: 180 - ang[ai]!, say: `That is the angle next to it on a straight line. The image's corner has the same opening as ${L1[ai]}.` },
  ], `The image's corner has the same opening as ∠${L1[ai]}.`);
}, 'angleKeep');

/** clockwise or counterclockwise after a dilation */
const orientKeep: Gen = (R, n) => fit(() => {
  const K = pick(R, [kk(2), kk(3), kk(1, 2), kk(3, 2), kk(1, 3)]), k = kv(K);
  const c: V = [int(R, -3, 3), int(R, -3, 3)];
  const w = offsets(R, K.d >= 3 ? 1 : 2);
  if (!w) return null;
  const P = w.map(q => [c[0] + K.d * q[0], c[1] + K.d * q[1]] as V);
  if (inTri(c, P) || P.some(q => q[0] === c[0] && q[1] === c[1])) return null;
  const L1 = pick(R, LETC);
  const o = orientOf(P), way = o > 0 ? 'counterclockwise' : 'clockwise', other = o > 0 ? 'clockwise' : 'counterclockwise';
  const picture: DilPic = { kind: 'plane', win: planeWin([...P, c, ...dilateAll(P, c, k)], false), axes: false, figs: [{ pts: P, role: 'first', labels: L1.split(''), order: true }], center: { p: c, label: 'P' }, dil: { fig: 0, c, k: K } };
  return choice(R, {
    id: `orientKeep-${n}`, family: 'orientKeep', picture, board: `k = ${kT(K)}`,
    prompt: `${L1[0]} → ${L1[1]} → ${L1[2]} goes ${A(way)}. Dilate about P with ${A('k = ' + kH(K))}. Which way does ${L1[0]}′ → ${L1[1]}′ → ${L1[2]}′ go?`,
    solution: [`Every point slides along its own ray from P; nothing turns over.`, `So the image goes the same way round: ${S(way)}.`],
  }, [
    { t: way, ok: true, say: `Yes. A dilation with k > 0 never turns a figure over: same way round.` },
    { t: other, mc: MC.reverses, say: `Only a reflection reverses the way round. A dilation pushes every point along its ray, so the order stays ${way}.` },
    { t: `it depends on whether k is more or less than 1`, mc: MC.reverses, say: `Any positive k keeps the order. Shrinking or growing does not flip the figure.` },
  ]);
}, 'orientKeep');

const BOARD_T: Record<string, string> = {
  slide: '\\text{translation}', flipY: '\\text{reflection over the}\\ y\\text{-axis}', flipX: '\\text{reflection over the}\\ x\\text{-axis}',
  turn90: '\\text{rotation}\\ 90^\\circ', turn180: '\\text{rotation}\\ 180^\\circ', dil2: '\\text{dilation},\\ k = 2', dil3: '\\text{dilation},\\ k = 3',
  dilHalf: '\\text{dilation},\\ k = \\tfrac{1}{2}', dil1: '\\text{dilation},\\ k = 1',
};
/** the summary table: what a move keeps (angles, lengths, orientation) */
const propTable: Gen = (R, n) => fit(() => {
  const kinds = ['slide', 'flipY', 'flipX', 'turn90', 'turn180', 'dil2', 'dil3', 'dilHalf', 'dil1'] as const;
  const kd = pick(R, kinds);
  const w = offsets(R, 2);
  if (!w) return null;
  const P = w.map(q => [q[0] + int(R, 1, 3), q[1] + int(R, 1, 3)] as V);
  if (kd === 'dilHalf' && P.some(q => q[0] % 2 || q[1] % 2)) { for (let i = 0; i < 3; i++) P[i] = [P[i]![0] * 2, P[i]![1] * 2]; }
  const m: Move = kd === 'slide' ? slide(pick(R, [-6, -5, 5, 6]), pick(R, [-3, -2, 2, 3])) : kd === 'flipY' ? flipY : kd === 'flipX' ? flipX : kd === 'turn90' ? turn(pick(R, [1, -1])) : kd === 'turn180' ? turn(2) : kd === 'dil2' ? dilM(2) : kd === 'dil3' ? dilM(3) : kd === 'dilHalf' ? dilM(0.5) : dilM(1);
  const Q = mapPts([m], P);
  const [L1] = pick(R, LET3);
  const picture: DilPic = { kind: 'plane', win: planeWin([...P, ...Q], true), axes: true, figs: [{ pts: P, role: 'first', labels: L1.split(''), order: true }, { pts: Q, role: 'pick', labels: L1.split('').map(s => s + '′'), order: true }], seq: { fig: 0, moves: [m], to: 1 } };
  const name = kd === 'slide' ? 'a translation' : kd === 'flipY' ? 'a reflection over the y-axis' : kd === 'flipX' ? 'a reflection over the x-axis' : kd === 'turn90' ? 'a 90° rotation about the origin' : kd === 'turn180' ? 'a 180° rotation about the origin' : kd === 'dil2' ? 'a dilation by 2 about the origin' : kd === 'dil3' ? 'a dilation by 3 about the origin' : kd === 'dilHalf' ? `a dilation by ${fr(1, 2)} about the origin` : 'a dilation by 1 about the origin';
  const kx = kd === 'dil2' ? '2' : kd === 'dil3' ? '3' : kd === 'dilHalf' ? fr(1, 2) : '';
  const rowT = (ang: string, len: string, ori: string) => `angles ${ang} · lengths ${len} · order ${ori}`;
  const truth = { ang: 'kept', len: kx ? `× ${kx}` : 'kept', ori: kd === 'flipX' || kd === 'flipY' ? 'reversed' : 'kept' };
  const okT = rowT(truth.ang, truth.len, truth.ori);
  const cand: Opt[] = [
    { t: rowT('kept', 'kept', 'kept'), mc: kx ? MC.rigid : undefined, say: kx ? `A dilation by ${kx} changes every length: the image is ${kd === 'dilHalf' ? 'smaller' : 'bigger'}. Only rigid motions keep lengths.` : 'Look at the picture: the image is the mirror image, so the order is reversed.' },
    { t: rowT('kept', kx ? `× ${kx}` : 'kept', 'reversed'), mc: truth.ori === 'kept' ? MC.reverses : undefined, say: 'Only a reflection reverses the order. Follow the arrows in the picture.' },
    { t: rowT(kx ? `× ${kx}` : 'changed', kx ? `× ${kx}` : 'kept', truth.ori), mc: MC.scalesAngles, say: 'No move in this table changes an angle. A dilation only stretches lengths.' },
    { t: rowT('kept', kx ? 'kept' : '× 2', truth.ori === 'kept' ? 'kept' : 'reversed'), mc: kx ? MC.rigid : undefined, say: kx ? `A dilation by ${kx} changes lengths.` : 'Slides, flips and turns keep every length.' },
  ];
  const opts: Opt[] = [{ t: okT, ok: true, say: `Yes: ${name} keeps the angles${kx ? `, multiplies lengths by ${kx}` : ' and the lengths'}, and ${truth.ori === 'kept' ? 'keeps' : 'reverses'} the order.` }];
  for (const o of shuffle(R, cand)) { if (opts.length >= 3) break; if (!opts.some(x => x.t === o.t)) opts.push(o); }
  return choice(R, {
    id: `propTable-${n}`, family: 'propTable', picture, board: BOARD_T[kd]!,
    prompt: `${tri(L1)} → ${tri(L1.split('').map(s => s + '′').join(''))} by ${name}. Which row of the summary table is right?`,
    solution: [`Every move here keeps angles.`, kx ? `A dilation by ${kx} multiplies every length by ${kx}; it keeps the order (no flip).` : truth.ori === 'reversed' ? 'A reflection keeps lengths but reverses the order.' : 'Slides and turns keep lengths and the order: the image is congruent.', `Row: ${S(okT)}.`],
  }, opts);
}, 'propTable');

// ======================================================================================================
// 6. proportional-sides-common-ratio, 9. directed-scale-factor (grid)
// ======================================================================================================
function gridShape(R: () => number, d: number): V[] {
  const kind = pick(R, ['rect', 'tri', 'trap']);
  const a = d * int(R, 1, 2), b = d * int(R, 1, 2) + (R() < 0.5 ? d : 0);
  if (kind === 'rect') return a === b ? rectP(a + d, b) : rectP(a, b);
  if (kind === 'tri') return [[0, 0], [a + d, 0], [0, b]];
  return [[0, 0], [a + d, 0], [a, b], [0, b]];
}
const coord = (p: V) => (p[0] !== 0 ? p[0] : p[1]);
const gridLen = (p: V, q: V) => (p[0] === q[0] ? Math.abs(q[1] - p[1]) : p[1] === q[1] ? Math.abs(q[0] - p[0]) : null);
const lensOf = (P: readonly V[]) => P.map((p, i) => { const l = gridLen(p, P[(i + 1) % P.length]!); return l === null ? null : lenS(l); });
/** image ÷ original for every side: one shared k (sg6: lengths labeled; sg9: read the grid, either direction) */
const ratioKFam: Gen = (R, n, sg) => {
  const grid = sg === 'directed-scale-factor';
  return fit(() => {
    const K = pick(R, [kk(2), kk(3), kk(1, 2), kk(3, 2), kk(1, 3), kk(2, 3)]), k = kv(K);
    const S0 = gridShape(R, K.d);
    const c: V = grid ? [0, 0] : [int(R, -2, 0), int(R, -2, 0)];
    const off: V = [int(R, 1, 2) * K.d, int(R, 0, 1) * K.d];
    const P = S0.map(q => [c[0] + off[0] + q[0], c[1] + off[1] + q[1]] as V);
    const Q = dilateAll(P, c, k);
    const L1 = pick(R, LETC.concat(LETC4));
    const lab = (L1.length === P.length ? L1 : (P.length === 4 ? 'ABCD' : 'ABC')).split('');
    const back = grid && R() < 0.45;
    const figs: DFig[] = [{ pts: P, role: 'first', labels: lab, lens: grid ? undefined : lensOf(P) }, { pts: Q, role: 'link', labels: lab.map(s => s + '′'), lens: grid ? undefined : lensOf(Q) }];
    const picture: DilPic = { kind: 'plane', win: planeWin([...P, ...Q, c], grid), axes: grid, figs, center: grid ? undefined : { p: c, label: 'P' }, dil: { fig: 0, c, k: K, given: true, bars: grid ? [0] : undefined }, hi: grid ? undefined : [{ fig: 0, side: 0 }, { fig: 1, side: 0 }] };
    const ans = back ? kInv(K) : K;
    const nm = lab.join(''), nm2 = lab.map(s => s + '′').join('');
    const s0 = gridLen(P[0]!, P[1]!)!, t0 = gridLen(Q[0]!, Q[1]!)!;
    const from = back ? nm2 : nm, to = back ? nm : nm2;
    const wr: Wk[] = [
      { k: kv(kInv(ans)), mc: kv(ans) < 1 ? MC.larger : undefined, say: kv(ans) < 1 ? `That divides the larger by the smaller. The scale factor goes FROM ${nameH(from)} TO ${nameH(to)}: new ÷ old, and here the new one is smaller.` : `Flip it: new ÷ old, from ${nameH(from)} to ${nameH(to)}.` },
      { k: Math.abs(t0 - s0), mc: grid ? MC.subtract : MC.addKeep, say: `That is the difference of two lengths. A scale factor is a multiplier: new length ÷ old length.` },
    ];
    return kItem({
      id: `ratioK-${n}`, family: 'ratioK', picture, board: grid ? `k = \\dfrac{\\text{new}}{\\text{old}}` : `\\dfrac{${lab[0]}'${lab[1]}'}{${lab[0]}${lab[1]}} = \\,?`,
      prompt: grid
        ? `${nameH(nm2)} is a dilation of ${nameH(nm)} about the origin. What scale factor takes ${A(nameH(from))} to ${B(nameH(to))}?`
        : `${nameH(nm2)} is a dilation of ${nameH(nm)} about P (${nameH(nm)} has sides ${lensOf(P).filter(x => x).join(', ')}). Divide each side of the image by its partner. Every pair gives the same number: what is it?`,
      solution: grid
        ? [`Read one corner: ${lab[0]}${ptH(P[0]!)} and ${lab[0]}′${ptH(Q[0]!)}.`, `New ÷ old, from ${nameH(from)} to ${nameH(to)}: ${back ? `${numH(coord(P[0]!))} ÷ ${numH(coord(Q[0]!))}` : `${numH(coord(Q[0]!))} ÷ ${numH(coord(P[0]!))}`} = ${S(kH(ans))}.`]
        : [`${lab[0]}′${lab[1]}′ ÷ ${lab[0]}${lab[1]} = ${lenS(t0)} ÷ ${lenS(s0)} = ${kH(K)}.`, `Every other pair gives ${kH(K)} too: one shared multiplier, ${S('k = ' + kH(K))}.`],
    }, ans, `Yes: k = ${kH(ans)}${grid ? '' : ' for every pair of sides'}.`, wr, grid ? `Pick one corner and compare its distance from the origin: new ÷ old.` : `Divide: image side ÷ original side, for one pair.`);
  }, 'ratioK');
};

/** two copies: one has every side × k, the other has every side + a. Which one is a dilation? */
const addVsMult: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3, 2]);
  const tri3 = R() < 0.4;
  const w = int(R, 1, k === 3 ? 2 : 4), h = int(R, 1, k === 3 ? 2 : 4);
  if (w === h) return null;
  const a = (k - 1) * Math.min(w, h);
  const shape = (W: number, H: number): V[] => (tri3 ? [[0, 0], [W, 0], [0, H]] : rectP(W, H));
  const P0 = shape(w, h), M0 = shape(k * w, k * h), A0 = shape(w + a, h + a);
  const mulFirst = R() < 0.5;
  const C1 = mulFirst ? M0 : A0, C2 = mulFirst ? A0 : M0;
  const P = at(P0, 1, 1);
  const x2 = w + 3;
  const Q1 = at(C1, x2, 1), Q2 = at(C2, x2, bbox(C1).y1 + 3);
  const figs: DFig[] = [
    { pts: P, role: 'first', lens: lensOf(P), tag: '' },
    { pts: Q1, role: 'pick', lens: lensOf(Q1), tag: '1' },
    { pts: Q2, role: 'pick', lens: lensOf(Q2), tag: '2' },
  ];
  const right = mulFirst ? 1 : 2, wrongI = 3 - right;
  const Qr = right === 1 ? Q1 : Q2;
  const moves: Move[] = [dilM(k, P[0]!), slide(Qr[0]![0] - P[0]![0], Qr[0]![1] - P[0]![1])];
  const picture: DilPic = { kind: 'plane', win: planeWin([...P, ...Q1, ...Q2, ...mapPts([moves[0]!], P)], false), axes: false, figs, seq: { fig: 0, moves, to: right } };
  const nm = tri3 ? 'triangle' : 'rectangle';
  return choice(R, {
    id: `addVsMult-${n}`, family: 'addVsMult', picture, board: `${w} \\times ${h}`,
    prompt: `The amber ${nm} has sides ${w} and ${h}. Copy 1 has ${bbox(C1).x1} and ${bbox(C1).y1}; copy 2 has ${bbox(C2).x1} and ${bbox(C2).y1}. Which copy is a dilation of it?`,
    solution: [`Copy ${right}: ${k * w} ÷ ${w} = ${k} and ${k * h} ÷ ${h} = ${k}, one multiplier for every side.`, `Copy ${wrongI}: ${w + a} ÷ ${w} and ${h + a} ÷ ${h} are different: ${a} was ADDED to each side, so the shape changed.`],
  }, [
    { t: `copy ${right}`, ok: true, say: `Yes: every side × ${k}. Same shape, ${k} times as big.` },
    { t: `copy ${wrongI}`, mc: MC.addKeep, say: `Copy ${wrongI} adds ${a} to every side. Check the ratios: ${w + a} ÷ ${w} is not ${h + a} ÷ ${h}, so the shape stretched.` },
    { t: 'both copies', mc: MC.addKeep, say: `Only one multiplies. Adding ${a} to every side changes the shape unless the sides were equal.` },
  ]);
}, 'addVsMult');

// ======================================================================================================
// 7. similarity-as-transformations, 20. transformation-witness
// ======================================================================================================
const mWordsH = (m: Move): string => {
  switch (m.kind) {
    case 'dil': return `dilate by ${m.k === 0.5 ? fr(1, 2) : m.k === 1.5 ? fr(3, 2) : m.k} about ${m.c[0] === 0 && m.c[1] === 0 ? 'the origin' : ptH(m.c)}`;
    case 'slide': return `translate ${stepsH(m.d)}`;
    case 'flip': return m.line.kind === 'v' && m.line.x === 0 ? 'reflect over the y-axis' : m.line.kind === 'h' && m.line.y === 0 ? 'reflect over the x-axis' : 'reflect';
    case 'turn': return `rotate ${Math.abs(m.q) === 2 ? '180°' : `90° ${m.q > 0 ? 'counterclockwise' : 'clockwise'}`} about the origin`;
    case 'stretch': return `stretch ${m.kx} times as wide (heights stay)`;
  }
};
const seqH = (ms: readonly Move[]) => ms.map(mWordsH).join(', then ');
function rigidMove(R: () => number): Move {
  const t = int(R, 0, 4);
  return t === 0 ? flipY : t === 1 ? flipX : t === 2 ? turn(pick(R, [1, -1])) : t === 3 ? turn(2) : slide(pick(R, [-5, -4, 4, 5]), pick(R, [-3, -2, 2, 3]));
}
/** carry a vertex through "dilate, then rigid motion(s)" */
const simSeq: Gen = (R, n, sg) => {
  const two = sg === 'transformation-witness' && R() < 0.6;
  return fit(() => {
    const k = pick(R, [2, 3, 0.5, 2]);
    const lim = k === 3 ? 2 : k === 0.5 ? 6 : 3;
    const P: V[] = [];
    for (let i = 0; i < 3; i++) P.push([int(R, -lim, lim), int(R, -lim, lim)]);
    if (k === 0.5 && P.some(q => q[0] % 2 || q[1] % 2)) return null;
    const area = (P[1]![0] - P[0]![0]) * (P[2]![1] - P[0]![1]) - (P[1]![1] - P[0]![1]) * (P[2]![0] - P[0]![0]);
    if (Math.abs(area) < 3 || !fat(P)) return null;
    const ms: Move[] = [dilM(k), rigidMove(R)];
    if (two) { const m2 = rigidMove(R); if (m2.kind === ms[1]!.kind) return null; ms.push(m2); }
    const Q = mapPts(ms, P);
    const [L1] = pick(R, LET3);
    const ai = int(R, 0, 2), Pa = P[ai]!, Qa = Q[ai]!;
    const primes = '′'.repeat(ms.length);
    const picture: DilPic = { kind: 'plane', win: planeWin([...P, ...Q, ...mapPts([ms[0]!], P)], true), axes: true, figs: [{ pts: P, role: 'first', labels: L1.split('') }, { pts: Q, role: 'link', labels: L1.split('').map(s => s + primes), hidden: true }], seq: { fig: 0, moves: ms } };
    const onlyDil = mv(ms[0]!, Pa), onlyRigid = ms.slice(1).reduce((q, m) => mv(m, q), Pa);
    const swapped = mv(ms[0]!, ms.slice(1).reduce((q, m) => mv(m, q), Pa));
    const steps: V[] = [Pa]; for (const m of ms) steps.push(mv(m, steps[steps.length - 1]!));
    return pairItem({
      id: `simSeq-${n}`, family: 'simSeq', picture, board: ms.length === 2 ? `\\text{dilate, then a rigid motion}` : `\\text{dilate, then two rigid motions}`,
      prompt: `${seqH(ms).replace(/^./, s => s.toUpperCase())}. Where does ${L1[ai]}${ptH(Pa)} end up?`,
      solution: ms.map((m, i) => `${mWordsH(m).replace(/^./, s => s.toUpperCase())}: ${ptH(steps[i]!)} → ${ptH(steps[i + 1]!)}.`).concat([`${L1[ai]}${primes} = ${S(ptH(Qa))}. The image is similar to ${tri(L1)}: same angles, every length × ${k === 0.5 ? fr(1, 2) : k}.`]),
    }, Qa, `${L1[ai]}${primes} (`, `Yes: ${ptH(Qa)}.`, [
      { p: onlyDil, say: 'That is after the dilation only. Now apply the next move to that point.' },
      { p: onlyRigid, say: `That skips the dilation. Start by multiplying both coordinates by ${k === 0.5 ? fr(1, 2) : k}.` },
      ...(ms.length === 2 ? [{ p: swapped, say: 'Do the moves in the order given: the dilation first.' }] : []),
    ], 'Do one move at a time, in order, starting from the original point.');
  }, 'simSeq');
};

/** is the image similar? (dilation + rigid, k = 1, or a one-way stretch) */
const simYesNo: Gen = (R, n) => fit(() => {
  const kind = pick(R, ['dilRigid', 'dilRigid', 'k1', 'stretch']);
  const lim = 3;
  const P: V[] = [];
  for (let i = 0; i < 3; i++) P.push([int(R, -lim, lim), int(R, -lim, lim)]);
  const area = (P[1]![0] - P[0]![0]) * (P[2]![1] - P[0]![1]) - (P[1]![1] - P[0]![1]) * (P[2]![0] - P[0]![0]);
  if (Math.abs(area) < 3 || !fat(P)) return null;
  const k = pick(R, [2, 3]);
  const r1 = R() < 0.6 ? pick(R, [flipY, flipX, turn(1), turn(-1), turn(2)]) : rigidMove(R);
  const wide = R() < 0.5;
  const st: Move = { kind: 'stretch', kx: wide ? 2 : 1, ky: wide ? 1 : 2 };
  const ms: Move[] = kind === 'stretch' ? [st] : kind === 'k1' ? [dilM(1), r1] : [dilM(k), r1];
  const Q = mapPts(ms, P);
  if (kind === 'stretch' && P.some(q => (wide && q[0] === 0) || (!wide && q[1] === 0))) return null;
  const picture: DilPic = { kind: 'plane', win: planeWin([...P, ...Q], true), axes: true, figs: [{ pts: P, role: 'first', tag: 'P' }, { pts: Q, role: 'pick', tag: 'Q' }], seq: { fig: 0, moves: ms, to: kind === 'stretch' ? undefined : 1 } };
  const how = kind === 'stretch' ? `stretching P to ${wide ? 'twice as wide (heights stay the same)' : 'twice as tall (widths stay the same)'}` : seqH(ms);
  const base: Base = { id: `simYesNo-${n}`, family: 'simYesNo', picture, board: kind === 'stretch' ? `(x,\\ y) \\to (${wide ? '2x,\\ y' : 'x,\\ 2y'})` : `\\text{dilate by ${kind === 'k1' ? 1 : k}, then a rigid motion}`, prompt: `Q was made from P by ${how}. Are P and Q similar?`, solution: [] };
  if (kind === 'stretch') return choice(R, { ...base, solution: ['A stretch in one direction multiplies widths and heights by different numbers.', 'The side ratios differ and the angles change: ' + S('not similar') + '.'] }, [
    { t: 'No: a one-way stretch is not a dilation; the angles and side ratios change.', ok: true, say: 'Right. Similar means a dilation (same factor every way) plus rigid motions.' },
    { t: 'Yes: Q looks like a bigger P.', mc: MC.looks, say: 'Looking alike is not enough. Compare a slanted side: it did not grow by the same factor as the others.' },
    { t: 'Yes: Q was made from P by one transformation.', say: 'Only dilations and rigid motions make similar figures. A one-way stretch distorts the shape.' },
  ]);
  if (kind === 'k1') return choice(R, { ...base, solution: [`A dilation by 1 keeps every length; then ${mWordsH(r1)} keeps them too.`, `Congruent figures are similar with k = 1: ${S('similar')}.`] }, [
    { t: 'Yes: k = 1 is allowed, so congruent figures are similar too.', ok: true, say: 'Yes. Similar allows any positive k, including 1.' },
    { t: `No: Q is ${r1.kind === 'flip' ? 'flipped' : 'moved'}, so it is not similar.`, mc: MC.flipped, say: 'Rigid motions are allowed in a similarity: facing another way does not matter.' },
    { t: 'No: nothing was enlarged, so they are only congruent.', say: 'Congruent figures are also similar, with k = 1.' },
  ]);
  return choice(R, { ...base, solution: [`Similar means: a dilation, then rigid motions. Here: ${seqH(ms)}.`, `So P and Q are ${S('similar')}, with k = ${k}.`] }, [
    { t: 'Yes: a dilation followed by a rigid motion makes similar figures.', ok: true, say: `Yes. That is exactly the definition of similar, with k = ${k}.` },
    { t: `No: Q ${r1.kind === 'flip' ? 'is flipped' : r1.kind === 'turn' ? 'is turned' : 'has moved'}, so it is not similar.`, mc: MC.flipped, say: 'Turned, flipped or moved copies still count. Rigid motions are part of a similarity.' },
    { t: 'No: similar figures have to be the same size.', mc: MC.rigid, say: `Similar figures may differ in size: the dilation by ${k} changes the size on purpose.` },
  ]);
}, 'simYesNo');

/** which sequence maps the WHOLE figure onto the other one? */
const witnessPick: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3, 0.5, 2]);
  const lim = k === 3 ? 2 : k === 0.5 ? 6 : 3;
  const P: V[] = [];
  for (let i = 0; i < 3; i++) P.push([int(R, -lim, lim), int(R, -lim, lim)]);
  if (k === 0.5 && P.some(q => q[0] % 2 || q[1] % 2)) return null;
  const area = (P[1]![0] - P[0]![0]) * (P[2]![1] - P[0]![1]) - (P[1]![1] - P[0]![1]) * (P[2]![0] - P[0]![0]);
  if (Math.abs(area) < 3 || !fat(P)) return null;
  const r1 = pick(R, [flipY, flipX, turn(1), turn(-1), turn(2)]);
  const ms: Move[] = [dilM(k), r1];
  if (R() < 0.5) ms.push(slide(pick(R, [-3, -2, 2, 3]), pick(R, [-2, 2, 3, -3])));
  const Q = mapPts(ms, P);
  const [L1, L2] = pick(R, LET3);
  const A1 = mv(dilM(k), P[0]!);
  const partial: Move[] = [dilM(k), slide(Q[0]![0] - A1[0], Q[0]![1] - A1[1])];
  const wrongK: Move[] = [dilM(k === 0.5 ? 2 : k === 2 ? 3 : 2), ...ms.slice(1)];
  const maps = (s: Move[]) => mapPts(s, P).every((q, i) => Math.abs(q[0] - Q[i]![0]) < 1e-9 && Math.abs(q[1] - Q[i]![1]) < 1e-9);
  if (maps(partial) || maps(wrongK) || seqH(partial) === seqH(ms)) return null;
  const picture: DilPic = { kind: 'plane', win: planeWin([...P, ...Q, ...mapPts([ms[0]!], P), ...mapPts([ms[0]!, ms[1]!], P)], true), axes: true, figs: [{ pts: P, role: 'first', labels: L1.split('') }, { pts: Q, role: 'pick', labels: L2.split('') }], seq: { fig: 0, moves: ms, to: 1 } };
  return choice(R, {
    id: `witnessPick-${n}`, family: 'witnessPick', picture, board: simT(L1, L2),
    prompt: `${tri(L1)} has ${L1[0]}${ptH(P[0]!)}; ${tri(L2)} has ${L2[0]}${ptH(Q[0]!)}. Which sequence maps ${tri(L1)} onto ${tri(L2)}, every corner onto its partner (${L1[0]} → ${L2[0]}, ${L1[1]} → ${L2[1]}, ${L1[2]} → ${L2[2]})?`,
    solution: [`Follow all three corners through each choice.`, `${seqH(ms)}: ${L1.split('').map((s, i) => `${s} → ${ptH(Q[i]!)}`).join(', ')}. Every corner lands, so this ${S('proves')} ${simH(L1, L2)}.`],
  }, [
    { t: seqH(ms), ok: true, say: 'Yes: every corner lands on its partner. That sequence is the proof.' },
    { t: seqH(partial), mc: MC.partial, say: `That puts ${L1[0]} on ${L2[0]}, but check ${L1[1]} and ${L1[2]}: they miss. One corner is not the whole figure.` },
    { t: seqH(wrongK), say: `Compare the sizes: ${tri(L2)} is ${k === 0.5 ? 'half' : `${k} times`} as big, so the dilation must be by ${k === 0.5 ? fr(1, 2) : k}.` },
  ]);
}, 'witnessPick');

// ======================================================================================================
// 9. directed-scale-factor (paper)
// ======================================================================================================
const KPAIRS: [number, number][] = [[8, 12], [12, 8], [6, 15], [10, 4], [9, 6], [4, 10], [5, 15], [14, 7], [6, 9], [2.4, 3.6], [3.6, 2.4], [1.5, 4.5], [3.2, 4.8], [7, 21], [20, 8], [6, 4], [9, 12], [16, 12]];
const kFromSides: Gen = (R, n) => {
  const [s, t] = pick(R, KPAIRS);
  const [L1, L2] = pick(R, LET3);
  const T = pick(R, SSS);
  const P0 = triSSS(...T).map(q => [q[0] * s / T[0], q[1] * s / T[0]] as V);
  const lk = look(R, R() < 0.5);
  const Q = place(P0, { k: t / s, ...lk });
  const other = T[1] * s / T[0];
  const pic = paperPair({ pts: P0, role: 'first', labels: L1.split(''), lens: [lenS(s), near(other * 10, Math.round(other * 10)) ? lenS(other) : null, null] }, { pts: Q, role: 'pick', labels: L2.split(''), lens: [lenS(t), null, null] });
  pic.hi = [{ fig: 0, side: 0 }, { fig: 1, side: 0 }];
  const back = R() < 0.4;
  const from = back ? L2 : L1, to = back ? L1 : L2;
  const ans = back ? ratioK(s, t) : ratioK(t, s);
  const big = Math.max(s, t), small = Math.min(s, t);
  return kItem({
    id: `kFromSides-${n}`, family: 'kFromSides', picture: pic, board: `${simT(L1, L2)},\\ \\ ${L1[0]}${L1[1]} = ${lenS(s)},\\ ${L2[0]}${L2[1]} = ${lenS(t)}`,
    prompt: `${simH(L1, L2)}. What is the scale factor ${A('from ' + tri(from))} ${B('to ' + tri(to))}?`,
    solution: [`From ${tri(from)} to ${tri(to)}: new ÷ old = ${back ? `${L1[0]}${L1[1]} ÷ ${L2[0]}${L2[1]}` : `${L2[0]}${L2[1]} ÷ ${L1[0]}${L1[1]}`}.`, `${back ? `${lenS(s)} ÷ ${lenS(t)}` : `${lenS(t)} ÷ ${lenS(s)}`} = ${S(kH(ans))}${kv(ans) < 1 ? ' (less than 1: a reduction)' : ''}.`],
  }, ans, `Yes: k = ${kH(ans)}.`, [
    { k: big / small, mc: kv(ans) < 1 ? MC.larger : undefined, say: `That is larger ÷ smaller. Go in the stated direction: ${tri(to)}'s side ÷ ${tri(from)}'s side${kv(ans) < 1 ? ', which is less than 1 here' : ''}.` },
    { k: small / big, say: `That is the other direction. New ÷ old, with ${tri(to)} as the new figure.` },
    { k: Math.abs(t - s), mc: MC.subtract, say: `That is the difference, ${lenS(Math.abs(t - s))}. A scale factor is what you MULTIPLY by: divide the lengths.` },
  ], `Divide: the side of ${tri(to)} ÷ its partner in ${tri(from)}.`);
};

// ======================================================================================================
// 10. identify-similar-polygons, 16. refute-universal-claim
// ======================================================================================================
interface PolyData { P: V[]; lens: number[]; angs?: number[]; rights?: number[]; marks?: number[] }
function polyPair(R: () => number, similar: boolean): { a: PolyData; b: PolyData; k: number; kind: string; bad?: number } {
  const kind = pick(R, ['rect', 'para', 'tri']);
  const k = pick(R, [1.5, 2, 2.5, 3, 0.5]);
  if (kind === 'rect') {
    const w = int(R, 3, 8), h = int(R, 2, 6);
    if (w === h) return polyPair(R, similar);
    let W = w * k, H = h * k;
    let bad: number | undefined;
    if (!similar) { if (R() < 0.5) { W += pick(R, [1, -1]); bad = 0; } else { H += pick(R, [1, -1]); bad = 1; } }
    if (W < 1 || H < 1) return polyPair(R, similar);
    return { kind, k, bad, a: { P: rectP(w, h), lens: [w, h, w, h], rights: [0, 1, 2, 3] }, b: { P: rectP(W, H), lens: [W, H, W, H], rights: [0, 1, 2, 3] } };
  }
  if (kind === 'para') {
    const a = pick(R, [60, 70, 110, 120]);
    const w = int(R, 4, 8), s = int(R, 2, 5);
    if (w === s) return polyPair(R, similar);
    let W = w * k, Sd = s * k, bad: number | undefined;
    if (!similar) { if (R() < 0.5) { W += pick(R, [1, 2]); bad = 0; } else { Sd += pick(R, [1, -1]); bad = 1; } }
    if (W < 1 || Sd < 1) return polyPair(R, similar);
    const angs = [a, 180 - a, a, 180 - a];
    return { kind, k, bad, a: { P: paraP(w, s, a), lens: [w, s, w, s], angs }, b: { P: paraP(W, Sd, a), lens: [W, Sd, W, Sd], angs } };
  }
  const T = pick(R, SSS);
  const B = T.map(x => x * k);
  let bad: number | undefined;
  if (!similar) { bad = int(R, 0, 2); B[bad] = B[bad]! + pick(R, [1, -1]); }
  if (!validTri(B)) return polyPair(R, similar);
  const PA = triSSS(...T), PB = triSSS(B[0]!, B[1]!, B[2]!);
  const angA = angles(PA), order = [0, 1, 2].sort((p, q) => angA[p]! - angA[q]!), marks = [0, 0, 0];
  order.forEach((vi, j) => { marks[vi] = j + 1; });
  return { kind, k, bad, a: { P: PA, lens: [...T], marks }, b: { P: PB, lens: B, marks: similar ? marks : undefined } };
}
const simCheck: Gen = (R, n) => {
  const similar = R() < 0.45;
  const d = polyPair(R, similar);
  const [L1, L2] = pick(R, d.a.P.length === 4 ? LET4 : LET3);
  const lk = look(R, R() < 0.6);
  const Q = place(d.b.P, lk);
  const pic = paperPair(
    { pts: d.a.P, role: 'first', labels: L1.split(''), lens: d.a.lens.map(lenS), angs: d.a.angs?.map(deg), rights: d.a.rights, marks: d.a.marks },
    { pts: Q, role: 'pick', labels: L2.split(''), lens: d.b.lens.map(lenS), angs: d.b.angs?.map(deg), rights: d.b.rights, marks: d.b.marks },
    { sim: similar },
  );
  const r = (i: number) => ratioH(d.b.lens[i]!, d.a.lens[i]!);
  const sa = (i: number) => `${L1[i]}${L1[(i + 1) % L1.length]}`, sb = (i: number) => `${L2[i]}${L2[(i + 1) % L2.length]}`;
  const quad = d.a.P.length === 4;
  const nm = quad ? `${L1} and ${L2}` : `${tri(L1)} and ${tri(L2)}`;
  if (similar) {
    pic.hi = d.a.P.map((_, i) => ({ fig: 0, side: i }));
    return choice(R, {
      id: `simCheck-${n}`, family: 'simCheck', picture: pic, board: `\\dfrac{${sb(0)}}{${sa(0)}},\\ \\dfrac{${sb(1)}}{${sa(1)}},\\ \\ldots`,
      prompt: `Are ${nm} similar (${L1[0]} ↔ ${L2[0]}, ${L1[1]} ↔ ${L2[1]}, …)? Check the data.`,
      solution: [`Every side ratio: ${d.a.lens.map((_, i) => `${lenS(d.b.lens[i]!)} ÷ ${lenS(d.a.lens[i]!)} = ${r(i)}`).slice(0, 3).join(', ')}.`, `${quad && d.a.rights ? 'All angles are 90°' : 'Every angle matches its partner'}. One k and equal angles: ${S('similar')}.`],
    }, [
      { t: `Similar: every side ratio is ${r(0)} and every angle matches.`, ok: true, say: `Yes: one shared ratio, ${r(0)}, and equal angles.` },
      { t: `Not similar: the sides grew by different amounts.`, mc: MC.addKeep, say: `Similar figures grow by the same FACTOR, not the same amount. Divide: every pair gives ${r(0)}.` },
      { t: `Not similar: one of them is bigger.`, mc: MC.rigid, say: 'Similar figures may have different sizes. Check the ratios and the angles.' },
    ]);
  }
  const bad = d.bad!, good = bad === 0 ? 1 : 0;
  pic.hi = [{ fig: 0, side: bad }, { fig: 1, side: bad }];
  return choice(R, {
    id: `simCheck-${n}`, family: 'simCheck', picture: pic, board: `\\dfrac{${sb(good)}}{${sa(good)}}\\ \\text{vs}\\ \\dfrac{${sb(bad)}}{${sa(bad)}}`,
    prompt: `Are ${nm} similar (${L1[0]} ↔ ${L2[0]}, ${L1[1]} ↔ ${L2[1]}, …)? Check the data.`,
    solution: [`${sb(good)} ÷ ${sa(good)} = ${r(good)}, but ${sb(bad)} ÷ ${sa(bad)} = ${r(bad)}.`, `No single k works for every side: ${S('not similar')}.`],
  }, [
    { t: `Not similar: ${sb(good)}/${sa(good)} = ${r(good)} but ${sb(bad)}/${sa(bad)} = ${r(bad)}.`, ok: true, say: 'Yes. One pair that breaks the ratio is enough to rule it out.' },
    { t: `Similar: ${sb(good)}/${sa(good)} = ${r(good)}, so the copy is × ${r(good)}.`, mc: MC.oneRatio, say: `One pair is not enough. Check every pair: ${sb(bad)} ÷ ${sa(bad)} = ${r(bad)}.` },
    quad ? { t: 'Similar: every angle matches its partner.', mc: MC.equalAngles, say: 'For four-sided figures equal angles are not enough. The side ratios must match too.' }
      : { t: 'Similar: they look like the same shape.', mc: MC.looks, say: `Looks can fool you. ${sb(bad)} ÷ ${sa(bad)} is not ${r(good)}.` },
  ]);
};

/** two rectangles (equal angles) or two rhombi (equal side ratios): similar or not? */
const rectRhombus: Gen = (R, n) => {
  const rh = R() < 0.45, sim = R() < 0.25;
  const [L1, L2] = pick(R, LET4);
  if (!rh) {
    const w = int(R, 3, 8), h = int(R, 2, 6);
    if (w === h) return rectRhombus(R, n);
    let W: number, H: number;
    if (sim) { const k = pick(R, [1.5, 2, 0.5, 2.5]); W = w * k; H = h * k; } else { W = w + pick(R, [1, 2, 3, 4]); H = h + pick(R, [-1, 1, 2, 3, 5]); if (near(W / w, H / h) || H < 2) return rectRhombus(R, n); }
    const pic = paperPair({ pts: rectP(w, h), role: 'first', labels: L1.split(''), lens: [lenS(w), lenS(h), null, null], rights: [0, 1, 2, 3] }, { pts: rectP(W, H), role: 'pick', labels: L2.split(''), lens: [lenS(W), lenS(H), null, null], rights: [0, 1, 2, 3] }, { sim });
    pic.hi = [{ fig: 0, side: 0 }, { fig: 1, side: 0 }, { fig: 0, side: 1 }, { fig: 1, side: 1 }];
    const r1 = ratioH(W, w), r2 = ratioH(H, h);
    return choice(R, {
      id: `rectRhombus-${n}`, family: 'rectRhombus', picture: pic, board: `${lenS(w)} \\times ${lenS(h)}\\ \\ \\text{and}\\ \\ ${lenS(W)} \\times ${lenS(H)}`,
      prompt: `Rectangle ${L1} is ${lenS(w)} by ${lenS(h)}; rectangle ${L2} is ${lenS(W)} by ${lenS(H)}. Are they similar?`,
      solution: sim ? [`${lenS(W)} ÷ ${lenS(w)} = ${r1} and ${lenS(H)} ÷ ${lenS(h)} = ${r2}: one k.`, `All angles are 90°: ${S('similar')}.`] : [`${lenS(W)} ÷ ${lenS(w)} = ${r1}, but ${lenS(H)} ÷ ${lenS(h)} = ${r2}.`, `Equal angles are not enough: ${S('not similar')}.`],
    }, sim ? [
      { t: `Yes: both sides × ${r1}, and all angles are 90°.`, ok: true, say: `Yes: one k, ${r1}, and equal angles.` },
      { t: 'No: the sides grew by different amounts.', mc: MC.addKeep, say: `Compare by dividing, not subtracting: both ratios are ${r1}.` },
      { t: 'No: two rectangles are never similar.', say: `They can be, when one k works for both sides: here ${r1}.` },
    ] : [
      { t: `No: ${lenS(W)}/${lenS(w)} = ${r1} but ${lenS(H)}/${lenS(h)} = ${r2}.`, ok: true, say: 'Yes. Right angles everywhere, but no single scale factor: not similar.' },
      { t: 'Yes: all their angles are 90°.', mc: MC.equalAngles, say: `Equal angles are not enough for four-sided shapes. The ratios ${r1} and ${r2} differ.` },
      { t: 'Yes: rectangles always have the same shape.', mc: MC.equalAngles, say: `A long thin rectangle and a nearly square one have different shapes. Check: ${r1} vs ${r2}.` },
    ]);
  }
  const a = int(R, 3, 6), b = a + pick(R, [1, 2, 3, -1]);
  const t1 = pick(R, [60, 70, 50, 90]);
  const t2 = sim ? t1 : pick(R, [60, 70, 50, 90, 80].filter(x => x !== t1));
  const pic = paperPair({ pts: paraP(a, a, t1), role: 'first', labels: L1.split(''), lens: [lenS(a), lenS(a), lenS(a), lenS(a)], angs: [deg(t1), deg(180 - t1), null, null], rights: t1 === 90 ? [0, 1, 2, 3] : undefined }, { pts: paraP(b, b, t2), role: 'pick', labels: L2.split(''), lens: [lenS(b), lenS(b), lenS(b), lenS(b)], angs: [deg(t2), deg(180 - t2), null, null], rights: t2 === 90 ? [0, 1, 2, 3] : undefined }, { sim });
  pic.hiAng = [{ fig: 0, at: 0 }, { fig: 1, at: 0 }];
  const r = ratioH(b, a);
  return choice(R, {
    id: `rectRhombus-${n}`, family: 'rectRhombus', picture: pic, board: `\\text{sides}\\ ${a}\\ \\text{and}\\ ${b},\\ \\ ${t1}^\\circ\\ \\text{and}\\ ${t2}^\\circ`,
    prompt: `${L1} is a rhombus with sides ${a} and a ${t1}° angle; ${L2} is a rhombus with sides ${b} and a ${t2}° angle. Are they similar?`,
    solution: sim ? [`Every side ratio is ${b} ÷ ${a} = ${r}.`, `The angles match too: ${S('similar')}.`] : [`Every side ratio is ${r}, BUT the angles differ: ${t1}° vs ${t2}°.`, `A dilation keeps angles, so ${S('not similar')}.`],
  }, sim ? [
    { t: `Yes: every side ratio is ${r} and the angles match.`, ok: true, say: 'Yes: one ratio and equal angles.' },
    { t: 'No: they are different sizes.', mc: MC.rigid, say: 'Size does not matter for similarity: one k and equal angles do.' },
    { t: "Can't tell: rhombi can't be compared.", say: `They can: the ratio is ${r} for every side and the angles match.` },
  ] : [
    { t: `No: the angles are different (${t1}° and ${t2}°).`, ok: true, say: 'Yes. Equal side ratios are not enough: a dilation would keep the angles.' },
    { t: `Yes: every side ratio is ${r}.`, mc: MC.equalRatios, say: `Equal ratios are not enough for four-sided shapes. The ${t1}° corner has no ${t1}° partner.` },
    { t: 'Yes: both are rhombi, so they have the same shape.', mc: MC.equalRatios, say: 'A squashed rhombus and a square are both rhombi, with different shapes.' },
  ]);
};

/** "all rectangles / rhombi / squares / equilateral triangles are similar": true or false? */
const allSimilar: Gen = (R, n) => {
  const claim = pick(R, ['rectangles', 'rhombi', 'squares', 'equilateral triangles', 'rectangles', 'right triangles']);
  const who = pick(R, ['Lena', 'Omar', 'Kai', 'Rosa', 'Eli', 'Maya']);
  const s1 = int(R, 2, 4), kx = pick(R, [2, 1.5, 2.5, 3]);
  let a: V[], b: V[], counter: V[], dataH = '', bT = '', ok = false;
  if (claim === 'rectangles') { const h = s1 + pick(R, [1, 2]); a = rectP(h, s1); b = rectP(h * kx, s1 * kx); counter = rectP(h * kx, s1); dataH = `a ${h} by ${s1} and a ${lenS(h * kx)} by ${lenS(s1 * kx)} rectangle`; bT = `${h} \\times ${s1},\\ ${lenS(h * kx)} \\times ${lenS(s1 * kx)}`; }
  else if (claim === 'rhombi') { const t = pick(R, [60, 70, 50]); a = paraP(s1, s1, t); b = paraP(s1 * kx, s1 * kx, t); counter = rectP(s1 * kx, s1 * kx); dataH = `two rhombi with ${t}° angles, sides ${s1} and ${lenS(s1 * kx)}`; bT = `${t}^\\circ:\\ ${s1},\\ ${lenS(s1 * kx)}`; }
  else if (claim === 'squares') { a = rectP(s1, s1); b = rectP(s1 * kx, s1 * kx); counter = []; ok = true; dataH = `squares with sides ${s1} and ${lenS(s1 * kx)}`; bT = `${s1} \\times ${s1},\\ ${lenS(s1 * kx)} \\times ${lenS(s1 * kx)}`; }
  else if (claim === 'equilateral triangles') { a = triAA(s1, 60, 60); b = triAA(s1 * kx, 60, 60); counter = []; ok = true; dataH = `equilateral triangles with sides ${s1} and ${lenS(s1 * kx)}`; bT = `${s1},\\ ${lenS(s1 * kx)}`; }
  else { a = [[0, 0], [s1 + 1, 0], [0, s1]]; b = a.map(q => [q[0] * kx, q[1] * kx] as V); counter = [[0, 0], [s1 * kx, 0], [0, s1 * kx * 1.8]]; dataH = `right triangles with legs ${s1 + 1}, ${s1} and ${lenS((s1 + 1) * kx)}, ${lenS(s1 * kx)}`; bT = `${s1 + 1},\\ ${s1};\\ ${lenS((s1 + 1) * kx)},\\ ${lenS(s1 * kx)}`; }
  const figs: DFig[] = [{ pts: a, role: 'first', rights: claim === 'rectangles' || claim === 'squares' ? [0, 1, 2, 3] : claim === 'right triangles' ? [0] : undefined }, { pts: b, role: 'first', rights: claim === 'rectangles' || claim === 'squares' ? [0, 1, 2, 3] : claim === 'right triangles' ? [0] : undefined }];
  if (counter.length) figs.push({ pts: counter, role: 'wrong', hidden: true, rights: claim === 'right triangles' ? [0] : claim === 'rhombi' || claim === 'rectangles' ? [0, 1, 2, 3] : undefined });
  const laid = row(figs, 0.3);
  const picture: DilPic = { kind: 'paper', win: paperWin(laid), axes: false, figs: laid };
  const base: Base = { id: `allSimilar-${n}`, family: 'allSimilar', picture, board: `\\text{All ${claim} are similar?}`, prompt: `${who} drew ${dataH}. ${who} says: “All ${claim} are similar.” Is that true?`, solution: [] };
  if (ok) return choice(R, { ...base, solution: [claim === 'squares' ? 'Any square dilates onto any other: every side × (big side ÷ small side), and all angles stay 90°.' : 'Every equilateral triangle has three 60° angles, and all three side ratios are equal.', `So the claim is ${S('true')}.`] }, [
    { t: `True: any two ${claim} have one side ratio for every side and equal angles.`, ok: true, say: 'Yes. The shape is fixed; only the size can change.' },
    { t: `False: ${claim} of different sizes are not similar.`, mc: MC.rigid, say: 'Similar figures may differ in size. One k for every side plus equal angles is all it takes.' },
    { t: `True: the two in the picture are similar, so all of them are.`, mc: MC.examples, say: 'Two examples do not prove a claim about ALL of them. The reason has to work for any pair.' },
  ]);
  const cx = claim === 'rectangles' ? `a ${lenS(bbox(counter).x1)} by ${lenS(bbox(counter).y1)} rectangle is not similar to the ${bbox(a).x1} by ${bbox(a).y1} one` : claim === 'rhombi' ? 'a square is a rhombus too, but its angles are 90°' : `a right triangle with legs ${lenS(s1 * kx)} and ${lenS(s1 * kx * 1.8)} has a different shape`;
  return choice(R, { ...base, solution: [`One counterexample is enough to break an “all” claim.`, `${cx.replace(/^./, s => s.toUpperCase())}: ${S('false')}.`] }, [
    { t: `False: ${cx}.`, ok: true, say: 'Yes. A single counterexample disproves an “all” claim.' },
    { t: `True: ${claim === 'rhombi' ? 'all their sides are equal, so every side ratio matches' : claim === 'right triangles' ? 'they all have a right angle' : 'they all have four right angles'}.`, mc: claim === 'rhombi' ? MC.equalRatios : MC.equalAngles, say: claim === 'right triangles' ? 'One shared angle is not enough. The other angles can differ.' : 'Not enough for four-sided shapes: the angles AND the side ratios must match.' },
    { t: `True: the two in the picture are similar, so all of them are.`, mc: MC.examples, say: 'Examples that work do not prove an “all” claim. Look for one that fails.' },
  ]);
};

// ======================================================================================================
// 11. forward-missing-length, 12. inverse-missing-length
// ======================================================================================================
const lenK: Gen = (R, n, sg) => {
  const inv = sg === 'inverse-missing-length';
  let K: K, dec = false, s: number, t: number;
  if (!inv) { K = pick(R, [kk(1, 2), kk(2, 3), kk(3, 2), kk(2), kk(3), kk(3, 2)]); dec = K.n === 3 && K.d === 2 && R() < 0.4; s = K.d * int(R, 1, Math.floor(30 / K.d)); if (R() < 0.3 && K.d === 1) s = int(R, 2, 12) + 0.5; t = s * kv(K); }
  else {
    if (R() < 0.6) { K = pick(R, [kk(2, 3), kk(3, 2), kk(3, 4), kk(2), kk(3)]); t = K.n * int(R, 2, Math.floor(36 / K.n)); s = t / kv(K); }
    else { K = pick(R, [kk(1, 2), kk(3, 2), kk(5, 2)]); dec = true; t = pick(R, [3, 4.5, 6, 7.5, 9, 10.5, 12, 15, 2.5, 5, 7.5, 12.5]); s = t / kv(K); if (Math.abs(s * 100 - Math.round(s * 100)) > 1e-6) return lenK(R, n, sg); }
  }
  if (s! < 1.5 || t! < 1.5) return lenK(R, n, sg);
  const kS = dec ? numH(kv(K)) : kH(K), kTx = dec ? numT(kv(K)) : kT(K);
  const [L1, L2] = pick(R, LET3);
  const T = pick(R, SSS);
  const P0 = triSSS(...T).map(q => [q[0] * s! / T[0], q[1] * s! / T[0]] as V);
  const Q = place(P0, { k: kv(K), ...look(R, R() < 0.5) });
  const pic = paperPair(
    { pts: P0, role: 'first', labels: L1.split(''), lens: [inv ? null : lenS(s!), null, null], ask: inv ? { side: 0, ans: lenS(s!) } : undefined },
    { pts: Q, role: 'pick', labels: L2.split(''), lens: [inv ? lenS(t!) : null, null, null], ask: inv ? undefined : { side: 0, ans: lenS(t!) } },
  );
  pic.hi = [{ fig: 0, side: 0 }, { fig: 1, side: 0 }];
  const sa = `${L1[0]}${L1[1]}`, sb = `${L2[0]}${L2[1]}`;
  const ans = inv ? s! : t!;
  return numItem({
    id: `lenK-${n}`, family: 'lenK', picture: pic, board: `${simT(L1, L2)},\\ \\ k = ${kTx}`,
    prompt: `${simH(L1, L2)} with scale factor ${A('k = ' + kS)} from ${tri(L1)} to ${tri(L2)}. ${inv ? `${sb} = ${lenS(t!)}. How long is ${sa}?` : `${sa} = ${lenS(s!)}. How long is ${sb}?`}`,
    solution: inv
      ? [`Going back from ${tri(L2)} to ${tri(L1)} undoes the × ${kS}: divide by ${kS}.`, `${sa} = ${lenS(t!)} ÷ ${kS} = ${S(lenS(s!))}.`, `Check: ${lenS(s!)} × ${kS} = ${lenS(t!)}.`]
      : [`${sb} is the image of ${sa}: multiply by k.`, `${sb} = ${lenS(s!)} × ${kS} = ${S(lenS(t!))}.`],
  }, ans, 'units', inv ? `Yes: ${lenS(t!)} ÷ ${kS} = ${lenS(s!)}.` : `Yes: ${lenS(s!)} × ${kS} = ${lenS(t!)}.`, inv ? [
    { v: t! * kv(K), mc: MC.wrongOp, say: `That multiplies again. ${sa} is the ORIGINAL: undo the × ${kS} by dividing.` },
    { v: t! - kv(K), mc: MC.additive, say: `A scale factor multiplies; to undo it, divide by ${kS}.` },
  ] : [
    { v: s! / kv(K), say: `That divides. ${sb} is the image, so multiply ${lenS(s!)} by ${kS}.` },
    { v: s! + kv(K), mc: MC.additive, say: `A scale factor multiplies, it does not add: ${lenS(s!)} × ${kS}.` },
  ], inv ? `Undo the × ${kS}: divide ${lenS(t!)} by ${kS}.` : `Multiply ${lenS(s!)} by ${kS}.`);
};

/** no k given: find it from one full pair, then the missing side (forward or back) */
const lenFig: Gen = (R, n, sg) => {
  const inv = sg === 'inverse-missing-length';
  const K = pick(R, [kk(3, 2), kk(2), kk(1, 2), kk(2, 3), kk(5, 2), kk(3), kk(4, 3)]), k = kv(K);
  const T = pick(R, SSS);
  const m = K.d * (K.d === 1 ? int(R, 1, 3) : 1);
  const a = T.map(x => x * m);
  const b = a.map(x => x * k);
  if (b.some(x => Math.abs(x * 2 - Math.round(x * 2)) > 1e-9) || a.some(x => Math.abs(x * 2 - Math.round(x * 2)) > 1e-9)) return lenFig(R, n, sg);
  const [L1, L2] = pick(R, LET3);
  const P0 = triSSS(a[0]!, a[1]!, a[2]!);
  const Q = place(P0, { k, ...look(R, R() < 0.5) });
  const j = int(R, 1, 2);
  const pic = paperPair(
    { pts: P0, role: 'first', labels: L1.split(''), lens: a.map((x, i) => (i === 0 || (i === j && !inv) ? lenS(x) : null)), ask: inv ? { side: j, ans: lenS(a[j]!) } : undefined },
    { pts: Q, role: 'pick', labels: L2.split(''), lens: b.map((x, i) => (i === 0 || (i === j && inv) ? lenS(x) : null)), ask: inv ? undefined : { side: j, ans: lenS(b[j]!) } },
  );
  pic.hi = [{ fig: 0, side: 0 }, { fig: 1, side: 0 }];
  const s1 = (L: string, i: number) => `${L[i]}${L[(i + 1) % 3]}`;
  const ans = inv ? a[j]! : b[j]!;
  const known = inv ? b[j]! : a[j]!;
  return numItem({
    id: `lenFig-${n}`, family: 'lenFig', picture: pic, board: `${simT(L1, L2)},\\ \\ ${s1(L1, 0)} = ${lenS(a[0]!)},\\ ${s1(L2, 0)} = ${lenS(b[0]!)}`,
    prompt: `${simH(L1, L2)}. ${s1(L1, 0)} = ${lenS(a[0]!)}, ${s1(L2, 0)} = ${lenS(b[0]!)}, and ${inv ? `${s1(L2, j)} = ${lenS(b[j]!)}` : `${s1(L1, j)} = ${lenS(a[j]!)}`}. How long is ${A(inv ? s1(L1, j) : s1(L2, j))}?`,
    solution: [`k from ${tri(L1)} to ${tri(L2)}: ${lenS(b[0]!)} ÷ ${lenS(a[0]!)} = ${kH(K)}.`, inv ? `${s1(L1, j)} is in the original: ${lenS(b[j]!)} ÷ ${kH(K)} = ${S(lenS(a[j]!))}.` : `${s1(L2, j)} is in the image: ${lenS(a[j]!)} × ${kH(K)} = ${S(lenS(b[j]!))}.`],
  }, ans, 'units', `Yes: k = ${kH(K)}, so ${inv ? `${lenS(b[j]!)} ÷ ${kH(K)}` : `${lenS(a[j]!)} × ${kH(K)}`} = ${lenS(ans)}.`, [
    { v: known + (inv ? -1 : 1) * (b[0]! - a[0]!), mc: MC.addKeep, say: `That keeps the same difference, ${lenS(Math.abs(b[0]! - a[0]!))}. Similar figures keep the same RATIO: find k = ${lenS(b[0]!)} ÷ ${lenS(a[0]!)} first.` },
    ...(inv ? [{ v: known * k, mc: MC.wrongOp, say: `${s1(L1, j)} is in the original triangle: divide by k = ${kH(K)}, don't multiply.` }] : [{ v: known / k, say: `${s1(L2, j)} is in the image: multiply by k = ${kH(K)}.` }]),
  ], `Find k = ${lenS(b[0]!)} ÷ ${lenS(a[0]!)} first, then ${inv ? 'divide' : 'multiply'}.`);
};

// ======================================================================================================
// 13. missing-angle-direct, 14. third-angle-across-figures
// ======================================================================================================
const angCorr: Gen = (R, n) => {
  const quad = R() < 0.35;
  const [L1, L2] = pick(R, quad ? LET4 : LET3);
  let P0: V[], ang: number[];
  if (quad) { const q = quadShape(R, 5); P0 = q.pts; ang = q.angs; } else { const t = triAngles(R); P0 = triAA(5, t[0], t[1]); ang = t; }
  const N = P0.length;
  const k = pick(R, [2, 3, 1.5, 0.5]);
  const { labels: qL } = permLetters(R, L2, true);
  const lk = look(R, false);
  const Q = place(P0, { k, ...lk });
  const ai = quad ? pick(R, [0, 1, 2, 3].filter(i => ang[i] !== 90)) : int(R, 0, 2);
  const side = sides(P0)[0]!;
  const pic = paperPair(
    { pts: P0, role: 'first', labels: L1.split(''), angs: ang.map((x, i) => (quad && i === (ai + 2) % 4 ? null : deg(x))), lens: P0.map((_, i) => (i === 0 ? lenS(Math.round(side * 2) / 2) : null)), rights: quad ? ang.map((x, i) => (x === 90 ? i : -1)).filter(i => i >= 0) : undefined },
    { pts: Q, role: 'pick', labels: qL, lens: P0.map((_, i) => (i === 0 ? lenS(Math.round(side * 2) / 2 * k) : null)), ask: { angle: ai, ans: deg(ang[ai]!) }, rights: quad ? ang.map((x, i) => (x === 90 ? i : -1)).filter(i => i >= 0) : undefined },
  );
  pic.hiAng = [{ fig: 0, at: ai }, { fig: 1, at: ai }];
  const st = simH(L1, qL.join(''));
  const others = ang.filter((x, i) => i !== ai && x !== ang[ai]);
  return numItem({
    id: `angCorr-${n}`, family: 'angCorr', picture: pic, board: `${quad ? `${L1} \\sim ${qL.join('')}` : simT(L1, qL.join(''))},\\ \\ k = ${numT(k)}`,
    prompt: `${st}, with scale factor ${numH(k)}. What is ${A('∠' + qL[ai])}?`,
    solution: [`In ${st}, ${L1[ai]} and ${qL[ai]} are in the same place: they correspond.`, `Similar figures keep every angle (the ${numH(k)} only stretches lengths): ∠${qL[ai]} = ∠${L1[ai]} = ${S(deg(ang[ai]!))}.`],
  }, ang[ai]!, '°', `Yes: ∠${qL[ai]} = ∠${L1[ai]} = ${deg(ang[ai]!)}.`, [
    { v: ang[ai]! * k, mc: MC.scalesAngles, say: `The scale factor stretches lengths, not angles. ∠${qL[ai]} equals its partner ∠${L1[ai]}.` },
    { v: ang[ai]! / k, mc: MC.scalesAngles, say: `Angles are not divided by k. ∠${qL[ai]} equals its partner.` },
    ...others.map(v => ({ v, mc: MC.letters, say: `That angle belongs to a different corner. Use the statement: ${L1[ai]} ↔ ${qL[ai]} (same place in ${st}).` })),
  ], `Find the partner of ${qL[ai]} in the statement, and copy its angle.`);
};

function thirdAngle(R: () => number, n: number, flipFam: boolean): DItem {
  const [L1, L2] = pick(R, LET3);
  const [a, b, c] = triAngles(R);
  const P0 = triAA(5, a, b);
  const k = pick(R, [2, 1.5, 0.5, 3]);
  const { labels: qL } = flipFam ? permLetters(R, L2) : { labels: L2.split('') };
  const lk = look(R, !flipFam);
  const Q = place(P0, { k, ...lk });
  const ang = [a, b, c];
  // the known angles: one in each triangle, at different corners; the unknown is the third (asked in one of them)
  const i1 = int(R, 0, 2), i2 = (i1 + int(R, 1, 2)) % 3, i3 = 3 - i1 - i2;
  const askInImage = flipFam ? R() < 0.4 : R() < 0.6;
  const side = sides(P0)[0]!;
  const pic = paperPair(
    { pts: P0, role: 'first', labels: L1.split(''), angs: ang.map((x, i) => (i === i1 ? deg(x) : null)), lens: [lenS(Math.round(side)), null, null], ask: askInImage ? undefined : { angle: i3, ans: deg(ang[i3]!) } },
    { pts: Q, role: 'pick', labels: qL, angs: ang.map((x, i) => (i === i2 ? deg(x) : null)), lens: [lenS(Math.round(side) * k), null, null], ask: askInImage ? { angle: i3, ans: deg(ang[i3]!) } : undefined },
  );
  pic.hiAng = [{ fig: 0, at: i2 }, { fig: 1, at: i1 }];
  const st = simH(L1, qL.join(''));
  const askN = askInImage ? qL[i3]! : L1[i3]!;
  const fam = flipFam ? 'angThirdFlip' : 'angThird';
  return numItem({
    id: `${fam}-${n}`, family: fam, picture: pic, board: `${simT(L1, qL.join(''))},\\ \\ k = ${numT(k)}`,
    prompt: `${st}. ∠${L1[i1]} = ${ang[i1]}° and ∠${qL[i2]} = ${ang[i2]}°. What is ${A('∠' + askN)}?`,
    solution: [`Partners have equal angles: ∠${L1[i2]} = ∠${qL[i2]} = ${ang[i2]}° and ∠${qL[i1]} = ∠${L1[i1]} = ${ang[i1]}°.`, `So ${askInImage ? tri(qL.join('')) : tri(L1)} has ${ang[i1]}° and ${ang[i2]}°; the angles of a triangle add to 180°.`, `∠${askN} = 180° − ${ang[i1]}° − ${ang[i2]}° = ${S(deg(ang[i3]!))}.`],
  }, ang[i3]!, '°', `Yes: 180 − ${ang[i1]} − ${ang[i2]} = ${ang[i3]}.`, [
    { v: 180 - ang[i1]!, say: `That uses only one angle. Copy the other one across first: the triangle has ${ang[i1]}° AND ${ang[i2]}°.` },
    { v: 180 - ang[i2]!, say: `That uses only one angle. ${askInImage ? tri(qL.join('')) : tri(L1)} also has a ${askInImage ? ang[i1] : ang[i2]}° angle, copied from its partner.` },
    { v: ang[i1]!, mc: MC.letters, say: `That is ∠${L1[i1]}, a different corner. ${askN} corresponds to the third corner.` },
    { v: ang[i2]!, mc: MC.letters, say: `That is ∠${qL[i2]}, a different corner. Use the angle sum.` },
    { v: 180 - ang[i1]! - ang[i2]! * k, mc: MC.scalesAngles, say: 'Angles are not scaled by k: copy them across unchanged.' },
    { v: 180 - ang[i1]! * k - ang[i2]!, mc: MC.scalesAngles, say: 'Angles are not scaled by k: copy them across unchanged.' },
  ], 'Copy the known angles across to their partners, then use the angle sum, 180°.');
}
const angThird: Gen = (R, n) => thirdAngle(R, n, false);
const angThirdFlip: Gen = (R, n) => thirdAngle(R, n, true);

// ======================================================================================================
// 15. context-missing-length-units, 23. practical-resizing-claim
// ======================================================================================================
const ctxShadow: Gen = (R, n) => {
  const mixed = R() < 0.55;
  const [small, big] = pick(R, [['Ana', 'tree'], ['post', 'flagpole'], ['Jay', 'building'], ['fence post', 'light pole'], ['sign', 'tower']]);
  const h = int(R, 3, 6), s = int(R, 2, 5), k = int(R, 3, 5);
  if (h === s) return ctxShadow(R, n);
  const H = h * k, Sh = s * k;
  const hIn = h * 12;
  const p1: V[] = [[0, 0], [s, 0], [0, h]], p2: V[] = [[0, 0], [Sh, 0], [0, H]];
  const hLab = mixed ? `${hIn} in` : `${h} ft`;
  const pic = paperPair({ pts: p1, role: 'first', rights: [0], lens: [`${s} ft`, null, hLab], caption: small }, { pts: p2, role: 'pick', rights: [0], lens: [`${Sh} ft`, null, null], ask: { side: 2, ans: `${H} ft` }, caption: big });
  pic.hi = [{ fig: 0, side: 0 }, { fig: 1, side: 0 }];
  return numItem({
    id: `ctxShadow-${n}`, family: 'ctxShadow', picture: pic, board: mixed ? `${hIn}\\ \\text{in} = \\,?\\ \\text{ft}` : `\\dfrac{${Sh}}{${s}} = ${k}`,
    prompt: `At the same moment, a ${small} ${mixed ? `${hIn} inches tall` : `${h} ft tall`} casts a ${s} ft shadow, and the ${big} casts a ${Sh} ft shadow. The sun-ray triangles are similar. How tall is the ${big}, in feet?`,
    solution: mixed ? [`Convert first: ${hIn} in = ${h} ft.`, `Shadows: ${Sh} ÷ ${s} = ${k}, so the ${big} is ${k} times as tall.`, `${h} × ${k} = ${S(H + ' ft')}.`] : [`Shadows: ${Sh} ÷ ${s} = ${k}.`, `The ${big} is ${k} times as tall: ${h} × ${k} = ${S(H + ' ft')}.`],
  }, H, 'ft', `Yes: ${H} ft.`, [
    { v: hIn * k, mc: MC.units, say: `That mixes inches and feet. Convert ${hIn} in to ${h} ft first.` },
    { v: h + (Sh - s), mc: MC.addKeep, say: `Similar triangles keep the ratio, not the difference: multiply by ${k}.` },
    { v: (s * Sh) / h, say: 'Match height with height and shadow with shadow.' },
  ], `Scale factor from the shadows: ${Sh} ÷ ${s}. ${mixed ? 'Convert the inches to feet first. ' : ''}Then multiply the height.`);
};
const ctxMetric: Gen = (R, n) => {
  const [what1, what2] = pick(R, [['photo', 'poster'], ['phone screen', 'wall screen'], ['model door', 'real door'], ['postcard', 'banner']]);
  const w = pick(R, [4, 5, 6, 8, 10]), h = w + pick(R, [2, 3, 4, 5, 6]), k = pick(R, [5, 10, 4, 8, 6]);
  if (w * k > 100 && k >= 8 && R() < 0.5) return ctxMetric(R, n);
  const Wm = (w * k) / 100;
  if (Math.abs(Wm * 100 - Math.round(Wm * 100)) > 1e-9) return ctxMetric(R, n);
  const Hc = h * k;
  const pic = paperPair({ pts: rectP(w, h), role: 'first', rights: [0, 1, 2, 3], lens: [`${w} cm`, `${h} cm`, null, null], caption: what1 }, { pts: rectP(w * k, Hc), role: 'pick', rights: [0, 1, 2, 3], lens: [`${numH(Wm)} m`, null, null, null], ask: { side: 1, ans: `${Hc} cm` }, caption: what2 });
  pic.hi = [{ fig: 0, side: 0 }, { fig: 1, side: 0 }];
  return numItem({
    id: `ctxMetric-${n}`, family: 'ctxMetric', picture: pic, board: `${numT(Wm)}\\ \\text{m} = \\,?\\ \\text{cm}`,
    prompt: `A ${what1} is ${w} cm wide and ${h} cm tall. A similar ${what2} is ${numH(Wm)} m wide. How tall is the ${what2}, in centimeters?`,
    solution: [`Convert first: ${numH(Wm)} m = ${w * k} cm.`, `${w * k} ÷ ${w} = ${k}, so every length × ${k}.`, `${h} × ${k} = ${S(Hc + ' cm')}.`],
  }, Hc, 'cm', `Yes: ${Hc} cm.`, [
    { v: (h * Wm) / w, mc: MC.units, say: `That used ${numH(Wm)} m as if it were ${numH(Wm)} cm. Convert to ${w * k} cm first.` },
    { v: h + (w * k - w), mc: MC.addKeep, say: `Similar figures keep the ratio, not the difference: × ${k}.` },
    { v: h + (Wm - w), mc: MC.units, say: 'Convert to one unit first, then multiply by the scale factor.' },
  ], `Convert ${numH(Wm)} m to cm, find the scale factor, then multiply the height.`);
};
const resize: Gen = (R, n) => {
  const metric = R() < 0.35;
  const u = metric ? 'cm' : pick(R, ['in', 'in', 'ft']);
  const [thing] = pick(R, [['photo'], ['sign'], ['poster'], ['logo'], ['painting']]);
  const w = int(R, 2, 8) * (metric ? 2 : 1), h = w + int(R, 1, 6);
  const k = pick(R, [1.5, 2, 2.5, 3, 0.5, 1.25]);
  const W = w * k, H = h * k;
  if (Math.abs(H * 4 - Math.round(H * 4)) > 1e-9 || W === w) return resize(R, n);
  const pic = paperPair({ pts: rectP(w, h), role: 'first', rights: [0, 1, 2, 3], lens: [`${w} ${u}`, `${h} ${u}`, null, null], caption: thing }, { pts: rectP(W, H), role: 'pick', rights: [0, 1, 2, 3], lens: [`${lenS(W)} ${u}`, null, null, null], ask: { side: 1, ans: `${lenS(H)} ${u}` }, caption: 'resized' }, { sim: true });
  pic.hi = [{ fig: 0, side: 0 }, { fig: 1, side: 0 }];
  return numItem({
    id: `resize-${n}`, family: 'resize', picture: pic, board: `${w} \\times ${h} \\to ${lenS(W)} \\times \\,?`,
    prompt: `A ${thing} is ${w} ${u} wide and ${h} ${u} tall. It is resized to ${lenS(W)} ${u} wide, keeping its shape. How tall is it now?`,
    solution: [`Keeping the shape means similar: one scale factor for width AND height.`, `k = ${lenS(W)} ÷ ${w} = ${numH(k)}.`, `${h} × ${numH(k)} = ${S(lenS(H) + ' ' + u)}.`],
  }, H, u, `Yes: ${lenS(H)} ${u}; both sides × ${numH(k)}.`, [
    { v: h + (W - w), mc: MC.addKeep, say: `Adding the same ${lenS(Math.abs(W - w))} ${u} to both sides stretches the ${thing}. Multiply both by ${numH(k)}.` },
    { v: h, say: 'If only the width changes, the shape is distorted. Both sides get the same factor.' },
    { v: (h * w) / W, say: `Upside down: the factor is new ÷ old = ${lenS(W)} ÷ ${w}.` },
  ], `Find the factor new ÷ old from the widths, then multiply the height.`);
};
const resizeJudge: Gen = (R, n) => {
  const ok = R() < 0.4;
  const [thing] = pick(R, [['screen image'], ['photo'], ['banner'], ['window'], ['map']]);
  const w = int(R, 4, 16), h = int(R, 3, 12);
  if (w === h) return resizeJudge(R, n);
  const k = pick(R, [1.25, 1.5, 2, 0.75, 2.5]);
  const W = w * k;
  const d = W - w;
  const H = ok ? h * k : h + d;
  if (near(H / h, k) !== ok || Math.abs(W * 4 - Math.round(W * 4)) > 1e-9 || Math.abs(H * 4 - Math.round(H * 4)) > 1e-9 || H <= 0) return resizeJudge(R, n);
  const pic = paperPair({ pts: rectP(w, h), role: 'first', rights: [0, 1, 2, 3], lens: [`${w} in`, `${h} in`, null, null], caption: 'before' }, { pts: rectP(W, H), role: ok ? 'pick' : 'pick', rights: [0, 1, 2, 3], lens: [`${lenS(W)} in`, `${lenS(H)} in`, null, null], caption: 'after' }, { sim: ok });
  pic.hi = [{ fig: 0, side: 1 }, { fig: 1, side: 1 }];
  const rw = ratioH(W, w), rh = ratioH(H, h);
  return choice(R, {
    id: `resizeJudge-${n}`, family: 'resizeJudge', picture: pic, board: `${w} \\times ${h} \\to ${lenS(W)} \\times ${lenS(H)}`,
    prompt: `A ${w} in by ${h} in ${thing} is resized to ${lenS(W)} in by ${lenS(H)} in. Does it keep its shape?`,
    solution: [`Same shape means similar: width and height × the same k.`, `${lenS(W)} ÷ ${w} = ${rw}, ${lenS(H)} ÷ ${h} = ${rh}: ${ok ? S('same shape') : S('distorted')}.`],
  }, ok ? [
    { t: `Yes: both sides × ${rw}.`, ok: true, say: `Yes: one factor, ${rw}, for both sides.` },
    { t: `No: the sides grew by different amounts (${lenS(W - w)} and ${lenS(H - h)}).`, mc: MC.addKeep, say: 'Similar copies grow by the same FACTOR, so the amounts differ. Both ratios are equal here.' },
    { t: 'No: any resized picture gets distorted.', say: `Not when both sides get the same factor: ${rw} and ${rh}.` },
  ] : [
    { t: `No: ${lenS(W)}/${w} = ${rw} but ${lenS(H)}/${h} = ${rh}.`, ok: true, say: 'Right: two different factors, so the shape is stretched.' },
    { t: `Yes: both sides grew by ${lenS(d)} in.`, mc: MC.addKeep, say: `Adding the same amount is not scaling: ${rw} is not ${rh}.` },
    { t: 'Yes: it is still a rectangle with four right angles.', mc: MC.equalAngles, say: 'Equal angles are not enough for rectangles: the width and height need one factor.' },
  ]);
};

// ======================================================================================================
// 17. refute-stated-correspondence
// ======================================================================================================
const stmtCheck: Gen = (R, n) => {
  const [L1, L2] = pick(R, LET3);
  const [a, b, c] = triAngles(R);
  const P0 = triAA(5, a, b);
  const k = pick(R, [1.5, 2, 0.5, 2.5]);
  const { labels: qL } = permLetters(R, L2, true);
  const Q = place(P0, { k, ...look(R, false) });
  const ang = [a, b, c];
  const pic = paperPair({ pts: P0, role: 'first', labels: L1.split(''), angs: ang.map(deg) }, { pts: Q, role: 'pick', labels: qL, angs: ang.map(deg) });
  const right = qL.join('');
  const correct = R() < 0.4;
  const perms = ['012', '021', '102', '120', '201', '210'].map(p => p.split('').map(d => L2[Number(d)]!).join('')).filter(s => s !== right);
  const stated = correct ? right : pick(R, perms);
  const other = pick(R, perms.filter(s => s !== stated));
  pic.hiAng = [0, 1, 2].map(i => ({ fig: 0, at: i })).concat([0, 1, 2].map(i => ({ fig: 1, at: i })));
  const base: Base = {
    id: `stmtCheck-${n}`, family: 'stmtCheck', picture: pic, board: simT(L1, stated),
    prompt: `The triangles are similar. Jo writes ${A(simH(L1, stated))}. Is the vertex order right?`,
    solution: [`Match equal angles: ${L1.split('').map((s, j) => `${s} ↔ ${qL[j]} (${deg(ang[j]!)})`).join(', ')}.`, `So the statement is ${S(simH(L1, right))}${correct ? ', exactly as written' : ''}.`],
  };
  return choice(R, base, correct ? [
    { t: 'Right as written.', ok: true, say: 'Yes: every pair of letters in the same place has equal angles.' },
    { t: `Wrong order: it should be ${simH(L1, other)}.`, say: `Check the angles: ${L1[0]} is ${deg(ang[0]!)}, and so is ${right[0]}.` },
    { t: 'Not similar at all.', mc: MC.failedSearch, say: 'They are similar (stated), and the angles show the matching order.' },
  ] : [
    { t: `Wrong order: it should be ${simH(L1, right)}.`, ok: true, say: 'Yes: equal angles in the same places.' },
    { t: 'Right as written: the triangles are similar.', mc: MC.ignoresLabels, say: `Similar, yes, but the letters must line up: ${L1[0]} (${deg(ang[0]!)}) is not ${stated[0]}.` },
    { t: 'Not similar, because this order does not work.', mc: MC.failedSearch, say: 'One wrong order does not mean no order works. Match the angles to find the right one.' },
  ]);
};
const otherOrder: Gen = (R, n) => {
  const [L1, L2] = pick(R, LET3);
  const T = pick(R, SSS);
  const stated = R() < 0.6;
  const who = pick(R, ['Sam', 'Lee', 'Ivy', 'Max', 'Zoe']);
  if (stated) {
    const k = pick(R, [2, 1.5, 3, 0.5]);
    const { labels: qL } = permLetters(R, L2);
    const P0 = triSSS(...T), Q = place(P0, { k, ...look(R, false) });
    const sa = T, sb = T.map(x => x * k);
    const pic = paperPair({ pts: P0, role: 'first', labels: L1.split(''), lens: sa.map(lenS) }, { pts: Q, role: 'pick', labels: qL, lens: sb.map(lenS) });
    const right = qL.join('');
    // Sam's order: D E F (alphabet) -> ratios fail
    const side = (L: string[], i: number) => `${L[i]}${L[(i + 1) % 3]}`;
    const lenOf = (name: string) => { for (let i = 0; i < 3; i++) { const s = side(qL, i); if ([...s].sort().join('') === [...name].sort().join('')) return sb[i]!; } return NaN; };
    const s0 = lenOf(L2[0]! + L2[1]!), s1 = lenOf(L2[1]! + L2[2]!);
    if (near(s0 / sa[0]!, s1 / sa[1]!)) return otherOrder(R, n);
    return choice(R, {
      id: `otherOrder-${n}`, family: 'otherOrder', picture: pic, board: `${L2[0]}${L2[1]} / ${L1[0]}${L1[1]} \\ne ${L2[1]}${L2[2]} / ${L1[1]}${L1[2]}`,
      prompt: `These triangles are similar. ${who} matches ${L1[0]} → ${L2[0]}, ${L1[1]} → ${L2[1]}, ${L1[2]} → ${L2[2]}, gets ${lenS(s0)}/${lenS(sa[0]!)} ≠ ${lenS(s1)}/${lenS(sa[1]!)}, and says they are not similar after all. Who is right?`,
      solution: [`Match shortest with shortest, middle with middle, longest with longest.`, `${simH(L1, right)}: every ratio is ${numH(k)}. ${who} only tried one order.`],
    }, [
      { t: `${who} tried the wrong order: ${simH(L1, right)} gives ${numH(k)} for every pair.`, ok: true, say: 'Yes. One failed order proves nothing; the right order works.' },
      { t: `${who} is right: the ratios don't match, so they are not similar.`, mc: MC.failedSearch, say: 'One order failing does not rule out the others. Match shortest with shortest.' },
      { t: `${who} is right: the second triangle is turned, so they can't be similar.`, mc: MC.flipped, say: 'Turned and flipped copies can be similar. Match the sides by size.' },
    ]);
  }
  // not similar under any order (side-only data): sorted ratios differ
  const add = pick(R, [1, 2, 3]);
  const sb = T.map(x => x + add);
  if (sb.length === 3 && near(sb[0]! / T[0]!, sb[2]! / T[2]!)) return otherOrder(R, n);
  const P0 = triSSS(...T), Q = place(triSSS(sb[0]!, sb[1]!, sb[2]!), look(R, false));
  const pic = paperPair({ pts: P0, role: 'first', labels: L1.split(''), lens: T.map(lenS) }, { pts: Q, role: 'pick', labels: L2.split(''), lens: sb.map(lenS) }, { sim: false });
  const sorted = (x: number[]) => [...x].sort((p, q) => p - q);
  const A0 = sorted(T), B0 = sorted(sb);
  return choice(R, {
    id: `otherOrder-${n}`, family: 'otherOrder', picture: pic, board: `${A0.join(',\\ ')}\\ \\text{and}\\ ${B0.join(',\\ ')}`,
    prompt: `${tri(L1)} has sides ${A0.join(', ')}; ${tri(L2)} has sides ${B0.join(', ')}. ${who} says: “${L2[0]}${L2[1]}/${L1[0]}${L1[1]} ≠ ${L2[1]}${L2[2]}/${L1[1]}${L1[2]}, so they are not similar.” Is ${who}'s reason enough?`,
    solution: ['One failed order is not enough by itself. Try the best match: shortest with shortest, and so on.', `${B0[0]}/${A0[0]} = ${ratioH(B0[0]!, A0[0]!)} but ${B0[2]}/${A0[2]} = ${ratioH(B0[2]!, A0[2]!)}: no order works, so ${S('not similar')}.`],
  }, [
    { t: `Not enough alone, but they are not similar: even shortest-to-shortest gives ${ratioH(B0[0]!, A0[0]!)} ≠ ${ratioH(B0[2]!, A0[2]!)}.`, ok: true, say: 'Yes. To rule out similarity, every order has to fail; matching by size is the only one that could work.' },
    { t: `Enough: one order that fails proves they are not similar.`, mc: MC.failedSearch, say: 'One order failing proves nothing about the others. Check the order that matches sizes.' },
    { t: `They are similar: every side is ${add} longer.`, mc: MC.addKeep, say: `Adding the same amount is not scaling: ${B0[0]}/${A0[0]} is not ${B0[2]}/${A0[2]}.` },
  ]);
};

// ======================================================================================================
// 18. sufficiency-of-evidence, 19. measurement-vs-exact
// ======================================================================================================
const enough: Gen = (R, n, sg) => {
  const meas = sg === 'measurement-vs-exact';
  const cases = meas ? ['measured', 'witness', 'complete', 'oneSide'] : ['oneSide', 'quadAngles', 'complete', 'completeFail', 'oneSide', 'quadAngles'];
  const cs = pick(R, cases);
  const [L1, L2] = pick(R, cs === 'quadAngles' ? LET4 : LET3);
  const T = pick(R, SSS), k = pick(R, [2, 1.5, 3, 0.5]);
  let pic: DilPic, data = '', truth: 'yes' | 'no' | 'open';
  if (cs === 'quadAngles') {
    const a = pick(R, [60, 70, 110, 120]), w = int(R, 4, 7), s = int(R, 2, 4), W = int(R, 4, 9), Sd = int(R, 2, 6);
    pic = paperPair({ pts: paraP(w, s, a), role: 'first', labels: L1.split(''), angs: [deg(a), deg(180 - a), deg(a), deg(180 - a)] }, { pts: paraP(W, Sd, a), role: 'pick', labels: L2.split(''), angs: [deg(a), deg(180 - a), deg(a), deg(180 - a)] }, { sim: false });
    data = `all four angle pairs are equal (${a}° and ${180 - a}°), no side lengths`; truth = 'open';
  } else if (cs === 'oneSide') {
    const P0 = triSSS(...T), Q = place(P0, { k: k * (R() < 0.5 ? 1 : 1.1), ...look(R, true) });
    pic = paperPair({ pts: P0, role: 'first', labels: L1.split(''), lens: [lenS(T[0]), null, null] }, { pts: Q, role: 'pick', labels: L2.split(''), lens: [lenS(T[0] * k), null, null] }, { sim: false });
    data = `${L1[0]}${L1[1]} = ${T[0]} and ${L2[0]}${L2[1]} = ${lenS(T[0] * k)}, nothing else`; truth = 'open';
  } else if (cs === 'complete' || cs === 'completeFail') {
    const fail = cs === 'completeFail';
    const sb = T.map(x => x * k); const bad = int(R, 0, 2); if (fail) sb[bad] = sb[bad]! + 1;
    if (!validTri(sb)) return enough(R, n, sg);
    const P0 = triSSS(...T), Q = place(triSSS(sb[0]!, sb[1]!, sb[2]!), look(R, true));
    const ang = angles(P0), order = [0, 1, 2].sort((p, q) => ang[p]! - ang[q]!), marks = [0, 0, 0]; order.forEach((vi, j) => { marks[vi] = j + 1; });
    pic = paperPair({ pts: P0, role: 'first', labels: L1.split(''), lens: T.map(lenS), marks: fail ? undefined : marks }, { pts: Q, role: 'pick', labels: L2.split(''), lens: sb.map(lenS), marks: fail ? undefined : marks }, { sim: !fail });
    data = fail ? `all three sides of each triangle` : `all sides, and equal-angle marks`; truth = fail ? 'no' : 'yes';
  } else if (cs === 'measured') {
    const P0 = triSSS(...T), Q = place(P0, { k, ...look(R, true) });
    const m1 = (x: number) => `≈ ${(x * 0.6 + 0.04).toFixed(1)} cm`;
    pic = paperPair({ pts: P0, role: 'first', labels: L1.split(''), lens: T.map(m1) }, { pts: Q, role: 'pick', labels: L2.split(''), lens: T.map(x => m1(x * k)) }, { sim: false, note: 'measured with a ruler' });
    data = 'ruler measurements of the drawing, rounded to tenths'; truth = 'open';
  } else {
    const P0 = triSSS(...T), Q = place(P0, { k, rot: pick(R, [60, 90, 150, 180, 240, 300]) });
    pic = paperPair({ pts: P0, role: 'first', labels: L1.split('') }, { pts: Q, role: 'pick', labels: L2.split('') });
    data = `a dilation by ${numH(k)} followed by a rotation maps ${L1[0]} → ${L2[0]}, ${L1[1]} → ${L2[1]}, ${L1[2]} → ${L2[2]}`; truth = 'yes';
  }
  const nm = cs === 'quadAngles' ? `${L1} ~ ${L2}` : simH(L1, L2);
  const opts: Opt[] = [
    { t: 'Proved: they are similar.', ok: truth === 'yes', mc: truth === 'open' ? (cs === 'quadAngles' ? MC.equalAngles : cs === 'measured' ? MC.examples : MC.oneRatio) : truth === 'no' ? MC.oneRatio : undefined, say: truth === 'yes' ? 'Yes: that evidence settles it.' : truth === 'no' ? 'One side pair breaks the ratio, so they cannot be similar.' : cs === 'quadAngles' ? 'Equal angles alone do not decide four-sided shapes: the sides are unknown.' : cs === 'measured' ? 'Rounded measurements only suggest it. A small difference could hide in the rounding.' : 'One pair of sides says nothing about the others.' },
    { t: 'Proved: they are not similar.', ok: truth === 'no', mc: truth === 'open' ? MC.failedArg : undefined, say: truth === 'no' ? 'Yes: one ratio breaks, and that rules it out.' : truth === 'yes' ? 'The evidence shows they ARE similar.' : 'Missing evidence is not disproof. We just can’t tell yet.' },
    { t: 'Not decidable from this information.', ok: truth === 'open', mc: truth === 'yes' && cs === 'witness' ? MC.needsSides : undefined, say: truth === 'open' ? 'Yes: we need more before deciding either way.' : truth === 'yes' ? (cs === 'witness' ? 'A transformation that maps every corner IS a proof; no measuring needed.' : 'All sides share one ratio and the angles match: that decides it.') : 'One ratio that fails is enough to decide: not similar.' },
  ];
  return choice(R, {
    id: `enough-${n}`, family: 'enough', picture: pic, board: `${cs === 'quadAngles' ? `${L1} \\sim ${L2}` : simT(L1, L2)}\\ ?`,
    prompt: `Claim: ${nm}. The evidence: ${data}. What does it show?`,
    solution: truth === 'open'
      ? [`${cs === 'quadAngles' ? 'For four-sided figures the angles are not enough; the side ratios are unknown.' : cs === 'measured' ? 'Rounded measurements are approximate: they cannot show an exact ratio.' : 'One side pair gives one ratio; the other pairs could differ.'}`, `Neither proved nor disproved: ${S('not decidable yet')}.`]
      : truth === 'yes' ? [cs === 'witness' ? 'A dilation followed by a rigid motion that maps every corner is the definition of similar.' : 'Every side ratio is the same and every angle matches.', S('Proved similar') + '.'] : ['One side ratio differs from the others.', S('Proved not similar') + '.'],
  }, opts);
};
const aaQuad: Gen = (R, n) => {
  const [L1, L2] = pick(R, LET4);
  const a = pick(R, [60, 70, 110, 120, 90]);
  const w = int(R, 4, 8), s = int(R, 2, 5);
  if (w === s) return aaQuad(R, n);
  const prop = R() < 0.3;
  const k = pick(R, [1.5, 2, 0.5]);
  const W = prop ? w * k : w + pick(R, [1, 2, 3, 4]), Sd = prop ? s * k : s + pick(R, [-1, 1, 2]);
  if (!prop && near(W / w, Sd / s)) return aaQuad(R, n);
  const rt = a === 90 ? [0, 1, 2, 3] : undefined;
  const pic = paperPair(
    { pts: paraP(w, s, a), role: 'first', labels: L1.split(''), lens: [lenS(w), lenS(s), null, null], angs: rt ? undefined : [deg(a), deg(180 - a), null, null], rights: rt },
    { pts: paraP(W, Sd, a), role: 'pick', labels: L2.split(''), lens: [lenS(W), lenS(Sd), null, null], angs: rt ? undefined : [deg(a), deg(180 - a), null, null], rights: rt },
    { sim: prop },
  );
  pic.hi = [{ fig: 0, side: 0 }, { fig: 1, side: 0 }, { fig: 0, side: 1 }, { fig: 1, side: 1 }];
  const r1 = ratioH(W, w), r2 = ratioH(Sd, s);
  return choice(R, {
    id: `aaQuad-${n}`, family: 'aaQuad', picture: pic, board: `\\dfrac{${lenS(W)}}{${lenS(w)}}\\ \\text{and}\\ \\dfrac{${lenS(Sd)}}{${lenS(s)}}`,
    prompt: `Two equal angle pairs make triangles similar. ${L1} and ${L2} have ALL their angles equal (${a === 90 ? 'all 90°' : `${a}° and ${180 - a}°`}). Are they similar?`,
    solution: prop ? [`Equal angles alone don't decide four-sided shapes, so check the sides: ${r1} and ${r2}.`, `One ratio and equal angles: ${S('similar')}.`] : [`Equal angles alone don't decide four-sided shapes. Check the sides: ${lenS(W)}/${lenS(w)} = ${r1}, ${lenS(Sd)}/${lenS(s)} = ${r2}.`, `Different ratios: ${S('not similar')}.`],
  }, prop ? [
    { t: `Similar: the angles match AND both side ratios are ${r1}.`, ok: true, say: 'Yes: for four sides you need both, and here both hold.' },
    { t: 'Similar: equal angles are enough for any shape, like AA.', mc: MC.equalAngles, say: 'The answer is right, but the reason is not: AA only works for triangles. The equal side ratios settle it here.' },
    { t: 'Not similar: they are different sizes.', mc: MC.rigid, say: 'Size can differ. One ratio plus equal angles means similar.' },
  ] : [
    { t: `Not similar: equal angles aren't enough for four sides; ${r1} ≠ ${r2}.`, ok: true, say: 'Yes. AA is a triangle fact; four-sided shapes can flex without changing their angles.' },
    { t: 'Similar: all four angle pairs match, even more than AA.', mc: MC.equalAngles, say: `AA works only for triangles. Here the side ratios ${r1} and ${r2} differ.` },
    { t: 'Similar: they look like the same shape.', mc: MC.looks, say: `Check the ratios: ${r1} and ${r2} are different.` },
  ]);
};
const measured: Gen = (R, n) => {
  const [L1, L2] = pick(R, LET3);
  const T = pick(R, SSS), k = pick(R, [2, 1.5, 3]);
  const P0 = triSSS(...T), Q = place(P0, { k, ...look(R, R() < 0.5) });
  const m1 = (x: number) => (x * 0.55 + 0.03).toFixed(1);
  const pic = paperPair({ pts: P0, role: 'first', labels: L1.split(''), lens: T.map(x => `≈ ${m1(x)}`) }, { pts: Q, role: 'pick', labels: L2.split(''), lens: T.map(x => `≈ ${m1(x * k)}`) }, { note: 'cm, measured with a ruler' });
  const who = pick(R, ['Kai', 'Nia', 'Ben', 'Tess', 'Raj']);
  if (R() < 0.5) return choice(R, {
    id: `measured-${n}`, family: 'measured', picture: pic, board: `\\dfrac{${m1(T[0] * k)}}{${m1(T[0])}} \\approx ${numT(k)}`,
    prompt: `${who} measured the drawing: ${L2[0]}${L2[1]} ≈ ${m1(T[0] * k)} cm and ${L1[0]}${L1[1]} ≈ ${m1(T[0])} cm, and the other pairs give about ${numH(k)} too. Does that prove ${simH(L1, L2)}?`,
    solution: ['Ruler readings are rounded: a ratio of “about” k could be slightly off.', `Exact labels or a transformation that maps every corner would ${S('prove')} it; the measurements only ${S('suggest')} it.`],
  }, [
    { t: 'No: rounded measurements only suggest it. Exact lengths or a transformation would prove it.', ok: true, say: 'Right. Measurement is evidence, not proof.' },
    { t: `Yes: every measured ratio comes out to about ${numH(k)}.`, mc: MC.examples, say: '“About” is not exact. A tiny difference can hide inside the rounding.' },
    { t: 'Yes: the drawing looks exactly similar.', mc: MC.looks, say: 'Looks are not proof. Drawings are not always to scale.' },
  ]);
  return choice(R, {
    id: `measured-${n}`, family: 'measured', picture: pic, board: `${simT(L1, L2)}\\ ?`,
    prompt: `Which of these proves ${simH(L1, L2)} exactly?`,
    solution: ['A proof must be exact and cover every corner.', `${S(`A dilation by ${numH(k)} followed by a rigid motion that maps every corner`)} does that.`],
  }, [
    { t: `A dilation by ${numH(k)} about ${L1[0]}, then a rigid motion, maps ${L1[0]}, ${L1[1]}, ${L1[2]} onto ${L2[0]}, ${L2[1]}, ${L2[2]}.`, ok: true, say: 'Yes: an exact transformation that maps every corner is a proof.' },
    { t: `A ruler gives ${L1[0]}${L1[1]} ≈ ${m1(T[0])} and ${L2[0]}${L2[1]} ≈ ${m1(T[0] * k)}, a ratio of about ${numH(k)}.`, mc: MC.examples, say: 'Approximate measurements can only suggest similarity.' },
    { t: 'The two triangles look like the same shape.', mc: MC.looks, say: 'Looking alike is not a proof.' },
  ]);
};

// ======================================================================================================
// 21. aa-informal-argument, 22. aa-apply
// ======================================================================================================
function aaPic(R: () => number, L1: string, L2: string, s: number, t: number, a: number, b: number): DilPic {
  const P0 = triAA(s, a, b), Q = place(triAA(t, a, b), look(R, R() < 0.5));
  const pic = paperPair({ pts: P0, role: 'first', labels: L1.split(''), marks: [1, 2, 0], lens: [lenS(s), null, null] }, { pts: Q, role: 'pick', labels: L2.split(''), marks: [1, 2, 0], lens: [lenS(t), null, null] });
  return pic;
}
const aaArgue: Gen = (R, n) => {
  const [L1, L2] = pick(R, LET3);
  const [a, b] = triAngles(R);
  const [s, t] = pick(R, [[4, 6], [6, 9], [8, 12], [10, 4], [6, 3], [5, 10], [9, 6], [4, 10], [12, 8]]);
  const pic = aaPic(R, L1, L2, s!, t!, a, b);
  const k = ratioH(t!, s!), kInvH = ratioH(s!, t!);
  if (R() < 0.5) return choice(R, {
    id: `aaArgue-${n}`, family: 'aaArgue', picture: pic, board: `\\angle ${L1[0]} = \\angle ${L2[0]},\\ \\angle ${L1[1]} = \\angle ${L2[1]}`,
    prompt: `To show ${simH(L1, L2)}: a rigid motion puts ${L1[0]} on ${L2[0]}, with ray ${L1[0]}${L1[1]} along ray ${L2[0]}${L2[1]} (∠${L1[0]} = ∠${L2[0]}). ${L1[0]}${L1[1]} = ${s}, ${L2[0]}${L2[1]} = ${t}. Which dilation puts ${L1[1]} on ${L2[1]}?`,
    solution: [`Dilate about ${L2[0]}, the corner that is already in place, so ${L1[0]} stays on ${L2[0]}.`, `${L2[0]}${L2[1]} ÷ ${L1[0]}${L1[1]} = ${t} ÷ ${s} = ${S(k)}.`],
  }, [
    { t: `Dilate about ${L2[0]} with k = ${k}.`, ok: true, say: `Yes: about ${L2[0]}, so that corner stays put, by ${t} ÷ ${s}.` },
    { t: `Dilate about ${L2[0]} with k = ${kInvH}.`, mc: s! > t! ? MC.larger : undefined, say: `That goes the wrong way: the side must become ${t}, so k = ${t} ÷ ${s}.` },
    { t: `Dilate about the middle of ${tri(L1)} with k = ${k}.`, mc: MC.middle, say: `About the middle, ${L1[0]} would move off ${L2[0]}. Use ${L2[0]} as the center.` },
  ]);
  return choice(R, {
    id: `aaArgue-${n}`, family: 'aaArgue', picture: pic, board: `\\angle ${L1[0]} = \\angle ${L2[0]},\\ \\angle ${L1[1]} = \\angle ${L2[1]}`,
    prompt: `∠${L1[0]} = ∠${L2[0]} = ${a}° and ∠${L1[1]} = ∠${L2[1]} = ${b}°. You want to show ${simH(L1, L2)} with transformations. What is the first step?`,
    solution: ['First put the equal angles on top of each other with a rigid motion: corner on corner, rays along rays.', `Then a dilation about ${L2[0]} makes ${L1[0]}${L1[1]} match ${L2[0]}${L2[1]}; the second angle does the rest.`],
  }, [
    { t: `A rigid motion that puts ∠${L1[0]} exactly on ∠${L2[0]}, rays along rays.`, ok: true, say: 'Yes: line up the equal angle first; the dilation comes next.' },
    { t: `Dilate ${tri(L1)} about its middle until it looks the right size.`, mc: MC.middle, say: 'A center in the middle moves every corner. Line up an equal angle first, then dilate about that corner.' },
    { t: 'Measure all six sides first.', mc: MC.needsSides, say: 'No measuring needed: the two equal angles and a transformation sequence do the job.' },
  ]);
};
const aaWhy: Gen = (R, n) => {
  const [L1, L2] = pick(R, LET3);
  const [a, b] = triAngles(R);
  const [s, t] = pick(R, [[4, 6], [6, 9], [8, 12], [10, 4], [6, 3], [5, 10], [9, 6], [4, 10], [12, 8]]);
  const pic = aaPic(R, L1, L2, s!, t!, a, b);
  const p = (x: string) => x + '″';
  if (R() < 0.55) return choice(R, {
    id: `aaWhy-${n}`, family: 'aaWhy', picture: pic, board: `${p(L1[0]!)} = ${L2[0]},\\ ${p(L1[1]!)} = ${L2[1]},\\ ${p(L1[2]!)} = \\,?`,
    prompt: `After a rigid motion and a dilation by ${ratioH(t!, s!)} about ${L2[0]}, ${p(L1[0]!)} is on ${L2[0]} and ${p(L1[1]!)} is on ${L2[1]} (∠${L1[0]} = ∠${L2[0]} = ${a}°, ∠${L1[1]} = ∠${L2[1]} = ${b}°). Why must ${p(L1[2]!)} land on ${L2[2]}?`,
    solution: [`∠${L1[0]} = ∠${L2[0]}, so side ${p(L1[0]!)}${p(L1[2]!)} lies along ${L2[0]}${L2[2]}. ∠${L1[1]} = ∠${L2[1]}, so ${p(L1[1]!)}${p(L1[2]!)} lies along ${L2[1]}${L2[2]}.`, `Two lines cross at one point only: ${S(p(L1[2]!) + ' = ' + L2[2])}.`],
  }, [
    { t: `The equal angles put its two sides along ${L2[0]}${L2[2]} and ${L2[1]}${L2[2]}, and those lines meet only at ${L2[2]}.`, ok: true, say: 'Yes: each equal angle fixes a direction, and two directions meet in one point.' },
    { t: 'Two corners already landed, so the whole triangle lands.', mc: MC.twoVertices, say: `Two corners alone don't fix the third: the mirror image fits them too. The equal angles are the reason.` },
    { t: 'Because it is obvious from the picture.', mc: MC.noReason, say: 'A picture is not a reason. Say which equal angle puts which side where.' },
  ]);
  return choice(R, {
    id: `aaWhy-${n}`, family: 'aaWhy', picture: pic, board: `\\angle ${L1[0]} = \\angle ${L2[0]} = ${a}^\\circ`,
    prompt: `A rigid motion puts ${L1[0]} on ${L2[0]} with ray ${L1[0]}${L1[1]} along ray ${L2[0]}${L2[1]}. Why does ray ${L1[0]}${L1[2]} then lie along ray ${L2[0]}${L2[2]}?`,
    solution: [`∠${L1[0]} = ∠${L2[0]} = ${a}°: both rays open ${a}° from the same ray, on the same side.`, `So ${S(`ray ${L1[0]}${L1[2]} is ray ${L2[0]}${L2[2]}`)}.`],
  }, [
    { t: `Because ∠${L1[0]} = ∠${L2[0]} = ${a}°: the same opening from the same ray.`, ok: true, say: 'Yes: equal angles at the same corner, from the same ray, give the same second ray.' },
    { t: `Because ${L1[0]} is on ${L2[0]}, everything else lines up too.`, mc: MC.twoVertices, say: 'One matching point fixes nothing else. It is the equal angle that fixes the ray.' },
    { t: 'It just does.', mc: MC.noReason, say: 'Every step needs a reason: which equal angle makes it true?' },
  ]);
};
const aaDecide: Gen = (R, n) => {
  const [L1, L2] = pick(R, LET3);
  const [a, b, c] = triAngles(R);
  const sim = R() < 0.6;
  const P0 = triAA(5, a, b);
  let ang2: number[];
  if (sim) ang2 = [a, b, c];
  else { const d = pick(R, [8, 10, 12, 15]) * pick(R, [1, -1]); ang2 = [a, b + d, c - d]; if (ang2.some(x => x < 25 || x > 125)) return aaDecide(R, n); }
  const Q = place(triAA(5 * pick(R, [1.5, 2, 0.6]), ang2[0]!, ang2[1]!), look(R, R() < 0.4));
  // two angles shown in each triangle, sometimes not the same two
  const showA = [0, 1], showB = sim ? pick(R, [[0, 1], [0, 2], [1, 2]]) : pick(R, [[0, 1], [0, 2]]);
  const pic = paperPair(
    { pts: P0, role: 'first', labels: L1.split(''), angs: [a, b, c].map((x, i) => (showA.includes(i) ? deg(x) : null)) },
    { pts: Q, role: 'pick', labels: L2.split(''), angs: ang2.map((x, i) => (showB.includes(i) ? deg(x) : null)) },
    { sim },
  );
  const listA = showA.map(i => `${[a, b, c][i]}°`).join(' and '), listB = showB.map(i => `${ang2[i]}°`).join(' and ');
  const third = (xs: number[], show: number[]) => 180 - show.reduce((s, i) => s + xs[i]!, 0);
  const t1 = third([a, b, c], showA), t2 = third(ang2, showB);
  return choice(R, {
    id: `aaDecide-${n}`, family: 'aaDecide', picture: pic, board: `${listA.replace(/°/g, '^\\circ')}\\ \\ |\\ \\ ${listB.replace(/°/g, '^\\circ')}`,
    prompt: `${tri(L1)} has angles ${listA}. ${tri(L2)} has angles ${listB}. Are they similar?`,
    solution: [`Third angles: ${tri(L1)} has ${t1}°, ${tri(L2)} has ${t2}°.`, sim ? `So both triangles have ${a}°, ${b}° and ${c}°: two equal pairs are enough, ${S('similar (AA)')}.` : `The angle sets differ (${[a, b, c].join(', ')} vs ${ang2.join(', ')}): ${S('not similar')}.`],
  }, sim ? [
    { t: 'Similar: two pairs of equal angles are enough (AA).', ok: true, say: 'Yes. For triangles, two equal angle pairs force the third, and AA gives similarity.' },
    { t: "Can't tell without the side lengths.", mc: MC.needsSides, say: 'For triangles, two equal angle pairs are enough: no sides needed.' },
    { t: 'Not similar: the angles are in different places.', mc: MC.letters, say: `Find the third angle first: both triangles have ${a}°, ${b}° and ${c}°.` },
  ] : [
    { t: `Not similar: the angles don't all match (${[a, b, c].join(', ')} vs ${ang2.join(', ')}).`, ok: true, say: 'Right: no corner can be matched with equal angles all round.' },
    { t: `Similar: both have a ${a}° angle.`, say: 'One equal pair is not enough. AA needs two pairs.' },
    { t: "Can't tell without the side lengths.", say: 'The angles already decide it: the sets are different.' },
  ]);
};

// ======================================================================================================
/** every family retries until its picture can be drawn readably */
const safe = (g: Gen): Gen => (R, n, sg) => {
  for (let i = 0; i < 60; i++) { const it = g(R, n, sg) as unknown as DItem; if (picProblem(it.picture) === null) return it; }
  throw new Error('no drawable item');
};
const RAW: Record<string, Gen> = {
  corrSide, corrStatement, corrRotated, dilPoint, dilCenterOn, kEffect, ruleImage, ruleCenterTrap, angleKeep, orientKeep, propTable,
  ratioK: ratioKFam, addVsMult, simSeq, simYesNo, witnessPick, kFromSides, simCheck, rectRhombus, allSimilar, lenK, lenFig, angCorr,
  angThird, angThirdFlip, ctxShadow, ctxMetric, resize, resizeJudge, stmtCheck, otherOrder, enough, aaQuad, measured, aaArgue, aaWhy, aaDecide,
};
export const GENERATORS: Record<string, Gen> = Object.fromEntries(Object.entries(RAW).map(([k, g]) => [k, safe(g)]));
export const FAMILY_NAMES: Record<string, string> = {
  corrSide: 'Read the statement', corrStatement: 'Write the statement', corrRotated: 'Partners when turned', dilPoint: 'Dilate a point',
  dilCenterOn: 'Center on or inside', kEffect: 'Bigger or smaller?', ruleImage: 'The coordinate rule', ruleCenterTrap: 'Not the origin',
  angleKeep: 'Angles stay', orientKeep: 'Which way round?', propTable: 'What a move keeps', ratioK: 'One shared ratio', addVsMult: 'Times, not plus',
  simSeq: 'Follow the sequence', simYesNo: 'Similar or not?', witnessPick: 'The whole-figure sequence', kFromSides: 'Scale factor, with direction',
  simCheck: 'Check every pair', rectRhombus: 'Angles or sides alone', allSimilar: 'All of them similar?', lenK: 'Missing length with k',
  lenFig: 'Missing length from a pair', angCorr: 'Corresponding angle', angThird: 'Third angle', angThirdFlip: 'Third angle, turned',
  ctxShadow: 'Shadows', ctxMetric: 'Meters and centimeters', resize: 'Resize keeping the shape', resizeJudge: 'Same shape after resizing?',
  stmtCheck: 'Check the vertex order', otherOrder: 'One order is not all orders', enough: 'Enough evidence?', aaQuad: 'AA is for triangles',
  measured: 'Measured or exact?', aaArgue: 'Build the AA argument', aaWhy: 'Why AA works', aaDecide: 'Use AA',
};
