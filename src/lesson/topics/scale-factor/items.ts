// items.ts: practice families for "enlarge and reduce with a scale factor" (grade 7, 7.G.A.1). Each family is one deep
// structure; a generator receives the sub-goal id and uses that sub-goal's number ranges (topic JSON `cases`).
// Every wrong answer the classifier recognises carries its misconception id (math-curriculum-essentials).
// Pure: no DOM, no canvas. Pictures are ScaleGrid pictures (scaleMaths.ts) and are only made when they fit the
// practice frame (fitsIn); PROBES records typical wrong responses per item and the id they must get (tests).
import { type Q, qEq, qMul, qNum, qTex, rat, toQ } from '../../../core/math';
import { frame } from '../../../blocks/block';
import { type Gen, type Item, type Response, type Verdict, A, B, S, fr, int, mixed, pick, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import {
  type Lab, type Pic, type PicFig, type V, ell, extent, fitsIn, flip, home, layoutPic, move, para, picMaths, rect, scale,
  sides, sss, stretch, tee, turn, yoo, angleAt,
} from './scaleMaths';

export type FamilyId = 'whichCopy' | 'scaledOrNot' | 'partner' | 'nameK' | 'predict' | 'angle' | 'computeSide' | 'bothSides'
  | 'readSeg' | 'drawNext' | 'pickDrawing' | 'reduce' | 'nonInt' | 'slant' | 'findK' | 'missing' | 'reverse' | 'refute'
  | 'allRatios' | 'angleCheck' | 'resize' | 'fixIt';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  whichCopy: 'Which one is scaled?',
  scaledOrNot: 'Scaled or stretched?',
  partner: 'Matching parts',
  nameK: 'Name the scale factor',
  predict: 'Bigger or smaller?',
  angle: 'What happens to the angles',
  computeSide: 'Scale a side',
  bothSides: 'Width and height of the copy',
  readSeg: 'Count on the grid',
  drawNext: 'Draw the copy on the grid',
  pickDrawing: 'Check the drawing',
  reduce: 'Make it smaller',
  nonInt: 'Fraction and decimal factors',
  slant: 'Slanted sides',
  findK: 'Find the factor',
  missing: 'The missing side',
  reverse: 'Back to the original',
  refute: 'One side breaks it',
  allRatios: 'Test every pair',
  angleCheck: 'Sides are not enough',
  resize: 'Real resizes',
  fixIt: 'Fix the resize',
};

/** the picture of an item: what is hidden at the start, and what the worked solution shows after a miss */
export interface ItemPic { pic: Pic; hide?: string[]; solve: { show?: string[]; hide?: string[]; ring?: number; tex: string } }
export interface ScaleItem extends Item { family: FamilyId; pict?: ItemPic }

/** the practice model frame (the board is narrower in practice) */
export const PF = frame(60, 70, 1180, 940);

/** wrong responses with the misconception they must be classified as (tests) */
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, r: Response, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r, mc }); PROBES.set(it, l); };

// ---------- numbers ----------
const MC = {
  addNever: 'mc.ratio-rate.addition-never-allowed',
  additive: 'mc.ratio-rate.additive-keep-difference',
  position: 'mc.transformations.matches-parts-by-position-or-letters',
  inverted: 'mc.ratio-rate.scale-factor-inverted',
  difference: 'mc.mul-div.factor-reported-as-difference',
  mulBigger: 'mc.mul-div.multiplication-makes-bigger',
  oneWay: 'mc.ratio-rate.scale-always-one-direction',
  armLength: 'mc.angles.angle-size-from-arm-length',
  scalesAngles: 'mc.transformations.scales-angles',
  someSides: 'mc.transformations.scales-only-some-sides',
  diffFactors: 'mc.transformations.different-scale-factors-for-different-sides',
  points: 'mc.count.counts-points-not-intervals',
  labelsOver: 'mc.transformations.labels-over-drawn-lengths',
  rounds: 'mc.ratio-rate.whole-number-rates-factors-only',
  decimal: 'mc.decimals.product-decimal-scale-not-preserved',
  partByPart: 'mc.fraction-ops.mixed-numbers-multiplied-part-by-part',
  reversed: 'mc.transformations.scale-factor-direction-reversed',
  oneStep: 'mc.transformations.scales-one-step-of-slanted-side',
  largerOver: 'mc.ratio-rate.scale-factor-larger-over-smaller',
  wrongOp: 'mc.ratio-rate.scale-factor-wrong-operation',
  bySub: 'mc.ratio-rate.reverse-factor-by-subtraction',
  exception: 'mc.reasoning-language.counterexample-as-exception',
  forms: 'mc.fractions-concept.different-forms-different-numbers',
  oneRatio: 'mc.transformations.checks-one-side-ratio',
  ratiosEnough: 'mc.transformations.equal-ratios-make-polygons-similar',
  looks: 'mc.transformations.similarity-judged-by-appearance',
} as const;
export { MC };

/** a scale factor: an exact fraction, shown as a fraction (3/2) or as a decimal (1.5) */
export interface K { q: Q; dec?: string }
const kq = (p: number, q = 1, dec?: string): K => ({ q: rat(p, q), dec });
export const kTex = (k: K) => k.dec ?? (k.q.q === 1 ? String(k.q.p) : `\\tfrac{${k.q.p}}{${k.q.q}}`);
export const kHtml = (k: K) => k.dec ?? (k.q.q === 1 ? String(k.q.p) : fr(k.q.p, k.q.q));
const kN = (k: K) => qNum(k.q);
const Qn = (x: number): Q => toQ(x, 1000)!;
/** TeX of a length: 12, 7\tfrac{1}{2} */
const qT = (q: Q) => qTex(q);
/** HTML of a length: 12, 7 1/2 */
const qH = (q: Q) => (q.q === 1 ? String(q.p) : mixed(q.p, q.q));
const nT = (x: number) => qT(Qn(x));
const nH = (x: number) => qH(Qn(x));

/** the value of a response as an exact fraction; a decimal typed in the whole-number box (7.5) counts too */
export function valueOf(r: Response): Q | null {
  if (r.kind === 'num') return Number.isFinite(r.v) && r.v >= 0 ? toQ(r.v, 1000) : null;
  if (r.kind === 'frac') {
    const { w, n, d } = r;
    if (![w, n, d].every(Number.isFinite) || d <= 0 || w < 0 || n < 0) return null;
    if ([w, n, d].every(Number.isInteger)) return rat(w * d + n, d);
    return toQ(w + n / d, 1000);
  }
  return null;
}
/** a response that has the value q (for answers and probes): whole numbers in the num box, else a mixed number */
function respOf(q: Q, input: 'num' | 'frac'): Response {
  if (input === 'num') return { kind: 'num', v: qNum(q) };
  const w = Math.floor(q.p / q.q), r = q.p % q.q;
  return r === 0 ? { kind: 'frac', w, n: 0, d: 1 } : { kind: 'frac', w, n: r, d: q.q };
}

interface Wrong { v: Q | null; mc?: string; say: string }
interface Base { id: string; family: FamilyId; prompt: string; board: string; solution: string[]; pict?: ItemPic; unit?: string }
/** a number answer (whole, fraction, mixed or decimal): any equal value is right */
function numItem(b: Base, ans: Q, okSay: string, wrongs: Wrong[], fallback: string, force?: 'frac'): ScaleItem {
  const input: 'num' | 'frac' = force ?? (ans.q === 1 ? 'num' : 'frac');
  const it: ScaleItem = {
    ...b, input, answer: respOf(ans, input),
    check(r: Response): Verdict {
      const v = valueOf(r);
      if (!v) return { ok: false, say: 'Type a number: a whole number, a fraction or a mixed number.' };
      if (qEq(v, ans)) return { ok: true, say: okSay };
      for (const w of wrongs) if (w.v && qEq(v, w.v)) return { ok: false, mc: w.mc, say: w.say };
      return { ok: false, say: fallback };
    },
  };
  const seen: Q[] = [ans];
  for (const w of wrongs) {
    if (!w.v || seen.some(s => qEq(s, w.v!))) continue;
    seen.push(w.v);
    if (w.mc) probe(it, respOf(w.v, input === 'num' && w.v.q !== 1 ? 'frac' : input), w.mc);
  }
  return it;
}
interface Choice { t: string; ok?: boolean; mc?: string; say: string }
function choiceItem(b: Base, R: () => number, cs: Choice[], keepOrder = false): ScaleItem {
  const order = keepOrder ? cs : shuffle(R, [...cs]);
  const right = order.findIndex(c => c.ok);
  const it: ScaleItem = {
    ...b, solution: endOnChoice(b.solution, order[right]!.t), input: 'choice', choices: order.map(c => c.t), answer: { kind: 'choice', i: right },
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !order[r.i]) return { ok: false, say: 'Pick one answer.' };
      const c = order[r.i]!;
      return { ok: !!c.ok, mc: c.ok ? undefined : c.mc, say: c.say };
    },
  };
  order.forEach((c, i) => { if (!c.ok && c.mc) probe(it, { kind: 'choice', i }, c.mc); });
  return it;
}
interface PairWrong { v: [number, number]; mc?: string; say: string }
function pairItem(b: Base, ans: [number, number], lead: string, op: string, okSay: string, wrongs: PairWrong[], fallback: string): ScaleItem {
  const it: ScaleItem = {
    ...b, input: 'pair', pairLead: lead, pairOp: op, answer: { kind: 'pair', x: ans[0], y: ans[1] },
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes.' };
      const eq = (a: number, c: number) => Math.abs(a - c) < 1e-9;
      if (eq(r.x, ans[0]) && eq(r.y, ans[1])) return { ok: true, say: okSay };
      for (const w of wrongs) if (eq(r.x, w.v[0]) && eq(r.y, w.v[1])) return { ok: false, mc: w.mc, say: w.say };
      return { ok: false, say: fallback };
    },
  };
  for (const w of wrongs) if (w.mc && !(w.v[0] === ans[0] && w.v[1] === ans[1])) probe(it, { kind: 'pair', x: w.v[0], y: w.v[1] }, w.mc);
  return it;
}

/** make until the picture fits the practice frame (layout rules + honest maths) */
function fit<T extends { pict?: ItemPic }>(make: () => T | null, tries = 160): T {
  let last: T | null = null;
  for (let i = 0; i < tries; i++) {
    const t = make();
    if (!t) continue;
    last = t;
    if (!t.pict || fitsIn(t.pict.pic, PF)) return t;
  }
  const p = last?.pict?.pic;
  throw new Error(`scale-factor: no picture fits (${p ? layoutPic(p, PF).why ?? picMaths(p) : 'no candidate'})`);
}

