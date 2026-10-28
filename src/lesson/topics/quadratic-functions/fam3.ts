// fam3.ts: families for sub-goals 23-33 of "Quadratic functions and their graphs": equivalent forms, writing a
// quadratic from its vertex or zeros and one more point, factoring and completing the square on purpose, choosing a
// form, the three justifications (zeros, extreme value, symmetry), contexts with units and a feasible domain, and
// comparing two quadratics given in different ways. Pure: no DOM.
import { type GItem, type Gen, type Opt, MC, X, Y, ans, choiceItem, int, isSet, near, numItem, nz, pairItem, pick } from './common';
import { type Fac, type Std, binH, cl, coefH, facH, facStd, facT, fromV, fromZ, fz, keyStd, nH, nT, pH, qH, stdH, stdT, val, vertexOf, vfH, vfT, win, win0, zerosOf } from './qf';
import { crv, curveWin, features, pt, ptName } from './fam1';

const sgn = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const rad = (q: number) => `√<u class="rb">${q}</u>`;
const slatePic = (s: Std, extra: GItem[] = [], xs: number[] = [], ys: number[] = []) => ({ ...curveWin(s, xs, ys), show: [] as GItem[], reveal: [crv(s), ...extra], slate: true });
const tab = (xs: number[], ys: number[]) => `<table class="tab"><tr><td>${X}</td>${xs.map(x => `<td>${nH(x)}</td>`).join('')}</tr><tr><td>${Y}</td>${ys.map(y => `<td>${nH(y)}</td>`).join('')}</tr></table>`;

// =============== 23. equivalent forms ===============
export const expandVF: Gen = (R, n) => {
  const fromVtx = R() < 0.55;
  let s: Std, eqH: string, eqT: string, W: { s: Std; mc?: string; say: string }[], sol: string[];
  if (fromVtx) {
    const a = pick(R, [1, 2, -1, 3, -2]), h = nz(R, -5, 5), k = nz(R, -9, 9);
    s = fromV(a, h, k); eqH = vfH(a, h, k); eqT = vfT(a, h, k);
    W = [
      { s: [a, 0, cl(a * h * h + k)], mc: MC.sumsPart, say: `(${binH(h)})² is not ${X}² + ${h * h}: it has a middle term, ${nH(-2 * h)}${X}.` },
      { s: [a, cl(-2 * h), cl(h * h + k)], say: `Multiply every term of the square by ${nH(a)}, not just ${X}².` },
      { s: [a, cl(2 * a * h), cl(a * h * h + k)], mc: MC.wrongSign, say: `(${binH(h)})² has middle term ${nH(-2 * h)}${X}: check its sign.` },
      { s: [a, cl(-a * h), cl(a * h * h + k)], say: `The middle term of (${binH(h)})² is 2 · ${pH(-h)} · ${X} = ${nH(-2 * h)}${X}.` },
    ];
    sol = [`(${binH(h)})² = ${stdH([1, -2 * h, h * h])}.`, `${a === 1 ? '' : `Times ${nH(a)}: ${stdH([a, cl(-2 * a * h), cl(a * h * h)])}. `}Then ${k > 0 ? 'add' : 'subtract'} ${Math.abs(k)}: ${stdH(s)}.`];
  } else {
    const A = pick(R, [1, 2, -1, 3, -2]), p = nz(R, -6, 6), q = nz(R, -6, 6);
    const F = fz(A, p, q); s = facStd(F); eqH = facH(F); eqT = facT(F);
    W = [
      { s: [A, cl(A * (p + q)), cl(A * p * q)], mc: MC.wrongSign, say: `(${binH(p)})(${binH(q)}): the middle term is ${nH(-(p + q))}${X}. Check the signs.` },
      { s: [A, cl(-(p + q)), cl(p * q)], say: `Multiply every term by ${nH(A)}, not just ${X}².` },
      { s: [A, cl(-A * p * q), cl(-A * (p + q))], say: `The middle term comes from the outer and inner products: ${nH(-(p + q))}${X}. The constant is the product, ${nH(p * q)}.` },
    ];
    sol = [`(${binH(p)})(${binH(q)}) = ${stdH([1, -(p + q), p * q])}.`, `${A === 1 ? '' : `Times ${nH(A)}: `}${stdH(s)}.`];
  }
  const opts: Opt[] = [{ t: stdH(s), ok: true, key: keyStd(s), say: `Yes: ${stdH(s)}. One function, two ways to write it.` }, ...W.map(w => ({ t: stdH(w.s), key: keyStd(w.s), mc: w.mc, say: w.say }))];
  const [h, k] = vertexOf(s);
  return choiceItem(R, {
    id: `expandVF-${n}`, family: 'expandVF', prompt: `Which is <i>f</i>(${X}) = ${eqH} in standard form?`, board: `f(x) = ${eqT}`,
    picture: { g: { ...curveWin(s, [0], [val(s, 0)]), show: [crv(s)], reveal: [pt('V', h, k, 'link', ptName(h, k)), pt('yi', 0, val(s, 0), 'water', ptName(0, val(s, 0)))] } },
    solution: sol,
  }, opts);
};

export const proofOrCheck: Gen = (R, n) => {
  const a = pick(R, [1, 2, -1]), h = nz(R, -4, 4), k = nz(R, -6, 6), s = fromV(a, h, k), same = R() < 0.55;
  let t = pick(R, [1, -1, 2]); if (a + t === 0) t = 2;
  const g: Std = same ? s : [cl(s[0] + t), cl(s[1] - t), s[2]];          // + t·x(x − 1): agrees at 0 and 1 only
  const opts: Opt[] = [
    { t: `Not proven by two checks. Expanding ${vfH(a, h, k)} gives ${stdH(s)}, the same expression, so they agree for every ${X}.`, ok: same, key: 'same', say: same ? `Yes: expanding shows they are one function. Two checks alone could not.` : `Expand ${vfH(a, h, k)} carefully: you get ${stdH(s)}, and that is not ${stdH(g)}.` },
    { t: `Not proven by two checks. Expanding ${vfH(a, h, k)} gives ${stdH(s)}, which is not ${stdH(g)}: they are different functions.`, ok: !same, key: 'diff', say: !same ? `Yes: they agree at 0 and 1 but nowhere else. Try ${X} = 2: ${nH(val(s, 2))} and ${nH(val(g, 2))}.` : `Expand it: ${stdH(s)} is exactly the other expression.` },
    { t: `Proven: they agree at two inputs, so they agree at every input.`, mc: MC.examples, key: 'ex', say: same ? `Here they do agree everywhere, but two checks don't show it. Expanding does.` : `Two checks are only examples: try ${X} = 2, ${nH(val(s, 2))} and ${nH(val(g, 2))}.` },
  ];
  return choiceItem(R, {
    id: `proofOrCheck-${n}`, family: 'proofOrCheck',
    prompt: `Jo says <i>f</i>(${X}) = ${vfH(a, h, k)} and <i>g</i>(${X}) = ${stdH(g)} are the same function: both give ${nH(val(s, 0))} at ${X} = 0 and ${nH(val(s, 1))} at ${X} = 1. What is right?`,
    board: `${vfT(a, h, k)} \\overset{?}{=} ${stdT(g)}`,
    picture: { g: { ...curveWin(s, [0, 1, 2], [val(g, 2), val(g, -1)]), show: [crv(s, 'f', 'link', 'f'), pt('P0', 0, val(s, 0), 'first'), pt('P1', 1, val(s, 1), 'first')], reveal: same ? [] : [crv(g, 'g', 'water', 'g', true)] } },
    solution: [`Expand f: ${vfH(a, h, k)} = ${stdH(s)}.`, same ? `That is g's expression, term by term: the same function for every ${X}.` : `That is not g's expression: they differ (at ${X} = 2, ${nH(val(s, 2))} and ${nH(val(g, 2))}).`],
  }, opts, true);
};

