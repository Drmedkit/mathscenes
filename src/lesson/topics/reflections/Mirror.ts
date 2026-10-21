// Mirror.ts: the model block of "reflections": a sheet of graph paper (or plain paper) pinned to the dusk wall, a
// line of reflection m, the figure, candidate spots and lines, and the worked reflection drawn on it.
//   sheet   the paper and its grid (two strips of tape hold it)
//   line    the line of reflection m (teal), the whole line across the sheet or only a piece with arrowheads
//   figure  the original points and polygons (amber)          image  given image points / polygons (lime or lavender)
//   spots   numbered candidate spots                           cands  numbered candidate lines
//   segs    given segments, tick marks, right-angle marks, measured lengths
//   perp    the perpendicular from each solve point to its foot M (lavender, dashed) with the right-angle mark
//   hops    the counted steps from P to M (lavender arcs)      beyond the same count past M (lime arcs)
//   answer  the image point(s) and their labels (lime)         join   the image polygon
//   fold    the sheet folds along m: the half with the figure turns over and lands on the other half
// Each solve point i also has its own keys 'perp<i>', 'hops<i>', 'beyond<i>', 'answer<i>' (the page can reflect
// one vertex at a time); the plain key drives all of them.
//
// Layout: the sheet is as big as the frame allows (cells 40-96 px). Labels (TeX, 50 px) are placed greedily around
// their point so they never sit on a line, a point or another label; layout throws BlockError when it cannot hold.
import { type Box, box, clamp, lerp, unionBox, padBox, boxesOverlap } from '../../../core/math';
import { rectPts, curvePts } from '../../../core/pts';
import { type Canvas, dot, drawOn, withAlpha, strokePts, arrow } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, type Paint, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import {
  type MirrorPic, type Pt, type Poly, type Pin, add, centroid, checkReflection, foot, lineFrame, lineInSheet, offset,
  orientation, picFits, reflect, stepToward, stepsTo,
} from './mirrorMaths';

const NAME = 'Mirror';
export interface MirrorFocus {
  /** rings around spots (by number) and around named points */
  spots?: number[]; points?: string[]; k?: number; col?: Paint;
  /** a soft glow along the mirror line */
  line?: number;
  /** pulse the label of the line m */
  lineLabel?: number;
}
export interface MirrorBlock {
  readonly kind: 'Mirror';
  readonly pic: MirrorPic;
  readonly u: number;
  readonly sheet: Box;
  px(p: Pt): Pt;
  readonly where: {
    point(label: string): Box; spot(n: number): Box; cand(n: number): Box;
    /** the foot of solve point i, the perpendicular from it, the counted hops and the hops beyond */
    foot(i: number): Box; perp(i: number): Box; hops(i: number): Box; beyond(i: number): Box;
    image(i: number): Box; line: Box; lineLabel: Box;
  };
  draw(c: Canvas, P: Progress<string>, f?: MirrorFocus): void;
}

const LABEL = 52, SPOTLABEL = 46, MARGIN = 70;
interface Lab { text: string; F: Formula | null; x: number; y: number; size: number; box: Box; col: Paint; anchor: Pt }

/** the solve hops of one point: the lattice points from P to the foot M, then on to P' */
function hopPath(P: Pt, pic: MirrorPic): { to: Pt[]; on: Pt[] } {
  const L = pic.line!, mode = pic.solve?.hops ?? 'none';
  const M = foot(P, L), I = reflect(P, L);
  if (mode === 'none' || offset(P, L) === 0) return { to: [P, M], on: [M, I] };
  const st = stepsTo(P, L);
  const half = mode === 'half' || (mode === 'diag' && st.whole === null);
  const n = L.kind === 'v' || L.kind === 'h' ? st.squares : half ? st.small : st.whole!;
  const d = stepToward(P, L, half);
  const to: Pt[] = [P]; for (let i = 1; i <= n; i++) to.push(add(P, d, i));
  const on: Pt[] = [M]; for (let i = 1; i <= n; i++) on.push(add(M, d, i));
  return { to, on };
}

