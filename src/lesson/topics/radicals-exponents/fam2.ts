// fam2.ts: radical arithmetic. Product and quotient properties, simplest radical form (numbers and variables), like
// radicals, distributing, binomial products, rationalizing (monomial and conjugate), and choosing a form / a calculator.
// Pure: no DOM.
import { fr, int, pick, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { type Base, type Gen, MC, type Opt, type TilesPic, choiceItem, near, numItem, pairItem, uniq } from './common';
import { S, type Surd, extract, gcd, iH, iT, ipow, nthFree, primes, red, rootH, rootT, sAdd, sHtml, sMul, sPart, sTex, V } from './rad';

const RW: Record<number, string> = { 2: 'square root', 3: 'cube root', 4: 'fourth root', 5: 'fifth root' };
const PW: Record<number, string> = { 2: 'square', 3: 'cube', 4: 'fourth power', 5: 'fifth power' };
const SQF = [2, 3, 5, 6, 7, 10, 11];
const sign = (v: number) => (v < 0 ? '−' : '+');

/** the tiles picture for k under an n-th root */
export function tilesFor(k: number, n: number, outTex: string, inTex: string): TilesPic | undefined {
  const ps = primes(k);
  if (ps.length > 9 || ps.length < 2) return undefined;
  const groups: number[][] = [];
  let i = 0;
  while (i < ps.length) {
    let j = i; while (j < ps.length && ps[j] === ps[i]) j++;
    for (let g = i; g + n <= j; g += n) groups.push(Array.from({ length: n }, (_, t) => g + t));
    i = j;
  }
  return { n, tiles: ps.map(String), reveal: { groups, out: outTex, inside: inTex } };
}
/** c · n-th root of r in HTML / TeX (c = 1 left out, r = 1 leaves c) */
export const crH = (c: number, r: number | string, n = 2) => (r === 1 || r === '1' ? iH(c) : `${c === 1 ? '' : c === -1 ? '−' : iH(c)}${rootH(n, r)}`);
export const crT = (c: number, r: number | string, n = 2) => (r === 1 || r === '1' ? iT(c) : `${c === 1 ? '' : c === -1 ? '-' : iT(c)}${rootT(n, r)}`);

// ===================== radical-product-rule =====================
export const radProd: Gen = (R, n) => {
  const kind = pick(R, ['sq', 'sq', 'self', 'cube', 'cube', 'four'] as const);
  let a: number, b: number, idx: number, val: number;
  if (kind === 'self') { idx = 2; a = b = pick(R, [3, 5, 6, 7, 10, 11, 13]); val = a; }
  else if (kind === 'sq') {
    for (;;) { const m = pick(R, [2, 3, 5, 6, 7]), u = int(R, 1, 4), v = int(R, 1, 4); if (u === v) continue; a = m * u * u; b = m * v * v; val = m * u * v; break; }
    idx = 2;
  } else if (kind === 'cube') {
    const [p, qq] = pick(R, [[2, 4], [4, 2], [3, 9], [9, 3], [2, 32], [4, 16], [16, 4], [32, 2], [5, 25], [25, 5]] as [number, number][]);
    const c = Math.round(Math.cbrt(p * qq)), sa = R() < 0.5 ? -1 : 1, sb = R() < 0.4 ? -1 : 1;
    a = sa * p; b = sb * qq; idx = 3; val = sa * sb * c;
  } else { const [p, qq] = pick(R, [[2, 8], [8, 2], [3, 27], [27, 3]] as [number, number][]); a = p; b = qq; idx = 4; val = Math.round(Math.pow(p * qq, 0.25)); }
  const ab = a! * b!;
  const base: Base = {
    id: `radProd-${n}`, family: 'radProd', prompt: `Multiply and simplify: ${rootH(idx, iH(a!))} · ${rootH(idx, iH(b!))}.${idx % 2 === 0 ? '' : ' (An odd root of a negative number is real.)'}`,
    board: `${rootT(idx, iT(a!))} \\cdot ${rootT(idx, iT(b!))} = \\,?`,
    solution: [`Same index: ${rootH(idx, iH(a!))} · ${rootH(idx, iH(b!))} = ${rootH(idx, `${iH(a!)} · ${iH(b!)}`)} = ${rootH(idx, iH(ab))}.`, `${val < 0 ? `(${iH(val)})` : iH(val)}<sup>${idx}</sup> = ${iH(ab)}, so the product is ${ans(iH(val))}.`],
  };
  return numItem(base, val, v => {
    if (v === val) return { ok: true, say: `Yes: ${rootH(idx, iH(ab))} = ${iH(val)}.` };
    if (kind === 'self' && v === a! * a!) return { ok: false, mc: MC.rootSelf, say: `${rootH(2, a!)} · ${rootH(2, a!)} = ${rootH(2, a! * a!)} = ${a}: a square root times itself gives back the number under it.` };
    if (v === ab) return { ok: false, mc: 'mc.exponents-roots.stops-before-taking-root', say: `${iH(ab)} is the number under the root. Now take its ${RW[idx]}.` };
    if (idx === 3 && v === -val) return { ok: false, mc: MC.dropsSign, say: `Count the minus signs: the product under the root is ${iH(ab)}.` };
    return { ok: false, say: `Multiply under one root: ${rootH(idx, iH(ab))}. Which number has ${PW[idx]} ${iH(ab)}?` };
  });
};

const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25], [15, 20, 25], [10, 24, 26], [20, 21, 29], [9, 40, 41]];
export const sumVsProd: Gen = (R, n) => {
  const [a0, b0, c] = pick(R, TRIPLES), [a, b] = R() < 0.5 ? [a0, b0] : [b0, a0], A = a * a, B = b * b;
  const sum = rootH(2, `${A} + ${B}`);
  const base: Base = {
    id: `sumVsProd-${n}`, family: 'sumVsProd', prompt: `Which statement is true?`, board: `\\sqrt{${A} + ${B}} \\quad\\text{and}\\quad \\sqrt{${A}} + \\sqrt{${B}}`,
    solution: [`Inside first: ${A} + ${B} = ${A + B}, and ${rootH(2, A + B)} = ${c}.`, `${rootH(2, A)} + ${rootH(2, B)} = ${a} + ${b} = ${a + b}: not the same. A root splits over a product, never over a sum.`],
  };
  return choiceItem(R, base, [
    { t: `${sum} = ${c}, but ${rootH(2, A)} + ${rootH(2, B)} = ${a + b}`, ok: true, say: 'Yes. The product rule splits a root over ×, not over +.' },
    { t: `${sum} = ${rootH(2, A)} + ${rootH(2, B)} = ${a + b}`, mc: MC.rootSum, say: `Check it: ${c}<sup>2</sup> = ${A + B}, so ${sum} = ${c}, not ${a + b}. A root does not split over a sum.` },
    { t: `${sum} = ${rootH(2, A)} · ${rootH(2, B)} = ${a * b}`, say: `${rootH(2, A)} · ${rootH(2, B)} is ${rootH(2, `${A} · ${B}`)}: that is the root of the PRODUCT, not of the sum.` },
    { t: `${sum} = ${a} + ${B} = ${a + B}`, mc: MC.rootFirst, say: `The root covers the whole radicand: add first (${A + B}), then take the root.` },
  ]);
};

// ===================== radical-quotient-rule =====================
export const radQuot: Gen = (R, n) => {
  const idx = pick(R, [2, 2, 3, 3, 4]);
  let r = idx === 2 ? int(R, 2, 9) : idx === 3 ? int(R, 2, 5) : int(R, 2, 3);
  const d = pick(R, idx === 2 ? [2, 3, 5] : idx === 3 ? [2, 3, 4] : [2, 3]);
  let N = ipow(r, idx) * d, D = d;
  if (idx === 3) { const s = pick(R, ['top', 'both', 'none'] as const); if (s === 'top') { N = -N; r = -r; } else if (s === 'both') { N = -N; D = -D; } }
  const base: Base = {
    id: `radQuot-${n}`, family: 'radQuot', prompt: `Divide and simplify: ${rootH(idx, iH(N))} ÷ ${rootH(idx, iH(D))}.`, board: `\\frac{${rootT(idx, iT(N))}}{${rootT(idx, iT(D))}} = \\,?`,
    solution: [`Same index: one root of the quotient, ${rootH(idx, `${iH(N)} ÷ ${iH(D)}`)} = ${rootH(idx, iH(N / D))}.`, `${r < 0 ? `(${iH(r)})` : iH(r)}<sup>${idx}</sup> = ${iH(N / D)}, so the quotient is ${ans(iH(r))}.`],
  };
  return numItem(base, r, v => {
    if (v === r) return { ok: true, say: `Yes: ${rootH(idx, iH(N / D))} = ${iH(r)}.` };
    if (v === N / D) return { ok: false, mc: 'mc.exponents-roots.stops-before-taking-root', say: `${iH(N / D)} is still under the root. Take its ${RW[idx]}.` };
    if (v === -r) return { ok: false, mc: MC.dropsSign, say: `Mind the signs: ${iH(N)} ÷ ${iH(D)} = ${iH(N / D)}.` };
    return { ok: false, say: `Divide under one root: ${iH(N)} ÷ ${iH(D)} = ${iH(N / D)}. Then take the ${RW[idx]}.` };
  });
};

