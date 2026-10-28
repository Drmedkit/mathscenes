// famB.ts: stage 2 of "Similar triangles" (sub-goals correspondence-from-statement ... algebraic-side-lengths):
// reading and writing ordered similarity statements, the directed scale factor, missing lengths in separate, nested,
// hourglass and altitude figures, the geometric-mean relations, and sides given as expressions in x.
// Statements offered as choices are checked against the drawn points (simValid): exactly one valid order is offered
// (an isosceles figure has two valid orders; the second one is never shown). Proportions offered as wrong are checked
// false on a generic figure of the same configuration (propHolds), so no wrong choice is secretly right.
import type { Pt } from '../geometry-foundations/geo';
import { A, MC, type Gen, type Opt, choice, fitted, fracItem, names2, numItem, pick, r, rt, S, shuffle, simH, simT, triN, segN } from './common';
import { type Prop, PERM6, SIDE_SETS, type Q, fmt, genericAltitude, genericHourglass, genericNested, lengthsOf, nested, permOf, propHolds, qHtml, red, sideOf, simFig, simPair, simValid, turnTri, validOrders } from './sim';
import { altFig, altPts, hourFig, hourPts, nestedFig, nm, roles } from './figs';

const rot2 = (R: () => number) => r(R, 0, 359);
const tilt = (R: () => number) => r(R, -25, 25);
const setOf = (R: () => number) => shuffle(R, pick(R, SIDE_SETS).slice() as number[]);
function fail(): never { throw new Error('retry'); }
const KS: Q[] = [[2, 1], [3, 2], [2, 3], [3, 1], [1, 2], [5, 2], [4, 3], [3, 4], [5, 4]];
/** sides scaled by k to whole or .5 numbers */
function scaledSides(R: () => number, k: Q): { s1: number[]; s2: number[] } {
  for (;;) { const b = setOf(R); const s1 = b.map(x => x * k[1]), s2 = s1.map(x => (x * k[0]) / k[1]); if (Math.max(...s1, ...s2) <= 40) return { s1, s2 }; }
}
/** a proportion p/q = r/s as panel HTML (stacked fractions) and plain text */
const propH = (p: Prop) => `${p[0]}/${p[1]} = ${p[2]}/${p[3]}`;
/** the choice list of a proportion question: the right one, then wrong candidates that are false on the generic
 *  figure (true ones are dropped: they would be a second right answer) */
function propOpts(L: Record<string, number>, right: Prop, wrong: { p: Prop; mc?: string; say: string }[], okSay: string): Opt[] {
  if (!propHolds(L, right)) throw new Error(`not a valid proportion ${right.join(',')}`);
  const out: Opt[] = [{ t: propH(right), ok: true, say: okSay }];
  for (const w of wrong) { if (propHolds(L, w.p)) continue; const t = propH(w.p); if (out.some(o => o.t === t)) continue; out.push({ t, mc: w.mc, say: w.say }); }
  return out.slice(0, 4);
}
/** generic lengths for two separate similar triangles named n1, n2 (vertex i ↔ vertex i) */
function genericPair(n1: string, n2: string): Record<string, number> {
  const S2 = simPair([3.1, 4.3, 5.9], 1.37, n1, n2, { rot2: 37 });
  return lengthsOf(S2.P);
}

// ---------- correspondence-from-statement ----------
export const corrSide: Gen = (R, n) => fitted('corrSide', () => {
  const [L1, L2] = names2(R), n2 = permOf(L2, pick(R, PERM6.slice(1)));
  const s = setOf(R), k = pick(R, [0.7, 1.4, 1.6]);
  const S2 = simPair(s, k, L1, n2, { rot1: tilt(R), rot2: rot2(R), flip: R() < 0.5 });
  const fig = simFig(S2, {});
  const alpha = [...n2].sort().join('');
  const side = R() < 0.6, i = r(R, 0, 2);
  const ask = side ? segN(sideOf(L1, i)) : `∠${L1[i]}`;
  const right = side ? segN(sideOf(n2, i)) : `∠${n2[i]}`;
  const canon = (x: string) => [...x].sort().join('');
  const opts: Opt[] = [0, 1, 2].map(j => {
    const t = side ? segN(sideOf(n2, j)) : `∠${n2[j]}`;
    if (j === i) return { t, ok: true, say: `Right: same places in the statement.` };
    const byAlpha = side ? canon(sideOf(alpha, i)) === canon(sideOf(n2, j)) : alpha[i] === n2[j];
    return { t, mc: byAlpha ? MC.vertexOrder : MC.byPosition, say: 'Match by the places in the statement, not by the alphabet or by where the letters sit on the page.' };
  });
  return choice(R, {
    id: `corrSide-${n}`, family: 'corrSide', prompt: `${simH(L1, n2)}. Which part of ${triN(n2)} corresponds to ${ask}?`, board: simT(L1, n2),
    solution: [`Letter under letter: ${[0, 1, 2].map(j => `${L1[j]} ↔ ${n2[j]}`).join(', ')}.`, `So ${ask} corresponds to ${right}.`],
    picture: { fig, reveal: {} },
  }, opts);
});
export const corrRatio: Gen = (R, n) => fitted('corrRatio', () => {
  const [L1, L2] = names2(R), n2 = permOf(L2, pick(R, PERM6));
  const S2 = simPair(setOf(R), pick(R, [0.7, 1.5]), L1, n2, { rot1: tilt(R), rot2: rot2(R), flip: R() < 0.5 });
  const fig = simFig(S2, {});
  const L = genericPair(L1, n2);
  const i = r(R, 0, 2), j = (i + r(R, 1, 2)) % 3;
  const a = sideOf(L1, i), b = sideOf(n2, i), c = sideOf(L1, j), d = sideOf(n2, j);
  const e = sideOf(n2, 3 - i - j);
  const opts = propOpts(L, [a, b, c, d], [
    { p: [a, b, d, c], mc: MC.inconsistent, say: 'Keep one order in both ratios: first triangle over second triangle.' },
    { p: [a, d, c, b], mc: MC.ignoreCorr, say: `${a} corresponds to ${b}, not to ${d}: read the places in the statement.` },
    { p: [a, e, c, d], mc: MC.ignoreCorr, say: `${a} corresponds to ${b}: read the places in the statement.` },
    { p: [a, b, c, e], mc: MC.ignoreCorr, say: `${c} corresponds to ${d}: read the places in the statement.` },
  ], 'Right: each ratio pairs corresponding sides, in the same order.');
  return choice(R, {
    id: `corrRatio-${n}`, family: 'corrRatio', prompt: `${simH(L1, n2)}. Which proportion must be true?`, board: simT(L1, n2),
    solution: [`Letter under letter: ${[0, 1, 2].map(x => `${L1[x]} ↔ ${n2[x]}`).join(', ')}.`, `${a} ↔ ${b} and ${c} ↔ ${d}, so ${a}/${b} = ${c}/${d}.`],
    picture: { fig, reveal: {} },
  }, opts);
});

