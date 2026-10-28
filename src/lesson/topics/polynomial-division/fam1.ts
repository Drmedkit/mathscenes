// fam1.ts: stage 1 families (supplied decompositions, nothing to compute by an algorithm yet): the roles in
// P = D·Q + R (with the whole-number analogy 47 = 6 · 7 + 5), the stopping rule R = 0 or deg R < deg D, the reverse
// area box (the quotient is the missing side), the restriction D(x) ≠ 0, the form Q + R/D, and R = 0 as "D is a
// factor". Pure: no DOM.
import { int } from '../../runtime/item';
import {
  type Co, nP, prodH, MINUS, X, addC, brH, brT, co, degOf, divide, eqC, evalC, identH, identT, isZero, keyC, mulC, nH, neqH, pH, pT,
  parH, q, qH, qrH, subC, trim, xMinus, zeroOf, DEG_NAMES,
} from './pd';
import { type Gen, type Opt, type Slip, MC, Reroll, ans, keyed, near, numItem, nz, other, pairItem, pickOf, retry } from './common';

const D_ = '<i>D</i>', P_ = '<i>P</i>', Q_ = '<i>Q</i>', R_ = '<i>R</i>';
/** a random integer polynomial of degree d (leading coefficient nonzero) */
export function rpoly(R: () => number, d: number, lo = -9, hi = 9, lead?: number): Co {
  return co(Array.from({ length: d + 1 }, (_, i) => (i === 0 ? lead ?? nz(R, 1, 4) * (R() < 0.2 ? -1 : 1) : int(R, lo, hi))));
}
/** a monic linear divisor x − c (c nonzero, |c| ≤ 9) */
export const linD = (R: () => number, lo = 1, hi = 9) => { const c = nz(R, -hi, hi); return Math.abs(c) < lo ? xMinus(lo) : xMinus(c); };
const degWord = (c: Co) => { const d = degOf(c); return d === null ? 'no degree' : `degree ${d}`; };

