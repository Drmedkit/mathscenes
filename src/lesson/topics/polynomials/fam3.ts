// fam3.ts: stage 3 families (reasoning): test values and counterexamples, auditing a worked rewrite, naming and
// repairing an error, closure, and polynomials in context. Pure: no DOM.
import { int, pick, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { type Poly, T, add, collect, equal, mul, neg, nH, parHtml, parTex, polyHtml, polyTex, q, sub, valN, xp } from './poly';
import { type Gen, type Opt, MC, Reroll, X, choiceItem, numCheck, numItem, nz, other, polyChoice, retry } from './common';

// ===================== claims: a written left side, a claimed right side, and what each really equals =====================
interface Claim { lh: string; lt: string; L: Poly; R: Poly; true?: boolean }
function wrongClaims(R: () => number): Claim[] {
  const a = int(R, 1, 6), k = int(R, 2, 5);
  return [
    { lh: `(${X} + ${a})<sup>2</sup>`, lt: `(x + ${a})^{2}`, L: mul([T(1, 1), T(a)], [T(1, 1), T(a)]), R: [T(1, 2), T(a * a)] },
    { lh: `${xp(2)} + ${xp(2)}`, lt: 'x^{2} + x^{2}', L: [T(1, 2), T(1, 2)], R: [T(1, 4)] },
    { lh: `${xp(2)} · ${xp(3)}`, lt: 'x^{2} \\cdot x^{3}', L: [T(1, 5)], R: [T(1, 6)] },
    { lh: `${k}${X} · ${k + 1}${X}`, lt: `${k}x \\cdot ${k + 1}x`, L: [T(k * (k + 1), 2)], R: [T(k * (k + 1), 1)] },
    { lh: `${X}(${X} + ${a + 1})`, lt: `x(x + ${a + 1})`, L: [T(1, 2), T(a + 1, 1)], R: [T(1, 2), T(a + 1)] },
    { lh: `(${k}${X})<sup>2</sup>`, lt: `(${k}x)^{2}`, L: [T(k * k, 2)], R: [T(k, 2)] },
  ];
}
const rhsH = (c: Claim) => polyHtml(c.R), rhsT = (c: Claim) => polyTex(c.R);
const agreeAt = (c: Claim, x: number) => valN(c.L, x) === valN(c.R, x);

// ===================== counterexample-test =====================
export const testValue: Gen = (R, n) => retry(R, () => {
  const c = pick(R, wrongClaims(R));
  const masked = [-1, 0, 1].filter(x => agreeAt(c, x));
  if (!masked.length) throw new Reroll();
  const sep = pick(R, [2, 3, -2].filter(x => !agreeAt(c, x)));
  const shown = shuffle(R, masked).slice(0, 2);
  const opts: Opt[] = [
    { t: `${X} = ${nH(sep)}`, ok: true, say: `Yes: at ${X} = ${nH(sep)} the left side is ${nH(valN(c.L, sep))} and the right side ${nH(valN(c.R, sep))}. One disagreement disproves the claim.` },
    ...shown.map(x => ({ t: `${X} = ${nH(x)}`, mc: MC.nonSep, say: `At ${X} = ${nH(x)} both sides are ${nH(valN(c.L, x))}: they agree there, so that test cannot catch the error.` })),
  ];
  if (opts.length < 3) opts.push({ t: 'none: the two sides are equal for every x', mc: MC.examples, say: `Try ${X} = ${nH(sep)}: ${nH(valN(c.L, sep))} ≠ ${nH(valN(c.R, sep))}. They are not equal for every ${X}.` });
  return choiceItem(R, { id: `testValue-${n}`, family: 'testValue', prompt: `Jo claims ${c.lh} = ${rhsH(c)} for every ${X}. Which test value shows the claim is false?`, board: `${c.lt} \\overset{?}{=} ${rhsT(c)}`,
    solution: ['A test value disproves a rewrite only where the two sides differ. 0 and 1 often hide an error.', `At ${X} = ${nH(sep)} the left side is ${nH(valN(c.L, sep))} and the right side is ${nH(valN(c.R, sep))}: they differ.`] }, opts);
});
export const testVerdict: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['agree', 'differ'] as const);
  if (v === 'agree') {
    const a = int(R, 2, 7);
    const pool: { c: Claim; at: number[] }[] = [
      { c: wrongClaims(R)[2]!, at: [0, 1] },
      { c: wrongClaims(R)[3]!, at: [0, 1] },
      { c: { lh: `(${X} + ${a})(${X} − ${a})`, lt: `(x + ${a})(x - ${a})`, L: mul([T(1, 1), T(a)], [T(1, 1), T(-a)]), R: [T(1, 2), T(-a * a)], true: true }, at: shuffle(R, [0, 1, 2, 3]).slice(0, 2).sort((p, s) => p - s) },
      { c: { lh: `${xp(2)} · ${xp(3)}`, lt: 'x^{2} \\cdot x^{3}', L: [T(1, 5)], R: [T(1, 5)], true: true }, at: [0, 1] },
    ];
    const { c, at } = pick(R, pool);
    if (!at.every(x => agreeAt(c, x))) throw new Reroll();
    return choiceItem(R, { id: `testVerdict-${n}`, family: 'testVerdict', prompt: `Ana checks ${c.lh} = ${rhsH(c)} at ${X} = ${at.join(' and ' + X + ' = ')}. Both sides match each time. What do her two tests prove?`, board: `${c.lt} \\overset{?}{=} ${rhsT(c)}`,
      solution: ['Matching values are examples: they never prove that two expressions agree for EVERY x.', 'To settle it, rewrite one side step by step (or keep looking for a value where they differ).'] }, [
      { t: 'Nothing for every x yet: matching values never prove a rewrite', ok: true, say: 'Right: agreement at a few values proves nothing about every x. Expand to check, or keep testing.' },
      { t: 'They prove the rewrite is correct for every x', mc: MC.examples, say: `Two matching values are not a proof. ${c.true ? 'This rewrite happens to be right, but the tests do not show it.' : `Try ${X} = 2: ${nH(valN(c.L, 2))} versus ${nH(valN(c.R, 2))}.`}` },
      { t: 'They prove the rewrite is wrong', say: 'Matching values cannot show a rewrite is wrong; only a value where the sides differ can.' },
    ]);
  }
  const c = pick(R, wrongClaims(R).slice(0, 2).concat(wrongClaims(R).slice(5)));
  const x = pick(R, [2, 3].filter(t => !agreeAt(c, t)));
  return choiceItem(R, { id: `testVerdict-${n}`, family: 'testVerdict', prompt: `Ben checks ${c.lh} = ${rhsH(c)}. At ${X} = 0 both sides are ${nH(valN(c.L, 0))}. At ${X} = ${x} the left side is ${nH(valN(c.L, x))} and the right side is ${nH(valN(c.R, x))}. What can he conclude?`, board: `${c.lt} \\overset{?}{=} ${rhsT(c)}`,
    solution: ['Equivalent means equal for EVERY x. One value where the sides differ is a counterexample: the rewrite is wrong.'] }, [
    { t: 'The rewrite is wrong: one value where the sides differ is enough', ok: true, say: 'Right: one counterexample disproves it, no matter how many values agree.' },
    { t: `The rewrite is right; ${X} = ${x} is just an exception`, mc: MC.exception, say: 'A rewrite must hold for every x. A value where it fails is not an exception, it is a counterexample.' },
    { t: 'He cannot tell yet: he needs more matching values', mc: MC.examples, say: 'More matching values would not help: the one value where the sides differ already settles it.' },
  ]);
});

