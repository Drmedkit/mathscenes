// fam3.ts: division by a polynomial (factor and cancel; short long division with a remainder), justifying a
// factorization, judging completeness, rectangles from an area expression, and choosing the operation in context.
// Pure: no DOM.
import { fr, int, pick } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { type Fac, type Poly, F, Fp, T, collect, equal, evF, evP, expand, facHtml, facTex, isComplete, lin, mul, pairs, polyHtml, polyTex, quad, valN } from './fx';
import { type Gen, type Opt, MC, pn, Reroll, X, boxOf, choiceItem, nH, numCheck, numItem, nz, other, pairItem, retry, sq } from './common';
import { gcd } from '../../runtime/item';

const B = (m: number, n: number) => F(undefined, lin(1, m), lin(1, n));
const par = (p: Poly) => (p.length > 1 ? `(${polyHtml(p)})` : polyHtml(p));
const parT = (p: Poly) => (p.length > 1 ? `(${polyTex(p)})` : polyTex(p));

// ===================== divide-by-factor-cancel =====================
interface Cut { N: Poly; D: Poly; Q: Poly; ex: string; exT: string; zero: number; cancel?: Poly; steps: string[] }
function cutCase(R: () => number): Cut {
  const kind = pick(R, ['lin', 'monic', 'monic', 'nonmonic', 'quadquad', 'dos'] as const);
  const m = nz(R, -9, 9);
  const exOf = (z: number) => ({ ex: `${X} ≠ ${nH(z)}`, exT: `x \\neq ${z}`, zero: z });
  if (kind === 'lin') {
    const k = int(R, 2, 9), D = lin(1, m), N = lin(k, k * m);
    return { N, D, Q: [T(k)], ...exOf(-m), cancel: lin(k, k), steps: [`Factor the top: ${polyHtml(N)} = ${k}${par(D)}.`, `Cancel the common factor ${par(D)} (it is not 0 when ${X} ≠ ${nH(-m)}): the quotient is ${k}.`] };
  }
  if (kind === 'monic' || kind === 'dos') {
    const k = kind === 'dos' ? -m : other(R, -9, 9, [0, m]);
    const D = kind === 'dos' ? lin(1, m) : lin(1, m), N = collect(mul(lin(1, m), lin(1, k)));
    if (N.length < 2) throw new Reroll();
    const cancel = N.length === 3 && N[2]!.c.p % m === 0 ? [N[0]!, N[1]!, T(N[2]!.c.p / m)] : [N[0]!, T(N[N.length - 1]!.c.p / m, 0)];
    return { N, D, Q: lin(1, k), ...exOf(-m), cancel, steps: [`Factor the top: ${polyHtml(N)} = ${par(D)}${par(lin(1, k))}.`, `Cancel ${par(D)} (not 0 when ${X} ≠ ${nH(-m)}): ${polyHtml(lin(1, k))}.`] };
  }
  if (kind === 'nonmonic') {
    const q = pick(R, [1, -1, 3, -3, 5, -5, 7]), r = int(R, 1, 3), s = nz(R, -6, 6);
    if (gcd(r, s) !== 1) throw new Reroll();
    const D = lin(2, q), Qp = lin(r, s), N = collect(mul(D, Qp));
    if (N.length < 3) throw new Reroll();
    const zH = `${q > 0 ? '−' : ''}${fr(Math.abs(q), 2)}`;
    return { N, D, Q: Qp, ex: `${X} ≠ ${zH}`, exT: `x \\neq ${q > 0 ? '-' : ''}\\tfrac{${Math.abs(q)}}{2}`, zero: -q / 2, cancel: N[2]!.c.p % q === 0 ? [N[0]!, N[1]!, T(N[2]!.c.p / q)] : undefined,
      steps: [`Factor the top: ${polyHtml(N)} = ${par(D)}${par(Qp)}.`, `Cancel ${par(D)} (not 0 when ${X} ≠ ${zH}): ${polyHtml(Qp)}.`] };
  }
  // quadratic by quadratic: g(x + m)(x + n) ÷ (x + m)(x + n) = g
  const g = int(R, 2, 5), n = other(R, -6, 6, [0, m]);
  if (Math.abs(m) > 6) throw new Reroll();
  const D = collect(mul(lin(1, m), lin(1, n))), N = D.map(t => T(t.c.p * g, t.x));
  const [z1, z2] = [-m, -n].sort((a, b) => a - b);
  return { N, D, Q: [T(g)], ex: `${X} ≠ ${nH(z1!)} and ${X} ≠ ${nH(z2!)}`, exT: `x \\neq ${z1}, ${z2}`, zero: -m,
    steps: [`Factor the top: ${polyHtml(N)} = ${g}${par(D)}.`, `Cancel ${par(D)} = ${facHtml(B(m, n))} (not 0 when ${X} ≠ ${nH(z1!)}, ${nH(z2!)}): the quotient is ${g}.`] };
}
export const cancelPick: Gen = (R, n) => retry(R, () => {
  const C = cutCase(R);
  const opts: Opt[] = [
    { t: `${polyHtml(C.Q)}, for ${C.ex}`, ok: true, say: `Yes: ${par(C.D)} is a factor of the top, and dividing by it needs it to be nonzero.` },
    { t: `${polyHtml(C.Q)}, for every ${X}`, mc: MC.noCond, say: `At the excluded value the divisor ${par(C.D)} is 0, and you cannot divide by 0.` },
  ];
  if (C.cancel && !equal(C.cancel, C.Q)) opts.push({ t: `${polyHtml(C.cancel)}, for ${C.ex}`, mc: MC.cancelTerms, say: 'You can only cancel FACTORS, never single terms. Factor the top first.' });
  const wrongQ = C.Q.length > 1 ? [C.Q[0]!, T(-C.Q[1]!.c.p)] : [T(C.Q[0]!.c.p, 1)];
  opts.push({ t: `${polyHtml(wrongQ)}, for ${C.ex}`, say: `Multiply back: ${par(C.D)} · ${par(wrongQ)} is not ${polyHtml(C.N)}.` });
  return choiceItem(R, { id: `cancelPick-${n}`, family: 'cancelPick', prompt: `Divide by factoring and canceling: (${polyHtml(C.N)}) ÷ ${par(C.D)}`, board: `\\dfrac{${polyTex(C.N)}}{${polyTex(C.D)}}`,
    solution: [...C.steps, `So the quotient is ${polyHtml(C.Q)}, for ${C.ex}.`] }, opts);
});
export const cancelExcl: Gen = (R, n) => retry(R, () => {
  const C = cutCase(R);
  if (C.D.some(t => t.x >= 2)) throw new Reroll();   // linear divisors only: one excluded value
  const z = C.zero;
  return numItem({ id: `cancelExcl-${n}`, family: 'cancelExcl', prompt: `(${polyHtml(C.N)}) ÷ ${par(C.D)} = ${polyHtml(C.Q)}, except at one value of ${X}. Which value of ${X} must be left out? (Type a decimal if needed.)`, board: `\\dfrac{${polyTex(C.N)}}{${polyTex(C.D)}} = ${polyTex(C.Q)}, \\; x \\neq \\,?`,
    solution: [`Division needs a nonzero divisor: set ${polyHtml(C.D)} = 0.`, `${polyHtml(C.D)} = 0 when ${X} = ${ans(nH(z))}. Leave that value out.`] },
    z, numCheck(z, `Yes: there the divisor ${polyHtml(C.D)} is 0.`, [{ v: -z, say: `At ${X} = ${nH(-z)} the divisor is not 0. Solve ${polyHtml(C.D)} = 0.` }, { v: 0, mc: MC.noCond, say: `At ${X} = 0 the divisor is ${nH(valN(C.D, 0))}. Which ${X} makes ${polyHtml(C.D)} zero?` }], `Which ${X} makes ${polyHtml(C.D)} equal to 0?`));
});

