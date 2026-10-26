// fam1.ts: practice families of stages 1 and 2 of geometric-sequences (sub-goals 1-12: index, ratios, classify,
// notation, recursive, explicit, translate). Every wrong answer a family recognises carries a misconception id.
import { ans } from '../../runtime/explain';
import { fr } from '../../runtime/item';
import {
  type Q, A, F, atH, atT, div, diffs, eq, expH, expT, facH, facT, mul, neg, pow, q, qH, qi, qT, ratios, recH, recT, sub, term, terms, val,
} from './geo';
import {
  type Gen, type Opt, type QItem, MC, R_FRAC, R_NEG, R_WHOLE, choice, fracItem, int, listH, listT, nI, numItem, nz, pairItem, pick, startFor,
  farStrip, fitCols, stripHidden, stripOf,
} from './common';

const aN = atH(A, 'n');
const pl = (k: number, w: string) => `${k} ${w}${k === 1 ? '' : 's'}`;
/** a ratio for stages 1-2: whole, fraction or negative */
function anyR(R: () => number): Q {
  const t = R();
  return t < 0.45 ? qi(pick(R, [2, 3, 4, 5])) : t < 0.75 ? pick(R, R_FRAC) : pick(R, R_NEG.filter(x => !eq(x, qi(-1))));
}
/** a start (sign mixed) whose first `count` terms are whole numbers and not too big */
function anyStart(R: () => number, r: Q, count: number, neg0 = 0.25): Q {
  for (;;) {
    const a = startFor(R, r, count, 1, r.d === 1 ? 9 : 3);
    const s = R() < neg0 ? neg(a) : a;
    if (terms(s, r, count).every(v => Math.abs(val(v)) <= 5000)) return s;
  }
}

// =====================================================================================================================
// 1 seq-index
// =====================================================================================================================
const termRead: Gen = (R, n) => {
  const r = anyR(R), a1 = anyStart(R, r, 6), vs = terms(a1, r, 6);
  const pic = { strip: stripOf(vs, { hops: false, ell: false, max: 6 }) };
  const shown = pic.strip!.vals.length;
  if (R() < 0.5) {
    const k = int(R, 2, shown), v = vs[k - 1]!;
    return numItem({ id: `termRead-${n}`, family: 'termRead', prompt: `The table shows a sequence from <i>n</i> = 1. What is a<sub>${k}</sub>?`, board: `${atT(A, k)} = \\,?`,
      solution: [`a<sub>${k}</sub> is the VALUE in the column with term number n = ${k}.`, `a<sub>${k}</sub> = ${ans(qH(v))}.`], picture: pic },
    v, `Right: a<sub>${k}</sub> = ${qH(v)}.`, [[k, MC.posVal, `${k} is the position. a<sub>${k}</sub> is the value under it.`]], `Find the column n = ${k} and read the value below it.`);
  }
  const k = int(R, 1, shown), v = vs[k - 1]!;
  return numItem({ id: `termRead-${n}`, family: 'termRead', prompt: `The table shows a sequence from <i>n</i> = 1. For which term number <i>n</i> is a<sub>n</sub> = ${qH(v)}?`, board: `a_n = ${qT(v)},\\ n = \\,?`,
    solution: [`Find the value ${qH(v)} in the bottom row; the term number is above it.`, `n = ${ans(k)}.`], picture: pic },
  qi(k), `Right: ${qH(v)} is term number ${k}.`, [[v, MC.posVal, `${qH(v)} is the VALUE. The question asks for its position n.`]], `Find ${qH(v)} in the value row and read n above it.`);
};
const indexDomain: Gen = (R, n) => {
  const c = int(R, 2, 9) * (R() < 0.5 ? 1 : -1), vs = terms(qi(c), qi(-1), 6), pic = { strip: stripOf(vs, { hops: false, ell: true }) };
  if (R() < 0.5) {
    const k = int(R, 2, 4);
    return choice(R, {
      id: `indexDomain-${n}`, family: 'indexDomain', prompt: `The table shows a<sub>n</sub> for <i>n</i> = 1 to 6. What is a<sub>${k}.5</sub>?`, board: `a_{${k}.5} = \\,?`,
      solution: ['A term number counts positions: 1st, 2nd, 3rd, … Only whole numbers n ≥ 1 are allowed.', `So there is no term number ${k}.5.`], picture: pic,
    }, [
      { t: `There is none: n counts positions 1, 2, 3, …, so ${k}.5 is not a term number`, ok: true, say: 'Right: the domain is the whole numbers 1, 2, 3, …' },
      { t: `0, halfway between a<sub>${k}</sub> and a<sub>${k + 1}</sub>`, mc: MC.fracIdx, say: `There is no ${k}.5th term: a sequence only has whole positions.` },
      { t: `${qH(vs[k - 1]!)}, the same as a<sub>${k}</sub>`, mc: MC.fracIdx, say: `A term number cannot be ${k}.5; there is no term between a<sub>${k}</sub> and a<sub>${k + 1}</sub>.` },
    ]);
  }
  const k = pick(R, [3, 5]), even = pick(R, [2, 4, 6]);
  return choice(R, {
    id: `indexDomain-${n}`, family: 'indexDomain', prompt: `The table shows a<sub>n</sub> for <i>n</i> = 1 to 6: ${listH(vs)}. Which statement is true?`, board: listT(vs),
    solution: [`a<sub>1</sub> = ${qH(vs[0]!)} and a<sub>${k}</sub> = ${qH(vs[k - 1]!)}: two different positions, the same value.`, 'A sequence can repeat a value; each POSITION still has one value.'], picture: pic,
  }, [
    { t: `a<sub>1</sub> and a<sub>${k}</sub> are different terms with the same value, ${qH(vs[0]!)}`, ok: true, say: 'Right: positions differ, values may repeat.' },
    { t: `a<sub>${even}</sub> = ${qH(vs[0]!)}`, say: `Read the column n = ${even}: its value is ${qH(vs[even - 1]!)}.` },
    { t: 'It is not a sequence: a function cannot give the same output twice', say: 'A function can repeat an OUTPUT; it may not give one input two outputs.' },
    { t: `a<sub>1.5</sub> = 0, halfway between a<sub>1</sub> and a<sub>2</sub>`, mc: MC.fracIdx, say: 'There is no term 1.5: only whole term numbers.' },
  ]);
};

