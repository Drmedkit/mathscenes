// famB.ts: families for stage 2 of "Triangle congruence": why SAS / ASA / SSS work (rigid motions, two circles),
// writing the correspondence, shared parts, hidden angle pairs, definitions, overlapping triangles, short proofs, CPCTC.
import { type Gen, type Opt, choiceItem, fitted, numItem, pick, r, shuffle } from '../geometry-foundations/kit';
import { type Pt, at, dist } from '../geometry-foundations/geo';
import { htm as htm0 } from '../geometry-foundations/proofs';
/** board TeX -> panel text (the course's htm, plus triangles) */
const htm = (s: string) => htm0(s.replace(/\\triangle\s*/g, '△'));
import { type Part, type PMark, CRIT_WORD, PERMS, names2, relabeler, tw, mapFig, angN, angle, buildFig, circleSegs, critsOf, moveT, beside, pairFig, pairHtml, pairTex, permName, randTri, segN, side, sideName, triN, triT, turnT } from './tri';
import { type Pattern, choice, choiceT, critOpts, makePair, numT } from './pairs';
import { MC, RS, type RKey, type TProof, BANK, HIDDEN_BANK, makeProof, validOrder } from './triProofs';
import { bowtie, kite, overlapAngle, overlapBase, parZ } from './configs';


const stmt = (n1: string, n2: string) => `${triN(n1)} ≅ ${triN(n2)}`;
const stmtT = (n1: string, n2: string) => `${triT(n1)} \\cong ${triT(n2)}`;
const marksFor = (ps: readonly Part[]): PMark[] => { let s = 0, a = 0; return ps.map(p => (p.k === 's' ? { k: 's' as const, i: p.i, n: ++s } : p.right ? { k: 'a' as const, i: p.i, box: true } : { k: 'a' as const, i: p.i, n: ++a })); };

// ---------- the rigid-motion arguments (SAS, ASA, SSS) ----------
interface MStep { t: string; why: string; right: string; wrong: { t: string; mc?: string; say: string }[] }
function motionSteps(c: 'SAS' | 'ASA' | 'SSS', a: string, b: string): MStep[] {
  // a = ABC, b = DEF (vertex 1 is where SAS's angle / ASA's side starts)
  const [A, B, C] = [...a] as [string, string, string], [D, E, F] = [...b] as [string, string, string];
  if (c === 'SAS') return [
    { t: `Slide ${triN(a)} so that ${B} lands on ${E}.`, why: `Why may we start by moving ${B} onto ${E}?`, right: 'A translation can carry any point onto any other point', wrong: [{ t: `Because ${B} and ${E} look alike`, mc: MC.wholeFig, say: 'Looks are not a reason; a slide can move any point anywhere.' }, { t: `Because ${segN(A + B)} ≅ ${segN(D + E)}`, say: 'Any point can be slid onto any point; the side pair is used in the next step.' }] },
    { t: `Turn about ${E} until ray ${B}${A} lies along ray ${E}${D}: ${A} lands on ${D}.`, why: `Why does ${A} land exactly on ${D}?`, right: `${segN(A + B)} ≅ ${segN(D + E)}, and a rigid motion keeps lengths`, wrong: [{ t: `Because ∠${B} ≅ ∠${E}`, say: 'The angle pair puts the other side on the right ray; the distance along the ray comes from the side pair.' }, { t: 'Because the triangles look congruent', mc: MC.wholeFig, say: 'Saying the whole triangle fits is what we want to show; each point needs its own reason.' }] },
    { t: `If ${C} is on the other side of line ${D}${E} from ${F}, reflect across line ${D}${E}.`, why: 'Why is a reflection allowed here?', right: 'A reflection is a rigid motion, and it keeps the points on line DE where they are'.replace('DE', D + E), wrong: [{ t: 'A flipped copy would not be congruent, so it is not allowed', mc: MC.flipped, say: 'Reflections are rigid motions: flipped copies are congruent.' }, { t: 'It is only needed in this drawing', mc: MC.examples, say: 'The argument covers both cases: same side (no reflection) or the other side (reflect).' }] },
    { t: `Now ray ${B}${C} lies along ray ${E}${F}, and ${C} lands on ${F}.`, why: `Why does ${C} land on ${F}?`, right: `∠${B} ≅ ∠${E} puts ray ${B}${C} along ray ${E}${F}, and ${segN(B + C)} ≅ ${segN(E + F)} fixes the point on it`, wrong: [{ t: `${segN(A + C)} ≅ ${segN(D + F)}`, mc: MC.circular, say: 'That pair is not given: it is what the congruence will give afterwards.' }, { t: 'All three vertices look matched', mc: MC.wholeFig, say: 'Each vertex needs a reason: the angle pair gives the ray, the side pair the point.' }] },
  ];
  if (c === 'ASA') return [
    { t: `Move ${triN(a)} so that ${segN(A + B)} lies on ${segN(D + E)}: ${A} on ${D}, ${B} on ${E}.`, why: `Why can ${A} land on ${D} and ${B} on ${E} at the same time?`, right: `${segN(A + B)} ≅ ${segN(D + E)}, and a rigid motion keeps lengths`, wrong: [{ t: `∠${A} ≅ ∠${D}`, say: 'The angle pair comes next; the endpoints match because the side pair is congruent.' }, { t: 'They look the same size', mc: MC.wholeFig, say: 'Looks are not a reason.' }] },
    { t: `If ${C} is on the other side of line ${D}${E} from ${F}, reflect across line ${D}${E}.`, why: 'Why reflect?', right: `So that ${C} and ${F} are on the same side of line ${D}${E}; a reflection is a rigid motion`, wrong: [{ t: 'A flipped copy is not congruent, so we must avoid it', mc: MC.flipped, say: 'Reflections are rigid motions.' }, { t: 'To make the triangle bigger', say: 'Rigid motions never change size.' }] },
    { t: `Now ray ${A}${C} lies along ray ${D}${F}, and ray ${B}${C} along ray ${E}${F}.`, why: 'Why do the rays line up?', right: `∠${A} ≅ ∠${D} and ∠${B} ≅ ∠${E}, on the same side of the shared side`, wrong: [{ t: `${segN(A + C)} ≅ ${segN(D + F)}`, mc: MC.circular, say: 'That pair is not given.' }, { t: 'The third angles match', say: 'The given angles are at the ends of the side: they fix the rays.' }] },
    { t: `${C} lands on ${F}.`, why: `Why does ${C} land on ${F}?`, right: `${C} lies on both rays, and the two rays meet in only one point: ${F}`, wrong: [{ t: `Because ${segN(A + C)} ≅ ${segN(D + F)}`, mc: MC.circular, say: 'That pair is not given; the two rays decide the point.' }, { t: 'Because the triangles look congruent', mc: MC.wholeFig, say: 'The reason is the meeting point of the two rays.' }] },
  ];
  return [
    { t: `Move ${triN(a)} so that ${segN(A + B)} lies on ${segN(D + E)}: ${A} on ${D}, ${B} on ${E}.`, why: 'Why can both endpoints match?', right: `${segN(A + B)} ≅ ${segN(D + E)}, and a rigid motion keeps lengths`, wrong: [{ t: 'Any two segments can be matched', say: 'Only segments of the same length.' }, { t: 'The triangles look congruent', mc: MC.wholeFig, say: 'Looks are not a reason.' }] },
    { t: `${C} keeps its distances: it lies on the circle about ${D} with radius ${A}${C} and on the circle about ${E} with radius ${B}${C}.`, why: 'Where can the image of C be?'.replace('C', C), right: `Where the two circles meet: at most two points, mirror images across line ${D}${E}`, wrong: [{ t: 'Anywhere on either circle', mc: MC.circlesUnrel, say: 'It must be on both circles at once.' }, { t: 'At up to four points where the circles cross', mc: MC.circlesMany, say: 'Two circles with different centers meet in at most two points.' }] },
    { t: `${F} is on both circles too, since ${segN(A + C)} ≅ ${segN(D + F)} and ${segN(B + C)} ≅ ${segN(E + F)}.`, why: `So where is ${C} now?`, right: `On ${F}, or on the mirror image of ${F} across line ${D}${E}`, wrong: [{ t: `Exactly on ${F}, always`, mc: MC.wholeFig, say: 'It might be the other meeting point, the mirror image.' }, { t: 'Anywhere: SSS only works for this drawing', mc: MC.examples, say: 'The circles argument works for every triangle.' }] },
    { t: `If ${C} is at the mirror point, reflect across line ${D}${E}: ${C} lands on ${F}.`, why: 'Why does the reflection finish the job?', right: `It keeps ${D} and ${E} and swaps the two meeting points`, wrong: [{ t: 'A reflection makes a different triangle', mc: MC.flipped, say: 'A reflection is a rigid motion.' }, { t: 'It is not needed', mc: MC.wholeFig, say: 'It is needed when C lands on the other meeting point.'.replace('C', C) }] },
  ];
}
function motionFig(R: () => number, c: 'SAS' | 'ASA' | 'SSS') {
  const pat = c as Pattern;
  // vertex 1 carries SAS's angle and starts ASA's / SSS's first side; the second triangle's letters in order
  const nm = names2(R);
  for (let t = 0; t < 30; t++) {
    const P = makePair(R, pat, 'col', { names: nm, scramble: false });
    const parts: Part[] = c === 'SAS' ? [{ k: 's', i: 2 }, { k: 'a', i: 1 }, { k: 's', i: 0 }] : c === 'ASA' ? [{ k: 'a', i: 0 }, { k: 's', i: 2 }, { k: 'a', i: 1 }] : [{ k: 's', i: 0 }, { k: 's', i: 1 }, { k: 's', i: 2 }];
    try { return { ...P, parts, fig: pairFig(P.T1, P.T2, P.n1, P.n2, marksFor(parts)) }; } catch { continue; }
  }
  throw new Error('motionFig');
}
const SG_CRIT: Record<string, 'SAS' | 'ASA' | 'SSS'> = { 'sas-rigid-motion': 'SAS', 'asa-rigid-motion': 'ASA', 'sss-rigid-motion': 'SSS' };
export const motionWhy: Gen = (R, n, sg) => fitted('motionWhy', () => {
  const c = SG_CRIT[sg ?? ''] ?? pick(R, ['SAS', 'ASA', 'SSS'] as const);
  const P = motionFig(R, c), S = motionSteps(c, P.n1, P.n2);
  const k = r(R, 0, S.length - 1), st = S[k]!;
  const lines = S.slice(0, k + 1).map((s, i) => `${i + 1}. ${s.t}`);
  return choice(R, {
    id: `motionWhy-${n}`, family: 'motionWhy',
    prompt: `Why does ${c} always give congruence? Look at step ${k + 1} of the moves that carry ${triN(P.n1)} onto ${triN(P.n2)}. ${st.why}`, board: `${triT(P.n1)} \\to ${triT(P.n2)}\\ (${c},\\ \\text{step ${k + 1}})`,
    solution: [`Step ${k + 1}: ${st.t}`, `The reason: ${st.right}.`],
    picture: { fig: P.fig, card: { lines } },
  }, [{ t: st.right, ok: true, say: 'Right: that is what this step rests on.' }, ...st.wrong]);
});
export const motionNext: Gen = (R, n, sg) => fitted('motionNext', () => {
  const c = SG_CRIT[sg ?? ''] ?? pick(R, ['SAS', 'ASA', 'SSS'] as const);
  const P = motionFig(R, c), S = motionSteps(c, P.n1, P.n2);
  const k = r(R, 1, S.length - 1);
  const lines = [...S.slice(0, k).map((s, i) => `${i + 1}. ${s.t}`), `${k + 1}. ?`];
  const opts: Opt[] = [
    { t: S[k]!.t, ok: true, say: 'Right: that is the next step of the argument.' },
    { t: 'The whole triangle now fits on the other, because they look congruent.', mc: MC.wholeFig, say: 'That asserts the conclusion: each vertex needs its own reason.' },
    { t: 'Measure the other sides in this drawing to check that they match.', mc: MC.measureProof, say: 'Measuring one drawing proves nothing about every triangle; each move has a reason instead.' },
  ];
  return choice(R, {
    id: `motionNext-${n}`, family: 'motionNext',
    prompt: `The moves carry ${triN(P.n1)} onto ${triN(P.n2)} using only the ${c} pairs. Which step comes next?`, board: `${triT(P.n1)} \\to ${triT(P.n2)}\\ (${c},\\ \\text{step ${k + 1}})`,
    solution: [`Steps 1 to ${k} are done.`, `Next: ${S[k]!.t}`],
    picture: { fig: P.fig, card: { lines } },
  }, opts);
});

