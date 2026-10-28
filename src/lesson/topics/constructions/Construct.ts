// Construct.ts: the construction player of "Constructions with compass and straightedge". It draws a construction
// (cons.ts) step by step on the course's drawing sheet: the given figure in ink, compass arcs in teal (thin, the
// marks a construction leaves visible), straightedge lines (lime = the result, amber = a helper line), a step that
// measures or guesses as a dashed line with no arcs behind it, the points as they become determined, and a compass
// (needle on the centre, pencil on the arc) while an arc is being drawn. Overlays: segments with ticks (equal
// lengths a step guarantees), triangle washes, angle marks and right-angle boxes, a ring on a point.
// Layout is pure (layoutCons): the fit and every point letter (a direction clear of every line, arc and other letter
// in the FINAL state, so letters never jump); consProblems() lists what would not read, generators retry.
// Steps: upto (how many steps are drawn; fractional = the current step drawing on), over (overlay visibility).
// Could move to the kit with GeoFig: every construction lesson needs it.
import type { Canvas } from '../../../core/draw';
import { arrow, dot, strokePts } from '../../../core/draw';
import { type Box, clamp } from '../../../core/math';
import type { Paint } from '../../../core/theme';
import { wash } from '../../wash';
import { type Frame, type Pt, LETTER, add, arcPts, boxPts, dirv, lerpP, mul, sub, tbox, textW, unit, angOf, measure } from '../geometry-foundations/geo';
import { label, LETTER_COL } from '../geometry-foundations/GeoFig';
import { type Arc, type Cons, type Ln, arcSample, isLegal } from './cons';

export interface OSeg { a: string; b: string; col: Paint; ticks?: number; dash?: boolean }
export interface OAng { v: string; p: string; q: string; col: Paint; arcs?: number; box?: boolean }
export interface Over { segs?: OSeg[]; tris?: { pts: string[]; col: Paint }[]; angs?: OAng[]; ring?: string[]; /** ids of steps drawn red (a broken step, after the answer) */ bad?: string[] }
export interface ConsFit { s: number; ox: number; oy: number; fr: Frame }
export interface ConsLay { fit: ConsFit; labels: Map<string, { at: Pt; box: Box }>; names: { at: Pt; box: Box; t: string }[]; problems: string[] }
export interface ConsLook { upto: number; overlay?: Over; k?: number; over?: number; /** colour of the result lines (default link) */ result?: Paint; /** highlight a step's marks */ focus?: string; focusK?: number }

const S = (F: ConsFit, p: Pt): Pt => [F.ox + F.s * p[0], F.oy - F.s * p[1]];
const lineCol = (l: Ln): Paint => (l.role === 'given' ? 'ink' : l.role === 'result' ? 'link' : 'first');

function allModelPts(c: Cons, over?: Over): Pt[] {
  const P: Pt[] = [];
  for (const l of [...c.given, ...c.steps.flatMap(s => s.lines)]) P.push(l.a, l.b);
  for (const a of [...c.givenArcs, ...c.steps.flatMap(s => s.arcs)]) P.push(...arcSample(a, 12));
  for (const p of c.pts) P.push(p.at);
  void over;
  return P;
}
export function fitCons(c: Cons, fr: Frame, pad = 80, maxS = 1.8): ConsFit {
  const P = allModelPts(c), xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const s = Math.min(maxS, (fr.w - 2 * pad) / Math.max(1, x1 - x0), (fr.h - 2 * pad) / Math.max(1, y1 - y0));
  return { s, fr, ox: fr.x + fr.w / 2 - (s * (x0 + x1)) / 2, oy: fr.y + fr.h / 2 + (s * (y0 + y1)) / 2 };
}
/** every stroke of the final state, in screen coordinates (for label placement and checks) */
function strokes(c: Cons, F: ConsFit, over?: Over): Pt[][] {
  const out: Pt[][] = [];
  for (const l of [...c.given, ...c.steps.flatMap(s => s.lines)]) out.push([S(F, l.a), S(F, l.b)]);
  for (const a of [...c.givenArcs, ...c.steps.flatMap(s => s.arcs)]) out.push(arcSample(a).map(p => S(F, p)));
  for (const o of over?.segs ?? []) { const A = c.pts.find(p => p.name === o.a), B = c.pts.find(p => p.name === o.b); if (A && B) out.push([S(F, A.at), S(F, B.at)]); }
  return out;
}
const hit = (b: Box, P: readonly Pt[], pad: number): boolean => {
  const x0 = b.x0 - pad, x1 = b.x1 + pad, y0 = b.y0 - pad, y1 = b.y1 + pad;
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1]!, q = P[i]!, n = Math.max(1, Math.ceil(Math.hypot(q[0] - a[0], q[1] - a[1]) / 4));
    for (let j = 0; j <= n; j++) { const x = a[0] + ((q[0] - a[0]) * j) / n, y = a[1] + ((q[1] - a[1]) * j) / n; if (x > x0 && x < x1 && y > y0 && y < y1) return true; }
  }
  return false;
};
const overlap = (a: Box, b: Box, pad = 4) => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;
const inFrame = (b: Box, fr: Frame) => b.x0 >= fr.x + 4 && b.x1 <= fr.x + fr.w - 4 && b.y0 >= fr.y + 4 && b.y1 <= fr.y + fr.h - 4;