// ===================== divide-by-binomial (with a remainder) =====================
interface LD { N: Poly; D: Poly; Q: Poly; r: Poly; slip?: number; steps: string[] }
function ldCase(R: () => number): LD {
  const kind = pick(R, ['monic', 'monic', 'missing', 'nonmonic', 'linlin', 'quadquad'] as const);
  if (kind === 'monic' || kind === 'missing') {
    const m = nz(R, -6, 6), k = kind === 'missing' ? -m : nz(R, -6, 6), r = R() < 0.15 && kind === 'monic' ? 0 : nz(R, -9, 9);
    const D = lin(1, m), Q = lin(1, k), N = collect([...mul(D, Q), T(r)]);
    if (N.some(t => Math.abs(t.c.p) > 12)) throw new Reroll();
    const b = m + k, c = m * k + r;
    return { N, D, Q, r: r ? [T(r)] : [], slip: c + k * m,
      steps: [`${sq} ÷ ${X} = ${X}: ${X}${par(D)} = ${polyHtml(mul([T(1, 1)], D))}. Subtract: ${polyHtml(collect([T(b - m, 1), T(c)]))}.`, `${nH(k)}${X} ÷ ${X} = ${nH(k)}: ${nH(k)}${par(D)} = ${polyHtml(mul([T(k)], D))}. Subtract: ${nH(r)}, the remainder.`] };
  }
  if (kind === 'nonmonic') {
    const q = pick(R, [1, -1, 3, -3]), k = nz(R, -5, 5), r = nz(R, -4, 4);
    const D = lin(2, q), Q = lin(1, k), N = collect([...mul(D, Q), T(r)]);
    if (N.some(t => Math.abs(t.c.p) > 12) || N.length < 3) throw new Reroll();
    return { N, D, Q, r: [T(r)], slip: N[2]!.c.p + k * q,
      steps: [`2${sq} ÷ 2${X} = ${X}: subtract ${X}${par(D)}, then ${nH(k)}${X}... ÷ 2${X} gives ${nH(k)}.`, `Subtract ${nH(k)}${par(D)}: the remainder is ${nH(r)}.`] };
  }
  if (kind === 'linlin') {
    const a = int(R, 2, 6), m = nz(R, -5, 5), r = nz(R, -9, 9);
    const D = lin(1, m), Q = [T(a)], N = collect([...mul(D, Q), T(r)]);
    if (N.length < 2 || N.some(t => Math.abs(t.c.p) > 12)) throw new Reroll();
    return { N, D, Q, r: [T(r)], slip: N[N.length - 1]!.c.p + a * m,
      steps: [`${a}${X} ÷ ${X} = ${a}: ${a}${par(D)} = ${polyHtml(mul([T(a)], D))}.`, `Subtract: ${polyHtml(N)} − (${polyHtml(mul([T(a)], D))}) = ${nH(r)}, the remainder.`] };
  }
  // quadratic by quadratic: g + (linear)/(x² + x + 1)
  const g = int(R, 2, 4), u = int(R, 1, 3), v = nz(R, -3, 3);
  const D = quad(1, 1, 1), rr = lin(u, v), N = collect([...mul([T(g)], D), ...rr]);
  return { N, D, Q: [T(g)], r: rr, steps: [`${N[0]!.c.p}${sq} ÷ ${sq} = ${g}: ${g}${par(D)} = ${polyHtml(mul([T(g)], D))}.`, `Subtract: ${polyHtml(rr)}. Its degree is below 2, so it is the remainder.`] };
}
const ldText = (L: LD, r: Poly = L.r) => (r.length ? `${polyHtml(L.Q)} ${r.length === 1 && r[0]!.c.p < 0 ? '−' : '+'} ${r.length === 1 ? Math.abs(r[0]!.c.p) : par(r)}/${par(L.D)}` : polyHtml(L.Q));
const ldEv = (L: LD, r: Poly = L.r) => (x: number) => valN(L.Q, x) + (r.length ? valN(r, x) / valN(L.D, x) : 0);
export const longPick: Gen = (R, n) => retry(R, () => {
  const L = ldCase(R);
  if (!L.r.length) throw new Reroll();
  const opts: Opt[] = [
    { t: ldText(L), ok: true, ev: ldEv(L), say: `Yes: the quotient is ${polyHtml(L.Q)} and the remainder ${polyHtml(L.r)} goes over the divisor.` },
    { t: `${polyHtml(L.Q)} R ${polyHtml(L.r)}`, mc: MC.wholeQuot, say: `"R" is not part of one expression. Write the remainder over the divisor: + ${par(L.r)}/${par(L.D)}.` },
    { t: `Not finished: keep dividing until the remainder is 0`, mc: MC.zeroRem, say: 'The remainder has a lower degree than the divisor: you stop there. A remainder can stay.' },
  ];
  if (L.slip !== undefined && L.r.length === 1 && L.slip !== L.r[0]!.c.p && L.slip !== 0) opts.push({ t: ldText(L, [T(L.slip)]), ev: ldEv(L, [T(L.slip)]), mc: MC.negFirst, say: 'When you subtract, the minus reaches EVERY term of the product.' });
  else opts.push({ t: polyHtml(L.Q), ev: evP(L.Q), say: 'The remainder is not 0, so it stays in the answer.' });
  return choiceItem(R, { id: `longPick-${n}`, family: 'longPick', prompt: `Divide: (${polyHtml(L.N)}) ÷ ${par(L.D)}, with ${polyHtml(L.D)} ≠ 0.`, board: `\\dfrac{${polyTex(L.N)}}{${polyTex(L.D)}}`,
    solution: [...L.steps, `Check: ${par(L.D)} · ${par(L.Q)} ${L.r.length === 1 && L.r[0]!.c.p < 0 ? '−' : '+'} ${L.r.length === 1 ? Math.abs(L.r[0]!.c.p) : par(L.r)} = ${polyHtml(L.N)}. So it is ${ldText(L)}.`] }, opts);
});
export const longRem: Gen = (R, n) => retry(R, () => {
  const L = ldCase(R);
  if (L.r.length > 1) throw new Reroll();
  const r = L.r.length ? L.r[0]!.c.p : 0;
  return numItem({ id: `longRem-${n}`, family: 'longRem', prompt: `(${polyHtml(L.N)}) ÷ ${par(L.D)} = ${polyHtml(L.Q)} + □/${par(L.D)}. What is the remainder? (Type 0 if it divides exactly.)`, board: `\\dfrac{${polyTex(L.N)}}{${polyTex(L.D)}} = ${polyTex(L.Q)} + \\dfrac{\\square}{${polyTex(L.D)}}`,
    solution: [...L.steps, `Check: ${par(L.D)} · ${par(L.Q)} ${r < 0 ? '−' : '+'} ${Math.abs(r)} = ${polyHtml(L.N)}. Remainder ${ans(nH(r))}.`] },
    r, numCheck(r, `Yes: divisor × quotient ${r < 0 ? '−' : '+'} ${Math.abs(r)} gives back ${polyHtml(L.N)}.`, [
      ...(L.slip !== undefined ? [{ v: L.slip, mc: MC.negFirst, say: 'When you subtract the product, the minus reaches EVERY term of it.' }] : []),
      { v: -r, say: 'Check the sign: divisor × quotient + remainder must give back the dividend.' },
    ], `Subtract divisor × quotient from ${polyHtml(L.N)}: what is left?`));
});

