// famC.ts: stage 3 of "Similar triangles" (sub-goals justify-criterion-conditions ... indirect-measurement): reasons
// for each condition, similarity proofs (order, reasons, the last line), the proportion a proof gives, the
// Pythagorean theorem from the altitude, the side-splitter theorem and its converse, circular arguments, and
// indirect measurement (shadows, a mirror, a river) with realistic numbers and stated assumptions.
import { type Fig, type Pt, add, at, mul } from '../geometry-foundations/geo';
import { A, MC, NAMES, type Gen, type Opt, choice, fitted, names2, numItem, pick, r, rt, S, segN, shuffle, simH, triN } from './common';
import { type Prop, type Q, PERM6, fmt, genericNested, lengthsOf, nested, permOf, propHolds, qHtml, simFig, simPair, figOf } from './sim';
import { altFig, altPts, hourFig, hourPts, nestedFig, nm, roles } from './figs';
import { BANK, ORDER_BANK, type RKey, RS, type SProof, makeProof, mapProse, validOrder } from './proofs';

function fail(): never { throw new Error('retry'); }
const htm = (s: string) => s.replace(/\\triangle\s*/g, '△').replace(/\\sim/g, '~').replace(/\\cong/g, '≅').replace(/\\angle\s*/g, '∠').replace(/\\overline\{([A-Z]+)\}/g, (_, x: string) => segN(x))
  .replace(/\\parallel/g, '∥').replace(/\\perp/g, '⊥').replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2').replace(/\\tfrac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2').replace(/\^\\circ/g, '°').replace(/\\text\{([^{}]*)\}/g, '$1').replace(/\\[,;: ]/g, ' ').replace(/\s+/g, ' ').trim();
const proofPic = (p: SProof, ask: { i: number; cell: 'st' | 'rs' }[], hide: Record<number, 'st' | 'rs'> = {}) => ({
  given: p.given, prove: p.prove,
  rows: p.rows.map((x, i) => ({ st: hide[i] === 'st' ? '?' : x.st, rs: hide[i] === 'rs' ? '?' : RS[x.rs] })), ask,
});

// ---------- justify-criterion-conditions ----------
interface RQ { fig: Fig; pair: string; right: RKey; prompt: string; why: string }
export const reasonPick: Gen = (R, n) => fitted('reasonPick', () => {
  const kind = pick(R, ['nestCorr', 'nestRefl', 'hourVert', 'hourAlt', 'altRight', 'altRefl'] as const);
  let q: RQ;
  if (kind.startsWith('nest')) {
    const t = roles(R);
    const fig = nestedFig(t, nested(10, 11, 9, r(R, 40, 55) / 100, 36), { par: true });
    q = kind === 'nestCorr' ? { fig, pair: `∠${nm(t, 'ADE')} ≅ ∠${nm(t, 'ABC')}`, right: 'corr', prompt: `${segN(nm(t, 'DE'))} ∥ ${segN(nm(t, 'BC'))}.`, why: `${segN(nm(t, 'AB'))} cuts the parallel segments; the two angles sit in matching corners.` }
      : { fig, pair: `∠${nm(t, 'A')} ≅ ∠${nm(t, 'A')}`, right: 'refl', prompt: `${segN(nm(t, 'DE'))} ∥ ${segN(nm(t, 'BC'))}.`, why: 'Both triangles share the angle at the top.' };
  } else if (kind.startsWith('hour')) {
    const t = roles(R);
    const fig = hourFig(t, hourPts(7, 5, 7.5, 1.4, 34, r(R, -10, 10)), { par: true });
    q = kind === 'hourVert' ? { fig, pair: `∠${nm(t, 'AEB')} ≅ ∠${nm(t, 'CED')}`, right: 'vert', prompt: `${segN(nm(t, 'AB'))} ∥ ${segN(nm(t, 'CD'))}.`, why: 'The two angles are opposite each other where the segments cross.' }
      : { fig, pair: `∠${nm(t, 'BAE')} ≅ ∠${nm(t, 'DCE')}`, right: 'altInt', prompt: `${segN(nm(t, 'AB'))} ∥ ${segN(nm(t, 'CD'))}.`, why: `${segN(nm(t, 'AC'))} cuts the parallel segments; the angles are on opposite sides of it, between the parallels.` };
  } else {
    const t = roles(R, 'ABCD');
    const fig = altFig(t, altPts(3, 5, 48, r(R, -15, 15), R() < 0.5));
    q = kind === 'altRight' ? { fig, pair: `∠${nm(t, 'ADC')} ≅ ∠${nm(t, 'ACB')}`, right: 'right', prompt: `∠${nm(t, 'ACB')} is a right angle and ${segN(nm(t, 'CD'))} ⊥ ${segN(nm(t, 'AB'))}.`, why: 'Both are right angles.' }
      : { fig, pair: `∠${nm(t, 'A')} ≅ ∠${nm(t, 'A')}`, right: 'refl', prompt: `∠${nm(t, 'ACB')} is a right angle and ${segN(nm(t, 'CD'))} ⊥ ${segN(nm(t, 'AB'))}.`, why: `${triN(nm(t, 'ADC'))} and ${triN(nm(t, 'ACB'))} share that angle.` };
  }
  const NEAR: Record<string, { k: RKey; mc?: string; say: string }[]> = {
    corr: [{ k: 'altInt', mc: MC.wrongPair, say: 'They sit in matching corners on the same side of the transversal: corresponding angles.' }, { k: 'vert', mc: MC.wrongPair, say: 'They do not share a vertex.' }, { k: 'given', mc: MC.noReason, say: 'The given is the parallel; the angle pair needs a theorem.' }],
    refl: [{ k: 'vert', mc: MC.wrongPair, say: 'It is one angle, shared by both triangles.' }, { k: 'corr', mc: MC.wrongPair, say: 'It is the same angle in both triangles.' }, { k: 'given', mc: MC.noReason, say: 'Nothing gives it; it is shared.' }],
    vert: [{ k: 'altInt', mc: MC.wrongPair, say: 'They share the vertex and sit opposite each other: vertical angles.' }, { k: 'refl', mc: MC.wrongPair, say: 'They are two different angles.' }, { k: 'corr', mc: MC.wrongPair, say: 'They share a vertex: vertical angles.' }],
    altInt: [{ k: 'vert', mc: MC.wrongPair, say: 'They are at different vertices.' }, { k: 'corr', mc: MC.wrongPair, say: 'They are on opposite sides of the transversal: alternate interior.' }, { k: 'given', mc: MC.noReason, say: 'The given is the parallel; the angle pair needs a theorem.' }],
    right: [{ k: 'refl', mc: MC.wrongPair, say: 'They are different angles: both right.' }, { k: 'vert', mc: MC.wrongPair, say: 'They are not opposite each other: both are right angles.' }, { k: 'corr', mc: MC.noHyp, say: 'No parallel lines here: both angles are right.' }],
  };
  return choice(R, {
    id: `reasonPick-${n}`, family: 'reasonPick', prompt: `${q.prompt} Which reason justifies ${q.pair}?`, board: htmTex(q.pair),
    solution: [q.why, `The reason: ${RS[q.right]}.`],
    picture: { fig: q.fig, reveal: {} },
  }, [{ t: RS[q.right], ok: true, say: `Right: ${q.why}` }, ...NEAR[q.right]!.map(x => ({ t: RS[x.k] as string, mc: x.mc, say: x.say }))]);
});
const htmTex = (s: string) => s.replace(/∠/g, '\\angle ').replace(/≅/g, '\\cong');
export const lookAlike: Gen = (R, n) => fitted('lookAlike', () => {
  const marked = R() < 0.35, hour = R() < 0.45;
  const t = roles(R);
  let fig: Fig, X: string, Y: string, par: string;
  if (hour) {
    fig = hourFig(t, hourPts(7, 5, 7.5, 1.4, 34, r(R, -10, 10), marked ? 1.4 : pick(R, [1.37, 1.43])), { par: marked });
    X = nm(t, 'ABE'); Y = nm(t, 'CDE'); par = `${segN(nm(t, 'AB'))} ∥ ${segN(nm(t, 'CD'))}`;
  } else {
    const f = r(R, 40, 55) / 100;
    const P0 = nested(10, 11, 9, f, 36);
    if (!marked) P0.E = add(P0.A!, mul(add(P0.C!, mul(P0.A!, -1)), f + pick(R, [-0.03, 0.03])));
    fig = nestedFig(t, P0, { par: marked });
    X = nm(t, 'ADE'); Y = nm(t, 'ABC'); par = `${segN(nm(t, 'DE'))} ∥ ${segN(nm(t, 'BC'))}`;
  }
  return choice(R, {
    id: `lookAlike-${n}`, family: 'lookAlike', prompt: `The figure is not drawn to scale; only the marks count. What can you conclude about ${triN(X)} and ${triN(Y)}?`, board: `\\triangle ${X} \\overset{?}{\\sim} \\triangle ${Y}`,
    solution: marked ? [`The chevrons give ${par}.`, hour ? 'Vertical angles and alternate interior angles: AA.' : 'Corresponding angles and the shared angle: AA.'] : [`Nothing marks ${par}: the segments only look parallel.`, hour ? 'Only the vertical angles are known: one pair is not enough.' : 'Only the shared angle is known: one pair is not enough.'],
    picture: { fig, reveal: {} },
  }, [
    { t: `${simH(X, Y)} by AA`, ok: marked, mc: marked ? undefined : MC.appearance, say: marked ? 'Right: the parallel marks give the second angle pair.' : `${par} is not marked or given: no second angle pair.` },
    { t: 'Not enough information: only one angle pair is known', ok: !marked, mc: marked ? MC.noCritNot : undefined, say: marked ? 'The chevrons mark the parallel sides: that gives a second angle pair.' : 'Right: a look is not a reason.' },
    { t: `${simH(X, Y)} by SAS~`, mc: MC.noHyp, say: 'No side lengths are given: SAS~ cannot apply.' },
    { t: `Not similar: the triangles have different sizes`, mc: MC.sidesEqual, say: 'Different sizes are fine for similar triangles.' },
  ], true);
});

