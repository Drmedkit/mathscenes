// AreaGrid: the model block of "scale factor and area". An original figure (amber) and its copy (teal) on grid paper;
// the copy fills with whole copies of the original that fly in from it (one row first: the length's factor; then
// the row is copied up: the width's factor), or, for a figure made of unit squares, every unit square flies over and
// grows into a k-by-k group. Counting the copies IS the area factor.
//   Roles: original / its copies = first (amber), the copy = second (teal), the answer = link (lime), focus = pick.
//   Steps (Progress keys): grid; o (original: outline then wash); oL (its labels); oA (its area); c (the copy's outline,
//          then a light wash); cL; cA; row (row 0 of tiles flies in from the original); rows (the other rows rise
//          from row 0); tiles (all tiles at once, any shape); n (the tile numbers); groups (unit squares -> groups);
//          cG (the copy's inner grid, when the picture hides it until the worked solution).
// Maths and layout are pure (areaMaths.ts); the block throws a BlockError when a rule breaks.
import { type Box, box, clamp, padBox, unionBox, lag } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, drawOn, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint, mix } from '../../../core/theme';
import { type Formula, tex, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { PAPER, PAPER_LINE } from '../scale-factor/ScaleGrid';
import { type AreaLayout, type AreaPic, type Placed, type Pt, layoutArea } from './areaMaths';

const NAME = 'AreaGrid';
export type AreaStep = 'grid' | 'o' | 'oL' | 'oA' | 'c' | 'cL' | 'cA' | 'cG' | 'row' | 'rows' | 'tiles' | 'n' | 'groups';
export type LabelKey = 'ow' | 'oh' | 'cw' | 'ch' | 'oA' | 'cA';
export interface AreaFocus {
  /** a ring around a whole figure */
  ring?: { at: 'o' | 'c'; k: number; col: Paint }[];
  /** a ring around one row of tiles */
  rowRing?: { j: number; k: number; col: Paint }[];
  /** a soft ring around labels (a symbol on the board and its label light up together) */
  pulse?: { at: LabelKey; k: number; col?: Paint }[];
  /** dim the tile numbers / tiles (0..1) */
  dimTiles?: number;
  /** the copy's label text replaced (e.g. '?' -> the answer) */
  swap?: Partial<Record<LabelKey, { t: string; k: number }>>;
}
export interface AreaGridBlock {
  readonly kind: 'AreaGrid';
  readonly pic: AreaPic;
  readonly L: AreaLayout;
  readonly box: Box;
  readonly where: { fig(at: 'o' | 'c'): Box; label(k: LabelKey): Box; row(j: number): Box; grid: Box };
  draw(c: Canvas, p: Progress<string>, f?: AreaFocus): void;
}

const Fcache = new Map<string, Formula>();
const F = (t: string): Formula => { let f = Fcache.get(t); if (!f) { f = tex(t) as Formula; Fcache.set(t, f); } return f; };
const bbox = (Q: readonly Pt[]): Box => box(Math.min(...Q.map(p => p[0])), Math.min(...Q.map(p => p[1])), Math.max(...Q.map(p => p[0])), Math.max(...Q.map(p => p[1])));

export function AreaGrid(pic: AreaPic, fr: Frame, th: Theme): AreaGridBlock {
  const L = layoutArea(pic, fr);
  check(L.why === null, NAME, L.why ?? '');
  const u = L.u, grid = pic.grid ?? true;
  const labelOf = (k: LabelKey): Placed | undefined => (k === 'oA' ? L.area.o : k === 'cA' ? L.area.c : L.labels[k]);
  const where = {
    fig: (at: 'o' | 'c') => bbox(at === 'o' ? L.o : L.c),
    label: (k: LabelKey) => labelOf(k)?.box ?? box(0, 0, 0, 0),
    row: (j: number) => { const T = L.tiles.filter(t => t.j === j); return T.length ? unionBox(T.map(t => bbox(t.pts))) : box(0, 0, 0, 0); },
    grid: L.gridBox,
  };

  function poly(c: Canvas, Q: readonly Pt[]): void { const g = c.g; g.beginPath(); Q.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); }
  /** faint grid lines clipped to a figure, so its squares stay countable through the paint */
  function gridIn(c: Canvas, Q: readonly Pt[], a: number, dark = 0.3): void {
    if (!grid || a <= 0) return;
    const { g } = c, G = L.gridBox;
    g.save(); g.globalAlpha *= a; poly(c, Q); g.clip();
    g.strokeStyle = `rgba(28,20,44,${dark})`; g.lineWidth = 1.6; g.beginPath();
    for (let x = 0; x <= L.cols; x++) { g.moveTo(G.x0 + x * u, G.y0); g.lineTo(G.x0 + x * u, G.y1); }
    for (let y = 0; y <= L.rows; y++) { g.moveTo(G.x0, G.y0 + y * u); g.lineTo(G.x1, G.y0 + y * u); }
    g.stroke(); g.restore();
  }
  function label(c: Canvas, pl: Placed, col: Paint, a: number, pad: string | null): void {
    if (a <= 0) return;
    if (pad) {
      const b = pl.box, g = c.g;
      g.save(); g.globalAlpha *= clamp(a); g.fillStyle = pad;
      g.beginPath(); g.roundRect(b.x0 - 6, b.y0 - 5, b.w + 12, b.h + 10, 10); g.fill(); g.restore();
    }
    texDraw(c, F(pl.t), pl.cx, pl.cy, { size: pl.size, align: 'center', valign: 'center', col, alpha: clamp(a) });
  }
  function ringBox(c: Canvas, b: Box, col: Paint, k: number, r = 14): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.fillStyle = paint(th, col, 'fill'); g.globalAlpha *= 0.14;
    g.beginPath(); g.roundRect(b.x0 - 12, b.y0 - 9, b.w + 24, b.h + 18, r); g.fill();
    g.globalAlpha /= 0.14;
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 4.5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(b.x0 - 12, b.y0 - 9, b.w + 24, b.h + 18, r); g.stroke(); g.restore();
  }
  const edge = (role: Paint) => mix(paint(th, role, 'fill'), DUSK.ink, 0.55);

  /** a figure: the outline draws on (k 0 -> .6), the wash fades in (k .35 -> 1) */
  function figure(c: Canvas, Q: Pt[], role: Paint, k: number, seed: number, washA = 0.92): void {
    if (k <= 0) return;
    const kf = E.inOut(clamp((k - 0.35) / 0.65)), ks = clamp(k / 0.6);
    if (kf > 0) { withAlpha(c, kf * washA, () => wash(c, Q, role, { seed, rough: 1.1, ink: null, shade: 0.22 })); gridIn(c, Q, kf); }
    drawOn(c, [...Q, Q[0]!], ks, { col: edge(role), lw: 4 });
  }
  /** a tile at flight progress t: from its source centre to its place (a turned tile turns half a turn on the way) */
  function tileAt(T: AreaLayout['tiles'][number], t: number, src: Pt): Pt[] {
    const e = E.inOut(clamp(t)), dx = (src[0] - T.at[0]) * (1 - e), dy = (src[1] - T.at[1]) * (1 - e);
    const ang = T.turned ? Math.PI * (1 - e) : 0, cs = Math.cos(ang), sn = Math.sin(ang);
    return T.pts.map(p => { const x = p[0] - T.at[0], y = p[1] - T.at[1]; return [T.at[0] + x * cs - y * sn + dx, T.at[1] + x * sn + y * cs + dy] as Pt; });
  }

  function draw(c: Canvas, P: Progress<string>, fo: AreaFocus = {}): void {
    const kg = P.k('grid');
    if (kg > 0) withAlpha(c, kg, () => {
      const G = L.gridBox;
      wash(c, rectPts(G.x0 - 18, G.y0 - 18, G.w + 36, G.h + 36, 16), PAPER, { seed: 12, rough: 1.2, ink: null, shade: 0.12 });
      if (grid) {
        const { g } = c;
        g.save(); g.strokeStyle = PAPER_LINE; g.lineWidth = 1.6; g.beginPath();
        for (let x = 0; x <= L.cols; x++) { g.moveTo(G.x0 + x * u, G.y0); g.lineTo(G.x0 + x * u, G.y1); }
        for (let y = 0; y <= L.rows; y++) { g.moveTo(G.x0, G.y0 + y * u); g.lineTo(G.x1, G.y0 + y * u); }
        g.stroke(); g.restore();
      }
      inkLine(c, rectPts(G.x0 - 18, G.y0 - 18, G.w + 36, G.h + 36, 16), { col: '#3A3F6B', w: 3, closed: true, seed: 13, rough: 0.8 });
    });
    const smallRole: Paint = L.tileIn === 'o' ? 'second' : 'first';
    const bigRole: Paint = L.tileIn === 'o' ? 'first' : 'second';
    // the original, then the copy (a lighter wash: it is the space the copies fill)
    figure(c, L.o, 'first', P.k('o'), 31, L.tileIn === 'o' ? 0.5 : 0.92);
    const kc = P.k('c');
    if (kc > 0) {
      const kf = E.inOut(clamp((kc - 0.35) / 0.65));
      // hideCopyGrid: the copy's squares stay hidden (an opaque wash, no inner grid) until step 'cG' (no early answer)
      const hide = !!pic.hideCopyGrid, kcg = hide ? P.k('cG') : 1;
      if (kf > 0) { withAlpha(c, kf * (hide ? 0.97 : L.tileIn === 'c' ? 0.5 : 0.92), () => wash(c, L.c, 'second', { seed: 47, rough: 1.1, ink: null, shade: 0.18 })); gridIn(c, L.c, kf * kcg); }
    }
    // tiles fly in
    const kRow = Math.max(P.k('row'), P.k('tiles')), kRows = Math.max(P.k('rows'), P.k('tiles'));
    const nT = L.tiles.length, rows = Math.max(1, ...L.tiles.map(t => t.j + 1));
    const flight = (T: AreaLayout['tiles'][number], idx: number): { t: number; src: Pt } => {
      if (P.k('tiles') > 0 && P.k('row') === 0 && P.k('rows') === 0) return { t: lag(P.k('tiles'), idx, nT, 0.35), src: T.from };
      if (T.row0) return { t: lag(kRows, T.j - 1, rows - 1, 0.45), src: T.row0 };
      const inRow = L.tiles.filter(x => x.j === T.j), i = inRow.indexOf(T);
      return { t: lag(kRow, i, inRow.length, 0.35), src: T.from };
    };
    const dimT = clamp(fo.dimTiles ?? 0);
    const landed: number[] = [];
    L.tiles.forEach((T, idx) => {
      const { t, src } = flight(T, idx);
      landed.push(t);
      if (t <= 0) return;
      const Q = tileAt(T, t, src), a = clamp(t * 3) * (1 - 0.45 * dimT);
      withAlpha(c, a, () => {
        wash(c, Q, smallRole, { seed: 60 + idx * 3, rough: 0.9, ink: null, shade: 0.2, lift: 0.06 });
        gridIn(c, Q, 1, 0.22);
        strokePts(c, [...Q, Q[0]!], { col: edge(smallRole), lw: 3 });
      });
    });
    // unit squares fly over and grow into k-by-k groups
    const kG = P.k('groups');
    L.groups.forEach((G, idx) => {
      const t = E.inOut(lag(kG, idx, L.groups.length, 0.4));
      if (t <= 0) return;
      const Q = G.cell.map((p, i) => [p[0] + (G.sq[i]![0] - p[0]) * t, p[1] + (G.sq[i]![1] - p[1]) * t] as Pt);
      withAlpha(c, clamp(t * 3), () => {
        wash(c, Q, 'first', { seed: 70 + idx * 5, rough: 0.8, ink: null, shade: 0.2, lift: 0.06 });
        gridIn(c, Q, 1, 0.4);
        strokePts(c, [...Q, Q[0]!], { col: edge('first'), lw: 3.5 });
      });
    });
    // the copy's outline on top of its tiles
    if (kc > 0) drawOn(c, [...L.c, L.c[0]!], clamp(kc / 0.6), { col: L.tileIn === 'c' || L.groups.length ? paint(th, 'second', 'line') : edge('second'), lw: L.tileIn === 'c' || L.groups.length ? 6 : 4 });
    if (L.tileIn === 'o' && P.k('o') > 0) drawOn(c, [...L.o, L.o[0]!], clamp(P.k('o') / 0.6), { col: paint(th, 'first', 'line'), lw: 6 });
    void bigRole;
    // tile numbers: each one appears as its tile lands
    const kn = P.k('n');
    if (kn > 0) L.tiles.forEach((T, i) => { if (T.num) label(c, T.num, 'ink', kn * clamp((landed[i]! - 0.8) / 0.2) * (1 - 0.85 * dimT), null); });
    // rings
    for (const r of fo.ring ?? []) ringBox(c, padBox(where.fig(r.at), 6), r.col, r.k, 18);
    for (const r of fo.rowRing ?? []) ringBox(c, padBox(where.row(r.j), 2), r.col, r.k, 12);
    // labels (paper pads erase the grid lines behind them)
    const lab = (key: LabelKey, step: string, role: Paint, pad: string | null) => {
      const pl = labelOf(key);
      if (!pl) return;
      const a = P.k(step), sw = fo.swap?.[key], pu = fo.pulse?.find(p => p.at === key);
      if (pu && pu.k > 0 && a > 0) ringBox(c, pl.box, pu.col ?? role, pu.k * a);
      label(c, pl, role, a * (sw ? 1 - sw.k : 1), pad);
      if (sw && sw.k > 0) label(c, { ...pl, t: sw.t }, 'link', a * sw.k, null);
    };
    const padPaper = grid ? PAPER : null;
    lab('ow', 'oL', 'first', padPaper); lab('oh', 'oL', 'first', padPaper);
    lab('cw', 'cL', 'second', padPaper); lab('ch', 'cL', 'second', padPaper);
    lab('oA', 'oA', 'ink', mix(paint(th, 'first', 'fill'), '#FFFFFF', 0.25));
    lab('cA', 'cA', 'ink', mix(paint(th, L.tileIn === 'c' ? 'first' : 'second', 'fill'), '#FFFFFF', 0.25));
  }

  return { kind: 'AreaGrid', pic, L, box: L.box, where, draw };
}

/** every step that shows a picture whole (the copy's tiles only when asked) */
export function areaSteps(pic: AreaPic, o: { copy?: boolean; tiles?: boolean } = {}): AreaStep[] {
  const s: AreaStep[] = ['grid', 'o'];
  if (pic.labels?.ow || pic.labels?.oh) s.push('oL');
  if (pic.area?.o) s.push('oA');
  if (o.copy !== false) { s.push('c'); if (pic.labels?.cw || pic.labels?.ch) s.push('cL'); }
  if (o.tiles) { if (pic.tile === 'groups') s.push('groups'); else if (pic.tile) s.push('tiles'); if (pic.count) s.push('n'); }
  return s;
}
