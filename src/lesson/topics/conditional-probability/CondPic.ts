// CondPic: the pictures of "Conditional probability and independence" (a candidate for src/lesson/kit/ together with
// counting/CountPic). One card in a Frame, of one of eight kinds:
//   table    a two-way table with margins (painted by two-way-tables/TwoWayTable): the condition is an amber ring round
//            one row or column with everything else dimmed (the new whole), the part glows lime inside it
//   grid     an outcome grid (the 36 rolls of a red and a blue die, or coin x spinner): event A tinted amber, event B
//            ringed teal, A and B lime; a condition dims every cell outside it
//   venn     a sample-space rectangle with two circles (overlapping, apart, or one inside the other), a value in every
//            region (counts, probabilities or the outcomes themselves); a condition dims everything outside its circle
//   tree     a two-stage probability tree with TeX branch labels (fractions, decimals, percents) and path products
//   chips    a list of outcomes (the numbers 1..N): A amber, B ringed teal, both lime, a condition dims the rest
//   dots     a dot plot of simulated sample proportions, with one observed value marked
//   spinner  a spinner with unequal sectors and a legend of probabilities; a condition dims the sectors it rules out
//   tokens   named discs (a bag of counters), painted by counting/CountPic
// Steps: 'card' then per kind (see `steps`); marks the page sets for highlights: 'whole', 'part', 'alt', 'hlA', 'hlB',
// 'cond', 'path' and 'rev' (= every highlight of the item's solution plus its hidden values). Pure layout with estimated
// text widths (no DOM in the layout), throws BlockError when something would not fit at 60 px numbers / 44 px labels.
import { type Box, type Pt, box, clamp, lag } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, dot, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Formula, tex, texDraw, texWidth } from '../../../core/tex';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type TableFocus, type TableLayout, type TableSpec, drawTable, tableLayout } from '../two-way-tables/TwoWayTable';
import { CountPic, type CountPicBlock } from '../counting/CountPic';

const NAME = 'CondPic';
type Cell = readonly [number, number];
export type Region = 'a' | 'ab' | 'b' | 'out';
export type CPic =
  | { kind: 'table'; rows: string[]; cols: string[]; cells: number[][]; vals?: (number | string | null)[][]; hide?: string[]; title?: string;
      whole?: { kind: 'row' | 'col' | 'all'; i: number }; parts?: Cell[]; alt?: { kind: 'row' | 'col' | 'all'; i: number } }
  | { kind: 'grid'; rowName: string; colName: string; rowVals: string[]; colVals: string[]; text?: string[][]; A?: Cell[]; B?: Cell[]; cond?: Cell[]; title?: string; small?: boolean }
  | { kind: 'venn'; a: string; b: string; vals: Partial<Record<Region, string>>; hide?: Region[]; layout?: 'overlap' | 'apart' | 'inside'; hl?: Region[]; cond?: 'A' | 'B'; title?: string; words?: boolean }
  | { kind: 'tree'; first: { label: string; p: string }[]; second: { label: string; p: string }[][]; leaf?: (string | null)[][]; hide?: string[]; paths?: Cell[]; title?: string }
  | { kind: 'chips'; items: string[]; A?: number[]; B?: number[]; cond?: number[]; legend?: [string, string]; title?: string }
  | { kind: 'dots'; vals: number[]; lo: number; hi: number; tick: number; step: number; mark?: number; markLabel?: string; axis: string; title?: string; d?: number }
  | { kind: 'spinner'; sectors: { label: string; w: number; p: string }[]; cond?: number[]; title?: string }
  | { kind: 'tokens'; names: string[]; groups?: number[]; legend?: [string, string]; title?: string }
  | { kind: 'ctree'; levels: { name: string; opts: string[] }[]; grow?: number; title?: string };

export interface CondPicBlock {
  readonly kind: 'CondPic';
  readonly pic: CPic;
  readonly box: Box;
  readonly steps: readonly string[];
  where(key: string): Box;
  draw(c: Canvas, P: Progress<string>, f?: { table?: TableFocus }): void;
}

const NUM = 64, LAB = 44, TITLE = 46;
const CARD = '#262B57', PLATE = '#1A1E44';
/** estimated text width (layout stays testable without a DOM; the canvas measures a little less) */
export const wW = (s: string, size: number) => s.length * size * 0.56;
const FC = new Map<string, Formula>();
const F = (s: string): Formula => { let f = FC.get(s); if (!f) { f = tex(s) as Formula; FC.set(s, f); } return f; };
export const SPIN_COL: Record<string, string> = { red: '#E0736E', blue: '#6F92E6', green: '#62C08A', yellow: '#E6C454', purple: '#B58BE0', orange: '#EE9A55' };
const PALETTE = ['#E0736E', '#6F92E6', '#62C08A', '#E6C454', '#B58BE0', '#EE9A55'];
const spinCol = (label: string, i: number): Paint => (SPIN_COL[label] ?? PALETTE[i % PALETTE.length]!) as Paint;

