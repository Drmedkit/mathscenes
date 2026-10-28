// famA.ts: families for stage 1 of "Triangle congruence" (sub-goals read-markings ... classify-mixed): reading marks,
// correspondence, sufficiency, included parts, hypotenuse and legs, and the five criteria against AAA / SSA.
import { type GFItem, type Gen, type Opt, choiceItem, fitted, numItem, pick, q, r, shuffle } from '../geometry-foundations/kit';
import type { Pt } from '../geometry-foundations/geo';
import { type PMark, type Part, type Tri, CRIT_WORD, PERMS, names2, angN, angName3, angle, buildFig, critsOf, ov, pairFig, pairHtml, pairTex, partHtml, permName, randTri, segN, side, sideName, triN, triSSS, triT, beside, moveT, turnT } from './tri';
import { type Pattern, choice, critOfPattern, critOpts, makePair, patternOf, rot3 } from './pairs';
import { MC } from './triProofs';

const NAMES = ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli', 'Mia', 'Ravi', 'Zoe', 'Theo', 'Nia', 'Sam'];
const canon = (s: string) => [...s].sort().join('');
const stmt = (n1: string, n2: string) => `${triN(n1)} ≅ ${triN(n2)}`;
const stmtT = (n1: string, n2: string) => `${triT(n1)} \\cong ${triT(n2)}`;
const listH = (n1: string, n2: string, ps: readonly Part[]) => ps.map(p => pairHtml(n1, n2, p)).join(';  ');
/** the parts not in a list (sides, then angles) */
const freeParts = (ps: readonly Part[]): Part[] => [0, 1, 2].flatMap(i => [{ k: 's' as const, i }, { k: 'a' as const, i }]).filter(p => !ps.some(x => x.k === p.k && x.i === p.i));
const marksFor = (ps: readonly Part[]) => { let s = 0, a = 0; return ps.map(p => (p.k === 's' ? { k: 's' as const, i: p.i, n: ++s } : p.right ? { k: 'a' as const, i: p.i, box: true } : { k: 'a' as const, i: p.i, n: ++a })); };

// ---------- read-markings ----------
export const listPairs: Gen = (R, n) => fitted('listPairs', () => {
  const pat = pick(R, ['SSS', 'SAS', 'ASA', 'AAS'] as Pattern[]);
  const P = makePair(R, pat, 'row');
  const stated = R() < 0.5 ? r(R, 0, 2) : -1;
  const marked = P.parts.filter((_, i) => i !== stated);
  const fig = stated < 0 ? P.fig : pairFig(P.T1, P.T2, P.n1, P.n2, marksFor(marked));
  const right = listH(P.n1, P.n2, P.parts);
  const free = freeParts(P.parts);
  const extra = pick(R, free);
  const opts: Opt[] = [
    { t: right, ok: true, say: 'Right: every marked pair, plus the given in words, and nothing that only looks equal.' },
    { t: listH(P.n1, P.n2, [...P.parts, extra]), mc: MC.appearance, say: `${pairHtml(P.n1, P.n2, extra)} only looks true: it is not marked or given.` },
  ];
  // a mark read on the wrong part: one marked part replaced by a free part of the same kind
  const mi = P.parts.findIndex((p, i) => i !== stated && free.some(f => f.k === p.k));
  if (mi >= 0) {
    const sub = free.find(f => f.k === P.parts[mi]!.k)!;
    opts.push({ t: listH(P.n1, P.n2, P.parts.map((p, i) => (i === mi ? sub : p))), mc: MC.markWrongPart, say: `Look where that mark sits: it is on ${partHtml(P.n1, P.parts[mi]!)}, not on ${partHtml(P.n1, sub)}.` });
  }
  if (stated >= 0) opts.push({ t: listH(P.n1, P.n2, marked), say: 'A given stated in words counts too, even without a mark.' });
  else {
    const p0 = P.parts[0]!, j = (p0.i + 1) % 3;
    const bad = p0.k === 's' ? `${segN(sideName(P.n1, p0.i))} ≅ ${segN(sideName(P.n2, j))}` : `${angN(P.n1[p0.i]!)} ≅ ${angN(P.n2[j]!)}`;
    opts.push({ t: [bad, ...P.parts.slice(1).map(p => pairHtml(P.n1, P.n2, p))].join(';  '), mc: MC.ignoreCorr, say: 'A pair joins the two parts that carry the same mark.' });
  }
  const g = stated >= 0 ? P.parts[stated]! : null;
  return choice(R, {
    id: `listPairs-${n}`, family: 'listPairs',
    prompt: `${g ? `Given: ${pairHtml(P.n1, P.n2, g)}. ` : ''}The figure is not drawn to scale. Which list holds exactly the congruent pairs you may use?`,
    board: g ? pairTex(P.n1, P.n2, g) : stmtT(P.n1, P.n2).replace('\\cong', '\\ ?\\ '),
    solution: ['Read every tick, arc and box: the same number of ticks or arcs makes a pair.', g ? 'Add the given in words.' : 'Leave out everything that only looks equal.', `The pairs: ${right}.`],
    picture: { fig, reveal: {} },
  }, opts);
});

