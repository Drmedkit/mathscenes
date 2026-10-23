// items.ts: practice families for "volume of cylinders, cones and spheres" (grade 8, 8.G.C.9 + TEKS 8.7A/B).
// 37 families over 25 sub-goals; a generator gets the sub-goal id and uses that sub-goal's number ranges (topic JSON
// `cases`). Exact answers are the coefficient of pi (the kid types 45 or 20/3 next to "pi in^3"); rounded answers are
// plain numbers where the sub-goal asks for them. Every typical slip the classifier recognises carries its catalogue
// misconception id. Pure: no DOM. Every picture is a Vessels or Net parameter set the page draws (picture.scene).
import { type Gen, type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import { type Kind, type Q, K, coef, cylLateral, cylTotal, decStr, div, eqQ, htmlPi, htmlQ, isWhole, lenStr, mul, near, pow, q, qd, respValue, roundTo, texPi, texQ, val } from './volMaths';
import type { Dim, Pour, Vessel, VesselsParams, VKind } from './Vessels';
import type { NetLabel, NetSpec } from './Net';

// ---------- misconception ids (all in math-curriculum-essentials/misconceptions.json) ----------
export const MC = {
  sphereHeight: 'mc.volume.sphere-height-independent',
  slantAsH: 'mc.volume.uses-nonperpendicular-edge-as-height',
  bhBoxes: 'mc.volume.bh-only-for-boxes',
  circH: 'mc.volume.circumference-times-height',
  thirdAny: 'mc.volume.one-third-for-any-pair',
  coneHalf: 'mc.volume.cone-half-of-cylinder',
  sphereHalf: 'mc.volume.sphere-half-of-cylinder',
  expBeyond: 'mc.properties.exponent-applied-beyond-base',
  cubicLength: 'mc.measurement-units.labels-length-with-cubic-units',
  thirdTwice: 'mc.volume.divides-by-three-twice',
  dropsCoef: 'mc.volume.drops-formula-coefficient',
  wrongPower: 'mc.volume.wrong-power-of-radius',
  saVol: 'mc.area-perimeter.confuses-surface-area-with-volume',
  halvesRadius: 'mc.circles.part-circle-halves-radius',
  fullForPart: 'mc.circles.full-circle-for-part',
  dForR: 'mc.circles.diameter-for-radius',
  halvesVolume: 'mc.volume.halves-volume-not-diameter',
  cubesR: 'mc.volume.cubes-radius-in-cylinder-formula',
  swapsCoef: 'mc.volume.swaps-cone-and-sphere-coefficients',
  pi314: 'mc.circles.pi-is-exactly-3-14',
  earlyRound: 'mc.decimals.intermediate-precision-always-invalid',
  omitsUnit: 'mc.measurement-units.omits-unit',
  remainderDec: 'mc.fractions-concept.remainder-written-as-r-or-decimal',
  digitSquares: 'mc.decimals.squares-each-digit-separately',
  omitsBase: 'mc.area-perimeter.omits-a-base-from-surface-area',
  latTotal: 'mc.area-perimeter.confuses-lateral-and-total-surface-area',
  facePerim: 'mc.volume.lateral-face-perimeter-in-lateral-area',
  aroundAcross: 'mc.circles.distance-around-as-across',
  unconverted: 'mc.measurement-units.arithmetic-on-unconverted-unit-numerals',
  linearFactor: 'mc.measurement-units.linear-factor-for-area',
  squaredFactor: 'mc.measurement-units.squared-factor-for-cubic-conversion',
  capBeforeUnits: 'mc.measurement-units.capacity-factor-before-unit-normalization',
  wrongDir: 'mc.measurement-units.wrong-direction-for-quantity',
  trustsDisplay: 'mc.estimation.trusts-calculator-display',
  arithValid: 'mc.reasoning-language.correct-arithmetic-validates-setup',
  unitFraction: 'mc.linear-equations.divides-to-undo-unit-fraction-factor',
  partialUndo: 'mc.linear-equations.partial-coefficient-undo',
  partOfBase: 'mc.volume.divides-by-part-of-base',
  rootSwap: 'mc.volume.swaps-root-orders-when-solving-radius',
  fixedPower: 'mc.volume.fixed-power-for-any-dimension-change',
  linearRadius: 'mc.volume.scales-volume-linearly-with-radius',
  uniformFactor: 'mc.volume.uses-linear-or-square-factor-for-uniform-volume-scaling',
  outsideInside: 'mc.volume.outside-for-inside',
  powerTimes: 'mc.exponents-roots.power-as-base-times-exponent',
  bareNumber: 'mc.reasoning-language.bare-number-without-meaning',
} as const;

// ---------- the picture the page draws ----------
export interface CcsPicture {
  scene: { kind: 'vessels'; p: VesselsParams } | { kind: 'net'; spec: NetSpec; labels: NetLabel[]; side?: VesselsParams };
  /** progress keys at 1 when the item shows (the page fades them in), and keys set to a value first */
  show: string[]; set?: [string, number][];
  /** the worked solution on the canvas: groups of [key, value] tweens, one group after another */
  solve: [string, number][][];
  /** TeX lines the solve writes on the board */
  hero: string[];
  /** TeX lines shown under the board line from the start (someone's worked solution) */
  pre?: string[];
}
type It = Item & { picture: CcsPicture & Record<string, unknown> };

// ---------- units and words ----------
type U = 'in' | 'ft' | 'yd' | 'cm' | 'm';
const cu = (u: string) => `${u}³`, sq = (u: string) => `${u}²`;
const tu = (u: string, p = 3) => `\\text{ ${u}}^${p}`;
const piUnit = (u: string) => `π ${cu(u)}`;
const LEN_NAME: Record<U, string> = { in: 'in', ft: 'ft', yd: 'yd', cm: 'cm', m: 'm' };
/** a length label on the picture: "3 in", "2.5 cm", "1½ in" */
function lab(x: Q, u: string): string {
  if (isWhole(x)) return `${x[0]} ${u}`;
  if (x[1] === 2) { const w = Math.floor(x[0] / 2); return `${w ? w : ''}½ ${u}`; }
  return `${decStr(x) ?? `${x[0]}/${x[1]}`} ${u}`;
}
/** a length in a prompt (HTML) */
function len(x: Q, u: string): string { return isWhole(x) || decStr(x) ? `${lenStr(x)} ${u}` : `${htmlQ(x)} ${u}`; }
const texLen = (x: Q) => texQ(x, true);
const KNAME: Record<Kind, string> = { cyl: 'cylinder', cone: 'cone', sphere: 'sphere', hemi: 'hemisphere' };

// ---------- real sizes ----------
/** the diameter (and height) a named object really has, in inches: a story never names a 28 ft gumball, an 18 in
 *  soup can or a 4 in water tank (the generators draw again until the object fits its numbers) */
const REAL: Record<string, { d: [number, number]; h?: [number, number] }> = {
  'basketball': { d: [8.5, 10.5] }, 'soccer ball': { d: [8.4, 9.2] }, 'bowling ball': { d: [8.4, 8.8] }, 'tennis ball': { d: [2.3, 2.9] },
  'glass marble': { d: [0.4, 2] }, 'gumball': { d: [0.4, 3] }, 'water balloon': { d: [2, 14] }, 'snow globe': { d: [2, 10] }, 'globe': { d: [4, 24] },
  'fish bowl': { d: [4, 16] }, 'gumball machine globe': { d: [6, 24] }, 'round lantern': { d: [4, 30] }, 'round water tower tank': { d: [120, 1200] },
  'water tank': { d: [12, 600], h: [12, 600] }, 'round cake pan': { d: [4, 16], h: [1, 6] }, 'rain barrel': { d: [16, 48], h: [20, 60] },
  'juice can': { d: [1.8, 5], h: [3, 8] }, 'grain silo': { d: [120, 1500], h: [240, 2400] }, 'candle': { d: [0.5, 10], h: [1, 16] },
  'snow-cone cup': { d: [2, 5], h: [2, 7] }, 'paper cone cup': { d: [2, 5], h: [2, 7] }, 'funnel': { d: [1.5, 14], h: [1.5, 16] },
  'party hat': { d: [3, 9], h: [3, 14] }, 'mixing bowl': { d: [5, 18] }, 'salad bowl': { d: [5, 18] }, 'dome tent': { d: [48, 300] },
  'igloo': { d: [60, 240] }, 'planetarium dome': { d: [300, 3000] }, 'soup can': { d: [2, 5], h: [2.5, 8] }, 'can of beans': { d: [2, 5], h: [2.5, 8] },
  'drinking glass': { d: [2, 4.5], h: [3, 8] }, 'post mold': { d: [4, 30], h: [12, 180] }, 'tube': { d: [1, 30], h: [6, 180] },
  'vase': { d: [2, 14], h: [4, 36] }, 'water heater': { d: [14, 32], h: [24, 80] }, 'cooler': { d: [8, 30], h: [8, 36] },
  'fish tank': { d: [6, 72], h: [6, 72] }, 'pool': { d: [48, 600], h: [12, 96] }, 'pencil cup': { d: [2, 6], h: [3, 7] },
  'paint can': { d: [3, 12], h: [3, 14] }, 'flower pot': { d: [2, 30], h: [2, 30] }, 'mug': { d: [2.5, 5], h: [3, 7] },
  'planter': { d: [3, 36], h: [3, 36] }, 'ice bucket': { d: [5, 16], h: [5, 16] }, 'roll of paper towels': { d: [4, 8], h: [8, 14] },
  'can': { d: [1.5, 12], h: [2, 14] }, 'pipe': { d: [0.5, 48], h: [6, 480] }, 'log': { d: [4, 48], h: [12, 480] },
  'sand pile': { d: [24, 3600] }, 'gravel pile': { d: [24, 3600] }, 'salt pile': { d: [24, 3600] }, 'road salt pile': { d: [24, 3600] },
};
const INCH: Record<string, number> = { in: 1, ft: 12, yd: 36, cm: 1 / 2.54, m: 100 / 2.54 };
/** a NOUN with diameter d (and height h) in these units is real; a pile stands no taller than its radius (45° sides) */
function real(noun: string, d: number, u: string, h?: number, hu = u): boolean {
  const s = REAL[noun];
  const dIn = d * INCH[u]!, hIn = h === undefined ? undefined : h * INCH[hu]!;
  if (/pile$/.test(noun) && hIn !== undefined && hIn > dIn / 2 + 1e-9) return false;
  if (!s) return true;
  if (dIn < s.d[0] - 1e-9 || dIn > s.d[1] + 1e-9) return false;
  return !(s.h && hIn !== undefined && (hIn < s.h[0] - 1e-9 || hIn > s.h[1] + 1e-9));
}
/** one of the nouns that is real at these sizes, or null */
function pickReal(R: () => number, nouns: readonly string[], d: number, u: string, h?: number, hu = u): string | null {
  const ok = nouns.filter(x => real(x, d, u, h, hu));
  return ok.length ? pick(R, ok) : null;
}
/** the story object of a volume item is real at its radius (and height, for a cylinder or cone) */
const realDims = (noun: string, kind: Kind, D: { r: Q; h: Q; u: string }) => real(noun, 2 * val(D.r), D.u, kind === 'cyl' || kind === 'cone' ? val(D.h) : undefined);

// ---------- pictures ----------
/** a display shape (the picture is a sketch: the ratio of height to radius is kept readable) */
function disp(kind: VKind, r: number, h: number): { r: number; h: number } {
  if (kind === 'sphere' || kind === 'dome' || kind === 'bowl') return { r: 1, h: 1 };
  const lo = kind === 'cyl' || kind === 'box' ? 0.55 : 0.95, hi = 3.0;
  return { r: 1, h: Math.min(hi, Math.max(lo, h / r)) };
}
const vk = (kind: Kind, cup = false, bowl = false): VKind => (kind === 'cyl' ? 'cyl' : kind === 'cone' ? (cup ? 'cup' : 'cone') : kind === 'sphere' ? 'sphere' : bowl ? 'bowl' : 'dome');
function one(kind: VKind, r: number, h: number, dims: Omit<Dim, 'v'>[], o: Partial<Vessel> = {}): VesselsParams {
  const d = disp(kind, r, h);
  return { vessels: [{ kind, r: d.r, h: d.h, role: 'first', ...o }], dims: dims.map(x => ({ v: 0, ...x })), maxScale: 230 };
}
const pic = (p: VesselsParams, solve: [string, number][][], hero: string[], show = ['solid', 'dims', 'caption'], set?: [string, number][]): CcsPicture =>
  ({ scene: { kind: 'vessels', p }, show, set, solve, hero });

// ---------- checks ----------
interface Trap { v: number; mc?: string; say: string }
function numCheck(exact: number, okSay: string, traps: Trap[], hint: string, o: { alt?: number[]; tol?: number; coefPi?: boolean } = {}): (r: Response) => Verdict {
  const tol = o.tol ?? 1e-6;
  return r => {
    const x = respValue(r as never);
    if (x === null) return { ok: false, say: 'Type a number.' };
    if (near(x, exact, tol) || (o.alt ?? []).some(a => near(x, a, tol))) return { ok: true, say: okSay };
    for (const t of traps) if (near(x, t.v, tol) && !near(t.v, exact, tol)) return { ok: false, mc: t.mc, say: t.say };
    if (o.coefPi) {
      if (near(x, exact * Math.PI, 1e-3) || near(x, exact * 3.14, 1e-3)) return { ok: false, say: 'That is the number with π already multiplied in. Here π stays as π: type only the number in front of it.' };
      if (Math.abs(x - exact) < 0.051 * Math.max(1, Math.abs(exact)) && !Number.isInteger(exact)) {
        const thirds = near(exact * 3, Math.round(exact * 3));
        const w = Math.floor(exact), rem = Math.round((exact - w) * 3);
        if (thirds && near(x, Number(`${w}.${rem}`))) return { ok: false, mc: MC.remainderDec, say: `A remainder is not a decimal: ${w} remainder ${rem} is ${w} and ${rem}/3, not ${w}.${rem}. Keep it as a fraction.` };
        return { ok: false, say: 'Close, but that is rounded. Keep it exact: write the fraction (like 20/3).' };
      }
    }
    return { ok: false, say: hint };
  };
}
const coefAnswer = (c: Q): Response => (isWhole(c) ? { kind: 'frac', w: c[0], n: 0, d: 1 } : { kind: 'frac', w: 0, n: c[0], d: c[1] });
function choiceCheck(right: number, says: { say: string; mc?: string }[]): (r: Response) => Verdict {
  return r => {
    if (r.kind !== 'choice') return { ok: false, say: 'Pick one.' };
    const s = says[r.i] ?? { say: 'Not that one.' };
    return r.i === right ? { ok: true, say: s.say } : { ok: false, mc: s.mc, say: s.say };
  };
}
/** shuffle choices; returns the choices, the index of the right one, and the says in the same order */
function deal(R: () => number, opts: { t: string; ok?: boolean; mc?: string; say: string }[]) {
  const o = shuffle(R, opts.slice());
  return { choices: o.map(x => x.t), right: o.findIndex(x => x.ok), says: o.map(x => ({ say: x.say, mc: x.mc })) };
}

// ---------- number ranges per sub-goal ----------
interface Dims { kind: Kind; r: Q; h: Q; d?: Q; u: U; useD: boolean; frac?: boolean }
const W = (n: number) => q(n);
function dimsFor(R: () => number, kind: Kind, sg: string, u: U): Dims {
  if (sg === 'diameter-given' || (sg === 'mixed-formula-choice' && R() < 0.5)) {
    const d = 2 * int(R, 1, 10);
    return { kind, r: W(d / 2), h: W(int(R, 2, 12)), d: W(d), u, useD: true };
  }
  if (sg === 'decimal-dimensions') {
    const c = int(R, 0, 3);
    if (kind === 'sphere' || kind === 'hemi') { const r = pick(R, [q(1, 2), q(3, 2), q(5, 2)]); return { kind, r, h: q(0), u, useD: false, frac: true }; }
    if (c === 0) { const d = pick(R, [3, 5, 7, 9, 11]); return { kind, r: q(d, 2), h: W(kind === 'cone' ? pick(R, [3, 6, 9, 12]) : int(R, 2, 10)), d: W(d), u, useD: true }; }
    if (c === 1) return { kind, r: qd(pick(R, [0.5, 1.5, 2.5, 3.5, 4.5])), h: W(kind === 'cone' ? pick(R, [3, 6, 9, 12]) : int(R, 2, 10)), u, useD: false };
    if (c === 2) return { kind, r: W(int(R, 2, 6)), h: qd(pick(R, [1.5, 2.5, 3.5, 4.5, 2.4, 1.2])), u, useD: false };
    return { kind, r: qd(pick(R, [0.5, 1.5, 2.5])), h: W(kind === 'cone' ? pick(R, [6, 12]) : int(R, 2, 8)), u, useD: false };
  }
  const rMax = kind === 'sphere' || kind === 'hemi' ? 10 : 12;
  return { kind, r: W(int(R, 1, rMax)), h: W(int(R, 1, 12)), u, useD: false };
}
const kindFor = (R: () => number, sg: string): Kind =>
  sg === 'cylinder-volume-calc' ? 'cyl' : sg === 'cone-volume-calc' ? 'cone' : sg === 'sphere-volume-calc' ? 'sphere' : sg === 'hemisphere-volume' ? 'hemi'
    : pick(R, ['cyl', 'cone', 'sphere', 'hemi'] as const);
const FORMULA: Record<Kind, string> = { cyl: 'V = \\pi r^2 h', cone: 'V = \\tfrac13 \\pi r^2 h', sphere: 'V = \\tfrac43 \\pi r^3', hemi: 'V = \\tfrac23 \\pi r^3' };

/** the worked lines (TeX + HTML) and the slips of one volume calculation */
function volWork(D: Dims): { c: Q; hero: string[]; sol: string[]; traps: Trap[] } {
  const { kind, r, h, u } = D, c = coef(kind, r, h);
  const rT = texLen(r), hT = texLen(h);
  const hero: string[] = [], sol: string[] = [];
  if (D.useD) { hero.push(`r = ${texLen(D.d!)} \\div 2 = ${rT}`); sol.push(`The radius is half the diameter: ${lenStr(D.d!)} ÷ 2 = ${lenStr(r)} ${u}.`); }
  const r2 = pow(r, 2), r3 = pow(r, 3);
  if (kind === 'cyl') {
    hero.push(`V = \\pi \\cdot ${rT}^2 \\cdot ${hT}`, `= ${texQ(r2, true)}\\pi \\cdot ${hT}`);
    sol.push(`One layer (the base): π · ${lenStr(r)}² = ${htmlPi(r2, true)} ${sq(u)}.`, `${lenStr(h)} ${u} of layers: ${htmlPi(r2, true)} · ${lenStr(h)} = <b>${htmlPi(c, true)} ${cu(u)}</b>.`);
  } else if (kind === 'cone') {
    const cyl = mul(r2, h);
    hero.push(`V = \\tfrac13 \\pi \\cdot ${rT}^2 \\cdot ${hT}`, `= \\tfrac13 \\cdot ${texQ(cyl, true)}\\pi`);
    sol.push(`The matching cylinder: π · ${lenStr(r)}² · ${lenStr(h)} = ${htmlPi(cyl, true)} ${cu(u)}.`, `The cone holds one third of it: <b>${htmlPi(c, true)} ${cu(u)}</b>.`);
  } else if (kind === 'sphere') {
    hero.push(`V = \\tfrac43 \\pi \\cdot ${rT}^3`, `= \\tfrac43 \\cdot ${texQ(r3, true)}\\pi`);
    sol.push(`Cube the radius first: ${lenStr(r)}³ = ${htmlQ(r3, true)}.`, `Then × 4/3: <b>${htmlPi(c, true)} ${cu(u)}</b>.`);
  } else {
    const sp = coef('sphere', r);
    hero.push(`V = \\tfrac12 \\cdot \\tfrac43 \\pi \\cdot ${rT}^3`, `= \\tfrac12 \\cdot ${texPi(sp, true)}`);
    sol.push(`The whole sphere: 4/3 · π · ${lenStr(r)}³ = ${htmlPi(sp, true)} ${cu(u)}.`, `Half of it: <b>${htmlPi(c, true)} ${cu(u)}</b>.`);
  }
  hero.push(`= ${texPi(c, true)}${tu(u)}`);
  const traps: Trap[] = [];
  const at = (rr: Q) => val(coef(kind, rr, h));
  if (D.useD) {
    traps.push({ v: at(D.d!), mc: MC.dForR, say: `That uses the diameter, ${lenStr(D.d!)}, as the radius. The radius is half of it: ${lenStr(r)}.` });
    traps.push({ v: at(D.d!) / 2, mc: MC.halvesVolume, say: 'Halving the volume is not the same as halving the diameter. Halve the diameter first, then use the radius.' });
  }
  if (kind === 'cyl') {
    traps.push({ v: val(mul(q(2), r, h)), mc: MC.circH, say: '2πrh is the label around the can (its side), not the space inside. A layer is the base area πr².' });
    traps.push({ v: val(mul(r3, h)), mc: MC.cubesR, say: `The base is a circle: its area uses r², not r³.` });
  }
  if (kind === 'cone') {
    traps.push({ v: val(mul(r2, h)), mc: MC.dropsCoef, say: 'That is the whole matching cylinder. A cone holds one third of it.' });
    traps.push({ v: val(mul(r2, h)) / 9, mc: MC.thirdTwice, say: 'The one third is used once. You divided by 3 twice.' });
    traps.push({ v: val(mul(r2, h)) / 2, mc: MC.coneHalf, say: 'A cone holds one third of its cylinder, not one half: three cones fill it.' });
    traps.push({ v: val(mul(q(4, 3), r2, h)), mc: MC.swapsCoef, say: '4/3 belongs to the sphere. The cone uses 1/3.' });
  }
  if (kind === 'sphere') {
    traps.push({ v: val(mul(q(4, 3), r2)), mc: MC.wrongPower, say: 'A sphere’s volume cubes the radius: r³, not r².' });
    traps.push({ v: val(r3), mc: MC.dropsCoef, say: 'Keep the 4/3: V = 4/3 · π · r³.' });
    traps.push({ v: val(mul(q(1, 3), r3)), mc: MC.swapsCoef, say: '1/3 belongs to the cone. The sphere uses 4/3.' });
    traps.push({ v: val(mul(q(4), r2)), mc: MC.saVol, say: '4πr² is the sphere’s surface (the skin), not the space inside.' });
    traps.push({ v: val(mul(q(4), r)), mc: MC.powerTimes, say: `${lenStr(r)}³ means ${lenStr(r)} · ${lenStr(r)} · ${lenStr(r)}, not ${lenStr(r)} · 3.` });
  }
  if (kind === 'hemi') {
    traps.push({ v: val(coef('sphere', r)), mc: MC.fullForPart, say: 'That is the whole sphere. A hemisphere is half of it.' });
    traps.push({ v: val(coef('sphere', div(r, q(2)))), mc: MC.halvesRadius, say: 'Halving the radius makes a much smaller sphere (one eighth). Keep the radius and take half the volume.' });
    traps.push({ v: val(mul(q(2, 3), r2)), mc: MC.wrongPower, say: 'Cube the radius: r³, not r².' });
  }
  if (!isWhole(r)) {
    // squares each digit: 2.5 -> 4.25
    const s = lenStr(r);
    const m = /^(\d+)\.(\d)$/.exec(s);
    if (m) {
      const bad = Number(`${Number(m[1]) ** 2}.${Number(m[2]) ** 2}`);
      const badQ = qd(bad);
      const v = kind === 'cyl' ? val(mul(badQ, h)) : kind === 'cone' ? val(mul(q(1, 3), badQ, h)) : NaN;
      if (Number.isFinite(v)) traps.push({ v, mc: MC.digitSquares, say: `${s}² is ${s} · ${s} = ${decStr(r2)}, not ${bad}: square the whole number, not each digit.` });
    }
  }
  return { c, hero, sol, traps };
}
function volPicture(D: Dims, o: { cup?: boolean; bowl?: boolean; caption?: string; askH?: boolean; askR?: boolean } = {}): VesselsParams {
  const kind = vk(D.kind, o.cup, o.bowl);
  const dims: Omit<Dim, 'v'>[] = [];
  if (o.askR) dims.push({ what: 'r', text: 'r = ?', col: 'pick' });
  else dims.push({ what: D.useD ? 'd' : 'r', text: lab(D.useD ? D.d! : D.r, D.u) });
  if (D.kind === 'cyl' || D.kind === 'cone') dims.push(o.askH ? { what: 'h', text: 'h = ?', col: 'pick' } : { what: 'h', text: lab(D.h, D.u) });
  return one(kind, val(D.r), val(D.h), dims, { caption: o.caption });
}

// ---------- contexts ----------
interface Ctx { noun: string; u: U; stuff: string; cup?: boolean; bowl?: boolean }
const CTX: Record<Kind, Ctx[]> = {
  cyl: [{ noun: 'juice can', u: 'in', stuff: 'juice' }, { noun: 'water tank', u: 'ft', stuff: 'water' }, { noun: 'candle', u: 'in', stuff: 'wax' }, { noun: 'grain silo', u: 'yd', stuff: 'grain' }, { noun: 'round cake pan', u: 'in', stuff: 'batter' }, { noun: 'rain barrel', u: 'ft', stuff: 'rainwater' }],
  cone: [{ noun: 'funnel', u: 'in', stuff: 'oil', cup: true }, { noun: 'snow-cone cup', u: 'in', stuff: 'shaved ice', cup: true }, { noun: 'sand pile', u: 'ft', stuff: 'sand' }, { noun: 'salt pile', u: 'yd', stuff: 'road salt' }, { noun: 'paper cone cup', u: 'in', stuff: 'water', cup: true }, { noun: 'gravel pile', u: 'ft', stuff: 'gravel' }],
  sphere: [{ noun: 'basketball', u: 'in', stuff: 'air' }, { noun: 'water balloon', u: 'in', stuff: 'water' }, { noun: 'globe', u: 'in', stuff: 'space' }, { noun: 'round water tower tank', u: 'ft', stuff: 'water' }, { noun: 'gumball', u: 'in', stuff: 'gum' }, { noun: 'snow globe', u: 'in', stuff: 'water' }],
  hemi: [{ noun: 'dome tent', u: 'ft', stuff: 'air' }, { noun: 'salad bowl', u: 'in', stuff: 'salad', bowl: true }, { noun: 'igloo', u: 'ft', stuff: 'air' }, { noun: 'mixing bowl', u: 'in', stuff: 'batter', bowl: true }, { noun: 'planetarium dome', u: 'yd', stuff: 'air' }],
};

/** the worked steps mark their answer for the steps card (docs/lessons/QUALITY_LAYER.md): the last plain <b>…</b> becomes
 *  <b class="s">…</b> (the answer colour) */
function markLast(sol: string[]): string[] {
  for (let i = sol.length - 1; i >= 0; i--) {
    const at = sol[i]!.lastIndexOf('<b>');
    if (at >= 0) return sol.map((l, j) => (j === i ? l.slice(0, at) + '<b class="s">' + l.slice(at + 3) : l));
  }
  return sol;
}
function coefItem(id: string, family: string, prompt: string, board: string, u: string, c: Q, sol: string[], traps: Trap[], hint: string, picture: CcsPicture): It {
  return { id, family, prompt, board, input: 'frac', unit: piUnit(u), answer: coefAnswer(c), solution: markLast(sol), picture,
    check: numCheck(val(c), `Yes: ${htmlPi(c, true)} ${cu(u)}.`, traps, hint, { coefPi: true }) } as It;
}
function numItem(id: string, family: string, prompt: string, board: string, unit: string, v: number, sol: string[], traps: Trap[], hint: string, picture: CcsPicture, o: { alt?: number[]; okSay?: string } = {}): It {
  return { id, family, prompt, board, input: 'num', unit, answer: { kind: 'num', v }, solution: markLast(sol), picture,
    check: numCheck(v, o.okSay ?? `Yes: ${v} ${unit}.`, traps, hint, { alt: o.alt }) } as It;
}
function choiceItem(id: string, family: string, prompt: string, board: string, opts: { t: string; ok?: boolean; mc?: string; say: string }[], R: () => number, sol: string[], picture: CcsPicture): It {
  const d = deal(R, opts);
  return { id, family, prompt, board, input: 'choice', choices: d.choices, answer: { kind: 'choice', i: d.right }, solution: endOnChoice(sol, d.choices[d.right]!), picture, check: choiceCheck(d.right, d.says) } as It;

}
const pairOf = (x: number, y: number): Response => ({ kind: 'pair', x, y });

// ===================== the families =====================
/** a pictured solid: find its exact volume (sub-goals 5-10, 12) */
const calcPic: Gen = (R, n, sg = 'cylinder-volume-calc') => {
  const kind = sg === 'decimal-dimensions' ? pick(R, ['cyl', 'cone', 'cyl', 'cone', 'sphere'] as const) : kindFor(R, sg);
  const u: U = pick(R, ['in', 'ft', 'yd', 'in', 'cm'] as const);
  const D = dimsFor(R, kind, sg, u === 'cm' && sg !== 'decimal-dimensions' ? 'in' : u);
  const w = volWork(D);
  const ref = ['cylinder-volume-calc', 'cone-volume-calc', 'sphere-volume-calc', 'hemisphere-volume'].includes(sg);
  const given = D.useD ? `diameter ${A(len(D.d!, D.u))}` : `radius ${A(len(D.r, D.u))}`;
  const hTxt = kind === 'cyl' || kind === 'cone' ? ` and height ${A(len(D.h, D.u))}` : '';
  const prompt = `This ${KNAME[kind]} has ${given}${hTxt}. What is its volume? Give it exactly, in terms of π.`;
  const P = volPicture(D, { bowl: kind === 'hemi' && R() < 0.4 });
  return coefItem(`calc-pic-${n}`, 'calc-pic', prompt, ref ? FORMULA[kind] : 'V = \\,?', D.u, w.c, w.sol, w.traps,
    kind === 'cone' ? 'Find the matching cylinder first (π r² h), then take one third.' : kind === 'cyl' ? 'One layer is the base, π r². Then times the height.' : kind === 'sphere' ? 'Cube the radius, then multiply by 4/3.' : 'Find the whole sphere (4/3 π r³), then take half.',
    pic(P, [[['dims', 1]]], w.hero));
};
/** a word problem with a real object (sub-goals 5-10, 24) */
const calcStory: Gen = (R, n, sg = 'cylinder-volume-calc') => {
  const kind = kindFor(R, sg);
  // a story object at a real size (no 28 ft gumball): draw again until it is
  let cx = pick(R, CTX[kind]), D = dimsFor(R, kind, sg === 'model-practical' ? 'x' : sg, cx.u);
  for (let t = 0; t < 400 && !realDims(cx.noun, kind, D); t++) { cx = pick(R, CTX[kind]); D = dimsFor(R, kind, sg === 'model-practical' ? 'x' : sg, cx.u); }
  const w = volWork(D);
  const given = D.useD ? `is ${A(len(D.d!, D.u))} across (its diameter)` : `has a radius of ${A(len(D.r, D.u))}`;
  const hTxt = kind === 'cyl' || kind === 'cone' ? `${kind === 'cone' && !cx.cup ? ' and is' : ' and is'} ${A(len(D.h, D.u))} ${cx.cup ? 'deep' : 'tall'}` : '';
  const P = volPicture(D, { cup: cx.cup, bowl: cx.bowl, caption: cx.noun });
  if (sg === 'model-practical') {
    const exact = val(w.c) * Math.PI, ans = roundTo(exact, 1);
    const prompt = `A ${cx.noun} ${given}${hTxt}. Model it as a ${KNAME[kind]}. How much ${cx.stuff} does it hold? Use the π key and round to the nearest tenth.`;
    return numItem(`calc-story-${n}`, 'calc-story', prompt, FORMULA[kind], cu(D.u), ans, [...w.sol, `${htmlPi(w.c, true)} ≈ <b>${ans} ${cu(D.u)}</b> (π key, then round).`],
      [...w.traps.map(t => ({ ...t, v: roundTo(t.v * Math.PI, 1) })), { v: roundTo(val(w.c) * 3.14, 1), say: 'That used 3.14. This one asks for the π key.' }, { v: roundTo(val(w.c), 1), mc: MC.omitsUnit, say: 'That is the number in front of π. Multiply by π too.' }],
      'Model it as the solid, find the exact volume in terms of π, then multiply by π and round.', pic(P, [[['dims', 1]]], [...w.hero, `\\approx ${ans}${tu(D.u)}`]),
      { alt: [roundTo(val(w.c) * 3.14, 1)], okSay: `Yes: about ${ans} ${cu(D.u)} of ${cx.stuff}.` });
  }
  const prompt = `A ${cx.noun} ${given}${hTxt}. How much ${cx.stuff} can it hold? Give the exact volume in terms of π.`;
  return coefItem(`calc-story-${n}`, 'calc-story', prompt, 'V = \\,?', D.u, w.c, [`Model the ${cx.noun} as a ${KNAME[kind]}.`, ...w.sol], w.traps,
    `A ${cx.noun} is a ${KNAME[kind]}: use its formula.`, pic(P, [[['dims', 1]]], w.hero));
};

/** which length is h (or r)? a cone with r, perpendicular h and slant l (3-4-5 style), upright or turned */
const idLengths: Gen = (R, n) => {
  const [a0, b0, c0] = pick(R, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25]] as const);
  const swap = R() < 0.5, r = swap ? b0 : a0, h = swap ? a0 : b0, l = c0;
  if (r > h * 1.6) return idLengths(R, n);
  const u: U = pick(R, ['in', 'ft', 'cm', 'yd'] as const);
  const cup = R() < 0.3, tilt = cup ? 0 : pick(R, [0, 0, 90, -90]);
  const ask = R() < 0.7 ? 'h' : 'r';
  const P = one(cup ? 'cup' : 'cone', r, h, [{ what: 'r', text: `${r} ${u}` }, { what: 'h', text: `${h} ${u}` }, { what: 'l', text: `${l} ${u}` }], { tilt });
  P.vessels[0]!.r = r; P.vessels[0]!.h = h;
  const opts = ask === 'h'
    ? [{ t: `${h} ${u}`, ok: true, say: `Yes: ${h} ${u} goes straight from the tip to the center of the base, square to it.` },
      { t: `${l} ${u}`, mc: MC.slantAsH, say: `${l} ${u} runs along the slanted side. The height for the volume is the straight distance from the tip to the base, square to the base.` },
      { t: `${r} ${u}`, say: `${r} ${u} goes from the center of the base to its edge: that is the radius.` }]
    : [{ t: `${r} ${u}`, ok: true, say: `Yes: the radius runs from the center of the circle to its edge.` },
      { t: `${l} ${u}`, mc: MC.slantAsH, say: `${l} ${u} is the slanted side, not a radius.` },
      { t: `${h} ${u}`, say: `${h} ${u} is the height: from the tip square to the base.` }];
  return choiceItem(`id-lengths-${n}`, 'id-lengths', `This cone is marked ${[r, h, l].sort((x, y) => x - y).map(x => A(`${x} ${u}`)).join(', ')}. ` + (ask === 'h' ? `Which length is the height ${S('h')} you use in its volume formula?` : `Which length is its radius ${S('r')}?`),
    'V = \\tfrac13 \\pi r^2 h', opts, R, [`The height h is square to the base (the dashed line with the right angle): ${h} ${u}.`, `The slanted side, ${l} ${u}, is the slant height: it is not used for the volume.`],
    pic(P, [[['dims', 1]]], [`r = ${r},\\ h = ${h}`]));
};
/** a sphere: what does its volume need / how tall is it? */
const idSphere: Gen = (R, n) => {
  let cx = pick(R, CTX.sphere), r = int(R, 2, 20);
  for (let t = 0; t < 400 && !real(cx.noun, 2 * r, cx.u); t++) { cx = pick(R, CTX.sphere); r = int(R, 1, 20); }
  const useD = R() < 0.35, u = cx.u;
  const P = one('sphere', 1, 1, [{ what: useD ? 'd' : 'r', text: `${useD ? 2 * r : r} ${u}` }], { caption: cx.noun });
  const giv = useD ? `is ${A(`${2 * r} ${u}`)} across` : `has a radius of ${A(`${r} ${u}`)}`;
  if (R() < 0.5) {
    return choiceItem(`id-sphere-${n}`, 'id-sphere', `A ${cx.noun} ${giv}. How tall is it?`, '\\text{height} = \\,?', [
      { t: `${2 * r} ${u}`, ok: true, say: `Yes: a sphere is as tall as it is wide. Its height is its diameter, ${2 * r} ${u}.` },
      { t: `${r} ${u}`, mc: MC.sphereHeight, say: `${r} ${u} is the radius, half-way up. The ball stands as tall as its diameter.` },
      { t: 'You can’t tell without measuring the height', mc: MC.sphereHeight, say: 'A sphere has no separate height: its height is always its diameter.' },
      { t: `${4 * r} ${u}`, say: `That is twice the diameter. A sphere is exactly as tall as its diameter.` },
    ], R, [`Every slice through the center of a sphere is a circle with the same diameter, so its height is ${2 * r} ${u}.`], pic(P, [[['dims', 1]]], [`h = 2r = ${2 * r}`]));
  }
  return choiceItem(`id-sphere-${n}`, 'id-sphere', `A ${cx.noun} ${giv}. What do you need to know to find its volume?`, 'V = \\tfrac43 \\pi r^3', [
    { t: `Only its radius: ${r} ${u}`, ok: true, say: 'Yes: the radius fixes the whole sphere. V = 4/3 π r³.' },
    { t: 'Its radius and its height', mc: MC.sphereHeight, say: 'A sphere’s height is always its diameter, 2r, so it is not a separate measurement.' },
    { t: 'Its height only', mc: MC.sphereHeight, say: 'The formula uses the radius. The height is just 2r.' },
    { t: 'Its radius and its circumference', say: 'The circumference comes from the radius anyway. The radius alone is enough.' },
  ], R, ['V = 4/3 π r³ has only r in it. The radius is the only input.'], pic(P, [[['dims', 1]]], ['V = \\tfrac43 \\pi r^3']));
};
/** a can lying on its side: read r and h off the picture */
const idLying: Gen = (R, n) => {
  const d = 2 * int(R, 1, 9), h = int(R, 2, 20), u: U = pick(R, ['in', 'ft', 'cm'] as const), useD = R() < 0.6, r = d / 2;
  if (h === d || h === r) return idLying(R, n + 1);
  const noun = pickReal(R, ['can', 'pipe', 'log', 'roll of paper towels'], d, u, h);
  if (!noun) return idLying(R, n + 1);
  const P = one('cyl', r, h, [{ what: useD ? 'd' : 'r', text: `${useD ? d : r} ${u}` }, { what: 'h', text: `${h} ${u}` }], { tilt: pick(R, [90, -90]) });
  return {
    id: `id-lying-${n}`, family: 'id-lying', prompt: `This ${noun} is lying on its side, marked ${A(`${useD ? d : r} ${u}`)} and ${A(`${h} ${u}`)}. What are its radius ${S('r')} and height ${S('h')} for the volume formula?`,
    board: 'V = \\pi r^2 h', input: 'pair', pairLead: 'r =', pairOp: `${u}, &nbsp;h =`, pairTail: u, answer: pairOf(r, h),
    solution: [useD ? `The diameter is ${d} ${u}, so the radius is <b class="s">${r} ${u}</b>.` : `The radius is <b class="s">${r} ${u}</b>.`, `The height runs between the two circular ends: <b class="s">${h} ${u}</b>, even when the can lies down.`],
    picture: pic(P, [[['dims', 1]]], [`r = ${r},\\ h = ${h}`]),
    check: (x: Response): Verdict => {
      if (x.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      if (x.x === r && x.y === h) return { ok: true, say: `Yes: r = ${r} ${u}, h = ${h} ${u}. The height is the distance between the circles, whichever way the can lies.` };
      if (x.x === d) return { ok: false, mc: MC.dForR, say: `${d} ${u} is all the way across: the diameter. The radius is half of it.` };
      if (x.x === h && x.y === r) return { ok: false, say: 'Those are swapped. The height runs between the two circular ends, even when they point sideways.' };
      return { ok: false, say: 'The radius is center to edge of a circular end; the height is the distance between the two ends.' };
    },
  } as It;
};

/** a stack of layers: V = (one layer) x (number of layers) */
const bhLayers: Gen = (R, n) => {
  // every layer is 1 unit thick: things that really come that thick, at their real radius
  const L0 = pick(R, [{ t: 'a stack of round crackers', u: 'cm', r: [2, 4] }, { t: 'a stack of round pancakes', u: 'cm', r: [5, 10] },
    { t: 'a stack of round foam coasters', u: 'cm', r: [4, 6] }, { t: 'a stack of round cake layers', u: 'in', r: [3, 6] }] as const);
  const thing = L0.t, u: U = L0.u, r = int(R, L0.r[0], L0.r[1]), h = int(R, 2, 12), giveB = R() < 0.5, B2 = r * r;
  const P: VesselsParams = { vessels: [{ kind: 'cyl', r: 1, h: Math.min(3, Math.max(0.6, h / r)), role: 'first', layers: { n: h, key: 'layers' }, ghost: false }], dims: [giveB ? { v: 0, what: 'h', text: `${h} ${u}` } : { v: 0, what: 'r', text: `${r} ${u}` }, ...(giveB ? [] : [{ v: 0, what: 'h' as const, text: `${h} ${u}` }])], maxScale: 230 };
  const prompt = giveB
    ? `${thing[0]!.toUpperCase() + thing.slice(1)}: each layer is ${A(`1 ${u}`)} thick with a top area of ${A(`${B2}π ${sq(u)}`)}. The stack is ${A(`${h} ${u}`)} tall. What is its volume?`
    : `${thing[0]!.toUpperCase() + thing.slice(1)} makes a cylinder with radius ${A(`${r} ${u}`)}, ${A(`${h} ${u}`)} tall: ${h} layers, each ${A(`1 ${u}`)} thick. What is its volume?`;
  const c = q(B2 * h);
  return coefItem(`bh-layers-${n}`, 'bh-layers', prompt, 'V = B \\cdot h', u, c,
    [`One layer is the base: B = π · ${r}² = ${B2}π ${sq(u)}, and it is 1 ${u} thick, so ${B2}π ${cu(u)}.`, `${h} layers: ${B2}π · ${h} = <b>${B2 * h}π ${cu(u)}</b>.`],
    [{ v: 2 * r * h, mc: MC.circH, say: '2πrh wraps around the side. A layer’s size is its area, π r².' }, { v: B2, say: `That is one layer. There are ${h} of them.` }, { v: B2 + h, say: 'Layers stack: multiply the layer by the number of layers, don’t add.' }, { v: r * r * r * h, mc: MC.cubesR, say: 'The base is a circle: π r², not π r³.' }],
    'Volume = one layer (the base area) × the number of layers (the height).',
    pic(P, [[['base', 1]], [['layers', 1]]], [`B = \\pi \\cdot ${r}^2 = ${B2}\\pi`, `V = ${B2}\\pi \\cdot ${h}`, `= ${B2 * h}\\pi${tu(u)}`], ['solid', 'dims'], [['layers', 0.35]]));
};
/** a box and a cylinder with equal base areas: who holds more? */
const bhTwin: Gen = (R, n) => {
  const B2 = int(R, 6, 40), h1 = int(R, 3, 12), same = R() < 0.55, h2 = same ? h1 : h1 + pick(R, [-2, -1, 1, 2, 3]);
  const u: U = pick(R, ['in', 'cm', 'ft'] as const);
  const side = Math.sqrt(B2), rr = Math.sqrt(B2 / Math.PI), sc = Math.min(1 / side, 2.6 / Math.max(h1, h2));
  const P: VesselsParams = {
    vessels: [{ kind: 'box', l: side * sc, w: side * sc, h: h1 * sc, role: 'first', caption: 'box' }, { kind: 'cyl', r: rr * sc, h: h2 * sc, role: 'second', caption: 'cylinder' }],
    dims: [{ v: 0, what: 'h', text: `${h1} ${u}` }, { v: 1, what: 'h', text: `${h2} ${u}`, col: 'second' }], maxScale: 170, gap: 190,
  };
  const prompt = `A box and a cylinder both have a base area of ${A(`${B2} ${sq(u)}`)}. The box is ${B(`${h1} ${u}`)} tall, the cylinder ${B(`${h2} ${u}`)}. Which holds more?`;
  const opts = same ? [
    { t: 'They hold the same', ok: true, say: `Yes: each is ${B2} ${sq(u)} of layer, ${h1} layers high: ${B2 * h1} ${cu(u)} each.` },
    { t: 'The box', mc: MC.bhBoxes, say: 'V = Bh works for any stack of equal layers, round ones too. Same layer, same height, same volume.' },
    { t: 'The cylinder', say: 'Its layers are the same size as the box’s, and there are as many. Neither holds more.' },
    { t: 'You can’t compare: V = Bh is only for boxes', mc: MC.bhBoxes, say: 'A cylinder is a stack of circular layers, so V = Bh works for it too.' },
  ] : [
    { t: h1 > h2 ? 'The box' : 'The cylinder', ok: true, say: `Yes: equal layers, and the ${h1 > h2 ? 'box' : 'cylinder'} has more of them: ${B2 * Math.max(h1, h2)} ${cu(u)} against ${B2 * Math.min(h1, h2)} ${cu(u)}.` },
    { t: h1 > h2 ? 'The cylinder' : 'The box', mc: h1 > h2 ? undefined : MC.bhBoxes, say: 'Same layer size, so the taller one holds more.' },
    { t: 'They hold the same: their bases match', say: 'Equal bases are not enough: the heights differ, so the number of layers differs.' },
    { t: 'You can’t compare: V = Bh is only for boxes', mc: MC.bhBoxes, say: 'A cylinder is a stack of circular layers, so V = Bh works for it too.' },
  ];
  return choiceItem(`bh-twin-${n}`, 'bh-twin', prompt, 'V = B \\cdot h', opts, R, [`Box: ${B2} · ${h1} = ${B2 * h1} ${cu(u)}.`, `Cylinder: ${B2} · ${h2} = ${B2 * h2} ${cu(u)}.`],
    pic(P, [[['dims', 1]]], [`${B2} \\cdot ${h1} = ${B2 * h1}`, `${B2} \\cdot ${h2} = ${B2 * h2}`]));
};
/** which product is the can's volume (layer x layers)? */
const bhLayerArea: Gen = (R, n) => {
  // r = 2 would make 2π·r·h equal to π·r²·h (two right choices); the can has a real size
  const r = int(R, 3, 9), h = int(R, 2, 12), u: U = pick(R, ['in', 'cm'] as const);
  if (r === h || 2 * r === h || !real('can', 2 * r, u, h)) return bhLayerArea(R, n + 1);
  const P = one('cyl', r, h, [{ what: 'r', text: `${r} ${u}` }, { what: 'h', text: `${h} ${u}` }]);
  return choiceItem(`bh-layer-area-${n}`, 'bh-layer-area', `This can has radius ${A(`${r} ${u}`)} and height ${A(`${h} ${u}`)}. Its volume is (one layer) × (number of layers). Which product gives it?`, 'V = B \\cdot h', [
    { t: `π · ${r}² · ${h}`, ok: true, say: `Yes: one layer is the circle π · ${r}², and there are ${h} ${u} of layers.` },
    { t: `2π · ${r} · ${h}`, mc: MC.circH, say: `2π · ${r} is the distance around the circle, not its area. That product is the label on the side.` },
    { t: `π · ${r}³ · ${h}`, mc: MC.cubesR, say: 'A layer is a flat circle: its area is π r², not π r³.' },
    { t: `π · ${2 * r}² · ${h}`, mc: MC.dForR, say: `${2 * r} ${u} would be the diameter. The circle’s area uses the radius.` },
  ], R, [`One layer: B = π · ${r}² = ${r * r}π ${sq(u)}.`, `${h} layers: V = ${r * r}π · ${h} = ${r * r * h}π ${cu(u)}.`],
    pic(P, [[['base', 1]], [['dims', 1]]], [`V = \\pi \\cdot ${r}^2 \\cdot ${h}`, `= ${r * r * h}\\pi`]));
};

/** pour the cone into its cylinder: a third */
const conePour: Gen = (R, n) => {
  const r = int(R, 2, 6), h = int(R, 3, 9), u: U = pick(R, ['in', 'cm'] as const), cylV = 3 * int(R, 4, 60), back = R() < 0.4;
  const P: VesselsParams = {
    vessels: [{ kind: 'cup', r, h, role: 'first', water: 'w0', caption: 'cone' }, { kind: 'cyl', r, h, role: 'second', water: 'w1', caption: 'cylinder' }],
    dims: [{ v: 1, what: 'r', text: 'r', col: 'second' }, { v: 1, what: 'h', text: 'h', col: 'second' }, { v: 0, what: 'r', text: 'r' }, { v: 0, what: 'h', text: 'h', optional: true }],
    pours: [{ from: 0, to: 1, key: 'pour' }], maxScale: 120,
  };
  const solve: [string, number][][] = [[['pour', 1]], [['w0', 0], ['w1', 1 / 3]], [['pour', 0]]];
  if (back) {
    const coneV = cylV / 3;
    return numItem(`cone-pour-${n}`, 'cone-pour', `A cone and a cylinder have the same radius and the same height. The cone holds ${A(`${coneV} ${cu(u)}`)}. How much does the cylinder hold?`, 'V_{cyl} = \\,?',
      cu(u), cylV, [`Three full cones fill the matching cylinder.`, `3 · ${coneV} = <b>${cylV} ${cu(u)}</b>.`],
      [{ v: 2 * coneV, mc: MC.coneHalf, say: 'Two cones fill only two thirds. It takes three.' }, { v: coneV / 3, say: 'The cylinder is the bigger one: multiply by 3.' }, { v: coneV, say: 'The cone fills only one third of it.' }],
      'Pour the cone in: it fills one third. How many cones fill the cylinder?', pic(P, solve, [`V_{cyl} = 3 \\cdot ${coneV}`, `= ${cylV}${tu(u)}`], ['solid', 'dims', 'caption'], [['w0', 1]]));
  }
  return numItem(`cone-pour-${n}`, 'cone-pour', `A cone and a cylinder have the same radius and the same height. The cylinder holds ${A(`${cylV} ${cu(u)}`)}. How much does the cone hold?`, 'V_{cone} = \\,?',
    cu(u), cylV / 3, [`The cone poured into the cylinder fills it one third of the way up.`, `${cylV} ÷ 3 = <b>${cylV / 3} ${cu(u)}</b>.`],
    [{ v: cylV / 2, mc: MC.coneHalf, say: 'Watch the pour: the cone fills the cylinder only one third of the way, not half.' }, { v: cylV / 9, mc: MC.thirdTwice, say: 'Divide by 3 once: the cone is one third of its cylinder.' }, { v: cylV, mc: MC.dropsCoef, say: 'That is the whole cylinder. The cone fills one third of it.' }, { v: cylV * 3, say: 'The cone is smaller than the cylinder: divide, don’t multiply.' }],
    'Pour the cone into the cylinder: how far up does it come?', pic(P, solve, [`V_{cone} = \\tfrac13 \\cdot ${cylV}`, `= ${cylV / 3}${tu(u)}`], ['solid', 'dims', 'caption'], [['w0', 1]]));
};
/** which cylinder does this cone fill exactly a third of? */
const coneMatch: Gen = (R, n) => {
  const r = int(R, 2, 6), h = int(R, 3, 9), u: U = pick(R, ['in', 'cm'] as const);
  const h2 = h + pick(R, [-2, 2, 3]), r2 = r + pick(R, [-1, 1, 2]);
  const cyls = shuffle(R, [{ r, h, ok: true }, { r, h: h2, ok: false, why: 'same radius, different height' }, { r: r2, h, ok: false, why: 'same height, different radius' }]);
  const names = ['A', 'B', 'C'];
  const sc = 1 / Math.max(r, r2, h / 2, h2 / 2);
  const P: VesselsParams = {
    vessels: [{ kind: 'cone', r: r * sc, h: h * sc, role: 'first', caption: 'cone' }, ...cyls.map((c, i) => ({ kind: 'cyl' as const, r: c.r * sc, h: c.h * sc, role: 'second' as const, caption: names[i] }))],
    maxScale: 230, gap: 90,
  };
  const prompt = `A cone has radius ${A(`${r} ${u}`)} and height ${A(`${h} ${u}`)}. Which cylinder holds exactly 3 of these cones?`;
  const opts = cyls.map((c, i) => c.ok
    ? { t: `${names[i]}: r = ${c.r} ${u}, h = ${c.h} ${u}`, ok: true, say: 'Yes: same base and same height. Only that cylinder takes exactly three cones.' }
    : { t: `${names[i]}: r = ${c.r} ${u}, h = ${c.h} ${u}`, mc: MC.thirdAny, say: `This one has the ${c.why}. The one-third rule needs the same base AND the same height.` });
  return choiceItem(`cone-match-${n}`, 'cone-match', prompt, 'V_{cone} = \\tfrac13 V_{cyl}', opts, R, ['A cone is one third of the cylinder with the same radius and the same height.', 'Any other cylinder holds a different amount.'],
    pic(P, [[['caption', 1]]], [`r = ${r},\\ h = ${h}`]));
};
/** pour the ball into the can that just holds it: two thirds */
const sphPour: Gen = (R, n) => {
  const u: U = pick(R, ['in', 'cm'] as const), exact = R() < 0.5;
  const solve: [string, number][][] = [[['pour', 1]], [['w0', 0], ['w1', 2 / 3]], [['pour', 0]]];
  if (exact) {
    // radius given: the can is pi r^2 (2r) = 2 r^3 pi, the ball two thirds of it (an exact coefficient)
    const r = int(R, 1, 9), can = 2 * r * r * r, ball = q(4 * r * r * r, 3);
    const P: VesselsParams = {
      vessels: [{ kind: 'sphere', r: 1, role: 'first', water: 'w0', caption: 'ball' }, { kind: 'cyl', r: 1, h: 2, role: 'second', water: 'w1', caption: 'can' }],
      dims: [{ v: 0, what: 'r', text: `${r} ${u}` }, { v: 1, what: 'h', text: `${2 * r} ${u}`, col: 'second' }], pours: [{ from: 0, to: 1, key: 'pour' }], maxScale: 170,
    };
    return coefItem(`sph-pour-${n}`, 'sph-pour', `A ball with radius ${A(`${r} ${u}`)} fits snugly in a can with the same radius and height ${A(`${2 * r} ${u}`)}. The can holds ${A(`${can}π ${cu(u)}`)}. How much does the ball hold?`, 'V_{ball} = \\tfrac23 V_{can}', u, ball,
      ['Pour the ball’s water into the can: it fills two thirds of it.', `2/3 · ${can}π = <b>${htmlPi(ball)} ${cu(u)}</b>.`],
      [{ v: can / 2, mc: MC.sphereHalf, say: 'Watch the pour: the ball fills two thirds of the can, more than half.' }, { v: can / 3, mc: MC.swapsCoef, say: 'One third is the cone. The ball fills two thirds of its can.' }, { v: can, mc: MC.sphereHeight, say: 'That is the whole can. The ball leaves room in the corners.' }],
      'Pour the ball into its can: how far up does it come?', pic(P, solve, [`V_{ball} = \\tfrac23 \\cdot ${can}\\pi`, `= ${texPi(ball)}${tu(u)}`], ['solid', 'dims', 'caption'], [['w0', 1]]));
  }
  // plain numbers: no radius given, so the numbers can be anything
  const k = int(R, 5, 90), can = 3 * k, ball = 2 * k, back = R() < 0.45;
  const P: VesselsParams = {
    vessels: [{ kind: 'sphere', r: 1, role: 'first', water: 'w0', caption: 'ball' }, { kind: 'cyl', r: 1, h: 2, role: 'second', water: 'w1', caption: 'can' }],
    dims: [{ v: 0, what: 'r', text: 'r' }, { v: 1, what: 'h', text: '2r', col: 'second' }], pours: [{ from: 0, to: 1, key: 'pour' }], maxScale: 170,
  };
  if (back) {
    return numItem(`sph-pour-${n}`, 'sph-pour', `A ball fits snugly in a can: same radius, and the can is exactly as tall as the ball. The ball holds ${A(`${ball} ${cu(u)}`)}. How much does the can hold?`, 'V_{can} = \\,?',
      cu(u), can, ['The ball fills two thirds of the can that just holds it.', `So ${ball} is two thirds of the can: one third is ${k}, the whole can <b>${can} ${cu(u)}</b>.`],
      [{ v: 2 * ball, mc: MC.sphereHalf, say: 'The ball fills two thirds of the can, not half of it.' }, { v: (ball * 2) / 3, say: 'The can is bigger than the ball: the ball is two thirds of the can.' }, { v: 3 * ball, mc: MC.swapsCoef, say: 'That treats the ball like a cone. A ball fills two thirds of its can.' }],
      'The ball is two thirds of the can.', pic(P, solve, [`\\tfrac23 V_{can} = ${ball}`, `V_{can} = ${can}${tu(u)}`], ['solid', 'dims', 'caption'], [['w0', 1]]));
  }
  return numItem(`sph-pour-${n}`, 'sph-pour', `A ball fits snugly in a can: same radius, and the can is exactly as tall as the ball. The can holds ${A(`${can} ${cu(u)}`)}. How much does the ball hold?`, 'V_{ball} = \\,?',
    cu(u), ball, ['Pour the ball’s water into the can: it fills two thirds of it.', `2/3 · ${can} = <b>${ball} ${cu(u)}</b>.`],
    [{ v: can / 2, mc: MC.sphereHalf, say: 'Watch the pour: the ball fills two thirds of the can, more than half.' }, { v: can / 3, mc: MC.swapsCoef, say: 'One third is the cone. The ball fills two thirds of its can.' }, { v: can, mc: MC.sphereHeight, say: 'That is the whole can. The ball leaves room in the corners.' }],
    'Pour the ball into its can: how far up does it come?', pic(P, solve, [`V_{ball} = \\tfrac23 \\cdot ${can}`, `= ${ball}${tu(u)}`], ['solid', 'dims', 'caption'], [['w0', 1]]));
};
/** the smallest can that holds a ball */
const sphCan: Gen = (R, n) => {
  // a ball at its real size: a tennis ball is about 2.6 in across, never 28 ft
  const BALLS = ['tennis ball', 'basketball', 'gumball', 'glass marble', 'soccer ball', 'bowling ball'];
  let r = int(R, 1, 15), u: U = pick(R, ['in', 'cm'] as const), cx = pickReal(R, BALLS, 2 * r, u) ?? '';
  for (let t = 0; t < 600 && !cx; t++) { r = int(R, 1, 15); u = pick(R, ['in', 'cm'] as const); cx = pickReal(R, BALLS, 2 * r, u) ?? ''; }
  const useD = R() < 0.4;
  const P: VesselsParams = { vessels: [{ kind: 'cyl', r: 1, h: 2, role: 'second', ghost: true }, { kind: 'sphere', r: 1, role: 'first', inside: 0 }], dims: [{ v: 1, what: useD ? 'd' : 'r', text: `${useD ? 2 * r : r} ${u}` }, { v: 0, what: 'h', text: 'h = ?', col: 'pick' }], maxScale: 200 };
  return {
    id: `sph-can-${n}`, family: 'sph-can', prompt: `A ${cx} ${useD ? `is ${A(`${2 * r} ${u}`)} across` : `has a radius of ${A(`${r} ${u}`)}`}. What are the radius and height of the smallest can that holds it?`,
    board: 'r = \\,?\\quad h = \\,?', input: 'pair', pairLead: 'r =', pairOp: `${u}, &nbsp;h =`, pairTail: u, answer: pairOf(r, 2 * r),
    solution: [`The can is as wide as the ball: radius <b class="s">${r} ${u}</b>.`, `It is as tall as the ball, and the ball is as tall as its diameter: <b class="s">${2 * r} ${u}</b>.`],
    picture: pic(P, [[['dims', 1]]], [`r = ${r}`, `h = 2 \\cdot ${r} = ${2 * r}`]),
    check: (x: Response): Verdict => {
      if (x.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      if (x.x === r && x.y === 2 * r) return { ok: true, say: `Yes: r = ${r} ${u} and h = ${2 * r} ${u}, the ball’s diameter.` };
      if (x.x === 2 * r) return { ok: false, mc: MC.dForR, say: `${2 * r} ${u} is the diameter. The can’s radius is the ball’s radius, ${r} ${u}.` };
      if (x.x === r && x.y === r) return { ok: false, mc: MC.sphereHeight, say: 'A can that short would only hold half the ball. The ball is as tall as its diameter.' };
      return { ok: false, mc: x.x === r ? MC.sphereHeight : undefined, say: 'The can must be as wide as the ball and as tall as the ball. A ball is as tall as its diameter.' };
    },
  } as It;
};

/** which formula fits the pictured solid? */
const mixFormula: Gen = (R, n) => {
  const kind = pick(R, ['cyl', 'cone', 'sphere', 'hemi'] as const);
  let cx = pick(R, CTX[kind]), D = dimsFor(R, kind, 'cylinder-volume-calc', cx.u);
  for (let t = 0; t < 400 && !realDims(cx.noun, kind, D); t++) { cx = pick(R, CTX[kind]); D = dimsFor(R, kind, 'cylinder-volume-calc', cx.u); }
  const P = volPicture(D, { cup: cx.cup, bowl: cx.bowl, caption: cx.noun });
  const F = { cyl: 'V = πr²h', cone: 'V = ⅓πr²h', sphere: 'V = ⁴⁄₃πr³', hemi: 'V = ⅔πr³' };
  const opts: { t: string; ok?: boolean; mc?: string; say: string }[] = [{ t: F[kind], ok: true, say: `Yes: a ${cx.noun} is a ${KNAME[kind]}.` }];
  if (kind === 'cyl') opts.push({ t: 'V = πr³h', mc: MC.cubesR, say: 'The base is a circle: r², not r³.' }, { t: 'V = 2πrh', mc: MC.circH, say: '2πrh is the side (the label), not the inside.' }, { t: F.cone, say: 'One third is for a cone.' });
  if (kind === 'cone') opts.push({ t: 'V = ⁴⁄₃πr²h', mc: MC.swapsCoef, say: '4/3 belongs to the sphere. A cone is one third of its cylinder.' }, { t: F.cyl, mc: MC.dropsCoef, say: 'That is the whole cylinder. A cone is one third of it.' }, { t: 'V = ½πr²h', mc: MC.coneHalf, say: 'A cone is one third of its cylinder, not one half.' });
  if (kind === 'sphere') opts.push({ t: 'V = ⅓πr³', mc: MC.swapsCoef, say: '1/3 belongs to the cone. A sphere is 4/3 π r³.' }, { t: 'V = ⁴⁄₃πr²', mc: MC.wrongPower, say: 'Volume cubes the radius: r³.' }, { t: 'V = 4πr²', mc: MC.saVol, say: '4πr² is the sphere’s surface, not its volume.' });
  if (kind === 'hemi') opts.push({ t: F.sphere, mc: MC.fullForPart, say: 'That is a whole sphere. A hemisphere is half: 2/3 π r³.' }, { t: 'V = ⁴⁄₃π(r ÷ 2)³', mc: MC.halvesRadius, say: 'Halving the radius gives an eighth of the sphere. Take half of the volume instead.' }, { t: F.cone + '', say: 'That is a cone.' });
  return choiceItem(`mix-formula-${n}`, 'mix-formula', `Which formula gives the volume of this ${cx.noun}${D.useD ? ` (${len(D.d!, D.u)} across)` : ` (radius ${len(D.r, D.u)})`}?`, 'V = \\,?', opts, R,
    [`A ${cx.noun} is a ${KNAME[kind]}: ${F[kind]}.`], pic(P, [[['dims', 1]]], [FORMULA[kind]]));
};

/** exact to rounded: 3.14 by hand (whole coefficients) or the pi key (fraction coefficients) */
const approxRound: Gen = (R, n) => {
  const kind = pick(R, ['cyl', 'cone', 'sphere'] as const), u: U = pick(R, ['in', 'ft', 'cm'] as const);
  const D = dimsFor(R, kind, 'cylinder-volume-calc', u);
  const w = volWork(D), c = val(w.c);
  const P = volPicture(D);
  const hand = isWhole(w.c);
  const ans = hand ? roundTo(c * 3.14, 1) : roundTo(c * Math.PI, 1), other = hand ? roundTo(c * Math.PI, 1) : roundTo(c * 3.14, 1);
  const traps: Trap[] = [{ v: roundTo(c * 3, 1), say: 'π is a bit more than 3. Use 3.14 (or the π key) as the problem says.' }, { v: c, mc: MC.omitsUnit, say: `That is the number in front of π. Multiply by ${hand ? '3.14' : 'π'}.` }];
  if (!hand) traps.push({ v: roundTo(roundTo(c, 1) * Math.PI, 1), mc: MC.earlyRound, say: `You rounded ${htmlQ(w.c)} first. Keep every digit until the end, then round once.` }, { v: roundTo(roundTo(c, 0) * Math.PI, 1), mc: MC.earlyRound, say: 'Round only the final answer.' });
  const prompt = hand
    ? `This ${KNAME[kind]} has V = ${htmlPi(w.c)} ${cu(u)}. No calculator: use 3.14 for π and round to the nearest tenth.`
    : `This ${KNAME[kind]} has V = ${htmlPi(w.c)} ${cu(u)}. Calculator: use the π key and round to the nearest tenth.`;
  return numItem(`approx-round-${n}`, 'approx-round', prompt, `V = ${texPi(w.c)}${tu(u)}`, cu(u), ans,
    [hand ? `${c} × 3.14 = ${roundTo(c * 3.14, 2)}.` : `${htmlQ(w.c)} × π = ${roundTo(c * Math.PI, 4)}… on the calculator.`, `Rounded: V ≈ <b>${ans} ${cu(u)}</b>. Write ≈, because it is rounded.`],
    traps, hand ? `Multiply ${c} by 3.14, then round.` : `Type ${htmlQ(w.c)} × π, then round once at the end.`,
    pic(P, [[['dims', 1]]], [`V = ${texPi(w.c)}`, `\\approx ${ans}${tu(u)}`]), { alt: [other], okSay: `Yes: V ≈ ${ans} ${cu(u)}.` });
};
/** = for exact, ≈ for rounded, cubic units always */
const approxSigns: Gen = (R, n) => {
  const kind = pick(R, ['cyl', 'cone', 'sphere'] as const), u: U = pick(R, ['in', 'ft', 'cm', 'yd'] as const);
  const D = dimsFor(R, kind, 'cylinder-volume-calc', u);
  const w = volWork(D), c = w.c, x = roundTo(val(c) * 3.14, 1);
  if (!isWhole(c)) return approxSigns(R, n + 1);
  return choiceItem(`approx-signs-${n}`, 'approx-signs', `Which line reports this ${KNAME[kind]}’s volume correctly, exact and rounded (with 3.14)?`, `V = ${texPi(c)}`, [
    { t: `V = ${c[0]}π ${cu(u)} ≈ ${x} ${cu(u)}`, ok: true, say: 'Yes: = for the exact value, ≈ for the rounded one, cubic units on both.' },
    { t: `V = ${c[0]}π ${cu(u)} = ${x} ${cu(u)}`, mc: MC.pi314, say: '3.14 is not exactly π, so the rounded value is only about equal: use ≈.' },
    { t: `V ≈ ${c[0]}π ${cu(u)} = ${x} ${cu(u)}`, mc: MC.pi314, say: `${c[0]}π is exact (=), and ${x} is the rounded one (≈). They are swapped.` },
    { t: `V = ${c[0]}π ≈ ${x}`, mc: MC.omitsUnit, say: 'A volume needs its cubic unit.' },
  ], R, [`Exact: V = ${c[0]}π ${cu(u)}. Rounded with 3.14: V ≈ ${x} ${cu(u)}.`], pic(volPicture(D), [[['dims', 1]]], [`V = ${texPi(c)}${tu(u)}`, `\\approx ${x}${tu(u)}`]));
};
/** a fractional radius, cubed or squared as a fraction */
const decFracR: Gen = (R, n) => {
  const kind = pick(R, ['sphere', 'hemi', 'cyl', 'cone'] as const), u: U = pick(R, ['in', 'ft'] as const);
  const r = pick(R, [q(1, 2), q(3, 2), q(5, 2), q(1, 3), q(2, 3)]);
  const h = kind === 'cone' ? W(pick(R, [3, 6, 9, 12])) : W(int(R, 2, 12));
  if ((kind === 'sphere' || kind === 'hemi') && r[1] === 3) return decFracR(R, n + 1);
  const D: Dims = { kind, r, h, u, useD: false, frac: true };
  const w = volWork(D);
  const rs = r[1] === 2 ? lab(r, u) : `${r[0]}/${r[1]} ${u}`;
  const prompt = `This ${KNAME[kind]} has radius ${A(rs)}${kind === 'cyl' || kind === 'cone' ? ` and height ${A(`${h[0]} ${u}`)}` : ''}. Find its exact volume. Work with the radius as a fraction${r[1] === 2 ? ` (${lab(r, u).split(' ')[0]} = ${r[0]}/2)` : ''}.`;
  const P: VesselsParams = { ...volPicture(D), dims: [{ v: 0, what: 'r', text: rs }, ...(kind === 'cyl' || kind === 'cone' ? [{ v: 0, what: 'h' as const, text: `${h[0]} ${u}` }] : [])] };
  return coefItem(`dec-frac-r-${n}`, 'dec-frac-r', prompt, FORMULA[kind], u, w.c, w.sol,
    [...w.traps, { v: val(mul(K[kind], q(r[0] ** (kind === 'cyl' || kind === 'cone' ? 2 : 3), r[1]), kind === 'cyl' || kind === 'cone' ? h : q(1))), mc: MC.expBeyond, say: `Square or cube the whole fraction: (${r[0]}/${r[1]})${kind === 'cyl' || kind === 'cone' ? '²' : '³'} powers the bottom too.` }],
    `Write the radius as ${r[0]}/${r[1]} and ${kind === 'cyl' || kind === 'cone' ? 'square' : 'cube'} it: top and bottom.`, pic(P, [[['dims', 1]]], w.hero));
};

// ---------- surface area ----------
/** a prism's net: lateral area (L = Ph) or total (S = Ph + 2B) */
const saPrismNet: Gen = (R, n) => {
  const tri = R() < 0.45, u: U = pick(R, ['in', 'cm', 'ft'] as const), total = R() < 0.5;
  let spec: NetSpec, Pm: number, B2: number, h: number, facePerim: number, sol: string[], vol: number;
  if (tri) {
    const [a, b, c] = pick(R, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]] as const); h = int(R, 3, 12);
    spec = { kind: 'tri', a, b, c, h }; Pm = a + b + c; B2 = (a * b) / 2; facePerim = 2 * (c + h); vol = B2 * h;
    sol = [`The sides unroll into one strip: P × h = (${a} + ${b} + ${c}) · ${h} = ${Pm * h} ${sq(u)}.`, `Each triangle base: ½ · ${a} · ${b} = ${B2} ${sq(u)}.`];
  } else {
    const l = int(R, 2, 12), wd = int(R, 2, 10); h = int(R, 2, 12);
    if (l === wd || l === h || wd === h) return saPrismNet(R, n + 1);
    spec = { kind: 'rect', l, w: wd, h }; Pm = 2 * (l + wd); B2 = l * wd; facePerim = 2 * (l + h); vol = l * wd * h;
    sol = [`The sides unroll into one strip: P × h = (${l} + ${wd} + ${l} + ${wd}) · ${h} = ${Pm * h} ${sq(u)}.`, `Each base: ${l} · ${wd} = ${B2} ${sq(u)}.`];
  }
  const L = Pm * h, St = L + 2 * B2;
  const labels: NetLabel[] = spec.kind === 'rect' ? [{ edge: 'f0', text: `${spec.l} ${u}` }, { edge: 'f1', text: `${spec.w} ${u}` }, { edge: 'h', text: `${h} ${u}`, col: 'second' }]
    : [{ edge: 'f0', text: `${spec.a} ${u}` }, { edge: 'f1', text: `${spec.b} ${u}` }, { edge: 'f2', text: `${spec.c} ${u}` }, { edge: 'h', text: `${h} ${u}`, col: 'second' }];
  const ask = total ? `the total surface area (every face, bases too)` : `the lateral area (the sides only, no bases)`;
  const picture: CcsPicture = { scene: { kind: 'net', spec, labels }, show: ['net', 'dims'], solve: [[['lat', 1]], total ? [['bases', 1]] : []], hero: [`L = P h = ${Pm} \\cdot ${h} = ${L}`, ...(total ? [`S = ${L} + 2 \\cdot ${B2}`, `= ${St}`] : [])] };
  return numItem(`sa-prism-net-${n}`, 'sa-prism-net', `Here is the net of a ${tri ? 'triangular' : 'rectangular'} prism: ${spec.kind === 'rect' ? `base ${A(`${spec.l} ${u}`)} by ${A(`${spec.w} ${u}`)}` : `a right-triangle base with sides ${A(`${spec.a}, ${spec.b} and ${spec.c} ${u}`)}`}, height ${A(`${h} ${u}`)}. Find ${ask}.`, total ? 'S = Ph + 2B' : 'L = Ph', sq(u), total ? St : L,
    [...sol, total ? `S = ${L} + 2 · ${B2} = <b>${St} ${sq(u)}</b>.` : `L = <b>${L} ${sq(u)}</b>.`],
    [total ? { v: L, mc: MC.latTotal, say: 'That is the sides only. The total adds both bases.' } : { v: St, mc: MC.latTotal, say: 'Lateral means the sides only: leave the two bases out.' },
      { v: L + B2, mc: MC.omitsBase, say: 'A closed prism has two bases, top and bottom.' }, { v: facePerim * h, mc: MC.facePerim, say: 'P is the perimeter of the BASE (all the way around the strip), not of one side face.' }, { v: vol, mc: MC.saVol, say: 'That is the volume (cubic units). Surface area adds up the faces.' }],
    'Lateral area = perimeter of the base × height; total adds the two bases.', picture);
};
/** a story: wrap, paint the walls, a label around a box */
const saPrismStory: Gen = (R, n) => {
  const u: U = pick(R, ['ft', 'in'] as const);
  const l = int(R, 3, 14), wd = int(R, 2, 10), h = int(R, 2, 10);
  if (l === wd || l === h || wd === h) return saPrismStory(R, n + 1);
  // each story at a real size: a room in feet with 7 to 10 ft walls, gift boxes and labels in inches
  const fit = [
    { t: `You paint the four walls of a room ${A(`${l} ${u}`)} long, ${A(`${wd} ${u}`)} wide and ${A(`${h} ${u}`)} high (no floor, no ceiling). How much wall do you paint?`, total: false, ok: u === 'ft' && h >= 7 && h <= 10 && l >= 6 && wd >= 6 },
    { t: `You wrap a gift box ${A(`${l} ${u}`)} long, ${A(`${wd} ${u}`)} wide and ${A(`${h} ${u}`)} tall in paper, every face. How much paper covers it?`, total: true, ok: u === 'in' },
    { t: `A paper label goes all the way around the sides of a box ${A(`${l} ${u}`)} long, ${A(`${wd} ${u}`)} wide and ${A(`${h} ${u}`)} tall (not the top or bottom). How big is the label?`, total: false, ok: u === 'in' },
    { t: `A closed shipping crate is ${A(`${l} ${u}`)} long, ${A(`${wd} ${u}`)} wide and ${A(`${h} ${u}`)} tall. How much wood covers its outside, every face?`, total: true, ok: u === 'ft' },
  ].filter(x => x.ok);
  if (!fit.length) return saPrismStory(R, n + 1);
  const cx = pick(R, fit);
  const Pm = 2 * (l + wd), L = Pm * h, B2 = l * wd, St = L + 2 * B2;
  const P: VesselsParams = { vessels: [{ kind: 'box', l: 1, w: wd / l, h: Math.max(0.35, Math.min(2.2, h / l)), role: 'first' }], dims: [{ v: 0, what: 'len', text: `${l} ${u}` }, { v: 0, what: 'w', text: `${wd} ${u}` }, { v: 0, what: 'h', text: `${h} ${u}` }], maxScale: 330 };
  return numItem(`sa-prism-story-${n}`, 'sa-prism-story', cx.t, cx.total ? 'S = Ph + 2B' : 'L = Ph', sq(u), cx.total ? St : L,
    [`Around the sides: P = 2 · (${l} + ${wd}) = ${Pm} ${u}, so L = ${Pm} · ${h} = ${L} ${sq(u)}.`, cx.total ? `Add top and bottom: ${L} + 2 · ${B2} = <b>${St} ${sq(u)}</b>.` : `Only the sides: <b>${L} ${sq(u)}</b>.`],
    [cx.total ? { v: L, mc: MC.latTotal, say: 'Every face means the top and bottom too.' } : { v: St, mc: MC.latTotal, say: 'Only the sides here: leave out the top and bottom.' }, { v: L + B2, mc: MC.omitsBase, say: 'There are two bases, top and bottom.' }, { v: l * wd * h, mc: MC.saVol, say: 'That is the volume. Covering is surface area, in square units.' }],
    'Sides only: L = Ph. Every face: S = Ph + 2B.', pic(P, [[['dims', 1]]], [`L = ${Pm} \\cdot ${h} = ${L}`, ...(cx.total ? [`S = ${L} + 2 \\cdot ${B2}`, `= ${St}`] : [])]));
};
/** a can and its net: L = 2 pi r h, S = 2 pi r h + 2 pi r^2 */
const saCylNet: Gen = (R, n) => {
  const useD = R() < 0.3, r = useD ? int(R, 1, 8) : int(R, 1, 9), h = int(R, 2, 12), u: U = pick(R, ['in', 'cm'] as const), total = R() < 0.5;
  if (!real('can', 2 * r, u, h)) return saCylNet(R, n + 1);
  const L = cylLateral(q(r), q(h)), St = cylTotal(q(r), q(h));
  const spec: NetSpec = { kind: 'cyl', r: 1, h: Math.max(1, Math.min(4, h / r)) };
  const labels: NetLabel[] = [{ edge: 'r', text: useD ? `d = ${2 * r} ${u}` : `${r} ${u}`, col: 'second' }, { edge: 'h', text: `${h} ${u}` }, { edge: 'C', text: 'around the can', col: 'pick' }];
  const prompt = `A can is ${useD ? `${A(`${2 * r} ${u}`)} across` : `radius ${A(`${r} ${u}`)}`} and ${A(`${h} ${u}`)} tall. Find ${total ? 'its total surface area (label, top and bottom)' : 'the area of its label (the side only)'}, exactly in terms of π.`;
  const picture: CcsPicture = { scene: { kind: 'net', spec, labels }, show: ['net', 'dims'], solve: [[['lat', 1]], total ? [['bases', 1]] : []], hero: [`L = 2\\pi \\cdot ${r} \\cdot ${h}`, `= ${val(L)}\\pi`, ...(total ? [`S = ${val(L)}\\pi + 2 \\cdot ${r * r}\\pi`, `= ${val(St)}\\pi${tu(u, 2)}`] : [])] };
  const traps: Trap[] = [
    total ? { v: val(L), mc: MC.latTotal, say: 'That is only the label. Add the top and bottom circles.' } : { v: val(St), mc: MC.latTotal, say: 'The label is the side only: no top or bottom.' },
    { v: val(L) + r * r, mc: MC.omitsBase, say: 'A closed can has two circles, top and bottom.' },
    { v: r * r * h, mc: MC.saVol, say: 'π r² h is the volume inside. The label is a rectangle: around × tall.' },
    { v: r * h, mc: MC.aroundAcross, say: 'The label’s long side goes all the way around: the circumference 2πr, not r.' },
  ];
  if (useD) traps.push({ v: total ? 4 * r * h + 8 * r * r : 4 * r * h, mc: MC.dForR, say: `${2 * r} ${u} is the diameter: the radius is ${r} ${u}.` });
  return {
    id: `sa-cyl-net-${n}`, family: 'sa-cyl-net', prompt, board: total ? 'S = 2\\pi r h + 2\\pi r^2' : 'L = 2\\pi r h', input: 'frac', unit: `π ${sq(u)}`, answer: coefAnswer(total ? St : L),
    solution: [`Unroll the label: a rectangle 2π · ${r} = ${2 * r}π ${u} long and ${h} ${u} tall: ${val(L)}π ${sq(u)}.`, ...(total ? [`Two circles: 2 · π · ${r}² = ${2 * r * r}π. Total: <b class="s">${val(St)}π ${sq(u)}</b>.`] : [`Label: <b class="s">${val(L)}π ${sq(u)}</b>.`])],
    picture, check: numCheck(val(total ? St : L), `Yes: ${val(total ? St : L)}π ${sq(u)}.`, traps, 'The label unrolls into a rectangle: (2πr) by h.', { coefPi: true }),
  } as It;
};
/** label or soup? interleaved surface area and volume of one can */
const saOrVol: Gen = (R, n) => {
  const r = int(R, 1, 8), h = int(R, 2, 12), u: U = pick(R, ['in', 'cm'] as const), ask = pick(R, ['label', 'soup', 'tin'] as const);
  if (r === 2 || 2 * r === r * r || !real('soup can', 2 * r, u, h)) return saOrVol(R, n + 1);
  const L = 2 * r * h, V = r * r * h, St = L + 2 * r * r;
  const v = ask === 'label' ? L : ask === 'soup' ? V : St;
  const unit = ask === 'soup' ? piUnit(u) : `π ${sq(u)}`;
  const P = one('cyl', r, h, [{ what: 'r', text: `${r} ${u}` }, { what: 'h', text: `${h} ${u}` }], { caption: 'soup can' });
  const prompt = ask === 'label' ? `A soup can has radius ${A(`${r} ${u}`)} and height ${A(`${h} ${u}`)}. How much paper is its label (the side)?`
    : ask === 'soup' ? `A soup can has radius ${A(`${r} ${u}`)} and height ${A(`${h} ${u}`)}. How much soup fits inside?`
      : `A soup can has radius ${A(`${r} ${u}`)} and height ${A(`${h} ${u}`)}. How much tin makes the whole closed can?`;
  const traps: Trap[] = ask === 'soup'
    ? [{ v: L, mc: MC.circH, say: 'That is the label around the side. Soup fills the inside: π r² h.' }, { v: St, mc: MC.saVol, say: 'That is the tin on the outside. Soup is the volume inside.' }]
    : [{ v: V, mc: MC.saVol, say: 'π r² h is the soup inside. Paper and tin cover the outside: surface area.' }, ...(ask === 'tin' ? [{ v: L, mc: MC.latTotal, say: 'Add the top and bottom circles too.' }, { v: L + r * r, mc: MC.omitsBase, say: 'A closed can has two circles.' }] : [{ v: St, mc: MC.latTotal, say: 'The label is the side only.' }])];
  return {
    id: `sa-or-vol-${n}`, family: 'sa-or-vol', prompt, board: ask === 'soup' ? 'V = \\,?' : 'S = \\,?', input: 'frac', unit, answer: coefAnswer(q(v)),
    solution: [ask === 'soup' ? `Inside: V = π · ${r}² · ${h} = <b class="s">${V}π ${cu(u)}</b>.` : ask === 'label' ? `The side unrolls: 2π · ${r} · ${h} = <b class="s">${L}π ${sq(u)}</b>.` : `Side ${L}π + two circles ${2 * r * r}π = <b class="s">${St}π ${sq(u)}</b>.`,
 ask === 'soup' ? 'Filling is volume, cubic units.' : 'Covering is surface area, square units.'],
    picture: pic(P, [[['dims', 1]]], ask === 'soup' ? [`V = \\pi \\cdot ${r}^2 \\cdot ${h}`, `= ${V}\\pi`] : ask === 'label' ? [`L = 2\\pi \\cdot ${r} \\cdot ${h}`, `= ${L}\\pi`] : [`S = ${L}\\pi + ${2 * r * r}\\pi`, `= ${St}\\pi`]),
    check: numCheck(v, `Yes: ${v}π ${ask === 'soup' ? cu(u) : sq(u)}.`, traps, ask === 'soup' ? 'Filling is volume: π r² h.' : 'Covering is surface area: the label is 2π r h.', { coefPi: true }),
  } as It;
};