// ---------- picture builders ----------
/** shapes in a row, bottom-aligned: mx / my units of margin, gap units between, extra rows on top (for a hop) */
function row(shapes: readonly (readonly V[])[], gap: number, mx: number, my: number, top = 0) {
  let x = mx; const placed: V[][] = []; let hmax = 0;
  for (const s of shapes) { const h0 = home(s), e = extent(h0); placed.push(move(h0, x, my)); x += e.w + gap; hmax = Math.max(hmax, e.h); }
  return { placed, cols: x - gap + mx, rows: hmax + 2 * my + top };
}
/** four shapes in two rows (reading order), each bottom-aligned in its cell */
function quad(shapes: readonly (readonly V[])[], gap: number, mx: number, my: number, gy = gap) {
  const H = shapes.map(s => extent(home(s)));
  const cw = Math.max(...H.map(e => e.w)), r0 = Math.max(H[0]!.h, H[1]!.h), r1 = Math.max(H[2]!.h, H[3]!.h);
  const placed = shapes.map((s, i) => {
    const e = H[i]!, col = i % 2, top = i < 2;
    return move(home(s), mx + col * (cw + gap) + Math.floor((cw - e.w) / 2), top ? my + r1 + gy : my);
  });
  return { placed, cols: 2 * mx + 2 * cw + gap, rows: 2 * my + r0 + r1 + gy };
}
const topMid = (P: readonly V[]): V => { const xs = P.map(p => p[0]), ys = P.map(p => p[1]); return [(Math.min(...xs) + Math.max(...xs)) / 2, Math.max(...ys)]; };
/** a copy of a rectangle shows its height on the RIGHT (away from the original): side 3 -> side 1 */
const copySide = (P: readonly V[]) => (j: number) => (P.length === 4 && j === 3 ? 1 : j);
/** labels of a rectangle: bottom (width) and the left or right side (height) */
const rectLabels = (w: Lab | null, h: Lab | null, hSide: 'left' | 'right'): (Lab | null)[] => (hSide === 'left' ? [w, null, null, h] : [w, h, null, null]);
const q1 = (x: number) => String(x);
/** the solution steps for "every length x k" */
const kLine = (k: K) => `Scale factor ${S(kHtml(k))}: every length of the copy is ${S(kHtml(k))} × the matching length of the original.`;

// ---------- contexts ----------
/** "An" before a vowel sound (an app icon, an 8 in. photo, an 11 in. poster), else "A" */
const An = (next: string | number) => (/^(8|11|18)(?!\d)|^8\d(?!\d)|^[aeiou]/i.test(String(next)) ? 'An' : 'A');
const THINGS = ['logo', 'sticker', 'badge design', 'app icon', 'floor plan', 'banner', 'tile pattern', 'stencil'];
const PHOTOS = [
  { what: 'photo', copy: 'print', verb: 'printed' },
  { what: 'poster', copy: 'big poster', verb: 'enlarged' },
  { what: 'screenshot', copy: 'slide image', verb: 'resized' },
  { what: 'drawing', copy: 'copy', verb: 'copied' },
];

// ===== 1. scaled-vs-distorted =====
const whichCopy: Gen = (R, n) => fit(() => {
  const isL = R() < 0.5;
  const k = pick(R, [2, 2, 3]);
  const mx = k === 3 ? 2 : 3;
  let S0: V[]; let d1: V[]; let d1mc: string; let d1say: string;
  if (isL) {
    const w = int(R, 2, mx), h = int(R, 2, mx);
    S0 = ell(w, h, 1, 1);
    d1 = ell(k * w, k * h, 1, 1);
    d1mc = MC.someSides; d1say = `The outside is ×${k}, but the arms are still 1 square thick. Every length has to be ×${k}, the arms too.`;
  } else {
    let w = 1, h = 1;
    while (w === h) { w = int(R, 1, mx); h = int(R, 1, mx); }
    S0 = rect(w, h);
    const add = (k - 1) * w;
    d1 = rect(w + add, h + add);
    d1mc = MC.additive; d1say = `That one has ${add} added to every side: ${w} → ${w + add} and ${h} → ${h + add}. Adding the same amount stretches the shape; a scaled copy multiplies.`;
  }
  const one = R() < 0.5;
  const d2 = one ? stretch(S0, k, 1) : stretch(S0, 1, k);
  const d2say = `That one is stretched ${one ? 'sideways' : 'upward'} only: the ${one ? 'widths' : 'heights'} are ×${k}, the ${one ? 'heights' : 'widths'} are not.`;
  const cands = shuffle(R, [{ s: scale(S0, k), ok: true }, { s: d1, mc: d1mc, say: d1say }, { s: d2, mc: MC.someSides, say: d2say }]);
  const ar = quad([S0, ...cands.map(c => c.s)], 2, 1, 1, 2);
  const names = ['A', 'B', 'C'];
  const right = cands.findIndex(c => c.ok);
  const figs: PicFig[] = [
    { pts: ar.placed[0]!, role: 'first', caption: 'original' },
    ...cands.map((c, i) => ({ pts: ar.placed[i + 1]!, role: 'second' as const, caption: names[i]!, of: c.ok ? { fig: 0, k } : undefined })),
  ];
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs };
  return choiceItem({
    id: `whichCopy-${n}`, family: 'whichCopy',
    prompt: `Count the squares. Which one is a ${B('scaled copy')} of the ${A('original')}?`,
    board: '\\text{which is scaled?}',
    solution: [`Copy ${names[right]}: every length of the original is ×${k}, the ${isL ? 'arms' : 'width and the height'} too.`, 'The other two change some lengths more than others, so the shape changes.'],
    pict: { pic, solve: { ring: right + 1, tex: `\\text{${names[right]}: every length} \\times ${k}` } },
  }, R, names.map((t, i) => {
    const c = cands[i]!;
    return c.ok ? { t, ok: true, say: `Yes: ${t} has every length ×${k}.` } : { t, mc: c.mc, say: c.say! };
  }), true);
});

const scaledOrNot: Gen = (R, n) => fit(() => {
  const kind = pick(R, ['scaled', 'scaled', 'stretch', 'plus', 'plus', 'square'] as const);
  const k = pick(R, [2, 3]);
  let O: V[], C: V[], ol: (Lab | null)[], cl: (Lab | null)[];
  const isL = kind !== 'plus' && kind !== 'square' && R() < 0.4;
  let w = int(R, 1, k === 3 ? 3 : 4), h = int(R, 1, k === 3 ? 3 : 4);
  if (kind === 'plus' || kind === 'scaled') while (w === h) h = int(R, 1, k === 3 ? 3 : 4);
  if (isL) { w = Math.max(w, 2); h = Math.max(h, 2); }
  const add = (k - 1) * Math.min(w, h);
  if (kind === 'square') { h = w; }
  O = isL ? ell(w, h, 1, 1) : rect(w, h);
  if (kind === 'scaled' || kind === 'square') C = scale(O, k);
  else if (kind === 'stretch') C = R() < 0.5 ? stretch(O, k, 1) : stretch(O, 1, k);
  else C = rect(w + add, h + add);
  const cw = extent(C).w, ch = extent(C).h;
  if (isL) { ol = [q1(w), null, null, null, null, q1(h)]; cl = [q1(cw), null, null, null, null, q1(ch)]; }
  else { ol = rectLabels(q1(w), q1(h), 'left'); cl = rectLabels(q1(cw), q1(ch), 'right'); }
  const ar = row([O, C], 2, 2, 1);
  const yes = kind === 'scaled' || kind === 'square';
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: ol },
    { pts: ar.placed[1]!, role: 'second', labels: cl, of: yes ? { fig: 0, k } : undefined },
  ] };
  const why = kind === 'square'
    ? `Yes. ${w} → ${k * w} is +${(k - 1) * w}, but it is also ×${k}, and for a square every side is ×${k}: a square is always a scaled copy of a square.`
    : yes ? `Yes: ${w} → ${cw} and ${h} → ${ch}, every length ×${k}.`
      : kind === 'stretch' ? `No: ${cw === w ? `the width stays ${w}` : `the width is ×${cw / w}`}, ${ch === h ? `the height stays ${h}` : `the height is ×${ch / h}`}. One direction is stretched more.`
        : `No: ${add} was added to every side. ${w} → ${cw} is ×${nH(cw / w)} but ${h} → ${ch} is ×${nH(ch / h)}: not the same number.`;
  const noMc = kind === 'square' ? MC.addNever : undefined;
  return choiceItem({
    id: `scaledOrNot-${n}`, family: 'scaledOrNot',
    prompt: `Is the ${B('teal copy')} a scaled copy of the ${A('original')}?`,
    board: `${w} \\to ${cw}, \\quad ${h} \\to ${ch}`,
    solution: [`Width: ${w} → ${cw}. Height: ${h} → ${ch}.`, yes ? `Both are ×${k}: a scaled copy.` : 'Not the same multiplier, so the shape is distorted.'],
    pict: { pic, solve: { tex: yes ? `\\tfrac{${cw}}{${w}} = \\tfrac{${ch}}{${h}} = ${k}` : `\\tfrac{${cw}}{${w}} \\neq \\tfrac{${ch}}{${h}}` } },
  }, R, [
    { t: 'Yes, it is a scaled copy', ok: yes, mc: yes ? undefined : kind === 'plus' ? MC.additive : MC.someSides, say: why },
    { t: 'No, it is distorted', ok: !yes, mc: noMc, say: why },
  ], true);
});

