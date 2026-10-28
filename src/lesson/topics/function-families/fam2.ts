// fam2.ts: stage 2 families of "Linear, quadratic or exponential?": comparing families at an input and by rate,
// graph signatures, the parent-function gallery, comparing features across representations, and eventual dominance
// with the last crossover. Pure: no DOM.
import { type GItem, type GPic, type Gen, MC, type Opt, ans, choice, int, numItem, pick, xI } from './common';
import { type FSpec, type Parent, PARENT_NAME, evalF, fH, fT, nH, nT, r9 } from './ff';
import { tpic, xsOf } from './tables';
import { subH } from './fam1';
import { win } from './pictures';

const fx = (s: string) => `<i>${s}</i>(${xI})`;
const linS = (m: number, c: number): FSpec => ({ p: 'lin', a: m, h: 0, k: c });
const quadS = (a: number, h: number, k: number): FSpec => ({ p: 'quad', a, h, k });
const expS = (a: number, b: number, k = 0): FSpec => ({ p: 'exp', a, h: 0, k, b });
/** a window that holds a function over x0..x1 (sampled), clamped to [lo, hi] when given */
function yWin(fs: FSpec[], x0: number, x1: number, clampLo = -Infinity, clampHi = Infinity, max = 12): [number, number, number] {
  let lo = Infinity, hi = -Infinity;
  for (const s of fs) for (let i = 0; i <= 80; i++) { const y = evalF(s, x0 + (x1 - x0) * i / 80); if (Number.isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); } }
  return win(Math.max(lo, clampLo), Math.min(hi, clampHi), max);
}

// ===================== compare-outputs =====================
export const compareAt: Gen = (R, n) => {
  for (;;) {
    const m = pick(R, [5, 10, 15, 20, 25, 30]), c = pick(R, [0, 5, 10, 20, 40]), p = pick(R, [1, 2, 3, 5]), q = pick(R, [0, 1, 4, 10]), a = pick(R, [1, 2, 3, 5]), b = pick(R, [2, 3]);
    const k = int(R, 0, 6);
    const v = [m * k + c, p * k * k + q, a * b ** k];
    const top = Math.max(...v), i = v.indexOf(top);
    if (v.filter(x => top - x < 1).length !== 1) continue;
    const names = ['f (linear)', 'g (quadratic)', 'h (exponential)'];
    return choice(R, {
      id: `compareAt-${n}`, family: 'compareAt', prompt: `Three models: ${fx('f')} = ${m}${xI}${c ? ' + ' + c : ''}, ${fx('g')} = ${p === 1 ? '' : p}${xI}<sup>2</sup>${q ? ' + ' + q : ''} and ${fx('h')} = ${a === 1 ? '' : a + ' · '}${b}<sup>x</sup>. Which is largest at ${xI} = ${k}?`,
      board: `f(x) = ${m}x${c ? ' + ' + c : ''}\\qquad g(x) = ${p === 1 ? '' : p}x^{2}${q ? ' + ' + q : ''}\\qquad h(x) = ${a === 1 ? '' : a + '\\cdot '}${b}^{x}\\qquad x = ${k}`,
      solution: [`f(${k}) = ${v[0]}, g(${k}) = ${v[1]}, h(${k}) = ${v[2]}.`, `The largest is ${ans(names[i]!)}.`],
    }, names.map((t, j) => ({ t, ok: j === i, mc: j === 2 && i !== 2 ? MC.expGreater : undefined, say: j === i ? `Right: f(${k}) = ${v[0]}, g(${k}) = ${v[1]}, h(${k}) = ${v[2]}.` : `Work out all three: f(${k}) = ${v[0]}, g(${k}) = ${v[1]}, h(${k}) = ${v[2]}.${j === 2 ? ' An exponential is not larger at every input.' : ''}` })), true);
  }
};
export const compareTableAt: Gen = (R, n) => {
  for (;;) {
    const d = pick(R, [10, 12, 15, 20, 25]), c = pick(R, [5, 10, 20, 30]), p = pick(R, [2, 3, 4, 5]), q = pick(R, [0, 2, 5]), a = pick(R, [1, 2, 3]), b = pick(R, [2, 3]);
    const k = pick(R, [5, 6]);
    const F = (x: number) => [c + d * x, p * x * x + q, a * b ** x];
    const v = F(k), top = Math.max(...v), i = v.indexOf(top);
    if (v.filter(x => top - x < 2).length !== 1) continue;
    const xs = xsOf(0, 1, 4), names = ['f', 'g', 'h'];
    const leader3 = F(3).indexOf(Math.max(...F(3)));
    if (leader3 === i && R() < 0.7) continue;   // mostly: the leader changes between x = 3 and x = k
    return choice(R, {
      id: `compareTableAt-${n}`, family: 'compareTableAt',
      prompt: `Columns f, g and h are one linear, one quadratic and one exponential table (find which). Continue each pattern: which is largest at ${xI} = ${k}?`,
      board: `x = ${k}:\\ \\max\\{f,\\ g,\\ h\\}`,
      picture: { t: { xName: 'x', xs: xs.map(String), cols: names.map((nm, j) => ({ name: nm, vals: xs.map(x => nH(F(x)[j]!)), col: (['water', 'first', 'second'] as const)[j] })) } },
      solution: [`f adds ${d} each row, g has 2nd differences ${2 * p}, h multiplies by ${b}.`, `At x = ${k}: f = ${v[0]}, g = ${v[1]}, h = ${v[2]}. Largest: ${ans(names[i]!)}.`],
    }, names.map((t, j) => ({ t, ok: j === i, mc: j === 2 && i !== 2 ? MC.expGreater : j === leader3 && j !== i ? MC.oneInput : undefined,
      say: j === i ? `Right: at x = ${k}, f = ${v[0]}, g = ${v[1]}, h = ${v[2]}.` : `Continue all three: at x = ${k}, f = ${v[0]}, g = ${v[1]}, h = ${v[2]}.` })), true);
  }
};

