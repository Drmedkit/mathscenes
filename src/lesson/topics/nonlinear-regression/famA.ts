// famA.ts: stage-1 families of "Quadratic and exponential regression": candidate families from a scatter's shape, the
// provisional table check (2nd differences, ratios, equal spacing, noise), residuals of a supplied curved model, residual
// patterns, residual size against units and use, and the least-squares criterion. Pure: no DOM.
import { fits, d1, d2, rts } from '../function-families/ff';
import { noise } from '../linear-regression/regMaths';
import {
  type Cand, type NCtx, type NG, type NGen, type NItem, type Opt, CTX, EXP, I, LIN, MC, QUAD, a1, ans, calc, cap, choice, ctxById, ctxOf, curve, dataOf, dots,
  int, numItem, pick, residPlot, resUnit, scatter, shuffle, until, xv, yv,
} from './nkit';
import {
  type Model, bendShare, cubicShare, evalM, expReg, expT, expH, fx, linReg, nH, nT, patterned, patternless, quadH, quadReg, quadT, r9, rd, resid, runs, sig, sgn, tieFree,
} from './nlMaths';

const chg = (v: number) => (r9(v) < 0 ? '−' : '+') + nH(Math.abs(v));
const rat = (v: number | null) => (v === null ? 'undef.' : '×' + nH(rd(v, 3)));
const listH = (vs: readonly number[]) => vs.map(v => nH(v)).join(', ');
const span = (xs: readonly number[]) => [Math.min(...xs), Math.max(...xs)] as const;

// ===================== family-from-shape =====================
type Shape = 'turn' | 'branch' | 'line';
function shapeData(R: () => number, kind: Shape) {
  if (kind === 'turn') {
    const c = ctxOf(R, ['ball', 'rocket', 'mpg', 'power', 'truck']);
    return until(() => dataOf(R, c, { truth: c.id === 'truck' ? truckTruth(R) : undefined }), d => {
      const top = d.truth.p[0]! < 0;
      const ext = top ? Math.max(...d.ys) : Math.min(...d.ys), i = d.ys.indexOf(ext), n = d.ys.length;
      const q = quadReg(d.xs, d.ys);
      const span = Math.max(...d.ys) - Math.min(...d.ys);
      return i >= 2 && i <= n - 3 && Math.abs(d.ys[0]! - ext) > 0.4 * span && Math.abs(d.ys[n - 1]! - ext) > 0.4 * span && Math.abs(d.ys[0]! - ext) > 0.12 * Math.abs(ext) && Math.abs(d.ys[n - 1]! - ext) > 0.12 * Math.abs(ext) && q.r2 > 0.97;
    });
  }
  if (kind === 'branch') {
    const c = ctxOf(R, ['drug', 'car', 'cells', 'views', 'decay', 'stop']);
    return until(() => dataOf(R, c), d => { const l = linReg(d.xs, d.ys); return patterned(d.xs, resid(l.model, d.xs, d.ys)) && monotone(d.ys); });
  }
  const c = ctxOf(R, LIN);
  return until(() => dataOf(R, c), d => { const l = linReg(d.xs, d.ys); return patternless(d.xs, resid(l.model, d.xs, d.ys)) && Math.abs(l.r) > 0.98; });
}
const monotone = (ys: readonly number[]) => d1(ys).every(v => v > 0) || d1(ys).every(v => v < 0);
/** a revenue curve with its peak inside the price range */
export function truckTruth(R: () => number): Model { const k = int(R, 20, 26), h = pick(R, [9.5, 10, 10.5]); return { fam: 'quad', p: [-k, 2 * k * h, 0] }; }
export const shapeFamily: NGen = (R, n) => {
  const kind: Shape = pick(R, ['turn', 'turn', 'branch', 'branch', 'line']);
  const d = shapeData(R, kind), c = d.c;
  const up = d.truth.fam === 'quad' ? d.truth.p[0]! > 0 : false;
  const growth = d.ys[d.ys.length - 1]! > d.ys[0]!;
  const opts: Opt[] = [
    { t: 'Linear only: the points follow a straight line', ok: kind === 'line', say: kind === 'line' ? 'Yes. No bend and no turn: a line is the candidate.' : 'Look at the shape: the points bend, a line cannot.' },
    { t: 'Quadratic only: the points turn around at a peak or a valley', ok: kind === 'turn', say: kind === 'turn' ? `Yes. The points ${up ? 'fall, reach a valley and rise again' : 'rise, reach a peak and fall again'}. An exponential never turns around, and a line never bends.` : kind === 'branch' ? 'There is no turn here: the points keep going one way. One bending branch fits an exponential as well as one side of a parabola.' : 'There is no turn and no bend here.' },
    { t: 'Exponential only: the points bend steadily one way', mc: kind === 'branch' ? (growth ? MC.roughShape : MC.uniqueShape) : undefined, say: kind === 'branch' ? 'One side of a parabola bends the same way. From the shape alone, both families stay candidates.' : kind === 'turn' ? 'An exponential never turns around: it only rises or only falls.' : 'These points do not bend.' },
    { t: 'Quadratic or exponential: one bending branch fits both families', ok: kind === 'branch', mc: undefined, say: kind === 'branch' ? 'Yes. A steady one-way bend fits an exponential and one side of a parabola. The shape cannot decide; residuals and context will.' : kind === 'turn' ? 'These points turn around. An exponential cannot do that.' : 'These points do not bend at all.' },
  ];
  return choice(R, {
    id: `shapeFamily-${n}`, family: 'shapeFamily',
    prompt: `${d.xs.length} measurements of ${c.yWhat} against ${c.xWhat} (${c.source}). From the <b>shape</b> of the scatter plot alone, which model families are candidates?`,
    board: '',
    solution: [kind === 'turn' ? `The points ${up ? 'fall to a valley and rise again' : 'rise to a peak and fall again'}: a turning point.` : kind === 'branch' ? `The points keep ${growth ? 'rising' : 'falling'}, bending one way, with no turn.` : 'The points follow a straight line: no bend, no turn.',
      kind === 'turn' ? 'Only a parabola turns around; an exponential only rises or only falls.' : kind === 'branch' ? 'An exponential and one side of a parabola can both make that bend: both stay candidates.' : 'A line is the candidate.'],
    picture: { g: scatter(d) },
  }, opts, true);
};
/** can family F follow this shape? (an exponential cannot turn; one side of a parabola can bend like an exponential) */
export const shapeTurn: NGen = (R, n) => {
  const turn = R() < 0.5;
  if (turn) {
    const d = shapeData(R, 'turn'), c = d.c, top = d.truth.p[0]! < 0;
    const ext = top ? Math.max(...d.ys) : Math.min(...d.ys), xe = d.xs[d.ys.indexOf(ext)]!;
    const opts: Opt[] = [
      { t: `No: y = a·b<sup>x</sup> only rises or only falls, so it can never turn around`, ok: true, say: 'Right. With a > 0, b > 1 means always rising and 0 < b < 1 means always falling. No exponential turns around.' },
      { t: 'Yes, with a base b below 1', say: 'With b below 1 the curve falls the whole time. It never turns back up.' },
      { t: 'Yes, with a negative a', say: 'A negative a flips the curve upside down, but it still only rises or only falls.' },
      { t: 'Yes: any curved scatter can be fitted by an exponential', mc: MC.roughShape, say: 'An exponential bends one way and keeps going. It cannot follow a rise and a fall.' },
    ];
    return choice(R, {
      id: `shapeTurn-${n}`, family: 'shapeTurn',
      prompt: `The ${c.yWhat} ${top ? 'peaks' : 'bottoms out'} at about ${yv(c, ext)} near ${xv(c, xe)} (${c.source}). Ana wants to try an exponential model ŷ = <i>a</i>·<i>b</i><sup><i>x</i></sup>. Can any exponential follow this shape?`,
      board: '\\hat{y} = a \\cdot b^{x}',
      solution: ['An exponential with a > 0 only rises (b > 1) or only falls (0 < b < 1).', `These points ${top ? 'rise and then fall' : 'fall and then rise'}: only a parabola turns like that.`],
      picture: { g: scatter(d) },
    }, opts);
  }
  const d = shapeData(R, 'branch'), c = d.c, growth = d.ys[d.ys.length - 1]! > d.ys[0]!;
  const opts: Opt[] = [
    { t: 'Yes: one side of a parabola can bend this way too', ok: true, say: 'Right. Over a short stretch, one side of a parabola and an exponential can look alike. Both stay candidates.' },
    { t: 'No: a curve that bends like this is always exponential', mc: growth ? MC.roughShape : MC.uniqueShape, say: 'A bend like this fits one side of a parabola as well. The shape alone cannot pick one family.' },
    { t: 'No: a quadratic must show its turning point in the data', mc: MC.uniqueShape, say: 'The turning point can lie outside the data. Then you see only one side of the parabola.' },
    { t: 'Yes, but only if the points lie exactly on the curve', mc: MC.onCurve, say: 'Real data scatter around any model. The question is the shape, not exact hits.' },
  ];
  return choice(R, {
    id: `shapeTurn-${n}`, family: 'shapeTurn',
    prompt: `${d.xs.length} measurements of ${c.yWhat} against ${c.xWhat} (${c.source}), from ${xv(c, d.xs[0]!)} to ${xv(c, d.xs[d.xs.length - 1]!)}. Ben says only an exponential can follow them. Could a <b>quadratic</b> model follow this shape too?`,
    board: '\\hat{y} = ax^2 + bx + c\\ \\ ?',
    solution: [`The points keep ${growth ? 'rising' : 'falling'} and bend one way, with no turn in the data.`, 'One side of a parabola bends that way too, so a quadratic stays a candidate.'],
    picture: { g: scatter(d) },
  }, opts);
};

