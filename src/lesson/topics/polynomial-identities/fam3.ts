// fam3.ts: stage 3 families: closure (sums, differences, products stay polynomials; quotients need not; the degree
// of a product), proving an identity by rewriting each side, disproving one with a counterexample, auditing a worked
// argument (the first invalid step, the logic, the repair), and identities that explain numbers (51 × 49, 99²,
// consecutive squares, Pythagorean triples). Pure: no DOM.
import { int, pick, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { type Env, type Ex, type P, E, M, collect, degreeP, equalP, ex, exHtml, exTex, grp, isIdentity, minus, mul, nH, plus, pow, polyHtml, V, valEx } from './idm';
import { type Gen, type Opt, LETTERS, MC, Reroll, choiceItem, exChoice, near, numCheck, numItem, nz, other, pairItem, retry } from './common';

const X = V('x');
const eq = (L: Ex, R: Ex) => `${exHtml(L)} = ${exHtml(R)}`;
const eqT = (L: Ex, R: Ex) => `${exTex(L)} = ${exTex(R)}`;

// ===================== closure =====================
export const closureWhich: Gen = (R, n) => retry(R, () => {
  const k = int(R, 1, 9), j = nz(R, -6, 6), d1 = int(R, 2, 4), d2 = int(R, 1, 3);
  const v = pick(R, ['prod', 'cancel', 'sum', 'quot', 'quot'] as const);
  let e: string, eh: string, deg: number | null, other1: number, mcNo: string | undefined;
  if (v === 'prod') {
    const A = E([M(1, `x${d1}`), M(j, 'x'), M(k)]), B = E([M(1, `x${d2}`), M(-k)]);
    e = exTex(mul(A, B)); eh = exHtml(mul(A, B)); deg = d1 + d2; other1 = d1 * d2; mcNo = MC.quotient;
  } else if (v === 'cancel') {
    const A = E([M(1, 'x2'), M(j, 'xy')]), B = E([M(1, 'x2'), M(j, 'xy'), M(-k)]);
    e = exTex(minus(grp(A), B)); eh = exHtml(minus(grp(A), B)); deg = 0; other1 = 2; mcNo = MC.constNotPoly;
  } else if (v === 'sum') {
    const A = E([M(1, `x${d1}y`), M(k)]), B = E([M(1, `xy${d2 + 1}`), M(-k)]);
    e = exTex(plus(grp(A), grp(B))); eh = exHtml(plus(grp(A), grp(B))); deg = Math.max(d1 + 1, d2 + 2); other1 = d1 + d2 + 3; mcNo = undefined;
  } else {
    const num = pick(R, [[`x${d1} + ${k}`, 'x'], [`x${d1 + 1} + ${k}`, 'x2 + 1'], [`${k}`, 'x'], [`xy + ${k}`, 'y']]);
    const N = E(num[0]!), D = E(num[1]!);
    e = `\\frac{${exTex(N)}}{${exTex(D)}}`; eh = `${exHtml(N).includes(' ') ? `(${exHtml(N)})` : exHtml(N)} ÷ ${exHtml(D).includes(' ') ? `(${exHtml(D)})` : exHtml(D)}`;
    deg = null; other1 = (ex(N).length ? Math.max(...ex(N).map(t => t.e.reduce((s2, x) => s2 + x, 0))) : 0) - Math.max(...ex(D).map(t => t.e.reduce((s2, x) => s2 + x, 0))); mcNo = undefined;
  }
  const no = 'No: a variable ends up in a denominator';
  const opts: Opt[] = deg === null
    ? [{ t: no, ok: true, say: 'Right: the division does not come out even, so a variable stays in a denominator. Quotients of polynomials need not be polynomials.' },
      { t: `Yes: degree ${Math.max(0, other1)}`, mc: MC.quotient, say: 'Dividing does not always give a polynomial: here a variable stays in the denominator.' },
      { t: `Yes: degree ${Math.max(0, other1) + 1}`, mc: MC.quotient, say: 'Dividing does not always give a polynomial: here a variable stays in the denominator.' }]
    : [{ t: `Yes: degree ${deg}`, ok: true, say: v === 'cancel' ? `Yes: it simplifies to ${k}, a constant, and a constant is a polynomial of degree 0.` : 'Yes: sums, differences and products of polynomials are always polynomials.' },
      { t: `Yes: degree ${other1}`, mc: v === 'prod' ? MC.degMult : undefined, say: v === 'prod' ? 'The leading terms multiply, so the degrees ADD.' : v === 'cancel' ? `Simplify first: everything cancels except ${k}.` : 'The degree of a sum is the degree of its highest term (add x and y exponents within a term).' },
      { t: no, mc: mcNo, say: v === 'cancel' ? `It simplifies to ${k}: a constant is still a polynomial.` : 'There is no division: the result is a polynomial.' }];
  return choiceItem(R, { id: `closureWhich-${n}`, family: 'closureWhich', prompt: `Simplify ${eh} in your head. Is the result a polynomial, and if so, of what degree?`, board: e,
    solution: ['Sums, differences and products of polynomials are polynomials (exponents add when terms multiply). A quotient need not be one.', deg === null ? 'Here the division leaves a variable in a denominator.' : `Here the result has degree ${deg}.`] }, opts, { keep: true });
});
export const degProduct: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['one', 'two', 'three'] as const);
  let fs: P[];
  if (v === 'one') { const d1 = int(R, 2, 4), d2 = int(R, 1, 3); fs = [[M(1, `x${d1}`), M(nz(R, -5, 5), 'x'), M(nz(R, -6, 6))], [M(nz(R, 1, 3), `x${d2}`), M(nz(R, -6, 6))]]; }
  else if (v === 'two') { const a = int(R, 1, 3), b = int(R, 1, 2), c = int(R, 1, 2), d = int(R, 2, 3); fs = [[M(1, `x${a}y${b}`), M(nz(R, -5, 5))], [M(nz(R, -3, 3), `x${c}y${d}`), M(1, 'y')]]; }
  else { fs = [[M(1, 'x2'), M(int(R, 1, 5))], [M(1, `x${int(R, 2, 3)}`), M(-1, 'x')], [M(1, 'x'), M(nz(R, -5, 5))]]; }
  const degs = fs.map(f => degreeP(f)!);
  const right = degs.reduce((s, d) => s + d, 0);
  const prod = fs.reduce<P>((a, f) => collect(a.flatMap(s => f.map(t => ({ c: { p: s.c.p * t.c.p, q: 1 }, e: s.e.map((x, i) => x + t.e[i]!) })))), [M(1)]);
  if (degreeP(prod) !== right) throw new Error('degProduct');
  const prodM = degs.reduce((s, d) => s * d, 1);
  const e = mul(...fs.map(f => E(f)));
  return numItem({ id: `degProduct-${n}`, family: 'degProduct', prompt: `Without multiplying it all out: what is the degree of ${exHtml(e)}?`, board: exTex(e),
    solution: [`The degrees of the factors: ${degs.join(', ')}${v === 'two' ? ' (add the exponents of x and y in a term)' : ''}.`, `The highest terms multiply, and exponents add: ${degs.join(' + ')} = ${ans(right)}.`] }, right,
  numCheck(right, `Yes: degree ${right}. The leading terms multiply, so their degrees add.`,
    [{ v: prodM, mc: MC.degMult, say: 'Exponents ADD when terms multiply, so the degrees add.' },
      { v: Math.max(...degs), say: 'Multiplying raises the degree: the degrees of the factors add.' }],
    'Add the degrees of the factors.'));
});