// =============== 24. vertex form from a point ===============
function aCase(R: () => number): { a: number; d: number } {
  const frac = R() < 0.4;
  if (frac) return { a: pick(R, [0.25, 0.5, 0.75]) * pick(R, [1, -1]), d: pick(R, [2, -2]) };
  return { a: pick(R, [1, 2, 3, -1, -2, -3]), d: pick(R, [1, -1, 2, -2]) };
}
function aCheck(a: number, y1: number, k: number, h: number, x1: number, d: number) {
  return (v: number) => {
    if (near(v, a)) return { ok: true, say: `Yes: a = ${nH(a)}.` };
    if (!near(k, 0) && near(v, cl(y1 / (d * d)))) return { ok: false, mc: MC.noK, say: `Subtract k first: ${nH(y1)} − ${pH(k)} = ${nH(cl(y1 - k))} is how far the point is from the vertex, then divide by ${d * d}.` };
    if (near(v, 1)) return { ok: false, mc: MC.aIs1, say: `a is not always 1: with a = 1 the point would be at ${nH(cl(k + d * d))}, not ${nH(y1)}.` };
    if (near(v, -a)) return { ok: false, mc: MC.pointHK, say: `The vertex is (${nH(h)}, ${nH(k)}); the other point goes in for ${X} and ${Y}: ${nH(y1)} = a(${nH(x1)} − ${pH(h)})² + ${pH(k)}.` };
    if (!near(h, 0) && near(v, cl((y1 - k) / ((x1 + h) ** 2)))) return { ok: false, mc: MC.wrongSign, say: `(${binH(h)}) at ${X} = ${nH(x1)} is ${nH(x1)} − ${pH(h)} = ${nH(d)}.` };
    return { ok: false, say: `Put the point into a(${binH(h)})² + ${pH(k)} and solve for a.` };
  };
}
export const findA: Gen = (R, n) => {
  const { a, d } = aCase(R), h = int(R, -4, 4), k = int(R, -6, 6), x1 = h + d, y1 = cl(k + a * d * d), s = fromV(a, h, k);
  const how = pick(R, ['coords', 'graph', 'table']);
  const xs = [h - 2, h - 1, h, h + 1, h + 2], ys = xs.map(x => val(s, x));
  const prompt = how === 'coords' ? `A parabola has vertex (${nH(h)}, ${nH(k)}) and passes through (${nH(x1)}, ${nH(y1)}). In <i>f</i>(${X}) = a(${binH(h)})² ${k >= 0 ? '+' : '−'} ${nH(Math.abs(k))}, what is a?`
    : how === 'graph' ? `The graph shows the vertex (${nH(h)}, ${nH(k)}) and one more point. Write <i>f</i>(${X}) = a(${binH(h)})² ${k >= 0 ? '+' : '−'} ${nH(Math.abs(k))}: what is a?`
      : `A quadratic gives this table, with its vertex at ${X} = ${nH(h)}. In <i>f</i>(${X}) = a(${binH(h)})² ${k >= 0 ? '+' : '−'} ${nH(Math.abs(k))}, what is a? ${tab(xs, ys)}`;
  const show: GItem[] = how === 'table' ? xs.map((x, i) => pt(`t${i}`, x, ys[i]!, 'first')) : [pt('V', h, k, 'first', ptName(h, k)), pt('P', x1, y1, 'second', ptName(x1, y1))];
  return numItem({
    id: `findA-${n}`, family: 'findA', prompt, board: `f(x) = a${near(h, 0) ? 'x^2' : `(x ${h > 0 ? '-' : '+'} ${Math.abs(h)})^2`} ${k >= 0 ? '+' : '-'} ${Math.abs(k)}`,
    picture: { g: { ...curveWin(s, [x1, ...(how === 'table' ? xs : [])], [y1, ...(how === 'table' ? ys : [])]), show, reveal: [crv(s)] } },
    solution: [
      `Put in (${nH(x1)}, ${nH(y1)}): ${nH(y1)} = a(${nH(x1)} − ${pH(h)})² + ${pH(k)} = ${d * d}a + ${pH(k)}.`,
      `${d * d}a = ${nH(cl(y1 - k))}, so a = ${ans(nH(a))}.`,
      `Check: ${nH(a)}(${binH(h)})² ${k >= 0 ? '+' : '−'} ${Math.abs(k)} = ${stdH(s)}, and it gives ${nH(y1)} at ${X} = ${nH(x1)}.`,
    ],
  }, a, aCheck(a, y1, k, h, x1, d));
};

export const findACtx: Gen = (R, n) => {
  const kind = pick(R, ['arch', 'ball', 'profit']);
  let h: number, k: number, x1: number, y1: number, a: number, prompt: string, xName: string, yName: string, meaning: string, lo = -Infinity, hi = Infinity;
  if (kind === 'arch') {
    const half = pick(R, [20, 40, 50]), H = half === 20 ? pick(R, [10, 15]) : half === 40 ? pick(R, [20, 30]) : pick(R, [25, 10]);
    h = half; k = H; x1 = 0; y1 = 0; a = cl(-H / (half * half)); lo = 0; hi = 2 * half;
    prompt = `A bridge arch rises from the road at (0, 0) to its highest point ${H} ft up, ${half} ft across. Its shape is <i>y</i> = a(${binH(half)})² + ${H}, in feet. What is a?`;
    xName = 'across (ft)'; yName = 'height (ft)'; meaning = `a < 0: the arch bends down; every ${half} ft from the top it drops ${H} ft.`;
  } else if (kind === 'ball') {
    h = pick(R, [10, 20]); k = h === 10 ? pick(R, [16, 20]) : pick(R, [25, 21]); y1 = pick(R, [4, 5, 6]); x1 = 0;
    a = cl((y1 - k) / (h * h)); lo = 0; hi = h + Math.sqrt(-k / a);
    prompt = `A ball leaves a player's hand ${y1} ft above the ground and reaches its highest point, ${k} ft up, ${h} ft away (horizontally). Its path is <i>y</i> = a(${binH(h)})² + ${k}, in feet. What is a?`;
    xName = 'distance (ft)'; yName = 'height (ft)'; meaning = `a < 0: the path bends down from the peak.`;
  } else {
    h = pick(R, [12, 15, 20]); k = pick(R, [900, 1200, 1500]); const m = pick(R, [4, 6, 8, 10]); x1 = h - 5; y1 = k - 25 * m; a = -m; lo = 0;
    prompt = `A school play's profit is <i>P</i>(<i>x</i>) = a(${binH(h)})² + ${k.toLocaleString('en-US')} dollars at a ticket price of <i>x</i> dollars. At $${x1} a ticket the profit is $${y1.toLocaleString('en-US')}. What is a?`;
    xName = 'ticket price ($)'; yName = 'profit ($)'; meaning = `a = ${a}: $5 away from the best price, the profit is 25 × ${m} = $${25 * m} lower.`;
  }
  const s = fromV(a, h, k), d = x1 - h;
  const xs = [h, x1, kind === 'profit' ? h + 5 : 2 * h], ys = [k, y1, 0];
  return numItem({
    id: `findACtx-${n}`, family: 'findACtx', prompt, board: `y = a(x - ${h})^2 + ${k}`,
    picture: { g: { x: win0(xs), y: win0(ys), xName, yName, show: [pt('V', h, k, 'first', 'top'), pt('P', x1, y1, 'second')], reveal: [{ kind: 'curve', key: 'f', s, col: 'link', lo: Math.max(lo, 0), hi: Math.min(hi, win0(xs)[1]) }] } },
    solution: [
      `The vertex is (${nH(h)}, ${nH(k)}); put in the point (${nH(x1)}, ${nH(y1)}): ${nH(y1)} = a(${nH(x1)} − ${nH(h)})² + ${nH(k)} = ${d * d}a + ${nH(k)}.`,
      `${d * d}a = ${nH(cl(y1 - k))}, so a = ${ans(nH(a))}.`,
      meaning,
    ],
  }, a, aCheck(a, y1, k, h, x1, d));
};

