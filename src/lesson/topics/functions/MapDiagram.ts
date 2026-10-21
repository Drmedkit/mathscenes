// MapDiagram: a relation as a mapping diagram, the first model of "exactly one output for each input".
//   ovals   two painted ovals: the inputs (amber, left) and the outputs (teal, right), each with its name above
//   ins/outs the values, stacked in their oval (numbers >= 60 px, names >= 44 px)
//   a<i>    one arrow per pair, from just right of its input to just left of its output (never through a value)
//   flip    every arrow turns around (output -> input): the reverse relation, read the other way
// Focus: a glowing ring on an input / output (pulse), an arrow in another role colour (link = allowed, wrong = the
// witness, pick = being followed), and dimming of the arrows not being followed.
// Pure layout; draw(c, progress, focus) keeps no state. Throws BlockError when a value or name cannot be read.
import { type Box, type Pt, box, clamp, lerp, unionBox } from '../../../core/math';
import { type Canvas, arrow, withAlpha } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Theme, type Paint, mix, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { arcPts } from '../../../core/pts';
import { drawWords } from '../../words';
import { tbox as wordsBox } from './text';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type V, hn } from './relation';

const NAME = 'MapDiagram';
export interface MapParams { ins: readonly V[]; outs: readonly V[]; arrows: readonly (readonly [number, number])[]; inName: string; outName: string }
export interface MapFocus {
  inPulse?: Record<number, number>; outPulse?: Record<number, number>;
  /** arrow index -> colour role (and its strength 0..1 of that colour) */
  arrowCol?: Record<number, Paint>;
  /** arrows being followed: the others dim by `dim` */
  lit?: readonly number[]; dim?: number;
  /** a value turns a colour (e.g. the shared output in lime, the witness input in red) */
  inCol?: Record<number, Paint>; outCol?: Record<number, Paint>;
}
export interface MapBlock {
  readonly kind: 'MapDiagram';
  readonly box: Box;
  readonly where: { inVal(i: number): Box; outVal(j: number): Box; inName: Box; outName: Box; inOval: Box; outOval: Box; arrowMid(a: number): Box };
  draw(c: Canvas, p: Progress<string>, f?: MapFocus): void;
}

const NUM = 62, WORD = 50, NAMEW = 46;
const valSize = (v: V) => (typeof v === 'number' ? NUM : WORD);
const valW = (v: V) => wordsBox(hn(v), 0, 0, { size: valSize(v), weight: 600 }).w;

