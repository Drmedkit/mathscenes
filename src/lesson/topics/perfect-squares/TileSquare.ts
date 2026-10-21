// TileSquare: the area model of a square root. n unit tiles (the area, amber) are laid out as a square of side k
// (the side, lime): k x k = n, so sqrt(n) = k. A number that is not a perfect square fills a k x k square and then a
// few extra tiles (lavender) that cannot finish the next square (the dashed (k+1) outline).
//   slab    the square as one painted slab, only its area known (the question: "side = ?")
//   tiles   the unit tiles appear row by row (over the slab)
//   morph   tiles laid out as a rectangle (rect) slide into the square layout: the same tiles, a square after all
//   area    the area label under the square ("64 sq ft")
//   side    a lime bracket over the top edge and the side label; with words.ask it first reads "side = ?"
//   count   the tiles along the top edge get a lime ring, one after another (counting a side)
//   reveal  the asked side label turns into the side ("? " -> "8 ft")
//   rows    a teal sweep counts the rows, the rows label ("8 rows") on the left
//   extra   the tiles past the k x k square light up (non-squares)
//   ghost   a dashed square of another side (a claimed side, or the next square) and its label
// Pure maths in computeTiles(); the block lays out inside a Frame and throws BlockError when it cannot be read.
import { type Box, box, clamp, lerp, unionBox, hash } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, mix, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';

export type TileStep = 'slab' | 'tiles' | 'area' | 'morph' | 'side' | 'count' | 'reveal' | 'rows' | 'extra' | 'ghost';
export const TILE_STEPS: readonly TileStep[] = ['slab', 'tiles', 'area', 'morph', 'side', 'count', 'reveal', 'rows', 'extra', 'ghost'];

export interface TileParams {
  /** the number of unit tiles = the area in square units (1..225) */
  n: number;
  /** start laid out as [rows, cols] (rows x cols = n); the 'morph' step moves the tiles into the square layout */
  rect?: [number, number];
  /** a dashed square of this side (in tiles) from the top-left corner: a claimed side, or the next square */
  ghost?: number;
  /** labels (plain words); defaults: area "n tiles", side "k", rows "k rows" */
  words?: { area?: string; side?: string; rows?: string; ghost?: string; ask?: string };
}
export interface TileMaths {
  n: number;
  /** the whole-number side of the biggest square that fits: k x k <= n < (k+1) x (k+1) */
  k: number;
  perfect: boolean;
  /** tiles past the k x k square */
  extra: number;
  /** (k+1)^2, the next perfect square */
  next: number;
  rect: [number, number] | null;
}
const NAME = 'TileSquare';

/** the integer square root, by counting up (no floating point) */
export function isqrt(n: number): number { let k = 0; while ((k + 1) * (k + 1) <= n) k++; return k; }
export const isSquare = (n: number) => Number.isInteger(n) && n >= 0 && isqrt(n) ** 2 === n;

export function computeTiles(p: Pick<TileParams, 'n' | 'rect' | 'ghost'>): TileMaths {
  const { n } = p;
  check(Number.isInteger(n) && n >= 1 && n <= 225, NAME, `n = ${n}: the model draws 1 to 225 tiles`);
  const k = isqrt(n);
  check(k * k <= n && n < (k + 1) * (k + 1), NAME, 'integer square root broken');
  const perfect = k * k === n;
  if (p.rect) {
    const [r, c] = p.rect;
    check(Number.isInteger(r) && Number.isInteger(c) && r >= 1 && c >= 1, NAME, 'rect sides must be whole numbers');
    check(r * c === n, NAME, `a ${r} x ${c} rectangle has ${r * c} tiles, not ${n}`);
  }
  if (p.ghost !== undefined) check(Number.isInteger(p.ghost) && p.ghost >= 1 && p.ghost <= 18, NAME, `ghost side ${p.ghost} must be 1 to 18`);
  // every tile has exactly one place in the square layout (asserted)
  const seen = new Set<string>();
  for (let i = 0; i < n; i++) { const [r, c] = squareSlot(i, k); seen.add(`${r},${c}`); }
  check(seen.size === n, NAME, 'two tiles share a place');
  return { n, k, perfect, extra: n - k * k, next: (k + 1) * (k + 1), rect: p.rect ?? null };
}
/** tile i in the square layout: the k x k square row by row, then down the next column, then along the next row */
function squareSlot(i: number, k: number): [number, number] {
  if (i < k * k) return [Math.floor(i / k), i % k];
  const j = i - k * k;
  return j < k ? [j, k] : [k, j - k];
}

