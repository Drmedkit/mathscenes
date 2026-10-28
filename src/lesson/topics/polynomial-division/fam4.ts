// fam4.ts: stage 3, checking and justifying: verify a result by expanding D·Q + R (and find where it breaks),
// reject true identities that are not finished divisions, substitution checks (evidence, not proof), why each update
// keeps P = D·Q + S true and why the process ends, the identity at an excluded input versus the restricted quotient,
// and dividing out a known factor to factor completely. Pure: no DOM.
import { int } from '../../runtime/item';
import {
  type Co, prodH, prodT, parT, parH, MINUS, X, addC, brH, brT, co, degOf, divide, eqC, evalC, identH, identT, isZero, keyC, mulC, nH, neqH, pH, pT, q, qH,
  qrH, qv, scaleC, shiftC, subC, synth, trim, xMinus, xp, zeroOf,
} from './pd';
import { type Gen, type Opt, MC, Reroll, ans, keyed, numItem, nz, other, pairItem, pickOf, retry } from './common';
import { linD, rpoly } from './fam1';

const divT = (P: Co, D: Co) => `${parT(P)} \\div ${parT(D)}`;
const divH = (P: Co, D: Co) => `${parH(P)} ÷ ${parH(D)}`;
const QR = (Qc: Co, Rc: Co) => `<i>Q</i> = ${pH(Qc)}, <i>R</i> = ${isZero(Rc) ? '0' : pH(Rc)}`;
/** a division with a linear or quadratic divisor and an honest result */
function honest(R: () => number, quad = 0.3) {
  const D = R() < quad ? co([1, int(R, -2, 2), nz(R, -4, 4)]) : linD(R, 1, 6);
  const Qc = rpoly(R, int(R, 1, 2), -6, 6, nz(R, -3, 3));
  const m = degOf(D)!;
  const Rc = R() < 0.2 ? co([0]) : m === 1 ? co([nz(R, -9, 9)]) : co([nz(R, -5, 5), int(R, -9, 9)]);
  const P = addC(mulC(D, Qc), Rc);
  if (P.some(v => Math.abs(v.p) > 40)) throw new Reroll();
  return { D, Qc, Rc, P };
}

