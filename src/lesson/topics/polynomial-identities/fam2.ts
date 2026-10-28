// fam2.ts: stage 2 families: products of three factors and of bigger factors (sums and differences of cubes),
// choosing and applying a special product in one step, chunks as the a or b of an identity, and factoring with
// special products in reverse (with near-matches to reject). Pure: no DOM.
import { int, pick, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { type Ex, type P, type Q, E, M, collect, coefP, ex, exHtml, exTex, grp, minus, mul, nH, plus, pow, qq, qH, V, polyHtml, polyTex, mulP, equalP } from './idm';
import { qMul } from '../../../core/math';
import { type Gen, type Opt, LETTERS, MC, Reroll, choiceItem, exChoice, numCheck, numItem, nz, other, retry } from './common';

const X = V('x');
const bx = (k: number) => E([M(1, 'x'), M(k)]);
const P_ = (e: Ex): P => (e.t === 'P' ? e.p : ex(e));
const qv = (p: P, vars = '') => { const c = coefP(p, vars); return c.p / c.q; };

// ===================== extended-multiplication =====================
export const triple: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['three', 'three', 'cube1', 'cube2'] as const);
  let fs: Ex[], board: string, F1: P, F2: P, F3: P;
  if (v === 'three') {
    const p = nz(R, -4, 4), q = other(R, -4, 4, [0, -p]), r = other(R, -4, 4, [0]);
    F1 = P_(bx(p)); F2 = P_(bx(q)); F3 = P_(bx(r)); fs = [bx(p), bx(q), bx(r)];
    board = exTex(mul(...fs));
  } else if (v === 'cube1') {
    const p = nz(R, -3, 3); F1 = F2 = F3 = P_(bx(p)); fs = [bx(p), bx(p), bx(p)]; board = exTex(pow(bx(p), 3));
  } else {
    const a = int(R, 2, 3), b = pick(R, [-1, 1]); const f = E([M(a, 'x'), M(b)]); F1 = F2 = F3 = f.t === 'P' ? f.p : []; fs = [f, f, f]; board = exTex(pow(f, 3));
  }
  const first = collect(mulP(F1, F2));
  const right = collect(mulP(first, F3));
  const lead = mul(...fs);
  const c0 = F3[0]!, c1 = F3[1]!;
  // slips: the last factor's constant only added on (partial distribution); its constant's sign flipped; cube termwise
  const partial = collect([...mulP(first, [c0]), c1]);
  const flipped = collect(mulP(first, [c0, { ...c1, c: qq(-c1.c.p, c1.c.q) }]));
  const termwise = collect(F1.map(t => mulP(mulP([t], [t]), [t])).flat());
  const bxPic = { a: first, b: F3, cells: 'none' as const, pre: [`${exTex(mul(E(F1), E(F2)))} = ${polyTex(first)}`] };
  return exChoice(R, { id: `triple-${n}`, family: 'triple', prompt: 'Multiply out and write in standard form.', board, picture: { box: bxPic },
    solution: [`Two factors first: ${exHtml(mul(E(F1), E(F2)))} = ${polyHtml(first)}.`, `Then every term of that times every term of ${exHtml(E(F3))}, and collect.`] },
  { e: E(right), say: 'Yes: one product at a time, every term times every term.' },
  [{ e: E(partial), mc: MC.partial, say: `The last factor multiplies EVERY term of ${polyHtml(first)}, the number too.` },
    { e: E(flipped), mc: MC.unlikePos, say: 'Check the signs of the last factor\'s partial products.' },
    { e: E(termwise), mc: MC.fnSum, say: 'A power of a sum is not the sum of the powers: multiply it out.' },
    { e: E(collect(mulP([first[0]!, first[first.length - 1]!], [c0, c1]))), mc: MC.foilRule, say: 'FOIL is only for two binomials. Here every term times every term: there are more partial products.' }]);
});
export const bigCoef: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['x3', 'x3', 'xy'] as const);
  let A: P, B: P, ask: string, askH: string;
  if (v === 'x3') {
    const a1 = nz(R, -4, 4), a0 = nz(R, -5, 5), b1 = nz(R, -3, 3), b0 = nz(R, -5, 5);
    A = [M(1, 'x3'), M(a1, 'x'), M(a0)]; B = [M(1, 'x2'), M(b1, 'x'), M(b0)];
    const d = pick(R, [1, 2, 3]); ask = d === 1 ? 'x' : `x${d}`; askH = d === 1 ? X : `${X}<sup>${d}</sup>`;
  } else {
    const a0 = nz(R, -4, 4), b1 = nz(R, -3, 3);
    A = [M(1, 'x'), M(1, 'y'), M(a0)]; B = [M(1, 'x'), M(b1, 'y'), M(nz(R, -5, 5))];
    ask = pick(R, ['xy', 'y']); askH = ask === 'xy' ? `${X}${V('y')}` : V('y');
  }
  const prod = mulP(A, B), right = qv(prod, ask);
  const key = M(1, ask).e.join();
  const cells = prod.filter(t => t.e.join() === key);
  if (cells.length < 2 || right === 0) throw new Reroll();
  const oneCell = qv([cells[0]!], ask);
  const foil = qv(collect([mulP([A[0]!], [B[0]!])[0]!, mulP([A[0]!], [B[B.length - 1]!])[0]!, mulP([A[A.length - 1]!], [B[0]!])[0]!, mulP([A[A.length - 1]!], [B[B.length - 1]!])[0]!]), ask);
  return numItem({ id: `bigCoef-${n}`, family: 'bigCoef', prompt: `Multiply ${exHtml(mul(E(A), E(B)))} with a box: every term times every term. After collecting, what is the coefficient of ${askH}?`, board: exTex(mul(E(A), E(B))),
    picture: { box: { a: A, b: B, cells: 'none' } },
    solution: [`${A.length} · ${B.length} = ${A.length * B.length} partial products. The ${askH} cells: ${cells.map(t => polyHtml([t])).join(', ')}.`, `Add them: ${ans(nH(right))}.`] }, right,
  numCheck(right, `Yes: ${nH(right)}. In standard form: ${polyHtml(collect(prod))}.`,
    [{ v: oneCell, mc: MC.partial, say: `There is more than one ${askH} cell: find every one and add them.` },
      { v: foil, mc: MC.foilRule, say: 'FOIL only finds four products. This box has more cells: use all of them.' }],
    `Find every cell whose letters are ${askH} and add their coefficients.`));
});
export const cubes: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['xy+', 'ab-', 'xk+', 'xk-'] as const);
  let u: string, w: string, k = 1, sg: 1 | -1;
  if (v === 'xy+' || v === 'ab-') { [u, w] = pick(R, LETTERS); sg = v === 'xy+' ? 1 : -1; }
  else { u = 'x'; w = ''; k = int(R, 1, 5); sg = v === 'xk+' ? 1 : -1; }
  const L = [M(1, u), M(sg * k, w)];
  const Rf = [M(1, `${u}2`), M(-sg * k, u + w), M(k * k, w ? `${w}2` : '')];
  const right = collect(mulP(L, Rf));
  const sameSign = collect(mulP(L, [Rf[0]!, { ...Rf[1]!, c: qq(sg * k) }, Rf[2]!]));
  const cube = collect(mulP(mulP(L, L), L));
  const flipSign = collect([M(1, `${u}3`), M(-sg * k * k * k, w ? `${w}3` : '')]);
  return exChoice(R, { id: `cubes-${n}`, family: 'cubes', prompt: 'Multiply out. What is left after collecting?', board: exTex(mul(E(L), E(Rf))), picture: { box: { a: L, b: Rf, cells: 'none' } },
    solution: [`Six partial products: ${polyHtml(mulP(L, Rf))}.`, 'The middle ones come in opposite pairs and cancel.'] },
  { e: E(right), say: `Yes: a ${sg > 0 ? 'sum' : 'difference'} of two cubes. Everything in the middle cancels.` },
  [{ e: E(flipSign), say: `Check the sign of the last product: ${polyHtml([L[1]!])} times ${polyHtml([Rf[2]!])}.` },
    { e: E(cube), mc: MC.fnSum, say: 'That is the cube of the binomial. The second factor here is a trinomial: multiply it out.' },
    { e: E(sameSign), mc: MC.partial, say: 'Multiply every term by every term and check the signs: the middle terms cancel.' },
    { e: E(collect([M(1, `${u}3`), M(sg * k * k * k, w ? `${w}3` : ''), M(-2 * sg * k, `${u}2${w}`)])), say: 'Collect again: the middle terms cancel in pairs.' }]);
});

