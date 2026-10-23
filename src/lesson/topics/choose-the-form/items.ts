// items.ts: exercise families for "choose a fraction, decimal, or percent form" (primary.fractions.choose-calculation-
// form-fractions, grade 7). Every family is generated from templates, checked exactly (formMaths.ts), and every wrong
// answer the classifier recognises carries its misconception id (math-curriculum-essentials/misconceptions.json).
// A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's number ranges from the topic JSON.
// Pure: no DOM, no canvas. Pictures are plain data for the page's FormLine (type-only import).
import { type Item, type Response, type Verdict, A, fr, int, pick, shuffle, fracValue } from '../../runtime/item';
import type { FormLineParams, Tick } from './FormLine';
import { ans, endOnChoice } from '../../runtime/explain';
import {
  type Form, type Rat, decRat, decStr, digitKey, formHtml, formTex, formValue, fracTex, money, near, pctOfCents, pctRat, pctStr,
  rat, rEq, rMul, rNum, rSub, roundRat, terminates,
} from './formMaths';

export type FamilyId = 'threeNames' | 'sameAmount' | 'decPct' | 'centsDollars' | 'over100' | 'overChoice' | 'sameWhole' | 'moreHow'
  | 'contextMatch' | 'fractionRoute' | 'whichFraction' | 'routeEqual' | 'routeCompute' | 'routePick' | 'orderForms' | 'compareTwo'
  | 'reportForm' | 'eitherForm' | 'reportAs' | 'reportPick' | 'eqOrApprox' | 'calcDisplay' | 'roundingGap' | 'keepExact' | 'tolerance'
  | 'nearestCent' | 'fasterRoute' | 'checkResult' | 'estimateFirst' | 'multiStep';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'threeNames', name: 'One amount, three names' },
  { id: 'sameAmount', name: 'Same amount?' },
  { id: 'decPct', name: 'Decimal and percent' },
  { id: 'centsDollars', name: 'Cents and dollars' },
  { id: 'over100', name: 'More than one whole' },
  { id: 'overChoice', name: 'Over 100%' },
  { id: 'sameWhole', name: 'Check the whole' },
  { id: 'moreHow', name: 'Different wholes' },
  { id: 'contextMatch', name: 'Say it another way' },
  { id: 'fractionRoute', name: 'The fraction route' },
  { id: 'whichFraction', name: 'Pick the mental route' },
  { id: 'routeEqual', name: 'Two routes, one answer' },
  { id: 'routeCompute', name: 'Pick a route and compute' },
  { id: 'routePick', name: 'Which route works?' },
  { id: 'orderForms', name: 'Greatest and least' },
  { id: 'compareTwo', name: 'Which is more?' },
  { id: 'reportForm', name: 'The form that fits' },
  { id: 'eitherForm', name: 'Which form was asked for?' },
  { id: 'reportAs', name: 'Report it in another form' },
  { id: 'reportPick', name: 'Calculate one way, report another' },
  { id: 'eqOrApprox', name: 'Equal or about?' },
  { id: 'calcDisplay', name: 'Read the calculator' },
  { id: 'roundingGap', name: 'What rounding costs' },
  { id: 'keepExact', name: 'Exact or rounded?' },
  { id: 'tolerance', name: 'Close enough?' },
  { id: 'nearestCent', name: 'To the nearest cent' },
  { id: 'fasterRoute', name: 'The shorter route' },
  { id: 'checkResult', name: 'Check with a benchmark' },
  { id: 'estimateFirst', name: 'Estimate first' },
  { id: 'multiStep', name: 'Two steps' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

export const MC = {
  tenthsUnit: 'mc.percent.reads-tenths-as-unit-fractions',
  formsDiffer: 'mc.fractions-concept.different-forms-different-numbers',
  fracDigitsPct: 'mc.percent.fraction-digits-as-percent-numeral',
  fracDigitsDec: 'mc.decimals.fraction-digits-after-decimal-point',
  digitsAcross: 'mc.percent.compares-digits-across-forms',
  centsPoint: 'mc.decimals.dollars-cents-point-misplaced',
  thousand: 'mc.percent.divides-by-one-thousand',
  lessThanOne: 'mc.fractions-concept.fraction-must-be-less-than-one',
  wholes: 'mc.fractions-concept.different-wholes-treated-as-same',
  onePth: 'mc.percent.reads-p-percent-as-one-pth',
  disagree: 'mc.reasoning-language.methods-can-disagree',
  oneMethod: 'mc.add-sub.believes-one-method-is-right',
  numeral: 'mc.percent.percent-numeral-without-dividing-by-100',
  denomDigits: 'mc.percent.compares-forms-by-denominator-and-visible-digits',
  oneForm: 'mc.fractions-concept.one-number-form-always-best',
  contextForm: 'mc.fractions-concept.context-dictates-number-form',
  calcForm: 'mc.fractions-concept.answer-form-fixed-by-calculation-form',
  inexact: 'mc.decimals.all-decimal-notations-classified-as-inexact',
  truncation: 'mc.decimals.truncation-taken-as-full-decimal',
  roundedExact: 'mc.estimation.rounded-value-treated-as-exact',
  midRound: 'mc.estimation.intermediate-rounding-cannot-change-result',
  places: 'mc.estimation.decimal-length-guarantees-accuracy',
  roundPlace: 'mc.decimals.wrong-rounding-place',
  exactThenRound: 'mc.estimation.computes-exactly-then-rounds',
  roughUseless: 'mc.estimation.rough-estimate-cannot-check-error',
  intermediate: 'mc.reasoning-language.reports-intermediate-result',
} as const;

/** what the page draws for an item: a FormLine, the steps shown at once, the steps the worked solution plays, and
 *  board lines (TeX) the solution writes beside it */
export interface FormPic { line: FormLineParams; pre: string[]; solve: string[]; work: string[] }
export interface FormItem extends Item { family: FamilyId; picture?: { form: FormPic } }
type Gen = (R: () => number, n: number, sg?: string) => FormItem;
type Base = Pick<FormItem, 'id' | 'family' | 'prompt' | 'board' | 'solution'> & Partial<Pick<FormItem, 'picture' | 'unit'>>;

// ---------- builders ----------
/** "1 hundredth", "1 cent", "1 cup": the templates write the plural after any count, this puts 1 right */
const one = (t: string) => t.replace(/(^|[^\d.,−-])1 (hundredth|cent|cup|dollar|place|batch)(e?s)\b/g, '$11 $2');
const oneBase = (b: Base): Base => ({ ...b, prompt: one(b.prompt), board: b.board.replace(/(^|[^\d.,])1\\text\{ (hundredth|cent|cup)s\}/g, '$11\\text{ $2}'), solution: b.solution.map(one), ...(b.unit ? { unit: one(b.unit) } : {}) });
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
function choiceItem(R: () => number, base0: Base, opts0: Opt[]): FormItem {
  const base = oneBase(base0), opts = opts0.map(o => ({ ...o, t: one(o.t), say: one(o.say) }));
  const o = shuffle(R, opts.slice());
  if (o.filter(x => x.ok).length !== 1) throw new Error(`choiceItem ${base.id}: needs exactly one right option`);
  if (new Set(o.map(x => x.t)).size !== o.length) throw new Error(`choiceItem ${base.id}: duplicate options ${o.map(x => x.t).join(' | ')}`);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: o.findIndex(x => x.ok) }, solution: endOnChoice(base.solution, o.find(x => x.ok)!.t),
    check: (r: Response): Verdict => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const x = o[r.i]!;
      return x.ok ? { ok: true, say: x.say } : { ok: false, mc: x.mc, say: x.say };
    },
  };
}
interface Trap { v: number; mc?: string; say: string }
function numItem(base0: Base, v: number, okSay0: string, hint0: string, traps0: Trap[]): FormItem {
  const base = oneBase(base0), okSay = one(okSay0), hint = one(hint0), traps = traps0.map(t => ({ ...t, say: one(t.say) }));
  // the unit after the box: "1 cent", "1 cup"
  if (v === 1 && base.unit) base.unit = base.unit.replace(/^(hundredth|cent|cup|dollar|scoop)s$/, '$1');
  return {
    ...base, input: 'num', answer: { kind: 'num', v },
    check: (r: Response): Verdict => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, v)) return { ok: true, say: okSay };
      const t = traps.find(q => !near(q.v, v) && near(r.v, q.v));
      return t ? { ok: false, mc: t.mc, say: t.say } : { ok: false, say: hint };
    },
  };
}
function fracItem(base0: Base, target: Rat, okSay0: string, hint0: string, traps0: { r: Rat; mc?: string; say: string }[]): FormItem {
  const base = oneBase(base0), okSay = one(okSay0), hint = one(hint0), traps = traps0.map(t => ({ ...t, say: one(t.say) }));
  const w = Math.floor(target.n / target.d), rem = target.n - w * target.d;
  return {
    ...base, input: 'frac', answer: rem ? { kind: 'frac', w, n: rem, d: target.d } : { kind: 'frac', w, n: 0, d: 1 },
    check: (r: Response): Verdict => {
      if (r.kind !== 'frac') return { ok: false, say: 'Type a fraction or a mixed number.' };
      const v = fracValue(r);
      if (!v) return { ok: false, say: 'Type a fraction or a mixed number.' };
      if (v[0] * target.d === target.n * v[1]) return { ok: true, say: okSay };
      const t = traps.find(q => !rEq(q.r, target) && v[0] * q.r.d === q.r.n * v[1]);
      return t ? { ok: false, mc: t.mc, say: t.say } : { ok: false, say: hint };
    },
  };
}

// ---------- formatting ----------
const $ = (cents: number, force = false) => money(cents, force);
const tm = (cents: number, force = false) => money(cents, force).replace('$', '\\$').replace(/,/g, '{,}');
const fh = (r: Rat) => formHtml({ kind: 'frac', r });
const ft = (r: Rat) => fracTex(r);
const ds = (r: Rat) => decStr(r);
const ps = (r: Rat) => pctStr(r);
const pt = (r: Rat) => pctStr(r).replace('%', '\\%');
const NAMES = ['Mia', 'Leo', 'Ava', 'Noah', 'Zoe', 'Eli', 'Maya', 'Sam', 'Jada', 'Omar', 'Nina', 'Luis'];
const two = (R: () => number): [string, string] => { const a = pick(R, NAMES); let b = pick(R, NAMES); while (b === a) b = pick(R, NAMES); return [a, b]; };
const kindName = { frac: 'a fraction', dec: 'a decimal', pct: 'a percent' } as const;
type Kind = 'frac' | 'dec' | 'pct';
const formOf = (r: Rat, k: Kind): Form => (k === 'frac' ? { kind: 'frac', r } : k === 'dec' ? { kind: 'dec', s: ds(r) } : { kind: 'pct', p: ds(rMul(r, rat(100))) });

// ---------- pictures ----------
/** amount labels above the bar: 0, the whole, and the answer (lime; a row higher near the ends) */
function amountTicks(zero: string, whole: string, ansV?: number, ansT?: string): Tick[] {
  const t: Tick[] = [{ v: 0, t: zero, col: 'first' }, { v: 1, t: whole, col: 'first' }];
  if (ansV !== undefined && ansT) t.push({ v: ansV, t: ansT, col: 'link', row: ansV > 0.72 ? 1 : 0 });
  return t;
}
const pctTicks = (wholes = 1): Tick[] => Array.from({ length: wholes + 1 }, (_, i) => ({ v: i, t: `${i * 100}%` }));
const namesOf = (r: Rat) => ({ pct: pt(r), frac: terminates(r) && r.d > 1 ? ft(r) : undefined, dec: ds(r) });
const cupT = (i: number) => (i === 0 ? '0' : i === 1 ? '1 cup' : `${i} cups`);
const ticksN = (n: number, f: (i: number) => string): Tick[] => Array.from({ length: n + 1 }, (_, i) => ({ v: i, t: f(i), col: 'first' as const }));
const pic = (line: FormLineParams, pre: string[], solve: string[], work: string[] = []) => ({ picture: { form: { line, pre, solve, work } } });
const topSteps = (t: Tick[]) => t.map((_, i) => 'top' + i);
const botSteps = (t: Tick[]) => t.map((_, i) => 'bot' + i);
/** one marked point with its names: `show` names in the opening picture, `reveal` names in the worked solution */
function pointPic(v: number, names: FormLineParams['names'], show: Kind[], reveal: Kind[], o: { wholes?: number; top?: Tick[]; bot?: Tick[]; cut?: number; ans?: Tick; showAll?: boolean } = {}) {
  const wholes = o.wholes ?? Math.max(1, Math.ceil(v - 1e-9)), top = o.top ?? ticksN(wholes, i => String(i)), bot = o.bot ?? (wholes <= 2 ? pctTicks(wholes) : []);
  const tops = o.ans ? [...top, o.ans] : top;
  const line: FormLineParams = { wholes, top: tops, bot, mark: v, names: { ...names, order: [...show, ...reveal] }, ...(o.cut ? { cut: o.cut } : {}) };
  return pic(line, ['bar', ...topSteps(top), ...botSteps(bot), ...(o.cut ? ['cut'] : []), 'mark', ...show], [...reveal, ...(o.ans ? ['top' + top.length] : [])]);
}
/** p% of an amount on a bar: the percent shown; the cut (fraction route) or tenths, the part and its amount in the solve */
function percentOfPic(p: string, whole: string, ansT: string, o: { zero?: string; decomp?: boolean; noCut?: boolean } = {}) {
  const f = pctRat(p), v = rNum(f), pv = Number(p), tens = Math.floor(pv / 10);
  const decomp = !!o.decomp && pv > 10 && pv % 10 !== 0;
  const cut = o.noCut ? undefined : decomp || f.d > 12 ? 10 : f.d;
  const line: FormLineParams = { wholes: 1, top: amountTicks(o.zero ?? '$0', whole, v, ansT), bot: pctTicks(), ...(cut ? { cut } : {}),
    fills: decomp ? [{ a: 0, b: tens / 10, col: 'link' }, { a: tens / 10, b: v, col: 'second' }] : [{ a: 0, b: v, col: 'link' }], mark: v,
    names: { pct: `${p}\\%`, frac: f.d <= 12 && !decomp ? ft(f) : undefined, dec: ds(f) } };
  return { line, pre: ['bar', 'top0', 'top1', 'bot0', 'bot1', 'mark', 'pct'], solve: [...(cut ? ['cut'] : []), ...(line.names!.frac ? ['frac'] : []), 'fill0', ...(decomp ? ['fill1'] : []), 'dec', 'top2'] };
}
/** several numbers as pins on a zoomed stretch of the line: the bar only at first, the pins in the solve */
function pinsPic(fs: Form[]) {
  const vs = fs.map(f => rNum(formValue(f))), mn = Math.min(...vs), mx = Math.max(...vs);
  const pad = Math.max(0.025, 0.14 * (mx - mn));
  const lo = Math.max(0, Math.floor((mn - pad) * 20) / 20), hi = Math.ceil((mx + pad) * 20) / 20;
  const top: Tick[] = [{ v: lo, t: ds(decRat(lo.toFixed(2))), col: 'first' }, { v: hi, t: ds(decRat(hi.toFixed(2))), col: 'first' }];
  const cols = ['first', 'second', 'pick'] as const;
  const line: FormLineParams = { wholes: Math.max(1, Math.ceil(hi)), range: [lo, hi], top, bot: [], pins: fs.map((f, i) => ({ v: vs[i]!, t: formTex(f), col: cols[i % 3] })) };
  return { line, pre: ['bar', 'top0', 'top1'], solve: fs.map((_, i) => 'pin' + i) };
}
const asPic = (x: { line: FormLineParams; pre: string[]; solve: string[] }, work: string[] = []) => pic(x.line, x.pre, x.solve, work);
/** an amount as a painted stretch on a bar of whole units (dollars, hours): the answer label in the solve */
function amountPic(v: number, unit: (i: number) => string, ansT: string, cut?: number) {
  const wholes = Math.max(1, Math.ceil(v - 1e-9));
  if (wholes > 5) return {};
  const top = ticksN(wholes, unit);
  const line: FormLineParams = { wholes, top: [...top, { v, t: ansT, col: 'link', row: 1 }], bot: [], ...(cut && wholes <= 2 ? { cut } : {}), fills: [{ a: 0, b: v, col: 'second' }] };
  return pic(line, ['bar', ...topSteps(top), ...(line.cut ? ['cut'] : []), 'fill0'], ['top' + top.length]);
}
/** a benchmark check: p% of the amount marked; the benchmark piece and the estimate in the solve */
function benchPic(p: string, A0: number, b: Rat, est: number) {
  const v = rNum(pctRat(p));
  const line: FormLineParams = { wholes: 1, top: [{ v: 0, t: '$0' }, { v: 1, t: $(A0, true) }, { v: rNum(b), t: `≈ $${est}`, col: 'link', row: rNum(b) > 0.72 ? 1 : 0 }], bot: pctTicks(), cut: b.d, fills: [{ a: 0, b: rNum(b), col: 'link' }], mark: v, names: { pct: `${p}\\%` } };
  return pic(line, ['bar', 'top0', 'top1', 'bot0', 'bot1', 'mark', 'pct'], ['cut', 'fill0', 'top2']);
}
/** two numbers as pins on the whole line: the first in the opening picture, the second in the solve */
function twoPinsPic(a: Form, b: Form) {
  const va = rNum(formValue(a)), vb = rNum(formValue(b)), wholes = Math.max(1, Math.ceil(Math.max(va, vb) - 1e-9));
  if (wholes > 2) return {};
  const top = ticksN(wholes, i => String(i)), bot = wholes <= 2 ? pctTicks(wholes) : [];
  return pic({ wholes, top, bot, pins: [{ v: va, t: formTex(a), col: 'first' }, { v: vb, t: formTex(b), col: 'second' }] }, ['bar', ...topSteps(top), ...botSteps(bot), 'pin0'], ['pin1']);
}
/** the rounding gap under a zoom lens: exact f of W against the rounded decimal d */
function gapPic(f: Rat, d: string, Wc: number) {
  const ev = rNum(f), av = Number(d), lo = Math.min(ev, av) - 0.004, hi = Math.max(ev, av) + 0.004;
  const exC = rNum(rMul(f, rat(Wc))), apC = rNum(rMul(decRat(d), rat(Wc)));
  const line: FormLineParams = { wholes: 1, top: [{ v: 0, t: '$0' }, { v: 1, t: $(Wc) }], bot: [], cut: f.d,
    fills: [{ a: 0, b: av, col: 'second' }],
    lens: { a: lo, b: hi, ticks: [{ v: av, t: $(Math.round(apC), Math.round(apC) % 100 !== 0), col: 'second' }, { v: ev, t: $(Math.round(exC)), col: 'link' }], gap: { a: Math.min(ev, av), b: Math.max(ev, av), t: `${$(Math.round(Math.abs(exC - apC)), true)} off` } } };
  return { line, pre: ['bar', 'top0', 'top1', 'cut'], solve: ['fill0', 'lens', 'gap'] };
}

