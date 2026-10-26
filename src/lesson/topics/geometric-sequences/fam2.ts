// fam2.ts: practice families of the extension and stage 3 of geometric-sequences (sub-goals 13-23: terms far apart,
// zero-based index, relabel vs rewrite, percent factors, context models, thresholds, model type, the proof that the
// two forms agree, and repairing a model). Every wrong answer a family recognises carries a misconception id.
import { ans } from '../../runtime/explain';
import {
  type Q, A, decStr, div, eq, expH, expT, facH, mul, neg, pow, q, qH, qi, qT, sub, term, terms, val,
} from './geo';
import { type Gen, type Opt, MC, choice, int, nI, numItem, numP, nz, pick, stripHidden, stripOf, usd } from './common';

const sgn = (v: Q) => (v.n < 0 ? '−' : '+');
const abs = (v: Q) => (v.n < 0 ? neg(v) : v);
/** a ratio in a story, as a percent statement: 1.05 → "5%", 0.85 → "15%" */
const pct = (p: Q) => `${numP(mul(p, qi(100)))}%`;

// =====================================================================================================================
// 13 nonadjacent-ratio (optional extension)
// =====================================================================================================================
const gapRatio: Gen = (R, n) => {
  for (;;) {
    const s = int(R, 2, 5), c = nz(R, -6, 6), i = int(R, 1, 4), noReal = R() < 0.22;
    const ai = qi(c), aj = qi(noReal ? -c * s * s : c * s * s), half = div(sub(aj, ai), qi(2));
    if ([s, -s, s * s, -s * s].some(x => eq(half, qi(x)))) continue;
    const head = `In a geometric sequence, a<sub>${i}</sub> = ${qH(ai)} and a<sub>${i + 2}</sub> = ${qH(aj)}. Which common ratios are possible (real numbers)?`;
    const sol = [`Two steps apart: a<sub>${i + 2}</sub> = a<sub>${i}</sub> · r<sup>2</sup>, so r<sup>2</sup> = ${qH(aj)} ÷ ${facH(ai)} = ${qH(div(aj, ai))}.`,
      noReal ? 'A square of a real number is never negative: no real r works.' : `Both ${s} and −${s} square to ${s * s}.`];
    const opts: Opt[] = noReal ? [
      { t: 'No real common ratio: r<sup>2</sup> would be negative', ok: true, say: `Right: r² = ${qH(div(aj, ai))} has no real solution.` },
      { t: `r = ${s} or r = −${s}`, say: `Check: (±${s})² = ${s * s}, but the ratio over two steps is −${s * s}.` },
      { t: `r = −${s * s}`, mc: MC.gapRatio, say: `−${s * s} is the change over TWO steps, r². Each single step is r.` },
      { t: `r = ${qH(half)}`, mc: MC.diffAsRatio, say: 'Subtracting and dividing by the gap is how arithmetic sequences work. Here the terms multiply.' },
    ] : [
      { t: `r = ${s} or r = −${s}`, ok: true, say: `Right: r² = ${s * s}, so r = ${s} or −${s}.` },
      { t: `r = ${s} only`, mc: MC.dropNegRoot, say: `(−${s})² = ${s * s} too: the negative ratio also works.` },
      { t: `r = ${s * s}`, mc: MC.gapRatio, say: `${s * s} is the factor over TWO steps: r² = ${s * s}.` },
      { t: `r = ${qH(half)}`, mc: MC.diffAsRatio, say: 'That divides the difference by the gap, the arithmetic method. Geometric terms multiply.' },
    ];
    return choice(R, {
      id: `gapRatio-${n}`, family: 'gapRatio', prompt: head, board: `a_{${i}} = ${qT(ai)},\\ \\ a_{${i + 2}} = ${qT(aj)}`, solution: sol,
      picture: { strip: { ns: [i, i + 1, i + 2], vals: [ai, null, aj], hops: false } },
    }, opts);
  }
};
const gapCube: Gen = (R, n) => {
  for (;;) {
    const t = pick(R, [2, 3, -2, -3]), c = nz(R, -4, 4), i = int(R, 1, 3);
    const ai = qi(c), aj = qi(c * t ** 3), d3 = div(sub(aj, ai), qi(3));
    if (eq(d3, qi(t))) continue;
    return numItem({
      id: `gapCube-${n}`, family: 'gapCube', prompt: `In a geometric sequence, a<sub>${i}</sub> = ${qH(ai)} and a<sub>${i + 3}</sub> = ${qH(aj)}. What is the common ratio <i>r</i>?`,
      board: `a_{${i}} = ${qT(ai)},\\ \\ a_{${i + 3}} = ${qT(aj)}`,
      solution: [`Three steps apart: r<sup>3</sup> = ${qH(aj)} ÷ ${c < 0 ? `(${qH(ai)})` : qH(ai)} = ${t ** 3}.`, `An odd power keeps the sign, so there is one real ratio: r = ${ans(qH(qi(t)))}.`],
      picture: { strip: { ns: [i, i + 1, i + 2, i + 3], vals: [ai, null, null, aj], reveal: [null, qi(c * t), qi(c * t * t), null], hops: false } },
    }, qi(t), `Right: (${t})³ = ${t ** 3}.`, [
      [qi(t ** 3), MC.gapRatio, `${t ** 3} is the factor over THREE steps, r³.`],
      [d3, MC.diffAsRatio, 'Dividing the difference by 3 is the arithmetic method. Here r³ = later ÷ earlier.'],
      [qi(-t), undefined, `Check the sign: (${-t})³ = ${(-t) ** 3}, not ${t ** 3}.`],
    ], `Divide the later term by the earlier: that is r³. Which number cubed gives it?`);
  }
};