// ---------- units ----------
/** one length unit first (inches and feet; cm and m) */
const unitMixed: Gen = (R, n) => {
  const kind = pick(R, ['cyl', 'cone'] as const), metric = R() < 0.35;
  let rS: string, hS: string, r: Q, h: Q, u: U, wrongV: number;
  if (!metric) {
    const ri = int(R, 2, 9), hf = int(R, 1, 4); u = 'in';
    rS = `${ri} in`; hS = `${hf} ft`; r = W(ri); h = W(hf * 12); wrongV = val(coef(kind, W(ri), W(hf)));
  } else {
    const rc = pick(R, [5, 10, 20, 30]), hm = pick(R, [1, 2, 0.5, 1.5]); u = 'cm';
    rS = `${rc} cm`; hS = `${hm} m`; r = W(rc); h = qd(hm * 100); wrongV = val(coef(kind, W(rc), qd(hm)));
  }
  if (kind === 'cone' && !isWhole(div(mul(pow(r, 2), h), q(3))) && R() < 0.5) return unitMixed(R, n + 1);
  const c = coef(kind, r, h);
  const P = one(kind, val(r), val(h), [{ what: 'r', text: rS }, { what: 'h', text: hS }]);
  return coefItem(`unit-mixed-${n}`, 'unit-mixed', `This ${KNAME[kind]} has radius ${A(rS)} and height ${A(hS)}. Find its exact volume in ${cu(u)}.`, `V = \\,?${tu(u)}`, u, c,
    [`Put both lengths in ${u} first: h = ${hS} = ${lenStr(h)} ${u}.`, `V = ${kind === 'cone' ? '⅓ · ' : ''}π · ${lenStr(r)}² · ${lenStr(h)} = <b>${htmlPi(c, true)} ${cu(u)}</b>.`],
    [{ v: wrongV, mc: MC.unconverted, say: `The radius is in ${u} but the height is not. Change ${hS} to ${u} first.` }, ...volWork({ kind, r, h, u, useD: false }).traps],
    `Change ${hS} into ${u}, then use the formula.`, pic(P, [[['dims', 1]]], [`h = ${hS.replace(' ', '\\text{ ')}} = ${lenStr(h)}\\text{ ${u}}`, `V = ${texPi(c, true)}${tu(u)}`]));
};
/** which setup uses one unit? */
const unitTrap: Gen = (R, n) => {
  // r = 2 would make 2π·r·h equal to π·r²·h; the pictured object has a real size
  const ri = int(R, 3, 9), hf = int(R, 2, 5), hin = hf * 12;
  const noun = pickReal(R, ['water tank', 'tube', 'post mold', 'vase'], 2 * ri, 'in', hf, 'ft');
  if (!noun) return unitTrap(R, n + 1);
  const P = one('cyl', ri, hin, [{ what: 'r', text: `${ri} in` }, { what: 'h', text: `${hf} ft` }], { caption: noun });
  return choiceItem(`unit-trap-${n}`, 'unit-trap', `This cylinder has radius ${A(`${ri} in`)} and height ${A(`${hf} ft`)}. Which setup gives its volume in cubic inches?`, 'V = \\pi r^2 h', [
    { t: `π · ${ri}² · ${hin}`, ok: true, say: `Yes: ${hf} ft = ${hin} in, so both lengths are in inches.` },
    { t: `π · ${ri}² · ${hf}`, mc: MC.unconverted, say: `${hf} is in feet while ${ri} is in inches. Change ${hf} ft into inches first.` },
    { t: `π · ${ri}² · ${hf} · 12³`, mc: MC.linearFactor, say: 'Only the height was in feet. Change that one length: × 12, once.' },
    { t: `2π · ${ri} · ${hin}`, mc: MC.circH, say: 'That is the side (the label), not the volume.' },
  ], R, [`${hf} ft = ${hin} in.`, `V = π · ${ri}² · ${hin} = ${ri * ri * hin}π in³.`], pic(P, [[['dims', 1]]], [`h = ${hf}\\text{ ft} = ${hin}\\text{ in}`, `V = \\pi \\cdot ${ri}^2 \\cdot ${hin}`]));
};
const CONV = [
  { big: 'ft', small: 'in', f: 12 }, { big: 'yd', small: 'ft', f: 3 }, { big: 'm', small: 'cm', f: 100 },
] as const;
/** convert a volume: the factor is the length factor cubed */
const cubicConv: Gen = (R, n) => {
  const cv = pick(R, CONV), up = R() < 0.5, F = cv.f ** 3, exactPi = R() < 0.4;
  const k = cv.big === 'm' ? int(R, 1, 4) : int(R, 1, 9);
  const big = exactPi ? k : k, small = big * F;
  const from = up ? cv.small : cv.big, to = up ? cv.big : cv.small;
  const given = up ? small : big, ans = up ? big : small;
  const piS = exactPi ? 'π ' : '';
  const P = one('cyl', 1, 1.6, [], { caption: `${given.toLocaleString('en-US')}${exactPi ? 'π' : ''} ${cu(from)}` });
  const prompt = `A tank holds ${A(`${given.toLocaleString('en-US')}${exactPi ? 'π' : ''} ${cu(from)}`)}. How many ${exactPi ? 'π ' : ''}${cu(to)} is that? (1 ${cv.big} = ${cv.f} ${cv.small})`;
  return numItem(`cubic-conv-${n}`, 'cubic-conv', prompt, `1\\text{ ${cv.big}}^3 = ${cv.f}^3\\text{ ${cv.small}}^3`, `${piS}${cu(to)}`, ans,
    [`A 1 ${cv.big} cube is ${cv.f} × ${cv.f} × ${cv.f} = ${F.toLocaleString('en-US')} small cubes of 1 ${cu(cv.small)}.`, up ? `${small.toLocaleString('en-US')} ÷ ${F.toLocaleString('en-US')} = <b>${big}</b>.` : `${big} × ${F.toLocaleString('en-US')} = <b>${small.toLocaleString('en-US')}</b>.`],
    [{ v: up ? given / cv.f : given * cv.f, mc: MC.linearFactor, say: `${cv.f} is the factor for a length. A cubic ${cv.big} is ${cv.f} × ${cv.f} × ${cv.f} = ${F.toLocaleString('en-US')} cubic ${cv.small}.` },
      { v: up ? given / cv.f ** 2 : given * cv.f ** 2, mc: MC.squaredFactor, say: `Squared is for area. Volume has three directions: ${cv.f}³ = ${F.toLocaleString('en-US')}.` },
      { v: up ? given * F : given / F, mc: MC.wrongDir, say: up ? `Cubic ${cv.big} are bigger, so there are fewer of them: divide.` : `Cubic ${cv.small} are smaller, so there are more of them: multiply.` }],
    `1 ${cu(cv.big)} = ${cv.f}³ = ${F.toLocaleString('en-US')} ${cu(cv.small)}.`, pic(P, [[['caption', 1]]], [`${cv.f}^3 = ${F}`, `${up ? `${small} \\div ${F}` : `${big} \\cdot ${F}`} = ${ans}`], ['solid', 'caption']), { okSay: `Yes: ${ans.toLocaleString('en-US')} ${piS}${cu(to)}.` });
};
/** a box in cubic yards, seen as cubic feet */
const cubicCube: Gen = (R, n) => {
  // a low dumpster: whole yards are its real size (a sandbox is never a yard deep)
  const l = int(R, 2, 6), wd = int(R, 2, 3), h = 1, up = R() < 0.35;
  const yd3 = l * wd * h, ft3 = 27 * yd3;
  const P: VesselsParams = { vessels: [{ kind: 'box', l, w: wd, h, role: 'first', grid: 3 }], dims: [{ v: 0, what: 'len', text: `${l} yd` }, { v: 0, what: 'w', text: `${wd} yd` }, { v: 0, what: 'h', text: `${h} yd` }], maxScale: 170 };
  const prompt = up ? `A dumpster holds ${A(`${ft3} ${cu('ft')}`)} of trash. How many cubic yards is that? (1 yd = 3 ft)` : `A dumpster is ${A(`${l} yd`)} by ${A(`${wd} yd`)} by ${A(`${h} yd`)}. How many cubic feet of trash fill it? (1 yd = 3 ft)`;
  return numItem(`cubic-cube-${n}`, 'cubic-cube', prompt, '1\\text{ yd}^3 = 3^3\\text{ ft}^3', up ? cu('yd') : cu('ft'), up ? yd3 : ft3,
    [`Each cubic yard is 3 × 3 × 3 = 27 cubic feet (the small cubes).`, up ? `${ft3} ÷ 27 = <b>${yd3} ${cu('yd')}</b>.` : `${yd3} ${cu('yd')} × 27 = <b>${ft3} ${cu('ft')}</b>.`],
    up ? [{ v: ft3 / 3, mc: MC.linearFactor, say: 'Divide by 27, not 3: a cubic yard holds 3 × 3 × 3 cubic feet.' }, { v: ft3 / 9, mc: MC.squaredFactor, say: 'Volume has three directions: 3³ = 27.' }, { v: ft3 * 27, mc: MC.wrongDir, say: 'Cubic yards are bigger: there are fewer of them.' }]
      : [{ v: yd3 * 3, mc: MC.linearFactor, say: 'Count the small cubes: each cubic yard holds 3 × 3 × 3 = 27 of them.' }, { v: yd3 * 9, mc: MC.squaredFactor, say: 'That is one layer of 9. There are 3 layers: 27.' }, { v: l * 3 + wd * 3 + h * 3, say: 'Multiply the three lengths in feet.' }],
    'Count the small cubes in one cubic yard: 3 × 3 × 3.', pic(P, [[['dims', 1]]], [`3^3 = 27`, up ? `${ft3} \\div 27 = ${yd3}` : `${yd3} \\cdot 27 = ${ft3}`]));
};
/** a tank in inches, then gallons (231 in^3 = 1 gal) */
const capTank: Gen = (R, n) => {
  const r = int(R, 3, 12), mixed = R() < 0.45, hIn = mixed ? 12 * int(R, 1, 4) : int(R, 6, 30);
  const V = r * r * hIn * Math.PI, gal = roundTo(V / 231, 1);
  const hS = mixed ? `${hIn / 12} ft` : `${hIn} in`;
  const noun = pickReal(R, ['fish tank', 'water heater', 'rain barrel', 'cooler'], 2 * r, 'in', hIn);
  if (!noun) return capTank(R, n + 1);
  const P = one('cyl', r, hIn, [{ what: 'r', text: `${r} in` }, { what: 'h', text: hS }], { caption: noun });
  return numItem(`cap-tank-${n}`, 'cap-tank', `A cylinder tank has radius ${A(`${r} in`)} and height ${A(hS)}. How many gallons does it hold? Use 231 in³ = 1 gallon, the π key, and round to the nearest tenth.`, '231\\text{ in}^3 = 1\\text{ gal}', 'gal', gal,
    [...(mixed ? [`Height in inches: ${hS} = ${hIn} in.`] : []), `V = π · ${r}² · ${hIn} = ${r * r * hIn}π ≈ ${roundTo(V, 1)} in³.`, `${roundTo(V, 1)} ÷ 231 ≈ <b>${gal} gal</b>.`],
    [{ v: roundTo((V * 231), 1), mc: MC.wrongDir, say: 'Gallons are much bigger than cubic inches: divide by 231.' }, { v: roundTo(r * r * (hIn / 12) * Math.PI / 231, 1), mc: MC.capBeforeUnits, say: 'The height was still in feet. Put every length in inches before you use 231 in³ per gallon.' }, { v: roundTo(V, 1), say: 'That is cubic inches. Now change it into gallons.' }],
    'Volume in cubic inches first (every length in inches), then ÷ 231.', pic(P, [[['dims', 1]]], [`V = ${r * r * hIn}\\pi \\approx ${roundTo(V, 1)}`, `${roundTo(V, 1)} \\div 231 \\approx ${gal}`]), { alt: [roundTo(r * r * hIn * 3.14 / 231, 1)], okSay: `Yes: about ${gal} gallons.` });
};
/** cm^3 to liters, or ft^3 to gallons */
const capLiter: Gen = (R, n) => {
  if (R() < 0.5) {
    const kind = pick(R, ['cyl', 'sphere', 'cone'] as const), r = pick(R, [4, 5, 6, 8, 10, 12]), h = pick(R, [10, 15, 20, 24, 30]);
    if (!real(kind === 'cyl' ? 'vase' : kind === 'sphere' ? 'fish bowl' : 'funnel', 2 * r, 'cm', kind === 'sphere' ? undefined : h)) return capLiter(R, n + 1);
    const c = coef(kind, W(r), W(h)), V = val(c) * Math.PI, L = roundTo(V / 1000, 1);
    const P = volPicture({ kind, r: W(r), h: W(h), u: 'cm', useD: false }, { cup: kind === 'cone', caption: kind === 'cyl' ? 'vase' : kind === 'sphere' ? 'fish bowl' : 'funnel' });
    return numItem(`cap-liter-${n}`, 'cap-liter', `This ${kind === 'cyl' ? 'vase' : kind === 'sphere' ? 'round fish bowl' : 'funnel'} is a ${KNAME[kind]} with radius ${A(`${r} cm`)}${kind === 'sphere' ? '' : ` and height ${A(`${h} cm`)}`}. How many liters does it hold? Use 1000 cm³ = 1 L and round to the nearest tenth.`, '1000\\text{ cm}^3 = 1\\text{ L}', 'L', L,
      [`V = ${htmlPi(c)} ≈ ${roundTo(V, 1)} cm³.`, `${roundTo(V, 1)} ÷ 1000 ≈ <b>${L} L</b>.`],
      [{ v: roundTo(V * 1000, 1), mc: MC.wrongDir, say: 'A liter is much bigger than a cubic centimeter: divide by 1000.' }, { v: roundTo(V, 1), say: 'That is cubic centimeters. Divide by 1000 for liters.' }],
      'Volume in cm³, then ÷ 1000.', pic(P, [[['dims', 1]]], [`V \\approx ${roundTo(V, 1)}\\text{ cm}^3`, `\\div 1000 \\approx ${L}\\text{ L}`]), { alt: [roundTo(val(c) * 3.14 / 1000, 1)], okSay: `Yes: about ${L} L.` });
  }
  const r = int(R, 3, 12), h = int(R, 2, 5), V = r * r * h * Math.PI, gal = Math.round(V * 7.48);
  const P = one('cyl', r, h, [{ what: 'r', text: `${r} ft` }, { what: 'h', text: `${h} ft` }], { caption: 'pool' });
  return numItem(`cap-liter-${n}`, 'cap-liter', `A round pool has radius ${A(`${r} ft`)} and is ${A(`${h} ft`)} deep. About how many gallons fill it? Use 1 ft³ ≈ 7.48 gal and round to the nearest gallon.`, '1\\text{ ft}^3 \\approx 7.48\\text{ gal}', 'gal', gal,
    [`V = π · ${r}² · ${h} = ${r * r * h}π ≈ ${roundTo(V, 2)} ft³.`, `${roundTo(V, 2)} × 7.48 ≈ <b>${gal} gal</b>.`],
    [{ v: Math.round(V / 7.48), mc: MC.wrongDir, say: 'A cubic foot holds about 7.48 gallons, so there are more gallons than cubic feet: multiply.' }, { v: Math.round(V), say: 'That is cubic feet. Multiply by 7.48 for gallons.' }],
    'Volume in ft³, then × 7.48.', pic(P, [[['dims', 1]]], [`V = ${r * r * h}\\pi\\text{ ft}^3`, `\\cdot 7.48 \\approx ${gal}\\text{ gal}`]), { alt: [Math.round(r * r * h * 3.14 * 7.48), gal - 1, gal + 1], okSay: `Yes: about ${gal} gallons.` });
};

