// fam1.ts: families for sub-goals 1-11 of "Quadratic functions and their graphs": tables, the vertex, the axis, zeros
// on a graph, mirror points, vertex form, the sign and size of a, transformations of y = x², and counting zeros from
// the vertex. Pure: no DOM.
import { type GItem, type GPic, type Gen, type Opt, MC, X, Y, ans, choiceItem, int, isSet, near, numItem, nz, pairItem, pick, pointItem } from './common';
import { type Std, binH, cl, coefH, coefT, qH, facH, facT, fromV, fromZ, fz, nH, nT, pH, stdH, stdT, val, vertexOf, vfH, vfT, win, zerosOf } from './qf';

// ---------- picture helpers ----------
/** a window for the curve s: the vertex, `span` either side of it, the zeros, and extra points */
export function curveWin(s: Std, xs: number[] = [], ys: number[] = [], span = 2): Pick<GPic, 'x' | 'y'> {
  const [h, k] = vertexOf(s), zs = zerosOf(s);
  return { x: win([h - span, h + span, ...zs, ...xs]), y: win([k, val(s, h - span), val(s, h + span), ...ys]) };
}
export const crv = (s: Std, key = 'f', col: 'link' | 'second' | 'water' | 'first' | 'dim' = 'link', name?: string, dash?: boolean): GItem => ({ kind: 'curve', key, s, col, name, dash });
export const pt = (key: string, x: number, y: number, col: 'first' | 'link' | 'second' | 'pick' | 'water' = 'first', name?: string): GItem => ({ kind: 'point', key, x, y, col, name });
export const ptName = (x: number, y: number) => `(${nH(x)}, ${nH(y)})`;
/** the features of a curve for the replay: vertex (named), zeros, axis */
export function features(s: Std, o: { vertex?: boolean; zeros?: boolean; axis?: boolean; yint?: boolean; nameV?: boolean } = {}): GItem[] {
  const [h, k] = vertexOf(s), out: GItem[] = [];
  if (o.axis) out.push({ kind: 'vline', key: 'axis', x: h, col: 'pick' });
  if (o.vertex) out.push(pt('V', h, k, 'link', o.nameV === false ? undefined : ptName(h, k)));
  if (o.zeros) zerosOf(s).forEach((z, i) => out.push(pt(`z${i}`, z, 0, 'second')));
  if (o.yint && !zerosOf(s).some(z => near(z, 0)) && !(near(h, 0) && o.vertex)) out.push(pt('yi', 0, val(s, 0), 'water'));
  return out;
}
const sgn = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const half = (R: () => number) => pick(R, [0.5, 1.5, 2.5, -0.5, -1.5, -2.5]);
/** a: ±1 mostly, then ±2 and ±1/2 */
const pickA = (R: () => number, wide = true) => (R() < 0.5 ? 1 : 2) * (wide && R() < 0.35 ? 0.5 : 1) * (R() < 0.5 ? -1 : 1);

// =============== 1. table to parabola ===============
export const tableY: Gen = (R, n) => {
  const s = pick(R, [1, -1]), c = int(R, -3, 3), f = (x: number) => cl(s * x * x + c);
  const halfCase = R() < 0.4;
  const x0 = halfCase ? pick(R, [0.5, 1.5, -0.5, -1.5]) : pick(R, [-3, -2, -1]);
  const y0 = f(x0);
  const rule = `${s < 0 ? '−' : ''}${X}²${c ? ` ${c > 0 ? '+' : '−'} ${Math.abs(c)}` : ''}`, ruleT = `${s < 0 ? '-' : ''}x^2${c ? ` ${c > 0 ? '+' : '-'} ${Math.abs(c)}` : ''}`;
  const xs = [-3, -2, -1, 0, 1, 2, 3].filter(x => !near(x, x0));
  const ys = [...xs.map(f), y0];
  const show = xs.map((x, i) => pt(`t${i}`, x, f(x), 'first'));
  // a straight segment between the two integer neighbours (the slip a half-integer catches)
  const lo = Math.floor(x0), hi = Math.ceil(x0), seg = cl((f(lo) + f(hi)) / 2);
  return numItem({
    id: `tableY-${n}`, family: 'tableY',
    prompt: halfCase
      ? `The dots are the table of ${Y} = ${rule} for whole-number ${X}. What is ${Y} at ${X} = ${nH(x0)}, between two of them?`
      : `The dots are the table of ${Y} = ${rule}. One entry is missing: what is ${Y} when ${X} = ${nH(x0)}?`,
    board: `y = ${ruleT}, \\quad x = ${nT(x0)}`,
    picture: { g: { x: [-4, 4, 1], y: win(ys), show, reveal: [crv([s, 0, c]), pt('ans', x0, y0, 'link', ptName(x0, y0))] } },
    solution: [
      `Square first, then apply the sign in the rule: (${nH(x0)})² = ${nH(cl(x0 * x0))}.`,
      `${Y} = ${s < 0 ? '−' : ''}${nH(cl(x0 * x0))}${c ? ` ${c > 0 ? '+' : '−'} ${Math.abs(c)}` : ''} = ${ans(nH(y0))}.`,
      ...(halfCase ? [`That is not halfway between ${nH(f(lo))} and ${nH(f(hi))}: the parabola bends, it is not a straight segment.`] : []),
    ],
  }, y0, v => {
    if (near(v, y0)) return { ok: true, say: `Yes: ${nH(y0)}. The dot sits on the smooth curve.` };
    if (halfCase && near(v, seg)) return { ok: false, mc: MC.straight, say: `${nH(seg)} is halfway along a straight segment. The curve bends: square ${nH(x0)} itself.` };
    if (!halfCase && s > 0 && near(v, cl(-x0 * x0 + c))) return { ok: false, mc: MC.evenNeg, say: `A negative number squared is positive: (${nH(x0)})² = ${nH(cl(x0 * x0))}.` };
    if (!halfCase && s < 0 && near(v, cl(x0 * x0 + c))) return { ok: false, mc: MC.negPow, say: `−${X}² means −(${X}²): square first, then make it negative.` };
    return { ok: false, say: `Square ${nH(x0)}, then follow the rule.` };
  });
};

