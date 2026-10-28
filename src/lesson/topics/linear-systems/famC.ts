// famC.ts: stage 3 of "Systems of equations": how many solutions (from the graph, by slopes and intercepts, by
// 0 = k and 0 = 0, by comparing c2 with k·c1, by inspection), the proof that replacing E2 by E2 + kE1 keeps the solution
// set (both directions), writing a system from words, a graph or a table, and judging a solution in its context. Pure.
import { gcd, int, pick } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import {
  type Eq, type Form, type Letters, P, PQ, add, checkAt, checkF, cv, eH, eT, eq, eqOf, exprH, fH, fT, holds, letters, lineKey, nH, nT, q, qH, qNum, scale, si, solve, std, through, xs,
} from './sysMaths';
import { type Opt, type SGen, MC, PTIO, choice, dot, fixedChoice, line, pairItem, revSlip, semLine, semSys, sysBoard, sysG, sysH, text } from './itemKit';
import { winAround } from './sysPic';
import { formOf, sysAt } from './famA';

const X = '<i>x</i>', Y = '<i>y</i>';
const COUNT = ['One solution', 'No solution', 'Infinitely many solutions'];
/** a line through a lattice point near the origin */
const lineNear = (R: () => number, a: number, b: number) => through(a, b, int(R, -3, 3), int(R, -3, 3));
/** a pair of lines of the given kind: one crossing, distinct parallel, or the same line written twice */
function pairOf(R: () => number, kind: 0 | 1 | 2, vertOk = true): { E1: Eq; E2: Eq; F1: Form; F2: Form; pts: [number, number][] } {
  for (;;) {
    if (kind === 0) {
      const x0 = int(R, -4, 4), y0 = int(R, -4, 4), [E1, E2] = sysAt(R, x0, y0);
      return { E1, E2, F1: formOf(R, E1), F2: formOf(R, E2), pts: [[x0, y0]] };
    }
    if (vertOk && R() < 0.15) {
      const a = int(R, -4, 4), m = pick(R, [2, 3]), b = kind === 2 ? a : a + pick(R, [-3, -2, -1, 1, 2, 3]);
      const E1 = eq(1, 0, a), E2 = eq(m, 0, m * b);
      return { E1, E2, F1: std(E1), F2: std(E2), pts: [[a, 0], [b, 0]] };
    }
    const a = pick(R, [1, 2, 3, -1, -2]), b = pick(R, [1, 2, 3, -1, -3]);
    if (gcd(a, b) > 1) continue;
    const E1 = lineNear(R, a, b), k = pick(R, [2, 3, -1, -2]);
    const E2 = kind === 2 ? scale(E1, k) : scale(lineNear(R, a, b), k);
    if (kind === 1 && lineKey(E1) === lineKey(E2)) continue;
    const F1 = formOf(R, E1), F2 = std(E2.a < 0 || (E2.a === 0 && E2.b < 0) ? scale(E2, -1) : E2);
    return { E1, E2, F1, F2, pts: [[0, 0]] };
  }
}
const why3 = (kind: number, F1: Form, F2: Form) => kind === 0 ? 'Different slopes: the lines cross once.' : kind === 1 ? `Same slope, different lines: ${fH(F1)} and ${fH(F2)} never meet.` : `${fH(F2)} is a multiple of ${fH(F1)}: the same line, so every point on it is a solution.`;

// ===================== graph-classify =====================
export const classifyGraph: SGen = (R, n) => {
  const kind = pick(R, [0, 1, 2] as const), { E1, E2, F1, F2, pts } = pairOf(R, kind);
  const opts: Opt[] = COUNT.map((t, i) => ({
    t, say: i === kind ? `Yes. ${why3(kind, F1, F2)}` : why3(kind, F1, F2),
    mc: i === kind ? undefined : kind === 2 && i === 0 ? MC.coincOne : kind === 0 && i === 1 ? MC.byEye : undefined,
  }));
  const sys = sysBoard(F1, F2);
  return fixedChoice({
    id: `classifyGraph-${n}`, family: 'classifyGraph', prompt: `The graphs of ${sysH(F1, F2)} are drawn. How many solutions does the system have?`, board: sys.board,
    solution: [kind === 2 ? 'The teal line lies exactly on the amber one (dashed on top): one line, drawn twice.' : kind === 1 ? 'The lines run side by side and never meet.' : 'The lines meet at one point.', why3(kind, F1, F2)],
    picture: { g: sysG(E1, E2, pts, ['L1', 'L2'], kind === 0 ? ['S'] : [], kind === 0 ? [dot('S', pts[0]![0], pts[0]![1], 'link', P(pts[0]![0], pts[0]![1]))] : []), bd: sys.bd, cols: sys.cols },
  }, opts, kind);
};
const NEAR: [ReturnType<typeof q>, ReturnType<typeof q>][] = [[q(1), q(11, 10)], [q(1, 2), q(3, 5)], [q(-1), q(-9, 10)], [q(2), q(21, 10)], [q(-1, 2), q(-2, 5)]];
export const cannotTell: SGen = (R, n) => {
  for (;;) {
    const [m1, m2] = pick(R, NEAR), k1 = int(R, -2, 2), k2 = k1 + pick(R, [-2, -1, 1, 2]);
    const F1 = si(m1, k1), F2 = si(m2, k2), E1 = eqOf(F1), E2 = eqOf(F2);
    const S = solve(E1, E2);
    if (S.k !== 'one' || Math.abs(qNum(S.x)) < 8) continue;
    const g = sysG(E1, E2, [], ['L1', 'L2'], ['far'], [text('far', qNum(S.x) > 0 ? 4.6 : -4.6, 4.2, qNum(S.x) > 0 ? `→ x = ${qH(S.x).replace(/<[^>]+>/g, '')}` : `x = ${qH(S.x).replace(/<[^>]+>/g, '')} ←`, 'link', qNum(S.x) > 0 ? 'right' : 'left')], { x: { min: -5, max: 5, step: 1, name: 'x' }, y: { min: -5, max: 5, step: 1, name: 'y' }, equal: true });
    if (!Number.isInteger(qNum(S.x))) continue;
    return fixedChoice({
      id: `cannotTell-${n}`, family: 'cannotTell', prompt: `Only this picture of two lines is given, no equations. They meet the y-axis at (0, ${nH(k1)}) and (0, ${nH(k2)}) and look parallel. From the picture alone, how many solutions does the system have?`, board: '\\text{solutions} = \\,?',
      solution: [`The picture cannot show whether the lines meet further out. The equations decide: ${fH(F1)} and ${fH(F2)}.`, `Slopes ${qH(m1)} and ${qH(m2)} differ: they cross once, at ${X} = ${qH(S.x)}, far off the picture.`],
      picture: { g, bd: [], cols: [], tex: [fT(F1), fT(F2)] },
    }, [
      { t: 'No solution: the lines are parallel', mc: MC.byEye, say: 'Lines that look parallel may still meet far away. Only the slopes can tell.' },
      { t: 'Cannot tell from the picture alone: check the equations', say: 'Yes: a picture cannot show slopes exactly, or what happens off the edge.' },
      { t: 'No solution: they do not meet on the picture', mc: MC.sketch, say: 'A crossing off the picture is still a crossing.' },
      { t: 'Infinitely many solutions', say: 'The lines are clearly two different lines.' },
    ], 1);
  }
};
const CI = ['Consistent and independent: exactly one solution', 'Inconsistent: no solution', 'Consistent and dependent: infinitely many solutions'];
export const termsCI: SGen = (R, n) => {
  const kind = pick(R, [0, 1, 2] as const), { E1, E2, F1, F2, pts } = pairOf(R, kind);
  const opts: Opt[] = CI.map((t, i) => ({ t, say: i === kind ? `Yes. ${why3(kind, F1, F2)}` : `${why3(kind, F1, F2)} Consistent = at least one solution; dependent = the equations say the same thing.`, mc: kind === 2 && i === 0 ? MC.coincOne : undefined }));
  const sys = sysBoard(F1, F2);
  return fixedChoice({
    id: `termsCI-${n}`, family: 'termsCI', prompt: `Which word fits the system ${sysH(F1, F2)} (graphed)?`, board: sys.board,
    solution: [why3(kind, F1, F2), 'Consistent: it has a solution. Independent: exactly one. Dependent: the same line twice. Inconsistent: none.'],
    picture: { g: sysG(E1, E2, pts, ['L1', 'L2'], []), bd: sys.bd, cols: sys.cols },
  }, opts, kind);
};

