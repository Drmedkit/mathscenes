// fam1.ts: stage 1 families (reading a polynomial): powers, what is a polynomial, signed terms, coefficients,
// degree of a term and of a polynomial, names, standard form, multivariable degree. Pure: no DOM.
import { fr, int, pick, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { type Poly, type Term, T, collect, deg, degree, nH, polyHtml, polyTex, q, qHtml, sortStd, termHtml, termTex, xp } from './poly';
import { type Gen, type Opt, MC, Reroll, X, choiceItem, nz, numCheck, numItem, other, retry } from './common';

/** the shelf picture, when the shelf can hold it (powers 0-4) */
const shelfOf = (p: Poly, loose = true) => (p.every(t => t.x <= 4 && t.y === 0) ? { shelf: { rows: [p], loose } } : undefined);
/** n distinct degrees from [lo, hi] */
function degs(R: () => number, n: number, lo: number, hi: number): number[] { return shuffle(R, Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, n); }
/** a collected polynomial with these degrees (written in the given order), nonzero whole coefficients */
const withDegs = (R: () => number, ds: number[], lo = -9, hi = 9): Poly => ds.map(d => T(nz(R, lo, hi), d));
const cnt = (p: Poly) => p.length;

// ===================== exponent-reading =====================
export const powerRead: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['repeat', 'base', 'one', 'paren'] as const);
  const base = { id: `powerRead-${n}`, family: 'powerRead', board: '', solution: [] as string[] };
  if (v === 'repeat') {
    const k = int(R, 2, 6), prod = Array(k).fill(X).join(' · ');
    return choiceItem(R, { ...base, prompt: `Which expression means ${prod}?`, board: Array(k).fill('x').join(' \\cdot '), solution: [`${k} factors of ${X} multiplied: the exponent counts the factors, ${xp(k)}.`] }, [
      { t: xp(k), ok: true, say: `Yes: ${k} equal factors of ${X} is ${xp(k)}.` },
      { t: `${k}${X}`, mc: MC.baseTimesExp, say: `${k}${X} means ${k} times ${X}, which is ${X} added ${k} times. Here ${X} is MULTIPLIED ${k} times: ${xp(k)}.` },
      { t: `${k}<sup>x</sup>`, say: `In ${k}<sup>x</sup> the base is ${k}. Here the factor that repeats is ${X}.` },
    ]);
  }
  if (v === 'base') {
    const k = int(R, 2, 9);
    return choiceItem(R, { ...base, prompt: `In ${k}${xp(2)}, what is squared?`, board: `${k}x^{2}`, solution: [`An exponent belongs to the base it touches: in ${k}${xp(2)} only ${X} is squared, so ${k}${xp(2)} = ${k} · ${X} · ${X}.`, 'only x'] }, [
      { t: `only ${X}`, ok: true, say: `Yes: ${k}${xp(2)} = ${k} · ${X} · ${X}. The ${k} is not squared.` },
      { t: `${k}${X}, the whole term`, mc: MC.beyondBase, say: `That would be written (${k}${X})<sup>2</sup>. Without parentheses the 2 touches only ${X}.` },
      { t: `only the ${k}`, say: `The exponent sits on ${X}, so ${X} is squared: ${k} · ${X} · ${X}.` },
    ]);
  }
  if (v === 'one') {
    const k = int(R, 2, 9);
    return choiceItem(R, { ...base, prompt: `What is the exponent of ${X} in ${k}${X}?`, board: `${k}x`, solution: [`${X} by itself is ${X}<sup>1</sup>: one factor of ${X}.`] }, [
      { t: '1', ok: true, say: `Yes: ${X} = ${X}<sup>1</sup>, one factor of ${X}.` },
      { t: '0', mc: MC.expZero, say: `An unwritten exponent is 1, not 0: ${X} is one factor of ${X}. (${X}<sup>0</sup> would be 1.)` },
      { t: String(k), say: `${k} is the coefficient (what ${X} is multiplied by), not the exponent.` },
    ]);
  }
  const k = int(R, 3, 9);
  return choiceItem(R, { ...base, prompt: `Which expression is equal to (${k}${X})<sup>2</sup>?`, board: `(${k}x)^{2}`, solution: [`(${k}${X})<sup>2</sup> = ${k}${X} · ${k}${X} = ${k} · ${k} · ${X} · ${X} = ${k * k}${xp(2)}.`] }, [
    { t: `${k * k}${xp(2)}`, ok: true, say: `Yes: the parentheses square the whole ${k}${X}, so the ${k} is squared too.` },
    { t: `${k}${xp(2)}`, say: `With parentheses the 2 applies to everything inside: ${k}${X} · ${k}${X}, so the ${k} gets squared as well.` },
    { t: `${2 * k}${X}`, mc: MC.baseTimesExp, say: `Squaring is not doubling: (${k}${X})<sup>2</sup> = ${k}${X} · ${k}${X}, not 2 · ${k}${X}.` },
    { t: `${2 * k}${xp(2)}`, say: `${k} · ${k} = ${k * k}, not ${2 * k}: the ${k} is multiplied by itself.` },
  ]);
});

