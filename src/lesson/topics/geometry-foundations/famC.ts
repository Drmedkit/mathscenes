// famC.ts: families on whole proofs (reason types, missing lines, formats, circularity, Parsons ordering, backward
// planning), on the scope of a claim, evidence vs proof, counterexamples, the representative drawing, and the
// parallel-line theorems, their converses and multi-step angle problems (sub-goals 10, 20, 22-31).
import { type Fig, type GAngle, type GSeg, type Pt, at } from './geo';
import { crossing, fan, letters, mark, onLine, pairName, slotMeasure, transversal, type PairName } from './figs';
import { type Base, type GFItem, type Gen, type Opt, type ProofPic, A, B, MC, NAMES, ans, choiceItem, fitted, numItem, pick, q, r, segN, shuffle } from './kit';
import { ANGLE_PROOFS, PAR_PROOFS, type Proof, type ProofId, RS, type ReasonKey, SEG_PROOFS, TYPE_OF, TYPE_WORD, htm, makeProof, paragraph, validOrder } from './proofs';

const proofPic = (p: Proof, o: Partial<ProofPic> = {}, rows = p.rows.map(x => ({ st: x.st, rs: RS[x.rs] as string }))): ProofPic => ({ given: p.given, prove: p.prove, rows, ...o });
const LINE = (i: number) => `Line ${i}`;

// ======================= 10 reason types =======================
export const reasonType: Gen = (R, n) => fitted('reasonType', () => {
  const p = makeProof(pick(R, [...SEG_PROOFS, ...ANGLE_PROOFS, ...PAR_PROOFS]), R);
  const k = r(R, 1, p.rows.length - 1), row = p.rows[k]!;
  const t = TYPE_OF[row.rs];
  const others = shuffle(R, (['given', 'definition', 'postulate', 'theorem', 'property'] as const).filter(x => x !== t)).slice(0, 3);
  return choiceItem(R, {
    id: `reasonType-${n}`, family: 'reasonType', prompt: `What <b>type</b> of reason supports line ${k + 1}?`, board: row.st,
    solution: [`Line ${k + 1} cites the ${RS[row.rs]}.`, `That is ${TYPE_WORD[t].toLowerCase()}.`],
    picture: { fig: p.fig, proof: proofPic(p, { ring: k }) },
  }, [t, ...others].map(x => ({ t: TYPE_WORD[x], ok: x === t, say: x === t ? `Right: the ${RS[row.rs]} is ${TYPE_WORD[t].toLowerCase()}.` : `Line ${k + 1} cites the ${RS[row.rs]}: ${TYPE_WORD[t].toLowerCase()}.` })));
});

/** sg reason-types: the one line of a given type; sg circularity: the line that uses what is being proved */
export const findLine: Gen = (R, n, sg) => fitted('findLine', () => {
  if (sg !== 'circularity' && (sg === 'reason-types' || R() < 0.5)) {
    for (;;) {
      const p = makeProof(pick(R, [...SEG_PROOFS, ...ANGLE_PROOFS, ...PAR_PROOFS]), R);
      const types = p.rows.map(x => TYPE_OF[x.rs]);
      const uniq = (['definition', 'postulate', 'theorem', 'property'] as const).filter(t => types.filter(x => x === t).length === 1);
      if (!uniq.length) continue;
      const t = pick(R, uniq), k = types.indexOf(t);
      const lines = shuffle(R, p.rows.map((_, i) => i).filter(i => i !== k)).slice(0, 3);
      return choiceItem(R, {
        id: `findLine-${n}`, family: 'findLine', prompt: `Which line is supported by ${TYPE_WORD[t].toLowerCase()}?`, board: p.prove,
        solution: p.rows.map((x, i) => `Line ${i + 1}: ${RS[x.rs]} (${TYPE_WORD[TYPE_OF[x.rs]].toLowerCase()}).`).filter((_, i) => i === k || i < 2),
        picture: { fig: p.fig, proof: proofPic(p), reveal: { rings: [k] } },
      }, [k, ...lines].sort((a, b) => a - b).map(i => ({ t: LINE(i + 1), ok: i === k, say: i === k ? `Right: the ${RS[p.rows[i]!.rs]} is ${TYPE_WORD[t].toLowerCase()}.` : `Line ${i + 1} cites the ${RS[p.rows[i]!.rs]}, which is ${TYPE_WORD[TYPE_OF[p.rows[i]!.rs]].toLowerCase()}.` })), true);
    }
  }
  // circular: a line cites the theorem being proved, or the target is called "Given"
  const id = pick(R, ['vertical', 'congSupp', 'altInt', 'altExt', 'consInt', 'segOverlap', 'midTrans', 'bisDouble'] as ProofId[]);
  const p = makeProof(id, R);
  const rows = p.rows.map(x => ({ st: x.st, rs: RS[x.rs] as string }));
  let k: number, how: string;
  if (p.theorem) { k = pick(R, p.rows.map((x, i) => i).filter(i => i > 0 && p.rows[i]!.rs !== 'given')); rows[k] = { st: rows[k]!.st, rs: RS[p.theorem] }; how = `Line ${k + 1} cites the ${RS[p.theorem]}, the very theorem this proof is proving.`; }
  else { k = p.rows.length - 1; rows[k] = { st: rows[k]!.st, rs: 'Given' }; how = `Line ${k + 1} calls the statement to prove “Given”: it assumes the conclusion.`; }
  const lines = shuffle(R, p.rows.map((_, i) => i).filter(i => i !== k)).slice(0, 3);
  return choiceItem(R, {
    id: `findLine-${n}`, family: 'findLine', prompt: `This proof ${p.theorem ? `is meant to prove the ${RS[p.theorem]}` : 'has a flaw'}. Which line is <b>circular</b>: it uses what is being proved?`, board: p.prove,
    solution: [how, 'A proof may only use the givens and statements accepted or proved before.'],
    picture: { fig: p.fig, proof: proofPic(p, {}, rows), reveal: { strike: [k] } },
  }, [k, ...lines].sort((a, b) => a - b).map(i => ({ t: LINE(i + 1), ok: i === k, say: i === k ? `Right. ${how}` : `Line ${i + 1} uses ${rows[i]!.rs}, which is allowed. ${how}` })), true);
});

