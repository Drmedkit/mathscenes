// Chain: a unit-factor chain written as TeX (start × factor × … = result) whose matching units cancel with a drawn
// strike, one pair after another. Every unit is a named part, so the strikes sit exactly on the units and the
// leftover units light up in the answer colour. Groups (start, each factor, the result) write on separately, so a
// lesson can bring the chain in step by step. Hidden factors / results show "?" until revealed (a second formula,
// cross-faded), so practice never shows the answer early.
import { type Box, box, clamp } from '../../../core/math';
import type { Canvas } from '../../../core/draw';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth, type PartStyle } from '../../../core/tex';
import { check } from '../../../blocks/block';
import { fmtT, qT, unitT } from './units';
import type { ChainPic, CTerm } from './items';

const NAME = 'Chain';
interface Built { F: Formula; groups: string[]; units: { id: string; group: string }[]; pairs: [string, string][]; left: string[] }

function build(p: ChainPic, reveal: boolean, pre: string): Built {
  let u = 0;
  const units: { id: string; group: string; u: string; top: boolean }[] = [];
  const unit = (name: string, group: string, top: boolean) => { const id = `${pre}u${u++}`; units.push({ id, group, u: name, top }); return `\\cssId{${id}}{${unitT(name)}}`; };
  const num = (n: number | string) => (typeof n === 'number' ? fmtT(n) : n);
  const q = (n: number | string, name: string, g: string, top: boolean) => (name === '$' ? `\\$${num(n)}` : name === '' ? num(n) : `${num(n)}\\,${unit(name, g, top)}`);
  const term = (t: CTerm, g: string, isResult: boolean): string => {
    const hid = t.hide && !reveal;
    // "?" is punctuation in TeX (no space after "="): \mathord makes it an ordinary symbol
    if (hid && isResult) return t.hideUnit ? '\\mathord{?}' : t.bu ? `\\dfrac{\\mathord{?}\\,${unitT(t.u)}}{1\\,${unitT(t.bu)}}` : `\\mathord{?}\\,${unitT(t.u)}`;
    if (hid) return '\\dfrac{\\;\\mathord{?}\\;}{\\;\\mathord{?}\\;}';
    const top = q(t.n, t.u, g, !isResult);
    return t.bu !== undefined ? `\\dfrac{${top}}{${q(t.bn ?? 1, t.bu, g, false)}}` : top;
  };
  const groups: string[] = [];
  const parts: string[] = [];
  const g0 = `${pre}g0`; groups.push(g0); parts.push(`\\cssId{${g0}}{${term(p.start, g0, false)}}`);
  p.factors.forEach((f, i) => { const g = `${pre}g${i + 1}`; groups.push(g); parts.push(`\\cssId{${g}}{\\times ${term(f, g, false)}}`); });
  const gr = `${pre}gr`; groups.push(gr);
  // result units are never cancelled: mark them after the pairing
  const nBefore = units.length;
  parts.push(`\\cssId{${gr}}{= ${term(p.result, gr, true)}}`);
  for (let i = nBefore; i < units.length; i++) units[i]!.top = true;
  // pair a top unit with a bottom unit of the same name in another group (results excluded)
  const pairs: [string, string][] = [], used = new Set<string>();
  const cand = units.slice(0, nBefore);
  for (const a of cand) {
    if (!a.top || used.has(a.id)) continue;
    const b = cand.find(x => !x.top && !used.has(x.id) && x.u === a.u && x.group !== a.group);
    if (b) { pairs.push([a.id, b.id]); used.add(a.id); used.add(b.id); }
  }
  const left = units.slice(nBefore).map(x => x.id);
  return { F: tex(parts.join(' ')) as Formula, groups, units: units.map(x => ({ id: x.id, group: x.group })), pairs, left };
}