// =============== 25. factored form from zeros ===============
export const zerosToA: Gen = (R, n) => {
  for (;;) {
    const a = pick(R, [1, 2, 3, -1, -2, -3, 0.5, -0.5]), kind = pick(R, ['two', 'two', 'double', 'half']);
    const p = kind === 'half' ? pick(R, [0.5, -0.5, 1.5, -1.5]) : nz(R, -5, 4), q = kind === 'double' ? p : kind === 'half' ? nz(R, -4, 4) : p + int(R, 1, 6);
    const viaY = R() < 0.6, x1 = viaY ? 0 : pick(R, [p - 1, q + 1, p - 2, q + 2]);
    const prod = (x1 - p) * (x1 - q);
    if (near(prod, 0) || near(x1, p) || near(x1, q)) continue;
    const y1 = cl(a * prod);
    if (Math.abs(y1) > 30 || !Number.isInteger(y1 * 4)) continue;
    const F: Fac = { A: a, f: [{ m: 1, r: p }, { m: 1, r: q }] }, s = facStd(F);
    const zeroWords = kind === 'double' ? `one repeated zero, ${nH(p)}` : `zeros ${nH(p)} and ${nH(q)}`;
    const formH = kind === 'double' ? `a(${binH(p)})²` : `a(${binH(p)})(${binH(q)})`;
    const formT = kind === 'double' ? `a(${binT(p)})^2` : `a(${binT(p)})(${binT(q)})`;
    const sw = (x1 + p) * (x1 + q);
    return numItem({
      id: `zerosToA-${n}`, family: 'zerosToA',
      prompt: `A quadratic has ${zeroWords}${viaY ? `, and its ${Y}-intercept is ${nH(y1)}` : `, and passes through (${nH(x1)}, ${nH(y1)})`}. In <i>f</i>(${X}) = ${formH}, what is a?`,
      board: `f(x) = ${formT}`,
      picture: { g: { ...curveWin(s, [p, q, x1], [y1, 0], 1), show: [pt('z0', p, 0, 'second', nH(p)), ...(kind === 'double' ? [] : [pt('z1', q, 0, 'second', nH(q))]), pt('P', x1, y1, 'first', ptName(x1, y1))], reveal: [crv(s)] } },
      solution: [`Put in (${nH(x1)}, ${nH(y1)}): ${nH(y1)} = a(${nH(x1)} − ${pH(p)})(${nH(x1)} − ${pH(q)}) = a · ${nH(cl(x1 - p))} · ${nH(cl(x1 - q))} = ${nH(cl(prod))}a.`, `a = ${nH(y1)} ÷ ${pH(cl(prod))} = ${ans(nH(a))}.`],
    }, a, v => {
      if (near(v, a)) return { ok: true, say: `Yes: a = ${nH(a)}. The zeros give a whole family of parabolas; the extra point picks one.` };
      if (near(v, 1)) return { ok: false, mc: MC.aIs1, say: `With a = 1 the graph would pass through (${nH(x1)}, ${nH(cl(prod))}), not (${nH(x1)}, ${nH(y1)}). Solve for a.` };
      if (!near(sw, 0) && near(v, cl(y1 / sw))) return { ok: false, mc: MC.wrongSign, say: `The zero ${nH(p)} gives the factor (${binH(p)}): at ${X} = ${nH(x1)} it is ${nH(cl(x1 - p))}.` };
      return { ok: false, say: `Put the point in: ${nH(y1)} = a(${nH(x1)} − ${pH(p)})(${nH(x1)} − ${pH(q)}), then divide.` };
    });
  }
};
const binT = (h: number) => (near(h, 0) ? 'x' : `x ${h > 0 ? '-' : '+'} ${nT(Math.abs(h))}`);

export const zerosToForm: Gen = (R, n) => {
  const a = pick(R, [2, 3, -1, -2, -3, 0.5]), p = nz(R, -5, 5);
  let q = nz(R, -5, 5); if (q === p) q = p + 2; if (q === 0) q = 3;
  const s = fromZ(a, p, q), c = val(s, 0);
  const o = (A: number, u: number, w: number, extra: Partial<Opt>): Opt => ({ t: `<i>f</i>(${X}) = ${facH(fz(A, u, w))}`, key: keyStd(fromZ(A, u, w)), say: '', ...extra });
  const opts: Opt[] = [
    o(a, p, q, { ok: true, say: `Yes: zeros ${nH(p)} and ${nH(q)}, and f(0) = ${nH(a)} · ${pH(-p)} · ${pH(-q)} = ${nH(c)}.` }),
    o(1, p, q, { mc: MC.aIs1, say: `Right zeros, but f(0) would be ${nH(p * q)}, not ${nH(c)}: find a from the ${Y}-intercept.` }),
    o(a, -p, -q, { mc: MC.wrongSign, say: `A zero at ${nH(p)} comes from the factor (${binH(p)}), which is 0 at ${X} = ${nH(p)}.` }),
    o(-a, p, q, { say: `Right zeros, but f(0) would be ${nH(-c)}, not ${nH(c)}.` }),
  ];
  return choiceItem(R, {
    id: `zerosToForm-${n}`, family: 'zerosToForm', prompt: `A quadratic has zeros ${nH(p)} and ${nH(q)}, and its ${Y}-intercept is ${nH(c)}. Which is it?`, board: `\\text{zeros } ${nT(p)}, ${nT(q)}; \\quad f(0) = ${nT(c)}`,
    picture: { g: { ...curveWin(s, [p, q, 0], [c, 0], 1), show: [pt('z0', p, 0, 'second', nH(p)), pt('z1', q, 0, 'second', nH(q)), pt('C', 0, c, 'first', ptName(0, c))], reveal: [crv(s)] } },
    solution: [`Zeros ${nH(p)} and ${nH(q)} give f(${X}) = a(${binH(p)})(${binH(q)}), for some a ≠ 0.`, `f(0) = a · ${pH(-p)} · ${pH(-q)} = ${nH(p * q)}a = ${nH(c)}, so a = ${nH(a)}: f(${X}) = ${facH(fz(a, p, q))}.`],
  }, opts);
};

