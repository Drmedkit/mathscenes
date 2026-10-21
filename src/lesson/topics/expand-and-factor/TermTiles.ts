// TermTiles: combining like terms with algebra tiles. The terms of an expression lie in a row in written order
// (x-tiles are tall amber strips, constants small teal squares; a NEGATIVE tile is the same shape, dark, with a drawn
// minus bar). Sorting moves every tile into its own kind's tray (like terms = same variable part), positives above,
// negatives below, so each + / − pair of the same kind lines up; a pair is a zero pair and leaves; what is left is
// counted: 2x + 7 + 3x + 1 → 5x + 8; 4c − c → 3c; x − x → 0.
// Steps: show, sort, cancel, count.  Pure compute (computeTermTiles) checks the count against the exact maths.
import { type Box, box, clamp, lerp, unionBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint, mix } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type Ex, coef, termTex, t } from './expr';

export interface TermTilesParams { terms: Ex; letter?: string }
export type TermStep = 'show' | 'sort' | 'cancel' | 'count';
export const TERM_STEPS: readonly TermStep[] = ['show', 'sort', 'cancel', 'count'];
export interface TermTilesMaths { posX: number; negX: number; posU: number; negU: number; pairsX: number; pairsU: number; x: number; u: number }
const NAME = 'TermTiles';

export function termTilesFit(e: Ex): boolean {
  if (e.length < 1 || e.length > 5) return false;
  let px = 0, nx = 0, pu = 0, nu = 0;
  for (const s of e) {
    if (s.c.q !== 1 || s.c.p === 0 || Math.abs(s.c.p) > 7 || (s.v !== 'x' && s.v !== '')) return false;
    if (s.v === 'x') { if (s.c.p > 0) px += s.c.p; else nx -= s.c.p; } else if (s.c.p > 0) pu += s.c.p; else nu -= s.c.p;
  }
  return Math.max(px, nx) <= 9 && Math.max(pu, nu) <= 12 && px + nx + Math.ceil((pu + nu) / 2) <= 18;
}
export function computeTermTiles(e: Ex): TermTilesMaths {
  check(termTilesFit(e), NAME, 'the tiles draw 1–5 whole-number terms in x and constants, at most 7 tiles a term');
  let posX = 0, negX = 0, posU = 0, negU = 0;
  for (const s of e) for (let i = 0; i < Math.abs(s.c.p); i++) {
    if (s.v === 'x') { if (s.c.p > 0) posX++; else negX++; } else if (s.c.p > 0) posU++; else negU++;
  }
  const m = { posX, negX, posU, negU, pairsX: Math.min(posX, negX), pairsU: Math.min(posU, negU), x: posX - negX, u: posU - negU };
  check(m.x === coef(e, 'x').p && m.u === coef(e, '').p, NAME, 'the tiles left over do not match the combined terms');
  return m;
}

interface Tile { kind: 'x' | 'u'; neg: boolean; term: number; from: Box; to: Box; pair: number | null; idx: number }
export interface TermTilesBlock {
  readonly kind: 'TermTiles';
  readonly maths: TermTilesMaths;
  readonly box: Box;
  readonly where: { term(i: number): Box; label(i: number): Box; trayX: Box; trayU: Box; totalX: Box; totalU: Box };
  draw(c: Canvas, P: Progress<TermStep>, f?: { term?: number | null; k?: number }): void;
}

