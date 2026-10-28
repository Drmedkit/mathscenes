// fam2.ts: families for sub-goals 12-22 of "Quadratic functions and their graphs": zeros by square roots, factored
// form (zeros and vertex), the y-intercept, the axis from standard form, technology windows, complete sketches,
// domain and range, rising and falling, intervals of increase and of sign. Pure: no DOM.
import { type GItem, type Gen, type Opt, MC, X, Y, ans, choiceItem, int, isSet, near, numItem, nz, pairItem, pick, pointItem } from './common';
import { type Fac, type Std, binH, cl, coefH, facH, facStd, facT, fromV, fromZ, fz, nH, nT, pH, stdH, stdT, val, vertexOf, vfH, vfT, win, zerosOf } from './qf';
import { crv, curveWin, features, pt, ptName } from './fam1';

const sgn = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const rad = (q: number) => `√<u class="rb">${q}</u>`;
const pickA = (R: () => number) => pick(R, [1, 1, -1, 2, -2, 0.5, -0.5]);
const slatePic = (s: Std, extra: GItem[] = [], xs: number[] = [], ys: number[] = []) => ({ ...curveWin(s, xs, ys), show: [] as GItem[], reveal: [crv(s), ...extra], slate: true });

// =============== 12. zeros by square roots ===============
export const sqrtZeros: Gen = (R, n) => {
  const a = pick(R, [1, 1, 2, -1, -2, 3]), h = nz(R, -5, 5), r = pick(R, [1, 2, 3, 4, 5]), q = r * r, k = -a * q;
  const s = fromV(a, h, k), z1 = h - r, z2 = h + r;
  return pairItem({
    id: `sqrtZeros-${n}`, family: 'sqrtZeros', prompt: `Find the zeros of <i>f</i>(${X}) = ${vfH(a, h, k)}. (Either order.)`,
    board: `${vfT(a, h, k)} = 0`,
    picture: { g: slatePic(s, [pt('z0', z1, 0, 'second', nH(z1)), pt('z1', z2, 0, 'second', nH(z2)), pt('V', h, k, 'first')], [], [0]) },
    solution: [
      `Set it to 0 and isolate the square: ${a === 1 ? '' : `${coefH(a)}(${binH(h)})² = ${nH(-k)}, so `}(${binH(h)})² = ${q}.`,
      `Two numbers square to ${q}: ${binH(h)} = ${r} or ${binH(h)} = −${r}.`,
      `So ${X} = ${ans(nH(z2))} or ${X} = ${ans(nH(z1))}.`,
    ],
  }, z2, z1, `${X} =`, ` or ${X} =`, '', (u, w) => {
    if (isSet(u, w, z1, z2)) return { ok: true, say: `Yes: ${nH(z1)} and ${nH(z2)}, ${r} either side of ${nH(h)}.` };
    if (isSet(u, w, -r, r)) return { ok: false, mc: MC.forgetsH, say: `±${r} are the values of ${binH(h)}. Now solve for ${X}: ${binH(h)} = ${r} gives ${X} = ${nH(z2)}.` };
    if (isSet(u, w, -h - r, -h + r)) return { ok: false, mc: MC.wrongSign, say: `${binH(h)} = ${r} means ${X} = ${nH(h)} + ${r}: undo the ${h > 0 ? 'minus' : 'plus'}.` };
    if (near(u, w) && (near(u, z1) || near(u, z2))) return { ok: false, mc: MC.onlyPos, say: `${q} has two square roots, ${r} and −${r}. Each gives a zero.` };
    return { ok: false, say: `Get (${binH(h)})² alone, take both square roots, then solve each.` };
  });
};

export const sqrtExact: Gen = (R, n) => {
  const kind = pick(R, ['irr', 'irr', 'zero', 'neg']), a = pick(R, [1, 1, -1, 2]), h = nz(R, -4, 4);
  const q = kind === 'irr' ? pick(R, [2, 3, 5, 6, 7]) : kind === 'zero' ? 0 : -pick(R, [1, 4, 2, 9, 3]), k = cl(-a * q), s = fromV(a, h, k);
  const qa = Math.abs(q);
  const opts: Opt[] = [
    { t: `${X} = ${nH(h)} ± ${rad(qa)}`, ok: kind === 'irr', key: `pm:${h}:${qa}`, mc: kind === 'neg' ? MC.nonRealPts : undefined, say: kind === 'irr' ? `Yes: ${binH(h)} = ±${rad(q)}, so ${X} = ${nH(h)} ± ${rad(q)}, about ${nH(cl(Math.round((h - Math.sqrt(q)) * 100) / 100))} and ${nH(cl(Math.round((h + Math.sqrt(q)) * 100) / 100))}.` : `(${binH(h)})² = ${nH(q)}: no real number squares to a negative, so there is nothing to take the root of.` },
    { t: `${X} = ±${rad(qa)}`, key: `pm:0:${qa}`, mc: MC.forgetsH, say: `±${rad(qa)} are values of ${binH(h)}, not of ${X}. Add ${nH(h)}.` },
    { t: `${X} = ${nH(h)} + ${rad(qa)} only`, key: `one:${h}+${qa}`, mc: MC.onlyPos, say: `A positive number has two square roots: ${binH(h)} can also be −${rad(qa)}.` },
    { t: `${X} = ${nH(-h)} ± ${rad(qa)}`, key: `pm:${-h}:${qa}`, mc: MC.wrongSign, say: `${binH(h)} = ±${rad(qa)} means ${X} = ${nH(h)} ± ${rad(qa)}.` },
    { t: `${X} = ${nH(h)} only`, ok: kind === 'zero', key: `one:${h}`, say: kind === 'zero' ? `Yes: (${binH(h)})² = 0 only when ${binH(h)} = 0. One repeated zero: the vertex sits on the x-axis.` : `That would need the square to equal 0. Here it equals ${nH(q)}.` },
    { t: `${X} = ${nH(-h)} only`, key: `one:${-h}`, mc: MC.wrongSign, say: `${binH(h)} = 0 at ${X} = ${nH(h)}.` },
    { t: 'no real zeros', ok: kind === 'neg', key: 'none', say: kind === 'neg' ? `Yes: (${binH(h)})² = ${nH(q)} has no real solution. The vertex is ${a > 0 ? 'above' : 'below'} the x-axis and it opens away from it.` : `(${binH(h)})² = ${nH(q)}${q === 0 ? ' has one solution' : ' is positive: it has two square roots'}.` },
  ];
  const keep = kind === 'irr' ? [0, 1, 2, 3] : kind === 'zero' ? [4, 5, 6] : [6, 0, 4, 3];
  const zs = zerosOf(s);
  return choiceItem(R, {
    id: `sqrtExact-${n}`, family: 'sqrtExact', prompt: `Solve ${vfH(a, h, k)} = 0 to find the zeros of <i>f</i>. Exact answers.`,
    board: `${vfT(a, h, k)} = 0`,
    picture: { g: slatePic(s, zs.map((z, i) => pt(`z${i}`, z, 0, 'second', Number.isInteger(z) ? nH(z) : `≈ ${nH(Math.round(z * 100) / 100)}`)), [], [0]) },
    solution: [
      `Isolate the square: (${binH(h)})² = ${nH(q)}.`,
      kind === 'irr' ? `Both roots: ${binH(h)} = ${rad(q)} or ${binH(h)} = −${rad(q)}.` : kind === 'zero' ? `Only 0 squares to 0: ${binH(h)} = 0.` : `No real number squares to a negative number.`,
    ],
  }, keep.map(i => opts[i]!));
};

