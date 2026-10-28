// fam2.ts: stage 2 families (operating): like terms, collecting, adding, the opposite, subtracting, and multiplying
// (monomials, monomial × polynomial, binomials, special products, multi-term products). Pure: no DOM.
import { int, pick, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import {
  type Poly, type Term, T, add, coefOf, collect, deg, degName, degree, equal, mul, mulT, neg, nH, parHtml, parTex, polyHtml, polyTex,
  q, qAdd, qHtml, qNum, sub, termHtml, termTex, xp,
} from './poly';
import { type Gen, type Opt, MC, Reroll, X, choiceItem, numCheck, numItem, nz, other, pairItem, polyChoice, retry } from './common';

const V = (s: string) => `<i>${s}</i>`;
const Y = V('y');
const cnt = (p: Poly) => p.length;
/** a factor in a product: a negative number in parentheses */
const pn = (v: number) => (v < 0 ? `(${nH(v)})` : nH(v));
function degs(R: () => number, n: number, lo: number, hi: number): number[] { return shuffle(R, Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, n); }
/** a coefficient: signed whole, or (rational case) a half / quarter written as a fraction or a decimal */
function coef(R: () => number, rational: boolean, lo = -9, hi = 9): { c: ReturnType<typeof q>; f?: Term['f'] } {
  if (!rational) return { c: q(nz(R, lo, hi)) };
  const d = pick(R, [2, 2, 4]), p = nz(R, -7, 7);
  return p % d === 0 ? { c: q(p) } : { c: q(p, d), f: R() < 0.5 ? 'dec' : undefined };
}
const tm = (R: () => number, d: number, rational = false): Term => { const k = coef(R, rational); return { c: k.c, x: d, y: 0, ...(k.f ? { f: k.f } : {}) }; };
const isRational = (R: () => number) => R() < 0.25;
/** one way of writing fractions per item: all decimals or all fractions */
function oneFmt(R: () => number, ps: Poly[]): Poly[] { const f = R() < 0.5 ? 'dec' as const : undefined; return ps.map(p => p.map(t => (t.c.q === 1 ? { c: t.c, x: t.x, y: t.y } : f ? { c: t.c, x: t.x, y: t.y, f } : { c: t.c, x: t.x, y: t.y }))); }
/** HTML of a value, decimal when it terminates nicely */
const vH = (v: number) => (Number.isInteger(v) ? nH(v) : nH(Math.round(v * 1000) / 1000));
const shelf = (rows: Poly[], o: { loose?: boolean; flipRow?: number; sum?: boolean; askD?: number[]; labels?: string[] } = {}) => ({ shelf: { rows, ...o } });
const boxPic = (a: Poly, b: Poly, extra: Partial<{ noteL: string; noteT: string; cells: 'none' | 'all' | 'ask'; ask: [number, number][] }> = {}) => ({ box: { a, b, cells: extra.cells ?? 'none', ...extra } });

// ===================== like-terms-powers =====================
export const likePick: Gen = (R, n) => retry(R, () => {
  const d = int(R, 1, 4), k = other(R, 2, 9, [d]), c2 = other(R, -9, 9, [0, k]);
  const target = T(k, d);
  const wrongD = shuffle(R, [0, 1, 2, 3, 4].filter(e => e !== d)).slice(0, 2);
  return choiceItem(R, { id: `likePick-${n}`, family: 'likePick', prompt: `Which term is a like term of ${termHtml(target)}?`, board: termTex(target),
    solution: [`Like terms have the same variable with the same exponent: here ${xp(d)}. The coefficient may be anything.`] }, [
    { t: termHtml(T(c2, d)), ok: true, say: `Yes: both are ${xp(d)} terms; the coefficients can differ.` },
    ...wrongD.map(e => ({ t: termHtml(T(k, e)), mc: MC.likeByLetter, say: e === 0 ? `${k} has no ${X} at all.` : `Same coefficient, but ${xp(e)} is not ${xp(d)}: the exponents must match.` })),
  ], { min: 3 });
});
export const likeCount: Gen = (R, n) => retry(R, () => {
  const d = int(R, 1, 3);
  const k = int(R, 2, 3);
  const like: Term[] = Array.from({ length: k }, () => T(nz(R, -9, 9), d));
  if (R() < 0.5) like[0] = T(q(pick(R, [1, -1, 3]), 2), d);
  const others: Term[] = shuffle(R, [0, 1, 2, 3, 4].filter(e => e !== d)).slice(0, 5 - k).map(e => T(nz(R, -9, 9), e));
  const all = shuffle(R, [...like, ...others]);
  const letter = all.filter(t => t.x > 0).length;
  return numItem({ id: `likeCount-${n}`, family: 'likeCount', prompt: `How many of these terms are like terms of ${xp(d)}? &nbsp; ${all.map(termHtml).join(', &nbsp;')}`, board: all.map(termTex).join(',\\ \\ '), unit: 'terms',
    solution: [`Like terms of ${xp(d)} have exactly ${xp(d)}: ${like.map(termHtml).join(', ')}.`, `That is ${ans(k)}.`] },
    k, numCheck(k, `Yes: ${like.map(termHtml).join(', ')}.`, [{ v: letter, mc: MC.likeByLetter, say: `Having an ${X} is not enough: the exponent must be exactly ${d === 1 ? '1' : d}.` }], `Look for terms whose power is exactly ${xp(d)}, whatever the coefficient.`));
});

// ===================== multivariable-like-terms =====================
const mv = (c: number, x: number, y: number, yx = false): Term => (yx ? { c: q(c), x, y, yx: true } : T(c, x, y));
export const mvLike: Gen = (R, n) => retry(R, () => {
  const a = int(R, 1, 2), b = int(R, 1, 2) + (a === 1 ? 1 : 0);   // x^a y^b with a ≠ b mostly
  if (a === b) throw new Reroll();
  const k = other(R, 2, 9, []);
  const target = mv(k, a, b);
  const ok = mv(other(R, -9, 9, [0, k]), a, b, R() < 0.5);
  return choiceItem(R, { id: `mvLike-${n}`, family: 'mvLike', prompt: `Which term is a like term of ${termHtml(target)}?`, board: termTex(target),
    solution: [`Like terms need the same pattern: ${X} to the ${a === 1 ? 'first' : 'power ' + a} and ${Y} to the ${b === 1 ? 'first' : 'power ' + b}. Order of letters does not matter (${X}${Y} = ${Y}${X}).`] }, [
    { t: termHtml(ok), ok: true, say: `Yes: the same powers of ${X} and of ${Y}${ok.yx ? ', just written in another order' : ''}.` },
    { t: termHtml(mv(k, b, a)), mc: MC.totalDegLike, say: `Same total degree (${a + b}), but the powers sit on different letters: the pattern must match.` },
    { t: termHtml(mv(k, a, 0)), mc: MC.likeByLetter, say: `${termHtml(mv(k, a, 0))} has no ${Y}: not the same pattern.` },
    { t: termHtml(mv(k, a + 1, b)), mc: MC.likeByLetter, say: `The power of ${X} differs.` },
  ], { min: 4 });
});
export const mvPair: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['yx', 'pairs'] as const);
  if (v === 'yx') {
    const a = other(R, 2, 9, []), b = other(R, -9, -2, []);
    return choiceItem(R, { id: `mvPair-${n}`, family: 'mvPair', prompt: `Are ${a}${X}${Y} and ${nH(b)}${Y}${X} like terms?`, board: `${a}xy,\\quad ${b}yx`,
      solution: [`${Y}${X} = ${X}${Y} (multiplication can be done in any order), so the variable parts match.`] }, [
      { t: `Yes: ${X}${Y} and ${Y}${X} are the same product`, ok: true, say: 'Yes: the order of the factors does not change the product.' },
      { t: 'No: the letters are in a different order', mc: MC.xyYx, say: `${Y}${X} and ${X}${Y} are the same product (multiplication is commutative).` },
      { t: 'No: the coefficients are different', mc: MC.likeByLetter, say: 'Coefficients never decide whether terms are like: only the variable part does.' },
    ]);
  }
  const a = other(R, 2, 6, []), b = other(R, 2, 6, [a]);
  return choiceItem(R, { id: `mvPair-${n}`, family: 'mvPair', prompt: 'Which pair are like terms?', board: '\\text{like terms?}',
    solution: ['Like terms have exactly the same variables with exactly the same exponents (letter order does not matter).'] }, [
    { t: `${a}${X}${Y}<sup>2</sup> and ${nH(-b)}${Y}<sup>2</sup>${X}`, ok: true, say: `Yes: both have ${X} once and ${Y} twice.` },
    { t: `${a}${xp(2)}&#8202;${Y} and ${a}${X}${Y}<sup>2</sup>`, mc: MC.totalDegLike, say: 'Both have degree 3, but the powers of x and y are swapped: not like terms.' },
    { t: `${a}${X}${Y} and ${a}${X}`, mc: MC.likeByLetter, say: `The second term has no ${Y}.` },
    { t: `${b}${xp(2)}&#8202;${Y}<sup>2</sup> and ${b}${X}${Y}`, mc: MC.likeByLetter, say: 'The same coefficient does not make terms like: the powers differ.' },
  ], { min: 4 });
});

