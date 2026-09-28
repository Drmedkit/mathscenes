// RatioTiles: a ratio as unit tiles. a tiles of the first amount, b of the second: the group of a + b tiles is ONE
// copy of the ratio. It can be read ("for every a … b": count braces and a link arc), closed into one group (outlined),
// copied into a stack (row i holds (i+1)·a : (i+1)·b tiles in total), and turned into a bar for part-to-whole
// (the whole a + b, the parts a/(a+b) and b/(a+b); a/b is NOT a part of the whole and is computed to be refused).
//
//   const t = RatioTiles({ a: 2, b: 3, groups: 4, linkLabel: 'for every' }, frame(200, 180, 900, 700), ink);
//   t.draw(c, progress)     steps: a, b, link, countA, countB, join, frame, copy1 … copyN, bar, whole, partA, partB
import { type Box, type Pt, type Q, box, clamp, lag, lerp, qAdd, qDiv, qEq, qMul, rat, unionBox } from '../core/math';
import { E } from '../core/easing';
import { bracePts, curveApex, curvePts, rectPts } from '../core/pts';
import { type Canvas, drawOn, fillPts, glowOn, halo, strokePts } from '../core/draw';
import type { Progress } from '../core/clock';
import { type Paint, type Role, type Theme, paint } from '../core/theme';
import { tex, texBox, texDraw } from '../core/tex';
import { type Block, type Frame, type ParamSpec, check, friendly, hitsLines, plainText } from './block';

const NAME = 'RatioTiles';

export interface RatioTilesParams {
  /** the ratio a : b as whole numbers of tiles */
  readonly a: number; readonly b: number;
  /** how many copies of the group can be stacked (1 … 6, default 1) */
  readonly groups?: number;
  /** tile size in px (default 96) */
  readonly size?: number;
  /** colour roles of the two amounts and of the link (default first, second, link) */
  readonly roles?: readonly [Role, Role]; readonly accent?: Role;
  /** words on the link arc between the two amounts (e.g. 'for every'), or none */
  readonly linkLabel?: string | null;
}
export type RatioTilesStep = 'a' | 'b' | 'link' | 'countA' | 'countB' | 'join' | 'frame' | `copy${number}` | 'bar' | 'whole' | 'partA' | 'partB';

export interface TilesRow { readonly k: number; readonly first: Q; readonly second: Q; readonly total: Q }
export interface RatioTilesMaths {
  readonly a: Q; readonly b: Q; readonly whole: Q;
  /** row i: i+1 groups in total */ readonly rows: readonly TilesRow[];
  /** the parts of the whole: a/(a+b) and b/(a+b) */ readonly fracA: Q; readonly fracB: Q;
  /** a/b compares the two parts with each other: it is NOT the first part of the whole */ readonly partToPart: Q;
}
export const TILES_MAX = 12, TILES_MAX_GROUPS = 6;

export function computeRatioTiles(P: RatioTilesParams): RatioTilesMaths {
  const a = friendly(P.a, NAME, 'a', { whole: true }), b = friendly(P.b, NAME, 'b', { whole: true });
  check(a.p + b.p <= TILES_MAX, NAME, `at most ${TILES_MAX} tiles in a group (got ${a.p} + ${b.p})`);
  const n = P.groups ?? 1;
  check(Number.isInteger(n) && n >= 1 && n <= TILES_MAX_GROUPS, NAME, `groups must be a whole number 1 … ${TILES_MAX_GROUPS} (got ${n})`);
  if (P.linkLabel) plainText(P.linkLabel, NAME, 'link label');
  const whole = qAdd(a, b);
  const rows: TilesRow[] = Array.from({ length: n }, (_, i) => ({ k: i + 1, first: qMul(a, rat(i + 1)), second: qMul(b, rat(i + 1)), total: qMul(whole, rat(i + 1)) }));
  // every row keeps the ratio (it is copies of one group)
  rows.forEach(r => check(qEq(qDiv(r.first, r.second), qDiv(a, b)), NAME, `row ${r.k} is not ${a.p} : ${b.p}`));
  const fracA = qDiv(a, whole), fracB = qDiv(b, whole);
  check(qEq(qAdd(fracA, fracB), rat(1)), NAME, 'the parts do not make the whole');
  return { a, b, whole, rows, fracA, fracB, partToPart: qDiv(a, b) };
}

