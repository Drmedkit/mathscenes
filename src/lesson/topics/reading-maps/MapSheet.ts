// MapSheet: the model of "Read a map". A calm painted map sheet on the dusk wall: the map itself (land, a lake and
// a forest as washes, roads as crisp lines because they get measured, place symbols with their location point), the
// map key in a column on the right, and the scale bar (or a verbal scale) in the strip at the bottom.
// On top of it, overlays that a lesson step or a practice item switches on by id: a highlighted route, the straight
// line "as the crow flies", copies of the scale bar laid along a path (the bar used as a measuring unit), a ruler,
// value labels beside a segment, rings, braces, a paper strip on a big bar. The map can be enlarged (zoom) to show
// that a bigger picture does not move the real places.
//
// Steps: paper, land, roads, places, key, bar.  Colours: amber = map lengths (inches, cm), teal = real distances
// (miles, km), lime = the answer, lavender = the path being measured, red = wrong.
// Layout lives in mapMaths.ts (pure, tested): the block refuses a map whose labels sit on lines or leave the sheet.
import { type Box, box, clamp, lerp, padBox, unionBox } from '../../../core/math';
import { type Canvas, drawOn, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { bracePts, rectPts } from '../../../core/pts';
import { check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { SANS, drawWords } from '../../words';
import {
  type BarGeom, FIELD, KEY, KEY_NAME, type KeyKind, LABEL, type MapLayout, type MapPic, NUM, type Overlay, PAPER, type Place,
  type Pt, ROAD_W, RULER_W, STRIP, U, SYMBOL_R, type Target, along, barGeom, fx, layoutMap, polyLen, rulerPoly, slice, symbolBox, textBox, textW, toPx,
} from './mapMaths';

export type MapStep = 'paper' | 'land' | 'roads' | 'places' | 'key' | 'bar';
export const MAP_STEPS: readonly MapStep[] = ['paper', 'land', 'roads', 'places', 'key', 'bar'];
export interface MapFocus {
  /** 0..1 toward spec.zoom.to */
  zoom?: number;
  /** pulses (0..1) on place symbols by id: their location point glows */
  point?: Record<string, number>;
  /** fade the bar numbers except mark 0 and the listed marks (0..1) */
  dimBar?: number;
}
export interface MapBlock {
  readonly kind: 'MapSheet';
  readonly spec: MapPic;
  readonly layout: MapLayout;
  readonly where: { place(id: string): Box; key(k: KeyKind): Box; mark(i: number): Box; span(i0: number, i1: number): Box; ov(id: string): Box; bar: Box | null };
  draw(c: Canvas, P: Progress<MapStep>, k: (id: string) => number, f?: MapFocus): void;
}

const PAPER_COL: `#${string}` = '#2A2F5C', LAND = '#2C3A62', WATER: `#${string}` = '#3A6C9C', WOOD: `#${string}` = '#2F5A4C', NEAT = '#4C5290';
const ROAD_FILL: Record<'highway' | 'road' | 'trail', `#${string}`> = { highway: '#DCCDB2', road: '#A9A3C6', trail: '#CDB689' };
const SYMBOL_FILL: Record<Place['kind'], `#${string}`> = { city: '#EFE6F7', town: '#EFE6F7', camp: '#E39A6B', school: '#E6D08F', tower: '#93CBE6' };
const KEY_Y0 = KEY.y0 + 130, KEY_DY = 90;

export function MapSheet(m: MapPic, th: Theme): MapBlock {
  const layout = layoutMap(m);
  check(layout.problems.length === 0, 'MapSheet', layout.problems.join('; '));
  const keyAt = (i: number) => KEY_Y0 + i * KEY_DY;
  const keyBox = (kind: KeyKind): Box => {
    const i = Math.max(0, m.key.indexOf(kind)), y = keyAt(i);
    return box(KEY.x0 + 16, y - 30, KEY.x0 + 100 + textW(KEY_NAME[kind], LABEL), y + 30);
  };
  const g0 = barGeom(m);
  const markBox = (G: BarGeom, i: number): Box => {
    const mk = G.marks.find(q => q.i === i) ?? G.marks[0]!;
    return unionBox([box(mk.x - 8, G.top - 12, mk.x + 8, G.top + G.h + 6), ...(mk.box ? [mk.box] : [])]);
  };
  const spanBox = (G: BarGeom, i0: number, i1: number): Box => box(G.x0 + i0 * G.ipx, G.top, G.x0 + i1 * G.ipx, G.top + G.h);
  const ovIndex = (id: string) => m.ov.findIndex(o => o.id === id);

  // ---------- painters ----------
  function ring(c: Canvas, R: Box, col: Paint, k: number, r = 16): void {
    if (k <= 0 || R.w <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 14 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - 10, R.y0 - 10, R.w + 20, R.h + 20, r); g.stroke();
    g.restore();
  }
  function symbol(c: Canvas, kind: Place['kind'], x: number, y: number, a: number, seed: number): void {
    if (a <= 0) return;
    const r = SYMBOL_R[kind], fill = SYMBOL_FILL[kind];
    withAlpha(c, a, () => {
      const { g } = c;
      if (kind === 'town' || kind === 'city') {
        g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = DUSK.ink; g.lineWidth = 3.5; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
        if (kind === 'city') { g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r - 7, 0, Math.PI * 2); g.stroke(); }
      } else if (kind === 'camp') {
        const P: Pt[] = [[x, y - r], [x + r * 1.05, y + r * 0.75], [x - r * 1.05, y + r * 0.75]];
        wash(c, P, fill, { seed, inkW: 3, rough: 0.6, shade: 0.25 });
        inkLine(c, [[x, y - r * 0.2], [x, y + r * 0.72]], { col: DUSK.ink, w: 2.5, seed: seed + 1, rough: 0.3 });
      } else if (kind === 'school') {
        wash(c, rectPts(x - r, y - r, 2 * r, 2 * r, 3), fill, { seed, inkW: 3, rough: 0.5, shade: 0.2 });
      } else {
        const P: Pt[] = [[x - r * 0.7, y + r], [x + r * 0.7, y + r], [x + r * 0.32, y - r], [x - r * 0.32, y - r]];
        wash(c, P, fill, { seed, inkW: 3, rough: 0.5, shade: 0.25 });
      }
      // the location point: where every distance is measured from
      if (kind !== 'city') { g.fillStyle = DUSK.ink; g.beginPath(); g.arc(x, y + (kind === 'camp' ? 2 : 0), 3.2, 0, Math.PI * 2); g.fill(); }
      else { g.fillStyle = DUSK.ink; g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); }
    });
  }
  function roadLine(c: Canvas, P: readonly Pt[], kind: 'highway' | 'road' | 'trail', k: number): void {
    if (k <= 0) return;
    if (kind === 'trail') { drawOn(c, P, k, { col: ROAD_FILL.trail, lw: ROAD_W.trail, dash: [16, 11], cap: 'butt' }); return; }
    drawOn(c, P, k, { col: '#1A1430', lw: ROAD_W[kind] + 6, alpha: 0.75 });
    drawOn(c, P, k, { col: ROAD_FILL[kind], lw: ROAD_W[kind] });
    if (kind === 'highway') drawOn(c, P, k, { col: '#B79F78', lw: 2, dash: [18, 16], cap: 'butt' });
  }
  function keySymbol(c: Canvas, kind: KeyKind, x: number, y: number, a: number): void {
    if (kind === 'highway' || kind === 'road' || kind === 'trail') withAlpha(c, a, () => roadLine(c, [[x - 32, y], [x + 32, y]], kind, 1));
    else if (kind === 'lake' || kind === 'forest') wash(c, rectPts(x - 30, y - 20, 60, 40, 10), kind === 'lake' ? WATER : WOOD, { seed: kind === 'lake' ? 31 : 33, inkW: 2.5, rough: 1.2, alpha: a });
    else symbol(c, kind, x, y, a, 70 + KEY_NAME[kind].length);
  }
  function drawBar(c: Canvas, G: BarGeom, sub: number, leftSub: number, a: number, dimBar: number, labelsCol: Paint): void {
    if (a <= 0) return;
    withAlpha(c, a, () => {
      const { g } = c;
      // the left divided section
      if (leftSub) for (let j = 0; j < leftSub; j++) {
        const w = G.ipx / leftSub, x = G.left + j * w;
        g.fillStyle = (leftSub - j) % 2 ? '#E9E1EE' : '#2B2F55'; g.fillRect(x, G.top, w, G.h);
      }
      const n = Math.round((G.right - G.x0) / G.ipx);
      for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? '#2B2F55' : '#E9E1EE'; g.fillRect(G.x0 + i * G.ipx, G.top, G.ipx, G.h); }
      g.strokeStyle = DUSK.ink; g.lineWidth = 3; g.strokeRect(G.left, G.top, G.right - G.left, G.h);
      // subdivision ticks (inside each interval) and the marks (above the bar)
      if (sub > 1) for (let i = 0; i < n; i++) for (let j = 1; j < sub; j++) {
        const x = G.x0 + (i + j / sub) * G.ipx;
        g.strokeStyle = 'rgba(34,27,46,0.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, G.top); g.lineTo(x, G.top + G.h * 0.55); g.stroke();
        g.strokeStyle = 'rgba(239,230,247,0.85)'; g.beginPath(); g.moveTo(x, G.top + G.h * 0.55); g.lineTo(x, G.top + G.h); g.stroke();
      }
      for (const mk of G.marks) {
        g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 3; g.beginPath(); g.moveTo(mk.x, G.top - 12); g.lineTo(mk.x, G.top); g.stroke();
        if (mk.text && mk.box) {
          const dimmed = dimBar > 0 && mk.i !== 0 ? 1 - 0.75 * dimBar : 1;
          drawWords(c, mk.text, mk.box.cx, G.labelY, labelsCol, dimmed, { size: NUM, align: 'center' });
        }
      }
      drawWords(c, G.unit.text, G.unit.box.x0, G.labelY, 'dim', 1, { size: LABEL });
    });
  }
  function drawRuler(c: Canvas, o: Extract<Overlay, { k: 'ruler' }>, i: number, k: number, z: number, km: number): void {
    if (k <= 0) return;
    const side = layout.rulerSide[i] ?? 1, R = rulerPoly(m, { ...o, side }), u = U(m);
    void z;
    const slide = (1 - E.out(clamp(k))) * 40;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k * 1.4);
    g.translate(R.n[0] * slide, R.n[1] * slide);
    wash(c, R.P, '#E7DCBE', { seed: 91 + i, inkW: 2.5, rough: 0.4, shade: 0.12, alpha: 0.93 });
    const A = R.at(0);
    g.translate(A[0], A[1]); g.rotate(R.ang);
    const sgn = (R.n[0] * -Math.sin(R.ang) + R.n[1] * Math.cos(R.ang)) >= 0 ? 1 : -1;   // local +y toward the body?
    const sub = o.sub ?? (m.unit === 'in' ? 4 : 10);
    g.strokeStyle = '#2A2238'; g.lineCap = 'butt';
    for (let t = 0; t <= o.len * sub + 1e-9; t++) {
      const r = t / sub, x = r * u, whole = t % sub === 0, half = !whole && (2 * t) % sub === 0;
      const L = whole ? 34 : half ? 25 : m.unit === 'in' ? 16 : 11;
      g.lineWidth = whole ? 3 : 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, sgn * L); g.stroke();
      if (whole) {
        g.save(); g.translate(x, sgn * 64);
        if (Math.cos(R.ang) < -0.2) g.rotate(Math.PI);
        g.font = `700 ${NUM}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2A2238';
        g.fillText(String(Math.round(r)), 0, 0); g.restore();
      }
    }
    if (o.mark !== undefined && km > 0) {
      const ka = clamp(km), x = o.mark * u;
      if (ka > 0) {
        g.save(); g.globalAlpha *= ka; g.strokeStyle = paint(th, 'link', 'fill'); g.lineWidth = 5;
        g.shadowColor = paint(th, 'link', 'fill'); g.shadowBlur = 12;
        g.beginPath(); g.moveTo(x, -16 * sgn); g.lineTo(x, sgn * 40); g.stroke(); g.restore();
      }
    }
    g.restore();
  }
  function drawCopies(c: Canvas, o: Extract<Overlay, { k: 'copies' }>, k: number, z: number): void {
    if (k <= 0) return;
    const P = o.pts, L = polyLen(P), nC = Math.ceil(L / o.len - 1e-9), shown = k * nC;
    const px = (Q: Pt[]) => Q.map(q => toPx(m, q, z));
    for (let j = 0; j < nC; j++) {
      const a = clamp(shown - j);
      if (a <= 0) break;
      const s0 = j * o.len, s1 = Math.min(L, (j + 1) * o.len);
      const Q = px(slice(P, s0, s0 + (s1 - s0) * E.out(a)));
      strokePts(c, Q, { col: j % 2 ? '#E9E1EE' : paint(th, 'second', 'fill'), lw: 18, cap: 'butt', alpha: 0.88 });
    }
    // joints (the copies' ends) and the subdivision ticks
    const tick = (s: number, half: number, w: number, a: number) => {
      const { p, d } = along(P, s), q = toPx(m, p, z), n: Pt = [-d[1], d[0]];
      strokePts(c, [[q[0] - n[0] * half, q[1] - n[1] * half], [q[0] + n[0] * half, q[1] + n[1] * half]], { col: DUSK.ink, lw: w, alpha: a, cap: 'butt' });
    };
    for (let j = 0; j <= nC; j++) {
      const s = Math.min(L, j * o.len), a = clamp(shown - j + 1);
      if (a > 0) tick(s, 20, 4, a);
      if (o.sub && j < nC) for (let t = 1; t < o.sub; t++) { const ss = j * o.len + (t * o.len) / o.sub; if (ss < L - 1e-9 && clamp(shown - j) > 0) tick(ss, 10, 2.5, clamp(shown - j)); }
    }
  }
  function targetBox(t: Target, z: number): Box {
    if ('place' in t) { const p = m.places.find(q => q.id === t.place)!; return padBox(symbolBox(m, p, z), 4); }
    if ('key' in t) return keyBox(t.key);
    if ('mark' in t) return g0 ? markBox(geomZ(z)!, t.mark) : box(0, 0, 0, 0);
    if ('span' in t) return g0 ? spanBox(geomZ(z)!, t.span[0], t.span[1]) : box(0, 0, 0, 0);
    if ('seg' in t) { const a = toPx(m, t.seg[0], z), b = toPx(m, t.seg[1], z); return box(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])); }
    const [x, y] = toPx(m, t.pt, z); return box(x - t.r, y - t.r, x + t.r, y + t.r);
  }
  const geomZ = (z: number): BarGeom | null => (z === 1 || !m.bar || m.bar.big ? g0 : barGeom({ ...m, bar: { ...m.bar, len: m.bar.len * z } }));

  function draw(c: Canvas, P: Progress<MapStep>, k: (id: string) => number, f: MapFocus = {}): void {
    const kP = P.k('paper');
    if (kP <= 0) return;
    const { g } = c;
    const z = m.zoom ? lerp(1, m.zoom.to, E.inOut(clamp(f.zoom ?? 0))) : 1;
    const X = (p: Pt) => toPx(m, p, z);
    // paper, neatlines
    withAlpha(c, kP, () => {
      wash(c, rectPts(PAPER.x0, PAPER.y0, PAPER.w, PAPER.h, 14), PAPER_COL, { seed: 5, rough: 1.4, inkW: 3, shade: 0.12 });
      g.fillStyle = LAND; g.fillRect(FIELD.x0, FIELD.y0, FIELD.w, FIELD.h);
      g.strokeStyle = NEAT; g.lineWidth = 2.5;
      g.strokeRect(FIELD.x0, FIELD.y0, FIELD.w, FIELD.h);
      if (m.key.length) g.strokeRect(KEY.x0, KEY.y0, KEY.w, KEY.h);
      if ((m.bar && !m.bar.big) || m.verbal) g.strokeRect(STRIP.x0, STRIP.y0, STRIP.w, STRIP.h);
    });
    // the map content, clipped to the field
    g.save(); g.beginPath(); g.rect(FIELD.x0, FIELD.y0, FIELD.w, FIELD.h); g.clip();
    const kL = P.k('land');
    for (const [i, a] of m.areas.entries()) {
      const pts = a.pts.map(X);
      wash(c, pts, a.kind === 'lake' ? WATER : WOOD, { seed: 20 + i, rough: 2, inkW: 2.5, shade: 0.2, alpha: kL });
      if (a.kind === 'forest' && kL > 0) {
        // a few soft tree dots, seeded
        const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
        for (let t = 0; t < 26; t++) {
          const x = lerp(Math.min(...xs) + 14, Math.max(...xs) - 14, (Math.sin(t * 12.9898 + i) * 43758.5453) % 1 * 0.5 + 0.5);
          const y = lerp(Math.min(...ys) + 14, Math.max(...ys) - 14, (Math.sin(t * 78.233 + i) * 12345.678) % 1 * 0.5 + 0.5);
          if (!inPolyPx([x, y], pts)) continue;
          g.save(); g.globalAlpha *= kL * 0.55; g.fillStyle = '#244537'; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); g.restore();
        }
      }
    }
    const kR = P.k('roads');
    for (const r of m.roads) roadLine(c, r.pts.map(X), r.kind, kR);
    // overlays under the symbols: route, straight line, copies
    m.ov.forEach(o => {
      const kk = k(o.id);
      if (kk <= 0) return;
      if (o.k === 'route') {
        const Q = o.pts.map(X);
        drawOn(c, Q, E.inOut(clamp(kk)), { col: o.col ?? 'pick', lw: 9, alpha: 0.75, glow: 10 });
      }
      if (o.k === 'straight') drawOn(c, [X(o.a), X(o.b)], E.inOut(clamp(kk)), { col: o.col ?? 'pick', lw: 5, dash: [16, 12], cap: 'butt', glow: 6 });
      if (o.k === 'copies') drawCopies(c, o, kk, z);
    });
    const kPl = P.k('places');
    m.places.forEach((p, i) => { const [x, y] = X(p.at); symbol(c, p.kind, x, y, kPl, 50 + i); });
    // rulers lie on top of the paper, the measured points stay visible on top
    m.ov.forEach((o, i) => { if (o.k === 'ruler') drawRuler(c, o, i, k(o.id), z, o.markId ? k(o.markId) : 0); });
    m.places.forEach(p => {
      const pk = f.point?.[p.id] ?? 0, [x, y] = X(p.at);
      if (pk > 0) { g.save(); g.globalAlpha *= clamp(pk); g.fillStyle = paint(th, 'link', 'fill'); g.shadowColor = paint(th, 'link', 'fill'); g.shadowBlur = 16; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); g.restore(); }
      if (m.ov.some(o => o.k === 'ruler' && k(o.id) > 0)) { g.save(); g.globalAlpha *= kPl; g.fillStyle = DUSK.ink; g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); g.restore(); }
    });
    // place names
    m.places.forEach(p => {
      const b = layout.placeLabel[p.id]!, [x, y] = X(p.at), [x1, y1] = toPx(m, p.at);
      drawWords(c, p.name, b.cx + x - x1, b.cy + y - y1, 'ink', kPl, { size: LABEL, align: 'center' });
    });
    // value labels, braces, paper strips, rings
    m.ov.forEach((o, i) => {
      const kk = k(o.id);
      if (kk <= 0) return;
      if (o.k === 'leg' || o.k === 'tag') { const b = layout.ovLabel[i]!; drawWords(c, o.text, b.cx, b.cy, o.col, kk, { size: NUM, align: 'center' }); }
      if (o.k === 'brace') {
        const A = X(o.a), B = X(o.b), s = layout.ovSide[i] ?? 1, len = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
        const n: Pt = [(-(B[1] - A[1]) / len) * s, ((B[0] - A[0]) / len) * s];
        const a2: Pt = [A[0] + n[0] * 12, A[1] + n[1] * 12], b2: Pt = [B[0] + n[0] * 12, B[1] + n[1] * 12];
        // bracePts bulges to the left of a -> b; flip the ends so it bulges away from the segment
        const BP = s > 0 ? bracePts(b2, a2, 18) : bracePts(a2, b2, 18);
        drawOn(c, BP, E.inOut(clamp(kk)), { col: o.col, lw: 3.5 });
        const b = layout.ovLabel[i]!; drawWords(c, o.text, b.cx, b.cy, o.col, clamp((kk - 0.4) / 0.6), { size: NUM, align: 'center' });
      }
      if (o.k === 'ring') ring(c, targetBox(o.t, z), o.col, kk);
    });
    g.restore();
    // the key
    const kK = P.k('key');
    if (kK > 0 && m.key.length) {
      drawWords(c, 'Map key', KEY.x0 + 22, KEY.y0 + 50, 'dim', kK, { size: LABEL });
      m.key.forEach((kind, i) => {
        const y = keyAt(i), a = clamp(kK * m.key.length - i);
        keySymbol(c, kind, KEY.x0 + 52, y, a);
        drawWords(c, KEY_NAME[kind], KEY.x0 + 100, y, 'ink', a, { size: LABEL });
      });
    }
    // the scale: a bar, or a verbal scale
    const kB = P.k('bar');
    const G = geomZ(z);
    if (G && m.bar) {
      if (m.bar.big) { g.save(); g.beginPath(); g.rect(FIELD.x0, FIELD.y0, FIELD.w, FIELD.h); g.clip(); }
      drawBar(c, G, m.bar.sub ?? 0, m.bar.leftSub ?? 0, kB, f.dimBar ?? 0, 'second');
      if (G.second) drawBar(c, G.second, 0, 0, kB, 0, 'dim');
      if (m.bar.big) g.restore();
    } else if (m.verbal && kB > 0) {
      const v = m.verbal, U1 = m.unit === 'in' ? '1 inch' : '1 centimeter', R1 = `${fx(v.per)} ${v.real === 'mi' ? (v.per === 1 ? 'mile' : 'miles') : (v.per === 1 ? 'kilometer' : 'kilometers')}`;
      const y = STRIP.cy, x0 = STRIP.x0 + 50, w1 = textW(U1 + ' ', NUM), w2 = textW('represents ', NUM);
      drawWords(c, U1, x0, y, 'first', kB, { size: NUM });
      drawWords(c, 'represents', x0 + w1, y, 'dim', kB, { size: NUM });
      drawWords(c, R1, x0 + w1 + w2, y, 'second', kB, { size: NUM });
    }
    // paper strips and rings on the bar (outside the field clip for the small bar)
    m.ov.forEach(o => {
      const kk = k(o.id);
      if (kk <= 0 || !G) return;
      if (o.k === 'strip') {
        const x0 = G.x0 + o.from * G.ipx, x1 = G.x0 + o.to * G.ipx, y0 = G.top + G.h + 22;
        const xr = lerp(x0, x1, E.out(clamp(kk)));
        wash(c, rectPts(x0, y0, xr - x0, 34, 3), paint(th, 'first', 'fill'), { seed: 61, inkW: 2.5, rough: 0.5, shade: 0.15 });
        strokePts(c, [[x0, y0 - 10], [x0, y0 + 44]], { col: DUSK.ink, lw: 4, cap: 'butt' });
        if (kk >= 1) strokePts(c, [[x1, y0 - 10], [x1, y0 + 44]], { col: DUSK.ink, lw: 4, cap: 'butt' });
      }
    });
  }
  function inPolyPx(p: Pt, P: readonly Pt[]): boolean {
    let c = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const a = P[i]!, b = P[j]!;
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  return {
    kind: 'MapSheet', spec: m, layout,
    where: {
      place: id => { const p = m.places.find(q => q.id === id); return p ? symbolBox(m, p) : box(0, 0, 0, 0); },
      key: keyBox,
      mark: i => (g0 ? markBox(g0, i) : box(0, 0, 0, 0)),
      span: (i0, i1) => (g0 ? spanBox(g0, i0, i1) : box(0, 0, 0, 0)),
      ov: id => { const i = ovIndex(id); return layout.ovLabel[i] ?? textBox('', 0, 0, NUM); },
      bar: g0 ? g0.body : null,
    },
    draw,
  };
}