// ---------- correspondence-from-angle-marks ----------
export const stmtMarks: Gen = (R, n) => fitted('stmtMarks', () => {
  const iso = R() < 0.25;
  let s = setOf(R);
  if (iso) { const b = r(R, 4, 7), l = b + r(R, 2, 4); s = shuffle(R, [b, l, l]); }
  const [L1, L2] = names2(R), n2 = permOf(L2, pick(R, PERM6));
  const S2 = simPair(s, pick(R, [0.65, 1.45, 1.6]), L1, n2, { rot1: tilt(R), rot2: rot2(R), flip: R() < 0.5 });
  // arcs: equal angles share a number of arcs
  const angs = [0, 1, 2].map(i => Math.round(Math.acos((s[(i + 1) % 3]! ** 2 + s[(i + 2) % 3]! ** 2 - s[i]! ** 2) / (2 * s[(i + 1) % 3]! * s[(i + 2) % 3]!)) * 1e6));
  const ordered = [...new Set(angs)].sort((a, b) => a - b);
  const arcs = Object.fromEntries([0, 1, 2].map(i => [i, ordered.indexOf(angs[i]!) + 1]));
  const fig = simFig(S2, { arcs });
  const valid = validOrders(S2.P, L1, L2);
  if (!valid.length) fail();
  const rightO = pick(R, valid);
  const alpha = L2;
  const byPos = (() => { const o1 = [0, 1, 2].sort((a, b) => S2.T1[a]![0] - S2.T1[b]![0]); const o2 = [0, 1, 2].sort((a, b) => S2.T2[a]![0] - S2.T2[b]![0]); const m: string[] = []; o1.forEach((v, k) => { m[v] = n2[o2[k]!]!; }); return m.join(''); })();
  const opts: Opt[] = [{ t: simH(L1, rightO), ok: true, say: 'Right: each vertex is matched with the vertex that has the same angle mark.' }];
  for (const p of shuffle(R, PERM6.slice())) {
    const o = permOf(L2, p);
    if (valid.includes(o) || opts.some(x => x.t === simH(L1, o))) continue;
    opts.push({ t: simH(L1, o), mc: o === alpha ? MC.vertexOrder : o === byPos ? MC.byPosition : MC.byPosition, say: 'Match the vertices by their angle marks (the same number of arcs), whatever way the triangle is turned.' });
    if (opts.length === 4) break;
  }
  return choice(R, {
    id: `stmtMarks-${n}`, family: 'stmtMarks', prompt: `The triangles are similar. Which similarity statement matches the angle marks?`, board: `\\triangle ${L1} \\sim \\triangle \\,?`,
    solution: [`Match equal marks: ${[0, 1, 2].map(i => `${L1[i]} ↔ ${rightO[i]}`).join(', ')}.`, `Write the second triangle in that order: ${simH(L1, rightO)}.`],
    picture: { fig, reveal: {} },
  }, opts);
});

// ---------- directed-scale-factor ----------
export const kDirected: Gen = (R, n) => fitted('kDirected', () => {
  const k = pick(R, [...KS, [1, 1]] as Q[]);
  const { s1, s2 } = scaledSides(R, k);
  const [L1, L2] = names2(R), n2 = permOf(L2, pick(R, PERM6));
  const S2 = simPair(s1, k[0] / k[1], L1, n2, { rot1: tilt(R), rot2: rot2(R), flip: R() < 0.5 });
  const i = r(R, 0, 2);
  const fig = simFig(S2, { l1: { [i]: fmt(s1[i]!) }, l2: { [i]: fmt(s2[i]!) } });
  const rev = R() < 0.45;
  const kk: Q = rev ? [k[1], k[0]] : k;
  const [from, to] = rev ? [n2, L1] : [L1, n2];
  const [sf, st] = rev ? [s2[i]!, s1[i]!] : [s1[i]!, s2[i]!];
  const wrongs = kk[0] === kk[1] ? [] : [{ v: kk[1] / kk[0], mc: kk[0] < kk[1] ? MC.largerOver : MC.inconsistent, say: `From ${triN(from)} to ${triN(to)}: the new side (${fmt(st)}) over the old side (${fmt(sf)}).` }];
  return fracItem({
    id: `kDirected-${n}`, family: 'kDirected', prompt: `${simH(L1, n2)}. What is the scale factor from ${triN(from)} to ${triN(to)}?`, board: `k = \\frac{\\text{side of } \\triangle ${to}}{\\text{side of } \\triangle ${from}}`, unit: '',
    solution: [`${sideOf(to, i)} corresponds to ${sideOf(from, i)}.`, `k = new over old = ${fmt(st)}/${fmt(sf)} = ${S(qHtml(kk))}.`],
    picture: { fig, reveal: {} },
  }, kk[0], kk[1], wrongs, kk[0] === kk[1] ? 'Right: k = 1, the triangles are congruent.' : `Right: ${kk[0] > kk[1] ? 'an enlargement' : 'a reduction'}, new over old.`, 'Divide a side of the image triangle by its partner in the starting triangle.');
});
export const kFromStmt: Gen = (R, n) => fitted('kFromStmt', () => {
  const k = pick(R, KS);
  const { s1, s2 } = scaledSides(R, k);
  const [L1, L2] = names2(R), n2 = permOf(L2, pick(R, PERM6.slice(1)));
  const S2 = simPair(s1, k[0] / k[1], L1, n2, { rot1: tilt(R), rot2: rot2(R), flip: R() < 0.5 });
  const i = r(R, 0, 2);
  const fig = simFig(S2, { l1: { 0: fmt(s1[0]!), 1: fmt(s1[1]!), 2: fmt(s1[2]!) }, l2: { [i]: fmt(s2[i]!) } });
  const wrongs: { v: number; mc?: string; say: string }[] = [0, 1, 2].filter(j => j !== i).map(j => { const q = red(Math.round(s2[i]! * 4), Math.round(s1[j]! * 4)); return { v: q[0] / q[1], mc: MC.byPosition, say: `${sideOf(n2, i)} corresponds to ${sideOf(L1, i)} (same places in the statement), not to ${sideOf(L1, j)}.` }; });
  wrongs.push({ v: k[1] / k[0], mc: k[0] < k[1] ? MC.largerOver : MC.inconsistent, say: `From ${triN(L1)} to ${triN(n2)}: the side of ${triN(n2)} over its partner.` });
  return fracItem({
    id: `kFromStmt-${n}`, family: 'kFromStmt', prompt: `${simH(L1, n2)}. Use the statement to pair the labelled side of ${triN(n2)}. What is the scale factor from ${triN(L1)} to ${triN(n2)}?`, board: simT(L1, n2), unit: '',
    solution: [`Letter under letter: ${sideOf(n2, i)} ↔ ${sideOf(L1, i)}.`, `k = ${fmt(s2[i]!)}/${fmt(s1[i]!)} = ${S(qHtml(k))}.`],
    picture: { fig, reveal: {} },
  }, k[0], k[1], wrongs, 'Right: pair by the statement, then new over old.', 'Find the partner of the labelled side from the statement, then divide new over old.');
});