// ===================== predict-by-slopes =====================
export const predictSlopes: SGen = (R, n) => {
  for (;;) {
    const mode = pick(R, ['one', 'none', 'inf', 'hv', 'vv', 'std'] as const);
    let F1: Form, F2: Form, kind: 0 | 1 | 2, why: string;
    if (mode === 'hv') {
      const a = int(R, -4, 4), b = int(R, -4, 4);
      F1 = std(eq(1, 0, a)); F2 = std(eq(0, 1, b)); kind = 0; why = `${fH(F1)} is vertical (no slope), ${fH(F2)} is horizontal (slope 0): they cross at ${P(a, b)}.`;
    } else if (mode === 'vv') {
      const a = int(R, -4, 4), b = a + pick(R, [-3, -2, 2, 3]);
      F1 = std(eq(1, 0, a)); F2 = std(eq(1, 0, b)); kind = 1; why = 'Two different vertical lines: parallel, they never meet.';
    } else {
      const m = q(pick(R, [1, 2, 3, -1, -2, -3, 1, -1]), pick(R, [1, 1, 2, 3])), k = int(R, -5, 5);
      if (gcd(m.p, m.q) !== 1) continue;
      F1 = si(m, k);
      if (mode === 'one') { const m2 = q(m.p + pick(R, [1, -1, 2]), m.q); F2 = si(m2, int(R, -5, 5)); kind = 0; why = `Slopes ${qH(m)} and ${qH(m2)} differ: one crossing.`; if (m2.p === 0 && R() < 0.5) continue; }
      else if (mode === 'none') { const k2 = k + pick(R, [-3, -2, -1, 1, 2, 3]); F2 = si(m, k2); kind = 1; why = `Same slope ${qH(m)}, different intercepts ${nH(k)} and ${nH(k2)}: parallel, no crossing.`; }
      else if (mode === 'inf') { const E = eqOf(F1), s = pick(R, [2, 3, -2]); F2 = std(scale(E.a < 0 ? scale(E, -1) : E, s)); kind = 2; why = `${fH(F2)} rewritten is ${fH(F1)}: same slope AND same intercept, one line.`; }
      else {
        // standard form that must be rewritten first
        const s = pick(R, [2, 3, -2]), k2 = R() < 0.5 ? k : k + pick(R, [-2, 2]);
        const E2 = eqOf(si(m, k2)), F = scale(E2.a < 0 ? scale(E2, -1) : E2, s);
        F2 = std(F); kind = k2 === k ? 2 : 1; why = `Rewrite ${fH(F2)}: ${fH(si(m, k2))}. ${k2 === k ? 'Same slope, same intercept: one line.' : 'Same slope, different intercept: parallel.'}`;
      }
    }
    const opts: Opt[] = COUNT.map((t, i) => ({
      t, say: i === kind ? `Yes. ${why}` : why,
      mc: i === kind ? undefined : kind === 2 && i === 1 ? MC.equalDistinct : mode === 'hv' && i === 1 ? MC.zeroK : kind === 2 && i === 0 ? MC.coincOne : undefined,
    }));
    const E1 = eqOf(F1), E2 = eqOf(F2), sys = sysBoard(F1, F2);
    const pts: [number, number][] = kind === 0 ? (() => { const S = solve(E1, E2); return S.k === 'one' ? [[qNum(S.x), qNum(S.y)] as [number, number]] : [[0, 0] as [number, number]]; })() : [[0, 0]];
    if (Math.abs(pts[0]![0]) > 8 || Math.abs(pts[0]![1]) > 8) continue;
    return fixedChoice({
      id: `predictSlopes-${n}`, family: 'predictSlopes', prompt: `Without graphing: how many solutions does ${sysH(F1, F2)} have? Compare slopes and intercepts.`, board: sys.board,
      solution: [why, kind === 0 ? 'Different slopes: exactly one solution.' : kind === 1 ? 'Parallel and distinct: no solution.' : 'The same line: infinitely many solutions.'],
      picture: { g: sysG(E1, E2, pts, [], ['L1', 'L2']), bd: sys.bd, cols: sys.cols },
    }, opts, kind);
  }
};

