// fam3.ts: practice families for stage 3 of "Complex numbers": audit a worked product (first invalid step, the rule
// it breaks, finishing correct but unfinished work), the conjugate identity z·z̄ = a² + b² ≥ 0, checking a quotient by
// multiplying back, and why the conjugate method is allowed.
import { int } from '../../runtime/item';
import { type Gen, type Opt, frx, MC, ans, choiceItem, cxPair, endZ, numItem, numCheck, nz, pickOf, retry, Reroll } from './common';
import { C, CQ, type Cx, II, MINUS, conj, eq, html, mul, nH, normSq, q, qH, qVal, sumT, tex, monoT, qDiv, typable } from './cx';

type Err = 'cross' | 'sign' | 'collect' | 'i2' | 'none';
interface Work { lines: string[]; bad: number; rule: string; err: Err; z: Cx; w: Cx; p: Cx }
const sg = (v: number) => (v < 0 ? `- ${Math.abs(v)}` : `+ ${v}`);
/** a worked product (a + bi)(c + di) in three lines, with one invalid step (or none: unfinished work stops early) */
function work(R: () => number, err: Err): Work {
  const a = nz(R, -6, 6), b = nz(R, -6, 6), c = nz(R, -6, 6), d = nz(R, -6, 6);
  const z = C(a, b), w = C(c, d), p = mul(z, w);
  let t1: [number, number][] = [[a * c, 0], [a * d, 1], [b * c, 1], [b * d, 2]];
  if (err === 'cross') t1 = [[a * c, 0], [b * d, 2]];
  if (err === 'sign') t1 = [[a * c, 0], [-a * d, 1], [b * c, 1], [b * d, 2]];
  const im1 = t1.filter(t => t[1] === 1).reduce((s, t) => s + t[0], 0);
  let im2 = im1;
  if (err === 'collect') { im2 = t1[1]![0] - t1[2]![0]; if (im2 === im1) throw new Reroll(); }
  const i2 = b * d;
  const re3 = err === 'i2' ? a * c + i2 : a * c - i2;
  if ((err === 'sign' || err === 'cross') && im1 === a * d + b * c) throw new Reroll();
  const L0 = `(${tex(z)})(${tex(w)})`;
  const l1 = `= ${sumT(t1)}`;
  const l2 = `= ${sumT([[a * c, 0], ...(im2 !== 0 ? [[im2, 1] as [number, number]] : []), [i2, 2]])}`;
  const l3 = `= ${tex(C(re3, im2))}`;
  const lines = err === 'none' ? [L0, l1, ...(R() < 0.5 ? [l2] : [])] : [L0, l1, l2, l3];
  const bad = err === 'cross' || err === 'sign' ? 1 : err === 'collect' ? 2 : err === 'i2' ? 3 : 0;
  const rule = err === 'cross' ? 'dist' : err === 'sign' ? 'sign' : err === 'collect' ? 'like' : err === 'i2' ? 'i2' : '';
  return { lines, bad, rule, err, z, w, p };
}
const RULES: Record<string, string> = {
  dist: 'The distributive property: every term times every term (4 partial products).',
  sign: 'The sign rule: a positive times a negative is negative, two negatives make a positive.',
  like: 'Combining like terms: add the coefficients of the i terms with their signs.',
  i2: `${II}<sup>2</sup> = ${MINUS}1.`,
};
const lineName = (k: number) => `Line ${k}`;