// ===================== 1. benchmark-three-forms =====================
const BENCH: Rat[] = [rat(1, 2), rat(1, 4), rat(3, 4), rat(1, 10), rat(3, 10), rat(7, 10), rat(9, 10), rat(1, 5), rat(2, 5), rat(3, 5), rat(4, 5), rat(1, 100)];
/** wrong names a kid writes for `r` in kind `to` when it was given in kind `from`, each with its misconception */
function wrongNames(r: Rat, from: Kind, to: Kind): Opt[] {
  const out: Opt[] = [];
  const d1 = ds(r).replace(/^0\./, '');
  if (from === 'frac' && to === 'pct') out.push({ t: `${r.n}${r.d}%`, mc: MC.fracDigitsPct, say: `The digits of ${fh(r)} are not a percent. ${fh(r)} means ${r.n} ÷ ${r.d}, which is ${ds(r)}, so ${ps(r)}.` });
  if (from === 'frac' && to === 'dec') out.push({ t: `0.${r.n}${r.d}`, mc: MC.fracDigitsDec, say: `${fh(r)} is not its digits behind a point. ${r.n} ÷ ${r.d} = ${ds(r)}.` });
  if (from === 'dec' && to === 'frac' && /^\d$/.test(d1) && d1 !== '1') out.push({ t: fh(rat(1, Number(d1))), mc: MC.tenthsUnit, say: `${ds(r)} is ${d1} tenths, so it is ${fh(rat(Number(d1), 10))}, not one ${d1 === '2' ? 'half' : 'piece of ' + d1}.` });
  if (from === 'dec' && to === 'pct') out.push({ t: `${Number(d1)}%`, mc: MC.digitsAcross, say: `Read the place value: ${ds(r)} is ${ps(r)}, because a percent counts hundredths.` });
  if (from === 'pct' && to === 'frac') { const p = Number(ds(rMul(r, rat(100)))); if (p > 1) out.push({ t: fh(rat(1, p)), mc: MC.onePth, say: `${p}% is ${p} out of 100, not one ${p}th. ${p}% = ${fh(r)}.` }); }
  if (from === 'pct' && to === 'dec') {
    out.push({ t: ds(rMul(r, rat(1, 10))), mc: MC.thousand, say: `Percent means per hundred: move the point two places, not three. ${ps(r)} = ${ds(r)}.` });
    out.push({ t: ds(rMul(r, rat(100))), mc: MC.numeral, say: `${ps(r)} is ${ds(rMul(r, rat(100)))} hundredths, so it is ${ds(r)}, not ${ds(rMul(r, rat(100)))}.` });
  }
  // general fallbacks: ten times too big or small, in the asked form
  for (const k of [rat(10), rat(1, 10)]) {
    const v = rMul(r, k);
    if (v.n === 0 || rNum(v) > 10) continue;
    const t = formHtml(formOf(v, to));
    out.push({ t, say: `That is ${rNum(k) > 1 ? 'ten times too big' : 'ten times too small'}. ${formHtml(formOf(r, from))} = ${formHtml(formOf(r, to))}.` });
  }
  return out;
}
function threeOpts(R: () => number, r: Rat, from: Kind, to: Kind): Opt[] {
  const right = formHtml(formOf(r, to));
  const wrong: Opt[] = [];
  for (const o of wrongNames(r, from, to)) if (o.t !== right && !wrong.some(w => w.t === o.t) && wrong.length < 2) wrong.push(o);
  return [{ t: right, ok: true, say: `Yes: ${formHtml(formOf(r, from))} and ${right} are one point on the line.` }, ...wrong];
}
const threeNames: Gen = (R, n) => {
  const r = pick(R, BENCH);
  const kinds: Kind[] = shuffle(R, ['frac', 'dec', 'pct']);
  const from = kinds[0]!, to = kinds[1]!;
  const given = formOf(r, from);
  const pre = ['bar', 'top0', 'top1', 'bot0', 'bot1', 'mark', from];
  const solve = (['pct', 'frac', 'dec'] as Kind[]).filter(k => k !== from);
  return choiceItem(R, {
    id: `threeNames-${n}`, family: 'threeNames',
    prompt: `Which is the same amount as ${A(formHtml(given))}, written as ${kindName[to]}?`,
    board: `${formTex(given)} = \\,?`,
    picture: { form: { line: { wholes: 1, top: [{ v: 0, t: '0' }, { v: 1, t: '1' }], bot: pctTicks(), mark: rNum(r), names: namesOf(r) }, pre, solve, work: [`${pt(r)} = ${ft(r)} = ${ds(r)}`] } },
    solution: [`${fh(r)} = ${r.n} ÷ ${r.d} = ${ds(r)}`, `${ds(r)} = ${ds(rMul(r, rat(100)))} hundredths = ${ps(r)}`, 'All three name the same point on the line.'],
  }, threeOpts(R, r, from, to));
};

const PLACES = ['pizza', 'tank of gas', 'playlist', 'soccer field', 'bag of rice', 'school day'];
const sameAmount: Gen = (R, n, sg) => {
  const r = pick(R, BENCH.filter(b => b.d !== 100));
  const thing = pick(R, PLACES);
  const kinds: Kind[] = shuffle(R, ['frac', 'dec', 'pct']);
  let a = formOf(r, kinds[0]!), b = formOf(r, kinds[1]!), same = true, trapMc: string | undefined, trapSay = '';
  if (R() < 0.45) {
    // a look-alike that is a different amount
    same = false;
    let t = int(R, 0, 2);
    if (t === 0 && r.d === 10) t = 1;   // 7/10 -> 710% is not a believable slip
    if (t === 0) { a = formOf(r, 'frac'); b = { kind: 'pct', p: `${r.n}${r.d}` }; trapMc = MC.fracDigitsPct; trapSay = `${fh(r)} is ${ps(r)}. The digits ${r.n} and ${r.d} do not make a percent.`; }
    else if (t === 1) { a = formOf(r, 'frac'); b = { kind: 'dec', s: `0.${r.n}${r.d}` }; trapMc = MC.fracDigitsDec; trapSay = `${fh(r)} = ${r.n} ÷ ${r.d} = ${ds(r)}, not 0.${r.n}${r.d}.`; }
    else { a = formOf(r, 'dec'); b = { kind: 'pct', p: ds(rMul(r, rat(10))) }; trapMc = MC.digitsAcross; trapSay = `${ds(r)} is ${ps(r)}: a percent counts hundredths.`; }
    if (R() < 0.5) [a, b] = [b, a];
  }
  const H = (f: Form) => A(formHtml(f));
  const ctx = sg === 'context-language' ? `of the ${thing}` : 'of the same whole';
  const opts: Opt[] = [
    { t: 'Yes, the same amount', ok: same, mc: same ? undefined : trapMc, say: same ? `Yes: ${formHtml(a)} and ${formHtml(b)} are one point on the line.` : trapSay },
    { t: 'No, different amounts', ok: !same, mc: same ? MC.formsDiffer : undefined, say: same ? `Different forms, same number: ${formHtml(a)} = ${formHtml(b)}.` : `Right: ${formHtml(b)} is not ${formHtml(a)}.` },
    { t: 'Can’t tell: they are different kinds of numbers', mc: MC.formsDiffer, say: 'Fractions, decimals and percents are all numbers on one line, so you can always compare them.' },
  ];
  return choiceItem(R, {
    id: `sameAmount-${n}`, family: 'sameAmount', ...twoPinsPic(a, b),
    prompt: `Is ${H(a)} ${ctx} the same amount as ${H(b)} ${ctx}?`,
    board: `${formTex(a)} \\;\\overset{?}{=}\\; ${formTex(b)}`,
    solution: [`${formHtml(a)} = ${ds(formValue(a))}`, `${formHtml(b)} = ${ds(formValue(b))}`, same ? 'Same decimal, same amount.' : 'Different decimals, different amounts.'],
  }, opts);
};

// ===================== 2. decimal-percent-zeros =====================
const ZEROS: string[] = ['0.4', '0.3', '0.7', '0.9', '0.2', '0.6', '0.07', '0.03', '0.05', '0.09', '0.01', '0.125', '0.085', '0.075', '0.375', '0.045', '0.035', '0.625', '0.025', '0.36', '0.48', '0.52', '0.85', '0.15'];
const decPct: Gen = (R, n) => {
  const s = pick(R, ZEROS), r = decRat(s), p = rMul(r, rat(100)), pv = rNum(p);
  const toPct = R() < 0.55;
  const line: FormLineParams = { wholes: 1, top: [{ v: 0, t: '0' }, { v: 1, t: '1' }], bot: pctTicks(), mark: rNum(r), names: { pct: pt(r), dec: s } };
  const pic = { form: { line, pre: ['bar', 'top0', 'top1', 'bot0', 'bot1', 'mark', toPct ? 'dec' : 'pct'], solve: [toPct ? 'pct' : 'dec'], work: [`${s} \\times 100 = ${ds(p)}`, `${s} = ${pt(r)}`] } };
  if (toPct) {
    const key = Number(s.replace('.', ''));
    return numItem({
      id: `decPct-${n}`, family: 'decPct', prompt: `Write ${A(s)} as a percent.`, board: `${s} = \\,?\\,\\%`, unit: '%', picture: pic,
      solution: [`A percent counts hundredths.`, `${s} = ${ds(p)} hundredths`, `${s} = ${ps(r)}`],
    }, pv, `Yes: ${s} = ${ps(r)}.`, `Count hundredths: move the point two places to the right.`, [
      { v: key, mc: MC.digitsAcross, say: `Not just the digits: ${s} is ${ds(p)} hundredths, so ${ps(r)}.` },
      { v: rNum(rMul(r, rat(10))), mc: MC.centsPoint, say: `That moves the point one place. Percent is per hundred: two places, ${ps(r)}.` },
      { v: rNum(rMul(r, rat(1000))), mc: MC.thousand, say: `That moves the point three places. Percent is per hundred: two places, ${ps(r)}.` },
    ]);
  }
  return numItem({
    id: `decPct-${n}`, family: 'decPct', prompt: `Write ${A(ps(r))} as a decimal.`, board: `${pt(r)} = \\,?`, picture: pic,
    solution: [`${ps(r)} means ${ds(p)} hundredths.`, `${ds(p)} ÷ 100 = ${s}`],
  }, rNum(r), `Yes: ${ps(r)} = ${s}.`, `Percent means per hundred: divide by 100 (the point moves two places left).`, [
    { v: rNum(rMul(r, rat(1, 10))), mc: MC.thousand, say: `That divides by 1,000. ${ps(r)} ÷ 100 = ${s}.` },
    { v: rNum(rMul(r, rat(10))), mc: MC.centsPoint, say: `That moves the point only one place. ${ps(r)} = ${s}.` },
    { v: pv, mc: MC.numeral, say: `${ds(p)} is the percent numeral. As a decimal, ${ps(r)} = ${s}.` },
  ]);
};
const centsDollars: Gen = (R, n) => {
  const c = R() < 0.5 ? int(R, 1, 9) : int(R, 11, 99);
  const things = ['a pack of gum', 'a pencil', 'a sticker', 'a stamp', 'a song download', 'an apple'];
  const t = pick(R, things), mode = int(R, 0, 2);
  const d = rat(c, 100), mt = `\\$${(c / 100).toFixed(2)}`;
  const dollar: Tick[] = [{ v: 0, t: '$0', col: 'first' }, { v: 1, t: '$1', col: 'first' }], cents: Tick = { v: c / 100, t: `${c}¢`, col: 'second' };
  if (mode === 0) return numItem({
    id: `centsDollars-${n}`, family: 'centsDollars', ...pointPic(c / 100, { dec: mt }, [], ['dec'], { top: [...dollar, cents], bot: [], cut: 10 }), prompt: `${t[0]!.toUpperCase() + t.slice(1)} costs ${A(`${c} cents`)}. Write the price in dollars.`, board: `${c}\\text{ cents} = \\$\\,?`, unit: 'dollars',
    solution: ['100 cents make a dollar.', `${c} cents = ${c} hundredths of a dollar = ${$(c, true)}`],
  }, rNum(d), `Yes: ${$(c, true)}.`, '100 cents make one dollar: cents are hundredths.', [
    { v: rNum(rat(c, 10)), mc: MC.centsPoint, say: `That moves the point one place. Cents are hundredths: ${$(c, true)}.` },
    { v: c, say: `${c} dollars is a lot of money! Cents are hundredths of a dollar: ${$(c, true)}.` },
  ]);
  if (mode === 1) return numItem({
    id: `centsDollars-${n}`, family: 'centsDollars', ...pointPic(c / 100, { dec: mt }, ['dec'], [], { top: dollar, bot: [], cut: 10, ans: { ...cents, col: 'link' } }), prompt: `${t[0]!.toUpperCase() + t.slice(1)} costs ${A($(c, true))}. How many cents is that?`, board: `${tm(c, true)} = \\,?\\text{ cents}`, unit: 'cents',
    solution: ['One dollar is 100 cents.', `${$(c, true)} = ${c} cents`],
  }, c, `Yes: ${c} cents.`, 'Each dollar is 100 cents: multiply by 100.', [
    { v: rNum(rat(c, 10)), mc: MC.centsPoint, say: `That multiplies by 10. A dollar is 100 cents: ${c} cents.` },
  ]);
  return numItem({
    id: `centsDollars-${n}`, family: 'centsDollars', ...pointPic(c / 100, { dec: mt, pct: `${c}\\%` }, ['dec'], ['pct'], { top: dollar, cut: 10 }), prompt: `What percent of a dollar is ${A($(c, true))}?`, board: `${tm(c, true)} = \\,?\\,\\%\\text{ of } \\$1`, unit: '%',
    solution: ['A dollar is 100 cents.', `${$(c, true)} is ${c} of those 100 cents: ${c}%.`],
  }, c, `Yes: ${c}% of a dollar.`, 'A dollar is 100 cents, and percent counts out of 100.', [
    { v: rNum(rat(c, 10)), mc: MC.centsPoint, say: `That is one place off. ${c} cents of 100 is ${c}%.` },
    { v: rNum(d), mc: MC.numeral, say: `${$(c, true)} is the decimal. As a percent it is ${c}%.` },
  ]);
};

