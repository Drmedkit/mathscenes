// ClearBalance: the model of THIS topic, the pan balance of two-step-equations / linear-equations with pieces.
// A fraction of a bag (teal, x each) is a bag cut into q strips with p of them there; a fraction of a ball (amber,
// 1 each) is a ball cut into q wedges. "Multiply every term on both sides by k" is k COPIES of each whole pan: still
// level, because both pans grew by the same factor. The pieces then gather into whole bags and balls, and from there
// the linear-equations SidesBalance (read-only import) takes over: take bags off both pans, balls off, split, open.
// Copying only SOME terms (focus.only) leaves the beam tipped: that is how the "scale only some terms" slip is shown.
//
// Steps: stand, pieces, copy, merge, then the SidesBalance steps takeX, takeN, split, keep, open.
import { type Box, type Pt, box, clamp, lag, lerp, unionBox } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, type Role, paint } from '../../../core/theme';
import { type Formula, tex, texDraw } from '../../../core/tex';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { BAG_H, BAG_W, MR, SIDES_FRAME, tiltAt } from '../linear-equations/sidesMaths';
import { SidesBalance, type SidesBlock, type SidesFocus, type SidesStep } from '../linear-equations/SidesBalance';
import { type CItem, type ClearLayout, clearLayout } from './clearLayout';
import type { ClearPic } from './msMaths';
export { pictureOf, picFits } from './clearLayout';

export type ClearStep = 'stand' | 'pieces' | 'copy' | 'merge' | SidesStep;
export type ClearRing = 'xL' | 'xR' | 'nL' | 'nR' | 'panL' | 'panR' | 'x' | 'n';
export interface ClearFocus {
  /** -1 … 1 before the merge (+ = the left pan down); default: level, or the cleared balance's tilt for no solution */
  tilt?: number;
  /** copy only these terms (a wrong move): 'x' = the bag pieces, 'n' = the ball pieces */
  only?: { L?: readonly ('x' | 'n')[]; R?: readonly ('x' | 'n')[] };
  rings?: readonly { at: ClearRing; col: Role; k: number }[];
  /** 0..1: the "× k" under each pan (text override: multAs) */
  mult?: number; multAs?: { L: string; R: string };
  /** the SidesBalance focus once the pieces have merged */
  sides?: SidesFocus;
}
export interface ClearBlock {
  readonly kind: 'ClearBalance';
  readonly pic: ClearPic;
  readonly layout: ClearLayout;
  readonly S: SidesBlock;
  readonly loose: boolean;
  /** boxes at rest (phase A) */
  readonly where: { panL: Box; panR: Box; xL: Box; xR: Box; nL: Box; nR: Box };
  draw(c: Canvas, P: Progress<ClearStep>, f?: ClearFocus): void;
}

const BAG = '#2C8F8C', MAX_TILT = (3.2 * Math.PI) / 180, MULT = 60;