export const powerEval: Gen = (R, n) => retry(R, () => {
  const x = pick(R, [3, -2, 2, -3, 4, -1]);
  const v = pick(R, ['sq', 'two', 'kx2', 'kxsq', 'negsq', 'cube'] as const);
  const k = int(R, 2, 5);
  let e = '', t = '', val = 0, slips: { v: number; mc?: string; say: string }[] = [], work = '';
  const xs = x < 0 ? `(${nH(x)})` : String(x);
  if (v === 'sq') { e = xp(2); t = 'x^{2}'; val = x * x; work = `${xs} · ${xs} = ${nH(val)}`; slips = [{ v: 2 * x, mc: MC.baseTimesExp, say: `${xp(2)} is ${X} · ${X}, not 2 · ${X}.` }, { v: -x * x, say: `A negative times a negative is positive: ${xs} · ${xs} = ${nH(val)}.` }]; }
  else if (v === 'two') { e = `2${X}`; t = '2x'; val = 2 * x; work = `2 · ${xs} = ${nH(val)}`; slips = [{ v: x * x, mc: MC.baseTimesExp, say: `2${X} is 2 times ${X}, not ${X} squared.` }]; }
  else if (v === 'kx2') { e = `${k}${xp(2)}`; t = `${k}x^{2}`; val = k * x * x; work = `${k} · ${xs} · ${xs} = ${k} · ${x * x} = ${nH(val)}`; slips = [{ v: k * k * x * x, mc: MC.beyondBase, say: `Only ${X} is squared in ${k}${xp(2)}: square ${xs} first, then multiply by ${k}.` }, { v: 2 * k * x, mc: MC.baseTimesExp, say: `${xp(2)} means ${X} · ${X}, not 2${X}.` }]; }
  else if (v === 'kxsq') { e = `(${k}${X})<sup>2</sup>`; t = `(${k}x)^{2}`; val = k * k * x * x; work = `${k} · ${xs} = ${nH(k * x)}, then ${nH(k * x)} · ${nH(k * x)} = ${nH(val)}`; slips = [{ v: k * x * x, say: `The parentheses square the ${k} too: (${k} · ${xs})<sup>2</sup>.` }, { v: 2 * k * x, mc: MC.baseTimesExp, say: `Squaring is not doubling: multiply ${nH(k * x)} by itself.` }]; }
  else if (v === 'negsq') { e = `${'−'}${xp(2)}`; t = '-x^{2}'; val = -x * x; work = `square first: ${xs} · ${xs} = ${x * x}, then the minus: ${nH(val)}`; slips = [{ v: x * x, mc: MC.beyondBase, say: `In −${xp(2)} only ${X} is squared; the minus is applied after. (−${X})<sup>2</sup> would be positive.` }]; }
  else { e = xp(3); t = 'x^{3}'; val = x ** 3; work = `${xs} · ${xs} · ${xs} = ${nH(val)}`; slips = [{ v: 3 * x, mc: MC.baseTimesExp, say: `${xp(3)} is ${X} · ${X} · ${X}, not 3 · ${X}.` }, { v: Math.abs(x ** 3), say: `Three negative factors make a negative product.` }]; }
  return numItem({ id: `powerEval-${n}`, family: 'powerEval', prompt: `Find the value of ${e} when ${X} = ${nH(x)}.`, board: `${t} \\text{ at } x = ${x}`, solution: [`${work}.`, `So ${e} = ${ans(nH(val))}.`] },
    val, numCheck(val, `Yes: ${work}.`, slips, `Replace ${X} with ${xs} and follow the exponent: it applies only to the base it touches.`));
});