// ===================== combine-like-terms-powers =====================
/** an uncollected polynomial: 2-3 powers, at least one power twice; sometimes a group cancels (even the leading one) */
function uncollected(R: () => number, rational: boolean, cancel = R() < 0.3): Poly {
  const ds = degs(R, int(R, 2, 3), 0, 4).sort((a, b) => b - a);
  const rep = pick(R, ds);
  const ts = ds.map(d => tm(R, d, rational));
  const i = ds.indexOf(rep);
  ts.push(cancel ? { ...ts[i]!, c: q(-ts[i]!.c.p, ts[i]!.c.q) } : tm(R, rep, rational));
  if (R() < 0.35) { const j = int(R, 0, ds.length - 1); ts.push(tm(R, ds[j]!, rational)); }
  const sh = oneFmt(R, [shuffle(R, ts)])[0]!;
  if (collect(sh).length === 0) throw new Reroll();
  return sh;
}
/** the slip: like terms combined, exponents added too (3x² + 5x² = 8x⁴) */
function addExpsSlip(p: Poly): Poly {
  const m = new Map<number, Term[]>();
  for (const t of p) m.set(t.x, [...(m.get(t.x) ?? []), t]);
  return [...m.entries()].map(([d, ts]) => ({ ...ts[0]!, c: ts.reduce((s, t) => qAdd(s, t.c), q(0)), x: ts.length > 1 && d > 0 ? d * ts.length : d }));
}
/** the slip: every x-term merged into one term of the highest power */
function unlikeSlip(p: Poly): Poly {
  const vs = p.filter(t => t.x > 0), cs = p.filter(t => t.x === 0);
  const out: Poly = [];
  if (vs.length) out.push({ ...vs[0]!, c: vs.reduce((s, t) => qAdd(s, t.c), q(0)), x: Math.max(...vs.map(t => t.x)) });
  if (cs.length) out.push({ ...cs[0]!, c: cs.reduce((s, t) => qAdd(s, t.c), q(0)) });
  return out.filter(t => t.c.p !== 0);
}
export const collectFam: Gen = (R, n) => retry(R, () => {
  const p = uncollected(R, isRational(R)), r = collect(p);
  const negs = p.map((t, i) => (i > 0 && t.c.p < 0 ? { ...t, c: q(-t.c.p, t.c.q) } : t));
  return polyChoice(R, { id: `collect-${n}`, family: 'collect', prompt: `Combine like terms and write the result in standard form: ${polyHtml(p)}`, board: polyTex(p), picture: shelf([p], { loose: true, sum: true }),
    solution: ['Sort the terms by power (like terms share a power), add the coefficients of each power, keep the exponent.', `Result: ${polyHtml(r)}.`] },
    { p: r, say: 'Yes: same power, add the coefficients; the exponent stays.' }, [
      { p: addExpsSlip(p), mc: MC.addExps, say: `When like terms are added the exponent stays the same: 3${xp(2)} + 5${xp(2)} = 8${xp(2)}, not 8${xp(4)}.` },
      { p: unlikeSlip(p), mc: MC.unlike, say: 'Only terms with the SAME power combine. Different powers stay separate terms.' },
      { p: negs, mc: MC.detached, say: 'A minus sign belongs to its term: subtract that coefficient.' },
    ]);
});
export const collectCoef: Gen = (R, n) => retry(R, () => {
  const rational = R() < 0.3;
  const p = uncollected(R, false).map(t => (rational && t.x > 0 && R() < 0.5 ? { ...t, c: q(t.c.p * 5 + pick(R, [1, -1, 3]), 2), f: 'dec' as const } : t));
  const reps = [...new Set(p.map(t => t.x))].filter(d => p.filter(t => t.x === d).length > 1);
  const d = pick(R, reps);
  const c = qNum(coefOf(p, d));
  const absSum = p.filter(t => t.x === d).reduce((s, t) => s + Math.abs(qNum(t.c)), 0);
  const allSum = p.filter(t => t.x > 0).reduce((s, t) => s + qNum(t.c), 0);
  const what = d === 0 ? 'the constant term' : `the coefficient of ${xp(d)}`;
  const group = p.filter(t => t.x === d);
  return numItem({ id: `collectCoef-${n}`, family: 'collectCoef', prompt: `Combine like terms in ${polyHtml(p)}. What is ${what}?`, board: polyTex(p), picture: shelf([p], { loose: true, sum: true, askD: [d] }),
    solution: [`The ${d === 0 ? 'constants' : xp(d) + ' terms'}: ${group.map(termHtml).join(', ')}.`, `Add their coefficients: ${ans(vH(c))}.`] },
    c, numCheck(c, `Yes: ${group.map(termHtml).join(' and ')} make ${vH(c)}${d === 0 ? '' : ' · ' + xp(d)}.`, [
      { v: absSum, mc: MC.detached, say: 'A minus sign belongs to its term: that coefficient is negative.' },
      ...(d > 0 ? [{ v: allSum, mc: MC.unlike, say: `Only the ${xp(d)} terms combine; other powers stay apart.` }] : []),
    ], 'Collect only the terms with that power, and add their signed coefficients.'));
});
export const collectName: Gen = (R, n) => retry(R, () => {
  // the written form looks bigger than the collected one: a group cancels or merges
  const p = uncollected(R, false, true), r = collect(p);
  const d = degree(r)!, k = cnt(r);
  const wd = Math.max(...p.map(deg)), wk = cnt(p);
  if (d > 3 || k > 3 || wd > 3 || (wd === d && Math.min(wk, 4) === k)) throw new Reroll();
  const TW = ['', 'monomial', 'binomial', 'trinomial', 'polynomial'];
  const nm = (dd: number, kk: number) => `${degName(dd)} ${TW[Math.min(4, kk)]}`;
  const opts: Opt[] = [
    { t: nm(d, k), ok: true, say: `Yes: after collecting, ${polyHtml(r)} has degree ${d} and ${k} ${k === 1 ? 'term' : 'terms'}.` },
    { t: nm(wd, wk), mc: MC.nameBefore, say: `Collect first: like terms combine${wd !== d ? ' (and the top power cancels)' : ''}. Name ${polyHtml(r)}, not the written form.` },
  ];
  if (d !== wd) opts.push({ t: nm(wd, k), mc: MC.nameBefore, say: `The ${xp(wd)} terms cancel, so the degree drops to ${d}.` });
  if (k !== wk) opts.push({ t: nm(d, wk), mc: MC.nameBefore, say: `After collecting there are ${k} terms, not ${wk}.` });
  for (const dd of [0, 1, 2, 3]) for (const kk of [1, 2, 3]) if (opts.length < 4 && !opts.some(o => o.t === nm(dd, kk))) opts.push({ t: nm(dd, kk), say: `Collect, then count: ${polyHtml(r)}.` });
  return choiceItem(R, { id: `collectName-${n}`, family: 'collectName', prompt: `Combine like terms in ${polyHtml(p)}, then name the result by degree and number of terms.`, board: polyTex(p), picture: shelf([p], { loose: true, sum: true }),
    solution: [`Collected: ${polyHtml(r)}.`, `Degree ${d}, ${k} ${k === 1 ? 'term' : 'terms'}: ${nm(d, k)}.`] }, opts, { min: 3 });
});

