// items.ts: practice families for "enlarge and reduce shapes informally on grid paper" (grade 7, 7.G.A.1). Each family
// is one deep structure; a generator receives the sub-goal id and uses that sub-goal's number ranges (topic JSON
// `cases`). Every wrong answer the classifier recognises carries its misconception id (math-curriculum-essentials).
// Pure: no DOM, no canvas. Pictures are ScaleGrid pictures (scale-factor/scaleMaths.ts, read-only); walk pictures
// come from walkPic (the copy walked leg by leg). A picture is only kept when it passes the layout and honesty checks
// in the practice frame; PROBES records typical wrong responses per item and the id they must get (tests).
import { qEq, qNum, rat, toQ, type Q } from '../../../core/math';
import { frame } from '../../../blocks/block';
import { type Gen, type Item, type Response, type Verdict, A, B, S, fr, int, pick, shuffle } from '../../runtime/item';
import { type Lab, type Pic, type PicFig, type V, ell, extent, fitsIn, home, move, rect, scale, stretch, tee } from '../scale-factor/scaleMaths';
import { type Move, house, hWord, moveHtml, moveTex, moveWords, rowOf, slanted, stairs, tri, vWord, walkOf, walkPic } from './walkMaths';

export type FamilyId = 'whichScaled' | 'photoFit' | 'matchPart' | 'timesAsLong' | 'countLen' | 'missingDim' | 'oneFactor'
  | 'addOrTimes' | 'addCheck' | 'halfOf' | 'halfReverse' | 'rectWalk' | 'rectCorner' | 'walkNext' | 'walkList'
  | 'slantMove' | 'slantHow' | 'halfWalk' | 'twoFactors' | 'factorPair' | 'notch' | 'notchFix' | 'angleSame'
  | 'rectAngles' | 'repair' | 'resizeJudge';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  whichScaled: 'Same shape, other size',
  photoFit: 'Resized or stretched?',
  matchPart: 'Matching sides and corners',
  timesAsLong: 'How many times as long?',
  countLen: 'Count the spaces',
  missingDim: 'The missing side',
  oneFactor: 'One factor for every length',
  addOrTimes: 'Adding or multiplying?',
  addCheck: 'Does adding work?',
  halfOf: 'Half as long',
  halfReverse: 'Back to the original',
  rectWalk: 'Walk a rectangle',
  rectCorner: 'The far corner',
  walkNext: 'The next move',
  walkList: 'The whole walk',
  slantMove: 'Slanted sides',
  slantHow: 'How to copy a slant',
  halfWalk: 'Walk a half-size copy',
  twoFactors: 'Scaled or stretched?',
  factorPair: 'Across and up factors',
  notch: 'Check every side',
  notchFix: 'Fix the inner side',
  angleSame: 'Compare the corners',
  rectAngles: 'Angles are not enough',
  repair: 'Repair the resize',
  resizeJudge: 'Judge the resize',
};

/** the picture of an item: what is hidden at the start, and what the worked solution shows after a miss */
export interface ItemPic { pic: Pic; hide?: string[]; solve: { show?: string[]; hide?: string[]; ring?: number; tex: string } }
export interface GridItem extends Item { family: FamilyId; pict?: ItemPic }

/** the practice model frame (the board is narrower in practice) */
export const PF = frame(60, 70, 1180, 940);

/** wrong responses with the misconception they must be classified as (tests) */
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, r: Response, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r, mc }); PROBES.set(it, l); };

export const MC = {
  stretchedBig: 'mc.transformations.stretched-copy-is-enlargement',
  looks: 'mc.transformations.similarity-judged-by-appearance',
  position: 'mc.transformations.matches-parts-by-position-or-letters',
  points: 'mc.count.counts-points-not-intervals',
  difference: 'mc.mul-div.factor-reported-as-difference',
  someSides: 'mc.transformations.scales-only-some-sides',
  area: 'mc.area-perimeter.area-scales-by-length-factor',
  additive: 'mc.ratio-rate.additive-keep-difference',
  mulBigger: 'mc.mul-div.multiplication-makes-bigger',
  diagUnit: 'mc.coordinate-geometry.diagonal-square-as-unit-length',
  oneStep: 'mc.transformations.scales-one-step-of-slanted-side',
  reversed: 'mc.transformations.scale-factor-direction-reversed',
  oneRatio: 'mc.transformations.checks-one-side-ratio',
  armLength: 'mc.angles.angle-size-from-arm-length',
  equalAngles: 'mc.transformations.equal-angles-make-polygons-similar',
  addNever: 'mc.ratio-rate.addition-never-allowed',
  scalesAngles: 'mc.transformations.scales-angles',
} as const;