// ===================== diagnose-product-error =====================
/** the first invalid step in a worked product, or none (correct but unfinished) */
export const findError: Gen = (R, n) => retry(() => {
  const err = pickOf(R, ['cross', 'sign', 'collect', 'i2', 'none', 'none'] as const);
  const W = work(R, err);
  const k = W.lines.length - 1;
  const noneT = err === 'none' ? 'No invalid step: it is right, just not finished' : 'No invalid step';
  const opts: Opt[] = Array.from({ length: k }, (_, j) => ({
    t: lineName(j + 1), ok: W.bad === j + 1,
    mc: err === 'none' ? MC.rejectsUnfinished : undefined,
    say: W.bad === j + 1 ? `Yes: line ${j + 1} breaks a rule. ${RULES[W.rule]}` : err === 'none' ? `Line ${j + 1} is equal to the line before: unfinished is not wrong. It still has to become a + b${II}.` : W.bad > j + 1 ? `Line ${j + 1} is equal to the line before it. Look further down.` : `Line ${j + 1} follows from the line before, but an earlier line is already wrong.`,
  }));
  opts.push({ t: noneT, ok: err === 'none', mc: err === 'none' ? undefined : MC.looksRight, say: err === 'none' ? `Yes. Every line equals the one before; it only has to be finished: ${html(W.p)}.` : `Line ${W.bad} is not equal to the line before it. ${RULES[W.rule]}` });
  return choiceItem(R, {
    id: `findError-${n}`, family: 'findError',
    prompt: `Here is someone's work for (${html(W.z)})(${html(W.w)}). Which line is the first invalid step?`,
    board: W.lines[0]!,
    picture: { lines: { lines: W.lines, reveal: { bad: W.bad } } },
    solution: err === 'none'
      ? [`Each line equals the one before. It just stops before a + b${II}: the answer is ${html(W.p)}.`]
      : [`Line ${W.bad} is the first line that is not equal to the line before it.`, RULES[W.rule]!, `The right product is ${html(W.p)}.`],
  }, opts, { keep: true, min: 2 });
});
/** which rule the invalid line breaks */
export const nameRule: Gen = (R, n) => retry(() => {
  const err = pickOf(R, ['cross', 'sign', 'collect', 'i2'] as const);
  const W = work(R, err);
  return choiceItem(R, {
    id: `nameRule-${n}`, family: 'nameRule',
    prompt: `In this work for (${html(W.z)})(${html(W.w)}), line ${W.bad} is the first invalid step. Which rule does it break?`,
    board: W.lines[0]!,
    picture: { lines: { lines: W.lines, reveal: { bad: W.bad } } },
    solution: [RULES[W.rule]!, `Done right, the product is ${html(W.p)}.`],
  }, (['dist', 'sign', 'like', 'i2'] as const).map(r => ({
    t: RULES[r]!, ok: r === W.rule,
    say: r === W.rule ? 'Yes: that is the rule this line breaks.' : `Compare line ${W.bad} with the line before it: ${err === 'cross' ? 'two partial products are missing' : err === 'sign' ? 'one partial product has the wrong sign' : err === 'collect' ? 'the i terms were added with a wrong sign' : `${II}<sup>2</sup> was replaced by +1`}.`,
  })));
});
/** finish correct-but-unfinished work, or give the right product after a flagged slip */
export const finishWork: Gen = (R, n) => retry(() => {
  const fin = R() < 0.6;
  const W = work(R, fin ? 'none' : pickOf(R, ['cross', 'sign', 'i2'] as const));
  const p = W.p;
  const a = qVal(W.z.re), b = qVal(W.z.im), c = qVal(W.w.re), d = qVal(W.w.im);
  return cxPair({
    id: `finishWork-${n}`, family: 'finishWork',
    prompt: fin
      ? `This work for (${html(W.z)})(${html(W.w)}) has no invalid step, but it is not finished. Finish it: write the product in the form a + b${II}.`
      : `This work for (${html(W.z)})(${html(W.w)}) goes wrong in line ${W.bad}. What is the right product? Answer in the form a + b${II}.`,
    board: W.lines[0]!,
    picture: { lines: { lines: W.lines, reveal: { bad: W.bad } } },
    solution: [`(${html(W.z)})(${html(W.w)}) = ${a * c} ${sgH(a * d)}${II} ${sgH(b * c)}${II} ${sgH(b * d)}${II}<sup>2</sup>.`, `${II}<sup>2</sup> = ${MINUS}1: real part ${a * c} ${sgH(-b * d)} = ${qH(p.re)}, imaginary part ${a * d} ${sgH(b * c)} = ${qH(p.im)}.`, endZ(p)],
  }, p, `Yes: ${html(p)}.`, [
    { z: C(a * c + b * d, a * d + b * c), mc: MC.i2Plus, say: `${II}<sup>2</sup> = ${MINUS}1: the ${nH(b * d)}${II}<sup>2</sup> term becomes ${nH(-b * d)}.` },
    { z: C(a * c - b * d, 0), mc: MC.firstsLasts, say: 'Keep the two cross terms: they make the imaginary part.' },
  ], `Replace ${II}<sup>2</sup> with ${MINUS}1, then collect the real terms and the ${II} terms.`);
});
const sgH = (v: number) => (v < 0 ? `${MINUS} ${Math.abs(v)}` : `+ ${v}`);