// ===================== verify-expand =====================
export const verifyClaim: Gen = (R, n) => retry(() => {
  const { D, Qc, Rc, P } = honest(R);
  const err = pickOf(R, ['none', 'none', 'sign', 'placeholder'] as const);
  let cQ = Qc, cR = Rc, what = '';
  if (err === 'sign') { const i = int(R, 1, Qc.length - 1); cQ = Qc.map((v, j) => (j === i ? q(-v.p, v.q) : v)); if (eqC(cQ, Qc)) throw new Reroll(); what = 'a sign in the quotient'; }
  if (err === 'placeholder') {
    // the classmate dropped a 0 placeholder: they divided the dividend with its powers closed up
    const tP = trim(P), gapped = tP.slice(1).some(v => v.p === 0);
    if (!gapped) throw new Reroll();
    const d2 = divide(co(tP.filter(v => v.p !== 0)), D); cQ = d2.Q; cR = d2.R; what = 'a missing 0 placeholder';
  }
  const back = addC(mulC(D, cQ), cR), good = eqC(back, P);
  if (err !== 'none' && good) throw new Reroll();
  if (degOf(cR) !== null && degOf(cR)! >= degOf(D)!) throw new Reroll();
  const opts: Opt[] = [
    { t: `Right: ${prodH(D, cQ)}${isZero(cR) ? '' : ' + R'} expands to the dividend`, ok: good, mc: good ? undefined : MC.looksRight, say: good ? 'Right: the expansion matches the dividend term by term.' : `Expand it: you get ${pH(back)}, not ${pH(P)}.` },
    { t: `Wrong: ${prodH(D, cQ)}${isZero(cR) ? '' : ' + R'} does not expand to the dividend`, ok: !good, say: good ? `Expand it: it gives exactly ${pH(P)}.` : `Right: it expands to ${pH(back)}, not ${pH(P)} (${what}).` },
  ];
  if (!isZero(cR)) opts.push({ t: `Wrong: ${prodH(D, cQ)} alone must equal the dividend`, mc: MC.remMisplaced, say: 'The remainder is part of the check: dividend = divisor × quotient + remainder.' });
  return keyed(R, { id: `verifyClaim-${n}`, family: 'verifyClaim', prompt: `A classmate divides ${pH(P)} by ${pH(D)} and gets ${QR(cQ, cR)}. Check by expanding ${prodH(D, cQ)} + <i>R</i>. Is the result right?`,
    board: `${divT(P, D)}:\\ \\ Q = ${pT(cQ)},\\ R = ${pT(cR)}`,
    solution: [`${prodH(D, cQ)} = ${pH(mulC(D, cQ))}${isZero(cR) ? '' : `; adding <i>R</i> gives ${pH(back)}`}.`, good ? `That is the dividend: the result is right.` : `The dividend is ${pH(P)}: they differ, so the result is wrong.`] }, opts, { min: 2, keep: true });
});
export const firstMismatch: Gen = (R, n) => retry(() => {
  const { D, Qc, Rc, P } = honest(R, 0);
  const i = int(R, 0, Qc.length - 1), dlt = nz(R, -3, 3);
  const cQ = Qc.map((v, j) => (j === i ? q(v.p + dlt * v.q, v.q) : v));
  const back = addC(mulC(D, cQ), Rc), N = degOf(P)!;
  const diffs = Array.from({ length: N + 1 }, (_, k) => N - k).filter(pw => qv(evalCoef(back, pw)) !== qv(evalCoef(P, pw)));
  if (!diffs.length) throw new Reroll();
  const top = diffs[0]!;
  const name = (pw: number) => (pw === 0 ? 'the constant term' : `the ${xp(pw)} term`);
  const opts: Opt[] = Array.from({ length: N + 1 }, (_, k) => N - k).map(pw => ({ t: `They first differ at ${name(pw)}`, ok: pw === top, say: pw === top ? `Right: ${pH(back)} against ${pH(P)}: the ${pw === 0 ? 'constants' : `${xp(pw)} coefficients`} are the first to disagree.` : `Compare from the top: ${pH(back)} against ${pH(P)}.`, mc: pw === top ? undefined : MC.looksRight }));
  return keyed(R, { id: `firstMismatch-${n}`, family: 'firstMismatch', prompt: `A classmate divides ${pH(P)} by ${pH(D)} and gets ${QR(cQ, Rc)}. Expand ${prodH(D, cQ)} + <i>R</i>. Going from the highest power down, where does it first differ from the dividend?`,
    board: `${divT(P, D)}:\\ \\ Q = ${pT(cQ)},\\ R = ${pT(Rc)}`,
    solution: [`${prodH(D, cQ)} + <i>R</i> = ${pH(back)}.`, `Against ${pH(P)}: the first coefficient that disagrees is at ${name(top)}.`] }, opts, { min: 3, max: 3, keep: true });
});
const evalCoef = (c: Co, pw: number) => { const t = trim(c); const i = t.length - 1 - pw; return i >= 0 && i < t.length ? t[i]! : q(0); };