// ===================== special-products-direct =====================
type Pat = 'sum' | 'dif' | 'conj' | 'none';
const PAT_TEXT: Record<Pat, string> = {
  sum: 'Square of a sum: (<i>a</i> + <i>b</i>)<sup>2</sup>',
  dif: 'Square of a difference: (<i>a</i> − <i>b</i>)<sup>2</sup>',
  conj: 'Sum times difference: (<i>a</i> + <i>b</i>)(<i>a</i> − <i>b</i>)',
  none: 'None of them: multiply it all out',
};
export const whichPattern: Gen = (R, n) => retry(R, () => {
  const pat = pick(R, ['sum', 'dif', 'conj', 'none', 'none'] as Pat[]);
  const a = int(R, 1, 5), b = int(R, 1, 9), c = int(R, 2, 4);
  const lin = (s: number) => E([M(a, 'x'), M(s * b)]);
  let e: Ex;
  const kind = pick(R, [0, 1, 2]);
  if (pat === 'sum') e = kind === 0 ? pow(lin(1), 2) : kind === 1 ? pow(E([M(a, 'x'), M(c, 'y')]), 2) : pow(E([M(1, 'x2'), M(b)]), 2);
  else if (pat === 'dif') e = kind === 0 ? pow(lin(-1), 2) : kind === 1 ? pow(E([M(b), M(-a, 'x')]), 2) : pow(E([M(a, 'x'), M(-c, 'y')]), 2);
  else if (pat === 'conj') e = kind === 0 ? mul(lin(1), lin(-1)) : kind === 1 ? mul(E([M(1, 'x2'), M(-b)]), E([M(1, 'x2'), M(b)])) : mul(E([M(a, 'x'), M(c, 'y')]), E([M(a, 'x'), M(-c, 'y')]));
  else {
    const d = other(R, 1, 9, [b]);
    e = kind === 0 ? mul(bx(b), bx(-d)) : kind === 1 ? mul(E([M(a, 'x'), M(b)]), E([M(other(R, 1, 5, [a]), 'x'), M(-b)])) : mul(bx(b), bx(d));
  }
  if (pat === 'none' && kind === 2) { /* (x + b)(x + d), b ≠ d: two different sums */ }
  const why: Record<Pat, string> = {
    sum: 'One binomial sum times itself.', dif: 'One binomial difference times itself.',
    conj: 'The same two terms, once added and once subtracted.', none: 'The two factors do not share the same two terms, so no template fits.',
  };
  const opts: Opt[] = (['sum', 'dif', 'conj', 'none'] as Pat[]).map(p => p === pat
    ? { t: PAT_TEXT[p], ok: true, say: `Yes. ${why[p]}` }
    : { t: PAT_TEXT[p], mc: pat === 'none' && p === 'conj' ? MC.forced : pat === 'conj' && p !== 'none' ? MC.conjSquare : undefined,
      say: pat === 'none' ? `${why.none} Check that the terms match before you use a template.` : why[pat] });
  return choiceItem(R, { id: `whichPattern-${n}`, family: 'whichPattern', prompt: 'Which special product fits, before you expand? (Or none.)', board: exTex(e),
    solution: ['Look at the two factors: the same sum twice, the same difference twice, or the same two terms once with + and once with −.', why[pat]] }, opts, { keep: true });
});
export const oneStep: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['lin', 'lin', 'two', 'sq', 'half'] as const);
  const sg = pick(R, [1, -1]);
  // first term A·(letters a), second term B·(letters b), B signed
  let Aq: Q, av: string, Bq: Q, bv: string;
  if (v === 'lin') { Aq = qq(int(R, 2, 6)); av = 'x'; Bq = qq(sg * int(R, 1, 9)); bv = ''; }
  else if (v === 'two') { Aq = qq(int(R, 2, 5)); av = 'x'; Bq = qq(sg * int(R, 2, 5)); bv = 'y'; }
  else if (v === 'sq') { Aq = qq(1); av = 'x2'; Bq = qq(sg * int(R, 2, 9)); bv = ''; }
  else { Aq = qq(2); av = 'x'; Bq = qq(sg, 2); bv = ''; }
  const dbl = (t: string) => t.replace(/([a-z])(\d*)/g, (_, l: string, d: string) => `${l}${(d ? Number(d) : 1) * 2}`);
  const mq = (a: Q, b: Q) => qMul(a, b), neg = (a: Q) => qq(-a.p, a.q);
  const aa = M(mq(Aq, Aq), dbl(av)), bb = M(mq(Bq, Bq), dbl(bv)), mid = M(mq(qq(2), mq(Aq, Bq)), av + bv);
  const absB = qq(Math.abs(Bq.p), Bq.q);
  const right = collect([aa, mid, bb]);
  const f = E([M(Aq, av), M(Bq, bv)]);
  const wr: { e: Ex; mc?: string; say: string }[] = [
    { e: E(collect([M(Aq, dbl(av)), mid, bb])), mc: Aq.p !== 1 ? MC.powOne : undefined, say: `Square the whole first term: (${polyHtml([M(Aq, av)])})<sup>2</sup> = ${polyHtml([aa])}.` },
    { e: E(collect([aa, bb])), mc: MC.fnSum, say: 'The middle term 2ab is missing: the square of a binomial has three terms.' },
    { e: E(collect([aa, M(neg(mid.c), av + bv), bb])), say: 'The sign of the middle term follows the sign between the two terms.' },
    { e: E(collect([aa, mid, M(neg(bb.c), dbl(bv))])), mc: sg < 0 ? MC.minusSpreads : undefined, say: 'The last term is a square: it is positive.' },
  ];
  if (Bq.q === 1) wr.push({ e: E(collect([aa, M(qq(sg * (2 * Aq.p + Math.abs(Bq.p))), av + bv), bb])), mc: MC.mid2aPlusB, say: `The middle term is 2 · ${polyHtml([M(Aq, '')])} · ${qH(absB)}, a product.` });
  return exChoice(R, { id: `oneStep-${n}`, family: 'oneStep', prompt: 'Name the template, then expand in one step. Which is equal?', board: exTex(pow(f, 2)),
    solution: [`(<i>a</i> ${sg > 0 ? '+' : '−'} <i>b</i>)<sup>2</sup> = <i>a</i><sup>2</sup> ${sg > 0 ? '+' : '−'} 2<i>ab</i> + <i>b</i><sup>2</sup> with <i>a</i> = ${polyHtml([M(Aq, av)])} and <i>b</i> = ${polyHtml([M(absB, bv)])}.`,
      `<i>a</i><sup>2</sup> = ${polyHtml([aa])}, 2<i>ab</i> = ${polyHtml([M(qq(Math.abs(mid.c.p), mid.c.q), av + bv)])}, <i>b</i><sup>2</sup> = ${polyHtml([bb])}.`] },
  { e: E(right), say: 'Yes: a², then 2ab with its sign, then b².' }, wr);
});
export const middleCoef: Gen = (R, n) => retry(R, () => {
  const s = pick(R, [1, -1]), a = int(R, 2, 7), b = int(R, 1, 9);
  const two = R() < 0.4;
  const f = E([M(a, 'x'), M(s * b, two ? 'y' : '')]);
  const askH = two ? `${X}${V('y')}` : X;
  const right = 2 * a * b * s;
  return numItem({ id: `middleCoef-${n}`, family: 'middleCoef', prompt: `Expand (${exHtml(f)})<sup>2</sup> in one step. What is the coefficient of ${askH}?`, board: exTex(pow(f, 2)),
    solution: [`The middle term of (<i>a</i> ${s > 0 ? '+' : '−'} <i>b</i>)<sup>2</sup> is ${s > 0 ? '' : '−'}2<i>ab</i>, with <i>a</i> = ${a}${X} and <i>b</i> = ${b}${two ? V('y') : ''}.`, `${s > 0 ? '' : '−'}2 · ${a} · ${b} = ${ans(nH(right))}.`] }, right,
  numCheck(right, `Yes: ${polyHtml(ex(pow(f, 2)))}.`,
    [{ v: s * a * b, say: 'There are two cross products, a·b and b·a: double it.' },
      { v: s * (2 * a + b), mc: MC.mid2aPlusB, say: `The middle term is 2 · ${a} · ${b}, a product, not 2 · ${a} + ${b}.` },
      { v: -right, say: `The sign of the middle term is the sign between the terms: ${s > 0 ? 'plus' : 'minus'}.` },
      { v: 0, mc: MC.fnSum, say: 'A square of a sum is not the sum of the squares: there is a middle term.' }],
    'The middle term is 2 times the first term times the second term.'));
});