// ---------- missing-length-separated ----------
export const missSep: Gen = (R, n) => fitted('missSep', () => {
  const k = pick(R, [...KS, [5, 2], [3, 2]] as Q[]);
  const { s1, s2 } = scaledSides(R, k);
  const [L1, L2] = names2(R), n2 = permOf(L2, pick(R, PERM6));
  const S2 = simPair(s1, k[0] / k[1], L1, n2, { rot1: tilt(R), rot2: rot2(R), flip: R() < 0.5 });
  const i = r(R, 0, 2), j = (i + r(R, 1, 2)) % 3;
  const inSecond = R() < 0.55;
  const l1: Record<number, string> = { [i]: fmt(s1[i]!) }, l2: Record<number, string> = { [i]: fmt(s2[i]!) };
  if (inSecond) { l1[j] = fmt(s1[j]!); l2[j] = '?'; } else { l2[j] = fmt(s2[j]!); l1[j] = '?'; }
  const fig = simFig(S2, { l1, l2, ...(inSecond ? { alt2: { [j]: fmt(s2[j]!) } } : { alt1: { [j]: fmt(s1[j]!) } }) });
  const a = inSecond ? s2[j]! : s1[j]!, given = inSecond ? s1[j]! : s2[j]!;
  const kk = k[0] / k[1], kUse = inSecond ? kk : 1 / kk;
  const wrongs = [
    { v: given / kUse, mc: MC.inconsistent, say: 'That uses the scale factor upside down: keep the direction from the known triangle to the one with the unknown.' },
    { v: given + (inSecond ? s2[i]! - s1[i]! : s1[i]! - s2[i]!), mc: MC.additive, say: 'Similar sides are multiplied by one factor, not lengthened by the same amount.' },
  ].filter(w => w.v > 0);
  const unknown = inSecond ? sideOf(n2, j) : sideOf(L1, j);
  return numItem({
    id: `missSep-${n}`, family: 'missSep', prompt: `${simH(L1, n2)}. Find ${unknown}.`, board: `\\frac{${sideOf(n2, i)}}{${sideOf(L1, i)}} = \\frac{${sideOf(n2, j)}}{${sideOf(L1, j)}}`, unit: '',
    solution: [`The labelled pair gives k = ${fmt(s2[i]!)}/${fmt(s1[i]!)} = ${qHtml(k)} from ${triN(L1)} to ${triN(n2)}.`, inSecond ? `${unknown} = ${qHtml(k)} × ${fmt(s1[j]!)}.` : `${unknown} = ${fmt(s2[j]!)} ÷ ${qHtml(k)}.`, `${unknown} = <b class="s">${fmt(a)}</b>.`],
    picture: { fig, reveal: { solved: [unknown] } },
  }, a, wrongs, 'Right: one scale factor for every pair.', 'Find k from the labelled pair, then multiply (or divide) the partner of the unknown side.');
});
const STORIES = [
  { what: 'two triangular sails', unit: 'ft' }, { what: 'a roof truss and its scale model', unit: 'in' }, { what: 'two triangular garden beds', unit: 'ft' }, { what: 'two triangular park lots on a map and on the ground', unit: 'yd' },
];
export const missStory: Gen = (R, n) => fitted('missStory', () => {
  const st = pick(R, STORIES);
  const k = pick(R, [[3, 2], [2, 1], [5, 2], [4, 3], [5, 4]] as Q[]);
  const { s1, s2 } = scaledSides(R, k);
  const [L1, L2] = names2(R), n2 = permOf(L2, pick(R, PERM6));
  const S2 = simPair(s1, k[0] / k[1], L1, n2, { rot1: tilt(R), rot2: rot2(R), flip: R() < 0.5 });
  const i = r(R, 0, 2), j = (i + r(R, 1, 2)) % 3;
  const fig = simFig(S2, { l1: { [i]: `${fmt(s1[i]!)} ${st.unit}`, [j]: `${fmt(s1[j]!)} ${st.unit}` }, l2: { [i]: `${fmt(s2[i]!)} ${st.unit}`, [j]: '?' }, alt2: { [j]: `${fmt(s2[j]!)} ${st.unit}` } });
  const a = s2[j]!;
  return numItem({
    id: `missStory-${n}`, family: 'missStory', prompt: `${st.what[0]!.toUpperCase() + st.what.slice(1)} are similar triangles: ${simH(L1, n2)}. How long is ${sideOf(n2, j)}?`, board: `\\frac{${sideOf(n2, j)}}{${fmt(s1[j]!)}} = \\frac{${fmt(s2[i]!)}}{${fmt(s1[i]!)}}`, unit: st.unit,
    solution: [`k = ${fmt(s2[i]!)}/${fmt(s1[i]!)} = ${qHtml(k)}.`, `${sideOf(n2, j)} = ${qHtml(k)} × ${fmt(s1[j]!)} = <b class="s">${fmt(a)}</b> ${st.unit}.`],
    picture: { fig, reveal: { solved: [sideOf(n2, j)] } },
  }, a, [{ v: s1[j]! + s2[i]! - s1[i]!, mc: MC.additive, say: 'Multiply by the scale factor; do not add the difference.' }, { v: (s1[j]! * s1[i]!) / s2[i]!, mc: MC.inconsistent, say: 'The second triangle is the larger one here: multiply by k, do not divide.' }].filter(w => w.v > 0 && k[0] > k[1]), 'Right.', 'Find k from the pair with both lengths, then multiply.');
});