// ===================== avg-rate-nonlinear =====================
interface Ctx { f: (t: number) => number; rule: string; ruleT: string; unit: string; outU: string; inU: string; what: string; t0: number; t1: number }
function rateCtx(R: () => number): Ctx {
  if (R() < 0.6) {
    const v = pick(R, [48, 64, 80, 96]), s = pick(R, [0, 4, 5, 6]), tMax = Math.floor(v / 16);
    const L = pick(R, [1, 2, 3].filter(l => l <= tMax)), t0 = int(R, 0, tMax - L);
    return { f: t => -16 * t * t + v * t + s, rule: `<i>h</i>(<i>t</i>) = −16<i>t</i><sup>2</sup> + ${v}<i>t</i>${s ? ' + ' + s : ''}`, ruleT: `h(t) = -16t^{2} + ${v}t${s ? ' + ' + s : ''}`, unit: 'ft/s', outU: 'ft', inU: 'second', what: 'the height of a ball (feet, t in seconds)', t0, t1: t0 + L };
  }
  const a = pick(R, [1000, 2000, 5000]), b = pick(R, [1.1, 1.2, 1.05]), L = pick(R, [1, 2]), t0 = int(R, 0, 4 - L);
  return { f: t => r9(a * b ** t), rule: `<i>P</i>(<i>t</i>) = ${nH(a)} · ${b}<sup>t</sup>`, ruleT: `P(t) = ${nT(a)}\\cdot ${b}^{t}`, unit: 'people per year', outU: 'people', inU: 'year', what: 'the population of a town (t in years)', t0, t1: t0 + L };
}
export const avgRateFormula: Gen = (R, n) => {
  const C = rateCtx(R), y0 = r9(C.f(C.t0)), y1 = r9(C.f(C.t1)), dy = r9(y1 - y0), L = C.t1 - C.t0, rate = r9(dy / L);
  return numItem({
    id: `avgRateFormula-${n}`, family: 'avgRateFormula',
    prompt: `${C.rule} gives ${C.what}. What is the average rate of change from <i>t</i> = ${C.t0} to <i>t</i> = ${C.t1}?`,
    board: `${C.ruleT}\\qquad \\dfrac{\\Delta}{\\Delta t}\\ \\text{on}\\ [${C.t0},\\ ${C.t1}]`, unit: C.unit,
    solution: [`Values: ${nH(y0)} at t = ${C.t0} and ${nH(y1)} at t = ${C.t1}.`, `Rate = (${nH(y1)} − ${nH(y0)}) ÷ (${C.t1} − ${C.t0}) = ${ans(nH(rate))} ${C.unit}.`],
  }, rate, `Right: ${nH(dy)} ${C.outU} over ${L} ${C.inU}${L > 1 ? 's' : ''} is ${nH(rate)} ${C.unit} on average.`, [
    [y1, MC.outAsChange, `${nH(y1)} is the value at t = ${C.t1}, not the change. Subtract the value at t = ${C.t0}.`],
    [dy, MC.inputStep, `${nH(dy)} is the total change over ${L} ${C.inU}s. Divide by ${L} for the rate per ${C.inU}.`],
  ], 'Average rate = (change in output) ÷ (change in input).');
};
export const avgRateGraph: Gen = (R, n) => {
  let s: FSpec, xs: [number, number], yw: [number, number, number], xName: string, yName: string, unit: string;
  if (R() < 0.5) {
    const v = pick(R, [64, 80, 96]), T = v / 16;
    s = { p: 'quad', a: -16, h: v / 32, k: v * v / 64 };
    const L = pick(R, [1, 2]), t0 = int(R, 0, T - L);
    xs = [t0, t0 + L]; yw = [0, v === 64 ? 80 : v === 80 ? 112 : 160, 16]; xName = 'time (s)'; yName = 'height (ft)'; unit = 'ft/s';
  } else {
    const a = pick(R, [25, 50, 20, 10]), L = pick(R, [1, 2]), t0 = int(R, 0, 3 - L);
    s = expS(a, 2); xs = [t0, t0 + L]; yw = [0, a * 9, a]; xName = 'time (h)'; yName = 'cells (thousands)'; unit = 'thousand cells per hour';
  }
  const xMax = s.p === 'quad' ? 2 * s.h : 3;
  const y0 = r9(evalF(s, xs[0])), y1 = r9(evalF(s, xs[1])), rate = r9((y1 - y0) / (xs[1] - xs[0]));
  const g: GPic = { x: [0, xMax + (s.p === 'quad' ? 0 : 1), 1], y: yw, xName, yName, items: [
    { kind: 'fn', key: 'f', s, lo: 0, hi: xMax },
    { kind: 'point', key: 'p0', x: xs[0], y: y0, col: 'pick' }, { kind: 'point', key: 'p1', x: xs[1], y: y1, col: 'pick' },
  ], solve: [{ kind: 'seg', key: 'sec', a: [xs[0], y0], b: [xs[1], y1], col: 'first', dash: true }] };
  return numItem({
    id: `avgRateGraph-${n}`, family: 'avgRateGraph',
    prompt: `Read the two marked points. What is the average rate of change from ${xI} = ${xs[0]} to ${xI} = ${xs[1]} (${s.p === 'quad' ? 'seconds' : 'hours'})?`,
    board: `\\dfrac{\\Delta y}{\\Delta x} = \\,?\\qquad \\text{on}\\ [${xs[0]},\\ ${xs[1]}]`, unit, picture: { g },
    solution: [`The points are (${xs[0]}, ${nH(y0)}) and (${xs[1]}, ${nH(y1)}).`, `Rate = (${nH(y1)} − ${nH(y0)}) ÷ ${xs[1] - xs[0]} = ${ans(nH(rate))}: the slope of the segment joining them.`],
  }, rate, `Right: the segment joining the points has slope ${nH(rate)}.`, [
    [y1, MC.outAsChange, `${nH(y1)} is the height of the second point. The rate is the CHANGE divided by the input change.`],
    [r9(y1 - y0), MC.inputStep, `That is the change over ${xs[1] - xs[0]} units. Divide by ${xs[1] - xs[0]}.`],
  ], 'Read both points, then (change in y) ÷ (change in x).');
};
export const avgRateMeaning: Gen = (R, n) => {
  const C = rateCtx(R), y0 = C.f(C.t0), y1 = C.f(C.t1), rate = r9((y1 - y0) / (C.t1 - C.t0));
  if (rate === 0) return avgRateMeaning(R, n + 7);
  const what = C.outU === 'ft' ? 'height' : 'population', up = rate > 0;
  const per = C.inU;
  return choice(R, {
    id: `avgRateMeaning-${n}`, family: 'avgRateMeaning',
    prompt: `${C.rule} gives ${C.what}. Its average rate of change from <i>t</i> = ${C.t0} to <i>t</i> = ${C.t1} is ${nH(rate)} ${C.unit}. What does that mean?`,
    board: `${C.ruleT}\\qquad \\text{rate} = ${nT(rate)}`,
    solution: [`${nH(rate)} ${C.unit} is the change in ${what} divided by the change in time over the whole interval.`, `It is an average: at single moments the rate can be different.`],
  }, [
    { t: `On average the ${what} ${up ? 'rose' : 'fell'} ${nH(Math.abs(rate))} ${C.outU} per ${per} between t = ${C.t0} and t = ${C.t1}`, ok: true, say: `Right. An average over the interval, in ${C.unit}.` },
    { t: `The ${what} changed by exactly ${nH(Math.abs(rate))} ${C.outU} in every moment of that interval`, mc: MC.everyMoment, say: 'It is an average. The function is not linear, so the rate changes from moment to moment.' },
    // only a distractor when it is false (h(0) = 0 on [0, 1] makes the rate equal the height at t = 1)
    ...(Math.abs(y1 - rate) > 1e-9 ? [{ t: `The ${what} at t = ${C.t1} is ${nH(rate)} ${C.outU}`, mc: MC.outAsChange, say: `A rate is a change per ${per}, not a value of the ${what}.` }] : []),
    { t: `It takes ${nH(Math.abs(rate))} ${per}s for each ${C.outU === 'ft' ? 'foot' : 'person'} of change`, mc: MC.units, say: `The units are ${C.unit}: ${C.outU} per ${per}, not the other way round.` },
  ]);
};

