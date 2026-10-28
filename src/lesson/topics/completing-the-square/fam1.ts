// fam1.ts: practice families for sub-goals 1-6 of "Solving quadratics": perfect squares, the completing term,
// completing the square (even b, odd b, a ≠ 1) and the quadratic formula. Pure: no DOM.
import { int, pick } from '../../runtime/item';
import { type Q, q, qAdd, qMul, qSub, qNeg, qVal, qEq, qT, qH, qL, iH, dH, iT, polyT, polyH, quadTerms, binT, binH, complete, roots, rootsH, surd, sameRoots, rootVals, disc, isSq, noTie, round, type Roots } from './quad';
import { MC, type Gen, type Opt, type SqPic, choiceItem, numItem, fracItem, pairItem, isSet, near, uniq, ans } from './common';

const X = '<i>x</i>';
const eqT = (a: Q | number, b: Q | number, c: Q | number, rhs: Q | number = 0) => `${polyT(quadTerms(a, b, c))} = ${typeof rhs === 'number' ? iT(rhs) : qT(rhs)}`;
const eqH = (a: Q | number, b: Q | number, c: Q | number, rhs: Q | number = 0, linear = false) => `${polyH(quadTerms(a, b, c), 'x', linear)} = ${typeof rhs === 'number' ? iH(rhs) : linear ? qL(rhs) : qH(rhs)}`;
const nz = (R: () => number, lo: number, hi: number) => { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } };
const sgnPick = (R: () => number) => (R() < 0.5 ? -1 : 1);
/** a sign, positive two times in three (a positive h has the area picture) */
const up = (R: () => number) => (R() < 0.67 ? 1 : -1);
const xT = (c: Q) => (qEq(c, q(1)) ? 'x' : `${qT(c)}x`);
/** the area picture for x² + 2h·x (h > 0) */
export function sqPic(h: Q, steps: SqPic['steps'], reveal: SqPic['steps'], o: { hideCorner?: boolean; halfT?: string; revealHalf?: boolean } = {}): SqPic | undefined {
  if (h[0] <= 0) return undefined;
  const half = xT(h);
  return {
    hT: qT(h), stripT: o.halfT ? o.halfT : xT(qMul(h, q(2))), halfT: o.halfT ?? half, cornerT: qT(qMul(h, h)), sideT: `x + ${qT(h)}`,
    steps, hideCorner: o.hideCorner, reveal: { steps: reveal, halfT: o.revealHalf ? half : undefined, stripT: o.revealHalf ? xT(qMul(h, q(2))) : undefined },
  };
}
const ALL: SqPic['steps'] = ['sq', 'strip', 'halve', 'corner', 'fill', 'side'];

// =============== 1. perfect-square trinomial ===============
/** h: integer −6..6 (not 0), and a fractional h (±1/2, ±3/2) about one time in seven */
function pickH(R: () => number): Q { return R() < 0.15 ? q(pick(R, [1, 3]) * sgnPick(R), 2) : q(nz(R, -6, 6)); }

export const pstSpot: Gen = (R, n) => {
  const h = pickH(R), h2 = qMul(h, h), b = qMul(h, q(2)), vv = pick(R, ['x', 'y', 't', 'n', 'm', 'z', 'w', 'k']), Vv = `<i>${vv}</i>`, ph = int(R, 0, 1);
  const wrongC = qEq(h2, q(1, 4)) || qEq(h2, q(9, 4)) ? qAdd(h2, q(2)) : qAdd(h2, q(pick(R, [-3, -2, 2, 3, 5, 7].filter(d => h2[0] / h2[1] + d > 0))));
  const P = (bb: Q, cc: Q) => polyH([[1, 2], [bb, 1], [cc, 0]], vv, true);
  const right = P(b, h2);
  const opts: Opt[] = uniq([
    { t: right, ok: true, say: `Yes: the middle term is 2 · ${qL(h)} · ${Vv} and the last term is (${qL(h)})² = ${qL(h2)}, so it is (${binH(h, vv, true)})².` },
    { t: P(h, h2), mc: MC.unchecked, say: `The last term fits (${qL(h)})², but the middle term must be 2 · ${qL(h)} = ${qL(b)}, not ${qL(h)}. Check 2h too.` },
    { t: P(q(0), h2), mc: MC.sumsPart, say: `(${binH(h, 'x', true)})² is not ${X}² + ${qL(h2)}: the two strips 2 · ${qL(h)}${X} are missing.` },
    { t: P(b, wrongC), say: `The middle term ${qL(b)}${X} needs h = ${qL(h)}, and then the last term must be ${qL(h2)}, not ${qL(wrongC)}.` },
    { t: P(b, qNeg(h2)), say: `A square's last term is h², never negative: ${qL(qNeg(h2))} can't be (${qL(h)})².` },
  ]);
  const four = [opts[0]!, ...opts.slice(1).sort(() => R() - 0.5).slice(0, 3)];
  return choiceItem(R, {
    id: `pstSpot-${n}`, family: 'pstSpot', prompt: ph ? `Which one is a perfect-square trinomial, equal to (${Vv} + <i>h</i>)² for some number <i>h</i>?` : `Only one of these can be written as (${Vv} + <i>h</i>)². Which one?`,
    board: `(${vv} + h)^2 = ${vv}^2 + 2h${vv} + h^2`,
    solution: [`A perfect square (${Vv} + <i>h</i>)² has middle term 2<i>h</i>${Vv} and last term <i>h</i>².`, `Only ${right}: half of ${qL(b)} is ${qL(h)}, and (${qL(h)})² = ${qL(h2)}.`],
  }, four);
};

