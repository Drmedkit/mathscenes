// GeoStrip: a geometric sequence as an indexed table strip, the partner of arithmetic-sequences' SeqStrip. Term number
// n above, value a_n below, and under every pair of neighbours an arc with the FACTOR it takes to get from one to the
// next (×2, ×½, ×(−3)). The arithmetic strip adds the same jump; this one multiplies by the same factor. An optional
// second row of arcs shows the DIFFERENCES (+3, +6, +12) dimmed, so a list can be tested both ways side by side.
//   card     the card, the row names (n, a_n) and the index row
//   vals     the values write in, one column after another ('?' for a hidden value)
//   hops     the ×r arcs, one after another
//   adds     the +d arcs (second row), when `adds` is on
//   reveal   hidden values appear (link colour): the replay after a miss, never before the answer
// Values are exact rationals (geo.ts) drawn as TeX (stacked fractions, or decimals with `dec`). A gap in the indices
// gets a '…' column, `ell` a trailing one. Focus: `lit` = how many hops glow (counting the n − 1 multiplications),
// `hot` = hops in the wrong colour (a list that is not geometric), `ring` = glow rings on value cells, `idxK` = the
// term numbers glow, `dimA` = the difference row fades. Throws BlockError when a value or a label would not fit.
// Could move to the kit next to SeqStrip as one "sequence strip" with a + or × mode.
import { type Box, box, clamp, type Pt } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type Q, div, hopT, qT, sub } from './geo';

const NAME = 'GeoStrip';
export type GStripStep = 'card' | 'vals' | 'hops' | 'adds' | 'reveal';
export interface GStripParams {
  /** the indices shown, ascending; a jump of more than 1 gets a '…' column */
  ns: readonly number[];
  /** the values (null = a hidden '?') */
  vals: readonly (Q | null)[];
  /** values a hidden cell shows on 'reveal' (same length; null = stays hidden) */
  reveal?: readonly (Q | null)[];
  /** row names (default aₙ and n) */
  name?: string; idx?: string;
  /** a trailing '…' column */
  ell?: boolean;
  /** draw the ×r arcs (default true) */
  hops?: boolean;
  /** draw a second row of +d arcs (the differences) */
  adds?: boolean;
  /** the hop label where a neighbour is hidden (the stated ratio) */
  r?: Q;
  /** decimals instead of fractions where they terminate (0.8, 51.2) */
  dec?: boolean;
}
export interface GStripFocus {
  lit?: number; hot?: readonly number[];
  ring?: readonly number[]; ringCol?: Paint; ringK?: number;
  idxK?: number; dimA?: number;
}
export interface GStripBlock {
  readonly kind: 'GeoStrip';
  readonly box: Box;
  /** 'val.i' / 'idx.i' (column i of ns), 'hop.i' / 'add.i' (the label after column i), 'card' */
  where(key: string): Box;
  draw(c: Canvas, p: Progress<GStripStep>, f?: GStripFocus): void;
}

const NUM = 60, LAB = 50, HEAD = 52;
/** the height a strip needs */
export const gstripH = (hops = true, adds = false) => 62 + 104 + (hops ? 120 : 0) + (adds ? 112 : 0) + (hops || adds ? 46 : 62);