// =============== 26. factor to reveal the zeros ===============
export const factorZeros: Gen = (R, n) => {
  const kind = pick(R, ['monic', 'monic', 'gcf', 'non', 'dos']);
  let F: Fac, how: string;
  if (kind === 'monic') { const r = nz(R, -7, 7); let w = nz(R, -7, 7); if (w === r) w = -r || 2; F = fz(1, r, w); how = `Two numbers with product ${nH(r * w)} and sum ${nH(-(r + w))}: ${nH(-r)} and ${nH(-w)}.`; }
  else if (kind === 'gcf') { const g = pick(R, [2, 3, 5, -2]), r = nz(R, -6, 6); let w = nz(R, -6, 6); if (w === r) w = r + 3; F = fz(g, r, w); how = `Take out the common factor ${nH(g)} first, then factor what is left.`; }
  else if (kind === 'non') { const m = pick(R, [1, 3, 5, -1, -3, -5]), w = nz(R, -5, 5); F = { A: 1, f: [{ m: 2, r: m / 2 }, { m: 1, r: w }] }; how = `a = 2: try (2${X} ± …)(${X} ± …) and check the middle term.`; }
  else { const d = pick(R, [3, 4, 5, 6, 7, 1.5, 2.5]); F = d % 1 ? { A: 1, f: [{ m: 2, r: d }, { m: 2, r: -d }] } : fz(1, d, -d); how = `A difference of two squares: A² − B² = (A − B)(A + B).`; }
  const [u, w] = F.f, p = u.r, q = w.r, s = facStd(F);
  return pairItem({
    id: `factorZeros-${n}`, family: 'factorZeros', prompt: `Factor to find the zeros of <i>f</i>(${X}) = ${stdH(s)}. (Either order.)`, board: `f(x) = ${stdT(s)}`,
    picture: { g: slatePic(s, [pt('z0', p, 0, 'second', nH(p)), pt('z1', q, 0, 'second', nH(q))], [p, q], [0]) },
    solution: [how, `${stdH(s)} = ${facH(F)}.`, `Each factor is 0 at one input: ${X} = ${ans(nH(p))} or ${X} = ${ans(nH(q))}.`],
  }, p, q, `${X} =`, ` or ${X} =`, '', (x, y) => {
    if (isSet(x, y, p, q)) return { ok: true, say: `Yes: ${facH(F)}, zeros ${nH(p)} and ${nH(q)}.` };
    if (isSet(x, y, -p, -q)) return { ok: false, mc: MC.wrongSign, say: `The factor ${u.m === 1 ? `(${binH(p)})` : 'with ' + nH(p)} is 0 at ${X} = ${nH(p)}: flip the sign when you read a zero.` };
    if ((u.m === 2 && isSet(x, y, cl(2 * p), q)) || (w.m === 2 && isSet(x, y, cl(2 * p), cl(2 * q)))) return { ok: false, mc: MC.bxc, say: `2${X} − ${nH(2 * p)} = 0 means ${X} = ${nH(p)}: divide by 2.` };
    return { ok: false, say: `Factor first (${how.split(':')[0]!.toLowerCase()}), then set each factor to 0.` };
  });
};

export const methodPick: Gen = (R, n) => {
  for (;;) {
    const m = nz(R, -5, 5), c = nz(R, -9, 9), D = m * m - c, b = 2 * m;
    if (D <= 0 || Number.isInteger(Math.sqrt(D))) continue;
    // a near miss: two integers with the right sum but the wrong product
    const u = Math.round(b / 2) + 1, v = b - u;
    if (u * v === c) continue;
    const s: Std = [1, b, c], zs = zerosOf(s);
    const opts: Opt[] = [
      { t: `Complete the square: (${binH(-m)})² = ${D}, so ${X} = ${nH(-m)} ± ${rad(D)}.`, ok: true, say: `Yes: ${nH(c)} has no factor pair that adds to ${nH(b)}, so it does not factor over the integers. Completing the square always works.` },
      { t: `Factor it: (${X} ${u >= 0 ? '+' : '−'} ${Math.abs(u)})(${X} ${v >= 0 ? '+' : '−'} ${Math.abs(v)}), so ${X} = ${nH(-u)} or ${X} = ${nH(-v)}.`, mc: MC.habit, say: `Multiply it out: the constant is ${nH(u * v)}, not ${nH(c)}. Check if factoring fits the numbers before you use it.` },
      { t: `It does not factor, so <i>f</i> has no zeros.`, mc: MC.noFactor, say: `Not factoring over the integers does not mean no zeros: the graph crosses the ${X}-axis twice.` },
    ];
    return choiceItem(R, {
      id: `methodPick-${n}`, family: 'methodPick', prompt: `Which way finds the zeros of <i>f</i>(${X}) = ${stdH(s)}?`, board: `f(x) = ${stdT(s)}`,
      picture: { g: { ...curveWin(s, zs, [0, c]), show: [crv(s)], reveal: zs.map((z, i) => pt(`z${i}`, z, 0, 'second', `≈ ${nH(Math.round(z * 100) / 100)}`)) } },
      solution: [`Factor pairs of ${nH(c)} never add to ${nH(b)}: no integer factoring.`, `Half of ${nH(b)} is ${nH(m)}: ${stdH(s)} = (${binH(-m)})² ${c - m * m >= 0 ? '+' : '−'} ${Math.abs(c - m * m)}, so (${binH(-m)})² = ${D} and ${X} = ${nH(-m)} ± ${rad(D)}.`],
    }, opts);
  }
};

// =============== 27. complete the square on purpose ===============
function csCase(R: () => number): { a: number; h: number; k: number; s: Std } {
  const kind = pick(R, ['even', 'even', 'odd', 'a']);
  let a = 1, h: number;
  if (kind === 'even') h = nz(R, -6, 6);
  else if (kind === 'odd') h = nz(R, -4, 4) + 0.5;
  else { a = pick(R, [2, 3, -2, -1]); h = nz(R, -4, 4); }
  const c = nz(R, -9, 9), k = cl(c - a * h * h);
  return { a, h, k, s: [a, cl(-2 * a * h), c] };
}
export const csVertexForm: Gen = (R, n) => {
  const { a, h, k, s } = csCase(R), c = s[2];
  const o = (A: number, H: number, K: number, extra: Partial<Opt>): Opt => ({ t: `${vfH(A, H, K)}`, key: keyStd(fromV(A, H, K)), say: '', ...extra });
  const opts: Opt[] = [
    o(a, h, k, { ok: true, say: `Yes: ${vfH(a, h, k)}. Expand it to check: ${stdH(s)}.` }),
    o(a, h, c, { mc: MC.unbalanced, say: `(${binH(h)})² adds ${nH(cl(h * h))}${a !== 1 ? `, times ${nH(a)}` : ''}, so take it off again: ${nH(c)} − ${pH(cl(a * h * h))}.` }),
    o(a, -h, k, { mc: MC.wrongSign, say: `The middle term ${nH(s[1])}${X} needs (${binH(h)})²: check the sign inside.` }),
    a !== 1 ? o(a, h, cl(c - h * h), { say: `Inside the brackets you add ${nH(cl(h * h))}, but it is multiplied by ${nH(a)}: take off ${nH(cl(a * h * h))}.` })
      : o(a, h, cl(c + h * h), { say: `${nH(cl(h * h))} was added inside the square, so it is subtracted outside, not added.` }),
  ];
  return choiceItem(R, {
    id: `csVertexForm-${n}`, family: 'csVertexForm', prompt: `Complete the square: which is <i>f</i>(${X}) = ${stdH(s)} in vertex form?`, board: `f(x) = ${stdT(s)}`,
    picture: { g: slatePic(s, features(s, { vertex: true, axis: true })) },
    solution: [
      a !== 1 ? `Take out ${nH(a)} from the ${X} terms: ${nH(a)}(${stdH([1, cl(-2 * h), 0])}) ${c >= 0 ? '+' : '−'} ${Math.abs(c)}.` : `Half of ${nH(s[1])} is ${nH(-h)}; its square is ${nH(cl(h * h))}.`,
      `${coefH(a)}(${binH(h)})² = ${stdH([a, s[1], cl(a * h * h)])}: it adds ${nH(cl(a * h * h))}, so subtract it: ${nH(c)} − ${pH(cl(a * h * h))} = ${nH(k)}.`,
      `f(${X}) = ${vfH(a, h, k)}.`,
    ],
  }, opts);
};