export const pstWrite: Gen = (R, n) => {
  const h = pickH(R), b = qMul(h, q(2)), h2 = qMul(h, h);
  const hv = qVal(h);
  return numItem({
    id: `pstWrite-${n}`, family: 'pstWrite', prompt: `Write ${polyH([[1, 2], [b, 1], [h2, 0]])} as (${X} + <i>h</i>)². What is <i>h</i>?${h[1] !== 1 ? ' (A decimal is fine.)' : ''}`,
    board: `${polyT([[1, 2], [b, 1], [h2, 0]])} = (x + h)^2`,
    solution: [`The middle term ${qL(b)}${X} is 2<i>h</i>${X}, so <i>h</i> = ${qL(b)} ÷ 2 = ${qL(h)}.`, `Check: (${qL(h)})² = ${qL(h2)}, the last term. ✓ So <i>h</i> = ${ans(dH(hv))}.`],
  }, hv, v => {
    if (near(v, hv)) return { ok: true, say: `Yes: (${binH(h, 'x', true)})² = ${polyH([[1, 2], [b, 1], [h2, 0]], 'x', true)}.` };
    if (near(v, -hv)) return { ok: false, mc: MC.detached, say: `Watch the sign: the middle term is ${qL(b)}${X}, so 2<i>h</i> = ${qL(b)} and <i>h</i> = ${qL(h)}.` };
    if (near(v, 2 * hv)) return { ok: false, say: `${qL(b)} is 2<i>h</i>, the two strips together. <i>h</i> is half of it: ${qL(h)}.` };
    if (near(v, qVal(h2))) return { ok: false, say: `${qL(h2)} is <i>h</i>², not <i>h</i>. Take half the middle coefficient: ${qL(h)}.` };
    return { ok: false, say: `<i>h</i> is half the middle coefficient: ${qL(b)} ÷ 2.` };
  });
};

export const pstMiddle: Gen = (R, n) => {
  const h = q(int(R, 1, 8) * up(R)), b = qMul(h, q(2)), h2 = qMul(h, h), bv = qVal(b);
  return numItem({
    id: `pstMiddle-${n}`, family: 'pstMiddle', prompt: `${X}² + ▢${X} + ${qL(h2)} is the perfect square (${binH(h)})². What is the missing middle coefficient?`,
    board: `x^2 + \\square\\, x + ${qT(h2)} = (${binT(h)})^2`,
    picture: { sq: sqPic(h, ['sq', 'strip', 'halve', 'fill', 'side'], ALL, { halfT: '?\\,x', revealHalf: true }) },
    solution: [`(${binH(h)})² is ${X}², two strips of ${qL(h)}${X}, and the corner (${qL(h)})² = ${qL(h2)}.`, `The two strips together: 2 · ${h[0] < 0 ? `(${qL(h)})` : qL(h)} = ${ans(dH(bv))}, so the middle term is ${qL(b)}${X}.`],
  }, bv, v => {
    if (near(v, bv)) return { ok: true, say: `Yes: two strips of ${qL(h)}${X} make ${qL(b)}${X}.` };
    if (near(v, qVal(h))) return { ok: false, mc: MC.unchecked, say: `That is one strip. (${binH(h)})² has TWO strips of ${qL(h)}${X}: the middle term is 2 · ${qL(h)}.` };
    if (near(v, -bv)) return { ok: false, mc: MC.detached, say: `Check the sign: (${binH(h)})² has middle term 2 · (${qL(h)})${X}.` };
    return { ok: false, say: `The middle term of (${X} + <i>h</i>)² is 2<i>h</i>${X}. Here <i>h</i> = ${qL(h)}.` };
  });
};

// =============== 2. the completing term ===============
export const fillTerm: Gen = (R, n) => {
  const b = 2 * int(R, 1, 6) * up(R), h = q(b / 2), t = (b / 2) ** 2;
  return numItem({
    id: `fillTerm-${n}`, family: 'fillTerm', prompt: R() < 0.5 ? `What number completes ${polyH([[1, 2], [b, 1]])} + ▢ to a perfect square?` : `Which constant makes ${polyH([[1, 2], [b, 1]])} + ▢ a perfect-square trinomial?`,
    board: `${polyT([[1, 2], [b, 1]])} + \\square`,
    picture: { sq: sqPic(h, ['sq', 'strip', 'halve', 'corner'], ALL) },
    solution: [`Half of ${iH(b)} is ${iH(b / 2)}: the strip splits into two strips of ${iH(Math.abs(b / 2))}${X}.`, `The missing corner is (${iH(b / 2)})² = ${ans(t)}, and ${polyH([[1, 2], [b, 1], [t, 0]])} = (${binH(h)})².`],
  }, t, v => {
    if (v === t) return { ok: true, say: `Yes: (${iH(b / 2)})² = ${t}, and the square is (${binH(h)})².` };
    if (v === b / 2 || v === Math.abs(b / 2)) return { ok: false, mc: MC.wrongTerm, say: `${iH(b / 2)} is half of ${iH(b)}, the side of the corner. The corner's AREA is its square: (${iH(b / 2)})².` };
    if (v === b * b || v === Math.abs(2 * b)) return { ok: false, mc: MC.incomplete, say: `The completing term is (b/2)²: halve ${iH(b)} first, then square. Not ${v}.` };
    if (v === -t) return { ok: false, say: `A square of a number is never negative: (${iH(b / 2)})² = ${t}.` };
    return { ok: false, say: `Halve the ${X}-coefficient, then square it: (${iH(b)} ÷ 2)².` };
  });
};

export const fillPair: Gen = (R, n) => {
  const b = 2 * int(R, 1, 6) * up(R), hv = b / 2, t = hv * hv, s = hv < 0 ? '−' : '+', a = Math.abs(hv);
  return pairItem({
    id: `fillPair-${n}`, family: 'fillPair', prompt: R() < 0.5 ? `Complete the square on ${polyH([[1, 2], [b, 1]])}: fill in both boxes so the two sides are equal.` : `Fill in both boxes: ${polyH([[1, 2], [b, 1]])} + ▢ = (${X} ${s} ▢)².`,
    board: `${polyT([[1, 2], [b, 1]])} + \\square = (x ${hv < 0 ? '-' : '+'} \\square)^2`,
    picture: { sq: sqPic(q(hv), ['sq', 'strip', 'halve', 'corner'], ALL) },
    solution: [`The side of the corner is half of ${iH(Math.abs(b))}: ${a}.`, `Its area is ${a}² = ${t}: ${polyH([[1, 2], [b, 1]])} + ${ans(t)} = (${X} ${s} ${ans(a)})².`],
  }, t, a, `${polyH([[1, 2], [b, 1]])} +`, ` = (${X} ${s}`, ')²', (u, w) => {
    if (u === t && w === a) return { ok: true, say: `Yes: ${polyH([[1, 2], [b, 1], [t, 0]])} = (${X} ${s} ${a})².` };
    if (u === a && w === a) return { ok: false, mc: MC.wrongTerm, say: `${a} is the side of the corner; the number added is its area, ${a}² = ${t}.` };
    if (u === b * b || u === 2 * Math.abs(b)) return { ok: false, mc: MC.incomplete, say: `Halve ${iH(b)} first, then square: (${a})² = ${t}.` };
    if (u === t && w === -a) return { ok: false, mc: MC.detached, say: `The sign is already written outside the box: (${X} ${s} ${a})².` };
    return { ok: false, say: `Half of ${iH(b)} is the side of the corner; its square is the number to add.` };
  });
};

