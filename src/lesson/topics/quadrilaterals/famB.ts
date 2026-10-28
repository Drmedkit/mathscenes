// famB.ts: stage 2 of "Parallelograms and other quadrilaterals": part-whole arithmetic, opposite / consecutive parts,
// the parallelogram's sides and angles, polygon angle sums and regular polygons, the diagonals (vocabulary, the
// class-by-class conjecture table, bisection, rectangle and rhombus diagonals, vertex-angle bisection, angle chases),
// classify-then-compute, and property-to-equation. Every labelled length is drawn at its size (one scale per figure)
// and every labelled angle at its measure; an expression label is drawn at the value x gives it.
import type { Fig, MarkCol, Pt } from '../geometry-foundations/geo';
import { add, dirv, dist, lerpP, meet, measure, mul, sub } from '../geometry-foundations/geo';
import { buildFig } from '../triangle-congruence/tri';
import { type Q4, type QK, NAME, ART, convex, diagMeet, makeQ, paraPts, polyAngles, polyName, polyWithAngles, qfig, regularPts, ri, turnQ, kitePts } from './quad';
import type { QMark } from './quad';
import { type Gen, type NumWrong, type Opt, MC, albl, arc, box, choice, choiceT, fitted, fmt, lbl, linT, mA, numT, pick, relabel, shuffle, tick } from './qkit';
import { par } from './quad';

const ROLES = 'ABCDE';
const UNITS = ['in.', 'ft', 'cm'] as const;
const S = (s: string | number) => `<b class="s">${s}</b>`;
/** give a segment a label (and the label after the solve) */
export function setSeg(f: Fig, id: string, text: string, alt?: string, col?: MarkCol): Fig {
  const s = f.segs.find(x => x.id === id || x.id === id[1]! + id[0]!);
  if (!s) throw new Error(`no segment ${id}`);
  s.text = text; if (alt !== undefined) s.alt = alt; if (col) s.col = col;
  return f;
}
export function setAng(f: Fig, id: string, alt: string, col?: MarkCol): Fig {
  const a = f.angles.find(x => x.id === id);
  if (!a) throw new Error(`no angle ${id}`);
  a.alt = alt; if (col) a.col = col;
  return f;
}
/** a whole number to halve: even, odd (half ends in .5) or tenths with an even tenths digit (never .5 or odd tenths) */
function halvable(R: () => number, lo = 8, hi = 60): number {
  const v = ri(R, 0, 2);
  if (v === 0) return 2 * ri(R, lo / 2, hi / 2);
  if (v === 1) return 2 * ri(R, lo / 2, hi / 2) + 1;
  return ri(R, lo, hi - 1) + 0.2 * ri(R, 1, 4);
}
const tex = (s: string) => s.replace(/−/g, '-');

// ---------- measure-part-whole ----------
/** convex quadrilateral with exact side lengths a, b, c, d and diagonal e = AC (model units) */
export function quadFromSides(a: number, b: number, c: number, d: number, e: number): Q4 | null {
  // A = (0,0), C = (e,0); B below with AB = a, CB = b; D above with AD = d, CD = c
  const xb = (a * a - b * b + e * e) / (2 * e), yb2 = a * a - xb * xb;
  const xd = (d * d - c * c + e * e) / (2 * e), yd2 = d * d - xd * xd;
  if (yb2 <= 0 || yd2 <= 0) return null;
  const Q: Q4 = [[0, 0], [xb, -Math.sqrt(yb2)], [e, 0], [xd, Math.sqrt(yd2)]];
  return convex(Q) ? Q : null;
}
export const partWhole: Gen = (R, n) => fitted('partWhole', () => {
  const v = pick(R, ['sum', 'diff', 'half', 'double', 'angSum', 'angHalf', 'perim'] as const);
  const u = pick(R, UNITS);
  const t = relabel(R, ROLES);
  if (v === 'angSum' || v === 'angHalf') {
    const W = ri(R, 70, 128), p = v === 'angHalf' ? W / 2 : ri(R, 24, W - 24);
    const A: Pt = [0, 0], B = mul(dirv(0), 380), D = mul(dirv(W), 320);
    const X = meet(A, dirv(p), B, sub(D, B)), C = mul(X, 1.3 + R() * 0.2);
    const Q = turnQ([A, B, C, D] as Q4, ri(R, 0, 359));
    const askWhole = v === 'angSum' ? R() < 0.5 : R() < 0.4;
    const marks: QMark[] = v === 'angHalf' ? [arc('DAC', 1), { ang: 'CAB', n: 1, text: askWhole ? `${fmt(W / 2)}°` : '?' }] : [];
    if (v === 'angSum') { if (askWhole) marks.push(albl('DAC', `${W - p}°`), albl('CAB', `${p}°`)); else marks.push(albl('CAB', `${p}°`)); }
    const f = qfig(Q, marks, { diags: 'AC' });
    if (v === 'angHalf' && !askWhole) setAng(f, 'CAB', `${fmt(W / 2)}°`, 'link');
    const ans = v === 'angSum' ? (askWhole ? W : W - p) : askWhole ? W : W / 2;
    const prompt = v === 'angSum'
      ? (askWhole ? `Diagonal ${'AC'} splits ∠DAB into ∠DAC and ∠CAB. What is ${mA('DAB')}?` : `Diagonal AC splits ∠DAB into ∠DAC and ∠CAB, and ${mA('DAB')} = ${W}°. What is ${mA('DAC')}?`)
      : (askWhole ? `Diagonal AC splits ∠DAB into two parts with equal measures, and ${mA('CAB')} = ${fmt(W / 2)}°. What is ${mA('DAB')}?` : `Diagonal AC splits ∠DAB into two parts with equal measures, and ${mA('DAB')} = ${W}°. What is ${mA('CAB')}?`);
    const wrong: NumWrong[] = v === 'angSum'
      ? (askWhole ? [{ v: W - p - p, say: 'The whole is the SUM of its parts.' }] : [{ v: W + p, mc: MC.addsPart, say: `${mA('CAB')} is part of ∠DAB: subtract it from the whole.` }])
      : askWhole ? [{ v: W / 4, mc: MC.partWhole, say: 'The whole is TWICE one of its two equal parts.' }] : [{ v: W * 2, mc: MC.partWhole, say: 'Each equal part is HALF of the whole.' }, ...(W % 2 ? [{ v: Math.floor(W / 2) + 0.1, mc: MC.remainder, say: `Half of ${W} is ${Math.floor(W / 2)} and a half: ${fmt(W / 2)}, not a remainder written after the point.` }] : [])];
    return numT(t, {
      id: `partWhole-${n}`, family: 'partWhole', prompt, board: v === 'angSum' ? 'm\\angle DAC + m\\angle CAB = m\\angle DAB' : 'm\\angle DAC = m\\angle CAB', unit: '°',
      solution: [v === 'angSum' ? 'The two parts add up to the whole angle.' : 'The two equal parts add up to the whole: whole = 2 × part.', `So it is ${S(fmt(ans) + '°')}.`],
      picture: { fig: f, reveal: { solved: ['CAB'] } },
    }, ans, wrong, 'Right: part plus part is the whole.', 'Write the whole as the sum of its parts.');
  }
  if (v === 'perim') {
    for (let k = 0; k < 40; k++) {
      const s4 = [ri(R, 8, 30), ri(R, 8, 30), ri(R, 8, 30), ri(R, 8, 30)], e = ri(R, 12, 40);
      const mx = Math.max(...s4, e), sc = 420 / mx;
      const Q = quadFromSides(s4[0]! * sc, s4[1]! * sc, s4[2]! * sc, s4[3]! * sc, e * sc);
      if (!Q || new Set(s4).size < 4) continue;
      const P = s4.reduce((a, b) => a + b, 0), ask = ri(R, -1, 3);   // -1: the perimeter, else a missing side
      const ids = ['AB', 'BC', 'DC', 'AD'], vals = [s4[0]!, s4[1]!, s4[2]!, s4[3]!];
      const f = qfig(turnQ(Q, ri(R, 0, 359)), ids.map((id, i) => (i === ask ? lbl(id, '?') : lbl(id, `${vals[i]} ${u}`))));
      if (ask >= 0) setSeg(f, ids[ask]!, '?', `${vals[ask]} ${u}`, 'link');
      const ans = ask < 0 ? P : vals[ask]!;
      return numT(t, {
        id: `partWhole-${n}`, family: 'partWhole', prompt: ask < 0 ? 'What is the perimeter of quadrilateral ABCD?' : `The perimeter of quadrilateral ABCD is ${P} ${u}. How long is the side marked “?”`, board: 'P = AB + BC + CD + DA', unit: u,
        solution: ask < 0 ? [`Add the four sides: ${vals.join(' + ')}.`, `P = ${S(String(P) + ' ' + u)}.`] : [`The four sides add up to ${P}.`, `${P} − ${vals.filter((_, i) => i !== ask).join(' − ')} = ${S(String(ans) + ' ' + u)}.`],
        picture: { fig: f, reveal: { solved: ask >= 0 ? [ids[ask]!] : [] } },
      }, ans, ask < 0 ? [{ v: P / 2, say: 'The perimeter goes all the way around: all four sides.' }] : [{ v: P + vals.filter((_, i) => i !== ask).reduce((a, b) => a + b, 0), mc: MC.addsPart, say: 'The sides you know are parts of the perimeter: subtract them.' }], 'Right.', 'The perimeter is the sum of all four sides.');
    }
    throw new Error('no quadrilateral');
  }
  // a point E on diagonal AC
  const Q = makeQ(R, 'quad', { turn: ri(R, 0, 359) });
  const half = v === 'half' || v === 'double';
  let AE: number, EC: number;
  if (half) { const W = halvable(R); AE = W / 2; EC = W / 2; }
  else { AE = ri(R, 6, 40) + (R() < 0.3 ? 0.5 : 0); EC = ri(R, 6, 40); if (Math.max(AE, EC) / Math.min(AE, EC) > 2.2) { EC = Math.round(AE * 1.4); } }
  const AC = AE + EC, E = lerpP(Q[0], Q[2], AE / AC);
  const askWhole = v === 'sum' || v === 'double';
  const marks: QMark[] = half ? [tick('AE', 1), tick('EC', 1)] : [];
  if (v === 'sum') marks.push(lbl('AE', `${fmt(AE)} ${u}`), lbl('EC', `${fmt(EC)} ${u}`));
  if (v === 'diff') marks.push(lbl('AE', `${fmt(AE)} ${u}`), lbl('EC', '?'));
  if (v === 'double') marks.push(lbl('AE', `${fmt(AE)} ${u}`));
  if (v === 'half') marks.push(lbl('AE', '?'));
  const f = qfig(Q, marks, { extraPts: { E }, extraSegs: ['AE', 'EC'] });
  if (v === 'diff') setSeg(f, 'EC', '?', `${fmt(EC)} ${u}`, 'link');
  if (v === 'half') setSeg(f, 'AE', '?', `${fmt(AE)} ${u}`, 'link');
  const ans = askWhole ? AC : v === 'diff' ? EC : AE;
  const prompt = v === 'sum' ? 'E is on diagonal AC. How long is AC?'
    : v === 'diff' ? `E is on diagonal AC, and AC = ${fmt(AC)} ${u}. How long is ${'EC'}?`
      : v === 'double' ? 'E is on diagonal AC, and the two parts AE and EC have equal lengths. How long is AC?'
        : `E is on diagonal AC, the two parts AE and EC have equal lengths, and AC = ${fmt(AC)} ${u}. How long is AE?`;
  const wrong: NumWrong[] = v === 'sum' ? [{ v: Math.abs(AE - EC), say: 'AC is the whole: add the parts.' }]
    : v === 'diff' ? [{ v: AC + AE, mc: MC.addsPart, say: 'AE is part of AC: subtract it from the whole.' }]
      : v === 'double' ? [{ v: AE / 2, mc: MC.partWhole, say: 'AC is the WHOLE: twice one equal part.' }]
        : [{ v: AC * 2, mc: MC.partWhole, say: 'AE is one of two equal parts: half the whole.' }, ...(Math.abs(AC - Math.round(AC)) < 1e-9 && AC % 2 === 1 ? [{ v: Math.floor(AC / 2) + 0.1, mc: MC.remainder, say: `Half of ${AC} is ${fmt(AC / 2)}: the leftover 1 is half of 1, so .5.` }] : [])];
  return numT(t, {
    id: `partWhole-${n}`, family: 'partWhole', prompt, board: half ? 'AE = EC,\\ AE + EC = AC' : 'AE + EC = AC', unit: u,
    solution: [half ? 'The two equal parts add up to the whole: AC = 2 · AE.' : 'The parts add up to the whole: AE + EC = AC.', `So it is ${S(fmt(ans) + ' ' + u)}.`],
    picture: { fig: f, reveal: { solved: v === 'diff' ? ['EC'] : v === 'half' ? ['AE'] : [] } },
  }, ans, wrong, 'Right.', 'Write the whole as the sum of its parts.');
});