// ---------- nested-triangles-whole-vs-part ----------
/** a nested setup with nice lengths: AD, DB, AE, EC and DE, BC (BC = DE·AB/AD) */
function nestNums(R: () => number): { AD: number; DB: number; AE: number; EC: number; DE: number; BC: number; AB: number; AC: number } {
  for (;;) {
    const k = pick(R, [[5, 2], [3, 1], [5, 3], [2, 1], [4, 3], [7, 4], [3, 2]] as Q[]);
    const m = r(R, 1, 4);
    const AD = k[1] * m, AB = k[0] * m, DB = AB - AD;
    const e = r(R, 1, 4), AE = k[1] * e + (R() < 0.5 ? 0 : 0), AC = k[0] * e;
    const DE = k[1] * r(R, 1, 4), BC = (DE * k[0]) / k[1];
    if (AE === AD && DE === AD) continue;
    // a real triangle with readable angles
    const [a, b, c] = [BC, AC, AB];
    if (a + b <= c * 1.15 || a + c <= b * 1.15 || b + c <= a * 1.15) continue;
    if ([AD, DB, AE, AC - AE, DE, BC].some(x => x < 2 || x > 30)) continue;
    return { AD, DB, AE, EC: AC - AE, DE, BC, AB, AC };
  }
}
export const nestPart: Gen = (R, n) => fitted('nestPart', () => {
  const N = nestNums(R), t = roles(R);
  const P0 = nested(N.AB, N.AC, N.BC, N.AD / N.AB, 380 / Math.max(N.AB, N.AC, N.BC), tilt(R) / 2);
  const askBC = R() < 0.6;
  const labs = [{ seg: 'AD', text: fmt(N.AD) }, { seg: 'DB', text: fmt(N.DB) }, askBC ? { seg: 'DE', text: fmt(N.DE) } : { seg: 'DE', text: '?', alt: fmt(N.DE) }, askBC ? { seg: 'BC', text: '?', alt: fmt(N.BC) } : { seg: 'BC', text: fmt(N.BC) }];
  const fig = nestedFig(t, P0, { labs, par: true });
  const a = askBC ? N.BC : N.DE;
  const wrong = askBC ? (N.DE * N.DB) / N.AD : (N.BC * N.AD) / N.DB;
  const wrongs = [{ v: wrong, mc: MC.partWhole, say: `Pair whole with whole: ${nm(t, 'AD')} goes with the whole side ${nm(t, 'AB')} = ${fmt(N.AD)} + ${fmt(N.DB)} = ${fmt(N.AB)}, not with ${nm(t, 'DB')}.` }, { v: askBC ? N.DE + N.DB : N.BC - N.DB, mc: MC.additive, say: 'Similar sides scale by one factor: multiply, do not add the extra length.' }].filter(w => w.v > 0);
  const X = askBC ? nm(t, 'BC') : nm(t, 'DE');
  return numItem({
    id: `nestPart-${n}`, family: 'nestPart', prompt: `${segN(nm(t, 'DE'))} ∥ ${segN(nm(t, 'BC'))}, so ${simH(nm(t, 'ADE'), nm(t, 'ABC'))}. Find ${X}.`, board: `\\frac{${nm(t, 'AD')}}{${nm(t, 'AB')}} = \\frac{${nm(t, 'DE')}}{${nm(t, 'BC')}}`, unit: '',
    solution: [`The whole side: ${nm(t, 'AB')} = ${fmt(N.AD)} + ${fmt(N.DB)} = ${fmt(N.AB)}.`, `${nm(t, 'AD')}/${nm(t, 'AB')} = ${nm(t, 'DE')}/${nm(t, 'BC')}: ${fmt(N.AD)}/${fmt(N.AB)} = ${askBC ? `${fmt(N.DE)}/${X}` : `${X}/${fmt(N.BC)}`}.`, `${X} = <b class="s">${fmt(a)}</b>.`],
    picture: { fig, reveal: { solved: [askBC ? nm(t, 'BC') : nm(t, 'DE')] } },
  }, a, wrongs, 'Right: the side of the big triangle is the whole, AD + DB.', 'Pair a side of the small triangle with the whole side of the big one.');
});
export const nestWhole: Gen = (R, n) => fitted('nestWhole', () => {
  const N = nestNums(R), t = roles(R);
  const P0 = nested(N.AB, N.AC, N.BC, N.AD / N.AB, 380 / Math.max(N.AB, N.AC, N.BC), tilt(R) / 2);
  const askEC = R() < 0.6;
  const labs = [{ seg: 'AD', text: fmt(N.AD) }, { seg: 'DB', text: fmt(N.DB) }, askEC ? { seg: 'EC', text: '?', alt: fmt(N.EC) } : { seg: 'AE', text: '?', alt: fmt(N.AE) }];
  const fig = nestedFig(t, P0, { labs, par: true });
  const a = askEC ? N.EC : N.AE;
  const wrongs = [
    ...(askEC ? [{ v: N.AE, mc: MC.intermediate, say: `That is ${nm(t, 'AE')}. The question asks for ${nm(t, 'EC')} = ${nm(t, 'AC')} − ${nm(t, 'AE')}.` }] : []),
    { v: askEC ? N.AC * N.DB / N.AD - 0 : N.AC * N.AD / N.DB, mc: MC.partWhole, say: `Pair whole with whole: ${nm(t, 'AD')}/${nm(t, 'AB')} = ${nm(t, 'AE')}/${nm(t, 'AC')}.` },
  ].filter(w => w.v > 0 && Math.abs(w.v - a) > 1e-9);
  const X = askEC ? nm(t, 'EC') : nm(t, 'AE');
  return numItem({
    id: `nestWhole-${n}`, family: 'nestWhole', prompt: `${segN(nm(t, 'DE'))} ∥ ${segN(nm(t, 'BC'))} and the whole side ${nm(t, 'AC')} = ${fmt(N.AC)}. Find ${X}.`, board: `${nm(t, 'AC')} = ${fmt(N.AC)}`, unit: '',
    solution: [`${nm(t, 'AB')} = ${fmt(N.AD)} + ${fmt(N.DB)} = ${fmt(N.AB)}.`, `${nm(t, 'AD')}/${nm(t, 'AB')} = ${nm(t, 'AE')}/${nm(t, 'AC')}, so ${nm(t, 'AE')} = ${fmt(N.AC)} × ${fmt(N.AD)}/${fmt(N.AB)} = ${fmt(N.AE)}.`, askEC ? `${nm(t, 'EC')} = ${fmt(N.AC)} − ${fmt(N.AE)} = <b class="s">${fmt(N.EC)}</b>.` : `${nm(t, 'AE')} = <b class="s">${fmt(N.AE)}</b>.`],
    picture: { fig, reveal: { solved: [X] } },
  }, a, wrongs, 'Right: whole with whole, then part = whole − part.', 'Use AD/AB = AE/AC (wholes), then subtract if a part is asked.');
});