// ===================== justify-equivalence-check =====================
function falseClaim(R: () => number): { L: Poly; Rf: Fac; Lh: string } {
  for (;;) {
    const p = int(R, 1, 6), q = int(R, 1, 6);
    if (R() < 0.35) { const L = quad(1, 0, p * q); return { L, Rf: B(p, q), Lh: polyHtml(L) }; }   // x² + 2 vs (x + 1)(x + 2)
    const alts = pairs(p * q).filter(([u, v]) => u > 0 && u + v !== p + q);
    if (!alts.length) continue;
    const [u, v] = pick(R, alts);
    const L = quad(1, u + v, p * q);
    return { L, Rf: B(p, q), Lh: polyHtml(L) };
  }
}
export const agreeProof: Gen = (R, n) => retry(R, () => {
  const C = falseClaim(R);
  const RP = expand(C.Rf);
  const t = [1, 2, 3, -1].find(x => valN(C.L, x) !== valN(RP, x))!;
  const c0 = valN(C.L, 0);
  return choiceItem(R, { id: `agreeProof-${n}`, family: 'agreeProof', prompt: `Jo claims ${C.Lh} = ${facHtml(C.Rf)}, because both sides are ${c0} at ${X} = 0. Which statement is true?`, board: `${polyTex(C.L)} \\overset{?}{=} ${facTex(C.Rf)}`,
    solution: ['Equal for EVERY x is the claim. One value that agrees proves nothing.', `At ${X} = ${nH(t)}: ${nH(valN(C.L, t))} versus ${nH(valN(RP, t))}. Not equivalent.`] }, [
    { t: `Not equivalent: at ${X} = ${nH(t)} the sides are ${nH(valN(C.L, t))} and ${nH(valN(RP, t))}`, ok: true, say: 'Yes: one value where they differ disproves the claim.' },
    { t: `Equivalent: they agree at ${X} = 0`, mc: MC.examples, say: `Agreeing at one value proves nothing. Try ${X} = ${nH(t)}.` },
    { t: 'Equivalent: the first and last terms match', mc: MC.firstLast, say: `Expand: ${facHtml(C.Rf)} = ${polyHtml(RP)}. The middle term is different.` },
  ]);
});
export const whyExpand: Gen = (R, n) => retry(R, () => {
  const p = nz(R, -9, 9), q = nz(R, -9, 9);
  if (Math.abs(p * q) > 12 || p + q === 0) throw new Reroll();
  const P0 = quad(1, p + q, p * q), t = int(R, 1, 5);
  return choiceItem(R, { id: `whyExpand-${n}`, family: 'whyExpand', prompt: `Expanding ${facHtml(B(p, q))} step by step gives ${polyHtml(P0)}. Why does that prove the factorization?`, board: `${facTex(B(p, q))} = ${polyTex(P0)}`,
    solution: ['Every step of the expansion (distribute, collect like terms) is a rewrite that is true for every x.', 'So the two forms are equal for EVERY x, which is what equivalent means.'] }, [
    { t: `Each step is an allowed rewrite, so the two forms are equal for every ${X}`, ok: true, say: 'Yes: the expansion holds for every x at once.' },
    { t: `It matched when we tried ${X} = ${t}`, mc: MC.examples, say: 'One value is only an example. The expansion is what covers every x.' },
    { t: 'The first and last terms match, and that is enough', mc: MC.firstLast, say: 'Every coefficient must match, especially the middle one.' },
  ]);
});