export interface ChainBlock {
  readonly box: Box;
  /** the box of a group (g0 = start, g1.. = factors, gr = result) */
  group(i: number | 'r'): Box;
  /** k(group) = write-on of each group, strike = 0..pairs.length (pairs struck one after another), reveal 0..1 */
  draw(c: Canvas, o: { k: (g: number | 'r') => number; strike: number; reveal?: number; alpha?: number; glowLeft?: number }): void;
}
/** a chain centred at (cx, y), at most maxW wide (shrinks from size down to 56) */
export function Chain(p: ChainPic, cx: number, y: number, maxW: number, size: number, th: Theme, pre = 'c'): ChainBlock {
  const A = build(p, false, pre + 'h'), Bv = build(p, true, pre + 'r');
  let s = size;
  while (s > 56 && Math.max(texWidth(A.F, s), texWidth(Bv.F, s)) > maxW) s -= 2;
  check(Math.max(texWidth(A.F, s), texWidth(Bv.F, s)) <= maxW + 1, NAME, 'the chain is too wide');
  const place = (B: Built) => ({ x: cx - texWidth(B.F, s) / 2 });
  const gi = (B: Built, g: number | 'r') => (g === 'r' ? B.groups[B.groups.length - 1]! : B.groups[g]!);
  const strikeCol = paint(th, 'pick', 'fill');
  function drawOne(c: Canvas, B: Built, o: { k: (g: number | 'r') => number; strike: number; alpha: number; glowLeft: number }): void {
    if (o.alpha <= 0) return;
    const { x } = place(B), tags: Record<string, PartStyle> = {};
    const kOf = (g: string) => { const i = B.groups.indexOf(g); return o.k(i === B.groups.length - 1 ? 'r' : i); };
    B.groups.forEach(g => { tags[g] = { k: kOf(g), col: g.endsWith('gr') ? 'link' : 'ink' }; });
    const struck = new Set<string>();
    B.pairs.forEach(([a, b], i) => { if (o.strike > i + 0.5) { struck.add(a); struck.add(b); } });
    for (const un of B.units) {
      const isLeft = B.left.includes(un.id);
      tags[un.id] = { k: kOf(un.group), col: isLeft ? 'link' : struck.has(un.id) ? 'pick' : (un.group.endsWith('g0') ? 'first' : 'second') as Paint, alpha: struck.has(un.id) ? 0.75 : 1, glow: isLeft ? o.glowLeft * 10 : undefined };
    }
    texDraw(c, B.F, x, y, { size: s, align: 'left', tags: tags as never, alpha: o.alpha });
    // strikes
    B.pairs.forEach(([a, b], i) => {
      const k = clamp(o.strike - i);
      if (k <= 0) return;
      for (const id of [a, b]) {
        const bx = texBox(B.F, x, y, { size: s, align: 'left' }, id as never);
        const g = c.g; g.save(); g.globalAlpha *= o.alpha; g.strokeStyle = strikeCol; g.lineWidth = 5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(bx.x0 - 6, bx.y1 + 4); g.lineTo(bx.x0 - 6 + (bx.w + 12) * k, bx.y1 + 4 - (bx.h + 8) * k); g.stroke(); g.restore();
      }
    });
  }
  const B0 = texBox(Bv.F, place(Bv).x, y, { size: s, align: 'left' });
  return {
    box: box(Math.min(B0.x0, cx - texWidth(A.F, s) / 2), B0.y0, Math.max(B0.x1, cx + texWidth(A.F, s) / 2), B0.y1),
    group: g => { const B = Bv; return texBox(B.F, place(B).x, y, { size: s, align: 'left' }, gi(B, g) as never); },
    draw(c, o) {
      const rv = clamp(o.reveal ?? 1), al = o.alpha ?? 1, gl = o.glowLeft ?? 0;
      if (rv < 1) drawOne(c, A, { k: o.k, strike: 0, alpha: al * (1 - rv), glowLeft: 0 });
      if (rv > 0) drawOne(c, Bv, { k: o.k, strike: o.strike, alpha: al * rv, glowLeft: gl });
    },
  };
}
