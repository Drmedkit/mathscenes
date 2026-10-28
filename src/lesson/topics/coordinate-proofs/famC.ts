// famC.ts: stage 4 families of "Distance, midpoint and coordinate proofs" (claims about every figure of a kind):
// varying examples, proof scope, counterexamples, what letter coordinates represent, why a figure may be moved, general
// placement, general coordinate proofs, the slope-criteria proofs, critique and audit. Most items show an argument
// or a set-up on a card; the counterexample candidates are real coordinate figures (the choice text names them).
import { type V, add, d2, dot, mid, mul, near, qclass, sub } from './cg';
import { type Gen, type Opt, MC, choice, fmt, int, ipt, nz, pickOf, plane, pt, ptN, retry, Reroll, PEOPLE } from './ckit';

const card = (lines: string[]) => ({ card: { lines } });
const quad = (Q: V[], L = ['A', 'B', 'C', 'D']) => Q.map((p, i) => ptN(L[i]!, p)).join(', ');
const LETTERS: [string, string, string][] = [['a', 'b', 'c'], ['p', 'q', 'r'], ['h', 'k', 'm'], ['s', 't', 'u']];

// ===================== vary-examples-investigation =====================
const CONJ = [
  { claim: 'the midpoints of the sides of any quadrilateral form a parallelogram', fam: 'quadrilaterals', good: 'a kite, a trapezoid, a concave quadrilateral and one with no equal sides', sub: 'squares of different sizes' },
  { claim: 'the diagonals of any parallelogram bisect each other', fam: 'parallelograms', good: 'a long thin parallelogram, a tilted one, a rhombus and one with no right angles', sub: 'rectangles of different sizes' },
  { claim: 'the segment joining the midpoints of two sides of any triangle is half as long as the third side', fam: 'triangles', good: 'an obtuse triangle, a right triangle, a long thin triangle and one with no equal sides', sub: 'equilateral triangles of different sizes' },
  { claim: 'the medians of any triangle meet at one point', fam: 'triangles', good: 'an obtuse triangle, a right triangle, a long thin triangle and one with no equal sides', sub: 'isosceles triangles of different sizes' },
];
export const varyEx: Gen = (R, n) => retry(() => {
  if (n % 2 === 0) {
    const C = pickOf(R, CONJ), k = 'four', who = pickOf(R, PEOPLE);
    return choice(R, {
      id: `varyEx-${n}`, family: 'varyEx', prompt: `${who} conjectures that ${C.claim}. Which ${k} examples test it best before a proof?`,
      board: '\\text{test the conjecture}', picture: card([`Conjecture: ${C.claim}.`]),
      solution: ['A conjecture about every member of a family must survive the most different members you can find.', `Vary the shape itself, not only its size or position: ${C.good}.`],
    }, [
      { t: `Different shapes: ${C.good}`, ok: true, say: 'Right: varied shapes are the hardest test.' },
      { t: `${C.sub[0]!.toUpperCase()}${C.sub.slice(1)}`, mc: MC.upHier, say: `Those are special ${C.fam}: what holds for them need not hold for all ${C.fam}.` },
      { t: `One of the ${C.fam} moved to ${k} different places`, say: 'Moving a figure keeps every length and angle: it is the same example again.' },
      { t: `One example, drawn again more carefully`, say: 'Checking the same case again adds no new evidence.' },
    ], { max: 3 });
  }
  const r1 = [int(R, 3, 6), int(R, 2, 5)], r2 = [int(R, 5, 9), int(R, 1, 3)], s = int(R, 2, 5);
  const rows = [`a ${s} by ${s} square: AC² = BD² = ${2 * s * s}`, `a ${r1[0]} by ${r1[1]} rectangle: AC² = BD² = ${r1[0]! ** 2 + r1[1]! ** 2}`, `a ${r2[0]} by ${r2[1]} rectangle: AC² = BD² = ${r2[0]! ** 2 + r2[1]! ** 2}`];
  return choice(R, {
    id: `varyEx-${n}`, family: 'varyEx', prompt: 'Conjecture: the diagonals of every parallelogram are congruent. The table shows the cases checked so far. Which example should come next?',
    board: '\\text{parallelogram: } AC = BD\\,?', picture: card(['Conjecture: every parallelogram has congruent diagonals.', ...rows.map(r => `Checked: ${r}.`)]),
    solution: ['Every case so far has right angles: squares and rectangles are special parallelograms.', 'Vary the shape: try a parallelogram with no right angle.'],
  }, [
    { t: 'A parallelogram with no right angle', ok: true, say: 'Right: it is the first case that is not special. (It will break the conjecture.)' },
    { t: 'Another rectangle, a bigger one', mc: MC.upHier, say: 'Rectangles are special parallelograms: they cannot test the whole family.' },
    { t: 'A square with a different side', mc: MC.upHier, say: 'Squares are the most special case: they test the least.' },
    { t: 'None: three agreeing cases prove it', mc: MC.examples, say: 'Agreeing cases are evidence, not proof, and these are all special cases.' },
  ], { max: 3 });
});

