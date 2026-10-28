// Euler: the model of an if-then statement over a stated domain (layout in eulerLayout.ts, logic in logic.ts).
// The domain is a big box with its name on top; region P (the hypothesis, amber) and region Q (the conclusion, teal)
// are painted inside it. "If p, then q" is true over the domain exactly when no member sits in P outside Q: the
// picture is then P inside Q. A member in P outside Q is a counterexample; members outside P (in Q or outside both)
// never break the statement. The converse reads the same picture the other way round (Q outside P breaks it), the
// inverse and contrapositive read the outsides (~p is everything outside P).
// Members are numbers (TeX) or drawn shapes whose marks decide their properties (a small square = a right angle,
// matching ticks = equal sides). They first stand in a line-up in value order, then fly into their zones ('sort').
//
// Steps: domain, Q, P, tokens, sort.   Focus: zone fills, glows/rings and crosses on members, label pulses.
// Could move to the kit: an Euler / Venn block with a stated domain and sortable members (sets, logic, probability).
import { type Box, type Pt, box, clamp, lag, lerp } from '../../../core/math';
import { type Canvas, strike } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw } from '../../../core/tex';
import { rectPts } from '../../../core/pts';
import type { Frame } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { drawWords } from '../../words';
import { type EulerLayoutT, type EulerParams, DOM, LBL, TOK, eulerLayout } from './eulerLayout';
import type { Shape, Zone } from './logic';
export type { EulerParams, ETok } from './eulerLayout';

export type EulerStep = 'domain' | 'Q' | 'P' | 'tokens' | 'sort';
export type ZoneSel = Zone | 'P' | 'Q' | 'notP' | 'notQ' | 'all';
export interface EulerFocus {
  zones?: readonly { at: ZoneSel; col: Paint; k: number }[];
  /** a soft halo and a ring around a member */
  glow?: readonly { i: number; col: Paint; k: number }[];
  /** a red strike through a member (it breaks the statement) */
  cross?: readonly { i: number; k: number }[];
  /** 0..1 fade of a member (out of the question) */
  fade?: Readonly<Record<number, number>>;
  pulseP?: number; pulseQ?: number;
}
export interface EulerBlock {
  readonly kind: 'Euler';
  readonly layout: EulerLayoutT;
  readonly where: { token(i: number): Box; zone(z: Zone): Box; labelP: Box; labelQ: Box | null; P: Box; Q: Box | null; domain: Box };
  draw(c: Canvas, P: Progress<EulerStep>, f?: EulerFocus): void;
}
const R = 46, SHAPE_COL = '#8C84C8', SS = 1.4;

