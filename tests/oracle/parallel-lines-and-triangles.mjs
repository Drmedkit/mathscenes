// Oracle for the lesson "parallel-lines-and-triangles" (angle relationships with parallel lines and triangles,
// 8.G.A.5). Written from what the student sees only: the prompt, the board, the choices and the drawn figure (lines,
// angle marks with their visible labels, boxes, matching arcs, point letters). See docs/lessons/QUALITY_LAYER.md.
//
// How the figure is read (like a careful teacher, never from ids/colours/`alt`/`focus`):
//   - every drawn (non-dashed) segment is a line; collinear segments are one line (a side and its extension);
//   - every angle mark is a wedge between two rays from its vertex; each ray lies on a line, pointing one way;
//   - "x ∥ y" in the text (or "the arrows mark the lines parallel") makes those lines share one direction;
//   - VALUES come from the text and the labels; the drawing only gives the configuration (which side, which way);
//     a direction calculus then works the unknown out: a known angle fixes the turn from one line to the other.
//   - relations ("equal / add to 180 / can't tell") are tested over many line directions the givens allow.
//   - triangles: each mark at a vertex is an interior angle I_V, an exterior angle 180 − I_V or a vertical angle,
//     written as an affine form in I_A, I_B (I_C = 180 − I_A − I_B), so an equation is an identity or it is not.
import { nums } from '../../tools/quality/oracle-kit.mjs';

const EPS = 1e-6;
// ---------------------------------------------------------------- vectors
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const len = a => Math.hypot(a[0], a[1]);
const unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const same = (a, b, tol = 1.5) => len(sub(a, b)) < tol;
const mod = (x, m = 360) => ((x % m) + m) % m;
const wrap = x => { const y = mod(x); return y > 180 ? y - 360 : y; };
const deg = r => (r * 180) / Math.PI;
/** unsigned convex angle (0..180) between two vectors */
const angBetween = (a, b) => deg(Math.acos(Math.max(-1, Math.min(1, dot(unit(a), unit(b))))));