export const linVsQuad: Gen = (R, n) => {
  const quad = R() < 0.65, c = int(R, -3, 3), s = pick(R, [1, -1]), m = nz(R, -3, 3);
  const f = (x: number) => (quad ? s * x * x + c : m * x + c);
  const xs = [-2, -1, 0, 1, 2], ys = xs.map(f);
  const cT = (v: number) => (v ? ` ${v > 0 ? '+' : '−'} ${Math.abs(v)}` : '');
  const quadRule = `${Y} = ${s < 0 ? '−' : ''}${X}²${cT(c)}`, flipRule = `${Y} = ${s < 0 ? '' : '−'}${X}²${cT(c)}`;
  const linRule = quad ? `${Y} = ${coefH(s * 2)}${X}${cT(c)}` : `${Y} = ${coefH(m)}${X}${cT(c)}`;
  const otherQuad = quad ? flipRule : `${Y} = ${coefH(m)}${X}²${cT(c)}`;
  const table = `<table class="tab"><tr><td>${X}</td>${xs.map(x => `<td>${nH(x)}</td>`).join('')}</tr><tr><td>${Y}</td>${ys.map(y => `<td>${nH(y)}</td>`).join('')}</tr></table>`;
  const opts: Opt[] = quad ? [
    { t: quadRule, ok: true, say: `Yes: the outputs come back the same on both sides of ${X} = 0. That is a square.`, key: 'q' },
    { t: linRule, say: `A line changes by the same amount every step. These outputs go ${s > 0 ? 'down and then up' : 'up and then down'}.`, key: 'l' },
    { t: flipRule, mc: s > 0 ? MC.negPow : undefined, say: `Check ${X} = 2: the table says ${nH(f(2))}.`, key: 'f' },
  ] : [
    { t: linRule, ok: true, say: `Yes: every step of 1 in ${X} changes ${Y} by ${nH(m)}. That is a line.`, key: 'l' },
    { t: otherQuad, say: `A square gives the same output at ${X} = −1 and ${X} = 1. Here they differ.`, key: 'q' },
    { t: `${Y} = ${coefH(-m)}${X}${cT(c)}`, say: `Check ${X} = 1: the table says ${nH(f(1))}.`, key: 'n' },
  ];
  return choiceItem(R, {
    id: `linVsQuad-${n}`, family: 'linVsQuad', prompt: `Which rule makes this table? ${table}`,
    board: `\\text{which rule?}`,
    picture: { g: { x: [-3, 3, 1], y: win(ys), show: xs.map((x, i) => pt(`t${i}`, x, f(x), 'first')), reveal: [crv(quad ? [s, 0, c] : [0, m, c])] } },
    solution: quad
      ? [`The outputs ${ys.map(nH).join(', ')} are the same at ${X} = −1 and 1, and at −2 and 2: a parabola, not a line.`, `At ${X} = 2: ${s < 0 ? '−' : ''}2² ${c >= 0 ? '+' : '−'} ${Math.abs(c)} = ${nH(f(2))}. ✓`]
      : [`Every step of 1 in ${X} adds ${nH(m)} to ${Y}: a constant rate, so a line.`, `At ${X} = 0, ${Y} = ${nH(c)}.`],
  }, opts);
};

// =============== 2. the vertex ===============
function vertexCase(R: () => number): { a: number; h: number; k: number } {
  const where = pick(R, ['origin', 'yaxis', 'xaxis', 'off', 'off', 'off']);
  const a = pickA(R);
  let h = where === 'origin' || where === 'yaxis' ? 0 : nz(R, -5, 5), k = where === 'origin' || where === 'xaxis' ? 0 : nz(R, -6, 6);
  if (where === 'off' && R() < 0.25) h = half(R);
  if (where === 'yaxis' && k === 0) k = 3;
  return { a, h, k };
}
export const vertexRead: Gen = (R, n) => {
  const { a, h, k } = vertexCase(R), s = fromV(a, h, k), y0 = val(s, 0);
  return pointItem({
    id: `vertexRead-${n}`, family: 'vertexRead', prompt: `This is the graph of <i>f</i>(${X}) = ${stdH(s)}. Read its vertex from the graph.`,
    board: `f(x) = ${stdT(s)}`,
    picture: { g: { ...curveWin(s), show: [crv(s)], reveal: features(s, { vertex: true, axis: true }) } },
    solution: [`The vertex is the turning point: the ${a > 0 ? 'lowest' : 'highest'} point of the curve.`, `It sits at ${X} = ${ans(nH(h))}, ${Y} = ${ans(nH(k))}.`],
  }, h, k, (x, y) => {
    if (near(x, h) && near(y, k)) return { ok: true, say: `Yes: (${nH(h)}, ${nH(k)}), where the curve turns.` };
    if (!near(h, 0) && near(x, 0) && near(y, y0)) return { ok: false, mc: MC.yAxis, say: `That is where the curve crosses the ${Y}-axis. The vertex is where it turns, and this one turns at ${X} = ${nH(h)}... look again.` };
    if (near(x, k) && near(y, h)) return { ok: false, say: `The ${X}-coordinate comes first: across, then up or down.` };
    return { ok: false, say: `Find the turning point, then read across to the ${X}-axis and over to the ${Y}-axis.` };
  });
};

export const extremeVal: Gen = (R, n, sg) => {
  const eq = sg === 'sign-of-a' || (sg !== 'vertex-extremum' && R() < 0.5);
  let { a, h, k } = vertexCase(R);
  if (eq && R() < 0.5 && sgn(k) === sgn(a)) k = -k;          // a negative k with a positive a (and back)
  if (near(h, k)) h = h + 1;
  const s = fromV(a, h, k), mm = a > 0 ? 'minimum' : 'maximum', other = a > 0 ? 'maximum' : 'minimum';
  const opts: Opt[] = [
    { t: `a ${mm} value of ${nH(k)}`, ok: true, say: `Yes: it opens ${a > 0 ? 'up' : 'down'}, so ${nH(k)} is the ${a > 0 ? 'least' : 'greatest'} ${Y}.` },
    { t: `a ${other} value of ${nH(k)}`, mc: a < 0 ? MC.signA : undefined, say: `a = ${nH(a)} is ${a > 0 ? 'positive: it opens up' : 'negative: it opens down'}, so the vertex is the ${a > 0 ? 'lowest' : 'highest'} point.` },
    { t: `a ${mm} value of ${nH(h)}`, mc: MC.wrongCoord, say: `${nH(h)} is the input where it happens. The value is the output, ${Y} = ${nH(k)}.` },
    { t: `a ${other} value of ${nH(h)}`, mc: MC.wrongCoord, say: `${nH(h)} is the input. And check which way it opens.` },
  ];
  return choiceItem(R, {
    id: `extremeVal-${n}`, family: 'extremeVal',
    prompt: eq ? `What does <i>f</i>(${X}) = ${vfH(a, h, k)} have?` : `The marked point is the vertex, (${nH(h)}, ${nH(k)}). What does this function have?`,
    board: eq ? `f(x) = ${vfT(a, h, k)}` : `\\text{vertex } (${nT(h)}, ${nT(k)})`,
    picture: { g: eq ? { ...curveWin(s), show: [], reveal: [crv(s), ...features(s, { vertex: true })], slate: true } : { ...curveWin(s), show: [crv(s), pt('V', h, k, 'link')], reveal: [{ kind: 'hline', key: 'kl', y: k, col: 'pick' }] } },
    solution: [`a = ${nH(a)} is ${a > 0 ? 'positive, so the parabola opens up' : 'negative, so the parabola opens down'}.`, `The vertex (${nH(h)}, ${nH(k)}) is the ${a > 0 ? 'lowest' : 'highest'} point: the ${mm} value is the output ${nH(k)}.`],
  }, opts);
};