// ---------- opposite-consecutive ----------
export const oppCons: Gen = (R, n) => fitted('oppCons', () => {
  const k = pick(R, ['para', 'quad', 'trap', 'kite'] as QK[]);
  const Q = makeQ(R, k, { turn: ri(R, 60, 300) });
  const sides = ['AB', 'BC', 'CD', 'DA'], angles = ['A', 'B', 'C', 'D'];
  const isSide = R() < 0.5, i = ri(R, 0, 3), wantOpp = R() < 0.6;
  const list = isSide ? sides : angles;
  const opp = list[(i + 2) % 4]!, cons = [list[(i + 1) % 4]!, list[(i + 3) % 4]!];
  const fmtX = (x: string) => (isSide ? x.split('').map(ch => ch + '̅').join('') : `∠${x}`);
  const both = (x: string, y: string) => `${fmtX(x)} and ${fmtX(y)}`;
  const opts: Opt[] = wantOpp
    ? [{ t: fmtX(opp), ok: true, say: 'Right: it shares no vertex with it.' }, ...cons.map(c => ({ t: fmtX(c), mc: MC.oppCons, say: `${fmtX(c)} shares a vertex with it: that is consecutive.` }))]
    : [{ t: both(cons[0]!, cons[1]!), ok: true, say: 'Right: consecutive parts come next to it in the order A, B, C, D.' }, { t: both(cons[0]!, opp), mc: MC.oppCons, say: `${fmtX(opp)} is opposite: it shares no vertex.` }, { t: both(opp, cons[1]!), mc: MC.oppCons, say: `${fmtX(opp)} is opposite: it shares no vertex.` }];
  // a not-a-side distractor
  if (isSide) opts.push({ t: fmtX(i % 2 ? 'BD' : 'AC'), mc: MC.pagePos, say: 'That is a diagonal, not a side.' });
  const t = relabel(R, ROLES);
  const name = isSide ? fmtX(list[i]!) : `∠${list[i]}`;
  const right = wantOpp ? fmtX(opp) : both(cons[0]!, cons[1]!);
  return choiceT(R, t, {
    id: `oppCons-${n}`, family: 'oppCons', prompt: wantOpp ? `In quadrilateral ABCD (the letters go around in order), which ${isSide ? 'side' : 'angle'} is opposite ${name}?` : `In quadrilateral ABCD (the letters go around in order), which two ${isSide ? 'sides' : 'angles'} are consecutive to ${name}?`, board: '\\text{opposite or consecutive?}',
    solution: [`Go around A, B, C, D. Opposite ${isSide ? 'sides' : 'angles'} share no vertex; consecutive ones are next to each other.`, `So: ${right}.`],
    picture: { fig: qfig(Q, []), reveal: {} },
  }, opts.filter((o, j, a) => a.findIndex(x => x.t === o.t) === j));
});