export const radQuotForm: Gen = (R, n) => {
  if (R() < 0.5) {
    const p = pick(R, SQF), qd = pick(R, [2, 3, 4, 5, 6, 7].filter(x => gcd(x, p) === 1)), Q = qd * qd;
    const base: Base = {
      id: `radQuotForm-${n}`, family: 'radQuotForm', prompt: `Which expression equals ${rootH(2, fr(p, Q))}?`, board: `\\sqrt{\\frac{${p}}{${Q}}}`,
      solution: [`Quotient property: ${rootH(2, fr(p, Q))} = ${fr(rootH(2, p), rootH(2, Q))}.`, `${rootH(2, Q)} = ${qd}, so it is ${ans(fr(rootH(2, p), qd))}.`],
    };
    return choiceItem(R, base, [
      { t: fr(rootH(2, p), qd), ok: true, say: `Yes: the root of the top over the root of the bottom, and ${rootH(2, Q)} = ${qd}.` },
      { t: fr(rootH(2, p), Q), mc: MC.rootFirst, say: `The root covers the whole fraction: the bottom gets a root too, ${rootH(2, Q)} = ${qd}.` },
      { t: fr(p, qd), say: `The top keeps its root: ${p} is not a perfect square, so ${rootH(2, p)} stays.` },
      { t: rootH(2, fr(p, qd)), say: `Only the bottom came out of the root, and it came out as ${qd}: ${fr(rootH(2, p), qd)}.` },
    ]);
  }
  const r = int(R, 2, 6), d = pick(R, [2, 3, 5]), N = r * r * d;
  const base: Base = {
    id: `radQuotForm-${n}`, family: 'radQuotForm', prompt: 'Which quotient can be rewritten as ONE root with the quotient property, as a real number?',
    board: `\\frac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\frac{a}{b}}`,
    solution: ['The property needs the same index, a top radicand ≥ 0 and a bottom radicand &gt; 0 (an even root).', `So: ${ans(fr(rootH(2, N), rootH(2, d)))} = ${rootH(2, N / d)} = ${r}.`],
  };
  return choiceItem(R, base, [
    { t: fr(rootH(2, N), rootH(2, d)), ok: true, say: `Yes: same index, both radicands positive: ${rootH(2, N / d)} = ${r}.` },
    { t: fr(rootH(2, `−${N}`), rootH(2, `−${d}`)), mc: MC.allowsNeg, say: `${rootH(2, `−${N}`)} is not a real number: an even root needs a radicand ≥ 0.` },
    { t: fr(rootH(2, N), rootH(2, 0)), mc: MC.denZero, say: `${rootH(2, 0)} = 0, and nothing can be divided by 0.` },
    { t: fr(rootH(3, N), rootH(2, d)), mc: MC.ignoreIndex, say: 'A cube root and a square root are different operations: the property needs the same index.' },
  ]);
};

// ===================== extract-perfect-powers-numeric =====================
function simplifyCase(R: () => number): { k: number; idx: number; out: number; rest: number } {
  for (;;) {
    const idx = R() < 0.72 ? 2 : 3;
    if (idx === 2) {
      if (R() < 0.12) { const k = pick(R, [6, 10, 14, 15, 21, 22, 30, 33, 35]); return { k, idx, out: 1, rest: k }; }
      const s = int(R, 2, 12), m = pick(R, SQF), k = s * s * m;
      if (k > 200) continue;
      return { k, idx, out: s, rest: m };
    }
    const s = int(R, 2, 5), m = pick(R, [2, 3, 4, 5, 6, 7, 9]), k = s * s * s * m;
    if (k > 500) continue;
    return { k, idx, out: s, rest: m };
  }
}
export const simplifyRoot: Gen = (R, n) => {
  const { k, idx, out, rest } = simplifyCase(R);
  const sym = idx === 2 ? '√' : '∛';
  const pf = ipow(out, idx);
  const base: Base = {
    id: `simplifyRoot-${n}`, family: 'simplifyRoot',
    prompt: `Write ${rootH(idx, k)} in simplest radical form: a whole number times a ${RW[idx]}. (Type 1 in the first box if nothing comes out.)`,
    board: `${rootT(idx, k)} = \\square\\,${rootT(idx, '\\square')}`,
    solution: out === 1
      ? [`${k} = ${primes(k).join(' · ')}: no factor appears ${idx === 2 ? 'twice' : 'three times'}, so nothing comes out.`, `Nothing comes out: ${rootH(idx, k)} = ${ans(1)} · ${rootH(idx, ans(k))}, already simplest.`]
      : [`Largest perfect ${PW[idx]} factor: ${k} = ${pf} · ${rest}.`, `${rootH(idx, k)} = ${rootH(idx, pf)} · ${rootH(idx, rest)} = ${out}${rootH(idx, rest)}.`, `So ${ans(out)} and ${ans(rest)} (no perfect ${PW[idx]} left in ${rest}).`],
    picture: { tiles: tilesFor(k, idx, iT(out), String(rest)) },
  };
  return pairItem(base, out, rest, '', sym, '', (x, y) => {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || y < 1) return { ok: false, say: 'Type two whole numbers.' };
    if (x === out && y === rest) return { ok: true, say: `Yes: ${rootH(idx, k)} = ${crH(out, rest, idx)}.` };
    if (ipow(x, idx) * y === k) return { ok: false, mc: MC.partial, say: `Equal, but not finished: ${y} still has a perfect ${PW[idx]} factor. Take out the largest one.` };
    if (x * y === k && x > 1 && extract(x, idx).rest === 1) return { ok: false, mc: MC.noRoot, say: `${x} came out without its root: outside it is ${rootH(idx, x)} = ${Math.round(Math.pow(x, 1 / idx))}.` };
    return { ok: false, say: `Find the largest perfect ${PW[idx]} that divides ${k}, and take its root out.` };
  });
};

export const simplestPick: Gen = (R, n) => {
  for (;;) {
    const s = pick(R, [4, 6, 8, 9, 10, 12]), m = pick(R, [2, 3, 5, 6, 7]), k = s * s * m;
    if (k > 600) continue;
    const ds = [2, 3, 4, 5, 6].filter(d => s % d === 0 && d < s);
    const partials = shuffle(R, ds.map(d => ({ t: crH(d, k / (d * d)), mc: MC.partial, say: `Equal to ${rootH(2, k)}, but ${k / (d * d)} still has a perfect square factor. Keep going.` }))).slice(0, 2);
    const base: Base = {
      id: `simplestPick-${n}`, family: 'simplestPick', prompt: `Which is ${rootH(2, k)} in simplest radical form?`, board: `\\sqrt{${k}}`,
      solution: [`Largest perfect square factor: ${k} = ${s * s} · ${m}.`, `${rootH(2, k)} = ${rootH(2, s * s)} · ${rootH(2, m)} = ${ans(crH(s, m))}.`],
      picture: { tiles: tilesFor(k, 2, iT(s), String(m)) },
    };
    const opts = uniq([
      { t: crH(s, m), ok: true, say: `Yes: ${s * s} is the largest square factor, and ${m} has none left.` },
      ...partials,
      { t: crH(s * s, m), mc: MC.noRoot, say: `${s * s} comes out as its root: ${rootH(2, s * s)} = ${s}.` },
    ]);
    if (opts.length < 3) continue;
    return choiceItem(R, base, opts);
  }
};

