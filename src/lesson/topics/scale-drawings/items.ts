// items.ts: exercise families for "Scale drawings" (grade 7, 7.G.A.1). One or two families per sub-goal of the topic
// JSON (plan.ts), each made from templates with that sub-goal's number ranges, checked exactly (scaleMaths.ts), and
// every classic wrong answer tagged with its misconception id (math-curriculum-essentials/misconceptions.json).
// Pure: no DOM, no canvas. A seeded rng makes sessions repeatable. Pictures are PlanSheet params (PlanSheet.ts).
import { type Item, type Response, type Verdict, fracValue, int, pick, shuffle } from '../../runtime/item';
import { type Q, qNum } from '../../../core/math';
import { type AU, type Legend, areaFactor, convert, dec, isMetric, legend, legendHtml, legendTex, perUnit, polyArea, q, ratioN, ratioText, toActual, toDrawing, vHtml, vTex, vText } from './scaleMaths';
import type { PlanFig, PlanParams, RulerSpec } from './PlanSheet';
import { endOnChoice } from '../../runtime/explain';

export type FamilyId = 'copy' | 'copyLen' | 'legend' | 'legendNum' | 'toActual' | 'toDrawing' | 'fracLegend' | 'fracRewrite'
  | 'ruler' | 'makePlan' | 'rescale' | 'area' | 'audit' | 'fit' | 'areaWhy' | 'cost';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'copy', name: 'Which one is a scale copy?' },
  { id: 'copyLen', name: 'Finish the scale copy' },
  { id: 'legend', name: 'Read the scale' },
  { id: 'legendNum', name: 'Scale as one-unit ratio' },
  { id: 'toActual', name: 'Drawing to real' },
  { id: 'toDrawing', name: 'Real to drawing' },
  { id: 'fracLegend', name: 'A fraction-of-an-inch scale' },
  { id: 'fracRewrite', name: 'Rewrite the scale' },
  { id: 'ruler', name: 'Draw it with a ruler' },
  { id: 'makePlan', name: 'Make the plan' },
  { id: 'rescale', name: 'Redraw at a new scale' },
  { id: 'area', name: 'Real area from a plan' },
  { id: 'audit', name: 'Check a drawing' },
  { id: 'fit', name: 'Pick a scale that fits' },
  { id: 'areaWhy', name: 'Why area grows faster' },
  { id: 'cost', name: 'What will it cost?' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

export const MC = {
  additive: 'mc.ratio-rate.additive-keep-difference',
  sameName: 'mc.transformations.same-name-means-similar',
  angles: 'mc.transformations.scales-angles',
  mixed: 'mc.ratio-rate.mixed-unit-scale-not-converted',
  reverse: 'mc.ratio-rate.reverses-scale-ratio-order',
  wrongUnit: 'mc.ratio-rate.wrong-unit-on-scale-result',
  divRate: 'mc.ratio-rate.divides-by-rate-when-multiplying-needed',
  lastMethod: 'mc.reasoning-language.last-practiced-method-for-everything',
  wrongOp: 'mc.ratio-rate.scale-factor-wrong-operation',
  points: 'mc.count.counts-points-not-intervals',
  ticks: 'mc.fractions-concept.denominator-specific-tick-values',
  rulerEnd: 'mc.measurement-units.aligns-at-ruler-end-or-1',
  someLengths: 'mc.ratio-rate.scales-only-some-drawing-lengths',
  someSides: 'mc.transformations.scales-only-some-sides',
  drawAsActual: 'mc.ratio-rate.drawing-length-used-as-actual',
  areaK: 'mc.area-perimeter.area-scales-by-length-factor',
  oneSide: 'mc.transformations.checks-one-side-ratio',
  ratiosOnly: 'mc.transformations.equal-ratios-make-polygons-similar',
  oneDim: 'mc.ratio-rate.scale-fits-one-dimension',
  examples: 'mc.reasoning-language.examples-as-proof',
} as const;

/** what the page draws: a PlanSheet, the steps that only play in the worked solution after a miss */
export type Pic = { kind: 'plan'; plan: PlanParams; solve?: string[]; side?: { fig: number; side: number } };
export interface ScaleItem extends Item {
  family: FamilyId;
  picture?: Pic;
  /** TeX written on the board after a miss */
  work?: string;
}
type Gen = (R: () => number, n: number, sg?: string) => ScaleItem;

// ---------- helpers ----------
const A = (s: string | number) => `<b class="a">${s}</b>`;      // drawing lengths (amber)
const B = (s: string | number) => `<b class="b">${s}</b>`;      // real lengths (teal)
const S = (s: string | number) => `<b class="s">${s}</b>`;      // the answer (lime)
const T = (u: string) => `\\text{ ${u}}`;
const ROOMS = ['bedroom', 'kitchen', 'classroom', 'garage', 'living room', 'craft studio', 'game room', 'workshop'] as const;
const YARDS = ['garden', 'patio', 'skate park', 'deck', 'dog park', 'playground', 'parking lot', 'community garden'] as const;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
/** a value response as a number (num or fraction input) */
function valueOf(r: Response): number | null {
  if (r.kind === 'num') return Number.isFinite(r.v) ? r.v : null;
  if (r.kind === 'frac') { const f = fracValue(r); return f ? f[0] / f[1] : null; }
  return null;
}
interface Wrong { v: number | Q; mc?: string; say: string }
/** right within 1e-6, or a recognised wrong value (its misconception), or a plain miss */
function valCheck(ans: number | Q, okSay: string, wrongs: Wrong[], miss: string): (r: Response) => Verdict {
  const a = typeof ans === 'number' ? ans : qNum(ans);
  return r => {
    const v = valueOf(r);
    if (v === null) return { ok: false, say: 'Type a number.' };
    if (near(v, a)) return { ok: true, say: okSay };
    for (const w of wrongs) { const wv = typeof w.v === 'number' ? w.v : qNum(w.v); if (!near(wv, a) && near(v, wv)) return { ok: false, mc: w.mc, say: w.say }; }
    return { ok: false, say: miss };
  };
}
/** the input that fits an answer: a mixed-number box for customary fractions, a plain number otherwise */
function answerOf(ans: number | Q, metric: boolean): { input: 'num' | 'frac'; answer: Response } {
  const v = q(ans);
  if (metric || v.q === 1) return { input: 'num', answer: { kind: 'num', v: qNum(v) } };
  const w = Math.floor(v.p / v.q);
  return { input: 'frac', answer: { kind: 'frac', w, n: v.p - w * v.q, d: v.q } };
}
interface Opt { t: string; ok: boolean; mc?: string; say: string }
function choiceItem(R: () => number, base: Omit<ScaleItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[], keepOrder = false): ScaleItem {
  const O = keepOrder ? [...opts] : shuffle(R, [...opts]);
  const ts = new Set(O.map(o => o.t));
  if (ts.size !== O.length) throw new Error(`choices not unique: ${O.map(o => o.t).join(' | ')}`);
  return {
    ...base, solution: endOnChoice(base.solution, O.find(o => o.ok)!.t), input: 'choice', choices: O.map(o => o.t), answer: { kind: 'choice', i: O.findIndex(o => o.ok) },
    check: (r: Response): Verdict => {
      const o = r.kind === 'choice' ? O[r.i] : undefined;
      if (!o) return { ok: false, say: 'Pick one.' };
      return { ok: o.ok, mc: o.mc, say: o.say };
    },
  };
}
const rect = (w: number, h: number): [number, number][] => [[0, 0], [w, 0], [w, h], [0, h]];
/** an L: full width a, full height d, the bottom-right corner cut to (c, b) */
const ell = (a: number, b: number, c: number, d: number): [number, number][] => [[0, 0], [a, 0], [a, b], [c, b], [c, d], [0, d]];
const lab = (v: number | Q, u: string, metric: boolean) => `${vTex(v, metric)}${T(u)}`;
const legTex = (L: Legend) => `\\text{Scale } \\cssId{d}{${vTex(L.d, false)}${T(L.dU)}} : \\cssId{a}{${vTex(L.a, isMetric(L.aU))}${T(L.aU)}}`;
const ratioLegTex = (N: number) => `\\text{Scale } \\cssId{d}{1} : \\cssId{a}{${N}}`;
/** quarter / half values from lo to hi */
function steps(lo: number, hi: number, step: number): number[] { const out: number[] = []; for (let x = lo; x <= hi + 1e-9; x += step) out.push(Number(x.toFixed(4))); return out; }
const UW: Record<string, string> = { in: 'inch', cm: 'centimeter', mm: 'millimeter' };
const an = (w: string) => (/^([aeiou]|L-)/i.test(w) ? 'an ' : 'a ') + w;
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const isQuarter = (x: number) => near(x * 4, Math.round(x * 4));

// ===== 1 scale-copy-factor =====
/** which figure is a scale copy of the original? (grid figures; one true copy, one adds the same amount, one stretches
 * one direction or slants the corners) */
const copy: Gen = (R, n) => {
  const kk = pick(R, [2, 3, 1.5] as const);
  const w = kk === 1.5 ? 2 : int(R, 2, 3), hh = kk === 1.5 ? pick(R, [2, 4].filter(x => x !== w).concat([4])) : int(R, 1, 2) + (kk === 3 ? 0 : 1);
  const W = w * kk, H = hh * kk;
  if (!Number.isInteger(W) || !Number.isInteger(H) || w === hh || W > 9) return copy(R, n);
  const add = int(R, 1, 2);
  const kinds = shuffle(R, ['true', 'add', R() < 0.5 ? 'stretch' : 'slant'] as const);
  const rot = R() < 0.3;   // the true copy turned a quarter turn: still a copy
  const names = ['A', 'B', 'C'];
  const figs: PlanFig[] = [{ pts: rect(w, hh), at: [0, 0], col: 'first', name: 'original' }];
  let x = 0;
  const shapes = kinds.map(k => {
    if (k === 'true') return rot ? rect(H, W) : rect(W, H);
    if (k === 'add') return rect(w + add, hh + add);
    if (k === 'stretch') return rect(W, hh);
    // the slant: the right width and height, the top pushed over by one square (corners not 90°)
    return [[1, 0], [W + 1, 0], [W, H], [0, H]] as [number, number][];
  });
  const rowY = hh + 3;
  shapes.forEach((P, i) => { figs.push({ pts: P, at: [x, rowY], col: 'second', name: names[i]! }); x += Math.max(...P.map(v => v[0])) + 2; });
  const right = kinds.indexOf('true');
  const say: Record<string, Opt> = {
    true: { t: '', ok: true, say: `Yes: every side is ${dec(kk)} times as long${rot ? ' (the copy is turned, which is fine)' : ''}, and every corner is still square.` },
    add: { t: '', ok: false, mc: MC.additive, say: `That one adds ${add} to every side. Adding keeps the difference, not the shape: a copy multiplies every side by the same number.` },
    stretch: { t: '', ok: false, mc: MC.sameName, say: `That one is still a rectangle, but only its width grew. A scale copy multiplies every length by the same number.` },
    slant: { t: '', ok: false, mc: MC.ratiosOnly, say: `It has the right width and height, but its corners are not square any more. A scale copy keeps every angle.` },
  };
  const opts: Opt[] = kinds.map((k, i) => ({ ...say[k]!, t: `${names[i]}` }));
  return choiceItem(R, {
    id: `copy-${n}`, family: 'copy',
    prompt: `Count the squares. Which figure is a ${S('scale copy')} of the ${A('original')}?`,
    board: `\\text{every length} \\times k`,
    picture: { kind: 'plan', plan: { unit: 'cm', figs, maxPx: 56 } },
    solution: [`The original is ${w} by ${hh} squares.`, `Copy ${names[right]} is ${rot ? `${H} by ${W}` : `${W} by ${H}`}: both sides × ${dec(kk)}, and every corner is still square.`],
  }, opts, true);
};
/** finish a scale copy: the missing side (or the angle) */
const copyLen: Gen = (R, n) => {
  const v = int(R, 0, 3);
  if (v === 3) {
    // an angle in a copy
    const ang = pick(R, [60, 70, 110, 120, 45, 135]), k = pick(R, [2, 3, 0.5]);
    const ans = ang;
    return {
      id: `copyLen-${n}`, family: 'copyLen',
      prompt: `A shape has a corner of ${A(`${ang}°`)}. A scale copy of it has every side ${k === 0.5 ? 'half as long' : `${k} times as long`}. How big is that corner in the copy?`,
      board: `${ang}^\\circ \\to\\ ?^\\circ`, input: 'num', unit: '°', answer: { kind: 'num', v: ans },
      solution: [`A scale copy multiplies lengths, not angles.`, `The corner stays ${ans}°.`],
      work: `\\text{angle stays } \\cssId{s}{${ans}^\\circ}`,
      check: valCheck(ans, `Right: angles stay the same in a scale copy. Only lengths are multiplied.`, [
        { v: ang * k, mc: MC.angles, say: `That multiplies the angle too. A scale copy multiplies the lengths; the corners keep their size.` },
        { v: ang / k, mc: MC.angles, say: `Angles don't change in a scale copy, only lengths do.` },
      ], `Lengths are multiplied; angles stay. Try again.`),
    };
  }
  let k = 2, w = 2, h = 3;
  for (let t = 0; t < 50; t++) {
    k = pick(R, [2, 3, 1.5, 0.5, 2.5]); w = int(R, 2, 6); h = int(R, 2, 6);
    if (w !== h && Number.isInteger(w * k) && Number.isInteger(h * k) && Math.max(w * k, h * k) <= 10 && w + w * k <= 14) break;
  }
  const W = w * k, H = h * k;
  const ans = H;
  const metric = R() < 0.5, u = metric ? 'cm' : 'in';
  const figs: PlanFig[] = [
    { pts: rect(w, h), at: [0, 0], col: 'first', labels: [lab(w, u, metric), null, null, lab(h, u, metric)], name: 'original' },
    { pts: rect(W, H), at: [w + 4, 0], col: 'second', labels: [lab(W, u, metric), '?', null, null], labelCol: 'second', labels2: [null, lab(H, u, metric), null, null], label2Col: 'link', name: 'copy' },
  ];
  return {
    id: `copyLen-${n}`, family: 'copyLen',
    prompt: `The ${B('copy')} is a scale copy of the ${A('original')} (${A(`${w} ${u}`)} by ${A(`${h} ${u}`)}). The ${A(`${w} ${u}`)} side became ${B(`${dec(W)} ${u}`)}. How long is the copy's other side?`,
    board: `${w} \\to ${dec(W)},\\quad ${h} \\to\\ ?`, unit: u, ...answerOf(ans, true),
    picture: { kind: 'plan', plan: { unit: 'cm', figs, grid: false }, solve: ['labels2'] },
    solution: [`The scale factor is ${dec(W)} ÷ ${w} = ${dec(k)}.`, `Every length is multiplied by ${dec(k)}: ${h} × ${dec(k)} = ${dec(ans)} ${u}.`],
    work: `${h} \\times ${dec(k)} = \\cssId{s}{${dec(ans)}}`,
    check: valCheck(ans, `Right: ${h} × ${dec(k)} = ${dec(ans)} ${u}. Same factor for every side.`, [
      { v: h + (W - w), mc: MC.additive, say: `That adds ${dec(W - w)}, like the first side grew. A scale copy multiplies: the factor is ${dec(W)} ÷ ${w} = ${dec(k)}.` },
      { v: h, mc: MC.someSides, say: `That side has to change too: every length is multiplied by the same factor, ${dec(k)}.` },
    ], `Find the factor (${dec(W)} ÷ ${w}), then use it on the other side.`),
  };
};

// ===== 2 scale-legend =====
interface LegendCase { L: Legend; ctx: string }
function legendCase(R: () => number): LegendCase {
  const v = int(R, 0, 4);
  if (v === 0) return { L: legend(1, 'in', pick(R, [2, 3, 4, 5, 6, 8, 10]), 'ft'), ctx: `a floor plan of a ${pick(R, ROOMS)}` };
  if (v === 1) return { L: legend(1, 'in', pick(R, [1, 2, 3, 5]), 'yd'), ctx: `a plan of a ${pick(R, YARDS)}` };
  if (v === 2) return { L: legend(1, 'cm', pick(R, [1, 2, 3, 4, 5, 10]), 'm'), ctx: `a plan of a ${pick(R, YARDS)}` };
  if (v === 3) return { L: legend(1, 'cm', pick(R, [2, 5, 10, 20]), 'km'), ctx: `a hiking map` };
  return { L: legend(pick(R, [2, 5, 10]), 'cm', 1, 'mm'), ctx: `a drawing of ${pick(R, ['an ant', 'a ladybug', 'a flea', 'a bee'])} under a microscope` };
}
const legend_: Gen = (R, n) => {
  const v = int(R, 0, 3);
  if (v === 3) {
    // a unitless model scale: direction
    const N = pick(R, [12, 18, 24, 32, 48, 64, 100]);
    const thing = pick(R, ['model car', 'model train', 'dollhouse', 'model ship', 'model plane']);
    return choiceItem(R, {
      id: `legend-${n}`, family: 'legend',
      prompt: `${cap(an(thing))} is built at the scale ${A(`1 : ${N}`)}. What does that tell you?`,
      board: `\\text{model} : \\text{real} = \\cssId{d}{1} : \\cssId{a}{${N}}`,
      solution: [`A scale lists the drawing (the model) first, the real thing second.`, `So 1 inch of model stands for ${N} inches of the real thing: the model is smaller, and the real one is ${N} times as long.`],
    }, [
      { t: `The model is smaller: the real one is ${N} times as long`, ok: true, say: `Yes: model first, real second. 1 of model stands for ${N} of real.` },
      { t: `The model is larger: it is ${N} times as long as the real one`, ok: false, mc: MC.reverse, say: `That reads the scale backwards. The first number is the model: 1 of model stands for ${N} of the real thing.` },
      { t: `The real one is ${N - 1} inches longer than the model`, ok: false, mc: MC.additive, say: `A scale multiplies, it doesn't add: every length of the real thing is ${N} times the model's.` },
    ]);
  }
  const { L, ctx } = legendCase(R);
  const N = ratioN(L), big = qNum(N) < 1;
  const right = ratioText(L);
  const mixedT = big ? `${vText(L.d, false)} : ${vText(L.a, true)}` : `${vText(L.d, false)} : ${vText(L.a, isMetric(L.aU))}`;
  const rev = big ? `1 : ${dec(1 / qNum(N))}` : `${dec(N)} : 1`;
  const opts: Opt[] = [
    { t: right, ok: true, say: `Yes: in one unit, ${legendText2(L)} is ${right}. ${big ? 'The drawing is larger than the real thing.' : 'The drawing is smaller than the real thing.'}` },
    { t: mixedT, ok: false, mc: MC.mixed, say: `Those two numbers are in different units (${L.dU} and ${L.aU}). Write both in ${L.dU === 'in' ? 'inches' : L.dU === 'cm' && L.aU !== 'mm' ? 'centimeters' : 'millimeters'} first.` },
    { t: rev, ok: false, mc: MC.reverse, say: `That puts the real thing first. A scale goes drawing : real, so it is ${right}.` },
  ];
  if (new Set(opts.map(o => o.t)).size < 3) return legend_(R, n);
  return choiceItem(R, {
    id: `legend-${n}`, family: 'legend',
    prompt: `On ${ctx}, ${A(`${vHtml(L.d, false)} ${L.dU}`)} represents ${B(`${vHtml(L.a, isMetric(L.aU))} ${L.aU}`)}. Which ratio is the same scale, written in one unit (drawing : real)?`,
    board: legTex(L).replace('\\text{Scale } ', ''),
    picture: L.d.q === 1 && L.d.p === 1 && L.aU !== 'mm' ? rulerLegendPic(L, 4) : undefined,
    solution: unitSteps(L),
    work: unitIn(L.aU, L.dU) < 1
      ? `${dec(qNum(L.d) / unitIn(L.aU, L.dU))} : ${vTex(L.a, true)} = \\cssId{s}{${right.replace(/ /g, '')}}`
      : `${vTex(L.d, false)} : ${dec(qNum(L.a) * unitIn(L.aU, L.dU))} = \\cssId{s}{${right.replace(/ /g, '')}}`,
  }, opts);
};
/** "1 in represents 4 ft" in plain words */
const legendText2 = (L: Legend) => `${vText(L.d, false)} ${L.dU} to ${vText(L.a, isMetric(L.aU))} ${L.aU}`;
/** how many `to` units in one `from` unit */
const unitIn = (from: AU, to: AU | 'in' | 'cm' | 'mm') => qNum(convert(1, from, to as AU));
function unitSteps(L: Legend): string[] {
  const inD = unitIn(L.aU, L.dU);
  if (inD < 1) {
    // an enlargement (cm on paper for mm of bug): write the drawing part in the small unit
    const dIn = qNum(L.d) / inD;
    return [
      `Write the drawing part in ${L.aU}: ${vText(L.d, false)} ${L.dU} = ${dec(dIn)} ${L.aU}.`,
      `So ${dec(dIn)} ${L.aU} : ${vText(L.a, true)} ${L.aU}, which is ${ratioText(L)}: the drawing is larger.`,
    ];
  }
  return [
    `Write the real part in ${L.dU}: ${vText(L.a, isMetric(L.aU))} ${L.aU} = ${dec(qNum(L.a) * inD)} ${L.dU}.`,
    `So ${vText(L.d, false)} ${L.dU} : ${dec(qNum(L.a) * inD)} ${L.dU}, which is ${ratioText(L)}.`,
  ];
}
/** the ruler with its real-length row: the legend made visible */
function rulerLegendPic(L: Legend, len: number): Pic {
  const ruler: RulerSpec = { len, ticks: L.dU === 'in' ? 4 : 2, seg: [0, 1], actual: { per: qNum(perUnit(L)), unit: L.aU } };
  return { kind: 'plan', plan: { unit: L.dU === 'in' ? 'in' : 'cm', figs: [], sheet: false, ruler, legend: legTex(L), maxPx: 170 } };
}
const legendNum: Gen = (R, n) => {
  const v = int(R, 0, 5);
  const L = v === 0 ? legend(1, 'in', pick(R, [2, 3, 4, 5, 6, 8, 10]), 'ft')
    : v === 1 ? legend(1, 'cm', pick(R, [2, 4, 5, 10, 20, 50]), 'm')
      : v === 2 ? legend(1, 'in', pick(R, [1, 2, 3, 4]), 'yd')
        : v === 3 ? legend(1, 'cm', pick(R, [1, 2, 5, 10]), 'km')
          : v === 4 ? legend(2, 'in', pick(R, [3, 5, 7, 9]), 'ft')
            : legend(2, 'cm', pick(R, [3, 5, 7, 9]), 'm');
  const N = qNum(ratioN(L)), d = qNum(L.d), a = qNum(L.a);
  return {
    id: `legendNum-${n}`, family: 'legendNum',
    prompt: `${A(`${d} ${L.dU}`)} represents ${B(`${dec(a)} ${L.aU}`)}. Write it as a ratio in one unit: 1 : ?`,
    board: `\\cssId{d}{${d}${T(L.dU)}} : \\cssId{a}{${dec(a)}${T(L.aU)}} = 1 : \\ ?`,
    input: 'num', unit: '', answer: { kind: 'num', v: N },
    picture: d === 1 && L.aU !== 'km' ? rulerLegendPic(L, 4) : undefined,
    solution: d === 1 ? unitSteps(L) : [...unitSteps(L), `Divide both parts by ${d}: 1 : ${N}.`],
    work: `${dec(a)}${T(L.aU)} = ${dec(a * unitIn(L.aU, L.dU))}${T(L.dU)}${d === 1 ? '' : ` \\div ${d}`} \\to 1 : \\cssId{s}{${N}}`,
    check: valCheck(N, `Right: ${dec(a)} ${L.aU} is ${dec(a * unitIn(L.aU, L.dU))} ${L.dU}${d === 1 ? '' : `, and ${d} : ${dec(a * unitIn(L.aU, L.dU))} is 1 : ${N}`}.`, [
      { v: a / d, mc: MC.mixed, say: `${dec(a)} is in ${L.aU}, but the ${d} is in ${L.dU}. Change ${dec(a)} ${L.aU} into ${L.dU} first.` },
      { v: a * unitIn(L.aU, L.dU), say: `That's ${dec(a)} ${L.aU} in ${L.dU}, for ${d} ${L.dU}. One ${L.dU} is half of that.` },
      { v: 1 / N, mc: MC.reverse, say: `That turns the ratio around. The drawing is the 1; the real length is the big number.` },
    ], `Change ${dec(a)} ${L.aU} into ${L.dU === 'in' ? 'inches' : 'centimeters'}.`),
  };
};

// ===== 3 drawing-to-actual =====
interface PlanCase { L: Legend; w: Q; h: Q; place: string; metric: boolean }
/** a rectangular plan whose sides land on quarter inches / half centimeters */
function planCase(R: () => number, v: 'whole' | 'part' | 'metric'): PlanCase {
  if (v === 'metric') {
    const k = pick(R, [2, 3, 4, 5, 10]);
    const w = pick(R, steps(3, 8, 0.5)), h = pick(R, steps(2, 4.5, 0.5));
    return { L: legend(1, 'cm', k, 'm'), w: q(w), h: q(h), place: pick(R, YARDS), metric: true };
  }
  if (v === 'whole') {
    const k = pick(R, [2, 3, 4, 5, 6, 8]);
    return { L: legend(1, 'in', k, 'ft'), w: q(int(R, 3, 6)), h: q(int(R, 2, 3)), place: pick(R, ROOMS), metric: false };
  }
  const k = pick(R, [2, 4, 6, 8]);
  const frac = k % 4 === 0 ? pick(R, [0.25, 0.5, 0.75]) : 0.5;
  return { L: legend(1, 'in', k, 'ft'), w: q(int(R, 2, 5) + frac), h: q(int(R, 2, 3) + (R() < 0.5 ? 0.5 : 0)), place: pick(R, ROOMS), metric: false };
}
/** the plan picture: the room with its drawn side (amber) and '?' for the real one; ruler under it */
function planPic(c: PlanCase, o: { ruler?: boolean; askReal?: boolean; dashed?: boolean; grid?: boolean } = {}): Pic {
  const { L, w, h, metric } = c;
  const u = L.dU;
  const real = (x: Q) => lab(toActual(L, x), L.aU, metric);
  const fig: PlanFig = {
    pts: rect(qNum(w), qNum(h)), col: 'first', right: true,
    labels: [lab(w, u, metric), lab(h, u, metric), null, null],
    labels2: o.askReal ? [real(w), null, null, null] : [real(w), real(h), null, null],
  };
  const ruler: RulerSpec | undefined = o.ruler ? { len: Math.ceil(qNum(w)), ticks: u === 'in' ? 4 : 2, seg: [0, qNum(w)], actual: { per: qNum(perUnit(L)), unit: L.aU, every: perUnitEvery(L, Math.ceil(qNum(w))) }, proj: { fig: 0, side: 2 } } : undefined;
  return { kind: 'plan', plan: { unit: u === 'in' ? 'in' : 'cm', figs: [fig], legend: legTex(L), ruler, grid: o.grid }, solve: o.ruler ? ['labels2', 'seg', 'actual'] : ['labels2'], side: { fig: 0, side: 0 } };
}
/** show the real lengths under every unit, or every other one when the numbers get wide */
const perUnitEvery = (L: Legend, len: number) => (qNum(perUnit(L)) * len >= 100 && len > 5 ? 2 : 1);
const toActual_: Gen = (R, n) => {
  const v = int(R, 0, 3);
  if (v === 3) {
    // a model / plan with a unitless scale: the answer needs a unit conversion
    const metric = R() < 0.5;
    if (metric) {
      const N = pick(R, [50, 100, 200]), d = pick(R, steps(2, 9, 0.5));
      const cm = d * N, ans = cm / 100;
      const place = pick(R, YARDS);
      return {
        id: `toActual-${n}`, family: 'toActual',
        prompt: `A plan of ${an(place)} uses the scale ${A(`1 : ${N}`)}. A path on the plan is ${A(`${dec(d)} cm`)} long. How long is the real path, in ${B('meters')}?`,
        board: `\\cssId{d}{${dec(d)}${T('cm')}} \\times ${N} = \\ ?${T('m')}`, input: 'num', unit: 'm', answer: { kind: 'num', v: ans },
        solution: [`1 : ${N} means every length is × ${N}: ${dec(d)} cm × ${N} = ${dec(cm)} cm.`, `100 cm = 1 m, so ${dec(cm)} cm = ${dec(ans)} m.`],
        work: `${dec(cm)}${T('cm')} = \\cssId{s}{${dec(ans)}}${T('m')}`,
        check: valCheck(ans, `Right: ${dec(cm)} cm = ${dec(ans)} m.`, [
          { v: cm, mc: MC.wrongUnit, say: `${dec(cm)} is the real length in centimeters. The question asks for meters: 100 cm = 1 m.` },
          { v: d / N, mc: MC.divRate, say: `The real path is longer than the plan: multiply by ${N}, don't divide.` },
          { v: d, mc: MC.drawAsActual, say: `${dec(d)} is the length on the plan. Use the scale to get the real one.` },
        ], `Multiply by ${N}, then change centimeters into meters.`),
      };
    }
    const N = pick(R, [12, 24, 36, 48]), d = pick(R, N === 12 ? steps(3, 9, 1) : steps(2, 8, 0.5)), inch = d * N, ans = inch / 12;
    if (!Number.isInteger(ans)) return toActual_(R, n);
    const thing = pick(R, ['model car', 'model boat', 'model of a bus', 'model of a fire truck']);
    return {
      id: `toActual-${n}`, family: 'toActual',
      prompt: `${cap(an(thing))} is built at the scale ${A(`1 : ${N}`)}. The model is ${A(`${vHtml(d, false)} in`)} long. How long is the real one, in ${B('feet')}?`,
      board: `\\cssId{d}{${vTex(d, false)}${T('in')}} \\times ${N} = \\ ?${T('ft')}`, input: 'num', unit: 'ft', answer: { kind: 'num', v: ans },
      solution: [`1 : ${N} means every length is × ${N}: ${vText(d, false)} in × ${N} = ${inch} in.`, `12 in = 1 ft, so ${inch} in = ${ans} ft.`],
      work: `${inch}${T('in')} = \\cssId{s}{${ans}}${T('ft')}`,
      check: valCheck(ans, `Right: ${inch} in = ${ans} ft.`, [
        { v: inch, mc: MC.wrongUnit, say: `${inch} is the real length in inches. The question asks for feet: 12 in = 1 ft.` },
        { v: d / N, mc: MC.divRate, say: `The real one is bigger than the model: multiply by ${N}.` },
        { v: d * N / 36, mc: MC.wrongUnit, say: `That changes inches into yards. The question asks for feet: 12 in = 1 ft.` },
      ], `Multiply by ${N}, then change inches into feet.`),
    };
  }
  const c = planCase(R, v === 0 ? 'whole' : v === 1 ? 'part' : 'metric');
  const { L, w, metric } = c;
  const k = qNum(perUnit(L)), ans = toActual(L, w), d = qNum(w), u = L.dU, au = L.aU;
  return {
    id: `toActual-${n}`, family: 'toActual',
    prompt: `On a plan of ${an(c.place)}, ${A(`1 ${u}`)} represents ${B(`${k} ${au}`)}. The long side is ${A(`${vHtml(w, metric)} ${u}`)} on the plan. How long is the real side?`,
    board: `\\cssId{d}{${vTex(w, metric)}${T(u)}} \\to\\ ?${T(au)}`, unit: au, ...answerOf(ans, metric),
    picture: planPic(c, { ruler: true, askReal: true }),
    solution: [`Every ${UW[u]} on the plan stands for ${k} ${au}.`, `${vText(w, metric)} × ${k} = ${vText(ans, metric)} ${au}.`],
    work: `${vTex(w, metric)} \\times ${k} = \\cssId{s}{${vTex(ans, metric)}}${T(au)}`,
    check: valCheck(ans, `Right: ${vText(w, metric)} × ${k} = ${vText(ans, metric)} ${au}.`, [
      { v: d + k - 1, mc: MC.additive, say: `1 becoming ${k} is not "add ${k - 1}": it is "times ${k}". Every ${u} stands for ${k} ${au}.` },
      { v: d + k, mc: MC.additive, say: `Adding the scale number doesn't work: every ${u} stands for ${k} ${au}, so multiply.` },
      { v: d / k, mc: MC.divRate, say: `The real ${c.place} is bigger than the plan: multiply by ${k}, don't divide.` },
      { v: d, mc: MC.drawAsActual, say: `${vText(w, metric)} is the length on the plan. Each ${UW[u]} of it stands for ${k} ${au}.` },
    ], `Each ${UW[u]} on the plan stands for ${k} ${au}: multiply.`),
  };
};

// ===== 4 actual-to-drawing =====
const toDrawing_: Gen = (R, n) => {
  const v = int(R, 0, 3);
  let L: Legend, d: number, place: string, round = false, real: number;
  if (v === 0) { const k = pick(R, [2, 3, 4, 5, 6, 8, 10]); d = int(R, 2, 7); L = legend(1, 'in', k, 'ft'); real = d * k; place = pick(R, ROOMS); }
  else if (v === 1) { const k = pick(R, [4, 8]); d = int(R, 2, 5) + pick(R, [0.25, 0.5, 0.75]); L = legend(1, 'in', k, 'ft'); real = d * k; place = pick(R, ROOMS); }
  else if (v === 2) { const k = pick(R, [2, 4, 10]); d = int(R, 2, 8) + 0.5; L = legend(1, 'cm', k, 'm'); real = d * k; place = pick(R, YARDS); }
  else {
    // computation only, rounded to the nearest quarter inch
    const k = pick(R, [3, 6, 7, 9]);
    let r = 0, ex = 0;
    for (let t = 0; t < 40; t++) { r = int(R, 10, 40); ex = r / k; const f = ex * 4 - Math.floor(ex * 4); if (f > 0.08 && f < 0.42 || f > 0.58 && f < 0.92) break; }
    real = r; L = legend(1, 'in', k, 'ft'); d = Math.round(ex * 4) / 4; round = true; place = pick(R, ROOMS);
  }
  const metric = isMetric(L.aU), k = qNum(perUnit(L)), u = L.dU, au = L.aU;
  const ans = q(d);
  const exact = real / k;
  return {
    id: `toDrawing-${n}`, family: 'toDrawing',
    prompt: `A real wall of ${an(place)} is ${B(`${dec(real)} ${au}`)} long. The plan's scale is ${A(`1 ${u}`)} represents ${B(`${k} ${au}`)}. How long do you draw it on the plan${round ? ', to the nearest quarter inch' : ''}?`,
    board: `\\cssId{a}{${dec(real)}${T(au)}} \\to\\ ?${T(u)}`, unit: u, ...answerOf(ans, metric),
    picture: round ? undefined : (() => {
      const h = metric ? 2.5 : 2;
      const fig: PlanFig = { pts: rect(d, h), col: 'first', dashed: true, labels: [lab(real, au, metric), null, null, null], labelCol: 'second', labels2: [lab(ans, u, metric), null, null, null], label2Col: 'first' };
      return { kind: 'plan', plan: { unit: u === 'in' ? 'in' : 'cm', figs: [fig], legend: legTex(L), grid: false, ruler: { len: Math.ceil(d), ticks: u === 'in' ? 4 : 2, seg: [0, d], actual: { per: k, unit: au, every: perUnitEvery(L, Math.ceil(d)) } } }, solve: ['labels2', 'ruler', 'seg', 'actual'] } as Pic;
    })(),
    solution: [`Every ${UW[u]} on the plan stands for ${k} ${au}, so ask: how many ${k}s fit in ${dec(real)}?`, `${dec(real)} ÷ ${k} = ${round ? `${dec(Number(exact.toFixed(3)))}…, about ${S(`${vHtml(ans, false)} ${u}`)}` : S(`${vHtml(ans, metric)} ${u}`)}.`],
    work: `${dec(real)} \\div ${k} ${round ? '\\approx' : '='} \\cssId{s}{${vTex(ans, metric)}}${T(u)}`,
    check: valCheck(ans, `Right: ${dec(real)} ÷ ${k} ${round ? `is about ${vText(ans, false)}` : `= ${vText(ans, metric)}`} ${u}.`, [
      { v: real * k, mc: MC.wrongOp, say: `Multiplying makes the drawing bigger than the real wall. Going from real to drawing, divide by ${k}.` },
      { v: k / real, mc: MC.reverse, say: `That divides the wrong way round: ${dec(real)} ${au} ÷ ${k} ${au} per ${u}.` },
      { v: real, mc: MC.drawAsActual, say: `${dec(real)} is the real length. On the plan each ${UW[u]} stands for ${k} ${au}: divide.` },
      ...(round ? [{ v: Math.floor(exact), say: `Round to the nearest quarter inch, not to the nearest inch.` }] : []),
    ], `Divide the real length by ${k}.`),
  };
};

// ===== 5 unit-fraction-legend =====
const fracLegend: Gen = (R, n) => {
  const den = pick(R, [2, 4, 8]);
  const L = legend(q(1 / den), 'in', 1, 'ft');
  const toReal = R() < 0.5;
  const room = pick(R, [...ROOMS, ...YARDS]);
  const legH = `${vHtml(L.d, false)} in`;
  if (toReal) {
    const d = den === 8 ? pick(R, steps(1, 5, 0.125).filter(x => !isQuarter(x))) : den === 4 ? pick(R, steps(1.25, 7, 0.25)) : pick(R, steps(1.5, 8, 0.5));
    const ans = d * den;
    return {
      id: `fracLegend-${n}`, family: 'fracLegend',
      prompt: `On a plan of ${an(room)}, ${A(legH)} represents ${B('1 ft')}. A wall is ${A(`${vHtml(d, false)} in`)} on the plan. How long is the real wall?`,
      board: `\\cssId{d}{${vTex(d, false)}${T('in')}} \\to\\ ?${T('ft')}`, input: 'num', unit: 'ft', answer: { kind: 'num', v: ans },
      picture: rulerFracPic(L, Math.max(2, Math.ceil(d)), d, true),
      solution: [`${vText(L.d, false)} in : 1 ft is the same as 1 in : ${den} ft (multiply both by ${den}).`, `${vText(d, false)} × ${den} = ${S(`${vHtml(ans, false)} ft`)}.`],
      work: `${vTex(d, false)} \\times ${den} = \\cssId{s}{${ans}}${T('ft')}`,
      check: valCheck(ans, `Right: 1 in stands for ${den} ft, and ${vText(d, false)} × ${den} = ${ans} ft.`, [
        { v: d / den, mc: MC.wrongOp, say: `Multiplying by ${vText(L.d, false)} makes the real wall smaller than the drawing. Each inch stands for ${den} ft: multiply by ${den}.` },
        { v: d, mc: MC.drawAsActual, say: `${vText(d, false)} is the drawn length. Each inch of it stands for ${den} ft.` },
      ], `Rewrite the scale as 1 in : ${den} ft first.`),
    };
  }
  const real = den === 8 ? int(R, 9, 60) : den === 4 ? int(R, 6, 30) : int(R, 3, 16);
  const ans = q(real / den);
  return {
    id: `fracLegend-${n}`, family: 'fracLegend',
    prompt: `A plan of ${an(room)} uses ${A(legH)} represents ${B('1 ft')}. A real wall is ${B(`${real} ft`)} long. How long do you draw it?`,
    board: `\\cssId{a}{${real}${T('ft')}} \\to\\ ?${T('in')}`, unit: 'in', ...answerOf(ans, false),
    picture: qNum(ans) <= 8 ? rulerFracPic(L, Math.max(2, Math.ceil(qNum(ans))), qNum(ans), false) : undefined,
    solution: [`Every foot is drawn ${vText(L.d, false)} in long.`, `${real} × ${vText(L.d, false)} = ${S(`${vHtml(ans, false)} in`)}.`],
    work: `${real} \\times \\tfrac{1}{${den}} = \\cssId{s}{${vTex(ans, false)}}${T('in')}`,
    check: valCheck(ans, `Right: ${real} feet, each ${vText(L.d, false)} in long: ${vText(ans, false)} in.`, [
      { v: real * den, mc: MC.wrongOp, say: `That divides by ${vText(L.d, false)}, which makes the drawing bigger than the wall. Each foot is drawn ${vText(L.d, false)} in: multiply by ${vText(L.d, false)}.` },
      { v: real, mc: MC.drawAsActual, say: `${real} is the real length in feet. Each foot is only ${vText(L.d, false)} in on the plan.` },
    ], `Each foot is drawn ${vText(L.d, false)} in long.`),
  };
};
/** the ruler: the fraction legend lit on its first piece, the real row (feet per inch) appears in the solution */
function rulerFracPic(L: Legend, len: number, seg: number, real: boolean): Pic {
  const den = qNum(perUnit(L));
  return {
    kind: 'plan',
    plan: { unit: 'in', figs: [], sheet: false, ruler: { len, ticks: 8, seg: [0, seg], actual: { per: den, unit: 'ft', every: den * len >= 40 ? 2 : 1 } }, legend: legTex(L), maxPx: 170 },
    solve: ['seg', 'actual'],
  };
  void real;
}
const fracRewrite: Gen = (R, n) => {
  const den = pick(R, [2, 4, 8]);
  const L = legend(q(1 / den), 'in', 1, 'ft');
  const lt = vText(L.d, false);
  if (R() < 0.5) {
    return choiceItem(R, {
      id: `fracRewrite-${n}`, family: 'fracRewrite',
      prompt: `A plan uses ${A(`${vHtml(L.d, false)} in`)} represents ${B('1 ft')}. Which scale means the same?`,
      board: legTex(L).replace('\\text{Scale } ', ''),
      picture: rulerFracPic(L, 3, 1 / den, true),
      solution: [`Multiply both parts by ${den}: ${lt} in × ${den} = 1 in, and 1 ft × ${den} = ${den} ft.`, `So 1 in represents ${den} ft.`],
    }, [
      { t: `1 in represents ${den} ft`, ok: true, say: `Yes: ${den} pieces of ${lt} in make 1 in, and they stand for ${den} ft.` },
      { t: `1 in represents ${lt} ft`, ok: false, mc: MC.wrongOp, say: `One inch is ${den} pieces of ${lt} in, so it stands for ${den} feet, not ${lt} of a foot.` },
      { t: `${den} in represents 1 ft`, ok: false, mc: MC.reverse, say: `That would make 1 foot drawn ${den} inches long: a drawing bigger than the room. Multiply BOTH parts by ${den}.` },
    ]);
  }
  const N = 12 * den;
  return choiceItem(R, {
    id: `fracRewrite-${n}`, family: 'fracRewrite',
    prompt: `${A(`${vHtml(L.d, false)} in`)} represents ${B('1 ft')}. Written in one unit, the scale is …`,
    board: legTex(L).replace('\\text{Scale } ', ''),
    solution: [`First a whole inch: 1 in represents ${den} ft.`, `${den} ft = ${N} in, so the scale is 1 : ${N}.`],
  }, [
    { t: `1 : ${N}`, ok: true, say: `Yes: 1 in represents ${den} ft, and ${den} ft is ${N} in.` },
    { t: `1 : ${den}`, ok: false, mc: MC.mixed, say: `1 in : ${den} ft mixes inches and feet. ${den} ft = ${N} in.` },
    { t: `1 : 12`, ok: false, mc: MC.wrongOp, say: `1 : 12 would be 1 in for 1 ft. Here ${lt} in is 1 ft, so 1 in is ${den} ft = ${N} in.` },
  ]);
};

// ===== 6 draw-computed-length =====
const ruler: Gen = (R, n) => {
  const metric = R() < 0.4;
  const v = int(R, 0, 2);
  const t = metric ? 2 : 4, step = 1 / t, u = metric ? 'cm' : 'in';
  if (v === 2) {
    // read a drawn segment from a nonzero start: count the spaces
    const len = metric ? 12 : 6;
    const s = metric ? int(R, 1, 3) : int(R, 1, 2), e = metric ? pick(R, steps(s + 2, len, 0.5)) : pick(R, steps(s + 1.25, len, 0.25).filter(x => !Number.isInteger(x)));
    const ans = q(e - s);
    return {
      id: `ruler-${n}`, family: 'ruler',
      prompt: `A drawn segment starts at the ${A(`${s} ${u}`)} mark and ends at the ${A(`${vHtml(e, metric)} ${u}`)} mark. How long is it?`,
      board: `${vTex(e, metric)} - ${s} = \\ ?`, unit: u, ...answerOf(ans, metric),
      picture: { kind: 'plan', plan: { unit: metric ? 'cm' : 'in', figs: [], sheet: false, ruler: { len, ticks: t, seg: [s, e], start: s } }, solve: [] },
      solution: [`The segment does not start at 0, so its end mark is not its length.`, `Length = end − start = ${vText(e, metric)} − ${s} = ${S(`${vHtml(ans, metric)} ${u}`)}.`],
      work: `${vTex(e, metric)} - ${s} = \\cssId{s}{${vTex(ans, metric)}}${T(u)}`,
      check: valCheck(ans, `Right: from ${s} to ${vText(e, metric)} is ${vText(ans, metric)} ${u}.`, [
        { v: e, mc: MC.rulerEnd, say: `${vText(e, metric)} is where it ends. It started at ${s}, not at 0: subtract.` },
        { v: e - s + step, mc: MC.points, say: `That counts one mark too many. Count the spaces between the marks, or subtract: ${vText(e, metric)} − ${s}.` },
      ], `Subtract the start from the end.`),
    };
  }
  const len = metric ? 12 : 7;
  const X = metric ? pick(R, steps(3, 8, 0.5)) : pick(R, steps(2.25, 4.75, 0.25).filter(x => !Number.isInteger(x)));
  const s0 = v === 0 ? 0 : metric ? int(R, 1, 3) : int(R, 1, 2);
  const end = s0 + X;
  if (end > len) return ruler(R, n);
  const opts: Opt[] = s0 === 0
    ? [
      { t: `${vText(end, metric)} ${u}`, ok: true, say: `Yes: from 0 to ${vText(end, metric)} is ${vText(X, metric)} ${u}.` },
      { t: `${vText(end - step, metric)} ${u}`, ok: false, mc: MC.points, say: `That is one mark short: the 0 mark is the start, it is not the first ${vText(step, metric)}. Count spaces, not marks.` },
      { t: `${vText(end + 1, metric)} ${u}`, ok: false, mc: MC.rulerEnd, say: `That starts counting at the 1 mark. A length starts at 0.` },
    ]
    : [
      { t: `${vText(end, metric)} ${u}`, ok: true, say: `Yes: start + length = ${s0} + ${vText(X, metric)} = ${vText(end, metric)}.` },
      { t: `${vText(X, metric)} ${u}`, ok: false, mc: MC.rulerEnd, say: `That ends where a segment from 0 would end. This one starts at ${s0}: add.` },
      { t: `${vText(end - step, metric)} ${u}`, ok: false, mc: MC.points, say: `That is one mark short. The start mark doesn't count as a space: ${s0} + ${vText(X, metric)} = ${vText(end, metric)}.` },
    ];
  return choiceItem(R, {
    id: `ruler-${n}`, family: 'ruler',
    prompt: `You draw a segment ${S(`${vHtml(X, metric)} ${u}`)} long${s0 ? `, starting at the ${A(`${s0} ${u}`)} mark` : ' from the 0 mark'}. At which mark do you stop?`,
    board: `${s0} + ${vTex(X, metric)} = \\ ?`,
    picture: { kind: 'plan', plan: { unit: metric ? 'cm' : 'in', figs: [], sheet: false, ruler: { len, ticks: t, seg: [s0, end], start: s0 } }, solve: ['seg'] },
    solution: [`Put the start at ${s0} and count ${vText(X, metric)} ${u} of spaces.`, `${s0} + ${vText(X, metric)} = ${vText(end, metric)}: stop at the ${vText(end, metric)} mark.`],
    work: `${s0} + ${vTex(X, metric)} = \\cssId{s}{${vTex(end, metric)}}`,
  }, opts);
};

// ===== 7 make-scale-drawing =====
const makePlan: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 2) {
    const ang = pick(R, [60, 120, 135, 45, 110, 70]), k = pick(R, [2, 4, 8]);
    return {
      id: `makePlan-${n}`, family: 'makePlan',
      prompt: `A corner of a real deck measures ${B(`${ang}°`)}. You draw the deck at ${A('1 in')} represents ${B(`${k} ft`)}. What angle do you draw at that corner?`,
      board: `${ang}^\\circ \\to\\ ?^\\circ`, input: 'num', unit: '°', answer: { kind: 'num', v: ang },
      // the deck's plan, still in pencil: the corner at the bottom left is the one to draw
      picture: (() => {
        const h = 2.5, w = 5, c = Number((h / Math.tan((ang * Math.PI) / 180)).toFixed(3));
        const fig: PlanFig = { pts: [[c, 0], [w, 0], [w, h], [0, h]], col: 'first', dashed: true, angles: [{ at: 3, text: '?', text2: `${ang}°` }] };
        return { kind: 'plan', plan: { unit: 'in', figs: [fig], grid: false, legend: legTex(legend(1, 'in', k, 'ft')) }, solve: ['labels2'] } as Pic;
      })(),
      solution: [`A scale drawing shrinks lengths, not turns.`, `The corner is drawn ${ang}°, with a protractor.`],
      work: `\\text{angle stays } \\cssId{s}{${ang}^\\circ}`,
      check: valCheck(ang, `Right: the plan keeps every angle. Only lengths are divided by the scale.`, [
        { v: ang / k, mc: MC.angles, say: `Angles don't shrink with the scale. Only lengths do: the corner stays ${ang}°.` },
        { v: ang * k, mc: MC.angles, say: `Angles don't change with the scale. The corner stays ${ang}°.` },
      ], `A scale drawing keeps every angle.`),
    };
  }
  const k = pick(R, [2, 4, 8]), L = legend(1, 'in', k, 'ft');
  const st = k === 2 ? 0.5 : 0.25;
  const dW = pick(R, steps(2.5, 6, st)), dH0 = pick(R, steps(k === 2 ? 1.5 : 1.25, dW - 0.5, st));
  const W = dW * k, H = dH0 * k;
  if (!Number.isInteger(W) || !Number.isInteger(H) || dW <= dH0) return makePlan(R, n);
  const room = pick(R, ROOMS);
  if (v === 0) {
    const fig: PlanFig = { pts: rect(dW, dH0), col: 'first', dashed: true, labels: [lab(W, 'ft', false), lab(H, 'ft', false), null, null], labelCol: 'second', labels2: [lab(dW, 'in', false), lab(dH0, 'in', false), null, null], label2Col: 'first' };
    const opts: Opt[] = [
      { t: `${vText(dW, false)} in by ${vText(dH0, false)} in`, ok: true, say: `Yes: both lengths ÷ ${k}.` },
      { t: `${vText(dW, false)} in by ${H} in`, ok: false, mc: MC.someLengths, say: `The ${H} ft wall has to be scaled too: ${H} ÷ ${k} = ${vText(dH0, false)} in. Every length uses the scale.` },
      { t: `${W * k} in by ${H * k} in`, ok: false, mc: MC.wrongOp, say: `Multiplying makes the plan bigger than the ${room}. Real to plan: divide by ${k}.` },
    ];
    return choiceItem(R, {
      id: `makePlan-${n}`, family: 'makePlan',
      prompt: `${cap(an(room))} is ${B(`${W} ft`)} by ${B(`${H} ft`)}. You draw it at ${A('1 in')} represents ${B(`${k} ft`)}. Which lengths do you draw?`,
      board: `\\cssId{a}{${W}${T('ft')}},\\ \\cssId{a}{${H}${T('ft')}} \\to\\ ?`,
      picture: { kind: 'plan', plan: { unit: 'in', figs: [fig], legend: legTex(L), grid: false }, solve: ['labels2'] },
      solution: [`Real to plan: divide every length by ${k}.`, `${W} ÷ ${k} = ${vText(dW, false)} in and ${H} ÷ ${k} = ${vText(dH0, false)} in.`],
      work: `${W} \\div ${k} = \\cssId{s}{${vTex(dW, false)}}${T('in')},\\ ${H} \\div ${k} = \\cssId{s}{${vTex(dH0, false)}}${T('in')}`,
    }, opts);
  }
  // an L-shaped room: the notch wall is still to be drawn
  const a = dW, d = dH0 + pick(R, [0.5, 1]), b = pick(R, steps(1, d - 1, st)), cc = pick(R, steps(1.5, a - 1, st));
  if (a - cc < 1 || d - b < 1.25 || d > 4.5) return makePlan(R, n);
  const notch = (d - b) * k;
  if (!Number.isInteger(notch) || !Number.isInteger(b * k) || !Number.isInteger(a * k)) return makePlan(R, n);
  const ans = q(d - b);
  // the inner wall of the corner (side 3, upright) is the one still to draw: its label sits in the open corner
  const fig: PlanFig = {
    pts: ell(a, b, cc, d), col: 'first', right: true,
    labels: [lab(a, 'in', false), null, null, lab(notch, 'ft', false), null, lab(d, 'in', false)],
    labelCols: [null, null, null, 'second', null, null], labels2: [null, null, null, lab(ans, 'in', false), null, null], label2Col: 'link',
  };
  return {
    id: `makePlan-${n}`, family: 'makePlan',
    prompt: `You are drawing an L-shaped ${room} at ${A('1 in')} represents ${B(`${k} ft`)}. Some walls are drawn already. The inside wall at the corner is ${B(`${notch} ft`)}. How long do you draw it?`,
    board: `\\cssId{a}{${notch}${T('ft')}} \\to\\ ?${T('in')}`, unit: 'in', ...answerOf(ans, false),
    picture: { kind: 'plan', plan: { unit: 'in', figs: [fig], legend: legTex(L) }, solve: ['labels2'], side: { fig: 0, side: 3 } },
    solution: [`Every wall uses the same scale, the short one too.`, `${notch} ÷ ${k} = ${S(`${vHtml(ans, false)} in`)}.`],
    work: `${notch} \\div ${k} = \\cssId{s}{${vTex(ans, false)}}${T('in')}`,
    check: valCheck(ans, `Right: ${notch} ÷ ${k} = ${vText(ans, false)} in, same scale as every other wall.`, [
      { v: notch, mc: MC.someLengths, say: `${notch} is the real length in feet. This wall needs the scale too: ${notch} ÷ ${k}.` },
      { v: notch * k, mc: MC.wrongOp, say: `Real to plan: divide by ${k}, don't multiply.` },
    ], `Divide the real length by ${k}.`),
  };
};

