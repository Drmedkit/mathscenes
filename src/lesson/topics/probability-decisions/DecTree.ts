// DecTree: the decision tree of "Using probability to make decisions" (a candidate for src/lesson/kit/: every
// decision lesson needs one). One card in a Frame:
//   a square decision node on the left (what YOU choose), an elbow out to one branch per option with the option's name
//   above it, a round chance node per option (what CHANCE decides), a fan of outcome branches with the probability on
//   each branch (above a branch that climbs or runs level, below one that falls), and a leaf per outcome: the outcome in
//   words and its net payoff (TeX). Under each option's branch an optional expected value (E = ...).
// Steps: 'card', 'sq', 'opts', 'fan', 'p', 'v', 'ev', 'hl' (the chosen option glows lime) and 'rev' (hidden "?" cells
// fade to their reveal values: the item's solution). Pure layout with estimated text widths (no DOM in the layout);
// throws BlockError when something would not fit at 60 px numbers / 44 px labels.
import { type Box, box, clamp, lag } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Formula, tex, texDraw, texWidth } from '../../../core/tex';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';

const NAME = 'DecTree';
export interface TreeOut { label: string; /** TeX probability; null = "?" until 'rev' */ p: string | null; /** TeX net payoff; null = "?" */ v: string | null }
export interface TreeOpt { label: string; outs: TreeOut[] }
export interface TreePic {
  kind: 'dtree';
  opts: TreeOpt[];
  title?: string;
  /** TeX expected value per option ("E = -\\$45"); null = "?" until 'rev'; omit = none */
  ev?: (string | null)[];
  /** the option that glows on 'hl' */
  hl?: number;
  reveal?: { p?: (string | null)[][]; v?: (string | null)[][]; ev?: (string | null)[] };
}
export interface DecTreeBlock {
  readonly kind: 'DecTree';
  readonly pic: TreePic;
  readonly box: Box;
  readonly steps: readonly string[];
  where(key: string): Box;
  draw(c: Canvas, P: Progress<string>): void;
}

const NUM = 60, LAB = 44, TITLE = 46;
const CARD = '#262B57';
const wW = (s: string, size: number) => s.length * size * 0.53;
const FC = new Map<string, Formula>();
const F = (s: string): Formula => { let f = FC.get(s); if (!f) { f = tex(s) as Formula; FC.set(s, f); } return f; };
const texW = (s: string, size: number) => { try { return texWidth(F(s), size); } catch { return wW(s, size) * 0.8; } };

