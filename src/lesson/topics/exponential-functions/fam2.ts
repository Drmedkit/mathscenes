// fam2.ts: stage 2 families (the model a·b^t, the initial value, growth or decay from b, point graphs, the
// continuous curve, the factor from a table or graph, back to t = 0, factor and percent, writing a model, predicting).
// Pure: no DOM.
import { type Base, type Gen, type Opt, type PCand, MC, MODEL_FORM, ans, choice, int, numItem, pairItem, pick, shuffle, sup, tI, xI } from './common';
import { nH, nT, nearTie, pw, r9, rnd, usd, usdT, vals } from './expo';
import { type GItem, type GPic, niceAxis } from './pictures';
import { diffLabels, ratioLabels, tab } from './fam1';

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
/** a·b^t in HTML: 3 · 2<sup>t</sup>, 400(0.85)<sup>t</sup> */
const mH = (a: number, b: number, v = tI) => (Number.isInteger(b) && b > 0 ? `${nH(a)} · ${nH(b)}${sup(v)}` : `${nH(a)}(${nH(b)})${sup(v)}`);
const mT = (a: number, b: number, v = 't') => (Number.isInteger(b) && b > 0 ? `${nT(a)}\\cdot ${nT(b)}^{${v}}` : `${nT(a)}(${nT(b)})^{${v}}`);

// ===== model-form: evaluate a·b^t =====
export const evalModel: Gen = (R, n) => {
  for (;;) {
    const b = pick(R, [2, 3, 0.5, 2, 3, 5]), t = int(R, 0, b === 5 ? 3 : 5);
    const a = b === 0.5 ? pick(R, [32, 64, 96, 160]) : int(R, 2, 10);
    const v = pw(a, b, t), wrong = (a * b) ** t, prod = r9(a * b * t);
    if (v > 5000 || wrong === v) continue;
    const f = pick(R, ['f', 'g', 'h']);
    const b0: Base = {
      id: `evalModel-${n}`, family: 'evalModel',
      prompt: `<i>${f}</i>(${tI}) = ${mH(a, b)}. Find <i>${f}</i>(${t}).`,
      board: `${f}(t) = ${mT(a, b)}\\qquad ${f}(${t}) = \\,?`,
      solution: t === 0 ? [`${nH(b)}${sup(0)} = 1 (no factors yet).`, `<i>${f}</i>(0) = ${nH(a)} · 1 = ${ans(nH(v))}.`]
        : [`The exponent counts factors of ${nH(b)} only: ${nH(b)}${sup(t)} = ${Array(t).fill(nH(b)).join(' · ')} = ${nH(pw(1, b, t))}.`, `Then times ${nH(a)}: <i>${f}</i>(${t}) = ${nH(a)} · ${nH(pw(1, b, t))} = ${ans(nH(v))}.`],
    };
    return numItem(b0, v, `Yes: ${nH(a)} · ${nH(b)}${sup(t)} = ${nH(v)}.`, [
      [r9(wrong), MC.wrongPart, `The exponent belongs to ${nH(b)} only, not to ${nH(a)} · ${nH(b)}. Work out ${nH(b)}${sup(t)} first, then multiply by ${nH(a)}.`],
      [prod, MC.powProd, `${nH(b)}${sup(t)} means ${t} factors of ${nH(b)} multiplied, not ${nH(b)} × ${t}.`],
    ], `Work out ${nH(b)}${sup(t)} (repeated multiplication), then multiply by ${nH(a)}.`);
  }
};

// ===== model-form: which formula makes the table =====
export const formFromTable: Gen = (R, n) => {
  for (;;) {
    const a = int(R, 2, 9), b = pick(R, [2, 3, 4, 5]);
    if (a === b) continue;
    const ts = range(0, 3), vs = vals(a, b, ts);
    const cands = [
      { t: `<i>y</i> = ${a} · ${b}${sup(tI)}`, f: (x: number) => a * b ** x, ok: true, mc: undefined as string | undefined, say: `Yes: start at ${a}, then ×${b} each step.` },
      { t: `<i>y</i> = ${b} · ${a}${sup(tI)}`, f: (x: number) => b * a ** x, mc: MC.aAsB, say: `That starts at ${b} and multiplies by ${a}. The table starts at ${a} (t = 0) and multiplies by ${b}.` },
      { t: `<i>y</i> = ${a} · ${b} · ${tI}`, f: (x: number) => a * b * x, mc: MC.powProd, say: `${a} · ${b}t gives 0 at t = 0 and adds the same amount each step. The table multiplies by ${b}.` },
      { t: `<i>y</i> = (${a} · ${b})${sup(tI)}`, f: (x: number) => (a * b) ** x, mc: MC.wrongPart, say: `(${a} · ${b})${sup('t')} is 1 at t = 0 and multiplies by ${a * b}. Only ${b} carries the exponent.` },
    ];
    if (cands.filter(c => ts.every((x, i) => Math.abs(c.f(x) - vs[i]!) < 1e-9)).length !== 1) continue;
    return choice(R, {
      id: `formFromTable-${n}`, family: 'formFromTable',
      prompt: 'Which formula gives exactly this table?',
      board: `t:\\ 0,\\ 1,\\ 2,\\ 3\\qquad y:\\ ${vs.map(v => nT(v)).join(',\\ ')}`,
      solution: [`At t = 0 the value is ${a}: that is <i>a</i>.`, `Each step multiplies by ${vs[1]! / vs[0]!}: that is <i>b</i>.`],
      picture: { t: tab('t', ts, 'y', vs, { ratios: 's' }) },
    }, cands.map(({ t, ok, mc, say }) => ({ t, ok, mc, say })));
  }
};