// ===== 2. corresponding-parts =====
const TRIS: V[][] = [[[0, 0], [3, 0], [1, 2]], [[0, 0], [4, 0], [3, 2]], [[0, 0], [3, 0], [0, 2]], [[0, 0], [2, 0], [3, 3]], [[0, 0], [4, 0], [1, 3]], [[0, 0], [3, 0], [3, 1]], [[0, 0], [2, 0], [0, 3]], [[0, 0], [4, 0], [4, 2]]];
const partner: Gen = (R, n) => fit(() => {
  const T0 = pick(R, TRIS);
  const tf = pick(R, ['none', 'turn1', 'turn2', 'turn3', 'flip'] as const);
  const k = pick(R, [2, 2, 1]);
  let C0 = scale(T0, k);
  C0 = tf === 'none' ? C0 : tf === 'flip' ? flip(C0) : turn(C0, Number(tf.slice(4)));
  const names = shuffle(R, ['P', 'Q', 'R']);
  const ON = ['A', 'B', 'C'];
  const ar = row([T0, C0], 3, 2, 1.2);
  // page order: left to right (then bottom to top), the way the slip pairs them
  const rank = (P: readonly V[]) => [0, 1, 2].sort((a, b) => P[a]![0] - P[b]![0] || P[a]![1] - P[b]![1]);
  const ro = rank(ar.placed[0]!), rc = rank(ar.placed[1]!);
  const posOf = (i: number) => rc[ro.indexOf(i)]!;
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs: [
    { pts: ar.placed[0]!, role: 'first', letters: ON },
    { pts: ar.placed[1]!, role: 'second', letters: names, of: { fig: 0, k } },
  ] };
  const mapTxt = ON.map((a, i) => `${a} → ${names[i]}`).join(', ');
  const mapTex = ON.map((a, i) => `${a} \\to ${names[i]}`).join(',\\; ');
  const sideName = (a: string, b: string) => [a, b].sort().join('');
  if (R() < 0.55) {
    const i = int(R, 0, 2), j = (i + 1) % 3;
    const right = sideName(names[i]!, names[j]!);
    const pos = sideName(names[posOf(i)]!, names[posOf(j)]!);
    const lett = sideName('PQR'[i]!, 'PQR'[j]!);
    const all = ['PQ', 'QR', 'PR'];
    return choiceItem({
      id: `partner-${n}`, family: 'partner',
      prompt: `${B('Triangle PQR')} is a scaled copy of ${A('triangle ABC')}: ${mapTxt}. Which side of the copy matches side ${A(ON[i]! + ON[j]!)}?`,
      board: mapTex,
      solution: [`${ON[i]} goes to ${names[i]} and ${ON[j]} goes to ${names[j]}.`, `A side is matched by its endpoints, so ${ON[i]}${ON[j]} matches ${S(right)}, wherever it sits on the page.`],
      pict: { pic, solve: { tex: `${ON[i]}${ON[j]} \\to ${right}`, show: [] } },
    }, R, all.map(t => t === right ? { t, ok: true, say: `Yes: ${ON[i]} → ${names[i]} and ${ON[j]} → ${names[j]}, so ${ON[i]}${ON[j]} matches ${t}.` }
      : { t, mc: t === pos || t === lett ? MC.position : undefined, say: t === pos ? `${t} sits in the same place on the page, but the copy is turned. Match the endpoints: ${ON[i]} → ${names[i]}, ${ON[j]} → ${names[j]}, so ${right}.` : t === lett ? `Letters don't pair up by alphabet here. Follow the matching: ${ON[i]} → ${names[i]}, ${ON[j]} → ${names[j]}, so ${right}.` : `Follow the matching: ${ON[i]} → ${names[i]}, ${ON[j]} → ${names[j]}, so the side is ${right}.` }));
  }
  // which vertex: matched by the shape (the angle and the sides around it), not by the page or the alphabet
  const i = int(R, 0, 2);
  const pos = names[posOf(i)]!, lett = 'PQR'[i]!;
  const pic2: Pic = { ...pic, figs: [{ ...pic.figs[0]!, letters: ON }, { ...pic.figs[1]!, letters: names }] };
  return choiceItem({
    id: `partner-${n}`, family: 'partner',
    prompt: `${B('Triangle PQR')} is a scaled copy of ${A('triangle ABC')}, ${tf === 'none' ? 'not turned' : tf === 'flip' ? 'flipped over' : 'turned'}. Which vertex of the copy matches ${A(ON[i]!)}? Look at the corner's angle and the sides that meet there.`,
    board: `${ON[i]} \\to\\ ?`,
    solution: [`Look at the corner at ${ON[i]}: its angle and the two sides that meet there.`, `The copy has the same corner at ${S(names[i]!)}, even though it is ${tf === 'none' ? 'bigger' : 'turned'}.`],
    pict: { pic: pic2, solve: { tex: `${ON[i]} \\to ${names[i]}` } },
  }, R, ['P', 'Q', 'R'].map(t => t === names[i] ? { t, ok: true, say: `Yes: the corner at ${t} has the same angle and the same sides around it as ${ON[i]}.` }
    : { t, mc: t === pos || t === lett ? MC.position : undefined, say: t === pos ? `${t} is in the same place on the page, but the copy is ${tf === 'none' ? 'not in the same place' : 'turned'}. Match the corner by its shape: ${names[i]}.` : t === lett ? `The letters don't pair up by alphabet. Match the corner by its shape: ${names[i]}.` : `Compare the angles: the corner that matches ${ON[i]} is ${names[i]}.` }), true);
});

// ===== 3. name-scale-factor =====
const nameK: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3, 4, 5, 10]);
  const w = int(R, 1, k >= 5 ? 2 : 4), h = int(R, 1, k >= 5 ? 2 : 4);
  const O = rect(w, h), C = scale(O, k);
  const grid = k <= 3 && R() < 0.7;
  const ar = row([O, C], grid ? 2 : 1.5, 2, 1);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: rectLabels(q1(w), q1(h), 'left') },
    { pts: ar.placed[1]!, role: 'second', labels: rectLabels(q1(k * w), q1(k * h), 'right'), of: { fig: 0, k } },
  ] };
  const c = pick(R, THINGS);
  const a = pick(R, [[w, k * w, 'width'], [h, k * h, 'height']] as const);
  return numItem({
    id: `nameK-${n}`, family: 'nameK', unit: '',
    prompt: `${An(c)} ${c} (${A('original')}) is copied into the ${B('teal copy')}. What is the scale factor from the original to the copy? (A whole number goes in the first box.)`,
    board: 'k = \\,?',
    solution: [`Pick a pair: ${a[2]} ${A(a[0])} on the original, ${B(a[1])} on the copy.`, `Scale factor = copy ÷ original = ${a[1]} ÷ ${a[0]} = ${S(String(k))}.`],
    pict: { pic, solve: { tex: `k = ${a[1]} \\div ${a[0]} = ${k}` } },
  }, rat(k), `Yes: every length is ×${k} (${a[1]} ÷ ${a[0]} = ${k}).`, [
    { v: rat(1, k), mc: MC.inverted, say: `That is original ÷ copy. The factor goes FROM the original TO the copy: copy ÷ original = ${a[1]} ÷ ${a[0]} = ${k}.` },
    { v: rat(a[1] - a[0]), mc: MC.difference, say: `${a[1]} − ${a[0]} = ${a[1] - a[0]} is how much longer, not how many times as long. ${a[0]} × ? = ${a[1]}: the factor is ${k}.` },
  ], `Copy ÷ original: ${a[1]} ÷ ${a[0]} = ${k}.`, 'frac');
});

// ===== 4. predict-size-from-factor (and the decimal factors of noninteger-factors) =====
const predict: Gen = (R, n, sg) => {
  const dec = sg === 'noninteger-factors';
  const k = dec ? pick(R, [kq(3, 2, '1.5'), kq(5, 2, '2.5'), kq(3, 4, '0.75'), kq(5, 4, '1.25'), kq(1, 2, '0.5'), kq(9, 10, '0.9'), kq(11, 10, '1.1')])
    : pick(R, [kq(3), kq(3, 2), kq(5, 4), kq(1), kq(3, 4), kq(1, 2), kq(2, 3), kq(7, 8), kq(4, 3)]);
  const c = pick(R, [...THINGS, 'photo', 'map', 'model car', 'poster']);
  const v = kN(k), size = v > 1 ? 0 : v === 1 ? 1 : 2;
  const words = ['larger than the original', 'the same size as the original', 'smaller than the original'];
  const why = v > 1 ? `${kHtml(k)} is more than 1, so every length grows.` : v === 1 ? 'Times 1 keeps every length the same.' : `${kHtml(k)} is less than 1: you get only part of each length, so the copy shrinks.`;
  return choiceItem({
    id: `predict-${n}`, family: 'predict',
    prompt: `${An(c)} ${c} is copied with scale factor ${S(kHtml(k))}. Without working anything out: the copy is…`,
    board: `k = ${kTex(k)}`,
    solution: ['Compare k with 1: more than 1 enlarges, exactly 1 keeps the size, between 0 and 1 reduces.', `For example, a 4-inch side becomes 4 × ${kHtml(k)} = ${nH(4 * v)} inches.`],
  }, R, words.map((t, i) => i === size ? { t, ok: true, say: `Right. ${why}` }
    : { t, mc: i === 0 && v <= 1 ? MC.mulBigger : undefined, say: i === 0 && v <= 1 ? `Multiplying doesn't always make bigger: ${why}` : `Compare ${kHtml(k)} with 1. ${why}` }), true);
};

// ===== 5. angles-preserved =====
function triFromAngles(base: number, a: number, b: number): V[] {
  const ra = (a * Math.PI) / 180, rb = (b * Math.PI) / 180;
  const ac = (base * Math.sin(rb)) / Math.sin(ra + rb);
  return [[0, 0], [base, 0], [ac * Math.cos(ra), ac * Math.sin(ra)]];
}
const angle: Gen = (R, n) => fit(() => {
  let a = 0, b = 0, c = 0;
  do { a = 5 * int(R, 8, 18); b = 5 * int(R, 8, 18); c = 180 - a - b; } while (c < 40 || c > 100);
  const T0 = triFromAngles(int(R, 3, 5), a, b);
  const k = pick(R, [kq(2), kq(3), kq(1, 2)]);
  let C0 = scale(T0, kN(k));
  if (R() < 0.35) C0 = flip(C0);
  const v = int(R, 0, 2), deg = Math.round(angleAt(T0, v));
  const asNum = R() < 0.55;
  const ar = row([T0, C0], 1.5, 1.2, 1);
  const lt = (i: number, t: string) => [0, 1, 2].map(j => (j === i ? t : null));
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: false, figs: [
    { pts: ar.placed[0]!, role: 'first', letters: lt(v, 'A'), angles: [{ at: v, t: `${deg}^\\circ`, col: 'first', right: deg === 90 }] },
    { pts: ar.placed[1]!, role: 'second', letters: lt(v, 'P'), angles: [{ at: v, t: asNum ? '?' : undefined, col: 'second', right: deg === 90 }], of: { fig: 0, k: kN(k) } },
  ] };
  const bigger = kN(k) > 1;
  const base: Base = {
    id: `angle-${n}`, family: 'angle',
    prompt: asNum ? `The ${B('copy')} is the ${A('triangle')} scaled by ${S(kHtml(k))}. Corner P matches corner A. How many degrees is the angle at P?`
      : `The ${B('copy')} is the ${A('triangle')} scaled by ${S(kHtml(k))}. Corner P matches corner A. Compare the two angles.`,
    board: `k = ${kTex(k)}`,
    solution: [`Scaling makes the sides of the corner ${bigger ? 'longer' : 'shorter'}, but the opening stays the same.`, `So the angle at P is ${S(`${deg}°`)}, the same as at A.`],
    pict: { pic, solve: { tex: `\\angle P = \\angle A = ${deg}^\\circ` } },
  };
  if (asNum) return numItem({ ...base, unit: 'degrees' }, rat(deg), `Yes: ${deg}°. Lengths are multiplied, angles stay the same.`, [
    { v: Qn(deg * kN(k)), mc: MC.scalesAngles, say: `Only lengths are multiplied. The corner opens just as wide as before: ${deg}°.` },
  ], `Angles keep their size in a scaled copy: ${deg}°.`);
  return choiceItem(base, R, [
    { t: 'They are the same size', ok: true, say: `Yes: the arms are ${bigger ? 'longer' : 'shorter'}, but the opening is the same, ${deg}°.` },
    { t: `The angle at P is ${bigger ? 'bigger: its sides are longer' : 'smaller: its sides are shorter'}`, mc: MC.armLength, say: `The size of an angle is how wide it opens, not how long its sides are. Both are ${deg}°.` },
    { t: `The angle at P is ${kHtml(k)} times as big`, mc: MC.scalesAngles, say: `Only lengths are multiplied by ${kHtml(k)}. Both angles are ${deg}°.` },
  ]);
});