// ===================== proof-scope =====================
export const scope: Gen = (R, n) => retry(() => {
  const c = n % 4, who = pickOf(R, PEOPLE);
  let claim: string, arg: string[], opts: Opt[];
  if (c === 0) {
    const Ap = ipt(R, -3, 1), u = pickOf(R, [[3, 4], [4, 3], [1, 3], [2, 4], [1, 5]] as V[]), Bp = add(Ap, u), Cp = add(Ap, [u[1], u[0]]);
    const s = d2(Ap, Bp);
    claim = `triangle ${quad([Ap, Bp, Cp], ['A', 'B', 'C'])} is isosceles`;
    arg = [`AB² = ${s} and AC² = ${d2(Ap, Cp)}, so AB = AC.`];
    opts = [
      { t: 'Yes: exact computation settles a claim about this one triangle', ok: true, say: 'Right: the claim is about one specified figure, and the computation is exact.' },
      { t: 'No: one example cannot prove anything', mc: MC.rejectsProof, say: 'The claim is about this triangle only, so this one exact check is a complete proof.' },
      { t: 'No: a real proof needs letters, not numbers', mc: MC.rejectsProof, say: 'Letters are needed for claims about every triangle. This claim names one triangle.' },
    ];
  } else if (c === 1) {
    claim = 'the diagonals of every parallelogram bisect each other';
    const k = int(R, 3, 4);
    arg = [`${who} drew ${k} parallelograms on a grid and found, exactly, that the diagonals share a midpoint every time.`];
    opts = [
      { t: 'No: checked examples cannot prove a claim about every parallelogram', ok: true, say: 'Right: the claim covers infinitely many parallelograms; examples are evidence only.' },
      { t: 'Yes: it worked every time', mc: MC.examples, say: 'Agreeing examples do not cover the cases not checked.' },
      { t: 'Yes: the computations are exact, not measured', mc: MC.examples, say: 'Exact computations prove each example, but not the parallelograms nobody checked.' },
    ];
  } else if (c === 2) {
    const L = pickOf(R, [4.9, 5.0, 6.1, 7.2]);
    claim = 'triangle ABC drawn on the worksheet is isosceles';
    arg = [`${who} measured AB ≈ ${L.toFixed(1)} cm and AC ≈ ${L.toFixed(1)} cm with a ruler.`];
    opts = [
      { t: 'No: measurements are approximate, so equality is not shown', ok: true, say: 'Right: a ruler shows the lengths are close, not that they are equal.' },
      { t: 'Yes: the two lengths match', mc: MC.rounding, say: 'They match to the nearest millimeter; the exact lengths could still differ.' },
      { t: 'Yes: a careful drawing counts as a proof', mc: MC.appearance, say: 'A drawing can suggest a claim, not prove it.' },
    ];
  } else {
    const [a, b, cc] = pickOf(R, LETTERS);
    claim = 'the diagonals of every parallelogram bisect each other';
    arg = [`Place any parallelogram at O(0, 0), A(${a}, 0), B(${a} + ${b}, ${cc}), C(${b}, ${cc}), with ${a} > 0 and ${cc} ≠ 0.`, `Midpoint of OB = midpoint of AC = ((${a} + ${b})/2, ${cc}/2).`];
    opts = [
      { t: 'Yes: the letters can stand for any parallelogram, so every case is covered', ok: true, say: 'Right: this placement imposes nothing beyond being a parallelogram.' },
      { t: 'No: a proof about shapes must not use coordinates', mc: MC.rejectsProof, say: 'Coordinate computations are a valid way to prove: what matters is that every case is covered.' },
      { t: 'No: it only covers parallelograms with a vertex at the origin', mc: MC.drawnCase, say: 'Any parallelogram can be moved there without changing lengths or midpoints.' },
    ];
  }
  return choice(R, {
    id: `scope-${n}`, family: 'scope', prompt: `Claim: ${claim}. Does this argument prove the claim?`,
    board: '\\text{does it prove the claim?}', picture: card([`Claim: ${claim}.`, ...arg]),
    solution: ['Match the argument to the claim: one specified figure, or every figure of a kind?', c === 0 ? 'One specified triangle: one exact computation is a full proof.' : c === 1 ? 'Every parallelogram: examples are not enough.' : c === 2 ? 'Measurements are approximate: they cannot show equality.' : 'Every parallelogram: general coordinates cover them all.'],
  }, opts, { max: 3 });
});

// ===================== counterexample =====================
type Fig = { pts: V[]; kind: 'cx' | 'holds' | 'hyp' };
/** claims about quadrilaterals (or triangles) with a counterexample, a figure where the claim holds, and one that misses the hypothesis */
function cxClaim(R: () => number, which: number): { claim: string; hyp: string; concl: string; figs: Fig[]; why: (f: Fig) => string } {
  const o = ipt(R, -3, 1), s = pickOf(R, [1, 2]);
  const T = (pts: V[]) => pts.map(p => add(mul(p, s), o));
  if (which === 0) {
    const kite = T([[0, 0], [3, -2], [6, 0], [3, 5]]), rh = T([[0, 0], [3, -2], [6, 0], [3, 2]]), rect = T([[0, 0], [6, 0], [6, 3], [0, 3]]);
    return { claim: 'every quadrilateral with perpendicular diagonals is a rhombus', hyp: 'perpendicular diagonals', concl: 'a rhombus',
      figs: [{ pts: kite, kind: 'cx' }, { pts: rh, kind: 'holds' }, { pts: rect, kind: 'hyp' }],
      why: f => (f.kind === 'cx' ? 'its diagonals are perpendicular, but its sides are not all congruent' : f.kind === 'holds' ? 'it is a rhombus, so the claim holds for it' : 'its diagonals are not perpendicular') };
  }
  if (which === 1) {
    const trap = T([[0, 0], [6, 0], [5, 3], [1, 3]]), rect = T([[0, 0], [5, 0], [5, 3], [0, 3]]), rh = T([[0, 0], [4, -2], [8, 0], [4, 2]]);
    return { claim: 'every quadrilateral with congruent diagonals is a rectangle', hyp: 'congruent diagonals', concl: 'a rectangle',
      figs: [{ pts: trap, kind: 'cx' }, { pts: rect, kind: 'holds' }, { pts: rh, kind: 'hyp' }],
      why: f => (f.kind === 'cx' ? 'its diagonals are congruent, but it has no right angle' : f.kind === 'holds' ? 'it is a rectangle, so the claim holds for it' : 'its diagonals are not congruent') };
  }
  const rh = T([[0, 0], [5, 0], [8, 4], [3, 4]]), sq4 = T([[0, 0], [4, 0], [4, 4], [0, 4]]), rect = T([[0, 0], [6, 0], [6, 3], [0, 3]]);
  return { claim: 'every quadrilateral with four congruent sides is a square', hyp: 'four congruent sides', concl: 'a square',
    figs: [{ pts: rh, kind: 'cx' }, { pts: sq4, kind: 'holds' }, { pts: rect, kind: 'hyp' }],
    why: f => (f.kind === 'cx' ? 'its four sides are congruent, but it has no right angle' : f.kind === 'holds' ? 'it is a square, so the claim holds for it' : 'its sides are not all congruent') };
}
/** the facts the oracle would compute, checked here so the labels are true */
function verifyCx(which: number, f: Fig): void {
  const [A, B, C, D] = f.pts as [V, V, V, V];
  const perpD = near(dot(sub(C, A), sub(D, B)), 0), congD = near(d2(A, C), d2(B, D)), cls = qclass(A, B, C, D);
  const four = near(d2(A, B), d2(B, C)) && near(d2(B, C), d2(C, D)) && near(d2(C, D), d2(D, A));
  const hyp = which === 0 ? perpD : which === 1 ? congD : four;
  const concl = which === 0 ? cls === 'rhombus' || cls === 'square' : which === 1 ? cls === 'rectangle' || cls === 'square' : cls === 'square';
  const kind = hyp && !concl ? 'cx' : hyp && concl ? 'holds' : 'hyp';
  if (kind !== f.kind) throw new Error(`cx figure ${which} labelled ${f.kind}, is ${kind}`);
}
export const cxPick: Gen = (R, n) => retry(() => {
  const which = n % 3, C = cxClaim(R, which);
  C.figs.forEach(f => verifyCx(which, f));
  const sq: V[] = (() => { const o = ipt(R, -3, 0); return [o, add(o, [3, 0]), add(o, [3, 3]), add(o, [0, 3])]; })();
  return choice(R, {
    id: `cxPick-${n}`, family: 'cxPick', prompt: `Claim: ${C.claim}. Which quadrilateral ABCD is a counterexample?`,
    board: `\\text{counterexample?}`, picture: card([`Claim: ${C.claim}.`, `A counterexample has ${C.hyp} and is not ${C.concl}.`]),
    solution: [`A counterexample must meet the hypothesis (${C.hyp}) and fail the conclusion (not ${C.concl}).`, `Check each candidate with slopes and squared lengths.`],
  }, [
    ...C.figs.map(f => ({ t: quad(f.pts), ok: f.kind === 'cx', mc: f.kind === 'holds' ? MC.cxHolds : f.kind === 'hyp' ? MC.cxPremise : undefined, say: f.kind === 'cx' ? `Right: ${C.why(f)}.` : `Not a counterexample: ${C.why(f)}.` })),
    ...(which !== 0 ? [] : [{ t: quad(sq), mc: MC.cxHolds, say: 'Not a counterexample: it is a square, which is a rhombus, so the claim holds for it.' }]),
  ], { max: 3 });
});
export const cxCheck: Gen = (R, n) => retry(() => {
  const which = n % 3, C = cxClaim(R, which), who = pickOf(R, PEOPLE), c = Math.floor(n / 3) % 4;
  const f = c === 0 ? C.figs[0]! : c === 1 ? C.figs[2]! : C.figs[1]!;
  verifyCx(which, f);
  const err = c === 3;
  const [A, B, Cc, D] = f.pts as [V, V, V, V];
  const lines = [`Claim: ${C.claim}.`, `${who}'s counterexample: ${quad(f.pts)}.`];
  if (err) { const s1 = d2(A, B), s2 = d2(B, Cc); lines.push(which === 0 ? `${who}'s work: AB² = ${s1}, BC² = ${s1 + 2}, so it is not ${C.concl}.` : `${who}'s work: AB² + BC² = ${s1 + s2}, AC² = ${s1 + s2 + 2}, so ∠B is not right and it is not ${C.concl}.`); }
  const truth = f.kind;
  void D;
  return choice(R, {
    id: `cxCheck-${n}`, family: 'cxCheck', prompt: `Is ${who}'s figure a counterexample to the claim?`,
    board: '\\text{counterexample?}', picture: card(lines),
    solution: [`It must have ${C.hyp} and fail to be ${C.concl}.`, `Here: ${C.why(f)}.${err ? ` ${who} made an arithmetic slip.` : ''}`],
  }, [
    { t: 'Yes: it meets the hypothesis and fails the conclusion', ok: truth === 'cx', mc: truth === 'hyp' ? MC.cxPremise : truth === 'holds' ? MC.cxHolds : undefined, say: truth === 'cx' ? 'Right: one such figure refutes the claim.' : `No: ${C.why(f)}.` },
    { t: 'No: it does not meet the hypothesis', ok: truth === 'hyp', say: truth === 'hyp' ? `Right: ${C.why(f)}, so the claim says nothing about it.` : `It does have ${C.hyp}.` },
    { t: 'No: the conclusion holds for it', ok: truth === 'holds', say: truth === 'holds' ? `Right: ${C.why(f)}.${err ? ' Recompute: the slip made it look like a counterexample.' : ''}` : `It is not ${C.concl}.` },
    { t: 'No: one counterexample cannot disprove a claim that is usually true', mc: MC.cxException, say: 'A single verified counterexample is enough to disprove a claim about every figure.' },
  ], { max: 3 });
});