export function ratioTilesSteps(groups: number): RatioTilesStep[] {
  const s: RatioTilesStep[] = ['a', 'b', 'link', 'countA', 'countB', 'join', 'frame'];
  for (let i = 1; i < groups; i++) s.push(`copy${i}`);
  s.push('bar', 'whole', 'partA', 'partB');
  return s;
}

export interface TilesStyle {
  /** the group outlines (default dim) */ readonly frameCol?: Paint;
  readonly frameGlow?: number;
  /** extra glow on the tiles of one amount (0..1) */ readonly glowA?: number; readonly glowB?: number;
  /** alpha per group (e.g. dim the copies) */ readonly groupAlpha?: (i: number) => number;
  /** draw the braces, the link arc and their labels at all (default true) */ readonly braces?: boolean;
  /** extra alpha of the count braces, and whether their two numbers are drawn (a scene can fly them elsewhere) */
  readonly countAlpha?: number; readonly countLabels?: readonly [boolean, boolean];
  /** extra alpha and glow of the link arc */ readonly linkAlpha?: number; readonly linkGlow?: number;
  /** empty dashed slots where group 0's tiles will pop in (alpha, 0 = none) */ readonly slotAlpha?: number;
}
export interface RatioTilesBlock extends Block<RatioTilesStep> {
  readonly maths: RatioTilesMaths;
  readonly size: number; readonly numSize: number;
  /** the box of group i when joined (after 'join', before 'bar') */
  groupBox(i: number): Box;
  /** a point right of group i (for a running total) */
  tallyAt(i: number): Pt;
  /** centre of the a-part / b-part of group 0 (joined) */
  partCentre(which: 'a' | 'b'): Pt;
  /** label anchors (centres) of the count braces and the part braces */
  readonly anchors: { readonly countA: Pt; readonly countB: Pt; readonly whole: Pt; readonly partA: Pt; readonly partB: Pt; readonly link: Pt };
  draw(c: Canvas, p: Progress<RatioTilesStep>, s?: TilesStyle): void;
}