// ===================== contradiction-no-solution =====================
const CONTRA = (k: number) => [
  { t: 'No solution: no pair makes both equations true', say: `Yes: ${nH(0)} = ${nH(k)} is false whatever ${X} and ${Y} are. The lines are parallel.` },
  { t: `${X} = ${nH(k)}`, mc: MC.contraValue, say: `There is no ${X} left in 0 = ${nH(k)}: it is a false statement, not a value.` },
  { t: 'A mistake was made: start again', mc: MC.noSolError, say: 'No mistake: some systems really have no solution. The false statement is the answer.' },
  { t: 'Infinitely many solutions: the letters cancelled', mc: MC.cancelInf, say: `Cancelling is not enough: what is LEFT decides. 0 = ${nH(k)} is false, so there are none.` },
];
export const contraMeaning: SGen = (R, n) => {
  for (;;) {
    const a = pick(R, [1, 2, 3, -1, -2]), b = pick(R, [1, 2, 3, -1, -3, 4]), m = pick(R, [-1, -2, -3, 2, 3]);
    if (gcd(a, b) > 1) continue;
    const E1 = lineNear(R, a, b), E2 = scale(lineNear(R, a, b), m);
    const k = E2.c - m * E1.c;
    if (k === 0) continue;
    const K = scale(E1, -m), S = add(K, E2);
    const sys = sysBoard(std(E1), std(E2), [`${eT(K)}`, `0 = ${nT(k)}`]);
    sys.cols = ['first', 'second', 'dim', 'wrong'];
    return fixedChoice({
      id: `contraMeaning-${n}`, family: 'contraMeaning', prompt: `Solving ${sysH(std(E1), std(E2))}: multiply the first by ${nH(-m)} and add. Both letters cancel and you get 0 = ${nH(k)}. What does that mean?`, board: sys.board,
      solution: [`Adding, both letters cancel: 0 = ${nH(S.c)}, false for EVERY pair.`, 'So no pair makes both equations true: no solution. The graphs are parallel lines.'],
      picture: { g: sysG(E1, E2, [[0, 0]], [], ['L1', 'L2']), bd: sys.bd, cols: sys.cols },
    }, CONTRA(k), 0);
  }
};
export const contraSub: SGen = (R, n) => {
  for (;;) {
    const m = q(pick(R, [1, 2, 3, -1, -2, 1, 3]), pick(R, [1, 1, 2])), k1 = int(R, -6, 6), s = pick(R, [2, 3, -2]);
    if (gcd(m.p, m.q) !== 1) continue;
    const k2 = k1 + pick(R, [-3, -2, -1, 1, 2, 3]);
    const F1 = si(m, k1), E2 = scale(eqOf(si(m, k2)), s), F2 = std(E2.a < 0 ? scale(E2, -1) : E2);
    const G = eqOf(F2);
    // substitute y = m x + k1 into G: G.a x + G.b (m x + k1) = G.c  ->  G.b k1 = G.c
    const left = G.b * k1, right = G.c;
    if (left === right) continue;
    const sys = sysBoard(F1, F2, [`${nT(left)} = ${nT(right)}`]);
    sys.cols = ['first', 'second', 'wrong'];
    return fixedChoice({
      id: `contraSub-${n}`, family: 'contraSub', prompt: `Substitute ${fH(F1)} into ${fH(F2)}. The ${X}-terms cancel and you get ${nH(left)} = ${nH(right)}. How many solutions does the system have?`, board: sys.board,
      solution: [`${cv(G.a, X)} ${G.b < 0 ? '−' : '+'} ${nH(Math.abs(G.b))}(${exprH(m, q(k1))}) = ${nH(G.c)} gives ${nH(left)} = ${nH(right)}: false for every ${X}.`, 'No solution: same slope, different intercept, parallel lines.'],
      picture: { g: sysG(eqOf(F1), G, [[0, 0]], [], ['L1', 'L2']), bd: sys.bd, cols: sys.cols },
    }, [
      { t: 'No solution', say: `Yes: ${nH(left)} = ${nH(right)} is never true.` },
      { t: `One solution, with ${X} = 0`, mc: MC.zeroNo, say: `The ${X}-terms vanished; that does not make ${X} zero. ${nH(left)} = ${nH(right)} is false for every ${X}.` },
      { t: `Infinitely many: the ${X}-terms cancelled`, mc: MC.cancelInf, say: `What is left decides: ${nH(left)} = ${nH(right)} is false, so none.` },
      { t: `One solution, with ${X} = ${nH(right - left)}`, mc: MC.contraValue, say: `There is no ${X} left: ${nH(left)} = ${nH(right)} is just false.` },
    ], 0);
  }
};

// ===================== identity-infinite-line =====================
export const identityMeaning: SGen = (R, n) => {
  for (;;) {
    const a = pick(R, [1, 2, 3, -1]), b = pick(R, [1, 2, 3, -1, -2, -3]), m = pick(R, [-1, -2, -3, 2, 3]);
    if (gcd(a, b) > 1) continue;
    const E1 = lineNear(R, a, b), E2 = scale(E1, m);
    if (E1.c === 0) continue;
    const sys = sysBoard(std(E1), std(E2), [`${eT(scale(E1, -m))}`, '0 = 0']);
    sys.cols = ['first', 'second', 'dim', 'link'];
    return choice(R, {
      id: `identityMeaning-${n}`, family: 'identityMeaning', prompt: `Solving ${sysH(std(E1), std(E2))}: multiply the first by ${nH(-m)} and add. You get 0 = 0. Which describes ALL the solutions?`, board: sys.board,
      solution: [`0 = 0 is always true, so the second equation adds nothing: it is ${nH(m)} times the first.`, `One condition is left: ${eH(E1)}. Every point of that line, and only those.`],
      picture: { g: sysG(E1, E2, [[0, 0]], [], ['L1', 'L2']), bd: sys.bd, cols: sys.cols },
    }, `Every (${X}, ${Y}) on the line ${eH(E1)}`, 'Yes: infinitely many, all on that one line.', [
      { t: `Every point (${X}, ${Y}) of the plane`, mc: MC.everyPoint, say: `(0, 0) is not on ${eH(E1)}: ${checkAt(E1, 0, 0)}. Only points on the line work.` },
      { t: 'Only (0, 0)', mc: MC.zeroNo, say: `0 = 0 does not mean the letters are 0. ${checkAt(E1, 0, 0)}` },
      { t: 'The lines cross at many separate points', mc: MC.manyCross, say: 'Two different lines cross at most once. These are the SAME line.' },
      { t: 'No solution', say: '0 = 0 is true, not false: there are solutions, infinitely many.' },
    ], { sem: 'theLine' });
  }
};
export const identityMember: SGen = (R, n) => {
  for (;;) {
    const a = pick(R, [1, 2, 3, -1]), b = pick(R, [1, 2, 3, -1, -2, -3]), m = pick(R, [-1, -2, 3, 2]);
    if (gcd(a, b) > 1) continue;
    const x0 = int(R, -4, 4), y0 = int(R, -4, 4), E1 = through(a, b, x0, y0), E2 = scale(E1, m);
    if (E1.c === 0) continue;
    const t = pick(R, [-1, 1, 2]), on: [number, number] = [x0 + t * b, y0 - t * a];
    if (Math.abs(on[0]) > 7 || Math.abs(on[1]) > 7) continue;
    const off: [number, number] = [on[0] + 1, on[1] + 1];
    const ws: Opt[] = [
      { t: P(0, 0), sem: holds(E1, 0, 0) ? 'on' : 'P00', mc: MC.zeroNo, say: `${checkAt(E1, 0, 0)}: not on the line.` },
      { t: P(off[0], off[1]), sem: holds(E1, off[0], off[1]) ? 'on' : 'off1', mc: MC.everyPoint, say: `Infinitely many does not mean every point: ${checkAt(E1, off[0], off[1])}.` },
      { t: P(on[1], on[0]), sem: holds(E1, on[1], on[0]) ? 'on' : 'off2', mc: MC.order, say: `x first: ${checkAt(E1, on[1], on[0])}.` },
    ];
    const sys = sysBoard(std(E1), std(E2));
    return choice(R, {
      id: `identityMember-${n}`, family: 'identityMember', prompt: `The system ${sysH(std(E1), std(E2))} has infinitely many solutions. Which pair is one of them?`, board: sys.board,
      solution: [`The second equation is ${nH(m)} times the first: one line, ${eH(E1)}.`, `A solution is any point ON it: ${P(on[0], on[1])} gives ${checkAt(E1, on[0], on[1])}`],
      picture: { g: sysG(E1, E2, [on, off, [0, 0]], [], ['L1', 'L2', 'S'], [dot('S', on[0], on[1], 'link', P(on[0], on[1]))]), bd: sys.bd, cols: sys.cols },
    }, P(on[0], on[1]), `Yes: ${P(on[0], on[1])} is on the line.`, ws, { sem: 'on' });
  }
};