// ===================== verify-remainder-bound =====================
export const finishedPick: Gen = (R, n) => retry(() => {
  const { D, Qc, Rc, P } = honest(R, 0.4);
  const dv = divide(P, D);
  const k = (a: Co, b: Co) => `${keyC(a)}|${keyC(b)}`;
  const first = shiftC([dv.cycles[0]!.t], dv.cycles[0]!.pow);
  const opts: Opt[] = [
    { t: QR(Qc, Rc), ok: true, say: `Right: the identity holds AND the remainder's degree is below ${degOf(D)}.`, key: k(Qc, Rc) },
    { t: QR(co([0]), P), mc: MC.stopsEarly, say: `True, but nothing was divided: ${pH(P)} still has degree ${degOf(P)}, not below ${degOf(D)}.`, key: k(co([0]), P) },
    { t: QR(first, dv.cycles[0]!.after), mc: MC.stopsEarly, say: `True, but unfinished: the remainder still has degree ${degOf(dv.cycles[0]!.after)}.`, key: k(first, dv.cycles[0]!.after) },
    { t: QR(subC(Qc, co([1])), addC(Rc, D)), mc: MC.stopsEarly, say: `True, but ${pH(addC(Rc, D))} has the divisor's degree: one more ${pH(D)} still fits.`, key: k(subC(Qc, co([1])), addC(Rc, D)) },
  ];
  return keyed(R, { id: `finishedPick-${n}`, family: 'finishedPick', prompt: `Every pair below makes ${pH(P)} = (${pH(D)})<i>Q</i> + <i>R</i> true. Which one is the finished division by ${pH(D)}?`,
    board: `${pT(P)} = ${brT(D)}\\,Q + R`,
    solution: [`A finished division needs the identity AND <i>R</i> = 0 or deg <i>R</i> < ${degOf(D)}.`, `Only ${QR(Qc, Rc)} passes both.`] }, opts);
});
export const smallDividend: Gen = (R, n) => retry(() => {
  const D = R() < 0.5 ? co([1, int(R, -3, 3), nz(R, -6, 6)]) : co([1, 0, int(R, -3, 3), nz(R, -6, 6)]);
  const P = rpoly(R, int(R, 0, degOf(D)! - 1), -9, 9, nz(R, -9, 9));
  const k = (a: Co, b: Co) => `${keyC(a)}|${keyC(b)}`;
  const opts: Opt[] = [
    { t: QR(co([0]), P), ok: true, say: `Right: ${pH(P)} already has lower degree than ${pH(D)}, so the quotient is 0 and all of it is left over.`, key: k(co([0]), P) },
    { t: QR(P, co([0])), say: `${prodH(D, P)} is far bigger than ${pH(P)}: that is not an identity.`, key: k(P, co([0])) },
    { t: QR(co([1]), subC(P, D)), mc: MC.stopsEarly, say: `True, but ${pH(subC(P, D))} has the divisor's degree: that is not a finished remainder.`, key: k(co([1]), subC(P, D)) },
    { t: 'There is no quotient: the division is impossible', say: 'Every division by a nonzero polynomial has a result. Here the quotient is simply 0.', key: 'none' },
  ];
  return keyed(R, { id: `smallDividend-${n}`, family: 'smallDividend', prompt: `Divide ${pH(P)} by ${pH(D)}. Which result is right?`, board: divT(P, D),
    solution: [`deg ${pH(P)} = ${degOf(P)}, already less than ${degOf(D)}: no term times ${pH(D)} fits.`, `So ${QR(co([0]), P)}.`] }, opts);
});

