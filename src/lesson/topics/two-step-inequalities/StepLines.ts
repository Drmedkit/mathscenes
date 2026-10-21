// StepLines: an inequality carried through its solving steps on stacked number lines (1 to 3 lines).
//   line i      one number line (crisp ink axis, ticks, labels ONLY at the numbers that matter, below the axis)
//   set i       the solution set on that line: a boundary dot (open = left out, filled = included) and a painted ray
//   map i       "the same move on both sides" from line i to line i + 1: an arrow from every sample value to its image.
//               Adding / subtracting slides every number (the arrows run parallel); × or ÷ by a positive keeps the
//               order (the arrows never cross); × or ÷ by a NEGATIVE swaps the order (the arrows cross) and the ray
//               turns around. compute() asserts this: a picture with a wrong flip cannot be built.
//   tests       test values on the last line: a lavender mark with a check (in the set) or a cross (out of it)
//   wrong       someone's wrong set on the last line (red, dashed), for "Prove it" and audits
// Steps `line{i} lab{i} set{i} map{i} test wrong`; `where.*` boxes for rings and leaders; pulses for symbols writing on.
// Layout: captions above-left of each axis, numbers below it, arrows leave under the numbers and land on the next
// axis from above, so no arrow crosses a number and no caption sits on an arrow (checked).
import { type Box, type Pt, box, clamp, lerp, unionBox } from '../../../core/math';
import { rectPts, circlePts } from '../../../core/pts';
import { type Canvas, arrow, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, type Paint, paint } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';

export interface LineSpec {
  lo: number; hi: number; tick: number;
  /** ticks sit at origin + k·tick (default 0) */ origin?: number;
  caption: string;
  /** the numbers written under the axis; `at` says which step shows them (the boundary comes with its set) */
  labels: { v: number; text: string; col?: Paint; at?: 'set' | 'lab' }[];
}
export interface SetSpec { b: number; dir: 1 | -1 | 0; closed: boolean; col: Paint }
export interface MapSpec { a: number; c: number; from: number[] }
export interface TestSpec { v: number; ok: boolean; text: string }
export interface StepParams {
  lines: LineSpec[];
  sets: (SetSpec | null)[];
  maps: MapSpec[];
  tests?: TestSpec[];
  wrong?: SetSpec | null;
  /** axis heights (default: spread over the frame) */ ys?: number[];
}
export interface StepFocus {
  /** pulse on line i's boundary dot / ray / caption */ dot?: number[]; ray?: number[]; cap?: number[];
  /** dim line i's set and labels (0..1) */ dim?: number[];
  /** dim the arrows of map i */ mapDim?: number[];
  /** the wrong set turns red and gets a cross */ wrongCross?: number;
}
export interface StepBlock {
  readonly kind: 'StepLines';
  readonly params: StepParams;
  readonly ys: number[];
  readonly where: {
    x(i: number, v: number): number; y(i: number): number;
    dot(i: number): Box; ray(i: number): Box; tip(i: number): Box; axis(i: number): Box; caption(i: number): Box;
    label(i: number, v: number): Box; band(i: number): Box; test(v: number): Box; wrongTip: Box | null;
  };
  draw(c: Canvas, P: Progress<string>, f?: StepFocus): void;
}
const NAME = 'StepLines';
const NUM = 60, CAP = 44, LAB_DY = 52, ARROW_FROM = 100, ARROW_TO = 20, CAP_DY = 94, MARK_DY = 50, DOT_R = 15;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-7;

/** the model's frame on the 1920 x 1080 lesson canvas: wider than the default model frame (leaders still fit) */
export const LINES_FRAME: Frame = { x: 50, y: 70, w: 1100, h: 940 };
/** the default axis heights for n lines inside a frame */
export function defaultYs(n: number, fr: Frame): number[] {
  if (n === 1) return [fr.y + fr.h * 0.5];
  if (n === 2) return [fr.y + 230, fr.y + 600];
  return [fr.y + 130, fr.y + 400, fr.y + 670];
}