// =============== 3. complete the square, even b ===============
interface EvenEq { h: number; c: number; shape: 'zero' | 'moved' }
function evenEq(R: () => number, rhsKind: 'int' | 'any'): EvenEq & { rhs: number } {
  for (;;) {
    const h = int(R, 1, 6) * up(R);
    let rhs: number;
    if (rhsKind === 'int') rhs = int(R, 1, 9) ** 2;
    else { const k = R(); rhs = k < 0.55 ? pick(R, [2, 3, 5, 6, 7, 8, 10, 11, 12, 13]) : k < 0.75 ? int(R, 1, 8) ** 2 : k < 0.87 ? 0 : -int(R, 1, 6); }
    const c = h * h - rhs;
    if (c === 0 || Math.abs(c) > 60) continue;
    return { h, c, rhs, shape: R() < 0.5 ? 'zero' : 'moved' };
  }
}
const evenShow = (e: EvenEq) => (e.shape === 'zero'
  ? { t: eqT(1, 2 * e.h, e.c), html: eqH(1, 2 * e.h, e.c) }
  : { t: `${polyT([[1, 2], [2 * e.h, 1]])} = ${iT(-e.c)}`, html: `${polyH([[1, 2], [2 * e.h, 1]])} = ${iH(-e.c)}` });

export const csRhs: Gen = (R, n) => {
  const e = evenEq(R, 'any'), { h, c, rhs } = e, E = evenShow(e), H = q(h);
  const k = -c;   // x² + bx = k
  return numItem({
    id: `csRhs-${n}`, family: 'csRhs', prompt: `Complete the square: ${E.html} becomes (${binH(H)})² = ▢. What number goes in the box?`,
    board: E.t,
    picture: { sq: sqPic(H, ['sq', 'strip', 'halve', 'corner'], ALL) },
    solution: [
      ...(e.shape === 'zero' ? [`Move the constant first: ${polyH([[1, 2], [2 * h, 1]])} = ${iH(k)}.`] : []),
      `Half of ${iH(2 * h)} is ${iH(h)}; add (${iH(h)})² = ${h * h} to BOTH sides: ${polyH([[1, 2], [2 * h, 1], [h * h, 0]])} = ${iH(k)} + ${h * h}.`,
      `So (${binH(H)})² = ${ans(iH(rhs))}.`,
    ],
  }, rhs, v => {
    if (v === rhs) return { ok: true, say: `Yes: ${iH(k)} + ${h * h} = ${iH(rhs)}.` };
    if (v === k) return { ok: false, mc: MC.unbalanced, say: `${h * h} went into the left side to make the square, so it must go into the right side too: ${iH(k)} + ${h * h}.` };
    if (e.shape === 'zero' && v === h * h + c) return { ok: false, mc: MC.detached, say: `Moving ${iH(c)} to the other side changes its sign: ${polyH([[1, 2], [2 * h, 1]])} = ${iH(k)}. Then add ${h * h}.` };
    if (v === h * h) return { ok: false, say: `Keep the number that was already on the right: ${iH(k)} + ${h * h}.` };
    return { ok: false, say: `Get ${polyH([[1, 2], [2 * h, 1]])} alone, then add (${iH(h)})² = ${h * h} to both sides.` };
  });
};

export const csSolve: Gen = (R, n) => {
  const e = evenEq(R, 'int'), { h, c, rhs } = e, E = evenShow(e), H = q(h), s = Math.sqrt(rhs);
  const r1 = -h + s, r2 = -h - s;
  const ub = -c;   // unbalanced: (x + h)² = −c
  return pairItem({
    id: `csSolve-${n}`, family: 'csSolve', prompt: `Solve by completing the square: ${E.html}. (The two solutions in either order.)`,
    board: E.t,
    picture: { sq: sqPic(H, ['sq', 'strip', 'halve'], ALL) },
    solution: [
      `Add (${iH(h)})² = ${h * h} to both sides: (${binH(H)})² = ${iH(rhs)}.`,
      `Square roots: ${binH(H)} = ${s} or ${binH(H)} = −${s}.`,
      `So ${X} = ${ans(iH(r1))} or ${X} = ${ans(iH(r2))}.`,
    ],
  }, r1, r2, `${X} =`, ` or ${X} =`, '', (u, w) => {
    if (isSet(u, w, r1, r2)) return { ok: true, say: `Yes: ${X} = ${iH(r1)} or ${X} = ${iH(r2)}. Both check in ${E.html}.` };
    if (isSet(u, w, s, -s)) return { ok: false, mc: MC.forgetsH, say: `${s} and −${s} are the values of ${binH(H)}, not of ${X}. ${h > 0 ? 'Subtract' : 'Add'} ${Math.abs(h)} from each.` };
    if (isSet(u, w, h + s, h - s)) return { ok: false, mc: MC.detached, say: `${binH(H)} = ±${s}: to undo the ${h > 0 ? '+' : '−'} ${Math.abs(h)}, ${h > 0 ? 'subtract' : 'add'} it, so ${X} = ${iH(-h)} ± ${s}.` };
    if ((near(u, r1) && near(w, r1)) || (near(u, r2) && near(w, r2))) return { ok: false, mc: MC.onlyPos, say: `Both ${s} and −${s} square to ${rhs}, so there are two solutions: ${iH(r1)} and ${iH(r2)}.` };
    if (ub > 0 && isSq(ub) && isSet(u, w, -h + Math.sqrt(ub), -h - Math.sqrt(ub))) return { ok: false, mc: MC.unbalanced, say: `The ${h * h} added on the left must be added on the right too: (${binH(H)})² = ${iH(rhs)}.` };
    if (near(u, r1) || near(u, r2) || near(w, r1) || near(w, r2)) return { ok: false, say: `One is right. The other comes from the other square root: ${binH(H)} = ±${s}.` };
    return { ok: false, say: `Make (${binH(H)})² = ${iH(rhs)} first, then take both square roots.` };
  });
};

