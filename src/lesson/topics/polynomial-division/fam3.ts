// fam3.ts: stage 2, synthetic division and the other methods: when synthetic division applies (x − c and its c),
// the complete coefficient row, the bring-down / multiply / add recurrence, reading the bottom row as Q and R, the
// match with long division, division by inspection, and choosing a method from the divisor. Pure: no DOM.
import { int } from '../../runtime/item';
import {
  type Co, nP, prodH, parT, parH, type Q, MINUS, X, addC, brH, brT, co, degOf, divide, isZ, isZero, keyC, mulC, nH, pH, pT, q, qH, qAdd, qMul, qNeg,
  qv, synth, trim, xMinus, xp,
} from './pd';
import { type Gen, type Opt, MC, Reroll, ans, keyed, numItem, nz, other, pairItem, pickOf, retry } from './common';
import { rpoly } from './fam1';

const divT = (P: Co, D: Co) => `${parT(P)} \\div ${parT(D)}`;
const divH = (P: Co, D: Co) => `${parH(P)} ÷ ${parH(D)}`;
const rowH = (xs: readonly Q[]) => xs.map(qH).join(', ');
/** a dividend for synthetic division: degree 2-4, sometimes with missing powers */
function dividend(R: () => number, lo = 2, hi = 4, gaps = 0.4): Co {
  const d = int(R, lo, hi);
  return co(Array.from({ length: d + 1 }, (_, i) => (i === 0 ? nz(R, -3, 4) : R() < gaps ? 0 : nz(R, -9, 9))));
}
/** c for synthetic division: positive, then negative, sometimes 0 */
const cOf = (R: () => number, zero = 0.08) => (R() < zero ? 0 : nz(R, -5, 5));

// ===================== sd-scope =====================
export const sdApplies: Gen = (R, n) => retry(() => {
  const c = cOf(R, 0.15), a = pickOf(R, [2, 3, 4]), b = nz(R, -7, 7), k = int(R, 2, 9);
  const right = xMinus(c);
  const wr: { d: Co; why: string }[] = [
    { d: co([a, b]), why: `${pH(co([a, b]))} has leading coefficient ${a}, not 1.` },
    { d: co([1, 0, -k]), why: `${pH(co([1, 0, -k]))} has degree 2: ordinary synthetic division needs ${X} − <i>c</i>.` },
    { d: co([1, 0, k]), why: `${pH(co([1, 0, k]))} has degree 2.` },
    { d: co([a, 0]), why: `${a}${X} has leading coefficient ${a}, not 1.` },
  ];
  const opts: Opt[] = [
    { t: pH(right), ok: true, say: `Right: ${pH(right)} = ${X} − ${c < 0 ? `(${nH(c)})` : c}, so <i>c</i> = ${nH(c)}.` },
    ...wr.map(w => ({ t: pH(w.d), mc: MC.synthAny, say: `${w.why} Use long division for it.` })),
  ];
  const P = dividend(R, 3, 4, 0.2);
  return keyed(R, { id: `sdApplies-${n}`, family: 'sdApplies', prompt: `You want to divide ${pH(P)} by one of these divisors with ordinary synthetic division. Which one does it work for?`, board: `${brT(P)} \\div \\,?`,
    solution: [`Ordinary synthetic division divides by a divisor of the form ${X} − <i>c</i>: degree 1, leading coefficient 1.`, `Only ${pH(right)} has that form.`] }, opts);
});
export const sdC: Gen = (R, n) => retry(() => {
  const c = cOf(R, 0.12), D = xMinus(c), P = dividend(R, 2, 4, 0.25);
  return numItem({ id: `sdC-${n}`, family: 'sdC', prompt: `You divide ${pH(P)} by ${pH(D)} with synthetic division. Which number <i>c</i> goes in the box?`, board: divT(P, D),
    picture: { sd: { P, upto: 'frame', cAsk: true }, reveal: { c: q(c) } },
    solution: [`Write the divisor as ${X} − <i>c</i>: ${pH(D)} = ${X} − ${c < 0 ? `(${nH(c)})` : c}.`, `So <i>c</i> = ${ans(nH(c))}.`] },
    c, `Right: ${pH(D)} = ${X} − ${c < 0 ? `(${nH(c)})` : c}.`,
    [{ v: -c, mc: MC.zeroSign, say: `${pH(D)} = ${X} − (${nH(c)}): <i>c</i> is the number that makes the divisor 0, ${nH(c)}.` }], `Write ${pH(D)} in the form ${X} − <i>c</i>.`);
});

