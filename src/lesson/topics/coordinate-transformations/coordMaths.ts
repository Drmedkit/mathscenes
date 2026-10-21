// coordMaths.ts: the exact maths of "transformations in the coordinate plane: reflect and translate".
// A move (a translation, a reflection across an axis or across x = k / y = k, and two non-rigid rules for the
// extension) maps every point by ONE rule; the image of a figure is that rule applied to every vertex.
// Pure: no DOM, no canvas. Coordinates are integers, halves or tenths; results are rounded to 1e-6 so tenths stay exact.

export type V = readonly [number, number];
export type Move =
  | { kind: 'slide'; dx: number; dy: number }
  | { kind: 'reflect'; axis: 'x' | 'y' }
  /** a mirror line that is not an axis: vertical x = k or horizontal y = k */
  | { kind: 'mirror'; line: 'x' | 'y'; k: number }
  /** extension non-examples: (a·x, y) and (x, y + x) */
  | { kind: 'stretch'; a: number }
  | { kind: 'shear' };

const r6 = (v: number) => { const r = Math.round(v * 1e6) / 1e6; return Object.is(r, -0) ? 0 : r; };
export function apply(m: Move, p: V): V {
  const [x, y] = p;
  switch (m.kind) {
    case 'slide': return [r6(x + m.dx), r6(y + m.dy)];
    case 'reflect': return m.axis === 'x' ? [r6(x), r6(-y)] : [r6(-x), r6(y)];
    case 'mirror': return m.line === 'x' ? [r6(2 * m.k - x), r6(y)] : [r6(x), r6(2 * m.k - y)];
    case 'stretch': return [r6(m.a * x), r6(y)];
    case 'shear': return [r6(x), r6(y + x)];
  }
}
export const applyAll = (m: Move, P: readonly V[]): V[] => P.map(p => apply(m, p));
/** the point after a fraction t of the move (the animation: a straight slide, a fold that closes and opens) */
export function partway(m: Move, p: V, t: number): V {
  const [x, y] = p, q = apply(m, p);
  if (m.kind === 'reflect' || m.kind === 'mirror') {
    // a fold: the coordinate across the mirror goes through the mirror line (scale 1 -> 0 -> -1)
    const f = 1 - 2 * t;
    if (m.kind === 'reflect') return m.axis === 'x' ? [x, y * f] : [x * f, y];
    return m.line === 'x' ? [m.k + (x - m.k) * f, y] : [x, m.k + (y - m.k) * f];
  }
  return [x + (q[0] - x) * t, y + (q[1] - y) * t];
}
export const isRigid = (m: Move): boolean => m.kind === 'slide' || m.kind === 'reflect' || m.kind === 'mirror';
export const isReflection = (m: Move): boolean => m.kind === 'reflect' || m.kind === 'mirror';
export const same = (a: V, b: V): boolean => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;

// ---------- measures ----------
export const dist = (a: V, b: V): number => Math.hypot(b[0] - a[0], b[1] - a[1]);
/** twice the signed area: > 0 counterclockwise (math axes, y up) */
export function area2(P: readonly V[]): number {
  let s = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i]!, b = P[(i + 1) % P.length]!; s += a[0] * b[1] - b[0] * a[1]; }
  return s;
}
export const orient = (P: readonly V[]): 1 | -1 | 0 => { const a = area2(P); return a > 1e-9 ? 1 : a < -1e-9 ? -1 : 0; };
/** the angle at vertex i of a polygon, in degrees */
export function angleAt(P: readonly V[], i: number): number {
  const n = P.length, b = P[i]!, a = P[(i - 1 + n) % n]!, c = P[(i + 1) % n]!;
  const u = [a[0] - b[0], a[1] - b[1]], v = [c[0] - b[0], c[1] - b[1]];
  const cos = (u[0]! * v[0]! + u[1]! * v[1]!) / (Math.hypot(u[0]!, u[1]!) * Math.hypot(v[0]!, v[1]!));
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}
export const collinear = (a: V, b: V, c: V): boolean => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) < 1e-9;
export const parallel = (a: V, b: V, c: V, d: V): boolean => Math.abs((b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0])) < 1e-9;
export const centroid = (P: readonly V[]): V => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];

