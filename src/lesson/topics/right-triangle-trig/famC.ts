// famC.ts: stage 3 of "Right triangle trigonometry": auditing worked solutions (the intended angle, setup errors,
// the calculator mode), models of real situations (ladders, kites, shadows, ADA ramps), the precision a measurement
// justifies, angles of elevation and depression, and regular polygons in real objects.
import { type GFItem, type Gen, type NumWrong, AN, MC, S, aN, angN, choice, fitted, numR, numX, pick, r } from './common';
import { type Fn, FNS, PLACE, apothemOf, atanD, cosD, depressionFig, fail, fmt, fnD, fnR, fx, invD, polyFig, rd, rnd, sinD, standFig, tanD } from './trig';
import { trigFig } from './famB';

type Role = 'opp' | 'adj' | 'hyp';
const RATIO: Record<Fn, [Role, Role]> = { sin: ['opp', 'hyp'], cos: ['adj', 'hyp'], tan: ['opp', 'adj'] };
const WORD: Record<Role, string> = { opp: 'opposite leg', adj: 'adjacent leg', hyp: 'hypotenuse' };
const WHO = ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli', 'Mia', 'Ravi', 'Zoe', 'Theo', 'Nia', 'Sam'];
const CO: Record<Fn, Fn> = { sin: 'cos', cos: 'sin', tan: 'tan' };

// ---------- audit-angle-choice ----------
export const auditAngle: Gen = (R, n) => fitted('auditAngle', () => {
  const who = pick(R, WHO), th = r(R, 20, 70);
  if (Math.abs(th - 45) < 4) fail();
  const fn = pick(R, FNS), [tR, bR] = RATIO[fn];
  const xTop = R() < 0.6, k = r(R, 6, 40);
  const known = xTop ? bR : tR, unk = xTop ? tR : bR;
  const T = trigFig(R, th, { [known]: { text: fmt(k) }, [unk]: { text: 'x' } }, { text: `${th}°` });
  const right = xTop ? k * fnD[fn](th) : k / fnD[fn](th);
  const ok = R() < 0.3;
  // the slip: the sides named from the other acute angle (90° − θ): sin ↔ cos, tan upside down
  const g = ok ? fn : CO[fn];
  const eq = fn === 'tan' && !ok ? (xTop ? `tan ${th}° = ${fmt(k)}/x` : `tan ${th}° = x/${fmt(k)}`) : (xTop ? `${g} ${th}° = x/${fmt(k)}` : `${g} ${th}° = ${fmt(k)}/x`);
  const val = fn === 'tan' && !ok ? (xTop ? k / tanD(th) : k * tanD(th)) : (xTop ? k * fnD[g](th) : k / fnD[g](th));
  const shown = rd(val, 1);
  if (!ok && Math.abs(shown - rd(right, 1)) < 0.15) fail();
  const lines = [`${who}'s work:`, eq, `x ≈ ${fx(val, 1)}`];
  return choice(R, {
    id: `auditAngle-${n}`, family: 'auditAngle',
    prompt: `${who} found x for this triangle. Check the work against the ${th}° angle.`, board: eq.replace(/°/g, '^\\circ'),
    solution: [`From the ${th}° angle, x is the ${WORD[unk]} and ${fmt(k)} the ${WORD[known]}: ${fn}.`, ok ? `${who}'s equation uses ${fn} with the sides in the right places: the work is right (x ≈ ${fx(right, 1)}).` : `${who} named the sides from the other acute angle (${90 - th}°). Correct: x ≈ ${fx(right, 1)}.`],
    picture: { fig: T.fig, card: { lines }, reveal: { col: { [T.ids.opp]: 'first', [T.ids.adj]: 'second', [T.ids.hyp]: 'pick' } } },
  }, [
    { t: 'The work is right', ok, mc: ok ? undefined : MC.byPos, say: ok ? 'Right: the sides are named from the marked angle.' : `From ${th}°, x is the ${WORD[unk]}; the equation names it from the other angle.` },
    { t: `Wrong angle: the sides were named from the ${90 - th}° angle`, ok: !ok, say: !ok ? `Right: from ${th}°, x is the ${WORD[unk]}, so it is ${fn}.` : `The equation does use the ${th}° angle correctly.` },
    { t: 'Wrong: the calculator must have been in radian mode', ok: false, mc: MC.mode, say: `x = ${fx(val, 1)} is what degree mode gives for ${who}'s equation; the slip is in the setup.` },
    { t: 'Wrong: x should be rounded before solving', ok: false, mc: MC.early, say: 'Round only at the end; that is not the issue.' },
  ], true);
});