// ===================== sd-coefficient-row =====================
export const coefRow: Gen = (R, n) => retry(() => {
  const P = dividend(R, 3, 4, 0.5);
  const missing = P.slice(1).some(v => isZ(v));
  const negs = P.some(v => v.p < 0);
  if (!missing || !negs) throw new Reroll();
  const c = cOf(R, 0);
  const full = P.slice(), noZero = P.filter(v => !isZ(v)), abs = P.map(v => q(Math.abs(qv(v))));
  const opts: Opt[] = [
    { t: rowH(full), ok: true, say: 'Right: one entry per power, from the top down, with 0 for each missing power.' },
    { t: rowH(noZero), mc: MC.placeholder, say: 'Each missing power still needs its 0: without it the entries slide into the wrong columns.' },
    { t: rowH(abs), mc: MC.minusDetached, say: 'The minus sign belongs to its term: a term written − 5x has coefficient −5.' },
    { t: rowH(full.slice().reverse()), say: 'The row starts at the highest power and goes down to the constant.' },
  ];
  return keyed(R, { id: `coefRow-${n}`, family: 'coefRow', prompt: `For synthetic division of ${pH(P)} by ${pH(xMinus(c))}, which is the top row of coefficients?`, board: divT(P, xMinus(c)),
    picture: { sd: { P, c: q(c), upto: 'none' } },
    solution: [`Go through the powers from ${xp(P.length - 1)} down to the constant; a missing power gets 0, and each coefficient keeps its sign.`, `The row is ${rowH(full)}.`] }, opts);
});
export const rowBack: Gen = (R, n) => retry(() => {
  const P = dividend(R, 3, 4, 0.5);
  if (!P.slice(1).some(v => isZ(v)) || !P.slice(1).some(v => !isZ(v))) throw new Reroll();
  const noZero = co(P.filter(v => !isZ(v)));
  const shifted = trim([...P, q(0)]);
  const flip = P.map((v, i) => (i > 0 && v.p < 0 ? qNeg(v) : v));
  const opts: Opt[] = [
    { t: pH(P), ok: true, say: `Right: ${P.length} entries means degree ${P.length - 1}, and each 0 is a missing power.`, key: keyC(P) },
    { t: pH(noZero), mc: MC.placeholder, say: 'The 0s are placeholders: each one stands for a missing power, so the powers do not close up.', key: keyC(noZero) },
    { t: pH(shifted), say: `${P.length} entries run from ${xp(P.length - 1)} down to the constant: the last entry is the constant.`, key: keyC(shifted) },
    { t: pH(flip), mc: MC.minusDetached, say: 'A negative entry is a negative coefficient: that term is subtracted.', key: keyC(flip) },
  ];
  return keyed(R, { id: `rowBack-${n}`, family: 'rowBack', prompt: `The top row of a synthetic-division tableau is ${rowH(P)}. Which dividend does it stand for?`, board: `\\text{top row: } ${P.map(v => `${v.p}`).join(',\\ ')}`,
    solution: [`${P.length} entries: the powers ${xp(P.length - 1)} down to the constant.`, `So the dividend is ${pH(P)}.`] }, opts);
});