// ===================== numeric-spot-check =====================
export const spotValue: Gen = (R, n) => retry(() => {
  const { D, Qc, Rc, P } = honest(R, 0.25);
  const wrong = R() < 0.5;
  const cQ = wrong ? Qc.map((v, j) => (j === Qc.length - 1 ? q(v.p + nz(R, -3, 3)) : v)) : Qc;
  const v = pickOf(R, [0, 1, -1, 2]);
  const right = qv(evalC(addC(mulC(D, cQ), Rc), q(v)));
  const lhs = qv(evalC(P, q(v)));
  return numItem({ id: `spotValue-${n}`, family: 'spotValue', prompt: `Check the claim ${identH(P, D, cQ, Rc)} at ${X} = ${nH(v)}. What is the value of the RIGHT side there?`,
    board: identT(P, D, cQ, Rc),
    solution: [`At ${X} = ${nH(v)}: ${pH(D)} is ${qH(evalC(D, q(v)))} and ${pH(cQ)} is ${qH(evalC(cQ, q(v)))}${isZero(Rc) ? '' : `, and the remainder adds ${qH(evalC(Rc, q(v)))}`}.`, `Right side: ${ans(nH(right))} (the left side is ${nH(lhs)}).`] },
    right, `Right: the right side is ${nH(right)}; the left side is ${nH(lhs)}${right === lhs ? ', so the check passes there' : ', so the claim is false'}.`,
    [{ v: lhs, say: 'That is the left side. Work out the right side: the product, plus the remainder.' },
      { v: qv(evalC(mulC(D, cQ), q(v))), mc: MC.remMisplaced, say: 'Add the remainder too: the right side is the product PLUS the remainder.' }],
    `Put ${X} = ${nH(v)} into each factor, multiply, then add the remainder.`);
});
export const spotVerdict: Gen = (R, n) => retry(() => {
  const D = linD(R, 1, 5), Qc = co([1, int(R, -5, 5), int(R, -6, 6)]), Rc = co([nz(R, -9, 9)]), P = addC(mulC(D, Qc), Rc);
  if (P.some(v => Math.abs(v.p) > 40) || qv(evalC(D, q(2))) === 0) throw new Reroll();
  const kind = pickOf(R, ['true', 'caught', 'late'] as const);
  let cQ = Qc;
  if (kind === 'caught') cQ = Qc.map((v, j) => (j === 2 ? q(v.p + nz(R, -3, 3)) : v));
  if (kind === 'late') { const k = nz(R, -2, 2); cQ = addC(Qc, co([k, -k, 0])); }   // + k·x(x − 1): equal at 0 and 1
  const xs = kind === 'late' ? [0, 1, 2] : [0, 1];
  const vals = xs.map(v => ({ v, L: qv(evalC(P, q(v))), Rv: qv(evalC(addC(mulC(D, cQ), Rc), q(v))) }));
  const caught = vals.some(x => x.L !== x.Rv);
  if (kind === 'caught' && !caught) throw new Reroll();
  const passed = vals.find(x => x.L === x.Rv);
  if (kind === 'late' && (!caught || vals[0]!.L !== vals[0]!.Rv || vals[1]!.L !== vals[1]!.Rv)) throw new Reroll();
  const list = vals.map(x => `at ${X} = ${x.v} the left side is ${nH(x.L)} and the right side is ${nH(x.Rv)}`).join('; ');
  const opts: Opt[] = caught
    ? [{ t: 'The claim is false: one input where the sides differ is enough', ok: true, say: 'Right: an identity must hold at every input, so one failure disproves it.' },
      ...(passed ? [{ t: `The claim is true: it passed at x = ${passed.v}`, mc: MC.examples, say: 'Passing at one input proves nothing; failing at one input disproves it.' }] : []),
      { t: 'The checks do not decide anything either way', say: 'One input where the sides differ settles it: the claim is false.' }]
    : [{ t: 'No error found yet, but checks at a few inputs cannot prove the identity', ok: true, say: 'Right: substitution can expose an error, never prove an identity. Expand to be sure.' },
      { t: 'The claim is proved: it passed at both inputs', mc: MC.examples, say: 'Two inputs are two examples. A false claim can pass at a couple of inputs.' },
      { t: 'The claim is false', say: 'Both checks passed: nothing shows it is false yet.' }];
  return keyed(R, { id: `spotVerdict-${n}`, family: 'spotVerdict', prompt: `A classmate claims ${identH(P, D, cQ, Rc)}. Checks: ${list}. What do the checks show?`,
    board: identT(P, D, cQ, Rc),
    solution: [caught ? `The sides differ at ${X} = ${vals.find(x => x.L !== x.Rv)!.v}: an identity cannot fail anywhere.` : 'Both checks pass, but a false claim can pass at a few inputs.', caught ? 'So the claim is false.' : 'Expanding the right side is the real proof.'] }, opts, { min: 2, keep: true });
});