// ---------- write-similarity-proof ----------
export const proofOrder: Gen = (R, n) => fitted('proofOrder', () => {
  const p = makeProof(pick(R, ORDER_BANK), R);
  const N = p.rows.length, decoy = pick(R, p.decoys);
  const items = shuffle(R, [...p.rows.map((x, i) => ({ st: x.st, rs: RS[x.rs] as string, row: i + 1 })), { st: decoy.st, rs: '', row: 0 }]);
  const letterOf = (row: number) => String.fromCharCode(65 + items.findIndex(x => x.row === row));
  const fmtO = (o: number[]) => o.map(letterOf).join(', ');
  const canonO = Array.from({ length: N }, (_, i) => i + 1);
  const right = fmtO(canonO);
  const opts: Opt[] = [{ t: right, ok: true, say: 'Right: every line after the lines it uses, the similarity last, the decoy left out.' }];
  const rep = canonO.slice(); rep[r(R, 0, N - 2)] = 0;
  opts.push({ t: fmtO(rep), mc: decoy.mc, say: `Line ${letterOf(0)} is the decoy: ${decoy.why}` });
  const sw = canonO.slice(); [sw[N - 1], sw[0]] = [sw[0]!, sw[N - 1]!];
  if (!validOrder(p, sw)) opts.push({ t: fmtO(sw), mc: MC.circular, say: 'The similarity cannot come first: it is what the other lines prove.' });
  for (let k = 0; k < 40 && opts.length < 4; k++) {
    const o = canonO.slice(), i = r(R, 0, N - 2), j = r(R, i + 1, N - 1);
    [o[i], o[j]] = [o[j]!, o[i]!];
    if (validOrder(p, o)) continue;
    const s = fmtO(o);
    if (opts.some(x => x.t === s)) continue;
    opts.push({ t: s, mc: MC.beforeEst, say: 'In that order a line uses a statement that only comes later.' });
  }
  return choice(R, {
    id: `proofOrder-${n}`, family: 'proofOrder',
    prompt: 'Put the lines in an order that proves the similarity. One line is a decoy and is left out. Which order works?', board: p.prove,
    solution: [`Each line comes after the lines it uses; the similarity is last: ${right}.`, `Line ${letterOf(0)} is the decoy: ${decoy.why}`],
    picture: { fig: p.fig, proof: { given: p.given, prove: p.prove, rows: items.map(x => ({ st: x.st, rs: x.rs })), pool: true }, reveal: { strike: [items.findIndex(x => x.row === 0)], rowOf: items.map(x => x.row) } },
  }, opts);
});
const NEAR_R: Partial<Record<RKey, { k: RKey; mc?: string; say: string }[]>> = {
  corr: [{ k: 'altInt', mc: MC.wrongPair, say: 'Matching corners on the same side of the transversal: corresponding angles.' }, { k: 'given', mc: MC.noReason, say: 'The parallel is given; the angle pair is its consequence.' }, { k: 'corrConv', mc: MC.wrongPair, say: 'The converse goes from angles to parallel lines; here the lines are given parallel.' }],
  refl: [{ k: 'vert', mc: MC.wrongPair, say: 'It is the same angle in both triangles.' }, { k: 'given', mc: MC.noReason, say: 'Nothing gives it: it is shared.' }],
  vert: [{ k: 'altInt', mc: MC.wrongPair, say: 'They share the vertex: vertical angles.' }, { k: 'refl', mc: MC.wrongPair, say: 'Two different angles: vertical.' }],
  altInt: [{ k: 'vert', mc: MC.wrongPair, say: 'Different vertices: alternate interior angles.' }, { k: 'corr', mc: MC.wrongPair, say: 'Opposite sides of the transversal: alternate interior.' }],
  right: [{ k: 'refl', mc: MC.wrongPair, say: 'Two different angles, both right.' }, { k: 'given', mc: MC.noReason, say: 'The givens say which angles are right; that two right angles are congruent is a theorem.' }],
  segAdd: [{ k: 'calc', mc: MC.noReason, say: 'This line adds the parts to get the whole sides.' }, { k: 'given', mc: MC.noReason, say: 'AB and AC are not labelled: they come from the parts.' }],
  calc: [{ k: 'cpsp', mc: MC.circular, say: 'That would use the similarity we are trying to prove.' }, { k: 'given', mc: MC.noReason, say: 'The ratios are computed from the given lengths.' }],
  sum: [{ k: 'defCong', mc: MC.noReason, say: 'The third angle comes from the 180° sum.' }, { k: 'given', mc: MC.aaListed, say: 'That angle is not labelled: it comes from the angle sum.' }],
  defCong: [{ k: 'given', mc: MC.noReason, say: 'The measures are given; equal measures make the angles congruent by definition.' }, { k: 'refl', mc: MC.wrongPair, say: 'Two different angles with equal measures.' }],
  AA: [{ k: 'SASs', mc: MC.noHyp, say: 'The lines above give two angle pairs: AA.' }, { k: 'SSSs', mc: MC.noHyp, say: 'No side ratios: AA.' }],
  SASs: [{ k: 'SSSs', mc: MC.oneRatio, say: 'Two side ratios and the angle between them: SAS~.' }, { k: 'AA', mc: MC.noHyp, say: 'Only one angle pair is known: SAS~.' }],
  SSSs: [{ k: 'SASs', mc: MC.noHyp, say: 'Three side ratios and no angle: SSS~.' }, { k: 'AA', mc: MC.noHyp, say: 'No angles are given: SSS~.' }],
};
export const proofReasonS: Gen = (R, n, sg) => fitted('proofReasonS', () => {
  const p = makeProof(pick(R, BANK), R);
  const cand = p.rows.map((_, i) => i).filter(i => (sg === 'justify-criterion-conditions' ? i < p.rows.length - 1 : true));
  const i = pick(R, cand), row = p.rows[i]!;
  const near = NEAR_R[row.rs] ?? [];
  const opts: Opt[] = [{ t: RS[row.rs], ok: true, say: `Right: ${RS[row.rs]}.` }, ...near.slice(0, 3).map(x => ({ t: RS[x.k] as string, mc: x.mc, say: x.say }))];
  if (['AA', 'SASs', 'SSSs'].includes(row.rs)) opts.push({ t: 'SSA~', mc: MC.ssa, say: 'There is no SSA similarity criterion.' });
  return choice(R, {
    id: `proofReasonS-${n}`, family: 'proofReasonS', prompt: `Which reason belongs in line ${i + 1}?`, board: row.st,
    solution: [`Line ${i + 1}: ${htm(row.st)}.`, row.uses.length ? `It uses line${row.uses.length > 1 ? 's' : ''} ${row.uses.join(', ')}.` : 'It needs no earlier line.', `The reason: ${RS[row.rs]}.`],
    picture: { fig: p.fig, proof: proofPic(p, [{ i, cell: 'rs' }], { [i]: 'rs' }), reveal: { fill: [{ i, rs: RS[row.rs] }] } },
  }, opts.slice(0, 5));
});
export const proofEnd: Gen = (R, n) => fitted('proofEnd', () => {
  const p = makeProof(pick(R, BANK), R);
  const last = p.rows.length - 1, crit = p.crit;
  const st = (a: string, b: string, c: string, rel = '~') => `${triN(a)} ${rel} ${triN(b)}, ${c}`;
  const other = crit === 'AA' ? 'SAS~' : 'AA';
  const opts: Opt[] = [
    { t: st(p.t1, p.t2, crit), ok: true, say: 'Right: vertices in matching order, and the criterion the lines above meet.' },
    { t: st(p.t1, p.wrongT2, crit), mc: MC.vertexOrder, say: 'The vertices must be listed in corresponding order.' },
    { t: st(p.t1, p.t2, crit === 'AA' ? 'ASA' : crit === 'SAS~' ? 'SAS' : 'SSS', '≅'), mc: crit === 'AA' ? MC.aaaCong : MC.sidesEqual, say: 'The lines prove a similarity, not a congruence: the sizes may differ.' },
    { t: st(p.t1, p.t2, other), mc: MC.noHyp, say: `The lines above give what ${crit} needs, not ${other}.` },
  ];
  return choice(R, {
    id: `proofEnd-${n}`, family: 'proofEnd', prompt: `What is the last line of the proof, with its reason?`, board: p.given.join(',\\ '),
    solution: [`The lines above give what ${crit} needs.`, `In corresponding order: ${st(p.t1, p.t2, crit)}.`],
    picture: { fig: p.fig, proof: { given: p.given, prove: '?', rows: p.rows.slice(0, last).map(x => ({ st: x.st, rs: RS[x.rs] })) }, reveal: {} },
  }, opts);
});