// ===================== add-polynomials =====================
function twoPolys(R: () => number, rational: boolean): [Poly, Poly] {
  const A = degs(R, int(R, 2, 3), 0, 3).sort((a, b) => b - a).map(d => tm(R, d, rational));
  const B = degs(R, int(R, 2, 3), 0, 3).map(d => tm(R, d, rational));          // B in a mixed order
  if (R() < 0.3) { const s = A.find(t => B.some(u => u.x === t.x)); if (s) { const i = B.findIndex(u => u.x === s.x); B[i] = { ...B[i]!, c: q(-s.c.p, s.c.q) }; } }
  if (!A.some(t => B.some(u => u.x === t.x)) || collect(add(A, B)).length === 0) throw new Reroll();
  return oneFmt(R, [A, B]) as [Poly, Poly];
}
/** the slip: terms added by their written position (A's first with B's first …), A's power kept */
function byPosition(A: Poly, B: Poly): Poly {
  const out: Poly = [];
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const a = A[i], b = B[i];
    if (a && b) out.push({ ...a, c: qAdd(a.c, b.c) }); else out.push((a ?? b)!);
  }
  return out;
}
export const addPoly: Gen = (R, n) => retry(R, () => {
  const [A, B] = twoPolys(R, isRational(R)), r = collect(add(A, B));
  if (equal(byPosition(A, B), r)) throw new Reroll();
  return polyChoice(R, { id: `addPoly-${n}`, family: 'addPoly', prompt: `Add: ${parHtml(A)} + ${parHtml(B)}`, board: `${parTex(A)} + ${parTex(B)}`, picture: shelf([A, B], { sum: true }),
    solution: ['After a + sign the parentheses just drop: all the terms are one collection.', 'Line up each power in its own column and add the coefficients.', `Sum: ${polyHtml(r)}.`] },
    { p: r, say: 'Yes: each power collected, standard form.' }, [
      { p: byPosition(A, B), mc: MC.position, say: 'Terms combine by their POWER, not by where they are written. Line up the powers first.' },
      { p: addExpsSlip(add(A, B)), mc: MC.addExps, say: 'Adding like terms keeps the exponent: only the coefficients add.' },
      { p: unlikeSlip(add(A, B)), mc: MC.unlike, say: 'Different powers do not combine.' },
    ]);
});
export const addVertical: Gen = (R, n) => retry(R, () => {
  const [A, B] = twoPolys(R, false);
  const both = A.filter(t => B.some(u => u.x === t.x)).map(t => t.x);
  const d = pick(R, both);
  const c = qNum(coefOf(add(A, B), d));
  const pos = qNum(coefOf(byPosition(A, B), d));
  return numItem({ id: `addVertical-${n}`, family: 'addVertical', prompt: `Add ${parHtml(A)} + ${parHtml(B)} in columns. What is ${d === 0 ? 'the constant term' : 'the coefficient of ' + xp(d)} of the sum?`, board: `${parTex(A)} + ${parTex(B)}`, picture: shelf([A, B], { sum: true, askD: [d] }),
    solution: [`The ${d === 0 ? 'constants' : xp(d) + ' terms'}: ${[...A, ...B].filter(t => t.x === d).map(termHtml).join(' and ')}.`, `Their coefficients add to ${ans(nH(c))}.`] },
    c, numCheck(c, 'Yes: the column of that power adds up to it.', [{ v: pos, mc: MC.position, say: 'Line the terms up by power, not by written position: put each term in its power\'s column.' }], 'Find that power in both polynomials (it may be written in a different place) and add the signed coefficients.'));
});

