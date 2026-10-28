// fam1.ts: stage 1 families: what an identity is (true for every value, some values, no value), two-variable
// terms, and the three special products derived from scratch: (a + b)², (a − b)², (a + b)(a − b). Pure: no DOM.
import { int, pick, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { type Ex, E, M, collect, coefP, degreeP, ex, exHtml, exTex, isIdentity, mul, nH, opp, plus, pow, subP, V, qH } from './idm';
import { type Gen, type Opt, type ExOpt, LETTERS, MC, Reroll, choiceItem, exChoice, numCheck, numItem, nz, other, retry } from './common';

const X = V('x');
/** a monomial as an expression: k, letters */
const mo = (k: number, vars = '') => E([M(k, vars)]);
/** a binomial u + k·v (k signed) in letters */
const bi = (u: string, k: number, v = '') => E([M(1, u), M(k, v)]);

// ===================== identity-meaning =====================
type Kind = 'all' | 'some' | 'none';
/** what kind of equation L = R is, decided from L − R (degree at most 2 in x) */
function kindOf(L: Ex, R: Ex): Kind {
  const D = collect(subP(ex(L), ex(R)));
  if (!D.length) return 'all';
  const d = degreeP(D)!;
  if (d === 0) return 'none';
  if (d === 1) return 'some';
  const a = coefP(D, 'x2'), b = coefP(D, 'x'), c = coefP(D, '');
  const disc = (b.p / b.q) ** 2 - 4 * (a.p / a.q) * (c.p / c.q);
  return disc >= 0 ? 'some' : 'none';
}
const KIND_TEXT: Record<Kind, string> = {
  all: `True for every value of ${X} (an identity)`,
  some: `True for some values of ${X} only`,
  none: `True for no value of ${X}`,
};
export const classify: Gen = (R, n) => retry(R, () => {
  const k = int(R, 2, 9), m = nz(R, -9, 9), m2 = other(R, -9, 9, [0, m]);
  const pool: { L: Ex; R: Ex; why: string; fn?: boolean }[] = [
    { L: mul(mo(k), bi('x', m)), R: E([M(k, 'x'), M(k * m)]), why: `${k} times each term gives ${exHtml(E([M(k, 'x'), M(k * m)]))}: the two sides are the same expression.` },
    { L: pow(bi('x', m), 2), R: E([M(1, 'x2'), M(2 * m, 'x'), M(m * m)]), why: `(${exHtml(bi('x', m))})(${exHtml(bi('x', m))}) expands to exactly the right side.` },
    { L: mul(bi('x', Math.abs(m)), bi('x', -Math.abs(m))), R: E([M(1, 'x2'), M(-m * m)]), why: 'The cross terms cancel, so the left side expands to exactly the right side.' },
    { L: E([M(1, 'x2')]), R: E([M(k, 'x')]), why: `${V('x')}<sup>2</sup> − ${k}${X} = ${X}(${X} − ${k}) is 0 only at ${X} = 0 and ${X} = ${k}.` },
    { L: pow(bi('x', m), 2), R: E([M(1, 'x2'), M(m * m)]), why: `Expanding gives ${V('x')}<sup>2</sup> + ${nH(2 * m)}${X} + ${m * m}, so the sides match only when ${nH(2 * m)}${X} = 0: only at ${X} = 0.`.replace('+ −', '− '), fn: true },
    { L: E([M(2, 'x'), M(m)]), R: E([M(1, 'x'), M(m2)]), why: `Take ${X} from both sides: ${X} = ${nH(m2 - m)}. One value only.` },
    { L: E([M(1, 'x'), M(m)]), R: E([M(1, 'x'), M(m2)]), why: `The ${X} terms match, but ${nH(m)} ≠ ${nH(m2)}: no value of ${X} makes them equal.` },
    { L: pow(bi('x', m), 2), R: E([M(1, 'x2'), M(2 * m, 'x'), M(m * m + k)]), why: `The left side expands to ${V('x')}<sup>2</sup> + … + ${m * m}; the right side ends in ${m * m + k}. They always differ by ${k}.` },
    { L: plus(E([M(1, 'x2')]), mo(k)), R: mo(0), why: `${V('x')}<sup>2</sup> is never negative, so ${V('x')}<sup>2</sup> + ${k} is at least ${k}: never 0.` },
  ];
  const c = pick(R, pool);
  const kind = kindOf(c.L, c.R);
  const opts: Opt[] = (['all', 'some', 'none'] as Kind[]).map(kk => kk === kind
    ? { t: KIND_TEXT[kk], ok: true, say: `Right. ${c.why}` }
    : kk === 'some' && kind === 'all' ? { t: KIND_TEXT[kk], mc: MC.conditional, say: `An identity does not pick out special values: ${c.why}` }
      : kk === 'all' && kind === 'some' ? { t: KIND_TEXT[kk], mc: c.fn ? MC.fnSum : MC.examples, say: `A value or two that works is not every value. ${c.why}` }
        : { t: KIND_TEXT[kk], say: c.why });
  return choiceItem(R, { id: `classify-${n}`, family: 'classify', prompt: `Is this equation true for every real value of ${X}, for some values only, or for no value?`, board: `${exTex(c.L)} = ${exTex(c.R)}`,
    solution: ['Rewrite both sides (or move everything to one side) and see what is left.', c.why] }, opts, { keep: true });
});
export const identityPick: Gen = (R, n) => retry(R, () => {
  const [a, b] = pick(R, LETTERS);
  const k = int(R, 1, 4), j = int(R, 2, 5);
  const A = (s: string) => s.replace(/a/g, a).replace(/b/g, b);
  const kb = (sg: number) => E([M(1, a), M(sg * k, b)]);
  // one left side; the right sides: the true expansion and the typical slips (each checked: only one is an identity)
  const v = pick(R, ['sum', 'dif', 'conj', 'mono', 'rev'] as const);
  let L: Ex, rights: Ex[], wrongs: { e: Ex; mc?: string; why: string }[];
  if (v === 'sum' || v === 'dif') {
    const sg = v === 'sum' ? 1 : -1;
    L = pow(kb(sg), 2); rights = [E([M(1, `${a}2`), M(2 * sg * k, a + b), M(k * k, `${b}2`)])];
    wrongs = [{ e: E([M(1, `${a}2`), M(sg * k * k, `${b}2`)]), mc: MC.fnSum, why: `it misses the middle term ${sg > 0 ? '' : '−'}${2 * k}${V(a)}${V(b)}` },
      { e: E([M(1, `${a}2`), M(2 * sg * k, a + b), M(-k * k, `${b}2`)]), mc: MC.minusSpreads, why: `the last term is (${sg > 0 ? '' : '−'}${k === 1 ? '' : k}${V(b)})<sup>2</sup>, which is positive` },
      { e: E([M(1, `${a}2`), M(sg * k, a + b), M(k * k, `${b}2`)]), why: 'there are two cross products, not one' },
      { e: E([M(1, `${a}2`), M(-2 * sg * k, a + b), M(k * k, `${b}2`)]), why: 'the middle term has the sign between the two terms' }];
  } else if (v === 'conj') {
    L = mul(kb(1), kb(-1)); rights = [E([M(1, `${a}2`), M(-k * k, `${b}2`)])];
    wrongs = [{ e: E([M(1, `${a}2`), M(-2 * k, a + b), M(k * k, `${b}2`)]), mc: MC.conjSquare, why: 'a sum times a difference is not a square' },
      { e: E([M(1, `${a}2`), M(-2 * k, a + b), M(-k * k, `${b}2`)]), mc: MC.conjCross, why: 'the two cross terms cancel' },
      { e: E([M(1, `${a}2`), M(k * k, `${b}2`)]), why: 'the last product is a positive times a negative' }];
  } else if (v === 'mono') {
    L = pow(E([M(j, a + b)]), 2); rights = [E([M(j * j, `${a}2${b}2`)])];
    wrongs = [{ e: E([M(j, `${a}2${b}2`)]), mc: MC.powOne, why: `the ${j} is squared too` },
      { e: E([M(j * j, a + b)]), mc: MC.powOne, why: 'each letter is squared too' },
      { e: E([M(2 * j, `${a}2${b}2`)]), why: `squaring is times itself: ${j} · ${j}` }];
  } else {
    L = pow(E(A('a - b')), 2); rights = [pow(E(A('b - a')), 2), E(A('a2 - 2ab + b2'))];
    wrongs = [{ e: E(A('a2 - b2')), mc: MC.fnSum, why: 'a square of a difference is not a difference of squares' },
      { e: opp(pow(E(A('b - a')), 2)), why: 'a square is never negative, so the sign cannot flip' },
      { e: E(A('b2 - a2')), mc: MC.fnSum, why: 'a square of a difference is not a difference of squares' }];
  }
  const right = pick(R, rights);
  if (!isIdentity(L, right)) throw new Error('identityPick: not an identity');
  const eq = (Rr: Ex) => `${exHtml(L)} = ${exHtml(Rr)}`;
  const opts = [{ t: eq(right), ok: true, say: 'Yes: both sides expand to the same polynomial, so it holds for every value.' },
    ...wrongs.filter(w => !isIdentity(L, w.e)).slice(0, 3).map(w => ({ t: eq(w.e), mc: w.mc, say: `Not for every value: ${w.why}.` }))];
  return choiceItem(R, { id: `identityPick-${n}`, family: 'identityPick', prompt: `Which equation is an identity: true for every real ${V(a)} and ${V(b)}?`, board: `${exTex(L)} = \\,?`,
    solution: ['An identity holds for every value. Expand the left side and compare.', `${exHtml(L)} expands to ${exHtml(E(ex(L)))}.`] }, opts);
});

// ===================== two-variable-terms =====================
export const monoProd: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['xy', 'ab', 'pow', 'mixed'] as const);
  if (v === 'pow') {
    const k = int(R, 2, 6), [u, w] = pick(R, [['x', 'y'], ['a', 'b']] as const);
    const L = pow(mo(k, u + w), 2);
    return exChoice(R, { id: `monoProd-${n}`, family: 'monoProd', prompt: 'Multiply out. Which is equal?', board: exTex(L),
      solution: [`Square every factor: ${k}<sup>2</sup> = ${k * k}, ${V(u)}<sup>2</sup>, ${V(w)}<sup>2</sup>.`] },
    { e: E([M(k * k, `${u}2${w}2`)]), say: `Yes: (${k}${V(u)}${V(w)})(${k}${V(u)}${V(w)}) = ${k * k}${V(u)}<sup>2</sup>&#8202;${V(w)}<sup>2</sup>.` },
    [{ e: E([M(k, `${u}2${w}2`)]), mc: MC.powOne, say: `The ${k} is a factor too: it is squared as well, ${k} · ${k} = ${k * k}.` },
      { e: E([M(k * k, `${u}${w}`)]), mc: MC.powOne, say: `Each letter is a factor too: ${V(u)} · ${V(u)} = ${V(u)}<sup>2</sup>.` },
      { e: E([M(2 * k, `${u}2${w}2`)]), mc: MC.baseTimesExp, say: `Squaring means times itself: ${k} · ${k}, not ${k} · 2.` }]);
  }
  if (v === 'mixed') {
    const k = nz(R, -5, 5), j = nz(R, -5, 5), [p1, q1, p2, q2] = [int(R, 1, 3), int(R, 1, 2), int(R, 1, 2), int(R, 2, 3)];
    if (Math.abs(k) === 1 || Math.abs(j) === 1) throw new Reroll();
    const L = mul(mo(k, `a${p1}b${q1}`), mo(j, `a${p2}b${q2}`));
    return exChoice(R, { id: `monoProd-${n}`, family: 'monoProd', prompt: 'Multiply the two terms. Which is the product?', board: exTex(L),
      solution: [`Multiply the numbers: ${nH(k)} · ${nH(j)} = ${nH(k * j)}. Add the exponents of each letter: ${V('a')}<sup>${p1 + p2}</sup>, ${V('b')}<sup>${q1 + q2}</sup>.`] },
    { e: E([M(k * j, `a${p1 + p2}b${q1 + q2}`)]), say: 'Yes: numbers multiply, and each letter adds its exponents.' },
    [{ e: E([M(k * j, `a${p1 * p2}b${q1 * q2}`)]), mc: MC.multExps, say: `Same base: add the exponents (${V('a')}<sup>${p1}</sup> · ${V('a')}<sup>${p2}</sup> = ${V('a')}<sup>${p1 + p2}</sup>), do not multiply them.` },
      { e: E([M(-k * j, `a${p1 + p2}b${q1 + q2}`)]), mc: k * j < 0 ? MC.unlikePos : undefined, say: `Check the sign: ${nH(k)} · ${nH(j)} = ${nH(k * j)}.` },
      { e: E([M(k + j || 7, `a${p1 + p2}b${q1 + q2}`)]), say: `The numbers multiply: ${nH(k)} · ${nH(j)} = ${nH(k * j)}.` }]);
  }
  const [u, w] = v === 'xy' ? ['x', 'y'] : ['a', 'b'];
  const k = nz(R, -6, 6), j = nz(R, -6, 6);
  if (Math.abs(k) === 1 || Math.abs(j) === 1 || k > 0 && j > 0) throw new Reroll();
  const L = mul(mo(k, u), mo(j, w));
  return exChoice(R, { id: `monoProd-${n}`, family: 'monoProd', prompt: 'Multiply. Which is the product?', board: exTex(L),
    solution: [`The numbers: ${nH(k)} · ${nH(j)} = ${nH(k * j)}. The letters: ${V(u)} · ${V(w)} = ${V(u)}${V(w)}.`] },
  { e: E([M(k * j, u + w)]), say: `Yes: ${nH(k * j)}${V(u)}${V(w)}.` },
  [{ e: E([M(-k * j, u + w)]), mc: MC.unlikePos, say: `Signs: ${nH(k)} times ${nH(j)} is ${nH(k * j)}.` },
    { e: E([M(k + j || 9, u + w)]), say: `Multiply the numbers, do not add them: ${nH(k)} · ${nH(j)} = ${nH(k * j)}.` },
    { e: E([M(k, u), M(j, w)]), mc: MC.unlike, say: 'A product is one term: the numbers multiply and the letters sit side by side.' }]);
});
export const collect2: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['abba', 'abba', 'xy2'] as const);
  if (v === 'abba') {
    const [a, b] = pick(R, LETTERS);
    const k1 = nz(R, -8, 9), k2 = nz(R, -8, 9), k3 = nz(R, -6, 6);
    if (k1 + k2 === 0 || Math.abs(k2) === 1) throw new Reroll();
    // written: k1·ab, k2·ba (letters reversed), k3·a²
    const t = (k: number, s: string, first: boolean) => `${first ? (k < 0 ? '−' : '') : k < 0 ? ' − ' : ' + '}${Math.abs(k) === 1 ? '' : Math.abs(k)}${s}`;
    const tt = (k: number, s: string, first: boolean) => `${first ? (k < 0 ? '-' : '') : k < 0 ? ' - ' : ' + '}${Math.abs(k) === 1 ? '' : Math.abs(k)}${s}`;
    const ordr = pick(R, [0, 1]);
    const terms = ordr ? [[k1, `${V(a)}${V(b)}`, `${a}${b}`], [k3, `${V(a)}<sup>2</sup>`, `${a}^{2}`], [k2, `${V(b)}${V(a)}`, `${b}${a}`]] as const : [[k1, `${V(a)}${V(b)}`, `${a}${b}`], [k2, `${V(b)}${V(a)}`, `${b}${a}`], [k3, `${V(a)}<sup>2</sup>`, `${a}^{2}`]] as const;
    const html = terms.map((x, i) => t(x[0], x[1], i === 0)).join(''), texs = terms.map((x, i) => tt(x[0], x[2], i === 0)).join('');
    return numItem({ id: `collect2-${n}`, family: 'collect2', prompt: `Collect like terms in ${html}. What is the coefficient of ${V(a)}${V(b)}?`, board: texs,
      solution: [`${V(b)}${V(a)} and ${V(a)}${V(b)} are the same term (${V(a)} · ${V(b)} = ${V(b)} · ${V(a)}), so they are like terms.`, `${nH(k1)} + ${k2 < 0 ? '(' + nH(k2) + ')' : k2} = ${ans(nH(k1 + k2))}.`] }, k1 + k2,
    numCheck(k1 + k2, `Yes: ${nH(k1 + k2)}${V(a)}${V(b)}${k3 < 0 ? ' − ' : ' + '}${Math.abs(k3) === 1 ? '' : Math.abs(k3)}${V(a)}<sup>2</sup>.`,
      [{ v: k1, mc: MC.xyYx, say: `${V(b)}${V(a)} is the same term as ${V(a)}${V(b)}: multiplication does not care about order. Add it in.` },
        { v: k1 + k2 + k3, mc: MC.unlike, say: `${V(a)}<sup>2</sup> is not like ${V(a)}${V(b)}: its letters are different.` }],
      `Add the coefficients of ${V(a)}${V(b)} and ${V(b)}${V(a)}.`));
  }
  // x²y and xy²: the same total degree, but not like terms
  const k1 = nz(R, -7, 7), k2 = nz(R, -7, 7), k3 = nz(R, -7, 7);
  if (k1 + k3 === 0 || k2 === k1 || Math.abs(k3) === 1 || k1 + k2 + k3 === k1 + k3) throw new Reroll();
  const P0 = [M(k1, 'x2y'), M(k2, 'xy2'), M(k3, 'x2y')];
  const L = E(P0);
  return numItem({ id: `collect2-${n}`, family: 'collect2', prompt: `Collect like terms in ${exHtml(L)}. What is the coefficient of ${V('x')}<sup>2</sup>&#8202;${V('y')}?`, board: exTex(L),
    solution: [`Like terms have each letter to the same power. ${V('x')}<sup>2</sup>&#8202;${V('y')} and ${V('x')}${V('y')}<sup>2</sup> are not like terms, even though both have degree 3.`, `${nH(k1)} + ${k3 < 0 ? '(' + nH(k3) + ')' : k3} = ${ans(nH(k1 + k3))}.`] }, k1 + k3,
  numCheck(k1 + k3, `Yes: ${exHtml(E(collect(P0)))}.`,
    [{ v: k1 + k2 + k3, mc: MC.totalDegLike, say: `${V('x')}${V('y')}<sup>2</sup> has the same degree, but its powers are swapped: not a like term.` },
      { v: k1, say: `There are two ${V('x')}<sup>2</sup>&#8202;${V('y')} terms: add both.` }],
    `Add only the terms with ${V('x')}<sup>2</sup> and ${V('y')}<sup>1</sup>.`));
});
export const likeTwo: Gen = (R, n) => retry(R, () => {
  const k = nz(R, -6, 6), j = nz(R, -9, 9);
  const sg = (c: number) => (c < 0 ? '−' : '') + (Math.abs(c) === 1 ? '' : Math.abs(c));
  const x = V('x'), y = V('y');
  const v = pick(R, [0, 1]);
  const target = v ? `${sg(k)}${x}<sup>2</sup>&#8202;${y}` : `${sg(k)}${x}${y}<sup>3</sup>`;
  const tex = v ? `${sg(k).replace('−', '-')}x^{2}y` : `${sg(k).replace('−', '-')}xy^{3}`;
  const right = v ? `${sg(j)}${y}${x}<sup>2</sup>` : `${sg(j)}${y}<sup>3</sup>&#8202;${x}`;
  const wr: Opt[] = v
    ? [{ t: `${sg(j)}${x}${y}<sup>2</sup>`, mc: MC.totalDegLike, say: 'Same degree, but the powers are swapped: x once and y twice. Not like.' },
      { t: `${sg(j)}${x}<sup>2</sup>&#8202;${y}<sup>2</sup>`, say: `The ${y} has a different power. Not like.` },
      { t: `${sg(j)}${x}<sup>2</sup>`, say: `There is no ${y} in it. Not like.` }]
    : [{ t: `${sg(j)}${x}<sup>3</sup>&#8202;${y}`, mc: MC.totalDegLike, say: 'Same degree, but the powers are swapped. Not like.' },
      { t: `${sg(j)}${x}<sup>2</sup>&#8202;${y}<sup>2</sup>`, mc: MC.totalDegLike, say: 'Degree 4 again, but each letter has a different power. Not like.' },
      { t: `${sg(j)}${x}${y}`, say: `${y} has a different power. Not like.` }];
  return choiceItem(R, { id: `likeTwo-${n}`, family: 'likeTwo', prompt: `Which term is a like term of ${target}?`, board: tex,
    solution: ['Like terms have each letter to the same power; the order of the letters does not matter.', `${right} has the same letters to the same powers.`] },
  [{ t: right, ok: true, say: 'Yes: the letters are written in another order, but the powers match. A like term.' }, ...wr]);
});