export function DecTree(pic: TreePic, fr: Frame, th: Theme): DecTreeBlock {
  const x0 = fr.x, y0 = fr.y, x1 = fr.x + fr.w, y1 = fr.y + fr.h;
  const nO = pic.opts.length;
  check(nO >= 1 && nO <= 3, NAME, '1 to 3 options');
  for (const o of pic.opts) check(o.outs.length >= 1 && o.outs.length <= 3, NAME, '1 to 3 outcomes per option');
  const title = pic.title ?? '';
  if (title) check(wW(title, TITLE) <= fr.w - 40, NAME, `title "${title}" is too wide`);
  const top = y0 + (title ? 100 : 40), bot = y1 - 30;
  const nL = pic.opts.reduce((s, o) => s + o.outs.length, 0);
  const units = nL + 0.45 * (nO - 1);
  const rowH = Math.min(176, (bot - top) / units);
  check(rowH >= 118, NAME, `rows too short (${rowH.toFixed(0)} px)`);
  const used = rowH * units, ty = top + (bot - top - used) / 2 + rowH / 2;
  // leaves top to bottom, a gap between options
  const leafY: number[][] = [];
  let yy = ty;
  pic.opts.forEach(o => { leafY.push(o.outs.map(() => { const y = yy; yy += rowH; return y; })); yy += rowH * 0.45; });
  const optY = leafY.map(ys => (ys[0]! + ys[ys.length - 1]!) / 2);
  const midY = (optY[0]! + optY[nO - 1]!) / 2;
  const sq = 46, sqX = x0 + 34, ex = x0 + 118;
  const cx = x0 + fr.w * 0.47, r = 17, lx = x0 + fr.w * 0.69, tx = lx + 20;
  const val = (i: number, j: number) => pic.opts[i]!.outs[j]!.v ?? pic.reveal?.v?.[i]?.[j] ?? '?';
  const pr = (i: number, j: number) => pic.opts[i]!.outs[j]!.p ?? pic.reveal?.p?.[i]?.[j] ?? '?';
  const evs = (i: number) => pic.ev?.[i] ?? pic.reveal?.ev?.[i] ?? '?';
  const boxes = new Map<string, Box>();
  pic.opts.forEach((o, i) => {
    const lw = wW(o.label, LAB);
    check(ex + 16 + lw <= cx - r - 8, NAME, `option label "${o.label}" is too wide`);
    boxes.set(`o${i}`, box(ex + 16, optY[i]! - 60, ex + 16 + lw, optY[i]! - 10));
    if (pic.ev) { const w = texW(evs(i), NUM); check(ex + 16 + w <= cx + 40, NAME, 'expected value too wide'); boxes.set(`ev${i}`, box(ex + 16, optY[i]! + 14, ex + 16 + w, optY[i]! + 74)); }
    o.outs.forEach((u, j) => {
      const w = Math.max(wW(u.label, LAB), texW(val(i, j), NUM));
      check(tx + w <= x1 - 18, NAME, `leaf "${u.label}" is too wide`);
      boxes.set(`l${i}.${j}`, box(tx, leafY[i]![j]! - 54, tx + w, leafY[i]![j]! + 62));
      boxes.set(`v${i}.${j}`, box(tx, leafY[i]![j]! + 2, tx + texW(val(i, j), NUM), leafY[i]![j]! + 62));
      const pw = texW(pr(i, j), NUM);
      check(pw <= (lx - cx) * 0.95, NAME, 'a probability is wider than its branch');
    });
  });
  // probability labels: on the branch at 55 %, above a climbing or level branch, below a falling one
  const pAt = (i: number, j: number): [number, number] => {
    const ly = leafY[i]![j]!, cy = optY[i]!, t = 0.52;
    const mx = cx + r + (lx - cx - r) * t, my = cy + (ly - cy) * t;
    return [mx, ly > cy + 1 ? my + 40 : my - 40];
  };
  const steps = ['card', 'sq', 'opts', 'fan', 'p', 'v', ...(pic.ev ? ['ev'] : []), ...(pic.hl !== undefined ? ['hl'] : [])];
  const col = (cl: Paint) => paint(th, cl, 'fill');
  function stroke(c: Canvas, pts: [number, number][], cl: Paint | string, w: number, k = 1, alpha = 1): void {
    if (pts.length < 2 || k <= 0 || alpha <= 0) return;
    // grow the polyline to fraction k of its length
    const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i]![0], q[1] - pts[i]![1]));
    let left = segs.reduce((a, b) => a + b, 0) * clamp(k);
    const { g } = c;
    g.save(); g.globalAlpha *= alpha; g.strokeStyle = cl.startsWith('#') ? cl : col(cl as Paint); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(pts[0]![0], pts[0]![1]);
    for (let i = 1; i < pts.length && left > 0; i++) {
      const s = segs[i - 1]!, f = Math.min(1, left / s), a = pts[i - 1]!, b = pts[i]!;
      g.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f); left -= s;
    }
    g.stroke(); g.restore();
  }
  const texAt = (c: Canvas, s: string, x: number, y: number, size: number, cl: Paint, a: number, align: 'left' | 'center' = 'center') => { if (a > 0 && s) texDraw(c, F(s), x, y, { size, align, col: cl, alpha: clamp(a) }); };
  /** a cell that may be hidden: the given TeX, or "?" fading to the reveal on 'rev' */
  const cell = (c: Canvas, given: string | null, rv: string | null | undefined, x: number, y: number, cl: Paint, k: number, rvk: number, align: 'left' | 'center') => {
    if (given !== null) { texAt(c, given, x, y, NUM, cl, k, align); return; }
    texAt(c, '?', x, y, NUM, 'pick', k * (rv ? 1 - rvk : 1), align);
    if (rv) texAt(c, rv, x, y, NUM, 'link', k * rvk, align);
  };
  function draw(c: Canvas, P: Progress<string>): void {
    const kc = P.k('card'), ks = P.k('sq'), ko = P.k('opts'), kf = P.k('fan'), kp = P.k('p'), kv = P.k('v'), ke = P.k('ev'), kh = P.k('hl'), rvk = P.k('rev');
    if (kc > 0) {
      withAlpha(c, E.smooth(clamp(kc * 2)), () => wash(c, rectPts(x0, y0, fr.w, fr.h, 18), CARD as Paint, { seed: 53, rough: 1.3, ink: DUSK.ink, inkW: 3, shade: 0.25 }));
      if (title) drawWords(c, title, (x0 + x1) / 2, y0 + 52, 'ink', clamp(kc * 1.5 - 0.3), { size: TITLE, align: 'center', weight: 700 });
    }
    if (ks > 0) {
      const s = sq * E.back(clamp(ks));
      wash(c, rectPts(sqX + (sq - s) / 2, midY - s / 2, s, s, 4), 'first', { seed: 9, rough: 0.5, ink: DUSK.ink, inkW: 3, shade: 0.3 });
    }
    pic.opts.forEach((o, i) => {
      const k = E.inOut(clamp(lag(ko, i, nO, 0.5)));
      const glow = pic.hl === i ? kh : 0;
      const cl: Paint = glow > 0.5 ? 'link' : 'first';
      const path: [number, number][] = [[sqX + sq, midY], [ex, midY], [ex, optY[i]!], [cx - r, optY[i]!]];
      stroke(c, path, DUSK.cream, 4, k, pic.hl !== undefined && kh > 0 && pic.hl !== i ? 1 - 0.55 * kh : 1);
      if (glow > 0) stroke(c, path, 'link', 9, 1, glow * 0.75);
      drawWords(c, o.label, ex + 16, optY[i]! - 34, cl, clamp(k * 1.4 - 0.4), { size: LAB, align: 'left', weight: 700 });
      if (k > 0.6) {
        const { g } = c, rr = r * E.back(clamp((k - 0.6) / 0.4));
        g.save(); g.fillStyle = col('second'); g.strokeStyle = DUSK.ink; g.lineWidth = 3;
        g.beginPath(); g.arc(cx, optY[i]!, rr, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore();
      }
      o.outs.forEach((u, j) => {
        const kj = E.inOut(clamp(lag(kf, i * 3 + j, nO * 3, 0.5)));
        const ly = leafY[i]![j]!;
        stroke(c, [[cx + r, optY[i]!], [lx, ly]], DUSK.cream, 3, kj);
        drawWords(c, u.label, tx, ly - 28, 'dim', clamp(kj * 1.4 - 0.4), { size: LAB, align: 'left', weight: 650 });
        const [px, py] = pAt(i, j);
        cell(c, u.p, pic.reveal?.p?.[i]?.[j], px, py, 'second', clamp(lag(kp, i * 3 + j, nO * 3, 0.5) * 1.3), rvk, 'center');
        cell(c, u.v, pic.reveal?.v?.[i]?.[j], tx, ly + 30, glow > 0.5 ? 'link' : 'ink', clamp(lag(kv, i * 3 + j, nO * 3, 0.5) * 1.3), rvk, 'left');
      });
      if (pic.ev) cell(c, pic.ev[i] ?? null, pic.reveal?.ev?.[i], ex + 16, optY[i]! + 44, 'link', clamp(lag(ke, i, nO, 0.5) * 1.3), rvk, 'left');
    });
  }
  function where(key: string): Box {
    if (key === 'card') return box(x0, y0, x1, y1);
    if (key === 'sq') return box(sqX, midY - sq / 2, sqX + sq, midY + sq / 2);
    const b = boxes.get(key);
    check(b, NAME, `no box for "${key}"`);
    return b!;
  }
  return { kind: 'DecTree', pic, box: box(x0, y0, x1, y1), steps, where, draw };
}