// ===================== 3. over-100-percent =====================
const OVER: Rat[] = [rat(5, 4), rat(3, 2), rat(7, 4), rat(2), rat(6, 5), rat(11, 10), rat(9, 5), rat(5, 2), rat(3), rat(13, 10)];
const over100: Gen = (R, n) => {
  const r = pick(R, OVER), p = rMul(r, rat(100)), pn = ds(p), dropped = rSub(r, rat(Math.floor(r.n / r.d)));
  const dir = int(R, 0, 3);
  const showable = rNum(r) <= 2;
  const line: FormLineParams = { wholes: 2, top: [{ v: 0, t: '0' }, { v: 1, t: '1' }, { v: 2, t: '2' }], bot: pctTicks(2), mark: rNum(r), names: { pct: pt(r), frac: r.d === 1 ? undefined : ft(r), dec: ds(r) } };
  const pic = (given: Kind) => (showable ? { picture: { form: { line, pre: ['bar', 'top0', 'top1', 'top2', 'bot0', 'bot1', 'bot2', 'mark', given], solve: (['pct', 'frac', 'dec'] as Kind[]).filter(k => k !== given), work: [`${pt(r)} = ${ds(r)}`, `${pt(r)} = 100\\% + ${ds(rSub(p, rat(100)))}\\%`] } } } : {});
  // the steps go from the given form to the asked one and mark the answer
  const fH = r.d > 1 ? formHtml({ kind: 'frac', r }) : String(r.n);
  const sol = dir === 0 ? [`100% is one whole.`, `${ps(r)} = ${pn} ÷ 100 = ${ans(ds(r))} wholes`]
    : dir === 1 ? [`One whole is 100%.`, `${ds(r)} wholes = ${ds(r)} × 100% = ${ans(ps(r))}`]
      : dir === 2 && r.d > 1 ? [`100% is one whole.`, `${ps(r)} = ${ds(r)} wholes`, `${ds(r)} = ${ans(fH)}`]
        : r.d > 1 ? [`One whole is 100%.`, `${fH} = ${ds(r)} wholes`, `${ds(r)} × 100% = ${ans(ps(r))}`] : [`One whole is 100%.`, `${fH} wholes = ${fH} × 100% = ${ans(ps(r))}`];
  const lessSay = `Do not drop the whole: ${ps(r)} is more than one whole, ${ds(r)}.`;
  if (dir === 0) return numItem({ id: `over100-${n}`, family: 'over100', prompt: `Write ${A(ps(r))} as a decimal.`, board: `${pt(r)} = \\,?`, ...pic('pct'), solution: sol },
    rNum(r), `Yes: ${ps(r)} = ${ds(r)}.`, 'Divide the percent by 100: 100% is 1.', [
      { v: rNum(rMul(r, rat(1, 10))), mc: MC.thousand, say: `That divides by 1,000. ${ps(r)} ÷ 100 = ${ds(r)}.` },
      { v: rNum(dropped), mc: MC.lessThanOne, say: lessSay },
      { v: rNum(rMul(r, rat(10))), mc: MC.centsPoint, say: `That moves the point one place. ${ps(r)} = ${ds(r)}.` },
    ]);
  if (dir === 1) return numItem({ id: `over100-${n}`, family: 'over100', prompt: `Write ${A(ds(r))} as a percent.`, board: `${ds(r)} = \\,?\\,\\%`, unit: '%', ...pic('dec'), solution: sol },
    rNum(p), `Yes: ${ds(r)} = ${ps(r)}.`, 'One whole is 100%: multiply by 100.', [
      { v: Number(ds(r).replace('.', '')), mc: MC.digitsAcross, say: `Not just the digits: ${ds(r)} is ${pn} hundredths, so ${ps(r)}.` },
      { v: rNum(rMul(dropped, rat(100))), mc: MC.lessThanOne, say: `Keep the whole: ${ds(r)} is more than 1, so it is more than 100%.` },
      { v: rNum(rMul(r, rat(1000))), mc: MC.thousand, say: `That is three places. Percent is per hundred: ${ps(r)}.` },
    ]);
  if (dir === 2 && r.d > 1) return fracItem({ id: `over100-${n}`, family: 'over100', prompt: `Write ${A(ps(r))} as a fraction or a mixed number.`, board: `${pt(r)} = \\,?`, ...pic('pct'), solution: sol },
    r, `Yes: ${ps(r)} = ${formHtml({ kind: 'frac', r })} (or ${r.n}/${r.d}).`, `${ps(r)} is ${pn} hundredths: ${pn}/100, then simplify.`, [
      { r: dropped, mc: MC.lessThanOne, say: lessSay },
      { r: rat(1, Number(pn)), mc: MC.onePth, say: `${ps(r)} is ${pn} out of 100, not one ${pn}th.` },
    ]);
  const f = r.d > 1 ? formHtml({ kind: 'frac', r }) : String(r.n);
  return numItem({ id: `over100-${n}`, family: 'over100', prompt: `Write ${A(f)} as a percent.`, board: `${ft(r)} = \\,?\\,\\%`, unit: '%', ...pic('frac'), solution: sol },
    rNum(p), `Yes: ${f} = ${ps(r)}.`, 'Each whole is 100%. Add the part.', [
      { v: rNum(rMul(dropped, rat(100))), mc: MC.lessThanOne, say: `Keep the whole: ${f} is more than 1, so it is more than 100%.` },
      ...(r.d > 1 ? [{ v: Number(`${Math.floor(r.n / r.d)}${r.n % r.d}${r.d}`), mc: MC.fracDigitsPct, say: `The digits are not the percent. ${f} = ${ds(r)} = ${ps(r)}.` }] : []),
    ]);
};
const GROW = [
  { s: 'This year’s science fair has', t: 'as many projects as last year.', u: 'as many projects' },
  { s: 'The sunflower is now', t: 'of its height in June.', u: 'as tall' },
  { s: 'The school sold', t: 'of last year’s ticket count.', u: 'as many tickets' },
  { s: 'The puppy now weighs', t: 'of its weight at 3 months.', u: 'as heavy' },
  { s: 'The park’s new trail is', t: 'of the old trail’s length.', u: 'as long' },
];
const overChoice: Gen = (R, n) => {
  const r = pick(R, OVER.filter(x => x.d <= 4 || x.d === 10)), g = pick(R, GROW), p = ds(rMul(r, rat(100)));
  const asFrac = r.d > 1 && R() < 0.5;
  const right = asFrac ? formHtml({ kind: 'frac', r }) : ds(r);
  const dropped = rSub(r, rat(Math.floor(r.n / r.d)));
  const opts: Opt[] = [
    { t: `${right} times ${g.u}`, ok: true, say: `Yes: ${p}% = ${ds(r)}, so ${right} times.` },
    { t: `${ds(rMul(r, rat(1, 10)))} times ${g.u}`, mc: MC.thousand, say: `That divides by 1,000. ${p}% ÷ 100 = ${ds(r)}.` },
    { t: `It can’t be: a percent can’t be more than 100%`, mc: MC.lessThanOne, say: `A percent can be more than 100%: 100% is the old amount, and ${p}% is more than that.` },
  ];
  if (dropped.n > 0 && R() < 0.5) opts[1] = { t: `${asFrac ? formHtml({ kind: 'frac', r: dropped }) : ds(dropped)} times ${g.u}`, mc: MC.lessThanOne, say: `Keep the whole: ${p}% is more than 100%, so it is ${right} times.` };
  return choiceItem(R, {
    id: `overChoice-${n}`, family: 'overChoice', ...pointPic(rNum(r), namesOf(r), ['pct'], ['dec', 'frac']), prompt: `${g.s} ${A(p + '%')} ${g.t} Which says the same thing?`, board: `${p}\\% = \\,?`,
    solution: ['100% is the old amount: one whole.', `${p}% = ${p} ÷ 100 = ${ds(r)} wholes`],
  }, opts);
};

// ===================== 4. same-whole-check =====================
const WHOLES = [
  { a: 'Ms. Lee’s class', b: 'Mr. Ruiz’s class', u: 'students', v: 'bike to school' },
  { a: 'the Hawks', b: 'the Comets', u: 'games', v: 'were wins' },
  { a: 'the red jar', b: 'the blue jar', u: 'jelly beans', v: 'are lemon' },
  { a: 'the morning bus', b: 'the evening bus', u: 'riders', v: 'are students' },
  { a: 'Maya’s playlist', b: 'Eli’s playlist', u: 'songs', v: 'are country' },
];
const SW: Rat[] = [rat(1, 2), rat(1, 4), rat(3, 4), rat(1, 5), rat(2, 5), rat(3, 5), rat(1, 10), rat(3, 10)];
const sameWhole: Gen = (R, n) => {
  const r = pick(R, SW), c = pick(R, WHOLES);
  const W1 = r.d * int(R, 2, Math.floor(200 / r.d)); let W2 = W1;
  const same = R() < 0.4;
  while (!same && W2 === W1) W2 = r.d * int(R, 2, Math.floor(200 / r.d));
  const a1 = rNum(rMul(r, rat(W1))), a2 = rNum(rMul(r, rat(W2)));
  const opts: Opt[] = same ? [
    { t: `Yes: same whole, and ${fh(r)} = ${ps(r)}`, ok: true, say: `Yes: both are ${fh(r)} of ${W1}, which is ${a1} ${c.u}.` },
    { t: `No: ${fh(r)} and ${ps(r)} are different amounts`, mc: MC.formsDiffer, say: `${fh(r)} = ${ps(r)}: one number, two names. Same whole, so the same amount.` },
    { t: `No: ${ps(r)} has bigger digits`, mc: MC.digitsAcross, say: `Compare values, not digits: ${fh(r)} = ${ds(r)} = ${ps(r)}.` },
  ] : [
    { t: 'No: the wholes are different sizes', ok: true, say: `Right: ${fh(r)} of ${W1} is ${a1}, but ${ps(r)} of ${W2} is ${a2}.` },
    { t: `Yes: ${fh(r)} = ${ps(r)}, so it’s the same number`, mc: MC.wholes, say: `Same share, different wholes: ${fh(r)} of ${W1} is ${a1}, ${ps(r)} of ${W2} is ${a2}.` },
    { t: `No: ${fh(r)} and ${ps(r)} are different amounts`, mc: MC.formsDiffer, say: `${fh(r)} = ${ps(r)} is the same share. The difference is the size of the wholes.` },
  ];
  return choiceItem(R, {
    id: `sameWhole-${n}`, family: 'sameWhole',
    prompt: `In ${c.a}, ${A(fh(r))} of the ${A(W1)} ${c.u} ${c.v}. In ${c.b}, ${A(ps(r))} of the ${A(W2)} ${c.u} ${c.v}. Is it the same number of ${c.u}?`,
    board: `${ft(r)}\\text{ of } ${W1} \\;\\overset{?}{=}\\; ${pt(r)}\\text{ of } ${W2}`,
    solution: [`${fh(r)} = ${ps(r)}: the same share.`, `${fh(r)} of ${W1} = ${a1}`, `${ps(r)} of ${W2} = ${a2}`, same ? 'Same whole, same amount.' : 'Same share of different wholes: different amounts.'],
  }, opts);
};
const moreHow: Gen = (R, n) => {
  const r = pick(R, SW), c = pick(R, WHOLES);
  const W1 = r.d * int(R, 2, Math.floor(100 / r.d)); let W2 = W1;
  while (W2 === W1) W2 = r.d * int(R, 2, Math.floor(200 / r.d));
  const a1 = rNum(rMul(r, rat(W1))), a2 = rNum(rMul(r, rat(W2)));
  const big = a2 > a1 ? c.b : c.a, diff = Math.abs(a2 - a1);
  return numItem({
    id: `moreHow-${n}`, family: 'moreHow',
    prompt: `In ${c.a}, ${A(fh(r))} of the ${A(W1)} ${c.u} ${c.v}. In ${c.b}, ${A(ps(r))} of the ${A(W2)} ${c.u} ${c.v}. How many more ${c.u} in ${big}?`,
    // the bigger amount first, so the board works out the positive difference that is asked
    board: a2 > a1 ? `${pt(r)}\\text{ of } ${W2} - ${ft(r)}\\text{ of } ${W1}` : `${ft(r)}\\text{ of } ${W1} - ${pt(r)}\\text{ of } ${W2}`, unit: c.u,
    solution: [`${fh(r)} of ${W1} = ${W1} ÷ ${r.d}${r.n > 1 ? ` × ${r.n}` : ''} = ${a1}`, `${ps(r)} of ${W2} = ${fh(r)} of ${W2} = ${a2}`, `${Math.max(a1, a2)} − ${Math.min(a1, a2)} = ${diff}`],
  }, diff, `Yes: ${a1} and ${a2}, so ${diff} more.`, `Find each amount first: the share is the same, the wholes are not.`, [
    { v: 0, mc: MC.wholes, say: `${fh(r)} = ${ps(r)}, but the wholes differ: ${a1} and ${a2} ${c.u}.` },
    { v: Math.abs(W2 - W1), say: `That is the difference of the wholes. Take ${fh(r)} of each first.` },
  ]);
};

