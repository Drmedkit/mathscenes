// famB.ts: practice families for z-scores and areas: what a z-score means, computing and comparing z, standardizing an
// event, left / right / between / outside areas from a z-table excerpt (z rounded to 2 places, cumulative-left table,
// 4 decimal places), the calculator command, a model from data summaries, mixed problems, and the inverse direction.
// Every table item says its method; the table excerpt is part of the picture. Pure: no DOM.
import {
  type Cand, type Gen, type NCtx, type NPic, type NShade, type Opt, A, B, MC, NN, NT, a4, choice, cnt, ctxById, ctxPick, fix, fmt,
  int, modelPick, normalCurve, numItem, pairItem, pick, sdAxis, until, valueIn, withU, RULE,
} from './common';
import { CENTRAL, HALF, Phi, benchPct, normalcdf, r9, roundTo, safeRound, tableArea, tableSafe, zForArea, zForAreaClear } from './normMaths';
import { histCardFor } from './famA';

const S = (s: string | number) => `<b class="s">${s}</b>`;
const zf = (z: number) => fix(z, 2);
const sign = (k: number) => (k < 0 ? '−' : '+');
const sds = (k: number) => (Math.abs(k) === 1 ? 'SD' : 'SDs');

// ===================== z-scores =====================
/** a value x on the context's grid with z in [lo, hi], z safe to round to 2 places and its table entry safe */
function valueZ(R: () => number, c: NCtx, m: number, s: number, lo: number, hi: number, minAbs = 0.1, table = true): { x: number; z: number; z2: number } {
  return until(() => {
    const x = valueIn(R, c, m + lo * s, m + hi * s), z = (x - m) / s;
    return { x, z, z2: roundTo(z, 2) };
  }, t => Math.abs(t.z) >= minAbs && t.z >= lo - 1e-9 && t.z <= hi + 1e-9 && safeRound(t.z, 2, 0.04) && (!table || (Math.abs(t.z2) <= 3.49 && tableSafe(t.z2))) && t.x > (c.floor ?? -1e9));
}

export const zRead: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const z = pick(R, [-3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3]), dist = r9(Math.abs(z) * s), side = z < 0 ? 'below' : 'above', other = z < 0 ? 'above' : 'below';
  const opts: Opt[] = [
    { t: `${fmt(Math.abs(z))} ${sds(z)} ${side} the mean: ${withU(c, dist)} ${side} ${withU(c, m)}`, ok: true, say: `Yes: |z| counts SDs, the sign says ${side}.` },
    { t: `${withU(c, Math.abs(z))} ${side} the mean`, mc: MC.noScale, say: `z counts SDs, not ${c.unit}. ${fmt(Math.abs(z))} ${sds(z)} = ${fmt(Math.abs(z))} × ${fmt(s)} = ${withU(c, dist)}.` },
    { t: `${fmt(Math.abs(z))} ${sds(z)} ${other} the mean`, mc: MC.dropSign, say: `The sign matters: z ${z < 0 ? '< 0 is below' : '> 0 is above'} the mean.` },
    z < 0
      ? { t: 'Nothing: a z-score cannot be negative', mc: MC.zNeg, say: 'A negative z-score is fine: it means below the mean.' }
      : { t: `In the top ${fmt(z)}% of ${c.who}`, mc: MC.zPct, say: 'A z-score is a distance in SDs, not a percent.' },
  ];
  return choice(R, {
    id: `z-read-${n}`, family: 'zRead',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. One ${c.one} has a z-score (standardized score) of ${B(`z = ${fmt(z).replace('−', '−')}`)}. What does that say?`,
    board: `${NT(m, s)} \\qquad z = ${fmt(z).replace('−', '-')}`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)] } },
    solution: ['A z-score is a signed distance from the mean, counted in SDs.', `z = ${fmt(z)}: ${fmt(Math.abs(z))} ${sds(z)} ${side} the mean, ${fmt(Math.abs(z))} × ${fmt(s)} = ${withU(c, dist)}.`],
  }, opts);
};

export const zLocate: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const z = pick(R, [-2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5]), x = r9(m + z * s);
  return numItem({
    id: `z-loc-${n}`, family: 'zLocate',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. What ${c.what} has a z-score of ${B(`z = ${fmt(z)}`)}?`,
    board: `x = \\mu + z\\sigma = \\,?`,
    unit: c.unit,
    picture: { card: { x: sdAxis(c, m, s, { show: [m] }), curves: [normalCurve(m, s)] } },
    solution: [`z = ${fmt(z)}: ${fmt(Math.abs(z))} ${sds(z)} ${z < 0 ? 'below' : 'above'} the mean.`, `${fmt(m)} ${sign(z)} ${fmt(Math.abs(z))} × ${fmt(s)} = ${S(fmt(x))}`],
    ex: { m, s, z, x },
  }, x, 'plain', `Yes: ${fmt(m)} ${sign(z)} ${fmt(Math.abs(z))} × ${fmt(s)} = ${fmt(x)}.`, [
    [r9(m + z), MC.invFormula, `z counts SDs. Move ${fmt(Math.abs(z))} × ${fmt(s)} = ${fmt(Math.abs(z) * s)}, not ${fmt(Math.abs(z))}.`],
    [r9(m - z * s), MC.dropSign, `A ${z < 0 ? 'negative z is below' : 'positive z is above'} the mean.`],
    [r9(z * s), MC.sdEndpoint, `${fmt(z * s)} is the distance from the mean. Add it to the mean.`],
  ], 'x = mean + z × SD.');
};