// ======================= 20, 22, 29 a missing line =======================
const NEAR: Partial<Record<ReasonKey, [ReasonKey, string | undefined][]>> = {
  linPair: [['vert', MC.wrongPair], ['defSupp', MC.noHyp], ['angAdd', undefined]],
  vert: [['linPair', MC.wrongPair], ['corr', MC.wrongPair], ['defCongAng', undefined]],
  corr: [['vert', MC.wrongPair], ['linPair', MC.wrongPair], ['altInt', MC.wrongPair]],
  defMid: [['defBis', MC.noHyp], ['segAdd', undefined], ['defCongSeg', MC.noHyp]],
  defBis: [['defMid', MC.noHyp], ['angAdd', undefined], ['vert', MC.wrongPair]],
  segAdd: [['angAdd', MC.noHyp], ['defMid', MC.noHyp], ['addP', undefined]],
  angAdd: [['segAdd', MC.noHyp], ['linPair', MC.wrongPair], ['defBis', MC.noHyp]],
  subst: [['subP', undefined], ['addP', undefined], ['sym', undefined]],
  subP: [['addP', MC.oneSide], ['subst', undefined], ['sym', undefined]],
  addP: [['subP', undefined], ['subst', undefined], ['refl', undefined]],
  sym: [['refl', undefined], ['subP', undefined], ['addP', undefined]],
  trans: [['sym', undefined], ['refl', undefined], ['addP', undefined]],
  defSupp: [['linPair', MC.noHyp], ['defComp', MC.noHyp], ['vert', MC.wrongPair]],
  defComp: [['defSupp', MC.noHyp], ['linPair', MC.noHyp], ['vert', MC.wrongPair]],
  defCongAng: [['vert', MC.wrongPair], ['defCongSeg', MC.noHyp], ['subP', undefined]],
};
function sgProofs(sg?: string): ProofId[] {
  if (sg === 'parallel-line-theorem-proofs') return PAR_PROOFS;
  if (sg === 'equality-chains') return ['segOverlap', 'segBack', 'midTrans', 'midDouble', 'vertical', 'congSupp'];
  return [...SEG_PROOFS, ...ANGLE_PROOFS];
}
export const proofFill: Gen = (R, n, sg) => fitted('proofFill', () => {
  const p = makeProof(pick(R, sgProofs(sg)), R);
  const ks = p.rows.map((x, i) => i).filter(i => i > 0 && p.rows[i]!.rs !== 'given');
  const k = pick(R, ks), row = p.rows[k]!;
  const askSt = R() < 0.45;
  const rows = p.rows.map((x, i) => ({ st: i === k && askSt ? '' : x.st, rs: i === k && !askSt ? '' : RS[x.rs] as string }));
  const pic = proofPic(p, { ask: [{ i: k, cell: askSt ? 'st' : 'rs' }] }, rows);
  const reveal = { fill: [{ i: k, st: askSt ? row.st : undefined, rs: askSt ? undefined : RS[row.rs] }] };
  if (!askSt) {
    const near = (NEAR[row.rs] ?? []).filter(([key]) => key !== row.rs && !(row.also ?? []).includes(key));
    const circ: Opt[] = p.theorem && p.theorem !== row.rs ? [{ t: RS[p.theorem], mc: MC.circular, say: `That is the theorem this proof is proving: it cannot be a reason inside its own proof.` }] : [];
    const opts: Opt[] = [{ t: RS[row.rs], ok: true, say: `Right: the ${RS[row.rs]} gives exactly this step.` }, ...circ, ...near.map(([key, mc]) => ({ t: RS[key], mc, say: mc === MC.wrongPair ? 'That reason is about a different angle pair.' : mc === MC.noHyp ? 'Its hypothesis is not met at this point.' : `That does not give line ${k + 1}. Look at what changed from the lines above.` }))];
    const uniq = opts.filter((o, i) => opts.findIndex(x => x.t === o.t) === i).slice(0, 4);
    return choiceItem(R, {
      id: `proofFill-${n}`, family: 'proofFill', prompt: `Which reason belongs in line ${k + 1}?`, board: row.st,
      solution: [`Line ${k + 1}: ${htm(row.st)}.`, `It follows from ${row.uses.length ? `line${row.uses.length > 1 ? 's' : ''} ${row.uses.join(' and ')}` : 'the figure’s givens'} by the ${RS[row.rs]}.`],
      picture: { fig: p.fig, proof: pic, reveal },
    }, uniq);
  }
  const target = htm(p.prove), right = htm(row.st);
  const cand: Opt[] = [{ t: right, ok: true, say: `Right: the ${RS[row.rs]} gives exactly this.` }];
  if (k < p.rows.length - 1 && target !== right) cand.push({ t: target, mc: MC.circular, say: 'That is what the proof must arrive at; it cannot appear before it is earned.' });
  const rowSts = new Set(p.rows.map(x => htm(x.st)));
  for (const d of p.decoys) if (!rowSts.has(htm(d.st))) cand.push({ t: htm(d.st), mc: d.mc, say: d.why });
  // a one-side slip for the addition / subtraction rows: the shared term on one side only
  const slip = oneSideSlip(p, k);
  if (slip) cand.push({ t: slip, mc: MC.oneSide, say: 'Do the same to both sides.' });
  const uniq = cand.filter((o, i) => cand.findIndex(x => x.t === o.t) === i && (o.ok || o.t !== right)).slice(0, 4);
  if (uniq.length < 3) uniq.push({ t: 'Nothing: line ' + (k + 1) + ' is not needed', say: `Line ${k + 1} is needed: a later line uses it.` });
  return choiceItem(R, {
    id: `proofFill-${n}`, family: 'proofFill', prompt: `Which statement belongs in line ${k + 1}?`, board: RS[row.rs],
    solution: [`Line ${k + 1} cites the ${RS[row.rs]}.`, `From ${row.uses.length ? `line${row.uses.length > 1 ? 's' : ''} ${row.uses.join(' and ')}` : 'the givens'} it gives ${right}.`],
    picture: { fig: p.fig, proof: pic, reveal },
  }, uniq);
});

/** the statement of an addition / subtraction row with the shared term on one side only */
function oneSideSlip(p: Proof, k: number): string | null {
  const row = p.rows[k]!;
  if (row.rs !== 'subP' && row.rs !== 'addP') return null;
  const src = row.rs === 'subP' ? p.rows[row.uses[0]! - 1]!.st : row.st;   // "X + S = S + Y" (or "X + S = Y + S")
  const [l, rr] = src.split(' = ') as [string, string];
  const lt = l.split(' + '), rt = rr.split(' + ');
  const S = lt.find(t => rt.includes(t));
  if (!S) return null;
  if (row.rs === 'subP') { const [L0, R0] = row.st.split(' = ') as [string, string]; return htm(`${L0} = ${R0} + ${S}`); }
  return htm(`${l} = ${rt.filter(t => t !== S).join(' + ')}`);
}

// ======================= 22 the format does not make the proof =======================
export const formatJudge: Gen = (R, n) => {
  const p = makeProof(pick(R, ['segOverlap', 'segBack', 'midTrans', 'bisDouble', 'altInt'] as ProofId[]), R);
  const v = r(R, 0, 2);
  const good = p.rows.map(x => ({ st: x.st, rs: RS[x.rs] as string }));
  const k = pick(R, p.rows.map((x, i) => i).filter(i => i > 0 && p.rows[i]!.rs !== 'given'));
  const badRs = p.theorem && p.theorem !== p.rows[k]!.rs ? RS[p.theorem] : (NEAR[p.rows[k]!.rs]?.[0] ? RS[NEAR[p.rows[k]!.rs]![0]![0]] : 'Given');
  const bad = good.map((x, i) => (i === k ? { st: x.st, rs: badRs } : x));
  const table = v === 1 ? bad : good, para = v === 2 ? bad : good;
  const right = v === 0 ? 'Both: every step has a reason that fits' : v === 1 ? 'Only the paragraph proof' : 'Only the two-column proof';
  const why = v === 0 ? 'Both give a fitting reason for every step; layout does not matter.' : `In the ${v === 1 ? 'two-column' : 'paragraph'} proof, line ${k + 1} cites the ${badRs}, which does not give that step.`;
  return choiceItem(R, {
    id: `formatJudge-${n}`, family: 'formatJudge', prompt: 'Two students wrote a proof of the same claim, one in two columns, one as a paragraph. Which is a valid proof?', board: p.prove,
    solution: [why, 'A proof is judged by its logic, not by its layout.'],
    picture: { proof: proofPic(p, {}, table), card: { lines: [paragraph(p, para)] }, reveal: v ? { rings: v === 1 ? [k] : [] } : {} },
  }, [
    { t: 'Both: every step has a reason that fits', ok: v === 0, say: v === 0 ? 'Right: same logic, two layouts.' : why },
    { t: 'Only the two-column proof', ok: v === 2, mc: v === 2 ? undefined : MC.byFormat, say: v === 2 ? `Right. ${why}` : v === 0 ? 'The paragraph has the same steps and reasons; the layout does not matter.' : `Filled columns are not enough. ${why}` },
    { t: 'Only the paragraph proof', ok: v === 1, say: v === 1 ? `Right. ${why}` : why },
    { t: 'Neither: a real proof needs numbered columns', mc: MC.byFormat, say: 'Any layout is fine; the logic is what is checked.' },
  ], true);
};