// ---------- audit-setup-reasonableness ----------
type SetupErr = 'legLong' | 'hypShort' | 'sineBig' | 'bigAngle';
const SYM: Record<SetupErr | 'none', string> = {
  legLong: 'x is a leg, yet it came out longer than the hypotenuse',
  hypShort: 'x is the hypotenuse, yet it came out shorter than a leg',
  sineBig: 'the work needs a sine (or cosine) above 1',
  bigAngle: 'x is across from the shorter leg, yet it came out larger than 45°',
  none: 'Nothing: the arithmetic is right, so the answer is right',
};
function setupCase(R: () => number) {
  const e = pick(R, ['legLong', 'hypShort', 'sineBig', 'bigAngle'] as SetupErr[]);
  const th = r(R, 22, 68), k = r(R, 8, 40);
  if (e === 'legLong') {   // leg x from the hypotenuse k: wrote sin θ = k/x
    const f = pick(R, ['sin', 'cos'] as Fn[]), role = RATIO[f][0];
    return { e, th, fig: { [role]: 'x', hyp: fmt(k) } as Partial<Record<Role, string>>, angle: `${th}°`, eq: `${f} ${th}° = ${fmt(k)}/x`, work: k / fnD[f](th), right: k * fnD[f](th), unitDeg: false, fix: `${f} ${th}° = x/${fmt(k)}, x = ${fmt(k)} ${f} ${th}°` };
  }
  if (e === 'hypShort') {  // hypotenuse x from a leg k: solved sin θ = k/x as x = k·sin θ
    const f = pick(R, ['sin', 'cos'] as Fn[]), role = RATIO[f][0];
    return { e, th, fig: { [role]: fmt(k), hyp: 'x' } as Partial<Record<Role, string>>, angle: `${th}°`, eq: `${f} ${th}° = ${fmt(k)}/x, so x = ${fmt(k)} ${f} ${th}°`, work: k * fnD[f](th), right: k / fnD[f](th), unitDeg: false, fix: `x = ${fmt(k)} ÷ ${f} ${th}°` };
  }
  if (e === 'sineBig') {   // angle from a leg p and hypotenuse q: wrote sin x = q/p
    const q = r(R, 10, 40), p = r(R, 4, q - 3);
    return { e, th: asinDeg(p / q), fig: { opp: fmt(p), hyp: fmt(q) } as Partial<Record<Role, string>>, angle: 'x°', eq: `sin x = ${q}/${p} = ${(q / p).toFixed(3)}…`, work: NaN, right: asinDeg(p / q), unitDeg: true, fix: `sin x = ${p}/${q}` };
  }
  // the angle across from the shorter leg: wrote tan x = long/short
  const p = r(R, 4, 20), q = r(R, p + 3, p + 25);
  return { e, th: atanD(p / q), fig: { opp: fmt(p), adj: fmt(q) } as Partial<Record<Role, string>>, angle: 'x°', eq: `tan x = ${q}/${p}, so x = tan⁻¹(${q}/${p})`, work: atanD(q / p), right: atanD(p / q), unitDeg: true, fix: `tan x = ${p}/${q}` };
}
const asinDeg = (x: number) => (Math.asin(x) * 180) / Math.PI;
export const auditSetup: Gen = (R, n) => fitted('auditSetup', () => {
  const who = pick(R, WHO), C = setupCase(R);
  if (C.th < 12 || C.th > 78) fail();
  const T = trigFig(R, C.th, Object.fromEntries(Object.entries(C.fig).map(([k, v]) => [k, { text: v! }])), { text: C.angle });
  const res = C.e === 'sineBig' ? 'calculator: ERROR' : `x ≈ ${fx(C.work, 1)}${C.unitDeg ? '°' : ''}`;
  return choice(R, {
    id: `auditSetup-${n}`, family: 'auditSetup',
    prompt: `${who}'s work is below. Which check shows the setup is wrong?`, board: '\\text{check the setup}',
    solution: [`Size check: ${SYM[C.e]}.`, `The fix: ${C.fix}.`],
    picture: { fig: T.fig, card: { lines: [`${who}'s work:`, C.eq, res] } },
  }, (['legLong', 'hypShort', 'sineBig', 'bigAngle', 'none'] as const).map(k => ({ t: k === 'none' ? SYM.none : SYM[k], ok: k === C.e, mc: k === C.e ? undefined : k === 'none' ? MC.arithOk : MC.noSize, say: k === C.e ? 'Right: a size check exposes it.' : k === 'none' ? 'Correct arithmetic on a wrong setup still gives a wrong answer.' : 'Check: is that true of THIS work?' })), true);
});
export const auditFix: Gen = (R, n) => fitted('auditFix', () => {
  const who = pick(R, WHO);
  let C = setupCase(R);
  for (let i = 0; i < 20 && C.e === 'sineBig'; i++) C = setupCase(R);
  if (C.e === 'sineBig' || C.th < 12 || C.th > 78) fail();
  const T = trigFig(R, C.th, Object.fromEntries(Object.entries(C.fig).map(([k, v]) => [k, { text: v! }])), { text: C.angle });
  const deg = C.unitDeg;
  return numR({
    id: `auditFix-${n}`, family: 'auditFix',
    prompt: `${who} wrote: ${C.eq}, and got x ≈ ${fx(C.work, 1)}${deg ? '°' : ''}. That fails a size check. Find the correct x to the nearest tenth${deg ? ' of a degree' : ''}.`,
    board: C.eq.replace(/°/g, '^\\circ').replace(/⁻¹/g, '^{-1}'), unit: deg ? '°' : '',
    solution: [`Size check: ${SYM[C.e]}.`, `Correct setup: ${C.fix}.`, `x ≈ ${S(fx(C.right, 1))}${deg ? '°' : ''}.`],
    picture: { fig: T.fig, card: { lines: [`${who}'s work:`, C.eq, `x ≈ ${fx(C.work, 1)}${deg ? '°' : ''}`] } },
  }, C.right, 1, [{ v: C.work, mc: MC.arithOk, say: 'That is the answer that failed the size check.' }], 'Right.', 'Name the sides from the angle, then set up the ratio again.');
});