// ===================== composite-inputs =====================
export const chunkExpand: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['x1', 'xy-', 'xy2', 'x2']);
  const k = int(R, 2, 6), s = int(R, 1, 4);
  let e: Ex, right: P, wr: { e: Ex; mc?: string; say: string }[], aH: string, bH: string;
  if (v === 'x1') {
    const c = E([M(1, 'x'), M(s)]);
    e = mul(plus(grp(c), String(k)), minus(grp(c), String(k)));
    right = ex(e); aH = exHtml(c); bH = String(k);
    wr = [{ e: E([M(1, 'x2'), M(s * s - k * k)]), mc: MC.chunkTermwise, say: `(${exHtml(c)})<sup>2</sup> is not ${X}<sup>2</sup> + ${s * s}: it has a middle term ${2 * s}${X}.` },
      { e: E([M(1, 'x2'), M(-k * k)]), mc: MC.chunkPartial, say: `<i>a</i> is the whole chunk ${exHtml(c)}, not just ${X}.` },
      { e: E([M(1, 'x2'), M(2 * s, 'x'), M(s * s + k * k)]), say: `The last term of (<i>a</i> + <i>b</i>)(<i>a</i> − <i>b</i>) is −<i>b</i><sup>2</sup> = −${k * k}.` }];
  } else if (v === 'xy-') {
    const c = E('x + y');
    e = mul(E([M(1, 'x'), M(1, 'y'), M(-k)]), E([M(1, 'x'), M(1, 'y'), M(k)]));
    right = ex(e); aH = exHtml(c); bH = String(k);
    wr = [{ e: E([M(1, 'x2'), M(1, 'y2'), M(-k * k)]), mc: MC.chunkTermwise, say: `(${X} + ${V('y')})<sup>2</sup> has a middle term 2${X}${V('y')}.` },
      { e: E([M(1, 'x2'), M(2, 'xy'), M(1, 'y2'), M(k * k)]), say: `The last term is −${k}<sup>2</sup>.` },
      { e: E([M(1, 'x2'), M(-1, 'y2'), M(-k * k)]), mc: MC.chunkUnit, say: `Read ${X} + ${V('y')} as ONE chunk <i>a</i>: then it is <i>a</i><sup>2</sup> − ${k * k}.` }];
  } else if (v === 'xy2') {
    e = pow(E([M(1, 'x'), M(1, 'y'), M(k)]), 2);
    right = ex(e); aH = `${X} + ${V('y')}`; bH = String(k);
    wr = [{ e: E([M(1, 'x2'), M(1, 'y2'), M(k * k)]), mc: MC.chunkTermwise, say: 'Squaring each term leaves out every cross product.' },
      { e: E([M(1, 'x2'), M(2, 'xy'), M(1, 'y2'), M(k * k)]), mc: MC.fnSum, say: `With <i>a</i> = ${X} + ${V('y')} and <i>b</i> = ${k}, the term 2<i>ab</i> = ${2 * k}${X} + ${2 * k}${V('y')} is missing.` },
      { e: E([M(1, 'x2'), M(1, 'y2'), M(2 * k, 'x'), M(2 * k, 'y'), M(k * k)]), mc: MC.chunkTermwise, say: `(${X} + ${V('y')})<sup>2</sup> = ${X}<sup>2</sup> + 2${X}${V('y')} + ${V('y')}<sup>2</sup>: the 2${X}${V('y')} is missing.` }];
  } else {
    e = mul(E([M(1, 'x2'), M(k)]), E([M(1, 'x2'), M(-k)]));
    right = ex(e); aH = `${X}<sup>2</sup>`; bH = String(k);
    wr = [{ e: E([M(1, 'x2'), M(-k * k)]), mc: MC.powOne, say: `<i>a</i> = ${X}<sup>2</sup>, so <i>a</i><sup>2</sup> = ${X}<sup>4</sup>.` },
      { e: E([M(1, 'x4'), M(-2 * k, 'x2'), M(-k * k)]), mc: MC.conjCross, say: 'The cross terms cancel: there is no middle term.' },
      { e: E([M(1, 'x4'), M(k * k)]), say: `The last term is −${k * k}.` }];
  }
  return exChoice(R, { id: `chunkExpand-${n}`, family: 'chunkExpand', prompt: 'Treat a group of terms as ONE quantity, then use a special product. Which is equal?', board: exTex(e),
    solution: [`Let <i>a</i> = ${aH} and <i>b</i> = ${bH}.`, `Use the template, then expand <i>a</i><sup>2</sup>: ${polyHtml(right)}.`] },
  { e: E(right), say: 'Yes: chunk first, template next, then expand the chunk.' }, wr);
});
export const chunkName: Gen = (R, n) => retry(R, () => {
  const k = int(R, 2, 7), v = pick(R, ['xy', 'x4', 'xm']);
  let e: Ex, cands: { A: Ex; B: Ex; mc?: string }[];
  if (v === 'xy') {
    e = mul(E([M(1, 'x'), M(1, 'y'), M(-k)]), E([M(1, 'x'), M(1, 'y'), M(k)]));
    cands = [{ A: E('x + y'), B: E(String(k)) }, { A: E('x'), B: E([M(1, 'y'), M(k)]), mc: MC.chunkUnit }, { A: E([M(1, 'x'), M(1, 'y'), M(k)]), B: E(String(k)), mc: MC.chunkPartial }, { A: E('y'), B: E([M(1, 'x'), M(-k)]) }];
  } else if (v === 'x4') {
    e = minus(E('x4'), E(String(k * k)));
    cands = [{ A: E('x2'), B: E(String(k)) }, { A: E('x4'), B: E(String(k * k)), mc: MC.chunkUnit }, { A: E('x'), B: E(String(k)), mc: MC.powOne }, { A: E('x2'), B: E(String(k * k)) }];
  } else {
    const m = int(R, 1, 4);
    e = mul(E([M(1, 'x'), M(-m), M(k, 'y')]), E([M(1, 'x'), M(-m), M(-k, 'y')]));
    cands = [{ A: E([M(1, 'x'), M(-m)]), B: E([M(k, 'y')]) }, { A: E('x'), B: E([M(m), M(-k, 'y')]), mc: MC.chunkUnit }, { A: E([M(1, 'x'), M(k, 'y')]), B: E(String(m)), mc: MC.chunkPartial }, { A: E('x'), B: E([M(k, 'y')]), mc: MC.chunkPartial }];
  }
  const target = ex(e);
  const works = (c: { A: Ex; B: Ex }) => equalP(ex(mul(plus(grp(c.A), grp(c.B)), minus(grp(c.A), grp(c.B)))), target);
  if (!works(cands[0]!)) throw new Error('chunkName: the right chunk does not fit');
  const txt = (c: { A: Ex; B: Ex }) => `<i>a</i> = ${exHtml(c.A)}, &nbsp;<i>b</i> = ${exHtml(c.B)}`;
  const wrongs = cands.slice(1).filter(c => !works(c));
  return choiceItem(R, { id: `chunkName-${n}`, family: 'chunkName', prompt: `Write ${exHtml(e)} as (<i>a</i> + <i>b</i>)(<i>a</i> − <i>b</i>) = <i>a</i><sup>2</sup> − <i>b</i><sup>2</sup>. Which <i>a</i> and <i>b</i> work?`, board: exTex(e),
    solution: ['Find what the two factors share (that is a) and what they have with opposite signs (that is b).', `${txt(cands[0]!)}.`] },
  [{ t: txt(cands[0]!), ok: true, say: 'Yes: the shared chunk is a, the part with opposite signs is b.' },
    ...wrongs.map(c => ({ t: txt(c), mc: c.mc, say: `Check it: (<i>a</i> + <i>b</i>)(<i>a</i> − <i>b</i>) with these is ${polyHtml(ex(mul(plus(grp(c.A), grp(c.B)), minus(grp(c.A), grp(c.B)))))}, not the same.` }))]);
});