// ===================== worked chains with one planted error (or none) =====================
interface Step { t: string; P: Poly }
interface Chain { start: Step; steps: [Step, Step, Step]; bad: number; kind: string }
const S = (t: string, P: Poly): Step => ({ t, P });
function chainOf(R: () => number): Chain {
  const kind = pick(R, ['prod', 'sub', 'mono'] as const);
  const bad = pick(R, [0, 1, 2, 3, 1, 2, 3]);   // 0 = no error
  if (kind === 'prod') {
    const a = nz(R, -7, 7), b = other(R, -7, 7, [0, a, -a]);
    const A = [T(1, 1), T(a)], B = [T(1, 1), T(b)];
    const s0 = S(`${parTex(A)}${parTex(B)}`, mul(A, B));
    // step 1: distribute the second factor over the first one's terms
    const s1 = bad === 1 ? S(`x${parTex(B)} ${a < 0 ? '-' : '+'} ${Math.abs(a)}`, add(mul([T(1, 1)], B), [T(a)])) : S(`x${parTex(B)} ${a < 0 ? '-' : '+'} ${Math.abs(a)}${parTex(B)}`, mul(A, B));
    const s2P = bad === 1 ? add(mul([T(1, 1)], B), [T(a)]) : bad === 2 ? [T(1, 2), T(b, 1), T(a, 1), T(b)] : [T(1, 2), T(b, 1), T(a, 1), T(a * b)];
    const s2 = S(polyTex(s2P), s2P);
    const s3P = bad === 3 ? [T(1, 2), T(a - b, 1), ...collect(s2P).filter(t => t.x === 0)] : collect(s2P);
    if (bad === 3 && equal(s3P, collect(s2P))) throw new Reroll();
    return { start: s0, steps: [s1, s2, S(polyTex(s3P), s3P)], bad, kind };
  }
  if (kind === 'sub') {
    const A = [T(nz(R, 2, 9), 2), T(nz(R, -9, 9), 1), T(nz(R, -9, 9))];
    const B = [T(nz(R, 1, 9), 2), T(nz(R, -9, -1), 1), T(nz(R, -9, 9))];
    const s0 = S(`${parTex(A)} - ${parTex(B)}`, sub(A, B));
    const nb = bad === 1 ? [neg(B)[0]!, ...B.slice(1)] : neg(B);
    const s1 = S(`${parTex(A)} + (${polyTex(nb)})`, add(A, nb));
    const s2P = bad === 2 ? add(A, nb.map((t, i) => (i === 1 ? { ...t, c: q(-t.c.p) } : t))) : add(A, nb);
    const s2 = S(polyTex(s2P), s2P);
    const right = collect(s2P);
    const s3P = bad === 3 ? right.map((t, i) => (i === 0 ? { ...t, x: t.x * 2 } : t)) : right;
    if (right.length < 2) throw new Reroll();
    return { start: s0, steps: [s1, s2, S(polyTex(s3P), s3P)], bad, kind };
  }
  const m = T(nz(R, -4, -2), 1), Pp = [T(1, 2), T(nz(R, -6, 6), 1), T(nz(R, -9, 9))], extra = T(nz(R, 2, 9), 2);
  const s0 = S(`${polyTex([m])}${parTex(Pp)} + ${polyTex([extra])}`, add(mul([m], Pp), [extra]));
  const prods = bad === 1 ? Pp.map((t, i) => { const p = mul([m], [t])[0]!; return i === 0 ? p : { ...p, c: q(-p.c.p) }; }) : mul([m], Pp);
  const s1P = [...prods, extra];
  const s1 = S(polyTex(s1P), s1P);
  const c2 = prods.find(t => t.x === 2)!.c.p;
  const tail = polyTex([prods[2]!]), tl = tail.startsWith('-') ? `- ${tail.slice(1)}` : `+ ${tail}`;
  const s2 = bad === 2
    ? S(`${polyTex([prods[0]!])} + (${c2} + ${extra.c.p})x^{3} ${tl}`, [prods[0]!, T(c2 + extra.c.p, 3), prods[2]!])
    : S(`${polyTex([prods[0]!])} + (${c2} + ${extra.c.p})x^{2} ${tl}`, collect(s1P));
  const coll = collect(s2.P);
  const s3P = bad === 3 ? coll.map(t => (t.x === 2 ? { ...t, x: 4 } : t)) : coll;
  if (c2 + extra.c.p === 0) throw new Reroll();
  return { start: s0, steps: [s1, s2, S(polyTex(s3P), s3P)], bad, kind };
}
/** the first step whose polynomial differs from the one before (0 = none) */
function firstBad(ch: Chain): number {
  let prev = ch.start.P;
  for (let i = 0; i < 3; i++) { if (!equal(prev, ch.steps[i]!.P)) return i + 1; prev = ch.steps[i]!.P; }
  return 0;
}
const chainLines = (ch: Chain) => [ch.start.t, ...ch.steps.map(s => `= ${s.t}`)];
const WHY: Record<string, string[]> = {
  prod: ['', 'the a-term must multiply the whole second factor', 'a product sign or value is off', 'the x terms were not added correctly'],
  sub: ['', 'the minus must reach every term of the subtracted polynomial', 'a sign changed when the parentheses were dropped', 'adding like terms keeps the exponent'],
  mono: ['', 'the negative factor changes the sign of every product', 'only like terms (same power) can be grouped', 'adding like terms keeps the exponent'],
};
export const badStep: Gen = (R, n) => retry(R, () => {
  const ch = chainOf(R), b = firstBad(ch);
  if (b !== ch.bad) throw new Reroll();
  const opts: Opt[] = [1, 2, 3].map(i => ({ t: `Step ${i}`, ok: i === b, mc: i === b ? undefined : i < b || b === 0 ? MC.unfamiliar : undefined,
    say: i === b ? `Yes: step ${i} does not equal the line before (${WHY[ch.kind]![i]}).` : i < b || b === 0 ? `Step ${i} is a correct rewrite, even if it looks unusual: it equals the line before it.` : `Step ${i} follows correctly from the line before it. Look earlier: the first broken step is what matters.` }));
  opts.push({ t: 'No step is wrong', ok: b === 0, mc: b === 0 ? undefined : MC.finalAnswer, say: b === 0 ? 'Yes: every step equals the line before it.' : `Check each step against the one before it, not just the last line: step ${b} breaks equivalence.` });
  return choiceItem(R, { id: `badStep-${n}`, family: 'badStep', prompt: 'Which step is the first one that does not keep the expression equal to the line before it?', board: chainLines(ch)[0]!, picture: { chain: { lines: chainLines(ch) }, reveal: { bad: b } },
    solution: ['Compare each step with the line just before it.', b ? `Step ${b}: ${WHY[ch.kind]![b]}.` : 'Every step is a correct rewrite.'] }, opts, { min: 4, keep: true });
});
export const badStepSub: Gen = (R, n) => retry(R, () => {
  const ch = chainOf(R), b = firstBad(ch);
  if (b === 0 || b !== ch.bad) throw new Reroll();
  const x = pick(R, [2, 3, -2]);
  const all = [ch.start, ...ch.steps];
  const vals = all.map(s => valN(s.P, x));
  if (vals[b] === vals[b - 1]) throw new Reroll();
  const opts: Opt[] = [1, 2, 3].map(i => ({ t: `Step ${i}`, ok: i === b, mc: i === b ? undefined : i < b ? MC.unfamiliar : undefined,
    say: i === b ? `Yes: the value jumps from ${nH(vals[b - 1]!)} to ${nH(vals[b]!)} at step ${b}.` : i < b ? `Step ${i} keeps the value (${nH(vals[i]!)}), so it did not break anything.` : `The value had already changed before step ${i}: look for the FIRST change.` }));
  return choiceItem(R, { id: `badStepSub-${n}`, family: 'badStepSub', prompt: `Every line is worked out at ${X} = ${nH(x)}; its value is written under it. Which step first breaks equivalence?`, board: chainLines(ch)[0]!,
    picture: { chain: { lines: chainLines(ch), vals: vals.map(v => nH(v)), at: x }, reveal: { bad: b } },
    solution: ['Equal expressions have equal values at every x, so a correct step keeps the value.', `Values: ${vals.map(nH).join(', ')}. The first change is at step ${b}.`] }, opts, { min: 3, keep: true });
});