// =============== 13. factored form: zeros ===============
export const facZeros: Gen = (R, n) => {
  const kind = pick(R, ['opp', 'same', 'x', 'non', 'non']);
  let F: Fac;
  const A = pick(R, [1, 1, 2, -1, 3, -2]);
  if (kind === 'opp') F = fz(A, -int(R, 1, 7), int(R, 1, 7));
  else if (kind === 'same') { const sg = pick(R, [1, -1]), p = sg * int(R, 1, 4); F = fz(A, p, p + sg * int(R, 1, 5)); }
  else if (kind === 'x') F = fz(A, 0, nz(R, -7, 7));
  else { const nn = pick(R, [1, 3, 5, 7, -1, -3, -5]); F = { A: pick(R, [1, 1, -1, 2]), f: [{ m: 2, r: nn / 2 }, { m: 1, r: nz(R, -6, 6) }] }; }
  const [u, w] = F.f, p = u.r, q = w.r, s = facStd(F);
  const bad = (x: number, y: number) => isSet(x, y, p, q);
  return pairItem({
    id: `facZeros-${n}`, family: 'facZeros', prompt: `What are the zeros of <i>f</i>(${X}) = ${facH(F)}? (Either order.)`, board: `f(x) = ${facT(F)}`,
    picture: { g: slatePic(s, [pt('z0', p, 0, 'second', nH(p)), pt('z1', q, 0, 'second', nH(q))], [p, q], [0]) },
    solution: [
      `A product is 0 exactly when one factor is 0${Math.abs(F.A) !== 1 ? ` (the ${nH(F.A)} in front never is)` : ''}.`,
      `${u.m === 1 ? binH(p) : `2${X} ${p > 0 ? '−' : '+'} ${nH(Math.abs(2 * p))}`} = 0 at ${X} = ${ans(nH(p))}; ${binH(q)} = 0 at ${X} = ${ans(nH(q))}.`,
    ],
  }, p, q, `${X} =`, ` or ${X} =`, '', (x, y) => {
    if (bad(x, y)) return { ok: true, say: `Yes: ${nH(p)} and ${nH(q)}. Each makes one factor zero.` };
    if (isSet(x, y, -p, -q)) return { ok: false, mc: MC.wrongSign, say: `${binH(q)} is 0 when ${X} = ${nH(q)}: the sign flips.` };
    if (u.m !== 1 && isSet(x, y, cl(2 * p), q)) return { ok: false, mc: MC.bxc, say: `2${X} ${p > 0 ? '−' : '+'} ${nH(Math.abs(2 * p))} = 0 means 2${X} = ${nH(2 * p)}, so ${X} = ${nH(p)}: divide by the 2.` };
    if (Math.abs(F.A) !== 1 && isSet(x, y, cl(F.A * p), cl(F.A * q))) return { ok: false, mc: MC.outside, say: `The ${nH(F.A)} in front stretches the graph; it does not move the zeros.` };
    return { ok: false, say: `Set each factor equal to 0 and solve.` };
  });
};

export const facRepeat: Gen = (R, n) => {
  const rep = R() < 0.5, A = pick(R, [1, 2, -1, 3, -2, -3]);
  const setT = (zs: number[]) => (zs.length === 1 ? `${X} = ${nH(zs[0]!)} only` : `${X} = ${nH(zs[0]!)} and ${X} = ${nH(zs[1]!)}`);
  const key = (zs: number[]) => [...zs].map(cl).sort((a, b) => a - b).join(',');
  let F: Fac, opts: Opt[], sol: string[];
  if (rep) {
    const p = nz(R, -5, 5);
    F = { A, f: [{ m: 1, r: p }, { m: 1, r: p }] };
    const o = (zs: number[], ok: boolean, say: string, mc?: string): Opt => ({ t: setT(zs), ok, mc, say, key: key(zs) });
    opts = [
      o([p], true, `Yes: (${binH(p)})² is 0 only when ${binH(p)} = 0. One repeated zero; the vertex touches the x-axis there.`),
      o([-p, p].sort((a, b) => a - b), false, `Squaring does not make a second zero: (${binH(p)})² = 0 only at ${X} = ${nH(p)}.`),
      o([-p], false, `${binH(p)} = 0 at ${X} = ${nH(p)}: the sign flips.`, MC.wrongSign),
      ...(Math.abs(A) !== 1 ? [o([cl(A * p)], false, `The ${nH(A)} in front stretches the graph; it does not move the zero.`, MC.outside)] : []),
      { t: 'no real zeros', key: 'none', say: `Put ${X} = ${nH(p)} in: you get 0. That is a zero.` },
    ];
    sol = [`A product is 0 when a factor is 0. Both factors are ${binH(p)}.`, `${binH(p)} = 0 only at ${X} = ${nH(p)}: one repeated zero.`];
  } else {
    const q = nz(R, -6, 6);
    F = fz(A, 0, q);
    const o = (zs: number[], ok: boolean, say: string, mc?: string): Opt => ({ t: setT(zs), ok, mc, say, key: key(zs) });
    opts = [
      o([0, q].sort((a, b) => a - b), true, `Yes: the factor ${X} is 0 at ${X} = 0, and ${binH(q)} is 0 at ${X} = ${nH(q)}.`),
      o([q], false, `${X} is a factor too: at ${X} = 0 the product is 0.`),
      o([0, -q].sort((a, b) => a - b), false, `${binH(q)} = 0 at ${X} = ${nH(q)}: the sign flips.`, MC.wrongSign),
      ...(Math.abs(A) !== 1 ? [o([0, cl(A * q)].sort((a, b) => a - b), false, `The ${nH(A)} in front does not change where a factor is 0.`, MC.outside)] : []),
    ];
    sol = [`A product is 0 when a factor is 0: ${X} = 0, or ${binH(q)} = 0.`, `So ${X} = 0 or ${X} = ${nH(q)}.`];
  }
  const s = facStd(F);
  return choiceItem(R, {
    id: `facRepeat-${n}`, family: 'facRepeat', prompt: `What are the zeros of <i>f</i>(${X}) = ${facH(F)}?`, board: `f(x) = ${facT(F)}`,
    picture: { g: slatePic(s, zerosOf(s).map((z, i) => pt(`z${i}`, z, 0, 'second', nH(z))), [], [0]) }, solution: sol,
  }, opts);
};