// =====================================================================================================================
// 14 nonadjacent-formula (optional extension)
// =====================================================================================================================
const backFirst: Gen = (R, n) => {
  const r = pick(R, [qi(2), qi(3), qi(-2), q(1, 2), qi(-3)]), m = int(R, 3, r.d === 1 && Math.abs(r.n) === 3 ? 4 : 5);
  const a1 = qi(nz(R, -6, 9) * r.d ** (m - 1)), am = term(a1, r, m);
  if (Math.abs(val(am)) > 2000 || Math.abs(val(a1)) > 2000) return backFirst(R, n);
  const vs = terms(a1, r, m);
  return numItem({
    id: `backFirst-${n}`, family: 'backFirst', prompt: `A geometric sequence has r = ${qH(r)} and a<sub>${m}</sub> = ${qH(am)}. What is a<sub>1</sub>?`, board: `r = ${qT(r)},\\ \\ a_{${m}} = ${qT(am)}`,
    solution: [`a<sub>${m}</sub> is ${m - 1} steps of × ${facH(r)} after a<sub>1</sub>, so step BACK: divide by ${facH(r)} ${m - 1} times.`, `a<sub>1</sub> = ${qH(am)} ÷ ${facH(r)}<sup>${m - 1}</sup> = ${qH(am)} ÷ ${facH(pow(r, m - 1))} = ${ans(qH(a1))}.`],
    picture: { strip: { ns: vs.map((_, i) => i + 1), vals: vs.map((v, i) => (i === m - 1 ? v : null)), reveal: vs.map((v, i) => (i === m - 1 ? null : v)), r } },
  }, a1, `Right: a<sub>1</sub> = ${qH(a1)}.`, [
    [mul(am, pow(r, m - 1)), MC.forwardOp, `That multiplies again. Going back to a<sub>1</sub> undoes the steps: divide.`],
    [div(am, pow(r, m)), MC.nSteps, `From a<sub>1</sub> to a<sub>${m}</sub> there are ${m - 1} steps, not ${m}.`],
    [div(am, r), undefined, `That is only one step back, a<sub>${m - 1}</sub>.`],
  ], `Divide ${qH(am)} by ${facH(r)} once for each step back.`);
};
const backFormula: Gen = (R, n) => {
  const s = int(R, 2, 3), j = int(R, 2, 3), a1 = qi(nz(R, -4, 5));
  const aj = mul(a1, pow(qi(s), j - 1)), ak = mul(aj, qi(s * s));
  const A1p = div(aj, pow(qi(s), j - 1)), A1m = div(aj, pow(qi(-s), j - 1));
  const two = (x: Q, y: Q) => `a<sub>n</sub> = ${expH(x, qi(s))} or a<sub>n</sub> = ${expH(y, qi(-s))}`;
  const Fp = mul(aj, pow(qi(s), j - 1)), Fm = mul(aj, pow(qi(-s), j - 1));
  return choice(R, {
    id: `backFormula-${n}`, family: 'backFormula', prompt: `A geometric sequence has a<sub>${j}</sub> = ${qH(aj)} and a<sub>${j + 2}</sub> = ${qH(ak)}. Which explicit formulas are possible?`,
    board: `a_{${j}} = ${qT(aj)},\\ \\ a_{${j + 2}} = ${qT(ak)}`,
    solution: [`r<sup>2</sup> = ${qH(ak)} ÷ ${facH(aj)} = ${s * s}, so r = ${s} or r = −${s}.`, `Step back ${j - 1 === 1 ? 'once' : `${j - 1} times`}: a<sub>1</sub> = ${qH(aj)} ÷ ${s}${j > 2 ? '<sup>2</sup>' : ''} = ${qH(A1p)}, or ${qH(aj)} ÷ (−${s})${j > 2 ? '<sup>2</sup>' : ''} = ${qH(A1m)}.`],
    picture: { strip: { ns: [1, 2, 3, 4, 5].slice(0, j + 2), vals: [1, 2, 3, 4, 5].slice(0, j + 2).map(k => (k === j ? aj : k === j + 2 ? ak : null)), hops: false } },
  }, [
    { t: two(A1p, A1m), ok: true, say: 'Right: one formula for each ratio, each with its own first term.' },
    { t: `only a<sub>n</sub> = ${expH(A1p, qi(s))}`, mc: MC.dropNegRoot, say: `r = −${s} also gives r² = ${s * s}: it needs its own formula.` },
    { t: two(aj, aj), mc: MC.firstAsIcpt, say: `${qH(aj)} is a<sub>${j}</sub>, not a<sub>1</sub>: the front number must be the FIRST term.` },
    { t: two(Fp, Fm), mc: MC.forwardOp, say: 'To reach a<sub>1</sub> you go back: divide by r, do not multiply.' },
  ]);
};

// =====================================================================================================================
// 15 index-zero
// =====================================================================================================================
interface Story0 { text: string; s: string; c: Q; r: Q; unit: string; money?: boolean; dec?: boolean; maxK: number; per: string }
const ZERO: ((R: () => number) => Story0)[] = [
  R => { const c = int(R, 2, 9) * 100, m = pick(R, [2, 3]); return { text: `A lab culture starts with ${numP(c)} cells and ${m === 2 ? 'doubles' : 'triples'} every hour.`, s: 'c', c: qi(c), r: qi(m), unit: 'cells', maxK: m === 2 ? 6 : 4, per: 'hours' }; },
  R => { const c = pick(R, [25000, 20000, 15000]); return { text: `A car bought for ${usd(c)} keeps 80% of its value each year.`, s: 'v', c: qi(c), r: q(4, 5), unit: '', money: true, dec: true, maxK: 4, per: 'years' }; },
  R => { const c = pick(R, [800, 400, 1600]); return { text: `A patient has ${numP(c)} mg of a medicine in the body; every 6 hours half of it is left.`, s: 'd', c: qi(c), r: q(1, 2), unit: 'mg', maxK: 4, per: '6-hour periods' }; },
  R => { const c = pick(R, [1000, 2000, 500]); return { text: `A savings account starts with ${usd(c)} and earns 10% interest per year, with no deposits or withdrawals.`, s: 'b', c: qi(c), r: q(11, 10), unit: '', money: true, dec: true, maxK: 3, per: 'years' }; },
];
const zeroStart: Gen = (R, n) => {
  const S = pick(R, ZERO)(R), k = int(R, 2, S.maxK), v = term(S.c, S.r, k, 0), N = { s: S.s };
  const show = (x: Q) => (S.money ? usd(x) : numP(x));
  const vs = terms(S.c, S.r, k + 1, 0);
  return numItem({
    id: `zeroStart-${n}`, family: 'zeroStart', unit: S.unit,
    prompt: `${S.text} Let ${N.s}<sub>n</sub> be the amount after <i>n</i> ${S.per}, so ${N.s}<sub>0</sub> = ${show(S.c)}. What is ${N.s}<sub>${k}</sub>?`,
    board: `${N.s}_n = ${expT(S.c, S.r, 0, true)},\\ n \\ge 0`,
    solution: [`n counts the ${S.per} that have passed: ${N.s}<sub>${k}</sub> is ${k} steps of × ${qH(S.r, true)} after ${N.s}<sub>0</sub>.`, `${N.s}<sub>${k}</sub> = ${show(S.c)} · ${qH(S.r, true)}<sup>${k}</sup> = ${ans(show(v))}.`],
    picture: { strip: stripHidden(vs, 1, { n0: 0, r: S.r, dec: true, max: Math.min(k + 1, 6), name: `${N.s}ₙ` }) },
  }, v, `Right: ${N.s}<sub>${k}</sub> = ${show(v)}.`, [
    [term(S.c, S.r, k - 1, 0), MC.shift1, `That is ${k - 1} steps. The start is n = 0, so after ${k} ${S.per} there are ${k} steps.`],
    [term(S.c, S.r, k + 1, 0), undefined, `That is ${k + 1} steps. After ${k} ${S.per}: ${k} steps.`],
  ], `Multiply the start by ${qH(S.r, true)} once for each of the ${k} ${S.per}.`);
};
const zeroOrOne: Gen = (R, n) => {
  const elapsed = R() < 0.5;
  if (elapsed) {
    const S = pick(R, ZERO)(R), N = S.s;
    const f = (k: number, lo: number) => `${N}<sub>n</sub> = ${expH(S.c, S.r, k, true)} for ${nI} ≥ ${lo}`;
    return choice(R, {
      id: `zeroOrOne-${n}`, family: 'zeroOrOne', prompt: `${S.text} ${N}<sub>n</sub> is the amount after <i>n</i> ${S.per}, starting now. Which model fits, including the starting amount?`,
      board: `${N}_n:\\ n = \\text{${S.per} passed}`,
      solution: [`n counts ${S.per} that have passed, so the start is n = 0 and ${N}<sub>0</sub> = ${qH(S.c, true)}.`, `After n ${S.per}: n factors of ${qH(S.r, true)}, so the exponent is n.`],
    }, [
      { t: f(0, 0), ok: true, say: 'Right: n = 0 is now, and the exponent counts the periods.' },
      { t: f(1, 0), mc: MC.shift1, say: `At n = 0 that gives ${qH(S.c, true)} ÷ ${qH(S.r, true)}, not the start. With n = periods passed, the exponent is n.` },
      { t: f(0, 1), say: 'n ≥ 1 leaves out n = 0, the starting amount.' },
      { t: `${N}<sub>n</sub> = ${expH(S.r, S.c, 0, true)} for ${nI} ≥ 0`, mc: MC.coefAsFactor, say: 'The start and the factor are swapped.' },
    ]);
  }
  const c = int(R, 2, 6), m = int(R, 2, 4);
  const f = (k: number, lo: number) => `c<sub>n</sub> = ${expH(qi(c), qi(m), k)} for ${nI} ≥ ${lo}`;
  return choice(R, {
    id: `zeroOrOne-${n}`, family: 'zeroOrOne', prompt: `A display of cans has ${c} cans in row 1, and each row has ${m} times as many cans as the row before. c<sub>n</sub> is the number of cans in row <i>n</i>. Which model fits?`,
    board: `c_n:\\ n = \\text{row number}`,
    solution: ['There is no row 0: row 1 is the first, so n ≥ 1 and c<sub>1</sub> = ' + c + '.', `Row n is n − 1 rows after row 1: exponent n − 1.`],
  }, [
    { t: f(1, 1), ok: true, say: 'Right: row 1 has no factor yet, so the exponent is n − 1.' },
    { t: f(0, 1), mc: MC.nSteps, say: `At n = 1 that gives ${c * m}, but row 1 has ${c}.` },
    { t: f(1, 0), say: 'There is no row 0: the rows start at n = 1.' },
    { t: `c<sub>n</sub> = ${expH(qi(m), qi(c))} for ${nI} ≥ 1`, mc: MC.coefAsFactor, say: 'The start and the factor are swapped.' },
  ]);
};

