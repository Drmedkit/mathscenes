// wash.ts: painterly painters for concrete objects (style E: flat washes + one ink line), deterministic and pure.
//   wash(c, P, col, o)   a filled shape as 3 soft watercolour layers with wobbly edges, plus one ink outline
//   inkLine(c, P, o)     a single hand-drawn line (slight wobble, round caps)
// Edge wobble comes from seeded sines (hash), never Math.random, so a frame is a function of its inputs only.
// Washes are for OBJECTS (bars, trays, ribbon). Digits and notation stay crisp TeX on a calm board.
import { type Pt, clamp, hash } from '../core/math';
import { resample } from '../core/pts';
import { type Canvas, pathOf } from '../core/draw';
import { type Paint, mix, paint, rgba } from '../core/theme';
import { DUSK } from './dusk';

/** smooth periodic noise on [0, 1) built from three seeded sines */
function wobble(u: number, seed: number): number {
  let v = 0;
  for (let i = 0; i < 3; i++) {
    const f = [2, 5, 11][i]!, a = [0.55, 0.3, 0.15][i]!;
    v += a * Math.sin(Math.PI * 2 * (u * f + hash(seed, i)));
  }
  return v;
}
/** a closed outline pushed in/out along its normals by `amp` px of smooth noise */
function roughen(P: readonly Pt[], amp: number, seed: number, n?: number): Pt[] {
  let per = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i]!, b = P[(i + 1) % P.length]!; per += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  const m = n ?? Math.max(24, Math.min(240, Math.round(per / 10)));
  const Q = resample(P, m, true);
  return Q.map((p, i) => {
    const a = Q[(i - 1 + m) % m]!, b = Q[(i + 1) % m]!;
    let nx = b[1] - a[1], ny = a[0] - b[0];
    const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const d = amp * wobble(i / m, seed);
    return [p[0] + nx * d, p[1] + ny * d] as Pt;
  });
}

export interface WashOpts {
  seed?: number;
  /** edge wobble in px (default 2.2) */
  rough?: number;
  alpha?: number;
  /** ink outline colour (null = none) and width */
  ink?: Paint | null;
  inkW?: number;
  /** 0..1 lift of the colour toward cream (used for a soft highlight / 'ghost' objects) */
  lift?: number;
  /** a darker bottom-side shade (0 = none, default 0.18) */
  shade?: number;
}

/** a painted shape: base wash + two thin translucent edge layers + a soft inner light + one ink line */
export function wash(c: Canvas, P: readonly Pt[], col: Paint, o: WashOpts = {}): void {
  const { g } = c;
  const a = clamp(o.alpha ?? 1);
  if (a <= 0 || P.length < 3) return;
  const seed = o.seed ?? 1, rough = o.rough ?? 2.2;
  let base = paint(c.th, col, 'fill');
  if (base.startsWith('#') && o.lift) base = mix(base, DUSK.cream, o.lift);
  const hex = base.startsWith('#') ? base : '#888888';
  g.save();
  g.globalAlpha *= a;
  // 1. base layer
  g.fillStyle = hex;
  g.fill(pathOf(roughen(P, rough, seed), true));
  // 2. edge layers: slightly larger, translucent, a touch darker (pigment pools at the edge)
  for (let k = 0; k < 2; k++) {
    g.fillStyle = rgba(mix(hex, DUSK.ink, 0.18 + 0.06 * k), 0.16);
    g.fill(pathOf(roughen(P, rough * 1.8, seed + 17 * (k + 1)), true));
  }
  // 3. a soft light from the top-left and a shade toward the bottom, clipped to the shape
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  g.save();
  g.clip(pathOf(roughen(P, rough, seed), true));
  const lg = g.createLinearGradient(x0, y0, x0 + (x1 - x0) * 0.3, y1);
  lg.addColorStop(0, rgba(mix(hex, '#FFFFFF', 0.45), 0.35));
  lg.addColorStop(0.55, rgba(hex, 0));
  lg.addColorStop(1, rgba(mix(hex, DUSK.ink, 0.6), o.shade ?? 0.18));
  g.fillStyle = lg; g.fillRect(x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 + 20);
  // a few pigment blooms, seeded
  for (let i = 0; i < 3; i++) {
    const bx = x0 + (x1 - x0) * hash(seed, 40 + i), by = y0 + (y1 - y0) * hash(seed, 50 + i);
    const r = Math.max(8, Math.min(x1 - x0, y1 - y0) * (0.25 + 0.3 * hash(seed, 60 + i)));
    const rg = g.createRadialGradient(bx, by, 0, bx, by, r);
    rg.addColorStop(0, rgba(mix(hex, '#FFFFFF', 0.2), 0.12)); rg.addColorStop(1, rgba(hex, 0));
    g.fillStyle = rg; g.fillRect(bx - r, by - r, 2 * r, 2 * r);
  }
  g.restore();
  // 4. one ink line
  if (o.ink !== null) inkLine(c, P, { col: o.ink ?? DUSK.ink, w: o.inkW ?? 3, seed: seed + 5, closed: true });
  g.restore();
}