// ===== 6. compute-lengths-integer =====
interface Shape { pts: V[]; lab: number[]; name: string }
function labelledShape(R: () => number, max: number): Shape {
  const kind = pick(R, ['rect', 'rect', 'L', 'tri'] as const);
  if (kind === 'rect') { const w = int(R, 2, max), h = int(R, 1, max); return { pts: rect(w, h), lab: [0, 3], name: 'rectangle' }; }
  if (kind === 'tri') { const a = int(R, 2, max), b = int(R, 2, max); return { pts: [[0, 0], [a, 0], [0, b]], lab: [0, 2], name: 'right triangle' }; }
  const w = int(R, 3, max), h = int(R, 3, max), a = int(R, 1, w - 2), b = int(R, 1, h - 2);
  return { pts: ell(w, h, a, b), lab: [0, 1, 4, 5], name: 'L-shape' };
}
const computeSide: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3, 4, 5, 10]);
  const sh = labelledShape(R, k >= 5 ? 3 : 6);
  const L = sides(sh.pts).map(x => Math.round(x * 1e6) / 1e6);
  const ask = pick(R, sh.lab), other = sh.lab.find(j => j !== ask)!;
  const C = scale(sh.pts, k);
  const ol = sh.pts.map((_, j) => (sh.lab.includes(j) ? q1(L[j]!) : null));
  const cm = copySide(sh.pts);
  const cl: (Lab | null)[] = sh.pts.map(() => null);
  for (const j of sh.lab) cl[cm(j)] = j === ask ? { t: '?', alt: q1(k * L[j]!) } : q1(k * L[j]!);
  const ar = row([sh.pts, C], 2, 1.5, 1);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: false, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: ol }, { pts: ar.placed[1]!, role: 'second', labels: cl, of: { fig: 0, k } }] };
  const s = L[ask]!, d = k * L[other]! - L[other]!;
  return numItem({
    id: `computeSide-${n}`, family: 'computeSide', unit: 'units',
    prompt: `The ${B('copy')} is the ${A(sh.name)} scaled by ${S(String(k))}. How long is the side marked <b>?</b>`,
    board: `k = ${k}`,
    solution: [kLine(kq(k)), `The matching side of the original is ${A(s)}: ${s} × ${k} = ${S(String(k * s))}.`],
    pict: { pic, solve: { show: [`f1a${cm(ask)}`], tex: `${s} \\times ${k} = ${k * s}` } },
  }, rat(k * s), `Yes: ${s} × ${k} = ${k * s}.`, [
    { v: rat(s), mc: MC.someSides, say: `That is the original's length. In a scaled copy every side is ×${k}, this one too: ${s} × ${k} = ${k * s}.` },
    { v: rat(s + d), mc: MC.additive, say: `${L[other]} → ${k * L[other]!} is ×${k}, not +${d}. So this side is ${s} × ${k} = ${k * s}.` },
    { v: rat(s * (k + 1)), mc: MC.diffFactors, say: `Every side gets the same factor, ${k}: ${s} × ${k} = ${k * s}.` },
    { v: rat(s * (k - 1)), mc: MC.diffFactors, say: `Every side gets the same factor, ${k}: ${s} × ${k} = ${k * s}.` },
  ], `Multiply the matching side by ${k}: ${s} × ${k} = ${k * s}.`);
});
const bothSides: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3, 4, 5, 10]);
  let w = 1, h = 1;
  while (w === h) { w = int(R, 1, k === 10 ? 3 : 8); h = int(R, 1, k === 10 ? 3 : 8); }
  const O = rect(w, h), C = scale(O, k);
  const ar = row([O, C], 2, 1.5, 1);
  const c = pick(R, THINGS);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: false, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: rectLabels(q1(w), q1(h), 'left') },
    { pts: ar.placed[1]!, role: 'second', labels: rectLabels(q1(k * w), q1(k * h), 'right'), of: { fig: 0, k } }] };
  return pairItem({
    id: `bothSides-${n}`, family: 'bothSides',
    prompt: `A rectangular ${c} is ${A(`${w} in.`)} wide and ${A(`${h} in.`)} tall. It is copied with scale factor ${S(String(k))}. How wide and how tall is the copy?`,
    board: `${w} \\times ${h}, \\quad k = ${k}`,
    solution: [kLine(kq(k)), `Width ${w} × ${k} = ${S(String(k * w))} in., height ${h} × ${k} = ${S(String(k * h))} in.`],
    pict: { pic, hide: ['f1', 'f1L'], solve: { show: ['f1', 'f1L'], tex: `${k * w} \\times ${k * h}` } },
  }, [k * w, k * h], 'width', 'in. by', `Yes: ${k * w} in. by ${k * h} in.`, [
    { v: [k * w, h], mc: MC.someSides, say: `The height has to be ×${k} too: ${h} × ${k} = ${k * h}.` },
    { v: [w, k * h], mc: MC.someSides, say: `The width has to be ×${k} too: ${w} × ${k} = ${k * w}.` },
    { v: [w + k, h + k], mc: MC.additive, say: `Scaling multiplies: ${w} × ${k} = ${k * w} and ${h} × ${k} = ${k * h}.` },
    { v: [k * h, k * w], say: `Those are the right numbers in the wrong boxes: width first, ${k * w} by ${k * h}.` },
  ], `Multiply both: ${w} × ${k} = ${k * w}, ${h} × ${k} = ${k * h}.`);
});

// ===== 7. grid-segment-check =====
const readSeg: Gen = (R, n) => fit(() => {
  if (R() < 0.6) {
    const isL = R() < 0.5;
    const w = int(R, 3, 12), h = int(R, 2, 8);
    const P = isL ? ell(w, h, int(R, 1, w - 2), int(R, 1, h - 2)) : rect(w, h);
    const ar = row([P], 0, 1, 1);
    const Pp = ar.placed[0]!;
    const j = int(R, 0, Pp.length - 1), a = Pp[j]!, b = Pp[(j + 1) % Pp.length]!;
    const len = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]));
    const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs: [
      { pts: Pp, role: 'first' },
      { pts: [a, b], role: 'pick', open: true, labels: [{ t: '?', alt: q1(len), col: 'pick' }] }] };
    return numItem({
      id: `readSeg-${n}`, family: 'readSeg', unit: 'units',
      prompt: `How long is the ${'<b style="color:var(--pick)">lavender side</b>'}? Count grid units.`,
      board: '\\text{length} = \\,?',
      solution: ['Count the spaces between grid lines, not the grid lines (or dots) themselves.', `The side spans ${S(String(len))} space${len === 1 ? '' : 's'}.`],
      pict: { pic, solve: { show: ['f1a0'], tex: `\\text{length} = ${len}` } },
    }, rat(len), `Yes: ${len} units.`, [
      { v: rat(len + 1), mc: MC.points, say: `That counts the grid lines, start and end included. Count the spaces between them: ${len}.` },
      { v: rat(len - 1), say: `Count every space from one end to the other: ${len}.` },
    ], `Count the spaces between the grid lines: ${len}.`);
  }
  const dx = int(R, 2, 9), dy = int(R, 2, 6);
  const start: V = [1, dy + 1], mid: V = [1 + dx, dy + 1], end: V = [1 + dx, 1];
  const pic: Pic = { cols: dx + 3, rows: dy + 2.5, grid: true, figs: [
    { pts: [start, mid, end], role: 'pick', open: true, labels: [{ t: '?', alt: q1(dx), col: 'pick' }, { t: '?', alt: q1(dy), col: 'pick' }] }],
  dots: [{ at: start, role: 'pick' }] };
  return pairItem({
    id: `readSeg-${n}`, family: 'readSeg',
    prompt: `The path starts at the dot. How far does it go right, and then how far down? Count grid units.`,
    board: '\\text{right}\\ ?,\\ \\text{down}\\ ?',
    solution: ['Count the spaces between grid lines, not the lines.', `Right ${S(String(dx))}, then down ${S(String(dy))}.`],
    pict: { pic, solve: { show: ['f0a0', 'f0a1'], tex: `\\text{right } ${dx},\\ \\text{down } ${dy}` } },
  }, [dx, dy], 'right', 'then down', `Yes: right ${dx}, down ${dy}.`, [
    { v: [dx + 1, dy + 1], mc: MC.points, say: `That counts grid lines. Count the spaces: right ${dx}, down ${dy}.` },
    { v: [dx + 1, dy], mc: MC.points, say: `The first part counts grid lines. Count spaces: right ${dx}.` },
    { v: [dx, dy + 1], mc: MC.points, say: `The second part counts grid lines. Count spaces: down ${dy}.` },
    { v: [dy, dx], say: `Right first (${dx}), then down (${dy}).` },
  ], `Count the spaces: right ${dx}, then down ${dy}.`);
});

// ===== 8. draw-grid-enlargement =====
function gridShape(R: () => number, k: number): V[] {
  const m = k === 2 ? 4 : 3;
  const kind = pick(R, ['rect', 'L', 'T', 'U'] as const);
  if (kind === 'rect') return rect(int(R, 1, m), int(R, 1, m));
  if (kind === 'L') { const w = int(R, 2, m), h = int(R, 2, m); return ell(w, h, int(R, 1, w - 1), int(R, 1, h - 1)); }
  if (kind === 'T') { const s = 1, w = pick(R, [3]), h = int(R, 2, m); return tee(w, h, s, 1); }
  const w = 3, h = int(R, 2, m); return yoo(w, h, 1, 1);
}
const DIRS = (a: V, b: V) => (b[0] > a[0] ? 'right' : b[0] < a[0] ? 'left' : b[1] > a[1] ? 'up' : 'down');
const drawNext: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 2, 3, 4]);
  const O = gridShape(R, k), C = scale(O, k);
  const m = int(R, 1, O.length - 2);
  const ar = row([O, C], 2, 1, 1);
  const Op = ar.placed[0]!, Cp = ar.placed[1]!;
  const sofar = Cp.slice(0, m + 1);
  const a = Cp[m]!, b = Cp[(m + 1) % Cp.length]!;
  const dir = DIRS(a, b), ux = Math.sign(b[0] - a[0]), uy = Math.sign(b[1] - a[1]);
  const len = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])), ol = len / k;
  const markAt: V = [a[0] + ux * 1.4 + (uy ? 0.8 : 0), a[1] + uy * 1.4 + (ux ? 0.75 : 0)];
  const full: (Lab | null)[] = Cp.map((_, j) => (j === m ? { t: '?', alt: q1(len) } : null));
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs: [
    { pts: Op, role: 'first' },
    { pts: Cp, role: 'second', style: 'dash', labels: full, of: { fig: 0, k } },
    { pts: sofar, role: 'second', open: true }],
  moves: [{ from: a, dx: ux * 0.9, dy: uy * 0.9, role: 'pick', nums: false }],
  dots: [{ at: Cp[0]!, role: 'second' }, { at: Op[0]!, role: 'first' }],
  marks: [{ at: markAt, t: '?', role: 'pick' }] };
  return numItem({
    id: `drawNext-${n}`, family: 'drawNext', unit: 'squares',
    prompt: `You are drawing a copy with scale factor ${S(String(k))}. It started at the dot (the ${A('original')} has the same starting corner) and goes around the same way. Next it goes <b>${dir}</b>. How many squares?`,
    board: `k = ${k}`,
    solution: [`Find the matching side of the original: it is ${A(String(ol))} square${ol === 1 ? '' : 's'} long.`, `${ol} × ${k} = ${S(String(len))} square${len === 1 ? '' : 's'} ${dir}.`],
    pict: { pic, hide: ['f1', 'f1L'], solve: { show: ['f1', 'f1L', 'f1a' + m], hide: ['k0', 'm0'], tex: `${ol} \\times ${k} = ${len}` } },
  }, rat(len), `Yes: ${ol} × ${k} = ${len} squares ${dir}.`, [
    { v: rat(ol), mc: MC.someSides, say: `That is the original side. In the copy it is ×${k}: ${ol} × ${k} = ${len}.` },
    { v: rat(ol + k), mc: MC.additive, say: `Scaling multiplies: ${ol} × ${k} = ${len}.` },
    { v: rat(len + 1), mc: MC.points, say: `Count spaces, not grid lines: ${ol} × ${k} = ${len}.` },
  ], `The matching side of the original is ${ol}: ${ol} × ${k} = ${len}.`);
});
const pickDrawing: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 2, 3]);
  const isL = R() < 0.4;
  const w = int(R, 2, k === 3 ? 2 : 4), h = int(R, isL ? 2 : 1, k === 3 ? 2 : 3);
  const O = isL ? ell(w, h, 1, 1) : rect(w, h);
  const good = scale(O, k);
  const off = R() < 0.5 ? 1 : -1;
  const liar = isL ? ell(k * w, k * h + off, k, k) : rect(k * w, k * h + off);
  const part = isL ? ell(k * w, k * h, 1, 1) : rect(k * w, h);
  const lab = (P: V[], hSide: 'left' | 'right', ww: number, hh: number): (Lab | null)[] => (isL ? P.map((_, j) => (j === 0 ? q1(ww) : j === 5 ? q1(hh) : null)) : rectLabels(q1(ww), q1(hh), hSide));
  const cands = shuffle(R, [
    { s: good, l: lab(good, 'left', k * w, k * h), ok: true, liar: false },
    { s: liar, l: lab(liar, 'left', k * w, k * h), liar: true, mc: MC.labelsOver, say: `Its labels say ${k * w} by ${k * h}, but count the squares: it is ${k * h + off} tall. The drawing has to match the labels.` },
    { s: part, l: lab(part, 'left', k * w, isL ? k * h : h), liar: false, mc: MC.someSides, say: isL ? `Its outside is ×${k}, but the arms are still 1 square thick: they should be ${k}.` : `Its width is ×${k} but its height is still ${h}.` },
  ]);
  const ar = quad([O, ...cands.map(c => c.s)], 3, 2, 1, 3);
  const names = ['A', 'B', 'C'];
  const right = cands.findIndex(c => c.ok);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs: [
    { pts: ar.placed[0]!, role: 'first', caption: 'original', labels: lab(O, 'left', w, h) },
    ...cands.map((c, i) => ({ pts: ar.placed[i + 1]!, role: 'second' as const, caption: names[i]!, labels: c.l, liar: c.liar, of: c.ok ? { fig: 0, k } : undefined }))] };
  return choiceItem({
    id: `pickDrawing-${n}`, family: 'pickDrawing',
    prompt: `Three students drew the ${A('original')} with scale factor ${S(String(k))}. Which drawing is correct?`,
    board: `k = ${k}`,
    solution: [`A correct copy is ${k * w} by ${k * h}${isL ? `, with arms ${k} squares thick` : ''}, and the drawing must really be that size: count the squares.`, `That is drawing ${names[right]}.`],
    pict: { pic, solve: { ring: right + 1, tex: `\\text{${names[right]}: } ${k * w} \\times ${k * h}` } },
  }, R, names.map((t, i) => { const c = cands[i]!; return c.ok ? { t, ok: true, say: `Yes: ${t} has every length ×${k}, on paper and in the labels.` } : { t, mc: c.mc, say: c.say! }; }), true);
});