// ===================== parameter-scope =====================
const FAM = [
  { pts: (a: string, b: string) => `(0, 0), (${a}, 0), (0, ${b})`, cond: (a: string, b: string) => `${a}, ${b} > 0`, right: 'right triangles', tri: true },
  { pts: (a: string, b: string) => `(−${a}, 0), (${a}, 0), (0, ${b})`, cond: (a: string, b: string) => `${a}, ${b} > 0`, right: 'isosceles triangles', tri: true },
  { pts: (a: string, b: string, c: string) => `(0, 0), (${a}, 0), (${b}, ${c})`, cond: (a: string, _b: string, c: string) => `${a} > 0, ${c} ≠ 0`, right: 'every triangle', tri: true },
  { pts: (a: string, b: string) => `(0, 0), (${a}, 0), (${a}, ${b}), (0, ${b})`, cond: (a: string, b: string) => `${a}, ${b} > 0`, right: 'rectangles', tri: false },
  { pts: (a: string, b: string, c: string) => `(0, 0), (${a}, 0), (${a} + ${b}, ${c}), (${b}, ${c})`, cond: (a: string, _b: string, c: string) => `${a} > 0, ${c} ≠ 0`, right: 'every parallelogram', tri: false },
  { pts: (a: string) => `(0, 0), (${a}, 0), (${a}, ${a}), (0, ${a})`, cond: (a: string) => `${a} > 0`, right: 'squares', tri: false },
];
export const paramFam: Gen = (R, n) => retry(() => {
  const F = FAM[n % FAM.length]!, [a, b, c] = pickOf(R, LETTERS);
  const names = F.tri ? ['every triangle', 'right triangles', 'isosceles triangles', 'equilateral triangles'] : ['every parallelogram', 'rectangles', 'squares', 'rhombuses'];
  const general = F.tri ? 'every triangle' : 'every parallelogram';
  return choice(R, {
    id: `paramFam-${n}`, family: 'paramFam', prompt: `The vertices ${F.pts(a, b, c)}, with ${F.cond(a, b, c)}, describe which figures (up to moving them)?`,
    board: `\\text{${F.pts(a, b, c).replace(/−/g, '-')}}`, picture: card([`Vertices: ${F.pts(a, b, c)}.`, `Only condition: ${F.cond(a, b, c)}.`]),
    solution: ['Read what the coordinates force: a zero coordinate on an axis, a repeated letter, a shared coordinate.', `These force exactly: ${F.right}.`],
  }, names.map(nm => ({
    t: `${nm[0]!.toUpperCase()}${nm.slice(1)}`, ok: nm === F.right,
    mc: nm === F.right ? undefined : nm === general ? MC.letters : undefined,
    say: nm === F.right ? `Right: the coordinates force ${F.right}${F.right === general ? ' and nothing more' : ''}.` : nm === general ? 'Letters do not guarantee generality: these coordinates build in an extra property.' : `The coordinates do not force ${nm}${F.right === general ? '' : ', or they force more'}.`,
  })), { max: 3 });
});
export const nondegen: Gen = (R, n) => retry(() => {
  const [a, b, c] = pickOf(R, LETTERS), v = n % 3;
  const set = v === 0 ? { pts: `(0, 0), (${a}, 0), (${b}, ${c})`, what: 'a triangle', need: `${c} ≠ 0`, why: `${c} = 0 puts all three points on the x-axis` , bad: [`${b} ≠ 0`, `${b} ≠ ${a}`] }
    : v === 1 ? { pts: `(0, 0), (${a}, 0), (${a} + ${b}, ${c}), (${b}, ${c})`, what: 'a parallelogram', need: `${c} ≠ 0`, why: `${c} = 0 flattens all four points onto the x-axis`, bad: [`${b} ≠ 0`, `${b} > 0`] }
      : { pts: `(0, 0), (${a}, 0), (${a}, ${b}), (0, ${b})`, what: 'a rectangle', need: `${b} ≠ 0`, why: `${b} = 0 puts all four points on the x-axis`, bad: [`${b} ≠ ${a}`, `${b} > ${a}`] };
  return choice(R, {
    id: `nondegen-${n}`, family: 'nondegen', prompt: `With ${a} > 0, the points ${set.pts} should be the vertices of ${set.what}. Which condition is needed?`,
    board: `\\text{${set.pts}}`, picture: card([`Points: ${set.pts}, with ${a} > 0.`]),
    solution: [`The figure collapses when its points are collinear: ${set.why}.`, `So the placement needs ${set.need}, and nothing else.`],
  }, [
    { t: set.need, ok: true, say: `Right: ${set.why}.` },
    ...set.bad.map(t => ({ t, say: 'That case still gives a genuine figure: it is not a condition the placement needs.' })),
    { t: 'None: letters stand for any numbers', mc: MC.letters, say: `Some values flatten the figure: ${set.why}.` },
  ], { max: 3 });
});