// ---------- diagnose-mode-error ----------
export const modeDiag: Gen = (R, n) => {
  const who = pick(R, WHO), v = r(R, 0, 2);
  if (v === 0) {
    const th = r(R, 10, 80), fn = pick(R, ['sin', 'cos'] as Fn[]), shown = fnR[fn](th);
    if (shown >= -0.05 || shown < -0.97) return modeDiag(R, n);
    return choice(R, {
      id: `modeDiag-${n}`, family: 'modeDiag',
      prompt: `${who}'s calculator shows ${fn}(${th}) = ${shown.toFixed(4)}. What does that tell you?`, board: `\\${fn}(${th}) = ${shown.toFixed(4)}`,
      solution: [`For an acute angle ${fn} is a leg over the hypotenuse: positive.`, `A negative value means the calculator is in radian mode; in degrees ${fn} ${th}° ≈ ${fnD[fn](th).toFixed(4)}.`],
    }, [
      { t: 'The calculator is in radian mode', ok: true, say: 'Right: an acute angle never has a negative sine or cosine.' },
      { t: `Nothing: ${fn} can be negative`, ok: false, mc: MC.trusts, say: `For an acute angle in a triangle, ${fn} is a ratio of lengths: positive.` },
      { t: 'The angle must be obtuse', ok: false, mc: MC.trusts, say: `${th}° is acute; the display is wrong, not the angle.` },
    ]);
  }
  if (v === 1) {
    const fn = pick(R, ['tan', 'sin'] as Fn[]), roof = fn === 'tan';
    // a roof pitch rise/run 3/12 to 12/12 (tan); a ramp rise/length 1/12 to 1/4 (sin)
    const [p, q] = roof ? [r(R, 3, 12), 12] : pick(R, [[1, 12], [1, 10], [1, 8], [1, 6], [1, 5], [1, 4], [2, 15], [3, 20], [2, 9], [3, 16]] as [number, number][]);
    const ratio = p / q, degv = invD[fn](ratio), radv = (degv * Math.PI) / 180;
    return choice(R, {
      id: `modeDiag-${n}`, family: 'modeDiag',
      prompt: `${who} finds the angle of ${roof ? `a roof that rises ${p} in for every ${q} in of run` : `a ramp that rises ${p} ft for every ${q} ft along its surface`} with ${fn}⁻¹(${p}/${q}) and the display shows ${radv.toFixed(4)}. ${who} reports an angle of ${radv.toFixed(1)}°. Is that right?`, board: `\\${fn}^{-1}(${p}/${q}) = ${radv.toFixed(4)}`,
      solution: [`Benchmark: ${p}/${q} ≈ ${ratio.toFixed(3)}, so the angle is well above 1°.`, `The display is in radians; in degree mode ${fn}⁻¹(${p}/${q}) ≈ ${degv.toFixed(1)}°.`],
    }, [
      { t: `No: radian mode; in degrees it is about ${degv.toFixed(1)}°`, ok: true, say: 'Right.' },
      { t: 'Yes: the calculator did the work', ok: false, mc: MC.trusts, say: `A ratio of ${ratio.toFixed(2)} cannot belong to an angle under 1°: check the mode.` },
      { t: `No: the answer should be ${p}/${q} = ${ratio.toFixed(2)}°`, ok: false, mc: MC.ratioAsAngle, say: 'The ratio is not the angle.' },
    ]);
  }
  const th = r(R, 20, 70), fn = pick(R, FNS), shown = fnR[fn](th);
  if (shown <= 0.05 || shown >= 0.98 || fn === 'tan' && shown > 20 || Math.abs(shown - fnD[fn](th)) < 0.1) return modeDiag(R, n);
  const bench = fn === 'tan' ? 'tan 45° = 1' : fn === 'sin' ? 'sin 30° = 0.5' : 'cos 60° = 0.5';
  return choice(R, {
    id: `modeDiag-${n}`, family: 'modeDiag',
    prompt: `${who}'s calculator shows ${fn}(${th}) = ${shown.toFixed(4)}. ${who} says it must be in degree mode, because the answer is positive and looks reasonable. Is it?`, board: `\\${fn}(${th}) = ${shown.toFixed(4)}`,
    solution: [`A positive value proves nothing; test a benchmark: ${bench}.`, `In degree mode ${fn} ${th}° ≈ ${fnD[fn](th).toFixed(4)}, not ${shown.toFixed(4)}: the calculator is in radian mode.`],
  }, [
    { t: `No: a benchmark (${bench}) shows it is in radian mode`, ok: true, say: 'Right.' },
    { t: 'Yes: positive answers mean degree mode', ok: false, mc: MC.rangeMode, say: 'Radian mode also gives positive values for many inputs.' },
    { t: 'Yes: the display cannot be wrong', ok: false, mc: MC.trusts, say: 'The display is right for the mode it is in; the mode is wrong.' },
  ]);
};
export const modeFix: Gen = (R, n) => {
  const who = pick(R, WHO);
  try {
    if (R() < 0.6) {
      const fn = pick(R, FNS), th = r(R, 15, 75), shown = fnR[fn](th);
      return numR({
        id: `modeFix-${n}`, family: 'modeFix',
        prompt: `${who}'s calculator was in radian mode and showed ${fn}(${th}) = ${shown.toFixed(4)}. What is ${fn} ${th}°, to four decimal places?`, board: `\\${fn} ${th}^\\circ`,
        solution: ['Switch to degree mode (DEG on the screen) and check a benchmark.', `${fn} ${th}° = ${fnD[fn](th).toFixed(7)}… ≈ ${S(fx(fnD[fn](th), 4))}.`],
        picture: { card: { lines: [`radian mode: ${fn}(${th}) = ${shown.toFixed(4)}`, `degree mode: ${fn} ${th}° = ?`] } },
      }, fnD[fn](th), 4, [{ v: shown, mc: MC.mode, say: 'That is the radian-mode value again.' }], 'Right.', 'Degree mode first.');
    }
    const p = r(R, 2, 12), q = r(R, p + 1, 20), fn = pick(R, ['tan', 'sin', 'cos'] as Fn[]);
    const d = invD[fn](p / q), rv = (d * Math.PI) / 180;
    return numR({
      id: `modeFix-${n}`, family: 'modeFix',
      prompt: `In radian mode ${who} got ${fn}⁻¹(${p}/${q}) = ${rv.toFixed(4)}. What is the angle in degrees, to the nearest tenth?`, board: `\\${fn}^{-1}\\left(\\frac{${p}}{${q}}\\right)`, unit: '°',
      solution: ['Switch to degree mode and key the inverse again.', `${fn}⁻¹(${p}/${q}) = ${d.toFixed(4)}…° ≈ ${S(fx(d, 1))}°.`],
      picture: { card: { lines: [`radian mode: ${fn}⁻¹(${p}/${q}) = ${rv.toFixed(4)}`, 'degrees, nearest tenth = ?'] } },
    }, d, 1, [{ v: rv, mc: MC.mode, say: 'That is the radian value.' }, { v: p / q, mc: MC.ratioAsAngle, say: 'That is the ratio, not the angle.' }], 'Right.', 'Degree mode, then the inverse key.');
  } catch { return modeFix(R, n); }
};

