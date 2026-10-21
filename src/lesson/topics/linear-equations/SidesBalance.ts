// SidesBalance: the model of a linear equation with the unknown on BOTH sides, as a pan balance (maths and layout in
// sidesMaths.ts). Bags (teal, x marbles each) and loose marbles (amber) sit on both pans of one beam; the beam is level
// exactly when both sides are equal. Taking the same bags off both pans (subtracting an x-term from both sides) keeps
// a level beam level, which is the new idea of this topic. Opening the bags with a value v shows both pan totals and
// tips the beam by their difference, so "is v a solution?" is something you see; a value strip on the table collects
// every v tried (lime = level). Moves on ONE pan only (focus.gone) tip the beam: that is how wrong moves are shown.
//
// Steps: stand, left, right, takeX, takeN, split, keep, open.
import { type Box, type Pt, box, clamp, lag, lerp, unionBox } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, type Role, paint } from '../../../core/theme';
import { type Formula, tex, texDraw } from '../../../core/tex';
import { type Frame } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { drawWords, wordsBox } from '../../words';
import { BAG_H, BAG_W, MR, ROW_H, STRIP_FROM, STRIP_TO, type PanLayout, type Pos, type SidesLayout, type SidesMaths, type SidesParams, bagBox, computeSides, marbleBox, sidesLayout, tiltAt } from './sidesMaths';
export { computeSides, sidesFit, tiltAt, panTotals } from './sidesMaths';

export type SidesStep = 'stand' | 'left' | 'right' | 'takeX' | 'takeN' | 'split' | 'keep' | 'open';
export const SIDES_STEPS: readonly SidesStep[] = ['stand', 'left', 'right', 'takeX', 'takeN', 'split', 'keep', 'open'];
export type RingAt = 'bagsL' | 'bagsR' | 'marL' | 'marR' | 'takenX' | 'takenN' | 'row0' | 'share' | 'panL' | 'panR';
export interface LabelPart { t: string; col: Role }
export interface StripState { marks: Readonly<Record<number, 'ok' | 'no'>>; cur?: number | null; k: number }
export interface SidesFocus {
  /** -1 … 1 (+ tips the left pan down); default: from the bag value when the bags are open, else level / the kind */
  tilt?: number;
  /** what the open bags hold (default: the solution) */
  v?: number;
  /** items removed from ONE side (a wrong move): they fade to a dashed ghost */
  gone?: { bagsL?: readonly number[]; bagsR?: readonly number[]; marL?: readonly number[]; marR?: readonly number[]; k: number };
  rings?: readonly { at: RingAt; col: Role; k: number }[];
  labelL?: number; labelR?: number;
  labelsAs?: { L: readonly LabelPart[]; R: readonly LabelPart[]; k: number };
  labelsHide?: number;
  strip?: StripState;
}
export interface SidesBlock {
  readonly kind: 'SidesBalance';
  readonly maths: SidesMaths;
  readonly layout: SidesLayout;
  readonly where: { bagsL: Box; bagsR: Box; marL: Box; marR: Box; share: Box; row0: Box; labelL: Box; labelR: Box; strip: Box };
  /** the tilt the beam shows with value v in the bags */
  tiltAt(v: number): number;
  draw(c: Canvas, P: Progress<SidesStep>, f?: SidesFocus): void;
}

const PEWTER = '#7C82B0', PEWTER_D = '#5A5F8C', BAG = '#2C8F8C', MAX_TILT = (3.2 * Math.PI) / 180;
const LABEL = 50;