export function GeoStrip(p: GStripParams, fr: Frame, th: Theme): GStripBlock {
  const ns = p.ns, n = ns.length;
  check(n >= 2 && p.vals.length === n, NAME, 'at least two columns, one value per index');
  for (let i = 1; i < n; i++) check(ns[i]! > ns[i - 1]!, NAME, 'indices ascend');
  const name = p.name ?? 'aₙ', idx = p.idx ?? 'n', withH = p.hops ?? true, withA = p.adds ?? false, dec = p.dec ?? false;
  type Col = { kind: 'v'; i: number } | { kind: 'gap' };
  const cols: Col[] = [];
  for (let i = 0; i < n; i++) { if (i > 0 && ns[i]! - ns[i - 1]! > 1) cols.push({ kind: 'gap' }); cols.push({ kind: 'v', i }); }
  if (p.ell) cols.push({ kind: 'gap' });
  const headW = Math.max(wordsBox(name, 0, 0, { size: HEAD, weight: 650 }).w, wordsBox(idx, 0, 0, { size: HEAD }).w) + 54;
  const x0 = fr.x, x1 = fr.x + fr.w, cx0 = x0 + headW, colW = (x1 - 18 - cx0) / cols.length;
  const yI = fr.y + 62, yV = yI + 104;
  const hopArcY = yV + 50, yH = yV + 120;
  const addArcY = (withH ? yH : yV) + 46, yA = (withH ? yH : yV) + 112;
  const cardB = box(x0, fr.y, x1, fr.y + gstripH(withH, withA));
  check(cardB.y1 <= fr.y + fr.h + 1, NAME, 'the strip is taller than its frame');
  const colX = (j: number) => cx0 + colW * (j + 0.5);
  const colOf = (i: number) => cols.findIndex(c => c.kind === 'v' && c.i === i);
  const QM = tex('?') as Formula;
  const VF = p.vals.map(v => (v ? (tex(qT(v, dec)) as Formula) : null));
  const RF = (p.reveal ?? []).map(v => (v ? (tex(qT(v, dec)) as Formula) : null));
  for (const F of [...VF, ...RF]) if (F) check(texWidth(F, NUM) <= colW - 14, NAME, `the value ${F.src ?? ''} does not fit its column (${Math.round(colW)} px)`);
  for (const i of ns) check(wordsBox(String(i), 0, 0, { size: NUM - 6 }).w <= colW - 14, NAME, `the index ${i} does not fit its column`);
  // arcs: between neighbouring indices only; the label from the values, else the stated r
  interface Arc { i: number; a: number; b: number; F: Formula; L: Box }
  const mkArcs = (kind: 'hop' | 'add', y: number): Arc[] => {
    const out: Arc[] = [];
    for (let i = 0; i + 1 < n; i++) {
      if (ns[i + 1]! - ns[i]! !== 1) continue;
      const va = p.vals[i] ?? p.reveal?.[i] ?? null, vb = p.vals[i + 1] ?? p.reveal?.[i + 1] ?? null;
      let t: string | null = null;
      if (kind === 'hop') t = va && vb && va.n !== 0 ? hopT(div(vb, va), dec) : p.r ? hopT(p.r, dec) : null;
      else if (va && vb) { const d = sub(vb, va); t = d.n < 0 ? qT(d, dec) : `+${qT(d, dec)}`; }
      if (!t) continue;
      const F = tex(t) as Formula, a = colX(colOf(i)), b = colX(colOf(i + 1));
      const L = texBox(F, (a + b) / 2, y, { size: LAB, align: 'center' });
      check(L.w <= colW * 1.3, NAME, `the label ${t} is too wide`);
      out.push({ i, a, b, F, L });
    }
    for (let k = 1; k < out.length; k++) check(out[k]!.L.x0 > out[k - 1]!.L.x1 + 8, NAME, 'arc labels collide');
    return out;
  };
  const hops = withH ? mkArcs('hop', yH) : [];
  const adds = withA ? mkArcs('add', yA) : [];

  const col = (cl: Paint) => paint(th, cl, 'fill');
  function glowRing(c: Canvas, B: Box, cl: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = col(cl); g.lineWidth = 5;
    g.shadowColor = col(cl); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(B.x0 - 12, B.y0 - 10, B.w + 24, B.h + 20, 14); g.stroke(); g.restore();
  }
  const arcPts = (a: number, b: number, y: number, dip: number): Pt[] => Array.from({ length: 17 }, (_, s) => { const t = s / 16; return [a + 14 + (b - a - 28) * t, y + dip * Math.sin(Math.PI * t)] as Pt; });
  function arc(c: Canvas, a: number, b: number, y: number, k: number, cl: Paint, seed: number, w = 4, dip = 40): void {
    if (k <= 0) return;
    const P = arcPts(a, b, y, dip), m = Math.max(2, Math.round(P.length * E.inOut(clamp(k))));
    inkLine(c, P.slice(0, m), { col: cl, w, seed, rough: 0.5 });
    if (k > 0.95) { const tip = P[P.length - 1]!; inkLine(c, [[tip[0] - 13, tip[1] - 2], tip, [tip[0] - 4, tip[1] + 12]], { col: cl, w, seed: seed + 1, rough: 0.2 }); }
  }
  const cellBox = (j: number, y: number): Box => { const cx = colX(j); return box(cx - colW / 2 + 6, y - 40, cx + colW / 2 - 6, y + 40); };

  function draw(c: Canvas, P: Progress<GStripStep>, f: GStripFocus = {}): void {
    const kC = P.k('card'), kV = P.k('vals'), kH = P.k('hops'), kA = P.k('adds'), kR = P.k('reveal');
    if (kC <= 0) return;
    withAlpha(c, E.smooth(clamp(kC * 2.5)), () => {
      wash(c, rectPts(cardB.x0, cardB.y0, cardB.w, cardB.h, 18), '#262B57', { seed: 61, rough: 1.3, ink: DUSK.ink, inkW: 3, shade: 0.25 });
      inkLine(c, [[cx0 - 14, fr.y + 22], [cx0 - 14, yV + 52]], { col: DUSK.rule, w: 3, seed: 62 });
      inkLine(c, [[x0 + 18, (yI + yV) / 2], [x1 - 18, (yI + yV) / 2]], { col: DUSK.rule, w: 3, seed: 63 });
    });
    const kh = E.smooth(clamp(kC * 2 - 0.6));
    drawWords(c, idx, x0 + 26, yI, 'dim', kh, { size: HEAD, weight: 600 });
    drawWords(c, name, x0 + 26, yV, 'first', kh, { size: HEAD, weight: 650 });
    if (withH && kH > 0) drawWords(c, '×', x0 + 26, yH, 'second', kh * 0.8 * clamp(kH * 2), { size: HEAD, weight: 650 });
    if (withA && kA > 0) drawWords(c, '+', x0 + 26, yA, 'dim', kA * (1 - 0.6 * (f.dimA ?? 0)), { size: HEAD, weight: 650 });
    const ik = f.idxK ?? 0;
    cols.forEach((cl0, j) => {
      const k = E.smooth(clamp(kC * 2.2 - 0.8 - j * 0.08));
      if (cl0.kind === 'gap') { drawWords(c, '…', colX(j), yI, 'dim', k, { size: NUM, align: 'center' }); return; }
      const t = String(ns[cl0.i]!);
      if (ik > 0) glowRing(c, wordsBox(t, colX(j), yI, { size: NUM - 6, align: 'center' }), 'pick', ik);
      drawWords(c, t, colX(j), yI, ik > 0.5 ? 'pick' : 'dim', k, { size: NUM - 6, align: 'center', weight: 600 });
    });
    if (kV > 0) cols.forEach((cl0, j) => {
      const k = E.smooth(clamp(kV * (cols.length + 1) - j));
      if (cl0.kind === 'gap') { drawWords(c, '…', colX(j), yV, 'dim', k, { size: NUM, align: 'center' }); return; }
      const F = VF[cl0.i] ?? null, RFi = RF[cl0.i] ?? null;
      if (F) texDraw(c, F, colX(j), yV, { size: NUM, align: 'center', col: 'ink', k });
      else if (RFi && kR > 0) {
        texDraw(c, QM, colX(j), yV, { size: NUM, align: 'center', col: 'pick', alpha: k * (1 - E.smooth(clamp(kR * 2))) });
        texDraw(c, RFi, colX(j), yV, { size: NUM, align: 'center', col: 'link', k: E.smooth(clamp(kR * 2 - 0.6)) });
      } else texDraw(c, QM, colX(j), yV, { size: NUM, align: 'center', col: 'pick', alpha: k });
    });
    for (const i of f.ring ?? []) { const j = colOf(i); if (j >= 0) glowRing(c, cellBox(j, yV), f.ringCol ?? 'pick', f.ringK ?? 1); }
    if (kH > 0) hops.forEach((J, q0) => {
      const k = clamp(kH * hops.length - q0 * 0.85);
      const hot = f.hot?.includes(J.i) ?? false, lit = f.lit !== undefined ? clamp(f.lit - q0) : 0;
      const cl: Paint = hot ? 'wrong' : lit > 0.5 ? 'link' : 'second';
      arc(c, J.a, J.b, hopArcY, k, cl, 700 + J.i, lit > 0.5 ? 6 : 4);
      texDraw(c, J.F, J.L.cx, yH, { size: LAB, align: 'center', col: cl, k: E.smooth(clamp(k * 1.6 - 0.4)) });
    });
    if (kA > 0) withAlpha(c, 1 - 0.6 * (f.dimA ?? 0), () => adds.forEach((J, q0) => {
      const k = clamp(kA * adds.length - q0 * 0.85);
      arc(c, J.a, J.b, addArcY, k, 'dim', 800 + J.i, 3, 30);
      texDraw(c, J.F, J.L.cx, yA, { size: LAB - 4, align: 'center', col: 'dim', k: E.smooth(clamp(k * 1.6 - 0.4)) });
    }));
  }
  function where(key: string): Box {
    if (key === 'card') return cardB;
    const [kind, s] = key.split('.'), i = Number(s);
    if (kind === 'hop' || kind === 'add') { const J = (kind === 'hop' ? hops : adds).find(x => x.i === i); check(J, NAME, `no ${kind} after column ${i}`); return J!.L; }
    const j = colOf(i);
    check(j >= 0, NAME, `no column ${i}`);
    return cellBox(j, kind === 'idx' ? yI : yV);
  }
  return { kind: 'GeoStrip', box: cardB, where, draw };
}