// ===================== explain-and-repair =====================
interface Err { lh: string; lt: string; wrong: Poly; right: Poly; rule: string; swap: string }
function errors(R: () => number): Err[] {
  const a = int(R, 2, 7), b = int(R, 2, 9), c = other(R, 2, 9, [b]);
  const A = [T(nz(R, 2, 6), 2), T(nz(R, 1, 9), 1)], B = [T(nz(R, 1, 6), 2), T(nz(R, 1, 9), 1), T(nz(R, 1, 9))];
  return [
    { lh: `(${X} + ${a})<sup>2</sup>`, lt: `(x + ${a})^{2}`, wrong: [T(1, 2), T(a * a)], right: collect(mul([T(1, 1), T(a)], [T(1, 1), T(a)])), rule: `An exponent does not distribute over a sum: (${X} + ${a})<sup>2</sup> means (${X} + ${a})(${X} + ${a}), which also has two cross products`, swap: `It should be ${polyHtml(collect(mul([T(1, 1), T(a)], [T(1, 1), T(a)])))}` },
    { lh: `${parHtml(A)} − ${parHtml(B)}`, lt: `${parTex(A)} - ${parTex(B)}`, wrong: add(A, [neg(B)[0]!, ...B.slice(1)]), right: collect(sub(A, B)), rule: 'The minus sign was applied to the first term of the subtracted polynomial only; it must multiply every term', swap: `It should be ${polyHtml(collect(sub(A, B)))}` },
    { lh: `${b}${X} + ${c}`, lt: `${b}x + ${c}`, wrong: [T(b + c, 1)], right: [T(b, 1), T(c)], rule: `${b}${X} and ${c} are unlike terms (different powers of ${X}), so they cannot be combined into one term`, swap: `It should be ${b}${X} + ${c}` },
    { lh: `${b}${xp(2)} + ${c}${xp(2)}`, lt: `${b}x^{2} + ${c}x^{2}`, wrong: [T(b + c, 4)], right: [T(b + c, 2)], rule: 'Adding like terms adds the coefficients; the exponent stays the same', swap: `It should be ${b + c}${xp(2)}` },
    { lh: `(${X} + ${a})(${X} + ${b})`, lt: `(x + ${a})(x + ${b})`, wrong: [T(1, 2), T(a * b)], right: collect(mul([T(1, 1), T(a)], [T(1, 1), T(b)])), rule: 'Only two of the four partial products were used; every term must multiply every term', swap: `It should be ${polyHtml(collect(mul([T(1, 1), T(a)], [T(1, 1), T(b)])))}` },
  ];
}
export const nameError: Gen = (R, n) => retry(R, () => {
  const es = errors(R), i = int(R, 0, es.length - 1), e = es[i]!;
  const others = shuffle(R, es.filter((_, j) => j !== i)).slice(0, 2);
  return choiceItem(R, { id: `nameError-${n}`, family: 'nameError', prompt: `Sam wrote ${e.lh} = ${polyHtml(e.wrong)}. Which sentence explains the error (names the rule that was broken)?`, board: `${e.lt} \\overset{?}{=} ${polyTex(e.wrong)}`,
    solution: ['An explanation names the property that was misused and where; a corrected answer alone does not say why.', `${e.rule}.`] }, [
    { t: e.rule, ok: true, say: 'Yes: that names the broken rule and where it went wrong.' },
    { t: e.swap, mc: MC.answerSwap, say: 'That gives a corrected answer, but not WHY Sam\'s line is wrong. Name the rule he broke.' },
    ...others.map(o => ({ t: o.rule, say: `True in general, but that is not what happened in ${e.lh}.` })),
  ], { min: 4 });
});
export const repair: Gen = (R, n) => retry(R, () => {
  const es = errors(R), e = pick(R, es);
  const extra: Poly = e.right.length > 1 ? e.right.map((t, i) => (i === e.right.length - 1 ? { ...t, c: q(-t.c.p) } : t)) : [{ ...e.right[0]!, x: e.right[0]!.x + 1 }];
  return polyChoice(R, { id: `repair-${n}`, family: 'repair', prompt: `Sam wrote ${e.lh} = ${polyHtml(e.wrong)}, which is wrong. What should the right side be?`, board: `${e.lt} \\overset{?}{=} ${polyTex(e.wrong)}`,
    solution: [`${e.rule}.`, `Correct: ${polyHtml(e.right)}.`] },
    { p: e.right, say: 'Yes: that is equal to the left side for every x.' }, [
      { p: e.wrong, say: 'That is Sam\'s line, which is the error.' },
      { p: extra, say: 'Check each term again.' },
    ], { std: false });
});