// ===================== poly-definition =====================
interface Ex { h: string; t: string; why: string; mc?: string }
function polys(R: () => number): Ex[] {
  const a = int(R, 2, 9), b = int(R, 2, 9), c = int(R, 2, 5);
  return [
    { h: `${a}${xp(2)} − ${b}`, t: `${a}x^{2} - ${b}`, why: 'whole-number exponents' },
    { h: `${fr(X, c)} + ${b}`, t: `\\frac{x}{${c}} + ${b}`, why: `${fr(X, c)} is ${fr(1, c)} · ${X}: a fraction is a fine coefficient`, mc: MC.rejectFrac },
    { h: `${fr(1, c)}&#8202;${xp(3)} − ${X}`, t: `\\tfrac{1}{${c}}x^{3} - x`, why: 'a fraction coefficient is allowed', mc: MC.rejectFrac },
    { h: `0.5${X} + ${a}`, t: `0.5x + ${a}`, why: 'a decimal coefficient is allowed', mc: MC.rejectFrac },
    { h: `−${a}`, t: `-${a}`, why: 'a constant is a polynomial (degree 0)' },
    { h: `${xp(4)} − ${b}${X} + ${a}`, t: `x^{4} - ${b}x + ${a}`, why: 'whole-number exponents' },
  ];
}
function nonPolys(R: () => number): Ex[] {
  const a = int(R, 2, 9), b = int(R, 2, 9);
  return [
    { h: `${fr(a, X)} + ${b}`, t: `\\frac{${a}}{x} + ${b}`, why: `${X} sits in a denominator (${fr(a, X)} = ${a}${X}<sup>−1</sup>)`, mc: MC.varDen },
    { h: `${fr(a, xp(2))} − ${X}`, t: `\\frac{${a}}{x^{2}} - x`, why: `${X} sits in a denominator`, mc: MC.varDen },
    { h: `√${X} + ${b}`, t: `\\sqrt{x} + ${b}`, why: `${X} sits under a root (√${X} = ${X}<sup>1/2</sup>)`, mc: MC.surface },
    { h: `${X}<sup>−2</sup> + ${b}`, t: `x^{-2} + ${b}`, why: 'the exponent −2 is not a whole number', mc: MC.surface },
    { h: `${a}<sup>x</sup> + 1`, t: `${a}^{x} + 1`, why: `${X} sits in an exponent`, mc: MC.surface },
  ];
}
export const isPoly: Gen = (R, n) => retry(R, () => {
  const P = pick(R, polys(R)), N = shuffle(R, nonPolys(R)).slice(0, 3);
  return choiceItem(R, { id: `isPoly-${n}`, family: 'isPoly', prompt: 'Which of these is a polynomial?', board: shuffle(R, [P, ...N]).map(x => x.t).join(',\\quad '),
    solution: ['A polynomial is a sum of terms whose variable exponents are whole numbers: no variable in a denominator, under a root, or in an exponent.', `${P.h}: ${P.why}.`] }, [
    { t: P.h, ok: true, say: `Yes: ${P.why}.` },
    ...N.map(x => ({ t: x.h, mc: x.mc, say: `Not a polynomial: ${x.why}.` })),
  ]);
});
export const notPoly: Gen = (R, n) => retry(R, () => {
  const N = pick(R, nonPolys(R)), P = shuffle(R, polys(R)).slice(0, 3);
  return choiceItem(R, { id: `notPoly-${n}`, family: 'notPoly', prompt: 'Which of these is <b>not</b> a polynomial?', board: shuffle(R, [N, ...P]).map(x => x.t).join(',\\quad '),
    solution: ['Look for a variable in a denominator, under a root, or in an exponent (or a negative exponent).', `${N.h}: ${N.why}.`] }, [
    { t: N.h, ok: true, say: `Right: ${N.why}.` },
    ...P.map(x => ({ t: x.h, mc: x.mc, say: `That one IS a polynomial: ${x.why}.` })),
  ]);
});

// ===================== signed-terms =====================
/** a polynomial for term reading: subtraction, a leading negative, scrambled order, or a lone constant */
function readPoly(R: () => number): Poly {
  const v = pick(R, ['sub', 'lead', 'scr', 'scr', 'one'] as const);
  if (v === 'one') return [T(other(R, -12, 12, [0, 1, -1]))];
  const n = int(R, 2, 4);
  const ds = v === 'scr' ? degs(R, n, 0, 4) : degs(R, n, 0, 4).sort((a, b) => b - a);
  const p = withDegs(R, ds);
  if (v === 'lead' && p[0]!.c.p > 0) p[0] = { ...p[0]!, c: q(-p[0]!.c.p) };
  if (v === 'sub' && !p.slice(1).some(t => t.c.p < 0) && p.length > 1) p[1] = { ...p[1]!, c: q(-Math.abs(p[1]!.c.p)) };
  return p;
}
/** the pieces a symbol-counter sees: a shown number and a variable part per term */
const pieces = (p: Poly) => p.reduce((s, t) => s + ((Math.abs(t.c.p) !== 1 || t.c.q !== 1 || deg(t) === 0) ? 1 : 0) + (deg(t) > 0 ? 1 : 0), 0);
export const countTerms: Gen = (R, n) => {
  const p = readPoly(R), a = cnt(p);
  return numItem({ id: `countTerms-${n}`, family: 'countTerms', prompt: `How many terms does ${polyHtml(p)} have?`, board: polyTex(p), unit: 'terms', picture: shelfOf(p),
    solution: [`Terms are the parts that are added; a minus sign belongs to the term after it.`, `The terms: ${p.map(termHtml).join(', ')}.`, `That is ${ans(a)} ${a === 1 ? 'term' : 'terms'}.`] },
    a, numCheck(a, `Yes: ${p.map(termHtml).join(', ')}.`, [{ v: pieces(p), mc: MC.symbols, say: `A number and its ${X}-part together make ONE term (${termHtml(p.find(t => deg(t) > 0) ?? p[0]!)} is one term). Count the parts that are added.` }], 'Split at each + or − sign between terms: each piece, with its sign, is one term.'));
};
export const whichTerms: Gen = (R, n) => retry(R, () => {
  const ds = degs(R, 3, 0, 3);
  const p = withDegs(R, ds);
  if (!p.slice(1).some(t => t.c.p < 0)) { const i = int(R, 1, 2); p[i] = { ...p[i]!, c: q(-Math.abs(p[i]!.c.p)) }; }
  const right = p.map(termHtml).join(', ');
  const detached = p.map((t, i) => (i === 0 ? termHtml(t) : termHtml({ ...t, c: q(Math.abs(t.c.p)) }))).join(', ');
  const split = p.flatMap(t => (deg(t) > 0 && Math.abs(t.c.p) !== 1 ? [(t.c.p < 0 ? '−' : '') + Math.abs(t.c.p), xp(t.x)] : [termHtml(t)])).join(', ');
  return choiceItem(R, { id: `whichTerms-${n}`, family: 'whichTerms', prompt: `What are the terms of ${polyHtml(p)}?`, board: polyTex(p), picture: shelfOf(p),
    solution: ['Each term keeps the sign in front of it: a minus belongs to the term after it.'] }, [
    { t: right, ok: true, say: 'Yes: each term with its own sign.' },
    { t: detached, mc: MC.detached, say: `The minus sign belongs to the term after it: that term is negative.` },
    { t: split, mc: MC.symbols, say: 'A number times a power of x is ONE term, not two.' },
  ]);
});