// ===== 9. reduce-unit-fraction =====
const reduce: Gen = (R, n) => fit(() => {
  const d = pick(R, [2, 2, 3, 4]);
  const onGrid = R() < 0.5;
  const k = kq(1, d);
  let O: V[], labIdx: number[];
  if (onGrid) {
    const mult = (lo: number, hi: number) => d * int(R, lo, hi);
    if (R() < 0.6) { O = rect(mult(1, d === 2 ? 4 : 2), mult(1, d === 2 ? 3 : 2)); labIdx = [0, 3]; }
    else { const w = mult(2, d === 2 ? 4 : 2), h = mult(2, d === 2 ? 3 : 2); O = ell(w, h, d, d); labIdx = [0, 5]; }
  } else {
    if (R() < 0.6) { O = rect(int(R, 3, 11), int(R, 2, 9)); labIdx = [0, 3]; }
    else { const a = int(R, 3, 11), b = int(R, 3, 9); O = [[0, 0], [a, 0], [0, b]]; labIdx = [0, 2]; }
  }
  const L = sides(O).map(x => Math.round(x));
  const ask = pick(R, labIdx), other = labIdx.find(j => j !== ask)!;
  const C = scale(O, 1 / d);
  const ar = row([O, C], onGrid ? 2 : 1.5, 1.5, 1);
  const ans = rat(L[ask]!, d), known = rat(L[other]!, d);
  const ol = O.map((_, j) => (labIdx.includes(j) ? q1(L[j]!) : null));
  const cm = copySide(O);
  const cl: (Lab | null)[] = O.map(() => null);
  cl[cm(ask)] = { t: '?', alt: qT(ans) }; cl[cm(other)] = qT(known);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: onGrid, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: ol }, { pts: ar.placed[1]!, role: 'second', labels: cl, of: { fig: 0, k: 1 / d } }] };
  const s = L[ask]!, diff = L[other]! - qNum(known);
  const wrongs: Wrong[] = [
    { v: rat(s), mc: MC.someSides, say: `That is the original side. Every side of the copy is ×${fr(1, d)}: ${s} × ${fr(1, d)} = ${qH(ans)}.` },
    { v: rat(s * d), mc: MC.reversed, say: `×${fr(1, d)} makes it smaller: it means ÷${d}. ${s} ÷ ${d} = ${qH(ans)}.` },
  ];
  if (diff > 0 && s - diff > 0) wrongs.push({ v: Qn(s - diff), mc: MC.additive, say: `${L[other]} → ${qH(known)} is ×${fr(1, d)}, not −${nH(diff)}. So ${s} × ${fr(1, d)} = ${qH(ans)}.` });
  if (ans.q !== 1) {
    wrongs.push({ v: rat(Math.ceil(qNum(ans))), mc: MC.rounds, say: `A length can be a fraction: ${s} ÷ ${d} = ${qH(ans)} exactly, no rounding.` });
    wrongs.push({ v: rat(Math.floor(qNum(ans))), mc: MC.rounds, say: `A length can be a fraction: ${s} ÷ ${d} = ${qH(ans)} exactly, no rounding.` });
  }
  return numItem({
    id: `reduce-${n}`, family: 'reduce', unit: 'units',
    prompt: `The ${B('copy')} is the ${A('original')} reduced with scale factor ${S(fr(1, d))}. How long is the side marked <b>?</b>`,
    board: `k = \\tfrac{1}{${d}}`,
    solution: [`×${fr(1, d)} means: divide every length by ${d}.`, `${s} × ${fr(1, d)} = ${s} ÷ ${d} = ${S(qH(ans))}.`],
    pict: { pic, solve: { show: [`f1a${cm(ask)}`], tex: `${s} \\times \\tfrac{1}{${d}} = ${qT(ans)}` } },
  }, ans, `Yes: ${s} ÷ ${d} = ${qH(ans)}.`, wrongs.filter(w => w.v && w.v.p > 0), `Divide by ${d}: ${s} ÷ ${d} = ${qH(ans)}.`);
});

// ===== 10. noninteger-factors =====
const nonInt: Gen = (R, n) => fit(() => {
  const k = pick(R, [kq(3, 2), kq(3, 2, '1.5'), kq(3, 4), kq(2, 3), kq(5, 2, '2.5'), kq(3, 4, '0.75')]);
  const den = k.q.q;
  // whole original lengths up to 24, chosen so the results are whole or half units
  const step = den === 2 ? 1 : den === 4 ? 2 : 3;
  const tri = R() < 0.35;
  const a = step * int(R, Math.ceil(2 / step), Math.floor((kN(k) > 1 ? 12 : 20) / step)), b = step * int(R, Math.ceil(2 / step), Math.floor((kN(k) > 1 ? 9 : 16) / step));
  const O: V[] = tri ? [[0, 0], [a, 0], [0, b]] : rect(a, b);
  const labIdx = tri ? [0, 2] : [0, 3];
  const ask = pick(R, labIdx);
  const s = ask === 0 ? a : b;
  const C = scale(O, kN(k));
  const ans = qMul(rat(s), k.q);
  const ar = row([O, C], 2, 1.5, 1);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: false, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: O.map((_, j) => (labIdx.includes(j) ? q1(j === 0 ? a : b) : null)) },
    { pts: ar.placed[1]!, role: 'second', labels: O.map((_, j) => (j === copySide(O)(ask) ? { t: '?', alt: qT(ans) } : null)), of: { fig: 0, k: kN(k) } }] };
  const wrongs: Wrong[] = [{ v: Qn(s / kN(k)), mc: MC.reversed, say: `Dividing by ${kHtml(k)} goes the wrong way. The copy is original × ${kHtml(k)}: ${s} × ${kHtml(k)} = ${qH(ans)}.` }];
  if (k.dec) {
    wrongs.push({ v: Qn(qNum(ans) * 10), mc: MC.decimal, say: `Check the size: ${s} × ${k.dec} must be ${kN(k) > 1 ? 'a bit more' : 'less'} than ${s}. ${s} × ${k.dec} = ${qH(ans)}.` });
    wrongs.push({ v: Qn(qNum(ans) / 10), mc: MC.decimal, say: `Check the size: ${s} × ${k.dec} must be ${kN(k) > 1 ? 'more' : 'a bit less'} than ${s}. ${s} × ${k.dec} = ${qH(ans)}.` });
  }
  if (kN(k) > 1 && !Number.isInteger(kN(k))) {
    const w = Math.floor(kN(k)), part = kN(k) - w;
    wrongs.push({ v: Qn(s * w + part), mc: MC.partByPart, say: `Both parts of ${kHtml(k)} multiply: ${s} × ${w} = ${s * w} and ${s} × ${nH(part)} = ${nH(s * part)}, so ${qH(ans)}.` });
  }
  return numItem({
    id: `nonInt-${n}`, family: 'nonInt', unit: 'in.',
    prompt: `The ${B('copy')} is the ${A('original')} scaled by ${S(kHtml(k))}. The lengths are in inches. How long is the side marked <b>?</b> (A fraction, a mixed number or a decimal is fine.)`,
    board: `k = ${kTex(k)}`,
    solution: [`${kHtml(k)} is ${kN(k) > 1 ? 'more' : 'less'} than 1, so the copy is ${kN(k) > 1 ? 'larger' : 'smaller'}.`, `${s} × ${kHtml(k)} = ${S(qH(ans))} in.${ans.q !== 1 ? ` (= ${qNum(ans)})` : ''}`],
    pict: { pic, solve: { show: [`f1a${copySide(O)(ask)}`], tex: `${s} \\times ${kTex(k)} = ${qT(ans)}` } },
  }, ans, `Yes: ${s} × ${kHtml(k)} = ${qH(ans)}${ans.q !== 1 ? ` (${qNum(ans)})` : ''} in.`, wrongs.filter(w => w.v && w.v.p > 0), `Multiply: ${s} × ${kHtml(k)} = ${qH(ans)}.`);
});