// ===================== placement-invariance =====================
export const preserved: Gen = (R, n) => retry(() => {
  const rot = n % 2 === 1, A0 = ipt(R, -4, 4), B0 = add(A0, [nz(R, 2, 4), nz(R, -3, 3)]);
  const h = nz(R, -5, 5), k = nz(R, -5, 5);
  const move = rot ? 'rotated 90° counterclockwise about the origin' : `translated ${h > 0 ? 'right' : 'left'} ${Math.abs(h)} and ${k > 0 ? 'up' : 'down'} ${Math.abs(k)}`;
  const opts: Opt[] = rot ? [
    { t: 'The slope of AB', ok: true, say: 'Right: a quarter turn turns every direction, so slopes change (a slope m becomes −1/m).' },
    { t: 'The length of AB', mc: MC.kept, say: 'A rotation keeps every length.' },
    { t: 'The measure of ∠ABC', mc: MC.kept, say: 'A rotation keeps every angle.' },
    { t: 'The area of triangle ABC', mc: MC.kept, say: 'A rotation keeps every length, so the area stays the same.' },
  ] : [
    { t: 'The coordinates of A', ok: true, say: `Right: every point moves by (${fmt(h)}, ${fmt(k)}).` },
    { t: 'The slope of AB', mc: MC.kept, say: 'A translation keeps every direction, so slopes stay the same.' },
    { t: 'The length of AB', mc: MC.kept, say: 'A translation keeps every length.' },
    { t: 'Whether AB ⊥ BC', mc: MC.kept, say: 'Angles are kept, so perpendicular sides stay perpendicular.' },
  ];
  return choice(R, {
    id: `preserved-${n}`, family: 'preserved', prompt: `Triangle ABC with ${ptN('A', A0)}, ${ptN('B', B0)} is ${move}. Which of these is different for the image?`,
    board: `\\text{${rot ? 'rotate 90°' : `translate by (${fmt(h)}, ${fmt(k)})`.replace(/−/g, '-')}}`,
    picture: { plane: plane({ pts: [{ key: 'A', at: A0, name: 'A' }, { key: 'B', at: B0, name: 'B' }], segs: [{ key: 'ab', a: A0, b: B0, col: 'first' }] }, { segs: [{ key: 'ab2', a: rot ? [-A0[1], A0[0]] : add(A0, [h, k]), b: rot ? [-B0[1], B0[0]] : add(B0, [h, k]), col: 'link' }] }) },
    solution: [`${rot ? 'A rotation' : 'A translation'} keeps lengths and angle measures, so midpoints, parallelism and perpendicularity are kept.`, rot ? 'What changes: the coordinates and the slopes (directions turn).' : 'What changes: the coordinates (directions do not turn, so slopes are kept).'],
  }, opts, { max: 3 });
});
export const whyMove: Gen = (R, n) => retry(() => {
  const W = pickOf(R, [{ what: 'a vertex of the triangle at the origin', kind: 'triangle' }, { what: 'one side of the parallelogram on the positive x-axis', kind: 'parallelogram' }, { what: 'one vertex of the rectangle at the origin', kind: 'rectangle' }, { what: 'the right angle of the right triangle at the origin', kind: 'right triangle' }]);
  const what = W.what, kind = W.kind;
  return choice(R, {
    id: `whyMove-${n}`, family: 'whyMove', prompt: `A proof about every ${kind} starts: "Place ${what}." Why is that allowed?`,
    board: '\\text{why may we move it?}', picture: card([`"Place ${what}."`]),
    solution: ['Translations and rotations keep every length and angle measure, so they keep midpoints, parallels and right angles too.', `So the claim proved for the moved copy is true for the original ${kind}.`],
  }, [
    { t: 'Moving it keeps every length and angle, so what is proved for the copy holds for the original', ok: true, say: 'Right: the relations in the claim do not change when the figure moves.' },
    { t: `It is not allowed: the proof then covers only the ${kind} at that spot`, mc: MC.drawnCase, say: `Every ${kind} can be moved there without changing anything the claim is about.` },
    { t: 'Moving changes the coordinates, so the lengths change but the angles stay', mc: MC.kept, say: 'Coordinates change, but lengths do not: a translation or rotation is rigid.' },
    { t: `Every ${kind} already has a vertex at the origin`, say: 'Figures can sit anywhere; we choose to move this one.' },
  ], { max: 3 });
});