// ---------- deduce-proportion-from-similarity ----------
const propH = (p: Prop) => `${p[0]}/${p[1]} = ${p[2]}/${p[3]}`;
function propOpts(L: Record<string, number>, right: Prop, wrong: { p: Prop; mc?: string; say: string }[], okSay: string): Opt[] {
  if (!propHolds(L, right)) throw new Error(`not valid ${right.join(',')}`);
  const out: Opt[] = [{ t: propH(right), ok: true, say: okSay }];
  for (const w of wrong) { if (propHolds(L, w.p)) continue; const tt = propH(w.p); if (out.some(o => o.t === tt)) continue; out.push({ t: tt, mc: w.mc, say: w.say }); }
  return out.slice(0, 4);
}
const keyed = (t: Record<string, string>, L0: Record<string, number>) => { const L: Record<string, number> = {}; for (const [kk, v] of Object.entries(L0)) L[[...nm(t, kk)].sort().join('')] = v; return L; };
export const deduceProp: Gen = (R, n) => fitted('deduceProp', () => {
  const t = roles(R), N = (s: string) => nm(t, s);
  const L = keyed(t, lengthsOf(genericNested()));
  const form = pick(R, ['between', 'within', 'whole'] as const);
  const right: Prop = form === 'between' ? [N('AD'), N('AB'), N('DE'), N('BC')] : form === 'within' ? [N('AD'), N('DE'), N('AB'), N('BC')] : [N('AD'), N('AB'), N('AE'), N('AC')];
  const fig = nestedFig(t, nested(10, 11, 9, r(R, 40, 55) / 100, 36), { par: true });
  const opts = propOpts(L, right, [
    { p: [N('AD'), N('DB'), N('DE'), N('BC')], mc: MC.partWhole, say: `${N('AD')} pairs with the whole side ${N('AB')}, not the part ${N('DB')}.` },
    { p: [N('AD'), N('AB'), N('BC'), N('DE')], mc: MC.inconsistent, say: 'Keep one order: small triangle over big triangle in both ratios.' },
    { p: [N('AD'), N('AB'), N('AE'), N('EC')], mc: MC.partWhole, say: `${N('AE')} pairs with the whole ${N('AC')}, not the part ${N('EC')}.` },
    { p: [N('AD'), N('AE'), N('DE'), N('BC')], mc: MC.ignoreCorr, say: 'Each ratio must pair corresponding sides (or two sides of one triangle).' },
    { p: [N('DB'), N('AB'), N('DE'), N('BC')], mc: MC.partWhole, say: `${N('DB')} is a part, not a side of ${triN(N('ADE'))}.` },
  ], 'Right: corresponding sides of the similar triangles.');
  return choice(R, {
    id: `deduceProp-${n}`, family: 'deduceProp', prompt: `It is proved that ${simH(N('ADE'), N('ABC'))}. Which proportion follows?`, board: `\\triangle ${N('ADE')} \\sim \\triangle ${N('ABC')}`,
    solution: [`Letter under letter: ${N('A')} ↔ ${N('A')}, ${N('D')} ↔ ${N('B')}, ${N('E')} ↔ ${N('C')}.`, `So ${right[0]}/${right[1]} = ${right[2]}/${right[3]}.`],
    picture: { fig, reveal: {} },
  }, opts);
});
export const deduceCross: Gen = (R, n) => fitted('deduceCross', () => {
  const [L1, L2] = names2(R), n2 = permOf(L2, pick(R, PERM6));
  const S2 = simPair([3.1, 4.3, 5.9].map(x => x), 1.37, L1, n2, { rot2: 37 });
  const L = lengthsOf(S2.P);
  const sd = (s: string, i: number) => s[(i + 1) % 3]! + s[(i + 2) % 3]!;
  const i = r(R, 0, 2), j = (i + 1 + r(R, 0, 1)) % 3;
  const a = sd(L1, i), b = sd(n2, i), c = sd(L1, j), d = sd(n2, j);
  // a/b = c/d  <=>  a·d = b·c
  const prod = (p: string, q: string, x: string, y: string) => `${p} · ${q} = ${x} · ${y}`;
  const cands: { t: string; ok: boolean; mc?: string; say: string; prop: Prop }[] = [
    { t: prod(a, d, b, c), ok: true, say: 'Right: the cross products of a true proportion are equal.', prop: [a, b, c, d] },
    { t: prod(a, b, c, d), ok: false, mc: MC.inconsistent, say: 'Cross-multiply: the top of each ratio times the bottom of the other.', prop: [a, c, d, b] },
    { t: prod(a, c, b, d), ok: false, mc: MC.ignoreCorr, say: 'That pairs the wrong lengths: cross-multiply a/b = c/d as a·d = b·c.', prop: [a, b, d, c] },
    { t: `${a} = ${b}`, ok: false, mc: MC.sidesEqual, say: 'Corresponding sides of similar triangles are proportional, not equal.', prop: [a, b, b, b] },
  ];
  const kept = cands.filter(x => x.ok || !propHolds(L, x.prop));
  const fig = simFig(simPair([5, 7, 9].map(x => x), pick(R, [0.7, 1.5]), L1, n2, { rot1: r(R, -20, 20), rot2: r(R, 0, 359), flip: R() < 0.5 }), {});
  return choice(R, {
    id: `deduceCross-${n}`, family: 'deduceCross', prompt: `${simH(L1, n2)}. Which equation must be true?`, board: `\\triangle ${L1} \\sim \\triangle ${n2}`,
    solution: [`Corresponding sides: ${a}/${b} = ${c}/${d}.`, `Cross-multiply: ${prod(a, d, b, c)}.`],
    picture: { fig, reveal: {} },
  }, kept.map(x => ({ t: x.t, ok: x.ok, mc: x.mc, say: x.say })));
});
export const angleK: Gen = (R, n) => {
  const [L1, L2] = names2(R), a = r(R, 35, 75), s = r(R, 4, 12);
  return choice(R, {
    id: `angleK-${n}`, family: 'angleK', prompt: `${simH(L1, L2)}, m∠${L1[0]} = ${a}° and ${L1.slice(0, 2)} = ${s}. What is the scale factor from ${triN(L1)} to ${triN(L2)}?`, board: `\\triangle ${L1} \\sim \\triangle ${L2}`,
    solution: ['Equal angles say nothing about size: every similar copy has the same angles.', 'A side of the second triangle is needed to find k.'],
    picture: { card: { lines: [`${triN(L1)} ~ ${triN(L2)}`, `m∠${L1[0]} = ${a}°, ${L1.slice(0, 2)} = ${s}`, `k = ?`] }, reveal: {} },
  }, [
    { t: 'It cannot be found: no side of the second triangle is known', ok: true, say: 'Right: angles fix the shape, sides fix the size.' },
    { t: `${a}/${a} = 1`, mc: MC.angleK, say: 'Corresponding angles are always equal; their ratio is not the scale factor.' },
    { t: `${s}/${a}`, mc: MC.angleK, say: 'A side over an angle is not a scale factor.' },
    { t: '1: similar triangles are the same size', mc: MC.sidesEqual, say: 'Similar triangles can have any scale factor.' },
  ]);
};

