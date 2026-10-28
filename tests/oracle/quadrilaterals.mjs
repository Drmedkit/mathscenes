// Oracle for the lesson "quadrilaterals" (Geometry: parallelograms and other quadrilaterals). Written from what the
// student sees only: the prompt, the board, the choices, the drawn figure (named points, segments with tick marks and
// arrowheads, right-angle boxes, angle arcs, number labels), the Euler tokens, the family tree's hidden node, the card
// and the proof frame. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
//
// Conventions (DESIGN.md, and the items state them): a trapezoid has AT LEAST one pair of parallel sides; a kite is a
// convex quadrilateral with two pairs of adjacent congruent sides; an isosceles trapezoid is a trapezoid with congruent
// legs that is NOT a parallelogram.
//
// How it decides:
// - Figures are classified from their MARKS only: equal tick groups, equal arrowhead groups (parallel), boxes (90°),
//   equal arc groups, diagonal halves with ticks, a box where the diagonals cross. The marks give facts (equal sides,
//   parallel pairs, right angles, ...), the tests close them (both pairs of opposite sides congruent / parallel, one
//   pair both, bisecting diagonals, opposite angles; a parallelogram with a right angle / congruent diagonals is a
//   rectangle; with two congruent consecutive sides / perpendicular diagonals / a diagonal bisecting an angle a
//   rhombus; ...) and the class is the most specific one the facts guarantee. How the shape looks never counts.
// - Class and condition questions (every / all / some / no, necessary, sufficient, the stated universe, converses,
//   counterexamples) are judged on a catalogue of exact shapes built here (squares, rectangles, rhombuses,
//   parallelograms, kites, isosceles / right / plain trapezoids, quadrilaterals with special diagonals): a "no" needs
//   a shape in the catalogue, a counterexample description must work for EVERY shape it describes.
// - Numbers: a model of the class is built (rectangle from its side ratio, rhombus from its angle, isosceles
//   trapezoid from its base angle, kite from its axis) and solved for the given angle; the asked angle / length is then
//   measured. Lengths: the ratio asked / given must be the same in every member of the class, otherwise "not enough
//   information". Algebra (opposite sides, consecutive angles, test conditions, the midsegment) is solved exactly.
// - Proofs: every line is checked against the givens and the lines above it (alternate interior / same-side /
//   vertical angles are checked on the drawn points, triangle congruences part by part from known facts, CPCTC needs
//   a congruence above with matching parts, a theorem is never a reason inside its own proof).
// - sane(q): relabelled words (a letter where "A", "one" or "part" stood), impossible angle sums, nonpositive results.

import { nums, round } from '../../tools/quality/oracle-kit.mjs';

// =====================================================================================================================
// text
const OV = /[̅]/g;
const plain = s => String(s ?? '').replace(OV, '').replace(/−/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/½/g, '1/2').replace(/\s+/g, ' ').trim();
const low = s => plain(s).toLowerCase();
const skey = n => n.split('').sort().join('');
function tex(t) {
  let s = String(t ?? '');
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\(?:overline|overleftrightarrow)\{([^{}]*)\}/g, '$1').replace(/\\text\{([^{}]*)\}/g, ' $1 ')
      .replace(/\\t?frac\{(\d)\}\{(\d)\}/g, '$1/$2').replace(/\\t?frac(\d)(\d)/g, '$1/$2');
  }
  s = s.replace(/\\angle\s*/g, '∠').replace(/\\triangle\s*/g, '△').replace(/\\cong/g, '≅').replace(/\\parallel/g, '∥').replace(/\\perp/g, '⊥')
    .replace(/\^\{?\\circ\}?/g, '°').replace(/\\[,;: !]|\\quad|\\qquad|~/g, ' ').replace(/[{}]/g, '').replace(/\\[a-zA-Z]+/g, ' ');
  return plain(s).replace(/\s*,\s*/g, ', ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
}
const choiceIdx = (q, pred) => { const h = (q.choices ?? []).map((c, i) => (pred(plain(c), i) ? i : -1)).filter(i => i >= 0); return h.length === 1 ? h[0] : -1; };
const CONV = /Here a trapezoid has at least one pair of parallel sides, and a kite has two pairs of adjacent congruent sides\. |An isosceles trapezoid here is a trapezoid with congruent legs that is not a parallelogram\. /g;
const body = q => plain(q.prompt).replace(CONV, '');

// =====================================================================================================================
// vectors
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = a => Math.hypot(a[0], a[1]);
const dist = (a, b) => len(sub(a, b));
const unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const near = (a, b, e = 1.5) => !!a && !!b && Math.abs(a[0] - b[0]) < e && Math.abs(a[1] - b[1]) < e;
const angDeg = (d1, d2) => (Math.acos(Math.max(-1, Math.min(1, dot(unit(d1), unit(d2))))) * 180) / Math.PI;
const angAt = (V, P, Q) => angDeg(sub(P, V), sub(Q, V));
const onLine = (P, A, B, e = 1.5) => Math.abs(cross(sub(B, A), sub(P, A))) / (dist(A, B) || 1) < e;
const lineMeet = (A, B, C, D) => { const r = sub(B, A), s = sub(D, C), den = cross(r, s); if (Math.abs(den) < 1e-12) return null; return add(A, mul(r, cross(sub(C, A), s) / den)); };
const rad = d => (d * Math.PI) / 180;
const clean = v => Math.round(v * 1e6) / 1e6;

// =====================================================================================================================
// classes: hierarchy and a catalogue of exact shapes
const CLASSES = ['square', 'rectangle', 'rhombus', 'parallelogram', 'kite', 'isosceles trapezoid', 'trapezoid', 'quadrilateral'];
const UP = { square: ['rectangle', 'rhombus'], rectangle: ['parallelogram'], rhombus: ['parallelogram', 'kite'], parallelogram: ['trapezoid'], kite: ['quadrilateral'], trapezoid: ['quadrilateral'], 'isosceles trapezoid': ['trapezoid'], quadrilateral: [] };
const ancestors = c => { const out = new Set([c]); const st = [c]; while (st.length) for (const u of UP[st.pop()] ?? []) if (!out.has(u)) { out.add(u); st.push(u); } return out; };
const className = s => { const t = low(s).replace(/^(an?|the) /, '').replace(/es$|s$/, m => (m === 'es' ? '' : '')).trim(); return CLASSES.find(c => c === t || c + 'es' === low(s) || c === low(s).replace(/^(an?|the) /, '').replace(/(es|s)$/, '')) ?? null; };
function classOfWord(w) {
  let t = low(w).replace(/^(an?|the|every|all|no|some) /, '').trim();
  const map = { squares: 'square', rectangles: 'rectangle', rhombuses: 'rhombus', rhombi: 'rhombus', parallelograms: 'parallelogram', kites: 'kite', trapezoids: 'trapezoid', 'isosceles trapezoids': 'isosceles trapezoid', quadrilaterals: 'quadrilateral' };
  if (map[t]) return map[t];
  return CLASSES.includes(t) ? t : null;
}

function feat(V) {
  const s = [0, 1, 2, 3].map(i => dist(V[i], V[(i + 1) % 4]));
  const ang = [0, 1, 2, 3].map(i => angAt(V[i], V[(i + 3) % 4], V[(i + 1) % 4]));
  const E = lineMeet(V[0], V[2], V[1], V[3]);
  const d0 = dist(V[0], V[2]), d1 = dist(V[1], V[3]);
  const eqv = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, a, b);
  const par02 = Math.abs(cross(sub(V[1], V[0]), sub(V[2], V[3]))) < 1e-9 * s[0] * s[2] * 10;
  const par13 = Math.abs(cross(sub(V[2], V[1]), sub(V[3], V[0]))) < 1e-9 * s[1] * s[3] * 10;
  const right = ang.map(a => Math.abs(a - 90) < 1e-6);
  const f = { s, ang, d0, d1, E, par02, par13, right, eqv };
  f.bis0 = eqv(dist(V[0], E), dist(E, V[2])); f.bis1 = eqv(dist(V[1], E), dist(E, V[3]));
  f.perp = Math.abs(dot(sub(V[2], V[0]), sub(V[3], V[1]))) < 1e-9 * d0 * d1 * 10;
  f.congDiag = eqv(d0, d1);
  const C = {};
  C.quadrilateral = true;
  C.parallelogram = par02 && par13;
  C.trapezoid = par02 || par13;
  C.rectangle = right.every(Boolean);
  C.rhombus = eqv(s[0], s[1]) && eqv(s[1], s[2]) && eqv(s[2], s[3]);
  C.square = C.rectangle && C.rhombus;
  C.kite = (eqv(s[0], s[1]) && eqv(s[2], s[3])) || (eqv(s[1], s[2]) && eqv(s[3], s[0]));
  C['isosceles trapezoid'] = C.trapezoid && !C.parallelogram && (par02 ? eqv(s[1], s[3]) : eqv(s[0], s[2]));
  f.C = C;
  return f;
}
const CONDS = [
  [/^(?:both pairs of )?opposite sides parallel$|^both pairs of opposite sides parallel$/, f => f.C.parallelogram],
  [/^(?:at least )?one pair of (?:opposite sides )?parallel(?: sides)?$|^one pair of opposite sides parallel$|^at least one pair of parallel sides$/, f => f.C.trapezoid],
  [/^exactly one pair of parallel sides$/, f => f.par02 !== f.par13],
  [/^congruent diagonals$|^equal diagonals$/, f => f.congDiag],
  [/^perpendicular diagonals$/, f => f.perp],
  [/^diagonals that bisect each other$/, f => f.bis0 && f.bis1],
  [/^diagonals that are perpendicular bisectors of each other$/, f => f.perp && f.bis0 && f.bis1],
  [/^congruent diagonals that bisect each other$/, f => f.congDiag && f.bis0 && f.bis1],
  [/^congruent, perpendicular diagonals that bisect each other$/, f => f.congDiag && f.perp && f.bis0 && f.bis1],
  [/^congruent,? perpendicular diagonals$|^equal,? perpendicular diagonals$/, f => f.congDiag && f.perp],
  [/^four congruent sides$/, f => f.C.rhombus],
  [/^four right angles$/, f => f.C.rectangle],
  [/^(?:at least one|one|a) right angle$/, f => f.right.some(Boolean)],
  [/^four congruent sides and a right angle$/, f => f.C.rhombus && f.right.some(Boolean)],
  [/^both pairs of opposite sides congruent$/, f => f.eqv(f.s[0], f.s[2]) && f.eqv(f.s[1], f.s[3])],
  [/^both pairs of opposite angles congruent$/, f => f.eqv(f.ang[0], f.ang[2]) && f.eqv(f.ang[1], f.ang[3])],
  [/^one pair of opposite sides both parallel and congruent$/, f => (f.par02 && f.eqv(f.s[0], f.s[2])) || (f.par13 && f.eqv(f.s[1], f.s[3]))],
  [/^one pair of opposite sides parallel and the other pair congruent$/, f => (f.par02 && f.eqv(f.s[1], f.s[3])) || (f.par13 && f.eqv(f.s[0], f.s[2]))],
  [/^two congruent consecutive sides$|^two consecutive congruent sides$/, f => [0, 1, 2, 3].some(i => f.eqv(f.s[i], f.s[(i + 1) % 4]))],
  [/^two pairs of adjacent congruent sides$/, f => f.C.kite],
];
function condOf(phrase) {
  let t = low(phrase).replace(/^(having|has|have|with) /, '').replace(/^being (an?) /, '').replace(/^(is|being) (an?) /, '').replace(/[.]$/, '').trim();
  const c = classOfWord(t);
  if (c) return f => f.C[c];
  for (const [re, fn] of CONDS) if (re.test(t)) return fn;
  return null;
}

// the catalogue
const P = (...xy) => xy;
const rh = (a, th) => P([0, 0], [a, 0], [a + a * Math.cos(rad(th)), a * Math.sin(rad(th))], [a * Math.cos(rad(th)), a * Math.sin(rad(th))]);
const byDiag = (a, c, b, d, phi) => { const u = [Math.cos(rad(phi)), Math.sin(rad(phi))]; return P([-a, 0], mul(u, b), [c, 0], mul(u, -d)); };
const W = {
  'a square': [P([0, 0], [2, 0], [2, 2], [0, 2]), rh(3, 90)],
  'a rectangle that is not a square': [P([0, 0], [3, 0], [3, 2], [0, 2]), P([0, 0], [5, 0], [5, 1], [0, 1])],
  'a rhombus that is not a square': [rh(2, 60), rh(2, 70), rh(3, 115)],
  'a parallelogram with no right angle and unequal sides': [P([0, 0], [4, 0], [5, 2], [1, 2]), P([0, 0], [5, 0], [7, 3], [2, 3])],
  'a kite that is not a rhombus': [P([0, 0], [1, 1], [4, 0], [1, -1]), P([0, 0], [1, 2], [5, 0], [1, -2]), P([0, 0], [1, 2], [4, 0], [1, -2]), P([0, 0], [2, 1], [6, 0], [2, -1])],
  'a kite with congruent diagonals': [P([0, 0], [1, 2], [4, 0], [1, -2]), P([0, 0], [2, 3], [6, 0], [2, -3])],
  'an isosceles trapezoid': [P([0, 0], [6, 0], [4, 2], [2, 2]), P([0, 0], [4, 0], [3, 3], [1, 3]), P([-3, 0], [3, 0], [1, 4], [-1, 4])],
  'a trapezoid with one right angle': [P([0, 0], [4, 0], [3, 2], [0, 2]), P([0, 0], [5, 0], [5, 3], [2, 3])],
  // a right trapezoid: exactly one pair of parallel sides, the leg between them perpendicular to both (two right angles)
  'a trapezoid with two right angles': [P([0, 0], [6, 0], [4, 3], [0, 3]), P([0, 0], [3, 0], [3, 4], [-2, 4]), P([0, 0], [2, 0], [2, 2], [-3, 2])],
  'a trapezoid that is not isosceles': [P([0, 0], [6, 0], [5, 2], [1.5, 2])],
  'a quadrilateral with no special marks': [P([0, 0], [5, 0], [4, 3], [1, 2]), P([0, 0], [4, 0], [3, 3], [0, 2])],
  'a quadrilateral with special diagonals': [byDiag(2, 3, 1, 4, 90), byDiag(2, 3, 1, 2, 90), byDiag(2, 3, 1, 4, 70), byDiag(2, 3, 1.5, 3.5, 90)],
};
W['a rectangle'] = [...W['a rectangle that is not a square'], ...W['a square']];
W['a rhombus'] = [...W['a rhombus that is not a square'], ...W['a square']];
W['a parallelogram'] = [...W['a parallelogram with no right angle and unequal sides'], ...W['a rectangle'], ...W['a rhombus that is not a square']];
W['a kite'] = [...W['a kite that is not a rhombus'], ...W['a rhombus']];
W['a trapezoid'] = [...W['an isosceles trapezoid'], ...W['a trapezoid with one right angle'], ...W['a trapezoid that is not isosceles'], ...W['a parallelogram']];
const ALL = Object.values(W).flat();
const CAT = ALL.map(feat);
const witnessSet = d => { const t = low(d).replace(/^(an?) /, m => m).trim(); const k = Object.keys(W).find(x => x === t); return k ? W[k].map(feat) : null; };
const every = (A, B) => CAT.every(f => !A(f) || B(f));
const someF = (A, B) => CAT.some(f => A(f) && B(f));
const cls = c => f => f.C[c];
/** a description like "a rectangle that is not a square" → its shapes (from the catalogue when not a stored witness) */
function describe(d) {
  const t = low(d).trim();
  const w = witnessSet(t);
  if (w) return w;
  let m = t.match(/^an? (.+?) that is not an? (.+)$/);
  if (m && classOfWord(m[1]) && classOfWord(m[2])) return CAT.filter(f => f.C[classOfWord(m[1])] && !f.C[classOfWord(m[2])]);
  m = t.match(/^an? (.+)$/);
  if (m && classOfWord(m[1])) return CAT.filter(f => f.C[classOfWord(m[1])]);
  return null;
}