// ===================== 5. context-language =====================
const contextMatch: Gen = (R, n) => {
  const t = int(R, 0, 4);
  if (t === 0) {
    const r = pick(R, [rat(1, 4), rat(1, 2), rat(3, 4), rat(1, 5), rat(2, 5), rat(1, 10), rat(3, 10)]);
    return choiceItem(R, { id: `contextMatch-${n}`, family: 'contextMatch', ...pointPic(rNum(r), namesOf(r), ['frac'], ['pct', 'dec'], { top: [{ v: 0, t: '0' }, { v: 1, t: 'price' }] }), prompt: `A sale sign says ${A(fh(r) + ' off')}. Which sign means the same discount?`, board: `${ft(r)}\\text{ off} = \\,?`, solution: [`${fh(r)} = ${r.n} ÷ ${r.d} = ${ds(r)}`, `${ds(r)} = ${ps(r)}`] }, [
      { t: `${ps(r)} off`, ok: true, say: `Yes: ${fh(r)} = ${ps(r)}.` },
      { t: `${r.n}${r.d}% off`, mc: MC.fracDigitsPct, say: `The digits of ${fh(r)} are not a percent: ${fh(r)} = ${ps(r)}.` },
      { t: `${ds(rMul(r, rat(10)))}% off`, mc: MC.centsPoint, say: `That is ten times too small. ${fh(r)} = ${ds(r)} = ${ps(r)}.` },
    ]);
  }
  if (t === 1) {
    const c = pick(R, [25, 50, 75, 20, 5, 30]), r = rat(c, 100);
    return choiceItem(R, { id: `contextMatch-${n}`, family: 'contextMatch', ...pointPic(c / 100, { frac: ft(r), dec: ds(r) }, [], ['frac', 'dec'], { top: [{ v: 0, t: '$0' }, { v: 1, t: '$1' }, { v: c / 100, t: c + '¢', col: 'second' }], bot: [], cut: 10 }), prompt: `${A(c + ' cents')} is what part of a dollar?`, board: `${c}\\text{¢} = \\,?\\text{ of } \\$1`, solution: [`A dollar is 100 cents.`, `${c} cents = ${c}/100 of a dollar = ${fh(r)}`] }, [
      { t: `${fh(r)} of a dollar`, ok: true, say: `Yes: ${c} of 100 cents is ${fh(r)}.` },
      { t: `${fh(rat(1, c))} of a dollar`, mc: MC.onePth, say: `${c} cents is ${c} out of 100, not one ${c}th of a dollar.` },
      { t: `${fh(rat(c, 1000))} of a dollar`, mc: MC.centsPoint, say: `A dollar is 100 cents, not 1,000: ${c} cents = ${fh(r)}.` },
    ].filter((o, i, a) => a.findIndex(x => x.t === o.t) === i));
  }
  if (t === 2) {
    const s = pick(R, ['.250', '.200', '.300', '.500', '.400', '.750']), r = decRat('0' + s);
    const one = s.replace(/0+$/, '').slice(1);
    return choiceItem(R, { id: `contextMatch-${n}`, family: 'contextMatch', ...pointPic(rNum(r), { dec: s, frac: ft(r) }, ['dec'], ['frac'], { bot: [] }), prompt: `A batting average of ${A(s)} means a hit in what fraction of at-bats?`, board: `${s} = \\,?`, solution: [`${s} = ${s.slice(1, 4)} thousandths = ${ds(r)}`, `${ds(r)} = ${fh(r)}`] }, [
      { t: fh(r), ok: true, say: `Yes: ${s} = ${ds(r)} = ${fh(r)} of at-bats.` },
      one.length === 1 && one !== '1' ? { t: fh(rat(1, Number(one))), mc: MC.tenthsUnit, say: `${s} is ${one} tenths, so ${fh(r)}, not ${fh(rat(1, Number(one)))}.` } : { t: fh(rat(1, Number(s.slice(1)))), mc: MC.onePth, say: `${s} is ${s.slice(1)} thousandths, which is ${fh(r)}.` },
      { t: fh(rat(Number(s.slice(1, 3)), 1000)), say: `Read the place value: ${s} = ${ds(r)} = ${fh(r)}.` },
    ]);
  }
  if (t === 3) {
    const s = pick(R, ['0.5', '0.25', '0.75', '1.5', '1.25']), r = decRat(s);
    const d1 = s.replace(/^\d\./, '');
    const opts: Opt[] = [{ t: `${fh(r)} cup${rNum(r) > 1 ? 's' : ''}`, ok: true, say: `Yes: ${s} = ${fh(r)}.` }];
    if (d1.length === 1) opts.push({ t: `${fh(rat(Math.floor(rNum(r)) * Number(d1) + 1, Number(d1)))} cup`, mc: MC.tenthsUnit, say: `${s} has ${d1} tenths: ${fh(r)}, not one ${d1 === '5' ? 'fifth' : d1 + 'th'}.` });
    else opts.push({ t: `${fh(rat(Number(d1[0]), Number(d1[1])))} cup`, mc: MC.fracDigitsDec, say: `The digits after the point are hundredths: ${s} = ${fh(r)}.` });
    opts.push({ t: `${fh(rMul(r, rat(1, 10)))} cup`, say: `That is ten times too small: ${s} = ${fh(r)}.` });
    return choiceItem(R, { id: `contextMatch-${n}`, family: 'contextMatch', ...pointPic(rNum(r), { dec: s, frac: ft(r) }, ['dec'], ['frac'], { top: ticksN(Math.max(1, Math.ceil(rNum(r) - 1e-9)), cupT), bot: [], cut: 4 }), prompt: `A recipe says ${A(s + ' cup')} of milk. Your measuring cups are marked in fractions. Which amount do you measure?`, board: `${s}\\text{ cup} = \\,?`, solution: [`${s} = ${fh(r)}`] }, opts);
  }
  const [a, b] = pick(R, [[1, 2], [1, 4], [1, 5], [1, 10], [3, 4], [2, 5], [3, 10], [1, 20], [1, 25]] as [number, number][]);
  const r = rat(a, b);
  return choiceItem(R, { id: `contextMatch-${n}`, family: 'contextMatch', ...pointPic(rNum(r), namesOf(r), ['frac'], ['pct', 'dec'], { top: [{ v: 0, t: '0' }, { v: 1, t: 'all' }] }), prompt: `In a survey, ${A(`${a} in ${b}`)} students walk to school. What percent is that?`, board: `${a}\\text{ in } ${b} = \\,?\\,\\%`, solution: [`${a} in ${b} = ${fh(r)}`, `${fh(r)} = ${ds(r)} = ${ps(r)}`] }, [
    { t: ps(r), ok: true, say: `Yes: ${a} in ${b} = ${fh(r)} = ${ps(r)}.` },
    { t: `${a}${b}%`, mc: MC.fracDigitsPct, say: `The digits are not the percent. ${a} in ${b} = ${fh(r)} = ${ps(r)}.` },
    { t: `${b}%`, say: `${a} in ${b} is ${fh(r)} of the students, which is ${ps(r)}.` },
  ].filter((o, i, x) => x.findIndex(y => y.t === o.t) === i));
};

/** "a" or "an" before a number as it is read aloud: an 18% tip, an $80 jacket, an 11.5% tax; a 110% ... */
const an = (s: string, cap = false) => { const t = s.replace(/<[^>]+>/g, '').replace(/^\$/, ''); const w = /^(8|1[18](?!\d))/.test(t) ? 'an' : 'a'; return cap ? w[0]!.toUpperCase() + w.slice(1) : w; };
// ===================== 6. fraction-form-benchmark =====================
const BENCH_P = ['25', '50', '75', '10', '20', '40'];
function wholeFor(R: () => number, d: number, lo: number, hi: number): number { return d * int(R, Math.ceil(lo / d), Math.floor(hi / d)); }
const CTX_OF = [
  { pre: (p: string, w: string) => `${an(w, true)} ${w} jacket is ${p} off. How much is the discount?`, money: true, unit: 'dollars' },
  { pre: (p: string, w: string) => `${an(w, true)} ${w} dinner bill gets ${an(p)} ${p} tip. How much is the tip?`, money: true, unit: 'dollars' },
  { pre: (p: string, w: string) => `${p} of the ${w} seats on a plane are by a window. How many is that?`, money: false, unit: 'seats' },
  { pre: (p: string, w: string) => `${an(w, true)} ${w} video game is ${p} off. How much do you save?`, money: true, unit: 'dollars' },
];
const fractionRoute: Gen = (R, n, sg) => {
  const p = sg === 'convenience-compare' ? pick(R, ['12.5', '25', '50', '12.5']) : pick(R, BENCH_P);
  const f = pctRat(p), W = wholeFor(R, f.d, 12, sg === 'convenience-compare' ? 96 : 200);
  const ctx = pick(R, CTX_OF), ans = rMul(f, rat(W)), av = rNum(ans);
  const w = ctx.money ? $(W * 100) : String(W), aT = ctx.money ? $(Math.round(av * 100)) : String(av);
  const line: FormLineParams = { wholes: 1, top: amountTicks(ctx.money ? '$0' : '0', w, rNum(f), aT), bot: pctTicks(), cut: f.d, fills: [{ a: 0, b: rNum(f), col: 'link' }], mark: rNum(f), names: { pct: `${p}\\%`, frac: ft(f), dec: ds(f) } };
  const work = [`${p}\\% = ${ft(f)}`, `${W} \\div ${f.d} = ${W / f.d}`, ...(f.n > 1 ? [`${W / f.d} \\times ${f.n} = ${av}`] : [])];
  const pv = Number(p);
  return numItem({
    id: `fractionRoute-${n}`, family: 'fractionRoute', prompt: ctx.pre(A(p + '%'), A(w)) + (sg === 'convenience-compare' && p === '12.5' ? ` (${fh(rat(1, 8))} = 12.5%)` : ''),
    board: `${p}\\%\\text{ of } ${ctx.money ? tm(W * 100) : W}`, unit: ctx.unit,
    picture: { form: { line, pre: ['bar', 'top0', 'top1', 'bot0', 'bot1', 'mark', 'pct'], solve: ['frac', 'cut', 'fill0', 'top2', 'dec'], work } },
    solution: [`${p}% = ${fh(f)}`, `${fh(f)} of ${W}: ${W} ÷ ${f.d} = ${W / f.d}${f.n > 1 ? `, × ${f.n} = ${av}` : ''}`, `${p}% of ${w} = ${aT}`],
  }, av, `Yes: ${p}% = ${fh(f)}, so ${W} ÷ ${f.d}${f.n > 1 ? ` × ${f.n}` : ''} = ${aT}.`, `${p}% is ${fh(f)}: split ${w} into ${f.d} equal parts${f.n > 1 ? ` and take ${f.n}` : ''}.`, [
    { v: W / pv, mc: MC.onePth, say: `${p}% is not one ${p}th. It is ${fh(f)}: ${W} ÷ ${f.d}${f.n > 1 ? ` × ${f.n}` : ''}.` },
    { v: W * pv, mc: MC.numeral, say: `${p}% is ${p} hundredths, not ${p}. Use ${fh(f)} of ${W}.` },
    { v: W - av, say: `That is what is left. The question asks for the ${p}% part itself.` },
  ]);
};
const whichFraction: Gen = (R, n) => {
  const p = pick(R, ['25', '50', '75', '20', '40']), f = pctRat(p), W = wholeFor(R, f.d, 12, 200), pv = Number(p);
  const right = f.n > 1 ? `${W} ÷ ${f.d}, then × ${f.n}` : `${W} ÷ ${f.d}`;
  return choiceItem(R, {
    id: `whichFraction-${n}`, family: 'whichFraction', ...asPic(percentOfPic(p, $(W * 100), $(Math.round(rNum(rMul(f, rat(W * 100))))))), prompt: `To find ${A(p + '%')} of ${A($(W * 100))} in your head, which works?`, board: `${p}\\%\\text{ of } ${tm(W * 100)}`,
    solution: [`${p}% = ${fh(f)}`, `${fh(f)} of ${W}: ${right}`],
  }, [
    { t: right, ok: true, say: `Yes: ${p}% = ${fh(f)}.` },
    { t: `${W} ÷ ${pv}`, mc: MC.onePth, say: `${p}% is not one ${p}th. ${p}% = ${fh(f)}.` },
    { t: `${W} × ${pv}`, mc: MC.numeral, say: `${p}% is ${p} hundredths. Multiplying by ${p} makes it 100 times too big.` },
  ]);
};
const routeEqual: Gen = (R, n, sg) => {
  const [a, b] = two(R);
  if (sg === 'decimal-multiplier-choice') {
    const p = pick(R, ['18', '15', '35', '12']), tens = Math.floor(Number(p) / 10), rest = Number(p) - 10 * tens;
    const W = pick(R, [20, 30, 40, 45, 50, 60, 80, 90]);
    return choiceItem(R, {
      id: `routeEqual-${n}`, family: 'routeEqual', ...asPic(percentOfPic(p, $(W * 100), $(W * Number(p)), { decomp: true })), board: `${p}\\%\\text{ of } ${tm(W * 100)}`,
      prompt: `${a} finds ${an(p)} ${A(p + '%')} tip on ${A($(W * 100))} as ${tens > 1 ? `${tens} × 10%` : '10%'} + ${rest}%. ${b} works out ${ds(pctRat(p))} × ${W}. What is true?`,
      solution: [`10% of ${$(W * 100)} = ${$(W * 10)}, ${rest}% = ${$(W * rest)}`, `${a}: ${$(W * 10 * tens, true)} + ${$(W * rest, true)} = ${$(W * Number(p), true)}`, `${b}: ${ds(pctRat(p))} × ${W} = ${ds(rMul(pctRat(p), rat(W)))}`],
    }, [
      { t: 'Both routes give the same tip', ok: true, say: `Yes: ${p}% is one number; splitting it or using ${ds(pctRat(p))} gives the same ${$(W * Number(p), true)}.` },
      { t: `Only ${b} is right: a percent has to become a decimal`, mc: MC.oneMethod, say: `Any valid route works. ${tens > 1 ? `${tens} × 10%` : '10%'} + ${rest}% is ${p}%, so ${a} is right too.` },
      { t: 'They give different tips: the routes are different', mc: MC.disagree, say: `Two correct routes for the same number always agree: both give ${$(W * Number(p), true)}.` },
    ]);
  }
  const p = pick(R, BENCH_P), f = pctRat(p), W = wholeFor(R, f.d, 12, 200);
  return choiceItem(R, {
    id: `routeEqual-${n}`, family: 'routeEqual', ...asPic(percentOfPic(p, $(W * 100), $(Math.round(rNum(rMul(f, rat(W * 100))))))), board: `${p}\\%\\text{ of } ${tm(W * 100)}`,
    prompt: `${a} finds ${A(p + '%')} of ${A($(W * 100))} as ${fh(f)} of ${W}. ${b} works out ${ds(f)} × ${W}. What is true?`,
    solution: [`${p}% = ${fh(f)} = ${ds(f)}: one number.`, `${fh(f)} of ${W} = ${rNum(rMul(f, rat(W)))}`, `${ds(f)} × ${W} = ${rNum(rMul(f, rat(W)))}`],
  }, [
    { t: 'Both routes give the same amount', ok: true, say: `Yes: ${fh(f)} and ${ds(f)} are one number, so both give ${$(Math.round(rNum(rMul(f, rat(W * 100)))))}.` },
    { t: `Only ${b} is right: a percent has to become a decimal`, mc: MC.oneMethod, say: `${p}% = ${fh(f)} exactly, so ${a}’s route is just as right, and quicker in your head.` },
    { t: 'They give different amounts: the forms are different', mc: MC.disagree, say: `${fh(f)} = ${ds(f)}. The same number times ${W} gives the same answer.` },
  ]);
};