// =====================================================================================================================
// 2 ratio-whole
// =====================================================================================================================
const findR: Gen = (R, n) => {
  const rr = pick(R, R_WHOLE), r = qi(rr), cnt = rr === 10 ? 4 : 5, a1 = qi(int(R, 1, rr >= 5 ? 5 : 9)), vs = terms(a1, r, cnt);
  const d = sub(vs[1]!, vs[0]!);
  return numItem({
    id: `findR-${n}`, family: 'findR', prompt: `${listH(vs)}, … How many times as large as the term before is each term? Give the common ratio <i>r</i>.`,
    board: `${listT(vs)},\\ \\dots`,
    solution: [`Divide each term by the one BEFORE it: ${vs.slice(1).map((v, i) => `${qH(v)} ÷ ${qH(vs[i]!)}`).join(', ')}.`, `Every quotient is ${rr}, so r = ${ans(rr)}.`],
    picture: { strip: stripOf(vs, { ell: true }), hold: ['hops'] },
  }, r, `Right: each term is ${rr} times the one before.`, [
    [d, MC.addFactor, `${qH(d)} is the DIFFERENCE of the first two terms. The ratio asks "how many times as large": divide.`],
    [q(1, rr), MC.inverted, `That is earlier ÷ later. r = later ÷ earlier: ${qH(vs[1]!)} ÷ ${qH(vs[0]!)}.`],
  ], `Divide a term by the one before it: ${qH(vs[1]!)} ÷ ${qH(vs[0]!)}.`);
};
const ratioCheck: Gen = (R, n) => {
  const rr = pick(R, [2, 3, 4, 5]), brk = R() < 0.45, a1 = int(R, 1, 6);
  const vs = terms(qi(a1), qi(rr), 5);
  if (brk) { let off = 0; while (off === 0) off = int(R, -4, 4); vs[4] = qi(val(vs[4]!) + off); }
  if (fitCols(vs, false, 5, false) < 5) return ratioCheck(R, n);   // the breaking last term must be drawn
  const RT = ratios(vs) as Q[];
  const opts: Opt[] = [
    { t: `Geometric, with common ratio ${rr}`, ok: !brk, mc: brk ? MC.firstRows : undefined, say: brk ? `The first ratios are ${rr}, but check the LAST: ${qH(vs[4]!)} ÷ ${qH(vs[3]!)} = ${qH(RT[3]!)}. Every ratio must match.` : `Right: every ratio is ${rr}.` },
    { t: 'Not geometric: the ratios are not all equal', ok: brk, say: brk ? `Right: the last ratio is ${qH(RT[3]!)}, not ${rr}.` : `Check them all: every ratio is ${rr}.` },
    { t: `Geometric, with common ratio ${fr(1, rr)}`, mc: MC.inverted, say: `r is later ÷ earlier: ${qH(vs[1]!)} ÷ ${qH(vs[0]!)} = ${rr}.` },
    { t: `Arithmetic, with common difference ${qH(sub(vs[1]!, vs[0]!))}`, mc: MC.addFactor, say: `The differences are ${diffs(vs).map(x => qH(x)).join(', ')}: not equal, so not arithmetic.` },
  ];
  return choice(R, {
    id: `ratioCheck-${n}`, family: 'ratioCheck', prompt: `Is ${listH(vs)} consistent with a geometric sequence? Check every ratio.`, board: listT(vs),
    solution: [`Ratios, later ÷ earlier: ${RT.map(x => qH(x)).join(', ')}.`, brk ? 'Not all equal: not geometric, even though the first ones match.' : `All equal: geometric with r = ${rr}.`],
    picture: { strip: { ns: [1, 2, 3, 4, 5], vals: vs, ell: false }, hold: ['hops'], hot: brk ? [3] : undefined },
  }, opts);
};

// =====================================================================================================================
// 3 classify-arith-geo
// =====================================================================================================================
const KINDS = ['Arithmetic only', 'Geometric only', 'Both arithmetic and geometric', 'Neither'] as const;
const classify: Gen = (R, n) => {
  const t = int(R, 0, 5);
  let vs: Q[], right: number, why: string[];
  const a = int(R, 1, 9);
  if (t === 0) { const d = nz(R, -6, 9); vs = Array.from({ length: 5 }, (_, i) => qi(a + d * i)); right = 0; }
  else if (t === 1) { const r = pick(R, [qi(2), qi(3), q(1, 2), qi(-2)]); vs = terms(startFor(R, r, 5, 1, 4), r, 5); right = 1; }
  else if (t === 2) { vs = Array.from({ length: 5 }, () => qi(a)); right = 2; }
  else if (t === 3) { const c = int(R, 0, 3); vs = Array.from({ length: 5 }, (_, i) => qi((i + 1) ** 2 + c)); right = 3; }
  else if (t === 4) { const d = int(R, 2, 5), s = d * int(R, 1, 2); vs = Array.from({ length: 5 }, (_, i) => qi(s - d * i)); right = 0; }   // reaches 0
  else { vs = [qi(a), qi(2 * a), qi(4 * a), qi(7 * a), qi(11 * a)]; right = 3; }
  const D = diffs(vs), RT = ratios(vs);
  const dEq = D.every(x => eq(x, D[0]!)), hasZero = vs.some(v => v.n === 0), rEq = !hasZero && RT.every(x => x && eq(x, RT[0]!));
  if ((dEq && rEq ? 2 : dEq ? 0 : rEq ? 1 : 3) !== right) throw new Error('classify: wrong kind');
  why = [`Differences: ${D.map(x => (x.n < 0 ? qH(x) : '+' + qH(x))).join(', ')}${dEq ? ' (all equal)' : ' (not equal)'}.`,
    hasZero ? 'It contains a 0 term, so it is outside the ratio test (a ratio with 0 underneath has no value): not geometric.' : `Ratios: ${RT.map(x => '×' + facH(x!)).join(', ')}${rEq ? ' (all equal)' : ' (not equal)'}.`];
  const mcOf = (i: number): string | undefined => {
    if (right === 2 && i !== 3) return MC.exclusive;
    if (right === 3 && i === 1) return MC.shape;
    return undefined;
  };
  return choice(R, {
    id: `classify-${n}`, family: 'classify', prompt: `${listH(vs)}, … Arithmetic, geometric, both, or neither? Check differences AND ratios.`, board: `${listT(vs)},\\ \\dots`,
    solution: why, picture: { strip: { ...stripOf(vs, { ell: false, max: 5, adds: true })! }, hold: ['hops', 'adds'] },
  }, KINDS.map((k, i) => ({ t: k, ok: i === right, mc: i === right ? undefined : mcOf(i), say: i === right ? `Right. ${why.join(' ')}` : why.join(' ') })));
};
const whichGeo: Gen = (R, n) => {
  const r = int(R, 2, 4), a = int(R, 1, 5);
  const G = terms(qi(a), qi(r), 4), d = a * (r - 1);
  const Ar = [a, a * r, a * r + d, a * r + 2 * d].map(qi);
  const Sq = [1, 4, 9, 16].map(k => qi(a * k));
  const Al = [a, a * r, a * r * r, a * r * r * r + a].map(qi);
  return choice(R, {
    id: `whichGeo-${n}`, family: 'whichGeo', prompt: 'Which list is geometric (the same ratio between every pair of neighbours)?', board: `${a},\\ ${a * r},\\ \\dots\\ ?`,
    solution: [`Divide each term by the one before. Only ${listH(G)} gives ×${r} every time.`],
  }, [
    { t: listH(G), ok: true, say: `Right: ×${r}, ×${r}, ×${r}.` },
    { t: listH(Ar), mc: MC.addFactor, say: `That adds ${d} each time (+${d}, +${d}, +${d}): arithmetic, not ×${r}.` },
    { t: listH(Sq), mc: MC.shape, say: `It curves upward, but the ratios are ×4, ×9/4, ×16/9: not equal.` },
    { t: listH(Al), mc: MC.firstRows, say: `The first ratios are ×${r}, but the last one is not: check EVERY pair.` },
  ]);
};