// ===== 11. oblique-sides-on-grid =====
const slant: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 2, 3, 0.5]);
  const half = k === 0.5;
  const m = k === 3 ? 3 : 5;
  // the apex sits above the base (p strictly between 0 and c) and the triangle is not a sliver (q >= 2)
  const c = half ? pick(R, [4, 6]) : int(R, 2, m);
  const p = half ? 2 * int(R, 1, c / 2 - 1) : int(R, 1, c - 1);
  const q = half ? pick(R, [2, 4]) : k === 3 ? 2 : int(R, 2, 3);
  const down = R() < 0.35, fromRight = R() < 0.35;
  let T0: V[] = [[0, 0], [c, 0], [p, down ? -q : q]];
  T0 = home(T0);
  const C0 = scale(T0, k);
  const ar = row(half ? [T0, C0] : [T0, C0], 2, 1, 1);
  const Op = ar.placed[0]!, Cp = ar.placed[1]!;
  const from = fromRight ? 1 : 0;
  const oa = Op[from]!, ob = Op[2]!, ca = Cp[from]!, cb = Cp[2]!;
  const dx = ob[0] - oa[0], dy = ob[1] - oa[1];
  const hName = dx >= 0 ? 'right' : 'left', vName = dy >= 0 ? 'up' : 'down';
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs: [
    { pts: Op, role: 'first' },
    { pts: Cp, role: 'second', style: 'dash', of: { fig: 0, k } },
    { pts: [Cp[0]!, Cp[1]!], role: 'second', open: true }],
  moves: [{ from: oa, dx, dy, role: 'first', vFirst: true }, { from: ca, dx: cb[0] - ca[0], dy: cb[1] - ca[1], role: 'link', vFirst: true }],
  dots: [{ at: ca, role: 'second' }] };
  const X = Math.abs(dx * k), Y = Math.abs(dy * k), ax = Math.abs(dx), ay = Math.abs(dy);
  const kH = half ? fr(1, 2) : String(k);
  return pairItem({
    id: `slant-${n}`, family: 'slant',
    prompt: `On the ${A('original')}, the slanted side from the ${fromRight ? 'right' : 'left'} end of the base goes ${hName} ${ax}, ${vName} ${ay}. The copy (scale factor ${S(kH)}) has its base drawn. From the dot, how far ${hName} and how far ${vName} does its slanted side go?`,
    board: `k = ${half ? '\\tfrac{1}{2}' : k}`,
    solution: ['A slanted side is a move across and a move up or down. Scale BOTH moves.', `${hName} ${ax} × ${kH} = ${S(String(X))}, ${vName} ${ay} × ${kH} = ${S(String(Y))}.`],
    pict: { pic, hide: ['f1', 'm1'], solve: { show: ['f1', 'm1'], tex: `${hName === 'right' ? '\\text{right}' : '\\text{left}'}\\ ${X},\\ ${vName === 'up' ? '\\text{up}' : '\\text{down}'}\\ ${Y}` } },
  }, [X, Y], hName, vName, `Yes: ${hName} ${X}, ${vName} ${Y}. Both moves ×${kH}.`, [
    { v: [X, ay], mc: MC.oneStep, say: `The ${vName} move has to be scaled too: ${ay} × ${kH} = ${Y}.` },
    { v: [ax, Y], mc: MC.oneStep, say: `The ${hName} move has to be scaled too: ${ax} × ${kH} = ${X}.` },
    { v: [ax, ay], mc: MC.someSides, say: `Those are the original's moves. Scale both: ${X} and ${Y}.` },
  ], `Scale both moves: ${ax} × ${kH} = ${X}, ${ay} × ${kH} = ${Y}.`);
});

// ===== 12. find-factor-from-pair =====
const findK: Gen = (R, n) => fit(() => {
  const k = pick(R, [kq(3), kq(4), kq(5), kq(1, 2), kq(1, 3), kq(1, 4), kq(3, 4), kq(2, 3), kq(3, 2), kq(5, 2), kq(4, 3)]);
  const s = k.q.q * int(R, 1, Math.floor(Math.min(12, 24 / Math.max(1, kN(k))) / k.q.q));
  const cp = s * kN(k);
  if (s < 2 || cp < 1 || cp > 24 || s === cp) return null;
  const h = int(R, 2, 6);
  const O = rect(s, h), C = scale(O, kN(k));
  const ar = row([O, C], 2, 1.5, 1);
  const c = pick(R, PHOTOS);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: false, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: rectLabels(q1(s), null, 'left') },
    { pts: ar.placed[1]!, role: 'second', labels: rectLabels(nT(cp), null, 'right'), of: { fig: 0, k: kN(k) } }] };
  const red = cp < s;
  const ans = rat(cp, s);
  return numItem({
    id: `findK-${n}`, family: 'findK', unit: '',
    prompt: `A ${c.what} is ${c.verb}. A side that is ${A(`${s} in.`)} on the original is ${B(`${nH(cp)} in.`)} on the ${c.copy}. What is the scale factor from the original to the ${c.copy}?`,
    board: `${s} \\to ${nT(cp)},\\quad k = \\,?`,
    solution: ['Scale factor = copy ÷ original.', `${nH(cp)} ÷ ${s} = ${fr(cp, s)} = ${S(kHtml(k))}${red ? ': less than 1, a reduction' : ''}.`],
    pict: { pic, solve: { tex: `k = \\tfrac{${cp}}{${s}} = ${kTex(k)}` } },
  }, ans, `Yes: ${cp} ÷ ${s} = ${kHtml(k)}.`, [
    { v: rat(s, cp), mc: red ? MC.largerOver : MC.inverted, say: red ? `That is the bigger length ÷ the smaller one. The copy is smaller, so the factor is less than 1: ${cp} ÷ ${s} = ${kHtml(k)}.` : `That is original ÷ copy. From the original to the copy: ${cp} ÷ ${s} = ${kHtml(k)}.` },
    { v: rat(Math.abs(cp - s)), mc: MC.difference, say: `${Math.abs(cp - s)} is the difference. The factor says how many times: ${cp} ÷ ${s} = ${kHtml(k)}.` },
  ], `Copy ÷ original: ${cp} ÷ ${s} = ${kHtml(k)}.`, 'frac');
});

// ===== 13. missing-side =====
const missing: Gen = (R, n) => fit(() => {
  const k = pick(R, [kq(2), kq(3), kq(4), kq(3, 2), kq(3, 4)]);
  const den = k.q.q;
  const w = (den === 4 ? 4 : den) * int(R, 1, den === 1 ? 4 : 2), h = int(R, 2, 8);
  if (w === h) return null;
  const W = w * kN(k), Hh = qMul(rat(h), k.q);
  const c = pick(R, PHOTOS);
  const O = rect(w, h), C = scale(O, kN(k));
  const ar = row([O, C], 2, 1.5, 1);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: false, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: rectLabels(q1(w), q1(h), 'left'), photo: [w, h] },
    { pts: ar.placed[1]!, role: 'second', labels: rectLabels(q1(W), { t: '?', alt: qT(Hh) }, 'right'), photo: [w, h], of: { fig: 0, k: kN(k) } }] };
  const bigger = kN(k) > 1;
  return numItem({
    id: `missing-${n}`, family: 'missing', unit: 'in.',
    prompt: `A ${c.what} is ${A(`${w} in.`)} wide and ${A(`${h} in.`)} tall. It is ${c.verb} as a scaled copy ${B(`${W} in.`)} wide. How tall is the ${c.copy}?`,
    board: `${w} \\to ${W}, \\quad ${h} \\to\\ ?`,
    solution: [`Find the factor from the widths: ${W} ÷ ${w} = ${S(kHtml(k))}.`, `Use it on the height: ${h} × ${kHtml(k)} = ${S(qH(Hh))} in. Check: the width got ${bigger ? 'longer' : 'shorter'}, so the height must too.`],
    pict: { pic, solve: { show: ['f1a1'], tex: `${h} \\times ${kTex(k)} = ${qT(Hh)}` } },
  }, Hh, `Yes: the factor is ${kHtml(k)}, and ${h} × ${kHtml(k)} = ${qH(Hh)} in.`, [
    { v: rat(h + W - w), mc: MC.additive, say: `The width went ${w} → ${W}: that is ×${kHtml(k)}, not ${W > w ? '+' : '−'}${Math.abs(W - w)}. ${h} × ${kHtml(k)} = ${qH(Hh)}.` },
    { v: Qn((h * w) / W), mc: MC.reversed, say: `That uses ${w} ÷ ${W}, the factor the wrong way round. ${W} ÷ ${w} = ${kHtml(k)}, so ${h} × ${kHtml(k)} = ${qH(Hh)}.` },
    { v: rat(h), mc: MC.someSides, say: `The height changes too: ${h} × ${kHtml(k)} = ${qH(Hh)}.` },
  ].filter(x => x.v.p > 0), `Factor ${W} ÷ ${w} = ${kHtml(k)}; height ${h} × ${kHtml(k)} = ${qH(Hh)}.`);
});

// ===== 14. reverse-factor =====
const reverse: Gen = (R, n) => fit(() => {
  const k = pick(R, [kq(2), kq(3), kq(4), kq(1, 2), kq(1, 3), kq(3, 4), kq(2, 3), kq(3, 2)]);
  const inv = rat(k.q.q, k.q.p);
  // a whole copy length that is a multiple of the reverse factor's denominator
  const c = inv.q * int(R, 1, Math.floor(12 / inv.q));
  const o = qMul(rat(c), inv);
  if (qNum(o) > 16 || c < 2 || qNum(o) < 1 || o.q !== 1) return null;
  const h = int(R, 2, 5) * k.q.q;
  const O = rect(qNum(o), h), C = scale(O, kN(k));
  const ar = row([O, C], 2, 1.5, 1, 2.2);
  const askFactor = R() < 0.4;
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: false, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: rectLabels(askFactor ? qT(o) : { t: '?', alt: qT(o) }, null, 'left') },
    { pts: ar.placed[1]!, role: 'second', labels: rectLabels(q1(c), null, 'right'), of: { fig: 0, k: kN(k) } }],
  hops: askFactor ? [{ from: topMid(ar.placed[1]!), to: topMid(ar.placed[0]!), t: '\\times\\,?' }] : [{ from: topMid(ar.placed[0]!), to: topMid(ar.placed[1]!), t: `\\times ${kTex(k)}` }] };
  const sub = kN(k) < 1 ? rat(k.q.q - k.q.p, k.q.q) : null;
  if (askFactor) {
    return numItem({
      id: `reverse-${n}`, family: 'reverse', unit: '',
      prompt: `The scale factor from the ${A('original')} to the ${B('copy')} is ${S(kHtml(k))}. What scale factor takes the copy back to the original?`,
      board: `k = ${kTex(k)}, \\quad \\text{back} = \\,?`,
      solution: [`Going back undoes ×${kHtml(k)}. The factor back is original ÷ copy = ${qH(o)} ÷ ${c}.`, `That is the reciprocal: ${S(kHtml({ q: inv }))}. (${c} × ${kHtml({ q: inv })} = ${qH(o)}.)`],
      pict: { pic, solve: { tex: `\\times ${kTex({ q: inv })}` } },
    }, inv, `Yes: ×${kHtml({ q: inv })} undoes ×${kHtml(k)}.`, [
      { v: k.q, mc: MC.wrongOp, say: `×${kHtml(k)} again would go further away. To undo it, use the reciprocal: ${kHtml({ q: inv })}.` },
      { v: sub, mc: MC.bySub, say: `Undoing a factor is not 1 − k. Check: ${c} × ${sub ? kHtml({ q: sub }) : ''} is not ${qH(o)}. The reciprocal ${kHtml({ q: inv })} works.` },
    ], `The way back is the reciprocal: ${kHtml({ q: inv })}.`, 'frac');
  }
  return numItem({
    id: `reverse-${n}`, family: 'reverse', unit: 'units',
    prompt: `The ${B('copy')} was made from the ${A('original')} with scale factor ${S(kHtml(k))}. A side of the copy is ${B(String(c))}. How long is the matching side of the original?`,
    board: `k = ${kTex(k)}`,
    solution: [`From the copy back to the original, the factor is the reciprocal: ${kHtml({ q: inv })}.`, `${c} × ${kHtml({ q: inv })} = ${S(qH(o))}. Check: ${qH(o)} × ${kHtml(k)} = ${c}.`],
    pict: { pic, solve: { show: ['f0a0'], tex: `${c} \\times ${kTex({ q: inv })} = ${qT(o)}` } },
  }, o, `Yes: ${c} × ${kHtml({ q: inv })} = ${qH(o)}, and ${qH(o)} × ${kHtml(k)} = ${c}.`, [
    { v: qMul(rat(c), k.q), mc: MC.wrongOp, say: `×${kHtml(k)} goes from the original to the copy. Going back, use ${kHtml({ q: inv })}: ${c} × ${kHtml({ q: inv })} = ${qH(o)}.` },
    { v: sub ? qMul(rat(c), sub) : null, mc: MC.bySub, say: `Undoing ×${kHtml(k)} is not ×(1 − ${kHtml(k)}). Use the reciprocal: ${c} × ${kHtml({ q: inv })} = ${qH(o)}.` },
  ], `Use the reciprocal: ${c} × ${kHtml({ q: inv })} = ${qH(o)}.`);
});