// ===================== justify-conjugate-identity =====================
/** the steps of the proof (a + bi)(a − bi) = a² + b² ≥ 0, with numbers that vary */
export const conjProofStep: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['middle', 'square', 'nonneg', 'zero', 'examples'] as const);
  const a = int(R, 1, 9), b = int(R, 1, 9);
  const ex = html(C(a, b));
  const base = { id: `conjProofStep-${n}`, family: 'conjProofStep', board: '(a + bi)(a - bi) = a^{2} - abi + abi - b^{2}i^{2}' };
  if (t === 'middle') return choiceItem(R, {
    ...base,
    prompt: `In the proof that (a + b${II})(a ${MINUS} b${II}) is real, the middle terms are ${MINUS}ab${II} + ab${II} (for z = ${ex}: ${MINUS}${a * b}${II} + ${a * b}${II}). What do they make, and why?`,
    solution: ['ab i and −ab i are opposites, so they add to 0 for every a and b.'],
  }, [
    { t: '0, because they are opposites', ok: true, say: 'Yes: x + (−x) = 0, whatever a and b are.' },
    { t: '2ab' + II + ', because they are like terms', say: 'They are like terms, but with opposite signs: they cancel.' },
    { t: `${MINUS}a<sup>2</sup>b<sup>2</sup>${II}<sup>2</sup>, because like terms multiply`, say: 'Like terms ADD in a sum; they do not multiply.' },
  ]);
  if (t === 'square') return choiceItem(R, {
    ...base,
    prompt: `The last term of (a + b${II})(a ${MINUS} b${II}) is ${MINUS}b<sup>2</sup>${II}<sup>2</sup> (for z = ${ex}: ${MINUS}${b * b}${II}<sup>2</sup>). What does the whole product simplify to?`,
    solution: [`${MINUS}b<sup>2</sup>${II}<sup>2</sup> = ${MINUS}b<sup>2</sup> · (${MINUS}1) = +b<sup>2</sup>, and the middle terms cancel.`, 'So the product is a² + b².'],
  }, [
    { t: 'a<sup>2</sup> + b<sup>2</sup>', ok: true, say: `Yes: ${II}<sup>2</sup> = ${MINUS}1 turns ${MINUS}b<sup>2</sup>${II}<sup>2</sup> into +b<sup>2</sup>. For ${ex}: ${a * a} + ${b * b} = ${a * a + b * b}.` },
    { t: `a<sup>2</sup> ${MINUS} b<sup>2</sup>`, mc: MC.i2Plus, say: `${II}<sup>2</sup> = ${MINUS}1, so ${MINUS}b<sup>2</sup>${II}<sup>2</sup> = +b<sup>2</sup>.` },
    { t: `a<sup>2</sup> ${MINUS} b<sup>2</sup>${II}`, mc: MC.iTimesI, say: `${II}<sup>2</sup> is ${MINUS}1, not ${II}.` },
    { t: `a<sup>2</sup> + 2ab${II} + b<sup>2</sup>`, say: 'The middle terms are opposites: they cancel.' },
  ]);
  if (t === 'nonneg') return choiceItem(R, {
    ...base,
    prompt: `So z · z̄ = a<sup>2</sup> + b<sup>2</sup> (for z = ${html(C(a % 2 ? -a : a, b % 2 ? -b : b))}: ${a * a} + ${b * b}). Why is a<sup>2</sup> + b<sup>2</sup> ≥ 0 for every complex number z = a + b${II}?`,
    solution: ['a and b are real, and a real number squared is never negative.', 'A sum of two numbers that are each ≥ 0 is ≥ 0.'],
  }, [
    { t: 'a and b are real, real squares are never negative, and a sum of two of them is never negative.', ok: true, say: 'Yes. That works for every real a and b, signs included.' },
    { t: 'Because a and b are positive.', say: `a and b can be negative: ${html(C(-a, b))} has a = ${MINUS}${a}. Squares are ≥ 0 anyway.` },
    { t: `Because ${II}<sup>2</sup> = ${MINUS}1.`, say: `That explains the plus sign in a<sup>2</sup> + b<sup>2</sup>, not why it is ≥ 0.` },
    { t: 'Because it worked for every z we tried.', mc: MC.examples, say: 'Trying cases is not a proof: the reason has to hold for every a and b.' },
  ]);
  if (t === 'zero') return choiceItem(R, {
    ...base,
    prompt: `z · z̄ = a<sup>2</sup> + b<sup>2</sup> ≥ 0. When is it equal to 0? (Try z = ${ex} and others.)`,
    solution: ['a² ≥ 0 and b² ≥ 0, so a² + b² = 0 only when both are 0.', 'That is a = 0 and b = 0: z = 0.'],
  }, [
    { t: 'Only when a = 0 and b = 0, so z = 0.', ok: true, say: 'Yes. Then z · z̄ = 0 · 0 = 0. For every other z it is positive.' },
    { t: 'Never: a<sup>2</sup> + b<sup>2</sup> is always positive.', mc: MC.forgetsZero, say: 'z = 0 gives 0 + 0 = 0. It is nonnegative, and positive only when z ≠ 0.' },
    { t: 'When a = b.', say: `a = b = ${a} gives ${2 * a * a}, not 0.` },
    { t: 'When a = −b.', say: `a = ${a}, b = ${MINUS}${a} gives ${2 * a * a}: squares lose the sign.` },
  ]);
  const zs = [C(a, b), C(-b, a + 1), C(int(R, 1, 5), -int(R, 1, 5))];
  return choiceItem(R, {
    ...base,
    prompt: `Kai checks z = ${zs.map(z => html(z)).join(', z = ')}: each time z · z̄ is a positive real number. Does that prove z · z̄ = a<sup>2</sup> + b<sup>2</sup> ≥ 0 for every complex number?`,
    solution: ['Three examples check three numbers. A proof must cover every a and b: the algebra with letters does that.'],
  }, [
    { t: 'No: examples check some numbers; the algebra with letters a and b covers all of them.', ok: true, say: 'Yes. Examples can disprove a claim, but only the general argument proves it.' },
    { t: 'Yes: three examples that work are enough.', mc: MC.examples, say: 'Infinitely many numbers were not checked. The proof with a and b covers them all.' },
    { t: 'Yes, because no counterexample turned up.', mc: MC.examples, say: 'Not finding a counterexample in three tries is not a proof.' },
  ]);
});
/** always / sometimes / never statements about z, z̄ and z·z̄ */
const AS = [
  { s: 'z · z̄ is a real number.', v: 0, why: 'z · z̄ = a² + b², and a, b are real.' },
  { s: 'z · z̄ is a positive number.', v: 1, why: 'For z = 0 it is 0, which is not positive. For every other z it is positive.', mcAlways: MC.forgetsZero },
  { s: 'z · z̄ is a negative number.', v: 2, why: 'a² + b² is never negative.' },
  { s: 'z + z̄ is a real number.', v: 0, why: '(a + bi) + (a − bi) = 2a, a real number.' },
  { s: 'z − z̄ is a real number.', v: 1, why: '(a + bi) − (a − bi) = 2bi: real only when b = 0.' },
  { s: 'z · z̄ = z².', v: 1, why: 'Only when z̄ = z, that is when b = 0 (z real).' },
  { s: 'z · z̄ = 0.', v: 1, why: 'Only for z = 0.' },
];
export const alwaysSometimes: Gen = (R, n) => {
  const S = pickOf(R, AS), a = nz(R, -6, 6), b = nz(R, -6, 6);
  const W = ['Always true', 'Sometimes true', 'Never true'];
  return choiceItem(R, {
    id: `alwaysSometimes-${n}`, family: 'alwaysSometimes',
    prompt: `z = a + b${II} is any complex number. Always, sometimes, or never true? <b>${S.s.replace(/z̄/g, 'z̄')}</b> (Try z = ${html(C(a, b))}, and also z = 0 or a real z.)`,
    board: 'z = a + bi,\\ \\overline{z} = a - bi',
    solution: [S.why, `So: ${W[S.v]!.toLowerCase()}.`],
  }, W.map((t, k) => ({
    t, ok: k === S.v,
    mc: k !== S.v && k === 0 && S.mcAlways ? S.mcAlways : undefined,
    say: k === S.v ? `Yes. ${S.why}` : S.why,
  })), { keep: true });
};