export function Euler(p: EulerParams, fr: Frame, th: Theme): EulerBlock {
  const L = eulerLayout(p, fr);
  const Fs = p.tokens.map(t => (t.tex !== undefined ? tex(t.tex) as Formula : null));
  const n = p.tokens.length;
  const tokBox = (q: Pt, i: number) => (p.tokens[i]!.shape ? box(q[0] - 84, q[1] - 84, q[0] + 84, q[1] + 96) : box(q[0] - L.cw / 2 + 16, q[1] - 38, q[0] + L.cw / 2 - 16, q[1] + 38));
  // zones are clipped with plain context paths (rounded boxes; "outside" = the domain rect with the box cut out)
  const boxP = L.P, boxQ = L.Q;
  function clipIn(c: Canvas, b: Box): void { c.g.beginPath(); c.g.roundRect(b.x0, b.y0, b.w, b.h, R); c.g.clip(); }
  function clipOut(c: Canvas, b: Box): void {
    const { g } = c, D = L.D;
    g.beginPath(); g.rect(D.x0, D.y0, D.w, D.h); g.roundRect(b.x0, b.y0, b.w, b.h, R); g.clip('evenodd');
  }
  function fillZone(c: Canvas, at: ZoneSel, col: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= 0.3 * clamp(k);
    clipIn(c, { ...L.D, x0: L.D.x0, y0: L.D.y0 } as Box);
    const inP = (b: boolean) => (b ? clipIn(c, boxP) : clipOut(c, boxP));
    const inQ = (b: boolean) => { if (boxQ) { if (b) clipIn(c, boxQ); else clipOut(c, boxQ); } };
    switch (at) {
      case 'P': inP(true); break;
      case 'Q': inQ(true); break;
      case 'notP': inP(false); break;
      case 'notQ': inQ(false); break;
      case 'pq': inP(true); inQ(true); break;
      case 'p': inP(true); inQ(false); break;
      case 'q': inQ(true); inP(false); break;
      case 'o': inP(false); inQ(false); break;
      case 'all': break;
    }
    g.fillStyle = paint(th, col, 'fill');
    g.fillRect(L.D.x0, L.D.y0, L.D.w, L.D.h);
    g.restore();
  }
  function region(c: Canvas, b: Box, col: Paint, k: number, seed: number, inset = 0): void {
    if (k <= 0) return;
    const a = E.smooth(clamp(k));
    wash(c, rectPts(b.x0 + inset, b.y0 + inset, b.w - 2 * inset, b.h - 2 * inset, R), col, { seed, rough: 1.6, ink: null, alpha: 0.2 * a, shade: 0.05 });
    inkLine(c, rectPts(b.x0 + inset, b.y0 + inset, b.w - 2 * inset, b.h - 2 * inset, R), { col: paint(th, col, 'line'), w: 4, closed: true, seed: seed + 1, rough: 0.7, alpha: a });
  }
  function drawLabel(c: Canvas, lb: EulerLayoutT['labelP'], col: Paint, k: number, pulse = 0): void {
    if (k <= 0) return;
    if (pulse > 0) {
      const { g } = c, b = lb.box;
      g.save(); g.globalAlpha *= 0.22 * clamp(pulse); g.fillStyle = paint(th, col, 'fill');
      g.beginPath(); g.roundRect(b.x0 - 14, b.y0 - 10, b.w + 28, b.h + 20, 14); g.fill(); g.restore();
    }
    lb.lines.forEach((t, j) => drawWords(c, t, lb.x, lb.y + j * 52, col, k, { size: LBL }));
  }
  function shapeAt(c: Canvas, s: Shape, x: number, y: number, a: number, seed: number): void {
    const P = s.pts.map(([u, v]) => [x + u * SS, y + v * SS] as Pt);
    wash(c, P, SHAPE_COL, { seed, rough: 1, inkW: 3, alpha: a, shade: 0.25 });
    const { g } = c;
    g.save(); g.globalAlpha *= a; g.strokeStyle = DUSK.cream; g.lineWidth = 3.2; g.lineCap = 'round';
    const m = P.length;
    for (const i of s.right) {
      const v = P[i]!, A = P[(i - 1 + m) % m]!, B = P[(i + 1) % m]!;
      const ua = unit(A, v, 16), ub = unit(B, v, 16);
      g.beginPath(); g.moveTo(v[0] + ua[0], v[1] + ua[1]); g.lineTo(v[0] + ua[0] + ub[0], v[1] + ua[1] + ub[1]); g.lineTo(v[0] + ub[0], v[1] + ub[1]); g.stroke();
    }
    s.ticks.forEach((t, i) => {
      if (!t) return;
      const A = P[i]!, B = P[(i + 1) % m]!, d = unit(B, A, 1), nx = -d[1], ny = d[0], mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
      g.beginPath();
      for (let k = 0; k < t; k++) {
        const o = (k - (t - 1) / 2) * 9;
        g.moveTo(mx + d[0] * o - nx * 11, my + d[1] * o - ny * 11); g.lineTo(mx + d[0] * o + nx * 11, my + d[1] * o + ny * 11);
      }
      g.stroke();
    });
    g.restore();
  }

  function draw(c: Canvas, S: Progress<EulerStep>, f: EulerFocus = {}): void {
    const kD = S.k('domain');
    if (kD <= 0) return;
    const aD = E.smooth(clamp(kD));
    wash(c, rectPts(L.D.x0, L.D.y0, L.D.w, L.D.h, 26), '#1B1F44', { seed: 501, rough: 1.2, ink: null, alpha: 0.92 * aD, shade: 0.08 });
    inkLine(c, rectPts(L.D.x0 + 2, L.D.y0 + 2, L.D.w - 4, L.D.h - 4, 24), { col: '#4A4F80', w: 3, closed: true, seed: 502, rough: 0.6, alpha: aD });
    drawWords(c, L.domainText, L.D.cx, L.domainY, 'dim', kD, { size: DOM, align: 'center' });
    const kQ = S.k('Q'), kP = S.k('P');
    if (L.Q) region(c, L.Q, 'second', kQ, 520);
    region(c, L.P, 'first', kP, 530, p.layout === 'same' ? 0 : 0);
    for (const z of f.zones ?? []) fillZone(c, z.at, z.col, z.k);
    if (L.labelQ) drawLabel(c, L.labelQ, 'second', kQ, f.pulseQ ?? 0);
    drawLabel(c, L.labelP, 'first', kP, f.pulseP ?? 0);
    // members
    const kT = S.k('tokens'), kS = S.k('sort');
    if (kT <= 0) return;
    const glow = new Map<number, { col: Paint; k: number }>(), cross = new Map<number, number>();
    for (const g of f.glow ?? []) if (g.k > 0) glow.set(g.i, g);
    for (const x of f.cross ?? []) if (x.k > 0) cross.set(x.i, x.k);
    for (let i = 0; i < n; i++) {
      const ka = E.smooth(lag(kT, i, n, 0.5));
      if (ka <= 0) continue;
      const ks = E.smooth(lag(kS, i, n, 0.55));
      const A = L.lineup[i]!, B = L.sorted[i]!;
      const x = lerp(A[0], B[0], ks), y = lerp(A[1], B[1], ks) - Math.sin(Math.PI * ks) * 26 + (1 - ka) * 20;
      const a = ka * (1 - 0.75 * clamp(f.fade?.[i] ?? 0));
      const gl = glow.get(i);
      if (gl) halo(c, x, y, gl.col, gl.k * a, !!p.tokens[i]!.shape);
      const t = p.tokens[i]!;
      if (t.shape) {
        shapeAt(c, t.shape, x, y - 16, a, 600 + i * 7);
        if (t.letter) drawWords(c, t.letter, x, y + 78, 'ink', a, { size: 44, align: 'center' });
      } else texDraw(c, Fs[i]!, x, y, { size: TOK, align: 'center', valign: 'center', col: 'ink', alpha: a });
      const kx = cross.get(i);
      if (kx) { const b = tokBox([x, y], i); strike(c, b.x0 - 4, b.y1 - 6, b.x1 + 4, b.y0 + 6, kx, { col: 'wrong' }); }
    }
  }
  function halo(c: Canvas, x: number, y: number, col: Paint, k: number, big: boolean): void {
    if (k <= 0) return;
    const { g } = c, r = big ? 96 : 46;
    g.save(); g.globalAlpha *= clamp(k);
    const rg = g.createRadialGradient(x, y, 4, x, y, r + 16);
    const hex = paint(th, col, 'fill');
    rg.addColorStop(0, hex + '66'); rg.addColorStop(1, hex + '00');
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, r + 16, 0, Math.PI * 2); g.fill();
    g.strokeStyle = hex; g.lineWidth = 4.5; g.shadowColor = hex; g.shadowBlur = 12;
    g.beginPath(); if (big) g.roundRect(x - 90, y - 92, 180, 198, 26); else g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    g.restore();
  }
  return {
    kind: 'Euler', layout: L,
    where: {
      token: i => tokBox(L.sorted[i]!, i),
      zone: z => L.zone[z] ?? box(0, 0, 0, 0),
      labelP: L.labelP.box, labelQ: L.labelQ?.box ?? null, P: L.P, Q: L.Q, domain: L.D,
    },
    draw,
  };
}
function unit(to: Pt, from: Pt, len: number): Pt {
  const dx = to[0] - from[0], dy = to[1] - from[1], l = Math.hypot(dx, dy) || 1;
  return [(dx / l) * len, (dy / l) * len];
}