// ===================== table-difference-ratio-test =====================
const tableDiffs = (xs: readonly number[], ys: readonly number[]) => ({ dx: d1(xs).map(chg), d1: d1(ys).map(chg), d2: d2(ys).map(chg), rt: rts(ys).map(rat) });
export const diffTest: NGen = (R, n) => {
  const kind = pick(R, ['quad', 'quad', 'exp', 'exp', 'lin'] as const);
  const h = pick(R, [1, 1, 2, 5]), x0 = h === 5 ? 0 : pick(R, [0, 1]), N = int(R, 5, 6);
  const xs = Array.from({ length: N }, (_, i) => x0 + h * i);
  const { ys } = until(() => {
    let ys: number[];
    if (kind === 'quad') { const A = pick(R, [1, 2, 3, -1, -2]), B = int(R, -3, 6), C = int(R, 0, 20); const t = (x: number) => A * (x / h) ** 2 + B * (x / h) + C; ys = xs.map(x => r9(t(x))); }
    else if (kind === 'exp') { const grow = R() < 0.6; if (grow) { const a = int(R, 1, 6), b = pick(R, [2, 3]); ys = xs.map((_, i) => a * b ** i); } else { const b = pick(R, [2, 4]), a = int(R, 1, 3) * b ** (N - 1); ys = xs.map((_, i) => a / b ** i); } }
    else { const m = pick(R, [2, 3, 4, 5, -3, -4, 6]), C = int(R, 10, 40); ys = xs.map((_, i) => C + m * i); }
    return { ys };
  }, t => { const f = fits(xs, t.ys); return f.length === 1 && f[0] === (kind === 'quad' ? 'quadratic' : kind === 'exp' ? 'exponential' : 'linear') && t.ys.every(v => Number.isInteger(v)) && (kind !== 'quad' || d1(t.ys).some((v, i, a) => i > 0 && v !== a[i - 1])); });
  const D = tableDiffs(xs, ys), incr = d1(ys).every((v, i, a) => i === 0 || v > a[i - 1]!);
  const name = { quad: 'Quadratic', exp: 'Exponential', lin: 'Linear' }[kind];
  const opts: Opt[] = [
    { t: 'Linear: constant 1st differences', ok: kind === 'lin', say: kind === 'lin' ? `Right: every 1st difference is ${D.d1[0]}.` : `The 1st differences are ${D.d1.join(', ')}: not constant.` },
    { t: 'Quadratic: constant 2nd differences', ok: kind === 'quad', say: kind === 'quad' ? `Right: the 1st differences change, but the 2nd differences are all ${D.d2[0]}.` : `The 2nd differences are ${D.d2.join(', ')}: not constant.` },
    { t: 'Exponential: constant ratios', ok: kind === 'exp', mc: kind === 'quad' && incr ? MC.incDiffs : undefined, say: kind === 'exp' ? `Right: every ratio is ${D.rt[0]}.` : `The ratios are ${D.rt.join(', ')}: not constant. Growing 1st differences alone do not make a table exponential.` },
    { t: 'None of these', say: `Check again: the ${kind === 'lin' ? '1st differences' : kind === 'quad' ? '2nd differences' : 'ratios'} are constant.` },
  ];
  return choice(R, {
    id: `diffTest-${n}`, family: 'diffTest',
    prompt: `${calc(false)}This table follows an exact rule (no noise): x = ${listH(xs)} and y = ${listH(ys)}, equal x-steps of ${nH(h)}. Which family does it fit?`,
    board: `\\Delta x = ${nT(h)}`,
    solution: [`1st differences: ${D.d1.join(', ')}. 2nd differences: ${D.d2.join(', ')}. Ratios: ${D.rt.join(', ')}.`, `${name}: the ${kind === 'lin' ? '1st differences' : kind === 'quad' ? '2nd differences' : 'ratios'} are constant.`],
    picture: { diff: { xName: 'x', yName: 'y', xs: xs.map(v => nH(v)), ys: ys.map(v => nH(v)), solveDiffs: { dx: D.dx, d1: D.d1, d2: D.d2, rt: D.rt } } },
  }, opts, true);
};
const UNEQ: readonly number[][] = [[0, 1, 3, 4, 6], [0, 2, 3, 5, 6], [1, 2, 4, 5, 8], [0, 1, 2, 4, 5], [0, 3, 4, 6, 7], [2, 3, 5, 6, 9]];
export const diffSpacing: NGen = (R, n) => {
  const xs = [...pick(R, UNEQ)];
  const lin = R() < 0.5;
  let ys: number[], rate: number;
  if (lin) { rate = pick(R, [2, 3, 4, 5, 1.5, -2, -3]); const C = int(R, 5, 30); ys = xs.map(x => r9(C + rate * x)); }
  else { rate = pick(R, [2, 3]); const a = int(R, 1, 5); ys = xs.map(x => a * rate ** x); }
  const dx = d1(xs), dy = d1(ys), rt = rts(ys);
  const per = dy.map((v, i) => r9(v / dx[i]!)), perF = rt.map((v, i) => rd(v! ** (1 / dx[i]!), 6));
  const opts: Opt[] = lin ? [
    { t: `Lee is wrong: the x-steps are unequal; Δy ÷ Δx is ${nH(rate)} on every interval, so the table is consistent with a line`, ok: true, say: `Right. The x-steps are ${dx.map(chg).join(', ')}. Per unit of x the change is ${nH(rate)} every time.` },
    { t: 'Lee is right: unequal 1st differences rule out a line', mc: MC.spacing, say: `The differences differ only because the x-steps differ (${dx.map(chg).join(', ')}). Divide each change by its step.` },
    { t: 'The table is quadratic: its 1st differences change', mc: MC.spacing, say: 'Raw differences of rows that are not equally far apart cannot be compared.' },
  ] : [
    { t: `Lee is wrong: the x-steps are unequal; per unit of x the factor is ${nH(rate)} on every interval, so the table is consistent with an exponential`, ok: true, say: `Right. A step of 2 multiplies by ${nH(rate)} twice. Per unit of x the factor is ${nH(rate)} every time.` },
    { t: 'Lee is right: unequal ratios rule out an exponential', mc: MC.spacing, say: `The ratios differ because the x-steps differ (${dx.map(chg).join(', ')}). A step of 2 multiplies twice.` },
    { t: 'The table is quadratic: its ratios change', mc: MC.spacing, say: 'Raw ratios of rows that are not equally far apart cannot be compared.' },
  ];
  return choice(R, {
    id: `diffSpacing-${n}`, family: 'diffSpacing',
    prompt: lin ? `${calc(false)}Lee finds the 1st differences ${dy.map(chg).join(', ')} and says: “Not constant, so the data cannot be linear.” What is the right conclusion?`
      : `${calc(false)}Lee finds the ratios ${rt.map(rat).join(', ')} and says: “Not constant, so the data cannot be exponential.” What is the right conclusion?`,
    board: `x:\\ ${xs.map(v => nT(v)).join(',\\ ')}`,
    solution: [`The x-steps are ${dx.map(chg).join(', ')}: not equal, so the raw test does not apply.`, lin ? `Δy ÷ Δx on each interval: ${per.map(v => nH(v)).join(', ')}. Constant, so a line fits.` : `Factor per unit of x on each interval: ${perF.map(v => nH(v)).join(', ')}. Constant, so an exponential fits.`],
    picture: { diff: { xName: 'x', yName: 'y', xs: xs.map(v => nH(v)), ys: ys.map(v => nH(v)), solveDiffs: { dx: dx.map(chg), ...(lin ? { d1: dy.map(chg) } : { rt: rt.map(rat) }) } } },
  }, opts);
};
export const diffNoisy: NGen = (R, n) => {
  const suggest = R() < 0.6;
  const c = suggest ? ctxOf(R, ['ball', 'rocket']) : ctxOf(R, ['mpg', 'stop', 'power']);
  const d = until(() => {
    const all = dataOf(R, c, { sd: suggest ? 0.2 : 1.5 }), k = int(R, 0, Math.max(0, all.xs.length - 6));
    return { c, xs: all.xs.slice(k, k + 6), ys: all.ys.slice(k, k + 6) };
  }, t => {
    const s2 = d2(t.ys), m = s2.reduce((a, b) => a + b, 0) / s2.length, r = rts(t.ys).filter((v): v is number => v !== null);
    const rSpread = Math.max(...r) - Math.min(...r);
    if (suggest) return Math.abs(m) > 0 && s2.every(v => Math.sign(v) === Math.sign(m) && Math.abs(v - m) <= 0.25 * Math.abs(m)) && s2.some(v => Math.abs(v - m) > 1e-9) && rSpread > 0.1;
    return s2.some(v => v > 0) && s2.some(v => v < 0) && rSpread > 0.1;
  });
  const D = tableDiffs(d.xs, d.ys);
  const incr = d1(d.ys).every((v, i, a) => i === 0 || v > a[i - 1]!);
  const opts: Opt[] = [
    { t: 'They suggest a quadratic, but only provisionally: fit a model and check its residuals', ok: suggest, say: suggest ? 'Right. Roughly constant 2nd differences in noisy data are a hint, not a proof. Residuals and context settle it.' : `The 2nd differences ${D.d2.join(', ')} even change sign: they are not roughly constant.` },
    { t: 'They prove the data are quadratic', mc: suggest ? MC.noisyProves : undefined, say: suggest ? 'Noisy data can only suggest a family. A fitted model and its residuals have to confirm it.' : `The 2nd differences ${D.d2.join(', ')} are far from constant, so they do not even suggest it.` },
    { t: 'They rule out a quadratic: the 2nd differences are not exactly equal', say: 'Real measurements are noisy, so the 2nd differences are never exactly equal. That does not rule anything out.' },
    { t: 'Inconclusive: neither the 2nd differences nor the ratios are close to constant; let residuals decide', ok: !suggest, mc: undefined, say: suggest ? `Look again: the 2nd differences ${D.d2.join(', ')} stay close to each other.` : 'Right. The table check cannot decide here. Fit candidates and compare their residuals.' },
    ...(incr && !suggest ? [{ t: 'They suggest an exponential: the 1st differences keep increasing', mc: MC.incDiffs, say: 'Increasing 1st differences fit a quadratic too. An exponential needs roughly constant ratios.' } as Opt] : []),
  ];
  return choice(R, {
    id: `diffNoisy-${n}`, family: 'diffNoisy',
    prompt: `${calc(true)}Six measurements of ${c.yWhat} (${c.source}), equally spaced in ${c.xWhat}. Their 1st and 2nd differences are shown. What do the 2nd differences tell you?`,
    board: `\\Delta^2 y:\\ ${D.d2.map(v => v.replace('−', '-')).join(',\\ ')}`,
    solution: [`2nd differences: ${D.d2.join(', ')}. Ratios: ${D.rt.join(', ')}.`, suggest ? 'The 2nd differences stay close to each other: a provisional hint of a quadratic, to be checked with residuals.' : 'Neither column is close to constant: the table check is inconclusive; fit candidates and compare residuals.'],
    picture: { diff: { xName: c.hx, yName: c.hy, xs: d.xs.map(v => nH(v)), ys: d.ys.map(v => nH(v)), show: { d1: D.d1, d2: D.d2 }, solveDiffs: { rt: D.rt } } },
  }, opts, true);
};

