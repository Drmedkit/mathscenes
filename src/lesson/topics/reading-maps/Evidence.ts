// Evidence.ts: the real-world evidence a map distance is checked against, painted as objects (a green road sign, a
// trip meter, a note with a known distance), and the half-mile number line that shows how far apart two
// distances are (tolerance items). Pure painters; the number line's maths is in mapMaths.ts (lineGeom).
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, drawOn, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import { type Theme, paint } from '../../../core/theme';
import { bracePts, rectPts } from '../../../core/pts';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { drawWords } from '../../words';
import { LABEL, LINE_BOX, type LinePic, NUM, fx, lineGeom, textW } from './mapMaths';

export interface Evidence { kind: 'sign' | 'meter' | 'note'; title: string; value: string; unit: string }
export const EVIDENCE_H = 230;

/** an evidence object centred at cx, top at y (width up to 540) */
export function drawEvidence(c: Canvas, ev: Evidence, cx: number, y: number, k: number): Box {
  const W = 540, x0 = cx - W / 2;
  if (k <= 0) return box(x0, y, x0 + W, y + EVIDENCE_H);
  withAlpha(c, clamp(k), () => {
    if (ev.kind === 'sign') {
      // a green guide sign on two posts
      inkLine(c, [[cx - 150, y + 170], [cx - 150, y + 226]], { col: '#8E8AA8', w: 10, seed: 3 });
      inkLine(c, [[cx + 150, y + 170], [cx + 150, y + 226]], { col: '#8E8AA8', w: 10, seed: 4 });
      wash(c, rectPts(x0, y, W, 176, 18), '#2E7A57', { seed: 41, inkW: 3, rough: 0.8, shade: 0.2 });
      inkLine(c, rectPts(x0 + 10, y + 10, W - 20, 156, 12), { col: '#EAF4EC', w: 3, closed: true, seed: 42, rough: 0.4 });
      drawWords(c, ev.title, x0 + 34, y + 62, '#F4F8F2', 1, { size: LABEL });
      const vw = textW(ev.value, 72);
      drawWords(c, ev.value, x0 + W - 34 - textW(' ' + ev.unit, LABEL) - vw, y + 122, '#F4F8F2', 1, { size: 72 });
      drawWords(c, ev.unit, x0 + W - 34, y + 128, '#F4F8F2', 1, { size: LABEL, align: 'right' });
    } else if (ev.kind === 'meter') {
      wash(c, rectPts(x0, y + 20, W, 190, 26), '#1B1D33', { seed: 43, inkW: 3, rough: 0.6, shade: 0.3 });
      drawWords(c, ev.title, x0 + 30, y + 66, 'dim', 1, { size: LABEL });
      wash(c, rectPts(x0 + 30, y + 100, W - 60, 92, 10), '#0E1022', { seed: 44, ink: null, rough: 0.3 });
      drawWords(c, ev.value, x0 + W - 150, y + 146, '#FFD27A', 1, { size: 76, align: 'right' });
      drawWords(c, ev.unit, x0 + W - 130, y + 150, '#FFD27A', 1, { size: LABEL });
    } else {
      wash(c, rectPts(x0 + 10, y + 10, W - 20, 196, 8), DUSK.napkin, { seed: 45, inkW: 2.5, rough: 1, shade: 0.1 });
      drawWords(c, ev.title, x0 + 40, y + 70, DUSK.ink, 1, { size: LABEL });
      drawWords(c, `${ev.value} ${ev.unit}`, x0 + 40, y + 150, DUSK.ink, 1, { size: NUM });
    }
  });
  return box(x0, y, x0 + W, y + EVIDENCE_H);
}

/** the half-mile number line card: whole-mile numbers, two pins, the tolerance band and the gap brace */
export function drawNumberLine(c: Canvas, L: LinePic, th: Theme, k: (id: string) => number): void {
  const kc = k('card');
  if (kc <= 0) return;
  const G = lineGeom(L), B = LINE_BOX, { g } = c;
  withAlpha(c, kc, () => {
    wash(c, rectPts(B.x0, B.y0, B.w, B.h, 16), '#2A2F5C', { seed: 7, inkW: 3, rough: 1.2, shade: 0.12 });
    drawWords(c, L.real === 'mi' ? 'miles' : 'kilometers', B.x1 - 40, B.y1 - 44, 'dim', 1, { size: LABEL, align: 'right' });
    const y = G.y;
    strokePts(c, [[G.x(L.from) - 30, y], [G.x(L.to) + 30, y]], { col: 'ink', lw: 4 });
    for (let t = L.from * 2; t <= L.to * 2 + 1e-9; t++) {
      const v = t / 2, x = G.x(v), whole = t % 2 === 0;
      strokePts(c, [[x, y - (whole ? 20 : 12)], [x, y + (whole ? 20 : 12)]], { col: 'ink', lw: whole ? 4 : 2.5, cap: 'butt' });
      if (whole) drawWords(c, String(v), x, y + 66, 'ink', 1, { size: NUM, align: 'center' });
    }
  });
  // the tolerance band around the map value
  const kt = k('tol'), M = L.marks[0]!;
  if (kt > 0 && L.tol) {
    const xa = G.x(M.v - L.tol), xb = G.x(M.v + L.tol);
    g.save(); g.globalAlpha *= clamp(kt) * 0.28; g.fillStyle = paint(th, 'link', 'fill'); g.fillRect(xa, G.y - 34, xb - xa, 68); g.restore();
    strokePts(c, [[xa, G.y - 40], [xa, G.y + 40]], { col: 'link', lw: 3, alpha: kt, dash: [8, 6], cap: 'butt' });
    strokePts(c, [[xb, G.y - 40], [xb, G.y + 40]], { col: 'link', lw: 3, alpha: kt, dash: [8, 6], cap: 'butt' });
  }
  // the pins: names stacked so close values never collide
  L.marks.forEach((mk, i) => {
    const kp = k('pin' + i);
    if (kp <= 0) return;
    const x = G.x(mk.v), top = G.y - 60 - i * 92;
    withAlpha(c, kp, () => {
      strokePts(c, [[x, top + 22], [x, G.y - 14]], { col: mk.col, lw: 4 });
      g.fillStyle = paint(th, mk.col, 'fill'); g.beginPath(); g.moveTo(x, G.y - 6); g.lineTo(x - 13, G.y - 26); g.lineTo(x + 13, G.y - 26); g.closePath(); g.fill();
      drawWords(c, mk.name, x, top, mk.col, 1, { size: LABEL, align: 'center' });
    });
  });
  // the gap between the two values
  const kg = k('gap');
  if (kg > 0 && L.marks.length === 2) {
    const a = Math.min(L.marks[0]!.v, L.marks[1]!.v), b = Math.max(L.marks[0]!.v, L.marks[1]!.v);
    const ya = G.y + 118;
    drawOn(c, bracePts([G.x(b), ya], [G.x(a), ya], 22), E.inOut(clamp(kg)), { col: 'pick', lw: 3.5 });
    drawWords(c, `${fx(b - a)} ${L.real}`, (G.x(a) + G.x(b)) / 2, ya + 70, 'pick', clamp((kg - 0.4) / 0.6), { size: NUM, align: 'center' });
  }
}