// ===================== extract-variable-powers =====================
/** c · x^q · n-th root of (m x^r) in HTML (x ≥ 0) */
export function vrH(c: number, q: number, m: number, r: number, n = 2, x = 'x'): string {
  const inside = `${m > 1 ? m : ''}${r ? (r === 1 ? V(x) : `${V(x)}<sup>${r}</sup>`) : ''}`;
  const outside = `${c === 1 && q ? '' : iH(c)}${q ? (q === 1 ? V(x) : `${V(x)}<sup>${q}</sup>`) : ''}`;
  return inside ? `${outside}${rootH(n, inside)}` : outside || '1';
}
export function vrT(c: number, q: number, m: number, r: number, n = 2, x = 'x'): string {
  const inside = `${m > 1 ? m : ''}${r ? (r === 1 ? x : `${x}^{${r}}`) : ''}`;
  const outside = `${c === 1 && q ? '' : iT(c)}${q ? (q === 1 ? x : `${x}^{${q}}`) : ''}`;
  return inside ? `${outside}${rootT(n, inside)}` : outside || '1';
}
export const varExtract: Gen = (R, n) => {
  for (;;) {
    const idx = R() < 0.7 ? 2 : 3;
    const s = int(R, 1, idx === 2 ? 4 : 3), m = pick(R, idx === 2 ? [1, 2, 3, 5, 6, 7] : [1, 2, 3, 4]), e = int(R, idx + 1, idx === 2 ? 9 : 8);
    const c = ipow(s, idx) * m, q = Math.floor(e / idx), r = e % idx;
    if (m === 1 && r === 0) continue;
    if (c === 1 && r === 0) continue;
    const X = V('x'), rad = `${c > 1 ? c : ''}${X}<sup>${e}</sup>`;
    const opts = uniq([
      { t: vrH(s, q, m, r, idx), ok: true, say: `Yes: ${s > 1 ? `${ipow(s, idx)} gives ${s}, ` : ''}${X}<sup>${e}</sup> = ${X}<sup>${q * idx}</sup> · ${r ? `${X}<sup>${r}</sup>` : '1'}, and ${X}<sup>${q * idx}</sup> comes out as ${X}<sup>${q}</sup>.` },
      ...(r ? [{ t: vrH(s, q, m, 0, idx), mc: MC.dropRem, say: `The leftover ${r === 1 ? X : `${X}<sup>${r}</sup>`} stays under the root: it does not disappear.` }] : []),
      ...(s > 1 ? [{ t: vrH(ipow(s, idx), q, m, r, idx), mc: MC.noRoot, say: `${ipow(s, idx)} comes out as its root: ${s}.` }] : []),
      { t: vrH(s, q * idx, m, r, idx), mc: MC.noRoot, say: `${X}<sup>${q * idx}</sup> comes out as its ${RW[idx]}: ${X}<sup>${q}</sup>.` },
      { t: vrH(s, q + 1, m, 0, idx), say: `Only complete groups of ${idx} come out: ${e} = ${idx} · ${q} + ${r}.` },
    ]).slice(0, 4);
    if (opts.length < 3 || !opts.some(o => o.ok)) continue;
    const base: Base = {
      id: `varExtract-${n}`, family: 'varExtract', prompt: `<i>x</i> ≥ 0. Simplify ${rootH(idx, rad)}.`, board: rootT(idx, `${c > 1 ? c : ''}x^{${e}}`),
      solution: [`Split: ${c > 1 ? `${c} = ${ipow(s, idx)} · ${m}, ` : ''}${X}<sup>${e}</sup> = ${X}<sup>${q * idx}</sup>${r ? ` · ${X}<sup>${r}</sup>` : ''} (groups of ${idx}).`, `Perfect ${PW[idx]}s come out: ${ans(vrH(s, q, m, r, idx))}.`],
    };
    return choiceItem(R, base, opts);
  }
};

export const varPower: Gen = (R, n) => {
  for (;;) {
    const idx = R() < 0.65 ? 2 : 3, e = int(R, idx + 1, 11);
    const q = Math.floor(e / idx), r = e % idx;
    if (r === 0) continue;
    const vl = pick(R, ['x', 'y', 'a', 't']), X = V(vl), sym = idx === 2 ? '√' : '∛';
    const base: Base = {
      id: `varPower-${n}`, family: 'varPower', prompt: `${X} ≥ 0. Write ${rootH(idx, `${X}<sup>${e}</sup>`)} as ${X}<sup>p</sup> · ${rootH(idx, `${X}<sup>q</sup>`)} with as much outside the root as possible.`,
      board: `${rootT(idx, `${vl}^{${e}}`)} = ${vl}^{\\square}\\,${rootT(idx, `${vl}^{\\square}`)}`,
      solution: [`Groups of ${idx}: ${e} = ${idx} · ${q} + ${r}.`, `${X}<sup>${idx * q}</sup> comes out as ${X}<sup>${q}</sup>; ${X}<sup>${r}</sup> stays inside: exponents ${ans(q)} and ${ans(r)}.`],
    };
    return pairItem(base, q, r, `${X} ^`, `· ${sym}${X} ^`, '', (x, y) => {
      if (x === q && y === r) return { ok: true, say: `Yes: ${q === 1 ? X : `${X}<sup>${q}</sup>`}${rootH(idx, r === 1 ? X : `${X}<sup>${r}</sup>`)}.` };
      if (near(x, e / idx) ) return { ok: false, mc: MC.divIndex, say: `Only whole groups of ${idx} leave the root: ${e} ÷ ${idx} = ${q} remainder ${r}.` };
      if (x === q && y === 0) return { ok: false, mc: MC.dropRem, say: `The remainder stays under the root: ${X}<sup>${r}</sup>.` };
      if (x * idx + y === e && y >= idx) return { ok: false, mc: MC.partial, say: `More can come out: ${X}<sup>${y}</sup> still holds a group of ${idx}.` };
      return { ok: false, say: `Split ${e} into groups of ${idx} plus a remainder.` };
    });
  }
};

// ===================== like-radicals =====================
export const likeAdd: Gen = (R, n) => {
  for (;;) {
    const m = pick(R, [2, 3, 5, 6, 7]), kind = pick(R, ['like', 'simp', 'simp', 'coef'] as const), op = R() < 0.65 ? 1 : -1;
    let t1: { c: number; k: number }, t2: { c: number; k: number };
    if (kind === 'like') t1 = { c: int(R, 2, 7), k: m }, t2 = { c: int(R, 1, 6), k: m };
    else if (kind === 'simp') { const u = int(R, 1, 5), v = int(R, 1, 5); if (u === v || (u === 1 && v === 1)) continue; t1 = { c: 1, k: u * u * m }; t2 = { c: 1, k: v * v * m }; }
    else { const u = int(R, 1, 4), v = int(R, 1, 4); if (u === v) continue; t1 = { c: int(R, 2, 4), k: u * u * m }; t2 = { c: int(R, 2, 4), k: v * v * m }; }
    if (t1.k > 200 || t2.k > 200) continue;
    const coef = t1.c * extract(t1.k, 2).out + op * t2.c * extract(t2.k, 2).out;
    if (coef <= 0) continue;
    const h = `${crH(t1.c, t1.k)} ${op > 0 ? '+' : '−'} ${crH(t2.c, t2.k)}`;
    const base: Base = {
      id: `likeAdd-${n}`, family: 'likeAdd', prompt: `Simplify ${h}. Answer in simplest radical form.`, board: `${crT(t1.c, t1.k)} ${op > 0 ? '+' : '-'} ${crT(t2.c, t2.k)} = \\square\\,\\sqrt{\\square}`,
      solution: [
        ...(kind !== 'like' ? [`Simplify each: ${crH(t1.c, t1.k)} = ${crH(t1.c * extract(t1.k, 2).out, m)}, ${crH(t2.c, t2.k)} = ${crH(t2.c * extract(t2.k, 2).out, m)}.`] : []),
        ...(kind === 'like' ? [`Both terms are multiples of ${rootH(2, m)}: like terms, like 3x and 2x.`] : []),
        `Like radicals: combine the numbers in front of ${rootH(2, m)}: ${ans(coef)}${rootH(2, ans(m))}.`],
    };
    return pairItem(base, coef, m, '', '√', '', (x, y) => {
      if (x === coef && y === m) return { ok: true, say: `Yes: ${crH(coef, m)}.` };
      if (y > 0 && Number.isInteger(y) && x > 0 && extract(y, 2).out > 1 && near(x * Math.sqrt(y), coef * Math.sqrt(m))) return { ok: false, mc: MC.partial, say: `Equal, but not in simplest form: ${y} still has a perfect square factor.` };
      if (y === t1.k + op * t2.k || y === t1.k + t2.k) return { ok: false, mc: MC.addRad, say: `Radicands never add: ${rootH(2, 1)} + ${rootH(2, 1)} = 2, not ${rootH(2, 2)}. Combine like radicals like like terms.` };
      return { ok: false, say: `Simplify each radical first, then combine the numbers in front of ${rootH(2, m)}.` };
    });
  }
};

