// RecordTable: the data behind a claim, as the rows of a sign-up sheet (12 to 21 rows: name and answer), on a calm
// dark card with crisp row lines. The audit marks it:
//   dup     a name that appears twice: both copies light up lavender, the extra copy is struck in red
//   blank   empty answers: a dashed teal box in the answer cell (no reply)
//   yes     the yes answers that count (the duplicate excluded) get a lime box
// Two columns of rows when there are more than 11. Steps: grid, rows, dup, blank, yes.
import { type Box, box, clamp, lag, unionBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, drawOn, fillPts, strike, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Frame, check, plainText } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';
import { DUSK } from '../../dusk';
import { countTable, type Rec, type TableCount } from './sampling';

export interface RecordTableParams { rows: readonly Rec[]; /** the header of the answer column, e.g. 'instrument?' */ ask: string }
export type RecordTableStep = 'grid' | 'rows' | 'dup' | 'blank' | 'yes';
export interface RecordTableBlock {
  readonly kind: 'RecordTable';
  readonly count: TableCount;
  readonly box: Box;
  readonly where: { card: Box; row(i: number): Box; ans(i: number): Box; dupes: Box | null; blanks: Box | null; yes: Box | null };
  draw(c: Canvas, p: Progress<RecordTableStep>): void;
}

const NAME = 'RecordTable';
const TEXT = 44, HEAD = 64;