// =====================================================================================================================
// 4 ratio-fraction
// =====================================================================================================================
const findRfrac: Gen = (R, n) => {
  const r = pick(R, R_FRAC), cnt = r.d >= 4 ? 4 : 5, a1 = startFor(R, r, cnt, 1, r.d >= 3 ? 2 : 4), vs = terms(a1, r, cnt);
  const diff = sub(vs[0]!, vs[1]!);
  const inv = div(qi(1), r);
  return fracItem({
    id: `findRfrac-${n}`, family: 'findRfrac', prompt: `${listH(vs)}, … What is the common ratio <i>r</i>? Write it as a fraction (the multiplier from each term to the next).`,
    board: `${listT(vs)},\\ \\dots`,
    solution: [`r = later ÷ earlier: ${qH(vs[1]!)} ÷ ${qH(vs[0]!)} = ${qH(r)}; check ${qH(vs[2]!)} ÷ ${qH(vs[1]!)} = ${qH(r)}.`, `Every term is ${qH(r)} of the one before: r = ${ans(qH(r))}.`],
    picture: { strip: stripOf(vs, { ell: true }), hold: ['hops'] },
  }, r, `Right: ×${qH(r)} each time.`, [
    [inv, MC.inverted, `That is earlier ÷ later. The multiplier goes FROM a term TO the next: ${qH(vs[1]!)} ÷ ${qH(vs[0]!)}.`],
    [diff.n > 0 ? diff : qi(-1), MC.addFactor, `${qH(diff)} is how much it drops first. The ratio is a multiplier: divide.`],
  ], `Divide the second term by the first: ${qH(vs[1]!)} ÷ ${qH(vs[0]!)}, then simplify.`);
};
const DEC_CASES: [number, number][] = [[0.8, 100], [0.8, 500], [0.5, 64], [0.25, 256], [1.5, 16], [1.2, 25], [0.9, 1000], [1.5, 32], [0.6, 625]];
const findRdec: Gen = (R, n) => {
  const [rv, s] = pick(R, DEC_CASES), r = q(rv), m = rv === 0.9 || rv === 0.6 ? 1 : pick(R, [1, 2, 3]), vs = terms(qi(s * m), r, 4);
  const inv = div(qi(1), r), dd = sub(vs[1]!, vs[0]!);
  const cands: [Q | number, string | undefined, string][] = [
    [inv, MC.inverted, `That is earlier ÷ later. r = ${qH(vs[1]!, true)} ÷ ${qH(vs[0]!, true)}.`],
    [dd, MC.addFactor, `${qH(dd, true)} is the first change. The ratio is a multiplier: divide.`],
  ];
  if (rv < 1) cands.push([q(1 - rv), MC.factorRate, `${qH(q(1 - rv), true)} is the fraction LOST each time. The multiplier is what is KEPT: ${qH(r, true)}.`]);
  else cands.push([q(rv - 1), MC.factorRate, `${qH(q(rv - 1), true)} is the growth rate. The multiplier is 1 + that: ${qH(r, true)}.`]);
  return numItem({
    id: `findRdec-${n}`, family: 'findRdec', prompt: `${listH(vs, true)}, … What is the common ratio <i>r</i>, as a decimal?`, board: `${listT(vs, true)},\\ \\dots`,
    solution: [`r = later ÷ earlier: ${qH(vs[1]!, true)} ÷ ${qH(vs[0]!, true)} = ${qH(r, true)}.`, `Check: ${qH(vs[2]!, true)} ÷ ${qH(vs[1]!, true)} = ${qH(r, true)} too. r = ${ans(qH(r, true))}.`],
    picture: { strip: stripOf(vs, { ell: true, dec: true }), hold: ['hops'] },
  }, r, `Right: ×${qH(r, true)} each time.`, cands, `Divide: ${qH(vs[1]!, true)} ÷ ${qH(vs[0]!, true)}.`);
};