// ===================== residuals-curved-model =====================
const rDp = (c: NCtx) => (c.money ? 0 : c.yd === 0 ? 1 : 2);
const dpWord = (d: number) => (d === 0 ? 'the nearest whole number' : d === 1 ? 'the nearest tenth' : 'the nearest hundredth');
/** a supplied model: the truth rounded to 4 significant digits (quadratic) or a and b rounded (exponential) */
function supplied(m: Model, c: NCtx): Model {
  if (m.fam === 'exp') return { fam: 'exp', p: [c.money ? rd(m.p[0]!, 0) : sig(m.p[0]!, 3), rd(m.p[1]!, 2)] };
  return { fam: m.fam, p: m.p.map(v => (v === 0 ? 0 : sig(v, 4))) };
}
export function modelHT(m: Model, x = 'x'): { h: string; t: string } {
  const s = (v: number) => (v < 0 ? '−' : '') + nH(Math.abs(v), 6);
  if (m.fam === 'quad') {
    const [a, b, c] = m.p as [number, number, number];
    const s1 = (v: number) => (Math.abs(v) === 1 ? (v < 0 ? '−' : '') : s(v));
    if (c === 0) { const h = quadH(s1(a), s1(b), '0', `<i>${x}</i>`).replace(/ \+ 0$/, ''), t = quadT(s1(a), s1(b), '0', x).replace(/ \+ 0$/, ''); return { h, t }; }
    return { h: quadH(s1(a), s1(b), s(c), `<i>${x}</i>`), t: quadT(s1(a), s1(b), s(c), x) };
  }
  if (m.fam === 'exp') return { h: expH(nH(m.p[0]!, 6), nH(m.p[1]!, 6), `<i>${x}</i>`), t: expT(nH(m.p[0]!, 6), nH(m.p[1]!, 6), x) };
  if (m.fam === 'lin') { const [a, b] = m.p as [number, number]; return { h: `ŷ = ${nH(a, 6)} ${b < 0 ? '−' : '+'} ${nH(Math.abs(b), 6)}<i>${x}</i>`, t: `\\hat{y} = ${nT(a, 6)} ${b < 0 ? '-' : '+'} ${nT(Math.abs(b), 6)}${x}` }; }
  if (m.fam === 'sqrt') { const [a, k] = m.p as [number, number]; return { h: `ŷ = ${nH(a, 6)}√<i>${x}</i>${k === 0 ? '' : ` ${k < 0 ? '−' : '+'} ${nH(Math.abs(k), 6)}`}`, t: `\\hat{y} = ${nT(a, 6)}\\sqrt{${x}}${k === 0 ? '' : ` ${k < 0 ? '-' : '+'} ${nT(Math.abs(k), 6)}`}` }; }
  return { h: `ŷ = ${nH(m.p[0]!, 6)}<i>${x}</i><sup>${nH(m.p[1]!, 6)}</sup>`, t: `\\hat{y} = ${nT(m.p[0]!, 6)}${x}^{${nT(m.p[1]!, 6)}}` };
}
function residItem(R: () => number, n: number, fam: 'residQuad' | 'residExp'): ReturnType<NGen> {
  const ids = fam === 'residQuad' ? ['ball', 'rocket', 'mpg', 'power', 'stop'] : ['drug', 'car', 'cells', 'decay', 'views'];
  const zero = R() < 0.15, c = ctxOf(R, zero && fam === 'residExp' ? ['drug', 'car', 'decay'] : ids);
  const t = until(() => {
    const d = dataOf(R, c), m = supplied(d.truth, c), i = zero && fam === 'residExp' ? 0 : int(R, 1, d.xs.length - 2);
    if (zero && fam === 'residExp' && d.xs[0] !== 0) return null;
    const yh = evalM(m, d.xs[i]!);
    if (zero) { const yr = rd(yh, c.yd); if (Math.abs(yr - yh) > 1e-9) return null; d.ys[i] = yr; }
    return { d, m, i, yh, e: r9(d.ys[i]! - yh) };
  }, t => t !== null && (zero ? Math.abs(t.e) < 1e-9 : Math.abs(t.e) > 2 * 10 ** -rDp(c) && tieFree(t.e, rDp(c)) && tieFree(t.yh, rDp(c))), 6000)!;
  const { d, m, i, yh, e } = t, dp = rDp(c), M = modelHT(m), x0 = d.xs[i]!, y0 = d.ys[i]!;
  const E = rd(e, dp), Y = rd(yh, dp);
  const cands: Cand[] = [[-E, MC.residSign, `That is predicted minus observed. A residual is observed minus predicted: ${nH(y0)} − ${nH(Y)}.`], [Y, undefined, `That is the predicted value ŷ. The residual is the observed value minus it.`]];
  return numItem({
    id: `${fam}-${n}`, family: fam,
    prompt: `${calc(true)}A supplied model for the ${c.yWhat}: ${M.h}, <i>x</i> = ${c.xWhat} (${c.xUnit}). At ${xv(c, x0)} the observed value was ${yv(c, y0)}. Find the residual, to ${dpWord(dp)}.`,
    board: `e = y - \\hat{y}`, unit: c.money ? 'dollars' : c.yUnit,
    solution: [`ŷ at ${I('x')} = ${nH(x0)}: ${nH(yh, 4)}${c.money ? ' dollars' : ''}.`, `e = y − ŷ = ${nH(y0)} − ${nH(yh, 4)} = ${ans(nH(E, dp))} ${E === 0 ? '(the point lies on the curve)' : E > 0 ? '(the point lies above the curve)' : '(the point lies below the curve)'}.`],
    picture: { g: { ...scatter(d, { curves: [{ m, key: 'fit' }], hot: [i] }), solveItems: [{ kind: 'seg', key: 'stick', a: [x0, rd(yh, 6)], b: [x0, y0], col: 'second', w: 6 } as NItem] } },
  }, E, E === 0 ? 'Right: the point lies exactly on the curve, so its residual is 0.' : `Right: ${nH(y0)} − ${nH(Y)} ≈ ${nH(E, dp)}. ${E > 0 ? 'Positive: the model under-predicts here.' : 'Negative: the model over-predicts here.'}`,
  cands, 'Find ŷ from the model first, then subtract it from the observed value: e = y − ŷ.', { tol: 0.5 * 10 ** -dp + 1e-9 });
}
export const residQuad: NGen = (R, n) => residItem(R, n, 'residQuad');
export const residExp: NGen = (R, n) => residItem(R, n, 'residExp');
/** one residual of 0: a line forced through one point of curved data */
export const residOne: NGen = (R, n) => {
  const c = ctxOf(R, ['drug', 'car', 'decay', 'cells', 'stop', 'views']);
  const t = until(() => {
    const d = dataOf(R, c), l = linReg(d.xs, d.ys), i = int(R, 1, d.xs.length - 2);
    const b = rd(l.b, 2), a = rd(d.ys[i]! - b * d.xs[i]!, 4);
    const m: Model = { fam: 'lin', p: [a, b] }, es = resid(m, d.xs, d.ys);
    return { d, m, i, es };
  }, t => patterned(t.d.xs, t.es) && Math.abs(t.es[t.i]!) < 1e-9);
  const { d, m, i, es } = t, M = modelHT(m);
  const shape = bendShare(d.xs, es) > 0.5 ? (quadReg(d.xs, es).a > 0 ? 'a U: positive at both ends, negative in the middle' : 'an arch: negative at both ends, positive in the middle') : 'a clear pattern';
  const opts: Opt[] = [
    { t: 'No: one residual says nothing about the others; check every residual (here they form a pattern)', ok: true, say: `Right. One hit proves little. The other residuals form ${shape}.` },
    { t: 'Yes: a residual of 0 means the model is exactly right', mc: MC.oneSmall, say: 'One point on the line says nothing about the other points. Here the rest form a pattern.' },
    { t: 'Yes: a good model passes through the data points', mc: MC.onCurve, say: 'A good model follows the trend; it does not have to hit points. Check all the residuals.' },
    { t: 'No: a residual of 0 shows that the model is wrong', say: 'A residual of 0 is not a problem in itself. The problem is the pattern in the other residuals.' },
  ];
  return choice(R, {
    id: `residOne-${n}`, family: 'residOne',
    prompt: `Jay fits ${M.h} to ${d.xs.length} measurements of ${c.yWhat} (${c.source}). At ${xv(c, d.xs[i]!)} the observed value is ${yv(c, d.ys[i]!)}, and the residual there is 0. Jay says: “So the model fits the data well.” Is Jay right?`,
    board: `e = ${nT(d.ys[i]!)} - ${nT(d.ys[i]!)} = 0`,
    solution: ['One residual of 0 only says the line hits that one point.', `The residuals of all ${d.xs.length} points form ${shape}: the line misses in a system.`],
    picture: { g: residPlot(c, d.xs, es, { hot: [i] }) },
  }, opts);
};