// =============== 14. factored form: vertex ===============
export const facVertex: Gen = (R, n) => {
  const a = pick(R, [1, -1, 2, -2, 0.5, -0.5]), repeat = R() < 0.15;
  let p = nz(R, -6, 4), q = repeat ? p : p + int(R, 1, 8);
  if (!repeat && Math.abs(a) === 2 && q - p > 6) q = p + 6;
  const F = fz(a, p, q), s = facStd(F), m = cl((p + q) / 2), k = val(s, m);
  return pointItem({
    id: `facVertex-${n}`, family: 'facVertex', prompt: `Find the vertex of <i>f</i>(${X}) = ${facH(F)}.`, board: `f(x) = ${facT(F)}`,
    picture: { g: { ...curveWin(s, [p, q], [0], 1), show: repeat ? [pt('z0', p, 0, 'second', nH(p))] : [pt('z0', p, 0, 'second', nH(p)), pt('z1', q, 0, 'second', nH(q))], reveal: [crv(s), { kind: 'vline', key: 'axis', x: m, col: 'pick' }, pt('V', m, k, 'link', ptName(m, k))] } },
    solution: repeat
      ? [`f(${X}) = ${facH(F)} has one repeated zero, ${nH(p)}: the vertex touches the x-axis there.`, `The vertex is (${ans(nH(p))}, ${ans('0')}).`]
      : [`The zeros are ${nH(p)} and ${nH(q)}; the axis is halfway: ${X} = (${nH(p)} + ${pH(q)}) ÷ 2 = ${nH(m)}.`, `The vertex height is f(${nH(m)}) = ${coefH(a) || '1 · '}(${nH(cl(m - p))})(${nH(cl(m - q))}) = ${nH(k)}.`, `The vertex is (${ans(nH(m))}, ${ans(nH(k))}).`],
  }, m, k, (x, y) => {
    if (near(x, m) && near(y, k)) return { ok: true, say: `Yes: (${nH(m)}, ${nH(k)}).` };
    if (near(x, m) && (near(y, 0) || near(y, a))) return { ok: false, mc: MC.facHeight, say: `The ${X} is right. The height is not ${near(y, 0) ? '0' : 'a'}: put ${X} = ${nH(m)} into f.` };
    if (near(x, -m) && !near(m, 0)) return { ok: false, mc: MC.wrongSign, say: `The zeros are ${nH(p)} and ${nH(q)} (the factors flip the sign). Halfway between them is ${nH(m)}.` };
    if (near(x, m)) return { ok: false, say: `The ${X} is right. Work out f(${nH(m)}) carefully.` };
    return { ok: false, say: `The axis is halfway between the zeros. Then put that ${X} into f.` };
  });
};

// =============== 15. the y-intercept ===============
export const yInt: Gen = (R, n) => {
  const form = pick(R, ['std', 'vtx', 'vtx', 'fac', 'fac']);
  let s: Std, eqH: string, eqT: string, show: GItem[] = [], sol: string[];
  let hint: { v: number; mc: string; say: string }[] = [];
  if (form === 'std') {
    const a = pickA(R), b = pick(R, [0, nz(R, -6, 6), nz(R, -6, 6)]), c = pick(R, [0, nz(R, -9, 9), nz(R, -9, 9)]);
    s = [a, b, c]; eqH = stdH(s); eqT = stdT(s);
    sol = [`The y-intercept is the output at ${X} = 0: every ${X} term is 0 there.`, `f(0) = ${ans(nH(c))}.`];
  } else if (form === 'vtx') {
    const a = pickA(R), h = nz(R, -4, 4), k = nz(R, -6, 6);
    s = fromV(a, h, k); eqH = vfH(a, h, k); eqT = vfT(a, h, k);
    show = [pt('V', h, k, 'first', 'vertex')];
    hint = [{ v: k, mc: MC.kAsInt, say: `${nH(k)} is the vertex height. At ${X} = 0 the square is (0 ${h > 0 ? '−' : '+'} ${Math.abs(h)})² = ${h * h}, not 0.` }];
    sol = [`Put ${X} = 0 in: f(0) = ${nH(a)} · (0 ${h > 0 ? '−' : '+'} ${Math.abs(h)})² ${k > 0 ? '+' : '−'} ${Math.abs(k)} = ${nH(a)} · ${h * h} ${k > 0 ? '+' : '−'} ${Math.abs(k)}.`, `= ${nH(cl(a * h * h))} ${k > 0 ? '+' : '−'} ${Math.abs(k)} = ${ans(nH(val(s, 0)))}.`];
  } else {
    const A = pickA(R), origin = R() < 0.15;
    const p = origin ? 0 : nz(R, -5, 5), q = origin ? 0 : nz(R, -5, 5);
    const F = fz(A, p, q); s = facStd(F); eqH = facH(F); eqT = facT(F);
    show = origin ? [pt('z0', 0, 0, 'second')] : [pt('z0', p, 0, 'second', nH(p)), ...(p !== q ? [pt('z1', q, 0, 'second', nH(q))] : [])];
    hint = [p, q].filter(z => !near(z, val(s, 0))).map(z => ({ v: z, mc: MC.interceptSwap, say: `${nH(z)} is a zero, on the x-axis. The y-intercept is the output at ${X} = 0.` }));
    if (!near(p * q, val(s, 0))) hint.push({ v: p * q, mc: '', say: `Keep the ${nH(A)} in front: f(0) = ${nH(A)} · (${nH(-p)})(${nH(-q)}).` });
    sol = [`Put ${X} = 0 in: f(0) = ${nH(A)} · (0 ${p > 0 ? '−' : '+'} ${Math.abs(p)})(0 ${q > 0 ? '−' : '+'} ${Math.abs(q)}).`, `= ${nH(A)} · ${pH(-p)} · ${pH(-q)} = ${ans(nH(val(s, 0)))}.`];
  }
  const c0 = val(s, 0);
  return numItem({
    id: `yInt-${n}`, family: 'yInt', prompt: `What is the ${Y}-intercept of <i>f</i>(${X}) = ${eqH}? (Give the ${Y}-value.)`, board: `f(x) = ${eqT}`,
    picture: { g: show.length ? { ...curveWin(s, [0], [c0]), show, reveal: [crv(s), pt('yi', 0, c0, 'link', ptName(0, c0))] } : slatePic(s, [pt('yi', 0, c0, 'link', ptName(0, c0))], [0], [c0]) },
    solution: sol,
  }, c0, v => {
    if (near(v, c0)) return { ok: true, say: `Yes: f(0) = ${nH(c0)}, so the graph crosses the ${Y}-axis at (0, ${nH(c0)}).` };
    const h = hint.find(x => near(x.v, v));
    if (h) return { ok: false, mc: h.mc || undefined, say: h.say };
    return { ok: false, say: `Put ${X} = 0 into the function and work it out.` };
  });
};