export function SidesBalance(p: SidesParams, fr: Frame, th: Theme): SidesBlock {
  const m = computeSides(p), L = sidesLayout(m, fr);
  const FX = tex('x') as Formula;
  const valF = new Map<number, Formula>();
  const FV = (v: number) => { let F = valF.get(v); if (!F) { F = tex(String(v)) as Formula; valF.set(v, F); } return F; };
  const bagsW = (n: number) => `${n} ${n === 1 ? 'bag' : 'bags'}`;

  // ---------- labels under the pans: what each pan holds now ----------
  function holds(bags: number, mar: number): LabelPart[] {
    const out: LabelPart[] = [];
    if (bags) out.push({ t: bagsW(bags), col: 'second' });
    if (mar || !bags) out.push({ t: (bags ? ' + ' : '') + mar, col: 'first' });
    return out;
  }
  function labels(stage: number): [LabelPart[], LabelPart[]] {
    if (stage === 0) return [holds(m.a, m.b), holds(m.c, m.d)];
    if (stage === 1) return [holds(m.a - m.tx, m.b), holds(m.c - m.tx, m.d)];
    if (stage === 2) return [holds(m.aL, m.bL), holds(m.aR, m.bR)];
    return m.bagSide === 'L' ? [holds(1, 0), holds(0, m.per)] : [holds(0, m.per), holds(1, 0)];
  }
  const partsBox = (parts: readonly LabelPart[], cx: number, y: number): Box => {
    const w = parts.reduce((s, q) => s + wordsBox(q.t, 0, 0, { size: LABEL }).w, 0);
    return box(cx - w / 2, y - LABEL * 0.42, cx + w / 2, y + LABEL * 0.42);
  };
  function drawParts(c: Canvas, parts: readonly LabelPart[], cx: number, y: number, a: number): void {
    const B = partsBox(parts, cx, y);
    let x = B.x0;
    for (const q of parts) { drawWords(c, q.t, x, y, q.col, a, { size: LABEL }); x += wordsBox(q.t, 0, 0, { size: LABEL }).w; }
  }
  const [l0, r0] = labels(0);
  const labelL = partsBox(l0, L.panL.cx, L.labelY), labelR = partsBox(r0, L.panR.cx, L.labelY);

  // ---------- painters ----------
  function marble(c: Canvas, x: number, y: number, seed: number, a: number): void {
    if (a <= 0) return;
    const { g } = c, col = paint(th, 'first', 'fill');
    g.save(); g.globalAlpha *= clamp(a);
    const rg = g.createRadialGradient(x - MR * 0.35, y - MR * 0.4, 2, x, y, MR);
    rg.addColorStop(0, '#FFE2A8'); rg.addColorStop(0.45, col); rg.addColorStop(1, '#C27A1C');
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, MR - 1, 0, Math.PI * 2); g.fill();
    g.strokeStyle = DUSK.ink; g.lineWidth = 2.6; g.beginPath(); g.arc(x, y, MR - 1 + 0.6 * Math.sin(seed), 0, Math.PI * 2); g.stroke();
    g.restore();
  }
  function ghost(c: Canvas, P: Pt[] | null, x: number, y: number, a: number): void {
    if (a <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(a); g.setLineDash([6, 6]); g.strokeStyle = 'rgba(239,230,247,0.55)'; g.lineWidth = 2.2;
    g.beginPath();
    if (P) { P.forEach((q, k) => (k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); } else g.arc(x, y, MR - 2, 0, Math.PI * 2);
    g.stroke(); g.restore();
  }
  function bagPts(x: number, y: number): Pt[] {
    const w = BAG_W, h = BAG_H, t = y - h / 2, b = y + h / 2;
    return [[x - w / 2 + 12, b], [x + w / 2 - 12, b], [x + w / 2, b - 20], [x + w / 2, t + 38], [x + w / 2 - 12, t + 24], [x + 10, t + 14], [x + 18, t], [x - 18, t], [x - 10, t + 14], [x - w / 2 + 12, t + 24], [x - w / 2, t + 38], [x - w / 2, b - 20]];
  }
  function bag(c: Canvas, x: number, y: number, i: number, a: number, open: number, v: number): void {
    if (a <= 0) return;
    withAlpha(c, a, () => {
      wash(c, bagPts(x, y), BAG, { seed: 40 + i, inkW: 3, shade: 0.3, rough: 1.3 });
      inkLine(c, [[x - 13, y - BAG_H / 2 + 15], [x + 13, y - BAG_H / 2 + 15]], { col: DUSK.ink, w: 4, seed: 60 + i });
      const ty = y + 14;
      if (open < 1) texDraw(c, FX, x, ty, { size: 62, align: 'center', col: '#101330', alpha: 1 - open });
      if (open > 0) texDraw(c, FV(v), x, ty, { size: 62, align: 'center', col: '#101330', alpha: open });
    });
  }
  function ring(c: Canvas, R: Box, col: Role, k: number, r = 16): void {
    if (k <= 0 || R.w <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 14 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - 10, R.y0 - 10, R.w + 20, R.h + 20, r); g.stroke();
    g.restore();
  }
  function pan(c: Canvas, cx: number, y: number, seed: number): void {
    const w = L.panL.w;
    wash(c, [[cx - w / 2, y], [cx + w / 2, y], [cx + w / 2 - 36, y + 30], [cx - w / 2 + 36, y + 30]], PEWTER, { seed, inkW: 3, shade: 0.4, rough: 1.2 });
  }
  function pulse(c: Canvas, B: Box, col: Role, k: number): void {
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.2; g.fillStyle = paint(th, col, 'fill');
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.fill(); g.restore();
    ring(c, box(B.x0 - 2, B.y0 + 2, B.x1 + 2, B.y1 - 2), col, k, 14);
  }

  // ---------- the value strip ----------
  const stripNums = Array.from({ length: STRIP_TO - STRIP_FROM + 1 }, (_, i) => STRIP_FROM + i);
  function drawStrip(c: Canvas, s: StripState): void {
    const k = clamp(s.k);
    if (k <= 0) return;
    const { g } = c, S = L.strip, y = L.stripY;
    withAlpha(c, k, () => {
      wash(c, [[S.x0, S.y0], [S.x1, S.y0], [S.x1, S.y1], [S.x0, S.y1]], '#1A1D3D', { seed: 91, rough: 1.2, ink: '#3A3F6B', inkW: 2.5, shade: 0.15 });
      texDraw(c, FX, S.x0 + 46, y + 34, { size: 62, align: 'left', col: 'second' });
      g.save(); g.strokeStyle = paint(th, 'dim', 'line'); g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(L.stripX(STRIP_FROM) - 30, y); g.lineTo(L.stripX(STRIP_TO) + 30, y); g.stroke();
      for (const v of stripNums) { const x = L.stripX(v); g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x, y + 12); g.stroke(); }
      g.restore();
      for (const v of stripNums) texDraw(c, FV(v), L.stripX(v), y + 76, { size: 60, align: 'center', col: s.marks[v] === 'ok' ? 'link' : 'dim' });
      for (const v of stripNums) {
        const mk = s.marks[v], x = L.stripX(v);
        if (mk === 'ok') { g.save(); g.fillStyle = paint(th, 'link', 'fill'); g.beginPath(); g.arc(x, y, 15, 0, Math.PI * 2); g.fill(); g.strokeStyle = DUSK.ink; g.lineWidth = 2.5; g.stroke(); g.restore(); }
        else if (mk === 'no') { g.save(); g.fillStyle = '#1A1D3D'; g.strokeStyle = paint(th, 'dim', 'line'); g.lineWidth = 3.5; g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore(); }
      }
      if (s.cur !== null && s.cur !== undefined) {
        const x = L.stripX(s.cur);
        g.save(); g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 3; g.beginPath(); g.arc(x, y, 24, 0, Math.PI * 2); g.stroke(); g.restore();
      }
    });
  }

  // ---------- the scene ----------
  function draw(c: Canvas, P: Progress<SidesStep>, f: SidesFocus = {}): void {
    const kS = P.k('stand'), kL = P.k('left'), kR = P.k('right'), kX = E.smooth(clamp(P.k('takeX'))), kN = E.smooth(clamp(P.k('takeN')));
    const kSp = E.smooth(clamp(P.k('split'))), kK = P.k('keep'), kO = clamp(P.k('open'));
    const v = f.v ?? m.x;
    const autoTilt = kO > 0 ? tiltAt(m, v) * E.smooth(kO) : m.kind === 'none' ? tiltAt(m, m.x) : 0;
    const a = clamp(f.tilt ?? autoTilt, -1, 1) * MAX_TILT;
    const dyL = Math.sin(a) * L.half, dyR = -dyL, dxE = (1 - Math.cos(a)) * L.half;
    const gk = clamp(f.gone?.k ?? 0);
    const gone = { bagsL: new Set(f.gone?.bagsL ?? []), bagsR: new Set(f.gone?.bagsR ?? []), marL: new Set(f.gone?.marL ?? []), marR: new Set(f.gone?.marR ?? []) };
    if (kS <= 0) return;
    withAlpha(c, kS, () => {
      const cx = L.cx, pv = L.pivot;
      wash(c, [[cx, pv - 6], [cx + 86, L.table + 2], [cx - 86, L.table + 2]], PEWTER_D, { seed: 3, inkW: 3, shade: 0.45, rough: 1.2 });
      const hl = L.half + 38, ca = Math.cos(a), sa = Math.sin(a), t = 10;
      const beamR: Pt[] = ([[-hl, -t], [hl, -t], [hl, t], [-hl, t]] as [number, number][]).map(([u, w]) => [cx + u * ca + w * sa, pv - u * sa + w * ca] as Pt);
      wash(c, beamR, PEWTER, { seed: 5, inkW: 3, shade: 0.35, rough: 0.8 });
      c.g.save(); c.g.fillStyle = DUSK.cream; c.g.beginPath(); c.g.arc(cx, pv, 7, 0, Math.PI * 2); c.g.fill(); c.g.restore();
      for (const [px, dy, s] of [[L.panL.cx + dxE, dyL, 11], [L.panR.cx - dxE, dyR, 13]] as const) {
        inkLine(c, [[px, L.floor + 28 + dy], [px, L.pivot + dy - 6]], { col: PEWTER_D, w: 11, seed: s });
        inkLine(c, [[px, L.floor + 28 + dy], [px, L.pivot + dy - 6]], { col: DUSK.ink, w: 2.5, seed: s + 1, alpha: 0.5 });
        pan(c, px, L.floor + dy, s + 20);
      }
    });
    // share separators (split), on both pans
    if (kSp > 0 && m.canSplit) for (let i = 0; i < m.p - 1; i++) {
      const y = L.floor - 8 - ROW_H * (i + 1);
      for (const [P0, dy] of [[L.panL, dyL], [L.panR, dyR]] as const) {
        c.g.save(); c.g.globalAlpha *= kSp * (1 - 0.75 * kK); c.g.setLineDash([12, 10]); c.g.strokeStyle = 'rgba(239,230,247,0.5)'; c.g.lineWidth = 2.5;
        c.g.beginPath(); c.g.moveTo(P0.x0 + 18, y + dy); c.g.lineTo(lerp(P0.x0 + 18, P0.x1 - 18, kSp), y + dy); c.g.stroke(); c.g.restore();
      }
    }
    const keepA = (y: number) => (kK > 0 && m.canSplit && Math.abs(y - L.rowY(0)) > 4 ? 1 - 0.84 * clamp(kK) : 1);
    const kB = E.smooth(clamp((kX - 0.45) / 0.55));
    const pos = (A: Pos, Bp: Pos, C: Pos): Pos => { const b = { x: lerp(A.x, Bp.x, kB), y: lerp(A.y, Bp.y, kB) }; return { x: lerp(b.x, C.x, kSp), y: lerp(b.y, C.y, kSp) }; };
    const panItems = (Pn: PanLayout, side: 'L' | 'R', kIn: number, dy: number, bags: number, mars: number) => {
      const gB = side === 'L' ? gone.bagsL : gone.bagsR, gM = side === 'L' ? gone.marL : gone.marR;
      for (let i = 0; i < bags; i++) {
        const ki = E.smooth(lag(kIn, i, bags + 1, 0.4));
        if (ki <= 0) continue;
        const C = Pn.bagC[i]!, q = pos(Pn.bagA[i]!, Pn.bagB[i]!, C), tk = Pn.takenBags.includes(i) ? kX : 0, g0 = gB.has(i) ? gk : 0;
        const al = ki * (Pn.takenBags.includes(i) ? 1 : keepA(C.y)) * (1 - clamp((tk - 0.35) / 0.65)) * (1 - 0.88 * g0);
        if (g0 > 0) ghost(c, bagPts(q.x, q.y + dy), 0, 0, g0);
        bag(c, q.x + (side === 'L' ? -1 : 1) * tk * 40, q.y + dy - tk * 150 - (1 - ki) * 40, i + (side === 'L' ? 0 : 10), al, kO, v);
      }
      for (let k = 0; k < mars; k++) {
        const kk = E.smooth(lag(kIn, bags, bags + 1, 0.4) * 0.6 + 0.4 * lag(kIn, k, mars, 0.25));
        if (kk <= 0) continue;
        const C = Pn.marC[k]!, q = pos(Pn.marA[k]!, Pn.marB[k]!, C), tk = Pn.takenMar.includes(k) ? kN : 0, g0 = gM.has(k) ? gk : 0;
        const al = kk * (Pn.takenMar.includes(k) ? 1 : keepA(C.y)) * (1 - clamp((tk - 0.35) / 0.65)) * (1 - 0.88 * g0);
        if (g0 > 0) ghost(c, null, q.x, q.y + dy, g0);
        marble(c, q.x + (side === 'L' ? -1 : 1) * tk * 40, q.y + dy - tk * 150 - (1 - kk) * 40, k + (side === 'L' ? 0 : 100), al);
      }
    };
    panItems(L.L, 'L', kL, dyL, m.a, m.b);
    panItems(L.R, 'R', kR, dyR, m.c, m.d);
    for (const R of f.rings ?? []) ring(c, ringBox(R.at, kSp), R.col, R.k);
    // labels: what each pan holds now (they swap at the middle of a move); totals when the bags are open
    const stage = kK >= 0.5 && m.canSplit ? 3 : kN >= 0.5 ? 2 : kX >= 0.5 ? 1 : 0;
    const near = (k: number) => (k > 0 && k < 1 ? Math.abs(2 * k - 1) : 1);
    const la = kS * Math.min(near(kX), near(kN), near(clamp(kK))) * (1 - clamp(f.labelsHide ?? 0));
    let [pl, pr] = labels(stage);
    if (kO >= 0.5) {
      // totals on each pan now (the takes removed the same from both)
      const rem = (side: 'L' | 'R') => {
        const bags = side === 'L' ? (stage >= 1 ? m.a - m.tx : m.a) : (stage >= 1 ? m.c - m.tx : m.c);
        const mars = side === 'L' ? (stage >= 2 ? m.bL : m.b) : (stage >= 2 ? m.bR : m.d);
        return bags * v + mars;
      };
      pl = [{ t: String(rem('L')), col: 'first' }]; pr = [{ t: String(rem('R')), col: 'first' }];
    }
    const lao = kO > 0 && kO < 1 ? near(kO) : 1;
    if ((f.labelL ?? 0) > 0) pulse(c, partsBox(pl, L.panL.cx, L.labelY), 'second', f.labelL!);
    if ((f.labelR ?? 0) > 0) pulse(c, partsBox(pr, L.panR.cx, L.labelY), 'first', f.labelR!);
    const ko = clamp(f.labelsAs?.k ?? 0);
    drawParts(c, pl, L.panL.cx, L.labelY, la * lao * Math.max(kL, 0) * (1 - ko));
    drawParts(c, pr, L.panR.cx, L.labelY, la * lao * Math.max(kR, 0) * (1 - ko));
    if (ko > 0) { drawParts(c, f.labelsAs!.L, L.panL.cx, L.labelY, ko * kS); drawParts(c, f.labelsAs!.R, L.panR.cx, L.labelY, ko * kS); }
    if (f.strip) drawStrip(c, f.strip);
  }
  const live = (A: Pos[], C: Pos[], ids: number[], kSp: number) => ids.map(i => ({ x: lerp(A[i]!.x, C[i]!.x, kSp), y: lerp(A[i]!.y, C[i]!.y, kSp) }));
  const all = (n: number) => Array.from({ length: n }, (_, i) => i);
  const notIn = (n: number, t: number[]) => all(n).filter(i => !t.includes(i));
  const rowOf = (Pn: PanLayout, which: 'bag' | 'mar', i: number) => (which === 'bag' ? notIn(Pn.bagA.length, Pn.takenBags) : notIn(Pn.marA.length, Pn.takenMar)).filter(j => Math.abs((which === 'bag' ? Pn.bagC[j]! : Pn.marC[j]!).y - L.rowY(i)) < 4);
  function ringBox(at: RingAt, kSp: number): Box {
    const z = box(0, 0, 0, 0);
    const bagSide = m.bagSide === 'L' ? L.L : L.R, marSide = m.bagSide === 'L' ? L.R : L.L;
    switch (at) {
      case 'bagsL': return m.a ? bagBox(live(L.L.bagA, L.L.bagC, all(m.a), kSp)) : z;
      case 'bagsR': return m.c ? bagBox(live(L.R.bagA, L.R.bagC, all(m.c), kSp)) : z;
      case 'marL': return m.b ? marbleBox(live(L.L.marA, L.L.marC, all(m.b), kSp)) : z;
      case 'marR': return m.d ? marbleBox(live(L.R.marA, L.R.marC, all(m.d), kSp)) : z;
      case 'takenX': return m.tx ? unionBox([bagBox(L.L.takenBags.map(i => L.L.bagA[i]!)), bagBox(L.R.takenBags.map(i => L.R.bagA[i]!))]) : z;
      case 'takenN': return m.tn ? unionBox([marbleBox(L.L.takenMar.map(i => L.L.marB[i]!)), marbleBox(L.R.takenMar.map(i => L.R.marB[i]!))]) : z;
      case 'share': { const ids = rowOf(marSide, 'mar', 0); return ids.length ? marbleBox(ids.map(i => marSide.marC[i]!)) : z; }
      case 'row0': { const b = rowOf(bagSide, 'bag', 0), s = rowOf(marSide, 'mar', 0); return b.length && s.length ? unionBox([bagBox(b.map(i => bagSide.bagC[i]!)), marbleBox(s.map(i => marSide.marC[i]!))]) : z; }
      case 'panL': return unionBox([...(m.a ? [bagBox(L.L.bagA)] : []), ...(m.b ? [marbleBox(L.L.marA)] : [])]);
      case 'panR': return unionBox([...(m.c ? [bagBox(L.R.bagA)] : []), ...(m.d ? [marbleBox(L.R.marA)] : [])]);
    }
  }
  return {
    kind: 'SidesBalance', maths: m, layout: L,
    where: {
      bagsL: ringBox('bagsL', 0), bagsR: ringBox('bagsR', 0), marL: ringBox('marL', 0), marR: ringBox('marR', 0),
      share: ringBox('share', 1), row0: ringBox('row0', 1), labelL, labelR, strip: L.strip,
    },
    tiltAt: (v: number) => tiltAt(m, v),
    draw,
  };
}