// ===================== connect-algebra-graph =====================
/** k·(left side) written as "ky = (km)x + K" or in standard form */
function scaledForm(R: () => number, m: number, s: number, K: number): Form {
  const E = eq(-s * m, s, K);   // s y = s m x + K  ->  −s m x + s y = K
  if (R() < 0.5) return { f: 'raw', h: `${cv(s, Y)} = ${exprH(q(s * m), q(K))}`, t: `${s === 1 ? '' : s === -1 ? '-' : s}y = ${exprH(q(s * m), q(K)).replace(/<[^>]+>/g, '').replace(/−/g, '-')}`, E };
  return std(E.a < 0 ? scale(E, -1) : E);
}
export const scaledConst: SGen = (R, n) => {
  for (;;) {
    const same = R() < 0.55;
    if (R() < 0.15) {
      const a = int(R, -4, 4), s = pick(R, [2, 3]), b = same ? a : a + pick(R, [-2, -1, 1, 2]);
      const F1 = std(eq(1, 0, a)), F2 = std(eq(s, 0, s * b)), sys = sysBoard(F1, F2);
      return fixedChoice({
        id: `scaledConst-${n}`, family: 'scaledConst', prompt: `The left side of ${fH(F2)} is ${s} times the left side of ${fH(F1)}. Compare the right sides: what do the graphs look like?`, board: sys.board,
        solution: [`${s} times the right side ${nH(a)} is ${nH(s * a)}; ${fH(F2)} has ${nH(s * b)}.`, same ? `Equal: it is ${X} = ${nH(a)} again, the same vertical line.` : `Different: ${X} = ${nH(b)}, a different vertical line, parallel.`],
        picture: { g: sysG(eq(1, 0, a), eq(s, 0, s * b), [[a, 0], [b, 0]], [], ['L1', 'L2']), bd: sys.bd, cols: sys.cols },
      }, [
        { t: 'The same line: infinitely many solutions', say: same ? 'Yes: the right side scaled the same way.' : `${s} × ${nH(a)} = ${nH(s * a)}, not ${nH(s * b)}: a different line.` },
        { t: 'Parallel lines: no solution', mc: same ? MC.unscaled : undefined, say: same ? `Compare ${nH(s * b)} with ${s} × ${nH(a)} = ${nH(s * a)}, not with ${nH(a)}: equal, the same line.` : 'Yes: parallel and distinct.' },
        { t: 'Two lines crossing once', say: 'Both are vertical: they never cross once.' },
      ], same ? 0 : 1);
    }
    const m = pick(R, [1, 2, 3, -1, -2, -3]), k = int(R, -4, 4), s = pick(R, [2, 3, -2, 4]);
    const K = same ? s * k : s * k + pick(R, [-3, -2, -1, 1, 2, 3]);
    if (same && K === k) continue;
    const F1 = R() < 0.6 ? si(m, k) : std(eqOf(si(m, k)).a < 0 ? scale(eqOf(si(m, k)), -1) : eqOf(si(m, k)));
    const F2 = scaledForm(R, m, s, K);
    const sys = sysBoard(F1, F2);
    const E1 = eqOf(F1), E2 = eqOf(F2);
    if (lineKey(E1) === lineKey(E2) !== same) continue;
    const opts: Opt[] = [
      { t: 'The same line: infinitely many solutions', say: same ? `Yes: ${s} × ${nH(k)} = ${nH(K)}, the constant scaled too.` : `${s} × ${nH(k)} = ${nH(s * k)}, but the constant is ${nH(K)}: different lines.` },
      { t: 'Parallel lines: no solution', mc: same ? MC.unscaled : undefined, say: same ? `Compare ${nH(K)} with ${s} × ${nH(k)} = ${nH(s * k)}, not with ${nH(k)} itself: equal, the same line.` : `Yes: the left side is scaled by ${s}, the constant is not (${nH(K)} ≠ ${nH(s * k)}): parallel.` },
      { t: 'One crossing point', say: `The left sides are multiples: the slopes are equal (${nH(m)}), so not one crossing.` },
      { t: 'Many separate crossing points', mc: MC.manyCross, say: 'Two lines cannot cross at several separate points: either once, never, or they are the same line.' },
    ];
    return fixedChoice({
      id: `scaledConst-${n}`, family: 'scaledConst', prompt: `In ${sysH(F1, F2)}, the second equation's ${X} and ${Y} parts are ${s} times the first one's. Compare the constants: what are the graphs?`, board: sys.board,
      solution: [`Write the first as ${eH(E1.b < 0 ? scale(E1, -1) : E1)}. Times ${s}: the constant would be ${nH(s * (E1.b < 0 ? -E1.c : E1.c))}.`, same ? `It is: the same line, infinitely many solutions.` : `It is not: parallel lines, no solution.`],
      picture: { g: sysG(E1, E2, [[0, 0]], [], ['L1', 'L2']), bd: sys.bd, cols: sys.cols },
    }, opts, same ? 0 : 1);
  }
};
export const sameLineForms: SGen = (R, n) => {
  for (;;) {
    const m = pick(R, [1, 2, 3, -1, -2, -3]), k = pick(R, [1, 2, 3, 4, -1, -2, -3, 5]), s = pick(R, [2, 3, 4]);
    const E = eqOf(si(m, k)), base = E.a < 0 ? scale(E, -1) : E, Rt = scale(base, s);
    const ws: Opt[] = [
      { t: eH(eq(Rt.a, Rt.b, base.c)), sem: lineKey(eq(Rt.a, Rt.b, base.c)), mc: MC.unscaled, say: `Multiply the constant too: ${s} × ${nH(base.c)} = ${nH(Rt.c)}.` },
      { t: eH(eq(-Rt.a, Rt.b, Rt.c)), sem: lineKey(eq(-Rt.a, Rt.b, Rt.c)), mc: MC.moveSign, say: `Moving ${cv(m, X)} across changes its sign.` },
      { t: 'None: a line has only one equation', mc: MC.uniqueEq, say: `Multiply ${fH(si(m, k))} through and rearrange: a line has many equations.` },
    ];
    return choice(R, {
      id: `sameLineForms-${n}`, family: 'sameLineForms', prompt: `Which equation describes the SAME line as ${fH(si(m, k))}?`, board: fT(si(m, k)),
      solution: [`Move the ${X}-term: ${eH(base)}.`, `Multiply every term by ${s}: ${eH(Rt)}. Same points, same line.`],
      picture: { g: sysG(eqOf(si(m, k)), Rt, [[0, k]], ['L1'], ['L2']), bd: [], cols: ['first'] },
    }, eH(Rt), `Yes: ${eH(Rt)} is ${s} times ${eH(base)}.`, ws, { sem: lineKey(Rt) });
  }
};