export const csMin: Gen = (R, n) => {
  const { a, h, k, s } = csCase(R), c = s[2], mm = a > 0 ? 'minimum' : 'maximum';
  return numItem({
    id: `csMin-${n}`, family: 'csMin', prompt: `Complete the square to find the ${mm} value of <i>f</i>(${X}) = ${stdH(s)}.`, board: `f(x) = ${stdT(s)}`,
    picture: { g: slatePic(s, features(s, { vertex: true })) },
    solution: [`${stdH(s)} = ${vfH(a, h, k)}.`, `(${binH(h)})² ≥ 0 and is 0 at ${X} = ${nH(h)}, so the ${mm} value is ${ans(nH(k))}.`],
  }, k, v => {
    if (near(v, k)) return { ok: true, say: `Yes: ${vfH(a, h, k)}, so the ${mm} is ${nH(k)}, at ${X} = ${nH(h)}.` };
    if (near(v, c)) return { ok: false, mc: MC.cAsK, say: `${nH(c)} is the ${Y}-intercept, f(0). The vertex is not on the ${Y}-axis here.` };
    if (near(v, h)) return { ok: false, mc: MC.wrongCoord, say: `${nH(h)} is where it happens. The value is the output there.` };
    if (near(v, cl(c + a * h * h)) || near(v, cl(c - h * h))) return { ok: false, mc: MC.unbalanced, say: `Whatever the square adds must be taken off: ${nH(c)} − ${pH(cl(a * h * h))}.` };
    return { ok: false, say: `Write it as ${coefH(a)}(${binH(h)})² + k, then read k.` };
  });
};

// =============== 28. choosing a form ===============
function threeForms(R: () => number) {
  const a = pick(R, [1, -1, 2, -2]); const p = nz(R, -5, 3), q = p + pick(R, [2, 4, 6, 3, 5]);
  const s = fromZ(a, p, q), [h, k] = vertexOf(s);
  return { a, p, q, s, h, k, forms: { fac: facH(fz(a, p, q)), vtx: vfH(a, h, k), std: stdH(s) } };
}
export const chooseForm: Gen = (R, n) => {
  const F = threeForms(R), feat = pick(R, ['zeros', 'ext', 'yint']);
  const right = feat === 'zeros' ? 'fac' : feat === 'ext' ? 'vtx' : 'std';
  const featT = feat === 'zeros' ? 'the zeros' : feat === 'ext' ? `the ${F.a > 0 ? 'minimum' : 'maximum'} value and where it happens` : `the ${Y}-intercept`;
  const why: Record<string, string> = {
    fac: `Factored form: each factor is 0 at a zero, so ${F.p} and ${F.q} can be read off.`,
    vtx: `Vertex form: the square is never negative and is 0 at ${X} = ${nH(F.h)}, so the ${F.a > 0 ? 'minimum' : 'maximum'} ${nH(F.k)} can be read off.`,
    std: `Standard form: at ${X} = 0 only the constant is left, ${nH(F.s[2])}.`,
  };
  const opts: Opt[] = (['fac', 'vtx', 'std'] as const).map(f => ({ t: F.forms[f], key: f, ok: f === right, mc: f === right ? undefined : MC.habit, say: f === right ? `Yes. ${why[f]}` : `That form hides it: you would have to work it out. ${why[right]}` }));
  return choiceItem(R, {
    id: `chooseForm-${n}`, family: 'chooseForm', prompt: `These are the same function. Which form shows ${featT} directly?`, board: `f(x) = ${facT(fz(F.a, F.p, F.q))} = ${stdT(F.s)}`,
    picture: { g: { ...curveWin(F.s, [F.p, F.q], [0, F.s[2]]), show: [crv(F.s)], reveal: feat === 'zeros' ? [pt('z0', F.p, 0, 'second', nH(F.p)), pt('z1', F.q, 0, 'second', nH(F.q))] : feat === 'ext' ? [pt('V', F.h, F.k, 'link', ptName(F.h, F.k))] : [pt('yi', 0, F.s[2], 'water', ptName(0, F.s[2]))] } },
    solution: [why[right]!],
  }, opts);
};