// ===== initial-value: read a from an equation in context =====
const AV = [
  { f: 'P', what: 'the number of people in a town', t: 'years after 2020', a: [2400, 8500, 12000, 35000], b: [1.02, 1.03, 1.05], ask: 'How many people lived in the town in 2020?', unit: 'people' },
  { f: 'V', what: 'a car’s value in dollars', t: 'years after it was bought', a: [18000, 24000, 32000], b: [0.85, 0.88, 0.9], ask: 'What was the car worth when it was bought?', unit: 'dollars' },
  { f: 'N', what: 'the number of bacteria in a dish', t: 'hours after the start', a: [50, 300, 1200, 5000], b: [2, 3, 1.5], ask: 'How many bacteria were in the dish at the start?', unit: 'bacteria' },
  { f: 'M', what: 'the mg of medicine in the blood', t: 'hours after the dose', a: [200, 250, 500, 800], b: [0.8, 0.75, 0.6], ask: 'How many mg were in the blood right after the dose?', unit: 'mg' },
];
export const readA: Gen = (R, n) => {
  const C = pick(R, AV), a = pick(R, C.a), b = pick(R, C.b);
  const b0: Base = {
    id: `readA-${n}`, family: 'readA',
    prompt: `<i>${C.f}</i>(${tI}) = ${mH(a, b)} gives ${C.what}, ${tI} ${C.t}. ${C.ask}`,
    board: `${C.f}(t) = ${mT(a, b)}`, unit: C.unit,
    solution: [`The start is ${tI} = 0: <i>${C.f}</i>(0) = ${nH(a)} · ${nH(b)}${sup(0)} = ${nH(a)} · 1.`, `So the start is <i>a</i> = ${ans(nH(a))}.`],
  };
  return numItem(b0, a, `Yes: at ${tI} = 0 the factor ${nH(b)} has not acted yet, so <i>${C.f}</i>(0) = ${nH(a)}.`, [
    [b, MC.aAsB, `${nH(b)} is the factor for each step, not the starting amount. Put ${tI} = 0 in: ${nH(b)}${sup(0)} = 1.`],
    [pw(a, b, 1), undefined, `That is the value after one step (${tI} = 1). The start is ${tI} = 0.`],
  ], `Put ${tI} = 0 into the formula.`);
};

// ===== initial-value: the t = 0 row of a table that starts earlier =====
export const readATable: Gen = (R, n) => {
  const b = pick(R, [2, 3, 0.5, 1.5]), lo = -int(R, 1, 2);
  const m = int(R, 1, 5);
  const a = b === 2 ? m * 4 : b === 0.5 ? m : m * 9;
  const ts = range(lo, lo + 4), vs = vals(a, b, ts);
  const b0: Base = {
    id: `readATable-${n}`, family: 'readATable',
    prompt: `The table comes from <i>y</i> = <i>a</i> · <i>b</i>${sup(xI)}. It starts at <i>x</i> = ${nH(lo)}, where <i>y</i> = ${nH(vs[0]!)}. What is the initial value <i>a</i>?`,
    board: `y = a\\cdot b^{x}\\qquad a = \\,?`,
    solution: [`The initial value is the output at <i>x</i> = 0, not the first row.`, `The row <i>x</i> = 0 shows ${ans(nH(a))}.`],
    picture: { t: tab('x', ts, 'y', vs) },
  };
  return numItem(b0, a, `Yes: <i>a</i> is the value at <i>x</i> = 0: ${nH(a)}.`, [
    [vs[0]!, MC.firstOut, `${nH(vs[0]!)} is the first row, at <i>x</i> = ${nH(lo)}. The initial value is the output at <i>x</i> = 0.`],
    [b, MC.aAsB, `${nH(b)} is the factor between rows (<i>b</i>). The initial value <i>a</i> is the output at <i>x</i> = 0.`],
  ], `Find the row where x = 0.`);
};

// ===== classify-by-b: growth or decay from the equation =====
export const growOrDecay: Gen = (R, n) => {
  const k = int(R, 0, 7);
  let a: number, bt: string, bh: string, b: number;
  const big = pick(R, [500, 1200, 5000, 8000]), small = pick(R, [0.2, 0.4, 0.5, 0.75]);
  if (k === 0) { a = small; b = pick(R, [2, 3]); bt = `\\cdot ${nT(b)}`; bh = ` · ${nH(b)}`; }
  else if (k === 1) { a = big; b = pick(R, [0.97, 0.9, 0.85]); bt = `(${nT(b)})`; bh = `(${nH(b)})`; }
  else if (k === 2) { a = big; b = pick(R, [1.03, 1.05]); bt = `(${nT(b)})`; bh = `(${nH(b)})`; }
  else if (k === 3) { a = int(R, 3, 60); b = 0.5; bt = '\\left(\\tfrac{1}{2}\\right)'; bh = '(½)'; }
  else if (k === 4) { const r = pick(R, [4, 6, 8]); a = int(R, 20, 300); b = 1 + r / 100; bt = `(1 + ${nT(r / 100)})`; bh = `(1 + ${nH(r / 100)})`; }
  else if (k === 5) { const r = pick(R, [4, 6, 8]); a = int(R, 20, 300); b = 1 - r / 100; bt = `(1 - ${nT(r / 100)})`; bh = `(1 − ${nH(r / 100)})`; }
  else if (k === 6) { a = small; b = pick(R, [1.5, 1.2]); bt = `(${nT(b)})`; bh = `(${nH(b)})`; }
  else { a = pick(R, [7, 12, 40]); b = 1; bt = '(1)'; bh = '(1)'; }
  const K = b > 1 ? 'g' : b < 1 ? 'd' : 'c';
  const opts: Opt[] = [
    { t: 'Growth: <i>b</i> > 1', ok: K === 'g', mc: K === 'd' && a > 1 ? MC.allUp : undefined, say: K === 'g' ? `Yes: b = ${nH(b)} is more than 1, so each step makes y bigger, whatever a is.` : K === 'd' ? `b = ${nH(b)} is less than 1: each step keeps only part of y. A big start does not make it grow.` : 'b = 1: times 1 changes nothing.' },
    { t: 'Decay: 0 &lt; <i>b</i> &lt; 1', ok: K === 'd', mc: K === 'g' && a < 1 ? MC.aAsB : undefined, say: K === 'd' ? `Yes: b = ${nH(b)} is between 0 and 1, so each step makes y smaller.` : K === 'g' ? `a = ${nH(a)} is only the start. The factor is b = ${nH(b)} > 1, so y grows.` : 'b = 1: times 1 changes nothing.' },
    { t: 'Neither: <i>y</i> stays the same', ok: K === 'c', say: K === 'c' ? 'Yes: b = 1, and multiplying by 1 changes nothing.' : `b = ${nH(b)} is not 1, so y changes every step.` },
  ];
  return choice(R, {
    id: `growOrDecay-${n}`, family: 'growOrDecay',
    prompt: `<i>y</i> = ${nH(a)}${bh}${sup(xI)}. Growth, decay, or neither?`,
    board: `y = ${nT(a)}${bt}^{x}`,
    solution: [`Only <i>b</i> decides: it multiplies <i>y</i> at every step. Here <i>b</i> = ${nH(b)}.`, K === 'g' ? `${nH(b)} > 1: growth.` : K === 'd' ? `0 &lt; ${nH(b)} &lt; 1: decay.` : 'b = 1: neither.'],
  }, opts, true);
};