// ===================== coefficients =====================
export const coefOf: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['plain', 'one', 'negone', 'dec', 'missing', 'const'] as const);
  const ds = degs(R, 3, 0, 3).sort((a, b) => b - a);
  const p = withDegs(R, ds);
  let ask = ds[int(R, 0, 2)]!;
  if (v === 'one' || v === 'negone') { ask = ds.find(d => d > 0)!; const i = p.findIndex(t => t.x === ask); p[i] = T(v === 'one' ? 1 : -1, ask); }
  if (v === 'dec') { ask = ds.find(d => d > 0)!; const i = p.findIndex(t => t.x === ask); p[i] = T(q(pick(R, [1, 3, -1, 5, -3]), 2), ask, 0, 'dec'); }
  if (v === 'missing') { ask = [0, 1, 2, 3].find(d => !ds.includes(d) && d < Math.max(...ds))!; if (ask === undefined) throw new Reroll(); }
  if (v === 'const') { if (!ds.includes(0)) throw new Reroll(); ask = 0; }
  const t = p.find(u => u.x === ask);
  const c = t ? t.c.p / t.c.q : 0;
  const what = ask === 0 ? 'the constant term' : `the coefficient of ${xp(ask)}`;
  const slips = [
    ...(ask > 1 ? [{ v: ask, mc: MC.expAsCoef, say: `${ask} is the exponent. The coefficient is the number the power is multiplied by.` }] : []),
    ...(c < 0 ? [{ v: -c, mc: MC.detached, say: `The minus in front belongs to the term, so the coefficient is negative.` }] : []),
    ...(t && Math.abs(c) === 1 ? [{ v: 0, mc: MC.implicitOne, say: `${termHtml(t)} means ${c < 0 ? '−1' : '1'} · ${xp(ask)}: the unwritten coefficient is ${c < 0 ? '−1' : '1'}.` }] : []),
  ];
  return numItem({ id: `coefOf-${n}`, family: 'coefOf', prompt: `What is ${what} in ${polyHtml(p)}?`, board: polyTex(p), picture: shelfOf(p),
    solution: [t ? `The term with ${ask === 0 ? 'no ' + X : xp(ask)} is ${termHtml(t)}.` : `There is no ${xp(ask)} term: that power has coefficient 0.`, `So ${what} is ${ans(nH(c))}.`] },
    c, numCheck(c, t ? `Yes: ${termHtml(t)} has coefficient ${nH(c)}.` : `Yes: no ${xp(ask)} term means 0 · ${xp(ask)}.`, slips, 'Find the term with that power and read its signed number (an unwritten one is 1 or −1).'));
});
export const coefPick: Gen = (R, n) => retry(R, () => {
  const d = int(R, 1, 3), b = int(R, 2, 9), num = pick(R, [1, 1, 3, -1, 2]), den = other(R, 2, 8, [Math.abs(num), d]);
  if (num % den === 0 || (Math.abs(num) > 1 && den % Math.abs(num) === 0)) throw new Reroll();
  const over = R() < 0.6;
  const t: Term = T(q(num, den), d, 0, over ? 'over' : undefined);
  const p: Poly = [t, T(b)];
  const right = qHtml(q(num, den));
  return choiceItem(R, { id: `coefPick-${n}`, family: 'coefPick', prompt: `What is the coefficient of ${xp(d)} in ${polyHtml(p)}?`, board: polyTex(p), picture: shelfOf(p, false),
    solution: [`${termHtml(t)} = ${right} · ${xp(d)}: the coefficient is the whole number part in front, here a fraction.`] }, [
    { t: right, ok: true, say: `Yes: ${termHtml(t)} is ${right} times ${xp(d)}.` },
    { t: String(den), mc: MC.denAsCoef, say: `Dividing by ${den} is multiplying by ${fr(1, den)}: the coefficient is ${right}, not ${den}.` },
    { t: `−${den}`, mc: MC.denAsCoef, say: `The ${den} is a denominator: the coefficient is ${right}.` },
    ...(num < 0 ? [{ t: qHtml(q(-num, den)), mc: MC.detached, say: 'The minus sign belongs to the term: the coefficient is negative.' }] : []),
    ...(d > 1 ? [{ t: String(d), mc: MC.expAsCoef, say: `${d} is the exponent, not the coefficient.` }] : [{ t: String(b), say: `${b} is the constant term.` }]),
  ].slice(0, 4));
});

