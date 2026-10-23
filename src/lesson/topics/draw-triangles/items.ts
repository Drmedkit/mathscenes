// items.ts: exercise families for "draw triangles from given conditions", generated from templates, checked exactly,
// every wrong answer classified against the misconception catalogue (math-curriculum-essentials/misconceptions.json).
// A family is one deep structure; a generator gets the sub-goal it practises (plan.ts) and uses that sub-goal's cases
// from the topic JSON. Items carry a Pic (pictures.ts) that the page draws; generators only keep items whose picture
// lays out readably (picFits). Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { type ConstructSpec, type Pic, type TriPic, picFits } from './pictures';
import { ans, endOnChoice } from '../../runtime/explain';
import {
  type P2, type Spec, type Unit, ADJ, OPP, countTriangles, existsSSS, len, lenT, sideOpposite, solveASA, solveSAS, solveSSS, thirdAngle, thirdSideRange, within,
} from './triangleMaths';

export interface DTItem extends Item { picture?: Pic; solvePic?: Pic }
type Gen = (R: () => number, n: number, sg?: string) => DTItem;
type V = 'A' | 'B' | 'C';
type Sd = 'AB' | 'AC' | 'BC';

// ---------- shared bits ----------
/** board lines are separated by this TeX line break (the page splits on it) */
export const NL = ' \\\\ ';
export const splitBoard = (b: string) => b.split('\\\\').map(s => s.trim()).filter(Boolean);
const NAMES: [string, string, string][] = [['A', 'B', 'C'], ['P', 'Q', 'R'], ['D', 'E', 'F'], ['J', 'K', 'L'], ['X', 'Y', 'Z'], ['M', 'N', 'P'], ['R', 'S', 'T'], ['G', 'H', 'K'], ['U', 'V', 'W']];
const IDX: Record<V, number> = { A: 0, B: 1, C: 2 };
const nm = (names: [string, string, string], s: Sd | V) => [...s].map(ch => names[IDX[ch as V]]).join('');
const sideH = (names: [string, string, string], s: Sd, x: number, u: Unit) => `<b class="a">${nm(names, s)} = ${len(x, u)} ${u}</b>`;
const angH = (names: [string, string, string], v: V, x: number) => `<b class="b">∠${nm(names, v)} = ${x}°</b>`;
const sideT = (names: [string, string, string], s: Sd, x: number, u: Unit) => `${nm(names, s)} = ${lenT(x, u)}\\ \\text{${u}}`;
const angT = (names: [string, string, string], v: V, x: number) => `\\angle ${nm(names, v)} = ${x}^\\circ`;
/** three letters for candidate points that are not the triangle's own letters */
const candLetters = (R: () => number, N: readonly string[]) => shuffle(R, ['P', 'Q', 'R', 'S', 'T', 'X', 'Y', 'Z', 'D', 'E', 'F'].filter(l => !N.includes(l))).slice(0, 3).sort() as [string, string, string];
const list = (xs: string[]) => (xs.length < 3 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const halves = (R: () => number, lo: number, hi: number) => int(R, lo * 2, hi * 2) / 2;
const lenOf = (R: () => number, u: Unit, lo: number, hi: number, half = true) => (half ? halves(R, lo, hi) : int(R, lo, hi));

interface Opt { t: string; ok?: boolean; mc?: string; say: string }
/** a multiple-choice item: options shuffled, exactly one right */
function choice(R: () => number, base: Omit<DTItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[], keepOrder = false): DTItem {
  const os = keepOrder ? opts : shuffle(R, [...opts]);
  const ans = os.findIndex(o => o.ok);
  if (ans < 0 || os.filter(o => o.ok).length !== 1) throw new Error(`${base.family}: needs exactly one right option`);
  return {
    ...base, solution: endOnChoice(base.solution, os[ans]!.t), input: 'choice', choices: os.map(o => o.t), answer: { kind: 'choice', i: ans },
    check: (r: Response): Verdict => {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one of the options.' };
      const o = os[r.i];
      if (!o) return { ok: false, say: 'Pick one of the options.' };
      return { ok: !!o.ok, mc: o.mc, say: o.say };
    },
  };
}
/** a length answer: inches as a mixed number, cm as a decimal */
function lenAnswer(x: number, u: Unit): Response {
  if (u === 'cm') return { kind: 'num', v: Math.round(x * 10) / 10 };
  const w = Math.floor(x + 1e-9), q = Math.round((x - w) * 4);
  if (q === 0) return { kind: 'frac', w, n: 0, d: 1 };
  return q === 2 ? { kind: 'frac', w, n: 1, d: 2 } : { kind: 'frac', w, n: q, d: 4 };
}
const valueOf = (r: Response): number | null => {
  if (r.kind === 'num') return Number.isFinite(r.v) ? r.v : null;
  if (r.kind === 'frac') { if (![r.w, r.n, r.d].every(Number.isFinite) || r.d <= 0 || r.n < 0 || r.w < 0) return null; return r.w + r.n / r.d; }
  return null;
};
const eq = (a: number, b: number) => Math.abs(a - b) < 1e-6;
/** keep generating until the picture lays out (bounded); the last try is a known-good fallback */
function fitted(make: (R: () => number) => DTItem, R: () => number, fallback: () => DTItem): DTItem {
  for (let i = 0; i < 30; i++) {
    const it = make(R);
    if ((!it.picture || picFits(it.picture)) && (!it.solvePic || picFits(it.solvePic))) return it;
  }
  return fallback();
}

// =====================================================================================================
// 1 condition-set: turn a request into its set of conditions on a labelled sketch
// =====================================================================================================
type ReqKind = 'SAS' | 'ASA' | 'SSS';
interface Req { kind: ReqKind; unit: Unit; names: [string, string, string]; tri: ReturnType<typeof solveSSS>; sides: Partial<Record<Sd, number>>; angles: Partial<Record<V, number>> }
/** a feasible request with A at the included angle / B..: the drawn shape is the true triangle */
function request(R: () => number, kind: ReqKind, unit: Unit): Req {
  const names = pick(R, NAMES);
  for (;;) {
    if (kind === 'SAS') {
      const AB = lenOf(R, unit, unit === 'in' ? 3 : 5, unit === 'in' ? 6 : 11, unit === 'in'), AC = lenOf(R, unit, unit === 'in' ? 2 : 4, unit === 'in' ? 5 : 9, unit === 'in'), a = 5 * int(R, 7, 22);
      if (Math.abs(AB - AC) < 0.6) continue;
      const tri = solveSAS(AB, AC, a);
      if (Math.min(tri.angB, tri.angC) < 22) continue;
      return { kind, unit, names, tri, sides: { AB, AC }, angles: { A: a } };
    }
    if (kind === 'ASA') {
      const AB = lenOf(R, unit, unit === 'in' ? 3 : 5, unit === 'in' ? 6 : 11, unit === 'in'), a = 5 * int(R, 7, 18), b = 5 * int(R, 7, 18);
      if (a === b || a + b > 140) continue;
      return { kind, unit, names, tri: solveASA(AB, a, b), sides: { AB }, angles: { A: a, B: b } };
    }
    const AB = int(R, unit === 'in' ? 4 : 7, unit === 'in' ? 7 : 12), AC = int(R, unit === 'in' ? 3 : 5, AB - 1), BC = int(R, unit === 'in' ? 3 : 5, AB);
    if (existsSSS(AB, AC, BC) !== 'yes' || AC === BC) continue;
    const tri = solveSSS(AB, AC, BC);
    if (Math.min(tri.angA, tri.angB, tri.angC) < 25) continue;
    return { kind, unit, names, tri, sides: { AB, AC, BC }, angles: {} };
  }
}
const reqHtml = (q: Req) => list([...(Object.entries(q.sides) as [Sd, number][]).map(([s, x]) => sideH(q.names, s, x, q.unit)), ...(Object.entries(q.angles) as [V, number][]).map(([v, x]) => angH(q.names, v, x))]);
const reqTex = (q: Req) => [...(Object.entries(q.sides) as [Sd, number][]).map(([s, x]) => sideT(q.names, s, x, q.unit)), ...(Object.entries(q.angles) as [V, number][]).map(([v, x]) => angT(q.names, v, x))].join(NL);
function reqSketch(q: Req, sides: Partial<Record<Sd, number>>, angles: Partial<Record<V, number>>, extra: Partial<TriPic> = {}): TriPic {
  const sd: TriPic['sides'] = {}, an: TriPic['angles'] = {};
  for (const [s, x] of Object.entries(sides) as [Sd, number][]) sd[s] = { text: len(x, q.unit) };
  for (const [v, x] of Object.entries(angles) as [V, number][]) an[v] = { text: `${x}°` };
  return { unit: q.unit, A: q.tri.A, B: q.tri.B, C: q.tri.C, names: q.names, sides: sd, angles: an, freehand: true, ...extra };
}

const sketch: Gen = (R0, n) => fitted(R => {
  const kind = pick(R, ['SAS', 'ASA', 'SSS'] as const), unit = pick(R, ['in', 'cm'] as const), q = request(R, kind, unit);
  const N = q.names;
  const right = reqSketch(q, q.sides, q.angles);
  let moved: TriPic, movedMc: string | undefined, movedSay: string;
  if (kind === 'SAS') {
    const to = pick(R, ['B', 'C'] as const);
    moved = reqSketch(q, q.sides, { [to]: q.angles.A });
    movedMc = 'mc.geometric-proof.triangle-angle-at-wrong-vertex';
    movedSay = `That sketch moves the ${q.angles.A}° angle to ${nm(N, to)}. The given angle sits where ${nm(N, 'AB')} and ${nm(N, 'AC')} meet: at ${nm(N, 'A')}.`;
  } else if (kind === 'ASA') {
    moved = reqSketch(q, q.sides, { A: q.angles.A, C: q.angles.B });
    movedMc = 'mc.geometric-proof.triangle-angle-at-wrong-vertex';
    movedSay = `That sketch puts the ${q.angles.B}° angle at ${nm(N, 'C')}. Both given angles sit at the ends of ${nm(N, 'AB')}: at ${nm(N, 'A')} and ${nm(N, 'B')}.`;
  } else {
    // swap two sides that differ (in an isosceles request AB = BC, swapping them would draw the right sketch again)
    const S3 = q.sides as Record<'AB' | 'AC' | 'BC', number>;
    const pair = ([['AB', 'BC'], ['AB', 'AC'], ['AC', 'BC']] as const).find(([x, y]) => S3[x] !== S3[y]);
    if (!pair) return sketch(R, n);
    const [x, y] = pair;
    moved = reqSketch(q, { ...S3, [x]: S3[y], [y]: S3[x] }, {});
    movedMc = undefined;
    movedSay = `That sketch swaps two lengths: ${nm(N, x)} must be ${len(S3[x], unit)} ${unit}.`;
  }
  // equal marks on AC and BC are only invented when AC and BC differ
  const inv = q.sides.AC !== undefined && q.sides.AC === q.sides.BC ? 'right' : pick(R, ['right', 'ticks'] as const);
  const freeV: V[] = (['A', 'B', 'C'] as V[]).filter(v => q.angles[v] === undefined);
  const rv = pick(R, freeV);
  const invented = inv === 'right' ? reqSketch(q, q.sides, q.angles, { right: rv }) : reqSketch(q, q.sides, q.angles, { ticks: kind === 'SSS' ? { AC: 1, BC: 1 } : { AC: 1, BC: 1 } });
  const invSay = inv === 'right' ? `That sketch adds a right angle at ${nm(N, rv)}. The request never says ${nm(N, rv)} is 90°: a sketch shows only what is given.` : `That sketch marks ${nm(N, 'AC')} and ${nm(N, 'BC')} as equal. The request never says so: a sketch shows only what is given.`;
  const opts = shuffle(R, [
    { t: right, ok: true, mc: undefined as string | undefined, say: `Yes: every given condition is marked where it belongs, and nothing else.` },
    { t: moved, ok: false, mc: movedMc, say: movedSay },
    { t: invented, ok: false, mc: 'mc.geometric-proof.diagram-appearance-as-given', say: invSay },
  ]);
  return choice(R, {
    id: `sketch-${n}`, family: 'sketch',
    prompt: `The request: draw triangle ${N.join('')} with ${reqHtml(q)}. Which sketch shows exactly these conditions, nothing moved and nothing added?`,
    board: reqTex(q), picture: { kind: 'tris', ts: opts.map(o => o.t) },
    solution: [`List the givens: ${reqHtml(q)}.`, `Put each one on its own side or corner of the sketch: a side length on that side, an angle at its corner.`, `Add nothing the request does not say (no right-angle marks, no equal marks).`],
  }, opts.map((o, i) => ({ t: `Sketch ${i + 1}`, ok: o.ok, mc: o.mc, say: o.say })), true);
}, R0, () => sketch(rngFallback(n), n));

const included: Gen = (R, n) => {
  const N = pick(R, NAMES), unit = pick(R, ['in', 'cm'] as const);
  const sas = R() < 0.5;
  // the two given sides meet at the shared vertex; SAS gives the angle there, SSA at another end
  const shared = pick(R, ['A', 'B', 'C'] as const);
  const others = (['A', 'B', 'C'] as V[]).filter(v => v !== shared) as [V, V];
  const s1 = [shared, others[0]].sort().join('') as Sd, s2 = [shared, others[1]].sort().join('') as Sd;
  const x1 = lenOf(R, unit, unit === 'in' ? 2 : 4, unit === 'in' ? 6 : 12, unit === 'in'), x2 = lenOf(R, unit, unit === 'in' ? 2 : 4, unit === 'in' ? 6 : 12, unit === 'in');
  const av: V = sas ? shared : pick(R, others), ang = 5 * int(R, 6, 24);
  const givens = shuffle(R, [sideH(N, s1, x1, unit), sideH(N, s2, x2, unit), angH(N, av, ang)]);
  const tex = [sideT(N, s1, x1, unit), sideT(N, s2, x2, unit), angT(N, av, ang)].join(NL);
  const A = nm(N, av), S1 = nm(N, s1), S2 = nm(N, s2);
  const opts: Opt[] = sas ? [
    { t: `Yes: ∠${A} is the corner where ${S1} and ${S2} meet.`, ok: true, say: `Right: ${S1} and ${S2} share the corner ${A}, so the angle there is between them (two sides and the included angle).` },
    { t: `No: ∠${A} touches only one of the two sides.`, mc: 'mc.geometric-proof.triangle-angle-at-wrong-vertex', say: `Look at the letters: ${S1} and ${S2} both contain ${A}. Both sides start at ${A}, so ∠${A} is between them.` },
    { t: 'You can only tell from an accurate drawing.', mc: 'mc.geometric-proof.diagram-appearance-as-given', say: `The letters tell you, no drawing needed: ${S1} and ${S2} both contain ${A}.` },
  ] : [
    { t: `No: ∠${A} is on ${A === S1[0] || A === S1[1] ? S1 : S2} only; the two sides meet at ${nm(N, shared)}.`, ok: true, say: `Right: the sides meet at ${nm(N, shared)}, so the angle between them is ∠${nm(N, shared)}. ∠${A} is not between them.` },
    { t: `Yes: every angle of a triangle is between two of its sides.`, mc: 'mc.geometric-proof.triangle-angle-at-wrong-vertex', say: `Between two sides of the triangle, yes, but not between the two GIVEN sides. ${S1} and ${S2} meet at ${nm(N, shared)}, not at ${A}.` },
    { t: 'You can only tell from an accurate drawing.', mc: 'mc.geometric-proof.diagram-appearance-as-given', say: `The letters tell you, no drawing needed: ${S1} and ${S2} share the letter ${nm(N, shared)}, not ${A}.` },
  ];
  const shape = solveSSS(5, 4, 3.6);
  return choice(R, {
    id: `included-${n}`, family: 'included',
    prompt: `Draw triangle ${N.join('')} with ${list(givens)}. Is the given angle between the two given sides?`,
    board: tex, picture: { kind: 'tri', t: { unit, A: shape.A, B: shape.B, C: shape.C, names: N, freehand: true } },
    solution: [`The two given sides are ${S1} and ${S2}. They share the letter ${nm(N, shared)}: that is where they meet.`, `The angle between them is ∠${nm(N, shared)}. ${sas ? `The request gives ∠${A}: the included angle.` : `The request gives ∠${A}, another corner: not included.`}`],
  }, opts);
};

const invent: Gen = (R, n) => {
  const kind = pick(R, ['SAS', 'ASA', 'SSS'] as const), unit = pick(R, ['in', 'cm'] as const);
  let q = request(R, kind, unit);
  // "angle C is 90" and "AC = BC" must be FALSE for the real triangle (they only look true in the sketch)
  while (Math.abs(q.tri.angC - 90) < 3 || Math.abs(q.tri.AC - q.tri.BC) < 0.3) q = request(R, kind, unit);
  const N = q.names;
  // the sketch is NOT to scale: it looks right-angled at C, or isosceles
  const look = pick(R, ['right', 'iso'] as const);
  const shapeTri = look === 'right' ? { A: [0, 0] as P2, B: [5, 0] as P2, C: [1.6, 2.4] as P2 } : { A: [0, 0] as P2, B: [5, 0] as P2, C: [2.5, 3.2] as P2 };
  // in the right-looking sketch the corner C is drawn square: make it truly 90 deg in the sketch
  if (look === 'right') { const t = solveSSS(5, 3, 4); shapeTri.C = t.C; }
  const sd: TriPic['sides'] = {}, an: TriPic['angles'] = {};
  for (const [s, x] of Object.entries(q.sides) as [Sd, number][]) sd[s] = { text: len(x, unit) };
  for (const [v, x] of Object.entries(q.angles) as [V, number][]) an[v] = { text: `${x}°` };
  const given = pick(R, [...(Object.entries(q.sides) as [Sd, number][]).map(([s, x]) => `${nm(N, s)} = ${len(x, unit)} ${unit}`), ...(Object.entries(q.angles) as [V, number][]).map(([v, x]) => `∠${nm(N, v)} = ${x}°`)]);
  const lookRight = `∠${nm(N, 'C')} = 90°`, lookIso = `${nm(N, 'AC')} = ${nm(N, 'BC')}`;
  const opts: Opt[] = [
    { t: given, ok: true, say: `Yes: ${given} is in the request. Only the request counts.` },
    { t: lookRight, mc: 'mc.geometric-proof.diagram-appearance-as-given', say: look === 'right' ? `It looks square in the sketch, but the request never says ∠${nm(N, 'C')} = 90°. A sketch is not to scale.` : `Nothing says ∠${nm(N, 'C')} = 90°. Only the request counts.` },
    { t: lookIso, mc: 'mc.geometric-proof.diagram-appearance-as-given', say: look === 'iso' ? `They look equal in the sketch, but the request never says ${nm(N, 'AC')} = ${nm(N, 'BC')}. A sketch is not to scale.` : `Nothing says ${nm(N, 'AC')} = ${nm(N, 'BC')}. Only the request counts.` },
  ];
  return choice(R, {
    id: `invent-${n}`, family: 'invent',
    prompt: `Kai sketched triangle ${N.join('')} for the request ${reqHtml(q)}. The sketch happens to look ${look === 'right' ? `square at ${nm(N, 'C')}` : `like ${nm(N, 'AC')} and ${nm(N, 'BC')} are equal`}. Which of these may Kai use when he draws it?`,
    board: reqTex(q), picture: { kind: 'tri', t: { unit, ...shapeTri, names: N, sides: sd, angles: an, freehand: true } },
    solution: [`The conditions are exactly the request: ${reqHtml(q)}.`, `How a sketch looks is not a condition: sketches are not to scale.`],
  }, opts);
};

// =====================================================================================================
// 2 draw-given-length: produce (and check) a segment of a given length with a ruler
// =====================================================================================================
function lenCheck(want: number, u: Unit, wrong: { v: number; mc?: string; say: string }[], right: string): (r: Response) => Verdict {
  return r => {
    const v = valueOf(r);
    if (v === null) return { ok: false, say: u === 'in' ? 'Type a whole number, a fraction or a mixed number.' : 'Type a number (use a point for halves, like 6.5).' };
    if (eq(v, want)) return { ok: true, say: right };
    const w = wrong.find(x => eq(x.v, v));
    if (w) return { ok: false, mc: w.mc, say: w.say };
    return { ok: false, say: `Not quite: ${len(want, u)} ${u}.` };
  };
}
const segLen: Gen = (R, n) => fitted(R => {
  const u = pick(R, ['in', 'cm'] as const), deg = pick(R, [0, 0, 0, 18, -14, 24]), names = pick(R, NAMES), Ln = u === 'in' ? 7 : 14;
  const edge = R() < 0.35, inset = u === 'in' ? 0.25 : 0.5;
  const s = edge ? -inset : (u === 'in' ? halves(R, 1, 3) : int(R, 1, 5)), L = u === 'in' ? halves(R, 1.5, 4) : lenOf(R, u, 3, 8, R() < 0.4);
  const e = edge ? (u === 'in' ? halves(R, 2, 5) : int(R, 3, 9)) : s + L, want = e - s;
  if (e > Ln - 0.5) return segLen(R, n);
  const N2: [string, string] = [names[0], names[1]];
  const wrong = [{ v: e, mc: 'mc.measurement-units.aligns-at-ruler-end-or-1', say: edge ? `${len(e, u)} is the mark at ${N2[1]}, but ${N2[0]} is at the ruler's end, not at 0. The 0 mark is ${len(inset, u)} ${u} in from the end, so add it: ${len(want, u)} ${u}.` : `${len(e, u)} is the mark at ${N2[1]}, but ${N2[0]} is not at 0. Subtract: ${len(e, u)} − ${len(s, u)} = ${len(want, u)} ${u}.` }];
  if (!edge && Number.isInteger(s) && Number.isInteger(e)) wrong.push({ v: e - s + 1, mc: 'mc.count.counts-points-not-intervals', say: `That counts the marks from ${len(s, u)} to ${len(e, u)}. A length counts the SPACES between them: ${len(want, u)} ${u}.` });
  return {
    id: `segLen-${n}`, family: 'segLen',
    prompt: `Sam drew segment ${N2.join('')} along the ruler. How long is ${N2.join('')}?`,
    board: `${N2.join('')} = \\,?\\ \\text{${u}}`, input: u === 'in' ? 'frac' : 'num', unit: u,
    picture: { kind: 'ruler', unit: u, deg, inset, len: Ln, seg: [edge ? 'edge' : s, e], names: N2 },
    solution: edge
      ? [`${N2[0]} is at the very end of the ruler; the 0 mark is ${len(inset, u)} ${u} in from that end.`, `So ${N2[0]}${N2[1]} = ${len(e, u)} + ${len(inset, u)} = ${ans(`${len(want, u)} ${u}`)}.`]
      : [`${N2[0]} is at the ${len(s, u)} mark, ${N2[1]} at the ${len(e, u)} mark.`, `Length = the spaces between: ${len(e, u)} − ${len(s, u)} = ${ans(`${len(want, u)} ${u}`)}.`],
    answer: lenAnswer(want, u), check: lenCheck(want, u, wrong, `Yes: ${N2.join('')} = ${len(want, u)} ${u}.`),
  };
}, R, () => segLen(rngFallback(n), n));

const endMark: Gen = (R, n) => fitted(R => {
  const u = pick(R, ['in', 'cm'] as const), names = pick(R, NAMES), Ln = u === 'in' ? 7 : 14, inset = u === 'in' ? 0.25 : 0.5;
  const edge = R() < 0.3;
  const s = edge ? -inset : (u === 'in' ? halves(R, 1, 3) : int(R, 1, 5)), L = u === 'in' ? halves(R, 1.5, 4) : lenOf(R, u, 3, 8, R() < 0.4);
  const want = s + L;
  const N2: [string, string] = [names[0], names[1]];
  const wrong = [{ v: L, mc: 'mc.measurement-units.aligns-at-ruler-end-or-1', say: edge ? `The ruler's end is not its 0: the 0 mark is ${len(inset, u)} ${u} in. From the end, ${len(L, u)} ${u} reaches the ${len(want, u)} mark.` : `${len(L, u)} would be right if ${N2[0]} were at 0. It is at ${len(s, u)}, so add: ${len(s, u)} + ${len(L, u)} = ${len(want, u)}.` }];
  if (!edge && Number.isInteger(s) && Number.isInteger(L)) wrong.push({ v: s + L - 1, mc: 'mc.count.counts-points-not-intervals', say: `That counts ${len(s, u)} as the first unit. Count the spaces: ${len(L, u)} spaces after ${len(s, u)} is ${len(want, u)}.` });
  return {
    id: `endMark-${n}`, family: 'endMark',
    prompt: edge ? `You start segment ${N2.join('')} at the very end of the ruler (look where its 0 is). At which mark do you put ${N2[1]} for ${N2.join('')} = ${len(L, u)} ${u}?` : `Point ${N2[0]} is at the ${len(s, u)} mark. At which mark do you put ${N2[1]} so that ${N2.join('')} = ${len(L, u)} ${u}?`,
    board: `${N2.join('')} = ${lenT(L, u)}\\ \\text{${u}}`, input: u === 'in' ? 'frac' : 'num', unit: u === 'in' ? 'in mark' : 'cm mark',
    picture: { kind: 'ruler', unit: u, deg: 0, inset, len: Ln, start: s, names: N2 },
    solution: edge ? [`The ruler's end is ${len(inset, u)} ${u} before 0.`, `${len(L, u)} ${u} from the end reaches the ${len(L, u)} − ${len(inset, u)} = ${ans(len(want, u))} mark.`] : [`Start at ${len(s, u)} and go ${len(L, u)} ${u} further.`, `${len(s, u)} + ${len(L, u)} = ${len(want, u)}: put ${N2[1]} at the ${ans(len(want, u))} mark.`],
    answer: lenAnswer(want, u), check: lenCheck(want, u, wrong, `Yes: from ${len(s, u)} to ${len(want, u)} is ${len(L, u)} ${u}.`),
  };
}, R, () => endMark(rngFallback(n), n));

// =====================================================================================================
// 3 draw-triangle-sas: the angle goes between the given sides; read the right protractor scale
// =====================================================================================================
const sasWhere: Gen = (R, n) => fitted(R => {
  const u = pick(R, ['in', 'cm'] as const), N = pick(R, NAMES);
  const AB = lenOf(R, u, u === 'in' ? 2.5 : 5, u === 'in' ? 4.5 : 9, u === 'in'), AC = lenOf(R, u, u === 'in' ? 2 : 4, u === 'in' ? 4 : 8, u === 'in'), a = 5 * int(R, 6, 24);
  const t = solveSAS(AB, AC, a);
  if (Math.min(t.angB, t.angC) < 18) return sasWhere(R, n);
  const givens = shuffle(R, [sideH(N, 'AB', AB, u), sideH(N, 'AC', AC, u), angH(N, 'A', a)]);
  const kindWord = a < 90 ? 'acute' : a === 90 ? 'right' : 'obtuse';
  const c: ConstructSpec = { kind: 'sas', unit: u, AB, AC, angA: a, names: N, rot: pick(R, [0, 0, 10, -8]) };
  return choice(R, {
    id: `sasWhere-${n}`, family: 'sasWhere',
    prompt: `Draw triangle ${N.join('')} with ${list(givens)}. ${nm(N, 'AB')} is drawn. Where do you draw the ${a}° angle?`,
    board: [sideT(N, 'AB', AB, u), angT(N, 'A', a), sideT(N, 'AC', AC, u)].join(NL),
    picture: { kind: 'construct', c, upto: 'base' },
    solution: [`The ${kindWord} angle goes between the given sides: ${nm(N, 'AB')} and ${nm(N, 'AC')} meet at ${nm(N, 'A')}.`, `Protractor on ${nm(N, 'A')}, draw the ${a}° ray, measure ${len(AC, u)} ${u} along it to ${nm(N, 'C')}.`, `Join ${nm(N, 'C')} to ${nm(N, 'B')}.`],
  }, [
    { t: `At ${nm(N, 'A')}, between ${nm(N, 'AB')} and ${nm(N, 'AC')}`, ok: true, say: `Yes: ${nm(N, 'AB')} and ${nm(N, 'AC')} meet at ${nm(N, 'A')}, so the angle between them is at ${nm(N, 'A')}.` },
    { t: `At ${nm(N, 'B')}, the other end of ${nm(N, 'AB')}`, mc: 'mc.geometric-proof.triangle-angle-at-wrong-vertex', say: `${nm(N, 'B')} is not on ${nm(N, 'AC')}. The ${a}° angle is ∠${nm(N, 'A')}: at the corner the two given sides share.` },
    { t: `At ${nm(N, 'C')}, the corner opposite ${nm(N, 'AB')}`, mc: 'mc.geometric-proof.triangle-angle-at-wrong-vertex', say: `The angle is named ∠${nm(N, 'A')}: it sits at ${nm(N, 'A')}, where ${nm(N, 'AB')} and ${nm(N, 'AC')} meet.` },
  ]);
}, R, () => sasWhere(rngFallback(n), n));

const protractor: Gen = (R, n) => fitted(R => {
  const x = 5 * pick(R, [6, 7, 8, 9, 10, 11, 12, 13, 14, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
  const bRight = R() < 0.5, N = pick(R, NAMES);
  const good = bRight ? x : 180 - x, bad = 180 - good;
  // dot names that are not vertex names (the side PQ with dots P and Q would be two things called P)
  const [pn, qn] = shuffle(R, (['P', 'Q', 'S', 'T', 'X', 'Y'] as string[]).filter(c => !N.includes(c)).slice(0, 2)) as [string, string];
  const dots = shuffle(R, [{ name: pn, deg: good }, { name: qn, deg: bad }]);
  return choice(R, {
    id: `protractor-${n}`, family: 'protractor',
    prompt: `You draw ∠${N[0]} = ${x}° on side ${N[0]}${N[1]}. The protractor's centre is on ${N[0]} and its straight edge lies along ${N[0]}${N[1]}. Which dot do you mark for the ${x}° ray?`,
    board: `\\angle ${N[0]} = ${x}^\\circ`,
    picture: { kind: 'protractor', x, bRight, dots, names: [N[0], N[1]] },
    solution: [`Find the scale whose 0 sits on ${N[0]}${N[1]} (${bRight ? 'the outer scale: 0 on the right' : 'the inner scale: 0 on the left'}).`, `Count up that scale to ${x}: that is dot ${pn}. The other scale's ${x} makes ${180 - x}°.`],
  }, [
    { t: `Dot ${pn}`, ok: true, say: `Yes: on the scale that starts at 0 on ${N[0]}${N[1]}, dot ${pn} is at ${x}.` },
    { t: `Dot ${qn}`, mc: 'mc.angles.reads-wrong-protractor-scale', say: `Dot ${qn} reads ${x} on the scale whose 0 is on the far side, not on ${N[0]}${N[1]}. From ${N[0]}${N[1]} it makes ${180 - x}°.` },
    { t: `Either one: both are at ${x}`, mc: 'mc.angles.reads-wrong-protractor-scale', say: `Only one of them is ${x}° from ${N[0]}${N[1]}. Use the scale whose 0 sits on ${N[0]}${N[1]}; the other gives ${180 - x}°.` },
  ]);
}, R, () => protractor(rngFallback(n), n));

// =====================================================================================================
// 4 draw-triangle-asa: the third corner is where the two angle rays meet
// =====================================================================================================
const asaRays: Gen = (R, n) => fitted(R => {
  const N = pick(R, NAMES), u = pick(R, ['in', 'cm'] as const);
  let a: number, b: number;
  do { a = 5 * int(R, 6, 15); b = 5 * int(R, 6, 15); } while (a === b || a + b > 130 || Math.abs(a - b) < 15);
  const AB = 4, t = solveASA(AB, a, b), LA = t.AC + 0.6, LB = t.BC + 0.6;
  const base = { unit: u, A: t.A, B: t.B, C: t.C, names: N, closed: false, sides: {} } as TriPic;
  const right: TriPic = { ...base, rays: [{ from: 'A', deg: a, len: LA, mark: { ref: [1, 0], text: `${a}°` } }, { from: 'B', deg: 180 - b, len: LB, mark: { ref: [AB - 1, 0], text: `${b}°` } }] };
  const common: TriPic = { ...base, rays: [{ from: 'A', deg: a, len: LA, mark: { ref: [1, 0], text: `${a}°` } }, { from: 'B', deg: b, len: 2.2, mark: { ref: [AB + 1, 0], text: `${b}°` } }] };
  const ts = solveASA(AB, b, a);
  const swapped: TriPic = { ...base, rays: [{ from: 'A', deg: b, len: ts.AC + 0.6, mark: { ref: [1, 0], text: `${b}°` } }, { from: 'B', deg: 180 - a, len: ts.BC + 0.6, mark: { ref: [AB - 1, 0], text: `${a}°` } }] };
  const opts = shuffle(R, [
    { t: right, ok: true, mc: undefined as string | undefined, say: `Yes: each angle is measured from ${N[0]}${N[1]} at its own end, and the rays meet at ${N[2]}.` },
    { t: common, ok: false, mc: 'mc.angles.base-angle-rays-use-common-direction', say: `In that drawing the ${b}° at ${N[1]} is measured from the line going on to the right, away from ${N[0]}. Measure it from ${N[1]}${N[0]}, the side of the triangle.` },
    { t: swapped, ok: false, mc: 'mc.geometric-proof.triangle-angle-at-wrong-vertex', say: `That drawing swaps the angles: ${a}° belongs at ${N[0]} and ${b}° at ${N[1]}.` },
  ]);
  return choice(R, {
    id: `asaRays-${n}`, family: 'asaRays',
    prompt: `Draw triangle ${N.join('')} with ${sideH(N, 'AB', AB, u)}, ${angH(N, 'A', a)} and ${angH(N, 'B', b)}. Which drawing has both rays right?`,
    board: [sideT(N, 'AB', AB, u), angT(N, 'A', a), angT(N, 'B', b)].join(NL),
    picture: { kind: 'tris', ts: opts.map(o => ({ ...o.t, size: 46 })) },
    solution: [`At ${N[0]}: ${a}° measured from ${N[0]}${N[1]}. At ${N[1]}: ${b}° measured from ${N[1]}${N[0]}, the same side, from its other end.`, `Both rays lean in over ${N[0]}${N[1]}; where they meet is ${N[2]}.`],
  }, opts.map((o, i) => ({ t: `Drawing ${i + 1}`, ok: o.ok, mc: o.mc, say: o.say })), true);
}, R, () => asaRays(rngFallback(n), n));

const asaWhere: Gen = (R, n) => fitted(R => {
  const N = pick(R, NAMES), u = pick(R, ['in', 'cm'] as const);
  let a: number, b: number;
  do { a = 5 * int(R, 6, 16); b = 5 * int(R, 6, 16); } while (a + b > 140);
  const AB = u === 'in' ? halves(R, 3, 5) : int(R, 6, 11);
  const cands = shuffle(R, candLetters(R, N)) as [string, string, string];
  const c: ConstructSpec = { kind: 'asa', unit: u, AB, angA: a, angB: b, names: N, rot: pick(R, [0, 0, 8, -10]), cands };
  return choice(R, {
    id: `asaWhere-${n}`, family: 'asaWhere',
    prompt: `Triangle ${N.join('')}: ${sideH(N, 'AB', AB, u)}, ${angH(N, 'A', a)}, ${angH(N, 'B', b)}. Both rays are drawn. Which point is ${N[2]}?`,
    board: [sideT(N, 'AB', AB, u), angT(N, 'A', a), angT(N, 'B', b)].join(NL),
    picture: { kind: 'construct', c, upto: 'C' },
    solution: [`${N[2]} has to be on the ray from ${N[0]} (the ${a}° angle) AND on the ray from ${N[1]} (the ${b}° angle).`, `Only the point where the rays cross is on both: ${cands[0]}.`],
  }, [
    { t: cands[0], ok: true, say: `Yes: ${cands[0]} is on both rays, so it gives ${a}° at ${N[0]} and ${b}° at ${N[1]}.` },
    { t: cands[1], mc: 'mc.geometric-proof.stops-after-some-conditions', say: `${cands[1]} is on the ray from ${N[0]} only: it gives ${a}° at ${N[0]}, but not ${b}° at ${N[1]}. ${N[2]} must meet both conditions.` },
    { t: cands[2], mc: 'mc.geometric-proof.stops-after-some-conditions', say: `${cands[2]} is on the ray from ${N[1]} only: it gives ${b}° at ${N[1]}, but not ${a}° at ${N[0]}. ${N[2]} must meet both conditions.` },
  ]);
}, R, () => asaWhere(rngFallback(n), n));

// =====================================================================================================
// 5 compass-transfer: the compass carries a fixed distance
// =====================================================================================================
const compassCopy: Gen = (R, n) => fitted(R => {
  const u = pick(R, ['in', 'cm'] as const), N = pick(R, NAMES.filter(x => !x.includes('D'))), L = u === 'in' ? halves(R, 1.5, 4) : int(R, 3, 9);
  // the new point is D, so the given points never use D (D E F would have two D's); Dn stays a safety net
  const Dn = ['D', 'X', 'M', 'T'].find(c => !N.includes(c))!;
  const pic: Pic = { kind: 'copy', unit: u, L, names: [N[0], N[1], N[2]], newName: Dn, rayDeg: pick(R, [0, 12, -10, 20]), segDeg: pick(R, [0, 15, -12, 25]) };
  const PQ = `${N[0]}${N[1]}`;
  if (R() < 0.55) {
    return choice(R, {
      id: `compassCopy-${n}`, family: 'compassCopy',
      prompt: `Copy ${PQ} (${len(L, u)} ${u}) onto the ray from ${N[2]}, so that ${N[2]}${Dn} = ${PQ}, without measuring. What do you do?`,
      board: `${N[2]}${Dn} = ${PQ}`, picture: pic, solvePic: pic,
      solution: [`Put the compass point on ${N[0]} and open it until the pencil is on ${N[1]}.`, `Keep that opening. Put the point on ${N[2]} and swing an arc across the ray: that is ${Dn}.`],
    }, [
      { t: `Open the compass from ${N[0]} to ${N[1]}, keep that opening, and swing an arc from ${N[2]} across the ray.`, ok: true, say: `Yes: the opening IS the length ${PQ}, so every point of the arc is ${PQ} away from ${N[2]}.` },
      { t: `Open the compass from ${N[0]} to ${N[1]}, then widen it a little so the arc crosses the ray nicely.`, mc: 'mc.geometric-proof.compass-width-changed', say: `Widening the compass changes the length it carries. Keep the opening exactly as ${PQ}.` },
      { t: `Lay the ruler along the ray and mark ${Dn} where it looks about as long as ${PQ}.`, mc: 'mc.geometric-proof.construction-by-eye-or-measure', say: `By eye is a guess. The compass carries the exact length of ${PQ} over to the ray.` },
    ]);
  }
  const how = pick(R, ['narrower', 'wider'] as const);
  return choice(R, {
    id: `compassCopy-${n}`, family: 'compassCopy',
    prompt: `Jo opened the compass from ${N[0]} to ${N[1]} (${len(L, u)} ${u}). Then the compass slipped a little ${how}, and Jo swung the arc from ${N[2]} anyway. Is ${N[2]}${Dn} still ${len(L, u)} ${u}?`,
    board: `${PQ} = ${lenT(L, u)}\\ \\text{${u}}`, picture: pic, solvePic: pic,
    solution: [`The compass carries whatever its opening is.`, `A ${how} opening gives a ${how === 'narrower' ? 'shorter' : 'longer'} ${N[2]}${Dn}. Reset it on ${PQ} and swing again.`],
  }, [
    { t: `No: ${N[2]}${Dn} is now ${how === 'narrower' ? 'shorter' : 'longer'} than ${PQ}.`, ok: true, say: `Right: the opening is the length. Change the opening and you change the length.` },
    { t: `Yes: it was set to ${PQ} first, so it still copies ${PQ}.`, mc: 'mc.geometric-proof.compass-width-changed', say: `The compass only remembers its CURRENT opening. A ${how} opening carries a ${how === 'narrower' ? 'shorter' : 'longer'} length.` },
    { t: `Yes, as long as the arc still crosses the ray.`, mc: 'mc.geometric-proof.construction-by-eye-or-measure', say: `Crossing the ray is not the test: the distance from ${N[2]} is. That is the opening, which changed.` },
  ]);
}, R, () => compassCopy(rngFallback(n), n));

const compassOpen: Gen = (R, n) => fitted(R => {
  const u = pick(R, ['in', 'cm'] as const), Ln = u === 'in' ? 6 : 12;
  const s = u === 'in' ? pick(R, [0.5, 1, 1, 1.5, 2]) : int(R, 1, 3), L = u === 'in' ? halves(R, 1.5, 3.5) : int(R, 3, 7);
  const e = s + L;
  if (e > Ln - 0.5) return compassOpen(R, n);
  const wrong = [{ v: e, mc: 'mc.measurement-units.aligns-at-ruler-end-or-1', say: `${len(e, u)} is where the pencil sits, but the point is at ${len(s, u)}, not at 0. The opening is ${len(e, u)} − ${len(s, u)} = ${len(L, u)} ${u}.` }];
  if (Number.isInteger(s) && Number.isInteger(e)) wrong.push({ v: e - s + 1, mc: 'mc.count.counts-points-not-intervals', say: `That counts the marks. The opening is the spaces between ${len(s, u)} and ${len(e, u)}: ${len(L, u)} ${u}.` });
  return {
    id: `compassOpen-${n}`, family: 'compassOpen',
    prompt: `Lee set the compass on a ruler like this, then swung an arc from point A that crosses a ray at D. How long is AD?`,
    board: `AD = \\,?\\ \\text{${u}}`, input: u === 'in' ? 'frac' : 'num', unit: u,
    picture: { kind: 'compassRuler', unit: u, s, e, len: Ln },
    solution: [`The point is at ${len(s, u)}, the pencil at ${len(e, u)}: the opening is ${len(e, u)} − ${len(s, u)} = ${len(L, u)} ${u}.`, `The arc keeps that opening, so AD = ${ans(`${len(L, u)} ${u}`)}.`],
    answer: lenAnswer(L, u), check: lenCheck(L, u, wrong, `Yes: the opening is ${len(L, u)} ${u}, and the arc carries it to D.`),
  };
}, R, () => compassOpen(rngFallback(n), n));

// =====================================================================================================
// 6 draw-triangle-sss: the third corner is where two distance arcs cross
// =====================================================================================================
function sssLens(R: () => number, u: Unit): [number, number, number] {
  for (;;) {
    const kind = pick(R, ['scalene', 'scalene', 'iso', 'equi'] as const), half = u === 'in' && R() < 0.4;
    const L = (lo: number, hi: number) => (half ? halves(R, lo, hi) : int(R, lo, hi));
    let AB: number, AC: number, BC: number;
    if (u === 'in') { AB = L(3, 6); AC = L(2, 5); BC = kind === 'iso' ? AC : L(2, 5); }
    else { AB = L(6, 12); AC = L(4, 10); BC = kind === 'iso' ? AC : L(4, 10); }
    if (kind === 'equi') { AC = AB; BC = AB; }
    if (existsSSS(AB, AC, BC) !== 'yes') continue;
    const t = solveSSS(AB, AC, BC);
    if (Math.min(t.angA, t.angB, t.angC) < 22) continue;
    return [AB, AC, BC];
  }
}
const sssNext: Gen = (R, n) => fitted(R => {
  const u = pick(R, ['in', 'cm'] as const), N = pick(R, NAMES), [AB, AC, BC] = sssLens(R, u);
  const c: ConstructSpec = { kind: 'sss', unit: u, AB, AC, BC, names: N, rot: pick(R, [0, 0, 0, 12, -10]) };
  const opts: Opt[] = [
    { t: `An arc of ${len(AC, u)} ${u} around ${N[0]}, an arc of ${len(BC, u)} ${u} around ${N[1]}; ${N[2]} is where they cross.`, ok: true, say: `Yes: ${N[2]} must be ${len(AC, u)} ${u} from ${N[0]} and ${len(BC, u)} ${u} from ${N[1]}; the crossing is both.` },
    { t: `Draw ${N[0]}${N[2]} = ${len(AC, u)} ${u} with the ruler at a slant that looks right, then join ${N[2]} to ${N[1]}.`, mc: 'mc.geometric-proof.construction-by-eye-or-measure', say: `Then ${N[1]}${N[2]} is whatever it turns out to be. The arcs make BOTH lengths come out exactly.` },
  ];
  if (AC !== BC) opts.push({ t: `An arc of ${len(BC, u)} ${u} around ${N[0]}, an arc of ${len(AC, u)} ${u} around ${N[1]}; ${N[2]} is where they cross.`, say: `Those arcs are swapped: the arc around ${N[0]} carries ${N[0]}${N[2]} = ${len(AC, u)} ${u}, the side that starts at ${N[0]}.` });
  else opts.push({ t: `One arc of ${len(AC, u)} ${u} around the middle of ${N[0]}${N[1]}.`, say: `${N[2]} has to be ${len(AC, u)} ${u} from ${N[0]} AND from ${N[1]}: one arc around each end.` });
  return choice(R, {
    id: `sssNext-${n}`, family: 'sssNext',
    prompt: `Construct triangle ${N.join('')} with ${sideH(N, 'AB', AB, u)}, ${sideH(N, 'AC', AC, u)} and ${sideH(N, 'BC', BC, u)}. ${N[0]}${N[1]} is drawn. What comes next?`,
    board: [sideT(N, 'AB', AB, u), sideT(N, 'AC', AC, u), sideT(N, 'BC', BC, u)].join(NL),
    picture: { kind: 'construct', c, upto: 'base' },
    solution: [`Open the compass to ${len(AC, u)} ${u}, point on ${N[0]}, swing an arc.`, `Open it to ${len(BC, u)} ${u}, point on ${N[1]}, swing an arc.`, `${N[2]} is where the arcs cross; join it to ${N[0]} and ${N[1]}.`],
  }, opts);
}, R, () => sssNext(rngFallback(n), n));

const sssPoint: Gen = (R, n) => fitted(R => {
  const u = pick(R, ['in', 'cm'] as const), N = pick(R, NAMES), [AB, AC, BC] = sssLens(R, u);
  const cands = shuffle(R, candLetters(R, N)) as [string, string, string];
  const c: ConstructSpec = { kind: 'sss', unit: u, AB, AC, BC, names: N, rot: pick(R, [0, 0, 10, -8]), cands };
  return choice(R, {
    id: `sssPoint-${n}`, family: 'sssPoint',
    prompt: `Triangle ${N.join('')}: ${sideH(N, 'AB', AB, u)}, ${sideH(N, 'AC', AC, u)}, ${sideH(N, 'BC', BC, u)}. The arcs are drawn. Which point is ${N[2]}?`,
    board: [sideT(N, 'AB', AB, u), sideT(N, 'AC', AC, u), sideT(N, 'BC', BC, u)].join(NL),
    picture: { kind: 'construct', c, upto: 'C' },
    solution: [`The arc around ${N[0]} holds every point ${len(AC, u)} ${u} from ${N[0]}; the arc around ${N[1]} every point ${len(BC, u)} ${u} from ${N[1]}.`, `${N[2]} has to be on both: the crossing, ${cands[0]}.`],
  }, [
    { t: cands[0], ok: true, say: `Yes: ${cands[0]} is on both arcs: ${len(AC, u)} ${u} from ${N[0]} and ${len(BC, u)} ${u} from ${N[1]}.` },
    { t: cands[1], mc: 'mc.geometric-proof.stops-after-some-conditions', say: `${cands[1]} is on the arc around ${N[0]} only: ${len(AC, u)} ${u} from ${N[0]}, but not ${len(BC, u)} ${u} from ${N[1]}.` },
    { t: cands[2], mc: 'mc.geometric-proof.stops-after-some-conditions', say: `${cands[2]} is on the arc around ${N[1]} only: ${len(BC, u)} ${u} from ${N[1]}, but not ${len(AC, u)} ${u} from ${N[0]}.` },
  ]);
}, R, () => sssPoint(rngFallback(n), n));

// =====================================================================================================
// 7 tolerance-audit: check EVERY condition against its stated tolerance
// =====================================================================================================
const audit: Gen = (R, n) => fitted(R => {
  const kind = pick(R, ['SAS', 'ASA', 'SSS'] as const), q = request(R, kind, 'cm'), N = q.names;
  interface C2 { label: string; want: number; got: number; tol: number; unit: string; side?: Sd; v?: V }
  const conds: C2[] = [
    ...(Object.entries(q.sides) as [Sd, number][]).map(([s, x]) => ({ label: nm(N, s), want: x, got: x, tol: 0.2, unit: 'cm', side: s })),
    ...(Object.entries(q.angles) as [V, number][]).map(([v, x]) => ({ label: `∠${nm(N, v)}`, want: x, got: x, tol: 2, unit: '°', v })),
  ];
  const pass = R() < 0.4;
  const fmt = (c: C2, v: number) => (c.unit === '°' ? `${v}°` : `${v.toFixed(1)} cm`);
  const small = (c: C2) => (c.unit === '°' ? pick(R, [-2, -1, 1, 2]) : pick(R, [-0.2, -0.1, 0.1, 0.2]));
  const big = (c: C2) => (c.unit === '°' ? pick(R, [-5, -4, -3, 3, 4, 5]) : pick(R, [-0.5, -0.4, -0.3, 0.3, 0.4]));
  // every condition gets a small error or none; at least one nonzero; when failing, one (often the last) is too far
  conds.forEach(c => { c.got = Math.round((c.want + (R() < 0.6 ? small(c) : 0)) * 10) / 10; });
  if (conds.every(c => eq(c.got, c.want))) conds[0]!.got = Math.round((conds[0]!.want + small(conds[0]!)) * 10) / 10;
  const failIdx = pass ? -1 : (R() < 0.6 ? conds.length - 1 : int(R, 0, conds.length - 1));
  if (failIdx >= 0) conds[failIdx]!.got = Math.round((conds[failIdx]!.want + big(conds[failIdx]!)) * 10) / 10;
  const okAll = conds.every(c => within({ what: c.label, want: c.want, got: c.got, tol: c.tol, unit: c.unit }));
  if (okAll !== pass) return audit(R, n);
  const off = (c: C2) => (c.unit === '°' ? `${Math.abs(c.got - c.want)}°` : `${Math.round(Math.abs(c.got - c.want) * 10)} mm`);
  const sideTxt: TriPic['sides'] = {}, angTxt: TriPic['angles'] = {};
  for (const c of conds) { if (c.side) sideTxt[c.side] = { text: fmt(c, c.got) }; if (c.v) angTxt[c.v] = { text: fmt(c, c.got) }; }
  const nonzeroOk = conds.filter((c, i) => i !== failIdx && !eq(c.got, c.want));
  const opts: Opt[] = [];
  if (pass) {
    const nz = nonzeroOk[0]!;
    const exact = conds.find(c => eq(c.got, c.want));
    opts.push({ t: 'Yes: every condition is within its tolerance.', ok: true, say: `Right: every measurement is within ${'2 mm'} or 2°. Small differences are expected when you measure.` });
    opts.push({ t: `No: ${nz.label} is ${off(nz)} off, so it is wrong.`, mc: 'mc.measurement-units.audits-one-feature-without-tolerances', say: `${off(nz)} is inside the tolerance (${nz.unit === '°' ? '2°' : '2 mm'}). The tolerance says how close is close enough.` });
    opts.push(exact ? { t: `Yes, because ${exact.label} is exactly right.`, mc: 'mc.geometric-proof.stops-after-some-conditions', say: `One condition is not enough: check all ${conds.length}. Here they all happen to pass.` }
      : { t: `No: a drawing must match every number exactly.`, mc: 'mc.measurement-units.audits-one-feature-without-tolerances', say: `No drawing is exact. The tolerance says how close is close enough, and every condition is inside it.` });
  } else {
    const F = conds[failIdx]!;
    const others = conds.filter((_, i) => i !== failIdx);
    opts.push({ t: `No: ${F.label} is ${off(F)} off, more than ${F.unit === '°' ? '2°' : '2 mm'}.`, ok: true, say: `Right: ${F.label} measures ${fmt(F, F.got)} but should be ${fmt(F, F.want)}: outside the tolerance.` });
    opts.push({ t: `Yes: ${others.map(c => c.label).join(' and ')} ${others.length > 1 ? 'are' : 'is'} within the tolerance.`, mc: 'mc.geometric-proof.stops-after-some-conditions', say: `Check every condition, not just some: ${F.label} is ${off(F)} off.` });
    const nz = nonzeroOk[0];
    opts.push(nz ? { t: `No: ${nz.label} is ${off(nz)} off.`, mc: 'mc.measurement-units.audits-one-feature-without-tolerances', say: `${nz.label} is within its tolerance. The condition that fails is ${F.label}: ${off(F)} off.` }
      : { t: 'Yes: a drawing can never be exact anyway.', say: `Not exact is fine, but only inside the tolerance. ${F.label} is ${off(F)} off.` });
  }
  return choice(R, {
    id: `audit-${n}`, family: 'audit',
    prompt: `The request: triangle ${N.join('')} with ${reqHtml(q)}, lengths within 2 mm and angles within 2°. Lee measured the drawing (numbers on the picture). Does it pass?`,
    board: [reqTex(q), '\\pm 2\\ \\text{mm},\\ \\pm 2^\\circ'].join(NL),
    picture: { kind: 'tri', t: { unit: 'cm', A: q.tri.A, B: q.tri.B, C: q.tri.C, names: N, sides: sideTxt, angles: angTxt } },
    solution: [...conds.map(c => `${c.label}: wanted ${fmt(c, c.want)}, measured ${fmt(c, c.got)}: ${within({ what: c.label, want: c.want, got: c.got, tol: c.tol, unit: c.unit }) ? 'within' : 'outside'} the tolerance.`), pass ? 'All within: it passes.' : 'One outside: it does not pass.'],
  }, opts);
}, R, () => audit(rngFallback(n), n));

// =====================================================================================================
// 8 triangle-existence: the two shorter sides must add up to MORE than the longest
// =====================================================================================================
const exists: Gen = (R, n) => fitted(R => {
  const u = pick(R, ['in', 'cm'] as const), kind = pick(R, ['yes', 'flat', 'short'] as const);
  const a = int(R, 2, u === 'in' ? 4 : 6), b = int(R, a, u === 'in' ? 5 : 7);
  const c = kind === 'yes' ? int(R, b, a + b - 1) : kind === 'flat' ? a + b : int(R, a + b + 1, a + b + 3);
  if (c > (u === 'in' ? 10 : 14) || (kind === 'yes' && c === a && a === b && R() < 0.7)) return exists(R, n);
  const lens = shuffle(R, [a, b, c]);
  const L = (x: number) => `${x} ${u}`;
  const opts: Opt[] = kind === 'yes' ? [
    { t: `Yes: ${a} + ${b} = ${a + b}, more than ${c}.`, ok: true, say: `Right: the two shorter sticks reach past the longest, so they meet above it.` },
    { t: `No: the ${c} ${u} stick is too long for the other two.`, say: `Add the two shorter ones: ${a} + ${b} = ${a + b}, more than ${c}. They do reach.` },
    { t: `Only if one corner is a right angle.`, say: `No right angle needed: ${a} + ${b} > ${c} is all it takes.` },
  ] : kind === 'flat' ? [
    { t: `No: ${a} + ${b} = ${c} exactly, so they lie flat.`, ok: true, say: `Right: the two shorter sticks only just reach, lying along the ${c} ${u} stick. No corner, no triangle.` },
    { t: `Yes, a very flat triangle.`, mc: 'mc.shapes.accepts-degenerate-triangle', say: `Flat means all three corners on one line: that is not a triangle. The sum has to be MORE than ${c}.` },
    { t: `Yes: ${c} + ${a} is more than ${b}.`, mc: 'mc.shapes.checks-wrong-pair-in-triangle-inequality', say: `That pair always works. The test that matters is the two SHORTER sides: ${a} + ${b} = ${c}, not more.` },
  ] : [
    { t: `No: ${a} + ${b} = ${a + b}, less than ${c}.`, ok: true, say: `Right: the two shorter sticks can't even reach across the ${c} ${u} one.` },
    { t: `Yes: ${c} + ${a} is more than ${b}.`, mc: 'mc.shapes.checks-wrong-pair-in-triangle-inequality', say: `That pair always works. Check the two SHORTER sides: ${a} + ${b} = ${a + b}, less than ${c}.` },
    { t: `Yes: any three sticks make a triangle.`, mc: 'mc.shapes.any-measurements-make-a-triangle', say: `Not any three: the two shorter ones have to reach. ${a} + ${b} = ${a + b} falls short of ${c}.` },
  ];
  const c2: ConstructSpec = { kind: 'sss', unit: u, AB: c, AC: a, BC: b, names: ['A', 'B', 'C'] };
  return choice(R, {
    id: `exists-${n}`, family: 'exists',
    prompt: `Can sticks of ${lens.map(x => `<b class="a">${L(x)}</b>`).join(', ').replace(/, ([^,]*)$/, ' and $1')} make a triangle?`,
    board: `${lens.join(',\\ ')}\\ \\text{${u}}`,
    picture: { kind: 'sticks', unit: u, lens }, solvePic: { kind: 'construct', c: c2, upto: 'base' },
    solution: [`Add the two shorter sides: ${a} + ${b} = ${a + b}.`, `Compare with the longest, ${c}: ${a + b > c ? `more, so the arcs cross: a triangle.` : a + b === c ? `equal, so the arcs only touch on the base: flat, no triangle.` : `less, so the arcs never meet: no triangle.`}`],
  }, opts);
}, R, () => exists(rngFallback(n), n));

const thirdSide: Gen = (R, n) => {
  const u = pick(R, ['in', 'cm'] as const), p = int(R, 2, u === 'in' ? 7 : 12), q = int(R, 2, u === 'in' ? 7 : 12);
  const [lo, hi] = thirdSideRange(p, q), d = Math.abs(p - q), s = p + q;
  return {
    id: `thirdSide-${n}`, family: 'thirdSide',
    prompt: `Two sides of a triangle are <b class="a">${p} ${u}</b> and <b class="a">${q} ${u}</b>. The third side is a whole number of ${u === 'in' ? 'inches' : 'centimeters'}. What is the shortest it can be, and the longest?`,
    board: `${p},\\ ${q},\\ ?\\ \\text{${u}}`, input: 'pair', pairLead: 'from', pairOp: 'to',
    picture: { kind: 'sticks', unit: u, lens: [p, q] },
    solution: [`Longest: the two given sides must add up to MORE than it, so less than ${p} + ${q} = ${s}: at most ${hi}.`, `Shortest: it plus the shorter given side must be MORE than the longer one, so more than ${Math.max(p, q)} − ${Math.min(p, q)} = ${d}: at least ${lo}.`, `So from ${ans(lo)} to ${ans(hi)} ${u}. ${d} and ${s} would lie flat.`],
    answer: { kind: 'pair', x: lo, y: hi },
    check: (r: Response): Verdict => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes with whole numbers.' };
      if (r.x === lo && r.y === hi) return { ok: true, say: `Yes: from ${lo} to ${hi} ${u}. At ${d} or ${s} the sides would lie flat.` };
      if (r.x === d || r.y === s) return { ok: false, mc: 'mc.shapes.accepts-degenerate-triangle', say: `${r.x === d ? d : s} ${u} makes the sides add up EXACTLY: they lie flat, no triangle. So from ${lo} to ${hi}.` };
      if (r.x < d) return { ok: false, mc: 'mc.shapes.checks-wrong-pair-in-triangle-inequality', say: `With a third side of ${r.x}, the two shorter sides (${r.x} and ${Math.min(p, q)}) don't reach past ${Math.max(p, q)}. Check the two SHORTER sides: at least ${lo}.` };
      if (r.y > s) return { ok: false, mc: 'mc.shapes.any-measurements-make-a-triangle', say: `${r.y} is longer than ${p} + ${q} = ${s}: the two given sides could not reach. At most ${hi}.` };
      return { ok: false, say: `Not quite: from ${lo} to ${hi} ${u}.` };
    },
  };
};

// =====================================================================================================
// 9 angle-sum-investigate: the three angles total 180 degrees, whatever the size or shape
// =====================================================================================================
function anglesTriple(R: () => number, kind: 'acute' | 'right' | 'obtuse'): [number, number, number] {
  for (;;) {
    let a: number, b: number;
    if (kind === 'right') { a = 90; b = int(R, 25, 65); }
    else if (kind === 'obtuse') { a = int(R, 95, 125); b = int(R, 22, 180 - a - 22); }
    else { a = int(R, 40, 85); b = int(R, 40, 85); }
    const c = 180 - a - b;
    if (c < 22 || (kind === 'acute' && c >= 90)) continue;
    return shuffle(R, [a, b, c]) as [number, number, number];
  }
}
function anglePic(ang: [number, number, number], show: (string | null)[], N: [string, string, string], u: Unit = 'in'): TriPic {
  const t = solveASA(4, ang[0], ang[1]);
  const an: TriPic['angles'] = {};
  (['A', 'B', 'C'] as V[]).forEach((v, i) => { const s = show[i]; if (s) an[v] = { text: s }; });
  const rv = (['A', 'B', 'C'] as V[]).find((_, i) => ang[i] === 90 && show[i] !== null && show[i] !== '?');
  return { unit: u, A: t.A, B: t.B, C: t.C, names: N, angles: an, right: rv, rot: 0 };
}
const CTX_ANG = [
  (a: number, b: number) => `Two angles of a triangle measure <b class="b">${a}°</b> and <b class="b">${b}°</b>. What is the third angle?`,
  (a: number, b: number) => `A triangular sail has corners of <b class="b">${a}°</b> and <b class="b">${b}°</b>. What is its third corner?`,
  (a: number, b: number) => `A roof truss is a triangle with angles of <b class="b">${a}°</b> and <b class="b">${b}°</b> at the ends of its base. What is the angle at the top?`,
  (a: number, b: number) => `You drew rays of <b class="b">${a}°</b> and <b class="b">${b}°</b> at the ends of a base. Predict the angle where they meet.`,
];
const thirdAngleF: Gen = (R, n) => fitted(R => {
  const kind = pick(R, ['acute', 'right', 'obtuse'] as const), ang = anglesTriple(R, kind), N = pick(R, NAMES);
  const k = int(R, 0, 2), known = ang.filter((_, i) => i !== k) as [number, number], want = ang[k]!;
  const show = ang.map((x, i) => (i === k ? '?' : `${x}°`));
  return {
    id: `thirdAngle-${n}`, family: 'thirdAngle',
    prompt: pick(R, CTX_ANG)(known[0], known[1]),
    board: `${known[0]}^\\circ + ${known[1]}^\\circ + \\,? = 180^\\circ`, input: 'num', unit: '°',
    picture: { kind: 'tri', t: anglePic(ang, show, N) },
    solution: [`The three angles of every triangle add up to 180°.`, `${known[0]} + ${known[1]} = ${known[0] + known[1]}, and 180 − ${known[0] + known[1]} = ${want}°.`],
    answer: { kind: 'num', v: want },
    check: (r: Response): Verdict => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number of degrees.' };
      if (eq(r.v, want)) return { ok: true, say: `Yes: ${known[0]} + ${known[1]} + ${want} = 180.` };
      if (eq(r.v, 360 - known[0] - known[1])) return { ok: false, say: `A triangle's angles total 180°, not 360°: 180 − ${known[0] + known[1]} = ${want}°.` };
      if (eq(r.v, known[0] + known[1])) return { ok: false, say: `That is the two you know together. The third is what is left of 180°: ${want}°.` };
      return { ok: false, say: `Not quite: 180 − ${known[0]} − ${known[1]} = ${want}°.` };
    },
  };
}, R, () => thirdAngleF(rngFallback(n), n));

const sumCheck: Gen = (R, n) => fitted(R => {
  const N = pick(R, NAMES), kind = pick(R, ['acute', 'right', 'obtuse'] as const), ang = anglesTriple(R, kind);
  if (R() < 0.55) {
    // measured: each reading off by a degree or two, the total misses 180
    let got: number[];
    do { got = ang.map(x => x + pick(R, [-2, -1, 0, 1, 2])); } while (got.reduce((s, x) => s + x, 0) === 180 || Math.abs(got.reduce((s, x) => s + x, 0) - 180) > 4);
    const T = got.reduce((s, x) => s + x, 0), who = pick(R, ['Ben', 'Ana', 'Theo', 'Mia', 'Sam']);
    return choice(R, {
      id: `sumCheck-${n}`, family: 'sumCheck',
      prompt: `${who} measured the angles of a drawn triangle: <b class="b">${got[0]}°</b>, <b class="b">${got[1]}°</b> and <b class="b">${got[2]}°</b>. They add up to ${T}°. What does that show?`,
      board: `${got[0]} + ${got[1]} + ${got[2]} = ${T}`,
      picture: { kind: 'tri', t: anglePic(ang, got.map(x => `${x}°`), N) },
      solution: [`A protractor reading can be off by a degree or two at each corner.`, `${T}° is within a few degrees of 180°: the readings are a little off, the rule is not.`],
    }, [
      { t: `The readings are a little off; the true total is 180°.`, ok: true, say: `Right: ${Math.abs(T - 180)}° over three readings is normal measuring error.` },
      { t: `The 180° rule does not work for every triangle.`, mc: 'mc.angles.measurement-error-disproves-rule', say: `A miss of ${Math.abs(T - 180)}° fits measuring error. Every triangle's angles total exactly 180°.` },
      { t: `This kind of triangle has angles that add up to ${T}°.`, mc: 'mc.angles.angle-sum-depends-on-size-or-shape', say: `The kind of triangle doesn't matter: every triangle totals 180°. The ${Math.abs(T - 180)}° is measuring error.` },
    ]);
  }
  const small = pick(R, [2, 3, 4]), bigU = pick(R, ['ft', 'yd']), big = pick(R, [20, 30, 40, 50]), who = pick(R, ['Ana', 'Ben', 'Theo', 'Mia', 'Sam']);
  const pic: Pic = { kind: 'tri', t: anglePic(ang, ang.map(x => `${x}°`), N) };
  return choice(R, {
    id: `sumCheck-${n}`, family: 'sumCheck',
    prompt: `${who} drew a triangle with sides of about ${small} in, with angles of ${ang[0]}°, ${ang[1]}° and ${ang[2]}°. Then ${who} marked out ${kind === 'right' ? 'a' : 'an'} ${kind} triangle on the field, ${big} ${bigU} on a side. What do its three angles add up to?`,
    board: `${ang[0]} + ${ang[1]} + ${ang[2]} = 180`,
    picture: pic,
    solution: [`Size does not change the angle sum, and neither does the shape.`, `Every triangle, ${small} in or ${big} ${bigU}, has angles that total 180°.`],
  }, [
    { t: '180°, like every triangle', ok: true, say: `Right: big or small, acute, right or obtuse, the angles total 180°.` },
    { t: 'More than 180°, because it is so much bigger', mc: 'mc.angles.angle-sum-depends-on-size-or-shape', say: `Bigger sides don't make bigger angles in total. Every triangle totals 180°.` },
    { t: `It depends on its shape, not only on 180°`, mc: 'mc.angles.angle-sum-depends-on-size-or-shape', say: `The shape changes the single angles, not the total: always 180°.` },
  ]);
}, R, () => sumCheck(rngFallback(n), n));

// =====================================================================================================
// 10 side-angle-order: the longest side is opposite the largest angle
// =====================================================================================================
const SIDE_OF: Record<V, Sd> = { A: 'BC', B: 'AC', C: 'AB' };
const longest: Gen = (R, n) => fitted(R => {
  const N = pick(R, NAMES), mode = pick(R, ['angles2', 'angles3', 'sides', 'iso'] as const), most = R() < 0.6;
  if (mode === 'iso') {
    const eqLen = int(R, 5, 9), baseL = pick(R, [eqLen - 3, eqLen - 2, eqLen + 2, eqLen + 3].filter(x => x > 2 && x < 2 * eqLen));
    // AB is the base; AC = BC: the equal sides face the angles at B and A
    const t = solveSSS(baseL, eqLen, eqLen);
    const pic: Pic = { kind: 'tri', t: { unit: 'cm', A: t.A, B: t.B, C: t.C, names: N, sides: { AB: { text: `${baseL} cm` }, AC: { text: `${eqLen} cm` }, BC: { text: `${eqLen} cm` } }, rot: pick(R, [0, 15, -12]) } };
    return choice(R, {
      id: `longest-${n}`, family: 'longest',
      prompt: `Triangle ${N.join('')} has ${sideH(N, 'AC', eqLen, 'cm')}, ${sideH(N, 'BC', eqLen, 'cm')} and ${sideH(N, 'AB', baseL, 'cm')}. Which two angles are equal?`,
      board: `${nm(N, 'AC')} = ${nm(N, 'BC')} = ${eqLen}\\ \\text{cm}`, picture: pic,
      solution: [`Equal sides face equal angles.`, `${nm(N, 'AC')} faces ∠${nm(N, 'B')}; ${nm(N, 'BC')} faces ∠${nm(N, 'A')}. So ∠${nm(N, 'A')} = ∠${nm(N, 'B')}.`],
    }, [
      { t: `∠${nm(N, 'A')} and ∠${nm(N, 'B')}`, ok: true, say: `Yes: they face the equal sides ${nm(N, 'BC')} and ${nm(N, 'AC')}.` },
      { t: `∠${nm(N, 'A')} and ∠${nm(N, 'C')}`, mc: 'mc.shapes.pairs-side-with-adjacent-angle', say: `Pair each side with the angle ACROSS from it, not the one it touches. ${nm(N, 'AC')} faces ∠${nm(N, 'B')}, ${nm(N, 'BC')} faces ∠${nm(N, 'A')}.` },
      { t: `∠${nm(N, 'B')} and ∠${nm(N, 'C')}`, mc: 'mc.shapes.pairs-side-with-adjacent-angle', say: `Pair each side with the angle ACROSS from it. ${nm(N, 'AC')} faces ∠${nm(N, 'B')}, ${nm(N, 'BC')} faces ∠${nm(N, 'A')}.` },
    ]);
  }
  if (mode === 'sides') {
    let s: [number, number, number];
    do { s = [int(R, 4, 11), int(R, 4, 11), int(R, 4, 11)]; } while (new Set(s).size < 3 || existsSSS(...s) !== 'yes' || Math.min(...s) * 1.0 < 3);
    const [AB, AC, BC] = s, t = solveSSS(AB, AC, BC);
    if (Math.min(t.angA, t.angB, t.angC) < 20) return longest(R, n);
    const target = most ? Math.max(...s) : Math.min(...s), side = (['AB', 'AC', 'BC'] as Sd[])[s.indexOf(target)]!;
    const opp = (['A', 'B', 'C'] as V[]).find(v => SIDE_OF[v] === side)!;
    const pic: Pic = { kind: 'tri', t: { unit: 'cm', A: t.A, B: t.B, C: t.C, names: N, sides: { AB: { text: `${AB} cm` }, AC: { text: `${AC} cm` }, BC: { text: `${BC} cm` } } } };
    return choice(R, {
      id: `longest-${n}`, family: 'longest',
      prompt: `Triangle ${N.join('')} has ${sideH(N, 'AB', AB, 'cm')}, ${sideH(N, 'AC', AC, 'cm')} and ${sideH(N, 'BC', BC, 'cm')}. Which angle is the ${most ? 'largest' : 'smallest'}?`,
      board: [sideT(N, 'AB', AB, 'cm'), sideT(N, 'AC', AC, 'cm'), sideT(N, 'BC', BC, 'cm')].join(NL), picture: pic,
      solution: [`The ${most ? 'longest' : 'shortest'} side is ${nm(N, side)} (${target} cm).`, `The ${most ? 'largest' : 'smallest'} angle is ACROSS from it: ∠${nm(N, opp)}.`],
    }, (['A', 'B', 'C'] as V[]).map(v => v === opp
      ? { t: `∠${nm(N, v)}`, ok: true, say: `Yes: ∠${nm(N, v)} is across from ${nm(N, side)}, the ${most ? 'longest' : 'shortest'} side.` }
      : { t: `∠${nm(N, v)}`, mc: ADJ[v].includes(side as never) ? 'mc.shapes.pairs-side-with-adjacent-angle' : undefined, say: `∠${nm(N, v)} ${ADJ[v].includes(side as never) ? 'touches' : 'is not across from'} ${nm(N, side)}. The ${most ? 'largest' : 'smallest'} angle is ACROSS from the ${most ? 'longest' : 'shortest'} side: ∠${nm(N, opp)}.` }));
  }
  let ang: [number, number, number];
  do { ang = [int(R, 25, 100), int(R, 25, 100), 0]; ang[2] = 180 - ang[0] - ang[1]; } while (ang[2] < 22 || Math.min(Math.abs(ang[0] - ang[1]), Math.abs(ang[1] - ang[2]), Math.abs(ang[0] - ang[2])) < 8);
  const target = most ? Math.max(...ang) : Math.min(...ang), v = (['A', 'B', 'C'] as V[])[ang.indexOf(target)]!, side = OPP[v];
  const shown = mode === 'angles3' ? [0, 1, 2] : shuffle(R, [0, 1, 2]).slice(0, 2);
  const t = solveASA(4, ang[0], ang[1]);
  const an: TriPic['angles'] = {};
  shown.forEach(i => { an[(['A', 'B', 'C'] as V[])[i]!] = { text: `${ang[i]}°` }; });
  const given = shown.map(i => angH(N, (['A', 'B', 'C'] as V[])[i]!, ang[i]!));
  const missing = [0, 1, 2].find(i => !shown.includes(i));
  return choice(R, {
    id: `longest-${n}`, family: 'longest',
    prompt: `In triangle ${N.join('')}, ${list(given)}. Which side is the ${most ? 'longest' : 'shortest'}?`,
    board: shown.map(i => angT(N, (['A', 'B', 'C'] as V[])[i]!, ang[i]!)).join(NL),
    picture: { kind: 'tri', t: { unit: 'in', A: t.A, B: t.B, C: t.C, names: N, angles: an } },
    solution: [...(missing !== undefined ? [`First the third angle: ∠${nm(N, (['A', 'B', 'C'] as V[])[missing]!)} = 180 − ${shown.map(i => ang[i]).join(' − ')} = ${ang[missing]}°.`] : []), `The ${most ? 'largest' : 'smallest'} angle is ∠${nm(N, v)} = ${target}°.`, `The ${most ? 'longest' : 'shortest'} side is ACROSS from it: ${nm(N, side)}.`],
  }, (['AB', 'AC', 'BC'] as Sd[]).map(s => s === side
    ? { t: nm(N, s), ok: true, say: `Yes: ${nm(N, s)} is across from ∠${nm(N, v)} = ${target}°, the ${most ? 'largest' : 'smallest'} angle.` }
    : { t: nm(N, s), mc: ADJ[v].includes(s) ? 'mc.shapes.pairs-side-with-adjacent-angle' : undefined, say: `${nm(N, s)} ${ADJ[v].includes(s) ? `touches ∠${nm(N, v)}` : `is not across from ∠${nm(N, v)}`}. The ${most ? 'longest' : 'shortest'} side is ACROSS from the ${most ? 'largest' : 'smallest'} angle (${target}°): ${nm(N, side)}.` }));
}, R, () => longest(rngFallback(n), n));

const ratio: Gen = (R, n) => fitted(R => {
  const N = pick(R, NAMES), a = 5 * int(R, 4, 9), k = R() < 0.75 ? 2 : 3, t = k * a, c = 180 - a - t;
  if (c < 15 || c === a || c === t) return ratio(R, n);
  const s = int(R, 2, 5), u = pick(R, ['in', 'cm'] as const), unit = u === 'in' ? 'in' : 'cm', sCm = u === 'cm' ? s * 2 : s;
  const real = sideOpposite(t, a, sCm);
  // A gets the small angle a, B the angle t, C the rest: BC faces A, AC faces B
  const tri = solveASA(sideOpposite(c, a, sCm), a, t);
  const pic: Pic = { kind: 'tri', t: { unit: u, A: tri.A, B: tri.B, C: tri.C, names: N, angles: { A: { text: `${a}°` }, B: { text: `${t}°` }, C: { text: `${c}°` } }, sides: { BC: { text: `${sCm} ${unit}` }, AC: { text: '?' } } } };
  const who = pick(R, ['Jordan', 'Riley', 'Casey', 'Avery', 'Quinn']);
  return choice(R, {
    id: `ratio-${n}`, family: 'ratio',
    prompt: `Triangle ${N.join('')} has angles of ${a}°, ${t}° and ${c}°. The side across from the ${a}° angle is <b class="a">${sCm} ${unit}</b>. ${who} says: “The ${t}° angle is ${k === 2 ? 'twice' : 'three times'} as big, so the side across from it is ${k * sCm} ${unit}.” Is ${who} right?`,
    board: [`${a}^\\circ \\to ${sCm}\\ \\text{${unit}}`, `${t}^\\circ \\to \\,?`].join(NL), picture: pic,
    solution: [`A bigger angle does face a longer side, so the side is longer than ${sCm} ${unit}.`, `But the side does not grow in step with the angle: measured on an accurate drawing it is about ${real.toFixed(1)} ${unit}, not ${k * sCm}.`],
  }, [
    { t: `No: it is longer than ${sCm} ${unit}, but not ${k === 2 ? 'twice' : 'three times'} as long.`, ok: true, say: `Right: the order follows the angles, the sizes don't. It measures about ${real.toFixed(1)} ${unit}.` },
    { t: `Yes: sides grow in step with the angles across from them.`, mc: 'mc.angles.triangle-side-ratios-equal-angle-ratios', say: `The ORDER follows the angles, not the ratio. Measure an accurate drawing: about ${real.toFixed(1)} ${unit}, not ${k * sCm}.` },
    { t: `No: the side next to the ${t}° angle is the one that is ${k * sCm} ${unit}.`, mc: 'mc.shapes.pairs-side-with-adjacent-angle', say: `Sides pair with the angle ACROSS from them, and no side here is ${k} times as long.` },
  ]);
}, R, () => ratio(rngFallback(n), n));

/** an SSS construction drawn on the LONGEST side, with the item's own letters on the right corners */
function sssOnLongest(sd: Record<Sd, number>, N: [string, string, string], u: Unit): ConstructSpec {
  const base = (['AB', 'AC', 'BC'] as Sd[]).reduce((m, x) => (sd[x] > sd[m] ? x : m), 'AB' as Sd);
  const p = base[0] as V, q = base[1] as V, r = (['A', 'B', 'C'] as V[]).find(v => v !== p && v !== q)!;
  const side = (x: V, y: V) => sd[[x, y].sort().join('') as Sd];
  return { kind: 'sss', unit: u, AB: sd[base], AC: side(p, r), BC: side(q, r), names: [N[IDX[p]]!, N[IDX[q]]!, N[IDX[r]]!] };
}

// =====================================================================================================
// 11 triangle-uniqueness: none, exactly one, or many
// =====================================================================================================
const howMany: Gen = (R, n) => fitted(R => {
  const u = pick(R, ['in', 'cm'] as const), N = pick(R, NAMES);
  const kind = pick(R, ['SSS', 'SSSno', 'SAS', 'ASA', 'ASAno', 'AAA', 'AAAno'] as const);
  let spec: Spec, givens: string[], tex: string[], solvePic: Pic | undefined, why: string;
  if (kind === 'SSS' || kind === 'SSSno') {
    let s: [number, number, number];
    do { s = [int(R, 2, u === 'in' ? 8 : 12), int(R, 2, u === 'in' ? 8 : 12), int(R, 2, u === 'in' ? 8 : 12)]; } while ((existsSSS(...s) === 'yes') !== (kind === 'SSS'));
    spec = { kind: 'SSS', AB: s[0], AC: s[1], BC: s[2] };
    givens = [sideH(N, 'AB', s[0], u), sideH(N, 'AC', s[1], u), sideH(N, 'BC', s[2], u)];
    tex = [sideT(N, 'AB', s[0], u), sideT(N, 'AC', s[1], u), sideT(N, 'BC', s[2], u)];
    const srt = [...s].sort((x, y) => x - y);
    why = kind === 'SSS' ? `Three sides that pass the test (${srt[0]} + ${srt[1]} > ${srt[2]}) fix exactly one triangle.` : `${srt[0]} + ${srt[1]} = ${srt[0]! + srt[1]!} is not more than ${srt[2]}: the arcs never cross above the base.`;
    solvePic = { kind: 'construct', c: sssOnLongest({ AB: s[0], AC: s[1], BC: s[2] }, N, u), upto: 'base' };
  } else if (kind === 'SAS') {
    const AB = int(R, u === 'in' ? 3 : 5, u === 'in' ? 6 : 10), AC = int(R, u === 'in' ? 2 : 4, u === 'in' ? 5 : 9), a = 5 * int(R, 7, 24);
    spec = { kind: 'SAS', AB, AC, angA: a };
    givens = [sideH(N, 'AB', AB, u), angH(N, 'A', a), sideH(N, 'AC', AC, u)];
    tex = [sideT(N, 'AB', AB, u), angT(N, 'A', a), sideT(N, 'AC', AC, u)];
    why = `Two sides and the angle between them fix exactly one triangle.`;
    solvePic = { kind: 'construct', c: { kind: 'sas', unit: u, AB, AC, angA: a, names: N }, upto: 'base' };
  } else if (kind === 'ASA' || kind === 'ASAno') {
    const AB = int(R, u === 'in' ? 3 : 5, u === 'in' ? 6 : 10);
    let a: number, b: number;
    do { a = 5 * int(R, 6, 26); b = 5 * int(R, 6, 26); } while ((a + b < 180) !== (kind === 'ASA') || (kind === 'ASA' && a + b > 150));
    spec = { kind: 'ASA', AB, angA: a, angB: b };
    givens = [sideH(N, 'AB', AB, u), angH(N, 'A', a), angH(N, 'B', b)];
    tex = [sideT(N, 'AB', AB, u), angT(N, 'A', a), angT(N, 'B', b)];
    why = kind === 'ASA' ? `A side and the angles at its two ends fix exactly one triangle: the rays meet in one point.` : `${a}° + ${b}° = ${a + b}°: that is 180° or more, so the rays never meet above the base.`;
    solvePic = kind === 'ASA' ? { kind: 'construct', c: { kind: 'asa', unit: u, AB, angA: a, angB: b, names: N }, upto: 'base' }
      : { kind: 'tri', t: { unit: u, A: [0, 0], B: [AB, 0], C: [AB / 2, 1], names: N, closed: false, rays: [{ from: 'A', deg: a, len: AB * 0.8, mark: { ref: [1, 0], text: `${a}°` } }, { from: 'B', deg: 180 - b, len: AB * 0.8, mark: { ref: [AB - 1, 0], text: `${b}°` } }] } };
  } else {
    let a: number, b: number, c: number;
    do { a = 5 * int(R, 6, 18); b = 5 * int(R, 6, 18); c = kind === 'AAA' ? 180 - a - b : 5 * int(R, 6, 20); } while (c < 25 || (kind === 'AAAno' && a + b + c === 180));
    spec = { kind: 'AAA', angA: a, angB: b, angC: c };
    givens = [angH(N, 'A', a), angH(N, 'B', b), angH(N, 'C', c)];
    tex = [angT(N, 'A', a), angT(N, 'B', b), angT(N, 'C', c)];
    why = kind === 'AAA' ? `Three angles fix the shape, not the size: every size works.` : `${a} + ${b} + ${c} = ${a + b + c}, not 180: no triangle has these angles.`;
    if (kind === 'AAA') {
      const t1 = solveASA(2.5, a, b), t2 = solveASA(4.5, a, b);
      const mk = (t: typeof t1, L: string): TriPic => ({ unit: 'in', A: t.A, B: t.B, C: t.C, names: N, angles: { A: { text: `${a}°` }, B: { text: `${b}°` }, C: { text: `${c}°` } }, sides: { AB: { text: L } }, scale: 105 } as TriPic);
      solvePic = { kind: 'tris', ts: [mk(t1, '2½ in'), mk(t2, '4½ in')] };
    } else solvePic = undefined;
  }
  const count = countTriangles(spec);
  const mcFor = (pickc: 'none' | 'one' | 'many'): string | undefined => {
    if (count === 'none') return 'mc.shapes.any-measurements-make-a-triangle';
    if (count === 'many' && pickc === 'one') return 'mc.transformations.equal-angles-prove-congruence';
    if (count === 'one' && pickc === 'many') return 'mc.transformations.turned-or-flipped-copy-not-congruent';
    return undefined;
  };
  const sayFor = (pickc: 'none' | 'one' | 'many') => (pickc === count ? `Right. ${why}` : count === 'one' && pickc === 'many' ? `Copies that are turned or flipped are the SAME triangle. ${why}` : `${why}`);
  return choice(R, {
    id: `howMany-${n}`, family: 'howMany',
    prompt: `How many different triangles have ${list(givens)}?`,
    board: tex.join(NL), solvePic,
    solution: [why, count === 'one' ? 'Any two you draw fit on top of each other (maybe after a flip).' : count === 'many' ? 'Same shape, any size: they are not copies of each other.' : 'Nothing can be drawn.'],
  }, [
    { t: 'No triangle', ok: count === 'none', mc: count === 'none' ? undefined : mcFor('none'), say: sayFor('none') },
    { t: 'Exactly one triangle', ok: count === 'one', mc: count === 'one' ? undefined : mcFor('one'), say: sayFor('one') },
    { t: 'Many different triangles', ok: count === 'many', mc: count === 'many' ? undefined : mcFor('many'), say: sayFor('many') },
  ], true);
}, R, () => howMany(rngFallback(n), n));

const flipped: Gen = (R, n) => fitted(R => {
  const N = pick(R, NAMES), u = pick(R, ['in', 'cm'] as const), same = R() < 0.6;
  if (same) {
    const kind = pick(R, ['SSS', 'SAS', 'ASA'] as const), q = request(R, kind, u), M = q.names;
    const t1 = reqSketch(q, q.sides, q.angles, { freehand: false });
    const t2: TriPic = { ...t1, mirror: R() < 0.7, rot: pick(R, [0, 25, -30, 160, 180, 200]) };
    return choice(R, {
      id: `flipped-${n}`, family: 'flipped',
      prompt: `Two classmates both drew triangle ${M.join('')} with ${reqHtml(q)}. Their drawings face different ways. Are they the same triangle?`,
      board: reqTex(q), picture: { kind: 'tris', ts: [t1, t2] },
      solution: [`Trace drawing 1 and turn ${t2.mirror ? 'or flip ' : ''}the tracing: it fits drawing 2 exactly.`, `${kind === 'SSS' ? 'Three sides' : kind === 'SAS' ? 'Two sides and the angle between them' : 'A side and its two end angles'} fix one triangle; a turned or flipped copy is the same one.`],
    }, [
      { t: `Yes: a traced copy fits exactly after a turn${t2.mirror ? ' or a flip' : ''}.`, ok: true, say: `Right: same sides, same angles, just placed differently on the page.` },
      { t: 'No: they face different ways.', mc: 'mc.transformations.turned-or-flipped-copy-not-congruent', say: `Facing another way doesn't make a new triangle: turn or flip a tracing and it fits.` },
      { t: 'No: one of them must be drawn wrong.', mc: 'mc.transformations.turned-or-flipped-copy-not-congruent', say: `Both meet every condition. A turned or flipped copy is the same triangle.` },
    ]);
  }
  let a: number, b: number;
  do { a = 5 * int(R, 8, 16); b = 5 * int(R, 8, 16); } while (a + b > 135 || a === b);
  const c = 180 - a - b, L1 = u === 'in' ? 2 : 5, L2 = u === 'in' ? pick(R, [3, 3.5, 4]) : pick(R, [7, 8, 9]);
  const t1 = solveASA(L1, a, b), t2 = solveASA(L2, a, b), sc = u === 'in' ? 95 : 38;
  const mk = (t: typeof t1, L: number): TriPic => ({ unit: u, A: t.A, B: t.B, C: t.C, names: N, angles: { A: { text: `${a}°` }, B: { text: `${b}°` }, C: { text: `${c}°` } }, sides: { AB: { text: `${len(L, u)} ${u}` } }, scale: sc } as TriPic);
  return choice(R, {
    id: `flipped-${n}`, family: 'flipped',
    prompt: `Both triangles have angles of ${a}°, ${b}° and ${c}°. Are they the same triangle?`,
    board: [angT(N, 'A', a), angT(N, 'B', b), angT(N, 'C', c)].join(NL), picture: { kind: 'tris', ts: [mk(t1, L1), mk(t2, L2)] },
    solution: [`Same angles give the same SHAPE.`, `But ${N[0]}${N[1]} is ${len(L1, u)} ${u} in one and ${len(L2, u)} ${u} in the other: different sizes, not copies.`],
  }, [
    { t: 'No: same angles, but the sides are different lengths.', ok: true, say: `Right: same shape, different size. Angles alone don't fix a triangle.` },
    { t: 'Yes: all their angles match.', mc: 'mc.transformations.equal-angles-prove-congruence', say: `Matching angles give the same shape, not the same size: ${len(L1, u)} ${u} is not ${len(L2, u)} ${u}.` },
    { t: 'Yes: one is just a turned copy of the other.', mc: 'mc.transformations.equal-angles-prove-congruence', say: `A turned copy would have the same side lengths. These don't: ${len(L1, u)} ${u} and ${len(L2, u)} ${u}.` },
  ]);
}, R, () => flipped(rngFallback(n), n));

// a deterministic stream for fallbacks (a generator that kept failing to fit tries a fixed, known-good seed)
function rngFallback(n: number): () => number { let s = (n * 2654435761) >>> 0 || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- registry ----------
export const GENS: Record<string, Gen> = {
  sketch, included, invent, segLen, endMark, sasWhere, protractor, asaRays, asaWhere, compassCopy, compassOpen, sssNext, sssPoint,
  audit, exists, thirdSide, thirdAngle: thirdAngleF, sumCheck, longest, ratio, howMany, flipped,
};
export const FAMILY_NAMES: Record<string, string> = {
  sketch: 'Pick the sketch', included: 'Between the sides?', invent: 'Given or just looks?', segLen: 'Read a drawn length', endMark: 'Where does it end?',
  sasWhere: 'Where does the angle go?', protractor: 'Which protractor scale?', asaRays: 'Both rays right?', asaWhere: 'Where the rays meet',
  compassCopy: 'Carry a length', compassOpen: 'The compass opening', sssNext: 'Which arcs?', sssPoint: 'Where the arcs cross', audit: 'Does it pass?',
  exists: 'Do the sticks close?', thirdSide: 'The third side', thirdAngle: 'The third angle', sumCheck: 'Always 180°?', longest: 'Across from the biggest',
  ratio: 'Twice the angle?', howMany: 'None, one or many?', flipped: 'Same triangle?',
};