export function StepLines(p: StepParams, fr: Frame, th: Theme): StepBlock {
  const n = p.lines.length;
  check(n >= 1 && n <= 3, NAME, `${n} lines: 1 to 3`);
  check(p.sets.length === n, NAME, 'one set entry per line (null for none)');
  check(p.maps.length === n - 1, NAME, 'one map between every two lines');
  const ys = p.ys ?? defaultYs(n, fr);
  check(ys.length === n, NAME, 'one height per line');
  for (let i = 1; i < n; i++) check(ys[i]! - ys[i - 1]! >= 240, NAME, 'lines closer than 240 px leave no room for the arrows');
  const X0 = fr.x + 80, X1 = fr.x + fr.w - 70;
  const x = (i: number, v: number): number => { const L = p.lines[i]!; return lerp(X0, X1, (v - L.lo) / (L.hi - L.lo)); };
  const y = (i: number) => ys[i]!;

  // ---- the maths: windows, sets, maps (order kept or reversed), tests ----
  p.lines.forEach((L, i) => {
    check(L.hi > L.lo && L.tick > 0, NAME, `line ${i}: empty window`);
    check((L.hi - L.lo) / L.tick <= 44, NAME, `line ${i}: too many ticks`);
    for (const l of L.labels) check(l.v >= L.lo && l.v <= L.hi, NAME, `line ${i}: the label ${l.text} is off the line`);
    const S = p.sets[i];
    if (S) check(S.b > L.lo + (L.hi - L.lo) * 0.08 && S.b < L.hi - (L.hi - L.lo) * 0.08, NAME, `line ${i}: the boundary ${S.b} is too close to the end`);
  });
  p.maps.forEach((M, i) => {
    check(M.a !== 0, NAME, 'a move multiplies by 0: every number would land on one point');
    const L = p.lines[i + 1]!, img = M.from.map(v => M.a * v + M.c);
    for (const v of img) check(v >= L.lo && v <= L.hi, NAME, `map ${i}: ${v} lands off line ${i + 1}`);
    // order: kept for a > 0, reversed for a < 0, for every pair of samples
    for (let a = 0; a < M.from.length; a++) for (let b = a + 1; b < M.from.length; b++) {
      const before = Math.sign(M.from[b]! - M.from[a]!), after = Math.sign(img[b]! - img[a]!);
      check(after === before * Math.sign(M.a), NAME, `map ${i}: the order of ${M.from[a]} and ${M.from[b]} is not ${M.a > 0 ? 'kept' : 'reversed'}`);
    }
    // the set moves with the numbers: the boundary maps to the boundary, the ray turns around iff a < 0
    const S0 = p.sets[i], S1 = p.sets[i + 1];
    if (S0 && S1) {
      check(near(S1.b, M.a * S0.b + M.c), NAME, `map ${i}: the boundary ${S0.b} should land on ${M.a * S0.b + M.c}, not ${S1.b}`);
      check(S1.dir === S0.dir * Math.sign(M.a), NAME, `map ${i}: the ray must ${M.a < 0 ? 'turn around (× or ÷ by a negative)' : 'keep its direction'}`);
      check(S1.closed === S0.closed, NAME, `map ${i}: a move never changes whether the boundary is included`);
    }
  });
  const last = n - 1, LS = p.sets[last];
  for (const t of p.tests ?? []) {
    const L = p.lines[last]!;
    check(t.v >= L.lo && t.v <= L.hi, NAME, `the test value ${t.text} is off the line`);
    if (LS) {
      const inSet = LS.dir === 0 ? near(t.v, LS.b) : near(t.v, LS.b) ? LS.closed : Math.sign(t.v - LS.b) === LS.dir;
      check(inSet === t.ok, NAME, `the test ${t.text} is marked ${t.ok ? 'in' : 'out of'} the set, but it is ${inSet ? 'in' : 'out'}`);
    }
  }

  // ---- layout boxes and their checks ----
  const labBox = (i: number, v: number, text: string) => wordsBox(text, x(i, v), y(i) + LAB_DY, { size: NUM, align: 'center' });
  const capBox = (i: number) => wordsBox(p.lines[i]!.caption, X0 - 20, y(i) - CAP_DY, { size: CAP, align: 'left' });
  const testLabels = (p.tests ?? []).map(t => ({ v: t.v, text: t.text }));
  p.lines.forEach((L, i) => {
    const labs = [...L.labels, ...(i === last ? testLabels : [])].sort((a, b) => a.v - b.v);
    for (let k = 1; k < labs.length; k++) {
      const A = labBox(i, labs[k - 1]!.v, labs[k - 1]!.text), B = labBox(i, labs[k]!.v, labs[k]!.text);
      check(B.x0 - A.x1 >= 14, NAME, `line ${i}: the numbers ${labs[k - 1]!.text} and ${labs[k]!.text} overlap`);
    }
    for (const l of labs) { const B = labBox(i, l.v, l.text); check(B.x0 >= fr.x - 10 && B.x1 <= fr.x + fr.w + 30, NAME, `line ${i}: ${l.text} runs off the frame`); }
    if (L.caption) check(capBox(i).x1 <= X1, NAME, `line ${i}: the caption is too long`);
  });
  if (p.lines[last]!.caption) for (const t of p.tests ?? []) {
    const C = capBox(last), xx = x(last, t.v);
    check(!(xx + 24 > C.x0 && xx - 24 < C.x1 && y(last) - MARK_DY - 18 < C.y1), NAME, `the test mark at ${t.text} sits on the caption`);
  }
  const arrowPts = (i: number, v: number): Pt[] => {
    const M = p.maps[i]!;
    return [[x(i, v), y(i) + ARROW_FROM], [x(i + 1, M.a * v + M.c), y(i + 1) - ARROW_TO]];
  };
  p.maps.forEach((M, i) => {
    const segs = M.from.map(v => arrowPts(i, v));
    if (p.lines[i + 1]!.caption) check(!hitsLines(capBox(i + 1), segs, 8), NAME, `map ${i}: an arrow runs through the caption of line ${i + 1}`);
    // arrows start under line i's numbers: every sample value must have its number
    for (const v of M.from) check(p.lines[i]!.labels.some(l => near(l.v, v)), NAME, `map ${i}: the sample ${v} has no number on line ${i}`);
  });

  const dotBox = (i: number) => { const S = p.sets[i]; const xx = S ? x(i, S.b) : (X0 + X1) / 2; return box(xx - DOT_R - 4, y(i) - DOT_R - 4, xx + DOT_R + 4, y(i) + DOT_R + 4); };
  const rayEnd = (S: SetSpec) => (S.dir > 0 ? X1 + 6 : X0 - 6);
  const rayBox = (i: number) => { const S = p.sets[i]; if (!S || S.dir === 0) return dotBox(i); const a = x(i, S.b), b = rayEnd(S); return box(Math.min(a, b), y(i) - 14, Math.max(a, b), y(i) + 14); };
  const tipBox = (i: number) => { const S = p.sets[i]; if (!S || S.dir === 0) return dotBox(i); const e = rayEnd(S) + S.dir * 24; return box(Math.min(e, e - S.dir * 40), y(i) - 22, Math.max(e, e - S.dir * 40), y(i) + 22); };
  const testBox = (v: number) => box(x(last, v) - 26, y(last) - MARK_DY - 20, x(last, v) + 26, y(last) + 20);

  // ---- painters ----
  function ring(c: Canvas, R: Box, col: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 4.5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - 8, R.y0 - 8, R.w + 16, R.h + 16, 14); g.stroke(); g.restore();
  }
  function drawSet(c: Canvas, i: number, S: SetSpec, k: number, o: { dashed?: boolean; seed: number; pulseDot?: number; pulseRay?: number; rayAlpha?: number }): void {
    if (k <= 0) return;
    const yy = y(i), bx = x(i, S.b), col = S.col;
    // the ray grows from the boundary outward after the dot lands
    const kr = clamp(k * 1.6 - 0.45);
    if (S.dir !== 0 && kr > 0 && (o.rayAlpha ?? 1) > 0) withAlpha(c, o.rayAlpha ?? 1, () => {
      const end = lerp(bx + S.dir * DOT_R, rayEnd(S), E.inOut(kr));
      if (o.dashed) {
        const { g } = c;
        g.save(); g.setLineDash([22, 14]); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 12; g.lineCap = 'butt'; g.globalAlpha *= 0.9;
        g.beginPath(); g.moveTo(bx + S.dir * (DOT_R + 4), yy); g.lineTo(end, yy); g.stroke(); g.restore();
      } else {
        const a = Math.min(bx + S.dir * (DOT_R - 2), end), b = Math.max(bx + S.dir * (DOT_R - 2), end);
        if (b - a > 4) wash(c, rectPts(a, yy - 10, b - a, 20, 9), col, { seed: o.seed, rough: 0.9, ink: DUSK.ink, inkW: 2.5, shade: 0.15 });
      }
      if (kr > 0.85) {
        const e = end, d = S.dir, ka = clamp((kr - 0.85) / 0.15);
        const head: Pt[] = [[e - d * 4, yy - 22], [e + d * 30, yy], [e - d * 4, yy + 22]];
        withAlpha(c, ka, () => wash(c, head, col, { seed: o.seed + 3, rough: 0.6, ink: DUSK.ink, inkW: 2.5, shade: 0.1 }));
      }
      if ((o.pulseRay ?? 0) > 0) ring(c, rayBox(i), col, o.pulseRay!);
    });
    // the boundary dot: filled = included, open = left out
    const kd = clamp(k * 2.2);
    withAlpha(c, kd, () => {
      const r = DOT_R * (0.6 + 0.4 * E.out(kd));
      if (S.closed) wash(c, circlePts(bx, yy, r, 32), col, { seed: o.seed + 7, rough: 0.5, ink: DUSK.ink, inkW: 2.5, shade: 0.1 });
      else {
        const { g } = c;
        g.save(); g.fillStyle = DUSK.navy; g.beginPath(); g.arc(bx, yy, r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 6; if (o.dashed) g.setLineDash([7, 5]); g.stroke(); g.restore();
      }
    });
    if ((o.pulseDot ?? 0) > 0) ring(c, dotBox(i), col, o.pulseDot!);
  }
  function check_(c: Canvas, cx: number, cy: number, k: number): void {
    inkLine(c, [[cx - 16, cy], [cx - 4, cy + 13], [cx + 18, cy - 15]], { col: 'link', w: 7, seed: 91, alpha: k, rough: 0.4 });
  }
  function cross(c: Canvas, cx: number, cy: number, k: number): void {
    inkLine(c, [[cx - 14, cy - 14], [cx + 14, cy + 14]], { col: 'wrong', w: 7, seed: 92, alpha: k, rough: 0.4 });
    inkLine(c, [[cx + 14, cy - 14], [cx - 14, cy + 14]], { col: 'wrong', w: 7, seed: 93, alpha: k, rough: 0.4 });
  }

  function draw(c: Canvas, P: Progress<string>, f: StepFocus = {}): void {
    for (let i = 0; i < n; i++) {
      const L = p.lines[i]!, kL = P.k('line' + i);
      if (kL <= 0) continue;
      const yy = y(i), dim = 1 - 0.5 * (f.dim?.[i] ?? 0);
      // the axis: a crisp cream line with an arrowhead at both ends, ticks at every step
      const k = E.inOut(clamp(kL * 1.25));
      const xm = (X0 + X1) / 2;
      inkLine(c, [[lerp(xm, X0 - 30, k), yy], [lerp(xm, X1 + 30, k), yy]], { col: DUSK.cream, w: 4, seed: 61 + i, rough: 0.25, alpha: 0.85 });
      if (k > 0.95) {
        for (const d of [-1, 1]) {
          const e = d < 0 ? X0 - 34 : X1 + 34;
          inkLine(c, [[e - d * 16, yy - 11], [e, yy], [e - d * 16, yy + 11]], { col: DUSK.cream, w: 4, seed: 63 + i + d, rough: 0.2, alpha: 0.85 * clamp((k - 0.95) * 20) });
        }
      }
      const o = L.origin ?? 0, first = Math.ceil((L.lo - o) / L.tick - 1e-9), lastT = Math.floor((L.hi - o) / L.tick + 1e-9);
      for (let t = first; t <= lastT; t++) {
        const v = o + t * L.tick, xx = x(i, v);
        const kt = clamp(kL * 1.6 - 0.5 - 0.3 * Math.abs(xx - xm) / (X1 - X0));
        if (kt <= 0) continue;
        const major = L.labels.some(l => near(l.v, v));
        inkLine(c, [[xx, yy - (major ? 14 : 10)], [xx, yy + (major ? 14 : 10)]], { col: DUSK.cream, w: major ? 4 : 3, seed: 70 + t, rough: 0.1, alpha: kt * (major ? 0.9 : 0.55) });
      }
      if (L.caption) drawWords(c, L.caption, X0 - 20, yy - CAP_DY, 'dim', clamp(kL * 2 - 0.6), { size: CAP, align: 'left' });
      if ((f.cap?.[i] ?? 0) > 0) ring(c, capBox(i), 'second', f.cap![i]!);
      // the numbers: samples with 'lab', the boundary with its set
      const kLab = P.k('lab' + i), kSet = P.k('set' + i);
      withAlpha(c, dim, () => {
        for (const l of L.labels) {
          const kk = (l.at ?? 'lab') === 'set' ? Math.max(kSet, kLab) : kLab;
          if (kk > 0) drawWords(c, l.text, x(i, l.v), yy + LAB_DY, l.col ?? 'dim', clamp(kk * 2), { size: NUM, align: 'center', weight: l.col === 'first' ? 700 : 600 });
        }
      });
    }
    // the arrows of each move (amber for the boundary, lavender for the others), drawn one after another
    p.maps.forEach((M, i) => {
      const km = P.k('map' + i);
      if (km <= 0) return;
      const a = 1 - 0.65 * (f.mapDim?.[i] ?? 0);
      const S = p.sets[i];
      withAlpha(c, a, () => M.from.forEach((v, j) => {
        const kj = clamp(km * (M.from.length + 1) / 2 - j * 0.5);
        const isB = !!S && near(v, S.b);
        arrow(c, arrowPts(i, v), E.inOut(kj), { col: isB ? 'first' : 'pick', lw: 6, head: 22 });
      }));
    });
    // the sets (after the arrows, so a ray lies on top of the arrow heads it continues)
    for (let i = 0; i < n; i++) {
      const S = p.sets[i];
      if (!S) continue;
      withAlpha(c, 1 - 0.5 * (f.dim?.[i] ?? 0), () => drawSet(c, i, S, P.k('set' + i), { seed: 100 + 10 * i, pulseDot: f.dot?.[i], pulseRay: f.ray?.[i] }));
    }
    // someone's wrong set on the last line: neutral and dashed, red with a cross once it is refuted
    if (p.wrong) {
      const kw = P.k('wrong'), kx = clamp(f.wrongCross ?? 0);
      if (kw > 0) {
        const W = { ...p.wrong, col: (kx > 0.5 ? 'wrong' : p.wrong.col) as Paint };
        // a proposed ray on the same side as the true one fades when the true set arrives (only its dot differs)
        const same = !!LS && LS.dir === W.dir && LS.dir !== 0;
        drawSet(c, last, W, kw, { dashed: true, seed: 140, rayAlpha: same ? 1 - clamp(P.k('set' + last) * 1.5) : 1 });
      }
    }
    // the test values: a lavender mark on the axis, its number in lavender, a check or a cross above it
    const kt = P.k('test');
    if (kt > 0) (p.tests ?? []).forEach((t, j) => {
      const kk = clamp(kt * 2.2 - j * 0.9);
      if (kk <= 0) return;
      const xx = x(last, t.v), yy = y(last);
      withAlpha(c, kk, () => {
        const { g } = c;
        g.save(); g.fillStyle = paint(th, 'pick', 'fill'); g.strokeStyle = DUSK.ink; g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(xx, yy - 6); g.lineTo(xx - 13, yy - 28); g.lineTo(xx + 13, yy - 28); g.closePath(); g.fill(); g.stroke(); g.restore();
      });
      drawWords(c, t.text, xx, yy + LAB_DY, 'pick', kk, { size: NUM, align: 'center', weight: 700 });
      const kc = clamp(kk * 2 - 1);
      if (kc > 0) (t.ok ? check_ : cross)(c, xx, yy - MARK_DY, kc);
    });
  }

  const wrongTip = p.wrong && p.wrong.dir !== 0 ? (() => { const e = rayEnd(p.wrong!) + p.wrong!.dir * 24; return box(Math.min(e, e - p.wrong!.dir * 40), y(last) - 22, Math.max(e, e - p.wrong!.dir * 40), y(last) + 22); })() : null;
  return {
    kind: 'StepLines', params: p, ys,
    where: {
      x, y, dot: dotBox, ray: rayBox, tip: tipBox, test: testBox, wrongTip,
      axis: i => box(X0 - 34, y(i) - 14, X1 + 34, y(i) + 14),
      caption: capBox,
      label: (i, v) => { const l = [...p.lines[i]!.labels, ...(i === last ? testLabels : [])].find(m => near(m.v, v)); return labBox(i, v, l ? l.text : String(v)); },
      band: i => box(X0, y(i) + ARROW_FROM, X1, y(i + 1) - ARROW_TO),
    },
    draw,
  };
}

/** can the block draw these params inside the frame? (generators only make pictures the model can draw) */
export function stepFits(p: StepParams, fr: Frame, th: Theme): boolean {
  try { StepLines(p, fr, th); return true; } catch { return false; }
}
export const allBoxes = (b: StepBlock): Box => unionBox(b.params.lines.map((_, i) => b.where.axis(i)));
