// CheckTable: the "do the candidates pass EVERY rule?" table of this lesson (could move to src/lesson/kit/ as a
// constraint / truth-table block). One row per constraint: the rule in words, the rule in symbols, then one cell per
// candidate with the value of the left side and a check or a cross; a last row "every rule?" is the AND of the column.
// Columns are candidates (a plan (3, 6), or a value n = 5) with their label on top.
//   compute  the block evaluates every cell itself (cons.ts test()), so a picture can never show a wrong check
//   layout   a pure layout inside a Frame (TeX >= 60 px, words >= 44 px, words wrap to at most 3 lines when the row is tall enough, nothing outside
//            the frame); widths are estimated without a DOM so generators and tests can check a picture; throws
//            BlockError when the table would not read
//   steps    'grid', 'head' (the symbols' header), 'c.<cand>' (labels), 'w.<row>' (words), 't.<row>' (symbols), '<row>.<cand>' (cells),
//            'w.all' and 'all.<cand>' (the AND row)
//   focus    a lime ring around a column (the viable plan), a lavender pulse on a column, dimmed columns, a lavender ring on a row's symbols
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, drawOn } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { rectPts } from '../../../core/pts';
import { wash } from '../../wash';
import { drawWords } from '../../words';
import { estW } from '../solving-linear-equations/SetLine';
import { type Con, type Vals, cellT, test } from './cons';

const NAME = 'CheckTable';
export const CT = { tex: 60, words: 44, pad: 34, gap: 34, head: 118, all: 124, mark: 64 } as const;

export interface CTCand { key: string; /** TeX on top of the column */ label: string; /** words over the label ("plan 1") */ name?: string; v: Vals }
export interface CTRow { key: string; /** the rule in words (plain text) */ words?: string; /** the rule in symbols (TeX) */ tex: string; con: Con; col?: Paint }
export interface CTParams {
  /** TeX over the symbols column, e.g. (a,\,s) */ head: string;
  /** words over the words column, e.g. "the rule" */ headWords?: string;
  cands: CTCand[]; rows: CTRow[];
  /** the last row: does the column pass every rule? */ all?: boolean;
  /** no words column (symbols only) */ noWords?: boolean;
}
export interface CTFocus {
  /** a lime ring around a candidate's column */ ring?: Record<string, number>;
  /** a lavender ring around a candidate's column (look here) */ pulse?: Record<string, number>;
  /** a candidate's column drawn faint */ dim?: Record<string, number>;
  /** a lavender ring around a row's symbols */ rowRing?: Record<string, number>;
}
export interface CheckTableBlock {
  readonly kind: 'CheckTable';
  readonly box: Box;
  readonly steps: readonly string[];
  /** cell verdicts (row -> cand -> ok) and the AND per column */
  readonly ok: Record<string, Record<string, boolean>>;
  readonly all: Record<string, boolean>;
  readonly where: { col(cand: string): Box; row(row: string): Box; cell(row: string, cand: string): Box; tex(row: string): Box };
  draw(c: Canvas, p: Progress<string>, f?: CTFocus): void;
}

/** estimated width of plain words in the lesson sans (600 weight); conservative so the canvas text fits */
export const wordsW = (s: string, size: number) => s.length * size * 0.5;
/** greedy wrap into lines no wider than w */
export function wrap(s: string, w: number, size: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const word of s.split(/\s+/)) {
    const t = cur ? cur + ' ' + word : word;
    if (wordsW(t, size) <= w || !cur) cur = t; else { out.push(cur); cur = word; }
  }
  if (cur) out.push(cur);
  return out;
}