// =============== 3. the axis of symmetry ===============
export const axisRead: Gen = (R, n, sg) => {
  const eq = sg === 'vertex-form-read';
  let { a, h, k } = vertexCase(R);
  if (!eq && R() < 0.3) h = half(R);
  if (h === 0 && R() < 0.7) h = nz(R, -4, 4);
  const s = fromV(a, h, k);
  const opts: Opt[] = [
    { t: `${X} = ${nH(h)}`, ok: true, key: `x=${h}`, say: `Yes: the vertical line through the vertex, ${X} = ${nH(h)}.` },
    { t: `${Y} = ${nH(h)}`, mc: MC.axisAsPoint, key: `y=${h}`, say: `The axis is vertical: every point on it has ${X} = ${nH(h)}. That is the line ${X} = ${nH(h)}.` },
    { t: `(${nH(h)}, ${nH(k)})`, mc: MC.axisAsPoint, key: 'pt', say: `That is the vertex, a point. The axis is the whole vertical line through it.` },
    eq ? { t: `${X} = ${nH(-h)}`, mc: MC.wrongSign, key: `x=${-h}`, say: `(${binH(h)})² is 0 when ${X} = ${nH(h)}: the sign flips.` }
      : { t: `${X} = ${nH(k)}`, key: `x=${k}`, say: `${nH(k)} is the vertex's height. The axis goes through its ${X}-coordinate.` },
    { t: `${X} = 0`, mc: MC.yAxis, key: 'x=0', say: `Not every parabola is centred on the ${Y}-axis. This one turns at ${X} = ${nH(h)}.` },
  ];
  return choiceItem(R, {
    id: `axisRead-${n}`, family: 'axisRead',
    prompt: eq ? `What is the axis of symmetry of ${Y} = ${vfH(a, h, k)}?` : `This is the graph of ${Y} = ${stdH(s)}. What is its axis of symmetry?`,
    board: eq ? `y = ${vfT(a, h, k)}` : `y = ${stdT(s)}`,
    picture: { g: eq ? { ...curveWin(s), show: [], reveal: [crv(s), ...features(s, { vertex: true, axis: true })], slate: true } : { ...curveWin(s), show: [crv(s)], reveal: features(s, { vertex: true, axis: true }) } },
    solution: eq
      ? [`(${binH(h)})² is 0 at ${X} = ${nH(h)}: the vertex is (${nH(h)}, ${nH(k)}).`, `The mirror line is the vertical line through it: ${ans(`${X} = ${nH(h)}`)}.`]
      : [`The curve turns at the vertex (${nH(h)}, ${nH(k)}); the two halves are mirror images across the vertical line through it.`, `That line is ${ans(`${X} = ${nH(h)}`)}.`],
  }, opts);
};

export const axisTable: Gen = (R, n) => {
  const h = R() < 0.5 ? half(R) : nz(R, -3, 3), a = pick(R, [1, -1, 2]), k = int(R, -4, 4), s = fromV(a, h, k);
  const x0 = Math.floor(h) - 2, xs = [0, 1, 2, 3, 4].map(i => x0 + i), ys = xs.map(x => val(s, x));
  const table = `<table class="tab"><tr><td>${X}</td>${xs.map(x => `<td>${nH(x)}</td>`).join('')}</tr><tr><td>${Y}</td>${ys.map(y => `<td>${nH(y)}</td>`).join('')}</tr></table>`;
  const xa = x0 + 1, xb = cl(2 * h - xa);
  const ext = ys.reduce((b, y, i) => ((a > 0 ? y < ys[b]! : y > ys[b]!) ? i : b), 0);
  return numItem({
    id: `axisTable-${n}`, family: 'axisTable', prompt: `A quadratic gives this table. The axis of symmetry is ${X} = ? ${table}`,
    board: `\\text{axis: } x = \\,?`,
    picture: { g: { x: win([...xs, h]), y: win(ys), show: xs.map((x, i) => pt(`t${i}`, x, ys[i]!, 'first')), reveal: [crv(s), { kind: 'vline', key: 'axis', x: h, col: 'pick' }] } },
    solution: [`Equal outputs come in mirror pairs: ${Y} = ${nH(val(s, xa))} at ${X} = ${nH(xa)} and at ${X} = ${nH(xb)}.`, `The axis is halfway between them: (${nH(xa)} + ${pH(xb)}) ÷ 2 = ${ans(nH(h))}.`],
  }, h, v => {
    if (near(v, h)) return { ok: true, say: `Yes: ${X} = ${nH(h)}, halfway between every pair of equal outputs.` };
    if (near(v, xs[ext]!) && !Number.isInteger(h)) return { ok: false, say: `${nH(xs[ext]!)} has the ${a > 0 ? 'smallest' : 'largest'} output in the table, but its partner has the same output. The axis is halfway between them.` };
    return { ok: false, say: `Find two inputs with the same output. The axis is halfway between them.` };
  });
};

// =============== 4. zeros from a graph ===============
export const zeroCount: Gen = (R, n) => {
  const cnt = pick(R, [2, 2, 1, 0, 0]), a = pickA(R, false);
  const h = R() < 0.3 ? 0 : nz(R, -4, 4);
  const k = cnt === 1 ? 0 : (cnt === 2 ? -sgn(a) : sgn(a)) * pick(R, [1, 2, 3, 4]) * Math.abs(a);
  const s = fromV(a, h, k);
  const opts: Opt[] = [
    { t: 'two zeros', ok: cnt === 2, mc: cnt < 2 ? MC.nZeros : undefined, say: cnt === 2 ? 'Yes: it crosses the x-axis twice.' : `Count where the curve meets the ${X}-axis: ${cnt === 1 ? 'it only touches it once, at the vertex' : 'it never does'}. A quadratic does not always have two.` },
    { t: 'one zero', ok: cnt === 1, say: cnt === 1 ? 'Yes: the vertex sits on the x-axis, so it touches once.' : `Count the crossings again.` },
    { t: 'no real zeros', ok: cnt === 0, say: cnt === 0 ? `Yes: the whole curve is ${a > 0 ? 'above' : 'below'} the ${X}-axis.` : `It does meet the ${X}-axis. Count the points.` },
  ];
  return choiceItem(R, {
    id: `zeroCount-${n}`, family: 'zeroCount', prompt: `This is the graph of <i>f</i>(${X}) = ${stdH(s)}. How many real zeros does it have?`, board: `f(x) = ${stdT(s)}`,
    picture: { g: { ...curveWin(s, [], [0]), show: [crv(s)], reveal: zerosOf(s).map((z, i) => pt(`z${i}`, z, 0, 'second', nH(z))) } },
    solution: [`A zero is an input where f(${X}) = 0: where the graph meets the ${X}-axis.`, cnt === 2 ? 'It crosses twice.' : cnt === 1 ? 'It touches once, at the vertex.' : `It stays ${a > 0 ? 'above' : 'below'} the axis.`],
  }, opts, true);
};

