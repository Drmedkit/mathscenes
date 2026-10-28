// famA.ts: stage 1 and the graphing half of stage 2 of "Systems of equations": check a pair in both equations, the
// crossing as the common solution, constraints in context, the three bridges (graph a line in both forms, x = a and
// y = b, rewrite ax + by = c), solving by graphing (estimate vs exact) and with a graphing tool. Pure.
import { gcd, int, pick, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import {
  type Eq, type Form, type Letters, P, PQ, PT, XY, checkAt, checkQ, cv, checkF, eq, eqOf, fH, fT, holds, intSol, letters, lineKey, nH, nT, q, qH, qNum,
  r3, si, solve, std, through, xs, yAt,
} from './sysMaths';
import {
  type Opt, type SGen, MC, PTIO, choice, dot, fixedChoice, line, near, numItem, pairItem, revSlip, semLine, semPt, semV, sysBoard, sysG, sysH, text,
} from './itemKit';
import { type GPic, winAround } from './sysPic';

const CO = [1, 2, 3, 4, 5, -1, -2, -3, -4, -5];
const pl = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const X = '<i>x</i>', Y = '<i>y</i>';
/** two lines through (x0, y0) with small coefficients (not parallel, each written with gcd 1) */
export function sysAt(R: () => number, x0: number, y0: number, co: readonly number[] = CO): [Eq, Eq] {
  for (;;) {
    const a1 = pick(R, co), b1 = pick(R, co), a2 = pick(R, co), b2 = pick(R, co);
    if (a1 * b2 - a2 * b1 === 0 || gcd(a1, b1) > 1 || gcd(a2, b2) > 1) continue;
    return [through(a1, b1, x0, y0), through(a2, b2, x0, y0)];
  }
}
/** how a line is written: y = mx + b when that has integer numbers (sometimes), else standard form */
export function formOf(R: () => number, E: Eq, pSI = 0.45): Form {
  if (E.b !== 0 && E.a % E.b === 0 && E.c % E.b === 0 && R() < pSI) return si(-E.a / E.b, E.c / E.b);
  return std(E.a < 0 || (E.a === 0 && E.b < 0) ? eq(-E.a, -E.b, -E.c) : E);
}
/** an integer step along the line a x + b y = c */
const dirOf = (E: Eq): [number, number] => { const g = gcd(E.a, E.b) || 1; return [E.b / g, -E.a / g]; };

// ===================== check-pair-both =====================
const PAIR_OPTS = ['Yes: it makes both equations true', 'No: only the first equation is true', 'No: only the second equation is true', 'No: neither equation is true'];
export const pairCheck: SGen = (R, n) => {
  for (;;) {
    const half = R() < 0.2;
    const x0 = half ? int(R, -6, 5) + 0.5 : int(R, -6, 6), y0 = int(R, -6, 6);
    const [E1, E2] = half ? sysAt(R, x0, y0, [2, 4, -2, -4, 1, 3, -1, -3].slice(0, 8)) : sysAt(R, x0, y0);
    if (half && (E1.a % 2 !== 0 || E2.a % 2 !== 0)) continue;
    const want = half ? pick(R, [0, 1, 3]) : int(R, 0, 3);
    let p: [number, number];
    if (want === 0) p = [x0, y0];
    else if (want === 1 || want === 2) { const d = dirOf(want === 1 ? E1 : E2), t = pick(R, [-2, -1, 1, 2]); p = [x0 + t * d[0], y0 + t * d[1]]; }
    else p = [x0 + pick(R, [-1, 1]) * (half ? 1 : 1), y0 + pick(R, [-2, -1, 1, 2])];
    if (Math.abs(p[0]) > 8 || Math.abs(p[1]) > 8) continue;
    const a = holds(E1, p[0], p[1]), b = holds(E2, p[0], p[1]);
    const cat = a && b ? 0 : a ? 1 : b ? 2 : 3;
    if (cat !== want) continue;
    const F1 = formOf(R, E1), F2 = formOf(R, E2);
    const both = `${fH(F1)}: ${checkF(F1, p[0], p[1])}. ${fH(F2)}: ${checkF(F2, p[0], p[1])}.`;
    const opts: Opt[] = PAIR_OPTS.map((t, i) => ({ t, say: i === want ? `Yes. ${both}` : `Check each one. ${both}`, mc: i === 0 && (want === 1 || want === 2) ? MC.oneCond : undefined }));
    const bd = sysBoard(F1, F2);
    return fixedChoice({
      id: `pairCheck-${n}`, family: 'pairCheck', prompt: `Is ${P(p[0], p[1])} a solution of the system ${sysH(F1, F2)}? Put it into BOTH equations.`, board: bd.board,
      solution: [`${fH(F1)}: ${checkF(F1, p[0], p[1])}`, `${fH(F2)}: ${checkF(F2, p[0], p[1])}`, a && b ? 'Both true at once: a solution of the system.' : 'A solution must make BOTH true at the same time.'],
      picture: { g: sysG(E1, E2, [p, [x0, y0]], ['P'], ['L1', 'L2'], [dot('P', p[0], p[1], 'pick', P(p[0], p[1]))]), bd: bd.bd, cols: bd.cols },
    }, opts, want);
  }
};
export const whichPair: SGen = (R, n) => {
  for (;;) {
    const x0 = int(R, -5, 5), y0 = int(R, -5, 5);
    const [E1, E2] = sysAt(R, x0, y0);
    const d1 = dirOf(E1), d2 = dirOf(E2), t1 = pick(R, [-1, 1]), t2 = pick(R, [-1, 1]);
    const p1: [number, number] = [x0 + t1 * d1[0], y0 + t1 * d1[1]], p2: [number, number] = [x0 + t2 * d2[0], y0 + t2 * d2[1]];
    if ([p1, p2].some(p => Math.abs(p[0]) > 7 || Math.abs(p[1]) > 7)) continue;
    const F1 = formOf(R, E1), F2 = formOf(R, E2);
    const ws: Opt[] = [
      { t: P(p1[0], p1[1]), sem: semPt(p1[0], p1[1]), mc: MC.oneCond, say: `It fits ${fH(F1)} only: ${checkF(F2, p1[0], p1[1])} in the second.` },
      { t: P(p2[0], p2[1]), sem: semPt(p2[0], p2[1]), mc: MC.oneCond, say: `It fits ${fH(F2)} only: ${checkF(F1, p2[0], p2[1])} in the first.` },
    ];
    if (x0 !== y0) ws.push({ t: P(y0, x0), sem: semPt(y0, x0), mc: MC.order, say: `x comes first. ${P(y0, x0)} in the first: ${checkF(F1, y0, x0)}` });
    ws.push({ t: P(x0 + 1, y0 - 1), sem: semPt(x0 + 1, y0 - 1), say: `Put it in: ${checkF(F1, x0 + 1, y0 - 1)}` });
    const bd = sysBoard(F1, F2);
    const pts = [[x0, y0], p1, p2, ...(x0 !== y0 ? [[y0, x0]] : [])] as [number, number][];
    return choice(R, {
      id: `whichPair-${n}`, family: 'whichPair', prompt: `Which pair is the solution of the system ${sysH(F1, F2)}?`, board: bd.board,
      solution: [`${P(x0, y0)} in the first: ${checkF(F1, x0, y0)}`, `In the second: ${checkF(F2, x0, y0)}`, 'Both true: that pair solves the system.'],
      picture: { g: sysG(E1, E2, pts, pts.map((_, i) => `c${i}`), ['L1', 'L2', 'S'], [...pts.map((p, i) => dot(`c${i}`, p[0], p[1], 'pick')), dot('S', x0, y0, 'link', P(x0, y0))]), bd: bd.bd, cols: bd.cols },
    }, P(x0, y0), `Yes: ${P(x0, y0)} makes both equations true.`, ws, { sem: semPt(x0, y0) });
  }
};

// ===================== intersection-common-solution / solve-by-graphing =====================
export const readCross: SGen = (R, n, sg) => {
  for (;;) {
    const mode = sg === 'solve-by-graphing' ? pick(R, ['std', 'std', 'frac', 'hv']) : pick(R, ['neg', 'axis', 'hv', 'neg']);
    let x0 = int(R, -5, 5), y0 = int(R, -5, 5);
    if (mode === 'neg' && x0 >= 0 && y0 >= 0) continue;
    if (mode === 'axis') { if (R() < 0.5) x0 = 0; else y0 = 0; if (x0 === 0 && y0 === 0) continue; }
    let E1: Eq, E2: Eq, F1: Form, F2: Form;
    if (mode === 'hv') { E1 = eq(1, 0, x0); E2 = eq(0, 1, y0); F1 = std(E1); F2 = std(E2); if (R() < 0.5) [E1, E2, F1, F2] = [E2, E1, F2, F1]; }
    else if (mode === 'frac') {
      // y = (p/q) x + k with q = 2 or 3 through (x0, y0), and a standard-form line
      const qd = pick(R, [2, 3]), p = pick(R, [1, -1, 2, -2].filter(v => gcd(v, qd) === 1));
      if ((x0 * p) % qd !== 0) continue;
      F1 = si(q(p, qd), q(y0 * qd - p * x0, qd)); E1 = eqOf(F1);
      [, E2] = sysAt(R, x0, y0); F2 = std(E2.a < 0 ? eq(-E2.a, -E2.b, -E2.c) : E2);
      if (E1.a * E2.b === E2.a * E1.b) continue;
    } else { [E1, E2] = sysAt(R, x0, y0); F1 = mode === 'std' ? formOf(R, E1, 0) : formOf(R, E1); F2 = mode === 'std' ? formOf(R, E2, 0) : formOf(R, E2); }
    const slips = revSlip(x0, y0).map(s => ({ ...s }));
    if (E1.b !== 0 && Number.isInteger(E1.c / E1.b) && !(x0 === 0 && y0 === E1.c / E1.b)) slips.push({ x: 0, y: E1.c / E1.b, mc: MC.intercept, say: 'That is where ONE line meets the y-axis. The solution is where the two lines meet each other.' });
    if (E2.a !== 0 && Number.isInteger(E2.c / E2.a) && !(y0 === 0 && x0 === E2.c / E2.a)) slips.push({ x: E2.c / E2.a, y: 0, mc: MC.intercept, say: 'That is where ONE line meets the x-axis. The solution is where the two lines meet each other.' });
    const bd = sysBoard(F1, F2);
    const g = sysG(E1, E2, [[x0, y0]], ['L1', 'L2'], ['S', 'gx', 'gy'], [
      dot('S', x0, y0, 'link', P(x0, y0)),
      { kind: 'seg', key: 'gx', a: [x0, 0], b: [x0, y0], col: 'pick', dash: true, w: 3 },
      { kind: 'seg', key: 'gy', a: [0, y0], b: [x0, y0], col: 'pick', dash: true, w: 3 },
    ].filter(it => !(it.kind === 'seg' && near(it.a[0], it.b[0]) && near(it.a[1], it.b[1]))) as GPic['items']);
    if (!g.items.some(i => i.key === 'gx')) g.solve = g.solve.filter(k => k !== 'gx');
    if (!g.items.some(i => i.key === 'gy')) g.solve = g.solve.filter(k => k !== 'gy');
    const lead = sg === 'solve-by-graphing' ? 'Here both lines are graphed by hand, on common axes.' : 'The two lines are graphed.';
    return pairItem({
      id: `readCross-${n}`, family: 'readCross', prompt: `${lead} What is the solution of the system ${sysH(F1, F2)}? Read it from the graph, then check it in both equations.`, board: bd.board,
      solution: [`The lines cross at (${ans(nH(x0))}, ${ans(nH(y0))}).`, `Check: ${checkF(F1, x0, y0)} and ${checkF(F2, x0, y0)}`],
      picture: { g, bd: bd.bd, cols: bd.cols },
    }, x0, y0, PTIO, `Yes: ${P(x0, y0)}, on both lines, and it checks in both equations.`, slips, 'Find the one point that lies on BOTH lines, then read its x first, then its y.');
  }
};
export const markedPoint: SGen = (R, n) => {
  for (;;) {
    const x0 = int(R, -4, 4), y0 = int(R, -4, 4);
    if (x0 === 0 || y0 === 0) continue;
    const [E1, E2] = sysAt(R, x0, y0, [1, 2, 3, -1, -2, -3]);
    if (E1.b === 0 || E1.c % E1.b !== 0) continue;
    const yi = E1.c / E1.b;
    const d2 = dirOf(E2), t = pick(R, [-1, 1]);
    const c: [number, number] = [x0 + t * d2[0], y0 + t * d2[1]];
    const off: [number, number] = [x0 + pick(R, [-2, 2]), y0 + pick(R, [-1, 1])];
    if (holds(E1, off[0], off[1]) || holds(E2, off[0], off[1]) || holds(E1, c[0], c[1]) || (c[0] === 0 && c[1] === yi) || ([c, off, [0, yi]] as [number, number][]).some(p => Math.abs(p[0]) > 7 || Math.abs(p[1]) > 7)) continue;
    const pts: [number, number][] = shuffle(R, [[x0, y0], [0, yi], c, off]);
    const tag = (p: [number, number]) => (p[0] === x0 && p[1] === y0 ? 'S' : p[0] === 0 && p[1] === yi ? 'I' : p === c ? 'C' : 'O');
    const F1 = formOf(R, E1), F2 = formOf(R, E2);
    const opts: Opt[] = pts.map((p, i) => {
      const k = tag(p);
      return {
        t: `${'ABCD'[i]} ${P(p[0], p[1])}`,
        mc: k === 'I' ? MC.intercept : k === 'C' ? MC.oneCond : undefined,
        say: k === 'S' ? `Yes: ${P(x0, y0)} is on both lines, so it makes both equations true.` : k === 'I' ? 'That is where the amber line meets the y-axis: on one line only.' : k === 'C' ? 'That point is on the teal line only.' : 'That point is on neither line.',
      };
    });
    const right = pts.findIndex(p => p[0] === x0 && p[1] === y0);
    const bd = sysBoard(F1, F2);
    return fixedChoice({
      id: `markedPoint-${n}`, family: 'markedPoint', prompt: `Four points are marked. Which one is the solution of the system ${sysH(F1, F2)}?`, board: bd.board,
      solution: [`The solution is on BOTH lines: point ${'ABCD'[right]} ${P(x0, y0)}.`, `Check: ${checkF(F1, x0, y0)} and ${checkF(F2, x0, y0)}`],
      picture: { g: sysG(E1, E2, pts, ['L1', 'L2', 'm0', 'm1', 'm2', 'm3'], ['rS'], [...pts.map((p, i) => dot(`m${i}`, p[0], p[1], 'pick', 'ABCD'[i])), dot('rS', x0, y0, 'link')]), bd: bd.bd, cols: bd.cols },
    }, opts, right);
  }
};

// ===================== constraints-in-context =====================
interface Ctx { kind: 'plans' | 'tickets' | 'motion'; L: Letters; F1: Form; F2: Form; E1: Eq; E2: Eq; x0: number; y0: number; story: string; vars: string; meaning: string; swapMeaning: string; oneMeaning: string; picMeaning: string; g: Omit<GPic, 'items' | 'show' | 'solve'>; ask: string; lead: string; op: string; tail: string }
function axisFor(maxV: number, must: number, steps: number[]): { max: number; step: number } | null {
  for (const s of steps) { const m = Math.ceil(maxV / s) * s; if (must % s === 0 && m / s >= 4 && m / s <= 12) return { max: m, step: s }; }
  return null;
}
function ctxOf(R: () => number, kind?: Ctx['kind']): Ctx {
  for (;;) {
    const k = kind ?? pick(R, ['plans', 'tickets', 'motion'] as const);
    if (k === 'plans') {
      const m0 = int(R, 2, 8), r2 = pick(R, [10, 15, 20, 25, 30]), d = pick(R, [5, 10]), r1 = r2 + d, f1 = pick(R, [0, 10, 20, 25, 30]), f2 = f1 + d * m0, c0 = f1 + r1 * m0;
      const thing = pick(R, ['gym', 'phone plan', 'climbing gym', 'music school']);
      const xm = m0 + int(R, 2, 4), ax = axisFor(Math.max(f1 + r1 * xm, f2 + r2 * xm), c0, [10, 20, 25, 50, 100]);
      if (!ax) continue;
      const L = letters('m', 'C'), F1 = si(r1, f1), F2 = si(r2, f2);
      return {
        kind: k, L, F1, F2, E1: eqOf(F1), E2: eqOf(F2), x0: m0, y0: c0,
        story: `Two ${thing}s. Plan A: ${f1 ? `$${f1} to join plus ` : ''}$${r1} a month, ${fH(F1, L)}. Plan B: $${f2} to join plus $${r2} a month, ${fH(F2, L)}. Here <i>m</i> is the number of months and <i>C</i> the total cost in dollars.`,
        vars: '(m, C)', meaning: `After ${m0} months both plans cost $${c0} in total.`, swapMeaning: `After ${c0} months both plans cost $${m0} in total.`,
        oneMeaning: `After ${m0} months Plan A costs $${c0}, and Plan B costs a different amount.`, picMeaning: `The plans cross, so from month ${m0} on they are the same plan.`,
        g: { x: { min: 0, max: xm, step: 1, name: 'months' }, y: { min: 0, max: ax.max, step: ax.step, name: 'total cost ($)' } },
        ask: 'After how many months do the plans cost the same, and what is that cost?', lead: 'months:', op: '&nbsp; cost: $', tail: '',
      };
    }
    if (k === 'tickets') {
      const N = pick(R, [20, 30, 40, 50, 60]), st = N / 10, a0 = st * int(R, 2, 8), s0 = N - a0, pa = pick(R, [8, 10, 12, 15]), ps = pick(R, [4, 5, 6]), T = pa * a0 + ps * s0;
      if (a0 === s0) continue;
      const L = letters('a', 's'), E1 = eq(1, 1, N), E2 = eq(pa, ps, T), F1 = std(E1), F2 = std(E2);
      return {
        kind: k, L, F1, F2, E1, E2, x0: a0, y0: s0,
        story: `A school play sold ${N} tickets for $${T} in all: adult tickets at $${pa}, student tickets at $${ps}. With <i>a</i> adult and <i>s</i> student tickets: ${fH(F1, L)} and ${fH(F2, L)}.`,
        vars: '(a, s)', meaning: `${a0} adult and ${s0} student tickets: that makes ${N} tickets AND $${T}.`, swapMeaning: `${s0} adult and ${a0} student tickets.`,
        oneMeaning: `${a0} adult and ${s0} student tickets make ${N} tickets; the money does not have to match.`, picMeaning: `The lines cross, so adult and student tickets cost the same there.`,
        g: { x: { min: 0, max: N, step: st, name: 'adult tickets' }, y: { min: 0, max: N, step: st, name: 'student tickets' } },
        ask: 'How many adult and how many student tickets were sold?', lead: 'adult:', op: '&nbsp; student:', tail: '',
      };
    }
    const T3 = pick(R, [[45, 60, 1, 3], [40, 60, 1, 2], [40, 60, 2, 4], [50, 75, 1, 2], [30, 50, 2, 3], [45, 75, 2, 3]] as const);
    const [rb, rc, hb, t0] = T3, head = rb * hb, d0 = rc * t0;
    if (rb * t0 + head !== d0) continue;
    const L = letters('t', 'd'), F1 = si(rc, 0), F2 = si(rb, head);
    const ax = axisFor(rc * (t0 + 2), d0, [20, 25, 30, 50, 60, 100]);
    if (!ax) continue;
    return {
      kind: 'motion', L, F1, F2, E1: eqOf(F1), E2: eqOf(F2), x0: t0, y0: d0,
      story: `A bus leaves town at ${rb} mi/h. ${hb === 1 ? 'An hour' : 'Two hours'} later a car follows on the same road at ${rc} mi/h. With <i>t</i> = hours since the car left and <i>d</i> = miles from town: car ${fH(F1, L)}, bus ${fH(F2, L)}.`,
      vars: '(t, d)', meaning: `${pl(t0, 'hour')} after the car leaves, the car and the bus are both ${d0} miles from town: the car catches up.`, swapMeaning: `After ${pl(d0, 'hour')} they are both ${pl(t0, 'mile')} from town.`,
      oneMeaning: `After ${pl(t0, 'hour')} the car is ${d0} miles from town; the bus can be somewhere else.`, picMeaning: `The lines cross, so the road makes a crossing there.`,
      g: { x: { min: 0, max: t0 + 2, step: 1, name: 'hours' }, y: { min: 0, max: ax.max, step: ax.step, name: 'miles from town' } },
      ask: 'When does the car catch up, and how far from town?', lead: 'hours:', op: '&nbsp; miles:', tail: '',
    };
  }
}
export const ctxMeaning: SGen = (R, n) => {
  const C = ctxOf(R);
  const opts: Opt[] = [
    { t: C.swapMeaning, mc: MC.swapIO, say: `The first number goes with ${C.L.x}, the second with ${C.L.y}: ${C.vars}.` },
    { t: C.oneMeaning, mc: MC.oneCond, say: 'The point is on BOTH lines: both conditions hold at once.' },
    { t: C.picMeaning, mc: MC.picture, say: 'The graph is not a map of the story. The crossing is the one pair of values that fits both equations.' },
  ];
  const bd = sysBoard(C.F1, C.F2, [], C.L);
  return choice(R, {
    id: `ctxMeaning-${n}`, family: 'ctxMeaning', prompt: `${C.story} The graphs cross at ${P(C.x0, C.y0)}. What does that point mean?`, board: bd.board,
    solution: [`${P(C.x0, C.y0)} is ${C.vars} = ${P(C.x0, C.y0)}.`, `It is on both lines: ${checkF(C.F1, C.x0, C.y0)} and ${checkF(C.F2, C.x0, C.y0)}.`],
    picture: { g: { ...C.g, items: [line('L1', C.E1, 'first'), line('L2', C.E2, 'second'), dot('S', C.x0, C.y0, 'link', P(C.x0, C.y0))], show: ['L1', 'L2', 'S'], solve: [] }, bd: bd.bd, cols: bd.cols },
  }, C.meaning, 'Yes: both conditions hold at once at that point.', opts);
};
export const ctxRead: SGen = (R, n) => {
  const C = ctxOf(R);
  const bd = sysBoard(C.F1, C.F2, [], C.L);
  return pairItem({
    id: `ctxRead-${n}`, family: 'ctxRead', prompt: `${C.story} ${C.ask}`, board: bd.board,
    solution: [`The lines cross at ${C.vars} = (${ans(nH(C.x0))}, ${ans(nH(C.y0))}).`, `Check: ${checkF(C.F1, C.x0, C.y0)} and ${checkF(C.F2, C.x0, C.y0)}.`],
    picture: { g: { ...C.g, items: [line('L1', C.E1, 'first'), line('L2', C.E2, 'second'), dot('S', C.x0, C.y0, 'link', P(C.x0, C.y0))], show: ['L1', 'L2'], solve: ['S'] }, bd: bd.bd, cols: bd.cols },
  }, C.x0, C.y0, { lead: C.lead, op: C.op, tail: C.tail }, `Yes: ${C.meaning}`, [{ x: C.y0, y: C.x0, mc: MC.swapIO, say: `Swapped: the first box is ${C.lead.replace(':', '')}, read across; the second is ${C.op.replace(/&nbsp;|:|\$/g, '').trim()}, read up.` }],
  'Find where the two lines cross, then read across for the first value and up for the second.');
};

// ===================== bridge-graph-line-forms =====================
export const siMatch: SGen = (R, n) => {
  for (;;) {
    const d = pick(R, [1, 2, 3, 4]), p = pick(R, [1, 2, 3, -1, -2, -3]), k = int(R, -4, 4);
    if (gcd(p, d) !== 1 || (d === 1 && Math.abs(p) === 1 && R() < 0.5)) continue;
    const m = q(p, d), F = si(m, k), E = eqOf(F);
    const ws: Opt[] = [
      { t: fH(si(q(d, p), k)), sem: semLine(si(q(d, p), k)), say: `Slope is rise over run: from (0, ${nH(k)}) go ${d} right and ${nH(p)} up: ${qH(m)}.` },
      { t: fH(si(q(-p, d), k)), sem: semLine(si(q(-p, d), k)), say: `The line goes ${p > 0 ? 'up' : 'down'} to the right, so the slope is ${p > 0 ? 'positive' : 'negative'}.` },
      { t: fH(si(m, -k)), sem: semLine(si(m, -k)), say: `The line crosses the y-axis at (0, ${nH(k)}).` },
      { t: fH(si(q(-d, p), -k)), sem: semLine(si(q(-d, p), -k)), say: 'Read the y-intercept first, then rise over run.' },
    ];
    return choice(R, {
      id: `siMatch-${n}`, family: 'siMatch', prompt: `Which equation has this graph? It passes through the marked points (0, ${nH(k)}) and ${P(d, k + p)}.`, board: `(0,\\ ${nT(k)}),\\ (${d},\\ ${nT(k + p)})`,
      solution: [`The line crosses the y-axis at (0, ${nH(k)}), so b = ${nH(k)}.`, `From (0, ${nH(k)}) to ${P(d, k + p)}: ${d} right, ${nH(p)} ${p > 0 ? 'up' : 'down'}: slope ${qH(m)}.`],
      picture: { g: { ...winAround([[0, k], [d, k + p]]), items: [line('L', E, 'link'), dot('A', 0, k, 'pick'), dot('B', d, k + p, 'pick'), { kind: 'seg', key: 'run', a: [0, k], b: [d, k], col: 'first', dash: true, w: 4 }, { kind: 'seg', key: 'rise', a: [d, k], b: [d, k + p], col: 'second', dash: true, w: 4 }], show: ['L', 'A', 'B'], solve: ['run', 'rise'] } },
    }, fH(F), `Yes: ${fH(F)}.`, ws, { sem: semLine(F) });
  }
};
export const stdIntercepts: SGen = (R, n) => {
  for (;;) {
    const xi = pick(R, [1, 2, 3, 4, 5, 6, -1, -2, -3, -4, -6]), yi = pick(R, [1, 2, 3, 4, 5, 6, -2, -3, -4, -6]);
    if (xi === yi) continue;
    const Lc = Math.abs(xi * yi) / gcd(xi, yi);
    let E = eq(Lc / xi, Lc / yi, Lc);
    if (E.a < 0) E = eq(-E.a, -E.b, -E.c);
    if (Math.abs(E.a) > 9 || Math.abs(E.b) > 9) continue;
    return pairItem({
      id: `stdIntercepts-${n}`, family: 'stdIntercepts', prompt: `To graph ${fH(std(E))} quickly, find where it crosses the axes.`, board: fT(std(E)),
      solution: [`x-intercept: put ${Y} = 0. ${nH(E.a)}${X} = ${nH(E.c)}, so ${X} = ${ans(nH(xi))}.`, `y-intercept: put ${X} = 0. ${nH(E.b)}${Y} = ${nH(E.c)}, so ${Y} = ${ans(nH(yi))}.`, 'Join the two points: that is the line.'],
      picture: { g: { ...winAround([[xi, 0], [0, yi]]), items: [line('L', E, 'link'), dot('pX', xi, 0, 'first', P(xi, 0)), dot('pY', 0, yi, 'second', P(0, yi))], show: [], solve: ['pX', 'pY', 'L'] } },
    }, xi, yi, { lead: 'x-intercept (', op: ', 0) &nbsp; y-intercept (0,', tail: ')' }, `Yes: ${P(xi, 0)} and ${P(0, yi)}, then join them.`,
    [{ x: yi, y: xi, mc: MC.izSwap, say: `Swapped. The x-intercept is where ${Y} = 0: ${nH(E.a)}${X} = ${nH(E.c)}.` }], `For the x-intercept put ${Y} = 0; for the y-intercept put ${X} = 0.`);
  }
};
export const stdSlope: SGen = (R, n) => {
  for (;;) {
    const A = pick(R, [1, 2, 3, 4, 5]), B = pick(R, [2, 3, 4, 5, -2, -3, -4, -1]), x0 = int(R, -2, 2), y0 = int(R, -2, 2);
    if (gcd(A, B) !== 1 || A === Math.abs(B)) continue;
    const E = eq(A, B, A * x0 + B * y0), m = q(-A, B);
    const ws: Opt[] = [
      { t: qH(q(A)), sem: semV(A), mc: MC.stdSlopeA, say: `${nH(A)} is the x-coefficient, not the slope. Get ${Y} alone: ${Y} = ${qH(m)}${X} + …` },
      { t: qH(q(-B, A)), sem: semV(-B / A), say: 'Upside down: the slope is −(x-coefficient) over the y-coefficient.' },
      { t: qH(q(A, B)), sem: semV(A / B), mc: MC.divSign, say: `Moving ${nH(A)}${X} across makes it −${nH(A)}${X}: the sign changes.` },
      { t: qH(q(B, A)), sem: semV(B / A), say: 'Get y alone and read the number in front of x.' },
    ];
    const p2: [number, number] = [x0 + B, y0 - A];
    return choice(R, {
      id: `stdSlope-${n}`, family: 'stdSlope', prompt: `What is the slope of the line ${fH(std(E))}?`, board: fT(std(E)),
      solution: [`Get ${Y} alone: ${cv(B, Y)} = ${cv(-A, X)}${E.c === 0 ? '' : E.c < 0 ? ` − ${nH(-E.c)}` : ` + ${nH(E.c)}`}.`, `Divide by ${nH(B)}: the slope is ${qH(m)}.`],
      picture: { g: { ...winAround([[x0, y0], p2]), items: [line('L', E, 'link'), dot('A', x0, y0, 'pick'), dot('B', p2[0], p2[1], 'pick')], show: [], solve: ['L', 'A', 'B'] } },
    }, qH(m), `Yes: ${qH(m)}.`, ws, { sem: semV(-A / B) });
  }
};

// ===================== bridge-horizontal-vertical =====================
export const hvWhich: SGen = (R, n) => {
  for (;;) {
    const a = pick(R, [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]), vert = R() < 0.6;
    const right = vert ? `${X} = ${nH(a)}` : `${Y} = ${nH(a)}`, swap = vert ? `${Y} = ${nH(a)}` : `${X} = ${nH(a)}`;
    const E = vert ? eq(1, 0, a) : eq(0, 1, a), Es = vert ? eq(0, 1, a) : eq(1, 0, a);
    if (R() < 0.5) {
      // the graph shown, the equation asked
      const ws: Opt[] = [
        { t: swap, sem: lineKey(Es), mc: MC.hvSwap, say: vert ? `Every point of this line has ${X} = ${nH(a)}; ${Y} can be anything. It is upright.` : `Every point of this line has ${Y} = ${nH(a)}; ${X} can be anything. It is flat.` },
        { t: fH(vert ? si(a, 0) : si(a, a)), sem: semLine(vert ? si(a, 0) : si(a, a)), say: 'That line is slanted (or flat). This one is straight across or straight up.' },
      ];
      if (a !== 0) ws.push({ t: vert ? `${X} = ${nH(-a)}` : `${Y} = ${nH(-a)}`, sem: lineKey(vert ? eq(1, 0, -a) : eq(0, 1, -a)), say: 'Check the sign: read where the line meets the axis.' });
      return choice(R, {
        id: `hvWhich-${n}`, family: 'hvWhich', prompt: `Which equation has this graph? It passes through the marked points ${vert ? `${P(a, -2)} and ${P(a, 3)}` : `${P(-2, a)} and ${P(3, a)}`}.`, board: vert ? `(${nT(a)},\\ -2),\\ (${nT(a)},\\ 3)` : `(-2,\\ ${nT(a)}),\\ (3,\\ ${nT(a)})`,
        solution: [vert ? `Every point on it has ${X} = ${nH(a)}, whatever ${Y} is.` : `Every point on it has ${Y} = ${nH(a)}, whatever ${X} is.`, `So the equation is ${right}.`],
        picture: { g: { ...winAround([[a, a]]), items: [line('L', E, 'link'), dot('A', vert ? a : -2, vert ? -2 : a, 'pick', vert ? P(a, -2) : P(-2, a)), dot('B', vert ? a : 3, vert ? 3 : a, 'pick', vert ? P(a, 3) : P(3, a))], show: ['L', 'A', 'B'], solve: [] } },
      }, right, `Yes: ${right}.`, ws, { sem: lineKey(E) });
    }
    if (!vert || a === 0) continue;
    const opts: Opt[] = [
      { t: `An upright (vertical) line through ${P(a, 0)}`, say: `Yes: every point with ${X} = ${nH(a)}, any ${Y}.` },
      { t: `A flat (horizontal) line through ${P(0, a)}`, mc: MC.fixedX, say: `${X} = ${nH(a)} fixes x, and points with the same x line up straight up and down.` },
      { t: `Only the single point ${P(a, 0)}`, say: `${P(a, 3)} has ${X} = ${nH(a)} too: there are infinitely many points.` },
      { t: `The line ${fH(si(a, 0))} through the origin`, say: `That line has many different x-values. On ${X} = ${nH(a)} every point has the same x.` },
    ];
    return fixedChoice({
      id: `hvWhich-${n}`, family: 'hvWhich', prompt: `What does the graph of ${X} = ${nH(a)} look like in the plane?`, board: `x = ${nT(a)}`,
      solution: [`${X} = ${nH(a)} says nothing about ${Y}: ${P(a, 0)}, ${P(a, 2)}, ${P(a, -3)} all work.`, 'Those points stack straight up: an upright (vertical) line.'],
      picture: { g: { ...winAround([[a, 0]]), items: [line('L', eq(1, 0, a), 'link'), dot('A', a, 0, 'pick'), dot('B', a, 2, 'pick'), dot('C', a, -3, 'pick')], show: [], solve: ['A', 'B', 'C', 'L'] } },
    }, opts, 0);
  }
};
export const hvCross: SGen = (R, n) => {
  for (;;) {
    const a = int(R, -5, 5), b = int(R, -5, 5);
    if (a === b) continue;
    const E1 = eq(1, 0, a), E2 = eq(0, 1, b), F1 = std(E1), F2 = std(E2);
    const bd = sysBoard(F1, F2);
    return pairItem({
      id: `hvCross-${n}`, family: 'hvCross', prompt: `Where do the lines ${X} = ${nH(a)} and ${Y} = ${nH(b)} cross?`, board: bd.board,
      solution: [`Every point of the first has ${X} = ${nH(a)}; every point of the second has ${Y} = ${nH(b)}.`, `The crossing has both: (${ans(nH(a))}, ${ans(nH(b))}).`],
      picture: { g: sysG(E1, E2, [[a, b]], ['L1', 'L2'], ['S'], [dot('S', a, b, 'link', P(a, b))]), bd: bd.bd, cols: bd.cols },
    }, a, b, PTIO, `Yes: ${P(a, b)}.`, [{ x: b, y: a, mc: MC.order, say: `x first: the crossing is on ${X} = ${nH(a)}, so its x is ${nH(a)}.` }], `The point on ${X} = ${nH(a)} has x-coordinate ${nH(a)}.`);
  }
};
export const hvSlope: SGen = (R, n) => {
  const a = pick(R, [-5, -4, -3, -2, 2, 3, 4, 5, 6]), vert = R() < 0.6;
  const E = vert ? eq(1, 0, a) : eq(0, 1, a), name = vert ? `${X} = ${nH(a)}` : `${Y} = ${nH(a)}`;
  const opts: Opt[] = [
    { t: '0', sem: 'V0', mc: vert ? MC.zeroK : undefined, say: vert ? 'Two points on it: the run is 0, so rise over run is a number over 0, which is undefined (not 0).' : 'Yes: the rise is 0, so 0 over the run is 0.' },
    { t: 'undefined', sem: 'Vu', mc: vert ? undefined : MC.hvSwap, say: vert ? 'Yes: the run is 0, and you cannot divide by 0.' : `${name} is flat: the rise is 0 and the run is not, so the slope is 0.` },
    { t: nH(a), sem: `V${a}`, say: `${nH(a)} says where the line is, not how steep it is.` },
    { t: '1', sem: 'V1', say: 'Use two points of the line: rise over run.' },
  ];
  const p1: [number, number] = vert ? [a, -2] : [-2, a], p2: [number, number] = vert ? [a, 3] : [3, a];
  return fixedChoice({
    id: `hvSlope-${n}`, family: 'hvSlope', prompt: `What is the slope of ${name}? Use the two marked points.`, board: vert ? `x = ${nT(a)}` : `y = ${nT(a)}`,
    solution: [`From ${P(p1[0], p1[1])} to ${P(p2[0], p2[1])}: run ${nH(p2[0] - p1[0])}, rise ${nH(p2[1] - p1[1])}.`, vert ? 'Rise over a run of 0 is undefined: a vertical line has no slope.' : 'A rise of 0 over any run is 0: a horizontal line has slope 0.'],
    picture: { g: { ...winAround([[a, a]]), items: [line('L', E, 'link'), dot('A', p1[0], p1[1], 'pick', P(p1[0], p1[1])), dot('B', p2[0], p2[1], 'pick', P(p2[0], p2[1]))], show: ['L', 'A', 'B'], solve: [] } },
  }, opts, vert ? 1 : 0);
};

// ===================== bridge-rewrite-slope-intercept =====================
export const toSI: SGen = (R, n) => {
  if (R() < 0.2) {
    const a = pick(R, [2, 3, 4, 5]), v = pick(R, [-4, -3, -2, 2, 3, 4]), c = a * v;
    const right = `${X} = ${nH(v)}: a vertical line, it has no y = mx + b form`;
    const opts: Opt[] = [
      { t: right, say: `Yes: there is no ${Y}, so ${Y} can be anything: the vertical line ${X} = ${nH(v)}.` },
      { t: `${Y} = ${nH(v)}: a horizontal line`, mc: MC.hvSwap, say: `The equation fixes ${X}, not ${Y}: ${X} = ${nH(v)} is upright.` },
      { t: `${Y} = ${nH(a)}${X} − ${nH(Math.abs(c))}`.replace('− −', '+ '), say: `There is no ${Y} in the equation to get alone.` },
    ];
    return fixedChoice({
      id: `toSI-${n}`, family: 'toSI', prompt: `Rewrite ${nH(a)}${X} = ${nH(c)} in the form ${Y} = m${X} + b, if you can.`, board: `${a}x = ${nT(c)}`,
      solution: [`Divide by ${a}: ${X} = ${nH(v)}. There is no ${Y}.`, `So every point with ${X} = ${nH(v)} works: a vertical line, slope undefined.`],
      picture: { g: { ...winAround([[v, 0]]), items: [line('L', eq(1, 0, v), 'link')], show: [], solve: ['L'] } },
    }, opts, 0);
  }
  for (;;) {
    const b = pick(R, [1, 1, -1, -1, 2, -2, 3, -3, 4]), a = pick(R, [1, 2, 3, 4, 5, -2, -3]), c = pick(R, [2, 3, 4, 6, 8, 12, -4, -6]);
    if (gcd(gcd(a, b), c) !== 1 && Math.abs(b) > 1) continue;
    const E = eq(a, b, c), m = q(-a, b), k = q(c, b), F = si(m, k);
    const ws: Opt[] = [
      { t: fH(si(q(a, b), k)), sem: semLine(si(q(a, b), k)), mc: MC.moveSign, say: `Moving ${nH(a)}${X} to the other side makes it ${nH(-a)}${X}: the sign changes.` },
      { t: fH(si(q(-a), k)), sem: semLine(si(q(-a), k)), mc: MC.divOne, say: `Divide EVERY term by ${nH(b)}, the ${X}-term too.` },
    ];
    if (b < 0) ws.push({ t: fH(si(q(-a, -b), q(c, -b))), sem: semLine(si(q(-a, -b), q(c, -b))), mc: MC.divSign, say: `Divide by ${nH(b)}, with its minus sign: every sign flips.` });
    ws.push({ t: fH(si(m, q(-c, b))), sem: semLine(si(m, q(-c, b))), say: 'Check the constant: it is the right side divided by the y-coefficient.' });
    return choice(R, {
      id: `toSI-${n}`, family: 'toSI', prompt: `Rewrite ${fH(std(E))} as ${Y} = m${X} + b.`, board: fT(std(E)),
      solution: [`Move the ${X}-term: ${cv(b, Y)} = ${cv(-a, X)} ${c < 0 ? '−' : '+'} ${nH(Math.abs(c))}.`, b === 1 ? `The y-coefficient is 1: ${fH(F)}.` : `Divide every term by ${nH(b)}: ${fH(F)}.`],
      picture: { g: { ...winAround([[0, qNum(k)]]), items: [line('L', E, 'link')], show: [], solve: ['L'] } },
    }, fH(F), `Yes: ${fH(F)}, slope ${qH(m)}, y-intercept ${qH(k)}.`, ws, { sem: semLine(F) });
  }
};

// ===================== solve-by-graphing =====================
/** a system whose solution has denominator 2 or 3, inside the window */
function offGrid(R: () => number): { E1: Eq; E2: Eq; x: ReturnType<typeof q>; y: ReturnType<typeof q> } {
  for (;;) {
    const a1 = pick(R, [1, 2, 3, -1, -2]), b1 = pick(R, [1, 2, 3, -1, -2]), a2 = pick(R, [1, 2, 3, -1, -3]), b2 = pick(R, [1, 2, -1, -2, -3]);
    const c1 = int(R, -8, 8), c2 = int(R, -8, 8);
    const S = solve(eq(a1, b1, c1), eq(a2, b2, c2));
    if (S.k !== 'one' || (S.x.q === 1 && S.y.q === 1) || S.x.q > 3 || S.y.q > 3) continue;
    if (Math.abs(qNum(S.x)) > 5 || Math.abs(qNum(S.y)) > 5) continue;
    return { E1: eq(a1, b1, c1), E2: eq(a2, b2, c2), x: S.x, y: S.y };
  }
}
export const estimateExact: SGen = (R, n) => {
  for (;;) {
    const { E1, E2, x, y } = offGrid(R);
    const xv = qNum(x), yv = qNum(y), rx = Math.round(xv), ry = Math.round(yv);
    const F1 = formOf(R, E1, 0), F2 = formOf(R, E2, 0);
    const ws: Opt[] = [
      { t: P(rx, ry), sem: semPt(rx, ry), mc: MC.approx, say: `Check it: ${checkAt(E1, rx, ry)}. A grid point read from the graph is only an estimate.` },
      { t: PQ(y, x), sem: semPt(yv, xv), mc: MC.order, say: 'x comes first.' },
      { t: P(Math.floor(xv), Math.ceil(yv)), sem: semPt(Math.floor(xv), Math.ceil(yv)), say: `Check it: ${checkAt(E1, Math.floor(xv), Math.ceil(yv))}.` },
    ];
    const bd = sysBoard(F1, F2);
    return choice(R, {
      id: `estimateExact-${n}`, family: 'estimateExact', prompt: `The graphs of ${sysH(F1, F2)} cross between grid points. Which pair is the EXACT solution? Check before you trust the picture.`, board: bd.board,
      solution: [`The crossing is near ${P(rx, ry)}, but that is an estimate: ${checkAt(E1, rx, ry)}.`, `Solve exactly: ${PQ(x, y)}. Check: ${checkQ(E1, x, y)}`],
      picture: { g: sysG(E1, E2, [[xv, yv]], ['L1', 'L2'], ['S'], [dot('S', xv, yv, 'link')]), bd: bd.bd, cols: bd.cols },
    }, PQ(x, y), `Yes: ${PQ(x, y)}. The graph only gets you close; the check makes it exact.`, ws, { sem: semPt(xv, yv) });
  }
};
export const roundedFails: SGen = (R, n) => {
  const exact = R() < 0.3;
  let E1: Eq, E2: Eq, xv: number, yv: number, rx: number, ry: number;
  if (exact) { rx = int(R, -4, 4); ry = int(R, -4, 4); [E1, E2] = sysAt(R, rx, ry); xv = rx; yv = ry; }
  else { const o = offGrid(R); E1 = o.E1; E2 = o.E2; xv = qNum(o.x); yv = qNum(o.y); rx = Math.round(xv); ry = Math.round(yv); }
  const who = pick(R, ['Jo', 'Max', 'Lia', 'Ravi', 'Tess']);
  const F1 = formOf(R, E1, 0), F2 = formOf(R, E2, 0);
  const c1 = holds(E1, rx, ry), c2 = holds(E2, rx, ry);
  const opts: Opt[] = [
    { t: `${P(rx, ry)} is the exact solution: it checks in both equations`, say: exact ? 'Yes: it makes both equations true, so it is exact.' : `It does not check: ${!c1 ? checkAt(E1, rx, ry) : checkAt(E2, rx, ry)}`, mc: exact ? undefined : MC.approx },
    { t: `${P(rx, ry)} is only an estimate: it fails at least one equation`, say: exact ? `Check it: ${checkAt(E1, rx, ry)} and ${checkAt(E2, rx, ry)}. Both true: exact.` : `Yes: ${!c1 ? checkAt(E1, rx, ry) : checkAt(E2, rx, ry)}` },
    { t: 'A careful graph reading is always exact, no check needed', mc: MC.approx, say: 'A drawing is never exact enough to be sure: put the pair into both equations.' },
  ];
  const bd = sysBoard(F1, F2);
  return fixedChoice({
    id: `roundedFails-${n}`, family: 'roundedFails', prompt: `${who} graphs ${sysH(F1, F2)} and reads the crossing as ${P(rx, ry)}. Check the reading. Which is true?`, board: bd.board,
    solution: [`First: ${checkAt(E1, rx, ry)}`, `Second: ${checkAt(E2, rx, ry)}`, c1 && c2 ? 'Both true: the reading is exact.' : 'Not both true: the reading is only an estimate.'],
    picture: { g: sysG(E1, E2, [[xv, yv], [rx, ry]], ['L1', 'L2', 'G'], ['S'], [dot('G', rx, ry, 'pick', P(rx, ry)), dot('S', xv, yv, 'link')]), bd: bd.bd, cols: bd.cols },
  }, opts, exact ? 0 : 1);
};

// ===================== graph-with-technology =====================
const terminates = (d: number) => { while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
export const techExact: SGen = (R, n) => {
  for (;;) {
    const a1 = pick(R, [1, 2, 3, 4, -1, -2]), b1 = pick(R, [1, 2, 3, -1, -3]), a2 = pick(R, [1, 3, 5, -1, -2, -4]), b2 = pick(R, [1, 2, 4, -1, -2]);
    const E1 = eq(a1, b1, int(R, -9, 9)), E2 = eq(a2, b2, int(R, -9, 9));
    const S = solve(E1, E2);
    if (S.k !== 'one' || (S.x.q === 1 && S.y.q === 1) || Math.abs(qNum(S.x)) > 6 || Math.abs(qNum(S.y)) > 6) continue;
    const exact = terminates(S.x.q) && terminates(S.y.q);
    if (exact && (S.x.q > 4 || S.y.q > 4)) continue;
    if (!exact && (S.x.q > 9 || S.y.q > 9)) continue;
    const dx = r3(qNum(S.x)), dy = r3(qNum(S.y)), shown = `(${nH(dx)}, ${nH(dy)})`;
    const F1 = std(E1.a < 0 ? eq(-E1.a, -E1.b, -E1.c) : E1), F2 = formOf(R, E2);
    const bd = sysBoard(F1, F2);
    const g = sysG(E1, E2, [[dx, dy]], ['L1', 'L2', 'T'], ['S'], [dot('T', dx, dy, 'pick', shown), dot('S', dx, dy, 'link')]);
    const base = {
      id: `techExact-${n}`, family: 'techExact' as const, board: bd.board, picture: { g, bd: bd.bd, cols: bd.cols },
      prompt: `A graphing tool finds the intersection of ${sysH(F1, F2)} and shows ${shown}. ${exact ? 'Is that value exact?' : 'What is the EXACT solution?'}`,
    };
    if (exact) {
      return fixedChoice({ ...base, solution: [`Put ${shown} into ${fH(F1)}: ${checkAt(E1, dx, dy)}`, `and into the second: ${checkAt(E2, dx, dy)}`, 'Both true with no rounding: the shown value is exact.'] }, [
        { t: 'Exact: it checks in both equations with no rounding', say: 'Yes: both equations come out exactly true.' },
        { t: 'Rounded: a tool always rounds, so it can only be an estimate', mc: undefined, say: `Check it: ${checkAt(E1, dx, dy)}. A shown value is exact when it checks exactly.` },
        { t: 'Cannot tell: a tool value cannot be checked by hand', say: 'You can: put it into both equations.' },
      ], 0);
    }
    const ws: Opt[] = [
      { t: shown, sem: semPt(dx, dy), mc: MC.approx, say: `${nH(dx)} is rounded: ${checkAt(E1, dx, dy)}. Solve exactly to get the fractions.` },
      { t: `(${nH(Math.round(dx * 10) / 10)}, ${nH(Math.round(dy * 10) / 10)})`, sem: semPt(Math.round(dx * 10) / 10, Math.round(dy * 10) / 10), mc: MC.approx, say: 'Rounding more makes it less exact, not more.' },
      { t: PQ(S.y, S.x), sem: semPt(qNum(S.y), qNum(S.x)), mc: MC.order, say: 'x comes first.' },
    ];
    return choice(R, { ...base, solution: [`${shown} has rounded decimals: ${checkAt(E1, dx, dy)}.`, `Solving exactly gives ${PQ(S.x, S.y)}: ${checkQ(E1, S.x, S.y)}`] },
      PQ(S.x, S.y), `Yes: ${PQ(S.x, S.y)}; the tool showed it rounded.`, ws, { sem: semPt(qNum(S.x), qNum(S.y)) });
  }
};
export const techWindow: SGen = (R, n) => {
  for (;;) {
    const x0 = pick(R, [12, 14, 16, -12, -14, -16]), m1 = pick(R, [q(1, 2), q(1), q(2), q(-1, 2)]), m2 = pick(R, [q(1), q(3, 2), q(-1), q(1, 4), q(3, 4)]);
    if (qNum(m1) === qNum(m2)) continue;
    const y0 = int(R, -4, 4) * 2 + (x0 > 0 ? 2 : -2);
    const k1 = y0 - qNum(m1) * x0, k2 = y0 - qNum(m2) * x0;
    if (!Number.isInteger(k1 * 4) || !Number.isInteger(k2 * 4)) continue;
    const F1 = si(m1, q(Math.round(k1 * 4), 4)), F2 = si(m2, q(Math.round(k2 * 4), 4));
    const E1 = eqOf(F1), E2 = eqOf(F2);
    // both lines must show in the default window -10..10
    const inWin = (E: Eq) => [-10, -5, 0, 5, 10].some(x => Math.abs(yAt(E, x)) <= 10);
    if (!inWin(E1) || !inWin(E2)) continue;
    const gap = (x: number) => Math.abs(yAt(E1, x) - yAt(E2, x));
    if (Math.min(gap(-10), gap(10)) < 1.5) continue;
    const bd = sysBoard(F1, F2);
    const opts: Opt[] = [
      { t: 'Change the window: the slopes differ, so the lines cross somewhere off the screen', say: `Yes: the slopes are ${qH(m1)} and ${qH(m2)}. Widen the window and the crossing ${P(x0, y0)} appears.` },
      { t: 'No solution: the lines do not meet on the screen', mc: MC.sketch, say: `A crossing off the screen is still a crossing. The slopes ${qH(m1)} and ${qH(m2)} differ.` },
      { t: 'The lines are parallel', mc: MC.byEye, say: `Parallel lines have equal slopes. These have ${qH(m1)} and ${qH(m2)}.` },
    ];
    return fixedChoice({
      id: `techWindow-${n}`, family: 'techWindow', prompt: `In the standard window (−10 to 10 on both axes) a graphing tool shows ${sysH(F1, F2)} but no intersection. What do you do or conclude?`, board: bd.board,
      solution: [`The slopes are ${qH(m1)} and ${qH(m2)}: different, so the lines DO cross.`, `Zoom out: the tool finds ${P(x0, y0)}. Check: ${checkF(F1, x0, y0)}.`],
      picture: { g: sysG(E1, E2, [], ['L1', 'L2'], ['far'], [text('far', x0 > 0 ? 9.5 : -9.5, 8, x0 > 0 ? `→ ${P(x0, y0)}` : `${P(x0, y0)} ←`, 'link', x0 > 0 ? 'right' : 'left')], { x: { min: -10, max: 10, step: 2, name: 'x' }, y: { min: -10, max: 10, step: 2, name: 'y' }, equal: true }), bd: bd.bd, cols: bd.cols },
    }, opts, 0);
  }
};
export { PT, xs };
