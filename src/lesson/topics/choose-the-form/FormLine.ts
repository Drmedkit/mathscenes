// FormLine: the model of "one amount, three names": a painted bar (the whole, amber) on a double number line.
// Above the bar: amounts (dollars, cups, or whole numbers). Under it: a crisp percent axis. A lavender marker at a
// value carries a stack of its names (percent on the axis row, then the fraction, then the decimal): one point, three
// names. Cutting the bar into equal pieces is the fraction route (48 / 4); lime stretches are the answer; a second
// stretch shows a decomposition (10% + 8%) or rounded shares (Ava's 33% three times). A zoom lens magnifies the end
// of the bar so a tiny rounding gap ($9 of $900) becomes visible.
//
// Steps (any subset, read through a Progress): bar, cut, fill0..fill3, top0.., bot0.., mark, pct, frac, dec, lens, gap.
import { type Box, box, clamp, lerp } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Role, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';
import { rectPts } from '../../../core/pts';

export interface Tick { v: number; t: string; row?: 0 | 1; col?: Role }
export interface Stretch { a: number; b: number; col: Role }
export interface FormLineParams {
  /** the line runs from 0 to `wholes` (1 to 5) */
  wholes: number;
  /** a zoomed stretch [lo, hi] of the line instead of 0..wholes (comparing close numbers) */
  range?: [number, number];
  /** extra points with one TeX label each (step `pin{i}`): labels hang under the axis in two staggered rows */
  pins?: { v: number; t: string; col?: Role }[];
  /** labels above the bar (amounts), step `top{i}` */
  top: Tick[];
  /** labels under the percent axis, step `bot{i}` */
  bot: Tick[];
  /** equal pieces per whole (step `cut`) */
  cut?: number;
  /** painted stretches on the bar (step `fill{i}`), in wholes */
  fills?: Stretch[];
  /** the marker (step `mark`) and its names under it (steps pct / frac / dec; pct sits on the axis row) */
  mark?: number;
  names?: { pct?: string; frac?: string; dec?: string; order?: ('pct' | 'frac' | 'dec')[] };
  /** a zoom lens on [a, b] of the line (step `lens`) with its own tick labels and a gap (step `gap`) */
  lens?: { a: number; b: number; ticks: Tick[]; gap?: { a: number; b: number; t: string } };
}
export interface FormFocus {
  /** rings by name: 'bar' | 'fill0'.. | 'top0'.. | 'pct' | 'frac' | 'dec' | 'gap' */
  rings?: readonly { at: string; col: Role; k: number }[];
  /** 0..1 dims the bar and the cut (while the board works) */
  dim?: number;
}
export interface FormLineBlock {
  readonly kind: 'FormLine';
  readonly p: FormLineParams;
  x(v: number): number;
  readonly where: { bar: Box; fill(i: number): Box; top(i: number): Box; bot(i: number): Box; name(n: 'pct' | 'frac' | 'dec'): Box; stack: Box; lens: Box; gap: Box };
  draw(c: Canvas, P: Progress<string>, f?: FormFocus): void;
}

// layout (design px inside the model frame 60..1000 x 70..1010)
export const X0 = 150, X1 = 850, LABEL = 60, NAME = 64;
const LENS = box(110, 712, 890, 1000), LBAR0 = 800, LBAR1 = 856, LAXIS = 884, LTICK = 942, LX0 = 170, LX1 = 790;
/** the rows; without a lens the whole line sits lower, near the middle of the frame */
export function rowsOf(p: Pick<FormLineParams, 'lens'>) {
  const d = p.lens ? 0 : 130;
  return { bar0: 250 + d, bar1: 340 + d, axis: 384 + d, top: [196 + d, 116 + d] as const, bot: 440 + d, frac: 548 + d, dec: 652 + d };
}

/** words box of a tick label (numbers >= 60 px) */
const tickBox = (t: Tick, x: number, y: number): Box => wordsBox(t.t, x, y, { size: LABEL, align: 'center' });