export const zCalc: Gen = (R, n) => {
  const beyond = R() < 0.2;
  const c = ctxPick(R, beyond ? ['women', 'men', 'dog', 'temp', 'iq'] : ['women', 'men', 'dog', 'temp', 'sat', 'iq']), [m, s] = modelPick(R, c);
  const { x } = valueZ(R, c, m, s, beyond ? 3.05 : -3, beyond ? 3.8 : 3, 0, false);
  const xs = beyond && R() < 0.5 ? r9(2 * m - x) : x;
  const zz = (xs - m) / s, zz2 = roundTo(zz, 2);
  const exact = Math.abs(zz * 100 - Math.round(zz * 100)) < 1e-6;
  return numItem({
    id: `z-calc-${n}`, family: 'zCalc',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. Find the z-score of ${B(withU(c, xs))}.${exact ? '' : ' Round to 2 decimal places.'}`,
    board: `z = \\dfrac{x - \\mu}{\\sigma} = \\dfrac{${fmt(xs)} - ${fmt(m)}}{${fmt(s)}}`,
    picture: { card: { x: sdAxis(c, m, s, { k: Math.abs(zz) > 3.5 ? 5 : 4, show: [m] }), curves: [normalCurve(m, s)], vlines: [{ key: 'v', x: xs, col: 'pick' }] } },
    solution: [`Distance from the mean: ${fmt(xs)} − ${fmt(m)} = ${fmt(xs - m)}.`, `Divide by the SD: ${fmt(xs - m)} ÷ ${fmt(s)} = ${S(zf(zz2))}`],
    ex: { x: xs, m, s, z: zz2 },
  }, zz2, 'plain', `Yes: z = ${zf(zz2)}${Math.abs(zz2) > 3 ? ': more than 3 SDs out, rare but possible' : ''}.`, [
    [r9(xs - m), MC.noScale, `${fmt(xs - m)} is the distance in ${c.unit}. Divide by the SD ${fmt(s)} to count SDs.`],
    [-zz2, MC.dropSign, `${fmt(xs)} is ${xs < m ? 'below' : 'above'} the mean, so z is ${xs < m ? 'negative' : 'positive'}.`],
    [roundTo(xs - m / s, 2), MC.grouping, 'Subtract first, then divide: z = (x − μ) ÷ σ. The bar groups x − μ.'],
  ], 'z = (x − mean) ÷ SD.', 0.005);
};

export const zCalcDec: Gen = (R, n) => {
  const c = ctxPick(R, ['newborn', 'apple', 'run']), [m, s] = modelPick(R, c);
  const { x } = valueZ(R, c, m, s, -3.4, 3.4, 0.2);
  const d = r9(x - m), z2 = roundTo(d / s, 2);
  const lessWord = c.id === 'run' ? 'faster' : 'lighter', moreWord = c.id === 'run' ? 'slower' : 'heavier';
  return numItem({
    id: `z-dec-${n}`, family: 'zCalcDec',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. One ${c.one} is ${B(withU(c, Math.abs(d)))} ${d < 0 ? lessWord : moreWord} than the mean. What is its z-score? Round to 2 decimal places (calculator allowed).`,
    board: `z = \\dfrac{x - \\mu}{\\sigma}`,
    solution: [`${d < 0 ? lessWord[0]!.toUpperCase() + lessWord.slice(1) : moreWord[0]!.toUpperCase() + moreWord.slice(1)} than the mean: x − μ = ${fmt(d)}.`, `z = ${fmt(d)} ÷ ${fmt(s)} = ${S(zf(z2))}`],
    ex: { d, s, z: z2 },
  }, z2, 'plain', `Yes: ${fmt(d)} ÷ ${fmt(s)} ≈ ${zf(z2)}.`, [
    [-z2, MC.dropSign, `${d < 0 ? lessWord : moreWord} than the mean means ${d < 0 ? 'below' : 'above'} it: z is ${d < 0 ? 'negative' : 'positive'}.`],
    [d, MC.noScale, `${fmt(d)} is in ${c.unit}. Divide by the SD to count SDs.`],
    [roundTo(s / d, 2), undefined, 'Distance ÷ SD, not SD ÷ distance.'],
  ], 'z = (distance from the mean, with its sign) ÷ SD.', 0.005);
};

const TESTS: [string, number, number][] = [['chemistry test', 72, 8], ['history test', 80, 5], ['math test', 68, 10], ['English test', 78, 6], ['biology test', 75, 7], ['physics test', 64, 9]];
export const zCompare: Gen = (R, n) => {
  const [[ta, ma, sa], [tb, mb, sb]] = until(() => [pick(R, TESTS), pick(R, TESTS)], ([p, q]) => p[0] !== q[0]);
  const flip = R() < 0.55;   // the higher raw score has the lower z
  const { xa, xb, za, zb } = until(() => {
    const xa = int(R, Math.ceil(ma - 1.5 * sa), Math.min(99, Math.floor(ma + 2.4 * sa))), xb = int(R, Math.ceil(mb - 1.5 * sb), Math.min(99, Math.floor(mb + 2.4 * sb)));
    return { xa, xb, za: (xa - ma) / sa, zb: (xb - mb) / sb };
  }, t => Math.abs(t.za - t.zb) >= 0.15 && t.xa !== t.xb && ((t.xa > t.xb) !== (t.za > t.zb)) === flip);
  const nA = pick(R, ['Ana', 'Maya', 'Lena', 'Priya']), nB = pick(R, ['Ben', 'Omar', 'Jake', 'Diego']);
  const aWins = za > zb, rawA = xa > xb;
  const opts: Opt[] = [
    { t: nA, ok: aWins, mc: !aWins && rawA ? MC.raw : undefined, say: aWins ? `Yes: z = ${zf(za)} against ${zf(zb)}.` : `${nA}'s z is ${zf(za)}, ${nB}'s is ${zf(zb)}. ${rawA ? 'A higher raw score on an easier or more spread-out test can mean less.' : ''}` },
    { t: nB, ok: !aWins, mc: aWins && !rawA ? MC.raw : undefined, say: !aWins ? `Yes: z = ${zf(zb)} against ${zf(za)}.` : `${nB}'s z is ${zf(zb)}, ${nA}'s is ${zf(za)}. ${!rawA ? 'Raw scores on different tests do not compare directly.' : ''}` },
    { t: 'They did equally well', say: `Their z-scores differ: ${zf(za)} and ${zf(zb)}.` },
  ];
  return choice(R, {
    id: `z-cmp-${n}`, family: 'zCompare',
    prompt: `${nA} scored ${A(xa)} on a ${ta} (scores modeled by ${NN(ma, sa)}). ${nB} scored ${B(xb)} on a ${tb} (${NN(mb, sb)}). Who did better compared with the others who took the same test?`,
    board: `z_{\\text{${nA}}} = \\dfrac{${xa} - ${ma}}{${sa}} \\qquad z_{\\text{${nB}}} = \\dfrac{${xb} - ${mb}}{${sb}}`,
    solution: [`${nA}: z = (${xa} − ${ma}) ÷ ${sa} = ${zf(za)}.`, `${nB}: z = (${xb} − ${mb}) ÷ ${sb} = ${zf(zb)}.`, `The larger z stands out more: ${aWins ? nA : nB}.`],
  }, opts, true);
};