// =====================================================================================================================
// 16 reindex
// =====================================================================================================================
const relabel: Gen = (R, n) => {
  const c = qi(int(R, 2, 9)), r = qi(int(R, 2, 5));
  if (eq(c, r)) return relabel(R, n);
  const b = (k: number, lo: number) => `b<sub>n</sub> = ${expH(c, r, k)} for ${nI} ≥ ${lo}`;
  return choice(R, {
    id: `relabel-${n}`, family: 'relabel', prompt: `a<sub>n</sub> = ${expH(c, r)} for <i>n</i> ≥ 1. Relabel the SAME terms so the first one is b<sub>0</sub> (b<sub>n</sub> = a<sub>n+1</sub>). Which is right?`,
    board: `a_n = ${expT(c, r)},\\ n \\ge 1;\\ \\ b_n = a_{n+1}`,
    solution: [`b<sub>n</sub> = a<sub>n+1</sub> = ${qH(c)} · ${qH(r)}<sup>(n+1)−1</sup> = ${expH(c, r, 0)}.`, `The labels moved down by one, so the domain moves too: n ≥ 0. Check b<sub>0</sub> = ${qH(c)} = a<sub>1</sub> ✓.`],
    picture: { strip: stripOf(terms(c, r, 5), { ell: true }) },
  }, [
    { t: b(0, 0), ok: true, say: 'Right: new formula AND new domain.' },
    { t: b(0, 1), mc: MC.oldRange, say: 'The formula moved, but n ≥ 1 is the old domain: it now skips the first term, b<sub>0</sub>.' },
    { t: b(1, 0), mc: MC.shift1, say: `That adds a value before the first term (b<sub>0</sub> = ${qH(div(c, r))}). Relabelling keeps the same terms.` },
    { t: b(-1, 0), say: `At n = 0 that gives ${qH(mul(c, r))}, the second term. b<sub>0</sub> must be the first, ${qH(c)}.` },
  ]);
};
const relabelValue: Gen = (R, n) => {
  const c = qi(int(R, 2, 9)), r = qi(pick(R, [2, 3, 4, -2])), k = int(R, 0, 4);
  const v = term(c, r, k, 0);
  return numItem({
    id: `relabelValue-${n}`, family: 'relabelValue', prompt: `a<sub>n</sub> = ${expH(c, r)} for <i>n</i> ≥ 1. The same terms are relabelled from 0: b<sub>n</sub> = a<sub>n+1</sub> for <i>n</i> ≥ 0. What is b<sub>${k}</sub>?`,
    board: `b_n = a_{n+1};\\ \\ b_{${k}} = \\,?`,
    solution: [`b<sub>${k}</sub> = a<sub>${k + 1}</sub>: the same term, one label lower.`, `a<sub>${k + 1}</sub> = ${qH(c)} · ${facH(r)}<sup>${k}</sup> = ${ans(qH(v))}.`],
    picture: { strip: { ...stripHidden(terms(c, r, Math.max(k + 1, 3), 0), 1, { n0: 0, r, max: Math.max(k + 1, 3) })!, name: 'bₙ' } },
  }, v, `Right: b<sub>${k}</sub> = a<sub>${k + 1}</sub> = ${qH(v)}.`, [
    [k === 0 ? NaN : term(c, r, k), MC.shift1, `That is a<sub>${k}</sub>. b<sub>${k}</sub> is a<sub>${k + 1}</sub>.`],
  ], `b<sub>${k}</sub> is the term a<sub>${k + 1}</sub>.`);
};