// ===================== pdqr-roles =====================
type Role = 'dividend' | 'divisor' | 'quotient' | 'remainder';
const ROLES: Role[] = ['dividend', 'divisor', 'quotient', 'remainder'];
export const roleName: Gen = (R, n) => retry(() => {
  const role = pickOf(R, ROLES);
  if (R() < 0.3) {
    // the whole-number warm-up
    const d = int(R, 3, 9), qq = int(R, 4, 12), r = int(R, 1, d - 1), a = d * qq + r;
    const v: Record<Role, number> = { dividend: a, divisor: d, quotient: qq, remainder: r };
    if (new Set(Object.values(v)).size < 4) throw new Reroll();
    const opts: Opt[] = ROLES.map(k => ({ t: String(v[k]), ok: k === role, say: k === role ? `Right: in ${a} = ${d} × ${qq} + ${r} the ${role} is ${v[k]}.` : `${v[k]} is the ${k}. The ${role} is ${v[role]}.`, key: k }));
    return keyed(R, { id: `roleName-${n}`, family: 'roleName', prompt: `This line records ${a} ÷ ${d}: ${a} = ${d} × ${qq} + ${r}. Which number is the <b>${role}</b>?`, board: `${a} = ${d} \\times ${qq} + ${r}`,
      solution: [`Dividend = divisor × quotient + remainder: ${a} is divided, by ${d}, ${qq} times, with ${r} left over.`] }, opts, { min: 4, keep: true });
  }
  const D = linD(R), Qc = rpoly(R, int(R, 1, 2), -6, 6, 1), r = R() < 0.25 ? 0 : nz(R, -9, 9);
  const Rc = co([r]), P = addC(mulC(D, Qc), Rc);
  if (P.some(c => Math.abs(c.p) > 30)) throw new Reroll();
  const v: Record<Role, Co> = { dividend: P, divisor: D, quotient: Qc, remainder: Rc };
  if (new Set(ROLES.map(k => keyC(v[k]))).size < 4) throw new Reroll();
  const opts: Opt[] = ROLES.map(k => ({ t: pH(v[k]), ok: k === role, say: k === role ? `Right: ${pH(v[k])} is the ${role}.` : `${pH(v[k])} is the ${k}: ${k === 'dividend' ? 'the polynomial being divided' : k === 'divisor' ? 'what you divide by' : k === 'quotient' ? 'how many times the divisor fits' : 'what is left over'}.`, key: k }));
  return keyed(R, { id: `roleName-${n}`, family: 'roleName', prompt: `This identity records dividing ${pH(P)} by ${pH(D)}. Which expression is the <b>${role}</b>?`, board: identT(P, D, Qc, Rc),
    solution: [`Read it like ${P_} = ${D_} · ${Q_} + ${R_}: dividend = divisor × quotient + remainder. The divisor is ${pH(D)}, so the other factor is the quotient${r ? `, and ${nH(r)} is left over` : ', and nothing is left over'}.`] }, opts, { min: 4, keep: true });
});
export const rebuildP: Gen = (R, n) => retry(() => {
  const D = linD(R), Qc = rpoly(R, int(R, 1, 2), -6, 6, 1), r = nz(R, -9, 9), Rc = co([r]);
  const P = addC(mulC(D, Qc), Rc);
  const opts: Opt[] = [
    { t: pH(P), ok: true, say: `Right: ${prodH(D, Qc)} = ${pH(mulC(D, Qc))}, then add ${nH(r)}.`, key: keyC(P) },
    { t: pH(mulC(D, Qc)), mc: MC.remMisplaced, say: `That is ${D_} · ${Q_} only: the remainder ${nH(r)} belongs in ${P_} too.`, key: keyC(mulC(D, Qc)) },
    { t: pH(mulC(D, addC(Qc, Rc))), mc: MC.addsRem, say: `That adds the remainder onto the quotient before multiplying. The remainder is added once, after: ${P_} = ${D_} · ${Q_} + ${R_}.`, key: keyC(mulC(D, addC(Qc, Rc))) },
    { t: pH(subC(mulC(D, Qc), Rc)), say: `The remainder is added, not taken away: ${P_} = ${D_} · ${Q_} + ${R_}.`, key: keyC(subC(mulC(D, Qc), Rc)) },
  ];
  return keyed(R, { id: `rebuildP-${n}`, family: 'rebuildP', prompt: `Dividing a polynomial ${P_} by ${pH(D)} gives the quotient ${pH(Qc)} and the remainder ${nH(r)}. Which polynomial is ${P_}?`,
    board: `P \\div ${brT(D)}:\\ \\ Q = ${pT(Qc)},\\ \\ R = ${r}`,
    solution: [`${P_} = ${D_} · ${Q_} + ${R_}, like 47 = 6 × 7 + 5.`, `${prodH(D, Qc)} = ${pH(mulC(D, Qc))}, and adding ${nH(r)} gives ${pH(P)}.`] }, opts);
});