export interface TileFocus {
  /** label pulses 0..1 (a symbol on the board and its label light up together) */
  area?: number; side?: number; rows?: number; ghost?: number;
  /** dim everything but the labels (0..1) */
  dim?: number;
}
export interface TileBlock {
  readonly kind: 'TileSquare';
  readonly maths: TileMaths;
  readonly steps: readonly TileStep[];
  readonly box: Box;
  readonly cell: number;
  readonly where: {
    /** the k x k square */ square: Box; tile(r: number, c: number): Box; row(r: number): Box;
    extra: Box | null; ghost: Box | null; occupied: Box;
    sideLabel: Box; rowsLabel: Box; areaLabel: Box; ghostLabel: Box | null;
    /** the side bracket over the top edge (a leader target) */ sideBracket: Box;
  };
  draw(c: Canvas, p: Progress<TileStep>, f?: TileFocus): void;
}

const LEFT = 250, TOP = 150, BOTTOM = 120, MAXSIDE = 660;

export function TileSquare(p: TileParams, fr: Frame, th: Theme): TileBlock {
  const m = computeTiles(p);
  const { n, k } = m;
  const sq = m.perfect ? k : k + 1;                       // the square layout's extent in tiles
  const g = p.ghost ?? 0;
  const spanW = Math.max(sq, g, m.rect ? m.rect[1] : 0), spanH = Math.max(sq, g, m.rect ? m.rect[0] : 0);
  const availW = fr.w - LEFT - 20, availH = fr.h - TOP - BOTTOM;
  const cell = Math.min(MAXSIDE / spanW, MAXSIDE / spanH, availW / spanW, availH / spanH, 150);
  check(cell >= 36, NAME, `tiles of ${Math.round(cell)} px are too small to see`);
  const x0 = fr.x + LEFT + (availW - spanW * cell) / 2, y0 = fr.y + TOP + (availH - spanH * cell) / 2;
  const tile = (r: number, c: number): Box => box(x0 + c * cell, y0 + r * cell, x0 + (c + 1) * cell, y0 + (r + 1) * cell);
  const square = box(x0, y0, x0 + k * cell, y0 + k * cell);
  const row = (r: number) => box(x0, y0 + r * cell, x0 + k * cell, y0 + (r + 1) * cell);
  const extraBox = m.extra ? unionBox(Array.from({ length: m.extra }, (_, j) => { const [r, c] = squareSlot(k * k + j, k); return tile(r, c); })) : null;
  const ghostBox = g ? box(x0, y0, x0 + g * cell, y0 + g * cell) : null;
  const occupied = box(x0, y0, x0 + spanW * cell, y0 + spanH * cell);
  const words = p.words ?? {};
  // labels: the side over the top edge, the rows on the left, the area under everything
  const sideText = words.side ?? String(k), rowsText = words.rows ?? `${k} rows`, areaText = words.area ?? `${n} tiles`;
  const sideY = y0 - 80, rowsX = x0 - 50, areaY = occupied.y1 + 66;
  const sideL = wordsBox(sideText, square.cx, sideY, { size: 56, align: 'center' });
  const rowsL = wordsBox(rowsText, rowsX, square.cy, { size: 50, align: 'right' });
  // with a bigger ghost the area label moves left of the tiles, so it is not read as the ghost's area
  const areaLeft = g > sq;
  const areaL = areaLeft ? wordsBox(areaText, rowsX, square.cy, { size: 54, align: 'right' }) : wordsBox(areaText, occupied.cx, areaY, { size: 54, align: 'center' });
  check(!areaLeft || areaL.x0 >= fr.x - 4, NAME, `the label "${areaText}" does not fit left of the square`);
  // the ghost's label sits in the empty band under the tiles, inside the ghost (only when the ghost is bigger)
  // (no label when it would not fit in that band: the dashed square still reads)
  let ghostText = g > sq ? words.ghost ?? `${g * g} tiles` : '';
  let ghostL = ghostBox && ghostText ? wordsBox(ghostText, x0 + (g * cell) / 2, y0 + ((sq + g) / 2) * cell, { size: 50, align: 'center' }) : null;
  if (ghostL && !(ghostL.w + 40 < g * cell && ghostL.h + 16 < (g - sq) * cell)) { ghostText = ''; ghostL = null; }
  check(rowsL.x0 >= fr.x - 4, NAME, `the label "${rowsText}" does not fit left of the square`);
  check(sideL.y0 >= fr.y - 4, NAME, 'the side label does not fit above the square');
  if (words.ask) check(wordsBox(words.ask, square.cx, sideY, { size: 56, align: 'center' }).x1 <= fr.x + fr.w + 200, NAME, 'the asked side label runs off');
  check(areaL.y1 <= fr.y + fr.h + 30, NAME, 'the area label does not fit under the square');
  const sideBracket = box(square.x0, y0 - 34, square.x1, y0 - 14);

  const rectSlot = (i: number): [number, number] => { const cols = m.rect![1]; return [Math.floor(i / cols), i % cols]; };

  function pulse(c: Canvas, B: Box, col: Paint, kk: number): void {
    if (kk <= 0) return;
    const { g: G } = c;
    G.save(); G.globalAlpha *= clamp(kk) * 0.22; G.fillStyle = paint(th, col, 'fill');
    G.beginPath(); G.roundRect(B.x0 - 16, B.y0 - 10, B.w + 32, B.h + 20, 14); G.fill(); G.restore();
    G.save(); G.globalAlpha *= clamp(kk); G.strokeStyle = paint(th, col, 'fill'); G.lineWidth = 4;
    G.beginPath(); G.roundRect(B.x0 - 16, B.y0 - 10, B.w + 32, B.h + 20, 14); G.stroke(); G.restore();
  }
  const amber = paint(th, 'first', 'fill');

  function draw(c: Canvas, P: Progress<TileStep>, f: TileFocus = {}): void {
    const kS = P.k('slab'), kT = P.k('tiles'), kM = P.k('morph'), kSide = P.k('side'), kR = P.k('rows'), kX = P.k('extra'), kG = P.k('ghost');
    const dim = clamp(f.dim ?? 0);
    const { g: G } = c;
    // the slab: the square as one painted surface (only its area is known)
    if (kS > 0 && m.perfect) {
      withAlpha(c, E.smooth(kS) * (1 - 0.85 * E.smooth(kT)), () => {
        G.save(); G.translate(0, (1 - E.smooth(kS)) * 20);
        wash(c, rectPts(square.x0 - 6, square.y0 - 6, square.w + 12, square.h + 12, 10), 'first', { seed: 31, ink: DUSK.ink, inkW: 3.5, shade: 0.3, rough: 1.8 });
        G.restore();
      });
    }
    // the tiles
    if (kT > 0) {
      const gap = Math.max(2.5, cell * 0.06), rad = Math.min(8, cell * 0.14);
      for (let i = 0; i < n; i++) {
        const [sr, sc] = squareSlot(i, k);
        let r = sr, cc = sc;
        if (m.rect) {
          const [rr, rc] = rectSlot(i);
          // each tile starts its slide a little after the one before (a calm ripple)
          const km = E.smooth(clamp(kM * 1.6 - (i / n) * 0.6));
          r = lerp(rr, sr, km); cc = lerp(rc, sc, km);
        }
        const rowsTotal = m.rect && kM < 0.5 ? m.rect[0] : sq;
        const appear = E.smooth(clamp(kT * 1.5 - (Math.floor(i / Math.max(1, m.rect ? m.rect[1] : k)) / Math.max(1, rowsTotal)) * 0.5));
        if (appear <= 0) continue;
        const x = x0 + cc * cell + gap / 2, y = y0 + r * cell + gap / 2 - (1 - appear) * 14, s = cell - gap;
        const isExtra = i >= k * k;
        const v = hash(i, 7) - 0.5;
        let col = mix(amber, v > 0 ? '#FFFFFF' : DUSK.ink, Math.abs(v) * 0.18);
        if (isExtra && kX > 0) col = mix(col, paint(th, 'pick', 'fill'), E.smooth(kX) * 0.85);
        G.save(); G.globalAlpha *= appear * (1 - dim * 0.5);
        G.fillStyle = col; G.beginPath(); G.roundRect(x, y, s, s, rad); G.fill();
        // a soft light along the top edge of each tile
        const lg = G.createLinearGradient(x, y, x, y + s);
        lg.addColorStop(0, 'rgba(255,255,255,0.20)'); lg.addColorStop(0.5, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(34,27,46,0.18)');
        G.fillStyle = lg; G.beginPath(); G.roundRect(x, y, s, s, rad); G.fill();
        G.strokeStyle = 'rgba(34,27,46,0.75)'; G.lineWidth = 1.6; G.beginPath(); G.roundRect(x, y, s, s, rad); G.stroke();
        G.restore();
      }
    }
    // the row sweep: a teal band runs down the rows, each row keeps a faint tint
    if (kR > 0) for (let r = 0; r < k; r++) {
      const t = kR * (k + 1.5) - r;
      if (t <= 0) continue;
      const a = t < 1 ? Math.sin(Math.PI * Math.min(1, t) * 0.5) : Math.max(0.16, 1 - (t - 1) * 0.6);
      const R = row(r);
      withAlpha(c, a * 0.55, () => { G.save(); G.fillStyle = paint(th, 'second', 'fill'); G.beginPath(); G.roundRect(R.x0 + 2, R.y0 + 2, R.w - 4, R.h - 4, 6); G.fill(); G.restore(); });
    }
    // the dashed ghost square
    if (kG > 0 && ghostBox) {
      // the next square (a non-square cannot finish it) is calm; a claimed side that is wrong is red
      const col: Paint = !m.perfect && g === k + 1 ? 'dim' : 'wrong';
      G.save(); G.globalAlpha *= E.smooth(kG);
      G.setLineDash([16, 12]); G.strokeStyle = paint(th, col, 'fill'); G.lineWidth = 5;
      G.beginPath(); G.roundRect(ghostBox.x0 - 4, ghostBox.y0 - 4, ghostBox.w + 8, ghostBox.h + 8, 10); G.stroke();
      G.restore();
      pulse(c, ghostL ?? ghostBox, col, f.ghost ?? 0);
      if (ghostL) drawWords(c, ghostText, ghostL.cx, ghostL.cy, col, kG, { size: 50, align: 'center' });
    }
    // labels and their brackets
    // the area label under the tiles: centred on the rectangle, then on the square as the tiles slide (morph), and
    // just under what is drawn now (the rectangle, the square, or the dashed square once it is shown)
    const areaX = areaLeft ? rowsX : m.rect ? lerp(x0 + (m.rect[1] * cell) / 2, x0 + (sq * cell) / 2, E.smooth(kM)) : areaL.cx;
    const sqRows = k + (m.extra > k ? 1 : 0);
    const rowsNow = Math.max(m.rect ? lerp(m.rect[0], sqRows, E.smooth(kM)) : sqRows, g ? lerp(sqRows, g, E.smooth(kG)) : 0);
    const areaYNow = areaLeft ? square.cy : Math.min(areaY, y0 + rowsNow * cell + 66);
    const areaAlign = areaLeft ? 'right' as const : 'center' as const;
    pulse(c, wordsBox(areaText, areaX, areaYNow, { size: 54, align: areaAlign }), 'first', f.area ?? 0);
    pulse(c, sideL, 'link', f.side ?? 0);
    pulse(c, rowsL, 'second', f.rows ?? 0);
    drawWords(c, areaText, areaX, areaYNow, 'first', P.k('area'), { size: 54, align: areaAlign });
    // counting a side: the top-edge tiles ringed one after another
    const kC = P.k('count');
    if (kC > 0) for (let cc = 0; cc < k; cc++) {
      const t = clamp(kC * (k + 0.6) - cc);
      if (t <= 0) continue;
      const B = tile(0, cc);
      G.save(); G.globalAlpha *= E.smooth(t); G.strokeStyle = paint(th, 'link', 'fill'); G.lineWidth = 4.5;
      G.beginPath(); G.roundRect(B.x0 + 4, B.y0 + 4, B.w - 8, B.h - 8, 7); G.stroke(); G.restore();
    }
    if (kSide > 0) {
      const y = sideBracket.cy, a = E.smooth(kSide);
      const kRev = words.ask ? E.smooth(P.k('reveal')) : 1;
      inkLine(c, [[square.x0 + 4, y + 12], [square.x0 + 4, y], [square.x1 - 4, y], [square.x1 - 4, y + 12]], { col: kRev > 0.5 ? 'link' : 'dim', w: 4, seed: 501, alpha: a });
      if (words.ask) drawWords(c, words.ask, square.cx, sideY, 'dim', kSide * (1 - kRev), { size: 56, align: 'center' });
      drawWords(c, sideText, square.cx, sideY, 'link', kSide * kRev, { size: 56, align: 'center' });
    }
    if (kR > 0) {
      const x = x0 - 24, a = E.smooth(clamp(kR * 2));
      inkLine(c, [[x + 12, square.y0 + 4], [x, square.y0 + 4], [x, square.y1 - 4], [x + 12, square.y1 - 4]], { col: 'second', w: 4, seed: 502, alpha: a });
      drawWords(c, rowsText, rowsX, square.cy, 'second', a, { size: 50, align: 'right' });
    }
  }

  return {
    kind: 'TileSquare', maths: m, steps: TILE_STEPS, cell,
    box: unionBox([occupied, sideL, rowsL, areaL]),
    where: { square, tile, row, extra: extraBox, ghost: ghostBox, occupied, sideLabel: sideL, rowsLabel: rowsL, areaLabel: areaL, ghostLabel: ghostL, sideBracket },
    draw,
  };
}