export const csExact: Gen = (R, n) => {
  const e = evenEq(R, 'any'), { h, c, rhs } = e, E = evenShow(e), H = q(h);
  const right = roots(1, 2 * h, c);
  const opts: Opt[] = [{ t: rootsH(right), ok: true, say: `Yes: (${binH(H)})² = ${iH(rhs)}${rhs < 0 ? ', and no real number squared is negative' : rhs === 0 ? `, so ${binH(H)} = 0` : `, so ${binH(H)} = ±√${rhs}`}.` }];
  const add = (r: Roots | string, mc: string | undefined, say: string) => {
    const t = typeof r === 'string' ? r : rootsH(r);
    if (typeof r !== 'string' && sameRoots(r, right)) return;
    if (opts.some(o => o.t === t)) return;
    opts.push({ t, mc, say });
  };
  if (rhs > 0) {
    add(surd(h, 1, rhs, 1), undefined, `${binH(H)} = ±√${rhs}, so ${X} = ${iH(-h)} ± √${rhs}: undo the ${h > 0 ? '+' : '−'} ${Math.abs(h)} with its opposite.`);
    add(surd(0, 1, rhs, 1), MC.forgetsH, `±√${rhs} is the value of ${binH(H)}. One more step: ${h > 0 ? 'subtract' : 'add'} ${Math.abs(h)}.`);
    const one = rootVals(right)[1]!;
    if (right.kind === 'surd') add(`${X} = ${iH(right.P)} + ${right.K === 1 ? '' : right.K}√<u class="rb">${right.m}</u> only`, MC.onlyPos, `−√${rhs} squares to ${rhs} as well: there is a second solution.`);
    else if (right.kind === 'rat') add(`${X} = ${qL(right.x2)} only`, MC.onlyPos, `−${Math.sqrt(rhs)} squares to ${rhs} as well: there is a second solution.`);
    void one;
    if (-c > 0) add(surd(-h, 1, -c, 1), MC.unbalanced, `The ${h * h} added on the left must be added on the right too: (${binH(H)})² = ${iH(rhs)}.`);
    if (h * h + c > 0) add(surd(-h, 1, h * h + c, 1), MC.detached, `Moving ${iH(c)} across changes its sign: the right side is ${iH(-c)} + ${h * h} = ${iH(rhs)}.`);
  } else if (rhs === 0) {
    add(`${X} = ${iH(-h)} or ${X} = ${iH(h)}`, MC.repeatTwo, `(${binH(H)})² = 0 only when ${binH(H)} = 0: one solution, ${iH(-h)}.`);
    add('no real solutions', MC.zeroNone, `0 has a square root, 0 itself: ${binH(H)} = 0 gives ${X} = ${iH(-h)}.`);
    add(`${X} = ${iH(h)} only`, undefined, `${binH(H)} = 0 gives ${X} = ${iH(-h)}.`);
  } else {
    add(surd(-h, 1, -rhs, 1), MC.everyReal, `(${binH(H)})² = ${iH(rhs)} is negative, and no real number squared is negative. Dropping the minus sign changes the equation.`);
    add(`${X} = ${iH(-h)} only`, undefined, `${X} = ${iH(-h)} makes the left side 0, not ${iH(rhs)}.`);
    add(surd(h, 1, -rhs, 1), MC.everyReal, `A square can't be ${iH(rhs)}: there is no real solution.`);
    if (h * h + c > 0) add(surd(-h, 1, h * h + c, 1), MC.detached, `Moving ${iH(c)} across changes its sign: the right side is ${iH(-c)} + ${h * h} = ${iH(rhs)}.`);
  }
  const four = [opts[0]!, ...opts.slice(1).sort(() => R() - 0.5).slice(0, 3)];
  return choiceItem(R, {
    id: `csExact-${n}`, family: 'csExact', prompt: `Solve ${E.html} by completing the square. Which gives the exact solutions?`, board: E.t,
    picture: { sq: sqPic(H, ['sq', 'strip', 'halve'], ALL) },
    solution: [`Add (${iH(h)})² = ${h * h} to both sides: (${binH(H)})² = ${iH(rhs)}.`, rhs > 0 ? `${binH(H)} = ±√${rhs}, so ${rootsH(right)}.` : rhs === 0 ? `${binH(H)} = 0, so ${X} = ${iH(-h)}: one solution.` : `No real number squared is ${iH(rhs)}: no real solutions.`],
  }, four);
};

// =============== 4. complete the square, half of b a fraction ===============
function oddB(R: () => number): Q { return R() < 0.18 ? q(pick(R, [1, 3]) * sgnPick(R), 2) : q(pick(R, [1, 3, 5, 7, 9]) * up(R)); }