// ===================== sd-recurrence =====================
export const sdNext: Gen = (R, n) => retry(() => {
  const P = dividend(R, 2, 4, 0.25), c = cOf(R, 0.06), sd = synth(P, q(c));
  const N = P.length, j = int(R, 1, N - 1);
  const b = qv(sd.bot[j]!), prev = qv(sd.bot[j - 1]!), a = qv(P[j]!), aPrev = qv(P[j - 1]!);
  if (Math.abs(b) > 200) throw new Reroll();
  return numItem({ id: `sdNext-${n}`, family: 'sdNext', prompt: `Synthetic division of ${pH(P)} by ${pH(xMinus(c))}. The bottom row so far is ${rowH(sd.bot.slice(0, j))}. What is the next bottom entry?`,
    board: divT(P, xMinus(c)), picture: { sd: { P, c: q(c), upto: j, ask: true } },
    solution: [`Multiply the newest bottom entry by <i>c</i>: ${nH(c)} · ${nP(prev)} = ${nH(c * prev)}, and write it under ${nH(a)}.`, `Add: ${nH(a)} + ${c * prev < 0 ? `(${nH(c * prev)})` : c * prev} = ${ans(nH(b))}.`] },
    b, `Right: ${nH(a)} + ${nH(c)} · ${nP(prev)} = ${nH(b)}.`,
    [{ v: a - c * prev, mc: MC.subtracts, say: `Synthetic division ADDS the product: ${nH(a)} + ${nH(c * prev)}.` },
      { v: a + c * aPrev, mc: MC.recSlip, say: `Multiply the newest BOTTOM entry (${nH(prev)}), not the top coefficient ${nH(aPrev)}.` }],
    `Multiply the newest bottom entry by ${nH(c)}, then add it to the next top entry.`);
});
export const sdLast: Gen = (R, n) => retry(() => {
  const P = dividend(R, 2, 4, 0.3), c = cOf(R, 0.05), sd = synth(P, q(c));
  const r = qv(sd.R);
  if (Math.abs(r) > 300) throw new Reroll();
  // the recurrence slip: each product uses the TOP entry before it
  const slipTop = qv(qAdd(P[P.length - 1]!, qMul(q(c), P[P.length - 2]!)));
  return numItem({ id: `sdLast-${n}`, family: 'sdLast', prompt: `Use synthetic division to divide ${pH(P)} by ${pH(xMinus(c))}. What is the last number in the bottom row?`,
    board: divT(P, xMinus(c)), picture: { sd: { P, c: q(c), upto: 'frame' } },
    solution: [`Top row ${rowH(P)}, <i>c</i> = ${nH(c)}. Bring down ${qH(P[0]!)}.`, `Each step: multiply the newest bottom entry by ${nH(c)} and add. Bottom row: ${rowH(sd.bot)}.`, `The last entry is the remainder: ${ans(nH(r))}.`] },
    r, `Right: the bottom row is ${rowH(sd.bot)}.`,
    [{ v: qv(sd.bot[sd.bot.length - 2]!), mc: MC.lastCol, say: 'That is the column before. Do the last column too: it holds the remainder.' },
      { v: qv(synth(P, q(-c)).R), mc: MC.subtracts, say: `Add the products (or use <i>c</i> = ${nH(c)} with its own sign).` },
      { v: slipTop, mc: MC.recSlip, say: 'Multiply the newest bottom entry by c, not the top coefficient.' }],
    'Bring down, then multiply by c and add, column after column.');
});