// ---------- pythagorean-proof-by-similarity ----------
/** the proof: right angle at C, altitude CD; a = BC, b = AC, c = AB, x = BD (next to a), y = AD (next to b).
 *  Point letters are random (roles A-D); the side names a, b, c, x, y stay. */
const pyRows = (t: Record<string, string>) => [
  { st: `\\triangle ${nm(t, 'BDC')} \\sim \\triangle ${nm(t, 'BCA')}`, rs: `AA: right angle, shared angle ${t.B}` },
  { st: 'a^2 = cx', rs: 'Similar sides: a/c = x/a' },
  { st: `\\triangle ${nm(t, 'ADC')} \\sim \\triangle ${nm(t, 'ACB')}`, rs: `AA: right angle, shared angle ${t.A}` },
  { st: 'b^2 = cy', rs: 'Similar sides: b/c = y/b' },
  { st: 'a^2 + b^2 = cx + cy = c(x + y) = c^2', rs: 'Add lines 2 and 4; x + y = c' },
];
const pyGiven = (t: Record<string, string>) => [`\\angle ${nm(t, 'ACB')} = 90^\\circ,\\ \\overline{${nm(t, 'CD')}} \\perp \\overline{${nm(t, 'AB')}}`];
function pyFig(R: () => number, t: Record<string, string>): Fig {
  const [p, q] = pick(R, [[2, 5], [3, 5], [4, 7], [3, 7], [2, 3]] as [number, number][]);
  const P0 = altPts(p, q, 380 / (p + q), r(R, -10, 10), R() < 0.5);
  return altFig(t, P0, { labs: [{ seg: 'CB', text: 'a' }, { seg: 'AC', text: 'b' }, { seg: 'DB', text: 'x' }, { seg: 'AD', text: 'y' }] });
}
export const pythGap: Gen = (R, n) => fitted('pythGap', () => {
  const t = roles(R, 'ABCD'), ROWS = pyRows(t);
  const i = pick(R, [1, 3, 4]);
  const fig = pyFig(R, t);
  const row = ROWS[i]!;
  const DIS: Record<number, { st: string; mc?: string; say: string }[]> = {
    1: [{ st: 'a^2 = cy', mc: MC.farSeg, say: 'The leg a pairs with its own segment x (next to it), not with y.' }, { st: 'a^2 = xy', mc: MC.partHyp, say: 'The leg pairs with the whole hypotenuse c, not with the other part.' }, { st: 'a^2 + b^2 = c^2', mc: MC.circular, say: 'That is what we are proving: it cannot appear as a step.' }],
    3: [{ st: 'b^2 = cx', mc: MC.farSeg, say: 'The leg b pairs with y, the segment next to it.' }, { st: 'b^2 = xy', mc: MC.partHyp, say: 'Use the whole hypotenuse c.' }, { st: 'b = c - a', say: 'Lengths do not subtract like that; use the similarity.' }],
    4: [{ st: 'a^2 + b^2 = cx \\cdot cy = c^2', say: 'Adding two equations adds their right sides.' }, { st: 'a^2 + b^2 = c^2 \\text{ by the Pythagorean Theorem}', mc: MC.circular, say: 'The proof may not use the theorem it proves: get there through c(x + y).' }, { st: 'a^2 + b^2 = cx + y = c^2', mc: MC.partialDist, say: 'Both terms carry the factor c.' }],
    5: [{ st: 'a^2 + b^2 = c^2 \\text{ by the Pythagorean Theorem}', mc: MC.circular, say: 'The proof may not use the theorem it proves.' }, { st: 'a^2 + b^2 = c(x \\cdot y)', mc: MC.partialDist, say: 'x + y = c, so c(x + y) = c·c.' }, { st: 'a + b = c', say: 'The sum of the legs is longer than c.' }],
  };
  const opts: Opt[] = [{ t: htmPy(row.st), ok: true, say: 'Right: that follows from the lines above, without the Pythagorean Theorem.' }, ...DIS[i]!.map(d => ({ t: htmPy(d.st), mc: d.mc, say: d.say }))];
  return choice(R, {
    id: `pythGap-${n}`, family: 'pythGap', prompt: `Proving a² + b² = c² with the similar triangles of ${triN(nm(t, 'ACB'))}. Which statement belongs in line ${i + 1}?`, board: 'a^2 + b^2 = c^2',
    solution: [`Line ${i + 1}: ${row.rs}.`, `So the statement is ${htmPy(row.st)}.`],
    picture: { fig, proof: { given: pyGiven(t), prove: 'a^2 + b^2 = c^2', rows: ROWS.map((x, k) => ({ st: k === i ? '?' : x.st, rs: x.rs })), ask: [{ i, cell: 'st' }] }, reveal: { fill: [{ i, st: row.st }] } },
  }, opts);
});
const htmPy = (s: string) => s.replace(/\^2/g, '²').replace(/\\cdot/g, '·').replace(/\\text\{([^{}]*)\}/g, '$1').replace(/\\triangle\s*/g, '△').replace(/\\sim/g, '~').replace(/\s+/g, ' ').trim();
export const pythReason: Gen = (R, n) => fitted('pythReason', () => {
  const t = roles(R, 'ABCD'), ROWS = pyRows(t);
  const i = pick(R, [0, 2, 4, 1]);
  const fig = pyFig(R, t);
  const right = ROWS[i]!.rs;
  const opts: Opt[] = [
    { t: right, ok: true, say: 'Right.' },
    { t: 'The Pythagorean Theorem', mc: MC.circular, say: 'The proof may not use the theorem it proves.' },
    ...(i === 4 ? [{ t: 'The two small triangles are congruent', mc: MC.sidesEqual, say: 'They are similar, not congruent; x + y = c is segment addition.' }]
      : i === 1 ? [{ t: 'Similar sides: a/c = y/a', mc: MC.farSeg, say: 'a pairs with x, the segment next to it.' }, { t: 'Corresponding sides are equal: a = x', mc: MC.sidesEqual, say: 'Proportional, not equal.' }]
        : [{ t: 'SAS~: two sides and the angle between them', mc: MC.noHyp, say: 'No side ratios are known yet: AA.' }, { t: 'Any altitude makes similar triangles', mc: MC.altAny, say: 'Only the altitude to the hypotenuse of a right triangle does.' }]),
  ];
  return choice(R, {
    id: `pythReason-${n}`, family: 'pythReason', prompt: `Proving a² + b² = c² with the similar triangles of ${triN(nm(t, 'ACB'))}. Which reason belongs in line ${i + 1}?`, board: ROWS[i]!.st,
    solution: [`Line ${i + 1}: ${htmPy(ROWS[i]!.st)}.`, `The reason: ${right}.`],
    picture: { fig, proof: { given: pyGiven(t), prove: 'a^2 + b^2 = c^2', rows: ROWS.map((x, k) => ({ st: x.st, rs: k === i ? '?' : x.rs })), ask: [{ i, cell: 'rs' }] }, reveal: { fill: [{ i, rs: right }] } },
  }, opts);
});