// ===================== opposite-of-polynomial =====================
function oppPoly(R: () => number): Poly {
  const ds = degs(R, int(R, 2, 3), 0, 3).sort((a, b) => b - a);
  const p = ds.map(d => T(nz(R, -9, 9), d));
  if (R() < 0.4) { const i = int(R, 0, p.length - 1); if (p[i]!.x > 0) p[i] = T(pick(R, [1, -1]), p[i]!.x); }
  return p;
}
const firstOnly = (p: Poly): Poly => p.map((t, i) => (i === 0 ? { ...t, c: q(-t.c.p, t.c.q) } : t));
export const opposite: Gen = (R, n) => retry(R, () => {
  const p = oppPoly(R);
  const allNeg = p.map(t => ({ ...t, c: q(-Math.abs(t.c.p), t.c.q) }));
  const keepConst = p.map(t => (t.x === 0 ? t : { ...t, c: q(-t.c.p, t.c.q) }));
  return polyChoice(R, { id: `opposite-${n}`, family: 'opposite', prompt: `What is the opposite of ${polyHtml(p)}? Write −(${polyHtml(p)}) without parentheses.`, board: `-(${polyTex(p)})`, picture: shelf([p], { flipRow: 0 }),
    solution: ['The opposite of a whole polynomial is −1 times ALL of it: every term changes sign.', `${polyHtml(neg(p))}.`] },
    { p: neg(p), say: 'Yes: every term flips its sign.' }, [
      { p: firstOnly(p), mc: MC.negFirst, say: 'The minus is in front of the whole group: it changes the sign of EVERY term, not just the first.' },
      { p: allNeg, say: 'The opposite flips each sign: a negative term becomes positive.' },
      { p: keepConst, mc: MC.negFirst, say: 'The constant is a term too: its sign flips as well.' },
    ], { std: false });
});
export const oppositeCoef: Gen = (R, n) => retry(R, () => {
  const p = oppPoly(R);
  const i = int(R, 1, p.length - 1), t = p[i]!, c = -qNum(t.c);
  const what = t.x === 0 ? 'the constant term' : `the coefficient of ${xp(t.x)}`;
  return numItem({ id: `oppositeCoef-${n}`, family: 'oppositeCoef', prompt: `Write −(${polyHtml(p)}) without parentheses. What is ${what}?`, board: `-(${polyTex(p)})`, picture: shelf([p], { flipRow: 0 }),
    solution: [`−1 times every term: −(${polyHtml(p)}) = ${polyHtml(neg(p))}.`, `${what[0]!.toUpperCase() + what.slice(1)}: ${ans(nH(c))}.`] },
    c, numCheck(c, `Yes: −1 · (${termHtml(t)}) = ${termHtml(neg([t])[0]!)}.`, [{ v: qNum(t.c), mc: MC.negFirst, say: 'The minus in front reaches EVERY term inside, not just the first one.' }], 'Multiply every term by −1: each sign flips.'));
});

// ===================== subtract-polynomials =====================
export const subPoly: Gen = (R, n) => retry(R, () => {
  const [A, B0] = twoPolys(R, isRational(R));
  const B = R() < 0.5 ? B0 : B0.map(t => ({ ...t, c: q(Math.abs(t.c.p), t.c.q) }));
  const r = collect(sub(A, B));
  if (r.length === 0) throw new Reroll();
  const onlyPos = add(A, B.map(t => (t.c.p > 0 ? { ...t, c: q(-t.c.p, t.c.q) } : t)));
  return polyChoice(R, { id: `subPoly-${n}`, family: 'subPoly', prompt: `Subtract: ${parHtml(A)} − ${parHtml(B)}`, board: `${parTex(A)} - ${parTex(B)}`, picture: shelf([A, B], { flipRow: 1, sum: true }),
    solution: [`Subtracting is adding the opposite: − ${parHtml(B)} = ${polyHtml(neg(B))} (every sign flips).`, 'Then add, power by power.', `Result: ${polyHtml(r)}.`] },
    { p: r, say: 'Yes: every term of the second polynomial flipped, then collected.' }, [
      { p: add(A, firstOnly(B)), mc: MC.negFirst, say: 'The minus reaches every term of the subtracted polynomial, not only its first term.' },
      { p: add(A, B), say: 'That is the sum. Subtracting means adding the OPPOSITE of the second polynomial.' },
      { p: onlyPos, say: 'Minus a negative term is plus: −(−4x) = +4x. Every sign flips.' },
    ]);
});
export const subCoef: Gen = (R, n) => retry(R, () => {
  const [A, B] = twoPolys(R, false);
  const cands = B.slice(1).map(t => t.x);
  const d = pick(R, cands);
  const c = qNum(coefOf(sub(A, B), d));
  const fo = qNum(coefOf(add(A, firstOnly(B)), d));
  return numItem({ id: `subCoef-${n}`, family: 'subCoef', prompt: `Subtract ${parHtml(A)} − ${parHtml(B)}. What is ${d === 0 ? 'the constant term' : 'the coefficient of ' + xp(d)} of the result?`, board: `${parTex(A)} - ${parTex(B)}`, picture: shelf([A, B], { flipRow: 1, sum: true, askD: [d] }),
    solution: [`Flip every sign of the second polynomial: ${polyHtml(neg(B))}.`, `In the ${d === 0 ? 'constant' : xp(d)} column: ${[...A, ...neg(B)].filter(t => t.x === d).map(termHtml).join(' and ')}, so ${ans(nH(c))}.`] },
    c, numCheck(c, 'Yes: the subtracted term flipped its sign before adding.', [
      { v: fo, mc: MC.negFirst, say: 'The minus reaches every term of the second polynomial, this one too.' },
      { v: qNum(coefOf(add(A, B), d)), say: 'That adds the second polynomial. Subtract: flip its signs first.' },
    ], 'Flip every sign of the subtracted polynomial, then add the coefficients of that power.'));
});