export const cMeaning: Gen = (R, n) => {
  for (;;) {
    const a = pickA(R), b = nz(R, -6, 6), c = nz(R, -8, 8), s: Std = [a, b, c], [h, k] = vertexOf(s);
    if (Math.abs(k) > 14 || Math.abs(h) > 6) continue;
    const opts: Opt[] = [
      { t: `the ${Y}-intercept: the graph passes through (0, ${nH(c)})`, ok: true, key: 'yi', say: `Yes: at ${X} = 0 the ${X}² and ${X} terms are 0, so f(0) = ${nH(c)}.` },
      { t: `the vertex height: the ${a > 0 ? 'minimum' : 'maximum'} value of f is ${nH(c)}`, key: 'k', mc: MC.cAsK, say: `The vertex is not on the ${Y}-axis here (b ≠ 0): its height is f(${nH(h)}) = ${nH(k)}.` },
    ];
    if (!near(val(s, c), 0)) opts.push({ t: `a zero: the graph crosses the ${X}-axis at (${nH(c)}, 0)`, key: 'z', mc: MC.interceptSwap, say: `f(${nH(c)}) is not 0. ${nH(c)} is an output, at ${X} = 0.` });
    if (!near(h, c)) opts.push({ t: `the axis of symmetry: ${X} = ${nH(c)}`, key: 'ax', say: `The axis is ${X} = ${nH(h)}, through the vertex.` });
    return choiceItem(R, {
      id: `cMeaning-${n}`, family: 'cMeaning', prompt: `<i>f</i>(${X}) = ${stdH(s)}. What does the ${nH(c)} at the end tell you about the graph?`, board: `f(x) = ${stdT(s)}`,
      picture: { g: { ...curveWin(s, [0], [c]), show: [crv(s)], reveal: [pt('yi', 0, c, 'link', ptName(0, c)), pt('V', h, k, 'first')] } },
      solution: [`f(0) = ${nH(a)} · 0² ${b > 0 ? '+' : '−'} ${Math.abs(b)} · 0 ${c > 0 ? '+' : '−'} ${Math.abs(c)} = ${nH(c)}.`, `So (0, ${nH(c)}) is on the graph: c is the ${Y}-intercept. (The vertex, (${nH(h)}, ${nH(k)}), is somewhere else.)`],
    }, opts);
  }
};

// =============== 16. standard form: the axis ===============
export const stdAxis: Gen = (R, n) => {
  const a = pick(R, [1, -1, 2, -2, 3, -3, 1, -1]);
  let h: number;
  if (R() < 0.15) h = 0;
  else if (Math.abs(a) === 2) h = nz(R, -12, 12) / 4;
  else h = nz(R, -10, 10) / 2;
  const c = nz(R, -8, 8), b = cl(-2 * a * h), s: Std = [a, b, c], k = val(s, h);
  const yr = [c, k, val(s, h + 2)];
  return numItem({
    id: `stdAxis-${n}`, family: 'stdAxis', prompt: `Find the axis of symmetry of <i>f</i>(${X}) = ${stdH(s)}. ${X} = ?`, board: `f(x) = ${stdT(s)}`,
    picture: { g: { ...curveWin(s, [0, 2 * h], yr), show: [pt('C', 0, c, 'first', ptName(0, c))], reveal: [crv(s), { kind: 'vline', key: 'axis', x: h, col: 'pick' }, ...(near(h, 0) ? [] : [pt('M', cl(2 * h), c, 'link')])] } },
    solution: near(h, 0)
      ? [`There is no ${X} term (b = 0): f(−d) = f(d) for every d, so the graph is symmetric about the ${Y}-axis.`, `${X} = −b/(2a) = 0/${2 * a} = ${ans('0')} agrees.`]
      : [`f(${X}) = ${nH(c)} at ${X} = 0 and where ${X}(${coefH(a) || ''}${X} ${b > 0 ? '+' : '−'} ${nH(Math.abs(b))}) = 0, at ${X} = ${nH(cl(-b / a))}: a mirror pair.`, `The axis is halfway: ${X} = −b/(2a) = ${nH(-b)}/${pH(2 * a)} = ${ans(nH(h))}.`],
  }, h, v => {
    if (near(v, h)) return { ok: true, say: `Yes: ${X} = ${nH(h)}.` };
    if (near(v, -h)) return { ok: false, mc: MC.formula, say: `The formula has a minus: ${X} = −b/(2a) = −(${nH(b)})/${pH(2 * a)}.` };
    if (near(v, k)) return { ok: false, mc: MC.oneCoord, say: `${nH(k)} is the vertex height. The axis is a vertical line: give its ${X}.` };
    if (near(v, cl(-b / a))) return { ok: false, say: `${nH(cl(-b / a))} is the mirror of ${X} = 0. The axis is halfway between them.` };
    return { ok: false, say: `Use ${X} = −b/(2a) with a = ${nH(a)} and b = ${nH(b)}.` };
  });
};

export const stdPair: Gen = (R, n) => {
  const a = pick(R, [1, -1, 2, -2, 1]), w = nz(R, -8, 8) * (Math.abs(a) === 2 ? 0.5 : 1), b = cl(-a * w), c = nz(R, -6, 6), s: Std = [a, b, c];
  const h = cl(w / 2);
  return numItem({
    id: `stdPair-${n}`, family: 'stdPair', prompt: `<i>f</i>(${X}) = ${stdH(s)} has <i>f</i>(0) = ${nH(c)}. At which other ${X} is <i>f</i>(${X}) = ${nH(c)}?`, board: `${stdT(s)} = ${nT(c)}`,
    picture: { g: { ...curveWin(s, [0, w], [c]), show: [{ kind: 'hline', key: 'lev', y: c, col: 'dim' }, pt('C', 0, c, 'first', ptName(0, c))], reveal: [crv(s), pt('M', w, c, 'link', ptName(w, c)), { kind: 'vline', key: 'axis', x: h, col: 'pick' }] } },
    solution: [`${stdH(s)} = ${nH(c)} means ${stdH([a, b, 0])} = 0, and ${stdH([a, b, 0])} = ${X}(${coefH(a) || ''}${X} ${b > 0 ? '+' : '−'} ${nH(Math.abs(b))}).`, `So ${X} = 0 or ${coefH(a) || ''}${X} = ${nH(-b)}, ${X} = ${ans(nH(w))}. (The axis is halfway, at ${nH(h)}.)`],
  }, w, v => {
    if (near(v, w)) return { ok: true, say: `Yes: ${nH(w)}. The pair 0 and ${nH(w)} puts the axis halfway, at ${nH(h)}.` };
    if (near(v, -w)) return { ok: false, mc: MC.wrongSign, say: `${coefH(a) || ''}${X} ${b > 0 ? '+' : '−'} ${nH(Math.abs(b))} = 0 gives ${X} = ${nH(w)}: the sign flips.` };
    if (near(v, h)) return { ok: false, say: `${nH(h)} is the axis, halfway. The mirror of 0 is twice as far.` };
    return { ok: false, say: `Subtract ${nH(c)} from both sides, then factor out ${X}.` };
  });
};