// ===================== judge-completeness =====================
interface JC { whole: Poly; forms: Fac[] }
function jcCase(R: () => number): JC {
  const kind = pick(R, ['monic', 'dos', 'xdos', 'square'] as const);
  if (kind === 'monic') {
    const g = int(R, 2, 6), m = nz(R, -6, 6), k = other(R, -6, 6, [0, -m]);
    const inner = collect(mul(lin(1, m), lin(1, k))), whole = inner.map(t => T(t.c.p * g, t.x));
    return { whole, forms: [F(g, lin(1, m), lin(1, k)), F(undefined, lin(g, g * m), lin(1, k)), F(g, inner), F(undefined, lin(1, m), lin(g, g * k))] };
  }
  if (kind === 'dos') {
    const g = int(R, 2, 6), k = int(R, 1, 7);
    const inner = quad(1, 0, -k * k), whole = inner.map(t => T(t.c.p * g, t.x));
    return { whole, forms: [F(g, lin(1, k), lin(1, -k)), F(g, inner), F(undefined, lin(g, g * k), lin(1, -k)), F(undefined, lin(1, k), lin(g, -g * k))] };
  }
  if (kind === 'xdos') {
    const k = int(R, 1, 7), g = int(R, 1, 3);
    const inner = quad(1, 0, -k * k), whole = inner.map(t => T(t.c.p * g, t.x + 1));
    return { whole, forms: [{ k: T(g, 1), fs: [lin(1, k), lin(1, -k)] }, { k: T(g, 1), fs: [inner] }, { k: T(g), fs: [quad(1, k, 0), lin(1, -k)] }] };
  }
  const g = int(R, 2, 5), k = nz(R, -6, 6);
  const inner = quad(1, 2 * k, k * k), whole = inner.map(t => T(t.c.p * g, t.x));
  return { whole, forms: [Fp(g, [lin(1, k)], [2]), F(g, inner), F(undefined, lin(g, g * k), lin(1, k))] };
}
export const judgeWhich: Gen = (R, n) => retry(R, () => {
  const J = jcCase(R);
  if (J.forms.some(f => !equal(expand(f), J.whole))) throw new Error('judgeWhich: a form does not multiply back');
  const opts: Opt[] = J.forms.map(f => (isComplete(f)
    ? { t: facHtml(f), ok: true, say: 'Yes: every factor is prime over the integers. The number in front can stay as it is.' }
    : { t: facHtml(f), same: true, mc: MC.productComplete, say: 'It multiplies back, but one of its factors still factors. Multiplying back does not show completeness.' }));
  if (opts.filter(o => o.ok).length !== 1) throw new Reroll();
  return choiceItem(R, { id: `judgeWhich-${n}`, family: 'judgeWhich', prompt: `All of these multiply back to ${polyHtml(J.whole)}. Which one is factored completely?`, board: polyTex(J.whole),
    solution: ['Complete means: no factor can be factored further over the integers (no common number inside a bracket, no difference of squares or trinomial left).', `Only ${facHtml(J.forms.find(isComplete)!)} has every factor prime.`] }, opts);
});
export const judgeYes: Gen = (R, n) => retry(R, () => {
  const kind = pick(R, ['six', 'square', 'xdos', 'gdos', 'pair', 'left'] as const);
  let f: Fac, note = '';
  if (kind === 'six') { const g = pick(R, [4, 6, 8, 9, 10, 12]), k = int(R, 1, 6); f = F(g, lin(1, k), lin(1, -k)); note = `${g} is composite, but the number in front is not split: that is fine.`; }
  else if (kind === 'square') { const g = int(R, 2, 6), k = nz(R, -6, 6); f = Fp(g, [lin(1, k)], [2]); note = 'A repeated factor written as a power is complete.'; }
  else if (kind === 'xdos') { const k = int(R, 1, 8); f = { k: T(1, 1), fs: [quad(1, 0, -k * k)] }; note = `${sq} − ${k * k} = (${X} + ${k})(${X} − ${k}) still factors.`; }
  else if (kind === 'gdos') { const g = int(R, 2, 6), k = int(R, 1, 8); f = F(g, quad(1, 0, -k * k)); note = `${sq} − ${k * k} still factors.`; }
  else if (kind === 'pair') { const g = int(R, 2, 5), m = nz(R, -6, 6), k = other(R, -6, 6, [0, m]); f = F(undefined, lin(g, g * m), lin(1, k)); note = `${polyHtml(lin(g, g * m))} still has the common factor ${g}.`; }
  else { const g = int(R, 2, 5), a = int(R, 1, 3), b = nz(R, -5, 5), c = nz(R, -5, 5); f = F(undefined, quad(g * a, g * b, g * c)); note = `Every coefficient is a multiple of ${g}: take ${g} out.`; }
  const done = isComplete(f);
  const whole = expand(f);
  const opts: Opt[] = done ? [
    { t: 'Complete: every factor is prime over the integers', ok: true, say: `Yes. ${note}` },
    { t: kind === 'six' ? 'Not complete: the number in front must be split into primes' : 'Not complete: a bracket still factors', say: note },
    { t: 'Not complete: it has to be multiplied out first', say: 'Factored form is a product; multiplying out goes the other way.' },
  ] : [
    { t: 'Not complete: a factor still factors over the integers', ok: true, say: `Yes. ${note}` },
    { t: `Complete: it multiplies back to ${polyHtml(whole)}`, mc: MC.productComplete, say: `It does multiply back, but that only shows it is EQUAL. ${note}` },
    { t: 'Complete: it is written as a product', mc: MC.productComplete, say: `A product can still be incomplete. ${note}` },
  ];
  return choiceItem(R, { id: `judgeYes-${n}`, family: 'judgeYes', prompt: `Is ${facHtml(f)} factored completely?`, board: facTex(f), solution: ['Check each factor: a common number inside a bracket, a difference of squares, or a trinomial that splits means it is not complete.', note] }, opts, { keep: false });
});