// =====================================================================================================================
// 17 rewrite-same-index
// =====================================================================================================================
const rewriteCoef: Gen = (R, n) => {
  const r = pick(R, [qi(2), qi(4), qi(5), qi(10), q(1, 2), q(1, 4)]), c = qi(int(R, 1, 19));
  const v = div(c, r);
  if (eq(v, c)) return rewriteCoef(R, n);
  return numItem({
    id: `rewriteCoef-${n}`, family: 'rewriteCoef', prompt: `Rewrite a<sub>n</sub> = ${expH(c, r, 1, true)} (n ≥ 1) in the form a<sub>n</sub> = □ · ${facH(r, true)}<sup>n</sup>, same <i>n</i>. What goes in the box? (A decimal is fine.)`,
    board: `${expT(c, r, 1, true)} = \\square \\cdot ${qT(r, true)}^{n}`,
    solution: [`${facH(r, true)}<sup>n−1</sup> = ${facH(r, true)}<sup>n</sup> ÷ ${facH(r, true)}, so the front number is ${qH(c, true)} ÷ ${facH(r, true)}.`, `${qH(c, true)} ÷ ${facH(r, true)} = ${ans(qH(v, true))}.`],
  }, v, `Right: ${qH(v, true)} · ${facH(r, true)}<sup>n</sup>, still for n ≥ 1.`, [
    [mul(c, r), MC.forwardOp, `r<sup>n</sup> has one factor MORE than r<sup>n−1</sup>, so the front number must be divided by r, not multiplied.`],
    [c, undefined, `Then a<sub>1</sub> would be ${qH(mul(c, r), true)}, not ${qH(c, true)}. Divide by r.`],
  ], `r<sup>n−1</sup> = r<sup>n</sup> ÷ r: divide ${qH(c, true)} by ${qH(r, true)}.`);
};
const rewriteVsRelabel: Gen = (R, n) => {
  const r = int(R, 2, 4), c0 = int(R, 1, 6), c = qi(c0 * r), half = qi(c0);
  return choice(R, {
    id: `rewriteVsRelabel-${n}`, family: 'rewriteVsRelabel', prompt: `Jo rewrites a<sub>n</sub> = ${expH(c, qi(r))} for <i>n</i> ≥ 1 as a<sub>n</sub> = ${expH(half, qi(r), 0)}. What changed?`,
    board: `${expT(c, qi(r))} = ${expT(half, qi(r), 0)}`,
    solution: [`${qH(c)} · ${r}<sup>n−1</sup> = ${qH(c)} · ${r}<sup>n</sup> ÷ ${r} = ${qH(half)} · ${r}<sup>n</sup> for the SAME n.`, `Nothing about the labels changed: still n ≥ 1, and a<sub>1</sub> = ${qH(half)} · ${r} = ${qH(c)}.`],
    picture: { strip: stripOf(terms(c, qi(r), 5), { ell: true }), graph: { pts: terms(c, qi(r), 3).map((v, i) => [i + 1, val(v)]), guide: { a: c0, r, k: 0 }, zero: c0 }, hold: ['guide', 'zero'] },
  }, [
    { t: `Only the form: same n, same domain n ≥ 1, and a<sub>1</sub> is still ${qH(c)}`, ok: true, say: 'Right: an equivalent expression, the same labels and terms.' },
    { t: `The sequence now starts at n = 0 with a<sub>0</sub> = ${qH(half)}`, mc: MC.rewriteReset, say: `The domain is still n ≥ 1. ${qH(half)} is the value at n = 0 only if you EXTEND the sequence.` },
    { t: `The first term is now ${qH(half)}`, mc: MC.rewriteReset, say: `a<sub>1</sub> = ${qH(half)} · ${r}<sup>1</sup> = ${qH(c)}: the first term did not change.` },
    { t: `Every term is now ${r} times smaller`, say: `Check n = 2 in both: ${qH(mul(c, qi(r)))} and ${qH(mul(c, qi(r)))}. Same terms.` },
  ]);
};

// =====================================================================================================================
// 18 factor-percent
// =====================================================================================================================
const FACTORS = [q(105, 100), q(12, 10), q(1025, 1000), q(95, 100), q(85, 100), q(8, 10), qi(1)];
const factorPct: Gen = (R, n) => {
  const r = pick(R, FACTORS), what = pick(R, ['An account balance', 'A town’s population', 'The number of subscribers', 'A forest’s area']);
  const up = val(r) > 1, flat = eq(r, qi(1)), p = up ? sub(r, qi(1)) : sub(qi(1), r);
  const rP = `${numP(mul(r, qi(100)))}%`;
  let opts: Opt[];
  if (flat) opts = [
    { t: 'It stays the same: a 0% change each year', ok: true, say: 'Right: × 1 keeps 100%, no change.' },
    { t: 'It grows by 100% each year', mc: MC.pctOf, say: '× 1 keeps 100% of the amount: that is no growth.' },
    { t: 'It grows by 1% each year', mc: MC.factorRate, say: 'The factor 1 is not the rate. 1 = 1 + 0, so the change is 0%.' },
  ];
  else opts = [
    { t: `It ${up ? 'grows' : 'shrinks'} by ${pct(p)} each year`, ok: true, say: `Right: × ${qH(r, true)} = ${rP} of the amount, a change of ${up ? '+' : '−'}${pct(p)}.` },
    { t: `It ${up ? 'grows' : 'shrinks'} by ${rP} each year`, mc: MC.pctOf, say: `× ${qH(r, true)} KEEPS ${rP}. The change is the difference from 100%: ${pct(p)}.` },
    { t: `It ${up ? 'grows' : 'shrinks'} by ${numP(r)}% each year`, mc: MC.factorRate, say: `The factor is not the rate: ${qH(r, true)} = 1 ${up ? '+' : '−'} ${qH(p, true)}.` },
    { t: `It ${up ? 'shrinks' : 'grows'} by ${pct(p)} each year`, say: `${qH(r, true)} is ${up ? 'more' : 'less'} than 1, so it ${up ? 'grows' : 'shrinks'}.` },
  ];
  return choice(R, {
    id: `factorPct-${n}`, family: 'factorPct', prompt: `${what} is multiplied by ${qH(r, true)} every year. Which statement is true?`, board: `\\times ${qT(r, true)}\\ \\text{per year}`,
    solution: [`× ${qH(r, true)} keeps ${rP} of last year’s amount.`, flat ? 'That is 100%: no change.' : `${rP} − 100% = ${up ? '' : '−'}${pct(p)}: it ${up ? 'grows' : 'shrinks'} by ${pct(p)} each year.`],
  }, opts);
};
const compound: Gen = (R, n) => {
  if (R() < 0.45) {
    const P = pick(R, [1000, 2000, 5000, 800, 2500]), pp = pick(R, [5, 4, 10, 2]), k = 2;
    const r = q(100 + pp, 100), v = mul(qi(P), pow(r, k));
    return numItem({
      id: `compound-${n}`, family: 'compound', unit: 'dollars',
      prompt: `${usd(P)} is put in an account that earns ${pp}% interest per year, with no deposits or withdrawals. How much is in it after ${k} years?`, board: `${P} \\cdot ${qT(r, true)}^{${k}}`,
      solution: [`Each year the balance is multiplied by 1 + ${pp}% = ${qH(r, true)}; the second year's ${pp}% is of the NEW balance.`, `${usd(P)} · ${qH(r, true)}<sup>2</sup> = ${ans(usd(v))}.`],
    }, v, `Right: ${usd(v)}.`, [
      [qi(P + (P * pp * k) / 100), MC.addPct, `That adds ${pp}% of ${usd(P)} twice. Year 2 earns ${pp}% of the larger balance.`],
    ], `Multiply by ${qH(r, true)} once per year.`);
  }
  const up = R() < 0.55, pp = pick(R, [10, 20, 50]), k = pick(R, [2, 3]);
  const r = up ? q(100 + pp, 100) : q(100 - pp, 100), f = pow(r, k), total = up ? mul(sub(f, qi(1)), qi(100)) : mul(sub(qi(1), f), qi(100));
  return numItem({
    id: `compound-${n}`, family: 'compound', unit: '%',
    prompt: `A quantity ${up ? 'grows' : 'shrinks'} by ${pp}% each period. By what percent has it ${up ? 'grown' : 'shrunk'} in total after ${k} periods?`, board: `(${qT(r, true)})^{${k}}`,
    solution: [`One period: × ${qH(r, true)}. ${k} periods: × ${qH(r, true)}<sup>${k}</sup> = ${qH(f, true)}.`, `${qH(f, true)} is ${numP(mul(f, qi(100)))}% of the start: a total ${up ? 'growth' : 'drop'} of ${ans(numP(total))}%.`],
  }, total, `Right: ${numP(total)}%, not ${pp * k}%.`, [
    [qi(pp * k), MC.addPct, `${k} × ${pp}% adds the percents. Each period's ${pp}% is of a ${up ? 'bigger' : 'smaller'} amount: multiply the factors.`],
    [mul(f, qi(100)), MC.pctOf, `${numP(mul(f, qi(100)))}% is what is there NOW. The change is the difference from 100%.`],
  ], `Multiply the factor ${qH(r, true)} by itself ${k} times, then compare with 1.`);
};

