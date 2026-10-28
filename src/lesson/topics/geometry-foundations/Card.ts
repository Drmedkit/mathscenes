// Card.ts: statement cards on a slate (a definition, a claim, a scenario, a paragraph proof). Words wrap to the box;
// <b class="a|b|s|w"> marks colour a phrase by its role (amber hypothesis, teal conclusion, lime answer, red wrong).
// One card (a box with paragraphs) or a grid of headed cards (A, B, C, D). Steps: k (the slate and the first
// paragraphs), k2 (paragraphs added by the solve).
import type { Canvas } from '../../../core/draw';
import { type Box, box } from '../../../core/math';
import type { Paint } from '../../../core/theme';
import { slate } from '../../annotate';
import { drawWords, wordsBox } from '../../words';

interface Seg { t: string; col: Paint }
const COL: Record<string, Paint> = { a: 'first', b: 'second', s: 'link', w: 'wrong' };
const clean = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
function segsOf(src: string): Seg[] {
  const out: Seg[] = [];
  for (const m of src.matchAll(/<b class="(a|b|s|w)">(.*?)<\/b>|([^<]+)|<[^>]+>/g)) {
    if (m[1]) out.push({ t: clean(m[2]!), col: COL[m[1]]! });
    else if (m[3]) out.push({ t: clean(m[3]), col: 'ink' });
  }
  return out;
}
interface Word { t: string; col: Paint; x: number; row: number; para: number }
function layout(paras: string[], maxW: number, size: number): { words: Word[]; rows: number; rowW: Map<number, number>; gapsBefore: number[] } {
  const words: Word[] = [], rowW = new Map<number, number>(), gapsBefore: number[] = [];
  const sp = wordsBox(' ', 0, 0, { size }).w || size * 0.28;
  let row = 0;
  paras.forEach((p, pi) => {
    if (pi > 0) { row++; gapsBefore.push(row); }
    let x = 0, space = false;
    for (const s of segsOf(p)) for (const w of s.t.split(/(\s+)/)) {
      if (!w) continue;
      if (/^\s+$/.test(w)) { space = true; continue; }
      const ww = wordsBox(w, 0, 0, { size }).w;
      if (x > 0 && space) x += sp;
      if (x > 0 && space && x + ww > maxW) { row++; x = 0; }
      words.push({ t: w, col: s.col, x, row, para: pi });
      x += ww; space = false;
      rowW.set(row, Math.max(rowW.get(row) ?? 0, x));
    }
  });
  return { words, rows: row + 1, rowW, gapsBefore };
}

/** one card: paragraphs (the first `nFirst` show at k, the rest at k2), centred rows or left-aligned */
export function cardPainter(paras: string[], b: Box, o: { size?: number; nFirst?: number; align?: 'center' | 'left'; head?: string } = {}): { draw(c: Canvas, k: number, k2?: number): void; fits: boolean } {
  let size = o.size ?? 52;
  const nFirst = o.nFirst ?? paras.length;
  const LHf = 1.5, pad = 60;
  let L = layout(paras, b.w - 2 * pad, size);
  const height = () => L.rows * size * LHf + L.gapsBefore.length * 18 + (o.head ? 70 : 0);
  while (height() > b.h - 2 * pad + 20 && size > 44) { size -= 2; L = layout(paras, b.w - 2 * pad, size); }
  const fits = height() <= b.h - 2 * pad + 20;
  const LH = size * LHf, top = b.cy - (height() - (o.head ? 70 : 0)) / 2 + LH / 2 - (o.head ? 0 : 0) + (o.head ? 35 : 0);
  const ys = (row: number) => top + row * LH + L.gapsBefore.filter(g => g <= row).length * 18;
  return {
    fits,
    draw(c: Canvas, k: number, k2 = 0) {
      if (k <= 0) return;
      slate(c, b, k);
      if (o.head) drawWords(c, o.head, b.x0 + pad, top - 70 + 4, 'dim', k, { size: 44 });
      for (const w of L.words) {
        const kk = w.para < nFirst ? k : k2;
        if (kk <= 0) continue;
        const x = o.align === 'left' ? b.x0 + pad + w.x : b.cx - (L.rowW.get(w.row) ?? 0) / 2 + w.x;
        drawWords(c, w.t, x, ys(w.row), w.col, kk, { size });
      }
    },
  };
}
/** a grid of headed cards (2 per row) */
export function cardsPainter(cards: { head: string; text: string }[], area: Box): { draw(c: Canvas, k: number, ring?: number, kr?: number): void } {
  const n = cards.length, cols = n === 1 ? 1 : n === 3 ? 3 : 2, rows = Math.ceil(n / cols), gap = 30;
  const w = (area.w - gap * (cols - 1)) / cols, hh = (area.h - gap * (rows - 1)) / rows;
  const P = cards.map((cd, i) => {
    const x = area.x0 + (i % cols) * (w + gap), y = area.y0 + Math.floor(i / cols) * (hh + gap);
    return cardPainter([cd.text], box(x, y, x + w, y + hh), { size: n === 1 ? 54 : 46, align: 'left', head: cd.head });
  });
  return { draw(c, k) { P.forEach(p => p.draw(c, k)); } };
}