// ---------- reasoning ----------
/** a claimed calculator answer: reasonable? */
const estJudge: Gen = (R, n) => {
  const kind = pick(R, ['cyl', 'cone', 'sphere'] as const), u: U = pick(R, ['in', 'cm', 'ft'] as const);
  const D = dimsFor(R, kind, 'cylinder-volume-calc', u);
  if (val(D.r) < 2) return estJudge(R, n + 1);
  const c = val(coef(kind, D.r, D.h)), true1 = roundTo(c * Math.PI, 1);
  const err = pick(R, ['ok', 'x4', 'x10', 'nopi', 'ok'] as const);
  const shown = err === 'ok' ? true1 : err === 'x4' ? roundTo(true1 * 4, 1) : err === 'x10' ? roundTo(true1 * 10, 1) : roundTo(c, 1);
  const est = Math.round(c * 3);
  const who = pick(R, ['Jordan', 'Priya', 'Mateo', 'Ava', 'Sam', 'Lena']);
  const P = volPicture(D);
  const verdict = shown > est * 1.8 ? 'big' : shown < est / 1.8 ? 'small' : 'ok';
  const opts = [
    { t: 'Reasonable', ok: verdict === 'ok', mc: verdict === 'ok' ? undefined : MC.trustsDisplay, say: verdict === 'ok' ? `Yes: with π ≈ 3 it is about ${est}, close to ${shown}.` : `A calculator shows whatever was typed. With π ≈ 3 the volume is about ${est}, far from ${shown}.` },
    { t: 'Too big', ok: verdict === 'big', say: verdict === 'big' ? `Yes: it should be about ${est}. ${shown} is far bigger (maybe the diameter was used as the radius, or a slipped decimal).` : `Estimate: about ${est}. ${shown} is not too big.` },
    { t: 'Too small', ok: verdict === 'small', say: verdict === 'small' ? `Yes: about ${est} is expected. ${shown} looks like π was left out.` : `Estimate: about ${est}. ${shown} is not too small.` },
  ];
  return choiceItem(`est-judge-${n}`, 'est-judge', `${who}’s calculator says this ${KNAME[kind]} holds ${A(`${shown.toLocaleString('en-US')} ${cu(u)}`)}. Estimate with π ≈ 3. Is that reasonable?`, `\\text{${who}: } V = ${shown}`,
    opts, R, [`Estimate: ${kind === 'cone' ? '⅓ · ' : kind === 'sphere' ? '4/3 · ' : ''}3 · ${lenStr(D.r)}²${kind === 'sphere' ? '·' + lenStr(D.r) : ' · ' + lenStr(D.h)} ≈ ${est}.`, `The real volume is about ${true1}.`],
    pic(P, [[['dims', 1]]], [`V \\approx ${est}`]));
};
/** closest estimate, no calculator */
const estNearest: Gen = (R, n) => {
  const kind = pick(R, ['cyl', 'cone', 'sphere'] as const), u: U = pick(R, ['in', 'cm', 'ft'] as const);
  const D = dimsFor(R, kind, 'cylinder-volume-calc', u);
  if (val(D.r) < 2 || val(D.h) < 2) return estNearest(R, n + 1);
  const c = val(coef(kind, D.r, D.h)), v = c * Math.PI;
  const cands = [Math.round(v), Math.round(v * 4), Math.round(v / 3.14), Math.round(v * 10)];
  if (new Set(cands).size < 4 || cands[0]! < 4) return estNearest(R, n + 1);
  const nice = (x: number) => (x >= 100 ? Math.round(x / 10) * 10 : x);
  const [a, b, cc, d] = cands.map(nice) as [number, number, number, number];
  if (new Set([a, b, cc, d]).size < 4) return estNearest(R, n + 1);
  return choiceItem(`est-nearest-${n}`, 'est-nearest', `A ${KNAME[kind]} has radius ${A(len(D.r, u))}${kind === 'sphere' ? '' : ` and height ${A(len(D.h, u))}`}. No calculator: which is closest to its volume? Use π ≈ 3.`, 'V \\approx \\,?', [
    { t: `about ${a} ${cu(u)}`, ok: true, say: `Yes: π ≈ 3 gives about ${Math.round(c * 3)}.` },
    { t: `about ${b} ${cu(u)}`, mc: MC.dForR, say: 'That is 4 times too big: what you get from the diameter in place of the radius.' },
    { t: `about ${cc} ${cu(u)}`, say: 'That leaves π out.' },
    { t: `about ${d} ${cu(u)}`, mc: MC.trustsDisplay, say: 'Ten times too big: a slipped decimal point. Check against your estimate.' },
  ], R, [`${kind === 'cone' ? '⅓ · ' : kind === 'sphere' ? '4/3 · ' : ''}3 · ${lenStr(D.r)}²${kind === 'sphere' ? ' · ' + lenStr(D.r) : ' · ' + lenStr(D.h)} ≈ ${Math.round(c * 3)}.`], pic(volPicture(D), [[['dims', 1]]], [`V \\approx 3 \\cdot ${Math.round(c)} = ${Math.round(c * 3)}`]));
};
/** a worked solution with one wrong input */
function auditCase(R: () => number) {
  const kind = pick(R, ['cyl', 'cone', 'cone'] as const), u: U = pick(R, ['in', 'cm', 'ft'] as const);
  const err = kind === 'cone' ? pick(R, ['d', 'slant', 'slant'] as const) : 'd';
  const [a0, b0, c0] = pick(R, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]] as const);
  const r = kind === 'cone' ? a0 : int(R, 2, 8), h = kind === 'cone' ? b0 : int(R, 3, 12), l = c0;
  const used = err === 'd' ? { r: 2 * r, h } : { r, h: l };
  const right = coef(kind, W(r), W(h)), wrong = coef(kind, W(used.r), W(used.h));
  const who = pick(R, ['Noah', 'Mia', 'Eli', 'Zoe', 'Liam', 'Ruby']);
  const dims: Omit<Dim, 'v'>[] = [{ what: err === 'd' ? 'd' : 'r', text: `${err === 'd' ? 2 * r : r} ${u}` }, { what: 'h', text: `${h} ${u}` }];
  if (kind === 'cone') dims.push({ what: 'l', text: `${l} ${u}` });
  const P = one(kind, r, h, dims);
  if (kind === 'cone') { P.vessels[0]!.r = r; P.vessels[0]!.h = h; }
  const work = kind === 'cone' ? `V = ⅓ · π · ${used.r}² · ${used.h} = ${htmlPi(wrong)}` : `V = π · ${used.r}² · ${used.h} = ${htmlPi(wrong)}`;
  const workT = kind === 'cone' ? `V = \\tfrac13 \\pi \\cdot ${used.r}^2 \\cdot ${used.h}` : `V = \\pi \\cdot ${used.r}^2 \\cdot ${used.h}`;
  return { kind, u, err, r, h, l, used, right, wrong, who, P, work, workT };
}
const auditInput: Gen = (R, n) => {
  const A0 = auditCase(R);
  const opts = [
    { t: 'The diameter was used as the radius', ok: A0.err === 'd', say: A0.err === 'd' ? `Yes: ${A0.used.r} ${A0.u} is the diameter. The radius is ${A0.r} ${A0.u}, so the answer is 4 times too big.` : `${A0.who} used ${A0.r}, the radius. Look at the height instead.` },
    { t: 'The slant height was used as h', ok: A0.err === 'slant', mc: undefined, say: A0.err === 'slant' ? `Yes: ${A0.l} ${A0.u} runs along the slanted side. The height for the volume is ${A0.h} ${A0.u}, square to the base.` : 'There is no slant height in this one.' },
    { t: 'Nothing: the arithmetic checks out', mc: MC.arithValid, say: 'The multiplying is right, but one input is the wrong length. Correct arithmetic can’t fix a wrong setup.' },
    { t: 'The wrong formula was used', say: `The formula fits a ${KNAME[A0.kind]}. The problem is one of the numbers put into it.` },
  ];
  return choiceItem(`audit-input-${n}`, 'audit-input', `${A0.who} found the volume of this ${KNAME[A0.kind]}: ${A0.work} ${cu(A0.u)}. What went wrong?`, `\\text{${A0.who}'s work:}`, opts, R,
    [A0.err === 'd' ? `The ${A0.used.r} ${A0.u} line goes all the way across: a diameter. r = ${A0.r} ${A0.u}.` : `${A0.l} ${A0.u} is the slanted side. h = ${A0.h} ${A0.u}, square to the base.`, `Right: V = ${htmlPi(A0.right)} ${cu(A0.u)}.`],
    { ...pic(A0.P, [[['dims', 1]]], [`V = ${texPi(A0.right)}${tu(A0.u)}`]), pre: [A0.workT, `= ${texPi(A0.wrong)}`] });
};
const auditFix: Gen = (R, n) => {
  const A0 = auditCase(R);
  const traps: Trap[] = [{ v: val(A0.wrong), mc: MC.arithValid, say: `That is ${A0.who}’s answer. The arithmetic was fine, but one input was wrong.` }];
  if (A0.err === 'd') traps.push({ v: val(A0.wrong) / 2, mc: MC.halvesVolume, say: 'Halving the answer does not undo the diameter: halve the length, then square it.' });
  return coefItem(`audit-fix-${n}`, 'audit-fix', `${A0.who} found the volume of this ${KNAME[A0.kind]}: ${A0.work} ${cu(A0.u)}. One input is wrong. What is the right volume?`, `\\text{${A0.who}'s work:}`, A0.u, A0.right,
    [A0.err === 'd' ? `The radius is half of ${A0.used.r}: ${A0.r} ${A0.u}.` : `Use the perpendicular height, ${A0.h} ${A0.u}, not the slant ${A0.l} ${A0.u}.`, `V = <b>${htmlPi(A0.right)} ${cu(A0.u)}</b>.`], traps,
    'Find the wrong input in the picture first, then redo the calculation.', { ...pic(A0.P, [[['dims', 1]]], [`V = ${texPi(A0.right)}${tu(A0.u)}`]), pre: [A0.workT, `= ${texPi(A0.wrong)}`] });
};