// ===================== update-invariant =====================
export const invariantStep: Gen = (R, n) => retry(() => {
  const D = linD(R, 1, 6), Qf = rpoly(R, 2, -6, 6, nz(R, -3, 3)), r = int(R, -9, 9), P = addC(mulC(D, Qf), co([r]));
  if (P.some(v => Math.abs(v.p) > 40)) throw new Reroll();
  const dv = divide(P, D), cy = dv.cycles[1];
  if (!cy) throw new Reroll();
  const Q0 = shiftC([dv.cycles[0]!.t], dv.cycles[0]!.pow), S = cy.before, t = shiftC([cy.t], cy.pow);
  const Q1 = addC(Q0, t), tD = mulC(t, D);
  const form = (Qx: Co, Sx: string) => `${pH(P)} = ${prodH(D, Qx)} + (${Sx})`;
  const tDh = `${t[0]!.p < 0 ? `(${pH(t)})` : pH(t)}(${pH(D)})`;
  const opts: Opt[] = [
    { t: form(Q1, `${pH(S)} − ${tDh}`), ok: true, say: `Right: the ${tDh} added in the product is taken away from the residual, so the right side is still ${pH(P)}.`, key: keyC(addC(mulC(D, Q1), subC(S, tD))) },
    { t: form(Q1, pH(S)), mc: MC.notCompensated, say: `Adding ${pH(t)} to the quotient adds ${tDh} to the right side: the residual must pay it back.`, key: keyC(addC(mulC(D, Q1), S)) },
    { t: form(Q1, `${pH(S)} + ${tDh}`), mc: MC.addSub, say: `That adds ${tDh} twice. The residual must SUBTRACT it.`, key: keyC(addC(mulC(D, Q1), addC(S, tD))) },
    { t: form(Q0, `${pH(S)} − ${tDh}`), say: `Taking ${tDh} from the residual must be balanced by adding ${pH(t)} to the quotient.`, key: keyC(addC(mulC(D, Q0), subC(S, tD))) },
  ];
  return keyed(R, { id: `invariantStep-${n}`, family: 'invariantStep', prompt: `Midway through ${divH(P, D)}: ${pH(P)} = ${prodH(D, Q0)} + (${pH(S)}) is true, and the next quotient term is ${pH(t)}. Which line is still true after the update?`,
    board: `${pT(P)} = ${prodT(D, Q0)} + ${brT(S)}`, picture: { ld: { P, D, upto: 1, tNext: true } },
    solution: [`${prodH(D, Q1)} = ${prodH(D, Q0)} + ${tDh}: the product grew by ${tDh}.`, `So the residual must shrink by the same amount: ${pH(S)} − ${tDh}.`] }, opts);
});
export const cycleCount: Gen = (R, n) => retry(() => {
  const m = pickOf(R, [1, 1, 2]), N = int(R, m + 1, m + 4);
  const D = m === 1 ? linD(R, 1, 6) : co([1, int(R, -3, 3), nz(R, -5, 5)]);
  const P = rpoly(R, N, -9, 9, nz(R, -3, 4));
  return numItem({ id: `cycleCount-${n}`, family: 'cycleCount', prompt: `Each cycle of long division cancels the residual's leading term, so its degree drops by at least 1. Dividing ${pH(P)} by ${pH(D)}, at most how many cycles can there be before the residual's degree is below ${m}?`,
    board: divT(P, D), picture: { ld: { P, D, upto: 'frame' } },
    solution: [`The residual starts at degree ${N} and the division stops once it is below ${m}.`, `The cycles use degrees ${N} down to ${m}: at most ${N} − ${m} + 1 = ${ans(N - m + 1)} cycles.`] },
    N - m + 1, `Right: at most ${N - m + 1} cycles, one for each quotient power ${xp(N - m)} down to the constant.`,
    [{ v: N, say: `The division stops at degree ${m - 1} or lower, not at 0: count the degrees from ${N} down to ${m}.` }, { v: N - m, say: `Count both ends: degrees ${N} down to ${m} make ${N - m + 1} cycles.` }],
    `Count the degrees the residual can have while a quotient term still fits: ${N} down to ${m}.`);
});