export const bestFormValue: Gen = (R, n) => {
  const F = threeForms(R), feat = pick(R, ['zero', 'ext', 'yint', 'axis']);
  const v = feat === 'zero' ? F.q : feat === 'ext' ? F.k : feat === 'yint' ? F.s[2] : F.h;
  const ask = feat === 'zero' ? 'the larger zero' : feat === 'ext' ? `the ${F.a > 0 ? 'minimum' : 'maximum'} value` : feat === 'yint' ? `the ${Y}-intercept` : `the axis of symmetry, ${X} =`;
  const list = `<i>f</i>(${X}) = ${F.forms.fac} = ${F.forms.vtx} = ${F.forms.std}`;
  return numItem({
    id: `bestFormValue-${n}`, family: 'bestFormValue', prompt: `${list}. Use the form that shows it: what is ${ask}?`, board: `f(x) = ${facT(fz(F.a, F.p, F.q))} = ${vfT(F.a, F.h, F.k)} = ${stdT(F.s)}`,
    picture: { g: { ...curveWin(F.s, [F.p, F.q], [0, F.s[2]]), show: [crv(F.s)], reveal: feat === 'zero' ? [pt('z1', F.q, 0, 'link', nH(F.q))] : feat === 'ext' ? [pt('V', F.h, F.k, 'link', ptName(F.h, F.k))] : feat === 'yint' ? [pt('yi', 0, F.s[2], 'link', ptName(0, F.s[2]))] : [{ kind: 'vline', key: 'axis', x: F.h, col: 'pick' }] } },
    solution: feat === 'zero'
      ? [`The zeros show in factored form, ${F.forms.fac}: each factor is 0 at one input.`, `${binH(F.p)} = 0 at ${X} = ${nH(F.p)}, and ${binH(F.q)} = 0 at ${X} = ${nH(F.q)}.`, `The larger zero is ${ans(nH(F.q))}.`]
      : feat === 'ext'
        ? [`The ${F.a > 0 ? 'minimum' : 'maximum'} shows in vertex form, ${F.forms.vtx}.`, `The square is 0 at ${X} = ${nH(F.h)} and a = ${nH(F.a)} is ${F.a > 0 ? 'positive' : 'negative'}, so the ${F.a > 0 ? 'minimum' : 'maximum'} value is ${ans(nH(F.k))}.`]
        : feat === 'yint'
          ? [`The ${Y}-intercept shows in standard form, ${F.forms.std}.`, `At ${X} = 0 only the constant is left: f(0) = ${ans(nH(F.s[2]))}.`]
          : [`The axis shows in vertex form, ${F.forms.vtx}.`, `The square is 0 at ${X} = ${nH(F.h)}, so the axis is ${X} = ${ans(nH(F.h))}.`],
  }, v, u => {
    if (near(u, v)) return { ok: true, say: `Yes: ${nH(v)}.` };
    if (feat === 'zero' && (near(u, -F.q) || near(u, -F.p))) return { ok: false, mc: MC.wrongSign, say: `(${binH(F.q)}) is 0 at ${X} = ${nH(F.q)}: flip the sign.` };
    if (feat === 'zero' && near(u, F.p)) return { ok: false, say: `${nH(F.p)} is the smaller zero.` };
    if (feat === 'ext' && near(u, F.s[2])) return { ok: false, mc: MC.cAsK, say: `${nH(F.s[2])} is the ${Y}-intercept. Read the vertex form.` };
    if (feat === 'yint' && near(u, F.k)) return { ok: false, mc: MC.kAsInt, say: `${nH(F.k)} is the vertex height. The ${Y}-intercept is the constant in standard form.` };
    if (feat === 'axis' && near(u, -F.h)) return { ok: false, mc: MC.wrongSign, say: `(${binH(F.h)})² is 0 at ${X} = ${nH(F.h)}.` };
    return { ok: false, say: `Pick the form that shows it, and read it off.` };
  });
};

// =============== 29. why factored form shows the zeros ===============
export const zeroProd: Gen = (R, n) => {
  const non = R() < 0.35, A = pick(R, [2, 3, -2, 5, -1]);
  const p = non ? pick(R, [1.5, -1.5, 2.5, -0.5]) : nz(R, -6, 6);
  let q = nz(R, -6, 6); if (near(q, p)) q = -q || 3;
  const F: Fac = { A, f: [{ m: non ? 2 : 1, r: p }, { m: 1, r: q }] }, s = facStd(F);
  const f1 = non ? `2${X} ${p > 0 ? '−' : '+'} ${nH(Math.abs(2 * p))}` : binH(p);
  const opts: Opt[] = [
    { t: `A product is 0 exactly when one of its factors is 0. ${nH(A)} is never 0; ${f1} = 0 only at ${X} = ${nH(p)}; ${binH(q)} = 0 only at ${X} = ${nH(q)}. Any other ${X} multiplies nonzero numbers.`, ok: true, say: 'Yes: both directions. Those inputs give 0, and no other input can.' },
    { t: `Both factors have to be 0 at the same ${X}, so ${nH(p)} and ${nH(q)} work together.`, mc: MC.allZero, say: `One zero factor is enough: at ${X} = ${nH(p)}, ${f1} = 0 and the whole product is 0, whatever the other factor is.` },
    { t: `It is the rule: flip the signs of the numbers in the brackets.`, mc: MC.notation, say: `That is a shortcut, not a reason${non ? ` (and here it gives ${nH(-2 * p)}, not ${nH(p)})` : ''}. The reason: a product is 0 only when a factor is 0.` },
    { t: `${nH(A)} is a zero too, because it is one of the factors.`, say: `Put ${X} = ${nH(A)} in: no factor is 0, so the product is not 0. ${nH(A)} is a number, not a factor that can be 0.` },
  ];
  return choiceItem(R, {
    id: `zeroProd-${n}`, family: 'zeroProd', prompt: `Why are ${nH(p)} and ${nH(q)} the zeros of <i>f</i>(${X}) = ${facH(F)}, and the only ones?`, board: `f(x) = ${facT(F)}`,
    picture: { g: { ...curveWin(s, [p, q], [0], 1), show: [crv(s)], reveal: [pt('z0', p, 0, 'second', nH(p)), pt('z1', q, 0, 'second', nH(q))] } },
    solution: [`At ${X} = ${nH(p)}: ${f1} = 0, so f(${nH(p)}) = 0. At ${X} = ${nH(q)}: ${binH(q)} = 0. At any other ${X}, three nonzero numbers multiply to a nonzero number.`],
  }, opts);
};

// =============== 30. why the vertex gives the extreme value ===============
export const boundWhy: Gen = (R, n) => {
  const a = pick(R, [1, 2, 3, -1, -2, -3, 0.5]), h = nz(R, -5, 5), k = nz(R, -8, 8), s = fromV(a, h, k), up = a > 0;
  const mm = up ? 'minimum' : 'maximum', f1 = val(s, h + 1);
  const opts: Opt[] = [
    { t: `(${binH(h)})² ≥ 0 for every ${X}, and a = ${nH(a)} is ${up ? 'positive' : 'negative'}, so ${coefH(a) || ''}(${binH(h)})² ${up ? '≥' : '≤'} 0 and f(${X}) ${up ? '≥' : '≤'} ${nH(k)}. At ${X} = ${nH(h)}, f = ${nH(k)}: so ${nH(k)} is the ${mm}.`, ok: true, say: `Yes: a bound that holds for every ${X}, and an ${X} where it is reached.` },
    { t: `(${binH(h)})² ≥ 0, so f(${X}) ${up ? '≤' : '≥'} ${nH(k)}: ${nH(k)} is the ${up ? 'maximum' : 'minimum'}.`, mc: up ? undefined : MC.signA, say: `a = ${nH(a)} is ${up ? 'positive' : 'negative'}: multiplying the square by it keeps it ${up ? '≥ 0' : 'from being ≥ 0: it flips to ≤ 0'}.` },
    { t: `f(${nH(h - 1)}) and f(${nH(h + 1)}) are both ${nH(f1)}, ${up ? 'more' : 'less'} than ${nH(k)}, so ${nH(k)} is the ${mm}.`, mc: MC.examples, say: `Two inputs are examples. The argument must cover every ${X}: that is what (${binH(h)})² ≥ 0 does.` },
  ];
  return choiceItem(R, {
    id: `boundWhy-${n}`, family: 'boundWhy', prompt: `<i>f</i>(${X}) = ${vfH(a, h, k)}. Which argument proves the extreme value of <i>f</i>?`, board: `f(x) = ${vfT(a, h, k)}`,
    picture: { g: { ...curveWin(s), show: [crv(s), { kind: 'hline', key: 'kl', y: k, col: 'pick' }], reveal: [pt('V', h, k, 'link', ptName(h, k))] } },
    solution: [`A square is never negative: (${binH(h)})² ≥ 0, and it is 0 only at ${X} = ${nH(h)}.`, `Times a = ${nH(a)}: ${up ? '≥ 0' : '≤ 0'}. So f(${X}) ${up ? '≥' : '≤'} ${nH(k)} everywhere, with equality at ${X} = ${nH(h)}.`],
  }, opts);
};