// ---------- side-splitter-theorem ----------
const SS_STEPS = [
  '\\frac{a}{a + b} = \\frac{c}{c + d}',
  'a(c + d) = c(a + b)',
  'ac + ad = ac + bc',
  'ad = bc',
  '\\frac{a}{b} = \\frac{c}{d}',
];
const ssH = (s: string) => s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, x: string, y: string) => `${/[+-]/.test(x) ? `(${x})` : x}/${/[+-]/.test(y) ? `(${y})` : y}`).replace(/\s+/g, ' ');
export const ssAlgebra: Gen = (R, n) => fitted('ssAlgebra', () => {
  const t = roles(R), i = r(R, 1, 4);
  const fig = nestedFig(t, nested(10, 11, 9, r(R, 40, 55) / 100, 36), { par: true, labs: [{ seg: 'AD', text: 'a' }, { seg: 'DB', text: 'b' }, { seg: 'AE', text: 'c' }, { seg: 'EC', text: 'd' }] });
  const DIS: Record<number, { s: string; mc?: string; say: string }[]> = {
    1: [{ s: 'ac + d = ca + b', mc: MC.partialDist, say: 'Cross-multiplying multiplies the whole sum: a(c + d).' }, { s: 'a(a + b) = c(c + d)', say: 'Cross-multiply: each top times the other bottom.' }, { s: '\\frac{a}{b} = \\frac{c}{d}', mc: MC.cancelTerms, say: 'You cannot cancel a from a + b: only factors cancel, not terms.' }],
    2: [{ s: 'ac + d = ac + b', mc: MC.partialDist, say: 'Distribute to both terms: a(c + d) = ac + ad.' }, { s: 'ac + ad = ab + bc', mc: MC.partialDist, say: 'c(a + b) = ca + cb.' }, { s: 'a + c + d = c + a + b', say: 'Multiplication distributes; it does not turn into addition.' }],
    3: [{ s: 'ad = ac + bc', say: 'Subtract ac from both sides.' }, { s: 'a + d = b + c', mc: MC.cancelTerms, say: 'Subtract ac from both sides; the products stay products.' }, { s: 'd = b', say: 'Divide only when the same factor is on both sides.' }],
    4: [{ s: '\\frac{a}{d} = \\frac{b}{c}', say: 'Divide ad = bc by b·d: a/b = c/d.' }, { s: '\\frac{a}{c} = \\frac{d}{b}', say: 'Divide both sides by b·d.' }, { s: '\\frac{a}{a + b} = \\frac{c}{d}', mc: MC.partWhole, say: 'The goal is part over part: a/b = c/d.' }],
  };
  const opts: Opt[] = [{ t: ssH(SS_STEPS[i]!), ok: true, say: 'Right.' }, ...DIS[i]!.map(d => ({ t: ssH(d.s), mc: d.mc, say: d.say }))];
  const lines = SS_STEPS.map((s, k) => (k === i ? '?' : ssH(s)));
  return choice(R, {
    id: `ssAlgebra-${n}`, family: 'ssAlgebra', prompt: `${segN(nm(t, 'DE'))} ∥ ${segN(nm(t, 'BC'))}, so AD/AB = AE/AC: a/(a + b) = c/(c + d). Which line is missing on the way to a/b = c/d (the side-splitter theorem)?`.replace('AD/AB = AE/AC', `${nm(t, 'AD')}/${nm(t, 'AB')} = ${nm(t, 'AE')}/${nm(t, 'AC')}`), board: '\\frac{a}{a+b} = \\frac{c}{c+d} \\Rightarrow \\frac{a}{b} = \\frac{c}{d}',
    solution: ['Cross-multiply, distribute to both terms, subtract ac, divide by bd.', `Line ${i + 1}: ${ssH(SS_STEPS[i]!)}.`],
    picture: { fig, card: { lines: lines.map((l, k) => `${k + 1}. ${l}`) }, reveal: {} },
  }, opts);
});
export const ssNum: Gen = (R, n) => fitted('ssNum', () => {
  let AD = 0, DB = 0, AE = 0, EC = 0;
  for (;;) { AD = r(R, 2, 9); DB = r(R, 2, 9); const m = pick(R, [1, 1.5, 2, 0.5, 3]); AE = AD * m; EC = DB * m; if (AD !== DB && Number.isInteger(AE * 2) && Number.isInteger(EC * 2) && AE >= 2 && EC >= 2 && EC <= 20 && AE <= 20) break; }
  const t = roles(R);
  const AB = AD + DB, AC = AE + EC, angA = r(R, 45, 70);
  const BC = Math.sqrt(AB * AB + AC * AC - 2 * AB * AC * Math.cos((angA * Math.PI) / 180));
  const P0 = nested(AB, AC, BC, AD / AB, 380 / Math.max(AB, AC, BC));
  const fig = nestedFig(t, P0, { par: true, labs: [{ seg: 'AD', text: fmt(AD) }, { seg: 'DB', text: fmt(DB) }, { seg: 'AE', text: fmt(AE) }, { seg: 'EC', text: '?', alt: fmt(EC) }] });
  const wrongs = [{ v: (AE * AB) / AD, mc: MC.partWhole, say: `Part to part: ${nm(t, 'AD')}/${nm(t, 'DB')} = ${nm(t, 'AE')}/${nm(t, 'EC')} (or whole to whole); not part to whole.` }, { v: AE + DB - AD, mc: MC.additive, say: 'The sides are cut in the same ratio, not by the same difference.' }, { v: (AE * AD) / DB, mc: MC.inconsistent, say: 'Keep one order: top part over bottom part on both sides.' }].filter(w => w.v > 0 && Math.abs(w.v - EC) > 1e-9);
  return numItem({
    id: `ssNum-${n}`, family: 'ssNum', prompt: `${segN(nm(t, 'DE'))} ∥ ${segN(nm(t, 'BC'))}. Find ${nm(t, 'EC')}.`, board: `\\frac{${nm(t, 'AD')}}{${nm(t, 'DB')}} = \\frac{${nm(t, 'AE')}}{${nm(t, 'EC')}}`, unit: '',
    solution: [`Side-splitter: ${nm(t, 'AD')}/${nm(t, 'DB')} = ${nm(t, 'AE')}/${nm(t, 'EC')}.`, `${fmt(AD)}/${fmt(DB)} = ${fmt(AE)}/${nm(t, 'EC')}, so ${nm(t, 'EC')} = ${fmt(AE)} × ${fmt(DB)}/${fmt(AD)}.`, `${nm(t, 'EC')} = <b class="s">${fmt(EC)}</b>.`],
    picture: { fig, reveal: { solved: [nm(t, 'EC')] } },
  }, EC, wrongs, 'Right: a parallel cuts the two sides in the same ratio.', 'Use part over part on both sides: AD/DB = AE/EC.');
});
export const ssForm: Gen = (R, n) => fitted('ssForm', () => {
  const t = roles(R), N = (s: string) => nm(t, s);
  const L = keyed(t, lengthsOf(genericNested()));
  const right: Prop = pick(R, [[N('AD'), N('DB'), N('AE'), N('EC')], [N('DB'), N('AD'), N('EC'), N('AE')], [N('AD'), N('AE'), N('DB'), N('EC')]] as Prop[]);
  const fig = nestedFig(t, nested(10, 11, 9, r(R, 40, 55) / 100, 36), { par: true });
  const opts = propOpts(L, right, [
    { p: [N('AD'), N('DB'), N('DE'), N('BC')], mc: MC.partWhole, say: `${N('DE')} and ${N('BC')} are not cut: ${N('DE')}/${N('BC')} = ${N('AD')}/${N('AB')}, whole to whole.` },
    { p: [N('AD'), N('DB'), N('EC'), N('AE')], mc: MC.inconsistent, say: 'Keep one order: top part over bottom part on both sides.' },
    { p: [N('DB'), N('AB'), N('DE'), N('BC')], mc: MC.partWhole, say: `${N('DB')} is a part of the side, not a side of the small triangle.` },
    { p: [N('AD'), N('EC'), N('AE'), N('DB')], mc: MC.ignoreCorr, say: 'Pair the parts of the same side: AD with DB, AE with EC.' },
  ], 'Right: the parallel cuts both sides in the same ratio.');
  return choice(R, {
    id: `ssForm-${n}`, family: 'ssForm', prompt: `${segN(N('DE'))} ∥ ${segN(N('BC'))}. Which proportion is true?`, board: `\\overline{${N('DE')}} \\parallel \\overline{${N('BC')}}`,
    solution: [`Side-splitter: ${N('AD')}/${N('DB')} = ${N('AE')}/${N('EC')} (part to part on the two cut sides).`, `Equivalent: ${right[0]}/${right[1]} = ${right[2]}/${right[3]}.`],
    picture: { fig, reveal: {} },
  }, opts);
});