// ===== 8 rescale-drawing =====
const rescale: Gen = (R, n) => {
  const v = int(R, 0, 2);
  let L1: Legend, L2: Legend, d: number;
  if (v === 0) { const k2 = pick(R, [2, 3]); const k1 = k2 * pick(R, [2, 3]); L1 = legend(1, 'in', k1, 'ft'); L2 = legend(1, 'in', k2, 'ft'); d = pick(R, steps(1, 3, 0.5)); }
  else if (v === 1) { const k1 = pick(R, [2, 3, 4]); const k2 = k1 * pick(R, [2, 4]); L1 = legend(1, 'in', k1, 'ft'); L2 = legend(1, 'in', k2, 'ft'); d = k2 / k1 * pick(R, [1, 1.5, 2, 2.5]); }
  else { const pr = pick(R, [[3, 5], [2, 5], [4, 5], [5, 2], [6, 4]] as const); L1 = legend(1, 'cm', pr[0], 'm'); L2 = legend(1, 'cm', pr[1], 'm'); d = pr[1] * pick(R, [1, 2]) * (pr[0] === 6 ? 1 : 1); }
  const metric = isMetric(L1.aU), u = L1.dU, au = L1.aU, k1 = qNum(perUnit(L1)), k2 = qNum(perUnit(L2));
  const real = d * k1, ans = real / k2;
  if (!(metric ? near(ans * 2, Math.round(ans * 2)) : isQuarter(ans)) || ans > 8.5 || ans < 0.75 || d > 8.5) return rescale(R, n);
  const figs: PlanFig[] = [
    { pts: rect(d, 1), at: [0, 0], col: 'first', labels: [lab(d, u, metric), null, null, null], name: 'old' },
    { pts: rect(ans, 1), at: [0, 3.5], col: 'second', dashed: true, labels: ['?', null, null, null], labelCol: 'second', labels2: [lab(ans, u, metric), null, null, null], label2Col: 'link', name: 'new' },
  ];
  return {
    id: `rescale-${n}`, family: 'rescale',
    prompt: `A plan drawn at ${A(`1 ${u}`)} represents ${B(`${k1} ${au}`)} shows a fence ${A(`${vHtml(d, metric)} ${u}`)} long. You redraw the plan at ${A(`1 ${u}`)} represents ${B(`${k2} ${au}`)}. How long is the fence on the new plan?`,
    board: `\\cssId{d}{${vTex(d, metric)}${T(u)}} \\to\\ ?${T(au)} \\to\\ ?${T(u)}`, unit: u, ...answerOf(ans, metric),
    picture: { kind: 'plan', plan: { unit: metric ? 'cm' : 'in', figs, grid: false }, solve: ['labels2'] },
    solution: [`Old plan to real: ${vText(d, metric)} × ${k1} = ${dec(real)} ${au}.`, `Real to new plan: ${dec(real)} ÷ ${k2} = ${S(`${vHtml(ans, metric)} ${u}`)}.`],
    work: `${vTex(d, metric)} \\times ${k1} = ${dec(real)},\\ ${dec(real)} \\div ${k2} = \\cssId{s}{${vTex(ans, metric)}}`,
    check: valCheck(ans, `Right: the real fence is ${dec(real)} ${au}, and ${dec(real)} ÷ ${k2} = ${vText(ans, metric)} ${u}.`, [
      { v: d / k2, mc: MC.drawAsActual, say: `That treats ${vText(d, metric)} ${u} as the real length. First find the real fence: ${vText(d, metric)} × ${k1} = ${dec(real)} ${au}.` },
      { v: d * k2, mc: MC.drawAsActual, say: `Go through the real fence: ${vText(d, metric)} × ${k1} = ${dec(real)} ${au}, then ÷ ${k2} for the new plan.` },
      { v: real, mc: MC.wrongUnit, say: `${dec(real)} ${au} is the real fence. The new plan needs it in ${u}: ÷ ${k2}.` },
      { v: d, say: `A new scale changes the drawing. Find the real fence first, then use the new scale.` },
    ], `Old plan → real length → new plan.`),
  };
};

