// FactorMat: powers as rows of factor tiles on a fraction mat, the model of integer exponents.
//   top row     the factors you multiply by (a^n, n > 0: n tiles of the base)
//   bottom row  the factors you divide by (a^-n: n tiles of the base under the bar)
//   the 1 tile  every product starts from 1 (dashed, at the left of each row): with no tiles left it IS the value,
//               which is why a^0 = 1 and not 0
//   cancel      a tile on top and the same tile below make base / base = 1: the pair is ringed in lime and fades
//   sort        tiles slide to new slots (regrouping (2 x 5)(2 x 5)(2 x 5) as 2 x 2 x 2 x 5 x 5 x 5)
//   brackets    a group of tiles named by its power (2^3 above three tiles); on top they sit above the row, below it
//               with side 'in' (a product without a bar); on the bottom row they sit under it
// Steps: 'mat' (bar + 1 tiles), t<i> / b<i> (one tile in), 'sort', c<i> (pair i cancels), 'one' (the 1 tile lights
// up as the value), k.<key> (a bracket draws on; k.<key>:dim dims it).
//
// Pure maths in computeMat() (counts the tiles and asserts the value base^(top - bottom) for a single numeric base);
// the block lays out inside a Frame and throws BlockError when it cannot be read (labels >= 44 px, tile digits 64 px,
// brackets that would overlap).
import { type Box, box, clamp, lerp, type Q, rat } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, drawOn } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint, mix } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { qPow } from './expo';

export type Role = 'first' | 'second' | 'link' | 'pick' | 'wrong' | 'ink';
export interface Tile { label: string; col: Role }
export interface Bracket {
  key: string; row: 'top' | 'bottom';
  /** tile slots (0 = the first tile after the 1 tile), inclusive */ from: number; to: number;
  label: string; col: Role;
  /** a top bracket below the row (only without a bar) */ side?: 'out' | 'in';
  /** an empty group (a zero power): a dashed slot with nothing in it */ empty?: boolean;
}
export interface MatParams {
  top: Tile[]; bottom: Tile[];
  /** pairs that cancel: top tile i with bottom tile i, for i < cancel (same label) */ cancel?: number;
  /** the slot each top tile moves to on 'sort' */ sort?: number[];
  brackets?: Bracket[];
  /** draw the bar and the bottom row even with no bottom tiles */ bar?: boolean;
}
export interface MatMaths {
  nTop: number; nBottom: number; cancel: number;
  /** tiles left after cancelling */ leftTop: number; leftBottom: number;
  /** the single numeric base of every tile, or null (variables, mixed bases) */ base: Q | null;
  /** base^(leftTop - leftBottom), exact, when there is one numeric base */ value: Q | null;
  /** the exponent of the single base after cancelling */ exp: number | null;
}
const NAME = 'FactorMat';

/** the number a tile label stands for: '2', '10', '(-3)' (variables and fractions: null) */
export function tileNum(label: string): number | null {
  const m = /^\(?(-?\d+)\)?$/.exec(label.trim());
  return m ? Number(m[1]) : null;
}
/** a conservative width estimate (px) of a tile for a label, used by generators before any TeX is loaded */
export function tileW(label: string): number {
  const vis = label.replace(/\\[a-z]+/g, '').replace(/[{}^_ ]/g, '').length;
  return Math.max(TILE_MIN, Math.ceil(vis * 0.62 * TILE_FONT) + 40);
}
export const TILE_MIN = 100, TILE_H = 116, TILE_FONT = 64, GAP = 50, READ_RESERVE = 360;
/** can the mat be drawn in a frame of width w? (pure: generators only make what the model can draw) */
export function matFits(p: Pick<MatParams, 'top' | 'bottom'>, w = 1800): boolean {
  const all = [...p.top, ...p.bottom];
  const tw = Math.max(TILE_MIN, ...all.map(t => tileW(t.label)));
  const slots = 1 + Math.max(p.top.length, p.bottom.length, 1);
  return slots * (tw + GAP) + 40 + READ_RESERVE <= w && p.top.length <= 8 && p.bottom.length <= 8;
}