export const likeWhich: Gen = (R, n) => {
  const kind = pick(R, ['unlike', 'index', 'int', 'simp', 'like'] as const);
  const SIMPLEST = 'It is already in simplest form';
  if (kind === 'unlike') {
    const [p, qq] = shuffle(R, [2, 3, 5, 6, 7, 10, 11].slice()).slice(0, 2) as [number, number];
    const h = `${rootH(2, p)} + ${rootH(2, qq)}`;
    const base: Base = { id: `likeWhich-${n}`, family: 'likeWhich', prompt: `Simplify ${h}.`, board: `\\sqrt{${p}} + \\sqrt{${qq}}`, solution: [`${p} and ${qq} have no square factors, so the radicals are unlike.`, `Unlike radicals do not combine: ${ans(SIMPLEST)}.`] };
    return choiceItem(R, base, [
      { t: SIMPLEST, ok: true, say: 'Right: different radicands with no square factors are unlike terms.' },
      { t: rootH(2, p + qq), mc: MC.addRad, say: `Radicands do not add: ${rootH(2, p)} + ${rootH(2, qq)} ≈ ${(Math.sqrt(p) + Math.sqrt(qq)).toFixed(2)}, but ${rootH(2, p + qq)} ≈ ${Math.sqrt(p + qq).toFixed(2)}.` },
      { t: rootH(2, p * qq), say: `That is the PRODUCT ${rootH(2, p)} · ${rootH(2, qq)}, not the sum.` },
      { t: `2${rootH(2, p + qq)}`, mc: MC.unlikeTerms, say: 'Unlike radicals are unlike terms: they cannot be merged into one term.' },
    ]);
  }
  if (kind === 'index') {
    const p = pick(R, [2, 3, 5, 6, 7]);
    const base: Base = { id: `likeWhich-${n}`, family: 'likeWhich', prompt: `Simplify ${rootH(2, p)} + ${rootH(3, p)}.`, board: `\\sqrt{${p}} + \\sqrt[3]{${p}}`, solution: [`A square root and a cube root are different numbers (${Math.sqrt(p).toFixed(2)} and ${Math.cbrt(p).toFixed(2)}): unlike radicals.`, `So: ${ans(SIMPLEST)}.`] };
    return choiceItem(R, base, [
      { t: SIMPLEST, ok: true, say: 'Right: different indices make unlike radicals.' },
      { t: `2${rootH(2, p)}`, mc: MC.ignoreIndex, say: `${rootH(3, p)} is not ${rootH(2, p)}: the index matters.` },
      { t: `2${rootH(3, p)}`, mc: MC.ignoreIndex, say: `${rootH(2, p)} is not ${rootH(3, p)}: the index matters.` },
      { t: rootH(5, p), say: 'Indices do not add. The two radicals are unlike terms.' },
    ]);
  }
  if (kind === 'int') {
    const a = int(R, 2, 7), b = int(R, 2, 6), m = pick(R, [2, 3, 5, 7]);
    const base: Base = { id: `likeWhich-${n}`, family: 'likeWhich', prompt: `Simplify ${a} + ${b}${rootH(2, m)}.`, board: `${a} + ${b}\\sqrt{${m}}`, solution: [`${a} is a whole number and ${b}${rootH(2, m)} is a multiple of ${rootH(2, m)}: unlike terms.`, `So: ${ans(SIMPLEST)}.`] };
    return choiceItem(R, base, uniq([
      { t: SIMPLEST, ok: true, say: 'Right: a whole number and a radical are unlike terms, like 2 + 3x.' },
      { t: `${a + b}${rootH(2, m)}`, mc: MC.unlikeTerms, say: `${a} has no ${rootH(2, m)} in it. Like 2 + 3x, it stays as two terms.` },
      { t: `${a * b}${rootH(2, m)}`, say: 'Nothing is multiplied here: it is a sum of unlike terms.' },
      { t: rootH(2, a * a + b * b * m), mc: MC.unlikeTerms, say: `That is not equal: unlike terms just stay side by side.` },
    ]));
  }
  const m = pick(R, [2, 3, 5]);
  let u = int(R, 1, 4), v = int(R, 2, 5);
  if (u === v) v = u + 1;
  if (kind === 'like') {
    const a = int(R, 2, 6), b = int(R, 2, 5);
    const base: Base = { id: `likeWhich-${n}`, family: 'likeWhich', prompt: `Simplify ${a}${rootH(2, m)} + ${b}${rootH(2, m)}.`, board: `${a}\\sqrt{${m}} + ${b}\\sqrt{${m}}`, solution: [`Like radicals: both are multiples of ${rootH(2, m)}.`, `${a} + ${b} = ${a + b}: ${ans(`${a + b}${rootH(2, m)}`)}.`] };
    return choiceItem(R, base, uniq([
      { t: `${a + b}${rootH(2, m)}`, ok: true, say: `Yes: ${a} of them plus ${b} of them.` },
      { t: `${a + b}${rootH(2, 2 * m)}`, mc: MC.addRad, say: `The radicand stays: like 3x + 2x = 5x, not 5x². ${a + b}${rootH(2, m)}.` },
      { t: SIMPLEST, mc: MC.outsideUnlike, say: `Different numbers in front do not make them unlike: both are multiples of ${rootH(2, m)}.` },
      { t: `${a * b}${rootH(2, m)}`, say: 'Adding like terms adds the coefficients.' },
    ]));
  }
  const A = u * u * m, B = v * v * m;
  const base: Base = { id: `likeWhich-${n}`, family: 'likeWhich', prompt: `Simplify ${rootH(2, A)} + ${rootH(2, B)}.`, board: `\\sqrt{${A}} + \\sqrt{${B}}`, solution: [`Simplify first: ${rootH(2, A)} = ${crH(u, m)}, ${rootH(2, B)} = ${crH(v, m)}.`, `Now they are like: ${ans(crH(u + v, m))}.`] };
  return choiceItem(R, base, uniq([
    { t: crH(u + v, m), ok: true, say: `Yes: after simplifying, both are multiples of ${rootH(2, m)}.` },
    { t: SIMPLEST, mc: MC.notSimplified, say: `Simplify first: ${rootH(2, A)} = ${crH(u, m)} and ${rootH(2, B)} = ${crH(v, m)}. Now they are like.` },
    { t: rootH(2, A + B), mc: MC.addRad, say: 'Radicands do not add. Simplify each radical, then combine like radicals.' },
    { t: crH(u * v, m), say: `Adding like terms adds the coefficients: ${u} + ${v}.` },
  ]));
};

// ===================== distribute-radicals =====================
export const monoMono: Gen = (R, n) => {
  for (;;) {
    const p = pick(R, [2, 3, 5, 6, 7, 10]), qq = pick(R, [2, 3, 5, 6, 7, 10, 15]), a = int(R, 2, 5), b = int(R, 2, 5);
    const pq = p * qq, { out, rest } = extract(pq, 2);
    if (out === 1 || rest === 1) continue;
    const coef = a * b * out;
    const base: Base = {
      id: `monoMono-${n}`, family: 'monoMono', prompt: `Multiply and simplify ${a}${rootH(2, p)} · ${b}${rootH(2, qq)}.`, board: `${a}\\sqrt{${p}} \\cdot ${b}\\sqrt{${qq}} = \\square\\,\\sqrt{\\square}`,
      solution: [`Numbers times numbers, roots times roots: ${a} · ${b} = ${a * b} and ${rootH(2, p)} · ${rootH(2, qq)} = ${rootH(2, pq)}.`, `${rootH(2, pq)} = ${crH(out, rest)}, so ${a * b} · ${crH(out, rest)} = ${ans(coef)}${rootH(2, ans(rest))}.`],
    };
    return pairItem(base, coef, rest, '', '√', '', (x, y) => {
      if (x === coef && y === rest) return { ok: true, say: `Yes: ${crH(coef, rest)}.` };
      if (x === a * b && y === pq) return { ok: false, mc: MC.partial, say: `Equal, but ${pq} has the square factor ${out * out}: take it out.` };
      if (y > 0 && Number.isInteger(y) && near(x * Math.sqrt(y), coef * Math.sqrt(rest))) return { ok: false, mc: MC.partial, say: 'Equal, but not in simplest form yet.' };
      return { ok: false, say: `Multiply the numbers in front, multiply the radicands, then simplify ${rootH(2, pq)}.` };
    });
  }
};

export const monoSum: Gen = (R, n) => {
  for (;;) {
    if (R() < 0.5) {
      const p = pick(R, [2, 3, 5, 6]), qq = pick(R, [2, 3, 5, 6, 10, 12, 15]), c = int(R, 2, 6) * (R() < 0.3 ? -1 : 1);
      if (p === qq) continue;
      const right = sAdd(S(1, p * qq), S(c, p));
      if (right.size < 2) continue;
      const opts = uniq([
        { t: sHtml(right), ok: true, say: `Yes: ${rootH(2, p)} times each term: ${rootH(2, p * qq)} = ${sHtml(S(1, p * qq))}, and ${iH(c)}${rootH(2, p)}.` },
        { t: sHtml(sAdd(S(1, p * qq), S(c))), mc: MC.partialDist, say: `${rootH(2, p)} multiplies BOTH terms: the ${iH(c)} becomes ${iH(c)}${rootH(2, p)}.` },
        { t: sHtml(sAdd(S(1, p * qq), S(-c, p))), mc: MC.detached, say: `Keep the sign with its term: ${rootH(2, p)} · (${iH(c)}) = ${iH(c)}${rootH(2, p)}.` },
        { t: sHtml(sAdd(S(1, p + qq), S(c, p))), mc: MC.rootSum, say: `${rootH(2, p)} · ${rootH(2, qq)} multiplies the radicands: ${rootH(2, p * qq)}.` },
      ]);
      if (opts.length < 4) continue;
      const base: Base = {
        id: `monoSum-${n}`, family: 'monoSum', prompt: `Use the distributive property and simplify ${rootH(2, p)}(${rootH(2, qq)} ${sign(c)} ${Math.abs(c)}).`, board: `\\sqrt{${p}}\\left(\\sqrt{${qq}} ${c < 0 ? '-' : '+'} ${Math.abs(c)}\\right)`,
        solution: [`Distribute: ${rootH(2, p)} · ${rootH(2, qq)} ${sign(c)} ${Math.abs(c)}${rootH(2, p)}.`, `${rootH(2, p * qq)} = ${sHtml(S(1, p * qq))}, so: ${ans(sHtml(right))}.`],
      };
      return choiceItem(R, base, opts);
    }
    const a = int(R, 2, 4), p = pick(R, [2, 3, 5, 7]), b = int(R, 2, 6);
    const right = sAdd(S(a * b, p), S(-a * p));
    const raw = (x: number, y: number) => `${iH(x)}${rootH(2, p)} ${y < 0 ? '−' : '+'} ${Math.abs(y)}`;
    const base: Base = {
      id: `monoSum-${n}`, family: 'monoSum', prompt: `Use the distributive property and simplify ${a}${rootH(2, p)}(${b} − ${rootH(2, p)}).`, board: `${a}\\sqrt{${p}}\\left(${b} - \\sqrt{${p}}\\right)`,
      solution: [`Distribute: ${a}${rootH(2, p)} · ${b} − ${a}${rootH(2, p)} · ${rootH(2, p)}.`, `${rootH(2, p)} · ${rootH(2, p)} = ${p}, so: ${ans(raw(a * b, -a * p))}.`],
    };
    void right;
    return choiceItem(R, base, uniq([
      { t: raw(a * b, -a * p), ok: true, say: `Yes: ${a}${rootH(2, p)} · ${rootH(2, p)} = ${a} · ${p} = ${a * p}.` },
      { t: raw(a * b, a * p), mc: MC.detached, say: 'The minus belongs to its term: the second product is subtracted.' },
      { t: raw(a * b, -a * p * p), mc: MC.rootSelf, say: `${rootH(2, p)} · ${rootH(2, p)} = ${p}, not ${p * p}.` },
      { t: `${iH(a * b)}${rootH(2, p)} − ${rootH(2, p)}`, mc: MC.partialDist, say: `${a}${rootH(2, p)} multiplies BOTH terms, the ${rootH(2, p)} too.` },
    ]));
  }
};