// ---------- altitude-similar-triangles ----------
const ALT_PQ: [number, number][] = [[1, 4], [4, 9], [2, 8], [1, 9], [3, 12], [9, 16], [4, 16], [2, 3], [3, 5], [2, 5], [3, 7], [4, 5], [5, 9], [4, 7], [3, 4], [5, 7], [2, 7], [6, 9]];
export const altStmt: Gen = (R, n) => fitted('altStmt', () => {
  const [p, q] = pick(R, ALT_PQ.filter(x => x[0] !== x[1]));
  const t = roles(R, 'ABCD');
  const P0 = altPts(p, q, 380 / (p + q), r(R, -20, 20), R() < 0.5);
  const fig = altFig(t, P0);
  const P = Object.fromEntries(Object.entries(P0).map(([kk, v]) => [t[kk]!, v])) as Record<string, Pt>;
  const pairs: [string, string][] = [['ADC', 'ACB'], ['CDB', 'ACB'], ['ADC', 'CDB']];
  const [x, y] = pick(R, pairs);
  const X = nm(t, x), Yl = nm(t, y);
  const valid = validOrders(P, X, Yl);
  if (valid.length !== 1) fail();
  const opts: Opt[] = [{ t: simH(X, valid[0]!), ok: true, say: 'Right: the right angles match, and the shared acute angle matches.' }];
  for (const pm of shuffle(R, PERM6.slice())) {
    const o = permOf(Yl, pm);
    if (simValid(P, X, o) || opts.some(z => z.t === simH(X, o))) continue;
    opts.push({ t: simH(X, o), mc: MC.byPosition, say: 'Match the right angle with the right angle and the shared angle with itself; then the third vertices.' });
    if (opts.length === 4) break;
  }
  return choice(R, {
    id: `altStmt-${n}`, family: 'altStmt', prompt: `∠${nm(t, 'ACB')} is a right angle and ${segN(nm(t, 'CD'))} is the altitude to the hypotenuse. Which statement is true?`, board: `\\triangle ${X} \\sim \\triangle\\,?`,
    solution: [`Both ${triN(X)} and ${triN(Yl)} have a right angle and share an acute angle (or have complementary acute angles): AA.`, `Match right angle with right angle, equal acute angles together: ${simH(X, valid[0]!)}.`],
    picture: { fig, reveal: {} },
  }, opts);
});
export const altWhich: Gen = (R, n) => fitted('altWhich', () => {
  const right = R() < 0.55;
  const t = roles(R, 'ABCD');
  let P0: Record<string, Pt>, fig;
  if (right) {
    const [p, q] = pick(R, ALT_PQ);
    P0 = altPts(p, q, 380 / (p + q), r(R, -15, 15), R() < 0.5);
    fig = altFig(t, P0);
  } else {
    // a non-right triangle: angle C labelled, altitude from C
    const angC = pick(R, [70, 75, 80, 100, 105, 110]), angA = r(R, 30, 180 - angC - 30), angB = 180 - angC - angA;
    if (angB < 25) fail();
    const AB = 400, A: Pt = [0, 0], B: Pt = [AB, 0];
    const ta = Math.tan((angA * Math.PI) / 180), tb = Math.tan((angB * Math.PI) / 180), x = (AB * tb) / (ta + tb), h = x * ta;
    P0 = { A, B, C: [x, h], D: [x, 0] };
    fig = altFig(t, P0, { boxC: false, extraMarks: [{ ang: 'ACB', text: `${angC}°`, lone: true }] });
  }
  const opts: Opt[] = right ? [
    { t: 'All three triangles are similar to each other', ok: true, say: 'Right: each small triangle shares an acute angle with the big one and has a right angle.' },
    { t: 'Only the two small triangles are similar', mc: MC.altTwo, say: `Each small triangle is similar to the big ${triN(nm(t, 'ACB'))} as well: a right angle and a shared acute angle.` },
    { t: 'None: the triangles have different sizes', mc: MC.sidesEqual, say: 'Different sizes are fine for similarity: compare the angles.' },
    { t: 'Only the two small triangles, and they are congruent', mc: MC.aaaCong, say: 'Same angles fix the shape, not the size.' },
  ] : [
    { t: 'None is guaranteed: the big triangle has no right angle', ok: true, say: `Right: ∠${nm(t, 'ACB')} is not 90°, so the small triangles do not share both angles with it.` },
    { t: 'All three triangles are similar to each other', mc: MC.altAny, say: 'That needs a right angle at the vertex the altitude comes from.' },
    { t: 'Only the two small triangles are similar', mc: MC.altAny, say: 'Their acute angles are not forced to match without the right angle at the top.' },
  ];
  return choice(R, {
    id: `altWhich-${n}`, family: 'altWhich', prompt: `${segN(nm(t, 'CD'))} is an altitude of ${triN(nm(t, 'ACB'))}. Which is true about ${triN(nm(t, 'ADC'))}, ${triN(nm(t, 'CDB'))} and ${triN(nm(t, 'ACB'))}?`, board: right ? `m\\angle ${nm(t, 'ACB')} = 90^\\circ` : `m\\angle ${nm(t, 'ACB')} \\ne 90^\\circ`,
    solution: right ? ['Each small triangle has a right angle at the foot of the altitude.', 'Each shares an acute angle with the big right triangle: AA, so all three are similar.'] : [`∠${nm(t, 'ACB')} is not a right angle.`, 'The small triangles have right angles, the big one has none: they cannot be similar to it.'],
    picture: { fig, reveal: {} },
  }, opts);
});