// ===================== remainder-degree-bound =====================
export const stopCheck: Gen = (R, n) => retry(() => {
  const kind = pickOf(R, ['lin', 'lin', 'quad', 'quad', 'const'] as const);
  const D = kind === 'lin' ? linD(R) : kind === 'quad' ? co([1, int(R, -4, 4), nz(R, -6, 6)]) : co([int(R, 2, 9)]);
  const m = degOf(D)!;
  // the residual: finished (deg < m, maybe 0) or not (deg ≥ m)
  const fin = R() < 0.5;
  let S: Co;
  if (fin) S = m === 0 ? co([0]) : R() < 0.15 ? co([0]) : rpoly(R, int(R, 0, m - 1), -9, 9, nz(R, -9, 9));
  else S = rpoly(R, int(R, m, m + 1), -9, 9, nz(R, -9, 9));
  const sz = isZero(S), dS = degOf(S);
  const small = !sz && S.every(c => Math.abs(c.p) < Math.max(...D.map(d => Math.abs(d.p))) && c.q === 1);
  const why = sz ? `The residual is 0: ${pH(D)} fits exactly.` : dS! < m ? `deg ${pH(S)} = ${dS} is less than deg ${D_} = ${m}: no term times ${D_} can cancel its leading term any more.` : `deg ${pH(S)} = ${dS} is at least deg ${D_} = ${m}: dividing its leading term by ${D_}'s leading term gives one more quotient term.`;
  const opts: Opt[] = [
    { t: 'Finished: this residual is the remainder', ok: fin, say: fin ? `Right. ${why}` : `Not yet. ${why}`, mc: fin ? undefined : small ? MC.intRem : MC.stopsEarly },
    { t: 'Not finished: another quotient term fits', ok: !fin, say: !fin ? `Right. ${why}` : `No more terms fit. ${why}` },
  ];
  if (fin && !sz) opts.push({ t: 'Not finished: a division only ends at remainder 0', mc: MC.needZero, say: `A polynomial division ends when the remainder is 0 OR has lower degree than the divisor. ${why}` });
  if (fin && m === 2 && dS === 1) opts.push({ t: 'Not finished: keep going until the remainder is a constant', mc: MC.pastStop, say: `A linear remainder is fine for a quadratic divisor: ${X} cannot be divided by ${X}<sup>2</sup> to give a polynomial term.` });
  return keyed(R, { id: `stopCheck-${n}`, family: 'stopCheck', prompt: `Long division by ${D_} = ${pH(D)} has reached the residual ${pH(S)}. Is the division finished?`,
    board: `D = ${pT(D)},\\quad \\text{residual} = ${pT(S)}`,
    solution: [`Stop when the residual is 0 or its degree is less than the divisor's degree (${m}).`, why] }, opts, { min: 2, keep: true });
});
export const remCandidates: Gen = (R, n) => retry(() => {
  const kind = pickOf(R, ['lin', 'lin', 'quad', 'quad', 'const'] as const);
  const D = kind === 'lin' ? linD(R) : kind === 'quad' ? co([1, int(R, -4, 4), nz(R, -6, 6)]) : co([int(R, 2, 9)]);
  const m = degOf(D)!;
  const right: Co = m === 0 ? co([0]) : rpoly(R, int(R, 0, m - 1), -9, 9, nz(R, -9, 9));
  const wr = [m, m + 1, m + 2].map(d => rpoly(R, d, -9, 9, nz(R, -6, 6)));
  const opts: Opt[] = [
    { t: pH(right), ok: true, say: m === 0 ? `Right: a nonzero constant divides every polynomial exactly, so the remainder is 0.` : `Right: degree ${degOf(right)} is less than ${m}, the degree of ${pH(D)}.` },
    ...wr.map((w, i) => ({ t: pH(w), mc: i === 0 ? MC.stopsEarly : undefined, say: `${pH(w)} has degree ${degOf(w)}, not less than ${m}: another quotient term would still fit.` })),
  ];
  return keyed(R, { id: `remCandidates-${n}`, family: 'remCandidates', prompt: `You divide a polynomial by ${pH(D)} and finish the division. Which of these could be the remainder?`,
    board: `\\text{divisor } ${pT(D)}\\ \\ (\\text{degree } ${m})`,
    solution: [m === 0 ? 'Dividing by a nonzero constant never leaves anything over: the remainder is 0.' : `A finished remainder is 0 or has degree less than ${m}.`, `Only ${pH(right)} qualifies (${degWord(right)}).`] }, opts, { min: 3 });
});