// =============== 17. graphing technology ===============
const winT = (x0: number, x1: number, y0: number, y1: number) => `${nH(x0)} ≤ ${X} ≤ ${nH(x1)}, ${nH(y0)} ≤ ${Y} ≤ ${nH(y1)}`;
export const techWindow: Gen = (R, n) => {
  for (;;) {
    const a = pick(R, [1, -1]), p = pick(R, [-4, -3, -2, -1, 1, 2, 3, 4]), q = int(R, 11, 16), s = fromZ(a, p, q), [h, k] = vertexOf(s), c = val(s, 0);
    if (Math.abs(k) <= 12 || !Number.isInteger(h)) continue;
    const f5 = (v: number) => Math.floor(v / 5) * 5, c5 = (v: number) => Math.ceil(v / 5) * 5, f10 = (v: number) => Math.floor(v / 10) * 10, c10 = (v: number) => Math.ceil(v / 10) * 10;
    const xs = [p, q, h, 0], ys = [k, c, 0];
    const W = { x0: f5(Math.min(...xs) - 1), x1: c5(Math.max(...xs) + 1), y0: f10(Math.min(...ys) - 2), y1: c10(Math.max(...ys) + 2) };
    const holds = (w: typeof W) => [[p, 0], [q, 0], [h, k], [0, c]].every(([x, y]) => x! > w.x0 && x! < w.x1 && y! > w.y0 && y! < w.y1);
    const cutV = a > 0 ? { ...W, y0: Math.max(-10, f10(k) + 10) } : { ...W, y1: Math.min(10, c10(k) - 10) };
    const cutZ = { ...W, x1: 10 };
    const std = { x0: -10, x1: 10, y0: -10, y1: 10 };
    if (!holds(W) || holds(cutV) || holds(cutZ) || holds(std)) continue;
    const opts: Opt[] = [
      { t: winT(W.x0, W.x1, W.y0, W.y1), ok: true, say: `Yes: it holds the vertex (${nH(h)}, ${nH(k)}), both zeros and the ${Y}-intercept (0, ${nH(c)}).` },
      { t: winT(-10, 10, -10, 10), mc: MC.window, say: `That is the standard window, the one shown: the zero at ${q} and the vertex at ${Y} = ${nH(k)} are off the screen.` },
      { t: winT(cutV.x0, cutV.x1, cutV.y0, cutV.y1), say: `The vertex is at ${Y} = ${nH(k)}: that window cuts it off.` },
      { t: winT(cutZ.x0, cutZ.x1, cutZ.y0, cutZ.y1), say: `The zero at ${X} = ${q} is outside that window.` },
    ];
    return choiceItem(R, {
      id: `techWindow-${n}`, family: 'techWindow',
      prompt: `<i>f</i>(${X}) = ${stdH(s)}, which factors as ${facH(fz(a, p, q))}. A calculator shows it in the standard window. Which window shows the vertex, both zeros and the ${Y}-intercept?`,
      board: `f(x) = ${stdT(s)}`,
      picture: { g: { x: [-10, 10, 2], y: [-10, 10, 2], show: [crv(s)], reveal: [pt('z0', p, 0, 'second', nH(p))] } },
      solution: [`Predict first: zeros ${nH(p)} and ${q}, axis ${X} = ${nH(h)}, vertex (${nH(h)}, ${nH(k)}), ${Y}-intercept (0, ${nH(c)}).`, `The window must reach past all of them: ${X} from below ${nH(Math.min(p, 0))} to above ${q}, ${Y} from below ${nH(Math.min(k, c, 0))} to above ${nH(Math.max(k, c, 0))}.`],
    }, opts);
  }
};

export const techTrace: Gen = (R, n) => {
  const b = pick(R, [0, 2, 4, -2, 6]), c = nz(R, -5, 9), t = pick(R, [2, 3, 4, 5, -2, -3]), s: Std = [-1, b, c], y = val(s, t), wrong = cl(t * t + b * t + c);
  const eT = `Y_1 = -X^2${b ? ` ${b > 0 ? '+' : '-'} ${Math.abs(b)}X` : ''} ${c > 0 ? '+' : '-'} ${Math.abs(c)}`;
  const eH = `Y1 = -X^2${b ? ` ${b > 0 ? '+' : '-'} ${Math.abs(b)}*X` : ''} ${c > 0 ? '+' : '-'} ${Math.abs(c)}`;
  return numItem({
    id: `techTrace-${n}`, family: 'techTrace',
    prompt: `To graph <i>f</i>(${X}) = ${stdH(s)}, Sam types <code>${eH}</code>. A calculator squares before it applies the minus. What should the trace show for ${Y} at ${X} = ${nH(t)}?`,
    board: eT,
    picture: { g: { ...curveWin(s, [t], [y]), show: [{ kind: 'vline', key: 'tx', x: t, col: 'pick' }], reveal: [crv(s), pt('P', t, y, 'link', ptName(t, y))] } },
    solution: [`−${X}² means −(${X}²): at ${X} = ${nH(t)}, −(${pH(t)}²) = −${t * t}.`, `${Y} = −${t * t}${b ? ` ${b * t >= 0 ? '+' : '−'} ${Math.abs(b * t)}` : ''} ${c > 0 ? '+' : '−'} ${Math.abs(c)} = ${ans(nH(y))}.`],
  }, y, v => {
    if (near(v, y)) return { ok: true, say: `Yes: ${nH(y)}. −${X}² at ${X} = ${nH(t)} is −${t * t}.` };
    if (near(v, wrong)) return { ok: false, mc: MC.negPow, say: `−${X}² is −(${X}²), not (−${X})²: square ${nH(t)} first, then make it negative.` };
    return { ok: false, say: `Square ${nH(t)}, make it negative, then add the other terms.` };
  });
};