// =====================================================================================================================
// 19 context-model
// =====================================================================================================================
interface Ctx { text: string; s: string; c: Q; r: Q; n0: number; unit: string; what: (k: number) => string; money?: boolean; maxK: number; idx: string }
const CTX: ((R: () => number) => Ctx)[] = [
  R => { const [H, r] = pick(R, [[256, q(3, 4)], [243, q(2, 3)], [96, q(1, 2)], [128, q(3, 4)]] as [number, Q][]); return { text: `A ball's first bounce reaches ${H} inches, and each bounce reaches ${qH(r)} of the height of the one before.`, s: 'h', c: qi(H), r, n0: 1, unit: 'inches', what: k => `the height of bounce ${k}`, maxK: 5, idx: 'bounce number' }; },
  R => { const c = pick(R, [6400, 12800]); return { text: `A lake has ${numP(c)} fish now, and the number grows 25% per year.`, s: 'P', c: qi(c), r: q(5, 4), n0: 0, unit: 'fish', what: k => `the number of fish after ${k} years`, maxK: 4, idx: 'years from now' }; },
  R => { const c = pick(R, [20000, 30000]); return { text: `A truck is worth ${usd(c)} now and loses 10% of its value every year.`, s: 'V', c: qi(c), r: q(9, 10), n0: 0, unit: 'dollars', what: k => `its value after ${k} years`, money: true, maxK: 4, idx: 'years from now' }; },
];
const ctxEval: Gen = (R, n) => {
  const S = pick(R, CTX)(R), k = int(R, S.n0 === 1 ? 2 : 1, S.maxK), v = term(S.c, S.r, k, S.n0);
  const show = (x: Q) => (S.money ? usd(x) : numP(x));
  const steps = k - S.n0, first = term(S.c, S.r, S.n0 + 1, S.n0), d = sub(first, S.c);
  return numItem({
    id: `ctxEval-${n}`, family: 'ctxEval', unit: S.unit,
    prompt: `${S.text} ${S.s}<sub>n</sub> = ${expH(S.c, S.r, S.n0, true)}${S.n0 === 1 ? ' is the height of bounce <i>n</i>' : ` is ${S.what(0).replace(' 0 ', ' <i>n</i> ')}`} (n ≥ ${S.n0}). What is ${S.s}<sub>${k}</sub>, ${S.what(k)}?`,
    board: `${S.s}_n = ${expT(S.c, S.r, S.n0, true)};\\ \\ ${S.s}_{${k}} = \\,?`,
    solution: [`n = ${k} is ${steps} step${steps === 1 ? '' : 's'} after the start n = ${S.n0}: ${steps} factor${steps === 1 ? '' : 's'} of ${qH(S.r, true)}.`, `${S.s}<sub>${k}</sub> = ${show(S.c)} · ${qH(S.r, true)}<sup>${steps}</sup> = ${ans(show(v))}.`],
    picture: { strip: stripHidden(terms(S.c, S.r, Math.min(steps + 1, 6), S.n0), 1, { n0: S.n0, r: S.r, dec: true, name: `${S.s}ₙ`, max: Math.min(steps + 1, 6) }) },
  }, v, `Right: ${S.what(k)} is ${show(v)}${S.money ? '' : ' ' + S.unit}.`, [
    [term(S.c, S.r, k + 1, S.n0), MC.shift1, `That is one factor too many: the exponent at n = ${k} is ${S.n0 === 1 ? `${k} − 1` : k}.`],
    [term(S.c, S.r, k - 1, S.n0), MC.shift1, `That is one factor too few: count the steps from n = ${S.n0}.`],
    [add(S.c, mul(d, qi(steps))), MC.addFactor, `That repeats the first CHANGE (${show(d)}). The change shrinks or grows; the FACTOR stays ${qH(S.r, true)}.`],
  ], `Put n = ${k} into the formula: ${show(S.c)} · ${qH(S.r, true)}<sup>${steps}</sup>.`);
};
const add = (a: Q, b: Q) => sub(a, neg(b));
const ctxMeaning: Gen = (R, n) => {
  const S = CTX[0]!(R), bounce = R() < 0.6;
  if (bounce) {
    const k = int(R, 2, 4), v = term(S.c, S.r, k);
    if (R() < 0.5) return choice(R, {
      id: `ctxMeaning-${n}`, family: 'ctxMeaning', prompt: `${S.text} h<sub>n</sub> = ${expH(S.c, S.r)} is the height in inches of bounce <i>n</i>. What does h<sub>${k}</sub> = ${numP(v)} mean?`,
      board: `h_{${k}} = ${qT(v, true)}`,
      solution: [`n is the bounce NUMBER; h<sub>n</sub> is its height in inches.`, `So bounce ${k} reaches ${numP(v)} inches.`],
    }, [
      { t: `Bounce ${k} reaches a height of ${numP(v)} inches`, ok: true, say: 'Right: the input is the bounce number, the output a height in inches.' },
      { t: `After ${k} seconds the ball is ${numP(v)} inches high`, mc: MC.meaning, say: 'n counts bounces, not seconds.' },
      { t: `The ball bounces ${numP(v)} times`, mc: MC.posVal, say: `${numP(v)} is the value (a height). The bounce number is ${k}.` },
      { t: `The first ${k} bounces reach ${numP(v)} inches in total`, mc: MC.meaning, say: 'h<sub>n</sub> is the height of ONE bounce, not a total.' },
    ]);
    return choice(R, {
      id: `ctxMeaning-${n}`, family: 'ctxMeaning', prompt: `${S.text} h<sub>n</sub> = ${expH(S.c, S.r)} is the height of bounce <i>n</i>. Which values of <i>n</i> make sense?`,
      board: `h_n = ${expT(S.c, S.r)}`,
      solution: ['n counts bounces: the first bounce is n = 1, and there is no half bounce.', 'So n = 1, 2, 3, …'],
    }, [
      { t: 'n = 1, 2, 3, … (whole bounces, starting with the first)', ok: true, say: 'Right: whole numbers from 1.' },
      { t: 'Every number n ≥ 1, such as 2.5', mc: MC.fracIdx, say: 'There is no bounce 2.5: n counts whole bounces.' },
      { t: 'n = 0, 1, 2, …', mc: MC.shift1, say: `Bounce 1 is the first; h<sub>0</sub> = ${numP(div(S.c, S.r))} is not a bounce.` },
    ]);
  }
  const T = CTX[1]!(R), k = int(R, 1, 3), v = term(T.c, T.r, k, 0);
  return choice(R, {
    id: `ctxMeaning-${n}`, family: 'ctxMeaning', prompt: `${T.text} P<sub>n</sub> = ${expH(T.c, T.r, 0, true)} is the number of fish <i>n</i> years from now. What does P<sub>${k}</sub> = ${numP(v)} mean?`,
    board: `P_{${k}} = ${qT(v)}`,
    solution: ['n counts whole years from now (n = 0 is now); P<sub>n</sub> is a number of fish.', `So ${k} year${k === 1 ? '' : 's'} from now there are ${numP(v)} fish.`],
  }, [
    { t: `${k} year${k === 1 ? '' : 's'} from now the lake has ${numP(v)} fish`, ok: true, say: 'Right: n counts years from now.' },
    { t: `In year ${k} the lake gains ${numP(v)} fish`, mc: MC.meaning, say: 'P<sub>n</sub> is how many fish there ARE, not how many are added.' },
    { t: `It takes ${numP(v)} years to reach ${k} fish`, mc: MC.posVal, say: `${k} is the input (years), ${numP(v)} the output (fish).` },
    { t: `${numP(v)} is the ${['first', 'second', 'third'][k - 1]} number in the list P<sub>0</sub>, P<sub>1</sub>, P<sub>2</sub>, …`, mc: MC.shift1, say: `The list starts at P<sub>0</sub>, so P<sub>${k}</sub> is number ${k + 1} in the list.` },
  ]);
};