export const zMatch: Gen = (R, n) => {
  const [[ta, ma, sa], [tb, mb, sb]] = until(() => [pick(R, TESTS), pick(R, TESTS)], ([p, q]) => p[0] !== q[0] && p[2] !== q[2]);
  const { xa, z, xb } = until(() => { const xa = int(R, Math.ceil(ma - 2 * sa), Math.min(99, Math.floor(ma + 2.2 * sa))), z = (xa - ma) / sa; return { xa, z, xb: mb + z * sb }; },
    t => t.xa !== ma && t.xb <= 100 && safeRound(t.xb, 1, 0.04));
  const ans = roundTo(xb, 1);
  return numItem({
    id: `z-match-${n}`, family: 'zMatch',
    prompt: `Maria scored ${A(xa)} on a ${ta} (${NN(ma, sa)}). What score on a ${tb} (${NN(mb, sb)}) would have the same z-score? Keep z unrounded; round the score to 1 decimal place.`,
    board: `z = \\dfrac{${xa} - ${ma}}{${sa}} \\qquad x = ${mb} + z \\cdot ${sb}`,
    solution: [`Maria's z = (${xa} − ${ma}) ÷ ${sa} = ${fmt(z, 4)}.`, `Same z on the other test: ${mb} ${sign(z)} ${fmt(Math.abs(z), 4)} × ${sb} = ${S(fmt(ans, 1))}`],
    ex: { z, ans },
  }, ans, 'plain', `Yes: the same number of SDs from the mean: ${fmt(ans, 1)}.`, [
    [xa, MC.raw, 'The same raw score means something different on a test with another mean and SD.'],
    [r9(mb + (xa - ma)), MC.raw, `That keeps the raw distance (${fmt(xa - ma)} points). Keep the distance in SDs instead.`],
    [roundTo(mb - z * sb, 1), MC.dropSign, `Maria is ${xa > ma ? 'above' : 'below'} her mean, so the match is ${xa > ma ? 'above' : 'below'} the other mean.`],
  ], 'Find her z, then x = mean + z × SD on the other test.', 0.05);
};

// ===================== standardize an event =====================
export const stdEvent: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const { x, z2 } = valueZ(R, c, m, s, -2.6, 2.6, 0.2);
  const lt = R() < 0.5, op = lt ? '<' : '>';
  const opts: Opt[] = [
    { t: `P(Z ${op} ${zf(z2)})`, ok: true, say: 'Yes: standardizing moves both the value and the curve, so the area stays the same.' },
    { t: `P(Z ${op} ${zf(-z2)})`, mc: MC.dropSign, say: `${fmt(x)} is ${x < m ? 'below' : 'above'} the mean, so its z is ${x < m ? 'negative' : 'positive'}.` },
    { t: `P(Z ${op} ${fmt(r9(x - m))})`, mc: MC.noScale, say: `${fmt(x - m)} is the distance in ${c.unit}. Divide by the SD.` },
    { t: `None of these: standardizing changes the probability`, mc: MC.stdChanges, say: 'The event and the area match one for one: the probability does not change.' },
  ];
  return choice(R, {
    id: `std-ev-${n}`, family: 'stdEvent',
    prompt: `X is the ${c.what} of a random ${c.one}, X ~ ${A(NN(m, s))}. Which probability equals ${B(`P(X ${op} ${fmt(x)})`)}? (z rounded to 2 decimal places)`,
    board: `P(X ${op} ${fmt(x)}) = P\\left(Z ${op} \\dfrac{${fmt(x)} - ${fmt(m)}}{${fmt(s)}}\\right)`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: lt ? m - 6 * s : x, hi: lt ? x : m + 6 * s, on: 'C' }] } },
    solution: [`z = (${fmt(x)} − ${fmt(m)}) ÷ ${fmt(s)} ≈ ${zf(z2)}.`, `Same event on the standard scale: P(Z ${op} ${zf(z2)}).`],
  }, opts);
};

export const stdBetween: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const A1 = valueZ(R, c, m, s, -2.5, 0.8, 0.1);
  const B1 = until(() => valueZ(R, c, m, s, -1, 2.5, 0.1), t => t.z - A1.z >= 0.4);
  return pairItem({
    id: `std-btw-${n}`, family: 'stdBetween',
    prompt: `X ~ ${A(NN(m, s))} (the ${c.what} of a random ${c.one}). Rewrite ${B(`P(${fmt(A1.x)} < X < ${fmt(B1.x)})`)} on the standard normal scale. Round each z to 2 decimal places.`,
    board: `P(${fmt(A1.x)} < X < ${fmt(B1.x)}) \\qquad = P(\\,?\\, < Z < \\,?\\,)`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: A1.x, hi: B1.x, on: 'C' }] } },
    solution: [`Lower end: (${fmt(A1.x)} − ${fmt(m)}) ÷ ${fmt(s)} ≈ ${S(zf(A1.z2))}.`, `Upper end: (${fmt(B1.x)} − ${fmt(m)}) ÷ ${fmt(s)} ≈ ${S(zf(B1.z2))}.`, 'The order stays: the probability is unchanged.'],
    ex: { za: A1.z2, zb: B1.z2 },
  }, A1.z2, B1.z2, { lead: 'P(', op: '< Z <', tail: ')' }, `Yes: P(${zf(A1.z2)} < Z < ${zf(B1.z2)}).`, [
    [B1.z2, A1.z2, undefined, 'Keep the order: the smaller z on the left.'],
    [r9(A1.x - m), r9(B1.x - m), MC.noScale, 'Those are distances in ' + c.unit + '. Divide each by the SD.'],
  ], 'z = (x − mean) ÷ SD for each end, in the same order.', 0.005);
};