// =====================================================================================================================
// 5 ratio-negative
// =====================================================================================================================
const findRneg: Gen = (R, n) => {
  const r = pick(R, R_NEG), a1 = anyStart(R, r, 5, 0.4), vs = terms(a1, r, 5);
  const dec = r.d !== 1;
  return numItem({
    id: `findRneg-${n}`, family: 'findRneg', prompt: `${listH(vs)}, … What is the common ratio <i>r</i>?${dec ? ' (Type it as a decimal.)' : ''}`, board: `${listT(vs)},\\ \\dots`,
    solution: [`r = later ÷ earlier, sign included: ${qH(vs[1]!)} ÷ ${facH(vs[0]!)} = ${qH(r, true)}.`, `The signs flip every step, so r is negative: r = ${ans(qH(r, true))}.`],
    picture: { strip: stripOf(vs, { ell: true }), hold: ['hops'] },
  }, r, `Right: ×${facH(r, true)} each time; the signs alternate.`, [
    [neg(r), MC.negSign, `The size is right, but the signs alternate: r is negative.`],
    [div(qi(1), r), MC.inverted, `That is earlier ÷ later. Divide a term by the one BEFORE it.`],
  ], `Divide: ${qH(vs[1]!)} ÷ ${facH(vs[0]!)}. Keep the sign.`);
};
const signCause: Gen = (R, n) => {
  const alt = R() < 0.5;
  const m = pick(R, [2, 3, 4]), r = alt ? qi(-m) : qi(m);
  const a1 = alt ? qi(int(R, 1, 6) * (R() < 0.5 ? -1 : 1)) : qi(-int(R, 1, 6));
  const vs = terms(a1, r, 4);
  const opts: Opt[] = [
    { t: `r = ${qH(r)}`, ok: true, say: alt ? 'Right: the signs flip each step, so r is negative.' : 'Right: every term keeps its sign, so r is positive, even though the terms are negative.' },
    { t: `r = ${qH(neg(r))}`, mc: alt ? MC.negSign : MC.negFirst, say: alt ? 'The signs alternate: that needs a negative r.' : `Negative terms do not mean a negative r: ${qH(vs[1]!)} ÷ (${qH(vs[0]!)}) = ${m}.` },
    { t: `r = ${qH(div(qi(1), r))}`, mc: MC.inverted, say: 'That is earlier ÷ later. Divide each term by the one before it.' },
  ];
  if (alt) opts.push({ t: 'There is no common ratio: a geometric ratio must be positive', mc: MC.mustPos, say: `Every ratio is ${qH(r)}: the same each time, so it is geometric with a negative ratio.` });
  else opts.push({ t: 'There is no common ratio: the terms are negative', say: `Every ratio is ${m}: the same each time.` });
  return choice(R, {
    id: `signCause-${n}`, family: 'signCause', prompt: `${listH(vs)}, … What is its common ratio?`, board: `${listT(vs)},\\ \\dots`,
    solution: [`Divide each term by the one before, signs included: ${vs.slice(1).map((v, i) => `${qH(v)} ÷ ${facH(vs[i]!)} = ${qH(r)}`).join('; ')}.`],
    picture: { strip: stripOf(vs, { ell: true }), hold: ['hops'] },
  }, opts);
};

// =====================================================================================================================
// 6 notation-evaluate
// =====================================================================================================================
interface Rule { tex: string; html: string; f: (n: number) => number; lo: number }
function pickRule(R: () => number): Rule {
  const t = int(R, 0, 2);
  if (t === 0) { const p = int(R, 2, 6), c = int(R, 1, 9); return { tex: `${p}n - ${c}`, html: `${p}${nI} − ${c}`, f: k => p * k - c, lo: 1 }; }
  if (t === 1) { const c = int(R, 0, 5); return c ? { tex: `n^2 + ${c}`, html: `${nI}<sup>2</sup> + ${c}`, f: k => k * k + c, lo: 0 } : { tex: 'n^2', html: `${nI}<sup>2</sup>`, f: k => k * k, lo: 0 }; }
  const p = int(R, 2, 5), c = int(R, 1, 9); return { tex: `${p}n + ${c}`, html: `${p}${nI} + ${c}`, f: k => p * k + c, lo: 0 };
}
const fEval: Gen = (R, n) => {
  const rule = pickRule(R), fn = R() < 0.5, k = pick(R, rule.lo === 0 ? [0, 1, 4, 10] : [1, 4, 10]);
  const N = fn ? F : A, v = rule.f(k);
  const cands: [number, string | undefined, string][] = [];
  if (rule.tex.startsWith('n^2')) cands.push([2 * k + (rule.f(0)), MC.powTimes, `n² means n · n, not 2 · n: ${k} · ${k} = ${k * k}.`]);
  cands.push([rule.f(k + 1), undefined, `That is the output at ${k + 1}. Put in exactly n = ${k}.`]);
  return numItem({
    id: `fEval-${n}`, family: 'fEval', prompt: `${atH(N, 'n')} = ${rule.html} for <i>n</i> ≥ ${rule.lo}. What is ${atH(N, k)}?`, board: `${atT(N, 'n')} = ${rule.tex};\\ \\ ${atT(N, k)} = \\,?`,
    solution: [`${atH(N, k)} is the output when the input is n = ${k}: put ${k} in for every n.`, `${rule.html.replace(/<i>n<\/i>/g, `(${k})`)} = ${ans(v)}.`],
  }, qi(v), `Right: ${atH(N, k)} = ${v}.`, cands, `Replace n by ${k} and work it out.`);
};
const shiftNote: Gen = (R, n) => {
  const t = int(R, 0, 2);
  const f: (k: number) => number = t === 0 ? (k => 3 * 2 ** (k - 1)) : t === 1 ? (k => k * k + 1) : (k => 4 * k + 3);
  const vs = [1, 2, 3, 4, 5, 6].map(k => qi(f(k)));
  const k = int(R, 2, 5), fwd = R() < 0.5, fn = R() < 0.5, N = fn ? F : A;
  const pic = { strip: { ...stripOf(vs, { hops: false, ell: false, max: 6 })!, name: fn ? 'f(n)' : undefined } };
  if (fwd) {
    const right = f(k + 1), wrong = f(k) + 1;
    return choice(R, {
      id: `shiftNote-${n}`, family: 'shiftNote', prompt: `The table shows ${fn ? '<i>f</i>' : 'a sequence a<sub>n</sub>'}. When <i>n</i> = ${k}, what is ${atH(N, 'n+1')}?`, board: `${atT(N, 'n+1')}\\ \\text{at}\\ n = ${k}`,
      solution: [`${atH(N, 'n+1')} is the output at the NEXT input: n + 1 = ${k + 1}.`, `${atH(N, k + 1)} = ${ans(right)}.`], picture: pic,
    }, [
      { t: String(right), ok: true, say: `Right: ${atH(N, k + 1)} = ${right}.` },
      { t: String(wrong), mc: MC.shiftAdd, say: `That is ${atH(N, k)} + 1. The +1 is inside: it moves to the next INPUT.` },
      { t: String(f(k)), say: `That is ${atH(N, k)}. Move one input to the right.` },
    ]);
  }
  const right = f(k - 1), wrong = f(k) - 1;
  return choice(R, {
    id: `shiftNote-${n}`, family: 'shiftNote', prompt: `The table shows ${fn ? '<i>f</i>' : 'a sequence a<sub>n</sub>'}. When <i>n</i> = ${k}, what is ${atH(N, 'n-1')}?`, board: `${atT(N, 'n-1')}\\ \\text{at}\\ n = ${k}`,
    solution: [`${atH(N, 'n-1')} is the term one place BEFORE: input n − 1 = ${k - 1}.`, `${atH(N, k - 1)} = ${ans(right)}.`], picture: pic,
  }, [
    { t: String(right), ok: true, say: `Right: ${atH(N, k - 1)} = ${right}.` },
    { t: String(wrong), mc: MC.subMis, say: `That is ${atH(N, k)} − 1. The −1 sits in the input: one place back.` },
    { t: String(f(k)), say: `That is ${atH(N, k)}. Go one place back.` },
  ]);
};