// =====================================================================================================================
// 20 context-threshold
// =====================================================================================================================
interface Thr { a: Q; r: Q; n0: number; up: boolean; T: number; m: number; text: string; s: string; trap: number | null }
function threshold(R: () => number): Thr {
  for (;;) {
    const up = R() < 0.5, n0 = R() < 0.5 ? 0 : 1;
    const r = up ? pick(R, [q(3, 2), q(6, 5), qi(2), q(5, 4)]) : pick(R, [q(4, 5), q(1, 2), q(9, 10), q(3, 4)]);
    const a = qi(pick(R, up ? [100, 200, 500, 1000] : [800, 1000, 2000, 640]));
    const m = n0 + int(R, 3, 7), am = val(term(a, r, m, n0)), ap = val(term(a, r, m - 1, n0));
    // a round threshold strictly between the two neighbours; sometimes just past a term that rounds onto it
    const lo = Math.min(am, ap), hi = Math.max(am, ap);
    const cands: number[] = [];
    for (const s of [100, 50, 10, 5, 1]) { const t = up ? Math.ceil(lo / s + 1e-9) * s : Math.floor(hi / s - 1e-9) * s; if (t > lo + 1e-9 && t < hi - 1e-9) cands.push(t); }
    if (!cands.length) continue;
    const roundTrap = up ? Math.ceil(ap) : Math.floor(ap);
    const useTrap = R() < 0.35 && !Number.isInteger(ap) && Math.abs(Math.round(ap) - roundTrap) < 1e-9 && roundTrap > lo && roundTrap < hi;
    const T = useTrap ? roundTrap : cands[0]!;
    if (T <= 0) continue;
    const trap = useTrap ? m - 1 : null;
    const s = up ? 'a' : 'd';
    if (terms(a, r, m - n0 + 2, n0).some(v => decStr(v, 6) === null)) continue;
    const text = up
      ? `A mold colony covers a<sub>n</sub> = ${expH(a, r, n0, true)} square millimeters, where ${n0 === 0 ? 'n = days since the first measurement (n ≥ 0)' : 'n = the day number (day 1 is the first measurement)'}.`
      : `The medicine left in a patient is d<sub>n</sub> = ${expH(a, r, n0, true)} mg, where ${n0 === 0 ? 'n = 4-hour intervals since the dose (n ≥ 0)' : 'n = the check number (check 1 is right after the dose)'}.`;
    return { a, r, n0, up, T, m, text, s, trap };
  }
}
const firstCross: Gen = (R, n) => {
  const t = threshold(R), { a, r, n0, up, T, m, s } = t;
  const am = term(a, r, m, n0), ap = term(a, r, m - 1, n0);
  const vs = terms(a, r, m - n0 + 1, n0);
  const cands: [Q | number, string | undefined, string][] = [
    [m - 1, t.trap !== null ? MC.roundsFirst : (n0 === 1 ? MC.shift1 : undefined), t.trap !== null ? `${s}<sub>${m - 1}</sub> = ${numP(ap)} only ROUNDS to ${T}; it is ${up ? 'below' : 'above'} ${T}. Compare the exact values.` : `${s}<sub>${m - 1}</sub> = ${numP(ap)} is not ${up ? 'at least' : 'at most'} ${T} yet.`],
    [m + 1, MC.minUnver, `${s}<sub>${m + 1}</sub> is past ${T}, but so is ${s}<sub>${m}</sub> = ${numP(am)}: check the term before.`],
  ];
  return numItem({
    id: `firstCross-${n}`, family: 'firstCross',
    prompt: `${t.text} What is the first <i>n</i> with ${s}<sub>n</sub> ${up ? '≥' : '≤'} ${numP(T)}? (Calculator allowed; compare exact values.)`,
    board: `${s}_n = ${expT(a, r, n0, true)},\\ \\ ${s}_n ${up ? '\\ge' : '\\le'} ${T}`,
    solution: [`${s}<sub>${m - 1}</sub> = ${numP(ap)}, ${up ? 'below' : 'above'} ${numP(T)}.`, `${s}<sub>${m}</sub> = ${numP(am)}, ${up ? 'at least' : 'at most'} ${numP(T)}: the first is n = ${ans(m)}.`],
    picture: { strip: stripHidden(vs, 2, { n0, r, dec: true, name: `${s}ₙ`, max: 6 }) },
  }, qi(m), `Right: ${s}<sub>${m - 1}</sub> = ${numP(ap)} and ${s}<sub>${m}</sub> = ${numP(am)}.`, cands, `Work out the terms one by one until the first one ${up ? 'reaches' : 'drops to'} ${numP(T)}.`);
};
const crossCheck: Gen = (R, n) => {
  const t = threshold(R), { a, r, n0, up, T, m, s } = t;
  const v = (k: number) => numP(term(a, r, k, n0));
  const sub2 = (k: number) => `${s}<sub>${k}</sub>`;
  const ok = up ? '≥' : '≤', no = up ? '<' : '>';
  const opts: Opt[] = [
    { t: `${sub2(m - 1)} = ${v(m - 1)} ${no} ${numP(T)} and ${sub2(m)} = ${v(m)} ${ok} ${numP(T)}`, ok: true, say: `Right: n = ${m} is past ${numP(T)}, and the term just before is not.` },
    { t: `${sub2(m)} = ${v(m)} ${ok} ${numP(T)}, and nothing else is needed`, mc: MC.minUnver, say: `That shows n = ${m} works, not that it is the FIRST. Check ${sub2(m - 1)}.` },
    { t: `${sub2(m)} = ${v(m)} ${ok} ${numP(T)} and ${sub2(m + 1)} = ${v(m + 1)} ${ok} ${numP(T)}`, mc: MC.minUnver, say: 'Later terms say nothing about an earlier crossing. Check the term BEFORE.' },
  ];
  if (m - 2 >= n0) opts.push({ t: `${sub2(m - 2)} = ${v(m - 2)} ${no} ${numP(T)} and ${sub2(m)} = ${v(m)} ${ok} ${numP(T)}`, mc: MC.minUnver, say: `That skips ${sub2(m - 1)}: it might already be past ${numP(T)}. Check the neighbour.` });
  return choice(R, {
    id: `crossCheck-${n}`, family: 'crossCheck', prompt: `${t.text} Which values prove that n = ${m} is the FIRST n with ${s}<sub>n</sub> ${ok} ${numP(T)}?`,
    board: `${s}_n = ${expT(a, r, n0, true)},\\ \\ ${s}_n ${up ? '\\ge' : '\\le'} ${T}`,
    solution: [`"First" needs two facts: n = ${m} is past ${numP(T)}, and n = ${m - 1} is not.`],
  }, opts);
};

