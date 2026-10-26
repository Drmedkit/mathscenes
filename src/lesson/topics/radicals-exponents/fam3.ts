// fam3.ts: stage 3, the real-number conditions. Negative bases, domains of even roots (linear radicands, radicals in
// a denominator, rational powers), even roots of even powers (|x|), when the exponent laws hold, keeping the domain
// when rewriting, and domains in context. Pure: no DOM.
import { int, pick, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { type Base, type Gen, MC, type Opt, choiceItem, numItem, uniq } from './common';
import { expH, expT, gcd, iH, iT, ipow, powQ, q, qH, red, rootH, rootT, V } from './rad';

const X = V('x');
const NR = 'not a real number';
const ge = (v: string, c: number) => `${v} ≥ ${iH(c)}`, gt = (v: string, c: number) => `${v} &gt; ${iH(c)}`;
const le = (v: string, c: number) => `${v} ≤ ${iH(c)}`, lt = (v: string, c: number) => `${v} &lt; ${iH(c)}`, nq = (v: string, c: number) => `${v} ≠ ${iH(c)}`;
const ALL = 'all real numbers';
/** a x + b as HTML / TeX, written naturally (6 − 2x, 2x − 8, x + 1) */
function linH(a: number, b: number): string {
  const ax = `${Math.abs(a) === 1 ? '' : Math.abs(a)}${X}`;
  if (a < 0 && b > 0) return `${b} − ${ax}`;
  return `${a < 0 ? '−' : ''}${ax}${b ? ` ${b < 0 ? '−' : '+'} ${Math.abs(b)}` : ''}`;
}
function linT(a: number, b: number): string {
  const ax = `${Math.abs(a) === 1 ? '' : Math.abs(a)}x`;
  if (a < 0 && b > 0) return `${b} - ${ax}`;
  return `${a < 0 ? '-' : ''}${ax}${b ? ` ${b < 0 ? '-' : '+'} ${Math.abs(b)}` : ''}`;
}

// ===================== rational-power-existence =====================
const NEG_BASES = [-8, -27, -64, -125, -32, -4, -9, -16, -1, -81];
const EXPS: [number, number][] = [[1, 3], [2, 3], [4, 3], [1, 5], [3, 5], [1, 2], [3, 2], [1, 4], [3, 4], [2, 6], [4, 6], [2, 10]];
export const negBaseReal: Gen = (R, n) => {
  for (;;) {
    const a = pick(R, NEG_BASES), [m, k] = pick(R, EXPS);
    const v = powQ(q(a), m, k);
    if (v.kind === 'irrational' || v.kind === 'undefined') continue;
    if (v.kind === 'value' && (v.v[1] !== 1 || Math.abs(v.v[0]) > 1000)) continue;
    const [rm, rk] = red(m, k), unreduced = rm !== m;
    const pw = `(${iH(a)})<sup>${m}/${k}</sup>`;
    const base: Base = {
      id: `negBaseReal-${n}`, family: 'negBaseReal', prompt: `Real numbers only, exponents read in lowest terms. What is ${pw}?`, board: `\\left(${iT(a)}\\right)^{\\frac{${m}}{${k}}} = \\,?`,
      solution: [], picture: undefined,
    };
    if (v.kind === 'notreal') {
      const abs = powQ(q(-a), rm, rk), av = abs.kind === 'value' && abs.v[1] === 1 ? abs.v[0] : null;
      base.solution = [`${m}/${k}${unreduced ? ` = ${rm}/${rk}` : ''}: the denominator ${rk} is even, so it asks for an even root of ${iH(a)}.`, `No real number has an even power that is negative: ${ans(NR)}.`];
      const opts: Opt[] = [{ t: NR, ok: true, say: `Right: an even root of a negative number is not real.` }];
      if (av !== null) { opts.push({ t: iH(av), mc: MC.alwaysReal, say: `${iH(av)} would come from ${iH(-a)}, not ${iH(a)}: the ${rk === 2 ? 'square' : 'fourth'} root of a negative number is not real.` }, { t: iH(-av), mc: MC.alwaysReal, say: `${rootH(rk, iH(a))} would be needed, and no real number has an even power that is negative.` }); }
      else continue;
      if (opts.length < 3) opts.push({ t: '1', say: 'Nothing here gives 1.' });
      return choiceItem(R, base, uniq(opts));
    }
    const val = v.v[0], rv = powQ(q(a), 1, rk), root = rv.kind === 'value' ? rv.v[0] : 0;
    base.solution = [`${unreduced ? `Lowest terms first: ${m}/${k} = ${rm}/${rk}. ` : ''}The denominator ${rk} is odd: ${rootH(rk, iH(a))} = ${iH(root)}.`, `Then the power: (${iH(root)})<sup>${rm}</sup> = ${ans(iH(val))}.`];
    const lawSlip = unreduced && val < 0;
    return choiceItem(R, base, uniq([
      { t: iH(val), ok: true, say: `Yes: ${rootH(rk, iH(a))} = ${iH(root)}, and (${iH(root)})<sup>${rm}</sup> = ${iH(val)}.` },
      { t: NR, mc: unreduced ? MC.wrongFeature : MC.neverDefined, say: unreduced ? `Read ${m}/${k} in lowest terms: ${rm}/${rk}. The denominator ${rk} is odd, so the root is real.` : `An odd root of a negative number is real: ${rootH(rk, iH(a))} = ${iH(root)}.` },
      { t: iH(-val), mc: lawSlip ? MC.lawsAlways : undefined, say: lawSlip ? `Splitting the exponent as (${iH(a)})<sup>${m}</sup>, then the 1/${k} root, squares away the sign: that step needs a positive base. Read ${m}/${k} as ${rm}/${rk}.` : rm % 2 === 0 ? `An even power of ${iH(root)} is positive: (${iH(root)})<sup>${rm}</sup> = ${iH(val)}.` : `An odd power keeps the sign of ${iH(root)}: ${iH(val)}.` },
    ]));
  }
};

export const minusParen: Gen = (R, n) => {
  const odd = R() < 0.5;
  const k = odd ? 3 : pick(R, [2, 2, 4]), r = odd ? pick(R, [2, 3, 4, 5]) : k === 2 ? pick(R, [3, 4, 5, 6, 7, 9]) : pick(R, [2, 3]);
  const m = odd ? pick(R, [1, 2]) : 1, a = ipow(r, k), val = ipow(r, m);
  const paren = R() < 0.5;
  const shown = paren ? `(−${a})<sup>${m}/${k}</sup>` : `−${a}<sup>${m}/${k}</sup>`, shownT = paren ? `\\left(-${a}\\right)^{\\frac{${m}}{${k}}}` : `-${a}^{\\frac{${m}}{${k}}}`;
  const sgn = m % 2 === 0 ? 1 : -1;
  const base: Base = {
    id: `minusParen-${n}`, family: 'minusParen', prompt: `Real numbers only. What is ${shown}?`, board: `${shownT} = \\,?`, solution: [],
  };
  let opts: Opt[];
  if (!paren) {
    base.solution = [`Without parentheses the power acts on ${a} only: −(${a}<sup>${m}/${k}</sup>).`, `${a}<sup>${m}/${k}</sup> = ${val}, so ${shown} = ${ans(iH(-val))}.`];
    opts = [
      { t: iH(-val), ok: true, say: 'Yes: the minus sign is outside the power, so it comes last.' },
      { t: iH(val), mc: MC.minusPower, say: `No parentheses: the base is ${a}, not −${a}. The minus is applied last.` },
      { t: NR, mc: MC.minusPower, say: `Without parentheses the base is ${a}, which is positive: ${a}<sup>${m}/${k}</sup> = ${val}, then the minus.` },
    ];
  } else if (!odd) {
    base.solution = [`The parentheses make −${a} the base, and the denominator ${k} asks for an even root.`, `No real number has an even power that is negative: ${ans(NR)}.`];
    opts = [
      { t: NR, ok: true, say: `Right: the base is −${a}, and an even root of a negative number is not real.` },
      { t: iH(-val), mc: MC.sqrtNegNeg, say: `(−${r})<sup>${k}</sup> = ${a}, not −${a}. No real number works.` },
      { t: iH(val), mc: MC.alwaysReal, say: `${r}<sup>${k}</sup> = ${a}, not −${a}. No real number works.` },
    ];
  } else {
    base.solution = [`The parentheses make −${a} the base. The denominator ${k} is odd: ${rootH(k, `−${a}`)} = −${r}.`, `(−${r})<sup>${m}</sup> = ${ans(iH(sgn * val))}.`];
    opts = [
      { t: iH(sgn * val), ok: true, say: `Yes: ${rootH(k, `−${a}`)} = −${r}, and (−${r})<sup>${m}</sup> = ${iH(sgn * val)}.` },
      { t: iH(-sgn * val), mc: sgn < 0 ? MC.dropsSign : undefined, say: sgn < 0 ? `An odd root keeps the sign: ${rootH(k, `−${a}`)} = −${r}.` : `An even power is positive: (−${r})<sup>2</sup> = ${val}.` },
      { t: NR, mc: MC.neverDefined, say: `The denominator ${k} is odd, so the root of −${a} is real: −${r}.` },
    ];
  }
  return choiceItem(R, base, uniq(opts));
};

// ===================== domain-linear-radicand =====================
export const domLin: Gen = (R, n) => {
  for (;;) {
    const a = pick(R, [1, 1, 2, 3, -1, -2, -3]), c = int(R, -6, 8);
    if (c === 0) continue;
    const b = -a * c, form = pick(R, ['sq', 'sq', 'four', 'pow'] as const);
    if (form === 'pow' && a !== 1) continue;
    const L = linH(a, b), LT = linT(a, b);
    const f = form === 'sq' ? rootH(2, L) : form === 'four' ? rootH(4, L) : `(${L})<sup>3/2</sup>`;
    const fT = form === 'sq' ? `\\sqrt{${LT}}` : form === 'four' ? `\\sqrt[4]{${LT}}` : `\\left(${LT}\\right)^{\\frac{3}{2}}`;
    const right = a > 0 ? ge(X, c) : le(X, c);
    const base: Base = {
      id: `domLin-${n}`, family: 'domLin', prompt: `What is the domain of <i>f</i>(<i>x</i>) = ${f}? (Real outputs only.)`, board: `f(x) = ${fT}`,
      solution: [`${form === 'pow' ? `The exponent 3/2 has an even denominator: it is a square root. ` : 'An even root needs '}${form === 'pow' ? 'Need ' : ''}${L} ≥ 0.`, a > 0 ? `${L} ≥ 0 gives ${right}.` : `${L} ≥ 0: subtract ${b}, then divide by ${iH(a)} and turn the symbol: ${right}.`, `Domain: ${ans(right)}.`],
      picture: { dom: { a, b, n: form === 'four' ? 4 : 2, pow: form === 'pow' ? [3, 2] : undefined, reveal: { show: true } } },
    };
    return choiceItem(R, base, uniq([
      { t: right, ok: true, say: `Yes: the radicand ${L} must be 0 or more${a < 0 ? ', and dividing by a negative turns the symbol' : ''}.` },
      { t: a > 0 ? le(X, c) : ge(X, c), mc: a < 0 ? MC.noReversal : undefined, say: a < 0 ? `Dividing by ${iH(a)} turns the symbol. Test ${X} = ${c + 1}: ${L} = ${a * (c + 1) + b}, negative.` : `Test ${X} = ${c - 1}: the radicand is ${a * (c - 1) + b}, negative. The allowed side is ${right}.` },
      { t: a > 0 ? gt(X, c) : lt(X, c), mc: MC.strictOrZero, say: `At ${X} = ${c} the radicand is 0, and ${rootH(2, 0)} = 0 is fine: the endpoint is included.` },
      { t: a > 0 ? ge(X, -c) : le(X, -c), mc: MC.domainShift, say: `Solve ${L} ≥ 0 for ${X}: the boundary is where the radicand is 0, ${X} = ${c}.` },
    ]));
  }
};

export const domKind: Gen = (R, n) => {
  const c = int(R, 1, 6) * (R() < 0.5 ? -1 : 1), L = linH(1, -c), LT = linT(1, -c);
  const v = pick(R, ['odd', 'square', 'cubeDomain'] as const);
  if (v === 'cubeDomain') {
    const base: Base = {
      id: `domKind-${n}`, family: 'domKind', prompt: `What is the domain of <i>f</i>(<i>x</i>) = ${rootH(3, L)}?`, board: `f(x) = \\sqrt[3]{${LT}}`,
      solution: ['A cube root (odd index) exists for every real number, negative ones too.', `Domain: ${ans(ALL)}.`],
    };
    return choiceItem(R, base, [
      { t: ALL, ok: true, say: `Right: an odd root accepts negative radicands, ${rootH(3, -8)} = −2.` },
      { t: ge(X, c), mc: MC.sameDomain, say: `That is the rule for EVEN roots. A cube root of a negative number is real.` },
      { t: gt(X, c), mc: MC.sameDomain, say: `A cube root accepts 0 and negative radicands: every real ${X} works.` },
      { t: nq(X, c), say: `${rootH(3, 0)} = 0 is fine: nothing is divided here.` },
    ]);
  }
  const k = int(R, 1, 4);
  const evens: Opt[] = shuffle(R, [
    { t: rootH(2, L), mc: MC.allowsNeg, say: `An even root needs ${L} ≥ 0: ${X} = ${c - 1} fails.` },
    { t: rootH(4, linH(1, k)), mc: MC.allowsNeg, say: `A fourth root needs ${linH(1, k)} ≥ 0: ${X} = ${-k - 1} fails.` },
    { t: `(${L})<sup>1/2</sup>`, mc: MC.allowsNeg, say: `The exponent 1/2 is a square root: it needs ${L} ≥ 0.` },
    { t: `(${linH(1, k)})<sup>3/4</sup>`, mc: MC.allowsNeg, say: `The denominator 4 is even: it needs ${linH(1, k)} ≥ 0.` },
  ]).slice(0, 3);
  if (v === 'odd') {
    const base: Base = {
      id: `domKind-${n}`, family: 'domKind', prompt: 'Which function is defined for EVERY real number <i>x</i>?', board: '\\text{domain} = \\text{all real numbers?}',
      solution: ['Even roots (and denominators 2 or 4 in an exponent) need a radicand ≥ 0. An odd root accepts any real number.', `So: ${ans(rootH(3, L))}.`],
    };
    return choiceItem(R, base, [{ t: rootH(3, L), ok: true, say: 'Right: an odd root is real for negative radicands too.' }, ...evens.map(e => ({ ...e, mc: MC.sameDomain }))]);
  }
  const a = int(R, 2, 3), b = int(R, 1, 7), sq = `(${linH(-a, b)})<sup>2</sup>`;
  const base: Base = {
    id: `domKind-${n}`, family: 'domKind', prompt: 'Which function is defined for EVERY real number <i>x</i>?', board: '\\text{domain} = \\text{all real numbers?}',
    solution: ['A positive whole-number power can be taken of any real number. Even roots need a radicand ≥ 0.', `So: ${ans(sq)}.`],
  };
  return choiceItem(R, base, [{ t: sq, ok: true, say: 'Right: squaring works for every real number; only even ROOTS restrict the input.' }, ...evens]);
};

// ===================== domain-radical-denominator =====================
export const domDen: Gen = (R, n) => {
  for (;;) {
    const a = pick(R, [1, 1, 2, -1]), c = int(R, -5, 7);
    if (c === 0) continue;
    const b = -a * c, L = linH(a, b), LT = linT(a, b), k = int(R, 1, 9), odd = R() < 0.35;
    const idx = odd ? 3 : 2;
    const fH = `${k} / ${rootH(idx, L)}`, fT = `\\frac{${k}}{${rootT(idx, LT)}}`;
    const strictR = a > 0 ? gt(X, c) : lt(X, c), weakR = a > 0 ? ge(X, c) : le(X, c);
    const base: Base = {
      id: `domDen-${n}`, family: 'domDen', prompt: `What is the domain of <i>f</i>(<i>x</i>) = ${fH}?`, board: `f(x) = ${fT}`,
      solution: odd
        ? [`A cube root is real for every input, but the denominator cannot be 0: ${L} ≠ 0.`, `Domain: ${ans(nq(X, c))}.`]
        : [`The root needs ${L} ≥ 0, and the denominator cannot be 0, so ${L} &gt; 0.`, `Domain: ${ans(strictR)}.`],
      picture: { dom: { a, b, n: idx, den: true, reveal: { show: true } } },
    };
    const opts: Opt[] = odd ? [
      { t: nq(X, c), ok: true, say: `Right: any radicand is fine for a cube root, except the one that makes the bottom 0.` },
      { t: strictR, mc: MC.sameDomain, say: `A cube root of a negative number is real. Only ${X} = ${c} (bottom = 0) is out.` },
      { t: ALL, mc: MC.denZero, say: `At ${X} = ${c} the bottom is ${rootH(3, 0)} = 0, and division by 0 is undefined.` },
      { t: weakR, mc: MC.sameDomain, say: `${X} = ${c} makes the bottom 0, and negative radicands are fine for a cube root.` },
    ] : [
      { t: strictR, ok: true, say: `Right: ≥ 0 for the root, ≠ 0 for the denominator, so &gt; 0.` },
      { t: weakR, mc: MC.denZero, say: `At ${X} = ${c} the bottom is ${rootH(2, 0)} = 0: dividing by 0 is undefined. The endpoint is open.` },
      { t: nq(X, c), mc: MC.allowsNeg, say: `On the other side of ${c} the radicand is negative, and its square root is not real.` },
      { t: a > 0 ? lt(X, c) : gt(X, c), mc: a < 0 ? MC.noReversal : undefined, say: `Test a point: the radicand must be positive. ${a < 0 ? 'Dividing by a negative turns the symbol.' : ''}` },
    ];
    return choiceItem(R, base, opts);
  }
};

export const allowedInput: Gen = (R, n) => {
  for (;;) {
    const c = int(R, -4, 8), dir = R() < 0.65 ? 1 : -1, k = int(R, 1, 9);
    const L = dir > 0 ? linH(1, -c) : linH(-1, c), LT = dir > 0 ? linT(1, -c) : linT(-1, c);
    if (c === 0 && dir < 0) continue;
    const good = c + dir * int(R, 1, 5), bad1 = c - dir * int(R, 1, 3), bad2 = c - dir * int(R, 4, 7);
    if (new Set([good, bad1, bad2, c]).size < 4) continue;
    const base: Base = {
      id: `allowedInput-${n}`, family: 'allowedInput', prompt: `<i>f</i>(<i>x</i>) = ${k} / ${rootH(2, L)}. Which input is in the domain of <i>f</i>?`, board: `f(x) = \\frac{${k}}{\\sqrt{${LT}}}`,
      solution: [`The radicand ${L} must be positive (≥ 0 for the root, ≠ 0 for the bottom).`, `At ${X} = ${good} it is ${dir * (good - c)} &gt; 0: ${ans(`${X} = ${iH(good)}`)}.`],
    };
    return choiceItem(R, base, [
      { t: `${X} = ${iH(good)}`, ok: true, say: `Yes: the radicand is ${dir * (good - c)}, positive.` },
      { t: `${X} = ${iH(c)}`, mc: MC.denZero, say: `At ${X} = ${c} the radicand is 0: the bottom is 0, and division by 0 is undefined.` },
      { t: `${X} = ${iH(bad1)}`, mc: MC.allowsNeg, say: `At ${X} = ${bad1} the radicand is ${dir * (bad1 - c)}: the square root of a negative number is not real.` },
      { t: `${X} = ${iH(bad2)}`, mc: MC.allowsNeg, say: `At ${X} = ${bad2} the radicand is ${dir * (bad2 - c)}, negative.` },
    ]);
  }
};

// ===================== domain-rational-power =====================
type Dom = 'all' | 'ge' | 'gt' | 'ne';
const POW_EXPS: [number, number][] = [[1, 2], [3, 2], [3, 4], [1, 4], [5, 2], [5, 6], [-1, 2], [-3, 4], [-3, 2], [1, 3], [2, 3], [4, 3], [2, 5], [3, 5], [1, 5], [-1, 3], [-2, 3], [-2, 5], [2, 6], [2, 4], [4, 6], [-2, 6], [0, 1]];
function domOf(m: number, k: number): Dom {
  if (m === 0) return 'ne';
  const [rm, rk] = red(m, k);
  if (rk % 2 === 0) return rm > 0 ? 'ge' : 'gt';
  return rm > 0 ? 'all' : 'ne';
}
function domMc(right: Dom, pickD: Dom, m: number, k: number): string | undefined {
  const unreduced = gcd(Math.abs(m), k) > 1 && m !== 0;
  if (m === 0) return pickD === 'all' ? MC.zeroZero : undefined;
  if (unreduced && right === 'all' || unreduced && right === 'ne' && (pickD === 'gt' || pickD === 'ge')) return MC.wrongFeature;
  if (right === 'ge') return pickD === 'all' ? MC.alwaysReal : pickD === 'gt' ? MC.strictOrZero : MC.signOnly;
  if (right === 'gt') return pickD === 'ge' ? MC.denZero : pickD === 'ne' ? MC.signOnly : MC.alwaysReal;
  if (right === 'all') return pickD === 'ne' ? MC.signOnly : MC.neverDefined;
  return pickD === 'all' ? MC.denZero : pickD === 'gt' ? MC.neverDefined : MC.neverDefined;
}
function domText(d: Dom, v: string, c: number): string { return d === 'all' ? ALL : d === 'ge' ? ge(v, c) : d === 'gt' ? gt(v, c) : nq(v, c); }
function domWhy(m: number, k: number, base: string): string {
  if (m === 0) return `${base}<sup>0</sup> = 1 needs ${base} ≠ 0: 0<sup>0</sup> is undefined.`;
  const [rm, rk] = red(m, k);
  const lt0 = `${gcd(Math.abs(m), k) > 1 ? `Lowest terms: ${m}/${k} = ${rm}/${rk}. ` : ''}`;
  if (rk % 2 === 0) return `${lt0}The denominator ${rk} is even: an even root needs ${base} ≥ 0${rm < 0 ? `; the negative exponent puts it in a denominator, so ${base} ≠ 0 too` : ''}.`;
  return `${lt0}The denominator ${rk} is odd: negative bases are fine${rm < 0 ? `; the negative exponent puts it in a denominator, so ${base} ≠ 0` : ''}.`;
}
function powDomain(R: () => number, n: number, family: string, c: number): import('./common').RXItem {
  const [m, k] = pick(R, POW_EXPS);
  const right = domOf(m, k);
  const bH = c === 0 ? X : `(${linH(1, -c)})`, bT = c === 0 ? 'x' : `\\left(${linT(1, -c)}\\right)`;
  const eH = m === 0 ? '0' : expH(m, k), eT = m === 0 ? '0' : expT(m, k);
  const base: Base = {
    id: `${family}-${n}`, family, prompt: `Real numbers only, exponents read in lowest terms${m === 0 ? ', and 0<sup>0</sup> is undefined' : ''}. What is the domain of <i>f</i>(<i>x</i>) = ${bH}<sup>${eH}</sup>?`, board: `f(x) = ${bT}^{${eT}}`,
    solution: [domWhy(m, k, c === 0 ? X : linH(1, -c)), `Domain: ${ans(domText(right, X, c))}.`],
  };
  return choiceItem(R, base, (['all', 'ge', 'gt', 'ne'] as Dom[]).map(d => d === right
    ? { t: domText(d, X, c), ok: true, say: `Right. ${domWhy(m, k, c === 0 ? X : linH(1, -c))}` }
    : { t: domText(d, X, c), mc: domMc(right, d, m, k), say: domWhy(m, k, c === 0 ? X : linH(1, -c)) }));
}
export const domPow: Gen = (R, n) => powDomain(R, n, 'domPow', 0);
export const domPowLin: Gen = (R, n) => { const c = int(R, 1, 6) * (R() < 0.4 ? -1 : 1); return powDomain(R, n, 'domPowLin', c); };

// ===================== even-root-absolute-value =====================
export const absRoot: Gen = (R, n) => {
  const t = pick(R, ['x2', 'x4r4', 'x6', 'x4', 'kx2', 'x3', 'x8', 'k72'] as const), vl = pick(R, ['x', 'y', 't', 'a']), X = V(vl);
  const xp = (e: number) => (e === 1 ? X : `${X}<sup>${e}</sup>`), ab = (s: string) => `|${s}|`;
  let shown: string, shownT: string, opts: Opt[], why: string, right: string;
  if (t === 'x2' || t === 'x4r4') {
    const idx = t === 'x2' ? 2 : 4; shown = rootH(idx, xp(idx)); shownT = rootT(idx, `x^{${idx}}`); right = ab(X);
    why = `For ${X} = −3: ${rootH(idx, `(−3)<sup>${idx}</sup>`)} = ${rootH(idx, ipow(3, idx))} = 3, which is −${X}, not ${X}. The root is never negative: |${X}|.`;
    opts = [{ t: right, ok: true, say: 'Yes: an even root is never negative, and |x| covers both signs.' }, { t: X, mc: MC.sqrtX2, say: `Try ${X} = −3: the root gives 3, not −3.` }, { t: `±${X}`, mc: MC.principalPM, say: 'The root sign names ONE value, the one that is not negative.' }, { t: xp(idx), say: `The ${idx === 2 ? 'square' : 'fourth'} root undoes the power ${idx}.` }];
  } else if (t === 'x6') {
    shown = rootH(2, xp(6)); shownT = '\\sqrt{x^{6}}'; right = ab(xp(3));
    why = `${xp(6)} = (${xp(3)})<sup>2</sup>, and ${xp(3)} is negative when ${X} is: ${rootH(2, `(${xp(3)})<sup>2</sup>`)} = |${xp(3)}|.`;
    opts = [{ t: right, ok: true, say: `Yes: ${xp(3)} can be negative, the root cannot.` }, { t: xp(3), mc: MC.sqrtX2, say: `Try ${X} = −2: ${rootH(2, 64)} = 8, but (−2)<sup>3</sup> = −8.` }, { t: `±${xp(3)}`, mc: MC.principalPM, say: 'The root sign gives one value, never negative.' }, { t: ab(xp(4)), say: `Half of 6 is 3: ${rootH(2, xp(6))} = |${xp(3)}|.` }];
  } else if (t === 'x4' || t === 'x8') {
    const e = t === 'x4' ? 4 : 8, h = e / 2; shown = rootH(2, xp(e)); shownT = `\\sqrt{x^{${e}}}`; right = xp(h);
    why = `${xp(e)} = (${xp(h)})<sup>2</sup>, and ${xp(h)} is never negative (an even power): no bars needed.`;
    opts = [{ t: right, ok: true, say: `Yes: ${xp(h)} is already 0 or positive.` }, { t: `±${xp(h)}`, mc: MC.principalPM, say: 'The root sign names one value, the one that is not negative.' }, { t: ab(X), say: `${rootH(2, xp(e))} = ${xp(h)}: the square root halves the exponent.` }, { t: `−${xp(h)}`, say: `The root is never negative, and ${xp(h)} is never negative.` }];
  } else if (t === 'kx2') {
    const k = pick(R, [3, 4, 5, 6, 7]); shown = rootH(2, `${k * k}${xp(2)}`); shownT = `\\sqrt{${k * k}x^{2}}`; right = `${k}${ab(X)}`;
    why = `${rootH(2, k * k)} = ${k} and ${rootH(2, xp(2))} = |${X}|.`;
    opts = [{ t: right, ok: true, say: 'Yes: the bars keep the result from going negative.' }, { t: `${k}${X}`, mc: MC.sqrtX2, say: `Try ${X} = −1: ${rootH(2, k * k)} = ${k}, but ${k}(−1) = −${k}.` }, { t: `±${k}${X}`, mc: MC.principalPM, say: 'The root gives one value, never negative.' }, { t: `${k * k}${ab(X)}`, mc: MC.noRoot, say: `${k * k} comes out as its root: ${k}.` }];
  } else if (t === 'k72') {
    shown = rootH(2, `72${xp(2)}`); shownT = '\\sqrt{72x^{2}}'; right = `6${ab(X)}${rootH(2, 2)}`;
    why = `72${xp(2)} = 36 · 2 · ${xp(2)}: ${rootH(2, 36)} = 6, ${rootH(2, xp(2))} = |${X}|, ${rootH(2, 2)} stays.`;
    opts = [{ t: right, ok: true, say: 'Yes: 6, then |x|, then the root of 2 that stays inside.' }, { t: `6${X}${rootH(2, 2)}`, mc: MC.sqrtX2, say: `For ${X} &lt; 0 that is negative, but a square root is not.` }, { t: `36${ab(X)}${rootH(2, 2)}`, mc: MC.noRoot, say: '36 comes out as 6.' }, { t: `±6${X}${rootH(2, 2)}`, mc: MC.principalPM, say: 'The root sign names one value.' }];
  } else {
    shown = rootH(3, xp(3)); shownT = '\\sqrt[3]{x^{3}}'; right = X;
    why = `An odd root keeps the sign: ${rootH(3, '(−2)<sup>3</sup>')} = ${rootH(3, -8)} = −2. No bars.`;
    opts = [{ t: X, ok: true, say: 'Yes: a cube root undoes a cube for every real number, sign included.' }, { t: ab(X), mc: MC.unneededAbs, say: `Try ${X} = −2: ${rootH(3, -8)} = −2, but |−2| = 2. Odd roots need no bars.` }, { t: `±${X}`, mc: MC.pmOdd, say: 'A cube root has exactly one real value.' }, { t: xp(3), say: 'The cube root undoes the cube.' }];
  }
  const base: Base = {
    id: `absRoot-${n}`, family: 'absRoot', prompt: `${X} can be ANY real number. Simplify ${shown}.`, board: `${shownT.replace(/x/g, vl)} = \\,?`,
    solution: [why, `So ${shown} = ${ans(right)}.`],
  };
  return choiceItem(R, base, uniq(opts));
};

export const absCheck: Gen = (R, n) => {
  const t = pick(R, ['x2', 'x6', 'r4', 'c3', 'k2', 'x4'] as const), a = int(R, 2, 6);
  const xp = (e: number) => `${X}<sup>${e}</sup>`;
  let shown: string, shownT: string, val: number, odd = false;
  if (t === 'x2') { shown = rootH(2, xp(2)); shownT = '\\sqrt{x^{2}}'; val = a; }
  else if (t === 'x6') { const b = Math.min(a, 3); shown = rootH(2, xp(6)); shownT = '\\sqrt{x^{6}}'; val = b * b * b; return mk(b); }
  else if (t === 'r4') { shown = rootH(4, xp(4)); shownT = '\\sqrt[4]{x^{4}}'; val = a; }
  else if (t === 'c3') { shown = rootH(3, xp(3)); shownT = '\\sqrt[3]{x^{3}}'; val = -a; odd = true; }
  else if (t === 'k2') { const k = pick(R, [2, 3, 4, 5]); shown = rootH(2, `${k * k}${xp(2)}`); shownT = `\\sqrt{${k * k}x^{2}}`; val = k * a; }
  else { shown = rootH(2, xp(4)); shownT = '\\sqrt{x^{4}}'; val = a * a; }
  return mk(a);
  function mk(xv: number) {
    const base: Base = {
      id: `absCheck-${n}`, family: 'absCheck', prompt: `Evaluate ${shown} at <i>x</i> = −${xv}.`, board: `${shownT} \\;\\text{at}\\; x = -${xv}`,
      solution: [odd ? `An odd root keeps the sign: the cube root of (−${xv})<sup>3</sup> is −${xv}.` : `Work inside first: the power makes the radicand positive, and the root of it is not negative.`, `So the value is ${ans(iH(val))}.`],
    };
    return numItem(base, val, v => {
      if (v === val) return { ok: true, say: odd ? `Yes: ${iH(val)}. An odd root keeps the sign.` : `Yes: ${val}. The even root of an even power is never negative: it acts like |x|.` };
      if (!odd && v === -val) return { ok: false, mc: MC.sqrtX2, say: `An even root is never negative. Work inside first: the radicand is positive, and so is its root.` };
      if (odd && v === -val) return { ok: false, mc: MC.dropsSign, say: `(−${xv})<sup>3</sup> is negative, and the cube root keeps the sign: ${iH(val)}.` };
      return { ok: false, say: `Put −${xv} in, work out the radicand, then take the root.` };
    });
  }
};

// ===================== exponent-law-validity =====================
const CHAINS: { a: number; r: number; k: number }[] = [{ a: -8, r: 2, k: 3 }, { a: -27, r: 3, k: 3 }, { a: -64, r: 4, k: 3 }, { a: -32, r: 2, k: 5 }, { a: -125, r: 5, k: 3 }, { a: -216, r: 6, k: 3 }, { a: -1000, r: 10, k: 3 }, { a: -243, r: 3, k: 5 }];
/** the flawed chain −r = a^(1/k) = a^(g/(gk)) = (a^g)^(1/(gk)) = (|a|^g)^(1/(gk)) = r, as TeX lines */
export function chainLines(c: { a: number; r: number; k: number }, g = 2): string[] {
  const { a, r, k } = c, Ag = ipow(a, g);
  return [`-${r} = \\left(${a}\\right)^{\\frac{1}{${k}}}`, `= \\left(${a}\\right)^{\\frac{${g}}{${g * k}}}`, `= \\left(\\left(${a}\\right)^{${g}}\\right)^{\\frac{1}{${g * k}}}`, `= ${Ag}^{\\frac{1}{${g * k}}}`, `= ${r}`];
}
export const flawStep: Gen = (R, n) => {
  const c = pick(R, CHAINS), { a, r, k } = c, g = k === 3 && Math.abs(a) <= 216 && R() < 0.4 ? 4 : 2, Ag = ipow(a, g);
  const base: Base = {
    id: `flawStep-${n}`, family: 'flawStep', prompt: `This chain "proves" −${r} = ${r}. Exponents are read in lowest terms. Which step is wrong?`, board: chainLines(c, g).join(' '),
    solution: [`Step 2 is fine: ${g}/${g * k} = 1/${k}, the same number.`, `Step 3 uses (a<sup>m</sup>)<sup>1/n</sup> = a<sup>m/n</sup>, which needs a ≥ 0: the even power ${g} throws away the sign of ${iH(a)}.`, `So: ${ans('Step 3')}.`],
    picture: { chain: { lines: chainLines(c, g) } },
  };
  return choiceItem(R, base, [
    { t: 'Step 1', mc: MC.oddNegUndef, say: `(−${r})<sup>${k}</sup> = ${iH(a)}, so (${iH(a)})<sup>1/${k}</sup> = −${r}: an odd root of a negative number is real.` },
    { t: 'Step 2', mc: MC.wrongFeature, say: `${g}/${g * k} = 1/${k}: in lowest terms it is the same exponent, the same number.` },
    { t: 'Step 3', ok: true, say: `Yes: the power-of-a-power law needs a positive base. (${iH(a)})<sup>${g}</sup> = ${Ag} loses the sign.` },
    { t: 'Step 4', say: `(${iH(a)})<sup>${g}</sup> = ${Ag}: plain arithmetic.` },
    { t: 'Step 5', mc: MC.everyPM, say: `${r}<sup>${g * k}</sup> = ${Ag}, and the principal root is the positive one, ${r}. That step is right.` },
  ], true);
};

export const lawHolds: Gen = (R, n) => {
  const xp = (e: number) => `${X}<sup>${e}</sup>`;
  const TRUE: string[] = [`${rootH(3, xp(3))} = ${X}`, `${rootH(5, xp(5))} = ${X}`, `${rootH(2, xp(2))} = |${X}|`,];
  const FALSE: Opt[] = [
    { t: `${rootH(2, xp(2))} = ${X}`, mc: MC.lawsAlways, say: `Counterexample: ${X} = −3 gives ${rootH(2, 9)} = 3, not −3.` },
    { t: `(${rootH(2, X)})<sup>2</sup> = ${X}`, mc: MC.lawsAlways, say: `Counterexample: ${X} = −4: ${rootH(2, '−4')} is not real, so the left side is undefined.` },
    { t: `(${xp(2)})<sup>1/2</sup> = ${X}`, mc: MC.lawsAlways, say: `Counterexample: ${X} = −5 gives 25<sup>1/2</sup> = 5, not −5.` },
    { t: `${rootH(4, xp(4))} = ${X}`, mc: MC.lawsAlways, say: `Counterexample: ${X} = −2 gives ${rootH(4, 16)} = 2, not −2.` },
    { t: `No exponent law holds when ${X} is negative`, mc: MC.rejectsAll, say: `Too strong: ${rootH(3, xp(3))} = ${X} holds for negative ${X} too, and (−8)<sup>1/3</sup> · (−8)<sup>1/3</sup> = (−8)<sup>2/3</sup> = 4.` },
  ];
  const right = pick(R, TRUE), wrongs = shuffle(R, FALSE.slice()).slice(0, 3);
  const TEXOF: Record<string, string> = {
    [TRUE[0]!]: '\\sqrt[3]{x^3} = x', [TRUE[1]!]: '\\sqrt[5]{x^5} = x', [TRUE[2]!]: '\\sqrt{x^2} = |x|',
    [FALSE[0]!.t]: '\\sqrt{x^2} = x', [FALSE[1]!.t]: '\\left(\\sqrt{x}\\right)^2 = x', [FALSE[2]!.t]: '\\left(x^2\\right)^{\\frac12} = x', [FALSE[3]!.t]: '\\sqrt[4]{x^4} = x',
    [FALSE[4]!.t]: '\\text{no law holds for } x < 0',
  };
  const shownTex = shuffle(R, [right, ...wrongs.map(w => w.t)]).map(t => TEXOF[t]).filter(Boolean);
  const base: Base = {
    id: `lawHolds-${n}`, family: 'lawHolds', prompt: `Which statement is true for EVERY real number <i>x</i>? (One counterexample is enough to break a statement.)`, board: shownTex.join(',\\ \\ '),
    solution: ['Test each statement with a negative x: one counterexample breaks an "every x" claim.', `Odd roots keep the sign, and an even root of x² gives |x|. So: ${ans(right)}.`],
  };
  return choiceItem(R, base, [{ t: right, ok: true, say: 'Yes: it holds for negative x too.' }, ...wrongs]);
};

// ===================== preserve-domain-when-rewriting =====================
const KEEP: { l: string; lT: string; r: string; rT: string; d: Dom; c?: boolean }[] = [
  { l: `${rootH(2, X)} / ${rootH(2, X)}`, lT: '\\frac{\\sqrt{x}}{\\sqrt{x}}', r: '1', rT: '1', d: 'gt' },
  { l: `${X}<sup>1/2</sup> · ${X}<sup>1/2</sup>`, lT: 'x^{\\frac12} \\cdot x^{\\frac12}', r: X, rT: 'x', d: 'ge' },
  { l: `(${rootH(2, X)})<sup>2</sup>`, lT: '\\left(\\sqrt{x}\\right)^2', r: X, rT: 'x', d: 'ge' },
  { l: `${X}<sup>1/4</sup> / ${X}<sup>1/4</sup>`, lT: '\\frac{x^{\\frac14}}{x^{\\frac14}}', r: '1', rT: '1', d: 'gt' },
  { l: `${X} / ${rootH(2, X)}`, lT: '\\frac{x}{\\sqrt{x}}', r: rootH(2, X), rT: '\\sqrt{x}', d: 'gt' },
  { l: `SQ · SQ`, lT: 'SQT \\cdot SQT', r: 'LIN', rT: 'LINT', d: 'ge', c: true },
  { l: `SQ / SQ`, lT: '\\frac{SQT}{SQT}', r: '1', rT: '1', d: 'gt', c: true },
];
export const keepDomain: Gen = (R, n) => {
  const t = pick(R, KEEP), c = t.c ? int(R, 1, 6) * (R() < 0.3 ? -1 : 1) : 0;
  const L = linH(1, -c), LT = linT(1, -c), SQ = rootH(2, L), SQT = `\\sqrt{${LT}}`;
  const sub = (s: string, tex = false) => s.replace(/SQT/g, SQT).replace(/LINT/g, LT).replace(/SQ/g, SQ).replace(/LIN/g, L);
  const l = sub(t.l), lT = sub(t.lT, true), r = sub(t.r), rT = sub(t.rT, true);
  const right = t.d;
  const why = right === 'gt' ? `The left side needs ${rootH(2, c ? L : X)} in a denominator: ${c ? L : X} &gt; 0.` : `The left side needs ${c ? L : X} ≥ 0 for the square root; 0 is fine.`;
  const base: Base = {
    id: `keepDomain-${n}`, family: 'keepDomain', prompt: `${l} simplifies to ${r}. For which <i>x</i> are the two sides equal, with both defined?`, board: `${lT} = ${rT}\\,?`,
    solution: [why, `The rewrite keeps the original restriction: ${ans(domText(right, X, c))}.`],
  };
  const say = (d: Dom) => d === 'all' ? `The right side is defined everywhere, but the left side is not: the rewrite must keep the left side's restriction.` : d === 'ne' ? `Negative ${c ? 'radicands' : 'inputs'} have no real square root, so the left side is undefined there.` : d === 'ge' ? `At ${X} = ${iH(c)} the left side divides by 0.` : `At ${X} = ${iH(c)} both sides are defined and equal (0 = 0): the endpoint is in.`;
  return choiceItem(R, base, (['ge', 'gt', 'all', 'ne'] as Dom[]).map(d => d === right
    ? { t: domText(d, X, c), ok: true, say: `Yes. ${why}` }
    : { t: domText(d, X, c), mc: d === 'all' ? MC.dropsRestriction : d === 'ne' ? MC.allowsNeg : d === 'ge' ? MC.denZero : MC.strictOrZero, say: say(d) }));
};

export const samePair: Gen = (R, n) => {
  const t = pick(R, ['prod', 'quot', 'xOverRoot'] as const), c = R() < 0.6 ? int(R, 1, 6) * (R() < 0.35 ? -1 : 1) : 0;
  const L = c ? linH(1, -c) : X, LT = c ? linT(1, -c) : 'x', SQ = rootH(2, L), SQT = `\\sqrt{${LT}}`;
  let fH: string, fT: string, gH: string, gT: string, right: number, others: number[];
  const above = (vs: number[]) => shuffle(R, vs.map(v => c + v)).slice(0, 3);
  if (t === 'prod') { fH = `${SQ} · ${SQ}`; fT = `${SQT} \\cdot ${SQT}`; gH = L; gT = LT; right = c - int(R, 1, 9); others = above([0, 1, 4, 9, 16, 25]); }
  else if (t === 'quot') { fH = `${SQ} / ${SQ}`; fT = `\\frac{${SQT}}{${SQT}}`; gH = '1'; gT = '1'; right = c; others = above([1, 2, 4, 9, 16, 25]); }
  else { fH = `${c ? `(${L})` : L} / ${SQ}`; fT = `\\frac{${LT}}{${SQT}}`; gH = SQ; gT = SQT; right = c; others = above([1, 4, 9, 16, 25, 36]); }
  const base: Base = {
    id: `samePair-${n}`, family: 'samePair', prompt: `<i>f</i>(<i>x</i>) = ${fH} and <i>g</i>(<i>x</i>) = ${gH}. At which input do <i>f</i> and <i>g</i> NOT agree (one of them may have no value there)?`,
    board: `f(x) = ${fT}, \\quad g(x) = ${gT}`,
    solution: [t === 'prod' ? `For ${X} &lt; ${iH(c)}, ${SQ} is not real, so f is undefined while g = ${L} is a number.` : `At ${X} = ${iH(c)}, f divides by ${rootH(2, 0)} = 0, so f is undefined there. But g(${iH(c)}) = ${t === 'quot' ? 1 : 0}.`, `So: ${ans(`${X} = ${iH(right)}`)}.`],
  };
  return choiceItem(R, base, [
    { t: `${X} = ${iH(right)}`, ok: true, say: 'Yes: f is undefined there, g is not. Simplifying did not keep the restriction.' },
    ...others.map(o => ({ t: `${X} = ${iH(o)}`, mc: MC.dropsRestriction, say: `At ${X} = ${iH(o)} both are defined and give the same value.` })),
  ]);
};

// ===================== context-domain =====================
export const ctxDomain: Gen = (R, n) => {
  if (R() < 0.55) {
    const N = pick(R, [9, 16, 25, 36, 49, 64, 81, 100, 121, 144]), T = V('t');
    const base: Base = {
      id: `ctxDomain-${n}`, family: 'ctxDomain',
      prompt: `A square sheet of ice melts and keeps its square shape. <i>t</i> hours after noon its area is <i>A</i> = ${N} − <i>t</i> square feet, so its side is <i>s</i> = ${rootH(2, `${N} − ${T}`)} feet. For which <i>t</i> does the model describe the sheet, from noon on, while it still exists (side longer than 0)?`,
      board: `s = \\sqrt{${N} - t}`,
      solution: [`From noon on: ${T} ≥ 0. A side longer than 0: ${N} − ${T} &gt; 0, so ${T} &lt; ${N}.`, `Both at once: ${ans(`0 ≤ ${T} &lt; ${N}`)}.`],
    };
    return choiceItem(R, base, [
      { t: `0 ≤ ${T} &lt; ${N}`, ok: true, say: 'Yes: the formula\'s bound and the story\'s bounds, together.' },
      { t: `${T} ≤ ${N}`, mc: MC.ctxAll, say: `The formula allows negative ${T}, but the story starts at noon: ${T} ≥ 0.` },
      { t: `0 ≤ ${T} ≤ ${N}`, say: `At ${T} = ${N} the side is 0: the sheet is gone.` },
      { t: `${T} ≥ 0`, say: `After ${N} hours the radicand is negative: no sheet, no real side.` },
    ]);
  }
  const M = pick(R, [2, 3, 4, 5, 6, 8, 10, 12]), L = V('L');
  const base: Base = {
    id: `ctxDomain-${n}`, family: 'ctxDomain',
    prompt: `A pendulum of length <i>L</i> feet swings with period <i>T</i> = 2π${rootH(2, `${L}/32`)} seconds. A clockmaker builds pendulums no longer than ${M} feet (a real pendulum has a positive length). For which <i>L</i> does the model apply?`,
    board: `T = 2\\pi\\sqrt{\\frac{L}{32}}`,
    solution: [`A real pendulum has a length: ${L} &gt; 0 (the formula alone allows ${L} ≥ 0).`, `With the clockmaker's limit: ${ans(`0 &lt; ${L} ≤ ${M}`)}.`],
  };
  return choiceItem(R, base, [
    { t: `0 &lt; ${L} ≤ ${M}`, ok: true, say: 'Yes: a positive length, up to the limit.' },
    { t: `${L} ≤ ${M}`, mc: MC.ctxAll, say: 'A length is not negative, and the root needs L ≥ 0 anyway.' },
    { t: `0 ≤ ${L} ≤ ${M}`, say: 'A pendulum of length 0 is not a pendulum.' },
    { t: `${L} &gt; 0`, say: `The clockmaker's limit cuts it off at ${M} feet.` },
  ]);
};

export const ctxOverlap: Gen = (R, n) => {
  const v = pick(R, ['t', 'L', 'd']), V2 = V(v);
  const lo = pick(R, [0, 0, 1, 2]), hi = int(R, 5, 40), loIn = R() < 0.6, hiIn = R() < 0.5;
  const a = loIn ? `${V2} ≥ ${lo}` : `${V2} &gt; ${lo}`, b = hiIn ? `${V2} ≤ ${hi}` : `${V2} &lt; ${hi}`;
  const both = `${lo} ${loIn ? '≤' : '&lt;'} ${V2} ${hiIn ? '≤' : '&lt;'} ${hi}`;
  const flip = `${lo} ${loIn ? '&lt;' : '≤'} ${V2} ${hiIn ? '&lt;' : '≤'} ${hi}`;
  const base: Base = {
    id: `ctxOverlap-${n}`, family: 'ctxOverlap', prompt: `Which numbers satisfy BOTH ${a} and ${b}?`, board: `${loIn ? `${v} \\ge ${lo}` : `${v} > ${lo}`} \\;\\text{and}\\; ${hiIn ? `${v} \\le ${hi}` : `${v} < ${hi}`}`,
    solution: ['"And" keeps only the overlap of the two rays, with each endpoint as the inequality says.', `So: ${ans(both)}.`],
  };
  return choiceItem(R, base, [
    { t: both, ok: true, say: 'Yes: the overlap, each endpoint kept or left out as its inequality says.' },
    { t: ALL, mc: MC.andOr, say: 'That is "or" (either one). "And" needs both at once: only the overlap.' },
    { t: flip, say: 'The endpoints are swapped: ≥ keeps an endpoint, &gt; leaves it out.' },
    { t: b, say: `That forgets ${a}.` },
  ]);
};

export { qH };