// =====================================================================================================================
// 7 recursive-generate
// =====================================================================================================================
const recNext: Gen = (R, n) => {
  const r = anyR(R), k = int(R, 3, r.d === 1 ? 5 : 4), a1 = anyStart(R, r, k), fn = R() < 0.35, N = fn ? F : A;
  const vs = terms(a1, r, k), v = vs[k - 1]!;
  return numItem({
    id: `recNext-${n}`, family: 'recNext', prompt: `${recH({ N, n0: 1, seed: a1, r })}. What is ${atH(N, k)}?`, board: recT({ N, n0: 1, seed: a1, r }),
    solution: [`Start at ${atH(N, 1)} = ${qH(a1)}; each term is ${facH(r)} times the term before.`, `${listH(vs)}: ${atH(N, k)} = ${ans(qH(v))}.`],
    picture: { strip: { ...stripHidden(vs, 1, { r, name: fn ? 'f(n)' : undefined, max: k })!, hops: true } },
  }, v, `Right: ${listH(vs)}.`, [
    [mul(r, qi(k - 1)), MC.curIdx, `That puts the NUMBER ${k - 1} where the previous TERM goes. ${atH(N, 'n-1')} is the term before.`],
    [term(a1, r, k + 1), MC.nSteps, `That is ${k} multiplications. From term 1 to term ${k} there are ${k - 1}.`],
    [vs[k - 2]!, undefined, `That is ${atH(N, k - 1)}. One more step.`],
  ], `Write the terms one after another: ${qH(a1)}, then ${qH(a1)} · ${facH(r)}, …`);
};
const recList: Gen = (R, n) => {
  const r = qi(pick(R, [2, 3, 4, -2, -3])), c = qi(nz(R, -5, 6));
  if (eq(c, qi(1)) || eq(c, r)) return recList(R, n);
  const G = terms(c, r, 4), Ad = [0, 1, 2, 3].map(i => qi(val(c) + i * val(r))), Cu = [c, ...[1, 2, 3].map(i => qi(val(r) * i))], Sh = terms(mul(c, r), r, 4);
  return choice(R, {
    id: `recList-${n}`, family: 'recList', prompt: `${recH({ N: A, n0: 1, seed: c, r })}. Which list does it make (a<sub>1</sub> to a<sub>4</sub>)?`, board: recT({ N: A, n0: 1, seed: c, r }),
    solution: [`a<sub>1</sub> = ${qH(c)}. Then a<sub>2</sub> = ${facH(r)} · a<sub>1</sub>, a<sub>3</sub> = ${facH(r)} · a<sub>2</sub>, …`, `${listH(G)}.`],
    picture: { strip: { ...stripHidden(G, 1, { r, max: 4 })! } },
  }, [
    { t: listH(G), ok: true, say: `Right: multiply by ${facH(r)} each step.` },
    { t: listH(Ad), mc: MC.addFactor, say: `That ADDS ${qH(r)} each step. The rule multiplies the term before by ${facH(r)}.` },
    { t: listH(Cu), mc: MC.curIdx, say: `That multiplies ${facH(r)} by the NUMBER n − 1. a<sub>n−1</sub> is the previous TERM.` },
    { t: listH(Sh), mc: MC.nSteps, say: `a<sub>1</sub> is ${qH(c)} itself, with no step yet.` },
  ]);
};

// =====================================================================================================================
// 8 recursive-write
// =====================================================================================================================
const recWrite: Gen = (R, n) => {
  const r = anyR(R), a1 = anyStart(R, r, 5), vs = terms(a1, r, 5), d = sub(vs[1]!, vs[0]!);
  const def = (x: Partial<Parameters<typeof recH>[0]>) => recH({ N: A, n0: 1, seed: a1, r, ...x });
  return choice(R, {
    id: `recWrite-${n}`, family: 'recWrite', prompt: `${listH(vs)}, … (from <i>n</i> = 1). Which is a complete recursive definition?`, board: `${listT(vs)},\\ \\dots`,
    solution: ['A complete recursive definition needs the first term AND the update with its range.', `a<sub>1</sub> = ${qH(a1)}; each term is ${facH(r)} times the term before, for n ≥ 2.`],
    picture: { strip: stripOf(vs, { ell: true }), hold: ['hops'] },
  }, [
    { t: def({}), ok: true, say: 'Right: a start, and the multiplier for every later term.' },
    { t: def({ noSeed: true }), mc: MC.noSeed, say: 'Without a<sub>1</sub> the rule could start anywhere: it needs the first term.' },
    { t: def({ r: div(qi(1), r) }), mc: MC.inverted, say: `That multiplier goes backward. Later ÷ earlier = ${qH(r)}.` },
    { t: `a<sub>1</sub> = ${qH(a1)}, a<sub>n</sub> = a<sub>n−1</sub> ${d.n < 0 ? '−' : '+'} ${qH(d.n < 0 ? neg(d) : d)} for ${nI} ≥ 2`, mc: MC.addFactor, say: `Adding ${qH(d)} only works for the first step. The steps multiply by ${facH(r)}.` },
  ]);
};
const STORIES: { make: (R: () => number) => { text: string; s: string; seed: Q; r: Q; unit: string } }[] = [
  { make: R => { const r = pick(R, [q(2, 3), q(3, 4), q(1, 2)]), h = r.d ** 3 * int(R, 1, 2); return { text: `A ball's first bounce reaches ${h} inches. Each bounce reaches ${qH(r)} of the height of the bounce before.`, s: 'h', seed: qi(h), r, unit: 'in' }; } },
  { make: R => { const c = int(R, 2, 5), m = int(R, 2, 4); return { text: `In round 1 of a phone tree, ${c} people get the call. In every later round, ${m} times as many people get it as in the round before.`, s: 'p', seed: qi(c), r: qi(m), unit: 'people' }; } },
  { make: R => { const t = pick(R, [64, 128, 32]); return { text: `Round 1 of a knockout tournament has ${t} teams. Each later round has half as many teams as the round before.`, s: 't', seed: qi(t), r: q(1, 2), unit: 'teams' }; } },
  { make: R => { const c = int(R, 2, 9) * 100, m = pick(R, [2, 3]); return { text: `A lab culture has ${c} cells at the first count. At each later count there are ${m} times as many cells as at the count before.`, s: 'c', seed: qi(c), r: qi(m), unit: 'cells' }; } },
];
const recFromStory: Gen = (R, n) => {
  const S = pick(R, STORIES).make(R), N = { s: S.s }, d = sub(mul(S.seed, S.r), S.seed);
  if (eq(S.seed, S.r)) return recFromStory(R, n);
  const def = (x: Partial<Parameters<typeof recH>[0]>) => recH({ N, n0: 1, seed: S.seed, r: S.r, ...x });
  return choice(R, {
    id: `recFromStory-${n}`, family: 'recFromStory', prompt: `${S.text} Let ${atH(N, 'n')} be the number for step <i>n</i> (n = 1 is the first). Which recursive definition fits?`, board: `${atT(N, 1)} = ${qT(S.seed)},\\ \\times ${facT(S.r)}`,
    solution: [`The first value is ${atH(N, 1)} = ${qH(S.seed)}; every later one is ${qH(S.r)} times the one before, for n ≥ 2.`],
  }, [
    { t: def({}), ok: true, say: 'Right: the first value and the multiplier.' },
    { t: def({ noSeed: true }), mc: MC.noSeed, say: `The rule alone does not say where to start: add ${atH(N, 1)} = ${qH(S.seed)}.` },
    { t: `${atH(N, 1)} = ${qH(S.seed)}, ${atH(N, 'n')} = ${atH(N, 'n-1')} ${d.n < 0 ? '−' : '+'} ${qH(d.n < 0 ? neg(d) : d)} for ${nI} ≥ 2`, mc: MC.addFactor, say: `The change is not the same amount each time; the FACTOR ${qH(S.r)} is.` },
    { t: recH({ N, n0: 1, seed: S.r, r: S.seed }), mc: MC.coefAsFactor, say: `The start and the multiplier are swapped: the start is ${qH(S.seed)}, the multiplier ${qH(S.r)}.` },
  ]);
};