export function ClearBalance(pic: ClearPic, th: Theme): ClearBlock {
  const L = clearLayout(pic), S = SidesBalance({ ...cleared4(L), loose: L.loose }, SIDES_FRAME, th);
  const sm = L.sm, SL = L.S;
  const FX = tex('x') as Formula;
  const multF: Record<string, Formula> = {};
  const mf = (t: string) => (multF[t] ??= tex(t) as Formula);
  const restTilt = sm.kind === 'none' ? tiltAt(sm, sm.x) : 0;

  // ---------- painters ----------
  function bagPts(x: number, y: number, s: number): Pt[] {
    const w = BAG_W * s, h = BAG_H * s, t = y - h / 2, b = y + h / 2;
    return [[x - w / 2 + 12 * s, b], [x + w / 2 - 12 * s, b], [x + w / 2, b - 20 * s], [x + w / 2, t + 38 * s], [x + w / 2 - 12 * s, t + 24 * s], [x + 10 * s, t + 14 * s], [x + 18 * s, t], [x - 18 * s, t], [x - 10 * s, t + 14 * s], [x - w / 2 + 12 * s, t + 24 * s], [x - w / 2, t + 38 * s], [x - w / 2, b - 20 * s]];
  }
  function ghostBag(c: Canvas, x: number, y: number, s: number, a: number): void {
    if (a <= 0) return;
    const { g } = c, P = bagPts(x, y, s);
    g.save(); g.globalAlpha *= clamp(a); g.setLineDash([7, 6]); g.strokeStyle = 'rgba(239,230,247,0.6)'; g.lineWidth = 2.4;
    g.beginPath(); P.forEach((q, k) => (k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.stroke(); g.restore();
  }
  function ghostBall(c: Canvas, x: number, y: number, s: number, a: number): void {
    if (a <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(a); g.setLineDash([5, 5]); g.strokeStyle = 'rgba(239,230,247,0.6)'; g.lineWidth = 2.2;
    g.beginPath(); g.arc(x, y, MR * s - 1, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  /** strip idx (may be fractional while it slides into its slot) of a bag cut into den strips */
  function bagStrip(c: Canvas, x: number, y: number, s: number, den: number, idx: number, seed: number, a: number, label: boolean): void {
    if (a <= 0) return;
    const { g } = c, w = BAG_W * s, x0 = x - w / 2 + (w * idx) / den;
    withAlpha(c, a, () => {
      g.save();
      if (den > 1) { g.beginPath(); g.rect(x0 - 0.5, y - BAG_H * s, w / den + 1, BAG_H * s * 2); g.clip(); }
      wash(c, bagPts(x, y, s), BAG, { seed: 40 + seed, inkW: 3 * Math.max(0.6, s), shade: 0.3, rough: 1.2 * s });
      if (den === 1 || label) inkLine(c, [[x - 13 * s, y - (BAG_H / 2) * s + 15 * s], [x + 13 * s, y - (BAG_H / 2) * s + 15 * s]], { col: DUSK.ink, w: 4 * s, seed: 60 + seed });
      if (den === 1) texDraw(c, FX, x, y + 14 * s, { size: 62 * s, align: 'center', col: '#101330' });
      g.restore();
      if (den > 1) {
        // the cut lines on both edges of the strip
        g.save(); g.strokeStyle = DUSK.ink; g.lineWidth = 2.6; g.globalAlpha *= 0.85;
        for (const xe of [x0, x0 + w / den]) { if (Math.abs(xe - (x - w / 2)) < 1 || Math.abs(xe - (x + w / 2)) < 1) continue; g.beginPath(); g.moveTo(xe, y - (BAG_H / 2) * s + 22 * s); g.lineTo(xe, y + (BAG_H / 2) * s - 3); g.stroke(); }
        g.restore();
      }
    });
  }
  function ballWedge(c: Canvas, x: number, y: number, s: number, den: number, idx: number, seed: number, a: number): void {
    if (a <= 0) return;
    const { g } = c, r = MR * s - 1, col = paint(th, 'first', 'fill');
    g.save(); g.globalAlpha *= clamp(a);
    const rg = g.createRadialGradient(x - r * 0.35, y - r * 0.4, 2, x, y, r + 1);
    rg.addColorStop(0, '#FFE2A8'); rg.addColorStop(0.45, col); rg.addColorStop(1, '#C27A1C');
    g.fillStyle = rg; g.strokeStyle = DUSK.ink; g.lineWidth = 2.6; g.lineJoin = 'round';
    g.beginPath();
    if (den === 1) g.arc(x, y, r, 0, Math.PI * 2);
    else { const a0 = -Math.PI / 2 + (2 * Math.PI * idx) / den, a1 = a0 + (2 * Math.PI) / den; g.moveTo(x, y); g.arc(x, y, r, a0, a1); g.closePath(); }
    g.fill(); g.stroke();
    if (den === 1) { g.beginPath(); g.arc(x, y, r + 0.6 * Math.sin(seed), 0, Math.PI * 2); g.stroke(); }
    g.restore();
  }
  function ring(c: Canvas, R: Box, col: Role, k: number): void {
    if (k <= 0 || R.w <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 14 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - 10, R.y0 - 10, R.w + 20, R.h + 20, 16); g.stroke(); g.restore();
  }
  const itemBox = (it: CItem, p: { x: number; y: number }, s: number): Box => (it.kind === 'bag'
    ? box(p.x - (BAG_W / 2) * s, p.y - (BAG_H / 2) * s, p.x + (BAG_W / 2) * s, p.y + (BAG_H / 2) * s)
    : box(p.x - MR * s, p.y - MR * s, p.x + MR * s, p.y + MR * s));

  function sideP(P: Progress<ClearStep>, stand: number, items: number): Progress<SidesStep> {
    return { k: st => (st === 'stand' ? stand : st === 'left' || st === 'right' ? items : P.k(st)) };
  }

  function draw(c: Canvas, P: Progress<ClearStep>, f: ClearFocus = {}): void {
    const kS = P.k('stand'), kP = clamp(P.k('pieces')), kC = clamp(P.k('copy')), kMraw = clamp(P.k('merge'));
    if (kMraw >= 0.999) { S.draw(c, sideP(P, kS, 1), f.sides); return; }
    const tilt = clamp(f.tilt ?? restTilt, -1, 1);
    S.draw(c, sideP(P, kS, 0), { tilt, labelsHide: 1 });
    if (kS <= 0) return;
    const ang = tilt * MAX_TILT, dyL = Math.sin(ang) * SL.half, dxE = (1 - Math.cos(ang)) * SL.half;
    const off = (side: 'L' | 'R') => (side === 'L' ? { dx: dxE, dy: dyL } : { dx: -dxE, dy: -dyL });
    const kM = E.smooth(clamp(kMraw / 0.75)), fade = clamp((kMraw - 0.75) / 0.25);
    const k = L.k;
    const copied = (side: 'L' | 'R', kind: 'bag' | 'ball') => { const o = f.only?.[side]; return !o || o.includes(kind === 'bag' ? 'x' : 'n'); };
    // per item: where it is now (A -> K by the copy step), its scale and alpha
    const state = L.items.map(it => {
      const j = it.copy;
      const kj = j === 0 ? E.smooth(kC) : E.smooth(lag(kC, j - 1, Math.max(1, k - 1), 0.35));
      const vis = j === 0 ? E.smooth(kP) : copied(it.side, it.kind) ? clamp(kj * 2.5) : 0;
      const o = off(it.side), drop = j === 0 ? (1 - E.smooth(kP)) * 40 : 0;
      const sc = lerp(1, L.s, E.smooth(kC));
      return { x: lerp(it.A.x, it.K.x, kj) + o.dx, y: lerp(it.A.y, it.K.y, kj) + o.dy - drop, s: sc, a: vis };
    });
    const live: Record<string, Box[]> = { xL: [], xR: [], nL: [], nR: [] };
    // while the copies stand apart, a dashed frame around each copy says "one copy of the whole pan"
    const kFrame = clamp(kC * 3) * (1 - kM);
    if (kFrame > 0 && k > 1) for (const side of ['L', 'R'] as const) for (let j = 0; j < k; j++) {
      const ids = L.items.map((it, i) => i).filter(i => L.items[i]!.side === side && L.items[i]!.copy === j && state[i]!.a > 0);
      if (!ids.length) continue;
      const B = unionBox(ids.map(i => itemBox(L.items[i]!, state[i]!, state[i]!.s)));
      const a = kFrame * Math.min(...ids.map(i => state[i]!.a));
      const { g } = c;
      g.save(); g.globalAlpha *= a * 0.75; g.setLineDash([8, 7]); g.strokeStyle = paint(th, 'pick', 'line'); g.lineWidth = 2.4;
      g.beginPath(); g.roundRect(B.x0 - 7, B.y0 - 5, B.w + 14, B.h + 10, 12); g.stroke(); g.restore();
    }
    withAlpha(c, 1 - fade, () => {
      // dashed outlines of the cut items (they fade while the pieces gather)
      L.items.forEach((it, i) => {
        const st = state[i]!;
        if (it.slots < it.den && st.a > 0) (it.kind === 'bag' ? ghostBag : ghostBall)(c, st.x, st.y, st.s, st.a * (1 - kM));
      });
      for (const sl of L.slices) {
        const it = L.items[sl.item]!, st = state[sl.item]!;
        if (st.a <= 0) continue;
        const o = off(sl.side);
        const x = lerp(st.x, sl.W.x + o.dx, kM), y = lerp(st.y, sl.W.y + o.dy, kM), s = lerp(st.s, 1, kM), idx = lerp(sl.idx, sl.slot, kM);
        if (sl.kind === 'bag') bagStrip(c, x, y, s, sl.den, idx, it.seed, st.a, sl.den > 1 && Math.round(idx) === Math.floor(sl.den / 2));
        else ballWedge(c, x, y, s, sl.den, idx, it.seed, st.a);
        live[(sl.kind === 'bag' ? 'x' : 'n') + sl.side]!.push(itemBox(it, { x, y }, s));
      }
    });
    // "× k" under each pan
    const km = clamp(f.mult ?? 0);
    if (km > 0) for (const side of ['L', 'R'] as const) {
      const pan = side === 'L' ? SL.panL : SL.panR, o = off(side);
      texDraw(c, mf(f.multAs?.[side] ?? `\\times ${k}`), pan.cx + o.dx, SL.labelY + 6, { size: MULT, align: 'center', col: 'pick', alpha: km * (1 - fade) });
    }
    for (const R of f.rings ?? []) {
      const B = R.at === 'panL' ? [...live.xL!, ...live.nL!] : R.at === 'panR' ? [...live.xR!, ...live.nR!] : R.at === 'x' ? [...live.xL!, ...live.xR!] : R.at === 'n' ? [...live.nL!, ...live.nR!] : live[R.at]!;
      if (R.at === 'x' || R.at === 'n') { for (const sd of ['L', 'R']) { const bs = live[R.at + sd]!; if (bs.length) ring(c, unionBox(bs), R.col, R.k); } }
      else if (B.length) ring(c, unionBox(B), R.col, R.k);
    }
    if (fade > 0) withAlpha(c, fade, () => S.draw(c, sideP(P, kS, 1), { ...f.sides, tilt, labelsHide: 1 }));
  }
  const restBox = (side: 'L' | 'R', kind?: 'bag' | 'ball') => {
    const bs = L.items.filter(it => it.copy === 0 && it.side === side && (!kind || it.kind === kind)).map(it => itemBox(it, it.A, 1));
    return bs.length ? unionBox(bs) : box(0, 0, 0, 0);
  };
  return {
    kind: 'ClearBalance', pic, layout: L, S, loose: L.loose,
    where: { panL: restBox('L'), panR: restBox('R'), xL: restBox('L', 'bag'), xR: restBox('R', 'bag'), nL: restBox('L', 'ball'), nR: restBox('R', 'ball') },
    draw,
  };
}
function cleared4(L: ClearLayout) { return { a: L.sm.a, b: L.sm.b, c: L.sm.c, d: L.sm.d }; }