// ---------- answer types ----------
/** the value of a response as an exact fraction (a decimal or a fraction typed counts) */
export function valueOf(r: Response): Q | null {
  if (r.kind === 'num') return Number.isFinite(r.v) && r.v >= 0 ? toQ(r.v, 1000) : null;
  if (r.kind === 'frac') {
    const { w, n, d } = r;
    if (![w, n, d].every(Number.isFinite) || d <= 0 || w < 0 || n < 0) return null;
    return toQ(w + n / d, 1000);
  }
  return null;
}
interface Wrong { v: number; mc?: string; say: string }
interface Base { id: string; family: FamilyId; prompt: string; board: string; solution: string[]; pict?: ItemPic; unit?: string }
function numItem(b: Base, ans: number, okSay: string, wrongs: Wrong[], fallback: string): GridItem {
  const a = toQ(ans, 1000)!;
  const it: GridItem = {
    ...b, input: 'num', answer: { kind: 'num', v: ans },
    check(r: Response): Verdict {
      const v = valueOf(r);
      if (!v) return { ok: false, say: 'Type a number.' };
      if (qEq(v, a)) return { ok: true, say: okSay };
      for (const w of wrongs) { const q = toQ(w.v, 1000); if (q && qEq(v, q)) return { ok: false, mc: w.mc, say: w.say }; }
      return { ok: false, say: fallback };
    },
  };
  const seen = [ans];
  for (const w of wrongs) {
    if (seen.includes(w.v) || !(w.v >= 0)) continue;
    seen.push(w.v);
    if (w.mc) probe(it, { kind: 'num', v: w.v }, w.mc);
  }
  return it;
}
interface Choice { t: string; ok?: boolean; mc?: string; say: string }
function choiceItem(b: Base, R: () => number, cs: Choice[], keepOrder = false): GridItem {
  const order = keepOrder ? cs : shuffle(R, [...cs]);
  const right = order.findIndex(c => c.ok);
  const it: GridItem = {
    ...b, input: 'choice', choices: order.map(c => c.t), answer: { kind: 'choice', i: right },
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
function pairItem(b: Base, ans: [number, number], lead: string, op: string, tail: string, okSay: string, wrongs: PairWrong[], fallback: string): GridItem {
  const it: GridItem = {
    ...b, input: 'pair', pairLead: lead, pairOp: op, pairTail: tail, answer: { kind: 'pair', x: ans[0], y: ans[1] },
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes.' };
      const eq = (a: number, c: number) => Math.abs(a - c) < 1e-9;
      if (eq(r.x, ans[0]) && eq(r.y, ans[1])) return { ok: true, say: okSay };
      for (const w of wrongs) if (eq(r.x, w.v[0]) && eq(r.y, w.v[1])) return { ok: false, mc: w.mc, say: w.say };
      return { ok: false, say: fallback };
    },
  };
  const seen: string[] = [ans.join()];
  for (const w of wrongs) { if (seen.includes(w.v.join())) continue; seen.push(w.v.join()); if (w.mc) probe(it, { kind: 'pair', x: w.v[0], y: w.v[1] }, w.mc); }
  return it;
}

/** keep the picture only when it fits the practice frame (layout rules + honest maths); try a few draws first */
function fit<T extends { pict?: ItemPic }>(make: () => T, tries = 40): T {
  let last: T | null = null;
  for (let i = 0; i < tries; i++) {
    const t = make();
    last = t;
    if (!t.pict || fitsIn(t.pict.pic, PF)) return t;
  }
  delete last!.pict;
  return last!;
}

// ---------- helpers ----------
const kH = (k: number) => (k === 0.5 ? fr(1, 2) : String(k));
const kT = (k: number) => (k === 0.5 ? '\\tfrac{1}{2}' : String(k));
const kSay = (k: number) => (k === 0.5 ? 'half as long' : `${k} times as long`);
const dirOf = (m: Move) => (m.dx ? hWord(m.dx) : vWord(m.dy));
const lenOf = (m: Move) => Math.abs(m.dx) + Math.abs(m.dy);
const q1 = (x: number) => String(x);
/** labels of a rectangle: bottom (width) and the left or right side (height) */
const rectLabels = (w: Lab | null, h: Lab | null, hSide: 'left' | 'right'): (Lab | null)[] => (hSide === 'left' ? [w, null, null, h] : [w, h, null, null]);
/** two shapes side by side on grid paper */
function pair2(O: readonly V[], C: readonly V[], oFig: Partial<PicFig>, cFig: Partial<PicFig>, gap = 2): Pic {
  const ar = rowOf([O, C], gap, 1, 1);
  return { cols: ar.cols, rows: ar.rows, grid: true, figs: [
    { pts: ar.placed[0]!, role: 'first', ...oFig },
    { pts: ar.placed[1]!, role: 'second', ...cFig },
  ] };
}

/**
 * A walk picture for "the next move": the original with side j in focus (its run / rise legs if slanted), the copy
 * walked up to its vertex j (a pen dot there), a '?' where leg j goes; the solve draws leg j and its answer.
 */
function walkItemPic(shape: readonly V[], k: number, j: number, o: { labelAll?: boolean; answer?: string } = {}): ItemPic {
  const S0 = home(shape), e0 = extent(S0);
  const at1: V = [1 + e0.w + 2, 1];
  const cols = at1[0] + e0.w * k + 1, rows = Math.max(e0.h, e0.h * k) + 2;
  const M = walkOf(S0);
  const labels0 = M.map((m, i) => (!slanted(m) && (o.labelAll || i === j) ? q1(lenOf(m)) : null));
  const labels1 = M.map((m, i) => (i === j && !slanted(m) && o.answer ? ({ t: '?', alt: o.answer, altCol: 'link' } as Lab) : null));
  const flags = M.map((_, i) => i === j);
  const w0 = walkPic({ shape: S0, k, at0: [1, 1], at1, cols, rows, labels0, labels1, rr0: flags, rr1: flags, focus0: j });
  const pen: V = w0.P1[j]!;
  const w = j > 0 ? walkPic({ shape: S0, k, at0: [1, 1], at1, cols, rows, labels0, labels1, rr0: flags, rr1: flags, focus0: j, dots: [{ at: pen, role: 'second' }] }) : w0;
  const later = w.legs.filter((_, i) => i >= j).map(f => `f${f}`);
  const rr1 = w.rr1[j] !== null && w.rr1[j] !== undefined ? [`m${w.rr1[j]}`] : [];
  return { pic: w.pic, hide: ['f1', ...later, ...rr1], solve: { show: [`f${w.legs[j]}`, ...rr1, ...(labels1[j] ? [`f1a${j}`] : [])], tex: '' } };
}
/** the whole copy walked out (for a solve): every leg and the wash */
function walkAllPic(shape: readonly V[], k: number, o: { labels0?: (Lab | null)[]; labels1?: (Lab | null)[]; rr?: boolean } = {}): ItemPic {
  const S0 = home(shape), e0 = extent(S0);
  const at1: V = [1 + e0.w + 2, 1];
  const n = S0.length;
  const none = Array.from({ length: n }, () => false);
  const w = walkPic({ shape: S0, k, at0: [1, 1], at1, cols: at1[0] + e0.w * k + 1, rows: Math.max(e0.h, e0.h * k) + 2,
    labels0: o.labels0, labels1: o.labels1, rr0: o.rr ? undefined : none, rr1: o.rr ? undefined : none });
  const legs = w.legs.map(f => `f${f}`);
  return { pic: w.pic, hide: ['f1', 'f1L', ...legs], solve: { show: [...legs, 'f1', 'f1L'], tex: '' } };
}
const withTex = (p: ItemPic, tex: string): ItemPic => ({ ...p, solve: { ...p.solve, tex } });

// ---------- contexts ----------
const ICONS = ['app icon', 'game sprite', 'logo', 'sticker', 'badge', 'stencil', 'map symbol', 'emoji'];

// ===== 1. scaled-vs-distorted-visual =====
function quad(shapes: readonly (readonly V[])[], gap: number, mx: number, my: number) {
  const H = shapes.map(s => extent(home(s)));
  const cw = Math.max(...H.map(e => e.w)), r0 = Math.max(H[0]!.h, H[1]!.h), r1 = Math.max(H[2]!.h, H[3]!.h);
  const placed = shapes.map((s, i) => {
    const e = H[i]!, col = i % 2, top = i < 2;
    return move(home(s), mx + col * (cw + gap) + Math.floor((cw - e.w) / 2), top ? my + r1 + gap + 1 : my);
  });
  return { placed, cols: 2 * mx + 2 * cw + gap, rows: 2 * my + r0 + r1 + gap + 1 };
}
const whichScaled: Gen = (R, n) => fit(() => {
  const kind = pick(R, ['rect', 'rect', 'ell', 'house'] as const);
  const k = pick(R, [2, 2, 3, 0.5]);
  const big = k === 3 ? 2 : 3;
  let S0: V[];
  if (kind === 'rect') {
    let w = 1, h = 1;
    while (w === h) { w = k === 0.5 ? pick(R, [2, 4, 6]) : int(R, 1, big); h = k === 0.5 ? pick(R, [2, 4, 6]) : int(R, 1, big); }
    S0 = rect(w, h);
  } else if (kind === 'ell') {
    S0 = k === 0.5 ? ell(pick(R, [4, 6]), pick(R, [4, 6]), 2, 2) : ell(int(R, 2, big), int(R, 2, big), 1, 1);
  } else {
    S0 = k === 0.5 ? house(4, pick(R, [2, 4]), 2, 2) : k === 3 ? house(2, 1, 1, 1) : house(2, int(R, 1, 3), 1, 1);
  }
  const sx = R() < 0.5;
  const str = sx ? stretch(S0, k, 1) : stretch(S0, 1, k);
  const strSay = `That one is ${k > 1 ? 'stretched' : 'squashed'} ${sx ? 'sideways' : 'up and down'} only: the ${sx ? 'widths' : 'heights'} changed, the ${sx ? 'heights' : 'widths'} did not.`;
  const strMc = k > 1 ? MC.stretchedBig : MC.looks;
  let third: { s: V[]; mc: string; say: string };
  if (kind === 'rect') {
    const e = extent(S0), d = k > 1 ? (k - 1) * e.w : -e.w / 2;
    if (e.h + d > 0 && e.h + d !== e.h * k) third = { s: rect(e.w + d, e.h + d), mc: MC.additive, say: `That one has ${Math.abs(d)} ${d > 0 ? 'added to' : 'taken off'} every side. Adding or taking away the same amount changes the shape.` };
    else third = { s: sx ? stretch(S0, 1, k) : stretch(S0, k, 1), mc: strMc, say: `That one is ${k > 1 ? 'stretched' : 'squashed'} in one direction only.` };
  } else third = { s: sx ? stretch(S0, 1, k) : stretch(S0, k, 1), mc: strMc, say: `That one is ${k > 1 ? 'stretched' : 'squashed'} ${sx ? 'up and down' : 'sideways'} only.` };
  const cands = shuffle(R, [{ s: scale(S0, k), ok: true, mc: '', say: '' }, { s: str, mc: strMc, say: strSay }, { ...third, ok: false }]);
  const ar = quad([S0, ...cands.map(c => c.s)], 2, 1, 1);
  const names = ['A', 'B', 'C'];
  const right = cands.findIndex(c => c.ok);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs: [
    { pts: ar.placed[0]!, role: 'first', caption: 'original' },
    ...cands.map((c, i) => ({ pts: ar.placed[i + 1]!, role: 'second' as const, caption: names[i]!, of: c.ok ? { fig: 0, k } : undefined })),
  ] };
  const what = kind === 'rect' ? 'rectangle' : kind === 'ell' ? 'L-shape' : 'house';
  return choiceItem({
    id: `whichScaled-${n}`, family: 'whichScaled',
    prompt: `Which one is the same shape as the ${A(`${extent(S0).w} by ${extent(S0).h} ${what}`)}, just ${k > 1 ? 'bigger' : 'smaller'}?`,
    board: `\\text{same shape, ${k > 1 ? 'bigger' : 'smaller'}?}`,
    solution: [`Copy ${names[right]}: every length is ${kSay(k)} as in the original, across and up.`, 'The other two change the widths and the heights differently, so the shape changes.'],
    pict: { pic, solve: { ring: right + 1, tex: `\\text{${names[right]}: every length} \\times ${kT(k)}` } },
  }, R, names.map((t, i) => {
    const c = cands[i]!;
    return c.ok ? { t: `Copy ${t}`, ok: true, say: `Yes: every length of ${t} is ${kSay(k)}.` } : { t: `Copy ${t}`, mc: c.mc, say: c.say };
  }), true);
});

const PHOTO_SIZES: [number, number][] = [[3, 2], [2, 3], [4, 3], [3, 4], [2, 1], [1, 2], [4, 2]];
const photoFit: Gen = (R, n) => fit(() => {
  const [w, h] = pick(R, PHOTO_SIZES);
  const k = w * 2 + 2 > 9 ? 2 : pick(R, [2, 2, 3]);
  const across = R() < 0.5;
  const sw = across ? k * w : w, sh = across ? h : k * h;
  const scaledFirst = R() < 0.5;
  const sc = { pts: rect(k * w, k * h), ok: true }, st = { pts: rect(sw, sh), ok: false };
  const [p1, p2] = scaledFirst ? [sc, st] : [st, sc];
  const ar = rowOf([rect(w, h), p1.pts, p2.pts], 1, 1, 1, 0.8);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs: [
    { pts: ar.placed[0]!, role: 'first', photo: [w, h], caption: 'photo' },
    { pts: ar.placed[1]!, role: 'second', photo: [w, h], caption: 'A', of: p1.ok ? { fig: 0, k } : undefined },
    { pts: ar.placed[2]!, role: 'second', photo: [w, h], caption: 'B', of: p2.ok ? { fig: 0, k } : undefined },
  ] };
  const right = scaledFirst ? 'A' : 'B', wrong = scaledFirst ? 'B' : 'A';
  const stSay = `Print ${wrong} was stretched to fit a frame: it is ${across ? `${k} times as wide but just as tall` : `${k} times as tall but just as wide`}. Look at the sun: it turned into an oval.`;
  return choiceItem({
    id: `photoFit-${n}`, family: 'photoFit',
    prompt: `A ${A(`${w} by ${h}`)} photo is printed twice, bigger: print A is ${extent(p1.pts).w} by ${extent(p1.pts).h}, print B is ${extent(p2.pts).w} by ${extent(p2.pts).h}. Which print shows the same picture, just bigger?`,
    board: '\\text{resized or stretched?}',
    solution: [`Print ${right}: ${w} → ${k * w} across and ${h} → ${k * h} up, both ${k} times as long.`, `Print ${wrong}: only one direction grew, so everything in it is stretched.`],
    pict: { pic, solve: { ring: scaledFirst ? 1 : 2, tex: `\\text{${right}: across and up} \\times ${k}` } },
  }, R, [
    { t: `Print ${right}`, ok: true, say: `Yes: print ${right} is ${k} times as long across and up, so nothing in it is stretched.` },
    { t: `Print ${wrong}`, mc: MC.stretchedBig, say: stSay },
    { t: 'Both: they are both bigger', mc: MC.stretchedBig, say: `Bigger is not enough. ${stSay}` },
  ], true);
});