// =============== 18. complete sketch ===============
export const whichGraph: Gen = (R, n) => {
  const form = pick(R, ['vtx', 'fac', 'std']);
  let s: Std, eqH: string, eqT: string, extra = '';
  if (form === 'vtx') { const a = pick(R, [1, -1, 0.5, -0.5]), h = nz(R, -3, 3), k = int(R, -3, 3); s = fromV(a, h, k); eqH = vfH(a, h, k); eqT = vfT(a, h, k); }
  else {
    const a = pick(R, [1, -1, 0.5, -0.5]); let p = nz(R, -4, 3), q = p + pick(R, [2, 4]);
    if (p + q === 0) { p += 1; q += 1; }
    const F = fz(a, p, q); s = facStd(F);
    if (form === 'fac') { eqH = facH(F); eqT = facT(F); } else { eqH = stdH(s); eqT = stdT(s); extra = ` (It factors as ${facH(F)}.)`; }
  }
  const [h, k] = vertexOf(s);
  const mirror: Std = [s[0], -s[1], s[2]], flip = fromV(-s[0], h, k);
  const all = [s, mirror, flip];
  const order = [0, 1, 2].sort(() => R() - 0.5), L = ['A', 'B', 'C'], cols = ['link', 'water', 'first'] as const;
  const letter = (i: number) => L[order.indexOf(i)]!;
  const xs = all.flatMap(t => [vertexOf(t)[0] - 2, vertexOf(t)[0] + 2]), ys = all.flatMap(t => [vertexOf(t)[1], val(t, vertexOf(t)[0] + 2)]);
  const opts: Opt[] = [
    { t: `Graph ${letter(0)}`, ok: true, say: `Yes: vertex (${nH(h)}, ${nH(k)}), opening ${s[0] > 0 ? 'up' : 'down'}.` },
    { t: `Graph ${letter(1)}`, mc: MC.wrongSign, say: `That one has its vertex at ${X} = ${nH(-h)}: the mirror image across the ${Y}-axis. Check the sign of the vertex's ${X}.` },
    { t: `Graph ${letter(2)}`, mc: MC.signA, say: `Right vertex, wrong direction: a = ${nH(s[0])} is ${s[0] > 0 ? 'positive, so it opens up' : 'negative, so it opens down'}.` },
  ];
  opts.sort((u, w) => u.t.localeCompare(w.t));
  return choiceItem(R, {
    id: `whichGraph-${n}`, family: 'whichGraph', prompt: `Which graph is <i>f</i>(${X}) = ${eqH}?${extra}`, board: `f(x) = ${eqT}`,
    picture: { g: { x: win(xs, 14), y: win(ys, 14), show: order.map((i, j) => crv(all[i]!, `g${L[j]}`, cols[j], L[j])), reveal: [pt('V', h, k, 'pick', ptName(h, k))] } },
    solution: [`Read the features first: vertex (${nH(h)}, ${nH(k)}), and a = ${nH(s[0])} ${s[0] > 0 ? '> 0, so it opens up' : '< 0, so it opens down'}.`, `Only graph ${letter(0)} has both.`],
  }, opts, true);
};

export const hiddenZero: Gen = (R, n) => {
  const side = pick(R, [1, -1]), a = pick(R, [1, -1]), r = pick(R, [2, 3]), h = side * pick(R, r === 2 ? [5, 6, 7] : [5, 6, 7]), k = -a * r * r;
  const s = fromV(a, h, k), z = [h - r, h + r], inside = z.filter(v => v > -6 && v < 6);
  if (inside.length !== 1) return hiddenZero(R, n);
  const opts: Opt[] = [
    { t: 'two real zeros', ok: true, say: `Yes: the vertex (${nH(h)}, ${nH(k)}) is ${k < 0 ? 'below' : 'above'} the axis and it opens ${a > 0 ? 'up' : 'down'}: it crosses twice. One crossing is off the screen.` },
    { t: 'one real zero', mc: MC.shown, say: `The screen shows one crossing, but the window ends at ${X} = ${side > 0 ? 6 : -6}. The vertex is at ${X} = ${nH(h)}, off the screen.` },
    { t: 'no real zeros', say: `The graph on the screen already crosses the ${X}-axis once.` },
  ];
  return choiceItem(R, {
    id: `hiddenZero-${n}`, family: 'hiddenZero',
    prompt: `A calculator shows <i>f</i>(${X}) = ${vfH(a, h, k)} in the window −6 ≤ ${X} ≤ 6, −6 ≤ ${Y} ≤ 6. How many real zeros does <i>f</i> have?`,
    board: `f(x) = ${vfT(a, h, k)}`,
    picture: { g: { x: [-6, 6, 1], y: [-6, 6, 1], show: [crv(s)], reveal: [pt('z0', inside[0]!, 0, 'second', nH(inside[0]!))] } },
    solution: [`Predict from the form: vertex (${nH(h)}, ${nH(k)}), a = ${nH(a)}. It opens toward the ${X}-axis, so it crosses twice.`, `(${binH(h)})² = ${r * r}: the zeros are ${nH(z[0]!)} and ${nH(z[1]!)}. The window only reaches one of them.`],
  }, opts, true);
};

// =============== 19. domain and range ===============
export const rangeOf: Gen = (R, n) => {
  const a = pick(R, [1, -1, 2, -2, 0.5, -0.5]), h = nz(R, -4, 4);
  let k = nz(R, -6, 6);
  if (k === h) k = -k;
  const s = fromV(a, h, k), eq = R() < 0.4, askDomain = R() < 0.3;
  const W = curveWin(s), ge = a > 0 ? '≥' : '≤', le = a > 0 ? '≤' : '≥';
  const opts: Opt[] = askDomain ? [
    { t: 'all real numbers', ok: true, say: `Yes: you can put any ${X} into ${vfH(a, h, k)}. The arms keep going past the screen.` },
    { t: `${Y} ${ge} ${nH(k)}`, mc: MC.drSwap, say: `That is the range, the outputs. The domain is the inputs: every ${X} works.` },
    { t: `${X} ${ge} ${nH(h)}`, say: `Inputs to the ${a > 0 ? 'left' : 'right'} of ${nH(h)} work too: the other arm.` },
    ...(eq ? [] : [{ t: `${nH(W.x[0])} ≤ ${X} ≤ ${nH(W.x[1])}`, mc: MC.window, say: `That is only the part on the screen. The parabola goes on beyond it.` }]),
  ] : [
    { t: `${Y} ${ge} ${nH(k)}`, ok: true, say: `Yes: the vertex value ${nH(k)} is reached, and every output ${a > 0 ? 'above' : 'below'} it too.` },
    { t: `${Y} ${ge.replace('≥', '>').replace('≤', '<')} ${nH(k)}`, mc: MC.strict, say: `At ${X} = ${nH(h)} the output is exactly ${nH(k)}, so ${nH(k)} is in the range: use ${ge}.` },
    { t: `${Y} ${ge} ${nH(h)}`, mc: MC.rangeH, say: `The range is about outputs: the bound is the vertex height ${nH(k)}, not ${nH(h)}.` },
    { t: `${Y} ${le} ${nH(k)}`, mc: a < 0 ? MC.signA : undefined, say: `It opens ${a > 0 ? 'up' : 'down'}: the outputs go ${a > 0 ? 'up' : 'down'} from ${nH(k)}.` },
    { t: 'all real numbers', mc: MC.drSwap, say: `That is the domain. The outputs never go ${a > 0 ? 'below' : 'above'} ${nH(k)}.` },
  ];
  return choiceItem(R, {
    id: `rangeOf-${n}`, family: 'rangeOf', prompt: `What is the ${askDomain ? 'domain' : 'range'} of <i>f</i>(${X}) = ${vfH(a, h, k)}?`, board: `f(x) = ${vfT(a, h, k)}`,
    picture: { g: eq ? slatePic(s, [pt('V', h, k, 'link', ptName(h, k)), { kind: 'hline', key: 'kl', y: k, col: 'pick' }]) : { ...W, show: [crv(s), pt('V', h, k, 'first')], reveal: [{ kind: 'hline', key: 'kl', y: k, col: 'pick' }] } },
    solution: askDomain
      ? [`Any real ${X} can go into the formula, and nothing in the question limits it.`, `Domain: all real numbers.`]
      : [`Vertex (${nH(h)}, ${nH(k)}); a = ${nH(a)} ${a > 0 ? '> 0: it opens up, so ' + nH(k) + ' is the least output' : '< 0: it opens down, so ' + nH(k) + ' is the greatest output'}.`, `${nH(k)} itself is reached at ${X} = ${nH(h)}. Range: ${Y} ${ge} ${nH(k)}.`],
  }, opts);
};