// ===================== the table engine =====================
type TT = 'below' | 'above' | 'between' | 'outside';
interface TProb { x: number[]; z: number[]; A: number[]; ans: number; words: string; P: string; cands: Cand[]; rows: [number, number][]; shades: NShade[]; sol: string[] }
function rowsFor(zs: number[], decoy: boolean): [number, number][] {
  const set = new Set<number>();
  for (const z of zs) { set.add(roundTo(z, 2)); set.add(roundTo(z + 0.01, 2)); if (zs.length === 1) set.add(roundTo(z - 0.01, 2)); }
  if (decoy && zs.length === 1 && Math.abs(zs[0]!) >= 0.1) set.add(roundTo(-zs[0]!, 2));
  return [...set].filter(z => Math.abs(z) <= 3.49).sort((a, b) => a - b).map(z => [z, tableArea(z)]);
}
const tA = (z: number) => a4(tableArea(z));
function tableProb(R: () => number, c: NCtx, m: number, s: number, t: TT, wording: 'plain' | 'atleast' | 'nomore' | 'within' | 'away' = 'plain'): TProb {
  const L = m - 6 * s, Rt = m + 6 * s;
  if (t === 'below' || t === 'above') {
    const v = valueZ(R, c, m, s, -2.7, 2.7, 0.12), Az = tableArea(v.z2);
    const below = t === 'below', ans = below ? Az : roundTo(1 - Az, 4);
    const w = below ? (wording === 'nomore' ? `no more than ${withU(c, v.x)}` : `${c.less} than ${withU(c, v.x)}`) : (wording === 'atleast' ? `at least ${withU(c, v.x)}` : `${c.more} than ${withU(c, v.x)}`);
    return {
      x: [v.x], z: [v.z2], A: [Az], ans, words: w, P: below ? `P(X ${wording === 'nomore' ? '\\le' : '<'} ${fmt(v.x)})` : `P(X ${wording === 'atleast' ? '\\ge' : '>'} ${fmt(v.x)})`,
      rows: rowsFor([v.z2], true), shades: [{ key: 'sh', lo: below ? L : v.x, hi: below ? v.x : Rt, on: 'C' }],
      cands: below
        ? [[roundTo(1 - Az, 4), MC.misread, `The table gives the area to the LEFT of z. ${c.less[0]!.toUpperCase() + c.less.slice(1)} than is the left area itself: no subtracting.`], [v.z2, MC.zPct, `${zf(v.z2)} is the z-score, not the area. Look it up in the table.`]]
        : [[Az, MC.leftDefault, `${tA(v.z2)} is the area to the LEFT of ${fmt(v.x)}. ${c.more[0]!.toUpperCase() + c.more.slice(1)} than is the right side: 1 − ${tA(v.z2)}.`], [v.z2, MC.zPct, `${zf(v.z2)} is the z-score, not the area.`]],
      sol: [`z = (${fmt(v.x)} − ${fmt(m)}) ÷ ${fmt(s)} ≈ ${zf(v.z2)}; the table gives ${tA(v.z2)} to the left.`, below ? `${c.less[0]!.toUpperCase() + c.less.slice(1)}: the left area, ${S(a4(ans))}` : `${c.more[0]!.toUpperCase() + c.more.slice(1)}: 1 − ${tA(v.z2)} = ${S(a4(ans))}`],
    };
  }
  let a: { x: number; z: number; z2: number }, b: { x: number; z: number; z2: number };
  if (wording === 'within' || wording === 'away') {
    const v = valueZ(R, c, m, s, 0.3, 2.4, 0.3);
    a = { x: r9(2 * m - v.x), z: -v.z, z2: -v.z2 }; b = v;
  } else if (t === 'between') {
    const mode = pick(R, ['below', 'above', 'straddle', 'straddle']);
    const [lo1, hi1, lo2, hi2] = mode === 'below' ? [-2.6, -1, -1.2, -0.1] : mode === 'above' ? [0.1, 1.2, 1, 2.6] : [-2.4, -0.2, 0.2, 2.4];
    a = valueZ(R, c, m, s, lo1, hi1, 0.1);
    const aa = a;
    b = until(() => valueZ(R, c, m, s, lo2, hi2, 0.1), q => q.z - aa.z >= 0.35 && Math.abs(Math.abs(q.z2) - Math.abs(aa.z2)) >= 0.1);
  } else {
    a = valueZ(R, c, m, s, -2.5, -0.3, 0.3);
    const aa = a;
    b = until(() => valueZ(R, c, m, s, 0.3, 2.5, 0.3), q => Math.abs(q.z2 + aa.z2) >= 0.2);
  }
  const Aa = tableArea(a.z2), Ab = tableArea(b.z2);
  const sym = wording === 'within' || wording === 'away';
  const d = r9(b.x - m);
  if (t === 'between') {
    const ans = roundTo(Ab - Aa, 4);
    return {
      x: [a.x, b.x], z: [a.z2, b.z2], A: [Aa, Ab], ans,
      words: sym ? `within ${withU(c, d)} of the mean` : `between ${withU(c, a.x)} and ${withU(c, b.x)}`,
      P: `P(${fmt(a.x)} < X < ${fmt(b.x)})`, rows: rowsFor([a.z2, b.z2], false), shades: [{ key: 'sh', lo: a.x, hi: b.x, on: 'C' }],
      cands: [[roundTo(Aa - Ab, 4), MC.ftcRev, 'Subtract the smaller cumulative area from the larger: F(upper) − F(lower).'],
        [roundTo(Aa + Ab, 4), MC.betweenCum, 'Adding the two left areas counts the part below the lower end twice. Subtract instead.'],
        [Ab, MC.misread, `${tA(b.z2)} is everything to the left of ${fmt(b.x)}, including the part below ${fmt(a.x)}. Take that part away.`],
        [roundTo(1 - (Ab - Aa), 4), undefined, 'That is the area outside the interval.']],
      sol: [`z-scores: ${zf(a.z2)} and ${zf(b.z2)}; the table gives ${tA(a.z2)} and ${tA(b.z2)} to the left.`, `Between = ${tA(b.z2)} − ${tA(a.z2)} = ${S(a4(ans))}`],
    };
  }
  const ans = roundTo(Aa + (1 - Ab), 4);
  return {
    x: [a.x, b.x], z: [a.z2, b.z2], A: [Aa, Ab], ans,
    words: sym ? `more than ${withU(c, d)} away from the mean` : `${c.less} than ${withU(c, a.x)} or ${c.more} than ${withU(c, b.x)}`,
    P: `P(X < ${fmt(a.x)}\\ \\text{or}\\ X > ${fmt(b.x)})`, rows: rowsFor([a.z2, b.z2], false),
    shades: [{ key: 'sh', lo: L, hi: a.x, on: 'C' }, { key: 'sh2', lo: b.x, hi: Rt, on: 'C' }],
    cands: [
      ...(sym ? [] : [[roundTo(2 * Aa, 4), MC.doubleTail, 'Doubling one tail works only when the two tails are mirror images. These are not: add the two tails.'] as Cand,
        [roundTo(2 * (1 - Ab), 4), MC.doubleTail, 'The two tails are not the same size here: find each one and add.'] as Cand]),
      [roundTo(Ab - Aa, 4), undefined, 'That is the area between the two values. Outside is what is left: the two tails.'],
      [roundTo(Aa + Ab, 4), MC.misread, `${tA(b.z2)} is the area to the LEFT of ${fmt(b.x)}. The right tail is 1 − ${tA(b.z2)}.`],
      [Aa, undefined, 'That is only the left tail. Add the right tail.'],
    ],
    sol: [`Left tail: z ≈ ${zf(a.z2)}, area ${tA(a.z2)}.`, `Right tail: z ≈ ${zf(b.z2)}, area 1 − ${tA(b.z2)} = ${a4(1 - Ab)}.`, `Outside = ${tA(a.z2)} + ${a4(1 - Ab)} = ${S(a4(ans))}`],
  };
}
function tableItem(R: () => number, n: number, fam: string, t: TT, wording: Parameters<typeof tableProb>[5], o: { ctx?: string[]; count?: boolean; model?: [number, number]; lead?: string } = {}) {
  const c = ctxPick(R, o.ctx), [m, s] = o.model ?? modelPick(R, c);
  const P = tableProb(R, c, m, s, t, wording);
  const N = o.count ? until(() => pick(R, c.Ns), N => safeRound(N * P.ans, 0, 0.03)) : 0;
  const ans = o.count ? Math.round(N * P.ans) : P.ans;
  const pic: NPic = { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: P.shades }, table: { rows: P.rows } };
  const lead = o.lead ?? `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}.`;
  return numItem({
    id: `${fam}-${n}`, family: fam,
    prompt: `${lead} ${o.count ? `Of ${cnt(N)} ${c.who}, about how many are` : 'What proportion of them are'} ${B(P.words)}? ${RULE.table} ${o.count ? 'Round the count to a whole number.' : RULE.area4}`,
    board: t === 'outside' ? `X \\sim ${NT(m, s)} \\qquad X < ${fmt(P.x[0]!)}\\ \\text{or}\\ X > ${fmt(P.x[1]!)}` : `X \\sim ${NT(m, s)} \\qquad ${P.P.replace(/−/g, '-')} = \\,?`,
    unit: o.count ? c.noun : undefined,
    picture: pic,
    solution: o.count ? [...P.sol, `${cnt(N)} × ${a4(P.ans)} ≈ ${S(cnt(ans))}`] : P.sol,
    ex: { z: P.z, A: P.A, ans, N },
  }, ans, o.count ? 'plain' : 'area', o.count ? `Yes: about ${cnt(ans)} (a model estimate).` : `Yes: ${a4(ans)}, about ${fmt(ans * 100, 2)}%.`,
  o.count ? P.cands.filter(([v]) => v >= 0 && v <= 1 && v !== P.z[0]).map(([v, mc, say]) => [Math.round(N * v), mc, say] as Cand) : P.cands,
  `Sketch it: which side, or both? Then use the table's left areas (${P.z.map(zf).join(' and ')}).`, o.count ? 0 : 0.0001);
}