const clean = v => Number(Number(v).toFixed(6));
const norm = s => String(s ?? '').replace(/−/g, '-').replace(/[’']/g, "'");

// ---------------------------------------------------------------- the figure
function figOf(q) { return q?.data?.picture?.fig ?? null; }

/** lines: collinear drawn segments grouped. { pt, dir, segs, name } */
function linesOf(fig) {
  const segs = (fig.segs ?? []).filter(s => !s.dash);
  const L = [];
  for (const s of segs) {
    const d = unit(sub(s.b, s.a));
    const onIt = g => Math.abs(cross(g.dir, sub(s.a, g.pt))) < 1.5 && Math.abs(cross(g.dir, sub(s.b, g.pt))) < 1.5;
    let g = L.find(onIt);
    if (!g) { g = { pt: s.a, dir: d, segs: [], name: null, par: 0 }; L.push(g); }
    g.segs.push(s);
    if (s.name) g.name = s.name;
    if (s.par) g.par = s.par;
  }
  return L;
}
const onLine = (g, P) => Math.abs(cross(g.dir, sub(P, g.pt))) < 1.5;
function lineThrough(L, A, B) {
  const i = L.findIndex(g => onLine(g, A) && onLine(g, B));
  return i;
}
function intersect(g, h) {
  const den = cross(g.dir, h.dir);
  if (Math.abs(den) < 1e-9) return null;
  const t = cross(sub(h.pt, g.pt), h.dir) / den;
  return add(g.pt, [g.dir[0] * t, g.dir[1] * t]);
}
/** the parameter range a segment group covers along its own direction */
function extent(g) {
  const ts = g.segs.flatMap(s => [dot(sub(s.a, g.pt), g.dir), dot(sub(s.b, g.pt), g.dir)]);
  return [Math.min(...ts), Math.max(...ts)];
}
const within = (g, P) => { const t = dot(sub(P, g.pt), g.dir), [a, b] = extent(g); return t >= a - 1 && t <= b + 1; };

/** angle marks with their rays read from the drawing */
function marksOf(fig, L) {
  const out = [];
  for (const a of fig.angles ?? []) {
    const rays = [a.p, a.q].map(P => {
      const vec = sub(P, a.v);
      const li = lineThrough(L, a.v, P);
      return { P, vec, line: li, off: li >= 0 && dot(vec, L[li].dir) < 0 ? 180 : 0 };
    });
    if (rays.some(r => r.line < 0)) continue;          // a mark on a line that is not drawn (helper of the worked solution)
    out.push({ id: a.id, v: a.v, rays, text: String(a.text ?? ''), box: !!a.box, arcs: a.arcs ?? 0, reflex: !!a.reflex,
      s: Math.sign(cross(rays[0].vec, rays[1].vec)), drawn: a.reflex ? 360 - angBetween(rays[0].vec, rays[1].vec) : angBetween(rays[0].vec, rays[1].vec) });
  }
  return out;
}
const labelVal = t => { const m = String(t).match(/^\s*(\d+(?:\.\d+)?)\s*°\s*$/); return m ? Number(m[1]) : null; };
const markByLabel = (M, lab) => M.find(m => m.text === String(lab));

// ---------------------------------------------------------------- direction calculus
/**
 * Assign a direction (degrees) to every line from the known angle values. `par` = list of [i, j] line pairs that are
 * parallel. `known` = Map(mark -> value), `equal` = list of mark groups that are equal (matching arcs).
 * Free lines get probe values (seed). Returns { theta(i), conflict }.
 */
function solveDirs(L, M, known, par, seed = 0, extra = null) {
  const root = L.map((_, i) => i);
  const find = i => (root[i] === i ? i : (root[i] = find(root[i])));
  for (const [i, j] of par) root[find(i)] = find(j);
  const th = new Map();
  let conflict = 0;
  const dirOf = r => th.get(find(r.line)) + r.off;
  const has = r => th.has(find(r.line));
  const cons = [...known.entries()];
  if (extra) cons.push(...extra);
  const propagate = () => {
    let changed = true;
    while (changed) {
      changed = false;
      for (const [m, V] of cons) {
        const [p, q] = m.rays;
        const sV = m.reflex ? -(360 - V) : V;           // signed turn from ray p to ray q in the drawing's sense
        if (has(p) && has(q)) { const r = wrap((dirOf(q) - dirOf(p)) * m.s - sV); if (Math.abs(r) > 1e-6) conflict = Math.max(conflict, Math.abs(r)); continue; }
        if (has(p)) { th.set(find(q.line), mod(dirOf(p) + m.s * sV - q.off)); changed = true; }
        else if (has(q)) { th.set(find(p.line), mod(dirOf(q) - m.s * sV - p.off)); changed = true; }
      }
    }
  };
  const roots = [...new Set(L.map((_, i) => find(i)))];
  let k = 0;
  for (const r of roots) {
    if (th.has(r)) continue;
    th.set(r, k === 0 ? 0 : mod(17 + 41 * k + 67 * seed + 13 * seed * k, 180));
    k++;
    propagate();
  }
  return { theta: i => th.get(find(i)), conflict, value: m => measure(m, i => th.get(find(i))) };
}
function measure(m, theta) {
  const d = mod(theta(m.rays[1].line) + m.rays[1].off - theta(m.rays[0].line) - m.rays[0].off);
  const conv = Math.min(d, 360 - d);
  return m.reflex ? 360 - conv : conv;
}
/** the value of mark `target` (if the givens fix it), via the direction calculus, with matching-arc groups */
function valueOf(L, M, known, par, target, extraGroups = []) {
  const groups = [...arcGroups(M), ...extraGroups];
  const kn = new Map(known);
  // a matching-arc group with one known member: all members known
  for (const g of groups) { const v = g.map(m => kn.get(m)).find(x => x !== undefined); if (v !== undefined) g.forEach(m => kn.set(m, v)); }
  const open = groups.filter(g => !g.some(m => kn.has(m)));
  const run = (kk, seed) => solveDirs(L, M, kk, par, seed);
  if (!open.length) {
    const vals = [0, 1, 2].map(s => run(kn, s));
    const v = vals.map(r => r.value(target));
    const conflict = Math.max(...vals.map(r => r.conflict));
    if (v.every(x => Math.abs(x - v[0]) < 1e-6)) return { v: clean(v[0]), conflict };
    return { v: null, conflict };
  }
  // one open equal group: its value u is the unknown; find u where everything fits (residual 0)
  const g = open[0];
  const resid = u => {
    const kk = new Map(kn); g.slice(0, -1).forEach(m => kk.set(m, u));
    const r = solveDirs(L, M, kk, par, 0);
    // every other member must come out at u
    return wrap(r.value(g[g.length - 1]) - u);   // the last member must come out at u too
  };
  let best = null;
  let prev = resid(0.25), pu = 0.25;
  for (let u = 0.5; u < 180; u += 0.25) {
    const cur = resid(u);
    if (Math.sign(cur) !== Math.sign(prev) && Math.abs(cur - prev) < 90) {
      let a = pu, b = u, fa = prev;
      for (let i = 0; i < 60; i++) { const mid = (a + b) / 2, fm = resid(mid); if (Math.sign(fm) === Math.sign(fa)) { a = mid; fa = fm; } else b = mid; }
      const root = (a + b) / 2;
      if (Math.abs(resid(root)) < 1e-6) { if (best !== null && Math.abs(best - root) > 1e-6) return { v: null, conflict: 0, two: true }; best = root; }
    }
    prev = cur; pu = u;
  }
  if (best === null) return { v: null, conflict: 0 };
  const kk = new Map(kn); g.slice(0, -1).forEach(m => kk.set(m, best));
  const r = solveDirs(L, M, kk, par, 0);
  return { v: clean(Math.round(r.value(target) * 1e6) / 1e6), conflict: r.conflict };
}
function arcGroups(M) {
  const by = {};
  for (const m of M) if (m.arcs >= 1) (by[m.arcs] ??= []).push(m);
  return Object.values(by).filter(g => g.length > 1);
}

// ---------------------------------------------------------------- parallel statements in the text
function textOf(q) { return [q.prompt, q.board, ...(q.data?.givens ?? [])].map(norm).join(' | '); }
/** names of lines said to be parallel, or null for "not given" */
function parallelNames(q) {
  const p = norm(q.prompt);
  if (/\bNOT\b|Nothing says|not parallel|not marked parallel|not given as parallel/i.test(p)) return { none: true };
  const T = norm(q.prompt) + ' | ' + (q.data?.givens ?? []).map(g => g.replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\ell/g, 'ℓ').replace(/\\parallel/g, '∥')).join(' | ');
  const pairs = [];
  for (const m of T.matchAll(/(ℓ|\b[A-Za-z]{1,2}\b|[A-Z][a-z]+ St)\s*∥\s*(ℓ|\b[A-Za-z]{1,2}\b|[A-Z][a-z]+ St)/g)) pairs.push([m[1], m[2]]);
  for (const m of T.matchAll(/Lines (ℓ|[A-Za-z]) and (ℓ|[A-Za-z]) are parallel/g)) pairs.push([m[1], m[2]]);
  if (/arrows mark the lines (as )?parallel|are parallel|∥/.test(T)) return { pairs, any: true };
  return { pairs, any: false };
}

// ---------------------------------------------------------------- transversal figures (two lines + a transversal)
function transFig(q) {
  const fig = figOf(q);
  if (!fig) return null;
  const L = linesOf(fig);
  const M = marksOf(fig, L);
  if (L.length !== 3) return { L, M };
  // the transversal: named after "transversal", else the one line that crosses both others inside the drawing
  let t = -1;
  const named = norm(q.prompt).match(/transversal (ℓ|[A-Za-z])\b/);
  if (named) t = L.findIndex(g => g.name === named[1]);
  if (t < 0) {
    const crosses = L.map((g, i) => L.every((h, j) => j === i || ((P => P && within(g, P) && within(h, P))(intersect(g, h)))));
    const c = crosses.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
    if (c.length === 1) t = c[0];
    else {
      // the lines are named in the board "(j, k, n)" / "(p, q)" or the prompt: the transversal is the one not named as a line
      const nm = [...norm(q.prompt + ' ' + texish(q.board)).matchAll(/(?:Lines|lines) (ℓ|[A-Za-z]) and (ℓ|[A-Za-z])|(ℓ|\b[a-z]\b)\s*∥\s*(ℓ|\b[a-z]\b)/g)].flatMap(m => m.slice(1).filter(Boolean));
      if (nm.length) t = L.findIndex(g => g.name && !nm.includes(g.name));
    }
  }
  const lines = [0, 1, 2].filter(i => i !== t);
  const X = t >= 0 ? lines.map(i => intersect(L[t], L[i])) : [];
  return { L, M, t, lines, X };
}
const texish = s => String(s ?? '').replace(/\\ell/g, 'ℓ').replace(/\\[a-z]+/g, ' ');

/** where a mark sits at a transversal crossing: { cross (0/1), side (+1/-1 of the transversal), interior } */
function place(F, m) {
  const { L, t, lines, X } = F;
  const ci = X.findIndex(P => P && same(P, m.v, 2));
  if (ci < 0) return null;
  const rT = m.rays.find(r => r.line === t), rL = m.rays.find(r => r.line !== t);
  if (!rT || !rL || rL.line !== lines[ci]) return null;
  const other = X[1 - ci];
  return { cross: ci, side: Math.sign(cross(L[t].dir, rL.vec)), interior: dot(rT.vec, sub(other, m.v)) > 0, rT, rL };
}
/** the name of the pair two marks form */
function pairType(F, a, b) {
  if (same(a.v, b.v, 2)) {
    const key = m => m.rays.map(r => `${r.line}:${r.off}`).sort().join();
    if (key(a) === key(b)) return 'same';
    const flips = a.rays.map(r => (b.rays.some(s => s.line === r.line && s.off === r.off) ? 0 : b.rays.some(s => s.line === r.line) ? 1 : 9));
    const f = flips.reduce((s, x) => s + x, 0);
    return f === 2 ? 'vertical' : f === 1 ? 'linear' : 'other';
  }
  const pa = place(F, a), pb = place(F, b);
  if (!pa || !pb || pa.cross === pb.cross) return 'other';
  const sameSide = pa.side === pb.side;
  if (sameSide) {
    if (pa.interior && pb.interior) return 'ssInt';
    if (!pa.interior && !pb.interior) return 'ssExt';
    return 'corr';
  }
  if (pa.interior && pb.interior) return 'altInt';
  if (!pa.interior && !pb.interior) return 'altExt';
  return 'other';
}
const PAIR_NAME = { corr: 'Corresponding', altInt: 'Alternate interior', altExt: 'Alternate exterior', ssInt: 'Same-side interior' };

/** relation of two marks for sure, under parallel (or not): { eq, sup } true when it holds for every allowed figure */
function relation(F, a, b, parallel, known = new Map()) {
  const par = parallel ? [[F.lines[0], F.lines[1]]] : [];
  const kn = new Map(known);
  for (const m of F.M) if (m.box) kn.set(m, 90);
  let eq = true, sup = true;
  for (let s = 0; s < 7; s++) {
    const r = solveDirs(F.L, F.M, kn, par, s);
    const va = r.value(a), vb = r.value(b);
    if (Math.abs(va - vb) > 1e-6) eq = false;
    if (Math.abs(va + vb - 180) > 1e-6) sup = false;
  }
  return { eq, sup };
}
/** is the statement "∠a + ∠b = 180°" / "∠a = ∠b" sure, under parallel or not */
function statementSure(F, text, parallel) {
  const t = norm(text);
  let m = t.match(/^∠(\d+)\s*\+\s*∠(\d+)\s*=\s*180°$/);
  if (m) { const a = markByLabel(F.M, m[1]), b = markByLabel(F.M, m[2]); return a && b ? relation(F, a, b, parallel).sup : null; }
  m = t.match(/^∠(\d+)\s*=\s*∠(\d+)$/);
  if (m) { const a = markByLabel(F.M, m[1]), b = markByLabel(F.M, m[2]); return a && b ? relation(F, a, b, parallel).eq : null; }
  return null;
}
const isParallel = q => { const p = parallelNames(q); return !p.none && p.any; };

function transValue(q, F, target, known) {
  const par = isParallel(q) ? [[F.lines[0], F.lines[1]]] : [];
  const kn = new Map(known);
  for (const m of F.M) { const v = labelVal(m.text); if (v !== null) kn.set(m, v); if (m.box) kn.set(m, 90); }
  return valueOf(F.L, F.M, kn, par, target);
}

// ---------------------------------------------------------------- general figures (triangles, extra parallel lines)
/** all lines, marks and the parallel pairs the text gives, for a figure with named lines and/or point letters */
function genFig(q) {
  const fig = figOf(q);
  if (!fig) return null;
  const L = linesOf(fig);
  const M = marksOf(fig, L);
  const par = [];
  const P = parallelNames(q);
  if (!P.none) {
    const byName = n => L.findIndex(g => g.name === n);
    const byPts = n => { const pts = (fig.points ?? []); const A = pts.find(p => p.name === n[0]), B = pts.find(p => p.name === n[1]); return A && B ? lineThrough(L, A.at, B.at) : -1; };
    for (const [a, b] of P.pairs ?? []) {
      const i = a.length === 2 ? byPts(a) : byName(a), j = b.length === 2 ? byPts(b) : byName(b);
      if (i >= 0 && j >= 0) par.push([i, j]);
    }
    // "Line ℓ is drawn through D parallel to EF"
    const d = norm(q.prompt).match(/Line (ℓ|[a-z]) is drawn through ([A-Z]) parallel to ([A-Z]{2})/);
    if (d) { const i = byName(d[1]), j = byPts(d[3]); if (i >= 0 && j >= 0) par.push([i, j]); }
  }
  return { fig, L, M, par };
}
function genValue(q, G, target, extraKnown = []) {
  const kn = new Map();
  for (const m of G.M) { const v = labelVal(m.text); if (v !== null) kn.set(m, v); if (m.box) kn.set(m, 90); }
  for (const [m, v] of extraKnown) kn.set(m, v);
  // "m∠K = m∠L" in the text: the marks at those two vertices are equal
  const pts = G.fig.points ?? [], at = n => pts.find(x => x.name === n)?.at;
  const eqs = [...norm(textOf(q)).replace(/\\angle\s*/g, '∠').matchAll(/m\s*∠\s*([A-Z]) = m\s*∠\s*([A-Z])/g)].map(m => [m[1], m[2]].map(n => at(n) && G.M.find(k => same(k.v, at(n), 2)))).filter(g => g.every(Boolean));
  return valueOf(G.L, G.M, kn, G.par, target, eqs);
}

// ---------------------------------------------------------------- triangle model (affine forms in I_A, I_B, I_C)
function triOf(fig) {
  const body = (fig.fills ?? []).find(f => f.id === 'body' && f.pts?.length === 3);
  return body ? body.pts : null;
}
/** affine form {c, a: [kA, kB, kC]} of the angle at V between rays toward P1, P2 (points), reduced with the sum */
function formAt(T, V, P1, P2) {
  const vi = T.findIndex(X => same(X, V, 2));
  if (vi < 0) return null;
  const kind = P => {
    for (let w = 0; w < 3; w++) {
      if (w === vi) continue;
      const d = sub(T[w], V), e = sub(P, V);
      if (Math.abs(cross(unit(d), unit(e))) < 0.01) return dot(d, e) > 0 ? { w, out: false } : { w, out: true };
    }
    return null;
  };
  const k1 = kind(P1), k2 = kind(P2);
  if (!k1 || !k2 || k1.w === k2.w) {
    if (k1 && k2 && k1.w === k2.w && k1.out !== k2.out) return { c: 180, a: [0, 0, 0] };   // a straight angle
    return null;
  }
  const f = { c: 0, a: [0, 0, 0] };
  const outs = (k1.out ? 1 : 0) + (k2.out ? 1 : 0);
  if (outs === 0 || outs === 2) f.a[vi] = 1;                  // interior, or the vertical angle of it
  else { f.c = 180; f.a[vi] = -1; }                            // exterior: 180 − I_V
  return reduce(f);
}
function reduce(f) {          // I_C = 180 − I_A − I_B
  const c = f.c + 180 * f.a[2];
  return { c, a: [f.a[0] - f.a[2], f.a[1] - f.a[2], 0] };
}
const fAdd = (f, g, k = 1) => ({ c: f.c + k * g.c, a: f.a.map((x, i) => x + k * g.a[i]) });
const fZero = f => Math.abs(f.c) < EPS && f.a.every(x => Math.abs(x) < EPS);
const fConst = c => ({ c, a: [0, 0, 0] });
const markForm = (T, m) => (m.reflex ? null : formAt(T, m.v, add(m.v, m.rays[0].vec), add(m.v, m.rays[1].vec)));
/** "∠3 + ∠1 + ∠4", "180° − ∠1", "∠R + ∠P", "∠RQP" → a form, given a resolver for one angle name */
function exprForm(text, one) {
  const t = norm(text).replace(/\s+/g, '');
  const toks = t.match(/[+-]?(∠[A-Z0-9]+|\d+(?:\.\d+)?°?)/g);
  if (!toks || toks.join('') !== t) return null;
  let f = fConst(0);
  for (const tok of toks) {
    const sgn = tok[0] === '-' ? -1 : 1, body = tok.replace(/^[+-]/, '');
    let g;
    if (body.startsWith('∠')) { g = one(body.slice(1)); if (!g) return null; } else g = fConst(Number(body.replace('°', '')));
    f = fAdd(f, g, sgn);
  }
  return f;
}
function eqForm(text, one) {
  const [l, r, ...rest] = norm(text).split('=');
  if (rest.length || r === undefined) return null;
  const a = exprForm(l, one), b = exprForm(r, one);
  return a && b ? fAdd(a, b, -1) : null;
}
/** resolver for ∠k (mark label) / ∠X (interior at the vertex named X) / ∠XYZ (three point letters) */
function resolver(fig, T, M) {
  const pts = fig.points ?? [];
  const at = n => pts.find(p => p.name === n)?.at;
  return name => {
    if (/^\d+$/.test(name)) { const m = markByLabel(M, name); return m ? markForm(T, m) : null; }
    if (name.length === 1) { const V = at(name); if (!V) return null; const vi = T.findIndex(X => same(X, V, 2)); if (vi < 0) return null; return formAt(T, V, T[(vi + 1) % 3], T[(vi + 2) % 3]); }
    if (name.length === 3) { const A = at(name[0]), V = at(name[1]), B = at(name[2]); return A && V && B ? formAt(T, V, A, B) : null; }
    return null;
  };
}

// ---------------------------------------------------------------- small helpers for choices
const pick = (q, pred) => { const hits = (q.choices ?? []).map((c, i) => (pred(norm(c), i) ? i : -1)).filter(i => i >= 0); return hits.length === 1 ? hits[0] : -1; };
const degs = s => nums(s);

/** a linear expression in x: "3x", "4x − 7", "x + 20", "x", "120" → [a, b] */
function linX(s) {
  const t = norm(s).replace(/[()°\s]/g, '');
  let a = 0, b = 0;
  for (const m of t.matchAll(/([+-]?)(\d*(?:\.\d+)?)(x?)/g)) {
    if (!m[2] && !m[3]) continue;
    const sg = m[1] === '-' ? -1 : 1;
    if (m[3]) a += sg * (m[2] === '' ? 1 : Number(m[2])); else b += sg * Number(m[2]);
  }
  return [a, b];
}

// ================================================================ solve
function solve(q) {
  const p = norm(q.prompt);
  const fam = q.family;
  switch (fam) {
    // ---------------- transversal figures
    case 'tcWhere': {
      const F = transFig(q);
      const m = p.match(/Where is ∠(\d+)/);
      const a = markByLabel(F.M, m[1]);
      return pick(q, c => {
        const x = c.match(/^(Interior|Exterior), (same|opposite) side of (\S+) as ∠(\d+)$/);
        if (!x) return false;
        const b = markByLabel(F.M, x[4]);
        const pa = place(F, a), pb = place(F, b);
        if (!pa || !pb || F.L[F.t].name !== x[3]) return false;
        return pa.interior === (x[1] === 'Interior') && (pa.side === pb.side) === (x[2] === 'same');
      });
    }
    case 'tcWhichTrans': {
      const F = transFig(q);
      const t = transversalByGeometry(F.L);
      if (t < 0) return -1;
      return pick(q, c => c === `Line ${F.L[t].name}`);
    }
    case 'findPartner': {
      const F = transFig(q);
      const m = p.match(/∠(\d+)/);
      const a = markByLabel(F.M, m[1]);
      const want = /corresponds/.test(p) ? 'corr' : /alternate interior/.test(p) ? 'altInt' : /alternate exterior/.test(p) ? 'altExt' : /same-side interior/.test(p) ? 'ssInt' : null;
      return pick(q, c => { const k = c.match(/^∠(\d+)$/); const b = k && markByLabel(F.M, k[1]); return !!b && pairType(F, a, b) === want; });
    }
    case 'pairName': {
      const F = transFig(q);
      const m = p.match(/∠(\d+) and ∠(\d+)/);
      const ty = pairType(F, markByLabel(F.M, m[1]), markByLabel(F.M, m[2]));
      return pick(q, c => PAIR_NAME[ty] === c);
    }
    case 'classify':
    case 'ssRight': {
      const F = transFig(q);
      const m = p.match(/∠(\d+) and ∠(\d+)/);
      const a = markByLabel(F.M, m[1]), b = markByLabel(F.M, m[2]);
      const r = relation(F, a, b, isParallel(q));
      return pick(q, c => {
        if (/^Both/.test(c)) return r.eq && r.sup;
        if (/^They are equal/.test(c)) return r.eq && !r.sup;
        if (/^They add to 180°/.test(c)) return r.sup && !r.eq;
        return !r.eq && !r.sup;              // "Can't tell" / "Neither"
      });
    }
    case 'needsParallel': {
      const F = transFig(q);
      if (/still true for sure/.test(p)) return pick(q, c => statementSure(F, c, false) === true);
      if (/ONLY if/.test(p)) return pick(q, c => statementSure(F, c, true) === true && statementSure(F, c, false) === false);
      return undefined;
    }
    case 'pairValue':
    case 'allEight': {
      const F = transFig(q);
      let target, known = new Map();
      if (fam === 'allEight') {
        const m = p.match(/∠(\d+) = (\d+)°\. Find ∠(\d+)/);
        known.set(markByLabel(F.M, m[1]), Number(m[2]));
        target = markByLabel(F.M, m[3]);
      } else target = markByLabel(F.M, 'x');
      return transValue(q, F, target, known).v ?? undefined;
    }
    case 'exprPair': {
      const F = transFig(q);
      // ∠1 = (expr)° and ∠2 = (expr)° or a plain number
      const ex = [...p.matchAll(/∠(\d+) = \(?([^)°]*)\)?°/g)].map(m => ({ m: markByLabel(F.M, m[1]), lab: m[1], f: linX(m[2]) }));
      if (ex.length !== 2 || ex.some(e => !e.m)) return undefined;
      const r = relation(F, ex[0].m, ex[1].m, isParallel(q));
      if (r.eq === r.sup) return undefined;
      // equal: a1 x + b1 = a2 x + b2;  add to 180: (a1 + a2) x + b1 + b2 = 180
      const [a1, b1] = ex[0].f, [a2, b2] = ex[1].f;
      const x = r.eq ? (b2 - b1) / (a1 - a2) : (180 - b1 - b2) / (a1 + a2);
      const asked = p.match(/the measure of ∠(\d+)/)[1];
      const e = ex.find(k => k.lab === asked);
      return [clean(x), clean(e.f[0] * x + e.f[1])];
    }
    case 'motionPick': {
      const F = transFig(q);
      const m = p.match(/carries ∠(\d+) exactly onto ∠(\d+)/);
      const a = markByLabel(F.M, m[1]), b = markByLabel(F.M, m[2]);
      const ty = pairType(F, a, b);
      const pts = figOf(q).points ?? [], at = n => pts.find(x => x.name === n)?.at;
      return pick(q, c => {
        if (/^A slide/.test(c)) { const x = c.match(/from (\w) to (\w)/); return ty === 'corr' && x && at(x[1]) && same(at(x[1]), a.v, 2) && same(at(x[2]), b.v, 2); }
        if (/^A half turn/.test(c)) { const M_ = at('M'); return (ty === 'altInt' || ty === 'altExt') && M_ && same(M_, [(a.v[0] + b.v[0]) / 2, (a.v[1] + b.v[1]) / 2], 2); }
        return false;                                   // a reflection in the transversal / a quarter turn never carries one crossing onto the other
      });
    }
    case 'reasonPick': {
      const F = transFig(q);
      const par = isParallel(q);
      const m = p.match(/the step ∠(\d+) (=|\+) ∠(\d+)( = 180°)?/);
      const a = markByLabel(F.M, m[1]), b = markByLabel(F.M, m[3]);
      const wantSup = m[2] === '+';
      const ty = pairType(F, a, b);
      const sure = relation(F, a, b, par);
      const claimSure = wantSup ? sure.sup : sure.eq;
      return pick(q, c => {
        if (/^They look|look parallel/.test(c)) return false;
        if (/^No reason works/.test(c)) return !claimSure;
        if (/but only because/.test(c)) return false;                  // vertical / linear pair never need parallel lines
        const nm = c.match(/^(Corresponding|Alternate interior|Alternate exterior|Same-side interior|Vertical|A linear pair)/);
        if (!nm) return false;
        const T = { Corresponding: 'corr', 'Alternate interior': 'altInt', 'Alternate exterior': 'altExt', 'Same-side interior': 'ssInt', Vertical: 'vertical', 'A linear pair': 'linear' }[nm[1]];
        if (T !== ty || !claimSure) return false;
        const gives = { corr: 'eq', altInt: 'eq', altExt: 'eq', vertical: 'eq', ssInt: 'sup', linear: 'sup' }[T];
        if ((gives === 'sup') !== wantSup) return false;
        const needsPar = !['vertical', 'linear'].includes(T);
        const saysPar = /, and .* is given/.test(c);
        return needsPar ? saysPar && par : true;
      });
    }
    case 'findBadStep': {
      if (/angles of one triangle|linear pair\)|remote interior|\(vertical angles\)/.test(p) && !/given/.test(p)) return triBadStep(q);
      return transBadStep(q);
    }
    // ---------------- triangles and other figures (direction calculus)
    case 'third': case 'thirdRight': case 'isoBase': case 'isoApex': case 'extValue':
    case 'chainTri': case 'chainExt': case 'zigzag': {
      const G = genFig(q);
      return genValue(q, G, markByLabel(G.M, 'x')).v ?? undefined;
    }
    case 'extRemoteMissing': {
      const G = genFig(q);
      return genValue(q, G, markByLabel(G.M, 'y')).v ?? undefined;
    }
    case 'extWrite': {
      const G = genFig(q);
      const x = genValue(q, G, markByLabel(G.M, 'x')).v;
      if (x === null) return undefined;
      return pick(q, c => Math.abs(evalDeg(c) - x) < 1e-6);
    }
    case 'triSum': {
      let m;
      if ((m = p.match(/Can a triangle have angles of (\d+)°, (\d+)° and (\d+)°/))) {
        const ok = Number(m[1]) + Number(m[2]) + Number(m[3]) === 180 && [m[1], m[2], m[3]].every(x => Number(x) > 0);
        return pick(q, c => (ok ? c === 'Yes' : c === 'No'));
      }
      if ((m = p.match(/One angle of this triangle is (\d+)°\. Must the other two be ([\d.]+)° each/))) {
        const rest = 180 - Number(m[1]);
        return pick(q, c => { const x = c.match(/^No: they add to (\d+)°, but they need not be equal/); return !!x && Number(x[1]) === rest; });
      }
      if (/Which has the bigger angle sum/.test(p)) return pick(q, c => /^Neither: both sums are 180°/.test(c));
      return undefined;
    }
    case 'extFind': {
      const G = genFig(q), T = triOf(G.fig);
      return pick(q, c => {
        const x = c.match(/^Angle (\w)$/); const m = x && markByLabel(G.M, x[1]);
        if (!m || m.reflex) return false;
        const f = markForm(T, m);
        return !!f && isExterior(T, m);
      });
    }
    case 'extName': {
      const fig = figOf(q), T = triOf(fig);
      const at = n => (fig.points ?? []).find(x => x.name === n)?.at;
      const V = p.match(/exterior angle at ([A-Z])/)[1];
      return pick(q, c => { const x = c.match(/^∠([A-Z])([A-Z])([A-Z])$/); return !!x && x[2] === V && at(x[1]) && at(x[3]) && isExteriorPts(T, at(V), at(x[1]), at(x[3])); });
    }
    case 'extRemote': {
      const fig = figOf(q), T = triOf(fig), M = marksOf(fig, linesOf(fig));
      const one = resolver(fig, T, M);
      const tgt = one(p.match(/^∠([A-Z]{3})/)[1]);
      if (!tgt) return undefined;
      return pick(q, c => { const f = exprForm(c, one); return !!f && fZero(fAdd(f, tgt, -1)); });
    }
    case 'sumCheck': {
      const fig = figOf(q), T = triOf(fig), M = marksOf(fig, linesOf(fig));
      const one = resolver(fig, T, M);
      return pick(q, c => { const f = eqForm(c, one); return !!f && fZero(f); });
    }
    case 'extArgGeneral': {
      const fig = figOf(q), T = triOf(fig), M = marksOf(fig, linesOf(fig));
      const one = resolver(fig, T, M);
      // the two given equations must hold in the figure; then the choice must equal the asked angle
      const giv = norm(q.prompt).match(/^(.*?) \(triangle sum\) and (.*?) \(linear pair\)\. So ∠(\d+) = \?/);
      const tgt = one(giv[3]);
      return pick(q, c => { const f = exprForm(c, one); return !!f && !!tgt && fZero(fAdd(f, tgt, -1)); });
    }
    case 'triArgReason': {
      const G = genFig(q), fig = G.fig, T = triOf(fig);
      const pts = fig.points ?? [], at = n => pts.find(x => x.name === n)?.at;
      let m;
      if ((m = p.match(/Why is ∠(\d+) = ∠([A-Z])\?/))) {
        const a = markByLabel(G.M, m[1]);
        const V = at(m[2]); const vi = T.findIndex(X => same(X, V, 2));
        const virt = virtualMark(G.L, V, T[(vi + 1) % 3], T[(vi + 2) % 3]);
        // the two crossings: the line through both vertices is the transversal
        const F = { L: G.L, M: G.M };
        const ty = pairGeneral(G.L, a, virt);
        return pick(q, c => {
          let x;
          if ((x = c.match(/^Alternate interior angles: .* and ([A-Z]{2}) is the transversal$/))) {
            const ti = lineThrough(G.L, at(x[1][0]), at(x[1][1]));
            return ty.type === 'altInt' && ti === ty.t;
          }
          if (/^Corresponding angles/.test(c)) return ty.type === 'corr';
          return false;
        });
      }
      if ((m = p.match(/Why is ∠(\d+) \+ ∠(\d+) \+ ∠(\d+) = 180°/))) {
        const ms = [m[1], m[2], m[3]].map(k => markByLabel(G.M, k));
        const straight = straightAngle(ms);
        const triangle = ms.every(k => { const f = markForm(T, k); return f; }) && fZero(fAdd(ms.map(k => markForm(T, k)).reduce((s, f) => fAdd(s, f)), fConst(180), -1)) && new Set(ms.map(k => k.v.join())).size === 3;
        return pick(q, c => (/^Together they make a straight angle/.test(c) ? straight : /^They are the three angles of a triangle/.test(c) ? triangle : false));
      }
      return undefined;
    }
    case 'critique': return critique(q);
    // ---------------- polygons (from the stated numbers)
    case 'polyTriangles': { const n = sidesOf(q); return n ? n - 2 : undefined; }
    case 'polySum': { const n = sidesOf(q); return n ? 180 * (n - 2) : undefined; }
    case 'polySides': { const S = sumOf(q); return S / 180 + 2; }
    case 'regAngle': { const n = sidesOf(q); return n ? clean((180 * (n - 2)) / n) : undefined; }
    case 'regSides': { const a = Number(p.match(/is ([\d.]+)°/)[1]); return clean(360 / (180 - a)); }
    case 'regNot': {
      const n = sidesOf(q);
      const S = 180 * (n - 2);
      const equalMarked = /matching arcs mark all the angles/.test(p);
      const asked = p.match(/= ([\d.]+)°(…)?\?/);
      return pick(q, c => {
        let x;
        if (equalMarked) {
          if ((x = c.match(/^Yes: it is regular, so each is ([\d,]+)° ÷ (\d+)$/))) {
            const each = S / n, shown = Number(asked[1]);
            return Number(x[1].replace(/,/g, '')) === S && Number(x[2]) === n && (asked[2] ? Math.floor(each) === shown && each !== shown : each === shown);
          }
          return false;
        }
        if ((x = c.match(/^No: the angles add to ([\d,]+)°, but they need not be equal$/))) return Number(x[1].replace(/,/g, '')) === S;
        return false;
      });
    }
    case 'exprTri': {
      const ex = [...p.matchAll(/m∠([A-Z]) = \(([^)]*)\)°/g)].map(m => ({ n: m[1], f: linX(m[2]) }));
      const A = ex.reduce((s, e) => s + e.f[0], 0), B = ex.reduce((s, e) => s + e.f[1], 0);
      const x = (180 - B) / A;
      const asked = p.match(/largest angle, m∠([A-Z])/)[1];
      const e = ex.find(k => k.n === asked);
      return [clean(x), clean(e.f[0] * x + e.f[1])];
    }
    case 'polyExpr': {
      const n = sidesOf(q);
      const parts = [...texish(q.board).replace(/\{:\}|\{|\}/g, ':').matchAll(/([A-Z])\s*:+\s*([0-9x+\-−\s]+?)(?:\^|,|$|\s*\\)/g)];
      // read from the plain board: "A: 120°, B: 2x, C: 168°"
      const plain = norm(q.board).replace(/\\text\{[^}]*\}/g, '').replace(/\{:\}/g, ':').replace(/\\ /g, ' ').replace(/\^\\circ/g, '°').replace(/[{}\\]/g, '');
      const ex = [...plain.matchAll(/([A-Z]):\s*([0-9x+\- ]+?)\s*(?:°|,|$)/g)].map(m => ({ n: m[1], f: linX(m[2]) }));
      if (ex.length !== n) return undefined;
      const S = 180 * (n - 2);
      const A = ex.reduce((s, e) => s + e.f[0], 0), B = ex.reduce((s, e) => s + e.f[1], 0);
      const x = (S - B) / A;
      const asked = p.match(/m∠([A-Z]) in/)[1];
      const e = ex.find(k => k.n === asked);
      void parts;
      return [clean(x), clean(e.f[0] * x + e.f[1])];
    }
    default: return undefined;
  }
}