// ---------- circle-intersection ----------
const CIRC = [
  // r1, r2, d (inches): 2 points, tangent (1), apart (0), inside (0), inside tangent (1)
  [4, 5, 7], [3, 5, 6], [5, 6, 8], [4, 6, 9], [3, 4, 7], [2, 5, 7], [3, 4, 9], [2, 3, 8], [6, 3, 2], [5, 2, 3], [4, 5, 3], [5, 4, 6], [3, 6, 5], [4, 4, 5], [2, 4, 6], [5, 3, 9], [6, 4, 3], [3, 5, 8], [4, 3, 6],
];
export const circlesMeet: Gen = (R, n) => fitted('circlesMeet', () => {
  const t = relabeler(R, 'AB', '');
  const [r1, r2, d] = pick(R, CIRC) as [number, number, number];
  const k = 34;
  const A: Pt = [0, 0], B: Pt = [d * k, 0];
  const ans = d > r1 + r2 || d < Math.abs(r1 - r2) ? 0 : d === r1 + r2 || d === Math.abs(r1 - r2) ? 1 : 2;
  const fig = buildFig({ pts: { A, B }, segs: ['AB'], marks: [], extra: [...circleSegs('ca', A, r1 * k, { col: 'first' }), ...circleSegs('cb', B, r2 * k, { col: 'second' })], dirs: { A: 250, B: 290 }, dist: { A: 40, B: 40 } });
  return numT(t, {
    id: `circlesMeet-${n}`, family: 'circlesMeet',
    prompt: `The circle about A has radius ${r1} in, a circle about B has radius ${r2} in, and AB = ${d} in. In how many points do the circles meet?`,
    board: `r_A = ${r1},\\ r_B = ${r2},\\ AB = ${d}`, unit: 'points',
    solution: [`Compare AB = ${d} with the sum ${r1 + r2} and the difference ${Math.abs(r1 - r2)} of the radii.`, ans === 2 ? `${Math.abs(r1 - r2)} < ${d} < ${r1 + r2}: they cross twice, at mirror images across line AB.` : ans === 1 ? 'AB equals the sum or the difference: the circles just touch, once.' : 'AB is beyond the sum or below the difference: no common point.'],
    picture: { fig, reveal: {} },
  }, ans, [{ v: 3, mc: MC.circlesMany, say: 'Two circles with different centers meet in at most two points.' }, { v: 4, mc: MC.circlesMany, say: 'Two circles with different centers meet in at most two points.' }], 'Right.', 'Compare the distance between the centers with the sum and the difference of the radii.');
});
export const mirrorPoint: Gen = (R, n) => fitted('mirrorPoint', () => {
  const t = relabeler(R, 'ABPQ', '');
  const pairs = [[4, 6, 7], [5, 3, 6], [6, 4, 8], [3, 5, 6], [5, 7, 9]];
  const [r1, r2, d] = pick(R, pairs) as [number, number, number];
  const k = 36, x = (d * d + r1 * r1 - r2 * r2) / (2 * d), y = Math.sqrt(r1 * r1 - x * x);
  const A: Pt = [0, 0], B: Pt = [d * k, 0], P: Pt = [x * k, y * k], Q: Pt = [x * k, -y * k];
  const fig = buildFig({ pts: { A, B, P, Q }, segs: ['AB'], marks: [], extra: [...circleSegs('ca', A, r1 * k, { col: 'first' }), ...circleSegs('cb', B, r2 * k, { col: 'second' })], dirs: { A: 200, B: 340, P: 90, Q: 270 }, dist: { A: 44, B: 44, P: 66, Q: 66 } });
  return choiceT(R, t, {
    id: `mirrorPoint-${n}`, family: 'mirrorPoint',
    prompt: `The circles about A (radius ${r1} in) and B (radius ${r2} in) meet at P and Q. How is Q placed compared with P?`, board: 'AP = AQ,\\ BP = BQ',
    solution: ['Q is as far from A as P is, and as far from B as P is.', 'The reflection across line AB keeps A and B and every distance to them, so it carries P to the other meeting point, Q.'],
    picture: { fig, reveal: {} },
  }, [
    { t: 'Q is the reflection of P across line AB', ok: true, say: 'Right: mirror images across the line of centers.' },
    { t: 'Q is the reflection of P across the perpendicular bisector of AB', say: 'That would swap the roles of A and B; with different radii it leaves both circles.' },
    { t: 'There is no fixed relation: Q can be anywhere on the circles', mc: MC.circlesUnrel, say: 'Both points have the same distances to A and B, so they are mirror images across AB.' },
  ]);
});