// ---------- context-model ----------
export const ladder: Gen = (R, n) => fitted('ladder', () => {
  const who = pick(R, WHO), L = pick(R, [12, 14, 16, 18, 20, 24, 28]), th = r(R, 65, 80), v = r(R, 0, 2);
  const run = L * cosD(th), rise = L * sinD(th);
  if (v === 0) {
    const C = standFig(run, rise, { mirror: R() < 0.5, wall: true, labs: { hyp: `${L} ft`, rise: 'h', riseAlt: `${fx(rise, 1)} ft` }, angF: { text: `${th}°` }, words: { run: 'ground', hyp: 'ladder' } });
    return numR({ id: `ladder-${n}`, family: 'ladder', prompt: `${AN(L)} ft ladder leans against a wall and makes ${aN(th)}° angle with the level ground. How high up the wall does it reach, to the nearest tenth of a foot?`, board: `\\sin ${th}^\\circ = \\frac{h}{${L}}`, unit: 'ft',
      solution: [`The ladder is the hypotenuse; the height is opposite the ${th}° angle at the ground.`, `h = ${L} sin ${th}° ≈ ${S(fx(rise, 1))} ft.`], picture: { fig: C.fig, reveal: { solved: [C.ids.rise!] } } },
      rise, 1, [{ v: run, mc: MC.wrongRef, say: `The ${th}° is at the ground: the wall height is opposite it (sine). Cosine gives the distance along the ground.` }, { v: L / sinD(th), mc: MC.roleSwap, say: 'The ladder is the longest side (the hypotenuse); the height must be shorter.' }], 'Right.', 'Ladder = hypotenuse; height = opposite the angle at the ground.');
  }
  if (v === 1) {
    const C = standFig(run, rise, { mirror: R() < 0.5, wall: true, labs: { hyp: `${L} ft`, run: 'd', runAlt: `${fx(run, 1)} ft` }, angF: { text: `${th}°` }, words: { hyp: 'ladder' } });
    return numR({ id: `ladder-${n}`, family: 'ladder', prompt: `${AN(L)} ft ladder makes ${aN(th)}° angle with the level ground. How far is its foot from the wall, to the nearest tenth of a foot?`, board: `\\cos ${th}^\\circ = \\frac{d}{${L}}`, unit: 'ft',
      solution: [`The distance along the ground is adjacent to the ${th}° angle; the ladder is the hypotenuse.`, `d = ${L} cos ${th}° ≈ ${S(fx(run, 1))} ft.`], picture: { fig: C.fig, reveal: { solved: [C.ids.run!] } } },
      run, 1, [{ v: rise, mc: MC.wrongRef, say: 'That is the height on the wall; the foot distance is adjacent to the angle at the ground.' }, { v: L / cosD(th), mc: MC.roleSwap, say: 'The ladder is the hypotenuse; the foot distance is a leg, shorter.' }], 'Right.', 'Foot distance = adjacent leg.');
  }
  const d = pick(R, [3, 3.5, 4, 4.5, 5, 6]), Lx = d / cosD(th);
  const C = standFig(d, d * tanD(th), { mirror: R() < 0.5, wall: true, labs: { run: `${fmt(d)} ft`, hyp: 'L', hypAlt: `${fx(Lx, 1)} ft` }, angF: { text: `${th}°` }, words: { hyp: 'ladder' } });
  return numR({ id: `ladder-${n}`, family: 'ladder', prompt: `${who} wants a ladder to stand at ${th}° with the level ground, its foot ${fmt(d)} ft from the wall. How long must the ladder be, to the nearest tenth of a foot?`, board: `\\cos ${th}^\\circ = \\frac{${fmt(d)}}{L}`, unit: 'ft',
    solution: [`cos ${th}° = ${fmt(d)}/L (adjacent over hypotenuse).`, `L = ${fmt(d)} ÷ cos ${th}° ≈ ${S(fx(Lx, 1))} ft.`], picture: { fig: C.fig, reveal: { solved: [C.ids.hyp!] } } },
    Lx, 1, [{ v: d * cosD(th), mc: MC.wrongWay, say: 'L is in the denominator: L = distance ÷ cos.' }, { v: d * tanD(th), mc: MC.roleSwap, say: 'That is the height on the wall; the ladder is the hypotenuse.' }], 'Right.', 'The ladder is the hypotenuse; the ground distance is adjacent.');
});
export const kite: Gen = (R, n) => fitted('kite', () => {
  const s = pick(R, [80, 100, 120, 150, 180, 200, 250, 300]), th = r(R, 28, 62);
  const h = s * sinD(th);
  const C = standFig(s * cosD(th), h, { mirror: R() < 0.5, riseDash: true, labs: { hyp: `${s} ft`, rise: 'h', riseAlt: `${fx(h, 1)} ft` }, angF: { text: `${th}°` }, words: { hyp: 'string' } });
  return numR({
    id: `kite-${n}`, family: 'kite',
    prompt: `A kite string is ${s} ft long, pulled straight, and makes ${aN(th)}° angle with the horizontal at your hand. How high is the kite above your hand, to the nearest tenth of a foot?`, board: `\\sin ${th}^\\circ = \\frac{h}{${s}}`, unit: 'ft',
    solution: [`The string is the hypotenuse; the height is opposite the ${th}° angle.`, `h = ${s} sin ${th}° ≈ ${S(fx(h, 1))} ft.`],
    picture: { fig: C.fig, reveal: { solved: [C.ids.rise!] } },
  }, h, 1, [{ v: s * cosD(th), mc: MC.wrongRef, say: 'Cosine gives the horizontal distance; the height is opposite the angle.' }, { v: s * tanD(th), mc: MC.roleSwap, say: 'The string is the hypotenuse, so use sine.' }], 'Right.', 'String = hypotenuse, height = opposite.');
});
export const shadowTrig: Gen = (R, n) => fitted('shadowTrig', () => {
  const what = pick(R, ['flagpole', 'tree', 'light pole', 'radio mast']), th = r(R, 25, 68), H = r(R, 18, 60), find = R() < 0.5 ? 'shadow' : 'height';
  const sh = H / tanD(th);
  const C = standFig(sh, H, { mirror: R() < 0.5, hypDash: true, labs: find === 'shadow' ? { rise: `${H} ft`, run: 's', runAlt: `${fx(sh, 1)} ft` } : { run: `${fx(sh, 1)} ft`, rise: 'h', riseAlt: `${H} ft` }, angF: { text: `${th}°` }, words: { run: 'shadow', hyp: 'sun' } });
  if (find === 'height') {
    const s1 = rd(sh, 1), h = s1 * tanD(th);
    return numR({ id: `shadowTrig-${n}`, family: 'shadowTrig', prompt: `${AN(what)} casts ${aN(fx(sh, 1))} ft shadow on level ground when the sun is ${th}° above the horizon. How tall is the ${what}, to the nearest tenth of a foot?`, board: `\\tan ${th}^\\circ = \\frac{h}{${fx(sh, 1)}}`, unit: 'ft',
      solution: [`At the tip of the shadow the sun's angle of elevation is ${th}°: height opposite, shadow adjacent.`, `h = ${fx(sh, 1)} tan ${th}° ≈ ${S(fx(h, 1))} ft.`], picture: { fig: C.fig, reveal: { solved: [C.ids.rise!] } } },
      h, 1, [{ v: s1 / tanD(th), mc: MC.wrongRef, say: `The ${th}° is measured from the ground: the height is opposite it.` }, { v: s1 * sinD(th), mc: MC.roleSwap, say: 'The shadow is a leg, not the hypotenuse: tangent.' }], 'Right.', 'Height opposite, shadow adjacent: tangent.');
  }
  return numR({ id: `shadowTrig-${n}`, family: 'shadowTrig', prompt: `${AN(H)} ft ${what} stands on level ground. The sun is ${th}° above the horizon. How long is its shadow, to the nearest tenth of a foot?`, board: `\\tan ${th}^\\circ = \\frac{${H}}{s}`, unit: 'ft',
    solution: [`Height opposite the ${th}° angle, shadow adjacent: tan ${th}° = ${H}/s.`, `s = ${H} ÷ tan ${th}° ≈ ${S(fx(sh, 1))} ft.`], picture: { fig: C.fig, reveal: { solved: [C.ids.run!] } } },
    sh, 1, [{ v: H * tanD(th), mc: MC.wrongRef, say: `The ${th}° is measured from the ground at the shadow's tip, so the height is opposite it.` }, { v: H / sinD(th), mc: MC.roleSwap, say: 'That is the slanted sun ray, not the shadow.' }], 'Right.', 'tan = height / shadow.');
});
/** ADA: a ramp may rise at most 1 for every 12 of run (about 4.8°); figures would be nearly flat, so a card */
export const adaRamp: Gen = (R, n) => {
  try {
    if (R() < 0.5) {
      const rise = pick(R, [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5]), run = rise * pick(R, [12, 13, 14, 15, 16, 18, 20]) + pick(R, [0, 0.5, 1]);
      const th = atanD(rise / run);
      return numR({ id: `adaRamp-${n}`, family: 'adaRamp',
        prompt: `A wheelchair ramp rises ${fmt(rise)} ft over a horizontal run of ${fmt(run)} ft. What angle does it make with the ground, to the nearest tenth of a degree? (The ADA limit is a 1 : 12 slope, about 4.8°.)`, board: `\\tan x = \\frac{${fmt(rise)}}{${fmt(run)}}`, unit: '°',
        solution: ['The rise is opposite the angle, the run adjacent: tangent.', `x = tan⁻¹(${fmt(rise)}/${fmt(run)}) ≈ ${S(fx(th, 1))}°, within the ADA limit.`],
        picture: { card: { lines: [`rise ${fmt(rise)} ft`, `run ${fmt(run)} ft`, 'angle with the ground = ?'] } } },
        th, 1, [{ v: invD.sin(rise / run), mc: MC.roleSwap, say: 'The run is a leg, not the ramp surface: tangent, not sine.' }, { v: 90 - th, mc: MC.wrongRef, say: 'That is the angle with the vertical; the question asks the angle with the ground.' }, { v: rise / run, mc: MC.ratioAsAngle, say: 'That is the slope, not the angle.' }], 'Right.', 'Rise opposite, run adjacent: tan⁻¹.');
    }
    const rise = pick(R, [1, 1.5, 2, 2.5]), th = pick(R, [3, 3.5, 4, 4.5, 2.5, 3.2, 4.2, 3.8]), L = rise / sinD(th);
    return numR({ id: `adaRamp-${n}`, family: 'adaRamp',
      prompt: `A ramp must rise ${fmt(rise)} ft at an angle of ${fmt(th)}° with the ground. How long is the ramp surface, to the nearest tenth of a foot?`, board: `\\sin ${fmt(th)}^\\circ = \\frac{${fmt(rise)}}{L}`, unit: 'ft',
      solution: ['The ramp surface is the hypotenuse, the rise is opposite the angle: sine.', `L = ${fmt(rise)} ÷ sin ${fmt(th)}° ≈ ${S(fx(L, 1))} ft.`],
      picture: { card: { lines: [`rise ${fmt(rise)} ft`, `angle ${fmt(th)}° with the ground`, 'ramp surface L = ?'] } } },
      L, 1, [{ v: rise / tanD(th), mc: MC.roleSwap, say: 'That is the horizontal run; the surface is the hypotenuse.' }, { v: rise * sinD(th), mc: MC.wrongWay, say: 'L is in the denominator: L = rise ÷ sin.' }], 'Right.', 'The ramp surface is the hypotenuse.');
  } catch { return adaRamp(R, n); }
};