export const zerosRead: Gen = (R, n) => {
  let p = nz(R, -6, 5), q = p + int(R, 2, 7);
  if (R() < 0.2) p = 0;
  if (R() < 0.25) { p += 0.5; q += 0.5; }
  if (near(p, q)) q += 2;
  const a = pick(R, [1, -1, 0.5, -0.5, 2, -2]), s = fromZ(a, p, q), c = val(s, 0);
  return pairItem({
    id: `zerosRead-${n}`, family: 'zerosRead', prompt: `This is the graph of <i>f</i>(${X}) = ${stdH(s)}. Read its zeros from the graph. (Either order.)`,
    board: `f(x) = ${stdT(s)}`,
    picture: { g: { ...curveWin(s, [0], [0], 1), show: [crv(s)], reveal: [pt('z0', p, 0, 'second', `(${nH(p)}, 0)`), pt('z1', q, 0, 'second', `(${nH(q)}, 0)`)] } },
    solution: [`The zeros are the inputs where the graph meets the ${X}-axis (the output is 0).`, `The x-intercepts are (${nH(p)}, 0) and (${nH(q)}, 0), so the zeros are ${ans(nH(p))} and ${ans(nH(q))}.`],
  }, p, q, `${X} =`, ` or ${X} =`, '', (u, w) => {
    if (isSet(u, w, p, q)) return { ok: true, say: `Yes: ${nH(p)} and ${nH(q)}. The points are (${nH(p)}, 0) and (${nH(q)}, 0); the zeros are just the inputs.` };
    if (!near(c, 0) && (near(u, c) || near(w, c)) && !near(c, p) && !near(c, q)) return { ok: false, mc: MC.interceptSwap, say: `${nH(c)} is where the curve crosses the ${Y}-axis. Zeros are on the ${X}-axis.` };
    return { ok: false, say: `Find where the curve meets the ${X}-axis, and read the ${X}-values there.` };
  });
};

// =============== 5. mirror points ===============
export const mirrorPt: Gen = (R, n, sg) => {
  const proof = sg === 'justify-symmetry';
  const a = pickA(R), h = nz(R, -3, 3) + (R() < 0.25 ? 0.5 : 0), k = int(R, -4, 4), s = fromV(a, h, k);
  const yint = !proof && R() < 0.4;
  const x1 = yint ? 0 : cl(h + pick(R, [-3, -2, -1, 1, 2, 3])), y1 = val(s, x1), x2 = cl(2 * h - x1);
  const show: GItem[] = [crv(s), { kind: 'vline', key: 'axis', x: h, col: 'pick' }, pt('P', x1, y1, 'first', ptName(x1, y1))];
  return pointItem({
    id: `mirrorPt-${n}`, family: 'mirrorPt',
    prompt: proof
      ? `<i>f</i>(${X}) = ${vfH(a, h, k)} is symmetric about ${X} = ${nH(h)}. It passes through (${nH(x1)}, ${nH(y1)}). Which other point has the same output?`
      : `The axis of symmetry is ${X} = ${nH(h)}. The parabola passes through ${yint ? `its ${Y}-intercept ` : ''}(${nH(x1)}, ${nH(y1)}). What is the mirror point?`,
    board: proof ? `f(x) = ${vfT(a, h, k)}` : `x = ${nT(h)}, \\quad (${nT(x1)}, ${nT(y1)})`,
    picture: { g: { ...curveWin(s, [x1, x2], [y1]), show, reveal: [pt('M', x2, y1, 'link', ptName(x2, y1)), { kind: 'seg', key: 'm', a: [x1, y1], b: [x2, y1], col: 'pick', dash: true }] } },
    solution: [`(${nH(x1)}, ${nH(y1)}) is ${nH(Math.abs(cl(x1 - h)))} ${x1 < h ? 'left' : 'right'} of the axis ${X} = ${nH(h)}.`, `Its mirror is as far on the other side, at the same height: ${X} = ${nH(h)} ${x1 < h ? '+' : '−'} ${nH(Math.abs(cl(x1 - h)))} = ${nH(x2)}.`, `The mirror point is (${ans(nH(x2))}, ${ans(nH(y1))}).`],
  }, x2, y1, (x, y) => {
    if (near(x, x2) && near(y, y1)) return { ok: true, say: `Yes: (${nH(x2)}, ${nH(y1)}), the same distance from the axis on the other side, at the same height.` };
    if (near(x, -x1) && near(y, y1) && !near(-x1, x2)) return { ok: false, mc: MC.yAxis, say: `That mirrors it across the ${Y}-axis. This parabola's mirror line is ${X} = ${nH(h)}.` };
    if (near(x, x2)) return { ok: false, say: `Mirror points have the same height: ${Y} stays ${nH(y1)}.` };
    return { ok: false, say: `Count the distance from (${nH(x1)}, ${nH(y1)}) to the axis, then go as far on the other side.` };
  });
};

export const axisMid: Gen = (R, n, sg) => {
  const facForm = sg === 'factored-form-vertex';
  const kind = pick(R, ['opp', 'same', 'half']);
  let p: number, q: number;
  if (kind === 'opp') { p = -int(R, 1, 6); q = int(R, 1, 8); }
  else if (kind === 'same') { const sg2 = pick(R, [1, -1]); p = sg2 * int(R, 1, 3); q = p + sg2 * int(R, 2, 6); }
  else { p = nz(R, -5, 4); q = p + pick(R, [1, 3, 5, 7]); }
  if (p > q) [p, q] = [q, p];
  const m = cl((p + q) / 2), hd = cl((q - p) / 2), a = pick(R, [1, -1, 2, -2, 0.5]), s = fromZ(a, p, q);
  return numItem({
    id: `axisMid-${n}`, family: 'axisMid',
    prompt: facForm ? `<i>f</i>(${X}) = ${facH(fz(a, p, q))}. Its zeros are ${nH(p)} and ${nH(q)}. The axis of symmetry is ${X} = ?`
      : `A parabola has zeros ${nH(p)} and ${nH(q)}. Its axis of symmetry is ${X} = ?`,
    board: facForm ? `f(x) = ${facT(fz(a, p, q))}` :`\\text{zeros } ${nT(p)} \\text{ and } ${nT(q)}`,
    picture: { g: { ...curveWin(s, [p, q], [0], 1), show: [pt('z0', p, 0, 'second', nH(p)), pt('z1', q, 0, 'second', nH(q))], reveal: [crv(s), { kind: 'vline', key: 'axis', x: m, col: 'pick' }] } },
    solution: [`Both zeros have output 0, so they are mirror points: the axis is exactly halfway between them.`, `Halfway: (${nH(p)} + ${pH(q)}) ÷ 2 = ${nH(cl(p + q))} ÷ 2 = ${ans(nH(m))}.`],
  }, m, v => {
    if (near(v, m)) return { ok: true, say: `Yes: ${X} = ${nH(m)}, the midpoint of the zeros.` };
    if (near(v, hd) || near(v, -hd)) return { ok: false, mc: MC.halfDiff, say: `${nH(hd)} is half the distance between them. Start at ${nH(p)} and go that far: add the zeros and halve.` };
    if (near(v, -m)) return { ok: false, mc: facForm ? MC.wrongSign : undefined, say: `The zeros are ${nH(p)} and ${nH(q)}: add them as they are, then halve.` };
    return { ok: false, say: `Add the two zeros and divide by 2.` };
  });
};