// ===================== multiply-monomials =====================
export const monoMul: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['int', 'int', 'xx', 'one', 'frac'] as const);
  let a: Term, b: Term;
  if (v === 'xx') { a = T(1, 1); b = T(pick(R, [1, 2, -3, 5]), 1); }
  else if (v === 'one') { a = T(pick(R, [1, -1]), int(R, 1, 2)); b = T(nz(R, -9, 9), int(R, 1, 2)); }
  else if (v === 'frac') { a = T(q(pick(R, [1, -1, 3]), pick(R, [2, 4])), int(R, 1, 2)); b = T(pick(R, [2, 4, 6, 8, -4]), int(R, 0, 2)); }
  else { const m = int(R, 1, 2), nn = other(R, 0, 2, [m]); a = T(nz(R, -9, 9), m); b = T(nz(R, -9, 9), nn); }
  if (deg(a) + deg(b) === 0) throw new Reroll();
  const right = mulT(a, b);
  const ex = { ...right, x: a.x * b.x };
  const ad = { ...right, c: qAdd(a.c, b.c) };
  const both = { ...ad, x: a.x * b.x };
  return polyChoice(R, { id: `monoMul-${n}`, family: 'monoMul', prompt: `Multiply: (${termHtml(a)})(${termHtml(b)})`, board: `(${termTex(a)})(${termTex(b)})`,
    solution: ['Multiply the coefficients; for the same base, ADD the exponents (count the factors of x).', `${qHtml(a.c)} · ${qHtml(b.c)} = ${qHtml(right.c)}, and ${xp(a.x)} · ${xp(b.x)} = ${xp(right.x)}.`] },
    { p: [right], say: `Yes: coefficients multiply, exponents add (${a.x} + ${b.x} = ${right.x}).` }, [
      { p: [ex], mc: MC.multExps, say: `${xp(a.x)} · ${xp(b.x)}: count the factors of ${X}: ${a.x} + ${b.x} = ${right.x}. Exponents add, they do not multiply.` },
      { p: [ad], mc: MC.addCoefs, say: 'The coefficients multiply (the terms are multiplied), they do not add.' },
      { p: [both], mc: MC.addCoefs, say: 'Multiply the coefficients and ADD the exponents.' },
      { p: [{ ...right, c: q(-right.c.p, right.c.q) }], say: 'Check the sign: like signs give +, unlike signs give −.' },
    ]);
});
export const monoMulPair: Gen = (R, n) => retry(R, () => {
  const m = int(R, 1, 2), nn = int(R, 1, 2);
  const a = T(nz(R, -9, 9), m), b = T(nz(R, -9, 9), nn);
  if (Math.abs(a.c.p) === 1 && Math.abs(b.c.p) === 1) throw new Reroll();
  const c = a.c.p * b.c.p, e = m + nn;
  return pairItem({ id: `monoMulPair-${n}`, family: 'monoMulPair', prompt: `(${termHtml(a)})(${termHtml(b)}) is one monomial. Type its coefficient and the exponent of ${X}.`, board: `(${termTex(a)})(${termTex(b)})`,
    pairLead: 'coefficient', pairOp: `exponent of ${X}`,
    solution: [`Coefficients: ${nH(a.c.p)} · ${pn(b.c.p)} = ${ans(nH(c))}.`, `Exponents add: ${m} + ${nn} = ${ans(e)}.`] },
    c, e, (u, w) => {
      if (u === c && w === e) return { ok: true, say: `Yes: ${termHtml(T(c, e))}.` };
      if (u === c && w === m * nn && m * nn !== e) return { ok: false, mc: MC.multExps, say: `Count the factors of ${X}: ${m} + ${nn}. Exponents add when you multiply powers of the same base.` };
      if (u === a.c.p + b.c.p && u !== c) return { ok: false, mc: MC.addCoefs, say: 'Multiply the coefficients, do not add them.' };
      if (u === -c && Math.sign(a.c.p) !== Math.sign(b.c.p)) return { ok: false, mc: MC.unlikePos, say: 'A positive times a negative is negative.' };
      if (u === -c) return { ok: false, say: 'Check the sign: like signs give a positive product.' };
      return { ok: false, say: 'Multiply the coefficients and add the exponents.' };
    });
});