// =====================================================================================================================
// 21 justify-model-type
// =====================================================================================================================
type Kind = 0 | 1 | 2;
const SIT: ((R: () => number) => { t: string; k: Kind; trap: boolean })[] = [
  R => ({ t: `A gym membership costs $${int(R, 3, 8) * 5} more every year.`, k: 0, trap: false }),
  R => ({ t: `The number of views of a video ${pick(R, ['doubles', 'triples'])} every day.`, k: 1, trap: false }),
  R => ({ t: `A town's population grows ${int(R, 2, 6)}% per year.`, k: 1, trap: true }),
  R => ({ t: `A sunflower grows ${int(R, 2, 9)} cm per week.`, k: 0, trap: true }),
  R => ({ t: `A car loses ${pick(R, [10, 15, 20])}% of its value each year.`, k: 1, trap: true }),
  R => ({ t: `A tank loses ${int(R, 2, 9)} gallons of water per hour.`, k: 0, trap: true }),
  R => ({ t: `Each month Kai deposits $${int(R, 1, 4) * 50} into an account that also earns 1% interest per month.`, k: 2, trap: true }),
];
const modelType: Gen = (R, n) => {
  const S = pick(R, SIT)(R);
  const why = ['The SAME AMOUNT is added (or taken) each step.', 'The amount is MULTIPLIED by the same factor each step.', 'Each step adds a deposit AND multiplies: neither one rule alone.'];
  const names = ['Arithmetic: the same amount is added each step', 'Geometric: the same factor multiplies each step', 'Neither: each step both adds and multiplies'];
  return choice(R, {
    id: `modelType-${n}`, family: 'modelType', prompt: `${S.t} Which kind of sequence models the amount, step by step?`, board: '\\text{same amount or same factor?}',
    solution: [why[S.k]!],
  }, names.map((t, i) => ({ t, ok: i === S.k, mc: i !== S.k && S.trap ? MC.keywords : undefined, say: i === S.k ? `Right. ${why[S.k]}` : `Ask what happens in ONE step: ${why[S.k]!.toLowerCase()}` })));
};
const critique: Gen = (R, n) => {
  const pp = pick(R, [2, 4, 5, 8]), money = R() < 0.5, P = money ? pick(R, [1000, 2000, 5000]) : pick(R, [5000, 12000, 20000]);
  const add0 = (P * pp) / 100, f = q(100 + pp, 100);
  const who = money ? `An account starts with ${usd(P)} and earns ${pp}% interest per year (no deposits).` : `A town of ${numP(P)} people grows ${pp}% per year.`;
  const S = money ? 'A' : 'P';
  return choice(R, {
    id: `critique-${n}`, family: 'critique', prompt: `${who} Ana models it as ${S}<sub>n</sub> = ${numP(P)} + ${numP(add0)}${nI} (n = years). What is wrong?`,
    board: `${S}_n = ${P} + ${add0}n\\ ?`,
    solution: [`${pp}% of the amount is added each year, but the amount grows, so ${pp}% of it grows too.`, `The same FACTOR ${qH(f, true)} each year: ${S}<sub>n</sub> = ${expH(qi(P), f, 0, true)}.`],
  }, [
    { t: `${pp}% of a growing amount adds more each year: ${S}<sub>n</sub> = ${expH(qi(P), f, 0, true)}`, ok: true, say: 'Right: a percent per year is a constant factor, not a constant amount.' },
    { t: `Nothing: ${pp}% of ${numP(P)} is ${numP(add0)}, the same every year`, mc: MC.addFactor, say: `Only in year 1. In year 2 it is ${pp}% of ${numP(P + add0)}.` },
    { t: `It should be ${S}<sub>n</sub> = ${numP(P)} · ${pp}<sup>n</sup>`, mc: MC.factorRate, say: `× ${pp} would be a ${(pp - 1) * 100}% increase. The factor is 1 + ${pp}% = ${qH(f, true)}.` },
    { t: `It should be ${S}<sub>n</sub> = ${numP(P)} + ${pp}${nI}`, say: `That adds ${pp} a year: far too little, and still a constant amount.` },
  ]);
};

// =====================================================================================================================
// 22 justify-forms-agree
// =====================================================================================================================
const agreeWhy: Gen = (R, n) => {
  const c = int(R, 2, 9), r = int(R, 2, 5);
  return choice(R, {
    id: `agreeWhy-${n}`, family: 'agreeWhy', prompt: `Show that a<sub>1</sub> = ${c}, a<sub>n</sub> = ${r} · a<sub>n−1</sub> (n ≥ 2) and b<sub>n</sub> = ${c} · ${r}<sup>n−1</sup> (n ≥ 1) give the same sequence. Which argument is a proof?`,
    board: `a_1 = ${c},\\ a_n = ${r}a_{n-1};\\ \\ b_n = ${c} \\cdot ${r}^{n-1}`,
    solution: ['A proof must cover EVERY n: the same start, and the same step from every term to the next.', `b<sub>1</sub> = ${c} · ${r}<sup>0</sup> = ${c}, and ${r} · b<sub>n−1</sub> = ${r} · ${c} · ${r}<sup>n−2</sup> = ${c} · ${r}<sup>n−1</sup> = b<sub>n</sub>.`],
  }, [
    { t: `b<sub>1</sub> = ${c} · ${r}<sup>0</sup> = ${c} = a<sub>1</sub>, and for every n ≥ 2, ${r} · b<sub>n−1</sub> = ${c} · ${r}<sup>n−1</sup> = b<sub>n</sub>`, ok: true, say: 'Right: same start, same step for every n, so every term agrees.' },
    { t: `They agree at n = 1, 2, 3 and 4`, mc: MC.examples, say: 'Four checks are four examples. The claim is about every n.' },
    { t: `Both use the start ${c} and the ratio ${r}`, mc: MC.coefOnly, say: `${c} · ${r}<sup>n</sup> also shows ${c} and ${r}, and it is a different sequence. Check the start and the step.` },
    { t: `b<sub>n</sub> − b<sub>n−1</sub> is the same for every n`, mc: MC.addFactor, say: 'That is an arithmetic argument, and it is not even true here: the differences grow.' },
  ]);
};
const agreeStep: Gen = (R, n) => {
  const c = int(R, 2, 9), r = int(R, 2, 5);
  if (c === r) return agreeStep(R, n);
  return choice(R, {
    id: `agreeStep-${n}`, family: 'agreeStep', prompt: `In the proof that b<sub>n</sub> = ${c} · ${r}<sup>n−1</sup> follows the rule b<sub>n</sub> = ${r} · b<sub>n−1</sub>, you need ${r} · b<sub>n−1</sub> = ${r} · ${c} · ${r}<sup>n−2</sup>. What does that equal?`,
    board: `${r} \\cdot ${c} \\cdot ${r}^{n-2} = \\,?`,
    solution: [`${r} · ${r}<sup>n−2</sup> = ${r}<sup>n−2+1</sup> = ${r}<sup>n−1</sup> (one more factor ${r}).`, `So ${r} · b<sub>n−1</sub> = ${c} · ${r}<sup>n−1</sup> = b<sub>n</sub>.`],
  }, [
    { t: `${c} · ${r}<sup>n−1</sup>`, ok: true, say: 'Right: one more factor raises the exponent by one.' },
    { t: `${c * r}<sup>n−2</sup>`, mc: MC.beyondBase, say: `The exponent n − 2 belongs to ${r} only; ${c} is not raised to it.` },
    { t: `${c} · ${r * r}<sup>n−2</sup>`, say: `${r} · ${r}<sup>n−2</sup> adds ONE factor ${r}; it does not square the base.` },
    { t: `${c} · ${r}<sup>n−2</sup> + ${r}`, mc: MC.addFactor, say: 'Multiplying by r is not adding r.' },
  ]);
};