export const countPairs: Gen = (R, n) => fitted('countPairs', () => {
  const pat = pick(R, ['SSS', 'SAS', 'ASA', 'AAS', 'HL'] as Pattern[]);
  const P = makePair(R, pat, 'row');
  const m = R() < 0.6 ? 3 : 2, s = m === 3 ? 0 : (R() < 0.6 ? 1 : 0);
  const marked = P.parts.slice(0, m), stated = s ? P.parts[2]! : null;
  const fig = m === 3 ? P.fig : pairFig(P.T1, P.T2, P.n1, P.n2, marksFor(marked));
  const a = m + s;
  return numItem({
    id: `countPairs-${n}`, family: 'countPairs',
    prompt: `${stated ? `Given: ${pairHtml(P.n1, P.n2, stated)}. ` : ''}The figure is not drawn to scale. How many pairs of congruent parts do the marks and the givens state?`,
    board: stated ? pairTex(P.n1, P.n2, stated) : '\\text{pairs} = \\,?', unit: 'pairs',
    solution: [`The marks give ${m} pair${m > 1 ? 's' : ''}: ${listH(P.n1, P.n2, marked)}.`, stated ? 'The given in words adds one more.' : 'Nothing else is marked or given; looks do not count.'],
    picture: { fig, reveal: {} },
  }, a, [{ v: a + 1, mc: MC.appearance, say: 'Count only the marked and stated pairs: a pair that only looks equal does not count.' }, { v: 6, mc: MC.appearance, say: 'Only marked or stated pairs count, not every part that looks equal.' }, ...(stated ? [{ v: m, say: 'The given in words counts as a pair too.' }] : [])], 'Right: marked plus stated, nothing else.', 'Count each tick group, arc group and box pair once, then add the givens in words.');
});

export const whyNotList: Gen = (R, n) => fitted('whyNotList', () => {
  const pat = pick(R, ['SAS', 'ASA', 'AAS'] as Pattern[]);
  const P = makePair(R, pat, 'row');
  const f = freeParts(P.parts).find(p => p.k === 's') ?? freeParts(P.parts)[0]!;
  const who = pick(R, NAMES);
  const pairT = pairHtml(P.n1, P.n2, f);
  return choice(R, {
    id: `whyNotList-${n}`, family: 'whyNotList',
    prompt: `${f.k === 's' ? `${segN(sideName(P.n1, f.i))} and ${segN(sideName(P.n2, f.i))}` : `${angN(P.n1[f.i]!)} and ${angN(P.n2[f.i]!)}`} look the same size, but carry no mark and no given says so. May ${who} list ${pairT}?`,
    board: pairTex(P.n1, P.n2, f).replace('\\cong', '\\overset{?}{\\cong}'),
    solution: ['A diagram is not drawn to scale: only marks and givens count.', `${pairT} has neither.`],
    picture: { fig: P.fig, reveal: {} },
  }, [
    { t: 'No: it is not marked and not given', ok: true, say: 'Right: looking equal is not a reason.' },
    { t: 'Yes: they look equal', mc: MC.appearance, say: 'A diagram is not drawn to scale; only marks and givens count.' },
    { t: 'Yes, if a ruler shows the same length on the page', mc: MC.measureProof, say: 'Measuring one drawing proves nothing: the drawing is not to scale.' },
    { t: 'Yes: the figure looks carefully drawn', mc: MC.appearance, say: 'However careful a drawing looks, only marks and givens count.' },
  ]);
});

// ---------- read-correspondence ----------
export const corrPart: Gen = (R, n) => fitted('corrPart', () => {
  const P = makePair(R, 'SSS', 'row');
  const fig = pairFig(P.T1, P.T2, P.n1, P.n2, []);
  const asSide = R() < 0.6, i = r(R, 0, 2);
  const alpha = [...P.n2].sort().join('');
  let opts: Opt[];
  let ask: string, right: string;
  if (asSide) {
    ask = segN(sideName(P.n1, i)); right = segN(sideName(P.n2, i));
    opts = [0, 1, 2].map(j => {
      const t = segN(sideName(P.n2, j));
      if (j === i) return { t, ok: true, say: `Right: ${sideName(P.n1, i)} uses the letters in places ${pos(i)} of ${triN(P.n1)}, so take places ${pos(i)} of ${triN(P.n2)}.` };
      const byAlpha = canon(sideName(alpha, i)) === canon(sideName(P.n2, j));
      return { t, mc: byAlpha ? MC.vertexOrder : MC.byPosition, say: 'Match by place in the statement, not by alphabet or by where the letters sit on the page.' };
    });
  } else {
    ask = angN(P.n1[i]!); right = angN(P.n2[i]!);
    opts = [0, 1, 2].map(j => {
      const t = angN(P.n2[j]!);
      if (j === i) return { t, ok: true, say: `Right: ${P.n1[i]} is letter ${i + 1} of ${triN(P.n1)}, and letter ${i + 1} of ${triN(P.n2)} is ${P.n2[i]}.` };
      return { t, mc: alpha[i] === P.n2[j] ? MC.vertexOrder : MC.byPosition, say: 'Match by place in the statement, not by alphabet or by where the letters sit on the page.' };
    });
  }
  return choice(R, {
    id: `corrPart-${n}`, family: 'corrPart',
    prompt: `${stmt(P.n1, P.n2)}. Which part of ${triN(P.n2)} corresponds to ${ask}?`, board: stmtT(P.n1, P.n2),
    solution: [`Write the statement letter under letter: ${[0, 1, 2].map(k => `${P.n1[k]} ↔ ${P.n2[k]}`).join(', ')}.`, `So ${ask} corresponds to ${right}.`],
    picture: { fig, reveal: {} },
  }, opts);
});
const pos = (i: number) => (i === 0 ? '2 and 3' : i === 1 ? '3 and 1' : '1 and 2');