export function computeMat(p: MatParams): MatMaths {
  const nTop = p.top.length, nBottom = p.bottom.length, cancel = p.cancel ?? 0;
  check(cancel >= 0 && cancel <= Math.min(nTop, nBottom), NAME, `cannot cancel ${cancel} pairs of ${nTop} over ${nBottom}`);
  for (let i = 0; i < cancel; i++) check(p.top[i]!.label === p.bottom[i]!.label, NAME, `pair ${i}: ${p.top[i]!.label} over ${p.bottom[i]!.label} is not base / base`);
  if (p.sort) {
    check(p.sort.length === nTop, NAME, 'sort needs a slot for every top tile');
    check(new Set(p.sort).size === nTop && p.sort.every(s => s >= 0 && s < nTop), NAME, 'sort must be a permutation of the top slots');
  }
  const labels = new Set([...p.top, ...p.bottom].map(t => t.label));
  const n0 = labels.size === 1 ? tileNum([...labels][0]!) : labels.size === 0 ? 1 : null;
  const leftTop = nTop - cancel, leftBottom = nBottom - cancel;
  let base: Q | null = null, value: Q | null = null, exp: number | null = null;
  if (n0 !== null && n0 !== 0) {
    base = rat(n0); exp = leftTop - leftBottom;
    // count the value tile by tile (asserted, not assumed): multiply the top, divide by the bottom
    let v = rat(1);
    for (const t of p.top) v = rat(v.p * tileNum(t.label)!, v.q);
    for (const t of p.bottom) { const b = tileNum(t.label)!; v = rat(v.p * Math.sign(b), v.q * Math.abs(b)); }
    const want = qPow(base, exp);
    check(v.p === want.p && v.q === want.q, NAME, `tile count ${v.p}/${v.q} does not match ${n0}^${exp}`);
    value = v;
  }
  return { nTop, nBottom, cancel, leftTop, leftBottom, base, value, exp };
}

export interface MatFocus {
  /** a glowing ring around a bracket's tiles (by key) */ ring?: string | null; ringK?: number;
}
export interface MatBlock {
  readonly kind: 'FactorMat';
  readonly maths: MatMaths;
  readonly box: Box;
  readonly where: {
    tile(row: 'top' | 'bottom', i: number, sorted?: boolean): Box;
    slot(row: 'top' | 'bottom', s: number): Box;
    one: Box; bar: number;
    bracket(key: string): Box;
    /** where a readout can start (right of the mat, at the bar's height) */ right: { x: number; y: number };
  };
  draw(c: Canvas, p: Progress<string>, f?: MatFocus): void;
}