// =============== 20. rising and falling ===============
export const riseFall: Gen = (R, n) => {
  const line = R() < 0.3;
  let s: Std, x1: number, x2: number;
  if (line) { const m = nz(R, -3, 3); s = [0, m, int(R, -6, 2)]; x1 = int(R, -4, 1); x2 = x1 + int(R, 2, 3); }
  else {
    const a = pick(R, [1, -1, 0.5, -0.5]), h = int(R, -3, 3), k = R() < 0.6 ? -sgn(a) * int(R, 5, 8) : int(R, -3, 3);
    s = fromV(a, h, k); const side = pick(R, [1, -1]);
    x1 = side > 0 ? h : h - 2; x2 = x1 + 2;
  }
  const y1 = val(s, x1), y2 = val(s, x2), up = y2 > y1;
  const vals = Array.from({ length: 9 }, (_, i) => val(s, x1 + (x2 - x1) * i / 8));
  const allNeg = vals.every(v => v <= 0), allPos = vals.every(v => v >= 0);
  const signTrap = (up && allNeg) || (!up && allPos);
  const opts: Opt[] = [
    { t: `rising: ${Y} goes up as ${X} goes up`, ok: up, mc: !up ? (signTrap ? MC.signDir : MC.rtl) : undefined, say: up ? `Yes: left to right, the graph climbs from ${nH(y1)} to ${nH(y2)}${allNeg ? ', even though it is below the x-axis' : ''}.` : signTrap ? `Being above the x-axis is about the sign of ${Y}. Rising is about change: from ${nH(y1)} to ${nH(y2)} it goes down.` : `Read left to right, as ${X} grows: ${Y} goes from ${nH(y1)} to ${nH(y2)}.` },
    { t: `falling: ${Y} goes down as ${X} goes up`, ok: !up, mc: up ? (signTrap ? MC.signDir : MC.rtl) : undefined, say: !up ? `Yes: left to right, the graph drops from ${nH(y1)} to ${nH(y2)}.` : signTrap ? `Being below the x-axis is about the sign of ${Y}. Falling is about change: from ${nH(y1)} to ${nH(y2)} it goes up.` : `Read left to right, as ${X} grows: ${Y} goes from ${nH(y1)} to ${nH(y2)}.` },
    { t: `level: ${Y} stays the same`, say: `${Y} changes from ${nH(y1)} to ${nH(y2)}.` },
  ];
  return choiceItem(R, {
    id: `riseFall-${n}`, family: 'riseFall', prompt: `Between ${X} = ${nH(x1)} and ${X} = ${nH(x2)}, is this graph rising or falling?`, board: `${nT(x1)} < x < ${nT(x2)}`,
    picture: { g: { x: win([x1 - 2, x2 + 2]), y: win([...vals, y1, y2, val(s, x1 - 2), val(s, x2 + 2)]), show: [crv(s), { kind: 'vline', key: 'L1', x: x1, col: 'pick' }, { kind: 'vline', key: 'L2', x: x2, col: 'pick' }], reveal: [pt('P1', x1, y1, 'first', nH(y1)), pt('P2', x2, y2, 'link', nH(y2))] } },
    solution: [`Read left to right: at ${X} = ${nH(x1)}, ${Y} = ${nH(y1)}; at ${X} = ${nH(x2)}, ${Y} = ${nH(y2)}.`, `${Y} goes ${up ? 'up' : 'down'} as ${X} goes up: ${up ? 'rising' : 'falling'}${signTrap ? `, whatever the sign of ${Y}` : ''}.`],
  }, opts, true);
};

// =============== 21. increasing and decreasing ===============
export const incInterval: Gen = (R, n, sg) => {
  const a = pick(R, [1, -1, 2, -2, 0.5, -0.5]), h = nz(R, -4, 4);
  const k = R() < 0.35 ? sgn(a) * int(R, 1, 4) : nz(R, -5, 5);          // sometimes wholly above / below the x-axis
  const s = fromV(a, h, k), eq = sg !== 'rising-falling' && R() < 0.4, inc = R() < 0.5;
  const rightSide = (a > 0) === inc;                         // a > 0 increases to the right of h
  const below = a < 0 && k < 0, above = a > 0 && k > 0;
  const opts: Opt[] = [
    { t: `${X} ${rightSide ? '>' : '<'} ${nH(h)}`, ok: true, key: rightSide ? 'r' : 'l', say: `Yes: ${inc ? 'increasing' : 'decreasing'} means ${Y} ${inc ? 'rises' : 'falls'} as ${X} goes up. That happens ${rightSide ? 'right' : 'left'} of the vertex.` },
    { t: `${X} ${rightSide ? '<' : '>'} ${nH(h)}`, mc: MC.rtl, key: rightSide ? 'l' : 'r', say: `Read left to right. ${rightSide ? 'Left' : 'Right'} of ${X} = ${nH(h)} the graph ${inc ? 'falls' : 'rises'} as ${X} goes up.` },
    { t: `${X} ${rightSide ? '>' : '<'} 0`, mc: MC.yAxis, key: rightSide ? 'r0' : 'l0', say: `The turn is at the vertex, ${X} = ${nH(h)}, not at the ${Y}-axis.` },
    ...(below || above ? [{ t: `nowhere: the graph is ${below ? 'below' : 'above'} the ${X}-axis`, mc: MC.signDir, key: 'none', say: `${inc ? 'Increasing' : 'Decreasing'} is about ${Y} changing, not its sign. ${rightSide ? 'Right' : 'Left'} of the vertex it ${inc ? 'rises' : 'falls'}.` }] : []),
  ];
  return choiceItem(R, {
    id: `incInterval-${n}`, family: 'incInterval', prompt: `Where is <i>f</i>(${X}) = ${vfH(a, h, k)} ${inc ? 'increasing' : 'decreasing'}?`, board: `f(x) = ${vfT(a, h, k)}`,
    picture: { g: eq ? slatePic(s, [pt('V', h, k, 'link', ptName(h, k)), { kind: 'vline', key: 'axis', x: h, col: 'pick' }]) : { ...curveWin(s), show: [crv(s), pt('V', h, k, 'first')], reveal: [{ kind: 'vline', key: 'axis', x: h, col: 'pick' }] } },
    solution: [`The vertex (${nH(h)}, ${nH(k)}) splits the graph. It opens ${a > 0 ? 'up: it falls, then rises' : 'down: it rises, then falls'}, left to right.`, `So f is ${inc ? 'increasing' : 'decreasing'} for ${X} ${rightSide ? '>' : '<'} ${nH(h)}.`],
  }, opts);
};