// ===================== closure =====================
export const closure: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['sum', 'diff', 'prod', 'quot', 'cancel', 'cancel'] as const);
  if (v === 'cancel') {
    const a = nz(R, 2, 9), b = nz(R, -9, 9), k = nz(R, 2, 12);
    const A = [T(a, 2), T(b, 1)], B = [T(-a, 2), T(-b, 1), T(k)];
    return choiceItem(R, { id: `closure-${n}`, family: 'closure', prompt: `${parHtml(A)} + ${parHtml(B)} = ${k}. Is the result a polynomial?`, board: `${parTex(A)} + ${parTex(B)} = ${k}`,
      solution: [`${k} is a constant, a polynomial of degree 0. Sums of polynomials are always polynomials, even when the degree drops.`] }, [
      { t: `Yes: ${k} is a constant, a polynomial of degree 0`, ok: true, say: 'Yes: a constant is a polynomial, so the sum stays inside the polynomials.' },
      { t: 'No: a constant is not a polynomial', mc: MC.constNotPoly, say: `A constant like ${k} is a polynomial (degree 0); even 0 is a polynomial.` },
      { t: 'No: the degree dropped from 2 to 0', mc: MC.keepDegree, say: 'Closure only asks that the result is a polynomial; its degree may change.' },
    ]);
  }
  const OP = { sum: 'sum', diff: 'difference', prod: 'product', quot: 'quotient' }[v];
  const always = v !== 'quot';
  return choiceItem(R, { id: `closure-${n}`, family: 'closure', prompt: `Is the ${OP} of two polynomials always a polynomial?`, board: `\\text{${OP} of two polynomials}`,
    solution: [always ? `Adding, subtracting or multiplying terms with whole-number exponents gives terms with whole-number exponents (exponents add when multiplying), so the ${OP} is always a polynomial.` : `Not always: (${xp(2)} + 1) ÷ ${X} = ${X} + ${'1/' + 'x'} has ${X} in a denominator. Like the integers, polynomials are closed under +, −, × but not ÷.`] }, [
    { t: 'Yes, always', ok: always, mc: !always ? MC.quotient : undefined, say: always ? 'Yes: whole-number exponents stay whole numbers.' : `(${xp(2)} + 1) ÷ ${X} = ${X} + 1/${X}: not a polynomial. Some quotients are, but not all.` },
    { t: 'Sometimes, but not always', ok: !always, mc: always ? MC.keepDegree : undefined, say: always ? 'There is no exception: even when terms cancel, the result (maybe a constant) is a polynomial.' : 'Yes: (x² + 2x) ÷ x = x + 2 is a polynomial, but (x² + 1) ÷ x is not.' },
    { t: 'Never', say: always ? `Try one: the ${OP} of two polynomials is a polynomial every time.` : '(x² + 2x) ÷ x = x + 2 is a polynomial, so "never" is too strong.' },
  ], { keep: true });
});
export const closureEx: Gen = (R, n) => retry(R, () => {
  const a = int(R, 1, 9), b = int(R, 2, 9);
  const P = [T(1, 2), T(a)];
  return choiceItem(R, { id: `closureEx-${n}`, family: 'closureEx', prompt: `Which result is <b>not</b> a polynomial?`, board: `${polyTex(P)} \\text{ and } ${b}x^{2}`,
    solution: [`(${polyHtml(P)}) ÷ ${X} = ${X} + ${a}/${X}: the term ${a}/${X} has ${X} in a denominator, so it is not a polynomial.`, 'Sums, differences and products of polynomials are always polynomials (a constant, even 0, counts).'] }, [
    { t: `(${polyHtml(P)}) ÷ ${X} = ${X} + ${a}/${X}`, ok: true, say: `Right: ${a}/${X} = ${a}${X}<sup>−1</sup>, a negative exponent.` },
    { t: `(${polyHtml(P)}) − (${polyHtml(P)}) = 0`, mc: MC.constNotPoly, say: '0 is a polynomial (the zero polynomial): differences of polynomials always are.' },
    { t: `(${polyHtml(P)}) · ${b}${xp(2)} = ${polyHtml(collect(mul(P, [T(b, 2)])))}`, mc: MC.keepDegree, say: 'The degree went up, but every exponent is still a whole number: a polynomial.' },
    { t: `(${xp(2)} + ${b}${X}) ÷ ${X} = ${X} + ${b}`, mc: MC.quotient, say: `This quotient happens to be a polynomial (${X} + ${b}). The other one is not.` },
  ], { min: 4 });
});