export function CheckTable(p: CTParams, fr: Frame, th: Theme): CheckTableBlock {
  check(p.cands.length >= 1 && p.cands.length <= 4, NAME, 'one to four candidates');
  check(p.rows.length >= 1 && p.rows.length <= 6, NAME, 'one to six rules');
  const keys = new Set(p.cands.map(c => c.key));
  check(keys.size === p.cands.length, NAME, 'candidate keys must differ');

  // compute every cell
  const ok: Record<string, Record<string, boolean>> = {}, all: Record<string, boolean> = {};
  const cellSrc: Record<string, Record<string, string>> = {};
  for (const r of p.rows) {
    ok[r.key] = {}; cellSrc[r.key] = {};
    for (const c of p.cands) { ok[r.key]![c.key] = test(r.con, c.v).ok; cellSrc[r.key]![c.key] = cellT(r.con, c.v); }
  }
  for (const c of p.cands) all[c.key] = p.rows.every(r => ok[r.key]![c.key]);

  // row height first: it decides how many lines of words a rule may take
  const n = p.rows.length;
  const rowH = clamp((fr.h - 2 * CT.pad - CT.head - (p.all ? CT.all : 0)) / n, 104, 170);
  check(rowH >= 104, NAME, 'too many rules for the frame');
  const maxLines = Math.max(1, Math.floor((rowH - 8) / (CT.words * 1.1)));
  // column widths
  const hasWords = !p.noWords && p.rows.some(r => r.words);
  const texW = Math.max(estW(p.head, CT.tex), ...p.rows.map(r => estW(r.tex, CT.tex))) + 16;
  const candW = p.cands.map(c => Math.max(150, estW(c.label, CT.tex) + 16, c.name ? wordsW(c.name, CT.words) + 16 : 0, ...p.rows.map(r => (cellSrc[r.key]![c.key] ? estW(cellSrc[r.key]![c.key]!, CT.tex) + 24 : 0) + CT.mark)));
  const fixed = texW + candW.reduce((a, b) => a + b, 0) + CT.gap * (p.cands.length + (hasWords ? 1 : 0)) + 2 * CT.pad;
  let wordsCol = 0;
  const lines: Record<string, string[]> = {};
  if (hasWords) {
    const room = fr.w - fixed;
    const longest = Math.max(wordsW(p.headWords ?? '', CT.words), ...p.rows.map(r => wordsW(r.words ?? '', CT.words)), wordsW('every rule?', CT.words));
    wordsCol = Math.min(room, longest, 640);
    check(wordsCol >= 300, NAME, 'the symbols and candidates leave too little room for the words');
    for (const r of p.rows) {
      lines[r.key] = r.words ? wrap(r.words, wordsCol, CT.words) : [];
      check(lines[r.key]!.length <= Math.min(3, maxLines), NAME, `the words of rule '${r.key}' need more than ${Math.min(3, maxLines)} lines`);
      for (const L of lines[r.key]!) check(wordsW(L, CT.words) <= wordsCol + 1, NAME, `a word in rule '${r.key}' is too long`);
    }
    wordsCol = Math.max(...Object.values(lines).flat().map(L => wordsW(L, CT.words)), wordsW(p.headWords ?? '', CT.words), p.all ? wordsW('every rule?', CT.words) : 0);
  }
  const totalW = fixed + wordsCol;
  check(totalW <= fr.w + 0.5, NAME, `the table is ${Math.round(totalW)} px wide, the frame ${fr.w}`);
  const x0 = fr.x + (fr.w - totalW) / 2;
  const colX: number[] = [];
  let x = x0 + CT.pad;
  const wordsX = x; if (hasWords) x += wordsCol + CT.gap;
  const texX = x; x += texW + CT.gap;
  for (const w of candW) { colX.push(x); x += w + CT.gap; }

  const totalH = 2 * CT.pad + CT.head + n * rowH + (p.all ? CT.all : 0);
  check(totalH <= fr.h + 0.5, NAME, 'the table is taller than the frame');
  const y0 = fr.y + (fr.h - totalH) / 2;
  const headY = y0 + CT.pad + CT.head / 2;
  const rowY = p.rows.map((_, i) => y0 + CT.pad + CT.head + rowH * (i + 0.5));
  const allY = y0 + CT.pad + CT.head + n * rowH + CT.all / 2;
  const tb = box(x0, y0, x0 + totalW, y0 + totalH);
  const ci = (k: string) => { const i = p.cands.findIndex(c => c.key === k); check(i >= 0, NAME, `no candidate '${k}'`); return i; };
  const ri = (k: string) => { const i = p.rows.findIndex(r => r.key === k); check(i >= 0, NAME, `no rule '${k}'`); return i; };
  const colBox = (i: number) => box(colX[i]! - CT.gap / 2 + 4, y0 + 10, colX[i]! + candW[i]! + CT.gap / 2 - 4, y0 + totalH - 10);
  const cellBox = (r: number, i: number) => box(colX[i]!, rowY[r]! - rowH / 2 + 8, colX[i]! + candW[i]!, rowY[r]! + rowH / 2 - 8);
  const texBoxOf = (r: number) => box(texX - 8, rowY[r]! - CT.tex * 0.6, texX + estW(p.rows[r]!.tex, CT.tex) + 8, rowY[r]! + CT.tex * 0.6);

  // ---------- drawing ----------
  const fCache = new Map<string, Formula>();
  const F = (src: string): Formula => { let f = fCache.get(src); if (!f) { f = tex(src) as Formula; fCache.set(src, f); } return f; };
  function ring(c: Canvas, B: Box, col: Paint, k: number, fill = 0.12): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.fillStyle = paint(th, col, 'fill'); g.globalAlpha *= fill;
    g.beginPath(); g.roundRect(B.x0, B.y0, B.w, B.h, 18); g.fill();
    g.globalAlpha /= fill; g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 4;
    g.beginPath(); g.roundRect(B.x0, B.y0, B.w, B.h, 18); g.stroke();
    g.restore();
  }
  function mark(c: Canvas, cx: number, cy: number, good: boolean, k: number, s = 1): void {
    if (k <= 0) return;
    if (good) drawOn(c, [[cx - 22 * s, cy + 2 * s], [cx - 6 * s, cy + 18 * s], [cx + 24 * s, cy - 20 * s]], E.inOut(clamp(k)), { col: 'link', lw: 8 * Math.sqrt(s) });
    else {
      drawOn(c, [[cx - 17 * s, cy - 17 * s], [cx + 17 * s, cy + 17 * s]], E.inOut(clamp(k * 2)), { col: 'wrong', lw: 8 * Math.sqrt(s) });
      drawOn(c, [[cx + 17 * s, cy - 17 * s], [cx - 17 * s, cy + 17 * s]], E.inOut(clamp(k * 2 - 1)), { col: 'wrong', lw: 8 * Math.sqrt(s) });
    }
  }
  function rule(c: Canvas, xa: number, ya: number, xb: number, yb: number, k: number, a = 1): void {
    if (k <= 0) return;
    c.g.save(); c.g.globalAlpha *= a; drawOn(c, [[xa, ya], [xb, yb]], k, { col: th.rule, lw: 3 }); c.g.restore();
  }

  function draw(c: Canvas, P: Progress<string>, f: CTFocus = {}): void {
    const kg = clamp(P.k('grid'));
    if (kg <= 0) return;
    const dimOf = (k: string) => 1 - 0.7 * clamp(f.dim?.[k] ?? 0);
    c.g.save(); c.g.globalAlpha *= kg;
    wash(c, rectPts(tb.x0, tb.y0, tb.w, tb.h, 24), '#121531', { seed: 91, rough: 1.2, ink: null, shade: 0.08 });
    c.g.restore();
    const ke = E.inOut(kg);
    // header line, the line above the AND row, and the column rules
    rule(c, tb.x0 + 20, y0 + CT.pad + CT.head - 6, tb.x0 + 20 + (tb.w - 40) * ke, y0 + CT.pad + CT.head - 6, 1);
    if (p.all) rule(c, tb.x0 + 20, allY - CT.all / 2 + 4, tb.x0 + 20 + (tb.w - 40) * ke, allY - CT.all / 2 + 4, 1, 0.8);
    for (let r = 1; r < n; r++) { const yy = rowY[r]! - rowH / 2; rule(c, tb.x0 + 30, yy, tb.x0 + 30 + (tb.w - 60) * ke, yy, 1, 0.35); }
    const sep = (xx: number) => rule(c, xx, tb.y0 + 24, xx, tb.y0 + 24 + (tb.h - 48) * ke, 1, 0.55);
    if (hasWords) sep(texX - CT.gap / 2);
    sep(colX[0]! - CT.gap / 2);
    // focus rings behind the content
    p.cands.forEach((cd, i) => { ring(c, colBox(i), 'link', f.ring?.[cd.key] ?? 0); ring(c, colBox(i), 'pick', f.pulse?.[cd.key] ?? 0, 0.08); });
    p.rows.forEach((r, i) => ring(c, texBoxOf(i), 'pick', f.rowRing?.[r.key] ?? 0, 0.1));
    // header
    const kh = clamp(P.k('head'));
    if (kh > 0) texDraw(c, F(p.head), texX, headY, { size: CT.tex, align: 'left', col: 'pick', k: kh });
    if (hasWords && p.headWords) drawWords(c, p.headWords, wordsX, headY, 'dim', kg, { size: CT.words });
    p.cands.forEach((cd, i) => {
      const k = clamp(P.k('c.' + cd.key));
      if (k > 0) {
        c.g.save(); c.g.globalAlpha *= dimOf(cd.key);
        const named = p.cands.some(q => q.name);
        if (cd.name) drawWords(c, cd.name, colX[i]! + candW[i]! / 2, headY - 30, 'dim', clamp(k / 0.6), { size: CT.words, align: 'center' });
        texDraw(c, F(cd.label), colX[i]! + candW[i]! / 2, named ? headY + 26 : headY, { size: CT.tex, align: 'center', col: 'pick', k });
        c.g.restore();
      }
    });
    // rules
    p.rows.forEach((r, ri0) => {
      const y = rowY[ri0]!;
      const kw = clamp(P.k('w.' + r.key));
      if (hasWords && kw > 0) {
        const L = lines[r.key]!, lh = CT.words * 1.1;
        L.forEach((s, j) => drawWords(c, s, wordsX, y + (j - (L.length - 1) / 2) * lh, 'ink', kw, { size: CT.words, weight: 500 }));
      }
      const kt = clamp(P.k('t.' + r.key));
      if (kt > 0) texDraw(c, F(r.tex), texX, y, { size: CT.tex, align: 'left', col: r.col ?? 'ink', k: kt });
      p.cands.forEach((cd, i) => {
        const k = clamp(P.k(`${r.key}.${cd.key}`));
        if (k <= 0) return;
        c.g.save(); c.g.globalAlpha *= dimOf(cd.key);
        const src = cellSrc[r.key]![cd.key]!, good = ok[r.key]![cd.key]!;
        const right = colX[i]! + candW[i]!;
        if (src) {
          const w = estW(src, CT.tex);
          const cx = colX[i]! + (candW[i]! - CT.mark) / 2;
          texDraw(c, F(src), cx - w / 2, y, { size: CT.tex, align: 'left', col: good ? 'ink' : 'wrong', alpha: clamp(k / 0.5) });
          mark(c, right - CT.mark / 2, y, good, clamp((k - 0.45) / 0.55));
        } else mark(c, colX[i]! + candW[i]! / 2, y, good, clamp(k / 0.8));
        c.g.restore();
      });
    });
    // the AND row
    if (p.all) {
      const kw = clamp(P.k('w.all'));
      if (kw > 0) {
        if (hasWords) drawWords(c, 'every rule?', wordsX, allY, 'ink', kw, { size: CT.words, weight: 700 });
        else drawWords(c, 'every rule?', texX, allY, 'ink', kw, { size: CT.words, weight: 700 });
      }
      p.cands.forEach((cd, i) => {
        const k = clamp(P.k('all.' + cd.key));
        if (k > 0) mark(c, colX[i]! + candW[i]! / 2, allY, all[cd.key]!, k, 1.35);
      });
    }
  }

  const stepsList = ['grid', 'head', ...p.cands.map(c => 'c.' + c.key), ...p.rows.flatMap(r => ['w.' + r.key, 't.' + r.key, ...p.cands.map(c => `${r.key}.${c.key}`)]), ...(p.all ? ['w.all', ...p.cands.map(c => 'all.' + c.key)] : [])];
  return {
    kind: 'CheckTable', box: tb, steps: stepsList, ok, all,
    where: {
      col: k => colBox(ci(k)),
      row: k => { const i = ri(k); return box(tb.x0 + 10, rowY[i]! - rowH / 2, tb.x1 - 10, rowY[i]! + rowH / 2); },
      cell: (r, k) => cellBox(ri(r), ci(k)),
      tex: k => texBoxOf(ri(k)),
    },
    draw,
  };
}