// =====================================================================================================================
// the figure and its marks
function figOf(f) {
  if (!f) return null;
  const pts = {};
  for (const p of f.points ?? []) if (p.name) pts[p.name] = p.at;
  const nameAt = xy => Object.keys(pts).find(n => near(pts[n], xy, 0.5));
  const segs = (f.segs ?? []).map(s => ({ ...s, A: nameAt(s.a), B: nameAt(s.b) }));
  const angs = (f.angles ?? []).map(a => ({ ...a, V: nameAt(a.v), P: nameAt(a.p), Q: nameAt(a.q) }));
  return { pts, segs, angs, fills: f.fills };
}
const figQ = q => figOf(q.data?.picture?.fig);
/** vertex coordinates of the quadrilateral named `name` (or the fill polygon) */
function quadVerts(F, name) {
  if (name && name.split('').every(c => F.pts[c])) return name.split('').map(c => F.pts[c]);
  if (F.fills?.[0]?.pts?.length === 4) return F.fills[0].pts;
  // chain the segments
  return null;
}
function uf() { const p = {}; const f = x => (p[x] === undefined || p[x] === x ? (p[x] = x) : (p[x] = f(p[x]))); return { find: f, union: (a, b) => { p[f(a)] = f(b); }, same: (a, b) => f(a) === f(b) }; }

/** facts from the marks of a quadrilateral figure */
function marksOf(F, V) {
  const E = lineMeet(V[0], V[2], V[1], V[3]);
  const isPt = (xy, P) => near(xy, P, 0.6);
  const roleSeg = s => {
    for (let i = 0; i < 4; i++) {
      const a = V[i], b = V[(i + 1) % 4];
      if ((isPt(s.a, a) && isPt(s.b, b)) || (isPt(s.a, b) && isPt(s.b, a))) return 's' + i;
    }
    for (let i = 0; i < 2; i++) { const a = V[i], b = V[i + 2]; if ((isPt(s.a, a) && isPt(s.b, b)) || (isPt(s.a, b) && isPt(s.b, a))) return 'd' + i; }
    if (E) for (let i = 0; i < 4; i++) if ((isPt(s.a, V[i]) && isPt(s.b, E)) || (isPt(s.b, V[i]) && isPt(s.a, E))) return 'h' + i;
    return null;
  };
  const sameDir = (d1, d2) => angDeg(d1, d2) < 0.8;
  const roleAng = a => {
    for (let i = 0; i < 4; i++) {
      if (!isPt(a.v, V[i])) continue;
      const prev = sub(V[(i + 3) % 4], V[i]), next = sub(V[(i + 1) % 4], V[i]), dg = sub(V[(i + 2) % 4], V[i]);
      const r1 = sub(a.p, a.v), r2 = sub(a.q, a.v);
      const has = (x, y) => (sameDir(r1, x) && sameDir(r2, y)) || (sameDir(r1, y) && sameDir(r2, x));
      if (has(prev, next)) return 'A' + i;
      if (has(next, dg)) return 'n' + i;
      if (has(prev, dg)) return 'b' + i;
      return null;
    }
    if (E && isPt(a.v, E)) {
      const r1 = sub(a.p, a.v), r2 = sub(a.q, a.v);
      const onD0 = r => Math.abs(cross(unit(r), unit(sub(V[2], V[0])))) < 0.02, onD1 = r => Math.abs(cross(unit(r), unit(sub(V[3], V[1])))) < 0.02;
      if ((onD0(r1) && onD1(r2)) || (onD1(r1) && onD0(r2))) return 'X';
    }
    return null;
  };
  const L = uf(), A = uf();
  const par = [];
  const right = [false, false, false, false];
  let perp = false;
  const tick = {}, arcs = {}, pars = {};
  const angVal = {}, segVal = {};
  for (const s of F.segs) {
    const r = roleSeg(s);
    if (!r) continue;
    if (s.ticks > 0) (tick[s.ticks] ??= []).push(r);
    if (s.par > 0) (pars[s.par] ??= []).push(r);
    if (s.text !== undefined) segVal[r] = s.text;
  }
  for (const a of F.angs) {
    const r = roleAng(a);
    if (!r) continue;
    if (a.box) { if (r[0] === 'A') right[+r[1]] = true; if (r === 'X') perp = true; }
    if (a.arcs > 0) (arcs[a.arcs] ??= []).push(r);
    if (a.text !== undefined) angVal[r] = a.text;
  }
  for (const g of Object.values(tick)) for (const r of g.slice(1)) L.union(r, g[0]);
  for (const g of Object.values(arcs)) for (const r of g.slice(1)) A.union(r, g[0]);
  for (const g of Object.values(pars)) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) par.push([g[i], g[j]]);
  return { V, E, L, A, par, right, perp, tick, arcs, pars, angVal, segVal, roleSeg, roleAng };
}
/** what the marks guarantee: { P, R, Rh, K, T, S } and the set of names */
function classify(M) {
  const { L, A } = M;
  const parS = new Set(M.par.map(([a, b]) => [a, b].sort().join('|')));
  const isPar = (i, j) => parS.has(['s' + i, 's' + j].sort().join('|'));
  const right = M.right.slice();
  let perp = M.perp;
  const eq = (a, b) => L.same(a, b);
  const f = { P: false, R: false, Rh: false, K: false, T: false };
  const bis = () => eq('h0', 'h2') && eq('h1', 'h3');
  for (let it = 0; it < 6; it++) {
    const p02 = isPar(0, 2), p13 = isPar(1, 3);
    if ((p02 && p13) || (eq('s0', 's2') && eq('s1', 's3')) || (p02 && eq('s0', 's2')) || (p13 && eq('s1', 's3'))
      || (A.same('A0', 'A2') && A.same('A1', 'A3')) || bis() || right.filter(Boolean).length >= 3) f.P = true;
    if (f.K && f.T) f.P = true;
    if (f.P) {
      L.union('s0', 's2'); L.union('s1', 's3'); parS.add('s0|s2'); parS.add('s1|s3');
      A.union('A0', 'A2'); A.union('A1', 'A3'); L.union('h0', 'h2'); L.union('h1', 'h3');
      if (right.some(Boolean)) { right.fill(true); f.R = true; }
      if (eq('d0', 'd1') || (eq('h0', 'h1'))) { f.R = true; right.fill(true); }
      if ([0, 1, 2, 3].some(i => eq('s' + i, 's' + ((i + 1) % 4))) || perp || [0, 1, 2, 3].some(i => A.same('n' + i, 'b' + i))) f.Rh = true;
      if (f.K) f.Rh = true;
    }
    if (right.every(Boolean)) { f.R = true; f.P = true; }
    if (f.R) { L.union('d0', 'd1'); }
    if ([0, 1, 2, 3].every(i => eq('s0', 's' + i))) { f.Rh = true; f.P = true; }
    if (f.Rh) { for (let i = 1; i < 4; i++) L.union('s' + i, 's0'); perp = true; f.K = true; }
    if ((eq('s0', 's1') && eq('s2', 's3')) || (eq('s1', 's2') && eq('s3', 's0'))) f.K = true;
    if (perp && (eq('h0', 'h2') || eq('h1', 'h3'))) f.K = true;
    if (isPar(0, 2) || isPar(1, 3) || f.P || [0, 1, 2, 3].some(i => right[i] && right[(i + 1) % 4])) f.T = true;
  }
  f.S = f.R && f.Rh;
  const names = new Set(['quadrilateral']);
  if (f.S) names.add('square');
  if (f.R) names.add('rectangle');
  if (f.Rh) names.add('rhombus');
  if (f.P) names.add('parallelogram');
  if (f.K) names.add('kite');
  if (f.T) names.add('trapezoid');
  f.names = names;
  f.right = right; f.perp = perp;
  return f;
}
const SPEC = ['square', 'rectangle', 'rhombus', 'parallelogram', 'kite', 'trapezoid', 'quadrilateral'];
function mostSpecificOf(names) {
  const cand = [...names].filter(c => ![...names].some(d => d !== c && ancestors(d).has(c)));
  return cand.length === 1 ? cand[0] : null;
}
function classifyQ(q, name) {
  const F = figQ(q);
  if (!F) return null;
  const V = quadVerts(F, name);
  if (!V) return null;
  const M = marksOf(F, V);
  return { F, V, M, C: classify(marksOf(F, V)) }; // classify closes (mutates) its own copy of the marks
}
const quadName = q => { const m = body(q).match(/\b([A-Z]{4})\b/); return m ? m[1] : null; };

// =====================================================================================================================
// models: exact members of a class with the given vertex names (+ the diagonal point)
function modelPts(kind, p, names, E) {
  let V;
  if (kind === 'rectangle') V = P([0, 0], [1, 0], [1, p], [0, p]);
  else if (kind === 'square') V = P([0, 0], [1, 0], [1, 1], [0, 1]);
  else if (kind === 'rhombus') V = rh(1, p);
  else if (kind === 'parallelogram') V = P([0, 0], [4, 0], [4 + p * Math.cos(rad(70)), p * Math.sin(rad(70))], [p * Math.cos(rad(70)), p * Math.sin(rad(70))]);
  else if (kind === 'isotrap') { const d = 1 / Math.tan(rad(p)); V = P([0, 0], [10, 0], [10 - d, 1], [d, 1]); }
  else if (kind === 'kite0') V = P([0, 0], [1, p], [4, 0], [1, -p]); // apexes at vertices 0 and 2
  else return null;
  const out = {};
  names.split('').forEach((n, i) => { out[n] = V[i]; });
  if (E) out[E] = lineMeet(V[0], V[2], V[1], V[3]);
  return out;
}
const PARAM = { rectangle: [0.05, 20], rhombus: [1, 179], parallelogram: [0.5, 8], isotrap: [11.5, 168.5], kite0: [0.05, 20] };
const SAMPLES = { rectangle: [0.6, 1.7, 3.1], square: [1], rhombus: [55, 72, 118], parallelogram: [1.3, 2.2, 5.5], isotrap: [50, 63, 112], kite0: [0.7, 1.4, 2.6] };
const angN = (pts, n) => angAt(pts[n[1]], pts[n[0]], pts[n[2]]);
const segN = (pts, n) => dist(pts[n[0]], pts[n[1]]);
/** parameters of the family where angle `given` measures `val` */
function solveParam(kind, names, E, given, val) {
  const [lo, hi] = PARAM[kind] ?? [];
  if (lo === undefined) return [];
  const g = p => { const pts = modelPts(kind, p, names, E); return angN(pts, given) - val; };
  const out = [];
  const N = 400;
  let pp = lo, gp = g(lo);
  for (let k = 1; k <= N; k++) {
    const pq = lo + ((hi - lo) * k) / N, gq = g(pq);
    if (Math.abs(gq) < 1e-12) out.push(pq);
    else if (gp * gq < 0) { let a = pp, b = pq, ga = gp; for (let t = 0; t < 80; t++) { const m = (a + b) / 2, gm = g(m); if (ga * gm <= 0) b = m; else { a = m; ga = gm; } } out.push((a + b) / 2); }
    pp = pq; gp = gq;
  }
  return out;
}
/** the asked angle in the class, given one angle; null when the class leaves it open or the angle is impossible */
function chaseAngle(kind, names, E, given, val, asked) {
  if (kind === 'square') { const pts = modelPts('square', 0, names, E); return !given || Math.abs(angN(pts, given) - val) < 1e-6 ? clean(angN(pts, asked)) : null; }
  const ps = given ? solveParam(kind, names, E, given, val) : SAMPLES[kind];
  if (!ps.length) return null;
  const vals = ps.map(p => clean(angN(modelPts(kind, p, names, E), asked)));
  return vals.every(v => Math.abs(v - vals[0]) < 1e-4) ? vals[0] : null;
}
/** asked length / given length in the class, or null when it varies */
function lengthRatio(kind, names, E, given, asked) {
  const ps = SAMPLES[kind];
  const r = ps.map(p => { const pts = modelPts(kind, p, names, E); return segN(pts, asked) / segN(pts, given); });
  return r.every(x => Math.abs(x - r[0]) < 1e-6) ? clean(r[0]) : null;
}
const kindOf = C => (C.S ? 'square' : C.R ? 'rectangle' : C.Rh ? 'rhombus' : C.P ? 'parallelogram' : null);

// =====================================================================================================================
// numbers in labels
const numOf = t => { const m = plain(t).match(/-?\d+(?:\.\d+)?/); return m ? Number(m[0]) : null; };
/** a linear expression "4x + 9", "(5x − 2)°", "x", "15" → [a, b] */
function lin(s) {
  const t = plain(s).replace(/[()°\s]/g, '').replace(/(cm|ft|in\.?|m)$/, '');
  if (!t || !/^[-+\dx.]+$/.test(t)) return null;
  let a = 0, b = 0;
  for (const m of t.matchAll(/([+-]?)(\d*\.?\d*)(x?)/g)) {
    if (!m[0]) continue;
    const sg = m[1] === '-' ? -1 : 1;
    if (m[3]) a += sg * (m[2] === '' ? 1 : Number(m[2]));
    else if (m[2] !== '') b += sg * Number(m[2]);
  }
  return [a, b];
}
const val = (e, x) => e[0] * x + e[1];
const solveLin = (e1, k1, e2, k2, c = 0) => { const a = k1 * e1[0] - k2 * e2[0], b = k2 * e2[1] - k1 * e1[1] + c; return Math.abs(a) < 1e-12 ? NaN : b / a; }; // k1·e1 = k2·e2 + c