export const corrPick: Gen = (R, n) => fitted('corrPick', () => {
  const P = makePair(R, 'SSS', 'row');
  const fig = pairFig(P.T1, P.T2, P.n1, P.n2, []);
  const alpha = [...P.n2].sort().join('');
  const cands: Opt[] = [];
  const iR = r(R, 0, 2), kind = R() < 0.5 ? 's' : 'a';
  const txt = (k: string, i: number, j: number) => (k === 's' ? `${segN(sideName(P.n1, i))} ≅ ${segN(sideName(P.n2, j))}` : `${angN(P.n1[i]!)} ≅ ${angN(P.n2[j]!)}`);
  cands.push({ t: txt(kind, iR, iR), ok: true, say: 'Right: both parts sit in the same places of the statement.' });
  for (let t = 0; t < 30 && cands.length < 4; t++) {
    const k = R() < 0.5 ? 's' : 'a', i = r(R, 0, 2), j = r(R, 0, 2);
    if (i === j) continue;
    const tx = txt(k, i, j);
    if (cands.some(c => c.t === tx)) continue;
    const byAlpha = k === 's' ? canon(sideName(alpha, i)) === canon(sideName(P.n2, j)) : alpha[i] === P.n2[j];
    cands.push({ t: tx, mc: byAlpha ? MC.vertexOrder : MC.ignoreCorr, say: 'Those parts are not in the same places of the statement.' });
  }
  return choice(R, {
    id: `corrPick-${n}`, family: 'corrPick',
    prompt: `${stmt(P.n1, P.n2)}. Which is a pair of corresponding parts?`, board: stmtT(P.n1, P.n2),
    solution: [`Letter under letter: ${[0, 1, 2].map(k => `${P.n1[k]} ↔ ${P.n2[k]}`).join(', ')}.`, 'A side matches the side with the matching end letters, an angle the angle at the matching vertex.'],
    picture: { fig, reveal: {} },
  }, cands);
});

// ---------- sufficiency-meaning ----------
const FIX_CARDS = [
  { text: (w: string) => `${w} builds a triangle from AB = 6 in, m∠A = 50° and AC = 9 in five times. All five match. What makes SAS a congruence criterion?`, right: 'Every triangle with those three parts is a copy of every other: the parts fix one triangle up to rigid motion', wrong: [{ t: 'The five triangles matched', mc: MC.examples }, { t: 'Every copy comes out facing the same way', mc: MC.flipped }] },
  { text: (w: string) => `${w} says: “a set of three parts is a congruence criterion when it fixes the triangle.” What does “fixes” mean?`, right: 'Any two triangles with those parts can be carried onto each other by a rigid motion', wrong: [{ t: 'The triangle in the drawing has those parts', mc: MC.drawnCase }, { t: 'Copies with those parts all face the same way on the page', mc: MC.flipped }] },
  { text: (w: string) => `${w} tried AAA on one pair of triangles, and they happened to be congruent. Does that make AAA a criterion?`, right: 'No: a criterion must work for every pair with those parts, and a scaled copy has the same angles', wrong: [{ t: 'Yes: it worked for that pair', mc: MC.examples }, { t: 'Yes: three pairs of parts always fix a triangle', mc: MC.aaa }] },
];
export const fixOne: Gen = (R, n) => {
  const k = pick(R, FIX_CARDS), who = pick(R, NAMES);
  return choice(R, {
    id: `fixOne-${n}`, family: 'fixOne', prompt: k.text(who), board: '\\text{criterion}',
    solution: ['A criterion is a claim about every pair of triangles with the listed parts.', 'It holds when the parts leave only one triangle, up to a rigid motion (turned or flipped copies included).'],
    picture: { card: { lines: [k.text(who)] } },
  }, [{ t: k.right, ok: true, say: 'Right: sufficiency is about every triangle with those parts.' }, ...k.wrong.map(w => ({ t: w.t, mc: w.mc, say: w.mc === MC.flipped ? 'A flipped copy is still congruent: a reflection is a rigid motion.' : w.mc === MC.aaa ? 'Angles fix the shape, not the size.' : 'One or a few examples never cover every triangle.' }))]);
};

export const mirrorCopy: Gen = (R, n) => fitted('mirrorCopy', () => {
  // triangle ABC and its mirror image ABD across AB (one side shared)
  const T = randTri(R, { base: 330, turn: false });
  const A = T[0], B = T[1], C = T[2], D: Pt = [C[0], -C[1]];
  const ang = r(R, -30, 30);
  const rot = (p: Pt): Pt => { const t = (ang * Math.PI) / 180; return [p[0] * Math.cos(t) - p[1] * Math.sin(t), p[0] * Math.sin(t) + p[1] * Math.cos(t)]; };
  const [L] = names2(R);
  const nm = { A: L[0]!, B: L[1]!, C: L[2]!, D: pick(R, ['D', 'E', 'F', 'K', 'M'].filter(x => !L.includes(x))) };
  const pts: Record<string, Pt> = { [nm.A]: rot(A), [nm.B]: rot(B), [nm.C]: rot(C), [nm.D]: rot(D) };
  const fig = buildFig({ pts, segs: [nm.A + nm.B, nm.A + nm.C, nm.B + nm.C, nm.A + nm.D, nm.B + nm.D], marks: [{ seg: nm.A + nm.C, n: 1 }, { seg: nm.A + nm.D, n: 1 }, { seg: nm.B + nm.C, n: 2 }, { seg: nm.B + nm.D, n: 2 }], fills: [{ pts: nm.A + nm.B + nm.C }, { pts: nm.A + nm.B + nm.D }] });
  const t1 = nm.A + nm.B + nm.C, t2 = nm.A + nm.B + nm.D;
  const asMotion = R() < 0.5;
  const base: Opt[] = asMotion ? [
    { t: `A reflection across line ${nm.A}${nm.B}`, ok: true, say: `Right: the reflection keeps ${nm.A} and ${nm.B} and swaps the sides of the line.` },
    { t: 'A translation', say: 'A slide would move the shared side; the copy faces the other way.' },
    { t: 'None: a copy that faces the other way is not congruent', mc: MC.flipped, say: 'A reflection is a rigid motion: flipped copies are congruent.' },
  ] : [
    { t: `Yes: a reflection across ${segN(nm.A + nm.B)} carries one onto the other`, ok: true, say: 'Right: SSS with the shared side, and the reflection shows it.' },
    { t: 'No: they face opposite ways', mc: MC.flipped, say: 'Facing the other way is fine: a reflection is a rigid motion.' },
    { t: 'Can’t tell: only two pairs are marked', mc: MC.onlyMarked, say: `The shared side ${segN(nm.A + nm.B)} is the third pair: it is congruent to itself.` },
  ];
  return choice(R, {
    id: `mirrorCopy-${n}`, family: 'mirrorCopy',
    prompt: asMotion ? `${triN(t1)} and ${triN(t2)} share ${segN(nm.A + nm.B)}. Which rigid motion carries ${triN(t1)} onto ${triN(t2)}?` : `${triN(t1)} and ${triN(t2)} share ${segN(nm.A + nm.B)}. Are they congruent?`,
    board: `${triT(t1)}\\ ?\\ ${triT(t2)}`,
    solution: [`The marks give ${segN(nm.A + nm.C)} ≅ ${segN(nm.A + nm.D)} and ${segN(nm.B + nm.C)} ≅ ${segN(nm.B + nm.D)}; ${segN(nm.A + nm.B)} is shared.`, `SSS fixes the triangle up to rigid motion: here the motion is the reflection across line ${nm.A}${nm.B}.`],
    picture: { fig, reveal: {} },
  }, base);
});