// ===== classify-by-b: which model decays (or grows) =====
export const pickModel: Gen = (R, n) => {
  const want = R() < 0.5 ? 'd' : 'g';
  const decay = [`${nH(pick(R, [5000, 1200, 800]))}(${nH(pick(R, [0.96, 0.9, 0.75]))})${sup(tI)}`, `${nH(pick(R, [60, 90]))}(1 − ${nH(pick(R, [0.05, 0.1]))})${sup(tI)}`, `${nH(pick(R, [3000, 900]))}(${nH(pick(R, [0.99, 0.8]))})${sup(tI)}`];
  const grow = [`${nH(pick(R, [0.3, 0.5]))} · ${pick(R, [2, 3])}${sup(tI)}`, `${nH(pick(R, [12, 40]))}(1 + ${nH(pick(R, [0.04, 0.08]))})${sup(tI)}`, `${nH(pick(R, [200, 450]))}(${nH(pick(R, [1.02, 1.07]))})${sup(tI)}`];
  const right = want === 'd' ? pick(R, decay) : pick(R, grow);
  const others = want === 'd' ? grow : decay;
  const opts: Opt[] = [{ t: `<i>y</i> = ${right}`, ok: true, say: `Yes: its factor is ${want === 'd' ? 'between 0 and 1' : 'more than 1'}.` }];
  others.forEach((o, i) => opts.push({ t: `<i>y</i> = ${o}`, mc: want === 'd' && i === 0 ? MC.aAsB : want === 'g' && i !== 1 ? MC.allUp : undefined,
    say: want === 'd' && i === 0 ? 'Its start is small, but the factor is more than 1: it grows.' : want === 'd' ? 'Its factor is more than 1: it grows.' : 'Its start is large, but its factor is below 1: it shrinks every step.' }));
  shuffle(R, opts);
  const h2t = (x: string) => x.replace(/<i>y<\/i>/g, 'y').replace(/<sup>t<\/sup>/g, '^{t}').replace(/(\d),(\d)/g, '$1{,}$2').replace(/−/g, '-').replace(/ · /g, '\\cdot ');
  return choice(R, {
    id: `pickModel-${n}`, family: 'pickModel',
    prompt: `Which model shows exponential <b>${want === 'd' ? 'decay' : 'growth'}</b>?`,
    board: opts.map(o => h2t(o.t)).join('\\qquad '),
    solution: [`Ignore the start a: the factor b decides. ${want === 'd' ? 'Decay means 0 &lt; b &lt; 1.' : 'Growth means b > 1.'}`, `Only one model has such a b.`],
  }, opts, true);
};

// ===== graph-whole-inputs: match a point graph to its formula =====
export const matchPoints: Gen = (R, n) => {
  for (;;) {
    const b = pick(R, [2, 3, 0.5]), a = b === 0.5 ? pick(R, [16, 32, 48]) : int(R, 1, 6);
    const N = b === 3 ? 3 : 4;
    const b2 = b === 2 ? 3 : b === 3 ? 2 : 0.25, a2 = b === 0.5 ? a / 2 : a + pick(R, [1, 2]);
    if (a === b || Math.round(a) !== a) continue;
    const xs = range(0, N), vs = vals(a, b, xs);
    const fH = (p: number, q: number) => `<i>y</i> = ${Number.isInteger(q) ? `${nH(p)} · ${nH(q)}${sup(xI)}` : `${nH(p)}(${nH(q)})${sup(xI)}`}`;
    const opts: Opt[] = [
      { t: fH(a, b), ok: true, say: `Yes: the point at x = 0 is (0, ${nH(a)}) and each point is ×${nH(b)} the one before.` },
      { t: fH(b, a), mc: MC.aAsB, say: `That starts at ${nH(b)}. The graph’s point at x = 0 is (0, ${nH(a)}), so a = ${nH(a)}.` },
      { t: fH(a, b2), say: `Same start, but check the next point: ${nH(a)} × ${nH(b2)} = ${nH(a * b2)}, not ${nH(vs[1]!)}.` },
      { t: fH(a2, b), mc: MC.firstOut, say: `The point at x = 0 is (0, ${nH(a)}), not (0, ${nH(a2)}).` },
    ];
    const y = { ...niceAxis(0, Math.max(...vs), 10), name: 'y' };
    return choice(R, {
      id: `matchPoints-${n}`, family: 'matchPoints',
      prompt: `The points show <i>y</i> = <i>a</i> · <i>b</i>${sup(xI)} at <i>x</i> = 0, 1, …, ${N}. Which formula is it?`,
      board: `(0,\\ ${nT(a)}),\\ (1,\\ ${nT(vs[1]!)}),\\ \\dots`,
      solution: [`At x = 0: (0, ${nH(a)}), so a = ${nH(a)}.`, `From x = 0 to x = 1: ${nH(a)} → ${nH(vs[1]!)}, ×${nH(b)}, so b = ${nH(b)}.`],
      picture: { g: { x: { min: 0, max: N + 1, step: 1, name: 'x' }, y, items: [{ kind: 'pts', key: 'P', a, b, xs, named: [0, 1] }] } },
    }, opts);
  }
};

