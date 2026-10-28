// fam2.ts: factoring quadratics: x² + bx + c in every sign case (sum-product search), difference of squares,
// perfect-square trinomials, grouping, the ac method, prime over the integers, and factoring completely.
// Pure: no DOM.
import { int, pick, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { type Fac, type Poly, F, Fp, T, equal, evF, evP, expand, facHtml, facTex, isComplete, isSquare, lin, pairs, polyHtml, polyTex, quad, sumProd } from './fx';
import { type Gen, type Opt, MC, pn, Reroll, X, boxOf, choiceItem, nH, numCheck, numItem, nz, pairItem, retry, sq } from './common';
import { gcd } from '../../runtime/item';

const B = (m: number, n: number) => F(undefined, lin(1, m), lin(1, n));
const tri = (b: number, c: number) => quad(1, b, c);

// ===================== x² + bx + c: the three sign cases =====================
type Kind = 'pos' | 'neg' | 'opp';
function monic(R: () => number, kind: Kind): [number, number] {
  for (;;) {
    let m = int(R, 1, 12), n = int(R, 1, 12);
    if (kind === 'pos' && R() < 0.35) { m = int(R, 1, 6); n = int(R, 1, 10); }   // small constants first
    if (m * n > 100 || m === n && kind !== 'pos') continue;
    if (kind === 'neg') { m = -m; n = -n; }
    if (kind === 'opp') { if (m === n) continue; if (R() < 0.5) m = -m; else n = -n; }
    if (m + n === 0) continue;
    if (kind === 'opp' && R() < 0.25 && Math.abs(m + n) !== 1) continue;   // b = ±1 more often
    return m <= n ? [m, n] : [n, m];
  }
}
const KIND_OF: Record<string, Kind> = { 'monic-positive': 'pos', 'monic-both-negative': 'neg', 'monic-opposite-signs': 'opp' };
function signSay(kind: Kind, m: number, n: number): string {
  const b = m + n, c = m * n;
  if (kind === 'pos') return `${c} is positive and ${b} is positive: both numbers are positive.`;
  if (kind === 'neg') return `${c} is positive, so the numbers have the same sign; ${nH(b)} is negative, so both are negative.`;
  return `${nH(c)} is negative, so the signs are opposite; the larger one takes the sign of ${nH(b)}.`;
}
function mkMonicPair(fam: string, kind0: Kind): Gen {
  return (R, n, sg) => {
    const kind = KIND_OF[sg ?? ''] ?? kind0;
    const [m, k] = monic(R, kind);
    const b = m + k, c = m * k;
    const P0 = tri(b, c);
    return pairItem({ id: `${fam}-${n}`, family: fam, picture: boxOf(lin(1, m), lin(1, k), 'corners', facTex(B(m, k))),
      prompt: `Factor ${polyHtml(P0)}: find the two numbers (smaller first; a number can be negative).`, board: `${polyTex(P0)} = (x + \\square)(x + \\square)`,
      pairLead: `(${X} +`, pairOp: `)(${X} +`, pairTail: ')',
      solution: [`Two numbers with product ${nH(c)} AND sum ${nH(b)}. ${signSay(kind, m, k)}`, `${nH(m)} · ${pn(k)} = ${nH(c)} and ${nH(m)} + ${pn(k)} = ${nH(b)}: the numbers are ${ans(nH(m))} and ${ans(nH(k))}, so ${polyHtml(P0)} = ${facHtml(B(m, k))}.`] },
      m, k, `Yes: product ${nH(c)}, sum ${nH(b)}: ${facHtml(B(m, k))}.`,
      (x, y) => {
        if (x * y === -c && Math.abs(x * y) === Math.abs(c) && (x < 0) !== (y < 0) && c > 0) return { mc: MC.minusOpposite, say: `Opposite signs multiply to a NEGATIVE number, but ${c} is positive: both numbers are ${b < 0 ? 'negative' : 'positive'}.` };
        if (x * y === c && x + y === -b) return { mc: MC.largerReversed, say: `The sum comes out ${nH(-b)}: the larger number must take the sign of ${nH(b)}.` };
        if (x * y === c && x + y !== b) return { mc: MC.sumUnchecked, say: `${nH(x)} · ${pn(y)} = ${nH(c)}, but ${nH(x)} + ${pn(y)} = ${nH(x + y)}, not ${nH(b)}. Check the sum too.` };
        if (x * y === b && x + y === c) return { mc: MC.rolesSwapped, say: `Those multiply to ${nH(b)} and add to ${nH(c)}: swapped. The PRODUCT is the constant ${nH(c)}, the SUM is ${nH(b)}.` };
        return null;
      }, `List the factor pairs of ${nH(c)} and find the one that adds to ${nH(b)}.`);
  };
}
export const monicPair = mkMonicPair('monicPair', 'pos');
export const monicNegPair = mkMonicPair('monicNegPair', 'neg');
export const monicOppPair = mkMonicPair('monicOppPair', 'opp');

function mkMonicPick(fam: string, kind0: Kind | 'mixed'): Gen {
  return (R, n, sg) => retry(R, () => {
    const kind: Kind = kind0 === 'mixed' ? pick(R, ['pos', 'neg', 'opp', 'opp'] as const) : KIND_OF[sg ?? ''] ?? kind0;
    const [m, k] = monic(R, kind);
    const b = m + k, c = m * k;
    const P0 = tri(b, c), right = B(m, k);
    const o = (u: number, v: number, mc: string | undefined, say: string): Opt => ({ t: facHtml(B(u, v)), ev: evF(B(u, v)), mc, say });
    const opts: Opt[] = [{ t: facHtml(right), ok: true, ev: evF(right), say: `Yes: ${nH(m)} · ${pn(k)} = ${nH(c)} and ${nH(m)} + ${pn(k)} = ${nH(b)}.` }];
    if (c > 0) {
      opts.push(o(-m, k, MC.minusOpposite, `Opposite signs give a NEGATIVE product, but the constant ${c} is positive.`));
      opts.push(o(m, -k, MC.minusOpposite, `Opposite signs give a NEGATIVE product, but the constant ${c} is positive.`));
      opts.push(o(-m, -k, undefined, `That gives ${nH(-b)}${X} in the middle, not ${nH(b)}${X}.`));
      for (const [u, v] of pairs(c).filter(([u, v]) => (u > 0) === (m > 0) && u + v !== b)) opts.push(o(u, v, MC.sumUnchecked, `${nH(u)} · ${pn(v)} = ${c}, but ${nH(u)} + ${pn(v)} = ${nH(u + v)}, not ${nH(b)}.`));
      const sw = sumProd(c, b);
      if (sw) opts.push(o(sw[0], sw[1], MC.rolesSwapped, `Those multiply to ${nH(b)} and add to ${nH(c)}: the roles are swapped.`));
    } else {
      opts.push(o(-m, -k, MC.largerReversed, `That gives ${nH(-b)}${X}: the larger number must take the sign of ${nH(b)}.`));
      for (const [u, v] of pairs(c).filter(([u, v]) => u + v !== b && u + v !== -b)) opts.push(o(u, v, MC.sumUnchecked, `${nH(u)} · ${pn(v)} = ${nH(c)}, but they add to ${nH(u + v)}, not ${nH(b)}.`));
      opts.push(o(Math.abs(m), Math.abs(k), undefined, `Both positive multiply to a positive number, but the constant is ${nH(c)}.`));
    }
    const wrong = shuffle(R, opts.slice(1));
    // keep the signature slip of this case first
    wrong.sort((p, q) => Number(!!q.mc && q.mc !== MC.sumUnchecked) - Number(!!p.mc && p.mc !== MC.sumUnchecked));
    return choiceItem(R, { id: `${fam}-${n}`, family: fam, ex: { target: evP(P0) }, picture: boxOf(lin(1, m), lin(1, k), 'corners', facTex(right)), prompt: `Factor ${polyHtml(P0)}.`, board: `${polyTex(P0)} = \\,?`,
      solution: [`Two numbers with product ${nH(c)} and sum ${nH(b)}. ${signSay(kind, m, k)}`, `${nH(m)} and ${nH(k)}: ${polyHtml(P0)} = ${facHtml(right)}.`] }, [opts[0]!, ...wrong]);
  });
}
export const monicPick = mkMonicPick('monicPick', 'pos');
export const monicNegPick = mkMonicPick('monicNegPick', 'neg');
export const monicMixed = mkMonicPick('monicMixed', 'mixed');

// ===================== difference-of-squares =====================
export const dosPick: Gen = (R, n) => retry(R, () => {
  const kind = pick(R, ['dos', 'dos', 'dos', 'sum', 'nonsq'] as const);
  const a = R() < 0.6 ? 1 : int(R, 2, 5), k = int(R, 1, 10);
  if (gcd(a, k) !== 1) throw new Reroll();
  const A = (s: number) => lin(a, s);
  const nope = 'Cannot be factored over the integers';
  if (kind === 'dos') {
    const P0 = quad(a * a, 0, -k * k), right = F(undefined, A(k), A(-k));
    const opts: Opt[] = [
      { t: facHtml(right), ok: true, ev: evF(right), say: `Yes: ${polyHtml(P0)} = (${a === 1 ? '' : a}${X})<sup>2</sup> − ${k}<sup>2</sup> = (A + B)(A − B).` },
      { t: facHtml(Fp(undefined, [A(-k)], [2])), ev: evF(Fp(undefined, [A(-k)], [2])), mc: MC.dosSquared, say: `(A − B)² has a middle term −2AB. A difference of squares is (A + B)(A − B): the middle terms cancel.` },
      { t: facHtml(Fp(undefined, [A(k)], [2])), ev: evF(Fp(undefined, [A(k)], [2])), say: 'A square of a sum has a middle term. Here there is none: (A + B)(A − B).' },
      { t: nope, say: `${a * a === 1 ? sq : `${a * a}${sq}`} and ${k * k} are both squares, with a minus between them: it factors.` },
    ];
    if (a > 1) opts.push({ t: facHtml(F(undefined, lin(a * a, k), lin(a * a, -k))), ev: evF(F(undefined, lin(a * a, k), lin(a * a, -k))), say: `${a * a}${sq} is (${a}${X})²: the factors start with ${a}${X}.` });
    return choiceItem(R, { id: `dosPick-${n}`, family: 'dosPick', ex: { target: evP(P0) }, picture: boxOf(A(k), A(-k), 'corners', facTex(right)), prompt: `Factor over the integers, or say it cannot be done: ${polyHtml(P0)}`, board: `${polyTex(P0)} = \\,?`,
      solution: [`${polyHtml(P0)} = (${a === 1 ? '' : a}${X})<sup>2</sup> − ${k}<sup>2</sup>: a difference of squares, A² − B² = (A + B)(A − B).`, `= ${facHtml(right)}. The middle cells ${a * k}${X} and −${a * k}${X} cancel.`] }, opts, { max: 3 });
  }
  if (kind === 'sum') {
    const P0 = quad(a * a, 0, k * k);
    if (a > 1) throw new Reroll();
    return choiceItem(R, { id: `dosPick-${n}`, family: 'dosPick', prompt: `Factor over the integers, or say it cannot be done: ${polyHtml(P0)}`, board: `${polyTex(P0)} = \\,?`,
      solution: [`${polyHtml(P0)} is a SUM of squares. (A + B)(A − B) gives a minus, (A ± B)² gives a middle term.`, `No pair of integers multiplies to ${k * k} and adds to 0 with the same sign: ${nope.toLowerCase()}.`] }, [
      { t: nope, ok: true, say: `Yes: a sum of squares ${sq} + ${k * k} does not factor over the integers.` },
      { t: facHtml(B(k, -k)), ev: evF(B(k, -k)), mc: MC.sumSquares, say: `Multiply back: (${X} + ${k})(${X} − ${k}) = ${sq} − ${k * k}, a DIFFERENCE. Here it is a sum.` },
      { t: facHtml(Fp(undefined, [lin(1, k)], [2])), ev: evF(Fp(undefined, [lin(1, k)], [2])), mc: MC.chunkTermwise, say: `(${X} + ${k})² = ${sq} + ${2 * k}${X} + ${k * k}: squaring a sum makes a middle term.` },
    ]);
  }
  // x² − m with m not a square
  const m = pick(R, [2, 3, 5, 6, 7, 8, 10, 11, 12, 15, 18, 20, 24, 27, 32, 40, 45, 50]);
  const s = Math.round(Math.sqrt(m)) || 1;
  const P0 = quad(1, 0, -m);
  return choiceItem(R, { id: `dosPick-${n}`, family: 'dosPick', prompt: `Factor over the integers, or say it cannot be done: ${polyHtml(P0)}`, board: `${polyTex(P0)} = \\,?`,
    solution: [`${m} is not a perfect square (${s}² = ${s * s}), so ${polyHtml(P0)} is not a difference of two integer squares.`, `No integer pair multiplies to −${m} and adds to 0: ${nope.toLowerCase()}.`] }, [
    { t: nope, ok: true, say: `Yes: ${m} is not a perfect square, so there are no integer factors.` },
    { t: facHtml(B(s, -s)), ev: evF(B(s, -s)), say: `Multiply back: that gives ${sq} − ${s * s}, not ${sq} − ${m}.` },
    { t: facHtml(Fp(undefined, [lin(1, -s)], [2])), ev: evF(Fp(undefined, [lin(1, -s)], [2])), mc: MC.dosSquared, say: 'A square of a difference has a middle term; this has none. And ' + m + ' is not a square.' },
  ]);
});
export const dosFill: Gen = (R, n) => retry(R, () => {
  const a = R() < 0.55 ? 1 : int(R, 2, 10), k = int(R, 1, 10);
  if (gcd(a, k) !== 1 || a * a > 100) throw new Reroll();
  const P0 = quad(a * a, 0, -k * k);
  const askA = a > 1 && R() < 0.5;
  const v = askA ? a : k;
  const board = askA ? `${polyTex(P0)} = (\\square x + ${k})(\\square x - ${k})` : `${polyTex(P0)} = (${a === 1 ? '' : a}x + \\square)(${a === 1 ? '' : a}x - \\square)`;
  return numItem({ id: `dosFill-${n}`, family: 'dosFill', picture: boxOf(lin(a, k), lin(a, -k), 'corners', facTex(F(undefined, lin(a, k), lin(a, -k)))),
    prompt: askA ? `Fill in the same number in both boxes: ${polyHtml(P0)} = (□${X} + ${k})(□${X} − ${k}).` : `Fill in the same number in both boxes: ${polyHtml(P0)} = (${a === 1 ? '' : a}${X} + □)(${a === 1 ? '' : a}${X} − □).`, board,
    solution: [`A² − B² = (A + B)(A − B) with A = ${a === 1 ? '' : a}${X} and B = ${k}: ${a * a === 1 ? '' : a * a}${sq} = (${a === 1 ? '' : a}${X})², ${k * k} = ${k}².`, `The box holds ${ans(v)}.`] },
    v, numCheck(v, `Yes: ${v}² = ${v * v}.`, [{ v: v * v, say: `${v * v} is the square. The box holds the number that SQUARES to it.` }, { v: v * v / 2, say: `Half is not the square root: which number times itself gives ${v * v}?` }], `Which number times itself gives ${v * v}?`));
});

// ===================== perfect-square-trinomial =====================
export const pstPick: Gen = (R, n) => retry(R, () => {
  const kind = pick(R, ['pst', 'pst', 'near', 'sum2'] as const);
  const a = R() < 0.6 ? 1 : int(R, 2, 4), k = int(R, 1, 9), s = R() < 0.5 ? 1 : -1;
  if (gcd(a, k) !== 1) throw new Reroll();
  const nope = 'Cannot be factored over the integers';
  if (kind === 'pst') {
    const P0 = quad(a * a, s * 2 * a * k, k * k), right = Fp(undefined, [lin(a, s * k)], [2]);
    return choiceItem(R, { id: `pstPick-${n}`, family: 'pstPick', ex: { target: evP(P0) }, picture: boxOf(lin(a, s * k), lin(a, s * k), 'corners', facTex(right)), prompt: `Factor ${polyHtml(P0)}.`, board: `${polyTex(P0)} = \\,?`,
      solution: [`First and last are squares: (${a === 1 ? '' : a}${X})² and ${k}². Middle test: 2 · ${a === 1 ? '' : a}${X} · ${k} = ${2 * a * k}${X}, sign ${s < 0 ? 'minus' : 'plus'}. It matches.`, `So ${polyHtml(P0)} = ${facHtml(right)}.`] }, [
      { t: facHtml(right), ok: true, ev: evF(right), say: `Yes: the middle term is 2 · ${a === 1 ? '' : a}${X} · ${k}, so it is a perfect square.` },
      { t: facHtml(F(undefined, lin(a, k), lin(a, -k))), ev: evF(F(undefined, lin(a, k), lin(a, -k))), mc: MC.dosSquared, say: '(A + B)(A − B) has no middle term. This one has a middle term.' },
      { t: facHtml(Fp(undefined, [lin(a, -s * k)], [2])), ev: evF(Fp(undefined, [lin(a, -s * k)], [2])), say: `The sign of the middle term is the sign inside: ${s < 0 ? 'minus' : 'plus'}.` },
      { t: facHtml(Fp(undefined, [lin(a * a, s * k * k)], [2])), ev: evF(Fp(undefined, [lin(a * a, s * k * k)], [2])), mc: MC.chunkTermwise, say: `Inside the square go the ROOTS: ${a === 1 ? '' : a}${X} and ${k}.` },
    ]);
  }
  if (kind === 'near') {
    // x² + 2kx + c with c not k²: first and last terms square, middle test fails
    const u = int(R, 1, 6), v = int(R, u + 2, 12);
    const b = u + v, c = u * v;
    if (b % 2 || !isSquare(c)) throw new Reroll();
    const h = b / 2;
    const P0 = tri(b, c), right = B(u, v);
    return choiceItem(R, { id: `pstPick-${n}`, family: 'pstPick', ex: { target: evP(P0) }, picture: boxOf(lin(1, u), lin(1, v), 'corners', facTex(right)), prompt: `Factor ${polyHtml(P0)}.`, board: `${polyTex(P0)} = \\,?`,
      solution: [`${c} = ${Math.sqrt(c)}², but 2 · ${X} · ${Math.sqrt(c)} = ${2 * Math.sqrt(c)}${X}, not ${b}${X}: NOT a perfect square.`, `Sum-product: ${u} · ${v} = ${c}, ${u} + ${v} = ${b}: ${facHtml(right)}.`] }, [
      { t: facHtml(right), ok: true, ev: evF(right), say: `Yes: ${u} · ${v} = ${c} and ${u} + ${v} = ${b}.` },
      { t: facHtml(Fp(undefined, [lin(1, Math.sqrt(c))], [2])), ev: evF(Fp(undefined, [lin(1, Math.sqrt(c))], [2])), mc: MC.pstUnchecked, say: `(${X} + ${Math.sqrt(c)})² has middle ${2 * Math.sqrt(c)}${X}, not ${b}${X}. Check the middle term.` },
      { t: facHtml(Fp(undefined, [lin(1, h)], [2])), ev: evF(Fp(undefined, [lin(1, h)], [2])), mc: MC.pstUnchecked, say: `(${X} + ${h})² ends in ${h * h}, not ${c}.` },
      { t: nope, say: `${u} · ${v} = ${c} and ${u} + ${v} = ${b}: it factors.` },
    ]);
  }
  // a² x² + k²: both squares, no middle term
  if (a === 1 && R() < 0.5) throw new Reroll();
  const P0 = quad(a * a, 0, k * k);
  return choiceItem(R, { id: `pstPick-${n}`, family: 'pstPick', prompt: `Factor ${polyHtml(P0)}, or say it cannot be done.`, board: `${polyTex(P0)} = \\,?`,
    solution: [`Both terms are squares, but (${a === 1 ? '' : a}${X} + ${k})² would need a middle term ${2 * a * k}${X}.`, `And it is a sum, not a difference: ${nope.toLowerCase()}.`] }, [
    { t: nope, ok: true, say: 'Yes: a sum of two squares with no middle term does not factor over the integers.' },
    { t: facHtml(Fp(undefined, [lin(a, k)], [2])), ev: evF(Fp(undefined, [lin(a, k)], [2])), mc: MC.pstUnchecked, say: `(${a === 1 ? '' : a}${X} + ${k})² has the middle term ${2 * a * k}${X}. Here there is none.` },
    { t: facHtml(F(undefined, lin(a, k), lin(a, -k))), ev: evF(F(undefined, lin(a, k), lin(a, -k))), mc: MC.sumSquares, say: `(A + B)(A − B) = A² − B²: a difference. Here it is a sum.` },
  ]);
});
export const pstMid: Gen = (R, n) => retry(R, () => {
  const a = R() < 0.5 ? 1 : int(R, 2, 5), k = int(R, 1, 10);
  if (gcd(a, k) !== 1 || a * a > 25) throw new Reroll();
  const v = 2 * a * k;
  const A = a === 1 ? '' : String(a * a);
  return numItem({ id: `pstMid-${n}`, family: 'pstMid', prompt: `Fill the box so that ${A}${sq} + □${X} + ${k * k} is a perfect square trinomial (with a positive middle term).`, board: `${A}x^{2} + \\square x + ${k * k}`,
    solution: [`${A}${sq} = (${a === 1 ? '' : a}${X})² and ${k * k} = ${k}², so it would be (${a === 1 ? '' : a}${X} + ${k})².`, `The middle term is 2 · ${a === 1 ? '' : a}${X} · ${k} = ${ans(v)}${X}.`] },
    v, numCheck(v, `Yes: (${a === 1 ? '' : a}${X} + ${k})² = ${A}${sq} + ${v}${X} + ${k * k}.`, [
      { v: a * k, mc: MC.pstUnchecked, say: `The middle term of (A + B)² is 2AB: twice ${a * k}.` },
      { v: 0, mc: MC.chunkTermwise, say: 'Squaring a sum makes a middle term 2AB; it is not just A² + B².' },
      { v: k * k, say: `Use the roots: A = ${a === 1 ? '' : a}${X}, B = ${k}, and the middle is 2AB.` },
    ], `(A + B)² = A² + 2AB + B². Here A = ${a === 1 ? '' : a}${X} and B = ${k}.`));
});

// ===================== factor-by-grouping =====================
interface Grp { al: number; u: number; be: number }
function grp(R: () => number): Grp {
  for (;;) {
    const al = pick(R, [1, 1, 2, 3]), u = nz(R, -9, 9), be = R() < 0.25 ? pick(R, [1, -1]) : nz(R, -9, 9);
    if (gcd(al, be) !== 1 || be === u * al || Math.abs(al * u) > 20) continue;
    if (be === al * u) continue;
    return { al, u, be };
  }
}
const co = (b: number) => (Math.abs(b) === 1 ? '' : String(Math.abs(b)));
const ax = (al: number) => `${al === 1 ? '' : al}${X}`;
/** αx(x + u) ± |β|(x + w) */
const grouped = (G: Grp, w = G.u) => `${ax(G.al)}(${polyHtml(lin(1, G.u))}) ${G.be < 0 ? '−' : '+'} ${co(G.be)}(${polyHtml(lin(1, w))})`;
const groupedT = (G: Grp) => `${G.al === 1 ? '' : G.al}x(${polyTex(lin(1, G.u))}) ${G.be < 0 ? '-' : '+'} ${Math.abs(G.be) === 1 ? '' : Math.abs(G.be)}(${polyTex(lin(1, G.u))})`;
const fourOf = (G: Grp): Poly => [T(G.al, 2), T(G.al * G.u, 1), T(G.be, 1), T(G.be * G.u)];
export const groupPick: Gen = (R, n) => retry(R, () => {
  const G = grp(R), four = fourOf(G);
  const showGrouped = R() < 0.4;
  const right = F(undefined, lin(1, G.u), lin(G.al, G.be));
  const opts: Opt[] = [
    { t: facHtml(right), ok: true, ev: evF(right), say: `Yes: ${polyHtml(lin(1, G.u))} is a common factor of both parts.` },
    { t: facHtml(F(undefined, lin(1, G.u), lin(G.al, -G.be))), ev: evF(F(undefined, lin(1, G.u), lin(G.al, -G.be))), mc: G.be < 0 ? MC.negFirst : undefined, say: `Multiply back: the ${nH(G.be)} keeps its sign in the second factor.` },
    { t: facHtml(F(undefined, lin(1, -G.u), lin(G.al, G.be))), ev: evF(F(undefined, lin(1, -G.u), lin(G.al, G.be))), say: `The shared bracket is ${polyHtml(lin(1, G.u))}.` },
  ];
  if (Math.abs(G.be) === 1) opts.push({ t: facHtml(F(undefined, lin(1, G.u), lin(G.al, 0))), ev: evF(F(undefined, lin(1, G.u), lin(G.al, 0))), mc: MC.hiddenOne, say: `${polyHtml(lin(1, G.u))} ÷ ${polyHtml(lin(1, G.u))} = 1: the ${nH(G.be)} stays in the second factor.` });
  if (showGrouped) opts.push({ t: `It is already in factored form`, mc: MC.sumOfProducts, say: 'The last step is still adding: it is a sum of two products. Take the common bracket out.' });
  const prompt = showGrouped ? `Write as one product: ${grouped(G)}` : `Factor by grouping: ${polyHtml(four)}`;
  return choiceItem(R, { id: `groupPick-${n}`, family: 'groupPick', ex: { target: evP(four) }, picture: boxOf(lin(1, G.u), lin(G.al, G.be), 'all', facTex(right)), prompt, board: `${showGrouped ? groupedT(G) : polyTex(four)} = \\,?`,
    solution: [...(showGrouped ? [] : [`Group the first two and the last two: ${grouped(G)}.`]), `Both parts share the bracket ${polyHtml(lin(1, G.u))}: take it out.`, `= ${facHtml(right)}.`] }, opts);
});
export const groupStep: Gen = (R, n) => retry(R, () => {
  const G = grp(R), four = fourOf(G);
  if (G.be > 0 && R() < 0.6) G.be = -G.be;   // mostly a second group that needs a negative factor
  const f4 = fourOf(G);
  const val = (x: number, a1: number, a2: number, b2: number, w: number) => a1 * x * (x + a2) + b2 * (x + w);
  const opts: Opt[] = [
    { t: grouped(G), ok: true, ev: x => val(x, G.al, G.u, G.be, G.u), say: `Yes: both groups now show ${polyHtml(lin(1, G.u))}.` },
    { t: grouped(G, -G.u), ev: x => val(x, G.al, G.u, G.be, -G.u), mc: G.be < 0 ? MC.negFirst : undefined, say: `Multiply back: ${nH(G.be)}(${polyHtml(lin(1, -G.u))}) gives ${nH(-G.be * G.u)}, not ${nH(G.be * G.u)}. Taking out a negative flips EVERY sign.` },
    { t: `${ax(G.al)}(${polyHtml(lin(1, G.u))}) ${G.be < 0 ? '+' : '−'} ${co(G.be)}(${polyHtml(lin(1, G.u))})`, ev: x => val(x, G.al, G.u, -G.be, G.u), say: 'Multiply back: the sign in front of the second group is wrong.' },
    { t: `${ax(G.al)}(${polyHtml(lin(1, G.al * G.u))}) ${G.be < 0 ? '−' : '+'} ${co(G.be)}(${polyHtml(lin(1, G.u))})`, ev: x => G.al * x * (x + G.al * G.u) + G.be * (x + G.u), mc: MC.oneTerm, say: `Divide BOTH terms of the first group by ${ax(G.al)}.` },
  ];
  void four;
  return choiceItem(R, { id: `groupStep-${n}`, family: 'groupStep', prompt: `First step of grouping: factor each pair. ${polyHtml(f4)} = ?`, board: `${polyTex(f4)} = \\,?`,
    solution: [`First pair: ${polyHtml(f4.slice(0, 2))} = ${ax(G.al)}(${polyHtml(lin(1, G.u))}). Second pair: take out ${nH(G.be)}.`, `= ${grouped(G)}.`] }, opts);
});

// ===================== nonmonic-ac-method =====================
interface NM { p: number; q: number; r: number; s: number; a: number; b: number; c: number }
function nonmonic(R: () => number): NM {
  for (;;) {
    const p = pick(R, [1, 1, 2, 3]), r = int(R, 1, 9), q = nz(R, -9, 9), s = nz(R, -9, 9);
    const a = p * r, b = p * s + q * r, c = q * s;
    if (a < 2 || a > 9 || b === 0 || Math.abs(a * c) > 100 || gcd(p, q) !== 1 || gcd(r, s) !== 1) continue;
    if (p * s === q * r) continue;   // equal split numbers: keep the search honest
    return { p, q, r, s, a, b, c };
  }
}
const nmF = (N: NM) => F(undefined, lin(N.p, N.q), lin(N.r, N.s));
export const acSplit: Gen = (R, n) => {
  const N = nonmonic(R);
  const m = N.p * N.s, k = N.q * N.r, P0 = quad(N.a, N.b, N.c);
  return pairItem({ id: `acSplit-${n}`, family: 'acSplit', picture: boxOf(lin(N.p, N.q), lin(N.r, N.s), 'corners', facTex(nmF(N))),
    prompt: `To factor ${polyHtml(P0)}, split the middle term with two numbers whose product is a · c = ${nH(N.a * N.c)} and whose sum is ${nH(N.b)} (smaller first).`,
    board: `${polyTex(P0)} = ${N.a}x^{2} + \\square x + \\square x ${N.c < 0 ? '-' : '+'} ${Math.abs(N.c)}`, pairLead: `${N.a}${sq} +`, pairOp: `${X} +`, pairTail: `${X} ${N.c < 0 ? '−' : '+'} ${Math.abs(N.c)}`,
    solution: [`a · c = ${N.a} · ${nH(N.c)} = ${nH(N.a * N.c)}. Two numbers with product ${nH(N.a * N.c)} and sum ${nH(N.b)}:`, `${ans(nH(Math.min(m, k)))} and ${ans(nH(Math.max(m, k)))}.`] },
    m, k, `Yes: ${nH(m)} · ${pn(k)} = ${nH(N.a * N.c)} and ${nH(m)} + ${pn(k)} = ${nH(N.b)}.`,
    (x, y) => {
      if (x * y === N.c && x + y === N.b) return { mc: MC.ignoresA, say: `Those multiply to c = ${nH(N.c)}. With a ≠ 1 the product to hit is a · c = ${nH(N.a * N.c)}.` };
      if (x * y === N.a * N.c) return { mc: MC.sumUnchecked, say: `The product is right, but ${nH(x)} + ${pn(y)} = ${nH(x + y)}, not ${nH(N.b)}.` };
      return null;
    }, `List the factor pairs of ${nH(N.a * N.c)} and find the one that adds to ${nH(N.b)}.`);
};
export const acPick: Gen = (R, n) => retry(R, () => {
  const N = nonmonic(R);
  const neg = R() < 0.3;
  const P0 = neg ? quad(-N.a, -N.b, -N.c) : quad(N.a, N.b, N.c);
  const f = nmF(N), right: Fac = neg ? { k: T(-1), fs: f.fs } : f;
  const m = N.p * N.s, k = N.q * N.r;
  const wrap = (g: Fac): Fac => (neg ? { k: T(-1), fs: g.fs } : g);
  const o = (g: Fac, mc: string | undefined, say: string): Opt => ({ t: facHtml(wrap(g)), ev: evF(wrap(g)), mc, say });
  const opts: Opt[] = [
    { t: facHtml(right), ok: true, ev: evF(right), say: `Yes: multiply back to check: ${polyHtml(P0)}.` },
    o(F(undefined, lin(1, m), lin(1, k)), MC.ignoresA, `Those two numbers come from a · c; with a ≠ 1 you split the middle term and group, you cannot use them as the constants.`),
    o(F(undefined, lin(N.p, N.s), lin(N.r, N.q)), undefined, 'Multiply back: the middle term comes out different. The constants sit in the other factors.'),
    o(F(undefined, lin(N.p, -N.q), lin(N.r, -N.s)), undefined, `Multiply back: the middle term has the wrong sign.`),
  ];
  if (neg) opts.push({ t: facHtml(f), ev: evF(f), mc: MC.discards, say: 'You took out −1 first; keep it in front of the product.' });
  return choiceItem(R, { id: `acPick-${n}`, family: 'acPick', ex: { target: evP(P0) }, picture: neg ? undefined : boxOf(lin(N.p, N.q), lin(N.r, N.s), 'corners', facTex(right)), prompt: `Factor ${polyHtml(P0)}.`, board: `${polyTex(P0)} = \\,?`,
    solution: [...(neg ? [`Take out −1 first: ${polyHtml(P0)} = −(${polyHtml(quad(N.a, N.b, N.c))}).`] : []), `a · c = ${nH(N.a * N.c)}; the pair ${nH(m)}, ${nH(k)} adds to ${nH(N.b)}. Split: ${polyHtml([T(N.a, 2), T(m, 1), T(k, 1), T(N.c)])}.`, `Group the pairs: ${facHtml(right)}.`] }, opts);
});

// ===================== prime-over-integers =====================
function quadPrime(R: () => number, wantPrime: boolean): { a: number; b: number; c: number } {
  for (;;) {
    const a = pick(R, [1, 1, 1, 2, 3]), b = int(R, -9, 9), c = nz(R, -12, 12);
    if (Math.abs(a * c) > 36 || [a, b, c].reduce((s, v) => gcd(s, v), 0) !== 1) continue;
    const prime = !isSquare(b * b - 4 * a * c);
    if (prime !== wantPrime) continue;
    if (b === 0 && c < 0 && !wantPrime) continue;
    return { a, b, c };
  }
}
/** a wrong factoring with the right corners: (ax + u)(x + v), uv = c */
function nearMiss(R: () => number, a: number, b: number, c: number): Fac | null {
  const ps = pairs(c).flatMap(([u, v]) => [[u, v], [v, u]] as [number, number][]).filter(([u, v]) => a * v + u !== b);
  if (!ps.length) return null;
  const [u, v] = pick(R, ps);
  return F(undefined, lin(a, u), lin(1, v));
}
const PRIME = 'Prime over the integers: no pair of integers works';
export const primeJudge: Gen = (R, n) => retry(R, () => {
  const wantPrime = R() < 0.6;
  const { a, b, c } = quadPrime(R, wantPrime);
  const P0 = quad(a, b, c), disc = b * b - 4 * a * c;
  const near = nearMiss(R, a, b, c);
  const opts: Opt[] = [];
  if (wantPrime) {
    opts.push({ t: PRIME, ok: true, say: `Yes: the pairs of ${nH(a * c)} all fail the sum ${nH(b)}. It is prime over the integers.` });
    if (near) opts.push({ t: facHtml(near), ev: evF(near), mc: MC.sumUnchecked, say: `Multiply back: the middle term is not ${nH(b)}${X}.` });
    if (b === 0 && c > 0 && isSquare(c)) opts.push({ t: facHtml(Fp(undefined, [lin(1, Math.sqrt(c))], [2])), ev: evF(Fp(undefined, [lin(1, Math.sqrt(c))], [2])), mc: MC.chunkTermwise, say: `(${X} + ${Math.sqrt(c)})² has a middle term ${2 * Math.sqrt(c)}${X}.` });
    if (disc > 0) opts.push({ t: `Prime over the integers, so ${polyHtml(P0)} = 0 has no real solutions`, mc: MC.noRoots, say: 'Prime over the INTEGERS only says there are no integer factors. The equation can still have real solutions that are not whole numbers.' });
    if (opts.length < 3) opts.push({ t: facHtml(F(undefined, lin(a, b), lin(1, c))), ev: evF(F(undefined, lin(a, b), lin(1, c))), say: 'Multiply back: that does not give the trinomial.' });
  } else {
    const ps = pairs(a * c).find(([u, v]) => u + v === b)!;
    // rebuild the factors from the split
    let f: Fac | null = null;
    for (const [p, q] of pairs(a).flatMap(([u, v]) => (u > 0 ? [[u, v], [v, u]] : []))) for (const [r2, s2] of pairs(c).flatMap(([u, v]) => [[u, v], [v, u]])) {
      if (p! * s2! + r2! * q! === b && gcd(p!, r2!) === 1 && gcd(q!, s2!) === 1) f = F(undefined, lin(p!, r2!), lin(q!, s2!));
    }
    void ps;
    if (!f || !equal(expand(f), P0)) throw new Reroll();
    opts.push({ t: facHtml(f), ok: true, ev: evF(f), say: 'Yes: it factors. Multiply back to check.' });
    opts.push({ t: PRIME, mc: MC.primeEarly, say: `Check every pair of ${nH(a * c)}: one of them adds to ${nH(b)}, so it does factor.` });
    if (near) opts.push({ t: facHtml(near), ev: evF(near), mc: MC.sumUnchecked, say: `Multiply back: the middle term is not ${nH(b)}${X}.` });
    opts.push({ t: facHtml(F(undefined, lin(a, -b), lin(1, -c))), ev: evF(F(undefined, lin(a, -b), lin(1, -c))), say: 'Multiply back: that does not give the trinomial.' });
  }
  return choiceItem(R, { id: `primeJudge-${n}`, family: 'primeJudge', prompt: `Factor over the integers, or decide it is prime: ${polyHtml(P0)}`, board: `${polyTex(P0)} = \\,?`,
    solution: [`The GCF of the coefficients is 1. Integer pairs with product a · c = ${nH(a * c)}: ${pairs(a * c).map(([u, v]) => `${nH(u)} and ${nH(v)}`).join('; ')}.`, `Their sums: ${pairs(a * c).map(([u, v]) => nH(u + v)).join(', ')}.`, wantPrime ? `None adds to ${nH(b)}: the list is finite, so it is prime over the integers.` : `One adds to ${nH(b)}, so it factors.`] }, opts);
});
export const primeGcf: Gen = (R, n) => retry(R, () => {
  const { a, b, c } = quadPrime(R, true);
  const g = int(R, 2, 6);
  if ([a, b, c].some(v => Math.abs(v * g) > 40) || a !== 1 && R() < 0.5) throw new Reroll();
  const inner = quad(a, b, c), P0 = inner.map(t => T(t.c.p * g, t.x));
  const right = F(g, inner);
  const near = nearMiss(R, a * g, b * g, c);
  const opts: Opt[] = [
    { t: `Not prime: ${facHtml(right)}, and ${polyHtml(inner)} is prime over the integers`, ok: true, say: `Yes: take out ${g} first; the rest is prime.` },
    { t: `Prime over the integers: no pair of integers works for it`, mc: MC.primeEarly, say: `First check for a common factor: every coefficient is a multiple of ${g}.` },
  ];
  if (near) opts.push({ t: `Not prime: ${facHtml(near)}`, ev: evF(near), say: 'Multiply back: that does not give the polynomial.' });
  opts.push({ t: `Not prime: ${facHtml(F(g, quad(a, b, 0)))} + ${c * g}`, say: 'That is still a sum, not a product.' });
  return choiceItem(R, { id: `primeGcf-${n}`, family: 'primeGcf', prompt: `Is ${polyHtml(P0)} prime over the integers?`, board: polyTex(P0),
    solution: [`Every coefficient is a multiple of ${g}: ${polyHtml(P0)} = ${facHtml(right)}.`, `Then ${polyHtml(inner)} has no integer pair that works: it is prime. The whole polynomial is not.`] }, opts, { max: 2 });
});

// ===================== factor-completely =====================
interface CF { whole: Poly; right: Fac; opts: { f: Fac; mc?: string; say: string }[]; steps: string[] }
function completeCase(R: () => number): CF {
  const kind = pick(R, ['dos', 'monic', 'cubic', 'neg', 'dos'] as const);
  if (kind === 'dos') {
    const g = int(R, 2, 6), k = int(R, 1, 6);
    const inner = quad(1, 0, -k * k), whole = inner.map(t => T(t.c.p * g, t.x));
    const right = F(g, lin(1, k), lin(1, -k));
    return { whole, right, steps: [`GCF first: ${polyHtml(whole)} = ${g}(${polyHtml(inner)}).`, `${polyHtml(inner)} is a difference of squares: ${facHtml(right)}.`], opts: [
      { f: F(undefined, lin(g, g * k), lin(1, -k)), mc: MC.stops, say: `It multiplies back, but ${g}${X} + ${g * k} still has the common factor ${g}.` },
      { f: F(g, inner), mc: MC.stops, say: `${polyHtml(inner)} still factors: a difference of squares.` },
      { f: F(undefined, lin(1, k), lin(1, -k)), mc: MC.discards, say: `The factor ${g} disappeared. Keep it in front.` },
      { f: Fp(g, [lin(1, -k)], [2]), mc: MC.dosSquared, say: 'A difference of squares is (A + B)(A − B), not (A − B)².' },
    ] };
  }
  if (kind === 'monic' || kind === 'cubic') {
    const g = int(R, 2, 5), [m, k] = monic(R, pick(R, ['pos', 'neg', 'opp'] as const));
    if (Math.abs(m * k * g) > 100) return completeCase(R);
    const head = kind === 'cubic' ? T(g, 1) : T(g);
    const inner = tri(m + k, m * k), whole = inner.map(t => T(t.c.p * g, t.x + head.x));
    const right: Fac = { k: head, fs: [lin(1, m), lin(1, k)] };
    const hH = kind === 'cubic' ? `${g}${X}` : String(g);
    return { whole, right, steps: [`GCF first: ${polyHtml(whole)} = ${hH}(${polyHtml(inner)}).`, `Then the trinomial: ${nH(m)} · ${pn(k)} = ${nH(m * k)}, ${nH(m)} + ${pn(k)} = ${nH(m + k)}. So ${facHtml(right)}.`], opts: [
      { f: { k: head, fs: [inner] }, mc: MC.stops, say: `${polyHtml(inner)} still factors. Keep going.` },
      { f: kind === 'cubic' ? { k: T(1, 1), fs: [lin(g, g * m), lin(1, k)] } : F(undefined, lin(g, g * m), lin(1, k)), mc: MC.stops, say: `It multiplies back, but ${g}${X} + ${nH(g * m)} still has the factor ${g}.` },
      { f: kind === 'cubic' ? { k: T(1, 1), fs: [lin(1, m), lin(1, k)] } : F(undefined, lin(1, m), lin(1, k)), mc: MC.discards, say: `The ${g} disappeared. A factored form keeps every factor.` },
      { f: { k: head, fs: [lin(1, -m), lin(1, -k)] }, say: 'Multiply back: the signs are wrong.' },
    ] };
  }
  // −x² + bx + c: −1 first
  const [m, k] = monic(R, 'opp');
  const inner = tri(m + k, m * k), whole = inner.map(t => T(-t.c.p, t.x));
  const right: Fac = { k: T(-1), fs: [lin(1, m), lin(1, k)] };
  return { whole, right, steps: [`Take out −1 first: ${polyHtml(whole)} = −(${polyHtml(inner)}).`, `Then ${nH(m)} · ${pn(k)} = ${nH(m * k)}, ${nH(m)} + ${pn(k)} = ${nH(m + k)}: ${facHtml(right)}.`], opts: [
    { f: { k: T(-1), fs: [inner] }, mc: MC.stops, say: `${polyHtml(inner)} still factors.` },
    { f: F(undefined, lin(1, m), lin(1, k)), mc: MC.discards, say: 'The −1 disappeared: multiply back and every sign is opposite.' },
    { f: { k: T(-1), fs: [lin(1, -m), lin(1, -k)] }, mc: MC.negFirst, say: 'Multiply back: that gives the wrong middle sign. Take out −1 from EVERY term first.' },
  ] };
}
export const completePick: Gen = (R, n) => retry(R, () => {
  const C = completeCase(R);
  const good = (f: Fac) => equal(expand(f), C.whole) && isComplete(f);
  if (!good(C.right)) throw new Error('completePick: the right form is not complete');
  const opts: Opt[] = [{ t: facHtml(C.right), ok: true, say: 'Yes: every factor is prime over the integers, and it multiplies back.' },
    ...C.opts.map(o => { if (good(o.f)) throw new Reroll(); return { t: facHtml(o.f), mc: o.mc, say: o.say, same: equal(expand(o.f), C.whole) || undefined, ev: evF(o.f) }; })];
  return choiceItem(R, { id: `completePick-${n}`, family: 'completePick', prompt: `Factor completely: ${polyHtml(C.whole)}`, board: `${polyTex(C.whole)} = \\,?`, solution: C.steps }, opts);
});
export const completeFill: Gen = (R, n) => retry(R, () => {
  const g = int(R, 2, 5), cubic = R() < 0.5, [m, k] = monic(R, pick(R, ['pos', 'neg', 'opp'] as const));
  const head = cubic ? T(g, 1) : T(g), hH = cubic ? `${g}${X}` : String(g), hT = cubic ? `${g}x` : String(g);
  const inner = tri(m + k, m * k), whole = inner.map(t => T(t.c.p * g, t.x + head.x));
  if (whole.some(t => Math.abs(t.c.p) > 100)) throw new Reroll();
  return pairItem({ id: `completeFill-${n}`, family: 'completeFill', prompt: `Factor completely: ${polyHtml(whole)} = ${hH}(${X} + □)(${X} + □). Smaller number first.`,
    board: `${polyTex(whole)} = ${hT}(x + \\square)(x + \\square)`, pairLead: `${hH}(${X} +`, pairOp: `)(${X} +`, pairTail: ')',
    solution: [`GCF first: ${polyHtml(whole)} = ${hH}(${polyHtml(inner)}).`, `Product ${nH(m * k)}, sum ${nH(m + k)}: the numbers are ${ans(nH(m))} and ${ans(nH(k))}, so it is ${facHtml({ k: head, fs: [lin(1, m), lin(1, k)] })}.`] },
    m, k, `Yes: ${facHtml({ k: head, fs: [lin(1, m), lin(1, k)] })}.`,
    (x, y) => (x * y === g * m * k && x + y === g * (m + k) ? { mc: MC.stops, say: `Those work for ${polyHtml(whole.map(t => T(t.c.p, t.x - head.x)))} BEFORE taking out ${g}. Take the GCF out first.` } : x * y === m * k && x + y !== m + k ? { mc: MC.sumUnchecked, say: `The product is right; check the sum: ${nH(m + k)}.` } : null),
    `Take out ${hH} first, then factor ${polyHtml(inner)}.`);
});
void numItem; void numCheck; void Reroll;