export const oddTerm: Gen = (R, n) => {
  const b = oddB(R), h = qMul(b, q(1, 2)), t = qMul(h, h);
  const P = polyH([[1, 2], [b, 1]]);
  return fracItem({
    id: `oddTerm-${n}`, family: 'oddTerm', prompt: `What number completes ${P} + ▢ to a perfect square? Give it as an exact fraction.`,
    board: `${polyT([[1, 2], [b, 1]])} + \\square`,
    picture: { sq: sqPic(h, ['sq', 'strip', 'halve', 'corner'], ALL) },
    solution: [`Half of ${qL(b)} is ${qL(h)}.`, `Square it, top AND bottom: (${qL(h)})² = ${ans(qL(t))}. So ${P} + ${qH(t)} = (${binH(h)})².`],
  }, t, v => {
    if (qEq(v, t)) return { ok: true, say: `Yes: (${qL(h)})² = ${qL(t)}.` };
    if (qEq(v, h) || qEq(v, qNeg(h))) return { ok: false, mc: MC.wrongTerm, say: `${qL(h)} is half of ${qL(b)}. The corner's area is its square: (${qL(h)})².` };
    if (qEq(v, q(h[0] * h[0], h[1]))) return { ok: false, mc: MC.oneFactor, say: `Square the denominator too: (${qL(h)})² = ${h[0] * h[0]}/${h[1] * h[1]}.` };
    if (qEq(v, qMul(b, b))) return { ok: false, mc: MC.incomplete, say: `Halve ${qL(b)} first, then square.` };
    return { ok: false, say: `Halve the ${X}-coefficient, then square the fraction.` };
  });
};

export const oddRhs: Gen = (R, n) => {
  for (;;) {
    const b = q(pick(R, [1, 3, 5, 7]) * up(R)), c = q(nz(R, -6, 6)), h = qMul(b, q(1, 2)), t = qMul(h, h), rhs = qSub(t, c);
    if (rhs[0] <= 0) continue;
    const E = eqH(1, b, c);
    return fracItem({
      id: `oddRhs-${n}`, family: 'oddRhs', prompt: `Complete the square: ${E} becomes (${binH(h)})² = ▢. What exact number goes in the box?`,
      board: eqT(1, b, c),
      picture: { sq: sqPic(h, ['sq', 'strip', 'halve', 'corner'], ALL) },
      solution: [`Move the constant: ${polyH([[1, 2], [b, 1]])} = ${qL(qNeg(c))}.`, `Add (${qL(h)})² = ${qL(t)} to both sides: ${qL(qNeg(c))} + ${qL(t)} = ${ans(qL(rhs))}.`],
    }, rhs, v => {
      if (qEq(v, rhs)) return { ok: true, say: `Yes: (${binH(h, 'x', true)})² = ${qL(rhs)}.` };
      if (qEq(v, qNeg(c))) return { ok: false, mc: MC.unbalanced, say: `${qL(t)} went into the left side, so it goes into the right side too.` };
      if (qEq(v, qAdd(t, c))) return { ok: false, mc: MC.detached, say: `Moving ${qL(c)} across changes its sign: the right side starts as ${qL(qNeg(c))}.` };
      if (qEq(v, qSub(q(h[0] * h[0], h[1]), c))) return { ok: false, mc: MC.oneFactor, say: `(${qL(h)})² = ${qL(t)}: square the denominator too.` };
      return { ok: false, say: `Move the constant, then add (${qL(h)})² = ${qL(t)} to both sides.` };
    });
  }
};

export const oddSolve: Gen = (R, n) => {
  for (;;) {
    const b = pick(R, [1, 3, 5, 7]) * up(R), c = nz(R, -8, 6), D = b * b - 4 * c;
    if (D <= 0 || isSq(D)) continue;
    const right = roots(1, b, c), h = q(b, 2), rhs = q(D, 4);
    const rv = rootVals(right);
    const opts: Opt[] = [{ t: rootsH(right), ok: true, say: `Yes: (${binH(h, 'x', true)})² = ${qL(rhs)}, and √(${qL(rhs)}) = √${D}/2.` }];
    const push = (r: Roots | string, mc: string | undefined, say: string) => { const t = typeof r === 'string' ? r : rootsH(r); if ((typeof r !== 'string' && sameRoots(r, right)) || opts.some(o => o.t === t)) return; opts.push({ t, mc, say }); };
    push(surd(b, 1, D, 2), undefined, `${binH(h, 'x', true)} = ±√${D}/2: undo the ${b > 0 ? '+' : '−'} ${Math.abs(b)}/2 with its opposite.`);
    push(`${X} = ${qL(qNeg(h))} ± √<u class="rb">${D}</u>`, MC.oneFactor, `√(${D}/4) is √${D} ÷ √4 = √${D}/2: the root of the denominator counts too.`);
    push(`${X} ≈ ${dH(round(qVal(qNeg(h)), 1))} ± ${round(Math.sqrt(D) / 2, 1)}`, MC.rounded, `Exact means no rounding: keep √${D}/2, not a decimal.`);
    push(surd(-b, 1, D, 4), undefined, `√(${D}/4) = √${D}/2, so the denominator is 2.`);
    void rv;
    const four = [opts[0]!, ...opts.slice(1).sort(() => R() - 0.5).slice(0, 3)];
    return choiceItem(R, {
      id: `oddSolve-${n}`, family: 'oddSolve', prompt: `Solve ${eqH(1, b, c)} by completing the square. Which gives the exact solutions?`, board: eqT(1, b, c),
      picture: { sq: sqPic(h, ['sq', 'strip', 'halve'], ALL) },
      solution: [`Add (${qL(h)})² = ${b * b}/4 to both sides: (${binH(h, 'x', true)})² = ${qL(rhs)}.`, `${binH(h, 'x', true)} = ±√${D}/2, so ${rootsH(right)}.`],
    }, four);
  }
};