// =====================================================================================================================
// 9 explicit-derive
// =====================================================================================================================
const countHops: Gen = (R, n) => {
  const r = qi(pick(R, [2, 3, 5, -2])), a1 = qi(int(R, 1, 9)), from = R() < 0.3 ? int(R, 2, 3) : 1, k = from === 1 ? int(R, 4, 12) : from + int(R, 2, 5);
  const vs = terms(a1, r, Math.min(k, 6));
  const steps = k - from;
  const prompt = from === 1
    ? `a<sub>1</sub> = ${qH(a1)} and every term is ${facH(r)} times the term before. Then a<sub>${k}</sub> = ${qH(a1)} · ${facH(r)}<sup>□</sup>. What goes in the box?`
    : `Every term is ${facH(r)} times the term before. How many times do you multiply by ${facH(r)} to get from a<sub>${from}</sub> to a<sub>${k}</sub>?`;
  return numItem({
    id: `countHops-${n}`, family: 'countHops', prompt, board: from === 1 ? `a_{${k}} = ${qT(a1)} \\cdot ${facT(r)}^{\\square}` : `a_{${from}} \\to a_{${k}}`,
    solution: [from === 1 ? `a<sub>1</sub> takes no step. Each later term is one more × ${facH(r)}: a<sub>2</sub> one, a<sub>3</sub> two, …` : `Each step to the next term is one × ${facH(r)}.`, `From term ${from} to term ${k}: ${k} − ${from} = ${ans(steps)} multiplications.`],
    picture: from > 1
      ? { strip: { ns: Array.from({ length: k - from + 1 }, (_, i) => from + i), vals: Array.from({ length: k - from + 1 }, () => null), r, ell: false }, count: steps }
      : k <= 6 && fitCols(vs, false, 6, false) >= k ? { strip: { ns: vs.map((_, i) => i + 1), vals: vs, ell: false }, count: steps } : { strip: farStrip(a1, r, k, { reveal: false }), count: 2 },
  }, qi(steps), `Right: ${pl(steps, 'step')} of × ${facH(r)}.`, [[steps + 1, MC.nSteps, `That counts the terms, not the steps between them. Term ${from} needs no multiplication.`]], `Count the hops from term ${from} to term ${k}, not the terms.`);
};
const deriveWhy: Gen = (R, n) => {
  const r = int(R, 2, 5), a1 = int(R, 2, 9), k = int(R, 3, 5);
  if (R() < 0.6) {
    const fac = (m: number) => Array(m).fill(String(r)).join(' · ');
    return choice(R, {
      id: `deriveWhy-${n}`, family: 'deriveWhy', prompt: `a<sub>1</sub> = ${a1} and each term is ${r} times the term before. Which product is a<sub>${k}</sub>?`, board: `a_{${k}} = \\,?`,
      solution: [`a<sub>1</sub> = ${a1} takes no step; a<sub>${k}</sub> is ${k - 1} steps of × ${r} later.`, `a<sub>${k}</sub> = ${a1} · ${fac(k - 1)} = ${a1} · ${r}<sup>${k - 1}</sup>.`],
    }, [
      { t: `${a1} · ${fac(k - 1)}`, ok: true, say: `Right: ${k - 1} factors of ${r}, the exponent n − 1.` },
      { t: `${a1} · ${fac(k)}`, mc: MC.nSteps, say: `That is ${k} factors: a<sub>1</sub> already has its value with none.` },
      { t: `${a1} · ${r} · ${k - 1}`, mc: MC.powTimes, say: `${r}<sup>${k - 1}</sup> is ${k - 1} factors of ${r}, not ${r} times ${k - 1}.` },
      { t: `${a1} + ${Array(k - 1).fill(String(r)).join(' + ')}`, mc: MC.addFactor, say: 'Each step MULTIPLIES by the ratio; it does not add it.' },
    ]);
  }
  return choice(R, {
    id: `deriveWhy-${n}`, family: 'deriveWhy', prompt: `Check the explicit formula a<sub>n</sub> = ${a1} · ${r}<sup>n−1</sup> at <i>n</i> = 1. What does it give, and why?`, board: `a_1 = ${a1} \\cdot ${r}^{1-1}`,
    solution: [`At n = 1 the exponent is 1 − 1 = 0: no steps taken yet.`, `${r}<sup>0</sup> = 1, so a<sub>1</sub> = ${a1} · 1 = ${a1}, the first term.`],
  }, [
    { t: `${a1}, because ${r}<sup>0</sup> = 1: the first term takes no steps`, ok: true, say: 'Right: r⁰ = 1 for any r that is not 0.' },
    { t: `0, because ${r}<sup>0</sup> = 0`, say: `${r}<sup>0</sup> is 1, not 0: zero factors of ${r} leave the number 1.` },
    { t: `${a1 * r}, because the first term already has one factor ${r}`, mc: MC.nSteps, say: `The first term has no factor ${r} yet; that would be a<sub>2</sub>.` },
  ]);
};