// ---------- write-correspondence ----------
function fullMarks(): PMark[] { return [{ k: 's', i: 0, n: 1 }, { k: 's', i: 1, n: 2 }, { k: 's', i: 2, n: 3 }]; }
/** the three vertices left to right on the page, for the "by position" slip */
const byX = (P: Pt[]) => [0, 1, 2].sort((a, b) => P[a]![0] - P[b]![0]);
export const writeStmt: Gen = (R, n) => fitted('writeStmt', () => {
  const shared = R() < 0.35;
  const [L1, L2] = names2(R);
  let T1 = randTri(R, { base: 300 }), T2 = T1, n2: string;
  if (shared) {
    // the copy turns about vertex 0 (shared letter): no overlap
    const turn = angle(T1, 0) + r(R, 40, 70);
    const dir = R() < 0.5 ? 1 : -1;
    T2 = T1.map(p => { const t = (dir * turn * Math.PI) / 180, x = p[0] - T1[0][0], y = p[1] - T1[0][1]; return [T1[0][0] + x * Math.cos(t) - y * Math.sin(t), T1[0][1] + x * Math.sin(t) + y * Math.cos(t)] as Pt; }) as typeof T1;
    // a shared vertex keeps its letter; the other two get new letters in a scrambled order
    const others = [...L2].slice(0, 2);
    n2 = L1[0]! + (R() < 0.5 ? others.join('') : others.reverse().join(''));
  } else {
    const flip = R() < 0.5;
    T2 = beside(T1, moveT(T1, { rot: r(R, 0, 359), flip, off: [0, 0] }), 'row');
    n2 = permName(L2, pick(R, PERMS));
  }
  const fig = pairFig(T1, T2, L1, n2, fullMarks());
  const right = stmt(L1, n2);
  const opts: Opt[] = [{ t: right, ok: true, say: 'Right: each vertex sits under the vertex it matches.' }];
  const add = (nm: string, mc: string | undefined, say: string) => { const t = stmt(L1, nm); if (!opts.some(o => o.t === t)) opts.push({ t, mc, say }); };
  add([...n2].sort().join(''), MC.vertexOrder, 'Alphabetical order ignores which vertex matches which.');
  const ox = byX(T1), px = byX(T2), pos = [0, 0, 0]; ox.forEach((v, rank) => { pos[v] = px[rank]!; });
  add(pos.map(i => n2[i]).join(''), MC.byPosition, 'Matching by where the letters sit on the page ignores the marks.');
  for (const pm of shuffle(R, PERMS.slice())) { if (opts.length >= 4) break; add(permName(n2, pm), MC.ignoreCorr, 'Follow the tick marks: the side with one tick matches the side with one tick, and so on.'); }
  return choice(R, {
    id: `writeStmt-${n}`, family: 'writeStmt',
    prompt: 'Which congruence statement has the vertices in corresponding order?', board: `${triT(L1)} \\cong \\triangle\\,???`,
    solution: ['Use the marks: matching ticks are corresponding sides, and corresponding vertices sit opposite them.', `${[0, 1, 2].map(k => `${L1[k]} ↔ ${n2[k]}`).join(', ')}.`, `So: ${right}.`],
    picture: { fig, reveal: {} },
  }, opts.slice(0, 4));
});
export const stmtAndCrit: Gen = (R, n) => fitted('stmtAndCrit', () => {
  const pat = pick(R, ['SSS', 'SAS', 'ASA', 'AAS', 'HL'] as Pattern[]);
  const P = makePair(R, pat, 'row');
  const valid = critsOf(P.parts);
  const right = `${stmt(P.n1, P.n2)} by ${pat}`;
  const wrongOrder = permName(P.n2, pick(R, PERMS.slice(1)));
  const otherCrit = (['SAS', 'ASA', 'SSS', 'AAS', 'HL'] as const).find(c => c !== pat && !valid.has(c))!;
  return choice(R, {
    id: `stmtAndCrit-${n}`, family: 'stmtAndCrit',
    prompt: 'Which conclusion do the marks justify?', board: `${triT(P.n1)} \\cong \\triangle\\,???`,
    solution: [`The marks are ${P.parts.map(p => pairHtml(P.n1, P.n2, p)).join(', ')}: the pattern ${pat}.`, `They match ${[0, 1, 2].map(k => `${P.n1[k]} ↔ ${P.n2[k]}`).join(', ')}.`, `So: ${right}.`],
    picture: { fig: P.fig, reveal: {} },
  }, [
    { t: right, ok: true, say: 'Right: the criterion and the vertex order both follow the marks.' },
    { t: `${stmt(P.n1, wrongOrder)} by ${pat}`, mc: MC.vertexOrder, say: 'The criterion is right, but the vertices are not in corresponding order.' },
    { t: `${stmt(P.n1, P.n2)} by ${otherCrit}`, mc: MC.order, say: `Read where the marks sit: the pattern is ${pat}.` },
    { t: 'Not enough information', mc: P.flip ? MC.flipped : undefined, say: `The three marked pairs form ${pat}, a criterion.` },
  ]);
});
export const stmtFromList: Gen = (R, n) => {
  const [L1, L2] = names2(R);
  const n2 = permName(L2, pick(R, PERMS));
  const pat = pick(R, ['SSS', 'SAS', 'ASA'] as const);
  const k = r(R, 0, 2), a = (k + 1) % 3, b = (k + 2) % 3;
  const parts: Part[] = pat === 'SSS' ? [0, 1, 2].map(i => ({ k: 's' as const, i })) : pat === 'SAS' ? [{ k: 's', i: a }, { k: 'a', i: k }, { k: 's', i: b }] : [{ k: 'a', i: a }, { k: 's', i: k }, { k: 'a', i: b }];
  const list = shuffle(R, parts.slice()).map(p => pairHtml(L1, n2, p));
  const opts: Opt[] = [{ t: stmt(L1, n2), ok: true, say: 'Right: every pair lines up letter under letter.' }];
  const alpha = [...n2].sort().join('');
  if (alpha !== n2) opts.push({ t: stmt(L1, alpha), mc: MC.vertexOrder, say: 'Alphabetical order ignores the pairs.' });
  for (const pm of shuffle(R, PERMS.slice())) { const t = stmt(L1, permName(n2, pm)); if (opts.length < 4 && !opts.some(o => o.t === t)) opts.push({ t, mc: MC.ignoreCorr, say: 'Check each pair: its two parts must sit in the same places of the statement.' }); }
  return choice(R, {
    id: `stmtFromList-${n}`, family: 'stmtFromList',
    prompt: `Given: ${list.join(', ')}. Which statement has the vertices in corresponding order?`, board: parts.map(p => pairTex(L1, n2, p)).join(',\\ '),
    solution: ['Each pair matches the letters it names: a side pair matches both end letters, an angle pair its vertex.', `${[0, 1, 2].map(i => `${L1[i]} ↔ ${n2[i]}`).join(', ')}.`, `So: ${stmt(L1, n2)}.`],
    picture: { card: { lines: [`Given: ${list.join(';   ')}`] } },
  }, opts);
};