/** where everything sits, and a readable-or-throw check (labels inside the frame, no overlaps in a row) */
export function formLineLayout(p: FormLineParams, fr: Frame) {
  check(Number.isInteger(p.wholes) && p.wholes >= 1 && p.wholes <= 5, 'FormLine', 'wholes must be 1 to 5');
  const Y = rowsOf(p);
  const [lo, hi] = p.range ?? [0, p.wholes];
  check(hi > lo && lo >= 0, 'FormLine', 'bad range');
  const x = (v: number) => X0 + ((v - lo) / (hi - lo)) * (X1 - X0);
  // the bar's segments: one per whole inside [lo, hi]
  const bounds = [lo, ...Array.from({ length: Math.ceil(hi) - Math.floor(lo) + 1 }, (_, i) => Math.floor(lo) + i).filter(w => w > lo + 1e-9 && w < hi - 1e-9), hi];
  const clampX = (b: Box, cx: number): number => cx + Math.max(0, fr.x + 8 - b.x0) - Math.max(0, b.x1 - (fr.x + fr.w - 8));
  const place = (t: Tick, y: number) => { const b0 = tickBox(t, x(t.v), y); const cx = clampX(b0, x(t.v)); return { cx, b: tickBox(t, cx, y) }; };
  const tops = p.top.map(t => place(t, Y.top[t.row ?? 0]));
  const bots = p.bot.map(t => place(t, Y.bot));
  const on = (v: number) => v >= lo - 1e-9 && v <= hi + 1e-9;
  for (const v of [...p.top, ...p.bot, ...(p.pins ?? [])].map(t => t.v)) check(on(v), 'FormLine', `label at ${v} is off the line`);
  if (p.mark !== undefined) check(on(p.mark), 'FormLine', 'marker off the line');
  for (const s of p.fills ?? []) check(on(s.a) && on(s.b) && s.a < s.b, 'FormLine', 'stretch off the line');
  return { x, tops, bots, lo, hi, bounds };
}