// =====================================================================================================================
// 10 explicit-evaluate
// =====================================================================================================================
const evalTerm: Gen = (R, n) => {
  for (;;) {
    const neg0 = R() < 0.45, rr = neg0 ? -int(R, 2, 3) : int(R, 2, 4), c = int(R, 1, 9) * (R() < 0.2 ? -1 : 1), k = int(R, 1, 8);
    const r = qi(rr), a1 = qi(c), v = term(a1, r, k);
    if (Math.abs(val(v)) > 50000 || k === 1 && R() < 0.7) continue;
    const cands: [Q | number, string | undefined, string][] = [
      [c * rr * (k - 1), MC.powTimes, `${facH(r)}<sup>${k - 1}</sup> is ${k - 1} factors of ${facH(r)}, not ${facH(r)} × ${k - 1}.`],
      [pow(qi(c * rr), k - 1), MC.beyondBase, `The exponent belongs to ${facH(r)} only: work out ${facH(r)}<sup>${k - 1}</sup> first, then multiply by ${c < 0 ? `(${qH(a1)})` : c}.`],
      [term(a1, r, k + 1), MC.nSteps, `The exponent is n − 1 = ${k - 1}, not ${k}.`],
    ];
    if (rr < 0 && (k - 1) % 2 === 0 && k > 1) cands.unshift([neg(v), MC.evenNeg, `${k - 1} is even: an even number of negative factors is POSITIVE.`]);
    return numItem({
      id: `evalTerm-${n}`, family: 'evalTerm', prompt: `a<sub>n</sub> = ${expH(a1, r)}. What is a<sub>${k}</sub>?`, board: `a_n = ${expT(a1, r)};\\ \\ a_{${k}} = \\,?`,
      solution: [`Put n = ${k}: the exponent is ${k} − 1 = ${k - 1}.`, `${facH(r)}<sup>${k - 1}</sup> = ${qH(pow(r, k - 1))}, so a<sub>${k}</sub> = ${c < 0 ? `(${qH(a1)})` : c} · ${facH(pow(r, k - 1))} = ${ans(qH(v))}.`],
      picture: { strip: farStrip(a1, r, k, { reveal: true }), count: true },
    }, v, `Right: a<sub>${k}</sub> = ${qH(v)}.`, cands, `Work out ${facH(r)}<sup>${k - 1}</sup> first, then multiply by ${qH(a1)}.`);
  }
};
const evalFrac: Gen = (R, n) => {
  const r = pick(R, [q(1, 2), q(2, 3), q(3, 2), q(3, 4), q(1, 3)]), k = int(R, 2, 6);
  const c = qi(int(R, 1, 4) * r.d ** int(R, Math.max(0, k - 3), k - 1));
  const v = term(c, r, k);
  if (val(c) > 3000 || v.n > 5000) return evalFrac(R, n);
  return fracItem({
    id: `evalFrac-${n}`, family: 'evalFrac', prompt: `a<sub>n</sub> = ${expH(c, r)}. What is a<sub>${k}</sub>? (A fraction or a whole number.)`, board: `a_n = ${expT(c, r)};\\ \\ a_{${k}} = \\,?`,
    solution: [`n = ${k}: the exponent is ${k - 1}. (${qH(r)})<sup>${k - 1}</sup> = ${qH(pow(r, k - 1))}.`, `${qH(c)} · ${qH(pow(r, k - 1))} = ${ans(qH(v))}.`],
    picture: { strip: stripHidden(terms(c, r, k), 1, { r, max: k }), count: true },
  }, v, `Right: a<sub>${k}</sub> = ${qH(v)}.`, [
    [term(c, r, k + 1), MC.nSteps, `The exponent is n − 1 = ${k - 1}, not ${k}.`],
    [pow(mul(c, r), k - 1), MC.beyondBase, `The exponent belongs to (${qH(r)}) only, not to ${qH(c)} · ${qH(r)}.`],
  ], `Raise ${qH(r)} to the power ${k - 1} first, then multiply by ${qH(c)}.`);
};