// ======================= 23 repair a circular line =======================
export const repairCircular: Gen = (R, n) => fitted('repairCircular', () => {
  const p = makeProof(pick(R, ['vertical', 'congSupp', 'altInt', 'altExt', 'consInt'] as ProofId[]), R);
  const k = pick(R, p.rows.map((x, i) => i).filter(i => i > 0 && p.rows[i]!.rs !== 'given')), row = p.rows[k]!;
  const rows = p.rows.map((x, i) => ({ st: x.st, rs: i === k ? RS[p.theorem!] : RS[x.rs] as string }));
  const near = (NEAR[row.rs] ?? []).filter(([key]) => key !== row.rs && key !== p.theorem && !(row.also ?? []).includes(key)).slice(0, 2);
  return choiceItem(R, {
    id: `repairCircular-${n}`, family: 'repairCircular', prompt: `This proof is meant to prove the ${RS[p.theorem!]}, but line ${k + 1} cites that very theorem. Which reason should line ${k + 1} have?`, board: row.st,
    solution: [`A proof of the ${RS[p.theorem!]} cannot use it.`, `Line ${k + 1} (${htm(row.st)}) follows from the ${RS[row.rs]}.`],
    picture: { fig: p.fig, proof: proofPic(p, { strike: [k] }, rows), reveal: { rings: [k] } },
  }, [
    { t: RS[row.rs], ok: true, say: 'Right: an accepted statement that gives this step without assuming the result.' },
    { t: 'It looks that way in the figure', mc: MC.appearance, say: 'Looks are never a reason.' },
    ...near.map(([key, mc]) => ({ t: RS[key], mc, say: 'That reason does not give this step.' })),
  ]);
});

// ======================= 24 Parsons + backward planning =======================
export const parsons: Gen = (R, n) => fitted('parsons', () => {
  const p = makeProof(pick(R, ['segOverlap', 'segBack', 'midTrans', 'midDouble', 'bisDouble', 'vertical', 'altInt', 'altExt', 'consInt'] as ProofId[]), R);
  const N = p.rows.length, decoy = pick(R, p.decoys);
  // pool: the rows and the decoy, shuffled; letters A, B, C ...
  const items = shuffle(R, [...p.rows.map((x, i) => ({ st: x.st, rs: RS[x.rs] as string, row: i + 1 })), { st: decoy.st, rs: decoy.rs, row: 0 }]);
  const letterOf = (row: number) => String.fromCharCode(65 + items.findIndex(x => x.row === row));
  const canon = Array.from({ length: N }, (_, i) => i + 1);
  const fmt = (o: number[]) => o.map(letterOf).join(', ');
  const right = fmt(canon);
  const seen = new Set([right]);
  const opts: Opt[] = [{ t: right, ok: true, say: 'Right: every line comes after the lines it uses, and the decoy is left out.' }];
  // the decoy in place of the row it imitates (the target, or a middle row)
  const rep = canon.slice(); rep[htm(decoy.st) === htm(p.prove) ? N - 1 : r(R, 1, N - 2)] = 0;
  const repT = fmt(rep);
  if (!seen.has(repT)) { seen.add(repT); opts.push({ t: repT, mc: decoy.mc, say: `Line ${letterOf(0)} is the decoy: ${decoy.why}` }); }
  for (let t = 0; t < 40 && opts.length < 4; t++) {
    const o = canon.slice(), i = r(R, 0, N - 2), j = r(R, i + 1, N - 1);
    [o[i], o[j]] = [o[j]!, o[i]!];
    if (validOrder(p, o)) continue;
    const s = fmt(o);
    if (seen.has(s)) continue;
    seen.add(s);
    opts.push({ t: s, mc: MC.beforeEst, say: 'In that order a line uses a statement that only comes later.' });
  }
  return choiceItem(R, {
    id: `parsons-${n}`, family: 'parsons', prompt: `Put the lines in an order that proves the claim. One line is a decoy and is left out. Which order works?`, board: p.prove,
    solution: [`Start from the given, then each line after the lines it uses: ${right}.`, `Line ${letterOf(0)} is the decoy: ${decoy.why}`],
    picture: { fig: p.fig, proof: { given: p.given.length > 1 && p.given.join('').length < 52 ? [p.given.join(';\\quad ')] : p.given, prove: p.prove, rows: items.map(x => ({ st: x.st, rs: x.rs })), pool: true }, reveal: { strike: [items.findIndex(x => x.row === 0)], rowOf: items.map(x => x.row) } },
  }, opts);
});
export const planBack: Gen = (R, n) => fitted('planBack', () => {
  const p = makeProof(pick(R, [...SEG_PROOFS, ...ANGLE_PROOFS, ...PAR_PROOFS]), R);
  const N = p.rows.length, last = p.rows[N - 1]!;
  const prem = pick(R, last.uses);
  const right = htm(p.rows[prem - 1]!.st);
  const cand: Opt[] = [{ t: right, ok: true, say: `Right: the ${RS[last.rs]} needs this line above it.` }];
  cand.push({ t: htm(p.prove), mc: MC.circular, say: 'That is the target itself: you cannot use it to reach itself.' });
  const rowSts = new Set(p.rows.map(x => htm(x.st)));
  for (const d of p.decoys) if (!rowSts.has(htm(d.st))) cand.push({ t: htm(d.st), mc: d.mc, say: d.why });
  if (cand.length < 3) cand.push({ t: htm(p.rows[0]!.st) === right ? 'Nothing: the given is enough' : 'Nothing: the reason alone is enough', say: `The ${RS[last.rs]} needs a statement to work on.` });
  const uniq = cand.filter((o, i) => cand.findIndex(x => x.t === o.t) === i && (o.ok || o.t !== right)).slice(0, 4);
  return choiceItem(R, {
    id: `planBack-${n}`, family: 'planBack', prompt: `Plan backward. The proof will end with ${q(htm(last.st))} by the ${RS[last.rs]}. Which statement must be proved somewhere above that line?`, board: last.st,
    solution: [`The ${RS[last.rs]} turns ${last.uses.map(u => htm(p.rows[u - 1]!.st)).join(' and ')} into the target.`, `So ${right} has to come first.`],
    picture: { fig: p.fig, proof: { given: p.given, prove: p.prove, rows: [{ st: '', rs: '' }, { st: last.st, rs: RS[last.rs] }], first: N - 1, ask: [{ i: 0, cell: 'st' }] }, reveal: { fill: [{ i: 0, st: p.rows[prem - 1]!.st }] } },
  }, uniq);
});