// ---------- shared-side ----------
export const sharedPart: Gen = (R, n) => fitted('sharedPart', () => {
  const t = relabeler(R, 'ABCDE', '');
  const v = R() < 0.55 ? 'kite' : 'angle';
  if (v === 'kite') {
    const c = kite(R);
    const fig = buildFig({ ...c, marks: [{ seg: 'AB', n: 1 }, { seg: 'CB', n: 1 }, { seg: 'AD', n: 2 }, { seg: 'CD', n: 2 }], fills: [{ pts: 'ABD' }, { pts: 'CBD' }] });
    return choiceT(R, t, {
      id: `sharedPart-${n}`, family: 'sharedPart', prompt: `Two pairs are marked. Which third pair proves ${stmt('ABD', 'CBD')} by SSS?`, board: stmtT('ABD', 'CBD'),
      solution: [`${segN('AB')} ≅ ${segN('CB')} and ${segN('AD')} ≅ ${segN('CD')} are marked.`, `Both triangles contain ${segN('BD')}: it is congruent to itself (Reflexive Property).`, `So: ${segN('BD')} ≅ ${segN('BD')}.`],
      picture: { fig, reveal: {} },
    }, [
      { t: `${segN('BD')} ≅ ${segN('BD')}`, ok: true, say: 'Right: the shared side counts as a pair.' },
      { t: 'None: only two pairs are marked', mc: MC.onlyMarked, say: 'The shared side is congruent to itself: it is the third pair.' },
      { t: `∠A ≅ ∠C, since they look equal`, mc: MC.appearance, say: 'That is not marked or given; it only follows after the proof.' },
      { t: `${segN('AB')} ≅ ${segN('AD')}`, say: 'Those sides carry different marks.' },
    ]);
  }
  const c = overlapAngle(R);
  const fig = buildFig({ ...c, marks: [{ seg: 'AD', n: 1 }, { seg: 'AE', n: 1 }], fills: [{ pts: 'ABE' }, { pts: 'ACD' }] });
  return choiceT(R, t, {
    id: `sharedPart-${n}`, family: 'sharedPart', prompt: `Given: ${segN('AB')} ≅ ${segN('AC')}. ${segN('AD')} ≅ ${segN('AE')} is marked. Which third pair proves ${stmt('ABE', 'ACD')} by SAS?`, board: stmtT('ABE', 'ACD'),
    solution: [`${triN('ABE')} and ${triN('ACD')} both have their angle at A.`, 'An angle is congruent to itself (Reflexive Property), and ∠A sits between the two given sides.', 'So: ∠A ≅ ∠A.'],
    picture: { fig, reveal: {} },
  }, [
    { t: '∠A ≅ ∠A', ok: true, say: 'Right: the shared angle is the included angle.' },
    { t: 'None: only two pairs are given', mc: MC.onlyMarked, say: 'The shared angle is congruent to itself: the third pair.' },
    { t: `${segN('BE')} ≅ ${segN('CD')}`, mc: MC.beforeEst, say: 'That follows only after the triangles are proved congruent.' },
    { t: `${segN('DB')} ≅ ${segN('AD')}`, mc: MC.appearance, say: 'Nothing marks that; D only looks halfway.' },
  ]);
});

/** a proof (from the bank) with one row asked; the picture: figure + proof frame */
function proofPicture(p: TProof, ask: { i: number; cell: 'st' | 'rs' }[], hide: Record<number, 'st' | 'rs'> = {}) {
  const rows = p.rows.map((x, i) => ({ st: hide[i] === 'st' ? '' : x.st, rs: hide[i] === 'rs' ? '' : RS[x.rs] as string }));
  const given = p.given.length > 1 && p.given.join('').length < 60 ? [p.given.join(';\\ ')] : p.given;
  return { given, prove: p.prove, rows, ask };
}
const NEAR: Partial<Record<RKey, { k: RKey; mc?: string; say: string }[]>> = {
  refl: [{ k: 'given', say: 'Nothing gives it: a shared part is congruent to itself.' }, { k: 'defMid', mc: MC.noHyp, say: 'No midpoint is involved in this line.' }, { k: 'cpctc', mc: MC.circular, say: 'CPCTC needs the triangles proved congruent first.' }],
  vert: [{ k: 'altInt', mc: MC.wrongPair, say: 'These angles share a vertex and are formed by two crossing lines: vertical angles.' }, { k: 'given', mc: MC.appearance, say: 'They are not marked or given; a theorem supplies them.' }, { k: 'refl', say: 'They are two different angles, not one shared angle.' }],
  altInt: [{ k: 'vert', mc: MC.wrongPair, say: 'They are at different vertices: alternate interior angles of the parallel lines.' }, { k: 'given', mc: MC.appearance, say: 'They are not marked; the parallel lines supply them.' }, { k: 'refl', say: 'They are two different angles.' }],
  defMid: [{ k: 'defBis', mc: MC.midMis, say: 'A midpoint splits a segment; a bisector of an angle splits an angle.' }, { k: 'given', mc: MC.noReason, say: 'The given names the midpoint; the definition turns it into the congruent pair.' }, { k: 'refl', say: 'They are two different segments.' }],
  defBis: [{ k: 'defMid', mc: MC.midMis, say: 'A bisector of an angle splits the angle, not a segment.' }, { k: 'given', mc: MC.noReason, say: 'The given names the bisector; the definition turns it into the congruent pair.' }, { k: 'vert', mc: MC.wrongPair, say: 'They are side by side, not vertical angles.' }],
  defPerp: [{ k: 'defMid', mc: MC.midMis, say: 'Perpendicular lines make right angles; they say nothing about midpoints.' }, { k: 'given', mc: MC.noReason, say: 'The given says the lines are perpendicular; the definition gives the right angles.' }, { k: 'vert', mc: MC.wrongPair, say: 'They are side by side (a linear pair), not vertical angles.' }],
};
const CRIT_NEAR = (c: string): { k: RKey; mc?: string; say: string }[] => {
  const out: { k: RKey; mc?: string; say: string }[] = [];
  for (const k of ['SAS', 'ASA', 'SSS', 'AAS'] as RKey[]) if (k !== c && !((c === 'ASA' && k === 'AAS') || (c === 'AAS' && k === 'ASA'))) out.push({ k, mc: MC.order, say: `Look at which parts the lines above give and where they sit: ${c}.` });
  return out;
};
export const proofReason: Gen = (R, n, sg) => fitted('proofReason', () => {
  const p = makeProof(pick(R, sg === 'shared-side' ? (['kiteSSS', 'kiteASA', 'perpSAS', 'parZSAS', 'overlapSAS', 'overlapSSS'] as const) : sg === 'definitions-to-parts' ? (['bowtieSAS', 'bowtieASA', 'kiteASA', 'perpSAS'] as const) : BANK), R);
  const keyOk = (k: RKey) => (sg === 'shared-side' ? k === 'refl' : sg === 'definitions-to-parts' ? ['defMid', 'defBis', 'defPerp'].includes(k) : k !== 'given');
  const cand = p.rows.map((x, i) => i).filter(i => keyOk(p.rows[i]!.rs));
  const i = pick(R, cand), row = p.rows[i]!;
  const crit = ['SSS', 'SAS', 'ASA', 'AAS', 'HL'].includes(row.rs);
  const near = crit ? CRIT_NEAR(row.rs) : NEAR[row.rs] ?? [];
  const opts: Opt[] = [{ t: RS[row.rs], ok: true, say: `Right: ${RS[row.rs]}.` }, ...near.slice(0, 3).map(x => ({ t: RS[x.k] as string, mc: x.mc, say: x.say }))];
  if (crit) opts.push({ t: 'SSA', mc: MC.ssa, say: 'SSA is not a congruence criterion.' });
  return choice(R, {
    id: `proofReason-${n}`, family: sg === 'shared-side' ? 'reflexReason' : sg === 'definitions-to-parts' ? 'defReason' : 'proofReason',
    prompt: `Which reason belongs in line ${i + 1}?`, board: row.st,
    solution: [`Line ${i + 1}: ${htm(row.st)}.`, row.uses.length ? `It uses line${row.uses.length > 1 ? 's' : ''} ${row.uses.join(', ')}.` : 'It needs no earlier line.', `The reason: ${RS[row.rs]}.`],
    picture: { fig: p.fig, proof: proofPicture(p, [{ i, cell: 'rs' }], { [i]: 'rs' }), reveal: { fill: [{ i, rs: RS[row.rs] }] } },
  }, opts.slice(0, 5));
});
export const reflexReason: Gen = (R, n) => proofReason(R, n, 'shared-side');
export const defReason: Gen = (R, n) => proofReason(R, n, 'definitions-to-parts');

