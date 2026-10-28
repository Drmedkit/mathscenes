// eulerLayout.ts: the pure layout of the Euler picture (Euler.ts draws it). No DOM: tests check that every
// generated practice picture fits. Word widths are estimated generously (0.56 em per character at weight 600).
//
// The domain is a big rounded box with its name on top. Inside it, region P (the hypothesis, amber) and region Q
// (the conclusion, teal) are rounded boxes arranged by how p and q relate over the domain:
//   nested   P inside Q (every p is a q: "if p then q" is true)        zones pq, q, o
//   overlap  P and Q cross (some p is not a q: false)                   zones p, pq, q, o
//   same     P and Q coincide (p if and only if q)                      zones pq, o
//   apart    P and Q do not meet                                        zones p, q, o
//   one      only P (an open sentence's truth set, an "all" claim)      zones p, o
// Members outside both sit in a strip along the bottom. Before sorting, the members stand in a neat line-up in
// value order (so the picture does not give the answer away); `sorted` are their places in the zones.
import { type Box, type Pt, box } from '../../../core/math';
import { BlockError } from '../../../blocks/block';
import type { Frame } from '../../../blocks/block';
import type { Layout, Shape, Zone } from './logic';

export interface ETok { tex?: string; shape?: Shape; letter?: string; zone: Zone }
export interface EulerParams {
  layout: Layout;
  /** words under "Domain:" ("the integers 1 to 12") */
  domain: string;
  /** region labels (words) */
  P: string; Q?: string;
  tokens: readonly ETok[];
}
export interface LabelL { lines: string[]; x: number; y: number; box: Box }
export interface EulerLayoutT {
  D: Box; domainY: number; domainText: string;
  P: Box; Q: Box | null;
  labelP: LabelL; labelQ: LabelL | null;
  cw: number; ch: number;
  lineup: Pt[]; sorted: Pt[];
  zone: Partial<Record<Zone, Box>>;
  shapes: boolean;
}
export const TOK = 64, LBL = 44, DOM = 44;
const NAME = 'Euler';
const fail = (msg: string): never => { throw new BlockError(NAME, msg); };
export const estW = (s: string, size: number) => s.length * size * 0.56;
/** the width of a TeX token (digits and a minus) */
export const tokW = (t: ETok) => (t.shape ? 156 : estW((t.tex ?? '').replace(/\\[a-z]+|[{}]/g, '').replace(/^-/, '−'), TOK) + 6);

function wrap(text: string, maxW: number): string[] {
  const words = text.split(' '), lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (cur && estW(t, LBL) > maxW) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  if (lines.some(l => estW(l, LBL) > maxW)) fail(`the label "${text}" does not fit in ${Math.round(maxW)} px`);
  if (lines.length > 2) fail(`the label "${text}" needs more than two lines`);
  return lines;
}
const band = (lines: number) => lines * 52 + 26;
function label(text: string, x0: number, y0: number, maxW: number): LabelL {
  const lines = wrap(text, maxW);
  const w = Math.max(...lines.map(l => estW(l, LBL)));
  return { lines, x: x0, y: y0 + 40, box: box(x0, y0 + 40 - LBL * 0.5, x0 + w, y0 + 40 + (lines.length - 1) * 52 + LBL * 0.5) };
}
/** n cells in a grid centred in the area; throws when they do not fit */
function grid(n: number, a: Box, cw: number, ch: number, what: string, rowsMax = Infinity): Pt[] {
  if (n === 0) return [];
  const rowsFit = Math.min(rowsMax, Math.floor(a.h / ch)), colsFit = Math.floor(a.w / cw);
  if (rowsFit < 1 || colsFit < 1) fail(`no room for ${what}`);
  const cols = Math.max(Math.ceil(n / rowsFit), Math.min(n, colsFit, Math.ceil(Math.sqrt(n * 1.6))));
  if (cols > colsFit) fail(`${n} members do not fit in ${what}`);
  const rows = Math.ceil(n / cols);
  const x0 = a.cx - (cols * cw) / 2 + cw / 2, y0 = a.cy - (rows * ch) / 2 + ch / 2;
  return Array.from({ length: n }, (_, i) => {
    const r = Math.floor(i / cols), c = i % cols, inRow = r === rows - 1 ? n - r * cols : cols;
    const xr = a.cx - (inRow * cw) / 2 + cw / 2;
    return [inRow === cols ? x0 + c * cw : xr + c * cw, y0 + r * ch] as Pt;
  });
}
const colsFor = (n: number, rows: number) => (n === 0 ? 0 : Math.ceil(n / Math.max(1, rows)));