// ===================== area-dimensions-application =====================
function roomPair(R: () => number): [number, number] {
  for (;;) { const m = int(R, 1, 9), k = int(R, m + 1, 12); if (m * k <= 60) return [m, k]; }
}
export const roomSides: Gen = (R, n) => retry(R, () => {
  const [m, k] = roomPair(R);
  const u = pick(R, ['ft', 'm'] as const), su = u === 'ft' ? 'sq ft' : 'sq m', thing = u === 'ft' ? 'A rug' : 'A solar panel';
  const b = m + k, c = m * k;
  const right = B(m, k);
  const S = (p: number, q: number, un: string = u) => `(${X} + ${p}) ${un} by (${X} + ${q}) ${un}`;
  const others = pairs(c).filter(([p, q]) => p > 0 && p !== m);
  const opts: Opt[] = [
    { t: S(m, k), ok: true, ev: evF(right), say: `Yes: (${X} + ${m})(${X} + ${k}) = ${sq} + ${b}${X} + ${c}, and sides are lengths in ${u}.` },
    { t: `${sq} ${u} by (${b}${X} + ${c}) ${u}`, ev: x => x * x * (b * x + c), mc: MC.termsAsSides, say: 'Those are terms of the area, not its sides. The sides multiply to the area.' },
    { t: S(m, k, su), ev: evF(right), same: true, mc: MC.unitDim, say: `A side is a length: ${u}, not ${su}.` },
    ...others.map(([p, q]) => ({ t: S(p, q), ev: evF(B(p, q)), mc: MC.sumUnchecked, say: `${p} · ${q} = ${c}, but the middle term would be ${p + q}${X}, not ${b}${X}.` })),
  ];
  return choiceItem(R, { id: `roomSides-${n}`, family: 'roomSides', ex: { target: evP(quad(1, b, c)) }, picture: boxOf(lin(1, m), lin(1, k), 'corners', facTex(right), { noteL: u === 'ft' ? 'feet' : 'meters', noteT: u === 'ft' ? 'feet' : 'meters' }),
    prompt: `${thing} is a rectangle with area ${sq} + ${b}${X} + ${c} ${su} (${X} > 0). Its sides are ${X} plus a whole number. What are its side lengths?`, board: `x^{2} + ${b}x + ${c} = (\\;?\\;)(\\;?\\;)`,
    solution: [`Factor the area: product ${c}, sum ${b}: ${m} and ${k}.`, `${sq} + ${b}${X} + ${c} = ${facHtml(right)}, so the sides are ${S(m, k)}.`] }, opts);
});
export const roomAt: Gen = (R, n) => {
  const [m, k] = roomPair(R);
  const t = int(R, 2, 12), b = m + k, c = m * k;
  return pairItem({ id: `roomAt-${n}`, family: 'roomAt', picture: boxOf(lin(1, m), lin(1, k), 'corners', facTex(B(m, k)), { noteL: 'feet', noteT: 'feet' }),
    prompt: `A room has floor area ${sq} + ${b}${X} + ${c} sq ft, with sides (${X} + ${m}) ft and (${X} + ${k}) ft. For ${X} = ${t}, how long are its sides? (shorter side first)`, board: `${t}^{2} + ${b} \\cdot ${t} + ${c} = ${t * t + b * t + c}\\ \\text{sq ft}`,
    pairLead: '', pairOp: 'ft by', pairTail: 'ft',
    solution: [`Put ${X} = ${t} into each side: ${t} + ${m} and ${t} + ${k}.`, `${ans(t + m)} ft by ${ans(t + k)} ft. Check: ${t + m} × ${t + k} = ${(t + m) * (t + k)} sq ft.`] },
    t + m, t + k, `Yes: ${t + m} ft by ${t + k} ft, and ${t + m} × ${t + k} = ${(t + m) * (t + k)}.`,
    (x, y) => ((x === t * t && y === b * t + c) || (y === t * t && x === b * t + c) ? { mc: MC.termsAsSides, say: 'Those are parts of the AREA. Use the sides x + ' + m + ' and x + ' + k + '.' } : null),
    `Put ${X} = ${t} into each side length.`);
};
export const roomWidth: Gen = (R, n) => retry(R, () => {
  const g = int(R, 2, 4), m = int(R, 1, 6), k = other(R, 1, 8, [m]);
  const whole = collect(mul([T(g)], mul(lin(1, m), lin(1, k))));
  const W = lin(g, g * m);
  return choiceItem(R, { id: `roomWidth-${n}`, family: 'roomWidth', prompt: `A patio has area ${polyHtml(whole)} sq ft. Its width is (${polyHtml(W)}) ft. What is its length?`, board: `${polyTex(whole)} = (${polyTex(W)})(\\;?\\;)`,
    solution: [`${polyHtml(whole)} = ${g}(${X} + ${m})(${X} + ${k}), and the width ${polyHtml(W)} = ${g}(${X} + ${m}).`, `So the length is what is left: (${polyHtml(lin(1, k))}) ft.`] }, [
    { t: `(${polyHtml(lin(1, k))}) ft`, ok: true, ev: evP(lin(1, k)), say: `Yes: (${polyHtml(W)})(${polyHtml(lin(1, k))}) = ${polyHtml(whole)}.` },
    { t: `(${polyHtml(lin(g, g * k))}) ft`, ev: evP(lin(g, g * k)), mc: MC.fixesDims, say: `The ${g} is already in the width ${polyHtml(W)}. Multiply back: that gives ${g} times too much.` },
    { t: `(${polyHtml(lin(1, m))}) ft`, ev: evP(lin(1, m)), say: `Multiply back: (${polyHtml(W)})(${polyHtml(lin(1, m))}) is not the area.` },
    { t: `(${polyHtml(lin(1, k))}) sq ft`, ev: evP(lin(1, k)), same: true, mc: MC.unitDim, say: 'A length is in ft, not sq ft.' },
  ]);
});