export function layoutCons(c: Cons, fr: Frame, over?: Over, fit?: ConsFit): ConsLay {
  const F = fit ?? fitCons(c, fr);
  const st = strokes(c, F, over), problems: string[] = [];
  const placed: Box[] = [];
  // line names (ℓ, m, n, t) beyond the b end of their line
  const names: ConsLay['names'] = [];
  for (const l of [...c.given, ...c.steps.flatMap(s => s.lines)]) {
    if (!l.name) continue;
    const A = S(F, l.a), B = S(F, l.b), u = unit(sub(B, A));
    let best: { at: Pt; box: Box } | null = null;
    search: for (const [E, v] of [[B, u], [A, mul(u, -1)]] as const) for (const along of [-34, -70, -110, -150, -190]) for (const side of [36, -36]) {
      const P = add(add(E, mul(v, along)), mul([v[1], -v[0]], side)), bx = tbox(P, l.name, 54);
      if (!st.some(q => hit(bx, q, 3)) && inFrame(bx, fr) && !placed.some(b => overlap(b, bx))) { best = { at: P, box: bx }; break search; }
    }
    if (!best) { problems.push(`line name ${l.name} has no room`); continue; }
    placed.push(best.box); names.push({ ...best, t: l.name });
  }
  const labels = new Map<string, { at: Pt; box: Box }>();
  const all = c.pts.map(p => S(F, p.at)), cx = all.reduce((s, p) => s + p[0], 0) / all.length, cy = all.reduce((s, p) => s + p[1], 0) / all.length;
  for (const p of c.pts) {
    const P = S(F, p.at);
    const away = Math.hypot(P[0] - cx, P[1] - cy) < 1 ? 90 : (Math.atan2(-(P[1] - cy), P[0] - cx) * 180) / Math.PI;
    const dirs: number[] = [];
    if (p.dir !== undefined) dirs.push(p.dir);
    for (let k = 0; k < 16; k++) dirs.push(away + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 22.5);
    let best: { at: Pt; box: Box } | null = null;
    for (const dd of [44, 58, 74]) {
      for (const d of dirs) {
        const u = dirv(d), Q: Pt = [P[0] + dd * u[0], P[1] - dd * u[1]], bx = tbox(Q, p.name, LETTER);
        if (st.some(q => hit(bx, q, 3)) || !inFrame(bx, fr) || placed.some(b => overlap(b, bx)) || all.some(o => o !== P && o[0] > bx.x0 - 8 && o[0] < bx.x1 + 8 && o[1] > bx.y0 - 8 && o[1] < bx.y1 + 8)) continue;
        best = { at: Q, box: bx }; break;
      }
      if (best) break;
    }
    if (!best) { problems.push(`point ${p.name} has no room for its letter`); const u = dirv(dirs[0]!); best = { at: [P[0] + 44 * u[0], P[1] - 44 * u[1]], box: tbox([P[0] + 44 * u[0], P[1] - 44 * u[1]], p.name, LETTER) }; }
    placed.push(best.box); labels.set(p.name, best);
  }
  // nothing drawn outside the frame
  for (const q of st) for (const p of q) if (p[0] < fr.x - 2 || p[0] > fr.x + fr.w + 2 || p[1] < fr.y - 2 || p[1] > fr.y + fr.h + 2) { problems.push('a line leaves the frame'); break; }
  // two points too close to tell apart
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (Math.hypot(all[i]![0] - all[j]![0], all[i]![1] - all[j]![1]) < 26) problems.push(`points ${c.pts[i]!.name} and ${c.pts[j]!.name} are too close`);
  return { fit: F, labels, names, problems: [...new Set(problems)] };
}
export const consProblems = (c: Cons, fr: Frame, over?: Over): string[] => layoutCons(c, fr, over).problems;