export const leftTable: Gen = (R, n) => tableItem(R, n, 'leftTable', 'below', R() < 0.3 ? 'nomore' : 'plain');
export const leftCount: Gen = (R, n) => tableItem(R, n, 'leftCount', 'below', 'plain', { count: true });
export const rightTable: Gen = (R, n) => tableItem(R, n, 'rightTable', 'above', R() < 0.4 ? 'atleast' : 'plain');
export const betweenTable: Gen = (R, n) => tableItem(R, n, 'betweenTable', 'between', 'plain');
export const outsideTable: Gen = (R, n) => tableItem(R, n, 'outsideTable', 'outside', 'plain');
export const outsideSym: Gen = (R, n) => tableItem(R, n, 'outsideSym', 'outside', 'away');
export const mixedFull: Gen = (R, n) => {
  const t = pick(R, ['below', 'above', 'between', 'outside', 'between', 'outside'] as TT[]);
  const w = t === 'below' ? pick(R, ['plain', 'nomore'] as const) : t === 'above' ? pick(R, ['plain', 'atleast'] as const) : t === 'between' ? pick(R, ['plain', 'within'] as const) : pick(R, ['plain', 'away'] as const);
  return tableItem(R, n, 'mixedFull', t, w);
};
export const mixedData: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'men', 'newborn', 'dog', 'apple', 'run']);
  const [m0, s0] = modelPick(R, c);
  const nS = pick(R, [60, 80, 120, 150, 200]);
  const m = roundTo(m0 + int(R, -3, 3) * (c.dx ? 0.1 : 1) * (c.id === 'newborn' || c.id === 'apple' ? 0.5 : 1), 2), s = roundTo(s0 + int(R, -2, 2) * 0.1 * (c.id === 'newborn' || c.id === 'apple' ? 0.5 : 1), 2);
  const t = pick(R, ['below', 'above', 'between'] as TT[]);
  return tableItem(R, n, 'mixedData', t, t === 'above' ? 'atleast' : 'plain', {
    ctx: [c.id], count: true, model: [m, s],
    lead: `A random sample of ${nS} ${c.who} has a roughly symmetric, single-peaked histogram with mean ${A(withU(c, m))} and SD ${A(withU(c, s))}. Use these as the model's mean and SD.`,
  });
};

// ===================== the calculator =====================
export const rightSupplied: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const x = until(() => valueIn(R, c, m - 2.4 * s, m + 2.6 * s), x => x !== m && safeRound(Phi((x - m) / s), 4, 0.03));
  const Lft = roundTo(Phi((x - m) / s), 4), ans = roundTo(1 - Lft, 4);
  const w = R() < 0.5 ? 'at least' : 'more than';
  return numItem({
    id: `right-sup-${n}`, family: 'rightSupplied',
    prompt: `X ~ ${A(NN(m, s))}, the ${c.what} of ${c.who}. The area to the ${B("left")} of ${withU(c, x)} is ${a4(Lft)} (normalcdf). What proportion are ${B(`${w} ${withU(c, x)}`)}? Give 4 decimal places.`,
    board: `P(X ${w === 'at least' ? '\\ge' : '>'} ${fmt(x)}) = \\,?`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: x, hi: m + 6 * s, on: 'C' }] }, calc: { title: 'normalcdf', lines: ['lower: −1E99', `upper: ${fmt(x)}`, `μ: ${fmt(m)}`, `σ: ${fmt(s)}`, `area: ${a4(Lft)}`] } },
    solution: [`The calculator's ${a4(Lft)} is the area to the LEFT of ${fmt(x)}.`, `${w[0]!.toUpperCase() + w.slice(1)} ${fmt(x)} is the right side: 1 − ${a4(Lft)} = ${S(a4(ans))}`],
    ex: { left: Lft, ans },
  }, ans, 'area', `Yes: 1 − ${a4(Lft)} = ${a4(ans)}.`, [
    [Lft, MC.leftDefault, `${a4(Lft)} is the area to the left. "${w[0]!.toUpperCase() + w.slice(1)}" is the right side: 1 − ${a4(Lft)}.`],
  ], 'Right tail = 1 − (area to the left).', 0.0001);
};