// ===================== compare-rate-patterns =====================
export const ratePattern: Gen = (R, n) => {
  const kind = pick(R, ['lin', 'quad', 'exp'] as const);
  let f: (x: number) => number, rule: string, ruleT: string;
  if (kind === 'lin') { const m = pick(R, [3, 4, 6, -2, 2.5]), c = int(R, 1, 20); f = x => r9(m * x + c); rule = `${nH(m)}${xI} + ${c}`; ruleT = `${nT(m)}x + ${c}`; }
  else if (kind === 'quad') { const a = pick(R, [1, 2, 3, -1]), c = int(R, 0, 10); f = x => r9(a * x * x + c); rule = `${a === 1 ? '' : a === -1 ? '−' : a}${xI}<sup>2</sup>${c ? ' + ' + c : ''}`; ruleT = `${a === 1 ? '' : a === -1 ? '-' : a}x^{2}${c ? ' + ' + c : ''}`; }
  else { const a = pick(R, [2, 3, 5, 10]), b = pick(R, [2, 3]); f = x => a * b ** x; rule = `${a} · ${b}<sup>x</sup>`; ruleT = `${a}\\cdot ${b}^{x}`; }
  const rates = [0, 1, 2].map(i => r9(f(i + 1) - f(i)));
  const asTable = R() < 0.5, xs = xsOf(0, 1, 4), ys = xs.map(f);
  const ok = { lin: 0, quad: 1, exp: 2 }[kind];
  return choice(R, {
    id: `ratePattern-${n}`, family: 'ratePattern',
    prompt: `${asTable ? 'For the function in the table' : `For ${fx('f')} = ${rule}`}, find the average rate of change on [0, 1], [1, 2] and [2, 3]. How does the rate behave?`,
    board: asTable ? '\\text{rates on}\\qquad [0,1],\\ [1,2],\\ [2,3]' : `f(x) = ${ruleT}`,
    picture: asTable ? { t: tpic(xs, ys, { solve: ['d1'] }) } : undefined,
    solution: [`Rates: ${rates.map(r => nH(r)).join(', ')} (each interval has width 1).`, ['They are all the same: linear.', `They change by ${nH(rates[1]! - rates[0]!)} each interval: quadratic.`, `Each is ${nH(rates[1]! / rates[0]!)} times the one before: exponential.`][ok]!],
  }, [
    { t: 'It stays the same on every interval', ok: ok === 0, say: ok === 0 ? `Right: ${rates.map(r => nH(r)).join(', ')}.` : `The rates are ${rates.map(r => nH(r)).join(', ')}.` },
    { t: 'It changes by the same nonzero amount each interval', ok: ok === 1, mc: ok === 2 ? MC.diffOnly : undefined, say: ok === 1 ? `Right: ${rates.map(r => nH(r)).join(', ')}, a change of ${nH(rates[1]! - rates[0]!)} each time.` : `The rates are ${rates.map(r => nH(r)).join(', ')}.` },
    { t: 'It is multiplied by the same factor (not 1) each interval', ok: ok === 2, mc: ok === 1 ? MC.roughShape : undefined, say: ok === 2 ? `Right: ${rates.map(r => nH(r)).join(', ')}, ×${nH(rates[1]! / rates[0]!)} each time.` : `The rates are ${rates.map(r => nH(r)).join(', ')}.` },
    { t: 'The rate on each interval equals the value of f at its end', mc: MC.slopeHeight, say: `A rate is a CHANGE: f(1) − f(0) = ${nH(rates[0]!)}, not f(1) = ${nH(f(1))}.` },
  ], true);
};
export const rateRace: Gen = (R, n) => {
  for (;;) {
    const m = pick(R, [20, 30, 40, 50, 60]), s = pick(R, [0, 10, 20, 30, 40, 50, 60, 70, 80]);
    const rg = (1.1 ** (s + 10) - 1.1 ** s) / 10, q = rg / m;
    if (q > 0.8 && q < 1.25) continue;
    const gBig = rg > m;
    return choice(R, {
      id: `rateRace-${n}`, family: 'rateRace',
      prompt: `${fx('f')} = ${m}${xI} and ${fx('g')} = 1.1<sup>x</sup>. Which has the greater average rate of change on [${s}, ${s + 10}]? (Use a calculator.)`,
      board: `f(x) = ${m}x\\qquad g(x) = 1.1^{x}\\qquad [${s},\\ ${s + 10}]`,
      solution: [`f: rate ${m} on every interval.`, `g: (1.1^${s + 10} − 1.1^${s}) ÷ 10 ≈ ${nH(Math.round(rg * 10) / 10)}.`, gBig ? 'g has the greater rate there.' : 'f has the greater rate there.'],
    }, [
      { t: 'f, the linear function', ok: !gBig, mc: gBig ? MC.oneInput : undefined, say: !gBig ? `Right: ${m} against about ${nH(Math.round(rg * 10) / 10)}. On this interval the exponential is still slow.` : `Here g's rate is about ${nH(Math.round(rg * 10) / 10)}, more than ${m}. Rates of an exponential keep growing.` },
      { t: 'g, the exponential function', ok: gBig, mc: gBig ? undefined : MC.expRate, say: gBig ? `Right: about ${nH(Math.round(rg * 10) / 10)} against ${m}.` : `Not yet: on [${s}, ${s + 10}] g changes only about ${nH(Math.round(rg * 10) / 10)} per unit, less than ${m}.` },
      { t: 'They are equal', say: `${m} and about ${nH(Math.round(rg * 10) / 10)} are not equal.` },
    ], true);
  }
};

// ===================== family-graph-signatures =====================
function familyGraph(R: () => number): { s: FSpec; fam: 'lin' | 'quad' | 'exp'; g: GPic } {
  const fam = pick(R, ['lin', 'quad', 'exp', 'exp'] as const);
  let s: FSpec, x: [number, number, number];
  if (fam === 'lin') { s = linS(pick(R, [2, -2, 1.5, -1, 3, -0.5]), int(R, -4, 4)); x = [-5, 5, 1]; }
  else if (fam === 'quad') { const h = int(R, -2, 2); s = quadS(pick(R, [1, -1, 0.5, -0.5, 2]), h, int(R, -4, 4)); x = [h - 4, h + 4, 1]; }
  else { s = expS(pick(R, [1, 2, 3]), pick(R, [2, 0.5, 3])); x = [-4, 4, 1]; }
  const y = fam === 'exp' ? yWin([s], x[0], x[1], 0, 20, 10) : yWin([s], x[0], x[1], -10, 10, 10);
  return { s, fam, g: { x, y, items: [{ kind: 'fn', key: 'f', s }] } };
}
export const graphFamily: Gen = (R, n) => {
  const { s, fam, g } = familyGraph(R);
  const ok = { lin: 0, quad: 1, exp: 2 }[fam], dec = fam === 'exp' && (s.b ?? 2) < 1;
  const say = ['A straight line: equal rises over equal runs.', 'A parabola: it turns at a vertex and is symmetric about a vertical line.', 'An exponential: it flattens toward y = 0 on one side and never turns back.'];
  return choice(R, {
    id: `graphFamily-${n}`, family: 'graphFamily', prompt: 'Which family does this graph belong to?', board: 'y = \\,?', picture: { g },
    solution: [say[ok]!, `y = ${fH(s)}.`],
  }, ['Linear', 'Quadratic', 'Exponential'].map((t, j) => ({ t, ok: j === ok,
    mc: j === ok ? undefined : ok === 2 && j === 1 ? (dec ? MC.vertex : MC.curvedQuad) : ok === 1 && j === 2 ? MC.roughShape : undefined,
    say: j === ok ? `Right. ${say[ok]}` : `${say[ok]}${ok === 2 && j === 1 ? ' Levelling off is not a vertex: it never turns back up.' : ''}` })), true);
};
export const graphFeature: Gen = (R, n) => {
  let G = familyGraph(R);
  while (G.fam === 'lin') G = familyGraph(R);
  const exp = G.fam === 'exp';
  return choice(R, {
    id: `graphFeature-${n}`, family: 'graphFeature', prompt: `This graph is ${exp ? 'exponential, not quadratic' : 'quadratic, not exponential'}. Which feature shows it?`,
    board: exp ? '\\text{exponential,}\\qquad \\text{not quadratic}' : '\\text{quadratic,}\\qquad \\text{not exponential}', picture: { g: G.g },
    solution: [exp ? 'It gets closer and closer to y = 0 on one side and never turns around: no vertex, no symmetry.' : 'It turns around at a vertex, and the two sides are mirror images.'],
  }, exp ? [
    { t: 'It flattens out toward the line y = 0 and never turns back', ok: true, say: 'Right. A horizontal asymptote at y = 0 and no turning point: exponential.' },
    { t: 'It has a vertex where it levels off', mc: MC.vertex, say: 'Levelling off is not a vertex. A vertex is where a graph turns around; this one never does.' },
    { t: 'It is curved', mc: MC.curvedQuad, say: 'Parabolas are curved too. Curved alone does not decide the family.' },
  ] : [
    { t: 'It turns around at a vertex and is symmetric about a vertical line', ok: true, say: 'Right. A turning point with mirror-image sides: a parabola.' },
    { t: 'It flattens out toward a horizontal line', say: 'This graph does not level off: both sides keep going.' },
    { t: 'It is curved and gets steep', mc: MC.roughShape, say: 'Exponentials are curved and steep too. The vertex and the symmetry decide it.' },
  ]);
};