// ======================= 25, 28 scope and the representative drawing =======================
export const scopeOf: Gen = (R, n, sg) => fitted('scopeOf', () => {
  const v = r(R, 0, 2), m = r(R, 35, 75), L = letters(R, 6).filter(x => x !== 'M' && x !== 'E');
  let fig: Fig, kind: string, st: string, these: string;
  if (v === 0) { const X = crossing(m, r(R, -10, 10), [L[0]!, L[1]!, L[2]!, L[3]!, 'E'], { texts: { 1: `${m}°`, 3: `${m}°` }, cols: { 1: 'second', 3: 'second' } }); X.fig.angles = X.fig.angles.filter(a => a.id === 'a1' || a.id === 'a3'); X.fig.points = []; fig = X.fig; kind = 'pair of vertical angles'; st = 'If two angles are vertical angles, then they are congruent.'; these = `vertical angles of ${m}°`; }
  else if (v === 1) { const F = fan(L[1]!, [{ name: L[0]!, deg: 0 }, { name: L[3]!, deg: 180 - m - 40 }, { name: L[2]!, deg: 180 }]); F.fig.angles = [mark('x', F.end, L[1]!, L[0]!, L[3]!, { text: `${140 - m}°`, col: 'second', r: 64 }), mark('y', F.end, L[1]!, L[3]!, L[2]!, { text: `${m + 40}°`, col: 'second', r: 64 })]; fig = F.fig; kind = 'linear pair'; st = 'If two angles form a linear pair, then they are supplementary.'; these = `a linear pair of ${140 - m}° and ${m + 40}°`; }
  else { const a = r(R, 4, 9); fig = onLine([L[0]!, 'M', L[1] === 'M' ? 'N' : L[1]!], [0, 250, 500], { ticks: [1, 1], texts: [String(a), String(a)] }); kind = 'midpoint of a segment'; st = 'If M is the midpoint of a segment, then it splits it into two congruent segments.'; these = `segments ${2 * a} units long`; }
  if (sg === 'representative-diagram') {
    return choiceItem(R, {
      id: `scopeOf-${n}`, family: 'scopeOf', prompt: `A proof of ${q(st)} was written beside this one drawing (${these}), and no step uses anything the givens do not say. Which figures does the proof cover?`, board: st,
      solution: ['A proof that uses only the givens works for every figure that meets them.', 'The drawing is one representative case.'],
      picture: { fig, card: { lines: [st] } },
    }, [
      { t: 'Every figure that meets the givens', ok: true, say: 'Right: the drawing is only one example of them.' },
      { t: 'Only figures that look like this drawing', mc: MC.drawnCase, say: 'No step used the look of the drawing, so the size and position do not matter.' },
      { t: 'None for sure: a proof drawn with a picture proves only the picture', mc: MC.picPrecludes, say: 'The picture helps you follow along; the steps use only the givens.' },
    ]);
  }
  return choiceItem(R, {
    id: `scopeOf-${n}`, family: 'scopeOf', prompt: `Theorem: ${q(st)} The drawing shows one ${kind}: ${these}. Which figures does the theorem cover?`, board: st,
    solution: ['A general claim is about every figure that meets its hypothesis.', 'The drawing is one example of it.'],
    picture: { fig, card: { lines: [st] } },
  }, [
    { t: `Every ${kind}, whatever its size or position`, ok: true, say: 'Right: the statement is about all of them.' },
    { t: 'Only the one in this drawing', mc: MC.drawnCase, say: 'The drawing is an example; the theorem is about every one.' },
    { t: `Only ${these}`, mc: MC.drawnCase, say: 'Nothing in the hypothesis fixes the size.' },
    { t: 'Most of them, but not every one', say: 'A theorem has no exceptions within its hypothesis.' },
  ]);
});
export const everySome: Gen = (R, n) => {
  const L = letters(R, 3), m = r(R, 20, 80);
  const C = pick(R, [
    { s: 'Every midpoint splits its segment into two congruent segments.', k: 'every' },
    { s: 'If two lines are perpendicular, then they form four right angles.', k: 'every' },
    { s: 'Vertical angles are congruent.', k: 'every' },
    { s: 'Some pairs of supplementary angles form a linear pair.', k: 'some' },
    { s: 'There is an angle that is congruent to its own supplement.', k: 'some' },
    { s: 'At least one pair of congruent angles is a pair of vertical angles.', k: 'some' },
    { s: `In the figure, m∠${L[0]}${L[1]}${L[2]} = ${m}°.`, k: 'one' },
    { s: `The segment ${segN(L[0]! + L[1]!)} drawn on this page is ${r(R, 3, 9)} cm long.`, k: 'one' },
    { s: `Point ${L[1]} in this sketch lies between ${L[0]} and ${L[2]}.`, k: 'one' },
  ]);
  const W = { every: 'Every figure that meets its conditions', some: 'At least one figure (not necessarily all)', one: 'One particular figure in a drawing' } as const;
  return choiceItem(R, {
    id: `everySome-${n}`, family: 'everySome', prompt: `${q(C.s)} What is this claim about?`, board: C.s,
    solution: [C.k === 'every' ? 'A general statement (even without the word “every”) is about all figures that meet it.' : C.k === 'some' ? '“Some” and “there is” need only one example.' : 'It names one figure in one drawing.'],
    picture: { card: { lines: [C.s] } },
  }, (['every', 'some', 'one'] as const).map(k => ({ t: W[k], ok: k === C.k, mc: C.k === 'every' && k === 'one' ? MC.drawnCase : undefined, say: k === C.k ? 'Right.' : C.k === 'every' ? 'It has no particular figure in it: it is about all of them.' : C.k === 'some' ? 'It only says at least one exists.' : 'It points at one figure in a drawing.' })), true);
};

/** sub-goal 28: recheck a proof on another drawing that meets the givens */
export const redraw: Gen = (R, n) => fitted('redraw', () => {
  const L = letters(R, 4), [A0, B0, C0, D0] = L as [string, string, string, string];
  if (R() < 0.5) {
    const t1 = r(R, 50, 70), t2 = r(R, 110, 130);
    const f1 = crossing(t1, r(R, -10, 10), ['A', 'B', 'C', 'D', 'E']).fig, f2 = crossing(t2, r(R, -10, 10), ['A', 'B', 'C', 'D', 'E']).fig;
    for (const f of [f1, f2]) { f.points = []; f.angles = f.angles.filter(a => a.id !== 'a4'); }
    return choiceItem(R, {
      id: `redraw-${n}`, family: 'redraw', prompt: `This proof was written beside drawing 1: <ol class="pf"><li>∠1, ∠2 and ∠2, ∠3 are linear pairs (Given)</li><li>m∠1 + m∠2 = 180°, m∠2 + m∠3 = 180° (Linear Pair Postulate)</li><li>m∠1 + m∠2 = m∠2 + m∠3 (Substitution)</li><li>m∠1 = m∠3 (Subtraction)</li></ol> Drawing 2 meets the same givens. Does the proof still work for it?`,
      solution: ['Every step uses only the givens and accepted statements.', 'Nothing depends on the size of the angles in drawing 1, so it works for drawing 2 too.'],
      picture: { gallery: { figs: [f1, f2], caps: ['drawing 1', 'drawing 2'] } },
      board: `${t1}^\\circ, ${t2}^\\circ`,
    }, [
      { t: 'Yes: no step depends on drawing 1', ok: true, say: 'Right: the proof covers every figure that meets the givens.' },
      { t: 'No: it was written for drawing 1', mc: MC.drawnCase, say: 'It was written beside drawing 1, but no step used it.' },
      { t: 'No: drawing 2 needs its own measurements', mc: MC.drawnCase, say: 'The proof uses no measurements at all.' },
    ]);
  }
  const a = r(R, 22, 34), b = a + r(R, 28, 40), a0 = r(R, -10, 10);
  const F1 = fan(B0, [{ name: A0, deg: a0 }, { name: D0, deg: a0 + a }, { name: C0, deg: a0 + a + b }]);
  F1.fig.angles = [mark('x', F1.end, B0, A0, D0, { text: `${a}°`, col: 'second', r: 70 }), mark('y', F1.end, B0, D0, C0, { text: `${b}°`, col: 'second', r: 70 })];
  const F2 = fan(B0, [{ name: A0, deg: a0 }, { name: C0, deg: a0 + b - a }, { name: D0, deg: a0 + b }]);
  F2.fig.angles = [mark('x', F2.end, B0, A0, D0, { text: `${b}°`, col: 'second', r: 110 }), mark('y', F2.end, B0, D0, C0, { text: `${a}°`, col: 'second', r: 64 })];
  // drawing 2: m∠ABD = a? keep the givens: m∠ABD = a, m∠DBC = b with D outside: C between A and D in angle order
  const F2b = fan(B0, [{ name: A0, deg: a0 + b - a }, { name: D0, deg: a0 + b }, { name: C0, deg: a0 }]);
  F2b.fig.angles = [mark('x', F2b.end, B0, A0, D0, { text: `${a}°`, col: 'second', r: 64 }), mark('y', F2b.end, B0, D0, C0, { text: `${b}°`, col: 'second', r: 120, lab: 1 - (b - a) / 2 / b })];
  void F2;
  return choiceItem(R, {
    id: `redraw-${n}`, family: 'redraw', prompt: `Given: m∠${A0}${B0}${D0} = ${a}° and m∠${D0}${B0}${C0} = ${b}°. A proof written beside drawing 1: <ol class="pf"><li>m∠${A0}${B0}${D0} = ${a}°, m∠${D0}${B0}${C0} = ${b}° (Given)</li><li>m∠${A0}${B0}${D0} + m∠${D0}${B0}${C0} = m∠${A0}${B0}${C0} (Angle Addition Postulate)</li><li>m∠${A0}${B0}${C0} = ${a + b}° (Substitution)</li></ol> Drawing 2 meets the same givens. Does the proof work for it?`, board: `m\\angle ${A0}${B0}${C0} = ${a + b}`,
    solution: [`Line 2 needs ${D0} in the interior of ∠${A0}${B0}${C0}. The givens do not say that; only drawing 1 shows it.`, `In drawing 2, ${D0} is outside and m∠${A0}${B0}${C0} = ${b} − ${a} = ${b - a}°.`],
    picture: { gallery: { figs: [F1.fig, F2b.fig], caps: ['drawing 1', 'drawing 2'] } },
  }, [
    { t: `No: line 2 uses where ${D0} lies in drawing 1, which the givens do not say`, ok: true, say: `Right: in drawing 2, ${D0} is outside the angle, and the claim fails.` },
    { t: 'Yes: no step depends on drawing 1', mc: MC.appearance, say: `Line 2 does: the Angle Addition Postulate needs ${D0} inside ∠${A0}${B0}${C0}, and only drawing 1 shows that.` },
    { t: 'No: a proof only ever covers the drawing it was written beside', mc: MC.drawnCase, say: 'A proof that uses only the givens covers every drawing. This one used more.' },
  ]);
});