// ---------- parallelogram sides and angles ----------
function paraNum(R: () => number, k: 'para' | 'rect' | 'rhombus', a: number, b: number, deg: number): Q4 {
  const sc = 420 / Math.max(a, b);
  return turnQ(paraPts(a * sc, (k === 'rhombus' ? a : b) * sc, k === 'rect' ? 90 : deg), ri(R, 0, 359));
}
const PMARKS: QMark[] = [par('AB', 1), par('DC', 1), par('AD', 2), par('BC', 2)];
export const oppSide: Gen = (R, n) => fitted('oppSide', () => {
  const u = pick(R, UNITS), a = ri(R, 9, 30) + (R() < 0.25 ? 0.5 : 0), b = ri(R, 6, 24);
  if (Math.abs(a - b) < 3) throw new Error('too close');
  const Q = paraNum(R, 'para', a, b, ri(R, 56, 74));
  const askAB = R() < 0.5;
  const f = qfig(Q, [...PMARKS, lbl(askAB ? 'DC' : 'AD', askAB ? `${fmt(a)} ${u}` : `${b} ${u}`), lbl(askAB ? 'BC' : 'AB', askAB ? `${b} ${u}` : `${fmt(a)} ${u}`), lbl(askAB ? 'AB' : 'BC', '?')]);
  setSeg(f, askAB ? 'AB' : 'BC', '?', askAB ? `${fmt(a)} ${u}` : `${b} ${u}`, 'link');
  const ans = askAB ? a : b, other = askAB ? b : a;
  const t = relabel(R, ROLES);
  return numT(t, {
    id: `oppSide-${n}`, family: 'oppSide', prompt: `ABCD is a parallelogram (the arrowheads mark both pairs of parallel sides). How long is ${askAB ? 'AB' : 'BC'}?`, board: askAB ? 'AB = DC' : 'BC = AD', unit: u,
    solution: [`Opposite sides of a parallelogram are congruent: ${askAB ? 'AB = DC' : 'BC = AD'}.`, `So it is ${S(fmt(ans) + ' ' + u)}.`],
    picture: { fig: f, reveal: { solved: [askAB ? 'AB' : 'BC'] } },
  }, ans, [{ v: other, mc: MC.oppCons, say: `That side is consecutive to it. Use the OPPOSITE side.` }, { v: a + b, say: 'One side, not a sum.' }], 'Right: opposite sides are congruent.', 'Opposite sides of a parallelogram are congruent.');
});
export const perim: Gen = (R, n) => fitted('perim', () => {
  const u = pick(R, UNITS), k = pick(R, ['para', 'para', 'rect', 'rhombus'] as const);
  const a = ri(R, 8, 28), b = k === 'rhombus' ? a : ri(R, 5, 22);
  if (k !== 'rhombus' && Math.abs(a - b) < 3) throw new Error('close');
  const P = 2 * (a + b), v = k === 'rhombus' ? 'P' : pick(R, ['P', 'side', 'opp'] as const);
  const Q = paraNum(R, k, a, b, ri(R, 56, 74));
  const marks: QMark[] = k === 'rect' ? [box('DAB'), box('ABC'), box('BCD'), box('CDA')] : k === 'rhombus' ? [tick('AB', 1), tick('BC', 1), tick('DC', 1), tick('AD', 1)] : PMARKS.slice();
  if (v === 'P') marks.push(lbl('AB', `${a} ${u}`), ...(k === 'rhombus' ? [] : [lbl('BC', `${b} ${u}`)]));
  else marks.push(lbl('AB', `${a} ${u}`), lbl(v === 'side' ? 'BC' : 'DC', '?'));
  const f = qfig(Q, marks);
  if (v !== 'P') setSeg(f, v === 'side' ? 'BC' : 'DC', '?', `${v === 'side' ? b : a} ${u}`, 'link');
  const ans = v === 'P' ? P : v === 'side' ? b : a;
  const t = relabel(R, ROLES);
  const kw = k === 'para' ? 'parallelogram' : NAME[k];
  const prompt = v === 'P' ? `ABCD is a ${kw}. What is its perimeter?` : `ABCD is a ${kw} with perimeter ${P} ${u}. How long is ${v === 'side' ? 'BC' : 'DC'}?`;
  const wrong: NumWrong[] = v === 'P' ? [{ v: k === 'rhombus' ? a * 2 : a + b, say: 'The perimeter goes around all four sides.' }]
    : v === 'side' ? [{ v: P - a, mc: MC.partWhole, say: 'P counts AB twice (AB and DC): half the perimeter is AB + BC.' }, { v: P / 2, mc: MC.partWhole, say: 'Half the perimeter is AB + BC; subtract AB.' }]
      : [{ v: P / 2 - a, mc: MC.oppCons, say: `DC is OPPOSITE AB, so DC = AB.` }];
  return numT(t, {
    id: `perim-${n}`, family: 'perim', prompt, board: 'P = 2(AB + BC)', unit: u,
    solution: v === 'P' ? [`Opposite sides are congruent, so P = 2(${a} + ${b}).`, `P = ${S(String(P) + ' ' + u)}.`] : v === 'side' ? [`Half the perimeter is one side of each pair: AB + BC = ${P / 2}.`, `BC = ${P / 2} − ${a} = ${S(String(b) + ' ' + u)}.`] : [`DC is opposite AB, and opposite sides are congruent.`, `DC = ${S(String(a) + ' ' + u)} (the perimeter is not needed).`],
    picture: { fig: f, reveal: { solved: v === 'P' ? [] : [v === 'side' ? 'BC' : 'DC'] } },
  }, ans, wrong, 'Right.', 'Use opposite sides congruent: P = 2(AB + BC).');
});
/** a parallelogram with the angle at A labelled; ask another vertex angle */
function angleItem(R: () => number, n: number, fam: string, target: 'C' | 'BD' | 'any') {
  return fitted(fam, () => {
    const half = R() < 0.25, A = ri(R, 48, 132) + (half ? 0.5 : 0);
    if (Math.abs(A - 90) < 12 && !(fam === 'consAngle' && R() < 0.15)) throw new Error('near 90');
    const rect = Math.abs(A - 90) < 12;
    const Aa = rect ? 90 : A;
    const Q = paraNum(R, rect ? 'rect' : 'para', ri(R, 10, 20), ri(R, 6, 9), Aa);
    const tg = target === 'C' ? 'C' : target === 'BD' ? pick(R, ['B', 'D']) : pick(R, ['B', 'C', 'D']);
    const angId: Record<string, string> = { A: 'DAB', B: 'ABC', C: 'BCD', D: 'CDA' };
    const f = qfig(Q, [...PMARKS, ...(rect ? [box('DAB')] : [albl('DAB', `${fmt(Aa)}°`)]), albl(angId[tg]!, '?')]);
    const ans = tg === 'C' ? Aa : 180 - Aa;
    setAng(f, angId[tg]!, `${fmt(ans)}°`, 'link');
    const t = relabel(R, ROLES);
    const opp = tg === 'C';
    return numT(t, {
      id: `${fam}-${n}`, family: fam, prompt: `ABCD is a parallelogram with m∠A = ${fmt(Aa)}°${rect ? ' (a right angle)' : ''}. What is m∠${tg}?`, board: opp ? 'm\\angle C = m\\angle A' : `m\\angle ${tg} + m\\angle A = 180^\\circ`, unit: '°',
      solution: opp ? ['Opposite angles of a parallelogram are congruent.', `m∠C = m∠A = ${S(fmt(ans) + '°')}.`] : [`∠${tg} and ∠A are consecutive: same-side interior angles of parallel lines, so they add to 180°.`, `m∠${tg} = 180° − ${fmt(Aa)}° = ${S(fmt(ans) + '°')}.`],
      picture: { fig: f, reveal: { solved: [angId[tg]!] } },
    }, ans, opp ? [{ v: 180 - Aa, mc: MC.swapAng, say: '∠C is OPPOSITE ∠A: opposite angles are congruent, not supplementary.' }] : [{ v: Aa, mc: MC.congSupp, say: `∠${tg} is CONSECUTIVE to ∠A: they add to 180°.` }, { v: 360 - Aa, say: 'Two consecutive angles add to 180°, all four to 360°.' }], 'Right.', opp ? 'Opposite angles of a parallelogram are congruent.' : 'Consecutive angles of a parallelogram are supplementary.');
  });
}
export const oppAngle: Gen = (R, n) => angleItem(R, n, 'oppAngle', 'C');
export const consAngle: Gen = (R, n) => angleItem(R, n, 'consAngle', 'BD');