// ===================== monomial-times-polynomial =====================
export const monoPoly: Gen = (R, n) => retry(R, () => {
  const rational = isRational(R);
  const k = int(R, 1, 2);
  const neg_ = R() < 0.5;
  const m: Term = rational ? T(q(neg_ ? -1 : 1, 2), k) : T((neg_ ? -1 : 1) * int(R, 2, 6), k);
  const P = degs(R, neg_ ? 3 : int(R, 2, 3), 0, 2).sort((a, b) => b - a).map(d => T(rational ? 2 * nz(R, -5, 5) : nz(R, -9, 9), d));
  if (!P.some(t => t.x === 0)) P.push(T(nz(R, -9, 9)));
  if (P.length > 3) P.splice(1, 1);
  const right = mul([m], P);
  const partial = [mulT(m, P[0]!), ...P.slice(1)];
  const negF = P.map((t, i) => { const pr = mulT(m, t); return i === 0 ? pr : { ...pr, c: q(Math.abs(pr.c.p) * Math.sign(t.c.p), pr.c.q) }; });
  const dropV = P.map(t => (t.x === 0 ? { ...mulT(m, t), x: 0 } : mulT(m, t)));
  return polyChoice(R, { id: `monoPoly-${n}`, family: 'monoPoly', prompt: `Multiply: ${rational ? `(${termHtml(m)})` : termHtml(m)}${parHtml(P)}`, board: `${termTex(m)}${parTex(P)}`, picture: boxPic([m], P),
    solution: [`${termHtml(m)} multiplies EVERY term: ${P.map(t => `(${termHtml(m)})(${termHtml(t)})`).join(' + ')}.`, `= ${polyHtml(collect(right))}.`] },
    { p: right, say: 'Yes: the monomial times every term.' }, [
      { p: partial, mc: MC.partial, say: `${termHtml(m)} multiplies every term inside the parentheses, not only the first.` },
      ...(neg_ ? [{ p: negF, mc: MC.negFirst, say: `The factor ${termHtml(m)} is negative for EVERY term it multiplies.` }] : []),
      { p: dropV, mc: MC.dropVar, say: `${termHtml(m)} times the constant still has the ${X}${k > 1 ? '<sup>' + k + '</sup>' : ''}: (${termHtml(m)})(${termHtml(P[P.length - 1]!)}) = ${termHtml(mulT(m, P[P.length - 1]!))}.` },
    ]);
});
export const monoPolyCoef: Gen = (R, n) => retry(R, () => {
  const k = int(R, 1, 2), m = T(nz(R, -6, 6) || 2, k);
  if (Math.abs(m.c.p) === 1) throw new Reroll();
  const P = [T(nz(R, -9, 9), 2), T(nz(R, -9, 9), 1), T(nz(R, -9, 9), 0)].slice(int(R, 0, 1));
  const t = pick(R, P.slice(1));
  const d = t.x + k, c = qNum(mulT(m, t).c);
  const partial = add([mulT(m, P[0]!)], P.slice(1));
  return numItem({ id: `monoPolyCoef-${n}`, family: 'monoPolyCoef', prompt: `Expand ${termHtml(m)}${parHtml(P)}. What is the coefficient of ${xp(d)}?`, board: `${termTex(m)}${parTex(P)}`, picture: boxPic([m], P),
    solution: [`The ${xp(d)} term comes from (${termHtml(m)})(${termHtml(t)}).`, `${nH(m.c.p)} · ${pn(t.c.p)} = ${ans(nH(c))}.`] },
    c, numCheck(c, `Yes: (${termHtml(m)})(${termHtml(t)}) = ${termHtml(mulT(m, t))}.`, [
      { v: qNum(coefOf(partial, d)), mc: MC.partial, say: `${termHtml(m)} multiplies every term inside, including ${termHtml(t)}.` },
      { v: -c, mc: Math.sign(m.c.p) !== Math.sign(t.c.p) ? MC.unlikePos : undefined, say: 'Check the sign of the product.' },
    ], 'Find the term inside that becomes this power after multiplying, and multiply the coefficients.'));
});

// ===================== binomial-times-binomial =====================
function binomials(R: () => number): [Poly, Poly] {
  const v = pick(R, ['monic', 'monic', 'nonmonic', 'quad'] as const);
  if (v === 'quad') return [[T(1, 2), T(nz(R, -6, 6))], [T(1, 1), T(nz(R, -9, 9))]];
  const a = v === 'nonmonic' ? int(R, 2, 3) : 1, c = v === 'nonmonic' && R() < 0.4 ? int(R, 2, 3) : 1;
  return [[T(a, 1), T(nz(R, -9, 9))], [T(c, 1), T(nz(R, -9, 9))]];
}
const firstsLasts = (A: Poly, B: Poly): Poly => [mulT(A[0]!, B[0]!), mulT(A[A.length - 1]!, B[B.length - 1]!)];
const posUnlike = (A: Poly, B: Poly): Poly => A.flatMap(s => B.map(t => { const p = mulT(s, t); return Math.sign(s.c.p) !== Math.sign(t.c.p) ? { ...p, c: q(Math.abs(p.c.p), p.c.q) } : p; }));
export const binBin: Gen = (R, n) => retry(R, () => {
  const [A, B] = binomials(R), r = collect(mul(A, B));
  if (r.length < 3) throw new Reroll();
  return polyChoice(R, { id: `binBin-${n}`, family: 'binBin', prompt: `Multiply and combine like terms: ${parHtml(A)}${parHtml(B)}`, board: `${parTex(A)}${parTex(B)}`, picture: boxPic(A, B),
    solution: ['Every term of the first factor times every term of the second: four partial products.', `${mul(A, B).map(termHtml).join(', ')}.`, `Collect like terms: ${polyHtml(r)}.`] },
    { p: r, say: 'Yes: all four partial products, then like terms collected.' }, [
      { p: firstsLasts(A, B), mc: MC.firstsLasts, say: 'Only two of the four partial products: the cross products (first × last, last × first) are missing.' },
      { p: posUnlike(A, B), mc: MC.unlikePos, say: 'A positive times a negative is negative: check the signs of the partial products.' },
      { p: [mulT(A[0]!, B[0]!), mulT(A[0]!, B[1]!), mulT(A[1]!, B[1]!)], say: 'One cross product is missing: there are four partial products.' },
    ]);
});
export const binBinCoef: Gen = (R, n) => retry(R, () => {
  const a = pick(R, [1, 1, 2, 3]), b = nz(R, -9, 9), d = nz(R, -9, 9), c = pick(R, [1, 1, 2]);
  const A = [T(a, 1), T(b)], B = [T(c, 1), T(d)];
  const mid = a * d + b * c, k = b * d, lead = a * c;
  if (mid === 0) throw new Reroll();
  const L = `${lead === 1 ? '' : lead}${xp(2)} +`;
  return pairItem({ id: `binBinCoef-${n}`, family: 'binBinCoef', prompt: `Expand ${parHtml(A)}${parHtml(B)} and fill in: ${L} □${X} + □`, board: `${parTex(A)}${parTex(B)}`, picture: boxPic(A, B),
    pairLead: L, pairOp: `${X} +`,
    solution: [`Partial products: ${mul(A, B).map(termHtml).join(', ')}.`, `The two ${X} terms: ${polyHtml([T(a * d, 1), T(b * c, 1)])} = ${termHtml(T(mid, 1))}, so the ${X} coefficient is ${ans(nH(mid))}; the constant: ${nH(b)} · ${pn(d)} = ${ans(nH(k))}.`] },
    mid, k, (u, w) => {
      if (u === mid && w === k) return { ok: true, say: `Yes: ${polyHtml(collect(mul(A, B)))}.` };
      if (u === 0 && w === k) return { ok: false, mc: MC.firstsLasts, say: `There are two cross products, ${termHtml(T(a * d, 1))} and ${termHtml(T(b * c, 1))}: they make the ${X} term.` };
      if ((u === Math.abs(a * d) + Math.abs(b * c) && u !== mid) || (w === Math.abs(k) && w !== k)) return { ok: false, mc: MC.unlikePos, say: 'A positive times a negative is negative: check each partial product\'s sign.' };
      if (u === a * d || u === b * c) return { ok: false, say: `Both cross products count: ${termHtml(T(a * d, 1))} and ${termHtml(T(b * c, 1))}.` };
      return { ok: false, say: 'Write all four partial products, then add the two x terms.' };
    });
});