// =============== 6. vertex form ===============
export const vfVertex: Gen = (R, n) => {
  const a = R() < 0.5 ? 1 : pickA(R);
  let h = pick(R, [nz(R, -6, 6), nz(R, -6, 6), 0]), k = pick(R, [nz(R, -8, 8), nz(R, -8, 8), 0]);
  if (R() < 0.2) h = half(R);
  if (R() < 0.15) k = half(R);
  if (h === 0 && k === 0) k = 2;
  const s = fromV(a, h, k);
  return pointItem({
    id: `vfVertex-${n}`, family: 'vfVertex', prompt: `What is the vertex of <i>f</i>(${X}) = ${vfH(a, h, k)}?`, board: `f(x) = ${vfT(a, h, k)}`,
    picture: { g: { ...curveWin(s), show: [], reveal: [crv(s), ...features(s, { vertex: true })], slate: true } },
    solution: [
      h === 0 ? `The square is ${X}²: it is 0 at ${X} = 0.` : `The square (${binH(h)})² is 0 when ${binH(h)} = 0, at ${X} = ${nH(h)}${h < 0 ? ` (${binH(h)} is ${X} − (${nH(h)}))` : ''}.`,
      `There ${Y} = ${nH(k)}, the turning value. The vertex is (${ans(nH(h))}, ${ans(nH(k))}).`,
    ],
  }, h, k, (x, y) => {
    if (near(x, h) && near(y, k)) return { ok: true, say: `Yes: (${nH(h)}, ${nH(k)}).` };
    if (!near(h, 0) && near(x, -h) && near(y, k)) return { ok: false, mc: MC.wrongSign, say: `The square is 0 when ${binH(h)} = 0, so ${X} = ${nH(h)}: the sign flips.` };
    if (near(x, k) && near(y, h)) return { ok: false, say: `The input that zeroes the square comes first, then the output.` };
    return { ok: false, say: `Which ${X} makes (${binH(h)})² zero? What is ${Y} there?` };
  });
};

// =============== 7. the sign of a ===============
export const openDir: Gen = (R, n) => {
  const a = pickA(R), h = int(R, -4, 4);
  let k = nz(R, -6, 6);
  if (R() < 0.7 && sgn(k) === sgn(a)) k = -k;                    // most items: k's sign disagrees with a's
  const s = fromV(a, h, k), up = a > 0, kUp = k > 0;
  const opts: Opt[] = [
    { t: `It opens ${up ? 'up' : 'down'}: the vertex is a ${up ? 'minimum' : 'maximum'}.`, ok: true, say: `Yes: a = ${nH(a)} is ${up ? 'positive' : 'negative'}, and a decides the direction.` },
    { t: `It opens ${up ? 'down' : 'up'}: the vertex is a ${up ? 'maximum' : 'minimum'}.`, mc: kUp !== up ? MC.openK : undefined, say: kUp !== up ? `k = ${nH(k)} only says where the vertex is. The direction comes from a = ${nH(a)}.` : `a = ${nH(a)} is ${up ? 'positive' : 'negative'}: look at its sign.` },
    { t: `It opens ${up ? 'up' : 'down'}: the vertex is a ${up ? 'maximum' : 'minimum'}.`, say: `A parabola that opens ${up ? 'up' : 'down'} has its ${up ? 'lowest' : 'highest'} point at the vertex.` },
  ];
  return choiceItem(R, {
    id: `openDir-${n}`, family: 'openDir', prompt: `Which way does <i>f</i>(${X}) = ${vfH(a, h, k)} open, and what kind of point is its vertex?`, board: `f(x) = ${vfT(a, h, k)}`,
    picture: { g: { ...curveWin(s), show: [], reveal: [crv(s), ...features(s, { vertex: true })], slate: true } },
    solution: [`The sign of a decides: a = ${nH(a)} is ${up ? 'positive' : 'negative'}, so a(${binH(h)})² is never ${up ? 'negative' : 'positive'}.`, `So it opens ${up ? 'up' : 'down'} and the vertex is the ${up ? 'lowest' : 'highest'} point, whatever the sign of k = ${nH(k)}.`],
  }, opts);
};

// =============== 8. the size of a ===============
export const offsetY: Gen = (R, n) => {
  const a = pick(R, [2, 3, -2, -3, 0.5, -0.5, 1, -1]), h = int(R, -3, 3), k = int(R, -4, 4), d = pick(R, [2, -2, 2, 1, -1]);
  const s = fromV(a, h, k), x1 = h + d, y1 = val(s, x1), lin = cl(k + a * d);
  return numItem({
    id: `offsetY-${n}`, family: 'offsetY',
    prompt: `<i>f</i>(${X}) = ${vfH(a, h, k)} has its vertex at (${nH(h)}, ${nH(k)}). What is <i>f</i>(${nH(x1)}), ${Math.abs(d)} unit${Math.abs(d) > 1 ? 's' : ''} ${d > 0 ? 'right' : 'left'} of the vertex?`,
    board: `f(x) = ${vfT(a, h, k)}, \\quad f(${nT(x1)}) = \\,?`,
    picture: { g: { ...curveWin(s, [x1], [y1]), show: [pt('V', h, k, 'first', 'vertex'), { kind: 'seg', key: 'run', a: [h, k], b: [x1, k], col: 'pick', arrow: true }], reveal: [crv(s), pt('P', x1, y1, 'link', ptName(x1, y1))] } },
    solution: [`${Math.abs(d)} from the vertex, the square is ${pH(d)}² = ${d * d}.`, `So the point is ${nH(a)} × ${d * d} = ${nH(cl(a * d * d))} ${a > 0 ? 'above' : 'below'} the vertex: <i>f</i>(${nH(x1)}) = ${nH(k)} ${a * d * d > 0 ? '+' : '−'} ${nH(Math.abs(cl(a * d * d)))} = ${ans(nH(y1))}.`],
  }, y1, v => {
    if (near(v, y1)) return { ok: true, say: `Yes: ${nH(y1)}. ${Math.abs(d)} across means a times ${d * d} up or down.` };
    if (near(v, lin)) return { ok: false, mc: MC.slopeA, say: `a is not a slope. ${Math.abs(d)} across from the vertex, the curve moves a × ${Math.abs(d)}², not a × ${Math.abs(d)}.` };
    if (near(v, cl(k + d * d))) return { ok: false, say: `Multiply the ${d * d} by a = ${nH(a)}.` };
    return { ok: false, say: `Put ${X} = ${nH(x1)} in: square (${nH(x1)} − ${pH(h)}) first, multiply by a, then add k.` };
  });
};