// ---------- angle-pair-hidden ----------
export const hiddenAngle: Gen = (R, n) => fitted('hiddenAngle', () => {
  const t = relabeler(R, 'ABCDE', '');
  const bow = R() < 0.55;
  if (bow) {
    const c = bowtie(R);
    const fig = buildFig({ ...c, marks: [{ seg: 'AE', n: 1 }, { seg: 'EC', n: 1 }, { seg: 'BE', n: 2 }, { seg: 'ED', n: 2 }], fills: [{ pts: 'AEB' }, { pts: 'CED' }] });
    return choiceT(R, t, {
      id: `hiddenAngle-${n}`, family: 'hiddenAngle', prompt: `${segN('AC')} and ${segN('BD')} cross at E. Which unmarked pair of ${triN('AEB')} and ${triN('CED')} is also congruent, and why?`, board: stmtT('AEB', 'CED'),
      solution: ['∠AEB and ∠CED are formed by the same two crossing segments, opposite each other.', 'So: ∠AEB ≅ ∠CED, vertical angles.'],
      picture: { fig, reveal: {} },
    }, [
      { t: '∠AEB ≅ ∠CED, vertical angles', ok: true, say: 'Right: the Vertical Angles Theorem supplies the third pair.' },
      { t: '∠AEB ≅ ∠CED, alternate interior angles', mc: MC.wrongPair, say: 'They share the vertex E: vertical angles.' },
      { t: '∠A ≅ ∠C, they look equal', mc: MC.appearance, say: 'Not marked or given: that only follows later.' },
      { t: 'None: only the marked parts count', mc: MC.onlyMarked, say: 'Theorems can supply an unmarked pair: vertical angles.' },
    ]);
  }
  const c = parZ(R);
  const fig = buildFig({ ...c, marks: [{ seg: 'AB', par: 1 }, { seg: 'DC', par: 1 }, { seg: 'AB', n: 1 }, { seg: 'DC', n: 1 }], fills: [{ pts: 'ABC' }, { pts: 'CDA' }] });
  return choiceT(R, t, {
    id: `hiddenAngle-${n}`, family: 'hiddenAngle', prompt: `${segN('AB')} ∥ ${segN('DC')}. Which unmarked angle pair of ${triN('BAC')} and ${triN('DCA')} is congruent, and why?`, board: `${'\\overline{AB} \\parallel \\overline{DC}'}`,
    solution: [`${segN('AC')} cuts the parallel segments ${segN('AB')} and ${segN('DC')}.`, '∠BAC and ∠DCA are on opposite sides of it, between the parallels.', 'So: ∠BAC ≅ ∠DCA, alternate interior angles.'],
    picture: { fig, reveal: {} },
  }, [
    { t: '∠BAC ≅ ∠DCA, alternate interior angles', ok: true, say: 'Right: the parallel lines supply them.' },
    { t: '∠BAC ≅ ∠DCA, vertical angles', mc: MC.wrongPair, say: 'They are at different vertices: alternate interior angles.' },
    { t: '∠B ≅ ∠D, they look equal', mc: MC.appearance, say: 'Not marked or given; it follows only after the proof.' },
    { t: 'None: only the marked parts count', mc: MC.onlyMarked, say: 'The parallel marks give alternate interior angles.' },
  ]);
});
export const hiddenCrit: Gen = (R, n) => fitted('hiddenCrit', () => {
  const t = relabeler(R, 'ABCDE', '');
  const c = bowtie(R);
  // triangles AEB (A 0, E 1, B 2) and CED (C 0, E 1, D 2): vertical angles at index 1
  const v = pick(R, ['SAS', 'ASA', 'AAS'] as const);
  const marks = v === 'SAS' ? [{ seg: 'AE', n: 1 }, { seg: 'EC', n: 1 }, { seg: 'BE', n: 2 }, { seg: 'ED', n: 2 }]
    : v === 'ASA' ? [{ ang: 'BAE', n: 1 }, { ang: 'DCE', n: 1 }, { seg: 'AE', n: 1 }, { seg: 'EC', n: 1 }]
      : [{ ang: 'BAE', n: 1 }, { ang: 'DCE', n: 1 }, { seg: 'BE', n: 1 }, { seg: 'ED', n: 1 }];
  // the AAS / ASA bowtie: B, D need not mirror; build them exact from the marks (both midpoint-symmetric anyway)
  const fig = buildFig({ ...c, marks, fills: [{ pts: 'AEB' }, { pts: 'CED' }] });
  const parts: Part[] = v === 'SAS' ? [{ k: 's', i: 2 }, { k: 's', i: 0 }, { k: 'a', i: 1 }] : v === 'ASA' ? [{ k: 'a', i: 0 }, { k: 's', i: 2 }, { k: 'a', i: 1 }] : [{ k: 'a', i: 0 }, { k: 's', i: 0 }, { k: 'a', i: 1 }];
  const opts = critOpts(parts, v).map(o => (o.t === CRIT_WORD.none ? { ...o, mc: MC.onlyMarked, say: 'Vertical angles at E give a third pair.' } : o));
  return choiceT(R, t, {
    id: `hiddenCrit-${n}`, family: 'hiddenCrit', prompt: `${segN('AC')} and ${segN('BD')} cross at E. Which criterion proves ${stmt('AEB', 'CED')}?`, board: stmtT('AEB', 'CED'),
    solution: ['Two pairs are marked.', 'The vertical angles ∠AEB and ∠CED are the third pair.', `So: ${v}.`],
    picture: { fig, reveal: {} },
  }, opts);
});