// ---------- geometric-mean-relations ----------
const isSq = (x: number) => Number.isInteger(Math.sqrt(x));
const rad = (x: number) => { let o = 1, i = x; for (let f = 2; f * f <= i; f++) while (i % (f * f) === 0) { o *= f; i /= f * f; } return o === 1 ? `√${i}` : i === 1 ? String(o) : `${o}√${i}`; };
export const gmAlt: Gen = (R, n) => fitted('gmAlt', () => {
  const [p, q] = pick(R, ALT_PQ);
  const t = roles(R, 'ABCD');
  const P0 = altPts(p, q, 380 / (p + q), r(R, -15, 15), R() < 0.5);
  const sq = isSq(p * q);
  const fig = altFig(t, P0, { labs: [{ seg: 'AD', text: fmt(p) }, { seg: 'DB', text: fmt(q) }, { seg: 'CD', text: 'h', alt: sq ? fmt(Math.sqrt(p * q)) : `√${p * q}` }] });
  const h2 = p * q;
  const base = { prompt: `${segN(nm(t, 'CD'))} is the altitude to the hypotenuse of right ${triN(nm(t, 'ACB'))}. Find h = ${nm(t, 'CD')}${sq ? '' : ' exactly'}.`, board: `\\frac{${p}}{h} = \\frac{h}{${q}}`, picture: { fig, reveal: { solved: [nm(t, 'CD')] } } };
  const sol = [`${simH(nm(t, 'ADC'), nm(t, 'CDB'))}, so ${nm(t, 'AD')}/${nm(t, 'CD')} = ${nm(t, 'CD')}/${nm(t, 'DB')}: ${p}/h = h/${q}.`, `h² = ${p} × ${q} = ${h2}: h is the geometric mean of ${p} and ${q}.`];
  if (sq) {
    const h = Math.sqrt(h2);
    return numItem({ id: `gmAlt-${n}`, family: 'gmAlt', ...base, unit: '', solution: [...sol, `h = √${h2} = <b class="s">${h}</b>.`] }, h, [{ v: (p + q) / 2, mc: MC.arithMean, say: 'That is the arithmetic mean. The altitude is the geometric mean: h² = p·q.' }, { v: h2, mc: MC.intermediate, say: `${h2} is h²; take the square root.` }].filter(w => Math.abs(w.v - h) > 1e-9), 'Right: the geometric mean.', 'Set up p/h = h/q from the two small triangles.');
  }
  return choice(R, { id: `gmAlt-${n}`, family: 'gmAlt', ...base, solution: [...sol, `h = √${h2}${rad(h2) !== `√${h2}` ? ` = ${rad(h2)}` : ''}.`] }, [
    { t: rad(h2), ok: true, say: 'Right: h² = pq.' },
    { t: fmt((p + q) / 2), mc: MC.arithMean, say: 'That is the arithmetic mean; the altitude is the geometric mean, √(pq).' },
    { t: rad(p + q), say: 'h² is the product of the two segments, not their sum.' },
    { t: String(h2), mc: MC.intermediate, say: `${h2} is h²: take the square root.` },
  ].filter((o, i, a) => a.findIndex(z => z.t === o.t) === i));
});
const LEG: [number, number][] = [[4, 5], [2, 6], [3, 9], [5, 15], [9, 16], [16, 9], [1, 8], [8, 10], [4, 12], [3, 1], [2, 3], [3, 4], [2, 5], [5, 4]];
export const gmLeg: Gen = (R, n) => fitted('gmLeg', () => {
  // p = the segment next to the asked leg, q = the far segment; c = p + q
  const [p, q] = pick(R, LEG), c = p + q, a2 = p * c, sq = isSq(a2);
  const t = roles(R, 'ABCD');
  const P0 = altPts(p, q, 380 / c, r(R, -15, 15), R() < 0.5);
  // the asked leg is AC (next to AD = p)
  const fig = altFig(t, P0, { labs: [{ seg: 'AD', text: fmt(p) }, { seg: 'DB', text: fmt(q) }, { seg: 'AC', text: '?', alt: sq ? fmt(Math.sqrt(a2)) : rad(a2) }] });
  const L = nm(t, 'AC');
  const base = { prompt: `Right ${triN(nm(t, 'ACB'))} with the altitude ${segN(nm(t, 'CD'))}. Find the leg ${L}${sq ? '' : ' exactly'}.`, board: `\\frac{${nm(t, 'AB')}}{${L}} = \\frac{${L}}{${nm(t, 'AD')}}`, picture: { fig, reveal: { solved: [L] } } };
  const sol = [`The whole hypotenuse: ${nm(t, 'AB')} = ${p} + ${q} = ${c}.`, `${simH(nm(t, 'ADC'), nm(t, 'ACB'))}: ${nm(t, 'AD')}/${L} = ${L}/${nm(t, 'AB')}, so ${L}² = ${p} × ${c} = ${a2}.`];
  if (sq) {
    const a = Math.sqrt(a2);
    const w = [{ v: Math.sqrt(q * c), mc: MC.farSeg, say: `${L} pairs with its own segment ${nm(t, 'AD')} = ${p} (next to it), not with ${nm(t, 'DB')}.` }, { v: Math.sqrt(p * q), mc: MC.partHyp, say: `Use the whole hypotenuse ${nm(t, 'AB')} = ${c}, not the other part: ${L}² = ${p} × ${c}.` }, { v: (p + c) / 2, mc: MC.arithMean, say: 'Geometric mean, not arithmetic mean: square root of the product.' }].filter(x => Number.isInteger(x.v * 2) && Math.abs(x.v - a) > 1e-9);
    return numItem({ id: `gmLeg-${n}`, family: 'gmLeg', ...base, unit: '', solution: [...sol, `${L} = √${a2} = <b class="s">${a}</b>.`] }, a, w, 'Right: the leg is the geometric mean of its segment and the whole hypotenuse.', 'leg² = (segment next to the leg) × (whole hypotenuse).');
  }
  return choice(R, { id: `gmLeg-${n}`, family: 'gmLeg', ...base, solution: [...sol, `${L} = ${rad(a2)}.`] }, [
    { t: rad(a2), ok: true, say: 'Right: leg² = (adjacent segment) × (whole hypotenuse).' },
    { t: rad(q * c), mc: MC.farSeg, say: `${L} pairs with the segment next to it, ${nm(t, 'AD')} = ${p}.` },
    { t: rad(p * q), mc: MC.partHyp, say: `Use the whole hypotenuse ${c}, not the other part.` },
    { t: fmt((p + c) / 2), mc: MC.arithMean, say: 'Geometric mean: the square root of the product.' },
  ].filter((o, i, a) => a.findIndex(z => z.t === o.t) === i && (o.ok || o.t !== rad(a2))));
});
export const gmDerive: Gen = (R, n) => fitted('gmDerive', () => {
  const t = roles(R, 'ABCD');
  const [p, q] = pick(R, ALT_PQ.filter(x => x[0] !== x[1]));
  const fig = altFig(t, altPts(p, q, 380 / (p + q), r(R, -15, 15), R() < 0.5));
  const L0 = lengthsOf(genericAltitude());
  const L: Record<string, number> = {};
  for (const [kk, v] of Object.entries(L0)) L[[...nm(t, kk)].sort().join('')] = v;
  const which = pick(R, ['h', 'legA', 'legB'] as const);
  const N = (s: string) => nm(t, s);
  const right: Prop = which === 'h' ? [N('AD'), N('CD'), N('CD'), N('DB')] : which === 'legA' ? [N('AD'), N('AC'), N('AC'), N('AB')] : [N('DB'), N('CB'), N('CB'), N('AB')];
  const stmt = which === 'h' ? simH(N('ADC'), N('CDB')) : which === 'legA' ? simH(N('ADC'), N('ACB')) : simH(N('CDB'), N('ACB'));
  const opts = propOpts(L, right, [
    { p: [N('AD'), N('CD'), N('DB'), N('CD')], mc: MC.inconsistent, say: 'Keep one order in both ratios.' },
    { p: [N('AD'), N('AC'), N('AC'), N('DB')], mc: MC.partHyp, say: 'A leg pairs with the whole hypotenuse, not with the other part.' },
    { p: [N('DB'), N('AC'), N('AC'), N('AB')], mc: MC.farSeg, say: 'A leg pairs with the segment next to it.' },
    { p: [N('AD'), N('CD'), N('CD'), N('AB')], mc: MC.partHyp, say: 'The altitude pairs with the two parts of the hypotenuse.' },
    { p: [N('AD'), N('CD'), N('AC'), N('CB')], mc: MC.ignoreCorr, say: 'Read corresponding sides from the statement, letter under letter.' },
  ], 'Right: corresponding sides of the two similar triangles.');
  return choice(R, {
    id: `gmDerive-${n}`, family: 'gmDerive', prompt: `${stmt}. Which proportion follows from it?`, board: simT(...(stmt.replace(/△/g, '').split(' ~ ') as [string, string])),
    solution: [`Letter under letter in ${stmt}.`, `So ${right[0]}/${right[1]} = ${right[2]}/${right[3]}: a ${which === 'h' ? 'altitude' : 'leg'} is the geometric mean.`],
    picture: { fig, reveal: {} },
  }, opts);
});