// ===================== square-of-binomial =====================
export const squareBin: Gen = (R, n) => retry(R, () => {
  const a = pick(R, [1, 1, 1, 2, 3]), b = nz(R, -9, 9);
  const A = [T(a, 1), T(b)], r = collect(mul(A, A));
  return polyChoice(R, { id: `squareBin-${n}`, family: 'squareBin', prompt: `Expand ${parHtml(A)}<sup>2</sup>.`, board: `${parTex(A)}^{2}`, picture: boxPic(A, A),
    solution: [`A square is a product of two equal factors: ${parHtml(A)}${parHtml(A)}.`, `Partial products: ${mul(A, A).map(termHtml).join(', ')} (the middle two are equal).`, `= ${polyHtml(r)}.`] },
    { p: r, say: 'Yes: the two equal cross products make the middle term.' }, [
      { p: [T(a * a, 2), T(b * b)], mc: MC.fnSum, say: `Squaring a sum is not squaring each term: ${parHtml(A)}<sup>2</sup> = ${parHtml(A)}${parHtml(A)} has two cross products too.` },
      { p: [T(2 * a, 1), T(2 * b)], mc: MC.baseTimesExp, say: 'Squaring is not doubling: multiply the binomial by itself.' },
      { p: [T(a * a, 2), T(a * b, 1), T(b * b)], say: `There are TWO cross products, each ${termHtml(T(a * b, 1))}: together ${termHtml(T(2 * a * b, 1))}.` },
      { p: [T(a * a, 2), T(2 * a * b, 1), T(-b * b)], say: `${nH(b)} · ${nH(b)} is positive.` },
    ]);
});
export const squareMid: Gen = (R, n) => retry(R, () => {
  const a = pick(R, [1, 2, 3, 4]), b = nz(R, -9, 9);
  const A = [T(a, 1), T(b)], mid = 2 * a * b;
  const L = `${a * a === 1 ? '' : a * a}${xp(2)} +`;
  return numItem({ id: `squareMid-${n}`, family: 'squareMid', prompt: `${parHtml(A)}<sup>2</sup> = ${L} □${X} + ${b * b}. What is the missing coefficient?`, board: `${parTex(A)}^{2}`, picture: boxPic(A, A),
    solution: [`${parHtml(A)}<sup>2</sup> = ${parHtml(A)}${parHtml(A)}: the cross products are ${termHtml(T(a * b, 1))} and ${termHtml(T(a * b, 1))}.`, `Together: ${polyHtml([T(a * b, 1), T(a * b, 1)])} = ${termHtml(T(mid, 1))}, so the missing coefficient is ${ans(nH(mid))}.`] },
    mid, numCheck(mid, `Yes: two cross products of ${termHtml(T(a * b, 1))}.`, [
      { v: 0, mc: MC.fnSum, say: 'Squaring a sum gives cross products: write it as a product of two equal factors.' },
      { v: a * b, say: `There are two cross products of ${termHtml(T(a * b, 1))}, not one.` },
      { v: -mid, say: 'Check the sign of the cross products.' },
    ], 'Write the square as two equal factors and add the two cross products.'));
});

// ===================== sum-times-difference =====================
export const conj: Gen = (R, n) => retry(R, () => {
  const a = pick(R, [1, 1, 2, 3, 4]), b = int(R, 1, 9);
  if (a === b && a > 1) throw new Reroll();
  const A = [T(a, 1), T(b)], B = [T(a, 1), T(-b)];
  if (R() < 0.3) A.reverse();   // (b + ax)(ax − b): the same product, written another way
  const r = collect(mul(A, B));
  return polyChoice(R, { id: `conj-${n}`, family: 'conj', prompt: `Multiply: ${parHtml(A)}${parHtml(B)}`, board: `${parTex(A)}${parTex(B)}`, picture: boxPic(A, B),
    solution: [`Partial products: ${mul(A, B).map(termHtml).join(', ')}.`, `The cross products ${termHtml(T(a * b, 1))} and ${termHtml(T(-a * b, 1))} cancel: ${polyHtml(r)}.`] },
    { p: r, say: 'Yes: the cross products cancel, a difference of two squares.' }, [
      { p: [T(a * a, 2), T(b * b)], mc: MC.unlikePos, say: `${b} · (−${b}) is negative: the last term is −${b * b}.` },
      { p: [T(a * a, 2), T(-2 * a * b, 1), T(b * b)], mc: MC.conjSquare, say: `That is ${parHtml([T(a, 1), T(-b)])}<sup>2</sup>. Here the factors differ in one sign, so the cross products cancel.` },
      { p: [T(a * a, 2), T(-2 * a * b, 1), T(-b * b)], say: 'The two cross products have opposite signs, so they cancel to 0.' },
    ]);
});
export const conjMatch: Gen = (R, n) => retry(R, () => {
  const a = pick(R, [1, 1, 2, 3]), b = int(R, 2, 9);
  const P = [T(a * a, 2), T(-b * b)];
  const f = (s: number) => [T(a, 1), T(s * b)];
  return choiceItem(R, { id: `conjMatch-${n}`, family: 'conjMatch', prompt: `Which product equals ${polyHtml(P)}?`, board: polyTex(P),
    solution: [`${polyHtml(P)} has no ${X} term: the cross products must cancel, so the factors differ only in one sign.`, `${parHtml(f(1))}${parHtml(f(-1))} = ${polyHtml(P)}.`] }, [
    { t: `${parHtml(f(1))}${parHtml(f(-1))}`, ok: true, say: 'Yes: a sum times a difference; the cross products cancel.' },
    { t: `${parHtml(f(-1))}<sup>2</sup>`, mc: MC.conjSquare, say: `${parHtml(f(-1))}<sup>2</sup> = ${polyHtml(collect(mul(f(-1), f(-1))))}: it has a middle term and + ${b * b}.` },
    { t: `${parHtml(f(1))}<sup>2</sup>`, say: `${parHtml(f(1))}<sup>2</sup> = ${polyHtml(collect(mul(f(1), f(1))))}.` },
    { t: `${parHtml([T(a, 1), T(-b * b)])}${parHtml([T(a, 1), T(1)])}`, say: 'Multiply it out: it has an x term.' },
  ], { min: 4 });
});