// ===================== sd-decode =====================
export const sdDecodeQ: Gen = (R, n) => retry(() => {
  const P = dividend(R, 3, 4, 0.3), c = cOf(R, 0.05), sd = synth(P, q(c));
  const N = P.length - 1;
  if (sd.bot.some(v => Math.abs(qv(v)) > 150)) throw new Reroll();
  const fmt = (Qc: Co, r: Q) => `Q = ${pH(Qc)}, R = ${qH(r)}`;
  const k = (Qc: Co, r: Q) => `${keyC(Qc)}|${r.p}`;
  const qBig = trim([...sd.bot.slice(0, N), q(0)]);            // the quotient read with the dividend's degree
  const qAll = trim(sd.bot.slice());                            // every entry as a quotient coefficient
  const opts: Opt[] = [
    { t: fmt(sd.Q, sd.R), ok: true, say: `Right: the first ${N} entries are the coefficients of a degree-${N - 1} quotient; the last is the remainder.`, key: k(sd.Q, sd.R) },
    { t: fmt(qBig, sd.R), mc: MC.qDegree, say: `Dividing a degree-${N} polynomial by ${X} − <i>c</i> lowers the degree by one: the quotient starts at ${xp(N - 1)}.`, key: k(qBig, sd.R) },
    { t: fmt(qAll, q(0)), mc: MC.remAsCoef, say: 'The last entry is the remainder, not a coefficient of the quotient.', key: k(qAll, q(0)) },
    { t: fmt(trim(sd.bot.slice(1)), sd.bot[0]!), say: 'The first entries are the quotient (from the top power down); the LAST entry is the remainder.', key: k(trim(sd.bot.slice(1)), sd.bot[0]!) },
  ];
  return keyed(R, { id: `sdDecodeQ-${n}`, family: 'sdDecodeQ', prompt: `The tableau divides ${pH(P)} by ${pH(xMinus(c))}; its bottom row is ${rowH(sd.bot)}. Which quotient and remainder does it give?`,
    board: divT(P, xMinus(c)), picture: { sd: { P, c: q(c), upto: N + 1 } },
    solution: [`The dividend has degree ${N}, so the quotient has degree ${N - 1}: its coefficients are ${rowH(sd.bot.slice(0, N))}.`, `The last entry, ${qH(sd.R)}, is the remainder.`] }, opts);
});
export const sdDecodeCoef: Gen = (R, n) => retry(() => {
  const P = dividend(R, 3, 4, 0.3), c = cOf(R, 0.05), sd = synth(P, q(c));
  const N = P.length - 1;
  const pw = int(R, 0, N - 2);                  // the power asked (the shifted reading has an entry for it too)
  const idx = N - 1 - pw, v = qv(sd.bot[idx]!), shifted = qv(sd.bot[idx + 1]!);
  if (Math.abs(v) > 150 || sd.bot.slice(0, N).every(b => isZ(b))) throw new Reroll();
  const name = pw === 0 ? 'the constant term' : `the coefficient of ${xp(pw)}`;
  return numItem({ id: `sdDecodeCoef-${n}`, family: 'sdDecodeCoef', prompt: `Synthetic division of ${pH(P)} by ${pH(xMinus(c))} gives the bottom row ${rowH(sd.bot)}. What is ${name} in the quotient?`,
    board: divT(P, xMinus(c)), picture: { sd: { P, c: q(c), upto: N + 1 } },
    solution: [`The quotient has degree ${N - 1}: ${rowH(sd.bot.slice(0, N))} are the coefficients of ${Array.from({ length: N }, (_, i) => (N - 1 - i === 0 ? 'the constant' : xp(N - 1 - i))).join(', ')}.`, `So ${name} is ${ans(nH(v))}.`] },
    v, `Right: the quotient is ${pH(sd.Q)}.`,
    [{ v: shifted, mc: MC.qDegree, say: `The quotient is one degree lower than the dividend: the first entry goes with ${xp(N - 1)}.` }], `Match the entries to the powers from ${xp(N - 1)} down; the last entry is the remainder.`);
});