// ===================== radical-binomial-products =====================
export const binProd: Gen = (R, n) => {
  for (;;) {
    const m = pick(R, [2, 3, 5, 6, 7]), sq = R() < 0.35;
    const a = int(R, -4, 5), b = sq ? int(R, 1, 3) : pick(R, [1, 1, 2, -1]), c = sq ? a : int(R, -4, 5), d = sq ? b : pick(R, [1, 1, 2, -1, 3]);
    if (a === 0 || c === 0) continue;
    const P = a * c + b * d * m, Q = a * d + b * c;
    if (Q < 1 || Math.abs(P) > 60) continue;
    const L = sAdd(S(a), S(b, m)), Rr = sAdd(S(c), S(d, m));
    const lh = sHtml(L), rh = sHtml(Rr);
    const base: Base = {
      id: `binProd-${n}`, family: 'binProd', prompt: `Multiply and simplify ${sq ? `(${lh})<sup>2</sup>` : `(${lh})(${rh})`}. Write it as <i>a</i> + <i>b</i>${rootH(2, m)}.`,
      board: `${sq ? `\\left(${sTex(L)}\\right)^2` : `\\left(${sTex(L)}\\right)\\left(${sTex(Rr)}\\right)`} = \\square + \\square\\sqrt{${m}}`,
      solution: [
        `Each term times each term: ${iH(a * c)} ${sign(a * d)} ${Math.abs(a * d)}${rootH(2, m)} ${sign(b * c)} ${Math.abs(b * c)}${rootH(2, m)} ${sign(b * d)} ${Math.abs(b * d)} · ${m}.`,
        `${rootH(2, m)} · ${rootH(2, m)} = ${m}. Numbers: ${iH(a * c)} ${sign(b * d)} ${Math.abs(b * d * m)} = ${iH(P)}; roots: ${iH(a * d)} ${sign(b * c)} ${Math.abs(b * c)} = ${Q}.`,
        `So ${ans(iH(P))} + ${ans(Q)}${rootH(2, m)}.`],
    };
    return pairItem(base, P, Q, '', '+', rootH(2, m), (x, y) => {
      if (x === P && y === Q) return { ok: true, say: `Yes: ${sHtml(sMul(L, Rr))}.` };
      if (y === 0 || (x === a * c + b * d * m && y !== Q)) return { ok: false, mc: sq ? MC.fnSum : MC.firstsLasts, say: sq ? `A square of a sum is not the sum of the squares: the middle terms 2 · ${iH(a)} · ${b}${rootH(2, m)} count too.` : 'There are four products: the outer and inner terms give the radical part.' };
      if (x === a * c + b * d * m * m) return { ok: false, mc: MC.rootSelf, say: `${rootH(2, m)} · ${rootH(2, m)} = ${m}, not ${m * m}.` };
      return { ok: false, say: 'Multiply each term of the first by each term of the second (four products), then combine.' };
    });
  }
};

export const conjProd: Gen = (R, n) => {
  if (R() < 0.6) {
    const a = int(R, 2, 7), b = pick(R, [1, 1, 2, 3]), m = pick(R, [2, 3, 5, 6, 7]);
    const val = a * a - b * b * m;
    const t = `${a} + ${b === 1 ? '' : b}${rootH(2, m)}`, u = `${a} − ${b === 1 ? '' : b}${rootH(2, m)}`;
    const base: Base = {
      id: `conjProd-${n}`, family: 'conjProd', prompt: `Multiply (${t})(${u}).`, board: `\\left(${a} + ${b === 1 ? '' : b}\\sqrt{${m}}\\right)\\left(${a} - ${b === 1 ? '' : b}\\sqrt{${m}}\\right) = \\,?`,
      solution: [`The middle terms cancel: ${a} · ${b === 1 ? '' : b}${rootH(2, m)} − ${a} · ${b === 1 ? '' : b}${rootH(2, m)} = 0.`, `What is left: ${a}<sup>2</sup> − (${b === 1 ? '' : b}${rootH(2, m)})<sup>2</sup> = ${a * a} − ${b * b * m} = ${ans(iH(val))}.`],
    };
    return numItem(base, val, v => {
      if (v === val) return { ok: true, say: `Yes: ${iH(val)}, a rational number. The middle terms cancel.` };
      if (v === a * a - b * b * m * m) return { ok: false, mc: MC.rootSelf, say: `(${rootH(2, m)})<sup>2</sup> = ${m}, not ${m * m}.` };
      if (v === a * a + b * b * m) return { ok: false, say: `The last product is (+${b === 1 ? '' : b}${rootH(2, m)})(−${b === 1 ? '' : b}${rootH(2, m)}): it is subtracted.` };
      if (b > 1 && v === a * a - b * m) return { ok: false, mc: MC.conjDrop, say: `Square the whole term: (${b}${rootH(2, m)})<sup>2</sup> = ${b * b} · ${m} = ${b * b * m}.` };
      return { ok: false, say: `Four products; the two middle ones cancel. ${a}<sup>2</sup> minus (${b === 1 ? '' : b}${rootH(2, m)})<sup>2</sup>.` };
    });
  }
  const [p, qq] = shuffle(R, [2, 3, 5, 6, 7, 10, 11]).slice(0, 2) as [number, number];
  const val = p - qq;
  const base: Base = {
    id: `conjProd-${n}`, family: 'conjProd', prompt: `Multiply (${rootH(2, p)} + ${rootH(2, qq)})(${rootH(2, p)} − ${rootH(2, qq)}).`, board: `\\left(\\sqrt{${p}} + \\sqrt{${qq}}\\right)\\left(\\sqrt{${p}} - \\sqrt{${qq}}\\right) = \\,?`,
    solution: [`The middle terms ${rootH(2, p * qq)} and −${rootH(2, p * qq)} cancel.`, `(${rootH(2, p)})<sup>2</sup> − (${rootH(2, qq)})<sup>2</sup> = ${p} − ${qq} = ${ans(iH(val))}.`],
  };
  return numItem(base, val, v => {
    if (v === val) return { ok: true, say: `Yes: ${iH(val)}.` };
    if (v === p * p - qq * qq) return { ok: false, mc: MC.rootSelf, say: `(${rootH(2, p)})<sup>2</sup> = ${p}, not ${p * p}.` };
    if (v === p + qq) return { ok: false, say: 'The last product is subtracted: + times − is −.' };
    return { ok: false, say: `The middle terms cancel. What is left is (${rootH(2, p)})<sup>2</sup> − (${rootH(2, qq)})<sup>2</sup>.` };
  });
};

