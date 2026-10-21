// Balance: the model of a two-step equation as a pan balance (see balanceMaths.ts for the maths and the layout).
// Bags (teal, the x's) and marbles (amber, the numbers) sit on two pans of one beam. The beam is level exactly when
// both sides are equal, so "do the same to both sides" is something you SEE: take q off both pans (still level),
// split both pans into p equal rows and keep one (still level), open a bag (it holds x). A move on one side only
// (focus.gone) tips the beam (focus.tilt), which is how a wrong step is shown.
//
// Steps: stand, left, right, take, split, keep, open.
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
import { BAG_H, BAG_W, type BalanceLayout, type BalanceMaths, type BalanceParams, MR, type Pos, ROW_H, bagBox, balanceLayout, computeBalance, marbleBox } from './balanceMaths';
export { balanceFits, computeBalance } from './balanceMaths';

export type BalanceStep = 'stand' | 'left' | 'right' | 'take' | 'split' | 'keep' | 'open';
export const BALANCE_STEPS: readonly BalanceStep[] = ['stand', 'left', 'right', 'take', 'split', 'keep', 'open'];
export type RingAt = 'bags' | 'left' | 'right' | 'takenL' | 'takenR' | 'keptR' | 'row0' | 'leftRow0' | 'rightRow0' | 'goneBags' | 'goneR';
export interface BalanceFocus {
  /** -1 … 1: + tips the left pan down, - the right pan (a move on one side only) */
  tilt?: number;
  /** items removed from ONE side (a wrong move): they fade to a dashed ghost */
  gone?: { bags?: readonly number[]; left?: readonly number[]; right?: readonly number[]; k: number };
  rings?: readonly { at: RingAt; col: Role; k: number }[];
  /** pulses of the pan labels while their symbol writes on the board */
  labelL?: number; labelR?: number;
  /** what the pan labels say instead (a wrong move on one side), with its fade-in 0..1 */
  labelsAs?: { L: readonly LabelPart[]; R: readonly LabelPart[]; k: number };
  /** 0..1: fade the pan labels out (while the kid has to find the count) */
  labelsHide?: number;
}
export interface LabelPart { t: string; col: Role }
export interface BalanceBlock {
  readonly kind: 'Balance';
  readonly maths: BalanceMaths;
  readonly layout: BalanceLayout;
  /** boxes at rest (level beam) for leaders and rings */
  readonly where: { bags: Box; left: Box; right: Box; takenL: Box; takenR: Box; keptR: Box; leftRow(i: number): Box; rightRow(i: number): Box; share: Box; labelL: Box; labelR: Box };
  draw(c: Canvas, P: Progress<BalanceStep>, f?: BalanceFocus): void;
}

const PEWTER = '#7C82B0', PEWTER_D = '#5A5F8C', BAG = '#2C8F8C', MAX_TILT = (3 * Math.PI) / 180;
const LABEL = 50;