// ===================== prove-by-expansion =====================
interface Proof { L: Ex; R: Ex; vars: string; leftLines: Ex[]; rightLines: Ex[]; askSide: 'L' | 'R'; ask: number; wrongs: { e: Ex; mc?: string; say: string }[] }
function proofOf(R: () => number): Proof {
  const v = pick(R, ['diff', 'cube', 'pyth', 'cons'] as const);
  const k = int(R, 1, 5);
  if (v === 'diff') {
    const L = minus(pow(E([M(1, 'x'), M(k)]), 2), pow(E([M(1, 'x'), M(-k)]), 2)), Rr = E([M(4 * k, 'x')]);
    return { L, R: Rr, vars: `every real ${X}`, askSide: 'L', ask: 2,
      leftLines: [L, minus(grp(E([M(1, 'x2'), M(2 * k, 'x'), M(k * k)])), grp(E([M(1, 'x2'), M(-2 * k, 'x'), M(k * k)]))), E([M(1, 'x2'), M(2 * k, 'x'), M(k * k), M(-1, 'x2'), M(2 * k, 'x'), M(-k * k)]), Rr],
      rightLines: [Rr],
      wrongs: [{ e: E([M(1, 'x2'), M(2 * k, 'x'), M(k * k), M(-1, 'x2'), M(-2 * k, 'x'), M(k * k)]), mc: MC.negFirst, say: 'The minus in front of the bracket changes the sign of EVERY term inside it.' },
        { e: E([M(1, 'x2'), M(k * k), M(-1, 'x2'), M(-k * k)]), mc: MC.fnSum, say: 'Each square has a middle term: the brackets in the line above keep them.' },
        { e: E([M(1, 'x2'), M(2 * k, 'x'), M(k * k), M(1, 'x2'), M(-2 * k, 'x'), M(k * k)]), say: 'Subtracting the bracket flips its signs.' }] };
  }
  if (v === 'cube') {
    const L = pow(E([M(1, 'x'), M(k)]), 3), Rr = E([M(1, 'x3'), M(3 * k, 'x2'), M(3 * k * k, 'x'), M(k ** 3)]);
    return { L, R: Rr, vars: `every real ${X}`, askSide: 'L', ask: 2,
      leftLines: [L, mul(E([M(1, 'x'), M(k)]), E([M(1, 'x2'), M(2 * k, 'x'), M(k * k)])), E([M(1, 'x3'), M(2 * k, 'x2'), M(k * k, 'x'), M(k, 'x2'), M(2 * k * k, 'x'), M(k ** 3)]), Rr],
      rightLines: [Rr],
      wrongs: [{ e: E([M(1, 'x3'), M(2 * k, 'x2'), M(k * k, 'x'), M(k)]), mc: MC.partial, say: `The ${k} multiplies every term of the trinomial, not just one.` },
        { e: E([M(1, 'x3'), M(k * k, 'x'), M(k, 'x2'), M(k ** 3)]), mc: MC.foilRule, say: 'Firsts, outers, inners, lasts is only four products. A binomial times a trinomial has six.' },
        { e: E([M(1, 'x3'), M(k ** 3)]), mc: MC.fnSum, say: 'The cube of a sum is not the sum of the cubes.' }] };
  }
  const [p, q] = pick(R, LETTERS);
  if (v === 'pyth') {
    const T = (s: string) => s.replace(/x/g, p).replace(/y/g, q);
    const L = pow(E(T('x2 + y2')), 2), Rr = plus(pow(E(T('x2 - y2')), 2), pow(E(T('2xy')), 2)), std = E(T('x4 + 2x2y2 + y4'));
    return { L, R: Rr, vars: `every real ${V(p)} and ${V(q)}`, askSide: 'R', ask: 1,
      leftLines: [L, std], rightLines: [Rr, E(T('x4 - 2x2y2 + y4 + 4x2y2')), std],
      wrongs: [{ e: E(T('x4 - 2x2y2 + y4 + 2x2y2')), mc: MC.powOne, say: `(2${V(p)}${V(q)})<sup>2</sup> squares every factor, the 2 too: 4${V(p)}<sup>2</sup>&#8202;${V(q)}<sup>2</sup>.` },
        { e: E(T('x4 - y4 + 4x2y2')), mc: MC.fnSum, say: 'The square of a difference has a middle term −2ab.' },
        { e: E(T('x4 - 2x2y2 - y4 + 4x2y2')), mc: MC.minusSpreads, say: 'The last term of a squared difference is positive.' }] };
  }
  const L = minus(pow(E(`${p} + ${k}`), 2), E(`${p}2`)), Rr = E([M(2 * k, p), M(k * k)]);
  return { L, R: Rr, vars: `every real ${V(p)}`, askSide: 'L', ask: 1,
    leftLines: [L, E([M(1, `${p}2`), M(2 * k, p), M(k * k), M(-1, `${p}2`)]), Rr], rightLines: [Rr],
    wrongs: [{ e: E([M(1, `${p}2`), M(k * k), M(-1, `${p}2`)]), mc: MC.fnSum, say: `(${V(p)} + ${k})<sup>2</sup> has a middle term ${2 * k}${V(p)}.` },
      { e: E([M(1, `${p}2`), M(k, p), M(k * k), M(-1, `${p}2`)]), say: `There are two cross products, ${k}${V(p)} each.` },
      { e: E([M(1, `${p}2`), M(2 * k, p), M(k * k), M(1, `${p}2`)]), say: `Subtracting ${V(p)}<sup>2</sup> takes it away.` }] };
}
const chainLines = (p: Proof, hide: boolean) => {
  const side = (ls: Ex[], s: 'L' | 'R') => ls.map((e, i) => (i === 0 ? `\\text{${s === 'L' ? 'Left' : 'Right'}: }\\ ${exTex(e)}` : `= ${hide && p.askSide === s && i === p.ask ? '\\ ?' : exTex(e)}`));
  return [...side(p.leftLines, 'L'), ...(p.rightLines.length > 1 ? side(p.rightLines, 'R') : [])];
};
export const proofStep: Gen = (R, n) => retry(R, () => {
  const p = proofOf(R);
  const lines = p.askSide === 'L' ? p.leftLines : p.rightLines;
  const right = lines[p.ask]!;
  if (!equalP(ex(right), ex(lines[p.ask - 1]!)) || !isIdentity(p.L, p.R)) throw new Error('proofStep: bad proof');
  return exChoice(R, { id: `proofStep-${n}`, family: 'proofStep', prompt: `A proof that ${eq(p.L, p.R)} for ${p.vars}. Each side is rewritten on its own. Which line goes where the ? is?`, board: eqT(p.L, p.R),
    picture: { chain: { lines: chainLines(p, true) }, reveal: { lines: chainLines(p, false) } },
    solution: ['Each line must equal the line above it for every value.', `The missing line: ${exHtml(right)}.`] },
  { e: right, text: exHtml(right), say: 'Yes: it equals the line above for every value, and leads to the next one.' }, p.wrongs.map(w => ({ ...w, text: exHtml(w.e) })));
});
export const proofLogic: Gen = (R, n) => retry(R, () => {
  const p = proofOf(R);
  const std = polyHtml(ex(p.L));
  const opts: Opt[] = [
    { t: `Rewrite each side on its own: both become ${std}. So the two sides are equal for ${p.vars}.`, ok: true, say: 'Yes: two separate chains of equal expressions that meet in one standard form.' },
    { t: 'Try three values: the two sides match each time, so it is always true.', mc: MC.examples, say: 'Matching values are examples. An identity is a claim about EVERY value: examples never prove it.' },
    { t: 'Start from the equation, work on both sides at once until you reach 0 = 0, and stop.', mc: MC.bothSides, say: 'That starts by assuming the claim. Reaching a true line from it does not show the claim is true.' },
    { t: 'It is true because it is one of the special-product identities.', mc: MC.circular, say: 'That uses the claim as its own reason. A proof has to rewrite the sides.' },
  ];
  return choiceItem(R, { id: `proofLogic-${n}`, family: 'proofLogic', prompt: `Which argument proves ${eq(p.L, p.R)} for ${p.vars}?`, board: eqT(p.L, p.R),
    solution: ['A proof rewrites each side separately with steps that hold for every value, until both are the same expression.', `Here both sides become ${std}.`] }, opts);
});

