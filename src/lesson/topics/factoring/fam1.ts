// fam1.ts: stage 1 and the common-factor families: sum form vs product form, distribution in reverse, the area model
// of a trinomial read backwards, checking by expansion, numeric / monomial / negative GCF, the missing monomial
// factor, and dividing by a monomial. Pure: no DOM.
import { fr, int, pick, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { type Poly, F, T, evF, evP, expand, facHtml, facTex, lin, mul, P, polyHtml, polyTex, quad, collect, termHtml, termTex, pairs } from './fx';
import { type Gen, type Opt, MC, pn, Reroll, X, boxOf, choiceItem, nH, numCheck, numItem, nz, other, pairItem, retry, sgn, sgnT, sq } from './common';
import { gcd } from '../../runtime/item';

const sup = (e: number) => (e === 1 ? '' : `<sup>${e}</sup>`);
const xH = (e: number) => (e === 0 ? '' : `${X}${sup(e)}`);
const xT = (e: number) => (e === 0 ? '' : e === 1 ? 'x' : `x^{${e}}`);

// ===================== sum-vs-product-form =====================
interface Form { h: string; t: string; product: boolean; almost?: boolean; note?: string }
function forms(R: () => number): { prod: Form[]; sum: Form[] } {
  const a = int(R, 1, 9), b = other(R, 1, 9, [a]), k = int(R, 2, 12), d = int(R, 1, 9), m = int(R, 2, 9);
  return {
    prod: [
      { h: `(${X} + ${a})(${X} + ${b})`, t: `(x + ${a})(x + ${b})`, product: true },
      { h: `${k}${X}(${X} − ${d})`, t: `${k}x(x - ${d})`, product: true },
      { h: `(${X} + ${a})<sup>2</sup>`, t: `(x + ${a})^{2}`, product: true, note: 'A power is a repeated factor, so it counts as a product.' },
      { h: `${k}${sq}`, t: `${k}x^{2}`, product: true, note: 'A single term is already a product of its factors.' },
      { h: `${m}(${sq} − ${d * d})`, t: `${m}(x^{2} - ${d * d})`, product: true, note: `It is in factored form, though not completely factored: ${sq} − ${d * d} still factors.` },
    ],
    sum: [
      { h: `${X}(${X} + ${a}) + ${b}`, t: `x(x + ${a}) + ${b}`, product: false, almost: true },
      { h: `(${X} + ${a})(${X} + ${b}) + ${d}`, t: `(x + ${a})(x + ${b}) + ${d}`, product: false, almost: true },
      { h: `${m}(${X} + ${a}) − ${d}`, t: `${m}(x + ${a}) - ${d}`, product: false, almost: true },
      { h: `${k}${X} + ${m * a}`, t: `${k}x + ${m * a}`, product: false },
      { h: `${sq} + ${a + b}${X} + ${a * b}`, t: `x^{2} + ${a + b}x + ${a * b}`, product: false },
    ],
  };
}
export const formPick: Gen = (R, n) => retry(R, () => {
  const { prod, sum } = forms(R);
  const right = pick(R, prod);
  const wrongs = shuffle(R, sum.filter(s => s.almost)).slice(0, 2).concat(pick(R, sum.filter(s => !s.almost)));
  return choiceItem(R, { id: `formPick-${n}`, family: 'formPick', prompt: `Which of these is in factored form (the whole expression is one product)? ${shuffle(R, [right, ...wrongs].map(w => w.h)).join(';&nbsp; ')}`, board: '\\text{factored form} = \\text{one product}',
    solution: ['Look at the LAST operation: if it is adding or subtracting, the expression is a sum, even when its terms hold products.', `${right.h} is one product of factors.`] }, [
    { t: right.h, ok: true, say: `Yes: ${right.h} is one product. ${right.note ?? ''}`.trim() },
    ...wrongs.map(w => ({ t: w.h, mc: w.almost ? MC.sumOfProducts : undefined, say: w.almost ? `${w.h} has a product inside, but the last step is adding or subtracting: it is a sum.` : `${w.h} is a sum of terms.` })),
  ], { min: 4 });
});
export const formKind: Gen = (R, n) => retry(R, () => {
  const { prod, sum } = forms(R);
  const e = R() < 0.5 ? pick(R, prod) : pick(R, sum);
  const optP = 'Factored form: the whole expression is one product', optS = 'Sum form: the last step adds or subtracts';
  return choiceItem(R, { id: `formKind-${n}`, family: 'formKind', prompt: `Is ${e.h} in factored form or in sum form?`, board: e.t,
    solution: ['Find the last operation you would do to evaluate it.', e.product ? `${e.h}: the last step is multiplying. ${e.note ?? ''}`.trim() : `${e.h}: the last step is adding or subtracting.`] }, [
    { t: optP, ok: e.product, mc: !e.product && e.almost ? MC.sumOfProducts : undefined, say: e.product ? `Right: one product. ${e.note ?? ''}`.trim() : 'It holds a product, but the last step adds or subtracts, so it is a sum.' },
    { t: optS, ok: !e.product, say: e.product ? 'The last step here is multiplying: it is one product.' : 'Right: the last step adds or subtracts, so it is a sum.' },
  ], { min: 2, keep: true });
});

// ===================== reverse-distribution =====================
export const numGcfSum: Gen = (R, n) => retry(R, () => {
  const a = int(R, 2, 12), p = int(R, 2, 12), q = other(R, 1, 12, [p]);
  if (gcd(p, q) !== 1) throw new Reroll();
  const L = a * p, M = a * q;
  return numItem({ id: `numGcfSum-${n}`, family: 'numGcfSum', prompt: `Write ${L} + ${M} as one product: ${L} + ${M} = □ × (${p} + ${q}). What goes in the box?`, board: `${L} + ${M} = \\square \\times (${p} + ${q})`,
    solution: [`${L} = ${a} × ${p} and ${M} = ${a} × ${q}: both terms share the factor ${a}.`, `Distribution in reverse: ${L} + ${M} = ${ans(a)} × (${p} + ${q}) = ${a} × ${p + q} = ${L + M}.`] },
    a, numCheck(a, `Yes: ${a} × (${p} + ${q}) = ${a} × ${p + q} = ${L + M}, the same value.`, [{ v: L + M, say: `${L + M} is the sum itself. Which number multiplies (${p} + ${q}) to give it?` }], `Which number times ${p} gives ${L} and times ${q} gives ${M}?`));
});
export const distBack: Gen = (R, n) => retry(R, () => {
  const a = int(R, 2, 12), b = other(R, 1, 12, [a]);
  const right = F(a, lin(1, b));
  const pic = boxOf([T(a)], lin(1, b), 'all', facTex(right), { noteL: 'feet', noteT: 'feet' });
  return choiceItem(R, { id: `distBack-${n}`, family: 'distBack', ex: { target: evP(lin(a, a * b)) }, picture: pic,
    prompt: `A garden is split into two beds with areas ${a}${X} sq ft and ${a * b} sq ft, side by side. Which product gives the whole area ${a}${X} + ${a * b}?`, board: `${a}x + ${a * b} = \\,?`,
    solution: [`Both areas share the side ${a}: ${a}${X} = ${a} · ${X} and ${a * b} = ${a} · ${b}.`, `Read the distributive property backwards: ${a}${X} + ${a * b} = ${facHtml(right)}.`] }, [
    { t: facHtml(right), ok: true, ev: evF(right), say: `Yes: the shared side is ${a}, the other side is ${X} + ${b}. Same area for every ${X}.` },
    { t: facHtml(F(a, lin(1, a * b))), ev: evF(F(a, lin(1, a * b))), mc: MC.oneTerm, say: `Divide EVERY term by ${a}: ${a * b} ÷ ${a} = ${b}, so the second term inside is ${b}.` },
    { t: polyHtml(lin(1, b)), ev: evP(lin(1, b)), mc: MC.discards, say: `${X} + ${b} drops the factor ${a}. A factored form keeps every factor: ${a}(${X} + ${b}).` },
    { t: `${X} = ${nH(-b)}`, mc: MC.vsSolving, say: 'Factoring rewrites the expression; it does not solve an equation. Write the area as a product.' },
  ], { min: 4 });
});
export const sameValue: Gen = (R, n) => retry(R, () => {
  const a = int(R, 2, 9), p = int(R, 1, 6), q = int(R, 1, 12), x = int(R, 2, 9);
  if (gcd(p, q) !== 1) throw new Reroll();
  const v = a * (p * x + q);
  const sum = polyHtml(lin(a * p, a * q)), prod = facHtml(F(a, lin(p, q)));
  return choiceItem(R, { id: `sameValue-${n}`, family: 'sameValue', prompt: `Mia rewrites ${sum} as ${prod}. At ${X} = ${x}, how do the two values compare?`, board: `${polyTex(lin(a * p, a * q))} = ${facTex(F(a, lin(p, q)))}`,
    solution: [`At ${X} = ${x}: ${a * p} · ${x} + ${a * q} = ${v}, and ${a}(${p === 1 ? '' : p + ' · '}${x} + ${q}) = ${v}.`, 'A factored form is an equivalent rewrite: the same value for every x.'] }, [
    { t: `Both are ${v}: a factored form has the same value for every ${X}`, ok: true, say: `Yes: both give ${v}. Factoring rewrites the expression without changing its value.` },
    { t: `The factored form is smaller: it took the ${a} out`, mc: MC.changesValue, say: `The ${a} is still there, multiplying. Both give ${v}.` },
    { t: `They match at ${X} = ${x} only, not for every ${X}`, mc: MC.changesValue, say: 'The two forms are equal for EVERY x: distributing turns one into the other.' },
  ]);
});

// ===================== area-model-trinomial =====================
function smallPair(R: () => number): [number, number] {
  for (;;) { const m = int(R, 1, 6), k = int(R, 1, 12); if (m * k <= 12 && m <= k) return [m, k]; }
}
export const areaSides: Gen = (R, n) => retry(R, () => {
  const [m, k] = smallPair(R);
  const b = m + k, c = m * k;
  const right = F(undefined, lin(1, m), lin(1, k));
  const side = (u: number, v: number) => `${X} + ${u} and ${X} + ${v}`;
  const pic = boxOf(lin(1, m), lin(1, k), 'all', facTex(right));
  const others = pairs(c).filter(([u, v]) => u > 0 && !(u === m && v === k));
  const opts: Opt[] = [
    { t: side(m, k), ok: true, ev: evF(right), say: `Yes: the cells are ${sq}, ${m}${X}, ${k}${X} and ${c}, so the sides are ${X} + ${m} and ${X} + ${k}.` },
    { t: `${sq} and ${b}${X} + ${c}`, ev: evF(F(T(1, 2), quad(0, b, c))), mc: MC.termsAsSides, say: `Those are terms of the area, not sides: ${sq} times (${b}${X} + ${c}) is not ${sq} + ${b}${X} + ${c}.` },
    ...others.map(([u, v]) => ({ t: side(u, v), ev: evF(F(undefined, lin(1, u), lin(1, v))), mc: MC.sumUnchecked, say: `${u} · ${v} = ${c}, but the strips would add to ${u + v}${X}, not ${b}${X}.` })),
    { t: side(b, c), ev: evF(F(undefined, lin(1, b), lin(1, c))), say: `Then the corner would be ${b * c}, not ${c}. Read the sides off the cells.` },
  ];
  return choiceItem(R, { id: `areaSides-${n}`, family: 'areaSides', ex: { target: evP(quad(1, b, c)) }, picture: pic, prompt: `The four cells of this rectangle have total area ${sq} + ${b}${X} + ${c}. Which two side lengths make it?`, board: `x^{2} + ${b}x + ${c} = (\\;?\\;)(\\;?\\;)`,
    solution: [`The ${sq} cell is ${X} by ${X}; the ${c} cell is ${m} by ${k}; the strips ${m}${X} and ${k}${X} fill the rest.`, `So the sides are ${X} + ${m} and ${X} + ${k}: ${sq} + ${b}${X} + ${c} = ${facHtml(right)}.`] }, opts);
});
export const areaPair: Gen = (R, n) => {
  const [m, k] = smallPair(R);
  const b = m + k, c = m * k;
  const pic = boxOf(lin(1, m), lin(1, k), 'all', facTex(F(undefined, lin(1, m), lin(1, k))));
  return pairItem({ id: `areaPair-${n}`, family: 'areaPair', picture: pic, prompt: `The box shows the area ${sq} + ${b}${X} + ${c} as four cells. Write it as a product of its sides (smaller number first).`,
    board: `x^{2} + ${b}x + ${c} = (x + \\square)(x + \\square)`, pairLead: `(${X} +`, pairOp: `)(${X} +`, pairTail: ')',
    solution: [`Each strip is a number times ${X}: ${m}${X} has side ${m}, ${k}${X} has side ${k}, and ${m} · ${k} = ${c} is the corner.`, `(${X} + ${ans(m)})(${X} + ${ans(k)})`] },
    m, k, `Yes: (${X} + ${m})(${X} + ${k}) = ${sq} + ${b}${X} + ${c}.`,
    (x, y) => (x * y === c && x + y !== b ? { mc: MC.sumUnchecked, say: `${x} · ${y} = ${c}, but the two strips must add to ${b}${X}.` } : null), `Read the numbers off the strips: which number times ${X} is each strip?`);
};
export const areaParallel: Gen = (R, n) => {
  const [m, k] = smallPair(R);
  const b = m + k, c = m * k, V = 100 + 10 * b + c;
  return numItem({ id: `areaParallel-${n}`, family: 'areaParallel', prompt: `${sq} + ${b}${X} + ${c} = (${X} + ${m})(${X} + ${k}). Put in ${X} = 10: the area is ${V}. Fill in ${V} = □ × ${10 + k}.`, board: `${V} = \\square \\times ${10 + k}`,
    solution: [`At ${X} = 10 the sides are 10 + ${m} and 10 + ${k}.`, `${V} = ${ans(10 + m)} × ${10 + k}.`] },
    10 + m, numCheck(10 + m, `Yes: ${10 + m} × ${10 + k} = ${V}. The factors of the polynomial become the factors of the number.`, [{ v: m, say: `At ${X} = 10 the side ${X} + ${m} is 10 + ${m}.` }], `The side ${X} + ${m} at ${X} = 10.`));
};

// ===================== verify-by-expansion =====================
interface Claim { b: number; c: number; p: number; q: number; kind: 'ok' | 'mid' | 'const' }
function claimOf(R: () => number): Claim {
  for (;;) {
    const p = nz(R, -9, 9), q = nz(R, -9, 9);
    if (Math.abs(p * q) > 12 || p + q === 0 || Math.abs(p + q) > 12) continue;
    const kind = pick(R, ['ok', 'mid', 'mid', 'const'] as const);
    if (kind === 'ok') return { b: p + q, c: p * q, p, q, kind };
    if (kind === 'mid') {
      // the claim has the right product: either both signs swapped, or another pair with the same product
      const alts = pairs(p * q).filter(([u, v]) => u + v !== p + q && Math.abs(u + v) <= 12);
      if (!alts.length) continue;
      const [u, v] = pick(R, alts);
      return { b: p + q, c: p * q, p: u, q: v, kind };
    }
    // the constant is off: one number changed by 1, the sum kept
    const u = p + 1, v = q - 1;
    if (!u || !v || u * v === p * q) continue;
    return { b: p + q, c: p * q, p: u, q: v, kind };
  }
}
const bin = (p: number) => `(${X}${sgn(p)})`;
const binT = (p: number) => `(x${sgnT(p)})`;
const triH = (b: number, c: number) => polyHtml(quad(1, b, c));
const triT = (b: number, c: number) => polyTex(quad(1, b, c));
export const verifyJudge: Gen = (R, n) => retry(R, () => {
  const C = claimOf(R);
  const e = collect(mul(lin(1, C.p), lin(1, C.q)));
  const eh = polyHtml(e);
  return choiceItem(R, { id: `verifyJudge-${n}`, family: 'verifyJudge', prompt: `Dev says ${triH(C.b, C.c)} = ${bin(C.p)}${bin(C.q)}. Expand his product and compare every coefficient. Is he right?`, board: `${triT(C.b, C.c)} \\overset{?}{=} ${binT(C.p)}${binT(C.q)}`,
    solution: [`Expand: ${bin(C.p)}${bin(C.q)} = ${eh}.`, `Compare with ${triH(C.b, C.c)}: ${C.kind === 'ok' ? 'every coefficient matches.' : C.kind === 'mid' ? `the middle coefficient is ${nH(C.p + C.q)}, not ${nH(C.b)}.` : `the constant is ${nH(C.p * C.q)}, not ${nH(C.c)}.`}`] }, [
    { t: 'Right: every coefficient matches', ok: C.kind === 'ok', mc: C.kind === 'mid' ? MC.firstLast : undefined, say: C.kind === 'ok' ? `Yes: ${eh}, exactly.` : `The product gives ${eh}. ${C.kind === 'mid' ? 'The first and last terms match, but check the middle one too.' : 'Compare the constants.'}` },
    { t: 'Wrong: the middle coefficient is different', ok: C.kind === 'mid', say: C.kind === 'mid' ? `Yes: ${nH(C.p)} + ${pn(C.q)} = ${nH(C.p + C.q)}, not ${nH(C.b)}.` : `The middle is ${nH(C.p + C.q)}${C.kind === 'ok' ? ', which matches' : ''}. Look again: ${eh}.` },
    { t: 'Wrong: the constant term is different', ok: C.kind === 'const', say: C.kind === 'const' ? `Yes: ${nH(C.p)} · ${pn(C.q)} = ${nH(C.p * C.q)}, not ${nH(C.c)}.` : `${nH(C.p)} · ${pn(C.q)} = ${nH(C.p * C.q)}, which matches. Look at the middle.` },
  ], { keep: true });
});
export const verifyMid: Gen = (R, n) => {
  const C = claimOf(R);
  const v = C.p + C.q;
  return numItem({ id: `verifyMid-${n}`, family: 'verifyMid', prompt: `Ava says ${triH(C.b, C.c)} = ${bin(C.p)}${bin(C.q)}. Expand her product. What is the coefficient of ${X} it gives?`, board: `${binT(C.p)}${binT(C.q)} = x^{2} + \\square x ${C.p * C.q < 0 ? '-' : '+'} ${Math.abs(C.p * C.q)}`,
    solution: [`The two middle cells are ${nH(C.q)}${X} and ${nH(C.p)}${X}.`, `They add to ${ans(nH(v))}${X}${v === C.b ? `, which matches ${nH(C.b)}${X}.` : `: not ${nH(C.b)}${X}, so the claim is wrong.`}`] },
    v, numCheck(v, `Yes: ${nH(C.p)} + ${pn(C.q)} = ${nH(v)}.${v === C.b ? ' It matches.' : ` So her factoring is wrong: the middle should be ${nH(C.b)}.`}`, [
      { v: C.b, mc: MC.firstLast, say: `That is the coefficient she WANTED. Expand her product: ${nH(C.p)}${X} + ${nH(C.q)}${X}.` },
      { v: C.p * C.q, say: `${nH(C.p * C.q)} is the constant. The ${X} term comes from the two middle cells.` },
    ], `Add the two middle cells: ${nH(C.q)}${X} + ${nH(C.p)}${X}.`));
};

// ===================== numeric-gcf-extraction =====================
interface GPoly { g: number; inner: Poly; whole: Poly }
function gpoly(R: () => number, gOne = false): GPoly {
  for (;;) {
    const g = gOne ? 1 : pick(R, [2, 3, 4, 5, 6, 6, 8, 9, 10, 12, 4, 6]);
    const three = R() < 0.6;
    const a = int(R, 1, 9), b = int(R, 1, 12), c = int(R, 1, 12);
    const inner = three ? quad(a, b, c) : R() < 0.5 ? quad(a, b, 0) : lin(a, c);
    const cs = inner.map(t => t.c.p);
    if (cs.reduce((s, v) => gcd(s, v), 0) !== 1) continue;
    if (cs.some(v => v * g > 100)) continue;
    if (gOne && cs.every(v => v === 1)) continue;
    return { g, inner, whole: inner.map(t => T(t.c.p * g, t.x)) };
  }
}
export const gcfNum: Gen = (R, n) => {
  const G = gpoly(R, R() < 0.2);
  const cs = G.whole.map(t => t.c.p);
  const smaller = [2, 3, 4, 5, 6].filter(d => d < G.g && G.g % d === 0);
  return numItem({ id: `gcfNum-${n}`, family: 'gcfNum', prompt: `What is the greatest common factor of the coefficients of ${polyHtml(G.whole)}?`, board: polyTex(G.whole),
    solution: [`The coefficients are ${cs.join(', ')}.`, G.g === 1 ? `They share no factor except 1, so the GCF is ${ans(1)}.` : `The largest number that divides all of them is ${ans(G.g)}: ${polyHtml(G.whole)} = ${G.g}(${polyHtml(G.inner)}).`] },
    G.g, numCheck(G.g, G.g === 1 ? 'Yes: the GCF is 1, so there is no common factor to take out.' : `Yes: ${G.g} divides ${cs.join(', ')}, and nothing larger does.`, [
      ...smaller.map(d => ({ v: d, mc: MC.stops, say: `${d} is a common factor, but not the greatest: ${G.g} divides every coefficient too.` })),
      { v: Math.min(...cs), say: `${Math.min(...cs)} does not divide every coefficient.` },
    ], `Find the largest whole number that divides ${cs.join(', ')}.`));
};
export const gcfOut: Gen = (R, n) => retry(R, () => {
  const G = gpoly(R);
  if (G.g < 2) throw new Reroll();
  const right = F(G.g, G.inner);
  const d = [2, 3, 4, 5, 6].filter(x => x < G.g && G.g % x === 0).pop();
  const oneTerm = [G.inner[0]!, ...G.whole.slice(1)];
  const opts: Opt[] = [
    { t: facHtml(right), ok: true, ev: evF(right), say: `Yes: ${G.g} is the greatest common factor, and every term was divided by it.` },
    { t: facHtml(F(G.g, oneTerm)), ev: evF(F(G.g, oneTerm)), mc: MC.oneTerm, say: `Divide EVERY term by ${G.g}, not only the first one.` },
    { t: polyHtml(G.inner), ev: evP(G.inner), mc: MC.discards, say: `${polyHtml(G.inner)} lost the factor ${G.g}: write ${G.g}(${polyHtml(G.inner)}).` },
  ];
  if (d) opts.push({ t: facHtml(F(d, G.whole.map(t => T(t.c.p / d, t.x)))), same: true, mc: MC.stops, say: `It is equal, but ${d} is not the GREATEST common factor: the bracket still shares a factor ${G.g / d}.` });
  return choiceItem(R, { id: `gcfOut-${n}`, family: 'gcfOut', ex: { target: evP(G.whole) }, picture: boxOf([T(G.g)], G.inner, 'all', facTex(right)), prompt: `Factor the greatest common factor out of ${polyHtml(G.whole)}.`, board: `${polyTex(G.whole)} = \\,?`,
    solution: [`The GCF of ${G.whole.map(t => t.c.p).join(', ')} is ${G.g}.`, `Divide every term by ${G.g}: ${polyHtml(G.whole)} = ${facHtml(right)}.`] }, opts);
});

// ===================== monomial-quotient =====================
interface MonoQ { d: number; e: number; q: number; f: number; y: boolean }
function monoQ(R: () => number): MonoQ {
  for (;;) {
    const kind = pick(R, ['plain', 'plain', 'self', 'xy']);
    if (kind === 'self') { const d = int(R, 2, 12), e = int(R, 1, 3); return { d, e, q: 1, f: 0, y: false }; }
    const d = int(R, 2, 12), q = int(R, 1, 9), e = int(R, 1, 3), f = int(R, 1, 3);
    if (d * q > 100) continue;
    return { d, e, q, f, y: kind === 'xy' };
  }
}
const mono = (c: number, e: number, y = false) => `${c === 1 && (e || y) ? '' : c}${xH(e)}${y ? '<i>y</i>' : ''}`;
const monoT = (c: number, e: number, y = false) => `${c === 1 && (e || y) ? '' : c}${xT(e)}${y ? 'y' : ''}`;
const evM = (c: number, e: number, y = false) => (x: number) => c * x ** e * (y ? x + 1 : 1);
export const missingMono: Gen = (R, n) => retry(R, () => {
  const M = monoQ(R);
  const div = R() < 0.4;
  const D = mono(M.d, M.e, M.y), Pr = mono(M.d * M.q, M.e + M.f, M.y);
  const right = mono(M.q, M.f), self = M.q === 1 && M.f === 0;
  const opts: Opt[] = [
    { t: right, ok: true, ev: evM(M.q, M.f), say: self ? `Yes: ${D} · 1 = ${D}. A term divided by itself leaves 1.` : `Yes: ${D} · ${right} = ${Pr}. The exponents add: ${M.e} + ${M.f} = ${M.e + M.f}.` },
    { t: mono(M.q, M.e + M.f), ev: evM(M.q, M.e + M.f), say: `Check: ${D} · ${mono(M.q, M.e + M.f)} has exponent ${2 * M.e + M.f}. Subtract the exponents.` },
  ];
  if (self) opts.push({ t: '0', ev: () => 0, mc: MC.zeroSelf, say: `${D} times 0 is 0, not ${D}. The missing factor is 1.` });
  if ((M.e + M.f) % M.e === 0) opts.push({ t: mono(M.q, (M.e + M.f) / M.e), ev: evM(M.q, (M.e + M.f) / M.e), mc: MC.divExp, say: `Subtract the exponents, do not divide them: ${M.e + M.f} − ${M.e} = ${M.f}.` });
  opts.push({ t: mono(M.d * M.q - M.d || 1, M.f), ev: evM(M.d * M.q - M.d || 1, M.f), say: `The coefficients multiply: ${M.d} · □ = ${M.d * M.q}, so the coefficient is ${M.q}.` });
  const cond = M.y ? `${X} ≠ 0 and <i>y</i> ≠ 0` : `${X} ≠ 0`;
  return choiceItem(R, { id: `missingMono-${n}`, family: 'missingMono',
    prompt: div ? `For ${cond}: ${Pr} ÷ ${D} = ?` : `Find the missing factor: ${D} · □ = ${Pr} (true for every ${X}).`,
    board: div ? `\\dfrac{${monoT(M.d * M.q, M.e + M.f, M.y)}}{${monoT(M.d, M.e, M.y)}}` : `${monoT(M.d, M.e, M.y)} \\cdot \\square = ${monoT(M.d * M.q, M.e + M.f, M.y)}`,
    solution: [`Coefficients: ${M.d * M.q} ÷ ${M.d} = ${M.q}. Powers of ${X}: ${M.e + M.f} − ${M.e} = ${M.f}${M.y ? '; the <i>y</i> cancels' : ''}.`, `So the missing factor is ${right}.`] }, opts);
});
export const zeroCond: Gen = (R, n) => retry(R, () => {
  const M = monoQ(R);
  if (M.y) M.y = false;
  const D = mono(M.d, M.e), Pr = mono(M.d * M.q, M.e + M.f), Q = mono(M.q, M.f);
  return choiceItem(R, { id: `zeroCond-${n}`, family: 'zeroCond', prompt: `${Pr} = ${D} · ${Q}. Which statement is true?`, board: `${monoT(M.d * M.q, M.e + M.f)} = ${monoT(M.d, M.e)} \\cdot ${M.q === 1 && M.f === 0 ? '1' : monoT(M.q, M.f)}`,
    solution: [`At ${X} = 0 the product ${D} · ${Q} is 0 = ${Pr}: the factoring holds for every ${X}.`, `But ${Pr} ÷ ${D} divides by ${D}, which is 0 at ${X} = 0: the quotient needs ${X} ≠ 0.`] }, [
    { t: `${Pr} = ${D} · ${Q} is true for every ${X}, but for ${Pr} ÷ ${D} = ${Q} you need ${X} ≠ 0`, ok: true, say: 'Yes: the product is fine at x equals 0; only the division needs a nonzero divisor.' },
    { t: `Both hold for every ${X}, even ${X} = 0`, mc: MC.noCond, say: `At ${X} = 0 the divisor ${D} is 0, and you cannot divide by 0. The quotient needs ${X} ≠ 0.` },
    { t: `Neither holds at ${X} = 0`, say: `At ${X} = 0 both sides of ${Pr} = ${D} · ${Q} are 0, so the product form still holds.` },
  ]);
});

// ===================== monomial-gcf =====================
interface MG { g: number; e: number; terms: [number, number][]; y?: boolean }
function mgcf(R: () => number): MG {
  for (;;) {
    const g = int(R, 2, 9), e = int(R, 1, 2);
    const n = R() < 0.6 ? 3 : 2;
    const exps = n === 3 ? [e + 2, e + 1, e] : [e + int(R, 1, 2), e];
    if (Math.max(...exps) > 4) continue;
    const cs = exps.map((_, i) => (i === exps.length - 1 && R() < 0.5 ? 1 : nz(R, -9, 9)));
    cs[0] = Math.abs(cs[0]!) || 1;
    if (cs.reduce((s, v) => gcd(s, v), 0) !== 1) continue;
    if (cs.some(c => Math.abs(c * g) > 100)) continue;
    return { g, e, terms: cs.map((c, i) => [c, exps[i]! - e]) };
  }
}
export const gcfMonoPick: Gen = (R, n) => retry(R, () => {
  const M = mgcf(R);
  const whole = M.terms.map(([c, d]) => T(c * M.g, d + M.e));
  const top = Math.max(...whole.map(t => t.x));
  const smaller = [2, 3].find(d => d < M.g && M.g % d === 0);
  const opts: Opt[] = [
    { t: mono(M.g, M.e), ok: true, ev: evM(M.g, M.e), say: `Yes: ${M.g} is the largest number that divides every coefficient, and ${xH(M.e)} is the lowest power of ${X}: it is in every term.` },
    { t: mono(M.g, top), ev: evM(M.g, top), mc: MC.highPow, say: `${xH(top)} is not in every term. The GCF takes the LOWEST power: ${xH(M.e)}.` },
    { t: mono(M.g, 0), ev: evM(M.g, 0), say: `Every term also has ${xH(M.e)}: it belongs in the GCF.` },
  ];
  if (smaller) opts.push({ t: mono(smaller, M.e), ev: evM(smaller, M.e), mc: MC.stops, say: `${smaller} divides every coefficient, but ${M.g} is greater and divides them too.` });
  else if (M.e > 1) opts.push({ t: mono(M.g, 1), ev: evM(M.g, 1), say: `${xH(M.e)} divides every term, so the GCF has ${xH(M.e)}, not just ${X}.` });
  return choiceItem(R, { id: `gcfMonoPick-${n}`, family: 'gcfMonoPick', prompt: `What is the greatest common factor of the terms of ${polyHtml(whole)}?`, board: polyTex(whole),
    solution: [`Numbers: the GCF of ${whole.map(t => Math.abs(t.c.p)).join(', ')} is ${M.g}. Powers of ${X}: the lowest is ${xH(M.e)}.`, `GCF = ${mono(M.g, M.e)}.`] }, opts);
});
export const gcfMonoOut: Gen = (R, n) => retry(R, () => {
  const M = mgcf(R);
  const k = T(M.g, M.e), inner = M.terms.map(([c, d]) => T(c, d)), whole = M.terms.map(([c, d]) => T(c * M.g, d + M.e));
  const right = F(k, inner);
  const lastOne = inner[inner.length - 1]!.x === 0 && Math.abs(inner[inner.length - 1]!.c.p) === 1;
  const top = Math.max(...whole.map(t => t.x));
  const opts: Opt[] = [
    { t: facHtml(right), ok: true, ev: evF(right), say: `Yes: ${termHtml(k)} times each term gives back ${polyHtml(whole)}.` },
    { t: facHtml(F(k, [inner[0]!, ...whole.slice(1)])), ev: evF(F(k, [inner[0]!, ...whole.slice(1)])), mc: MC.oneTerm, say: `Divide EVERY term by ${termHtml(k)}, not only the first.` },
    { t: polyHtml(inner), ev: evP(inner), mc: MC.discards, say: `That drops the factor ${termHtml(k)}. Keep it in front.` },
  ];
  if (lastOne) opts.push({ t: facHtml(F(k, inner.slice(0, -1))), ev: evF(F(k, inner.slice(0, -1))), mc: MC.hiddenOne, say: `${termHtml(whole[whole.length - 1]!)} ÷ ${termHtml(k)} = ${nH(inner[inner.length - 1]!.c.p)}: that ${nH(inner[inner.length - 1]!.c.p)} stays in the bracket.` });
  if (top > M.e) {
    const hk = T(M.g, top), hi = whole.map(t => ({ ...t, x: t.x - top }));
    if (hi.every(t => t.x >= 0)) opts.push({ t: facHtml(F(hk, hi)), ev: evF(F(hk, hi)), mc: MC.highPow, say: `The GCF takes the lowest power, ${xH(M.e)}.` });
    else opts.push({ t: facHtml(F(T(M.g, M.e + 1), inner)), ev: evF(F(T(M.g, M.e + 1), inner)), mc: MC.highPow, say: `${xH(M.e + 1)} is not in every term. The GCF takes the lowest power, ${xH(M.e)}.` });
  }
  return choiceItem(R, { id: `gcfMonoOut-${n}`, family: 'gcfMonoOut', ex: { target: evP(whole) }, picture: boxOf([k], inner, 'all', facTex(right)), prompt: `Factor the greatest common factor out of ${polyHtml(whole)}.`, board: `${polyTex(whole)} = \\,?`,
    solution: [`GCF: ${M.g} (numbers) times ${xH(M.e)} (the lowest power) = ${termHtml(k)}.`, `Divide each term by ${termHtml(k)}: ${polyHtml(whole)} = ${facHtml(right)}.`] }, opts);
});

// ===================== negative-gcf =====================
export const negOut: Gen = (R, n) => retry(R, () => {
  const g = int(R, 1, 6), e = int(R, 0, 1);
  const a = int(R, 1, 5), b = nz(R, -9, 9), c = R() < 0.4 ? nz(R, -9, 9) : 0;
  if (g === 1 && e === 0) throw new Reroll();
  const inner = c ? [T(a, 2 - (c ? 0 : 0)), T(b, 1), T(c)] : [T(a, 1), T(b)];
  if (inner.map(t => t.c.p).reduce((s, v) => gcd(s, v), 0) !== 1) throw new Reroll();
  const k = T(-g, e), whole = inner.map(t => T(-g * t.c.p, t.x + e));
  if (whole.some(t => Math.abs(t.c.p) > 30)) throw new Reroll();
  const right = F(k, inner);
  const flipFirstOnly = [inner[0]!, ...inner.slice(1).map(t => T(-t.c.p, t.x))];
  const negAll = inner.map(t => T(-t.c.p, t.x));
  return choiceItem(R, { id: `negOut-${n}`, family: 'negOut', ex: { target: evP(whole) }, picture: boxOf([k], inner, 'all', facTex(right)), prompt: `Factor ${polyHtml(whole)} by taking out ${termHtml(k)}.`, board: `${polyTex(whole)} = ${termTex(k).replace(/^-1$/, '-')}(\\;?\\;)`,
    solution: [`Divide every term by ${termHtml(k)}: a negative divisor changes the sign of EVERY term.`, `${polyHtml(whole)} = ${facHtml(right)}.`] }, [
    { t: facHtml(right), ok: true, ev: evF(right), say: 'Yes: every sign inside changed, and multiplying back gives the original.' },
    { t: facHtml(F(k, flipFirstOnly)), ev: evF(F(k, flipFirstOnly)), mc: MC.negFirst, say: `The negative factor flips the sign of EVERY term, not only the first. Multiply back to see it.` },
    { t: facHtml(F(k, negAll)), ev: evF(F(k, negAll)), say: `Multiply back: ${termHtml(k)} times that gives the opposite signs of the original.` },
    { t: facHtml(F(T(g, e), inner)), ev: evF(F(T(g, e), inner)), say: `Taking out ${termHtml(T(g, e))} keeps the signs; the question takes out ${termHtml(k)}.` },
  ]);
});
export const negOne: Gen = (R, n) => retry(R, () => {
  const b = nz(R, -12, 12), c = nz(R, -30, 30);
  const whole = quad(-1, b, c), inner = quad(1, -b, -c);
  const right = F(-1, inner);
  const first = quad(1, b, c), mixed = quad(1, -b, c);
  return choiceItem(R, { id: `negOne-${n}`, family: 'negOne', ex: { target: evP(whole) }, prompt: `Take out −1: ${polyHtml(whole)} = −( ? )`, board: `${polyTex(whole)} = -(\\;?\\;)`,
    solution: ['Dividing by −1 changes the sign of every term.', `${polyHtml(whole)} = ${facHtml(right)}.`] }, [
    { t: facHtml(right), ok: true, ev: evF(right), say: 'Yes: every sign changed. Multiply back by negative one to check.' },
    { t: facHtml(F(-1, first)), ev: evF(F(-1, first)), mc: MC.negFirst, say: 'Only the first sign changed. The minus in front flips EVERY term.' },
    { t: facHtml(F(-1, mixed)), ev: evF(F(-1, mixed)), mc: MC.negFirst, say: 'One term kept its sign. The minus in front flips every term.' },
    { t: facHtml(F(-1, quad(-1, b, c))), ev: evF(F(-1, quad(-1, b, c))), say: 'Multiply back: that gives the opposite of the original.' },
  ]);
});

// ===================== divide-by-monomial =====================
const evFn = (f: (x: number) => number) => f;
export const divTerms: Gen = (R, n) => retry(R, () => {
  const kind = pick(R, ['exact', 'exact', 'rest', 'const'] as const);
  const d = int(R, 2, 6);
  if (kind === 'exact') {
    const a = int(R, 1, 4), b = nz(R, -6, 6), cc = R() < 0.5 ? 1 : nz(R, -5, 5);
    const Q = [T(a, 2), T(b, 1), T(cc)], Dv = [T(d, 1)], N = Q.map(t => T(t.c.p * d, t.x + 1));
    const right = polyHtml(Q);
    const opts: Opt[] = [
      { t: right, ok: true, ev: evP(Q), say: `Yes: each term divided by ${d}${X}.` },
      { t: polyHtml([Q[0]!, ...N.slice(1)]), ev: evP([Q[0]!, ...N.slice(1)]), mc: MC.divFirst, say: `Divide EVERY term by ${d}${X}, not only the first.` },
      { t: polyHtml([T(a, 3), T(b, 2), T(cc, 1)]), ev: evP([T(a, 3), T(b, 2), T(cc, 1)]), say: `Divide the powers too: ${xH(3)} ÷ ${X} = ${sq}.` },
    ];
    if (Math.abs(cc) === 1) opts.push({ t: polyHtml(Q.slice(0, 2)), ev: evP(Q.slice(0, 2)), mc: MC.zeroSelf, say: `${termHtml(N[2]!)} ÷ ${d}${X} is ${nH(cc)}, not 0.` });
    return choiceItem(R, { id: `divTerms-${n}`, family: 'divTerms', picture: boxOf(Dv, Q, 'all', polyTex(Q)), prompt: `Divide (${X} ≠ 0): (${polyHtml(N)}) ÷ ${d}${X}`, board: `\\dfrac{${polyTex(N)}}{${d}x}`,
      solution: [`One fraction per term: ${N.map(t => `${termHtml(t)} ÷ ${d}${X}`).join(', ')}.`, `= ${right}.`] }, opts);
  }
  if (kind === 'rest') {
    const a = int(R, 1, 4), b = int(R, 1, 5), r = int(R, 1, d - 1 || 1);
    const N = [T(a * d, 2), T(b * d, 1), T(r)];
    const g = gcd(r, d), rn = r / g, rd = d / g;
    const tail = `${fr(rn, `${rd === 1 ? '' : rd}${X}`)}`;
    const right = `${polyHtml([T(a, 1), T(b)])} + ${tail}`;
    const f = (x: number) => a * x + b + r / (d * x);
    return choiceItem(R, { id: `divTerms-${n}`, family: 'divTerms', prompt: `Divide (${X} ≠ 0): (${polyHtml(N)}) ÷ ${d}${X}`, board: `\\dfrac{${polyTex(N)}}{${d}x}`,
      solution: [`One fraction per term: ${termHtml(N[0]!)} ÷ ${d}${X} = ${termHtml(T(a, 1))}, ${termHtml(N[1]!)} ÷ ${d}${X} = ${b}, ${r} ÷ ${d}${X} = ${tail}.`, `= ${right}. The last term is not a polynomial term, and that is fine.`] }, [
      { t: right, ok: true, ev: evFn(f), say: `Yes: three terms, three fractions. ${r} ÷ ${d}${X} stays as a fraction.` },
      { t: polyHtml([T(a, 1), T(b)]), ev: evP([T(a, 1), T(b)]), mc: MC.dropsNonPoly, say: `The ${r} does not disappear: ${r} ÷ ${d}${X} = ${tail}. The result does not have to be a polynomial.` },
      { t: polyHtml([T(a * d, 2), T(r)]), ev: evP([T(a * d, 2), T(r)]), mc: MC.cancelTerms, say: `You cannot cross out a term. Divide EACH term by ${d}${X}.` },
      { t: `${polyHtml([T(a, 1), T(b * d, 1)])} + ${r}`, ev: (x: number) => a * x + b * d * x + r, mc: MC.divFirst, say: `Divide every term by ${d}${X}, not only the first.` },
    ]);
  }
  // a constant result term: (6x² + 2x) ÷ 3x = 2x + 2/3
  const a = int(R, 1, 4), r = other(R, 1, 8, [d, 2 * d, 3 * d]);
  if (r % d === 0) throw new Reroll();
  const g = gcd(r, d);
  const N = [T(a * d, 2), T(r, 1)];
  const right = `${polyHtml([T(a, 1)])} + ${fr(r / g, d / g)}`;
  return choiceItem(R, { id: `divTerms-${n}`, family: 'divTerms', prompt: `Divide (${X} ≠ 0): (${polyHtml(N)}) ÷ ${d}${X}`, board: `\\dfrac{${polyTex(N)}}{${d}x}`,
    solution: [`${termHtml(N[0]!)} ÷ ${d}${X} = ${termHtml(T(a, 1))}; ${r}${X} ÷ ${d}${X} = ${fr(r / g, d / g)}.`, `= ${right}: still a polynomial.`] }, [
    { t: right, ok: true, ev: x => a * x + r / d, say: `Yes: ${r}${X} ÷ ${d}${X} = ${fr(r / g, d / g)}, a constant.` },
    { t: `${polyHtml([T(a, 1)])} + ${fr(d / g, r / g)}`, ev: x => a * x + d / r, say: `${r}${X} ÷ ${d}${X} is ${r} over ${d}, not the other way.` },
    { t: polyHtml([T(a, 1), T(r, 1)]), ev: evP([T(a, 1), T(r, 1)]), mc: MC.divFirst, say: `Divide EVERY term by ${d}${X}, not only the first.` },
    { t: polyHtml([T(a, 1)]), ev: evP([T(a, 1)]), say: `The ${r}${X} term divides to ${fr(r / g, d / g)}; keep it.` },
  ]);
});
export const divSigned: Gen = (R, n) => retry(R, () => {
  if (R() < 0.6) {
    const d = int(R, 2, 6), a = int(R, 1, 5), b = nz(R, -6, 6);
    const Q = [T(a, 1), T(b)], N = Q.map(t => T(-d * t.c.p, t.x + 1));
    const flipFirst = [T(a, 1), T(-b)], same = [T(-a, 1), T(-b)];
    return choiceItem(R, { id: `divSigned-${n}`, family: 'divSigned', picture: boxOf([T(-d, 1)], Q, 'all', polyTex(Q)), prompt: `Divide (${X} ≠ 0): (${polyHtml(N)}) ÷ (−${d}${X})`, board: `\\dfrac{${polyTex(N)}}{-${d}x}`,
      solution: ['Dividing by a negative changes the sign of every term.', `${N.map(t => `${termHtml(t)} ÷ (−${d}${X}) = ${termHtml(T(-t.c.p / d, t.x - 1))}`).join('; ')}: ${polyHtml(Q)}.`] }, [
      { t: polyHtml(Q), ok: true, ev: evP(Q), say: 'Yes: every term divided by negative ' + d + 'x, every sign changed.' },
      { t: polyHtml(flipFirst), ev: evP(flipFirst), mc: MC.negFirst, say: 'The negative divisor changes the sign of EVERY term, not only the first.' },
      { t: polyHtml(same), ev: evP(same), say: `Negative ÷ negative is positive: ${termHtml(N[0]!)} ÷ (−${d}${X}) = ${termHtml(T(a, 1))}.` },
      { t: polyHtml([T(a, 1), N[1]!]), ev: evP([T(a, 1), N[1]!]), mc: MC.divFirst, say: 'Divide every term, not only the first.' },
    ]);
  }
  // rational coefficients: (3/4 x³ − 1/2 x²) ÷ (1/4 x) = 3x² − 2x
  const dd = pick(R, [2, 3, 4, 6]), a = int(R, 1, 5), b = nz(R, -5, 5);
  const q = (p: number, d: number) => ({ p, d });
  void q;
  const Qp = [T(a, 2), T(b, 1)];
  const N = [{ c: { p: a, q: dd }, x: 3, y: 0 }, { c: { p: b, q: dd }, x: 2, y: 0 }].map(t => {
    const g = gcd(t.c.p, t.c.q); return { c: { p: t.c.p / g, q: t.c.q / g }, x: t.x, y: 0 };
  });
  const D = { c: { p: 1, q: dd }, x: 1, y: 0 };
  const firstOnly = [T(a, 2), N[1]!];
  const times = [{ c: { p: a, q: dd * dd }, x: 4, y: 0 }, { c: { p: b, q: dd * dd }, x: 3, y: 0 }].map(t => { const g = gcd(t.c.p, t.c.q); return { c: { p: t.c.p / g, q: t.c.q / g }, x: t.x, y: 0 }; });
  return choiceItem(R, { id: `divSigned-${n}`, family: 'divSigned', prompt: `Divide (${X} ≠ 0): (${polyHtml(N)}) ÷ ${termHtml(D)}`, board: `\\dfrac{${polyTex(N)}}{${termTex(D)}}`,
    solution: [`Dividing by ${fr(1, dd)}${X} is multiplying by ${dd} and dividing by ${X}, term by term.`, `= ${polyHtml(Qp)}.`] }, [
    { t: polyHtml(Qp), ok: true, ev: evP(Qp), say: `Yes: each term times ${dd}, and one power of ${X} less.` },
    { t: polyHtml(firstOnly), ev: evP(firstOnly), mc: MC.divFirst, say: 'Divide EVERY term, not only the first.' },
    { t: polyHtml(times), ev: evP(times), say: `That multiplies by ${fr(1, dd)}${X}. Dividing by ${fr(1, dd)} is multiplying by ${dd}.` },
    { t: polyHtml([T(a, 3), T(b, 2)]), ev: evP([T(a, 3), T(b, 2)]), say: `Divide the powers too: one ${X} less in each term.` },
  ]);
});
void sq; void sgn; void P;