// ===================== multi-term-products =====================
function bigFactors(R: () => number): [Poly, Poly] {
  const v = pick(R, ['bt', 'bt', 'quadbt', 'tt', 'sq'] as const);
  const tri = (): Poly => [T(1, 2), T(nz(R, -5, 5), 1), T(nz(R, -6, 6))];
  if (v === 'bt') return [[T(pick(R, [1, 1, 2]), 1), T(nz(R, -5, 5))], tri()];
  if (v === 'quadbt') return [R() < 0.5 ? [T(1, 2), T(nz(R, -4, 4))] : [T(1, 2), T(nz(R, -4, 4), 1)], tri()];
  if (v === 'sq') { const t = tri(); return [t, t.map(x => ({ ...x }))]; }
  return [tri(), tri()];
}
/** FOIL taken as the whole method: first × first, first × last, last × first, last × last */
const foil = (A: Poly, B: Poly): Poly => [mulT(A[0]!, B[0]!), mulT(A[0]!, B[B.length - 1]!), mulT(A[A.length - 1]!, B[0]!), mulT(A[A.length - 1]!, B[B.length - 1]!)];
export const multiTerm: Gen = (R, n) => retry(R, () => {
  const [A, B] = bigFactors(R), all = mul(A, B), r = collect(all);
  // the slip: one partial product filed under the neighbouring power
  const cells = all.map((t, i) => ({ t, i })).filter(({ t }) => t.x > 0 && t.x < 4);
  const s = pick(R, cells);
  const mism = all.map((t, i) => (i === s.i ? { ...t, x: t.x + 1 } : t));
  const sq = A.length === 3 && equal(A, B);
  return polyChoice(R, { id: `multiTerm-${n}`, family: 'multiTerm', prompt: `Multiply and combine like terms: ${sq ? parHtml(A) + '<sup>2</sup>' : parHtml(A) + parHtml(B)}`, board: sq ? `${parTex(A)}^{2}` : `${parTex(A)}${parTex(B)}`, picture: boxPic(A, B),
    solution: [`Every term times every term: ${A.length} × ${B.length} = ${A.length * B.length} partial products.`, `${all.map(termHtml).join(', ')}.`, `Collect by power: ${polyHtml(r)}.`] },
    { p: r, say: `Yes: all ${A.length * B.length} partial products, collected.` }, [
      { p: foil(A, B), mc: MC.foilRule, say: `FOIL only names the four products of two binomials. Here there are ${A.length * B.length} partial products: every term times every term.` },
      { p: mism, mc: MC.mismatch, say: `Collect by power: ${termHtml(s.t)} is an ${xp(s.t.x)} term; add it only to other ${xp(s.t.x)} terms.` },
      { p: mul([A[0]!], B), mc: MC.partial, say: `Every term of ${parHtml(A)} multiplies ${parHtml(B)}, not only the first.` },
    ]);
});
export const multiCoef: Gen = (R, n) => retry(R, () => {
  const [A, B] = bigFactors(R), all = mul(A, B);
  const counts = new Map<number, number>(); for (const t of all) counts.set(t.x, (counts.get(t.x) ?? 0) + 1);
  const d = pick(R, [...counts.entries()].filter(([, k]) => k >= 2).map(([d]) => d));
  const c = qNum(coefOf(all, d)), fc = qNum(coefOf(foil(A, B), d));
  const parts = all.filter(t => t.x === d);
  return numItem({ id: `multiCoef-${n}`, family: 'multiCoef', prompt: `Expand ${parHtml(A)}${parHtml(B)}. What is the coefficient of ${xp(d)}?`, board: `${parTex(A)}${parTex(B)}`, picture: boxPic(A, B),
    solution: [`The ${xp(d)} partial products: ${parts.map(termHtml).join(', ')}.`, `Their coefficients add to ${ans(nH(c))}.`] },
    c, numCheck(c, `Yes: ${polyHtml(parts)} = ${termHtml(T(c, d))}.`, [{ v: fc, mc: MC.foilRule, say: `FOIL's four products are not all of them: every term times every term gives ${parts.length} ${xp(d)} products.` }], `Find every partial product that is an ${xp(d)} term (they lie on one diagonal of the box) and add them.`));
});
export const cellCount: Gen = (R, n) => retry(R, () => {
  const [A, B] = bigFactors(R);
  const v = pick(R, ['cells', 'cells', 'terms'] as const);
  if (v === 'cells') {
    const a = A.length * B.length;
    return numItem({ id: `cellCount-${n}`, family: 'cellCount', prompt: `How many partial products are there in ${parHtml(A)}${parHtml(B)}, before collecting like terms?`, board: `${parTex(A)}${parTex(B)}`, unit: 'products', picture: boxPic(A, B),
      solution: [`Each of the ${A.length} terms of the first factor multiplies each of the ${B.length} terms of the second.`, `${A.length} × ${B.length} = ${ans(a)}.`] },
      a, numCheck(a, `Yes: ${A.length} × ${B.length} cells in the box.`, [{ v: 4, mc: MC.foilLimit, say: 'Four is only the binomial case. Every term times every term: count rows times columns.' }, { v: A.length + B.length, say: 'Each term of one factor pairs with EACH term of the other: multiply the counts.' }], 'Count the terms of each factor and multiply.'));
  }
  const r = collect(mul(A, B)), a = r.length;
  return numItem({ id: `cellCount-${n}`, family: 'cellCount', prompt: `Expand ${parHtml(A)}${parHtml(B)} and combine like terms. How many terms does the result have?`, board: `${parTex(A)}${parTex(B)}`, unit: 'terms', picture: boxPic(A, B),
    solution: [`${A.length * B.length} partial products, collected by power: ${polyHtml(r)}.`, `That is ${ans(a)} terms.`] },
    a, numCheck(a, `Yes: ${polyHtml(r)}.`, [{ v: A.length * B.length, say: 'Collect the like partial products first: products with the same power combine.' }], 'Expand every term times every term, then collect by power and count.'));
});