// ===== 9 area-from-drawing =====
const area: Gen = (R, n) => {
  const v = int(R, 0, 4);
  let L: Legend, pts: [number, number][], labels: (string | null)[], labels2: (string | null)[], shape: string;
  const metric = v === 3 || v === 4;
  if (v === 4) {
    // an enlarged drawing: the real thing is smaller
    L = legend(2, 'cm', 1, 'cm' as AU);
    const w = 2 * int(R, 2, 4), h = 2 * int(R, 1, 3);
    pts = rect(w, h); labels = [lab(w, 'cm', true), lab(h, 'cm', true), null, null]; labels2 = [lab(w / 2, 'cm', true), lab(h / 2, 'cm', true), null, null]; shape = pick(R, ['postage stamp', 'phone screen', 'trading card', 'sticker']);
  } else {
    const k = metric ? pick(R, [2, 3, 5, 10]) : pick(R, [2, 3, 4, 5]);
    L = metric ? legend(1, 'cm', k, 'm') : legend(1, 'in', k, 'ft');
    const u = L.dU, au = L.aU;
    if (v === 1) {
      const a = int(R, 2, 5), b = 2 * int(R, 1, 2);
      pts = [[0, 0], [a, b], [0, b]]; labels = [null, lab(a, u, metric), lab(b, u, metric)]; labels2 = [null, lab(a * k, au, metric), lab(b * k, au, metric)]; shape = `triangular ${pick(R, ['garden bed', 'patio', 'lawn'])}`;
    } else if (v === 2) {
      const a = int(R, 4, 5), d = int(R, 3, 4), b = int(R, 1, d - 2), c = int(R, 2, a - 2);
      pts = ell(a, b, c, d); labels = [lab(a, u, metric), lab(b, u, metric), null, null, lab(c, u, metric), lab(d, u, metric)]; labels2 = [lab(a * k, au, metric), lab(b * k, au, metric), null, null, lab(c * k, au, metric), lab(d * k, au, metric)]; shape = `L-shaped ${pick(R, ['studio', 'yard', 'office'])}`;
    } else {
      const w = metric ? pick(R, steps(3, 6, 0.5)) : int(R, 3, 6), h = metric ? int(R, 2, 4) : pick(R, steps(1.5, 3.5, 0.5));
      pts = rect(w, h); labels = [lab(w, u, metric), lab(h, u, metric), null, null]; labels2 = [lab(w * k, au, metric), lab(h * k, au, metric), null, null]; shape = metric ? pick(R, YARDS) : pick(R, ROOMS);
    }
  }
  const Ad = polyArea(pts), f = areaFactor(L), ans = qNum(Ad) * qNum(f), k = qNum(perUnit(L));
  const u = L.dU, au = L.aU, sq = `sq ${au}`;
  const big = v === 4;
  return {
    id: `area-${n}`, family: 'area',
    prompt: big
      ? `A drawing of ${an(shape)} is made at ${A('2 cm')} represents ${B('1 cm')} (the drawing is bigger). The drawing's area is ${A(`${dec(Ad)} sq cm`)}. What is the real area?`
      : `A plan of ${an(shape)} uses ${A(`1 ${u}`)} represents ${B(`${k} ${au}`)}. Find the real area of the ${shape}.`,
    board: big ? `\\cssId{d}{${dec(Ad)}${T('sq cm')}} \\to\\ ?${T('sq cm')}` : `\\text{plan: } \\cssId{d}{${dec(Ad)}${T(`sq ${u}`)}}`,
    input: 'num', unit: sq, answer: { kind: 'num', v: ans },
    picture: { kind: 'plan', plan: { unit: metric ? 'cm' : 'in', figs: [{ pts, col: 'first', labels, labels2, right: v !== 1 }], legend: legTex(L) }, solve: ['labels2'] },
    solution: big
      ? [`Every real length is half the drawn one, so every area is ½ × ½ = ¼ of the drawn one.`, `${dec(Ad)} × ¼ = ${dec(ans)} sq cm.`]
      : [`Real lengths first: every ${UW[u]} becomes ${k} ${au} (the teal labels).`, `Then the area: the plan's ${dec(Ad)} sq ${u} × ${k} × ${k} = ${dec(ans)} ${sq}.`],
    work: big ? `${dec(Ad)} \\times \\tfrac14 = \\cssId{s}{${dec(ans)}}` : `${dec(Ad)} \\times ${k}^2 = \\cssId{s}{${dec(ans)}}${T(sq)}`,
    check: valCheck(ans, `Right: ${dec(ans)} ${sq}. Length and width are both scaled, so the area is scaled by ${big ? '½ × ½' : `${k} × ${k}`}.`, [
      { v: qNum(Ad) * k, mc: MC.areaK, say: `That scales the area by ${big ? '½' : k}, like a length. But both the length and the width are scaled, so the area is × ${big ? '¼' : `${k} × ${k} = ${k * k}`}.` },
      { v: qNum(Ad), mc: MC.drawAsActual, say: `${dec(Ad)} is the area on the ${big ? 'drawing' : 'plan'}. Scale the lengths first.` },
    ], `Find the real lengths, then the area.`),
  };
};