export function FactorMat(p: MatParams, fr: Frame, th: Theme): MatBlock {
  const m = computeMat(p);
  const bar = p.bar ?? p.bottom.length > 0;
  const F = new Map<string, Formula>();
  const fOf = (s: string) => { let f = F.get(s); if (!f) { f = tex(s) as Formula; F.set(s, f); } return f; };
  const labels = [...new Set([...p.top, ...p.bottom].map(t => t.label))];
  const measured = labels.map(l => texWidth(fOf(l), TILE_FONT));
  const tw = Math.max(TILE_MIN, ...measured.map(w => Math.ceil(w) + 40));
  const slots = 1 + Math.max(p.top.length, p.bottom.length, 1);
  const SW = tw + GAP;
  check(slots * SW + 40 + READ_RESERVE <= fr.w + 1, NAME, `${slots} slots of ${SW} px do not fit in ${fr.w} px`);
  const X0 = fr.x + 40;
  const cy = fr.y + fr.h / 2;
  const topY = bar ? cy - TILE_H / 2 - 30 : cy, botY = cy + TILE_H / 2 + 30;
  const slotBox = (row: 'top' | 'bottom', s: number): Box => {
    const x = X0 + s * SW, y = row === 'top' ? topY : botY;
    return box(x, y - TILE_H / 2, x + tw, y + TILE_H / 2);
  };
  const one = slotBox('top', 0);
  const lastSlot = Math.max(p.top.length, p.bottom.length, 1);
  const right = { x: slotBox('top', lastSlot).x1 + 56, y: bar ? cy : topY };
  const tileBox = (row: 'top' | 'bottom', i: number, sorted = false) => slotBox(row, 1 + (sorted && row === 'top' && p.sort ? p.sort[i]! : i));

  // brackets: a thin line with end ticks, the label beyond it; overlapping labels throw
  interface BL { b: Bracket; F: Formula; ly: number; lx: number; lineY: number; x0: number; x1: number; lbox: Box; dir: number }
  const LABEL = 56;
  const BR: BL[] = (p.brackets ?? []).map(b => {
    const a = slotBox(b.row, 1 + b.from), z = slotBox(b.row, 1 + b.to);
    const below = b.row === 'bottom' || b.side === 'in';
    check(!(b.side === 'in' && bar), NAME, `bracket ${b.key}: an inside bracket needs a mat without a bar`);
    const dir = below ? 1 : -1;
    const lineY = below ? a.y1 + 28 : a.y0 - 28;
    const Fl = tex(b.label) as Formula;
    const lx = (a.x0 + z.x1) / 2;
    const lbox0 = texBox(Fl, lx, 0, { size: LABEL, align: 'center' });
    const ly = lineY + dir * (12 + lbox0.h / 2);
    const lbox = texBox(Fl, lx, ly, { size: LABEL, align: 'center' });
    return { b, F: Fl, ly, lx, lineY, x0: a.x0 + 6, x1: z.x1 - 6, lbox, dir };
  });
  for (let i = 0; i < BR.length; i++) for (let j = i + 1; j < BR.length; j++) {
    const A = BR[i]!, B = BR[j]!;
    // brackets that show at the same time must not collide (a key starting with "after" replaces the others)
    if (A.b.key.startsWith('after') !== B.b.key.startsWith('after')) continue;
    const hit = A.lbox.x0 < B.lbox.x1 + 16 && B.lbox.x0 < A.lbox.x1 + 16 && A.lbox.y0 < B.lbox.y1 && B.lbox.y0 < A.lbox.y1;
    check(!hit, NAME, `bracket labels ${A.b.label} and ${B.b.label} overlap`);
  }
  for (const L of BR) check(L.lbox.y0 >= fr.y - 30 && L.lbox.y1 <= fr.y + fr.h + 30, NAME, `bracket label ${L.b.label} leaves the frame`);
  const bracketBox = (key: string): Box => { const L = BR.find(x => x.b.key === key); check(L, NAME, `no bracket ${key}`); return L.lbox; };

  const all = [one, slotBox('top', lastSlot), ...(bar ? [slotBox('bottom', lastSlot)] : []), ...BR.map(b => b.lbox)];
  const bounds = box(Math.min(...all.map(b => b.x0)), Math.min(...all.map(b => b.y0)), Math.max(...all.map(b => b.x1)), Math.max(...all.map(b => b.y1)));

  function tileShape(c: Canvas, B: Box, col: Role | 'ghost', label: string, k: number, seed: number, ghostK = 0, lit = 0): void {
    if (k <= 0) return;
    const { g } = c;
    const rise = (1 - E.out(clamp(k))) * 26;
    const P = rectPts(B.x0, B.y0 - rise, B.w, B.h, 16);
    const fillA = clamp(k * 1.6) * (1 - 0.82 * ghostK);
    g.save();
    if (col === 'ghost') {
      // a dashed outline with a dim 1 (or the lit value)
      g.globalAlpha *= clamp(k);
      if (lit > 0) wash(c, P, 'link', { seed, rough: 1.4, alpha: lit, inkW: 2.5 });
      g.save(); g.setLineDash([10, 9]); g.strokeStyle = paint(th, lit > 0.5 ? 'link' : 'faint', 'line'); g.lineWidth = 3;
      g.beginPath(); g.roundRect(B.x0, B.y0 - rise, B.w, B.h, 16); g.stroke(); g.restore();
    } else {
      wash(c, P, col, { seed, rough: 1.6, alpha: fillA, inkW: 2.5 });
      if (ghostK > 0) {
        g.save(); g.globalAlpha *= clamp(ghostK); g.setLineDash([10, 9]); g.strokeStyle = paint(th, 'faint', 'line'); g.lineWidth = 3;
        g.beginPath(); g.roundRect(B.x0, B.y0 - rise, B.w, B.h, 16); g.stroke(); g.restore();
      }
    }
    const f = fOf(label);
    const ink = col === 'ghost' ? (lit > 0.5 ? DUSK.ink : paint(th, 'dim', 'text')) : mix(DUSK.ink, paint(th, 'faint', 'text'), ghostK);
    texDraw(c, f, B.cx, B.cy - rise, { size: TILE_FONT, align: 'center', col: ink as never, alpha: clamp(k * 1.4) * (1 - 0.55 * ghostK) });
    g.restore();
  }
  function times(c: Canvas, a: Box, k: number): void {
    if (k <= 0) return;
    texDraw(c, fOf('\\times'), a.x1 + GAP / 2, a.cy, { size: 46, align: 'center', col: 'dim', alpha: clamp(k) });
  }
  function drawBracket(c: Canvas, L: BL, k: number, dim = 0): void {
    if (k <= 0) return;
    c.g.save(); c.g.globalAlpha *= 1 - 0.7 * clamp(dim);
    const t = 11 * L.dir;
    if (L.b.empty) {
      const B = slotBox(L.b.row, 1 + L.b.from);
      c.g.save(); c.g.globalAlpha *= clamp(k); c.g.setLineDash([8, 10]); c.g.strokeStyle = paint(th, L.b.col, 'line'); c.g.lineWidth = 3;
      c.g.beginPath(); c.g.roundRect(B.x0 + 10, B.y0 + 10, B.w - 20, B.h - 20, 14); c.g.stroke(); c.g.restore();
    }
    // the end ticks point back at the tiles, so the label side of the bracket is one clean line
    drawOn(c, [[L.x0, L.lineY - t], [L.x0, L.lineY], [L.x1, L.lineY], [L.x1, L.lineY - t]], E.inOut(clamp(k * 1.3)), { col: L.b.col, lw: 4 });
    texDraw(c, L.F, L.lx, L.ly, { size: LABEL, align: 'center', col: L.b.col, k: clamp((k - 0.3) / 0.7) });
    c.g.restore();
  }

  return {
    kind: 'FactorMat', maths: m, box: bounds,
    where: { tile: tileBox, slot: slotBox, one, bar: cy, bracket: bracketBox, right },
    draw(c, pr, f) {
      const km = pr.k('mat');
      const ks = p.sort ? E.inOut(pr.k('sort')) : 0;
      const kOne = pr.k('one');
      // the bar and the 1 tiles
      if (km > 0) {
        if (bar) {
          const xa = one.x0 - 14, xb = slotBox('top', lastSlot).x1 + 14;
          inkLine(c, [[xa, cy], [lerp(xa, xb, E.inOut(km)), cy]], { col: paint(th, 'ink', 'line'), w: 5, seed: 31, rough: 0.6 });
        }
        tileShape(c, one, 'ghost', '1', km, 3, 0, kOne);
        if (bar) tileShape(c, slotBox('bottom', 0), 'ghost', '1', km, 4);
      }
      // cancelled pairs: a lime ring round the pair, then both tiles fade to ghosts
      const ghost = (row: 'top' | 'bottom', i: number) => (i < m.cancel ? clamp((pr.k(`c${i}`) - 0.45) / 0.55) : 0);
      // tiles (top may slide on 'sort'; a tile moving left lifts so it never passes through another)
      p.top.forEach((t, i) => {
        const a = tileBox('top', i), b = tileBox('top', i, true);
        const dx = lerp(a.x0, b.x0, ks) - a.x0, lift = b.x0 < a.x0 ? Math.sin(Math.PI * ks) * (TILE_H + 24) : 0;
        const B = box(a.x0 + dx, a.y0 - lift, a.x1 + dx, a.y1 - lift);
        tileShape(c, B, t.col, t.label, pr.k(`t${i}`), 100 + i, ghost('top', i));
      });
      p.bottom.forEach((t, i) => tileShape(c, tileBox('bottom', i), t.col, t.label, pr.k(`b${i}`), 200 + i, ghost('bottom', i)));
      // the multiplication signs between neighbouring slots (only while the tiles stand still)
      if (km > 0 && (ks <= 0.02 || ks >= 0.98)) {
        for (let s = 0; s < p.top.length; s++) times(c, slotBox('top', s), Math.min(km, pr.k(`t${s}`) * 1.0));
        if (bar) for (let s = 0; s < p.bottom.length; s++) times(c, slotBox('bottom', s), Math.min(km, pr.k(`b${s}`)));
      }
      // an empty group (a zero power) still stands in the product: a sign before its dashed slot
      for (const L of BR) if (L.b.empty && ks <= 0.02) times(c, slotBox(L.b.row, L.b.from), Math.min(km, pr.k(`k.${L.b.key}`)));
      for (let i = 0; i < m.cancel; i++) {
        const k = pr.k(`c${i}`);
        if (k <= 0) continue;
        const a = tileBox('top', i), b = tileBox('bottom', i);
        const R = box(a.x0 - 10, a.y0 - 10, b.x1 + 10, b.y1 + 10);
        const P = rectPts(R.x0, R.y0, R.w, R.h, 22);
        c.g.save(); c.g.globalAlpha *= 1 - 0.6 * clamp((k - 0.6) / 0.4);
        drawOn(c, [...P, P[0]!], E.inOut(clamp(k / 0.5)), { col: 'link', lw: 4.5 });
        c.g.restore();
      }
      for (const L of BR) drawBracket(c, L, pr.k(`k.${L.b.key}`), pr.k(`k.${L.b.key}:dim`));
      if (f?.ring && (f.ringK ?? 0) > 0) {
        const L = BR.find(x => x.b.key === f.ring);
        if (L) {
          const a = slotBox(L.b.row, 1 + L.b.from), z = slotBox(L.b.row, 1 + L.b.to);
          c.g.save(); c.g.globalAlpha *= clamp(f.ringK ?? 0); c.g.strokeStyle = paint(th, L.b.col, 'fill'); c.g.lineWidth = 5;
          c.g.shadowColor = paint(th, L.b.col, 'fill'); c.g.shadowBlur = 12;
          c.g.beginPath(); c.g.roundRect(a.x0 - 14, a.y0 - 14, z.x1 - a.x0 + 28, a.h + 28, 22); c.g.stroke(); c.g.restore();
        }
      }
    },
  };
}