// ===== graph-whole-inputs: same a or same b =====
export const twoGraphs: Gen = (R, n) => {
  const sameA = R() < 0.5;
  let a1: number, b1: number, a2: number, b2: number;
  if (sameA) { a1 = a2 = int(R, 1, 4); [b1, b2] = R() < 0.5 ? [2, 3] : [3, 2]; }
  else { b1 = b2 = 2; a1 = int(R, 1, 3); a2 = a1 + int(R, 1, 3); if (R() < 0.5) [a1, a2] = [a2, a1]; }
  const xs = range(0, 3), v1 = vals(a1, b1, xs), v2 = vals(a2, b2, xs);
  const bigger = b1 > b2 ? 'amber' : b2 > b1 ? 'teal' : 'same';
  const biggerA = a1 > a2 ? 'amber' : 'teal';
  const opts: Opt[] = [
    { t: 'The amber points have the larger factor <i>b</i>', ok: bigger === 'amber', mc: bigger === 'same' && biggerA === 'amber' ? MC.aAsB : undefined, say: bigger === 'amber' ? `Yes: amber is ×${b1} per step, teal ×${b2}.` : bigger === 'same' ? `Amber is higher because it STARTS higher (${a1} vs ${a2}). Both are ×${b1} per step.` : `Amber is ×${b1} per step, teal ×${b2}.` },
    { t: 'The teal points have the larger factor <i>b</i>', ok: bigger === 'teal', mc: bigger === 'same' && biggerA === 'teal' ? MC.aAsB : undefined, say: bigger === 'teal' ? `Yes: teal is ×${b2} per step, amber ×${b1}.` : bigger === 'same' ? `Teal is higher because it STARTS higher (${a2} vs ${a1}). Both are ×${b2} per step.` : `Teal is ×${b2} per step, amber ×${b1}.` },
    { t: 'Both have the same factor <i>b</i>', ok: bigger === 'same', say: bigger === 'same' ? `Yes: both multiply by ${b1} each step; they only start at different values.` : `Divide neighbours: amber ×${b1}, teal ×${b2}. Not the same.` },
  ];
  return choice(R, {
    id: `twoGraphs-${n}`, family: 'twoGraphs',
    prompt: `Two exponential point graphs <i>y</i> = <i>a</i> · <i>b</i><sup>x</sup>: amber starts at ${a1}, teal at ${a2} (the table lists their values). Which has the larger factor <i>b</i>?`,
    board: '\\text{larger } b\\,?',
    solution: [`Amber: ${v1.join(', ')} (×${b1}). Teal: ${v2.join(', ')} (×${b2}).`, `Starting values: ${a1} and ${a2}. Only the ratio between neighbours is b.`],
    picture: {
      g: { x: { min: 0, max: 4, step: 1, name: 'x' }, y: { ...niceAxis(0, Math.max(...v1, ...v2), 10), name: 'y' }, items: [{ kind: 'pts', key: 'A', a: a1, b: b1, xs, col: 'first' }, { kind: 'pts', key: 'B', a: a2, b: b2, xs, col: 'second' }] },
      t: { tName: 'x', ts: xs.map(x => nH(x)), cols: [{ name: 'amber', vals: v1.map(v => nH(v)) }, { name: 'teal', vals: v2.map(v => nH(v)), col: 'second' }] },
    },
  }, opts, true);
};

// ===== graph-whole-inputs: decay points stay positive =====
export const decayPoints: Gen = (R, n) => {
  const a = pick(R, [32, 48, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 400]), h = a / 2;
  const xs = range(0, 4), vs = vals(a, 0.5, xs);
  const opts: Opt[] = [
    { t: `They keep halving (${nH(pw(a, 0.5, 5))}, ${nH(pw(a, 0.5, 6))}, …) and stay above 0`, ok: true, say: 'Yes: half of a positive number is still positive. The points get closer to 0 but never reach it.' },
    { t: 'They reach 0 and then go below the x-axis', mc: MC.negOut, say: `Each point is half of the one before. Half of a positive number is positive: no point is ever 0 or below.` },
    { t: `They drop by ${nH(h)} each step until they reach 0`, mc: MC.constAmount, say: `${nH(h)} is only the first drop. Then the drops halve too: ${nH(h / 2)}, ${nH(h / 4)}, …` },
    { t: `They stop at a lowest point at x = 5 and then rise`, mc: MC.leveling, say: 'Every step multiplies by 0.5, so every point is lower than the one before. There is no turning point.' },
  ];
  return choice(R, {
    id: `decayPoints-${n}`, family: 'decayPoints',
    prompt: `The points show <i>y</i> = ${nH(a)}(0.5)${sup(xI)} at <i>x</i> = 0 to 4. What happens at <i>x</i> = 5, 6, 7, …?`,
    board: `y = ${nT(a)}(0.5)^{x}`,
    solution: [`Each step multiplies by 0.5: ${vs.map(v => nH(v)).join(', ')}, ${nH(pw(a, 0.5, 5))}, ${nH(pw(a, 0.5, 6))}, …`, 'Half of a positive number is positive: the points approach 0 and stay above it.'],
    picture: { g: { x: { min: 0, max: 8, step: 1, name: 'x' }, y: { ...niceAxis(0, a, 8), name: 'y' }, items: [{ kind: 'pts', key: 'P', a, b: 0.5, xs }], solveItems: [{ kind: 'pts', key: 'Q', a, b: 0.5, xs: [5, 6, 7], col: 'link' }] } },
  }, opts);
};

// ===== continuous-graph: the range =====
export const rangeChoice: Gen = (R, n) => {
  const neg = R() < 0.3, b = pick(R, [2, 1.5, 0.5]), a = (b === 0.5 ? pick(R, [2, 4]) : pick(R, [1, 2, 3])) * (neg ? -1 : 1);
  const fT = `y = ${a < 0 ? '-' : ''}${nT(Math.abs(a))}(${nT(b)})^{x}`;
  const lo = -3, hi = 6;
  const ys = range(lo, hi).map(x => a * b ** x);
  const cap = Math.max(...ys.map(Math.abs)) > 40 ? 40 : Math.max(...ys.map(Math.abs));
  const y = neg ? { ...niceAxis(-cap, 0, 10), name: 'y' } : { ...niceAxis(0, cap, 10), name: 'y' };
  const R1 = neg ? 'y < 0' : 'y > 0', R2 = neg ? 'y ≤ 0' : 'y ≥ 0', R3 = neg ? 'y > 0' : 'y < 0';
  const opts: Opt[] = [
    { t: R1, ok: true, say: `Yes: ${nH(b)}${sup('x')} is always positive, so ${nH(a)} times it is always ${neg ? 'negative' : 'positive'}. It gets close to 0 but never reaches it.` },
    { t: R2, mc: MC.reached, say: `0 is never an output: ${nH(Math.abs(a))} · ${nH(b)}${sup('x')} is never 0. The curve only approaches y = 0.` },
    { t: 'all real numbers', mc: neg ? undefined : MC.negOut, say: `${nH(b)}${sup('x')} with a positive base is always positive, so y never ${neg ? 'becomes positive' : 'becomes negative'}.` },
    { t: R3, say: `Look at the sign of a = ${nH(a)}: every output has that sign.` },
  ];
  return choice(R, {
    id: `rangeChoice-${n}`, family: 'rangeChoice',
    prompt: `A graphing app draws <i>y</i> = ${nH(a)}(${nH(b)})${sup(xI)}. What is its range?`,
    board: fT,
    solution: [`${nH(b)}${sup('x')} > 0 for every x.`, `So y = ${nH(a)} · (positive) is always ${neg ? 'negative' : 'positive'} and never 0: the range is ${R1}.`],
    picture: { g: { x: { min: lo, max: hi, step: 1, name: 'x' }, y, items: [{ kind: 'exp', key: 'C', a, b }] } },
  }, opts);
};

