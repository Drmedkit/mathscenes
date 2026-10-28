// famB.ts: stage 2 of "Right triangle trigonometry": the calculator (degree mode, evaluating, full precision), choosing
// the ratio, missing sides (unknown on top or below), inverse trig, solving a whole triangle, special right
// triangles with exact values, Pythagorean triples, regular polygons (A = ½aP).
import type { Fig, MarkCol } from '../geometry-foundations/geo';
import { figOf } from '../similarity/sim';
import type { Response, Verdict } from '../../runtime/item';
import { type GFItem, type Gen, type NumWrong, AN, MC, S, aN, ans, angN, choice, fitted, numR, numX, pick, r, shuffle } from './common';
import {
  type Fn, type Rad, FNS, PLACE, POLY, TRIPLES, TURNS, apothemOf, asinD, atanD, fail, fmt, fnD, fnR, fx, invD, isRight, letters, polyArea, polyFig,
  radS, radT, radV, radiusOf, rd, rnd, rtFig, sideId, sinG, tanD,
} from './trig';

type Role = 'opp' | 'adj' | 'hyp';
const UNITS = ['ft', 'ft', 'in', 'm', 'cm'];
const fnName: Record<Fn, string> = { sin: 'sine', cos: 'cosine', tan: 'tangent' };
const RATIO: Record<Fn, [Role, Role]> = { sin: ['opp', 'hyp'], cos: ['adj', 'hyp'], tan: ['opp', 'adj'] };
const fnOf = (x: Role, y: Role): Fn => (x !== 'hyp' && y !== 'hyp' ? 'tan' : (x === 'opp' || y === 'opp') ? 'sin' : 'cos');
/** a right triangle with the given acute angle θ at a marked vertex V; labels by role relative to V */
export function trigFig(R: () => number, th: number, labs: Partial<Record<Role, { text: string; alt?: string; col?: MarkCol }>>, ang: { text: string; alt?: string }): { fig: Fig; nm: string; V: string; ids: Record<Role, string> } {
  const nm = letters(R), atA = R() < 0.5;
  const alpha = atA ? th : 90 - th;                      // the angle at vertex A of the triangle
  const a = Math.sin((alpha * Math.PI) / 180), b = Math.cos((alpha * Math.PI) / 180);
  // relative to the marked vertex: at A opp = a, adj = b; at B opp = b, adj = a
  const ids: Record<Role, string> = atA ? { opp: sideId(nm, 'a'), adj: sideId(nm, 'b'), hyp: sideId(nm, 'c') } : { opp: sideId(nm, 'b'), adj: sideId(nm, 'a'), hyp: sideId(nm, 'c') };
  const key: Record<Role, 'a' | 'b' | 'c'> = atA ? { opp: 'a', adj: 'b', hyp: 'c' } : { opp: 'b', adj: 'a', hyp: 'c' };
  const lab: Partial<Record<'a' | 'b' | 'c', { text: string; alt?: string; col?: MarkCol }>> = {};
  for (const k of ['opp', 'adj', 'hyp'] as Role[]) if (labs[k]) lab[key[k]] = labs[k];
  const fig = rtFig({ names: nm, a, b, rot: pick(R, TURNS), flip: R() < 0.5, lab, angA: atA ? ang : null, angB: atA ? null : ang });
  return { fig, nm, V: atA ? nm[0]! : nm[1]!, ids };
}
const angLab = (R: () => number) => pick(R, [r(R, 18, 72), r(R, 18, 72), r(R, 20, 70) + 0.5]);

// ---------- degree-mode ----------
export const modeRead: Gen = (R, n) => {
  const fn = pick(R, FNS), th = r(R, 15, 75), mode = pick(R, ['DEG', 'RAD', 'GRAD'] as const);
  const val = { DEG: fnD[fn](th), RAD: fnR[fn](th), GRAD: fn === 'sin' ? sinG(th) : fn === 'cos' ? Math.cos((th * Math.PI) / 200) : Math.tan((th * Math.PI) / 200) };
  const vs = Object.values(val);
  if (vs.some(v => Math.abs(v) > 50) || vs.some((v, i) => vs.some((w, j) => i < j && Math.abs(v - w) < 0.002))) return modeRead(R, n);
  const shown = fx(val[mode], 5);
  const W = { DEG: 'Degree (DEG)', RAD: 'Radian (RAD)', GRAD: 'Gradian (GRAD)' };
  return choice(R, {
    id: `modeRead-${n}`, family: 'modeRead',
    prompt: `A calculator shows ${fn}(${th}) = ${shown}. Which angle mode is it in?`, board: `\\${fn}(${th}) = ${shown}`,
    solution: [`In degree mode ${fn} ${th}° = ${fx(val.DEG, 5)}; in radian mode ${fn}(${th}) = ${fx(val.RAD, 5)}; in gradian mode ${fx(val.GRAD, 5)}.`, `The display matches ${W[mode]}.`],
    picture: { card: { lines: [`${fn}(${th})`, `= ${shown}`] } },
  }, (['DEG', 'RAD', 'GRAD'] as const).map(m => ({ t: W[m], ok: m === mode, v: val[m], mc: m === mode ? undefined : MC.mode, say: m === mode ? 'Right.' : `In ${W[m]} mode it would show ${fx(val[m], 5)}.` })), true);
};
export const modeCheck: Gen = (R, n) => {
  const bench = pick(R, [['sin', 30, '0.5'], ['tan', 45, '1'], ['cos', 60, '0.5']] as const);
  return choice(R, {
    id: `modeCheck-${n}`, family: 'modeCheck',
    prompt: `${pick(R, ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli'])} borrows ${pick(R, ['a TI-84', 'a scientific calculator', 'a phone calculator', 'a friend’s calculator', 'a classroom calculator'])}. Which quick test proves it is in degree mode?`, board: '\\text{DEG?}',
    solution: [`Use an angle whose degree value you know and that other modes get wrong: ${bench[0]}(${bench[1]}) = ${bench[2]} only in degree mode.`, 'cos(0) = 1 in every mode, and a positive answer proves nothing.'],
  }, [
    { t: `${bench[0]}(${bench[1]}) shows ${bench[2]}`, ok: true, say: 'Right: a benchmark that only degree mode gets.' },
    { t: 'cos(0) shows 1', ok: false, mc: MC.mode, say: '0 is 0 in every unit: cos(0) = 1 in radian mode too.' },
    { t: 'sin(1) shows a positive number', ok: false, mc: MC.rangeMode, say: 'sin(1) is positive in radian mode too (0.8415).' },
    { t: 'The answer has many decimal places', ok: false, mc: MC.trusts, say: 'Every mode gives long decimals.' },
  ]);
};

// ---------- evaluate-trig ----------
export const evalTrig: Gen = (R, n) => {
  const fn = pick(R, FNS), th = R() < 0.6 ? r(R, 10, 80) : r(R, 100, 800) / 10;
  try {
    const v = fnD[fn](th);
    return numR({
      id: `evalTrig-${n}`, family: 'evalTrig',
      prompt: `Use a calculator in degree mode. Find ${fn} ${fmt(th)}°, rounded to four decimal places.`, board: `\\${fn} ${fmt(th)}^\\circ`,
      solution: [`Check DEG on the screen, then key ${fn}(${fmt(th)}).`, `The display reads ${v.toFixed(8)}…, so ${fn} ${fmt(th)}° ≈ ${S(fx(v, 4))}.`],
      picture: { card: { lines: [`${fn} ${fmt(th)}° ≈ ?`, 'four decimal places'] } },
    }, v, 4, [
      { v: fnR[fn](th), mc: MC.mode, say: 'That is the radian-mode value. Switch to degree mode.' },
      ...FNS.filter(g => g !== fn).map(g => ({ v: fnD[g](th), mc: MC.keyOrder, say: `That is ${g} ${fmt(th)}°. Check the key.` })),
    ], 'Right.', 'Degree mode, then the right key; round only the final display.');
  } catch { return evalTrig(R, n); }
};
export const estimateTrig: Gen = (R, n) => {
  const fn = pick(R, FNS), th = r(R, 2, 8) * 10 - pick(R, [0, 5]);
  if (th === 45) return estimateTrig(R, n);
  const v = fnD[fn](th);
  const cands = [{ v, ok: true }, ...FNS.filter(g => g !== fn).map(g => ({ v: fnD[g](th), ok: false })), { v: fnD[fn](90 - th), ok: false }, { v: th / 100, ok: false }];
  const kept: typeof cands = [];
  for (const c of cands) if (!kept.some(k => Math.abs(k.v - c.v) < 0.12)) kept.push(c);
  if (kept.length < 3) return estimateTrig(R, n);
  const why = fn === 'tan' ? (th > 45 ? 'Above 45° tangent is more than 1.' : 'Below 45° tangent is less than 1.') : fn === 'sin' ? `Sine grows from 0 to 1; sin 30° = 0.5, sin 60° ≈ 0.87.` : 'Cosine shrinks from 1 to 0; cos 60° = 0.5, cos 30° ≈ 0.87.';
  return choice(R, {
    id: `estimateTrig-${n}`, family: 'estimateTrig',
    prompt: `Estimate before you key it in: which is closest to ${fn} ${th}°?`, board: `\\${fn} ${th}^\\circ \\approx \\,?`,
    solution: [why, `So ${fn} ${th}° ≈ ${v.toFixed(2)}.`],
  }, kept.map(c => ({ t: c.v.toFixed(2), ok: c.ok, v: c.v, mc: c.ok ? undefined : Math.abs(c.v - th / 100) < 1e-9 ? MC.fx : undefined, say: c.ok ? 'Right.' : why })));
};