// ===================== residual-pattern =====================
type PairCase = 'oneA' | 'oneB' | 'both' | 'none';
/** an S-shaped growth (a sunflower's height): no quadratic or exponential follows it */
function sunflower(R: () => number) {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], K = int(R, 90, 110), r = 0.6 + R() * 0.2, t0 = 6 + R();
  const ys = xs.map(x => Math.max(0.5, rd(K / (1 + Math.exp(-r * (x - t0))) + 1.2 * noise(R), 1)));
  return { xs, ys };
}
const SUN: NCtx = { ...ctxById('candle'), id: 'sun', fam: 'lin', source: 'one sunflower, measured once a week', xWhat: 'weeks since sprouting', yWhat: 'height', xAxis: 'Weeks', yAxis: 'Height (inches)', hx: 'Week', hy: 'Height (in)', yUnit: 'inches', xUnit: 'weeks', xOne: 'week' };
const famWord = (f: Model['fam']) => ({ lin: 'linear', quad: 'quadratic', exp: 'exponential', sqrt: 'square-root', pwr: 'power' }[f]);
function fitOf(f: 'lin' | 'quad' | 'exp', xs: readonly number[], ys: readonly number[]): Model { return f === 'lin' ? linReg(xs, ys).model : f === 'quad' ? quadReg(xs, ys).model : expReg(xs, ys).model; }
export const patternPick: NGen = (R, n) => {
  const cs: PairCase = pick(R, ['oneA', 'oneB', 'oneA', 'oneB', 'both', 'none']);
  type T = { c: NCtx; xs: number[]; ys: number[]; fa: 'lin' | 'quad' | 'exp'; fb: 'lin' | 'quad' | 'exp'; ea: number[]; eb: number[] };
  const t = until((): T | null => {
    if (cs === 'none') {
      const s = sunflower(R), ea = resid(fitOf('quad', s.xs, s.ys), s.xs, s.ys), eb = resid(fitOf('exp', s.xs, s.ys), s.xs, s.ys);
      return { c: SUN, ...s, fa: 'quad', fb: 'exp', ea, eb };
    }
    if (cs === 'both') {
      const c = ctxOf(R, ['views', 'cells']), d = dataOf(R, c, { xs: c.id === 'views' ? [1, 2, 3, 4, 5, 6, 7, 8] : [0, 1, 2, 3, 4, 5, 6], sd: 0.7 });
      return { c, xs: d.xs, ys: d.ys, fa: 'quad', fb: 'exp', ea: resid(fitOf('quad', d.xs, d.ys), d.xs, d.ys), eb: resid(fitOf('exp', d.xs, d.ys), d.xs, d.ys) };
    }
    const c = ctxOf(R, [...QUAD, 'drug', 'car', 'decay', 'cells', 'views', 'stop']);
    const d = dataOf(R, c, { truth: c.id === 'truck' ? truckTruth(R) : undefined, sd: 0.7 });
    const right = c.fam === 'quad' ? 'quad' : 'exp';
    const wrong = c.fam === 'quad' ? pick(R, ['lin', 'exp'] as const) : pick(R, ['lin', 'quad'] as const);
    if (d.ys.some(y => y <= 0)) return null;
    const er = resid(fitOf(right, d.xs, d.ys), d.xs, d.ys), ew = resid(fitOf(wrong, d.xs, d.ys), d.xs, d.ys);
    return cs === 'oneA' ? { c, xs: d.xs, ys: d.ys, fa: right, fb: wrong, ea: er, eb: ew } : { c, xs: d.xs, ys: d.ys, fa: wrong, fb: right, ea: ew, eb: er };
  }, t => {
    if (!t) return false;
    const pa = patterned(t.xs, t.ea), pb = patterned(t.xs, t.eb), la = patternless(t.xs, t.ea), lb = patternless(t.xs, t.eb);
    const strict = (e: number[]) => runs(e) >= Math.ceil(t.xs.length / 2) + 1 && bendShare(t.xs, e) < 0.25 && cubicShare(t.xs, e) < 0.4;
    return cs === 'oneA' ? la && pb : cs === 'oneB' ? pa && lb : cs === 'both' ? strict(t.ea) && strict(t.eb) : pa && pb;
  }, 8000)!;
  const { c, xs, ys, fa, fb, ea, eb } = t;
  const sst0 = ys.reduce((s, v) => s + (v - ys.reduce((p, q) => p + q, 0) / ys.length) ** 2, 0);
  const r2 = (e: number[]) => 1 - e.reduce((s, v) => s + v * v, 0) / sst0;
  const R2a = r2(ea), R2b = r2(eb);
  const showR2 = cs !== 'none' && tieFree(R2a, 3) && tieFree(R2b, 3) && rd(R2a, 3) !== rd(R2b, 3);
  const higher = R2a > R2b ? 'A' : 'B';
  const opts: Opt[] = [
    { t: `Only model A’s form fits: B’s residuals form a pattern`, ok: cs === 'oneA', mc: cs === 'oneB' && showR2 && higher === 'A' ? MC.highR : undefined, say: cs === 'oneA' ? 'Right. A’s residuals scatter with no pattern; B’s follow a curve.' : 'Look at A’s residual plot: the points follow a curve, or both plots look alike.' },
    { t: `Only model B’s form fits: A’s residuals form a pattern`, ok: cs === 'oneB', mc: cs === 'oneA' && showR2 && higher === 'B' ? MC.highR : undefined, say: cs === 'oneB' ? 'Right. B’s residuals scatter with no pattern; A’s follow a curve.' : 'Look at B’s residual plot: the points follow a curve, or both plots look alike.' },
    { t: 'Both forms fit: neither plot shows a pattern', ok: cs === 'both', say: cs === 'both' ? 'Right. Neither plot shows a pattern: the residuals cannot separate these models. Context and residual size will have to.' : 'One of the plots (at least) has its points following a curve.' },
    { t: 'Neither form fits: both plots show a pattern', ok: cs === 'none', mc: undefined, say: cs === 'none' ? 'Right. Both residual plots follow a curve: neither model has the right form.' : 'At least one plot has residuals scattered with no pattern.' },
  ];
  const r2txt = showR2 ? ` (R² = ${fx(R2a, 3)} and ${fx(R2b, 3)})` : '';
  return choice(R, {
    id: `patternPick-${n}`, family: 'patternPick',
    prompt: `${xs.length} measurements of ${c.yWhat} (${c.source}). Model A is ${a1(famWord(fa))} fit and model B ${a1(famWord(fb))} fit${r2txt}. Their residual plots are shown. What do they say about the form of each model?`,
    board: '',
    solution: [`Model A (${famWord(fa)}): ${patterned(xs, ea) ? 'the residuals follow a curve (a pattern)' : 'the residuals scatter with no pattern'}.`, `Model B (${famWord(fb)}): ${patterned(xs, eb) ? 'the residuals follow a curve (a pattern)' : 'the residuals scatter with no pattern'}.`],
    picture: { g: residPlot(c, xs, ea, { title: 'A' }), g2: residPlot(c, xs, eb, { title: 'B' }) },
  }, opts, true);
};
/** residuals that add to 0 but form a U or an arch */
export const patternSumZero: NGen = (R, n) => {
  const c = ctxOf(R, ['drug', 'car', 'decay', 'stop', 'cells', 'ball', 'mpg']);
  const t = until(() => {
    const d = dataOf(R, c, { truth: c.id === 'truck' ? truckTruth(R) : undefined }), l = linReg(d.xs, d.ys);
    const dp = c.money ? 0 : 1, es = resid(l.model, d.xs, d.ys).map(e => rd(e, dp));
    return { d, l, es, dp };
  }, t => Math.abs(t.es.reduce((s, e) => s + e, 0)) < 1e-9 && patterned(t.d.xs, t.es) && bendShare(t.d.xs, t.es) > 0.8 && t.es.every(e => e !== 0));
  const { d, es, dp } = t;
  const U = quadReg(d.xs, es).a > 0, shape = U ? 'a U: positive at both ends, negative in the middle' : 'an arch: negative at both ends, positive in the middle';
  const opts: Opt[] = [
    { t: `No: the residuals form ${U ? 'a U' : 'an arch'}, so the line misses in a system; every least-squares line has residuals that add to 0`, ok: true, say: `Right. The sum is 0 for any least-squares line with an intercept. The pattern is what shows the form is wrong.` },
    { t: 'Yes: residuals that add to 0 mean the misses cancel out, so the fit is good', mc: MC.signedTotal, say: 'Plus and minus misses cancel in a sum. A terrible model can still add to 0. Look at the pattern instead.' },
    { t: 'Yes: a sum of 0 shows that the line passes through the points', mc: MC.onCurve, say: 'No residual here is 0: the line passes through none of the points. Only the signed total is 0.' },
    { t: 'No: residuals of a good model add to a positive number', say: 'For a least-squares line the residuals always add to 0, good model or not. The pattern is the evidence.' },
  ];
  return choice(R, {
    id: `patternSumZero-${n}`, family: 'patternSumZero',
    prompt: `A least-squares <b>line</b> is fitted to ${d.xs.length} measurements of ${c.yWhat} (${c.source}). Its residuals (rounded) are ${es.map(e => nH(e, dp)).join(', ')}. Sam: “They add up to 0, so the line is a good model.” Is Sam right?`,
    board: `\\sum e = 0`,
    solution: [`The residuals add to 0, but they form ${shape}.`, 'A pattern means the line misses in a system: its form is wrong, whatever the sum.'],
    picture: { g: residPlot(c, d.xs, es) },
  }, opts);
};

