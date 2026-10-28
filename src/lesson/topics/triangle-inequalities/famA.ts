// famA.ts: stage 1 of "Isosceles triangles and side-angle order": the isosceles theorem and its converse as separate
// implications, side-angle order (from sides, from angles with the angle sum, a ratio trap), the compass check and the
// triangle-inequality test. Every figure is exact: ticks / arcs mark exactly equal parts, labelled lengths and
// angles are drawn at their measure, so no figure contradicts the side-angle order.
import { type Opt, choiceItem, numItem, pick, r, shuffle } from '../geometry-foundations/kit';
import { type FMark, type Tri, pickLetters, sideName } from '../triangle-congruence/tri';
import { MC, NAMES, type Gen, angN, deg, fitted, segN, tri } from './tkit';
import { ang3, angAt, arcsFig, fmt, isoTri, orderBy, rotTo, sideLen, solveArcs, sticksFig, triASA, triFig, triKind, triSAS, triSSS, turnT } from './ineq';

const unitOf = (R: () => number) => (R() < 0.5 ? 'in' : 'cm');
/** an isosceles triangle with its apex at index k, turned */
function isoAt(R: () => number, v: number, k: number, L = 300): Tri { return turnT(rotTo(isoTri(v, L), k), r(R, 0, 359)); }
/** the two sides that meet at vertex k (the legs when k is the apex) */
const legs = (n: string, k: number) => [sideName(n, (k + 1) % 3), sideName(n, (k + 2) % 3)] as const;
const listLen = (L: readonly number[], u: string) => `${L.slice(0, -1).map(x => `${fmt(x)} ${u}`).join(', ')} and ${fmt(L[L.length - 1]!)} ${u}`;

// =============== s1-isosceles-base-angles ===============
export const baseAnglePick: Gen = (R, n) => fitted('baseAnglePick', () => {
  const nm = pickLetters(R, 3), k = r(R, 0, 2), u = (R() < 0.62 ? 'iso' : R() < 0.5 ? 'equi' : 'look') as 'iso' | 'equi' | 'look';
  let T: Tri;
  if (u === 'equi') T = isoAt(R, 60, k);
  else if (u === 'iso') { let v = 60; while (Math.abs(v - 60) < 14) v = r(R, 28, 116); T = isoAt(R, v, k); }
  else T = turnT(rotTo(triSAS(300, r(R, 44, 96), 300 * pick(R, [1.06, 1.07, 0.93])), k), r(R, 0, 359));
  const [l1, l2] = legs(nm, k), base = sideName(nm, k);
  const ap = nm[k]!, b1 = nm[(k + 1) % 3]!, b2 = nm[(k + 2) % 3]!;
  const marks: FMark[] = u === 'iso' ? [{ seg: l1, n: 1 }, { seg: l2, n: 1 }] : u === 'equi' ? [{ seg: l1, n: 1 }, { seg: l2, n: 1 }, { seg: base, n: 1 }] : [];
  let fig = triFig(T, nm, marks);
  if (u !== 'look') fig = solveArcs(fig, T, u === 'equi' ? [0, 1, 2] : [(k + 1) % 3, (k + 2) % 3]);
  const opts: Opt[] = u === 'iso' ? [
    { t: `${angN(b1)} and ${angN(b2)}`, ok: true, say: `Right: ${angN(b1)} faces ${segN(l1)} and ${angN(b2)} faces ${segN(l2)}.` },
    { t: `${angN(ap)} and ${angN(b1)}`, mc: MC.baseMis, say: `${angN(ap)} sits between the two marked sides: it faces neither. The equal angles face the equal sides.` },
    { t: `${angN(ap)} and ${angN(b2)}`, mc: MC.baseMis, say: `${angN(ap)} sits between the two marked sides: it faces neither. The equal angles face the equal sides.` },
    { t: 'All three angles', say: `Only two sides are marked congruent, so only the two angles facing them must be equal.` },
    { t: 'None: no angle is marked', mc: MC.onlyMarked, say: 'The isosceles theorem turns the marked sides into a pair of congruent angles.' },
  ] : u === 'equi' ? [
    { t: 'All three angles', ok: true, say: 'Right: every pair of sides is congruent, so every pair of opposite angles is.' },
    { t: `${angN(b1)} and ${angN(b2)} only`, say: 'All three sides carry the same mark: use the theorem for every pair of sides.' },
    { t: 'None: no angle is marked', mc: MC.onlyMarked, say: 'The isosceles theorem turns marked sides into congruent angles.' },
  ] : [
    { t: 'None are known: no sides are marked congruent', ok: true, say: 'Right: a triangle that looks isosceles proves nothing.' },
    { t: `${angN(b1)} and ${angN(b2)}`, mc: MC.appearance, say: 'No tick marks and no given: looking equal is not a reason.' },
    { t: 'All three angles', mc: MC.appearance, say: 'Nothing is marked: the drawing alone fixes no angle.' },
  ];
  return choiceItem(R, {
    id: `baseAnglePick-${n}`, family: 'baseAnglePick',
    prompt: `Use only the marks in ${tri(nm)}. Which angles must be congruent?`, board: `\\triangle ${nm}`,
    solution: u === 'iso' ? [`The ticks mark ${segN(l1)} ≅ ${segN(l2)}.`, `${segN(l1)} faces ${angN(b1)}; ${segN(l2)} faces ${angN(b2)}.`, 'Equal sides face equal angles.']
      : u === 'equi' ? ['All three sides carry one tick: every pair of sides is congruent.', 'So every pair of angles facing them is congruent.']
        : ['No side carries a tick mark, and nothing is given.', 'How a triangle looks is not a reason.'],
    picture: { fig, reveal: { solve: true } },
  }, opts);
});

