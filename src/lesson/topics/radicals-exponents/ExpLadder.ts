// ExpLadder: the exponent ladder, the model of rational exponents. The powers of one base sit as tiles on a line of
// exponents k/n (k = lo..hi). Equal steps in the exponent are equal FACTORS in the value: every hop between two
// neighbouring tiles multiplies by the same number (the arc above it, "× 2"). So n equal hops make one whole step
// (× a), which is why a^(1/n) has to be the number whose nth power is a; m hops of that size give a^(m/n), and hops
// to the left (negative exponents) divide.
//
//   values   TeX per tick (null = never shown); `given` ticks show their value as soon as the tile is in, the others
//            stay as a dashed tile (or "?" on the asked tick) until v<i>
//   spans    brackets over runs of hops with a label (a product: p hops, then q hops)
// Steps: 'axis' (line, ticks, exponent labels, caption), n<i> (tile i in), v<i> (value i writes on), h<i> (hop from
// tick i to i + 1, with the factor), s<j> (span j).
// Layout in a Frame; throws BlockError when ticks are too close or a value / label does not fit (numbers >= 60 px).
// Could move to the kit: a "multiplicative number line" for any geometric pattern (exponents, growth, scale factors).
import { type Box, box, clamp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, arrow } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { drawWords } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';

export interface LadderParams {
  /** TeX of the base, for the caption "powers of 8" */ base: string;
  n: number; lo: number; hi: number;
  values: (string | null)[];
  given?: boolean[];
  ask?: number;
  /** TeX of the hop factor ("\\times 2"); without it the hops have no label */ factor?: string;
  spans?: { from: number; to: number; tex: string }[];
  /** the tile colour (default 'second') */ col?: Paint;
}
export type LadderStep = 'axis' | `n${number}` | `v${number}` | `h${number}` | `s${number}`;
export interface LadderFocus { rings?: { i: number; col: Paint; k: number }[]; lit?: { i: number; k: number }[]; dim?: number }
export interface LadderBlock {
  readonly kind: 'ExpLadder';
  readonly count: number;
  readonly where: { node(i: number): Box; exp(i: number): Box; hop(i: number): Box; span(j: number): Box };
  draw(c: Canvas, P: Progress<LadderStep>, f?: LadderFocus): void;
}
const NAME = 'ExpLadder';
const VAL = 60, EXP = 60, HOP = 60;

/** k/n as TeX: whole when it divides, else an unreduced fraction (equal steps of 1/n) */
export function expLabel(k: number, n: number): string {
  if (k % n === 0) return k < 0 ? `-${-k / n}` : String(k / n);
  return `${k < 0 ? '-' : ''}\\frac{${Math.abs(k)}}{${n}}`;
}