// ======================= 26 evidence vs proof =======================
export const evidenceVerdict: Gen = (R, n) => {
  const nm = pick(R, NAMES), k = r(R, 8, 60), v = r(R, 0, 5);
  const C = [
    { s: `Claim: vertical angles are congruent. ${nm} measured ${k} pairs with a protractor; every pair matched to the degree.`, verdict: 'not', why: 'Measurements are evidence; they cover only the pairs measured.' },
    { s: `Claim: the angle bisectors of a triangle meet in one point. ${nm} dragged a triangle around in geometry software ${k} times and it always held.`, verdict: 'not', why: 'A drag test checks many cases, not all of them, and the screen rounds.' },
    { s: `Claim: every angle in this list is acute: 23°, 41°, 58°, 67°, 72°, 88°. ${nm} checked all six.`, verdict: 'proved', why: 'The claim is about a finite list, and every member was checked: that is a complete proof.' },
    { s: `Claim: if two angles are supplementary, they form a linear pair. ${nm} drew two separate angles of 70° and 110°.`, verdict: 'false', why: 'The two angles are supplementary but not a linear pair: one counterexample disproves the claim.' },
    { s: `Claim: vertical angles are congruent. ${nm} tried to prove it but got stuck at the third line.`, verdict: 'not', why: 'A failed attempt does not make a claim false; it only stays unproved by that attempt.' },
    { s: `Claim: vertical angles are congruent. ${nm} proved it from the Linear Pair Postulate and properties of equality, a reason for every line.`, verdict: 'proved', why: 'A valid proof covers every case.' },
  ][v]!;
  const W = { proved: 'Proved', not: 'Not proved yet', false: 'Shown false' } as const;
  return choiceItem(R, {
    id: `evidenceVerdict-${n}`, family: 'evidenceVerdict', prompt: `${C.s} What is the status of the claim now?`, board: W[C.verdict as keyof typeof W],
    solution: [C.why],
    picture: { card: { lines: [C.s] } },
  }, (['proved', 'not', 'false'] as const).map(kk => ({
    t: W[kk], ok: kk === C.verdict,
    mc: kk === C.verdict ? undefined : kk === 'proved' && C.verdict === 'not' ? MC.examples : kk === 'not' && C.verdict === 'proved' && v === 2 ? MC.checkingNever : kk === 'false' && v === 4 ? MC.failedDisproof : undefined,
    say: kk === C.verdict ? `Right. ${C.why}` : C.why,
  })), true);
};
export const tearCorners: Gen = (R, n) => {
  const k = r(R, 3, 12), a = r(R, 40, 80), b = r(R, 40, 80), c = 180 - a - b + pick(R, [-1, 0, 1]);
  return choiceItem(R, {
    id: `tearCorners-${n}`, family: 'tearCorners', prompt: 'Which of these shows that the angles of <b>every</b> triangle add up to 180°?', board: `${k}: ${a} + ${b} + ${c}`,
    solution: ['Paper and protractors check particular triangles, with rounding.', 'The argument with a parallel line through a vertex uses only accepted statements (alternate interior angles, a straight angle), so it covers every triangle.'],
    picture: { card: { lines: ['The angles of every triangle', 'add up to 180°.', 'Which shows it?'] } },
  }, [
    { t: 'Draw the line through one vertex parallel to the opposite side; alternate interior angles and the straight angle give 180°', ok: true, say: 'Right: every step is an accepted statement, so it holds for every triangle.' },
    { t: `Tear the corners off ${k} paper triangles; each time they line up straight`, mc: MC.examples, say: `${k} triangles are ${k} examples, not every triangle.` },
    { t: `Measure one triangle: ${a}° + ${b}° + ${c}° = ${a + b + c}°`, mc: MC.measureProof, say: 'One measured triangle, with protractor rounding, proves nothing general.' },
    { t: `Check ${k * 10} triangles in geometry software`, mc: MC.examples, say: 'More examples are still examples.' },
  ]);
};

