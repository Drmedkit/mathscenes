// fam2.ts: stage 2, long division: the complete layout (placeholders), the next quotient term (leading terms), the
// residual update S − t·D, whole divisions by x − c (stop at a valid remainder), nonmonic linear divisors (fractional
// coefficients), quadratic divisors (linear remainders). Pure: no DOM.
import { int, shuffle } from '../../runtime/item';
import {
  type Co, prodH, parT, parH, type Q, MINUS, X, addC, brH, brT, co, coefAt, degOf, divide, isZ, isZero, keyC, mulC, nH, pH, pT, q, qH, qDiv, qMul,
  qNeg, qSub, qv, scaleC, shiftC, subC, synth, trim, whole, xMinus, xp,
} from './pd';
import { type Gen, type Opt, MC, Reroll, ans, keyed, numItem, nz, other, pairItem, pickOf, retry } from './common';
import { linD, rpoly } from './fam1';
import { T, polyHtml, polyTex } from '../polynomials/poly';

/** a monomial in TeX, bracketed when negative (so "- (-3x)" never reads as a double minus) */
const mT = (c: Co) => (trim(c)[0]!.p < 0 ? `(${pT(c)})` : pT(c));
const divT = (P: Co, D: Co) => `${parT(P)} \\div ${parT(D)}`;
const divH = (P: Co, D: Co) => `${parH(P)} ÷ ${parH(D)}`;
/** a dividend with at least one missing power below the top (degree 2-4), integer coefficients */
function gappy(R: () => number, lo = 2, hi = 4): Co {
  for (;;) {
    const d = int(R, lo, hi);
    const c = co(Array.from({ length: d + 1 }, (_, i) => (i === 0 ? nz(R, -3, 4) : R() < 0.45 ? 0 : nz(R, -9, 9))));
    if (c.slice(1).some(v => isZ(v)) && c.slice(1).some(v => !isZ(v))) return c;
  }
}
/** the dividend written in a scrambled order (terms as in a textbook exercise) */
function scrambled(R: () => number, P: Co): { tex: string; html: string; moved: boolean } {
  const n = P.length - 1;
  const terms = P.map((c, i) => ({ c, pow: n - i })).filter(t => !isZ(t.c)).map(t => T(t.c, t.pow));
  const sh = R() < 0.5 ? shuffle(R, terms.slice()) : terms.slice();
  const moved = sh.some((t, i) => t.x !== terms[i]!.x);
  return { tex: polyTex(sh), html: polyHtml(sh), moved };
}

// ===================== ld-layout =====================
export const layoutRow: Gen = (R, n) => retry(() => {
  const P = gappy(R), D = linD(R), sc = scrambled(R, P);
  const asc = P.map((c, i) => ({ c, pow: P.length - 1 - i })).reverse().map(t => T(t.c, t.pow));
  const opts: Opt[] = [
    { t: pH(P, true), ok: true, say: 'Right: every power from the top down to the constant, with 0 for each missing one.' },
    { t: pH(P), mc: MC.placeholder, say: 'Without the 0 placeholders the columns slip: each power needs its own column, even when it is missing.' },
    { t: polyHtml(asc), say: 'Long division works from the highest power down: write the powers in descending order.' },
  ];
  if (sc.moved) opts.push({ t: sc.html, say: 'Rearrange first: descending powers, with 0 for every missing power.' });
  return keyed(R, { id: `layoutRow-${n}`, family: 'layoutRow', prompt: `You set up (${sc.html}) ÷ ${brH(D)} for long division. Which row goes under the bracket?`,
    board: `(${sc.tex}) \\div ${brT(D)}`, picture: { ld: { P, D, upto: 'none' } },
    solution: [`Write the dividend in descending powers, from ${xp(P.length - 1)} down to the constant.`, `Every missing power gets a 0 placeholder: ${pH(P, true)}.`] }, opts, { min: 3 });
});
export const placeholderCount: Gen = (R, n) => retry(() => {
  const P = gappy(R, 2, 5), D = linD(R), sc = scrambled(R, P);
  const zeros = P.slice(1).filter(v => isZ(v)).length;
  return numItem({ id: `placeholderCount-${n}`, family: 'placeholderCount', prompt: `You set up (${sc.html}) ÷ ${brH(D)} for long division. How many 0 placeholders does the row under the bracket need?`,
    board: `(${sc.tex}) \\div ${brT(D)}`, picture: { ld: { P, D, upto: 'none' } },
    solution: [`The powers run from ${xp(P.length - 1)} down to the constant: ${P.length} columns.`, `The complete row is ${pH(P, true)}: ${ans(zeros)} of them are placeholders.`] },
    zeros, `Right: ${pH(P, true)}.`,
    [{ v: 0, mc: MC.placeholder, say: 'Every missing power needs a 0 in its column, or the terms land in the wrong columns.' }, { v: P.length, say: `That counts every column. Count only the powers that are missing.` }],
    'List the powers from the highest down to the constant, and count the ones that do not appear.');
});