// ===================== domain-identity-contrast =====================
export const domainCheck: Gen = (R, n) => retry(() => {
  const D = linD(R, 1, 6), Qc = rpoly(R, 1, -6, 6, 1), r = R() < 0.4 ? 0 : nz(R, -9, 9), Rc = co([r]), P = addC(mulC(D, Qc), Rc);
  const z = zeroOf(D);
  const opts: Opt[] = [
    { t: `The polynomial identity holds at ${X} = ${qH(z)}, but the quotient form has no value there`, ok: true, say: `Right: at ${X} = ${qH(z)} both sides of the identity are ${qH(evalC(P, z))}, but ${pH(P)} over ${pH(D)} divides by 0.` },
    { t: `Both hold at ${X} = ${qH(z)}`, mc: MC.dropsRestrict, say: `The quotient form divides by ${pH(D)}, which is 0 at ${X} = ${qH(z)}: it has no value there.` },
    { t: `Neither holds at ${X} = ${qH(z)}`, say: `The identity has no division in it: at ${X} = ${qH(z)} both sides are ${qH(evalC(P, z))}.` },
    { t: `Only the quotient form holds at ${X} = ${qH(z)}`, mc: MC.noRestrict, say: 'It is the other way round: the identity is a polynomial equation, true for every x.' },
  ];
  return keyed(R, { id: `domainCheck-${n}`, family: 'domainCheck', prompt: `The identity ${identH(P, D, Qc, Rc)} gives the quotient form (${pH(P)})/(${pH(D)}) = ${qrH(Qc, Rc, D)}. Which is true at ${X} = ${qH(z)}?`,
    board: identT(P, D, Qc, Rc),
    solution: [`The identity only multiplies and adds: at ${X} = ${qH(z)} both sides are ${qH(evalC(P, z))}.`, `The quotient form divides by ${pH(D)} = 0 there: it has no value, so it needs ${neqH(z)}.`] }, opts, { min: 4, keep: true });
});
export const domainFix: Gen = (R, n) => retry(() => {
  const D = linD(R, 1, 7), Qc = rpoly(R, int(R, 1, 2), -6, 6, 1), r = R() < 0.6 ? 0 : nz(R, -9, 9), Rc = co([r]), P = addC(mulC(D, Qc), Rc);
  if (P.some(v => Math.abs(v.p) > 50)) throw new Reroll();
  const z = zeroOf(D), mz = { p: -z.p, q: z.q };
  const opts: Opt[] = [
    { t: `“for ${neqH(z)}”`, ok: true, say: `Right: ${pH(D)} is 0 at ${X} = ${qH(z)}, so the left side has no value there.`, key: `z${qH(z)}` },
    { t: `“for ${neqH(mz)}”`, mc: MC.zeroSign, say: `At ${X} = ${qH(mz)} the divisor is ${qH(evalC(D, mz))}, not 0.`, key: `z${qH(mz)}` },
    { t: 'Nothing: the two sides agree for every x', mc: MC.dropsRestrict, say: `At ${X} = ${qH(z)} the left side divides by 0, while the right side has a value: they are not the same there.`, key: 'none' },
    { t: `“for ${X} ≠ 0”`, say: `At ${X} = 0 the divisor is ${qH(evalC(D, q(0)))}: nothing goes wrong there.`, key: 'z0' },
  ];
  return keyed(R, { id: `domainFix-${n}`, family: 'domainFix', prompt: `Sam writes (${pH(P)})/(${pH(D)}) = ${qrH(Qc, Rc, D)}. What must he add so it is true?`, board: `\\frac{${pT(P)}}{${pT(D)}} = ${r ? `${pT(Qc)} ${r < 0 ? '-' : '+'} \\frac{${Math.abs(r)}}{${pT(D)}}` : pT(Qc)}`,
    solution: [`The left side divides by ${pH(D)}, which is 0 at ${X} = ${qH(z)}.`, `The rewrite holds only for ${neqH(z)}.`] }, opts);
});