// ===================== reverse-area-model =====================
/** TeX of a monomial k·x^p */
const monoT = (k: number, p: number) => pT(co([k, ...Array.from({ length: p }, () => 0)]));
export const areaSide: Gen = (R, n) => retry(() => {
  const a = int(R, 1, 9), b = other(R, -9, 9, [0, a]);
  const D = co([1, a]), Qc = co([1, b]), P = mulC(D, Qc);
  const cells = [[monoT(1, 2), monoT(b, 1)], [monoT(a, 1), monoT(a * b, 0)]];
  return numItem({ id: `areaSide-${n}`, family: 'areaSide', prompt: `A rectangle has area ${pH(P)} and one side ${pH(D)}. The cells show the area of each part. The other side is ${X} + <i>k</i>. What is <i>k</i>?`,
      board: `${pT(P)} = ${brT(D)}(x + k)`,
      picture: { box: { left: ['x', String(a)], cells, cols: 2 }, reveal: { top: ['x', String(b)] } },
      solution: [`The top row is ${X} times the other side: ${X}<sup>2</sup> and ${pH(co([b, 0]))}, so the other side is ${X} and ${nH(b)}.`, `Check the bottom row: ${a} · ${nP(b)} = ${nH(a * b)}. So <i>k</i> = ${ans(nH(b))}.`] },
    b, `Right: ${prodH(D, Qc)} = ${pH(P)}.`,
    [{ v: a + b, say: `${nH(a + b)} is the coefficient of ${X} in the whole area: it mixes both sides. Read the top side from the top row of cells.` }, { v: a * b, say: `${nH(a * b)} is the bottom-right cell, ${a} times the side you want.` }],
    `Each cell in the top row is ${X} times a term of the other side.`);
});
export const areaSide3: Gen = (R, n) => retry(() => {
  const a = int(R, 1, 6), b = nz(R, -7, 7), c = nz(R, -9, 9);
  const D = co([1, a]), Qc = co([1, b, c]), P = mulC(D, Qc);
  if (P.some(v => Math.abs(v.p) > 60) || P.some(v => v.p === 0)) throw new Reroll();
  const cells = [[monoT(1, 3), monoT(b, 2), monoT(c, 1)], [monoT(a, 2), monoT(a * b, 1), monoT(a * c, 0)]];
  const pic = { box: { left: ['x', String(a)], cells, cols: 3 }, reveal: { top: ['x^{2}', monoT(b, 1), String(c)] } };
  return pairItem({ id: `areaSide3-${n}`, family: 'areaSide3', prompt: `A box diagram has area ${pH(P)} and side ${pH(D)} down the left. The cells show each partial product. Find the other side.`,
      board: `${pT(P)} = ${brT(D)} \\cdot \\,?`, picture: pic,
      solution: [`The top row is ${X} times each term of the other side: ${X}<sup>3</sup>, ${pH(co([b, 0, 0]))}, ${pH(co([c, 0]))} come from ${X}<sup>2</sup>, ${pH(co([b, 0]))}, ${nH(c)}.`, `So the other side is ${pH(Qc)} (the bottom row checks: times ${a}): the boxes hold ${ans(nH(b))} and ${ans(nH(c))}.`] },
      b, c, { lead: `${X}<sup>2</sup> +`, op: `${X} +` }, `Right: ${prodH(D, Qc)} = ${pH(P)}.`,
      [{ x: a + b, y: a * c, say: 'Those are coefficients of the whole area. Read the other side from the top row of cells only.' }],
      `Divide each top-row cell by ${X}.`);
});

