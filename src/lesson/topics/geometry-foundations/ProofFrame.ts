// ProofFrame: a two-column proof on a slate (the canvas half of the proof frame; the panel half, Parsons ordering
// and the reason menu, is proofPanel.ts). Given / Prove at the top, then numbered rows: a statement (TeX) | a reason
// (words, wrapped). Rows fill in one at a time; a cell can wait as '?' (the student's answer) until it is revealed;
// a row can be ringed (focus), struck (a circular or unlicensed step) or dimmed. Pool mode (Parsons) labels the rows
// A, B, C ... instead of 1, 2, 3 and shows them as loose lines to put in order.
//
// Steps: frame (slate, Given, Prove, heads), s<i> (statement of row i), r<i> (reason of row i).
// Focus: rings [{ i, col, k }], ask [{ i, cell: 'st' | 'rs' }], strike [{ i, k }], dim [{ i, k }], glow cells.
// Could move to the kit: every Geometry lesson after this one writes two-column proofs.
import { type Box, box, clamp } from '../../../core/math';
import type { Canvas } from '../../../core/draw';
import { strike as strikeLine } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { slate } from '../../annotate';
import { drawWords } from '../../words';
import { textW } from './geo';

export interface PRow { st: string; rs: string }
export interface ProofParams {
  /** TeX after "Given:" (one or two lines) */
  given?: readonly string[];
  /** TeX after "Prove:" */
  prove?: string;
  rows: readonly PRow[];
  /** Parsons pool: rows lettered A, B, C ... */
  pool?: boolean;
  /** TeX that sizes the statement column (so a proof that fills in row by row keeps its columns) */
  reserve?: readonly string[];
  /** reasons that size the reason column (they arrive later) */
  reserveRs?: readonly string[];
  /** the number of the first row (a proof shown from its middle) */
  first?: number;
  /** colour of every statement (default ink) */
  stCol?: readonly (Paint | undefined)[];
}
export type ProofStep = 'frame' | `s${number}` | `r${number}`;
export interface ProofFocus {
  rings?: readonly { i: number; col: Paint; k: number }[];
  ask?: readonly { i: number; cell: 'st' | 'rs' }[];
  strike?: readonly { i: number; k: number }[];
  dim?: readonly { i: number; k: number }[];
}
export interface ProofBlock {
  readonly kind: 'ProofFrame';
  readonly where: { row(i: number): Box; st(i: number): Box; rs(i: number): Box; frame: Box };
  draw(c: Canvas, P: Progress<ProofStep>, f?: ProofFocus): void;
}
const NAME = 'ProofFrame';
const RS = 44, HEAD = 44, GIV = 54;