// ===== 2. correspondence =====
const LET0 = ['A', 'B', 'C', 'D', 'E', 'F'], LET1 = ['P', 'Q', 'R', 'S', 'T', 'U'];
const matchPart: Gen = (R, n) => fit(() => {
  const isL = R() < 0.5;
  const S0 = isL ? ell(int(R, 3, 4), int(R, 3, 4), int(R, 1, 2), int(R, 1, 2)) : rect(int(R, 2, 4), int(R, 1, 3));
  const N = S0.length, k = pick(R, [2, 2, 1]);
  const off = int(R, 1, N - 1);
  const L1 = Array.from({ length: N }, (_, i) => LET1[(i + off) % N]!);   // the copy's letter at vertex i
  const ar = rowOf([S0, scale(S0, k)], 2, 1, 1);
  const side = R() < 0.65;
  const i = int(R, 0, N - 1), i2 = (i + 1) % N;
  const figs: PicFig[] = [
    { pts: ar.placed[0]!, role: 'first', letters: LET0.slice(0, N) },
    { pts: ar.placed[1]!, role: 'second', letters: L1, of: { fig: 0, k } },
  ];
  if (side) figs.push({ pts: [ar.placed[0]![i]!, ar.placed[0]![i2]!], role: 'pick', open: true, style: 'line' });
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs };
  const what = k === 1 ? 'a same-size copy' : `a copy ${k} times as big`;
  if (side) {
    const nm = (a: number, b: number, L: string[]) => `${L[a]}${L[b]}`;
    const right = nm(i, i2, L1), byLetter = nm(i, i2, LET1);
    const others = shuffle(R, Array.from({ length: N }, (_, j) => nm(j, (j + 1) % N, L1)).filter(s => s !== right && s !== byLetter)).slice(0, byLetter === right ? 3 : 2);
    const cs: Choice[] = [
      { t: right, ok: true, say: `Yes: ${right} sits in the same place on the copy as ${LET0[i]}${LET0[i2]} on the original.` },
      ...(byLetter !== right ? [{ t: byLetter, mc: MC.position, say: `The letters are in a different order on the copy. Find the side in the same place: ${right}.` }] : []),
      ...others.map(t => ({ t, say: `Find the side in the same place on the copy: the one that runs the same way, in the same part of the shape.` })),
    ];
    return choiceItem({
      id: `matchPart-${n}`, family: 'matchPart',
      prompt: `The ${B('copy')} is ${what}. Which side of the copy matches side ${A(LET0[i]! + LET0[i2]!)}?`,
      board: `\\text{${LET0[i]}${LET0[i2]}} \\to\\ ?`,
      solution: [`Side ${LET0[i]}${LET0[i2]} is in the same place as side ${right}.`, 'Match by place in the shape, not by the letters: the copy is labeled starting at another corner.'],
      pict: { pic, solve: { tex: `\\text{${LET0[i]}${LET0[i2]}} \\to \\text{${right}}` } },
    }, R, cs);
  }
  const right = L1[i]!, byLetter = LET1[i]!;
  const others = shuffle(R, L1.filter(s => s !== right && s !== byLetter)).slice(0, byLetter === right ? 3 : 2);
  return choiceItem({
    id: `matchPart-${n}`, family: 'matchPart',
    prompt: `The ${B('copy')} is ${what}. Which corner of the copy matches corner ${A(LET0[i]!)}?`,
    board: `\\text{${LET0[i]}} \\to\\ ?`,
    solution: [`Corner ${LET0[i]} is in the same place as corner ${right}.`, 'Match by place in the shape, not by the letters.'],
    pict: { pic, solve: { tex: `\\text{${LET0[i]}} \\to \\text{${right}}` } },
  }, R, [
    { t: right, ok: true, say: `Yes: ${right} is in the same place on the copy.` },
    ...(byLetter !== right ? [{ t: byLetter, mc: MC.position, say: `The copy's letters start at a different corner. Find the corner in the same place: ${right}.` }] : []),
    ...others.map(t => ({ t, say: 'Find the corner in the same place on the copy.' })),
  ]);
});

// ===== 3. factor-one-length =====
const timesAsLong: Gen = (R, n) => fit(() => {
  const a = int(R, 1, 6), k = pick(R, [2, 3]);
  const across = R() < 0.6;
  const c = k * a;
  const O: V[] = across ? [[1, 3], [1 + a, 3]] : [[1, 1], [1, 1 + a]];
  const C: V[] = across ? [[1, 1], [1 + c, 1]] : [[3, 1], [3, 1 + c]];
  const pic: Pic = { cols: across ? c + 2 : 5, rows: across ? 4.6 : c + 2, grid: true, figs: [
    { pts: O, role: 'first', open: true, style: 'line', labels: [q1(a)] },
    { pts: C, role: 'second', open: true, style: 'line', labels: [q1(c)] },
  ] };
  return numItem({
    id: `timesAsLong-${n}`, family: 'timesAsLong',
    prompt: `The ${A('original')} ${across ? 'bottom' : 'side'} is ${A(a)} squares long, the ${B('copy')}'s matching ${across ? 'bottom' : 'side'} is ${B(c)}. The copy's is how many times as long?`,
    board: `${c} = \\ ? \\times ${a}`, unit: 'times as long',
    solution: [`${a} × ${k} = ${c}`, `So the copy's side is ${k} times as long. That number is the scale factor.`],
    pict: { pic, solve: { tex: `${c} = ${k} \\times ${a}` } },
  }, k, `Yes: ${a} × ${k} = ${c}, so it is ${k} times as long.`, [
    { v: c - a, mc: MC.difference, say: `${c} − ${a} = ${c - a} says how much LONGER it is. "Times as long" asks: ${a} × what = ${c}?` },
    { v: c, say: `${c} is the length of the copy's side. How many ${a}s fit into ${c}?` },
  ], `How many times does ${a} fit into ${c}? Skip count: ${a}, ${2 * a}, ${3 * a}…`);
});

const countLen: Gen = (R, n) => fit(() => {
  const w = int(R, 1, 4), h = int(R, 1, 4), k = pick(R, [2, 3]);
  const sideIdx = R() < 0.5 ? 0 : 1;
  const len = sideIdx === 0 ? k * w : k * h;
  const ar = rowOf([rect(w, h), rect(k * w, k * h)], 2, 1, 1);
  const P1 = ar.placed[1]!;
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: rectLabels(q1(w), q1(h), 'left') },
    { pts: P1, role: 'second', labels: sideIdx === 0 ? [{ t: '?', alt: q1(len), altCol: 'link' }, null, null, null] : [null, { t: '?', alt: q1(len), altCol: 'link' }, null, null], of: { fig: 0, k } },
    { pts: [P1[sideIdx]!, P1[sideIdx + 1]!], role: 'pick', open: true, style: 'line' },
  ] };
  const orig = sideIdx === 0 ? w : h;
  return numItem({
    id: `countLen-${n}`, family: 'countLen',
    prompt: `The ${B('copy')} is ${k} times as big as the ${A(`${w} by ${h}`)} rectangle. Count on the grid to check: how long is its lavender side?`,
    board: `\\text{${sideIdx === 0 ? 'bottom' : 'right side'}} = \\ ?`, unit: 'units',
    solution: [`Count the spaces between the grid lines along the side: ${len}.`, `That is ${orig} × ${k}: the copy is ${k} times as long.`],
    pict: { pic, solve: { show: [`f1a${sideIdx}`], tex: `${orig} \\times ${k} = ${len}` } },
  }, len, `Yes, ${len} units: ${k} times the original's ${orig}.`, [
    { v: len + 1, mc: MC.points, say: `That counts the grid points. A length counts the SPACES between them: there is one space fewer than points.` },
  ], `Count the spaces between the grid lines, from one end of the side to the other.`);
});

// ===== 4. common-factor-both-directions =====
const missingDim: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 2, 3, 3, 1]);
  let w = int(R, 1, 6), h = int(R, 1, 6);
  if (k > 1) while (h === w) h = int(R, 1, 6);
  const W = k * w, H = k * h;
  const add = h + (W - w);
  const pic = pair2(rect(w, h), rect(W, H), { labels: rectLabels(q1(w), q1(h), 'left') }, { labels: rectLabels(q1(W), { t: '?', alt: q1(H), altCol: 'link' }, 'right'), of: { fig: 0, k } });
  const same = k === 1;
  return numItem({
    id: `missingDim-${n}`, family: 'missingDim',
    prompt: same
      ? `A ${B('copy')} of the ${A(`${w} by ${h}`)} rectangle is ${B(W)} wide, the same width. How tall is it?`
      : `A ${B('scaled copy')} of the ${A(`${w} by ${h}`)} rectangle is ${B(W)} wide. How tall is it?`,
    board: `${w} \\to ${W}, \\quad ${h} \\to\\ ?`, unit: 'units',
    solution: same
      ? [`${W} is ${w} × 1: the scale factor is 1, a same-size copy.`, `So the height is ${h} × 1 = ${h}.`]
      : [`${W} = ${w} × ${k}: the copy is ${k} times as long.`, `Every length gets the same factor: ${h} × ${k} = ${H}.`],
    pict: { pic, solve: { show: ['f1a1'], tex: `${h} \\times ${k} = ${H}` } },
  }, H, same ? `Yes: factor 1 keeps every length, ${h} stays ${h}.` : `Yes: ${h} × ${k} = ${H}. One factor for every length, up as well as across.`, same ? [] : [
    { v: h, mc: MC.someSides, say: `The width changed, so the height must too: every length is ${k} times as long, ${h} × ${k}.` },
    { v: add, mc: MC.additive, say: `${w} → ${W} is ${k} times as long, not just "${W - w} more". Do the same to the height: ${h} × ${k}.` },
  ], `Find the factor from the widths (${W} ÷ ${w}), then use it on the height.`);
});