// ===================== rational-form-restriction =====================
export const excluded: Gen = (R, n) => retry(() => {
  const P = rpoly(R, int(R, 1, 3), -9, 9);
  const form = pickOf(R, ['xm', 'xm', 'nonmonic'] as const);
  const D = form === 'xm' ? linD(R) : co([2, pickOf(R, [-1, 1, -3, 3, -5, 5])]);
  const z = zeroOf(D), zv = z.p / z.q;
  const slips: Slip[] = [{ v: -zv, mc: MC.zeroSign, say: `At ${X} = ${qH({ p: -z.p, q: z.q })} the divisor is ${qH(evalC(D, { p: -z.p, q: z.q }))}, not 0. Solve ${pH(D)} = 0.` }];
  if (form === 'nonmonic') slips.push({ v: -D[1]!.p, say: `Solve ${pH(D)} = 0 all the way: divide by 2 too.` });
  return numItem({ id: `excluded-${n}`, family: 'excluded', prompt: `The expression (${pH(P)})/(${pH(D)}) has no value at one input. Which value of ${X}?`,
    board: `\\frac{${pT(P)}}{${pT(D)}}`,
    solution: [`A quotient has no value where its divisor is 0 (you cannot divide by 0).`, `${pH(D)} = 0 at ${X} = ${ans(qH(z))}.`] },
    zv, `Right: at ${X} = ${qH(z)} the divisor is 0.`, slips, `Find where the divisor ${pH(D)} equals 0.`);
});
export const restrictionPick: Gen = (R, n) => retry(() => {
  const P = rpoly(R, int(R, 1, 3), -9, 9);
  const konst = R() < 0.3;
  const D = konst ? co([int(R, 2, 9)]) : R() < 0.75 ? linD(R) : co([2, pickOf(R, [-1, 1, -3, 3])]);
  const ex = (v: string) => `It has a value for every ${X} except ${X} = ${v}`;
  let opts: Opt[];
  if (konst) {
    const k = D[0]!.p;
    opts = [
      { t: `It has a value for every ${X}`, ok: true, say: `Right: dividing by the number ${k} is always allowed.`, key: 'all' },
      { t: ex(String(k)), say: `At ${X} = ${k} the divisor is still ${k}, not 0. The divisor never changes.`, key: 'k' },
      { t: ex('0'), say: `The divisor is the constant ${k}: it is never 0, whatever ${X} is.`, key: '0' },
      { t: ex(nH(-k)), mc: MC.zeroSign, say: `The divisor is the constant ${k}: no input makes it 0.`, key: '-k' },
    ];
  } else {
    const z = zeroOf(D);
    opts = [
      { t: ex(qH(z)), ok: true, say: `Right: ${pH(D)} = 0 at ${X} = ${qH(z)}, and dividing by 0 has no value.`, key: `ex${qH(z)}` },
      { t: `It has a value for every ${X}, because ${pH(D)} is not the zero polynomial`, mc: MC.noRestrict, say: `Not the zero polynomial means it is not 0 for EVERY ${X}. At ${X} = ${qH(z)} its value is still 0.`, key: 'all' },
      { t: ex(qH({ p: -z.p, q: z.q })), mc: MC.zeroSign, say: `At ${X} = ${qH({ p: -z.p, q: z.q })} the divisor is not 0. Solve ${pH(D)} = 0.`, key: `ex${qH({ p: -z.p, q: z.q })}` },
      { t: ex('0'), say: `At ${X} = 0 the divisor is ${nH(D[1]!.p)}, not 0.`, key: 'ex0' },
    ];
  }
  return keyed(R, { id: `restrictionPick-${n}`, family: 'restrictionPick', prompt: `Which statement about (${pH(P)})/${parH(D)} is true?`, board: `\\frac{${pT(P)}}{${pT(D)}}`,
    solution: [konst ? `The divisor is the number ${D[0]!.p}: never 0.` : `The expression has no value where its divisor is 0: ${pH(D)} = 0 at ${X} = ${qH(zeroOf(D))}.`] }, opts, { min: 3 });
});