// =============== 5. a ≠ 1: divide every term by a first ===============
function nmEq(R: () => number): { a: number; b: number; c: number } {
  for (;;) {
    const a = R() < 0.25 ? -pick(R, [1, 2, 3]) : int(R, 2, 6), m = int(R, 1, 5) * up(R), c = nz(R, -9, 9);
    if (c % a === 0 && R() < 0.6) continue;   // mostly c/a a fraction
    return { a, b: a * m, c };
  }
}
export const nmDivide: Gen = (R, n) => {
  const { a, b, c } = nmEq(R);
  const P = (bb: Q | number, cc: Q | number) => `${polyH([[1, 2], [bb, 1], [cc, 0]], 'x', true)} = 0`;
  const right = P(q(b, a), q(c, a));
  const opts: Opt[] = uniq([
    { t: right, ok: true, say: `Yes: every term divided by ${iH(a)}, signs and all.` },
    { t: P(b, c), mc: MC.notDivA, say: `Only the ${X}² term was divided. Divide EVERY term by ${iH(a)}, or the equation changes.` },
    { t: P(q(b, a), c), mc: MC.someTerms, say: `The constant ${iH(c)} must be divided by ${iH(a)} too: ${qL(q(c, a))}.` },
    { t: P(b, q(c, a)), mc: MC.someTerms, say: `The ${X}-term must be divided by ${iH(a)} too: ${qL(q(b, a))}${X}.` },
    ...(a < 0 ? [{ t: P(q(b, -a), q(c, -a)), mc: MC.someTerms, say: `Dividing by ${iH(a)} flips every sign, not only the ${X}² term.` }] : []),
  ]).filter((o, i) => i === 0 || o.t !== right);
  const four = [opts[0]!, ...opts.slice(1).sort(() => R() - 0.5).slice(0, 3)];
  return choiceItem(R, {
    id: `nmDivide-${n}`, family: 'nmDivide', prompt: `To complete the square on ${eqH(a, b, c)}, first divide every term by ${iH(a)}. Which equation do you get?`, board: eqT(a, b, c),
    solution: [`Divide each term by ${iH(a)}: ${iH(a)}${X}² ÷ ${iH(a)} = ${X}², ${iH(b)}${X} ÷ ${iH(a)} = ${polyH([[q(b, a), 1]], 'x', true)}, ${iH(c)} ÷ ${iH(a)} = ${qL(q(c, a))}.`],
  }, four);
};

export const nmTerm: Gen = (R, n) => {
  const { a, b, c } = nmEq(R), ba = q(b, a), h = qMul(ba, q(1, 2)), t = qMul(h, h);
  return fracItem({
    id: `nmTerm-${n}`, family: 'nmTerm', prompt: `Solve ${eqH(a, b, c)} by completing the square. After dividing every term by ${iH(a)}, what number do you add to both sides? (Exact.)`,
    board: eqT(a, b, c),
    picture: { sq: sqPic(h, ['sq', 'strip', 'halve', 'corner'], ALL) },
    solution: [`Divide by ${iH(a)}: ${eqH(1, ba, q(c, a))}.`, `Half of ${qL(ba)} is ${qL(h)}; add (${qL(h)})² = ${ans(qL(t))} to both sides.`],
  }, t, v => {
    if (qEq(v, t)) return { ok: true, say: `Yes: half of ${qL(ba)} is ${qL(h)}, squared ${qL(t)}.` };
    if (qEq(v, q(b * b, 4))) return { ok: false, mc: MC.notDivA, say: `That completes ${X}² + ${iH(b)}${X}. After dividing by ${iH(a)} the ${X}-coefficient is ${qL(ba)}: use half of THAT.` };
    if (qEq(v, h) || qEq(v, qNeg(h))) return { ok: false, mc: MC.wrongTerm, say: `${qL(h)} is half the coefficient; the number added is its square.` };
    if (qEq(v, qMul(t, q(a)))) return { ok: false, say: `After dividing, the leading coefficient is 1: add just (${qL(h)})² = ${qL(t)}.` };
    return { ok: false, say: `Divide by ${iH(a)} first, then halve the ${X}-coefficient and square it.` };
  });
};

export const nmSolve: Gen = (R, n) => {
  for (;;) {
    const { a, b, c } = nmEq(R), D = disc(a, b, c);
    if (D <= 0) continue;
    const right = roots(a, b, c), ba = q(b, a), h = qMul(ba, q(1, 2));
    const rhs = q(D, 4 * a * a);
    const opts: Opt[] = [{ t: rootsH(right), ok: true, say: `Yes: (${binH(h, 'x', true)})² = ${qL(rhs)}, then both square roots.` }];
    const push = (r: Roots, mc: string | undefined, say: string) => { if (r.kind === 'none' || sameRoots(r, right)) return; const t = rootsH(r); if (opts.some(o => o.t === t)) return; opts.push({ t, mc, say }); };
    push(roots(a, b, a * c), MC.someTerms, `Every term is divided by ${iH(a)}, the constant too: ${qL(q(c, a))}.`);
    push(roots(1, b, c), MC.notDivA, `Divide by ${iH(a)} first: the ${X}-coefficient becomes ${qL(ba)}.`);
    push(roots(a, -b, c), undefined, `${binH(h, 'x', true)} = ±…: undo the ${qL(h)} with its opposite.`);
    push(roots(a, b, -c), MC.detached, `Moving ${qL(q(c, a))} across changes its sign.`);
    if (opts.length < 3) continue;
    const pickd = [opts[0]!, ...opts.slice(1).sort(() => R() - 0.5).slice(0, 3)];
    return choiceItem(R, {
      id: `nmSolve-${n}`, family: 'nmSolve', prompt: `Solve ${eqH(a, b, c)} by completing the square (divide by ${iH(a)} first). Which gives the exact solutions?`, board: eqT(a, b, c),
      solution: [`Divide by ${iH(a)}: ${eqH(1, ba, q(c, a), 0, true)}.`, `Complete the square: (${binH(h, 'x', true)})² = ${qL(rhs)}.`, `Take both square roots and subtract ${qL(h)}: ${rootsH(right)}.`],
    }, pickd);
  }
};

