// Tree: a two-level tree of relative frequencies. First branches = the marginal shares (who is in which group),
// second branches = the conditional shares inside each group, leaves = the joint shares (branch × branch).
// Percents sit beside their branch (never on it), leaf products in a column at the right.
// Layout (treeLayout) is pure and tested: labels inside the area, no label on a branch, no two labels overlapping.
import { type Box, type Pt, box, clamp, lag } from '../../../core/math';
import { type Canvas, dot } from '../../../core/draw';
import { E } from '../../../core/easing';
import { type Formula, tex, texDraw } from '../../../core/tex';
import { type Paint, paint } from '../../../core/theme';
import { inkLine } from '../../wash';
import { DUSK } from '../../dusk';
import { drawWords } from '../../words';
import { CAT_COL, LABEL, numW, wordsW } from './TwoWayTable';
import { fmt } from './twoWayMaths';

export interface TreeSpec {
  first: readonly { label: string; p: number | null }[];
  second: readonly (readonly { label: string; p: number | null }[])[];
  /** leaf (joint) percents, i x j; null = not shown */
  leaf: readonly (readonly (number | null)[])[];
  /** 'b0' first branch, 'b01' second branch, 'l01' leaf: drawn as '?' */
  hide?: readonly string[];
  d?: number;
}
export interface TreeGeom {
  root: Pt; mid: Pt[]; leaf: Pt[][];
  /** label centres (percent of a branch) and boxes */
  b1: { at: Pt; box: Box }[]; b2: { at: Pt; box: Box }[][];
  midLabel: { at: Pt; box: Box }[]; leafLabel: { at: Pt; box: Box }[][]; leafVal: { at: Pt; box: Box }[][];
  lines: Pt[][];
  num: number;
}
const NUMT = 60;
const pctText = (p: number | null, d = 1) => (p === null ? '' : fmt(p, d) + '%');

/** place a label of half-size (hw, hh) beside the segment a-b, on the side `side` (+1 = left of travel), clear of it */
function beside(a: Pt, b: Pt, hw: number, hh: number, side: number, gap = 16): { at: Pt; box: Box } {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  const nx = (side * dy) / L, ny = (-side * dx) / L;
  // distance so the box corner nearest the line clears it: |n·corner offset| ≤ hw|nx| + hh|ny|
  const d = hw * Math.abs(nx) + hh * Math.abs(ny) + gap;
  const at: Pt = [mx + nx * d, my + ny * d];
  return { at, box: box(at[0] - hw, at[1] - hh, at[0] + hw, at[1] + hh) };
}
export function treeLayout(spec: TreeSpec, area: Box): TreeGeom {
  const n1 = spec.first.length, cy = area.cy;
  const leafX = area.x0 + area.w * 0.5, midX = area.x0 + area.w * 0.27, rootX = area.x0 + 40;
  const nLeaves = spec.second.reduce((s, r) => s + r.length, 0);
  const step = Math.min(210, (area.h - 80) / nLeaves);
  const leaf: Pt[][] = [], mid: Pt[] = [];
  let k = 0;
  const top = cy - (step * (nLeaves - 1)) / 2;
  for (let i = 0; i < n1; i++) {
    const row: Pt[] = [];
    for (let j = 0; j < spec.second[i]!.length; j++) row.push([leafX, top + step * k++]);
    leaf.push(row);
    mid.push([midX, (row[0]![1] + row[row.length - 1]![1]) / 2]);
  }
  const root: Pt = [rootX, cy];
  const hh = NUMT * 0.42, d = spec.d ?? 1;
  const hw = (p: number | null) => Math.max(numW(pctText(p, d) || '?', NUMT), numW('00%', NUMT)) / 2 + 6;
  const b1 = spec.first.map((q, i) => beside(root, mid[i]!, hw(q.p), hh, i < n1 / 2 ? 1 : -1));
  const b2 = spec.second.map((r, i) => r.map((q, j) => beside(mid[i]!, leaf[i]![j]!, hw(q.p), hh, j < r.length / 2 ? 1 : -1)));
  const midLabel = spec.first.map((q, i) => {
    const w = wordsW(q.label, LABEL), up = i < n1 / 2;
    const at: Pt = [mid[i]![0] - 18 - w / 2, mid[i]![1] + (up ? -54 : 54)];
    return { at, box: box(at[0] - w / 2, at[1] - LABEL * 0.42, at[0] + w / 2, at[1] + LABEL * 0.42) };
  });
  const leafLabel = spec.second.map((r, i) => r.map((q, j) => {
    const w = wordsW(q.label, LABEL), at: Pt = [leaf[i]![j]![0] + 26 + w / 2, leaf[i]![j]![1]];
    return { at, box: box(at[0] - w / 2, at[1] - LABEL * 0.42, at[0] + w / 2, at[1] + LABEL * 0.42) };
  }));
  const leafVal = spec.leaf.map((r, i) => r.map((v, j) => {
    const w = Math.max(numW(pctText(v, 2) || '?', NUMT), numW('00.0%', NUMT)), at: Pt = [area.x1 - w / 2, leaf[i]![j]![1]];
    return { at, box: box(at[0] - w / 2, at[1] - hh, at[0] + w / 2, at[1] + hh) };
  }));
  const lines: Pt[][] = [...mid.map(m => [root, m]), ...mid.flatMap((m, i) => leaf[i]!.map(l => [m, l]))];
  return { root, mid, leaf, b1, b2, midLabel, leafLabel, leafVal, lines, num: NUMT };
}