export const narrowest: Gen = (R, n) => {
  const pool = [0.5, 1, 2, 3, 4, 1 / 3, 0.25];
  const mags: number[] = [];
  while (mags.length < 3) { const m = pick(R, pool); if (!mags.includes(m)) mags.push(m); }
  const as = mags.map(m => m * (R() < 0.4 ? -1 : 1)), big = Math.max(...mags), small = Math.min(...mags);
  const askWide = R() < 0.35;
  const target = askWide ? small : big;
  const cols = ['link', 'water', 'first'] as const;
  const opts: Opt[] = as.map(a => {
    const m = Math.abs(a);
    return {
      t: `${Y} = ${coefH(a)}${X}²`, ok: m === target,
      mc: askWide ? (m === big ? MC.widerA : undefined) : (m === small ? MC.widerA : undefined),
      say: m === target ? `Yes: its |a| is the ${askWide ? 'smallest' : 'largest'}, so it ${askWide ? 'climbs slowest' : 'climbs fastest'}.` : `One step from the vertex, ${Y} = a${X}² is |a| away from it. The ${askWide ? 'widest climbs slowest: the smallest' : 'narrowest climbs fastest: the largest'} |a|.`,
    };
  });
  return choiceItem(R, {
    id: `narrowest-${n}`, family: 'narrowest', prompt: `Which of these parabolas is the ${askWide ? 'widest' : 'narrowest'}? (Same axes, same scale.)`, board: as.map(a => `y = ${coefT(a)}x^2`).join(',\\; '),
    picture: { g: { x: [-4, 4, 1], y: [-8, 8, 2], show: [], reveal: as.map((a, i) => crv([a, 0, 0], `c${i}`, cols[i], `y = ${coefH(a)}x²`)), slate: true } },
    solution: [`One unit from the vertex, ${Y} = a${X}² is a units above or below it; two units away, 4a.`, `The bigger |a|, the faster it climbs, so the narrower it is. ${askWide ? 'The widest has the smallest' : 'The narrowest has the largest'} |a|.`],
  }, opts);
};

// =============== 9. transformations of the parent ===============
export const transformName: Gen = (R, n) => {
  const kind = pick(R, ['h', 'v', 'a']);
  const P: Std = [1, 0, 0];
  let g: Std, gT: string, gH: string, opts: Opt[], why: string;
  if (kind === 'h') {
    const c = pick(R, [3, -2, 4, -3, 1, -1, 2, -4]);
    g = fromV(1, c, 0); gT = `f(${c > 0 ? `x - ${c}` : `x + ${-c}`})`; gH = `<i>f</i>(${binH(c)})`;
    const dir = c > 0 ? 'right' : 'left', odir = c > 0 ? 'left' : 'right';
    opts = [
      { t: `a shift ${dir} ${Math.abs(c)}`, ok: true, say: `Yes: the input has to be ${Math.abs(c)} ${c > 0 ? 'bigger' : 'smaller'} to give the same output, so every point moves ${dir}.` },
      { t: `a shift ${odir} ${Math.abs(c)}`, mc: MC.wrongSign, say: `f(${binH(c)}) is 0 where ${binH(c)} = 0, at ${X} = ${c}: the vertex moves ${dir}.` },
      { t: `a shift ${c > 0 ? 'down' : 'up'} ${Math.abs(c)}`, mc: MC.inOut, say: `The change is inside the brackets, on the input: it moves the graph sideways, not up or down.` },
    ];
    why = `Inside the brackets, ${binH(c)}: the vertex moves to where ${binH(c)} = 0, ${X} = ${c}. That is a shift ${dir} ${Math.abs(c)}.`;
  } else if (kind === 'v') {
    const d = pick(R, [4, -3, 2, -2, 5, -5]);
    g = [1, 0, d]; gT = `f(x) ${d > 0 ? '+' : '-'} ${Math.abs(d)}`; gH = `<i>f</i>(${X}) ${d > 0 ? '+' : '−'} ${Math.abs(d)}`;
    const dir = d > 0 ? 'up' : 'down';
    opts = [
      { t: `a shift ${dir} ${Math.abs(d)}`, ok: true, say: `Yes: every output gets ${d > 0 ? '+' : '−'}${Math.abs(d)}, so every point moves ${dir}.` },
      { t: `a shift ${d > 0 ? 'down' : 'up'} ${Math.abs(d)}`, say: `${d > 0 ? 'Adding' : 'Subtracting'} ${Math.abs(d)} to every output moves each point ${dir}.` },
      { t: `a shift ${d > 0 ? 'left' : 'right'} ${Math.abs(d)}`, mc: MC.inOut, say: `The change is outside, on the output: it moves the graph up or down.` },
    ];
    why = `Outside the function: every output changes by ${d > 0 ? '+' : '−'}${Math.abs(d)}. That is a shift ${dir} ${Math.abs(d)}.`;
  } else {
    const a = pick(R, [2, 0.5, -1, -3, 3, -2]);
    g = [a, 0, 0]; gT = `${a === -1 ? '-' : a === 0.5 ? '\\frac{1}{2}' : a}f(x)`; gH = `${coefH(a)}<i>f</i>(${X})`;
    const right = a === -1 ? 'a reflection across the x-axis' : a < 0 ? `a reflection across the x-axis and a vertical stretch by ${-a}` : a > 1 ? `a vertical stretch by ${a}` : `a vertical compression by 1/2`;
    opts = [
      { t: right, ok: true, say: `Yes: every output is multiplied by ${nH(a)}${a < 0 ? ', which flips it' : ''}.` },
      { t: `a shift ${a < 0 ? 'down' : 'up'} ${Math.abs(a) === 0.5 ? '1/2' : Math.abs(a)}`, mc: a < 0 ? MC.negShift : undefined, say: `${nH(a)} multiplies the outputs; it does not add. The vertex (0, 0) stays where it is.` },
      { t: a < 0 ? (a === -1 ? 'a reflection across the y-axis' : `a vertical stretch by ${-a}`) : a > 1 ? `a vertical compression by 1/${a}` : `a vertical stretch by 2`, mc: a === -1 ? MC.reflSwap : undefined, say: a === -1 ? `−f(${X}) flips the outputs: up becomes down. That is across the x-axis.` : a < 0 ? `A negative factor also flips the graph upside down.` : `Multiplying outputs by ${nH(a)} makes them ${a > 1 ? 'bigger: a stretch' : 'smaller: a compression'}.` },
    ];
    why = `Every output is multiplied by ${nH(a)}: (${X}, ${Y}) → (${X}, ${nH(a)}${Y}).${a < 0 ? ' A negative factor flips the graph across the x-axis.' : ''}`;
  }
  return choiceItem(R, {
    id: `transformName-${n}`, family: 'transformName', prompt: `<i>f</i>(${X}) = ${X}². What does <i>g</i>(${X}) = ${gH} do to the graph of <i>f</i>?`, board: `g(x) = ${gT}`,
    picture: { g: { x: [-6, 6, 1], y: [-8, 10, 2], show: [crv(P, 'p', 'dim', 'f', true)], reveal: [crv(g, 'g', 'link', 'g')] } },
    solution: [why],
  }, opts);
};