// ---------- hourglass-figures ----------
function hourNums(R: () => number) {
  for (;;) {
    const k = pick(R, [[3, 2], [2, 1], [5, 3], [4, 3], [5, 2], [3, 4], [2, 3], [1, 2]] as Q[]);
    const AE = k[1] * r(R, 1, 4), BE = k[1] * r(R, 1, 4), AB = k[1] * r(R, 1, 4);
    if (AE === BE || AB + AE <= BE * 1.2 || AB + BE <= AE * 1.2 || AE + BE <= AB * 1.2) continue;
    const kk = k[0] / k[1];
    const out = { k, AE, BE, AB, EC: AE * kk, ED: BE * kk, CD: AB * kk };
    if (Object.values(out).some(v => typeof v === 'number' && (v < 2 || v > 30))) continue;
    return out;
  }
}
export const hourStmt: Gen = (R, n) => fitted('hourStmt', () => {
  const par = R() < 0.7;
  const H = hourNums(R), t = roles(R);
  const kD = par ? H.k[0] / H.k[1] : (H.k[0] / H.k[1]) * pick(R, [0.75, 1.3]);
  const P0 = hourPts(H.AB, H.AE, H.BE, H.k[0] / H.k[1], 330 / Math.max(H.AB, H.AE, H.BE, H.CD, H.EC), r(R, -10, 10), kD);
  const fig = hourFig(t, P0, { par });
  const P = Object.fromEntries(Object.entries(P0).map(([kk, v]) => [t[kk]!, v])) as Record<string, Pt>;
  const X = nm(t, 'ABE'), good = nm(t, 'CDE'), byPos = nm(t, 'DCE');
  if (par && !simValid(P, X, good)) fail();
  const opts: Opt[] = par ? [
    { t: `${simH(X, good)}, by AA`, ok: true, say: 'Right: vertical angles at E, and alternate interior angles from the parallel sides.' },
    { t: `${simH(X, byPos)}, by AA`, mc: MC.byPosition, say: `${nm(t, 'A')} matches ${nm(t, 'C')} (alternate interior angles), not the vertex below it on the page.` },
    { t: 'Not justified: only the vertical angles are known', mc: MC.noCritNot, say: 'The chevrons mark the sides parallel: that gives alternate interior angles too.' },
    { t: `${simH(X, good)}, by SAS~`, mc: MC.noHyp, say: 'No side ratios are given: the two angle pairs make it AA.' },
  ] : [
    { t: 'Not justified: only the vertical angles are known', ok: true, say: 'Right: without parallel sides there is only one angle pair.' },
    { t: `${simH(X, good)}, by AA`, mc: MC.looks, say: 'Nothing marks the sides parallel: the figure only looks that way.' },
    { t: `${simH(X, byPos)}, by AA`, mc: MC.looks, say: 'Nothing marks the sides parallel, so there is no second angle pair.' },
  ];
  return choice(R, {
    id: `hourStmt-${n}`, family: 'hourStmt', prompt: `${segN(nm(t, 'AC'))} and ${segN(nm(t, 'BD'))} cross at ${nm(t, 'E')}. ${par ? `${segN(nm(t, 'AB'))} ∥ ${segN(nm(t, 'CD'))}.` : 'Nothing else is given.'} What can you conclude?`, board: par ? `\\overline{${nm(t, 'AB')}} \\parallel \\overline{${nm(t, 'CD')}}` : '\\text{only what is marked}',
    solution: par ? [`∠${nm(t, 'AEB')} ≅ ∠${nm(t, 'CED')} (vertical angles).`, `∠${nm(t, 'BAE')} ≅ ∠${nm(t, 'DCE')} (alternate interior angles).`, `So ${simH(X, good)} by AA: ${nm(t, 'A')} ↔ ${nm(t, 'C')}, ${nm(t, 'B')} ↔ ${nm(t, 'D')}, ${nm(t, 'E')} ↔ ${nm(t, 'E')}.`] : ['Only the vertical angles at the crossing are known.', 'One angle pair is not enough: no similarity is justified.'],
    picture: { fig, reveal: {} },
  }, opts);
});
export const hourLen: Gen = (R, n) => fitted('hourLen', () => {
  const H = hourNums(R), t = roles(R);
  const P0 = hourPts(H.AB, H.AE, H.BE, H.k[0] / H.k[1], 330 / Math.max(H.AB, H.AE, H.BE, H.CD, H.EC), r(R, -10, 10));
  const askCD = R() < 0.5;
  const labs = askCD ? [{ seg: 'AE', text: fmt(H.AE) }, { seg: 'EC', text: fmt(H.EC) }, { seg: 'AB', text: fmt(H.AB) }, { seg: 'CD', text: '?', alt: fmt(H.CD) }]
    : [{ seg: 'AB', text: fmt(H.AB) }, { seg: 'CD', text: fmt(H.CD) }, { seg: 'BE', text: fmt(H.BE) }, { seg: 'ED', text: '?', alt: fmt(H.ED) }];
  const fig = hourFig(t, P0, { labs, par: true });
  const a = askCD ? H.CD : H.ED;
  const kk = H.k[0] / H.k[1];
  const wrongs = [{ v: askCD ? H.AB / kk : H.BE / kk, mc: MC.inconsistent, say: 'Keep the direction: bottom triangle over top triangle in both ratios.' }, { v: askCD ? H.AB + H.EC - H.AE : H.BE + H.CD - H.AB, mc: MC.additive, say: 'Multiply by one factor; do not add the difference.' }].filter(w => w.v > 0 && Math.abs(w.v - a) > 1e-9);
  const X = askCD ? nm(t, 'CD') : nm(t, 'ED');
  return numItem({
    id: `hourLen-${n}`, family: 'hourLen', prompt: `${segN(nm(t, 'AB'))} ∥ ${segN(nm(t, 'CD'))}, so ${simH(nm(t, 'ABE'), nm(t, 'CDE'))}. Find ${X}.`, board: simT(nm(t, 'ABE'), nm(t, 'CDE')), unit: '',
    solution: [askCD ? `${nm(t, 'EC')} ↔ ${nm(t, 'AE')}: k = ${fmt(H.EC)}/${fmt(H.AE)} = ${qHtml(H.k)}.` : `${nm(t, 'CD')} ↔ ${nm(t, 'AB')}: k = ${fmt(H.CD)}/${fmt(H.AB)} = ${qHtml(H.k)}.`, askCD ? `${X} = ${qHtml(H.k)} × ${fmt(H.AB)} = <b class="s">${fmt(a)}</b>.` : `${X} = ${qHtml(H.k)} × ${fmt(H.BE)} = <b class="s">${fmt(a)}</b>.`],
    picture: { fig, reveal: { solved: [X] } },
  }, a, wrongs, 'Right: the opposite-facing triangle, matched by its angles.', 'Match A with C and B with D (alternate interior angles), find k, multiply.');
});