// =====================================================================================================================
// families: marks
function markRead(q) {
  const p = body(q);
  const name = quadName(q);
  const X = classifyQ(q, name);
  const F = X.F;
  const segRole = n => X.M.roleSeg({ a: F.pts[n[0]], b: F.pts[n[1]] });
  const segOf = n => F.segs.find(s => s.A && s.B && skey(s.A + s.B) === skey(n));
  let m, ans = 2;
  if ((m = p.match(/is "([A-Z]{2}) ≅ ([A-Z]{2})" given/))) {
    const a = segOf(m[1]), b = segOf(m[2]);
    if (a?.ticks > 0 && a.ticks === b?.ticks) ans = 0;
  } else if ((m = p.match(/is "([A-Z]{2}) ∥ ([A-Z]{2})" given/))) {
    const a = segOf(m[1]), b = segOf(m[2]);
    const ra = segRole(m[1]), rb = segRole(m[2]);
    if (a?.par > 0 && a.par === b?.par) ans = 0;
    else if (ra && rb && ra[0] === 's' && rb[0] === 's' && Math.abs(+ra[1] - +rb[1]) % 2 === 1) ans = 1; // consecutive sides meet
  } else if ((m = p.match(/is "([A-Z]{2}) ⊥ ([A-Z]{2})" given/))) {
    const l1 = [F.pts[m[1][0]], F.pts[m[1][1]]], l2 = [F.pts[m[2][0]], F.pts[m[2][1]]];
    for (const a of F.angs) {
      if (!a.box) continue;
      const r1 = sub(a.p, a.v), r2 = sub(a.q, a.v);
      const on = (r, l) => Math.abs(cross(unit(r), unit(sub(l[1], l[0])))) < 0.02 && onLine(a.v, l[0], l[1]);
      if ((on(r1, l1) && on(r2, l2)) || (on(r1, l2) && on(r2, l1))) ans = 0;
    }
  } else if ((m = p.match(/is "∠([A-Z]{1,3}) is a right angle" given/))) {
    const vx = m[1].length === 3 ? m[1][1] : m[1];
    const r = X.M.V.findIndex(v => near(v, F.pts[vx], 0.5));
    if (X.M.right[r]) ans = 0;
    const t = X.M.angVal['A' + r];
    if (t !== undefined && numOf(t) !== null && numOf(t) !== 90) ans = 1;
  } else return undefined;
  return ans;
}
function markMeaning(q) {
  const p = body(q);
  let m;
  if ((m = p.match(/arrowheads on ([A-Z]{2}) and ([A-Z]{2})/))) return choiceIdx(q, c => c === `${m[1]} ∥ ${m[2]}`);
  if ((m = p.match(/(?:double |single |triple )?ticks on ([A-Z]{2}) and ([A-Z]{2})/))) return choiceIdx(q, c => c === `${m[1]} ≅ ${m[2]}`);
  if ((m = p.match(/box at ([A-Z])/))) return choiceIdx(q, c => new RegExp(`^m∠[A-Z]${m[1]}[A-Z] = 90°$`).test(c));
  return undefined;
}