// ======================= 27 counterexamples =======================
interface CxCell { fig: Fig; kind: 'cx' | 'holds' | 'premise' }
function sepAngles(R: () => number, m1: number, m2: number, t1: string, t2: string, col?: 'second'): Fig {
  const o1: Pt = [-250, 60], o2: Pt = [60, -120], d1 = r(R, 0, 25), d2 = r(R, 20, 60);
  const mk = (o: Pt, d: number, m: number, id: string, t: string) => ({ segs: [{ id: id + 'a', a: o, b: at(o, d, 200), kind: 'ray' as const }, { id: id + 'b', a: o, b: at(o, d + m, 200), kind: 'ray' as const }] as GSeg[], ang: { id, v: o, p: at(o, d, 100), q: at(o, d + m, 100), text: t, col, r: 56 } as GAngle });
  const g1 = mk(o1, d1, m1, 'a1', t1), g2 = mk(o2, d2, m2, 'a2', t2);
  return { segs: [...g1.segs, ...g2.segs], angles: [g1.ang, g2.ang], points: [], pad: 70 };
}
export const pickCounter: Gen = (R, n) => fitted('pickCounter', () => {
  const v = r(R, 0, 3);
  let claim: string, cells: CxCell[], hyp: string;
  if (v === 0) {
    const m = r(R, 55, 80), lp = r(R, 40, 70), x = r(R, 30, 50), y = r(R, 40, 70);
    const F = fan('', [{ name: '', deg: 0 }, { name: '', deg: 180 - lp }, { name: '', deg: 180 }]); F.fig.points = []; F.fig.angles = [mark('x', F.end, '', '', '', {})]; F.fig.angles = [{ id: 'x', v: [0, 0], p: [100, 0], q: at([0, 0], 180 - lp, 100), text: `${180 - lp}°`, r: 56 }, { id: 'y', v: [0, 0], p: at([0, 0], 180 - lp, 100), q: [-100, 0], text: `${lp}°`, r: 56 }];
    claim = 'If two angles are supplementary, then they form a linear pair.'; hyp = 'supplementary';
    cells = [{ fig: sepAngles(R, m, 180 - m, `${m}°`, `${180 - m}°`), kind: 'cx' }, { fig: F.fig, kind: 'holds' }, { fig: sepAngles(R, x, y, `${x}°`, `${y}°`), kind: 'premise' }];
  } else if (v === 1) {
    const a = r(R, 150, 200), h = r(R, 120, 190), p1 = r(R, 3, 5), p2 = p1 + r(R, 2, 4);
    const off: Fig = { segs: [{ id: 'ab', a: [-a, 0], b: [a, 0] }, { id: 'pa', a: [0, h], b: [-a, 0], ticks: 1, col: 'faint' }, { id: 'pb', a: [0, h], b: [a, 0], ticks: 1, col: 'faint' }], angles: [], points: [{ at: [-a, 0], name: 'A', dir: 180 }, { at: [a, 0], name: 'B', dir: 0 }, { at: [0, h], name: 'P', dir: 90 }], pad: 80 };
    const mid = onLine(['A', 'P', 'B'], [0, a, 2 * a], { ticks: [1, 1] });
    const s = 2 * a / (p1 + p2);
    const uneq = onLine(['A', 'P', 'B'], [0, p1 * s, (p1 + p2) * s], { texts: [String(p1), String(p2)] });
    claim = 'If PA = PB, then P is the midpoint of A̅B̅.'; hyp = 'PA = PB';
    cells = [{ fig: off, kind: 'cx' }, { fig: mid, kind: 'holds' }, { fig: uneq, kind: 'premise' }];
  } else if (v === 2) {
    const m = r(R, 30, 60), m2 = m + r(R, 12, 30);
    const X = crossing(r(R, 50, 70), r(R, -10, 10), ['A', 'B', 'C', 'D', 'E'], { cols: { 1: 'second', 3: 'second' } });
    X.fig.angles = X.fig.angles.filter(a => a.id === 'a1' || a.id === 'a3').map(a => ({ ...a, text: '', nameOnly: false, arcs: 1 }));
    X.fig.points = [];
    claim = 'If two angles are congruent, then they are vertical angles.'; hyp = 'congruent';
    cells = [{ fig: sepAngles(R, m, m, `${m}°`, `${m}°`), kind: 'cx' }, { fig: X.fig, kind: 'holds' }, { fig: sepAngles(R, m, m2, `${m}°`, `${m2}°`), kind: 'premise' }];
  } else {
    const m = r(R, 25, 40), x = r(R, 30, 40), y = r(R, 30, 45);
    const F = fan('', [{ name: '', deg: 0 }, { name: '', deg: m }, { name: '', deg: 90 }]); F.fig.points = [];
    F.fig.angles = [{ id: 'x', v: [0, 0], p: [100, 0], q: at([0, 0], m, 100), text: `${m}°`, r: 56 }, { id: 'y', v: [0, 0], p: at([0, 0], m, 100), q: [0, 100], text: `${90 - m}°`, r: 56 }];
    claim = 'If two angles are complementary, then they are adjacent.'; hyp = 'complementary';
    cells = [{ fig: sepAngles(R, m, 90 - m, `${m}°`, `${90 - m}°`), kind: 'cx' }, { fig: F.fig, kind: 'holds' }, { fig: sepAngles(R, x, y, `${x}°`, `${y}°`), kind: 'premise' }];
  }
  const order = shuffle(R, cells.slice()), tags = ['A', 'B', 'C'];
  return choiceItem(R, {
    id: `pickCounter-${n}`, family: 'pickCounter', prompt: `Claim: ${q(claim)} Which figure is a <b>counterexample</b>?`, board: `${claim} ${order.map(c => c.fig.angles.map(a => a.text ?? '').join('') + c.fig.segs.length).join('|')}`,
    solution: ['A counterexample meets the hypothesis and fails the conclusion.', `It must be ${hyp}, and the conclusion must be false for it.`],
    picture: { gallery: { figs: order.map(c => c.fig), caps: tags.map(t => `figure ${t}`), tags }, reveal: { cell: order.findIndex(c => c.kind === 'cx') } },
  }, order.map((c, i) => ({
    t: `Figure ${tags[i]}`, ok: c.kind === 'cx',
    mc: c.kind === 'holds' ? MC.cxHolds : c.kind === 'premise' ? MC.cxPremise : undefined,
    say: c.kind === 'cx' ? 'Right: it meets the hypothesis, and the conclusion is false for it.' : c.kind === 'holds' ? 'The claim holds for that figure: hypothesis and conclusion are both true.' : `That figure is not ${hyp}, so it does not test the claim.`,
  })), true);
});
export const afterCounter: Gen = (R, n) => {
  const nm = pick(R, NAMES), claim = pick(R, ['If two angles are supplementary, then they form a linear pair.', 'If two angles are congruent, then they are vertical angles.', 'If PA = PB, then P is the midpoint of A̅B̅.', 'If two angles are complementary, then they are adjacent.']);
  const k = r(R, 5, 30);
  if (R() < 0.6) return choiceItem(R, {
    id: `afterCounter-${n}`, family: 'afterCounter', prompt: `Claim: ${q(claim)} It worked in ${k} drawings. Then ${nm} found <b>one</b> figure that meets the hypothesis but not the conclusion. What can ${nm} say?`, board: claim,
    solution: ['An if-then claim promises the conclusion for every figure with the hypothesis.', 'One figure that breaks the promise is enough: the claim is false.'],
    picture: { card: { lines: [`Claim: ${claim}`, `${k} drawings fit; one breaks it.`] } },
  }, [
    { t: 'The claim is false: one counterexample is enough', ok: true, say: 'Right: a general claim allows no exceptions.' },
    { t: `The claim is still true, with one exception`, mc: MC.cxException, say: 'A general claim with an exception is a false claim.' },
    { t: `${k} drawings fit, so the claim is mostly proved`, mc: MC.examples, say: 'Examples never prove it, and this counterexample disproves it.' },
    { t: 'Nothing yet: she needs a few more counterexamples', say: 'One is enough.' },
  ]);
  return choiceItem(R, {
    id: `afterCounter-${n}`, family: 'afterCounter', prompt: `Claim: ${q(claim)} ${nm} found a figure where the hypothesis is false and the conclusion is false. What does that figure show?`, board: claim,
    solution: ['A counterexample must meet the hypothesis.', 'With a false hypothesis the claim promises nothing, so the figure tests nothing.'],
    picture: { card: { lines: [`Claim: ${claim}`, 'Hypothesis false, conclusion false.'] } },
  }, [
    { t: 'Nothing about the claim: it does not meet the hypothesis', ok: true, say: 'Right: the claim makes no promise about that figure.' },
    { t: 'The claim is false', mc: MC.cxPremise, say: 'A counterexample has to meet the hypothesis; this one does not.' },
    { t: 'The claim is proved', mc: MC.examples, say: 'A figure outside the hypothesis says nothing either way.' },
  ]);
};