// =====================================================================================================================
// 23 diagnose-index
// =====================================================================================================================
interface Flaw { prompt: string; board: string; right: string; why: string; kind: number }
function flaw(R: () => number): Flaw & { fixed: { c: Q; r: Q; n0: number; s: string; unit: string; money?: boolean }; wrongV: (k: number) => Q } {
  const kind = int(R, 0, 3);
  if (kind === 0) {
    let P = 0, pp = 0;
    do { P = pick(R, [5000, 2500, 8000, 4000]); pp = pick(R, [4, 5, 10]); } while ([2, 3].some(k => val(term(qi(P), q(100 + pp, 100), k, 0)) % 1 !== 0));
    const r = q(100 + pp, 100);
    return { kind, prompt: `A town has ${numP(P)} people now and grows ${pp}% per year. Lee writes P<sub>n</sub> = ${expH(qi(P), r, 1, true)}, with n = years from now (n ≥ 0).`, board: `P_n = ${expT(qi(P), r, 1, true)},\\ n \\ge 0`,
      right: `The exponent should be n: P<sub>0</sub> must be ${numP(P)}, but Lee's model gives ${numP(P)} ÷ ${qH(r, true)} at n = 0`, why: 'With n = years from now, now is n = 0 and the exponent counts the years.',
      fixed: { c: qi(P), r, n0: 0, s: 'P', unit: 'people' }, wrongV: k => term(qi(P), r, k, 1) };
  }
  if (kind === 1) {
    const V = pick(R, [18000, 24000, 30000]), pp = pick(R, [15, 20, 25]), r = q(100 - pp, 100), bad = q(pp, 100);
    return { kind, prompt: `A car worth ${usd(V)} now loses ${pp}% of its value each year. Mia writes V<sub>n</sub> = ${expH(qi(V), bad, 0, true)}, with n = years from now (n ≥ 0).`, board: `V_n = ${expT(qi(V), bad, 0, true)},\\ n \\ge 0`,
      right: `The factor should be ${qH(r, true)}: losing ${pp}% keeps ${100 - pp}%`, why: `Losing ${pp}% each year keeps ${100 - pp}%: the factor is ${qH(r, true)}.`,
      fixed: { c: qi(V), r, n0: 0, s: 'V', unit: 'dollars', money: true }, wrongV: k => term(qi(V), bad, k, 0) };
  }
  if (kind === 2) {
    const c = int(R, 2, 5), m = int(R, 2, 3), bad = c * m;
    return { kind, prompt: `Row 1 of a can display has ${c} cans, and each row has ${m} times as many cans as the row before. Mo writes c<sub>n</sub> = ${expH(qi(bad), qi(m))} for n ≥ 1 (n = row number).`, board: `c_n = ${expT(qi(bad), qi(m))},\\ n \\ge 1`,
      right: `The front number should be ${c}: at n = 1 the model must give ${c} cans, not ${bad}`, why: `c<sub>1</sub> = ${bad} · ${m}<sup>0</sup> = ${bad}, but row 1 has ${c}.`,
      fixed: { c: qi(c), r: qi(m), n0: 1, s: 'c', unit: 'cans' }, wrongV: k => term(qi(bad), qi(m), k, 1) };
  }
  const [H, r] = pick(R, [[81, q(2, 3)], [64, q(3, 4)], [96, q(1, 2)]] as [number, Q][]);
  return { kind, prompt: `A ball's first bounce reaches ${H} inches; each bounce reaches ${qH(r)} of the one before. Ana writes h<sub>n</sub> = ${expH(qi(H), r)} for n ≥ 0, with n = bounce number.`, board: `h_n = ${expT(qi(H), r)},\\ n \\ge 0`,
    right: 'The domain should be n ≥ 1: bounce 1 is the first bounce, and there is no bounce 0', why: `h<sub>0</sub> = ${numP(div(qi(H), r))} would be a bounce higher than the first one.`,
    fixed: { c: qi(H), r, n0: 1, s: 'h', unit: 'inches' }, wrongV: k => term(qi(H), r, k, 1) };
}
const fixModel: Gen = (R, n) => {
  const F = flaw(R);
  const others = [
    'The exponent should be n − 1 instead of n',
    'The factor should be the percent itself, written as a decimal',
    `The domain should include n = 2.5`,
  ];
  const opts: Opt[] = [
    { t: F.right, ok: true, say: `Right. ${F.why}` },
    { t: 'Nothing: it shows the starting value and the ratio, so it fits', mc: MC.coefOnly, say: `Check it at the first index: ${F.why}` },
  ];
  if (F.kind !== 0) opts.push({ t: others[0]!, mc: F.kind === 1 ? MC.shift1 : undefined, say: F.why });
  if (F.kind !== 1) opts.push({ t: others[1]!, mc: MC.factorRate, say: 'A percent change is not the factor: the factor is 1 plus or minus the rate.' });
  if (F.kind === 3 || opts.length < 4) opts.push({ t: others[2]!, mc: MC.fracIdx, say: 'n counts whole steps: there is no step 2.5.' });
  return choice(R, {
    id: `fixModel-${n}`, family: 'fixModel', prompt: `${F.prompt} What is wrong with the model?`, board: F.board,
    solution: [F.why, `Fix: ${F.right.charAt(0).toLowerCase() + F.right.slice(1)}.`],
  }, opts.slice(0, 4));
};
const fixValue: Gen = (R, n) => {
  let F = flaw(R);
  while (F.kind === 3) F = flaw(R);
  const k = int(R, 2, 3), X = F.fixed, v = term(X.c, X.r, k, X.n0), w = F.wrongV(k);
  const show = (x: Q) => (X.money ? usd(x) : numP(x));
  return numItem({
    id: `fixValue-${n}`, family: 'fixValue', unit: X.unit,
    prompt: `${F.prompt} The model has one mistake. Using the CORRECTED model, what is ${X.s}<sub>${k}</sub>? (Calculator allowed.)`, board: F.board,
    solution: [`${F.why}`, `Corrected: ${X.s}<sub>n</sub> = ${expH(X.c, X.r, X.n0, true)}, so ${X.s}<sub>${k}</sub> = ${ans(show(v))}.`],
  }, v, `Right: ${show(v)}.`, [[w, MC.coefOnly, `That is the value of the model as written. Fix the mistake first: ${F.why}`]], `Fix the model first (${F.why.replace(/<[^>]+>/g, '')}), then put n = ${k} in.`);
};

export const FAM2: Record<string, Gen> = {
  gapRatio, gapCube, backFirst, backFormula, zeroStart, zeroOrOne, relabel, relabelValue, rewriteCoef, rewriteVsRelabel, factorPct, compound,
  ctxEval, ctxMeaning, firstCross, crossCheck, modelType, critique, agreeWhy, agreeStep, fixModel, fixValue,
};
void A;
