// Disc: the circle model (layout and maths in circleMaths.ts). One block, five pictures:
//   disc     a round object (pizza, rug, pool, lid, garden, table, plain) with segments (radius, diameter, chord,
//            a stub that stops inside, an off-center segment), their labels, the circumference traced in teal and
//            the area lit in amber
//   wedges   the object on top, cut into n equal wedges that slide down into a near-rectangle (half of the crust on
//            top, half at the bottom, height r); its top, its height and r-by-r squares can be lit
//   grid     a circle of radius 3, 4 or 5 on grid paper with the outer square (2r by 2r) and the inner square
//            (corners on the circle, cut by its diagonals)
//   pair     two circles drawn to scale (an original and a scaled copy, or a big pizza and smaller ones), with the
//            k-by-k "quad" of small circles inside the big one's square
//   unroll   a circle rolls one turn along a line: the line it lays down is the circumference, and three diameters
//            fit along it with a bit to spare (pi)
// Colour roles: the area = first (amber), the circumference = second (teal), r and d = ink, the answer = link.
// Steps are free keys read through Progress (see the header of each painter); `where` gives boxes for leaders.
import { type Box, type Pt, box, clamp, lag, lerp } from '../../../core/math';
import { type Canvas, dot, drawOn, fillPts, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Hex, type Role, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw } from '../../../core/tex';
import type { Frame } from '../../../blocks/block';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type Label, type Lay, type Look, type Pic, PI, RIM, layoutPic, piecePts } from './circleMaths';

export interface DiscFocus {
  /** a ring that pulses round a label while its symbol writes on the board */
  pulse?: readonly { key: string; k: number; col?: Role }[];
  /** a segment lit as the answer (lime halo under it) */
  hl?: readonly { seg: number; k: number; col?: Role }[];
}
export interface DiscBlock {
  readonly kind: 'Disc';
  readonly pic: Pic;
  readonly lay: Lay;
  readonly where: { label(key: string): Box; seg(i: number): Box; disc: Box; top: Box; height: Box; strip: Box };
  draw(c: Canvas, P: Progress<string>, f?: DiscFocus): void;
}

interface LookDef { fill: Hex; rim: Hex | null; rimW: number }
const LOOKS: Record<Look, LookDef> = {
  plain: { fill: '#CBC2DA', rim: null, rimW: RIM.plain },
  pizza: { fill: '#F4BF55', rim: '#B8783F', rimW: RIM.pizza },
  rug: { fill: '#D98E5B', rim: '#2F7F7C', rimW: RIM.rug },
  pool: { fill: '#5DB2D8', rim: '#D8D0C0', rimW: RIM.pool },
  garden: { fill: '#8CB866', rim: '#A39A8B', rimW: RIM.garden },
  lid: { fill: '#C3C9D6', rim: '#8D94A8', rimW: RIM.lid },
  table: { fill: '#C08A5C', rim: '#8A5735', rimW: RIM.table },
};
const DARK: Hex = '#17142B', SEG_W = 5;