// ---------- algebraic-side-lengths ----------
export const algNest: Gen = (R, n) => fitted('algNest', () => {
  // AD = x, DB = d, AE = e, EC = f with x/(x + d) = e/(e + f), so x f = d e
  let x = 0, d = 0, e = 0, f = 0;
  for (;;) { d = r(R, 2, 6); e = r(R, 3, 9); f = r(R, 2, 6); x = (d * e) / f; if (Number.isInteger(x) && x >= 2 && x <= 15 && x !== d && e !== f) break; }
  const t = roles(R);
  const AB = x + d, AC = e + f, angA = r(R, 45, 70);
  const BC = Math.sqrt(AB * AB + AC * AC - 2 * AB * AC * Math.cos((angA * Math.PI) / 180));
  const P0 = nested(AB, AC, BC, x / AB, 380 / Math.max(AB, AC, BC), tilt(R) / 2);
  const askLen = R() < 0.35;
  const fig = nestedFig(t, P0, { labs: [{ seg: 'AD', text: 'x', alt: fmt(x) }, { seg: 'DB', text: fmt(d) }, { seg: 'AE', text: fmt(e) }, { seg: 'EC', text: fmt(f) }], par: true });
  const ans2 = askLen ? x + d : x;
  const pw = (d * e) / (e + f);
  const wrongs = [{ v: askLen ? pw + d : pw, mc: MC.partWhole, say: `${nm(t, 'AD')} pairs with the whole ${nm(t, 'AB')} = x + ${d}: x/(x + ${d}) = ${e}/${e + f}.` }, ...(askLen ? [{ v: x, mc: MC.intermediate, say: `x = ${x}, but the question asks for ${nm(t, 'AB')} = x + ${d}.` }] : [])].filter(w => w.v > 0 && Math.abs(w.v - ans2) > 1e-9);
  return numItem({
    id: `algNest-${n}`, family: 'algNest', prompt: `${segN(nm(t, 'DE'))} ∥ ${segN(nm(t, 'BC'))}. ${askLen ? `How long is ${nm(t, 'AB')}?` : 'Solve for x.'}`, board: `\\frac{x}{x + ${d}} = \\frac{${e}}{${e + f}}`, unit: '',
    solution: [`Whole with whole: x/(x + ${d}) = ${e}/${e + f}.`, `Cross-multiply: ${e + f}x = ${e}(x + ${d}) = ${e}x + ${e * d}, so ${f}x = ${e * d} and x = ${x}.`, askLen ? `${nm(t, 'AB')} = ${x} + ${d} = <b class="s">${x + d}</b>.` : `x = <b class="s">${x}</b> (a positive length).`],
    picture: { fig, reveal: { solved: [nm(t, 'AD')] } },
  }, ans2, wrongs, 'Right.', 'Write x/(x + DB) = AE/AC and cross-multiply, distributing to both terms.');
});
export const algSep: Gen = (R, n) => fitted('algSep', () => {
  // side i of T1 = a·x + b, side j of T1 = x; partners k·(a x + b) and k·x
  let a = 0, b = 0, x = 0, k: Q = [2, 1];
  for (;;) { a = r(R, 1, 3); b = r(R, 1, 5); x = r(R, 2, 7); k = pick(R, [[2, 1], [3, 2], [3, 1], [5, 2]] as Q[]); if ((a * x + b) * k[0] % k[1] === 0 && x * k[0] % k[1] === 0) break; }
  const s1i = a * x + b, s1j = x;
  // the third side: a valid triangle with readable angles
  const lo = Math.abs(s1i - s1j) + 2, hi = s1i + s1j - 2;
  if (hi < lo) fail();
  const third = r(R, lo, hi);
  const [L1, L2] = names2(R), n2 = permOf(L2, pick(R, PERM6));
  const i = r(R, 0, 2), j = (i + 1) % 3, m = 3 - i - j;
  const s1 = [0, 0, 0]; s1[i] = s1i; s1[j] = s1j; s1[m] = third;
  if (SIDE_SETS.length && (() => { const T = [s1[0]!, s1[1]!, s1[2]!].sort((p, q) => p - q); return T[0]! + T[1]! <= T[2]! * 1.1; })()) fail();
  const kk = k[0] / k[1];
  const S2 = simPair(s1, kk, L1, n2, { rot1: tilt(R), rot2: rot2(R), flip: R() < 0.5 });
  const ex = (aa: number, bb: number) => (aa === 1 ? 'x' : `${aa}x`) + ` + ${bb}`;
  const fig = simFig(S2, { l1: { [i]: ex(a, b), [j]: 'x' }, l2: { [i]: fmt(s1i * kk), [j]: fmt(s1j * kk) }, alt1: { [j]: fmt(x) } });
  const P2 = s1i * kk, Q2 = s1j * kk;
  const askLen = R() < 0.4;
  const ans2 = askLen ? s1i : x;
  // partial distribution: Q(ax + b) -> Qax + b
  const pd = (P2 - Q2 * a) !== 0 ? b / (P2 - Q2 * a) : -1;
  const wrongs = [{ v: askLen ? a * pd + b : pd, mc: MC.partialDist, say: `Multiply both terms of ${ex(a, b)}: ${fmt(Q2)}(${ex(a, b)}) = ${fmt(Q2 * a)}x + ${fmt(Q2 * b)}.` }, ...(askLen ? [{ v: x, mc: MC.intermediate, say: `x = ${x}; the question asks for the side ${ex(a, b)}.` }] : [])].filter(w => w.v > 0 && Number.isFinite(w.v) && Math.abs(w.v - ans2) > 1e-9);
  return numItem({
    id: `algSep-${n}`, family: 'algSep', prompt: `${simH(L1, n2)}. ${askLen ? `How long is ${sideOf(L1, i)}?` : 'Solve for x.'}`, board: `\\frac{${ex(a, b)}}{${fmt(P2)}} = \\frac{x}{${fmt(Q2)}}`, unit: '',
    solution: [`Corresponding sides: ${sideOf(L1, i)} ↔ ${sideOf(n2, i)} and ${sideOf(L1, j)} ↔ ${sideOf(n2, j)}, so (${ex(a, b)})/${fmt(P2)} = x/${fmt(Q2)}.`, `Cross-multiply: ${fmt(Q2)}(${ex(a, b)}) = ${fmt(P2)}x, so ${fmt(Q2 * a)}x + ${fmt(Q2 * b)} = ${fmt(P2)}x and x = ${x}.`, askLen ? `${sideOf(L1, i)} = ${a === 1 ? '' : `${a} × `}${x} + ${b} = <b class="s">${s1i}</b>.` : `x = <b class="s">${x}</b>; every length is positive.`],
    picture: { fig, reveal: { solved: [sideOf(L1, j)] } },
  }, ans2, wrongs, 'Right.', 'Pair the sides by the statement, cross-multiply, and distribute to both terms.');
});
export { genericHourglass, genericNested, A };