// ===================== verify-quotient-by-multiplying =====================
interface Claim { z: Cx; w: Cx; q: Cx; claimed: Cx; ok: boolean }
function claim(R: () => number, right: boolean): Claim {
  const w = C(nz(R, -4, 4), nz(R, -4, 4)), qq = C(nz(R, -5, 5), nz(R, -5, 5)), z = mul(qq, w);
  let claimed = qq;
  if (!right) {
    const k = pickOf(R, ['sign', 'swap', 'conj', 'off']);
    claimed = k === 'sign' ? C(-qVal(qq.re), qVal(qq.im)) : k === 'swap' ? C(qVal(qq.im), qVal(qq.re)) : k === 'conj' ? conj(qq) : C(qVal(qq.re) + 1, qVal(qq.im));
    if (eq(claimed, qq)) throw new Reroll();
  }
  return { z, w, q: qq, claimed, ok: right };
}
/** multiply the claimed quotient back by the divisor */
export const checkProduct: Gen = (R, n) => retry(() => {
  const K = claim(R, R() < 0.5), back = mul(K.claimed, K.w);
  const a = qVal(K.claimed.re), b = qVal(K.claimed.im), c = qVal(K.w.re), d = qVal(K.w.im);
  return cxPair({
    id: `checkProduct-${n}`, family: 'checkProduct',
    prompt: `Ana says (${html(K.z)}) ÷ (${html(K.w)}) = ${html(K.claimed)}. Check it by multiplying back: what is (${html(K.claimed)})(${html(K.w)})?`,
    board: `(${tex(K.claimed)})(${tex(K.w)}) \\overset{?}{=} ${tex(K.z)}`,
    picture: { box: { a: [[a, 0], [b, 1]].filter(t => t[0] !== 0) as [number, number][], b: [[c, 0], [d, 1]] } },
    solution: [`(${html(K.claimed)})(${html(K.w)}) = ${a * c} ${sgH(a * d)}${II} ${sgH(b * c)}${II} ${sgH(b * d)}${II}<sup>2</sup> = ${html(back)}.`, eq(back, K.z) ? `That is ${html(K.z)}: Ana's quotient checks.` : `That is not ${html(K.z)}: Ana's quotient is wrong.`, endZ(back)],
  }, back, eq(back, K.z) ? `Yes: ${html(back)}, so the quotient checks.` : `Yes: ${html(back)}, which is not ${html(K.z)}. Ana's quotient is wrong.`, [
    { z: C(a * c + b * d, a * d + b * c), mc: MC.i2Plus, say: `${II}<sup>2</sup> = ${MINUS}1 in the check too.` },
    { z: K.z, mc: MC.looksRight, say: `Do the multiplication: (${html(K.claimed)})(${html(K.w)}) may not come back to ${html(K.z)}.` },
  ], 'Multiply every term by every term, then use i² = −1.');
});
/** does the claim check? (right, wrong, or right but not finished) */
export const verifyQuot: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['right', 'wrong', 'wrong', 'unfinished'] as const);
  const K = claim(R, t !== 'wrong'), back = mul(K.claimed, K.w);
  if (t === 'unfinished') {
    const N = qVal(normSq(K.w)), top = mul(K.z, conj(K.w));
    const unf = `${fr(html(top), String(N))}`;
    return choiceItem(R, {
      id: `verifyQuot-${n}`, family: 'verifyQuot',
      prompt: `Ben says (${html(K.z)}) ÷ (${html(K.w)}) = ${unf}. Multiplying back: (${unf}) · (${html(K.w)}) = ${html(K.z)}. What is true?`,
      board: `\\dfrac{${tex(K.z)}}{${tex(K.w)}} = \\dfrac{${tex(top)}}{${N}}`,
      solution: [`Multiplying back gives ${html(K.z)}, so Ben's quotient is EQUAL to the answer.`, `It is not in a + b${II} form yet: ${unf} = ${html(K.q)}.`],
    }, [
      { t: `Equal, but not finished: it is ${html(K.q)} in a + b${II} form.`, ok: true, say: 'Yes. Checking judges equality; the a + bi form is a separate step.' },
      { t: `Wrong, because it is not in a + b${II} form.`, mc: MC.rejectsUnfinished, say: 'It multiplies back to the right number, so it is equal. It is only unfinished.' },
      { t: `Equal and finished.`, mc: MC.stops, say: `a + b${II} form means no fraction bar over the whole number: ${html(K.q)}.` },
    ]);
  }
  const good = eq(back, K.z);
  return choiceItem(R, {
    id: `verifyQuot-${n}`, family: 'verifyQuot',
    prompt: `Ana says (${html(K.z)}) ÷ (${html(K.w)}) = ${html(K.claimed)}. Multiplying back: (${html(K.claimed)})(${html(K.w)}) = ${html(back)}. What is true?`,
    board: `(${tex(K.claimed)})(${tex(K.w)}) = ${tex(back)}`,
    solution: [good ? `The product is ${html(K.z)}, the number Ana divided: the quotient checks.` : `The product is ${html(back)}, not ${html(K.z)}: the quotient does not check.`],
  }, [
    { t: `It checks: the product is ${html(K.z)}.`, ok: good, mc: good ? undefined : MC.looksRight, say: good ? 'Yes. q · w = z means z ÷ w = q.' : `The product is ${html(back)}, not ${html(K.z)}.` },
    { t: `It does not check: the product is not ${html(K.z)}.`, ok: !good, say: good ? `Look again: ${html(back)} is ${html(K.z)}.` : `Yes. So ${html(K.claimed)} is not the quotient.` },
    { t: 'To be sure, divide again the same way.', mc: MC.repeatCheck, say: 'Repeating the same steps repeats the same slips. Multiplying back is an independent check, and it is done.' },
  ]);
});
const fr = frx;