// ===================== 7. decimal-multiplier-choice =====================
const ROUTE_P = ['6', '7.5', '18', '37', '15', '8', '35', '2.5', '12', '45', '5', '7'];
function exactAmount(R: () => number, p: string): number {
  for (let k = 0; k < 80; k++) {
    const c = int(R, 16, 96) * 100 + pick(R, [0, 0, 50, 25, 75, 20, 40]);
    if (pctOfCents(p, c) !== null) return c;
  }
  return 100 * 20 * int(R, 1, 4);   // a multiple of $20 always works for these percents
}
const routeCompute: Gen = (R, n) => {
  const p = pick(R, ROUTE_P), f = pctRat(p), A0 = exactAmount(R, p), ans = pctOfCents(p, A0)!, pv = Number(p);
  const kind = ['6', '7.5', '8', '2.5', '5', '7'].includes(p) ? 'tax' : ['18', '15'].includes(p) ? 'tip' : 'discount';
  const prompt = kind === 'tax' ? `The sales tax is ${A(p + '%')} on ${an($(A0, true))} ${A($(A0, true))} purchase. How much is the tax?`
    : kind === 'tip' ? `You leave ${an(p)} ${A(p + '%')} tip on ${an($(A0, true))} ${A($(A0, true))} bill. How much is the tip?`
      : `${an($(A0, true), true)} ${A($(A0, true))} bike helmet is ${A(p + '%')} off. How much is the discount?`;
  const tens = Math.floor(pv / 10), rest = pv - tens * 10, decomp = ['15', '18', '35', '45'].includes(p);
  const work = decomp ? [`${tens > 1 ? tens + ' \\times ' : ''}10\\% = ${tm((A0 / 10) * tens, true)}`, `${rest}\\% = ${tm(A0 * rest / 100, true)}`, `${p}\\% = ${tm(ans, true)}`]
    : [`${p}\\% = ${ds(f)}`, `${ds(f)} \\times ${ds(rat(A0, 100))} = ${ds(rat(ans, 100))}`];
  const line: FormLineParams = { wholes: 1, top: amountTicks('$0', $(A0, true), rNum(f), $(ans, true)), bot: pctTicks(), cut: 10,
    fills: decomp ? [{ a: 0, b: tens / 10, col: 'link' }, { a: tens / 10, b: rNum(f), col: 'pick' }] : [{ a: 0, b: rNum(f), col: 'link' }], mark: rNum(f), names: { pct: `${p}\\%`, dec: ds(f) } };
  return numItem({
    id: `routeCompute-${n}`, family: 'routeCompute', prompt, board: `${p}\\%\\text{ of } ${tm(A0, true)}`, unit: 'dollars',
    picture: { form: { line, pre: ['bar', 'top0', 'top1', 'bot0', 'bot1', 'mark', 'pct'], solve: ['cut', 'fill0', ...(decomp ? ['fill1'] : []), 'dec', 'top2'], work } },
    solution: decomp ? [`${p}% = ${tens > 1 ? `${tens} × 10%` : '10%'} + ${rest}%`, `10% of ${$(A0, true)} = ${$(A0 / 10, true)}, ${rest}% = ${$(A0 * rest / 100, true)}`, `${tens > 1 ? `${tens} × ${$(A0 / 10, true)} + ` : `${$(A0 / 10, true)} + `}${$(A0 * rest / 100, true)} = ${$(ans, true)}`]
      : [`${p}% = ${ds(f)}`, `${ds(f)} × ${ds(rat(A0, 100))} = ${ds(rat(ans, 100))}`, `The ${kind} is ${$(ans, true)}.`],
  }, ans / 100, `Yes: ${$(ans, true)}.`, decomp ? `Split ${p}% into 10% pieces and the rest: 10% of ${$(A0, true)} is ${$(A0 / 10, true)}.` : `Use the decimal multiplier: ${p}% = ${ds(f)}.`, [
    { v: ans, mc: MC.numeral, say: `${p}% is ${ds(f)}, not ${p}: that answer is 100 times too big.` },
    { v: ans / 10, mc: MC.centsPoint, say: `The point is one place off. ${p}% of ${$(A0, true)} is ${$(ans, true)}.` },
    { v: ans / 1000, mc: MC.centsPoint, say: `The point is one place off. ${p}% of ${$(A0, true)} is ${$(ans, true)}.` },
    { v: A0 / 100 / pv, mc: MC.onePth, say: `${p}% is not one ${p}th: it is ${ds(f)} of the amount.` },
  ]);
};
const routePick: Gen = (R, n) => {
  const p = pick(R, ROUTE_P), f = pctRat(p), A0 = exactAmount(R, p), a = ds(rat(A0, 100));
  const all: Opt[] = [
    { t: `${ds(f)} × ${a}`, ok: true, say: `Yes: ${p}% = ${ds(f)}.` },
    { t: `${ds(rMul(f, rat(10)))} × ${a}`, mc: MC.centsPoint, say: `${ds(rMul(f, rat(10)))} is ${ps(rMul(f, rat(10)))}. ${p}% = ${ds(f)}: two places, not one.` },
    { t: `${a} ÷ ${p}`, mc: MC.onePth, say: `${p}% is not one ${p}th: it is ${ds(f)} of the amount.` },
    { t: `${p} × ${a}`, mc: MC.numeral, say: `${p}% is ${p} hundredths: use ${ds(f)}, not ${p}.` },
  ];
  const opts = [all[0]!, ...shuffle(R, all.slice(1)).slice(0, 2)];
  return choiceItem(R, {
    id: `routePick-${n}`, family: 'routePick', ...asPic(percentOfPic(p, $(A0, true), $(pctOfCents(p, A0)!, true))), prompt: `Which calculation finds ${A(p + '%')} of ${A($(A0, true))}?`, board: `${p}\\%\\text{ of } ${tm(A0, true)}`,
    solution: [`${p}% = ${p} ÷ 100 = ${ds(f)}`, `${ds(f)} × ${a} = ${ds(rat(pctOfCents(p, A0)!, 100))}`],
  }, opts);
};

// ===================== 8. common-form-compare =====================
function randomForm(R: () => number, over: boolean): Form {
  const k = int(R, 0, 2);
  if (k === 0) { const d = pick(R, [2, 4, 5, 8, 10, 20, 25]); const nn = int(R, 1, over ? Math.floor(1.5 * d) : d - 1); return { kind: 'frac', r: rat(nn, d) }; }
  if (k === 1) { const places = int(R, 1, 3); const v = int(R, 1, (over ? 15 : 9) * 10 ** (places - 1)); return { kind: 'dec', s: ds(rat(v, 10 ** places)) }; }
  const p = R() < 0.25 ? pick(R, ['12.5', '37.5', '62.5', '87.5']) : String(int(R, 1, over ? 150 : 99));
  return { kind: 'pct', p };
}
const val = (f: Form) => rNum(formValue(f));
const orderForms: Gen = (R, n) => {
  const over = R() < 0.3, greatest = R() < 0.6;
  let fs: Form[] = [];
  for (let k = 0; k < 400; k++) {
    fs = [randomForm(R, over), randomForm(R, over), randomForm(R, over)];
    const vs = fs.map(val), keys = fs.map(digitKey);
    if (new Set(vs).size < 3 || new Set(fs.map(f => f.kind)).size < 2) continue;
    if (new Set(fs.map(formHtml)).size < 3) continue;
    const best = greatest ? vs.indexOf(Math.max(...vs)) : vs.indexOf(Math.min(...vs));
    const kBest = greatest ? keys.indexOf(Math.max(...keys)) : keys.indexOf(Math.min(...keys));
    if (best !== kBest && new Set(keys).size === 3) break;
    if (k === 399) fs = [{ kind: 'frac', r: rat(3, 8) }, { kind: 'dec', s: '0.4' }, { kind: 'pct', p: '35' }];
  }
  const vs = fs.map(val), keys = fs.map(digitKey);
  const best = greatest ? vs.indexOf(Math.max(...vs)) : vs.indexOf(Math.min(...vs));
  const kBest = greatest ? keys.indexOf(Math.max(...keys)) : keys.indexOf(Math.min(...keys));
  const decs = fs.map(f => ds(formValue(f)));
  const opts: Opt[] = fs.map((f, i) => i === best
    ? { t: formHtml(f), ok: true, say: `Yes: as decimals, ${fs.map((g, j) => `${formHtml(g)} = ${decs[j]}`).join(', ')}.` }
    : { t: formHtml(f), mc: i === kBest ? MC.denomDigits : undefined, say: `Put them all in one form first: ${fs.map((g, j) => `${formHtml(g)} = ${decs[j]}`).join(', ')}.` });
  return choiceItem(R, {
    id: `orderForms-${n}`, family: 'orderForms', ...asPic(pinsPic(fs)), prompt: `Which is the ${greatest ? 'greatest' : 'least'}: ${fs.map(f => A(formHtml(f))).join(', ')}?`,
    board: fs.map(formTex).join(',\\;\\; '),
    solution: [...fs.map((f, i) => `${formHtml(f)} = ${decs[i]}`), `Compare the decimals: the ${greatest ? 'greatest' : 'least'} is ${formHtml(fs[best]!)}.`],
  }, opts);
};
const PAIRS: [Form, Form][] = [
  [{ kind: 'dec', s: '0.6' }, { kind: 'frac', r: rat(5, 8) }], [{ kind: 'frac', r: rat(3, 8) }, { kind: 'dec', s: '0.4' }],
  [{ kind: 'frac', r: rat(2, 5) }, { kind: 'pct', p: '35' }], [{ kind: 'dec', s: '1.2' }, { kind: 'pct', p: '115' }],
  [{ kind: 'frac', r: rat(2, 5) }, { kind: 'dec', s: '0.4' }], [{ kind: 'frac', r: rat(3, 4) }, { kind: 'pct', p: '75' }],
  [{ kind: 'dec', s: '0.09' }, { kind: 'pct', p: '9' }], [{ kind: 'frac', r: rat(7, 8) }, { kind: 'dec', s: '0.85' }],
  [{ kind: 'pct', p: '45' }, { kind: 'frac', r: rat(1, 2) }], [{ kind: 'dec', s: '0.125' }, { kind: 'pct', p: '15' }],
  [{ kind: 'frac', r: rat(5, 4) }, { kind: 'pct', p: '120' }], [{ kind: 'dec', s: '0.3' }, { kind: 'frac', r: rat(1, 4) }],
  [{ kind: 'pct', p: '60' }, { kind: 'frac', r: rat(5, 8) }], [{ kind: 'dec', s: '0.7' }, { kind: 'pct', p: '68' }],
  [{ kind: 'frac', r: rat(3, 5) }, { kind: 'dec', s: '0.06' }], [{ kind: 'pct', p: '150' }, { kind: 'frac', r: rat(3, 2) }],
];
const compareTwo: Gen = (R, n) => {
  const [a, b] = shuffle(R, pick(R, PAIRS).slice()) as [Form, Form];
  const va = val(a), vb = val(b), eq = near(va, vb), da = ds(formValue(a)), db = ds(formValue(b));
  const keyBig = digitKey(a) > digitKey(b) ? a : b;
  const why = `${formHtml(a)} = ${da} and ${formHtml(b)} = ${db}.`;
  const opt = (f: Form): Opt => {
    const right = !eq && near(val(f), Math.max(va, vb));
    return right ? { t: formHtml(f), ok: true, say: `Yes: ${why}` } : { t: formHtml(f), mc: eq ? MC.formsDiffer : f === keyBig ? MC.denomDigits : undefined, say: eq ? `They are equal: ${why}` : `Use one form: ${why}` };
  };
  return choiceItem(R, {
    id: `compareTwo-${n}`, family: 'compareTwo', ...asPic(pinsPic([a, b])), prompt: `Which is more: ${A(formHtml(a))} or ${A(formHtml(b))}?`, board: `${formTex(a)} \\;\\;?\\;\\; ${formTex(b)}`,
    solution: [`${formHtml(a)} = ${da}`, `${formHtml(b)} = ${db}`, eq ? 'The same number.' : `${near(va, Math.max(va, vb)) ? formHtml(a) : formHtml(b)} is more.`],
  }, [opt(a), opt(b), { t: 'They are equal', ok: eq, mc: undefined, say: eq ? `Yes: ${why}` : `Not equal: ${why}` }]);
};