export const isoStatement: Gen = (R, n) => fitted('isoStatement', () => {
  const nm = pickLetters(R, 3), k = r(R, 0, 2);
  if (R() < 0.3) {
    // equilateral -> equiangular
    const T = isoAt(R, 60, k), j = r(R, 0, 2);
    const fig = triFig(T, nm, [{ seg: sideName(nm, 0), n: 1 }, { seg: sideName(nm, 1), n: 1 }, { seg: sideName(nm, 2), n: 1 }, { ang: ang3(nm, j), text: '?', lone: true, col: 'link' }]);
    return numItem({
      id: `isoStatement-${n}`, family: 'isoStatement',
      prompt: `In ${tri(nm)}, ${segN(sideName(nm, 0))} ≅ ${segN(sideName(nm, 1))} ≅ ${segN(sideName(nm, 2))}. What is m${angN(nm[j]!)}?`, board: `m\\angle ${nm[j]} = \\,?`, unit: '°',
      solution: ['Every pair of sides is congruent, so by the isosceles theorem every pair of opposite angles is congruent.', 'Three equal angles share 180°: 180° ÷ 3 = 60°.'],
      picture: { fig },
    }, 60, [{ v: 180, say: 'That is all three angles together; each one gets a third.' }, { v: 90, say: 'Three equal angles share 180°.' }], 'Right: an equilateral triangle is equiangular, 60° each.', 'Three equal angles share 180°.');
  }
  const T = isoAt(R, pick(R, [36, 40, 44, 50, 76, 84, 96, 104]), k);
  const [l1, l2] = legs(nm, k), ap = nm[k]!, b1 = nm[(k + 1) % 3]!, b2 = nm[(k + 2) % 3]!;
  const fig = triFig(T, nm, [{ seg: l1, n: 1 }, { seg: l2, n: 1 }]);
  return choiceItem(R, {
    id: `isoStatement-${n}`, family: 'isoStatement',
    prompt: `Which if-then statement is the isosceles base-angle theorem, written for ${tri(nm)}?`, board: `\\triangle ${nm}`,
    solution: ['The theorem starts from congruent sides (the hypothesis) and ends with the angles that face them (the conclusion).', `${segN(l1)} faces ${angN(b1)} and ${segN(l2)} faces ${angN(b2)}.`],
    picture: { fig, reveal: {} },
  }, [
    { t: `If ${segN(l1)} ≅ ${segN(l2)}, then ${angN(b1)} ≅ ${angN(b2)}.`, ok: true, say: 'Right: equal sides, then equal opposite angles.' },
    { t: `If ${segN(l1)} ≅ ${segN(l2)}, then ${angN(ap)} ≅ ${angN(b1)}.`, mc: MC.baseMis, say: `${angN(ap)} is between the congruent sides; the equal angles face them.` },
    { t: `If ${angN(b1)} ≅ ${angN(b2)}, then ${segN(l1)} ≅ ${segN(l2)}.`, say: 'That is the converse: hypothesis and conclusion swapped. It is a separate theorem with its own proof.' },
    { t: `If ${tri(nm)} looks symmetric, then ${angN(b1)} ≅ ${angN(b2)}.`, mc: MC.appearance, say: 'The theorem starts from congruent sides, not from a look.' },
  ]);
});

