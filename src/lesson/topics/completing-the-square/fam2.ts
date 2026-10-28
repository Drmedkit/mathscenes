// fam2.ts: practice families for sub-goals 7-16 of "Solving quadratics": choosing a method, the letter-fraction bridge,
// completing the square with letters, deriving the formula, the discriminant (count, kind, graph), exact checks,
// contexts, rearranging formulas through a square root, quadratic inequalities. Pure: no DOM.
import { int, pick } from '../../runtime/item';
import { type Q, q, qAdd, qMul, qSub, qEq, qL, iH, dH, iT, polyT, polyH, quadTerms, binH, roots, rootsH, disc, isSq, noTie, round, gcd, squareFree } from './quad';
import { MC, type Gen, type Opt, type PlanePic, choiceItem, numItem, fracItem, pairItem, isSet, near, uniq, ans } from './common';

const X = '<i>x</i>';
const V = (s: string) => `<i>${s}</i>`;
const eqT = (a: number, b: number, c: number, rhs = 0) => `${polyT(quadTerms(a, b, c))} = ${iT(rhs)}`;
const eqH = (a: number, b: number, c: number, rhs = 0) => `${polyH(quadTerms(a, b, c))} = ${iH(rhs)}`;
const nz = (R: () => number, lo: number, hi: number) => { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } };
const sgnPick = (R: () => number) => (R() < 0.5 ? -1 : 1);
const four = (R: () => number, o: Opt[]) => [o[0]!, ...o.slice(1).sort(() => R() - 0.5).slice(0, 3)];
const sq = (k: number, m: number) => `${k === 1 ? '' : k}√<u class="rb">${m}</u>`;