export const betweenCommand: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const a = valueIn(R, c, m - 2.2 * s, m - 0.2 * s), b = valueIn(R, c, m + 0.2 * s, m + 2.2 * s);
  const f = (...v: number[]) => `normalcdf(${v.map(x => fmt(x)).join(', ')})`;
  const opts: Opt[] = [
    { t: f(a, b, m, s), ok: true, say: 'Yes: lower bound, upper bound, then the mean and the SD.' },
    { t: f(m, s, a, b), mc: MC.toolArgs, say: 'The bounds come first, then the mean and the SD.' },
    { t: f(b, a, m, s), mc: MC.ftcRev, say: 'The lower bound goes first; reversed, the calculator returns a negative number.' },
    { t: f(a, b, s, m), mc: MC.toolArgs, say: `The mean (${fmt(m)}) comes before the SD (${fmt(s)}).` },
  ];
  return choice(R, {
    id: `cmd-${n}`, family: 'betweenCommand',
    prompt: `X ~ ${A(NN(m, s))} (the ${c.what} of ${c.who}). Which TI-84 command finds ${B(`P(${fmt(a)} < X < ${fmt(b)})`)}? (normalcdf(lower, upper, μ, σ))`,
    board: `P(${fmt(a)} < X < ${fmt(b)})`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: a, hi: b, on: 'C' }] } },
    solution: ['normalcdf(lower, upper, μ, σ): the bounds first, then the model.', `Here: ${f(a, b, m, s)} ≈ ${a4(normalcdf(a, b, m, s))}.`],
  }, opts);
};