// ---------- side-splitter-converse ----------
export const convWhich: Gen = (R, n) => {
  const forward = R() < 0.5;
  const LN = pick(R, [['ℓ', 'm'], ['m', 'n'], ['p', 'q'], ['j', 'k'], ['ℓ', 'n']]), i = r(R, 1, 4);
  const setting = `Lines ${LN[0]} and ${LN[1]} are cut by a transversal t; ∠${i} and ∠${i + 4} are corresponding angles.`;
  return choice(R, {
    id: `convWhich-${n}`, family: 'convWhich', prompt: `${setting} ${forward ? 'Which statement is the Corresponding Angles Theorem (the forward direction)?' : 'Which statement is the Corresponding Angles Converse?'}`, board: forward ? '\\parallel\\ \\Rightarrow\\ \\cong' : '\\cong\\ \\Rightarrow\\ \\parallel',
    solution: forward ? ['The theorem starts from parallel lines.', 'If two parallel lines are cut by a transversal, then corresponding angles are congruent.'] : ['The converse swaps the if and the then.', 'If corresponding angles are congruent, then the lines are parallel.'],
    picture: { card: { lines: ['A transversal cuts two lines.', forward ? 'Theorem: from parallel lines to angles.' : 'Converse: from angles to parallel lines.'] }, reveal: {} },
  }, [
    { t: 'If two parallel lines are cut by a transversal, then corresponding angles are congruent', ok: forward, mc: forward ? undefined : MC.converse, say: forward ? 'Right: from parallel lines to angles.' : 'That is the forward theorem; the converse starts from the angles.' },
    { t: 'If corresponding angles are congruent, then the lines are parallel', ok: !forward, mc: forward ? MC.converse : undefined, say: forward ? 'That is the converse; the theorem starts from parallel lines.' : 'Right: from angles to parallel lines.' },
    { t: 'If the lines are parallel, then the two sides are cut in the same ratio', say: 'That is the side-splitter theorem, not about corresponding angles.' },
    { t: 'If two lines are cut by a transversal, then corresponding angles are congruent', mc: MC.noHyp, say: 'Without parallel lines, corresponding angles need not be congruent.' },
  ], true);
};
export const convCheck: Gen = (R, n) => fitted('convCheck', () => {
  const yes = R() < 0.55;
  let AD = 0, DB = 0, AE = 0, EC = 0;
  for (;;) { AD = r(R, 2, 8); DB = r(R, 2, 8); AE = r(R, 2, 9); EC = yes ? (AE * DB) / AD : r(R, 2, 12); if (Number.isInteger(EC) && EC >= 2 && EC <= 14 && AD !== DB && (yes || Math.abs(AD / DB - AE / EC) > 0.08)) break; }
  const t = roles(R);
  const AB = AD + DB, AC = AE + EC, angA = r(R, 45, 70);
  const BC = Math.sqrt(AB * AB + AC * AC - 2 * AB * AC * Math.cos((angA * Math.PI) / 180));
  const P0 = nested(AB, AC, BC, AD / AB, 380 / Math.max(AB, AC, BC));
  P0.E = add(P0.A!, mul(add(P0.C!, mul(P0.A!, -1)), AE / AC));
  const fig = nestedFig(t, P0, { labs: [{ seg: 'AD', text: fmt(AD) }, { seg: 'DB', text: fmt(DB) }, { seg: 'AE', text: fmt(AE) }, { seg: 'EC', text: fmt(EC) }] });
  const N = (s: string) => nm(t, s);
  return choice(R, {
    id: `convCheck-${n}`, family: 'convCheck', prompt: `Use the lengths. Is ${segN(N('DE'))} ∥ ${segN(N('BC'))}? (Corresponding Angles Converse: if corresponding angles are congruent, the lines are parallel.)`, board: `\\frac{${fmt(AD)}}{${fmt(DB)}} \\overset{?}{=} \\frac{${fmt(AE)}}{${fmt(EC)}}`,
    solution: yes ? [`${fmt(AD)}/${fmt(DB)} = ${fmt(AE)}/${fmt(EC)}, so ${N('AD')}/${N('AB')} = ${N('AE')}/${N('AC')} (add 1 to both sides).`, `SAS~ with the shared ∠${N('A')} gives ${simH(N('ADE'), N('ABC'))}, so ∠${N('ADE')} ≅ ∠${N('ABC')}.`, 'The Corresponding Angles Converse gives the parallel.'] : [`${fmt(AD)}/${fmt(DB)} ≠ ${fmt(AE)}/${fmt(EC)}.`, 'If the segments were parallel, the side-splitter theorem would make these ratios equal. So they are not parallel.'],
    picture: { fig, reveal: {} },
  }, [
    { t: 'Yes: the parts are in one ratio, so SAS~ and then the converse give the parallel', ok: yes, mc: yes ? undefined : MC.converse, say: yes ? 'Right.' : `Compare: ${fmt(AD)}/${fmt(DB)} and ${fmt(AE)}/${fmt(EC)} are not equal.` },
    { t: 'No: the parts are not in one ratio', ok: !yes, say: yes ? `${fmt(AD)}/${fmt(DB)} = ${fmt(AE)}/${fmt(EC)}: they are.` : 'Right: equal ratios are needed for a parallel.' },
    { t: 'Yes: the segment looks parallel', mc: MC.looks, say: 'Looks prove nothing: compare the ratios.' },
    { t: 'Cannot tell: lengths never prove lines parallel', mc: MC.noCritNot, say: 'They can: equal ratios give SAS~, then the converse.' },
  ], true);
});