// ===================== rationalize-monomial-denominator =====================
/** (c · n-th root of r) / d in HTML, reduced */
function overH(c: number, r: number, d: number, idx = 2): string {
  const g = gcd(c, d), C = c / g, D = d / g;
  const top = r === 1 ? iH(C) : `${C === 1 ? '' : iH(C)}${rootH(idx, r)}`;
  return D === 1 ? top : fr(top, D);
}
export const ratMono: Gen = (R, n) => {
  const kind = pick(R, ['sq', 'sq', 'frac', 'cube'] as const);
  if (kind === 'sq') {
    for (;;) {
      const m = pick(R, [2, 3, 5, 6, 7, 10]), k = pick(R, [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 14, 15]);
      if (k === m) continue;
      const right = overH(k, m, m), g = gcd(k, m);
      const opts = uniq([
        { t: right, ok: true, say: `Yes: ${fr(k, rootH(2, m))} · ${fr(rootH(2, m), rootH(2, m))} = ${fr(`${k === 1 ? '' : k}${rootH(2, m)}`, m)}${g > 1 ? ` = ${right}` : ''}.` },
        { t: overH(k, 1, m), mc: MC.onePart, say: `Multiply the top AND the bottom by ${rootH(2, m)}: the top becomes ${k === 1 ? '' : k}${rootH(2, m)}.` },
        { t: overH(k, m, 1), say: `The bottom became ${rootH(2, m)} · ${rootH(2, m)} = ${m}: divide by it.` },
        { t: overH(k, m, m * m), mc: MC.rootSelf, say: `${rootH(2, m)} · ${rootH(2, m)} = ${m}, not ${m * m}.` },
      ]);
      if (opts.length < 3 || opts.filter(o => o.t === right).length !== 1) continue;
      const base: Base = {
        id: `ratMono-${n}`, family: 'ratMono', prompt: `Rewrite ${fr(k, rootH(2, m))} with a rational denominator, simplified.`, board: `\\frac{${k}}{\\sqrt{${m}}}`,
        solution: [`Multiply by ${fr(rootH(2, m), rootH(2, m))} (a form of 1): the bottom becomes ${rootH(2, m)} · ${rootH(2, m)} = ${m}.`, `${fr(`${k === 1 ? '' : k}${rootH(2, m)}`, m)}${g > 1 ? `, simplified ${ans(right)}` : ` = ${ans(right)}`}.`],
      };
      return choiceItem(R, base, opts);
    }
  }
  if (kind === 'frac') {
    for (;;) {
      const p = pick(R, [1, 2, 3, 5, 7]), qd = pick(R, [2, 3, 5, 6, 7]);
      if (gcd(p, qd) !== 1 || p === qd) continue;
      const { out, rest } = extract(p * qd, 2), right = overH(out, rest, qd);
      const opts = uniq([
        { t: right, ok: true, say: `Yes: ${fr(rootH(2, p), rootH(2, qd))} · ${fr(rootH(2, qd), rootH(2, qd))} = ${fr(rootH(2, p * qd), qd)}.` },
        { t: overH(1, p, qd), say: `${rootH(2, qd)} is not ${qd}. Multiply top and bottom by ${rootH(2, qd)}.` },
        { t: overH(out, rest, qd * qd), mc: MC.rootSelf, say: `${rootH(2, qd)} · ${rootH(2, qd)} = ${qd}, not ${qd * qd}.` },
        { t: overH(1, p, 1), mc: MC.onePart, say: 'Only one part was changed. A form of 1 multiplies the top and the bottom.' },
      ]);
      if (opts.length < 3) continue;
      const base: Base = {
        id: `ratMono-${n}`, family: 'ratMono', prompt: `Rewrite ${rootH(2, fr(p, qd))} with a rational denominator, simplified.`, board: `\\sqrt{\\frac{${p}}{${qd}}}`,
        solution: [`${rootH(2, fr(p, qd))} = ${fr(rootH(2, p), rootH(2, qd))}. Multiply by ${fr(rootH(2, qd), rootH(2, qd))}.`, `${fr(rootH(2, p * qd), qd)} = ${ans(right)}.`],
      };
      return choiceItem(R, base, opts);
    }
  }
  for (;;) {
    const m = pick(R, [2, 3, 5]), c = pick(R, [1, 1, 2, 3, 4, 5, 6]);
    const right = overH(c, m * m, m, 3);
    const opts = uniq([
      { t: right, ok: true, say: `Yes: ${rootH(3, m)} · ${rootH(3, m * m)} = ${rootH(3, m * m * m)} = ${m}.` },
      { t: overH(c, m, m, 3), mc: MC.ignoreIndex, say: `${rootH(3, m)} · ${rootH(3, m)} = ${rootH(3, m * m)}, not ${m}: a cube root needs THREE equal factors. Multiply by ${fr(rootH(3, m * m), rootH(3, m * m))}.` },
      { t: overH(c, 1, m, 3), mc: MC.onePart, say: 'The top must be multiplied too, by the same factor.' },
      { t: overH(c, m * m, m * m, 3), say: `${rootH(3, m)} · ${rootH(3, m * m)} = ${rootH(3, m * m * m)} = ${m}.` },
    ]);
    if (opts.length < 3) continue;
    const base: Base = {
      id: `ratMono-${n}`, family: 'ratMono', prompt: `Rewrite ${fr(c, rootH(3, m))} with a rational denominator, simplified.`, board: `\\frac{${c}}{\\sqrt[3]{${m}}}`,
      solution: [`A cube root needs three equal factors: ${rootH(3, m)} · ${rootH(3, m * m)} = ${rootH(3, m * m * m)} = ${m}.`, `Multiply by ${fr(rootH(3, m * m), rootH(3, m * m))}: ${ans(right)}.`],
    };
    return choiceItem(R, base, opts);
  }
};

export const ratFactor: Gen = (R, n) => {
  if (R() < 0.5) {
    const m = pick(R, [2, 3, 5, 6, 7]), k = int(R, 1, 9);
    const base: Base = {
      id: `ratFactor-${n}`, family: 'ratFactor', prompt: `To rationalize ${fr(k, rootH(2, m))}, multiply it by which form of 1?`, board: `\\frac{${k}}{\\sqrt{${m}}} \\cdot \\frac{?}{?}`,
      solution: [`${rootH(2, m)} · ${rootH(2, m)} = ${m}, a whole number.`, `So multiply by ${ans(fr(rootH(2, m), rootH(2, m)))}.`],
    };
    return choiceItem(R, base, [
      { t: fr(rootH(2, m), rootH(2, m)), ok: true, say: `Yes: the bottom becomes ${m}, and the value does not change.` },
      { t: fr(m, m), say: `${fr(m, m)} keeps the value, but the bottom is still ${m}${rootH(2, m)}: the root stays.` },
      { t: `${rootH(2, m)}, on the bottom only`, mc: MC.onePart, say: 'Multiplying only the bottom changes the value. A form of 1 multiplies top AND bottom.' },
      { t: fr(rootH(3, m), rootH(3, m)), mc: MC.ignoreIndex, say: `${rootH(2, m)} · ${rootH(3, m)} is not a whole number: use the same index.` },
    ]);
  }
  const m = pick(R, [2, 3, 5]), k = int(R, 1, 9);
  const base: Base = {
    id: `ratFactor-${n}`, family: 'ratFactor', prompt: `To rationalize ${fr(k, rootH(3, m))}, multiply it by which form of 1?`, board: `\\frac{${k}}{\\sqrt[3]{${m}}} \\cdot \\frac{?}{?}`,
    solution: [`A cube root clears with three equal factors: ${rootH(3, m)} · ${rootH(3, m * m)} = ${rootH(3, m * m * m)} = ${m}.`, `So multiply by ${ans(fr(rootH(3, m * m), rootH(3, m * m)))}.`],
  };
  return choiceItem(R, base, [
    { t: fr(rootH(3, m * m), rootH(3, m * m)), ok: true, say: `Yes: ${rootH(3, m)} · ${rootH(3, m * m)} = ${rootH(3, m * m * m)} = ${m}.` },
    { t: fr(rootH(3, m), rootH(3, m)), mc: MC.ignoreIndex, say: `${rootH(3, m)} · ${rootH(3, m)} = ${rootH(3, m * m)}: still a cube root. You need a third factor.` },
    { t: fr(rootH(2, m), rootH(2, m)), mc: MC.ignoreIndex, say: 'A square root does not clear a cube root: the indices differ.' },
    { t: `${rootH(3, m * m)}, on the bottom only`, mc: MC.onePart, say: 'Multiplying only the bottom changes the value. Multiply top AND bottom.' },
  ]);
};

// ===================== operate-variable-radicals =====================
export const varLike: Gen = (R, n) => {
  for (;;) {
    const cube = R() < 0.3, X = V(cube ? 'y' : 'x'), xv = cube ? 'y' : 'x', idx = cube ? 3 : 2;
    const m = pick(R, cube ? [2, 3] : [2, 3, 5]), s = int(R, 2, 3), A = int(R, 1, 3), B = int(R, 1, 4), op = cube || R() < 0.5 ? 1 : -1;
    const simp = R() < 0.7;
    const P1 = simp ? A * s : A;
    const coef = P1 + op * B;
    if (coef <= 0) continue;
    const inner = `${m}${X}`;
    const t1 = simp ? `${A === 1 ? '' : A}${rootH(idx, `${ipow(s, idx) * m}${X}<sup>${idx + 1}</sup>`)}` : `${A === 1 ? '' : A}${X}${rootH(idx, inner)}`;
    const t1T = simp ? `${A === 1 ? '' : A}${rootT(idx, `${ipow(s, idx) * m}${xv}^{${idx + 1}}`)}` : `${A === 1 ? '' : A}${xv}${rootT(idx, `${m}${xv}`)}`;
    const t2 = `${B === 1 ? '' : B}${X}${rootH(idx, inner)}`, t2T = `${B === 1 ? '' : B}${xv}${rootT(idx, `${m}${xv}`)}`;
    const res = (c: number) => `${c === 1 ? '' : c}${X}${rootH(idx, inner)}`, cf = (c: number) => (c === 1 ? '' : String(c));
    const CANNOT = 'They cannot be combined';
    const opts = uniq([
      { t: res(coef), ok: true, say: `Yes: both are multiples of ${X}${rootH(idx, inner)}.` },
      { t: CANNOT, mc: simp ? MC.notSimplified : MC.outsideUnlike, say: simp ? `Simplify first: ${t1} = ${res(P1)}. Now both terms are multiples of ${X}${rootH(idx, inner)}.` : `Different numbers in front do not make them unlike: both are multiples of ${X}${rootH(idx, inner)}.` },
      ...(simp ? [{ t: res(A + op * B), say: `${rootH(idx, `${ipow(s, idx) * m}${X}<sup>${idx + 1}</sup>`)} = ${s}${X}${rootH(idx, inner)}: the ${s} comes out too.` }] : []),
      { t: `${cf(coef)}${rootH(idx, inner)}`, mc: MC.dropRem, say: `The ${X} outside the root stays: ${res(coef)}.` },
      { t: `${cf(coef)}${X}${rootH(idx, `${2 * m}${X}`)}`, mc: MC.addRad, say: 'Radicands do not add when terms combine: the common radical stays as it is.' },
    ]).filter(o => o.t !== res(coef) || o.ok).slice(0, 4);
    if (opts.length < 3 || A + op * B <= 0 && simp) continue;
    const base: Base = {
      id: `varLike-${n}`, family: 'varLike', prompt: `${xv === 'x' ? '<i>x</i>' : '<i>y</i>'} ≥ 0. Simplify ${t1} ${op > 0 ? '+' : '−'} ${t2}.`, board: `${t1T} ${op > 0 ? '+' : '-'} ${t2T}`,
      solution: [...(simp ? [`Simplify first: ${t1} = ${A === 1 ? '' : `${A} · `}${s}${X}${rootH(idx, inner)} = ${res(P1)}.`] : []), ...(simp ? [] : [`Both terms are multiples of ${X}${rootH(idx, inner)}: like terms.`]), `Like radicals: ${P1} ${op > 0 ? '+' : '−'} ${B} = ${coef}, so ${ans(res(coef))}.`],
    };
    return choiceItem(R, base, opts);
  }
};