/** a missing height from the volume */
const solveH: Gen = (R, n) => {
  const kind = pick(R, ['cyl', 'cone'] as const), u: U = pick(R, ['in', 'cm', 'ft'] as const), useD = R() < 0.3;
  const r = int(R, 2, 8), h = kind === 'cone' ? int(R, 2, 15) : int(R, 2, 12);
  const c = coef(kind, W(r), W(h));
  if (!isWhole(c)) return solveH(R, n + 1);
  const D: Dims = { kind, r: W(r), h: W(h), d: W(2 * r), u, useD };
  const P = volPicture(D, { askH: true });
  const Bc = r * r;
  const traps: Trap[] = kind === 'cyl'
    ? [{ v: val(c) / r, mc: MC.partOfBase, say: `Divide by the whole base, π · ${r}² = ${Bc}π, not by the radius.` }, { v: val(c) / (2 * r), say: 'Divide by the base area π r².' }, { v: val(c) / (4 * r * r), mc: MC.dForR, say: 'Use the radius, half the diameter.' }]
    : [{ v: val(c) / Bc, mc: MC.partialUndo, say: 'That undoes the π r² but not the 1/3. Multiply by 3 too.' }, { v: val(c) / (3 * Bc), mc: MC.unitFraction, say: 'To undo × 1/3, multiply by 3 (don’t divide by 3).' }, { v: (3 * val(c)) / (4 * Bc), mc: MC.dForR, say: 'Use the radius, half the diameter.' }];
  return numItem(`solve-h-${n}`, 'solve-h', `This ${KNAME[kind]} has V = ${A(`${val(c)}π ${cu(u)}`)} and ${useD ? `diameter ${A(`${2 * r} ${u}`)}` : `radius ${A(`${r} ${u}`)}`}. How tall is it?`, `${val(c)}\\pi = ${kind === 'cone' ? '\\tfrac13 ' : ''}\\pi \\cdot ${r}^2 \\cdot h`, u, h,
    [...(useD ? [`r = ${2 * r} ÷ 2 = ${r} ${u}.`] : []), kind === 'cyl' ? `${val(c)}π = ${Bc}π · h.` : `${val(c)}π = ⅓ · ${Bc}π · h, so ${3 * val(c)}π = ${Bc}π · h.`, `h = ${kind === 'cyl' ? val(c) : 3 * val(c)} ÷ ${Bc} = <b>${h} ${u}</b> (a length, so ${u}, not ${cu(u)}).`], traps,
    kind === 'cyl' ? 'Work out π r² first, then divide the volume by it.' : 'Multiply the volume by 3 (that undoes the 1/3), then divide by π r².',
    pic(P, [[['dims', 1]]], [kind === 'cyl' ? `${val(c)}\\pi = ${Bc}\\pi \\cdot h` : `${3 * val(c)}\\pi = ${Bc}\\pi \\cdot h`, `h = ${h}\\text{ ${u}}`]), { okSay: `Yes: h = ${h} ${u}.` });
};
/** a missing radius: a perfect square or cube */
const solveR: Gen = (R, n) => {
  const kind = pick(R, ['cyl', 'cone', 'sphere', 'sphere'] as const), u: U = pick(R, ['in', 'cm', 'ft'] as const);
  const r = kind === 'sphere' ? int(R, 1, 5) : int(R, 2, 12), h = kind === 'cone' ? 3 * int(R, 1, 4) : int(R, 1, 10);
  const c = coef(kind, W(r), W(h));
  if (!isWhole(c)) return solveR(R, n + 1);
  const D: Dims = { kind, r: W(r), h: W(h), u, useD: false };
  const P = volPicture(D, { askR: true });
  const traps: Trap[] = kind === 'sphere'
    ? [{ v: r * r * r, say: `That is r³. Which number cubed gives ${r ** 3}?` }, { v: Math.sqrt(r ** 3), mc: MC.rootSwap, say: `The radius is cubed in a sphere: find the number that cubed gives ${r ** 3}, not squared.` }]
    : [{ v: r * r, say: `That is r². Which number squared gives ${r * r}?` }, { v: Math.cbrt(r * r), mc: MC.rootSwap, say: `In a ${KNAME[kind]} the radius is squared: find the number that squared gives ${r * r}.` }, { v: val(c) / h, say: `That is r² (the volume ÷ the height). Now find r.` }];
  const step = kind === 'sphere' ? `${val(c)}π = 4/3 · π · r³, so r³ = ${val(c)} · 3/4 = ${r ** 3}.` : kind === 'cone' ? `${val(c)}π = ⅓ · π · r² · ${h}, so r² = ${val(c)} · 3 ÷ ${h} = ${r * r}.` : `${val(c)}π = π · r² · ${h}, so r² = ${val(c)} ÷ ${h} = ${r * r}.`;
  return numItem(`solve-r-${n}`, 'solve-r', `This ${KNAME[kind]} has V = ${A(`${val(c)}π ${cu(u)}`)}${kind === 'sphere' ? '' : ` and height ${A(`${h} ${u}`)}`}. What is its radius?`, kind === 'sphere' ? `${val(c)}\\pi = \\tfrac43 \\pi r^3` : `${val(c)}\\pi = ${kind === 'cone' ? '\\tfrac13 ' : ''}\\pi r^2 \\cdot ${h}`, u, r,
    [step, `${r}${kind === 'sphere' ? '³' : '²'} = ${kind === 'sphere' ? r ** 3 : r * r}, so r = <b>${r} ${u}</b>.`], traps,
    kind === 'sphere' ? 'Undo the 4/3 π to get r³, then ask: which whole number cubed gives it?' : 'Undo the rest to get r², then ask: which whole number squared gives it?',
    pic(P, [[['dims', 1]]], [kind === 'sphere' ? `r^3 = ${r ** 3}` : `r^2 = ${r * r}`, `r = ${r}\\text{ ${u}}`]), { okSay: `Yes: r = ${r} ${u}.` });
};
/** a context: find h or r */
const solveStory: Gen = (R, n, sg = 'solve-for-height') => {
  const u: U = pick(R, ['in', 'cm'] as const);
  if (sg === 'solve-for-radius') {
    const sphere = R() < 0.4, r = sphere ? int(R, 1, 5) : int(R, 2, 10), h = int(R, 2, 10);
    const c = sphere ? coef('sphere', W(r)) : coef('cyl', W(r), W(h));
    if (!isWhole(c)) return solveStory(R, n + 1, sg);
    const thing = pickReal(R, sphere ? ['gumball machine globe', 'round lantern', 'water balloon'] : ['paint can', 'candle', 'flower pot'], 2 * r, u, sphere ? undefined : h);
    if (!thing) return solveStory(R, n + 1, sg);
    const P = volPicture({ kind: sphere ? 'sphere' : 'cyl', r: W(r), h: W(h), u, useD: false }, { askR: true, caption: thing });
    return numItem(`solve-story-${n}`, 'solve-story', sphere ? `A ${thing} is a sphere that holds ${A(`${val(c)}π ${cu(u)}`)}. What is its radius?` : `A ${thing} is a cylinder ${A(`${h} ${u}`)} tall that holds ${A(`${val(c)}π ${cu(u)}`)}. What is its radius?`,
      'r = \\,?', u, r, [sphere ? `r³ = ${val(c)} · 3/4 = ${r ** 3}.` : `r² = ${val(c)} ÷ ${h} = ${r * r}.`, `${r}${sphere ? '³' : '²'} = ${sphere ? r ** 3 : r * r}, so r = <b>${r} ${u}</b>.`],
      [{ v: sphere ? r ** 3 : r * r, say: `That is r${sphere ? '³' : '²'}. Which whole number ${sphere ? 'cubed' : 'squared'} gives it?` }, { v: sphere ? Math.sqrt(r ** 3) : Math.cbrt(r * r), mc: MC.rootSwap, say: `The radius is ${sphere ? 'cubed' : 'squared'} here.` }],
      sphere ? 'Get r³ alone, then find which number cubed gives it.' : 'Get r² alone, then find which number squared gives it.', pic(P, [[['dims', 1]]], [sphere ? `r^3 = ${r ** 3}` : `r^2 = ${r * r}`, `r = ${r}`]), { okSay: `Yes: r = ${r} ${u}.` });
  }
  const kind = pick(R, ['cyl', 'cone'] as const), r = int(R, 2, 6), h = kind === 'cone' ? 3 * int(R, 1, 5) : int(R, 2, 12);
  const c = coef(kind, W(r), W(h));
  const thing = pickReal(R, kind === 'cyl' ? ['can of beans', 'fish tank', 'drinking glass', 'pencil cup'] : ['snow-cone cup', 'funnel', 'party hat'], 2 * r, u, h);
  if (!thing) return solveStory(R, n + 1, sg);
  const P = volPicture({ kind, r: W(r), h: W(h), u, useD: false }, { askH: true, cup: kind === 'cone' && thing !== 'party hat', caption: thing });
  return numItem(`solve-story-${n}`, 'solve-story', `A ${thing} has radius ${A(`${r} ${u}`)} and holds ${A(`${val(c)}π ${cu(u)}`)}. How ${kind === 'cone' && thing !== 'party hat' ? 'deep' : 'tall'} is it?`, 'h = \\,?', u, h,
    [kind === 'cyl' ? `${val(c)}π = ${r * r}π · h.` : `${val(c)}π = ⅓ · ${r * r}π · h, so ${3 * val(c)}π = ${r * r}π · h.`, `h = ${kind === 'cyl' ? val(c) : 3 * val(c)} ÷ ${r * r} = <b>${h} ${u}</b>.`],
    kind === 'cyl' ? [{ v: val(c) / r, mc: MC.partOfBase, say: `Divide by the base area ${r * r}π, not by the radius.` }] : [{ v: val(c) / (r * r), mc: MC.partialUndo, say: 'Undo the 1/3 too: multiply by 3.' }, { v: val(c) / (3 * r * r), mc: MC.unitFraction, say: 'To undo × 1/3, multiply by 3.' }],
    'Divide the volume by the base area (and undo the 1/3 for a cone).', pic(P, [[['dims', 1]]], [`h = ${h}\\text{ ${u}}`]), { okSay: `Yes: h = ${h} ${u}.` });
};