export function eulerLayout(p: EulerParams, fr: Frame): EulerLayoutT {
  const shapes = p.tokens.some(t => t.shape);
  const cw = shapes ? 196 : Math.max(108, ...p.tokens.map(t => tokW(t) + 40)), ch = shapes ? 218 : 100;
  const D = box(fr.x + 4, fr.y + 4, fr.x + fr.w - 4, fr.y + fr.h - 4);
  const domainText = `Domain: ${p.domain}`;
  if (estW(domainText, DOM) > D.w - 40) fail('the domain name is too long');
  const domainY = D.y0 + 46, RY0 = D.y0 + 92;
  const ids = (z: Zone) => p.tokens.map((t, i) => (t.zone === z ? i : -1)).filter(i => i >= 0);
  const allowed: Record<Layout, Zone[]> = { nested: ['pq', 'q', 'o'], overlap: ['p', 'pq', 'q', 'o'], same: ['pq', 'o'], apart: ['p', 'q', 'o'], one: ['p', 'o'] };
  for (const t of p.tokens) if (!allowed[p.layout].includes(t.zone)) fail(`a member in zone ${t.zone} cannot sit in a ${p.layout} picture`);
  if (p.layout !== 'one' && !p.Q) fail('two regions need two labels');
  // the outside strip along the bottom
  const nO = ids('o').length, colsO = Math.floor((D.w - 40) / cw), rO = nO ? Math.ceil(nO / colsO) : 0;
  const stripH = rO ? rO * ch + 16 : 0;
  const RY1 = D.y1 - 18 - stripH;
  if (RY1 - RY0 < 300) fail('the regions have no room');
  const sorted: Pt[] = new Array(p.tokens.length);
  const zone: Partial<Record<Zone, Box>> = {};
  const put = (z: Zone, a: Box, what: string) => {
    const I = ids(z), P = grid(I.length, a, cw, ch, what);
    I.forEach((i, k) => { sorted[i] = P[k]!; });
    zone[z] = a;
  };
  if (nO) put('o', box(D.x0 + 20, RY1 + 8, D.x1 - 20, RY1 + 8 + rO * ch), 'the outside strip');
  else zone.o = box(D.x0 + 20, RY1, D.x1 - 20, D.y1 - 10);
  let P: Box, Q: Box | null = null, labelP: LabelL, labelQ: LabelL | null = null;
  const W = D.w - 40, x0 = D.x0 + 20;
  if (p.layout === 'one') {
    P = box(x0, RY0, x0 + W, RY1);
    labelP = label(p.P, P.x0 + 30, P.y0, P.w - 60);
    put('p', box(P.x0 + 16, P.y0 + band(labelP.lines.length), P.x1 - 16, P.y1 - 12), 'region P');
  } else if (p.layout === 'same') {
    Q = box(x0, RY0, x0 + W, RY1);
    P = box(Q.x0 + 14, Q.y0 + 14, Q.x1 - 14, Q.y1 - 14);
    labelP = label(p.P, P.x0 + 26, P.y0 - 6, P.w / 2 - 50);
    labelQ = label(p.Q!, P.cx + 10, P.y0 - 6, P.w / 2 - 40);
    const lb = Math.max(labelP.lines.length, labelQ.lines.length);
    put('pq', box(P.x0 + 16, P.y0 + band(lb), P.x1 - 16, P.y1 - 12), 'the shared region');
  } else if (p.layout === 'nested') {
    Q = box(x0, RY0, x0 + W, RY1);
    labelQ = label(p.Q!, Q.x0 + 30, Q.y0, Q.w - 60);
    const yIn = Q.y0 + band(labelQ.lines.length) - 6;
    const nP = ids('pq').length;
    // P's width: enough columns for its members and its label
    let wP = 320;
    for (let k = 0; k < 2; k++) {
      const lp = wrap(p.P, wP - 50).length;
      const rows = Math.floor((Q.y1 - 26 - (yIn + band(lp)) - 12) / ch);
      wP = Math.max(320, colsFor(nP, rows) * cw + 40);
    }
    P = box(Q.x0 + 26, yIn, Q.x0 + 26 + wP, Q.y1 - 26);
    labelP = label(p.P, P.x0 + 24, P.y0 - 6, P.w - 50);
    put('pq', box(P.x0 + 16, P.y0 + band(labelP.lines.length) - 6, P.x1 - 16, P.y1 - 12), 'region P');
    put('q', box(P.x1 + 14, yIn + 4, Q.x1 - 16, Q.y1 - 16), 'Q outside P');
  } else {
    // overlap / apart: P on the left, Q on the right; overlap shares a middle band
    const over = p.layout === 'overlap', dy = over ? 34 : 0;
    const Pb = box(0, RY0, 0, RY1 - dy), Qb = box(0, RY0 + dy, 0, RY1);
    // label bands first (at the minimum widths), then the rows they leave
    const minW = 300;
    const lpL = wrap(p.P, minW - 50).length, lqL = wrap(p.Q!, minW - 50).length;
    const yT = Math.max(Pb.y0 + band(lpL), Qb.y0 + band(lqL)) - 6, yB = Math.min(Pb.y1, Qb.y1) - 12;
    const rows = Math.floor((yB - yT) / ch);
    if (rows < 1) fail('no rows left under the labels');
    const wp = Math.max(minW, colsFor(ids('p').length, rows) * cw + 40), wq = Math.max(minW, colsFor(ids('q').length, rows) * cw + 40);
    const wb = over ? Math.max(cw + 30, colsFor(ids('pq').length, rows) * cw + 30) : 40;
    let spare = W - (wp + wb + wq);
    if (spare < 0) fail('the regions are too wide for the domain');
    const gp = wp + spare / 2, gq = wq + spare / 2; spare = 0;
    P = box(x0, Pb.y0, x0 + gp + (over ? wb : 0), Pb.y1);
    Q = box(x0 + gp + (over ? 0 : wb), Qb.y0, x0 + gp + wb + gq, Qb.y1);
    labelP = label(p.P, P.x0 + 28, P.y0 - 6, gp - 50);
    labelQ = label(p.Q!, (over ? P.x1 : Q.x0) + 22, Q.y0 - 6, gq - 50);
    put('p', box(P.x0 + 14, yT, (over ? Q.x0 : P.x1) - 14, yB), 'P outside Q');
    if (over) put('pq', box(Q.x0 + 8, yT, P.x1 - 8, yB), 'the overlap');
    put('q', box((over ? P.x1 : Q.x0) + 14, yT, Q.x1 - 14, yB), 'Q outside P');
  }
  // the line-up: every member in value order across the domain, before anything is sorted
  const lineup = grid(p.tokens.length, box(D.x0 + 20, RY0, D.x1 - 20, D.y1 - 20), cw, ch, 'the line-up', 4);
  return { D, domainY, domainText, P, Q, labelP, labelQ, cw, ch, lineup, sorted, zone, shapes };
}

/** practice pictures get a wide stage (no board): the statement is in the panel */
export const PRACTICE_FRAME: Frame = { x: 230, y: 74, w: 1460, h: 932 };
/** does the picture fit the frame? (generators re-roll when it does not) */
export function eulerFits(p: EulerParams, fr: Frame = PRACTICE_FRAME): boolean {
  try { eulerLayout(p, fr); return true; } catch (e) { if (e instanceof BlockError) return false; throw e; }
}