// ---------- report-precision ----------
function precisionCase(R: () => number) {
  const what = pick(R, ['ladder', 'rafter', 'shadow'] as const);
  // realistic angles: a ladder 65°-80° to the ground, a roof rafter 20°-45°, the sun 25°-70° above the horizon
  const [lo, hi] = what === 'ladder' ? [65, 80] : what === 'rafter' ? [20, 45] : [25, 70];
  const fine = R() < 0.4, L = fine ? r(R, 80, 300) / 10 : r(R, 10, 40), th = fine ? r(R, lo * 10, hi * 10) / 10 : r(R, lo, hi);
  const v = what === 'shadow' ? L * tanD(th) : L * sinD(th);
  const p = fine ? 1 : 0;
  return { fine, L, th, what, v, p, rep: rnd(v, p) };
}
const caseText = (C: ReturnType<typeof precisionCase>) => C.what === 'shadow'
  ? `A shadow is measured as ${C.fine ? C.L.toFixed(1) : fmt(C.L)} ft (to the nearest ${C.fine ? 'tenth of a foot' : 'foot'}) and the sun's angle as ${C.fine ? C.th.toFixed(1) : fmt(C.th)}° (to the nearest ${C.fine ? 'tenth of a degree' : 'degree'}). The height is ${C.fine ? C.L.toFixed(1) : fmt(C.L)} tan ${C.fine ? C.th.toFixed(1) : fmt(C.th)}°`
  : `${AN(C.what === 'rafter' ? 'roof rafter' : C.what)} is measured as ${C.fine ? C.L.toFixed(1) : fmt(C.L)} ft (to the nearest ${C.fine ? 'tenth of a foot' : 'foot'}) at ${C.fine ? C.th.toFixed(1) : fmt(C.th)}° to the ground (to the nearest ${C.fine ? 'tenth of a degree' : 'degree'}). The height it reaches is ${C.fine ? C.L.toFixed(1) : fmt(C.L)} sin ${C.fine ? C.th.toFixed(1) : fmt(C.th)}°`;