// ---------- bisect-meaning ----------
export const bisectDef: Gen = (R, n) => fitted('bisectDef', () => {
  const t = relabeler(R, 'ABCD', 'M');
  const v = pick(R, ['midYes', 'midNo', 'bisNo', 'bisYes'] as const);
  if (v === 'midYes' || v === 'midNo') {
    const L = r(R, 460, 560), f = v === 'midYes' ? 0.5 : pick(R, [0.5, 0.42, 0.58]), d = r(R, -12, 12);
    const A = at([0, 0], d + 180, L / 2), B = at([0, 0], d, L / 2), M = at(A, d, L * f);
    const fig = buildFig({ pts: { A, M, B }, segs: ['AM', 'MB'], marks: v === 'midYes' ? [{ seg: 'AM', n: 1 }, { seg: 'MB', n: 1 }] : [], dirs: { A: 270, M: 270, B: 270 } });
    return choiceT(R, t, {
      id: `bisectDef-${n}`, family: 'bisectDef', prompt: `Is M the midpoint of ${segN('AB')}? Only marks and givens count.`, board: '\\text{midpoint?}',
      solution: ['Every midpoint splits a segment into two congruent parts: AM ≅ MB.', v === 'midYes' ? 'The ticks mark AM ≅ MB.' : 'Nothing marks or gives AM ≅ MB.'],
      picture: { fig, reveal: {} },
    }, [
      { t: `Yes: the ticks mark ${segN('AM')} ≅ ${segN('MB')}`, ok: v === 'midYes', say: v === 'midYes' ? 'Right: two congruent parts.' : 'There are no ticks on this drawing.' },
      { t: `Yes: M lies on ${segN('AB')}`, mc: MC.anyMid, say: 'Lying on the segment is not enough: the two parts must be congruent.' },
      { t: 'Not shown: nothing marks the two parts congruent', ok: v === 'midNo', mc: v === 'midYes' ? undefined : undefined, say: v === 'midNo' ? 'Right: it may only look halfway.' : 'The ticks do mark the two parts congruent.' },
    ]);
  }
  const x = v === 'bisYes' ? r(R, 28, 40) : r(R, 26, 36), y = v === 'bisYes' ? x : x + pick(R, [6, 8, 10]);
  const a0 = r(R, -10, 25), B: Pt = [0, 0];
  const A = at(B, a0, 360), D = at(B, a0 + x, 360), C = at(B, a0 + x + y, 360);
  const marks = v === 'bisYes' ? [{ ang: 'ABD', n: 1, r: 90 }, { ang: 'DBC', n: 1, r: 90 }] : [{ ang: 'ABD', text: `${x}°`, lone: true, r: 90 }, { ang: 'DBC', text: `${y}°`, lone: true, r: 90 }];
  const fig = buildFig({ pts: { A, B, C, D }, segs: ['BA', 'BD', 'BC'], marks, segStyle: { BA: { kind: 'ray' }, BD: { kind: 'ray' }, BC: { kind: 'ray' } } });
  return choiceT(R, t, {
    id: `bisectDef-${n}`, family: 'bisectDef', prompt: `Does ray BD bisect ∠ABC?`, board: '\\overrightarrow{BD}\\text{ bisects }\\angle ABC\\ ?',
    solution: ['Every angle bisector splits the angle into two congruent angles: ∠ABD ≅ ∠DBC.', v === 'bisYes' ? 'The matching arcs mark them congruent.' : `${x}° ≠ ${y}°.`],
    picture: { fig, reveal: {} },
  }, [
    { t: 'Yes: the two angles are marked congruent', ok: v === 'bisYes', say: v === 'bisYes' ? 'Right.' : `The two parts measure ${x}° and ${y}°.` },
    { t: 'Yes: ray BD is inside the angle', mc: MC.bisArb, say: 'Any ray inside splits the angle; only a bisector splits it into congruent parts.' },
    { t: 'No: the two parts are not congruent', ok: v === 'bisNo', say: v === 'bisNo' ? `Right: ${x}° and ${y}° differ.` : 'The arcs mark the two parts congruent.' },
  ]);
});
export const bisectNum: Gen = (R, n) => fitted('bisectNum', () => {
  const t = relabeler(R, 'ABCD', 'M');
  const v = pick(R, ['half', 'whole', 'angHalf', 'angWhole'] as const);
  if (v === 'half' || v === 'whole') {
    const h = r(R, 4, 19), d = r(R, -10, 10), L = 480;
    const A = at([0, 0], d + 180, L / 2), B = at([0, 0], d, L / 2), M: Pt = [0, 0];
    const fig = buildFig({ pts: { A, M, B }, segs: ['AM', 'MB'], marks: [{ seg: 'AM', n: 1 }, { seg: 'MB', n: 1 }], dirs: { A: 270, M: 270, B: 270 } });
    const ans = v === 'half' ? h : 2 * h;
    return numT(t, {
      id: `bisectNum-${n}`, family: 'bisectNum', prompt: v === 'half' ? `M is the midpoint of ${segN('AB')}, and AB = ${2 * h} cm. How long is ${segN('AM')}?` : `M is the midpoint of ${segN('AB')}, and AM = ${h} cm. How long is ${segN('AB')}?`,
      board: v === 'half' ? `AB = ${2 * h},\\ AM = \\,?` : `AM = ${h},\\ AB = \\,?`, unit: 'cm',
      solution: ['Every midpoint splits the segment into two congruent halves.', v === 'half' ? `AM = ${2 * h} ÷ 2 = <b class="s">${h}</b>.` : `AB = 2 · ${h} = <b class="s">${2 * h}</b>.`],
      picture: { fig, reveal: {} },
    }, ans, v === 'half' ? [{ v: 2 * h, mc: MC.wholeAsPart, say: 'That is the whole segment; AM is half of it.' }] : [{ v: h / 2, say: 'AM is the half; the whole is twice as long.' }], 'Right.', 'Two congruent halves make the whole.');
  }
  const x = r(R, 21, 44), a0 = r(R, 0, 20), B: Pt = [0, 0];
  const A = at(B, a0, 360), D = at(B, a0 + x, 360), C = at(B, a0 + 2 * x, 360);
  const fig = buildFig({ pts: { A, B, C, D }, segs: ['BA', 'BD', 'BC'], marks: [{ ang: 'ABD', n: 1, r: 90 }, { ang: 'DBC', n: 1, r: 90 }], segStyle: { BA: { kind: 'ray' }, BD: { kind: 'ray' }, BC: { kind: 'ray' } } });
  const ans = v === 'angHalf' ? x : 2 * x;
  return numT(t, {
    id: `bisectNum-${n}`, family: 'bisectNum', prompt: v === 'angHalf' ? `Ray BD bisects ∠ABC, and m∠ABC = ${2 * x}°. Find m∠ABD.` : `Ray BD bisects ∠ABC, and m∠ABD = ${x}°. Find m∠ABC.`,
    board: v === 'angHalf' ? `m\\angle ABC = ${2 * x}^\\circ,\\ m\\angle ABD = \\,?` : `m\\angle ABD = ${x}^\\circ,\\ m\\angle ABC = \\,?`, unit: '°',
    solution: ['Every angle bisector splits the angle into two congruent angles.', v === 'angHalf' ? `m∠ABD = ${2 * x}° ÷ 2 = <b class="s">${x}°</b>.` : `m∠ABC = 2 · ${x}° = <b class="s">${2 * x}°</b>.`],
    picture: { fig, reveal: {} },
  }, ans, v === 'angHalf' ? [{ v: 2 * x, mc: MC.wholeAsPart, say: 'That is the whole angle; ∠ABD is half of it.' }] : [{ v: x / 2, say: '∠ABD is the half; the whole angle is twice as big.' }], 'Right.', 'The two congruent parts make the whole angle.');
});

// ---------- definitions-to-parts ----------
export const defToPair: Gen = (R, n) => fitted('defToPair', () => {
  const t = relabeler(R, 'ABCD', 'M');
  const v = pick(R, ['mid', 'segBis', 'angBis', 'perp'] as const);
  if (v === 'angBis') {
    const c = kite(R);
    const fig = buildFig({ ...c, marks: [], fills: [{ pts: 'ABD' }, { pts: 'CBD' }] });
    return choiceT(R, t, {
      id: `defToPair-${n}`, family: 'defToPair', prompt: `Given: ${segN('BD')} bisects ∠ABC. Which congruent pair does this give?`, board: '\\overline{BD}\\text{ bisects }\\angle ABC',
      solution: ['Every angle bisector splits its angle into two congruent angles.', 'So: ∠ABD ≅ ∠CBD (Definition of angle bisector).'],
      picture: { fig, reveal: {} },
    }, [
      { t: '∠ABD ≅ ∠CBD', ok: true, say: 'Right: the two halves of ∠ABC.' },
      { t: `${segN('AD')} ≅ ${segN('CD')}`, mc: MC.wrongPart, say: 'The bisector splits the angle, not a segment.' },
      { t: '∠A ≅ ∠C', mc: MC.appearance, say: 'The bisector says nothing about ∠A and ∠C.' },
    ]);
  }
  if (v === 'perp') {
    const w = r(R, 160, 230), h = r(R, 220, 300), x0 = r(R, -60, 60);
    const fig = buildFig({ pts: { A: [-w, 0], B: [w, 0], M: [x0, 0], C: [x0, h] }, segs: ['AM', 'MB', 'CM', 'AC', 'BC'], marks: [], fills: [{ pts: 'AMC' }, { pts: 'BMC' }] });
    return choiceT(R, t, {
      id: `defToPair-${n}`, family: 'defToPair', prompt: `Given: ${segN('CM')} ⊥ ${segN('AB')}. Which congruent pair does this give?`, board: '\\overline{CM} \\perp \\overline{AB}',
      solution: ['Perpendicular segments meet at right angles.', 'So ∠AMC and ∠BMC are both right: ∠AMC ≅ ∠BMC.'],
      picture: { fig, reveal: {} },
    }, [
      { t: '∠AMC ≅ ∠BMC', ok: true, say: 'Right: two right angles.' },
      { t: `${segN('AM')} ≅ ${segN('MB')}`, mc: MC.midMis, say: 'Perpendicular does not mean M is a midpoint.' },
      { t: `${segN('AC')} ≅ ${segN('BC')}`, mc: MC.appearance, say: 'Nothing gives that.' },
    ]);
  }
  // a segment AB and a segment CD crossing at M (M on both)
  const L = r(R, 220, 270), d = r(R, 50, 80), cm = r(R, 140, 200), md = r(R, 200, 260);
  const M: Pt = [0, 0], A = at(M, 180, L), B = at(M, 0, L), C = at(M, 180 - d, cm), D = at(M, -d, md);
  const fig = buildFig({ pts: { A, B, C, D, M }, segs: ['AM', 'MB', 'CM', 'MD'], marks: [] });
  const g = v === 'mid' ? `M is the midpoint of ${segN('AB')}` : `${segN('CD')} bisects ${segN('AB')} at M`;
  return choiceT(R, t, {
    id: `defToPair-${n}`, family: 'defToPair', prompt: `Given: ${g}. Which congruent pair does this give?`, board: v === 'mid' ? 'M\\text{ is the midpoint of }\\overline{AB}' : '\\overline{CD}\\text{ bisects }\\overline{AB}\\text{ at }M',
    solution: [v === 'mid' ? 'Every midpoint splits its segment into two congruent parts.' : `${segN('CD')} bisects ${segN('AB')}: it is ${segN('AB')} that is split in half.`, `So: ${segN('AM')} ≅ ${segN('MB')}.`],
    picture: { fig, reveal: {} },
  }, [
    { t: `${segN('AM')} ≅ ${segN('MB')}`, ok: true, say: 'Right: the two halves of AB.' },
    { t: `${segN('CM')} ≅ ${segN('MD')}`, mc: MC.wrongPart, say: `It is ${segN('AB')} that is bisected, not ${segN('CD')}.` },
    { t: `${segN('AM')} ≅ ${segN('CM')}`, say: 'Those are parts of different segments.' },
  ]);
});