// ===================== reverse-special-products =====================
export const factorChunk: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['x1', 'xy', 'ym', 'twox', 'ps', 'x4']);
  const k = int(R, 2, 6), s = int(R, 1, 5);
  let e: Ex, right: Ex, wr: { e: Ex; mc?: string; say: string }[], step: string;
  if (v === 'x1') {
    if (s === k) throw new Reroll();
    e = minus(pow(E([M(1, 'x'), M(s)]), 2), String(k * k));
    right = mul(E([M(1, 'x'), M(s - k)]), E([M(1, 'x'), M(s + k)]));
    step = `<i>a</i> = ${X} + ${s}, <i>b</i> = ${k}: (${X} + ${s} − ${k})(${X} + ${s} + ${k}).`;
    wr = [{ e: mul(E([M(1, 'x'), M(-k)]), E([M(1, 'x'), M(k)])), mc: MC.chunkPartial, say: `<i>a</i> is the whole chunk ${X} + ${s}, not just ${X}.` },
      { e: pow(E([M(1, 'x'), M(s - k)]), 2), mc: MC.psUnchecked, say: 'A difference of squares factors into a sum times a difference, not a square.' },
      { e: mul(E([M(1, 'x'), M(s - k * k)]), E([M(1, 'x'), M(s + k * k)])), say: `<i>b</i><sup>2</sup> = ${k * k}, so <i>b</i> = ${k}.` }];
  } else if (v === 'xy') {
    e = minus(pow(E('x + y'), 2), String(k * k));
    right = mul(E([M(1, 'x'), M(1, 'y'), M(-k)]), E([M(1, 'x'), M(1, 'y'), M(k)]));
    step = `<i>a</i> = ${X} + ${V('y')}, <i>b</i> = ${k}.`;
    wr = [{ e: mul(E([M(1, 'x'), M(-k)]), E([M(1, 'y'), M(k)])), mc: MC.chunkUnit, say: `Keep ${X} + ${V('y')} together as one chunk <i>a</i>.` },
      { e: pow(E([M(1, 'x'), M(1, 'y'), M(-k)]), 2), mc: MC.psUnchecked, say: 'A difference of squares is a sum times a difference.' },
      { e: mul(E([M(1, 'x'), M(-1, 'y'), M(-k)]), E([M(1, 'x'), M(1, 'y'), M(k)])), mc: MC.chunkPartial, say: `Both factors keep the whole chunk ${X} + ${V('y')}.` }];
  } else if (v === 'ym') {
    e = minus(E('x2'), pow(E([M(1, 'y'), M(-k)]), 2));
    right = mul(E([M(1, 'x'), M(-1, 'y'), M(k)]), E([M(1, 'x'), M(1, 'y'), M(-k)]));
    step = `<i>a</i> = ${X}, <i>b</i> = ${V('y')} − ${k}: (${X} − (${V('y')} − ${k}))(${X} + (${V('y')} − ${k})).`;
    wr = [{ e: mul(E([M(1, 'x'), M(-1, 'y'), M(-k)]), E([M(1, 'x'), M(1, 'y'), M(-k)])), mc: MC.negFirst, say: `${X} − (${V('y')} − ${k}) = ${X} − ${V('y')} + ${k}: the minus reaches both terms of the chunk.` },
      { e: mul(E([M(1, 'x'), M(-1, 'y')]), E([M(1, 'x'), M(1, 'y')])), mc: MC.chunkPartial, say: `<i>b</i> is the whole chunk ${V('y')} − ${k}.` },
      { e: pow(E([M(1, 'x'), M(-1, 'y'), M(k)]), 2), mc: MC.psUnchecked, say: 'A difference of squares is a sum times a difference.' }];
  } else if (v === 'twox') {
    const a = int(R, 2, 4), c = int(R, 1, 3);
    e = minus(pow(E([M(a, 'x'), M(-c)]), 2), 'x2');
    right = mul(E([M(a - 1, 'x'), M(-c)]), E([M(a + 1, 'x'), M(-c)]));
    step = `<i>a</i> = ${a}${X} − ${c}, <i>b</i> = ${X}: (${a}${X} − ${c} − ${X})(${a}${X} − ${c} + ${X}).`;
    wr = [{ e: mul(E([M(a - 1, 'x'), M(-c)]), E([M(a + 1, 'x'), M(c)])), mc: MC.chunkPartial, say: 'Both factors keep the whole chunk, with its −' + c + '.' },
      { e: mul(E([M(a, 'x'), M(-c - 1)]), E([M(a, 'x'), M(-c + 1)])), mc: MC.chunkPartial, say: `<i>b</i> is ${X}, not 1.` },
      { e: pow(E([M(a - 1, 'x'), M(-c)]), 2), mc: MC.psUnchecked, say: 'A difference of squares is a sum times a difference.' }];
  } else if (v === 'ps') {
    const c = E([M(1, 'x'), M(s)]);
    e = plus(plus(pow(c, 2), mul(String(2 * k), c)), String(k * k));
    right = pow(E([M(1, 'x'), M(s + k)]), 2);
    step = `<i>a</i> = ${X} + ${s}, <i>b</i> = ${k}: <i>a</i><sup>2</sup> + 2<i>ab</i> + <i>b</i><sup>2</sup> = (<i>a</i> + <i>b</i>)<sup>2</sup> = (${X} + ${s} + ${k})<sup>2</sup>.`;
    wr = [{ e: pow(E([M(1, 'x'), M(k)]), 2), mc: MC.chunkPartial, say: `<i>a</i> is the whole chunk ${X} + ${s}.` },
      { e: mul(E([M(1, 'x'), M(s + k)]), E([M(1, 'x'), M(s - k)])), mc: MC.forced, say: 'The middle term is + 2ab: a square of a sum, not a sum times a difference.' },
      { e: pow(E([M(1, 'x'), M(s + k * k)]), 2), say: `<i>b</i><sup>2</sup> = ${k * k}, so <i>b</i> = ${k}.` }];
  } else {
    e = minus(E('x4'), E('y4'));
    right = mul(E('x - y'), E('x + y'), E('x2 + y2'));
    step = `<i>a</i> = ${X}<sup>2</sup>, <i>b</i> = ${V('y')}<sup>2</sup>: (${X}<sup>2</sup> − ${V('y')}<sup>2</sup>)(${X}<sup>2</sup> + ${V('y')}<sup>2</sup>), and ${X}<sup>2</sup> − ${V('y')}<sup>2</sup> = (${X} − ${V('y')})(${X} + ${V('y')}).`;
    wr = [{ e: mul(pow(E('x - y'), 2), pow(E('x + y'), 2)), mc: MC.sumSquares, say: `${X}<sup>2</sup> + ${V('y')}<sup>2</sup> is a SUM of squares: it does not factor into (${X} − ${V('y')})(${X} + ${V('y')}).` },
      { e: mul(pow(E('x - y'), 2), E('x2 + y2')), say: `${X}<sup>2</sup> − ${V('y')}<sup>2</sup> = (${X} − ${V('y')})(${X} + ${V('y')}), not (${X} − ${V('y')})<sup>2</sup>.` },
      { e: pow(E('x2 - y2'), 2), mc: MC.psUnchecked, say: 'A difference of squares is a sum times a difference, not a square.' }];
  }
  return exChoice(R, { id: `factorChunk-${n}`, family: 'factorChunk', prompt: v === 'x4' ? 'Factor completely with special products. Which is equal?' : 'Factor with a special product (read a chunk as a or b). Which is equal?', board: exTex(e),
    solution: [step, 'Simplify inside each bracket, and check by expanding.'] },
  { e: right, say: 'Yes: chunk, template in reverse, simplify inside the brackets.' }, wr);
});
/** a quadratic ux² + vx + w (u > 0) is the square of a binomial exactly when its discriminant is zero */
const isPerfect = (u: number, v: number, w: number) => u > 0 && v * v === 4 * u * w;
export const nearMatch: Gen = (R, n) => retry(R, () => {
  const k = int(R, 2, 9);
  if (R() < 0.55) {
    // is it a perfect-square trinomial? the candidate square is read off the first term and the middle term
    const a = pick(R, [1, 1, 2, 3]), s = pick(R, [1, -1]);
    const m = other(R, 2, 40, [k * k]);
    const cand = pick(R, [
      { u: a * a, v: 2 * a * k * s, w: k * k, mc: undefined as string | undefined, why: '' },
      { u: a * a, v: 2 * a * k * s, w: k * k, mc: undefined, why: '' },
      { u: a * a, v: 2 * a * k * s, w: m, mc: MC.psUnchecked, why: `For the middle term ${nH(2 * a * k * s)}${X} the last term would have to be ${k * k}.` },
      { u: a * a, v: a * k * s, w: k * k, mc: MC.psUnchecked, why: `The first and last terms are squares, but the middle term is not 2 · ${a === 1 ? X : a + X} · ${k} = ${2 * a * k}${X}.` },
      { u: a * a, v: 0, w: k * k, mc: MC.sumSquares, why: 'Two squares added with no middle term: not the square of a binomial.' },
    ]);
    const e = E([M(cand.u, 'x2'), M(cand.v, 'x'), M(cand.w)].filter(t => t.c.p !== 0));
    const perfect = isPerfect(cand.u, cand.v, cand.w);
    const sq = pow(E([M(a, 'x'), M(s * k)]), 2), conj = mul(E([M(a, 'x'), M(k)]), E([M(a, 'x'), M(-k)]));
    const opts: Opt[] = [
      { t: `Yes: it is ${exHtml(sq)}`, ok: perfect, mc: perfect ? undefined : cand.mc, say: perfect ? `Yes: ${exHtml(sq)} = ${exHtml(E(ex(sq)))}. All three parts check.` : `${exHtml(sq)} = ${exHtml(E(ex(sq)))}, not the same. ${cand.why}` },
      { t: 'No: it is not the square of a binomial', ok: !perfect, say: perfect ? `It is: ${exHtml(sq)} expands to exactly this.` : `Right. ${cand.why}` },
      { t: `Yes: it is ${exHtml(conj)}`, mc: MC.forced, say: `${exHtml(conj)} = ${exHtml(E(ex(conj)))}: no middle term.` },
    ];
    if (perfect !== equalP(ex(sq), ex(e)) || equalP(ex(conj), ex(e))) throw new Error('nearMatch: perfect-square check');
    return choiceItem(R, { id: `nearMatch-${n}`, family: 'nearMatch', prompt: 'Is this a perfect-square trinomial, (<i>a</i> + <i>b</i>)<sup>2</sup> or (<i>a</i> − <i>b</i>)<sup>2</sup>? Check all three terms.', board: exTex(e),
      solution: ['First term a square, last term a square, and the middle term exactly 2ab.', perfect ? `${exHtml(e)} = ${exHtml(sq)}.` : cand.why] }, opts, { keep: true });
  }
  // a difference of squares with whole-number pieces? every "no" case is monic with no real roots or irrational roots,
  // so it cannot be written as A² − B² with whole-number coefficients
  const s = int(R, 1, 4), m = pick(R, [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15]);
  const c = E([M(1, 'x'), M(s)]);
  const cand = pick(R, [
    { e: minus('x2', String(k * k)), B: k, ok: true, mc: undefined as string | undefined, why: '' },
    { e: minus(pow(c, 2), String(k * k)), B: k, ok: true, mc: undefined, why: '' },
    { e: plus(pow(c, 2), String(k * k)), B: k, ok: false, mc: MC.sumSquares, why: 'It is a SUM of two squares: a sum of squares does not factor this way.' },
    { e: plus('x2', String(k * k)), B: k, ok: false, mc: MC.sumSquares, why: 'It is a SUM of two squares: a sum of squares does not factor this way.' },
    { e: minus(pow(c, 2), String(m)), B: Math.round(Math.sqrt(m)), ok: false, mc: MC.psUnchecked, why: `${m} is not the square of a whole number.` },
  ]);
  const A = cand.e.t === 'add' && cand.e.a.t === 'pow' ? cand.e.a.b : E('x');
  const Ap = ex(A);
  const fac = mul(E([...Ap, M(-cand.B)]), E([...Ap, M(cand.B)]));
  const sq = pow(E([...Ap, M(-cand.B)]), 2);
  if (cand.ok !== equalP(ex(fac), ex(cand.e)) || equalP(ex(sq), ex(cand.e))) throw new Error('nearMatch: difference check');
  return choiceItem(R, { id: `nearMatch-${n}`, family: 'nearMatch', prompt: 'Can this be factored as a difference of squares, <i>a</i><sup>2</sup> − <i>b</i><sup>2</sup> = (<i>a</i> − <i>b</i>)(<i>a</i> + <i>b</i>), with whole-number coefficients?', board: exTex(cand.e),
    solution: ['A difference of squares needs a MINUS between two perfect squares.', cand.ok ? `<i>a</i> = ${exHtml(A)}, <i>b</i> = ${cand.B}: ${exHtml(fac)}.` : cand.why] }, [
    { t: `Yes: ${exHtml(fac)}`, ok: cand.ok, mc: cand.ok ? undefined : cand.mc, say: cand.ok ? `Yes: <i>a</i> = ${exHtml(A)}, <i>b</i> = ${cand.B}.` : `${exHtml(fac)} = ${exHtml(E(ex(fac)))}, not the same. ${cand.why}` },
    { t: 'No: it is not a difference of two squares', ok: !cand.ok, say: cand.ok ? `It is: ${exHtml(A)} squared minus ${cand.B} squared.` : `Right. ${cand.why}` },
    { t: `Yes: ${exHtml(sq)}`, mc: MC.psUnchecked, say: `${exHtml(sq)} has a middle term; a difference of squares factors into a sum times a difference.` },
  ], { keep: true });
});