// ===================== counterexample-refute =====================
interface Claim { L: Ex; R: Ex; a: string; b?: string }
function claimOf(R: () => number): Claim {
  const [a, b] = pick(R, LETTERS);
  const A = (s: string) => s.replace(/a/g, a).replace(/b/g, b);
  const k = int(R, 2, 6);
  return pick(R, [
    { L: pow(E(A('a + b')), 2), R: E(A('a2 + b2')), a, b },
    { L: pow(E(A('a - b')), 2), R: E(A('a2 - b2')), a, b },
    { L: pow(E(A('a + b')), 3), R: E(A('a3 + b3')), a, b },
    { L: mul(E(A('a + b')), E(A('a - b'))), R: E(A('a2 - 2ab + b2')), a, b },
    { L: pow(E([M(k, 'x')]), 2), R: E([M(k, 'x2')]), a: 'x' },
    { L: pow(E([M(1, 'x'), M(k)]), 2), R: E([M(1, 'x2'), M(k * k)]), a: 'x' },
  ] as Claim[]);
}
const envOf = (c: Claim, u: number, w?: number): Env => (c.b ? { [c.a]: u, [c.b]: w ?? 0 } : { [c.a]: u }) as Env;
const valTxt = (c: Claim, u: number, w?: number) => (c.b ? `${V(c.a)} = ${nH(u)}, ${V(c.b)} = ${nH(w!)}` : `${V(c.a)} = ${nH(u)}`);
const differs = (c: Claim, u: number, w?: number) => !near(valEx(c.L, envOf(c, u, w)), valEx(c.R, envOf(c, u, w)));
export const counterPick: Gen = (R, n) => retry(R, () => {
  const c = claimOf(R);
  if (isIdentity(c.L, c.R)) throw new Error('counterPick: the claim is true');
  const verdict = R() < 0.3;
  if (verdict) {
    const sep = (c.b ? [[2, 1], [3, 1], [1, 2], [2, 3]] : [[2], [3], [-1]]).filter(p => differs(c, p[0]!, p[1]));
    const agree = (c.b ? [[0, 3], [4, 0], [0, 2]] : [[0]]).filter(p => !differs(c, p[0]!, p[1]));
    if (!sep.length || !agree.length) throw new Reroll();
    const s = pick(R, sep), g = pick(R, agree);
    const [ls, rs] = [valEx(c.L, envOf(c, s[0]!, s[1])), valEx(c.R, envOf(c, s[0]!, s[1]))];
    return choiceItem(R, { id: `counterPick-${n}`, family: 'counterPick', prompt: `Sam claims ${eq(c.L, c.R)} for every value. At ${valTxt(c, g[0]!, g[1])} both sides are equal. At ${valTxt(c, s[0]!, s[1])} the left side is ${nH(ls)} and the right side is ${nH(rs)}. What follows?`, board: `${eqT(c.L, c.R)}\\ ?`,
      solution: ['A for-every claim fails as soon as ONE value makes the sides differ.', `${valTxt(c, s[0]!, s[1])}: ${nH(ls)} ≠ ${nH(rs)}.`] }, [
      { t: 'The claim is false: one counterexample is enough', ok: true, say: 'Right: a single counterexample disproves a for-every claim.' },
      { t: 'The claim is true; that value is just an exception', mc: MC.exception, say: 'An identity has no exceptions. A value where it fails is a counterexample: the claim is false.' },
      { t: 'Sam must test more values before deciding', mc: MC.examples, say: 'No more tests are needed: one value where the sides differ settles it.' },
    ]);
  }
  const pairs = c.b ? [[0, int(R, 1, 5)], [int(R, 1, 5), 0], [1, 1], [2, 2], [3, -3], [2, 1], [3, 1], [1, 2], [3, 2], [-1, 2]] : [[0], [1], [2], [3], [-1], [-2]];
  const sep = pairs.filter(p => differs(c, p[0]!, p[1]) && p.every(v => v !== 0));
  const agree = shuffle(R, pairs.filter(p => !differs(c, p[0]!, p[1])));
  if (!sep.length) throw new Reroll();
  const s = pick(R, sep);
  const opts: Opt[] = [{ t: valTxt(c, s[0]!, s[1]), ok: true, say: `Yes: the left side is ${nH(valEx(c.L, envOf(c, s[0]!, s[1])))} and the right side ${nH(valEx(c.R, envOf(c, s[0]!, s[1])))}. One disagreement disproves the claim.` }];
  for (const g of agree.slice(0, 2)) opts.push({ t: valTxt(c, g[0]!, g[1]), mc: MC.nonSep, say: `There both sides are ${nH(valEx(c.L, envOf(c, g[0]!, g[1])))}: the values agree, so this test cannot show anything.` });
  if (opts.length < 3) opts.push({ t: 'None: the claim is true for every value', mc: MC.examples, say: `Try ${valTxt(c, s[0]!, s[1])}: the two sides differ.` });
  return choiceItem(R, { id: `counterPick-${n}`, family: 'counterPick', prompt: `Which values show that ${eq(c.L, c.R)} is NOT true for every value?`, board: `${eqT(c.L, c.R)}\\ ?`,
    solution: ['A counterexample needs values where the two sides really differ. Zeros (and some special values) often hide the error.', `${valTxt(c, s[0]!, s[1])}: left ${nH(valEx(c.L, envOf(c, s[0]!, s[1])))}, right ${nH(valEx(c.R, envOf(c, s[0]!, s[1])))}.`] }, opts);
});
export const counterValues: Gen = (R, n) => retry(R, () => {
  const c = claimOf(R);
  const u = pick(R, [2, 3, 4, 5, -2, -3]), w = c.b ? pick(R, [1, 2, 3, -1].filter(t => t !== u)) : undefined;
  if (!differs(c, u, w)) throw new Reroll();
  const env = envOf(c, u, w), l = valEx(c.L, env), r = valEx(c.R, env);
  return pairItem({ id: `counterValues-${n}`, family: 'counterValues', prompt: `Is ${eq(c.L, c.R)} an identity? Test it at ${valTxt(c, u, w)}: work out the left side and the right side.`, board: `${eqT(c.L, c.R)}\\ ?`,
    pairLead: 'left side', pairOp: ', &nbsp;right side', pairTail: '',
    solution: [`Left: ${exHtml(c.L)} at ${valTxt(c, u, w)} is ${ans(nH(l))}.`, `Right: ${exHtml(c.R)} is ${ans(nH(r))}. They differ, so it is not an identity.`] }, l, r,
  (x, y) => near(x, l) && near(y, r) ? { ok: true, say: `Yes: ${nH(l)} ≠ ${nH(r)}. One counterexample, and the claim is dead.` }
    : near(x, r) && near(y, l) ? { ok: false, say: 'Swapped: the left side first.' }
      : near(x, l) ? { ok: false, say: `The left side is right. Now the right side: ${exHtml(c.R)}.` }
        : { ok: false, say: 'Put the numbers in, then work out powers first. A negative number in brackets keeps its sign when squared.' });
});