export function RecordTable(p: RecordTableParams, fr: Frame, th: Theme): RecordTableBlock {
  check(p.rows.length >= 6 && p.rows.length <= 22, NAME, `a table of ${p.rows.length} rows (6 to 22 fit)`);
  p.rows.forEach(r => plainText(r.name, NAME, 'name'));
  plainText(p.ask, NAME, 'ask');
  const count = countTable(p.rows);
  const nCol = p.rows.length > 11 ? 2 : 1, perCol = Math.ceil(p.rows.length / nCol);
  const gap = 36, padX = 26, padY = 18;
  const colW = Math.min(520, (fr.w - (nCol - 1) * gap) / nCol);
  const rowH = Math.min(70, Math.floor((fr.h - HEAD - 2 * padY) / perCol));
  check(rowH >= 56, NAME, `rows of ${rowH} px are too tight for ${TEXT} px text`);
  const nameW = Math.max(...p.rows.map(r => wordsBox(r.name, 0, 0, { size: TEXT, weight: 500 }).w));
  const ansX = colW - padX - 190;
  const headW = wordsBox(p.ask, 0, 0, { size: TEXT, weight: 500 }).w;
  check(ansX + headW <= colW - 14, NAME, `the header "${p.ask}" runs out of its column`);
  check(padX + nameW + 24 <= ansX, NAME, `the longest name (${Math.round(nameW)} px) runs into the answers`);
  const W = nCol * colW + (nCol - 1) * gap, Hc = HEAD + perCol * rowH + 2 * padY;
  const x0 = fr.x + (fr.w - W) / 2, y0 = fr.y + Math.max(0, (fr.h - Hc) / 2);
  const cardOf = (k: number) => box(x0 + k * (colW + gap), y0, x0 + k * (colW + gap) + colW, y0 + Hc);
  const row = (i: number): Box => {
    const k = Math.floor(i / perCol), j = i % perCol, C = cardOf(k);
    const y = C.y0 + padY + HEAD + j * rowH;
    return box(C.x0, y, C.x1, y + rowH);
  };
  const ans = (i: number): Box => { const R = row(i); return box(R.x0 + ansX - 12, R.y0 + 6, R.x1 - padX + 6, R.y1 - 6); };
  const dupIdx = new Set(count.dupes);
  const dupNames = new Set(count.dupes.map(i => p.rows[i]!.name));
  const firstOfDup = p.rows.map((r, i) => dupNames.has(r.name) && !dupIdx.has(i));
  const dupesB = count.dupes.length ? unionBox(p.rows.flatMap((_, i) => (dupIdx.has(i) || firstOfDup[i] ? [row(i)] : []))) : null;
  const blankIdx = p.rows.map((r, i) => (r.ans === '' && !dupIdx.has(i) ? i : -1)).filter(i => i >= 0);
  const yesIdx = p.rows.map((r, i) => (r.ans === 'yes' && !dupIdx.has(i) ? i : -1)).filter(i => i >= 0);
  const blanksB = blankIdx.length ? unionBox(blankIdx.map(ans)) : null;
  const yesB = yesIdx.length ? unionBox(yesIdx.map(ans)) : null;
  const all = unionBox(Array.from({ length: nCol }, (_, k) => cardOf(k)));
  check(all.y1 <= fr.y + fr.h + 1, NAME, 'the table does not fit the frame');

  function draw(c: Canvas, P: Progress<RecordTableStep>): void {
    const kG = P.k('grid'), kR = P.k('rows'), kD = P.k('dup'), kB = P.k('blank'), kY = P.k('yes');
    if (kG <= 0) return;
    for (let k = 0; k < nCol; k++) {
      const C = cardOf(k);
      withAlpha(c, E.smooth(kG), () => {
        wash(c, rectPts(C.x0, C.y0, C.w, C.h, 20), '#1A1D3E', { seed: 70 + k, ink: null, rough: 1.2, shade: 0.12 });
        inkLine(c, rectPts(C.x0 + 2, C.y0 + 2, C.w - 4, C.h - 4, 18), { col: DUSK.rule, w: 3, closed: true, seed: 72 + k, rough: 0.6 });
        const hy = C.y0 + padY + HEAD / 2 - 2;
        drawWords(c, 'name', C.x0 + padX, hy, 'dim', 1, { size: TEXT, weight: 500 });
        drawWords(c, p.ask, C.x0 + ansX, hy, 'dim', 1, { size: TEXT, weight: 500 });
        strokePts(c, [[C.x0 + 16, C.y0 + padY + HEAD - 4], [C.x1 - 16, C.y0 + padY + HEAD - 4]], { col: 'faint', lw: 2.5 });
      });
    }
    p.rows.forEach((r, i) => {
      const a = E.smooth(lag(kR, i, p.rows.length, 0.5));
      if (a <= 0) return;
      const R = row(i), cy = R.cy;
      const isDup = dupIdx.has(i), dupLit = (isDup || firstOfDup[i]) ? kD : 0;
      withAlpha(c, a * (isDup ? 1 - 0.45 * kD : 1), () => {
        if (dupLit > 0) fillPts(c, rectPts(R.x0 + 8, R.y0 + 3, R.w - 16, R.h - 6, 10), paint(th, 'pick', 'fill'), 0.2 * dupLit);
        if (i % perCol !== perCol - 1 && i !== p.rows.length - 1) strokePts(c, [[R.x0 + 18, R.y1], [R.x1 - 18, R.y1]], { col: '#2E3360', lw: 1.5 });
        drawWords(c, r.name, R.x0 + padX, cy, 'ink', 1, { size: TEXT, weight: 500 });
        if (r.ans) drawWords(c, r.ans, R.x0 + ansX, cy, r.ans === 'yes' ? 'ink' : 'dim', 1, { size: TEXT, weight: r.ans === 'yes' ? 650 : 500 });
      });
      if (isDup && kD > 0) {
        const tb = wordsBox(r.name, R.x0 + padX, cy, { size: TEXT, weight: 500 });
        strike(c, tb.x0 - 6, cy + 2, R.x0 + ansX + 90, cy + 2, clamp((kD - 0.3) / 0.7), { lw: 4.5 });
      }
    });
    if (kB > 0) for (const i of blankIdx) { const b = ans(i); drawOn(c, rectPts(b.x0, b.y0, 132, b.h, 10), E.inOut(kB), { col: 'second', lw: 3, closed: true, dash: [9, 7] }); }
    if (kY > 0) yesIdx.forEach((i, j) => { const b = ans(i), k = E.inOut(lag(kY, j, yesIdx.length, 0.5)); drawOn(c, rectPts(b.x0, b.y0, 132, b.h, 10), k, { col: 'link', lw: 3.5, closed: true }); });
  }
  return { kind: 'RecordTable', count, box: all, where: { card: all, row, ans, dupes: dupesB, blanks: blanksB, yes: yesB }, draw };
}