// definitions
const DEF = {
  parallelogram: /^a quadrilateral with both pairs of opposite sides parallel$/,
  rhombus: /^a quadrilateral with four congruent sides$/,
  rectangle: /^a quadrilateral with four right angles$/,
  square: /^a quadrilateral with four right angles and four congruent sides$/,
  kite: /^a convex quadrilateral with two pairs of adjacent congruent sides$/,
  trapezoid: /^a quadrilateral with at least one pair of parallel sides$/,
};
function defPick(q) {
  const m = body(q).match(/definition of an? ([a-z ]+?):/);
  const c = m && classOfWord(m[1]);
  return c && DEF[c] ? choiceIdx(q, t => DEF[c].test(t)) : undefined;
}
function defGallery(q) {
  const m = body(q).match(/marked as an? ([a-z ]+?) \(/);
  const c = m && classOfWord(m[1]);
  const g = q.data?.picture?.gallery;
  if (!c || !g) return undefined;
  const hits = g.figs.map((f, i) => { const F = figOf(f); const V = F.fills[0].pts; return classify(marksOf(F, V)).names.has(c) ? i : -1; }).filter(i => i >= 0);
  if (hits.length !== 1) return -1;
  const cap = g.caps[hits[0]];
  return choiceIdx(q, t => t === `figure ${cap}`);
}

// =====================================================================================================================
// families: classes and reasons
const BAD_REASON = [
  /look/, /turned on its corner/, /slanted/, /its own kind/, /every quadrilateral is a/, /exactly one pair/, /only one pair/, /one long point/,
  /cannot be a kite/, /because it is called/, /is a diamond/, /pushed-over/, /short top/, /^(yes|no): both have/, /share some properties/,
  /different (shapes|classes)/, /never drawn/, /need not be/, /drawn to look/, /both quadrilaterals/, /"some" needs/, /in the picture/, /most \w+ have it/,
  /necessary would mean/, /is not part of the definition/, /does not make a shape/, /some shapes with/, /only \w+ have it/, /only rhombuses can/,
];
const reasonBad = t => BAD_REASON.some(re => re.test(low(t)));
/** "X is a Y" across the catalogue */
const isEvery = (x, y) => every(cls(x), cls(y));

function inclWhy(q) {
  const m = body(q).match(/Is every ([a-z ]+?) an? ([a-z ]+?)\? Why\?/);
  if (!m) return undefined;
  const x = classOfWord(m[1]), y = classOfWord(m[2]);
  const yes = isEvery(x, y);
  const pool = (q.choices ?? []).map((c, i) => [plain(c), i]).filter(([c]) => c.startsWith(yes ? 'yes' : 'no'));
  const good = pool.filter(([c]) => !reasonBad(c) && !/so every \w+ is an? \w+$/.test(c) && !/so every/.test(c.replace(/so every rectangle is a parallelogram/, '')));
  if (pool.length === 1) return pool[0][1];
  return good.length === 1 ? good[0][1] : -1;
}
function treeName(q) {
  const h = q.data?.picture?.tree?.hide;
  if (!h || h.length !== 1) return undefined;
  const KEY = { kite: 'kite', isoTrap: 'isosceles trapezoid', rect: 'rectangle', square: 'square', para: 'parallelogram', rhombus: 'rhombus', trap: 'trapezoid', quad: 'quadrilateral' };
  const c0 = KEY[h[0]] ?? classOfWord(h[0]);
  return c0 ? choiceIdx(q, c => c === c0) : undefined;
}
function inheritWhich(q) {
  const m = body(q).match(/^Every ([a-z ]+?) has (.+?)\. Must every ([a-z ]+?) have (.+?)\?$/);
  if (!m) return undefined;
  const y = classOfWord(m[1]), x = classOfWord(m[3]), prop = condOf(m[4]);
  if (!prop) return undefined;
  const must = CAT.every(f => !f.C[x] || prop(f));
  if (must) return isEvery(x, y) ? choiceIdx(q, c => c.startsWith(`yes: every ${m[3]} is a`)) : -1;
  return choiceIdx(q, c => c.startsWith(`no: some ${m[3]} is not`));
}
function inheritChain(q) {
  const p = body(q);
  let m;
  if ((m = p.match(/"Every ([a-z]+) has (.+?), and every \1 is an? ([a-z]+)\. So every \3 has \2\."/))) {
    const a = classOfWord(m[1]), b = classOfWord(m[3]);
    if (isEvery(a, b) && !isEvery(b, a)) return choiceIdx(q, c => c.startsWith('the property went up the tree'));
    return -1;
  }
  if ((m = p.match(/"Every ([a-z]+) is an? ([a-z]+), and every \2 has (.+?)\. So every \1 has \3\."/))) {
    const a = classOfWord(m[1]), b = classOfWord(m[2]), prop = condOf(m[3]);
    if (isEvery(a, b) && prop && CAT.every(f => !f.C[b] || prop(f))) return choiceIdx(q, c => c.startsWith('nothing'));
    return -1;
  }
  return undefined;
}
function vennZone(q) {
  // decided from what the prompt states about the shape (every shape here is a parallelogram): a right angle makes a
  // rectangle, two congruent adjacent sides a rhombus; "NOT" rules a class out. A class neither stated nor ruled out
  // leaves the zone open (no answer).
  const p = body(q);
  const m = p.match(/Shape ([A-Z]) (?:has|is marked with) (.+?)\. Where does it belong/);
  if (!m || !/Every shape here is a parallelogram/.test(p)) return undefined;
  const t = m[2];
  const notRect = /angles are NOT right angles|no right angles?/.test(t), notRhomb = /adjacent sides are NOT congruent/.test(t);
  const rect = !notRect && /(four|a|one|at least one) right angles?/.test(t);
  const rhomb = !notRhomb && /four congruent sides|(two )?(congruent adjacent|adjacent congruent|congruent consecutive) sides/.test(t);
  if ((!rect && !notRect) || (!rhomb && !notRhomb)) return -1;
  const want = rect && rhomb ? 'in the overlap' : rect ? 'inside rectangles only' : rhomb ? 'inside rhombuses only' : 'inside parallelograms, outside both';
  return choiceIdx(q, c => c.startsWith(want));
}
function allNames(q) {
  const X = classifyQ(q, quadName(q));
  if (!X) return undefined;
  const want = X.C.names;
  return choiceIdx(q, c => { const l = c.split(',').map(x => x.trim()); return l.length === want.size && l.every(x => want.has(x)); });
}
function mostSpecific(q) {
  const X = classifyQ(q, quadName(q));
  if (!X) return undefined;
  const ms = mostSpecificOf(X.C.names);
  if (!ms) return -1;
  return choiceIdx(q, c => c === ms || (ms === 'quadrilateral' && c === 'quadrilateral only'));
}
function couldBe(q) {
  const X = classifyQ(q, quadName(q));
  if (!X) return undefined;
  const G = X.C.names;
  const can = c => c !== 'isosceles trapezoid' || !G.has('parallelogram'); // a square fits every mark these figures carry
  const truth = c => {
    let m;
    if ((m = c.match(/^it must be an? ([a-z ]+), and it could also be an? ([a-z ]+)$/))) return G.has(classOfWord(m[1])) && !G.has(classOfWord(m[2])) && can(classOfWord(m[2]))
      && mostSpecificOf(G) === classOfWord(m[1]);
    if ((m = c.match(/^it must be an? ([a-z ]+)$/))) return G.has(classOfWord(m[1]));
    if ((m = c.match(/^it cannot be an? ([a-z ]+)$/))) return !can(classOfWord(m[1]));
    return null;
  };
  return choiceIdx(q, c => truth(c) === true);
}
function allSomeNo(q) {
  const p = body(q);
  let m, kind, x, y;
  if ((m = p.match(/"All ([a-z ]+?) are ([a-z ]+?)\."/))) { kind = 'all'; x = classOfWord(m[1]); y = classOfWord(m[2]); }
  else if ((m = p.match(/"No ([a-z ]+?) is an? ([a-z ]+?)\."/))) { kind = 'no'; x = classOfWord(m[1]); y = classOfWord(m[2]); }
  else if ((m = p.match(/"Some ([a-z ]+?) are ([a-z ]+?)\."/))) { kind = 'some'; x = classOfWord(m[1]); y = classOfWord(m[2]); }
  else return undefined;
  if (!x || !y) return undefined;
  const truth = kind === 'all' ? isEvery(x, y) : kind === 'no' ? !someF(cls(x), cls(y)) : someF(cls(x), cls(y));
  const reasonOK = c => {
    const r = low(c).replace(/^(true|false): /, '');
    let w;
    if ((w = r.match(/^(an? [a-z ]+?) is an? ([a-z ]+?) but not an? ([a-z ]+)$/))) { const S = describe(w[1]); return !!S?.length && S.every(f => f.C[classOfWord(w[2])] && !f.C[classOfWord(w[3])]); }
    if ((w = r.match(/^(an? [a-z ]+?) is both an? ([a-z ]+?) and an? ([a-z ]+)$/))) { const S = describe(w[1]); return !!S?.length && S.every(f => f.C[classOfWord(w[2])] && f.C[classOfWord(w[3])]); }
    if ((w = r.match(/^every ([a-z ]+?) meets the definition of an? ([a-z ]+)$/))) return isEvery(classOfWord(w[1]), classOfWord(w[2])) && classOfWord(w[1]) === x && classOfWord(w[2]) === y;
    if (/^no shape meets both definitions$/.test(r)) return !someF(cls(x), cls(y));
    if ((w = r.match(/^no shape is both an? ([a-z ]+?) and an? ([a-z ]+)$/))) return !someF(cls(classOfWord(w[1])), cls(classOfWord(w[2])));
    return false;
  };
  return choiceIdx(q, c => c.startsWith(truth ? 'true' : 'false') && reasonOK(c));
}
function suffMean(q) {
  const p = body(q);
  let m = p.match(/is being an? ([a-z ]+?) SUFFICIENT for being an? ([a-z ]+?)\?/) || p.match(/is knowing a shape is an? ([a-z ]+?) enough to prove it is an? ([a-z ]+?)\?/);
  if (!m) return undefined;
  const x = classOfWord(m[1]), y = classOfWord(m[2]);
  const suff = isEvery(x, y);
  if (suff) return choiceIdx(q, c => c === `yes: if a quadrilateral is a${/^[aeiou]/.test(x) ? 'n' : ''} ${x}, then it is a${/^[aeiou]/.test(y) ? 'n' : ''} ${y}`);
  return choiceIdx(q, c => { const w = c.match(/^no: (an? [a-z ]+?) is an? ([a-z ]+?) but not an? ([a-z ]+)$/); if (!w) return false; const S = describe(w[1]); return classOfWord(w[2]) === x && classOfWord(w[3]) === y && !!S?.length && S.every(f => f.C[x] && !f.C[y]); });
}
function converseForm(q) {
  const m = body(q).match(/"If a quadrilateral is an? ([a-z ]+?), then it is an? ([a-z ]+?)" is true/);
  if (!m) return undefined;
  const x = classOfWord(m[1]), y = classOfWord(m[2]);
  const art = c => `a${/^[aeiou]/.test(c) ? 'n' : ''} ${c}`;
  const conv = `If a quadrilateral is ${art(y)}, then it is ${art(x)}.`;
  const truth = isEvery(y, x);
  return choiceIdx(q, c => {
    if (!c.startsWith(conv)) return false;
    const r = c.slice(conv.length).trim();
    if (truth) return r === 'True.';
    const w = r.match(/^False: (an? [a-z ]+?) is a counterexample\.$/);
    if (!w) return false;
    const S = describe(w[1]);
    return !!S?.length && S.every(f => f.C[y] && !f.C[x]);
  });
}
function necMean(q) {
  const m = body(q).match(/is (.+?) NECESSARY for being an? ([a-z ]+?)\?/);
  if (!m) return undefined;
  const cond = condOf(m[1]), x = classOfWord(m[2]);
  if (!cond || !x) return undefined;
  const nec = CAT.every(f => !f.C[x] || cond(f));
  if (nec) return choiceIdx(q, c => /^yes: every [a-z ]+ (has|is) /.test(c) && !reasonBad(c));
  return choiceIdx(q, c => { const w = c.match(/^no: (an? [a-z ]+?) is an? ([a-z ]+?) without (.+)$/); if (!w) return false; const S = describe(w[1]), cw = condOf(w[3]); return !!S?.length && cw && S.every(f => f.C[x] && !cw(f)); });
}
function fourWay(q) {
  const m = body(q).match(/is (.+?) necessary, sufficient, both, or neither for being an? ([a-z ]+?)\?/);
  if (!m) return undefined;
  const cond = condOf(m[1]), x = classOfWord(m[2]);
  if (!cond || !x) return undefined;
  const nec = CAT.every(f => !f.C[x] || cond(f)), suf = CAT.every(f => !cond(f) || f.C[x]);
  const want = nec && suf ? 'both necessary and sufficient' : nec ? 'necessary only' : suf ? 'sufficient only' : 'neither';
  return choiceIdx(q, c => c === want);
}
function universe(q) {
  const m = body(q).match(/Is (.+?) sufficient for being an? ([a-z ]+?): \(a\) among all quadrilaterals, \(b\) among parallelograms\?/);
  if (!m) return undefined;
  const cond = condOf(m[1]), x = classOfWord(m[2]);
  if (!cond || !x) return undefined;
  const sa = CAT.every(f => !cond(f) || f.C[x]);
  const sb = CAT.every(f => !(f.C.parallelogram && cond(f)) || f.C[x]);
  return choiceIdx(q, c => {
    let w;
    if (c === 'sufficient in both universes') return sa && sb;
    if (c === 'sufficient in neither universe') return !sa && !sb;
    if (c === 'sufficient among all quadrilaterals, but not among parallelograms') return sa && !sb;
    if ((w = c.match(/^not sufficient among all quadrilaterals(?: \((an? [a-z ]+?) fits\))?, but sufficient among parallelograms$/))) {
      if (!(!sa && sb)) return false;
      if (!w[1]) return true;
      const S = describe(w[1]);
      return !!S?.length && S.every(f => cond(f) && !f.C[x]);
    }
    return false;
  });
}
function counterEx(q) {
  const m = body(q).match(/Claim: "If a quadrilateral (?:has|is) (.+?), then it is an? ([a-z ]+?)\."/);
  if (!m) return undefined;
  const cond = condOf(m[1]), x = classOfWord(m[2]);
  if (!cond || !x) return undefined;
  const claimTrue = CAT.every(f => !cond(f) || f.C[x]);
  return choiceIdx(q, c => {
    if (/^none: the claim is true$/.test(c)) return claimTrue;
    const S = describe(c);
    return !!S?.length && S.every(f => cond(f) && !f.C[x]);
  });
}

// =====================================================================================================================
// families: numbers
const POLY = { triangle: 3, quadrilateral: 4, pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8, nonagon: 9, decagon: 10, hendecagon: 11, dodecagon: 12 };
const polyN = p => { const m = p.match(/\b(triangle|quadrilateral|pentagon|hexagon|heptagon|octagon|nonagon|decagon|hendecagon|dodecagon)\b/); return m ? POLY[m[1]] : null; };
function polySum(q) {
  const p = body(q);
  let m;
  if ((m = p.match(/interior angles of a convex polygon add to ([\d,]+)°\. How many sides/))) return (Number(m[1].replace(/,/g, '')) / 180) + 2;
  const n = polyN(p) ?? Number(p.match(/has (\d+) sides/)?.[1]);
  return n ? (n - 2) * 180 : undefined;
}
function polyMissing(q) {
  const p = body(q);
  const n = polyN(p);
  const m = p.match(/interior angles ((?:[\d.]+°, )*[\d.]+°)(?:,)? and one missing angle/);
  if (!n || !m) return undefined;
  return clean((n - 2) * 180 - nums(m[1]).reduce((a, b) => a + b, 0));
}
function extSum(q) {
  const m = body(q).match(/exterior angles are ((?:[\d.]+°, )*[\d.]+°)\./);
  return m ? clean(360 - nums(m[1]).reduce((a, b) => a + b, 0)) : undefined;
}
function regAngle(q) {
  const p = body(q);
  const n = polyN(p) ?? Number(p.match(/has (\d+) congruent sides/)?.[1]);
  if (!n) return undefined;
  if (/one exterior angle/.test(p)) return clean(360 / n);
  if (/one interior angle/.test(p)) return clean((180 * (n - 2)) / n);
  return undefined;
}
function regSides(q) {
  const p = body(q);
  let m, n;
  if ((m = p.match(/One interior angle of a regular polygon is ([\d.]+)°/))) n = 360 / (180 - Number(m[1]));
  else if ((m = p.match(/One exterior angle of a regular polygon is ([\d.]+)°/))) n = 360 / Number(m[1]);
  else return undefined;
  const ok = Math.abs(n - Math.round(n)) < 1e-9 && Math.round(n) >= 3;
  return ok ? choiceIdx(q, c => c === `${Math.round(n)} sides`) : choiceIdx(q, c => c === 'no regular polygon has this angle');
}
function measuredSum(q) {
  const p = body(q);
  const n = polyN(p);
  const m = p.match(/total of ([\d,]+)°/);
  if (!n || !m) return undefined;
  const S = (n - 2) * 180, got = Number(m[1].replace(/,/g, ''));
  return choiceIdx(q, c => c === `the sum is ${S}° by the triangle argument; ${got}° is measuring error`);
}
function oppCons(q) {
  const p = body(q);
  const m0 = p.match(/In quadrilateral ([A-Z]{4})/);
  if (!m0) return undefined;
  const N = m0[1];
  const at = c => N.indexOf(c);
  const side = i => N[i % 4] + N[(i + 1) % 4];
  const sideIdx = s => [0, 1, 2, 3].find(i => skey(side(i)) === skey(s));
  const setEq = (a, b) => a.length === b.length && a.every(x => b.some(y => skey(y) === skey(x)));
  let m;
  if ((m = p.match(/which angle is opposite ∠([A-Z])\?/))) return choiceIdx(q, c => c === `∠${N[(at(m[1]) + 2) % 4]}`);
  if ((m = p.match(/which two angles are consecutive to ∠([A-Z])\?/))) { const i = at(m[1]); const want = [N[(i + 1) % 4], N[(i + 3) % 4]]; return choiceIdx(q, c => { const l = [...c.matchAll(/∠([A-Z])/g)].map(x => x[1]); return l.length === 2 && setEq(l, want); }); }
  if ((m = p.match(/which side is opposite ([A-Z]{2})\?/))) { const i = sideIdx(m[1]); return choiceIdx(q, c => /^[A-Z]{2}$/.test(c) && skey(c) === skey(side(i + 2))); }
  if ((m = p.match(/which two sides are consecutive to ([A-Z]{2})\?/))) { const i = sideIdx(m[1]); const want = [side(i + 1), side(i + 3)]; return choiceIdx(q, c => { const l = c.split(' and '); return l.length === 2 && setEq(l, want); }); }
  return undefined;
}
function partWhole(q) {
  const p = body(q);
  const F = figQ(q);
  const lab = {}; for (const s of F?.segs ?? []) if (s.A && s.B && s.text !== undefined) lab[skey(s.A + s.B)] = s.text;
  const alab = {}; for (const a of F?.angs ?? []) if (a.text !== undefined && a.V) alab[skey(a.P + a.V + a.Q) + a.V] = a.text;
  const segNum = n => { let m = p.match(new RegExp(`\\b${n} = ([\\d.]+)`)) || p.match(new RegExp(`\\b${n.split('').reverse().join('')} = ([\\d.]+)`)); if (m) return Number(m[1]); const t = lab[skey(n)]; return t !== undefined && t !== '?' ? numOf(t) : null; };
  const angNum = n => { const m = p.match(new RegExp(`m∠${n} = ([\\d.]+)°`)); if (m) return Number(m[1]); const t = alab[skey(n) + n[1]]; return t !== undefined && t !== '?' ? numOf(t) : null; };
  let m;
  if ((m = p.match(/^([A-Z]) is on diagonal ([A-Z]{2})/))) {
    const Mn = m[1], D = m[2], h1 = D[0] + Mn, h2 = Mn + D[1];
    const ask = p.match(/How long is ([A-Z]{2})\?/)?.[1];
    const equal = /have equal lengths/.test(p);
    let a = segNum(h1), b = segNum(h2), w = segNum(D);
    if (equal) { if (a === null) a = b; if (b === null) b = a; if (a === null && w !== null) a = b = w / 2; }
    if (w === null && a !== null && b !== null) w = a + b;
    if (a === null && w !== null && b !== null) a = w - b;
    if (b === null && w !== null && a !== null) b = w - a;
    const r = skey(ask) === skey(D) ? w : skey(ask) === skey(h1) ? a : skey(ask) === skey(h2) ? b : null;
    return r === null ? undefined : clean(r);
  }
  if ((m = p.match(/Diagonal ([A-Z]{2}) splits ∠([A-Z]{3})/))) {
    const whole = m[2], V = whole[1], T = m[1].replace(V, '');
    const p1 = whole[0] + V + T, p2 = T + V + whole[2];
    const ask = p.match(/What is m∠([A-Z]{3})\?/)?.[1];
    const equal = /two parts with equal measures/.test(p);
    let a = angNum(p1), b = angNum(p2), w = angNum(whole);
    if (equal) { if (a === null) a = b; if (b === null) b = a; if (a === null && w !== null) a = b = w / 2; }
    if (w === null && a !== null && b !== null) w = a + b;
    if (a === null && w !== null && b !== null) a = w - b;
    if (b === null && w !== null && a !== null) b = w - a;
    const r = skey(ask) === skey(whole) && ask[1] === V ? w : skey(ask) === skey(p1) ? a : skey(ask) === skey(p2) ? b : null;
    return r === null ? undefined : clean(r);
  }
  if (/perimeter of quadrilateral/.test(p)) {
    const sides = (F?.segs ?? []).filter(s => s.text !== undefined);
    const known = sides.filter(s => s.text !== '?').map(s => numOf(s.text));
    const Pm = p.match(/perimeter of quadrilateral [A-Z]{4} is ([\d.]+)/);
    if (Pm) return clean(Number(Pm[1]) - known.reduce((x, y) => x + y, 0));
    if (/What is the perimeter/.test(p) && known.length === 4) return clean(known.reduce((x, y) => x + y, 0));
  }
  return undefined;
}
/** "XXXX is a parallelogram / rectangle / rhombus ..." → kind */
function statedKind(p) {
  const m = p.match(/\b[A-Z]{4} is an? (square|rectangle|rhombus|parallelogram)/);
  return m ? m[1] : null;
}
function lengthsFamily(q) {
  // diagHalf, rectDiag (numbers), oppSide, perim: a stated class, a given length (prompt or label), an asked length
  const p = body(q);
  const F = figQ(q);
  const N = quadName(q), E = p.match(/(?:meet|meeting) at ([A-Z])/)?.[1] ?? null;
  const kind = statedKind(p);
  const given = [];
  for (const m of p.matchAll(/\b([A-Z]{2}) = ([\d.]+) ?(?:cm|ft|in|m)\b/g)) given.push([m[1], Number(m[2])]);
  for (const s of F?.segs ?? []) if (s.A && s.B && s.text && s.text !== '?' && numOf(s.text) !== null && !given.some(g => skey(g[0]) === skey(s.A + s.B))) given.push([s.A + s.B, numOf(s.text)]);
  const askM = p.match(/(?:How long is|What is) (?:diagonal )?([A-Z]{2})\?/);
  if (!kind || !askM) return undefined;
  const ask = askM[1];
  const mk = kind === 'square' ? 'square' : kind;
  for (const [g, v] of given) {
    const r = lengthRatio(mk, N, E, g, ask);
    if (r !== null) return { v: clean(v * r) };
  }
  return { v: null };
}
function diagHalf(q) {
  const r = lengthsFamily(q);
  if (r === undefined) return undefined;
  if (q.input === 'choice') {
    if (r.v === null) return choiceIdx(q, c => c.startsWith('not enough information'));
    return choiceIdx(q, c => numOf(c) === r.v && /^[\d.]+ \w+\.?$/.test(c));
  }
  return r.v ?? NaN;
}
function oppSide(q) { const r = lengthsFamily(q); return r === undefined ? undefined : r.v ?? NaN; }
function perim(q) {
  const p = body(q);
  const F = figQ(q);
  const kind = statedKind(p);
  const N = quadName(q);
  const lab = (F?.segs ?? []).filter(s => s.text && s.text !== '?').map(s => [s.A + s.B, numOf(s.text)]);
  let m;
  if ((m = p.match(/with perimeter ([\d.]+) ?\w*\.*\s*How long is ([A-Z]{2})\?/))) {
    const Pv = Number(m[1]), ask = m[2];
    // ask + its adjacent side = P / 2 (opposite sides congruent)
    const i = [0, 1, 2, 3].find(k => skey(N[k] + N[(k + 1) % 4]) === skey(ask));
    const adj = [N[(i + 1) % 4] + N[(i + 2) % 4], N[(i + 3) % 4] + N[i]];
    const g = lab.find(([n]) => adj.some(a => skey(a) === skey(n)));
    const o = lab.find(([n]) => skey(n) === skey(N[(i + 2) % 4] + N[(i + 3) % 4]));
    if (kind === 'rhombus' || kind === 'square') return clean(Pv / 4);
    if (o) return o[1]; // the opposite side is labelled: opposite sides are congruent
    return g ? clean(Pv / 2 - g[1]) : undefined;
  }
  if (/What is its perimeter\?/.test(p)) {
    if (kind === 'rhombus' || kind === 'square') return lab.length ? clean(4 * lab[0][1]) : undefined;
    // two consecutive sides labelled
    const idx = lab.map(([n]) => [0, 1, 2, 3].find(k => skey(N[k] + N[(k + 1) % 4]) === skey(n)));
    if (lab.length >= 2 && (idx[0] - idx[1] + 4) % 2 === 1) return clean(2 * (lab[0][1] + lab[1][1]));
    return NaN;
  }
  return undefined;
}
function oppAngle(q) {
  const m = body(q).match(/([A-Z]{4}) is a parallelogram with m∠([A-Z]) = ([\d.]+)°(?: \(a right angle\))?\. What is m∠([A-Z])\?/);
  if (!m) return undefined;
  const N = m[1], i = N.indexOf(m[2]), j = N.indexOf(m[4]), v = Number(m[3]);
  return (i - j + 4) % 2 === 0 ? (i === j ? v : v) : clean(180 - v);
}
const consAngle = oppAngle;
function rhombPerp(q) {
  const p = body(q);
  let m;
  if ((m = p.match(/([A-Z]{2}) = ([\d.]+) ?\w+\.? and ([A-Z]{2}) = ([\d.]+) ?\w+\.*\s*How long is side ([A-Z]{2})\?/))) {
    return clean(Math.hypot(Number(m[2]), Number(m[4])));
  }
  if (q.input === 'choice') return claimsFamily(q);
  return undefined;
}
// claims about a class with diagonals ("Which must be true?")
function claimsFamily(q) {
  const p = body(q);
  const N = quadName(q), E = p.match(/(?:meet|meeting) at ([A-Z])/)?.[1];
  let kinds;
  if (/is a rectangle \(not a square\)/.test(p)) kinds = ['rectangle'];
  else if (/is a rhombus \(not a square\)/.test(p)) kinds = ['rhombus'];
  else if (/is a square/.test(p)) kinds = ['square'];
  else if (/is a kite that is not a rhombus/.test(p) || /is a kite/.test(p)) kinds = ['kite'];
  else if (/is an isosceles trapezoid/.test(p)) kinds = ['isotrap'];
  else if (/is a parallelogram/.test(p)) kinds = ['parallelogram'];
  if (!kinds || !N || !E) return undefined;
  const models = [];
  const k = kinds[0];
  if (k === 'kite') {
    // which vertices are the apexes: "JS ≅ JV, TS ≅ TV" → J and T
    const m = p.match(/\(([A-Z])([A-Z]) ≅ \1([A-Z]), ([A-Z])\2 ≅ \4\3\)/) || p.match(/\(([A-Z])([A-Z]) ≅ \1([A-Z]), ([A-Z])[A-Z] ≅ \4[A-Z]\)/);
    if (!m) return undefined;
    const apex = m[1], i = N.indexOf(apex);
    const names = N.slice(i) + N.slice(0, i); // apex first
    for (const t of SAMPLES.kite0) models.push(modelPts('kite0', t, names, E));
  } else if (k === 'isotrap') {
    // bases: the stated parallel pair or the drawn arrowheads
    const F = figQ(q);
    const ps = (F?.segs ?? []).filter(s => s.par > 0).map(s => s.A + s.B);
    let names = N;
    for (let r = 0; r < 4; r++) { const nm = N.slice(r) + N.slice(0, r); if (ps.some(s => skey(s) === skey(nm.slice(0, 2)))) { names = nm; break; } }
    for (const t of SAMPLES.isotrap) models.push(modelPts('isotrap', t, names, E));
  } else for (const t of SAMPLES[k]) models.push(modelPts(k, t, N, E));
  const holdsIn = (pts, c) => {
    const parts = c.split(/,? and |, but |; | but |, so /);
    let ok = true;
    for (const raw of parts) {
      const t = raw.trim();
      let m;
      if ((m = t.match(/^([A-Z]{2}) = ([A-Z]{2})(?: only)?$/))) ok &&= Math.abs(segN(pts, m[1]) - segN(pts, m[2])) < 1e-6;
      else if ((m = t.match(/^([A-Z]{2}) ≠ ([A-Z]{2})$/))) ok &&= Math.abs(segN(pts, m[1]) - segN(pts, m[2])) > 1e-6;
      else if ((m = t.match(/^([A-Z]{2}) ⊥ ([A-Z]{2})(?: only)?$/))) ok &&= Math.abs(dot(unit(sub(pts[m[1][1]], pts[m[1][0]])), unit(sub(pts[m[2][1]], pts[m[2][0]])))) < 1e-6;
      else if (/^they are not perpendicular$|^the diagonals are not perpendicular$/.test(t)) { const d = N; ok &&= Math.abs(dot(unit(sub(pts[d[2]], pts[d[0]])), unit(sub(pts[d[3]], pts[d[1]])))) > 1e-6; }
      else if ((m = t.match(/^([A-Z]) is not the midpoint of either diagonal$/))) { ok &&= Math.abs(segN(pts, N[0] + E) - segN(pts, E + N[2])) > 1e-6 && Math.abs(segN(pts, N[1] + E) - segN(pts, E + N[3])) > 1e-6; }
      else if (/^the halves need not match$/.test(t)) ok &&= !(Math.abs(segN(pts, N[0] + E) - segN(pts, N[1] + E)) < 1e-6);
      else if (/^neither diagonal is bisected$/.test(t)) ok &&= Math.abs(segN(pts, N[0] + E) - segN(pts, E + N[2])) > 1e-6 && Math.abs(segN(pts, N[1] + E) - segN(pts, E + N[3])) > 1e-6;
      else if (/^only rectangles have congruent diagonals$/.test(t)) ok = false;
      else return null;
    }
    return ok;
  };
  return choiceIdx(q, c => { const r = models.map(m => holdsIn(m, c)); return r.every(x => x === true); });
}
function rectDiag(q) {
  if (q.input === 'choice') return claimsFamily(q);
  const r = lengthsFamily(q);
  return r === undefined ? undefined : r.v ?? NaN;
}
function bisMeaning(q) {
  const p = body(q);
  let m;
  if ((m = p.match(/Diagonal ([A-Z]{2}) bisects ∠([A-Z]{3})(?: \(the arcs mark two congruent parts\))?(?:,? and |\. )m∠([A-Z]{3}) = ([\d.]+)°\. What is m∠([A-Z]{3})\?/))) {
    const whole = m[2], given = m[3], v = Number(m[4]), ask = m[5];
    const isWhole = a => skey(a) === skey(whole) && a[1] === whole[1];
    if (isWhole(given) && !isWhole(ask)) return clean(v / 2);
    if (!isWhole(given) && isWhole(ask)) return clean(2 * v);
    if (!isWhole(given) && !isWhole(ask)) return v;
    return v;
  }
  if ((m = p.match(/The diagonals of ([A-Z]{4}) meet at ([A-Z])\. Which angle is an? \w+ of the vertex angle ∠([A-Z]{3})\?/))) {
    const N = m[1], whole = m[3], V = whole[1], i = N.indexOf(V), opp = N[(i + 2) % 4];
    return choiceIdx(q, c => { const a = c.match(/^∠([A-Z]{3})$/)?.[1]; if (!a || a[1] !== V) return false; const rays = [a[0], a[2]]; return rays.includes(opp) && (rays.includes(whole[0]) || rays.includes(whole[2])); });
  }
  return undefined;
}
/** angle families with a stated class: rhombBis, chaseRect, chaseRhomb */
function statedChase(q) {
  const p = body(q);
  const N = quadName(q), E = p.match(/(?:meet|meeting) at ([A-Z])/)?.[1] ?? null;
  const kind = statedKind(p);
  const ask = p.match(/What is m∠([A-Z]{3})\?/)?.[1];
  if (!kind || !ask) return undefined;
  const g = p.match(/m∠([A-Z]{3}) = ([\d.]+)°/);
  const r = kind === 'square' ? chaseAngle('square', N, E, g?.[1] ?? null, g ? Number(g[2]) : null, ask) : g ? chaseAngle(kind, N, E, g[1], Number(g[2]), ask) : null;
  return r ?? NaN;
}
function mixedProp(q) {
  const p = body(q);
  const X = classifyQ(q, null);
  const F = X?.F;
  if (!F) return undefined;
  // the quadrilateral: the four vertices in order (from the figure's sides), the diagonal point if any
  const sideSegs = F.segs.filter(s => s.A && s.B);
  const names = Object.keys(F.pts);
  // order: find the 4 vertices forming a cycle of side segments
  const E = p.match(/meet at ([A-Z])/)?.[1] ?? null;
  const verts = names.filter(n => n !== E);
  const adj = {}; for (const s of sideSegs) if (verts.includes(s.A) && verts.includes(s.B)) { (adj[s.A] ??= []).push(s.B); (adj[s.B] ??= []).push(s.A); }
  // a 4-cycle using edges that are not diagonals (diagonals cross): try orders
  const perms = [];
  const v0 = verts[0];
  for (const a of verts) for (const b of verts) for (const c of verts) if (new Set([v0, a, b, c]).size === 4) perms.push(v0 + a + b + c);
  const okCycle = s => [0, 1, 2, 3].every(i => adj[s[i]]?.includes(s[(i + 1) % 4])) && !!lineMeet(F.pts[s[0]], F.pts[s[2]], F.pts[s[1]], F.pts[s[3]]) && (() => {
    const e = lineMeet(F.pts[s[0]], F.pts[s[2]], F.pts[s[1]], F.pts[s[3]]); const inS = (A, B) => dot(sub(e, A), sub(B, A)) > 0 && dot(sub(e, B), sub(A, B)) > 0; return inS(F.pts[s[0]], F.pts[s[2]]) && inS(F.pts[s[1]], F.pts[s[3]]); })();
  const N = perms.find(okCycle);
  if (!N) return undefined;
  const M = marksOf(F, N.split('').map(c => F.pts[c]));
  const C = classify(M);
  const kind = kindOf(C);
  if (!kind) return NaN;
  let m;
  if (q.input === 'choice' && (m = p.match(/and ([A-Z]{2}) = ([\d.]+) ?(\w+\.?)\.*\s*What is ([A-Z]{2})\?/))) {
    const r = lengthRatio(kind, N, E, m[1], m[4]);
    if (r === null) return choiceIdx(q, c => c.startsWith('not enough information'));
    return choiceIdx(q, c => c === `${clean(Number(m[2]) * r)} ${m[3]}`);
  }
  if ((m = p.match(/meet at ([A-Z]) and ([A-Z]{2}) = ([\d.]+) ?\w+\.*\s*How long is ([A-Z]{2})\?/))) {
    const r = lengthRatio(kind, N, E, m[2], m[4]);
    return r === null ? NaN : clean(Number(m[3]) * r);
  }
  const ask = p.match(/What is m∠([A-Z]{3})\?/)?.[1];
  if (ask) {
    const g = F.angs.find(a => a.text && a.text !== '?' && numOf(a.text) !== null);
    const gname = g ? g.P + g.V + g.Q : null;
    const r = chaseAngle(kind, N, E, gname, g ? numOf(g.text) : null, ask);
    return r ?? NaN;
  }
  return undefined;
}
function eqOpp(q) {
  const p = body(q);
  let m;
  const N = quadName(q);
  if ((m = p.match(/([A-Z]{4}) is a parallelogram with ([A-Z]{2}) = ([^()]+?) and ([A-Z]{2}) = ([^()]+?) \(in \w+\)\. How long is ([A-Z]{2})\?/))) {
    const e1 = lin(m[3]), e2 = lin(m[5]);
    const sideI = s => [0, 1, 2, 3].find(k => skey(N[k] + N[(k + 1) % 4]) === skey(s));
    const i = sideI(m[2]), j = sideI(m[4]);
    if (i === undefined || j === undefined || (i - j + 4) % 4 !== 2) return NaN;
    const x = solveLin(e1, 1, e2, 1);
    return clean(val(e1, x));
  }
  if ((m = p.match(/its diagonals meet at ([A-Z]) with ([A-Z]{2}) = (.+?) and ([A-Z]{2}) = (.+?) \(in \w+\)\. How long is diagonal ([A-Z]{2})\?/))) {
    const E = m[1], e1 = lin(m[3]), e2 = lin(m[5]);
    const d = m[6];
    const halvesOf = dd => [dd[0] + E, E + dd[1]].map(skey);
    const h = halvesOf(d);
    if (!(h.includes(skey(m[2])) && h.includes(skey(m[4])))) return NaN;
    const x = solveLin(e1, 1, e2, 1);
    return clean(2 * val(e1, x));
  }
  if ((m = p.match(/with m∠([A-Z]{1,3}) = (.+?)° and m∠([A-Z]{1,3}) = (.+?)°\. What is (x|m∠([A-Z]{1,3}))\?/))) {
    const vtx = a => (a.length === 3 ? a[1] : a);
    const i = N.indexOf(vtx(m[1])), j = N.indexOf(vtx(m[3]));
    const e1 = lin(m[2]), e2 = lin(m[4]);
    let x;
    if ((i - j + 4) % 2 === 0) x = solveLin(e1, 1, e2, 1);
    else x = solveLin(e1, 1, [-e2[0], -e2[1]], 1, 180); // e1 = 180 − e2
    if (m[5] === 'x') return clean(x);
    const a = m[6];
    return clean(val(vtx(a) === vtx(m[1]) ? e1 : e2, x));
  }
  return undefined;
}
const eqCons = eqOpp;
function solveForTest(q) {
  const p = body(q);
  let m;
  if ((m = p.match(/([A-Z]{4}) is a parallelogram \(the arrowheads\) with (diagonals )?([A-Z]{2}) = (.+?) and ([A-Z]{2}) = (.+?)\. For which x is \1 an? (rhombus|rectangle)\?/))) {
    const N = m[1], dg = !!m[2], a = m[3], b = m[5], e1 = lin(m[4]), e2 = lin(m[6]), want = m[7];
    const sideI = s => [0, 1, 2, 3].find(k => skey(N[k] + N[(k + 1) % 4]) === skey(s));
    if (want === 'rhombus' && !dg) { const i = sideI(a), j = sideI(b); if (i === undefined || j === undefined || (i - j + 4) % 2 !== 1) return NaN; }
    if (want === 'rectangle' && dg) { const d = [skey(N[0] + N[2]), skey(N[1] + N[3])]; if (!(d.includes(skey(a)) && d.includes(skey(b)) && skey(a) !== skey(b))) return NaN; }
    if ((want === 'rhombus') === dg) return NaN;
    return clean(solveLin(e1, 1, e2, 1));
  }
  if ((m = p.match(/The diagonals of quadrilateral ([A-Z]{4}) meet at ([A-Z]), with ([A-Z]{2}) = ([A-Z]{2}), ([A-Z]{2}) = (.+?) and ([A-Z]{2}) = (.+?)\. For which x is \1 a parallelogram\?/))) {
    const N = m[1], E = m[2];
    const diagOf = s => { const v = s.replace(E, ''); const i = N.indexOf(v); return i % 2; };
    const hasE = [m[3], m[4], m[5], m[7]].every(s => s.includes(E));
    if (!hasE || diagOf(m[3]) !== diagOf(m[4]) || diagOf(m[5]) !== diagOf(m[7]) || diagOf(m[3]) === diagOf(m[5])) return NaN;
    return clean(solveLin(lin(m[6]), 1, lin(m[8]), 1));
  }
  if ((m = p.match(/In quadrilateral ([A-Z]{4}), ([A-Z]{2}) ≅ ([A-Z]{2}) \(the ticks\), ([A-Z]{2}) = (.+?) and ([A-Z]{2}) = (.+?)\. For which x is \1 a parallelogram\?/))) {
    const N = m[1];
    const sideI = s => [0, 1, 2, 3].find(k => skey(N[k] + N[(k + 1) % 4]) === skey(s));
    const i = sideI(m[2]), j = sideI(m[3]), k = sideI(m[4]), l = sideI(m[6]);
    if ([i, j, k, l].includes(undefined) || (i - j + 4) % 4 !== 2 || (k - l + 4) % 4 !== 2 || i % 2 === k % 2) return NaN;
    return clean(solveLin(lin(m[5]), 1, lin(m[7]), 1));
  }
  return undefined;
}
function trapMid(q) {
  const p = body(q);
  let m;
  if ((m = p.match(/is a trapezoid with bases ([A-Z]{2}) = ([\d.]+) ?\w+\.? and ([A-Z]{2}) = ([\d.]+) ?\w+\.?; ([A-Z]) and ([A-Z]) are the midpoints of the legs\. How long is ([A-Z]{2})\?/))) return clean((Number(m[2]) + Number(m[4])) / 2);
  if ((m = p.match(/is a trapezoid with bases ([A-Z]{2}) and ([A-Z]{2}); ([A-Z]) and ([A-Z]) are the midpoints of the legs\. ([A-Z]{2}) = ([\d.]+) ?\w+\.? and ([A-Z]{2}) = ([\d.]+) ?\w+\.*\s*How long is ([A-Z]{2})\?/))) {
    const b1 = m[1], b2 = m[2], ms = m[3] + m[4];
    const vals = { [skey(m[5])]: Number(m[6]), [skey(m[7])]: Number(m[8]) };
    const ask = skey(m[9]);
    const B1 = vals[skey(b1)], B2 = vals[skey(b2)], MS = vals[skey(ms)];
    if (ask === skey(ms)) return clean((B1 + B2) / 2);
    if (ask === skey(b1)) return clean(2 * MS - B2);
    if (ask === skey(b2)) return clean(2 * MS - B1);
    return undefined;
  }
  if ((m = p.match(/is a trapezoid with bases ([A-Z]{2}) = (.+?) and ([A-Z]{2}) = (.+?), and midsegment ([A-Z]{2}) = ([\d.]+) \(all in \w+\)\. How long is ([A-Z]{2})\?/))) {
    const e1 = lin(m[2]), e2 = lin(m[4]), M = Number(m[6]);
    const x = (2 * M - e1[1] - e2[1]) / (e1[0] + e2[0]);
    const ask = skey(m[7]);
    return clean(ask === skey(m[1]) ? val(e1, x) : ask === skey(m[3]) ? val(e2, x) : ask === skey(m[5]) ? M : NaN);
  }
  if (/garden bed|shelf|ladder|rung/.test(p)) {
    const ns = nums(p.replace(/\b[A-Z]-frame/g, ''));
    if (ns.length === 2) return clean((ns[0] + ns[1]) / 2);
  }
  return undefined;
}
function isoTrapAngle(q) {
  const p = body(q);
  const m = p.match(/([A-Z]{4}) is an isosceles trapezoid with ([A-Z]{2}) ∥ ([A-Z]{2}) and ([A-Z]{2}) ≅ ([A-Z]{2})\. What is m∠([A-Z]{3})\?/);
  if (!m) return undefined;
  const F = figQ(q);
  const g = F?.angs.find(a => a.text && a.text !== '?' && numOf(a.text) !== null);
  if (!g) return undefined;
  const N = m[1];
  let names = N;
  for (let r = 0; r < 4; r++) { const nm = N.slice(r) + N.slice(0, r); if (skey(nm.slice(0, 2)) === skey(m[2]) || skey(nm.slice(0, 2)) === skey(m[3])) { names = nm; break; } }
  const r = chaseAngle('isotrap', names, null, g.P + g.V + g.Q, numOf(g.text), m[6]);
  return r ?? NaN;
}
function kiteDiag(q) {
  if (q.input === 'choice') return claimsFamily(q);
  const p = body(q);
  const m = p.match(/([A-Z]{4}) is a kite \(([A-Z])([A-Z]) ≅ \2([A-Z]), ([A-Z])\3 ≅ \5\4\) with diagonals meeting at ([A-Z]), and ([A-Z]{2}) = ([\d.]+) ?\w+\.*\s*How long is ([A-Z]{2})\?/);
  if (!m) return undefined;
  const N = m[1], apex = m[2], E = m[6];
  const i = N.indexOf(apex);
  const names = N.slice(i) + N.slice(0, i);
  const r = lengthRatio('kite0', names, E, m[7], m[9]);
  return r === null ? NaN : clean(Number(m[8]) * r);
}
function isoTrapDiag(q) {
  if (q.input === 'choice') return claimsFamily(q);
  const p = body(q);
  const m = p.match(/([A-Z]{4}) is an isosceles trapezoid with ([A-Z]{2}) ∥ ([A-Z]{2}) and ([A-Z]{2}) ≅ ([A-Z]{2}); its diagonals meet at ([A-Z])\. How long is diagonal ([A-Z]{2})\?/);
  if (!m) return undefined;
  const N = m[1], E = m[6], ask = m[7];
  const F = figQ(q);
  const lab = F.segs.filter(s => s.A && s.B && s.text && s.text !== '?').map(s => [s.A + s.B, numOf(s.text)]);
  // the labelled parts of the other diagonal (the asked one is congruent to it)
  const other = [skey(N[0] + N[2]), skey(N[1] + N[3])].find(d => d !== skey(ask));
  const parts = lab.filter(([n]) => n.includes(E) && other.includes(n.replace(E, '')));
  const full = lab.find(([n]) => skey(n) === other);
  if (full) return full[1];
  if (parts.length === 2 && parts[0][0].replace(E, '') !== parts[1][0].replace(E, '')) return clean(parts[0][1] + parts[1][1]);
  return NaN;
}
function diagVocab(q) {
  const p = body(q);
  let m;
  if ((m = p.match(/The diagonals of ([A-Z]{4}) meet at ([A-Z])\. What does "the diagonals bisect each other" mean\?/))) {
    const N = m[1], E = m[2];
    return choiceIdx(q, c => {
      const eqs = c.split(' and ').map(x => x.match(/^([A-Z]{2}) = ([A-Z]{2})$/));
      if (eqs.length !== 2 || eqs.some(x => !x)) return false;
      const halves = [[N[0] + E, E + N[2]], [N[1] + E, E + N[3]]].map(h => h.map(skey).sort().join('|'));
      const got = eqs.map(x => [skey(x[1]), skey(x[2])].sort().join('|'));
      return halves.every(h => got.includes(h));
    });
  }
  if ((m = p.match(/The diagonals of ([A-Z]{4}) meet at ([A-Z])\. Which segment is half of diagonal ([A-Z]{2}), from a vertex to \2\?/))) {
    const E = m[2], d = m[3];
    return choiceIdx(q, c => /^[A-Z]{2}$/.test(c) && c.includes(E) && d.includes(c.replace(E, '')));
  }
  return undefined;
}
function conjTable(q) {
  const lines = q.data?.picture?.card?.lines ?? [];
  const head = plain(lines[0] ?? '');
  const hm = head.match(/Three different ([a-z ]+?), measured/);
  if (!hm) return undefined;
  const c0 = classOfWord(hm[1]);
  const ex = lines.slice(1).map(plain);
  const prop = { perp: true, cong: true, bis: true };
  for (const l of ex) {
    const a = Number(l.match(/angle between diagonals ([\d.]+)°/)?.[1]);
    const dm = l.match(/diagonals ([\d.]+) and ([\d.]+) cm/);
    if (!(Math.abs(a - 90) <= 1)) prop.perp = false;
    if (!dm || Math.abs(Number(dm[1]) - Number(dm[2])) > 0.1 + 1e-9) prop.cong = false;
    if (!/halves match/.test(l)) { const h = l.match(/halves ([\d.]+) and ([\d.]+) cm/); if (!h || Math.abs(Number(h[1]) - Number(h[2])) > 0.1 + 1e-9) prop.bis = false; }
  }
  const words = { perp: 'are perpendicular', cong: 'are congruent', bis: 'bisect each other' };
  const held = Object.keys(prop).filter(k => prop[k]).map(k => words[k]);
  return choiceIdx(q, c => { const m = c.match(/^conjecture: if a quadrilateral is an? ([a-z ]+?), then its diagonals (.+)$/); return !!m && classOfWord(m[1]) === c0 && held.includes(m[2]); });
}

// =====================================================================================================================
// families: tests with marks
function paraTest(q) {
  const X = classifyQ(q, quadName(q));
  if (!X) return undefined;
  const { M } = X;
  const L = M.L, A = M.A;
  const tests = [];
  if (L.same('h0', 'h2') && L.same('h1', 'h3')) tests.push('yes: the diagonals bisect each other');
  if (L.same('s0', 's2') && L.same('s1', 's3')) tests.push('yes: both pairs of opposite sides are congruent');
  if (A.same('A0', 'A2') && A.same('A1', 'A3')) tests.push('yes: both pairs of opposite angles are congruent');
  if (tests.length > 1) return -1;
  if (tests.length === 1) return choiceIdx(q, c => c === tests[0]);
  return X.C.P ? -1 : choiceIdx(q, c => c.startsWith('no:'));
}
function onePair(q) {
  const N = quadName(q);
  const X = classifyQ(q, N);
  if (!X) return undefined;
  const { M } = X;
  const p02 = M.par.some(([a, b]) => skey(a + b) === skey('s0s2')), p13 = M.par.some(([a, b]) => skey(a + b) === skey('s1s3'));
  const c02 = M.L.same('s0', 's2'), c13 = M.L.same('s1', 's3');
  const side = i => N[i] + N[(i + 1) % 4];
  if ((p02 && c02) || (p13 && c13)) {
    const i = p02 && c02 ? 0 : 1;
    return choiceIdx(q, c => { const m = c.match(/^yes: the same pair, ([A-Z]{2}) and ([A-Z]{2}), is both parallel and congruent$/); return !!m && [skey(m[1]), skey(m[2])].sort().join() === [skey(side(i)), skey(side(i + 2))].sort().join(); });
  }
  if ((p02 && c13) || (p13 && c02)) return choiceIdx(q, c => c.startsWith('no: the parallel pair and the congruent pair are different pairs; an isosceles trapezoid fits'));
  return -1;
}
function rectTestF(q) {
  const p = body(q);
  let m;
  const isPar = /is a parallelogram/.test(p);
  const N = quadName(q);
  let cond = null;
  if ((m = p.match(/and ([A-Z]{2}) = ([A-Z]{2})(?: \(measured\))?\. Is/))) {
    const d = [skey(N[0] + N[2]), skey(N[1] + N[3])];
    if (d.includes(skey(m[1])) && d.includes(skey(m[2])) && skey(m[1]) !== skey(m[2])) cond = f => f.congDiag;
  } else if ((m = p.match(/and m∠([A-Z]{3}) = 90°\. Is/))) cond = f => f.right.some(Boolean);
  if (!cond) return undefined;
  const ok = CAT.every(f => !((isPar ? f.C.parallelogram : true) && cond(f)) || f.C.rectangle);
  if (ok) return choiceIdx(q, c => /^yes: a parallelogram with (a right angle|congruent diagonals) is a rectangle$/.test(c) && (/right angle/.test(c) ? /m∠/.test(p) : !/m∠/.test(p)));
  return choiceIdx(q, c => { const w = c.match(/^no: without the parallelogram premise (an? [a-z ]+?) fits$/); if (!w) return false; const S = describe(w[1]); return !!S?.length && S.every(f => cond(f) && !f.C.rectangle); });
}
function rhombTest(q) {
  const p = body(q);
  const N = quadName(q);
  const X = classifyQ(q, N) ?? classifyQ(q, null);
  if (!X) return undefined;
  const G = X.C.names;
  let m;
  if ((m = p.match(/Is [A-Z]{4} guaranteed to be an? (rhombus|square)\?/))) {
    const want = m[1];
    const yes = G.has(want);
    const pool = (q.choices ?? []).map((c, i) => [plain(c), i]).filter(([c]) => c.startsWith(yes ? 'yes' : 'no'));
    if (pool.length === 1) return pool[0][1];
    // a reason must hold for these marks
    const M = X.M;
    const valid = c => {
      if (/a kite has perpendicular diagonals too/.test(c)) return !G.has('parallelogram') && M.perp;
      if (/four congruent sides make a rhombus; a square also needs a right angle/.test(c)) return [0, 1, 2, 3].every(i => M.L.same('s0', 's' + i)) && !M.right.some(Boolean);
      if (/a parallelogram with (.+) is a rhombus/.test(c)) return G.has('rhombus');
      return !reasonBad(c) && false;
    };
    const good = pool.filter(([c]) => valid(c));
    return good.length === 1 ? good[0][1] : -1;
  }
  if (/most specific name the marks guarantee/.test(p)) {
    const ms = mostSpecificOf(G);
    return choiceIdx(q, c => c.startsWith(`a ${ms}${ms === 'square' ? ':' : ' only:'}`));
  }
  return undefined;
}
function guaranteed(q) {
  const X = classifyQ(q, quadName(q));
  if (!X) return undefined;
  const ms = mostSpecificOf(X.C.names);
  return choiceIdx(q, c => c === ms || (ms === 'quadrilateral' && c === 'quadrilateral only'));
}
function practical(q) {
  const p = body(q);
  const want = p.match(/Is the \w+ guaranteed to be an? ([a-z]+)\?/)?.[1];
  if (!want) return undefined;
  const conds = [];
  if (/all four sides measure/.test(p)) conds.push(f => f.C.rhombus);
  if (/the (two )?diagonals are equal|diagonals both measure|the diagonals are equal|both [\d.]+ in\./.test(p) || /two diagonals of a picture frame: both/.test(p)) conds.push(f => f.congDiag);
  if (/cross at a right angle/.test(p)) conds.push(f => f.perp);
  if (/diagonals bisect each other/.test(p)) conds.push(f => f.bis0 && f.bis1);
  if (/both pairs of opposite (sides|edges) (measure|are equal)/.test(p)) conds.push(f => f.eqv(f.s[0], f.s[2]) && f.eqv(f.s[1], f.s[3]));
  if (/one corner of a tabletop is a right angle|one corner is a right angle/.test(p)) conds.push(f => f.right.some(Boolean));
  if (/three corners of a tabletop are right angles|three corners are right angles/.test(p)) conds.push(f => f.right.filter(Boolean).length >= 3);
  if (!conds.length) return undefined;
  const c0 = classOfWord(want);
  const yes = CAT.every(f => !conds.every(c => c(f)) || f.C[c0]);
  const pool = (q.choices ?? []).map((c, i) => [plain(c), i]).filter(([c]) => c.startsWith(yes ? 'yes' : 'no'));
  if (pool.length === 1) return pool[0][1];
  const good = pool.filter(([c]) => !reasonBad(c) && !/tabletops are|only shape|is enough for|make a square$|make a rectangle$/.test(c));
  return good.length === 1 ? good[0][1] : -1;
}

// =====================================================================================================================
// proofs
function proofCtx(q) {
  const pic = q.data?.picture;
  const pr = pic?.proof;
  if (!pr) return null;
  const F = figOf(pic.fig);
  const title = plain(q.prompt).match(/Proof: (.+?)\. (?:Which|Put)/)?.[1] ?? '';
  return { pr, F, pts: F?.pts ?? {}, title };
}
/** a statement → atoms */
function atomsOf(st) {
  let s = plain(st).replace(/\s*\(Given\)$/, '').trim();
  let m;
  if ((m = s.match(/^([A-Z]), ([A-Z]), ([A-Z]) are collinear$/))) return [{ t: 'col', p: [m[1], m[2], m[3]] }];
  if ((m = s.match(/^([A-Z]), ([A-Z]), ([A-Z]) midpoints of ([A-Z]{2}), ([A-Z]{2}), ([A-Z]{2})$/))) return [1, 2, 3].map(i => ({ t: 'mid', p: m[i], s: m[i + 3] }));
  if ((m = s.match(/^([A-Z]{2}), ([A-Z]{2}) bisect each other at ([A-Z])$/))) return [{ t: 'meet', a: m[1], b: m[2], E: m[3] }, { t: 'seg', a: m[1][0] + m[3], b: m[3] + m[1][1] }, { t: 'seg', a: m[2][0] + m[3], b: m[3] + m[2][1] }];
  if ((m = s.match(/^its diagonals meet at ([A-Z])$/))) return [{ t: 'E', E: m[1] }];
  const parts = s.split(/,\s*(?=[A-Z]{2}\s*(?:≅|∥|=|⊥)|∠|△|m∠)/).map(x => x.trim()).filter(Boolean);
  const out = [];
  for (const a of parts) {
    if ((m = a.match(/^([A-Z]{2}) ∥ ([A-Z]{2})$/))) out.push({ t: 'par', a: m[1], b: m[2] });
    else if ((m = a.match(/^([A-Z]{2}) ≅ ([A-Z]{2})$/))) out.push({ t: 'seg', a: m[1], b: m[2] });
    else if ((m = a.match(/^([A-Z]{2}) = ([A-Z]{2})$/))) out.push({ t: 'seg', a: m[1], b: m[2] });
    else if ((m = a.match(/^∠([A-Z]{3}) ≅ ∠([A-Z]{3})$/))) out.push({ t: 'ang', a: m[1], b: m[2] });
    else if ((m = a.match(/^△([A-Z]{3}) ≅ △([A-Z]{3})$/))) out.push({ t: 'tri', a: m[1], b: m[2] });
    else if ((m = a.match(/^m∠([A-Z]{3}) \+ m∠([A-Z]{3}) = 180°$/))) out.push({ t: 'sup', a: m[1], b: m[2] });
    else if ((m = a.match(/^m∠([A-Z]{3}) = 90°$/))) out.push({ t: 'right', a: m[1] });
    else if ((m = a.match(/^([A-Z]{2}) ⊥ ([A-Z]{2})(?: at ([A-Z]))?$/))) out.push({ t: 'perp', a: m[1], b: m[2], E: m[3] });
    else if ((m = a.match(/^([A-Z]{4}) is an? (parallelogram|rectangle|rhombus|square|isosceles trapezoid|trapezoid|kite)$/))) out.push({ t: 'cls', q: m[1], c: m[2] });
    else if ((m = a.match(/^([A-Z]{2}) = 1\/2\s?\(([A-Z]{2}) \+ ([A-Z]{2})\)$/))) out.push({ t: 'halfsum', a: m[1], b: m[2], c: m[3] });
    else if ((m = a.match(/^([A-Z]{2}) = 1\/2\s?([A-Z]{2})$/))) out.push({ t: 'half', a: m[1], b: m[2] });
    else if ((m = a.match(/^([A-Z]{2}) = ([A-Z]{2}) \+ ([A-Z]{2})$/))) out.push({ t: 'sum', a: m[1], b: m[2], c: m[3] });
    else out.push({ t: '?', s: a });
  }
  return out;
}
const BANNED = [
  [/^Opposite sides of a parallelogram are congruent$/, /^Parallelogram opposite sides are congruent$/],
  [/^Consecutive angles of a parallelogram are supplementary$/, /^Consecutive angles supplementary$/],
  [/^The diagonals of a parallelogram bisect each other$/, /^Parallelogram diagonals bisect each other$/],
  [/^The diagonals of a rectangle are congruent$/, /^Rectangle diagonals are congruent$/],
  [/^If one pair of opposite sides is both parallel and congruent/, /^One-pair test$/],
  [/^[A-Z] parallelogram with a right angle is a rectangle$/, /^Parallelogram with a right angle$/],
  [/^The diagonals of an isosceles trapezoid are congruent$/, /^Isosceles trapezoid diagonals are congruent$/],
];
class Know {
  constructor(pts) { this.pts = pts; this.S = uf(); this.A = uf(); this.Pl = uf(); this.right = new Set(); this.perp = []; this.tri = []; this.cls = []; this.mid = {}; this.E = null; this.meet = []; this.rel = []; this.col = []; }
  P(n) { return this.pts[n]; }
  segK(n) { return skey(n); }
  angK(n) { // vertex + two ray directions
    const V = this.P(n[1]), a = this.P(n[0]), b = this.P(n[2]);
    if (!V || !a || !b) return 'x' + n;
    const d = x => Math.round(((Math.atan2(x[1], x[0]) * 180) / Math.PI + 360) % 360 * 10) / 10;
    return n[1] + ':' + [d(sub(a, V)), d(sub(b, V))].sort((x, y) => x - y).join(',');
  }
  isRight(n) {
    if (this.right.has(this.angK(n))) return true;
    for (const c of this.cls) if (/rectangle|square/.test(c.c)) { const Q = c.q; for (let i = 0; i < 4; i++) if (this.angK(Q[(i + 3) % 4] + Q[i] + Q[(i + 1) % 4]) === this.angK(n)) return true; }
    for (const pp of this.perp) {
      const V = this.P(n[1]), a = this.P(n[0]), b = this.P(n[2]);
      const on = (X, l) => onLine(X, this.P(l[0]), this.P(l[1])) && onLine(V, this.P(l[0]), this.P(l[1]));
      if (V && a && b && ((on(a, pp[0]) && on(b, pp[1])) || (on(a, pp[1]) && on(b, pp[0])))) return true;
    }
    return false;
  }
  segEq(a, b) { return skey(a) === skey(b) || this.S.same(skey(a), skey(b)); }
  /** in a congruence the shared side counts only once the reflexive line has been written */
  segEqStated(a, b) { return skey(a) === skey(b) ? !!this.refl?.[skey(a)] : this.S.same(skey(a), skey(b)); }
  angEq(a, b) { return this.angK(a) === this.angK(b) || this.A.same(this.angK(a), this.angK(b)) || (this.isRight(a) && this.isRight(b)); }
  lineK(n) { return skey(n); }
  parallelKnown(l1, l2) { // lines through the segments, by the drawn points
    const same = (x, y) => onLine(this.P(x[0]), this.P(y[0]), this.P(y[1])) && onLine(this.P(x[1]), this.P(y[0]), this.P(y[1]));
    const segs = Object.keys(this.parSegs ?? {});
    const c1 = segs.filter(s => same(s, l1)).map(s => this.Pl.find(s)), c2 = segs.filter(s => same(s, l2)).map(s => this.Pl.find(s));
    return c1.some(x => c2.includes(x));
  }
  addPar(a, b) { this.parSegs ??= {}; this.parSegs[skey(a)] = 1; this.parSegs[skey(b)] = 1; this.Pl.union(skey(a), skey(b)); }
  quadOf(name) { return this.cls.filter(c => skey(c.q) === skey(name)); }
  isA(Q, c) { // Q known to be in class c (by the stated classes)
    const sub = { parallelogram: ['parallelogram', 'rectangle', 'rhombus', 'square'], rectangle: ['rectangle', 'square'], rhombus: ['rhombus', 'square'] };
    return this.cls.some(k => skey(k.q) === skey(Q) && (sub[c] ?? [c]).includes(k.c));
  }
  quads(c) { return this.cls.filter(k => this.isA(k.q, c)).map(k => k.q); }
  add(at) {
    if (at.t === 'seg') { this.S.union(skey(at.a), skey(at.b)); if (skey(at.a) === skey(at.b)) (this.refl ??= {})[skey(at.a)] = 1; }
    else if (at.t === 'ang') this.A.union(this.angK(at.a), this.angK(at.b));
    else if (at.t === 'par') this.addPar(at.a, at.b);
    else if (at.t === 'tri') this.tri.push([at.a, at.b]);
    else if (at.t === 'right') this.right.add(this.angK(at.a));
    else if (at.t === 'perp') { this.perp.push([at.a, at.b]); if (at.E) this.meet.push({ a: at.a, b: at.b, E: at.E }); }
    else if (at.t === 'cls') this.cls.push({ q: at.q, c: at.c });
    else if (at.t === 'mid') this.mid[at.p] = at.s;
    else if (at.t === 'E') this.E = at.E;
    else if (at.t === 'meet') this.meet.push(at);
    else if (at.t === 'col') this.col.push(at.p);
    else if (at.t === 'half' || at.t === 'sum' || at.t === 'halfsum') this.rel.push(at);
  }
}
/** opposite / consecutive vertex and side helpers on a quadrilateral name */
const sidesOfQ = Q => [0, 1, 2, 3].map(i => skey(Q[i] + Q[(i + 1) % 4]));
const oppSides = (Q, a, b) => { const s = sidesOfQ(Q), i = s.indexOf(skey(a)), j = s.indexOf(skey(b)); return i >= 0 && j >= 0 && (i - j + 4) % 4 === 2; };
const consSides = (Q, a, b) => { const s = sidesOfQ(Q), i = s.indexOf(skey(a)), j = s.indexOf(skey(b)); return i >= 0 && j >= 0 && (i - j + 4) % 2 === 1; };
const vertexAngleOf = (Q, n, K) => { for (let i = 0; i < 4; i++) if (K.angK(Q[(i + 3) % 4] + Q[i] + Q[(i + 1) % 4]) === K.angK(n)) return i; return -1; };

/** alternate interior (kind 'alt') or same-side interior ('same') angles at V1 and V2 formed by the transversal V1V2 */
function interiorPair(K, a1, a2, kind) {
  const tryIt = (x, y) => {
    const V1 = x[1], V2 = y[1];
    if (V1 === V2) return null;
    const P1 = K.P(V1), P2 = K.P(V2);
    if (!P1 || !P2) return null;
    // one ray of each along the transversal, pointing at the other vertex
    const raysX = [x[0], x[2]], raysY = [y[0], y[2]];
    const along = (V, r, T) => { const d1 = sub(K.P(r), K.P(V)), d2 = sub(K.P(T), K.P(V)); return angDeg(d1, d2) < 0.8; };
    const tx = raysX.find(r => along(V1, r, V2)), ty = raysY.find(r => along(V2, r, V1));
    if (!tx || !ty) return null;
    const ox = raysX.find(r => r !== tx), oy = raysY.find(r => r !== ty);
    const d1 = sub(K.P(ox), P1), d2 = sub(K.P(oy), P2);
    const ad = angDeg(d1, d2);
    const sideX = Math.sign(cross(sub(P2, P1), d1)), sideY = Math.sign(cross(sub(P2, P1), d2));
    if (kind === 'alt' && !(ad > 179.2 && sideX !== sideY)) return null;
    if (kind === 'same' && !(ad < 0.8 && sideX === sideY)) return null;
    return [V1 + ox, V2 + oy];
  };
  return tryIt(a1, a2) ?? tryIt(a2, a1);
}
function verticalPair(K, a, b) {
  if (a[1] !== b[1]) return false;
  const V = K.P(a[1]);
  const opp = (x, y) => angDeg(sub(K.P(x), V), sub(K.P(y), V)) > 179.2;
  return (opp(a[0], b[0]) && opp(a[2], b[2])) || (opp(a[0], b[2]) && opp(a[2], b[0]));
}
/** parts of a triangle correspondence △abc ≅ △def known: sides [ab, bc, ca], angles [a, b, c] */
function triParts(K, t1, t2) {
  const sides = [[0, 1], [1, 2], [2, 0]].map(([i, j]) => K.segEqStated(t1[i] + t1[j], t2[i] + t2[j]));
  const ang = [0, 1, 2].map(i => { const o = [0, 1, 2].filter(k => k !== i); return K.angEq(t1[o[0]] + t1[i] + t1[o[1]], t2[o[0]] + t2[i] + t2[o[1]]); });
  return { sides, ang };
}
function triOK(K, t1, t2, why) {
  const { sides: s, ang: a } = triParts(K, t1, t2);
  // side k = [k, k+1]; included angle between sides k and k+1 is at vertex k+1
  if (why === 'SSS') return s.every(Boolean);
  if (why === 'SAS') return [0, 1, 2].some(k => s[k] && s[(k + 1) % 3] && a[(k + 1) % 3]);
  if (why === 'ASA') return [0, 1, 2].some(k => s[k] && a[k] && a[(k + 1) % 3]);
  if (why === 'AAS') return [0, 1, 2].some(k => s[k] && a.filter(Boolean).length >= 2 && !(a[k] && a[(k + 1) % 3]));
  return false;
}
function cpctcOK(K, at) {
  for (const [t1, t2] of K.tri) {
    for (const [x, y] of [[t1, t2], [t2, t1]]) {
      const map = {}; x.split('').forEach((c, i) => { map[c] = y[i]; });
      const img = s => s.split('').map(c => map[c] ?? '?').join('');
      if (at.t === 'seg' && at.a.split('').every(c => map[c]) && skey(img(at.a)) === skey(at.b)) return true;
      if (at.t === 'ang' && at.a.split('').every(c => map[c]) && K.angK(img(at.a)) === K.angK(at.b)) return true;
    }
  }
  return false;
}
function reasonOK(K, atoms, rs, ctx) {
  const r = plain(rs);
  if (!r) return false;
  for (const [title, re] of BANNED) if (title.test(ctx.title) && re.test(r)) return false;
  const G = ctx.givenAtoms;
  const inGiven = at => G.some(g => g.t === at.t && (
    (at.t === 'seg' && ((skey(g.a) === skey(at.a) && skey(g.b) === skey(at.b)) || (skey(g.a) === skey(at.b) && skey(g.b) === skey(at.a))))
    || (at.t === 'par' && [skey(g.a), skey(g.b)].sort().join() === [skey(at.a), skey(at.b)].sort().join())
    || (at.t === 'cls' && skey(g.q) === skey(at.q) && g.c === at.c)
    || (at.t === 'perp' && [skey(g.a), skey(g.b)].sort().join() === [skey(at.a), skey(at.b)].sort().join())
    || (at.t === 'right' && K.angK(g.a) === K.angK(at.a))));
  const all = f => atoms.length > 0 && atoms.every(f);
  switch (r) {
    case 'Given': return all(inGiven);
    case 'Definition of parallelogram':
      return all(at => (at.t === 'par' && K.quads('parallelogram').some(Q => oppSides(Q, at.a, at.b)))
        || (at.t === 'cls' && at.c === 'parallelogram' && K.parallelKnown(at.q[0] + at.q[1], at.q[2] + at.q[3]) && K.parallelKnown(at.q[1] + at.q[2], at.q[3] + at.q[0])));
    case 'Parallelogram opposite sides are congruent': return all(at => at.t === 'seg' && K.quads('parallelogram').some(Q => oppSides(Q, at.a, at.b)));
    case 'Parallelogram diagonals bisect each other': return all(at => {
      if (at.t !== 'seg') return false;
      const Es = [K.E, ...K.meet.map(m => m.E)].filter(Boolean);
      return K.quads('parallelogram').some(Q => Es.some(E => [[Q[0], Q[2]], [Q[1], Q[3]]].some(([u, v]) => [skey(u + E), skey(v + E)].sort().join() === [skey(at.a), skey(at.b)].sort().join())));
    });
    case 'Consecutive angles supplementary': return all(at => {
      if (at.t === 'sup') return K.quads('parallelogram').some(Q => { const i = vertexAngleOf(Q, at.a, K), j = vertexAngleOf(Q, at.b, K); return i >= 0 && j >= 0 && (i - j + 4) % 2 === 1; });
      if (at.t === 'right') return K.quads('parallelogram').some(Q => { const i = vertexAngleOf(Q, at.a, K); return i >= 0 && [1, 3].some(d => K.A.same(K.angK(at.a), K.angK(Q[(i + d + 3) % 4] + Q[(i + d) % 4] + Q[(i + d + 1) % 4]))); });
      return false;
    });
    case 'Alt. Interior Angles Theorem': return all(at => { if (at.t !== 'ang') return false; const pr = interiorPair(K, at.a, at.b, 'alt'); return !!pr && K.parallelKnown(pr[0], pr[1]); });
    case 'Same-Side Interior Angles': return all(at => { if (at.t !== 'sup') return false; const pr = interiorPair(K, at.a, at.b, 'same'); return !!pr && K.parallelKnown(pr[0], pr[1]); });
    case 'Alt. Interior Angles Converse': return all(at => {
      if (at.t !== 'par') return false;
      // a known pair of congruent alternate interior angles made by these two lines
      const angs = Object.keys(ctx.angNames);
      for (const a1 of angs) for (const a2 of angs) {
        if (a1 >= a2 || !K.A.same(K.angK(a1), K.angK(a2))) continue;
        const pr = interiorPair(K, a1, a2, 'alt');
        if (!pr) continue;
        const same = (x, y) => onLine(K.P(x[0]), K.P(y[0]), K.P(y[1])) && onLine(K.P(x[1]), K.P(y[0]), K.P(y[1]));
        if ((same(pr[0], at.a) && same(pr[1], at.b)) || (same(pr[0], at.b) && same(pr[1], at.a))) return true;
      }
      return false;
    });
    case 'Vertical Angles Theorem': return all(at => at.t === 'ang' && verticalPair(K, at.a, at.b));
    case 'All right angles are congruent': return all(at => at.t === 'ang' && K.isRight(at.a) && K.isRight(at.b));
    case 'Reflexive Property of Congruence': return all(at => at.t === 'seg' && skey(at.a) === skey(at.b));
    case 'SSS': case 'SAS': case 'ASA': case 'AAS': return all(at => at.t === 'tri' && triOK(K, at.a, at.b, r));
    case 'CPCTC': return all(at => (at.t === 'seg' || at.t === 'ang') && cpctcOK(K, at));
    case 'One-pair test': return all(at => at.t === 'cls' && at.c === 'parallelogram' && [[0, 2], [1, 3]].some(([i, j]) => { const Q = at.q, a = Q[i] + Q[(i + 1) % 4], b = Q[j] + Q[(j + 1) % 4]; return K.parallelKnown(a, b) && K.segEq(a, b); }));
    case 'Parallelogram with a right angle': return all(at => at.t === 'cls' && at.c === 'rectangle' && K.isA(at.q, 'parallelogram') && [0, 1, 2, 3].some(i => K.isRight(at.q[(i + 3) % 4] + at.q[i] + at.q[(i + 1) % 4])));
    case 'Consecutive sides congruent': return all(at => at.t === 'cls' && at.c === 'rhombus' && K.isA(at.q, 'parallelogram') && [0, 1, 2, 3].some(i => K.segEq(at.q[i] + at.q[(i + 1) % 4], at.q[(i + 1) % 4] + at.q[(i + 2) % 4])));
    case 'Isosceles trapezoid base angles are congruent': return all(at => {
      if (at.t !== 'ang') return false;
      return K.quads('isosceles trapezoid').some(Q => {
        const i = vertexAngleOf(Q, at.a, K), j = vertexAngleOf(Q, at.b, K);
        if (i < 0 || j < 0 || (i - j + 4) % 4 !== 1 && (i - j + 4) % 4 !== 3) return false;
        const base = (i + 1) % 4 === j ? Q[i] + Q[j] : Q[j] + Q[i];
        const k = sidesOfQ(Q).indexOf(skey(base));
        return K.parallelKnown(base, Q[(k + 2) % 4] + Q[(k + 3) % 4]);
      });
    });
    case 'Triangle Midsegment Theorem': {
      const par = atoms.find(a => a.t === 'par'), half = atoms.find(a => a.t === 'half');
      if (!par || !half || atoms.length !== 2 || skey(par.a) !== skey(half.a) || skey(par.b) !== skey(half.b)) return false;
      const [X, Y] = par.a.split('');
      const sx = K.mid[X], sy = K.mid[Y];
      if (!sx || !sy) return false;
      const shared = sx.split('').find(c => sy.includes(c));
      if (!shared) return false;
      const third = sx.replace(shared, '') + sy.replace(shared, '');
      return skey(third) === skey(par.b);
    }
    case 'Lines parallel to one line are parallel': return all(at => at.t === 'par' && K.Pl.same(skey(at.a), skey(at.b)) && !inGiven(at));
    case 'Parallel Postulate': return all(at => {
      if (at.t !== 'col') return false;
      const [u, y, w] = at.p;
      const segs = [[u, y], [y, w], [u, w]];
      // two of the segments share a point and are parallel to one known line
      return segs.some((s1, i) => segs.some((s2, j) => i < j && (s1.some(c => s2.includes(c))) && K.parSegs?.[skey(s1.join(''))] && K.parSegs?.[skey(s2.join(''))] && K.Pl.same(skey(s1.join('')), skey(s2.join('')))));
    });
    case 'Segment Addition Postulate': return all(at => {
      if (at.t !== 'sum') return false;
      const pts = new Set((at.b + at.c).split(''));
      const mids = at.b.split('').filter(c => at.c.includes(c));
      if (mids.length !== 1) return false;
      const ends = [...pts].filter(c => c !== mids[0]);
      if (skey(ends.join('')) !== skey(at.a)) return false;
      return K.col.some(c => c.includes(mids[0]) && ends.every(e => c.includes(e))) && (() => { const A = K.P(ends[0]), B = K.P(ends[1]), M = K.P(mids[0]); return A && B && M && dot(sub(M, A), sub(B, A)) > 0 && dot(sub(M, B), sub(A, B)) > 0; })();
    });
    case 'Substitution Property': return all(at => {
      if (at.t !== 'halfsum') return false;
      const sum = K.rel.find(x => x.t === 'sum' && skey(x.a) === skey(at.a));
      if (!sum) return false;
      const halves = K.rel.filter(x => x.t === 'half');
      const halfOf = s => halves.find(h => skey(h.a) === skey(s))?.b;
      const h1 = halfOf(sum.b), h2 = halfOf(sum.c);
      return !!h1 && !!h2 && [skey(h1), skey(h2)].sort().join() === [skey(at.b), skey(at.c)].sort().join();
    });
    default: return false;
  }
}
/** check rows in order; returns the index of the first failing row, or -1 */
function checkRows(q, rows) {
  const C = proofCtx(q);
  const K = new Know(C.pts);
  const givenAtoms = C.pr.given.flatMap(g => tex(g).split(/;\s*/).flatMap(atomsOf));
  for (const a of givenAtoms) K.add(a);
  // angle names used anywhere (for the converse search)
  const angNames = {};
  for (const r of rows) for (const a of atomsOf(r.st)) if (a.t === 'ang') { angNames[a.a] = 1; angNames[a.b] = 1; }
  const ctx = { title: C.title, givenAtoms, angNames };
  for (let i = 0; i < rows.length; i++) {
    const atoms = atomsOf(rows[i].st);
    if (atoms.some(a => a.t === '?')) return i;
    if (!reasonOK(K, atoms, rows[i].rs, ctx)) return i;
    for (const a of atoms) K.add(a);
  }
  return -1;
}
const proveDone = (q, rows) => { const C = proofCtx(q); const last = rows[rows.length - 1]; return !!last && tex(last.st).replace(/\s+/g, '') === tex(C.pr.prove).replace(/\s+/g, ''); };
function proofFamily(q) {
  const C = proofCtx(q);
  if (!C) return undefined;
  const rows0 = C.pr.rows.map(r => ({ st: tex(r.st), rs: plain(r.rs) }));
  if (C.pr.pool) {
    return choiceIdx(q, c => {
      const order = c.split(',').map(x => x.trim().charCodeAt(0) - 65);
      if (order.some(i => !(i >= 0 && i < rows0.length))) return false;
      const rows = order.map(i => rows0[i]);
      return checkRows(q, rows) === -1 && proveDone(q, rows);
    });
  }
  const ask = C.pr.ask?.[0];
  if (!ask) return undefined;
  return choiceIdx(q, c => {
    const rows = rows0.map(r => ({ ...r }));
    if (ask.cell === 'rs') rows[ask.i].rs = plain(c); else rows[ask.i].st = plain(c).replace(/\s*\(Given\)$/, '');
    if (ask.cell === 'st' && /\(Given\)$/.test(plain(c)) && plain(rows0[ask.i].rs) !== 'Given') return false;
    return checkRows(q, rows) === -1;
  });
}

// =====================================================================================================================
const SOLVERS = {
  markRead, markMeaning, defPick, defGallery, inclWhy, treeName, inheritWhich, inheritChain, vennZone, allNames, mostSpecific,
  guaranteed, couldBe, allSomeNo, partWhole, oppCons, oppSide, perim, oppAngle, consAngle, polySum, polyMissing, measuredSum, extSum,
  regAngle, regSides, diagVocab, conjTable, diagHalf, rectDiag, rhombPerp, bisMeaning, rhombBis: statedChase, chaseRect: statedChase,
  chaseRhomb: statedChase, mixedProp, eqOpp, eqCons, propReason: proofFamily, propOrder: proofFamily, suffMean, converseForm, necMean,
  paraTest, onePair, rectTestF, rhombTest, kiteDiag, isoTrapDiag, counterEx, fourWay, universe, testReason: proofFamily, solveForTest,
  trapMid, isoTrapAngle, trapProof: proofFamily, practical,
};
function solve(q) {
  const f = SOLVERS[q.family];
  if (!f) return undefined;
  const r = f(q);
  if (typeof r === 'number' && q.input !== 'choice' && Number.isFinite(r)) return round(r, 4);
  return r;
}

// =====================================================================================================================
// sane
const NOUNS = /^(parallelogram|trapezoid|trapezoid-shaped|ladder|path|middle|crew|framer|carpenter|regular|convex|quadrilateral|rhombus|square|rectangle|kite|shelf|garden|picture|door|patio|tabletop)\b/;
function sane(q) {
  const p = plain(q.prompt);
  // relabelled words: a letter where the article "A" stood, or capitals where "one" / "part" stood
  for (const m of p.matchAll(/(?:^|[.?!:]\s+)([B-Z]) ([a-z-]+)/g)) if (NOUNS.test(m[2])) return `"${m[1]} ${m[2]}": the article "A" was relabelled as a point letter`;
  const an = p.match(/\bAn ([B-Z])-frame/);
  if (an) return `"An ${an[1]}-frame": the A of "A-frame" was relabelled`;
  const pic = q.data?.picture;
  const F = figOf(pic?.fig);
  if (F && Object.keys(F.pts).length) {
    const names = new Set(Object.keys(F.pts));
    for (const m of p.matchAll(/\b([A-Z]{2,4})\b/g)) {
      if (/^(PART|ONE|ALL|NOT|SOME|ONLY|BOTH|MUST|AND|NO|OR|SSS|SAS|ASA|AAS|SSA|HL)$/.test(m[1])) continue;
      if (m[1].split('').some(c => !names.has(c))) return `"${m[1]}" is not a name in the figure (a relabelled word?)`;
    }
  }
  // answers that cannot be: nonpositive lengths / angles out of range
  const r = solve(q);
  if (q.input === 'num' && typeof r === 'number') {
    if (Number.isNaN(r)) return "the marks or givens do not determine the answer";
    if (!(r > 0)) return `the answer ${r} is not positive`;
    if (q.unit === '°' && r >= 180 && !['polySum', 'polyMissing'].includes(q.family)) return `an angle of ${r}° in a convex quadrilateral`;
  }
  if (q.input === 'num' && typeof r === 'number' && Number.isNaN(r)) return 'the marks or givens do not determine the answer';
  // algebra items: every expression must give a positive length / angle
  const fam = q.family;
  if (['eqOpp', 'eqCons', 'solveForTest', 'trapMid'].includes(fam)) {
    let x = null;
    if (fam === 'solveForTest' && typeof r === 'number') x = r;
    if (x === null) {
      const ex = [...p.matchAll(/= \(?([-\dx.+ ]*x[-\dx.+ ]*)\)?(°)?/g)].map(m => lin(m[1])).filter(Boolean);
      if (ex.length) {
        // x from the item's own relation is inside the solver; reuse it via the answers
        const m = p.match(/What is x\?/);
        if (m && typeof r === 'number') x = r;
      }
    }
    if (x !== null) for (const m of p.matchAll(/= \(?([-\dx.+ ]*x[-\dx.+ ]*)\)?/g)) { const e = lin(m[1]); if (e && !(val(e, x) > 0)) return `x = ${x} makes ${m[1].trim()} = ${val(e, x)}`; }
  }
  // a parallelogram's consecutive angles: the given angle must be below 180
  const am = p.match(/m∠[A-Z]{1,3} = ([\d.]+)°/);
  if (am && Number(am[1]) >= 180) return `an angle of ${am[1]}°`;
  return '';
}

export default { solve, sane };