export const mapPoint: Gen = (R, n) => {
  const a = pick(R, [1, 2, -1, 0.5, -2]), c = nz(R, -3, 3), d = nz(R, -4, 4), x0 = pick(R, [-2, -1, 1, 2]);
  const y0 = x0 * x0, X1 = x0 + c, Y1 = cl(a * y0 + d), g = fromV(a, c, d);
  const gH = `${coefH(a)}<i>f</i>(${binH(c)}) ${d > 0 ? '+' : '−'} ${Math.abs(d)}`;
  return pointItem({
    id: `mapPoint-${n}`, family: 'mapPoint',
    prompt: `<i>f</i>(${X}) = ${X}² passes through (${nH(x0)}, ${y0}). Where does that point go on <i>g</i>(${X}) = ${gH}?`,
    board: `g(x) = ${a === -1 ? '-' : a === 0.5 ? '\\frac{1}{2}' : a === 1 ? '' : a}f(${c > 0 ? `x - ${c}` : `x + ${-c}`}) ${d > 0 ? '+' : '-'} ${Math.abs(d)}`,
    picture: { g: { x: win([x0, X1, c - 2, c + 2, -2, 2]), y: win([y0, Y1, d, 4, a * 4 + d]), show: [crv([1, 0, 0], 'p', 'dim', 'f', true), pt('P', x0, y0, 'first', ptName(x0, y0))], reveal: [crv(g, 'g', 'link'), pt('Q', X1, Y1, 'link', ptName(X1, Y1))] } },
    solution: [`Inside, ${binH(c)}: move ${c > 0 ? 'right' : 'left'} ${Math.abs(c)}, so ${X} = ${nH(x0)} ${c > 0 ? '+' : '−'} ${Math.abs(c)} = ${nH(X1)}.`, `Outside: multiply the output by ${nH(a)}, then ${d > 0 ? 'add' : 'subtract'} ${Math.abs(d)}: ${nH(a)} × ${y0} ${d > 0 ? '+' : '−'} ${Math.abs(d)} = ${nH(Y1)}.`, `The point goes to (${ans(nH(X1))}, ${ans(nH(Y1))}).`],
  }, X1, Y1, (x, y) => {
    if (near(x, X1) && near(y, Y1)) return { ok: true, say: `Yes: (${nH(X1)}, ${nH(Y1)}). Sideways from the inside, up or down from the outside.` };
    if (near(x, x0 - c) && !near(x0 - c, X1)) return { ok: false, mc: MC.wrongSign, say: `${binH(c)} moves the graph ${c > 0 ? 'right' : 'left'}: the input needs to be ${Math.abs(c)} ${c > 0 ? 'bigger' : 'smaller'} for the same output.` };
    if (near(x, X1) && near(y, y0 + d) && !near(y0 + d, Y1)) return { ok: false, say: `Multiply the output by ${nH(a)} before you ${d > 0 ? 'add' : 'subtract'} ${Math.abs(d)}.` };
    if (near(x, X1)) return { ok: false, say: `The ${X} is right. The new output is ${nH(a)} × ${y0}, then ${d > 0 ? '+' : '−'} ${Math.abs(d)}.` };
    return { ok: false, say: `Inside the brackets moves it sideways; the factor and the ${d > 0 ? '+' : '−'} ${Math.abs(d)} change the output.` };
  });
};

// =============== 10. f(bx) ===============
const B_CASES: { b: number; x0: number[]; bT: string; bH: string }[] = [
  { b: 2, x0: [2, -2], bT: '2x', bH: `2${X}` }, { b: 3, x0: [3, -3], bT: '3x', bH: `3${X}` },
  { b: 0.5, x0: [1, -1, 2, -2], bT: '\\frac{1}{2}x', bH: `(1/2)${X}` }, { b: -1, x0: [2, -2, 1, -1], bT: '-x', bH: `−${X}` }, { b: -2, x0: [2, -2], bT: '-2x', bH: `−2${X}` },
];
export const fbxPoint: Gen = (R, n) => {
  const C = pick(R, B_CASES), x0 = pick(R, C.x0), y0 = x0 * x0, X1 = cl(x0 / C.b), g: Std = [C.b * C.b, 0, 0];
  return pointItem({
    id: `fbxPoint-${n}`, family: 'fbxPoint',
    prompt: `<i>f</i>(${X}) = ${X}² passes through (${nH(x0)}, ${y0}). <i>g</i>(${X}) = <i>f</i>(${C.bH}). Which point of <i>g</i> has the same output, ${y0}, and comes from that point?`,
    board: `g(x) = f(${C.bT})`,
    picture: { g: { x: win([x0, X1, x0 * C.b > -10 && x0 * C.b < 10 ? x0 * C.b : 0]), y: win([y0, -1, 10]), show: [crv([1, 0, 0], 'p', 'dim', 'f', true), pt('P', x0, y0, 'first', ptName(x0, y0))], reveal: [crv(g, 'g', 'link'), pt('Q', X1, y0, 'link', ptName(X1, y0))] } },
    solution: [`g gives the output f had at ${nH(x0)} when ${C.bH} = ${nH(x0)}, so ${X} = ${nH(x0)} ÷ ${pH(C.b)} = ${nH(X1)}.`, `Same output, new input: (${ans(nH(X1))}, ${ans(String(y0))}).`],
  }, X1, y0, (x, y) => {
    if (near(x, X1) && near(y, y0)) return { ok: true, say: `Yes: (${nH(X1)}, ${y0}). Inside, ${X} is divided by ${nH(C.b)}.` };
    if (near(x, cl(x0 * C.b)) && near(y, y0) && !near(x0 * C.b, X1)) return { ok: false, mc: MC.notRecip, say: `Inside the brackets the effect is reversed: ${C.bH} = ${nH(x0)} means ${X} = ${nH(x0)} ÷ ${pH(C.b)}.` };
    if (near(y, -y0)) return { ok: false, mc: MC.reflSwap, say: `A minus inside, f(−${X}), flips the graph left to right, not upside down: outputs of ${X}² stay positive.` };
    return { ok: false, say: `Which ${X} makes ${C.bH} = ${nH(x0)}? The output stays ${y0}.` };
  });
};

