// Tree.ts: the quadrilateral family tree, a directed inclusion diagram (a Hasse diagram): every class sits below the
// classes that contain it, and a line joins a class to the next class up. Square sits below BOTH rectangle and
// rhombus (the overlap), rhombus below both parallelogram and kite, parallelogram below trapezoid (inclusive
// definition: at least one pair of parallel sides), isosceles trapezoid below trapezoid only (its convention: not a
// parallelogram). A node can wait as "?" (the student names it), glow (focus), or be dimmed; an edge can glow (a path
// up the tree: every name a figure has).
// Layout is pure (treeLayout, tests check it fits); TreeBlock paints it with washes and one ink line, like the course.
// Steps: frame (slate + root), nodes (top to bottom), edges.   Focus: glow / dim / hide per node, path edges.
// Could move to the kit: a small labelled DAG painter (hierarchies in sets, number systems, functions).
import type { Canvas } from '../../../core/draw';
import { strokePts } from '../../../core/draw';
import { type Box, box, clamp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import type { Paint } from '../../../core/theme';
import { inkLine, wash } from '../../wash';
import type { Frame } from '../geometry-foundations/geo';
import { label } from '../geometry-foundations/GeoFig';
import { textW } from '../geometry-foundations/geo';
import type { QK } from './quad';

export const TREE_NODES: { k: QK; text: string[]; x: number; y: number }[] = [
  { k: 'quad', text: ['Quadrilateral'], x: 0.5, y: 0.07 },
  { k: 'trap', text: ['Trapezoid'], x: 0.36, y: 0.3 },
  { k: 'kite', text: ['Kite'], x: 0.84, y: 0.3 },
  { k: 'isoTrap', text: ['Isosceles', 'trapezoid'], x: 0.12, y: 0.55 },
  { k: 'para', text: ['Parallelogram'], x: 0.47, y: 0.53 },
  { k: 'rect', text: ['Rectangle'], x: 0.33, y: 0.76 },
  { k: 'rhombus', text: ['Rhombus'], x: 0.71, y: 0.76 },
  { k: 'square', text: ['Square'], x: 0.52, y: 0.95 },
];
/** child -> parents (the next class up) */
export const TREE_EDGES: [QK, QK][] = [['trap', 'quad'], ['kite', 'quad'], ['isoTrap', 'trap'], ['para', 'trap'], ['rect', 'para'], ['rhombus', 'para'], ['rhombus', 'kite'], ['square', 'rect'], ['square', 'rhombus']];
export const SIZE = 50;

export interface TreeNodeL { k: QK; text: string[]; c: [number, number]; b: Box }
export interface TreeLayout { fr: Frame; nodes: TreeNodeL[]; edges: { from: QK; to: QK; P: [number, number][] }[] }
export function treeLayout(fr: Frame): TreeLayout {
  const nodes = TREE_NODES.map(n => {
    const w = Math.max(...n.text.map(t => textW(t, SIZE)), textW('?', SIZE)) + 56, h = n.text.length * 58 + 30;
    const cx = fr.x + fr.w * n.x, cy = fr.y + 40 + (fr.h - 120) * n.y;
    return { k: n.k, text: n.text, c: [cx, cy] as [number, number], b: box(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2) };
  });
  const at = (k: QK) => nodes.find(n => n.k === k)!;
  const edges = TREE_EDGES.map(([from, to]) => { const a = at(from).b, b = at(to).b; return { from, to, P: [[a.cx, a.y0], [b.cx, b.y1]] as [number, number][] }; });
  return { fr, nodes, edges };
}
/** what would not read: a node outside the frame, two nodes overlapping */
export function treeProblems(fr: Frame): string[] {
  const L = treeLayout(fr), out: string[] = [];
  for (const n of L.nodes) if (n.b.x0 < fr.x || n.b.x1 > fr.x + fr.w || n.b.y0 < fr.y || n.b.y1 > fr.y + fr.h) out.push(`node ${n.k} leaves the frame`);
  for (let i = 0; i < L.nodes.length; i++) for (let j = i + 1; j < L.nodes.length; j++) {
    const a = L.nodes[i]!.b, b = L.nodes[j]!.b;
    if (a.x0 < b.x1 + 16 && b.x0 < a.x1 + 16 && a.y0 < b.y1 + 16 && b.y0 < a.y1 + 16) out.push(`nodes ${L.nodes[i]!.k} and ${L.nodes[j]!.k} overlap`);
  }
  return out;
}
/** the edges of every path from class k up to the root */
export function pathUp(k: QK): [QK, QK][] {
  const out: [QK, QK][] = [];
  const walk = (x: QK) => { for (const e of TREE_EDGES) if (e[0] === x) { if (!out.some(o => o[0] === e[0] && o[1] === e[1])) out.push(e); walk(e[1]); } };
  walk(k);
  return out;
}

export interface TreeLook {
  k?: number;
  nodes?: number;
  /** per node: glow 0..1, dim 0..1, hidden (shown as "?") 0..1 (1 = hidden), colour */
  glow?: Partial<Record<QK, number>>;
  dim?: Partial<Record<QK, number>>;
  hide?: Partial<Record<QK, number>>;
  col?: Partial<Record<QK, Paint>>;
  /** edges that glow (a path up the tree) */
  path?: { e: [QK, QK]; k: number }[];
}
export function drawTree(c: Canvas, L: TreeLayout, look: TreeLook = {}): void {
  const k = clamp(look.k ?? 1);
  if (k <= 0) return;
  c.g.save(); c.g.globalAlpha *= k;
  const kn = clamp(look.nodes ?? 1);
  for (const e of L.edges) strokePts(c, e.P, { col: 'faint', lw: 4, alpha: kn });
  for (const p of look.path ?? []) {
    const e = L.edges.find(x => x.from === p.e[0] && x.to === p.e[1]);
    if (e && p.k > 0) strokePts(c, e.P, { col: 'link', lw: 7, alpha: clamp(p.k), glow: 14 * clamp(p.k) });
  }
  L.nodes.forEach((n, i) => {
    const a = kn * (1 - 0.7 * clamp(look.dim?.[n.k] ?? 0));
    if (a <= 0) return;
    const gl = clamp(look.glow?.[n.k] ?? 0), col: Paint = look.col?.[n.k] ?? (gl > 0 ? 'link' : 'first');
    const P = rectPts(n.b.x0, n.b.y0, n.b.w, n.b.h, 26);
    wash(c, P, '#232850', { alpha: 0.96 * a, ink: null, rough: 1, seed: 40 + i, shade: 0.06 });
    wash(c, P, col, { alpha: (0.16 + 0.22 * gl) * a, ink: null, rough: 1, seed: 60 + i, shade: 0.04 });
    inkLine(c, P, { col: '#efe6f7', w: 3 + 2 * gl, closed: true, seed: 80 + i, rough: 0.6, alpha: (0.55 + 0.45 * gl) * a });
    const hid = clamp(look.hide?.[n.k] ?? 0);
    const y0 = n.c[1] - ((n.text.length - 1) * 58) / 2;
    if (hid < 1) n.text.forEach((t, j) => label(c, t, [n.c[0], y0 + j * 58], SIZE, gl > 0.5 ? 'link' : 'ink', a * (1 - hid)));
    if (hid > 0) label(c, '?', n.c, SIZE + 10, 'pick', a * hid, false, 750);
  });
  c.g.restore();
}