// ===================== inspect-structure =====================
export const inspect: SGen = (R, n) => {
  for (;;) {
    const mode = pick(R, ['sameLeft', 'multiple', 'negMult', 'xy'] as const);
    const a = pick(R, [1, 2, 3, 4]), b = pick(R, [1, 2, 3, -1, -2, -4]), c = int(R, -6, 8);
    if (gcd(a, b) > 1) continue;
    let E1: Eq, E2: Eq, kind: 0 | 1 | 2, why: string;
    if (mode === 'sameLeft') { const c2 = c + pick(R, [-2, -1, 1, 2, 3]); E1 = eq(a, b, c); E2 = eq(a, b, c2); kind = 1; why = `The same left side cannot equal both ${nH(c)} and ${nH(c2)}: no solution.`; }
    else if (mode === 'multiple') { const s = pick(R, [2, 3]); E1 = eq(a, b, c); E2 = scale(E1, s); kind = 2; why = `The second is ${s} times the first: the same line.`; }
    else if (mode === 'negMult') { E1 = eq(-a, b, c); E2 = eq(a, -b, -c); kind = 2; why = 'The second is −1 times the first (every sign flipped): the same line.'; }
    else { const x0 = int(R, -5, 5), y0 = int(R, -5, 5); E1 = eq(1, 0, x0); E2 = eq(0, 1, y0); kind = 0; why = `It is already solved: ${P(x0, y0)}.`; }
    const opts: Opt[] = COUNT.map((t, i) => ({ t, say: i === kind ? `Yes. ${why}` : why, mc: i === kind ? undefined : mode === 'negMult' ? MC.negMult : mode === 'multiple' && i === 0 ? MC.coincOne : undefined }));
    const sys = sysBoard(std(E1), std(E2));
    return fixedChoice({
      id: `inspect-${n}`, family: 'inspect', prompt: `By inspection, without solving: how many solutions does ${sysH(std(E1), std(E2))} have?`, board: sys.board,
      solution: [why, kind === 0 ? 'Exactly one solution.' : kind === 1 ? 'No solution.' : 'Infinitely many solutions.'],
      picture: { g: sysG(E1, E2, mode === 'xy' ? [[E1.c, E2.c]] : [[0, 0]], [], ['L1', 'L2']), bd: sys.bd, cols: sys.cols },
    }, opts, kind);
  }
};

// ===================== prove-elimination =====================
export const proofDir: SGen = (R, n) => {
  const s = int(R, 3, 9), d = int(R, 1, 3), k = pick(R, [2, 3, -2]);
  const x0 = (s + d) / 2;
  const general = R() < 0.45 || !Number.isInteger(x0);
  const E1 = eq(1, 1, s), E2 = eq(1, -1, d), N = add(E2, scale(E1, k));
  const ex = general ? `E₁: a₁${X} + b₁${Y} = c₁ is kept and E₂: a₂${X} + b₂${Y} = c₂ is replaced by E₂ + kE₁` : `In ${sysH(std(E1), std(E2))}, the first is kept and the second is replaced by second ${k < 0 ? `− ${-k}` : `+ ${k}`} × first: ${eH(N)}`;
  return fixedChoice({
    id: `proofDir-${n}`, family: 'proofDir', prompt: `${ex}. To PROVE the new system has the same solutions as the old one, what must you show?`, board: general ? 'E_2 \\to E_2 + kE_1' : eT(N),
    solution: ['Same solution set means: every old solution is a new one AND every new solution is an old one.', 'So the proof needs both directions: forward (old ⇒ new) and back (new ⇒ old).'],
    picture: general ? undefined : { g: sysG(E1, E2, [[x0, (s - d) / 2]], ['L1', 'L2'], ['N'], [line('N', N, 'link')]), bd: [eT(E1), eT(E2)], cols: ['link', 'first', 'second'] },
  }, [
    { t: 'Both: every old solution solves the new system, AND every new solution solves the old one', say: 'Yes: equal sets need both inclusions.' },
    { t: 'Only that the old solution also solves the new system', mc: MC.oneDir, say: 'That shows the new system keeps the old solutions, but not that it adds no new ones. Show the reverse too.' },
    { t: 'Only that the new equation is true at the solution', mc: MC.keepsOnly, say: 'The new SYSTEM is the kept equation and the new one together; and both directions are needed.' },
  ], 0);
};
export const proofReverse: SGen = (R, n) => {
  const s = int(R, 3, 9), d = int(R, 1, 3), k = pick(R, [2, 3, -2, 4]);
  const E1 = eq(1, 1, s), E2 = eq(1, -1, d), N = add(E2, scale(E1, k));
  const general = R() < 0.4;
  const ctx = general ? `(p, q) makes E₁ and E₂ + kE₁ true. Why does it make E₂ true?` : `(p, q) makes ${eH(E1)} and ${eH(N)} true (the second came from second ${k < 0 ? `− ${-k}` : `+ ${k}`} × first). Why does (p, q) make ${eH(E2)} true?`;
  return fixedChoice({
    id: `proofReverse-${n}`, family: 'proofReverse', prompt: `The reverse direction of the proof. ${ctx}`, board: general ? '(E_2 + kE_1) - kE_1 = E_2' : eT(N),
    solution: [general ? 'Take E₂ + kE₁ and subtract k times E₁: equals minus equals are equal.' : `${eH(N)} ${k < 0 ? `plus ${-k}` : `minus ${k}`} × (${eH(E1)}) gives back ${eH(E2)}.`, 'So every solution of the new system solves the old one: the reverse inclusion.'],
    picture: general ? undefined : { g: sysG(E1, N, [[0, 0]], ['L1', 'L2'], ['O'], [line('O', E2, 'pick')]), bd: [eT(E1)], cols: ['second', 'first'] },
  }, [
    { t: 'Subtract k times E₁ from E₂ + kE₁: what is left is E₂, and equals minus equals are equal', say: 'Yes: the step can be undone, so nothing new sneaks in.' },
    { t: 'It cannot be shown: once E₂ is replaced it is gone', mc: MC.keepsOnly, say: 'It is not gone: E₁ is still in the system, and subtracting k·E₁ brings E₂ back.' },
    { t: 'No need: the forward direction already proves it', mc: MC.oneDir, say: 'Forward only shows old ⇒ new. Same solution set needs new ⇒ old as well.' },
    { t: 'Add k times E₁ once more', say: 'Adding again gives E₂ + 2kE₁, further away. Undo the addition: subtract.' },
  ], 0);
};