// ---------- overlapping-triangles ----------
export const overlapShare: Gen = (R, n) => fitted('overlapShare', () => {
  const t = relabeler(R, 'ABCDE', '');
  if (R() < 0.5) {
    const c = overlapAngle(R);
    const fig = buildFig({ ...c, marks: [], fills: [{ pts: 'ABE', alpha: 0.6 }, { pts: 'ACD', alpha: 0.6 }] });
    return choiceT(R, t, {
      id: `overlapShare-${n}`, family: 'overlapShare', prompt: `Pull ${triN('ABE')} and ${triN('ACD')} apart. Which part do they share?`, board: `${triT('ABE')},\\ ${triT('ACD')}`,
      solution: [`${triN('ABE')} has vertices A, B, E; ${triN('ACD')} has A, C, D.`, 'Only the vertex A is in both, and both triangles have their angle there: ∠A (∠BAE is the same angle as ∠CAD).'],
      picture: { fig, reveal: {} },
    }, [
      { t: '∠A', ok: true, say: 'Right: the angle at A is in both triangles.' },
      { t: segN('AD'), mc: MC.overlap, say: `${segN('AD')} is a side of ${triN('ACD')} only; ${triN('ABE')} has ${segN('AB')}.` },
      { t: segN('BE'), mc: MC.overlap, say: `${segN('BE')} belongs to ${triN('ABE')} only.` },
      { t: 'Nothing: they are different triangles', mc: MC.overlap, say: 'Both triangles have their angle at A.' },
    ]);
  }
  const c = overlapBase(R);
  const fig = buildFig({ ...c, marks: [], fills: [{ pts: 'ABC', alpha: 0.6 }, { pts: 'DCB', alpha: 0.6 }] });
  return choiceT(R, t, {
    id: `overlapShare-${n}`, family: 'overlapShare', prompt: `Pull ${triN('ABC')} and ${triN('DCB')} apart. Which side do they share?`, board: `${triT('ABC')},\\ ${triT('DCB')}`,
    solution: [`${triN('ABC')} has sides AB, BC, AC; ${triN('DCB')} has DC, CB, DB.`, `The shared side: ${segN('BC')}.`],
    picture: { fig, reveal: {} },
  }, [
    { t: segN('BC'), ok: true, say: 'Right: BC is a side of both.' },
    { t: segN('AC'), mc: MC.overlap, say: `${segN('AC')} is a side of ${triN('ABC')} only.` },
    { t: segN('AD'), mc: MC.overlap, say: `${segN('AD')} is not a side of either triangle.` },
  ]);
});
export const overlapCrit: Gen = (R, n) => fitted('overlapCrit', () => {
  const t = relabeler(R, 'ABCDE', '');
  if (R() < 0.6) {
    const c = overlapAngle(R);
    // ABE (A 0, B 1, E 2) and ACD (A 0, C 1, D 2): AB side 2, AE side 1, angle B index 1
    const v = pick(R, ['SAS', 'ASA', 'AAS'] as const);
    const marks = v === 'SAS' ? [{ seg: 'AD', n: 1 }, { seg: 'AE', n: 1 }] : v === 'ASA' ? [{ ang: 'ABE', n: 1 }, { ang: 'ACD', n: 1 }] : [{ ang: 'ABE', n: 1 }, { ang: 'ACD', n: 1 }, { seg: 'AD', n: 1 }, { seg: 'AE', n: 1 }];
    const given = v === 'AAS' ? '' : `Given: ${segN('AB')} ≅ ${segN('AC')}. `;
    const fig = buildFig({ ...c, marks, fills: [{ pts: 'ABE' }, { pts: 'ACD' }] });
    const parts: Part[] = v === 'SAS' ? [{ k: 's', i: 2 }, { k: 'a', i: 0 }, { k: 's', i: 1 }] : v === 'ASA' ? [{ k: 's', i: 2 }, { k: 'a', i: 0 }, { k: 'a', i: 1 }] : [{ k: 'a', i: 0 }, { k: 'a', i: 1 }, { k: 's', i: 1 }];
    const opts = critOpts(parts, v).map(o => (o.t === CRIT_WORD.none ? { ...o, mc: MC.overlap, say: 'The shared angle at A is a third pair.' } : o));
    return choiceT(R, t, {
      id: `overlapCrit-${n}`, family: 'overlapCrit', prompt: `${given}Which criterion proves ${stmt('ABE', 'ACD')}?`, board: stmtT('ABE', 'ACD'),
      solution: [`Pull the triangles apart: both have the angle at A (shared).`, v === 'SAS' ? 'AB ≅ AC, ∠A, AE ≅ AD: the angle between the sides.' : v === 'ASA' ? 'Angles at A and at B / C, with AB ≅ AC between them.' : 'Angles at A and at B / C, with AE ≅ AD not between them.', `So: ${v}.`],
      picture: { fig, reveal: {} },
    }, opts);
  }
  const c = overlapBase(R);
  const v = pick(R, ['SSS', 'SAS'] as const);
  const marks = v === 'SSS' ? [{ seg: 'AB', n: 1 }, { seg: 'DC', n: 1 }, { seg: 'AC', n: 2 }, { seg: 'DB', n: 2 }] : [{ seg: 'AB', n: 1 }, { seg: 'DC', n: 1 }, { ang: 'ABC', n: 1 }, { ang: 'DCB', n: 1 }];
  const fig = buildFig({ ...c, marks, fills: [{ pts: 'ABC' }, { pts: 'DCB' }] });
  // ABC (A 0, B 1, C 2) and DCB (D 0, C 1, B 2): AB side 2, AC side 1, BC side 0, angle B index 1
  const parts: Part[] = v === 'SSS' ? [{ k: 's', i: 2 }, { k: 's', i: 1 }, { k: 's', i: 0 }] : [{ k: 's', i: 2 }, { k: 'a', i: 1 }, { k: 's', i: 0 }];
  const opts = critOpts(parts, v).map(o => (o.t === CRIT_WORD.none ? { ...o, mc: MC.overlap, say: `The shared side ${segN('BC')} is a third pair.` } : o));
  return choiceT(R, t, {
    id: `overlapCrit-${n}`, family: 'overlapCrit', prompt: `Which criterion proves ${stmt('ABC', 'DCB')}?`, board: stmtT('ABC', 'DCB'),
    solution: [`Pull the triangles apart: they share ${segN('BC')}.`, v === 'SSS' ? 'AB ≅ DC, AC ≅ DB, BC ≅ CB.' : 'AB ≅ DC, ∠ABC ≅ ∠DCB, BC ≅ CB: the angle between the sides.', `So: ${v}.`],
    picture: { fig, reveal: {} },
  }, opts);
});