// ===================== square-of-sum-structure =====================
const PLACES = ['patio', 'garden bed', 'courtyard', 'deck'] as const;
export const sumSquareNum: Gen = (R, n) => retry(R, () => {
  const p = pick(R, [10, 20, 30, 40]), q = int(R, 1, 9), place = pick(R, PLACES), s = p + q;
  const v = pick(R, ['strips', 'total', 'total']);
  const pic = { area: { a: String(p), b: String(q), cells: [String(p * p), String(p * q), String(p * q), String(q * q)] as [string, string, string, string], share: q / s, ask: v === 'strips' ? [1, 2] : [0, 1, 2, 3] } };
  const lead = `A square ${place} is ${s} ft on each side. Cut each side into ${p} ft and ${q} ft, as in the picture.`;
  if (v === 'strips') {
    return numItem({ id: `sumSquareNum-${n}`, family: 'sumSquareNum', prompt: `${lead} What is the total area of the two rectangles?`, board: `(${p} + ${q})^{2}`, unit: 'sq ft', picture: pic,
      solution: [`Each rectangle is ${p} ft by ${q} ft: ${p * q} sq ft.`, `Two of them: 2 · ${p * q} = ${ans(2 * p * q)} sq ft.`] }, 2 * p * q,
    numCheck(2 * p * q, `Yes: two ${p} by ${q} rectangles, ${2 * p * q} sq ft. That is the 2ab of (a + b)².`,
      [{ v: p * q, say: 'That is one rectangle. There are two of them, one along each side.' },
        { v: 2 * (p + q), say: 'That is a perimeter-style sum. Area is length times width.' }],
      `Each rectangle is ${p} ft by ${q} ft.`));
  }
  return numItem({ id: `sumSquareNum-${n}`, family: 'sumSquareNum', prompt: `${lead} Add the four pieces: what is the area of the whole ${place}?`, board: `(${p} + ${q})^{2}`, unit: 'sq ft', picture: pic,
    solution: [`The pieces: ${p} · ${p} = ${p * p}, two strips of ${p} · ${q} = ${p * q}, and ${q} · ${q} = ${q * q}.`, `${p * p} + ${p * q} + ${p * q} + ${q * q} = ${ans(s * s)} sq ft.`] }, s * s,
  numCheck(s * s, `Yes: ${p * p} + ${2 * p * q} + ${q * q} = ${s * s} sq ft, and ${s}<sup>2</sup> is ${s * s} too.`,
    [{ v: p * p + q * q, mc: MC.fnSum, say: `${p}<sup>2</sup> + ${q}<sup>2</sup> leaves out the two ${p} by ${q} strips.` },
      { v: p * p + p * q + q * q, say: `There are two ${p} by ${q} strips, not one.` },
      { v: p * p + (2 * p + q) + q * q, mc: MC.mid2aPlusB, say: `The middle part is 2 · ${p} · ${q}, a product, not 2 · ${p} + ${q}.` }],
    'Add all four pieces of the square.'));
});
export const sumSquareSym: Gen = (R, n) => retry(R, () => {
  const [a, b] = pick(R, LETTERS);
  const v = pick(R, ['expand', 'expand', 'why']);
  const pic = { area: { a, b, cells: [`${a}^{2}`, `${a}${b}`, `${b}${a}`, `${b}^{2}`] as [string, string, string, string], share: 0.33, ask: v === 'why' ? [] : [0, 1, 2, 3] } };
  const A = (s: string) => s.replace(/a/g, a).replace(/b/g, b);
  if (v === 'why') {
    return choiceItem(R, { id: `sumSquareSym-${n}`, family: 'sumSquareSym', prompt: `(${V(a)} + ${V(b)})<sup>2</sup> = ${V(a)}<sup>2</sup> + 2${V(a)}${V(b)} + ${V(b)}<sup>2</sup>. Where does the 2${V(a)}${V(b)} come from?`, board: `(${a} + ${b})^{2} = ${a}^{2} + 2${a}${b} + ${b}^{2}`, picture: pic,
      solution: [`(${V(a)} + ${V(b)})(${V(a)} + ${V(b)}) = ${V(a)}<sup>2</sup> + ${V(a)}${V(b)} + ${V(b)}${V(a)} + ${V(b)}<sup>2</sup>.`, `${V(a)}${V(b)} and ${V(b)}${V(a)} are like terms: two equal cross products make 2${V(a)}${V(b)}.`] }, [
      { t: `Two cross products, ${V(a)} · ${V(b)} and ${V(b)} · ${V(a)}, which are like terms`, ok: true, say: 'Yes: the two strips of the square, each a by b.' },
      { t: `Squaring makes everything double, so ${V(a)} + ${V(b)} becomes 2${V(a)}${V(b)}`, mc: MC.baseTimesExp, say: 'Squaring is multiplying by itself, not doubling. The 2ab is two partial products.' },
      { t: `Nowhere: (${V(a)} + ${V(b)})<sup>2</sup> is really ${V(a)}<sup>2</sup> + ${V(b)}<sup>2</sup>`, mc: MC.fnSum, say: 'Try a = 2, b = 1: 3² is 9, but 4 + 1 is 5. The two strips are missing.' },
      { t: `It is 2 times ${V(a)}, plus ${V(b)}`, mc: MC.mid2aPlusB, say: 'The middle term is a product: 2 times a times b.' },
    ]);
  }
  return exChoice(R, { id: `sumSquareSym-${n}`, family: 'sumSquareSym', prompt: `Expand (${V(a)} + ${V(b)})<sup>2</sup> for any numbers ${V(a)} and ${V(b)}.`, board: `(${a} + ${b})^{2} = \\,?`, picture: pic,
    solution: [`(${V(a)} + ${V(b)})(${V(a)} + ${V(b)}) = ${V(a)}<sup>2</sup> + ${V(a)}${V(b)} + ${V(b)}${V(a)} + ${V(b)}<sup>2</sup>.`, `${V(a)}${V(b)} + ${V(b)}${V(a)} = 2${V(a)}${V(b)}.`] },
  { e: E(A('a2 + 2ab + b2')), say: 'Yes: the square, two strips, and the small square.' },
  [{ e: E(A('a2 + b2')), mc: MC.fnSum, say: 'That leaves out the two strips, a by b each.' },
    { e: E(A('a2 + ab + b2')), say: 'There are two cross products, ab and ba: 2ab.' },
    { e: E(A('2a + 2b')), mc: MC.baseTimesExp, say: 'Squaring is times itself, not times 2.' },
    { e: plus(E(A('a2 + b2')), E(A('2a + b'))), mc: MC.mid2aPlusB, say: 'The middle term is 2 times a times b, a product.' }]);
});

