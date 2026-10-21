// items.ts: exercise families for "Understand scale: drawings and actual lengths" (grade 7, 7.G.A.1). One or two
// families per sub-goal of the topic JSON (plan.ts), with that sub-goal's number ranges (topic JSON `cases`), checked
// exactly, and every classic wrong answer tagged with its misconception id (math-curriculum-essentials/misconceptions.json).
// Pure: no DOM, no canvas. A seeded rng makes sessions repeatable. Pictures are ScalePair params (ScalePair.ts).
import { type Item, type Response, type Verdict, fracValue, int, pick, shuffle } from '../../runtime/item';
import type { PairParams, PairStep } from './ScalePair';
import { factor, fmt, legendRatio, sameUnit, tfmt } from './scaleBasicsMaths';

export type FamilyId = 'match' | 'pairUp' | 'timesAs' | 'timesSay' | 'toScale' | 'scaleCheck' | 'sameUnit' | 'convertFirst'
  | 'readScale' | 'whichPart' | 'writeScale' | 'legendMeaning' | 'legendWrite' | 'legendToRatio' | 'ratioToLegend'
  | 'whatIsN' | 'useFactor' | 'unitSwap' | 'direction' | 'enlarge' | 'compareScales' | 'rateFactor' | 'rateOrFactor' | 'critique';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'match', name: 'Which lengths go together?' },
  { id: 'pairUp', name: 'Pair up the lengths' },
  { id: 'timesAs', name: 'How many times as long?' },
  { id: 'timesSay', name: 'Say it with “times as long”' },
  { id: 'toScale', name: 'Which drawing is to scale?' },
  { id: 'scaleCheck', name: 'Check both directions' },
  { id: 'sameUnit', name: 'One unit first' },
  { id: 'convertFirst', name: 'Ready to compare?' },
  { id: 'readScale', name: 'Read a scale' },
  { id: 'whichPart', name: 'Drawing first, actual second' },
  { id: 'writeScale', name: 'Write the scale' },
  { id: 'legendMeaning', name: 'What the legend says' },
  { id: 'legendWrite', name: 'Write the legend' },
  { id: 'legendToRatio', name: 'Legend to ratio' },
  { id: 'ratioToLegend', name: 'Ratio to legend' },
  { id: 'whatIsN', name: 'A factor, not a length' },
  { id: 'useFactor', name: 'One scale, two walls' },
  { id: 'unitSwap', name: 'Another unit, same scale?' },
  { id: 'direction', name: 'Which way is the factor?' },
  { id: 'enlarge', name: 'Bigger than life' },
  { id: 'compareScales', name: 'Which drawing is bigger?' },
  { id: 'rateFactor', name: 'Rate or factor?' },
  { id: 'rateOrFactor', name: 'What the number means' },
  { id: 'critique', name: 'Fix the claim' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

export const MC = {
  noncorr: 'mc.ratio-rate.forms-ratios-from-noncorresponding-lengths',
  diff: 'mc.mul-div.factor-reported-as-difference',
  additive: 'mc.ratio-rate.additive-keep-difference',
  fewChecks: 'mc.ratio-rate.too-few-checks-for-proportionality',
  unlike: 'mc.reasoning-language.compares-unlike-units-or-things',
  mixedUnits: 'mc.ratio-rate.assigns-mixed-units-to-unitless-scale',
  reverse: 'mc.ratio-rate.reverses-scale-ratio-order',
  cmOnly: 'mc.ratio-rate.same-unit-scale-depends-on-unit',
  oneTerm: 'mc.ratio-rate.scale-only-one-term',
  equality: 'mc.ratio-rate.scale-statement-as-equality',
  notConverted: 'mc.ratio-rate.mixed-unit-scale-not-converted',
  nAsLength: 'mc.ratio-rate.scale-denominator-as-length',
  unitChange: 'mc.ratio-rate.same-unit-scale-changes-with-unit',
  bigOverSmall: 'mc.ratio-rate.scale-factor-larger-over-smaller',
  alwaysReduce: 'mc.ratio-rate.scale-drawings-always-reduce',
  bigN: 'mc.ratio-rate.large-scale-means-large-number',
  segments: 'mc.ratio-rate.different-segments-different-scale',
  drawAsActual: 'mc.ratio-rate.drawing-length-used-as-actual',
} as const;

/** what the page draws: a ScalePair; `solve` = the steps that only play in the worked solution after a miss */
export type Pic = { pair: PairParams; solve?: PairStep[]; focus?: 'len' | 'wid' };
export interface SBItem extends Item {
  family: FamilyId;
  picture?: Pic;
  /** TeX written on the board after a miss (", " splits it into lines) */
  work?: string;
}
type Gen = (R: () => number, n: number, sg?: string) => SBItem;

// ---------- helpers ----------
const A = (s: string | number) => `<b class="a">${s}</b>`;      // drawing lengths (amber)
const B = (s: string | number) => `<b class="b">${s}</b>`;      // actual lengths (teal)
const S = (s: string | number) => `<b class="s">${s}</b>`;      // the answer (lime)
const T = (u: string) => `\\text{ ${u}}`;
const dT = (v: number, u: string) => `\\cssId{d}{${tfmt(v)}${T(u)}}`;     // a drawing length on the board
const aT = (v: number, u: string) => `\\cssId{a}{${tfmt(v)}${T(u)}}`;     // an actual length on the board
const L = (v: number, u: string) => `${fmt(v)} ${u}`;
const an = (w: string) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const NAMES = ['Sam', 'Ana', 'Jo', 'Kai', 'Lena', 'Omar', 'Priya', 'Leo', 'Maya', 'Theo'] as const;
/** an everyday object with the range of its long side (in its unit) and of its long : short aspect, so a drawing of
 * "a 9 in tabletop" or "a longboard 35 cm by 20 cm" is never made */
type Obj = { name: string; shape: 'board' | 'rect'; lo: number; hi: number; aLo: number; aHi: number };
const o_ = (name: string, lo: number, hi: number, aLo: number, aHi: number, shape: 'board' | 'rect' = 'rect'): Obj => ({ name, shape, lo, hi, aLo, aHi });
const IN_OBJ: readonly Obj[] = [o_('rug', 36, 120, 1, 2.5), o_('tabletop', 24, 96, 1, 3), o_('window', 18, 72, 1, 3), o_('poster', 12, 40, 1, 2),
  o_('desk', 30, 72, 1.2, 3), o_('bulletin board', 18, 60, 1, 3), o_('skateboard', 28, 36, 3, 5, 'board'), o_('garden bed', 36, 120, 1.5, 6),
  o_('door mat', 18, 36, 1.2, 2.5), o_('photo print', 4, 14, 1, 2), o_('floor tile', 4, 24, 1, 2.5), o_('shelf board', 18, 72, 4, 12),
  o_('bench seat', 36, 96, 3, 9), o_('sticker', 2, 6, 1, 3)];
const CM_OBJ: readonly Obj[] = [o_('laptop', 28, 40, 1.2, 1.8), o_('tablet', 18, 30, 1.2, 1.8), o_('tray', 25, 60, 1.2, 2), o_('game board', 30, 60, 1, 1.3),
  o_('picture frame', 10, 60, 1, 2), o_('cutting board', 25, 50, 1.2, 2.5), o_('notebook', 15, 30, 1.2, 1.6), o_('longboard', 70, 110, 3, 5, 'board'),
  o_('phone', 12, 17, 1.8, 2.5), o_('sticker', 3, 12, 1, 3), o_('shelf board', 30, 120, 4, 12), o_('bookmark', 12, 20, 3, 6), o_('banner', 60, 300, 2, 6), o_('tile', 10, 60, 1, 2.5)];
/** an object that fits an actual long x short size, or null (the caller draws other numbers) */
function objFor(R: () => number, metric: boolean, long: number, short: number): Obj | null {
  const asp = long / short;
  const fit = (metric ? CM_OBJ : IN_OBJ).filter(o => long >= o.lo && long <= o.hi && asp >= o.aLo - 1e-9 && asp <= o.aHi + 1e-9);
  return fit.length ? pick(R, fit) : null;
}
/** a drawing / model and the actual thing, with the actual length range in cm (sizes stay believable) */
type Ctx = { draw: string; real: string; cm: [number, number] };
const CTX: readonly Ctx[] = [
  { draw: 'drawing of a leaf', real: 'leaf', cm: [4, 20] }, { draw: 'drawing of a phone', real: 'phone', cm: [12, 17] },
  { draw: 'drawing of a shoe', real: 'shoe', cm: [20, 35] }, { draw: 'drawing of a book', real: 'book', cm: [15, 30] },
  { draw: 'drawing of a lamp', real: 'lamp', cm: [30, 90] }, { draw: 'drawing of a chair', real: 'chair', cm: [40, 110] },
  { draw: 'drawing of a guitar', real: 'guitar', cm: [80, 110] }, { draw: 'drawing of a bike', real: 'bike', cm: [150, 190] },
  { draw: 'toy car', real: 'car', cm: [300, 600] }, { draw: 'model house', real: 'house', cm: [600, 2000] },
  { draw: 'model boat', real: 'boat', cm: [200, 3000] }, { draw: 'model train car', real: 'train car', cm: [1200, 2600] },
  { draw: 'wall on a floor plan', real: 'wall', cm: [200, 1500] }, { draw: 'model bridge', real: 'bridge', cm: [2000, 90000] },
  { draw: 'model plane', real: 'plane', cm: [1000, 7000] }, { draw: 'model ship', real: 'ship', cm: [3000, 30000] },
];
/** a context whose actual thing can be this long (cm), or null */
function ctxSize(R: () => number, cm: number): Ctx | null {
  const fit = CTX.filter(c => cm >= c.cm[0] && cm <= c.cm[1]);
  return fit.length ? pick(R, fit) : null;
}
/** a context that is believable at the scale 1 : N (small things at 1 : 2, a chair at 1 : 10, a house at 1 : 100) */
function ctxTier(R: () => number, N: number): Ctx {
  const fit = CTX.filter(c => (N <= 5 ? c.cm[1] <= 40 : N <= 20 ? c.cm[0] >= 30 && c.cm[1] <= 200 : c.cm[0] >= 200));
  return pick(R, fit);
}
const cmOf = (x: number, u: string) => x * ({ cm: 1, m: 100, in: 2.54, ft: 30.48, yd: 91.44 } as Record<string, number>)[u]!;
const PLACES = ['house', 'apartment', 'school', 'library', 'cabin', 'community center', 'garage', 'studio'] as const;
const ROOMS = ['kitchen', 'bedroom', 'hallway', 'living room', 'bathroom', 'garage', 'classroom', 'porch'] as const;

/** a quick estimate of ScalePair's copies-mode px scale, with margin: the picture is only attached when it will read */
function fitsCopies(dL: number, dW: number, rL: number, rW: number, tape = rL): boolean {
  const u = Math.min(760 / Math.max(rL, tape), 560 / (dW + rW), 40);
  return dL * u >= 52 && dW * u >= 15 && rW * u >= 44;
}
function valueOf(r: Response): number | null {
  if (r.kind === 'num') return Number.isFinite(r.v) ? r.v : null;
  if (r.kind === 'frac') { const f = fracValue(r); return f ? f[0] / f[1] : null; }
  return null;
}
interface Wrong { v: number; mc?: string; say: string }
/** right, or a recognised wrong value (its misconception), or a plain miss */
function valCheck(ans: number, okSay: string, wrongs: Wrong[], miss: string): (r: Response) => Verdict {
  return r => {
    const v = valueOf(r);
    if (v === null) return { ok: false, say: 'Type a number.' };
    if (near(v, ans)) return { ok: true, say: okSay };
    for (const w of wrongs) if (!near(w.v, ans) && near(v, w.v)) return { ok: false, mc: w.mc, say: w.say };
    return { ok: false, say: miss };
  };
}
interface Opt { t: string; ok: boolean; mc?: string; say: string }
function choiceItem(R: () => number, base: Omit<SBItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[]): SBItem {
  const O = shuffle(R, [...opts]);
  const ts = new Set(O.map(o => o.t));
  if (ts.size !== O.length) throw new Error(`choices not unique: ${O.map(o => o.t).join(' | ')}`);
  if (O.filter(o => o.ok).length !== 1) throw new Error('exactly one choice must be right');
  return {
    ...base, input: 'choice', choices: O.map(o => o.t), answer: { kind: 'choice', i: O.findIndex(o => o.ok) },
    check: (r: Response): Verdict => {
      const o = r.kind === 'choice' ? O[r.i] : undefined;
      if (!o) return { ok: false, say: 'Pick one.' };
      return { ok: o.ok, mc: o.mc, say: o.say };
    },
  };
}
/** a rejected draw (duplicate choices, a quotient outside the fact range): draw again, deterministically */
function retry<T>(make: () => T | null): T {
  for (let i = 0; i < 200; i++) { const v = make(); if (v) return v; }
  throw new Error('no valid item in 200 tries');
}

// ===== 1 corresponding-lengths =====
/** which actual length goes with this drawing side? (actual lengths listed in a shuffled order; the picture shows
 * the actual object without its labels) */
const match: Gen = (R, n) => retry(() => {
  const metric = R() < 0.5, u = metric ? 'cm' : 'in';
  const d1 = int(R, 3, 8), d2 = int(R, 1, d1 - 1), k = int(R, 2, 9);
  const D1 = d1 * k, D2 = d2 * k, o = objFor(R, metric, D1, D2);
  if (D1 > 72 || !o) return null;
  const askLen = R() < 0.5;
  const dv = askLen ? d1 : d2, right = askLen ? D1 : D2, other = askLen ? D2 : D1;
  if (new Set([dv, right, other]).size < 3) return null;
  const listed = R() < 0.5 ? [D1, D2] : [D2, D1];
  const side = askLen ? 'length' : 'width';
  return choiceItem(R, {
    id: `match-${n}`, family: 'match',
    prompt: `A drawing of ${an(o.name)} is ${A(L(d1, u))} by ${A(L(d2, u))}. The actual ${o.name} has sides of ${B(L(listed[0]!, u))} and ${B(L(listed[1]!, u))}. Which actual length goes with the drawing's ${A(L(dv, u))} side?`,
    board: `${dT(dv, u)} \\leftrightarrow \\ ?`,
    picture: fitsCopies(d1, d2, D1, D2) ? { pair: { unit: u, draw: [d1, d2], real: [D1, D2], shape: o.shape, copies: [0, 0] }, solve: ['labA', 'labAw'], focus: askLen ? 'len' : 'wid' } : undefined,
    solution: [`The ${A(L(dv, u))} side is the drawing's ${side}.`, `It goes with the actual ${side}: the ${askLen ? 'longer' : 'shorter'} actual side, ${S(L(right, u))}.`],
  }, [
    { t: L(right, u), ok: true, say: `Yes: ${side} goes with ${side}. ${L(dv, u)} on the drawing matches ${L(right, u)}.` },
    { t: L(other, u), ok: false, mc: MC.noncorr, say: `${L(other, u)} is the actual ${askLen ? 'width' : 'length'}. Match ${side} with ${side}.` },
    { t: L(dv, u), ok: false, mc: MC.drawAsActual, say: `${L(dv, u)} is the drawing's own side. Which ACTUAL side matches it?` },
  ]);
});
/** which pair compares corresponding lengths? */
const pairUp: Gen = (R, n) => retry(() => {
  const metric = R() < 0.5, u = metric ? 'cm' : 'in';
  const a = int(R, 3, 9), b = int(R, 2, a - 1), k = int(R, 2, 8);
  const P = a * k, Q = b * k, o = objFor(R, metric, P, Q);
  if (Q === a || !o) return null;
  const flip = R() < 0.5;
  return choiceItem(R, {
    id: `pairUp-${n}`, family: 'pairUp',
    prompt: `A drawing of ${an(o.name)} is ${A(L(a, u))} long and ${A(L(b, u))} wide. The actual ${o.name} is ${flip ? `${B(L(Q, u))} wide and ${B(L(P, u))} long` : `${B(L(P, u))} long and ${B(L(Q, u))} wide`}. Which pair compares corresponding lengths?`,
    board: `${dT(a, u)},\\ ${dT(b, u)} \\quad ${aT(flip ? Q : P, u)},\\ ${aT(flip ? P : Q, u)}`,
    solution: [`Corresponding means the same part: length with length, width with width.`, `The lengths: ${A(L(a, u))} and ${B(L(P, u))}. The widths: ${A(L(b, u))} and ${B(L(Q, u))}.`],
  }, [
    { t: `${L(b, u)} and ${L(Q, u)}`, ok: true, say: `Yes: the two widths, ${L(b, u)} on the drawing and ${L(Q, u)} in reality.` },
    { t: `${L(a, u)} and ${L(Q, u)}`, ok: false, mc: MC.noncorr, say: `${L(a, u)} is the drawing's length, ${L(Q, u)} the actual width: not the same part.` },
    { t: `${L(b, u)} and ${L(P, u)}`, ok: false, mc: MC.noncorr, say: `${L(b, u)} is a width, ${L(P, u)} a length. Pair width with width.` },
  ]);
});

// ===== 2 times-as-long-same-unit =====
/** the numbers of one comparison: basic facts (2-10) or powers of ten */
function timesNumbers(R: () => number): { d: number; k: number; D: number; u: string; obj: string; real: string; shape: 'board' | 'rect'; big: boolean } {
  if (R() < 0.55) {
    for (;;) {
      const metric = R() < 0.5, d = int(R, 2, 9), k = int(R, 2, 10), w = d >= 5 ? 2 : 1;
      if (d * k > 90 || (d === 2 && k === 2)) continue;
      const o = objFor(R, metric, d * k, w * k);
      if (o) return { d, k, D: d * k, u: metric ? 'cm' : 'in', obj: `drawing of ${an(o.name)}`, real: o.name, shape: o.shape, big: false };
    }
  }
  for (;;) {
    const k = pick(R, [10, 100, 100, 1000] as const), d = int(R, 2, 9), c = ctxSize(R, d * k);
    if (c) return { d, k, D: d * k, u: 'cm', obj: c.draw, real: c.real, shape: 'rect', big: true };
  }
}
function timesPic(t: ReturnType<typeof timesNumbers>): Pic | undefined {
  const w = t.d >= 5 ? 2 : 1;
  if (t.k <= 12 && fitsCopies(t.d, w, t.D, w * t.k)) return { pair: { unit: t.u, draw: [t.d, w], real: [t.D, w * t.k], shape: t.shape, copies: [t.k, 0], labD: [`${t.d}${T(t.u)}`, null], labA: [`${tfmt(t.D)}${T(t.u)}`, null] }, solve: ['copyL'] };
  if ((t.k <= 100 && t.d <= 7) || (t.k === 1000 && t.d <= 4)) return { pair: { unit: t.u, draw: [t.d, w], real: [t.D, w * t.k], mode: 'units', shape: t.shape, labD: [`${t.d}${T(t.u)}`, null], labA: [`${tfmt(t.D)}${T(t.u)}`, null] }, solve: ['units'] };
  return undefined;
}
const timesAs: Gen = (R, n) => {
  const t = timesNumbers(R), { d, k, D, u } = t;
  const the = t.big ? `The ${t.obj}` : `A ${t.obj}`;
  return {
    id: `timesAs-${n}`, family: 'timesAs',
    prompt: `${the} is ${A(L(d, u))} long. The actual ${t.real} is ${B(L(D, u))} long. The actual length is how many times as long as the drawing's?`,
    board: `${aT(D, u)} = \\ ? \\times ${dT(d, u)}`,
    input: 'num', unit: 'times as long', answer: { kind: 'num', v: k },
    picture: timesPic(t),
    work: `${tfmt(D)} \\div ${d} = \\cssId{s}{${tfmt(k)}}`,
    solution: [`How many copies of ${A(L(d, u))} make ${B(L(D, u))}?`, `${fmt(D)} ÷ ${d} = ${S(fmt(k))}: the actual length is ${fmt(k)} times as long.`],
    check: valCheck(k, `Yes: ${fmt(D)} ÷ ${d} = ${fmt(k)}. ${fmt(k)} copies of the drawing's length make the actual length.`, [
      { v: D - d, mc: MC.diff, say: `${fmt(D - d)} is how much LONGER it is (${fmt(D)} − ${d}). “Times as long” asks how many copies of ${d} fit in ${fmt(D)}.` },
      { v: D, say: `${fmt(D)} ${u} is the actual length. How many times does ${d} ${u} fit into it?` },
    ], `Count copies: how many ${d}s make ${fmt(D)}? Divide ${fmt(D)} by ${d}.`),
  };
};
const timesSay: Gen = (R, n) => {
  const t = timesNumbers(R), { d, k, D, u } = t;
  return choiceItem(R, {
    id: `timesSay-${n}`, family: 'timesSay',
    prompt: `${t.big ? 'The' : 'A'} ${t.obj} is ${A(L(d, u))} long, and the actual ${t.real} is ${B(L(D, u))} long. Which sentence is right?`,
    board: `${dT(d, u)} \\quad ${aT(D, u)}`,
    picture: timesPic(t),
    solution: [`${fmt(D)} ÷ ${d} = ${fmt(k)}.`, `The actual ${t.real} is ${S(`${fmt(k)} times as long`)} as the drawing.`],
  }, [
    { t: `The actual ${t.real} is ${fmt(k)} times as long as the drawing.`, ok: true, say: `Yes: ${fmt(k)} copies of ${d} ${u} make ${fmt(D)} ${u}.` },
    { t: `The actual ${t.real} is ${fmt(D - d)} times as long as the drawing.`, ok: false, mc: MC.diff, say: `${fmt(D - d)} is the difference, ${fmt(D)} − ${d}. Times as long: ${fmt(D)} ÷ ${d}.` },
    { t: `The drawing is ${fmt(k)} times as long as the actual ${t.real}.`, ok: false, mc: MC.reverse, say: `The drawing is the shorter one. The ACTUAL ${t.real} is ${fmt(k)} times as long.` },
  ]);
};

// ===== 3 one-factor-all-lengths =====
/** which of three drawings of an object is to scale? (one true, one stretched, one with the same amount added) */
const toScale: Gen = (R, n) => retry(() => {
  const metric = R() < 0.4, u = metric ? 'cm' : 'in';
  const a = int(R, 3, 5), b = int(R, 2, a - 1), k = int(R, 2, 8), add = int(R, 1, 2), o = objFor(R, metric, a * k, b * k);
  if (!o) return null;
  const stretch: [number, number] = R() < 0.5 ? [a + 1, b] : [a, b + 1];
  const plus: [number, number] = [a + add, b + add];
  const cs = [[a, b], stretch, plus].map(([x, y]) => `${x} ${u} by ${y} ${u}`);
  if (new Set(cs).size < 3 || stretch[1] >= stretch[0]) return null;
  return choiceItem(R, {
    id: `toScale-${n}`, family: 'toScale',
    prompt: `The actual ${o.name} is ${B(L(a * k, u))} long and ${B(L(b * k, u))} wide. Which drawing of it is to scale?`,
    board: `${aT(a * k, u)} \\times ${aT(b * k, u)}`,
    solution: [`To scale means ONE factor for both lengths.`, `${a * k} ÷ ${a} = ${k} and ${b * k} ÷ ${b} = ${k}: the ${S(`${a} ${u} by ${b} ${u}`)} drawing uses × ${k} both ways.`],
  }, [
    { t: cs[0]!, ok: true, say: `Yes: × ${k} turns ${a} into ${a * k} and ${b} into ${b * k}. One factor, both ways.` },
    { t: cs[1]!, ok: false, mc: MC.fewChecks, say: stretch[0] !== a ? `The width works (× ${k}), but ${stretch[0]} × ${k} = ${stretch[0] * k}, not ${a * k}. Check both lengths.` : `The length works (× ${k}), but ${stretch[1]} × ${k} = ${stretch[1] * k}, not ${b * k}. Check both lengths.` },
    { t: cs[2]!, ok: false, mc: MC.additive, say: `That adds ${add} to each side of the true drawing. A scale multiplies: ${a + add} × ${k} = ${(a + add) * k}, not ${a * k}.` },
  ]);
});
/** is this drawing to scale? take the factor from one side, test it on the other (the copies show it) */
const scaleCheck: Gen = (R, n) => retry(() => {
  const metric = R() < 0.4, u = metric ? 'cm' : 'in';
  const a = int(R, 3, 6), b = int(R, 2, Math.min(4, a - 1)), k = int(R, 2, 6), o = objFor(R, metric, a * k, b * k);
  if (!o) return null;
  const truth = R() < 0.45;
  const da = truth ? a : a + pick(R, [-1, 1] as const);
  if (da <= b || da === a && !truth) return null;
  const nm = pick(R, NAMES);
  const ok = truth;
  const pair: PairParams = { unit: u, draw: [da, b], real: [a * k, b * k], shape: o.shape, copies: [k, k] };
  if (!fitsCopies(da, b, a * k, b * k, da * k)) return null;
  return choiceItem(R, {
    id: `scaleCheck-${n}`, family: 'scaleCheck',
    prompt: `${nm} drew ${an(o.name)} ${A(L(da, u))} by ${A(L(b, u))}. The actual ${o.name} is ${B(L(a * k, u))} by ${B(L(b * k, u))}. The widths give the factor: ${b * k} ÷ ${b} = ${k}. Is the drawing to scale?`,
    board: `${aT(b * k, u)} \\div ${dT(b, u)} = ${k}`,
    picture: { pair, solve: ['copyW', 'copyL'] },
    work: `${da} \\times ${k} = \\cssId{s}{${da * k}}`,
    solution: [`Test the factor ${k} on the lengths: ${da} × ${k} = ${da * k}.`, ok ? `${da * k} is the actual length, so ${S('yes')}: × ${k} works both ways.` : `The actual length is ${a * k}, not ${da * k}, so ${S('no')}: it is not to scale.`],
  }, ok ? [
    { t: `Yes: × ${k} works for the width and the length.`, ok: true, say: `Right: ${da} × ${k} = ${a * k} too. One factor, both ways.` },
    { t: `No: the lengths differ by ${a * k - da}, the widths only by ${b * k - b}.`, ok: false, mc: MC.additive, say: `Differences are not the test. A scale multiplies, and × ${k} works for both lengths.` },
    { t: `No: the factor has to come from the lengths, not the widths.`, ok: false, say: `Any matching pair gives the factor. Test it on the other pair: ${da} × ${k} = ${a * k}. It works.` },
  ] : [
    { t: `No: ${da} × ${k} = ${da * k}, not ${a * k}.`, ok: true, say: `Right: the factor from the widths does not fit the lengths, so it is not to scale.` },
    { t: `Yes: × ${k} works for the width, so it is to scale.`, ok: false, mc: MC.fewChecks, say: `Test it on the length too: ${da} × ${k} = ${da * k}, not ${a * k}. One pair is not enough.` },
    { t: `Yes: the drawing is smaller than the ${o.name} both ways.`, ok: false, say: `Smaller is not enough. To scale means ONE factor for both: ${da} × ${k} = ${da * k}, not ${a * k}.` },
  ]);
});

// ===== 4 common-unit-first =====
const UNIT_PAIRS: readonly { d: number; dU: 'cm' | 'in' | 'ft'; a: number; aU: 'm' | 'ft' | 'yd' }[] = [
  { d: 2, dU: 'cm', a: 2, aU: 'm' }, { d: 1, dU: 'cm', a: 1, aU: 'm' }, { d: 3, dU: 'cm', a: 30, aU: 'm' }, { d: 4, dU: 'cm', a: 4, aU: 'm' },
  { d: 5, dU: 'cm', a: 5, aU: 'm' }, { d: 2, dU: 'cm', a: 20, aU: 'm' }, { d: 6, dU: 'cm', a: 6, aU: 'm' }, { d: 3, dU: 'cm', a: 3, aU: 'm' },
  { d: 4, dU: 'in', a: 1, aU: 'yd' }, { d: 3, dU: 'in', a: 2, aU: 'ft' }, { d: 1, dU: 'ft', a: 2, aU: 'yd' }, { d: 2, dU: 'ft', a: 6, aU: 'yd' },
  { d: 2, dU: 'in', a: 1, aU: 'ft' }, { d: 4, dU: 'in', a: 3, aU: 'ft' }, { d: 6, dU: 'in', a: 5, aU: 'ft' }, { d: 9, dU: 'in', a: 2, aU: 'yd' },
  { d: 6, dU: 'in', a: 1, aU: 'yd' }, { d: 1, dU: 'ft', a: 3, aU: 'yd' }, { d: 3, dU: 'in', a: 1, aU: 'ft' }, { d: 8, dU: 'in', a: 6, aU: 'ft' },
];
const REL: Record<string, string> = { 'cm-m': '1 m = 100 cm', 'in-ft': '1 ft = 12 in', 'in-yd': '1 yd = 36 in', 'ft-yd': '1 yd = 3 ft' };
const sameUnitF: Gen = (R, n) => {
  let p = pick(R, UNIT_PAIRS), s = sameUnit(p.d, p.dU, p.a, p.aU), c = ctxSize(R, cmOf(s.a, s.unit));
  while (!c) { p = pick(R, UNIT_PAIRS); s = sameUnit(p.d, p.dU, p.a, p.aU); c = ctxSize(R, cmOf(s.a, s.unit)); }
  const raw = p.a / p.d;
  return {
    id: `sameUnit-${n}`, family: 'sameUnit',
    prompt: `The ${c.draw} is ${A(L(p.d, p.dU))} long. The actual ${c.real} is ${B(L(p.a, p.aU))} long. The actual length is how many times as long? (${REL[`${p.dU}-${p.aU}`]})`,
    board: `${dT(p.d, p.dU)} \\quad ${aT(p.a, p.aU)}`,
    input: 'num', unit: 'times as long', answer: { kind: 'num', v: s.k },
    work: `${aT(p.a, p.aU)} = ${aT(s.a, s.unit)}, ${tfmt(s.a)} \\div ${p.d} = \\cssId{s}{${tfmt(s.k)}}`,
    solution: [`One unit first: ${B(L(p.a, p.aU))} = ${B(L(s.a, s.unit))}.`, `${fmt(s.a)} ÷ ${p.d} = ${S(fmt(s.k))}.`],
    check: valCheck(s.k, `Yes: ${L(p.a, p.aU)} = ${L(s.a, s.unit)}, and ${fmt(s.a)} ÷ ${p.d} = ${fmt(s.k)}.`, [
      { v: raw, mc: MC.unlike, say: `${p.a} ÷ ${p.d} compares ${p.aU} with ${p.dU}. Write both in ${s.unit} first: ${L(p.a, p.aU)} = ${L(s.a, s.unit)}.` },
      { v: s.a, say: `${fmt(s.a)} ${s.unit} is the actual length in ${s.unit}. Now how many times does ${p.d} fit into it?` },
      { v: s.a - p.d, mc: MC.diff, say: `That is the difference. “Times as long” divides: ${fmt(s.a)} ÷ ${p.d}.` },
    ], `Rewrite ${L(p.a, p.aU)} in ${s.unit} (${REL[`${p.dU}-${p.aU}`]}), then divide by ${p.d}.`),
  };
};
const convertFirst: Gen = (R, n) => {
  const p = pick(R, UNIT_PAIRS), s = sameUnit(p.d, p.dU, p.a, p.aU);
  const wrongBig = `${p.d} ${p.aU} and ${p.a} ${p.aU}`;
  return choiceItem(R, {
    id: `convertFirst-${n}`, family: 'convertFirst',
    prompt: `A drawing shows a length of ${A(L(p.d, p.dU))}. The actual length is ${B(L(p.a, p.aU))}. Before you compare them, what should you write? (${REL[`${p.dU}-${p.aU}`]})`,
    board: `${dT(p.d, p.dU)} \\quad ${aT(p.a, p.aU)}`,
    solution: [`Compare lengths in ONE unit: change ${B(L(p.a, p.aU))} into ${s.unit}.`, `${S(`${L(p.d, p.dU)} and ${L(s.a, s.unit)}`)}: now ${fmt(s.a)} ÷ ${p.d} = ${fmt(s.k)}.`],
  }, [
    { t: `${L(p.d, p.dU)} and ${L(s.a, s.unit)}`, ok: true, say: `Yes: both in ${s.unit}. Now the factor is ${fmt(s.a)} ÷ ${p.d} = ${fmt(s.k)}.` },
    { t: `${p.d} and ${p.a}, the numbers as they are`, ok: false, mc: MC.unlike, say: `${p.d} ${p.dU} and ${p.a} ${p.aU} are in different units. Comparing ${p.d} with ${p.a} mixes them up.` },
    { t: wrongBig, ok: false, mc: MC.unlike, say: `That turns ${p.d} ${p.dU} into ${p.d} ${p.aU}, a different length. Convert the number too: ${L(p.a, p.aU)} = ${L(s.a, s.unit)}.` },
  ]);
};

// ===== 5 read-ratio-scale =====
const SCALES = [2, 10, 50, 100, 1000] as const;
const readScale: Gen = (R, n) => {
  const N = pick(R, SCALES), inch = R() < 0.45, u = inch ? 'in' : 'cm', big = inch ? 'ft' : 'm', c = N >= 50 ? pick(R, PLACES) : ctxTier(R, N).real, what = N >= 50 ? 'plan' : 'drawing';
  const opts: Opt[] = [
    { t: `1 ${u} on the drawing represents ${fmt(N)} ${u} in reality.`, ok: true, say: `Yes: drawing first, actual second, the same unit for both.` },
    { t: `${fmt(N)} ${u} on the drawing represents 1 ${u} in reality.`, ok: false, mc: MC.reverse, say: `The order is drawing : actual. The 1 belongs to the drawing.` },
    { t: `1 ${u} on the drawing represents ${fmt(N)} ${big} in reality.`, ok: false, mc: MC.mixedUnits, say: `1 : ${fmt(N)} has no units of its own, so both parts are in the SAME unit: ${fmt(N)} ${u}, not ${fmt(N)} ${big}.` },
  ];
  if (inch) opts.push({ t: `Nothing: 1 : ${fmt(N)} only works in centimeters.`, ok: false, mc: MC.cmOnly, say: `A ratio scale works in any one unit: 1 in stands for ${fmt(N)} in, 1 cm for ${fmt(N)} cm.` });
  return choiceItem(R, {
    id: `readScale-${n}`, family: 'readScale',
    prompt: `A ${what} of a ${c} has the scale ${A('1')} : ${B(fmt(N))} (drawing : actual). The ${what} is measured in ${inch ? 'inches' : 'centimeters'}. What does the scale say?`,
    board: `\\text{scale } \\cssId{d}{1} : \\cssId{a}{${tfmt(N)}}`,
    solution: [`1 : ${fmt(N)} is drawing : actual, both in one unit.`, `${S(`1 ${u} on the drawing represents ${fmt(N)} ${u}`)} of the actual ${c}.`],
  }, opts);
};
const whichPart: Gen = (R, n) => {
  const N = pick(R, SCALES), c = ctxTier(R, N), drawingAsked = R() < 0.5;
  return choiceItem(R, {
    id: `whichPart-${n}`, family: 'whichPart',
    prompt: `The ${c.draw} is made at the scale 1 : ${fmt(N)}. A scale is written drawing : actual. Which number stands for the ${drawingAsked ? c.draw : `actual ${c.real}`}?`,
    board: `1 : ${tfmt(N)}`,
    solution: [`drawing : actual = 1 : ${fmt(N)}.`, drawingAsked ? `The first number, ${S('1')}, belongs to the ${c.draw}.` : `The second number, ${S(fmt(N))}, belongs to the actual ${c.real}.`],
  }, [
    { t: drawingAsked ? '1' : fmt(N), ok: true, say: `Yes: drawing first, actual second.` },
    { t: drawingAsked ? fmt(N) : '1', ok: false, mc: MC.reverse, say: `The order is drawing : actual. The ${drawingAsked ? 'drawing gets the 1' : 'actual object gets the ' + fmt(N)}.` },
    { t: `${fmt(N + 1)}, the two together`, ok: false, say: `A ratio is not a sum. Each number belongs to one of the two things, in the order drawing : actual.` },
  ]);
};

// ===== 6 write-ratio-scale =====
const WRITE: readonly { d: number; dU: 'cm' | 'in'; a: number; aU: 'cm' | 'in' | 'm' | 'ft' | 'yd' }[] = [
  { d: 1, dU: 'cm', a: 50, aU: 'cm' }, { d: 1, dU: 'in', a: 20, aU: 'in' }, { d: 1, dU: 'cm', a: 10, aU: 'cm' },
  { d: 2, dU: 'cm', a: 200, aU: 'cm' }, { d: 3, dU: 'cm', a: 30, aU: 'cm' }, { d: 2, dU: 'in', a: 20, aU: 'in' }, { d: 4, dU: 'cm', a: 400, aU: 'cm' },
  { d: 3, dU: 'in', a: 24, aU: 'in' }, { d: 5, dU: 'cm', a: 50, aU: 'cm' }, { d: 4, dU: 'in', a: 28, aU: 'in' }, { d: 6, dU: 'cm', a: 600, aU: 'cm' },
  { d: 2, dU: 'cm', a: 2, aU: 'm' }, { d: 3, dU: 'in', a: 2, aU: 'ft' }, { d: 1, dU: 'in', a: 3, aU: 'ft' }, { d: 5, dU: 'cm', a: 5, aU: 'm' },
  { d: 2, dU: 'in', a: 4, aU: 'ft' }, { d: 1, dU: 'in', a: 1, aU: 'yd' },
];
const writeScale: Gen = (R, n) => {
  const p = pick(R, WRITE), s = sameUnit(p.d, p.dU, p.a, p.aU), N = s.k, c = pick(R, ['drawing', 'plan', 'model', 'sketch'] as const);
  const mixed = p.dU !== p.aU;
  const check = (r: Response): Verdict => {
    if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type a number in each box.' };
    const { x, y } = r;
    if (near(x, 1) && near(y, N)) return { ok: true, say: `Yes: ${p.d} : ${fmt(s.a)} = 1 : ${fmt(N)}, drawing first.` };
    if (near(x, N) && near(y, 1)) return { ok: false, mc: MC.reverse, say: `The drawing comes first. The drawing is the short one: 1 : ${fmt(N)}.` };
    if (x > 0 && near(y / x, N)) return { ok: false, say: `${fmt(x)} : ${fmt(y)} is the same comparison. Now make the drawing part 1: divide both by ${fmt(x)}.` };
    if (near(x, 1) && near(y, s.a) && p.d !== 1) return { ok: false, mc: MC.oneTerm, say: `You divided the drawing part by ${p.d} but not the actual part. Divide BOTH by ${p.d}: ${fmt(s.a)} ÷ ${p.d} = ${fmt(N)}.` };
    if (mixed && ((near(x, p.d) && near(y, p.a)) || (near(x, 1) && near(y, p.a / p.d)))) return { ok: false, mc: MC.notConverted, say: `${p.aU} and ${p.dU} are different units. First write ${L(p.a, p.aU)} as ${L(s.a, s.unit)}.` };
    return { ok: false, say: `Write both in ${s.unit}, then divide both parts by the drawing length.` };
  };
  return {
    id: `writeScale-${n}`, family: 'writeScale',
    prompt: `On a ${c}, a length of ${A(L(p.d, p.dU))} stands for an actual length of ${B(L(p.a, p.aU))}. Write the scale (drawing : actual) in the form 1 : n.`,
    board: `${dT(p.d, p.dU)} : ${aT(p.a, p.aU)}`,
    input: 'pair', pairLead: 'scale', pairOp: ':', answer: { kind: 'pair', x: 1, y: N },
    work: p.d === 1 && !mixed ? `\\cssId{s}{1 : ${tfmt(N)}}` : `${tfmt(p.d)} : ${tfmt(s.a)} = \\cssId{s}{1 : ${tfmt(N)}}`,
    solution: [mixed ? `One unit: ${L(p.a, p.aU)} = ${L(s.a, s.unit)}, so ${p.d} : ${fmt(s.a)}.` : `Drawing first: ${p.d} : ${fmt(s.a)}.`, `Divide both by ${p.d}: ${S(`1 : ${fmt(N)}`)}.`],
    check,
  };
};

// ===== 7 read-unit-legend =====
const LEGENDS: readonly { r: number; aU: 'ft' | 'm'; dU: 'in' | 'cm' }[] = [
  { r: 2, aU: 'ft', dU: 'in' }, { r: 5, aU: 'ft', dU: 'in' }, { r: 10, aU: 'ft', dU: 'in' }, { r: 1, aU: 'm', dU: 'cm' }, { r: 2, aU: 'm', dU: 'cm' },
  { r: 4, aU: 'ft', dU: 'in' }, { r: 3, aU: 'ft', dU: 'in' }, { r: 5, aU: 'm', dU: 'cm' },
];
const legendMeaning: Gen = (R, n) => {
  const g = pick(R, LEGENDS), eq = R() < 0.5, c = pick(R, PLACES), dW = g.dU === 'in' ? 'inch' : 'centimeter', aW = g.aU === 'ft' ? (g.r === 1 ? 'foot' : 'feet') : (g.r === 1 ? 'meter' : 'meters');
  return choiceItem(R, {
    id: `legendMeaning-${n}`, family: 'legendMeaning',
    prompt: `The plan of a ${c} has the legend ${A(`1 ${g.dU}`)} ${eq ? '=' : 'represents'} ${B(`${g.r} ${g.aU}`)}. What does it mean?`,
    board: `\\cssId{d}{1${T(g.dU)}} ${eq ? '=' : '\\text{ represents }'} \\cssId{a}{${g.r}${T(g.aU)}}`,
    solution: [`A legend is a rate: actual length per unit of drawing.`, `${S(`Each ${dW} on the plan stands for ${g.r} ${aW}`)} of the real ${c}.${eq ? ' The “=” means “represents”: the lengths are not equal.' : ''}`],
  }, [
    { t: `Each ${dW} on the plan stands for ${g.r} ${aW} of the real ${c}.`, ok: true, say: `Yes: ${g.r} ${aW} of the ${c} per ${dW} of plan.${eq ? ' The = sign here means “represents”.' : ''}` },
    { t: `1 ${dW} and ${g.r} ${aW} are the same length.`, ok: false, mc: MC.equality, say: `1 ${dW} is much shorter than ${g.r} ${aW}. The legend says one STANDS FOR the other${eq ? ', even when it is printed with =' : ''}.` },
    { t: `Each ${g.aU === 'ft' ? 'foot' : 'meter'} of the real ${c} is drawn ${g.r} ${dW}${g.r === 1 ? '' : dW === 'inch' ? 'es' : 's'} long.`, ok: false, mc: MC.reverse, say: `That turns the legend around. The plan's ${dW} comes first: one ${dW} of plan stands for ${g.r} ${aW}.` },
  ]);
};
const legendWrite: Gen = (R, n) => {
  const g = pick(R, LEGENDS), d = int(R, 2, 6), D = d * g.r, c = pick(R, ROOMS);
  return {
    id: `legendWrite-${n}`, family: 'legendWrite',
    prompt: `On a floor plan, the ${c} wall is ${A(L(d, g.dU))} long. The real wall is ${B(L(D, g.aU))} long. Finish the legend: 1 ${g.dU} represents how many ${g.aU}?`,
    board: `\\cssId{d}{1${T(g.dU)}} \\text{ represents } \\ ?${T(g.aU)}`,
    input: 'num', unit: g.aU, answer: { kind: 'num', v: g.r },
    work: `${D} \\div ${d} = \\cssId{s}{${g.r}}`,
    solution: [`${d} ${g.dU} of plan stand for ${D} ${g.aU}.`, `One ${g.dU} stands for ${D} ÷ ${d} = ${S(L(g.r, g.aU))}.`],
    check: valCheck(g.r, `Yes: ${D} ÷ ${d} = ${g.r}. 1 ${g.dU} represents ${g.r} ${g.aU}.`, [
      { v: D, say: `${D} ${g.aU} is the whole wall, ${d} ${g.dU} of plan. What does ONE ${g.dU} stand for?` },
      { v: D - d, mc: MC.diff, say: `${D} − ${d} mixes units and subtracts. Share the ${D} ${g.aU} over the ${d} ${g.dU}: ${D} ÷ ${d}.` },
    ], `Share the ${D} ${g.aU} equally over the ${d} ${g.dU} of plan.`),
  };
};

// ===== 8 legend-to-ratio =====
const L2R: readonly { r: number; dU: 'in' | 'cm'; aU: 'm' | 'ft' | 'yd' }[] = [
  { r: 1, dU: 'cm', aU: 'm' }, { r: 2, dU: 'cm', aU: 'm' }, { r: 5, dU: 'cm', aU: 'm' }, { r: 1, dU: 'in', aU: 'ft' }, { r: 2, dU: 'in', aU: 'ft' },
  { r: 1, dU: 'in', aU: 'yd' }, { r: 10, dU: 'in', aU: 'ft' }, { r: 3, dU: 'in', aU: 'ft' }, { r: 4, dU: 'in', aU: 'ft' }, { r: 5, dU: 'in', aU: 'ft' },
  { r: 2, dU: 'in', aU: 'yd' }, { r: 3, dU: 'cm', aU: 'm' },
];
const UREL: Record<string, string> = { m: '100 cm', ft: '12 in', yd: '36 in' };
const legendToRatio: Gen = (R, n) => {
  const g = pick(R, L2R), N = legendRatio(g.r, g.dU, g.aU), per = N / g.r, c = pick(R, PLACES);
  return {
    id: `legendToRatio-${n}`, family: 'legendToRatio',
    prompt: `The legend on a plan of a ${c} says ${A(`1 ${g.dU}`)} represents ${B(`${g.r} ${g.aU}`)}. Write it as a same-unit scale: 1 : ? (1 ${g.aU} = ${UREL[g.aU]})`,
    board: `\\cssId{d}{1${T(g.dU)}} \\to \\cssId{a}{${g.r}${T(g.aU)}}`,
    input: 'num', unit: '', answer: { kind: 'num', v: N },
    work: `${g.r}${T(g.aU)} = ${g.r} \\times ${per}${T(g.dU)} = \\cssId{s}{${tfmt(N)}${T(g.dU)}}`,
    solution: [`Write the actual part in ${g.dU}: ${g.r} ${g.aU} = ${g.r} × ${per} = ${fmt(N)} ${g.dU}.`, `1 ${g.dU} : ${fmt(N)} ${g.dU}, so the scale is ${S(`1 : ${fmt(N)}`)}.`],
    check: valCheck(N, `Yes: ${g.r} ${g.aU} = ${fmt(N)} ${g.dU}, so 1 : ${fmt(N)}.`, [
      { v: g.r, mc: MC.notConverted, say: `1 : ${g.r} would mean 1 ${g.dU} stands for ${g.r} ${g.dU}. But it stands for ${g.r} ${g.aU} = ${fmt(N)} ${g.dU}.` },
      { v: per, say: `${per} ${g.dU} is ONE ${g.aU === 'ft' ? 'foot' : g.aU === 'yd' ? 'yard' : 'meter'}. The legend has ${g.r}: ${g.r} × ${per}.` },
    ], `Change ${g.r} ${g.aU} into ${g.dU} (1 ${g.aU} = ${UREL[g.aU]}).`),
  };
};
const ratioToLegend: Gen = (R, n) => {
  const g = pick(R, L2R.filter(x => x.aU !== 'yd' || x.r === 1)), N = legendRatio(g.r, g.dU, g.aU), per = N / g.r, c = pick(R, PLACES);
  return {
    id: `ratioToLegend-${n}`, family: 'ratioToLegend',
    prompt: `A plan of a ${c} has the scale ${A('1')} : ${B(fmt(N))}, measured in ${g.dU === 'in' ? 'inches' : 'centimeters'}. Finish the legend: 1 ${g.dU} represents how many ${g.aU}? (1 ${g.aU} = ${UREL[g.aU]})`,
    board: `1 : ${tfmt(N)} \\;\\to\\; \\cssId{d}{1${T(g.dU)}} \\text{ rep. } \\ ?${T(g.aU)}`,
    input: 'num', unit: g.aU, answer: { kind: 'num', v: g.r },
    work: `${tfmt(N)}${T(g.dU)} = ${tfmt(N)} \\div ${per} = \\cssId{s}{${g.r}${T(g.aU)}}`,
    solution: [`1 : ${fmt(N)} means 1 ${g.dU} stands for ${fmt(N)} ${g.dU}.`, `${fmt(N)} ${g.dU} = ${fmt(N)} ÷ ${per} = ${S(L(g.r, g.aU))}.`],
    check: valCheck(g.r, `Yes: ${fmt(N)} ${g.dU} = ${g.r} ${g.aU}, so 1 ${g.dU} represents ${g.r} ${g.aU}.`, [
      { v: N, mc: MC.notConverted, say: `1 ${g.dU} stands for ${fmt(N)} ${g.dU}, not ${fmt(N)} ${g.aU}. Change ${fmt(N)} ${g.dU} into ${g.aU}.` },
    ], `1 ${g.dU} stands for ${fmt(N)} ${g.dU}. How many ${g.aU} is that? (1 ${g.aU} = ${UREL[g.aU]})`),
  };
};

// ===== 9 factor-vs-length =====
const whatIsN: Gen = (R, n) => {
  let N: number = 2, inch = false, u = 'cm', d = 2, c: Ctx | null = null;
  while (!c) { N = pick(R, [2, 10, 100] as const); inch = R() < 0.5; u = inch ? 'in' : 'cm'; d = int(R, 2, 9); c = ctxSize(R, cmOf(d * N, u)); }
  return choiceItem(R, {
    id: `whatIsN-${n}`, family: 'whatIsN',
    prompt: `The ${c.draw} is made at 1 : ${fmt(N)}. A part that is ${A(L(d, u))} long on it is ${B(L(d * N, u))} long on the actual ${c.real}. What is the ${fmt(N)}?`,
    board: `\\cssId{d}{1} : \\cssId{a}{${tfmt(N)}} \\quad ${dT(d, u)} \\to ${aT(d * N, u)}`,
    solution: [`${fmt(d * N)} ÷ ${d} = ${fmt(N)}: every actual length is ${fmt(N)} times its drawing length.`, `So ${fmt(N)} is ${S('the factor from drawing to actual')}: a number without a unit, not a length.`],
  }, [
    { t: `The factor from drawing to actual: it has no unit.`, ok: true, say: `Yes: ${fmt(N)} says how many times as long. The lengths are ${d} ${u} and ${fmt(d * N)} ${u}.` },
    { t: `The length of the actual ${c.real}, in ${u}.`, ok: false, mc: MC.nAsLength, say: `The part is ${fmt(d * N)} ${u} long, not ${fmt(N)}. The scale is not a length: it multiplies every drawing length.` },
    { t: `How much longer the actual ${c.real} is.`, ok: false, mc: MC.diff, say: `${fmt(d * N)} − ${d} = ${fmt(d * N - d)}, not ${fmt(N)}. The scale is “times as long”, not “longer by”.` },
  ]);
};
const useFactor: Gen = (R, n) => retry(() => {
  const N = pick(R, [2, 10, 100] as const), a = int(R, 2, 9), b = int(R, 2, 9), c = pick(R, PLACES), r1 = pick(R, ROOMS), r2 = pick(R, ROOMS);
  if (a === b || r1 === r2 || b === N || a * N === b * N) return null;
  return {
    id: `useFactor-${n}`, family: 'useFactor',
    prompt: `A plan of a ${c} is drawn at 1 : ${fmt(N)}. On the plan, the ${r1} wall is ${A(L(a, 'cm'))} and the ${r2} wall is ${A(L(b, 'cm'))}. How long is the actual ${r2} wall?`,
    board: `\\cssId{d}{1} : \\cssId{a}{${tfmt(N)}} \\quad ${dT(b, 'cm')} \\to \\ ?`,
    input: 'num', unit: 'cm', answer: { kind: 'num', v: b * N },
    work: `${b} \\times ${tfmt(N)} = \\cssId{s}{${tfmt(b * N)}${T('cm')}}`,
    solution: [`Every actual length is ${fmt(N)} times its plan length, whatever the wall.`, `${b} × ${fmt(N)} = ${S(L(b * N, 'cm'))}.`],
    check: valCheck(b * N, `Yes: ${b} × ${fmt(N)} = ${fmt(b * N)} cm.`, [
      { v: N, mc: MC.nAsLength, say: `${fmt(N)} is the factor, not a length. The ${r2} wall is ${b} cm on the plan: ${b} × ${fmt(N)}.` },
      { v: a * N, mc: MC.noncorr, say: `That is the ${r1} wall. The ${r2} wall is ${b} cm on the plan.` },
      { v: b, mc: MC.drawAsActual, say: `${b} cm is the length on the plan. The actual wall is ${fmt(N)} times as long.` },
    ], `Multiply the plan length by ${fmt(N)}.`),
  };
});

// ===== 10 unit-invariance =====
const unitSwap: Gen = (R, n) => {
  const v = int(R, 0, 2), nm = pick(R, NAMES), c = pick(R, PLACES);
  if (v === 2) {
    const N = pick(R, [12, 24, 36, 48] as const);
    return choiceItem(R, {
      id: `unitSwap-${n}`, family: 'unitSwap',
      prompt: `A plan of a ${c} is drawn at 1 : ${N}, measured in inches. ${nm} measures it in feet instead. What is the scale now?`,
      board: `1 : ${N} \\quad \\text{in} \\to \\text{ft}`,
      solution: [`1 : ${N} says every actual length is ${N} times its drawing length.`, `That does not depend on the unit: it is ${S(`still 1 : ${N}`)} in feet, centimeters or anything else.`],
    }, [
      { t: `Still 1 : ${N}`, ok: true, say: `Yes: actual lengths are still ${N} times as long. Changing the unit of BOTH lengths does not change “times as long”.` },
      { t: `1 : ${N / 12}, because ${N} in = ${N / 12} ft`, ok: false, mc: MC.unitChange, say: `Only the actual part was changed into feet. Do it to both: 1 in = 1/12 ft too, so it stays 1 : ${N}.` },
      { t: `It has no scale in feet: a ratio scale is only for inches`, ok: false, mc: MC.cmOnly, say: `A ratio scale works in any one unit: 1 ft on the plan stands for ${N} ft.` },
    ]);
  }
  const N = pick(R, [20, 50, 100, 200] as const), other = v === 0 ? 'inches' : 'millimeters';
  const wrongN = v === 0 ? Math.round(N / 2.54) : N * 10;
  return choiceItem(R, {
    id: `unitSwap-${n}`, family: 'unitSwap',
    prompt: `A plan of a ${c} is drawn at 1 : ${N}, measured in centimeters. ${nm} measures it in ${other} instead. What is the scale now?`,
    board: `1 : ${N} \\quad \\text{cm} \\to \\text{${v === 0 ? 'in' : 'mm'}}`,
    solution: [`1 : ${N} says every actual length is ${N} times its drawing length.`, `Measured in any one unit, that stays true: ${S(`still 1 : ${N}`)}.`],
  }, [
    { t: `Still 1 : ${N}`, ok: true, say: `Yes: both lengths change unit together, so the actual length is still ${N} times as long.` },
    { t: v === 0 ? `1 : ${wrongN}, because ${N} cm is about ${wrongN} in` : `1 : ${fmt(wrongN)}, because 1 cm = 10 mm`, ok: false, mc: MC.unitChange, say: v === 0 ? `That changes only the actual part into inches. The drawing part changes too, so the comparison stays 1 : ${N}.` : `1 cm becomes 10 mm AND ${N} cm becomes ${N * 10} mm: 10 : ${N * 10} is still 1 : ${N}.` },
    { t: `It has no scale in ${other}: 1 : ${N} only works in centimeters`, ok: false, mc: MC.cmOnly, say: `A ratio scale has no unit: 1 ${v === 0 ? 'inch' : 'mm'} on the plan stands for ${N} ${v === 0 ? 'inches' : 'mm'}.` },
  ]);
};

// ===== 11 factor-direction =====
const direction: Gen = (R, n) => {
  const N = pick(R, [2, 10, 100] as const), c = ctxTier(R, N), v = int(R, 0, 2);
  const base = `The ${c.draw} is made at 1 : ${fmt(N)}.`;
  if (v === 0) return {
    id: `direction-${n}`, family: 'direction',
    prompt: `${base} The actual ${c.real} is how many times as long as the ${c.draw}?`,
    board: `\\text{drawing} \\xrightarrow{\\times\\, ?} \\text{actual}`,
    input: 'num', unit: 'times as long', answer: { kind: 'num', v: N },
    work: `\\text{drawing} \\xrightarrow{\\times ${tfmt(N)}} \\text{actual}`,
    solution: [`1 : ${fmt(N)}: 1 on the drawing, ${fmt(N)} in reality.`, `From drawing to actual: ${S(`× ${fmt(N)}`)}.`],
    check: valCheck(N, `Yes: from drawing to actual, × ${fmt(N)}.`, [{ v: 1 / N, mc: MC.reverse, say: `1/${fmt(N)} is the other direction: the drawing is 1/${fmt(N)} as long. The ACTUAL object is ${fmt(N)} times as long.` }], `The actual ${c.real} is the long one: ${fmt(N)} on the actual side for 1 on the drawing.`),
  };
  if (v === 1) return {
    id: `direction-${n}`, family: 'direction',
    prompt: `${base} The ${c.draw} is what fraction as long as the actual ${c.real}?`,
    board: `\\text{actual} \\xrightarrow{\\times\\, ?} \\text{drawing}`,
    input: 'frac', unit: 'as long', answer: { kind: 'frac', w: 0, n: 1, d: N },
    work: `\\text{actual} \\xrightarrow{\\times \\frac{1}{${tfmt(N)}}} \\text{drawing}`,
    solution: [`From actual to drawing, go back: divide by ${fmt(N)}.`, `The ${c.draw} is ${S(`1/${fmt(N)}`)} as long.`],
    check: valCheck(1 / N, `Yes: the ${c.draw} is 1/${fmt(N)} as long as the actual ${c.real}.`, [{ v: N, mc: MC.bigOverSmall, say: `${fmt(N)} is drawing to actual. From actual to drawing the factor shrinks: 1/${fmt(N)}.` }], `Which is shorter, the ${c.draw} or the actual ${c.real}? Its factor is a fraction.`),
  };
  return choiceItem(R, {
    id: `direction-${n}`, family: 'direction',
    prompt: `${base} Which sentence is right?`,
    board: `\\cssId{d}{1} : \\cssId{a}{${tfmt(N)}}`,
    solution: [`Drawing to actual: × ${fmt(N)}. Actual to drawing: × 1/${fmt(N)}.`, `${S(`The ${c.draw} is 1/${fmt(N)} as long as the actual ${c.real}.`)}`],
  }, [
    { t: `The ${c.draw} is 1/${fmt(N)} as long as the actual ${c.real}.`, ok: true, say: `Yes: going from actual to drawing, the factor is 1/${fmt(N)}.` },
    { t: `The ${c.draw} is ${fmt(N)} times as long as the actual ${c.real}.`, ok: false, mc: MC.reverse, say: `That turns the scale around. The ${c.draw} is the SHORT one.` },
    { t: `Going either way, the factor is ${fmt(N)}.`, ok: false, mc: MC.bigOverSmall, say: `${fmt(N)} is only drawing to actual. Back from actual to drawing, it is 1/${fmt(N)}.` },
  ]);
};

// ===== 12 enlargement-scales =====
const SMALL_THINGS = ['ant', 'bee', 'snowflake', 'watch gear', 'seed', 'microchip', 'ladybug', 'screw'] as const;
const enlarge: Gen = (R, n) => {
  const v = int(R, 0, 2), N = pick(R, [2, 5, 10, 20] as const), th = pick(R, SMALL_THINGS);
  if (v === 0) return choiceItem(R, {
    id: `enlarge-${n}`, family: 'enlarge',
    prompt: `A drawing of a ${th} has the scale ${A(fmt(N))} : ${B('1')} (drawing : actual). Which is true?`,
    board: `\\cssId{d}{${N}} : \\cssId{a}{1}`,
    solution: [`${N} : 1 is drawing : actual: the drawing gets the ${N}.`, `${S(`Each drawing length is ${N} times as long as the actual length`)}: an enlargement.`],
  }, [
    { t: `Each drawing length is ${N} times as long as the actual length.`, ok: true, say: `Yes: ${N} : 1 is an enlargement. Tiny things get drawn bigger.` },
    { t: `The drawing is ${N} times smaller than the ${th}.`, ok: false, mc: MC.alwaysReduce, say: `Not every scale drawing shrinks. ${N} : 1 puts the ${N} on the drawing's side: it is bigger.` },
    { t: `The actual ${th} is ${N} times as long as the drawing.`, ok: false, mc: MC.reverse, say: `That reads it as actual : drawing. The first number is the drawing's.` },
  ]);
  if (v === 1) return choiceItem(R, {
    id: `enlarge-${n}`, family: 'enlarge',
    prompt: `Which scale (drawing : actual) makes the drawing LARGER than the ${th}?`,
    board: `\\text{drawing} : \\text{actual}`,
    solution: [`Larger drawing means the drawing's number is bigger.`, `${S(`${N} : 1`)}: each drawing length is ${N} times the actual length.`],
  }, [
    { t: `${N} : 1`, ok: true, say: `Yes: the drawing's number is the big one, so the drawing is ${N} times as long.` },
    { t: `1 : ${N}`, ok: false, mc: MC.reverse, say: `1 : ${N} means 1 on the drawing for ${N} in reality: the drawing is smaller.` },
    { t: `1 : 1`, ok: false, say: `1 : 1 is the same size: neither larger nor smaller.` },
  ]);
  return choiceItem(R, {
    id: `enlarge-${n}`, family: 'enlarge',
    prompt: `A drawing of a ${th} has the scale 1 : 1. What kind of drawing is it?`,
    board: `\\cssId{d}{1} : \\cssId{a}{1}`,
    solution: [`1 : 1 means 1 on the drawing for 1 in reality.`, `${S('The same size')}: the boundary between a reduction (1 : n) and an enlargement (n : 1).`],
  }, [
    { t: `The same size as the ${th}`, ok: true, say: `Yes: 1 : 1 is neither smaller nor larger. It is the boundary case.` },
    { t: `A reduction: scale drawings are smaller`, ok: false, mc: MC.alwaysReduce, say: `1 : 1 shrinks nothing, and some drawings are even enlargements, like ${N} : 1.` },
    { t: `An enlargement`, ok: false, say: `An enlargement has the bigger number first, like ${N} : 1. 1 : 1 keeps the size.` },
  ]);
};

// ===== 13 compare-scales =====
const CMP: readonly [number, number][] = [[50, 200], [10, 100], [20, 50], [100, 500], [25, 100], [50, 100], [2, 10]];
const compareScales: Gen = (R, n) => {
  const [a, b] = pick(R, CMP), c = ctxTier(R, Math.sqrt(a * b)), larger = R() < 0.6;
  const pickN = larger ? a : b, otherN = larger ? b : a;
  return choiceItem(R, {
    id: `compareScales-${n}`, family: 'compareScales',
    prompt: `The same ${c.real} is drawn twice: once at 1 : ${a} and once at 1 : ${b}. Which drawing is ${larger ? 'larger' : 'smaller'}?`,
    board: `1 : ${a} \\quad \\text{vs} \\quad 1 : ${b}`,
    solution: [`At 1 : ${a}, each unit of drawing stands for ${a} units of ${c.real}; at 1 : ${b}, for ${b}.`, `Each unit standing for MORE means a smaller drawing: the ${S(`1 : ${pickN}`)} drawing is ${larger ? 'larger' : 'smaller'}.`],
  }, [
    { t: `The 1 : ${pickN} drawing`, ok: true, say: larger ? `Yes: at 1 : ${a} each unit stands for less of the ${c.real}, so it takes more drawing.` : `Yes: at 1 : ${b} each unit stands for more of the ${c.real}, so the drawing is smaller.` },
    { t: `The 1 : ${otherN} drawing`, ok: false, mc: MC.bigN, say: `A bigger second number does not make a bigger drawing. At 1 : ${b}, each unit stands for MORE ${c.real}, so the drawing is smaller.` },
    { t: `They are the same size: it is the same ${c.real}`, ok: false, say: `Same ${c.real}, different scales: at 1 : ${a} each unit stands for less, so that drawing is bigger.` },
  ]);
};

// ===== 14 rate-vs-factor =====
const RATES: readonly { r: number; dU: 'in' | 'cm'; aU: 'ft' | 'm' | 'yd' }[] = [
  { r: 10, dU: 'in', aU: 'ft' }, { r: 2, dU: 'in', aU: 'ft' }, { r: 5, dU: 'in', aU: 'ft' }, { r: 2, dU: 'cm', aU: 'm' }, { r: 1, dU: 'cm', aU: 'm' },
  { r: 1, dU: 'in', aU: 'yd' }, { r: 5, dU: 'cm', aU: 'm' }, { r: 4, dU: 'in', aU: 'ft' }, { r: 3, dU: 'in', aU: 'ft' },
];
const rateFactor: Gen = (R, n) => {
  const g = pick(R, RATES), N = legendRatio(g.r, g.dU, g.aU), c = pick(R, PLACES);
  return {
    id: `rateFactor-${n}`, family: 'rateFactor',
    prompt: `A plan of a ${c} says ${A(`1 ${g.dU}`)} represents ${B(`${g.r} ${g.aU}`)}. Every actual length is how many times as long as its length on the plan? (1 ${g.aU} = ${UREL[g.aU]})`,
    board: `\\cssId{d}{1${T(g.dU)}} \\to \\cssId{a}{${g.r}${T(g.aU)}}`,
    input: 'num', unit: 'times as long', answer: { kind: 'num', v: N },
    work: `\\cssId{a}{${g.r}${T(g.aU)}} = \\cssId{a}{${tfmt(N)}${T(g.dU)}}, ${tfmt(N)} \\div 1 = \\cssId{s}{${tfmt(N)}}`,
    solution: [`${g.r} is a rate: ${g.r} ${g.aU} per ${g.dU}. For “times as long” use one unit.`, `${g.r} ${g.aU} = ${fmt(N)} ${g.dU}, so the factor is ${S(fmt(N))}.`],
    check: valCheck(N, `Yes: 1 ${g.dU} stands for ${fmt(N)} ${g.dU}, so ${fmt(N)} times as long.`, [
      { v: g.r, mc: MC.notConverted, say: `${g.r} is ${g.aU} per ${g.dU}, a rate with two units. In one unit: ${g.r} ${g.aU} = ${fmt(N)} ${g.dU}.` },
    ], `Write ${g.r} ${g.aU} in ${g.dU}, then compare with 1 ${g.dU}.`),
  };
};
const rateOrFactor: Gen = (R, n) => {
  const g = pick(R, RATES), N = legendRatio(g.r, g.dU, g.aU), c = pick(R, PLACES);
  return choiceItem(R, {
    id: `rateOrFactor-${n}`, family: 'rateOrFactor',
    prompt: `A plan of a ${c} says “1 ${g.dU} represents ${g.r} ${g.aU}” (that is the scale 1 : ${fmt(N)}). What does the ${g.r} tell you?`,
    board: `\\cssId{d}{1${T(g.dU)}} \\to \\cssId{a}{${g.r}${T(g.aU)}} \\quad 1 : ${tfmt(N)}`,
    solution: [`${g.r} counts ${g.aU} of the real ${c} per ${g.dU} of plan: ${S('a rate')}.`, `The “times as long” factor is ${fmt(N)}, because ${g.r} ${g.aU} = ${fmt(N)} ${g.dU}.`],
  }, [
    { t: `${g.r} ${g.aU} of the real ${c} for each ${g.dU} of plan`, ok: true, say: `Yes: a rate, with two units. The factor is ${fmt(N)}.` },
    { t: `Real lengths are ${g.r} times as long as on the plan`, ok: false, mc: MC.notConverted, say: `${g.r} has two units, ${g.aU} per ${g.dU}. In one unit the factor is ${fmt(N)}.` },
    { t: `The real ${c} is ${g.r} ${g.aU} long`, ok: false, mc: MC.nAsLength, say: `The legend is about EVERY length: each ${g.dU} of plan stands for ${g.r} ${g.aU}. It is not the ${c}'s length.` },
  ]);
};

// ===== 15 critique-scale-claims =====
const critique: Gen = (R, n) => {
  const v = int(R, 0, 3), nm = pick(R, NAMES), c = pick(R, PLACES), r1 = pick(R, ROOMS);
  if (v === 0) {
    const N = pick(R, [50, 100, 200] as const), d = int(R, 3, 9);
    return choiceItem(R, {
      id: `critique-${n}`, family: 'critique',
      prompt: `A plan of a ${c} is drawn at 1 : ${N}. The ${r1} is ${d} cm long on the plan (${d} × ${N} = ${fmt(d * N)}). ${nm} says: “The scale is 1 : ${N}, so the ${r1} is ${N} cm long.” Which reply is right?`,
      board: `\\text{${nm}: } \\cssId{w}{${N}\\text{ cm}}`,
      solution: [`${N} is the factor, not a length.`, `The ${r1} is ${d} × ${N} = ${S(L(d * N, 'cm'))} long.`],
    }, [
      { t: `${nm} is wrong: ${N} is a factor, so the ${r1} is ${fmt(d * N)} cm.`, ok: true, say: `Yes: the plan length times the factor, ${d} × ${N}.` },
      { t: `${nm} is right: the scale gives the length.`, ok: false, mc: MC.nAsLength, say: `The scale multiplies a plan length. Every room has its own length, and all of them use × ${N}.` },
      { t: `${nm} is wrong: the ${r1} is ${d + N} cm.`, ok: false, mc: MC.additive, say: `${d} + ${N} adds. A scale multiplies: ${d} × ${N}.` },
    ]);
  }
  if (v === 1) {
    const g = pick(R, RATES.filter(x => x.dU === 'in')), N = legendRatio(g.r, g.dU, g.aU);
    return choiceItem(R, {
      id: `critique-${n}`, family: 'critique',
      prompt: `A plan of a ${c} says “1 in represents ${g.r} ${g.aU}” (${g.r} ${g.aU} = ${N} in). ${nm} says: “So real lengths are ${g.r} times as long as on the plan.” Which reply is right?`,
      board: `\\text{${nm}: } \\cssId{w}{\\times ${g.r}}`,
      solution: [`${g.r} is ${g.aU} per inch: a rate.`, `In one unit, 1 in stands for ${N} in: real lengths are ${S(`${N} times`)} as long.`],
    }, [
      { t: `${nm} is wrong: 1 in stands for ${N} in, so ${N} times as long.`, ok: true, say: `Yes: the rate ${g.r} ${g.aU} per inch is the factor ${N}.` },
      { t: `${nm} is right: the legend says ${g.r}.`, ok: false, mc: MC.notConverted, say: `${g.r} counts ${g.aU === 'ft' ? 'feet' : 'yards'}, the plan counts inches. In one unit it is ${N}.` },
      { t: `${nm} is wrong: real lengths are 1/${g.r} as long.`, ok: false, mc: MC.reverse, say: `The real ${c} is the big one. And ${g.r} still needs converting: ${N} times.` },
    ]);
  }
  if (v === 2) {
    const N = pick(R, [20, 50, 100] as const), a = int(R, 3, 9), b = int(R, 2, a - 1), r2 = pick(R, ROOMS.filter(x => x !== r1));
    return choiceItem(R, {
      id: `critique-${n}`, family: 'critique',
      prompt: `On a 1 : ${N} plan, the ${r1} is ${a} cm long and the ${r2} is ${b} cm long (${a * N} cm and ${b * N} cm in reality). ${nm} says: “The lengths are different, so the plan uses two different scales.” Which reply is right?`,
      board: `${dT(a, 'cm')} \\quad ${dT(b, 'cm')} \\quad 1 : ${N}`,
      solution: [`One scale, many lengths: every plan length is multiplied by ${N}.`, `${a} × ${N} = ${a * N} and ${b} × ${N} = ${b * N}: ${S('the same scale')}.`],
    }, [
      { t: `${nm} is wrong: one scale, × ${N}, gives ${a * N} cm and ${b * N} cm.`, ok: true, say: `Yes: different lengths, the same factor.` },
      { t: `${nm} is right: a longer room needs a bigger scale.`, ok: false, mc: MC.segments, say: `The scale is the factor, and one factor works for every length: ${a * N} ÷ ${a} = ${b * N} ÷ ${b} = ${N}.` },
      { t: `${nm} is wrong: both rooms are ${N} cm long.`, ok: false, mc: MC.nAsLength, say: `${N} is the factor, not a length. The rooms are ${a * N} cm and ${b * N} cm.` },
    ]);
  }
  const N = pick(R, [50, 100, 200] as const), wrongN = Math.round(N / 2.54);
  return choiceItem(R, {
    id: `critique-${n}`, family: 'critique',
    prompt: `A plan of a ${c} is drawn at 1 : ${N} in centimeters. ${nm} measures it in inches and says: “In inches, the scale is 1 : ${wrongN}.” Which reply is right?`,
    board: `\\text{${nm}: } \\cssId{w}{1 : ${wrongN}}`,
    solution: [`1 : ${N} means actual lengths are ${N} times as long.`, `Measured in inches, they are still ${N} times as long: ${S(`still 1 : ${N}`)}.`],
  }, [
    { t: `${nm} is wrong: in any one unit it stays 1 : ${N}.`, ok: true, say: `Yes: both lengths change unit together, so the factor stays ${N}.` },
    { t: `${nm} is right: ${N} cm is about ${wrongN} in.`, ok: false, mc: MC.unitChange, say: `That changes only the actual part. The drawing part is in inches too, so it is still 1 : ${N}.` },
    { t: `${nm} is wrong: a 1 : ${N} plan can't be measured in inches.`, ok: false, mc: MC.cmOnly, say: `It can: 1 in on the plan stands for ${N} in.` },
  ]);
};

export const GENERATORS: Record<FamilyId, Gen> = {
  match, pairUp, timesAs, timesSay, toScale, scaleCheck, sameUnit: sameUnitF, convertFirst, readScale, whichPart, writeScale,
  legendMeaning, legendWrite, legendToRatio, ratioToLegend, whatIsN, useFactor, unitSwap, direction, enlarge, compareScales,
  rateFactor, rateOrFactor, critique,
};
void factor;