// ===================== ld-next-term =====================
const mono = (c: Q, p: number): Co => shiftC([c], p);
export const monoDivide: Gen = (R, n) => retry(() => {
  const b = int(R, 1, 6), qq = nz(R, -6, 6), a = b * qq, m2 = int(R, 1, 2), d = int(R, 0, 3), m1 = m2 + d;
  const top = mono(q(a), m1), bot = mono(q(b), m2), right = mono(q(qq), d);
  const opts: Opt[] = [
    { t: pH(right), ok: true, say: `Right: divide the numbers (${nH(a)} ÷ ${b} = ${nH(qq)}) and subtract the exponents (${m1} − ${m2} = ${d}).`, key: keyC(right) },
    { t: pH(mono(q(qq), m1)), say: `The ${X}s divide too: ${xp(m1)} ÷ ${xp(m2)} = ${xp(d)}.`, key: keyC(mono(q(qq), m1)) },
    { t: pH(mono(q(qq), m1 + m2)), say: `Dividing powers subtracts the exponents: ${m1} − ${m2}.`, key: keyC(mono(q(qq), m1 + m2)) },
    { t: pH(mono(q(a - b), d)), say: `The coefficients divide: ${nH(a)} ÷ ${b}, not ${nH(a)} − ${b}.`, key: keyC(mono(q(a - b), d)) },
  ];
  return keyed(R, { id: `monoDivide-${n}`, family: 'monoDivide', prompt: `Divide: ${pH(top)} ÷ ${pH(bot)}.`, board: `\\frac{${pT(top)}}{${pT(bot)}}`,
    solution: [`Numbers: ${nH(a)} ÷ ${b} = ${nH(qq)}. Powers: ${xp(m1)} ÷ ${xp(m2)} = ${xp(d)}.`] }, opts);
});
/** a division P ÷ D (monic linear D) with integer quotient, stopped before cycle k */
function midway(R: () => number, deg: number) {
  const D = linD(R, 1, 7), Qc = rpoly(R, deg - 1, -7, 7, nz(R, -4, 5)), r = int(R, -9, 9);
  const P = addC(mulC(D, Qc), co([r]));
  if (P.some(c => Math.abs(c.p) > 50)) throw new Reroll();
  return { D, Qc, P, dv: divide(P, D) };
}
export const nextTerm: Gen = (R, n) => retry(() => {
  const deg = int(R, 2, 3), { D, P, dv } = midway(R, deg);
  const ks = dv.cycles.map((c, i) => (degOf(c.before)! >= 2 ? i : -1)).filter(i => i >= 0);
  if (!ks.length) throw new Reroll();
  const k = pickOf(R, ks);
  const cy = dv.cycles[k]!, S = cy.before, dS = degOf(S)!;
  const lead = S[0]!, d0 = D[1]!;
  const right = mono(cy.t, cy.pow);
  const opts: Opt[] = [
    { t: pH(right), ok: true, say: `Right: ${pH(mono(lead, dS))} ÷ ${X} = ${pH(right)}, which cancels the leading term.`, key: keyC(right) },
    { t: pH(mono(qDiv(lead, d0), dS)), mc: MC.wrongPart, say: `Divide by the divisor's LEADING term, ${X}, not by its constant ${qH(d0)}: the goal is to cancel ${pH(mono(lead, dS))}.`, key: keyC(mono(qDiv(lead, d0), dS)) },
    { t: pH(mono(lead, dS)), say: `Times ${X} that would give degree ${dS + 1}. Divide ${pH(mono(lead, dS))} by ${X}.`, key: keyC(mono(lead, dS)) },
    { t: pH(mono(qNeg(lead), dS - 1)), say: `The sign stays: ${pH(right)} times ${X} must equal ${pH(mono(lead, dS))}.`, key: keyC(mono(qNeg(lead), dS - 1)) },
  ];
  return keyed(R, { id: `nextTerm-${n}`, family: 'nextTerm', prompt: `Long division of ${divH(P, D)} has reached the residual ${pH(S)}. What is the next term of the quotient?`,
    board: divT(P, D), picture: { ld: { P, D, upto: k } },
    solution: [`Divide the leading terms: ${pH(mono(lead, dS))} ÷ ${X}.`, `That is ${pH(right)}: times ${pH(D)} it cancels the ${xp(dS)} term.`] }, opts);
});