// =============== s1-isosceles-converse ===============
export const converseSides: Gen = (R, n) => fitted('converseSides', () => {
  const nm = pickLetters(R, 3), k = r(R, 0, 2), u = (R() < 0.6 ? 'two' : R() < 0.4 ? 'three' : 'close') as 'two' | 'three' | 'close';
  const ap = nm[k]!, b1 = nm[(k + 1) % 3]!, b2 = nm[(k + 2) % 3]!;
  const s1 = sideName(nm, (k + 1) % 3), s2 = sideName(nm, (k + 2) % 3), base = sideName(nm, k);
  let T: Tri, marks: FMark[], a = 0, b = 0;
  if (u === 'close') {
    // two labelled angles that are close but not equal, and a third angle that differs from both
    for (;;) { a = r(R, 52, 74); b = a + pick(R, [-3, -2, 2, 3]); const c = 180 - a - b; if (c !== a && c !== b && Math.abs(c - a) > 4 && Math.abs(c - b) > 4) break; }
    T = turnT(rotTo(triASA(a, 330, b), (k + 1) % 3), r(R, 0, 359));   // vertex k+1 gets a, k+2 gets b
    marks = [{ ang: ang3(nm, (k + 1) % 3), text: `${a}°`, lone: true }, { ang: ang3(nm, (k + 2) % 3), text: `${b}°`, lone: true }];
  } else {
    T = isoAt(R, u === 'three' ? 60 : pick(R, [34, 40, 46, 80, 90, 100, 110]), k);
    marks = [{ ang: ang3(nm, (k + 1) % 3), n: 1 }, { ang: ang3(nm, (k + 2) % 3), n: 1 }, ...(u === 'three' ? [{ ang: ang3(nm, k), n: 1 }] : [])];
  }
  const fig = triFig(T, nm, marks);
  const opts: Opt[] = u === 'two' ? [
    { t: `${segN(s1)} and ${segN(s2)}`, ok: true, say: `Right: ${segN(s1)} faces ${angN(b1)} and ${segN(s2)} faces ${angN(b2)}.` },
    { t: `${segN(base)} and ${segN(s1)}`, mc: MC.adjacent, say: `${segN(base)} runs between the two marked angles; the equal sides are the ones facing them.` },
    { t: `${segN(base)} and ${segN(s2)}`, mc: MC.adjacent, say: `${segN(base)} runs between the two marked angles; the equal sides are the ones facing them.` },
    { t: 'None: equal angles say nothing about sides', say: 'The converse is a theorem too (proved with ASA): equal angles give equal opposite sides.' },
  ] : u === 'three' ? [
    { t: 'All three sides', ok: true, say: 'Right: an equiangular triangle is equilateral.' },
    { t: `${segN(s1)} and ${segN(s2)} only`, say: 'All three angles carry the same mark: use the converse for every pair.' },
    { t: 'None: equal angles say nothing about sides', say: 'The converse of the isosceles theorem is true: equal angles give equal opposite sides.' },
  ] : [
    { t: 'None: the two labelled angles are not equal', ok: true, say: `Right: ${a}° and ${b}° differ, so the converse does not apply.` },
    { t: `${segN(s1)} and ${segN(s2)}`, mc: MC.close, say: `${a}° and ${b}° are close, but not equal: nearly equal angles give nothing.` },
    { t: `${segN(base)} and ${segN(s1)}`, mc: MC.adjacent, say: 'The labelled angles are not even equal, and a side between them is not the one facing them.' },
  ];
  return choiceItem(R, {
    id: `converseSides-${n}`, family: 'converseSides',
    prompt: `Use only the marks and labels in ${tri(nm)}. Which sides must be congruent?`, board: `\\triangle ${nm}`,
    solution: u === 'two' ? [`The arcs mark ${angN(b1)} ≅ ${angN(b2)}.`, `${angN(b1)} faces ${segN(s1)}; ${angN(b2)} faces ${segN(s2)}.`, 'Equal angles face equal sides (the converse, its own theorem).']
      : u === 'three' ? ['All three angles carry one arc.', 'So every pair of sides facing them is congruent.']
        : [`The labels say ${angN(b1)} = ${a}° and ${angN(b2)} = ${b}°: not equal.`, `The third angle is ${180 - a - b}°, different again.`, 'No two angles are equal, so no two sides must be.'],
    picture: { fig, reveal: {} },
  }, opts);
});

export const converseClaim: Gen = (R, n) => {
  const who = pick(R, NAMES), mode = pick(R, ['theorem', 'theorem', 'equi', 'right'] as const);
  if (mode === 'theorem') {
    return choiceItem(R, {
      id: `converseClaim-${n}`, family: 'converseClaim',
      prompt: `Theorem: if two sides of a triangle are congruent, then the angles opposite them are congruent. ${who} says: “So the converse is true too, because the theorem is true.” What is right?`, board: '\\text{theorem and converse}',
      solution: ['A converse swaps the hypothesis and the conclusion: it is a new statement.', 'A true theorem can have a false converse, so a converse needs its own proof.', 'This converse is true: comparing △ABC with △ACB by ASA proves it.'],
      picture: { card: { lines: ['<b class="a">If two sides of a triangle are congruent,</b> <b class="b">then the angles opposite them are congruent.</b>', `${who}: “So the converse is true too, because the theorem is true.”`] } },
    }, [
      { t: 'The converse is true, but it needs its own proof', ok: true, say: 'Right: here ASA proves it; the theorem alone does not.' },
      { t: `${who} is right: the converse of a true theorem is always true`, mc: MC.converse, say: 'Many true statements have false converses: a converse needs its own proof.' },
      { t: 'The converse is false: equal angles do not force equal sides', say: 'This converse is true (ASA proves it); the reasoning is what fails.' },
      { t: 'The converse says the same thing, so no new proof is needed', mc: MC.converse, say: 'Swapping hypothesis and conclusion makes a different statement.' },
    ]);
  }
  if (mode === 'equi') {
    const v = pick(R, [30, 40, 50, 80, 100, 110]), b = (180 - v) / 2;
    return choiceItem(R, {
      id: `converseClaim-${n}`, family: 'converseClaim',
      prompt: `True: if a triangle is equilateral, then it is isosceles. ${who} says the converse must be true as well. Is it?`, board: '\\text{equilateral} \\Rightarrow \\text{isosceles}',
      solution: ['The converse: if a triangle is isosceles, then it is equilateral.', `A triangle with angles ${v}°, ${fmt(b)}°, ${fmt(b)}° has two equal sides but not three.`],
      picture: { card: { lines: ['<b class="a">If a triangle is equilateral,</b> <b class="b">then it is isosceles.</b>', `${who}: “The converse must be true as well.”`] } },
    }, [
      { t: `No: a triangle with angles ${v}°, ${fmt(b)}°, ${fmt(b)}° is isosceles but not equilateral`, ok: true, say: 'Right: one counterexample sinks the converse.' },
      { t: 'Yes: the converse of a true statement is true', mc: MC.converse, say: 'Converses can fail: this one has a counterexample.' },
      { t: 'Yes: isosceles and equilateral mean the same', say: 'Isosceles needs two congruent sides; equilateral needs all three.' },
    ]);
  }
  const a = pick(R, [40, 50, 55, 60]), b = pick(R, [62, 65, 70]), c = 180 - a - b;
  return choiceItem(R, {
    id: `converseClaim-${n}`, family: 'converseClaim',
    prompt: `True: if a triangle has a right angle, then its other two angles are acute. ${who} says the converse must be true as well. Is it?`, board: '\\text{right angle} \\Rightarrow \\text{two acute angles}',
    solution: ['The converse: if two angles of a triangle are acute, then it has a right angle.', `A triangle with angles ${a}°, ${b}°, ${c}° has two acute angles and no right angle.`],
    picture: { card: { lines: ['<b class="a">If a triangle has a right angle,</b> <b class="b">then its other two angles are acute.</b>', `${who}: “The converse must be true as well.”`] } },
  }, [
    { t: `No: a triangle with angles ${a}°, ${b}°, ${c}° has two acute angles and no right angle`, ok: true, say: 'Right: a counterexample to the converse.' },
    { t: 'Yes: the converse of a true statement is true', mc: MC.converse, say: 'Converses can fail; this one does.' },
    { t: 'Yes: every triangle with two acute angles is a right triangle', mc: MC.converse, say: `${a}°, ${b}°, ${c}°: two acute angles, no right angle.` },
  ]);
};