// =============== 6. the quadratic formula ===============
function abc(R: () => number): { a: number; b: number; c: number } {
  for (;;) { const a = nz(R, -4, 5), b = nz(R, -9, 9), c = nz(R, -9, 9); if (Math.abs(a) <= 5) return { a, b, c }; }
}
export const readABC: Gen = (R, n) => {
  const { a, b, c } = abc(R);
  const lay = pick(R, ['bx+ax2=c', 'ax2=bx+c', 'ax2+c=bx', 'k'] as const);
  const k = nz(R, -6, 6);
  const T = (terms: [number, number][]) => polyT(terms), Hh = (terms: [number, number][]) => polyH(terms);
  let L: [number, number][], Rr: [number, number][], bRead: number, cRead: number;
  if (lay === 'bx+ax2=c') { L = [[b, 1], [a, 2]]; Rr = [[-c, 0]]; bRead = b; cRead = -c; }
  else if (lay === 'ax2=bx+c') { L = [[a, 2]]; Rr = [[-b, 1], [-c, 0]]; bRead = -b; cRead = -c; }
  else if (lay === 'ax2+c=bx') { L = [[a, 2], [c, 0]]; Rr = [[-b, 1]]; bRead = -b; cRead = c; }
  else { L = [[a, 2], [b, 1], [c + k, 0]]; Rr = [[k, 0]]; bRead = b; cRead = c + k; }
  // the left side's x-term order as written: polyT keeps the given order (bx first in the first layout)
  const lt = L.map(([cf, pw]) => [cf, pw] as [number, number]);
  const tex = `${T(lt)} = ${T(Rr)}`, htm = `${Hh(lt)} = ${Hh(Rr)}`;
  return pairItem({
    id: `readABC-${n}`, family: 'readABC', prompt: `Move every term of ${htm} to the left side (keep the left side's terms as they are) to get <i>a</i>${X}² + <i>b</i>${X} + <i>c</i> = 0. What are <i>b</i> and <i>c</i>?`,
    board: tex,
    solution: [`Subtract the right side from both sides: ${eqH(a, b, c)}.`, `So <i>b</i> = ${ans(b)} and <i>c</i> = ${ans(c)}.`],
  }, b, c, '<i>b</i> =', ', <i>c</i> =', '', (u, w) => {
    if (u === b && w === c) return { ok: true, say: `Yes: ${eqH(a, b, c)}.` };
    if (u === bRead && w === cRead) return { ok: false, mc: MC.abcFirst, say: `Read a, b, c only after everything is on one side: a term that moves across changes its sign.` };
    if (u === c && w === b) return { ok: false, mc: MC.shifted, say: `<i>b</i> goes with ${X}, <i>c</i> is the number alone.` };
    if (u === -b && w === -c) return { ok: false, mc: MC.detached, say: `Keep the left side's terms as they are: <i>a</i> = ${iH(a)}, and every term moved from the right changes sign.` };
    return { ok: false, say: `Bring every term to the left, changing the sign of each term that moves: ${eqH(a, b, c)}.` };
  });
};

export const discVal: Gen = (R, n) => {
  const { a, b, c } = abc(R), D = disc(a, b, c);
  const bb = b < 0 ? `(${iH(b)})²` : `${b}²`, ac = `4(${iH(a)})(${iH(c)})`;
  return numItem({
    id: `discVal-${n}`, family: 'discVal', prompt: `For ${eqH(a, b, c)}, what is <i>b</i>² − 4<i>ac</i>?`, board: `${eqT(a, b, c)} \\qquad b^2 - 4ac = \\,?`,
    solution: [`<i>a</i> = ${iH(a)}, <i>b</i> = ${iH(b)}, <i>c</i> = ${iH(c)}.`, `${bb} − ${ac} = ${b * b} − ${a * c < 0 ? `(${iH(4 * a * c)})` : 4 * a * c} = ${ans(iH(D))}.`],
  }, D, v => {
    if (v === D) return { ok: true, say: `Yes: ${b * b} − ${a * c < 0 ? `(${iH(4 * a * c)})` : 4 * a * c} = ${iH(D)}.` };
    if (v === -b * b - 4 * a * c) return { ok: false, mc: MC.negSub, say: `Square the whole ${iH(b)}, sign and all: ${bb} = ${b * b}.` };
    if (v === b * b + 4 * a * c) return a * c > 0 ? { ok: false, mc: MC.discAdd, say: `It is b² MINUS 4ac: ${b * b} − ${4 * a * c}.` } : { ok: false, mc: MC.detached, say: `4ac = ${ac} = ${iH(4 * a * c)} (negative), and subtracting a negative adds: ${b * b} + ${-4 * a * c}.` };
    return { ok: false, say: `Put a, b, c in with brackets: ${bb} − ${ac}.` };
  });
};

/** roots that are integers or exact decimals with at most two places, from (p1 x − n1)(p2 x − n2) */
function ratEq(R: () => number): { a: number; b: number; c: number; r1: number; r2: number } {
  for (;;) {
    const p1 = pick(R, [1, 1, 2, 2, 4]), p2 = pick(R, [1, 1, 2, 3]), n1 = nz(R, -7, 7), n2 = nz(R, -7, 7);
    let a = p1 * p2, b = -(p1 * n2 + p2 * n1), c = n1 * n2;
    if (p2 === 3 && n2 % 3 !== 0) continue;
    const r1 = n1 / p1, r2 = n2 / p2;
    if (r1 === r2 || a > 8 || Math.abs(b) > 20) continue;
    const g = Math.abs([a, b, c].reduce((x, y) => { x = Math.abs(x); y = Math.abs(y); while (y) [x, y] = [y, x % y]; return x; }));
    a /= g; b /= g; c /= g;
    if (a === 1 && R() < 0.5) continue;   // mostly a ≠ 1
    if (R() < 0.2) return { a: -a, b: -b, c: -c, r1, r2 };
    return { a, b, c, r1, r2 };
  }
}
export const formulaSolve: Gen = (R, n) => {
  const { a, b, c, r1, r2 } = ratEq(R), D = disc(a, b, c), s = Math.sqrt(D);
  const dec = !Number.isInteger(r1) || !Number.isInteger(r2);
  return pairItem({
    id: `formulaSolve-${n}`, family: 'formulaSolve', prompt: `Solve ${eqH(a, b, c)} with the quadratic formula. (Either order${dec ? '; type a fraction as a decimal, like −0.5' : ''}.)`,
    board: `${eqT(a, b, c)} \\qquad x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}`,
    solution: [`<i>a</i> = ${iH(a)}, <i>b</i> = ${iH(b)}, <i>c</i> = ${iH(c)}; <i>b</i>² − 4<i>ac</i> = ${D}, √${D} = ${s}.`, `${X} = (${iH(-b)} ± ${s}) / ${iH(2 * a)}.`, `So ${X} = ${ans(dH(round((-b + s) / (2 * a), 4)))} or ${X} = ${ans(dH(round((-b - s) / (2 * a), 4)))}.`],
  }, r1, r2, `${X} =`, ` or ${X} =`, '', (u, w) => {
    if (isSet(u, w, r1, r2)) return { ok: true, say: `Yes: ${X} = ${dH(round(r1, 4))} or ${X} = ${dH(round(r2, 4))}.` };
    if (isSet(u, w, -r1, -r2)) return { ok: false, mc: MC.bNotNeg, say: `The formula starts with −<i>b</i> = ${iH(-b)}, not <i>b</i>.` };
    if (isSet(u, w, -b + s / (2 * a), -b - s / (2 * a))) return { ok: false, mc: MC.selected, say: `Divide the WHOLE top, −b ± √(b² − 4ac), by 2a, not only the root.` };
    if (isSet(u, w, 2 * r1, 2 * r2)) return { ok: false, say: `The bottom is 2a = ${iH(2 * a)}, not a.` };
    if (isSet(u, w, r1 / 2, r2 / 2) && a !== 1) return { ok: false, say: `The bottom is 2a = ${iH(2 * a)}.` };
    return { ok: false, say: `Put a, b, c into x = (−b ± √(b² − 4ac)) / 2a: (${iH(-b)} ± ${s}) / ${iH(2 * a)}.` };
  });
};