// ===================== sd-link-long-division =====================
export const linkBottom: Gen = (R, n) => retry(() => {
  const P = dividend(R, 3, 3, 0.25), c = nz(R, -4, 4), sd = synth(P, q(c)), dv = divide(P, xMinus(c));
  const j = int(R, 1, 3), val = sd.bot[j]!;
  if (sd.bot.some(v => Math.abs(qv(v)) > 99)) throw new Reroll();
  const qName = (pw: number) => (pw === 0 ? 'the constant term of the quotient' : `the coefficient of ${xp(pw)} in the quotient`);
  const opts: Opt[] = [0, 1, 2].map(pw => ({ t: `It is ${qName(pw)}`, ok: j < 3 && pw === 2 - j, mc: j === 3 ? MC.remAsCoef : MC.qDegree, say: '', key: `v${qH(sd.bot[2 - pw]!)}` }));
  opts.push({ t: 'It is the remainder', ok: j === 3, mc: MC.remAsCoef, say: '', key: `v${qH(sd.R)}` });
  opts.push({ t: `It is ${j === 3 ? 'the constant term' : `the coefficient of ${xp(3 - j)}`} of the dividend`, mc: MC.unrelated, say: '', key: `v${qH(P[j]!)}` });
  const right = opts.find(o => o.ok)!;
  const say = `Entry ${j + 1} of the bottom row (${qH(val)}) is ${j === 3 ? 'the remainder, the last residual of the long division' : `${qName(2 - j)}, the term above the bracket in its column`}.`;
  opts.forEach(o => { o.say = o.ok ? `Right. ${say}` : say; if (o.ok) o.mc = undefined; });
  return keyed(R, { id: `linkBottom-${n}`, family: 'linkBottom', prompt: `${pH(P)} is divided by ${pH(xMinus(c))} both ways. Bottom row: ${rowH(sd.bot)}. Which long-division number is entry ${j + 1} (${qH(val)})?`,
    board: divT(P, xMinus(c)), picture: { link: { P, c: q(c) } },
    solution: [`Long division gives quotient ${pH(dv.Q)} and remainder ${qH(dv.R[0]!)}.`, `The bottom row lists those numbers in order: ${rowH(sd.bot)}. ${say}`] }, [right, ...opts.filter(o => !o.ok)], { min: 3, keep: false });
});
export const linkWhyAdd: Gen = (R, n) => retry(() => {
  const P = dividend(R, 3, 3, 0.2), c = nz(R, -5, 5), sd = synth(P, q(c));
  const j = 3, t = qv(sd.bot[j - 1]!);            // the constant quotient term: every term of the product has the power it is written with
  if (t === 0) throw new Reroll();
  const pw = 3 - j, prodConst = -c * t;              // the quotient term t·x^pw; t·x^pw·(x − c) has lower term −c·t·x^pw
  const lower = pw;
  const term = (v: number) => pH(co([v, ...Array.from({ length: lower }, () => 0)]));
  const opts: Opt[] = [
    { t: `Long division subtracts ${term(prodConst)}, and subtracting ${term(prodConst)} is the same as adding ${term(-prodConst)}`, ok: true, say: `Right: the divisor's −<i>c</i> makes the product's lower term ${term(prodConst)}; taking it away adds ${nH(c * t)}.` },
    { t: 'Synthetic division is a separate method that happens to give the same numbers', mc: MC.unrelated, say: `It is the same work: every bottom entry is a long-division coefficient, and the middle row is the product row with its sign flipped.` },
    { t: 'The last entry defines the value of the polynomial, so the tableau must add', mc: MC.trick, say: 'The tableau is a shortcut for long division by x − c, not a definition: it adds because subtracting −c·t adds c·t.' },
    { t: 'It makes no difference: subtracting would give the same bottom row', mc: MC.subtracts, say: `Subtracting would give ${nH(qv(P[j]!) - c * t)} instead of ${nH(qv(sd.bot[j]!))}.` },
  ];
  return keyed(R, { id: `linkWhyAdd-${n}`, family: 'linkWhyAdd', prompt: `Dividing ${pH(P)} by ${pH(xMinus(c))}: the quotient term ${pH(co([t, ...Array.from({ length: pw }, () => 0)]))} times ${pH(xMinus(c))} is ${pH(co([t, prodConst, ...Array.from({ length: lower }, () => 0)]))}. The tableau ADDS ${nH(c)} · ${nP(t)} = ${nH(c * t)} where long division subtracts. Why?`,
    board: divT(P, xMinus(c)), picture: { link: { P, c: q(c) } },
    solution: [`Long division subtracts the product's lower term, ${term(prodConst)}.`, `Subtracting ${term(prodConst)} adds ${term(-prodConst)}; its coefficient ${nH(-prodConst)} = <i>c</i> · ${t < 0 ? `(${nH(t)})` : t} is the tableau's middle entry.`] }, opts, { min: 3 });
});