// ===== 15. refute-claimed-factor =====
function triOk(a: number, b: number, c: number): boolean {
  if (a + b <= c + 1 || a + c <= b + 1 || b + c <= a + 1) return false;
  const T = sss(a, b, c);
  return T[2]![1] >= 0.45 * a && T[2]![0] > -0.2 * a && T[2]![0] < 1.2 * a;
}
const refute: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3, 0.5]);
  const who = pick(R, ['Sam', 'Ana', 'Jordan', 'Mei', 'Theo']);
  const half = k === 0.5;
  const tri = R() < 0.65;
  let O: V[], C: V[], L: number[], CL: number[], j: number;
  if (tri) {
    let a = 0, b = 0, c = 0;
    do { a = int(R, 3, 7) * (half ? 2 : 1); b = int(R, 2, 7) * (half ? 2 : 1); c = int(R, 2, 7) * (half ? 2 : 1); } while (!triOk(a, b, c) || a === b || b === c || a === c);
    L = [a, b, c];
    j = int(R, 0, 2);
    const delta = pick(R, [-2, -1, 1, 2]);
    CL = L.map((x, i) => x * k + (i === j ? delta : 0));
    if (!triOk(CL[0]!, CL[1]!, CL[2]!) || CL.some(x => x <= 0)) return null;
    O = sss(a, b, c); C = sss(CL[0]!, CL[1]!, CL[2]!);
  } else {
    let w = 1, h = 1;
    while (w === h) { w = int(R, 2, 6) * (half ? 2 : 1); h = int(R, 2, 5) * (half ? 2 : 1); }
    L = [w, h]; j = int(R, 0, 1);
    const delta = pick(R, [-1, 1, 2]);
    CL = L.map((x, i) => x * k + (i === j ? delta : 0));
    O = rect(w, h); C = rect(CL[0]!, CL[1]!);
  }
  const ar = row([O, C], 2, 1.5, 1);
  const labs = (X: number[]) => (tri ? X.map(q1) : rectLabels(q1(X[0]!), q1(X[1]!), 'left'));
  const cl = tri ? CL.map(q1) : rectLabels(q1(CL[0]!), q1(CL[1]!), 'right');
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: false, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: labs(L) }, { pts: ar.placed[1]!, role: 'second', labels: cl }] };
  const kH = half ? fr(1, 2) : String(k);
  const pairs = L.map((x, i) => `${x} → ${CL[i]}`);
  const none = `None: ${kH === String(k) ? k : '½'} works for most sides, so ${who} is right`;
  return choiceItem({
    id: `refute-${n}`, family: 'refute',
    prompt: `${who} says the ${B('copy')} is the ${A('original')} scaled by ${S(kH)}. Which pair of matching sides proves ${who} wrong?`,
    board: `k = ${half ? '\\tfrac{1}{2}' : k}\\,?`,
    solution: [`Check every pair: ${L.map((x, i) => `${x} × ${kH} = ${x * k}${i === j ? ` (but the copy has ${CL[i]})` : ''}`).join(', ')}.`, `${S(pairs[j]!)} fails, and one failing pair is enough: the claim is wrong.`],
    pict: { pic, solve: { tex: `${L[j]} \\times ${half ? '\\tfrac{1}{2}' : k} = ${L[j]! * k} \\neq ${CL[j]}` } },
  }, R, [
    ...pairs.map((t, i) => (i === j ? { t, ok: true, say: `Yes: ${L[i]} × ${kH} = ${L[i]! * k}, not ${CL[i]}. One pair that fails is a counterexample: the claim is wrong.` }
      : { t, say: `${L[i]} × ${kH} = ${CL[i]}: that pair fits. Look for the pair that does NOT: ${pairs[j]}.` })),
    { t: none, mc: MC.exception, say: `"Most sides" is not enough. A scaled copy needs EVERY side ×${kH}, so one failing pair (${pairs[j]}) proves the claim wrong.` },
  ]);
});

// ===== 16. all-ratios-test =====
const allRatios: Gen = (R, n) => fit(() => {
  const kind = pick(R, ['forms', 'forms', 'plus', 'oneWrong', 'close', 'yesTri', 'yesRect'] as const);
  let O: V[], C: V[], L: number[], CL: number[];
  const tri = kind === 'oneWrong' || kind === 'yesTri';
  if (kind === 'forms') {
    // equal ratios that look different: 6/4 and 9/6
    const [p, q] = pick(R, [[3, 2], [4, 3], [5, 2], [5, 3], [3, 4], [2, 3]] as const);
    const m = int(R, 2, 3), a = q * m, b = q * (m + 1);
    L = [a, b]; CL = [(a * p) / q, (b * p) / q];
  } else if (kind === 'plus') {
    const w = int(R, 2, 6), h = int(R, 2, 6), add = int(R, 2, 4);
    if (w === h) return null;
    L = [w, h]; CL = [w + add, h + add];
  } else if (kind === 'close') {
    const w = int(R, 3, 6), h = int(R, 2, 5);
    L = [w, h]; CL = [2 * w, 2 * h - 1];
  } else if (kind === 'yesRect') {
    const w = int(R, 2, 6), h = int(R, 2, 6), k = pick(R, [2, 3]);
    L = [w, h]; CL = [w * k, h * k];
  } else {
    let a = 0, b = 0, c = 0;
    do { a = int(R, 3, 7); b = int(R, 2, 7); c = int(R, 2, 7); } while (!triOk(a, b, c));
    const k = pick(R, [2, 3]);
    L = [a, b, c]; CL = L.map(x => x * k);
    if (kind === 'oneWrong') { CL[2] = CL[2]! + pick(R, [-1, 1]); if (!triOk(CL[0]!, CL[1]!, CL[2]!)) return null; }
  }
  if (tri) { O = sss(L[0]!, L[1]!, L[2]!); C = sss(CL[0]!, CL[1]!, CL[2]!); } else { O = rect(L[0]!, L[1]!); C = rect(CL[0]!, CL[1]!); }
  const ar = row([O, C], 2, 1.5, 1);
  const angles = tri ? undefined : [{ at: 0, right: true }];
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: false, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: tri ? L.map(nT) : rectLabels(nT(L[0]!), nT(L[1]!), 'left'), angles },
    { pts: ar.placed[1]!, role: 'second', labels: tri ? CL.map(nT) : rectLabels(nT(CL[0]!), nT(CL[1]!), 'right'), angles }] };
  const ratios = L.map((x, i) => rat(Math.round(CL[i]! * 2), x * 2));
  const yes = ratios.every(r => qEq(r, ratios[0]!));
  const rTxt = L.map((x, i) => `${nH(CL[i]!)} ÷ ${x} = ${qH(ratios[i]!)}`).join(', ');
  const noMc = kind === 'forms' ? MC.forms : undefined;
  const yesMc = kind === 'plus' ? MC.additive : kind === 'oneWrong' ? MC.oneRatio : kind === 'close' ? MC.looks : undefined;
  const why = yes ? `Every pair has the same ratio (${rTxt}), so it is a scaled copy${tri ? '' : ': the corners are all right angles'}.` : `The ratios are not all equal (${rTxt}), so it is not a scaled copy.`;
  return choiceItem({
    id: `allRatios-${n}`, family: 'allRatios',
    prompt: `Is the ${B('teal shape')} a scaled copy of the ${A('amber shape')}? Test every pair of matching sides (copy ÷ original).`,
    board: tri ? '\\tfrac{\\text{copy}}{\\text{original}}\\ \\text{for every side}' : '\\text{all corners } 90^\\circ',
    solution: [`The ratios: ${rTxt}.`, yes ? `All equal${kind === 'forms' ? ` (they look different, but ${qH(ratios[0]!)} each time)` : ''}: a scaled copy.` : 'Not all equal: one common multiplier does not exist, so it is not a scaled copy.'],
    pict: { pic, solve: { tex: L.map((x, i) => `\\tfrac{${nT(CL[i]!)}}{${x}}`).join(yes ? ' = ' : ',\\ ') + (yes ? ` = ${qT(ratios[0]!)}` : '') } },
  }, R, [
    { t: 'Yes: every pair has the same ratio', ok: yes, mc: yes ? undefined : yesMc, say: yes ? why : `${why}${kind === 'oneWrong' ? ' Two pairs fit, but every pair has to.' : kind === 'close' ? ' It looks close, but close is not equal.' : ''}` },
    { t: 'No: the ratios are not all equal', ok: !yes, mc: yes ? noMc : undefined, say: yes && kind === 'forms' ? `${rTxt}: different-looking numbers, the same value. ${why}` : why },
  ], true);
});