// ===================== q-plus-r-over-d =====================
/** a linear (or quadratic, for linear remainders) divisor, a quotient, a remainder (0, constant or linear) */
function supplied(R: () => number) {
  const kind = pickOf(R, ['zero', 'const', 'const', 'lin'] as const);
  const D = kind === 'lin' ? co([1, int(R, -3, 3), int(R, 1, 6)]) : linD(R);
  const Qc = rpoly(R, int(R, 1, 2), -6, 6, 1);
  const Rc = kind === 'zero' ? co([0]) : kind === 'const' ? co([nz(R, -9, 9)]) : co([nz(R, -5, 5), nz(R, -9, 9)]);
  const P = addC(mulC(D, Qc), Rc);
  if (P.some(c => Math.abs(c.p) > 40)) throw new Reroll();
  return { D, Qc, Rc, P, kind };
}
/** " + R/(D)" with the sign moved out; '' for R = 0 */
function fracTail(Rc: Co, D: Co): string { if (isZero(Rc)) return ''; const t = trim(Rc), neg = t[0]!.p < 0; return ` ${neg ? MINUS : '+'} ${parH(neg ? t.map(c => ({ p: -c.p, q: c.q })) : t)}/(${pH(D)})`; }
const restrH = (D: Co) => (degOf(D) === 1 ? `for ${neqH(zeroOf(D))}` : `where ${pH(D)} ≠ 0`);
export const rewriteQR: Gen = (R, n) => retry(() => {
  const { D, Qc, Rc, P } = supplied(R);
  const rz = isZero(Rc), lin = degOf(D) === 1;
  const k = (a: Co, b: Co, tag: string) => `${keyC(a)}|${keyC(b)}|${tag}`;
  const opts: Opt[] = [
    { t: `${qrH(Qc, Rc, D)}, ${restrH(D)}`, ok: true, say: `Right: divide both sides of the identity by ${pH(D)}, which is allowed only where it is not 0.`, key: k(Qc, Rc, 'r') },
    { t: `${pH(addC(Qc, Rc))}, ${restrH(D)}`, mc: MC.addsRem, say: `The remainder is still divided by ${pH(D)}: it becomes ${rz ? '0' : `${pH(Rc)}/(${pH(D)})`}, not a term of the quotient.`, key: rz ? k(Qc, Rc, 'r') : k(addC(Qc, Rc), [q(0)], 'r') },
    { t: `${parH(Qc)}/(${pH(D)})${fracTail(Rc, D)}, ${restrH(D)}`, mc: MC.divAgain, say: `The quotient is already "how many ${pH(D)}s": do not divide it by ${pH(D)} again.`, key: 'qd' },
  ];
  if (lin) opts.push({ t: `${qrH(Qc, Rc, D)}, for every ${X}`, mc: rz ? MC.dropsRestrict : MC.noRestrict, say: `At ${X} = ${qH(zeroOf(D))} the left side divides by 0, so the equality cannot hold there. Keep ${neqH(zeroOf(D))}.`, key: 'all' });
  if (!rz) opts.push({ t: `${pH(Qc)} R ${pH(Rc)}, ${restrH(D)}`, mc: MC.wholeQuot, say: `"R" notation is for whole numbers. As an expression, the remainder is divided by ${pH(D)} too: ${qrH(Qc, Rc, D)}.`, key: 'rnot' });
  return keyed(R, { id: `rewriteQR-${n}`, family: 'rewriteQR', prompt: `Use this identity to write (${pH(P)})/(${pH(D)}) as <i>Q</i> + <i>R</i>/<i>D</i>. Which is right?`, board: identT(P, D, Qc, Rc),
    solution: [`Divide both sides by ${pH(D)}: ${P_}/${D_} = ${Q_} + ${R_}/${D_}, like 47/6 = 7 + 5/6.`, `It only holds where ${pH(D)} is not 0.`] }, opts, { min: 3 });
});
export const qrFill: Gen = (R, n) => retry(() => {
  if (R() < 0.3) {
    const d = int(R, 3, 9), qq = int(R, 3, 12), r = int(R, 1, d - 1), a = d * qq + r;
    return pairItem({ id: `qrFill-${n}`, family: 'qrFill', prompt: `${a} = ${d} × ${qq} + ${r}. Write ${a}/${d} as a whole number plus a fraction.`, board: `\\frac{${a}}{${d}} = \\square + \\frac{\\square}{${d}}`,
      solution: [`Divide ${a} = ${d} × ${qq} + ${r} by ${d}: ${qq} + ${r}/${d}.`, `So ${ans(qq)} and ${ans(r)}.`] },
      qq, r, { lead: `${a}/${d} =`, op: '+', tail: `/${d}` }, `Right: ${a}/${d} = ${qq} + ${r}/${d}.`,
      [{ x: qq + r, y: 0, mc: MC.addsRem, say: `The ${r} left over is still divided by ${d}: it is ${r}/${d}, not ${r} more wholes.` }], `Divide each part of ${a} = ${d} × ${qq} + ${r} by ${d}.`);
  }
  const D = linD(R), b = nz(R, -8, 8), r = nz(R, -9, 9);
  const Qc = co([1, b]), Rc = co([r]), P = addC(mulC(D, Qc), Rc), z = zeroOf(D);
  return pairItem({ id: `qrFill-${n}`, family: 'qrFill', prompt: `${identH(P, D, Qc, Rc)}. Fill in (${pH(P)})/(${pH(D)}) = ${X} + ☐ + ☐/(${pH(D)}), for ${neqH(z)}.`,
    board: `\\frac{${pT(P)}}{${pT(D)}} = x + \\square + \\frac{\\square}{${pT(D)}}`,
    solution: [`Divide both sides of the identity by ${pH(D)} (where it is not 0).`, `${qrH(Qc, Rc, D)}: the boxes hold ${ans(nH(b))} and ${ans(nH(r))}.`] },
    b, r, { lead: `${X} +`, op: '+', tail: `/(${pH(D)})` }, `Right: ${qrH(Qc, Rc, D)}, for ${neqH(z)}.`,
    [{ x: b + r, y: 0, mc: MC.addsRem, say: `The remainder ${nH(r)} is still divided by ${pH(D)}; it is not added to the quotient.` }], 'The quotient goes in the first box, the remainder over the divisor in the second.');
});