// ===================== justify-division-method =====================
/** why multiplying by (c − di)/(c − di) is allowed and what it buys */
export const whyConj: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['one', 'one', 'nonzero', 'surface', 'notW'] as const);
  const z = C(nz(R, -9, 9), nz(R, -9, 9)), w = C(nz(R, -6, 6), nz(R, -6, 6)), c = qVal(w.re), d = qVal(w.im), N = c * c + d * d;
  const cw = html(conj(w));
  const base = { id: `whyConj-${n}`, family: 'whyConj', board: `\\dfrac{${tex(z)}}{${tex(w)}} \\cdot \\dfrac{${tex(conj(w))}}{${tex(conj(w))}}` };
  if (t === 'one') return choiceItem(R, {
    ...base,
    prompt: `Why is it allowed to multiply ${fr(html(z), html(w))} by ${fr(cw, cw)}?`,
    solution: [`${fr(cw, cw)} = 1, and multiplying by 1 never changes a number.`, `It only changes how the quotient is WRITTEN: the bottom becomes ${N}.`],
  }, [
    { t: `${fr(cw, cw)} equals 1, so the value does not change.`, ok: true, say: `Yes. The bottom becomes the real number ${N}, and the value stays the same.` },
    { t: `It divides the quotient by ${cw}.`, mc: MC.factorDivision, say: `It MULTIPLIES by ${cw} on top AND bottom: that is multiplying by 1.` },
    { t: 'It changes the value, but that is fine because the bottom becomes real.', mc: MC.oneChanges, say: 'Multiplying by 1 never changes the value. That is why it is allowed.' },
  ]);
  if (t === 'nonzero') return choiceItem(R, {
    ...base,
    prompt: `After multiplying by ${fr(cw, cw)}, the bottom is c<sup>2</sup> + d<sup>2</sup> = ${N}. Why can c<sup>2</sup> + d<sup>2</sup> never be 0 when we divide by c + d${II}?`,
    solution: ['We only divide by c + di ≠ 0, so c and d are not both 0.', 'Then c² + d² > 0.'],
  }, [
    { t: `Dividing needs c + d${II} ≠ 0, so c and d are not both 0, and then c<sup>2</sup> + d<sup>2</sup> > 0.`, ok: true, say: 'Yes. A sum of squares is 0 only when both are 0.' },
    { t: 'It can be 0, when c = d.', mc: MC.forgetsZero, say: `c = d = 1 gives 1 + 1 = 2. It is 0 only when c = d = 0.` },
    { t: `Because ${II}<sup>2</sup> = ${MINUS}1.`, say: `That makes it c<sup>2</sup> + d<sup>2</sup> instead of c<sup>2</sup> ${MINUS} d<sup>2</sup>; the reason it is not 0 is that c + d${II} ≠ 0.` },
  ]);
  if (t === 'surface') {
    const top = mul(z, conj(w));
    return choiceItem(R, {
      ...base,
      prompt: `Lee rewrites ${fr(html(z), html(w))} as ${fr(html(top), String(N))} and says: "The bottom is a real number, so it is right." Is that a good enough check?`,
      solution: ['A real bottom shows the form is useful, not that the value is unchanged.', `The value is unchanged because the factor was ${fr(cw, cw)} = 1; or check by multiplying the result back by ${html(w)}.`],
    }, [
      { t: 'No: a real bottom does not show the value stayed the same; multiplying by 1 (or multiplying back) does.', ok: true, say: `Yes. A wrong factor can give a real bottom too, like ${fr(html(z), String(N))}.` },
      { t: 'Yes: a real bottom means the rewrite is right.', mc: MC.surface, say: `${fr(html(z), String(N))} also has a real bottom, and it is a different number.` },
      { t: 'Yes, because the numbers got bigger.', say: 'Size says nothing about equality.' },
    ]);
  }
  const ww = mul(w, w);
  return choiceItem(R, {
    ...base,
    prompt: `Why multiply ${fr(html(z), html(w))} by ${fr(cw, cw)} and not by ${fr(html(w), html(w))}?`,
    solution: [`(${html(w)})(${cw}) = ${N}, a real number. (${html(w)})(${html(w)}) = ${html(ww)}, still not real.`],
  }, [
    { t: `(${html(w)})(${cw}) = ${N} is real; (${html(w)})<sup>2</sup> = ${html(ww)} is not.`, ok: true, say: 'Yes. Both factors equal 1, but only the conjugate clears the i from the bottom.' },
    { t: `${fr(html(w), html(w))} is not equal to 1.`, mc: MC.oneChanges, say: `It is 1 too. It just does not make the bottom real.` },
    { t: `Multiplying by ${cw} divides by ${html(w)}.`, mc: MC.factorDivision, say: 'Multiplying top and bottom by the same number is multiplying by 1, not dividing.' },
  ]);
});
/** the new denominator c² + d² */
export const newDenominator: Gen = (R, n) => {
  const z = C(nz(R, -9, 9), nz(R, -9, 9)), c = nz(R, -7, 7), d = nz(R, -7, 7), w = C(c, d), N = c * c + d * d;
  return numItem({
    id: `newDenominator-${n}`, family: 'newDenominator',
    prompt: `To divide (${html(z)}) by (${html(w)}), multiply top and bottom by ${html(conj(w))}. What is the new denominator?`,
    board: `(${tex(w)})(${tex(conj(w))}) = \\,?`,
    picture: { box: { a: [[c, 0], [d, 1]], b: [[c, 0], [-d, 1]] } },
    solution: [`(${html(w)})(${html(conj(w))}) = ${c * c} ${sgH(-c * d)}${II} ${sgH(c * d)}${II} ${sgH(-d * d)}${II}<sup>2</sup>.`, `The ${II} terms cancel and ${MINUS}${d * d}${II}<sup>2</sup> = +${d * d}: c<sup>2</sup> + d<sup>2</sup> = ${ans(String(N))}.`],
  }, N, numCheck(N, `Yes: ${c * c} + ${d * d} = ${N}, a positive real number.`, [
    { v: c * c - d * d, mc: MC.i2Plus, say: `${MINUS}${d * d}${II}<sup>2</sup> = +${d * d}, since ${II}<sup>2</sup> = ${MINUS}1.` },
    { v: (c - d) * (c - d), say: 'Multiply the conjugate pair: c² + d².' },
  ], 'A number times its conjugate is c² + d².'));
};

export const FAM3 = { findError, nameRule, finishWork, conjProofStep, alwaysSometimes, checkProduct, verifyQuot, whyConj, newDenominator } as const;
void CQ; void q; void qDiv; void typable; void monoT;
