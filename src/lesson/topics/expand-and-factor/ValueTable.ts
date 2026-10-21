// ValueTable: two expressions evaluated side by side for some values of x, the evidence in "are they equivalent?".
// A row where the values differ is a counterexample (ringed lavender, ≠ between the values); a row where they match
// is ringed lime (=). The point the picture makes: one ≠ row is enough to say NOT equivalent; matching rows alone
// never prove "equivalent" (that takes a rewrite by the properties).
// Steps: frame, r0 … r5 (each row writes on).  Pure compute (computeTable) evaluates exactly.
import { type Box, box, clamp, unionBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type Ex, type Q, qEq, value, nT, type Fmt } from './expr';

export interface TableParams { A: Ex; B: Ex; aTex: string; bTex: string; xs: readonly number[]; fmt?: Fmt }
export interface TableRow { x: number; a: Q; b: Q; eq: boolean }
export interface TableMaths { rows: TableRow[] }
const NAME = 'ValueTable';
export function computeTable(P: Pick<TableParams, 'A' | 'B' | 'xs'>): TableMaths {
  check(P.xs.length >= 1 && P.xs.length <= 6, NAME, 'the table shows 1 to 6 values of x');
  check(new Set(P.xs).size === P.xs.length, NAME, 'the values of x repeat');
  return { rows: P.xs.map(x => { const a = value(P.A, x), b = value(P.B, x); return { x, a, b, eq: qEq(a, b) }; }) };
}
export interface TableFocus { mark?: readonly number[]; markK?: number; rowDim?: number }
export interface TableBlock {
  readonly kind: 'ValueTable';
  readonly maths: TableMaths;
  readonly box: Box;
  readonly where: { row(i: number): Box; a(i: number): Box; b(i: number): Box; headA: Box; headB: Box };
  draw(c: Canvas, P: Progress<string>, f?: TableFocus): void;
}

export function ValueTable(P: TableParams, fr: Frame, th: Theme): TableBlock {
  const m = computeTable(P);
  const fmt = P.fmt ?? 'frac', n = m.rows.length;
  const HS = 60, VS = 64;
  const HA = tex(P.aTex) as Formula, HB = tex(P.bTex) as Formula, HX = tex('x') as Formula;
  const VA = m.rows.map(r => tex(nT(r.a, fmt)) as Formula), VB = m.rows.map(r => tex(nT(r.b, fmt)) as Formula), VX = m.rows.map(r => tex(String(r.x)) as Formula);
  const EQ = tex('=') as Formula, NE = tex('\\neq') as Formula;
  const WX = 150, WA = Math.max(250, texWidth(HA, HS) + 70), WB = Math.max(250, texWidth(HB, HS) + 70), GAP = 90;
  const W0 = WX + WA + GAP + WB;
  check(W0 <= fr.w, NAME, `the table (${Math.round(W0)} px) is wider than the frame`);
  const RH = Math.min(104, (fr.h - 130) / n), HH = 120;
  check(RH >= 84, NAME, 'the rows are too low to read');
  const x0 = fr.x + (fr.w - W0) / 2, y0 = fr.y + (fr.h - HH - n * RH) / 2;
  const cx = { x: x0 + WX / 2, a: x0 + WX + WA / 2, eq: x0 + WX + WA + GAP / 2, b: x0 + WX + WA + GAP + WB / 2 };
  const rowY = (i: number) => y0 + HH + (i + 0.5) * RH;
  const row = (i: number): Box => box(x0, y0 + HH + i * RH, x0 + W0, y0 + HH + (i + 1) * RH);

  function draw(c: Canvas, Pr: Progress<string>, f: TableFocus = {}): void {
    const kF = E.smooth(Pr.k('frame'));
    if (kF <= 0) return;
    withAlpha(c, kF, () => {
      wash(c, rectPts(x0 - 20, y0 - 10, W0 + 40, HH + n * RH + 24, 18), '#1A1D3D', { seed: 61, ink: null, shade: 0.12, rough: 1.0 });
      texDraw(c, HX, cx.x, y0 + HH / 2, { size: HS, align: 'center', col: 'dim' });
      texDraw(c, HA, cx.a, y0 + HH / 2, { size: HS, align: 'center', col: 'ink' });
      texDraw(c, HB, cx.b, y0 + HH / 2, { size: HS, align: 'center', col: 'ink' });
      inkLine(c, [[x0, y0 + HH - 6], [x0 + W0, y0 + HH - 6]], { col: DUSK.cream, w: 3, seed: 62, alpha: 0.6 });
    });
    const marks = new Set(f.mark ?? []), mk = clamp(f.markK ?? 0);
    for (let i = 0; i < n; i++) {
      const k = clamp(Pr.k(`r${i}`));
      if (k <= 0) continue;
      const r = m.rows[i]!, y = rowY(i), focus = marks.has(i) ? mk : 0;
      const dim = marks.size && !marks.has(i) ? clamp(f.rowDim ?? 0) * mk : 0;
      withAlpha(c, 1 - 0.55 * dim, () => {
        if (i > 0) inkLine(c, [[x0 + 10, row(i).y0], [x0 + W0 - 10, row(i).y0]], { col: '#3A3F6B', w: 2, seed: 63 + i, alpha: k });
        texDraw(c, VX[i]!, cx.x, y, { size: VS, align: 'center', col: 'dim', k });
        texDraw(c, VA[i]!, cx.a, y, { size: VS, align: 'center', col: 'ink', k });
        texDraw(c, VB[i]!, cx.b, y, { size: VS, align: 'center', col: 'ink', k });
        const rel = r.eq ? EQ : NE;
        texDraw(c, rel, cx.eq, y, { size: 60, align: 'center', col: r.eq ? 'link' : 'pick', k: clamp(k * 2 - 1) });
      });
      if (focus > 0) {
        const R = row(i), col = paint(th, r.eq ? 'link' : 'pick', 'fill');
        c.g.save(); c.g.globalAlpha *= E.smooth(focus); c.g.strokeStyle = col; c.g.lineWidth = 5;
        c.g.shadowColor = col; c.g.shadowBlur = 10 * th.glow * Math.hypot(c.g.getTransform().a, c.g.getTransform().b);
        c.g.beginPath(); c.g.roundRect(R.x0 - 6, R.y0 + 6, R.w + 12, R.h - 12, 14); c.g.stroke(); c.g.restore();
      }
    }
  }
  return {
    kind: 'ValueTable', maths: m,
    box: box(x0 - 20, y0 - 10, x0 + W0 + 20, y0 + HH + n * RH + 14),
    where: {
      row, headA: texBox(HA, cx.a, y0 + HH / 2, { size: HS, align: 'center' }), headB: texBox(HB, cx.b, y0 + HH / 2, { size: HS, align: 'center' }),
      a: i => texBox(VA[i]!, cx.a, rowY(i), { size: VS, align: 'center' }), b: i => texBox(VB[i]!, cx.b, rowY(i), { size: VS, align: 'center' }),
    },
    draw,
  };
}
export { unionBox };
