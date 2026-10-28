// Nest: the picture of the law of syllogism. "If p, then q" puts region P inside Q; "if q, then r" puts Q inside R.
// So P sits inside R: "if p, then r". In the chain layout three regions nest (P in Q in R). In the fork layout the
// middle terms do not match (p -> q and r -> q): P and R both sit inside Q, side by side, and nothing ties P to R.
// A member can stand in P and glow its way out through Q to R.
//
// Steps: R, Q, P (each region and its label), member, glow (the conclusion: the member lights up P's way to R).
// Focus: ring ('P', 'Q', 'R' region outlines brighter), cross (a red strike over the gap between P and R, fork layout).
// Could move to the kit with Euler: nested regions for chains of conditionals / subsets.
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, strike } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { rectPts } from '../../../core/pts';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { drawWords } from '../../words';
import { estW } from '../conditional-statements/eulerLayout';

export interface NestParams {
  layout: 'chain' | 'fork';
  /** region labels (words) */
  P: string; Q: string; R: string;
  /** the member's name (words), drawn inside P */
  member?: string;
}
export type NestStep = 'R' | 'Q' | 'P' | 'member' | 'glow';
export interface NestFocus { ring?: Partial<Record<'P' | 'Q' | 'R', number>>; cross?: number }
export interface NestBlock { readonly kind: 'Nest'; readonly where: { P: Box; Q: Box; R: Box }; draw(c: Canvas, S: Progress<NestStep>, f?: NestFocus): void }
const NAME = 'Nest', LBL = 44, RAD = 40;
const COL: Record<'P' | 'Q' | 'R', Paint> = { P: 'first', Q: 'second', R: 'pick' };

function wrap(t: string, w: number): string[] {
  const out: string[] = []; let cur = '';
  for (const word of t.split(' ')) { const nx = cur ? cur + ' ' + word : word; if (cur && estW(nx, LBL) > w) { out.push(cur); cur = word; } else cur = nx; }
  if (cur) out.push(cur);
  return out;
}

export function Nest(p: NestParams, fr: Frame, th: Theme): NestBlock {
  const outer = box(fr.x + 6, fr.y + 6, fr.x + fr.w - 6, fr.y + fr.h - 6);
  let P: Box, Q: Box, Rb: Box;
  const band = (lines: number) => lines * 54 + 34;
  if (p.layout === 'chain') {
    Rb = outer;
    const lr = wrap(p.R, Rb.w - 80);
    Q = box(Rb.x0 + 40, Rb.y0 + band(lr.length), Rb.x1 - 40, Rb.y1 - 40);
    const lq = wrap(p.Q, Q.w - 80);
    P = box(Q.x0 + 40, Q.y0 + band(lq.length), Q.x1 - 40, Q.y1 - 40);
  } else {
    Q = outer;
    const lq = wrap(p.Q, Q.w - 80);
    const top = Q.y0 + band(lq.length), w = (Q.w - 120) / 2;
    P = box(Q.x0 + 40, top, Q.x0 + 40 + w, Q.y1 - 40);
    Rb = box(Q.x1 - 40 - w, top, Q.x1 - 40, Q.y1 - 40);
  }
  const L = { P: wrap(p.P, P.w - 70), Q: wrap(p.Q, Q.w - 80), R: wrap(p.R, Rb.w - 80) };
  for (const k of ['P', 'Q', 'R'] as const) {
    check(L[k].length <= 2, NAME, `the label "${p[k]}" needs more than two lines`);
    check(L[k].every(l => estW(l, LBL) <= ({ P, Q, R: Rb })[k].w - 60), NAME, `the label "${p[k]}" is too wide`);
  }
  check(P.h - band(L.P.length) >= (p.member ? 110 : 40), NAME, 'region P has no room');
  const memberAt: [number, number] = [P.cx, P.y0 + band(L.P.length) + (P.h - band(L.P.length)) / 2];

  function region(c: Canvas, b: Box, col: Paint, k: number, seed: number, ring = 0): void {
    if (k <= 0) return;
    const a = E.smooth(clamp(k));
    wash(c, rectPts(b.x0, b.y0, b.w, b.h, RAD), col, { seed, rough: 1.6, ink: null, alpha: 0.18 * a, shade: 0.05 });
    inkLine(c, rectPts(b.x0, b.y0, b.w, b.h, RAD), { col: paint(th, col, 'line'), w: 4 + 3 * clamp(ring), closed: true, seed: seed + 1, rough: 0.7, alpha: a });
  }
  function draw(c: Canvas, S: Progress<NestStep>, f: NestFocus = {}): void {
    const boxes = { P, Q, R: Rb };
    const order: ('P' | 'Q' | 'R')[] = p.layout === 'chain' ? ['R', 'Q', 'P'] : ['Q', 'P', 'R'];
    order.forEach((k, i) => {
      const kk = S.k(k);
      region(c, boxes[k], COL[k], kk, 700 + 10 * i, f.ring?.[k] ?? 0);
      if (kk > 0) L[k].forEach((t, j) => drawWords(c, t, boxes[k].x0 + 30, boxes[k].y0 + 44 + j * 54, COL[k], kk, { size: LBL }));
    });
    const kM = S.k('member');
    if (p.member && kM > 0) {
      const kG = clamp(S.k('glow')), { g } = c, [x, y] = memberAt;
      g.save(); g.globalAlpha *= clamp(kM);
      if (kG > 0) {
        g.strokeStyle = paint(th, 'link', 'fill'); g.lineWidth = 5; g.shadowColor = paint(th, 'link', 'fill'); g.shadowBlur = 16 * kG; g.globalAlpha *= kG;
        g.beginPath(); g.roundRect(P.x0 - 4, P.y0 - 4, P.w + 8, P.h + 8, RAD); g.stroke();
        g.globalAlpha /= kG;
      }
      g.restore();
      drawWords(c, p.member, x, y, 'ink', kM, { size: 50, align: 'center', weight: 700 });
    }
    if ((f.cross ?? 0) > 0 && p.layout === 'fork') {
      const mx = (P.x1 + Rb.x0) / 2;
      strike(c, mx - 60, P.cy - 60, mx + 60, P.cy + 60, f.cross!, { col: 'wrong' });
    }
  }
  return { kind: 'Nest', where: { P, Q, R: Rb }, draw };
}