// =============== 31. why the axis is a mirror line ===============
export const symProof: Gen = (R, n) => {
  const a = pick(R, [1, 2, -1, -2, 3]), h = nz(R, -4, 4), k = nz(R, -6, 6), s = fromV(a, h, k), y1 = val(s, h + 1);
  const opts: Opt[] = [
    { t: `For every number d: f(${nH(h)} + d) = ${coefH(a)}d² ${k > 0 ? '+' : '−'} ${Math.abs(k)} and f(${nH(h)} − d) = ${coefH(a)}(−d)² ${k > 0 ? '+' : '−'} ${Math.abs(k)} = ${coefH(a)}d² ${k > 0 ? '+' : '−'} ${Math.abs(k)}. Equal outputs at equal distances from ${X} = ${nH(h)}.`, ok: true, say: 'Yes: it covers every pair of mirror inputs at once, because (−d)² = d².' },
    { t: `f(${nH(h + 1)}) = f(${nH(h - 1)}) = ${nH(y1)}, so the graph is symmetric about ${X} = ${nH(h)}.`, mc: MC.examples, say: `One pair is an example. Symmetry is a claim about every pair: use a general distance d.` },
    { t: `f(${nH(h)} + d) = f(${nH(h)}) + f(d) and f(${nH(h)} − d) = f(${nH(h)}) + f(−d), and f(d) = f(−d).`, mc: MC.distrib, say: `A function does not split over a sum: f(${nH(h)} + d) is not f(${nH(h)}) + f(d). Substitute instead.` },
    { t: `(−d)² = −d², so f(${nH(h)} − d) is not f(${nH(h)} + d): the graph is not symmetric.`, mc: MC.evenNeg, say: `(−d)² = (−d)(−d) = d². The minus signs cancel.` },
  ];
  return choiceItem(R, {
    id: `symProof-${n}`, family: 'symProof', prompt: `Which shows that <i>f</i>(${X}) = ${vfH(a, h, k)} is symmetric about ${X} = ${nH(h)}?`, board: `f(${nT(h)} + d) \\overset{?}{=} f(${nT(h)} - d)`,
    picture: { g: { ...curveWin(s, [h - 2, h + 2], [val(s, h + 2)]), show: [crv(s), { kind: 'vline', key: 'axis', x: h, col: 'pick' }], reveal: [1, 2].flatMap(d => [pt(`L${d}`, h - d, val(s, h - d), 'first'), pt(`R${d}`, h + d, val(s, h + d), 'first'), { kind: 'seg', key: `m${d}`, a: [h - d, val(s, h - d)], b: [h + d, val(s, h + d)], col: 'pick', dash: true } as GItem]) } },
    solution: [`Substitute a general distance d: f(${nH(h)} + d) = ${coefH(a)}(d)² ${k > 0 ? '+' : '−'} ${Math.abs(k)}, f(${nH(h)} − d) = ${coefH(a)}(−d)² ${k > 0 ? '+' : '−'} ${Math.abs(k)}.`, `(−d)² = d², so the two are equal for every d: ${X} = ${nH(h)} is a mirror line.`],
  }, opts);
};

// =============== 32. contexts ===============
export const projectile: Gen = (R, n) => {
  const T = pick(R, [2, 3, 4, 5]), sHalf = R() < 0.5, s0 = sHalf ? 0.5 : 1;
  const v0 = 16 * (T - s0), h0 = 16 * T * s0, tp = cl((T - s0) / 2), hp = cl(4 * (T + s0) ** 2), S: Std = [-16, v0, h0];
  const ask = pick(R, ['land', 'peak', 'tpeak']);
  const F: Fac = sHalf ? { A: -8, f: [{ m: 1, r: T }, { m: 2, r: -0.5 }] } : { A: -16, f: [{ m: 1, r: T }, { m: 1, r: -1 }] };
  const T_ = '<i>t</i>';
  const what = pick(R, [`A ball is thrown straight up from the edge of a roof ${h0} ft high at ${v0} ft/s.`, `A model rocket is launched straight up from a platform ${h0} ft high at ${v0} ft/s.`]);
  const model = `Its height after ${T_} seconds is <i>h</i>(${T_}) = ${stdH(S, T_)} feet${ask === 'land' ? ` = ${facH(F, T_)}` : ''}.`;
  const q = ask === 'land' ? `When does it hit the ground? (seconds)` : ask === 'peak' ? `How high does it get? (feet)` : `When does it reach its highest point? (seconds)`;
  const ans0 = ask === 'land' ? T : ask === 'peak' ? hp : tp;
  const W = { x: win0([T]), y: win0([hp, h0]) };
  return numItem({
    id: `projectile-${n}`, family: 'projectile', prompt: `${what} ${model} ${q}`, board: `h(t) = ${stdT(S, 't')}`,
    picture: { g: { ...W, xName: 'time (s)', yName: 'height (ft)', show: [pt('L', 0, h0, 'first', 'launch')], reveal: [{ kind: 'curve', key: 'f', s: S, col: 'link', lo: 0, hi: T, ends: ['closed', 'closed'] }, ask === 'land' ? pt('G', T, 0, 'link', `${T} s`) : pt('V', tp, hp, 'link', `${nH(tp)} s, ${nH(hp)} ft`)] } },
    solution: ask === 'land'
      ? [`h(${T_}) = 0 when ${facH(F, T_)} = 0: ${T_} = ${T} or ${T_} = −${nH(s0)}.`, `Time starts at 0 when it is thrown, so −${nH(s0)} s is outside the domain. It lands at ${ans(String(T))} s.`]
      : [`The highest point is the vertex: ${T_} = −b/(2a) = −${v0}/(2 · (−16)) = ${nH(tp)} s.`, ask === 'peak' ? `h(${nH(tp)}) = −16(${nH(tp)})² + ${v0}(${nH(tp)}) + ${h0} = ${ans(nH(hp))} ft.` : `So it is highest at ${ans(nH(tp))} s, at ${nH(hp)} ft.`],
  }, ans0, v => {
    if (near(v, ans0)) return { ok: true, say: ask === 'land' ? `Yes: ${T} seconds. The other zero, −${nH(s0)}, is before the throw, so it does not count.` : ask === 'peak' ? `Yes: ${nH(hp)} ft, at ${nH(tp)} s.` : `Yes: ${nH(tp)} s, when it is ${nH(hp)} ft up.` };
    if (ask === 'land' && near(v, -s0)) return { ok: false, mc: MC.ctxAll, say: `−${nH(s0)} s is before it was thrown: time starts at 0. Use the other zero.` };
    if (ask === 'peak' && near(v, tp)) return { ok: false, mc: MC.wrongCoord, say: `${nH(tp)} is when, in seconds. The question asks how high: h(${nH(tp)}).` };
    if (ask === 'tpeak' && near(v, hp)) return { ok: false, mc: MC.wrongCoord, say: `${nH(hp)} ft is how high. The question asks when: the ${T_} of the vertex.` };
    if (ask === 'peak' && near(v, h0)) return { ok: false, mc: MC.cAsK, say: `${h0} ft is where it starts, h(0). It keeps rising until ${nH(tp)} s.` };
    return { ok: false, say: ask === 'land' ? `Set h(${T_}) = 0 and use the factored form.` : `The highest point is the vertex: ${T_} = −b/(2a).` };
  });
};