// =============== 22. positive and negative ===============
export const posNeg: Gen = (R, n) => {
  const cnt = pick(R, [2, 2, 1, 0]), a = pick(R, [1, -1, 2, -1, 0.5]);
  let s: Std, eqH: string, eqT: string, zs: number[];
  if (cnt === 2) { const p = nz(R, -5, 3), q = p + int(R, 2, 6); const F = fz(a, p, q); s = facStd(F); eqH = facH(F); eqT = facT(F); zs = [p, q]; }
  else if (cnt === 1) { const p = nz(R, -4, 4); const F: Fac = { A: a, f: [{ m: 1, r: p }, { m: 1, r: p }] }; s = facStd(F); eqH = facH(F); eqT = facT(F); zs = [p]; }
  else { const h = nz(R, -3, 3), k = sgn(a) * int(R, 1, 4); s = fromV(a, h, k); eqH = vfH(a, h, k); eqT = vfT(a, h, k); zs = []; }
  const pos = R() < 0.5, want = (x: number) => (pos ? val(s, x) > 1e-9 : val(s, x) < -1e-9);
  const S = [...zs, ...zs.map(z => z - 0.5), ...zs.map(z => z + 0.5), ...(zs.length === 2 ? [(zs[0]! + zs[1]!) / 2] : []), -50, 50, 0.3];
  const sig = (f: (x: number) => boolean) => S.map(f).map(b => (b ? 1 : 0)).join('');
  const truth = sig(want);
  const C: { t: string; f: (x: number) => boolean; mc?: string; say: string }[] = [];
  if (cnt === 2) {
    const [p, q] = zs as [number, number];
    C.push({ t: `${X} < ${nH(p)} or ${X} > ${nH(q)}`, f: x => x < p || x > q, say: `Outside the zeros the graph is ${a > 0 ? 'above' : 'below'} the x-axis.` });
    C.push({ t: `${nH(p)} < ${X} < ${nH(q)}`, f: x => x > p && x < q, say: `Between the zeros the graph is ${a > 0 ? 'below' : 'above'} the x-axis.` });
    C.push({ t: `${X} ≤ ${nH(p)} or ${X} ≥ ${nH(q)}`, f: x => x <= p || x >= q, say: `At a zero, f(${X}) = 0, which is neither positive nor negative: leave the zeros out.` });
    C.push({ t: `${nH(p)} ≤ ${X} ≤ ${nH(q)}`, f: x => x >= p && x <= q, say: `At a zero, f(${X}) = 0: leave the zeros out.` });
  } else if (cnt === 1) {
    const p = zs[0]!;
    C.push({ t: `every ${X} except ${nH(p)}`, f: x => !near(x, p), say: `The graph touches the axis at ${nH(p)} and turns back.` });
    C.push({ t: `${X} > ${nH(p)}`, f: x => x > p, mc: MC.flips, say: `At a repeated zero the graph touches and turns back: the sign does not change there. Both sides are ${a > 0 ? 'positive' : 'negative'}.` });
    C.push({ t: `${X} < ${nH(p)}`, f: x => x < p, mc: MC.flips, say: `At a repeated zero the sign does not change: both sides are ${a > 0 ? 'positive' : 'negative'}.` });
    C.push({ t: `every ${X}`, f: () => true, say: `At ${X} = ${nH(p)} the output is 0, not ${pos ? 'positive' : 'negative'}.` });
    C.push({ t: `no ${X}`, f: () => false, say: `Look at either side of ${nH(p)}: the graph is ${a > 0 ? 'above' : 'below'} the axis.` });
  } else {
    C.push({ t: `every ${X}`, f: () => true, say: `The graph never meets the x-axis: it is ${a > 0 ? 'above' : 'below'} it everywhere.` });
    C.push({ t: `no ${X}`, f: () => false, say: `The graph never meets the x-axis: it is ${a > 0 ? 'above' : 'below'} it everywhere.` });
    const h = vertexOf(s)[0];
    C.push({ t: `${X} > ${nH(h)}`, f: x => x > h, say: `Both sides of the vertex are ${a > 0 ? 'above' : 'below'} the x-axis.` });
  }
  const opts: Opt[] = C.map(c => { const k = sig(c.f); return { t: c.t, ok: k === truth, key: k, mc: k === truth ? undefined : c.mc, say: k === truth ? `Yes: f(${X}) ${pos ? '> 0' : '< 0'} exactly for ${c.t}.` : c.say }; });
  if (!opts.some(o => o.ok)) throw new Error('posNeg: no right choice');
  // one right choice (others with the same meaning are dropped by choiceItem); at most four in all
  const right = opts.find(o => o.ok)!, wrong = opts.filter(o => !o.ok && o.key !== right.key).slice(0, 3);
  const eq = R() < 0.4;
  return choiceItem(R, {
    id: `posNeg-${n}`, family: 'posNeg', prompt: `For which ${X} is <i>f</i>(${X}) = ${eqH} ${pos ? 'positive' : 'negative'}?`, board: `f(x) ${pos ? '> 0' : '< 0'}`,
    picture: { g: eq ? slatePic(s, zs.map((z, i) => pt(`z${i}`, z, 0, 'second', nH(z))), zs, [0]) : { ...curveWin(s, zs, [0], 2), show: [crv(s)], reveal: zs.map((z, i) => pt(`z${i}`, z, 0, 'second', nH(z))) } },
    solution: [
      zs.length === 2 ? `The zeros ${nH(zs[0]!)} and ${nH(zs[1]!)} split the line. It opens ${a > 0 ? 'up' : 'down'}: ${a > 0 ? 'negative between them, positive outside' : 'positive between them, negative outside'}.`
        : zs.length === 1 ? `One repeated zero, ${nH(zs[0]!)}: the graph touches the axis and turns back, so the sign is the same on both sides (${a > 0 ? 'positive' : 'negative'}).`
          : `No real zeros: the graph is ${a > 0 ? 'above' : 'below'} the x-axis everywhere.`,
      `f(${X}) ${pos ? '> 0' : '< 0'} for ${right.t}.`,
    ],
  }, [right, ...wrong]);
};