// ---------------------------------------------------------------- helpers used above
function transversalByGeometry(L) {
  if (L.length !== 3) return -1;
  const meets = (i, j) => { const P = intersect(L[i], L[j]); return !!P && within(L[i], P) && within(L[j], P); };
  const c = [0, 1, 2].filter(i => [0, 1, 2].every(j => j === i || meets(i, j)));
  return c.length === 1 ? c[0] : -1;
}
function evalDeg(c) {
  const t = norm(c).replace(/°/g, '').replace(/\s+/g, '');
  if (!/^[\d+-]+$/.test(t)) return NaN;
  return [...t.matchAll(/([+-]?)(\d+)/g)].reduce((s, m) => s + (m[1] === '-' ? -1 : 1) * Number(m[2]), 0);
}
function sidesOf(q) {
  const m = norm(q.prompt).match(/\((\d+) (?:sides|equal sides)/) ?? norm(q.board + ' ' + (q.data?.givens ?? []).join(' ')).match(/n = (\d+)/);
  if (m) return Number(m[1]);
  const W = { triangle: 3, quadrilateral: 4, pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8, nonagon: 9, decagon: 10, dodecagon: 12 };
  const w = norm(q.prompt).match(/\b(quadrilateral|pentagon|hexagon|heptagon|octagon|nonagon|decagon|dodecagon)\b/);
  return w ? W[w[1]] : null;
}
function sumOf(q) { const m = norm(q.prompt).match(/(?:add to|gets|is) ([\d,]+)°/); return Number(m[1].replace(/,/g, '')); }
function isExteriorPts(T, V, A, B) { return T.some(X => same(X, V, 2)) && exteriorKind(T, V, A, B); }
function exteriorKind(T, V, A, B) {
  const vi = T.findIndex(X => same(X, V, 2));
  const kind = P => { for (let w = 0; w < 3; w++) { if (w === vi) continue; const d = sub(T[w], V), e = sub(P, V); if (Math.abs(cross(unit(d), unit(e))) < 0.01) return { w, k: dot(d, e) > 0 ? 'in' : 'out' }; } return null; };
  const a = kind(A), b = kind(B);
  // one ray along a side, the other along the OTHER side extended past the vertex (not a straight angle)
  return !!a && !!b && a.w !== b.w && [a.k, b.k].sort().join() === 'in,out';
}
function isExterior(T, m) { return isExteriorPts(T, m.v, add(m.v, m.rays[0].vec), add(m.v, m.rays[1].vec)); }
function virtualMark(L, V, A, B) {
  const rays = [A, B].map(P => { const vec = sub(P, V), li = lineThrough(L, V, P); return { P, vec, line: li, off: li >= 0 && dot(vec, L[li].dir) < 0 ? 180 : 0 }; });
  return { v: V, rays, text: '', s: Math.sign(cross(rays[0].vec, rays[1].vec)) };
}
/** pair type of two marks at two different points joined by a common line (the transversal) */
function pairGeneral(L, a, b) {
  for (const ra of a.rays) for (const rb of b.rays) {
    if (ra.line !== rb.line || ra.line < 0) continue;
    const t = ra.line;
    if (!onLine(L[t], a.v) || !onLine(L[t], b.v)) continue;
    const oa = a.rays.find(r => r !== ra), ob = b.rays.find(r => r !== rb);
    const sa = Math.sign(cross(L[t].dir, oa.vec)), sb = Math.sign(cross(L[t].dir, ob.vec));
    const ia = dot(ra.vec, sub(b.v, a.v)) > 0, ib = dot(rb.vec, sub(a.v, b.v)) > 0;
    let type;
    if (sa === sb) type = ia && ib ? 'ssInt' : !ia && !ib ? 'ssExt' : 'corr';
    else type = ia && ib ? 'altInt' : !ia && !ib ? 'altExt' : 'other';
    return { type, t };
  }
  return { type: 'other', t: -1 };
}
function straightAngle(ms) {
  if (ms.some(m => !m) || new Set(ms.map(m => m.v.map(x => x.toFixed(1)).join())).size !== 1) return false;
  const dirs = [];
  for (const m of ms) for (const r of m.rays) { const u = unit(r.vec); const k = dirs.find(d => same(d.u, u, 0.01)); if (k) k.n++; else dirs.push({ u, n: 1 }); }
  const ends = dirs.filter(d => d.n === 1);
  const sum = ms.reduce((s, m) => s + m.drawn, 0);
  return ends.length === 2 && dot(ends[0].u, ends[1].u) < -0.9999 && Math.abs(sum - 180) < 0.5;
}

/** the first wrong step in a transversal chain */
function transBadStep(q) {
  const F = transFig(q);
  const p = norm(q.prompt);
  const par = isParallel(q);
  const steps = [...p.matchAll(/(\d)\. ∠(\d+) = (\d+)° \(([^)]*)\)/g)].map(m => ({ k: Number(m[1]), a: m[2], v: Number(m[3]), why: m[4] }));
  const given = F.M.find(m => labelVal(m.text) !== null);
  if (!given || steps.length !== 3) return undefined;
  const known = [{ m: given, v: labelVal(given.text) }];
  const NAMES = { 'vertical angles': 'vertical', 'linear pair': 'linear', 'corresponding angles': 'corr', 'alternate interior angles': 'altInt', 'alternate exterior angles': 'altExt', 'same-side interior angles': 'ssInt' };
  let bad = 0;
  for (const s of steps) {
    const a = markByLabel(F.M, s.a);
    const [nameTxt, cond] = s.why.split(/,\s*/);
    const T = NAMES[nameTxt];
    const needsPar = T && !['vertical', 'linear'].includes(T);
    const condOk = !needsPar || (par && cond && /∥/.test(cond));
    const ok = !!a && !!T && condOk && known.some(k => {
      if (pairType(F, a, k.m) !== T) return false;
      const val = ['ssInt', 'linear'].includes(T) ? 180 - k.v : k.v;
      return Math.abs(val - s.v) < 1e-9;
    });
    if (!ok) { bad = s.k; break; }
    known.push({ m: a, v: s.v });
  }
  return pick(q, c => (bad ? c === `Step ${bad}` : /^None/.test(c)));
}
/** the first wrong step in a triangle chain (the claim must hold in the figure, for the reason given) */
function triBadStep(q) {
  const fig = figOf(q), T = triOf(fig), M = marksOf(fig, linesOf(fig));
  const one = resolver(fig, T, M);
  const p = norm(q.prompt);
  const steps = [...p.matchAll(/(\d)\. (∠[^(]*?) \(([^)]*)\)/g)].map(m => ({ k: Number(m[1]), claim: m[2].trim(), why: m[3] }));
  if (steps.length !== 3) return undefined;
  let bad = 0;
  for (const s of steps) {
    const f = eqForm(s.claim, one);
    let ok = !!f && fZero(f);
    const labs = [...s.claim.matchAll(/∠(\d+)/g)].map(m => markByLabel(M, m[1]));
    if (ok && /angles of one triangle/.test(s.why)) ok = labs.length === 3 && labs.every(m => m && formEq(markForm(T, m), interiorAt(T, m.v)));
    if (ok && /linear pair/.test(s.why)) ok = labs.length === 2 && labs.every(Boolean) && same(labs[0].v, labs[1].v, 2);
    if (ok && /vertical angles/.test(s.why)) ok = labs.length === 2 && labs.every(Boolean) && same(labs[0].v, labs[1].v, 2) && labs[0].rays.every(r => labs[1].rays.some(t => t.line === r.line && t.off !== r.off));
    if (ok && /remote interior/.test(s.why)) ok = labs.length === 3 && !!labs[0] && isExterior(T, labs[0]) && labs.slice(1).every(m => m && !same(m.v, labs[0].v, 2) && formEq(markForm(T, m), interiorAt(T, m.v)));
    if (!ok) { bad = s.k; break; }
  }
  return pick(q, c => (bad ? c === `Step ${bad}` : /^None/.test(c)));
}
const formEq = (f, g) => !!f && !!g && fZero(fAdd(f, g, -1));
function interiorAt(T, V) { const vi = T.findIndex(X => same(X, V, 2)); return vi < 0 ? null : formAt(T, V, T[(vi + 1) % 3], T[(vi + 2) % 3]); }