// ---------- polygon angle sums ----------
function polyFig(P: Pt[], o: { tri?: boolean; labels?: (string | null)[]; ask?: number; ans?: string } = {}): Fig {
  const L = 'ABCDEFGHJK';
  const pts: Record<string, Pt> = {};
  P.forEach((p, i) => { pts[L[i]!] = p; });
  const segs = P.map((_, i) => L[i]! + L[(i + 1) % P.length]!);
  const marks: QMark[] = [];
  (o.labels ?? []).forEach((t, i) => { if (t !== null) marks.push(albl(L[(i + P.length - 1) % P.length]! + L[i]! + L[(i + 1) % P.length]!, t)); });
  const style: Record<string, { dash: boolean; col: 'faint' }> = {};
  if (o.tri) for (let i = 2; i < P.length - 1; i++) { segs.push('A' + L[i]!); style['A' + L[i]!] = { dash: true, col: 'faint' }; }
  const f = buildFig({ pts, segs, marks, segStyle: style, fills: [{ pts: L.slice(0, P.length) }] });
  f.points = [];   // the polygons are read by their angles; no letters
  if (o.ask !== undefined) { const i = o.ask; const id = L[(i + P.length - 1) % P.length]! + L[i]! + L[(i + 1) % P.length]!; setAng(f, id, o.ans ?? '', 'link'); }
  return { ...f, maxS: 2.2, pad: 110 };
}
export const polySum: Gen = (R, n) => fitted('polySum', () => {
  const N = ri(R, 5, 12);
  const P = regularPts(N, 330).map(p => add(p, [R() * 24 - 12, R() * 24 - 12]) as Pt);
  const ans = (N - 2) * 180;
  if (R() < 0.4) {
    return numT(t0, {
      id: `polySum-${n}`, family: 'polySum', prompt: `The interior angles of a convex polygon add to ${ans}°. How many sides does it have?`, board: `(n - 2) \\cdot 180^\\circ = ${ans}^\\circ`, unit: 'sides',
      solution: [`${ans}° ÷ 180° = ${N - 2} triangles from one vertex.`, `n − 2 = ${N - 2}, so n = ${S(String(N))}.`],
      picture: { card: { lines: [`Angle sum: ${ans}°`, 'Each triangle from one vertex: 180°'] }, reveal: {} },
    }, N, [{ v: N - 2, say: `${N - 2} is the number of triangles; the polygon has 2 more sides.` }, { v: ans / 180, mc: MC.nTimes180, say: 'The sum is (n − 2) · 180°, not n · 180°.' }].filter(w => w.v !== N), 'Right.', 'Divide by 180° to count the triangles, then add 2.');
  }
  return numT(t0, {
    id: `polySum-${n}`, family: 'polySum', prompt: `A convex ${polyName(N)} has ${N} sides. The dashed diagonals from one vertex cut it into triangles. What is the sum of its interior angles?`, board: `n = ${N}`, unit: '°',
    solution: [`From one vertex the diagonals make ${N} − 2 = ${N - 2} triangles.`, `Each triangle has 180°: ${N - 2} · 180° = ${S(ans + '°')}.`],
    picture: { fig: polyFig(P, { tri: true }), reveal: {} },
  }, ans, [{ v: N * 180, mc: MC.nTimes180, say: `There are ${N} − 2 triangles, not ${N}.` }, { v: 360, mc: MC.fixed360, say: '360° is the sum for a quadrilateral only.' }, { v: (N - 1) * 180, say: `Count the triangles: ${N} − 2.` }], 'Right: (n − 2) · 180°.', 'Count the triangles from one vertex: n − 2, each 180°.');
});
const t0 = (s: string) => s;
export const polyMissing: Gen = (R, n) => fitted('polyMissing', () => {
  for (let k = 0; k < 60; k++) {
    const N = ri(R, 4, 6), sum = (N - 2) * 180;
    const ang: number[] = [];
    for (let i = 0; i < N - 1; i++) ang.push(ri(R, N === 4 ? 62 : 92, N === 4 ? 128 : 150));
    const last = sum - ang.reduce((a, b) => a + b, 0);
    if (last < (N === 4 ? 60 : 90) || last > (N === 4 ? 130 : 160)) continue;
    const all = [...ang, last], ask = ri(R, 0, N - 1);
    const order = all.slice(N - 1 - ask).concat(all.slice(0, N - 1 - ask));   // the unknown at index `ask`
    const P = polyWithAngles(R, order);
    if (!P) continue;
    const got = polyAngles(P);
    if (got.some((g, i) => Math.abs(g - order[i]!) > 1e-6)) continue;
    const f = polyFig(P, { labels: order.map((a, i) => (i === ask ? '?' : `${a}°`)), ask, ans: `${last}°` });
    const known = order.filter((_, i) => i !== ask), ksum = known.reduce((a, b) => a + b, 0);
    return numT(t0, {
      id: `polyMissing-${n}`, family: 'polyMissing', prompt: `A convex ${polyName(N)} has interior angles ${known.join('°, ')}° and one missing angle. What is the missing angle?${N > 4 ? ' (calculator allowed)' : ''}`, board: `(${N} - 2) \\cdot 180^\\circ = ${sum}^\\circ`, unit: '°',
      solution: [`The interior angles of a ${polyName(N)} add to (${N} − 2) · 180° = ${sum}°.`, `The known angles add to ${ksum}°.`, `${sum}° − ${ksum}° = ${S(last + '°')}.`],
      picture: { fig: f, reveal: { solved: [] } },
    }, last, [{ v: N * 180 - ksum, mc: MC.nTimes180, say: `The sum is (${N} − 2) · 180°, not ${N} · 180°.` }, ...(N !== 4 ? [{ v: 360 - ksum, mc: MC.fixed360, say: `360° is a quadrilateral's sum; a ${polyName(N)} has ${sum}°.` }] : [])], 'Right.', 'Subtract the known angles from the angle sum.');
  }
  throw new Error('no polygon');
});
export const measuredSum: Gen = (R, n) => {
  const N = pick(R, [5, 6, 8]), sum = (N - 2) * 180, d = pick(R, [-3, -2, -1, 1, 2, 3]), who = pick(R, ['Priya', 'Omar', 'Kai', 'Sofia', 'Mateo', 'Ava']);
  const opts: Opt[] = [
    { t: `the sum is ${sum}° by the triangle argument; ${sum + d}° is measuring error`, ok: true, say: 'Right: the argument covers every convex polygon; measuring is never exact.' },
    { t: `the sum of ${N === 8 ? 'an' : 'a'} ${polyName(N)}'s angles is ${sum + d}°: it was measured`, mc: MC.examples, say: 'One measurement is evidence, not proof, and protractors are never exact.' },
    { t: `the formula (n − 2) · 180° is wrong for ${polyName(N)}s`, mc: MC.examples, say: `${N} − 2 = ${N - 2} triangles of 180° each give exactly ${sum}°.` },
    { t: `the sum is ${N * 180}°: ${N} angles, so ${N} triangles`, mc: MC.nTimes180, say: `From one vertex the diagonals make ${N} − 2 triangles.` },
  ];
  return choice(R, {
    id: `measuredSum-${n}`, family: 'measuredSum', prompt: `${who} measures the angles of a convex ${polyName(N)} with a protractor and gets a total of ${sum + d}°. What should ${who} conclude?`, board: `\\text{measured: } ${sum + d}^\\circ`,
    solution: [`Triangulating from one vertex gives ${N - 2} triangles of 180°: ${sum}°.`, 'A measured total is evidence for a conjecture; the triangle argument justifies it, and it beats a protractor.'],
    picture: { card: { lines: [`Measured: ${sum + d}° (protractor)`, `Triangles from one vertex: ${N} − 2`] }, reveal: {} },
  }, opts);
};
export const extSum: Gen = (R, n) => fitted('extSum', () => {
  for (let k = 0; k < 60; k++) {
    const N = ri(R, 4, 6);
    const ext: number[] = [];
    for (let i = 0; i < N - 1; i++) ext.push(ri(R, 32, N === 4 ? 118 : 88));
    const last = 360 - ext.reduce((a, b) => a + b, 0);
    if (last < 30 || last > 120) continue;
    const all = [...ext, last], ask = ri(R, 0, N - 1);
    const order = all.slice(N - 1 - ask).concat(all.slice(0, N - 1 - ask));
    const P = polyWithAngles(R, order.map(e => 180 - e));
    if (!P) continue;
    // exterior angle at vertex i: between side (i-1 -> i) extended beyond i and side i -> i+1
    const L = 'ABCDEF', X = 'uvwxyz';
    const pts: Record<string, Pt> = {}, segs: string[] = [], marks: QMark[] = [], style: Record<string, { dash: boolean; col: 'faint' }> = {};
    P.forEach((p, i) => { pts[L[i]!] = p; });
    P.forEach((p, i) => {
      const prev = P[(i + N - 1) % N]!, ext0 = add(p, mul(sub(p, prev), 120 / dist(p, prev)));
      pts[X[i]!] = ext0; segs.push(L[(i + N - 1) % N]! + L[i]!, L[i]! + X[i]!); style[L[i]! + X[i]!] = { dash: true, col: 'faint' };
      marks.push(albl(X[i]! + L[i]! + L[(i + 1) % N]!, i === ask ? '?' : `${order[i]}°`));
    });
    let f: Fig;
    try { f = buildFig({ pts, segs: [...new Set(segs)], marks, segStyle: style, bare: [...X.slice(0, N)], fills: [{ pts: L.slice(0, N) }] }); } catch { continue; }
    f.points = [];
    setAng(f, X[ask]! + L[ask]! + L[(ask + 1) % N]!, `${last}°`, 'link');
    const ksum = 360 - last;
    if (Math.abs(measure(pts[L[ask]!]!, pts[X[ask]!]!, pts[L[(ask + 1) % N]!]!) - last) > 1e-6) continue;
    return numT(t0, {
      id: `extSum-${n}`, family: 'extSum', prompt: `Each side of a convex ${polyName(N)} is extended, one exterior angle at each vertex, all turning the same way. ${N - 1} of the exterior angles are ${order.filter((_, i) => i !== ask).join('°, ')}°. What is the missing one?`, board: '\\text{exterior angles: } 360^\\circ', unit: '°',
      solution: ['Walking around the polygon you turn once completely: the exterior angles, one per vertex, add to 360°.', `The known ones add to ${ksum}°: 360° − ${ksum}° = ${S(last + '°')}.`],
      picture: { fig: { ...f, maxS: 2.2, pad: 110 }, reveal: {} },
    }, last, [{ v: 720 - ksum, mc: MC.extBoth, say: 'One exterior angle per vertex adds to 360°, not 720°.' }, { v: (N - 2) * 180 - ksum, mc: MC.nTimes180, say: 'That is the INTERIOR sum; exterior angles add to 360°.' }], 'Right: one full turn.', 'One exterior angle at each vertex: they add to 360°.');
  }
  throw new Error('no polygon');
});

// ---------- regular polygons ----------
const REG = [3, 4, 5, 6, 8, 9, 10, 12];
export const regAngle: Gen = (R, n) => fitted('regAngle', () => {
  const N = pick(R, REG), ext = 360 / N, int = 180 - ext, askInt = R() < 0.6;
  const P = regularPts(N, 330);
  const f = polyFig(P, { labels: P.map((_, i) => (i === 1 ? '?' : null)), ask: 1, ans: `${askInt ? int : ext}°` });
  const calc = !askInt ? false : N === 9 || N === 12 || N === 8 || N === 10;
  if (!askInt) {
    // show the exterior angle instead: extend one side
    const A = P[0]!, B = P[1]!, C = P[2]!, X = add(B, mul(sub(B, A), 0.6));
    f.segs.push({ id: 'Bx', a: B, b: X, dash: true, col: 'faint' });
    f.angles = [{ id: 'xBC', v: B, p: X, q: C, text: '?', alt: `${ext}°`, col: 'pick' }];
  }
  const ans = askInt ? int : ext;
  return numT(t0, {
    id: `regAngle-${n}`, family: 'regAngle', prompt: `A regular ${polyName(N)} has ${N} congruent sides and ${N} congruent angles. What is one ${askInt ? 'interior' : 'exterior'} angle?${calc ? ' (calculator allowed)' : ''}`, board: `n = ${N}`, unit: '°',
    solution: askInt ? [`One exterior angle: 360° ÷ ${N} = ${ext}°.`, `One interior angle: 180° − ${ext}° = ${S(int + '°')}.`] : [`The ${N} congruent exterior angles add to 360°.`, `360° ÷ ${N} = ${S(ext + '°')}.`],
    picture: { fig: f, reveal: {} },
  }, ans, askInt ? [{ v: ext, mc: MC.fixed360, say: '360° ÷ n is the EXTERIOR angle; the interior angle is 180° minus it.' }, { v: (N - 2) * 180, say: 'That is the sum of all the angles; one angle is the sum ÷ n.' }, ...(N > 3 ? [{ v: ((N - 2) * 180) / (N - 2), mc: MC.divisor, say: `Divide the sum by the ${N} angles, not by ${N - 2}.` }] : [])] : [{ v: int, say: 'That is the interior angle; the exterior angle is 180° minus it.' }, { v: 180 / N, mc: MC.divisor, say: 'The exterior angles add to 360°, not 180°.' }], 'Right.', 'One exterior angle is 360° ÷ n; interior = 180° − exterior.');
});
export const regSides: Gen = (R, n) => {
  const possible = R() < 0.7;
  let ext: number, N: number;
  if (possible) { N = pick(R, REG.filter(x => x >= 5)); ext = 360 / N; }
  else { ext = pick(R, [50, 70, 80, 25, 35, 100]); N = 360 / ext; }
  const byInt = R() < 0.6, given = byInt ? 180 - ext : ext;
  const opts: Opt[] = possible
    ? [{ t: `${N} sides`, ok: true, say: `Right: 360° ÷ ${ext}° = ${N}.` }, { t: `${N + 1} sides`, say: `360° ÷ ${ext}° = ${N}.` }, { t: `${N - 1} sides`, say: `360° ÷ ${ext}° = ${N}.` }, { t: 'no regular polygon has this angle', say: `${ext}° goes into 360° exactly ${N} times.` }]
    : [{ t: 'no regular polygon has this angle', ok: true, say: `Right: 360° ÷ ${ext}° = ${fmt(N)}, not a whole number of sides.` }, { t: `${fmt(N)} sides`, mc: MC.fracCount, say: 'A polygon cannot have a fractional number of sides.' }, { t: `${Math.floor(N)} sides`, mc: MC.fracCount, say: `${Math.floor(N)} sides would need ${fmt(360 / Math.floor(N))}° exterior angles.` }, { t: `${Math.ceil(N)} sides`, say: `${Math.ceil(N)} sides would need ${fmt(360 / Math.ceil(N))}° exterior angles.` }];
  return choice(R, {
    id: `regSides-${n}`, family: 'regSides', prompt: `One ${byInt ? 'interior' : 'exterior'} angle of a regular polygon is ${given}°. How many sides does it have?`, board: `${byInt ? '\\text{interior}' : '\\text{exterior}'} = ${given}^\\circ`,
    solution: [byInt ? `Exterior angle: 180° − ${given}° = ${ext}°.` : `The exterior angle is ${ext}°.`, `Sides: 360° ÷ ${ext}° = ${fmt(N)}${possible ? '' : ', not a whole number'}.`],
    picture: { card: { lines: [`${byInt ? 'Interior' : 'Exterior'} angle: ${given}°`, 'Exterior angles add to 360°'] }, reveal: {} },
  }, opts);
};