// =============== s1-side-angle-order ===============
const RIGHTS = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]];
function sidesTriple(R: () => number, tie: boolean): number[] {
  for (;;) {
    if (!tie && R() < 0.2) return shuffle(R, pick(R, RIGHTS).slice());
    const a = r(R, 3, 19), b = tie ? a : r(R, 3, 19), c = r(R, 3, 19);
    const L = shuffle(R, [a, b, c]);
    if (triKind(L) !== 'yes') continue;
    const s = [...L].sort((x, y) => x - y);
    if (!tie && (s[0] === s[1] || s[1] === s[2])) continue;
    if (tie && s[0] === s[2]) continue;
    // a clear drawing: no angle under 14°
    const T = triSSS(L[0]!, L[1]!, L[2]!);
    if ([0, 1, 2].some(i => angAt(T, i) < 14)) continue;
    return L;
  }
}
export const orderAngles: Gen = (R, n) => fitted('orderAngles', () => {
  const nm = pickLetters(R, 3), tie = R() < 0.22, u = unitOf(R);
  const L = sidesTriple(R, tie);
  const k = 340 / Math.max(...L);
  const T = turnT(triSSS(L[0]! * k, L[1]! * k, L[2]! * k), r(R, 0, 359));
  const fig = triFig(T, nm, [0, 1, 2].map(i => ({ seg: sideName(nm, i), text: `${L[i]} ${u}`, lone: true })));
  const ord = orderBy(L);   // vertex indexes by the side opposite, ascending
  const uniqueMax = L[ord[2]!]! !== L[ord[1]!]!, uniqueMin = L[ord[0]!]! !== L[ord[1]!]!;
  const mode = !tie && R() < 0.4 ? 'order' : uniqueMax && (R() < 0.6 || !uniqueMin) ? 'largest' : 'smallest';
  if (mode === 'order') {
    const show = (p: number[]) => p.map(i => angN(nm[i]!)).join(' < ');
    const right = show(ord), rev = show([...ord].reverse());
    const others = [[ord[1]!, ord[0]!, ord[2]!], [ord[0]!, ord[2]!, ord[1]!], [ord[2]!, ord[0]!, ord[1]!]].map(show);
    return choiceItem(R, {
      id: `orderAngles-${n}`, family: 'orderAngles',
      prompt: `${tri(nm)} has the side lengths shown. Order its angles from smallest to largest.`, board: `\\triangle ${nm}`,
      solution: [`Each angle faces one side: ${[0, 1, 2].map(i => `${angN(nm[i]!)} faces ${segN(sideName(nm, i))} (${L[i]} ${u})`).join(', ')}.`, 'A longer side faces a larger angle, so the angles go in the order of the sides they face.'],
      picture: { fig, reveal: {} },
    }, [
      { t: right, ok: true, say: 'Right: the angles follow the sides they face.' },
      { t: rev, say: 'Reversed: the longest side faces the largest angle, not the smallest.' },
      ...others.slice(0, 2).map(t => ({ t, say: 'Pair each angle with the side across from it, not a side that touches it.' })),
    ]);
  }
  const target = mode === 'largest' ? ord[2]! : ord[0]!;
  const opts: Opt[] = [0, 1, 2].map(i => i === target
    ? { t: angN(nm[i]!), ok: true, say: `Right: ${angN(nm[i]!)} faces the ${mode === 'largest' ? 'longest' : 'shortest'} side, ${segN(sideName(nm, i))}.` }
    : { t: angN(nm[i]!), mc: MC.adjacent, say: `${angN(nm[i]!)} touches ${segN(sideName(nm, target))}; the angle that faces it is across from it.` });
  opts.push({ t: 'Cannot tell without a protractor', say: 'The sides decide it: the larger angle faces the longer side.' });
  return choiceItem(R, {
    id: `orderAngles-${n}`, family: 'orderAngles',
    prompt: `${tri(nm)} has the side lengths shown. Which angle is the ${mode}?`, board: `\\triangle ${nm}`,
    solution: [`The ${mode === 'largest' ? 'longest' : 'shortest'} side is ${segN(sideName(nm, target))} (${L[target]} ${u}).`, `The angle across from it is ${angN(nm[target]!)}.`],
    picture: { fig: solveArcs(fig, T, [target]), reveal: { solve: true } },
  }, opts);
});