// ---------- included-parts ----------
export const includedPart: Gen = (R, n) => fitted('includedPart', () => {
  const T = randTri(R, { base: 360 });
  const [L] = names2(R);
  const i = r(R, 0, 2), a = (i + 1) % 3, b = (i + 2) % 3;
  const askAngle = R() < 0.5;
  const pts = Object.fromEntries([0, 1, 2].map(k => [L[k]!, T[k]!])) as Record<string, Pt>;
  const segs = [0, 1, 2].map(k => sideName(L, k));
  // the two named parts are coloured; the answer part is not marked
  const marks = askAngle ? [{ seg: sideName(L, a), col: 'first' as const, lone: true }, { seg: sideName(L, b), col: 'first' as const, lone: true }] : [{ ang: angName3(L, a), col: 'second' as const, lone: true }, { ang: angName3(L, b), col: 'second' as const, lone: true }];
  const fig = buildFig({ pts, segs, marks, fills: [{ pts: L }], segStyle: askAngle ? { [sideName(L, a)]: { col: 'first' }, [sideName(L, b)]: { col: 'first' } } : {} });
  const opts: Opt[] = askAngle
    ? [0, 1, 2].map(k => ({ t: angN(L[k]!), ok: k === i, mc: k === i ? undefined : MC.ssa, say: k === i ? `Right: ∠${L[i]} sits where ${segN(sideName(L, a))} and ${segN(sideName(L, b))} meet.` : `∠${L[k]} touches only one of the two sides: it is not between them.` }))
    : [0, 1, 2].map(k => ({ t: segN(sideName(L, k)), ok: k === i, mc: k === i ? undefined : MC.order, say: k === i ? `Right: ${segN(sideName(L, i))} joins the vertices of ∠${L[a]} and ∠${L[b]}.` : 'That side runs from one of the angles to the third vertex, not between the two angles.' }));
  return choice(R, {
    id: `includedPart-${n}`, family: 'includedPart',
    prompt: askAngle ? `Which angle is included between ${segN(sideName(L, a))} and ${segN(sideName(L, b))}?` : `Which side is included between ${angN(L[a]!)} and ${angN(L[b]!)}?`,
    board: askAngle ? `${ov(sideName(L, a))},\\ ${ov(sideName(L, b))}` : `\\angle ${L[a]},\\ \\angle ${L[b]}`,
    solution: askAngle ? [`${segN(sideName(L, a))} and ${segN(sideName(L, b))} share the letter ${L[i]}.`, `The included angle is the one at that shared vertex: ∠${L[i]}.`] : [`The side between two angles joins their vertices ${L[a]} and ${L[b]}.`, `That is ${segN(sideName(L, i))}.`],
    picture: { fig, reveal: {} },
  }, opts);
});

export const patternName: Gen = (R, n) => {
  const pat = pick(R, ['SAS', 'SSA', 'ASA', 'AAS'] as Pattern[]);
  const [L1, L2] = names2(R);
  const n2 = permName(L2, pick(R, PERMS));
  const k = r(R, 0, 2), a = (k + 1) % 3, b = (k + 2) % 3;
  const parts: Part[] = pat === 'SAS' ? [{ k: 's', i: a }, { k: 'a', i: k }, { k: 's', i: b }] : pat === 'SSA' ? [{ k: 's', i: a }, { k: 's', i: k }, { k: 'a', i: k }] : pat === 'ASA' ? [{ k: 'a', i: a }, { k: 's', i: k }, { k: 'a', i: b }] : [{ k: 'a', i: a }, { k: 'a', i: b }, { k: 's', i: a }];
  if (patternOf(parts) !== pat) throw new Error('patternName');
  const list = shuffle(R, parts.slice());
  const say: Record<string, string> = {
    SAS: 'The angle sits between the two sides: SAS.', SSA: 'The angle is at an end of only one of the sides: SSA.', ASA: 'The side joins the two angles: ASA.', AAS: 'The side is not between the two angles: AAS.',
  };
  return choice(R, {
    id: `patternName-${n}`, family: 'patternName',
    prompt: `The given pairs are ${list.map(p => pairHtml(L1, n2, p)).join(', ')}. Read them around ${triN(L1)}: which pattern are they?`,
    board: list.map(p => pairTex(L1, n2, p)).join(',\\ '),
    solution: [`In ${triN(L1)} the parts are ${list.map(p => partHtml(L1, p)).join(', ')}.`, say[pat]!],
    picture: { card: { lines: [`${list.map(p => pairHtml(L1, n2, p)).join('     ')}`] } },
  }, (['SAS', 'SSA', 'ASA', 'AAS'] as Pattern[]).map(c => ({ t: c, ok: c === pat, mc: c === pat ? undefined : MC.order, say: c === pat ? `Right: ${say[pat]}` : `Check where the angle(s) sit: ${say[pat]}` })), true);
};