// ===================== 9. reporting-form =====================
const reportForm: Gen = (R, n) => {
  const t = int(R, 0, 5);
  const third = (s: string): Opt => ({ t: s, mc: MC.oneForm, say: 'That is the same amount, but it is not how this is usually written here.' });
  if (t === 0) {
    const r = pick(R, [rat(1, 2), rat(1, 4), rat(3, 4), rat(3, 2), rat(5, 4)]), what = pick(R, ['butter', 'flour', 'milk', 'sugar']);
    return choiceItem(R, { id: `reportForm-${n}`, family: 'reportForm', ...pointPic(rNum(r), namesOf(r), ['frac', 'dec', 'pct'], [], { top: ticksN(Math.max(1, Math.ceil(rNum(r) - 1e-9)), cupT), bot: [], cut: 4 }), prompt: `A recipe card lists the ${what}. Which way fits a recipe best?`, board: `${ft(r)} = ${ds(r)} = ${pt(r)}`, solution: ['Measuring cups are marked in fractions.', `Write ${fh(r)} cup${rNum(r) > 1 ? 's' : ''}.`] }, [
      { t: `${fh(r)} cup${rNum(r) > 1 ? 's' : ''}`, ok: true, say: 'Yes: measuring cups are marked in fractions.' },
      { ...third(`${ds(r)} cup${rNum(r) > 1 ? 's' : ''}`), say: 'Same amount, but measuring cups show fractions, so a cook reads fractions faster.' },
      { ...third(`${ps(r)} of a cup`), say: 'Same amount, but nobody measures a percent of a cup.' },
    ]);
  }
  if (t === 1) {
    const r = pick(R, [rat(3, 8), rat(5, 8), rat(1, 8), rat(7, 8), rat(1, 4), rat(3, 4)]);
    return choiceItem(R, { id: `reportForm-${n}`, family: 'reportForm', ...pointPic(rNum(r), namesOf(r), ['frac', 'dec', 'pct'], [], { top: [{ v: 0, t: '0 in.' }, { v: 1, t: '1 in.' }], bot: [], cut: 8 }), prompt: `A woodworker measures a board with an inch ruler marked in eighths. How should she write the extra length?`, board: `${ft(r)} = ${ds(r)} = ${pt(r)}`, solution: ['An inch ruler is marked in halves, fourths and eighths.', `Write ${fh(r)} inch.`] }, [
      { t: `${fh(r)} inch`, ok: true, say: 'Yes: the ruler is marked in eighths, so a fraction matches the marks.' },
      { ...third(`${ds(r)} inch`), say: `Same amount, but ${ds(r)} is not a mark on an inch ruler.` },
      { ...third(`${ps(r)} of an inch`), say: 'Same amount, but rulers are not marked in percents.' },
    ]);
  }
  if (t === 2) {
    const c = pick(R, [250, 125, 175, 350, 450, 150]), r = rat(c, 100), what = pick(R, ['a sandwich', 'a notebook', 'a smoothie', 'a bus ride']);
    return choiceItem(R, { id: `reportForm-${n}`, family: 'reportForm', ...pointPic(rNum(r), namesOf(r), ['frac', 'dec', 'pct'], [], { top: ticksN(Math.ceil(rNum(r) - 1e-9), i => '$' + i), bot: [], cut: 4 }), prompt: `A store tags the price of ${what}. Which way should the tag show it?`, board: `${ft(r)} = ${ds(r)} = ${pt(r)}`, solution: ['Prices are written in dollars and cents: a decimal.', `Write ${$(c, true)}.`] }, [
      { t: $(c, true), ok: true, say: 'Yes: prices are dollars and cents, a decimal with two places.' },
      { ...third(`${fh(r)} dollars`), say: 'Same amount, but prices are written in dollars and cents.' },
      { ...third(`${ps(r)} of a dollar`), say: 'Same amount, but no price tag shows a percent of a dollar.' },
    ]);
  }
  if (t === 3) {
    const r = pick(R, [rat(5, 4), rat(3, 2), rat(7, 4), rat(13, 10), rat(9, 4)]);
    return choiceItem(R, { id: `reportForm-${n}`, family: 'reportForm', ...pointPic(rNum(r), namesOf(r), ['frac', 'dec', 'pct'], [], { top: ticksN(Math.ceil(rNum(r) - 1e-9), i => i + ' m'), bot: [], cut: 10 }), prompt: `A science lab records the length of a plant stem in meters. Which way fits the lab sheet?`, board: `${ft(r)} = ${ds(r)} = ${pt(r)}`, solution: ['Metric lengths are written as decimals.', `Write ${ds(r)} m.`] }, [
      { t: `${ds(r)} meters`, ok: true, say: 'Yes: metric measurements are written as decimals.' },
      { ...third(`${fh(r)} meters`), say: 'Same amount, but metric measurements use decimals.' },
      { ...third(`${ps(r)} of a meter`), say: 'Same amount, but a lab sheet records lengths, not percents.' },
    ]);
  }
  if (t === 4) {
    const r = pick(R, [rat(8, 25), rat(3, 5), rat(7, 20), rat(9, 50), rat(2, 5), rat(11, 25)]);
    return choiceItem(R, { id: `reportForm-${n}`, family: 'reportForm', ...pointPic(rNum(r), namesOf(r), ['frac', 'dec', 'pct'], [], { top: [{ v: 0, t: '0' }, { v: 1, t: 'all' }] }), prompt: `The school paper reports a survey: what share of students have a pet. Which way fits the headline?`, board: `${ft(r)} = ${ds(r)} = ${pt(r)}`, solution: ['Survey shares are usually reported as percents.', `Write ${ps(r)} of students.`] }, [
      { t: `${ps(r)} of students`, ok: true, say: 'Yes: survey shares are easy to compare as percents.' },
      { ...third(`${fh(r)} of students`), say: `Same share, but ${fh(r)} is hard to compare at a glance. Surveys use percents.` },
      { ...third(`${ds(r)} of the students`), say: 'Same share, but headlines report survey shares as percents.' },
    ]);
  }
  const [a, b] = two(R), r = pick(R, [rat(1, 4), rat(1, 2), rat(3, 4), rat(1, 5)]);
  return choiceItem(R, { id: `reportForm-${n}`, family: 'reportForm', ...pointPic(rNum(r), { frac: ft(r), pct: pt(r) }, ['frac', 'pct'], [], { top: [{ v: 0, t: '0' }, { v: 1, t: 'price' }] }), prompt: `Nobody said which form to use. ${a} writes the discount as ${A(fh(r) + ' off')}. ${b} writes ${A(ps(r) + ' off')}. Who is right?`, board: `${ft(r)}\\text{ off} \\;\\;?\\;\\; ${pt(r)}\\text{ off}`, solution: [`${fh(r)} = ${ps(r)}: the same discount.`, 'No form was asked for, so both are fine.'] }, [
    { t: 'Both: same amount, and no form was asked for', ok: true, say: `Yes: ${fh(r)} = ${ps(r)}, and either one communicates it.` },
    { t: `Only ${b}: discounts must be percents`, mc: MC.contextForm, say: `Percents are common for discounts, but ${fh(r)} off says the same thing. Nothing asked for a percent.` },
    { t: `Only ${a}: fractions are always clearest`, mc: MC.oneForm, say: 'No form is always best. Here both work.' },
  ]);
};

// the forms people really use in each context: "30% mile" and "0.25 off" are not said
const EITHER: { what: string; unit: string; top: string; kinds: Kind[] }[] = [
  { what: 'the discount on a jacket', unit: 'off', top: 'price', kinds: ['frac', 'pct'] },
  { what: 'how far they ran', unit: 'mile', top: '1 mile', kinds: ['frac', 'dec'] },
  { what: 'how much of the pizza is left', unit: 'of the pizza', top: 'pizza', kinds: ['frac', 'pct'] },
  { what: 'the chance of rain', unit: 'chance', top: 'certain', kinds: ['frac', 'dec', 'pct'] },
];
const eitherForm: Gen = (R, n) => {
  const [a, b] = two(R), r = pick(R, [rat(1, 4), rat(1, 2), rat(3, 4), rat(1, 5), rat(2, 5), rat(3, 10)]), c = pick(R, EITHER);
  const kinds = shuffle(R, c.kinds.slice()), ka = kinds[0]!, kb = kinds[1]!;
  const fa = formHtml(formOf(r, ka)), fb = formHtml(formOf(r, kb));
  const asked = R() < 0.4;
  const names = { [ka]: formTex(formOf(r, ka)), [kb]: formTex(formOf(r, kb)) } as FormLineParams['names'];
  const base = {
    id: `eitherForm-${n}`, family: 'eitherForm' as const, ...pointPic(rNum(r), names, [ka, kb], [], { top: [{ v: 0, t: '0' }, { v: 1, t: c.top }] }),
    prompt: `${asked ? `The worksheet asks for ${kindName[kb]}.` : 'Nobody said which form to use.'} For ${c.what}, ${a} writes ${A(fa + ' ' + c.unit)}. ${b} writes ${A(fb + ' ' + c.unit)}. Who is right?`,
    board: `${formTex(formOf(r, ka))} = ${formTex(formOf(r, kb))}`,
    solution: [`${fa} = ${fb}: the same amount.`, asked ? `The worksheet asked for ${kindName[kb]}, so ${b}’s form fits.` : 'No form was asked for, so both are fine.'],
  };
  return choiceItem(R, base, asked ? [
    { t: `${b}: the worksheet asked for ${kindName[kb]}`, ok: true, say: `Yes: same amount, but the worksheet asked for ${kindName[kb]}.` },
    { t: 'Both: it is the same amount', mc: MC.oneForm, say: `Same amount, but the worksheet asked for ${kindName[kb]}. Follow the stated form.` },
    { t: `${a}: ${kindName[ka]} is always clearest`, mc: MC.oneForm, say: `No form is always clearest, and here ${kindName[kb]} was asked for.` },
  ] : [
    { t: 'Both: same amount, and no form was asked for', ok: true, say: `Yes: ${fa} = ${fb}, and either one says it.` },
    { t: `Only ${b}: this must be ${kindName[kb]}`, mc: MC.contextForm, say: `Nothing asked for ${kindName[kb]}. ${fa} says the same amount.` },
    { t: `Only ${a}: ${kindName[ka]} is always clearest`, mc: MC.oneForm, say: 'No form is always best. Here both work.' },
  ]);
};

// ===================== 10. calc-vs-report =====================
const reportAs: Gen = (R, n) => {
  const t = int(R, 0, 2);
  if (t === 0) {
    const r = pick(R, [rat(1, 4), rat(3, 4), rat(1, 5), rat(2, 5), rat(3, 5), rat(3, 8), rat(5, 8), rat(7, 20), rat(9, 25), rat(7, 8), rat(1, 8)]);
    return numItem({ id: `reportAs-${n}`, family: 'reportAs', ...pointPic(rNum(r), { dec: ds(r), pct: pt(r) }, ['dec'], ['pct']), prompt: `In a survey, ${A(fh(r))} of the class walks to school. You worked it out as ${A(ds(r))}. The school paper reports shares as percents. What percent?`, board: `${ds(r)} = \\,?\\,\\%`, unit: '%', solution: [`${ds(r)} = ${ds(rMul(r, rat(100)))} hundredths`, `Report ${ps(r)}.`] },
      rNum(rMul(r, rat(100))), `Yes: ${ps(r)}.`, 'A percent counts hundredths: multiply by 100.', [
        { v: rNum(r), mc: MC.calcForm, say: `${ds(r)} is the form you calculated in. The paper wants a percent: ${ps(r)}.` },
        { v: rNum(rMul(r, rat(10))), mc: MC.centsPoint, say: `One place off: ${ds(r)} = ${ps(r)}.` },
      ]);
  }
  if (t === 1) {
    const p = pick(R, ['6', '7.5', '8', '5', '2.5']), A0 = exactAmount(R, p), ans = pctOfCents(p, A0)!;
    return numItem({ id: `reportAs-${n}`, family: 'reportAs', ...amountPic(ans / 100, i => '$' + i, ans + '¢', 10), prompt: `You found ${an(p)} ${p}% tax on ${$(A0, true)} as ${ds(pctRat(p))} × ${ds(rat(A0, 100))} = ${A(ds(rat(ans, 100)))} dollars. The receipt shows the tax in cents. How many cents?`, board: `${ds(rat(ans, 100))}\\text{ dollars} = \\,?\\text{ cents}`, unit: 'cents', solution: ['A dollar is 100 cents.', `${ds(rat(ans, 100))} × 100 = ${ans} cents`] },
      ans, `Yes: ${ans} cents.`, 'Each dollar is 100 cents.', [
        { v: ans / 100, mc: MC.calcForm, say: `That is the dollar form you calculated in. In cents: ${ans}.` },
        { v: ans / 10, mc: MC.centsPoint, say: `One place off: a dollar is 100 cents, so ${ans} cents.` },
      ]);
  }
  const h = pick(R, ['0.25', '0.5', '0.75', '0.2', '0.4', '0.6', '0.8', '0.1', '1.5', '1.25']), r = decRat(h), m = rNum(rMul(r, rat(60)));
  return numItem({ id: `reportAs-${n}`, family: 'reportAs', ...amountPic(rNum(r), i => i + ' h', m + ' min', rNum(rMul(r, rat(4))) % 1 === 0 ? 4 : 10), prompt: `You worked out that practice took ${A(h)} of an hour. Your coach wants it in minutes. How many minutes?`, board: `${h}\\text{ hour} = \\,?\\text{ min}`, unit: 'minutes', solution: ['One hour is 60 minutes.', `${h} × 60 = ${m} minutes`] },
    m, `Yes: ${m} minutes.`, 'One hour is 60 minutes: multiply by 60.', [
      { v: rNum(r), mc: MC.calcForm, say: `${h} is the form you calculated in. The coach asked for minutes: ${m}.` },
      { v: rNum(rMul(r, rat(100))), say: `An hour has 60 minutes, not 100: ${h} × 60 = ${m}.` },
    ]);
};
const reportPick: Gen = (R, n) => {
  const t = int(R, 0, 2);
  if (t === 0) {
    const r = pick(R, [rat(3, 2), rat(5, 4), rat(3, 4), rat(9, 4), rat(5, 2), rat(7, 4)]);
    const w = Math.floor(r.n / r.d), rr = r.n - w * r.d;
    return choiceItem(R, { id: `reportPick-${n}`, family: 'reportPick', ...pointPic(rNum(r), { frac: ft(r), dec: ds(r) }, ['frac'], ['dec'], { top: ticksN(Math.ceil(rNum(r) - 1e-9), i => i + ' lb'), bot: [], cut: 4 }), prompt: `You scaled a recipe with fractions and got ${A(fh(r) + ' pounds')} of apples. The store scale shows decimals. What do you look for on the scale?`, board: `${ft(r)}\\text{ lb} = \\,?`, solution: [`${fh(r)} = ${ds(r)}`, `Look for ${ds(r)} lb on the scale.`] }, [
      { t: `${ds(r)} pounds`, ok: true, say: `Yes: ${fh(r)} = ${ds(r)}, the form the scale shows.` },
      { t: `${fh(r)} pounds: it was found with fractions`, mc: MC.calcForm, say: `You may report in a different form than you calculated in. The scale shows ${ds(r)}.` },
      { t: `${w ? w + '.' : '0.'}${rr}${r.d} pounds`, mc: MC.fracDigitsDec, say: `Divide, do not copy digits: ${fh(r)} = ${ds(r)}.` },
    ]);
  }
  if (t === 1) {
    const r = pick(R, [rat(3, 8), rat(5, 8), rat(2, 5), rat(3, 4), rat(7, 20), rat(1, 8)]);
    return choiceItem(R, { id: `reportPick-${n}`, family: 'reportPick', ...pointPic(rNum(r), { frac: ft(r), pct: pt(r) }, ['frac'], ['pct']), prompt: `You found that ${A(fh(r))} of the team’s shots went in, working with fractions. The coach’s chart shows percents. What do you write?`, board: `${ft(r)} = \\,?\\,\\%`, solution: [`${fh(r)} = ${ds(r)} = ${ps(r)}`, 'The chart shows percents, so write the percent.'] }, [
      { t: ps(r), ok: true, say: `Yes: ${fh(r)} = ${ps(r)}.` },
      { t: `${fh(r)}: it was found with fractions`, mc: MC.calcForm, say: `The chart wants percents. ${fh(r)} = ${ps(r)}.` },
      { t: `${r.n}${r.d}%`, mc: MC.fracDigitsPct, say: `The digits of ${fh(r)} are not the percent: ${ps(r)}.` },
    ]);
  }
  const c = pick(R, [125, 375, 250, 75, 450, 175]), r = rat(c, 100);
  return choiceItem(R, { id: `reportPick-${n}`, family: 'reportPick', ...pointPic(rNum(r), { frac: ft(r), dec: ds(r) }, ['frac'], ['dec'], { top: ticksN(Math.ceil(rNum(r) - 1e-9), i => '$' + i), bot: [], cut: 4 }), prompt: `You found each friend’s share as ${A(fh(r))} dollars, working with fractions. What do you write on the payment app?`, board: `${ft(r)}\\text{ dollars} = \\,?`, solution: [`${fh(r)} = ${ds(r)}`, `Money is written in dollars and cents: ${$(c, true)}.`] }, [
    { t: $(c, true), ok: true, say: `Yes: ${fh(r)} = ${ds(r)}, written ${$(c, true)}.` },
    { t: `${fh(r)} dollars: it was found with fractions`, mc: MC.calcForm, say: `An app takes dollars and cents. ${fh(r)} = ${$(c, true)}.` },
    { t: $(c * 10, true), mc: MC.centsPoint, say: `The point is one place off: ${fh(r)} = ${$(c, true)}.` },
  ]);
};