// ===== 10 check-scale-drawing =====
const audit: Gen = (R, n) => {
  const k = pick(R, [2, 4, 6, 8]), L = legend(1, 'in', k, 'ft');
  const dw = pick(R, steps(2, 4, 0.5)), dh = pick(R, steps(1.5, dw - 0.5, 0.5));
  const W = dw * k, H = dh * k;
  if (!Number.isInteger(W) || !Number.isInteger(H)) return audit(R, n);
  const kind = pick(R, ['ok', 'side', 'slant'] as const);
  const room = pick(R, ROOMS);
  let pts: [number, number][], lw = dw, lh = dh, angleTxt: string | null = null;
  if (kind === 'side') { lh = dh + pick(R, [0.5, -0.5]); if (lh < 1) lh = dh + 0.5; pts = rect(dw, lh); }
  else if (kind === 'slant') {
    // a slanted plan whose slanted side really is the labelled dh (the lengths fit; only the corners are wrong)
    const deg = pick(R, [60, 65, 70, 75]), sx = dh * Math.cos(deg * Math.PI / 180), hy = dh * Math.sin(deg * Math.PI / 180);
    pts = [[sx, 0], [dw + sx, 0], [dw, hy], [0, hy]]; angleTxt = `${deg}°`; lh = dh;
  }
  else pts = rect(dw, dh);
  const fig: PlanFig = {
    pts, col: 'first', right: kind !== 'slant',
    labels: [lab(lw, 'in', false), kind === 'slant' ? lab(dh, 'in', false) : lab(lh, 'in', false), null, null],
    angles: angleTxt ? [{ at: 3, text: angleTxt }] : undefined,
  };
  const opts: Opt[] = kind === 'ok' ? [
    { t: 'Yes: both lengths fit the scale, and the corners are square', ok: true, say: `Yes: ${W} ÷ ${k} = ${vText(dw, false)}, ${H} ÷ ${k} = ${vText(dh, false)}, and all four corners are right angles.` },
    { t: `No: the plan should be ${W} in by ${H} in`, ok: false, mc: MC.drawAsActual, say: `A plan isn't the real size: each inch stands for ${k} ft. ${W} ÷ ${k} = ${vText(dw, false)} in.` },
    { t: 'No: the width does not fit the scale', ok: false, say: `Check it: ${H} ÷ ${k} = ${vText(dh, false)} in, which is what's drawn.` },
  ] : kind === 'side' ? [
    { t: `No: the ${H} ft side should be ${vText(dh, false)} in`, ok: true, say: `Yes: ${H} ÷ ${k} = ${vText(dh, false)} in, but it's drawn ${vText(lh, false)} in.` },
    { t: `Yes: the ${W} ft side is ${vText(dw, false)} in, so it fits the scale`, ok: false, mc: MC.oneSide, say: `One side fitting isn't enough: check every side. ${H} ÷ ${k} = ${vText(dh, false)} in, not ${vText(lh, false)}.` },
    { t: 'No: the corners are not right angles', ok: false, say: `The corners are fine (square). Check the lengths: ${H} ÷ ${k} = ${vText(dh, false)} in.` },
  ] : [
    { t: 'No: the corners must stay right angles', ok: true, say: `Yes: the lengths fit the scale, but the corners changed. A scale drawing keeps every angle.` },
    { t: 'Yes: both lengths fit the scale', ok: false, mc: MC.ratiosOnly, say: `The lengths fit, but the shape is slanted: its corners are ${angleTxt}, not 90°. Lengths AND angles must match.` },
    { t: `No: the ${W} ft side should be longer`, ok: false, say: `${W} ÷ ${k} = ${vText(dw, false)} in, which is what's drawn. Look at the corners.` },
  ];
  return choiceItem(R, {
    id: `audit-${n}`, family: 'audit',
    prompt: `A rectangular ${room} is ${B(`${W} ft`)} by ${B(`${H} ft`)}. Is this a correct plan at ${A('1 in')} represents ${B(`${k} ft`)}?`,
    board: `\\text{room: } \\cssId{a}{${W}${T('ft')}} \\times \\cssId{a}{${H}${T('ft')}}`,
    picture: { kind: 'plan', plan: { unit: 'in', figs: [fig], legend: legTex(L) } },
    solution: [`Check every length: ${W} ÷ ${k} = ${vText(dw, false)} in and ${H} ÷ ${k} = ${vText(dh, false)} in.`, `Check every angle: a rectangle's plan has four right angles.`],
    work: `${W} \\div ${k} = ${vTex(dw, false)},\\ ${H} \\div ${k} = ${vTex(dh, false)}`,
  }, opts);
};