// =====================================================================================================================
// 11 explicit-write
// =====================================================================================================================
const PAIR_R: Q[] = [qi(2), qi(3), qi(4), qi(-2), qi(-3), q(1, 2), q(-1, 2), q(3, 2), q(1, 4)];
const writeExp: Gen = (R, n) => {
  const r = pick(R, PAIR_R), a1 = anyStart(R, r, 5, 0.3);
  if (eq(a1, r)) return writeExp(R, n);
  const vs = terms(a1, r, 5), dec = r.d !== 1;
  return pairItem({
    id: `writeExp-${n}`, family: 'writeExp', prompt: `${listH(vs)}, … (from <i>n</i> = 1). Fill in its explicit formula a<sub>n</sub> = □ · (□)<sup>n−1</sup>.${dec ? ' (Type decimals.)' : ''}`,
    board: `${listT(vs)},\\ \\dots`,
    solution: [`The first box is a<sub>1</sub> = ${qH(a1)}; the second is r = ${qH(vs[1]!)} ÷ ${facH(vs[0]!)} = ${qH(r, true)}.`, `a<sub>n</sub> = ${ans(qH(a1))} · (${ans(qH(r, true))})<sup>n−1</sup>. Check n = 2: ${qH(a1)} · ${facH(r, true)} = ${qH(vs[1]!)} ✓.`],
    picture: { strip: stripOf(vs, { ell: true }), hold: ['hops'] },
  }, a1, r, { lead: `${aN} =`, op: '· (', tail: `)<sup>n−1</sup>` }, `Right: a<sub>n</sub> = ${expH(a1, r, 1, true)}.`, [
    [r, a1, MC.coefAsFactor, `The boxes are swapped: the first term goes in front, the ratio is the base.`],
    [a1, div(qi(1), r), MC.inverted, `The base is later ÷ earlier: ${qH(vs[1]!)} ÷ ${facH(vs[0]!)}.`],
    [vs[1]!, r, MC.firstAsIcpt, `With the exponent n − 1 the front number is a<sub>1</sub> = ${qH(a1)}, the first term itself.`],
  ], 'The front number is the first term, the base is the common ratio.');
};
const expFromTable: Gen = (R, n) => {
  const r = pick(R, [...R_FRAC, qi(-2), qi(-3), q(-1, 2)]), a1 = anyStart(R, r, 4, 0.2);
  if (eq(a1, r) || eq(a1, qi(1))) return expFromTable(R, n);
  const vs = terms(a1, r, 4);
  return choice(R, {
    id: `expFromTable-${n}`, family: 'expFromTable', prompt: `The table shows a<sub>1</sub> to a<sub>4</sub>. Which explicit formula fits?`, board: `${listT(vs)},\\ \\dots`,
    solution: [`a<sub>1</sub> = ${qH(a1)}, r = ${qH(vs[1]!)} ÷ ${facH(vs[0]!)} = ${qH(r)}.`, `a<sub>n</sub> = ${expH(a1, r)}. Check n = 1: ${qH(a1)} ✓; n = 2: ${qH(vs[1]!)} ✓.`],
    picture: { strip: stripOf(vs, { ell: false, max: 4 }), hold: ['hops'] },
  }, [
    { t: `a<sub>n</sub> = ${expH(a1, r)}`, ok: true, say: 'Right: it gives a₁ at n = 1 and multiplies by r each step.' },
    { t: `a<sub>n</sub> = ${expH(a1, r, 0)}`, mc: MC.firstAsIcpt, say: `Check n = 1: that gives ${qH(mul(a1, r))}, not ${qH(a1)}. With n ≥ 1 the exponent is n − 1.` },
    { t: `a<sub>n</sub> = ${expH(r, a1)}`, mc: MC.coefAsFactor, say: `The start and the base are swapped: the start is ${qH(a1)}, the ratio is ${qH(r)}.` },
    { t: `a<sub>n</sub> = ${expH(a1, div(qi(1), r))}`, mc: MC.inverted, say: `The base is later ÷ earlier = ${qH(r)}.` },
  ]);
};

// =====================================================================================================================
// 12 translate-forms
// =====================================================================================================================
const recToExp: Gen = (R, n) => {
  const r = anyR(R), a1 = anyStart(R, r, 3, 0.25);
  if (eq(a1, r) || eq(a1, qi(1))) return recToExp(R, n);
  const d = sub(mul(a1, r), a1);
  const def = { N: A, n0: 1, seed: a1, r };
  return choice(R, {
    id: `recToExp-${n}`, family: 'recToExp', prompt: `${recH(def)}. Which explicit formula gives the same sequence?`, board: recT(def),
    solution: [`The first term a<sub>1</sub> = ${qH(a1)} becomes the front number; the multiplier ${qH(r)} becomes the base.`, `Term n is n − 1 steps after a<sub>1</sub>: a<sub>n</sub> = ${expH(a1, r)}.`],
  }, [
    { t: `a<sub>n</sub> = ${expH(a1, r)}`, ok: true, say: 'Right: first term in front, multiplier as the base, n − 1 steps.' },
    { t: `a<sub>n</sub> = ${expH(a1, r, 0)}`, mc: MC.shift1, say: `At n = 1 that gives ${qH(mul(a1, r))}: one step too many. Term n is n − 1 steps after a<sub>1</sub>.` },
    { t: `a<sub>n</sub> = ${expH(r, a1)}`, mc: MC.coefAsFactor, say: 'The start goes in front; the multiplier is the base.' },
    { t: `a<sub>n</sub> = ${qH(a1)} ${d.n < 0 ? '−' : '+'} ${qH(d.n < 0 ? neg(d) : d)}(${nI} − 1)`, mc: MC.addFactor, say: 'That adds the same amount each step. This rule multiplies.' },
  ]);
};
const expToRec: Gen = (R, n) => {
  const r = anyR(R), a1 = anyStart(R, r, 3, 0.25);
  if (eq(a1, r)) return expToRec(R, n);
  const d = sub(mul(a1, r), a1);
  const def = (x: Partial<Parameters<typeof recH>[0]>) => recH({ N: A, n0: 1, seed: a1, r, ...x });
  return choice(R, {
    id: `expToRec-${n}`, family: 'expToRec', prompt: `a<sub>n</sub> = ${expH(a1, r)} for <i>n</i> ≥ 1. Which recursive definition gives the same sequence?`, board: `a_n = ${expT(a1, r)}`,
    solution: [`n = 1: a<sub>1</sub> = ${qH(a1)} · ${facH(r)}<sup>0</sup> = ${qH(a1)}.`, `Each step raises the power by one, so each term is ${facH(r)} times the term before.`, `${def({})}.`],
  }, [
    { t: def({}), ok: true, say: 'Right: the front number is the first term, the base is the multiplier.' },
    { t: recH({ N: A, n0: 1, seed: r, r: a1 }), mc: MC.coefAsFactor, say: `Swapped: a<sub>1</sub> is the front number ${qH(a1)}, the multiplier is the base ${qH(r)}.` },
    { t: def({ seed: mul(a1, r) }), mc: MC.shift1, say: `a<sub>1</sub> = ${qH(a1)} · ${facH(r)}<sup>0</sup> = ${qH(a1)}, not ${qH(mul(a1, r))}.` },
    { t: `a<sub>1</sub> = ${qH(a1)}, a<sub>n</sub> = a<sub>n−1</sub> ${d.n < 0 ? '−' : '+'} ${qH(d.n < 0 ? neg(d) : d)} for ${nI} ≥ 2`, mc: MC.addFactor, say: 'The terms do not change by the same amount; they change by the same factor.' },
  ]);
};

export const FAM1: Record<string, Gen> = {
  termRead, indexDomain, findR, ratioCheck, classify, whichGeo, findRfrac, findRdec, findRneg, signCause, fEval, shiftNote,
  recNext, recList, recWrite, recFromStory, countHops, deriveWhy, evalTerm, evalFrac, writeExp, expFromTable, recToExp, expToRec,
};
export type { QItem };
void val;