// ---------- hypotenuse-legs ----------
export const findHyp: Gen = (R, n) => fitted('findHyp', () => {
  const T0 = randTri(R, { base: 340, right: true, turn: false });
  // orientations: right angle at the bottom, top or side; the hypotenuse sometimes horizontal
  const hypFlat = R() < 0.35;
  let T = T0;
  if (hypFlat) { const d = [T0[2]![0] - T0[1]![0], T0[2]![1] - T0[1]![1]]; T = turnT(T0, -Math.atan2(d[1]!, d[0]!) * 180 / Math.PI + (R() < 0.5 ? 0 : 180)); }
  else T = turnT(T0, r(R, 0, 359));
  const [L] = names2(R);
  const pts = Object.fromEntries([0, 1, 2].map(k => [L[k]!, T[k]!])) as Record<string, Pt>;
  const fig = buildFig({ pts, segs: [0, 1, 2].map(k => sideName(L, k)), marks: [{ ang: angName3(L, 0), box: true }], fills: [{ pts: L }] });
  const askLegs = R() < 0.35;
  const low = [0, 1, 2].sort((x, y) => (T[(x + 1) % 3]![1] + T[(x + 2) % 3]![1]) - (T[(y + 1) % 3]![1] + T[(y + 2) % 3]![1]))[0]!;
  const opts: Opt[] = askLegs
    ? [[1, 2], [0, 1], [0, 2]].map(([x, y]) => ({ t: `${segN(sideName(L, x!))} and ${segN(sideName(L, y!))}`, ok: x === 1 && y === 2, mc: x === 1 && y === 2 ? undefined : MC.hypVisual, say: x === 1 && y === 2 ? 'Right: the legs are the two sides that form the right angle.' : `${segN(sideName(L, 0))} is opposite the right angle: it is the hypotenuse, not a leg.` }))
    : [0, 1, 2].map(k => ({ t: segN(sideName(L, k)), ok: k === 0, mc: k === 0 ? undefined : MC.hypVisual, say: k === 0 ? `Right: ${segN(sideName(L, 0))} is opposite the right angle at ${L[0]}.` : k === low ? 'Being at the bottom does not make a side the hypotenuse: find the side opposite the box.' : 'The hypotenuse is opposite the right angle, wherever the triangle points.' }));
  return choice(R, {
    id: `findHyp-${n}`, family: 'findHyp',
    prompt: askLegs ? `${triN(L)} has a right angle at ${L[0]}. Which two sides are the legs?` : `${triN(L)} has a right angle at ${L[0]}. Which side is the hypotenuse?`,
    board: `\\angle ${L[0]} = 90^\\circ`,
    solution: [`The box marks the right angle at ${L[0]}.`, `The hypotenuse is the side opposite it: ${segN(sideName(L, 0))}; the legs are ${segN(sideName(L, 1))} and ${segN(sideName(L, 2))}.`, askLegs ? `So: ${segN(sideName(L, 1))} and ${segN(sideName(L, 2))}.` : `So: ${segN(sideName(L, 0))}.`],
    picture: { fig, reveal: {} },
  }, opts);
});

export const isRight: Gen = (R, n) => fitted('isRight', () => {
  const marked = R() < 0.45;
  // the unmarked one is drawn close to a right angle (87-93°, sometimes exactly 90°) but carries no box
  const d = marked ? 90 : pick(R, [87, 88, 90, 92, 93]);
  const B = r(R, 38, 52), T0 = turnT(rot3(triAngleAt(d, B, r(R, 320, 360)), 0), r(R, 0, 359));
  const [L] = names2(R);
  const pts = Object.fromEntries([0, 1, 2].map(k => [L[k]!, T0[k]!])) as Record<string, Pt>;
  const fig = buildFig({ pts, segs: [0, 1, 2].map(k => sideName(L, k)), marks: marked ? [{ ang: angName3(L, 0), box: true }] : [], fills: [{ pts: L }] });
  const none = 'None: no angle is marked right';
  const opts: Opt[] = [
    ...[0, 1, 2].map(k => ({ t: segN(sideName(L, k)), ok: marked && k === 0, mc: marked ? MC.hypVisual : MC.appearance, say: marked ? (k === 0 ? 'Right: opposite the box.' : 'The hypotenuse is opposite the box.') : 'No angle is marked right, so there is no hypotenuse to name: it only looks like a right triangle.' })),
    { t: none, ok: !marked, mc: marked ? undefined : undefined, say: marked ? 'The box at ' + L[0] + ' marks a right angle.' : 'Right: without a box or a given, the triangle is not known to be right.' },
  ];
  return choice(R, {
    id: `isRight-${n}`, family: 'isRight',
    prompt: `Which side of ${triN(L)} is a hypotenuse? The figure is not drawn to scale.`, board: `\\triangle ${L}`,
    solution: marked ? [`The box marks a right angle at ${L[0]}.`, `So: ${segN(sideName(L, 0))}.`] : ['A hypotenuse needs a right angle, and only a box or a given makes an angle right.', `So: ${none}.`],
    picture: { fig, reveal: {} },
  }, opts);
});
/** a triangle with angle d at V0 and angle B at V1 */
function triAngleAt(d: number, B: number, base: number): Tri {
  // V0 at the origin, V1 at (base, 0): the third vertex where the two rays meet
  const a = (d * Math.PI) / 180, b = ((180 - B) * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a), wx = Math.cos(b), wy = Math.sin(b);
  const s = (base * wy) / (ux * wy - uy * wx);
  return [[0, 0], [base, 0], [s * ux, s * uy]];
}