const oneFactor: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3]);
  let w = int(R, 1, 4), h = int(R, 1, 4);
  while (h === w) h = int(R, 1, 4);
  const W = k * w, H = k * h;
  const pic = pair2(rect(w, h), rect(W, H), { labels: rectLabels(q1(w), q1(h), 'left') }, { of: { fig: 0, k } });
  const add = (k - 1) * w;
  const cs: Choice[] = [
    { t: `Every length is ${k} times as long: ${W} by ${H}.`, ok: true, say: `Yes: one factor for every length, ${w} × ${k} and ${h} × ${k}.` },
    { t: `Only the width is ${k} times as long: ${W} by ${h}.`, mc: MC.someSides, say: `Then the shape would stretch sideways. A scaled copy multiplies the height too.` },
    { t: `It covers ${k} times as many squares: ${k * w * h} squares.`, mc: MC.area, say: `Count the copy's squares: ${W} × ${H} = ${W * H}, not ${k * w * h}. The LENGTHS are ${k} times as long; the area grows more.` },
  ];
  if (h + add !== H) cs.push({ t: `Every side gets ${add} more: ${W} by ${h + add}.`, mc: MC.additive, say: `Adding the same amount changes the shape. A scaled copy multiplies: ${h} × ${k} = ${H}.` });
  return choiceItem({
    id: `oneFactor-${n}`, family: 'oneFactor',
    prompt: `The ${A(`${w} by ${h}`)} rectangle gets a ${B(`scaled copy with factor ${k}`)}. Which is true?`,
    board: `${w} \\text{ by } ${h}, \\quad \\times ${k}`,
    solution: [`Factor ${k}: every length is ${k} times as long.`, `${w} × ${k} = ${W} and ${h} × ${k} = ${H}: the copy is ${W} by ${H}.`],
    pict: { pic, hide: ['f1'], solve: { show: ['f1'], tex: `${W} \\text{ by } ${H}` } },
  }, R, cs);
});

// ===== 5. additive-vs-multiplicative =====
const addOrTimes: Gen = (R, n) => fit(() => {
  const w = int(R, 1, 3), k = pick(R, [2, 3]), d = (k - 1) * w;
  let h = int(R, 1, 6);
  while (h === w || h + d === k * h) h = int(R, 1, 6);
  const W = w + d, Hp = h + d, H = k * h;
  const ar = rowOf([rect(w, h), rect(W, Math.max(H, Hp))], 2, 1, 1);
  const at = ar.placed[1]![0]!;
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: rectLabels(q1(w), q1(h), 'left') },
    { pts: move(rect(W, Hp), at[0], at[1]), role: 'pick', style: 'dash', labels: rectLabels(q1(W), q1(Hp), 'left') },
    { pts: move(rect(W, H), at[0], at[1]), role: 'link', style: 'dash', labels: [null, q1(H), null, null], of: { fig: 0, k } },
  ] };
  const who = pick(R, ['Kai', 'Noor', 'Eli', 'Rosa', 'Theo']);
  return numItem({
    id: `addOrTimes-${n}`, family: 'addOrTimes',
    prompt: `${who} adds ${d} to every side of a ${A(`${w} by ${h}`)} rectangle and gets ${W} by ${Hp}. The width is now ${k} times as long. For a ${S('scaled copy')}, how tall would it have to be?`,
    board: `${w} \\to ${W}: \\times ${k}`, unit: 'units',
    solution: [`${w} → ${W} is × ${k}.`, `A scaled copy multiplies the height by ${k} too: ${h} × ${k} = ${H}, not ${Hp}.`],
    pict: { pic, hide: ['f2', 'f2L'], solve: { show: ['f2', 'f2L'], tex: `${h} \\times ${k} = ${H} \\neq ${Hp}` } },
  }, H, `Yes: ${h} × ${k} = ${H}. ${who}'s ${Hp} is too ${Hp < H ? 'short' : 'tall'}: adding ${d} stretched the shape.`, [
    { v: Hp, mc: MC.additive, say: `That is ${who}'s height, ${h} + ${d}. But the width was multiplied by ${k}, so the height must be multiplied by ${k} too.` },
    { v: h, mc: MC.someSides, say: `The height has to change as well: ${h} × ${k}.` },
  ], `Use the width's factor, ${k}, on the height.`);
});

const addCheck: Gen = (R, n) => fit(() => {
  const square = R() < 0.5;
  const k = pick(R, [2, 3]);
  const w = int(R, 1, k === 3 ? 2 : 3);
  let h = w;
  if (!square) while (h === w) h = int(R, 1, 5);
  const d = (k - 1) * w;
  const W = w + d, H = h + d;
  const yes = square;
  const pic = pair2(rect(w, h), rect(W, H), { labels: rectLabels(q1(w), q1(h), 'left') }, { labels: rectLabels(q1(W), q1(H), 'right'), of: yes ? { fig: 0, k } : undefined });
  const why = yes
    ? `Yes. ${w} + ${d} = ${W} is also ${w} × ${k}, on both sides: for a square, adding happens to multiply every side by the same factor.`
    : `No. ${w} → ${W} is × ${k}, so the height should be ${h} × ${k} = ${k * h}, not ${H}. Adding the same amount stretched it.`;
  return choiceItem({
    id: `addCheck-${n}`, family: 'addCheck',
    prompt: `Add ${d} to every side of the ${A(`${w} by ${h}`)} ${square ? 'square' : 'rectangle'}: it becomes ${B(`${W} by ${H}`)}. Is that a scaled copy?`,
    board: `${w} \\text{ by } ${h} \\;\\xrightarrow{+${d}}\\; ${W} \\text{ by } ${H}`,
    solution: [`Across: ${w} → ${W} is × ${k}.`, yes ? `Up: ${h} → ${H} is × ${k} too. Both sides × ${k}: a scaled copy.` : `Up: ${h} × ${k} = ${k * h}, but it is ${H}. Two different factors: stretched.`],
    pict: { pic, solve: { tex: yes ? `\\times ${k} \\text{ both ways}` : `${h} \\times ${k} = ${k * h} \\neq ${H}` } },
  }, R, [
    { t: 'Yes, a scaled copy', ok: yes, mc: yes ? undefined : MC.additive, say: why },
    { t: 'No, it is stretched', ok: !yes, mc: yes ? MC.addNever : undefined, say: why },
  ], true);
});

// ===== 6. reduction-concept =====
const halfOf: Gen = (R, n) => fit(() => {
  const w = 2 * int(R, 1, 6), h = 2 * int(R, 1, 6);
  const askW = R() < 0.4;
  const W = w / 2, H = h / 2;
  const pic = pair2(rect(w, h), rect(W, H), { labels: rectLabels(q1(w), q1(h), 'left') },
    { labels: askW ? [{ t: '?', alt: q1(W), altCol: 'link' }, null, null, null] : rectLabels(q1(W), { t: '?', alt: q1(H), altCol: 'link' }, 'right'), of: { fig: 0, k: 0.5 } });
  if (askW) return numItem({
    id: `halfOf-${n}`, family: 'halfOf',
    prompt: `The ${A(`${w} by ${h}`)} rectangle gets a ${B('scaled copy')} with scale factor ${S(fr(1, 2))}. How wide is the copy?`,
    board: `${w} \\times \\tfrac{1}{2} = \\ ?`, unit: 'units',
    solution: [`Factor ${fr(1, 2)}: every length is half as long.`, `Half of ${w} is ${W}.`],
    pict: { pic, solve: { show: ['f1a0'], tex: `${w} \\times \\tfrac{1}{2} = ${W}` } },
  }, W, `Yes: half of ${w} is ${W}. A factor less than 1 makes the copy smaller.`, [
    { v: 2 * w, mc: MC.mulBigger, say: `Multiplying by ${fr(1, 2)} does not make it bigger: it takes half of every length. Half of ${w}?` },
    { v: w, mc: MC.someSides, say: `Factor ${fr(1, 2)} changes every length: half of ${w}.` },
  ], `Scale factor ${fr(1, 2)} means half as long.`);
  const sub = h - (w - W);
  return numItem({
    id: `halfOf-${n}`, family: 'halfOf',
    prompt: `A ${B('scaled copy')} of the ${A(`${w} by ${h}`)} rectangle is ${B(W)} wide: half as wide. How tall is it?`,
    board: `${w} \\to ${W}, \\quad ${h} \\to\\ ?`, unit: 'units',
    solution: [`${w} → ${W} is half as long: scale factor ${fr(1, 2)}.`, `So the height is half of ${h}: ${H}.`],
    pict: { pic, solve: { show: ['f1a1'], tex: `${h} \\times \\tfrac{1}{2} = ${H}` } },
  }, H, `Yes: half of ${h} is ${H}. Every length is half as long.`, [
    { v: sub, mc: MC.additive, say: `That takes ${w - W} off, like the width. But the width was HALVED: halve the height too.` },
    { v: h, mc: MC.someSides, say: `The height has to shrink too: every length is half as long.` },
    { v: 2 * h, mc: MC.mulBigger, say: `The copy is smaller, so its height is half of ${h}, not double.` },
  ], `The width was halved. Do the same to the height.`);
});