export const orderSides: Gen = (R, n) => fitted('orderSides', () => {
  const nm = pickLetters(R, 3);
  // angles at vertex 0 and 1 are the given ones; vertex 2 by the angle sum
  const kind = pick(R, ['acute', 'acute', 'right', 'obtuse', 'tie', 'hidden'] as const);
  let A = 0, B = 0;
  for (;;) {
    if (kind === 'right') { A = 90; B = r(R, 22, 64); }
    else if (kind === 'obtuse') { A = r(R, 98, 128); B = r(R, 18, 50); }
    else if (kind === 'tie') { A = r(R, 25, 75); B = R() < 0.5 ? A : 180 - 2 * A; }
    else if (kind === 'hidden') { A = r(R, 30, 52); B = r(R, 40, 60); }   // the third angle is the largest
    else { A = r(R, 35, 80); B = r(R, 35, 80); }
    const C = 180 - A - B;
    if (C < 18 || B < 18 || A < 18) continue;
    if (kind === 'acute' && (C >= 88 || A === B || B === C || A === C)) continue;
    if (kind === 'hidden' && !(C > A + 4 && C > B + 4 && A !== B)) continue;
    if (kind !== 'tie' && (A === B || A === C || B === C)) continue;
    if (kind === 'tie' && !(A === B || A === C || B === C)) continue;
    break;
  }
  const angs = [A, B, 180 - A - B];
  const sh = r(R, 0, 2);
  const T0 = triASA(A, 330, B);
  const T = turnT(rotTo(T0, sh), r(R, 0, 359));
  const at = (i: number) => (i + sh) % 3;   // model vertex i lands at index at(i)
  const ang = [0, 0, 0]; for (let i = 0; i < 3; i++) ang[at(i)] = angs[i]!;
  const given = [at(0), at(1)];
  const marks: FMark[] = given.map(i => (ang[i] === 90 ? { ang: ang3(nm, i), box: true, col: 'first' as const } : { ang: ang3(nm, i), text: `${ang[i]}°`, lone: true }));
  const fig = triFig(T, nm, marks);
  const ord = orderBy(ang);
  const mode = kind === 'hidden' ? 'longest' : pick(R, ['longest', 'shortest'] as const);
  const tgt = mode === 'longest' ? [0, 1, 2].filter(i => ang[i] === ang[ord[2]!]) : [0, 1, 2].filter(i => ang[i] === ang[ord[0]!]);
  const third = [0, 1, 2].find(i => !given.includes(i))!;
  const gtxt = given.map(i => `m${angN(nm[i]!)} = ${ang[i]}°`).join(' and ');
  const sol = [`The third angle: m${angN(nm[third]!)} = 180° − ${ang[given[0]!]}° − ${ang[given[1]!]}° = ${ang[third]}°.`,
    `The ${mode === 'longest' ? 'largest' : 'smallest'} angle${tgt.length > 1 ? 's are' : ' is'} ${tgt.map(i => `${angN(nm[i]!)} (${ang[i]}°)`).join(' and ')}.`,
    `The side${tgt.length > 1 ? 's' : ''} across: ${tgt.map(i => segN(sideName(nm, i))).join(' and ')}.`];
  let opts: Opt[];
  if (tgt.length === 1) {
    const t = tgt[0]!;
    const bigGiven = given.reduce((a, b) => (ang[a]! > ang[b]! ? a : b));
    opts = [0, 1, 2].map(i => i === t
      ? { t: segN(sideName(nm, i)), ok: true, say: `Right: ${segN(sideName(nm, i))} faces the ${mode === 'longest' ? 'largest' : 'smallest'} angle.` }
      : mode === 'longest' && i === bigGiven && t === third
        ? { t: segN(sideName(nm, i)), say: `Find the third angle first: m${angN(nm[third]!)} = ${ang[third]}°, the largest.` }
        : { t: segN(sideName(nm, i)), mc: MC.adjacent, say: `${segN(sideName(nm, i))} touches ${angN(nm[t]!)}; the side that faces it is across from it.` });
    opts.push({ t: 'Cannot tell from angles alone', say: 'Angles fix the order of the sides: the larger angle faces the longer side.' });
  } else {
    const [p, q2] = tgt as [number, number], o = [0, 1, 2].find(i => !tgt.includes(i))!;
    opts = [
      { t: `${segN(sideName(nm, p))} and ${segN(sideName(nm, q2))} (they are equal)`, ok: true, say: 'Right: two equal angles face two equal sides.' },
      { t: segN(sideName(nm, o)), say: `${segN(sideName(nm, o))} faces the ${ang[o]}° angle; the ${mode} sides face the ${ang[p]}° angles.` },
      { t: segN(sideName(nm, p)), say: `Two angles tie at ${ang[p]}°, so two sides tie for ${mode}.` },
      { t: 'Cannot tell from angles alone', say: 'The angles fix the order, ties included.' },
    ];
  }
  return choiceItem(R, {
    id: `orderSides-${n}`, family: 'orderSides',
    prompt: `In ${tri(nm)}, ${gtxt}. Which side is the ${mode}?`, board: `\\triangle ${nm}`,
    solution: sol,
    picture: { fig: solveArcs(fig, T, [third], 'pick'), reveal: { solve: true } },
  }, opts);
});