// ---------- diagonals ----------
const RECT_M: QMark[] = [box('DAB'), box('ABC'), box('BCD'), box('CDA')];
const RHOMB_M: QMark[] = [tick('AB', 1), tick('BC', 1), tick('DC', 1), tick('AD', 1)];
const marksOf = (k: 'para' | 'rect' | 'rhombus' | 'square'): QMark[] => (k === 'para' ? PMARKS.slice() : k === 'rect' ? RECT_M.slice() : k === 'rhombus' ? RHOMB_M.slice() : [...RECT_M, ...RHOMB_M]);
export const diagVocab: Gen = (R, n) => fitted('diagVocab', () => {
  const Q = makeQ(R, 'para', { turn: ri(R, 0, 359) });
  const f = qfig(Q, PMARKS, { diags: 'halves' });
  const t = relabel(R, ROLES);
  if (R() < 0.5) {
    const d = pick(R, ['AC', 'BD']), half = d === 'AC' ? pick(R, ['AE', 'EC']) : pick(R, ['BE', 'ED']), otherHalf = d === 'AC' ? pick(R, ['BE', 'ED']) : pick(R, ['AE', 'EC']);
    const seg = (s: string) => s.split('').map(ch => ch + '̅').join('');
    return choiceT(R, t, {
      id: `diagVocab-${n}`, family: 'diagVocab', prompt: `The diagonals of ABCD meet at E. Which segment is half of diagonal ${seg(d)}, from a vertex to E?`, board: `${d[0]}E \\text{ or } ${d}?`,
      solution: [`Diagonal ${seg(d)} runs from ${d[0]} to ${d[1]} through E.`, `A half-diagonal runs from a vertex to E: ${seg(half)}.`],
      picture: { fig: f, reveal: {} },
    }, [{ t: seg(half), ok: true, say: 'Right: from a vertex to E.' }, { t: seg(d), mc: MC.partWhole, say: `${seg(d)} is the whole diagonal.` }, { t: seg(otherHalf), mc: MC.diagWords, say: 'That is half of the OTHER diagonal.' }, { t: seg(d[0] === 'A' ? 'AB' : 'BC'), say: 'That is a side, not part of a diagonal.' }]);
  }
  return choiceT(R, t, {
    id: `diagVocab-${n}`, family: 'diagVocab', prompt: 'The diagonals of ABCD meet at E. What does “the diagonals bisect each other” mean?', board: '\\text{bisect each other}',
    solution: ['Bisect each other: E is the midpoint of EACH diagonal.', 'So AE = EC and BE = ED; it says nothing about AC compared with BD.'],
    picture: { fig: f, reveal: {} },
  }, [{ t: 'AE = EC and BE = ED', ok: true, say: 'Right: E is the midpoint of each diagonal.' }, { t: 'AC = BD', mc: MC.diagWords, say: 'That is "congruent diagonals", a different property.' }, { t: 'AC ⊥ BD', say: 'That is "perpendicular diagonals".' }, { t: 'AE = BE', mc: MC.diagWords, say: 'Bisecting compares the two halves of the SAME diagonal.' }]);
});
const CONJ: Record<'para' | 'rect' | 'rhombus' | 'kite' | 'isoTrap', { bis: boolean; cong: boolean; perp: boolean }> = {
  para: { bis: true, cong: false, perp: false }, rect: { bis: true, cong: true, perp: false }, rhombus: { bis: true, cong: false, perp: true },
  kite: { bis: false, cong: false, perp: true }, isoTrap: { bis: false, cong: true, perp: false },
};
const PROP_W = { bis: 'bisect each other', cong: 'are congruent', perp: 'are perpendicular' } as const;
export const conjTable: Gen = (R, n) => {
  const k = pick(R, ['para', 'rect', 'rhombus', 'kite', 'isoTrap'] as const), c = CONJ[k];
  const held = (['bis', 'cong', 'perp'] as const).filter(p => c[p]), failed = (['bis', 'cong', 'perp'] as const).filter(p => !c[p]);
  const right = pick(R, held);
  const row = (p: 'bis' | 'cong' | 'perp', i: number): string => {
    const w = (x: number) => x.toFixed(1);
    if (p === 'perp') return c.perp ? `${w(89.6 + 0.2 * i + (i === 1 ? 0.6 : 0))}°` : `${64 + 8 * i + ri(R, 0, 3)}°`;
    if (p === 'cong') { const a = 6 + i * 1.3 + R(); return c.cong ? `${w(a)} and ${w(a + (i === 1 ? 0.1 : 0))} cm` : `${w(a)} and ${w(a * (0.55 + 0.1 * i))} cm`; }
    return c.bis ? 'halves match (±0.1 cm)' : `halves ${w(2 + i + R())} and ${w(3.4 + i + R())} cm`;
  };
  const lines = [`Three different ${NAME[k] === 'isosceles trapezoid' ? 'isosceles trapezoids' : NAME[k] + (k === 'rhombus' ? 'es' : 's')}, measured:`, ...[0, 1, 2].map(i => `Example ${i + 1}: angle between diagonals ${row('perp', i)}; diagonals ${row('cong', i)}; ${row('bis', i)}.`)];
  const opts: Opt[] = [{ t: `conjecture: if a quadrilateral is ${ART[k]}, then its diagonals ${PROP_W[right]}`, ok: true, say: 'Right: it held in every example, so it is a conjecture worth proving.' }];
  for (const p of failed) opts.push({ t: `conjecture: if a quadrilateral is ${ART[k]}, then its diagonals ${PROP_W[p]}`, mc: MC.upHier, say: 'The table shows it failing in at least one example.' });
  opts.push({ t: `proved: the diagonals of every ${NAME[k]} ${PROP_W[right]}, because three examples show it`, mc: MC.examples, say: 'Three measured examples support a conjecture; they do not prove it.' });
  return choice(R, {
    id: `conjTable-${n}`, family: 'conjTable', prompt: `${k === 'isoTrap' ? 'An isosceles trapezoid here is a trapezoid with congruent legs that is not a parallelogram. ' : ''}Values within 0.1 cm or 1° count as equal. Which statement does the table support?`, board: '\\text{conjecture}',
    solution: ['A property that held in every measured example becomes a conjecture, labeled as such until it is proved.', `Here: the diagonals ${PROP_W[right]} every time.`],
    picture: { card: { lines }, reveal: {} },
  }, opts.slice(0, 4));
};
/** diagonals of a parallelogram / rectangle / rhombus with the diagonals drawn as halves */
function diagQ(R: () => number, k: 'para' | 'rect' | 'rhombus' | 'square', AC: number, BD: number): Q4 {
  // a parallelogram from its diagonals: E at the origin, AC along x, BD at angle phi
  const phi = k === 'rhombus' || k === 'square' ? 90 : k === 'rect' ? 0 : ri(R, 50, 75);
  const sc = 430 / Math.max(AC, BD);
  if (k === 'rect' || k === 'square') {
    const th = k === 'square' ? 90 : ri(R, 28, 38) * (R() < 0.5 ? 1 : -1) + 90;   // the angle between the diagonals
    const a = (AC / 2) * sc;
    const A = mul(dirv(180), a), C = mul(dirv(0), a), B = mul(dirv(180 + th), a), D = mul(dirv(th), a);
    return turnQ([A, B, C, D] as Q4, ri(R, 0, 359));
  }
  const A = mul(dirv(180), (AC / 2) * sc), C = mul(dirv(0), (AC / 2) * sc), B = mul(dirv(180 + phi), (BD / 2) * sc), D = mul(dirv(phi), (BD / 2) * sc);
  return turnQ([A, B, C, D] as Q4, ri(R, 0, 359));
}
export const diagHalf: Gen = (R, n) => fitted('diagHalf', () => {
  const u = pick(R, UNITS), W = halvable(R, 10, 48), other = halvable(R, 10, 48);
  if (Math.abs(W - other) < 3) throw new Error('close');
  const Q = diagQ(R, 'para', W, other);
  const v = pick(R, ['toWhole', 'toHalf', 'otherDiag'] as const);
  const f = qfig(Q, PMARKS, { diags: 'halves' });
  if (v === 'toWhole') setSeg(f, 'AE', `${fmt(W / 2)} ${u}`);
  if (v === 'toHalf') setSeg(f, 'EC', '?', `${fmt(W / 2)} ${u}`, 'link');
  if (v === 'otherDiag') { setSeg(f, 'AE', `${fmt(W / 2)} ${u}`); setSeg(f, 'BE', '?', `${fmt(other / 2)} ${u}`, 'link'); }
  const t = relabel(R, ROLES);
  if (v === 'otherDiag') {
    return choiceT(R, t, {
      id: `diagHalf-${n}`, family: 'diagHalf', prompt: `ABCD is a parallelogram; its diagonals meet at E, and AE = ${fmt(W / 2)} ${u}. What is BE?`, board: `AE = ${fmt(W / 2)}`,
      solution: ['The diagonals of a parallelogram bisect each other: AE = EC and BE = ED.', 'Nothing relates BE to AE: the diagonals need not be congruent.', 'So: not enough information.'],
      picture: { fig: f, reveal: {} },
    }, [{ t: 'not enough information: the diagonals need not be congruent', ok: true, say: 'Right: bisection compares halves of the SAME diagonal.' }, { t: `${fmt(W / 2)} ${u}`, mc: MC.diagWords, say: 'Bisect each other means AE = EC and BE = ED, not AE = BE.' }, { t: `${fmt(W)} ${u}`, mc: MC.partWhole, say: 'That is the whole diagonal AC, and BE is not related to it.' }]);
  }
  const ans = v === 'toWhole' ? W : W / 2;
  return numT(t, {
    id: `diagHalf-${n}`, family: 'diagHalf', prompt: v === 'toWhole' ? `ABCD is a parallelogram; its diagonals meet at E, and AE = ${fmt(W / 2)} ${u}. How long is diagonal AC?` : `ABCD is a parallelogram; its diagonals meet at E, and AC = ${fmt(W)} ${u}. How long is EC?`, board: 'AE = EC', unit: u,
    solution: ['The diagonals of a parallelogram bisect each other: E is the midpoint of AC.', v === 'toWhole' ? `AC = 2 · ${fmt(W / 2)} = ${S(fmt(W) + ' ' + u)}.` : `EC = ${fmt(W)} ÷ 2 = ${S(fmt(W / 2) + ' ' + u)}.`],
    picture: { fig: f, reveal: { solved: v === 'toHalf' ? ['EC'] : [] } },
  }, ans, v === 'toWhole' ? [{ v: W / 4, mc: MC.partWhole, say: 'AE is HALF of AC: double it.' }, { v: W / 2, mc: MC.partWhole, say: 'AE is half; AC is the whole diagonal.' }] : [{ v: W * 2, mc: MC.partWhole, say: 'EC is half of AC.' }, { v: W, mc: MC.partWhole, say: 'EC is half of AC, not all of it.' }], 'Right: E is the midpoint of AC.', 'The diagonals bisect each other: E is the midpoint of each.');
});
export const rectDiag: Gen = (R, n) => fitted('rectDiag', () => {
  const u = pick(R, UNITS), sq = R() < 0.2, W = halvable(R, 10, 50);
  const Q = diagQ(R, sq ? 'square' : 'rect', W, W);
  const f = qfig(Q, sq ? marksOf('square') : RECT_M, { diags: 'halves' });
  const t = relabel(R, ROLES);
  const shape = sq ? 'square' : 'rectangle';
  if (R() < 0.3) {
    return choiceT(R, t, {
      id: `rectDiag-${n}`, family: 'rectDiag', prompt: `ABCD is a ${shape}${sq ? '' : ' (not a square)'}; its diagonals meet at E. Which must be true?`, board: '\\text{rectangle diagonals}',
      solution: ['A rectangle is a parallelogram, so its diagonals bisect each other; and its diagonals are congruent.', 'So all four half-diagonals are equal: AE = BE.'],
      picture: { fig: f, reveal: {} },
    }, sq ? [{ t: 'AE = BE and AC ⊥ BD', ok: true, say: 'Right: a square is a rectangle AND a rhombus.' }, { t: 'AE = BE but the diagonals are not perpendicular', mc: MC.noInherit, say: 'A square is a rhombus too: its diagonals are perpendicular.' }, { t: 'AC = BD only; the halves need not match', mc: MC.diagWords, say: 'Congruent diagonals that bisect each other have four equal halves.' }]
      : [{ t: 'AE = BE', ok: true, say: 'Right: congruent diagonals that bisect each other give four equal halves.' }, { t: 'AC ⊥ BD', mc: MC.congPerp, say: 'Congruent is not perpendicular: only a square has both.' }, { t: 'AB = BC', mc: MC.appearance, say: 'Not a square: adjacent sides differ.' }]);
  }
  const v = pick(R, ['half', 'whole'] as const);
  if (v === 'half') setSeg(f, 'BE', '?', `${fmt(W / 2)} ${u}`, 'link');
  else setSeg(f, 'AE', `${fmt(W / 2)} ${u}`);
  const ans = v === 'half' ? W / 2 : W;
  return numT(t, {
    id: `rectDiag-${n}`, family: 'rectDiag', prompt: v === 'half' ? `ABCD is a ${shape} with diagonals meeting at E. AC = ${fmt(W)} ${u}. How long is BE?` : `ABCD is a ${shape} with diagonals meeting at E. AE = ${fmt(W / 2)} ${u}. How long is diagonal BD?`, board: v === 'half' ? `AC = BD,\\ BE = \\tfrac{1}{2}BD` : 'BD = AC = 2AE', unit: u,
    solution: v === 'half' ? [`A ${shape}'s diagonals are congruent: BD = AC = ${fmt(W)}.`, `They bisect each other: BE = ${fmt(W)} ÷ 2 = ${S(fmt(W / 2) + ' ' + u)}.`] : [`AE is half of AC: AC = ${fmt(W)}.`, `The diagonals are congruent: BD = ${S(fmt(W) + ' ' + u)}.`],
    picture: { fig: f, reveal: { solved: v === 'half' ? ['BE'] : [] } },
  }, ans, v === 'half' ? [{ v: W, mc: MC.partWhole, say: 'BE is half of BD, and BD = AC.' }] : [{ v: W / 2, mc: MC.partWhole, say: 'BD is the WHOLE diagonal: twice AE.' }], 'Right.', 'Congruent diagonals that bisect each other: four equal halves.');
});
export const rhombPerp: Gen = (R, n) => fitted('rhombPerp', () => {
  const t = relabel(R, ROLES);
  if (R() < 0.45) {
    const sq = R() < 0.25, p = ri(R, 3, 9), q = ri(R, 4, 14);
    if (!sq && Math.abs(p - q) < 2) throw new Error('close');
    const Q = diagQ(R, sq ? 'square' : 'rhombus', 2 * p, sq ? 2 * p : 2 * q);
    const f = qfig(Q, sq ? marksOf('square') : RHOMB_M, { diags: 'halves' });
    return choiceT(R, t, {
      id: `rhombPerp-${n}`, family: 'rhombPerp', prompt: `ABCD is a ${sq ? 'square' : 'rhombus (not a square)'}; its diagonals meet at E. Which must be true?`, board: '\\text{rhombus diagonals}',
      solution: ['A rhombus is a parallelogram: its diagonals bisect each other.', 'Its diagonals are also perpendicular: m∠AEB = 90°.'],
      picture: { fig: f, reveal: {} },
    }, sq ? [{ t: 'AC ⊥ BD and AC = BD', ok: true, say: 'Right: a square is a rhombus and a rectangle.' }, { t: 'AC ⊥ BD but AC ≠ BD', mc: MC.noInherit, say: 'A square is a rectangle too: its diagonals are congruent.' }, { t: 'AC = BD but they are not perpendicular', mc: MC.noInherit, say: 'A square is a rhombus: its diagonals are perpendicular.' }]
      : [{ t: 'AC ⊥ BD', ok: true, say: 'Right: the diagonals of a rhombus are perpendicular.' }, { t: 'AC = BD', mc: MC.upHier, say: 'Congruent diagonals belong to rectangles; a rhombus that is not a square does not have them.' }, { t: 'AE = BE', mc: MC.diagWords, say: 'The halves of DIFFERENT diagonals need not match.' }]);
  }
  // the side from the half-diagonals (a Pythagorean triple, no calculator)
  const [a, b, c] = pick(R, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20]] as [number, number, number][]);
  const u = pick(R, UNITS);
  const Q = diagQ(R, 'rhombus', 2 * a, 2 * b);
  const f = qfig(Q, RHOMB_M, { diags: 'halves' });
  setSeg(f, 'AE', `${a} ${u}`); setSeg(f, 'BE', `${b} ${u}`); setSeg(f, 'AB', '?', `${c} ${u}`, 'link');
  return numT(t, {
    id: `rhombPerp-${n}`, family: 'rhombPerp', prompt: `ABCD is a rhombus; its diagonals meet at E. AE = ${a} ${u} and BE = ${b} ${u}. How long is side AB?`, board: 'AB^2 = AE^2 + BE^2', unit: u,
    solution: ['The diagonals of a rhombus are perpendicular, so △AEB has a right angle at E.', `AB² = ${a}² + ${b}² = ${a * a + b * b}, so AB = ${S(c + ' ' + u)}.`],
    picture: { fig: f, reveal: { solved: ['AB'] } },
  }, c, [{ v: a + b, say: 'The sides of a right triangle do not add like that: use the Pythagorean theorem.' }, { v: 2 * a, mc: MC.partWhole, say: 'That is diagonal AC, not the side.' }], 'Right.', 'The diagonals are perpendicular: use the Pythagorean theorem in △AEB.');
});
export const bisMeaning: Gen = (R, n) => fitted('bisMeaning', () => {
  const t = relabel(R, ROLES);
  if (R() < 0.45) {
    const Q = makeQ(R, 'para', { turn: ri(R, 0, 359) });
    const f = qfig(Q, PMARKS, { diags: 'halves' });
    return choiceT(R, t, {
      id: `bisMeaning-${n}`, family: 'bisMeaning', prompt: 'The diagonals of ABCD meet at E. Which angle is a PART of the vertex angle ∠DAB?', board: '\\angle DAB',
      solution: ['The vertex angle ∠DAB has its vertex at A; diagonal AC splits it into ∠DAC and ∠CAB.', 'Angles with their vertex at E are angles where the diagonals cross.'],
      picture: { fig: f, reveal: {} },
    }, [{ t: '∠CAB', ok: true, say: 'Right: vertex A, between AB and the diagonal.' }, { t: '∠AEB', mc: MC.vertexCross, say: '∠AEB has its vertex at E, where the diagonals cross.' }, { t: '∠ABC', say: '∠ABC is the vertex angle at B.' }, { t: '∠DEC', mc: MC.vertexCross, say: '∠DEC is at the crossing point E.' }]);
  }
  // a diagonal that bisects the angle at A (a kite drawn exactly; only the arcs at A are marked)
  const W = ri(R, 60, 130) + (R() < 0.3 ? 1 : 0), L = 420, half = W / 2;
  const h = L * 0.42 * Math.tan((half * Math.PI) / 180), p = L * 0.42;
  if (h > 300 || h < 90) throw new Error('shape');
  const Q = turnQ(kitePts(p, L - p, h), ri(R, 0, 359));
  const toWhole = R() < 0.5;
  const marks: QMark[] = [arc('BAC', 1), arc('CAD', 1)];
  if (toWhole) marks[0] = { ang: 'BAC', n: 1, text: `${fmt(half)}°` };
  const f = qfig(Q, marks, { diags: 'AC' });
  const ans = toWhole ? W : half;
  return numT(t, {
    id: `bisMeaning-${n}`, family: 'bisMeaning', prompt: toWhole ? `Diagonal AC bisects ∠BAD (the arcs mark two congruent parts). m∠BAC = ${fmt(half)}°. What is m∠BAD?` : `Diagonal AC bisects ∠BAD, and m∠BAD = ${W}°. What is m∠BAC?`, board: 'm\\angle BAC = m\\angle CAD', unit: '°',
    solution: ['Bisected means split into two congruent parts.', toWhole ? `m∠BAD = 2 · ${fmt(half)}° = ${S(fmt(W) + '°')}.` : `m∠BAC = ${W}° ÷ 2 = ${S(fmt(half) + '°')}.`],
    picture: { fig: f, reveal: {} },
  }, ans, toWhole ? [{ v: half, mc: MC.wholeHalf, say: 'The whole is twice one part.' }] : [{ v: W, mc: MC.wholeHalf, say: 'Bisecting halves the angle.' }], 'Right.', 'Bisected: two congruent parts.');
});
export const rhombBis: Gen = (R, n) => fitted('rhombBis', () => {
  const sq = R() < 0.2, al = sq ? 90 : ri(R, 50, 130);
  if (!sq && Math.abs(al - 90) < 12) throw new Error('near square');
  const sc = 380;
  const Q = turnQ(paraPts(sc, sc, al), ri(R, 0, 359));
  const askA = R() < 0.5;   // ask ∠BAC (half of the angle at A) or ∠ABD (half of the angle at B)
  const marks: QMark[] = sq ? marksOf('square') : RHOMB_M.slice();
  marks.push({ ang: askA ? 'CAB' : 'ABD', n: 1, text: '?' });   // an arc anchors the label of a narrow half-angle
  const f = qfig(Q, marks, { diags: 'whole' });
  const ans = askA ? al / 2 : (180 - al) / 2;
  setAng(f, askA ? 'CAB' : 'ABD', `${fmt(ans)}°`, 'link');
  const t = relabel(R, ROLES);
  return numT(t, {
    id: `rhombBis-${n}`, family: 'rhombBis', prompt: `ABCD is a ${sq ? 'square' : 'rhombus'}${sq ? '' : ` with m∠DAB = ${al}°`}. What is ${askA ? 'm∠CAB' : 'm∠ABD'}?`, board: askA ? 'm\\angle CAB = \\tfrac{1}{2} m\\angle DAB' : 'm\\angle ABD = \\tfrac{1}{2} m\\angle ABC', unit: '°',
    solution: askA ? ['The diagonals of a rhombus bisect its vertex angles.', `m∠CAB = ${al}° ÷ 2 = ${S(fmt(ans) + '°')}.`] : [`Consecutive angles: m∠ABC = 180° − ${al}° = ${180 - al}°.`, `Diagonal BD bisects it: m∠ABD = ${S(fmt(ans) + '°')}.`],
    picture: { fig: f, reveal: { solved: [askA ? 'CAB' : 'ABD'] } },
  }, ans, askA ? [{ v: al, mc: MC.wholeHalf, say: 'The diagonal splits ∠DAB into two equal halves.' }, { v: 90 - al / 2, mc: MC.vertexCross, say: 'That is the other acute angle of the right triangle at E.' }] : [{ v: al / 2, mc: MC.vertexCross, say: 'Half of ∠DAB is ∠CAB; ∠ABD is half of ∠ABC.' }, { v: 180 - al, mc: MC.wholeHalf, say: 'That is all of ∠ABC; the diagonal halves it.' }], 'Right.', 'The diagonals of a rhombus bisect the vertex angles.');
});
export const chaseRect: Gen = (R, n) => fitted('chaseRect', () => {
  const th = ri(R, 22, 68);
  if (Math.abs(th - 45) < 4) throw new Error('square-ish');
  const w = 420, Q = turnQ(paraPts(w, w * Math.tan((th * Math.PI) / 180), 90), ri(R, 0, 359));
  const f = qfig(Q, [...RECT_M, albl('CAB', `${th}°`), albl('AEB', '?')], { diags: 'halves' });
  const ans = 180 - 2 * th;
  setAng(f, 'AEB', `${ans}°`, 'link');
  const t = relabel(R, ROLES);
  return numT(t, {
    id: `chaseRect-${n}`, family: 'chaseRect', prompt: `ABCD is a rectangle with diagonals meeting at E. m∠CAB = ${th}°. What is m∠AEB?`, board: 'AE = BE', unit: '°',
    solution: ['The diagonals of a rectangle are congruent and bisect each other, so AE = BE: △AEB is isosceles.', `Its base angles are ${th}° and ${th}°.`, `m∠AEB = 180° − 2 · ${th}° = ${S(ans + '°')}.`],
    picture: { fig: f, reveal: { solved: ['AEB'] } },
  }, ans, [{ v: 180 - th - 90, mc: MC.congPerp, say: '△AEB is isosceles (AE = BE), not a right triangle at B.' }, { v: 90, mc: MC.congPerp, say: 'A rectangle\'s diagonals are not perpendicular unless it is a square.' }, { v: 2 * th, say: 'The angles of △AEB add to 180°.' }], 'Right.', 'Use AE = BE: △AEB is isosceles.');
});
export const chaseRhomb: Gen = (R, n) => fitted('chaseRhomb', () => {
  const al = ri(R, 48, 132);
  if (Math.abs(al - 90) < 12) throw new Error('near square');
  const Q = turnQ(paraPts(380, 380, al), ri(R, 0, 359));
  const ask = R() < 0.5 ? 'ABE' : 'BAE';
  const marks: QMark[] = [...RHOMB_M, ask === 'ABE' ? { ang: 'BAE', n: 1, text: `${fmt(al / 2)}°` } : { ang: 'ABE', n: 1, text: `${fmt((180 - al) / 2)}°` }, { ang: ask, n: 2, text: '?' }];
  const f = qfig(Q, marks, { diags: 'halves' });
  const ans = ask === 'ABE' ? (180 - al) / 2 : al / 2;
  setAng(f, ask, `${fmt(ans)}°`, 'link');
  const given = ask === 'ABE' ? al / 2 : (180 - al) / 2;
  const t = relabel(R, ROLES);
  return numT(t, {
    id: `chaseRhomb-${n}`, family: 'chaseRhomb', prompt: `ABCD is a rhombus with diagonals meeting at E. m∠${ask === 'ABE' ? 'BAE' : 'ABE'} = ${fmt(given)}°. What is m∠${ask}?`, board: 'm\\angle AEB = 90^\\circ', unit: '°',
    solution: ['The diagonals of a rhombus are perpendicular: △AEB has a right angle at E.', `The two acute angles add to 90°: 90° − ${fmt(given)}° = ${S(fmt(ans) + '°')}.`],
    picture: { fig: f, reveal: { solved: [ask] } },
  }, ans, [{ v: given, mc: MC.interchange, say: '△AEB is a right triangle, not isosceles: the acute angles add to 90°.' }, { v: 180 - given, mc: MC.swapAng, say: 'With the right angle at E, the other two add to 90°.' }], 'Right.', 'Right angle at E: the acute angles add to 90°.');
});