function arcPolyScreen(F: ConsFit, a: Arc, k = 1): Pt[] {
  const V = S(F, a.c);
  return arcPts(V, a.r * F.s, a.a0, a.span * clamp(k));
}
function drawLn(c: Canvas, F: ConsFit, l: Ln, k: number, col: Paint, alpha = 1, lw = 5): void {
  if (k <= 0) return;
  const A = S(F, l.a), B = S(F, l.b);
  if (l.dash) { strokePts(c, [A, lerpP(A, B, k)], { col, lw: 4, dash: [18, 14], cap: 'butt', alpha }); return; }
  if (l.kind === 'ray') { c.g.save(); c.g.globalAlpha *= alpha; arrow(c, [A, B], k, { col, lw, head: 24 }); c.g.restore(); return; }
  if (l.kind === 'line') { const M = lerpP(A, B, 0.5); strokePts(c, [lerpP(M, A, k), lerpP(M, B, k)], { col, lw, alpha }); return; }
  strokePts(c, [A, lerpP(A, B, k)], { col, lw, alpha });
}
/** the compass while an arc draws: needle on the centre, pencil at the tip, hinge above */
function compass(c: Canvas, needle: Pt, tip: Pt, a: number): void {
  if (a <= 0) return;
  const d = sub(tip, needle), L = Math.hypot(d[0], d[1]);
  if (L < 4) return;
  let n: Pt = [-d[1] / L, d[0] / L];
  if (n[1] > 0) n = [-n[0], -n[1]];   // the hinge stands up the screen
  const H = add(lerpP(needle, tip, 0.5), mul(n, Math.min(170, L * 0.55)));
  strokePts(c, [needle, H, tip], { col: 'pick', lw: 5, alpha: a * 0.9 });
  dot(c, H[0], H[1], 9, 'pick', a);
  strokePts(c, [H, add(H, mul(n, 34))], { col: 'pick', lw: 7, alpha: a * 0.9 });
  dot(c, needle[0], needle[1], 5, 'pick', a);
}