// ===== continuous-graph: the asymptote is not the last table value =====
export const asymptote: Gen = (R, n) => {
  const grow = R() < 0.6;
  const a = int(R, 2, 9), b = grow ? 2 : 0.5;
  const xs = grow ? range(-3, 1) : range(-1, 3), vs = vals(a, b, xs);
  const last = grow ? vs[0]! : vs[vs.length - 1]!;
  const dir = grow ? 'decreases (goes left)' : 'increases (goes right)';
  const opts: Opt[] = [
    { t: 'It approaches 0 but never reaches it', ok: true, say: `Yes: every step ${grow ? 'left halves' : 'right halves'} y again, so y gets as close to 0 as you like and is never 0.` },
    { t: `It approaches ${nH(last)}`, mc: MC.lastTable, say: `${nH(last)} is just where the table stops. One more step gives ${nH(last / 2)}: y keeps getting closer to 0.` },
    { t: `It reaches 0 at x = ${grow ? xs[0]! - 1 : xs[xs.length - 1]! + 1}`, mc: MC.reached, say: `At that x, y = ${nH(last / 2)}, not 0. Halving a positive number never gives 0.` },
    { t: 'It becomes negative', mc: MC.negOut, say: `${nH(a)} times a power of ${nH(b)} is always positive.` },
  ];
  const Y = Math.max(...vals(a, b, range(-3, 3)));
  return choice(R, {
    id: `asymptote-${n}`, family: 'asymptote',
    prompt: `A calculator table for <i>y</i> = ${nH(a)}(${nH(b)})${sup(xI)} ends at <i>x</i> = ${grow ? xs[0] : xs[xs.length - 1]}, where <i>y</i> = ${nH(last)}. As <i>x</i> ${dir} without end, what does <i>y</i> do?`,
    board: `y = ${nT(a)}(${nT(b)})^{x}`,
    solution: [`Each step ${grow ? 'to the left' : 'to the right'} multiplies y by 0.5: ${nH(last)}, ${nH(last / 2)}, ${nH(last / 4)}, …`, 'y approaches 0 and never reaches it: the asymptote is y = 0.'],
    picture: {
      g: { x: { min: -4, max: 4, step: 1, name: 'x' }, y: { ...niceAxis(0, Math.min(Y, 24), 8), name: 'y' }, items: [{ kind: 'exp', key: 'C', a, b }] },
      t: { tName: 'x', ts: xs.map(x => nH(x)), cols: [{ name: 'y', vals: vs.map(v => nH(v, 4)) }] },
    },
  }, opts);
};

// ===== continuous-graph: the domain =====
export const domainChoice: Gen = (R, n) => {
  const b = pick(R, [2, 3, 0.5, 1.5]), a = int(R, 1, 6);
  const opts: Opt[] = [
    { t: 'All real numbers', ok: true, say: `Yes: any x works in ${nH(b)}${sup('x')}: negative, fractional, anything. The app draws an unbroken curve.` },
    { t: '<i>x</i> ≥ 0', mc: MC.ctxDomain, say: 'x ≥ 0 is a limit a STORY might add (time after a start). The function itself takes negative x too: the curve goes on to the left.' },
    { t: 'Whole numbers 0, 1, 2, …', mc: MC.wholeOnly, say: 'Whole inputs give the points of a table, but the function is defined between them and to the left too: the graph is a smooth curve.' },
    { t: '<i>x</i> > 0', mc: MC.ctxDomain, say: `x = 0 gives ${nH(a)}, and negative x work too. Nothing is left out.` },
  ];
  const Y = Math.max(...vals(a, b, range(-3, 4)));
  return choice(R, {
    id: `domainChoice-${n}`, family: 'domainChoice',
    prompt: `What is the domain of the function <i>y</i> = ${Number.isInteger(b) ? `${nH(a)} · ${nH(b)}${sup(xI)}` : `${nH(a)}(${nH(b)})${sup(xI)}`} (no story, just the function)?`,
    board: `y = ${mT(a, b, 'x')}`,
    solution: [`Any real x can be an exponent of ${nH(b)}: ${nH(b)}${sup('−2.5')}, ${nH(b)}${sup('0')}, ${nH(b)}${sup('3.7')} all have values.`, 'So the domain is all real numbers.'],
    picture: { g: { x: { min: -4, max: 4, step: 1, name: 'x' }, y: { ...niceAxis(0, Math.min(Y, 30), 8), name: 'y' }, items: [{ kind: 'exp', key: 'C', a, b }] } },
  }, opts);
};

// ===== factor-from-table =====
const FT: [number, number[]][] = [[0.5, [64, 96, 128, 160]], [0.75, [64, 128, 256]], [0.8, [625, 1250, 2500]], [1.2, [125, 250, 1000]], [1.5, [8, 16, 32, 48]], [2, [3, 5, 7, 12]], [2.5, [8, 16, 24]], [3, [2, 4, 5, 10]]];
export const factorTable: Gen = (R, n, sg) => {
  const [b, as] = pick(R, FT), a = pick(R, as);
  const t0 = pick(R, [0, 0, 1, 3]), ts = range(t0, t0 + 3), vs = vals(a, b, ts.map(t => t - t0));
  const d = r9(vs[1]! - vs[0]!), inv = r9(vs[0]! / vs[1]!);
  const graph = sg === 'factor-from-table' && R() < 0.4 && Math.max(...vs) <= 200;
  const b0: Base = {
    id: `factorTable-${n}`, family: 'factorTable',
    prompt: `The ${graph ? 'points come' : 'table comes'} from an exponential function, with <i>t</i> going up by 1, from <i>t</i> = ${t0} (<i>y</i> = ${nH(vs[0]!)}). What is the factor <i>b</i> per unit of <i>t</i>?`,
    board: `b = \\dfrac{y(t+1)}{y(t)} = \\,?`,
    solution: [`Divide each value by the one before: ${vs.slice(1).map((v, i) => `${nH(v)} ÷ ${nH(vs[i]!)}`).join(', ')}.`, `Every ratio is ${ans(nH(b))}.`],
    picture: graph
      ? { g: { x: { min: t0 === 0 ? 0 : t0 - 1, max: t0 + 4, step: 1, name: 't' }, y: { ...niceAxis(0, Math.max(...vs), 10), name: 'y' }, items: [{ kind: 'dots', key: 'P', pts: ts.map((t, i) => [t, vs[i]!]), named: [0, 1, 2, 3] }] } }
      : { t: tab('t', ts, 'y', vs, { ratios: 's' }) },
  };
  return numItem(b0, b, `Yes: each value is ${nH(b)} times the one before.`, [
    [inv, MC.inverted, `That is this value divided by the NEXT one. The factor is next ÷ this: ${nH(vs[1]!)} ÷ ${nH(vs[0]!)}.`],
    [d, MC.asDiff, `${nH(d)} is the difference. The factor is a ratio: ${nH(vs[1]!)} ÷ ${nH(vs[0]!)}.`],
  ], `Divide a value by the one before it.`);
};