// ===== 11 choose-scale =====
const fit: Gen = (R, n) => {
  const pages = [[10, 6], [8, 5], [9, 6], [11, 7], [12, 8], [10, 7]] as const;
  for (let t = 0; t < 200; t++) {
    const [P, Qh] = pick(R, pages);
    const scales = [2, 3, 4, 5, 6, 8, 10];
    const i = int(R, 0, scales.length - 3);
    const s1 = scales[i]!, s2 = scales[i + 1]!, s3 = scales[i + 2]!;
    // s1 fits the length but not the width, s2 fits both
    const Wn = int(R, s1 * Qh + 1, s2 * Qh), Ln = int(R, Wn, s1 * P);
    if (Ln < Wn || !isQuarter(Ln / s2) || !isQuarter(Wn / s2) || Ln / s1 > P || Wn / s1 <= Qh) continue;
    const room = pick(R, [...ROOMS, ...YARDS]);
    const fig: PlanFig = { pts: rect(Ln / s2, Wn / s2), at: [0, 0], col: 'link', key: 'fig' };
    const base = {
      id: `fit-${n}`, family: 'fit' as const,
      board: `\\text{room: } \\cssId{a}{${Ln}${T('ft')}} \\times \\cssId{a}{${Wn}${T('ft')}}`,
      picture: { kind: 'plan' as const, plan: { unit: 'in' as const, figs: [fig], size: [P, Qh] as [number, number], sizeLabels: [lab(P, 'in', false), lab(Qh, 'in', false)] as [string, string], maxPx: 80 }, solve: ['fig'] },
      solution: [`Check BOTH sides at each scale. At 1 in : ${s1} ft: ${Ln} ÷ ${s1} = ${vText(Ln / s1, false)} in fits, but ${Wn} ÷ ${s1} = ${vText(Wn / s1, false)} in is more than ${Qh} in.`, `At 1 in : ${s2} ft: ${vText(Ln / s2, false)} in by ${vText(Wn / s2, false)} in fits on the ${P} in by ${Qh} in page, and is the biggest that does.`],
      work: `${Ln} \\div ${s2} = \\cssId{s}{${vTex(Ln / s2, false)}}\\le ${P},\\ ${Wn} \\div ${s2} = \\cssId{s}{${vTex(Wn / s2, false)}}\\le ${Qh}`,
    };
    if (R() < 0.6) {
      return choiceItem(R, {
        ...base,
        prompt: `${cap(an(room))} is ${B(`${Ln} ft`)} by ${B(`${Wn} ft`)}. Your page is ${A(`${P} in`)} by ${A(`${Qh} in`)}. Which scale gives the biggest plan that still fits?`,
      }, [
        { t: `1 in represents ${s1} ft`, ok: false, mc: MC.oneDim, say: `The ${Ln} ft side fits (${vText(Ln / s1, false)} in), but the ${Wn} ft side would be ${vText(Wn / s1, false)} in: more than ${Qh} in. Check both sides.` },
        { t: `1 in represents ${s2} ft`, ok: true, say: `Yes: ${vText(Ln / s2, false)} in by ${vText(Wn / s2, false)} in fits, and a bigger scale doesn't.` },
        { t: `1 in represents ${s3} ft`, ok: false, say: `That fits, but it is smaller than it needs to be: 1 in : ${s2} ft fits too and gives a bigger plan.` },
      ], true);
    }
    const need = Math.max(Ln / P, Wn / Qh), ans = Math.ceil(need - 1e-9), one = Math.ceil(Ln / P - 1e-9);
    if (one === ans) continue;
    return {
      ...base,
      prompt: `${cap(an(room))} is ${B(`${Ln} ft`)} by ${B(`${Wn} ft`)}. Your page is ${A(`${P} in`)} by ${A(`${Qh} in`)}. What is the smallest whole number of feet per inch that makes the plan fit?`,
      input: 'num' as const, unit: 'ft per in', answer: { kind: 'num' as const, v: ans },
      solution: [`Long side: ${Ln} ÷ ${P} = ${dec(Number((Ln / P).toFixed(3)))} ft per inch at least. Short side: ${Wn} ÷ ${Qh} = ${dec(Number((Wn / Qh).toFixed(3)))} ft per inch at least.`, `Both must fit, so take the bigger one and round up: ${S(`${ans} ft`)} per inch.`],
      work: `\\max(${dec(Number((Ln / P).toFixed(2)))},\\ ${dec(Number((Wn / Qh).toFixed(2)))}) \\to \\cssId{s}{${ans}}`,
      picture: { ...base.picture, plan: { ...base.picture.plan, figs: [{ ...fig, pts: rect(Ln / ans, Wn / ans) }] } },
      check: valCheck(ans, `Right: at 1 in : ${ans} ft the plan is ${dec(Number((Ln / ans).toFixed(2)))} in by ${dec(Number((Wn / ans).toFixed(2)))} in: it fits.`, [
        { v: one, mc: MC.oneDim, say: `That fits the ${Ln} ft side, but then the ${Wn} ft side is ${dec(Number((Wn / one).toFixed(2)))} in: too tall for ${Qh} in. Check both sides.` },
      ], `Work out the feet per inch each side needs; the plan must fit both.`),
    };
  }
  throw new Error('fit: no case');
};