export const leftBounds: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const z = until(() => roundTo((R() * 2 - 1) * 2.9, 1), z => Math.abs(z - Math.round(z)) >= 0.2 && Math.abs(z) > 0.1);
  const E = [0, 0.0015, 0.025, 0.16, 0.5, 0.84, 0.975, 0.9985, 1], j = Math.floor(z) + 4;   // z in (j - 4, j - 3)
  const iv = (k: number) => `between ${fmt(E[k]!, 4)} and ${fmt(E[k + 1]!, 4)}`;
  const mir = 7 - j;
  const x = roundTo(m + z * s, 2);
  const opts: Opt[] = [
    { t: iv(j), ok: true, say: `Yes: z = ${fmt(z)} lies between ${Math.floor(z)} and ${Math.floor(z) + 1}, so its left area lies between those benchmarks.` },
    { t: iv(mir), mc: MC.misread, say: 'That is the mirror image: the area on the other side. The table area is to the LEFT of z.' },
    ...(j > 0 ? [{ t: iv(j - 1), mc: MC.wrongDist, say: `That belongs to z between ${Math.floor(z) - 1} and ${Math.floor(z)}.` }] : []),
    ...(j < 7 ? [{ t: iv(j + 1), mc: MC.wrongDist, say: `That belongs to z between ${Math.floor(z) + 1} and ${Math.floor(z) + 2}.` }] : []),
  ];
  return choice(R, {
    id: `bounds-${n}`, family: 'leftBounds',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. The value ${withU(c, x)} has ${B(`z = ${fmt(z)}`)}. Before using a table: the area to its left must lie...`,
    board: `z = ${fmt(z).replace('−', '-')} \\qquad P(Z < ${fmt(z).replace('−', '-')}) \\in \\,?`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: m - 6 * s, hi: x, on: 'C' }] } },
    solution: [`z = ${fmt(z)} is between ${Math.floor(z)} and ${Math.floor(z) + 1}.`, `Left areas at those whole z: ${fmt(E[j]!, 4)} and ${fmt(E[j + 1]!, 4)} (from 68-95-99.7).`],
  }, opts);
};

// ===================== a model from data summaries =====================
export const specModel: Gen = (R, n) => {
  const H = pick(R, ['women', 'newborn', 'dog', 'temp']);
  const card = histCardFor(R, H);
  const c = ctxById(H);
  const xb = roundTo(card.m + int(R, -3, 3) * (c.dx ? 0.1 : 1) * (H === 'newborn' ? 0.5 : 1), 2), sd = roundTo(card.s + int(R, -2, 2) * 0.1 * (H === 'newborn' ? 0.5 : 1), 2);
  const nS = pick(R, [50, 80, 120, 200, 300]);
  const v = roundTo(sd * sd, 4);
  const opts: Opt[] = [
    { t: `About ${NN(xb, sd)}: the sample mean and SD estimate μ and σ`, ok: true, say: 'Yes: the data summaries become the estimated parameters, with "about".' },
    { t: `Exactly ${NN(xb, sd)}: the population has this mean and SD`, mc: MC.statExact, say: 'A sample\'s mean and SD estimate the population\'s; another sample would give slightly different numbers.' },
    { t: `About ${NN(xb, v)}`, mc: MC.variance, say: `${fmt(v)} is the variance. N(μ, σ) takes the SD.` },
    { t: `About N(${fmt(sd)}, ${fmt(xb)})`, mc: MC.toolArgs, say: 'The mean comes first, then the SD.' },
  ];
  return choice(R, {
    id: `spec-${n}`, family: 'specModel',
    prompt: `A random sample of ${nS} ${c.who}: the histogram of their ${c.what}s is roughly symmetric with one peak; mean ${A(withU(c, xb))}, SD ${A(withU(c, sd))}. Which model should we use for all ${c.who} like these?`,
    board: `\\bar{x} = ${fmt(xb)} \\qquad s = ${fmt(sd)}`,
    picture: { card: card.card },
    solution: ['Roughly symmetric, one peak: a normal model is a reasonable candidate.', `Use the sample mean and SD as estimates: about ${NN(xb, sd)} (${c.unit}).`],
  }, opts);
};

export const specEstimate: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'men', 'newborn', 'dog', 'apple', 'run']), [m0, s0] = modelPick(R, c);
  const xb = roundTo(m0 + int(R, -2, 2) * (c.dx ? 0.1 : 1), 2), sd = roundTo(s0 + int(R, -1, 1) * 0.1, 2);
  const nS = pick(R, [60, 100, 150, 250, 400]);
  const [ka, kb] = pick(R, [[1, Infinity], [2, Infinity], [-Infinity, -1], [-Infinity, -2], [-1, 1], [-2, 2], [-1, 2], [-2, 1]] as [number, number][]);
  const p = benchPct(ka, kb);
  const a = r9(xb + ka * sd), b = r9(xb + kb * sd);
  const desc = ka === -Infinity ? `${c.less} than ${withU(c, b)}` : kb === Infinity ? `${c.more} than ${withU(c, a)}` : `between ${withU(c, a)} and ${withU(c, b)}`;
  const piece = (k: number) => (Math.abs(k) === Infinity ? '50' : fmt(HALF[Math.abs(k)]!));
  return numItem({
    id: `spec-est-${n}`, family: 'specEstimate',
    prompt: `A random sample of ${nS} ${c.who} has a roughly symmetric, single-peaked histogram with mean ${A(withU(c, xb))} and SD ${A(withU(c, sd))}. Using a normal model with these values and the 68-95-99.7 rule, about what percent of all such ${c.who} are ${B(desc)}?`,
    board: `\\text{model} \\approx ${NT(xb, sd)}`,
    unit: '%',
    picture: { card: { x: sdAxis(c, xb, sd), curves: [normalCurve(xb, sd)] } },
    solution: [`Model: about ${NN(xb, sd)}. The region runs from ${Math.abs(ka) === Infinity ? 'the far left' : `${ka} SD`} to ${Math.abs(kb) === Infinity ? 'the far right' : `${kb} SD`}.`, `Left of the mean: ${piece(ka)}%; right of it: ${piece(kb)}% (only the parts inside the region).`, `About ${S(fmt(p) + '%')} (a model estimate)`],
    ex: { ka, kb, p },
  }, p, 'pct', `Yes: about ${fmt(p)}%, a model estimate.`, [
    [r9(100 - p), MC.leftDefault, 'That is the share outside the region.'],
    ...(ka === -Infinity || kb === Infinity ? [[CENTRAL[Math.min(Math.abs(ka), Math.abs(kb))]!, MC.centralToTail, 'That is the central region, not a tail or a side.'] as Cand] : [[CENTRAL[Math.max(Math.abs(ka), Math.abs(kb))]!, MC.centered, 'That assumes the interval is centered on the mean.'] as Cand]),
  ], 'Turn the ends into SD steps from the mean, then use the benchmarks.');
};

// ===================== mixed: choose the region =====================
export const mixedRegion: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const kind = pick(R, ['atleast', 'nomore', 'more', 'between', 'within', 'away'] as const);
  const a0 = valueIn(R, c, m - 2 * s, m - 0.3 * s), b0 = valueIn(R, c, m + 0.3 * s, m + 2 * s);
  const d = r9(b0 - m);
  const [a, b] = kind === 'within' || kind === 'away' ? [r9(m - d), b0] : [a0, b0];
  const single = kind === 'atleast' || kind === 'nomore' || kind === 'more';
  const x = kind === 'nomore' ? a0 : b0;
  const F = (v: number) => `P(X < ${fmt(v)})`;
  const words = kind === 'atleast' ? `at least ${withU(c, x)}` : kind === 'nomore' ? `no more than ${withU(c, x)}` : kind === 'more' ? `${c.more} than ${withU(c, x)}`
    : kind === 'between' ? `between ${withU(c, a)} and ${withU(c, b)}` : kind === 'within' ? `within ${withU(c, d)} of the mean` : `more than ${withU(c, d)} away from the mean`;
  const opts: Opt[] = single ? [
    { t: F(x), ok: kind === 'nomore', mc: kind === 'nomore' ? undefined : MC.leftDefault, say: kind === 'nomore' ? 'Yes: no more than = the left side (≤ and < give the same area).' : `${F(x)} is the left side. "${kind === 'atleast' ? 'At least' : c.more}" is the right side.` },
    { t: `1 − ${F(x)}`, ok: kind !== 'nomore', mc: kind === 'nomore' ? MC.misread : undefined, say: kind !== 'nomore' ? 'Yes: the right side is 1 minus the left area.' : 'No more than is the LEFT side: the left area itself.' },
    { t: `P(X = ${fmt(x)})`, mc: MC.pointMass, say: 'One exact value has area 0; the event is a whole side.' },
  ] : [
    { t: `${F(b)} − ${F(a)}`, ok: kind !== 'away', say: kind !== 'away' ? 'Yes: the area between = F(upper) − F(lower).' : 'That is the area between; "away from the mean" is the two tails.' },
    { t: `${F(a)} + 1 − ${F(b)}`, ok: kind === 'away', say: kind === 'away' ? 'Yes: the two tails, added.' : 'That is the two tails, outside the interval.' },
    { t: `${F(a)} + ${F(b)}`, mc: MC.betweenCum, say: 'Adding two cumulative areas counts the lower part twice.' },
    { t: `${F(a)} − ${F(b)}`, mc: MC.ftcRev, say: 'Reversed: that is negative. Upper minus lower.' },
  ];
  return choice(R, {
    id: `mixed-reg-${n}`, family: 'mixedRegion',
    prompt: `X ~ ${A(NN(m, s))}, the ${c.what} of a random ${c.one}. Which expression gives the proportion of ${c.who} that are ${B(words)}? (P(X < v) is a calculator or table left area.)`,
    board: `X \\sim ${NT(m, s)}`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)] } },
    solution: [single ? `"${words}" is the ${kind === 'nomore' ? 'left' : 'right'} side of ${fmt(x)}.` : kind === 'away' ? `"${words}" is two tails: below ${fmt(a)} and above ${fmt(b)}.` : `"${words}" is the interval from ${fmt(a)} to ${fmt(b)}.`],
  }, opts);
};

// ===================== the inverse direction =====================
const INV_P = [0.01, 0.1, 0.15, 0.2, 0.3, 0.35, 0.4, 0.6, 0.65, 0.7, 0.8, 0.85, 0.9, 0.975, 0.99, 0.025].filter(zForAreaClear);
const invRows = (z: number): [number, number][] => [roundTo(z - 0.01, 2), z, roundTo(z + 0.01, 2)].map(v => [v, tableArea(v)]);
export const invZ: Gen = (R, n) => {
  const p = pick(R, INV_P), z = zForArea(p);
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  return numItem({
    id: `inv-z-${n}`, family: 'invZ',
    prompt: `In the standard normal model, which z has ${B(`${fmt(p * 100)}% of the area to its left`)} (the ${fmt(p * 100)}th percentile)? Read the table backwards: use the row whose area is closest to ${fix(p, 4)}.`,
    board: `P(Z < z) = ${fix(p, 4)} \\qquad z = \\,?`,
    picture: { card: { x: { min: -4, max: 4, step: 1, name: 'z' }, curves: [normalCurve(0, 1)], shades: [{ key: 'sh', lo: -6, hi: z, on: 'C' }] }, table: { rows: invRows(z) } },
    solution: [`Look for the area closest to ${fix(p, 4)} in the table: ${a4(tableArea(z))}.`, `Its z: ${S(zf(z))}`],
    ex: { p, z, m, s },
  }, z, 'plain', `Yes: z ≈ ${zf(z)}.`, [
    [p, MC.areaAsZ, `${fix(p, 4)} is the area. Find it inside the table and read the z beside it.`],
    [-z, MC.dropSign, `${p < 0.5 ? 'Less than half the area is to the left, so z is negative.' : 'More than half the area is to the left, so z is positive.'}`],
  ], 'Find the area in the table, then read its z.', 0.005);
};

export const invCut: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const kind = pick(R, ['top', 'bottom', 'pct']);
  const { p, z, x } = until(() => {
    const p = pick(R, INV_P), z = zForArea(p);
    return { p, z, x: m + z * s };
  }, t => (kind === 'top' ? t.p > 0.5 : kind === 'bottom' ? t.p < 0.5 : true) && safeRound(t.x, c.dx, 0.04) && t.x > 0);
  const ans = roundTo(x, c.dx);
  const k = roundTo((1 - p) * 100, 1), b = roundTo(p * 100, 1);
  const what = kind === 'top' ? `the cutoff for the top ${fmt(k)}%` : kind === 'bottom' ? `the cutoff for the bottom ${fmt(b)}%` : `the ${fmt(b)}th percentile`;
  const zWrong = kind === 'top' ? zForArea(1 - p) : -z;
  return numItem({
    id: `inv-cut-${n}`, family: 'invCut',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. Find ${B(what)}. Read the table backwards (closest area), then use x = μ + zσ. Round to ${c.dx ? '1 decimal place' : 'a whole number'}.`,
    board: `P(X < x) = ${fix(p, 4)} \\qquad x = \\mu + z\\sigma`,
    unit: c.unit,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: kind === 'top' ? x : m - 6 * s, hi: kind === 'top' ? m + 6 * s : x, on: 'C' }] }, table: { rows: invRows(z) } },
    solution: [`Area to the left of the cutoff: ${fix(p, 4)}. The table's closest area is ${a4(tableArea(z))} at z = ${zf(z)}.`, `x = ${fmt(m)} + (${zf(z)}) × ${fmt(s)} ≈ ${S(fmt(ans, c.dx))}`],
    ex: { p, z, ans },
  }, ans, 'plain', `Yes: ${fmt(ans, c.dx)} ${c.unit}.`, [
    [roundTo(m - z * s, c.dx), MC.invFormula, 'x = μ + zσ: the z keeps its sign.'],
    [roundTo(m + p * s, c.dx), MC.areaAsZ, `${fix(p, 4)} is an area, not a z. Find the z for that area first.`],
    [roundTo(m + zWrong * s, c.dx), kind === 'top' ? MC.leftDefault : MC.dropSign, kind === 'top' ? `The top ${fmt(k)}% has ${fmt(p * 100)}% to its LEFT: use the z for ${fix(p, 4)}.` : 'Check the side: the area to the left decides the sign of z.'],
  ], 'Area to the left → z (table backwards) → x = μ + zσ.', c.dx ? 0.05 : 0.5);
};

