// configs.ts: the classic two-triangle figures of the lesson, exact and named (pure, no DOM).
//   bowtie       AC and BD cross at E: triangles AEB and CED (vertical angles at E)
//   kite         A, C on either side of BD: triangles ABD and CBD share BD
//   perp         C above M on AB: triangles AMC and BMC share CM (right angles at M)
//   parZ         A, B, C, D with AB ∥ DC and the diagonal AC: triangles ABC and CDA share AC (alternate interior angles)
//   overlapAngle D on AB, E on AC, BE and CD cross: triangles ABE and ACD share the angle at A
//   overlapBase  A, D above BC, AC and DB cross: triangles ABC and DCB share BC
// Each returns points and the segments to draw; marks are added per item (tri.ts buildFig checks them).
import { type Pt, at, rotP } from '../geometry-foundations/geo';

export interface Config { pts: Record<string, Pt>; segs: string[] }
/** the config with its letters mapped (t from tri.ts relabeler) */
export const relabel = (c: Config, t: (s: string) => string): Config => ({ pts: Object.fromEntries(Object.entries(c.pts).map(([k, p]) => [t(k), p])), segs: c.segs.map(t) });
const r = (R: () => number, lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
const turn = (c: Config, deg: number): Config => ({ ...c, pts: Object.fromEntries(Object.entries(c.pts).map(([k, p]) => [k, rotP(p, deg)])) });

export function bowtie(R: () => number, o: { both?: boolean } = {}): Config {
  // E at the origin; A upper left, B lower left; C, D opposite (E is the midpoint of AC; of BD too when `both`)
  const t1 = r(R, 140, 158), t2 = r(R, 205, 222), a = r(R, 230, 290);
  let b = r(R, 230, 290); while (Math.abs(b - a) < 30) b = r(R, 200, 300);
  const E: Pt = [0, 0];
  const c = { pts: { A: at(E, t1, a), B: at(E, t2, b), C: at(E, t1 + 180, a), D: at(E, t2 + 180, o.both === false ? b * 1.0 : b), E }, segs: ['AE', 'EC', 'BE', 'ED', 'AB', 'DC'] };
  return turn(c, r(R, -10, 10));
}
export function kite(R: () => number): Config {
  const t = r(R, 200, 250), u = r(R, 290, 350), w = r(R, 170, 220), v = r(R, -30, 50);
  return turn({ pts: { A: [-w, v], B: [0, t], C: [w, v], D: [0, -u] }, segs: ['AB', 'CB', 'AD', 'CD', 'BD'] }, r(R, -8, 8));
}
export function perp(R: () => number): Config {
  const w = r(R, 180, 230), h = r(R, 250, 320);
  return turn({ pts: { A: [-w, 0], M: [0, 0], B: [w, 0], C: [0, h] }, segs: ['AM', 'MB', 'CM', 'AC', 'BC'] }, r(R, -8, 8));
}
export function parZ(R: () => number): Config {
  const L = r(R, 300, 360), s = r(R, 70, 150), h = r(R, 210, 260);
  return turn({ pts: { A: [0, 0], B: [L, 0], C: [L + s, h], D: [s, h] }, segs: ['AB', 'DC', 'BC', 'AD', 'AC'] }, r(R, -6, 6));
}
export function overlapAngle(R: () => number): Config {
  const h = r(R, 400, 450), w = r(R, 190, 230), f = r(R, 45, 58) / 100;
  const A: Pt = [0, h], B: Pt = [-w, 0], C: Pt = [w, 0];
  const D: Pt = [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f], E: Pt = [A[0] + (C[0] - A[0]) * f, A[1] + (C[1] - A[1]) * f];
  return { pts: { A, B, C, D, E }, segs: ['AD', 'DB', 'AE', 'EC', 'BE', 'CD'] };
}
export function overlapBase(R: () => number): Config {
  const w = r(R, 220, 260), p = r(R, 90, 140), h = r(R, 230, 280);
  return { pts: { A: [-p, h], B: [-w, 0], C: [w, 0], D: [p, h] }, segs: ['AB', 'DC', 'BC', 'AC', 'DB'] };
}