// ===================== degree-of-term =====================
export const termDegree: Gen = (R, n) => {
  const v = pick(R, ['big', 'const', 'x', 'neg', 'big'] as const);
  let t: Term;
  if (v === 'big') { const d = int(R, 2, 5); t = T(other(R, d + 1, 12, []), d); }
  else if (v === 'const') t = T(other(R, -12, 12, [0, 1, -1]));
  else if (v === 'x') t = T(other(R, 2, 9, []), 1);
  else t = T(-1, int(R, 2, 5));
  const a = deg(t), c = t.c.p;
  const slips = [
    ...(a > 0 ? [{ v: Math.abs(c), mc: MC.coefAsDeg, say: `${Math.abs(c)} is the coefficient. The degree is the exponent of ${X}.` }] : []),
    ...(a === 0 ? [{ v: 1, mc: MC.constDeg, say: `A constant has no ${X}: it is ${nH(c)} · ${X}<sup>0</sup>, degree 0.` }, { v: c, mc: MC.constDeg, say: `The size of a constant is not its degree: it has no ${X}, so degree 0.` }] : []),
    ...(a === 1 ? [{ v: 0, mc: MC.expZero, say: `${X} is ${X}<sup>1</sup>: degree 1.` }] : []),
  ];
  return numItem({ id: `termDegree-${n}`, family: 'termDegree', prompt: `What is the degree of the term ${termHtml(t)}?`, board: termTex(t),
    solution: [a === 0 ? `${termHtml(t)} has no ${X} (it is ${nH(c)}${X}<sup>0</sup>).` : `The exponent of ${X} in ${termHtml(t)} is ${a}.`, `Degree ${ans(a)}.`] },
    a, numCheck(a, `Yes: degree ${a}.`, slips, `The degree of a one-variable term is the exponent of ${X} (a constant has degree 0).`));
};
export const degreeHigh: Gen = (R, n) => retry(R, () => {
  const ds = degs(R, 4, 0, 5).sort((a, b) => a - b);
  // big coefficients on the LOW powers, so the biggest number is not the highest degree
  const cs = [int(R, 30, 90), int(R, 10, 25), int(R, 4, 9), pick(R, [1, -1, 2, -2, 3])];
  const ts = ds.map((d, i) => T(d === 0 ? cs[i]! : (R() < 0.3 ? -cs[i]! : cs[i]!), d));
  const top = ts[3]!;
  return choiceItem(R, { id: `degreeHigh-${n}`, family: 'degreeHigh', prompt: 'Which term has the highest degree?', board: ts.map(termTex).join(',\\quad '),
    solution: ['The degree of a term is its exponent of x, whatever the coefficient.', `${termHtml(top)} has exponent ${deg(top)}, the largest.`] },
    ts.map((t, i) => ({ t: termHtml(t), ok: i === 3, mc: i === 3 ? undefined : MC.coefAsDeg, say: i === 3 ? `Yes: exponent ${deg(t)}.` : `${termHtml(t)} has degree ${deg(t)}; a big coefficient does not raise the degree.` })), { min: 4 });
});