const halfReverse: Gen = (R, n) => fit(() => {
  const w = int(R, 1, 6), h = int(R, 1, 6), W = 2 * w, H = 2 * h;
  const askW = R() < 0.5;
  const pic = pair2(rect(W, H), rect(w, h), { role: 'second', labels: rectLabels(q1(W), q1(H), 'left') },
    { role: 'first', labels: askW ? [{ t: '?', alt: q1(w), altCol: 'link' }, null, null, null] : [null, { t: '?', alt: q1(h), altCol: 'link' }, null, null], of: { fig: 0, k: 0.5 } });
  const who = pick(R, ['Ana', 'Jay', 'Mira', 'Leo']);
  const L = askW ? W : H, ans = askW ? w : h;
  return numItem({
    id: `halfReverse-${n}`, family: 'halfReverse',
    prompt: `${who} enlarged a drawing with scale factor ${S('2')}. The ${B('copy')} is ${B(`${W} by ${H}`)}. How ${askW ? 'wide' : 'tall'} was the ${A('original')}?`,
    board: `? \\times 2 = ${L}`, unit: 'units',
    solution: [`The copy is 2 times as long as the original.`, `So the original is half as long as the copy: half of ${L} is ${ans}. From the copy back to the original the factor is ${fr(1, 2)}.`],
    pict: { pic, solve: { show: [askW ? 'f1a0' : 'f1a1'], tex: `${L} \\times \\tfrac{1}{2} = ${ans}` } },
  }, ans, `Yes: ${ans} × 2 = ${L}. The original is half as long as the copy.`, [
    { v: 2 * L, mc: MC.reversed, say: `The copy is the BIG one. Going back to the original, the lengths get half as long, not 2 times as long.` },
    { v: L - 2, mc: MC.additive, say: `Factor 2 is "times 2", not "2 more". Undo times 2: half of ${L}.` },
  ], `Which number times 2 gives ${L}?`);
});

// ===== 7. enlarge-rectangle-from-vertex =====
const rectWalk: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3]);
  const w = int(R, 1, k === 3 ? 4 : 6), h = int(R, 1, k === 3 ? 4 : 6);
  const j = int(R, 0, 2);
  const M = walkOf(rect(w, h)), m = M[j]!, len = lenOf(m), ans = k * len;
  const p = withTex(walkItemPic(rect(w, h), k, j, { answer: q1(ans) }), `${len} \\times ${k} = ${ans}`);
  const wrongs: Wrong[] = [
    { v: len, mc: MC.someSides, say: `That is the original's side. Every move of the copy is ${k} times as long: ${len} × ${k}.` },
    { v: ans + 1, mc: MC.points, say: `One too many: that counts grid points. Count the spaces: ${len} × ${k} = ${ans}.` },
  ];
  if (j > 0) { const first = lenOf(M[0]!); wrongs.push({ v: len + (k - 1) * first, mc: MC.additive, say: `The first move grew by ${(k - 1) * first}, but that was times ${k}, not "plus". Do times ${k} again.` }); }
  return numItem({
    id: `rectWalk-${n}`, family: 'rectWalk',
    prompt: `Draw a copy ${k} times as big, starting at the dot. ${j ? 'The pen has done the first move' + (j > 1 ? 's' : '') + '. ' : ''}The original's lavender side goes ${A(moveWords(m))}. The copy's next move: ${dirOf(m)} how many?`,
    board: `${moveTex(m)} \\;\\times ${k}`, unit: 'squares',
    solution: [`The original moves ${moveWords(m)}.`, `The copy moves ${k} times as far: ${len} × ${k} = ${ans}, ${dirOf(m)} ${ans}.`],
    pict: p,
  }, ans, `Yes: ${dirOf(m)} ${ans}. Every move × ${k}.`, wrongs, `Multiply the original's move by ${k}.`);
});

const rectCorner: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3]);
  const w = int(R, 1, k === 3 ? 4 : 6), h = int(R, 1, k === 3 ? 4 : 6);
  const W = k * w, H = k * h;
  const p0 = walkAllPic(rect(w, h), k, { labels0: rectLabels(q1(w), q1(h), 'left') });
  const p = withTex(p0, `\\rightarrow ${W}\\;\\, \\uparrow ${H}`);
  const wrongs: PairWrong[] = [
    { v: [W + 1, H + 1], mc: MC.points, say: 'That counts grid points. Count the spaces: the moves are the side lengths × ' + k + '.' },
    { v: [W, h], mc: MC.someSides, say: `The height has to be ${k} times as long too: ${h} × ${k}.` },
    { v: [w, H], mc: MC.someSides, say: `The width has to be ${k} times as long too: ${w} × ${k}.` },
  ];
  if (w !== h) wrongs.push({ v: [W, h + (W - w)], mc: MC.additive, say: `${w} → ${W} is × ${k}, not "+ ${W - w}". The height: ${h} × ${k}.` });
  return pairItem({
    id: `rectCorner-${n}`, family: 'rectCorner',
    prompt: `Draw a copy of the ${A(`${w} by ${h}`)} rectangle ${k} times as big, from the dot. Its far corner (top right) is how far from the dot?`,
    board: `${w} \\text{ by } ${h}, \\quad \\times ${k}`,
    solution: [`Across: ${w} × ${k} = ${W}.`, `Up: ${h} × ${k} = ${H}.`, `The far corner is right ${W}, up ${H} from the dot.`],
    pict: p,
  }, [W, H], 'right', 'squares, up', 'squares', `Yes: right ${W}, up ${H}.`, wrongs, `Multiply the width and the height by ${k}.`);
});

// ===== 8. scale-every-side-rectilinear =====
function rectilinear(R: () => number, k: number): V[] {
  const mx = k === 3 ? 3 : 5;
  const kind = pick(R, ['ell', 'ell', 'tee', 'stairs'] as const);
  if (kind === 'ell') { const w = int(R, 2, mx), h = int(R, 2, mx); return ell(w, h, int(R, 1, w - 1), int(R, 1, h - 1)); }
  if (kind === 'tee') { const s = int(R, 1, 2), m = int(R, 1, 2), w = s + 2 * m, h = int(R, 2, mx); return tee(w, h, s, int(R, 1, h - 1)); }
  const s = () => int(R, 1, k === 3 ? 1 : 2);
  return stairs(s(), s(), s(), s(), s(), s());
}
const walkNext: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3]);
  const S0 = rectilinear(R, k);
  const M = walkOf(S0), j = int(R, 1, M.length - 2), m = M[j]!, len = lenOf(m), ans = k * len;
  const p = withTex(walkItemPic(S0, k, j, { answer: q1(ans) }), `${len} \\times ${k} = ${ans}`);
  return numItem({
    id: `walkNext-${n}`, family: 'walkNext',
    prompt: `The ${B('copy')} is ${k} times as big, walked from the dot. The original's lavender side goes ${A(moveWords(m))}. The copy's next move: ${dirOf(m)} how many?`,
    board: `\\text{move ${j + 1}: } ${moveTex(m)} \\times ${k}`, unit: 'squares',
    solution: [`Walk the original side by side. This side goes ${moveWords(m)}.`, `The copy's move: ${len} × ${k} = ${ans}, ${dirOf(m)} ${ans}. Every side, the short inner ones too.`],
    pict: p,
  }, ans, `Yes: ${dirOf(m)} ${ans}.`, [
    { v: len, mc: MC.someSides, say: `Short inner sides get the factor too: ${len} × ${k}.` },
    { v: ans + 1, mc: MC.points, say: `Count the spaces, not the grid points: ${len} × ${k}.` },
  ], `Multiply the original's move by ${k}.`);
});

const walkList: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3]);
  const S0 = rectilinear(R, k);
  const M = walkOf(S0);
  const e = extent(S0);
  const right = M.map(m => ({ dx: m.dx * k, dy: m.dy * k }));
  // the outside (the full width and height) multiplied, the short inner sides not
  const outer = M.map(m => (Math.abs(m.dx) === e.w || Math.abs(m.dy) === e.h ? { dx: m.dx * k, dy: m.dy * k } : m));
  const plus = M.map(m => ({ dx: m.dx ? m.dx + Math.sign(m.dx) * (k - 1) : 0, dy: m.dy ? m.dy + Math.sign(m.dy) * (k - 1) : 0 }));
  const txt = (L: Move[]) => L.map(moveHtml).join('&ensp;');
  const cs: Choice[] = [{ t: txt(right), ok: true, say: `Yes: every move × ${k}, and the walk ends back at the dot.` }];
  if (txt(outer) !== txt(right)) cs.push({ t: txt(outer), mc: MC.someSides, say: `The long outside moves are × ${k}, but the short inner ones are not. Every move gets the factor.` });
  if (txt(plus) !== txt(right) && txt(plus) !== txt(outer)) cs.push({ t: txt(plus), mc: MC.additive, say: `That adds ${k - 1} to every move. A scaled copy multiplies every move by ${k}.` });
  const half = M.map((m, i) => (i % 2 === 0 ? { dx: m.dx * k, dy: m.dy * k } : m));
  if (cs.length < 3 && txt(half) !== txt(right)) cs.push({ t: txt(half), mc: MC.someSides, say: 'Some moves are not multiplied. Every move gets the factor.' });
  const lab = M.map(m => q1(lenOf(m)));
  const p = withTex(walkAllPic(S0, k, { labels0: lab }), `\\text{every move} \\times ${k}`);
  return choiceItem({
    id: `walkList-${n}`, family: 'walkList',
    prompt: `The original, walked from the dot: ${A(txt(M))}. Which walk draws a copy ${k} times as big?`,
    board: `\\text{every move} \\times ${k}\\ ?`,
    solution: [`Multiply every move by ${k}, in the same order and the same directions.`, `${txt(right)}`],
    pict: p,
  }, R, cs);
});