// ===================== interpret-in-context =====================
export const ctxMeaning: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['patioConst', 'patioSide', 'boxBase', 'profit'] as const);
  if (v === 'patioConst' || v === 'patioSide') {
    const a = int(R, 2, 6), b = other(R, 2, 6, [a]);
    const A = [T(1, 1), T(a)], B = [T(1, 1), T(b)], area = collect(mul(A, B));
    const base = { id: `ctxMeaning-${n}`, family: 'ctxMeaning', board: `A = ${parTex(A)}${parTex(B)} = ${polyTex(area)}`, picture: { box: { a: A, b: B, cells: 'all' as const, noteL: 'feet', noteT: 'feet' } } };
    if (v === 'patioConst') return choiceItem(R, { ...base, prompt: `A patio is (${X} + ${a}) ft by (${X} + ${b}) ft. Its area is ${polyHtml(area)} square feet. What does the ${a * b} mean?`,
      solution: [`${a * b} = ${a} · ${b}: the corner piece of the box, ${a} ft by ${b} ft.`] }, [
      { t: `the area of the ${a} ft by ${b} ft corner piece, in square feet`, ok: true, say: `Yes: the ${a} ft part of one side times the ${b} ft part of the other.` },
      { t: 'nothing in the patio: it is just a number left over from the algebra', mc: MC.noMeaning, say: `Every term is a piece of the area: ${a * b} is the ${a} ft by ${b} ft corner.` },
      { t: `the length of the patio, in feet`, say: `${a * b} is an AREA (feet times feet). The lengths are ${X} + ${a} and ${X} + ${b}.` },
      { t: `the whole area of the patio`, say: `The whole area is all four pieces together: ${polyHtml(area)}.` },
    ], { min: 4 });
    return choiceItem(R, { ...base, prompt: `A patio is (${X} + ${a}) ft by (${X} + ${b}) ft, so its area is (${X} + ${a})(${X} + ${b}) square feet. What does the factor (${X} + ${a}) stand for?`,
      solution: [`(${X} + ${a}) is read as ONE quantity: one whole side, ${X} ft plus ${a} ft more.`] }, [
      { t: `one side length of the patio, in feet`, ok: true, say: `Yes: the grouped sum is one length, ${X} ft and ${a} ft more.` },
      { t: `two separate things: ${X} square feet and ${a} feet`, mc: MC.group, say: `The parentheses make ${X} + ${a} one quantity: a single side length.` },
      { t: `the area of the patio, in square feet`, say: `The area is the product of BOTH factors.` },
      { t: 'nothing: it is just a step in the algebra', mc: MC.noMeaning, say: 'It is the length of one side, in feet.' },
    ], { min: 4 });
  }
  if (v === 'boxBase') {
    const h = int(R, 2, 9);
    const V = collect(mul([T(1, 2)], [T(1, 1), T(h)]));
    return choiceItem(R, { id: `ctxMeaning-${n}`, family: 'ctxMeaning', prompt: `A box has a square base ${X} in. on each side and height (${X} + ${h}) in. Its volume is ${xp(2)}(${X} + ${h}) = ${polyHtml(V)} cubic inches. What does the ${xp(2)} in ${xp(2)}(${X} + ${h}) stand for?`, board: `V = x^{2}(x + ${h}) = ${polyTex(V)}`,
      solution: [`${xp(2)} = ${X} · ${X}: the area of the square base, in square inches. Volume = base area × height.`] }, [
      { t: 'the area of the square base, in square inches', ok: true, say: 'Yes: base area times height gives the volume.' },
      { t: 'the height of the box, in inches', say: `The height is the other factor, (${X} + ${h}).` },
      { t: 'nothing: it is just x times x', mc: MC.noMeaning, say: `${X} · ${X} is side times side: the area of the base.` },
      { t: 'the volume of the box', say: `The volume is the whole product, base area times height.` },
    ], { min: 4 });
  }
  const p = int(R, 12, 30), c = other(R, 3, 10, []), F = pick(R, [100, 150, 200, 250, 300]);
  const prof = [T(p - c, 1), T(-F)];
  return choiceItem(R, { id: `ctxMeaning-${n}`, family: 'ctxMeaning', prompt: `A food truck sells ${X} sandwiches a week. Revenue: ${p}${X} dollars. Cost: ${c}${X} + ${F} dollars. Profit = ${p}${X} − (${c}${X} + ${F}) = ${polyHtml(prof)} dollars. What does the ${F} stand for?`, board: `P = ${p}x - (${c}x + ${F}) = ${polyTex(prof)}`,
    solution: [`${F} is in the cost but not multiplied by ${X}: a fixed weekly cost in dollars, paid even when no sandwich is sold.`] }, [
    { t: 'a fixed weekly cost in dollars, paid even with no sales', ok: true, say: 'Yes: it does not depend on the number of sandwiches.' },
    { t: 'the profit on each sandwich, in dollars', say: `The profit per sandwich is the coefficient ${p - c} (${p} − ${c}).` },
    { t: 'the number of sandwiches sold', say: `The number sold is ${X}.` },
    { t: 'nothing: it is just the constant term', mc: MC.noMeaning, say: 'Every term means something here: this one is a cost in dollars.' },
  ], { min: 4 });
});
export const ctxWrite: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['patio', 'box', 'frame', 'profit'] as const);
  if (v === 'patio') {
    const a = int(R, 2, 6), b = other(R, 2, 6, [a]);
    const A = [T(1, 1), T(a)], B = [T(1, 1), T(b)];
    return polyChoice(R, { id: `ctxWrite-${n}`, family: 'ctxWrite', prompt: `A square patio, ${X} ft on a side, is made ${a} ft longer and ${b} ft wider. Which polynomial gives its new area in square feet?`, board: `(x + ${a})(x + ${b})`, picture: { box: { a: A, b: B, cells: 'none', noteL: 'feet', noteT: 'feet' } },
      solution: [`New sides: (${X} + ${a}) ft and (${X} + ${b}) ft.`, `Area: (${X} + ${a})(${X} + ${b}) = ${polyHtml(collect(mul(A, B)))}.`] },
      { p: mul(A, B), say: 'Yes: all four pieces of the area.' }, [
        { p: [T(1, 2), T(a * b)], mc: MC.firstsLasts, say: `The two strips (${a}${X} and ${b}${X}) are missing.` },
        { p: [T(1, 2), T(a + b)], mc: MC.group, say: `Adding ${a} and ${b} to the area mixes lengths and areas: multiply the new side LENGTHS.` },
        { p: [T(1, 2), T(a, 1), T(b)], mc: MC.group, say: `The ${b} ft is a length, not an area: (${X} + ${b}) is one side, and it multiplies the whole other side.` },
      ]);
  }
  if (v === 'box') {
    const h = int(R, 2, 9);
    return polyChoice(R, { id: `ctxWrite-${n}`, family: 'ctxWrite', prompt: `A box has a square base ${X} in. on a side and is ${h} in. taller than it is wide. Which polynomial gives its volume in cubic inches?`, board: `V = x \\cdot x \\cdot (x + ${h})`,
      solution: [`Base area ${xp(2)}, height (${X} + ${h}): V = ${xp(2)}(${X} + ${h}).`, `= ${polyHtml([T(1, 3), T(h, 2)])}.`] },
      { p: [T(1, 3), T(h, 2)], say: 'Yes: base area times the whole height.' }, [
        { p: [T(1, 3), T(h)], mc: MC.group, say: `The height (${X} + ${h}) is one quantity: ${xp(2)} multiplies the ${h} too.` },
        { p: [T(1, 3), T(h, 1)], mc: MC.partial, say: `${xp(2)} · ${h} = ${h}${xp(2)}.` },
        { p: [T(1, 2), T(h, 1)], say: `Volume needs three lengths: ${X} · ${X} · (${X} + ${h}).` },
      ]);
  }
  if (v === 'frame') {
    const w = int(R, 1, 4);
    return polyChoice(R, { id: `ctxWrite-${n}`, family: 'ctxWrite', prompt: `A square photo, ${X} in. on a side, has a frame ${w} in. wide all around. Which polynomial gives the area of the frame alone, in square inches?`, board: `(x + ${2 * w})^{2} - x^{2}`,
      solution: [`Outer square: (${X} + ${2 * w}) in. on a side. Frame = outer area − photo area.`, `(${X} + ${2 * w})<sup>2</sup> − ${xp(2)} = ${xp(2)} + ${4 * w}${X} + ${4 * w * w} − ${xp(2)} = ${polyHtml([T(4 * w, 1), T(4 * w * w)])}.`] },
      { p: [T(4 * w, 1), T(4 * w * w)], say: 'Yes: outer area minus the photo.' }, [
        { p: [T(4 * w * w)], mc: MC.fnSum, say: `(${X} + ${2 * w})<sup>2</sup> is not ${xp(2)} + ${4 * w * w}: it has the strips ${4 * w}${X} too.` },
        { p: [T(2, 2), T(4 * w, 1), T(4 * w * w)], say: 'Subtract the photo area: the x² terms cancel.' },
        { p: [T(2 * w, 1), T(w * w)], say: `The frame is ${w} in. wide on BOTH sides: the outer side is ${X} + ${2 * w}.` },
      ]);
  }
  const p = int(R, 12, 30), c = other(R, 3, 10, []), F = pick(R, [100, 150, 200, 250]);
  return polyChoice(R, { id: `ctxWrite-${n}`, family: 'ctxWrite', prompt: `A food truck sells ${X} sandwiches a week for $${p} each. Its weekly cost is ${c}${X} + ${F} dollars. Which polynomial gives the weekly profit in dollars?`, board: `P = ${p}x - (${c}x + ${F})`,
    solution: [`Profit = revenue − cost = ${p}${X} − (${c}${X} + ${F}).`, `The minus reaches both cost terms: ${polyHtml([T(p - c, 1), T(-F)])}.`] },
    { p: [T(p - c, 1), T(-F)], say: 'Yes: revenue minus the whole cost.' }, [
      { p: [T(p - c, 1), T(F)], mc: MC.negFirst, say: `The whole cost is subtracted: −(${c}${X} + ${F}) = −${c}${X} − ${F}.` },
      { p: [T(p + c, 1), T(F)], say: 'Profit subtracts the cost.' },
      { p: [T(p - c - F, 1)], mc: MC.unlike, say: `${c}${X} and ${F} are unlike terms: they do not combine.` },
    ]);
});
export const ctxValue: Gen = (R, n) => retry(R, () => {
  const v = pick(R, ['box', 'patio'] as const);
  if (v === 'box') {
    const h = int(R, 2, 6), s = int(R, 2, 6), a = s * s * (s + h);
    return numItem({ id: `ctxValue-${n}`, family: 'ctxValue', prompt: `A box has a square base ${X} in. on a side and height (${X} + ${h}) in., so its volume is ${xp(2)}(${X} + ${h}) cubic inches. Find the volume when ${X} = ${s}.`, board: `V = x^{2}(x + ${h}),\\ x = ${s}`, unit: 'cubic inches',
      solution: [`Base area ${s}<sup>2</sup> = ${s * s} sq in, height ${s} + ${h} = ${s + h} in.`, `V = ${s * s} · ${s + h} = ${ans(a)}.`] },
      a, numCheck(a, `Yes: ${s * s} square inches of base times ${s + h} in. of height.`, [{ v: s ** 3 + h, mc: MC.group, say: `The height (${X} + ${h}) is one quantity: the base area multiplies all of it.` }, { v: s * s * h, say: `The height is ${X} + ${h} = ${s + h}, not ${h}.` }], 'Volume = base area × height: work out each, then multiply.'));
  }
  const a = int(R, 2, 6), b = other(R, 2, 6, [a]), s = int(R, 5, 15);
  const A = [T(1, 1), T(a)], B = [T(1, 1), T(b)], v2 = (s + a) * (s + b);
  return numItem({ id: `ctxValue-${n}`, family: 'ctxValue', prompt: `A patio is (${X} + ${a}) ft by (${X} + ${b}) ft. Find its area when ${X} = ${s}.`, board: `A = (x + ${a})(x + ${b}),\\ x = ${s}`, unit: 'sq ft', picture: { box: { a: A, b: B, cells: 'none', noteL: 'feet', noteT: 'feet' } },
    solution: [`Sides: ${s} + ${a} = ${s + a} ft and ${s} + ${b} = ${s + b} ft.`, `Area: ${s + a} · ${s + b} = ${ans(v2)}.`] },
    v2, numCheck(v2, `Yes: ${s + a} ft by ${s + b} ft.`, [{ v: s * s + a * b, mc: MC.firstsLasts, say: `The two strips (${a}${X} and ${b}${X}) are part of the area too.` }, { v: s * s + a + b, mc: MC.group, say: 'Each factor is one side length: multiply the two sides.' }], 'Work out each side first, then multiply.'));
});