// ---------- mixed-selection ----------
export const mixedProp: Gen = (R, n) => fitted('mixedProp', () => {
  const v = pick(R, ['sqFromRhomb', 'paraDiag', 'rectHalf', 'rhombOpp'] as const);
  const t = relabel(R, ROLES);
  const u = pick(R, UNITS);
  if (v === 'sqFromRhomb') {
    const Q = turnQ(paraPts(380, 380, 90), ri(R, 0, 359));
    const f = qfig(Q, [...RHOMB_M, box('DAB'), albl('CAB', '?')], { diags: 'whole' });
    setAng(f, 'CAB', '45°', 'link');
    return numT(t, {
      id: `mixedProp-${n}`, family: 'mixedProp', prompt: 'Use only the marks: four congruent sides and ONE right angle. What is m∠CAB?', board: '\\text{classify first}', unit: '°',
      solution: ['Four congruent sides: a rhombus, so a parallelogram.', 'One right angle: consecutive angles are supplementary, so all four are right angles. It is a square.', `The diagonal bisects the 90° angle: ${S('45°')}.`],
      picture: { fig: f, reveal: { solved: ['CAB'] } },
    }, 45, [{ v: 90, mc: MC.wholeHalf, say: 'The diagonal of a rhombus bisects the vertex angle.' }, { v: 60, mc: MC.appearance, say: 'Classify first: it is a square, so 45°.' }], 'Right: classify, then use the properties.', 'Classify it from the marks first.');
  }
  if (v === 'paraDiag') {
    const AC = ri(R, 12, 40), BD = ri(R, 12, 40);
    if (Math.abs(AC - BD) < 4) throw new Error('close');
    const Q = diagQ(R, 'para', AC, BD);
    const f = qfig(Q, PMARKS, { diags: 'whole' });
    setSeg(f, 'AC', `${AC} ${u}`);
    return choiceT(R, t, {
      id: `mixedProp-${n}`, family: 'mixedProp', prompt: `The arrowheads make ABCD a parallelogram, and AC = ${AC} ${u}. What is BD?`, board: `AC = ${AC}`,
      solution: ['The marks show a parallelogram, nothing more.', 'Congruent diagonals belong to rectangles; a parallelogram\'s diagonals need not be congruent.', 'So: not enough information.'],
      picture: { fig: f, reveal: {} },
    }, [{ t: 'not enough information: a parallelogram\'s diagonals need not be congruent', ok: true, say: 'Right: that property belongs to rectangles.' }, { t: `${AC} ${u}`, mc: MC.interchange, say: 'Congruent diagonals are a RECTANGLE property; nothing marks a right angle.' }, { t: `${fmt(AC / 2)} ${u}`, mc: MC.diagWords, say: 'Half of AC is AE, not BD.' }]);
  }
  if (v === 'rectHalf') {
    const W = halvable(R, 10, 48), Q = diagQ(R, 'rect', W, W);
    const f = qfig(Q, RECT_M, { diags: 'halves' });
    setSeg(f, 'AE', `${fmt(W / 2)} ${u}`); setSeg(f, 'ED', '?', `${fmt(W / 2)} ${u}`, 'link');
    return numT(t, {
      id: `mixedProp-${n}`, family: 'mixedProp', prompt: `Use only the marks. The diagonals of ABCD meet at E and AE = ${fmt(W / 2)} ${u}. How long is ED?`, board: '\\text{classify first}', unit: u,
      solution: ['Four right angles: a rectangle, so a parallelogram.', 'Rectangle diagonals are congruent and bisect each other: all four halves are equal.', `ED = AE = ${S(fmt(W / 2) + ' ' + u)}.`],
      picture: { fig: f, reveal: { solved: ['ED'] } },
    }, W / 2, [{ v: W, mc: MC.partWhole, say: 'ED is a half-diagonal, not a whole diagonal.' }], 'Right.', 'Classify from the marks, then use the rectangle\'s diagonals.');
  }
  const al = ri(R, 52, 76);
  const Q = turnQ(paraPts(380, 380, al), ri(R, 0, 359));
  const f = qfig(Q, [...RHOMB_M, albl('DAB', `${al}°`), albl('BCD', '?')]);
  setAng(f, 'BCD', `${al}°`, 'link');
  return numT(t, {
    id: `mixedProp-${n}`, family: 'mixedProp', prompt: 'Use only the marks. What is m∠BCD?', board: '\\text{classify first}', unit: '°',
    solution: ['Four congruent sides: a rhombus, so a parallelogram.', `Opposite angles of a parallelogram are congruent: m∠BCD = ${S(al + '°')}.`],
    picture: { fig: f, reveal: { solved: ['BCD'] } },
  }, al, [{ v: 180 - al, mc: MC.swapAng, say: '∠BCD is opposite ∠DAB: congruent.' }], 'Right.', 'Classify it first: a rhombus is a parallelogram.');
});