// ---------- the criteria ----------
const PAT_OF_SG: Record<string, Pattern[]> = {
  sss: ['SSS'], sas: ['SAS', 'SAS', 'SSA'], asa: ['ASA', 'ASA', 'AAA'], aas: ['AAS'], hl: ['HL', 'HL', 'SAS'],
  'classify-mixed': ['SSS', 'SAS', 'ASA', 'AAS', 'HL', 'AAA', 'SSA'],
};
export const classify: Gen = (R, n, sg) => fitted('classify', () => {
  let pat = pick(R, PAT_OF_SG[sg ?? ''] ?? PAT_OF_SG['classify-mixed']!);
  // hl: the two-leg case is SAS with the right angle between the legs
  const twoLeg = sg === 'hl' && pat === 'SAS';
  const P = twoLeg ? twoLegPair(R) : makePair(R, pat, 'row');
  if (twoLeg) pat = 'SAS';
  const ans = critOfPattern(pat);
  return choice(R, {
    id: `classify-${n}`, family: 'classify',
    prompt: 'The marks show three pairs of congruent parts. Which criterion proves the triangles congruent, if any?',
    board: listOfTex(P.n1, P.n2, P.parts),
    solution: [`Marked: ${listH(P.n1, P.n2, P.parts)}.`, whereSay(pat), `So: ${CRIT_WORD[ans]}.`],
    picture: { fig: P.fig, reveal: {} },
  }, critOpts(P.parts, ans, { flip: P.flip, pat }));
});
const listOfTex = (n1: string, n2: string, ps: readonly Part[]) => ps.map(p => pairTex(n1, n2, p)).join(',\\ ');
function whereSay(p: Pattern): string {
  return {
    SSS: 'Three pairs of sides: SSS.', SAS: 'The marked angle sits between the two marked sides: SAS.', ASA: 'The marked side joins the two marked angles: ASA.',
    AAS: 'The marked side is not between the two marked angles: AAS.', HL: 'Both triangles are marked right, with the hypotenuses and one pair of legs congruent: HL.',
    AAA: 'Three pairs of angles fix the shape but not the size (AAA).', SSA: 'The marked angle is not between the two marked sides (SSA), and it is not a right angle.',
  }[p];
}
function twoLegPair(R: () => number) {
  // right triangles with the two legs marked: SAS with the right angle included
  for (let t = 0; t < 40; t++) {
    const P = makePair(R, 'HL', 'row');
    const k = P.parts.find(p => p.right)!.i;
    const parts: Part[] = [{ k: 's', i: (k + 1) % 3 }, { k: 'a', i: k, right: true }, { k: 's', i: (k + 2) % 3 }];
    try { return { ...P, parts, fig: pairFig(P.T1, P.T2, P.n1, P.n2, marksFor(parts)) }; } catch { continue; }
  }
  throw new Error('twoLegPair');
}

export const classifyList: Gen = (R, n) => {
  const pat = pick(R, ['SSS', 'SAS', 'ASA', 'AAS', 'AAA', 'SSA'] as Pattern[]);
  const [L1, L2] = names2(R);
  const n2 = permName(L2, pick(R, PERMS));
  const parts = pat === 'SSA' ? (() => { const k = r(R, 0, 2); return [{ k: 'a', i: k }, { k: 's', i: k }, { k: 's', i: (k + 1) % 3 }] as Part[]; })() : pat === 'AAA' ? [0, 1, 2].map(i => ({ k: 'a' as const, i })) : partsByPat(pat, R);
  const list = shuffle(R, parts.slice());
  const ans = critOfPattern(pat);
  const lines = list.map(p => pairHtml(L1, n2, p));
  return choice(R, {
    id: `classifyList-${n}`, family: 'classifyList',
    prompt: `Given: ${lines.join(', ')}. Which criterion proves ${stmt(L1, n2)}, if any?`, board: listOfTex(L1, n2, list),
    solution: [`In ${triN(L1)} the parts are ${list.map(p => partHtml(L1, p)).join(', ')}.`, whereSay(pat), `So: ${CRIT_WORD[ans]}.`],
    picture: { card: { lines: [`Given: ${lines.join(';   ')}`, `Prove: ${stmt(L1, n2)}`] } },
  }, critOpts(parts, ans, { pat }));
};
function partsByPat(p: Pattern, R: () => number): Part[] {
  const k = r(R, 0, 2), a = (k + 1) % 3, b = (k + 2) % 3;
  return p === 'SSS' ? [0, 1, 2].map(i => ({ k: 's' as const, i })) : p === 'SAS' ? [{ k: 's', i: a }, { k: 'a', i: k }, { k: 's', i: b }] : p === 'ASA' ? [{ k: 'a', i: a }, { k: 's', i: k }, { k: 'a', i: b }] : [{ k: 'a', i: a }, { k: 'a', i: b }, { k: 's', i: R() < 0.5 ? a : b }];
}

// numeric sides: SSS with labelled lengths
const SSS_SETS = [[5, 7, 9], [6, 8, 11], [4, 7, 9], [7, 9, 12], [5, 8, 10], [6, 9, 13], [8, 10, 13]];
export const sssNum: Gen = (R, n) => fitted('sssNum', () => {
  const s = shuffle(R, pick(R, SSS_SETS).slice());
  const same = R() < 0.6;
  const s2 = same ? s.slice() : s.map((x, i) => (i === 2 ? x + pick(R, [-1, 1]) : x));
  const k = 34;
  const T1 = turnT(triSSS(s[0]! * k, s[1]! * k, s[2]! * k), r(R, 0, 359));
  const T2a = triSSS(s2[0]! * k, s2[1]! * k, s2[2]! * k);
  const flip = R() < 0.5;
  const T2 = beside(T1, moveT(T2a, { rot: r(R, 0, 359), flip, off: [0, 0] }), 'row');
  const [L1, L2] = names2(R);
  const n2 = permName(L2, pick(R, PERMS));
  const texts = [0, 1, 2].flatMap(i => [{ t: 0 as const, k: 's' as const, i, text: String(s[i]) }, { t: 1 as const, k: 's' as const, i, text: String(s2[i]) }]);
  const fig = pairFig(T1, T2, L1, n2, [], { texts });
  return choice(R, {
    id: `sssNum-${n}`, family: 'sssNum',
    prompt: `The side lengths are in inches. Are ${triN(L1)} and ${triN(n2)} congruent?`, board: `${triT(L1)}\\ ?\\ ${triT(n2)}`,
    solution: [`${triN(L1)}: ${[...s].sort((a, b) => a - b).join(', ')}. ${triN(n2)}: ${[...s2].sort((a, b) => a - b).join(', ')}.`, same ? 'Three pairs of equal sides fix the triangle: SSS, whichever way it faces.' : 'One side length has no partner, so no rigid motion can match them.'],
    picture: { fig, reveal: {} },
  }, [
    { t: 'Yes, by SSS', ok: same, mc: same ? undefined : MC.appearance, say: same ? 'Right: three pairs of equal sides.' : 'Compare all three lengths: one has no partner.' },
    { t: 'No: one side length has no partner', ok: !same, say: same ? 'Every length has a partner: 3 pairs of equal sides.' : 'Right: congruent triangles have the same three side lengths.' },
    { t: 'No: they face different ways', mc: MC.flipped, say: 'Facing another way is fine: turns and flips are rigid motions.' },
    { t: 'Can’t tell without the angles', say: 'Three side lengths fix the angles too: SSS is enough.' },
  ]);
});