// ===== 9. slanted-sides-run-rise =====
function slantShape(R: () => number, k: number, even = false): V[] {
  const mx = even ? 6 : k === 3 ? 3 : 5;
  const v = () => (even ? 2 * int(R, 1, mx / 2) : int(R, 1, mx));
  if (R() < 0.55) {
    const b = v(); let a = even ? 2 * int(R, 0, b / 2) : int(R, 0, b);
    if (a === b && R() < 0.5) a = 0;
    return tri(b, a, v());
  }
  const w = even ? 4 : int(R, 2, Math.min(mx, 4)), h = v();
  const a = even ? w / 2 : int(R, 1, w - 1);
  return house(w, h, a, even ? 2 : int(R, 1, 2));
}
const slantMove: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3]);
  const S0 = slantShape(R, k);
  const M = walkOf(S0);
  const js = M.map((m, i) => i).filter(i => slanted(M[i]!));
  const j = pick(R, js), m = M[j]!;
  const a = Math.abs(m.dx), b = Math.abs(m.dy);
  const p = withTex(walkItemPic(S0, k, j), `\\text{copy: } ${moveTex({ dx: m.dx * k, dy: m.dy * k })}`);
  const wrongs: PairWrong[] = [
    { v: [k * a, b], mc: MC.oneStep, say: `The across step is × ${k}, but the ${vWord(m.dy)} step is not. Both steps of a slanted side get the factor.` },
    { v: [a, k * b], mc: MC.oneStep, say: `The ${vWord(m.dy)} step is × ${k}, but the across step is not. Both steps get the factor.` },
    { v: [a, b], mc: MC.someSides, say: `That is the original's slant. The copy's slant is ${k} times as long: both steps × ${k}.` },
  ];
  return pairItem({
    id: `slantMove-${n}`, family: 'slantMove',
    prompt: `The ${B('copy')} is ${k} times as big. The original's lavender side goes ${A(moveWords(m))}. How does the copy's slanted side go?`,
    board: `${moveTex(m)} \\;\\times ${k}`,
    solution: [`Split the slanted side into its two steps: ${moveWords(m)}.`, `Multiply both: ${hWord(m.dx)} ${a} × ${k} = ${k * a}, ${vWord(m.dy)} ${b} × ${k} = ${k * b}.`],
    pict: p,
  }, [k * a, k * b], hWord(m.dx), `squares, ${vWord(m.dy)}`, 'squares', `Yes: ${hWord(m.dx)} ${k * a}, ${vWord(m.dy)} ${k * b}.`, wrongs, `Multiply each step of the slanted side by ${k}.`);
});

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const slantHow: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3]);
  let a = int(R, 1, 4), b = int(R, 1, 4);
  while (a === b) b = int(R, 1, 4);
  const dx = R() < 0.5 ? a : -a, dy = R() < 0.5 ? b : -b;
  const m = { dx, dy };
  const crossed = a + b - gcd(a, b);
  const from: V = [1 + (dx < 0 ? a : 0), 1 + (dy < 0 ? b : 0)];
  const seg: V[] = [from, [from[0] + dx, from[1] + dy]];
  const picture: Pic = { cols: a + 2.6, rows: b + 2, grid: true, figs: [{ pts: seg, role: 'first', open: true, style: 'line' }],
    moves: [{ from, dx, dy, role: 'first', vFirst: R() < 0.5 }], dots: [{ at: from, role: 'pick' }] };
  const h = hWord(dx), v = vWord(dy);
  return choiceItem({
    id: `slantHow-${n}`, family: 'slantHow',
    prompt: `A slanted side goes ${A(moveWords(m))}. How do you draw it in a copy ${k} times as big?`,
    board: `${moveTex(m)} \\;\\times ${k}`,
    solution: [`A slanted side is two steps: ${h} ${a} and ${v} ${b}.`, `Multiply both steps: ${h} ${k * a}, ${v} ${k * b}. Then join the dots.`],
    pict: { pic: picture, solve: { tex: `${moveTex({ dx: dx * k, dy: dy * k })}` } },
  }, R, [
    { t: `${h} ${k * a}, ${v} ${k * b}`, ok: true, say: `Yes: both steps × ${k}.` },
    { t: `${h} ${k * a}, ${v} ${b}`, mc: MC.oneStep, say: `Only the across step got the factor. Both steps must be × ${k}.` },
    { t: `${h} ${a}, ${v} ${k * b}`, mc: MC.oneStep, say: `Only the ${v} step got the factor. Both steps must be × ${k}.` },
    { t: `It crosses ${crossed} squares, so make it cross ${k * crossed}`, mc: MC.diagUnit, say: `A slanted side is not measured in squares crossed: a diagonal is longer than a side of a square. Use its two steps, × ${k}.` },
  ]);
});

// ===== 10. construct-reduction =====
const halfWalk: Gen = (R, n) => fit(() => {
  const kind = pick(R, ['rect', 'ell', 'slant', 'slant'] as const);
  const S0 = kind === 'rect' ? rect(2 * int(R, 1, 6), 2 * int(R, 1, 6))
    : kind === 'ell' ? (() => { const w = 2 * int(R, 2, 5), h = 2 * int(R, 2, 5); return ell(w, h, 2 * int(R, 1, w / 2 - 1), 2 * int(R, 1, h / 2 - 1)); })()
      : slantShape(R, 2, true);
  const M = walkOf(S0);
  const j = pick(R, M.map((_, i) => i).filter(i => i >= 1 && (kind === 'slant' ? slanted(M[i]!) : i <= M.length - 2)));
  const m = M[j]!;
  const first = M[0]!, d0 = lenOf(first) / 2;
  if (slanted(m)) {
    const a = Math.abs(m.dx), b = Math.abs(m.dy);
    const p = withTex(walkItemPic(S0, 0.5, j), `\\text{copy: } ${moveTex({ dx: m.dx / 2, dy: m.dy / 2 })}`);
    return pairItem({
      id: `halfWalk-${n}`, family: 'halfWalk',
      prompt: `Draw a copy with scale factor ${S(fr(1, 2))}, walked from the dot. The original's lavender side goes ${A(moveWords(m))}. How does the copy's side go?`,
      board: `${moveTex(m)} \\;\\times \\tfrac{1}{2}`,
      solution: [`Factor ${fr(1, 2)}: every step is half as long.`, `Half of ${a} is ${a / 2}, half of ${b} is ${b / 2}: ${hWord(m.dx)} ${a / 2}, ${vWord(m.dy)} ${b / 2}.`],
      pict: p,
    }, [a / 2, b / 2], hWord(m.dx), `squares, ${vWord(m.dy)}`, 'squares', `Yes: half of each step.`, [
      { v: [2 * a, 2 * b], mc: MC.reversed, say: `Factor ${fr(1, 2)} makes the copy SMALLER: half of each step, not double.` },
      { v: [a / 2, b], mc: MC.oneStep, say: `Halve the ${vWord(m.dy)} step too.` },
      { v: [a, b / 2], mc: MC.oneStep, say: `Halve the across step too.` },
      { v: [a, b], mc: MC.someSides, say: 'That is the original. Every step of the copy is half as long.' },
    ], 'Take half of each step.');
  }
  const len = lenOf(m), ans = len / 2;
  const p = withTex(walkItemPic(S0, 0.5, j, { answer: q1(ans) }), `${len} \\times \\tfrac{1}{2} = ${ans}`);
  const wrongs: Wrong[] = [
    { v: 2 * len, mc: MC.reversed, say: `Factor ${fr(1, 2)} makes the copy SMALLER: half of ${len}, not double.` },
    { v: len, mc: MC.someSides, say: `Every move of the copy is half as long: half of ${len}.` },
  ];
  if (len - d0 > 0) wrongs.push({ v: len - d0, mc: MC.additive, say: `The first move lost ${d0}, but that was "half of", not "minus ${d0}". Take half of ${len}.` });
  return numItem({
    id: `halfWalk-${n}`, family: 'halfWalk',
    prompt: `Draw a copy with scale factor ${S(fr(1, 2))}, walked from the dot. The original's lavender side goes ${A(moveWords(m))}. The copy's move: ${dirOf(m)} how many?`,
    board: `${moveTex(m)} \\;\\times \\tfrac{1}{2}`, unit: 'squares',
    solution: [`Factor ${fr(1, 2)}: every move is half as long.`, `Half of ${len} is ${ans}: ${dirOf(m)} ${ans}.`],
    pict: p,
  }, ans, `Yes: ${dirOf(m)} ${ans}, half of ${len}.`, wrongs, `Take half of the original's move.`);
});