export function ExpLadder(p: LadderParams, fr: Frame, th: Theme): LadderBlock {
  const T = p.hi - p.lo + 1;
  check(T >= 2 && T <= 9, NAME, `2 to 9 ticks (got ${T})`);
  check(p.values.length === T, NAME, 'a value (or null) for every tick');
  const pad = 64, dx = (fr.w - 2 * pad) / (T - 1);
  check(dx >= 100, NAME, 'the ticks are too close');
  const x = (i: number) => fr.x + pad + i * dx;
  const nodeY = fr.y + fr.h * 0.52, tileH = 104;
  const VF = p.values.map(v => (v === null ? null : tex(v) as Formula));
  const Q = tex('?') as Formula;
  const tileW = VF.map(F => Math.min(dx - 12, Math.max(96, (F ? texWidth(F, VAL) : 40) + 36)));
  VF.forEach((F, i) => { if (F) check(texWidth(F, VAL) <= tileW[i]! - 20, NAME, `the value ${p.values[i]} does not fit its tile`); });
  const nodeBox = (i: number) => box(x(i) - tileW[i]! / 2, nodeY - tileH / 2, x(i) + tileW[i]! / 2, nodeY + tileH / 2);
  const EF = Array.from({ length: T }, (_, i) => tex(expLabel(p.lo + i, p.n)) as Formula);
  EF.forEach(F => check(texWidth(F, EXP) <= dx - 16, NAME, 'an exponent label does not fit'));
  const expY = nodeY + tileH / 2 + 92;
  const expBox = (i: number) => texBox(EF[i]!, x(i), expY, { size: EXP, align: 'center' });
  // hops: arcs from the top of tile i to the top of tile i + 1, the factor above
  const arcTop = nodeY - tileH / 2 - 70, hopY = arcTop - 56;
  const FF = p.factor ? tex(p.factor) as Formula : null;
  if (FF) check(texWidth(FF, HOP) <= dx - 6, NAME, 'the hop factor does not fit between two ticks');
  const hopBox = (i: number) => FF ? texBox(FF, (x(i) + x(i + 1)) / 2, hopY, { size: HOP, align: 'center' }) : box((x(i) + x(i + 1)) / 2 - 20, hopY - 20, (x(i) + x(i + 1)) / 2 + 20, hopY + 20);
  const spans = (p.spans ?? []).map(s => {
    const i0 = s.from - p.lo, i1 = s.to - p.lo;
    check(i0 >= 0 && i1 <= T - 1 && i1 > i0, NAME, 'a span inside the ticks');
    const F = tex(s.tex) as Formula, y = (FF ? hopY - 70 : arcTop - 30);
    const bx = box(x(i0), y - 16, x(i1), y + 16);
    check(texWidth(F, 60) <= Math.max(bx.w + 60, 140), NAME, 'a span label is too wide');
    return { i0, i1, F, y, lab: texBox(F, bx.cx, y - 58, { size: 60, align: 'center' }), bx };
  });
  for (let a = 0; a < spans.length; a++) for (let b = a + 1; b < spans.length; b++) {
    const A = spans[a]!.lab, B = spans[b]!.lab;
    check(A.x1 + 12 < B.x0 || B.x1 + 12 < A.x0, NAME, 'span labels overlap');
  }
  const capY = fr.y + 60;
  for (const s of spans) check(s.lab.y0 >= capY + 30, NAME, 'the spans run into the caption');

  function tileDraw(c: Canvas, i: number, kIn: number, kVal: number, ring?: { col: Paint; k: number }, lit = 0): void {
    if (kIn <= 0) return;
    const B = nodeBox(i), rise = (1 - E.out(clamp(kIn))) * 24, { g } = c;
    const P = rectPts(B.x0, B.y0 - rise, B.w, B.h, 18);
    const given = p.given?.[i] ?? false, F = VF[i];
    const shown = F ? (given ? clamp(kIn) : clamp(kVal)) : 0;
    g.save();
    // a dashed empty tile until its value is known, then a painted tile
    g.save(); g.globalAlpha *= clamp(kIn) * (1 - shown); g.setLineDash([10, 9]); g.strokeStyle = paint(th, i === (p.ask ?? -1) - p.lo ? 'pick' : 'faint', 'line'); g.lineWidth = 3;
    g.beginPath(); g.roundRect(B.x0, B.y0 - rise, B.w, B.h, 18); g.stroke(); g.restore();
    if (shown > 0) wash(c, P, lit > 0 ? 'link' : p.col ?? 'second', { seed: 600 + i, rough: 1.5, alpha: shown * 0.95, inkW: 2.5 });
    if (shown > 0 && F) texDraw(c, F, B.cx, B.cy - rise, { size: VAL, align: 'center', col: DUSK.ink as never, k: shown });
    if (i === (p.ask ?? -999) - p.lo && shown < 1) texDraw(c, Q, B.cx, B.cy - rise, { size: VAL, align: 'center', col: 'pick', alpha: clamp(kIn) * (1 - shown) });
    if (ring && ring.k > 0) {
      g.save(); g.globalAlpha *= clamp(ring.k); g.strokeStyle = paint(th, ring.col, 'fill'); g.lineWidth = 6;
      g.beginPath(); g.roundRect(B.x0 - 10, B.y0 - rise - 10, B.w + 20, B.h + 20, 24); g.stroke(); g.restore();
    }
    g.restore();
  }
  function draw(c: Canvas, P: Progress<LadderStep>, f: LadderFocus = {}): void {
    const kA = P.k('axis');
    const { g } = c;
    if (kA > 0) {
      const a = E.smooth(clamp(kA));
      g.save(); g.globalAlpha *= a;
      g.strokeStyle = paint(th, 'faint', 'line'); g.lineWidth = 4;
      g.beginPath(); g.moveTo(fr.x + 30, nodeY); g.lineTo(fr.x + 30 + (fr.w - 60) * E.inOut(clamp(kA)), nodeY); g.stroke();
      for (let i = 0; i < T; i++) { g.beginPath(); g.moveTo(x(i), nodeY + tileH / 2 + 8); g.lineTo(x(i), nodeY + tileH / 2 + 30); g.stroke(); }
      g.restore();
      for (let i = 0; i < T; i++) texDraw(c, EF[i]!, x(i), expY, { size: EXP, align: 'center', col: (p.lo + i) % p.n === 0 ? 'ink' : 'dim', k: kA });
      drawWords(c, `powers of ${p.base.replace(/\\[a-z]+|[{}]/g, '')}`, fr.x + 30, capY, 'dim', kA, { size: 44 });
      drawWords(c, 'exponent', fr.x + fr.w - 30, expY + 86, 'faint', kA, { size: 44, align: 'right' });
    }
    for (let i = 0; i < T - 1; i++) {
      const k = P.k(`h${i}`);
      if (k <= 0) continue;
      const a = nodeBox(i), b = nodeBox(i + 1), x0 = a.cx + 8, x1 = b.cx - 8, y0 = a.y0 - 6;
      const pts: [number, number][] = [];
      for (let t = 0; t <= 24; t++) { const u = t / 24; pts.push([x0 + (x1 - x0) * u, y0 - Math.sin(Math.PI * u) * (y0 - arcTop)]); }
      arrow(c, pts, E.inOut(clamp(k)), { col: 'first', lw: 4, head: 16 });
      if (FF) texDraw(c, FF, (x0 + x1) / 2, hopY, { size: HOP, align: 'center', col: 'first', k: clamp((k - 0.4) / 0.6) });
    }
    spans.forEach((s, j) => {
      const k = P.k(`s${j}`);
      if (k <= 0) return;
      g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, 'pick', 'line'); g.lineWidth = 4;
      const x0 = x(s.i0) + 6, x1 = x(s.i1) - 6;
      g.beginPath(); g.moveTo(x0, s.y + 14); g.lineTo(x0, s.y); g.lineTo(x0 + (x1 - x0) * E.inOut(clamp(k)), s.y); if (k >= 1) g.lineTo(x1, s.y + 14); g.stroke(); g.restore();
      texDraw(c, s.F, s.lab.cx, s.y - 58, { size: 60, align: 'center', col: 'pick', k });
    });
    for (let i = 0; i < T; i++) {
      const r = f.rings?.find(z => z.i === i), lit = f.lit?.find(z => z.i === i)?.k ?? 0;
      c.g.save(); if (f.dim && i !== (p.ask ?? -999) - p.lo && !r) c.g.globalAlpha *= 1 - 0.5 * f.dim;
      tileDraw(c, i, P.k(`n${i}`), P.k(`v${i}`), r, lit);
      c.g.restore();
    }
  }
  return { kind: 'ExpLadder', count: T, where: { node: nodeBox, exp: expBox, hop: hopBox, span: j => spans[j]!.lab }, draw };
}