export function RatioTiles(P: RatioTilesParams, f: Frame, th: Theme): RatioTilesBlock {
  const M = computeRatioTiles(P);
  const [rA, rB] = P.roles ?? (['first', 'second'] as const), acc: Role = P.accent ?? 'link';
  const na = M.a.p, nb = M.b.p, n = na + nb, groups = P.groups ?? 1;
  const s = P.size ?? 96;
  check(s >= 40 && s <= 220, NAME, `tile size ${s} px is out of range (40 … 220)`);
  const gap = Math.round(s * 0.125), split = Math.round(s * 0.5), pad = Math.round(s * 0.2);
  const numSize = Math.max(th.font.minNum, Math.round(s * 0.72)), labSize = Math.max(th.font.minLabel, th.font.label);
  const W = n * s + (n - 1) * gap + 2 * pad, Hg = s + 2 * pad;
  const pitch = Hg + Math.max(20, Math.round(s * 0.22));
  // vertical room: link arc + label above group 0, count / part braces + labels below it, the copies below
  const braceD = 26, above = Math.max(P.linkLabel ? 150 : 0, 16 + braceD + 22 + numSize * 0.95 + 8), belowBraces = 26 + braceD + 30 + numSize * 1.25;
  const stackH = (groups - 1) * pitch + Hg;
  const totalH = above + Math.max(stackH, Hg + belowBraces);
  check(totalH <= f.h + 1, NAME, `${groups} group(s) of ${s} px tiles need ${Math.round(totalH)} px of height, the frame has ${Math.round(f.h)}`);
  check(W + split <= f.w + 1, NAME, `a group is ${Math.round(W + split)} px wide, the frame ${Math.round(f.w)}: use smaller tiles`);
  const cx = f.x + f.w / 2, top = f.y + above;
  const gy = (i: number) => top + i * pitch;                           // top of group i's frame
  // tile j of a group, with the split still open by `sp` px and gaps scaled by `gk`
  const tileX = (j: number, sp: number, gk: number) => {
    const w = n * s + (n - 1) * gap * gk + 2 * pad * gk + sp;
    return cx - w / 2 + pad * gk + j * (s + gap * gk) + (j >= na ? sp : 0);
  };
  const groupBox = (i: number) => box(cx - W / 2, gy(i), cx + W / 2, gy(i) + Hg);
  const partBox = (which: 'a' | 'b', sp = 0, gk = 1) => {
    const j0 = which === 'a' ? 0 : na, j1 = which === 'a' ? na - 1 : n - 1, y = gy(0) + pad;
    return box(tileX(j0, sp, gk), y, tileX(j1, sp, gk) + s, y + s);
  };
  // braces
  const under = (b: Box, y: number): Pt[] => bracePts([b.x1, y], [b.x0, y], braceD);
  const over = (b: Box, y: number): Pt[] => bracePts([b.x0, y], [b.x1, y], braceD);
  const g0 = groupBox(0), yUnder = g0.y1 + 16, yOver = g0.y0 - 16;
  const labUnder = yUnder + braceD + 22 + numSize * 0.45;
  const FA = tex(String(na)), FB = tex(String(nb)), FW = tex(String(n));
  const FPA = tex(`\\frac{\\cssId{n}{${na}}}{${n}}`), FPB = tex(`\\frac{\\cssId{n}{${nb}}}{${n}}`);
  const LF = P.linkLabel ? tex(`\\text{${P.linkLabel}}`) : null;
  // split geometry (before 'join') is where counts + link are read
  const pa0 = partBox('a', split), pb0 = partBox('b', split);
  const pa1 = partBox('a', 0, 0), pb1 = partBox('b', 0, 0);           // bar geometry
  const anchors = {
    countA: [pa0.cx, labUnder] as Pt, countB: [pb0.cx, labUnder] as Pt,
    whole: [cx, yOver - braceD - 22 - numSize * 0.45] as Pt,
    partA: [pa1.cx, yUnder + braceD + 30 + numSize * 0.75] as Pt, partB: [pb1.cx, yUnder + braceD + 30 + numSize * 0.75] as Pt,
    link: [0, 0] as Pt,
  };
  const linkA: Pt = [pa0.cx, pa0.y0 - 18], linkB: Pt = [pb0.cx, pb0.y0 - 18];
  const bend = Math.min(110, (linkB[0] - linkA[0]) * 0.32);   // positive: bulges up, away from the tiles
  const linkPts = curvePts(linkA, linkB, bend);
  const apex = curveApex(linkA, linkB, bend);
  anchors.link = [apex[0], apex[1] - 22 - labSize * 0.4];
  // ---- readability: labels inside the frame, none on a line ----
  const lines: Pt[][] = [linkPts, under(pa0, yUnder), under(pb0, yUnder), over(g0, yOver), under(pa1, yUnder), under(pb1, yUnder)];
  const labels: Box[] = [
    texBox(FA, ...anchors.countA, { size: numSize, align: 'center' }), texBox(FB, ...anchors.countB, { size: numSize, align: 'center' }),
    texBox(FW, ...anchors.whole, { size: numSize, align: 'center' }),
    texBox(FPA, ...anchors.partA, { size: numSize, align: 'center' }), texBox(FPB, ...anchors.partB, { size: numSize, align: 'center' }),
  ];
  if (LF) labels.push(texBox(LF, ...anchors.link, { size: labSize, align: 'center' }));
  labels.forEach(b => check(!hitsLines(b, lines, 4), NAME, 'a label would sit on a brace or the link arc'));
  const all = unionBox([...labels, groupBox(0), groupBox(groups - 1), box(cx - (W + split) / 2, g0.y0, cx + (W + split) / 2, g0.y1)]);
  check(all.x0 >= f.x - 1 && all.x1 <= f.x + f.w + 1 && all.y0 >= f.y - 1 && all.y1 <= f.y + f.h + 1, NAME,
    `the braces and labels do not fit the frame (content ${Math.round(all.x0)}..${Math.round(all.x1)} × ${Math.round(all.y0)}..${Math.round(all.y1)})`);
  const [fa, fb] = [labels[3]!, labels[4]!];
  check(fa.x1 + 16 <= fb.x0, NAME, 'the two part labels would overlap: use bigger tiles');

  const steps = ratioTilesSteps(groups);
  const tile = (c: Canvas, x: number, y: number, size: number, role: Role, k: number, glow: number, r: number) => {
    if (k <= 0) return;
    const e = E.back(clamp(k), 1.6), sz = size * e, P0 = rectPts(x + (size - sz) / 2, y + (size - sz) / 2, sz, sz, r * e, 4);
    c.g.save(); c.g.globalAlpha *= clamp(k * 2.5);
    if (glow > 0) halo(c, x + size / 2, y + size / 2, size * 1.05, role, 0.22 * glow);
    c.g.save(); if (glow > 0) glowOn(c, paint(th, role, 'fill'), 16 * glow); fillPts(c, P0, role, 0.9); c.g.restore();
    strokePts(c, P0, { col: paint(th, role, 'line'), lw: th.lw.thin, closed: true, alpha: 0.9 });
    c.g.restore();
  };

  return {
    kind: NAME, steps, box: all, maths: M, size: s, numSize, anchors,
    groupBox, tallyAt: (i: number) => [cx + W / 2 + 70, gy(i) + Hg / 2],
    partCentre: (w: 'a' | 'b') => { const b = partBox(w, 0); return [b.cx, b.cy]; },
    draw(c: Canvas, p: Progress<RatioTilesStep>, st: TilesStyle = {}) {
      const kj = E.smooth(p.k('join')), kbar = E.smooth(p.k('bar')), sp = split * (1 - kj), gk = 1 - kbar;
      const r = s * 0.12 * (1 - kbar);
      const ga = st.glowA ?? 0, gb = st.glowB ?? 0;
      const kfr = p.k('frame');
      for (let i = 0; i < groups; i++) {
        const kc = i === 0 ? 1 : p.k(`copy${i}`);
        if (kc <= 0) continue;
        const e = E.smooth(kc), y = lerp(gy(Math.max(0, i - 1)), gy(i), i === 0 ? 1 : e);
        // copies fade as the group becomes a bar (part-to-whole is about ONE group)
        const al = (st.groupAlpha ? st.groupAlpha(i) : 1) * (i === 0 ? 1 : clamp(kc * 3) * (1 - kbar));
        if (al <= 0) continue;
        c.g.save(); c.g.globalAlpha *= clamp(al);
        // the group frame
        if (kfr > 0) {
          const x0 = tileX(0, sp, gk) - pad * gk, x1 = tileX(n - 1, sp, gk) + s + pad * gk;
          const R = rectPts(x0, y + pad * (1 - gk), x1 - x0, s + 2 * pad * gk, Math.max(6, 18 * gk + 8 * kbar));
          const col = st.frameCol ?? 'dim';
          drawOn(c, R, i === 0 ? kfr : 1, { col, lw: th.lw.thin + 0.5 + kbar * 1.5, closed: true, ...(st.frameGlow ? { glow: st.frameGlow, glowCol: col } : {}) });
        }
        for (let j = 0; j < n; j++) {
          const isA = j < na;
          const kt = i === 0 ? lag(p.k(isA ? 'a' : 'b'), isA ? j : j - na, isA ? na : nb, 0.55) : 1;
          const sa = i === 0 ? (st.slotAlpha ?? 0) * (1 - clamp(kt * 2)) : 0;
          if (sa > 0) drawOn(c, rectPts(tileX(j, sp, gk), y + pad, s, s, r, 4), 1, { col: 'faint', lw: th.lw.thin, closed: true, dash: [10, 8], cap: 'butt', alpha: sa });
          tile(c, tileX(j, sp, gk), y + pad, s, isA ? rA : rB, kt, isA ? ga : gb, r);
        }
        c.g.restore();
      }
      if (st.braces === false) return;
      // reading one group: the link arc ("for every") and the counts
      const kl = p.k('link');
      if (kl > 0) {
        const fade = (1 - kj) * (st.linkAlpha ?? 1);
        c.g.save(); c.g.globalAlpha *= clamp(fade);
        drawOn(c, linkPts, clamp(kl / 0.7), { col: acc, lw: th.lw.base, glow: 10 + (st.linkGlow ?? 0), glowCol: acc });
        if (LF) texDraw(c, LF, ...anchors.link, { size: labSize, align: 'center', col: acc, k: clamp((kl - 0.35) / 0.65) });
        c.g.restore();
      }
      const kA = p.k('countA'), kB = p.k('countB'), fadeC = (1 - kj) * (st.countAlpha ?? 1), [labA, labB] = st.countLabels ?? [true, true];
      if (kA > 0 && fadeC > 0) {
        drawOn(c, under(pa0, yUnder), clamp(kA / 0.6), { col: rA, lw: th.lw.thin + 0.5, alpha: fadeC });
        if (labA) texDraw(c, FA, ...anchors.countA, { size: numSize, align: 'center', col: rA, k: clamp((kA - 0.3) / 0.7), alpha: fadeC });
      }
      if (kB > 0 && fadeC > 0) {
        drawOn(c, under(pb0, yUnder), clamp(kB / 0.6), { col: rB, lw: th.lw.thin + 0.5, alpha: fadeC });
        if (labB) texDraw(c, FB, ...anchors.countB, { size: numSize, align: 'center', col: rB, k: clamp((kB - 0.3) / 0.7), alpha: fadeC });
      }
      // part-to-whole on the bar
      const kw = p.k('whole'), kpa = p.k('partA'), kpb = p.k('partB');
      if (kw > 0) {
        drawOn(c, over(box(pa1.x0, 0, pb1.x1, 0), yOver), clamp(kw / 0.6), { col: 'ink', lw: th.lw.thin + 0.5 });
        texDraw(c, FW, ...anchors.whole, { size: numSize, align: 'center', col: 'ink', k: clamp((kw - 0.3) / 0.7) });
      }
      if (kpa > 0) {
        drawOn(c, under(pa1, yUnder), clamp(kpa / 0.6), { col: rA, lw: th.lw.thin + 0.5 });
        texDraw(c, FPA, ...anchors.partA, { size: numSize, align: 'center', col: 'ink', k: clamp((kpa - 0.3) / 0.7), tags: { n: { col: rA } } });
      }
      if (kpb > 0) {
        drawOn(c, under(pb1, yUnder), clamp(kpb / 0.6), { col: rB, lw: th.lw.thin + 0.5 });
        texDraw(c, FPB, ...anchors.partB, { size: numSize, align: 'center', col: 'ink', k: clamp((kpb - 0.3) / 0.7), tags: { n: { col: rB } } });
      }
    },
  };
}

/** gallery: defaults + sliders */
export const TILES_DEMO = {
  params: { a: 2, b: 3, groups: 3, size: 80, linkLabel: 'for every' } satisfies RatioTilesParams,
  specs: [
    { key: 'a', label: 'a', min: 0, max: 8, step: 1 },
    { key: 'b', label: 'b', min: 0, max: 8, step: 1 },
    { key: 'groups', label: 'groups', min: 1, max: 7, step: 1 },
    { key: 'size', label: 'tile px', min: 30, max: 140, step: 10 },
  ] as const satisfies readonly ParamSpec<{ a: number; b: number; groups: number; size: number }>[],
};
export const tilesDemoParams = (v: { a: number; b: number; groups: number; size: number }): RatioTilesParams => ({ ...v, linkLabel: 'for every' });