// ===================== degree-of-polynomial =====================
export const polyDegree: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['scr', 'scr', 'miss', 'const'] as const);
  let p: Poly;
  if (v === 'const') p = [T(other(R, -12, 12, [0, 1, -1]))];
  else {
    const k = int(R, 2, 4);
    const ds = v === 'miss' ? degs(R, k, 0, 5).sort((a, b) => b - a) : degs(R, k, 0, 4);
    if (v === 'scr' && ds[0] === Math.max(...ds)) ds.push(ds.shift()!);
    p = withDegs(R, ds);
  }
  const a = degree(p)!;
  const first = deg(p[0]!), sum = p.reduce((s, t) => s + deg(t), 0), lead = sortStd(p)[0]!;
  const slips = [
    { v: first, mc: MC.byPosition, say: `The first written term is not always the highest power. Look at every exponent.` },
    { v: sum, mc: MC.degSum, say: `Do not add the exponents: the degree is the LARGEST exponent of any term.` },
    { v: cnt(p), mc: MC.degCount, say: `${cnt(p)} is the number of terms, not the degree.` },
    { v: Math.abs(lead.c.p), mc: MC.coefAsDeg, say: `That is a coefficient. The degree is the largest exponent.` },
    ...(a === 0 ? [{ v: 1, mc: MC.constDeg, say: `A nonzero constant has degree 0 (no ${X}).` }] : []),
  ];
  return numItem({ id: `polyDegree-${n}`, family: 'polyDegree', prompt: `What is the degree of ${polyHtml(p)}?`, board: polyTex(p), picture: shelfOf(p),
    solution: [a === 0 ? 'A nonzero constant has degree 0.' : `Degrees of the terms: ${p.map(deg).join(', ')}.`, `The largest is ${ans(a)}.`] },
    a, numCheck(a, `Yes: the highest power is ${a === 0 ? 'none (a constant)' : xp(a)}.`, slips, 'The degree is the largest exponent among the terms (check every term, not just the first).'));
});
export const degreeCh: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['zero', 'const', 'scr'] as const);
  const NONE = 'it has no degree';
  if (v === 'zero') {
    return choiceItem(R, { id: `degreeCh-${n}`, family: 'degreeCh', prompt: 'What is the degree of the polynomial 0?', board: '0',
      solution: ['Every term of 0 has coefficient 0, so no term counts: by convention the zero polynomial has no degree.'] }, [
      { t: NONE, ok: true, say: 'Yes: there is no term with a nonzero coefficient, so there is no degree (by convention).' },
      { t: '0', mc: MC.constDeg, say: 'A NONZERO constant like 5 has degree 0. The polynomial 0 has no nonzero term at all, so it has no degree.' },
      { t: '1', mc: MC.constDeg, say: `0 has no ${X} at all, so it cannot have degree 1.` },
    ]);
  }
  if (v === 'const') {
    const c = other(R, -12, 12, [0, 1, -1]);
    return choiceItem(R, { id: `degreeCh-${n}`, family: 'degreeCh', prompt: `What is the degree of the polynomial ${nH(c)}?`, board: String(c),
      solution: [`${nH(c)} = ${nH(c)}${X}<sup>0</sup>: a nonzero constant has degree 0.`] }, [
      { t: '0', ok: true, say: 'Yes: a nonzero constant has degree 0.' },
      { t: '1', mc: MC.constDeg, say: `There is no ${X} in ${nH(c)}: degree 0, not 1.` },
      { t: nH(c), mc: MC.constDeg, say: `The value ${nH(c)} is not its degree: no ${X}, so degree 0.` },
      { t: NONE, say: 'Only the polynomial 0 has no degree. A nonzero constant has degree 0.' },
    ]);
  }
  const ds = degs(R, 3, 0, 4);
  if (ds[0] === Math.max(...ds)) ds.push(ds.shift()!);
  const p = withDegs(R, ds), a = degree(p)!;
  const opts: Opt[] = [
    { t: String(a), ok: true, say: `Yes: the highest power is ${xp(a)}.` },
    { t: String(ds[0]), mc: MC.byPosition, say: 'The first written term is not the highest power here.' },
    { t: String(ds.reduce((s, d) => s + d, 0)), mc: MC.degSum, say: 'Do not add exponents: take the largest one.' },
    { t: '3', mc: MC.degCount, say: 'There are 3 terms, but the degree is the largest exponent.' },
  ];
  return choiceItem(R, { id: `degreeCh-${n}`, family: 'degreeCh', prompt: `What is the degree of ${polyHtml(p)}?`, board: polyTex(p), picture: shelfOf(p),
    solution: [`Exponents: ${ds.join(', ')}. The largest is ${a}.`] }, opts);
});