const RATIO = [[30, 60], [40, 80], [20, 40], [35, 70], [25, 50], [45, 90]];
export const orderRatio: Gen = (R, n) => fitted('orderRatio', () => {
  const nm = pickLetters(R, 3), who = pick(R, NAMES), [a, b] = pick(R, RATIO) as [number, number], s = r(R, 6, 16), u = unitOf(R);
  // vertex 0: a, vertex 1: b; side 1 (facing vertex 1) = s
  const k = 330 / Math.max(1, s), base = s * Math.sin(((180 - a - b) * Math.PI) / 180) / Math.sin((b * Math.PI) / 180);
  const T = turnT(triASA(a, base * k, b), r(R, -25, 25));
  const truth = (s * Math.sin((a * Math.PI) / 180)) / Math.sin((b * Math.PI) / 180);
  const fig = triFig(T, nm, [
    { ang: ang3(nm, 0), text: `${a}°`, lone: true }, ...(b === 90 ? [{ ang: ang3(nm, 1), box: true }] : [{ ang: ang3(nm, 1), text: `${b}°`, lone: true }]),
    { seg: sideName(nm, 1), text: `${s} ${u}`, lone: true, col: 'first' }, { seg: sideName(nm, 0), text: '?', lone: true, col: 'link' },
  ]);
  return choiceItem(R, {
    id: `orderRatio-${n}`, family: 'orderRatio',
    prompt: `In ${tri(nm)}, m${angN(nm[0]!)} = ${a}°, m${angN(nm[1]!)} = ${b}°, and the side facing ${angN(nm[1]!)} is ${s} ${u}. ${who} says the side facing ${angN(nm[0]!)} must be ${fmt(s / 2)} ${u}, “because ${a}° is half of ${b}°.” Is that right?`, board: `\\triangle ${nm}`,
    solution: [`The smaller angle faces the shorter side, so the side facing ${angN(nm[0]!)} is shorter than ${s} ${u}.`, 'But the order is all the angles give: sides are not in the same ratio as the angles.', `In fact that side is about ${fmt(Math.round(truth * 10) / 10)} ${u}, not ${fmt(s / 2)} ${u}.`],
    picture: { fig, reveal: {} },
  }, [
    { t: 'No: the smaller angle faces the shorter side, but sides are not proportional to angles', ok: true, say: 'Right: half the angle does not mean half the side.' },
    { t: 'Yes: half the angle faces half the side', mc: MC.ratio, say: 'Angles give the order of the sides, not their ratio.' },
    { t: `No: the side facing ${angN(nm[0]!)} is longer than ${s} ${u}`, say: 'The smaller angle faces the shorter side.' },
    { t: 'Cannot tell: angles say nothing about sides', say: 'They give the order: the larger angle faces the longer side.' },
  ]);
});

// =============== s1-triangle-construction-check ===============
function construct(R: () => number, want?: 'yes' | 'flat' | 'no'): { c: number; r1: number; r2: number; kind: 'yes' | 'flat' | 'no' } {
  const kind = want ?? pick(R, ['yes', 'yes', 'flat', 'no', 'no'] as const);
  for (;;) {
    const c = r(R, 7, 14), r1 = r(R, 2, c - 1);
    const r2 = kind === 'yes' ? r(R, c - r1 + 1, c) : kind === 'flat' ? c - r1 : c - r1 - r(R, 1, 3);
    if (r2 < 2 || r2 > c || r1 > c) continue;
    if (kind === 'yes' && (r1 === c || r2 === c)) continue;
    if (kind === 'yes' && r1 + r2 - c < 2 && R() < 0.5) continue;
    return { c, r1, r2, kind };
  }
}
export const arcsCheck: Gen = (R, n) => fitted('arcsCheck', () => {
  const who = pick(R, NAMES), u = unitOf(R), { c, r1, r2, kind } = construct(R);
  const [A, B] = pickLetters(R, 2).split('') as [string, string];
  const { fig } = arcsFig(c, r1, r2, u, [A, B], 52);
  const sum = r1 + r2, cmp = sum > c ? '>' : sum === c ? '=' : '<';
  const L = shuffle(R, [c, r1, r2]);
  return choiceItem(R, {
    id: `arcsCheck-${n}`, family: 'arcsCheck',
    prompt: `${who} tests ${listLen(L, u)} with ruler and compass: the ${c} ${u} length as the base ${segN(A + B)}, an arc of radius ${r1} ${u} about ${A}, and an arc of radius ${r2} ${u} about ${B}. What do the arcs show?`,
    board: `${r1} + ${r2}\\ ?\\ ${c}`,
    solution: [`The arc about ${A} holds every point ${r1} ${u} from ${A}; the arc about ${B} every point ${r2} ${u} from ${B}.`, 'The third vertex must lie on both arcs.', `${r1} + ${r2} = ${sum} ${cmp} ${c}: ${kind === 'yes' ? 'the arcs cross above the base' : kind === 'flat' ? 'the arcs meet only on the base' : 'the arcs fall short of each other'}.`],
    picture: { fig, reveal: { solve: true } },
  }, [
    { t: 'The arcs cross above the base: a triangle exists', ok: kind === 'yes', mc: kind === 'flat' ? MC.degenerate : undefined, say: kind === 'yes' ? `Right: ${r1} + ${r2} > ${c}, so the arcs cross off the base.` : kind === 'flat' ? 'They only touch on the base: that point lies on the base line, so the three points are collinear.' : `They do not reach each other: ${r1} + ${r2} is less than ${c}.` },
    { t: 'The arcs meet only on the base: the points are collinear, no triangle', ok: kind === 'flat', say: kind === 'flat' ? `Right: ${r1} + ${r2} = ${c} exactly, a flat line, not a triangle.` : kind === 'yes' ? 'They cross above the base, off the base line.' : 'They do not meet at all.' },
    { t: 'The arcs never meet: no triangle', ok: kind === 'no', say: kind === 'no' ? `Right: ${r1} + ${r2} = ${sum}, short of ${c}.` : kind === 'flat' ? 'They do meet, once, on the base.' : 'They cross above the base.' },
    { t: 'The arcs nearly meet: close enough for a triangle', mc: MC.close, say: kind === 'no' ? 'Nearly is not enough: the third vertex must be on both arcs.' : 'Look again: the arcs do meet.' },
  ], true);
});