// ===== 11. classify-by-two-factors =====
type PairKind = 'equal' | 'one' | 'unequal' | 'additive' | 'half';
function rectPair(R: () => number, kinds: readonly PairKind[]) {
  const kind = pick(R, kinds);
  let w = int(R, 2, 6), h = int(R, 2, 6);
  let W: number, H: number;
  if (kind === 'equal') { const k = pick(R, [2, 3]); if (k === 3) { w = int(R, 2, 4); h = int(R, 2, 4); } W = k * w; H = k * h; }
  else if (kind === 'one') { const k = pick(R, [2, 3]); if (R() < 0.5) { W = k * w; H = h; } else { W = w; H = k * h; } }
  else if (kind === 'unequal') { w = int(R, 2, 4); h = int(R, 2, 4); if (R() < 0.5) { W = 2 * w; H = 3 * h; } else { W = 3 * w; H = 2 * h; } }
  else if (kind === 'additive') { w = int(R, 2, 3); while (h === w) h = int(R, 2, 6); const d = pick(R, [w, 2 * w]); W = w + d; H = h + d; }
  else { w = 2 * int(R, 1, 3); h = 2 * int(R, 1, 3); W = w / 2; H = h / 2; }
  return { kind, w, h, W, H, kx: rat(W, w), ky: rat(H, h) };
}
const qH = (q: Q) => (q.q === 1 ? String(q.p) : fr(q.p, q.q));
const qT2 = (q: Q) => (q.q === 1 ? String(q.p) : `\\tfrac{${q.p}}{${q.q}}`);
const twoFactors: Gen = (R, n) => fit(() => {
  const P = rectPair(R, ['equal', 'equal', 'one', 'unequal', 'additive', 'half']);
  const yes = qEq(P.kx, P.ky);
  const pic = pair2(rect(P.w, P.h), rect(P.W, P.H), { labels: rectLabels(q1(P.w), q1(P.h), 'left') }, { labels: rectLabels(q1(P.W), q1(P.H), 'right'), of: yes ? { fig: 0, k: qNum(P.kx) } : undefined });
  const fx = `${P.w} → ${P.W} is × ${qH(P.kx)}`, fy = `${P.h} → ${P.H} is × ${qH(P.ky)}`;
  const why = yes ? `Scaled: ${fx} and ${fy}, the same factor both ways.` : `Stretched: ${fx}, but ${fy}. Two different factors change the shape.`;
  const noMc = P.kind === 'one' ? MC.stretchedBig : P.kind === 'additive' ? MC.additive : MC.oneRatio;
  return choiceItem({
    id: `twoFactors-${n}`, family: 'twoFactors',
    prompt: `The ${A(`${P.w} by ${P.h}`)} rectangle and a ${B(`${P.W} by ${P.H}`)} copy. Scaled copy or stretched? Compare the factor across with the factor up.`,
    board: `${P.w} \\to ${P.W}, \\quad ${P.h} \\to ${P.H}`,
    solution: [`Across: ${fx}.`, `Up: ${fy}.`, yes ? 'The same factor: a scaled copy.' : 'Different factors: stretched.'],
    pict: { pic, solve: { tex: `\\times ${qT2(P.kx)}\\ ${yes ? '=' : '\\neq'}\\ \\times ${qT2(P.ky)}` } },
  }, R, [
    { t: 'Scaled copy', ok: yes, mc: yes ? undefined : noMc, say: why },
    { t: 'Stretched copy', ok: !yes, say: why },
  ], true);
});

const factorPair: Gen = (R, n) => fit(() => {
  const P = rectPair(R, ['equal', 'one', 'unequal']);
  const ans: [number, number] = [qNum(P.kx), qNum(P.ky)];
  const pic = pair2(rect(P.w, P.h), rect(P.W, P.H), { labels: rectLabels(q1(P.w), q1(P.h), 'left') }, { labels: rectLabels(q1(P.W), q1(P.H), 'right'), of: qEq(P.kx, P.ky) ? { fig: 0, k: ans[0] } : undefined });
  return pairItem({
    id: `factorPair-${n}`, family: 'factorPair',
    prompt: `Find both factors from the ${A('original')} to the ${B('copy')}: across (the widths) and up (the heights).`,
    board: `${P.w} \\to ${P.W}, \\quad ${P.h} \\to ${P.H}`,
    solution: [`Across: ${P.W} ÷ ${P.w} = ${ans[0]}.`, `Up: ${P.H} ÷ ${P.h} = ${ans[1]}.`, ans[0] === ans[1] ? 'The same factor both ways: a scaled copy.' : 'Two different factors: a stretched copy.'],
    pict: { pic, solve: { tex: `\\times ${ans[0]}, \\ \\times ${ans[1]}` } },
  }, ans, 'across ×', ', up ×', '', ans[0] === ans[1] ? `Yes: × ${ans[0]} both ways, a scaled copy.` : `Yes: × ${ans[0]} across, × ${ans[1]} up. Different, so it is stretched.`, [
    { v: [P.W - P.w, P.H - P.h], mc: MC.difference, say: `Those are how much longer the sides got. A factor asks "how many times as long": divide, ${P.W} ÷ ${P.w}.` },
  ], 'Divide each copy length by the matching original length.');
});

// ===== 12. whole-figure-check =====
function notchPair(R: () => number) {
  const k = pick(R, [2, 3]);
  const w = int(R, 2, k === 3 ? 4 : 5), h = int(R, 2, k === 3 ? 4 : 5);
  const a = int(R, 1, w - 1), b = int(R, 1, h - 1);
  const kind = pick(R, ['scaled', 'arm', 'foot', 'arm'] as const);
  const C = kind === 'scaled' ? ell(k * w, k * h, k * a, k * b) : kind === 'arm' ? ell(k * w, k * h, a, k * b) : ell(k * w, k * h, k * a, b);
  return { k, w, h, a, b, kind, O: ell(w, h, a, b), C };
}
const notch: Gen = (R, n) => fit(() => {
  const P = notchPair(R);
  const yes = P.kind === 'scaled';
  const pic = pair2(P.O, P.C, { labels: [q1(P.w), null, null, null, null, q1(P.h)] }, { labels: [q1(P.k * P.w), null, null, null, null, q1(P.k * P.h)], of: yes ? { fig: 0, k: P.k } : undefined });
  const inner = P.kind === 'arm' ? `the upright arm is still ${P.a} wide (it should be ${P.k * P.a})` : `the foot is still ${P.b} tall (it should be ${P.k * P.b})`;
  const why = yes ? `Yes: count the inner sides too. They are all × ${P.k}.` : `No: the width and height are × ${P.k}, but ${inner}.`;
  return choiceItem({
    id: `notch-${n}`, family: 'notch',
    prompt: `The ${B('copy')} is ${P.k * P.w} by ${P.k * P.h}: × ${P.k} across and up. Count the inner sides on the grid. Is it a scaled copy of the ${A('L-shape')}?`,
    board: `${P.w} \\to ${P.k * P.w}, \\quad ${P.h} \\to ${P.k * P.h}`,
    solution: ['Width and height are not enough: check every side, the inner ones too.', yes ? `Every side is × ${P.k}.` : `Here ${inner}.`],
    pict: { pic, solve: { ring: 1, tex: yes ? `\\text{every side} \\times ${P.k}` : `\\text{inner side} \\neq \\times ${P.k}` } },
  }, R, [
    { t: 'Yes, a scaled copy', ok: yes, mc: yes ? undefined : MC.oneRatio, say: why },
    { t: 'No, not a scaled copy', ok: !yes, say: why },
  ], true);
});

const notchFix: Gen = (R, n) => fit(() => {
  let P = notchPair(R);
  while (P.kind === 'scaled') P = notchPair(R);
  const arm = P.kind === 'arm';
  const len = arm ? P.a : P.b, ans = P.k * len;
  const sideIdx = arm ? 4 : 1;
  const ar = rowOf([P.O, P.C], 2, 1, 1);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: [q1(P.w), arm ? null : q1(P.b), null, null, arm ? q1(P.a) : null, q1(P.h)] },
    { pts: ar.placed[1]!, role: 'second', labels: [q1(P.k * P.w), null, null, null, null, q1(P.k * P.h)] },
    { pts: [ar.placed[0]![sideIdx]!, ar.placed[0]![sideIdx + 1]!], role: 'pick', open: true, style: 'line' },
  ] };
  const what = arm ? 'the top of the upright arm' : 'the right side of the foot';
  return numItem({
    id: `notchFix-${n}`, family: 'notchFix',
    prompt: `This ${B('copy')} has the right width and height (× ${P.k}), but one inner side was not scaled. In a true × ${P.k} copy, how long is ${what} (lavender on the original)?`,
    board: `${len} \\times ${P.k} = \\ ?`, unit: 'units',
    solution: [`On the original, ${what} is ${len}.`, `× ${P.k}: ${len} × ${P.k} = ${ans}. Every side gets the factor.`],
    pict: { pic, solve: { tex: `${len} \\times ${P.k} = ${ans}` } },
  }, ans, `Yes: ${ans}. Inner sides get the factor too.`, [
    { v: len, mc: MC.someSides, say: `That is the unscaled side. In a scaled copy it is × ${P.k} too.` },
  ], `Multiply the original's side by ${P.k}.`);
});

// ===== 13. angle-test =====
const TRIS: V[][] = [tri(3, 1, 2), tri(2, 2, 3), tri(3, 0, 2), tri(4, 1, 2), tri(2, 1, 3), tri(3, 3, 1), tri(2, 0, 2), tri(4, 3, 2)];
const angleSame: Gen = (R, n) => fit(() => {
  const T0 = pick(R, TRIS), k = pick(R, [2, 3]);
  const across = R() < 0.5;
  const sc = scale(T0, k), st = across ? stretch(T0, k, 1) : stretch(T0, 1, k);
  const scaledFirst = R() < 0.5;
  const [c1, c2] = scaledFirst ? [sc, st] : [st, sc];
  const ar = rowOf([T0, c1, c2], 1, 1, 1, 0.8);
  const ang = (col: 'first' | 'second') => [0, 1, 2].map(at => ({ at, col }));
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs: [
    { pts: ar.placed[0]!, role: 'first', angles: ang('first'), caption: 'original' },
    { pts: ar.placed[1]!, role: 'second', angles: ang('second'), caption: 'copy 1', of: scaledFirst ? { fig: 0, k } : undefined },
    { pts: ar.placed[2]!, role: 'second', angles: ang('second'), caption: 'copy 2', of: scaledFirst ? undefined : { fig: 0, k } },
  ] };
  const sN = scaledFirst ? 1 : 2, tN = scaledFirst ? 2 : 1;
  return choiceItem({
    id: `angleSame-${n}`, family: 'angleSame',
    prompt: `Both copies of the ${A(`triangle (${extent(T0).w} wide, ${extent(T0).h} tall)`)} are bigger: one is × ${k} every way, one is stretched ${across ? 'sideways' : 'upward'}. Compare their corners with the original. Which is true?`,
    board: `\\text{copy ${sN}: } \\times ${k}`,
    solution: [`Copy ${sN} has every length × ${k}: its corners match the original's exactly.`, `Copy ${tN} is stretched: its corners open and close, so its angles change.`],
    pict: { pic, solve: { ring: sN, tex: `\\text{copy ${sN}: same angles}` } },
  }, R, [
    { t: `Copy ${sN} keeps every angle; copy ${tN} does not.`, ok: true, say: `Yes: a scaled copy keeps every angle. Stretching changes them.` },
    { t: `Both copies have bigger angles, because their sides are longer.`, mc: MC.armLength, say: `Longer sides do not make an angle bigger: an angle is how far the corner opens. Copy ${sN}'s corners match the original's.` },
    { t: `Copy ${sN}'s angles are ${k} times as big.`, mc: MC.scalesAngles, say: `Angles are not multiplied by the scale factor: they stay the same in a scaled copy.` },
    { t: `Both keep every angle: both are enlargements.`, mc: MC.stretchedBig, say: `Copy ${tN} is stretched, not enlarged: look how its corners changed.` },
  ]);
});