/** what happens to V when one length (or all) is multiplied by k? */
const KS = [2, 3, 0.5] as const;
const kTxt = (k: number) => (near(k, 0.5) ? '½' : near(k, 0.25) ? '¼' : near(k, 0.125) ? '⅛' : near(k, 1 / 3) ? '⅓' : String(k));
const kTex = (k: number) => (near(k, 0.5) ? '\\tfrac12' : near(k, 0.25) ? '\\tfrac14' : near(k, 0.125) ? '\\tfrac18' : String(k));
const scaleOne: Gen = (R, n, sg = 'scale-height-only') => {
  const k = pick(R, KS), mode = sg === 'scale-radius-only' ? 'r' : sg === 'scale-uniform-k3' ? 'all' : 'h';
  const kind = mode === 'all' ? pick(R, ['cyl', 'cone', 'sphere'] as const) : pick(R, ['cyl', 'cone'] as const);
  const f = mode === 'h' ? k : mode === 'r' ? k * k : k ** 3;
  const r = kind === 'cone' ? int(R, 1, 2) : int(R, 2, 5), h = kind === 'cone' ? int(R, 4, 7) : int(R, 3, 7);
  const r2 = mode === 'h' ? r : r * k, h2 = mode === 'r' ? h : h * k;
  const P: VesselsParams = { vessels: [{ kind, r, h, role: 'first', caption: 'before' }, { kind, r: r2, h: h2, role: 'second', caption: 'after' }], maxScale: 110, gap: 160 };
  const what = mode === 'h' ? 'only its height' : mode === 'r' ? 'only its radius' : kind === 'sphere' ? 'its radius' : 'every length (radius and height)';
  const why = mode === 'h' ? 'Only h changes, and h is not squared or cubed: V changes by the same factor as h.' : mode === 'r' ? `r is squared in π r² h: the factor is ${kTxt(k)}², not ${kTxt(k)}.` : `Each of the three directions grows by ${kTxt(k)}: the factor is ${kTxt(k)}³.`;
  const opts = [
    { t: `× ${kTxt(f)}`, ok: true, mc: undefined as string | undefined, say: mode === 'h' ? `Yes: h appears once in the formula, so V changes by the same factor, ${kTxt(k)}.` : mode === 'r' ? `Yes: r is squared, so V changes by ${kTxt(k)}² = ${kTxt(f)}.` : `Yes: three directions each × ${kTxt(k)}, so V × ${kTxt(k)}³ = ${kTxt(f)}.` },
    ...[k, k * k, k ** 3, 1 / k].filter(x => !near(x, f)).slice(0, 3).map(x => ({
      t: `× ${kTxt(x)}`, ok: false,
      mc: mode === 'r' && near(x, k) ? MC.linearRadius : mode === 'all' && (near(x, k) || near(x, k * k)) ? MC.uniformFactor : mode === 'h' && (near(x, k * k) || near(x, k ** 3)) ? MC.fixedPower : mode === 'r' && near(x, k ** 3) ? MC.fixedPower : undefined,
      say: why,
    })),
  ];
  return choiceItem(`scale-one-${n}`, 'scale-one', `A ${KNAME[kind]} (radius ${A(`${r} cm`)}${kind === 'sphere' ? '' : `, height ${A(`${h} cm`)}`}) has ${what} multiplied by ${B(kTxt(k))}. Its volume is multiplied by…`, FORMULA[kind], opts, R,
    [mode === 'h' ? `V = ${kind === 'cone' ? '⅓ ' : ''}π r² h: h is there once, so V × ${kTxt(k)}.` : mode === 'r' ? `r is squared: (${kTxt(k)}r)² = ${kTxt(k * k)} r², so V × ${kTxt(f)}.` : `Every length × ${kTxt(k)}: ${kTxt(k)} · ${kTxt(k)} · ${kTxt(k)} = ${kTxt(f)}.`],
    pic(P, [[['caption', 1]]], [mode === 'h' ? `V \\times ${kTex(k)}` : mode === 'r' ? `V \\times (${kTex(k)})^2 = ${kTex(f)}V` : `V \\times (${kTex(k)})^3 = ${kTex(f)}V`], ['solid', 'caption']));
};
/** the new volume after scaling */
const scaleCompare: Gen = (R, n, sg = 'scale-height-only') => {
  const k = pick(R, [2, 3, 2, 0.5] as const), mode = sg === 'scale-radius-only' ? 'r' : sg === 'scale-uniform-k3' ? 'all' : 'h';
  const kind = mode === 'all' ? pick(R, ['cyl', 'cone', 'sphere'] as const) : pick(R, ['cyl', 'cone'] as const);
  const f = mode === 'h' ? k : mode === 'r' ? k * k : k ** 3;
  const base = int(R, 2, 30) * (k === 0.5 ? 8 : 1), V2 = base * f;
  const u: U = pick(R, ['in', 'cm', 'ft'] as const), thing = kind === 'cyl' ? pick(R, ['can', 'tank', 'glass']) : kind === 'cone' ? pick(R, ['cone cup', 'funnel', 'sand pile']) : pick(R, ['ball', 'globe', 'balloon']);
  const what = mode === 'h' ? `a ${thing} ${k === 0.5 ? 'half as tall' : `${kTxt(k)} times as tall`}, same radius` : mode === 'r' ? `a ${thing} with ${k === 0.5 ? 'half the radius' : `${kTxt(k)} times the radius`}, same height` : `a ${thing} with every length ${k === 0.5 ? 'halved' : `× ${kTxt(k)}`}`;
  const r = 1, h = 3, r2 = mode === 'h' ? r : r * k, h2 = mode === 'r' ? h : h * k;
  const P: VesselsParams = { vessels: [{ kind, r, h, role: 'first', caption: `${base}π ${cu(u)}` }, { kind, r: r2, h: h2, role: 'second', caption: '?' }], maxScale: 170, gap: 160 };
  const traps: Trap[] = [k, k * k, k ** 3].filter(x => x !== f).map(x => ({ v: base * x, mc: mode === 'r' && x === k ? MC.linearRadius : mode === 'all' ? MC.uniformFactor : MC.fixedPower, say: mode === 'h' ? `Only the height changed: V × ${kTxt(k)}.` : mode === 'r' ? `The radius is squared: V × ${kTxt(k)}².` : `All three directions change: V × ${kTxt(k)}³.` }));
  return coefItem(`scale-compare-${n}`, 'scale-compare', `A ${thing} holds ${A(`${base}π ${cu(u)}`)}. How much does ${what} hold?`, 'V_{new} = \\,?', u, q(V2 * 8, 8),
    [mode === 'h' ? `h × ${kTxt(k)} and h appears once: V × ${kTxt(k)}.` : mode === 'r' ? `r × ${kTxt(k)} and r is squared: V × ${kTxt(k)}² = ${f}.` : `Every length × ${kTxt(k)}: V × ${kTxt(k)}³ = ${f}.`, `${base}π × ${f} = <b>${V2}π ${cu(u)}</b>.`], traps,
    'Which lengths changed, and how often do they appear in the formula?', pic(P, [[['caption', 1]]], [`${base}\\pi \\times ${kTex(f)} = ${V2}\\pi`], ['solid', 'caption']));
};