// ===================== general-placement =====================
const PLACE = {
  parallelogram: { right: (a: string, b: string, c: string) => `(0, 0), (${a}, 0), (${a} + ${b}, ${c}), (${b}, ${c})`, wrong: [
    { f: (a: string, _b: string, c: string) => `(0, 0), (${a}, 0), (${a}, ${c}), (0, ${c})`, mc: MC.special, why: 'That builds in right angles: only rectangles.' },
    { f: (a: string) => `(0, 0), (${a}, 0), (${a}, ${a}), (0, ${a})`, mc: MC.special, why: 'That is a square: far more than a parallelogram.' },
    { f: (a: string, b: string, c: string) => `(0, 0), (${a}, 0), (${b}, ${c}), (${c}, ${b})`, why: 'Those points need not form a parallelogram at all.' }] },
  triangle: { right: (a: string, b: string, c: string) => `(0, 0), (${a}, 0), (${b}, ${c})`, wrong: [
    { f: (a: string, _b: string, c: string) => `(0, 0), (${a}, 0), (0, ${c})`, mc: MC.special, why: 'That builds in a right angle at the origin.' },
    { f: (a: string, _b: string, c: string) => `(−${a}, 0), (${a}, 0), (0, ${c})`, mc: MC.special, why: 'That builds in two congruent sides: only isosceles triangles.' },
    { f: (a: string) => `(0, 0), (${a}, 0), (${a}, ${a})`, mc: MC.special, why: 'That is an isosceles right triangle only.' }] },
  rectangle: { right: (a: string, b: string) => `(0, 0), (${a}, 0), (${a}, ${b}), (0, ${b})`, wrong: [
    { f: (a: string) => `(0, 0), (${a}, 0), (${a}, ${a}), (0, ${a})`, mc: MC.special, why: 'That builds in equal sides: only squares.' },
    { f: (a: string, b: string, c: string) => `(0, 0), (${a}, 0), (${a} + ${b}, ${c}), (${b}, ${c})`, why: 'That is any parallelogram: the right angles are not built in.' },
    { f: (a: string, b: string) => `(0, 0), (${a}, 0), (${b}, ${a}), (0, ${b})`, why: 'Those points need not form a rectangle.' }] },
} as const;
export const placeGen: Gen = (R, n) => retry(() => {
  const kind = (['parallelogram', 'triangle', 'rectangle'] as const)[n % 3]!, T = PLACE[kind], [a, b, c] = pickOf(R, LETTERS);
  return choice(R, {
    id: `placeGen-${n}`, family: 'placeGen', prompt: `Which placement represents every ${kind} (after moving it), without assuming anything more? Letters are any numbers that keep the figure from collapsing.`,
    board: `\\text{every ${kind}}`, picture: card([`Goal: one placement that covers every ${kind}.`]),
    solution: ['Put one vertex at the origin and one side on the x-axis: moving the figure there changes nothing.', `Then use only the letters the family needs: ${T.right(a, b, c)}.`],
  }, [
    { t: T.right(a, b, c), ok: true, say: `Right: it covers every ${kind} and imposes nothing extra.` },
    ...T.wrong.map(w => ({ t: w.f(a, b, c), mc: 'mc' in w ? w.mc : undefined, say: w.why })),
  ], { max: 3 });
});
export const placeFourth: Gen = (R, n) => retry(() => {
  const [a, b, c] = pickOf(R, LETTERS);
  if (n % 2 === 0) {
    return choice(R, {
      id: `placeFourth-${n}`, family: 'placeFourth', prompt: `Parallelogram OABC (vertices in order) has O(0, 0), A(${a}, 0) and C(${b}, ${c}). What are the coordinates of B?`,
      board: `O(0, 0) \\quad A(${a}, 0) \\quad C(${b}, ${c})`, picture: card([`Parallelogram OABC: O(0, 0), A(${a}, 0), C(${b}, ${c}).`, 'B is opposite O.']),
      solution: [`Opposite sides are parallel and congruent: from C, move the same way as from O to A.`, `B = C + (${a}, 0) = (${a} + ${b}, ${c}).`],
    }, [
      { t: `(${a} + ${b}, ${c})`, ok: true, say: 'Right: OB and AC then share the midpoint too.' },
      { t: `(${a}, ${c})`, mc: MC.special, say: `That makes AB vertical: a right angle the parallelogram need not have.` },
      { t: `(${b} − ${a}, ${c})`, say: 'That goes the wrong way from C: B is reached from C by adding OA.' },
      { t: `(${a} + ${b}, ${c} + ${a})`, say: 'OA is horizontal, so only the x-coordinate changes.' },
    ], { max: 3 });
  }
  return choice(R, {
    id: `placeFourth-${n}`, family: 'placeFourth', prompt: `Triangle O(0, 0), A(2${a}, 0), B(2${b}, 2${c}). Why use 2${a}, 2${b}, 2${c}, and what is the midpoint of AB?`,
    board: `O(0, 0) \\quad A(2${a}, 0) \\quad B(2${b}, 2${c})`, picture: card([`Triangle O(0, 0), A(2${a}, 0), B(2${b}, 2${c}).`]),
    solution: ['Doubling the letters keeps every triangle possible and makes the halves whole.', `Midpoint of AB = ((2${a} + 2${b})/2, (0 + 2${c})/2) = (${a} + ${b}, ${c}).`],
  }, [
    { t: `No fractions in the midpoints: (${a} + ${b}, ${c})`, ok: true, say: 'Right: still every triangle, and the midpoints come out clean.' },
    { t: `It makes the triangle isosceles: (${a} + ${b}, ${c})`, mc: MC.special, say: `Doubling all the letters imposes nothing: every triangle still fits.` },
    { t: `No fractions in the midpoints: (2${a} + 2${b}, 2${c})`, mc: MC.halfOne, say: 'Halve the sums: the midpoint averages the two endpoints.' },
    { t: `It covers only bigger triangles: (${a} + ${b}, ${c})`, mc: MC.drawnCase, say: `${a}, ${b}, ${c} can be any numbers, so 2${a}, 2${b}, 2${c} can be too.` },
  ], { max: 3 });
});