// ---------- repair-circular-argument ----------
interface Circ { given: string[]; prove: string; rows: { st: string; rs: string }[]; bad: number; fix: string; fig: Fig }
function circProof(R: () => number): Circ {
  const t = roles(R), N = (s: string) => nm(t, s);
  const fig = nestedFig(t, nested(10, 11, 9, r(R, 40, 55) / 100, 36), { par: true });
  const sas = R() < 0.6;
  const fr = (a: string, b: string) => `\\frac{${N(a)}}{${N(b)}}`;
  if (sas) return {
    given: [`\\overline{${N('DE')}} \\parallel \\overline{${N('BC')}}`], prove: `${fr('AD', 'AB')} = ${fr('AE', 'AC')}`, fig, bad: 1,
    fix: `Replace line 2 with ∠${N('ADE')} ≅ ∠${N('ABC')} (Corresponding Angles Theorem) and use AA`,
    rows: [
      { st: `\\angle ${N('A')} \\cong \\angle ${N('A')}`, rs: RS.refl },
      { st: `${fr('AD', 'AB')} = ${fr('AE', 'AC')}`, rs: RS.cpsp },
      { st: `\\triangle ${N('ADE')} \\sim \\triangle ${N('ABC')}`, rs: RS.SASs },
      { st: `${fr('AD', 'AB')} = ${fr('AE', 'AC')}`, rs: RS.cpsp },
    ],
  };
  return {
    given: [`\\overline{${N('DE')}} \\parallel \\overline{${N('BC')}}`], prove: `${fr('DE', 'BC')} = ${fr('AD', 'AB')}`, fig, bad: 0,
    fix: `Replace line 1 with ∠${N('ADE')} ≅ ∠${N('ABC')} and ∠${N('A')} ≅ ∠${N('A')}, then use AA`,
    rows: [
      { st: `${fr('AD', 'AB')} = ${fr('AE', 'AC')} = ${fr('DE', 'BC')}`, rs: RS.cpsp },
      { st: `\\triangle ${N('ADE')} \\sim \\triangle ${N('ABC')}`, rs: RS.SSSs },
      { st: `${fr('DE', 'BC')} = ${fr('AD', 'AB')}`, rs: RS.cpsp },
    ],
  };
}
export const circFind: Gen = (R, n) => fitted('circFind', () => {
  const c = circProof(R);
  const simLine = c.rows.findIndex(x => x.st.includes('\\sim'));
  return choice(R, {
    id: `circFind-${n}`, family: 'circFind', prompt: 'This proof is circular. Which line uses what it is trying to prove?', board: c.prove,
    solution: [`Line ${c.bad + 1} cites the similarity of line ${simLine + 1} before it is proved.`, `And line ${simLine + 1} needs line ${c.bad + 1}: the argument goes round in a circle.`],
    picture: { fig: c.fig, proof: { given: c.given, prove: c.prove, rows: c.rows }, reveal: { strike: [c.bad] } },
  }, [
    { t: `Line ${c.bad + 1}`, ok: true, say: `Right: it uses the similarity that line ${simLine + 1} only proves later, from line ${c.bad + 1} itself.` },
    { t: `Line ${simLine + 1}`, mc: MC.circular, say: `Line ${simLine + 1} follows from the lines above it; the trouble is where line ${c.bad + 1} got its ratios.` },
    { t: `Line ${c.rows.length}`, mc: MC.circular, say: 'The last line is fine once the similarity is truly proved.' },
    { t: 'None: the conclusion is true, so the proof is fine', mc: MC.validityTruth, say: 'A true conclusion does not make an argument valid.' },
  ].filter((o, i, a) => a.findIndex(z => z.t === o.t) === i), true);
});
export const circRepair: Gen = (R, n) => fitted('circRepair', () => {
  const c = circProof(R);
  return choice(R, {
    id: `circRepair-${n}`, family: 'circRepair', prompt: `Line ${c.bad + 1} assumes the ratio it should prove. How can the proof be repaired?`, board: c.prove,
    solution: [`Line ${c.bad + 1} must not depend on the similarity.`, 'The parallel lines give two angle pairs: prove the similarity by AA, then read the ratio.'],
    picture: { fig: c.fig, proof: { given: c.given, prove: c.prove, rows: c.rows, strike: [c.bad] }, reveal: {} },
  }, [
    { t: c.fix, ok: true, say: 'Right: the angles come from the given, not from the conclusion.' },
    { t: 'Keep it: the ratios are true anyway', mc: MC.validityTruth, say: 'True is not the same as proved: each line needs a reason that does not use the conclusion.' },
    { t: `Move line ${c.bad + 1} below the similarity`, mc: MC.circular, say: 'Then the similarity would have no ratios to stand on.' },
    { t: 'Measure the four lengths on the figure', mc: 'mc.geometric-proof.procedure-or-measurement-as-proof', say: 'Measuring one drawing proves nothing in general.' },
  ]);
});