export const varMulDiv: Gen = (R, n) => {
  for (;;) {
    const div = R() < 0.45, X = V('x');
    let p: number, qq: number, a: number, b: number, C: number, E: number;
    if (!div) { p = pick(R, [2, 3, 5, 6]); qq = pick(R, [2, 3, 6, 8, 10, 12]); a = int(R, 1, 3); b = int(R, 1, 4); C = p * qq; E = a + b; }
    else { qq = pick(R, [2, 3, 5]); const w = pick(R, [2, 3, 5, 8, 12, 18]); p = qq * w; b = int(R, 1, 2); a = b + int(R, 2, 5); C = w; E = a - b; }
    const { out, rest } = extract(C, 2), t = Math.floor(E / 2), u = E % 2;
    if (out === 1 && t === 0) continue;
    if (rest === 1 && u === 0) continue;
    const right = vrH(out, t, rest, u);
    const opts = uniq([
      { t: right, ok: true, say: `Yes: ${div ? 'one root of the quotient' : 'one root of the product'}, then the perfect squares come out.` },
      ...(u ? [{ t: vrH(out, t, rest, 0), mc: MC.dropRem, say: `The leftover ${X} stays under the root.` }] : []),
      ...(!div && a * b !== E ? [{ t: vrH(extract(C, 2).out, Math.floor(a * b / 2), rest, (a * b) % 2), mc: MC.prodMult, say: `Multiplying powers of ${X} adds the exponents: ${a} + ${b} = ${E}.` }] : []),
      ...(div && b > 1 && a % b === 0 ? [{ t: vrH(out, Math.floor(a / b / 2), rest, (a / b) % 2), mc: MC.quotDiv, say: `Dividing powers of ${X} subtracts the exponents: ${a} − ${b} = ${E}.` }] : []),
      { t: vrH(out * out, t * 2, rest, u), mc: MC.noRoot, say: 'The perfect squares come out as their roots.' },
      { t: vrH(out, t + u, rest, 0), say: `Only pairs come out: ${X}<sup>${E}</sup> = ${X}<sup>${2 * t}</sup>${u ? ` · ${X}` : ''}.` },
    ]).slice(0, 4);
    if (opts.length < 3 || !opts.some(o => o.ok)) continue;
    const l = `${rootH(2, `${p}${a === 1 ? X : `${X}<sup>${a}</sup>`}`)}`, r2 = `${rootH(2, `${qq}${b === 1 ? X : `${X}<sup>${b}</sup>`}`)}`;
    const lT = rootT(2, `${p}${a === 1 ? 'x' : `x^{${a}}`}`), rT = rootT(2, `${qq}${b === 1 ? 'x' : `x^{${b}}`}`);
    const base: Base = {
      id: `varMulDiv-${n}`, family: 'varMulDiv', prompt: `${div ? '<i>x</i> &gt; 0' : '<i>x</i> ≥ 0'}. Simplify ${div ? `${l} ÷ ${r2}` : `${l} · ${r2}`}.`, board: div ? `\\frac{${lT}}{${rT}}` : `${lT} \\cdot ${rT}`,
      solution: [div ? `One root: ${rootH(2, `${p} ÷ ${qq} · ${X}<sup>${a} − ${b}</sup>`)} = ${rootH(2, `${C}${X}<sup>${E}</sup>`)}.` : `One root: ${rootH(2, `${p} · ${qq} · ${X}<sup>${a} + ${b}</sup>`)} = ${rootH(2, `${C}${X}<sup>${E}</sup>`)}.`,
        `Perfect squares out: ${ans(right)}.`],
    };
    return choiceItem(R, base, opts);
  }
};

// ===================== rationalize-binomial-denominator =====================
/** (P + Q√m) / D in HTML, reduced, D > 0 */
function binOver(P: number, Q: number, m: number, D: number): string {
  if (D < 0) { P = -P; Q = -Q; D = -D; }
  const g = gcd(gcd(P, Q), D) || 1; P /= g; Q /= g; D /= g;
  const top = sHtml(sAdd(S(P), S(Q, m)));
  return D === 1 ? top : fr(top, D);
}
export const ratBin: Gen = (R, n) => {
  for (;;) {
    const a = int(R, 2, 6), b = pick(R, [1, 1, 2]), m = pick(R, [2, 3, 5, 6, 7]), k = int(R, 1, 8), s = R() < 0.5 ? 1 : -1;
    const D = a * a - b * b * m;
    if (D === 0 || Math.abs(D) === 1 && R() < 0.5) continue;
    const den = sAdd(S(a), S(s * b, m));
    const right = binOver(k * a, -s * k * b, m, D);
    const D2 = a * a - b * b * m * m;
    if (D2 === 0) continue;
    const opts = uniq([
      { t: right, ok: true, say: `Yes: the conjugate makes the bottom ${a}<sup>2</sup> − ${b * b * m} = ${D}.` },
      { t: binOver(k * a, -s * k * b, m, D2), mc: MC.rootSelf, say: `(${b === 1 ? '' : b}${rootH(2, m)})<sup>2</sup> = ${b * b * m}, not ${b * b * m * m}.` },
      { t: binOver(k * a, s * k * b, m, D), say: 'The top is multiplied by the CONJUGATE too: its sign flips.' },
      { t: fr(sHtml(sMul(S(k), den)), sHtml(sMul(den, den))), mc: MC.notConj, say: `Multiplying by the denominator itself leaves a root on the bottom. Use the conjugate: ${sHtml(sAdd(S(a), S(-s * b, m)))}.` },
    ]);
    if (opts.length < 4) continue;
    const base: Base = {
      id: `ratBin-${n}`, family: 'ratBin', prompt: `Rationalize the denominator and simplify ${fr(k, sHtml(den))}.`, board: `\\frac{${k}}{${sTex(den)}}`,
      solution: [`Multiply top and bottom by the conjugate ${sHtml(sAdd(S(a), S(-s * b, m)))}.`, `Bottom: ${a}<sup>2</sup> − (${b === 1 ? '' : b}${rootH(2, m)})<sup>2</sup> = ${a * a} − ${b * b * m} = ${iH(D)}. Top: ${k}(${sHtml(sAdd(S(a), S(-s * b, m)))}).`, `Simplified: ${ans(right)}.`],
    };
    return choiceItem(R, base, opts);
  }
};

export const conjPick: Gen = (R, n) => {
  const a = int(R, 1, 6), b = pick(R, [1, 1, 2, 3]), m = pick(R, [2, 3, 5, 6, 7, 10]), k = int(R, 1, 9), s = R() < 0.5 ? 1 : -1;
  const den = sAdd(S(a), S(s * b, m)), conj = sAdd(S(a), S(-s * b, m));
  const base: Base = {
    id: `conjPick-${n}`, family: 'conjPick', prompt: `To rationalize ${fr(k, sHtml(den))}, multiply by which form of 1?`, board: `\\frac{${k}}{${sTex(den)}} \\cdot \\frac{?}{?}`,
    solution: [`The conjugate flips the sign between the terms: (${sHtml(den)})(${sHtml(conj)}) = ${a * a} − ${b * b * m}, no root left.`, `So multiply by ${ans(fr(sHtml(conj), sHtml(conj)))}.`],
  };
  return choiceItem(R, base, [
    { t: fr(sHtml(conj), sHtml(conj)), ok: true, say: `Yes: a difference of squares, ${a * a} − ${b * b * m} = ${a * a - b * b * m}, with no root.` },
    { t: fr(sHtml(den), sHtml(den)), mc: MC.notConj, say: `(${sHtml(den)})<sup>2</sup> still has a middle term with ${rootH(2, m)}. The conjugate cancels it.` },
    { t: fr(rootH(2, m), rootH(2, m)), say: `${rootH(2, m)} times the bottom gives ${sHtml(sMul(den, S(1, m)))}: still a root.` },
    { t: `${sHtml(conj)}, on the bottom only`, mc: MC.onePart, say: 'Multiplying only the bottom changes the value. Multiply top AND bottom.' },
  ]);
};