// ===================== zero-remainder-factor =====================
export const isFactor: Gen = (R, n) => retry(() => {
  const D = linD(R, 1, 6), Qc = rpoly(R, int(R, 1, 2), -5, 5, 1);
  const r = R() < 0.45 ? 0 : nz(R, -9, 9), Rc = co([r]), P = addC(mulC(D, Qc), Rc);
  if (P.some(c => Math.abs(c.p) > 40)) throw new Reroll();
  const opts: Opt[] = r === 0
    ? [{ t: `Yes: the remainder is 0, so ${pH(P)} = ${prodH(D, Qc)}`, ok: true, say: `Right: no remainder means ${pH(D)} times a polynomial makes ${P_} exactly.` },
      { t: 'No: a factor must leave a nonzero quotient and remainder', say: 'A factor leaves remainder 0: that is exactly what "factor" means.' },
      { t: `No: ${pH(D)} does not divide every coefficient of ${P_}`, say: 'A factor of a polynomial is about the product, not the single coefficients: the remainder is 0, so it is a factor.' }]
    : [{ t: `No: the remainder is ${nH(r)}, not 0`, ok: true, say: `Right: ${P_} is ${nH(r)} away from a multiple of ${pH(D)}.` },
      { t: `Yes: the first step of the division came out even`, mc: MC.firstEven, say: `The first step always cancels the leading term. Only the final remainder decides, and it is ${nH(r)}.` },
      { t: `Yes: ${pH(D)} times ${pH(Qc)} is part of ${P_}`, say: `Part is not enough: a factor needs ${P_} = ${D_} · ${Q_} with nothing left over.` }];
  return keyed(R, { id: `isFactor-${n}`, family: 'isFactor', prompt: `Long division of ${pH(P)} by ${pH(D)} gives the identity on the board. Is ${pH(D)} a factor of ${pH(P)}?`, board: identT(P, D, Qc, Rc),
    picture: { ld: { P, D, upto: divide(P, D).cycles.length } },
    solution: [`${D_} is a factor of ${P_} exactly when ${P_} = ${D_} · ${Q_} with remainder 0.`, `Here the remainder is ${nH(r)}.`] }, opts, { min: 3 });
});
export const factorPick: Gen = (R, n) => retry(() => {
  const r1 = nz(R, -9, 9), r2 = other(R, -9, 9, [0, r1, -r1]);
  const P = mulC(xMinus(r1), xMinus(r2));
  if (Math.abs(r1 * r2) > 40) throw new Reroll();
  const remOf = (c: number) => evalC(P, q(c));
  const cand = (c: number, mc?: string, say?: string, ok = false): Opt => {
    const rz = remOf(c).p === 0;
    return { t: pH(xMinus(c)), ok, mc, say: say ?? '', key: rz ? 'factor' : `c${c}` };
  };
  const opts: Opt[] = [
    cand(r1, undefined, `Right: ${pH(P)} = ${prodH(xMinus(r1), xMinus(r2))}, so dividing by ${pH(xMinus(r1))} leaves 0.`, true),
    cand(-r1, MC.zeroSign, `The sign is flipped: ${pH(P)} = ${prodH(xMinus(r1), xMinus(r2))}.`),
    cand(r1 * r2, undefined, `Dividing by ${pH(xMinus(r1 * r2))} leaves a nonzero remainder: the constant of a factor is not the constant of ${P_}.`),
    cand(r1 + r2, undefined, `Factors come from two numbers that multiply to ${nH(r1 * r2)} and add to ${nH(-(r1 + r2))}.`),
  ].map(o => (o.ok ? o : { ...o, say: o.say || `Dividing by ${o.t} leaves a nonzero remainder.` }));
  // only the right factor is offered: the other true factor is never a choice
  return keyed(R, { id: `factorPick-${n}`, family: 'factorPick', prompt: `Dividing ${pH(P)} by which of these leaves remainder 0?`, board: `${pT(P)} \\div \\,?`,
    solution: [`Remainder 0 means a factor. Factor: ${pH(P)} = ${prodH(xMinus(r1), xMinus(r2))}.`] }, opts, { min: 3 });
});
export { degWord, MINUS, eqC, near, brH, DEG_NAMES, trim };