// ===================== ld-residual-update =====================
export const subtractRow: Gen = (R, n) => retry(() => {
  const deg = int(R, 2, 3), { D, P, dv } = midway(R, deg);
  const k = deg - 2;               // the cycle whose residual is quadratic
  const cy0 = dv.cycles[k];
  if (!cy0 || degOf(cy0.before) !== 2) throw new Reroll();
  const cy = cy0, S = pad3(cy.before);
  const [a, b, c] = S.map(qv) as [number, number, number], d = qv(D[1]!);
  const nb = b - a * d;
  if (!Number.isInteger(nb)) throw new Reroll();
  const t = mono(cy.t, 1);
  return pairItem({ id: `subtractRow-${n}`, family: 'subtractRow', prompt: `In ${divH(P, D)} the residual is ${pH(S)} and the next quotient term is ${pH(t)}. Subtract ${pH(t)} · (${pH(D)}). What is the new residual?`,
    board: `${brT(S)} - ${mT(t)}${brT(D)}`, picture: { ld: { P, D, upto: k, tNext: true } },
    solution: [`${pH(t)}(${pH(D)}) = ${pH(cy.prod)}.`, `(${pH(S)}) − (${pH(cy.prod)}): the ${xp(2)} terms cancel and every lower term stays.`, `New residual: ${pH(cy.after)}, so the boxes hold ${ans(nH(nb))} and ${ans(nH(c))}.`] },
    nb, c, { lead: '', op: `${X} +` }, `Right: the new residual is ${pH(cy.after)}.`,
    [{ x: b + a * d, y: c, mc: MC.negFirst, say: `The minus goes in front of the WHOLE product: −(${pH(cy.prod)}) changes the sign of ${nH(a * d)}${X} too.` },
      { x: nb, y: 0, say: `Keep every lower term: the constant ${nH(c)} is still in the residual.` }],
    `Multiply ${pH(t)} by all of ${pH(D)}, then subtract every term.`);
});
const pad3 = (c: Co) => trim(c);
export const updateChoice: Gen = (R, n) => retry(() => {
  const { D, P, dv } = midway(R, 3);
  const cy = dv.cycles[0]!, S = cy.before;
  const d = D[1]!, a = S[0]!, b = S[1]!;
  const right = cy.after;
  const negFirst = subC(S, co([a, qNeg(qMul(a, d)), 0, 0]));   // only the leading term's sign changed
  const added = addC(S, cy.prod);
  const dropped = trim(co([0, qSub(b, qMul(a, d)), 0, 0]));
  const opts: Opt[] = [
    { t: pH(right), ok: true, say: `Right: ${pH(S)} − (${pH(cy.prod)}) keeps every lower term.`, key: keyC(right) },
    { t: pH(negFirst), mc: MC.negFirst, say: `The minus applies to every term of ${pH(cy.prod)}, the ${xp(2)} term too.`, key: keyC(negFirst) },
    { t: pH(added), mc: MC.addSub, say: 'Long division SUBTRACTS the product: that is what cancels the leading term.', key: keyC(added) },
    { t: pH(dropped), say: `Keep all lower-degree terms: ${pH(co([S[2]!, S[3]!]))} is still part of the residual.`, key: keyC(dropped) },
  ];
  return keyed(R, { id: `updateChoice-${n}`, family: 'updateChoice', prompt: `First cycle of ${divH(P, D)}: the quotient term is ${pH(mono(cy.t, cy.pow))}. What is the residual after subtracting?`,
    board: `${brT(S)} - ${mT(mono(cy.t, cy.pow))}${brT(D)}`, picture: { ld: { P, D, upto: 0, tNext: true } },
    solution: [`${pH(mono(cy.t, cy.pow))}(${pH(D)}) = ${pH(cy.prod)}.`, `Subtract it from ${pH(S)}: the ${xp(3)} terms cancel and the rest is ${pH(right)}.`] }, opts);
});