/** words wrapped to a width (estimate on the wide side, so the real text always fits) */
export function wrapWords(t: string, w: number, size: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const word of t.split(/\s+/)) {
    const next = cur ? cur + ' ' + word : word;
    if (cur && textW(next, size) > w) { out.push(cur); cur = word; } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

export function ProofFrame(p: ProofParams, fr: Frame, th: Theme): ProofBlock {
  const n = p.rows.length;
  check(n >= 1 && n <= 7, NAME, '1 to 7 rows');
  const ST = p.rows.map(r => (r.st ? tex(r.st) as Formula : null));
  const Q = tex('?') as Formula;
  const G = (p.given ?? []).map(s => tex(s) as Formula), PR = p.prove ? tex(p.prove) as Formula : null;
  const pad = 30, numW = 62, x0 = fr.x + pad, x1 = fr.x + fr.w - pad;
  // the statement column takes what it needs (at most 60 % of the width); the reasons wrap in the rest
  let ss = 60;
  const RES = (p.reserve ?? []).map(s => tex(s) as Formula);
  const stNeed = (s: number) => Math.max(...ST.map(F => (F ? texWidth(F, s) : 0)), ...RES.map(F => texWidth(F, s)), 300);
  // the reasons need room for their longest single word ("Corresponding"); the statements get the rest
  const longWord = Math.max(0, ...[...p.rows.map(r => r.rs), ...(p.reserveRs ?? [])].flatMap(r => r.split(/\s+/).map(w => textW(w, RS))));
  const CAP = Math.max(0.5, Math.min(0.7, (x1 - x0 - Math.max(300, longWord + 30) - 18) / (x1 - x0)));
  while (ss > 50 && numW + stNeed(ss) + 36 > (x1 - x0) * CAP) ss -= 2;
  const stW = Math.min((x1 - x0) * CAP, numW + stNeed(ss) + 36);
  check(numW + stNeed(ss) <= (x1 - x0) * CAP + 4, NAME, 'a statement is too wide');
  const rsX = x0 + stW + 18, rsW = x1 - rsX;
  check(rsW >= 280, NAME, 'no room for the reasons');
  const RL = p.rows.map(r => (r.rs ? wrapWords(r.rs, rsW, RS) : []));
  const nl = (i: number) => Math.max(1, RL[i]!.length);
  check(RL.every(l => l.length <= 3), NAME, 'a reason needs more than 3 lines');
  // given / prove lines: size to fit the width after the word
  const gx = x0 + textW('Prove:', 46) + 18, gW = x1 - gx;
  const fitTex = (F: Formula) => { let s = GIV; while (s > 44 && texWidth(F, s) > gW) s -= 2; return s; };
  const gs = G.map(fitTex), ps = PR ? fitTex(PR) : GIV;
  check(G.every((F, i) => texWidth(F, gs[i]!) <= gW + 2) && (!PR || texWidth(PR, ps) <= gW + 2), NAME, 'the Given or Prove line is too wide');
  // vertical rhythm: roomy when it fits, tighter when the proof is long
  let gStep = 70, lineH = 52, rowPad = 26;
  const need = () => pad + 34 + G.length * gStep + (PR ? gStep : 0) + 8 + 46 + p.rows.reduce((s, _, i) => s + Math.max(ss * 1.25, nl(i) * lineH) + rowPad, 0);
  while (need() > fr.h - 14 && (rowPad > 2 || lineH > 41)) { rowPad = Math.max(2, rowPad - 4); gStep = Math.max(50, gStep - 4); lineH = Math.max(41, lineH - 2); }
  let y = fr.y + pad + 34;
  const givenY = G.map(() => { const yy = y; y += gStep; return yy; });
  const proveY = PR ? y : 0; if (PR) y += gStep;
  const headY = y + 8; y = headY + 46;
  const rowH = p.rows.map((_, i) => Math.max(ss * 1.25, nl(i) * lineH) + rowPad);
  const total = rowH.reduce((s, h) => s + h, 0);
  check(y + total <= fr.y + fr.h - 14, NAME, `the rows do not fit (${Math.round(y + total - fr.y - fr.h + 14)} px over)`);
  const rowTop: number[] = []; { let t = y; for (const h of rowH) { rowTop.push(t); t += h; } }
  const rowBox = (i: number) => box(x0 - 12, rowTop[i]! + 3, x1 + 12, rowTop[i]! + rowH[i]! - 3);
  const stBox = (i: number) => box(x0 + numW - 6, rowTop[i]! + 6, x0 + stW, rowTop[i]! + rowH[i]! - 6);
  const rsBox = (i: number) => box(rsX - 8, rowTop[i]! + 6, x1 + 6, rowTop[i]! + rowH[i]! - 6);
  const frameBox = box(fr.x, fr.y, fr.x + fr.w, rowTop[n - 1]! + rowH[n - 1]! + 16);

  function draw(c: Canvas, P: Progress<ProofStep>, f: ProofFocus = {}): void {
    const kF = P.k('frame');
    if (kF <= 0) return;
    slate(c, frameBox, kF);
    const { g } = c;
    G.forEach((F, i) => {
      if (i === 0) drawWords(c, 'Given:', x0, givenY[0]!, 'dim', kF, { size: 46 });
      texDraw(c, F, gx, givenY[i]!, { size: gs[i]!, align: 'left', valign: 'center', k: kF, col: 'ink' });
    });
    if (PR) { drawWords(c, 'Prove:', x0, proveY, 'dim', kF, { size: 46 }); texDraw(c, PR, gx, proveY, { size: ps, align: 'left', valign: 'center', k: kF, col: 'link' }); }
    drawWords(c, p.pool ? 'Lines to order' : 'Statements', x0 + numW, headY, 'faint', kF, { size: HEAD });
    drawWords(c, 'Reasons', rsX, headY, 'faint', kF, { size: HEAD });
    g.save(); g.globalAlpha *= clamp(kF); g.strokeStyle = paint(th, 'faint', 'line'); g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x0, headY + 30); g.lineTo(x1, headY + 30);
    g.moveTo(rsX - 18, headY - 26); g.lineTo(rsX - 18, rowTop[n - 1]! + rowH[n - 1]! - 6);
    g.stroke(); g.restore();
    const asks = new Set((f.ask ?? []).map(a => `${a.i}${a.cell}`));
    for (let i = 0; i < n; i++) {
      const kS = P.k(`s${i}`), kR = P.k(`r${i}`);
      const dimK = (f.dim ?? []).filter(d => d.i === i).reduce((m, d) => Math.max(m, d.k), 0);
      const alpha = 1 - 0.55 * clamp(dimK);
      for (const R of f.rings ?? []) if (R.i === i && R.k > 0) {
        const b = rowBox(i);
        g.save(); g.globalAlpha *= clamp(R.k);
        g.fillStyle = paint(th, R.col, 'fill'); g.globalAlpha *= 0.14; g.beginPath(); g.roundRect(b.x0, b.y0, b.w, b.h, 14); g.fill();
        g.globalAlpha /= 0.14; g.strokeStyle = paint(th, R.col, 'fill'); g.lineWidth = 4; g.beginPath(); g.roundRect(b.x0, b.y0, b.w, b.h, 14); g.stroke();
        g.restore();
      }
      const cy = rowTop[i]! + rowH[i]! / 2;
      const kRow = Math.max(kS, asks.has(`${i}st`) ? kF : 0, kR > 0 && !ST[i] ? kR : 0);
      if (kRow > 0) drawWords(c, p.pool ? String.fromCharCode(65 + i) : `${(p.first ?? 1) + i}.`, x0, cy, p.pool ? 'pick' : 'faint', kRow * alpha, { size: 46 });
      // statement
      if (asks.has(`${i}st`) && kS < 1) texDraw(c, Q, x0 + numW, cy, { size: ss, align: 'left', valign: 'center', col: 'pick', alpha: kF * (1 - kS) });
      if (ST[i] && kS > 0) texDraw(c, ST[i]!, x0 + numW, cy, { size: ss, align: 'left', valign: 'center', k: kS, col: p.stCol?.[i] ?? 'ink', alpha });
      // reason
      if (asks.has(`${i}rs`) && kR < 1) drawWords(c, '?', rsX, cy, 'pick', kF * (1 - kR), { size: 54, weight: 700 });
      if (kR > 0) {
        const L = RL[i]!, top = cy - ((L.length - 1) * lineH) / 2;
        L.forEach((t, j) => drawWords(c, t, rsX, top + j * lineH, asks.has(`${i}rs`) ? 'link' : 'dim', kR * alpha, { size: RS }));
      }
      for (const s of f.strike ?? []) if (s.i === i && s.k > 0) {
        const b = rowBox(i);
        strikeLine(c, b.x0 + 30, b.cy + 4, b.x1 - 30, b.cy - 4, s.k, { lw: 6 });
      }
    }
  }
  return { kind: 'ProofFrame', where: { row: rowBox, st: stBox, rs: rsBox, frame: frameBox }, draw };
}