// ===== 17. side-ratios-not-sufficient =====
const angleCheck: Gen = (R, n) => fit(() => {
  const kind = pick(R, ['rectPara', 'squareRhombus', 'paraPara', 'tri', 'rectPara'] as const);
  const k = pick(R, [2, 3]);
  let O: V[], C: V[], angO: number, angC: number;
  let lab: number[];
  if (kind === 'tri') {
    let a = 0, b = 0, c = 0;
    do { a = int(R, 3, 6); b = int(R, 2, 6); c = int(R, 2, 6); } while (!triOk(a, b, c));
    O = sss(a, b, c); C = scale(O, k); angO = angC = 0; lab = [a, b, c];
  } else {
    const w = int(R, 2, 4), s = kind === 'squareRhombus' ? w : int(R, 2, 3);
    const t = pick(R, [55, 60, 65, 70, 75, 110, 115, 120]);
    if (kind === 'rectPara') { O = para(w, s, 90); C = para(k * w, k * s, t); angO = 90; angC = t; }
    else if (kind === 'squareRhombus') { O = para(w, w, 90); C = para(k * w, k * w, t); angO = 90; angC = t; }
    else { O = para(w, s, t); C = scale(O, k); angO = angC = t; }
    lab = [w, s];
  }
  const ar = row([O, C], 2, 1.5, 1);
  const tri = kind === 'tri';
  const ql = (X: number[], f: number): (Lab | null)[] => (tri ? X.map(x => q1(x * f)) : [q1(X[0]! * f), null, null, q1(X[1]! * f)]);
  const am = (deg: number) => (tri ? undefined : [{ at: 0, right: deg === 90, t: deg === 90 ? undefined : `${deg}^\\circ` }]);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: false, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: ql(lab, 1), angles: am(angO) },
    { pts: ar.placed[1]!, role: 'second', labels: ql(lab, k), angles: am(angC), of: angO === angC ? { fig: 0, k } : undefined }] };
  const yes = angO === angC;
  const name = kind === 'squareRhombus' ? 'square' : kind === 'tri' ? 'triangle' : kind === 'paraPara' ? 'parallelogram' : 'rectangle';
  const why = tri ? `For a triangle, equal side ratios are enough: the three sides fix the angles. Every side is ×${k}, so yes.`
    : yes ? `Every side is ×${k} AND the angles match (${angO}°), so it is a scaled copy.`
      : `Every side is ×${k}, but the corner went from ${angO}° to ${angC}°: the shape is pushed over. A scaled copy keeps every angle.`;
  return choiceItem({
    id: `angleCheck-${n}`, family: 'angleCheck',
    prompt: `Every side of the ${B('teal shape')} is ${k} times the matching side of the ${A(name)}. Is it a scaled copy?`,
    board: tri ? '\\text{3 sides}\\ \\times ' + k : `${angO}^\\circ \\to ${angC}^\\circ`,
    solution: tri ? ['Triangles are special: the three side lengths fix the angles.', 'Equal side ratios: a scaled copy.'] : ['Equal side ratios are not enough for four or more sides: check the angles too.', yes ? `Angles ${angO}° and ${angC}°: the same, so a scaled copy.` : `${angO}° became ${angC}°: not a scaled copy.`],
    pict: { pic, solve: { tex: tri ? `\\text{ratios equal} \\Rightarrow \\text{yes}` : `${angO}^\\circ ${yes ? '=' : '\\neq'} ${angC}^\\circ` } },
  }, R, [
    { t: `Yes: every side is ×${k}`, ok: yes, mc: yes ? undefined : MC.ratiosEnough, say: why },
    { t: 'No: the angles do not match', ok: !yes, mc: undefined, say: tri ? why : yes ? `Look again: both corners are ${angO}°. ${why}` : why },
    { t: "Can't tell from the sides alone", ok: false, say: tri ? why : yes ? why : `The angles are marked: ${angO}° and ${angC}°. ${why}` },
  ], true);
});

// ===== 18. justify-in-context =====
const resize: Gen = (R, n) => fit(() => {
  const kind = pick(R, ['photoNo', 'photoYes', 'poster', 'screen', 'stretched'] as const);
  let w = 0, h = 0, W = 0, H = 0, k = 1;
  if (kind === 'photoNo') { w = pick(R, [3, 4, 5]); h = w + pick(R, [1, 2, 3]); W = 2 * w; H = h + w; }
  else if (kind === 'photoYes') { w = pick(R, [2, 3, 4, 5]); h = w + pick(R, [1, 2, 3]); k = pick(R, [2, 3]); if (k === 3 && h > 5) k = 2; W = k * w; H = k * h; }
  else if (kind === 'poster') { w = pick(R, [6, 8, 9, 12]); h = w + pick(R, [3, 4, 6]); W = w + 6; H = h + 6; }
  else if (kind === 'screen') { w = 2 * int(R, 2, 5); h = 2 * int(R, 2, 4); if (w === h) w += 2; k = 1.5; W = 1.5 * w; H = 1.5 * h; }
  else { w = int(R, 3, 5); h = int(R, 2, 4); k = 2; W = 2 * w; H = h; }
  const yes = kind === 'photoYes' || kind === 'screen';
  const what = kind === 'poster' ? 'poster' : kind === 'screen' ? 'screenshot' : 'photo';
  const O = rect(w, h), C = rect(W, H);
  const ar = row([O, C], 2, 1.5, 1);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: false, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: rectLabels(q1(w), q1(h), 'left'), photo: [w, h] },
    { pts: ar.placed[1]!, role: 'second', labels: rectLabels(nT(W), nT(H), 'right'), photo: [w, h], of: yes ? { fig: 0, k } : undefined }] };
  const story = kind === 'poster' ? `${An(w)} ${A(`${w} in. × ${h} in.`)} poster is made 6 inches wider and 6 inches taller: ${B(`${W} in. × ${H} in.`)}.`
    : kind === 'screen' ? `${An(w)} ${A(`${w} in. × ${h} in.`)} screenshot is resized for a slide to ${B(`${nH(W)} in. × ${nH(H)} in.`)} (scale factor 3/2).`
      : kind === 'stretched' ? `${An(w)} ${A(`${w} in. × ${h} in.`)} photo is dragged wider to ${B(`${W} in. × ${H} in.`)}.`
        : `${An(w)} ${A(`${w} in. × ${h} in.`)} photo is printed at ${B(`${W} in. × ${H} in.`)}.`;
  const fW = qH(rat(Math.round(W * 2), w * 2)), fH = qH(rat(Math.round(H * 2), h * 2));
  const right = yes ? `Yes: both sides are ×${kind === 'screen' ? fr(3, 2) : k} (${nH(W)} ÷ ${w} = ${nH(H)} ÷ ${h})`
    : `No: the width is ×${fW} but the height is ×${fH}`;
  const cs: Choice[] = yes ? [
    { t: right, ok: true, say: `Right. ${nH(W)} ÷ ${w} = ${fW} and ${nH(H)} ÷ ${h} = ${fH}: one factor for every length.` },
    { t: `No: the sides grew by different amounts (${nH(W - w)} and ${nH(H - h)})`, mc: MC.additive, say: `Different amounts added is fine. What matters is the same MULTIPLIER: ${nH(W)} ÷ ${w} = ${nH(H)} ÷ ${h} = ${fW}.` },
    { t: 'No: a bigger copy can never be exactly the same shape', say: `It can: multiply every length by the same number. ${nH(W)} ÷ ${w} = ${nH(H)} ÷ ${h} = ${fW}.` },
  ] : [
    { t: right, ok: true, say: `Right. ${nH(W)} ÷ ${w} = ${fW} but ${nH(H)} ÷ ${h} = ${fH}: not the same, so the picture gets distorted.` },
    { t: kind === 'stretched' ? 'Yes: the width doubled, so the picture is twice as big' : `Yes: both sides grew by the same amount`, mc: kind === 'stretched' ? MC.someSides : MC.additive, say: kind === 'stretched' ? `Only the width doubled; the height stayed ${h}. Every length has to be ×2.` : `Adding the same amount is not multiplying: ${nH(W)} ÷ ${w} = ${fW} but ${nH(H)} ÷ ${h} = ${fH}.` },
    { t: 'Yes: it is still a rectangle, so it looks the same', mc: MC.looks, say: `Looking like a rectangle isn't enough: the factors are ${fW} and ${fH}, not equal. Look at the sun in the picture.` },
  ];
  const fixH = Qn(h * (W / w));
  return choiceItem({
    id: `resize-${n}`, family: 'resize',
    prompt: `${story} Is it a scaled copy? Pick the answer with the right reason.`,
    board: `${w} \\times ${h} \\;\\to\\; ${nT(W)} \\times ${nT(H)}`,
    solution: [`Width: ${nH(W)} ÷ ${w} = ${fW}. Height: ${nH(H)} ÷ ${h} = ${fH}.`, yes ? 'The same factor: a scaled copy.' : `Not the same: to fix it, keep the width ${nH(W)} and make the height ${h} × ${fW} = ${S(qH(fixH))} in.`],
    pict: { pic, solve: { tex: `\\tfrac{${nT(W)}}{${w}} ${yes ? '=' : '\\neq'} \\tfrac{${nT(H)}}{${h}}` } },
  }, R, cs);
});
const fixIt: Gen = (R, n) => fit(() => {
  const k = pick(R, [kq(2), kq(3), kq(3, 2)]);
  const w = k.q.q * int(R, 2, k.q.q === 2 ? 4 : 4), h = int(R, 2, 6);
  if (w === h) return null;
  const W = w * kN(k), bad = h + (W - w), good = qMul(rat(h), k.q);
  if (qNum(good) === bad) return null;
  const c = pick(R, PHOTOS);
  const O = rect(w, h), C = rect(W, bad), G = scale(O, kN(k));
  const ar = row([O, C], 2, 1.5, 1);
  const fixed = move(home(G), ar.placed[1]![0]![0], ar.placed[1]![0]![1]);
  const pic: Pic = { cols: ar.cols, rows: Math.max(ar.rows, extent(G).h + 2), grid: false, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: rectLabels(q1(w), q1(h), 'left'), photo: [w, h] },
    { pts: ar.placed[1]!, role: 'wrong', labels: rectLabels(q1(W), q1(bad), 'right'), photo: [w, h] },
    { pts: fixed, role: 'second', labels: [null, null, null, qT(good)], photo: [w, h], of: { fig: 0, k: kN(k) } }] };
  return numItem({
    id: `fixIt-${n}`, family: 'fixIt', unit: 'in.',
    prompt: `${An(w)} ${A(`${w} in. × ${h} in.`)} ${c.what} was ${c.verb} to ${W} in. × ${bad} in. (red): ${W - w} inches added to each side, so it looks stretched. Keep the width at ${B(`${W} inches`)}. What height makes it a scaled copy?`,
    board: `${w} \\to ${W}, \\quad ${h} \\to\\ ?`,
    solution: [`The width tells the factor: ${W} ÷ ${w} = ${S(kHtml(k))}.`, `So the height must be ${h} × ${kHtml(k)} = ${S(qH(good))} in., not ${bad}.`],
    pict: { pic, hide: ['f2', 'f2L'], solve: { show: ['f2', 'f2L'], tex: `${h} \\times ${kTex(k)} = ${qT(good)}` } },
  }, good, `Yes: ${h} × ${kHtml(k)} = ${qH(good)} in. Now both sides are ×${kHtml(k)}.`, [
    { v: rat(bad), mc: MC.additive, say: `That keeps the +${W - w}, which is what stretched it. The factor is ${W} ÷ ${w} = ${kHtml(k)}: ${h} × ${kHtml(k)} = ${qH(good)}.` },
    { v: rat(h), mc: MC.someSides, say: `The height has to change too: ${h} × ${kHtml(k)} = ${qH(good)}.` },
  ], `Factor ${W} ÷ ${w} = ${kHtml(k)}; height ${h} × ${kHtml(k)} = ${qH(good)}.`);
});

export const GENS: Record<FamilyId, Gen> = {
  whichCopy, scaledOrNot, partner, nameK, predict, angle, computeSide, bothSides, readSeg, drawNext, pickDrawing,
  reduce, nonInt, slant, findK, missing, reverse, refute, allRatios, angleCheck, resize, fixIt,
};