// ===================== apply-known-factor =====================
export const factorFull: Gen = (R, n) => retry(() => {
  const a = nz(R, -5, 5), r1 = nz(R, -6, 6), r2 = nz(R, -6, 6);
  const Qq = mulC(xMinus(r1), xMinus(r2)), P = mulC(xMinus(a), Qq);
  if (P.some(v => Math.abs(v.p) > 60)) throw new Reroll();
  return pairItem({ id: `factorFull-${n}`, family: 'factorFull', prompt: `${pH(xMinus(a))} is a factor of ${pH(P)}. Divide it out and factor completely: ${pH(P)} = (${pH(xMinus(a))})(${X} + ☐)(${X} + ☐).`,
    board: `${pT(P)} = ${brT(xMinus(a))}(x + \\square)(x + \\square)`, picture: { sd: { P, c: q(a), upto: 'frame' } },
    solution: [`Divide by ${pH(xMinus(a))} (synthetic, c = ${nH(a)}): the quotient is ${pH(Qq)}, remainder 0.`, `${pH(Qq)} = ${prodH(xMinus(r1), xMinus(r2))}: the boxes are ${ans(nH(-r1))} and ${ans(nH(-r2))}.`] },
    -r1, -r2, { lead: `${pH(P)} = (${pH(xMinus(a))})(${X} +`, op: `)(${X} +`, tail: ')' }, `Right: ${pH(P)} = ${prodH(xMinus(a), xMinus(r1))}(${pH(xMinus(r2))}).`,
    [{ x: r1, y: r2, mc: MC.zeroSign, say: `The signs flipped: the quotient ${pH(Qq)} is ${prodH(xMinus(r1), xMinus(r2))}.` },
      { x: qv(Qq[1]!), y: qv(Qq[2]!), mc: MC.incomplete, say: `${pH(Qq)} is the quotient. Factor it too: two numbers that multiply to ${nH(r1 * r2)} and add to ${nH(-(r1 + r2))}.` }],
    `Divide by ${pH(xMinus(a))} first, then factor the quadratic quotient.`, { free: true });
});
export const boxDims: Gen = (R, n) => retry(() => {
  const h = int(R, 1, 5), p1 = int(R, 1, 6), p2 = other(R, 1, 7, [h]);
  const P = mulC(mulC(co([1, h]), co([1, p1])), co([1, p2]));
  const Qq = mulC(co([1, p1]), co([1, p2]));
  return pairItem({ id: `boxDims-${n}`, family: 'boxDims', prompt: `A box has volume ${pH(P)} cubic inches and height ${pH(co([1, h]))} inches. Its length and width are ${X} + ☐ and ${X} + ☐ inches. Find them.`,
    board: `${pT(P)} = ${brT(co([1, h]))}(x + \\square)(x + \\square)`, picture: { sd: { P, c: q(-h), upto: 'frame' } },
    solution: [`Volume ÷ height: divide by ${pH(co([1, h]))} (synthetic, c = ${nH(-h)}). The quotient is ${pH(Qq)}, remainder 0.`, `${pH(Qq)} = ${prodH(co([1, p1]), co([1, p2]))}: ${ans(p1)} and ${ans(p2)}.`] },
    p1, p2, { lead: `(${X} +`, op: `) in and (${X} +`, tail: ') in' }, `Right: ${prodH(co([1, h]), co([1, p1]))}(${pH(co([1, p2]))}) = ${pH(P)}.`,
    [{ x: qv(Qq[1]!), y: qv(Qq[2]!), mc: MC.incomplete, say: `${pH(Qq)} is the base area. Factor it into two sides.` },
      { x: -p1, y: -p2, mc: MC.zeroSign, say: `Lengths here are ${X} plus a positive number: ${prodH(co([1, p1]), co([1, p2]))}.` }],
    `Divide the volume by the height, then factor the quotient.`, { free: true });
});
export const quotientFirst: Gen = (R, n) => retry(() => {
  const a = nz(R, -5, 5), r1 = nz(R, -6, 6), r2 = other(R, -6, 6, [0, r1]);
  const Qq = mulC(xMinus(r1), xMinus(r2)), P = mulC(xMinus(a), Qq);
  if (P.some(v => Math.abs(v.p) > 60)) throw new Reroll();
  const f3 = (x: number, y: number, z: number) => `${prodH(xMinus(x), xMinus(y))}(${pH(xMinus(z))})`;
  const val = (x: number, y: number, z: number) => keyC(mulC(mulC(xMinus(x), xMinus(y)), xMinus(z)));
  const opts: Opt[] = [
    { t: f3(a, r1, r2), ok: true, say: 'Right: the given factor times the factored quotient.', key: 'complete' },
    { t: `${prodH(xMinus(a), Qq)}`, mc: MC.incomplete, say: `True, but not complete: ${pH(Qq)} factors further.`, key: 'partial' },
    { t: f3(a, -r1, -r2), mc: MC.zeroSign, say: `Check the signs: ${pH(Qq)} = ${prodH(xMinus(r1), xMinus(r2))}.`, key: val(a, -r1, -r2) },
    { t: f3(-a, r1, r2), mc: MC.zeroSign, say: `The given factor is ${pH(xMinus(a))}: keep it as it is.`, key: val(-a, r1, r2) },
  ];
  // a sign-slipped product that happens to equal P is not offered
  const kP = keyC(P);
  return keyed(R, { id: `quotientFirst-${n}`, family: 'quotientFirst', prompt: `${pH(xMinus(a))} is a factor of ${pH(P)}. Which is the complete factorization?`, board: `${pT(P)} \\div ${brT(xMinus(a))}`,
    picture: { sd: { P, c: q(a), upto: 'frame' } },
    solution: [`Divide by ${pH(xMinus(a))}: quotient ${pH(Qq)}, remainder 0.`, `Factor the quotient: ${prodH(xMinus(r1), xMinus(r2))}.`] }, opts.filter(o => o.ok || o.key !== kP));
});
export { MINUS, synth, scaleC };