// ===== backsolve-initial: the table starts at t = 1 or 2 =====
export const backA: Gen = (R, n) => {
  const b = pick(R, [2, 3, 0.5, 1.5]), k = int(R, 1, 2);
  const a = b === 0.5 ? pick(R, [40, 80, 120]) : b === 1.5 ? pick(R, [16, 32, 64]) : int(R, 2, 20);
  const ts = range(0, k + 2), vs = vals(a, b, ts);
  const first = vs[k]!;
  const b0: Base = {
    id: `backA-${n}`, family: 'backA',
    prompt: `The table of an exponential function starts at <i>t</i> = ${k}. What is the value at <i>t</i> = 0?`,
    board: `y(${k}) = ${nT(first)}\\qquad y(${k + 1}) = ${nT(vs[k + 1]!)}\\qquad y(0) = \\,?`,
    solution: [`The factor: ${nH(vs[k + 1]!)} ÷ ${nH(first)} = ${nH(b)}.`, `Go back ${k} step${k > 1 ? 's' : ''} by dividing: ${nH(first)}${' ÷ ' + nH(b)}${k > 1 ? ' ÷ ' + nH(b) : ''} = ${ans(nH(a))}.`],
    picture: { t: { tName: 't', ts: ts.map(x => nH(x)), cols: [{ name: 'y', vals: vs.map((v, i) => (i < k ? null : nH(v))), reveal: vs.map((v, i) => (i < k ? nH(v) : null)) }] } },
  };
  return numItem(b0, a, `Yes: undo ${k} step${k > 1 ? 's' : ''} of ×${nH(b)} by dividing.`, [
    [first, MC.firstOut, `${nH(first)} is the value at t = ${k}, the first row shown. t = 0 is ${k} step${k > 1 ? 's' : ''} earlier.`],
    [pw(first, b, k), MC.forward, `Going back means undoing ×${nH(b)}: divide by ${nH(b)}, don’t multiply.`],
  ], `Find the factor, then divide by it once for every step back to t = 0.`);
};

// ===== backsolve-initial: in words, with a calculator =====
const BW = [
  { ctx: (a: string, b: string, k: number, v: string) => `A savings account grows ${b} per year (compounded yearly). ${k} years after the deposit, the balance is ${v}. How much was deposited?`, unit: 'dollars', money: true, bs: [1.05, 1.04] },
  { ctx: (a: string, b: string, k: number, v: string) => `A city’s population grows ${b} per year. ${k} years after a census, it is ${v}. What was the population at the census?`, unit: 'people', money: false, bs: [1.05, 1.04] },
  { ctx: (a: string, b: string, k: number, v: string) => `A new app’s number of users grows ${b} per year. ${k} years after launch, it has ${v} users. How many users did it have at launch?`, unit: 'users', money: false, bs: [1.1, 1.2, 1.5] },
  { ctx: (a: string, b: string, k: number, v: string) => `A machine loses ${b} of its value each year. ${k} years after it was bought, it is worth ${v}. What did it cost new?`, unit: 'dollars', money: true, bs: [0.9, 0.8] },
];
export const backAWords: Gen = (R, n) => {
  const C = pick(R, BW), b = pick(R, C.bs), k = int(R, 2, 3);
  const den = b === 1.05 ? 20 : b === 1.04 ? 25 : b === 1.5 ? 2 : b === 1.2 || b === 0.8 ? 5 : 10;
  const a = den ** k * int(R, 2, 9) * (C.money ? (b === 1.05 || b === 1.04 ? 1 : 10) : b === 1.05 ? 2 : b === 1.5 ? 25 : 4);
  const v = pw(a, b, k);
  const r = Math.round(Math.abs(b - 1) * 100);
  const vs = C.money ? usd(v) : nH(v);
  const b0: Base = {
    id: `backAWords-${n}`, family: 'backAWords',
    prompt: C.ctx('', `${r}%`, k, vs),
    board: `a\\cdot ${nT(b)}^{${k}} = ${C.money ? usdT(v) : nT(v)}`, unit: C.unit,
    solution: [`Each year multiplies by ${nH(b)}, so after ${k} years: <i>a</i> · ${nH(b)}${sup(k)} = ${vs}.`, `Undo it: <i>a</i> = ${nH(v)} ÷ ${nH(b)}${sup(k)} = ${nH(v)} ÷ ${nH(pw(1, b, k))} = ${ans(nH(a))}.`],
  };
  return numItem(b0, a, `Yes: ${nH(v)} ÷ ${nH(pw(1, b, k))} = ${nH(a)}.`, [
    [pw(v, b, k), MC.forward, `Going back in time undoes the growth: divide by ${nH(b)}${sup(k)}, don’t multiply.`],
    [v, MC.firstOut, `${vs} is the value after ${k} years. The question asks for the start.`],
    [r9(v * (1 - (b - 1) * k)), MC.addPct, `Taking off ${r}% ${k} times from the end value does not undo it: each year’s ${r}% was of a different amount. Divide by ${nH(b)}${sup(k)}.`],
  ], `The start times ${nH(b)}${sup(k)} gives ${vs}: divide.`);
};