// ===================== square-of-difference-structure =====================
export const diffSquare: Gen = (R, n) => retry(R, () => {
  const [a, b] = pick(R, LETTERS);
  const A = (s: string) => s.replace(/a/g, a).replace(/b/g, b);
  const v = pick(R, ['ab', 'ba', 'neg', 'ab'] as const);
  const L = v === 'ab' ? pow(E(A('a - b')), 2) : v === 'ba' ? pow(E(A('b - a')), 2) : opp(pow(E(A('a - b')), 2));
  const right = ex(L);
  const sol = v === 'neg'
    ? [`First the square: (${V(a)} − ${V(b)})<sup>2</sup> = ${V(a)}<sup>2</sup> − 2${V(a)}${V(b)} + ${V(b)}<sup>2</sup>.`, 'Then the opposite: every sign flips.']
    : [`(${exHtml(v === 'ba' ? E(A('b - a')) : E(A('a - b')))})(${exHtml(v === 'ba' ? E(A('b - a')) : E(A('a - b')))}): two cross products of −${V(a)}${V(b)}, and (−${V(v === 'ba' ? a : b)})(−${V(v === 'ba' ? a : b)}) = +${V(v === 'ba' ? a : b)}<sup>2</sup>.`];
  return exChoice(R, { id: `diffSquare-${n}`, family: 'diffSquare', prompt: `Expand for every ${V(a)} and ${V(b)}. Which is equal?`, board: exTex(L), solution: sol },
    { e: E(right), say: v === 'ba' ? `Yes: (${V(b)} − ${V(a)})<sup>2</sup> = (${V(a)} − ${V(b)})<sup>2</sup>, since a number and its opposite have the same square.` : 'Yes.' },
    [{ e: v === 'ba' ? E(A('b2 - a2')) : E(A('a2 - b2')), mc: MC.fnSum, say: 'A square of a difference is not a difference of squares: the cross terms are missing.' },
      { e: v === 'neg' ? E(A('-a2 + 2ab + b2')) : E(A('a2 - 2ab - b2')), mc: MC.minusSpreads, say: 'The last term: a negative times a negative is positive.' },
      { e: v === 'neg' ? E(A('a2 - 2ab + b2')) : E(A('a2 + 2ab + b2')), say: v === 'neg' ? 'The minus in front makes every term its opposite.' : 'The cross terms are (a)(−b) and (−b)(a): both negative.' },
      { e: E(A('a2 + b2')), say: 'There are two cross terms, −ab each.' }]);
});
export const lastTerm: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['ab', 'mono', 'x']);
  let A: { k: number; v: string }, B: { k: number; v: string };
  if (v === 'ab') { const [a, b] = pick(R, LETTERS); A = { k: 1, v: a }; B = { k: 1, v: b }; }
  else if (v === 'x') { A = { k: 1, v: 'x' }; B = { k: int(R, 2, 9), v: '' }; }
  else { A = { k: int(R, 2, 5), v: 'x' }; B = { k: int(R, 2, 5), v: 'y' }; }
  const f = E([M(A.k, A.v), M(-B.k, B.v)]);
  const bb = B.k * B.k, bv = B.v ? `${B.v}2` : '';
  return exChoice(R, { id: `lastTerm-${n}`, family: 'lastTerm', prompt: `The box multiplies (${exHtml(f)})<sup>2</sup> = (${exHtml(f)})(${exHtml(f)}). What goes in the cell marked ?`, board: `(${exTex(f)})^{2}`,
    picture: { box: { a: [M(A.k, A.v), M(-B.k, B.v)], b: [M(A.k, A.v), M(-B.k, B.v)], cells: 'all', ask: [[1, 1]] } },
    solution: [`The marked cell is the second term times itself: (${exHtml(E([M(-B.k, B.v)]))})(${exHtml(E([M(-B.k, B.v)]))}).`, 'A negative times a negative is positive.'] },
  { e: E([M(bb, bv)]), say: 'Yes: negative times negative is positive. That is why (a − b)² ends in + b².' },
  [{ e: E([M(-bb, bv)]), mc: MC.minusSpreads, say: 'Negative times negative is positive: the last term of (a − b)² is + b².' },
    { e: E([M(-2 * B.k, B.v)]), mc: MC.baseTimesExp, say: 'The cell is a product of the term with itself, not the term doubled.' },
    { e: E([M(B.k, bv)]), mc: B.k > 1 && B.v ? MC.powOne : undefined, say: 'Square the number too: it is a factor of the term.' },
    { e: E([M(-2 * A.k * B.k, A.v + B.v)]), say: 'That is the two cross cells together. The marked cell is the last term squared.' }]);
});