// ===== 12 area-factor-justify =====
const areaWhy: Gen = (R, n) => {
  const v = int(R, 0, 2);
  const k = pick(R, [2, 3, 4, 5, 1.5, 2.5]);
  const metric = R() < 0.4;
  const L = metric ? legend(1, 'cm', k, 'm') : legend(1, 'in', k, 'ft');
  const u = L.dU, au = L.aU, k2 = k * k;
  const pic: Pic = { kind: 'plan', plan: { unit: metric ? 'cm' : 'in', figs: [{ pts: rect(3, 2), col: 'first' }], legend: legTex(L), zoom: { cell: [0, 0], k, side: lab(k, au, metric) }, maxPx: metric ? 72 : 90 }, solve: ['zoom'] };
  // put the zoomed square on the figure's first cell
  pic.plan.zoom!.cell = [0, 0];
  if (v === 0) {
    return {
      id: `areaWhy-${n}`, family: 'areaWhy',
      prompt: `A plan uses ${A(`1 ${u}`)} represents ${B(`${dec(k)} ${au}`)}. One square ${u === 'in' ? 'inch' : 'centimeter'} of the plan stands for how many square ${au === 'ft' ? 'feet' : 'meters'}?`,
      board: `1${T(`sq ${u}`)} \\to\\ ?${T(`sq ${au}`)}`, input: 'num', unit: `sq ${au}`, answer: { kind: 'num', v: k2 },
      picture: pic,
      solution: [`One square ${u} is 1 ${u} by 1 ${u}: in real life, ${dec(k)} ${au} by ${dec(k)} ${au}.`, `${dec(k)} × ${dec(k)} = ${dec(k2)} sq ${au}.`],
      work: `${dec(k)} \\times ${dec(k)} = \\cssId{s}{${dec(k2)}}${T(`sq ${au}`)}`,
      check: valCheck(k2, `Right: ${dec(k)} ${au} by ${dec(k)} ${au} is ${dec(k2)} sq ${au}.`, [
        { v: k, mc: MC.areaK, say: `${dec(k)} is the length of each side. A square ${u} becomes ${dec(k)} ${au} by ${dec(k)} ${au}: ${dec(k)} × ${dec(k)}.` },
        { v: 2 * k, say: `That adds the two sides. Area multiplies them: ${dec(k)} × ${dec(k)}.` },
      ], `The real square is ${dec(k)} ${au} on each side.`),
    };
  }
  if (v === 1) {
    return choiceItem(R, {
      id: `areaWhy-${n}`, family: 'areaWhy',
      prompt: `On a plan at ${A(`1 ${u}`)} represents ${B(`${dec(k)} ${au}`)}, every real area is ${S(dec(k2))} times the plan's area (in square ${au === 'ft' ? 'feet' : 'meters'} per square ${u === 'in' ? 'inch' : 'centimeter'}). Why ${dec(k2)}, and not ${dec(k)}?`,
      board: `${dec(k)} \\times ${dec(k)} = ${dec(k2)}`,
      picture: pic,
      solution: [`An area is a length times a width.`, `Both are multiplied by ${dec(k)}, so the area is multiplied by ${dec(k)} × ${dec(k)} = ${dec(k2)}. That holds for any shape, because any shape is made of small squares.`],
    }, [
      { t: `The length AND the width are both ${dec(k)} times as long, so the area is ${dec(k)} × ${dec(k)}`, ok: true, say: `Yes: two directions, each × ${dec(k)}. Every little square of the plan becomes ${dec(k2)} real square units.` },
      { t: `Areas grow by the same factor as lengths, so it should be ${dec(k)}`, ok: false, mc: MC.areaK, say: `Only one direction would give × ${dec(k)}. Both the length and the width grow, so the area grows × ${dec(k)} × ${dec(k)}.` },
      { t: `It worked for one square I checked, so it works for every shape`, ok: false, mc: MC.examples, say: `One example is not a reason. The reason is that both the length and the width are scaled by ${dec(k)}, for every little square of any shape.` },
    ]);
  }
  // a reduction / a rational factor: same reason, other direction
  const big = pick(R, [2, 3, 4]);
  return choiceItem(R, {
    id: `areaWhy-${n}`, family: 'areaWhy',
    prompt: `A drawing of a bug is made at ${A(`${big} cm`)} represents ${B('1 cm')}. How does the bug's real area compare with the drawing's area?`,
    board: `\\tfrac{1}{${big}} \\times \\tfrac{1}{${big}} = \\tfrac{1}{${big * big}}`,
    solution: [`Every real length is 1/${big} of the drawn length, in both directions.`, `So the real area is 1/${big} × 1/${big} = 1/${big * big} of the drawing's area.`],
  }, [
    { t: `It is 1/${big * big} of it: both directions shrink to 1/${big}`, ok: true, say: `Yes: 1/${big} of the length times 1/${big} of the width.` },
    { t: `It is 1/${big} of it, like every length`, ok: false, mc: MC.areaK, say: `Area has two directions, and both shrink to 1/${big}: 1/${big} × 1/${big} = 1/${big * big}.` },
    { t: `It is the same: a drawing doesn't change areas`, ok: false, mc: MC.drawAsActual, say: `The drawing is ${big} times as long in each direction, so its area is ${big * big} times the real one.` },
  ]);
};