export const arcsSetup: Gen = (R, n) => fitted('arcsSetup', () => {
  const u = unitOf(R), { c, r1, r2 } = construct(R, 'yes');
  const [A, B] = pickLetters(R, 2).split('') as [string, string];
  if (R() < 0.5) {
    const { fig } = arcsFig(c, r1, r2, u, [A, B], 52);
    return choiceItem(R, {
      id: `arcsSetup-${n}`, family: 'arcsSetup',
      prompt: `In the compass check, the compass is set to ${r1} ${u} and swung about ${A}. What does that arc stand for?`, board: `\\text{arc of radius } ${r1} \\text{ about } ${A}`,
      solution: [`A compass keeps one distance: ${r1} ${u} from the point ${A}.`, `The arc is all the points at that distance, so the third vertex can be any of them.`],
      picture: { fig, reveal: {} },
    }, [
      { t: `Every point ${r1} ${u} from ${A}`, ok: true, say: 'Right: the arc is part of the circle of points at that distance.' },
      { t: `Every point within ${r1} ${u} of ${A}`, say: 'Within would be the whole disk; the arc is only the points at exactly that distance.' },
      { t: `Only the point ${r1} ${u} straight above ${A}`, say: 'Every point on the arc is that far from A, not one point.' },
      { t: `Every point ${r1} ${u} from the base`, say: `The distance is measured from ${A}, the center of the arc.` },
    ]);
  }
  const L = shuffle(R, [c, r1, r2]);
  return choiceItem(R, {
    id: `arcsSetup-${n}`, family: 'arcsSetup',
    prompt: `To test whether ${listLen(L, u)} make a triangle with ruler and compass, which construction is right?`, board: `${L.map(fmt).join(',\\ ')}`,
    solution: [`Draw the longest length, ${c} ${u}, as the base with the ruler.`, `Swing an arc of ${r1} ${u} about one end and an arc of ${r2} ${u} about the other.`, 'Where the arcs meet is the third vertex.'],
    picture: { fig: sticksFig(L, u, 60), reveal: {} },
  }, [
    { t: `Base ${c} ${u}; arcs of ${r1} ${u} and ${r2} ${u} about its two ends`, ok: true, say: 'Right: one arc about each end of the base.' },
    { t: `Base ${c} ${u}; arcs of ${c} ${u} about both ends`, say: `The arcs must have the other two lengths, ${r1} and ${r2}.` },
    { t: `Base ${c} ${u}; arcs of ${r1} ${u} and ${r2} ${u} both about the same end`, say: 'Each length starts at a different end of the base.' },
    { t: `Draw ${r1} ${u} and ${r2} ${u} from one point and measure the angle between them`, say: 'An angle is not given: the compass finds the third vertex from the two lengths.' },
  ]);
});