export const formulaExact: Gen = (R, n) => {
  for (;;) {
    const a = pick(R, [1, 1, 2, 3, -1, -2]), b = nz(R, -8, 8), c = nz(R, -7, 7), D = disc(a, b, c);
    if (D <= 0 || isSq(D)) continue;
    const right = roots(a, b, c);
    const opts: Opt[] = [{ t: rootsH(right), ok: true, say: `Yes: (${iH(-b)} ± √${D}) / ${iH(2 * a)}, in simplest form.` }];
    const push = (r: Roots | string, mc: string | undefined, say: string) => { const t = typeof r === 'string' ? r : rootsH(r); if ((typeof r !== 'string' && (r.kind === 'none' || sameRoots(r, right))) || opts.some(o => o.t === t)) return; opts.push({ t, mc, say }); };
    push(surd(b, 1, D, 2 * a), MC.bNotNeg, `The top starts with −<i>b</i> = ${iH(-b)}.`);
    if (right.kind === 'surd') {
      const sf = { K: Math.round(Math.sqrt(D / right.m)), m: right.m };
      push(`${X} = ${iH(-b)} ± ${sf.K === 1 ? '' : sf.K}√<u class="rb">${sf.m}</u>/${iH(2 * a)}`, MC.selected, `Divide the WHOLE top by 2a = ${iH(2 * a)}, not only the root.`);
    }
    const D2 = b * b + 4 * a * c;
    if (D2 > 0) push(surd(-b, 1, D2, 2 * a), MC.discAdd, `Under the root is b² MINUS 4ac: ${b * b} − ${a * c < 0 ? `(${iH(4 * a * c)})` : 4 * a * c} = ${D}.`);
    if (a < 0) push(surd(-b, 1, D, -2 * a), MC.signSlip, `The bottom is 2a = ${iH(2 * a)}, with its minus sign.`);
    push(surd(-b, 1, D, a), undefined, `The bottom is 2a = ${iH(2 * a)}, not a.`);
    if (opts.length < 4) continue;
    const four = [opts[0]!, ...opts.slice(1).sort(() => R() - 0.5).slice(0, 3)];
    return choiceItem(R, {
      id: `formulaExact-${n}`, family: 'formulaExact', prompt: `Solve ${eqH(a, b, c)} with the quadratic formula. Which gives the exact solutions?`,
      board: `${eqT(a, b, c)} \\qquad x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}`,
      solution: [`<i>a</i> = ${iH(a)}, <i>b</i> = ${iH(b)}, <i>c</i> = ${iH(c)}; <i>b</i>² − 4<i>ac</i> = ${b * b} − ${a * c < 0 ? `(${iH(4 * a * c)})` : 4 * a * c} = ${D}.`, `${X} = (${iH(-b)} ± √${D}) / ${iH(2 * a)}; in simplest form ${rootsH(right)}.`],
    }, four);
  }
};

export const formulaRound: Gen = (R, n) => {
  for (;;) {
    const { a, b, c } = abc(R), D = disc(a, b, c);
    if (D <= 0 || isSq(D)) continue;
    const [lo, hi] = rootVals(roots(a, b, c)) as [number, number];
    const big = R() < 0.5, v = big ? hi : lo;
    if (!noTie(v, 2, 0.1) || Math.abs(round(lo) - round(hi)) < 0.02) continue;
    const ansv = round(v);
    return numItem({
      id: `formulaRound-${n}`, family: 'formulaRound', prompt: `Solve ${eqH(a, b, c)} with the quadratic formula and a calculator. Give the ${big ? 'larger' : 'smaller'} solution rounded to the nearest hundredth.`,
      board: `${eqT(a, b, c)} \\qquad x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}`,
      solution: [`<i>b</i>² − 4<i>ac</i> = ${D}, so ${X} = (${iH(-b)} ± √${D}) / ${iH(2 * a)}.`, `The two solutions are about ${dH(round(lo, 4))} and ${dH(round(hi, 4))}.`, `The ${big ? 'larger' : 'smaller'} one, to the nearest hundredth: ${ans(dH(ansv))}.`],
    }, ansv, w => {
      if (near(w, ansv)) return { ok: true, say: `Yes: about ${dH(ansv)}.` };
      if (near(w, round(big ? lo : hi))) return { ok: false, say: `That is the ${big ? 'smaller' : 'larger'} solution. The ${big ? 'larger' : 'smaller'} one is ${ansv}.` };
      if (near(w, -ansv)) return { ok: false, mc: MC.bNotNeg, say: `The top starts with −b = ${iH(-b)}: check the sign.` };
      if (Math.abs(w - v) < 0.011) return { ok: false, say: `Close: round to the nearest hundredth, ${ansv}.` };
      return { ok: false, say: `Compute (${iH(-b)} ± √${D}) / ${iH(2 * a)} and round.` };
    });
  }
};
void qVal; void sameRoots;