// ===================== general-coordinate-proof =====================
export const genProofStep: Gen = (R, n) => retry(() => {
  const [a, b, c] = pickOf(R, LETTERS), v = n % 4;
  if (v === 0) return choice(R, {
    id: `genProofStep-${n}`, family: 'genProofStep', prompt: 'Claim: the diagonals of every parallelogram bisect each other. What is the midpoint of OB?',
    board: '\\text{midpoint of } OB', picture: card([`Parallelogram O(0, 0), A(${a}, 0), B(${a} + ${b}, ${c}), C(${b}, ${c}).`, `Midpoint of AC = ((${a} + ${b})/2, ${c}/2).`, 'Midpoint of OB = ?']),
    solution: [`Average O(0, 0) and B(${a} + ${b}, ${c}) coordinate by coordinate.`, `((0 + ${a} + ${b})/2, (0 + ${c})/2) = ((${a} + ${b})/2, ${c}/2): the same point as the midpoint of AC.`],
  }, [
    { t: `((${a} + ${b})/2, ${c}/2)`, ok: true, say: 'Right: the same as the midpoint of AC, so the diagonals bisect each other.' },
    { t: `(${a} + ${b}, ${c})`, say: 'That is B itself: halve the sums to get the midpoint.' },
    { t: `(${a} + ${b}/2, ${c}/2)`, mc: MC.halfOne, say: `Halve the whole sum ${a} + ${b}, not just ${b}.` },
    { t: `((${a} − ${b})/2, ${c}/2)`, say: 'A midpoint adds the coordinates before halving.' },
  ], { max: 3 });
  if (v === 1) return choice(R, {
    id: `genProofStep-${n}`, family: 'genProofStep', prompt: 'Claim: a triangle\'s midsegment is parallel to the third side. What is the slope of AB?',
    board: '\\text{slope of } AB', picture: card([`Triangle O(0, 0), A(2${a}, 0), B(2${b}, 2${c}), with ${b} ≠ ${a}.`, 'Slope of AB = (2' + c + ' − 0)/(2' + b + ' − 2' + a + ') = ?']),
    solution: [`Rise 2${c}, run 2${b} − 2${a} = 2(${b} − ${a}).`, `Cancel the common factor 2: ${c}/(${b} − ${a}).`],
  }, [
    { t: `${c}/(${b} − ${a})`, ok: true, say: 'Right: 2 is a factor of the top and of the whole bottom.' },
    { t: `${c}/(${b} − 2${a})`, mc: MC.cancels, say: `Only a factor of the whole bottom cancels: 2${b} − 2${a} = 2(${b} − ${a}).` },
    { t: `(${b} − ${a})/${c}`, say: 'Slope is rise over run, not run over rise.' },
    { t: `${c}/${b} − ${c}/${a}`, mc: MC.cancels, say: 'A fraction does not split over a difference in its denominator.' },
  ], { max: 3 });
  if (v === 2) return choice(R, {
    id: `genProofStep-${n}`, family: 'genProofStep', prompt: 'Claim: every rectangle has congruent diagonals. What is AC²?',
    board: 'AC^2', picture: card([`Rectangle O(0, 0), A(${a}, 0), B(${a}, ${b}), C(0, ${b}).`, `OB² = ${a}² + ${b}².`, 'AC² = ?']),
    solution: [`AC² = (0 − ${a})² + (${b} − 0)².`, `(−${a})² = ${a}², so AC² = ${a}² + ${b}² = OB².`],
  }, [
    { t: `${a}² + ${b}²`, ok: true, say: `Right: (−${a})² = ${a}², so AC² = OB².` },
    { t: `${b}² − ${a}²`, mc: MC.evenNeg, say: `(0 − ${a})² = (−${a})² = ${a}²: a square is never negative.` },
    { t: `(${b} − ${a})²`, mc: MC.diffSq, say: 'Square the x-difference and the y-difference separately, then add.' },
    { t: `${a} + ${b}`, mc: MC.adds, say: 'Square each difference and add the squares.' },
  ], { max: 3 });
  return choice(R, {
    id: `genProofStep-${n}`, family: 'genProofStep', prompt: 'Claim: a triangle\'s midsegment is half as long as the third side. M and N are the midpoints of OB and AB. What is MN?',
    board: 'MN', picture: card([`Triangle O(0, 0), A(2${a}, 0), B(2${b}, 2${c}), with ${a} > 0.`, `M = (${b}, ${c}), N = (${a} + ${b}, ${c}).`, 'MN = ?']),
    solution: [`M and N have the same y-coordinate, so MN is horizontal.`, `MN = (${a} + ${b}) − ${b} = ${a}, half of OA = 2${a}.`],
  }, [
    { t: `${a}`, ok: true, say: `Right: half of OA = 2${a}.` },
    { t: `2${a}`, say: 'That is OA itself. MN runs from x = ' + b + ' to x = ' + a + ' + ' + b + '.' },
    { t: `${a} + ${b}`, mc: MC.coordLen, say: `That is N's x-coordinate. Subtract M's: (${a} + ${b}) − ${b}.` },
    { t: `√(${a}² + ${c}²)`, say: 'M and N are at the same height: the length is just the x-difference.' },
  ], { max: 3 });
});
export const genProofEnd: Gen = (R, n) => retry(() => {
  const [a, b, c] = pickOf(R, LETTERS), v = n % 3;
  const set = v === 0 ? { setup: `Rectangle O(0, 0), A(${a}, 0), B(${a}, ${b}), C(0, ${b}).`, work: `OB² = ${a}² + ${b}² and AC² = (−${a})² + ${b}².`, concl: 'the diagonals of every rectangle are congruent', fam: 'rectangle' }
    : v === 1 ? { setup: `Parallelogram O(0, 0), A(${a}, 0), B(${a} + ${b}, ${c}), C(${b}, ${c}).`, work: `Midpoint of OB = ((${a} + ${b})/2, ${c}/2); midpoint of AC = ((${b} + ${a})/2, ${c}/2).`, concl: 'the diagonals of every parallelogram bisect each other', fam: 'parallelogram' }
      : { setup: `Triangle O(0, 0), A(2${a}, 0), B(2${b}, 2${c}); M(${b}, ${c}), N(${a} + ${b}, ${c}).`, work: `Slope MN = 0 = slope OA, and MN = ${a}, OA = 2${a}.`, concl: 'every midsegment is parallel to the third side and half as long', fam: 'triangle' };
  return choice(R, {
    id: `genProofEnd-${n}`, family: 'genProofEnd', prompt: 'The general computation is done. What does it show?',
    board: '\\text{what follows?}', picture: card([set.setup, set.work]),
    solution: [`The two results are equal for every value of the letters${v === 1 ? ` (${a} + ${b} = ${b} + ${a})` : v === 0 ? ` ((−${a})² = ${a}²)` : ''}.`, `The placement covers every ${set.fam}, so: ${set.concl}.`],
  }, [
    { t: `Proved: ${set.concl}`, ok: true, say: 'Right: general coordinates, exact algebra, every case.' },
    { t: v === 1 ? `Not proved: (${a} + ${b})/2 and (${b} + ${a})/2 are written differently` : v === 0 ? `Not proved: (−${a})² + ${b}² and ${a}² + ${b}² are written differently` : `Not proved: ${a} and 2${a} are different letters`, mc: MC.sameLook, say: v === 2 ? `${a} is exactly half of 2${a}: that is what the claim says.` : 'Different-looking expressions can be equal for every value: simplify them.' },
    { t: `Proved only after checking ${a} = 3, ${b} = 4, ${c} = 2`, mc: MC.numbersIn, say: 'Numbers would prove one case only; the letters already cover them all.' },
    { t: `Proved only for ${set.fam === 'triangle' ? 'triangles' : `${set.fam}s`} with a vertex at the origin`, mc: MC.drawnCase, say: 'Any one can be moved there without changing lengths, midpoints or slopes of its sides relative to each other.' },
  ], { max: 3 });
});