export function TermTiles(P: TermTilesParams, fr: Frame, th: Theme): TermTilesBlock {
  const m = computeTermTiles(P.terms);
  const L = P.letter ?? 'x';
  const sub = (s: string) => s.replace(/x/g, L);
  const labF = P.terms.map(s => tex(sub(termTex(s))) as Formula);
  const LS = 62;
  // tile size: the written row must fit the frame width
  let s = 84, g = 0, layout: { x: number; w: number; cols: number }[] = [];
  const groupW = (st: { v: string; n: number }, s: number) => { const gg = s * 0.22; if (st.v === 'x') return st.n * s + (st.n - 1) * gg; const cols = Math.ceil(st.n / 2); return cols * s + (cols - 1) * gg; };
  for (; s >= 26; s -= 2) {
    g = s * 0.22;
    let x = 0; layout = [];
    for (const [i, st] of P.terms.entries()) {
      const n = Math.abs(st.c.p), w = groupW({ v: st.v, n }, s), slot = Math.max(w, texWidth(labF[i]!, LS) + 24);
      layout.push({ x: x + (slot - w) / 2, w, cols: st.v === 'x' ? n : Math.ceil(n / 2) });
      x += slot + Math.max(40, s * 0.9);
    }
    if (x - Math.max(40, s * 0.9) <= fr.w - 40) break;
  }
  check(s >= 26, NAME, 'too many tiles for the frame');
  const rowW = layout.length ? layout[layout.length - 1]!.x + layout[layout.length - 1]!.w : 0;
  const ox = fr.x + (fr.w - rowW) / 2, rodH = s * 2.5;
  const rowY = fr.y + 150;          // top of the written row
  const tiles: Tile[] = [];
  // trays (sorted): x on the left, constants on the right; positives on top, negatives underneath
  const trayTop = rowY + rodH + 190;
  const xCols = Math.max(m.posX, m.negX), uCols = Math.max(Math.ceil(m.posU / 2), Math.ceil(m.negU / 2));
  const trayXW = xCols ? xCols * s + (xCols - 1) * g : 0, trayUW = uCols ? uCols * s + (uCols - 1) * g : 0;
  const gapT = 150, totalW = trayXW + (trayXW && trayUW ? gapT : 0) + trayUW;
  const tx0 = fr.x + (fr.w - totalW) / 2, tu0 = tx0 + (trayXW ? trayXW + gapT : 0);
  const negY = (kind: 'x' | 'u') => trayTop + (kind === 'x' ? rodH : 2 * s + g) + 34;
  let iX = 0, nX = 0, iU = 0, nU = 0;
  for (const [ti, st] of P.terms.entries()) {
    const n = Math.abs(st.c.p), Lo = layout[ti]!, neg = st.c.p < 0, kind = st.v === 'x' ? 'x' : 'u';
    for (let k = 0; k < n; k++) {
      let from: Box, to: Box;
      if (kind === 'x') {
        const x = ox + Lo.x + k * (s + g);
        from = box(x, rowY, x + s, rowY + rodH);
        const j = neg ? nX++ : iX++, y = neg ? negY('x') : trayTop, tx = tx0 + j * (s + g);
        to = box(tx, y, tx + s, y + rodH);
        tiles.push({ kind, neg, term: ti, from, to, pair: null, idx: j });
      } else {
        const col = Math.floor(k / 2), r = k % 2, x = ox + Lo.x + col * (s + g), y = rowY + (rodH - (2 * s + g)) / 2 + r * (s + g);
        from = box(x, y, x + s, y + s);
        const j = neg ? nU++ : iU++, yy = (neg ? negY('u') : trayTop) + (j % 2) * (s + g), tx = tu0 + Math.floor(j / 2) * (s + g);
        to = box(tx, yy, tx + s, yy + s);
        tiles.push({ kind, neg, term: ti, from, to, pair: null, idx: j });
      }
    }
  }
  for (const tl of tiles) tl.pair = tl.idx < (tl.kind === 'x' ? m.pairsX : m.pairsU) ? tl.idx : null;
  const bottom = Math.max(negY('x') + (m.negX ? rodH : 0), negY('u') + (m.negU ? 2 * s + g : 0), trayTop + rodH);
  const totY = Math.min(fr.y + fr.h - 50, bottom + 70);
  check(totY - 40 > trayTop + rodH * 0.5, NAME, 'the trays do not fit');
  const labelY = rowY + rodH + 58;
  const labBox = (i: number) => texBox(labF[i]!, ox + layout[i]!.x + layout[i]!.w / 2, labelY, { size: LS, align: 'center' });
  const termBox = (i: number) => unionBox(tiles.filter(tl => tl.term === i).map(tl => tl.from));
  const totF = { x: tex(sub(m.x === 0 ? '0' : termTex(t(m.x, 'x')))) as Formula, u: tex(String(m.u)) as Formula };
  const trayX = box(tx0, trayTop, tx0 + trayXW, bottom), trayU = box(tu0, trayTop, tu0 + trayUW, bottom);
  const totalX = texBox(totF.x, trayX.cx, totY, { size: 76, align: 'center' }), totalU = texBox(totF.u, trayU.cx, totY, { size: 76, align: 'center' });

  function tile(c: Canvas, B: Box, kind: 'x' | 'u', neg: boolean, seed: number): void {
    const role = kind === 'x' ? 'first' : 'second';
    const base = paint(th, role, 'fill');
    if (!neg) { wash(c, rectPts(B.x0, B.y0, B.w, B.h, Math.min(8, s * 0.15)), role, { seed, ink: DUSK.ink, inkW: 2.2, shade: 0.24, rough: 1 }); return; }
    wash(c, rectPts(B.x0, B.y0, B.w, B.h, Math.min(8, s * 0.15)), mix(base, DUSK.navy, 0.62), { seed, ink: null, shade: 0.2, rough: 1 });
    inkLine(c, rectPts(B.x0 + 2, B.y0 + 2, B.w - 4, B.h - 4, Math.min(8, s * 0.15)), { col: role, w: 3, closed: true, seed: seed + 1, rough: 0.6 });
    const w = Math.min(B.w * 0.55, 30);
    inkLine(c, [[B.cx - w / 2, B.cy], [B.cx + w / 2, B.cy]], { col: DUSK.cream, w: 4, seed: seed + 2, rough: 0.3 });
  }
  function draw(c: Canvas, Pr: Progress<TermStep>, f: { term?: number | null; k?: number } = {}): void {
    const kS = Pr.k('show'), kO = Pr.k('sort'), kC = Pr.k('cancel'), kN = Pr.k('count');
    const nT = P.terms.length;
    // trays: two soft dark rests that appear as sorting starts
    if (kO > 0) for (const [T, show] of [[trayX, m.posX + m.negX > 0], [trayU, m.posU + m.negU > 0]] as const) {
      if (!show) continue;
      withAlpha(c, E.smooth(kO) * 0.9, () => wash(c, rectPts(T.x0 - 22, T.y0 - 22, T.w + 44, T.h + 44, 18), '#2B2547', { seed: 5 + Math.round(T.x0), ink: DUSK.ink, inkW: 2.5, shade: 0.3, rough: 1.4 }));
    }
    tiles.forEach((tl, i) => {
      const ks = E.smooth(clamp(kS * (nT + 0.6) - tl.term));
      if (ks <= 0) return;
      const ko = E.inOut(clamp(kO * 1.35 - (i / Math.max(1, tiles.length)) * 0.35));
      const gone = tl.pair !== null ? E.smooth(clamp(kC * 1.4 - 0.4)) : 0;
      const B = ko <= 0 ? tl.from : box(lerp(tl.from.x0, tl.to.x0, ko), lerp(tl.from.y0, tl.to.y0, ko), lerp(tl.from.x1, tl.to.x1, ko), lerp(tl.from.y1, tl.to.y1, ko));
      const focus = f.term !== null && f.term !== undefined && ko <= 0 ? (f.term === tl.term ? 0 : 0.55 * clamp(f.k ?? 1)) : 0;
      withAlpha(c, ks * (1 - 0.88 * gone) * (1 - focus), () => tile(c, box(B.x0, B.y0 + (1 - ks) * -30, B.x1, B.y1 + (1 - ks) * -30), tl.kind, tl.neg, 500 + i * 3));
    });
    // zero pairs: a lavender ring links each + / − pair, then both fade
    const kr = clamp(kC * 2.2) * (1 - clamp(kC * 2 - 1.2));
    if (kr > 0) for (const kind of ['x', 'u'] as const) {
      const pairs = kind === 'x' ? m.pairsX : m.pairsU;
      for (let j = 0; j < pairs; j++) {
        const A = tiles.find(tl => tl.kind === kind && !tl.neg && tl.idx === j)!.to, B = tiles.find(tl => tl.kind === kind && tl.neg && tl.idx === j)!.to;
        const R = unionBox([A, B]);
        c.g.save(); c.g.globalAlpha *= E.smooth(kr); c.g.strokeStyle = paint(th, 'pick', 'fill'); c.g.lineWidth = 4;
        c.g.beginPath(); c.g.roundRect(R.x0 - 8, R.y0 - 8, R.w + 16, R.h + 16, 12); c.g.stroke(); c.g.restore();
      }
    }
    // term labels under the written row
    for (let i = 0; i < nT; i++) {
      const ks = clamp(kS * (nT + 0.6) - i);
      if (ks <= 0) continue;
      const B = labBox(i), role = P.terms[i]!.v === 'x' ? 'first' : 'second';
      const focus = f.term !== null && f.term !== undefined ? (f.term === i ? 0 : 0.55 * clamp(f.k ?? 1)) : 0;
      texDraw(c, labF[i]!, B.cx, labelY, { size: LS, align: 'center', col: role, k: ks, alpha: (1 - clamp(kO * 1.4)) * (1 - focus) });
    }
    // totals under the trays
    if (kN > 0) {
      if (m.posX + m.negX > 0) texDraw(c, totF.x, trayX.cx, totY, { size: 76, align: 'center', col: 'first', k: kN });
      if (m.posU + m.negU > 0) texDraw(c, totF.u, trayU.cx, totY, { size: 76, align: 'center', col: 'second', k: kN });
    }
  }
  return {
    kind: 'TermTiles', maths: m,
    box: unionBox([...tiles.map(tl => tl.from), ...tiles.map(tl => tl.to), ...P.terms.map((_, i) => labBox(i))]),
    where: { term: termBox, label: labBox, trayX, trayU, totalX, totalU },
    draw,
  };
}