// ======================= 29-31 parallel lines =======================
const NAMES6: PairName[] = ['corresponding', 'alternate interior', 'alternate exterior', 'consecutive interior', 'vertical', 'linear pair'];
const pairWord = (p: PairName) => (p === 'vertical' ? 'vertical angles' : p === 'linear pair' ? 'a linear pair' : `${p} angles`);
function namedPairs(): [number, number, PairName][] {
  const out: [number, number, PairName][] = [];
  for (let a = 1; a <= 8; a++) for (let b = a + 1; b <= 8; b++) { const p = pairName(a, b); if (p) out.push([a, b, p]); }
  return out;
}
const THETA = (R: () => number) => (R() < 0.5 ? r(R, 50, 76) : r(R, 104, 130));
export const pairName_: Gen = (R, n) => fitted('pairName', () => {
  const [a, b, p] = pick(R, namedPairs().filter(x => R() < 0.5 || (x[2] !== 'linear pair' && x[2] !== 'vertical')));
  const fig = transversal({ theta: THETA(R), marks: R() < 0.5, cols: { [a]: 'pick', [b]: 'pick' }, texts: { [a]: String(a), [b]: String(b) }, turn: r(R, -8, 8) });
  const others = shuffle(R, NAMES6.filter(x => x !== p)).slice(0, 3);
  return choiceItem(R, {
    id: `pairName-${n}`, family: 'pairName', prompt: `What kind of pair are ∠${a} and ∠${b}?`, board: `\\angle ${a}, \\angle ${b}`,
    solution: [a <= 4 && b >= 5 ? `∠${a} is at line ℓ, ∠${b} at line m.` : 'Both angles are at the same crossing.', `They are ${pairWord(p)}.`],
    picture: { fig },
  }, [p, ...others].map(x => ({ t: pairWord(x), ok: x === p, mc: x === p ? undefined : MC.wrongPair, say: x === p ? 'Right.' : `Look at where each angle sits: same crossing or not, between the lines or outside, same side of t or not. They are ${pairWord(p)}.` })));
});
export const notParallel: Gen = (R, n) => fitted('notParallel', () => {
  const par = R() < 0.3, th = THETA(R), dl = par ? 0 : pick(R, [-12, -10, -8, 8, 10, 12]);
  const [a, b, p] = pick(R, namedPairs().filter(x => x[0] <= 4 && x[1] >= 5));
  const ma = slotMeasure(a, th, dl);
  const eq = p !== 'consecutive interior', truth = eq ? ma : 180 - ma;
  const fig = transversal({ theta: th, delta: dl, marks: par, numbers: false, only: [a, b], texts: { [a]: `${ma}°`, [b]: '?' }, cols: { [a]: 'second', [b]: 'link' }, alts: par ? { [b]: `${truth}°` } : undefined, turn: r(R, -6, 6) });
  const cant = 'Can’t tell: ℓ and m are not marked parallel';
  return choiceItem(R, {
    id: `notParallel-${n}`, family: 'notParallel', prompt: `m∠${a} = ${ma}°. ${par ? 'The chevrons mark ℓ ∥ m. ' : ''}What is m∠${b}?`, board: `m\\angle ${a} = ${ma}`,
    solution: par ? [`∠${a} and ∠${b} are ${pairWord(p)}, and ℓ ∥ m.`, `So m∠${b} = ${eq ? `${ma}°` : `180° − ${ma}° = ${truth}°`}.`] : [`∠${a} and ∠${b} are ${pairWord(p)}, but nothing says ℓ ∥ m.`, 'The parallel-line theorems need parallel lines, so m∠' + b + ' cannot be found.'],
    picture: { fig, reveal: par ? { solved: ['a' + b] } : {} },
  }, [
    { t: `${ma}°`, ok: par && eq, mc: par ? (eq ? undefined : MC.suppEqual) : MC.parNoPar, say: par && eq ? 'Right: with ℓ ∥ m, these angles are congruent.' : par ? `With ℓ ∥ m, ${pairWord(p)} add to 180°.` : 'That rule needs ℓ ∥ m, and the lines are not marked parallel.' },
    { t: `${180 - ma}°`, ok: par && !eq, mc: par ? (eq ? MC.congAsSupp : undefined) : MC.parNoPar, say: par && !eq ? 'Right: consecutive interior angles of parallel lines add to 180°.' : par ? `With ℓ ∥ m, ${pairWord(p)} are congruent.` : 'That rule needs ℓ ∥ m, and the lines are not marked parallel.' },
    { t: cant, ok: !par, say: par ? 'The chevrons do mark ℓ ∥ m, so the theorem applies.' : 'Right: without ℓ ∥ m there is no rule that links the two crossings.' },
  ], true);
});
export const isParallel: Gen = (R, n) => fitted('isParallel', () => {
  const th = THETA(R), v = r(R, 0, 4);
  let a: number, b: number, dl = 0, verdict: 'yes' | 'no' | 'cant', why: string;
  if (v === 0) { [a, b] = pick(R, [[3, 6], [4, 5]]); verdict = 'yes'; why = 'Alternate interior angles are congruent, so by the converse of the Alternate Interior Angles Theorem, ℓ ∥ m.'; }
  else if (v === 1) { [a, b] = pick(R, [[1, 5], [2, 6], [3, 7], [4, 8]]); verdict = 'yes'; why = 'Corresponding angles are congruent, so by the converse of the Corresponding Angles Postulate, ℓ ∥ m.'; }
  else if (v === 2) { [a, b] = pick(R, [[3, 5], [4, 6]]); verdict = 'yes'; why = 'Consecutive interior angles add to 180°, so by the converse of the Consecutive Interior Angles Theorem, ℓ ∥ m.'; }
  else if (v === 3) { [a, b] = pick(R, [[1, 5], [2, 6], [3, 6], [4, 5]]); dl = pick(R, [-9, -7, -5, 5, 7, 9]); verdict = 'no'; why = 'If ℓ ∥ m these angles would be congruent; they are not, so ℓ and m are not parallel.'; }
  else { [a, b] = pick(R, [[1, 4], [2, 3], [5, 8], [6, 7]]); dl = pick(R, [0, -6, 6]); verdict = 'cant'; why = 'Vertical angles are always congruent, whatever the lines do: they say nothing about ℓ and m.'; }
  const ma = slotMeasure(a, th, dl), mb = slotMeasure(b, th, dl);
  const fig = transversal({ theta: th, delta: dl, numbers: false, only: [a, b], texts: { [a]: `${ma}°`, [b]: `${mb}°` }, cols: { [a]: 'second', [b]: 'second' }, turn: r(R, -6, 6) });
  return choiceItem(R, {
    id: `isParallel-${n}`, family: 'isParallel', prompt: `m∠${a} = ${ma}° and m∠${b} = ${mb}°. Are ℓ and m parallel?`, board: `${ma}, ${mb}`,
    solution: [why],
    picture: { fig },
  }, [
    { t: 'Yes: ℓ ∥ m', ok: verdict === 'yes', mc: verdict === 'cant' ? MC.anyPair : undefined, say: verdict === 'yes' ? `Right. ${why}` : why },
    { t: 'No: ℓ and m are not parallel', ok: verdict === 'no', mc: verdict === 'yes' && v === 2 ? MC.suppEqual : undefined, say: verdict === 'no' ? `Right. ${why}` : why },
    { t: 'Can’t tell from these two angles', ok: verdict === 'cant', say: verdict === 'cant' ? `Right. ${why}` : why },
  ], true);
});
const THMS = [
  { name: 'Alternate Interior Angles Theorem', h: 'two parallel lines are cut by a transversal', c: 'alternate interior angles are congruent', conv: 'If two lines are cut by a transversal so that alternate interior angles are congruent, then the lines are parallel.', inv: 'If two lines are not parallel, then alternate interior angles are not congruent.' },
  { name: 'Corresponding Angles Postulate', h: 'two parallel lines are cut by a transversal', c: 'corresponding angles are congruent', conv: 'If two lines are cut by a transversal so that corresponding angles are congruent, then the lines are parallel.', inv: 'If two lines are not parallel, then corresponding angles are not congruent.' },
  { name: 'Consecutive Interior Angles Theorem', h: 'two parallel lines are cut by a transversal', c: 'consecutive interior angles are supplementary', conv: 'If two lines are cut by a transversal so that consecutive interior angles are supplementary, then the lines are parallel.', inv: 'If two lines are not parallel, then consecutive interior angles are not supplementary.' },
  { name: 'Alternate Exterior Angles Theorem', h: 'two parallel lines are cut by a transversal', c: 'alternate exterior angles are congruent', conv: 'If two lines are cut by a transversal so that alternate exterior angles are congruent, then the lines are parallel.', inv: 'If two lines are not parallel, then alternate exterior angles are not congruent.' },
];
export const converseOf: Gen = (R, n) => {
  const T = pick(R, THMS), [l1, l2] = pick(R, [['ℓ', 'm'], ['p', 'q'], ['j', 'k'], ['r', 's']]) as [string, string];
  if (R() < 0.5) return choiceItem(R, {
    id: `converseOf-${n}`, family: 'converseOf', prompt: `${T.name}: ${q(`If ${T.h}, then ${T.c}.`)} Which statement is its <b>converse</b>?`, board: `${T.name} ${l1}`,
    solution: ['The converse swaps hypothesis and conclusion.', 'The theorem assumes parallel lines and concludes an angle fact; the converse assumes the angle fact and concludes parallel lines.'],
    picture: { card: { lines: [`If ${A(T.h)},`, `then ${B(T.c)}.`] } },
  }, [
    { t: T.conv, ok: true, say: 'Right: the angle fact is now the hypothesis.' },
    { t: `If ${T.h}, then ${T.c}.`, say: 'That is the theorem itself.' },
    { t: T.inv, say: 'That negates both parts (the inverse); the converse swaps them.' },
  ]);
  const short = T.c.replace(' are congruent', '').replace(' are supplementary', '');
  return choiceItem(R, {
    id: `converseOf-${n}`, family: 'converseOf', prompt: `In a figure, lines ${l1} and ${l2} are cut by a transversal, and ${short} are ${T.c.includes('supplementary') ? 'supplementary' : 'congruent'}. Which statement lets you conclude that ${l1} ∥ ${l2}?`, board: T.name,
    solution: ['To conclude parallel lines you need a statement whose conclusion is “the lines are parallel”.', `That is the converse of the ${T.name}.`],
    picture: { card: { lines: [`${short}: ${T.c.includes('supplementary') ? 'supplementary' : 'congruent'}`, `so ${l1} ∥ ${l2} because ...`] } },
  }, [
    { t: `The converse of the ${T.name}`, ok: true, say: 'Right: its conclusion is “the lines are parallel”.' },
    { t: `The ${T.name}`, mc: MC.converse, say: 'That one assumes parallel lines; using it to conclude them runs it backward.' },
    { t: 'The Vertical Angles Theorem', mc: MC.anyPair, say: 'Vertical angles are congruent for any lines; they say nothing about parallel lines.' },
  ]);
};
export const angleChain: Gen = (R, n) => fitted('angleChain', () => {
  const th = THETA(R), g = r(R, 1, 8);
  let k = r(R, 1, 8);
  while (k === g || (g <= 4) === (k <= 4)) k = r(R, 1, 8);
  const mg = slotMeasure(g, th), mk = slotMeasure(k, th);
  const fig = transversal({ theta: th, marks: true, numbers: true, texts: { [g]: `${mg}°`, [k]: '?' }, alts: { [k]: `${mk}°` }, cols: { [g]: 'second', [k]: 'link' }, turn: r(R, -6, 6) });
  // the chain: g -> its corresponding angle c at k's crossing -> k (vertical / linear pair / itself)
  const c = g <= 4 ? g + 4 : g - 4, mc = mg;
  const step2 = c === k ? null : (pairName(c, k) as PairName);
  return numItem({
    id: `angleChain-${n}`, family: 'angleChain', prompt: `ℓ ∥ m and m∠${g} = ${mg}°. Find m∠${k}. Name each relationship you use.`, board: `m\\angle ${g} = ${mg}`, unit: 'degrees',
    solution: [`∠${g} and ∠${c} are corresponding angles, and ℓ ∥ m: m∠${c} = ${mc}°.`, ...(step2 ? [`∠${c} and ∠${k} are ${pairWord(step2)}: m∠${k} = ${step2 === 'vertical' ? `${mc}°` : `180° − ${mc}° = ${mk}°`}.`] : []), `m∠${k} = ${ans(mk)}°`],
    picture: { fig, reveal: { solved: ['a' + k] } },
  }, mk, mk === mg ? [{ v: 180 - mg, mc: MC.congAsSupp, say: `∠${g} and ∠${k} are congruent here (${pairWord(pairName(g, k) ?? 'corresponding')}), not supplementary.` }] : [{ v: mg, mc: MC.suppEqual, say: `∠${g} and ∠${k} add to 180° here; they are not equal.` }], 'Right.', 'Go from the given angle to its corresponding angle, then across the crossing.');
});
export const algebraPar: Gen = (R, n, sg) => fitted('algebraPar', () => {
  const conv = sg === 'parallel-converses';
  for (;;) {
    const th = THETA(R);
    const [a, b, p] = pick(R, namedPairs().filter(x => x[0] <= 4 && x[1] >= 5 && x[2] !== null));
    const ma = slotMeasure(a, th), mb = slotMeasure(b, th);
    const x = r(R, 5, 30), pa = r(R, 2, 6), pb = r(R, 1, 5);
    if (pa === pb) continue;
    const ca = ma - pa * x, cb = mb - pb * x;
    if (Math.abs(ca) > 45 || Math.abs(cb) > 45 || ca === 0 || cb === 0) continue;
    const ex = (k: number, c: number) => `(${k === 1 ? '' : k}x ${c < 0 ? '−' : '+'} ${Math.abs(c)})°`;
    const sup = p === 'consecutive interior';
    const askX = conv || R() < 0.45;
    const fig = transversal({ theta: th, marks: !conv, numbers: false, only: [a, b], texts: { [a]: ex(pa, ca), [b]: ex(pb, cb) }, cols: { [a]: 'second', [b]: 'second' }, turn: r(R, -6, 6) });
    // the slip: the other relation (equal <-> supplementary)
    const xs = sup ? (cb - ca) / (pa - pb) : (180 - ca - cb) / (pa + pb);
    const slip = Number.isInteger(xs) && xs > 0 ? (askX ? xs : pa * xs + ca) : NaN;
    const eqn = sup ? `${ex(pa, ca)} + ${ex(pb, cb)} = 180°` : `${ex(pa, ca)} = ${ex(pb, cb)}`;
    return numItem({
      id: `algebraPar-${n}`, family: 'algebraPar',
      prompt: conv ? `Find <i>x</i> so that ℓ ∥ m. m∠${a} = ${ex(pa, ca)} and m∠${b} = ${ex(pb, cb)}.` : `ℓ ∥ m. m∠${a} = ${ex(pa, ca)} and m∠${b} = ${ex(pb, cb)}. Find ${askX ? '<i>x</i>' : `m∠${a}`}.`,
      board: eqn.replace(/°/g, '^\\circ').replace(/−/g, '-'), unit: askX ? '' : 'degrees',
      solution: [`∠${a} and ∠${b} are ${pairWord(p)}: ${conv ? 'ℓ ∥ m exactly when' : 'with ℓ ∥ m'} they are ${sup ? 'supplementary' : 'congruent'}.`, `${eqn}, so x = ${x}.`, askX ? `x = ${ans(x)}` : `m∠${a} = ${pa}·${x} ${ca < 0 ? '−' : '+'} ${Math.abs(ca)} = ${ans(ma)}°`],
      picture: { fig },
    }, askX ? x : ma, [
      ...(askX ? [] : [{ v: x, mc: MC.reportsX, say: `x = ${x}; put it back in to get m∠${a}.` }]),
      ...(Number.isFinite(slip) ? [{ v: slip, mc: sup ? MC.suppEqual : MC.congAsSupp, say: sup ? 'Consecutive interior angles add to 180°; they are not equal.' : `${pairWord(p)} are congruent; they do not add to 180°.` }] : []),
    ], 'Right.', `${pairWord(p).charAt(0).toUpperCase() + pairWord(p).slice(1)} are ${sup ? 'supplementary' : 'congruent'} when ℓ ∥ m: write the equation.`);
  }
});
export { pairName_ as pairNameFam };
export type { Base, GFItem };
void onLine; void segN; void TYPE_OF;