export const missingPair: Gen = (R, n, sg) => fitted('missingPair', () => {
  const crit = sg === 'asa' ? 'ASA' : sg === 'sss' ? 'SSS' : 'SAS';
  const P = makePair(R, crit as Pattern, 'row');
  const k = r(R, 0, 2), a = (k + 1) % 3, b = (k + 2) % 3;
  const n1 = P.n1, n2 = P.n2;
  // two pairs marked; the missing pair is asked
  let shown: Part[], right: Part, wrong: { p: Part; mc?: string; say: string }[];
  if (crit === 'SAS') {
    shown = [{ k: 's', i: a }, { k: 's', i: b }]; right = { k: 'a', i: k };
    wrong = [{ p: { k: 'a', i: a }, mc: MC.ssa, say: 'That angle is not between the two marked sides: SSA.' }, { p: { k: 'a', i: b }, mc: MC.ssa, say: 'That angle is not between the two marked sides: SSA.' }];
  } else if (crit === 'ASA') {
    shown = [{ k: 'a', i: a }, { k: 'a', i: b }]; right = { k: 's', i: k };
    wrong = [{ p: { k: 'a', i: k }, mc: MC.aaa, say: 'A third angle pair adds nothing: three angles fix the shape, not the size.' }];
  } else {
    shown = [{ k: 's', i: a }, { k: 's', i: b }]; right = { k: 's', i: k };
    wrong = [{ p: { k: 'a', i: a }, say: 'SSS uses three pairs of sides, no angles.' }];
  }
  const fig = pairFig(P.T1, P.T2, n1, n2, marksFor(shown));
  const nonCorr = right.k === 's' ? `${segN(sideName(n1, right.i))} ≅ ${segN(sideName(n2, (right.i + 1) % 3))}` : `${angN(n1[right.i]!)} ≅ ${angN(n2[(right.i + 1) % 3]!)}`;
  const opts: Opt[] = [
    { t: pairHtml(n1, n2, right), ok: true, say: `Right: that completes ${crit}.` },
    ...wrong.map(w => ({ t: pairHtml(n1, n2, w.p), mc: w.mc, say: w.say })),
    { t: nonCorr, mc: MC.ignoreCorr, say: 'Those two parts do not correspond: their letters sit in different places of the statement.' },
  ];
  return choice(R, {
    id: `missingPair-${n}`, family: 'missingPair',
    prompt: `Two pairs are marked. Which pair must be added so that ${crit} proves ${stmt(n1, n2)}?`, board: stmtT(n1, n2),
    solution: [`Marked: ${listH(n1, n2, shown)}.`, crit === 'SAS' ? 'SAS needs the angle between the two sides.' : crit === 'ASA' ? 'ASA needs the side between the two angles.' : 'SSS needs the third pair of sides.', `So: ${pairHtml(n1, n2, right)}.`],
    picture: { fig, reveal: {} },
  }, opts);
});

export const aasThird: Gen = (R, n) => fitted('aasThird', () => {
  const P = makePair(R, 'AAS', 'row');
  const angs = P.parts.filter(p => p.k === 'a').map(p => p.i);
  const third = [0, 1, 2].find(i => !angs.includes(i))!;
  const m = angs.map(i => Math.round(angle(P.T1, i)));
  // relabel exact: the triangle is built from whole-degree angles in randTri, so the measures are whole numbers
  const texts = angs.flatMap(i => [{ t: 0 as const, k: 'a' as const, i, text: `${Math.round(angle(P.T1, i))}°` }]);
  const fig = pairFig(P.T1, P.T2, P.n1, P.n2, P.marks, { texts });
  const ans = 180 - m[0]! - m[1]!;
  return numItem({
    id: `aasThird-${n}`, family: 'aasThird',
    prompt: `The arcs mark ${angN(P.n1[angs[0]!]!)} ≅ ${angN(P.n2[angs[0]!]!)} and ${angN(P.n1[angs[1]!]!)} ≅ ${angN(P.n2[angs[1]!]!)}. What is m${angN(P.n2[third]!)}?`,
    board: `m\\angle ${P.n2[third]} = \\,?`, unit: '°',
    solution: [`The angles of a triangle add to 180°, and ${triN(P.n2)} has the same two angles: ${m[0]}° and ${m[1]}°.`, `m${angN(P.n2[third]!)} = 180° − ${m[0]}° − ${m[1]}°.`, `That is <b class="s">${ans}°</b>, the same as m${angN(P.n1[third]!)}: AAS is ASA in disguise.`],
    picture: { fig, reveal: {} },
  }, ans, [{ v: m[0]! + m[1]!, say: 'That is the sum of the two angles; take it away from 180°.' }, { v: 180 - m[0]!, say: 'Take away both known angles.' }], 'Right: the third angles match too.', 'The three angles of a triangle add to 180°.');
});