// ---------- property-to-equation ----------
export const eqOpp: Gen = (R, n) => fitted('eqOpp', () => {
  const v = pick(R, ['angle1', 'sides', 'halves'] as const);
  const t = relabel(R, ROLES);
  if (v === 'angle1') {
    const a = ri(R, 2, 4), x = ri(R, 12, 30), b = ri(R, -10, 20), A = a * x + b;
    if (A < 50 || A > 130 || Math.abs(A - 90) < 12 || b === 0) throw new Error('range');
    const Q = paraNum(R, 'para', 16, 10, A);
    const f = qfig(Q, [...PMARKS, albl('DAB', `${A}°`), albl('BCD', `(${linT(a, b).replace(/-/g, '−')})°`)]);
    return numT(t, {
      id: `eqOpp-${n}`, family: 'eqOpp', prompt: `ABCD is a parallelogram with m∠A = ${A}° and m∠C = (${linT(a, b).replace(/-/g, '−')})°. What is x?`, board: 'ABCD\\text{: a parallelogram}', unit: '',
      solution: ['Opposite angles of a parallelogram are congruent: set them equal.', `${linT(a, b).replace(/-/g, '−')} = ${A}, so ${a}x = ${A - b}.`, `x = ${S(String(x))}.`],
      picture: { fig: f, reveal: {} },
    }, x, [{ v: (180 - A - b) / a, mc: MC.swapAng, say: 'Opposite angles are congruent, not supplementary.' }], 'Right.', 'Opposite angles are congruent: set the two expressions equal.');
  }
  // variables on both sides: opposite sides 3x + 4 = 5x − 6, or half-diagonals x + 3 = 2x − 1
  for (let k = 0; k < 40; k++) {
    const a1 = ri(R, 1, 4), a2 = a1 + ri(R, 1, 3), x = ri(R, 3, 12), b1 = ri(R, -6, 12), b2 = a1 * x + b1 - a2 * x;
    const L = a1 * x + b1;
    if (b1 === 0 || b2 === 0 || L < 6 || L > 48) continue;
    const u = pick(R, UNITS);
    if (v === 'sides') {
      const other = ri(R, 6, 40);
      if (Math.abs(other - L) < 3) continue;
      const Q = paraNum(R, 'para', L, other, ri(R, 56, 74));
      const f = qfig(Q, [...PMARKS, lbl('AB', `${linT(a1, b1).replace(/-/g, '−')}`), lbl('DC', `${linT(a2, b2).replace(/-/g, '−')}`)]);
      return numT(t, {
        id: `eqOpp-${n}`, family: 'eqOpp', prompt: `ABCD is a parallelogram with AB = ${linT(a1, b1).replace(/-/g, '−')} and DC = ${linT(a2, b2).replace(/-/g, '−')} (in ${u === 'in.' ? 'inches' : u === 'ft' ? 'feet' : 'centimeters'}). How long is AB?`, board: 'ABCD\\text{: a parallelogram}', unit: u,
        solution: ['Opposite sides of a parallelogram are congruent: set them equal.', `${linT(a1, b1).replace(/-/g, '−')} = ${linT(a2, b2).replace(/-/g, '−')} gives x = ${x}.`, `AB = ${a1} · ${x} ${b1 < 0 ? '−' : '+'} ${Math.abs(b1)} = ${S(String(L) + ' ' + u)}.`],
        picture: { fig: f, reveal: {} },
      }, L, [{ v: x, mc: MC.reportsX, say: `x = ${x} is not the length: substitute it back into AB.` }], 'Right: x, then the length.', 'Set the opposite sides equal, solve for x, then find AB.');
    }
    const BD = ri(R, 8, 40);
    const Q = diagQ(R, 'para', 2 * L, BD);
    const f = qfig(Q, PMARKS, { diags: 'halves' });
    setSeg(f, 'AE', linT(a1, b1).replace(/-/g, '−')); setSeg(f, 'EC', linT(a2, b2).replace(/-/g, '−'));
    return numT(t, {
      id: `eqOpp-${n}`, family: 'eqOpp', prompt: `ABCD is a parallelogram; its diagonals meet at E with AE = ${linT(a1, b1).replace(/-/g, '−')} and EC = ${linT(a2, b2).replace(/-/g, '−')} (in ${u === 'in.' ? 'inches' : u === 'ft' ? 'feet' : 'centimeters'}). How long is diagonal AC?`, board: 'ABCD\\text{: a parallelogram}', unit: u,
      solution: ['The diagonals bisect each other: AE = EC.', `${linT(a1, b1).replace(/-/g, '−')} = ${linT(a2, b2).replace(/-/g, '−')} gives x = ${x}, so AE = ${L}.`, `AC = 2 · ${L} = ${S(String(2 * L) + ' ' + u)}.`],
      picture: { fig: f, reveal: {} },
    }, 2 * L, [{ v: x, mc: MC.reportsX, say: `x = ${x} is not the length asked for.` }, { v: L, mc: MC.partWhole, say: 'That is AE, half of AC.' }], 'Right.', 'AE = EC: solve for x, then AC = 2 · AE.');
  }
  throw new Error('no numbers');
});
export const eqCons: Gen = (R, n) => fitted('eqCons', () => {
  for (let k = 0; k < 60; k++) {
    const a1 = ri(R, 2, 4), a2 = ri(R, 2, 5), b1 = ri(R, -20, 25), x = ri(R, 10, 30);
    const A = a1 * x + b1, B = 180 - A, b2 = B - a2 * x;
    if (A < 50 || A > 130 || Math.abs(A - 90) < 12 || b1 === 0 || b2 === 0 || Math.abs(b2) > 40) continue;
    const Q = paraNum(R, 'para', 16, 10, A);
    const eA = linT(a1, b1).replace(/-/g, '−'), eB = linT(a2, b2).replace(/-/g, '−');
    const f = qfig(Q, [...PMARKS, albl('DAB', `(${eA})°`), albl('ABC', `(${eB})°`)]);
    const t = relabel(R, ROLES);
    const askB = R() < 0.5, ans = askB ? B : A;
    const xEq = (b2 - b1) / (a1 - a2);
    return numT(t, {
      id: `eqCons-${n}`, family: 'eqCons', prompt: `ABCD is a parallelogram with m∠A = (${eA})° and m∠B = (${eB})°. What is m∠${askB ? 'B' : 'A'}?`, board: 'ABCD\\text{: a parallelogram}', unit: '°',
      solution: ['∠A and ∠B are consecutive: they add to 180°.', `(${eA}) + (${eB}) = 180 gives ${a1 + a2}x ${b1 + b2 < 0 ? '−' : '+'} ${Math.abs(b1 + b2)} = 180, so x = ${x}.`, `m∠${askB ? 'B' : 'A'} = ${S(ans + '°')}.`],
      picture: { fig: f, reveal: {} },
    }, ans, [{ v: x, mc: MC.reportsX, say: `x = ${x}; the question asks for the angle.` }, ...(a1 !== a2 && Number.isFinite(xEq) ? [{ v: askB ? a2 * xEq + b2 : a1 * xEq + b1, mc: MC.swapAng, say: 'Consecutive angles are supplementary: add them to 180, do not set them equal.' }] : [])], 'Right.', 'Consecutive angles add to 180°: solve for x, then substitute.');
  }
  throw new Error('no numbers');
});
export { ART };
void shuffle;