// ---------- short-proof ----------
export const proofParsons: Gen = (R, n) => fitted('proofParsons', () => {
  const p = makeProof(pick(R, BANK), R);
  const N = p.rows.length, decoy = pick(R, p.decoys);
  const items = shuffle(R, [...p.rows.map((x, i) => ({ st: x.st, rs: RS[x.rs] as string, row: i + 1 })), { st: decoy.st, rs: '', row: 0 }]);
  const letterOf = (row: number) => String.fromCharCode(65 + items.findIndex(x => x.row === row));
  const fmt = (o: number[]) => o.map(letterOf).join(', ');
  const canonO = Array.from({ length: N }, (_, i) => i + 1);
  const right = fmt(canonO);
  const opts: Opt[] = [{ t: right, ok: true, say: 'Right: every line after the lines it uses, the triangles last, the decoy left out.' }];
  const rep = canonO.slice(); rep[r(R, 1, N - 2)] = 0;
  opts.push({ t: fmt(rep), mc: decoy.mc, say: `Line ${letterOf(0)} is the decoy: ${decoy.why}` });
  for (let t = 0; t < 60 && opts.length < 4; t++) {
    const o = canonO.slice(), i = r(R, 0, N - 2), j = r(R, i + 1, N - 1);
    [o[i], o[j]] = [o[j]!, o[i]!];
    if (validOrder(p, o)) continue;
    const s = fmt(o);
    if (opts.some(x => x.t === s)) continue;
    opts.push({ t: s, mc: MC.beforeEst, say: 'In that order a line uses a statement that only comes later.' });
  }
  return choice(R, {
    id: `proofParsons-${n}`, family: 'proofParsons',
    prompt: 'Put the lines in an order that proves the triangles congruent. One line is a decoy and is left out. Which order works?', board: p.prove,
    solution: [`Start from the givens; each line comes after the lines it uses, the congruence last: ${right}.`, `Line ${letterOf(0)} is the decoy: ${decoy.why}`],
    picture: { fig: p.fig, proof: { given: p.given.length > 1 && p.given.join('').length < 60 ? [p.given.join(';\\ ')] : p.given, prove: p.prove, rows: items.map(x => ({ st: x.st, rs: x.rs })), pool: true }, reveal: { strike: [items.findIndex(x => x.row === 0)], rowOf: items.map(x => x.row) } },
  }, opts);
});
export const proofGap: Gen = (R, n) => fitted('proofGap', () => {
  const p = makeProof(pick(R, HIDDEN_BANK), R);
  const ks = p.rows.map((_, i) => i).filter(i => i < p.rows.length - 1 && p.rows[i]!.rs !== 'given');
  const i = pick(R, ks), row = p.rows[i]!;
  const opts: Opt[] = [{ t: htm(row.st), ok: true, say: `Right: the ${RS[row.rs]} gives exactly this.` }];
  for (const d of p.decoys) if (htm(d.st) !== htm(row.st)) opts.push({ t: htm(d.st), mc: d.mc, say: d.why });
  opts.push({ t: htm(p.prove), mc: MC.circular, say: 'That is the conclusion: it cannot appear before the pairs that prove it.' });
  return choice(R, {
    id: `proofGap-${n}`, family: 'proofGap', prompt: `Which statement belongs in line ${i + 1} (reason: ${RS[row.rs]})?`, board: p.prove,
    solution: [`Line ${i + 1} cites the ${RS[row.rs]}.`, `It supplies the pair ${htm(row.st)}, which line ${p.rows.length} uses.`],
    picture: { fig: p.fig, proof: proofPicture(p, [{ i, cell: 'st' }], { [i]: 'st' }), reveal: { fill: [{ i, st: row.st }] } },
  }, opts);
});

// ---------- cpctc ----------
export const cpctcNext: Gen = (R, n) => fitted('cpctcNext', () => {
  const p = makeProof(pick(R, BANK), R);
  const [right, wrong] = p.next;
  const rows = p.rows.map(x => ({ st: x.st, rs: RS[x.rs] as string }));
  const opts: Opt[] = [
    { t: htm(right), ok: true, say: 'Right: corresponding parts of congruent triangles are congruent.' },
    { t: htm(wrong), mc: MC.ignoreCorr, say: 'Those parts do not correspond: check the vertex order of the congruence.' },
    { t: 'Nothing new: only the givens are congruent', mc: MC.onlyMarked, say: 'Once the triangles are congruent, every pair of corresponding parts is.' },
  ];
  return choice(R, {
    id: `cpctcNext-${n}`, family: 'cpctcNext', prompt: `The proof is done. Which statement follows by CPCTC?`, board: p.prove,
    solution: [`${htm(p.prove)}: the vertices correspond in order, ${[0, 1, 2].map(k => `${p.t1[k]} ↔ ${p.t2[k]}`).join(', ')}.`, `So: ${htm(right)}.`],
    picture: { fig: p.fig, proof: { given: p.given.length > 1 && p.given.join('').length < 60 ? [p.given.join(';\\ ')] : p.given, prove: p.prove, rows }, reveal: {} },
  }, opts);
});
export const cpctcNum: Gen = (R, n) => fitted('cpctcNum', () => {
  const [L1, L2] = names2(R);
  const n2 = permName(L2, pick(R, PERMS.slice(1)));
  const s = shuffle(R, pick(R, [[5, 7, 9], [6, 8, 11], [7, 9, 12], [8, 10, 13], [9, 12, 14]]).slice());
  const k = 32;
  const T1 = triSSS2(s, k), T2 = beside(T1, moveT(T1, { rot: r(R, 0, 359), flip: R() < 0.5, off: [0, 0] }), 'row');
  const i = r(R, 0, 2);
  const texts: { t: 0 | 1; k: 's' | 'a'; i: number; text: string }[] = [0, 1, 2].map(j => ({ t: 0 as const, k: 's' as const, i: j, text: String(s[j]) }));
  texts.push({ t: 1, k: 's', i, text: '?' });
  const fig = pairFig(T1, T2, L1, n2, [], { texts });
  const wrongs = [0, 1, 2].filter(j => j !== i).map(j => ({ v: s[j]!, mc: MC.ignoreCorr, say: `${segN(sideName(n2, i))} corresponds to ${segN(sideName(L1, i))}: match the letters by their places in the statement.` }));
  return numItem({
    id: `cpctcNum-${n}`, family: 'cpctcNum',
    prompt: `${stmt(L1, n2)}. The lengths of ${triN(L1)} are in centimeters. How long is ${segN(sideName(n2, i))}?`, board: `${triT(L1)} \\cong ${triT(n2)},\\ ${sideName(n2, i)} = \\,?`, unit: 'cm',
    solution: [`Letter under letter: ${[0, 1, 2].map(j => `${L1[j]} ↔ ${n2[j]}`).join(', ')}.`, `${segN(sideName(n2, i))} corresponds to ${segN(sideName(L1, i))} = ${s[i]} cm.`, `By CPCTC, ${sideName(n2, i)} = <b class="s">${s[i]}</b> cm.`],
    picture: { fig, reveal: {} },
  }, s[i]!, wrongs, 'Right: CPCTC.', 'Find the side of the first triangle in the same places of the statement.');
});
function triSSS2(s: number[], k: number) {
  const a = s[0]! * k, b = s[1]! * k, c = s[2]! * k, x = (b * b + c * c - a * a) / (2 * c), y = Math.sqrt(b * b - x * x);
  return [[0, 0], [c, 0], [x, y]] as [Pt, Pt, Pt];
}
export const cpctcEarly: Gen = (R, n) => fitted('cpctcEarly', () => {
  const p = makeProof(pick(R, HIDDEN_BANK), R);
  // insert the CPCTC line before the congruence line
  const N = p.rows.length, at0 = r(R, Math.max(1, N - 3), N - 1);
  const rows = p.rows.map(x => ({ st: x.st, rs: RS[x.rs] as string }));
  rows.splice(at0, 0, { st: p.next[0], rs: RS.cpctc });
  const opts: Opt[] = [{ t: `Line ${at0 + 1}`, ok: true, say: `Right: CPCTC needs the congruence, which only comes in line ${rows.length}.` }];
  const others = shuffle(R, [0, ...Array.from({ length: rows.length }, (_, i) => i).filter(i => i !== at0 && i !== 0)]).slice(0, 3);
  for (const i of others) opts.push({ t: `Line ${i + 1}`, mc: i === rows.length - 1 ? undefined : undefined, say: i === rows.length - 1 ? 'The congruence line is fine: its three pairs are above it.' : 'That line has its reason right where it stands.' });
  return choice(R, {
    id: `cpctcEarly-${n}`, family: 'cpctcEarly', prompt: 'Which line uses a fact before it is established?', board: p.prove,
    solution: [`Line ${at0 + 1} cites CPCTC.`, `CPCTC needs the triangles proved congruent, and that only happens in line ${rows.length}.`],
    picture: { fig: p.fig, proof: { given: p.given.length > 1 && p.given.join('').length < 60 ? [p.given.join(';\\ ')] : p.given, prove: p.prove, rows }, reveal: { strike: [at0] } },
  }, opts.filter((o, i) => opts.findIndex(x => x.t === o.t) === i));
});

export { side, dist };