// ===================== error-locate-repair =====================
interface Chain { lines: Ex[]; bad: number; mc?: string; kind: string; good: Ex[]; alts: Ex[] }
function chainOf(R: () => number, needBad: boolean): Chain {
  const kind = pick(R, ['diff', 'prod', 'xy', 'chunk'] as const);
  const k = int(R, 2, 5);
  let good: Ex[], bads: Record<number, { lines: Ex[]; mc?: string }>, alts: Ex[][];
  if (kind === 'diff') {
    good = [minus(pow(E([M(1, 'x'), M(k)]), 2), pow(E([M(1, 'x'), M(-k)]), 2)), minus(grp(E([M(1, 'x2'), M(2 * k, 'x'), M(k * k)])), grp(E([M(1, 'x2'), M(-2 * k, 'x'), M(k * k)]))), E([M(1, 'x2'), M(2 * k, 'x'), M(k * k), M(-1, 'x2'), M(2 * k, 'x'), M(-k * k)]), E([M(4 * k, 'x')])];
    bads = {
      1: { lines: [minus(grp(E([M(1, 'x2'), M(k * k)])), grp(E([M(1, 'x2'), M(-2 * k, 'x'), M(k * k)]))), E([M(1, 'x2'), M(k * k), M(-1, 'x2'), M(2 * k, 'x'), M(-k * k)]), E([M(2 * k, 'x')])], mc: MC.fnSum },
      2: { lines: [E([M(1, 'x2'), M(2 * k, 'x'), M(k * k), M(-1, 'x2'), M(-2 * k, 'x'), M(k * k)]), E([M(2 * k * k)])], mc: MC.negFirst },
      3: { lines: [E([M(4 * k, 'x'), M(2 * k * k)])] },
    };
    alts = [[], [minus(grp(E([M(1, 'x2'), M(k * k)])), grp(E([M(1, 'x2'), M(-k * k)])))], [E([M(1, 'x2'), M(2 * k, 'x'), M(k * k), M(1, 'x2'), M(-2 * k, 'x'), M(k * k)])], [E([M(4 * k, 'x2')]), E([M(2 * k, 'x')])]];
  } else if (kind === 'prod') {
    const m = other(R, 2, 6, [k]);
    good = [mul(E([M(1, 'x2'), M(k)]), E([M(1, 'x3'), M(-m)])), E([M(1, 'x5'), M(-m, 'x2'), M(k, 'x3'), M(-k * m)]), E([M(1, 'x5'), M(k, 'x3'), M(-m, 'x2'), M(-k * m)])];
    const b1 = pick(R, [0, 1]);
    bads = {
      1: b1 ? { lines: [E([M(1, 'x6'), M(-m, 'x2'), M(k, 'x3'), M(-k * m)]), E([M(1, 'x6'), M(k, 'x3'), M(-m, 'x2'), M(-k * m)])], mc: MC.multExps }
        : { lines: [E([M(1, 'x5'), M(-m, 'x2'), M(k, 'x3'), M(k * m)]), E([M(1, 'x5'), M(k, 'x3'), M(-m, 'x2'), M(k * m)])], mc: MC.unlikePos },
      2: { lines: [E([M(1, 'x5'), M(k - m, 'x3'), M(-k * m)])], mc: MC.unlike },
    };
    alts = [[], [E([M(1, 'x6'), M(-m, 'x2'), M(k, 'x3'), M(-k * m)]), E([M(1, 'x5'), M(-m), M(k), M(-k * m)])], [E([M(1, 'x5'), M(k - m, 'x5'), M(-k * m)])]];
  } else if (kind === 'xy') {
    good = [minus(pow(E('x + y'), 2), E('2xy')), E([M(1, 'x2'), M(1, 'xy'), M(1, 'xy'), M(1, 'y2'), M(-2, 'xy')]), E([M(1, 'x2'), M(2, 'xy'), M(1, 'y2'), M(-2, 'xy')]), E('x2 + y2')];
    bads = {
      1: { lines: [E([M(1, 'x2'), M(1, 'y2'), M(-2, 'xy')]), E([M(1, 'x2'), M(-2, 'xy'), M(1, 'y2')]), pow(E('x - y'), 2)], mc: MC.fnSum },
      2: { lines: [E([M(1, 'x2'), M(2, 'x2y2'), M(1, 'y2'), M(-2, 'xy')]), E([M(1, 'x2'), M(2, 'x2y2'), M(1, 'y2'), M(-2, 'xy')])], mc: MC.unlike },
      3: { lines: [E([M(1, 'x2'), M(4, 'xy'), M(1, 'y2')])] },
    };
    alts = [[], [E([M(1, 'x2'), M(1, 'y2'), M(-2, 'xy')])], [E([M(1, 'x2'), M(1, 'xy'), M(1, 'y2'), M(-2, 'xy')])], [E([M(1, 'x2'), M(4, 'xy'), M(1, 'y2')]), pow(E('x - y'), 2)]];
  } else {
    good = [pow(E([M(1, 'x'), M(1, 'y'), M(k)]), 2), pow(plus(grp(E('x + y')), String(k)), 2), plus(plus(pow(E('x + y'), 2), mul(String(2 * k), E('x + y'))), String(k * k)), E([M(1, 'x2'), M(2, 'xy'), M(1, 'y2'), M(2 * k, 'x'), M(2 * k, 'y'), M(k * k)])];
    bads = {
      2: { lines: [plus(pow(E('x + y'), 2), String(k * k)), E([M(1, 'x2'), M(2, 'xy'), M(1, 'y2'), M(k * k)])], mc: MC.fnSum },
      3: { lines: [E([M(1, 'x2'), M(1, 'y2'), M(2 * k, 'x'), M(2 * k, 'y'), M(k * k)])], mc: MC.chunkTermwise },
    };
    alts = [[], [], [plus(pow(E('x + y'), 2), String(k * k)), plus(plus(E('x2 + y2'), mul(String(2 * k), E('x + y'))), String(k * k))], [E([M(1, 'x2'), M(1, 'y2'), M(2 * k, 'x'), M(2 * k, 'y'), M(k * k)])]];
  }
  const choicesBad = Object.keys(bads).map(Number);
  const bad = needBad ? pick(R, choicesBad) : pick(R, [0, ...choicesBad]);
  const lines = bad === 0 ? good.slice() : [...good.slice(0, bad), ...bads[bad]!.lines];
  // the planted step is the first line that is not equal to the line before it
  const first = lines.findIndex((l, i) => i > 0 && !equalP(ex(l), ex(lines[i - 1]!)));
  if ((bad === 0 && first !== -1) || (bad > 0 && first !== bad)) throw new Error(`chainOf ${kind}: planted ${bad}, first invalid ${first}`);
  return { lines, bad, mc: bad ? bads[bad]!.mc : undefined, kind, good, alts: alts[bad] ?? [] };
}
const STEP_NAMES = ['start', 'Step 1', 'Step 2', 'Step 3', 'Step 4'];
export const firstBad: Gen = (R, n) => retry(R, () => {
  const ch = chainOf(R, false);
  const N = ch.lines.length;
  const opts: Opt[] = [];
  for (let i = 1; i < N; i++) {
    opts.push(i === ch.bad
      ? { t: STEP_NAMES[i]!, ok: true, say: `Yes: ${STEP_NAMES[i]} does not equal the line before it.` }
      : i < ch.bad || ch.bad === 0 ? { t: STEP_NAMES[i]!, say: `${STEP_NAMES[i]} is fine: it equals the line before it.` }
        : { t: STEP_NAMES[i]!, mc: MC.recompute, say: `${STEP_NAMES[i]} follows correctly from the line before it. Look earlier: the FIRST broken step.` });
  }
  opts.push(ch.bad === 0 ? { t: 'No step is wrong', ok: true, say: 'Right: every line equals the one before it.' }
    : { t: 'No step is wrong', mc: MC.finalAnswer, say: `Check each line against the one before it: ${STEP_NAMES[ch.bad]} changes the value.` });
  const why = ch.bad ? `${STEP_NAMES[ch.bad]}: ${exHtml(ch.lines[ch.bad - 1]!)} is not equal to ${exHtml(ch.lines[ch.bad]!)}.` : 'Every line equals the line before it.';
  return choiceItem(R, { id: `firstBad-${n}`, family: 'firstBad', prompt: 'Audit this work line by line. Which step is the FIRST one that is wrong?', board: exTex(ch.lines[0]!),
    picture: { chain: { lines: ch.lines.map((l, i) => (i ? '= ' : '') + exTex(l)), labels: STEP_NAMES.slice(0, N) }, reveal: { bad: ch.bad } },
    solution: ['Compare each line with the line right above it: they must be equal for every value.', why] }, opts, { keep: true });
});
export const repairStep: Gen = (R, n) => retry(R, () => {
  const ch = chainOf(R, true);
  const b = ch.bad, fix = ch.good[b]!;
  const shown = ch.lines.slice(0, b + 1);
  return exChoice(R, { id: `repairStep-${n}`, family: 'repairStep', prompt: `${STEP_NAMES[b]} is the first wrong line. What should it say?`, board: exTex(ch.lines[0]!),
    picture: { chain: { lines: shown.map((l, i) => (i ? '= ' : '') + exTex(l)), labels: STEP_NAMES.slice(0, b + 1) }, reveal: { bad: b } },
    solution: [`The line before it is ${exHtml(ch.lines[b - 1]!)}.`, `Rewrite it correctly: ${exHtml(fix)}.`] },
  { e: fix, text: exHtml(fix), say: 'Yes: that equals the line before it for every value.' },
  [{ e: ch.lines[b]!, text: exHtml(ch.lines[b]!), mc: ch.mc, say: 'That is the broken line itself: it does not equal the line before it.' },
    ...ch.alts.map(e => ({ e, text: exHtml(e), say: 'Check it against the line before: it does not match for every value.' }))]);
});
export const auditLogic: Gen = (R, n) => retry(R, () => {
  const [a, b] = pick(R, LETTERS);
  const k = int(R, 1, 4), onA = R() < 0.5 && k > 1;
  // the identity (a + kb)² − (a − kb)² = 4kab (or with k on a)
  const u = onA ? M(k, a) : M(1, a), w = onA ? M(1, b) : M(k, b);
  const sq = (t: typeof u) => ({ c: { p: t.c.p * t.c.p, q: 1 }, e: t.e.map(x => x * 2) });
  const uw = { c: { p: 2 * u.c.p * w.c.p, q: 1 }, e: u.e.map((x, i) => x + w.e[i]!) };
  const neg = (t: { c: { p: number; q: number }; e: readonly number[] }) => ({ c: { p: -t.c.p, q: 1 }, e: t.e });
  const L = minus(pow(E([u, w]), 2), pow(E([u, neg(w)]), 2)), Rr = E([{ c: { p: 4 * k, q: 1 }, e: uw.e }]);
  const S = E([sq(u), uw, sq(w)]), D = E([sq(u), neg(uw), sq(w)]);
  const flat = E([sq(u), uw, sq(w), neg(sq(u)), uw, neg(sq(w))]), flatBad = E([sq(u), uw, sq(w), neg(sq(u)), neg(uw), sq(w)]);
  const bad = E([{ c: { p: 2 * sq(w).c.p, q: 1 }, e: sq(w).e }]);
  const t = (s2: string) => `\\text{${s2}}`;
  const kind = pick(R, ['valid', 'examples', 'circular', 'algebra'] as const);
  const x1 = int(R, 1, 4), y1 = other(R, 1, 5, [x1]), x2 = other(R, 1, 5, [x1]), y2 = int(R, 1, 3);
  const at = (x: number, y: number) => { const env = { [a]: x, [b]: y }; return `${a} = ${x},\\ ${b} = ${y}:\\ ${valEx(pow(E([u, w]), 2), env)} - ${valEx(pow(E([u, neg(w)]), 2), env)} = ${valEx(Rr, env)}\\ \\checkmark`; };
  const lines = kind === 'valid' ? [`${t('Left: ')}${exTex(L)}`, `= ${exTex(minus(grp(S), grp(D)))}`, `= ${exTex(flat)}`, `= ${exTex(Rr)}${t(' = Right, for every ')}${a}, ${b}`]
    : kind === 'examples' ? [at(x1, y1), at(x2, y2), t(`So it is true for every ${a} and ${b}.`)]
      : kind === 'circular' ? [`${exTex(L)} = ${exTex(Rr)}`, `${exTex(flat)} = ${exTex(Rr)}`, `${exTex(Rr)} = ${exTex(Rr)}`, `0 = 0\\ ${t('true, so the identity holds.')}`]
        : [`${t('Left: ')}${exTex(L)}`, `= ${exTex(minus(grp(S), grp(D)))}`, `= ${exTex(flatBad)}`, `= ${exTex(bad)}${t(', not ')}${exTex(Rr)}${t(': false.')}`];
  if (!isIdentity(L, Rr) || !equalP(ex(flatBad), ex(bad)) || equalP(ex(flatBad), ex(Rr))) throw new Error('auditLogic');
  const right = { valid: 0, examples: 1, circular: 2, algebra: 3 }[kind];
  const texts = [
    'A valid proof: each side is rewritten until they match',
    'Not a proof: it only checks some values',
    'Not a proof: it starts from the claim and ends at a true statement',
    'Not valid: a step has an algebra error',
  ];
  const wrongMc = kind === 'examples' ? MC.examples : kind === 'circular' ? MC.bothSides : kind === 'algebra' ? MC.finalAnswer : undefined;
  const why = {
    valid: 'Every line equals the one before it for every value, and it starts from one side and ends at the other.',
    examples: 'Two matching examples say nothing about every other value.',
    circular: 'It assumes the equation from the first line on; reaching 0 = 0 from it proves nothing.',
    algebra: `Step 2: the minus in front of the bracket must flip EVERY sign: −(${exHtml(D)}) = ${exHtml(E(D.t === 'P' ? D.p.map(neg) : []))}. The claim is in fact true.`,
  }[kind];
  const opts: Opt[] = texts.map((tx, i) => i === right ? { t: tx, ok: true, say: `Yes. ${why}` } : { t: tx, mc: i === 0 ? wrongMc : undefined, say: why });
  return choiceItem(R, { id: `auditLogic-${n}`, family: 'auditLogic', prompt: `Kim's argument about ${eq(L, Rr)}. What is it?`, board: eqT(L, Rr),
    picture: { chain: { lines } }, solution: ['Check the logic (what is assumed, what is shown) and every algebra step.', why] }, opts, { keep: true });
});