export function FormLine(p: FormLineParams, fr: Frame, th: Theme): FormLineBlock {
  const L = formLineLayout(p, fr), x = L.x, Y = rowsOf(p);
  const NF: Partial<Record<'pct' | 'frac' | 'dec', Formula>> = {};
  if (p.names?.pct) NF.pct = tex(p.names.pct) as Formula;
  if (p.names?.frac) NF.frac = tex(p.names.frac) as Formula;
  if (p.names?.dec) NF.dec = tex(p.names.dec) as Formula;
  const mx = p.mark ?? 0;
  // the names hang in a compact column under the axis, in the given order (the names shown first on top)
  const order = (p.names?.order ?? ['pct', 'frac', 'dec']).filter(k => NF[k]);
  for (const k of ['pct', 'frac', 'dec'] as const) if (NF[k] && !order.includes(k)) order.push(k);
  const nameY = { pct: Y.bot, frac: Y.frac, dec: Y.dec };
  { let top = Y.axis + 30; for (const k of order) { const b0 = texBox(NF[k]!, 0, 0, { size: NAME, align: 'center' }); nameY[k] = top - b0.y0; top += b0.h + 12; } }
  // the stack is centred under the marker, pushed inside the frame
  const rawBoxes = (cx: number) => order.map(k => texBox(NF[k]!, cx, nameY[k], { size: NAME, align: 'center' }));
  let scx = x(mx);
  { const bs = rawBoxes(scx); if (bs.length) { const x0 = Math.min(...bs.map(b => b.x0)), x1 = Math.max(...bs.map(b => b.x1)); scx += Math.max(0, fr.x + 14 - x0) - Math.max(0, x1 - (fr.x + fr.w - 14)); } }
  const nameBox = (k: 'pct' | 'frac' | 'dec'): Box => (NF[k] ? texBox(NF[k]!, scx, nameY[k], { size: NAME, align: 'center' }) : box(scx, nameY[k], scx, nameY[k]));
  const present = order;
  const stack = present.length ? (() => { const bs = present.map(nameBox); return box(Math.min(...bs.map(b => b.x0)) - 22, Math.min(...bs.map(b => b.y0)) - 16, Math.max(...bs.map(b => b.x1)) + 22, Math.max(...bs.map(b => b.y1)) + 16); })() : box(0, 0, 0, 0);
  const lx = (v: number) => (p.lens ? LX0 + ((v - p.lens.a) / (p.lens.b - p.lens.a)) * (LX1 - LX0) : 0);
  const gapBox = p.lens?.gap ? box(lx(p.lens.gap.a), LBAR0, lx(p.lens.gap.b), LBAR1) : box(0, 0, 0, 0);
  const barBox = box(X0, Y.bar0, X1, Y.bar1);
  const fillBox = (i: number) => { const s = p.fills?.[i]; return s ? box(x(s.a), Y.bar0 + 8, x(s.b), Y.bar1 - 8) : box(0, 0, 0, 0); };
  // pins: rows alternate in value order, labels pushed inside the frame
  const pins = p.pins ?? [];
  const PF = pins.map(q => tex(q.t) as Formula);
  const pinRow: number[] = [];
  pins.map((_, i) => i).sort((a, b) => pins[a]!.v - pins[b]!.v).forEach((i, r) => { pinRow[i] = r % 2; });
  const pinY = (i: number) => Y.axis + 44 - texBox(PF[i]!, 0, 0, { size: NAME, align: 'center' }).y0 + pinRow[i]! * 128;
  const pinBox = (i: number): Box => {
    const b0 = texBox(PF[i]!, x(pins[i]!.v), pinY(i), { size: NAME, align: 'center' });
    const dx = Math.max(0, fr.x + 14 - b0.x0) - Math.max(0, b0.x1 - (fr.x + fr.w - 14));
    return box(b0.x0 + dx, b0.y0, b0.x1 + dx, b0.y1);
  };

  function ring(c: Canvas, R: Box, col: Role, k: number, r = 14): void {
    if (k <= 0 || R.w <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 14 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - 10, R.y0 - 10, R.w + 20, R.h + 20, r); g.stroke();
    g.restore();
  }
  function stretch(c: Canvas, a: number, b: number, y0: number, y1: number, col: Role, k: number, seed: number): void {
    if (k <= 0 || b <= a) return;
    const x0 = a, x1 = lerp(a, b, E.inOut(clamp(k)));
    if (x1 - x0 < 2) return;
    wash(c, rectPts(x0, y0, x1 - x0, y1 - y0, 6), col, { seed, rough: 1.1, inkW: 2.5, shade: 0.2 });
  }

  function draw(c: Canvas, P: Progress<string>, f: FormFocus = {}): void {
    const kB = P.k('bar');
    if (kB <= 0) return;
    const dim = 1 - 0.5 * clamp(f.dim ?? 0);
    // the bar: one painted strip per whole, drawn on left to right
    withAlpha(c, kB * dim, () => {
      const B = L.bounds, nb = B.length - 1;
      for (let w = 0; w < nb; w++) {
        const a = x(B[w]!), b = x(B[w + 1]!);
        stretch(c, a + (w ? 3 : 0), b - (w < nb - 1 ? 3 : 0), Y.bar0, Y.bar1, 'first', clamp(kB * nb - w), 3 + w);
      }
    });
    // the percent axis (crisp) with end ticks and whole ticks
    const g = c.g;
    withAlpha(c, kB, () => {
      g.save(); g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(X0, Y.axis); g.lineTo(lerp(X0, X1, E.inOut(clamp(kB))), Y.axis); g.stroke();
      for (const w of L.bounds) { g.beginPath(); g.moveTo(x(w), Y.axis - 14); g.lineTo(x(w), Y.axis + 14); g.stroke(); }
      // amount ticks above the bar ends
      for (const w of L.bounds) { g.beginPath(); g.moveTo(x(w), Y.bar0 - 26); g.lineTo(x(w), Y.bar0 - 8); g.stroke(); }
      g.restore();
    });
    // equal pieces: dashed teal cuts through the bar and small ticks on the axis
    const kC = P.k('cut'), n = p.cut ?? 0;
    if (kC > 0 && n > 1) for (let w = Math.floor(L.lo); w < Math.ceil(L.hi); w++) for (let j = 1; j < n; j++) {
      const v = w + j / n, xx = x(v), kk = E.smooth(clamp(kC * n - (j - 1) * 0.6));
      if (kk <= 0 || v <= L.lo + 1e-9 || v >= L.hi - 1e-9) continue;
      g.save(); g.globalAlpha *= kk * dim; g.setLineDash([10, 8]); g.strokeStyle = paint(th, 'second', 'fill'); g.lineWidth = 4;
      g.beginPath(); g.moveTo(xx, Y.bar0 - 4); g.lineTo(xx, lerp(Y.bar0 - 4, Y.bar1 + 4, kk)); g.stroke();
      g.setLineDash([]); g.strokeStyle = paint(th, 'second', 'line'); g.lineWidth = 3;
      g.beginPath(); g.moveTo(xx, Y.axis - 9); g.lineTo(xx, Y.axis + 9); g.stroke(); g.restore();
    }
    // stretches on the bar
    (p.fills ?? []).forEach((s, i) => stretch(c, x(s.a) + 3, x(s.b) - 3, Y.bar0 + 8, Y.bar1 - 8, s.col, P.k('fill' + i), 20 + i));
    // the marker: a lavender line through the bar to the axis, a small arrow head under the axis
    const kM = P.k('mark');
    if (kM > 0 && p.mark !== undefined) {
      const xm = x(p.mark);
      g.save(); g.globalAlpha *= clamp(kM); g.strokeStyle = paint(th, 'pick', 'fill'); g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(xm, Y.bar0 - 18); g.lineTo(xm, lerp(Y.bar0 - 18, Y.axis + 2, E.inOut(clamp(kM)))); g.stroke();
      g.fillStyle = paint(th, 'pick', 'fill'); g.beginPath(); g.moveTo(xm, Y.axis + 4); g.lineTo(xm - 10, Y.axis + 20); g.lineTo(xm + 10, Y.axis + 20); g.closePath(); g.fill();
      g.restore();
    }
    // pins: a line through the bar to the axis, the label hanging below (no connector through another label)
    const pinVis = pins.map((_, i) => P.k('pin' + i) > 0.05);
    pins.forEach((q, i) => {
      const k = P.k('pin' + i);
      if (k <= 0) return;
      const xp = x(q.v), col = q.col ?? 'pick', B = pinBox(i);
      g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 4.5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(xp, Y.bar0 - 16); g.lineTo(xp, lerp(Y.bar0 - 16, Y.axis + 2, E.inOut(clamp(k)))); g.stroke();
      g.fillStyle = paint(th, col, 'fill'); g.beginPath(); g.moveTo(xp, Y.axis + 4); g.lineTo(xp - 9, Y.axis + 19); g.lineTo(xp + 9, Y.axis + 19); g.closePath(); g.fill();
      const blocked = pins.some((_, j) => j !== i && pinVis[j] && pinRow[j]! < pinRow[i]! && pinBox(j).x0 - 12 < xp && xp < pinBox(j).x1 + 12);
      if (!blocked && B.y0 - 10 > Y.axis + 26) { g.lineWidth = 2.5; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(xp, Y.axis + 26); g.lineTo(xp, B.y0 - 10); g.stroke(); }
      g.restore();
      texDraw(c, PF[i]!, B.cx, pinY(i), { size: NAME, align: 'center', k, col });
    });
    // the names stack: a soft lavender tag behind the names of the marked point
    // (it grows with the names that are showing, so no empty tag hints at a name still to come)
    const vis = present.filter(k => P.k(k) > 0.02);
    const tag = vis.length ? (() => { const bs = vis.map(nameBox); return box(Math.min(...bs.map(b => b.x0)) - 22, Math.min(...bs.map(b => b.y0)) - 16, Math.max(...bs.map(b => b.x1)) + 22, Math.max(...bs.map(b => b.y1)) + 16); })() : null;
    if (tag) {
      const kN = Math.max(...vis.map(k => P.k(k)));
      withAlpha(c, 0.22 * clamp(kN), () => wash(c, rectPts(tag.x0, tag.y0, tag.w, tag.h, 18), 'pick', { seed: 41, rough: 1, ink: null, shade: 0 }));
    }
    for (const k of present) {
      const kk = P.k(k);
      if (kk > 0) texDraw(c, NF[k]!, scx, nameY[k], { size: NAME, align: 'center', k: kk, col: k === 'pct' ? 'pick' : 'ink' });
    }
    // labels: an amount label gives way to a later one it would touch (the answer near "$0"); an axis label hides
    // under the names tag
    const hit = (a: Box, b: Box, m: number) => a.x0 < b.x1 + m && b.x0 - m < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
    L.tops.forEach((t, i) => {
      let kk = P.k('top' + i);
      if (kk <= 0) return;
      L.tops.forEach((u, j) => { if (j > i && (p.top[j]!.row ?? 0) === (p.top[i]!.row ?? 0) && hit(t.b, u.b, 14)) kk *= 1 - clamp(P.k('top' + j) * 2); });
      if (kk > 0) drawWords(c, p.top[i]!.t, t.cx, Y.top[p.top[i]!.row ?? 0], p.top[i]!.col ?? 'first', kk, { size: LABEL, align: 'center' });
    });
    L.bots.forEach((t, i) => {
      const kk = P.k('bot' + i);
      if (kk <= 0 || (tag && hit(t.b, tag, 16)) || pins.some((_, j) => pinVis[j] && hit(t.b, pinBox(j), 8))) return;
      drawWords(c, p.bot[i]!.t, t.cx, Y.bot, p.bot[i]!.col ?? 'dim', kk, { size: LABEL, align: 'center' });
    });
    // the lens: connectors from the end of the bar, a framed zoom of [a, b]
    const kL = P.k('lens'), Lz = p.lens;
    if (kL > 0 && Lz) {
      withAlpha(c, clamp(kL), () => {
        g.save(); g.strokeStyle = 'rgba(239,230,247,0.45)'; g.lineWidth = 2.5; g.setLineDash([8, 7]);
        g.beginPath(); g.moveTo(x(Lz.a), Y.bar1 + 6); g.lineTo(LENS.x0 + 30, LENS.y0); g.moveTo(x(Lz.b), Y.bar1 + 6); g.lineTo(LENS.x1 - 30, LENS.y0); g.stroke();
        g.setLineDash([]); g.restore();
        g.save(); g.strokeStyle = 'rgba(239,230,247,0.45)'; g.lineWidth = 2.5; g.setLineDash([8, 7]);
        g.beginPath(); g.rect(x(Lz.a) - 4, Y.bar0 - 6, x(Lz.b) - x(Lz.a) + 8, Y.bar1 - Y.bar0 + 12); g.stroke(); g.restore();
        wash(c, rectPts(LENS.x0, LENS.y0, LENS.w, LENS.h, 20), '#121531', { seed: 51, rough: 1.2, ink: null, shade: 0.1 });
        inkLine(c, rectPts(LENS.x0 + 3, LENS.y0 + 3, LENS.w - 6, LENS.h - 6, 18), { col: '#5E6290', w: 3, closed: true, seed: 52, rough: 0.8 });
        // zoomed bar and fills
        stretch(c, LX0, LX1, LBAR0, LBAR1, 'first', 1, 53);
        (p.fills ?? []).forEach((s, i) => {
          const a = Math.max(s.a, Lz.a), b = Math.min(s.b, Lz.b);
          if (b > a) stretch(c, lx(a) + 2, lx(b) - 2, LBAR0 + 6, LBAR1 - 6, s.col, P.k('fill' + i), 60 + i);
        });
        g.save(); g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 3;
        g.beginPath(); g.moveTo(LX0, LAXIS); g.lineTo(LX1, LAXIS); g.stroke();
        for (const t of Lz.ticks) { g.beginPath(); g.moveTo(lx(t.v), LAXIS - 10); g.lineTo(lx(t.v), LAXIS + 10); g.stroke(); }
        g.restore();
        for (const t of Lz.ticks) drawWords(c, t.t, lx(t.v), LTICK, t.col ?? 'first', 1, { size: LABEL, align: 'center' });
      });
      const kG = P.k('gap');
      if (kG > 0 && Lz.gap) {
        const G = gapBox;
        g.save(); g.globalAlpha *= clamp(kG) * clamp(kL); g.setLineDash([9, 7]); g.strokeStyle = paint(th, 'wrong', 'fill'); g.lineWidth = 4;
        g.strokeRect(G.x0 + 2, G.y0 + 4, G.w - 4, G.h - 8); g.restore();
        drawWords(c, Lz.gap.t, G.cx, LENS.y0 + 46, 'wrong', clamp(kG) * clamp(kL), { size: LABEL, align: 'center' });
      }
    }
    // rings
    for (const R of f.rings ?? []) ring(c, ringBox(R.at), R.col, R.k);
  }
  function ringBox(at: string): Box {
    if (at === 'bar') return barBox;
    if (at === 'gap') return gapBox;
    if (at === 'pct' || at === 'frac' || at === 'dec') return nameBox(at);
    if (at === 'stack') return stack;
    if (at.startsWith('fill')) return fillBox(Number(at.slice(4)));
    if (at.startsWith('top')) return L.tops[Number(at.slice(3))]?.b ?? box(0, 0, 0, 0);
    if (at.startsWith('bot')) return L.bots[Number(at.slice(3))]?.b ?? box(0, 0, 0, 0);
    return box(0, 0, 0, 0);
  }
  return {
    kind: 'FormLine', p, x,
    where: { bar: barBox, fill: fillBox, top: i => L.tops[i]?.b ?? box(0, 0, 0, 0), bot: i => L.bots[i]?.b ?? box(0, 0, 0, 0), name: nameBox, stack, lens: LENS, gap: gapBox },
    draw,
  };
}