export const aasSide: Gen = (R, n) => fitted('aasSide', () => {
  const P = makePair(R, 'AAS', 'row');
  const angs = P.parts.filter(p => p.k === 'a');
  const [x, y] = [angs[0]!.i, angs[1]!.i];
  const inc = [0, 1, 2].find(i => i !== x && i !== y)!;   // the side between the two angles
  const non = pick(R, [x, y]);
  const shown = angs;
  const fig = pairFig(P.T1, P.T2, P.n1, P.n2, marksFor(shown));
  return choice(R, {
    id: `aasSide-${n}`, family: 'aasSide',
    prompt: `Two angle pairs are marked. Which side pair makes the pattern AAS?`, board: stmtT(P.n1, P.n2),
    solution: [`AAS needs a pair of corresponding sides that is not between the two angles.`, `${segN(sideName(P.n1, non))} is not between ∠${P.n1[x]} and ∠${P.n1[y]}, and it pairs with ${segN(sideName(P.n2, non))}.`, `So: ${pairHtml(P.n1, P.n2, { k: 's', i: non })}.`],
    picture: { fig, reveal: {} },
  }, [
    { t: pairHtml(P.n1, P.n2, { k: 's', i: non }), ok: true, say: 'Right: a corresponding side that is not between the angles.' },
    { t: pairHtml(P.n1, P.n2, { k: 's', i: inc }), say: 'That side is between the two angles: that pattern is ASA.' },
    { t: `${segN(sideName(P.n1, non))} ≅ ${segN(sideName(P.n2, non === x ? y : x))}`, mc: MC.aasNonCorr, say: 'The two sides must correspond: opposite corresponding angles.' },
    { t: 'None: the side has to be between the angles', mc: MC.misAAS, say: 'AAS works: the third angles match, so it is ASA in disguise.' },
  ]);
});

export const hlCheck: Gen = (R, n) => fitted('hlCheck', () => {
  const v = pick(R, ['hl', 'hl', 'oneRight', 'legHyp'] as const);
  const [L1, L2] = names2(R);
  const n2 = permName(L2, pick(R, PERMS));
  const T1 = randTri(R, { right: true, base: 300 });   // right angle at V0, hypotenuse = side 0
  let T2src: Tri = T1;
  const marks: PMark[] = [];
  if (v === 'hl') { marks.push({ k: 'a', i: 0, box: true }, { k: 's', i: 0, n: 1 }, { k: 's', i: 1, n: 2 }); }
  if (v === 'oneRight') {
    // same hypotenuse length and leg, but the angle at V0 is not right in the second triangle
    const c = side(T1, 2), a = side(T1, 0), beta = pick(R, [72, 76, 104, 108]);
    const t = c * Math.cos((beta * Math.PI) / 180) + Math.sqrt(a * a - (c * Math.sin((beta * Math.PI) / 180)) ** 2);
    T2src = [[0, 0], [c, 0], [t * Math.cos((beta * Math.PI) / 180), t * Math.sin((beta * Math.PI) / 180)]];
    marks.push({ k: 'a', i: 0, box: true, only: 0 }, { k: 's', i: 0, n: 1 }, { k: 's', i: 2, n: 2 });
  }
  if (v === 'legHyp') {
    // T1's hypotenuse pairs with a leg of T2: T2 is right at V0 with legs (a, b)
    const a = side(T1, 0), b = side(T1, 1);
    T2src = [[0, 0], [a, 0], [0, b]];
    marks.push({ k: 'a', i: 0, box: true }, { k: 's', i: 0, j: 2, n: 1 }, { k: 's', i: 1, n: 2 });
  }
  const T2 = beside(T1, moveT(T2src, { rot: r(R, 0, 359), flip: R() < 0.5, off: [0, 0] }), 'row');
  const fig = pairFig(T1, T2, L1, n2, marks);
  const right = { hl: 'Yes, by HL', oneRight: 'No: only one triangle is marked right', legHyp: 'No: a hypotenuse is paired with a leg' }[v];
  return choice(R, {
    id: `hlCheck-${n}`, family: 'hlCheck',
    prompt: `Do the marks prove ${stmt(L1, n2)} by HL?`, board: `${triT(L1)} \\cong ${triT(n2)}\\ ?`,
    solution: ['HL needs: both triangles marked right, a pair of hypotenuses, and a pair of legs.', v === 'hl' ? 'All three are marked.' : v === 'oneRight' ? `Only ${triN(L1)} has a box.` : `${segN(sideName(L1, 0))} is a hypotenuse but ${segN(sideName(n2, 2))} is a leg.`, `So: ${right}.`],
    picture: { fig, reveal: {} },
  }, [
    { t: 'Yes, by HL', ok: v === 'hl', mc: v === 'oneRight' ? MC.hlMis : v === 'legHyp' ? MC.hlLegHyp : undefined, say: v === 'hl' ? 'Right: two right triangles, hypotenuses and a leg pair.' : v === 'oneRight' ? 'HL needs both triangles to be right.' : 'HL pairs hypotenuse with hypotenuse and leg with leg.' },
    { t: 'No: only one triangle is marked right', ok: v === 'oneRight', say: v === 'oneRight' ? 'Right: the second triangle is not known to be right.' : 'Both triangles carry a box.' },
    { t: 'No: a hypotenuse is paired with a leg', ok: v === 'legHyp', say: v === 'legHyp' ? 'Right: the side opposite the box in one is a leg in the other.' : 'Check which side is opposite each box.' },
    { t: 'No: HL needs the right angle between the marked sides', mc: MC.validSSA, say: 'That is SAS. HL is the right-angle case where the angle is not between the sides, and it works.' },
  ]);
});

export { critsOf, triSSS, rot3 };
export type { GFItem };