// ===================== inspection-rewrite =====================
export const inspectLinear: Gen = (R, n) => retry(() => {
  const a = int(R, 1, 5), c = nz(R, -6, 6), r = nz(R, -9, 9), b = a * c + r;
  if (Math.abs(b) > 30) throw new Reroll();
  const D = co([1, c]), P = co([a, b]);
  return pairItem({ id: `inspectLinear-${n}`, family: 'inspectLinear', prompt: `Rewrite (${pH(P)})/(${pH(D)}) by inspection as ☐ + ☐/(${pH(D)}), for ${X} ≠ ${nH(-c)}.`,
    board: `\\frac{${pT(P)}}{${pT(D)}} = \\square + \\frac{\\square}{${pT(D)}}`,
    solution: [`Build a multiple of ${pH(D)} inside the top: ${a}(${pH(D)}) = ${pH(co([a, a * c]))}.`, `${pH(P)} = ${a}(${pH(D)}) ${r < 0 ? MINUS : '+'} ${Math.abs(r)}, so the quotient is ${ans(a)} and the remainder ${ans(nH(r))}.`] },
    a, r, { lead: `(${pH(P)})/(${pH(D)}) =`, op: '+', tail: `/(${pH(D)})` }, `Right: ${pH(P)} = ${a}(${pH(D)}) ${r < 0 ? MINUS : '+'} ${Math.abs(r)}.`,
    [{ x: a, y: b, mc: MC.uncompensated, say: `${a}(${pH(D)}) already uses ${nH(a * c)} of the ${nH(b)}: only ${nH(r)} is left over.` },
      { x: a, y: b + a * c, say: `Take ${nH(a * c)} away from ${nH(b)}, do not add it: ${pH(P)} − ${a}(${pH(D)}).` }],
    `Write ${pH(P)} as ${a}(${pH(D)}) plus whatever is left over.`);
});
export const inspectSquare: Gen = (R, n) => retry(() => {
  const a = nz(R, -6, 6), k = nz(R, -9, 9);
  if (k === -a * a) throw new Reroll();
  const D = xMinus(a), P = co([1, 0, k]), r = a * a + k;
  return pairItem({ id: `inspectSquare-${n}`, family: 'inspectSquare', prompt: `Rewrite (${pH(P)})/(${pH(D)}) by inspection as ${X} + ☐ + ☐/(${pH(D)}), for ${X} ≠ ${nH(a)}. Hint: ${xp(2)} − ${a * a} = ${prodH(D, xMinus(-a))}.`,
    board: `\\frac{${pT(P)}}{${pT(D)}} = x + \\square + \\frac{\\square}{${pT(D)}}`,
    solution: [`${pH(P)} = (${xp(2)} − ${a * a}) + ${a * a} ${k < 0 ? MINUS : '+'} ${Math.abs(k)} = ${prodH(D, xMinus(-a))} ${r < 0 ? MINUS : '+'} ${Math.abs(r)}.`, `Quotient ${pH(xMinus(-a))}, remainder ${nH(r)}: the boxes hold ${ans(nH(a))} and ${ans(nH(r))}.`] },
    a, r, { lead: `${X} +`, op: '+', tail: `/(${pH(D)})` }, `Right: ${pH(P)} = ${prodH(D, xMinus(-a))} ${r < 0 ? MINUS : '+'} ${Math.abs(r)}.`,
    [{ x: a, y: k, mc: MC.uncompensated, say: `Taking ${a * a} out to make ${xp(2)} − ${a * a} must be paid back: the remainder is ${nH(k)} + ${a * a}.` },
      { x: -a, y: r, mc: MC.zeroSign, say: `${prodH(D, xMinus(-a))}: the second factor is ${pH(xMinus(-a))}.` }],
    `Make ${xp(2)} − ${a * a}, which is ${prodH(D, xMinus(-a))}, and keep track of what you added or took away.`);
});