// ===================== prove-slope-criteria =====================
const SUB = ['₁', '₂'];
export const slopeProof: Gen = (R, n) => retry(() => {
  const v = n % 3, bL = pickOf(R, ['b', 'c', 'k', 'd']), mL = pickOf(R, ['m', 'a', 's']);
  const [b1, b2] = SUB.map(x => bL + x) as [string, string], [m1, m2] = SUB.map(x => mL + x) as [string, string];
  const tb = (x: string) => x.replace('₁', '_1').replace('₂', '_2');
  if (v === 0) return choice(R, {
    id: `slopeProof-${n}`, family: 'slopeProof', prompt: `Lines y = ${mL}x + ${b1} and y = ${mL}x + ${b2} have ${b1} ≠ ${b2}. Why do they share no point?`,
    board: `y = ${mL}x + ${tb(b1)} \\quad y = ${mL}x + ${tb(b2)}`, picture: card([`Lines y = ${mL}x + ${b1} and y = ${mL}x + ${b2}, with ${b1} ≠ ${b2}.`, 'Claim: they are parallel (no common point).']),
    solution: ['A common point would satisfy both equations at the same x.', `Then ${mL}x + ${b1} = ${mL}x + ${b2}, so ${b1} = ${b2}: impossible.`],
  }, [
    { t: `A common point would give ${mL}x + ${b1} = ${mL}x + ${b2}, so ${b1} = ${b2}, which is false`, ok: true, say: 'Right: assuming a common point leads to a contradiction.' },
    { t: 'Equal slopes always make two parallel lines', mc: MC.eqDistinct, say: `Equal slopes can also give one line (when ${b1} = ${b2}): that is why ${b1} ≠ ${b2} is needed.` },
    { t: 'At x = 0 the y-values differ, so they never meet', mc: MC.examples, say: 'One x-value shows nothing about the others: argue for every x.' },
  ], { keep: false });
  if (v === 1) return choice(R, {
    id: `slopeProof-${n}`, family: 'slopeProof', prompt: `Lines y = ${m1}x + ${b1} and y = ${m2}x + ${b2} have ${m1} ≠ ${m2}. Where do they meet?`,
    board: `${tb(m1)} x + ${tb(b1)} = ${tb(m2)} x + ${tb(b2)}`, picture: card([`${m1}x + ${b1} = ${m2}x + ${b2}, with ${m1} ≠ ${m2}.`, 'Solve for x: so lines with different slopes are never parallel.']),
    solution: [`Gather the x-terms: ${m1}x − ${m2}x = ${b2} − ${b1}, so (${m1} − ${m2})x = ${b2} − ${b1}.`, `${m1} − ${m2} ≠ 0, so divide: x = (${b2} − ${b1})/(${m1} − ${m2}).`],
  }, [
    { t: `x = (${b2} − ${b1})/(${m1} − ${m2})`, ok: true, say: `Right: and ${m1} − ${m2} ≠ 0, so there is exactly one meeting point.` },
    { t: `x = (${b1} − ${b2})/(${m1} − ${m2})`, say: `Check the signs: (${m1} − ${m2})x = ${b2} − ${b1}.` },
    { t: `x = (${b2} − ${b1})/(${m1} + ${m2})`, say: `Gathering ${m1}x − ${m2}x gives (${m1} − ${m2})x.` },
    { t: `x = (${b2} + ${b1})/(${m1} − ${m2})`, say: `Moving ${b1} across changes its sign: ${b2} − ${b1}.` },
  ], { max: 3 });
  const [p, qq] = pickOf(R, [['p', 'q'], ['a', 'b'], ['h', 'k'], ['r', 's']] as [string, string][]);
  return choice(R, {
    id: `slopeProof-${n}`, family: 'slopeProof', prompt: `The slope criteria cover nonvertical lines. How are two different vertical lines x = ${p} and x = ${qq} (${p} ≠ ${qq}) handled?`,
    board: `x = ${p} \\quad x = ${qq}`, picture: card([`x = ${p} and x = ${qq}, with ${p} ≠ ${qq}.`, 'Neither line has a slope.']),
    solution: [`A point on both lines would have x = ${p} and x = ${qq} at once.`, `${p} ≠ ${qq}, so there is none: the lines are parallel, shown without slopes.`],
  }, [
    { t: `Separately: no point has x = ${p} and x = ${qq}, so they are parallel`, ok: true, say: 'Right: the excluded case gets its own short argument.' },
    { t: 'They are not parallel: lines without slopes cannot be compared', mc: MC.zeroK, say: 'No slope does not mean no direction: both are vertical.' },
    { t: 'They are parallel because both slopes equal infinity', mc: MC.infinity, say: 'Infinity is not a slope: argue without slopes.' },
  ], { keep: false });
});
export const perpProof: Gen = (R, n) => retry(() => {
  const v = n % 2, k = pickOf(R, [1, 2, 3, 4]), K = k === 1 ? '' : String(k), kk = k * k, KK = kk === 1 ? '' : String(kk);
  const setup = ['Translate so the lines meet at O(0, 0) (slopes do not change).', `Take P(${k}, ${K}m₁) on the first line and Q(${k}, ${K}m₂) on the second.`, `OP² = ${kk} + ${KK}m₁², OQ² = ${kk} + ${KK}m₂².`];
  const pq = `${KK}(m₁ − m₂)²`;
  if (v === 0) return choice(R, {
    id: `perpProof-${n}`, family: 'perpProof', prompt: 'Proving the perpendicular slope criterion: what is PQ²?',
    board: `P(${k}, ${K}m_1) \\quad Q(${k}, ${K}m_2)`, picture: card([...setup, 'PQ² = ?']),
    solution: ['P and Q have the same x-coordinate, so PQ is vertical.', `PQ² = (${k} − ${k})² + (${K}m₁ − ${K}m₂)² = ${pq}.`],
  }, [
    { t: pq, ok: true, say: 'Right: the x-difference is 0.' },
    { t: `${KK}m₁² − ${KK}m₂²`, mc: MC.diffSq, say: 'Subtract first, then square the difference.' },
    { t: `${kk} + ${pq}`, say: `The x-difference is ${k} − ${k} = 0, so it adds nothing.` },
    { t: `${KK}(m₁ + m₂)²`, say: 'A distance squares the difference of the coordinates.' },
  ], { max: 3 });
  return choice(R, {
    id: `perpProof-${n}`, family: 'perpProof', prompt: '∠POQ is right exactly when OP² + OQ² = PQ². What does that equation simplify to?',
    board: k === 1 ? '(1 + m_1^2) + (1 + m_2^2) = (m_1 - m_2)^2' : `(${kk} + ${kk}m_1^2) + (${kk} + ${kk}m_2^2) = ${kk}(m_1 - m_2)^2`, picture: card([...setup, `PQ² = ${pq}.`]),
    solution: [`${k === 1 ? 'Expand' : `Divide by ${kk} and expand`}: 2 + m₁² + m₂² = m₁² − 2m₁m₂ + m₂².`, 'Cancel m₁² and m₂²: 2 = −2m₁m₂, so m₁m₂ = −1.'],
  }, [
    { t: 'm₁m₂ = −1', ok: true, say: 'Right: and since every step goes both ways, it is "exactly when".' },
    { t: 'm₁m₂ = 1', say: 'Check the sign: 2 = −2m₁m₂.' },
    { t: 'm₁ = −m₂', mc: MC.perpOpp, say: 'Opposite slopes are not enough: the product must be −1.' },
    { t: 'm₁ = 1/m₂', mc: MC.perpRecip, say: 'Reciprocal slopes are not enough: the sign must change too.' },
  ], { max: 3 });
});
export const iffBoth: Gen = (R, n) => retry(() => {
  const perp = n % 2 === 0, k = int(R, 2, 6), b1 = int(R, -5, 5), b2 = b1 + int(R, 1, 6);
  const bt = (b: number) => (b === 0 ? '' : ` ${b < 0 ? '−' : '+'} ${Math.abs(b)}`);
  const shown = perp ? 'if m₁m₂ = −1, then the lines are perpendicular' : 'if m₁ = m₂ (and b₁ ≠ b₂), then the lines are parallel';
  const full = perp ? 'two nonvertical lines are perpendicular exactly when m₁m₂ = −1' : 'two distinct nonvertical lines are parallel exactly when m₁ = m₂';
  const other = perp ? 'if the lines are perpendicular, then m₁m₂ = −1' : 'if two distinct nonvertical lines are parallel, then m₁ = m₂';
  return choice(R, {
    id: `iffBoth-${n}`, family: 'iffBoth', prompt: `A proof shows: ${shown}. To prove "${full}", what is still needed?`,
    board: '\\text{exactly when}', picture: card([`Proved: ${shown}.`, `Goal: ${full}.`]),
    solution: ['"Exactly when" is two claims: each side implies the other.', `Still to prove: ${other}.`],
  }, [
    { t: `The other direction: ${other}`, ok: true, say: 'Right: both directions together make "exactly when".' },
    { t: 'Nothing: one direction proves "exactly when"', mc: MC.iff, say: '"Exactly when" also needs the converse direction.' },
    { t: perp ? `An example, such as slopes ${k} and −1/${k}` : `An example, such as y = ${k}x${bt(b1)} and y = ${k}x${bt(b2)}`, mc: MC.examples, say: 'An example proves nothing general: prove the converse direction.' },
    { t: perp ? 'The case of a horizontal and a vertical line' : 'The case of two vertical lines', say: 'That case is excluded from the statement (nonvertical lines): it is handled separately, not here.' },
  ], { max: 3 });
});