// =============== 7. choose a method ===============
const METHOD = { sqrt: 'Square roots', zero: 'Zero product property (it is already factored)', cs: 'Completing the square', formula: 'Quadratic formula' } as const;
export const pickMethod: Gen = (R, n) => {
  const kind = pick(R, ['sqrt', 'zero', 'cs', 'formula'] as const);
  let tex = '', htm = '', why = '';
  if (kind === 'sqrt') {
    const h = nz(R, -6, 6), k = pick(R, [5, 7, 10, 12, 20, 18, 25, 49]);
    if (R() < 0.5) { tex = `(x ${h < 0 ? '-' : '+'} ${Math.abs(h)})^2 = ${k}`; htm = `(${X} ${h < 0 ? '−' : '+'} ${Math.abs(h)})² = ${k}`; }
    else { const a = pick(R, [1, 2, 3]); tex = `${a === 1 ? '' : a}x^2 = ${a * k}`; htm = `${a === 1 ? '' : a}${X}² = ${a * k}`; }
    why = 'A square equals a number, with no separate x-term: take square roots of both sides.';
  } else if (kind === 'zero') {
    const p = nz(R, -9, 9), r = nz(R, -9, 9), a = pick(R, [1, 1, 2, 3]);
    const f = (k: number, c: number) => `${k === 1 ? '' : k}x ${c < 0 ? '-' : '+'} ${Math.abs(c)}`;
    const fh = (k: number, c: number) => `${k === 1 ? '' : k}${X} ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
    tex = `(${f(1, p)})(${f(a, r)}) = 0`; htm = `(${fh(1, p)})(${fh(a, r)}) = 0`;
    why = 'It is already a product equal to 0: set each factor to 0. Expanding it first only makes work.';
  } else if (kind === 'cs') {
    for (;;) { const h = nz(R, -6, 6), k = nz(R, -9, 12), D = 4 * h * h + 4 * k; if (D <= 0 || isSq(D)) continue; tex = `${polyT([[1, 2], [2 * h, 1]])} = ${iT(k)}`; htm = `${polyH([[1, 2], [2 * h, 1]])} = ${iH(k)}`; break; }
    why = `Leading coefficient 1, an even x-coefficient, and it does not factor: add (b/2)² to both sides and it is a square.`;
  } else {
    for (;;) { const a = int(R, 2, 5), b = pick(R, [1, 3, 5, 7, 9]) * sgnPick(R), c = nz(R, -6, 6), D = disc(a, b, c); if (D <= 0 || isSq(D)) continue; tex = eqT(a, b, c); htm = eqH(a, b, c); break; }
    why = 'The leading coefficient is not 1, b is odd and it does not factor: completing the square would bring fractions in. Put a, b, c into the formula.';
  }
  const opts: Opt[] = [{ t: METHOD[kind], ok: true, say: `Yes. ${why}` }];
  for (const k of ['sqrt', 'zero', 'cs', 'formula'] as const) if (k !== kind) opts.push({ t: METHOD[k], mc: MC.habit, say: `That works, but it is not the quick one here. ${why}` });
  if (kind === 'cs' || kind === 'formula') opts[opts.findIndex(o => o.t === METHOD.zero)] = { t: 'None: it does not factor, so there is no solution', mc: MC.noFactor, say: `Not factoring over the integers does not mean no solutions: b² − 4ac &gt; 0 here, so there are two irrational ones.` };
  return choiceItem(R, {
    id: `pickMethod-${n}`, family: 'pickMethod', prompt: `Which method solves ${htm} with the least work?`, board: tex,
    solution: [why],
  }, opts);
};

export const sqrtSolve: Gen = (R, n) => {
  const h = nz(R, -7, 7), s = int(R, 1, 9), a = pick(R, [1, 1, 1, 2, 3, 4]);
  if (s === Math.abs(h) && R() < 0.8) return sqrtSolve(R, n);
  const r1 = -h + s, r2 = -h - s, k = a * s * s;
  const tex = `${a === 1 ? '' : a}(x ${h < 0 ? '-' : '+'} ${Math.abs(h)})^2 = ${k}`, htm = `${a === 1 ? '' : a}(${X} ${h < 0 ? '−' : '+'} ${Math.abs(h)})² = ${k}`;
  const inner = `${X} ${h < 0 ? '−' : '+'} ${Math.abs(h)}`;
  return pairItem({
    id: `sqrtSolve-${n}`, family: 'sqrtSolve', prompt: `Solve ${htm} by taking square roots. (Either order.)`, board: tex,
    solution: [...(a > 1 ? [`Divide by ${a}: (${inner})² = ${s * s}.`] : []), `${inner} = ${s} or ${inner} = −${s}.`, `So ${X} = ${ans(iH(r1))} or ${X} = ${ans(iH(r2))}.`],
  }, r1, r2, `${X} =`, ` or ${X} =`, '', (u, w) => {
    if (isSet(u, w, r1, r2)) return { ok: true, say: `Yes: ${X} = ${iH(r1)} or ${X} = ${iH(r2)}.` };
    if (isSet(u, w, s, -s)) return { ok: false, mc: MC.forgetsH, say: `±${s} is the value of ${inner}, not of ${X}. Undo the ${h < 0 ? '−' : '+'} ${Math.abs(h)} too.` };
    if ((near(u, r1) && near(w, r1)) || (near(u, r2) && near(w, r2))) return { ok: false, mc: MC.onlyPos, say: `${s}² and (−${s})² are both ${s * s}: there are two solutions.` };
    if (isSet(u, w, h + s, h - s)) return { ok: false, mc: MC.detached, say: `${inner} = ±${s}: to undo ${h < 0 ? '−' : '+'} ${Math.abs(h)} you ${h < 0 ? 'add' : 'subtract'} ${Math.abs(h)}.` };
    if (a > 1 && isSq(k) && isSet(u, w, -h + Math.sqrt(k), -h - Math.sqrt(k))) return { ok: false, mc: MC.someTerms, say: `Divide by ${a} before taking the root: (${inner})² = ${s * s}.` };
    return { ok: false, say: `Get the square alone, then take both square roots: ${inner} = ±${s}.` };
  });
};

// =============== 8. letter fractions, bridged from numbers ===============
const SETS3 = [['a', 'b', 'c'], ['p', 'q', 'r'], ['m', 'n', 'k'], ['A', 'B', 'C'], ['u', 'v', 'w'], ['s', 't', 'g']] as const;
export const twinFrac: Gen = (R, n) => {
  const a = int(R, 1, 5), b = int(R, 1, 9), c = nz(R, -6, 6);
  const right = q(b * b - 4 * a * c, 4 * a * a);
  const T = `\\frac{b^2}{4a^2} - \\frac{c}{a}, \\quad a = ${a},\\ b = ${b},\\ c = ${iT(c)}`;
  const first = `${b * b}/${4 * a * a}`, second = `${iH(c)}/${a}`;
  return fracItem({
    id: `twinFrac-${n}`, family: 'twinFrac', prompt: `With <i>a</i> = ${a}, <i>b</i> = ${b}, <i>c</i> = ${iH(c)}: write <i>b</i>²/(4<i>a</i>²) − <i>c</i>/<i>a</i> as one fraction in lowest terms.`,
    board: T,
    solution: [`<i>b</i>²/(4<i>a</i>²) = ${first} and <i>c</i>/<i>a</i> = ${second}.`, `Common denominator ${4 * a * a}: ${second} = ${iH(4 * a * c)}/${4 * a * a}.`, `${b * b}/${4 * a * a} − (${iH(4 * a * c)}/${4 * a * a}) = ${b * b - 4 * a * c}/${4 * a * a} = ${ans(qL(right))}.`],
  }, right, v => {
    if (qEq(v, right)) return { ok: true, say: `Yes: (${b * b} − ${iH(4 * a * c)})/${4 * a * a} = ${qL(right)}. That is (b² − 4ac)/(4a²).` };
    if (4 * a * a - a !== 0 && qEq(v, q(b * b - c, 4 * a * a - a))) return { ok: false, mc: MC.addDen, say: `Denominators are not subtracted. Rewrite ${second} over ${4 * a * a} first.` };
    if (qEq(v, q(b * b - 4 * a * a * c, 4 * a * a))) return { ok: false, mc: MC.scaledWhole, say: `To change ${second} to the denominator ${4 * a * a}, multiply top and bottom by ${4 * a}, not by ${4 * a * a}.` };
    if (qEq(v, q(b * b - c, 4 * a * a))) return { ok: false, mc: MC.rewrite, say: `${second} is not ${iH(c)}/${4 * a * a}: multiply its top by ${4 * a} too.` };
    return { ok: false, say: `Rewrite ${second} over the denominator ${4 * a * a}, then subtract the tops.` };
  });
};

export const letterFrac: Gen = (R, n) => {
  const [A, B, C] = pick(R, SETS3), form = int(R, 0, 3), plus = form >= 2, sq2 = form % 2 === 1;
  const s = plus ? '+' : '−', sT = plus ? '+' : '-';
  const lead = sq2 ? `(${V(B)}/(2${V(A)}))²` : `${V(B)}²/(4${V(A)}²)`, leadT = sq2 ? `\\left(\\frac{${B}}{2${A}}\\right)^2` : `\\frac{${B}^2}{4${A}^2}`;
  const right = `(${V(B)}² ${s} 4${V(A)}${V(C)})/(4${V(A)}²)`;
  const opts: Opt[] = [
    { t: right, ok: true, say: `Yes: ${V(C)}/${V(A)} = 4${V(A)}${V(C)}/(4${V(A)}²), then combine the tops.` },
    { t: `(${V(B)}² ${s} ${V(C)})/(4${V(A)}² ${s} ${V(A)})`, mc: MC.addDen, say: `Denominators are never ${plus ? 'added' : 'subtracted'}: bring ${V(C)}/${V(A)} to the denominator 4${V(A)}² first.` },
    { t: `(${V(B)}² ${s} ${V(C)})/(4${V(A)}²)`, mc: MC.rewrite, say: `${V(C)}/${V(A)} is not ${V(C)}/(4${V(A)}²): multiply its top by 4${V(A)} too.` },
    { t: `(${V(B)}² ${s} 4${V(A)}²${V(C)})/(4${V(A)}²)`, mc: MC.scaledWhole, say: `To go from ${V(A)} to 4${V(A)}², multiply by 4${V(A)}, not by 4${V(A)}².` },
  ];
  return choiceItem(R, {
    id: `letterFrac-${n}`, family: 'letterFrac', prompt: `Write ${lead} ${s} ${V(C)}/${V(A)} as one fraction (${V(A)} ≠ 0).`,
    board: `${leadT} ${sT} \\frac{${C}}{${A}}`,
    solution: [`${lead} = ${V(B)}²/(4${V(A)}²). The common denominator is 4${V(A)}².`, `${V(C)}/${V(A)} = 4${V(A)}${V(C)}/(4${V(A)}²) (top and bottom times 4${V(A)}).`],
  }, opts);
};

export const whyNonzero: Gen = (R, n) => {
  const [A, B, C] = pick(R, SETS3), kind = int(R, 0, 3);
  const ctx = [
    { p: `dividing every term of ${V(A)}${X}² + ${V(B)}${X} + ${V(C)} = 0 by ${V(A)}`, t: `\\frac{${A}x^2 + ${B}x + ${C}}{${A}} = \\frac{0}{${A}}` },
    { p: `the fraction (${V(B)}² − 4${V(A)}${V(C)})/(4${V(A)}²)`, t: `\\frac{${B}^2 - 4${A}${C}}{4${A}^2}` },
    { p: `multiplying both sides of (${X} + ${V(B)}/(2${V(A)}))² = (${V(B)}² − 4${V(A)}${V(C)})/(4${V(A)}²) by 4${V(A)}²`, t: `4${A}^2\\left(x + \\frac{${B}}{2${A}}\\right)^2 = ${B}^2 - 4${A}${C}` },
    { p: `the formula ${X} = (−${V(B)} ± √(${V(B)}² − 4${V(A)}${V(C)}))/(2${V(A)})`, t: `x = \\frac{-${B} \\pm \\sqrt{${B}^2 - 4${A}${C}}}{2${A}}` },
  ][kind]!;
  const reason = kind === 2 ? `Multiplying by 0 would turn any equation into 0 = 0, so 4${V(A)}² must not be 0` : `You can't divide by 0`;
  const opts: Opt[] = [
    { t: `${V(A)} ≠ 0`, ok: true, say: `Yes. ${reason}, and ${V(A)} = 0 would not be a quadratic anyway.` },
    { t: `${V(A)} &gt; 0`, mc: MC.negALoses, say: `A negative ${V(A)} is fine: only ${V(A)} = 0 breaks the step.` },
    { t: `none: it works for every ${V(A)}`, mc: MC.noCond, say: `${V(A)} = 0 makes a denominator 0. State ${V(A)} ≠ 0.` },
    { t: `${V(B)}² − 4${V(A)}${V(C)} ≥ 0`, say: `That decides whether there are real solutions, not whether this step is allowed. The step needs ${V(A)} ≠ 0.` },
  ];
  return choiceItem(R, {
    id: `whyNonzero-${n}`, family: 'whyNonzero', prompt: `Which condition does ${ctx.p} need?`, board: ctx.t,
    solution: [`${reason}: ${kind === 2 ? `4${V(A)}² ≠ 0` : `the denominator ${kind === 0 ? V(A) : kind === 1 ? `4${V(A)}²` : `2${V(A)}`} must not be 0`}.`, `That holds exactly when ${V(A)} ≠ 0.`],
  }, opts);
};

// =============== 9. completing the square with letters ===============
const SETS2 = [['b', 'a'], ['p', 'q'], ['m', 'n'], ['s', 't'], ['B', 'A']] as const;
export const literalTerm: Gen = (R, n) => {
  const [P, Qn] = pick(R, SETS2), f = int(R, 0, 4);
  const p = V(P), qq = V(Qn);
  const forms: { coefH: string; coefT: string; right: string; wrongs: [string, string | undefined, string][]; half: string }[] = [
    { coefH: `(${p}/${qq})`, coefT: `\\frac{${P}}{${Qn}}`, half: `${p}/(2${qq})`, right: `(${p}/(2${qq}))²`, wrongs: [[`(${p}/2)²`, MC.notDivA, `The ${X}-coefficient is ${p}/${qq}, not ${p}: half of it is ${p}/(2${qq}).`], [`${p}/(2${qq})`, MC.wrongTerm, `${p}/(2${qq}) is half the coefficient. Add its SQUARE.`], [`(${p}/${qq})²`, MC.incomplete, `Halve ${p}/${qq} first, then square.`]] },
    { coefH: `(2${p}/${qq})`, coefT: `\\frac{2${P}}{${Qn}}`, half: `${p}/${qq}`, right: `(${p}/${qq})²`, wrongs: [[`${p}/${qq}`, MC.wrongTerm, `${p}/${qq} is half the coefficient. Add its square.`], [`(2${p}/${qq})²`, MC.incomplete, `Halve 2${p}/${qq} first: ${p}/${qq}. Then square.`], [`(${p}/(2${qq}))²`, undefined, `Half of 2${p}/${qq} is ${p}/${qq}, not ${p}/(2${qq}).`]] },
    { coefH: p, coefT: P, half: `${p}/2`, right: `(${p}/2)²`, wrongs: [[`${p}/2`, MC.wrongTerm, `${p}/2 is the side of the corner. Add its square.`], [`${p}²`, MC.incomplete, `Halve ${p} first, then square: (${p}/2)².`], [`(${p}/4)²`, undefined, `Half of ${p} is ${p}/2.`]] },
    { coefH: `(3/${qq})`, coefT: `\\frac{3}{${Qn}}`, half: `3/(2${qq})`, right: `(3/(2${qq}))²`, wrongs: [[`3/(2${qq})`, MC.wrongTerm, `That is half the coefficient. Add its square.`], [`(3/${qq})²`, MC.incomplete, `Halve 3/${qq} first.`], [`(3/2)²`, MC.notDivA, `The coefficient is 3/${qq}: its half is 3/(2${qq}).`]] },
    { coefH: `(${p}/${qq})`, coefT: `\\frac{${P}}{${Qn}}`, half: `−${p}/(2${qq})`, right: `(${p}/(2${qq}))²`, wrongs: [[`−(${p}/(2${qq}))²`, undefined, `The square of −${p}/(2${qq}) is positive: (${p}/(2${qq}))².`], [`−${p}/(2${qq})`, MC.wrongTerm, `That is half the coefficient. Add its square.`], [`(${p}/${qq})²`, MC.incomplete, `Halve first, then square.`]] },
  ];
  const F = forms[f]!, minus = f === 4;
  const opts: Opt[] = [{ t: F.right, ok: true, say: `Yes: half of the ${X}-coefficient is ${F.half}; its square completes the square.` }, ...F.wrongs.map(([t, mc, say]) => ({ t, mc, say }))];
  return choiceItem(R, {
    id: `literalTerm-${n}`, family: 'literalTerm', prompt: `What do you add to ${X}² ${minus ? '−' : '+'} ${F.coefH}${X} to complete the square${f === 2 ? "" : ` (${V(Qn)} ≠ 0)`}?`,
    board: `x^2 ${minus ? '-' : '+'} ${F.coefT}x + \\square`,
    solution: [`Half of the ${X}-coefficient: ${F.half}.`, `Square it: ${F.right}.`],
  }, opts);
};

export const literalNext: Gen = (R, n) => {
  const [A0, B0, C0] = pick(R, SETS3), A = V(A0), B = V(B0), C = V(C0), st = int(R, 0, 3);
  const L = [
    { h: `${A}${X}² + ${B}${X} + ${C} = 0`, t: `${A0}x^2 + ${B0}x + ${C0} = 0` },
    { h: `${X}² + (${B}/${A})${X} + ${C}/${A} = 0`, t: `x^2 + \\frac{${B0}}{${A0}}x + \\frac{${C0}}{${A0}} = 0` },
    { h: `${X}² + (${B}/${A})${X} = −${C}/${A}`, t: `x^2 + \\frac{${B0}}{${A0}}x = -\\frac{${C0}}{${A0}}` },
    { h: `${X}² + (${B}/${A})${X} + (${B}/(2${A}))² = (${B}/(2${A}))² − ${C}/${A}`, t: `x^2 + \\frac{${B0}}{${A0}}x + \\left(\\frac{${B0}}{2${A0}}\\right)^2 = \\left(\\frac{${B0}}{2${A0}}\\right)^2 - \\frac{${C0}}{${A0}}` },
    { h: `(${X} + ${B}/(2${A}))² = (${B}² − 4${A}${C})/(4${A}²)`, t: '' },
  ];
  const why = [`Divide every term by ${A} (${A} ≠ 0).`, `Subtract ${C}/${A} from both sides.`, `Add (${B}/(2${A}))², the square of half the ${X}-coefficient, to both sides.`, `The left side is a perfect square; the right side over 4${A}²: (${B}² − 4${A}${C})/(4${A}²).`][st]!;
  const W: [string, string | undefined, string][][] = [
    [[`${X}² + ${B}${X} + ${C} = 0`, MC.notDivA, `Every term is divided by ${A}, not only ${A}${X}².`], [`${X}² + (${B}/${A})${X} + ${C} = 0`, MC.someTerms, `The constant must be divided by ${A} too.`], [`${A}${X}² + ${B}${X} = ${C}`, MC.detached, `Moving ${C} across makes it −${C}; and the plan is to divide by ${A} first.`]],
    [[`${X}² + (${B}/${A})${X} = ${C}/${A}`, MC.detached, `Subtracting ${C}/${A} from both sides leaves −${C}/${A} on the right.`], [`${X}² + (${B}/${A})${X} = −${C}`, MC.someTerms, `The constant is ${C}/${A}; it moves as it is.`], [`${X}² + ${B}${X} = −${C}/${A}`, MC.notDivA, `The ${X}-coefficient stays ${B}/${A}.`]],
    [[`${X}² + (${B}/${A})${X} + (${B}/(2${A}))² = −${C}/${A}`, MC.unbalanced, `(${B}/(2${A}))² was added on the left, so add it on the right too.`], [`${X}² + (${B}/${A})${X} + (${B}/2)² = (${B}/2)² − ${C}/${A}`, MC.notDivA, `Half of the ${X}-coefficient ${B}/${A} is ${B}/(2${A}), not ${B}/2.`], [`${X}² + (${B}/${A})${X} + ${B}/(2${A}) = ${B}/(2${A}) − ${C}/${A}`, MC.wrongTerm, `Add the SQUARE of half the coefficient.`]],
    [[`(${X} + ${B}/${A})² = (${B}² − 4${A}${C})/(4${A}²)`, MC.incomplete, `The side of the square is ${X} + half the coefficient: ${X} + ${B}/(2${A}).`], [`(${X} + ${B}/(2${A}))² = (${B}² − ${C})/(4${A}² − ${A})`, MC.addDen, `Denominators are not subtracted: rewrite ${C}/${A} over 4${A}².`], [`(${X} + ${B}/(2${A}))² = (${B}² − 4${A}${C})/(2${A})`, MC.oneFactor, `(${B}/(2${A}))² = ${B}²/(4${A}²): square the denominator too.`]],
  ];
  const opts: Opt[] = [{ t: L[st + 1]!.h, ok: true, say: `Yes. ${why}` }, ...W[st]!.map(([t, mc, say]) => ({ t, mc, say }))];
  return choiceItem(R, {
    id: `literalNext-${n}`, family: 'literalNext', prompt: `Completing the square on ${A}${X}² + ${B}${X} + ${C} = 0 (${A} ≠ 0). The line so far is ${L[st]!.h}. Which line comes next?`,
    board: L[st]!.t,
    solution: [why, `Next line: ${L[st + 1]!.h}.`],
  }, opts);
};

// =============== 10. derive the formula ===============
export const deriveNext: Gen = (R, n) => {
  const st = int(R, 0, 2), numeric = R() < 0.4;
  let lines: { h: string; t: string }[], W: [string, string | undefined, string][][], why: string;
  if (!numeric) {
    const [A0, B0, C0] = pick(R, SETS3), A = V(A0), B = V(B0), C = V(C0);
    const D = `${B}² − 4${A}${C}`, DT = `${B0}^2 - 4${A0}${C0}`;
    lines = [
      { h: `(${X} + ${B}/(2${A}))² = (${D})/(4${A}²)`, t: `\\left(x + \\frac{${B0}}{2${A0}}\\right)^2 = \\frac{${DT}}{4${A0}^2}` },
      { h: `(2${A}${X} + ${B})² = ${D}`, t: `(2${A0}x + ${B0})^2 = ${DT}` },
      { h: `2${A}${X} + ${B} = ±√(${D})`, t: `2${A0}x + ${B0} = \\pm\\sqrt{${DT}}` },
      { h: `${X} = (−${B} ± √(${D}))/(2${A})`, t: '' },
    ];
    W = [
      [[`(${X} + ${B})² = ${D}`, undefined, `Multiplying by 4${A}² = (2${A})² multiplies the inside of the square by 2${A}: (2${A}${X} + ${B})².`], [`2${A}${X} + ${B} = ${D}`, undefined, `The left side is still a square: (2${A}${X} + ${B})².`], [`(2${A}${X} + ${B})² = 4${A}²(${D})`, MC.someTerms, `The right side's denominator 4${A}² cancels: both sides are multiplied by 4${A}² once.`]],
      [[`2${A}${X} + ${B} = √(${D})`, MC.onlyPos, `Both square roots: 2${A}${X} + ${B} can be +√(${D}) or −√(${D}).`], [`2${A}${X} + ${B} = ±(${B} − 2√(${A}${C}))`, MC.rootSum, `√(${D}) does not split over the minus sign.`], [`2${A}${X} = ±√(${D})`, undefined, `Taking the square root keeps the whole 2${A}${X} + ${B}.`]],
      [[`${X} = −${B} ± √(${D})/(2${A})`, MC.selected, `Dividing by 2${A} divides the WHOLE −${B} ± √(${D}).`], [`${X} = (${B} ± √(${D}))/(2${A})`, MC.bNotNeg, `Subtract ${B} from both sides: −${B}.`], [`${X} = (−${B} ± √(${D}))/${A}`, undefined, `The coefficient of ${X} is 2${A}: divide by 2${A}.`]],
    ];
    why = [`Multiply both sides by 4${A}² (not 0, since ${A} ≠ 0): 4${A}²(${X} + ${B}/(2${A}))² = (2${A}${X} + ${B})².`, `Take square roots, both signs: 2${A}${X} + ${B} = ±√(${D}).`, `Subtract ${B}, then divide by 2${A} (not 0): ${X} = (−${B} ± √(${D}))/(2${A}).`][st]!;
  } else {
    let a = 0, b = 0, c = 0, D = 0;
    for (;;) { a = int(R, 1, 4); b = nz(R, -9, 9); c = nz(R, -6, 6); D = disc(a, b, c); if (D > 0 && D <= 120) break; }
    const h = q(b, 2 * a), rhs = q(D, 4 * a * a), sD = isSq(D) ? String(Math.sqrt(D)) : `√${D}`, sDT = isSq(D) ? String(Math.sqrt(D)) : `\\sqrt{${D}}`;
    const lin = polyH([[2 * a, 1], [b, 0]]), linT = polyT([[2 * a, 1], [b, 0]]);
    lines = [
      { h: `(${binH(h, 'x', true)})² = ${qL(rhs)}`, t: `\\left(${polyT([[1, 1], [h, 0]])}\\right)^2 = ${rhs[1] === 1 ? iT(rhs[0]) : `\\frac{${rhs[0]}}{${rhs[1]}}`}` },
      { h: `(${lin})² = ${D}`, t: `(${linT})^2 = ${D}` },
      { h: `${lin} = ±${sD}`, t: `${linT} = \\pm ${sDT}` },
      { h: `${X} = (${iH(-b)} ± ${sD})/${2 * a}`, t: '' },
    ];
    W = [
      [[`(${polyH([[1, 1], [b, 0]])})² = ${D}`, undefined, `Multiplying by ${4 * a * a} = ${2 * a}² multiplies the inside by ${2 * a}: (${lin})².`], [`${lin} = ${D}`, undefined, `The left side is still a square.`], [`(${lin})² = ${4 * a * a * D}`, MC.someTerms, `The ${4 * a * a} on the right cancels the denominator; it is used once.`]],
      [[`${lin} = ${sD}`, MC.onlyPos, `Both square roots: ±${sD}.`], [`${2 * a}${X} = ±${sD}`, undefined, `The square root keeps the whole ${lin}.`], [`${lin} = ±${isSq(D) ? D / 2 : `${D}/2`}`, undefined, `The square root of ${D} is ${sD}, not half of it.`]],
      [[`${X} = ${iH(-b)} ± ${sD}/${2 * a}`, MC.selected, `Divide the WHOLE ${iH(-b)} ± ${sD} by ${2 * a}.`], [`${X} = (${iH(b)} ± ${sD})/${2 * a}`, MC.bNotNeg, `Subtract ${iH(b)} from both sides: ${iH(-b)}.`], [`${X} = ${iH(-b)} ± ${sD}`, undefined, `Divide by the coefficient of ${X}, ${2 * a}.`]],
    ];
    why = [`Multiply both sides by ${4 * a * a} = ${2 * a}²: (${lin})² = ${D}.`, `Take square roots, both signs: ${lin} = ±${sD}.`, `Subtract ${iH(b)}, then divide by ${2 * a}: ${X} = (${iH(-b)} ± ${sD})/${2 * a}.`][st]!;
  }
  const opts = uniq([{ t: lines[st + 1]!.h, ok: true, say: `Yes. ${why}` }, ...W[st]!.map(([t, mc, say]) => ({ t, mc, say }))]).filter((o, i) => i === 0 || o.t !== lines[st + 1]!.h);
  return choiceItem(R, {
    id: `deriveNext-${n}`, family: 'deriveNext', prompt: `Deriving the quadratic formula${numeric ? ' (a numerical twin)' : ''}. From ${lines[st]!.h}, which line comes next?`,
    board: lines[st]!.t,
    solution: [why, `Next line: ${lines[st + 1]!.h}.`],
  }, opts);
};

export const deriveWhy: Gen = (R, n) => {
  const kind = int(R, 0, 3);
  let a = 0, b = 0, c = 0;
  for (;;) { a = kind === 2 ? -int(R, 1, 4) : nz(R, -4, 4); b = nz(R, -9, 9); c = nz(R, -6, 6); const D = disc(a, b, c); if (kind === 3 ? D < 0 : D > 0) break; }
  const E = eqH(a, b, c), T = eqT(a, b, c), D = disc(a, b, c);
  const Q2 = [
    { p: `On the way to the formula, both sides of (${X} + <i>b</i>/(2<i>a</i>))² = (<i>b</i>² − 4<i>ac</i>)/(4<i>a</i>²) are multiplied by 4<i>a</i>². For ${E} that is ${4 * a * a}. Why is that allowed?`,
      right: `4<i>a</i>² is not 0, because <i>a</i> ≠ 0`, rs: `Multiplying both sides by a number that is not 0 keeps exactly the same solutions.`,
      w: [[`4<i>a</i>² is positive for every <i>a</i>, so there is nothing to check`, MC.noCond, `For a = 0 it is 0, and multiplying by 0 loses the equation. The reason is a ≠ 0.`], [`Because <i>b</i>² − 4<i>ac</i> &gt; 0`, undefined, `That is about real solutions, not about this step.`], [`It is not allowed: it changes the solutions`, undefined, `Multiplying both sides by the same nonzero number keeps the solutions.`]] },
    { p: `Why does the formula have ± in front of the root? (For ${E}, b² − 4ac = ${iH(D)}.)`,
      right: `Both √${D} and −√${D} square to ${D}, so 2<i>ax</i> + <i>b</i> can be either`, rs: `A square has two square roots; each one gives a solution.`,
      w: [[`The − root is only needed when <i>a</i> is negative`, MC.negALoses, `Both roots are needed for every a ≠ 0.`], [`√${D} itself means ± (both values)`, MC.pmValue, `√ means the principal (positive) root; the ± is written in because the equation has two.`], [`To round the answer up and down`, undefined, `Nothing is rounded: ± gives two exact solutions.`]] },
    { p: `For ${E}, <i>a</i> = ${iH(a)} is negative. Does the formula lose one of the two solutions?`,
      right: `No: ± already covers both signs, so both solutions come out`, rs: `√(4a²) = 2|a|, and ± absorbs the sign: (−b ± √D)/(2a) still gives both.`,
      w: [[`Yes: with <i>a</i> < 0 only the + branch is valid`, MC.negALoses, `Both branches stay: ± covers the sign of a.`], [`Yes: use 2|<i>a</i>| in the denominator instead of 2<i>a</i>`, MC.signSlip, `With 2|a| both solutions change sign: they would be wrong. Keep 2a.`], [`It depends on whether <i>c</i> is negative`, undefined, `The sign of c does not matter here: ± covers the sign of a.`]] },
    { p: `For ${E}, <i>b</i>² − 4<i>ac</i> = ${iH(D)}. What does the formula give?`,
      right: `No real solutions: no real number squared is ${iH(D)}`, rs: `The root of a negative number is not a real number, so there are no real solutions.`,
      w: [[`Two irrational solutions`, MC.negIrr, `Irrational numbers are real. Here there is no real solution at all.`], [`One solution, <i>x</i> = −<i>b</i>/(2<i>a</i>)`, undefined, `That would need b² − 4ac = 0.`], [`Two solutions, using √${-D} instead`, MC.everyReal, `Dropping the minus sign changes the equation.`]] },
  ][kind]!;
  const opts: Opt[] = [{ t: Q2.right, ok: true, say: `Yes. ${Q2.rs}` }, ...Q2.w.map(([t, mc, say]) => ({ t: t!, mc, say: say! }))];
  return choiceItem(R, {
    id: `deriveWhy-${n}`, family: 'deriveWhy', prompt: Q2.p, board: T,
    solution: [Q2.rs],
  }, opts);
};

// =============== 11. the discriminant: how many, what kind ===============
type DiscCat = 'pos-sq' | 'pos-ns' | 'zero' | 'neg';
function discEq(R: () => number, cat: DiscCat): { a: number; b: number; c: number; D: number } {
  if (cat === 'zero') { const p = int(R, 1, 3), k = nz(R, -5, 5), s = R() < 0.25 ? -1 : 1; const a = s * p * p, b = s * 2 * p * k, c = s * k * k; return { a, b, c, D: 0 }; }
  for (;;) {
    const a = nz(R, -4, 5), b = int(R, -9, 9), c = nz(R, -9, 9), D = disc(a, b, c);
    if (cat === 'neg' ? D < 0 : cat === 'pos-sq' ? D > 0 && isSq(D) : D > 0 && !isSq(D)) return { a, b, c, D };
  }
}
export const discCount: Gen = (R, n) => {
  const cat = pick(R, ['pos-sq', 'pos-ns', 'zero', 'zero', 'neg', 'neg'] as const), { a, b, c, D } = discEq(R, cat);
  const k = D > 0 ? 0 : D === 0 ? 1 : 2;
  const T = ['two different real solutions', 'exactly one real solution', 'no real solutions'];
  const mcs: (string | undefined)[][] = [[undefined, undefined, cat === 'pos-ns' ? MC.noFactor : undefined], [MC.repeatTwo, undefined, MC.zeroNone], [MC.everyReal, undefined, undefined]];
  const says = [
    [`b² − 4ac = ${iH(D)} > 0: two different real solutions.`, `One solution needs b² − 4ac = 0. Here it is ${iH(D)}.`, `${iH(D)} is positive, so √${D} is real: two solutions${cat === 'pos-ns' ? ', even though it does not factor' : ''}.`],
    [`b² − 4ac = 0: −b ± 0 is the same number twice, ONE solution.`, `b² − 4ac = 0 gives exactly one (repeated) solution.`, `√0 = 0 is real: there is one solution, x = −b/(2a).`],
    [`b² − 4ac = ${iH(D)} < 0: no real number has a square root of ${iH(D)}.`, `b² − 4ac = ${iH(D)} is negative, not 0.`, `b² − 4ac = ${iH(D)} < 0: no real solutions.`],
  ];
  const opts: Opt[] = T.map((t, i) => ({ t, ok: i === k, mc: i === k ? undefined : mcs[k]![i], say: i === k ? `Yes: ${says[k]![0]}` : says[k]![i]! }));
  return choiceItem(R, {
    id: `discCount-${n}`, family: 'discCount', prompt: `Use the discriminant: how many real solutions does ${eqH(a, b, c)} have?`, board: `${eqT(a, b, c)} \\qquad b^2 - 4ac`,
    solution: [`b² − 4ac = ${b < 0 ? `(${iH(b)})²` : `${b}²`} − 4(${iH(a)})(${iH(c)}) = ${iH(D)}.`, `${D > 0 ? 'Positive: two different real solutions' : D === 0 ? 'Zero: exactly one real solution' : 'Negative: no real solutions'}.`],
  }, opts, true);
};

export const discKind: Gen = (R, n) => {
  const cat = pick(R, ['pos-sq', 'pos-ns', 'zero', 'neg'] as const), { a, b, c, D } = discEq(R, cat);
  const T = ['two rational solutions', 'two irrational solutions', 'one rational solution', 'no real solutions'];
  const k = cat === 'pos-sq' ? 0 : cat === 'pos-ns' ? 1 : cat === 'zero' ? 2 : 3;
  const say = (i: number): [string | undefined, string] => {
    if (i === k) return [undefined, `Yes: b² − 4ac = ${iH(D)}${k === 0 ? ` = ${Math.sqrt(D)}², a perfect square, so the roots are rational` : k === 1 ? `, positive but not a perfect square, so √${D} is irrational` : k === 2 ? ', one repeated rational root' : ' < 0, so no real roots'}.`];
    if (k === 3 && i === 1) return [MC.negIrr, `Irrational numbers are real. With b² − 4ac = ${iH(D)} < 0 there are no real solutions.`];
    if (k === 1 && i === 3) return [MC.noFactor, `It does not factor over the integers, but ${iH(D)} > 0: there are two irrational solutions.`];
    if (k === 2 && i === 3) return [MC.zeroNone, `b² − 4ac = 0 gives one solution, −b/(2a).`];
    if (k === 2 && (i === 0 || i === 1)) return [MC.repeatTwo, `b² − 4ac = 0: the two roots are the same number. One solution.`];
    if (k === 0 && i === 1) return [undefined, `${iH(D)} = ${Math.sqrt(D)}² is a perfect square, so √${D} = ${Math.sqrt(D)} is rational.`];
    if (k === 1 && i === 0) return [undefined, `${iH(D)} is not a perfect square, so √${D} is irrational.`];
    return [undefined, `b² − 4ac = ${iH(D)}. Look at its sign, then whether it is a perfect square.`];
  };
  const opts: Opt[] = T.map((t, i) => { const [mc, s] = say(i); return { t, ok: i === k, mc, say: s }; });
  return choiceItem(R, {
    id: `discKind-${n}`, family: 'discKind', prompt: `${eqH(a, b, c)} has integer coefficients. What kind of solutions does it have?`, board: `${eqT(a, b, c)} \\qquad b^2 - 4ac`,
    solution: [`b² − 4ac = ${iH(D)}.`, D < 0 ? 'Negative: no real solutions.' : D === 0 ? 'Zero: one rational (repeated) solution.' : isSq(D) ? `A perfect square (${Math.sqrt(D)}²): two rational solutions.` : `Positive, not a perfect square: two irrational solutions.`],
  }, opts, true);
};

// =============== 12. the discriminant on the graph ===============
function parab(R: () => number, cat: 'pos' | 'zero' | 'neg'): { a: number; b: number; c: number; marks: number[] } {
  const a = R() < 0.3 ? -1 : 1;
  if (cat === 'pos') { for (;;) { const r1 = int(R, -5, 4), r2 = int(R, r1 + 1, Math.min(5, r1 + 5)); if (r2 - r1 >= 1) return { a, b: -a * (r1 + r2), c: a * r1 * r2, marks: [r1, r2] }; } }
  if (cat === 'zero') { const h = int(R, -4, 4); return { a, b: -2 * a * h, c: a * h * h, marks: [h] }; }
  const h = int(R, -3, 3), k = int(R, 1, 4);
  return { a, b: -2 * a * h, c: a * (h * h + k), marks: [] };
}
const PLANE = (a: number, b: number, c: number, marks: number[], shown: boolean, extra: Partial<PlanePic['reveal']> = {}): PlanePic =>
  ({ a, b, c, x: [-6, 6, 1], y: [-8, 8, 2], shown, reveal: { marks, ...extra } });
export const graphMatch: Gen = (R, n) => {
  const cat = pick(R, ['pos', 'zero', 'neg'] as const), { a, b, c, marks } = parab(R, cat);
  const k = cat === 'pos' ? 0 : cat === 'zero' ? 1 : 2;
  const T = ['b² − 4ac is positive: two real solutions', 'b² − 4ac is 0: one real solution', 'b² − 4ac is negative: no real solutions'];
  const look = ['crosses the x-axis twice', 'touches the x-axis at its vertex', 'misses the x-axis'][k]!;
  const opts: Opt[] = T.map((t, i) => ({ t, ok: i === k, mc: k === 1 && i === 0 ? MC.repeatTwo : undefined, say: i === k ? `Yes: the parabola ${look}.` : `Look where the parabola meets the x-axis: it ${look}.` }));
  return choiceItem(R, {
    id: `graphMatch-${n}`, family: 'graphMatch', prompt: `The graph of <i>y</i> = ${polyH(quadTerms(a, b, c))} is shown. What does it tell you about ${polyH(quadTerms(a, b, c))} = 0?`,
    board: `y = ${polyT(quadTerms(a, b, c))}`,
    picture: { plane: PLANE(a, b, c, marks, true) },
    solution: [`The real solutions of ${eqH(a, b, c)} are the x-intercepts of the graph.`, `The parabola ${look}; b² − 4ac = ${iH(disc(a, b, c))}.`],
  }, opts, true);
};

export const graphRead: Gen = (R, n) => {
  const { a, b, c, marks } = parab(R, 'pos'), [r1, r2] = marks as [number, number];
  return pairItem({
    id: `graphRead-${n}`, family: 'graphRead', prompt: `The graph of <i>y</i> = ${polyH(quadTerms(a, b, c))} is shown. Read the solutions of ${eqH(a, b, c)} from it. (Either order.)`,
    board: `y = ${polyT(quadTerms(a, b, c))}`,
    picture: { plane: PLANE(a, b, c, marks, true) },
    solution: [`The solutions are where the graph crosses the x-axis (y = 0).`, `It crosses at ${X} = ${ans(iH(r1))} and ${X} = ${ans(iH(r2))}; both make ${polyH(quadTerms(a, b, c))} equal 0.`],
  }, r1, r2, `${X} =`, ` or ${X} =`, '', (u, w) => {
    if (isSet(u, w, r1, r2)) return { ok: true, say: `Yes: it crosses at ${iH(r1)} and ${iH(r2)}.` };
    if (near(u, c) || near(w, c)) return { ok: false, say: `${iH(c)} is where it crosses the y-axis. Solutions of ... = 0 are on the x-axis.` };
    if (isSet(u, w, -r1, -r2)) return { ok: false, say: `Read the x-values where the curve meets the x-axis, signs as on the axis.` };
    return { ok: false, say: `Find where the curve meets the x-axis (y = 0).` };
  });
};

// =============== 13. check irrational solutions exactly ===============
function cand(R: () => number, truth: boolean) {
  const r = nz(R, -4, 4), s = pick(R, [2, 3, 5, 6, 7]), sg = sgnPick(R), b = -2 * r, c0 = r * r - s;
  const c = truth ? c0 : c0 + nz(R, -3, 3);
  const xH = `${iH(r)} ${sg < 0 ? '−' : '+'} √<u class="rb">${s}</u>`, xT = `${iT(r)} ${sg < 0 ? '-' : '+'} \\sqrt{${s}}`;
  return { r, s, sg, b, c, val: s - r * r + c, xH, xT };
}
export const exactCheck: Gen = (R, n) => {
  const k = cand(R, R() < 0.6), { r, s, sg, b, c, val, xH, xT } = k;
  const P = polyH(quadTerms(1, b, c));
  return numItem({
    id: `exactCheck-${n}`, family: 'exactCheck', prompt: `Check exactly: put ${X} = ${xH} into ${P}. What number do you get? (0 means it is a solution.)`,
    board: `x = ${xT}, \\qquad ${polyT(quadTerms(1, b, c))}`,
    solution: [
      `(${xH})² = ${r * r} ${sg * r < 0 ? '−' : '+'} ${Math.abs(2 * r)}√${s} + ${s} = ${r * r + s} ${sg * r < 0 ? '−' : '+'} ${Math.abs(2 * r)}√${s}.`,
      `${iH(b)}(${xH}) = ${iH(b * r)} ${sg * b < 0 ? '−' : '+'} ${Math.abs(b)}√${s}.`,
      `The √${s} terms cancel: ${r * r + s} + (${iH(b * r)}) + (${iH(c)}) = ${ans(iH(val))}.${val === 0 ? ' A solution.' : ' Not a solution.'}`,
    ],
  }, val, v => {
    if (v === val) return { ok: true, say: `Yes: the √${s} terms cancel and the rest is ${iH(val)}. ${val === 0 ? 'It is a solution.' : 'Not 0, so not a solution.'}` };
    if (v === 0) return { ok: false, mc: MC.roundedExact, say: `Work it out exactly: the √${s} terms cancel, and the whole numbers give ${iH(val)}, not 0.` };
    return { ok: false, say: `Expand (${xH})² = ${r * r} ${sg * r < 0 ? '−' : '+'} ${Math.abs(2 * r)}√${s} + ${s}, then add the other terms.` };
  });
};

export const roundCheck: Gen = (R, n) => {
  for (;;) {
    const k = cand(R, true), { b, c, xH, xT, r, s, sg } = k;
    const xr = round(r + sg * Math.sqrt(s), 2), L = round(xr * xr + b * xr + c, 4);
    if (Math.abs(L) < 0.0002) continue;
    const Ls = L < 0 ? `−${(-L).toFixed(4)}` : L.toFixed(4);
    const opts: Opt[] = [
      { t: `It is a solution: the leftover comes from rounding; the exact check gives 0`, ok: true, say: `Yes: ${dH(xr)} is not exactly ${xH}, so a small leftover is expected. Exactly, the √${s} terms cancel and the result is 0.` },
      { t: `${xH} is not a solution, because the result is not exactly 0`, mc: MC.gapError, say: `The check used ${dH(xr)}, a rounded value. The small gap is the rounding, not an error.` },
      { t: `${dH(xr)} is an exact solution`, mc: MC.roundedExact, say: `${dH(xr)} is a rounded decimal; the exact solution is ${xH}.` },
      { t: `Rounding to fewer places (${dH(round(xr, 1))}) would make the check exactly 0`, mc: MC.roundedExact, say: `Rounding more makes the gap bigger, not 0. Check exactly instead.` },
    ];
    return choiceItem(R, {
      id: `roundCheck-${n}`, family: 'roundCheck', prompt: `Jo checks ${X} = ${xH} in ${eqH(1, b, c)} with the rounded value ${X} ≈ ${dH(xr)} and gets ${Ls} instead of 0. What does that show?`,
      board: `x = ${xT} \\approx ${dH(xr)}, \\qquad ${eqT(1, b, c)}`,
      solution: [`Exactly: (${xH})² ${b < 0 ? '−' : '+'} ${Math.abs(b)}(${xH}) ${c < 0 ? '−' : '+'} ${Math.abs(c)} = 0 (the √${s} terms cancel).`, `${dH(xr)} is only close to ${xH}, so the rounded check is only close to 0.`],
    }, opts);
  }
};

// =============== 14. quadratic equations from contexts ===============
type Ctx = 'rect' | 'frame' | 'consec' | 'revenue' | 'proj';
export const ctxModel: Gen = (R, n) => {
  const kind = pick(R, ['rect', 'frame', 'consec', 'revenue', 'proj'] as Ctx[]);
  let p = '', right = '', w: [string, string | undefined, string][] = [], board = '';
  if (kind === 'rect') {
    const x = int(R, 3, 12), k = int(R, 2, 7), A = x * (x + k);
    p = `A rectangle is ${k} ft longer than it is wide, and its area is ${A} sq ft. Let ${X} be the width in feet. Which equation fits?`; board = `\\text{area} = ${A}\\ \\text{ft}^2`;
    right = `${X}(${X} + ${k}) = ${A}`;
    w = [[`${X} + (${X} + ${k}) = ${A}`, undefined, `Area is width TIMES length.`], [`2${X} + 2(${X} + ${k}) = ${A}`, undefined, `That is the perimeter, not the area.`], [`${X}(${X} − ${k}) = ${A}`, undefined, `The length is ${k} MORE than the width: ${X} + ${k}.`]];
  } else if (kind === 'frame') {
    const wd = pick(R, [4, 5, 6, 8]), l = wd + pick(R, [2, 4]), x = int(R, 1, 3), T = (wd + 2 * x) * (l + 2 * x);
    p = `A ${wd} in by ${l} in picture has a frame of the same width ${X} inches all around. Picture and frame cover ${T} sq in. Which equation fits?`; board = `${wd}\\ \\text{in} \\times ${l}\\ \\text{in},\\ \\text{total } ${T}\\ \\text{in}^2`;
    right = `(${wd} + 2${X})(${l} + 2${X}) = ${T}`;
    w = [[`(${wd} + ${X})(${l} + ${X}) = ${T}`, MC.borderOnce, `The frame is on BOTH sides: each length grows by 2${X}.`], [`${wd * l} + 2${X} = ${T}`, undefined, `The frame adds width to both dimensions; multiply the new dimensions.`], [`(${wd} + 2${X}) + (${l} + 2${X}) = ${T}`, undefined, `Area multiplies the dimensions.`]];
  } else if (kind === 'consec') {
    const x = int(R, 6, 16), P = x * (x + 1);
    p = `Two consecutive integers have product ${P}. Let ${X} be the smaller one. Which equation fits?`; board = `\\text{product} = ${P}`;
    right = `${X}(${X} + 1) = ${P}`;
    w = [[`${X} + (${X} + 1) = ${P}`, undefined, `Product means multiply.`], [`${X}(${X} + 2) = ${P}`, undefined, `Consecutive integers differ by 1.`], [`${X}² + 1 = ${P}`, MC.sumsPart, `${X}(${X} + 1) = ${X}² + ${X}, not ${X}² + 1.`]];
  } else if (kind === 'revenue') {
    const pr = pick(R, [10, 15, 20, 25]), qq = pick(R, [200, 300, 400]), k = pick(R, [5, 10]), x = int(R, 1, 9), Rv = (pr + x) * (qq - k * x);
    p = `A $${pr} ticket sells ${qq} seats. Each $1 increase in price loses ${k} sales. Let ${X} be the number of $1 increases. Revenue is $${Rv.toLocaleString('en-US')}. Which equation fits?`; board = `\\text{revenue} = \\text{price} \\times \\text{quantity}`;
    right = `(${pr} + ${X})(${qq} − ${k}${X}) = ${Rv.toLocaleString('en-US')}`;
    w = [[`(${pr} + ${X})(${qq} + ${k}${X}) = ${Rv.toLocaleString('en-US')}`, MC.priceQty, `A higher price LOSES sales: the quantity is ${qq} − ${k}${X}.`], [`(${pr} + ${X})(${qq} − ${k}) = ${Rv.toLocaleString('en-US')}`, undefined, `${k} sales are lost for EACH $1 increase: ${k}${X}.`], [`${pr * qq} + ${X} = ${Rv.toLocaleString('en-US')}`, undefined, `Revenue is price × quantity, and both change with ${X}.`]];
  } else {
    const h0 = pick(R, [0, 2, 4, 5, 6]), v = pick(R, [32, 48, 64, 80]), H = pick(R, [20, 30, 40, 50]);
    p = `A ball is thrown up from ${h0} ft at ${v} ft/s. Its height after <i>t</i> seconds is <i>h</i> = −16<i>t</i>² + ${v}<i>t</i> + ${h0}. Which equation finds when it is ${H} ft high?`; board = `h = -16t^2 + ${v}t + ${h0}`;
    right = `−16<i>t</i>² + ${v}<i>t</i> + ${h0} = ${H}`;
    w = [[`−16<i>t</i>² + ${h0}<i>t</i> + ${v} = ${H}`, undefined, `The speed ${v} goes with <i>t</i>; the start height ${h0} is the constant.`], [`16<i>t</i>² + ${v}<i>t</i> + ${h0} = ${H}`, undefined, `Gravity pulls down: −16<i>t</i>².`], [`−16<i>t</i>² + ${v}<i>t</i> + ${H} = ${h0}`, undefined, `Set the HEIGHT h equal to ${H}.`]];
  }
  const opts: Opt[] = uniq([{ t: right, ok: true, say: `Yes: ${right}.` }, ...w.map(([t, mc, say]) => ({ t, mc, say }))]);
  return choiceItem(R, { id: `ctxModel-${n}`, family: 'ctxModel', prompt: p, board, solution: [`Write the condition with the variable: ${right}.`] }, opts);
};

export const ctxSolve: Gen = (R, n) => {
  const kind = pick(R, ['rect', 'frame', 'proj'] as const);
  if (kind === 'rect') {
    const x = int(R, 3, 12), k = int(R, 2, 7), A = x * (x + k), neg = -(x + k);
    return numItem({
      id: `ctxSolve-${n}`, family: 'ctxSolve', prompt: `A rectangle is ${k} ft longer than it is wide, with area ${A} sq ft. Solve ${X}(${X} + ${k}) = ${A}. How wide is it?`, board: `x(x + ${k}) = ${A}`, unit: 'ft',
      solution: [`${X}² + ${k}${X} − ${A} = 0 factors as (${X} − ${x})(${X} + ${x + k}) = 0.`, `${X} = ${x} or ${X} = ${iH(neg)}; a width can't be negative, so the width is ${ans(x)} ft.`],
    }, x, v => {
      if (v === x) return { ok: true, say: `Yes: ${x} ft by ${x + k} ft gives ${A} sq ft.` };
      if (v === neg) return { ok: false, mc: MC.ctxAll, say: `${iH(neg)} solves the equation, but a width can't be negative. Keep ${x}.` };
      if (v === x + k) return { ok: false, say: `${x + k} ft is the length. The width is ${k} less.` };
      return { ok: false, say: `Solve ${X}² + ${k}${X} − ${A} = 0 and keep the root that makes sense.` };
    }, 'ft');
  }
  if (kind === 'frame') {
    const wd = pick(R, [4, 5, 6, 8]), l = wd + pick(R, [2, 4]), x = int(R, 1, 3), T = (wd + 2 * x) * (l + 2 * x);
    const D1 = (wd + l) ** 2 - 4 * (wd * l - T), once = isSq(D1) ? (-(wd + l) + Math.sqrt(D1)) / 2 : NaN;
    const neg = -(wd + l) / 2 - x;
    return numItem({
      id: `ctxSolve-${n}`, family: 'ctxSolve', prompt: `A ${wd} in by ${l} in picture has a frame ${X} in wide all around; together they cover ${T} sq in. Solve (${wd} + 2${X})(${l} + 2${X}) = ${T}. How wide is the frame?`,
      board: `(${wd} + 2x)(${l} + 2x) = ${T}`, unit: 'in',
      solution: [`Expand: 4${X}² + ${2 * (wd + l)}${X} + ${wd * l} = ${T}, so 4${X}² + ${2 * (wd + l)}${X} − ${T - wd * l} = 0.`, `The solutions are ${X} = ${x} and ${X} = ${dH(neg)}; a width can't be negative: ${ans(x)} in.`],
    }, x, v => {
      if (v === x) return { ok: true, say: `Yes: ${wd + 2 * x} in × ${l + 2 * x} in = ${T} sq in.` };
      if (near(v, neg)) return { ok: false, mc: MC.ctxAll, say: `${dH(neg)} solves the equation, but the frame's width can't be negative.` };
      if (near(v, once)) return { ok: false, mc: MC.borderOnce, say: `The frame is on both sides: the picture grows by 2${X} each way.` };
      return { ok: false, say: `Expand, bring ${T} over, and solve; keep the positive root.` };
    }, 'in');
  }
  for (;;) {
    const t1 = pick(R, [0.5, 1, 1.5, 2]), t2 = t1 + pick(R, [1, 1.5, 2, 3]), h0 = pick(R, [0, 2, 4, 5, 6]);
    const v = 16 * (t1 + t2), H = h0 + 16 * t1 * t2;
    if (!Number.isInteger(v) || !Number.isInteger(H)) continue;
    return numItem({
      id: `ctxSolve-${n}`, family: 'ctxSolve', prompt: `A ball's height is <i>h</i> = −16<i>t</i>² + ${v}<i>t</i> + ${h0} feet after <i>t</i> seconds. When does it first reach ${H} ft, on the way up?`, board: `-16t^2 + ${v}t + ${h0} = ${H}`, unit: 's',
      solution: [`−16<i>t</i>² + ${v}<i>t</i> − ${H - h0} = 0; divide by −16: <i>t</i>² − ${t1 + t2}<i>t</i> + ${t1 * t2} = 0.`, `<i>t</i> = ${t1} or <i>t</i> = ${t2}. On the way up is the earlier time: ${ans(t1)} s.`],
    }, t1, w => {
      if (near(w, t1)) return { ok: true, say: `Yes: ${t1} s on the way up (and ${t2} s on the way down).` };
      if (near(w, t2)) return { ok: false, say: `${t2} s is when it comes back down through ${H} ft. On the way up is earlier.` };
      return { ok: false, say: `Solve −16<i>t</i>² + ${v}<i>t</i> + ${h0} = ${H}; the smaller positive root is on the way up.` };
    }, 's');
  }
};

export const ctxRoots: Gen = (R, n) => {
  const kind = pick(R, ['consec', 'rect', 'up', 'never', 'ground'] as const);
  let p = '', board = '', right = '', w: [string, string | undefined, string][] = [], why = '';
  if (kind === 'consec') {
    const x = int(R, 6, 16), P = x * (x + 1), m = -(x + 1);
    p = `${X}(${X} + 1) = ${P} (two consecutive integers, ${X} the smaller) has solutions ${X} = ${x} and ${X} = ${iH(m)}. Which answer the question?`; board = `x(x + 1) = ${P}`;
    right = `Both: ${x} and ${x + 1}, or ${iH(m)} and ${iH(m + 1)}`; why = `Integers may be negative: (${iH(m)})(${iH(m + 1)}) = ${P} too.`;
    w = [[`Only ${X} = ${x}: a negative ${X} can't work`, MC.discarded, `Check it: (${iH(m)})(${iH(m + 1)}) = ${P}. Negative integers are integers.`], [`Only ${X} = ${iH(m)}`, undefined, `${x} × ${x + 1} = ${P} works as well.`], [`Neither: the question has no answer`, undefined, `Both pairs multiply to ${P}.`]];
  } else if (kind === 'rect') {
    const x = int(R, 3, 12), k = int(R, 2, 7), A = x * (x + k), m = -(x + k);
    p = `A rectangle's width ${X} (ft) solves ${X}(${X} + ${k}) = ${A}, with solutions ${X} = ${x} and ${X} = ${iH(m)}. Which give a width?`; board = `x(x + ${k}) = ${A}`;
    right = `Only ${X} = ${x}: a width can't be negative`; why = `A length is positive, so ${iH(m)} is rejected.`;
    w = [[`Both ${x} and ${iH(m)}`, MC.ctxAll, `${iH(m)} ft is not a width: lengths are positive.`], [`Only ${X} = ${iH(m)}`, undefined, `A width can't be negative.`], [`Neither`, undefined, `${x} ft by ${x + k} ft gives ${A} sq ft.`]];
  } else if (kind === 'up' || kind === 'ground') {
    for (;;) {
      if (kind === 'up') {
        const t1 = pick(R, [0.5, 1, 1.5, 2]), t2 = t1 + pick(R, [1, 1.5, 2, 3]), h0 = pick(R, [0, 2, 4, 6]), v = 16 * (t1 + t2), H = h0 + 16 * t1 * t2;
        p = `A ball has height <i>h</i> = −16<i>t</i>² + ${v}<i>t</i> + ${h0} ft. Solving <i>h</i> = ${H} gives <i>t</i> = ${t1} and <i>t</i> = ${t2}. Which times are real moments at ${H} ft?`; board = `-16t^2 + ${v}t + ${h0} = ${H}`;
        right = `Both: ${t1} s going up and ${t2} s coming down`; why = `The ball passes ${H} ft twice.`;
        w = [[`Only ${t1} s: an equation like this has one answer`, MC.discarded, `At ${t2} s the ball is at ${H} ft again, on the way down. Both are valid.`], [`Only ${t2} s`, MC.discarded, `At ${t1} s it is at ${H} ft on the way up.`], [`Neither: the ball never gets that high`, undefined, `The equation has real solutions, so it does.`]];
      } else {
        const t2 = pick(R, [2, 3, 4, 5]), t1 = -pick(R, [0.25, 0.5]), v = 16 * (t1 + t2), h0 = -16 * t1 * t2;
        if (!Number.isInteger(v) || !Number.isInteger(h0)) continue;
        p = `A ball thrown from ${h0} ft has height <i>h</i> = −16<i>t</i>² + ${v}<i>t</i> + ${h0}. Solving <i>h</i> = 0 gives <i>t</i> = ${t2} and <i>t</i> = −${-t1}. When does it land?`; board = `-16t^2 + ${v}t + ${h0} = 0`;
        right = `At ${t2} s only: the throw starts at t = 0`; why = `Times before the throw (negative t) don't count.`;
        w = [[`At ${t2} s and at −${-t1} s`, MC.ctxAll, `t = −${-t1} is before the throw: the model only holds for t ≥ 0.`], [`At −${-t1} s only`, undefined, `Negative time is before the throw.`], [`It never lands`, MC.notInterpreted, `There is a positive root: ${t2} s.`]];
      }
      break;
    }
  } else {
    const h0 = pick(R, [0, 2, 4, 6]), v = pick(R, [32, 48, 64]), top = h0 + v * v / 64, H = top + pick(R, [10, 20, 30]);
    p = `A ball has height <i>h</i> = −16<i>t</i>² + ${v}<i>t</i> + ${h0} ft. The equation −16<i>t</i>² + ${v}<i>t</i> + ${h0} = ${H} has no real solutions. What does that mean?`; board = `-16t^2 + ${v}t + ${h0} = ${H}`;
    right = `The ball never reaches ${H} ft`; why = `No time t gives a height of ${H} ft: the highest point is ${top} ft.`;
    w = [[`The problem has no answer, so it was set up wrong`, MC.notInterpreted, `"No real solution" says something about the ball: it never gets that high.`], [`It reaches ${H} ft at its highest point`, undefined, `That would give exactly one solution.`], [`It reaches ${H} ft at two complex times`, MC.noReal, `Time is a real number; no real t works, so it never happens.`]];
  }
  const opts: Opt[] = [{ t: right, ok: true, say: `Yes. ${why}` }, ...w.map(([t, mc, say]) => ({ t, mc, say }))];
  return choiceItem(R, { id: `ctxRoots-${n}`, family: 'ctxRoots', prompt: p, board, solution: [why] }, opts);
};

// =============== 15. rearrange formulas through a square root ===============
interface Fm { p: string; t: string; right: string; w: [string, string | undefined, string][]; why: string }
const FORMULAS: Fm[] = [
  { p: `<i>A</i> = π<i>r</i>² for the radius <i>r</i>`, t: 'A = \\pi r^2', right: `<i>r</i> = √(<i>A</i>/π)`, why: 'Divide by π, then take the square root; a radius is positive, so only the principal root.', w: [[`<i>r</i> = ±√(<i>A</i>/π)`, MC.ctxAll, 'A radius is never negative: keep only the principal root.'], [`<i>r</i> = √<i>A</i>/π`, MC.oneFactor, 'Divide by π BEFORE the root: √(A/π).'], [`<i>r</i> = <i>A</i>/(2π)`, undefined, 'Undo a square with a square root, not by halving.']] },
  { p: `<i>V</i> = π<i>r</i>²<i>h</i> for the radius <i>r</i> (<i>h</i> ≠ 0)`, t: 'V = \\pi r^2 h', right: `<i>r</i> = √(<i>V</i>/(π<i>h</i>))`, why: 'Divide by πh (h ≠ 0), then take the principal root.', w: [[`<i>r</i> = ±√(<i>V</i>/(π<i>h</i>))`, MC.ctxAll, 'A radius is never negative.'], [`<i>r</i> = √(<i>V</i>/π) · <i>h</i>`, undefined, 'h multiplies r², so divide by it.'], [`<i>r</i> = <i>V</i>/(π<i>h</i>)²`, undefined, 'Undo the square with a square root.']] },
  { p: `<i>d</i> = 16<i>t</i>² for the time <i>t</i> (<i>t</i> ≥ 0)`, t: 'd = 16t^2', right: `<i>t</i> = √<i>d</i>/4`, why: 't² = d/16, so t = √(d/16) = √d/4 (time is not negative).', w: [[`<i>t</i> = ±√<i>d</i>/4`, MC.ctxAll, 'Time after the drop is t ≥ 0: only the principal root.'], [`<i>t</i> = √<i>d</i>/16`, MC.oneFactor, '√(d/16) = √d/√16 = √d/4.'], [`<i>t</i> = <i>d</i>/32`, undefined, 'Undo the square with a square root.']] },
  { p: `<i>PV</i> = <i>nRT</i> for <i>T</i>`, t: 'PV = nRT', right: `<i>T</i> = <i>PV</i>/(<i>nR</i>)`, why: 'Divide both sides by nR (n ≠ 0, R ≠ 0). No root needed.', w: [[`<i>T</i> = <i>PV</i> − <i>nR</i>`, undefined, 'T is multiplied by nR: divide.'], [`<i>T</i> = √(<i>PV</i>/(<i>nR</i>))`, undefined, 'T is not squared: no root.'], [`<i>T</i> = <i>PVnR</i>`, undefined, 'Undo multiplying by nR with dividing.']] },
  { p: `<i>y</i> = <i>a</i>(<i>x</i> − <i>h</i>)² + <i>k</i> for <i>x</i> (<i>a</i> ≠ 0)`, t: 'y = a(x - h)^2 + k', right: `<i>x</i> = <i>h</i> ± √((<i>y</i> − <i>k</i>)/<i>a</i>)`, why: 'Subtract k, divide by a, take BOTH roots (x can be on either side of h), add h.', w: [[`<i>x</i> = <i>h</i> + √((<i>y</i> − <i>k</i>)/<i>a</i>)`, MC.onlyPos, 'x − h can be negative too: keep ±.'], [`<i>x</i> = <i>h</i> ± √(<i>y</i> − <i>k</i>)/<i>a</i>`, MC.oneFactor, 'Divide by a INSIDE the root: √((y − k)/a).'], [`<i>x</i> = ±√((<i>y</i> − <i>k</i>)/<i>a</i>) − <i>h</i>`, MC.detached, 'Undo − h by ADDING h.']] },
  { p: `<i>A</i> = <i>P</i>(1 + <i>r</i>/<i>n</i>)<sup><i>nt</i></sup> for <i>P</i>`, t: 'A = P\\left(1 + \\frac{r}{n}\\right)^{nt}', right: `<i>P</i> = <i>A</i>/(1 + <i>r</i>/<i>n</i>)<sup><i>nt</i></sup>`, why: 'P is multiplied by the (nonzero) power: divide by it.', w: [[`<i>P</i> = <i>A</i> − (1 + <i>r</i>/<i>n</i>)<sup><i>nt</i></sup>`, undefined, 'P is multiplied, not added: divide.'], [`<i>P</i> = <i>A</i>/(1 + <i>r</i>/<i>n</i>)`, undefined, 'Divide by the whole power, exponent and all.'], [`<i>P</i> = <i>A</i>(1 + <i>r</i>/<i>n</i>)<sup><i>nt</i></sup>`, undefined, 'Undo multiplying with dividing.']] },
  { p: `<i>K</i> = ½<i>mv</i>² for the speed <i>v</i> (<i>m</i> ≠ 0)`, t: 'K = \\tfrac{1}{2}mv^2', right: `<i>v</i> = √(2<i>K</i>/<i>m</i>)`, why: 'Multiply by 2, divide by m, take the principal root (a speed is not negative).', w: [[`<i>v</i> = ±√(2<i>K</i>/<i>m</i>)`, MC.ctxAll, 'A speed is not negative: principal root only.'], [`<i>v</i> = √(<i>K</i>/(2<i>m</i>))`, undefined, 'Undo × ½ with × 2: 2K/m.'], [`<i>v</i> = 2<i>K</i>/<i>m</i>`, undefined, 'That is v²; take the root.']] },
  { p: `<i>a</i>² + <i>b</i>² = <i>c</i>² for the side <i>b</i>`, t: 'a^2 + b^2 = c^2', right: `<i>b</i> = √(<i>c</i>² − <i>a</i>²)`, why: 'b² = c² − a², then the principal root (a side is positive).', w: [[`<i>b</i> = <i>c</i> − <i>a</i>`, MC.rootSum, '√(c² − a²) is not c − a: the root does not split over a minus.'], [`<i>b</i> = ±√(<i>c</i>² − <i>a</i>²)`, MC.ctxAll, 'A side length is positive.'], [`<i>b</i> = √(<i>c</i>² + <i>a</i>²)`, undefined, 'Subtract a² from both sides.']] },
  { p: `<i>E</i> = <i>mc</i>² for <i>c</i> (<i>c</i> &gt; 0, <i>m</i> ≠ 0)`, t: 'E = mc^2', right: `<i>c</i> = √(<i>E</i>/<i>m</i>)`, why: 'Divide by m, then the principal root (c &gt; 0).', w: [[`<i>c</i> = <i>E</i>/(2<i>m</i>)`, undefined, 'Undo a square with a root, not halving.'], [`<i>c</i> = √<i>E</i>/<i>m</i>`, MC.oneFactor, 'Divide by m inside the root.'], [`<i>c</i> = ±√(<i>E</i>/<i>m</i>)`, MC.ctxAll, 'c &gt; 0 is given: principal root only.']] },
  { p: `<i>s</i> = ½<i>gt</i>² for <i>t</i> (<i>t</i> ≥ 0, <i>g</i> ≠ 0)`, t: 's = \\tfrac{1}{2}gt^2', right: `<i>t</i> = √(2<i>s</i>/<i>g</i>)`, why: 'Multiply by 2, divide by g, principal root (t ≥ 0).', w: [[`<i>t</i> = √(<i>s</i>/(2<i>g</i>))`, undefined, 'Undo × ½ with × 2.'], [`<i>t</i> = ±√(2<i>s</i>/<i>g</i>)`, MC.ctxAll, 't ≥ 0 is given: principal root only.'], [`<i>t</i> = 2<i>s</i>/<i>g</i>`, undefined, 'That is t²; take the root.']] },
];
const CONDS: { p: string; t: string; right: string; w: string[] }[] = [
  { p: `Solving <i>V</i> = π<i>r</i>²<i>h</i> for <i>r</i> divides by π<i>h</i>. Which condition must you state?`, t: 'r = \\sqrt{\\frac{V}{\\pi h}}', right: '<i>h</i> ≠ 0', w: ['<i>r</i> ≠ 0', '<i>V</i> ≠ 0', 'none'] },
  { p: `Solving <i>PV</i> = <i>nRT</i> for <i>T</i> divides by <i>nR</i>. Which condition must you state?`, t: 'T = \\frac{PV}{nR}', right: '<i>n</i> ≠ 0 and <i>R</i> ≠ 0', w: ['<i>T</i> ≠ 0', '<i>P</i> ≠ 0 and <i>V</i> ≠ 0', 'none'] },
  { p: `Solving <i>y</i> = <i>a</i>(<i>x</i> − <i>h</i>)² + <i>k</i> for <i>x</i> divides by <i>a</i>. Which condition must you state?`, t: 'x = h \\pm \\sqrt{\\frac{y - k}{a}}', right: '<i>a</i> ≠ 0', w: ['<i>h</i> ≠ 0', '<i>k</i> ≠ 0', 'none'] },
  { p: `Solving <i>K</i> = ½<i>mv</i>² for <i>v</i> divides by <i>m</i>. Which condition must you state?`, t: 'v = \\sqrt{\\frac{2K}{m}}', right: '<i>m</i> ≠ 0', w: ['<i>K</i> ≠ 0', '<i>v</i> ≠ 0', 'none'] },
];
export const rearrange: Gen = (R, n) => {
  const k = int(R, 0, FORMULAS.length + CONDS.length - 1);
  if (k < FORMULAS.length) {
    const F = FORMULAS[k]!;
    const opts: Opt[] = [{ t: F.right, ok: true, say: `Yes. ${F.why}` }, ...F.w.map(([t, mc, say]) => ({ t, mc, say }))];
    return choiceItem(R, { id: `rearrange-${n}`, family: 'rearrange', prompt: `Solve ${F.p}.`, board: F.t, solution: [F.why, `So ${F.right}.`] }, opts);
  }
  const C = CONDS[k - FORMULAS.length]!;
  const opts: Opt[] = [{ t: C.right, ok: true, say: 'Yes: you can only divide by a number that is not 0.' }, ...C.w.map(t => ({ t, mc: t === 'none' ? MC.noCond : undefined, say: t === 'none' ? 'Dividing by a letter needs that letter (or product) to be nonzero.' : 'Look at what you divide by: that must not be 0.' }))];
  return choiceItem(R, { id: `rearrange-${n}`, family: 'rearrange', prompt: C.p, board: C.t, solution: ['A divisor must not be 0.', `So ${C.right}.`] }, opts);
};

export const rearrangeEval: Gen = (R, n) => {
  for (;;) {
    const kind = pick(R, ['circle', 'drop', 'cyl', 'energy'] as const);
    let p = '', t = '', v = 0, unit = '', steps: string[] = [], slip = NaN;
    if (kind === 'circle') { const A = int(R, 10, 300); v = Math.sqrt(A / Math.PI); slip = Math.sqrt(A); p = `A circle has area ${A} sq in. Use <i>r</i> = √(<i>A</i>/π) to find its radius, to the nearest hundredth of an inch.`; t = `r = \\sqrt{\\frac{A}{\\pi}},\\ A = ${A}`; unit = 'in'; steps = [`${A}/π ≈ ${round(A / Math.PI, 4)}.`, `√${round(A / Math.PI, 4)} ≈ ${round(v, 4)}`]; }
    else if (kind === 'drop') { const d = int(R, 20, 400); v = Math.sqrt(d) / 4; slip = Math.sqrt(d / 4); p = `A stone falls <i>d</i> = 16<i>t</i>² feet in <i>t</i> seconds. Use <i>t</i> = √<i>d</i>/4 to find how long a ${d} ft fall takes, to the nearest hundredth of a second.`; t = `t = \\frac{\\sqrt{d}}{4},\\ d = ${d}`; unit = 's'; steps = [`√${d} ≈ ${round(Math.sqrt(d), 4)}.`, `÷ 4 ≈ ${round(v, 4)}`]; }
    else if (kind === 'cyl') { const V = int(R, 50, 900), h = int(R, 3, 12); v = Math.sqrt(V / (Math.PI * h)); slip = Math.sqrt(V / Math.PI) / h; p = `A can holds <i>V</i> = ${V} cu in and is ${h} in tall. Use <i>r</i> = √(<i>V</i>/(π<i>h</i>)) to find its radius, to the nearest hundredth of an inch.`; t = `r = \\sqrt{\\frac{V}{\\pi h}},\\ V = ${V},\\ h = ${h}`; unit = 'in'; steps = [`π · ${h} ≈ ${round(Math.PI * h, 4)}; ${V} ÷ ${round(Math.PI * h, 4)} ≈ ${round(V / (Math.PI * h), 4)}.`, `√ ≈ ${round(v, 4)}`]; }
    else { const K = int(R, 20, 900), m = int(R, 2, 20); v = Math.sqrt(2 * K / m); slip = Math.sqrt(K / (2 * m)); p = `A ${m} kg cart has kinetic energy ${K} J. Use <i>v</i> = √(2<i>K</i>/<i>m</i>) to find its speed, to the nearest hundredth of a meter per second.`; t = `v = \\sqrt{\\frac{2K}{m}},\\ K = ${K},\\ m = ${m}`; unit = 'm/s'; steps = [`2 · ${K} ÷ ${m} = ${round(2 * K / m, 4)}.`, `√${round(2 * K / m, 4)} ≈ ${round(v, 4)}`]; }
    if (!noTie(v, 2, 0.25)) continue;
    const a = round(v);
    return numItem({
      id: `rearrangeEval-${n}`, family: 'rearrangeEval', prompt: `${p} (Calculator.)`, board: t, unit,
      solution: [...steps.slice(0, -1), `${steps[steps.length - 1]}, so about ${ans(a)} ${unit}.`],
    }, a, w => {
      if (near(w, a)) return { ok: true, say: `Yes: about ${a} ${unit}.` };
      if (near(w, round(slip))) return { ok: false, say: `Follow the formula exactly: everything under the root first, then the root.` };
      if (Math.abs(w - v) < 0.011) return { ok: false, say: `Close: round to the nearest hundredth, ${a}.` };
      return { ok: false, say: `Put the numbers in, work out what is under the root, then take the square root.` };
    }, unit);
  }
};

// =============== 16. quadratic inequalities ===============
type Rel = '<' | '≤' | '>' | '≥';
const relT: Record<Rel, string> = { '<': '<', '≤': '\\le', '>': '>', '≥': '\\ge' };
const RH = (r: Rel) => ({ '<': '&lt;', '≤': '≤', '>': '&gt;', '≥': '≥' } as const)[r];
const flip = (r: Rel): Rel => ({ '<': '>', '>': '<', '≤': '≥', '≥': '≤' } as const)[r];
/** a window [min, max, step] that ends on grid lines and holds lo..hi */
function win(lo: number, hi: number, cells = 8): [number, number, number] {
  const raw = (hi - lo) / cells, steps = [0.5, 1, 2, 4, 5, 10, 20, 25, 50, 100];
  for (const s of steps) if (s >= raw) { const a = Math.floor(lo / s) * s, b = Math.ceil(hi / s) * s; if ((b - a) / s <= 12) return [a, b, s]; }
  return [Math.floor(lo), Math.ceil(hi), Math.ceil(raw)];
}
export const ineqSet: Gen = (R, n) => {
  const t = pick(R, ['fact', 'exp', 'rew', 'sq', 'neg', 'irr', 'proj'] as const), rel = pick(R, ['<', '≤', '>', '≥'] as Rel[]);
  let lo = 0, hi = 0, loH = '', hiH = '', tex = '', htm = '', a = 1, b = 0, c = 0, v = X, plus = '';
  if (t === 'irr') {
    const r = nz(R, -3, 3), s = pick(R, [2, 3, 5, 6, 7]);
    lo = r - Math.sqrt(s); hi = r + Math.sqrt(s); loH = `${iH(r)} − ${sq(1, s)}`; hiH = `${iH(r)} + ${sq(1, s)}`;
    b = -2 * r; c = r * r - s; tex = `${polyT(quadTerms(1, b, c))} ${relT[rel]} 0`; htm = `${polyH(quadTerms(1, b, c))} ${RH(rel)} 0`;
  } else if (t === 'proj') {
    const t1 = pick(R, [1, 2]), t2 = t1 + pick(R, [1, 2, 3]), h0 = pick(R, [2, 4, 6]), vv = 16 * (t1 + t2), H = h0 + 16 * t1 * t2;
    lo = t1; hi = t2; loH = String(t1); hiH = String(t2); a = -16; b = vv; c = h0 - H; v = '<i>t</i>';
    const rr: Rel = R() < 0.5 ? '>' : '≥';
    tex = `-16t^2 + ${vv}t + ${h0} ${relT[rr]} ${H}`; htm = `−16<i>t</i>² + ${vv}<i>t</i> + ${h0} ${RH(rr)} ${H}`;
    plus = ` (the ball's height in feet after <i>t</i> seconds is above ${H} ft${rr === '≥' ? ' or at it' : ''})`;
    return ineqChoice(R, n, { lo, hi, loH, hiH, a, b, c, rel: rr, tex, htm: htm + plus, v, sqForm: false, proj: true, zeroRel: rr });
  } else {
    let p = 0, qq = 0;
    if (t === 'sq') { const k = int(R, 1, 9); p = -k; qq = k; } else { for (;;) { p = int(R, -6, 5); qq = int(R, p + 1, Math.min(7, p + 8)); if (p !== 0 || qq !== 0) break; } }
    lo = p; hi = qq; loH = iH(p); hiH = iH(qq); b = -(p + qq); c = p * qq;
    const fac = (r: number) => (r === 0 ? 'x' : `x ${r > 0 ? '-' : '+'} ${Math.abs(r)}`), facH = (r: number) => (r === 0 ? X : `${X} ${r > 0 ? '−' : '+'} ${Math.abs(r)}`);
    if (t === 'fact') { const fT = (r: number) => (r === 0 ? 'x' : `(${fac(r)})`), fHh = (r: number) => (r === 0 ? X : `(${facH(r)})`); tex = `${fT(p)}${fT(qq)} ${relT[rel]} 0`; htm = `${fHh(p)}${fHh(qq)} ${RH(rel)} 0`; }
    else if (t === 'exp') { tex = `${polyT(quadTerms(1, b, c))} ${relT[rel]} 0`; htm = `${polyH(quadTerms(1, b, c))} ${RH(rel)} 0`; }
    else if (t === 'rew') { tex = `x^2 ${relT[rel]} ${polyT([[-b, 1], [-c, 0]])}`; htm = `${X}² ${RH(rel)} ${polyH([[-b, 1], [-c, 0]])}`; }
    else if (t === 'sq') { tex = `x^2 ${relT[rel]} ${qq * qq}`; htm = `${X}² ${RH(rel)} ${qq * qq}`; }
    else { a = -1; tex = `${polyT(quadTerms(-1, -b, -c))} ${relT[rel]} 0`; htm = `${polyH(quadTerms(-1, -b, -c))} ${RH(rel)} 0`; }
  }
  return ineqChoice(R, n, { lo, hi, loH, hiH, a, b: a === -1 ? -b : b, c: a === -1 ? -c : c, rel, tex, htm, v, sqForm: t === 'sq', proj: false, zeroRel: rel });
};
function ineqChoice(R: () => number, n: number, o: { lo: number; hi: number; loH: string; hiH: string; a: number; b: number; c: number; rel: Rel; tex: string; htm: string; v: string; sqForm: boolean; proj: boolean; zeroRel: Rel }) {
  const { lo, hi, loH, hiH, a, rel, v } = o;
  // in zero form f(x) rel 0 with f = a(x − lo)(x − hi): a > 0 is negative between the zeros
  const strict = rel === '<' || rel === '>';
  const between = a > 0 ? rel === '<' || rel === '≤' : rel === '>' || rel === '≥';
  const L = strict ? '&lt;' : '≤', G = strict ? '&gt;' : '≥';
  const inside = `${loH} ${L} ${v} ${L} ${hiH}`, outside = `${v} ${L} ${loH} or ${v} ${G} ${hiH}`;
  const right = between ? inside : outside, wrong = between ? outside : inside;
  const sayR = between ? `The expression is ${a > 0 ? 'negative' : 'positive'} between the zeros ${loH} and ${hiH}${strict ? ', and the zeros themselves are left out' : ', zeros included'}.` : `The expression is ${a > 0 ? 'positive' : 'negative'} outside the zeros${strict ? ', zeros left out' : ', zeros included'}.`;
  const opts: Opt[] = [
    { t: right, ok: true, say: `Yes. ${sayR}` },
    { t: wrong, mc: MC.swapped, say: `Test a number: try one between ${loH} and ${hiH}. ${sayR}` },
    { t: `${v} = ${loH} or ${v} = ${hiH}`, mc: MC.boundary, say: `The zeros are only the boundary. The inequality asks where the expression is ${rel === '<' || rel === '≤' ? 'below' : 'above'} 0 too.` },
    o.sqForm ? { t: `${v} ${RH(rel)} ±${hiH}`, mc: MC.pmBound, say: `"± ${hiH}" is not a bound. ${X}² ${RH(rel)} ${hi * hi} means ${right}.` }
      : { t: `${v} ${between ? L : G} ${hiH}`, mc: MC.likeLinear, say: `A quadratic changes sign at BOTH zeros: ${right}.` },
  ];
  const plane: PlanePic | undefined = o.proj ? undefined : (() => {
    const f = (x: number) => o.a * (x - lo) * (x - hi), vy = f((lo + hi) / 2);
    const xs = win(Math.min(lo, -1) - 1.5, Math.max(hi, 1) + 1.5, 10), ys = win(Math.min(vy, 0) - 1, Math.max(vy, 0) + Math.max(3, Math.abs(vy) * 0.6), 8);
    const band = between ? [{ lo, hi, loClosed: !strict, hiClosed: !strict }] : [{ lo: xs[0], hi: lo, loClosed: false, hiClosed: !strict }, { lo: hi, hi: xs[1], loClosed: !strict, hiClosed: false }];
    return { a: o.a, b: -o.a * (lo + hi), c: o.a * lo * hi, x: xs, y: ys, shown: false, reveal: { marks: [lo, hi], band } };
  })();
  return choiceItem(R, {
    id: `ineqSet-${n}`, family: 'ineqSet', prompt: `Solve ${o.htm}. Which is the solution set?`, board: o.tex,
    picture: plane ? { plane } : undefined,
    solution: [o.proj ? `Zero form: −16<i>t</i>² + ${o.b}<i>t</i> ${o.c < 0 ? '−' : '+'} ${Math.abs(o.c)} ${RH(o.zeroRel)} 0, zeros <i>t</i> = ${loH} and <i>t</i> = ${hiH}.` : `In zero form the zeros are ${v} = ${loH} and ${v} = ${hiH}.`, `Test a point between them and one outside: ${sayR}`],
  }, opts);
}

export const ineqSpecial: Gen = (R, n) => {
  const h = int(R, -4, 4), k = R() < 0.45 ? 0 : int(R, 1, 5), rel = pick(R, ['<', '≤', '>', '≥'] as Rel[]), negd = R() < 0.25, expanded = R() < 0.55;
  const b = -2 * h, c = h * h + k;
  // f(x) = (x − h)² + k  rel 0, shown either as is or as −f rel' 0
  const fT = expanded ? polyT(quadTerms(1, b, c)) : `(x ${h < 0 ? '+' : '-'} ${Math.abs(h)})^2${k ? ` + ${k}` : ''}`.replace('(x - 0)', 'x').replace('(x + 0)', 'x');
  const fH = expanded ? polyH(quadTerms(1, b, c)) : `${h === 0 ? X : `(${X} ${h < 0 ? '+' : '−'} ${Math.abs(h)})`}²${k ? ` + ${k}` : ''}`;
  const shownRel = negd ? flip(rel) : rel;
  const tex = negd ? `${polyT(quadTerms(-1, -b, -c))} ${relT[shownRel]} 0` : `${fT} ${relT[rel]} 0`;
  const htm = negd ? `${polyH(quadTerms(-1, -b, -c))} ${RH(shownRel)} 0` : `${fH} ${RH(rel)} 0`;
  const T = ['all real numbers', 'no real numbers (no solution)', `only ${X} = ${iH(h)}`, `all real numbers except ${X} = ${iH(h)}`];
  let k0: number;
  if (k > 0) k0 = rel === '>' || rel === '≥' ? 0 : 1;
  else k0 = rel === '>' ? 3 : rel === '≥' ? 0 : rel === '<' ? 1 : 2;
  const why = [
    `${k > 0 ? `(${X} − ${iH(h)})² + ${k} is always at least ${k}` : `(${X} − ${iH(h)})² is never negative`}, so ${rel === '>' || rel === '≥' ? 'every x works' : 'no x works'}.`,
  ][0]!;
  const sayFor = (i: number): [string | undefined, string] => {
    if (i === k0) return [undefined, `Yes. ${k === 0 ? (k0 === 3 ? `It is 0 at ${X} = ${iH(h)} and positive everywhere else.` : k0 === 2 ? `It is never negative, and 0 only at ${X} = ${iH(h)}.` : why) : why}`];
    if (k > 0 && k0 === 0 && i === 1) return [MC.noZerosNone, `No zeros does not mean no solution: the expression is positive EVERYWHERE, so every x works.`];
    if (k === 0 && k0 === 3 && i === 0) return [undefined, `At ${X} = ${iH(h)} the expression is 0, and 0 is not &gt; 0.`];
    if (k === 0 && k0 === 2 && i === 1) return [undefined, `At ${X} = ${iH(h)} the expression is 0, and 0 ≤ 0 is true.`];
    if (k === 0 && i === 2) return [MC.boundary, `${X} = ${iH(h)} is where it is 0. Check the other x too.`];
    return [undefined, `${k > 0 ? `The smallest value is ${k}, at ${X} = ${iH(h)}` : `The smallest value is 0, at ${X} = ${iH(h)}`}. Compare that with 0.`];
  };
  const opts: Opt[] = T.map((t, i) => { const [mc, say] = sayFor(i); return { t, ok: i === k0, mc, say }; });
  const vy = k;
  return choiceItem(R, {
    id: `ineqSpecial-${n}`, family: 'ineqSpecial', prompt: `Solve ${htm}.`, board: tex,
    picture: { plane: { a: negd ? -1 : 1, b: negd ? -b : b, c: negd ? -c : c, x: [-6, 6, 1], y: negd ? [-10, 2, 2] : [-2, 10, 2], shown: false, reveal: { marks: k === 0 ? [h] : [] } } },
    solution: [`${negd ? `Multiply by −1 and flip the sign: ${fH} ${RH(rel)} 0. ` : ''}${expanded ? `Complete the square: ${fH.replace(/^/, '')}.` : ''}`.trim() || `${fH} ${RH(rel)} 0.`, `${k > 0 ? `The smallest value is ${k}` : `The smallest value is 0, at ${X} = ${iH(h)}`}.`],
  }, opts, true);
};
void qAdd; void qMul; void qSub; void gcd; void squareFree; void roots; void rootsH; void uniq;
