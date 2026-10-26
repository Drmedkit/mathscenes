// SeqStrip: an arithmetic sequence as an indexed table strip, the model of "a sequence is a function on the whole
// numbers n: term number n above, term value a_n below, and the same jump d from each term to the next".
//   card     the card, the row names (n, a_n) and the index row
//   vals     the values write in, one column after another ('?' for a hidden value)
//   jumps    an arc under every pair of neighbouring terms with its change (+3, −4, +0.5), one after another
//   reveal   hidden values appear (link colour) — the replay after a miss, never before the answer
// A gap in the indices (1, 2, 3, then 40) gets a '…' column; `ell` adds a trailing '…'. Focus: `lit` = how many
// jumps glow (counting the n − 1 jumps), `hot` = jumps in the wrong colour (a list that is not arithmetic), `ring` =
// glow rings on value cells. Layout inside a Frame (top aligned); throws BlockError when a value or a jump label would
// not fit its column. Numbers 60 px, labels >= 46 px.
import { type Box, type Pt, box, clamp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { jumpH, nH, r6 } from './seq';

const NAME = 'SeqStrip';
export type StripStep = 'card' | 'vals' | 'jumps' | 'reveal';
export interface StripParams {
  /** the indices shown, ascending; a jump of more than 1 gets a '…' column */
  ns: readonly number[];
  /** the values (null = a hidden '?') */
  vals: readonly (number | null)[];
  /** values a hidden cell shows on 'reveal' (same length; null = stays hidden) */
  reveal?: readonly (number | null)[];
  /** the value row's name (default aₙ) and the index row's name (default n) */
  name?: string; idx?: string;
  /** a trailing '…' column (the sequence goes on) */
  ell?: boolean;
  /** draw the jump arcs (default true) */
  jumps?: boolean;
  /** the jump label where a neighbour is hidden (the stated common difference) */
  d?: number;
}
export interface StripFocus {
  /** how many jumps glow, from the left (fractional: the next one lights up) */ lit?: number;
  /** jumps drawn in the wrong colour */ hot?: readonly number[];
  /** glow rings on value cells (column index into ns) */ ring?: readonly number[]; ringCol?: Paint; ringK?: number;
  /** jumps that are not hot fade (0..1) */ dimJ?: number;
  /** index cells glow (term numbers, 0..1) */ idxK?: number;
}
export interface StripBlock {
  readonly kind: 'SeqStrip';
  readonly box: Box;
  /** 'val.i' / 'idx.i' (column i of ns), 'jump.i' (jump label after column i), 'card' */
  where(key: string): Box;
  draw(c: Canvas, p: Progress<StripStep>, f?: StripFocus): void;
}

const NUM = 60, LAB = 48;
export function SeqStrip(p: StripParams, fr: Frame, th: Theme): StripBlock {
  const ns = p.ns, n = ns.length;
  check(n >= 2 && p.vals.length === n, NAME, 'at least two columns, one value per index');
  for (let i = 1; i < n; i++) check(ns[i]! > ns[i - 1]!, NAME, 'indices ascend');
  const name = p.name ?? 'aₙ', idx = p.idx ?? 'n', withJ = p.jumps ?? true;
  // columns: one per index, a '…' column in every gap, an optional trailing '…'
  type Col = { kind: 'v'; i: number } | { kind: 'gap' };
  const cols: Col[] = [];
  for (let i = 0; i < n; i++) { if (i > 0 && ns[i]! - ns[i - 1]! > 1) cols.push({ kind: 'gap' }); cols.push({ kind: 'v', i }); }
  if (p.ell) cols.push({ kind: 'gap' });
  const headW = Math.max(wordsBox(name, 0, 0, { size: LAB + 4, weight: 650 }).w, wordsBox(idx, 0, 0, { size: LAB + 4 }).w) + 54;
  const x0 = fr.x, x1 = fr.x + fr.w, cx0 = x0 + headW, colW = (x1 - 18 - cx0) / cols.length;
  const yI = fr.y + 62, yV = yI + 104;
  const jumpY = yV + 46, arcDip = 42, yJ = yV + 120;
  const cardB = box(x0, fr.y, x1, (withJ ? yJ + 46 : yV + 62));
  check(cardB.y1 <= fr.y + fr.h + 1, NAME, 'the strip is taller than its frame');
  const colX = (j: number) => cx0 + colW * (j + 0.5);
  const colOf = (i: number) => cols.findIndex(c => c.kind === 'v' && c.i === i);
  const txt = (v: number | null) => (v === null ? '?' : nH(v));
  for (let i = 0; i < n; i++) {
    for (const v of [p.vals[i] ?? null, p.reveal?.[i] ?? null]) check(wordsBox(txt(v), 0, 0, { size: NUM }).w <= colW - 14, NAME, `the value ${txt(v)} does not fit its column (${Math.round(colW)} px)`);
    check(wordsBox(nH(ns[i]!), 0, 0, { size: NUM - 6 }).w <= colW - 14, NAME, `the index ${ns[i]} does not fit its column`);
  }
  // jumps: between neighbouring indices only; the label is the change (from the values, else the stated d)
  const jumps: { i: number; a: number; b: number; t: string; L: Box }[] = [];
  if (withJ) for (let i = 0; i + 1 < n; i++) {
    if (ns[i + 1]! - ns[i]! !== 1) continue;
    const va = p.vals[i] ?? p.reveal?.[i] ?? null, vb = p.vals[i + 1] ?? p.reveal?.[i + 1] ?? null;
    const dd = va !== null && vb !== null ? r6(vb - va) : p.d;
    if (dd === undefined) continue;
    const a = colX(colOf(i)), b = colX(colOf(i + 1)), t = jumpH(dd);
    const L = wordsBox(t, (a + b) / 2, yJ, { size: LAB, weight: 700, align: 'center' });
    check(L.w <= colW * 1.25, NAME, `the jump label ${t} is too wide`);
    jumps.push({ i, a, b, t, L });
  }
  for (let k = 1; k < jumps.length; k++) check(jumps[k]!.L.x0 > jumps[k - 1]!.L.x1 + 8, NAME, 'jump labels collide');

  // ----- drawing -----
  const col = (cl: Paint) => paint(th, cl, 'fill');
  function glowRing(c: Canvas, B: Box, cl: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = col(cl); g.lineWidth = 5;
    g.shadowColor = col(cl); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(B.x0 - 12, B.y0 - 10, B.w + 24, B.h + 20, 14); g.stroke(); g.restore();
  }
  const arcPts = (a: number, b: number): Pt[] => Array.from({ length: 17 }, (_, s) => { const t = s / 16; return [a + 14 + (b - a - 28) * t, jumpY + arcDip * Math.sin(Math.PI * t)] as Pt; });
  function arc(c: Canvas, a: number, b: number, k: number, cl: Paint, seed: number, w = 4): void {
    if (k <= 0) return;
    const P = arcPts(a, b), m = Math.max(2, Math.round(P.length * E.inOut(clamp(k))));
    inkLine(c, P.slice(0, m), { col: cl, w, seed, rough: 0.5 });
    if (k > 0.95) { const tip = P[P.length - 1]!; inkLine(c, [[tip[0] - 13, tip[1] - 2], tip, [tip[0] - 4, tip[1] + 12]], { col: cl, w, seed: seed + 1, rough: 0.2 }); }
  }
  function cellBox(j: number, y: number): Box { const cx = colX(j); return box(cx - colW / 2 + 6, y - 40, cx + colW / 2 - 6, y + 40); }

  function draw(c: Canvas, P: Progress<StripStep>, f: StripFocus = {}): void {
    const kC = P.k('card'), kV = P.k('vals'), kJ = P.k('jumps'), kR = P.k('reveal');
    if (kC <= 0) return;
    withAlpha(c, E.smooth(clamp(kC * 2.5)), () => {
      wash(c, rectPts(cardB.x0, cardB.y0, cardB.w, cardB.h, 18), '#262B57', { seed: 51, rough: 1.3, ink: DUSK.ink, inkW: 3, shade: 0.25 });
      inkLine(c, [[cx0 - 14, fr.y + 22], [cx0 - 14, (withJ ? yV + 52 : cardB.y1 - 14)]], { col: DUSK.rule, w: 3, seed: 52 });
      inkLine(c, [[x0 + 18, (yI + yV) / 2], [x1 - 18, (yI + yV) / 2]], { col: DUSK.rule, w: 3, seed: 53 });
    });
    const kh = E.smooth(clamp(kC * 2 - 0.6));
    drawWords(c, idx, x0 + 26, yI, 'dim', kh, { size: LAB + 4, weight: 600 });
    drawWords(c, name, x0 + 26, yV, 'first', kh, { size: LAB + 4, weight: 650 });
    const ik = f.idxK ?? 0;
    cols.forEach((cl0, j) => {
      const k = E.smooth(clamp(kC * 2.2 - 0.8 - j * 0.08));
      if (cl0.kind === 'gap') { drawWords(c, '…', colX(j), yI, 'dim', k, { size: NUM, align: 'center' }); return; }
      const t = nH(ns[cl0.i]!);
      if (ik > 0) glowRing(c, wordsBox(t, colX(j), yI, { size: NUM - 6, align: 'center' }), 'pick', ik);
      drawWords(c, t, colX(j), yI, ik > 0.5 ? 'pick' : 'dim', k, { size: NUM - 6, align: 'center', weight: 600 });
    });
    // values
    if (kV > 0) cols.forEach((cl0, j) => {
      const k = E.smooth(clamp(kV * (cols.length + 1) - j));
      if (cl0.kind === 'gap') { drawWords(c, '…', colX(j), yV, 'dim', k, { size: NUM, align: 'center' }); return; }
      const v = p.vals[cl0.i] ?? null, rv = p.reveal?.[cl0.i] ?? null;
      if (v !== null) drawWords(c, nH(v), colX(j), yV, 'ink', k, { size: NUM, align: 'center', weight: 650 });
      else if (rv !== null && kR > 0) {
        drawWords(c, '?', colX(j), yV, 'pick', k * (1 - E.smooth(clamp(kR * 2))), { size: NUM, align: 'center', weight: 700 });
        drawWords(c, nH(rv), colX(j), yV, 'link', E.smooth(clamp(kR * 2 - 0.6)), { size: NUM, align: 'center', weight: 700 });
      } else drawWords(c, '?', colX(j), yV, 'pick', k, { size: NUM, align: 'center', weight: 700 });
    });
    for (const i of f.ring ?? []) { const j = colOf(i); if (j >= 0) glowRing(c, cellBox(j, yV), f.ringCol ?? 'pick', f.ringK ?? 1); }
    // jumps
    if (kJ > 0) jumps.forEach((J, q) => {
      const k = clamp(kJ * jumps.length - q * 0.85);
      const hot = f.hot?.includes(J.i) ?? false;
      const lit = f.lit !== undefined ? clamp(f.lit - q) : 0;
      const cl: Paint = hot ? 'wrong' : lit > 0.5 ? 'link' : 'second';
      withAlpha(c, !hot && f.dimJ ? 1 - 0.6 * f.dimJ : 1, () => {
        arc(c, J.a, J.b, k, cl, 900 + J.i, lit > 0.5 ? 6 : 4);
        drawWords(c, J.t, (J.a + J.b) / 2, yJ, cl, E.smooth(clamp(k * 1.6 - 0.4)), { size: LAB, weight: 700, align: 'center' });
      });
    });
  }
  function where(key: string): Box {
    if (key === 'card') return cardB;
    const [kind, s] = key.split('.'), i = Number(s);
    if (kind === 'jump') { const J = jumps.find(x => x.i === i); check(J, NAME, `no jump after column ${i}`); return J!.L; }
    const j = colOf(i);
    check(j >= 0, NAME, `no column ${i}`);
    return cellBox(j, kind === 'idx' ? yI : yV);
  }
  return { kind: 'SeqStrip', box: cardB, where, draw };
}
/** the height a strip needs (with or without jumps) */
export const stripH = (jumps = true) => (jumps ? 62 + 104 + 120 + 46 : 62 + 104 + 62);