export function drawCons(c: Canvas, cons: Cons, lay: ConsLay, look: ConsLook): void {
  const k = clamp(look.k ?? 1);
  if (k <= 0) return;
  const F = lay.fit, g = c.g, kov = clamp(look.over ?? 0);
  g.save(); g.globalAlpha *= k;
  const ov: Over = look.overlay ?? {};
  const P = (n: string) => { const p = cons.pts.find(x => x.name === n); return p ? S(F, p.at) : null; };
  // which steps are done (and how far the current one is)
  const done = new Set<string>();
  cons.steps.forEach((s, i) => { if (look.upto >= i + 1) done.add(s.id); });
  const kOf = (i: number) => clamp(look.upto - i);
  // 1. washes
  if (kov > 0) for (const t of ov.tris ?? []) { const Q = t.pts.map(P).filter((x): x is Pt => !!x); if (Q.length === 3) wash(c, Q, t.col, { alpha: 0.32 * kov, ink: null, rough: 1.1, seed: 11 + Math.round(Q[0]![0]), shade: 0.05 }); }
  // 2. the given figure
  for (const a of cons.givenArcs) strokePts(c, arcPolyScreen(F, a), { col: 'ink', lw: 5, closed: a.span >= 360 });
  for (const l of cons.given) drawLn(c, F, l, 1, 'ink');
  // 3. steps
  cons.steps.forEach((s, i) => {
    const ks = kOf(i);
    if (ks <= 0) return;
    const bad = kov > 0.5 && (ov.bad ?? []).includes(s.id);
    const foc = look.focus === s.id ? clamp(look.focusK ?? 1) : 0;
    const legal = isLegal(s.tool);
    const parts = s.arcs.length + s.lines.length;
    s.arcs.forEach((a, j) => {
      const kk = clamp(ks * parts - j);
      if (kk <= 0) return;
      strokePts(c, arcPolyScreen(F, a, kk), { col: bad ? 'wrong' : foc > 0 ? 'pick' : 'second', lw: 3.5 + 2 * foc, alpha: 0.95, glow: foc > 0 ? 12 * foc : 0 });
      if (kk < 1 && s.needle) { const pts = arcPolyScreen(F, a, kk); compass(c, S(F, a.c), pts[pts.length - 1]!, 1); }
    });
    s.lines.forEach((l, j) => {
      const kk = clamp(ks * parts - s.arcs.length - j);
      const col: Paint = bad ? 'wrong' : !legal ? 'dim' : (l.role === 'result' ? look.result ?? 'link' : lineCol(l));
      drawLn(c, F, l, kk, col, 1, 5 + 2 * foc);
    });
  });
  // 4. overlays: segments with ticks, angle marks
  if (kov > 0) {
    for (const o of ov.segs ?? []) {
      const A = P(o.a), B = P(o.b);
      if (!A || !B) continue;
      strokePts(c, [A, B], { col: o.col, lw: 5, alpha: kov, dash: o.dash ? [14, 12] : undefined, cap: o.dash ? 'butt' : 'round' });
      const u = unit(sub(B, A)), n: Pt = [u[1], -u[0]], M = lerpP(A, B, 0.5);
      for (let t = 0; t < (o.ticks ?? 0); t++) { const cc = add(M, mul(u, (t - ((o.ticks ?? 1) - 1) / 2) * 12)); strokePts(c, [add(cc, mul(n, 14)), add(cc, mul(n, -14))], { col: o.col, lw: 4.5, alpha: kov }); }
    }
    for (const a of ov.angs ?? []) {
      const V = P(a.v), Pp = P(a.p), Q = P(a.q);
      if (!V || !Pp || !Q) continue;
      const vm = cons.pts.find(x => x.name === a.v)!.at, pm = cons.pts.find(x => x.name === a.p)!.at, qm = cons.pts.find(x => x.name === a.q)!.at;
      const pa = angOf(sub(pm, vm)), qa = angOf(sub(qm, vm));
      let a0 = pa, span = ((qa - pa) % 360 + 360) % 360;
      if (span > 180) { a0 = qa; span = 360 - span; }
      void measure;
      if (a.box) { strokePts(c, boxPts(V, a0, span, 30), { col: a.col, lw: 4.5, alpha: kov }); continue; }
      for (let t = 0; t < (a.arcs ?? 1); t++) strokePts(c, arcPts(V, 46 - 11 * t, a0, span), { col: a.col, lw: 4.5, alpha: kov });
    }
  }
  // 5. points and letters (a point shows once it is determined)
  const shown = (deps: string[]) => (deps.length === 0 ? 1 : Math.min(...deps.map(d => { const i = cons.steps.findIndex(s => s.id === d); return i < 0 ? 0 : clamp((look.upto - i - 0.85) / 0.15); })));
  for (const p of cons.pts) {
    const a = shown(p.deps);
    if (a <= 0) continue;
    const Q = S(F, p.at), L = lay.labels.get(p.name);
    const ring = kov > 0 && (ov.ring ?? []).includes(p.name);
    if (ring) strokePts(c, arcPts(Q, 22, 0, 360), { col: 'link', lw: 5, alpha: kov * a, glow: 12 });
    dot(c, Q[0], Q[1], 8, ring ? 'link' : 'ink', a);
    if (L) label(c, p.name, L.at, LETTER, ring ? 'link' : LETTER_COL, a);
  }
  for (const nm of lay.names) {
    const l = [...cons.given, ...cons.steps.flatMap(s => s.lines)].find(x => x.name === nm.t)!;
    const i = cons.steps.findIndex(s => s.lines.includes(l));
    const a = i < 0 ? 1 : clamp(kOf(i) * 2 - 1);
    label(c, nm.t, nm.at, 54, 'dim', a, true);
  }
  g.restore();
}
export { textW };