export function Disc(pic: Pic, fr: Frame, th: Theme): DiscBlock {
  const lay = layoutPic(pic, fr);
  if (lay.why) throw new Error(`Disc: ${lay.why}`);
  const L = LOOKS['look' in pic ? pic.look : 'plain'];
  const F = new Map<string, Formula>();
  const fm = (s: string) => { let f = F.get(s); if (!f) { f = tex(s) as Formula; F.set(s, f); } return f; };
  const labelOf = (key: string): Label | undefined => lay.labels.find(l => l.key === key);

  // ---------- painters ----------
  function circ(cx: number, cy: number, R: number, n = 96): Pt[] { return Array.from({ length: n }, (_, i) => [cx + R * Math.cos((2 * PI * i) / n), cy + R * Math.sin((2 * PI * i) / n)] as Pt); }
  function object(c: Canvas, cx: number, cy: number, R: number, a: number, seed: number, look = L): void {
    withAlpha(c, a, () => {
      if (look.rim) wash(c, circ(cx, cy, R), look.rim, { seed, rough: 1.4, inkW: 3, shade: 0.25 });
      wash(c, circ(cx, cy, R * (1 - look.rimW)), look.fill, { seed: seed + 3, rough: 1.2, ink: look.rim ? null : DUSK.ink, inkW: 3, shade: 0.2 });
    });
  }
  function label(c: Canvas, lb: Label | undefined, a: number, col?: Role | string, dx = 0, dy = 0): void {
    if (!lb || a <= 0) return;
    const colour = col ?? (lb.inside ? DARK : 'ink');
    texDraw(c, fm(lb.tex), lb.x + dx, lb.y + dy, { size: lb.size, align: 'center', col: colour as never, k: clamp(a * 1.4), alpha: clamp(a) });
  }
  function ringBox(c: Canvas, B: Box, col: Role, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 14 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.stroke();
    g.restore();
  }
  function seg(c: Canvas, p0: Pt, p1: Pt, k: number, inside: boolean, hl = 0, hlCol: Role = 'link'): void {
    if (k <= 0) return;
    const P = [p0, [lerp(p0[0], p1[0], E.inOut(clamp(k))), lerp(p0[1], p1[1], E.inOut(clamp(k)))] as Pt];
    if (hl > 0) strokePts(c, P, { col: hlCol, lw: 18, alpha: 0.55 * clamp(hl), glow: 12 });
    strokePts(c, P, { col: (inside ? DARK : 'ink'), lw: SEG_W + 2 * clamp(hl) });
    dot(c, p0[0], p0[1], 7, (inside ? DARK : 'ink'), clamp(k * 3));
    if (k >= 0.98) dot(c, p1[0], p1[1], 7, (inside ? DARK : 'ink'));
  }
  /** the circumference lit: a teal line drawn on round the rim, from the top, clockwise */
  function trace(c: Canvas, cx: number, cy: number, R: number, k: number, a0 = -PI / 2): void {
    if (k <= 0) return;
    const P = Array.from({ length: 145 }, (_, i) => [cx + R * Math.cos(a0 + (2 * PI * i) / 144), cy + R * Math.sin(a0 + (2 * PI * i) / 144)] as Pt);
    drawOn(c, P, clamp(k), { col: 'second', lw: 9, glow: 12 });
  }
  /** the area lit: an amber glaze over the whole region */
  function glaze(c: Canvas, P: readonly Pt[], k: number): void {
    if (k <= 0) return;
    fillPts(c, P, 'first', 0.62 * clamp(k));
    strokePts(c, P, { col: 'first', lw: 5, alpha: clamp(k), closed: true, glow: 10 });
  }

  // ---------- disc ----------
  function drawDisc(c: Canvas, P: Progress<string>, f: DiscFocus): void {
    if (pic.kind !== 'disc') return;
    const D = lay.disc!, kIn = P.k('in');
    if (kIn <= 0) return;
    object(c, D.cx, D.cy, D.R, kIn, 21);
    glaze(c, circ(D.cx, D.cy, D.R - 2), P.k('A'));
    pic.segs.forEach((s, i) => {
      const g = D.segs[i]!, k = s.hidden ? P.k(`seg${i}`) : Math.max(P.k(`seg${i}`), P.k('segs'));
      const h = f.hl?.find(x => x.seg === i);
      seg(c, g.p0, g.p1, k * kIn, true, h?.k ?? 0, h?.col);
    });
    dot(c, D.cx, D.cy, 8, DARK, kIn);
    trace(c, D.cx, D.cy, D.R, P.k('C'));
    pic.segs.forEach((s, i) => {
      const g = D.segs[i]!, kl = (s.hidden ? P.k(`seg${i}L`) : Math.max(P.k(`seg${i}L`), P.k('labels'))) * kIn, ka = P.k(`seg${i}A`);
      label(c, g.label, kl * (1 - ka));
      label(c, g.ans, ka, g.ans?.inside ? DARK : 'link');
    });
    label(c, labelOf('ctag'), Math.max(P.k('CL'), P.k('labels')) * kIn, 'second');
    label(c, labelOf('atag'), Math.max(P.k('AL'), P.k('labels')) * kIn);
    pulses(c, f);
  }
  function pulses(c: Canvas, f: DiscFocus): void {
    for (const p of f.pulse ?? []) { const lb = labelOf(p.key); if (lb) ringBox(c, lb.box, p.col ?? 'pick', p.k); }
  }

  // ---------- grid ----------
  function drawGrid(c: Canvas, P: Progress<string>, f: DiscFocus): void {
    if (pic.kind !== 'grid') return;
    const G = lay.grid!, s = G.s, R = G.r * s;
    const kg = P.k('grid');
    if (kg > 0) withAlpha(c, kg, () => {
      const { g } = c;
      g.save(); g.fillStyle = '#1B1F42'; g.fillRect(G.x0, G.y0, G.cols * s, G.cols * s); g.restore();
      for (let i = 0; i <= G.cols; i++) {
        strokePts(c, [[G.x0 + i * s, G.y0], [G.x0 + i * s, G.y0 + G.cols * s]], { col: 'faint', lw: 1.6, alpha: 0.7 });
        strokePts(c, [[G.x0, G.y0 + i * s], [G.x0 + G.cols * s, G.y0 + i * s]], { col: 'faint', lw: 1.6, alpha: 0.7 });
      }
    });
    const kd = P.k('disc');
    if (kd > 0) {
      fillPts(c, circ(G.cx, G.cy, R), 'first', 0.38 * kd);
      strokePts(c, circ(G.cx, G.cy, R), { col: 'first', lw: 5, closed: true, alpha: kd });
    }
    glaze(c, circ(G.cx, G.cy, R), P.k('A'));
    const ko = P.k('outer');
    if (ko > 0) {
      const sq: Pt[] = [[G.cx - R, G.cy - R], [G.cx + R, G.cy - R], [G.cx + R, G.cy + R], [G.cx - R, G.cy + R], [G.cx - R, G.cy - R]];
      drawOn(c, sq, ko, { col: 'pick', lw: 6, dash: [16, 10] });
    }
    const ki = P.k('inner');
    if (ki > 0) {
      const dm: Pt[] = [[G.cx, G.cy - R], [G.cx + R, G.cy], [G.cx, G.cy + R], [G.cx - R, G.cy], [G.cx, G.cy - R]];
      drawOn(c, dm, ki, { col: 'water', lw: 6 });
      const kd2 = P.k('diag');
      if (kd2 > 0) { drawOn(c, [[G.cx - R, G.cy], [G.cx + R, G.cy]], kd2, { col: 'water', lw: 3 }); drawOn(c, [[G.cx, G.cy - R], [G.cx, G.cy + R]], kd2, { col: 'water', lw: 3 }); }
    }
    const kr = P.k('r');
    if (kr > 0) {
      strokePts(c, [[G.cx, G.cy], [lerp(G.cx, G.cx + R, E.inOut(clamp(kr))), G.cy]], { col: 'ink', lw: 6 });
      dot(c, G.cx, G.cy, 8, 'ink', kr);
      label(c, lay.labels[0], kr, 'ink');
    }
    pulses(c, f);
  }

  // ---------- wedges ----------
  function drawWedges(c: Canvas, P: Progress<string>, f: DiscFocus): void {
    if (pic.kind !== 'wedges') return;
    const D = lay.disc!, S = lay.strip!, R = D.R;
    const kIn = P.k('in'), kCut = P.k('cut'), kMove = P.k('move');
    if (kIn <= 0) return;
    const r0 = R * (1 - L.rimW);
    if (kMove <= 0) {
      object(c, D.cx, D.cy, R, kIn, 31);
      glaze(c, circ(D.cx, D.cy, R - 2), P.k('A'));
      if (kCut > 0) for (let i = 0; i < S.n; i++) {
        const a = PI + (i * 2 * PI) / S.n;
        drawOn(c, [[D.cx, D.cy], [D.cx + R * Math.cos(a), D.cy + R * Math.sin(a)]], E.inOut(lag(kCut, i, S.n, 0.5)), { col: DARK, lw: 3 });
      }
    } else {
      // the ghost of the whole: where the circle was
      strokePts(c, circ(D.cx, D.cy, R, 120).concat([[D.cx + R, D.cy]]), { col: 'faint', lw: 3, dash: [12, 10], alpha: clamp(kMove * 2) });
      S.pieces.forEach((p, i) => {
        const k = E.smooth(lag(kMove, i, S.pieces.length, 0.55));
        const x = lerp(D.cx, p.ax, k), y = lerp(D.cy, p.ay, k), rot = p.rot * k;
        if (L.rim) fillPts(c, piecePts(p, R, x, y, rot), L.rim);
        fillPts(c, piecePts(p, r0, x, y, rot), L.fill);
        strokePts(c, piecePts(p, R, x, y, rot), { col: DARK, lw: 2.4, closed: true });
      });
      const kA = P.k('A');
      if (kA > 0) S.pieces.forEach(p => { const Q = piecePts(p, R, p.ax, p.ay, p.rot); fillPts(c, Q, 'first', 0.3 * kA); strokePts(c, Q, { col: '#FFE7B8', lw: 3, closed: true, alpha: kA, glow: 8, glowCol: 'first' }); });
      // the crust: the arcs on top are half of it, the arcs at the bottom the other half
      const kTop = P.k('top');
      if (kTop > 0) S.pieces.forEach(p => {
        const P0 = piecePts(p, R, p.ax, p.ay, p.rot).slice(1);
        if (p.up) drawOn(c, P0, clamp(kTop), { col: 'second', lw: 8, glow: 10 });
        else strokePts(c, P0, { col: 'second', lw: 5, alpha: 0.35 * clamp(kTop) });
      });
      const kH = P.k('ht');
      if (kH > 0) {
        const x = S.x0 + S.width;
        drawOn(c, [[x, S.yb], [x, S.yb - R]], kH, { col: 'ink', lw: 7, glow: 8 });
      }
      const kS = P.k('sq');
      if (kS > 0) for (let i = 0; i < 3; i++) {
        const a = E.smooth(lag(kS, i, 3, 0.4)), x = S.x0 + i * R;
        const sq: Pt[] = [[x, S.yb - R], [x + R, S.yb - R], [x + R, S.yb], [x, S.yb]];
        fillPts(c, sq, 'link', 0.16 * a);
        strokePts(c, sq, { col: 'link', lw: 4, closed: true, dash: [14, 9], alpha: a });
      }
    }
    // the disc's own marks (before the cut)
    const fade = 1 - clamp(kCut * 1.5);
    if (fade > 0) {
      const kd = P.k('d') * fade, kr = P.k('r') * fade;
      if (kd > 0) seg(c, [D.cx - R, D.cy], [D.cx + R, D.cy], kd, true);
      const ra = (32 * PI) / 180;
      if (kr > 0) seg(c, [D.cx, D.cy], [D.cx + R * Math.cos(ra), D.cy + R * Math.sin(ra)], kr, true);
      trace(c, D.cx, D.cy, R, P.k('C') * fade);
      label(c, labelOf('dtag'), P.k('dL') * fade, 'ink');
      label(c, labelOf('rtag'), P.k('rL') * fade, 'ink');
    }
    label(c, labelOf('toptag'), P.k('topL'), 'second');
    label(c, labelOf('httag'), P.k('htL'), 'ink');
    pulses(c, f);
  }

  // ---------- pair ----------
  function drawPair(c: Canvas, P: Progress<string>, f: DiscFocus): void {
    if (pic.kind !== 'pair') return;
    const Pp = lay.pair!;
    const discs = [...Pp.a.map(d => ({ d, k: P.k('a'), key: 'tag0' })), ...Pp.b.map((d, i) => ({ d, k: P.k('b'), key: `tag1.${i}` }))];
    discs.forEach(({ d, k, key }, i) => {
      if (k <= 0) return;
      object(c, d.cx, d.cy, d.R, k, 41 + i * 7);
      glaze(c, circ(d.cx, d.cy, d.R - 2), P.k('A') * k);
      const p0: Pt = pic.seg === 'radius' ? [d.cx, d.cy] : [d.cx - d.R, d.cy];
      seg(c, p0, [d.cx + d.R, d.cy], P.k('segs') * k, true);
      if (pic.seg === 'radius') dot(c, d.cx, d.cy, 7, DARK, k);
      trace(c, d.cx, d.cy, d.R, P.k('C') * k);
      label(c, labelOf(key), P.k('tags') * k, 'ink');
    });
    const kq = P.k('quad');
    if (kq > 0 && Pp.quad) {
      const big = Pp.a[0]!.R >= Pp.b[0]!.R ? Pp.a[0]! : Pp.b[0]!, k = Math.round(Pp.k), s = (2 * big.R) / k;
      const x0 = big.cx - big.R, y0 = big.cy - big.R;
      strokePts(c, [[x0, y0], [x0 + 2 * big.R, y0], [x0 + 2 * big.R, y0 + 2 * big.R], [x0, y0 + 2 * big.R]], { col: 'pick', lw: 4, closed: true, dash: [14, 9], alpha: clamp(kq * 2) });
      for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
        const a = E.smooth(lag(kq, i * k + j, k * k, 0.5));
        if (a <= 0) continue;
        const cx = x0 + s * (j + 0.5), cy = y0 + s * (i + 0.5);
        strokePts(c, [[x0 + s * j, y0 + s * i], [x0 + s * (j + 1), y0 + s * i], [x0 + s * (j + 1), y0 + s * (i + 1)], [x0 + s * j, y0 + s * (i + 1)]], { col: 'pick', lw: 2.5, closed: true, alpha: 0.7 * a });
        strokePts(c, circ(cx, cy, s / 2 - 3), { col: 'pick', lw: 5, closed: true, alpha: a, glow: 6 });
      }
    }
    pulses(c, f);
  }

  // ---------- unroll ----------
  function drawUnroll(c: Canvas, P: Progress<string>, f: DiscFocus): void {
    if (pic.kind !== 'unroll') return;
    const U = lay.unroll!, kIn = P.k('in');
    if (kIn <= 0) return;
    const kr = E.smooth(clamp(P.k('roll'))), th0 = 2 * PI * kr, cx = U.cx0 + U.len * kr;
    strokePts(c, [[U.cx0 - U.R - 30, U.floor], [U.cx0 + U.len + U.R + 30, U.floor]], { col: 'faint', lw: 3, alpha: kIn });
    // the line the rim lays down
    if (kr > 0) strokePts(c, [[U.cx0, U.floor], [cx, U.floor]], { col: 'second', lw: 9, glow: 10 });
    object(c, cx, U.cy, U.R, kIn, 51);
    // the diameter turns with the disc
    const kd = P.k('d');
    if (kd > 0) {
      const a = th0, dx = U.R * Math.cos(a), dy = U.R * Math.sin(a);
      seg(c, [cx - dx, U.cy - dy], [cx + dx, U.cy + dy], kd, true);
    }
    // the rim still to unroll (world angles from pi/2 + turn to pi/2 + 2pi)
    const kc = Math.max(P.k('C'), kr > 0 ? 1 : 0);
    if (kc > 0 && kr < 1) {
      const a0 = PI / 2 + th0, n = Math.max(2, Math.round(120 * (1 - kr)));
      const Pr = Array.from({ length: n + 1 }, (_, i) => [cx + U.R * Math.cos(a0 + ((2 * PI - th0) * i) / n), U.cy + U.R * Math.sin(a0 + ((2 * PI - th0) * i) / n)] as Pt);
      drawOn(c, Pr, kr > 0 ? 1 : kc, { col: 'second', lw: 9, glow: 10 });
    }
    const dl = labelOf('dtag');
    if (dl) label(c, dl, P.k('dL') * kIn, 'ink', cx - U.cx0);
    // three diameters along the line, and a bit more
    const km = P.k('dm');
    if (km > 0) for (let i = 0; i < 3; i++) {
      const a = E.smooth(lag(km, i, 3, 0.4)), x0 = U.cx0 + 2 * U.R * i, y = U.floor + 36;
      if (a <= 0) continue;
      const col: Role = i % 2 ? 'pick' : 'ink';
      strokePts(c, [[x0 + 4, y], [x0 + 2 * U.R - 4, y]], { col, lw: 6, alpha: a });
      strokePts(c, [[x0 + 4, y - 16], [x0 + 4, y + 16]], { col, lw: 5, alpha: a });
      strokePts(c, [[x0 + 2 * U.R - 4, y - 16], [x0 + 2 * U.R - 4, y + 16]], { col, lw: 5, alpha: a });
      label(c, labelOf(`d${i}`), a, col);
    }
    pulses(c, f);
  }

  const D = lay.disc, S = lay.strip;
  const segBox = (i: number): Box => {
    const g = D?.segs[i];
    if (!g) return box(0, 0, 0, 0);
    return box(Math.min(g.p0[0], g.p1[0]) - 6, Math.min(g.p0[1], g.p1[1]) - 6, Math.max(g.p0[0], g.p1[0]) + 6, Math.max(g.p0[1], g.p1[1]) + 6);
  };
  const where = {
    label: (key: string) => labelOf(key)?.box ?? box(0, 0, 0, 0),
    seg: segBox,
    disc: D ? box(D.cx - D.R, D.cy - D.R, D.cx + D.R, D.cy + D.R) : box(0, 0, 0, 0),
    top: S ? box(S.x0, S.yb - S.R, S.x0 + S.width, S.yb - S.rc + 6) : box(0, 0, 0, 0),
    height: S ? box(S.x0 + S.width - 6, S.yb - S.R, S.x0 + S.width + 6, S.yb) : box(0, 0, 0, 0),
    strip: S ? box(S.x0, S.yb - S.R, S.x0 + S.width, S.yb + S.R - S.rc) : box(0, 0, 0, 0),
  };
  return {
    kind: 'Disc', pic, lay, where,
    draw(c, P, f = {}) {
      if (pic.kind === 'disc') drawDisc(c, P, f);
      else if (pic.kind === 'grid') drawGrid(c, P, f);
      else if (pic.kind === 'wedges') drawWedges(c, P, f);
      else if (pic.kind === 'pair') drawPair(c, P, f);
      else drawUnroll(c, P, f);
    },
  };
}
/** the steps a picture shows at rest (practice: everything that is not part of the worked solution) */
export function restSteps(p: Pic): string[] {
  switch (p.kind) {
    case 'disc': return ['in', 'segs', 'labels'];
    case 'grid': return ['grid', 'disc', 'outer', 'inner', 'diag', 'r'];
    case 'wedges': return ['in', 'cut', 'move', 'topL', 'htL'];
    case 'pair': return ['a', 'b', 'segs', 'tags'];
    case 'unroll': return ['in', 'd', 'dL'];
  }
}