const B_MORE: { b: number; bT: string; bH: string }[] = [...B_CASES, { b: 4, bT: '4x', bH: `4${X}` }, { b: -3, bT: '-3x', bH: `−3${X}` }, { b: 1.5, bT: '\\frac{3}{2}x', bH: `(3/2)${X}` }];
export const fbxSame: Gen = (R, n) => {
  const C = pick(R, B_MORE), b2 = cl(C.b * C.b), back = R() < 0.4;
  const t = (c: number) => `${Y} = ${coefH(c)}${X}²`;
  const gb = (b: number) => `<i>g</i>(${X}) = <i>f</i>(${coefH(b)}${X})`;
  if (back) {
    // the other way round: which f(bx) is y = b²x²? (f(−bx) means the same, so it is dropped by its key)
    const o2: Opt[] = [
      { t: gb(C.b), ok: true, key: `c=${b2}`, say: `Yes: (${C.bH})² = ${qH(b2)}${X}².` },
      { t: gb(b2), key: `c=${cl(b2 * b2)}`, mc: MC.notRecip, say: `f(${qH(b2)}${X}) = ${qH(cl(b2 * b2))}${X}²: the number inside gets squared.` },
      { t: `<i>g</i>(${X}) = ${coefH(C.b)}<i>f</i>(${X})`, key: `c=${C.b}`, mc: MC.inOut, say: `A factor outside multiplies the outputs: that gives ${qH(C.b)}${X}², not ${qH(b2)}${X}².` },
      { t: gb(cl(1 / C.b)), key: `c=${cl(1 / b2)}`, say: `Square the inside: (${coefH(cl(1 / C.b))}${X})² = ${qH(cl(1 / b2))}${X}².` },
    ];
    return choiceItem(R, {
      id: `fbxSame-${n}`, family: 'fbxSame', prompt: `<i>f</i>(${X}) = ${X}². Which <i>g</i> has the same graph as ${Y} = ${coefH(b2)}${X}²?`, board: `y = ${coefT(b2)}x^2`,
      picture: { g: { x: [-4, 4, 1], y: [-2, 10, 2], show: [crv([1, 0, 0], 'p', 'dim', 'f', true)], reveal: [crv([b2, 0, 0], 'g', 'link', 'g')] } },
      solution: [`f(${C.bH}) = (${C.bH})² = ${qH(b2)}${X}².`, `A sideways squeeze or stretch of ${X}² is the same graph as a vertical stretch or compression.`],
    }, o2);
  }
  const opts: Opt[] = [
    { t: t(b2), ok: true, key: `c=${b2}`, say: `Yes: (${C.bH})² = ${nH(b2)}${X}². ${C.b === -1 ? 'The parabola is symmetric about the y-axis, so flipping it left to right changes nothing.' : 'Squeezing sideways looks the same as stretching up.'}` },
    { t: t(C.b), key: `c=${C.b}`, mc: MC.inOut, say: `The ${nH(C.b)} is inside the square: it gets squared too, (${C.bH})² = ${nH(b2)}${X}².` },
    { t: t(-b2), key: `c=${-b2}`, mc: C.b < 0 ? MC.reflSwap : undefined, say: C.b < 0 ? `f(−${X}) flips left to right, not upside down; squaring makes the minus disappear.` : `A square is never negative: (${C.bH})² is positive.` },
    { t: t(cl(1 / b2)), key: `c=${cl(1 / b2)}`, mc: MC.notRecip, say: `Expand it: (${C.bH})² = ${nH(b2)}${X}².` },
  ];
  return choiceItem(R, {
    id: `fbxSame-${n}`, family: 'fbxSame', prompt: `<i>f</i>(${X}) = ${X}². Which equation has the same graph as <i>g</i>(${X}) = <i>f</i>(${C.bH})?`, board: `g(x) = f(${C.bT})`,
    picture: { g: { x: [-4, 4, 1], y: [-2, 10, 2], show: [crv([1, 0, 0], 'p', 'dim', 'f', true)], reveal: [crv([b2, 0, 0], 'g', 'link', 'g')] } },
    solution: [`g(${X}) = f(${C.bH}) = (${C.bH})² = ${nH(b2)}${X}².`, C.b === -1 ? `The parent is its own mirror image across the y-axis, so f(−${X}) = ${X}².` : `A horizontal squeeze by 1/${nH(Math.abs(C.b))} is the same graph as a vertical stretch by ${nH(b2)}.`],
  }, opts);
};

// =============== 11. counting zeros from the vertex ===============
export const countZeros: Gen = (R, n) => {
  const a = pickA(R, false), h = int(R, -4, 4), cnt = pick(R, [2, 1, 0, 0, 2]);
  // two: k on the far side of the axis from where it heads; none: k on the side it heads to (a < 0 with k < 0 too)
  const k = cnt === 1 ? 0 : (cnt === 2 ? -sgn(a) : sgn(a)) * int(R, 1, 6);
  const s = fromV(a, h, k), std = R() < 0.4 && Number.isInteger(s[1]) && Number.isInteger(s[2]);
  const opts: Opt[] = [
    { t: 'two real zeros', ok: cnt === 2, mc: cnt < 2 ? (k < 0 ? MC.negKTwo : MC.nZeros) : undefined, say: cnt === 2 ? 'Yes: the vertex is on the other side of the x-axis from where the parabola heads, so it crosses twice.' : `The vertex is ${k === 0 ? 'on' : k > 0 ? 'above' : 'below'} the x-axis and the parabola opens ${a > 0 ? 'up' : 'down'}${k !== 0 ? ', away from the axis' : ''}.` },
    { t: 'one real zero', ok: cnt === 1, say: cnt === 1 ? 'Yes: the vertex is on the x-axis; it touches once.' : `Only a vertex on the x-axis gives one zero. Here k = ${nH(k)}.` },
    { t: 'no real zeros', ok: cnt === 0, say: cnt === 0 ? `Yes: the vertex is ${k > 0 ? 'above' : 'below'} the axis and it opens ${a > 0 ? 'up' : 'down'}, away from it.` : `It opens ${a > 0 ? 'up' : 'down'}: does it head toward the x-axis from the vertex?` },
  ];
  return choiceItem(R, {
    id: `countZeros-${n}`, family: 'countZeros',
    prompt: std ? `<i>f</i>(${X}) = ${stdH(s)}. Its axis of symmetry is ${X} = ${nH(h)}. How many real zeros does it have?` : `How many real zeros does <i>f</i>(${X}) = ${vfH(a, h, k)} have?`,
    board: std ? `f(x) = ${stdT(s)}` : `f(x) = ${vfT(a, h, k)}`,
    picture: { g: { ...curveWin(s, [], [0]), show: [], reveal: [crv(s), ...features(s, { vertex: true, zeros: true })], slate: true } },
    solution: [
      std ? `The vertex height is <i>f</i>(${nH(h)}) = ${nH(k)}, so the vertex is (${nH(h)}, ${nH(k)}).` : `The vertex is (${nH(h)}, ${nH(k)}), ${k === 0 ? 'on' : k > 0 ? 'above' : 'below'} the x-axis.`,
      `a = ${nH(a)}: it opens ${a > 0 ? 'up' : 'down'}. ${k === 0 ? 'It touches the axis at the vertex only.' : sgn(k) === -sgn(a) ? 'It heads toward the axis and crosses it twice.' : 'It heads away from the axis and never meets it.'}`,
    ],
  }, opts, true);
};