// ===================== 11. exact-vs-rounded =====================
const EQ_PAIRS: { r: Rat; t: string; h: string; exact: boolean }[] = [
  { r: rat(1, 4), t: '0.25', h: '0.25', exact: true }, { r: rat(3, 8), t: '0.375', h: '0.375', exact: true }, { r: rat(1, 5), t: '20\\%', h: '20%', exact: true },
  { r: rat(2, 5), t: '0.4', h: '0.4', exact: true }, { r: rat(7, 8), t: '87.5\\%', h: '87.5%', exact: true }, { r: rat(1, 3), t: '0.\\overline{3}', h: '0.333… (the 3s go on forever)', exact: true },
  { r: rat(2, 3), t: '66\\tfrac{2}{3}\\%', h: `66${fr(2, 3)}%`, exact: true }, { r: rat(1, 8), t: '12.5\\%', h: '12.5%', exact: true }, { r: rat(3, 4), t: '75\\%', h: '75%', exact: true },
  { r: rat(1, 3), t: '0.33', h: '0.33', exact: false }, { r: rat(2, 3), t: '0.67', h: '0.67', exact: false }, { r: rat(1, 3), t: '33\\%', h: '33%', exact: false },
  { r: rat(1, 6), t: '0.17', h: '0.17', exact: false }, { r: rat(5, 6), t: '0.83', h: '0.83', exact: false }, { r: rat(1, 9), t: '0.11', h: '0.11', exact: false },
  { r: rat(2, 3), t: '67\\%', h: '67%', exact: false }, { r: rat(1, 6), t: '16.7\\%', h: '16.7%', exact: false }, { r: rat(2, 3), t: '0.666', h: '0.666', exact: false },
];
const eqOrApprox: Gen = (R, n) => {
  const q = pick(R, EQ_PAIRS);
  const v = q.exact ? (terminates(q.r) ? ds(q.r) : truncStrSafe(q.r)) : truncStrSafe(q.r);
  return choiceItem(R, {
    id: `eqOrApprox-${n}`, family: 'eqOrApprox', prompt: `Is ${A(fh(q.r))} exactly equal to ${A(q.h)}, or only close?`, board: `${ft(q.r)} \\;\\;\\square\\;\\; ${q.t}`,
    solution: [`${fh(q.r)} = ${q.r.n} ÷ ${q.r.d} = ${v}${terminates(q.r) ? ' (the division stops)' : '… (the digits repeat forever)'}`, q.exact ? `So ${fh(q.r)} = ${q.h} exactly.` : `${q.h} stops, so it is rounded: ${fh(q.r)} ≈ ${q.h}.`],
  }, [
    { t: '= exactly equal', ok: q.exact, mc: q.exact ? undefined : MC.roundedExact, say: q.exact ? `Yes: ${fh(q.r)} = ${q.h} exactly.` : `${fh(q.r)} = ${v}…, the digits never stop. ${q.h} is rounded, so only ≈.` },
    { t: '≈ only close', ok: !q.exact, mc: q.exact ? MC.inexact : undefined, say: q.exact ? `${fh(q.r)} = ${q.h} exactly: ${terminates(q.r) ? 'the division stops, so the decimal is exact' : 'that form shows the whole repeat'}.` : `Yes: ${q.h} is rounded, so ${fh(q.r)} ≈ ${q.h}.` },
  ]);
};
function truncStrSafe(r: Rat): string { let w = Math.floor(r.n / r.d), rem = r.n - w * r.d, s = ''; for (let i = 0; i < 4; i++) { rem *= 10; s += String(Math.floor(rem / r.d)); rem %= r.d; } return `${w}.${s}`; }
const calcDisplay: Gen = (R, n) => {
  const rep = R() < 0.6;
  const r = rep ? pick(R, [rat(1, 3), rat(2, 3), rat(1, 6), rat(5, 6), rat(1, 7), rat(2, 9), rat(4, 9), rat(5, 12), rat(1, 11)]) : pick(R, [rat(3, 8), rat(1, 8), rat(7, 20), rat(5, 16), rat(3, 16), rat(9, 40)]);
  const disp = rep ? rNum(r).toFixed(7).replace(/0+$/, '') : ds(r);
  return choiceItem(R, {
    id: `calcDisplay-${n}`, family: 'calcDisplay', prompt: `A calculator shows ${A(disp)} for ${r.n} ÷ ${r.d}. Is that exactly ${fh(r)}?`, board: `${r.n} \\div ${r.d} \\to ${disp}`,
    solution: rep ? [`${r.n} ÷ ${r.d} never stops: the digits repeat.`, `The screen has room for only a few digits, so it cuts off and rounds.`, `${fh(r)} ≈ ${disp}`] : [`${r.n} ÷ ${r.d} stops: ${ds(r)}.`, `${fh(r)} = ${ds(r)} exactly.`],
  }, rep ? [
    { t: 'No: the digits go on forever; the screen cut them off', ok: true, say: `Yes: ${fh(r)} repeats forever, so ${disp} is rounded.` },
    { t: 'Yes: a calculator shows every digit', mc: MC.truncation, say: `A screen has room for only a few digits. ${fh(r)} repeats forever.` },
    { t: 'No: no decimal can ever be exact', mc: MC.inexact, say: `Some decimals are exact (1/4 = 0.25). This one is rounded because ${fh(r)} repeats.` },
  ] : [
    { t: 'Yes: the division stops, so the decimal is exact', ok: true, say: `Yes: ${r.n} ÷ ${r.d} = ${ds(r)} and stops.` },
    { t: 'No: no decimal can ever be exact', mc: MC.inexact, say: `${r.n} ÷ ${r.d} stops at ${ds(r)}, so ${fh(r)} = ${ds(r)} exactly.` },
    { t: 'No: the screen always cuts digits off', say: `Only when there are more digits. ${r.n} ÷ ${r.d} stops at ${ds(r)}.` },
  ]);
};

// ===================== 12. rounding-effect =====================
const roundingGap: Gen = (R, n) => {
  const t = int(R, 0, 2);
  if (t === 0) {
    const W = 300 * int(R, 1, 5), third = R() < 0.6;
    const ex = third ? W / 3 : (2 * W) / 3, ap = third ? (33 * W) / 100 : (67 * W) / 100, diff = Math.abs(ex - ap);
    const p = third ? '33' : '67', f = third ? rat(1, 3) : rat(2, 3);
    return numItem({ id: `roundingGap-${n}`, family: 'roundingGap', ...asPic(gapPic(f, '0.' + p, W * 100)), prompt: `${A(fh(f))} of ${an($(W * 100))} ${A($(W * 100))} prize goes to the winner. A spreadsheet uses ${A(p + '%')} instead. How many dollars apart are the two answers?`, board: `${ft(f)}\\text{ of } ${tm(W * 100)} \\;\\text{vs}\\; ${p}\\%\\text{ of } ${tm(W * 100)}`, unit: 'dollars',
      solution: [`${fh(f)} of ${$(W * 100)} = ${$(ex * 100)}`, `${p}% of ${$(W * 100)} = ${$(Math.round(ap * 100), true)}`, `The difference is ${$(Math.round(diff * 100), true)}.`] },
      diff, `Yes: ${$(Math.round(diff * 100), true)} apart.`, `Work out both: ${fh(f)} of ${W}, and ${p}% of ${W}.`, [
        { v: 0, mc: MC.midRound, say: `${p}% is not exactly ${fh(f)}. ${fh(f)} of ${W} = ${ex}, but ${p}% of ${W} = ${ap}.` },
      ]);
  }
  if (t === 1) {
    const b = 3 * int(R, 1, 5), third = R() < 0.5;
    const f = third ? rat(1, 3) : rat(2, 3), d = third ? '0.33' : '0.67';
    const ex = rMul(f, rat(b)), ap = rMul(decRat(d), rat(b)), diff = rNum(rSub(third ? ex : ap, third ? ap : ex));
    return numItem({ id: `roundingGap-${n}`, family: 'roundingGap', prompt: `A recipe needs ${A(fh(f) + ' cup')} of oats per batch. You make ${A(b)} batches but use ${A(d + ' cup')} per batch. How many cups off is your total?`, board: `${ft(f)} \\times ${b} \\;\\text{vs}\\; ${d} \\times ${b}`, unit: 'cups',
      solution: [`${fh(f)} × ${b} = ${rNum(ex)} cups`, `${d} × ${b} = ${ds(ap)} cups`, `They differ by ${ds(rat(Math.round(diff * 100), 100))} cup.`] },
      diff, `Yes: ${ds(rat(Math.round(diff * 100), 100))} cup.`, `Work out both totals, then subtract.`, [
        { v: 0, mc: MC.midRound, say: `${d} is not exactly ${fh(f)}, and the gap grows with every batch: ${rNum(ex)} cups vs ${ds(ap)} cups.` },
      ]);
  }
  const X = pick(R, [10, 20, 50, 100, 25, 40, 70, 80, 11, 13, 14, 16]) * 100, share = Math.floor(X / 3), left = X - 3 * share;
  if (left === 0) return roundingGap(R, n, 'x');
  return numItem({ id: `roundingGap-${n}`, family: 'roundingGap', prompt: `Three friends split ${A($(X))}. Each pays ${A($(share, true))}. How much of the ${$(X)} is not covered?`, board: `${tm(X)} - 3 \\times ${tm(share, true)}`, unit: 'dollars',
    solution: [`3 × ${$(share, true)} = ${$(3 * share, true)}`, `${$(X, true)} − ${$(3 * share, true)} = ${ans($(left, true))} not covered.`, `So one friend pays ${$(share + left, true)}.`] },
    left / 100, `Yes: ${$(left, true)} is left, so one friend pays a cent${left > 1 ? 's' : ''} more.`, `Multiply the share by 3, then subtract from ${$(X)}.`, [
      { v: 0, mc: MC.midRound, say: `Rounding each share changes the total: 3 × ${$(share, true)} = ${$(3 * share, true)}.` },
    ]);
};
const keepExact: Gen = (R, n, sg) => {
  const [a] = two(R), W = 300 * int(R, 1, 6), third = R() < 0.65;
  const f = third ? rat(1, 3) : rat(2, 3), d = third ? '0.33' : '0.67', ex = rNum(rMul(f, rat(W))), ap = rNum(rMul(decRat(d), rat(W))), gap = Math.abs(ex - ap);
  const ctx = sg === 'multistep-choice' ? 'then adds 5% tax to it' : 'and calls it exact';
  return choiceItem(R, {
    id: `keepExact-${n}`, family: 'keepExact', ...asPic(gapPic(f, d, W * 100)), prompt: `${a} finds ${A(fh(f))} of ${A($(W * 100))} as ${d} × ${W} = ${$(Math.round(ap * 100), true)}, ${ctx}. Is ${$(Math.round(ap * 100), true)} exactly ${fh(f)} of ${$(W * 100)}?`,
    board: `${ft(f)}\\text{ of } ${tm(W * 100)} \\;\\overset{?}{=}\\; ${d} \\times ${W}`,
    solution: [`${fh(f)} of ${W} = ${W} ÷ 3${third ? '' : ' × 2'} = ${ex}: exact.`, `${d} is a rounded ${third ? 'third' : 'two thirds'}, so ${d} × ${W} = ${ap}.`, `Off by ${$(Math.round(gap * 100), true)}. Keep the fraction until the end.`],
  }, [
    { t: `No: ${d} is rounded, so it is ${$(Math.round(gap * 100), true)} off`, ok: true, say: `Yes: ${fh(f)} of ${W} is exactly ${ex}.` },
    { t: `Yes: ${d} and ${fh(f)} are the same number`, mc: MC.roundedExact, say: `${fh(f)} = ${third ? '0.333…' : '0.666…'}; ${d} is a rounded version, so the answers differ.` },
    { t: 'Yes: rounding a little can’t change the answer', mc: MC.midRound, say: `Multiplying by ${W} grows the small rounding into ${$(Math.round(gap * 100), true)}.` },
  ]);
};

// ===================== 13. accuracy-tolerance =====================
const TOL = [
  { T: 0.125, th: `${fr(1, 8)} inch`, u: 'inches', what: 'a shelf board', size: 'length' },
  { T: 0.5, th: '0.5 pound', u: 'pounds', what: 'a bag of dog food', size: 'weight' },
  { T: 0.1, th: '0.1 mile', u: 'miles', what: 'a running route', size: 'length' },
  { T: 0.05, th: '0.05 liter', u: 'liters', what: 'a water jug', size: 'volume' },
];
const tolerance: Gen = (R, n) => {
  const c = pick(R, TOL), den = pick(R, [3, 6, 7, 9]);
  let nn = int(R, den + 1, 5 * den); while (nn % den === 0) nn++;
  const e = rat(nn, den), ev = rNum(e);
  const ok = R() < 0.5;
  let a: Rat;
  if (ok) {
    a = roundRat(e, c.T >= 0.5 ? 1 : 2);
  } else {
    const s = R() < 0.5 ? 1 : -1, m = pick(R, [1.6, 2, 2.4]), places = int(R, 3, 4);
    a = roundRat(rat(Math.round((ev + s * c.T * m) * 10 ** places), 10 ** places), places);
    if (rNum(a) <= 0) a = roundRat(rat(Math.round((ev + c.T * m) * 10 ** places), 10 ** places), places);
  }
  const err = Math.abs(rNum(a) - ev), as = ds(a), places = (as.split('.')[1] ?? '').length;
  const right = err < c.T;
  const exStr = formHtml({ kind: 'frac', r: e });
  return choiceItem(R, {
    id: `tolerance-${n}`, family: 'tolerance', prompt: `The exact ${c.size} of ${c.what} is ${A(exStr + ' ' + c.u)}. A plan writes ${A(as + ' ' + c.u)}. It must be within ${c.th}. Is ${as} close enough?`,
    board: `\\left|\\,${ft(e)} - ${as}\\,\\right| \\;\\overset{?}{<}\\; ${c.T === 0.125 ? '\\tfrac{1}{8}' : String(c.T)}`,
    solution: [`${exStr} = ${truncStrSafe(e)}…`, `The difference is about ${err.toFixed(3)} ${c.u}.`, right ? `${err.toFixed(3)} < ${c.T}: close enough.` : `${err.toFixed(3)} > ${c.T}: not close enough.`],
  }, [
    { t: `Yes: it is off by less than ${c.th}`, ok: right, say: right ? `Yes: off by about ${err.toFixed(3)}, less than ${c.T}.` : `Find the difference: about ${err.toFixed(3)}, more than ${c.T}.` },
    { t: `No: it is off by more than ${c.th}`, ok: !right, say: !right ? `Yes: off by about ${err.toFixed(3)}, more than ${c.T}.` : `Find the difference: about ${err.toFixed(3)}, less than ${c.T}.` },
    right
      ? { t: 'No: it needs more decimal places to be accurate', mc: MC.places, say: `Decimal places are not the test. The difference, about ${err.toFixed(3)}, is less than ${c.T}.` }
      : { t: `Yes: it has ${places} decimal places, so it is accurate`, mc: MC.places, say: `Many digits do not make it close. It is about ${err.toFixed(3)} off, more than ${c.T}.` },
  ]);
};
const nearestCent: Gen = (R, n) => {
  for (;;) {
    const X = pick(R, [10, 20, 25, 40, 50, 70, 80, 100, 11, 13, 14, 16, 17, 19, 23]) * 100, k = pick(R, [3, 6, 7]);
    const ex = rat(X, 100 * k), cents = roundRat(ex, 2), tenth = roundRat(ex, 1), whole = roundRat(ex, 0);
    if (rEq(cents, ex) || rEq(cents, tenth)) continue;
    return numItem({ id: `nearestCent-${n}`, family: 'nearestCent', prompt: `${k} friends split ${A($(X))} equally. To the ${A('nearest cent')}, how much is each share?`, board: `${tm(X)} \\div ${k} \\approx \\,?`, unit: 'dollars',
      solution: [`${$(X)} ÷ ${k} = ${truncStrSafe(ex)}…`, `The nearest cent is the hundredths place: look at the thousandths digit.`, `Each share ≈ ${$(Math.round(rNum(cents) * 100), true)}`] },
      rNum(cents), `Yes: ${$(Math.round(rNum(cents) * 100), true)}.`, 'Cents are hundredths: round to two decimal places.', [
        { v: rNum(tenth), mc: MC.roundPlace, say: `That rounds to the nearest dime. Cents are the second place: ${$(Math.round(rNum(cents) * 100), true)}.` },
        { v: rNum(whole), mc: MC.roundPlace, say: `That rounds to the nearest dollar. The nearest cent is two decimal places.` },
        { v: Number(truncStrSafe(ex).slice(0, truncStrSafe(ex).indexOf('.') + 3)), say: 'Round, don’t just cut: look at the next digit.' },
      ]);
  }
};