// ===================== residual-size =====================
function randomResid(R: () => number, xs: readonly number[], s: number, dp: number): number[] {
  const n = xs.length;
  return until(() => { const e = Array.from({ length: n }, () => rd(s * noise(R), dp)); return e; }, e => patternless(xs, e) && e.every(v => v !== 0) && Math.max(...e.map(Math.abs)) > 1.5 * s);
}
const SIZE: Record<string, { small: number; dp: number; what: string }> = {
  car: { small: 200, dp: 0, what: 'value of used sedans' }, drug: { small: 0.2, dp: 2, what: 'drug concentration' }, ball: { small: 0.3, dp: 2, what: 'height of a ball' },
  mpg: { small: 0.25, dp: 2, what: 'gas mileage' }, power: { small: 0.4, dp: 2, what: 'electricity use' },
};
export const sizeUse: NGen = (R, n) => {
  const c = ctxById(pick(R, Object.keys(SIZE))), S = SIZE[c.id]!;
  const k = pick(R, [8, 10, 12]), N = int(R, 8, 10);
  const xs = c.xs(R).slice(0, N);
  const small = randomResid(R, xs, S.small, S.dp), big = randomResid(R, xs, S.small * k, S.dp);
  const aSmall = R() < 0.5;
  const mA = Math.max(...small.map(Math.abs)), mB = Math.max(...big.map(Math.abs));
  const gA = residPlot(c, xs, aSmall ? small : big, { title: 'A' }), gB = residPlot(c, xs, aSmall ? big : small, { title: 'B' });
  const w = aSmall ? 'A' : 'B', o = aSmall ? 'B' : 'A';
  const unit = resUnit(c);
  const opts: Opt[] = [
    { t: `Model ${w}: its residuals are much smaller (read the vertical scales)`, ok: true, key: 'w', say: `Right. Model ${w}'s misses stay within about ${nH(rd(mA, S.dp), S.dp)} ${unit}; model ${o}'s reach about ${nH(rd(mB, S.dp), S.dp)} ${unit}.` },
    { t: `Model ${o}: its residual plot looks just as tight`, mc: MC.scales, say: `The plots look alike only because their vertical scales differ. Read the numbers on each axis.` },
    { t: 'Neither: the two plots look the same, so the models are equally precise', mc: MC.scales, say: 'Same look, different scales. Compare the residuals in their units.' },
    { t: 'Neither: no pattern in either plot makes both equally useful', mc: MC.patternless, say: 'No pattern says the form is right. How big the misses are is a separate question.' },
  ];
  return choice(R, {
    id: `sizeUse-${n}`, family: 'sizeUse',
    prompt: `Two models for the ${S.what}, each fitted to its own data (${xs.length} cases). Neither residual plot shows a pattern. Whose predictions are typically closer to the observed values?`,
    board: '',
    solution: [`Read each vertical scale: model ${w}'s residuals stay within about ±${nH(rd(mA, S.dp), S.dp)} ${unit}, model ${o}'s within about ±${nH(rd(mB, S.dp), S.dp)} ${unit}.`, `Model ${w} misses by far less.`],
    picture: { g: gA, g2: gB },
  }, opts);
};
export const sizeTol: NGen = (R, n) => {
  const c = ctxById(pick(R, Object.keys(SIZE))), S = SIZE[c.id]!;
  const ok = R() < 0.5, N = int(R, 8, 10), xs = c.xs(R).slice(0, N);
  const s = S.small * pick(R, [1, 2, 3]), es = randomResid(R, xs, s, S.dp), m = Math.max(...es.map(Math.abs));
  const step = c.money ? 50 : S.dp === 2 ? 0.05 : 0.1;
  const T = r9(Math.round((ok ? m * (2 + R()) : m / (2 + R())) / step) * step);
  const use: Record<string, string> = { car: 'a dealer prices trade-ins and needs predictions within', drug: 'a pharmacist needs predictions within', ball: 'a coach needs heights within', mpg: 'an engineer needs mileage predictions within', power: 'the utility needs daily predictions within' };
  const unit = resUnit(c), Tt = c.money ? `$${nH(T, 0)}` : `${nH(T, 2)} ${unit}`;
  const opts: Opt[] = [
    { t: 'Yes: every residual is well within the tolerance, and there is no pattern', ok: ok, say: ok ? `Right. The largest miss is about ${nH(rd(m, S.dp), S.dp)} ${unit}, well inside ${Tt}.` : `The residuals reach about ${nH(rd(m, S.dp), S.dp)} ${unit}: far more than ${Tt}.` },
    { t: 'No: the residuals are much larger than the tolerance, even with no pattern', ok: !ok, say: !ok ? `Right. No pattern means the form is fine, but misses of about ${nH(rd(m, S.dp), S.dp)} ${unit} are too big for a tolerance of ${Tt}.` : `Read the vertical scale: the misses stay within about ${nH(rd(m, S.dp), S.dp)} ${unit}.` },
    { t: 'Yes: residuals with no pattern make a model good enough for any use', mc: MC.patternless, say: 'No pattern is not enough. The misses also have to be small next to what the use allows.' },
    { t: 'It cannot be judged without R²', say: 'The residuals are in the units of the use: compare them with the tolerance directly.' },
  ];
  return choice(R, {
    id: `sizeTol-${n}`, family: 'sizeTol',
    prompt: `A model for the ${S.what} has the residual plot shown (no pattern). ${cap(use[c.id]!)} ${Tt}. Is the model good enough for that use?`,
    board: `|e| \\le ${c.money ? `\\$${nT(T, 0)}` : nT(T, 2)}\\ ?`,
    solution: [`The residuals reach about ±${nH(rd(m, S.dp), S.dp)} ${unit}.`, ok ? `That is well inside ${Tt}: good enough for this use.` : `That is far more than ${Tt}: not good enough for this use, even with no pattern.`],
    picture: { g: residPlot(c, xs, es) },
  }, opts);
};