// ===================== ld-iterate-stop =====================
export const ldFull: Gen = (R, n) => retry(() => {
  if (R() < 0.3) {
    // degree-1 dividend: a constant quotient
    const D = co([1, int(R, 1, 6)]), a = int(R, 2, 5), r = nz(R, -5, 5), P = addC(scaleC(D, q(a)), co([r]));
    return pairItem({ id: `ldFull-${n}`, family: 'ldFull', prompt: `Divide ${pH(P)} by ${pH(D)}: fill in ${pH(P)} = (${pH(D)}) · ☐ + ☐.`, board: `${pT(P)} = ${brT(D)} \\cdot \\square + \\square`,
      picture: { ld: { P, D, upto: 'frame' } },
      solution: [`${pH(co([a, 0]))} ÷ ${X} = ${a}, and ${a}(${pH(D)}) = ${pH(scaleC(D, q(a)))}.`, `${pH(P)} − (${pH(scaleC(D, q(a)))}) = ${nH(r)}: quotient ${ans(a)}, remainder ${ans(nH(r))}.`] },
      a, r, { lead: `${pH(P)} = (${pH(D)}) ·`, op: '+' }, `Right: ${pH(P)} = ${a}(${pH(D)}) ${r < 0 ? MINUS : '+'} ${Math.abs(r)}.`,
      [{ x: a + r, y: 0, mc: MC.addsRem, say: 'The leftover is the remainder, added at the end, not folded into the quotient.' }], `Divide the leading terms (${pH(co([a, 0]))} ÷ ${X}), multiply back, and subtract.`);
  }
  const D = linD(R), b = nz(R, -8, 8), r = int(R, -9, 9);
  const Qc = co([1, b]), P = addC(mulC(D, Qc), co([r]));
  const dv = divide(P, D);
  return pairItem({ id: `ldFull-${n}`, family: 'ldFull', prompt: `Divide ${pH(P)} by ${pH(D)}: fill in ${pH(P)} = (${pH(D)})(${X} + ☐) + ☐.`, board: `${pT(P)} = ${brT(D)}(x + \\square) + \\square`,
    picture: { ld: { P, D, upto: 'frame' } },
    solution: [`${xp(2)} ÷ ${X} = ${X}; subtract ${X}(${pH(D)}): ${pH(dv.cycles[0]!.after)}.`, `Divide again: ${nH(b)}; subtract ${nH(b)}(${pH(D)}): ${nH(r)} is left, degree 0 < 1.`, `Quotient ${pH(Qc)}, remainder ${nH(r)}: the boxes hold ${ans(nH(b))} and ${ans(nH(r))}.`] },
    b, r, { lead: `${pH(P)} = (${pH(D)})(${X} +`, op: ') +' }, `Right: ${pH(P)} = ${prodH(D, Qc)}${r ? ` ${r < 0 ? MINUS : '+'} ${Math.abs(r)}` : ''}.`,
    [{ x: b + r, y: 0, mc: MC.addsRem, say: 'The remainder is added after the product, not to the quotient.' },
      { x: b, y: 0, mc: r ? MC.needZero : undefined, say: `There is a leftover: ${pH(P)} − ${prodH(D, Qc)} = ${nH(r)}.` }],
    `Divide leading terms, multiply, subtract, and repeat until the residual is a constant.`);
});
/** the remainder slips: dividing by x + c instead of x − c, and skipping the 0 placeholders */
function remSlips(P: Co, c: Q) {
  const sl: { v: number; mc?: string; say: string }[] = [];
  sl.push({ v: qv(synth(P, qNeg(c)).R), mc: MC.zeroSign, say: `Check the sign: ${pH(xMinus(c))} means the column multiplier is ${qH(c)}.` });
  const nzc = trim(P).filter(v => !isZ(v));
  if (nzc.length < trim(P).length) sl.push({ v: qv(synth(nzc, c).R), mc: MC.placeholder, say: 'A missing power needs a 0 in its column: without it the terms slide into the wrong columns.' });
  return sl;
}
export const ldRemainder: Gen = (R, n, sg) => retry(() => {
  const deg = sg === 'method-select' ? int(R, 2, 4) : R() < 0.2 ? 1 : int(R, 2, 4);
  const c = nz(R, -6, 6);
  const P = deg >= 3 && R() < 0.6 ? gappy(R, deg, deg) : rpoly(R, deg, -9, 9, nz(R, -3, 4));
  const D = xMinus(c), dv = divide(P, D), r = qv(dv.R[0]!);
  if (Math.abs(r) > 400) throw new Reroll();
  return numItem({ id: `ldRemainder-${n}`, family: 'ldRemainder', prompt: `Divide ${pH(P)} by ${pH(D)}. What is the remainder?`, board: divT(P, D),
    picture: { ld: { P, D, upto: 'frame' } },
    solution: [`Lay out ${pH(P, true)} and divide by ${pH(D)}, one term at a time.`, `The quotient is ${pH(dv.Q)}.`, `The last residual has degree 0: the remainder is ${ans(nH(r))}.`] },
    r, `Right: ${divH(P, D)} = ${pH(dv.Q)}, remainder ${nH(r)}.`, remSlips(P, q(c)), 'Divide leading terms, multiply, subtract, until the residual is a constant.');
});
export const ldQuotientPick: Gen = (R, n) => retry(() => {
  const c = nz(R, -6, 6), D = xMinus(c);
  const P = R() < 0.5 ? gappy(R, 3, 3) : rpoly(R, 3, -9, 9, nz(R, -3, 4));
  const dv = divide(P, D), sw = divide(P, xMinus(-c));
  const first = mono(dv.cycles[0]!.t, dv.cycles[0]!.pow);
  if (isZero(dv.R)) throw new Reroll();
  const opts: Opt[] = [
    { t: pH(dv.Q), ok: true, say: `Right: ${pH(P)} = ${prodH(D, dv.Q)} ${dv.R[0]!.p < 0 ? MINUS : '+'} ${Math.abs(qv(dv.R[0]!))}.`, key: keyC(dv.Q) },
    { t: pH(addC(dv.Q, dv.R)), mc: MC.addsRem, say: `The remainder ${qH(dv.R[0]!)} is not part of the quotient: it is what is left over.`, key: keyC(addC(dv.Q, dv.R)) },
    { t: pH(first), mc: MC.stopsFirst, say: `After the first cancellation the residual still has degree ${degOf(dv.cycles[0]!.after)}: keep going.`, key: keyC(first) },
    { t: pH(sw.Q), mc: MC.zeroSign, say: `That divides by ${pH(xMinus(-c))}. Watch the sign of the divisor.`, key: keyC(sw.Q) },
  ];
  return keyed(R, { id: `ldQuotientPick-${n}`, family: 'ldQuotientPick', prompt: `Divide ${pH(P)} by ${pH(D)}. Which is the quotient?`, board: divT(P, D),
    picture: { ld: { P, D, upto: 'frame' } },
    solution: [`Lay out ${pH(P, true)}. Each cycle: divide leading terms, multiply, subtract.`, `The quotient terms are ${dv.cycles.map(cy => pH(mono(cy.t, cy.pow))).join(', ')}; the remainder is ${qH(dv.R[0]!)}.`] }, opts);
});