// ---------- modeling ----------
/** a container with walls: inside dimensions */
const modelInside: Gen = (R, n) => {
  const ro = int(R, 4, 10), ho = int(R, 5, 14), t = 1, u: U = pick(R, ['in', 'cm'] as const);
  const ri = ro - t, hi = ho - t;
  const thing = pickReal(R, ['planter', 'mug', 'ice bucket', 'pencil cup', 'cooler'], 2 * ro, u, ho);
  if (!thing) return modelInside(R, n + 1);
  const c = q(ri * ri * hi);
  const sc = 1 / ro;
  const P: VesselsParams = {
    vessels: [{ kind: 'cyl', r: 1, h: Math.max(0.7, Math.min(2.6, ho / ro)), role: 'first', caption: thing }, { kind: 'cyl', r: ri * sc, h: Math.max(0.7, Math.min(2.6, ho / ro)) - t * sc, role: 'second', inside: 0, z0: t * sc, ghost: true }],
    dims: [{ v: 0, what: 'r', text: `${ro} ${u}` }, { v: 0, what: 'h', text: `${ho} ${u}` }], maxScale: 230,
  };
  return coefItem(`model-inside-${n}`, 'model-inside', `A ${thing} is a cylinder ${A(`${ro} ${u}`)} in radius and ${A(`${ho} ${u}`)} tall on the outside, open at the top. Its wall and bottom are ${A(`${t} ${u}`)} thick. How much can it hold?`, 'V_{inside} = \\,?', u, c,
    [`Inside: r = ${ro} − ${t} = ${ri} ${u}, h = ${ho} − ${t} = ${hi} ${u} (only the bottom, no lid).`, `V = π · ${ri}² · ${hi} = <b>${ri * ri * hi}π ${cu(u)}</b>.`],
    [{ v: ro * ro * ho, mc: MC.outsideInside, say: 'That includes the walls. What it can hold is the space inside.' }, { v: ri * ri * ho, mc: MC.outsideInside, say: 'The bottom is thick too: the inside is 1 shorter.' }, { v: ro * ro * hi, mc: MC.outsideInside, say: 'The wall makes the inside radius smaller too.' }, { v: (ro - 2) * (ro - 2) * (ho - 2), say: 'The radius loses one wall (center to edge), and there is no lid.' }],
    'Use the inside: subtract the wall from the radius and the bottom from the height.', pic(P, [[['solid', 1]]], [`r = ${ri},\\ h = ${hi}`, `V = ${ri * ri * hi}\\pi${tu(u)}`]));
};
/** a conical pile: model, compute, round */
const modelPile: Gen = (R, n) => {
  const d = 2 * int(R, 3, 15), h = int(R, 2, 12), u: U = pick(R, ['ft', 'yd'] as const);
  const r = d / 2, c = (r * r * h) / 3, V = c * Math.PI, ans = Math.round(V);
  if (h > r) return modelPile(R, n + 1);   // a pile stands no taller than its radius

  const stuff = pick(R, ['sand', 'gravel', 'mulch', 'road salt', 'grain']);
  const P = one('cone', r, h, [{ what: 'd', text: `${d} ${u}` }, { what: 'h', text: `${h} ${u}` }], { caption: `${stuff} pile` });
  return numItem(`model-pile-${n}`, 'model-pile', `A pile of ${stuff} is shaped like a cone, ${A(`${d} ${u}`)} across the bottom and ${A(`${h} ${u}`)} high. About how much ${stuff} is in it? Use the π key and round to the nearest whole ${cu(u)}.`, 'V = \\tfrac13 \\pi r^2 h', cu(u), ans,
    [`Model: a cone with r = ${d} ÷ 2 = ${r} ${u}, h = ${h} ${u}.`, `V = ⅓ · π · ${r}² · ${h} ≈ <b>${ans} ${cu(u)}</b>.`],
    [{ v: Math.round(V * 4), mc: MC.dForR, say: `${d} ${u} is all the way across. The radius is half: ${r} ${u}.` }, { v: Math.round(V * 3), mc: MC.dropsCoef, say: 'That is a cylinder. A pile comes to a point: one third of it.' }, { v: Math.round(c), mc: MC.bareNumber, say: 'Multiply by π too.' }],
    'Model the pile as a cone: halve the width for r, then ⅓ π r² h.', pic(P, [[['dims', 1]]], [`r = ${r}`, `V = \\tfrac13 \\pi \\cdot ${r}^2 \\cdot ${h} \\approx ${ans}`]), { alt: [Math.round(c * 3.14), ans - 1, ans + 1].filter(x => x !== Math.round(V * 4)), okSay: `Yes: about ${ans} ${cu(u)} of ${stuff}.` });
};