// ===================== parent-function-gallery =====================
const GALLERY: Parent[] = ['lin', 'quad', 'cube', 'sqrt', 'cbrt', 'abs', 'exp'];
function galleryS(R: () => number, p: Parent): FSpec {
  const a = pick(R, [1, 1, -1, 2, 0.5]), h = p === 'exp' ? 0 : int(R, -2, 2), k = int(R, -3, 3);
  if (p === 'exp') return { p, a: pick(R, [1, 1, -1, 2]), h: 0, k, b: pick(R, [2, 0.5]) };
  if (p === 'lin') return { p, a: pick(R, [2, -1, 0.5, 3, -2]), h: 0, k };
  return { p, a, h, k };
}
function galleryOpts(p: Parent, shifted: boolean, graph: boolean): Opt[] {
  const right = PARENT_NAME[p];
  const mcFor = (q: Parent): string | undefined => (q !== 'quad' ? undefined : p === 'sqrt' ? MC.sqrtQuad : p === 'exp' || p === 'cube' ? (graph ? MC.curvedQuad : MC.anyExp) : graph && p !== 'lin' && p !== 'abs' ? MC.curvedQuad : undefined);
  const pool: Parent[] = p === 'quad' ? ['exp', 'abs', 'cube'] : p === 'sqrt' ? ['quad', 'cbrt', 'exp'] : p === 'cbrt' ? ['cube', 'sqrt', 'quad'] : p === 'abs' ? ['quad', 'lin', 'sqrt'] : p === 'cube' ? ['quad', 'cbrt', 'exp'] : p === 'lin' ? ['abs', 'quad', 'exp'] : ['quad', 'cube', 'sqrt'];
  const o: Opt[] = [{ t: cap(right), ok: true, say: `Right: ${right}.`, key: p }];
  for (const q of pool.slice(0, shifted ? 2 : 3)) o.push({ t: cap(PARENT_NAME[q]), mc: mcFor(q), say: SAY_WHY[p], key: q });
  if (shifted) o.push({ t: 'None of these: the shift makes a new type', mc: MC.transform, say: 'Shifting, stretching or reflecting keeps the family. Only the position and size change.', key: 'none' });
  return o;
}
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const SAY_WHY: Record<Parent, string> = {
  lin: 'x appears to the first power only: a straight line.', quad: 'x is squared: a U-shape with one turning point.', cube: 'x is cubed: an S-shape through a flat point, no turning back up.',
  sqrt: 'x sits under a square root: a half-curve that starts at an endpoint.', cbrt: 'x sits under a cube root: an S-shape on its side, defined for every x.',
  abs: 'x sits inside absolute-value bars: a V-shape.', exp: 'x is in the exponent: it levels off toward a horizontal asymptote on one side.', log: '', recip: '',
};
export const equationFamily: Gen = (R, n) => {
  const p = pick(R, GALLERY), s = galleryS(R, p), shifted = s.h !== 0 || s.k !== 0;
  return choice(R, {
    id: `equationFamily-${n}`, family: 'equationFamily', prompt: `What type of function is <i>y</i> = ${fH(s)}?`, board: `y = ${fT(s)}`,
    solution: [SAY_WHY[p], `So it is ${ans(cap(PARENT_NAME[p]))}${shifted ? ', moved and stretched; still the same family' : ''}.`],
  }, galleryOpts(p, shifted, false));
};
function galleryPic(s: FSpec): GPic {
  const x0 = s.h - 5, x1 = s.h + 5;
  const y = yWin([s], x0, x1, s.k - 8, s.k + 8, 12);
  const it: GItem = s.p === 'sqrt' ? { kind: 'fn', key: 'f', s, lo: s.h, ends: ['closed', 'none'] } : { kind: 'fn', key: 'f', s };
  return { x: [x0, x1, 1], y, items: [it], solve: s.p === 'exp' ? [{ kind: 'hline', key: 'asy', y: s.k, col: 'pick' }] : [] };
}
export const graphGallery: Gen = (R, n) => {
  const p = pick(R, GALLERY.filter(q => q !== 'lin')), s = galleryS(R, p);
  return choice(R, {
    id: `graphGallery-${n}`, family: 'graphGallery', prompt: 'Which parent function was moved or stretched to make this graph?', board: 'y = \\,?', picture: { g: galleryPic(s) },
    solution: [SAY_WHY[p].replace(/^.*?: /, 'The graph shows '), `It is y = ${fH(s)}: ${ans(cap(PARENT_NAME[p]))}.`],
  }, galleryOpts(p, false, true));
};
export const asymptoteShift: Gen = (R, n) => {
  const a = pick(R, [1, 2, 3, 5, -2, 4]), b = pick(R, [2, 3, 0.5]), k = pick(R, [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);
  const s = expS(a, b, k);
  return numItem({
    id: `asymptoteShift-${n}`, family: 'asymptoteShift', prompt: `<i>y</i> = ${fH(s)} is a translated exponential. Its graph has a horizontal asymptote <i>y</i> = □. What is □?`,
    board: `y = ${fT(s)}\\qquad y \\to \\,?`,
    solution: [`${a === 1 ? '' : nH(a) + ' · '}${b === 0.5 ? '(1/2)' : b}<sup>x</sup> gets closer and closer to 0 on one side.`, `So y gets closer to 0 ${k < 0 ? '−' : '+'} ${Math.abs(k)}: the asymptote is y = ${ans(nH(k))}. (A table of it has no constant ratio: the raw ratio test needs asymptote 0.)`],
  }, k, `Right: the whole graph moved ${k < 0 ? 'down' : 'up'} ${Math.abs(k)}, asymptote and all.`, [[0, undefined, `y = 0 is the asymptote of ${b === 0.5 ? '(1/2)' : b}<sup>x</sup> itself. The ${k < 0 ? '−' : '+'} ${Math.abs(k)} moves it.`], [a, undefined, `${nH(a)} stretches the graph; the asymptote comes from the added constant.`]], 'The asymptote moves with the vertical shift.');
};

// ===================== parent-function-gallery-extended =====================
export const extendedGraph: Gen = (R, n) => {
  const kind = pick(R, ['log', 'recip', 'piece', 'sqrt', 'exp'] as const);
  let g: GPic, board: string, eqH: string, right: string;
  if (kind === 'log' || kind === 'recip' || kind === 'sqrt' || kind === 'exp') {
    const s: FSpec = kind === 'log' ? { p: 'log', a: 1, h: int(R, -1, 2), k: int(R, -1, 2), b: 2 }
      : kind === 'recip' ? { p: 'recip', a: pick(R, [1, 2, 4, -2]), h: int(R, -1, 2), k: int(R, -1, 2) }
        : kind === 'sqrt' ? { p: 'sqrt', a: pick(R, [1, 2]), h: int(R, -1, 2), k: int(R, -1, 2) } : { p: 'exp', a: pick(R, [4, 8]), h: 0, k: 0, b: 0.5 };
    const x0 = kind === 'exp' ? -1 : s.h - (kind === 'recip' ? 5 : 1), x1 = kind === 'exp' ? 7 : s.h + 9 - (kind === 'recip' ? 4 : 0);
    const items: GItem[] = kind === 'sqrt' ? [{ kind: 'fn', key: 'f', s, lo: s.h, ends: ['closed', 'none'] }] : [{ kind: 'fn', key: 'f', s }];
    if (kind === 'log' || kind === 'recip') items.push({ kind: 'vline', key: 'va', x: s.h });
    if (kind === 'recip') items.push({ kind: 'hline', key: 'ha', y: s.k });
    const y: [number, number, number] = kind === 'recip' ? [s.k - 6, s.k + 6, 1] : kind === 'exp' ? [0, 10, 1] : yWin([s], s.h + 0.05, x1, s.k - 6, s.k + 6, 10);
    g = { x: [x0, x1, 1], y, items };
    board = `y = ${fT(s)}`; eqH = `<i>y</i> = ${fH(s)}`;
    right = { log: 'Logarithmic', recip: 'Rational (reciprocal)', sqrt: 'Square root', exp: 'Exponential decay' }[kind];
  } else {
    const c = int(R, 1, 3), j = int(R, 0, 2), top = c + j + 2;
    const L: FSpec = { p: 'lin', a: 1, h: 0, k: c + 1 }, Rr: FSpec = { p: 'lin', a: -1, h: 0, k: top + j + 2 };
    g = { x: [-4, 8, 1], y: win(-2, top + 4, 12), items: [
      { kind: 'fn', key: 'f', s: L, lo: -4, hi: j + 1, ends: ['none', 'open'] },
      { kind: 'fn', key: 'f2', s: Rr, lo: j + 1, hi: 8, ends: ['closed', 'none'] },
    ] };
    board = `x < ${j + 1}:\\ y = x + ${c + 1}\\qquad x \\ge ${j + 1}:\\ y = ${top + j + 2} - x`;
    eqH = `<i>f</i>(${xI}) = ${xI} + ${c + 1} for ${xI} &lt; ${j + 1}, and <i>f</i>(${xI}) = ${top + j + 2} − ${xI} for ${xI} ≥ ${j + 1}`;
    right = 'Piecewise';
  }
  const all = ['Logarithmic', 'Square root', 'Rational (reciprocal)', 'Exponential decay', 'Piecewise'];
  const pool = all.filter(t => t !== right);
  const lead = right === 'Logarithmic' ? 'Square root' : right === 'Rational (reciprocal)' ? 'Exponential decay' : right === 'Square root' ? 'Logarithmic' : right === 'Exponential decay' ? 'Rational (reciprocal)' : 'Rational (reciprocal)';
  const others = [lead, ...pool.filter(t => t !== lead).slice(0, 2)];
  const why: Record<string, string> = {
    Logarithmic: 'x is inside a logarithm: a vertical asymptote and very slow growth, no endpoint.',
    'Square root': 'x is under a square root: the graph starts at an endpoint (a closed dot), no asymptote.',
    'Rational (reciprocal)': 'x is in the denominator: two branches, a vertical AND a horizontal asymptote.',
    'Exponential decay': 'x is in the exponent with a base below 1: defined for every x, one horizontal asymptote, no vertical one.',
    Piecewise: 'Different rules on different intervals: the graph is made of separate pieces.',
  };
  return choice(R, {
    id: `extendedGraph-${n}`, family: 'extendedGraph', prompt: `${eqH}. Use the rule and the graph: which type of function is it?`, board, picture: { g },
    solution: [why[right]!, `So: ${ans(right)}.`],
  }, [{ t: right, ok: true, say: `Right. ${why[right]}` }, ...others.map(t => ({ t, mc: right === 'Logarithmic' && t === 'Square root' ? MC.logSqrt : right === 'Rational (reciprocal)' && t === 'Exponential decay' ? MC.recipExp : undefined, say: `${why[right]} (${t}: ${why[t]!.split(':')[0]}.)` }))]);
};
export const tableCandidates: Gen = (R, n) => {
  if (R() < 0.5) {
    const A = pick(R, [12, 24, 36, 60, 48]), xs = [1, 2, 3, 4, 6].filter(x => A % x === 0), ys = xs.map(x => A / x);
    const right = `<i>y</i> = ${A}/${xI}`;
    return choice(R, {
      id: `tableCandidates-${n}`, family: 'tableCandidates', prompt: 'Which candidate rule fits EVERY row of the table?', board: `y = \\,?`,
      picture: { t: tpic(xs, ys) },
      solution: [`Check x = ${xs[2]}: ${A}/${xs[2]} = ${A / xs[2]!} ✓; ${2 * A} · (1/2)<sup>${xs[2]}</sup> = ${2 * A / 2 ** xs[2]!}; ${3 * A / 2} − ${A / 2}·${xs[2]} = ${3 * A / 2 - A / 2 * xs[2]!}.`, `Only ${ans(right)} fits every row.`],
    }, [
      { t: right, ok: true, say: `Right: x·y = ${A} in every row.` },
      { t: `<i>y</i> = ${2 * A} · (1/2)<sup>x</sup>`, mc: MC.recipExp, say: `It fits x = 1 and 2, but at x = ${xs[2]} it gives ${2 * A / 2 ** xs[2]!}, not ${A / xs[2]!}. Halving per step is not the same as A/x.` },
      { t: `<i>y</i> = ${3 * A / 2} − ${A / 2}${xI}`, mc: MC.finite, say: `It fits the first two rows only: at x = ${xs[2]} it gives ${3 * A / 2 - A / 2 * xs[2]!}.` },
    ]);
  }
  const k = pick(R, [0, 1, 2, 5, 10]), xs = [1, 2, 4, 8, 16], ys = xs.map(x => Math.log2(x) + k);
  const right = `<i>y</i> = log<sub>2</sub>(${xI})${k ? ' + ' + k : ''}`;
  return choice(R, {
    id: `tableCandidates-${n}`, family: 'tableCandidates', prompt: 'Which candidate rule fits EVERY row of the table?', board: `y = \\,?`,
    picture: { t: tpic(xs, ys) },
    solution: [`Each doubling of x adds 1 to y: that is log<sub>2</sub>.`, `Check x = 4: log<sub>2</sub>(4)${k ? ' + ' + k : ''} = ${2 + k} ✓. Only ${ans(right)} fits every row.`],
  }, [
    { t: right, ok: true, say: 'Right: doubling x adds 1 to y, in every row.' },
    { t: `<i>y</i> = √(${xI})${k - 1 ? (k - 1 > 0 ? ' + ' + (k - 1) : ' − 1') : ''}`, mc: MC.logSqrt, say: `At x = 16 that gives ${4 + k - 1}, not ${4 + k}. Square roots and logs both grow slowly, but differently.` },
    { t: `<i>y</i> = ${xI}${k - 1 ? (k - 1 > 0 ? ' + ' + (k - 1) : ' − 1') : ''}`, mc: MC.finite, say: `It fits x = 1 and x = 2 only: at x = 4 it gives ${4 + k - 1}.` },
  ]);
};

// ===================== compare-linear-pair =====================
export const linearPair: Gen = (R, n) => {
  for (;;) {
    const feat = pick(R, ['slope', 'yint', 'xint'] as const);
    const m1 = pick(R, [2, 3, -2, -3, 1.5, 4, -1]), b1 = int(R, -6, 12), m2 = pick(R, [1, 2, 3, -2, -4, 2.5, -1.5]), b2 = int(R, -6, 12);
    const asTable = R() < 0.6, h = 2;
    const zero = (m: number, b: number) => -b / m;
    let v1: number, v2: number;
    if (feat === 'slope') { v1 = m1; v2 = m2; }
    else if (feat === 'yint') { v1 = b1; v2 = b2; }
    else { v1 = zero(m1, b1); v2 = zero(m2, b2); if (!(v1 > 0 && v2 > 0)) continue; }
    const same = Math.abs(v1 - v2) < 1e-9;
    const fWins = feat === 'xint' ? v1 < v2 : v1 > v2;
    const naive = feat === 'slope' && asTable ? (m1 > m2 * h ? 'f' : m1 < m2 * h ? 'g' : 'same') : null;
    const xs = xsOf(0, h, 4), ys = xs.map(x => r9(m2 * x + b2));
    const gDesc = asTable ? 'g is given by the table' : `g starts at ${nH(b2)} when ${xI} = 0 and ${m2 > 0 ? 'rises' : 'falls'} ${nH(Math.abs(m2))} for every 1 unit of ${xI}`;
    const q = feat === 'slope' ? 'Which has the greater slope?' : feat === 'yint' ? 'Which has the greater y-intercept?' : 'Which reaches y = 0 first (the smaller positive x-intercept)?';
    const right = same ? 'same' : fWins ? 'f' : 'g';
    const vals = feat === 'slope' ? `slopes ${nH(m1)} and ${nH(m2)}` : feat === 'yint' ? `y-intercepts ${nH(b1)} and ${nH(b2)}` : `x-intercepts ${nH(r9(v1))} and ${nH(r9(v2))}`;
    return choice(R, {
      id: `linearPair-${n}`, family: 'linearPair', prompt: `${fx('f')} = ${fH(linS(m1, b1))}, and ${gDesc}. ${q}`,
      board: `f(x) = ${fT(linS(m1, b1))}`, picture: asTable ? { t: tpic(xs, ys, { yName: 'g(x)', solve: ['dx', 'd1'] }) } : undefined,
      solution: [asTable ? `g: the 1st difference is ${nH(r9(m2 * h))} per x-step of ${h}, so its slope is ${nH(m2)}; g(0) = ${b2}.` : `g has slope ${nH(m2)} and y-intercept ${b2}.`, `Compare the ${vals}.`],
    }, [
      { t: 'f', ok: right === 'f', mc: right !== 'f' && naive === 'f' ? MC.inputStep : undefined, say: right === 'f' ? `Right: ${vals}.` : `Compare the ${vals}.${naive === 'f' ? ' A table step of 2 doubles the 1st difference: divide by the step.' : ''}`, key: 'f' },
      { t: 'g', ok: right === 'g', mc: right !== 'g' && naive === 'g' ? MC.inputStep : undefined, say: right === 'g' ? `Right: ${vals}.` : `Compare the ${vals}.${naive === 'g' ? ' A table step of 2 doubles the 1st difference: divide by the step.' : ''}`, key: 'g' },
      { t: 'They are the same', ok: right === 'same', say: right === 'same' ? `Right: ${vals}.` : `Compare the ${vals}.`, key: 'same' },
    ], true);
  }
};
export const rangeFromTable: Gen = (R, n) => {
  const xs = xsOf(pick(R, [0, 1, 2]), 1, 4);
  const ys = xs.map(() => int(R, 1, 30));
  const lo = Math.min(...ys), hi = Math.max(...ys);
  if (lo === hi) return rangeFromTable(R, n + 3);
  return choice(R, {
    id: `rangeFromTable-${n}`, family: 'rangeFromTable', prompt: `This table lists some values of a function g; no rule and no domain are given. Ana says: “The range of g is ${lo} ≤ <i>y</i> ≤ ${hi}.” Is she right?`,
    board: `\\text{range of } g\\,?\\qquad ${lo} \\le y \\le ${hi}\\,?`, picture: { t: tpic(xs, ys, { yName: 'g(x)' }) },
    solution: ['The table shows g at four inputs only.', 'Without a rule or a stated domain, the values of g at other inputs are unknown: the range is not settled.'],
  }, [
    { t: 'Not settled: the table shows only some inputs, so other values of g are unknown', ok: true, say: 'Right. A finite table cannot settle the range (or the maximum, or the end behaviour).' },
    { t: `Yes: the range runs from the smallest to the largest value shown`, mc: MC.maxListed, say: 'Those are the smallest and largest LISTED values. Between and beyond the rows g could be anything.' },
    { t: 'No: the range is all real numbers, because the values change', say: 'That is a guess too: without a rule, no range can be stated.' },
  ]);
};

// ===================== cross-representation =====================
export const linVsNonlin: Gen = (R, n) => {
  for (;;) {
    const quad = R() < 0.6;
    const s: FSpec = quad ? quadS(pick(R, [1, -1, 2]), int(R, 1, 3), int(R, -2, 8)) : expS(pick(R, [1, 2, 4]), 2);
    const m = pick(R, [2, 3, 4, -1, 5]), c = int(R, -2, 10);
    const feat = pick(R, ['value', 'rate', 'yint'] as const);
    const a = int(R, 0, 2), b = a + pick(R, [1, 2]), k = int(R, 0, 4);
    const fv = (x: number) => m * x + c, gv = (x: number) => evalF(s, x);
    let v1: number, v2: number, what: string;
    if (feat === 'value') { v1 = fv(k); v2 = gv(k); what = `value at ${xI} = ${k}`; }
    else if (feat === 'rate') { v1 = m; v2 = (gv(b) - gv(a)) / (b - a); what = `average rate of change on [${a}, ${b}]`; }
    else { v1 = c; v2 = gv(0); what = 'y-intercept'; }
    if (Math.abs(v1 - v2) < 0.5) continue;
    const xsP = [0, 1, 2, 3, 4].filter(x => Math.abs(gv(x)) <= 64);
    const y = yWin([s], 0, 4.5, -10, 64, 12);
    if (xsP.some(x => gv(x) < y[0] || gv(x) > y[1])) continue;
    const g: GPic = { x: [0, 5, 1], y, items: [{ kind: 'fn', key: 'g', s, lo: 0, hi: 5 }, ...xsP.map(x => ({ kind: 'point' as const, key: `p${x}`, x, y: gv(x), name: `(${x}, ${nH(gv(x))})` }))] };
    const fWins = v1 > v2;
    const naiveRate = feat === 'rate' ? (fv(b) > gv(b) ? 'f' : 'g') : null;
    return choice(R, {
      id: `linVsNonlin-${n}`, family: 'linVsNonlin', prompt: `${fx('f')} = ${fH(linS(m, c))}. The graph shows g. Which has the greater ${what}?`,
      board: `f(x) = ${fT(linS(m, c))}`, picture: { g },
      solution: [`f: ${nH(r9(v1))}. g: ${feat === 'rate' ? `(${subH(gv(b), gv(a))}) ÷ ${b - a} = ` : ''}${nH(r9(v2))}.`, `The greater ${what}: ${ans(fWins ? 'f' : 'g')}.`],
    }, [
      { t: 'f', ok: fWins, mc: !fWins && naiveRate === 'f' ? MC.slopeHeight : undefined, say: fWins ? `Right: ${nH(r9(v1))} against ${nH(r9(v2))}.` : `f gives ${nH(r9(v1))}, g gives ${nH(r9(v2))}.${naiveRate === 'f' ? ' A rate compares changes, not heights.' : ''}` },
      { t: 'g', ok: !fWins, mc: fWins && naiveRate === 'g' ? MC.slopeHeight : undefined, say: !fWins ? `Right: ${nH(r9(v2))} against ${nH(r9(v1))}.` : `f gives ${nH(r9(v1))}, g gives ${nH(r9(v2))}.${naiveRate === 'g' ? ' A rate compares changes, not heights.' : ''}` },
      { t: 'They are equal', say: `${nH(r9(v1))} and ${nH(r9(v2))} differ.` },
    ], true);
  }
};
export const maxFromTable: Gen = (R, n) => {
  const v = pick(R, [40, 56, 72, 88]), s = pick(R, [0, 4, 5, 6]);
  const hT = (t: number) => -16 * t * t + v * t + s;
  const tMax = Math.floor(v / 16 - 0.01), ts = Array.from({ length: Math.min(tMax, 5) + 1 }, (_, i) => i).filter(t => hT(t) >= 0);
  const listed = Math.max(...ts.map(hT)), top = s + v * v / 64, tv = v / 32;
  return numItem({
    id: `maxFromTable-${n}`, family: 'maxFromTable',
    prompt: `A ball’s height is <i>h</i>(<i>t</i>) = −16<i>t</i><sup>2</sup> + ${v}<i>t</i>${s ? ' + ' + s : ''} feet after <i>t</i> seconds. The table lists whole seconds; the greatest listed height is ${listed} ft. What is the ball’s greatest height?`,
    board: `h(t) = -16t^{2} + ${v}t${s ? ' + ' + s : ''}`, unit: 'ft',
    picture: { t: tpic(ts, ts.map(hT), { xName: 't (s)', yName: 'h (ft)' }) },
    solution: [`The vertex is at t = ${v} ÷ 32 = ${nH(tv)}, between two listed seconds.`, `h(${nH(tv)}) = ${ans(nH(top))} ft.`],
  }, top, `Right: the top is at t = ${nH(tv)}, between the rows: ${nH(top)} ft.`,
  [[listed, MC.maxListed, `${listed} ft is the largest LISTED height. The vertex is at t = ${nH(tv)}, between rows.`]], 'Find the vertex time t = −b ÷ (2a), then h at that time.');
};

// ===================== eventual-dominance =====================
interface Pair { f: string; g: string; fT: string; gT: string; win: 'f' | 'g'; decay: boolean; fv: (x: number) => number; gv: (x: number) => number }
/** growth a·b^x (a > 0, b > 1) against a line or a quadratic, or a
 *  counterexample (decay, or a negative coefficient) */
function longRunPair(R: () => number): Pair {
  const gk = pick(R, ['lin', 'quad'] as const);
  const m = pick(R, [5, 10, 20, 50, 100]), c = pick(R, [0, 20, 50, 1000]), p = pick(R, [1, 2, 3]);
  const g = gk === 'lin' ? `${m}<i>x</i>${c ? ' + ' + c : ''}` : `${p === 1 ? '' : p}<i>x</i><sup>2</sup>${c ? ' + ' + c : ''}`;
  const gT = gk === 'lin' ? `${m}x${c ? ' + ' + c : ''}` : `${p === 1 ? '' : p}x^{2}${c ? ' + ' + c : ''}`;
  const gv = (x: number) => (gk === 'lin' ? m * x + c : p * x * x + c);
  const kind = pick(R, ['grow', 'grow', 'decay', 'neg'] as const);
  const half = '\\left(\\tfrac{1}{2}\\right)';
  if (kind === 'grow') {
    const a = pick(R, [1, 2, 3, 0.5, 0.01]), b = pick(R, [1.05, 1.1, 1.5, 2]);
    return { f: `${a === 1 ? '' : nH(a) + ' · '}${nH(b)}<sup>x</sup>`, fT: `${a === 1 ? '' : nT(a) + '\\cdot '}${nT(b)}^{x}`, g, gT, win: 'f', decay: false, fv: x => a * b ** x, gv };
  }
  if (kind === 'decay') {
    const a = pick(R, [50, 100, 200, 1000]), b = pick(R, [0.5, 0.8, 0.9]);
    return { f: `${nH(a)} · ${b === 0.5 ? '(1/2)' : nH(b)}<sup>x</sup>`, fT: `${nT(a)}\\cdot ${b === 0.5 ? half : nT(b)}^{x}`, g, gT, win: 'g', decay: true, fv: x => a * b ** x, gv };
  }
  const a = pick(R, [1, 2, 5]), b = pick(R, [0.5, 2, 3]);
  return { f: `−${a === 1 ? '' : a + ' · '}${b === 0.5 ? '(1/2)' : b}<sup>x</sup>`, fT: `-${a === 1 ? '' : a + '\\cdot '}${b === 0.5 ? half : b}^{x}`, g, gT, win: 'g', decay: true, fv: x => -a * b ** x, gv };
}
export const whoWinsLongRun: Gen = (R, n) => {
  let P = longRunPair(R);
  // "f is larger for every x ≥ 0" must be false (else two statements are true): f must trail somewhere
  while (!Array.from({ length: 400 }, (_, i) => i * 0.5).some(x => P.fv(x) < P.gv(x))) P = longRunPair(R);
  const fw = P.win === 'f', decay = P.decay;
  return choice(R, {
    id: `whoWinsLongRun-${n}`, family: 'whoWinsLongRun', prompt: `${fx('f')} = ${P.f} and ${fx('g')} = ${P.g}, for ${xI} ≥ 0. As ${xI} grows without bound, which statement is true?`,
    board: `f(x) = ${P.fT}\\qquad g(x) = ${P.gT}`,
    solution: fw ? ['f multiplies by the same factor (above 1) every step; g only adds or grows by a polynomial.', 'So from some x on, f is larger for good, even if g leads at first.']
      : [decay ? 'f is not exponential GROWTH: its factor is below 1 or its coefficient is negative, so it never takes off.' : 'f does not grow without bound.', 'g keeps growing, so from some x on g is larger for good.'],
  }, [
    { t: 'From some x on, f is larger for good', ok: fw, mc: fw ? undefined : MC.anyExpWins, say: fw ? 'Right. Exponential growth (a > 0, b > 1) eventually beats any linear or quadratic function.' : `f = ${P.f} does not grow: ${decay ? 'its factor is below 1 or its coefficient is negative' : ''}. Only a > 0 with b > 1 takes off.` },
    { t: 'From some x on, g is larger for good', ok: !fw, mc: fw ? MC.oneInput : undefined, say: !fw ? 'Right. This exponential shrinks or stays below 0, so the growing function wins.' : 'g may lead for a while, but a growing exponential overtakes it and pulls away.' },
    { t: 'f is larger for every x ≥ 0', mc: MC.expGreater, say: 'Not at every input: check a few values. The claim is about the long run.' },
  ]);
};
const ORDERS = [
  { f: (x: number) => 2 ** x, g: (x: number) => x * x, fN: '2ˣ', gN: 'x²', n: 8 },
  { f: (x: number) => 2 ** x, g: (x: number) => 4 * x, fN: '2ˣ', gN: '4x', n: 7 },
  { f: (x: number) => 3 ** x, g: (x: number) => 9 * x, fN: '3ˣ', gN: '9x', n: 6 },
  { f: (x: number) => 2 ** x, g: (x: number) => 2 * x * x, fN: '2ˣ', gN: '2x²', n: 8 },
  { f: (x: number) => 2 ** x, g: (x: number) => 3 * x + 4, fN: '2ˣ', gN: '3x + 4', n: 7 },
  { f: (x: number) => 3 ** x, g: (x: number) => x * x + 10, fN: '3ˣ', gN: 'x² + 10', n: 6 },
  { f: (x: number) => 2 ** x, g: (x: number) => 5 * x, fN: '2ˣ', gN: '5x', n: 7 },
  { f: (x: number) => 2 ** x, g: (x: number) => x * x + 2, fN: '2ˣ', gN: 'x² + 2', n: 7 },
  { f: (x: number) => 2 ** x, g: (x: number) => 6 * x, fN: '2ˣ', gN: '6x', n: 7 },
];
export const tableOrder: Gen = (R, n) => {
  const O = pick(R, ORDERS), x0 = pick(R, [0, 0, 1]);
  const xs = xsOf(x0, 1, O.n - x0), F = xs.map(O.f), G = xs.map(O.g);
  // N: from here on f > g in every row
  let N = xs[xs.length - 1]!;
  for (let i = xs.length - 1; i >= 0 && F[i]! > G[i]!; i--) N = xs[i]!;
  const gFirst = xs.find((_, i) => G[i]! > F[i]!)!;
  return choice(R, {
    id: `tableOrder-${n}`, family: 'tableOrder', prompt: `The table compares f(${xI}) = ${O.fN} with g(${xI}) = ${O.gN}. Which statement does it support?`,
    board: `f(x) = ${O.fN.replace('ˣ', '^{x}').replace('²', '^{2}')}\\qquad g(x) = ${O.gN.replace('ˣ', '^{x}').replace('²', '^{2}')}`,
    picture: { t: { xName: 'x', xs: xs.map(String), cols: [{ name: 'f', vals: F.map(v => nH(v)), col: 'first' }, { name: 'g', vals: G.map(v => nH(v)), col: 'water' }] } },
    solution: [`g is larger at first (from x = ${gFirst}), but f multiplies by ${O.fN[0]} every row.`, `From x = ${N} on, f is larger in every row and the gap keeps growing.`],
  }, [
    { t: `From x = ${N} on f is larger, and its lead grows every row`, ok: true, say: `Right. f passes g at x = ${N}; multiplying beats adding (or squaring) in the long run.` },
    { t: `g is larger from x = ${gFirst} on, so g stays ahead`, mc: MC.oneInput, say: `g leads for a while, but at x = ${N} f passes it and pulls away.` },
    { t: 'f is larger at every x in the table', mc: MC.expGreater, say: `Look at x = ${gFirst}: g is larger there.` },
  ]);
};

// ===================== crossover-estimate =====================
interface Cross { fN: string; gN: string; fT: string; gT: string; f: (x: number) => number; g: (x: number) => number; xs: number[] }
function crossCase(R: () => number): Cross {
  const r = int(R, 0, 5);
  if (r === 0) { const k = int(R, 3, 10); return { fN: '2ˣ', gN: `${k}x`, fT: '2^{x}', gT: `${k}x`, f: x => 2 ** x, g: x => k * x, xs: xsOf(0, 1, 8) }; }
  if (r === 1) { const k = int(R, 4, 9); return { fN: '3ˣ', gN: `${k}x`, fT: '3^{x}', gT: `${k}x`, f: x => 3 ** x, g: x => k * x, xs: xsOf(0, 1, 6) }; }
  if (r === 2) return { fN: '2ˣ', gN: 'x²', fT: '2^{x}', gT: 'x^{2}', f: x => 2 ** x, g: x => x * x, xs: xsOf(0, 1, 7) };
  if (r === 3) return { fN: '2ˣ', gN: 'x³', fT: '2^{x}', gT: 'x^{3}', f: x => 2 ** x, g: x => x ** 3, xs: xsOf(0, 2, 6) };
  if (r === 4) return { fN: '1.05ˣ', gN: '100x', fT: '1.05^{x}', gT: '100x', f: x => 1.05 ** x, g: x => 100 * x, xs: xsOf(0, 50, 6) };
  const none = pick(R, [{ fN: '3ˣ', gN: 'x²', fT: '3^{x}', gT: 'x^{2}', f: (x: number) => 3 ** x, g: (x: number) => x * x }, { fN: '2ˣ', gN: 'x', fT: '2^{x}', gT: 'x', f: (x: number) => 2 ** x, g: (x: number) => x }, { fN: '4ˣ', gN: 'x³', fT: '4^{x}', gT: 'x^{3}', f: (x: number) => 4 ** x, g: (x: number) => x ** 3 }]);
  return { ...none, xs: xsOf(0, 1, 6) };
}
/** crossings read from the table: an exact tie at a row, or a sign change between two rows */
function crossings(C: Cross): { t: string; at: number }[] {
  const d = C.xs.map(x => C.f(x) - C.g(x)), out: { t: string; at: number }[] = [];
  for (let i = 0; i < d.length; i++) {
    if (Math.abs(d[i]!) < 1e-9 && i > 0) out.push({ t: `At x = ${C.xs[i]}`, at: C.xs[i]! });
    else if (i + 1 < d.length && d[i]! * d[i + 1]! < 0 && Math.abs(d[i + 1]!) > 1e-9) out.push({ t: `Between x = ${C.xs[i]} and x = ${C.xs[i + 1]}`, at: C.xs[i]! + 0.5 });
  }
  return out;
}
function crossOpts(C: Cross): Opt[] {
  const X = crossings(C), none = 'There is no crossover for x ≥ 0';
  if (!X.length) {
    return [
      { t: none, ok: true, say: `Right. f = ${C.fN} is above g = ${C.gN} in every row and pulls away.` },
      { t: `Between x = ${C.xs[1]} and x = ${C.xs[2]}`, say: `Check the rows: f is above g at both.` },
      { t: `Between x = ${C.xs[3]} and x = ${C.xs[4]}`, say: 'f is above g in every row.' },
    ];
  }
  const last = X[X.length - 1]!, first = X[0]!;
  const o: Opt[] = [{ t: last.t, ok: true, say: `Right. After that, f = ${C.fN} stays above g = ${C.gN} and pulls away.` }];
  if (X.length > 1) o.push({ t: first.t, mc: MC.firstCross, say: 'That is the FIRST crossover. Keep going: the graphs cross again later.' });
  o.push({ t: none, say: `f and g trade places in the table, so they cross.` });
  const i = C.xs.findIndex(x => x > last.at);
  if (i >= 0 && i + 1 < C.xs.length) o.push({ t: `Between x = ${C.xs[i]} and x = ${C.xs[i + 1]}`, say: 'f is above g at both of those rows.' });
  return o;
}
export const lastCrossoverTable: Gen = (R, n) => {
  const C = crossCase(R);
  const F = C.xs.map(C.f), G = C.xs.map(C.g);
  const show = (v: number) => nH(Math.abs(v - Math.round(v)) < 1e-9 ? v : Math.round(v * 10) / 10);
  const X = crossings(C);
  return choice(R, {
    id: `lastCrossoverTable-${n}`, family: 'lastCrossoverTable', prompt: `A graphing calculator made this table of f(${xI}) = ${C.fN} and g(${xI}) = ${C.gN}${C.xs[1] !== 1 ? ' (rounded)' : ''}. For ${xI} ≥ 0, where is the LAST crossover?`,
    board: `f(x) = ${C.fT}\\qquad g(x) = ${C.gT}`,
    picture: { t: { xName: 'x', xs: C.xs.map(v => nH(v)), cols: [{ name: 'f', vals: F.map(show), col: 'first' }, { name: 'g', vals: G.map(show), col: 'water' }] } },
    solution: [X.length ? `f − g changes sign ${X.map(c => c.t.toLowerCase()).join(' and ')}.` : 'f is above g in every row.', X.length ? `After the last one f stays above and pulls away: ${ans(X[X.length - 1]!.t)}.` : `So: ${ans('There is no crossover for x ≥ 0')}.`],
  }, crossOpts(C));
};
export const lastCrossoverGraph: Gen = (R, n) => {
  let C = crossCase(R);
  while (C.xs[1] === 50) C = crossCase(R);
  const xMax = C.xs[C.xs.length - 1]!;
  const yMax = Math.max(C.g(xMax), Math.min(C.f(xMax), C.g(xMax) * 2.2));
  const y = win(0, yMax, 12);
  const X = crossings(C);
  // the curves are exponentials / powers, written as FSpecs
  const spec = (nm: string): FSpec => {
    const m = nm.match(/^(\d(?:\.\d+)?)ˣ$/); if (m) return expS(1, Number(m[1]));
    if (nm === 'x²') return quadS(1, 0, 0);
    if (nm === 'x³') return { p: 'cube', a: 1, h: 0, k: 0 };
    if (nm === 'x') return linS(1, 0);
    const k = nm.match(/^(\d+)x$/); return linS(Number(k![1]), 0);
  };
  const g: GPic = { x: win(0, xMax, 12, true), y, items: [{ kind: 'fn', key: 'f', s: spec(C.fN), lo: 0, name: 'f' }, { kind: 'fn', key: 'g', s: spec(C.gN), lo: 0, col: 'water', name: 'g' }] };
  return choice(R, {
    id: `lastCrossoverGraph-${n}`, family: 'lastCrossoverGraph', prompt: `The graph shows f(${xI}) = ${C.fN} and g(${xI}) = ${C.gN} for ${xI} ≥ 0 (in this window f ends on top and keeps pulling away). Where is the LAST crossover?`,
    board: `f(x) = ${C.fT}\\qquad g(x) = ${C.gT}`, picture: { g },
    solution: [X.length ? `Values at whole numbers: f − g changes sign ${X.map(c => c.t.toLowerCase()).join(' and ')}.` : 'f is above g everywhere on x ≥ 0.', X.length ? `After the last one f stays above: ${ans(X[X.length - 1]!.t)}.` : `So: ${ans('There is no crossover for x ≥ 0')}.`],
  }, crossOpts(C));
};