export function Mirror(pic: MirrorPic, fr: Frame, th: Theme): MirrorBlock {
  const bad = picFits(pic);
  check(bad === null, NAME, bad ?? '');
  const L = pic.line;
  // the exact maths of every reflection the picture shows, asserted
  const solved = (pic.solve?.pts ?? []).map(s => { check(L, NAME, 'a solve needs a line'); const r = checkReflection(s.from, L); return { ...s, ...r }; });

  // ---------- layout ----------
  const u = Math.min(96, (fr.w - 2 * MARGIN) / pic.cols, (fr.h - 2 * MARGIN) / pic.rows);
  check(u >= 40, NAME, `cells of ${Math.round(u)} px are too small (sheet ${pic.cols} x ${pic.rows})`);
  const W = pic.cols * u, H = pic.rows * u;
  const ox = fr.x + (fr.w - W) / 2, oy = fr.y + (fr.h - H) / 2 + H;
  const px = (p: Pt): Pt => [ox + p[0] * u, oy - p[1] * u];
  const sheet = box(ox, oy - H, ox + W, oy);
  const seg = L ? (pic.part ?? lineInSheet(L, pic.cols, pic.rows)!) : null;
  const fullSeg = L ? lineInSheet(L, pic.cols, pic.rows) : null;
  const { u: lu, n: ln } = L ? lineFrame(L) : { u: [1, 0] as Pt, n: [0, 1] as Pt };
  const pxDir = (d: Pt): Pt => [d[0], -d[1]];

  // obstacles for labels: lines (px polylines) and point boxes
  const lines: Pt[][] = [];
  if (fullSeg) lines.push([px(fullSeg[0]), px(fullSeg[1])]);
  const polys: Poly[] = [...(pic.figure ?? []), ...(pic.image ?? []), ...(pic.solve?.poly ? [pic.solve.poly] : [])];
  for (const P of polys) { const Q = P.pts.map(px); lines.push(P.open ? Q : [...Q, Q[0]!]); }
  for (const s of pic.segs ?? []) lines.push([px(s.a), px(s.b)]);
  const candSegs = (pic.cands ?? []).map(cd => {
    const dx = cd.b[0] - cd.a[0], dy = cd.b[1] - cd.a[1];
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const s = lineInSheet({ kind: 'o', c: 0, at: cd.a, deg }, pic.cols, pic.rows);
    check(s, NAME, `candidate line ${cd.n} misses the sheet`);
    lines.push([px(s[0]), px(s[1])]);
    return { n: cd.n, s };
  });
  if (pic.solve?.line) { const s = lineInSheet(pic.solve.line, pic.cols, pic.rows); if (s) lines.push([px(s[0]), px(s[1])]); }
  for (const s of solved) lines.push([px(s.from), px(s.image)]);
  const marks: Box[] = [];
  // the tape strips and the "not to scale" note are obstacles for labels too
  marks.push(box(sheet.x0 - 10, sheet.y0 - 20, sheet.x0 + 100, sheet.y0 + 24), box(sheet.x1 - 100, sheet.y0 - 20, sheet.x1 + 10, sheet.y0 + 24));
  const ntsLab = pic.notToScale ? { text: 'not to scale', box: wordsBox('not to scale', sheet.x0 + 24, sheet.y1 - 36, { size: 44, align: 'left', weight: 500 }) } : null;
  if (ntsLab) marks.push(padBox(ntsLab.box, 8));
  const allPins: Pin[] = [...(pic.pins ?? []), ...(pic.imagePins ?? [])];
  for (const p of allPins) marks.push(padBox(box(...px(p.at), ...px(p.at)), p.style === 'blob' ? 26 : 14));
  for (const P of polys) for (const q of P.pts) marks.push(padBox(box(...px(q), ...px(q)), 12));
  for (const s of pic.spots ?? []) marks.push(padBox(box(...px(s.at), ...px(s.at)), 20));
  for (const s of solved) { marks.push(padBox(box(...px(s.image), ...px(s.image)), 16)); marks.push(padBox(box(...px(s.foot), ...px(s.foot)), 10)); }

  const labs: Lab[] = [];
  const frameBox = box(fr.x - 30, fr.y - 30, fr.x + fr.w + 30, fr.y + fr.h + 30);
  function place(text: string, at: Pt, pref: Pt, col: Paint, o: { size?: number; words?: boolean; r0?: number } = {}): Lab {
    const size = o.size ?? LABEL;
    const F = o.words ? null : (tex(text) as Formula);
    const rel = F ? texBox(F, 0, 0, { size, align: 'center' }) : wordsBox(text, 0, 0, { size, align: 'center', weight: 650 });
    const hw = rel.w / 2, hh = rel.h / 2;
    const p0 = Math.atan2(pref[1], pref[0]);
    let best: { x: number; y: number; b: Box; cost: number } | null = null;
    for (const r of [o.r0 ?? 30, (o.r0 ?? 30) + 16, (o.r0 ?? 30) + 40, (o.r0 ?? 30) + 72]) {
      for (let i = 0; i < 16; i++) {
        const a = p0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 8);
        const dx = Math.cos(a), dy = Math.sin(a);
        // the label's box edge sits r px from the point along the direction
        const ext = Math.abs(dx) * hw + Math.abs(dy) * hh;
        const x = at[0] + dx * (r + ext), y = at[1] + dy * (r + ext);
        const b = box(x - hw, y - hh, x + hw, y + hh);
        let cost = 0;
        if (b.x0 < frameBox.x0 || b.x1 > frameBox.x1 || b.y0 < frameBox.y0 || b.y1 > frameBox.y1) cost += 100;
        if (hitsLines(b, lines, 4)) cost += 10;
        for (const m of marks) if (boxesOverlap(b, m)) cost += 10;
        for (const l of labs) if (boxesOverlap(padBox(b, 6), l.box)) cost += 20;
        cost += i * 0.05 + r * 0.004;
        if (!best || cost < best.cost) best = { x, y, b, cost };
      }
      if (best && best.cost < 1) break;
    }
    const L0: Lab = { text, F, x: best!.x, y: best!.y, size, box: best!.b, col, anchor: at };
    labs.push(L0);
    return L0;
  }
  const away = (p: Pt): Pt => {
    if (!L) return [0, -1];
    const s = Math.sign(offset(p, L)) || 1; const n = pxDir(ln); return [n[0] * s, n[1] * s];
  };
  // the line label m: near the top end of the drawn line, beside it
  let lineLab: Lab | null = null;
  if (seg) {
    const a = px(seg[0]), b = px(seg[1]);
    const top = a[1] < b[1] ? a : b, other = top === a ? b : a;
    const d: Pt = [other[0] - top[0], other[1] - top[1]], l = Math.hypot(d[0], d[1]) || 1;
    const at: Pt = [top[0] + (d[0] / l) * 40, top[1] + (d[1] / l) * 40];
    const n = pxDir(ln);
    lineLab = place(pic.lineLabel ?? 'm', at, n[0] >= 0 ? [n[0], n[1]] : [-n[0], -n[1]], 'second', { r0: 22 });
  }
  const pinLabs = new Map<string, Lab>();
  const pointBox = new Map<string, Box>();
  for (const p of allPins) {
    const q = px(p.at);
    pointBox.set(p.label ?? '', padBox(box(...q, ...q), p.style === 'blob' ? 26 : 16));
    if (p.label) pinLabs.set(p.label, place(p.label, q, away(p.at), p.role, { r0: p.style === 'blob' ? 34 : 24 }));
  }
  const vertLabs: Lab[] = [];
  for (const P of polys) {
    if (!P.labels) continue;
    const C = centroid(P.pts);
    P.pts.forEach((q, i) => {
      const t = P.labels![i];
      if (!t) return;
      const Q = px(q), Cp = px(C), d: Pt = [Q[0] - Cp[0], Q[1] - Cp[1]], l = Math.hypot(d[0], d[1]) || 1;
      pointBox.set(t, padBox(box(...Q, ...Q), 16));
      vertLabs.push(place(t, Q, [d[0] / l, d[1] / l], P.role, { r0: 20 }));
    });
  }
  const solveLabs = solved.map((s, i) => {
    const q = px(s.image);
    if (s.label) pointBox.set(s.label, padBox(box(...q, ...q), 16));
    return s.label ? place(s.label, q, away(s.image), 'link', { r0: 24 }) : null;
  });
  void solveLabs;
  const spotLabs = new Map<number, Lab>();
  for (const s of pic.spots ?? []) spotLabs.set(s.n, place(String(s.n), px(s.at), L ? pxDir(lu) : [1, 0], 'ink', { words: true, size: SPOTLABEL, r0: 30 }));
  const candLabs = new Map<number, Lab>();
  for (const cs of candSegs) {
    const a = px(cs.s[0]), b = px(cs.s[1]);
    const end = a[1] < b[1] || (a[1] === b[1] && a[0] > b[0]) ? a : b, oth = end === a ? b : a;
    const d: Pt = [end[0] - oth[0], end[1] - oth[1]], l = Math.hypot(d[0], d[1]) || 1;
    const at: Pt = [end[0] - (d[0] / l) * 60, end[1] - (d[1] / l) * 60];
    candLabs.set(cs.n, place(String(cs.n), at, [-d[1] / l, d[0] / l], 'ink', { words: true, size: SPOTLABEL, r0: 18 }));
  }
  const noteLabs = (pic.notes ?? []).map(nt => {
    const a = px(nt.a), b = px(nt.b), m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const d: Pt = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(d[0], d[1]) || 1;
    return place(nt.text, m, [-d[1] / l, d[0] / l], 'ink', { words: true, size: 44, r0: 26 });
  });
  for (const l of labs) check(l.box.x0 >= frameBox.x0 - 1 && l.box.x1 <= frameBox.x1 + 1, NAME, `label ${l.text} runs off the frame`);

  // ---------- where ----------
  const P0 = (b: Box | undefined, name: string): Box => { check(b, NAME, `no point ${name}`); return b; };
  const where = {
    point: (t: string) => P0(pointBox.get(t), t),
    spot: (n: number) => { const s = (pic.spots ?? []).find(x => x.n === n); check(s, NAME, `no spot ${n}`); const q = px(s.at); return padBox(box(...q, ...q), 22); },
    cand: (n: number) => { const l = candLabs.get(n); check(l, NAME, `no line ${n}`); return l.box; },
    foot: (i: number) => { const q = px(solved[i]!.foot); return padBox(box(...q, ...q), 14); },
    perp: (i: number) => { const a = px(solved[i]!.from), b = px(solved[i]!.foot); return box(Math.min(a[0], b[0]) - 6, Math.min(a[1], b[1]) - 6, Math.max(a[0], b[0]) + 6, Math.max(a[1], b[1]) + 6); },
    hops: (i: number) => { const h = hopPath(solved[i]!.from, pic).to.map(px); return padBox(unionBox(h.map(q => box(...q, ...q))), 18); },
    beyond: (i: number) => { const h = hopPath(solved[i]!.from, pic).on.map(px); return padBox(unionBox(h.map(q => box(...q, ...q))), 18); },
    image: (i: number) => { const q = px(solved[i]!.image); return padBox(box(...q, ...q), 18); },
    line: seg ? box(Math.min(px(seg[0])[0], px(seg[1])[0]), Math.min(px(seg[0])[1], px(seg[1])[1]), Math.max(px(seg[0])[0], px(seg[1])[0]), Math.max(px(seg[0])[1], px(seg[1])[1])) : sheet,
    lineLabel: lineLab ? lineLab.box : sheet,
  };

  // ---------- painters ----------
  const col = (r: string): Paint => r as Paint;
  function drawLab(c: Canvas, l: Lab, k: number, colOver?: Paint): void {
    if (k <= 0) return;
    if (l.F) texDraw(c, l.F, l.x, l.y, { size: l.size, align: 'center', col: colOver ?? l.col, k: 1, alpha: k });
    else drawWords(c, l.text, l.x, l.y, colOver ?? l.col, k, { size: l.size, align: 'center', weight: 650 });
  }
  function drawSheet(c: Canvas, k: number, back = false): void {
    if (k <= 0) return;
    withAlpha(c, k, () => {
      wash(c, rectPts(sheet.x0, sheet.y0, sheet.w, sheet.h, 6), back ? '#3A3F70' : '#262B58', { seed: 31, rough: 1.2, ink: DUSK.ink, inkW: 3, shade: 0.25 });
      const { g } = c;
      g.save();
      g.strokeStyle = back ? 'rgba(150,156,214,0.16)' : 'rgba(150,156,214,0.42)'; g.lineWidth = 1.6;
      if (pic.grid) {
        g.beginPath();
        for (let i = 1; i < pic.cols; i++) { const x = ox + i * u; g.moveTo(x, sheet.y0 + 2); g.lineTo(x, sheet.y1 - 2); }
        for (let j = 1; j < pic.rows; j++) { const y = oy - j * u; g.moveTo(sheet.x0 + 2, y); g.lineTo(sheet.x1 - 2, y); }
        g.stroke();
      }
      g.restore();
    });
  }
  function drawTape(c: Canvas, k: number): void {
    if (k <= 0) return;
    withAlpha(c, k * 0.9, () => {
      for (const [x, s] of [[sheet.x0 + 40, 1], [sheet.x1 - 40, -1]] as const) {
        const P: Pt[] = [[x - 46, sheet.y0 - 16], [x + 46, sheet.y0 - 16 + s * 10], [x + 44, sheet.y0 + 18 + s * 10], [x - 48, sheet.y0 + 18]];
        wash(c, P, '#CDBFA0', { seed: 70 + s, rough: 1.4, ink: null, shade: 0.1, alpha: 0.75 });
      }
    });
  }
  function drawLine(c: Canvas, k: number, glowK = 0): void {
    if (!seg || k <= 0) return;
    const a = px(seg[0]), b = px(seg[1]);
    if (glowK > 0) strokePts(c, [a, b], { col: 'second', lw: 14, alpha: 0.25 * glowK });
    if (pic.part) {
      // a piece of the line: arrowheads at both ends show it goes on
      const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      arrow(c, [m, b], E.inOut(k), { col: 'second', lw: 5, head: 24 });
      arrow(c, [m, a], E.inOut(k), { col: 'second', lw: 5, head: 24 });
    } else drawOn(c, [a, b], E.inOut(k), { col: 'second', lw: 5 });
  }
  function drawPoly(c: Canvas, P: Poly, k: number, seed: number, outline = false): void {
    if (k <= 0) return;
    const Q = P.pts.map(px);
    const fill = P.role === 'dim' ? '#6F73A6' : P.role;
    if (outline) { drawOn(c, [...Q, Q[0]!], E.inOut(k), { col: col(P.role), lw: 5, dash: [16, 10] }); for (const q of Q) dot(c, q[0], q[1], 7, col(P.role), k); return; }
    if (!P.open && Q.length >= 3) withAlpha(c, E.smooth(k) * (P.role === 'dim' ? 0.55 : 0.85), () => wash(c, Q, fill as Paint, { seed, rough: 1.3, ink: null, shade: 0.2, alpha: 0.8 }));
    drawOn(c, P.open ? Q : [...Q, Q[0]!], E.inOut(k), { col: col(P.role), lw: 4 });
    for (const q of Q) dot(c, q[0], q[1], 7, col(P.role), k);
  }
  function drawPin(c: Canvas, p: Pin, k: number, seed: number): void {
    if (k <= 0) return;
    const q = px(p.at);
    if (p.style === 'blob') {
      const r = Math.min(30, u * 0.32), R: Pt[] = [];
      for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; R.push([q[0] + Math.cos(a) * r, q[1] + Math.sin(a) * r * 0.92]); }
      withAlpha(c, E.smooth(k), () => wash(c, R, col(p.role), { seed, rough: 2.4, ink: DUSK.ink, inkW: 2.5, shade: 0.25 }));
      return;
    }
    dot(c, q[0], q[1], 11, col(p.role), k);
    dot(c, q[0], q[1], 4.5, DUSK.navy, k);
  }
  function ringAt(c: Canvas, q: Pt, r: number, cl: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, cl, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, cl, 'fill'); g.shadowBlur = 10 * th.glow;
    g.beginPath(); g.arc(q[0], q[1], r, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  function rightMark(c: Canvas, at: Pt, d1: Pt, d2: Pt, k: number, cl: Paint = 'ink'): void {
    if (k <= 0) return;
    const s = Math.min(26, u * 0.34), q = px(at), a = pxDir(d1), b = pxDir(d2);
    const P: Pt[] = [[q[0] + a[0] * s, q[1] + a[1] * s], [q[0] + (a[0] + b[0]) * s, q[1] + (a[1] + b[1]) * s], [q[0] + b[0] * s, q[1] + b[1] * s]];
    strokePts(c, P, { col: cl, lw: 3, alpha: k });
  }
  function ticks(c: Canvas, a: Pt, b: Pt, n: number, k: number, cl: Paint): void {
    if (k <= 0 || n <= 0) return;
    const A = px(a), B = px(b), m: Pt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const d: Pt = [B[0] - A[0], B[1] - A[1]], l = Math.hypot(d[0], d[1]) || 1, t: Pt = [d[0] / l, d[1] / l], nn: Pt = [-t[1], t[0]];
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * 12, c0: Pt = [m[0] + t[0] * o, m[1] + t[1] * o];
      strokePts(c, [[c0[0] - nn[0] * 16, c0[1] - nn[1] * 16], [c0[0] + nn[0] * 16, c0[1] + nn[1] * 16]], { col: cl, lw: 3.5, alpha: k });
    }
  }
  function hops(c: Canvas, H: Pt[], k: number, cl: Paint, side: 1 | -1): void {
    if (k <= 0 || H.length < 2) return;
    const n = H.length - 1;
    for (let i = 0; i < n; i++) {
      const ki = clamp(k * n - i);
      if (ki <= 0) break;
      const a = px(H[i]!), b = px(H[i + 1]!);
      const bend = side * Math.min(0.42, 18 / Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1]))) * 1.6;
      drawOn(c, curvePts(a, b, bend, 20), E.inOut(ki), { col: cl, lw: 3.5 });
      if (ki >= 1) dot(c, b[0], b[1], 5, cl);
    }
  }
  function setSquare(c: Canvas, at: Pt, toward: Pt, k: number): void {
    if (k <= 0 || !L) return;
    const q = px(at), a = pxDir(lu), t = pxDir(toward);
    const s1 = Math.min(3.2 * u, 230), s2 = Math.min(2.4 * u, 170);
    const P: Pt[] = [q, [q[0] + a[0] * s1, q[1] + a[1] * s1], [q[0] + t[0] * s2, q[1] + t[1] * s2]];
    withAlpha(c, E.smooth(k) * 0.55, () => wash(c, P, '#C9D8F2', { seed: 88, rough: 0.8, ink: DUSK.cream, inkW: 2.5, shade: 0.1, alpha: 0.6 }));
  }
  function orientArrow(c: Canvas, P: Pt[], k: number): void {
    if (k <= 0) return;
    const C = px(centroid(P)), r = Math.max(22, Math.min(46, u * 0.45));
    const ccwScreen = orientation(P) === 'ccw';   // y up: ccw in grid space = ccw on screen too (both flip)
    const a0 = Math.atan2(px(P[0]!)[1] - C[1], px(P[0]!)[0] - C[0]);
    const span = Math.PI * 1.45 * (ccwScreen ? -1 : 1);
    const A: Pt[] = [];
    for (let i = 0; i <= 30; i++) { const a = a0 + (span * i) / 30; A.push([C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r]); }
    arrow(c, A, E.inOut(k), { col: 'pick', lw: 4, head: 18 });
  }

  // the fold: the half of the sheet with the first solve point turns over the line
  const flapSide = solved.length ? Math.sign(offset(solved[0]!.from, L!)) || 1 : 1;
  function halfPoly(side: number, big = false): Pt[] {
    const e = big ? 6 : 0;
    const S: Pt[] = [[-e, -e], [pic.cols + e, -e], [pic.cols + e, pic.rows + e], [-e, pic.rows + e]];
    if (!L) return S.map(px);
    const out: Pt[] = [];
    for (let i = 0; i < S.length; i++) {
      const a = S[i]!, b = S[(i + 1) % S.length]!, fa = offset(a, L) * side, fb = offset(b, L) * side;
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    return out.map(px);
  }
  function foldMatrix(k: number): [number, number, number, number, number, number] {
    const kk = 1 - Math.cos(Math.PI * k);
    const q = px(lineFrame(L!).q), n = pxDir(ln);
    const qn = q[0] * n[0] + q[1] * n[1];
    return [1 - kk * n[0] * n[0], -kk * n[0] * n[1], -kk * n[0] * n[1], 1 - kk * n[1] * n[1], kk * qn * n[0], kk * qn * n[1]];
  }
  const onFlap = (p: Pt) => (L ? offset(p, L) * flapSide > 1e-9 : false);

  function draw(c: Canvas, P: Progress<string>, f: MirrorFocus = {}): void {
    const kS = P.k('sheet'), kL = P.k('line'), kF = P.k('figure'), kI = P.k('image'), kSp = P.k('spots'), kC = P.k('cands'), kSg = P.k('segs');
    const kFold = L && solved.length ? P.k('fold') : 0;
    const ki = (key: string, i: number) => Math.max(P.k(key), P.k(key + i));
    const { g } = c;
    // while folding, everything but the flap stays on the fixed half (the flap is drawn last, on top)
    if (kFold > 0) { g.save(); g.clip(new Path2D(pathD(halfPoly(-flapSide, true)))); }
    drawSheet(c, kS);
    drawTape(c, kS);
    if (ntsLab && kS > 0) drawWords(c, 'not to scale', ntsLab.box.x0, ntsLab.box.cy, 'dim', kS, { size: 44, align: 'left', weight: 500 });
    // candidate lines
    for (const cs of candSegs) {
      const right = pic.solve?.cand === cs.n ? ki('answer', 0) : 0;
      strokePts(c, [px(cs.s[0]), px(cs.s[1])], { col: right > 0.5 ? 'link' : 'dim', lw: right > 0.5 ? 5 : 3.5, dash: [16, 12], alpha: kC });
    }
    // the true line of reflection (locate / bisect solutions)
    if (pic.solve?.line) {
      const s = lineInSheet(pic.solve.line, pic.cols, pic.rows);
      if (s) drawOn(c, [px(s[0]), px(s[1])], E.inOut(ki('answer', 0)), { col: 'link', lw: 5 });
    }
    // given segments, marks, notes
    for (const s of pic.segs ?? []) {
      strokePts(c, [px(s.a), px(s.b)], { col: col(s.role), lw: 3.5, dash: s.dash ? [14, 10] : null, alpha: kSg });
      ticks(c, s.a, s.b, s.ticks ?? 0, kSg, col(s.role));
    }
    for (const m of pic.marks ?? []) rightMark(c, m.at, m.u, m.v, kSg);
    // the extension of a partly drawn line (solution)
    if (pic.part && fullSeg && solved.length) {
      const ke = ki('perp', 0);
      if (ke > 0) strokePts(c, [px(fullSeg[0]), px(fullSeg[1])], { col: 'second', lw: 3, dash: [12, 12], alpha: ke * 0.8 });
    }
    drawLine(c, kL, f.line ?? 0);
    // the figure and given images (not on the flap while folding)
    let seed = 100;
    const flapHidden = kFold > 0;
    for (const Pp of pic.figure ?? []) drawPoly(c, Pp, flapHidden && Pp.pts.every(onFlap) ? 0 : kF, seed++);
    for (const Pp of pic.image ?? []) drawPoly(c, Pp, kI, seed++);
    // the worked solution under the points
    solved.forEach((s, i) => {
      const kp = ki('perp', i);
      if (kp > 0) {
        strokePts(c, [px(s.from), lerpPt(px(s.from), px(s.foot), E.inOut(kp))], { col: 'pick', lw: 3.5, dash: [12, 9] });
        if (offset(s.from, L!) !== 0) {
          const tow: Pt = (() => { const d: Pt = [s.from[0] - s.foot[0], s.from[1] - s.foot[1]], l = Math.hypot(d[0], d[1]) || 1; return [d[0] / l, d[1] / l] as Pt; })();
          rightMark(c, s.foot, lu, tow, clamp(kp * 2 - 1), 'pick');
          if (pic.solve?.tool && i === 0) setSquare(c, s.foot, tow, kp);
        }
        dot(c, px(s.foot)[0], px(s.foot)[1], 7, 'pick', kp);
      }
      const kb = ki('beyond', i);
      if (kb > 0) strokePts(c, [px(s.foot), lerpPt(px(s.foot), px(s.image), E.inOut(kb))], { col: 'link', lw: 3.5, dash: [12, 9] });
      const H = hopPath(s.from, pic);
      if (pic.solve?.hops !== 'none') {
        hops(c, H.to, ki('hops', i), 'pick', 1);
        hops(c, H.on, kb, 'link', 1);
      } else if (kb > 0 && offset(s.from, L!) !== 0) {
        ticks(c, s.from, s.foot, 1, kb, 'pick'); ticks(c, s.foot, s.image, 1, kb, 'link');
      }
    });
    if (pic.solve?.poly) drawPoly(c, pic.solve.poly, P.k('join'), 300, !!pic.image?.length);
    // points
    seed = 200;
    for (const p of pic.pins ?? []) drawPin(c, p, flapHidden && onFlap(p.at) ? 0 : kF, seed++);
    for (const p of pic.imagePins ?? []) drawPin(c, p, kI, seed++);
    solved.forEach((s, i) => { const ka = ki('answer', i); if (ka > 0) drawPin(c, { at: s.image, role: 'link', style: (pic.pins ?? []).find(p => p.style === 'blob') ? 'blob' : 'dot' }, ka, 260 + i); });
    // spots
    for (const s of pic.spots ?? []) {
      const q = px(s.at);
      if (kSp <= 0) continue;
      const { g: gg } = c;
      gg.save(); gg.globalAlpha *= kSp; gg.strokeStyle = paint(th, 'ink', 'fill'); gg.lineWidth = 3.5; gg.setLineDash([7, 6]);
      gg.beginPath(); gg.arc(q[0], q[1], 17, 0, Math.PI * 2); gg.stroke(); gg.restore();
      dot(c, q[0], q[1], 5, 'ink', kSp);
      // the right spot loses its number once the answer is ringed there (its label would crowd the image's label)
      const isAns = pic.solve?.spot === s.n;
      drawLab(c, spotLabs.get(s.n)!, kSp * (isAns ? 1 - clamp(ki('answer', 0) * 2) : 1));
    }
    // labels
    if (lineLab) {
      if ((f.lineLabel ?? 0) > 0) ringAt(c, [lineLab.box.cx, lineLab.box.cy], Math.max(lineLab.box.w, lineLab.box.h) / 2 + 12, 'second', f.lineLabel!);
      drawLab(c, lineLab, kL);
    }
    for (const p of allPins) if (p.label) {
      const isImg = (pic.imagePins ?? []).includes(p);
      drawLab(c, pinLabs.get(p.label)!, isImg ? kI : (flapHidden && onFlap(p.at) ? 0 : kF));
    }
    let vi = 0;
    for (const Pp of polys) {
      if (!Pp.labels) continue;
      const isFig = (pic.figure ?? []).includes(Pp), isSolve = pic.solve?.poly === Pp;
      const k = isFig ? (flapHidden && Pp.pts.every(onFlap) ? 0 : kF) : isSolve ? P.k('join') : kI;
      Pp.labels.forEach(t => { if (t) drawLab(c, vertLabs[vi++]!, k); });
    }
    solved.forEach((s, i) => { const l = solveLabs[i]; if (l) drawLab(c, l, ki('answer', i)); });
    for (const cs of candSegs) drawLab(c, candLabs.get(cs.n)!, kC);
    noteLabs.forEach(l => drawLab(c, l, kSg));
    // orientation arrows (solution)
    for (const Pp of pic.solve?.orient ?? []) orientArrow(c, Pp, P.k('orient'));
    // the right answer ringed
    const ka = ki('answer', 0);
    if (pic.solve?.spot !== undefined && ka > 0) ringAt(c, px((pic.spots ?? []).find(s => s.n === pic.solve!.spot)!.at), 30, 'link', ka);
    // focus rings
    const fk = f.k ?? 0;
    if (fk > 0) {
      for (const n of f.spots ?? []) { const s = (pic.spots ?? []).find(x => x.n === n); if (s) ringAt(c, px(s.at), 30, f.col ?? 'pick', fk); }
      for (const t of f.points ?? []) { const b = pointBox.get(t); if (b) ringAt(c, [b.cx, b.cy], 30, f.col ?? 'pick', fk); }
    }
    // the folding flap, on top of everything
    if (kFold > 0 && L) {
      g.restore();
      g.save();
      const m = foldMatrix(kFold);
      g.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      g.clip(new Path2D(pathD(halfPoly(flapSide))));
      const back = kFold > 0.5;
      drawSheet(c, 1, back);
      // face up: the figure; turned over: the figure shows faintly through the paper (it lands on the image)
      withAlpha(c, back ? 0.4 : 1, () => {
        for (const Pp of pic.figure ?? []) if (Pp.pts.every(onFlap)) drawPoly(c, Pp, kF, 400);
        for (const p of pic.pins ?? []) if (onFlap(p.at)) drawPin(c, p, kF, 200);
      });
      g.restore();
      // the crease and its name
      drawLine(c, 1);
      if (lineLab) drawLab(c, lineLab, 1);
    }
  }
  return { kind: 'Mirror', pic, u, sheet, px, where, draw };
}

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
function pathD(P: Pt[]): string { return P.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + ' Z'; }