/** every translation or axis reflection that sends pre[i] to img[i] for EVERY i (checks every pair) */
export function movesFitting(pre: readonly V[], img: readonly V[]): Move[] {
  if (pre.length !== img.length || !pre.length) return [];
  const cands: Move[] = [
    { kind: 'slide', dx: r6(img[0]![0] - pre[0]![0]), dy: r6(img[0]![1] - pre[0]![1]) },
    { kind: 'reflect', axis: 'x' }, { kind: 'reflect', axis: 'y' },
  ];
  return cands.filter(m => pre.every((p, i) => same(apply(m, p), img[i]!)));
}

// ---------- words and notation ----------
/** a number for the page: −3, 2.5 (a real minus sign) */
export const fmt = (n: number): string => (n < 0 ? `−${r6(-n)}` : `${r6(n)}`);
/** a number for TeX */
export const tn = (n: number): string => (n < 0 ? `-${r6(-n)}` : `${r6(n)}`);
export const pair = (p: V): string => `(${fmt(p[0])}, ${fmt(p[1])})`;
export const pairTex = (p: V): string => `(${tn(p[0])},${tn(p[1])})`;
/** "5 right and 4 down", "3 left", "no move" */
export function slideWords(dx: number, dy: number, and = ' and '): string {
  const h = dx > 0 ? `${r6(dx)} right` : dx < 0 ? `${r6(-dx)} left` : '';
  const v = dy > 0 ? `${r6(dy)} up` : dy < 0 ? `${r6(-dy)} down` : '';
  return h && v ? `${h}${and}${v}` : h || v || 'no move';
}
export function moveWords(m: Move): string {
  switch (m.kind) {
    case 'slide': return `slide ${slideWords(m.dx, m.dy)}`;
    case 'reflect': return `reflect across the ${m.axis}-axis`;
    case 'mirror': return `reflect across the line ${m.line} = ${fmt(m.k)}`;
    case 'stretch': return `(x, y) → (${m.a}x, y)`;
    case 'shear': return '(x, y) → (x, y + x)';
  }
}
/** one coordinate of a rule: x + 5, y − 4, x, −x */
function part(v: 'x' | 'y', d: number, tex: boolean): string {
  if (d === 0) return v;
  const m = tex ? '-' : '−';
  return `${v} ${d > 0 ? '+' : m} ${r6(Math.abs(d))}`;
}
/** the arrow rule in plain text: (x, y) → (x + 5, y − 4) */
export function ruleText(m: Move): string {
  const s = ruleParts(m, false);
  return `(x, y) → (${s[0]}, ${s[1]})`;
}
/** the two image coordinates of a rule as text or TeX: ['x + 5', 'y − 4'] */
export function ruleParts(m: Move, tex: boolean): [string, string] {
  const neg = tex ? '-' : '−';
  switch (m.kind) {
    case 'slide': return [part('x', m.dx, tex), part('y', m.dy, tex)];
    case 'reflect': return m.axis === 'x' ? ['x', `${neg}y`] : [`${neg}x`, 'y'];
    case 'mirror': return m.line === 'x' ? [`${r6(2 * m.k)} ${neg} x`, 'y'] : ['x', `${r6(2 * m.k)} ${neg} y`];
    case 'stretch': return [`${m.a}x`, 'y'];
    case 'shear': return ['x', 'y + x'];
  }
}
/** the arrow rule in TeX; `ids` wraps the two image parts in \cssId{rx}{..} and \cssId{ry}{..} */
export function ruleTex(m: Move, ids = false): string {
  const [a, b] = ruleParts(m, true).map(s => s.replace(/ /g, ''));
  const A = ids ? `\\cssId{rx}{${a}}` : a, B = ids ? `\\cssId{ry}{${b}}` : b;
  return `(x,\\,y)\\to(${A},\\,${B})`;
}