const rectAngles: Gen = (R, n) => fit(() => {
  const w = int(R, 1, 4), h = int(R, 1, 4), k = pick(R, [2, 3]);
  const across = R() < 0.5;
  const W = across ? k * w : w, H = across ? h : k * h;
  const rt = [0, 1, 2, 3].map(at => ({ at, right: true }));
  const pic = pair2(rect(w, h), rect(W, H), { labels: rectLabels(q1(w), q1(h), 'left'), angles: rt }, { labels: rectLabels(q1(W), q1(H), 'right'), angles: rt });
  return choiceItem({
    id: `rectAngles-${n}`, family: 'rectAngles',
    prompt: `Every corner of both rectangles is a right angle. Is the ${B(`${W} by ${H}`)} rectangle a scaled copy of the ${A(`${w} by ${h}`)} one?`,
    board: `90^\\circ \\to 90^\\circ`,
    solution: ['Same angles is needed, but it is not enough for rectangles: every rectangle has four right angles.', `Check the factors: ${w} → ${W} is × ${W / w}, ${h} → ${H} is × ${H / h}. Different: stretched.`],
    pict: { pic, solve: { tex: `\\times ${W / w} \\neq \\times ${H / h}` } },
  }, R, [
    { t: `No: the angles match, but ${across ? 'the width' : 'the height'} is × ${k} and ${across ? 'the height' : 'the width'} is × 1.`, ok: true, say: 'Yes: the angle test cannot tell for rectangles. The factors can.' },
    { t: 'Yes: all its angles match the original.', mc: MC.equalAngles, say: `Every rectangle has four right angles, even a stretched one. Check the factors: × ${W / w} across, × ${H / h} up.` },
    { t: 'Yes: it is bigger, so it is an enlargement.', mc: MC.stretchedBig, say: `Bigger is not enough: it grew in one direction only, so it is stretched.` },
  ]);
});

// ===== 14. justify-and-repair-resize =====
function icon(R: () => number, k: number): { O: V[]; w: number; h: number; isRect: boolean } {
  const half = k === 0.5;
  if (R() < 0.6) {
    let w = half ? 2 * int(R, 1, 3) : int(R, 2, k === 3 ? 4 : 6), h = half ? 2 * int(R, 1, 3) : int(R, 2, k === 3 ? 4 : 6);
    while (h === w) h = half ? 2 * int(R, 1, 3) : int(R, 2, k === 3 ? 4 : 6);
    return { O: rect(w, h), w, h, isRect: true };
  }
  const w = half ? pick(R, [4, 6]) : int(R, 3, k === 3 ? 4 : 5), h = half ? pick(R, [4, 6]) : int(R, 3, k === 3 ? 4 : 5);
  const a = half ? 2 : int(R, 1, w - 1), b = half ? 2 : int(R, 1, h - 1);
  return { O: ell(w, h, a, b), w, h, isRect: false };
}
const repair: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 2, 3, 0.5]);
  const ic = icon(R, k);
  const W = k * ic.w, H = k * ic.h;
  const prop = ic.h + (W - ic.w);
  if (prop <= 0 || prop === H) return repair(R, n) as GridItem;
  const thing = pick(R, ICONS);
  const ar = rowOf([ic.O, rect(W, Math.max(H, prop))], 2, 1, 1);
  const at = ar.placed[1]![0]!;
  const lab = (t: string, side: number, N: number) => Array.from({ length: N }, (_, i) => (i === side ? t : null));
  const N = ic.O.length;
  const Sp = ic.isRect ? rect(W, prop) : ell(W, prop, Math.max(1, ic.O[3]![0] * k), Math.min(prop - 1, Math.max(1, ic.O[2]![1] * k)));
  const Sc = scale(ic.O, k);
  const pic: Pic = { cols: ar.cols, rows: ar.rows, grid: true, figs: [
    { pts: ar.placed[0]!, role: 'first', labels: [q1(ic.w), ...lab('', -1, N - 2), q1(ic.h)], photo: ic.isRect ? [ic.w, ic.h] : undefined },
    { pts: move(Sp, at[0], at[1]), role: 'pick', style: 'dash', labels: [q1(W), ...lab('', -1, N - 2), q1(prop)] },
    { pts: move(Sc, at[0], at[1]), role: 'link', style: 'dash', labels: ic.isRect ? [null, q1(H), null, null] : [null, null, null, null, null, null], of: { fig: 0, k } },
  ] };
  const who = pick(R, ['Sam', 'Ivy', 'Omar', 'Bea', 'Finn']);
  return numItem({
    id: `repair-${n}`, family: 'repair',
    prompt: `${who} resizes a ${A(`${ic.w} by ${ic.h}`)} ${thing} to ${W} wide and types ${prop} for the height. It looks off. What should the height be?`,
    board: `${ic.w} \\to ${W}, \\quad ${ic.h} \\to\\ ?`, unit: 'units',
    solution: [`${ic.w} → ${W} is × ${kH(k)}.`, `The height gets the same factor: ${ic.h} × ${kH(k)} = ${H}. ${who} ${prop > ic.h ? 'added' : 'took away'} ${Math.abs(W - ic.w)} instead.`],
    pict: { pic, hide: ['f2', 'f2L'], solve: { show: ['f2', 'f2L'], tex: `${ic.h} \\times ${kT(k)} = ${H}` } },
  }, H, `Yes: ${ic.h} × ${kH(k)} = ${H}. Now nothing in the ${thing} is stretched.`, [
    { v: prop, mc: MC.additive, say: `That is ${who}'s height: the same amount ${prop > ic.h ? 'added' : 'taken off'}. The width was multiplied by ${kH(k)}, so multiply the height by ${kH(k)}.` },
    { v: ic.h, mc: MC.someSides, say: `The height has to change too: × ${kH(k)}.` },
  ], `Find the factor from the widths, then use it on the height.`);
});

const resizeJudge: Gen = (R, n) => fit(() => {
  const k = pick(R, [2, 3, 0.5]);
  const ic = icon(R, k);
  const W = k * ic.w, H = k * ic.h;
  const how = pick(R, ['additive', 'width-only', 'additive'] as const);
  const Hp = how === 'additive' ? ic.h + (W - ic.w) : ic.h;
  if (Hp <= 0 || Hp === H) return resizeJudge(R, n) as GridItem;
  const thing = pick(R, ICONS), who = pick(R, ['Sam', 'Ivy', 'Omar', 'Bea', 'Finn']);
  const pic = pair2(rect(ic.w, ic.h), rect(W, Hp), { labels: rectLabels(q1(ic.w), q1(ic.h), 'left'), photo: [ic.w, ic.h] }, { labels: rectLabels(q1(W), q1(Hp), 'right'), photo: [ic.w, ic.h] });
  const cs: Choice[] = [
    { t: `Change the height to ${H}`, ok: true, say: `Yes: ${ic.w} → ${W} is × ${kH(k)}, so the height must be ${ic.h} × ${kH(k)} = ${H}.` },
    { t: 'Keep it: it looks like the same picture', mc: MC.looks, say: `Looks can fool you. Check the factors: × ${kH(k)} across, but ${ic.h} → ${Hp} up. Look at the sun: it is an oval now.` },
  ];
  if (k > 1) cs.push({ t: 'Keep it: it got bigger, so it is an enlargement', mc: MC.stretchedBig, say: `Bigger is not enough: an enlargement has the same factor across and up.` });
  const alt = ic.h + (W - ic.w);
  if (alt > 0 && alt !== H && alt !== Hp) cs.push({ t: `Change the height to ${alt}`, mc: MC.additive, say: `That adds the same amount as the width. A scaled copy multiplies: ${ic.h} × ${kH(k)}.` });
  else if (k === 0.5) cs.push({ t: `Change the height to ${2 * ic.h}`, mc: MC.mulBigger, say: `Factor ${fr(1, 2)} makes every length half as long, not double.` });
  return choiceItem({
    id: `resizeJudge-${n}`, family: 'resizeJudge',
    prompt: `${who} resized a ${A(`${ic.w} by ${ic.h}`)} ${thing} to ${B(`${W} by ${Hp}`)}. What should ${who} do?`,
    board: `${ic.w} \\to ${W}, \\quad ${ic.h} \\to ${Hp}`,
    solution: [`Across: ${ic.w} → ${W} is × ${kH(k)}.`, `Up must be × ${kH(k)} too: ${ic.h} × ${kH(k)} = ${H}, not ${Hp}.`],
    pict: { pic, solve: { tex: `${ic.h} \\times ${kT(k)} = ${H}` } },
  }, R, cs);
});

export const GENERATORS: Record<FamilyId, Gen> = {
  whichScaled, photoFit, matchPart, timesAsLong, countLen, missingDim, oneFactor, addOrTimes, addCheck, halfOf, halfReverse,
  rectWalk, rectCorner, walkNext, walkList, slantMove, slantHow, halfWalk, twoFactors, factorPair, notch, notchFix,
  angleSame, rectAngles, repair, resizeJudge,
};