export function MapDiagram(p: MapParams, fr: Frame, _th: Theme): MapBlock {
  const nI = p.ins.length, nO = p.outs.length, n = Math.max(nI, nO);
  check(nI >= 1 && nO >= 1 && n <= 7, NAME, `${nI} inputs and ${nO} outputs: 1 to 7 each`);
  for (const [i, j] of p.arrows) check(i >= 0 && i < nI && j >= 0 && j < nO, NAME, `arrow ${i} -> ${j} has no end`);
  check(new Set(p.arrows.map(a => a.join(','))).size === p.arrows.length, NAME, 'an arrow is drawn twice');
  const wI = Math.max(...p.ins.map(valW)), wO = Math.max(...p.outs.map(valW));
  const rx = Math.max(118, Math.max(wI, wO) / 2 + 58);
  const nameY = fr.y + 34, top = fr.y + 96, bottom = fr.y + fr.h - 10;
  const rowH = Math.min(124, (bottom - top - 70) / n);
  check(rowH >= 74, NAME, `${n} rows do not fit`);
  const cy = (top + bottom) / 2;
  const ry = (n * rowH) / 2 + 40;
  const cxI = fr.x + rx + 30, cxO = fr.x + fr.w - rx - 30;
  check(cxO - cxI - 2 * rx >= 220, NAME, 'the ovals are too close for the arrows');
  const yAt = (k: number, cnt: number) => cy + (k - (cnt - 1) / 2) * rowH;
  const inVal = (i: number) => wordsBox(hn(p.ins[i]!), cxI, yAt(i, nI), { size: valSize(p.ins[i]!), align: 'center' });
  const outVal = (j: number) => wordsBox(hn(p.outs[j]!), cxO, yAt(j, nO), { size: valSize(p.outs[j]!), align: 'center' });
  // names centred over their ovals, pulled in so they stay inside the frame
  const nameAt = (t: string, cx: number) => { const w0 = wordsBox(t, 0, 0, { size: NAMEW, weight: 600 }).w; return wordsBox(t, clamp(cx, fr.x + w0 / 2, fr.x + fr.w - w0 / 2), nameY, { size: NAMEW, align: 'center', weight: 600 }); };
  const inNameB = nameAt(p.inName, cxI), outNameB = nameAt(p.outName, cxO);
  check(inNameB.x0 >= fr.x - 20 && outNameB.x1 <= fr.x + fr.w + 20, NAME, 'a name is too long');
  check(inNameB.x1 + 30 < outNameB.x0, NAME, 'the names collide');
  // arrows: from a column right of the widest input to a column left of the widest output
  const ax0 = cxI + wI / 2 + 26, ax1 = cxO - wO / 2 - 30;
  const arrowPts = p.arrows.map(([i, j]): Pt[] => {
    const a: Pt = [ax0, yAt(i, nI)], b: Pt = [ax1, yAt(j, nO)];
    const P: Pt[] = [];
    for (let s = 0; s <= 24; s++) {
      const t = s / 24, u = 1 - t;
      // a cubic with horizontal tangents: arrows that share an end fan out cleanly
      const c1: Pt = [lerp(a[0], b[0], 0.38), a[1]], c2: Pt = [lerp(a[0], b[0], 0.62), b[1]];
      P.push([u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0], u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]]);
    }
    return P;
  });
  const inOval = box(cxI - rx, cy - ry, cxI + rx, cy + ry), outOval = box(cxO - rx, cy - ry, cxO + rx, cy + ry);
  check(inOval.y0 > nameY + 30 && inOval.y1 <= fr.y + fr.h + 6, NAME, 'the ovals do not fit the frame');

  function ring(c: Canvas, B: Box, col: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    const fill = paint(c.th, col, 'fill');
    g.fillStyle = fill; g.globalAlpha *= 0.2;
    g.beginPath(); g.roundRect(B.x0 - 18, B.y0 - 12, B.w + 36, B.h + 24, 16); g.fill();
    g.globalAlpha /= 0.2;
    g.strokeStyle = fill; g.lineWidth = 4; g.shadowColor = fill; g.shadowBlur = 10;
    g.beginPath(); g.roundRect(B.x0 - 18, B.y0 - 12, B.w + 36, B.h + 24, 16); g.stroke();
    g.restore();
  }
  function oval(c: Canvas, cx: number, col: 'first' | 'second', seed: number, k: number): void {
    const P = arcPts(cx, cy, rx, ry, 0, Math.PI * 2, 96).slice(0, 96);
    withAlpha(c, k, () => {
      wash(c, P, mix(paint(c.th, col, 'fill'), DUSK.navy, 0.8), { seed, ink: null, rough: 2.4, shade: 0.25 });
      inkLine(c, P, { col: mix(paint(c.th, col, 'fill'), DUSK.navy, 0.25), w: 4, closed: true, seed: seed + 1, rough: 1.1 });
    });
  }
  function draw(c: Canvas, P: Progress<string>, f: MapFocus = {}): void {
    const kO = clamp(P.k('ovals'));
    oval(c, cxI, 'first', 11, kO); oval(c, cxO, 'second', 23, kO);
    drawWords(c, p.inName, inNameB.cx, nameY, 'first', kO, { size: NAMEW, align: 'center' });
    drawWords(c, p.outName, outNameB.cx, nameY, 'second', kO, { size: NAMEW, align: 'center' });
    // arrows under the values' rings
    const kf = clamp(P.k('flip'));
    p.arrows.forEach((_, a) => {
      const k = clamp(P.k('a' + a));
      if (k <= 0) return;
      const col = f.arrowCol?.[a] ?? 'ink';
      const dimmed = f.lit && !f.lit.includes(a) ? 1 - 0.7 * clamp(f.dim ?? 0) : 1;
      const Pp = arrowPts[a]!;
      const o = { col, lw: col === 'ink' ? 5 : 6.5, head: 28 };
      if (kf <= 0) arrow(c, Pp, k, { ...o, alpha: dimmed });
      else {
        if (kf < 0.5) arrow(c, Pp, 1, { ...o, alpha: dimmed * (1 - 2 * kf) });
        else arrow(c, [...Pp].reverse(), 1, { ...o, alpha: dimmed * (2 * kf - 1) });
      }
    });
    const kI = clamp(P.k('ins')), kU = clamp(P.k('outs'));
    p.ins.forEach((v, i) => {
      const B = inVal(i), col = f.inCol?.[i] ?? 'first';
      ring(c, B, col === 'first' ? 'first' : col, f.inPulse?.[i] ?? 0);
      drawWords(c, hn(v), cxI, yAt(i, nI), col, kI, { size: valSize(v), align: 'center' });
    });
    p.outs.forEach((v, j) => {
      const B = outVal(j), col = f.outCol?.[j] ?? 'second';
      ring(c, B, col === 'second' ? 'second' : col, f.outPulse?.[j] ?? 0);
      drawWords(c, hn(v), cxO, yAt(j, nO), col, kU, { size: valSize(v), align: 'center' });
    });
  }
  return {
    kind: 'MapDiagram',
    box: unionBox([inOval, outOval, inNameB, outNameB]),
    where: {
      inVal, outVal, inName: inNameB, outName: outNameB, inOval, outOval,
      arrowMid: a => { const Q = arrowPts[a]!, m = Q[12]!; return box(m[0] - 10, m[1] - 10, m[0] + 10, m[1] + 10); },
    },
    draw,
  };
}