// ===== factor-percent: factor → percent =====
export const factorToPct: Gen = (R, n) => {
  const b = pick(R, [0.92, 0.85, 0.97, 0.75, 0.88, 0.94, 1.04, 1.025, 1.15, 1.06, 1.35, 2.3, 1.8, 0.6, 0.7]), per = pick(R, ['year', 'month', 'decade']);
  const r = rnd(Math.abs(b - 1) * 100, 4), up = b > 1;
  const dir = (u: boolean) => (u ? 'increase' : 'decrease');
  const opts: Opt[] = [
    { t: `${nH(r)}% ${dir(up)} per ${per}`, ok: true, say: `Yes: b = 1 ${up ? '+' : '−'} ${nH(r / 100)}, so the amount ${up ? 'gains' : 'loses'} ${nH(r)}% each ${per}.` },
    { t: `${nH(b * 100, 4)}% ${dir(up)} per ${per}`, mc: MC.rate, say: `${nH(b * 100, 4)}% is what the amount ${up ? 'becomes' : 'keeps'} (b = ${nH(b)}). The change is the part ${up ? 'above' : 'below'} 100%: ${nH(r)}%.` },
    { t: `${nH(b)}% ${dir(up)} per ${per}`, mc: MC.bAsPct, say: `b = ${nH(b)} is a factor, not a percent. Compare it with 1: ${nH(b)} = 1 ${up ? '+' : '−'} ${nH(r / 100)}.` },
    { t: `${nH(r)}% ${dir(!up)} per ${per}`, say: `b = ${nH(b)} is ${up ? 'more' : 'less'} than 1, so the amount ${up ? 'grows' : 'shrinks'}.` },
  ];
  return choice(R, {
    id: `factorToPct-${n}`, family: 'factorToPct',
    prompt: `A model has the factor <i>b</i> = ${nH(b)} per ${per}. What is its percent rate of change?`,
    board: `b = ${nT(b)} = 1 ${up ? '+' : '-'}\\ r`,
    solution: [`b = 1 ${up ? '+' : '−'} r, so r = ${up ? `${nH(b)} − 1` : `1 − ${nH(b)}`} = ${nH(r / 100)}.`, `That is ${nH(r)}% ${dir(up)} per ${per}.`],
  }, opts);
};

// ===== factor-percent: percent → factor =====
export const pctToFactor: Gen = (R, n) => {
  const up = R() < 0.55;
  const [what, rs] = up
    ? pick(R, [['A city’s population grows', [1.5, 2.5, 3, 4]], ['A savings balance grows', [2.5, 3, 4, 5]], ['The number of app users grows', [7, 12, 30, 150]], ['A viral video’s view count grows', [30, 80, 150]]] as const)
    : pick(R, [['A lake’s fish population shrinks', [2, 5, 8]], ['A laptop’s value drops', [15, 25, 40]], ['The medicine left in the blood drops', [8, 15, 25, 40]]] as const);
  const r: number = pick(R, rs as readonly number[]), per = what.includes("video") ? "day" : "year";
  const b = rnd(up ? 1 + r / 100 : 1 - r / 100, 6);
  const b0: Base = {
    id: `pctToFactor-${n}`, family: 'pctToFactor',
    prompt: `${what} by ${nH(r)}% per ${per}. What factor <i>b</i> multiplies it each ${per}?`,
    board: `b = 1 ${up ? '+' : '-'}\\ ${nT(r / 100)}`,
    solution: [`${up ? 'Growing' : 'Losing'} ${nH(r)}% leaves 100% ${up ? '+' : '−'} ${nH(r)}% = ${nH(up ? 100 + r : 100 - r)}% of the amount.`, `As a factor: <i>b</i> = ${ans(nH(b))}.`],
  };
  return numItem(b0, b, `Yes: <i>b</i> = 1 ${up ? '+' : '−'} ${nH(r / 100)} = ${nH(b)}.`, [
    [rnd(r / 100, 6), MC.rate, `${nH(r / 100)} is the rate r, the part that ${up ? 'is added' : 'is lost'}. The factor is what the amount becomes: 1 ${up ? '+' : '−'} ${nH(r / 100)}.`],
    [r, MC.bAsPct, `${nH(r)} is the percent. As a factor, ${nH(r)}% ${up ? 'more' : 'less'} is 1 ${up ? '+' : '−'} ${nH(r / 100)}.`],
    [rnd(up ? 1 - r / 100 : 1 + r / 100, 6), undefined, `That would ${up ? 'shrink' : 'grow'} the amount. ${up ? 'Growth' : 'A loss'} needs b ${up ? '>' : '<'} 1.`],
  ], `Write the percent as a decimal r, then b = 1 ${up ? '+' : '−'} r.`);
};

// ===== model-from-words: pick the model =====
const MW = [
  { s: (a: number, r: number) => `You deposit ${usd(a)} in an account that earns ${nH(r)}% interest compounded yearly. <i>B</i> is the balance in dollars after <i>t</i> years.`, up: true, as: [500, 1500, 2000, 4000], rs: [3, 4, 5, 6], f: 'B' },
  { s: (a: number, r: number) => `A new car costs ${usd(a)} and loses ${nH(r)}% of its value each year. <i>V</i> is its value in dollars <i>t</i> years after it is bought.`, up: false, as: [22000, 28000, 35000], rs: [12, 15, 20], f: 'V' },
  { s: (a: number, r: number) => `A town has ${nH(a)} residents and grows ${nH(r)}% per year. <i>P</i> is the population <i>t</i> years from now.`, up: true, as: [8500, 12000, 46000], rs: [2, 3, 4], f: 'P' },
  { s: (a: number, r: number) => `A patient takes ${nH(a)} mg of a medicine, and each hour ${nH(r)}% of the medicine in the body is removed. <i>M</i> is the mg left <i>t</i> hours after the dose.`, up: false, as: [200, 400, 650], rs: [10, 15, 25], f: 'M' },
];
export const modelChoice: Gen = (R, n) => {
  const C = pick(R, MW), a = pick(R, C.as), r = pick(R, C.rs), i = r / 100, b = C.up ? 1 + i : 1 - i, wb = C.up ? 1 - i : 1 + i;
  const L = `<i>${C.f}</i>(${tI}) =`;
  const opts: Opt[] = [
    { t: `${L} ${nH(a)}(${nH(b)})${sup(tI)}`, ok: true, say: `Yes: start ${nH(a)}, and each ${C.f === 'M' ? 'hour' : 'year'} the amount becomes ${nH(b * 100)}% of itself.` },
    { t: `${L} ${nH(a)}(${nH(i)})${sup(tI)}`, mc: MC.rate, say: `${nH(i)} is the rate. Each step the amount becomes 1 ${C.up ? '+' : '−'} ${nH(i)} = ${nH(b)} of itself.` },
    { t: `${L} ${nH(a)}(1 ${C.up ? '+' : '−'} ${nH(i)}${tI})`, mc: MC.addPct, say: `That takes ${nH(r)}% of the ORIGINAL amount every step (a straight line). Here the percent is of the current amount.` },
    { t: `${L} ${nH(a)}(${nH(wb)})${sup(tI)}`, say: `${nH(wb)} ${C.up ? 'shrinks' : 'grows'} the amount. This one ${C.up ? 'grows' : 'shrinks'}.` },
  ];
  return choice(R, {
    id: `modelChoice-${n}`, family: 'modelChoice',
    prompt: `${C.s(a, r)} Which model is right?`,
    board: `${C.f}(t) = a(1 ${C.up ? '+' : '-'} r)^{t}`,
    solution: [`Start: <i>a</i> = ${nH(a)}. Rate: <i>r</i> = ${nH(i)}, ${C.up ? 'added' : 'lost'} each step.`, `Factor: 1 ${C.up ? '+' : '−'} ${nH(i)} = ${nH(b)}.`],
  }, opts);
};