export interface TreeFocus {
  /** light one path root -> mid i -> leaf j (lime) */
  path?: { i: number; j: number; k: number } | null;
  reveal?: number;
}
const FC = new Map<string, Formula>();
const F = (s: string): Formula => { let f = FC.get(s); if (!f) { f = tex(s) as Formula; FC.set(s, f); } return f; };
const texP = (p: number, d: number) => `${fmt(p, d)}\\%`;

export function drawTree(c: Canvas, spec: TreeSpec, G: TreeGeom, k: { grow: number; leaves: number }, f: TreeFocus = {}): void {
  const kg = clamp(k.grow), hide = new Set(spec.hide ?? []), rv = clamp(f.reveal ?? 0), d = spec.d ?? 1;
  const n1 = spec.first.length;
  const on = (i: number, j = -1) => f.path && f.path.k > 0 && f.path.i === i && (j < 0 || f.path.j === j) ? f.path.k : 0;
  const num = (p: number | null, at: Pt, key: string, a: number, col: Paint, dd = d) => {
    if (a <= 0) return;
    if (hide.has(key)) {
      if (rv < 1) texDraw(c, F('?'), at[0], at[1], { size: G.num, align: 'center', col: 'pick', alpha: a * (1 - rv) });
      if (rv > 0 && p !== null) texDraw(c, F(texP(p, dd)), at[0], at[1], { size: G.num, align: 'center', col: 'link', alpha: a * rv });
      return;
    }
    if (p !== null) texDraw(c, F(texP(p, dd)), at[0], at[1], { size: G.num, align: 'center', col, alpha: a });
  };
  // first branches and their percents
  for (let i = 0; i < n1; i++) {
    const a = E.smooth(lag(kg, i, n1 + 1, 0.5));
    const m = G.mid[i]!, hot = on(i);
    if (a <= 0) continue;
    const end: Pt = [G.root[0] + (m[0] - G.root[0]) * a, G.root[1] + (m[1] - G.root[1]) * a];
    inkLine(c, [G.root, end], { col: DUSK.cream, w: 3.5, seed: 3 + i, rough: 0.4, alpha: 0.8 });
    if (hot) inkLine(c, [G.root, end], { col: paint(c.th, 'link', 'fill'), w: 6, seed: 3 + i, rough: 0.2, alpha: hot });
    num(spec.first[i]!.p, G.b1[i]!.at, `b${i}`, a, 'first');
    dot(c, m[0], m[1], 9, CAT_COL[i % CAT_COL.length] as Paint, a);
    drawWords(c, spec.first[i]!.label, G.midLabel[i]!.at[0], G.midLabel[i]!.at[1], 'ink', a, { size: LABEL, align: 'center' });
  }
  dot(c, G.root[0], G.root[1], 10, DUSK.cream, kg > 0 ? 1 : 0);
  // second branches
  for (let i = 0; i < n1; i++) for (let j = 0; j < spec.second[i]!.length; j++) {
    const a = E.smooth(clamp((kg - 0.45) / 0.55));
    if (a <= 0) continue;
    const m = G.mid[i]!, l = G.leaf[i]![j]!, hot = on(i, j);
    const end: Pt = [m[0] + (l[0] - m[0]) * a, m[1] + (l[1] - m[1]) * a];
    inkLine(c, [m, end], { col: DUSK.cream, w: 3, seed: 11 + i * 3 + j, rough: 0.4, alpha: 0.75 });
    if (hot) inkLine(c, [m, end], { col: paint(c.th, 'link', 'fill'), w: 6, seed: 11 + i * 3 + j, rough: 0.2, alpha: hot });
    num(spec.second[i]![j]!.p, G.b2[i]![j]!.at, `b${i}${j}`, a, 'second');
    dot(c, l[0], l[1], 7, DUSK.cream, a);
    drawWords(c, spec.second[i]![j]!.label, G.leafLabel[i]![j]!.at[0], G.leafLabel[i]![j]!.at[1], 'ink', a, { size: LABEL, align: 'center' });
  }
  // leaves (joint)
  const kl = clamp(k.leaves);
  if (kl > 0) for (let i = 0; i < n1; i++) for (let j = 0; j < spec.leaf[i]!.length; j++) {
    const v = spec.leaf[i]![j]!;
    num(v, G.leafVal[i]![j]!.at, `l${i}${j}`, E.smooth(lag(kl, i * 2 + j, 4, 0.4)), on(i, j) > 0.5 ? 'link' : 'ink', 2);
  }
}