// ===================== ld-nonmonic-linear =====================
export const nonmonicQ: Gen = (R, n) => retry(() => {
  const a = pickOf(R, [2, 3]), b = nz(R, -5, 5), k = nz(R, -4, 4), m = nz(R, -6, 6), r = int(R, -5, 5);
  const D = co([a, b]), Qc = co([k, m]), P = addC(mulC(D, Qc), co([r]));
  if (P.some(v => Math.abs(v.p) > 12) || b % a === 0) throw new Reroll();
  const slips: { x: number; y: number; mc?: string; say: string }[] = [];
  const s1 = divide(P, co([1, b])).Q, s2 = scaleC(Qc, q(a));
  if (s1.length === 2 && whole(s1)) slips.push({ x: qv(s1[0]!), y: qv(s1[1]!), mc: MC.ignoresLead, say: `That divides by ${pH(co([1, b]))}. Divide the leading terms by ${a}${X}, not by ${X}.` });
  slips.push({ x: qv(s2[0]!), y: qv(s2[1]!), mc: MC.ignoresLead, say: `${pH(co([a * k, 0]))} ÷ ${a}${X} = ${nH(k)}: the ${a} of the divisor divides the coefficient too.` });
  return pairItem({ id: `nonmonicQ-${n}`, family: 'nonmonicQ', prompt: `Divide ${pH(P)} by ${pH(D)}. The quotient is ☐${X} + ☐. Fill it in.`, board: divT(P, D),
    picture: { ld: { P, D, upto: 'frame' } },
    solution: [`${pH(co([P[0]!.p, 0, 0]))} ÷ ${a}${X} = ${pH(co([k, 0]))}; subtract ${pH(co([k, 0]))}(${pH(D)}): ${pH(divide(P, D).cycles[0]!.after)}.`, `Then ÷ ${a}${X} again: ${nH(m)}. The quotient is ${pH(Qc)} (remainder ${nH(r)}): the boxes hold ${ans(nH(k))} and ${ans(nH(m))}.`] },
    k, m, { lead: '', op: `${X} +` }, `Right: ${pH(P)} = ${prodH(D, Qc)}${r ? ` ${r < 0 ? MINUS : '+'} ${Math.abs(r)}` : ''}.`, slips,
    `Divide the leading terms by ${a}${X} each cycle.`);
});
export const nonmonicFrac: Gen = (R, n) => retry(() => {
  const a = pickOf(R, [2, 3]), b = nz(R, -5, 5);
  if (b % a === 0) throw new Reroll();
  const D = co([a, b]);
  const P = co([other(R, -9, 9, [0, a, -a, 2 * a, -2 * a, 3 * a, -3 * a]), int(R, -9, 9), int(R, -9, 9)]);
  const dv = divide(P, D);
  if (whole(dv.Q)) throw new Reroll();
  const fmt = (Qc: Co, r: Co) => `Q = ${pH(Qc)}, R = ${isZero(r) ? '0' : pH(r)}`;
  const kq = (Qc: Co, r: Co) => `${keyC(Qc)}|${keyC(r)}`;
  const s1 = divide(P, co([1, b]));
  const rounded = trim(dv.Q.map(v => q(Math.round(qv(v)))));
  const opts: Opt[] = [
    { t: fmt(dv.Q, dv.R), ok: true, say: `Right: ${prodH(D, dv.Q)} + ${qH(dv.R[0]!)} = ${pH(P)}.`, key: kq(dv.Q, dv.R) },
    { t: fmt(s1.Q, s1.R), mc: MC.ignoresLead, say: `That divides by ${pH(co([1, b]))}. The ${a} in ${pH(D)} divides every quotient term.`, key: kq(s1.Q, s1.R) },
    { t: fmt(rounded, dv.R), mc: MC.rounded, say: 'Keep the fractions exact: rounded coefficients no longer multiply back to the dividend.', key: kq(rounded, dv.R) },
    { t: fmt(dv.Q, co([qNeg(dv.R[0]!)])), say: 'Check the remainder by multiplying back: (divisor)(quotient) + remainder must give the dividend.', key: kq(dv.Q, co([qNeg(dv.R[0]!)])) },
  ];
  return keyed(R, { id: `nonmonicFrac-${n}`, family: 'nonmonicFrac', prompt: `Divide ${pH(P)} by ${pH(D)}. Which quotient <i>Q</i> and remainder <i>R</i> are right?`, board: divT(P, D),
    picture: { ld: { P, D, upto: 'frame' } },
    solution: [`Divide leading terms by ${a}${X}: ${dv.cycles.map(cy => pH(mono(cy.t, cy.pow))).join(', then ')}.`, `Remainder ${qH(dv.R[0]!)}: ${prodH(D, dv.Q)} + ${qH(dv.R[0]!)} = ${pH(P)}.`.replace('+ −', '− ')] }, opts);
});