// ===== 13 scale-context-application =====
const cost: Gen = (R, n) => {
  const v = int(R, 0, 3);
  const fence = v === 0 || (v === 2 && R() < 0.5);
  let L: Legend, w: number, h: number;
  if (v === 2) { L = legend(0.25, 'in', 1, 'ft'); w = pick(R, steps(2, 5, 0.25)); h = pick(R, steps(1.5, 3, 0.25)); }
  else if (v === 3) { L = legend(1, 'cm', pick(R, [2, 4]), 'm'); w = pick(R, steps(3, 6, 0.5)); h = int(R, 2, 4); }
  else { L = legend(1, 'in', pick(R, [2, 3, 4, 5]), 'ft'); w = int(R, 3, 6); h = pick(R, steps(2, 4, 0.5)); }
  const metric = isMetric(L.aU), k = qNum(perUnit(L)), u = L.dU, au = L.aU;
  const W = w * k, H = h * k;
  const fenceDo = fence && !metric;
  const price = fenceDo ? pick(R, [12, 15, 18, 20, 25]) : metric ? pick(R, [8, 12, 15, 20, 25]) : pick(R, [2, 3, 4, 5, 6]);
  const place = fenceDo ? pick(R, YARDS) : pick(R, ROOMS);
  const fig: PlanFig = { pts: rect(w, h), col: 'first', right: true, labels: [lab(w, u, metric), lab(h, u, metric), null, null], labels2: [lab(W, au, metric), lab(H, au, metric), null, null] };
  const pic: Pic = { kind: 'plan', plan: { unit: metric ? 'cm' : 'in', figs: [fig], legend: legTex(L) }, solve: ['labels2'] };
  const legHtml = legendHtml(L).replace(/^(.*?) represents (.*)$/, (_, a, b) => `${A(a)} represents ${B(b)}`);
  if (fenceDo) {
    const per = 2 * (W + H), ans = per * price;
    return {
      id: `cost-${n}`, family: 'cost',
      prompt: `A plan of ${an(place)} uses ${legHtml}. A fence goes all the way around the ${place}. Fencing costs ${S(`$${price}`)} per foot. What does the fence cost?`,
      board: `\\text{fence: } \\$${price}${T('per ft')}`, input: 'num', unit: 'dollars', answer: { kind: 'num', v: ans },
      picture: pic,
      solution: [`Real sides: ${vText(w, false)} × ${k} = ${dec(W)} ft and ${vText(h, false)} × ${k} = ${dec(H)} ft.`, `Around: 2 × (${dec(W)} + ${dec(H)}) = ${dec(per)} ft, and ${dec(per)} × $${price} = $${dec(ans)}.`],
      work: `2 \\times (${dec(W)} + ${dec(H)}) = ${dec(per)}${T('ft')},\\ ${dec(per)}${T('ft')} \\times \\$${price} = \\cssId{s}{\\$${dec(ans)}}`,
      check: valCheck(ans, `Right: ${dec(per)} ft of fence at $${price} a foot is $${dec(ans)}.`, [
        { v: 2 * (w + h) * price, mc: MC.drawAsActual, say: `That prices the plan's ${dec(2 * (w + h))} in, not the real fence. Scale the sides to feet first.` },
        { v: W * H * price, say: `Fencing goes around the edge (the perimeter), not over the area.` },
      ], `Real sides first, then the distance around, then the price.`),
    };
  }
  const Ar = W * H, ans = Ar * price, sq = `sq ${au}`;
  const what = metric ? 'tiles' : 'new flooring';
  return {
    id: `cost-${n}`, family: 'cost',
    prompt: `A plan of ${an(place)} uses ${legHtml}. The whole floor gets ${what} at ${S(`$${price}`)} per square ${au === 'ft' ? 'foot' : 'meter'}. What does it cost?`,
    board: `\\text{floor: } \\$${price}${T(`per ${sq}`)}`, input: 'num', unit: 'dollars', answer: { kind: 'num', v: ans },
    picture: pic,
    solution: [`Real sides: ${vText(w, metric)} × ${k} = ${dec(W)} ${au} and ${vText(h, metric)} × ${k} = ${dec(H)} ${au}; area ${dec(Ar)} ${sq}.`, `${dec(Ar)} × $${price} = $${dec(ans)}.`],
    work: `${dec(W)} \\times ${dec(H)} = ${dec(Ar)}${T(sq)},\\ ${dec(Ar)}${T(sq)} \\times \\$${price} = \\cssId{s}{\\$${dec(ans)}}`,
    check: valCheck(ans, `Right: ${dec(Ar)} ${sq} at $${price} each is $${dec(ans)}.`, [
      { v: w * h * k * price, mc: MC.areaK, say: `That scales the area by ${dec(k)} only. Length and width are both scaled: the real area is ${dec(Ar)} ${sq}.` },
      { v: w * h * price, mc: MC.drawAsActual, say: `That prices the plan's area. Scale the sides first: ${dec(W)} ${au} by ${dec(H)} ${au}.` },
    ], `Real sides, real area, then the price.`),
  };
};

export const GENERATORS: Record<FamilyId, Gen> = {
  copy, copyLen, legend: legend_, legendNum, toActual: toActual_, toDrawing: toDrawing_, fracLegend, fracRewrite, ruler, makePlan, rescale, area, audit, fit, areaWhy, cost,
};
void toDrawing; void legendTex;