// ===================== numerical-relationships =====================
export const mentalProduct: Gen = (R, n) => retry(R, () => {
  const m = pick(R, [20, 30, 40, 50, 60, 70, 80, 90, 100]), k = int(R, 1, 4);
  const right = m * m - k * k;
  return numItem({ id: `mentalProduct-${n}`, family: 'mentalProduct', prompt: `No calculator: use (<i>n</i> + <i>k</i>)(<i>n</i> − <i>k</i>) = <i>n</i><sup>2</sup> − <i>k</i><sup>2</sup> to work out ${m + k} × ${m - k}.`, board: `${m + k} \\times ${m - k}`,
    solution: [`${m + k} × ${m - k} = (${m} + ${k})(${m} − ${k}) = ${m}<sup>2</sup> − ${k}<sup>2</sup>.`, `${m * m} − ${k * k} = ${ans(right)}.`] }, right,
  numCheck(right, `Yes: ${m * m} − ${k * k} = ${right}.`,
    [{ v: m * m, say: `Almost: (${m} + ${k})(${m} − ${k}) is ${m}<sup>2</sup> MINUS ${k}<sup>2</sup>.` },
      { v: m * m + k * k, mc: MC.conjCross, say: `The last term is −${k}<sup>2</sup>: a positive times a negative.` },
      { v: m * m - k, say: `Square the ${k} too: ${k}<sup>2</sup> = ${k * k}.` },
      { v: m * m - 2 * m * k + k * k, mc: MC.conjSquare, say: 'That is a square of a difference. A sum times a difference has no middle term.' }],
    `Write it as (${m} + ${k})(${m} − ${k}).`));
});
export const squareMental: Gen = (R, n) => retry(R, () => {
  const m = pick(R, [30, 40, 50, 60, 70, 80, 90, 100]), k = int(R, 1, 3), s = pick(R, [1, -1]);
  const N = m + s * k, right = N * N;
  return numItem({ id: `squareMental-${n}`, family: 'squareMental', prompt: `No calculator: write ${N} as ${m} ${s > 0 ? '+' : '−'} ${k} and use the square of a ${s > 0 ? 'sum' : 'difference'} to find ${N}<sup>2</sup>.`, board: `${N}^{2} = (${m} ${s > 0 ? '+' : '-'} ${k})^{2}`,
    solution: [`(${m} ${s > 0 ? '+' : '−'} ${k})<sup>2</sup> = ${m}<sup>2</sup> ${s > 0 ? '+' : '−'} 2 · ${m} · ${k} + ${k}<sup>2</sup> = ${m * m} ${s > 0 ? '+' : '−'} ${2 * m * k} + ${k * k}.`, `= ${ans(right)}.`] }, right,
  numCheck(right, `Yes: ${m * m} ${s > 0 ? '+' : '−'} ${2 * m * k} + ${k * k} = ${right}.`,
    [{ v: m * m + s * k * k, mc: MC.fnSum, say: `Squaring a ${s > 0 ? 'sum' : 'difference'} has a middle term: 2 · ${m} · ${k} = ${2 * m * k}.` },
      { v: m * m + k * k, mc: MC.fnSum, say: `There is a middle term: 2 · ${m} · ${k} = ${2 * m * k}.` },
      { v: m * m + s * m * k + k * k, say: `Two cross products: 2 · ${m} · ${k} = ${2 * m * k}.` },
      { v: m * m - 2 * m * k - k * k, mc: MC.minusSpreads, say: 'The last term is a square: + ' + k * k + '.' }],
    `${N} = ${m} ${s > 0 ? '+' : '−'} ${k}: square it with the template.`));
});
export const consecutive: Gen = (R, n) => retry(R, () => {
  const m = int(R, 11, 60), up = R() < 0.6;
  const [hi, lo] = up ? [m + 1, m] : [m, m - 1];
  const right = hi * hi - lo * lo;
  return numItem({ id: `consecutive-${n}`, family: 'consecutive', prompt: `(<i>n</i> + 1)<sup>2</sup> − <i>n</i><sup>2</sup> = 2<i>n</i> + 1 for every <i>n</i>. Use it: how much greater is ${hi}<sup>2</sup> than ${lo}<sup>2</sup>?`, board: `${hi}^{2} - ${lo}^{2}`,
    solution: [`Here <i>n</i> = ${lo}, so the difference is 2 · ${lo} + 1.`, `= ${ans(right)}.`] }, right,
  numCheck(right, `Yes: 2 · ${lo} + 1 = ${right}. Consecutive squares always differ by an odd number.`,
    [{ v: 1, mc: MC.fnSum, say: `(<i>n</i> + 1)<sup>2</sup> is not <i>n</i><sup>2</sup> + 1: the middle term 2<i>n</i> is there too.` },
      { v: 2 * lo, say: 'Do not forget the + 1.' },
      { v: 2 * hi + 1, say: `<i>n</i> is the smaller number, ${lo}.` }],
    `Use 2<i>n</i> + 1 with <i>n</i> = ${lo}.`));
});
export const pyTriple: Gen = (R, n) => retry(R, () => {
  const x = int(R, 2, 6), y = int(R, 1, x - 1);
  const a = x * x - y * y, b = 2 * x * y, c = x * x + y * y;
  const txt = (p: number, q: number, h: number) => `legs ${p} and ${q}, hypotenuse ${h}`;
  const isRight = (p: number, q: number, h: number) => p * p + q * q === h * h;
  const cand: { t: [number, number, number]; mc?: string; say: string }[] = [
    { t: [a, x * y, c], mc: MC.powOne, say: `The second leg is 2${X}${V('y')} = 2 · ${x} · ${y} = ${b}.` },
    { t: [a, c, b], say: `The hypotenuse is the longest side: ${X}<sup>2</sup> + ${V('y')}<sup>2</sup> = ${c}.` },
    { t: [x * x, y * y, c], say: `The first leg is ${X}<sup>2</sup> − ${V('y')}<sup>2</sup> = ${a}.` },
    { t: [(x - y) * (x - y), b, c], say: `(${X}<sup>2</sup> − ${V('y')}<sup>2</sup>) is ${a}, not (${X} − ${V('y')})<sup>2</sup>.` },
  ];
  const wr = cand.filter(w => !isRight(...w.t) && w.t[0] > 0 && w.t[1] > 0 && txt(...w.t) !== txt(a, b, c));
  return choiceItem(R, { id: `pyTriple-${n}`, family: 'pyTriple', prompt: `(${X}<sup>2</sup> + ${V('y')}<sup>2</sup>)<sup>2</sup> = (${X}<sup>2</sup> − ${V('y')}<sup>2</sup>)<sup>2</sup> + (2${X}${V('y')})<sup>2</sup> for every ${X} and ${V('y')}. Which right triangle with whole-number sides does ${X} = ${x}, ${V('y')} = ${y} give?`, board: `x = ${x},\\ y = ${y}`,
    solution: [`The legs: ${X}<sup>2</sup> − ${V('y')}<sup>2</sup> = ${a} and 2${X}${V('y')} = ${b}. The hypotenuse: ${X}<sup>2</sup> + ${V('y')}<sup>2</sup> = ${c}.`, `Check: ${a}<sup>2</sup> + ${b}<sup>2</sup> = ${a * a + b * b} = ${c}<sup>2</sup>.`] },
  [{ t: txt(a, b, c), ok: true, say: `Yes: ${a}<sup>2</sup> + ${b}<sup>2</sup> = ${c}<sup>2</sup>. The identity makes a Pythagorean triple from any ${X} > ${V('y')} > 0.` }, ...shuffle(R, wr).slice(0, 3).map(w => ({ t: txt(...w.t), mc: w.mc, say: w.say }))]);
});