// ===================== formulate-system / judge-viability =====================
interface Story { L: Letters; story: string; ask: string; right: [Form, Form]; x0: number; y0: number; wrongs: { F: [Form, Form] | null; t?: string; mc?: string; say: string }[]; lead: string; op: string }
function storyOf(R: () => number, kind = pick(R, ['tickets', 'times', 'coins', 'nuts'] as const), viable = true): Story {
  for (;;) {
    if (kind === 'tickets') {
      const N = pick(R, [40, 50, 60, 80, 100, 120, 150]), pa = pick(R, [8, 9, 10, 12, 15]), ps = pick(R, [4, 5, 6]), a0 = int(R, 5, N - 5), s0 = N - a0;
      const T = viable ? pa * a0 + ps * s0 : pa * a0 + ps * s0 + pick(R, [1, 2, -1, -2]);
      const L = letters('a', 's');
      const F1 = std(eq(1, 1, N)), F2 = std(eq(pa, ps, T));
      return {
        L, story: `A theater sold ${N} tickets for $${T}: adult tickets at $${pa}, student tickets at $${ps}. Let <i>a</i> = adult tickets, <i>s</i> = student tickets.`,
        ask: 'How many of each were sold?', right: [F1, F2], x0: a0, y0: s0, lead: 'adult:', op: '&nbsp; student:',
        wrongs: [
          { F: [F1, std(eq(ps, pa, T))], mc: MC.swapRates, say: `Each price goes with its own ticket: $${pa} with <i>a</i>, $${ps} with <i>s</i>.` },
          { F: [std(eq(1, 1, T)), std(eq(pa, ps, N))], say: `The ${N} counts tickets, the $${T} counts dollars: they go in different equations.` },
          { F: null, t: `${cv(1, '<i>x</i>')} + <i>x</i> = ${N} and ${pa}<i>x</i> + ${ps}<i>x</i> = ${T}`, mc: MC.oneLetter, say: 'Two different counts need two different letters.' },
        ],
      };
    }
    if (kind === 'times') {
      const a0 = int(R, 4, 30), k = pick(R, [2, 3, 4]), s0 = k * a0, N = a0 + s0;
      const L = letters('a', 's');
      const F1 = std(eq(1, 1, N)), F2: Form = si(k, 0);
      return {
        L, story: `A bus tour sold ${N} tickets. There were ${k} times as many student tickets as adult tickets. Let <i>a</i> = adult tickets, <i>s</i> = student tickets.`,
        ask: 'How many of each?', right: [F1, F2], x0: a0, y0: s0, lead: 'adult:', op: '&nbsp; student:',
        wrongs: [
          { F: [F1, xs(k, 0)], mc: MC.revMult, say: `There are more STUDENT tickets, so <i>s</i> is the bigger number: <i>s</i> = ${k}<i>a</i>. Test it: 1 adult ticket goes with ${k} student tickets.` },
          { F: [F1, std(eq(k, 1, N))], say: `"${k} times as many" compares the two counts: <i>s</i> = ${k}<i>a</i>.` },
          { F: null, t: `<i>s</i> = ${k}, <i>a</i> = 1 and <i>a</i> + <i>s</i> = ${N}`, mc: MC.label, say: `The letters stand for NUMBERS of tickets, not for the words "student" and "adult".` },
        ],
      };
    }
    if (kind === 'coins') {
      const N = pick(R, [20, 24, 30, 36, 40]), n0 = int(R, 3, N - 3), d0 = N - n0, V = 5 * n0 + 10 * d0;
      const L = letters('n', 'd'), F1 = std(eq(1, 1, N)), F2 = std(eq(5, 10, V));
      return {
        L, story: `A jar holds ${N} coins, only nickels and dimes, worth ${V} cents in all. Let <i>n</i> = nickels, <i>d</i> = dimes.`,
        ask: 'How many nickels and dimes?', right: [F1, F2], x0: n0, y0: d0, lead: 'nickels:', op: '&nbsp; dimes:',
        wrongs: [
          { F: [F1, std(eq(10, 5, V))], mc: MC.swapRates, say: 'A nickel is worth 5 cents, a dime 10: the 5 goes with <i>n</i>.' },
          { F: [F1, std(eq(1, 1, V))], say: `Counting coins and counting cents are different: the value equation needs 5 and 10.` },
          { F: null, t: `<i>n</i> = 5, <i>d</i> = 10 and <i>n</i> + <i>d</i> = ${N}`, mc: MC.label, say: '<i>n</i> is the NUMBER of nickels, not the word "nickel" or its value.' },
        ],
      };
    }
    const W = pick(R, [10, 12, 15, 20]), p1 = pick(R, [4, 5, 6]), p2 = pick(R, [8, 9, 10, 12]), a0 = int(R, 2, W - 2), b0 = W - a0, C = p1 * a0 + p2 * b0;
    const L = letters('p', 'c'), F1 = std(eq(1, 1, W)), F2 = std(eq(p1, p2, C));
    return {
      L, story: `A store mixes ${W} pounds of peanuts and cashews and charges $${C} for the whole mix. Peanuts cost $${p1} a pound, cashews $${p2} a pound. Let <i>p</i> and <i>c</i> be the pounds of each.`,
      ask: 'How many pounds of each?', right: [F1, F2], x0: a0, y0: b0, lead: 'peanuts (lb):', op: '&nbsp; cashews (lb):',
      wrongs: [
        { F: [F1, std(eq(p2, p1, C))], mc: MC.swapRates, say: `$${p1} a pound goes with the peanuts, <i>p</i>.` },
        { F: [std(eq(p1, p2, W)), F2], say: `${W} is pounds, not dollars: <i>p</i> + <i>c</i> = ${W}.` },
        { F: null, t: `<i>x</i> + <i>x</i> = ${W} and ${p1}<i>x</i> + ${p2}<i>x</i> = ${C}`, mc: MC.oneLetter, say: 'Two different amounts need two different letters.' },
      ],
    };
  }
}
export const writeVerbal: SGen = (R, n) => {
  const S = storyOf(R);
  const [F1, F2] = S.right, E1 = eqOf(F1), E2 = eqOf(F2);
  const ws: Opt[] = S.wrongs.map(w => ({ t: w.F ? sysH(w.F[0], w.F[1], S.L) : w.t!, mc: w.mc, say: w.say, sem: w.F ? semSys(eqOf(w.F[0]), eqOf(w.F[1])) : undefined }));
  return choice(R, {
    id: `writeVerbal-${n}`, family: 'writeVerbal', prompt: `${S.story} Which system models the story?`, board: `(${S.L.tx},\\ ${S.L.ty}) = \\,?`,
    solution: [`One equation per fact: ${fH(F1, S.L)} and ${fH(F2, S.L)}.`, `Check with the answer ${P(S.x0, S.y0)}: ${checkF(F1, S.x0, S.y0)} and ${checkF(F2, S.x0, S.y0)}.`],
    picture: { bd: [], cols: [], tex: [fT(F1, S.L), fT(F2, S.L)] },
  }, sysH(F1, F2, S.L), 'Yes: one equation per fact, each letter one quantity.', ws, { sem: semSys(E1, E2) });
};
export const writeSolve: SGen = (R, n) => {
  const S = storyOf(R);
  const [F1, F2] = S.right;
  return pairItem({
    id: `writeSolve-${n}`, family: 'writeSolve', prompt: `${S.story} ${S.ask}`, board: `(${S.L.tx},\\ ${S.L.ty}) = \\,?`,
    solution: [`The system: ${fH(F1, S.L)} and ${fH(F2, S.L)}.`, `Solve: ${S.L.x} = ${ans(nH(S.x0))}, ${S.L.y} = ${ans(nH(S.y0))}.`, `Check against the story: ${checkF(F1, S.x0, S.y0)} and ${checkF(F2, S.x0, S.y0)}.`],
    picture: { bd: [], cols: [], tex: [fT(F1, S.L), fT(F2, S.L)] },
  }, S.x0, S.y0, { lead: S.lead, op: S.op, tail: '' }, `Yes: ${S.x0} and ${S.y0}. It checks in both facts.`, [{ x: S.y0, y: S.x0, mc: MC.order, say: 'Swapped: match each number with its own letter.' }], 'Write one equation per fact, solve, then check both facts.');

};
export const fromGraph: SGen = (R, n) => {
  for (;;) {
    const x0 = int(R, -3, 3), y0 = int(R, -3, 3), m1 = pick(R, [1, 2, 3, -1, -2]), m2 = pick(R, [1, 2, -1, -2, -3, 0]);
    if (m1 === m2) continue;
    const k1 = y0 - m1 * x0, k2 = y0 - m2 * x0;
    if (Math.abs(k1) > 5 || Math.abs(k2) > 5 || k1 === k2) continue;
    const F1 = si(m1, k1), F2 = si(m2, k2), E1 = eqOf(F1), E2 = eqOf(F2);
    const p1: [number, number] = x0 === -1 || x0 === 0 ? [2, k1 + 2 * m1] : [x0 + 1, y0 + m1], p2: [number, number] = x0 === 1 || x0 === 0 ? [-2, k2 - 2 * m2] : [x0 - 1, y0 - m2];
    if ([p1, p2].some(p => Math.abs(p[1]) > 7)) continue;
    const alt: [Form, Form, string, string | undefined][] = [
      [si(-m1, k1), F2, 'The amber line goes ' + (m1 > 0 ? 'UP' : 'DOWN') + ' to the right: check the sign of its slope.', undefined],
      [F1, si(m2, -k2), `The teal line meets the y-axis at (0, ${nH(k2)}).`, undefined],
      [si(k1, m1), F2, 'Slope and intercept are swapped for the amber line.', undefined],
      [F1, si(m2 === 0 ? 1 : -m2, k2), 'Check the teal slope from its two marked points.', undefined],
    ];
    const ws: Opt[] = alt.map(([A, B, say, mc]) => ({ t: sysH(A, B), sem: semSys(eqOf(A), eqOf(B)), say, mc }));
    const g = sysG(E1, E2, [[x0, y0], p1, p2, [0, k1], [0, k2]], ['L1', 'L2', 'a1', 'a2', 'b1', 'b2'], ['S'], [dot('a1', 0, k1, 'first'), dot('a2', p1[0], p1[1], 'first'), dot('b1', 0, k2, 'second'), dot('b2', p2[0], p2[1], 'second'), dot('S', x0, y0, 'link', P(x0, y0))]);
    return choice(R, {
      id: `fromGraph-${n}`, family: 'fromGraph', prompt: `Two lines are graphed. The amber one passes through (0, ${nH(k1)}) and ${P(p1[0], p1[1])}, the teal one through (0, ${nH(k2)}) and ${P(p2[0], p2[1])}. Which system do they show?`, board: '\\text{system} = \\,?',
      solution: [`Amber: through (0, ${nH(k1)}) and ${P(p1[0], p1[1])}: ${fH(F1)}. Teal: through (0, ${nH(k2)}) and ${P(p2[0], p2[1])}: ${fH(F2)}.`, `Verify: they cross at ${P(x0, y0)}, which checks in both: ${checkF(F1, x0, y0)}, ${checkF(F2, x0, y0)}.`],
      picture: { g, bd: [], cols: [] },
    }, sysH(F1, F2), `Yes: ${sysH(F1, F2)}.`, ws, { sem: semSys(E1, E2) });
  }
};
export const fromTable: SGen = (R, n) => {
  for (;;) {
    const r1 = pick(R, [15, 20, 25, 30]), d = pick(R, [5, 10]), r2 = r1 - d, f1 = pick(R, [10, 20, 30]), m0 = int(R, 2, 6), f2 = f1 + d * m0;
    if (r2 <= 0) continue;
    const L = letters('m', 'C'), F1 = si(r1, f1), F2 = si(r2, f2), E1 = eqOf(F1), E2 = eqOf(F2);
    const ms = [1, 2, 3, 4];
    const row = (f: number, r: number) => ms.map(m => f + r * m).join(',\\ ');
    const alt: [Form, Form, string, string | undefined][] = [
      [si(f1 + r1, 0), F2, `${fH(si(f1 + r1, 0), L)} fits month 1 only: month 2 would be $${2 * (f1 + r1)}, the table says $${f1 + 2 * r1}. Check EVERY row.`, MC.firstRows],
      [si(f1, r1), F2, `The rate is how much C grows per month: $${r1}. Check month 2: ${f1 * 2 + r1} ≠ ${f1 + 2 * r1}.`, MC.firstRows],
      [F1, si(r1, f2), `Plan B grows by $${r2} a month, not $${r1}.`, undefined],
    ];
    const ws: Opt[] = alt.map(([A, B, say, mc]) => ({ t: sysH(A, B, L), sem: semSys(eqOf(A), eqOf(B)), say, mc }));
    const top = Math.max(f1 + r1 * 4, f2 + r2 * 4), step = top > 200 ? 50 : top > 100 ? 25 : 20;
    const g = { x: { min: 0, max: 6, step: 1, name: 'months' }, y: { min: 0, max: Math.ceil((Math.max(top, f2 + r2 * 6, f1 + r1 * 6)) / step) * step, step, name: 'total cost ($)' }, items: [line('L1', E1, 'first'), line('L2', E2, 'second'), ...ms.map(m => dot(`a${m}`, m, f1 + r1 * m, 'first')), ...ms.map(m => dot(`b${m}`, m, f2 + r2 * m, 'second'))], show: [...ms.map(m => `a${m}`), ...ms.map(m => `b${m}`)], solve: ['L1', 'L2'] };
    if (g.y.max / step > 12) continue;
    return choice(R, {
      id: `fromTable-${n}`, family: 'fromTable', prompt: `The table gives the total cost <i>C</i> (dollars) of two plans after <i>m</i> = 1, 2, 3, 4 months. Plan A: ${ms.map(m => '$' + (f1 + r1 * m)).join(', ')}. Plan B: ${ms.map(m => '$' + (f2 + r2 * m)).join(', ')}. Which system models both plans?`, board: `m\\colon\\ ${ms.join(',\\ ')}`,
      solution: [`Plan A grows $${r1} a month, and month 1 costs ${f1 + r1}: ${fH(F1, L)}. Check month 4: ${f1 + 4 * r1} ✓.`, `Plan B: $${r2} a month from ${f2}: ${fH(F2, L)}. Every row fits.`],
      picture: { g, bd: [`A\\colon\\ ${row(f1, r1)}`, `B\\colon\\ ${row(f2, r2)}`], cols: [undefined, 'first', 'second'] },
    }, sysH(F1, F2, L), 'Yes: each equation fits every row of its plan.', ws, { sem: semSys(E1, E2) });
  }
};
export const viable: SGen = (R, n) => {
  for (;;) {
    const kind = pick(R, ['ok', 'frac', 'frac', 'neg'] as const);
    const N = pick(R, [30, 40, 50, 60]), pa = pick(R, [8, 9, 10, 12]), ps = pick(R, [5, 6]), dp = pa - ps;
    const a0 = int(R, 5, N - 5), t = int(R, 1, 3);
    const T = kind === 'ok' ? pa * a0 + ps * (N - a0) : kind === 'frac' ? pa * a0 + ps * (N - a0) + int(R, 1, dp - 1) : ps * N - dp * t;
    const E1 = eq(1, 1, N), E2 = eq(pa, ps, T), S = solve(E1, E2);
    if (S.k !== 'one') continue;
    const a = S.x, s = S.y, isWhole = a.q === 1 && s.q === 1, isNonneg = qNum(a) >= 0 && qNum(s) >= 0, ok = isWhole && isNonneg;
    if ((kind === 'ok') !== ok || (kind === 'frac' && isWhole) || (kind === 'neg' && (!isWhole || isNonneg))) continue;
    const L = letters('a', 's');
    const opts: Opt[] = [
      { t: 'Viable: two whole, non-negative ticket counts', sem: 'viable', say: ok ? 'Yes: whole and not negative, and it checks in both facts.' : isWhole ? 'A count cannot be negative.' : 'A count of tickets must be a whole number.' },
      { t: 'Not viable: ticket counts must be whole and non-negative, so the note’s numbers cannot all be right', say: ok ? `It works: ${PQ(a, s)} are whole, non-negative counts.` : 'Yes: the algebra is right, but no real ticket sale fits.' },
      { t: 'Round to the nearest whole numbers and use those', mc: MC.rounds, say: `Rounded counts break the totals: check ${N} tickets and $${T} again. The exact solution is not a possible sale.` },
      { t: 'Viable: the pair solves both equations, so it works', sem: 'viable', mc: MC.domainAll, say: 'Solving the equations is not enough: tickets come in whole, non-negative numbers.' },
    ];
    const keep = ok ? [opts[0]!, opts[1]!] : kind === 'neg' ? [opts[0]!, opts[1]!, opts[3]!] : opts;
    const vT = (v: ReturnType<typeof q>) => (v.q === 1 ? nT(v.p) : `${v.p < 0 ? '-' : ''}\\tfrac{${Math.abs(v.p)}}{${v.q}}`);
    return fixedChoice({
      id: `viable-${n}`, family: 'viable', prompt: `A note says: ${N} tickets for $${T}, adult tickets $${pa}, student tickets $${ps}. Solving ${sysH(std(E1), std(E2), L)} gives (<i>a</i>, <i>s</i>) = ${PQ(a, s)}. Is that a possible ticket sale?`, board: `(a,\\ s) = (${vT(a)},\\ ${vT(s)})`,
      solution: ['Check the context: a and s count tickets, so they must be whole and not negative.', ok ? 'They are: the sale is possible.' : isWhole ? 'A negative count is impossible: not viable.' : 'They are not whole: not viable. The totals in the note cannot both be right.'],
      picture: { g: { x: { min: 0, max: N, step: N / 10, name: 'adult tickets' }, y: { min: 0, max: N, step: N / 10, name: 'student tickets' }, items: [line('L1', E1, 'first'), line('L2', E2, 'second')], show: ['L1', 'L2'], solve: [] }, bd: [eT(E1, L), eT(E2, L)], cols: [undefined, 'first', 'second'] },
    }, keep, ok ? 0 : 1);
  }
};
export const planMeaning: SGen = (R, n) => {
  const kind = pick(R, ['never', 'same', 'one'] as const);
  const r = pick(R, [15, 20, 25, 30]), f1 = pick(R, [10, 20, 25, 30, 40]), d = pick(R, [5, 10]), m0 = int(R, 2, 8), gap = pick(R, [15, 20, 25, 30]);
  const thing = pick(R, ['gym', 'phone plan', 'streaming bundle', 'bike share']);
  const L = letters('m', 'C');
  const rA = kind === 'one' ? r + d : r, f2 = kind === 'never' ? f1 + gap : f1 + d * m0, c0 = f1 + rA * m0;
  const F1 = si(rA, f1);
  const F2: Form = kind === 'same' ? { f: 'raw', h: `<i>C</i> = ${f1 + r} + ${r}(<i>m</i> − 1)`, t: `C = ${f1 + r} + ${r}(m - 1)`, E: eqOf(si(r, f1)) } : si(r, f2);
  const aTxt = `Plan A: $${f1} to join plus $${rA} a month.`;
  const bTxt = kind === 'same' ? `Plan B: $${f1 + r} for the first month, then $${r} for each month after that.` : `Plan B: $${f2} to join plus $${r} a month.`;
  const right = kind === 'never' ? 0 : kind === 'same' ? 2 : 1;
  const opts: Opt[] = [
    { t: 'Never: the system has no solution', say: kind === 'never' ? `Yes: the same monthly rate with different joining fees: Plan B stays $${gap} more, every month.` : 'They do cost the same: compare them month by month.' },
    { t: kind === 'one' ? `After exactly ${m0} months (both $${c0})` : 'After exactly one number of months', mc: kind === 'same' ? MC.coincOne : undefined, say: kind === 'one' ? 'Yes: one crossing.' : kind === 'same' ? 'They are the same plan written two ways: equal EVERY month, not just once.' : 'The gap never changes: same monthly rate.' },
    { t: 'Every month: the two descriptions are the same plan (infinitely many solutions)', mc: kind === 'never' ? MC.everyPoint : undefined, say: kind === 'same' ? `Yes: ${fH(F2, L)} works out to ${fH(F1, L)}.` : 'Write both as C = (rate)m + (fee): they are different plans.' },
  ];
  const E1 = eqOf(F1), E2 = eqOf(F2), sys = sysBoard(F1, F2, [], L);
  const top = Math.max(f1 + rA * 10, (kind === 'same' ? f1 : f2) + r * 10), step = top > 300 ? 50 : 25;
  return fixedChoice({
    id: `planMeaning-${n}`, family: 'planMeaning', prompt: `Two ${thing}s. ${aTxt} ${bTxt} When do they cost the same?`, board: sys.board,
    solution: [kind === 'same' ? `Plan B: ${fH(F2, L)} works out to ${fH(F1, L)}: the same equation.` : `Write both: ${fH(F1, L)} and ${fH(F2, L)}.`, kind === 'never' ? 'Same slope, different intercept: parallel lines, never equal.' : kind === 'same' ? 'One line: equal for every month.' : `They cross once: month ${m0}, $${c0}.`],
    picture: { g: { x: { min: 0, max: 10, step: 1, name: 'months' }, y: { min: 0, max: Math.ceil(top / step) * step, step, name: 'total cost ($)' }, items: [line('L1', E1, 'first'), line('L2', E2, 'second', { dash: kind === 'same', w: kind === 'same' ? 6 : 5 })], show: [], solve: ['L1', 'L2'] }, bd: sys.bd, cols: sys.cols },
  }, opts, right);
};
export { checkAt, revSlip, PTIO, solve, through, qH, fT };