// ===================== 14. convenience-compare =====================
const fasterRoute: Gen = (R, n) => {
  const t = int(R, 0, 3);
  if (t === 0) {
    const p = pick(R, ['25', '50', '20', '75']), f = pctRat(p), W = wholeFor(R, f.d, 12, 120);
    return choiceItem(R, { id: `fasterRoute-${n}`, family: 'fasterRoute', ...asPic(percentOfPic(p, $(W * 100), $(Math.round(rNum(rMul(f, rat(W * 100))))))), prompt: `No calculator. Which route for ${A(p + '%')} of ${A($(W * 100))} takes the fewest steps?`, board: `${p}\\%\\text{ of } ${tm(W * 100)}`, solution: [`${p}% = ${fh(f)}`, f.n === 1 ? `${W} ÷ ${f.d} = ${W / f.d}: one easy division.` : `${W} ÷ ${f.d} = ${W / f.d}, then × ${f.n} = ${(W / f.d) * f.n}: easy steps.`] }, [
      // 75% = 3/4: "÷ 4" alone would give 25%, so the route says "then × 3"
      { t: f.n === 1 ? `${W} ÷ ${f.d}` : `${W} ÷ ${f.d}, then × ${f.n}`, ok: true, say: `Yes: ${p}% = ${fh(f)}, and ${W} splits evenly into ${f.d}.` },
      { t: `${ds(f)} × ${W}, worked out on paper`, mc: MC.oneForm, say: `That works too, but it takes more steps. Here the fraction ${fh(f)} is quicker.` },
      { t: `${W} ÷ ${p}`, mc: MC.onePth, say: `${p}% is ${fh(f)}, not one ${p}th.` },
    ]);
  }
  if (t === 1) {
    const W = 8 * int(R, 2, 15);
    return choiceItem(R, { id: `fasterRoute-${n}`, family: 'fasterRoute', ...asPic(percentOfPic('12.5', String(W), String(W / 8), { zero: '0' })), prompt: `No calculator. 12.5% = ${fh(rat(1, 8))}. Which route for ${A('12.5%')} of ${A(W)} takes the fewest steps?`, board: `12.5\\%\\text{ of } ${W}`, solution: ['12.5% = 1/8', `${W} ÷ 8 = ${W / 8}`] }, [
      { t: `${W} ÷ 8`, ok: true, say: `Yes: one division, because 12.5% = ${fh(rat(1, 8))}.` },
      { t: `0.125 × ${W}, worked out on paper`, mc: MC.oneForm, say: 'That works, but three decimal places make more steps. The fraction is quicker here.' },
      { t: `${W} × 12.5`, mc: MC.numeral, say: '12.5% is 0.125, not 12.5.' },
    ]);
  }
  if (t === 2) {
    const p = pick(R, ['37', '23', '41', '13', '29', '43']), pv = Number(p);
    return choiceItem(R, { id: `fasterRoute-${n}`, family: 'fasterRoute', ...asPic(percentOfPic(p, '250', ds(rat(pv * 10, 4)), { zero: '0' })), prompt: `No calculator. Which route for ${A(p + '%')} of ${A('250')} is easiest? (250 is a quarter of 1,000.)`, board: `${p}\\%\\text{ of } 250`, solution: [`${p}% of 1,000 = ${pv * 10}`, `250 is a quarter of 1,000: ${pv * 10} ÷ 4 = ${ds(rat(pv * 10, 4))}`] }, [
      { t: `${p}% of 1,000 is ${pv * 10}; then ÷ 4`, ok: true, say: `Yes: ${pv * 10} ÷ 4 = ${ds(rat(pv * 10, 4))}.` },
      { t: `Turn ${p}% into a fraction first`, mc: MC.oneForm, say: `${p}/100 does not simplify, so a fraction does not help here.` },
      { t: `250 ÷ ${p}`, mc: MC.onePth, say: `${p}% is ${p} hundredths, not one ${p}th.` },
    ]);
  }
  const p = pick(R, ['17.5', '6.5', '13.5', '8.5']), A0 = exactAmount(R, p);
  return choiceItem(R, { id: `fasterRoute-${n}`, family: 'fasterRoute', ...asPic(percentOfPic(p, $(A0, true), $(pctOfCents(p, A0)!, true))), prompt: `${A('Calculator allowed')}. Which route is better for ${A(p + '%')} of ${A($(A0, true))}?`, board: `${p}\\%\\text{ of } ${tm(A0, true)}`, solution: [`${p}% = ${ds(pctRat(p))}`, `On the calculator: ${ds(pctRat(p))} × ${ds(rat(A0, 100))} = ${ds(rat(pctOfCents(p, A0)!, 100))}`] }, [
    { t: `${ds(pctRat(p))} × ${ds(rat(A0, 100))} on the calculator`, ok: true, say: 'Yes: with a calculator, the decimal multiplier is one step.' },
    { t: `Change ${p}% to a fraction first`, mc: MC.oneForm, say: `${p}% is ${fh(pctRat(p))}: an awkward fraction. Here the decimal route wins.` },
    { t: `${ds(rat(A0, 100))} ÷ ${p}`, mc: MC.onePth, say: `${p}% is not one ${p}th: it is ${ds(pctRat(p))} of the amount.` },
  ]);
};

// ===================== 15. benchmark-check =====================
const BM = [
  { p: ['19', '21'], b: rat(1, 5), bs: `${fr(1, 5)}`, step: 5 }, { p: ['24', '26'], b: rat(1, 4), bs: `${fr(1, 4)}`, step: 4 },
  { p: ['49', '51'], b: rat(1, 2), bs: `${fr(1, 2)}`, step: 2 }, { p: ['9', '11'], b: rat(1, 10), bs: `${fr(1, 10)}`, step: 10 },
  { p: ['74', '76'], b: rat(3, 4), bs: `${fr(3, 4)}`, step: 4 }, { p: ['67'], b: rat(2, 3), bs: `${fr(2, 3)}`, step: 3 }, { p: ['33'], b: rat(1, 3), bs: `${fr(1, 3)}`, step: 3 },
];
function benchCase(R: () => number) {
  const c = pick(R, BM), p = pick(R, c.p);
  const F = c.step * int(R, Math.ceil(20 / c.step), Math.floor(120 / c.step));
  const A0 = (F + pick(R, [-2, -1, 1, 2])) * 100 + pick(R, [0, 15, 40, 60, 85, 99, 25]);
  const exact = rMul(pctRat(p), rat(A0, 100)), shown = roundRat(exact, 2), est = rNum(rMul(c.b, rat(F)));
  return { c, p, F, A0, exact, shown, est };
}
const checkResult: Gen = (R, n) => {
  const { c, p, F, A0, shown, est } = benchCase(R);
  const kind = int(R, 0, c.step === 10 ? 1 : 2), sv = kind === 0 ? rNum(shown) : kind === 1 ? rNum(shown) * 10 : A0 / 100 / Number(p);
  const supplied = Math.round(sv * 100) / 100, good = kind === 0;
  const estS = Number.isInteger(est) ? `$${est}` : `$${est.toFixed(2)}`;
  return choiceItem(R, {
    id: `checkResult-${n}`, family: 'checkResult', ...benchPic(p, A0, c.b, est), prompt: `A calculator says ${A(p + '%')} of ${A($(A0, true))} is ${A('$' + supplied.toFixed(2))}. Check it with ${c.bs} of ${$(F * 100)}. Is the result reasonable?`,
    board: `${p}\\%\\text{ of } ${tm(A0, true)} \\approx ${ft(c.b)}\\text{ of } ${tm(F * 100)}`,
    solution: [`${p}% is close to ${c.bs}, and ${$(A0, true)} is close to ${$(F * 100)}.`, `${c.bs} of ${$(F * 100)} = ${estS}`, good ? `${'$' + supplied.toFixed(2)} is close to ${estS}: reasonable.` : `${'$' + supplied.toFixed(2)} is far from ${estS}: something went wrong.`],
  }, [
    { t: `Reasonable: it is close to ${estS}`, ok: good, say: good ? `Yes: close to ${estS}.` : `${'$' + supplied.toFixed(2)} is far from ${estS}. Look for a place-value or method slip.` },
    { t: `Not reasonable: it should be about ${estS}`, ok: !good, say: !good ? `Yes: ${'$' + supplied.toFixed(2)} is way off ${estS}.` : `It is close to ${estS}, so it passes the check.` },
    { t: `Can’t tell: ${estS} is only a rough estimate`, mc: MC.roughUseless, say: `A rough estimate is enough to catch a slip ten times too big or small.` },
  ]);
};
const estimateFirst: Gen = (R, n) => {
  const { c, p, F, A0, shown, est } = benchCase(R);
  return numItem({
    id: `estimateFirst-${n}`, family: 'estimateFirst', ...benchPic(p, A0, c.b, est), prompt: `Before trusting a calculator, estimate ${A(p + '%')} of ${A($(A0, true))}: use ${c.bs} of ${A($(F * 100))}. What is your estimate?`,
    board: `${ft(c.b)}\\text{ of } ${tm(F * 100)}`, unit: 'dollars',
    solution: [`${p}% ≈ ${c.bs}, ${$(A0, true)} ≈ ${$(F * 100)}`, `${c.bs} of ${F} = ${F} ÷ ${c.b.d}${c.b.n > 1 ? ` × ${c.b.n}` : ''} = ${est}`],
  }, est, `Yes: about $${est}.`, `Use the friendly numbers: ${c.bs} of ${F}.`, [
    { v: rNum(shown), mc: MC.exactThenRound, say: `That is the exact answer. The check needs an estimate made a different way: ${c.bs} of ${F}.` },
    { v: (A0 / 100) / Number(p), mc: MC.onePth, say: `${p}% is not one ${p}th. Use ${c.bs} of ${F}.` },
  ]);
};

// ===================== 16. multistep-choice =====================
const multiStep: Gen = (R, n) => {
  if (R() < 0.4) {
    const f = pick(R, [rat(3, 4), rat(2, 3), rat(1, 3), rat(1, 4)]);
    const b = f.d === 4 ? 2 * int(R, 1, 6) : 3 * int(R, 1, 4);
    const cups = rMul(f, rat(b)), scoops = rNum(rMul(cups, rat(10))), r1 = roundRat(f, 1), trap = rNum(rMul(rMul(r1, rat(b)), rat(10)));
    return numItem({ id: `multiStep-${n}`, family: 'multiStep', prompt: `A recipe uses ${A(fh(f) + ' cup')} of oats per batch. You make ${A(b)} batches with a scoop that holds ${A('0.1 cup')}. How many scoops?`, board: `${ft(f)} \\times ${b} \\div 0.1`, unit: 'scoops',
      solution: [`Keep the fraction: ${fh(f)} × ${b} = ${formHtml({ kind: 'frac', r: cups })} cups`, `Then switch to tenths for the scoop: ${ds(cups)} ÷ 0.1 = ${scoops} scoops`] },
      scoops, `Yes: ${scoops} scoops.`, `First the total in cups (keep ${fh(f)} exact), then count tenths.`, [
        { v: trap, mc: MC.midRound, say: `Rounding ${fh(f)} to ${ds(r1)} first makes every batch a bit off: ${b} batches add it up. Keep ${fh(f)} exact.` },
        { v: rNum(cups), mc: MC.intermediate, say: `${ds(cups)} cups is the first step. How many 0.1-cup scoops is that?` },
      ]);
  }
  for (;;) {
    const d = pick(R, ['25', '20', '50', '10', '40']), t = pick(R, ['5', '8', '6', '10', '7.5']);
    const f = pctRat(d), P = wholeFor(R, f.d * 4, 20, 120);
    const disc = rNum(rMul(f, rat(P * 100))), sale = P * 100 - disc, tax = pctOfCents(t, sale);
    if (tax === null) continue;
    const total = sale + tax, item = pick(R, ['jacket', 'skateboard', 'backpack', 'pair of sneakers', 'lamp']);
    return numItem({ id: `multiStep-${n}`, family: 'multiStep', prompt: `${an($(P * 100), true)} ${A($(P * 100))} ${item} is ${A(d + '% off')}. Then ${A(t + '%')} sales tax is added to the sale price. (Sale price = price − discount; total = sale price + tax.) What is the total?`, board: `${tm(P * 100)} - ${d}\\%,\\;\\text{then} + ${t}\\%\\text{ tax}`, unit: 'dollars',
      solution: [`Discount: ${d}% = ${fh(f)}, ${P} ÷ ${f.d}${f.n > 1 ? ` × ${f.n}` : ''} = ${$(disc, true)}`, `Sale price: ${$(P * 100, true)} − ${$(disc, true)} = ${$(sale, true)}`, `Tax: ${ds(pctRat(t))} × ${ds(rat(sale, 100))} = ${$(tax, true)}`, `Total: ${$(sale, true)} + ${$(tax, true)} = ${$(total, true)}`] },
      total / 100, `Yes: ${$(total, true)}.`, 'Three steps: the discount, the sale price, then the tax on the sale price.', [
        { v: sale / 100, mc: MC.intermediate, say: `${$(sale, true)} is the sale price. Add the ${t}% tax on it.` },
        { v: disc / 100, mc: MC.intermediate, say: `${$(disc, true)} is only the discount. Keep going: sale price, then tax.` },
        { v: (sale + (pctOfCents(t, P * 100) ?? -1e9)) / 100, say: 'The tax is on the sale price, not the original price.' },
      ]);
  }
};

export const GENERATORS: Record<FamilyId, Gen> = {
  threeNames, sameAmount, decPct, centsDollars, over100, overChoice, sameWhole, moreHow, contextMatch, fractionRoute, whichFraction,
  routeEqual, routeCompute, routePick, orderForms, compareTwo, reportForm, eitherForm, reportAs, reportPick, eqOrApprox, calcDisplay, roundingGap,
  keepExact, tolerance, nearestCent, fasterRoute, checkResult, estimateFirst, multiStep,
};