// ===================== names =====================
const TN = ['monomial', 'binomial', 'trinomial', 'polynomial (4 or more terms)'];
const tnOf = (k: number) => TN[Math.min(4, k) - 1]!;
export const termNameFam: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['mono', 'monoBig', 'bi', 'tri', 'four'] as const);
  let p: Poly;
  if (v === 'mono') p = [T(nz(R, -9, 9), int(R, 2, 3))];
  else if (v === 'monoBig') p = [T(pick(R, [1, -1, 2]), int(R, 4, 5))];
  else p = withDegs(R, degs(R, v === 'bi' ? 2 : v === 'tri' ? 3 : 4, 0, 5).sort((a, b) => b - a));
  if (Math.abs(p[0]!.c.p) === 1 && p.length === 1 && v === 'mono') p[0] = T(int(R, 2, 9), p[0]!.x);
  const k = cnt(p);
  return choiceItem(R, { id: `termName-${n}`, family: 'termName', prompt: `Name ${polyHtml(p)} by its number of terms.`, board: polyTex(p), picture: shelfOf(p, false),
    solution: [`Count the terms (the parts that are added): ${p.map(termHtml).join(', ')}, so ${k} ${k === 1 ? 'term' : 'terms'}.`, `1 term: monomial, 2: binomial, 3: trinomial, 4 or more: polynomial.`] },
    TN.map((t, i) => ({ t, ok: t === tnOf(k), mc: t !== tnOf(k) && k === 1 ? MC.miscount : undefined, say: t === tnOf(k) ? `Yes: ${k} ${k === 1 ? 'term' : 'terms'}.` : k === 1 ? `${termHtml(p[0]!)} is ONE term: a number times a power of ${X}. The factors inside one term do not count as terms.` : `Count again: ${p.map(termHtml).join(', ')} is ${k} terms.` })), { min: 4, keep: true });
});
const DN = ['constant', 'linear', 'quadratic', 'cubic'];
function namePoly(R: () => number): Poly {
  // degree and number of terms differ on purpose most of the time (x³ + 1 is a cubic binomial)
  const d = int(R, 0, 3);
  if (d === 0) return [T(other(R, -12, 12, [0]))];
  let k = int(R, 1, Math.min(3, d + 1));
  if (k === d + 1 && R() < 0.6) k = Math.max(1, k - 1);
  const rest = degs(R, k - 1, 0, d - 1).sort((a, b) => b - a);
  return withDegs(R, [d, ...rest]);
}
export const degreeName: Gen = (R, n) => {
  const p = namePoly(R), d = degree(p)!, k = cnt(p);
  return choiceItem(R, { id: `degreeName-${n}`, family: 'degreeName', prompt: `Name ${polyHtml(p)} by its degree.`, board: polyTex(p), picture: shelfOf(p, false),
    solution: [`Its degree is ${d} (the highest power).`, 'Degree 0: constant, 1: linear, 2: quadratic, 3: cubic.'] },
    DN.map((t, i) => ({ t, ok: i === d, mc: i !== d && i === k ? MC.degCount : undefined, say: i === d ? `Yes: degree ${d}.` : i === k ? `It has ${k} terms, but the name by degree uses the highest power: ${d}.` : `The highest power is ${d === 0 ? 'none (a constant)' : xp(d)}: degree ${d}.` })), { min: 4, keep: true });
};
export const fullName: Gen = (R, n) => retry(R, () => {
  const p = namePoly(R), d = degree(p)!, k = cnt(p);
  if (d === 0) throw new Reroll();
  const TW = ['', 'monomial', 'binomial', 'trinomial'];
  const nm = (dd: number, kk: number) => `${DN[dd]} ${TW[kk]}`;
  const opts: Opt[] = [{ t: nm(d, k), ok: true, say: `Yes: degree ${d} (${DN[d]}) and ${k} ${k === 1 ? 'term' : 'terms'} (${TW[k]}).` }];
  if (k !== d) opts.push({ t: nm(k, k), mc: MC.degCount, say: `${k} ${k === 1 ? 'term does' : 'terms do'} not make degree ${k}: the highest power is ${xp(d)}.` });
  if (d + 1 <= 3 && d + 1 !== k) opts.push({ t: nm(d, d + 1), mc: MC.degCount, say: `Count the terms: ${p.map(termHtml).join(', ')} is ${k}, whatever the degree.` });
  for (const dd of [1, 2, 3]) for (const kk of [1, 2, 3]) if (opts.length < 4 && !opts.some(o => o.t === nm(dd, kk))) opts.push({ t: nm(dd, kk), say: `Degree ${d} and ${k} ${k === 1 ? 'term' : 'terms'}: ${nm(d, k)}.` });
  return choiceItem(R, { id: `fullName-${n}`, family: 'fullName', prompt: `Give the full name of ${polyHtml(p)} (by degree, then by number of terms).`, board: polyTex(p), picture: shelfOf(p, false),
    solution: [`Degree ${d}: ${DN[d]}. ${k} ${k === 1 ? 'term' : 'terms'}: ${TW[k]}.`] }, opts, { min: 4 });
});

// ===================== standard-form =====================
function scrambled(R: () => number, k = int(R, 3, 4)): Poly {
  const ds = degs(R, k, 0, 4);
  if (ds[0] === Math.max(...ds)) ds.push(ds.shift()!);
  const p = withDegs(R, ds);
  if (R() < 0.45) { const i = p.findIndex(t => deg(t) === Math.max(...ds)); p[i] = { ...p[i]!, c: q(-Math.abs(p[i]!.c.p)) }; }
  return p;
}
export const stdForm: Gen = (R, n) => retry(R, () => {
  const p = scrambled(R), s = sortStd(p);
  // the slip: terms reordered, but each sign stays at its written POSITION
  const signs = p.map(t => t.c.p < 0);
  const detached = s.map((t, i) => ({ ...t, c: q((signs[i] ? -1 : 1) * Math.abs(t.c.p)) }));
  const asc = s.slice().reverse();
  const byCoef = p.slice().sort((a, b) => Math.abs(b.c.p) - Math.abs(a.c.p));
  return choiceItem(R, { id: `stdForm-${n}`, family: 'stdForm', prompt: `Which is ${polyHtml(p)} written in standard form?`, board: polyTex(p), picture: shelfOf(p),
    solution: ['Standard form: terms in order of descending degree, each term keeping its own sign.', `Degrees ${s.map(deg).join(', ')}: ${polyHtml(s)}.`] }, [
    { t: polyHtml(s), ok: true, say: 'Yes: descending powers, every term with its own sign.' },
    { t: polyHtml(detached), mc: MC.detached, say: 'The signs stayed where they were written. A sign travels WITH its term when terms move.' },
    { t: polyHtml(asc), say: 'Standard form goes from the highest power down, not up.' },
    { t: polyHtml(byCoef), say: 'Order by the power of x, not by the size of the coefficient.' },
  ]);
});
export const leadCoef: Gen = (R, n) => retry(R, () => {
  const p = scrambled(R, int(R, 2, 4));
  const s = sortStd(p), lead = s[0]!;
  if (R() < 0.25) { const i = p.indexOf(lead); p[i] = { ...lead, c: q(lead.c.p < 0 ? -1 : 1) }; }
  const L = sortStd(p)[0]!, a = L.c.p, first = p[0]!.c.p;
  return numItem({ id: `leadCoef-${n}`, family: 'leadCoef', prompt: `Write ${polyHtml(p)} in standard form. What is its leading coefficient?`, board: polyTex(p), picture: shelfOf(p),
    solution: [`Standard form: ${polyHtml(sortStd(p))}.`, `The leading term is ${termHtml(L)}, so the leading coefficient is ${ans(nH(a))}.`] },
    a, numCheck(a, `Yes: the leading term is ${termHtml(L)}.`, [
      { v: first, mc: MC.byPosition, say: `That is the coefficient of the first WRITTEN term. The leading term is the highest power: ${termHtml(L)}.` },
      { v: -a, mc: MC.detached, say: 'The minus sign belongs to the leading term: its coefficient is negative.' },
      { v: deg(L), mc: MC.expAsCoef, say: `${deg(L)} is the degree. The leading COEFFICIENT is the number in front of ${xp(deg(L))}.` },
    ], 'Find the term with the highest power; its signed number is the leading coefficient.'));
});