export interface InkOpts { col?: Paint; w?: number; seed?: number; closed?: boolean; alpha?: number; rough?: number }
/** one hand-drawn line: a single stroke with a slight wobble */
export function inkLine(c: Canvas, P: readonly Pt[], o: InkOpts = {}): void {
  const { g } = c;
  const a = clamp(o.alpha ?? 1);
  if (a <= 0 || P.length < 2) return;
  const closed = o.closed ?? false;
  let Q: Pt[];
  if (closed) Q = roughen(P, o.rough ?? 1.2, o.seed ?? 3);
  else {
    let L = 0;
    for (let i = 1; i < P.length; i++) L += Math.hypot(P[i]![0] - P[i - 1]![0], P[i]![1] - P[i - 1]![1]);
    const m = Math.max(8, Math.round(L / 10));
    const R = resample(P, m, false);
    Q = R.map((p, i) => {
      const s = i / Math.max(1, m - 1), d = (o.rough ?? 1.0) * wobble(s, o.seed ?? 3) * Math.sin(Math.PI * s);
      const q = R[Math.min(m - 1, i + 1)]!, r = R[Math.max(0, i - 1)]!;
      let nx = q[1] - r[1], ny = r[0] - q[0];
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      return [p[0] + nx * d, p[1] + ny * d] as Pt;
    });
  }
  g.save();
  g.globalAlpha *= a;
  g.strokeStyle = paint(c.th, o.col ?? DUSK.ink, 'line');
  g.lineWidth = o.w ?? 3; g.lineJoin = 'round'; g.lineCap = 'round';
  g.stroke(pathOf(Q, closed));
  g.restore();
}

/** the calm dusk board: a deep gradient wall and a painted table band at the bottom (no texture behind maths) */
export function duskRoom(c: Canvas, o: { table?: number } = {}): void {
  const { g, w, h } = c;
  const ty = o.table ?? h;
  const sky = g.createLinearGradient(0, 0, 0, ty);
  sky.addColorStop(0, '#141733'); sky.addColorStop(0.65, '#20244A'); sky.addColorStop(1, '#2E2650');
  g.fillStyle = sky; g.fillRect(0, 0, w, ty);
  // a low warm horizon glow behind the table edge (the dusk light), very soft
  const rg = g.createRadialGradient(w * 0.5, ty, 40, w * 0.5, ty, w * 0.65);
  rg.addColorStop(0, 'rgba(201,126,94,0.20)'); rg.addColorStop(1, 'rgba(201,126,94,0)');
  g.fillStyle = rg; g.fillRect(0, 0, w, ty);
  if (ty < h) {
    wash(c, [[-20, ty], [w + 20, ty], [w + 20, h + 20], [-20, h + 20]], DUSK.wood, { seed: 9, rough: 1.5, ink: null, shade: 0.35 });
    inkLine(c, [[-10, ty], [w + 10, ty]], { col: DUSK.ink, w: 4, seed: 11 });
    // the table's front lip
    g.save(); g.fillStyle = 'rgba(20,14,30,0.35)'; g.fillRect(0, ty + 6, w, 10); g.restore();
  }
}