export function Balance(p: BalanceParams, fr: Frame, th: Theme): BalanceBlock {
  const m = computeBalance(p), L = balanceLayout(m, fr);
  const FX = tex('x') as Formula, FV = tex(String(m.x)) as Formula;
  const kept = m.grouped ? m.r : m.r - m.q;
  const takenL = new Set(m.takeL), takenR = new Set(m.takeR);
  const rowOfLeft = (k: number) => (m.grouped ? Math.floor(k / Math.max(1, m.q)) : -1);
  const rowOfRight = (j: number) => (m.level && j < kept ? Math.floor(j / m.per) : -1);

  // ---------- labels under the pans: what each pan holds now ----------
  type Part = LabelPart;
  const bags = (n: number) => `${n} ${n === 1 ? 'bag' : 'bags'}`;
  function labels(take: boolean, keep: boolean): [Part[], Part[]] {
    if (!m.grouped) {
      if (!take && !keep) return [m.q ? [{ t: bags(m.p), col: 'second' }, { t: ` + ${m.q}`, col: 'first' }] : [{ t: bags(m.p), col: 'second' }], [{ t: String(m.r), col: 'first' }]];
      if (!keep) return [[{ t: bags(m.p), col: 'second' }], [{ t: String(m.r - m.q), col: 'first' }]];
      return [[{ t: '1 bag', col: 'second' }], [{ t: String(m.x), col: 'first' }]];
    }
    if (!take && !keep) return [[{ t: `${m.p} × (`, col: 'dim' }, { t: 'bag', col: 'second' }, { t: ` + ${m.q}`, col: 'first' }, { t: ')', col: 'dim' }], [{ t: String(m.r), col: 'first' }]];
    if (!take) return [[{ t: '1 bag', col: 'second' }, { t: ` + ${m.q}`, col: 'first' }], [{ t: String(m.x + m.q), col: 'first' }]];
    return [[{ t: '1 bag', col: 'second' }], [{ t: String(m.x), col: 'first' }]];
  }
  const partsBox = (parts: readonly Part[], cx: number, y: number): Box => {
    const w = parts.reduce((s, q) => s + wordsBox(q.t, 0, 0, { size: LABEL }).w, 0);
    return box(cx - w / 2, y - LABEL * 0.42, cx + w / 2, y + LABEL * 0.42);
  };
  function drawParts(c: Canvas, parts: readonly Part[], cx: number, y: number, a: number): void {
    const B = partsBox(parts, cx, y);
    let x = B.x0;
    for (const q of parts) { drawWords(c, q.t, x, y, q.col, a, { size: LABEL }); x += wordsBox(q.t, 0, 0, { size: LABEL }).w; }
  }
  const [l0, r0] = labels(false, false);
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
  function ghostMarble(c: Canvas, x: number, y: number, a: number): void {
    if (a <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(a); g.setLineDash([5, 5]); g.strokeStyle = 'rgba(239,230,247,0.55)'; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, MR - 2, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  function bagPts(x: number, y: number): Pt[] {
    const w = BAG_W, h = BAG_H, t = y - h / 2, b = y + h / 2;
    return [[x - w / 2 + 14, b], [x + w / 2 - 14, b], [x + w / 2, b - 22], [x + w / 2, t + 42], [x + w / 2 - 14, t + 26], [x + 12, t + 16], [x + 22, t], [x - 22, t], [x - 12, t + 16], [x - w / 2 + 14, t + 26], [x - w / 2, t + 42], [x - w / 2, b - 22]];
  }
  function bag(c: Canvas, x: number, y: number, i: number, a: number, open: number): void {
    if (a <= 0) return;
    withAlpha(c, a, () => {
      wash(c, bagPts(x, y), BAG, { seed: 40 + i, inkW: 3, shade: 0.3, rough: 1.4 });
      inkLine(c, [[x - 15, y - BAG_H / 2 + 17], [x + 15, y - BAG_H / 2 + 17]], { col: DUSK.ink, w: 4, seed: 60 + i });
      const ty = y + 14;
      if (open < 1) texDraw(c, FX, x, ty, { size: 68, align: 'center', col: '#101330', alpha: 1 - open });
      if (open > 0) texDraw(c, FV, x, ty, { size: 68, align: 'center', col: '#101330', alpha: open });
    });
  }
  function ghostBag(c: Canvas, x: number, y: number, a: number): void {
    if (a <= 0) return;
    const { g } = c, P = bagPts(x, y);
    g.save(); g.globalAlpha *= clamp(a); g.setLineDash([7, 6]); g.strokeStyle = 'rgba(239,230,247,0.55)'; g.lineWidth = 2.4;
    g.beginPath(); P.forEach((q, k) => (k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.stroke(); g.restore();
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
    wash(c, [[cx - w / 2, y], [cx + w / 2, y], [cx + w / 2 - 38, y + 30], [cx - w / 2 + 38, y + 30]], PEWTER, { seed, inkW: 3, shade: 0.4, rough: 1.2 });
  }

  function draw(c: Canvas, P: Progress<BalanceStep>, f: BalanceFocus = {}): void {
    const kS = P.k('stand'), kL = P.k('left'), kR = P.k('right'), kT = E.smooth(clamp(P.k('take'))), kSp = E.smooth(clamp(P.k('split'))), kK = P.k('keep'), kO = P.k('open');
    const a = clamp(f.tilt ?? 0, -1, 1) * MAX_TILT;
    const dyL = Math.sin(a) * L.half, dyR = -dyL, dxE = (1 - Math.cos(a)) * L.half;
    const gk = clamp(f.gone?.k ?? 0);
    const goneB = new Set(f.gone?.bags ?? []), goneL = new Set(f.gone?.left ?? []), goneR = new Set(f.gone?.right ?? []);
    if (kS <= 0) return;
    // stand, beam, stems, pans
    withAlpha(c, kS, () => {
      const cx = L.cx, pv = L.pivot;
      wash(c, [[cx, pv - 6], [cx + 86, L.table + 2], [cx - 86, L.table + 2]], PEWTER_D, { seed: 3, inkW: 3, shade: 0.45, rough: 1.2 });
      const hl = L.half + 38, ca = Math.cos(a), sa = Math.sin(a), t = 10;
      // rotate by -a: a > 0 tips the left end (u < 0) down
      const beamR: Pt[] = ([[-hl, -t], [hl, -t], [hl, t], [-hl, t]] as [number, number][]).map(([u, v]) => [cx + u * ca + v * sa, pv - u * sa + v * ca] as Pt);
      wash(c, beamR, PEWTER, { seed: 5, inkW: 3, shade: 0.35, rough: 0.8 });
      c.g.save(); c.g.fillStyle = DUSK.cream; c.g.beginPath(); c.g.arc(cx, pv, 7, 0, Math.PI * 2); c.g.fill(); c.g.restore();
      for (const [px, dy, s] of [[L.panL.cx + dxE, dyL, 11], [L.panR.cx - dxE, dyR, 13]] as const) {
        inkLine(c, [[px, L.floor + 28 + dy], [px, L.pivot + dy - 6]], { col: PEWTER_D, w: 11, seed: s });
        inkLine(c, [[px, L.floor + 28 + dy], [px, L.pivot + dy - 6]], { col: DUSK.ink, w: 2.5, seed: s + 1, alpha: 0.5 });
        pan(c, px, L.floor + dy, s + 20);
      }
    });
    // share separators (split), the kept row stays bright
    if (kSp > 0 && m.level) for (let i = 0; i < m.p - 1; i++) {
      const y = L.floor - 8 - ROW_H * (i + 1);
      for (const [P0, dy] of [[L.panL, dyL], [L.panR, dyR]] as const) {
        c.g.save(); c.g.globalAlpha *= kSp * (1 - 0.75 * kK); c.g.setLineDash([12, 10]); c.g.strokeStyle = 'rgba(239,230,247,0.5)'; c.g.lineWidth = 2.5;
        c.g.beginPath(); c.g.moveTo(P0.x0 + 18, y + dy); c.g.lineTo(lerp(P0.x0 + 18, P0.x1 - 18, kSp), y + dy); c.g.stroke(); c.g.restore();
      }
    }
    const keepA = (row: number) => (row >= 1 ? 1 - 0.84 * clamp(kK) : 1);
    const pos = (A: Pos, C: Pos): Pos => ({ x: lerp(A.x, C.x, kSp), y: lerp(A.y, C.y, kSp) });
    // group outlines (grouped form): one dashed ring per group, the same on both sides of the split
    if (m.grouped) for (let g = 0; g < m.p; g++) {
      const kg = E.smooth(lag(kL, g, m.p, 0.4));
      const ids = Array.from({ length: m.q }, (_, k) => g * m.q + k);
      const Bx = unionBox([bagBox([L.bagA[g]!]), ...(m.q ? [marbleBox(ids.filter(k => !(g === 0 && takenL.has(k) && kT > 0.5)).map(k => L.leftA[k]!))] : [])]);
      c.g.save(); c.g.globalAlpha *= kg * keepA(g) * kS; c.g.setLineDash([9, 7]); c.g.strokeStyle = paint(th, 'second', 'line'); c.g.lineWidth = 2.5;
      c.g.beginPath(); c.g.roundRect(Bx.x0 - 12, Bx.y0 - 8 + dyL, Bx.w + 24, Bx.h + 16, 18); c.g.stroke(); c.g.restore();
    }
    // bags
    for (let i = 0; i < m.p; i++) {
      const ki = E.smooth(lag(kL, i, m.p + 1, 0.4));
      if (ki <= 0) continue;
      const q = pos(L.bagA[i]!, L.bagC[i]!), gone = goneB.has(i) ? gk : 0;
      const al = ki * keepA(i) * (1 - 0.88 * gone);
      if (gone > 0) ghostBag(c, q.x, q.y + dyL, gone);
      bag(c, q.x, q.y + dyL - (1 - ki) * 40, i, al, clamp(kO));
    }
    // left marbles
    for (let k = 0; k < m.nL; k++) {
      const kk = E.smooth(lag(kL, m.grouped ? Math.floor(k / Math.max(1, m.q)) : m.p, m.p + 1, 0.4));
      if (kk <= 0) continue;
      const q = pos(L.leftA[k]!, L.leftC[k]!), tk = takenL.has(k) ? kT : 0, gone = goneL.has(k) ? gk : 0;
      const row = rowOfLeft(k);
      const al = kk * (row >= 0 ? keepA(row) : 1) * (1 - clamp((tk - 0.35) / 0.65)) * (1 - 0.88 * gone);
      if (gone > 0) ghostMarble(c, q.x, q.y + dyL, gone);
      marble(c, q.x - tk * 40, q.y + dyL - tk * 150 - (1 - kk) * 40, k, al);
    }
    // right marbles
    for (let j = 0; j < m.r; j++) {
      const kk = E.smooth(lag(kR, j, m.r, 0.25));
      if (kk <= 0) continue;
      const q = pos(L.rightA[j]!, L.rightC[j]!), tk = takenR.has(j) ? kT : 0, gone = goneR.has(j) ? gk : 0;
      const row = rowOfRight(j);
      const al = kk * (row >= 0 ? keepA(row) : 1) * (1 - clamp((tk - 0.35) / 0.65)) * (1 - 0.88 * gone);
      if (gone > 0) ghostMarble(c, q.x, q.y + dyR, gone);
      marble(c, q.x + tk * 40, q.y + dyR - tk * 150 - (1 - kk) * 40, 100 + j, al);
    }
    // rings
    for (const R of f.rings ?? []) ring(c, ringBox(R.at, kSp, kT), R.col, R.k);
    // labels: what each pan holds now (they swap at the middle of a take / keep)
    const take = kT >= 0.5, keep = kK >= 0.5;
    const near = (k: number) => (k > 0 && k < 1 ? Math.abs(2 * k - 1) : 1);
    const la = kS * Math.min(near(kT), near(clamp(kK))) * (1 - clamp(f.labelsHide ?? 0));
    const [pl, pr] = labels(take, keep);
    if ((f.labelL ?? 0) > 0) pulse(c, partsBox(pl, L.panL.cx, L.labelY), 'second', f.labelL!);
    if ((f.labelR ?? 0) > 0) pulse(c, partsBox(pr, L.panR.cx, L.labelY), 'first', f.labelR!);
    const ko = clamp(f.labelsAs?.k ?? 0);
    drawParts(c, pl, L.panL.cx, L.labelY, la * Math.max(kL, 0) * (1 - ko));
    drawParts(c, pr, L.panR.cx, L.labelY, la * Math.max(kR, 0) * (1 - ko));
    if (ko > 0) { drawParts(c, f.labelsAs!.L, L.panL.cx, L.labelY, ko * kS); drawParts(c, f.labelsAs!.R, L.panR.cx, L.labelY, ko * kS); }
  }
  function pulse(c: Canvas, B: Box, col: Role, k: number): void {
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.2; g.fillStyle = paint(th, col, 'fill');
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.fill(); g.restore();
    ring(c, box(B.x0 - 2, B.y0 + 2, B.x1 + 2, B.y1 - 2), col, k, 14);
  }
  function ringBox(at: RingAt, kSp: number, kT: number): Box {
    const ps = (A: Pos[], C: Pos[], ids: number[]) => ids.map(i => ({ x: lerp(A[i]!.x, C[i]!.x, kSp), y: lerp(A[i]!.y, C[i]!.y, kSp) }));
    const all = (n: number) => Array.from({ length: n }, (_, i) => i);
    switch (at) {
      case 'bags': return bagBox(ps(L.bagA, L.bagC, all(m.p)));
      case 'left': return marbleBox(ps(L.leftA, L.leftC, all(m.nL)));
      case 'right': return marbleBox(ps(L.rightA, L.rightC, all(m.r)));
      case 'takenL': return marbleBox(ps(L.leftA, L.leftC, m.takeL));
      case 'takenR': return marbleBox(ps(L.rightA, L.rightC, m.takeR));
      case 'keptR': return marbleBox(ps(L.rightA, L.rightC, all(m.r).filter(j => !takenR.has(j))));
      case 'leftRow0': return unionBox([bagBox([L.bagC[0]!]), ...(m.grouped && m.q && kT < 0.5 ? [marbleBox(ps(L.leftA, L.leftC, all(m.q)))] : [])]);
      case 'rightRow0': return marbleBox(ps(L.rightA, L.rightC, all(m.r).filter(j => rowOfRight(j) === 0 && !(kT > 0.5 && takenR.has(j)))));
      case 'row0': return unionBox([ringBox('leftRow0', kSp, kT), ringBox('rightRow0', kSp, kT)]);
      case 'goneBags': return bagBox(L.bagA.slice(m.p - 1));
      case 'goneR': return marbleBox(L.rightA.slice(Math.floor(m.r / 2)));
    }
  }
  const rest = (A: Pos[], ids: number[]) => marbleBox(ids.map(i => A[i]!));
  const all = (n: number) => Array.from({ length: n }, (_, i) => i);
  return {
    kind: 'Balance', maths: m, layout: L,
    where: {
      bags: bagBox(L.bagA), left: m.nL ? rest(L.leftA, all(m.nL)) : box(0, 0, 0, 0), right: rest(L.rightA, all(m.r)),
      takenL: m.takeL.length ? rest(L.leftA, m.takeL) : box(0, 0, 0, 0), takenR: m.takeR.length ? rest(L.rightA, m.takeR) : box(0, 0, 0, 0),
      keptR: rest(L.rightA, all(m.r).filter(j => !takenR.has(j))),
      leftRow: i => unionBox([bagBox([L.bagC[i]!]), ...(m.grouped && m.q ? [rest(L.leftC, all(m.q).map(k => i * m.q + k))] : [])]),
      rightRow: i => rest(L.rightC, all(m.r).filter(j => rowOfRight(j) === i)),
      share: rest(L.rightC, all(m.r).filter(j => rowOfRight(j) === 0 && !takenR.has(j))),
      labelL, labelR,
    },
    draw,
  };
}