// =============== s1-triangle-existence ===============
function triple(R: () => number, kind: 'yes' | 'flat' | 'no', max = 48): number[] {
  for (;;) {
    const c = r(R, 6, max), a = r(R, 2, c - 1);
    const b = kind === 'yes' ? r(R, c - a + 1, c) : kind === 'flat' ? c - a : c - a - r(R, 1, Math.max(1, Math.floor(c / 3)));
    if (b < 2 || b > c || a > c) continue;
    if (kind === 'yes' && (a === c || b === c) && R() < 0.7) continue;
    return shuffle(R, [a, b, c]);
  }
}
const EXIST_OPTS = ['Yes: the two shorter lengths add to more than the longest', 'No: the two shorter add to exactly the longest, so the sides lie flat', 'No: the two shorter add to less than the longest'];
export const existCheck: Gen = (R, n) => fitted('existCheck', () => {
  const kind = pick(R, ['yes', 'yes', 'flat', 'no', 'no'] as const), u = unitOf(R);
  const L = triple(R, kind);
  const s = [...L].sort((a, b) => a - b);
  const li = L.indexOf(s[2]!);
  const fig = sticksFig(L, u, 900 / s[2]!);
  const sum = s[0]! + s[1]!;
  return choiceItem(R, {
    id: `existCheck-${n}`, family: 'existCheck',
    prompt: `Can ${listLen(L, u)} be the side lengths of a triangle?`, board: L.map(fmt).join(',\\ '),
    solution: [`The longest length is ${s[2]} ${u}; the two shorter are ${s[0]} and ${s[1]}.`, `${s[0]} + ${s[1]} = ${sum}, ${sum > s[2]! ? 'more than' : sum === s[2] ? 'exactly' : 'less than'} ${s[2]}.`],
    picture: { fig, reveal: { glow: [['ab', 'cd', 'ef'][li]!] } },
  }, [
    { t: EXIST_OPTS[0]!, ok: kind === 'yes', mc: kind === 'flat' ? MC.degenerate : kind === 'no' ? MC.wrongPair : undefined, say: kind === 'yes' ? `Right: ${s[0]} + ${s[1]} = ${sum} > ${s[2]}.` : kind === 'flat' ? `${s[0]} + ${s[1]} is exactly ${s[2]}: the sides would lie flat on one line, not a triangle.` : `Check the two shorter lengths against the longest: ${s[0]} + ${s[1]} = ${sum} < ${s[2]}.` },
    { t: EXIST_OPTS[1]!, ok: kind === 'flat', say: kind === 'flat' ? `Right: ${s[0]} + ${s[1]} = ${s[2]}, a flat line.` : `${s[0]} + ${s[1]} = ${sum}, not ${s[2]}.` },
    { t: EXIST_OPTS[2]!, ok: kind === 'no', say: kind === 'no' ? `Right: ${s[0]} + ${s[1]} = ${sum} < ${s[2]}.` : `${s[0]} + ${s[1]} = ${sum}, not less than ${s[2]}.` },
  ], true);
});

export const whichSet: Gen = (R, n) => {
  const u = unitOf(R);
  const kinds = shuffle(R, ['yes', 'flat', 'no', pick(R, ['flat', 'no'] as const)] as ('yes' | 'flat' | 'no')[]);
  const sets = kinds.map(k => triple(R, k, 30));
  const heads = ['Set A', 'Set B', 'Set C', 'Set D'];
  const yi = kinds.indexOf('yes');
  const s = [...sets[yi]!].sort((a, b) => a - b);
  return choiceItem(R, {
    id: `whichSet-${n}`, family: 'whichSet',
    prompt: `Which set of lengths (in ${u === 'in' ? 'inches' : 'centimeters'}) can be the sides of a triangle? ${sets.map((L, i) => `${heads[i]}: ${L.join(', ')}.`).join(' ')}`, board: '\\text{which set?}',
    solution: ['In each set, add the two shorter lengths and compare with the longest.', sets.map((L, i) => { const t = [...L].sort((a, b) => a - b); const sm = t[0]! + t[1]!; return `${heads[i]}: ${t[0]} + ${t[1]} = ${sm} ${sm > t[2]! ? '>' : sm === t[2] ? '=' : '<'} ${t[2]}`; }).join('; ') + '.', `Only ${heads[yi]} works: ${s[0]} + ${s[1]} > ${s[2]}.`],
    picture: { cards: sets.map((L, i) => ({ head: heads[i]!, text: L.map(x => `${x} ${u}`).join(',  ') })) },
  }, sets.map((L, i) => {
    const t = [...L].sort((a, b) => a - b), sm = t[0]! + t[1]!;
    return kinds[i] === 'yes' ? { t: heads[i]!, ok: true, say: `Right: ${t[0]} + ${t[1]} = ${sm} > ${t[2]}.` }
      : kinds[i] === 'flat' ? { t: heads[i]!, mc: MC.degenerate, say: `${t[0]} + ${t[1]} = ${t[2]} exactly: the sides lie flat.` }
        : { t: heads[i]!, mc: MC.wrongPair, say: `Compare the two shorter with the longest: ${t[0]} + ${t[1]} = ${sm} < ${t[2]}.` };
  }), true);
};

export const oneCheck: Gen = (R, n) => fitted('oneCheck', () => {
  const u = unitOf(R);
  let L: number[];
  do L = triple(R, pick(R, ['yes', 'no', 'flat'] as const), 40); while (new Set(L).size < 3);
  const s = [...L].sort((a, b) => a - b);
  const fig = sticksFig(L, u, 900 / s[2]!);
  return choiceItem(R, {
    id: `oneCheck-${n}`, family: 'oneCheck',
    prompt: `To decide whether ${listLen(L, u)} make a triangle, which one comparison settles it?`, board: L.map(fmt).join(',\\ '),
    solution: [`Any sum that includes the longest length, ${s[2]}, is bigger than the third length anyway.`, `The only check that can fail: the two shorter against the longest, ${s[0]} + ${s[1]} > ${s[2]}?`],
    picture: { fig, reveal: {} },
  }, [
    { t: `Is ${s[0]} + ${s[1]} > ${s[2]}?`, ok: true, say: 'Right: if the two shorter beat the longest, every other pair does too.' },
    { t: `Is ${s[1]} + ${s[2]} > ${s[0]}?`, mc: MC.wrongPair, say: `That sum contains the longest length, ${s[2]}: it always passes and settles nothing.` },
    { t: `Is ${s[0]} + ${s[2]} > ${s[1]}?`, mc: MC.wrongPair, say: `That sum contains the longest length, ${s[2]}: it always passes and settles nothing.` },
  ]);
});