// ===================== multivariable-degree =====================
const mvT = (c: number, x: number, y: number): Term => T(c, x, y);
export const mvDegree: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['term', 'term', 'poly'] as const);
  if (v === 'term') {
    const x = int(R, 1, 4), y = int(R, 1, 4), c = pick(R, [1, 1, 2, 3, -4, 5, -1]);
    const t = mvT(c, x, y), a = x + y;
    const hidden = (x === 1 ? 0 : x) + (y === 1 ? 0 : y);
    return numItem({ id: `mvDegree-${n}`, family: 'mvDegree', prompt: `What is the degree of the term ${termHtml(t)}?`, board: termTex(t),
      solution: [`Add the exponents of all its variables: ${x} + ${y}.`, `Degree ${ans(a)}.`] },
      a, numCheck(a, `Yes: ${x} + ${y} = ${a}.`, [
        { v: x, mc: MC.mvFirst, say: `Count every variable: ${X} has exponent ${x} AND ${V_('y')} has exponent ${y}.` },
        { v: y, mc: MC.mvFirst, say: `Count every variable: ${x} for ${X} plus ${y} for ${V_('y')}.` },
        { v: hidden, mc: MC.expZero, say: 'An unwritten exponent is 1, and it counts.' },
        { v: Math.abs(c), mc: MC.coefAsDeg, say: 'The coefficient does not count toward the degree.' },
      ], 'The degree of a term with several variables is the SUM of their exponents.'));
  }
  const ts = [mvT(nz(R, -6, 6), int(R, 1, 3), int(R, 1, 2)), mvT(nz(R, -6, 6), int(R, 1, 2), int(R, 2, 4)), T(nz(R, -9, 9))];
  const ds = ts.map(deg);
  if (ds[0]! >= ds[1]! || new Set(ds).size < 3) throw new Reroll();
  const a = Math.max(...ds);
  return numItem({ id: `mvDegree-${n}`, family: 'mvDegree', prompt: `What is the degree of ${polyHtml(ts)}?`, board: polyTex(ts),
    solution: [`Degrees of the terms: ${ds.join(', ')} (add the exponents in each term).`, `The largest is ${ans(a)}.`] },
    a, numCheck(a, `Yes: the term ${termHtml(ts[1]!)} has degree ${a}.`, [
      { v: ds[0]!, mc: MC.byPosition, say: 'The first term is not the highest-degree term here.' },
      { v: ds.reduce((s, d) => s + d, 0), mc: MC.degSum, say: 'Add exponents WITHIN a term, then take the largest term degree; do not add across terms.' },
      { v: Math.max(...ts.flatMap(t => [t.x, t.y])), mc: MC.mvFirst, say: 'Add both exponents in a term: its degree counts every variable.' },
    ], 'Find each term\'s degree (sum of its exponents), then take the largest.'));
});
const V_ = (s: string) => `<i>${s}</i>`;
export const mvHigh: Gen = (R, n) => retry(R, () => {
  // four two-variable terms with different total degree; the one with the single biggest exponent is NOT the highest
  const ts = shuffle(R, [mvT(nz(R, -5, 9), 5, 1), mvT(nz(R, -5, 9), 3, 4), mvT(nz(R, -5, 9), 2, 2), mvT(nz(R, -5, 9), 1, 3)]);
  if (ts.some(t => Math.abs(t.c.p) === 1)) throw new Reroll();
  return choiceItem(R, { id: `mvHigh-${n}`, family: 'mvHigh', prompt: 'Which term has the highest degree?', board: ts.map(termTex).join(',\\quad '),
    solution: [`Degrees (sum of the exponents): ${ts.map(t => `${termHtml(t)}: ${deg(t)}`).join('; ')}.`] },
    ts.map(t => ({ t: termHtml(t), ok: deg(t) === 7, mc: deg(t) === 6 ? MC.mvFirst : undefined, say: deg(t) === 7 ? 'Yes: 3 + 4 = 7.' : deg(t) === 6 ? `Its ${X} exponent is the biggest single exponent, but 5 + 1 = 6 is less than 3 + 4 = 7.` : `Degree ${deg(t)}: add both exponents.` })), { min: 4 });
});
export { termNameFam as termName, collect };