// ---------- carry-precision ----------
export const carry: Gen = (R, n) => {
  const who = pick(R, ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo']), L = r(R, 12, 32), A1 = r(R, 60, 78), A2 = r(R, 60, 78);
  if (Math.abs(A1 - A2) < 3) return carry(R, n);
  try {
    const h = L * Math.sin((A1 * Math.PI) / 180), L2 = h / Math.sin((A2 * Math.PI) / 180);
    const early1 = rd(h, 1) / Math.sin((A2 * Math.PI) / 180), early2 = (L * rd(Math.sin((A1 * Math.PI) / 180), 2)) / rd(Math.sin((A2 * Math.PI) / 180), 2);
    const a = rnd(L2, 1);
    if (Math.abs(rd(early1, 1) - a) < 1e-9 && Math.abs(rd(early2, 1) - a) < 1e-9) return carry(R, n);
    return numR({
      id: `carry-${n}`, family: 'carry',
      prompt: `${AN(L)} ft ladder leans at ${A1}° to the ground and reaches a height h = ${L} sin ${A1}°. A second ladder must reach the same height at ${A2}°, so its length is h ÷ sin ${A2}°. How long is the second ladder, to the nearest tenth of a foot? Keep full precision until the end.`,
      board: `\\frac{${L}\\sin ${A1}^\\circ}{\\sin ${A2}^\\circ}`, unit: 'ft',
      solution: [`h = ${L} sin ${A1}° = ${h.toFixed(6)}… ft (keep it stored, do not round).`, `length = ${h.toFixed(6)}… ÷ sin ${A2}° = ${L2.toFixed(4)}… ≈ ${S(fx(L2, 1))} ft.`],
      picture: { card: { lines: [`h = ${L} sin ${A1}°`, `length = h ÷ sin ${A2}°`, 'nearest tenth of a foot'] } },
    }, L2, 1, [
      { v: early1, mc: MC.early, say: `Rounding h to ${fx(h, 1)} first shifts the answer. Keep the stored value.` },
      { v: early2, mc: MC.early, say: 'Rounding the sines to two places first shifts the answer.' },
      { v: h, say: 'That is the height h; the question asks for the second ladder.' },
    ], 'Right: full precision, rounded once.', 'Store h, divide by the sine, round once at the end.');
  } catch { return carry(R, n); }
};
export const roundCompare: Gen = (R, n) => {
  const [p1, p2] = shuffle(R, ['Mia', 'Ravi', 'Zoe', 'Theo', 'Nia', 'Sam', 'Eli', 'Jada']).slice(0, 2) as [string, string];
  const fn = pick(R, FNS), th = r(R, 20, 70), k = r(R, 30, 240);
  if (th === 45) return roundCompare(R, n);
  const v = fnD[fn](th), full = rd(k * v, 1);
  // the early product k × (2-place value) in exact hundredths: k × c / 100; round half up in integers (no float tie)
  const c = Math.round(v * 100), hund = k * c, early = (Math.floor(hund / 10) + (hund % 10 >= 5 ? 1 : 0)) / 10;
  if (Math.abs(full - early) < 1e-9 || Math.abs(k * v * 10 - Math.floor(k * v * 10) - 0.5) < 0.08) return roundCompare(R, n);
  return choice(R, {
    id: `roundCompare-${n}`, family: 'roundCompare',
    prompt: `Find ${k} ${fn} ${th}° to the nearest tenth. ${p1} rounds ${fn} ${th}° to ${fx(v, 2)} first and gets ${fx(early, 1)}. ${p2} keeps the full display and gets ${fx(full, 1)}. Who is right?`,
    board: `${k}\\${fn} ${th}^\\circ`,
    solution: [`${fn} ${th}° = ${v.toFixed(6)}…; ${k} × ${v.toFixed(6)}… = ${(k * v).toFixed(3)}… ≈ ${fx(full, 1)}.`, `Rounding to ${fx(v, 2)} first multiplies the rounding error by ${k}.`],
  }, [
    { t: `${p2}: round only the final answer`, ok: true, say: 'Right: rounding early is multiplied by the length.' },
    { t: `${p1}: two decimals are enough for a trig value`, ok: false, mc: MC.early, say: `The error of rounding ${fn} ${th}° is multiplied by ${k}.` },
    { t: 'Both: the difference is only rounding', ok: false, mc: MC.early, say: 'Only one of them answers to the nearest tenth: the other has a rounding error in it.' },
  ], true);
};

// ---------- choose-ratio ----------
export const chooseEq: Gen = (R, n) => fitted('chooseEq', () => {
  let th = r(R, 18, 72);
  if (th === 45) th = 52;
  const roles = pick(R, [['opp', 'hyp'], ['adj', 'hyp'], ['opp', 'adj']] as [Role, Role][]);
  const [known, unk] = R() < 0.5 ? roles : [roles[1], roles[0]];
  const k = r(R, 5, 60);
  const T = trigFig(R, th, { [known]: { text: fmt(k) }, [unk]: { text: 'x', alt: 'x' } }, { text: `${th}°` });
  const fn = fnOf(known, unk);
  const [top, bot] = RATIO[fn];
  const rightTxt = `${fn} ${th}° = ${top === unk ? 'x' : fmt(k)}/${bot === unk ? 'x' : fmt(k)}`;
  const sol = (f: Fn, xTop: boolean) => (xTop ? k * fnD[f](th) : k / fnD[f](th));
  const all = FNS.flatMap(f => [true, false].map(xTop => ({ f, xTop, t: `${f} ${th}° = ${xTop ? 'x' : fmt(k)}/${xTop ? fmt(k) : 'x'}` })));
  const right = all.find(o => o.t === rightTxt)!;
  const wrong = shuffle(R, all.filter(o => o !== right)).slice(0, 3);
  return choice(R, {
    id: `chooseEq-${n}`, family: 'chooseEq',
    prompt: `The angle is ${th}° and the known side is ${fmt(k)}. Which equation finds x? (No need to solve it.)`, board: `${th}^\\circ,\\ ${fmt(k)},\\ x`,
    solution: [`From the ${th}° angle: ${fmt(k)} is the ${known === 'hyp' ? 'hypotenuse' : known === 'opp' ? 'opposite leg' : 'adjacent leg'}, x is the ${unk === 'hyp' ? 'hypotenuse' : unk === 'opp' ? 'opposite leg' : 'adjacent leg'}.`, `${top === 'opp' ? 'Opposite' : 'Adjacent'} and ${bot === 'hyp' ? 'hypotenuse' : 'adjacent'}: ${fnName[fn]}, ${rightTxt}.`],
    picture: { fig: T.fig, reveal: { col: { [T.ids.opp]: 'first', [T.ids.adj]: 'second', [T.ids.hyp]: 'pick' } } },
  }, [right, ...wrong].map(o => ({ t: o.t, ok: o === right, v: sol(o.f, o.xTop), mc: o === right ? undefined : o.f === fn ? MC.inverted : o.f === 'tan' || fn === 'tan' ? MC.habit : MC.byPos, say: o === right ? 'Right.' : o.f === fn ? 'Right ratio, upside down: write the side names first, then put the numbers in.' : `${fnName[o.f]} uses the ${RATIO[o.f][0] === 'opp' ? 'opposite' : 'adjacent'} leg and the ${RATIO[o.f][1] === 'hyp' ? 'hypotenuse' : 'adjacent leg'}. Name the two sides you have from the ${th}° angle.` })));
});
export const chooseFn: Gen = (R, n) => fitted('chooseFn', () => {
  const th = r(R, 18, 72), two = R() < 0.4;
  const roles = pick(R, [['opp', 'hyp'], ['adj', 'hyp'], ['opp', 'adj']] as [Role, Role][]);
  const fn = fnOf(roles[0], roles[1]);
  const third: Role = (['opp', 'adj', 'hyp'] as Role[]).find(x => !roles.includes(x))!;
  if (two) {
    const k1 = r(R, 4, 40), legs = RATIO[fn];
    // two sides given, the angle asked: lengths that fit the angle θ
    const s = { opp: Math.sin((th * Math.PI) / 180), adj: Math.cos((th * Math.PI) / 180), hyp: 1 };
    const kk = k1 / s[legs[1]];
    const v0 = rd(kk * s[legs[0]], 1), v1 = rd(kk * s[legs[1]], 1);
    if (v0 < 2 || v1 < 2) fail();
    const T = trigFig(R, th, { [legs[0]]: { text: fmt(v0) }, [legs[1]]: { text: fmt(v1) } }, { text: 'x°' });
    return choice(R, {
      id: `chooseFn-${n}`, family: 'chooseFn',
      prompt: `The sides ${fmt(v0)} and ${fmt(v1)} are known and the angle x is wanted. Which inverse function finds x in one step?`, board: `${fmt(v0)},\\ ${fmt(v1)},\\ x`,
      solution: [`From x: ${fmt(v0)} is the ${legs[0] === 'opp' ? 'opposite' : 'adjacent'} leg, ${fmt(v1)} is the ${legs[1] === 'hyp' ? 'hypotenuse' : 'adjacent leg'}.`, `So x = ${fn}⁻¹(${fmt(v0)}/${fmt(v1)}).`],
      picture: { fig: T.fig, reveal: { col: { [T.ids.opp]: 'first', [T.ids.adj]: 'second', [T.ids.hyp]: 'pick' } } },
    }, FNS.map(f => ({ t: `${f}⁻¹`, ok: f === fn, mc: f === fn ? undefined : f === fnOf(third, legs[0]) || f === fnOf(third, legs[1]) ? MC.second : MC.habit, say: f === fn ? 'Right.' : `${f}⁻¹ needs the ${RATIO[f][0] === 'opp' ? 'opposite' : 'adjacent'} leg and the ${RATIO[f][1] === 'hyp' ? 'hypotenuse' : 'adjacent leg'}; one of them is not given.` })), true);
  }
  const [known, unk] = R() < 0.5 ? roles : [roles[1], roles[0]];
  const T = trigFig(R, th, { [known]: { text: fmt(r(R, 5, 60)) }, [unk]: { text: 'x' } }, { text: `${th}°` });
  return choice(R, {
    id: `chooseFn-${n}`, family: 'chooseFn',
    prompt: `Which function links the ${th}° angle, the known side and x, with no second unknown?`, board: `${th}^\\circ,\\ x`,
    solution: [`From the ${th}° angle the two sides in play are the ${roles.map(x => (x === 'hyp' ? 'hypotenuse' : x === 'opp' ? 'opposite leg' : 'adjacent leg')).join(' and the ')}.`, `That pair is ${fnName[fn]}.`],
    picture: { fig: T.fig, reveal: { col: { [T.ids.opp]: 'first', [T.ids.adj]: 'second', [T.ids.hyp]: 'pick' } } },
  }, FNS.map(f => ({ t: fnName[f], ok: f === fn, mc: f === fn ? undefined : MC.second, say: f === fn ? 'Right.' : `${fnName[f]} would bring in the ${third === 'hyp' ? 'hypotenuse' : third === 'opp' ? 'opposite leg' : 'adjacent leg'}, a second unknown.` })), true);
});

// ---------- side-unknown-numerator / denominator ----------
function sideItem(fam: string, top: boolean, eq: boolean): Gen {
  return (R, n) => fitted(fam, () => {
    const th = angLab(R), unit = pick(R, UNITS), k = unit === 'cm' || unit === 'in' ? r(R, 12, 90) : r(R, 6, 60) + pick(R, [0, 0, 0.5]);
    // top: x on top (x = k·f); else x below (x = k / f)
    const fn = pick(R, FNS);
    const [tR, bR] = RATIO[fn];
    const known = top ? bR : tR, unk = top ? tR : bR;
    const f = fnD[fn](th), x = top ? k * f : k / f;
    const eqT = top ? `${fn} ${fmt(th)}° = x/${fmt(k)}` : `${fn} ${fmt(th)}° = ${fmt(k)}/x`;
    const wrong: NumWrong[] = [
      { v: top ? k / f : k * f, mc: top ? MC.wrongWay : (unk === 'hyp' ? MC.noSize : MC.wrongWay), say: top ? `x is on top: multiply both sides by ${fmt(k)}, x = ${fmt(k)} ${fn} ${fmt(th)}°.` : `x is in the denominator: x = ${fmt(k)} ÷ ${fn} ${fmt(th)}°.${unk === 'hyp' ? ' A hypotenuse must be longer than a leg.' : ''}` },
      { v: top ? k * fnR[fn](th) : k / fnR[fn](th), mc: MC.mode, say: 'That is a radian-mode answer. Switch to degree mode.' },
      { v: top ? fnD[fn](k * th) : 0, mc: MC.pullOut, say: `${fmt(k)} ${fn} ${fmt(th)}° means ${fmt(k)} × (${fn} ${fmt(th)}°), not ${fn} of ${fmt(k)} × ${fmt(th)}.` },
    ].filter(w => w.v > 0);
    const steps = top
      ? [`${eqT}. Multiply both sides by ${fmt(k)}: x = ${fmt(k)} ${fn} ${fmt(th)}°.`, `x = ${fmt(k)} × ${f.toFixed(6)}… ≈ ${S(fx(x, 1))} ${unit}.`]
      : [`${eqT}. Multiply by x, then divide by ${fn} ${fmt(th)}°: x = ${fmt(k)} ÷ ${fn} ${fmt(th)}°.`, `x = ${fmt(k)} ÷ ${f.toFixed(6)}… ≈ ${S(fx(x, 1))} ${unit}.`];
    if (eq) return numR({
      id: `${fam}-${n}`, family: fam,
      prompt: `Solve for x: ${eqT} (a length in ${({ ft: 'feet', in: 'inches', m: 'meters', cm: 'centimeters' } as Record<string, string>)[unit] ?? unit}). Give x to the nearest tenth.`, board: top ? `\\${fn} ${fmt(th)}^\\circ = \\frac{x}{${fmt(k)}}` : `\\${fn} ${fmt(th)}^\\circ = \\frac{${fmt(k)}}{x}`, unit,
      solution: steps, picture: { card: { lines: [eqT, 'x to the nearest tenth'] } },
    }, x, 1, wrong, 'Right.', top ? 'Undo the division: multiply both sides by the number under x.' : 'x is in the denominator: x = number ÷ trig value.');
    const T = trigFig(R, th, { [known]: { text: `${fmt(k)} ${unit}` }, [unk]: { text: 'x', alt: `${fx(x, 1)} ${unit}` } }, { text: `${fmt(th)}°` });
    return numR({
      id: `${fam}-${n}`, family: fam,
      prompt: `Find x to the nearest tenth of ${unit === 'ft' ? 'a foot' : unit === 'in' ? 'an inch' : unit === 'm' ? 'a meter' : 'a centimeter'}.`, board: top ? `\\${fn} ${fmt(th)}^\\circ = \\frac{x}{${fmt(k)}}` : `\\${fn} ${fmt(th)}^\\circ = \\frac{${fmt(k)}}{x}`, unit,
      solution: [`From the ${fmt(th)}° angle: x is the ${unk === 'hyp' ? 'hypotenuse' : unk === 'opp' ? 'opposite leg' : 'adjacent leg'}, ${fmt(k)} the ${known === 'hyp' ? 'hypotenuse' : known === 'opp' ? 'opposite leg' : 'adjacent leg'}: ${fnName[fn]}.`, ...steps],
      picture: { fig: T.fig, reveal: { solved: [T.ids[unk]], col: { [T.ids[known]]: 'first' } } },
    }, x, 1, wrong, 'Right.', `Name the two sides from the ${fmt(th)}° angle, pick the ratio, then solve.`);
  });
}
export const sideNum = sideItem('sideNum', true, false);
export const sideNumEq = sideItem('sideNumEq', true, true);
export const sideDen = sideItem('sideDen', false, false);
export const sideDenEq = sideItem('sideDenEq', false, true);

// ---------- inverse-meaning ----------
export const invTable: Gen = (R, n) => {
  const fn = pick(R, FNS), th = r(R, 1, 8) * 10;
  const rows = [10, 20, 30, 40, 50, 60, 70, 80].map(d => `${fn} ${d}° ≈ ${fnD[fn](d).toFixed(4)}`);
  const v = Number(fnD[fn](th).toFixed(4));
  return choice(R, {
    id: `invTable-${n}`, family: 'invTable',
    prompt: `Use the table (no calculator). What is ${fn}⁻¹(${v.toFixed(4)})?`, board: `\\${fn}^{-1}(${v.toFixed(4)})`,
    solution: [`${fn}⁻¹(${v.toFixed(4)}) asks: which acute angle has ${fn} = ${v.toFixed(4)}?`, `The table row ${fn} ${th}° ≈ ${v.toFixed(4)} answers it: ${th}°.`],
    picture: { card: { lines: rows } },
  }, [
    { t: `${th}°`, ok: true, v: th, say: 'Right: the angle whose ratio is that value.' },
    { t: (1 / v).toFixed(4), ok: false, v: 1 / v, mc: MC.reciprocal, say: `⁻¹ here means "the inverse function", not 1 ÷ ${fn}.` },
    { t: fnD[fn](v).toFixed(4), ok: false, v: fnD[fn](v), mc: MC.forward, say: `That is ${fn} of ${v.toFixed(4)}°: the forward function. The inverse goes from the ratio back to the angle.` },
    { t: `${90 - th}°`, ok: false, v: 90 - th, mc: MC.cofMisuse, say: `Read across the table: the row with ${fn} ≈ ${v.toFixed(4)} is ${th}°, not ${90 - th}°.` },
  ].filter(o => o.ok || o.v !== th));
};
export const invMeaning: Gen = (R, n) => {
  const fn = pick(R, FNS), x = fn === 'tan' ? r(R, 3, 40) / 10 : r(R, 12, 95) / 100;
  if (R() < 0.5) return choice(R, {
    id: `invMeaning-${n}`, family: 'invMeaning',
    prompt: `What does ${fn}⁻¹(${fmt(x)}) mean?`, board: `\\${fn}^{-1}(${fmt(x)})`,
    solution: [`${fn}⁻¹ undoes ${fn}: it takes a ratio and gives back an angle.`, `${fn}⁻¹(${fmt(x)}) is the acute angle whose ${fnName[fn]} is ${fmt(x)}.`],
  }, [
    { t: `The acute angle whose ${fnName[fn]} is ${fmt(x)}`, ok: true, say: 'Right.' },
    { t: `1 ÷ ${fn}(${fmt(x)})`, ok: false, mc: MC.reciprocal, say: 'The −1 names the inverse function, not a reciprocal.' },
    { t: `The ${fnName[fn]} of ${aN(fmt(x))}° angle`, ok: false, mc: MC.forward, say: 'That is the forward function. The inverse goes from the ratio back to the angle.' },
    { t: `${fmt(x)} × ${fn}(−1)`, ok: false, mc: MC.fx, say: `${fn}⁻¹ is one function name, not a product.` },
  ]);
  const s = r(R, 105, 180) / 100, c = r(R, 15, 95) / 100, t = r(R, 15, 60) / 10, bad = pick(R, ['sin', 'cos'] as const);
  return choice(R, {
    id: `invMeaning-${n}`, family: 'invMeaning',
    prompt: 'Which one has NO acute angle as its answer?', board: '\\text{inverse inputs}',
    solution: ['sin⁻¹ and cos⁻¹ need a ratio strictly between 0 and 1 (a leg over the hypotenuse).', 'tan⁻¹ takes any positive number (a leg over a leg).'],
  }, [
    { t: `${bad}⁻¹(${fmt(s)})`, ok: true, say: `Right: ${fmt(s)} > 1, and a leg cannot be longer than the hypotenuse.` },
    { t: `${bad === 'sin' ? 'cos' : 'sin'}⁻¹(${fmt(c)})`, ok: false, say: `${fmt(c)} is between 0 and 1: there is such an angle.` },
    { t: `tan⁻¹(${fmt(t)})`, ok: false, mc: MC.tanBounded, say: 'Tangent can be any positive number: a tall triangle.' },
  ]);
};

// ---------- inverse-calc ----------
function invItem(fam: string, eq: boolean): Gen {
  return (R, n) => fitted(fam, () => {
    const fn = pick(R, FNS), [tR, bR] = RATIO[fn];
    let p = r(R, 3, 40), qq = r(R, 3, 40);
    if (R() < 0.3) { p += 0.5; }
    if (bR === 'hyp' && p >= qq) [p, qq] = [Math.min(p, qq), Math.max(p, qq)];
    if (Math.abs(p - qq) < 1 || (bR === 'hyp' && p / qq > 0.97)) fail();
    const th = invD[fn](p / qq);
    if (th < 12 || th > 78) fail();
    const a = rnd(th, 1);
    const wrong: NumWrong[] = [
      { v: 90 - th, mc: MC.inverted, say: 'That is the other acute angle. Name the sides from the marked angle.' },
      { v: p / qq, mc: MC.ratioAsAngle, say: `${fmt(p)}/${fmt(qq)} is the ratio, not the angle: use ${fn}⁻¹.` },
      { v: fnD[fn](p / qq), mc: MC.forward, say: `Use the inverse key ${fn}⁻¹, not ${fn}.` },
      { v: invD[fn](p / qq) * Math.PI / 180, mc: MC.mode, say: 'That is in radians. Switch to degree mode.' },
      ...(fn === 'tan' ? [] : [{ v: invD[fn === 'sin' ? 'cos' : 'sin'](p / qq), mc: MC.byPos, say: `Wrong inverse key: the sides are ${tR === 'opp' ? 'opposite' : 'adjacent'} and hypotenuse, ${fnName[fn]}.` }]),
    ];
    if (fn === 'tan') wrong.push({ v: atanD(qq / p), mc: MC.inverted, say: 'Opposite over adjacent: that ratio is upside down.' });
    const steps = [`${fn} x = ${fmt(p)}/${fmt(qq)}, so x = ${fn}⁻¹(${fmt(p)}/${fmt(qq)}).`, `x = ${th.toFixed(4)}…° ≈ ${S(fx(th, 1))}°.`];
    if (eq) return numR({
      id: `${fam}-${n}`, family: fam,
      prompt: `x is an acute angle with ${fn} x = ${fmt(p)}/${fmt(qq)}. Find x to the nearest tenth of a degree.`, board: `\\${fn} x = \\frac{${fmt(p)}}{${fmt(qq)}}`, unit: '°',
      solution: steps, picture: { card: { lines: [`${fn} x = ${fmt(p)}/${fmt(qq)}`, 'x to the nearest tenth of a degree'] } },
    }, th, 1, wrong, 'Right.', `Use ${fn}⁻¹ on the full ratio, in degree mode.`);
    const T = trigFig(R, th, { [tR]: { text: fmt(p) }, [bR]: { text: fmt(qq) } }, { text: 'x°', alt: `${fx(th, 1)}°` });
    return numR({
      id: `${fam}-${n}`, family: fam,
      prompt: 'Find the angle x to the nearest tenth of a degree.', board: `\\${fn} x = \\frac{${fmt(p)}}{${fmt(qq)}}`, unit: '°',
      solution: [`From x: ${fmt(p)} is the ${tR === 'opp' ? 'opposite' : 'adjacent'} leg, ${fmt(qq)} the ${bR === 'hyp' ? 'hypotenuse' : 'adjacent leg'}: ${fnName[fn]}.`, ...steps],
      picture: { fig: T.fig, reveal: { solved: [] } },
    }, th, 1, wrong, 'Right.', 'Name the two given sides from x, then use the inverse key.');
  });
}
export const invCalc = invItem('invCalc', false);
export const invEq = invItem('invEq', true);

// ---------- solve-complete-triangle ----------
export const solveAll: Gen = (R, n) => fitted('solveAll', () => {
  const unit = pick(R, ['ft', 'in', 'm', 'cm']);
  const th = r(R, 20, 70), c = r(R, 8, 60);
  const nm = letters(R), [A, B] = [nm[0]!, nm[1]!];
  const ask = pick(R, ['a', 'b'] as const);   // a = BC (opposite A), b = AC (adjacent to A)
  const side = ask === 'a' ? c * Math.sin((th * Math.PI) / 180) : c * Math.cos((th * Math.PI) / 180);
  const sv = rnd(side, 1);
  const fig = rtFig({ names: nm, a: Math.sin((th * Math.PI) / 180), b: Math.cos((th * Math.PI) / 180), rot: pick(R, TURNS), flip: R() < 0.5, lab: { c: { text: `${c} ${unit}` }, [ask]: { text: ask, alt: `${fx(side, 1)} ${unit}` } }, angA: { text: `${th}°` }, angB: { text: '?', alt: `${90 - th}°` } });
  const sideName = ask === 'a' ? `${B}${nm[2]}` : `${A}${nm[2]}`;
  const ansB = 90 - th;
  const base = {
    id: `solveAll-${n}`, family: 'solveAll',
    prompt: `Right angle at ${nm[2]}, ${angN(A)} = ${th}°, hypotenuse ${A}${B} = ${c} ${unit}. Find ${angN(B)} and ${sideName} = ${ask} (nearest tenth).`,
    board: `\\angle ${B} = \\,?,\\ ${ask} = \\,?`, input: 'pair' as const, pairLead: `${angN(B)} =`, pairOp: `°,&nbsp; ${ask} =`, pairTail: unit,
    solution: [`Angle sum: ${angN(B)} = 90° − ${th}° = ${ans(ansB)}°.`, `${ask === 'a' ? `sin ${th}° = ${ask}/${c}` : `cos ${th}° = ${ask}/${c}`}, so ${ask} = ${c} ${ask === 'a' ? 'sin' : 'cos'} ${th}° ≈ ${ans(fx(side, 1))} ${unit}.`],
    picture: { fig, reveal: { solved: [sideId(nm, ask), nm[0]! + nm[1]! + nm[2]!] } },
    answer: { kind: 'pair', x: ansB, y: sv } as Response,
  };
  return {
    ...base,
    check: (resp: Response): Verdict => {
      if (resp.kind !== 'pair' || !Number.isFinite(resp.x) || !Number.isFinite(resp.y)) return { ok: false, say: 'Fill in both boxes.' };
      const okB = Math.abs(resp.x - ansB) < 1e-9, okS = Math.abs(resp.y - sv) < 1e-9;
      if (okB && okS) return { ok: true, say: 'Right: angle sum for the angle, one trig ratio for the side.' };
      if (!okB && Math.abs(resp.x - th) < 1e-9) return { ok: false, mc: MC.oneEq, say: `${angN(B)} is the other acute angle: 90° − ${th}°.` };
      if (!okB) return { ok: false, say: `The acute angles add to 90°: ${angN(B)} = 90° − ${th}°.` };
      const other = rd(ask === 'a' ? c * Math.cos((th * Math.PI) / 180) : c * Math.sin((th * Math.PI) / 180), 1);
      if (Math.abs(resp.y - other) < 1e-9) return { ok: false, mc: MC.byPos, say: `${ask} is ${ask === 'a' ? 'opposite' : 'adjacent to'} ${angN(A)}: use ${ask === 'a' ? 'sine' : 'cosine'}.` };
      return { ok: false, say: `The angle is right. For ${ask}: ${ask === 'a' ? 'opposite' : 'adjacent'} and hypotenuse, ${ask === 'a' ? 'sine' : 'cosine'}.` };
    },
  } as GFItem;
});
export const solvePlan: Gen = (R, n) => {
  const v = r(R, 0, 2), nm = letters(R), [A, B, C] = [...nm] as [string, string, string];
  if (v === 0) { const a1 = r(R, 20, 70); return choice(R, { id: `solvePlan-${n}`, family: 'solvePlan', prompt: `Right triangle ${nm}: ${angN(C)} = 90°, ${angN(A)} = ${a1}°, ${angN(B)} = ${90 - a1}°. No side is known. Can you find the sides?`, board: `\\angle ${A} = ${a1}^\\circ`, solution: ['Angles fix the shape (AA), not the size: every similar copy has the same angles.', 'Without one length the sides cannot be found.'] }, [
    { t: 'No: the angles fix the shape, not the size; one length is needed', ok: true, say: 'Right.' },
    { t: `Yes: sin ${a1}° gives the opposite side`, ok: false, mc: MC.oneEq, say: `sin ${a1}° gives a RATIO of two sides; without one length there is no size.` },
    { t: 'Yes: use the Pythagorean theorem', ok: false, mc: MC.oneEq, say: 'The Pythagorean theorem needs two sides.' },
  ]); }
  if (v === 1) { const t = pick(R, TRIPLES), k = r(R, 1, 4); return choice(R, { id: `solvePlan-${n}`, family: 'solvePlan', prompt: `Right triangle ${nm}: legs ${B}${C} = ${t[0] * k} and ${A}${C} = ${t[1] * k}. What is the most direct way to the hypotenuse?`, board: `${t[0] * k},\\ ${t[1] * k},\\ ?`, solution: ['Two sides known, the third side wanted: the Pythagorean theorem in one step.', `√(${t[0] * k}² + ${t[1] * k}²) = ${t[2] * k}.`] }, [
    { t: 'The Pythagorean theorem', ok: true, say: 'Right: two sides give the third.' },
    { t: 'Find an angle with tan⁻¹, then use sine', ok: false, mc: MC.trigAll, say: 'That works, but with two extra steps and rounding. The Pythagorean theorem is direct.' },
    { t: 'The angle sum', ok: false, mc: MC.oneEq, say: 'The angle sum finds angles, not sides.' },
  ]); }
  const a1 = r(R, 20, 70), c = r(R, 8, 40);
  return choice(R, { id: `solvePlan-${n}`, family: 'solvePlan', prompt: `Right triangle ${nm}: ${angN(C)} = 90°, ${angN(A)} = ${a1}°, hypotenuse ${A}${B} = ${c}. What is the most direct way to ${angN(B)}?`, board: `\\angle ${B} = \\,?`, solution: ['The acute angles of a right triangle add to 90°.', `${angN(B)} = 90° − ${a1}° = ${90 - a1}°: no trig needed.`] }, [
    { t: `The angle sum: 90° − ${a1}°`, ok: true, say: 'Right.' },
    { t: 'Find a leg with sine, then use an inverse key', ok: false, mc: MC.trigAll, say: 'Two trig steps for something the angle sum gives at once.' },
    { t: 'The Pythagorean theorem', ok: false, mc: MC.oneEq, say: 'The Pythagorean theorem gives sides, and needs two of them.' },
  ]);
};

// ---------- special right triangles ----------
/** a square PQRS cut by the diagonal PR (side label on two sides, the diagonal label) */
export function squareFig(side: string, diag: string): Fig {
  const P: Record<string, [number, number]> = { P: [0, 0], Q: [300, 0], R: [300, 300], S: [0, 300] };
  return figOf(P, ['PQ', 'QR', 'RS', 'SP', 'PR'], { labs: [{ seg: 'PQ', text: side }, { seg: 'QR', text: side }, { seg: 'PR', text: diag }].filter(l => l.text), marks: [{ ang: 'PQR', box: true }, { ang: 'RSP', box: true }, { ang: 'QPR', n: 1, text: '45°' }], fills: ['PQR'], segStyle: { PR: { side: 1 } } });
}
/** an equilateral triangle ABC cut by the altitude AD (side labels on AB, half the base on BD, the altitude) */
export function equiFig(side: string, half: string, alt: string): Fig {
  const s = 340, P: Record<string, [number, number]> = { B: [0, 0], C: [s, 0], A: [s / 2, (s * Math.sqrt(3)) / 2], D: [s / 2, 0] };
  return figOf(P, ['AB', 'AC', 'BD', 'DC', 'AD'], { labs: [{ seg: 'AB', text: side }, { seg: 'BD', text: half }, { seg: 'AD', text: alt }].filter(l => l.text), marks: [{ ang: 'ADB', box: true }, { ang: 'ABD', n: 1, text: '60°' }, { ang: 'BAD', n: 2, text: '30°' }], fills: ['ABD'], segStyle: { AD: { dash: true, side: 1 }, BD: { side: -1 } } });
}
/** a 45-45-90 or 30-60-90 triangle figure: legs drawn true; `labs` by role (short = opposite 30°) */
function specialFig(R: () => number, kind: 45 | 30, labs: { short?: string; long?: string; hyp?: string; leg1?: string; leg2?: string }, alts: { short?: string; long?: string; hyp?: string; leg1?: string; leg2?: string } = {}): Fig {
  const nm = letters(R);
  if (kind === 45) return rtFig({ names: nm, a: 1, b: 1, rot: pick(R, TURNS), flip: R() < 0.5, lab: { a: labs.leg1 ? { text: labs.leg1, alt: alts.leg1 } : undefined, b: labs.leg2 ? { text: labs.leg2, alt: alts.leg2 } : undefined, c: labs.hyp ? { text: labs.hyp, alt: alts.hyp } : undefined }, angA: { text: '45°' }, angB: null });
  // A = 30°: a (opposite A) = short, b = long
  return rtFig({ names: nm, a: 1, b: Math.sqrt(3), rot: pick(R, TURNS), flip: R() < 0.5, lab: { a: labs.short ? { text: labs.short, alt: alts.short } : undefined, b: labs.long ? { text: labs.long, alt: alts.long } : undefined, c: labs.hyp ? { text: labs.hyp, alt: alts.hyp } : undefined }, angA: { text: '30°' }, angB: { text: '60°' } });
}
const radOpts = (right: Rad, wrongs: { x: Rad; mc?: string; say: string }[]) => [
  { t: radS(right), ok: true, v: radV(right), say: 'Right.' },
  ...wrongs.map(w => ({ t: radS(w.x), ok: false, v: radV(w.x), mc: w.mc, say: w.say })),
];
export const specialDerive: Gen = (R, n) => {
  const s = r(R, 2, 15);
  if (R() < 0.5) return choice(R, {
    id: `specialDerive-${n}`, family: 'specialDerive',
    prompt: `A square with side ${s} is cut along a diagonal into two 45-45-90 triangles. How long is the diagonal, exactly?`, board: `${s}^2 + ${s}^2 = d^2`,
    solution: [`The legs are ${s} and ${s}: d² = ${s}² + ${s}² = 2·${s}² = ${2 * s * s}.`, `d = √(2·${s}²) = ${s}√2.`],
    picture: { fig: squareFig(String(s), 'd') },
  }, radOpts({ k: s, r: 2 }, [
    { x: { k: 2 * s, r: 1 }, mc: MC.additive, say: `The diagonal is not ${s} + ${s}: use the Pythagorean theorem.` },
    { x: { k: s, r: 3 }, mc: MC.swapped, say: '√3 belongs to the 30-60-90 triangle; two equal legs give √2.' },
    { x: { k: s * s, r: 1 }, say: `${s}² is the area of the square, not the diagonal.` },
  ]));
  const half = s;
  return choice(R, {
    id: `specialDerive-${n}`, family: 'specialDerive',
    prompt: `An equilateral triangle with side ${2 * half} is cut by an altitude into two 30-60-90 triangles. How long is the altitude, exactly?`, board: `${half}^2 + h^2 = ${2 * half}^2`,
    solution: [`The altitude bisects the base: the short leg is ${half}, the hypotenuse ${2 * half}.`, `h² = ${2 * half}² − ${half}² = 3·${half}², so h = ${half}√3.`],
    picture: { fig: equiFig(String(2 * half), String(half), 'h') },
  }, radOpts({ k: half, r: 3 }, [
    { x: { k: half, r: 2 }, mc: MC.swapped, say: '√2 belongs to the 45-45-90 triangle.' },
    { x: { k: 2 * half, r: 3 }, mc: MC.unanchored, say: `The short leg is ${half} (half the base), so the long leg is ${half}√3.` },
    { x: { k: half, r: 1 }, mc: MC.halves, say: 'Half the base is the short leg; the altitude is the long leg.' },
  ]));
};
export const specialFwd: Gen = (R, n) => fitted('specialFwd', () => {
  if (R() < 0.35) {
    const s = r(R, 2, 20);
    return choice(R, {
      id: `specialFwd-${n}`, family: 'specialFwd',
      prompt: `A 45-45-90 triangle has legs ${s}. How long is the hypotenuse, exactly?`, board: `${s} : ${s} : ?`,
      solution: ['45-45-90: legs : hypotenuse = 1 : 1 : √2.', `Hypotenuse = ${s}√2.`],
      picture: { fig: specialFig(R, 45, { leg1: String(s), leg2: String(s), hyp: '?' }, { hyp: `${s}√2` }) },
    }, radOpts({ k: s, r: 2 }, [{ x: { k: 2 * s, r: 1 }, mc: MC.additive, say: 'Not leg + leg: × √2.' }, { x: { k: s, r: 3 }, mc: MC.swapped, say: '√3 belongs to the 30-60-90 triangle.' }, { x: { k: s / 2, r: 2 }, mc: MC.halves, say: 'The hypotenuse is the longest side: multiply the leg by √2.' }]));
  }
  // 30-60-90 from the short leg: a whole number or k√3
  const radGiven = R() < 0.3, k = r(R, 2, 12);
  const short: Rad = radGiven ? { k, r: 3 } : { k, r: 1 };
  const long: Rad = radGiven ? { k: 3 * k, r: 1 } : { k, r: 3 };
  const hyp: Rad = { k: 2 * k, r: short.r };
  const askLong = R() < 0.5;
  const right = askLong ? long : hyp, other = askLong ? hyp : long;
  return choice(R, {
    id: `specialFwd-${n}`, family: 'specialFwd',
    prompt: `In a 30-60-90 triangle the short leg (opposite 30°) is ${radS(short)}. How long is the ${askLong ? 'long leg' : 'hypotenuse'}, exactly?`, board: `1 : \\sqrt{3} : 2`,
    solution: ['30-60-90: short : long : hypotenuse = 1 : √3 : 2.', `${askLong ? `Long leg = ${radS(short)} × √3` : `Hypotenuse = 2 × ${radS(short)}`} = ${radS(right)}.`],
    picture: { fig: specialFig(R, 30, { short: radS(short), long: askLong ? '?' : '', hyp: askLong ? '' : '?' }, askLong ? { long: radS(long) } : { hyp: radS(hyp) }) },
  }, radOpts(right, [
    { x: other, mc: MC.swapped, say: `That is the ${askLong ? 'hypotenuse (2 × short)' : 'long leg (√3 × short)'}.` },
    { x: { k: short.k, r: 2 }, mc: MC.unanchored, say: '√2 belongs to the 45-45-90 triangle.' },
    { x: askLong ? { k: short.k * 3, r: short.r === 1 ? 1 : 3 } : { k: short.k * 2, r: (short.r === 3 ? 1 : 3) as 1 | 3 }, mc: MC.unanchored, say: 'Match each coefficient to its side: short × √3 = long, short × 2 = hypotenuse.' },
  ]));
});
export const specialRev: Gen = (R, n) => fitted('specialRev', () => {
  const v = r(R, 0, 2);
  if (v === 0) {
    const radHyp = R() < 0.4, k = r(R, 2, 12) * (radHyp ? 1 : 2);
    const hyp: Rad = radHyp ? { k, r: 2 } : { k, r: 1 };
    const leg: Rad = radHyp ? { k, r: 1 } : { k: k / 2, r: 2 };
    return choice(R, {
      id: `specialRev-${n}`, family: 'specialRev',
      prompt: `A 45-45-90 triangle has hypotenuse ${radS(hyp)}. How long is each leg, exactly?`, board: `x\\sqrt{2} = ${radT(hyp)}`,
      solution: ['Leg × √2 = hypotenuse, so leg = hypotenuse ÷ √2.', `${radS(hyp)} ÷ √2 = ${radS(leg)}${radHyp ? '' : ` (rationalized: ${k}/√2 = ${k}√2/2)`}.`],
      picture: { fig: specialFig(R, 45, { leg1: '?', hyp: radS(hyp) }, { leg1: radS(leg) }) },
    }, radOpts(leg, [
      { x: { k: hyp.k / 2, r: hyp.r }, mc: MC.halves, say: 'Halving works for the 30-60-90 short leg, not here: divide by √2.' },
      { x: hyp.r === 2 ? { k: hyp.k * 2, r: 1 } : { k: hyp.k, r: 2 }, mc: MC.swapped, say: 'Multiplying by √2 goes from a leg to the hypotenuse; here go back: ÷ √2.' },
      { x: { k: hyp.k / 2, r: 3 }, mc: MC.swapped, say: '√3 belongs to the 30-60-90 triangle.' },
    ]));
  }
  if (v === 1) {
    const k = r(R, 2, 12), hyp: Rad = { k: 2 * k, r: 1 };
    const askLong = R() < 0.5, right: Rad = askLong ? { k, r: 3 } : { k, r: 1 };
    return choice(R, {
      id: `specialRev-${n}`, family: 'specialRev',
      prompt: `A 30-60-90 triangle has hypotenuse ${2 * k}. How long is the ${askLong ? 'long leg (opposite 60°)' : 'short leg (opposite 30°)'}, exactly?`, board: '1 : \\sqrt{3} : 2',
      solution: [`Short leg = hypotenuse ÷ 2 = ${k}.`, askLong ? `Long leg = ${k} × √3 = ${k}√3.` : `So the short leg is ${k}.`],
      picture: { fig: specialFig(R, 30, { hyp: String(2 * k), short: askLong ? '' : '?', long: askLong ? '?' : '' }, askLong ? { long: `${k}√3` } : { short: String(k) }) },
    }, radOpts(right, [
      { x: askLong ? { k, r: 1 } : { k, r: 3 }, mc: MC.swapped, say: 'The short leg is opposite 30°, the long leg opposite 60°.' },
      { x: { k: 2 * k, r: 3 }, mc: MC.unanchored, say: 'The hypotenuse is 2 × short, not the short leg.' },
      { x: { k, r: 2 }, mc: MC.unanchored, say: '√2 belongs to the 45-45-90 triangle.' },
    ]));
  }
  const k = r(R, 2, 10), L = 3 * k;   // long leg 3k: short leg k√3, hypotenuse 2k√3
  const askHyp = R() < 0.4;
  const right: Rad = askHyp ? { k: 2 * k, r: 3 } : { k, r: 3 };
  return choice(R, {
    id: `specialRev-${n}`, family: 'specialRev',
    prompt: `A 30-60-90 triangle has long leg ${L}. How long is the ${askHyp ? 'hypotenuse' : 'short leg'}, exactly? (Rationalize.)`, board: `x\\sqrt{3} = ${L}`,
    solution: [`Short leg = ${L} ÷ √3 = ${L}√3/3 = ${k}√3.`, askHyp ? `Hypotenuse = 2 × ${k}√3 = ${2 * k}√3.` : `So the short leg is ${k}√3.`],
    picture: { fig: specialFig(R, 30, { long: String(L), short: askHyp ? '' : '?', hyp: askHyp ? '?' : '' }, askHyp ? { hyp: `${2 * k}√3` } : { short: `${k}√3` }) },
  }, radOpts(right, [
    { x: { k: L, r: 3 }, mc: MC.swapped, say: 'Long leg = short × √3, so go back by dividing by √3, not multiplying.' },
    { x: { k: askHyp ? 2 * k : k, r: 1 }, mc: MC.unanchored, say: `${L} ÷ √3 is not ${L} ÷ 3.` },
    { x: { k: askHyp ? L : L / 2, r: 1 }, mc: MC.halves, say: 'Halving gives the short leg from the hypotenuse, not from the long leg.' },
  ]));
});
export const specialRevNum: Gen = (R, n) => {
  if (R() < 0.5) {
    const d = r(R, 8, 30), s = d / Math.SQRT2;
    try {
      return numR({
        id: `specialRevNum-${n}`, family: 'specialRevNum',
        prompt: `A square floor tile measures ${d} in along its diagonal. How long is its side, to the nearest tenth of an inch?`, board: `s\\sqrt{2} = ${d}`, unit: 'in',
        solution: ['The diagonal cuts the square into two 45-45-90 triangles: side × √2 = diagonal.', `s = ${d} ÷ √2 = ${d}√2/2 ≈ ${S(fx(s, 1))} in.`],
        picture: { fig: squareFig('s', `${d} in`) },
      }, s, 1, [{ v: d / 2, mc: MC.halves, say: 'Halving the diagonal is the 30-60-90 move; here divide by √2.' }, { v: d * Math.SQRT2, mc: MC.swapped, say: 'The side is shorter than the diagonal: divide by √2.' }], 'Right.', 'Side × √2 = diagonal.');
    } catch { return specialRevNum(R, n); }
  }
  const h = r(R, 4, 24), s = (2 * h) / Math.sqrt(3);
  try {
    return numR({
      id: `specialRevNum-${n}`, family: 'specialRevNum',
      prompt: `An equilateral roof truss is ${h} ft tall (its altitude). How long is each side, to the nearest tenth of a foot?`, board: `\\tfrac{s}{2}\\sqrt{3} = ${h}`, unit: 'ft',
      solution: [`The altitude is the long leg of a 30-60-90 triangle with short leg s/2: (s/2)√3 = ${h}.`, `s = 2 × ${h}/√3 ≈ ${S(fx(s, 1))} ft.`],
      picture: { fig: equiFig('s', '', String(h)) },
    }, s, 1, [{ v: h * Math.sqrt(3), mc: MC.swapped, say: 'The side is the hypotenuse: 2 × (short leg), and the short leg is the altitude ÷ √3.' }, { v: 2 * h, mc: MC.unanchored, say: 'The altitude is the long leg, not the short leg.' }, { v: h / Math.sqrt(3), mc: MC.unanchored, say: 'That is the short leg (half a side).' }], 'Right.', 'Altitude = long leg; side = hypotenuse.');
  } catch { return specialRevNum(R, n); }
};

// ---------- exact-trig-values ----------
const EXACT: Record<string, { t: string; v: number }> = {
  half: { t: '1/2', v: 0.5 }, r2: { t: '√2/2', v: Math.SQRT1_2 }, r3h: { t: '√3/2', v: Math.sqrt(3) / 2 }, r3: { t: '√3', v: Math.sqrt(3) }, r3t: { t: '√3/3', v: Math.sqrt(3) / 3 }, one: { t: '1', v: 1 }, two: { t: '2', v: 2 },
};
const exactOf = (f: Fn, d: number) => { const v = fnD[f](d); return Object.values(EXACT).find(e => Math.abs(e.v - v) < 1e-9)!; };
export const exactVal: Gen = (R, n) => {
  const f = pick(R, FNS), d = pick(R, [30, 45, 60]), ltr = R() < 0.6 ? letters(R) : '';
  const right = exactOf(f, d);
  const tri = d === 45 ? '45-45-90 (1 : 1 : √2)' : '30-60-90 (1 : √3 : 2, short leg opposite 30°)';
  const others = [...FNS.filter(g => g !== f).map(g => ({ e: exactOf(g, d), mc: MC.swapped })), ...[30, 45, 60].filter(x => x !== d).map(x => ({ e: exactOf(f, x), mc: MC.swapped })), { e: EXACT.two!, mc: MC.inverted }];
  return choice(R, {
    id: `exactVal-${n}`, family: 'exactVal',
    prompt: ltr ? `No calculator: in right triangle ${ltr} (right angle at ${ltr[2]}), ${angN(ltr[0]!)} = ${d}°. What is ${f} ${ltr[0]} exactly?` : `No calculator: what is ${f} ${d}° exactly?`, board: `\\${f} ${d}^\\circ`,
    solution: [`Use the ${tri} triangle.`, `${f} ${d}° = ${RATIO[f][0] === 'opp' ? 'opposite' : 'adjacent'}/${RATIO[f][1] === 'hyp' ? 'hypotenuse' : 'adjacent'} = ${right.t}.`],
  }, [{ t: right.t, ok: true, v: right.v, say: 'Right: read it off the triangle.' }, ...shuffle(R, others).map(o => ({ t: o.e.t, ok: false, v: o.e.v, mc: o.mc, say: `That is a value for a different angle or ratio. Draw the ${tri} triangle and read ${f} ${d}° off it.` }))].slice(0, 6));
};
export const exactSolve: Gen = (R, n) => fitted('exactSolve', () => {
  const d = pick(R, [30, 60, 45]), f = pick(R, ['sin', 'cos'] as const), k = 2 * r(R, 2, 10);
  const val = exactOf(f, d);
  // x = k·f(d): k/2, (k/2)√3 or (k/2)√2
  const x: Rad = val.t === '1/2' ? { k: k / 2, r: 1 } : val.t === '√3/2' ? { k: k / 2, r: 3 } : { k: k / 2, r: 2 };
  const role: Role = f === 'sin' ? 'opp' : 'adj';
  const T = trigFig(R, d, { hyp: { text: String(k) }, [role]: { text: 'x', alt: radS(x) } }, { text: `${d}°` });
  const wrongs: Rad[] = ([{ k: k / 2, r: 1 }, { k: k / 2, r: 3 }, { k: k / 2, r: 2 }, { k, r: 3 }] as Rad[]).filter(w => Math.abs(radV(w) - radV(x)) > 1e-9);
  return choice(R, {
    id: `exactSolve-${n}`, family: 'exactSolve',
    prompt: `Find x exactly, without a calculator.`, board: `\\${f} ${d}^\\circ = \\frac{x}{${k}}`,
    solution: [`x is the ${role === 'opp' ? 'opposite' : 'adjacent'} leg, ${k} the hypotenuse: x = ${k} ${f} ${d}°.`, `${f} ${d}° = ${val.t}, so x = ${k} × ${val.t} = ${radS(x)}.`],
    picture: { fig: T.fig, reveal: { solved: [T.ids[role]] } },
  }, radOpts(x, wrongs.map(w => ({ x: w, mc: MC.swapped, say: `${f} ${d}° = ${val.t}: use the special triangle's ratio for THIS angle.` }))));
});

// ---------- pythagorean-triples ----------
export const tripleSpot: Gen = (R, n) => {
  const t = pick(R, TRIPLES.slice(0, 4)), k = pick(R, [1, 2, 3, 4, 1.5, 0.5]), m = r(R, 4, 12), d = r(R, 1, 5);
  const o = pick(R, TRIPLES.filter(x => x !== t));
  const T = (x: number[]) => x.map(fmt).join(', ');
  const near = [o[0] * 2, o[1] * 2, o[2] * 2 + pick(R, [-1, 1])];
  const opts = [
    { t: T(t.map(x => x * k)), ok: true, say: `Right: ${T(t)} × ${fmt(k)}.` },
    { t: T([m, m + 1, m + 2]), ok: false, mc: MC.falseTriple, say: `${m}² + ${m + 1}² = ${m * m + (m + 1) * (m + 1)}, but ${m + 2}² = ${(m + 2) * (m + 2)}. Only 3, 4, 5 works among consecutive numbers.` },
    { t: T(t.map(x => x + d)), ok: false, mc: MC.additive, say: `Adding ${d} to each side breaks it: check a² + b² = c².` },
    { t: T(near), ok: false, say: `${near[0]}² + ${near[1]}² = ${near[0]! ** 2 + near[1]! ** 2}, not ${near[2]! ** 2}.` },
  ].filter(x => x.ok || !(() => { const v = x.t.split(', ').map(Number); return isRight(v[0]!, v[1]!, v[2]!); })());
  return choice(R, {
    id: `tripleSpot-${n}`, family: 'tripleSpot',
    prompt: `${pick(R, ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli'])} cuts three boards (in ${pick(R, ['inches', 'feet', 'centimeters'])}) for a triangular frame. Which three lengths make a right triangle?`, board: 'a^2 + b^2 = c^2',
    solution: ['Check a² + b² = c² for each set, or spot a multiple of 3-4-5, 5-12-13, 8-15-17, 7-24-25.', `${T(t.map(x => x * k))} is ${T(t)} × ${fmt(k)}.`],
  }, opts);
};
export const tripleMissing: Gen = (R, n) => {
  const t = pick(R, TRIPLES.slice(0, 4)), k = pick(R, [2, 3, 4, 5, 1.5, 2.5]), miss = pick(R, [2, 2, 0, 1]);
  const s = t.map(x => x * k);
  const given = s.filter((_, i) => i !== miss);
  const unit = pick(R, ['ft', 'in', 'm']);
  const what = miss === 2 ? `legs ${fmt(given[0]!)} ${unit} and ${fmt(given[1]!)} ${unit}` : `a leg of ${fmt(given[0]!)} ${unit} and hypotenuse ${fmt(given[1]!)} ${unit}`;
  return numX({
    id: `tripleMissing-${n}`, family: 'tripleMissing',
    prompt: `A right triangle has ${what}. Find the missing side exactly.`, board: miss === 2 ? `${fmt(given[0]!)}^2 + ${fmt(given[1]!)}^2 = c^2` : `${fmt(given[0]!)}^2 + b^2 = ${fmt(given[1]!)}^2`, unit,
    solution: [`${given.map(fmt).join(' and ')} are ${t.filter((_, i) => i !== miss).join(' and ')} × ${fmt(k)}: the ${t.join('-')} triple.`, `The missing side is ${t[miss]} × ${fmt(k)} = ${S(fmt(s[miss]!))} ${unit}.`],
    picture: { card: { lines: [miss === 2 ? `legs ${fmt(given[0]!)}, ${fmt(given[1]!)}` : `leg ${fmt(given[0]!)}, hypotenuse ${fmt(given[1]!)}`, 'missing side = ?'] } },
  }, s[miss]!, [
    { v: miss === 2 ? given[0]! + given[1]! : given[1]! - given[0]!, say: 'Sides do not add like that: use a² + b² = c² (or the triple).' },
    { v: miss === 2 ? Math.sqrt(given[1]! ** 2 - given[0]! ** 2) : Math.sqrt(given[0]! ** 2 + given[1]! ** 2), say: miss === 2 ? 'Add the squares of the legs.' : 'The hypotenuse is the longest side: subtract the squares.' },
  ], 'Right.', 'Look for a triple, or use a² + b² = c².');
};
export const methodPick: Gen = (R, n) => {
  const v = r(R, 0, 3);
  if (v === 0) { const t = pick(R, TRIPLES.slice(0, 4)), k = r(R, 2, 5); return choice(R, { id: `methodPick-${n}`, family: 'methodPick', prompt: `A right triangle has legs ${t[0] * k} and ${t[1] * k}. Which shortcut gives the hypotenuse with no calculator?`, board: `${t[0] * k},\\ ${t[1] * k},\\ ?`, solution: [`${t[0] * k} and ${t[1] * k} are ${t[0]} and ${t[1]} times ${k}.`, `${AN(t.join('-'))} triple: the hypotenuse is ${t[2] * k}.`] }, [
    { t: `The ${t.join('-')} triple times ${k}`, ok: true, say: 'Right.' },
    { t: 'The 45-45-90 ratio', ok: false, say: 'The legs are not equal.' },
    { t: 'Sine of the angle', ok: false, mc: MC.trigAll, say: 'No angle is given; two sides give the third.' },
  ]); }
  if (v === 1) { const h = 2 * r(R, 3, 15); return choice(R, { id: `methodPick-${n}`, family: 'methodPick', prompt: `A right triangle has a 30° angle and hypotenuse ${h}. Which method gives the side opposite 30° with no calculator?`, board: `30^\\circ,\\ ${h}`, solution: ['A 30° angle in a right triangle: the 30-60-90 triangle.', `Short leg = hypotenuse ÷ 2 = ${h / 2}.`] }, [
    { t: '30-60-90: the short leg is half the hypotenuse', ok: true, say: 'Right.' },
    { t: 'The 3-4-5 triple', ok: false, mc: MC.falseTriple, say: 'A 3-4-5 triangle has no 30° angle (its angles are about 36.9° and 53.1°).' },
    { t: 'The Pythagorean theorem', ok: false, mc: MC.oneEq, say: 'Only one side is known: the Pythagorean theorem needs two.' },
  ]); }
  if (v === 2) { const th = pick(R, [37, 53, 38, 52, 23, 67]), c = 5 * r(R, 2, 8); return choice(R, { id: `methodPick-${n}`, family: 'methodPick', prompt: `A right triangle has ${aN(th)}° angle and hypotenuse ${c}. Which method finds the leg opposite ${th}°?`, board: `${th}^\\circ,\\ ${c}`, solution: [`${th}° is not 30°, 45° or 60°, and 3-4-5 angles are about 36.87° and 53.13°, not exact whole degrees.`, `So use trig: x = ${c} sin ${th}°.`] }, [
    { t: `Trig: x = ${c} sin ${th}°`, ok: true, say: 'Right.' },
    { t: `The 3-4-5 triple scaled by ${c / 5}`, ok: false, mc: MC.falseTriple, say: `A 3-4-5 triangle's angle is 36.87°…, not exactly ${th}°.` },
    { t: 'The Pythagorean theorem', ok: false, mc: MC.oneEq, say: 'Only one side is known.' },
  ]); }
  const a = r(R, 2, 9), b = r(R, 2, 9);
  if (a === b || TRIPLES.some(t => t[0] * b === t[1] * a || t[1] * b === t[0] * a)) return methodPick(R, n);
  return choice(R, { id: `methodPick-${n}`, family: 'methodPick', prompt: `A right triangle has legs ${a} and ${b}. Which method gives the exact hypotenuse?`, board: `${a},\\ ${b},\\ ?`, solution: [`${a} and ${b} are not a triple's legs, and the legs are not equal.`, `Pythagorean theorem: √(${a}² + ${b}²) = √${a * a + b * b}.`] }, [
    { t: `The Pythagorean theorem: √${a * a + b * b}`, ok: true, say: 'Right.' },
    { t: 'A Pythagorean triple', ok: false, mc: MC.falseTriple, say: `${a}, ${b} are not the legs of a triple: ${a * a + b * b} is not a perfect square.` },
    { t: 'The 45-45-90 ratio', ok: false, say: 'The legs are not equal.' },
  ]);
};

// ---------- regular-polygon-area ----------
export function polyNumbers(n: number, s: number) { return { a: apothemOf(n, s), r: radiusOf(n, s), A: polyArea(n, s), P: n * s }; }
export const polyArea_: Gen = (R, n) => fitted('polyArea', () => {
  const N = pick(R, [3, 4, 6, 6, 5, 8, 10]), s = r(R, 4, 20), unit = pick(R, ['in', 'cm', 'ft']);
  const X = polyNumbers(N, s);
  const half = 180 / N;
  const fig = polyFig(N, s, { side: `${s} ${unit}`, apo: 'a', apoAlt: `${fx(X.a, 2)}`, showRad: false });
  const how = N === 6 || N === 3 ? `a 30-60-90 triangle: a = (s/2)·${N === 6 ? '√3' : '1/√3'}` : N === 4 ? 'a = s/2' : `tan ${fmt(half)}° = (s/2)/a`;
  return numR({
    id: `polyArea-${n}`, family: 'polyArea',
    prompt: `${AN(POLY[N]!)} has side ${s} ${unit}. Find its area to the nearest tenth, using A = ½aP.`, board: 'A = \\tfrac{1}{2}aP', unit: `${unit}²`,
    solution: [`Apothem from ${how}: a = ${X.a.toFixed(4)}… ${unit}.`, `P = ${N} × ${s} = ${X.P} ${unit}.`, `A = ½ × ${X.a.toFixed(4)}… × ${X.P} ≈ ${S(fx(X.A, 1))} ${unit}².`],
    picture: { fig, reveal: { solved: ['OM'] } },
  }, X.A, 1, [
    { v: 0.5 * X.r * X.P, mc: MC.radiusApo, say: 'The apothem goes to the MIDDLE of a side, at a right angle; the radius goes to a corner.' },
    { v: X.a * X.P, mc: MC.omitsHalf, say: 'Each triangle is ½ · side · apothem: keep the ½.' },
    { v: 0.5 * (s / 2 / tanD(360 / N)) * X.P, mc: MC.fullCentral, say: `The right triangle has HALF the central angle: ${fmt(half)}°, not ${fmt(360 / N)}°.` },
  ], 'Right.', 'Apothem first (half the central angle), then A = ½aP.');
});
export const apothemQ: Gen = (R, n) => fitted('apothem', () => {
  const N = pick(R, [5, 8, 10, 6, 5, 8]), s = r(R, 4, 30), unit = pick(R, ['in', 'cm']);
  const half = 180 / N, a = apothemOf(N, s);
  const fig = polyFig(N, s, { side: `${s} ${unit}`, apo: 'a', apoAlt: `${fx(a, 1)} ${unit}`, showRad: true });
  return numR({
    id: `apothem-${n}`, family: 'apothem',
    prompt: `${AN(POLY[N]!)} has side ${s} ${unit}. Find its apothem a to the nearest tenth.`, board: `\\tan ${fmt(half)}^\\circ = \\frac{${fmt(s / 2)}}{a}`, unit,
    solution: [`The central angle is 360° ÷ ${N} = ${fmt(360 / N)}°; the apothem splits it: ${fmt(half)}°, and half the side, ${fmt(s / 2)} ${unit}, is opposite it.`, `tan ${fmt(half)}° = ${fmt(s / 2)}/a, so a = ${fmt(s / 2)} ÷ tan ${fmt(half)}° ≈ ${S(fx(a, 1))} ${unit}.`],
    picture: { fig, reveal: { solved: ['OM'] } },
  }, a, 1, [
    { v: s / 2 / tanD(360 / N), mc: MC.fullCentral, say: `The right triangle has half the central angle, ${fmt(half)}°.` },
    { v: s / tanD(half), mc: MC.fullCentral, say: 'Only HALF the side is opposite the half-angle.' },
    { v: radiusOf(N, s), mc: MC.radiusApo, say: 'That is the radius (to a corner); the apothem meets the side at a right angle.' },
    { v: (s / 2) * tanD(half), mc: MC.wrongWay, say: 'a is in the denominator: a = (s/2) ÷ tan.' },
  ], 'Right.', 'Half the side is opposite half the central angle; a is adjacent: tangent.');
});
export const polyDerive: Gen = (R, n) => {
  const N = pick(R, [5, 6, 8, 10, 12]), s0 = r(R, 4, 20);
  const nm = POLY[N] ?? `regular ${N}-gon`;
  return choice(R, {
    id: `polyDerive-${n}`, family: 'polyDerive',
    prompt: `${AN(nm)} has side s = ${s0} cm and apothem a ≈ ${fx(apothemOf(N, s0), 2)} cm. Why is its area ½aP?`, board: 'A = \\tfrac{1}{2}aP',
    solution: [`Lines from the center to the corners cut it into ${N} congruent triangles, each with base s and height a.`, `A = ${N} · ½·s·a = ½·a·(${N}s) = ½aP.`],
  }, [
    { t: `${N} triangles, each ½·s·a; and ${N}·s = P`, ok: true, say: 'Right.' },
    { t: `${N} triangles, each s·a; so A = aP`, ok: false, mc: MC.omitsHalf, say: 'A triangle is half of base × height.' },
    { t: `${N} triangles whose height is the radius r; so A = ½rP`, ok: false, mc: MC.radiusApo, say: 'The height of each triangle is the apothem, which meets the side at a right angle.' },
    { t: `It is ½ · (a rectangle a by P)`, ok: false, say: 'There is no such rectangle in the figure; the argument is the triangles.' },
  ]);
};

void asinD; void PLACE; void isRight;