// ===================== critique-argument =====================
export const critique: Gen = (R, n) => retry(() => {
  const c = n % 4, who = pickOf(R, PEOPLE), [a, b] = pickOf(R, LETTERS);
  let claim: string, lines: string[], truth: 'one' | 'special' | 'valid';
  if (c === 0) {
    const w = int(R, 3, 8), h = int(R, 2, 6);
    claim = 'every rectangle has congruent diagonals';
    lines = [`Take A(0, 0), B(${w}, 0), C(${w}, ${h}), D(0, ${h}).`, `AC² = ${w * w + h * h} and BD² = ${w * w + h * h}, so the diagonals are congruent.`, 'So every rectangle has congruent diagonals.']; truth = 'one';
  } else if (c === 1) {
    claim = 'the diagonals of every parallelogram bisect each other';
    lines = [`Place the parallelogram at O(0, 0), A(${a}, 0), B(${a}, ${b}), C(0, ${b}).`, `Midpoint of OB = midpoint of AC = (${a}/2, ${b}/2).`, 'So the diagonals of every parallelogram bisect each other.']; truth = 'special';
  } else if (c === 2) {
    claim = 'every rectangle has congruent diagonals';
    lines = [`Place the rectangle at O(0, 0), A(${a}, 0), B(${a}, ${b}), C(0, ${b}), with ${a}, ${b} > 0.`, `OB² = ${a}² + ${b}² and AC² = (−${a})² + ${b}² = ${a}² + ${b}².`, 'So OB = AC for every rectangle.']; truth = 'valid';
  } else {
    const o = ipt(R, -2, 1), k = pickOf(R, [1, 2]);
    const T = ([[0, 0], [6, 0], [5, 3], [1, 3]] as V[]).map(p => add(mul(p, k), o));
    claim = 'every quadrilateral with congruent diagonals is a rectangle';
    lines = [`Take ${quad(T)}.`, `AC² = BD² = ${d2(T[0]!, T[2]!)}, but AB has slope 0 and BC has slope −3, so ∠B is not right.`, 'So the claim is false.']; truth = 'valid';
    if (d2(T[0]!, T[2]!) !== d2(T[1]!, T[3]!)) throw new Error('critique: trapezoid diagonals');
  }
  const proves = c === 3 ? 'disproves' : 'proves';
  return choice(R, {
    id: `critique-${n}`, family: 'critique', prompt: `${who} says this argument ${proves} the claim that ${claim}. Is ${who} right?`,
    board: '\\text{valid?}', picture: card([`Claim: ${claim}.`, ...lines]),
    solution: [c === 0 ? 'The argument checks one rectangle, but the claim is about every rectangle.' : c === 1 ? 'The placement has right angles built in: it covers rectangles only, not every parallelogram.' : c === 2 ? 'The placement covers every rectangle and the algebra is exact.' : 'The figure meets the hypothesis and fails the conclusion: one counterexample disproves a universal claim.', truth === 'valid' ? 'So the argument is valid.' : 'So the argument does not prove the claim.'],
  }, [
    { t: `Yes: the argument is valid`, ok: truth === 'valid', mc: truth === 'one' ? MC.examples : truth === 'special' ? MC.letters : undefined, say: truth === 'valid' ? 'Right: it settles the claim.' : truth === 'one' ? 'One rectangle checked is not every rectangle.' : 'Letters are not enough: this placement is a rectangle, a special parallelogram.' },
    { t: 'No: it checks only one example', ok: truth === 'one', say: truth === 'one' ? 'Right: the claim is about every rectangle.' : c === 3 ? 'One example is exactly what a disproof needs.' : 'It uses letters, not one example.' },
    { t: 'No: its placement assumes a special case', ok: truth === 'special', say: truth === 'special' ? `Right: (0, 0), (${a}, 0), (${a}, ${b}), (0, ${b}) builds in right angles.` : 'Nothing extra is built in here.' },
    { t: 'No: one example cannot settle a claim either way', mc: MC.cxException, say: c === 3 ? 'A verified counterexample does settle it: the claim is false.' : 'That is not the problem here.' },
  ], { max: 3 });
});

// ===================== audit-omitted-cases =====================
export const audit: Gen = (R, n) => retry(() => {
  const c = n % 3, who = pickOf(R, PEOPLE), [a, b, cc] = pickOf(R, LETTERS);
  let lines: string[], opts: Opt[];
  if (c === 0) {
    lines = [`Claim: the midpoint M of any segment PQ lies on line PQ.`, `${who}: slope PM = (y_M − y_P)/(x_M − x_P) = ((y_Q − y_P)/2)/((x_Q − x_P)/2) = slope PQ, so M is on line PQ.`];
    opts = [
      { t: 'Vertical segments, where x_Q − x_P = 0', ok: true, say: 'Right: the argument divides by x_Q − x_P, which is 0 for a vertical segment.' },
      { t: 'Horizontal segments, where y_Q − y_P = 0', say: 'Dividing 0 by a nonzero run is fine: horizontal segments work.' },
      { t: 'Segments with negative coordinates', say: 'Negative coordinates cause no problem in these formulas.' },
      { t: 'None: the argument covers every segment', mc: MC.divisor, say: 'It divides by x_Q − x_P, which can be 0.' },
    ];
  } else if (c === 1) {
    lines = ['Claim: in every rectangle ABCD, consecutive sides are perpendicular.', `${who}: at each corner, (slope of one side) × (slope of the next) = −1.`];
    opts = [
      { t: 'Rectangles with vertical sides, whose slopes are undefined', ok: true, mc: undefined, say: 'Right: a rectangle with horizontal and vertical sides has no slope product to compute.' },
      { t: 'Rectangles with negative coordinates', say: 'Signs of coordinates do not matter for slopes.' },
      { t: 'Squares', say: 'Squares are rectangles; the slope argument works for a tilted square.' },
      { t: 'None: every rectangle is covered', mc: MC.vertSkip, say: 'A side can be vertical: its slope is undefined, so the product test cannot run.' },
    ];
  } else {
    lines = [`Triangle O(0, 0), A(${a}, 0), B(${b}, ${cc}) with ${a} > 0.`, `${who} divides by ${cc} in −${b}/${cc}, the slope of the altitude from A (perpendicular to OB), and says this covers every triangle.`];
    opts = [
      { t: `None: ${cc} ≠ 0 holds for every triangle`, ok: true, say: `Right: ${cc} = 0 would put B on the x-axis, and then there is no triangle at all.` },
      { t: `Triangles with ${cc} = 0`, mc: MC.divisor, say: `${cc} = 0 is not a triangle: the case is excluded by the claim itself.` },
      { t: `Triangles with ${b} = 0`, say: `${b} = 0 gives a right triangle, but nothing divides by ${b}.` },
      { t: `Triangles with ${b} > ${a}`, say: 'Those are fine: nothing in the argument depends on that.' },
    ];
  }
  return choice(R, {
    id: `audit-${n}`, family: 'audit', prompt: 'Which allowed case does this argument miss?',
    board: '\\text{missed case?}', picture: card(lines),
    solution: ['Look for every division and every slope: each needs a nonzero denominator.', c === 0 ? 'Here the run x_Q − x_P can be 0.' : c === 1 ? 'Here a side can be vertical.' : `Here ${cc} ≠ 0 is guaranteed by being a triangle.`],
  }, opts, { max: 3 });
});

void mid; void pt;