// ===================== polynomial-operations-in-context =====================
interface Ctx { prompt: string; right: Poly; unit: string; wrongs: { p: Poly; unit: string; mc?: string; say: string; same?: boolean }[]; steps: string[]; at?: { v: number; slip?: number; slipMc?: string } }
function ctxCase(R: () => number): Ctx {
  const kind = pick(R, ['perim', 'area', 'volume', 'profit', 'floor', 'missing', 'missing2'] as const);
  if (kind === 'perim' || kind === 'area') {
    const p = int(R, 2, 3), q = int(R, 1, 6), s = int(R, 1, 6);
    const A = lin(p, q), Bs = lin(1, s), per = collect([...A, ...Bs, ...A, ...Bs]), ar = collect(mul(A, Bs));
    const base = `A rectangular deck is (${polyHtml(A)}) ft by (${polyHtml(Bs)}) ft.`;
    if (kind === 'perim') return { prompt: `${base} Write its perimeter (the railing around it).`, right: per, unit: 'ft', steps: ['Perimeter: add all four sides.', `2(${polyHtml(A)}) + 2(${polyHtml(Bs)}) = ${polyHtml(per)} ft.`], wrongs: [
      { p: ar, unit: 'sq ft', mc: MC.areaPerim, say: 'That multiplies the sides: the area. The railing goes AROUND: add the four sides.' },
      { p: per, unit: 'sq ft', mc: MC.unitDim, same: true, say: 'A perimeter is a length: ft.' },
      { p: collect([...A, ...Bs]), unit: 'ft', say: 'That is two sides. A rectangle has four.' }] };
    return { prompt: `${base} Write its area.`, right: ar, unit: 'sq ft', steps: ['Area: multiply the sides.', `(${polyHtml(A)})(${polyHtml(Bs)}) = ${polyHtml(ar)} sq ft.`], wrongs: [
      { p: per, unit: 'ft', mc: MC.areaPerim, say: 'That adds the sides: the perimeter. Area multiplies.' },
      { p: ar, unit: 'ft', mc: MC.unitDim, same: true, say: 'An area is in square units: sq ft.' },
      { p: [T(p, 2), T(q * s)], unit: 'sq ft', say: 'Every term times every term: the middle terms are missing.' }] };
  }
  if (kind === 'volume') {
    const a = int(R, 1, 6), h = int(R, 2, 6);
    const V = collect(mul([T(h)], mul([T(1, 1)], lin(1, a))));
    return { prompt: `A box is ${X} in long, (${polyHtml(lin(1, a))}) in wide and ${h} in tall. Write its volume.`, right: V, unit: 'cu in', steps: ['Volume: length × width × height.', `${X}(${polyHtml(lin(1, a))}) · ${h} = ${polyHtml(V)} cu in.`], wrongs: [
      { p: collect([T(1, 1), ...lin(1, a), T(h)]), unit: 'in', mc: MC.areaPerim, say: 'Adding the edges does not give the space inside. Multiply the three lengths.' },
      { p: V, unit: 'sq in', mc: MC.unitDim, same: true, say: 'A volume is in cubic units: cu in.' },
      { p: collect([T(h, 2), T(a)]), unit: 'cu in', say: `${h} multiplies BOTH terms of ${X}(${polyHtml(lin(1, a))}).` }] };
  }
  if (kind === 'profit') {
    const al = int(R, 2, 5), be = int(R, 10, 30), ga = int(R, 1, al - 1), de = int(R, 2, 9), ep = int(R, 10, 60);
    const Rv = quad(al, be, 0), Cv = quad(ga, de, ep), Pv = collect([...Rv, ...Cv.map(t => T(-t.c.p, t.x))]);
    const neg1 = collect([...Rv, T(-ga, 2), T(de, 1), T(ep)]);
    return { prompt: `A shop's revenue is R(${X}) = ${polyHtml(Rv)} dollars and its cost is C(${X}) = ${polyHtml(Cv)} dollars. Write its profit P(${X}).`, right: Pv, unit: 'dollars', steps: ['Profit = revenue − cost: subtract the WHOLE cost.', `(${polyHtml(Rv)}) − (${polyHtml(Cv)}) = ${polyHtml(Pv)} dollars.`], wrongs: [
      { p: neg1, unit: 'dollars', mc: MC.negFirst, say: 'The minus reaches every term of the cost, not only the first.' },
      { p: collect([...Rv, ...Cv]), unit: 'dollars', say: 'Profit subtracts the cost; it does not add it.' },
      { p: collect([...Cv, ...Rv.map(t => T(-t.c.p, t.x))]), unit: 'dollars', say: 'That is cost minus revenue: the opposite of profit.' }] };
  }
  if (kind === 'floor') {
    const a = int(R, 4, 9), b = int(R, 3, 8), c = int(R, 1, a - 2), d = int(R, 1, b - 2);
    const room = collect(mul(lin(2, a), lin(1, b))), rug = collect(mul(lin(2, c), lin(1, d))), left = collect([...room, ...rug.map(t => T(-t.c.p, t.x))]);
    const slip = collect([...room, T(-rug[0]!.c.p, 2), ...rug.slice(1)]);
    return { prompt: `A room is (${polyHtml(lin(2, a))}) ft by (${polyHtml(lin(1, b))}) ft. A rug (${polyHtml(lin(2, c))}) ft by (${polyHtml(lin(1, d))}) ft lies on it. Write the floor area the rug does not cover.`, right: left, unit: 'sq ft',
      steps: [`Room: ${polyHtml(room)}. Rug: ${polyHtml(rug)}.`, `Uncovered = room − rug = ${polyHtml(left)} sq ft.`], wrongs: [
        { p: slip, unit: 'sq ft', mc: MC.negFirst, say: 'Subtract the WHOLE rug area: the minus reaches every term.' },
        { p: left, unit: 'ft', mc: MC.unitDim, same: true, say: 'An area is in square units: sq ft.' },
        { p: collect([...room, ...rug]), unit: 'sq ft', say: 'The uncovered part is the room MINUS the rug.' }] };
  }
  if (kind === 'missing') {
    const k = int(R, 1, 4), m = int(R, 1, 6), s = int(R, 1, 3);
    const base = [T(s, 2)], h = lin(k, m), V = collect(mul(base, h));
    if (gcd(k, m) !== 1) throw new Reroll();
    return { prompt: `A box has volume ${polyHtml(V)} cu in and a base of area ${polyHtml(base)} sq in. Write its height.`, right: h, unit: 'in', steps: ['Volume = base area × height, so height = volume ÷ base area.', `(${polyHtml(V)}) ÷ ${polyHtml(base)} = ${polyHtml(h)} in.`], wrongs: [
      { p: collect(mul(V, base)), unit: 'in', say: 'Height = volume ÷ base area: divide, do not multiply.' },
      { p: h, unit: 'sq in', mc: MC.unitDim, same: true, say: 'A height is a length: in.' },
      { p: [T(k, 1), T(m * s, 2)], unit: 'in', mc: MC.divFirst, say: 'Divide EVERY term by the base area.' }] };
  }
  const m = int(R, 1, 6), k = other(R, 1, 8, [m]);
  const A = collect(mul(lin(1, m), lin(1, k)));
  return { prompt: `A rectangle has area ${polyHtml(A)} sq ft and one side (${polyHtml(lin(1, m))}) ft. Write the other side.`, right: lin(1, k), unit: 'ft', steps: ['Other side = area ÷ known side.', `${polyHtml(A)} = (${polyHtml(lin(1, m))})(${polyHtml(lin(1, k))}), so the other side is ${polyHtml(lin(1, k))} ft.`], wrongs: [
    { p: lin(1, m * k), unit: 'ft', mc: MC.cancelTerms, say: 'Factor the area first; you cannot divide term by term by a binomial.' },
    { p: lin(1, k), unit: 'sq ft', mc: MC.unitDim, same: true, say: 'A side is a length: ft.' },
    { p: collect(A.slice(0, 2).concat([T(-m, 1)])), unit: 'ft', say: 'Divide the area by the side; subtracting does not undo multiplying.' }] };
}
const withUnit = (p: Poly, u: string) => `${par(p)} ${u}`;
export const ctxOp: Gen = (R, n) => retry(R, () => {
  const C = ctxCase(R);
  return choiceItem(R, { id: `ctxOp-${n}`, family: 'ctxOp', prompt: C.prompt, board: '\\text{add, subtract, multiply or divide?}', solution: C.steps }, [
    { t: withUnit(C.right, C.unit), ok: true, ev: evP(C.right), say: `Yes: ${C.steps[0]}` },
    ...C.wrongs.map(w => ({ t: withUnit(w.p, w.unit), ev: evP(w.p), mc: w.mc, same: w.same, say: w.say })),
  ]);
});
export const ctxValue: Gen = (R, n) => retry(R, () => {
  const C = ctxCase(R);
  const t = int(R, 2, 10);
  const v = valN(C.right, t);
  if (v <= 0 || C.unit === 'dollars' && v < 0) throw new Reroll();
  const area = C.wrongs.find(w => w.mc === MC.areaPerim);
  return numItem({ id: `ctxValue-${n}`, family: 'ctxValue', prompt: `${C.prompt} Then find its value for ${X} = ${t}.`, board: `x = ${t}`, unit: C.unit,
    solution: [...C.steps, `At ${X} = ${t}: ${ans(v)} ${C.unit}.`] },
    v, numCheck(v, `Yes: ${v} ${C.unit}.`, area ? [{ v: valN(area.p, t), mc: MC.areaPerim, say: area.say }] : [], `${C.steps[0]} Then put ${X} = ${t} in.`));
});
void parT; void Fp; void sq; void nz;