export const invMiddle: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const { P, z, lo, hi } = until(() => {
    const P = pick(R, [60, 70, 80, 95, 98]), p = roundTo((1 - P / 100) / 2, 4), z = zForArea(p);
    return { P, z, lo: m + z * s, hi: m - z * s, p };
  }, t => zForAreaClear((1 - t.P / 100) / 2) && safeRound(t.lo, c.dx, 0.04) && safeRound(t.hi, c.dx, 0.04));
  const p = roundTo((1 - P / 100) / 2, 4);
  const L = roundTo(lo, c.dx), H = roundTo(hi, c.dx);
  return pairItem({
    id: `inv-mid-${n}`, family: 'invMiddle',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. Between which two values do the ${B(`middle ${P}%`)} lie? Read the table backwards (closest area), use x = μ + zσ, and round to ${c.dx ? '1 decimal place' : 'whole numbers'}.`,
    board: `\\text{middle } ${P}\\% \\qquad \\text{each tail } ${fix(p, 4)}`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo, hi, on: 'C' }] }, table: { rows: invRows(z) } },
    solution: [`The middle ${P}% leaves ${fix(p, 4)} in each tail. The table's closest area: z ≈ ${zf(z)}; by symmetry the other end is z ≈ ${zf(-z)}.`, `${fmt(m)} − ${fmt(-z, 2)} × ${fmt(s)} ≈ ${S(fmt(L, c.dx))} and ${fmt(m)} + ${fmt(-z, 2)} × ${fmt(s)} ≈ ${S(fmt(H, c.dx))}`],
    ex: { z, L, H },
  }, L, H, { lead: 'From', op: 'to', tail: c.unit }, `Yes: from ${fmt(L, c.dx)} to ${fmt(H, c.dx)}.`, [
    [roundTo(m + zForArea(1 - P / 100) * s, c.dx), roundTo(m - zForArea(1 - P / 100) * s, c.dx), MC.oneSided, `Each tail holds ${fix(p, 4)}, half of what is left outside ${P}%.`],
    [roundTo(m - P / 100 * s, c.dx), roundTo(m + P / 100 * s, c.dx), MC.areaAsZ, 'The percent is an area, not a z. Find the z first.'],
  ], `Each tail holds ${fix(p, 4)}: find its z, then go that many SDs each way from the mean.`, c.dx ? 0.05 : 0.5);
};

export const FAM_B: Record<string, Gen> = {
  zRead, zLocate, zCalc, zCalcDec, zCompare, zMatch, stdEvent, stdBetween, leftTable, leftCount, leftBounds, rightSupplied, rightTable,
  betweenTable, betweenCommand, outsideTable, outsideSym, specModel, specEstimate, mixedRegion, mixedFull, mixedData, invZ, invCut, invMiddle,
};
export const NAMES_B: Record<string, string> = {
  zRead: 'What a z-score says', zLocate: 'From z to a value', zCalc: 'Compute z', zCalcDec: 'z from a distance', zCompare: 'Who stands out more?',
  zMatch: 'The same standing', stdEvent: 'Standardize an event', stdBetween: 'Standardize both ends', leftTable: 'Left area (table)',
  leftCount: 'Left area as a count', leftBounds: 'Is the area reasonable?', rightSupplied: 'Right tail from the calculator', rightTable: 'Right tail (table)',
  betweenTable: 'Area between (table)', betweenCommand: 'The normalcdf command', outsideTable: 'Two unequal tails', outsideSym: 'Away from the mean',
  specModel: 'Model from data', specEstimate: 'Estimate from data', mixedRegion: 'Which region?', mixedFull: 'Mixed areas', mixedData: 'Data to count',
  invZ: 'Area to z', invCut: 'Percentile cutoff', invMiddle: 'Middle percent',
};
void CENTRAL;
