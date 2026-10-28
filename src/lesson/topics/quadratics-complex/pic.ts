// pic.ts: practice pictures (data) and their kit Plane parameters. Pure (kit types only), so the tests build every
// picture with the frame the page uses and catch a window that would not read.
//   graphPic   a parabola y = ax² + bx + c in a window that shows the vertex (and the x-intercepts when real)
//   modelPic   a height / area model over a real domain (t >= 0 or 0 <= x <= s) with a target line
//   rootsPic   the complex plane (square cells) holding the given and revealed points
import type { PItem, PParams } from '../../kit/Plane';
import type { GraphPic, PP, RootsPic } from './common';

const STEPS = [1, 2, 4, 5, 10, 20, 25, 50, 100, 200];
const cl = (v: number) => { const r = Math.round(v * 1e6) / 1e6; return Object.is(r, -0) ? 0 : r; };
/** a window [min, max, step] holding every value with half a step of room, 6..most cells, 0 inside */
export function win(vals: number[], most = 12): [number, number, number] {
  const vs = [...vals, 0], lo = Math.min(...vs), hi = Math.max(...vs);
  for (const s of STEPS) {
    let a = Math.floor((lo - 0.5 * s) / s + 1e-9) * s, b = Math.ceil((hi + 0.5 * s) / s - 1e-9) * s;
    const n = Math.round((b - a) / s);
    if (n > most) continue;
    if (n < 6) { const more = Math.ceil((6 - n) / 2); a -= more * s; b += more * s; }
    return [cl(a), cl(b), s];
  }
  throw new Error(`win: ${vals.join(', ')}`);
}
export function win0(vals: number[], most = 10): [number, number, number] {
  const hi = Math.max(...vals);
  for (const s of [0.25, 0.5, ...STEPS]) { const b = Math.ceil((hi + 0.5 * s) / s - 1e-9) * s, n = Math.round(b / s); if (n <= most) return [0, cl(Math.max(b, 4 * s)), s]; }
  throw new Error(`win0: ${vals.join(', ')}`);
}
const f = (s: readonly number[]) => (x: number) => s[0]! * x * x + s[1]! * x + s[2]!;

/** a parabola with its vertex in view; `late` = the curve comes in at the solve (the graph would give the answer away) */
export function graphPic(a: number, b: number, c: number, o: { late?: boolean; vertex?: boolean; reveal?: GraphPic['reveal'] } = {}): GraphPic {
  const h = -b / (2 * a), k = f([a, b, c])(h), D = b * b - 4 * a * c;
  const xs = [h - 3, h + 3];
  if (D >= 0) { const r = Math.sqrt(D) / (2 * Math.abs(a)); xs.push(h - r - 1, h + r + 1); }
  const x = win(xs, 12);
  // y: the vertex and a band above (a > 0) or below (a < 0) it, so the arms show; cap the far side
  const span = Math.max(4, Math.abs(f([a, b, c])(h + 2.5) - k));
  const y = win(a > 0 ? [k, k + span] : [k, k - span], 12);
  return { s: [a, b, c], x, y, late: o.late, vertex: o.vertex, reveal: o.reveal };
}

/** a real-valued model y = a·x² + b·x + c over lo..hi with a target line y = T (names with units) */
export function modelPic(a: number, b: number, c: number, lo: number, hi: number, T: number, xName: string, yName: string, tName: string): GraphPic {
  const h = -b / (2 * a), top = f([a, b, c])(h);
  return { s: [a, b, c], x: win0([hi]), y: win0([top, T]), xName, yName, lo, hi, late: true, hline: { y: T, name: tName }, reveal: { vertexName: undefined } };
}

/** the complex plane window for these points (square cells, 0 in the middle) */
export function rootsPic(given: PP[], reveal: PP[] = [], vline?: number, revealLine?: number): RootsPic {
  const all = [...given, ...reveal].flatMap(p => [Math.abs(p.at[0]), Math.abs(p.at[1])]);
  if (vline !== undefined) all.push(Math.abs(vline));
  if (revealLine !== undefined) all.push(Math.abs(revealLine));
  const m = Math.max(2, ...all) + 0.8;
  const step = m <= 6 ? 1 : m <= 12 ? 2 : m <= 30 ? 5 : 10, top = Math.ceil(m / step) * step;
  return { x: [-top, top], y: [-top, top], step, given, vline, reveal: reveal.length || revealLine !== undefined ? { pts: reveal, vline: revealLine } : undefined };
}

// ---------- kit Plane parameters (the page draws these; the tests build them) ----------
const fmtN = (v: number) => { const r = Math.round(v * 1000) / 1000; return (r < 0 ? '−' : '') + String(Math.abs(r)); };
/** imaginary tick labels: 2i, −i, i */
export const fmtIm = (v: number) => (Math.abs(v) < 1e-9 ? '' : Math.abs(v - 1) < 1e-9 ? 'i' : Math.abs(v + 1) < 1e-9 ? '−i' : `${fmtN(v)}i`);
export function graphParams(g: GraphPic): PParams {
  const [a, b, c] = g.s, h = -b / (2 * a), k = a * h * h + b * h + c;
  const items: PItem[] = [{ kind: 'curve', key: 'c', f: f(g.s), col: 'link', lo: g.lo, hi: g.hi, ends: g.lo !== undefined ? ['closed', 'closed'] : undefined }];
  if (g.hline) items.push({ kind: 'hline', key: 'T', y: g.hline.y, col: 'first' });
  if (g.vertex || g.reveal?.vertexName) {
    items.push({ kind: 'vline', key: 'ax', x: h, col: 'pick' });
    items.push({ kind: 'point', key: 'v', x: h, y: k, col: 'second', name: g.reveal?.vertexName });
  }
  for (const [i, x0] of (g.reveal?.xints ?? []).entries()) items.push({ kind: 'point', key: `z${i}`, x: x0, y: 0, col: 'link' });
  return { x: { min: g.x[0], max: g.x[1], step: g.x[2], name: g.xName ?? 'x' }, y: { min: g.y[0], max: g.y[1], step: g.y[2], name: g.yName ?? 'y' }, items };
}
function ppItems(pts: readonly PP[], pre: string): PItem[] {
  return pts.map(p => ({ kind: 'point', key: pre + p.key, x: p.at[0], y: p.at[1], name: p.name, col: (p.col ?? 'first') as PItem['col'], open: p.open }) as PItem);
}
export function rootsParams(r: RootsPic): PParams {
  const items: PItem[] = [...ppItems(r.given, ''), ...ppItems(r.reveal?.pts ?? [], 'r.')];
  if (r.vline !== undefined) items.push({ kind: 'vline', key: 'vl', x: r.vline, col: 'pick' });
  if (r.reveal?.vline !== undefined) items.push({ kind: 'vline', key: 'r.vl', x: r.reveal.vline, col: 'pick' });
  return { x: { min: r.x[0], max: r.x[1], step: r.step, name: 'real' }, y: { min: r.y[0], max: r.y[1], step: r.step, name: 'imaginary', fmt: fmtIm }, equal: true, items };
}