// ===== model-from-words: type a and b =====
export const modelPair: Gen = (R, n) => {
  const k = int(R, 0, 4);
  let a: number, b: number, s: string, f: string, r = 0;
  if (k === 0) { a = pick(R, [200, 400, 650]); r = pick(R, [10, 15, 20, 25]); b = 1 - r / 100; f = 'M'; s = `A patient takes ${nH(a)} mg of a medicine. Each hour, ${r}% of the medicine in the body is removed. <i>M</i> = mg left after <i>t</i> hours.`; }
  else if (k === 1) { a = pick(R, [1200, 3000, 5000]); r = pick(R, [3, 4, 6]); b = 1 + r / 100; f = 'B'; s = `${usd(a)} is invested at ${r}% interest compounded yearly. <i>B</i> = balance in dollars after <i>t</i> years.`; }
  else if (k === 2) { a = pick(R, [50, 120, 300]); b = 2; f = 'N'; s = `A culture starts with ${nH(a)} bacteria and doubles every hour. <i>N</i> = bacteria after <i>t</i> hours.`; }
  else if (k === 3) { a = pick(R, [80, 160, 640]); b = 0.5; f = 'A'; s = `A sample has ${nH(a)} grams of a substance, and half of it decays each day. <i>A</i> = grams left after <i>t</i> days.`; }
  else { a = pick(R, [15000, 26000]); r = pick(R, [8, 12, 18]); b = 1 - r / 100; f = 'V'; s = `A truck costs ${usd(a)} new and loses ${r}% of its value per year. <i>V</i> = value in dollars after <i>t</i> years.`; }
  b = r9(b);
  const cands: PCand[] = [[b, a, MC.aAsB, 'The start goes in front, the factor goes in the brackets.']];
  if (r) {
    cands.push([a, r9(r / 100), MC.rate, `${nH(r / 100)} is the rate. The factor is 1 ${b > 1 ? '+' : '−'} ${nH(r / 100)} = ${nH(b)}.`]);
    if (b < 1) cands.push([a, -r9(r / 100), MC.negFactor, 'A negative factor would flip the sign every step. Decay uses a factor between 0 and 1.']);
    cands.push([a, r9(b < 1 ? 1 + r / 100 : 1 - r / 100), undefined, `That factor ${b < 1 ? 'grows' : 'shrinks'} the amount.`]);
  }
  return pairItem({
    id: `modelPair-${n}`, family: 'modelPair',
    prompt: `${s} Fill in the model.`,
    board: `${f}(t) = a\\cdot b^{t}`,
    solution: [`At <i>t</i> = 0 the amount is ${ans(nH(a))}.`, `Each step it is multiplied by ${ans(nH(b))}.`],
  }, a, b, MODEL_FORM(`<i>${f}</i>`), `Yes: <i>${f}</i>(<i>t</i>) = ${nH(a)}(${nH(b)})<sup>t</sup>.`, cands, 'First box: the amount at t = 0. Second box: what one step multiplies by.');
};

// ===== predict: compute with the model, round only at the end =====
export const predict: Gen = (R, n) => {
  for (;;) {
    const k = int(R, 0, 2);
    let a: number, b: number, t: number, d: number, s: string, unit: string, money = false;
    if (k === 0) { a = pick(R, [1500, 2500, 4000, 6200]); const r = pick(R, [3, 4, 4.5, 5, 6]); b = 1 + r / 100; t = int(R, 4, 10); d = 2; money = true; unit = 'dollars'; s = `${usd(a)} is invested at ${nH(r)}% interest compounded yearly: <i>B</i>(<i>t</i>) = ${nH(a)}(${nH(b)})${sup(tI)}. What is the balance after ${t} years? Round only your final answer, to the nearest cent.`; }
    else if (k === 1) { a = pick(R, [1200, 2400, 860]); const r = pick(R, [4, 6, 7, 9]); b = 1 - r / 100; t = int(R, 3, 8); d = 0; unit = 'fish'; s = `A lake’s fish population follows <i>F</i>(<i>t</i>) = ${nH(a)}(${nH(b)})${sup(tI)}, <i>t</i> in years. How many fish does the model predict after ${t} years? Round to the nearest whole fish.`; }
    else { a = pick(R, [300, 450, 500]); const r = pick(R, [12, 15, 18]); b = 1 - r / 100; t = int(R, 3, 8); d = 1; unit = 'mg'; s = `After a dose, the medicine in a patient’s blood follows <i>M</i>(<i>t</i>) = ${nH(a)}(${nH(b)})${sup(tI)}, <i>t</i> in hours. How many mg are left after ${t} hours? Round to the nearest tenth.`; }
    b = r9(b);
    const exact = a * b ** t;
    if (nearTie(exact, d)) continue;
    const v = rnd(exact, d);
    let step = a;
    for (let i = 0; i < t; i++) step = rnd(step * b, d);
    const lin = rnd(a * (1 + (b - 1) * t), d), wp = rnd((a * b) ** t, d);
    const fmt = (x: number) => (money ? usd(x, true) : nH(x, d, true));
    const b0: Base = {
      id: `predict-${n}`, family: 'predict',
      prompt: s, board: `${nT(a)}(${nT(b)})^{${t}}`, unit,
      solution: [`One calculator entry: ${nH(a)} × ${nH(b)} ^ ${t} = ${nH(exact, 5)}…`, `Rounded at the very end: ${ans(fmt(v))}${money ? '' : ' ' + unit}.`],
    };
    return numItem(b0, v, `Yes: ${nH(a)} · ${nH(b)}${sup(t)} ≈ ${fmt(v)}.`, [
      [step, MC.early, `Rounding after every step drifts: you got ${fmt(step)}. Keep all digits and round only the final answer.`],
      [lin, MC.addPct, `That changes the start by the same amount every step. The percent is of the current amount: multiply by ${nH(b)} each step.`],
      [wp, MC.wrongPart, `The exponent belongs to ${nH(b)} only: work out ${nH(b)}${sup(t)} first, then multiply by ${nH(a)}.`],
    ], `Type ${nH(a)} × ${nH(b)} ^ ${t} in one go, then round.`);
  }
};
export { diffLabels, ratioLabels };
export type { GItem, GPic };