// ===================== least-squares-criterion =====================
function zeroSumInts(R: () => number, n: number, lo: number): number[] {
  return until(() => { const e = Array.from({ length: n - 1 }, () => int(R, -lo, lo)); const last = -e.reduce((s, v) => s + v, 0); return [...e, last]; }, e => Math.abs(e[e.length - 1]!) <= lo && e.some(v => v !== 0));
}
const sq = (e: readonly number[]) => e.reduce((s, v) => s + v * v, 0);
export const sseCompare: NGen = (R, n) => {
  const N = int(R, 4, 6), xs = Array.from({ length: N }, (_, i) => i + 1);
  const { eA, eB } = until(() => ({ eA: zeroSumInts(R, N, 4), eB: zeroSumInts(R, N, 4) }), t => sq(t.eA) !== sq(t.eB) && Math.abs(sq(t.eA) - sq(t.eB)) >= 4 && t.eA.join() !== t.eB.join());
  const zA = eA.filter(v => v === 0).length, zB = eB.filter(v => v === 0).length;
  const best = sq(eA) < sq(eB) ? 'A' : 'B', more = zA > zB ? 'A' : zB > zA ? 'B' : null;
  const opts: Opt[] = [
    { t: 'Curve A', ok: best === 'A', key: 'A', say: best === 'A' ? `Right. Squared and added: A gives ${sq(eA)}, B gives ${sq(eB)}. Smaller wins.` : `Square and add: A gives ${sq(eA)}, B gives ${sq(eB)}. The smaller sum wins.` },
    { t: 'Curve B', ok: best === 'B', key: 'B', say: best === 'B' ? `Right. Squared and added: A gives ${sq(eA)}, B gives ${sq(eB)}. Smaller wins.` : `Square and add: A gives ${sq(eA)}, B gives ${sq(eB)}. The smaller sum wins.` },
    { t: 'They fit equally well: both residual sums are 0', mc: MC.signedTotal, say: 'Signed residuals cancel, so their sum says nothing. Least squares squares them first.' },
    ...(more ? [{ t: 'The curve that passes exactly through more of the points', key: more, mc: MC.onCurve, say: 'Least squares does not count hits; it adds the squared misses of every point.' } as Opt] : []),
  ];
  return choice(R, {
    id: `sseCompare-${n}`, family: 'sseCompare',
    prompt: `${calc(false)}Two candidate curves for the same ${N} points. Curve A's residuals are ${eA.map(v => nH(v)).join(', ')}; curve B's are ${eB.map(v => nH(v)).join(', ')}. Both lists add to 0. By the least-squares criterion, which curve fits better?`,
    board: '\\sum e^2\\ ?',
    solution: [`Curve A: ${eA.map(v => `(${nH(v)})²`).join(' + ')} = ${sq(eA)}.`, `Curve B: ${eB.map(v => `(${nH(v)})²`).join(' + ')} = ${sq(eB)}.`, `The smaller sum of squared residuals wins: curve ${best}.`],
    picture: { card: { cols: [{ head: 'x', cells: xs.map(String) }, { head: 'e (A)', cells: eA.map(v => nH(v)) }, { head: 'e (B)', cells: eB.map(v => nH(v)) }] } },
  }, opts, true);
};
export const sseCompute: NGen = (R, n) => {
  const c = ctxOf(R, ['ball', 'power', 'drug', 'cells']);
  const N = int(R, 4, 6);
  const t = until(() => {
    const yh = Array.from({ length: N }, () => int(R, 10, 60)).sort((a, b) => (c.fam === 'exp' && c.id === 'drug' ? b - a : a - b));
    const e = Array.from({ length: N }, () => int(R, -4, 4));
    return { yh, e, y: yh.map((v, i) => v + e[i]!) };
  }, t => new Set(t.yh).size === N && t.e.filter(v => v !== 0).length >= 3 && t.e.reduce((s, v) => s + v, 0) !== sq(t.e) && t.e.reduce((s, v) => s + Math.abs(v), 0) !== sq(t.e) && t.y.every(v => v > 0));
  const { yh, e, y } = t, S = sq(e), xs = Array.from({ length: N }, (_, i) => i + 1);
  const signed = e.reduce((s, v) => s + v, 0), abs = e.reduce((s, v) => s + Math.abs(v), 0);
  return numItem({
    id: `sseCompute-${n}`, family: 'sseCompute',
    prompt: `${calc(false)}A supplied curve predicts ŷ = ${yh.join(', ')} for ${N} observations y = ${y.join(', ')} (in the same order). What is the sum of the squared residuals, Σ(y − ŷ)²?`,
    board: '\\sum (y - \\hat{y})^2 = \\,?', unit: '',
    solution: [`Residuals y − ŷ: ${e.map(v => nH(v)).join(', ')}.`, `Squares: ${e.map(v => v * v).join(' + ')} = ${ans(S)}.`],
    picture: { card: { cols: [{ head: 'x', cells: xs.map(String) }, { head: 'y', cells: y.map(String) }, { head: 'ŷ', cells: yh.map(String) }] } },
  }, S, `Right: ${S}. Every miss counts, big ones most.`,
  [[signed, MC.signedTotal, `That is the signed sum, where plus and minus misses cancel. Square each residual first.`], [abs, undefined, 'That adds the sizes of the misses. Least squares adds their squares.']],
  'Find each residual y − ŷ, square it, and add the squares.');
};