// ---------- registry ----------
export const GENERATORS: Record<string, Gen> = {
  'calc-pic': calcPic, 'calc-story': calcStory, 'id-lengths': idLengths, 'id-sphere': idSphere, 'id-lying': idLying,
  'bh-layers': bhLayers, 'bh-twin': bhTwin, 'bh-layer-area': bhLayerArea, 'cone-pour': conePour, 'cone-match': coneMatch,
  'sph-pour': sphPour, 'sph-can': sphCan, 'mix-formula': mixFormula, 'approx-round': approxRound, 'approx-signs': approxSigns,
  'dec-frac-r': decFracR, 'sa-prism-net': saPrismNet, 'sa-prism-story': saPrismStory, 'sa-cyl-net': saCylNet, 'sa-or-vol': saOrVol,
  'unit-mixed': unitMixed, 'unit-trap': unitTrap, 'cubic-conv': cubicConv, 'cubic-cube': cubicCube, 'cap-tank': capTank, 'cap-liter': capLiter,
  'est-judge': estJudge, 'est-nearest': estNearest, 'audit-input': auditInput, 'audit-fix': auditFix, 'solve-h': solveH, 'solve-r': solveR,
  'solve-story': solveStory, 'scale-one': scaleOne, 'scale-compare': scaleCompare, 'model-inside': modelInside, 'model-pile': modelPile,
};
export const FAMILY_NAMES: Record<string, string> = {
  'calc-pic': 'Volume from the picture', 'calc-story': 'A real object', 'id-lengths': 'Which length is h?', 'id-sphere': 'What a sphere needs',
  'id-lying': 'A can on its side', 'bh-layers': 'Layer times layers', 'bh-twin': 'Box or cylinder?', 'bh-layer-area': 'One layer, many layers',
  'cone-pour': 'Pour the cone', 'cone-match': 'The cone’s own cylinder', 'sph-pour': 'Pour the ball', 'sph-can': 'The can that holds a ball',
  'mix-formula': 'Which formula?', 'approx-round': 'Exact, then rounded', 'approx-signs': '= or ≈?', 'dec-frac-r': 'A fraction radius',
  'sa-prism-net': 'Prism net: L and S', 'sa-prism-story': 'Paint, wrap, label', 'sa-cyl-net': 'Unroll the can', 'sa-or-vol': 'Label or soup?',
  'unit-mixed': 'One unit first', 'unit-trap': 'Which setup?', 'cubic-conv': 'Cubic units', 'cubic-cube': 'Cubic yards and feet',
  'cap-tank': 'Cubic inches to gallons', 'cap-liter': 'Liters and gallons', 'est-judge': 'Is it reasonable?', 'est-nearest': 'Estimate first',
  'audit-input': 'Find the wrong input', 'audit-fix': 'Fix the wrong input', 'solve-h': 'Find the height', 'solve-r': 'Find the radius',
  'solve-story': 'Work backward', 'scale-one': 'Change one length', 'scale-compare': 'The new volume', 'model-inside': 'Inside the walls', 'model-pile': 'A pile as a cone',
};
// keep unused imports honest
void eqQ; void LEN_NAME;