// ===================== sum-times-difference-structure =====================
export const conjExpand: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['ab', 'ba', 'num', 'two'] as const);
  let u: { k: number; v: string }, w: { k: number; v: string };
  if (v === 'ab' || v === 'ba') { const [a, b] = pick(R, LETTERS); u = { k: 1, v: a }; w = { k: 1, v: b }; }
  else if (v === 'num') { u = { k: int(R, 2, 6), v: 'x' }; w = { k: int(R, 1, 9), v: '' }; }
  else { u = { k: 1, v: 'm' }; w = { k: int(R, 2, 6), v: 'n' }; }
  const S = E([M(u.k, u.v), M(w.k, w.v)]), D = E([M(u.k, u.v), M(-w.k, w.v)]);
  const L = v === 'ba' ? mul(D, S) : mul(S, D);
  const uu = `${u.v}2`, ww = w.v ? `${w.v}2` : '', uw = u.v + w.v;
  const sq = (t: { k: number; v: string }) => exHtml(E([M(t.k, t.v)]));
  return exChoice(R, { id: `conjExpand-${n}`, family: 'conjExpand', prompt: 'Expand. Which is equal for every value?', board: exTex(L),
    solution: [`Every term times every term: ${sq(u)} · ${sq(u)}, two cross products ${exHtml(E([M(u.k * w.k, uw)]))} and ${exHtml(E([M(-u.k * w.k, uw)]))}, and ${sq(w)} · (${exHtml(E([M(-w.k, w.v)]))}).`, 'The cross products are opposites: they cancel.'] },
  { e: E([M(u.k * u.k, uu), M(-w.k * w.k, ww)]), say: 'Yes: the cross terms cancel, a difference of two squares is left.' },
  [{ e: E([M(u.k * u.k, uu), M(-2 * u.k * w.k, uw), M(w.k * w.k, ww)]), mc: MC.conjSquare, say: 'That is the square of a difference. Here one factor is a sum and one a difference: the cross terms cancel.' },
    { e: E([M(u.k * u.k, uu), M(-2 * u.k * w.k, uw), M(-w.k * w.k, ww)]), mc: MC.conjCross, say: `The cross terms are ${exHtml(E([M(u.k * w.k, uw)]))} and ${exHtml(E([M(-u.k * w.k, uw)]))}: they add to 0.` },
    { e: E([M(u.k * u.k, uu), M(w.k * w.k, ww)]), say: 'The last product is a positive times a negative: negative.' },
    { e: E([M(u.k, uu), M(-w.k, ww)]), mc: MC.powOne, say: 'Square the numbers too.' }]);
});
export const conjCancel: Gen = (R, n) => retry(R, () => {
  const [a, b] = pick(R, [['x', 'y'], ['a', 'b'], ['m', 'n']] as const);
  const k = int(R, 2, 7), j = int(R, 1, 5);
  const Sp = [M(j, a), M(k, b)], Dp = [M(j, a), M(-k, b)];
  const v = pick(R, [0, 1]);
  const L = v ? mul(E(Dp), E(Sp)) : mul(E(Sp), E(Dp));
  return numItem({ id: `conjCancel-${n}`, family: 'conjCancel', prompt: `The box shows every partial product of ${exHtml(L)}. After collecting, what is the coefficient of ${V(a)}${V(b)}?`, board: exTex(L),
    picture: { box: { a: v ? Dp : Sp, b: v ? Sp : Dp, cells: 'all' } },
    solution: [`The two ${V(a)}${V(b)} cells are ${exHtml(E([M(j * k, a + b)]))} and ${exHtml(E([M(-j * k, a + b)]))}.`, `They are opposites: ${j * k} + (−${j * k}) = ${ans(0)}. The cross terms cancel.`] }, 0,
  numCheck(0, `Yes: 0. ${exHtml(L)} = ${exHtml(E(ex(L)))}.`,
    [{ v: -2 * j * k, mc: MC.conjSquare, say: 'That would be (a − b)². Here the two cross cells have opposite signs.' },
      { v: 2 * j * k, mc: MC.conjSquare, say: 'That would be (a + b)². Here the two cross cells have opposite signs.' },
      { v: -j * k, mc: MC.conjCross, say: 'There are two cross cells, and they cancel each other.' },
      { v: j * k, mc: MC.conjCross, say: 'There are two cross cells, and they cancel each other.' }],
    `Add the two ${V(a)}${V(b)} cells.`));
});
export { qH };