// ---------- indirect-measurement ----------
/** two right triangles on one ground line: a short object (person / post) and a tall one, with their shadows */
function shadowFig(h1: number, s1: number, H: number, s2: number, o: { who: string; what: string; ask?: string; askAlt?: string; l1: string; ls1: string; ls2: string }): Fig {
  const u = 360 / Math.max(H, s2 + s1 * 0.2);
  const gap = Math.max(s1, 6) * u + 160;
  const P: Record<string, Pt> = { T: [0, H * u], B: [0, 0], S: [s2 * u, 0], P: [s2 * u + gap, h1 * u], Q: [s2 * u + gap, 0], R: [s2 * u + gap + s1 * u, 0] };
  const f = figOf(P, ['TB', 'BS', 'TS', 'PQ', 'QR', 'PR'], {
    labs: [{ seg: 'TB', text: o.ask ?? '?', alt: o.askAlt }, { seg: 'BS', text: o.ls2 }, { seg: 'PQ', text: o.l1 }, { seg: 'QR', text: o.ls1 }],
    marks: [{ ang: 'TBS', box: true }, { ang: 'PQR', box: true }, { ang: 'BST', n: 1 }, { ang: 'QRP', n: 1 }],
    // heights labelled on the left, shadows below the ground (never inside a triangle, never on the sun's ray)
    segStyle: { TS: { dash: true, col: 'faint' }, PR: { dash: true, col: 'faint' }, TB: { side: -1 }, PQ: { side: -1 }, BS: { side: -1 }, QR: { side: -1 } }, bare: ['T', 'B', 'S', 'P', 'Q', 'R'],
  });
  f.words = [{ at: [0, H * u + 55], text: o.what }, { at: [P.Q![0], h1 * u + 55], text: o.who }];
  return f;
}
const SUBJ = [{ what: 'tree', lo: 16, hi: 32 }, { what: 'flagpole', lo: 18, hi: 30 }, { what: 'light pole', lo: 15, hi: 25 }, { what: 'garage', lo: 14, hi: 20 }];
export const shadow: Gen = (R, n) => fitted('shadow', () => {
  const who = pick(R, NAMES), sub2 = pick(R, SUBJ);
  const mixed = R() < 0.25;
  // person height h1 ft (5-6.5), shadow ratio s/h (a time of day), tall object H
  const h1 = pick(R, [5, 5.5, 6, 6.5]), ratio = pick(R, [0.5, 0.75, 1.25, 1.5, 2]);
  const s1 = h1 * ratio, H = r(R, sub2.lo, sub2.hi), s2 = H * ratio;
  if (!Number.isInteger(s2 * 2) || !Number.isInteger(s1 * 4)) fail();
  if (H / h1 > 5 || H / h1 < 2.5) fail();
  const hIn = h1 * 12;
  const l1 = mixed ? `${fmt(hIn)} in` : `${fmt(h1)} ft`;
  const fig = shadowFig(h1, s1, H, s2, { who, what: sub2.what, l1, ls1: `${fmt(s1)} ft`, ls2: `${fmt(s2)} ft`, askAlt: `${fmt(H)} ft` });
  const wrongs = [
    { v: (h1 * s1) / s2, mc: MC.crossPair, say: `Pair each height with its own shadow: ${who}'s height over ${who}'s shadow equals the ${sub2.what}'s height over its shadow.` },
    ...(mixed ? [{ v: (hIn * s2) / s1, mc: MC.units, say: `Change ${fmt(hIn)} in to feet first (÷ 12 = ${fmt(h1)} ft): the other lengths are in feet.` }] : []),
    { v: h1 + s2 - s1, mc: MC.additive, say: 'The shadow lengths scale by a factor, not by a difference.' },
  ].filter(w => w.v > 0 && Math.abs(w.v - H) > 1e-6);
  return numItem({
    id: `shadow-${n}`, family: 'shadow',
    prompt: `${who} is ${mixed ? `${fmt(hIn)} inches` : `${fmt(h1)} ft`} tall and casts a ${fmt(s1)} ft shadow. At the same moment a ${sub2.what} casts a ${fmt(s2)} ft shadow. Both stand straight up on level ground, and the sun's rays hit them at the same angle. How tall is the ${sub2.what}?`,
    board: `\\frac{h}{${fmt(s2)}} = \\frac{${fmt(h1)}}{${fmt(s1)}}`, unit: 'ft',
    solution: [...(mixed ? [`Same units first: ${fmt(hIn)} in = ${fmt(h1)} ft.`] : []), `Right angles at the ground and the same sun angle: the triangles are similar (AA).`, `height/shadow is the same: h/${fmt(s2)} = ${fmt(h1)}/${fmt(s1)}, so h = ${fmt(s2)} × ${fmt(h1)}/${fmt(s1)}.`, `h = <b class="s">${fmt(H)}</b> ft.`],
    picture: { fig, reveal: { solved: ['TB'] } },
  }, H, wrongs, 'Right: AA from the right angle and the sun angle.', 'Pair height with its own shadow in both ratios.');
});
export const mirror: Gen = (R, n) => fitted('mirror', () => {
  const who = pick(R, NAMES);
  const e = pick(R, [5, 5.5, 6]), d1 = pick(R, [4, 5, 6, 8]), k = pick(R, [2.5, 3, 3.5, 4]);
  const H = e * k, d2 = d1 * k;
  if (!Number.isInteger(H * 2) || !Number.isInteger(d2 * 2) || H > 70 || d2 > 80) fail();
  const u = 380 / Math.max(H, d1 + d2);
  const P: Record<string, Pt> = { E: [0, e * u], F: [0, 0], M: [d1 * u, 0], G: [(d1 + d2) * u, 0], T: [(d1 + d2) * u, H * u] };
  const fig = figOf(P, ['EF', 'FM', 'MG', 'GT', 'EM', 'MT'], {
    labs: [{ seg: 'EF', text: `${fmt(e)} ft` }, { seg: 'FM', text: `${fmt(d1)} ft` }, { seg: 'MG', text: `${fmt(d2)} ft` }, { seg: 'GT', text: '?', alt: `${fmt(H)} ft` }],
    marks: [{ ang: 'EFM', box: true }, { ang: 'MGT', box: true }, { ang: 'FME', n: 1 }, { ang: 'GMT', n: 1 }],
    segStyle: { EM: { dash: true, col: 'faint' }, MT: { dash: true, col: 'faint' }, EF: { side: -1 }, GT: { side: -1 }, FM: { side: -1 }, MG: { side: -1 } }, bare: ['E', 'F', 'G', 'T'], dirs: { M: 90 },
  });
  fig.words = [{ at: [0, e * u + 55], text: who }, { at: [(d1 + d2) * u, H * u + 55], text: 'building' }];
  const wrongs = [{ v: (e * d1) / d2, mc: MC.crossPair, say: `Pair ${who}'s eye height with ${who}'s own distance to the mirror, the building with its distance.` }, { v: e + d2 - d1, mc: MC.additive, say: 'The triangles scale by a factor.' }].filter(w => w.v > 0 && Math.abs(w.v - H) > 1e-6);
  return numItem({
    id: `mirror-${n}`, family: 'mirror',
    prompt: `${who} puts a mirror M flat on level ground, ${fmt(d1)} ft in front of ${who}'s feet and ${fmt(d2)} ft from a building. Looking down, ${who} sees the top of the building in the mirror, with eyes ${fmt(e)} ft above the ground. Light reflects at equal angles with the ground, and ${who} and the building stand straight up. How tall is the building?`,
    board: `\\frac{h}{${fmt(d2)}} = \\frac{${fmt(e)}}{${fmt(d1)}}`, unit: 'ft',
    solution: ['Right angles at the ground and equal angles at the mirror: the triangles are similar (AA).', `h/${fmt(d2)} = ${fmt(e)}/${fmt(d1)}, so h = ${fmt(d2)} × ${fmt(e)}/${fmt(d1)}.`, `h = <b class="s">${fmt(H)}</b> ft.`],
    picture: { fig, reveal: { solved: ['GT'] } },
  }, H, wrongs, 'Right.', 'Pair each height with its own distance to the mirror.');
});
export const river: Gen = (R, n) => fitted('river', () => {
  // T on the far bank; B across from it on the near bank; C along the bank; D straight back from B; E on line TC with DE ∥ BC
  const w = pick(R, [40, 48, 60, 72, 80, 90]), k = pick(R, [[5, 4], [4, 3], [3, 2]] as Q[]);
  const BD = (w * (k[0] - k[1])) / k[1], DE0 = 0;
  const BC = pick(R, [20, 24, 30, 36, 40, 45, 50].filter(x => x / w >= 0.4 && x / w <= 0.8));
  if (BC === undefined) fail();
  const DE = (BC * k[0]) / k[1] + DE0;
  if (!Number.isInteger(BD) || !Number.isInteger(DE * 2)) fail();
  const u = 400 / (w + BD);
  const P: Record<string, Pt> = { T: [0, (w + BD) * u], B: [0, BD * u], D: [0, 0], C: [BC * u, BD * u], E: [DE * u, 0] };
  const fig = figOf(P, ['TB', 'BD', 'BC', 'DE', 'TC', 'CE'], {
    labs: [{ seg: 'TB', text: '?', alt: `${w} ft` }, { seg: 'BD', text: `${fmt(BD)} ft` }, { seg: 'BC', text: `${fmt(BC)} ft` }, { seg: 'DE', text: `${fmt(DE)} ft` }],
    marks: [{ ang: 'TBC', box: true }, { ang: 'BDE', box: true }],
    // lengths: TB and BD on the left, BC and DE below their segments; the banks run right from T and from B
    segStyle: { TB: { side: -1 }, BD: { side: -1 }, BC: { side: -1 }, DE: { side: -1 } },
    dirs: { T: 90, B: 145, D: 215, C: 60, E: -30 },
    extra: [{ id: 'bank1', a: [0, (w + BD) * u], b: [DE * u * 1.25, (w + BD) * u], col: 'second', dash: true }, { id: 'bank2', a: [BC * u, BD * u], b: [DE * u * 1.25, BD * u], col: 'second', dash: true }],
  });
  const wrongs = [{ v: (BC * BD) / DE, mc: MC.partWhole, say: 'TD is the whole side: w + BD pairs with DE, w pairs with BC.' }].filter(x => x.v > 0 && Math.abs(x.v - w) > 1e-6);
  return numItem({
    id: `river-${n}`, family: 'river',
    prompt: `To find the width w = TB of a river, a surveyor marks B across from a tree T, walks ${fmt(BC)} ft along the bank to C, and also steps ${fmt(BD)} ft straight back from B to D. From D she walks parallel to the bank to E, in line with T and C: DE = ${fmt(DE)} ft. The angles at B and D are right angles. How wide is the river?`,
    board: `\\frac{w}{${fmt(BC)}} = \\frac{w + ${fmt(BD)}}{${fmt(DE)}}`, unit: 'ft',
    solution: [`BC ∥ DE, so △TBC ~ △TDE (shared angle at T, right angles): w/${fmt(BC)} = (w + ${fmt(BD)})/${fmt(DE)}.`, `${fmt(DE)}w = ${fmt(BC)}w + ${fmt(BC * BD)}, so ${fmt(DE - BC)}w = ${fmt(BC * BD)}.`, `w = <b class="s">${w}</b> ft.`],
    picture: { fig, reveal: { solved: ['TB'] } },
  }, w, wrongs, 'Right: the big triangle has the whole side w + BD.', 'Pair the whole TD = w + BD with DE, and w with BC.');
});
export { A, S, at };