export function CondPic(pic: CPic, fr: Frame, th: Theme): CondPicBlock {
  if (pic.kind === 'tokens' || pic.kind === 'ctree') {
    const T: CountPicBlock = pic.kind === 'tokens' ? CountPic({ kind: 'tokens', names: pic.names, groups: pic.groups, legend: pic.legend, title: pic.title }, fr, th)
      : CountPic({ kind: 'tree', levels: pic.levels, grow: pic.grow, title: pic.title }, fr, th);
    return { kind: 'CondPic', pic, box: T.box, steps: T.steps, where: T.where, draw: (c, P) => T.draw(c, P) };
  }
  const x0 = fr.x, y0 = fr.y, x1 = fr.x + fr.w, y1 = fr.y + fr.h;
  const col = (cl: Paint) => paint(th, cl, 'fill');
  const title = pic.title ?? '';
  if (title) check(wW(title, TITLE) * 0.92 <= fr.w - 40, NAME, `title "${title}" is too wide`);
  const top = y0 + (title ? 92 : 24), bot = y1 - 24;
  const boxes = new Map<string, Box>();
  let steps: string[] = ['card'];
  let drawBody: (c: Canvas, P: Progress<string>, f: { table?: TableFocus }) => void = () => undefined;
  const mk = (P: Progress<string>, key: string) => Math.max(P.k(key), P.k('rev'));

  function plate(c: Canvas, B: Box, fill: string, edge: string, k: number, w = 3, r = 12): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.fillStyle = fill; g.strokeStyle = edge; g.lineWidth = w;
    g.beginPath(); g.roundRect(B.x0, B.y0, B.w, B.h, r); g.fill(); g.stroke(); g.restore();
  }
  function ring(c: Canvas, B: Box, cl: Paint, k: number, pad = 8, w = 5): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = col(cl); g.lineWidth = w;
    g.shadowColor = col(cl); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(B.x0 - pad, B.y0 - pad, B.w + 2 * pad, B.h + 2 * pad, 14); g.stroke(); g.restore();
  }
  const texAt = (c: Canvas, s: string, x: number, y: number, size: number, cl: Paint, a: number, align: 'left' | 'center' | 'right' = 'center') => { if (a > 0 && s) texDraw(c, F(s), x, y, { size, align, col: cl, alpha: clamp(a) }); };
  const texW = (s: string, size: number) => { try { return texWidth(F(s), size); } catch { return wW(s, size); } };

  // ====================== table ======================
  if (pic.kind === 'table') {
    const R = pic.rows.length, C = pic.cols.length;
    check(R >= 2 && R <= 3 && C >= 2 && C <= 3, NAME, 'tables are 2x2 to 3x3');
    const cells = pic.cells;
    const row = cells.map(r => r.reduce((s, v) => s + v, 0)), cl = cells[0]!.map((_, j) => cells.reduce((s, r) => s + r[j]!, 0));
    const vals = pic.vals ?? [...cells.map((r, i) => [...r, row[i]!]), [...cl, row.reduce((s, v) => s + v, 0)]];
    const spec: TableSpec = { rows: pic.rows, cols: pic.cols, vals: vals as (number | null)[][], margins: true, fmt: 'count', hide: pic.hide };
    const area = box(x0 + 30, top, x1 - 30, bot);
    const L: TableLayout = tableLayout(spec, area, { maxRowH: 150, maxColW: 270, num: 72, lab: 48, center: true });
    check(L.all.x0 >= x0 + 10 && L.all.x1 <= x1 - 10 && L.all.y1 <= y1 - 6, NAME, 'the table does not fit the card');
    check(L.num >= 60, NAME, 'table numbers below 60 px');
    for (let r = 0; r <= R; r++) for (let j = 0; j <= C; j++) boxes.set(`cell.${r}.${j}`, L.cell(r, j));
    for (let r = 0; r <= R; r++) boxes.set(`row.${r}`, L.strip('row', r));
    for (let j = 0; j <= C; j++) boxes.set(`col.${j}`, L.strip('col', j));
    boxes.set('all', L.all);
    steps = ['card', 'heads', 'cells', 'totals'];
    drawBody = (c, P, f) => {
      const kw = mk(P, 'whole'), kp = mk(P, 'part');
      const base: TableFocus = {
        whole: pic.whole ? { ...pic.whole, k: kw } : null,
        dim: pic.whole && pic.whole.kind !== 'all' ? kw * 0.95 : 0,
        glows: (pic.parts ?? []).map(([r, j]) => ({ r, c: j, k: kp })),
        alt: pic.alt ? { ...pic.alt, k: P.k('alt') } : null,
        reveal: P.k('rev'),
      };
      drawTable(c, spec, L, { grid: Math.max(P.k('card'), 0), heads: P.k('heads'), cells: P.k('cells'), totals: P.k('totals') }, { ...base, ...(f.table ?? {}) });
    };
  }

  // ====================== grid ======================
  else if (pic.kind === 'grid') {
    const nr = pic.rowVals.length, nc = pic.colVals.length;
    check(nr >= 2 && nr <= 6 && nc >= 2 && nc <= 6, NAME, 'grids are 2 to 6 by 2 to 6');
    const TS = pic.small ? LAB : 60;
    const labW = Math.max(150, wW(pic.rowName + ' ↓', LAB) + 30);
    const topLab = 64;
    const cw = Math.min(170, (fr.w - 60 - labW) / nc), ch = Math.min(118, (bot - top - topLab) / (nr + 1));
    check(ch >= 74, NAME, `grid rows too thin (${ch.toFixed(0)} px)`);
    const widest = Math.max(...(pic.text ?? []).flat().map(s => wW(s, TS) * 0.8), ...pic.colVals.map(s => wW(s, 60) * 0.8));
    check(cw >= widest + 16, NAME, 'grid cells too narrow for their text');
    const gw = labW + nc * cw, gh = topLab + (nr + 1) * ch;
    const gx = (x0 + x1) / 2 - gw / 2, gy = top + (bot - top - gh) / 2;
    const cellB = (r: number, j: number) => box(gx + labW + j * cw + 5, gy + topLab + (r + 1) * ch + 5, gx + labW + (j + 1) * cw - 5, gy + topLab + (r + 2) * ch - 5);
    for (let r = 0; r < nr; r++) for (let j = 0; j < nc; j++) boxes.set(`cell.${r}.${j}`, cellB(r, j));
    boxes.set('all', box(gx + labW, gy + topLab + ch, gx + gw, gy + gh));
    const has = (xs: readonly Cell[] | undefined, r: number, j: number) => !!xs?.some(([a, b]) => a === r && b === j);
    steps = ['card', 'heads', 'cells'];
    drawBody = (c, P) => {
      const kh = P.k('heads'), kc = P.k('cells');
      const kA = mk(P, 'hlA'), kB = mk(P, 'hlB'), kC = mk(P, 'cond');
      drawWords(c, `${pic.colName} →`, gx + labW + 8, gy + topLab / 2, 'dim', kh, { size: LAB, weight: 650 });
      drawWords(c, `${pic.rowName} ↓`, gx + 14, gy + topLab + ch / 2, 'dim', kh, { size: LAB, weight: 650 });
      pic.colVals.forEach((v, j) => drawWords(c, v, gx + labW + (j + 0.5) * cw, gy + topLab + ch / 2, 'second', E.smooth(lag(kh, j, nc, 0.5)), { size: 60, align: 'center', weight: 700 }));
      pic.rowVals.forEach((v, r) => drawWords(c, v, gx + labW - 34, gy + topLab + (r + 1.5) * ch, 'first', E.smooth(lag(kh, r, nr, 0.5)), { size: 60, align: 'right', weight: 700 }));
      for (let r = 0; r < nr; r++) for (let j = 0; j < nc; j++) {
        const k = E.smooth(lag(kc, r * nc + j, nr * nc, 0.5));
        if (k <= 0) continue;
        const B = cellB(r, j), a = has(pic.A, r, j), b = has(pic.B, r, j), inC = !pic.cond || has(pic.cond, r, j);
        const dimK = pic.cond && !inC ? 1 - 0.75 * kC : 1;
        withAlpha(c, k * dimK, () => {
          plate(c, B, PLATE, '#4A5088', 1, 2, 12);
          if (a && kA > 0) withAlpha(c, kA * 0.55, () => wash(c, rectPts(B.x0 + 3, B.y0 + 3, B.w - 6, B.h - 6, 10), a && b && kB > 0.5 ? 'link' : 'first', { seed: 7 + r * 6 + j, rough: 0.6, ink: null, shade: 0 }));
          if (b && kB > 0) ring(c, B, a && kA > 0.5 ? 'link' : 'second', kB, -3, 4);
          if (pic.cond && inC && kC > 0) ring(c, B, 'first', kC * 0.8, 1, 3);
          const t = pic.text?.[r]?.[j] ?? '';
          if (t) drawWords(c, t, B.cx, B.cy, 'ink', 1, { size: TS, align: 'center', weight: 650 });
        });
      }
    };
  }

  // ====================== venn ======================
  else if (pic.kind === 'venn') {
    const lay = pic.layout ?? 'overlap';
    const rect = box(x0 + 40, top + 56, x1 - 40, bot);
    const r = Math.min(250, (rect.h - 70) / 2, (rect.w - 80) / (lay === 'apart' ? 4.4 : 3.2));
    check(r >= 160, NAME, 'the circles are too small');
    const cy = rect.cy + 4;
    let cA: Pt, cB: Pt, rB = r;
    if (lay === 'overlap') { cA = [rect.cx - r * 0.62, cy]; cB = [rect.cx + r * 0.62, cy]; }
    else if (lay === 'apart') { cA = [rect.cx - r * 1.18, cy]; cB = [rect.cx + r * 1.18, cy]; }
    else { cA = [rect.cx - r * 0.25, cy]; rB = r * 0.5; cB = [cA[0] + r * 0.4, cy + 10]; }
    const pos: Record<Region, Pt> = {
      a: lay === 'overlap' ? [cA[0] - r * 0.5, cy] : lay === 'apart' ? cA : [cA[0] - r * 0.55, cy],
      ab: lay === 'overlap' ? [rect.cx, cy] : lay === 'apart' ? [rect.cx, cy] : cB,
      b: lay === 'overlap' ? [cB[0] + r * 0.5, cy] : lay === 'apart' ? cB : cB,
      out: [rect.x1 - 90, rect.y1 - 52],
    };
    const VS = pic.words ? 52 : NUM;
    const valW = (s: string) => (pic.words ? wW(s, VS) * 0.82 : texW(s, VS));
    const room: Record<Region, number> = { a: lay === 'overlap' ? r * 0.85 : lay === 'apart' ? r * 1.7 : r * 0.62, ab: lay === 'overlap' ? r * 0.7 : lay === 'apart' ? 0 : rB * 1.7, b: lay === 'overlap' ? r * 0.85 : lay === 'apart' ? r * 1.7 : 0, out: 170 };
    for (const k of ['a', 'ab', 'b', 'out'] as Region[]) {
      const s = pic.vals[k];
      if (s) check(valW(s) <= room[k] + 4, NAME, `region ${k} value "${s}" too wide`);
      boxes.set(`reg.${k}`, box(pos[k][0] - 60, pos[k][1] - 40, pos[k][0] + 60, pos[k][1] + 40));
    }
    const nameA = { x: cA[0] - r * 0.35, y: cy - r - 34 }, nameB = lay === 'inside' ? { x: cB[0], y: cB[1] - rB - 30 } : { x: cB[0] + r * 0.35, y: cy - r - 34 };
    if (lay !== 'inside') check(nameA.x + wW(pic.a, LAB) * 0.42 + 24 < nameB.x - wW(pic.b, LAB) * 0.42, NAME, 'set names collide');
    check(nameA.x - wW(pic.a, LAB) * 0.45 > rect.x0 - 20 && nameB.x + wW(pic.b, LAB) * 0.45 < rect.x1 + 20, NAME, 'set names leave the card');
    boxes.set('A', box(cA[0] - r, cy - r, cA[0] + r, cy + r)); boxes.set('B', box(cB[0] - rB, cB[1] - rB, cB[0] + rB, cB[1] + rB));
    boxes.set('rect', rect);
    steps = ['card', 'A', 'B', 'vals'];
    const circ = (ct: Pt, rr: number): Pt[] => Array.from({ length: 72 }, (_, i) => [ct[0] + rr * Math.cos((i / 72) * Math.PI * 2), ct[1] + rr * Math.sin((i / 72) * Math.PI * 2)] as Pt);
    drawBody = (c, P) => {
      const kC = mk(P, 'cond'), kH = mk(P, 'hlA'), rv = P.k('rev');
      const kr = P.k('card');
      // the sample space
      if (kr > 0) withAlpha(c, clamp(kr * 1.5 - 0.3), () => { plate(c, rect, '#20244C', '#5A609A', 1, 3, 18); drawWords(c, 'all outcomes', rect.x0 + 22, rect.y0 + 30, 'dim', 1, { size: LAB, weight: 600 }); });
      const dimOut = pic.cond ? 1 - 0.7 * kC : 1;
      const drawC = (ct: Pt, rr: number, cl: Paint, k: number, seed: number, keep: boolean) => {
        if (k <= 0) return;
        const pts = circ(ct, rr), a = keep ? 1 : dimOut;
        withAlpha(c, clamp(k) * 0.4 * a, () => wash(c, pts, cl, { seed, rough: 1.2, ink: null, shade: 0.1 }));
        inkLine(c, [...pts, pts[0]!], { col: col(cl), w: 5, seed, rough: 0.5, alpha: clamp(k) * a });
      };
      drawC(cA, r, 'first', P.k('A'), 61, pic.cond === 'A');
      drawC(cB, rB, 'second', P.k('B'), 62, pic.cond === 'B');
      if (pic.cond && kC > 0) {
        const [ct, rr] = pic.cond === 'A' ? [cA, r] : [cB, rB];
        const { g } = c;
        g.save(); g.globalAlpha *= clamp(kC); g.strokeStyle = col('first'); g.lineWidth = 6;
        g.shadowColor = col('first'); g.shadowBlur = 12 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
        g.beginPath(); g.arc(ct[0], ct[1], rr + 12, 0, Math.PI * 2); g.stroke(); g.restore();
      }
      drawWords(c, pic.a, nameA.x, nameA.y, 'first', P.k('A'), { size: LAB, align: 'center', weight: 700 });
      drawWords(c, pic.b, nameB.x, nameB.y, 'second', P.k('B'), { size: LAB, align: 'center', weight: 700 });
      const kv = P.k('vals');
      const inCond = (rg: Region) => !pic.cond || (pic.cond === 'A' ? rg === 'a' || rg === 'ab' : rg === 'b' || rg === 'ab');
      (['a', 'ab', 'b', 'out'] as Region[]).forEach((rg, i) => {
        const s = pic.vals[rg];
        if (!s) return;
        const k = E.smooth(lag(kv, i, 4, 0.5)) * (inCond(rg) ? 1 : 1 - 0.7 * kC);
        const hot = pic.hl?.includes(rg) ? kH : 0;
        const [x, y] = pos[rg];
        if (hot > 0) { const w = valW(s) + 36; plate(c, box(x - w / 2, y - 46, x + w / 2, y + 46), 'rgba(0,0,0,0)', col('link'), hot, 4, 18); }
        const cl: Paint = hot > 0.5 ? 'link' : 'ink';
        if (pic.hide?.includes(rg)) {
          texAt(c, '?', x, y, VS, 'pick', k * (1 - rv));
          if (rv > 0) (pic.words ? drawWords(c, s, x, y, 'link', k * rv, { size: VS, align: 'center', weight: 700 }) : texAt(c, s, x, y, VS, 'link', k * rv));
        } else if (pic.words) drawWords(c, s, x, y, cl, k, { size: VS, align: 'center', weight: 700 });
        else texAt(c, s, x, y, VS, cl, k);
      });
    };
  }

  // ====================== tree ======================
  else if (pic.kind === 'tree') {
    const n1 = pic.first.length;
    check(n1 >= 2 && n1 <= 3, NAME, 'trees have 2 or 3 first branches');
    for (const s of pic.second) check(s.length >= 2 && s.length <= 3, NAME, '2 or 3 second branches');
    const nLeaves = pic.second.reduce((s, x) => s + x.length, 0);
    check(nLeaves <= 6, NAME, 'at most 6 leaves');
    const TN = 60;
    const leafVals = (pic.leaf ?? []).flat().filter((s): s is string => !!s);
    const valW = Math.max(0, ...leafVals.map(s => texW(s, TN)), pic.leaf ? texW('?', TN) : 0);
    const leafLabW = Math.max(...pic.second.flat().map(q => wW(q.label, LAB) * 0.85));
    const rootX = x0 + 50, xEndVals = x1 - 36;
    const leafX = (pic.leaf ? xEndVals - valW - 50 : x1 - 40) - leafLabW - 30;
    const midX = rootX + (leafX - rootX) * 0.46;
    check(midX - rootX >= 220 && leafX - midX >= 220, NAME, 'tree stages too close');
    const step = Math.min(150, (bot - top - 40) / nLeaves);
    check(step >= 110, NAME, `leaves too close (${step.toFixed(0)} px)`);
    const ty0 = (top + bot) / 2 - (step * (nLeaves - 1)) / 2;
    const leaf: Pt[][] = [], mid: Pt[] = [];
    let q = 0;
    for (let i = 0; i < n1; i++) {
      const rowL: Pt[] = pic.second[i]!.map(() => [leafX, ty0 + step * q++] as Pt);
      leaf.push(rowL); mid.push([midX, (rowL[0]![1] + rowL[rowL.length - 1]![1]) / 2]);
    }
    const root: Pt = [rootX, (top + bot) / 2];
    /** a branch label beside the middle of a-b: above-left of an upward branch, below-left of a downward one, above a flat one */
    const labAt = (a: Pt, b: Pt, s: string): Pt => {
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, w = texW(s, TN), dy = b[1] - a[1];
      if (Math.abs(dy) < 30) return [mx, my - 48];
      return [mx - w / 2 - 14, my + (dy < 0 ? -38 : 38)];
    };
    const mwOf = (i: number) => wW(pic.first[i]!.label, LAB) * 0.45 + 16;
    const b1 = pic.first.map((f0, i) => labAt(root, [mid[i]![0] - mwOf(i), mid[i]![1]], f0.p));
    const b2 = pic.second.map((s, i) => s.map((q2, j) => labAt([mid[i]![0] + mwOf(i), mid[i]![1]], leaf[i]![j]!, q2.p)));
    const lb = (at: Pt, s: string) => box(at[0] - texW(s, TN) / 2, at[1] - 38, at[0] + texW(s, TN) / 2, at[1] + 38);
    pic.first.forEach((f0, i) => boxes.set(`b${i}`, lb(b1[i]!, f0.p)));
    pic.second.forEach((s, i) => s.forEach((q2, j) => boxes.set(`b${i}${j}`, lb(b2[i]![j]!, q2.p))));
    pic.second.forEach((s, i) => s.forEach((_, j) => boxes.set(`leaf.${i}.${j}`, box(leaf[i]![j]![0], leaf[i]![j]![1] - 30, xEndVals, leaf[i]![j]![1] + 30))));
    for (const bx of [...b1.map((_, i) => boxes.get(`b${i}`)!), ...pic.second.flatMap((s, i) => s.map((_, j) => boxes.get(`b${i}${j}`)!))]) check(bx.x0 >= x0 + 8 && bx.y0 >= top - 10 && bx.y1 <= y1 - 4, NAME, 'a branch label leaves the card');
    steps = ['card', 'b1', 'b2', ...(pic.leaf ? ['leaf'] : [])];
    const hide = new Set(pic.hide ?? []);
    const onPath = (i: number, j: number) => !!pic.paths?.some(([a, b]) => a === i && (b === j || j < 0));
    drawBody = (c, P) => {
      const k1 = P.k('b1'), k2 = P.k('b2'), kl = P.k('leaf'), rv = P.k('rev'), kp = mk(P, 'path');
      const lab = (s: string, at: Pt, key: string, a: number, cl: Paint, align: 'center' | 'right' = 'center') => {
        if (a <= 0) return;
        if (hide.has(key)) { texAt(c, '?', at[0], at[1], TN, 'pick', a * (1 - rv), align); texAt(c, s, at[0], at[1], TN, 'link', a * rv, align); }
        else texAt(c, s, at[0], at[1], TN, cl, a, align);
      };
      dot(c, root[0], root[1], 10, DUSK.cream, clamp(k1 * 3));
      for (let i = 0; i < n1; i++) {
        const a = E.smooth(lag(k1, i, n1, 0.5));
        if (a <= 0) continue;
        const m = mid[i]!, mw = mwOf(i), tip: Pt = [m[0] - mw, m[1]];
        const end: Pt = [root[0] + (tip[0] - root[0]) * a, root[1] + (tip[1] - root[1]) * a];
        inkLine(c, [root, end], { col: DUSK.cream, w: 3.5, seed: 3 + i, rough: 0.3, alpha: 0.8 });
        if (onPath(i, -1) && kp > 0) inkLine(c, [root, end], { col: col('link'), w: 7, seed: 3 + i, rough: 0.2, alpha: kp });
        lab(pic.first[i]!.p, b1[i]!, `b${i}`, a, 'first');
        plate(c, box(m[0] - mw, m[1] - 30, m[0] + mw, m[1] + 30), PLATE, onPath(i, -1) && kp > 0.5 ? col('link') : col('first'), a, 3, 26);
        drawWords(c, pic.first[i]!.label, m[0], m[1], 'ink', a, { size: LAB, align: 'center', weight: 700 });
      }
      for (let i = 0; i < n1; i++) for (let j = 0; j < pic.second[i]!.length; j++) {
        const a = E.smooth(lag(k2, i * 3 + j, n1 * 3, 0.5));
        if (a <= 0) continue;
        const m = mid[i]!, l = leaf[i]![j]!;
        const st: Pt = [m[0] + mwOf(i), m[1]], end: Pt = [st[0] + (l[0] - st[0]) * a, st[1] + (l[1] - st[1]) * a];
        inkLine(c, [st, end], { col: DUSK.cream, w: 3, seed: 11 + i * 3 + j, rough: 0.3, alpha: 0.75 });
        if (onPath(i, j) && kp > 0) inkLine(c, [st, end], { col: col('link'), w: 7, seed: 11 + i * 3 + j, rough: 0.2, alpha: kp });
        lab(pic.second[i]![j]!.p, b2[i]![j]!, `b${i}${j}`, a, 'second');
        dot(c, l[0], l[1], 7, DUSK.cream, a);
        drawWords(c, pic.second[i]![j]!.label, l[0] + 22, l[1], onPath(i, j) && kp > 0.5 ? 'link' : 'ink', a, { size: LAB, weight: 700 });
      }
      if (pic.leaf && kl > 0) pic.leaf.forEach((rw, i) => rw.forEach((s, j) => { if (s) lab(s, [xEndVals, leaf[i]![j]![1]], `l${i}${j}`, E.smooth(lag(kl, i * 3 + j, n1 * 3, 0.4)), onPath(i, j) && kp > 0.5 ? 'link' : 'ink', 'right'); }));
    };
  }

  // ====================== chips ======================
  else if (pic.kind === 'chips') {
    const n = pic.items.length;
    check(n >= 4 && n <= 24, NAME, '4 to 24 chips');
    const perRow = n <= 8 ? n : n <= 16 ? Math.ceil(n / 2) : Math.ceil(n / 3), nRows = Math.ceil(n / perRow);
    const cw = Math.min(150, (fr.w - 60) / perRow - 14), chH = 92;
    check(cw >= Math.max(...pic.items.map(s => wW(s, 56) * 0.8)) + 20, NAME, 'chips too narrow');
    const legendH = pic.legend ? 80 : 0;
    const gh = nRows * (chH + 26) - 26, gy = top + (bot - top - legendH - gh) / 2;
    const at = pic.items.map((_, i) => { const r = Math.floor(i / perRow), j = i % perRow, cnt = Math.min(perRow, n - r * perRow); return box((x0 + x1) / 2 + (j - cnt / 2) * (cw + 14) + 7, gy + r * (chH + 26), (x0 + x1) / 2 + (j - cnt / 2) * (cw + 14) + 7 + cw, gy + r * (chH + 26) + chH); });
    at.forEach((b, i) => boxes.set(`chip.${i}`, b));
    steps = ['card', 'chips'];
    drawBody = (c, P) => {
      const kc = P.k('chips'), kA = mk(P, 'hlA'), kB = mk(P, 'hlB'), kC = mk(P, 'cond');
      at.forEach((B, i) => {
        const k = E.back(clamp(lag(kc, i, n, 0.5)));
        if (k <= 0) return;
        const a = !!pic.A?.includes(i), b = !!pic.B?.includes(i), inC = !pic.cond || pic.cond.includes(i);
        const dimK = inC ? 1 : 1 - 0.72 * kC;
        withAlpha(c, clamp(k) * dimK, () => {
          plate(c, B, PLATE, '#4A5088', 1, 2.5, 16);
          if (a && kA > 0) withAlpha(c, kA * 0.6, () => wash(c, rectPts(B.x0 + 3, B.y0 + 3, B.w - 6, B.h - 6, 14), b && kB > 0.5 ? 'link' : 'first', { seed: 5 + i, rough: 0.6, ink: null, shade: 0 }));
          if (b && kB > 0) ring(c, B, a && kA > 0.5 ? 'link' : 'second', kB, 2, 4);
          drawWords(c, pic.items[i]!, B.cx, B.cy, 'ink', 1, { size: 56, align: 'center', weight: 700 });
        });
      });
      if (pic.legend) {
        const k = Math.max(kA, kB), [la, lb] = pic.legend, ly = bot - 36, wa = wW(la, LAB) * 0.85;
        const tot = 40 + wa + 70 + 40 + wW(lb, LAB) * 0.85;
        let x = (x0 + x1) / 2 - tot / 2;
        dot(c, x + 14, ly, 15, 'first', k); drawWords(c, la, x + 40, ly, 'dim', k, { size: LAB, weight: 650 }); x += 40 + wa + 70;
        const { g } = c; g.save(); g.globalAlpha *= k; g.strokeStyle = col('second'); g.lineWidth = 4; g.beginPath(); g.arc(x + 14, ly, 14, 0, Math.PI * 2); g.stroke(); g.restore();
        drawWords(c, lb, x + 40, ly, 'dim', k, { size: LAB, weight: 650 });
      }
    };
  }

  // ====================== dots ======================
  else if (pic.kind === 'dots') {
    const { lo, hi, tick, step } = pic;
    const ax = box(x0 + 90, bot - 110, x1 - 90, bot - 110);
    const X = (v: number) => ax.x0 + ((v - lo) / (hi - lo)) * ax.w;
    const bins = new Map<number, number>();
    const pts = pic.vals.map(v => { const b = Math.round((v - lo) / step); const h0 = bins.get(b) ?? 0; bins.set(b, h0 + 1); return { v, b, h: h0 }; });
    const most = Math.max(...bins.values());
    const rr = Math.min(17, (ax.w / ((hi - lo) / step)) / 2 - 2);
    check(rr >= 9, NAME, 'dots too small');
    const markH = pic.mark !== undefined ? 130 : 30;
    check((most + 0.5) * rr * 2.15 <= ax.y0 - top - markH, NAME, 'dot stacks too tall');
    const ticks: number[] = [];
    for (let v = lo; v <= hi + 1e-9; v += tick) ticks.push(Math.round(v * 1e6) / 1e6);
    const d = pic.d ?? 2;
    check(ticks.length * wW(lo.toFixed(d), LAB) * 0.75 <= ax.w, NAME, 'axis ticks too crowded');
    boxes.set('axis', ax);
    if (pic.mark !== undefined) boxes.set('mark', box(X(pic.mark) - 40, ax.y0 - 60, X(pic.mark) + 40, ax.y0 + 10));
    steps = ['card', 'axis', 'dots', ...(pic.mark !== undefined ? ['mark'] : [])];
    drawBody = (c, P) => {
      const ka = P.k('axis'), kd = P.k('dots'), km = P.k('mark');
      if (ka > 0) {
        inkLine(c, [[ax.x0 - 20, ax.y0], [ax.x0 - 20 + (ax.w + 40) * E.inOut(clamp(ka)), ax.y0]], { col: DUSK.cream, w: 3, seed: 2, rough: 0.2, alpha: 0.85 });
        ticks.forEach((v, i) => {
          const a = E.smooth(lag(ka, i, ticks.length, 0.5));
          inkLine(c, [[X(v), ax.y0 - 10], [X(v), ax.y0 + 10]], { col: DUSK.cream, w: 2.5, seed: 4 + i, rough: 0.1, alpha: a });
          drawWords(c, v.toFixed(d), X(v), ax.y0 + 44, 'dim', a, { size: LAB, align: 'center', weight: 600 });
        });
        drawWords(c, pic.axis, (ax.x0 + ax.x1) / 2, ax.y0 + 98, 'dim', ka, { size: LAB, align: 'center', weight: 650 });
      }
      pts.forEach((p, i) => {
        const a = E.back(clamp(lag(kd, i, pts.length, 0.6)));
        if (a <= 0) return;
        dot(c, X(lo + p.b * step), ax.y0 - rr - 4 - p.h * rr * 2.15, rr * clamp(a), 'second', 0.9);
      });
      if (pic.mark !== undefined && km > 0) {
        const mx = X(pic.mark), yTop = ax.y0 - (most + 1) * rr * 2.15 - 40;
        inkLine(c, [[mx, yTop + 50], [mx, ax.y0 - 4]], { col: col('pick'), w: 4, seed: 9, rough: 0.2, alpha: km });
        drawWords(c, pic.markLabel ?? 'observed', mx, yTop + 20, 'pick', km, { size: LAB, align: mx > (x0 + x1) / 2 ? 'right' : 'left', weight: 700 });
      }
    };
  }

  // ====================== spinner ======================
  else {
    const S = pic.sectors;
    check(S.length >= 2 && S.length <= 5, NAME, '2 to 5 sectors');
    const tot = S.reduce((s, q) => s + q.w, 0);
    const r = Math.min(300, (bot - top) / 2 - 20);
    const cx = x0 + 60 + r, cy = (top + bot) / 2;
    const legX = cx + r + 90, rowH = Math.min(130, (bot - top) / S.length);
    check(legX + 70 + Math.max(...S.map(q => wW(q.label, 52) * 0.85)) + 30 + Math.max(...S.map(q => texW(q.p, 64))) <= x1 - 20, NAME, 'spinner legend too wide');
    const ly0 = cy - (rowH * (S.length - 1)) / 2;
    S.forEach((_, i) => boxes.set(`leg.${i}`, box(legX, ly0 + i * rowH - 40, x1 - 30, ly0 + i * rowH + 40)));
    boxes.set('wheel', box(cx - r, cy - r, cx + r, cy + r));
    steps = ['card', 'sectors'];
    drawBody = (c, P) => {
      const ks = P.k('sectors'), kC = mk(P, 'cond');
      let a0 = -Math.PI / 2;
      S.forEach((q, i) => {
        const span = (q.w / tot) * Math.PI * 2 * E.inOut(clamp(ks));
        const keep = !pic.cond || pic.cond.includes(i), dimK = keep ? 1 : 1 - 0.75 * kC;
        const pts: Pt[] = [[cx, cy], ...Array.from({ length: 40 }, (_, t) => [cx + r * Math.cos(a0 + (span * t) / 39), cy + r * Math.sin(a0 + (span * t) / 39)] as Pt)];
        if (span > 0.001) withAlpha(c, dimK, () => wash(c, pts, spinCol(q.label, i), { seed: 30 + i, rough: 0.8, ink: DUSK.ink, inkW: 3, shade: 0.15 }));
        a0 += span;
        const ly = ly0 + i * rowH, la = E.smooth(lag(ks, i, S.length, 0.5)) * dimK;
        const sw = box(legX, ly - 22, legX + 44, ly + 22);
        withAlpha(c, la, () => { wash(c, rectPts(sw.x0, sw.y0, sw.w, sw.h, 10), spinCol(q.label, i), { seed: 50 + i, rough: 0.5, ink: DUSK.ink, inkW: 2, shade: 0 }); });
        drawWords(c, q.label, legX + 70, ly, 'ink', la, { size: 52, weight: 700 });
        texAt(c, q.p, x1 - 40, ly, 64, 'ink', la, 'right');
        if (pic.cond && keep && kC > 0) ring(c, box(legX, ly - 34, x1 - 36, ly + 34), 'first', kC * 0.8, 6, 3);
      });
      dot(c, cx, cy, 12, DUSK.cream, clamp(ks * 2));
    };
  }

  function where(key: string): Box {
    const b = boxes.get(key);
    check(b, NAME, `no box for "${key}"`);
    return b!;
  }
  function draw(c: Canvas, P: Progress<string>, f: { table?: TableFocus } = {}): void {
    const kc = P.k('card');
    if (kc > 0) {
      withAlpha(c, E.smooth(clamp(kc * 2)), () => wash(c, rectPts(x0, y0, fr.w, fr.h, 18), CARD, { seed: 43, rough: 1.3, ink: DUSK.ink, inkW: 3, shade: 0.25 }));
      if (title) drawWords(c, title, (x0 + x1) / 2, y0 + 44, 'ink', clamp(kc * 2 - 0.6), { size: TITLE, align: 'center', weight: 700 });
    }
    drawBody(c, P, f);
  }
  return { kind: 'CondPic', pic, box: box(x0, y0, x1, y1), steps, where, draw };
}