/** what is wrong with a classmate's argument (the four known kinds of argument, judged by what they claim) */
function critique(q) {
  const p = norm(q.prompt);
  const arg = (p.match(/[“"](.*)[”"]/) ?? [])[1] ?? '';
  const before = p.split('“')[0];
  let verdict = null;
  if (/measured|each time/.test(before) || /measured/.test(arg)) verdict = 'examples';
  else if (/looks parallel/.test(arg)) verdict = 'looks';
  else if (/quarter turn/.test(arg) && /keeps a line parallel/.test(arg)) verdict = 'quarter';
  else if (/because (the angles of a triangle add to 180°|an exterior angle equals the sum of the two remote interior angles)/.test(arg) && /triangle’s angles add|triangle's angles add|exterior angle equals the two remote/.test(p)) verdict = 'circular';
  else if (/Slide everything along the transversal/.test(arg)) verdict = /only one is/.test(arg) ? 'ok' : null;
  else if (/drawn through .* parallel to BC\. The angle left of/.test(arg) && /alternate interior/.test(arg)) verdict = 'ok';
  else if (/\(triangle\) and .*\(linear pair\)/.test(arg)) {
    // A + B + ACB = 180 and ACB + ACD = 180: the conclusion must be ACD = A + B
    const concl = (arg.match(/so ∠ACD = ([^.]*)\./i) ?? [])[1] ?? '';
    const terms = concl.split('+').map(s => s.trim()).sort().join();
    const remote = (arg.match(/^∠(\w+) \+ ∠(\w+) \+ ∠ACB/) ?? []).slice(1, 3).map(s => `∠${s}`).sort().join();
    verdict = terms === remote ? 'ok' : /ACB/.test(concl) ? 'extra' : null;
  }
  const want = { examples: /^It only checks examples/, looks: /^It treats a line that only looks parallel/, quarter: /^A quarter turn does not keep a line parallel/, circular: /^It uses the fact it is trying to prove/, ok: /^Nothing: the argument works/, extra: /^The last step adds an extra angle/ }[verdict];
  if (!want) return undefined;
  return pick(q, c => want.test(c));
}

// ================================================================ sane
function sane(q) {
  const out = [];
  const p = norm(q.prompt);
  let s;
  try { s = solve(q); } catch (e) { s = undefined; }
  if (q.input === 'choice' && s === -1) out.push('no single right choice');
  const fig = figOf(q);
  // the drawing must agree with the numbers it carries (the lesson draws every figure true to its measures)
  const fam = q.family;
  if (q.input === 'num' && typeof s === 'number' && fig) {
    const target = (fig.angles ?? []).find(a => a.text === (fam === 'extRemoteMissing' ? 'y' : 'x')) ?? (fam === 'allEight' ? (fig.angles ?? []).find(a => a.text === (p.match(/Find ∠(\d+)/) ?? [])[1]) : null);
    if (target) {
      const drawn = target.reflex ? 360 - angBetween(sub(target.p, target.v), sub(target.q, target.v)) : angBetween(sub(target.p, target.v), sub(target.q, target.v));
      if (Math.abs(drawn - s) > 3) out.push(`the angle is drawn as ${clean(drawn)}°, the numbers make it ${s}°`);
    }
    if (!/^(poly|reg)/.test(fam) && (s <= 0 || s >= 360)) out.push(`an angle of ${s}°`);
  }
  if (q.input === 'num' && /triangle|exterior/.test(fam + p) && typeof s === 'number' && /third|thirdRight|iso/.test(fam) && (s <= 0 || s >= 180)) out.push(`a triangle angle of ${s}°`);
  // over-determined figures whose numbers do not fit
  if (fig && ['third', 'thirdRight', 'isoBase', 'isoApex', 'extValue', 'extRemoteMissing', 'chainTri', 'chainExt', 'zigzag', 'pairValue', 'allEight'].includes(fam)) {
    try {
      const G = genFig(q);
      const kn = new Map();
      for (const m of G.M) { const v = labelVal(m.text); if (v !== null) kn.set(m, v); if (m.box) kn.set(m, 90); }
      const T = triOf(G.fig);
      if (T) {
        // the triangle's own labelled interior angles must leave room for the rest
        const inner = G.M.filter(m => labelVal(m.text) !== null && formEq(markForm(T, m), interiorAt(T, m.v)));
        const sum = inner.reduce((t, m) => t + labelVal(m.text), 0);
        if (inner.length === 3 && sum !== 180) out.push(`the labelled angles add to ${sum}°`);
        if (inner.length < 3 && sum >= 180) out.push(`two labelled angles already make ${sum}°`);
        const ext = G.M.find(m => labelVal(m.text) !== null && isExterior(T, m));
        if (ext && labelVal(ext.text) >= 180) out.push('an exterior angle of 180° or more');
      }
    } catch { /* figure without a triangle */ }
  }
  // integers a student can reach
  if (fam === 'regSides' && typeof s === 'number' && !Number.isInteger(s)) out.push('no regular polygon has that angle');
  if (fam === 'polySides' && typeof s === 'number' && (!Number.isInteger(s) || s < 3)) out.push('no polygon has that angle sum');
  if ((fam === 'exprPair' || fam === 'exprTri' || fam === 'polyExpr') && Array.isArray(s)) {
    if (!(s[1] > 0 && s[1] < 360)) out.push(`an angle of ${s[1]}°`);
    if (fam === 'exprTri') {
      const ex = [...p.matchAll(/m∠([A-Z]) = \(([^)]*)\)°/g)].map(m => { const f = linX(m[2]); return { n: m[1], v: f[0] * s[0] + f[1] }; });
      if (ex.some(e => e.v <= 0)) out.push('a triangle angle of 0° or less');
      const asked = (p.match(/largest angle, m∠([A-Z])/) ?? [])[1];
      const mx = Math.max(...ex.map(e => e.v));
      if (asked && ex.find(e => e.n === asked)?.v !== mx) out.push('the angle called the largest is not the largest');
      if (asked && ex.filter(e => e.v === mx).length > 1) out.push('two angles share the largest size');
    }
    if (fam === 'polyExpr') {
      const plain = norm(q.board).replace(/\\text\{[^}]*\}/g, '').replace(/\{:\}/g, ':').replace(/\\ /g, ' ').replace(/\^\\circ/g, '°').replace(/[{}\\]/g, '');
      const ex = [...plain.matchAll(/([A-Z]):\s*([0-9x+\- ]+?)\s*(?:°|,|$)/g)].map(m => { const f = linX(m[2]); return f[0] * s[0] + f[1]; });
      if (ex.some(v => v <= 0 || v >= 180)) out.push('a convex polygon angle outside 0°–180°');
    }
    if (fam === 'exprPair' && !Number.isInteger(s[0])) out.push(`x = ${s[0]} is not a whole number`);
  }
  // a figure whose parallel marks contradict the text
  if (fig && /Nothing says the lines are parallel|NOT given as parallel|NOT marked parallel/.test(p) && (fig.segs ?? []).some(g => g.par)) out.push('the text says nothing is parallel, but the figure marks parallel lines');
  if (fam === 'tcWhichTrans' && fig) { const L = linesOf(fig); if (transversalByGeometry(L) < 0) out.push('more than one line crosses the other two in the drawing'); }
  if (fam === 'polyTriangles' || fam === 'polySum' || fam === 'regAngle' || fam === 'regNot' || fam === 'polyExpr') {
    const body = (fig?.fills ?? []).find(f => f.id === 'body');
    const n = sidesOf(q);
    if (body && n && body.pts.length !== n) out.push(`the drawing has ${body.pts.length} corners, the text says ${n}`);
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