export const precision: Gen = (R, n) => {
  try {
    const C = precisionCase(R), full = C.v.toFixed(5);
    const u = C.fine ? 'tenth of a foot' : 'foot';
    return choice(R, {
      id: `precision-${n}`, family: 'precision',
      prompt: `${caseText(C)}, and the calculator shows ${full}… ft. Which report does the measurement justify?`, board: `${full}\\ldots`,
      solution: [`The length was measured to the nearest ${u}; the answer cannot be more precise than that.`, `Report ${fx(C.v, C.p)} ft.`],
    }, [
      { t: `${fx(C.v, C.p)} ft`, ok: true, v: rd(C.v, C.p), say: `Right: to the nearest ${u}, like the measurement.` },
      { t: `${full} ft`, ok: false, v: Number(full), mc: MC.digits, say: 'Those digits come from the calculator, not from the tape measure.' },
      { t: `${fx(C.v, C.p + 2)} ft`, ok: false, v: rd(C.v, C.p + 2), mc: MC.digits, say: `The length is only known to the nearest ${u}.` },
      { t: `${fmt(Math.round(C.v / 10) * 10)} ft`, ok: false, v: Math.round(C.v / 10) * 10 + 1e-7, say: 'That throws away precision the measurement does have.' },
    ]);
  } catch { return precision(R, n); }
};
export const precisionCritique: Gen = (R, n) => {
  try {
    const who = pick(R, WHO), C = precisionCase(R), over = C.v.toFixed(4);
    const u = C.fine ? 'tenth of a foot' : 'foot';
    return choice(R, {
      id: `precisionCritique-${n}`, family: 'precisionCritique',
      prompt: `${caseText(C)}. ${who} reports ${over} ft. What is the best critique?`, board: `${over}`,
      solution: [`The length was measured to the nearest ${u}; four decimals claim far more than that.`, `A justified report: ${fx(C.v, C.p)} ft.`],
    }, [
      { t: `Too precise: report ${fx(C.v, C.p)} ft`, ok: true, say: 'Right.' },
      { t: 'Fine: more decimal places make it more accurate', ok: false, mc: MC.digits, say: 'More digits are not more accuracy; the measurement limits it.' },
      { t: `Not precise enough: report ${C.v.toFixed(6)} ft`, ok: false, mc: MC.digits, say: 'Even more digits claim even more than the tape measure knows.' },
    ]);
  } catch { return precisionCritique(R, n); }
};