// ===================== ld-quadratic-divisor =====================
function quadDiv(R: () => number) {
  const D = pickOf(R, [co([1, 0, 1]), co([1, -1, 2]), co([1, 0, -3]), co([1, int(R, -3, 3), nz(R, -4, 4)])]);
  const dq = int(R, 0, 2);
  const Qc = dq === 0 ? co([int(R, 2, 5)]) : rpoly(R, dq, -5, 5, nz(R, -2, 3));
  const Rc = R() < 0.15 ? co([0]) : R() < 0.35 ? co([nz(R, -9, 9)]) : co([nz(R, -6, 6), int(R, -9, 9)]);
  const P = addC(mulC(D, Qc), Rc);
  if (P.some(v => Math.abs(v.p) > 30)) throw new Reroll();
  return { D, Qc, Rc, P };
}
export const quadDivR: Gen = (R, n) => retry(() => {
  const { D, Qc, Rc, P } = quadDiv(R);
  const r1 = qv(coefAt(Rc, 1)), r0 = qv(coefAt(Rc, 0));
  const naive = [qv(coefAt(P, 1)), qv(coefAt(P, 0))];
  return pairItem({ id: `quadDivR-${n}`, family: 'quadDivR', prompt: `Divide ${pH(P)} by ${pH(D)}. The remainder is ☐${X} + ☐. Fill it in.`, board: divT(P, D),
    picture: { ld: { P, D, upto: 'frame' } },
    solution: [`Each cycle divides the leading term by ${xp(2)} and subtracts that term times all of ${pH(D)}.`, `Quotient ${pH(Qc)}; stop when the residual has degree below 2.`, `The remainder is ${isZero(Rc) ? '0' : pH(Rc)}: the boxes hold ${ans(nH(r1))} and ${ans(nH(r0))}.`] },
    r1, r0, { lead: '', op: `${X} +` }, `Right: ${pH(P)} = ${prodH(D, Qc)}${isZero(Rc) ? '' : ` + (${pH(Rc)})`}.`,
    [{ x: naive[0]!, y: naive[1]!, say: `Those are the last two coefficients of the dividend. Subtract each quotient term times the WHOLE divisor ${pH(D)}.` }],
    `Divide leading terms by ${xp(2)}, multiply by all of ${pH(D)}, subtract, and stop at degree 1 or less.`);
});
export const quadDivQ: Gen = (R, n) => retry(() => {
  const { D, Qc, Rc, P } = quadDiv(R);
  if (isZero(Rc) || degOf(P)! < 3) throw new Reroll();
  const top = trim(P.slice(0, P.length - 2));           // P divided by x² only
  const opts: Opt[] = [
    { t: pH(Qc), ok: true, say: `Right: ${pH(P)} = ${prodH(D, Qc)} + ${parH2(Rc)}.`, key: keyC(Qc) },
    { t: pH(addC(Qc, Rc)), mc: MC.addsRem, say: 'The remainder stays separate: it is added after the product, not to the quotient.', key: keyC(addC(Qc, Rc)) },
    { t: pH(top), say: `That divides by ${xp(2)} only. Each cycle subtracts the term times ALL of ${pH(D)}.`, key: keyC(top) },
    { t: pH(shiftC(Qc, 1)), say: `The quotient has degree ${degOf(P)} − 2 = ${degOf(Qc)}.`, key: keyC(shiftC(Qc, 1)) },
  ];
  return keyed(R, { id: `quadDivQ-${n}`, family: 'quadDivQ', prompt: `Divide ${pH(P)} by ${pH(D)}. Which is the quotient?`, board: divT(P, D),
    picture: { ld: { P, D, upto: 'frame' } },
    solution: [`Divide the leading terms by ${xp(2)} each cycle and subtract the term times ${pH(D)}.`, `Stop when the residual's degree is below 2: the remainder is ${pH(Rc)}.`] }, opts);
});
const parH2 = (c: Co) => (trim(c).length > 1 ? `(${pH(c)})` : pH(c));
export { qSub, xMinus, mono };