// ===================== method-select =====================
export const methodPick: Gen = (R, n) => retry(() => {
  const kind = pickOf(R, ['xc', 'xc', 'half', 'nonmonic', 'quad'] as const);
  const P = dividend(R, 3, 4, 0.2);
  let D: Co, cTxt = '';
  if (kind === 'xc') { const c = nz(R, -7, 7); D = xMinus(c); cTxt = nH(c); }
  else if (kind === 'half') { const s = pickOf(R, [1, -1]); D = co([1, { p: s, q: 2 }]); cTxt = qH({ p: -s, q: 2 }); }
  else if (kind === 'nonmonic') D = co([pickOf(R, [2, 3]), pickOf(R, [-1, 1, -5, 5])]);
  else D = co([1, 0, pickOf(R, [1, -3, 2, -5])]);
  const ok = kind === 'xc' || kind === 'half';
  const z = degOf(D) === 1 ? { p: -D[1]!.p * D[0]!.q, q: D[1]!.q * D[0]!.p } as Q : null;
  const zH = z ? qH(z.q < 0 ? { p: -z.p, q: -z.q } : z) : qH(qNeg(D[2]!));
  const opts: Opt[] = [
    { t: `Long division, or synthetic division with c = ${ok ? cTxt : zH}`, ok, mc: ok ? undefined : MC.synthAny, say: ok ? `Right: ${pH(D)} has the form ${X} − <i>c</i>, so both work.` : `Ordinary synthetic division needs ${X} − <i>c</i>; ${pH(D)} is not of that form.` },
    { t: 'Long division only: ordinary synthetic division does not fit this divisor', ok: !ok, say: ok ? `${pH(D)} is ${X} − (${cTxt}): synthetic division fits.` : `Right: ${pH(D)} is not ${X} − <i>c</i>, and long division works for every nonzero divisor.` },
    { t: 'Synthetic division only, because it is shorter', mc: MC.shorter, say: 'Long division always works too: a shortcut is a choice, never a requirement.' },
  ];
  if (ok && cTxt !== '0') opts.push({ t: `Long division, or synthetic division with c = ${cTxt.startsWith(MINUS) ? cTxt.slice(1) : MINUS + cTxt}`, mc: MC.zeroSign, say: `${pH(D)} is zero at ${X} = ${cTxt}: that is <i>c</i>.` });
  return keyed(R, { id: `methodPick-${n}`, family: 'methodPick', prompt: `Which method can you use for ${divH(P, D)}?`, board: divT(P, D),
    solution: [`Long division works for every nonzero divisor. Ordinary synthetic division needs ${X} − <i>c</i>.`, ok ? `${pH(D)} = ${X} − (${cTxt}): both methods work.` : `${pH(D)} is not of that form: long division.`] }, opts, { min: 3 });
});
export const methodDo: Gen = (R, n) => retry(() => {
  const kind = pickOf(R, ['xc', 'half', 'nonmonic', 'quad', 'inspect'] as const);
  let D: Co, Qc: Co;
  const r = nz(R, -9, 9);
  if (kind === 'xc') { D = xMinus(nz(R, -6, 6)); Qc = rpoly(R, int(R, 1, 2), -6, 6, nz(R, -3, 3)); }
  else if (kind === 'half') { const s = pickOf(R, [1, -1]); D = co([1, { p: s, q: 2 }]); Qc = co([2, 2 * nz(R, -4, 4)]); if (R() < 0.5) Qc = co([2, 2 * int(R, -3, 3), 2 * nz(R, -3, 3)]); }
  else if (kind === 'nonmonic') { D = co([pickOf(R, [2, 3]), pickOf(R, [-1, 1, -2, 2])]); Qc = rpoly(R, 1, -5, 5, nz(R, -3, 3)); }
  else if (kind === 'quad') { D = co([1, 0, pickOf(R, [1, -2, 3, -5])]); Qc = rpoly(R, int(R, 1, 2), -5, 5, nz(R, -3, 3)); }
  else { D = xMinus(nz(R, -5, 5)); Qc = co([int(R, 2, 5)]); }
  const P = addC(mulC(D, Qc), co([r]));
  if (!P.every(v => v.q === 1) || P.some(v => Math.abs(v.p) > 40)) throw new Reroll();
  const dv = divide(P, D);
  if (degOf(dv.R) !== 0 || qv(dv.R[0]!) !== r) throw new Reroll();
  const how = kind === 'xc' || kind === 'half' ? `synthetic division with c = ${qH({ p: -D[1]!.p, q: D[1]!.q })} (or long division)` : kind === 'inspect' ? `inspection: ${pH(P)} = ${qH(Qc[0]!)}(${pH(D)}) ${r < 0 ? MINUS : '+'} ${Math.abs(r)}` : 'long division';
  return numItem({ id: `methodDo-${n}`, family: 'methodDo', prompt: `Divide ${pH(P)} by ${pH(D)} with any method that fits. What is the remainder?`, board: divT(P, D),
    picture: { ld: { P, D, upto: 'frame' } },
    solution: [`The divisor ${pH(D)} suggests ${how}.`, `Quotient ${pH(dv.Q)}, remainder ${ans(nH(r))}.`] },
    r, `Right: ${pH(P)} = ${prodH(D, dv.Q)} ${r < 0 ? MINUS : '+'} ${Math.abs(r)}.`,
    kind === 'xc' ? [{ v: qv(synth(P, D[1]!).R), mc: MC.zeroSign, say: `${pH(D)} = ${X} − (${qH(qNeg(D[1]!))}): use c = ${qH(qNeg(D[1]!))}.` }] : [],
    'Pick a method that fits the divisor, and multiply back to check.');
});
export { isZero, other };