// ---------- elevation-depression ----------
export const elevation: Gen = (R, n) => fitted('elevation', () => {
  const who = pick(R, WHO), what = pick(R, ['building', 'tree', 'cliff', 'water tower']), d = r(R, 6, 30) * 10, th = r(R, 18, 60);
  const eye = R() < 0.4 ? pick(R, [5, 5.5, 6]) : 0;
  const up = d * tanD(th), H = up + eye;
  const C = standFig(d, up, { mirror: R() < 0.5, hypDash: true, labs: { run: `${d} ft`, rise: 'h', riseAlt: `${fx(up, 1)} ft` }, angF: { text: `${th}°` }, words: { run: eye ? 'eye level' : 'ground', hyp: 'line of sight' } });
  return numR({
    id: `elevation-${n}`, family: 'elevation',
    prompt: eye ? `${who} stands ${d} ft from ${aN(what)} on level ground. From ${who}'s eyes, ${fmt(eye)} ft above the ground, the angle of elevation to the top is ${th}°. How tall is the ${what}, to the nearest tenth of a foot?`
      : `From a point on level ground ${d} ft from ${aN(what)}, the angle of elevation to its top is ${th}°. How tall is the ${what}, to the nearest tenth of a foot?`,
    board: `\\tan ${th}^\\circ = \\frac{h}{${d}}`, unit: 'ft',
    solution: [`The angle of elevation is measured up from the horizontal: h is opposite, ${d} ft adjacent.`, `h = ${d} tan ${th}° ≈ ${up.toFixed(2)} ft${eye ? `; add the eye height: ${up.toFixed(2)} + ${fmt(eye)}` : ''} ≈ ${S(fx(H, 1))} ft.`],
    picture: { fig: C.fig, reveal: { solved: [C.ids.rise!] } },
  }, H, 1, [
    { v: d / tanD(th) + eye, mc: MC.wrongRef, say: 'The angle of elevation is measured from the horizontal, so the height is opposite it.' },
    { v: d * sinD(th) + eye, mc: MC.roleSwap, say: `${d} ft is along the ground, a leg: tangent.` },
    ...(eye ? [{ v: up, say: `That is the height above ${who}'s eyes; add the ${fmt(eye)} ft eye height.` }] : []),
  ], 'Right.', 'Elevation is measured up from the horizontal: tan = height / distance.');
});
export const depression: Gen = (R, n) => fitted('depression', () => {
  const sc = pick(R, [{ what: 'lighthouse', target: 'boat', lo: 60, hi: 160 }, { what: 'cliff', target: 'buoy', lo: 80, hi: 300 }, { what: 'balcony', target: 'car', lo: 30, hi: 90 }, { what: 'drone', target: 'tent', lo: 100, hi: 350 }]);
  const h = r(R, sc.lo / 10, sc.hi / 10) * 10, th = r(R, 14, 42);
  const d = h / tanD(th);
  const C = depressionFig(h, d, { mirror: R() < 0.5, labH: `${h} ft`, labD: 'd', labDAlt: `${fx(d, 1)} ft`, dep: { text: `${th}°` }, what: sc.what, target: sc.target });
  return numR({
    id: `depression-${n}`, family: 'depression',
    prompt: `${sc.what === 'drone' || sc.what === 'balcony' ? `From ${sc.what === 'drone' ? 'a drone hovering' : 'a balcony'} ${h} ft above level ground` : `From the top of ${aN(h)} ft ${sc.what}`}, the angle of depression to ${aN(sc.target)} is ${th}°. How far is the ${sc.target} from the point straight below, to the nearest tenth of a foot?`,
    board: `\\tan ${th}^\\circ = \\frac{${h}}{d}`, unit: 'ft',
    solution: [`The angle of depression is measured down from the horizontal; it equals the angle of elevation at the ${sc.target} (alternate interior angles).`, `At the ${sc.target}: tan ${th}° = ${h}/d, so d = ${h} ÷ tan ${th}° ≈ ${S(fx(d, 1))} ft.`],
    picture: { fig: C.fig, reveal: { solved: [C.ids.d!] } },
  }, d, 1, [
    { v: h * tanD(th), mc: MC.wrongRef, say: 'The angle of depression is measured from the HORIZONTAL, not from the vertical.' },
    { v: h / sinD(th), mc: MC.roleSwap, say: 'That is the line of sight (the hypotenuse), not the ground distance.' },
  ], 'Right.', 'Depression = elevation at the other end: tan = height / distance.');
});
export const depWhere: Gen = (R, n) => fitted('depWhere', () => {
  const sc = pick(R, [{ what: 'lighthouse', target: 'boat' }, { what: 'cliff', target: 'buoy' }, { what: 'tower', target: 'deer' }]);
  const h = r(R, 6, 15) * 10, th = r(R, 18, 40), d = h / tanD(th);
  const C = depressionFig(h, d, { mirror: R() < 0.5, labH: `${h} ft`, what: sc.what, target: sc.target });
  if (R() < 0.5) return choice(R, {
    id: `depWhere-${n}`, family: 'depWhere',
    prompt: `An observer at the top of the ${sc.what} looks down at the ${sc.target}. Where is the angle of depression?`, board: '\\text{angle of depression}',
    solution: ['An angle of depression is measured at the observer, down from the horizontal line of sight.', `So it is at the top, between the horizontal and the line of sight to the ${sc.target}.`],
    picture: { fig: C.fig, reveal: { glow: [C.ids.sight!, 'TH'] } },
  }, [
    { t: `At the top: between the horizontal and the line of sight`, ok: true, say: 'Right.' },
    { t: `At the top: between the ${sc.what} and the line of sight`, ok: false, mc: MC.wrongRef, say: 'That is measured from the vertical; depression is measured from the horizontal.' },
    { t: `At the ${sc.target}: between the ground and the line of sight`, ok: false, mc: MC.depBottom, say: `That angle is EQUAL to it (alternate interior angles), but it is the angle of elevation from the ${sc.target}.` },
    { t: `At the foot of the ${sc.what}: between it and the ground`, ok: false, mc: MC.depBottom, say: 'That is the right angle.' },
  ], true);
  return numX({
    id: `depWhere-${n}`, family: 'depWhere',
    prompt: `From the top of the ${sc.what}, the angle of depression to the ${sc.target} is ${th}°. What is the angle of elevation from the ${sc.target} to the top? (The ground is level.)`, board: `${th}^\\circ`, unit: '°',
    solution: ['The horizontal at the top is parallel to the level ground; the line of sight crosses both.', `Alternate interior angles are equal: the angle of elevation is ${S(th)}°.`],
    picture: { fig: C.fig },
  }, th, [{ v: 90 - th, mc: MC.wrongRef, say: 'The two angles are alternate interior angles between parallel lines: equal, not complementary.' }, { v: 180 - th, say: 'Alternate interior angles are equal.' }], 'Right: alternate interior angles.', 'The horizontal and the ground are parallel.');
});

