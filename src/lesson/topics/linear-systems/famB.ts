// famB.ts: the exact methods of stage 2 of "Systems of equations": substitution (an isolated variable, back-
// substitution and reporting, isolate-then-substitute), why replacing an equation keeps the solutions, elimination
// (ready, scaling one, scaling both, clearing fractions and decimals) and choosing a method. Pure.
import { gcd, int, pick, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import {
  type Eq, type Form, P, add, checkAt, checkF, cv, eq, eqOf, eT, eH, exprH, fH, holds, lineKey, nH, nT, q, qH, si, solve, std, sub, scale, through, xs,
} from './sysMaths';
import {
  type Opt, type SGen, type NumSlip, MC, PTIO, choice, fixedChoice, numItem, pairItem, revSlip, semLine, semV, sysBoard, sysG, sysH, dot, line,
} from './itemKit';
import { fr } from '../../runtime/item';

const X = '<i>x</i>', Y = '<i>y</i>';
/** "5x + 2 = 12" (a one-variable equation, v the letter) */
const lin = (A: number, B: number, e: number, v = X) => `${exprH(q(A), q(B), v)} = ${nH(e)}`;
const ZPOS = [2, 3, 4, 5], ZALL = [1, 2, 3, 4, 5, -1, -2, -3, -4, -5];
const slate = (E1: Eq, E2: Eq, x0: number, y0: number, more: string[] = []) => sysG(E1, E2, [[x0, y0]], [], ['L1', 'L2', 'S', ...more], [dot('S', x0, y0, 'link', P(x0, y0))]);

// ===================== substitute-isolated =====================
interface SubSys { iso: Form; other: Eq; x0: number; y0: number; isoX: boolean; m: number; k: number; c: number; d: number; e: number }
function subSys(R: () => number, o: { isoX?: boolean; dNeg?: boolean; half?: boolean } = {}): SubSys {
  for (;;) {
    const isoX = o.isoX ?? false, m = pick(R, [1, 2, 3, -1, -2, -3, 4]), k = int(R, -6, 6);
    const c = pick(R, ZALL), d = o.dNeg ? pick(R, [-1, -2, -3, -4]) : pick(R, [1, 2, 3, 4, 5]);
    const free = o.half ? int(R, -4, 3) + 0.5 : int(R, -5, 5);   // the value of the free variable
    const dep = m * free + k;
    if (o.half && !Number.isInteger(dep)) continue;
    const x0 = isoX ? dep : free, y0 = isoX ? free : dep;
    // the other equation: c x + d y = e
    const e = c * x0 + d * y0;
    if (!Number.isInteger(e) || Math.abs(x0) > 8 || Math.abs(y0) > 8) continue;
    const lead = isoX ? c * m + d : c + d * m;
    if (lead === 0 || gcd(c, d) > 1) continue;
    return { iso: isoX ? xs(m, k) : si(m, k), other: eq(c, d, e), x0, y0, isoX, m, k, c, d, e };
  }
}
export const subStep: SGen = (R, n) => {
  for (;;) {
    const S = subSys(R, { isoX: R() < 0.3, dNeg: R() < 0.5 });
    const { m, k, c, d, e, isoX } = S, v = isoX ? Y : X;
    // c x + d y = e with y = m x + k  ->  (c + d m) x + d k = e ; with x = m y + k -> (c m + d) y + c k = e
    const outer = isoX ? c : d, inner = isoX ? d : c;
    const A = inner + outer * m, B = outer * k;
    if (A === 0 || k === 0 || Math.abs(outer) === 1 && R() < 0.7) continue;
    const root = (e - B) / A;
    const ws: Opt[] = [
      { t: lin(A, k, e, v), sem: semV((e - k) / A), mc: MC.grouping, say: `${nH(outer)} multiplies the WHOLE expression ${exprH(q(m), q(k), v)}: keep it in brackets, so the ${nH(k)} is multiplied too.` },
      { t: lin(inner + m, k, e, v), sem: semV((e - k) / (inner + m)), say: `The coefficient ${nH(outer)} must stay: ${nH(outer)}(${exprH(q(m), q(k), v)}).` },
    ];
    ws.push(outer < 0 ? { t: lin(A, -B, e, v), sem: semV((e + B) / A), mc: MC.partialDist, say: `${nH(outer)} times ${nH(k)} is ${nH(B)}: the minus reaches the second term too.` }
      : { t: lin(A, -B, e, v), sem: semV((e + B) / A), say: `${nH(outer)} times ${nH(k)} is ${nH(B)}: keep its sign.` });
    const sys = sysBoard(S.iso, std(S.other));
    const otherH = eH(S.other), isoName = isoX ? X : Y;
    return choice(R, {
      id: `subStep-${n}`, family: 'subStep', prompt: `${fH(S.iso)} is already solved for ${isoName}. Substitute it into ${otherH}. Which one-variable equation do you get?`, board: sys.board,
      solution: [`Replace ${isoName} by (${exprH(q(m), q(k), v)}): ${isoX ? `${nH(c)}(${exprH(q(m), q(k), v)}) ${d < 0 ? '−' : '+'} ${cv(Math.abs(d), Y)}` : `${cv(c, X)} ${d < 0 ? '−' : '+'} ${nH(Math.abs(d))}(${exprH(q(m), q(k), v)})`} = ${nH(e)}.`, `Multiply out and collect: ${lin(A, B, e, v)}.`],
      picture: { g: slate(eqOf(S.iso), S.other, S.x0, S.y0), bd: sys.bd, cols: sys.cols },
    }, lin(A, B, e, v), `Yes: ${lin(A, B, e, v)}, so ${v} = ${nH(root)}.`, ws, { sem: semV(root) });
  }
};
export const subSolve: SGen = (R, n) => {
  for (;;) {
    const mode = pick(R, ['y', 'yneg', 'x', 'equal'] as const);
    if (mode === 'equal') {
      const x0 = int(R, -5, 5), m1 = pick(R, [1, 2, 3, -1, -2]), m2 = pick(R, [1, 2, 3, -1, -2, 4]), k1 = int(R, -6, 6);
      if (m1 === m2) continue;
      const y0 = m1 * x0 + k1, k2 = y0 - m2 * x0;
      if (Math.abs(y0) > 9 || Math.abs(k2) > 12) continue;
      const F1 = si(m1, k1), F2 = si(m2, k2), sys = sysBoard(F1, F2);
      const slip = (k2 + k1) / (m1 - m2);
      return numItem({
        id: `subSolve-${n}`, family: 'subSolve', prompt: `Both equations of ${sysH(F1, F2)} give ${Y}. Set the two expressions equal and solve for ${X}.`, board: sys.board,
        solution: [`Both equal ${Y}, so ${exprH(q(m1), q(k1))} = ${exprH(q(m2), q(k2))}.`, `Collect: ${cv(m1 - m2, X)} = ${nH(k2 - k1)}, so ${X} = ${ans(nH(x0))}.`],
        picture: { g: slate(eqOf(F1), eqOf(F2), x0, y0), bd: sys.bd, cols: sys.cols }, unit: '',
      }, x0, `Yes: ${X} = ${nH(x0)} (and then ${Y} = ${nH(y0)}).`, [{ v: slip, mc: MC.moveSign, say: `Moving ${nH(k1)} to the other side changes its sign: ${nH(k2)} − (${nH(k1)}).` }], `Set ${exprH(q(m1), q(k1))} = ${exprH(q(m2), q(k2))}, get the ${X}-terms on one side.`);
    }
    const S = subSys(R, { isoX: mode === 'x', dNeg: mode === 'yneg' });
    const { m, k, c, d, e, isoX } = S, v = isoX ? Y : X;
    const outer = isoX ? c : d, inner = isoX ? d : c, A = inner + outer * m, B = outer * k;
    if (A === 0 || k === 0) continue;
    const root = isoX ? S.y0 : S.x0;
    const slips: NumSlip[] = [{ v: (e - k) / A, mc: MC.grouping, say: `${nH(outer)} multiplies the whole bracket: ${nH(outer)}(${exprH(q(m), q(k), v)}) = ${exprH(q(outer * m), q(B), v)}.` }];
    if (outer < 0) slips.push({ v: (e + B) / A, mc: MC.partialDist, say: `The minus reaches both terms: ${nH(outer)} × ${nH(k)} = ${nH(B)}.` });
    const sys = sysBoard(S.iso, std(S.other));
    return numItem({
      id: `subSolve-${n}`, family: 'subSolve', prompt: `Solve ${sysH(S.iso, std(S.other))} by substitution. What is ${v}? (Only ${v} for now.)`, board: sys.board,
      solution: [`Substitute: ${isoX ? `${nH(c)}(${exprH(q(m), q(k), v)}) ${d < 0 ? '−' : '+'} ${cv(Math.abs(d), Y)}` : `${cv(c, X)} ${d < 0 ? '−' : '+'} ${nH(Math.abs(d))}(${exprH(q(m), q(k), v)})`} = ${nH(e)}.`, `${lin(A, B, e, v)}, so ${v} = ${ans(nH(root))}.`],
      picture: { g: slate(eqOf(S.iso), S.other, S.x0, S.y0), bd: sys.bd, cols: sys.cols },
    }, root, `Yes: ${v} = ${nH(root)}.`, slips, `Put (${exprH(q(m), q(k), v)}) in place of ${isoX ? X : Y}, in brackets, then solve.`);
  }
};

// ===================== back-substitute-report =====================
export const backSub: SGen = (R, n) => {
  const S = subSys(R, { half: R() < 0.3 });
  const into = R() < 0.6 ? 'iso' : 'other';
  const sys = sysBoard(S.iso, std(S.other));
  const fx = S.x0;
  return pairItem({
    id: `backSub-${n}`, family: 'backSub', prompt: `Solving ${sysH(S.iso, std(S.other))}, Kai found ${X} = ${nH(fx)}. Put it into ${into === 'iso' ? fH(S.iso) : eH(S.other)} to find ${Y}, then give the solution${Number.isInteger(fx) ? '' : ' (decimals are fine)'}.`, board: sys.board,
    solution: [`${X} = ${nH(fx)} into ${into === 'iso' ? fH(S.iso) : eH(S.other)}: ${Y} = ${nH(S.y0)}.`, `Check the other one: ${into === 'iso' ? checkAt(S.other, S.x0, S.y0) : checkF(S.iso, S.x0, S.y0)}`, `The solution is the pair (${ans(nH(S.x0))}, ${ans(nH(S.y0))}).`],
    picture: { g: { ...slate(eqOf(S.iso), S.other, S.x0, S.y0), show: [], solve: ['L1', 'L2', 'S'] }, bd: sys.bd, cols: sys.cols, tex: [`x = ${nT(fx)}`] },
  }, S.x0, S.y0, PTIO, `Yes: ${P(S.x0, S.y0)}, and it checks in both.`, [...revSlip(S.x0, S.y0), { x: S.x0, y: S.x0, mc: MC.stops, say: `${Y} is not ${nH(S.x0)} too: put ${X} = ${nH(S.x0)} in and work out ${Y}.` }],
  `Put ${X} = ${nH(fx)} into the equation and solve for ${Y}; the answer is the pair (${X}, ${Y}).`);
};
export const fullSub: SGen = (R, n) => {
  for (;;) {
    const S = subSys(R, { isoX: R() < 0.35, dNeg: R() < 0.4 });
    const { m, k, c, d, e, isoX } = S, v = isoX ? Y : X;
    const outer = isoX ? c : d, inner = isoX ? d : c, A = inner + outer * m, B = outer * k;
    if (A === 0 || k === 0) continue;
    const gRoot = (e - k) / A;
    const slips = revSlip(S.x0, S.y0);
    if (Number.isInteger(gRoot) && outer !== 1) {
      const gOther = m * gRoot + k;
      slips.push(isoX ? { x: gOther, y: gRoot, mc: MC.grouping, say: `${nH(outer)}(${exprH(q(m), q(k), v)}) multiplies BOTH terms in the bracket.` } : { x: gRoot, y: gOther, mc: MC.grouping, say: `${nH(outer)}(${exprH(q(m), q(k), v)}) multiplies BOTH terms in the bracket.` });
    }
    const sys = sysBoard(S.iso, std(S.other));
    const root = isoX ? S.y0 : S.x0;
    return pairItem({
      id: `fullSub-${n}`, family: 'fullSub', prompt: `Solve ${sysH(S.iso, std(S.other))} by substitution. Give the solution as a pair.`, board: sys.board,
      solution: [`Substitute ${fH(S.iso)} into the other: ${lin(A, B, e, v)}, so ${v} = ${nH(root)}.`, `Back into ${fH(S.iso)}: ${isoX ? X : Y} = ${nH(isoX ? S.x0 : S.y0)}.`, `Solution (${ans(nH(S.x0))}, ${ans(nH(S.y0))}). Check: ${checkAt(S.other, S.x0, S.y0)}`],
      picture: { g: slate(eqOf(S.iso), S.other, S.x0, S.y0), bd: sys.bd, cols: sys.cols },
    }, S.x0, S.y0, PTIO, `Yes: ${P(S.x0, S.y0)}.`, slips, 'Substitute the expression (in brackets), solve for the one letter, then put it back to get the other.');
  }
};

// ===================== bridge-isolate-variable =====================
export const isolate: SGen = (R, n) => {
  for (;;) {
    const mode = pick(R, ['y1', 'x1', 'xm1', 'other'] as const);
    const a = pick(R, [2, 3, 4, 5, -2, -3]), b = pick(R, [2, 3, 4, -2, -3, -4]), c = pick(R, [2, 5, 6, 7, 8, 12, -4, -6]);
    let E: Eq, right: Form, forV: string, ws: Opt[];
    if (mode === 'y1') {
      E = eq(a, 1, c); right = si(-a, c); forV = Y;
      ws = [{ t: fH(si(a, c)), sem: semLine(si(a, c)), mc: MC.moveSign, say: `Moving ${cv(a, X)} across changes its sign: ${cv(-a, X)}.` },
        { t: fH(si(-a, -c)), sem: semLine(si(-a, -c)), say: `The ${nH(c)} stays on its side: only the ${X}-term moves.` }];
    } else if (mode === 'x1') {
      E = eq(1, b, c); right = xs(-b, c); forV = X;
      ws = [{ t: fH(xs(b, c)), sem: semLine(xs(b, c)), mc: MC.moveSign, say: `Moving ${cv(b, Y)} across changes its sign: ${cv(-b, Y)}.` },
        { t: fH(xs(-b, -c)), sem: semLine(xs(-b, -c)), say: `The ${nH(c)} stays on its side: only the ${Y}-term moves.` }];
    } else if (mode === 'xm1') {
      E = eq(-1, b, c); right = xs(b, -c); forV = X;
      ws = [{ t: fH(xs(-b, c)), sem: semLine(xs(-b, c)), mc: MC.divSign, say: `That is −${X} = …; divide every term by −1 to get ${X}.` },
        { t: fH(xs(b, c)), sem: semLine(xs(b, c)), mc: MC.moveSign, say: `Divide by −1 changes the sign of EVERY term, the ${nH(c)} too.` }];
    } else {
      if (gcd(gcd(a, b), c) > 1 || c % b === 0 && a % b === 0) continue;
      E = eq(a, b, c); right = si(q(-a, b), q(c, b)); forV = Y;
      ws = [{ t: fH(si(q(-a, b), q(c))), sem: semLine(si(q(-a, b), q(c))), mc: MC.divSel, say: `Divide EVERY term by ${nH(b)}, the constant too.` },
        { t: fH(si(q(-a), q(c, b))), sem: semLine(si(q(-a), q(c, b))), mc: MC.divOne, say: `Divide EVERY term by ${nH(b)}, the ${X}-term too.` },
        { t: fH(si(q(a, b), q(c, b))), sem: semLine(si(q(a, b), q(c, b))), mc: MC.moveSign, say: `Moving ${cv(a, X)} across changes its sign.` }];
    }
    return choice(R, {
      id: `isolate-${n}`, family: 'isolate', prompt: `Solve ${eH(E)} for ${forV}.`, board: eT(E),
      solution: mode === 'other' ? [`Move the ${X}-term: ${cv(b, Y)} = ${cv(-a, X)} ${c < 0 ? '−' : '+'} ${nH(Math.abs(c))}.`, `Divide every term by ${nH(b)}: ${fH(right)}.`]
        : mode === 'xm1' ? [`Move the ${Y}-term: −${X} = ${cv(-b, Y)} ${c < 0 ? '−' : '+'} ${nH(Math.abs(c))}.`, `Divide every term by −1: ${fH(right)}.`]
          : [`Move the other term across, changing its sign: ${fH(right)}.`, 'Check with a point: both forms give the same pairs.'],
      picture: { g: sysG(E, E, [[0, 0]], [], ['L1']), bd: [], cols: ['link'] },
    }, fH(right), `Yes: ${fH(right)}.`, ws, { sem: semLine(right) });
  }
};

// ===================== isolate-then-substitute =====================
export const isoSubSolve: SGen = (R, n) => {
  for (;;) {
    const x0 = int(R, -5, 5), y0 = int(R, -5, 5);
    const one = pick(R, [1, -1]), onX = R() < 0.5;
    const a1 = onX ? one : pick(R, [2, 3, 4, -2, -3]), b1 = onX ? pick(R, [2, 3, 4, -2, -3]) : one;
    const a2 = pick(R, [2, 3, 4, 5, -2, -3]), b2 = pick(R, [2, 3, 4, -2, -3, -5]);
    if (a1 * b2 - a2 * b1 === 0) continue;
    const E1 = through(a1, b1, x0, y0), E2 = through(a2, b2, x0, y0);
    const [F, G] = R() < 0.5 ? [E1, E2] : [E2, E1];
    const sys = sysBoard(std(F), std(G));
    const iso = onX ? xs(q(-b1 / a1), q(E1.c / a1)) : si(q(-a1 / b1), q(E1.c / b1));
    return pairItem({
      id: `isoSubSolve-${n}`, family: 'isoSubSolve', prompt: `Neither letter is alone in ${sysH(std(F), std(G))}. Isolate the convenient one, substitute it into the OTHER equation, and give the solution.`, board: sys.board,
      solution: [`${onX ? X : Y} has coefficient ${nH(one)} in ${eH(E1)}: ${fH(iso)}.`, `Into ${eH(E2)}: ${onX ? Y : X} = ${nH(onX ? y0 : x0)}; back: ${onX ? X : Y} = ${nH(onX ? x0 : y0)}.`, `Solution (${ans(nH(x0))}, ${ans(nH(y0))}).`],
      picture: { g: slate(E1, E2, x0, y0), bd: sys.bd, cols: sys.cols },
    }, x0, y0, PTIO, `Yes: ${P(x0, y0)}.`, revSlip(x0, y0), `Get ${onX ? X : Y} alone in ${eH(E1)} (its coefficient is ${nH(one)}), then substitute into the other equation.`);
  }
};
export const whereSub: SGen = (R, n) => {
  for (;;) {
    const x0 = int(R, -4, 4), y0 = int(R, -4, 4), a = pick(R, [2, 3, 4, -2, -3]), a2 = pick(R, [2, 3, 5]), b2 = pick(R, [2, 3, 4, -2, -3]);
    if (a * b2 - a2 === 0) continue;
    const E1 = through(a, 1, x0, y0), E2 = through(a2, b2, x0, y0), iso = si(-a, E1.c);
    const who = pick(R, ['Ava', 'Leo', 'Mia', 'Noah', 'Zoe']);
    const sys = sysBoard(std(E1), std(E2));
    if (R() < 0.5) {
      return fixedChoice({
        id: `whereSub-${n}`, family: 'whereSub', prompt: `${who} solves ${sysH(std(E1), std(E2))}. From the first equation: ${fH(iso)}. Where does ${who} substitute it next?`, board: sys.board,
        solution: [`Into the OTHER equation, ${eH(E2)}: that gives one equation in ${X}.`, `Back into ${eH(E1)} it only gives ${nH(E1.c)} = ${nH(E1.c)}: true, but no new information.`],
        picture: { g: slate(E1, E2, x0, y0), bd: sys.bd, cols: sys.cols },
      }, [
        { t: `Into the other equation, ${eH(E2)}`, say: 'Yes: the other equation gives one equation in x.' },
        { t: `Back into ${eH(E1)}, where it came from`, mc: MC.backSource, say: `That only gives ${nH(E1.c)} = ${nH(E1.c)}: both sides are the same thing. Use the OTHER equation.` },
        { t: 'Into either one: both give the value of x', say: 'Only the other equation brings new information.' },
      ], 0);
    }
    return fixedChoice({
      id: `whereSub-${n}`, family: 'whereSub', prompt: `In ${sysH(std(E1), std(E2))} no letter is alone yet. Can ${who} still solve it by substitution?`, board: sys.board,
      solution: [`Yes: ${Y} has coefficient 1 in ${eH(E1)}, so first ${fH(iso)}.`, `Then substitute into ${eH(E2)}.`],
      picture: { g: slate(E1, E2, x0, y0), bd: sys.bd, cols: sys.cols },
    }, [
      { t: `Yes: first isolate ${Y} in ${eH(E1)}, then substitute`, say: 'Yes: isolate the letter with coefficient 1, then substitute.' },
      { t: 'No: substitution only works when a letter is already alone', mc: MC.needSolved, say: `You can MAKE a letter alone: ${fH(iso)}.` },
      { t: 'No: it has to be solved by graphing', say: 'A graph only gives an estimate; isolate a letter and substitute.' },
    ], 0);
  }
};

// ===================== replacement-preserves =====================
function sumSys(R: () => number): { E1: Eq; E2: Eq; S: Eq; x0: number; y0: number } {
  for (;;) {
    const x0 = int(R, -3, 6), y0 = int(R, -3, 6), b = pick(R, [1, 1, 2, 3]), a1 = pick(R, [1, 1, 2, 3]), a2 = pick(R, [1, 1, 2, -1]);
    if (a1 + a2 === 0) continue;
    const E1 = through(a1, b, x0, y0), E2 = through(a2, -b, x0, y0), S = add(E1, E2);
    return { E1, E2, S, x0, y0 };
  }
}
export const replaceSum: SGen = (R, n) => {
  const { E1, E2, S, x0, y0 } = sumSys(R);
  const xv = S.c / S.a, sys = sysBoard(std(E1), std(E2), ['\\downarrow', eT(S), eT(E2)]);
  sys.cols = ['first', 'second', 'dim', 'link', 'second'];
  return fixedChoice({
    id: `replaceSum-${n}`, family: 'replaceSum', prompt: `Replace the first equation of ${sysH(std(E1), std(E2))} by the SUM of both equations, and keep the second. The new system is ${eH(S)} and ${eH(E2)}. What about its solutions?`, board: sys.board,
    solution: [`A pair that makes both old equations true makes their sum true: ${P(x0, y0)} gives ${checkAt(S, x0, y0)}`, `And back: new equation minus the kept one gives the old first equation. So the solutions are the same: ${P(x0, y0)}.`],
    picture: { g: sysG(E1, E2, [[x0, y0]], ['L1', 'L2'], ['N', 'S'], [line('N', S, 'link'), dot('S', x0, y0, 'link', P(x0, y0))]), bd: sys.bd, cols: sys.cols },
  }, [
    { t: `The same solution, ${P(x0, y0)}: the new system has exactly the same solutions`, say: 'Yes: replacing one equation by the sum, while keeping the other, changes nothing about the solutions.' },
    { t: 'A different solution: changing an equation changes the solutions', mc: MC.newSol, say: `Put ${P(x0, y0)} into the new system: ${checkAt(S, x0, y0)} and ${checkAt(E2, x0, y0)}. Nothing changed.` },
    { t: `Only ${X} = ${nH(xv)} matters now: the system is just ${eH(S)}`, mc: MC.keepsOnly, say: `The kept equation ${eH(E2)} is still part of the system: it pins down ${Y}.` },
    { t: `No solution: one equation has lost its ${Y}`, say: `Losing ${Y} in one equation is the point: the other still has it.` },
  ], 0);
};
export const recover: SGen = (R, n) => {
  const { E1, E2, S, x0, y0 } = sumSys(R);
  const sys = sysBoard(std(S), std(E2));
  sys.cols = ['link', 'second'];
  const ws: Opt[] = [
    { t: eH(add(S, E2)), sem: lineKey(add(S, E2)), mc: MC.negSub, say: `Undo an addition by subtracting: (${eH(S)}) − (${eH(E2)}).` },
    { t: eH(S), sem: lineKey(S), mc: MC.keepsOnly, say: `That is the NEW equation. The old first one is what you get by taking the kept one back off.` },
    { t: eH(sub(E2, S)), sem: lineKey(sub(E2, S)), say: 'Subtract the kept equation FROM the new one, not the other way round.' },
  ];
  // sub(E2, S) is −E1: the same line as the answer, so the helper drops it
  return choice(R, {
    id: `recover-${n}`, family: 'recover', prompt: `A system was changed: its first equation was replaced by the sum of both, the second was kept. The new system is ${eH(S)} and ${eH(E2)}. What was the original FIRST equation?`, board: sys.board,
    solution: [`New = old first + kept, so old first = new − kept.`, `(${eH(S)}) − (${eH(E2)}): ${eH(E1)}. Check with ${P(x0, y0)}: ${checkAt(E1, x0, y0)}`],
    picture: { g: sysG(S, E2, [[x0, y0]], ['L1', 'L2'], ['O', 'S'], [line('O', E1, 'first'), dot('S', x0, y0, 'link', P(x0, y0))]), bd: sys.bd, cols: sys.cols },
  }, eH(E1), `Yes: ${eH(E1)}.`, ws, { sem: lineKey(E1) });
};

// ===================== eliminate-ready =====================
export const elimAdd: SGen = (R, n) => {
  for (;;) {
    const x0 = int(R, -5, 5), y0 = int(R, -5, 5), b = pick(R, [1, 2, 3, 4, 5, 6]), a1 = pick(R, ZALL), a2 = pick(R, ZALL);
    if (a1 + a2 === 0) continue;
    const onY = R() < 0.6;
    const E1 = onY ? through(a1, b, x0, y0) : through(b, a1, x0, y0), E2 = onY ? through(a2, -b, x0, y0) : through(-b, a2, x0, y0);
    const S = add(E1, E2), v = onY ? X : Y, val = onY ? x0 : y0;
    const slips = revSlip(x0, y0);
    const lead = onY ? S.a : S.b;
    if (E1.c % lead === 0 && E1.c / lead !== val) {
      const w = E1.c / lead, other = onY ? (E1.c - E1.a * w) / E1.b : (E1.c - E1.b * w) / E1.a;
      if (Number.isInteger(other)) slips.push({ x: onY ? w : other, y: onY ? other : w, mc: MC.oneSide, say: `Add BOTH sides: the right sides add up to ${nH(S.c)}, not ${nH(E1.c)}.` });
    }
    const sys = sysBoard(std(E1), std(E2));
    return pairItem({
      id: `elimAdd-${n}`, family: 'elimAdd', prompt: `Solve ${sysH(std(E1), std(E2))} by elimination: the ${onY ? Y : X}-terms are already opposite.`, board: sys.board,
      solution: [`Add the equations: ${eH(S)}, so ${v} = ${nH(val)}.`, `Back into ${eH(E1)}: ${onY ? Y : X} = ${nH(onY ? y0 : x0)}.`, `Solution (${ans(nH(x0))}, ${ans(nH(y0))}). Check: ${checkAt(E2, x0, y0)}`],
      picture: { g: slate(E1, E2, x0, y0), bd: sys.bd, cols: sys.cols, tex: [`${eT(S)}`] },
    }, x0, y0, PTIO, `Yes: ${P(x0, y0)}.`, slips, `Add the left sides AND the right sides: the ${onY ? Y : X}-terms cancel.`);
  }
};
export const elimSub: SGen = (R, n) => {
  for (;;) {
    const x0 = int(R, -5, 5), y0 = int(R, -5, 5), b = pick(R, [2, 3, 4, -2, -3, -5]), a1 = pick(R, [2, 3, 4, 5, 6, 7]), a2 = pick(R, [-1, -2, -3, 1, 2, -4]);
    if (a1 === a2) continue;
    const E1 = through(a1, b, x0, y0), E2 = through(a2, b, x0, y0);
    if (!(a2 < 0 || E2.c < 0)) continue;
    const A = a1 - a2, C = E1.c - E2.c;
    if (C === 0 && x0 !== 0) continue;
    const nA = a2 < 0 ? a1 + a2 : A, nC = E2.c < 0 ? E1.c + E2.c : C;
    const ws: Opt[] = [];
    if (nA !== 0) ws.push({ t: `${cv(nA, X)} = ${nH(nC)}`, sem: semV(nC / nA), mc: MC.negSub, say: `Subtracting a negative ADDS: ${nH(a1)} − (${nH(a2)}) = ${nH(A)}, ${nH(E1.c)} − (${nH(E2.c)}) = ${nH(C)}.` });
    ws.push({ t: `${eH(add(E1, E2))}`, mc: MC.addsEqual, say: `The ${Y}-terms are EQUAL, so adding doubles them. Subtract to cancel them.` });
    ws.push({ t: `${cv(A, X)} = ${nH(E1.c)}`, sem: semV(E1.c / A), mc: MC.oneSide, say: 'Subtract on BOTH sides: the right sides too.' });
    const sys = sysBoard(std(E1), std(E2));
    return choice(R, {
      id: `elimSub-${n}`, family: 'elimSub', prompt: `In ${sysH(std(E1), std(E2))} the ${Y}-terms are equal. Subtract the second equation from the first. What do you get?`, board: sys.board,
      solution: [`${X}-terms: ${nH(a1)} − (${nH(a2)}) = ${nH(A)}. Right sides: ${nH(E1.c)} − (${nH(E2.c)}) = ${nH(C)}.`, `The ${Y}-terms cancel: ${cv(A, X)} = ${nH(C)}, so ${X} = ${nH(x0)}.`],
      picture: { g: slate(E1, E2, x0, y0), bd: sys.bd, cols: sys.cols },
    }, `${cv(A, X)} = ${nH(C)}`, `Yes: ${cv(A, X)} = ${nH(C)}, so ${X} = ${nH(x0)}.`, ws, { sem: semV(x0) });
  }
};

// ===================== eliminate-scale-one / eliminate-scale-both =====================
export const scaleRow: SGen = (R, n) => {
  for (;;) {
    const x0 = int(R, -4, 4), y0 = int(R, -4, 4), k = pick(R, [2, 3, 4, -2, -3]), a1 = pick(R, ZALL), b1 = pick(R, [1, 2, -1, -2, 3]), a2 = pick(R, [2, 3, 5, -3, 7]);
    const onY = R() < 0.6;
    const E1 = onY ? through(a1, b1, x0, y0) : through(b1, a1, x0, y0), E2 = onY ? through(a2, -k * b1, x0, y0) : through(-k * b1, a2, x0, y0);
    if (E1.c === 0 || E1.a * E2.b === E2.a * E1.b) continue;
    const K = scale(E1, k);
    const ws: Opt[] = [
      { t: eH(eq(K.a, K.b, E1.c)), sem: lineKey(eq(K.a, K.b, E1.c)), mc: MC.someTerms, say: `Multiply EVERY term, the right side too: ${nH(k)} × ${nH(E1.c)} = ${nH(K.c)}.` },
      { t: eH(onY ? eq(K.a, E1.b, K.c) : eq(E1.a, K.b, K.c)), sem: lineKey(onY ? eq(K.a, E1.b, K.c) : eq(E1.a, K.b, K.c)), mc: MC.someTerms, say: `Every term gets multiplied, the ${onY ? Y : X}-term too.` },
      { t: eH(onY ? eq(K.a, -K.b, K.c) : eq(-K.a, K.b, K.c)), sem: lineKey(onY ? eq(K.a, -K.b, K.c) : eq(-K.a, K.b, K.c)), say: `Watch the sign: ${nH(k)} × ${nH(onY ? E1.b : E1.a)} = ${nH(onY ? K.b : K.a)}.` },
    ];
    const sys = sysBoard(std(E1), std(E2));
    return choice(R, {
      id: `scaleRow-${n}`, family: 'scaleRow', prompt: `To eliminate ${onY ? Y : X} from ${sysH(std(E1), std(E2))}, multiply the first equation by ${nH(k)}. Which equation do you get?`, board: sys.board,
      solution: [`Multiply every term by ${nH(k)}: ${eH(K)}.`, `Now the ${onY ? Y : X}-terms are ${nH(onY ? K.b : K.a)} and ${nH(onY ? E2.b : E2.a)}: opposite, so adding cancels them.`],
      picture: { g: slate(E1, E2, x0, y0), bd: sys.bd, cols: sys.cols },
    }, eH(K), `Yes: ${eH(K)}: the same line, so the same solutions.`, ws, { sem: lineKey(K) });
  }
};
const BOTH: [number, number][] = [[3, 2], [4, 6], [2, 5], [3, 4], [5, 3], [6, 4], [2, 3], [4, 3], [5, 2], [6, 9]];
export const scaleSolve: SGen = (R, n, sg) => {
  for (;;) {
    const both = sg === 'eliminate-scale-both';
    const half = both && R() < 0.35;
    const x0 = half ? int(R, -3, 3) + 0.5 : int(R, -5, 5), y0 = int(R, -5, 5);
    let a1: number, b1: number, a2: number, b2: number;
    if (both) {
      const [p, r] = pick(R, BOTH), s = pick(R, [1, -1]);
      b1 = p; b2 = -s * r;
      a1 = half ? pick(R, [2, 4, -2]) : pick(R, [2, 3, 5, -2, -3, 7]); a2 = half ? pick(R, [2, 6, -4, 4]) : pick(R, [2, 3, 4, 5, -2, -5]);
      if (a1 % a2 === 0 || a2 % a1 === 0) continue;
    } else {
      const m = pick(R, [2, 3, 4, -2, -3]);
      b1 = pick(R, [1, 2, -1, 3]); b2 = m * b1; a1 = pick(R, [2, 3, 5, -2, 4]); a2 = pick(R, [3, 5, -3, 7, 2]);
      if (Math.abs(a1) === 1 || Math.abs(a2) === 1 && b1 === 1) continue;
    }
    if (a1 * b2 - a2 * b1 === 0 || gcd(a1, b1) > 1 || gcd(a2, b2) > 1) continue;
    const onY = R() < 0.6;
    const E1 = onY ? through(a1, b1, x0, y0) : through(b1, a1, x0, y0), E2 = onY ? through(a2, b2, x0, y0) : through(b2, a2, x0, y0);
    if (!Number.isInteger(E1.c) || !Number.isInteger(E2.c)) continue;
    const t1 = onY ? E1.b : E1.a, t2 = onY ? E2.b : E2.a, g = gcd(t1, t2), L = Math.abs(t1 * t2) / g;
    const k1 = L / Math.abs(t1) * (Math.sign(t1) === Math.sign(t2) ? 1 : 1), k2 = (L / Math.abs(t2)) * (Math.sign(t1) === Math.sign(t2) ? -1 : 1);
    const K1 = scale(E1, k1), K2 = scale(E2, k2), S = add(K1, K2);
    const sys = sysBoard(std(E1), std(E2));
    return pairItem({
      id: `scaleSolve-${n}`, family: 'scaleSolve', prompt: `Solve ${sysH(std(E1), std(E2))} by elimination${both ? ' (you will need to multiply both equations)' : ''}.${half ? ' Decimals are fine.' : ''}`, board: sys.board,
      solution: [`${k1 === 1 ? 'Keep the first' : `First × ${nH(k1)}: ${eH(K1)}`}; ${k2 === 1 ? 'keep the second' : `second × ${nH(k2)}: ${eH(K2)}`}.`, `Add: ${eH(S)}, so ${onY ? X : Y} = ${nH(onY ? x0 : y0)}. Back in: ${onY ? Y : X} = ${nH(onY ? y0 : x0)}.`, `Solution (${ans(nH(x0))}, ${ans(nH(y0))}). Check: ${checkAt(E2, x0, y0)}`],
      picture: { g: slate(E1, E2, x0, y0), bd: sys.bd, cols: sys.cols, tex: [k1 === 1 ? eT(E1) : eT(K1), k2 === 1 ? eT(E2) : eT(K2), eT(S)] },
    }, x0, y0, PTIO, `Yes: ${P(x0, y0)}.`, revSlip(x0, y0), `Multiply so the ${onY ? Y : X}-terms become opposite (a common multiple of ${nH(Math.abs(t1))} and ${nH(Math.abs(t2))}), then add.`);
  }
};
export const bothMult: SGen = (R, n) => {
  for (;;) {
    const x0 = int(R, -4, 4), y0 = int(R, -4, 4), [p, r] = pick(R, BOTH), a1 = pick(R, [2, 3, 5, -2, 7]), a2 = pick(R, [3, 4, 5, -3, 2]);
    const b1 = p, b2 = -r;
    if (a1 * b2 - a2 * b1 === 0 || gcd(a1, b1) > 1 || gcd(a2, b2) > 1) continue;
    const E1 = through(a1, b1, x0, y0), E2 = through(a2, b2, x0, y0);
    const g = gcd(p, r), k1 = r / g, k2 = p / g;
    const ok = (u: number, w: number) => u * b1 + w * b2 === 0;
    const txt = (u: number, w: number) => `First × ${u}, second × ${w}`;
    const cands: [number, number, string | undefined, string][] = [
      [k2, k1, MC.mismatch, `Then the ${Y}-terms are ${nH(k2 * b1)}${Y} and ${nH(k1 * b2)}${Y}: not opposite. Multiply each by the OTHER coefficient.`],
      [k1, 1, MC.mismatch, `Then the ${Y}-terms are ${nH(k1 * b1)}${Y} and ${nH(b2)}${Y}: not opposite. Both equations need a multiplier.`],
      [1, k2, MC.mismatch, `Then the ${Y}-terms are ${nH(b1)}${Y} and ${nH(k2 * b2)}${Y}: not opposite.`],
      [p, r, undefined, `Then the ${Y}-terms are ${nH(p * b1)}${Y} and ${nH(r * b2)}${Y}: not opposite.`],
    ];
    const ws: Opt[] = cands.map(([u, w, mc, say]) => ({ t: txt(u, w), mc, say, sem: ok(u, w) ? 'cancels' : undefined }));
    const sys = sysBoard(std(E1), std(E2));
    return choice(R, {
      id: `bothMult-${n}`, family: 'bothMult', prompt: `Which multipliers make the ${Y}-terms of ${sysH(std(E1), std(E2))} OPPOSITE, so that adding the equations cancels ${Y}?`, board: sys.board,
      solution: [`The ${Y}-coefficients are ${nH(b1)} and ${nH(b2)}; a common multiple is ${nH(k1 * b1)}.`, `First × ${k1}: ${nH(k1 * b1)}${Y}. Second × ${k2}: ${nH(k2 * b2)}${Y}. Opposite.`],
      picture: { g: slate(E1, E2, x0, y0), bd: sys.bd, cols: sys.cols },
    }, txt(k1, k2), `Yes: ${nH(k1 * b1)}${Y} and ${nH(k2 * b2)}${Y} cancel.`, ws, { sem: 'cancels' });
  }
};
export const anyMultiple: SGen = (R, n) => {
  for (;;) {
    const x0 = int(R, -4, 4), y0 = int(R, -4, 4), [p, r] = pick(R, BOTH.filter(([u, w]) => gcd(u, w) === 1)), a1 = pick(R, [2, 3, 5, -2]), a2 = pick(R, [3, 4, 5, -3]);
    const b1 = p, b2 = -r;
    if (a1 * b2 - a2 * b1 === 0 || gcd(a1, b1) > 1 || gcd(a2, b2) > 1) continue;
    const E1 = through(a1, b1, x0, y0), E2 = through(a2, b2, x0, y0), who = pick(R, ['Lee', 'Ivy', 'Omar', 'June']);
    const sys = sysBoard(std(E1), std(E2));
    const pic = { g: slate(E1, E2, x0, y0), bd: sys.bd, cols: sys.cols };
    if (R() < 0.55) {
      const f = 2;
      return fixedChoice({
        id: `anyMultiple-${n}`, family: 'anyMultiple', prompt: `To cancel ${Y} in ${sysH(std(E1), std(E2))}, the textbook multiplies by ${r} and ${p}. ${who} multiplies by ${f * r} and ${f * p} instead. Does that work?`, board: sys.board,
        solution: [`${who}'s ${Y}-terms: ${nH(f * r * b1)}${Y} and ${nH(f * p * b2)}${Y}: opposite, so they cancel.`, 'Any common multiple works; the least one just keeps the numbers small.'], picture: pic,
      }, [
        { t: `Yes: ${nH(f * r * b1)}${Y} and ${nH(f * p * b2)}${Y} cancel too; the numbers are just bigger`, say: 'Yes: any common multiple works.' },
        { t: 'No: only the least common multiple works', mc: MC.lcmOnly, say: `Check: ${nH(f * r * b1)} + (${nH(f * p * b2)}) = 0. Any common multiple cancels.` },
        { t: 'No: both equations must be multiplied by the same number', mc: MC.mismatch, say: 'Each equation gets its own multiplier; what matters is that the y-terms end up opposite.' },
      ], 0);
    }
    return fixedChoice({
      id: `anyMultiple-${n}`, family: 'anyMultiple', prompt: `To cancel ${Y} in ${sysH(std(E1), std(E2))}, ${who} multiplies the first equation by ${p} and the second by ${r}. Does that work?`, board: sys.board,
      solution: [`${who}'s ${Y}-terms: ${nH(p * b1)}${Y} and ${nH(r * b2)}${Y}: not opposite.`, `Multiply each by the OTHER coefficient: first × ${r}, second × ${p}.`], picture: pic,
    }, [
      { t: `No: ${nH(p * b1)}${Y} and ${nH(r * b2)}${Y} do not cancel; the multipliers are the wrong way round`, say: `Right: first × ${r}, second × ${p}.` },
      { t: 'Yes: any two multipliers work as long as both equations are multiplied', mc: MC.mismatch, say: `Check: ${nH(p * b1)} + (${nH(r * b2)}) is not 0, so ${Y} does not cancel.` },
      { t: 'Yes: it is the least common multiple', mc: MC.mismatch, say: 'The multipliers must turn both coefficients into the same number (with opposite signs).' },
    ], 0);
  }
};

// ===================== rational-coefficients =====================
const coefH = (nu: number, de: number, v: string, first: boolean) => {
  const s = nu < 0 ? (first ? '−' : ' − ') : first ? '' : ' + ', a = Math.abs(nu), g = gcd(a, de), N = a / g, D = de / g;
  return `${s}${D === 1 ? (N === 1 ? '' : String(N)) : fr(N, D)}${v}`;
};
const coefT = (nu: number, de: number, v: string, first: boolean) => {
  const s = nu < 0 ? (first ? '-' : ' - ') : first ? '' : ' + ', a = Math.abs(nu), g = gcd(a, de), N = a / g, D = de / g;
  return `${s}${D === 1 ? (N === 1 ? '' : String(N)) : `\\tfrac{${N}}{${D}}`}${v}`;
};
const decH = (v: number) => nH(Math.round(v * 1000) / 1000);
/** A x + B y = C written divided by D: fractions or decimals */
function ratForm(E: Eq, D: number, dec: boolean): Extract<Form, { f: 'raw' }> {
  if (dec) {
    const t = (c: number, v: string, first: boolean) => `${c < 0 ? (first ? '−' : ' − ') : first ? '' : ' + '}${decH(Math.abs(c) / D)}${v}`;
    const tt = (c: number, v: string, first: boolean) => `${c < 0 ? (first ? '-' : ' - ') : first ? '' : ' + '}${decH(Math.abs(c) / D)}${v}`;
    return { f: 'raw', h: `${t(E.a, X, true)}${t(E.b, Y, false)} = ${decH(E.c / D)}`, t: `${tt(E.a, 'x', true)}${tt(E.b, 'y', false)} = ${nT(Math.round(E.c / D * 1000) / 1000)}`, E };
  }
  const c = q(E.c, D);
  return { f: 'raw', h: `${coefH(E.a, D, X, true)}${coefH(E.b, D, Y, false)} = ${qH(c)}`, t: `${coefT(E.a, D, 'x', true)}${coefT(E.b, D, 'y', false)} = ${c.q === 1 ? nT(c.p) : `${c.p < 0 ? '-' : ''}\\tfrac{${Math.abs(c.p)}}{${c.q}}`}`, E };
}
/** an equation with fraction (or decimal) coefficients through (x0, y0): the integer equation and its LCD */
function ratEq(R: () => number, x0: number, y0: number, dec: boolean): { E: Eq; D: number } {
  for (;;) {
    if (dec) {
      const D = 10, A = pick(R, [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 25]), B = pick(R, [1, 2, 3, 4, 5, 6, 7, 8, 9, 15, -2, -3, -5]);
      if (A % 10 === 0 || B % 10 === 0 || (A % 2 === 0 && B % 2 === 0 && (A * x0 + B * y0) % 2 === 0) || (A % 5 === 0 && B % 5 === 0)) continue;
      return { E: eq(A, B, A * x0 + B * y0), D };
    }
    const d1 = pick(R, [2, 3, 4, 5, 6]), d2 = pick(R, [2, 3, 4, 5, 6, 10]);
    const D = d1 * d2 / gcd(d1, d2);
    if (D > 12 || d1 === d2) continue;
    const n1 = pick(R, [1, 1, 2, 3, -1]), n2 = pick(R, [1, 1, 2, 3, -1, 5]);
    if (gcd(n1, d1) !== 1 || gcd(n2, d2) !== 1) continue;
    const A = n1 * D / d1, B = n2 * D / d2;
    return { E: eq(A, B, A * x0 + B * y0), D };
  }
}
export const clearFrac: SGen = (R, n) => {
  for (;;) {
    const dec = R() < 0.4, x0 = int(R, -4, 6), y0 = int(R, -4, 6);
    const { E, D } = ratEq(R, x0, y0, dec);
    if (E.c === 0 || E.c % D === 0 && !dec && R() < 0.3) continue;
    const F = ratForm(E, D, dec);
    const ws: Opt[] = [
      { t: `${eH(eq(E.a, E.b, 0)).replace(/ = 0$/, '')} = ${dec ? decH(E.c / D) : qH(q(E.c, D))}`, sem: `raw ${E.c}/${D}`, mc: MC.someTerms, say: `Multiply EVERY term by ${D}, the right side too: ${dec ? decH(E.c / D) : qH(q(E.c, D))} × ${D} = ${nH(E.c)}.` },
      dec
        ? { t: `${cv(E.a, X)} ${E.b < 0 ? '−' : '+'} ${decH(Math.abs(E.b) / D)}${Y} = ${nH(E.c)}`, sem: `half ${E.a} ${E.b}`, mc: MC.someTerms, say: `Multiply EVERY term by ${D}: the ${Y}-term too, ${decH(Math.abs(E.b) / D)} × ${D} = ${nH(Math.abs(E.b))}.` }
        : { t: `${ratForm(eq(E.a, E.b, E.c), D, true).h} (decimals rounded, the answer is only approximate anyway)`, sem: [E.a, E.b, E.c].every(v => Math.abs(Math.round(v / D * 1000) / 1000 - v / D) < 1e-12) ? lineKey(E) : 'approx', mc: MC.fracApprox, say: `Fractions are exact numbers: multiply by ${D} and the equation has exact whole numbers. Rounding them changes the line.` },
      { t: eH(eq(E.b, E.a, E.c)), sem: lineKey(eq(E.b, E.a, E.c)), say: `Keep each number with its own letter: ${X} gets ${nH(E.a)}, ${Y} gets ${nH(E.b)}.` },
    ];
    return choice(R, {
      id: `clearFrac-${n}`, family: 'clearFrac', prompt: `Clear the ${dec ? 'decimals' : 'fractions'} in ${F.h}: multiply the whole equation by ${D}. Which equation do you get?`, board: F.t,
      solution: [`Multiply every term by ${D}: ${eH(E)}.`, `Same line, whole-number coefficients: now solve as usual.`],
      picture: { g: { ...sysG(E, E, [[x0, y0]], ['L1'], []), items: [line('L1', E, 'link')] }, bd: [], cols: ['link'] },
    }, eH(E), `Yes: ${eH(E)}.`, ws, { sem: lineKey(E) });
  }
};
export const ratSolve: SGen = (R, n) => {
  for (;;) {
    const dec = R() < 0.4, x0 = int(R, -4, 6), y0 = int(R, -4, 6);
    const { E: E1, D } = ratEq(R, x0, y0, dec);
    const a2 = pick(R, [1, 2, 3, -1, -2]), b2 = pick(R, [1, 2, -1, -3, 3]);
    if (E1.a * b2 - a2 * E1.b === 0) continue;
    const E2 = through(a2, b2, x0, y0);
    const F1 = ratForm(E1, D, dec), sys = sysBoard(F1, std(E2));
    return pairItem({
      id: `ratSolve-${n}`, family: 'ratSolve', prompt: `Solve ${F1.h} and ${eH(E2)}. Clear the ${dec ? 'decimals' : 'fractions'} first.`, board: sys.board,
      solution: [`First × ${D}: ${eH(E1)}.`, `Solve ${eH(E1)} and ${eH(E2)}: ${X} = ${nH(x0)}, ${Y} = ${nH(y0)}.`, `Solution (${ans(nH(x0))}, ${ans(nH(y0))}), exact. Check: ${checkAt(E2, x0, y0)}`],
      picture: { g: slate(E1, E2, x0, y0), bd: sys.bd, cols: sys.cols, tex: [eT(E1)] },
    }, x0, y0, PTIO, `Yes: ${P(x0, y0)}, exactly.`, revSlip(x0, y0), `Multiply the first equation by ${D} to get whole numbers, then use elimination or substitution.`);
  }
};

// ===================== choose-method =====================
const METHODS = ['Substitution: a letter is already alone', 'Elimination as they are: add or subtract the equations', 'Elimination after multiplying one equation', 'Graphing: read an estimate', 'Inspection: compare the equations, no solving needed'];
export const chooseMethod: SGen = (R, n, sg) => {
  for (;;) {
    const insp = sg === 'inspect-structure';
    const kind = insp ? pick(R, ['sub', 'elim', 'scale', 'insp', 'insp'] as const) : pick(R, ['sub', 'elim', 'scale'] as const);
    const x0 = int(R, -4, 4), y0 = int(R, -4, 4);
    let F1: Form, F2: Form, right: number, why: string;
    if (kind === 'sub') {
      const m = pick(R, [2, 3, -2, 4]), k = int(R, -5, 5), c = pick(R, [2, 3, 4, 5]), d = pick(R, [2, 3, -2, -3]);
      if (c + d * m === 0 || gcd(c, d) > 1) continue;
      F1 = si(m, k); F2 = std(eq(c, d, c * x0 + d * (m * x0 + k))); right = 0; why = `${fH(F1)} already has ${Y} alone: put it straight into the other equation.`;
      void y0;
    } else if (kind === 'elim') {
      const b = pick(R, [2, 3, 4, 5]), a1 = pick(R, [2, 3, 4, 5]), a2 = pick(R, [2, 3, 5, 7, -2, -3]), s = pick(R, [1, -1]);
      if (a1 * s * b - a2 * b === 0 || gcd(a1, b) > 1 || gcd(a2, b) > 1) continue;
      F1 = std(through(a1, b, x0, y0)); F2 = std(through(a2, s * b, x0, y0)); right = 1; why = `The ${Y}-terms are ${s < 0 ? 'opposite: add' : 'equal: subtract'} the equations and ${Y} is gone.`;
    } else if (kind === 'scale') {
      const b = pick(R, [2, 3]), m = pick(R, [2, 3, -2, -3]), a1 = pick(R, [2, 3, 5]), a2 = pick(R, [3, 4, 5, 7]);
      if (a1 * m * b - a2 * b === 0 || gcd(a1, b) > 1 || gcd(a2, m * b) > 1 || a2 % a1 === 0) continue;
      F1 = std(through(a1, b, x0, y0)); F2 = std(through(a2, m * b, x0, y0)); right = 2; why = `${nH(m * b)}${Y} is ${nH(m)} times ${nH(b)}${Y}: multiply the first equation by ${nH(-m)} and add.`;
    } else {
      const a = pick(R, [2, 3, 4]), b = pick(R, [1, 2, 3, -2]), c1 = int(R, 1, 9), c2 = c1 + pick(R, [1, 2, -3, 4]);
      if (gcd(a, b) > 1) continue;
      F1 = std(eq(a, b, c1)); F2 = std(eq(a, b, c2)); right = 4; why = `The left sides are identical and the right sides differ: no pair can make ${eH(eq(a, b, 0)).replace(/ = 0$/, '')} equal both. Seen at a glance.`;
    }
    const opts: Opt[] = METHODS.slice(0, insp ? 5 : 4).map((t, i) => ({
      t, say: i === right ? `Yes. ${why}` : i === 3 ? 'A graph only gives an estimate; here an exact answer comes quickly.' : `Look at the numbers first. ${why}`,
      mc: i === right ? undefined : i === 3 ? MC.approx : MC.habit,
    }));
    const sys = sysBoard(F1, F2);
    return fixedChoice({
      id: `chooseMethod-${n}`, family: 'chooseMethod', prompt: `You need an exact answer for ${sysH(F1, F2)}. Which method gets there most efficiently?`, board: sys.board,
      solution: [why, kind === 'insp' ? 'No solution: nothing to solve.' : 'Any exact method gives the same answer; this one is the shortest.'],
      picture: { g: { ...sysG(eqOf(F1), eqOf(F2), kind === 'insp' ? [[0, 0]] : [[x0, y0]], [], ['L1', 'L2']) }, bd: sys.bd, cols: sys.cols },
    }, opts, right);
  }
};
export const methodsAgree: SGen = (R, n) => {
  for (;;) {
    const x0 = int(R, -5, 5), y0 = int(R, -5, 5);
    if (x0 === y0) continue;
    const m = pick(R, [2, 3, -1, -2]), k = y0 - m * x0, c = pick(R, [2, 3, 5]), d = pick(R, [1, 2, -2, 3]);
    if (c + d * m === 0 || Math.abs(k) > 9) continue;
    const F1 = si(m, k), F2 = std(through(c, d, x0, y0)), sys = sysBoard(F1, F2);
    const a = pick(R, ['Mia', 'Ana', 'Sofia']), b = pick(R, ['Leo', 'Ben', 'Raj']);
    return choice(R, {
      id: `methodsAgree-${n}`, family: 'methodsAgree', prompt: `${a} solves ${sysH(F1, F2)} by substitution and gets ${P(x0, y0)}. ${b} solves the same system by elimination. What does ${b} get?`, board: sys.board,
      solution: [`A system's solution set does not depend on the method: every exact method finds the pairs that make both true.`, `${P(x0, y0)}: ${checkF(F1, x0, y0)} and ${checkF(F2, x0, y0)}`],
      picture: { g: sysG(eqOf(F1), eqOf(F2), [[x0, y0]], [], ['L1', 'L2', 'S'], [dot('S', x0, y0, 'link', P(x0, y0))]), bd: sys.bd, cols: sys.cols },
    }, P(x0, y0), `Yes: ${P(x0, y0)}. Different routes, the same crossing.`, [
      { t: 'A different pair: elimination and substitution give different answers', mc: MC.methodsDiffer, say: `Both methods find the one pair that makes both equations true: ${P(x0, y0)}.` },
      { t: `${nH(x0)} and ${nH(y0)}, in either order`, mc: MC.unpaired, say: `The order matters: (${X}, ${Y}) = ${P(x0, y0)}. ${P(y0, x0)} is a different point.` },
      { t: `${X} = ${nH(x0)} only: elimination finds one letter`, mc: MC.stops, say: `Elimination finds one letter first, then the other: the answer is still the pair.` },
    ], { sem: 'same' });
  }
};
export { solve, shuffle, holds };