// ===================== choose-form-and-calculator =====================
const CALC = [
  { b: '10', m: 1, k: 2, ctx: '' }, { b: '2', m: 1, k: 12, ctx: 'On a piano, each half step multiplies the frequency by ' }, { b: '1.15', m: 1, k: 12, ctx: 'A price grows by a factor 1.15 per year. The monthly growth factor is ' },
  { b: '5', m: 2, k: 3, ctx: '' }, { b: '7', m: 1, k: 3, ctx: '' }, { b: '1.08', m: 1, k: 4, ctx: 'An investment grows by a factor 1.08 per year. The quarterly growth factor is ' }, { b: '3', m: 3, k: 4, ctx: '' },
];
export const calcKeys: Gen = (R, n) => {
  let c = pick(R, CALC);
  if (R() < 0.6) for (;;) { const m = int(R, 1, 4), k = int(R, 2, 7); if (m === k || gcd(m, k) !== 1) continue; c = { b: String(pick(R, [2, 3, 5, 6, 7, 10, 12, 20])), m, k, ctx: '' }; break; }
  const e = `${c.m}/${c.k}`;
  const base: Base = {
    id: `calcKeys-${n}`, family: 'calcKeys', prompt: `${c.ctx ? `${c.ctx}${c.b}<sup>${e}</sup>. ` : ''}Which keystrokes compute ${c.b}<sup>${e}</sup> on a calculator (TI-84 or Desmos)? (calculator)`,
    board: `${c.b}^{\\frac{${c.m}}{${c.k}}}`,
    solution: [`The whole exponent ${e} must be grouped: without parentheses the calculator does ${c.b}<sup>${c.m}</sup> first, then divides by ${c.k}.`, `So: ${ans(`${c.b} ^ ( ${c.m} ÷ ${c.k} )`)}.`],
  };
  return choiceItem(R, base, [
    { t: `${c.b} ^ ( ${c.m} ÷ ${c.k} )`, ok: true, say: `Yes: the parentheses keep ${e} together as the exponent.` },
    { t: `${c.b} ^ ${c.m} ÷ ${c.k}`, mc: MC.calcParen, say: `Without parentheses that is (${c.b}<sup>${c.m}</sup>) ÷ ${c.k}. Group the exponent.` },
    { t: `${c.b} × ${c.m} ÷ ${c.k}`, mc: MC.baseTimesExp, say: 'An exponent is not a factor: that multiplies the base by the fraction.' },
    { t: `${c.b} ^ ( ${c.k} ÷ ${c.m} )`, mc: MC.swapped, say: `Swapped: the exponent is ${e}, so ${c.m} ÷ ${c.k}.` },
  ]);
};

export const estimate: Gen = (R, n) => {
  if (R() < 0.55) {
    for (;;) {
      const idx = pick(R, [2, 3, 3]), a = idx === 2 ? int(R, 11, 150) : int(R, 10, 200);
      const lo = Math.floor(Math.pow(a, 1 / idx) + 1e-9);
      if (ipow(lo, idx) === a || ipow(lo + 1, idx) === a) continue;
      const iv = (x: number) => `between ${x} and ${x + 1}`;
      const sqLo = Math.floor(Math.sqrt(a)), dvLo = Math.floor(a / idx);
      const opts = uniq([
        { t: iv(lo), ok: true, say: `Yes: ${lo}<sup>${idx}</sup> = ${ipow(lo, idx)} &lt; ${a} &lt; ${ipow(lo + 1, idx)} = ${lo + 1}<sup>${idx}</sup>.` },
        { t: iv(lo + 1), mc: 'mc.exponents-roots.wrong-neighboring-squares', say: `${lo + 1}<sup>${idx}</sup> = ${ipow(lo + 1, idx)} is already more than ${a}.` },
        ...(idx === 3 ? [{ t: iv(sqLo), mc: MC.ignoreIndex, say: `Those are square-root bounds. Use cubes: ${lo}<sup>3</sup> = ${ipow(lo, 3)} and ${lo + 1}<sup>3</sup> = ${ipow(lo + 1, 3)}.` }] : []),
        { t: iv(dvLo), mc: MC.divIndex, say: `A root is not a division: ${a} ÷ ${idx} is not ${rootH(idx, a)}. Compare with perfect ${PW[idx]}s.` },
        { t: iv(Math.max(1, lo - 1)), say: `${lo}<sup>${idx}</sup> = ${ipow(lo, idx)} is still less than ${a}.` },
      ]).slice(0, 4);
      if (opts.length < 3) continue;
      const base: Base = {
        id: `estimate-${n}`, family: 'estimate', prompt: `Without a calculator: between which two whole numbers is ${rootH(idx, a)}?`, board: `${rootT(idx, a)}`,
        solution: [`Perfect ${PW[idx]}s around ${a}: ${lo}<sup>${idx}</sup> = ${ipow(lo, idx)} and ${lo + 1}<sup>${idx}</sup> = ${ipow(lo + 1, idx)}.`, `So ${rootH(idx, a)} is ${ans(iv(lo))}.`],
      };
      return choiceItem(R, base, opts);
    }
  }
  for (;;) {
    const c = pick(R, CALC.filter(x => x.m === 1));
    const b = Number(c.b), v = Math.pow(b, 1 / c.k);
    const f = (x: number) => (Math.round(x * 10000) / 10000).toFixed(4).replace(/\.?0+$/, '');
    const opts = uniq([
      { t: `about ${f(v)}`, ok: true, say: `Yes: ${f(v)}<sup>${c.k}</sup> ≈ ${c.b}, and a root of a number above 1 lies between 1 and the number.` },
      { t: `about ${f(b / c.k)}`, mc: MC.baseTimesExp, say: `${c.b} ÷ ${c.k} is not a root. Check: raised to the power ${c.k}, the result must give back ${c.b}.` },
      { t: `about ${f(Math.pow(b, c.k))}`, mc: MC.swapped, say: `That is ${c.b}<sup>${c.k}</sup>, the power, not the root.` },
      { t: `about ${f(1 / v)}`, mc: MC.negMakesNeg, say: `That is less than 1, the reciprocal. ${c.b} &gt; 1, so its root is more than 1.` },
    ]);
    if (opts.length < 3 || b / c.k < 0.0001) continue;
    const base: Base = {
      id: `estimate-${n}`, family: 'estimate', prompt: `${c.ctx ? `${c.ctx}${c.b}<sup>1/${c.k}</sup>.` : `A student uses a calculator to find ${c.b}<sup>1/${c.k}</sup>.`} Which calculator result for ${c.b}<sup>1/${c.k}</sup> passes a sanity check? (calculator)`,
      board: `${c.b}^{\\frac{1}{${c.k}}} \\approx \\,?`,
      solution: [`${c.b} &gt; 1, so ${c.b}<sup>1/${c.k}</sup> is between 1 and ${c.b}, and raised to the power ${c.k} it must give back ${c.b}.`, `Only one value does: ${ans(`about ${f(v)}`)}.`],
    };
    return choiceItem(R, base, opts);
  }
};

export const combineForm: Gen = (R, n) => {
  for (;;) {
    const a = int(R, 2, 6), b = int(R, 2, 6);
    if (a === b) continue;
    const vl = pick(R, ['x', 'y', 't']), [P, Q] = red(a + b, a * b), X = V(vl);
    const xr = (e: number) => (e === 1 ? X : `${X}<sup>${e}</sup>`);
    const [ap, aq] = red(2, a + b);
    const opts = uniq([
      { t: rootH(Q, xr(P)), ok: true, say: `Yes: 1/${a} + 1/${b} = ${P}/${Q}, and ${X}<sup>${P}/${Q}</sup> = ${rootH(Q, xr(P))}.` },
      { t: rootH(P, xr(Q)), mc: MC.swapped, say: `Swapped: the denominator ${Q} is the index.` },
      { t: rootH(a * b, X), mc: MC.prodMult, say: `Multiplying same-base powers adds the exponents: 1/${a} + 1/${b}, not 1/${a} · 1/${b}.` },
      { t: rootH(aq, xr(ap)), mc: MC.addDen, say: `1/${a} + 1/${b} needs a common denominator: ${P}/${Q}, not 2/${a + b}.` },
    ]);
    if (opts.length < 4) continue;
    const base: Base = {
      id: `combineForm-${n}`, family: 'combineForm', prompt: `${X} &gt; 0. Write ${rootH(a, X)} · ${rootH(b, X)} as ONE radical. (no calculator)`, board: `${rootT(a, vl)} \\cdot ${rootT(b, vl)}`,
      solution: [`Switch to exponents: ${X}<sup>1/${a}</sup> · ${X}<sup>1/${b}</sup> = ${X}<sup>1/${a} + 1/${b}</sup> = ${X}<sup>${P}/${Q}</sup>.`, `Back to a radical: ${ans(rootH(Q, xr(P)))}.`],
    };
    return choiceItem(R, base, opts);
  }
};

export { sPart, type Surd };