// ---------- regular-polygon-context ----------
export const polyContext: Gen = (R, n) => fitted('polyContext', () => {
  const v = r(R, 0, 2);
  if (v === 0) {   // a stop sign: an octagon, given across the flats (twice the apothem)
    const w = pick(R, [30, 36, 48]), a = w / 2, s = 2 * a * tanD(22.5), A = 0.5 * a * 8 * s;
    const ft = R() < 0.5;
    const fig = polyFig(8, s, { side: '', apo: `${fmt(a)} in`, showRad: false });
    if (ft) return numR({ id: `polyContext-${n}`, family: 'polyContext', prompt: `A stop sign is a regular octagon ${w} in across, measured between opposite sides. Find its area in square feet, to the nearest tenth.`, board: 'A = \\tfrac{1}{2}aP', unit: 'ft²',
      solution: [`Apothem a = ${w}/2 = ${fmt(a)} in; side s = 2·${fmt(a)}·tan 22.5° ≈ ${s.toFixed(3)} in.`, `A = ½ × ${fmt(a)} × 8 × ${s.toFixed(3)} ≈ ${A.toFixed(1)} in².`, `In square feet: ÷ 144 ≈ ${S(fx(A / 144, 1))} ft².`], picture: { fig } },
      A / 144, 1, [{ v: A / 12, mc: MC.linArea, say: '1 ft² = 12 in × 12 in = 144 in²: divide by 144.' }, { v: (0.5 * w * 8 * 2 * w * tanD(22.5)) / 144, say: `Across the flats is TWICE the apothem: a = ${fmt(a)} in.` }], 'Right.', 'Apothem = half the width; area in in², then ÷ 144.');
    return numR({ id: `polyContext-${n}`, family: 'polyContext', prompt: `A stop sign is a regular octagon ${w} in across, measured between opposite sides. Find its area to the nearest square inch.`, board: 'A = \\tfrac{1}{2}aP', unit: 'in²',
      solution: [`Apothem a = ${w}/2 = ${fmt(a)} in; side s = 2·${fmt(a)}·tan 22.5° ≈ ${s.toFixed(3)} in.`, `A = ½ × ${fmt(a)} × 8 × ${s.toFixed(3)} ≈ ${S(fx(A, 0))} in².`], picture: { fig } },
      A, 0, [{ v: 0.5 * w * 8 * 2 * w * tanD(22.5), say: `Across the flats is TWICE the apothem: a = ${fmt(a)} in.` }, { v: 0.5 * (a / Math.cos(Math.PI / 8)) * 8 * s, mc: MC.radiusApo, say: 'Use the apothem (center to the middle of a side), not the distance to a corner.' }, { v: a * 8 * s, mc: MC.omitsHalf, say: 'Keep the ½ in A = ½aP.' }], 'Right.', 'Apothem = half the width across the flats.');
  }
  const sc = v === 1 ? { N: 6, what: 'hexagonal gazebo floor', unit: 'ft', lo: 5, hi: 10 } : pick(R, [{ N: 6, what: 'hexagonal floor tile', unit: 'in', lo: 3, hi: 8 }, { N: 8, what: 'octagonal patio', unit: 'ft', lo: 4, hi: 8 }, { N: 8, what: 'octagonal table top', unit: 'in', lo: 12, hi: 20 }]);
  const s = r(R, sc.lo, sc.hi), a = apothemOf(sc.N, s), A = 0.5 * a * sc.N * s;
  const fig = polyFig(sc.N, s, { side: `${s} ${sc.unit}`, apo: 'a', apoAlt: `${fx(a, 2)} ${sc.unit}`, showRad: false });
  return numR({
    id: `polyContext-${n}`, family: 'polyContext',
    prompt: `${AN(sc.what)} is a regular ${sc.N === 6 ? 'hexagon' : 'octagon'} with side ${s} ${sc.unit}. Find its area to the nearest tenth of a square ${sc.unit === 'ft' ? 'foot' : 'inch'}.`, board: 'A = \\tfrac{1}{2}aP', unit: `${sc.unit}²`,
    solution: [`Apothem: tan ${fmt(180 / sc.N)}° = ${fmt(s / 2)}/a, a ≈ ${a.toFixed(3)} ${sc.unit}.`, `A = ½ × ${a.toFixed(3)} × ${sc.N * s} ≈ ${S(fx(A, 1))} ${sc.unit}².`],
    picture: { fig, reveal: { solved: ['OM'] } },
  }, A, 1, [
    { v: 0.5 * (s / (2 * Math.sin(Math.PI / sc.N))) * sc.N * s, mc: MC.radiusApo, say: 'The apothem meets the side at a right angle; the radius goes to a corner.' },
    { v: a * sc.N * s, mc: MC.omitsHalf, say: 'Keep the ½.' },
  ], 'Right.', 'Apothem from half the central angle, then A = ½aP.');
});
export const polyUnits: Gen = (R, n) => {
  const A = r(R, 3000, 30000) / 10, toFt = R() < 0.6;
  try {
    if (toFt) {
      const v = A / 144;
      return choice(R, {
        id: `polyUnits-${n}`, family: 'polyUnits',
        prompt: `A sign's area is ${fmt(A)} in². What is it in square feet, to the nearest tenth?`, board: `${fmt(A)}\\ \\text{in}^2`,
        solution: ['1 ft = 12 in, so 1 ft² = 12 in × 12 in = 144 in².', `${fmt(A)} ÷ 144 ≈ ${fx(v, 1)} ft².`],
      }, [
        { t: `${fx(rnd(v, 1), 1)} ft²`, ok: true, v: rd(v, 1), say: 'Right: ÷ 144.' },
        { t: `${fx(A / 12, 1)} ft²`, ok: false, v: rd(A / 12, 1), mc: MC.linArea, say: 'Square units: 144 in² in each square foot, not 12.' },
        { t: `${fx(v, 1)} ft`, ok: false, v: rd(v, 1) + 1e-6, mc: MC.unitDim, say: 'An area is in square units.' },
        { t: `${fmt(A * 144)} ft²`, ok: false, v: A * 144, mc: MC.linArea, say: 'Feet are bigger than inches: the number gets smaller.' },
      ]);
    }
    const ft = r(R, 20, 400) / 10, v = ft * 144;
    return choice(R, {
      id: `polyUnits-${n}`, family: 'polyUnits',
      prompt: `A floor's area is ${fmt(ft)} ft². What is it in square inches?`, board: `${fmt(ft)}\\ \\text{ft}^2`,
      solution: ['1 ft² = 144 in².', `${fmt(ft)} × 144 = ${fmt(v)} in².`],
    }, [
      { t: `${fmt(v)} in²`, ok: true, v, say: 'Right.' },
      { t: `${fmt(ft * 12)} in²`, ok: false, v: ft * 12, mc: MC.linArea, say: 'Square units: × 144, not × 12.' },
      { t: `${fmt(v)} in`, ok: false, v: v + 1e-6, mc: MC.unitDim, say: 'An area is in square units.' },
    ]);
  } catch { return polyUnits(R, n); }
};

void numX; void PLACE; void fnR; void angN; void fail;
export type { GFItem, NumWrong };