export const penMax: Gen = (R, n) => {
  const L = pick(R, [40, 60, 80, 100, 120]), cap = R() < 0.45;
  const Wl = cap ? pick(R, [L / 4, (3 * L) / 10, (2 * L) / 5].filter(w => Number.isInteger(w) && w < L / 2)) : 2 * L;
  const xv = L / 4, Av = L * L / 8, xmin = cap ? (L - Wl) / 2 : 0, best = cap && xmin > xv ? xmin * (L - 2 * xmin) : Av;
  const S: Std = [-2, L, 0];
  const story = `A farmer has ${L} ft of fence for three sides of a rectangular pen; a barn wall is the fourth side. With the two sides that meet the barn ${X} ft long, the area is <i>A</i>(${X}) = ${X}(${L} − 2${X}) square feet.`;
  const capT = cap ? ` The barn wall is only ${Wl} ft long, so the side along it, ${L} − 2${X}, can be at most ${Wl} ft: ${X} ≥ ${nH(xmin)}.` : '';
  const xs = [0, L / 2], ys = [0, Av];
  const W = { x: win0(xs), y: win0(ys) };
  return numItem({
    id: `penMax-${n}`, family: 'penMax', prompt: `${story}${capT} What is the largest area the pen can have? (square feet)`, board: `A(x) = x(${L} - 2x)`,
    picture: { g: { ...W, xName: 'x (ft)', yName: 'area (sq ft)', show: [pt('z0', 0, 0, 'second'), pt('z1', L / 2, 0, 'second', `${L / 2}`), ...(cap ? [{ kind: 'vline', key: 'cap', x: xmin, col: 'wrong' } as GItem] : [])], reveal: [{ kind: 'curve', key: 'f', s: S, col: 'link', lo: cap ? xmin : 0, hi: L / 2 }, ...(cap ? [{ kind: 'curve', key: 'g', s: S, col: 'dim', lo: 0, hi: xmin, dash: true } as GItem] : []), pt('B', cap && xmin > xv ? xmin : xv, best, 'link', `${(best).toLocaleString('en-US')} sq ft`)] } },
    solution: [
      `The zeros are 0 and ${L / 2}, so the vertex is halfway, at ${X} = ${xv}: A(${xv}) = ${xv} · ${L - 2 * xv} = ${Av.toLocaleString('en-US')} sq ft.`,
      ...(cap ? [xmin > xv ? `But ${X} must be at least ${nH(xmin)}, right of the vertex, where A is decreasing. The best allowed is the end, ${X} = ${nH(xmin)}: A = ${nH(xmin)} · ${Wl} = ${ans(best.toLocaleString('en-US'))} sq ft.` : `${X} = ${xv} is allowed (${X} ≥ ${nH(xmin)}), so the largest area is ${ans(Av.toLocaleString('en-US'))} sq ft.`] : [`The largest area is ${ans(Av.toLocaleString('en-US'))} sq ft, with sides ${xv}, ${L - 2 * xv} and ${xv} ft.`]),
    ],
  }, best, v => {
    if (near(v, best)) return { ok: true, say: `Yes: ${best.toLocaleString('en-US')} square feet.` };
    if (cap && xmin > xv && near(v, Av)) return { ok: false, mc: MC.infeasible, say: `The vertex is at ${X} = ${xv}, but ${X} must be at least ${nH(xmin)}: that pen needs a ${L - 2 * xv} ft barn wall. Check the end of the allowed range.` };
    if (near(v, xv) || near(v, xmin)) return { ok: false, mc: MC.wrongCoord, say: `That is the side length ${X}. The question asks for the area, A(${X}).` };
    return { ok: false, say: `The vertex of A is halfway between its zeros, 0 and ${L / 2}. Then check it is allowed.` };
  });
};

// =============== 33. compare representations ===============
export const compareMax: Gen = (R, n) => {
  for (let tries = 0; ; tries++) {
    const up = R() < 0.4, sgnA = up ? 1 : -1, word = up ? 'minimum' : 'maximum';
    const fa = sgnA * pick(R, [1, 2, 0.5]), fh = nz(R, -3, 3), fk = int(R, -6, 6), f = fromV(fa, fh, fk);
    const ga = sgnA * pick(R, [1, 2, 0.5, 3]), gh = nz(R, -3, 3), gk = int(R, -6, 6), g = fromV(ga, gh, gk);
    if (fk === gk || fh === gh) continue;
    // the trap: comparing the constants c says the opposite of comparing the extremes
    const trap = (f[2] > g[2]) !== (fk > gk) && !near(f[2], g[2]);
    if (!trap && tries < 30 && R() < 0.75) continue;
    if (!Number.isInteger(f[1]) || !Number.isInteger(f[2])) continue;
    const better = up ? (fk < gk ? 'f' : 'g') : (fk > gk ? 'f' : 'g');
    const byC = up ? (f[2] < g[2] ? 'f' : 'g') : (f[2] > g[2] ? 'f' : 'g');
    const opts: Opt[] = (['f', 'g'] as const).map(w => ({
      t: `<i>${w}</i> has the ${up ? 'smaller minimum' : 'greater maximum'}`, ok: w === better, key: w,
      mc: w !== better && w === byC ? MC.params : undefined,
      say: w === better ? `Yes: f's ${word} is ${nH(fk)} (at ${X} = ${nH(fh)}), g's is ${nH(gk)}.` : w === byC ? `The constant term is the ${Y}-intercept, not the ${word}. Find f's vertex: ${X} = ${nH(fh)}, f(${nH(fh)}) = ${nH(fk)}.` : `Compare the vertex heights: f's is ${nH(fk)}, g's is ${nH(gk)}.`,
    }));
    opts.push({ t: `they have the same ${word}`, key: 'same', say: `f's ${word} is ${nH(fk)}, g's is ${nH(gk)}.` });
    const all = [fh, gh, fh - 2, fh + 2, gh - 2, gh + 2], ys = [fk, gk, val(f, fh + 2), val(g, gh + 2)];
    return choiceItem(R, {
      id: `compareMax-${n}`, family: 'compareMax', prompt: `<i>f</i>(${X}) = ${stdH(f)}. The graph shows <i>g</i>. Which ${up ? 'reaches lower' : 'reaches higher'}?`, board: `f(x) = ${stdT(f)}`,
      picture: { g: { x: win(all, 14), y: win(ys, 14), show: [crv(g, 'g', 'link', 'g')], reveal: [crv(f, 'f', 'water', 'f', true), pt('Vf', fh, fk, 'water', ptName(fh, fk)), pt('Vg', gh, gk, 'link')] } },
      solution: [`f: the vertex is at ${X} = −b/(2a) = ${nH(fh)}, and f(${nH(fh)}) = ${nH(fk)}. g: the graph turns at (${nH(gh)}, ${nH(gk)}).`, `${up ? 'Minimum' : 'Maximum'}: f ${nH(fk)}, g ${nH(gk)}. So <i>${better}</i> has the ${up ? 'smaller minimum' : 'greater maximum'}.`],
    }, opts, true);
  }
};
