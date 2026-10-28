// Oracle for the lesson "coordinate-proofs" (Geometry 11: distance, midpoint and coordinate proofs). Written from what
// the student sees only (docs/lessons/QUALITY_LAYER.md, "O: the oracle"): the prompt, the board, the choices, the
// plotted points / segments / polygons / lines / circles, and the argument card. The lesson's generators, maths and
// tests were never opened.
//
// How it decides:
// - Numbers: coordinates are read from the prompt (or the board, or the card) and every length, midpoint, slope,
//   partition point, weighted average, perimeter and area is computed here exactly (rationals; lengths as simplest
//   radicals k√r, sums of radicals combined by radicand).
// - Figures: a quadrilateral ABCD is classified from its coordinates (simple, parallel sides by cross products, right
//   angles by dot products, equal sides by squared lengths), so a "parallelogram" that is secretly a rectangle or a
//   rhombus is caught.
// - Check sets ("which checks prove ABCD is a ...", "what else must be shown", counterexample claims) are judged on a
//   catalogue of every simple quadrilateral with A(0, 0), B(b, 0) and integer C, D in a box: a check set is enough
//   only when no quadrilateral in the catalogue passes every check and is not of the class.
// - Letters: placements, formulas and equations are parsed into expressions and evaluated at random values of the
//   letters. A placement is general for a class when every instance is in the class, a random instance is in no
//   special subclass, and it has as many free letters as the class has shape freedom (triangle 3, isosceles / right 2,
//   parallelogram 3, rectangle / rhombus 2, square 1). A needed condition must match the non-collapsed instances
//   exactly (tested on a grid of values incl. 0, negatives and equal letters).
// - Arguments: each choice's stated numbers are checked against the coordinates; an argument counts only when its
//   facts are true AND they are enough for its conclusion (appearance, rounding, a single example, insufficient
//   properties never count). Scope / critique / audit cards are read by their structure (examples, a measurement,
//   a general placement, a special placement, a counterexample), and their computations are re-done.
// - A choice question returns -1 when no single choice is right (or a text the oracle cannot read: the sweep then
//   shows it).
// - sane(q): plotted points at their stated coordinates and inside the window, drawn segments / polygons matching the
//   named points, no plotted point at the asked point, a vertex order that goes around, the right number of listed
//   examples, rounding ties, units, a claimed figure that is really that figure.
import { Q } from '../../tools/quality/oracle-kit.mjs';

// =====================================================================================================================
// text and numbers
const norm = s => String(s ?? '').replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
const qs = s => { const t = norm(s); const m = t.match(/^(-?)(\d+)\/(\d+)$/); if (m) { const f = Q(Number(m[2]), Number(m[3])); return m[1] ? f.neg() : f; } return Q(Number(t)); };
const NUMRE = '-?\\d+(?:\\.\\d+)?';
/** named points "A(−3, 2)" (numeric coordinates) in a text, in order: [{ n, p: [x, y] }] */
function namedPts(text) {
  return [...norm(text).matchAll(new RegExp(`(?<![A-Za-z])([A-Z])\\((${NUMRE}), (${NUMRE})\\)`, 'g'))].map(m => ({ n: m[1], p: [Number(m[2]), Number(m[3])] }));
}
const ptMap = text => { const o = {}; for (const { n, p } of namedPts(text)) o[n] ??= p; return o; };
/** bare points "(−3, 2)" in a text */
const barePts = text => [...norm(text).matchAll(new RegExp(`\\((${NUMRE}), (${NUMRE})\\)`, 'g'))].map(m => [Number(m[1]), Number(m[2])]);
const cardLines = q => q.data?.picture?.card?.lines ?? [];
const plane = q => q.data?.picture?.plane ?? null;
const eqn = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const idx = (q, pred) => { const h = (q.choices ?? []).map((c, i) => (pred(norm(c), i) ? i : -1)).filter(i => i >= 0); return h.length === 1 ? h[0] : -1; };

// =====================================================================================================================
// geometry (coordinates are integers or halves: floats are exact for these sums and products)
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const samePt = (a, b) => !!a && !!b && eqn(a[0], b[0]) && eqn(a[1], b[1]);
/** slope as a Q, or null for a vertical line */
const slopeQ = (a, b) => (eqn(a[0], b[0]) ? null : Q(b[1] - a[1]).div(Q(b[0] - a[0])));
const par = (a, b, c, d) => eqn(cross(sub(b, a), sub(d, c)), 0);
const perp = (a, b, c, d) => eqn(dot(sub(b, a), sub(d, c)), 0);
const onSeg = (p, a, b) => eqn(cross(sub(b, a), sub(p, a)), 0) && dot(sub(p, a), sub(p, b)) <= 1e-12;
function segsCross(a, b, c, d) {   // proper or touching intersection of two segments
  const o = (p, q, r) => Math.sign(Math.round(cross(sub(q, p), sub(r, p)) * 1e9));
  const o1 = o(a, b, c), o2 = o(a, b, d), o3 = o(c, d, a), o4 = o(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  return (o1 === 0 && onSeg(c, a, b)) || (o2 === 0 && onSeg(d, a, b)) || (o3 === 0 && onSeg(a, c, d)) || (o4 === 0 && onSeg(b, c, d));
}
const area2 = V => V.reduce((s, p, i) => s + cross(p, V[(i + 1) % V.length]), 0);   // twice the signed area
function simplePoly(V) {
  const n = V.length;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (samePt(V[i], V[j])) return false;
  for (let i = 0; i < n; i++) {
    if (eqn(cross(sub(V[(i + 1) % n], V[i]), sub(V[(i + 2) % n], V[i])), 0)) return false;   // three in a row on a line
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      if (segsCross(V[i], V[(i + 1) % n], V[j], V[(j + 1) % n])) return false;
    }
  }
  return true;
}
/** properties of quadrilateral V = [A, B, C, D] */
function quad(V) {
  const [A, B, C, D] = V;
  const s = [d2(A, B), d2(B, C), d2(C, D), d2(D, A)];
  const simple = simplePoly(V);
  const parAB = par(A, B, D, C), parBC = par(B, C, A, D);
  const right = [perp(D, A, A, B), perp(A, B, B, C), perp(B, C, C, D), perp(C, D, D, A)];
  const f = { simple, s, parAB, parBC, right };
  f.para = simple && parAB && parBC;
  f.rect = f.para && right[0];
  f.rhom = simple && s.every(x => eqn(x, s[0]));
  f.square = f.rect && f.rhom;
  f.diagCong = eqn(d2(A, C), d2(B, D));
  f.diagPerp = perp(A, C, B, D);
  f.diagBis = samePt(mid(A, C), mid(B, D));
  f.kite = simple && ((eqn(s[0], s[1]) && eqn(s[2], s[3])) || (eqn(s[1], s[2]) && eqn(s[3], s[0])));
  f.cls = f.square ? 'square' : f.rect ? 'rectangle' : f.rhom ? 'rhombus' : f.para ? 'parallelogram' : simple ? 'quadrilateral' : 'not simple';
  return f;
}
const isClass = (f, c) => ({ square: f.square, rectangle: f.rect, rhombus: f.rhom, parallelogram: f.para, quadrilateral: f.simple })[c];
const classWord = t => { const m = norm(t).toLowerCase().match(/square|rectangle|rhombus|parallelogram/); return m ? m[0] : null; };

// ---- exact lengths: k√r and sums of them ----
function simpleRad(n) {   // n a positive integer → [k, r] with k√r = √n
  let k = 1, r = n;
  for (let f = 2; f * f <= r; f++) while (r % (f * f) === 0) { r /= f * f; k *= f; }
  return [k, r];
}
const radd = (map, k, r) => { if (r === 1) map.set(1, (map.get(1) ?? 0) + k); else map.set(r, (map.get(r) ?? 0) + k); return map; };
const radKey = map => [...map.entries()].filter(([, k]) => k !== 0).sort((a, b) => a[0] - b[0]).map(([r, k]) => `${k}r${r}`).join('+');
/** "5 + 5√2 + √26" → canonical key (radicals simplified and combined) */
function radSumKey(text) {
  const map = new Map();
  for (const term of norm(text).split(' + ')) {
    const m = term.trim().match(/^(\d+)?(?:√(\d+))?$/);
    if (!m || (!m[1] && !m[2])) return null;
    const k = Number(m[1] ?? 1);
    if (m[2]) { const [k2, r] = simpleRad(Number(m[2])); radd(map, k * k2, r); } else radd(map, k, 1);
  }
  return radKey(map);
}

// =====================================================================================================================
// expressions with letters: s, m₁, y_M, 2s, (p + q)/2, (−s)², √(a² + c²), 16(m₁ − m₂)²
function tokenize(s) {
  const t = norm(s).replace(/×|·/g, '*').replace(/²/g, '^2');
  const out = [];
  for (let i = 0; i < t.length;) {
    const ch = t[i];
    if (ch === ' ') { i++; continue; }
    let m;
    if ((m = t.slice(i).match(/^\d+(?:\.\d+)?/))) { out.push({ n: Number(m[0]) }); i += m[0].length; continue; }
    if ((m = t.slice(i).match(/^[A-Za-z](?:[₀-₉]+|_[A-Za-z])?/))) { out.push({ v: m[0] }); i += m[0].length; continue; }
    if (ch === '√') { out.push({ o: 'sqrt' }); i++; continue; }
    if ('+-*/^()='.includes(ch)) { out.push({ o: ch }); i++; continue; }
    return null;
  }
  return out;
}
/** parse an expression into a function env → number (null when it cannot be read) */
function parseExpr(s) {
  const T = tokenize(s);
  if (!T || !T.length) return null;
  let i = 0;
  const peek = () => T[i], eat = o => (T[i]?.o === o ? (i++, true) : false);
  const expr = () => {
    let a = term();
    for (;;) {
      if (eat('+')) { const x = a, y = term(); a = e => x(e) + y(e); } else if (eat('-')) { const x = a, y = term(); a = e => x(e) - y(e); } else return a;
    }
  };
  const term = () => {
    let a = unary();
    for (;;) {
      const p = peek();
      if (eat('*')) { const x = a, y = unary(); a = e => x(e) * y(e); } else if (eat('/')) { const x = a, y = unary(); a = e => x(e) / y(e); } else if (p && (p.v || p.o === '(' || p.o === 'sqrt' || p.n !== undefined)) { const x = a, y = power(); a = e => x(e) * y(e); } else return a;
    }
  };
  const unary = () => { if (eat('-')) { const x = unary(); return e => -x(e); } return power(); };
  const power = () => {
    const base = atom();
    if (eat('^')) { const ex = unary(); return e => base(e) ** ex(e); }
    return base;
  };
  const atom = () => {
    const p = T[i++];
    if (!p) throw new Error('end');
    if (p.n !== undefined) return () => p.n;
    if (p.v) return e => { if (!(p.v in e)) throw new Error(`no value for ${p.v}`); return e[p.v]; };
    if (p.o === '(') { const x = expr(); if (!eat(')')) throw new Error(')'); return x; }
    if (p.o === 'sqrt') { const x = atom(); return e => Math.sqrt(x(e)); }
    throw new Error(`unexpected ${p.o}`);
  };
  try { const f = expr(); if (i !== T.length) return null; return f; } catch { return null; }
}
const lettersOf = s => [...new Set((tokenize(s) ?? []).filter(t => t.v).map(t => t.v))];
let SEED = 12345;
const rnd = () => { SEED = (SEED * 1103515245 + 12345) % 2147483648; return SEED / 2147483648; };
/** random positive, distinct-ish values for letters */
function envFor(letters) { const e = {}; for (const l of letters) e[l] = Math.round((0.7 + rnd() * 5.3) * 1000) / 1000 + rnd() * 1e-3; return e; }
/** two expressions agree at random values of their letters */
function sameExpr(f, g, letters, k = 6) {
  for (let t = 0; t < k; t++) {
    const e = envFor(letters);
    let a, b;
    try { a = f(e); b = g(e); } catch { return false; }
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a - b) > 1e-7 * Math.max(1, Math.abs(a))) return false;
  }
  return true;
}
/** "(e1, e2)" pairs of expressions in a text, top level */
function exprPairs(text) {
  const out = [], t = norm(text);
  for (let i = 0; i < t.length; i++) {
    if (t[i] !== '(') continue;
    let depth = 0, j = i, comma = -1;
    for (; j < t.length; j++) {
      if (t[j] === '(') depth++;
      else if (t[j] === ')') { depth--; if (depth === 0) break; } else if (t[j] === ',' && depth === 1) comma = j;
    }
    if (comma < 0 || j >= t.length) continue;
    const a = t.slice(i + 1, comma), b = t.slice(comma + 1, j);
    const fa = parseExpr(a), fb = parseExpr(b);
    if (fa && fb) { out.push({ a, b, fa, fb, name: /[A-Z]$/.test(t.slice(0, i)) ? t[i - 1] : null, at: i }); i = j; }
  }
  return out;
}
/** named points with expression coordinates "B(p + q, r)" */
function namedExprPts(text) { const o = {}; for (const p of exprPairs(text)) if (p.name) o[p.name] ??= p; return o; }

// ---- figures from placements ----
const TRI_DIM = { triangle: 3, isosceles: 2, right: 2, equilateral: 1 };
const QUAD_DIM = { parallelogram: 3, rectangle: 2, rhombus: 2, square: 1 };
const SUBS = { triangle: ['isosceles', 'right', 'equilateral'], isosceles: ['equilateral', 'right'], right: ['isosceles'], equilateral: [], parallelogram: ['rectangle', 'rhombus'], rectangle: ['square'], rhombus: ['square'], square: [] };
function triIs(V, c) {
  if (eqn(area2(V), 0)) return false;
  const s = [d2(V[0], V[1]), d2(V[1], V[2]), d2(V[2], V[0])].sort((a, b) => a - b);
  if (c === 'triangle') return true;
  if (c === 'isosceles') return eqn(s[0], s[1]) || eqn(s[1], s[2]);
  if (c === 'equilateral') return eqn(s[0], s[2]);
  if (c === 'right') return eqn(s[0] + s[1], s[2]);
  return false;
}
const figIs = (V, c) => (V.length === 3 ? triIs(V, c) : isClass(quad(V), c));
/** is this placement (list of {fa, fb}) general for class c? */
function generalFor(P, c) {
  const letters = [...new Set(P.flatMap(p => [...lettersOf(p.a), ...lettersOf(p.b)]))];
  const dim = (P.length === 3 ? TRI_DIM : QUAD_DIM)[c];
  if (dim === undefined || letters.length < dim) return false;
  let generic = false;
  for (let t = 0; t < 12; t++) {
    const e = envFor(letters);
    const V = P.map(p => [p.fa(e), p.fb(e)]);
    if (!figIs(V, c)) return false;
    if (!SUBS[c].some(sc => figIs(V, sc))) generic = true;
  }
  return generic;
}
function choiceClass(t) {
  const s = norm(t).toLowerCase();
  if (/every triangle/.test(s)) return 'triangle';
  if (/isosceles/.test(s)) return 'isosceles';
  if (/right triangles/.test(s)) return 'right';
  if (/equilateral/.test(s)) return 'equilateral';
  if (/parallelogram/.test(s)) return 'parallelogram';
  if (/rectangle/.test(s)) return 'rectangle';
  if (/rhomb/.test(s)) return 'rhombus';
  if (/square/.test(s)) return 'square';
  return null;
}

// =====================================================================================================================
// the quadrilateral catalogue (check sets)
let CAT = null;
function catalogue() {
  if (CAT) return CAT;
  CAT = [];
  for (let b = 1; b <= 5; b++) for (let cx = -5; cx <= 8; cx++) for (let cy = -5; cy <= 8; cy++) for (let dx = -5; dx <= 8; dx++) for (let dy = -5; dy <= 8; dy++) {
    if (cy <= 0 && dy <= 0) continue;
    const V = [[0, 0], [b, 0], [cx, cy], [dx, dy]];
    const f = quad(V);
    if (f.simple) CAT.push(f);
  }
  return CAT;
}
/** a check phrase → predicate on quad facts (null: unread) */
function checkPred(text) {
  const t = norm(text).toLowerCase().replace(/\(equal slopes\)/, '').trim();
  const preds = [];
  if (/diagonals/.test(t)) {
    if (/share a midpoint|bisect each other/.test(t)) preds.push(f => f.diagBis);
    if (/congruent/.test(t)) preds.push(f => f.diagCong);
    if (/perpendicular/.test(t)) preds.push(f => f.diagPerp);
    if (!preds.length) return null;
    if (/\bside|angle/.test(t)) return null;
    return f => preds.every(p => p(f));
  }
  let rest = t;
  const take = (re, p) => { if (re.test(rest)) { preds.push(p); rest = rest.replace(re, ' '); } };
  take(/both pairs of opposite sides are parallel/, f => f.parAB && f.parBC);
  take(/one pair of opposite sides is parallel/, f => f.parAB || f.parBC);
  take(/one pair of opposite sides is congruent/, f => eqn(f.s[0], f.s[2]) || eqn(f.s[1], f.s[3]));
  take(/all four angles are right(?: angles)?/, f => f.right.every(Boolean));
  take(/all four sides are congruent|four congruent sides/, f => f.s.every(x => eqn(x, f.s[0])));
  take(/two pairs of consecutive sides are congruent/, f => f.kite);
  take(/two consecutive sides are congruent/, f => [0, 1, 2, 3].some(i => eqn(f.s[i], f.s[(i + 1) % 4])));
  take(/one angle is (?:a )?right(?: angle)?/, f => f.right.some(Boolean));
  if (!preds.length || /[a-z]{3,}/.test(rest.replace(/\band\b|\bare\b|\bis\b/g, ''))) return null;
  return f => preds.every(p => p(f));
}
/** does the set of predicates force class c (on the catalogue)? null if nothing in the catalogue passes */
function forces(preds, c) {
  let any = false;
  for (const f of catalogue()) {
    if (!preds.every(p => p(f))) continue;
    any = true;
    if (!isClass(f, c)) return false;
  }
  return any ? true : null;
}

// =====================================================================================================================
// facts stated in an argument, checked against the points P
/** evaluate one side: XY², slope XY, numbers, a/b, × + − */
function factSide(s, P) {
  let t = norm(s).replace(/^the /i, '');
  const vals = [];
  const put = v => { vals.push(v); return ` @${vals.length - 1} `; };
  let bad = false;
  t = t.replace(/slope (?:of )?([A-Z])([A-Z])/gi, (_, a, b) => { if (!P[a] || !P[b]) { bad = true; return ''; } const m = slopeQ(P[a], P[b]); if (!m) { bad = true; return ''; } return put(m); });
  t = t.replace(/([A-Z])([A-Z])²/g, (_, a, b) => { if (!P[a] || !P[b]) { bad = true; return ''; } return put(Q(d2(P[a], P[b]))); });
  if (bad) return null;
  const T = t.replace(/×/g, '*').match(/@\d+|\d+(?:\.\d+)?|[-+*/()]/g);
  if (!T || T.join('').replace(/\s/g, '') !== t.replace(/\s/g, '').replace(/×/g, '*')) return null;
  let i = 0;
  const atom = () => { const x = T[i++]; if (x === '(') { const v = ex(); i++; return v; } if (x === '-') return atom().neg(); if (x?.startsWith('@')) return vals[Number(x.slice(1))]; return qs(x); };
  const tm = () => { let a = atom(); while (T[i] === '*' || T[i] === '/') { const o = T[i++]; const b = atom(); a = o === '*' ? a.mul(b) : a.div(b); } return a; };
  const ex = () => { let a = tm(); while (T[i] === '+' || T[i] === '-') { const o = T[i++]; const b = tm(); a = o === '+' ? a.add(b) : a.sub(b); } return a; };
  try { const v = ex(); return i === T.length ? v : null; } catch { return null; }
}
/** every "a = b = c" / "a ≠ b" / "XY has slope v" / "share the midpoint (x, y)" in a text: true, false, or null (nothing read) */
function factsTrue(text, P) {
  let read = 0;
  for (const cl of norm(text).replace(/[.]$/, '').split(/,|;|:| but | and | so /)) {
    const c = cl.trim();
    let m;
    if ((m = c.match(/^([A-Z])([A-Z]) has slope (\S+)$/))) {
      read++; const s = slopeQ(P[m[1]], P[m[2]]);
      if (!s || !s.eq(qs(m[3]))) return false;
      continue;
    }
    if ((m = c.match(/share the midpoint \((\S+), (\S+)\)/))) {
      read++; const want = [qs(m[1]).value, qs(m[2]).value];
      const D = c.match(/([A-Z])([A-Z]) and ([A-Z])([A-Z]) share/) ?? ['', 'A', 'C', 'B', 'D'];
      if (!samePt(mid(P[D[1]], P[D[2]]), want) || !samePt(mid(P[D[3]], P[D[4]]), want)) return false;
      continue;
    }
    if ((m = c.match(/^([A-Z])([A-Z]) and ([A-Z])([A-Z]) share a midpoint$/))) {
      read++; if (!samePt(mid(P[m[1]], P[m[2]]), mid(P[m[3]], P[m[4]]))) return false;
      continue;
    }
    if (c.includes('≠')) {
      const [a, b] = c.split('≠').map(x => factSide(x, P));
      if (a && b) { read++; if (a.eq(b)) return false; }
      continue;
    }
    if (c.includes('=')) {
      const sides = c.split('=').map(x => factSide(x, P));
      if (sides.some(x => !x)) continue;
      read++;
      if (!sides.every(x => x.eq(sides[0]))) return false;
    }
  }
  return read ? true : null;
}
/** the numbers after "XY² = " in a text, by segment */
function statedSq(text) { const o = {}; for (const m of norm(text).matchAll(/([A-Z]{2})² = (?:[A-Z]{2}² = )?(-?\d+(?:\.\d+)?)/g)) o[m[1]] = Number(m[2]); return o; }

// =====================================================================================================================
// lines given by equations
function lineEq(s) {
  const parts = norm(s).split('=');
  if (parts.length !== 2) return null;
  const L = parseExpr(parts[0]), R = parseExpr(parts[1]);
  if (!L || !R) return null;
  try {
    const f = (x, y) => L({ x, y }) - R({ x, y });
    const c = f(0, 0), a = f(1, 0) - c, b = f(0, 1) - c;
    return { a, b, c };   // a x + b y + c = 0
  } catch { return null; }
}
const lineThrough = (p, q) => ({ a: q[1] - p[1], b: p[0] - q[0], c: -((q[1] - p[1]) * p[0] + (p[0] - q[0]) * p[1]) });
function relation(L1, L2) {
  const det = L1.a * L2.b - L2.a * L1.b;
  if (eqn(det, 0)) {
    const same = eqn(L1.a * L2.c - L2.a * L1.c, 0) && eqn(L1.b * L2.c - L2.b * L1.c, 0);
    return same ? 'same' : 'parallel';
  }
  return eqn(L1.a * L2.a + L1.b * L2.b, 0) ? 'perpendicular' : 'neither';
}

// =====================================================================================================================
// families
const asPair = p => [p[0], p[1]];
function distAnswer(q, A, B) {
  const n = d2(A, B);
  if (q.input === 'num') return Math.sqrt(n);
  if (!Number.isInteger(n)) return undefined;
  return simpleRad(n);
}

const F = {};

// ---- distance ----
F.distTri = q => {
  const P = namedPts(q.board).map(x => x.p);
  if (/lie on a (horizontal|vertical) line/.test(q.prompt)) return Math.sqrt(d2(P[0], P[1]));
  return distAnswer(q, P[0], P[1]);
};
F.distX = q => { const P = namedPts(q.board).map(x => x.p); return distAnswer(q, P[0], P[1]); };
F.distSq = q => { const P = namedPts(q.board).map(x => x.p); return d2(P[0], P[1]); };
F.distLegs = q => {
  const [A, B] = namedPts(q.board).map(x => x.p), want = d2(A, B);
  // the expression must be √(dx² + dy²) of the run and rise (any sign), value alone is not enough: "7 + 1" ≠ distance
  return idx(q, c => {
    const m = c.match(/^√\((\(?-?\d+\)?)² \+ (\(?-?\d+\)?)²\)$/);
    if (!m) return false;
    const a = Number(m[1].replace(/[()]/g, '')), b = Number(m[2].replace(/[()]/g, ''));
    return Math.abs(a) === Math.abs(A[0] - B[0]) && Math.abs(b) === Math.abs(A[1] - B[1]) && a * a + b * b === want;
  });
};

// ---- vocabulary ----
F.vocabMid = q => {
  const P = namedPts(q.prompt);
  const [X, Y, M] = P.map(x => x.p);
  const on = onSeg(M, X, Y), eq = eqn(d2(M, X), d2(M, Y));
  return idx(q, c => (/is the midpoint/.test(c) && !/not/.test(c) ? on && eq : /not on/.test(c) ? !on : /differ/.test(c) ? !eq : false));
};
F.vocabBisect = q => {
  const P = ptMap(q.prompt);
  const abBisCd = onSeg(mid(P.C, P.D), P.A, P.B), cdBisAb = onSeg(mid(P.A, P.B), P.C, P.D);
  return idx(q, c => {
    if (/^Neither/.test(c)) return !abBisCd && !cdBisAb;
    if (/bisect each other/.test(c)) return abBisCd && cdBisAb;
    if (/^AB bisects CD/.test(c)) return abBisCd && !cdBisAb;
    if (/^CD bisects AB/.test(c)) return cdBisAb && !abBisCd;
    return false;
  });
};

// ---- exact comparison ----
F.congExact = q => {
  const P = ptMap(q.prompt), eq = eqn(d2(P.A, P.B), d2(P.C, P.D));
  return idx(q, c => (/^Congruent: AB² = CD²/.test(c) ? eq : /^Not congruent/.test(c) ? !eq : false));
};
F.whichLonger = q => {
  const m = norm(q.prompt).match(/Compare ([A-Z])([A-Z]) and ([A-Z])([A-Z])/), P = ptMap(q.prompt);
  const a = d2(P[m[1]], P[m[2]]), b = d2(P[m[3]], P[m[4]]);
  return idx(q, c => (/congruent/.test(c) ? eqn(a, b) : c.startsWith(m[1] + m[2]) ? a > b && !eqn(a, b) : c.startsWith(m[3] + m[4]) ? b > a && !eqn(a, b) : false));
};

// ---- midpoints and endpoints ----
const midOf = q => { const P = namedPts(q.board).map(x => x.p); return mid(P[0], P[1]); };
const endOf = q => { const P = ptMap(q.board); const other = Object.keys(P).find(k => k !== 'M'); return [2 * P.M[0] - P[other][0], 2 * P.M[1] - P[other][1]]; };
F.midPt = q => midOf(q);
F.midMix = q => (/^M is the midpoint/.test(norm(q.prompt)) ? endOf(q) : midOf(q));
F.missEnd = q => endOf(q);
F.midWhich = q => { const M = midOf(q); return idx(q, c => samePt(barePts(c)[0], M)); };
F.missEndPick = q => { const E = endOf(q); return idx(q, c => samePt(barePts(c)[0], E)); };
F.bisectEach = q => {
  const P = ptMap(q.prompt), same = samePt(mid(P.A, P.C), mid(P.B, P.D));
  return idx(q, c => (/^Yes: AC and BD have the same midpoint/.test(c) ? same : /^No: AC and BD have different midpoints/.test(c) ? !same : false));
};
F.parFourth = q => { const P = ptMap(q.board); return [P.A[0] + P.C[0] - P.B[0], P.A[1] + P.C[1] - P.B[1]]; };

// ---- slopes and lines ----
function slopeText(c) {
  const t = norm(c);
  if (/^undefined$/i.test(t)) return 'undef';
  if (/^infinity$/i.test(t)) return 'inf';
  try { return qs(t); } catch { return null; }
}
F.slopeZU = q => {
  let m;   // Q, or null = vertical
  const P = namedPts(q.prompt);
  if (P.length >= 2) m = slopeQ(P[0].p, P[1].p);
  else { const L = lineEq(norm(q.prompt).match(/line (.*)\?$/)[1]); m = eqn(L.b, 0) ? null : Q(-L.a).div(Q(L.b)); }
  return idx(q, c => { const v = slopeText(c); return m === null ? v === 'undef' : v && typeof v === 'object' && v.eq(m); });
};
F.parTest = q => {
  const P = ptMap(q.prompt), rel = relation(lineThrough(P.P, P.Q), lineThrough(P.R, P.S));
  const vert = eqn(P.P[0], P.Q[0]) && eqn(P.R[0], P.S[0]);
  return idx(q, c => (/^Parallel: both are vertical/.test(c) ? rel === 'parallel' && vert : /^Parallel: equal slopes/.test(c) ? rel === 'parallel' && !vert : /^The same line/.test(c) ? rel === 'same' : /^Not parallel/.test(c) ? rel === 'perpendicular' || rel === 'neither' : false));
};
F.parSlope = q => {
  const P = namedPts(q.board).map(x => x.p), m = slopeQ(P[0], P[1]);
  return idx(q, c => { const v = slopeText(c); return !!m && v && typeof v === 'object' && v.eq(m); });
};
F.perpSlope = q => {
  const P = namedPts(q.board).map(x => x.p), m = slopeQ(P[0], P[1]);
  if (!m || m.eq(0)) return -1;
  const want = Q(-1).div(m);
  return idx(q, c => { const v = slopeText(c); return v && typeof v === 'object' && v.eq(want); });
};
F.perpTest = q => {
  const P = ptMap(q.prompt), rel = relation(lineThrough(P.A, P.B), lineThrough(P.C, P.D));
  return idx(q, c => c.toLowerCase() === rel);
};
F.hvRel = q => {
  const t = norm(q.prompt);
  let L1, L2;
  const P = ptMap(t);
  if (P.P) { L1 = lineThrough(P.P, P.Q); L2 = lineThrough(P.R, P.S); } else {
    const m = t.match(/How are (.*) and (.*) related\?/);
    L1 = lineEq(m[1]); L2 = lineEq(m[2]);
  }
  const rel = relation(L1, L2);
  return idx(q, c => (/^The same line/.test(c) ? rel === 'same' : /^Parallel/.test(c) ? rel === 'parallel' : /^Perpendicular/.test(c) ? rel === 'perpendicular' : /^Neither/.test(c) ? rel === 'neither' : false));
};
F.hvLine = q => {
  const t = norm(q.prompt), P = ptMap(t).P, G = lineEq(t.match(/perpendicular to (.*)\?$/)[1]);
  return idx(q, c => {
    if (/^No such line/.test(c)) return false;
    const L = lineEq(c);
    return !!L && eqn(L.a * P[0] + L.b * P[1] + L.c, 0) && relation(L, G) === 'perpendicular';
  });
};
F.lineRel = q => {
  const m = norm(q.prompt).match(/the lines (.*) and (.*) related\?/);
  const rel = relation(lineEq(m[1]), lineEq(m[2]));
  return idx(q, c => (/same line/i.test(c) ? rel === 'same' : c.toLowerCase() === rel));
};

// ---- partitions and weighted averages ----
F.partT = q => {
  const t = norm(q.prompt), m = t.match(/P is (\d+)\/(\d+) of the way from ([A-Z]) to ([A-Z])/), P = ptMap(t);
  const k = Number(m[1]) / Number(m[2]), X = P[m[3]], Y = P[m[4]];
  return [X[0] + k * (Y[0] - X[0]), X[1] + k * (Y[1] - X[1])];
};
F.partRatio = q => {
  const t = norm(q.prompt), m = t.match(/from ([A-Z]) to ([A-Z]) in the ratio (\d+):(\d+)/), P = ptMap(t);
  const k = Number(m[3]) / (Number(m[3]) + Number(m[4])), X = P[m[1]], Y = P[m[2]];
  return [X[0] + k * (Y[0] - X[0]), X[1] + k * (Y[1] - X[1])];
};
F.wAvg = q => {
  const W = [...norm(q.prompt).matchAll(new RegExp(`(\\d+) at ([A-Z])\\((${NUMRE}), (${NUMRE})\\)`, 'g'))].map(m => [Number(m[1]), Number(m[3]), Number(m[4])]);
  const w = W.reduce((s, x) => s + x[0], 0);
  return [Q(W.reduce((s, x) => s + x[0] * x[1], 0), w).value, Q(W.reduce((s, x) => s + x[0] * x[2], 0), w).value];
};
F.centroid = q => { const P = namedPts(q.prompt).map(x => x.p); return [Q(P[0][0] + P[1][0] + P[2][0], 3).value, Q(P[0][1] + P[1][1] + P[2][1], 3).value]; };
F.wMove = q => {
  const t = norm(q.prompt);
  let m;
  if ((m = t.match(/AP:PB = (\d+):(\d+)/))) {
    const r = Q(Number(m[2]), Number(m[1]));   // weight A : weight B = PB : AP
    return idx(q, c => { const k = c.match(/^(\d+) on A and (\d+) on B$/); return !!k && Q(Number(k[1]), Number(k[2])).eq(r); });
  }
  if ((m = t.match(/Weights of (\d+) at A and (\d+) at B .* the weight at ([AB]) grows to (\d+)/))) {
    const wa = m[3] === 'A' ? Number(m[4]) : Number(m[1]), wb = m[3] === 'B' ? Number(m[4]) : Number(m[2]);
    const want = wa === wb ? 'stays' : wb > wa ? 'B' : 'A';
    return idx(q, c => (/stays/.test(c) ? want === 'stays' : c === 'Toward B' ? want === 'B' : c === 'Toward A' ? want === 'A' : false));
  }
  return -1;
};

// ---- names: sides and diagonals ----
function cycleOf(q) { return norm(q.board).replace(/\\text\{[^}]*\}/g, '').replace(/[^A-Z]/g, '').split(''); }
const segKey = s => s.split('').sort().join('');
F.sideDiag = q => {
  const V = cycleOf(q), n = V.length;
  const sides = new Set(V.map((v, i) => segKey(v + V[(i + 1) % n])));
  return idx(q, c => /^[A-Z]{2}$/.test(c) && V.includes(c[0]) && V.includes(c[1]) && c[0] !== c[1] && !sides.has(segKey(c)));
};
F.closing = q => {
  const V = cycleOf(q), n = V.length;
  const sides = V.map((v, i) => segKey(v + V[(i + 1) % n])).sort().join(',');
  return idx(q, c => c.split(/, | and /).map(segKey).sort().join(',') === sides);
};

// ---- single-property claims ----
F.claimArg = q => {
  const t = norm(q.prompt), P = ptMap(t);
  const claimRight = /Claim: ∠A is a right angle/.test(t);
  return idx(q, c => {
    if (/look|round/.test(c)) return false;
    if (!/\bso\b/.test(c)) return false;   // facts with no conclusion: not an argument
    const facts = factsTrue(c.split(/\bso\b/)[0], P);
    if (facts !== true) return false;
    if (claimRight) {
      const m = c.match(/^Slope AB × slope AC = (\S+) × (\S+) = (\S+), so AB ⊥ AC and ∠A is right\.$/);
      return !!m && qs(m[3]).eq(-1);
    }
    let m;
    if ((m = c.match(/^AB² = AC² = (\d+), so AB ≅ AC and ABC is isosceles\.$/))) return true;
    if ((m = c.match(/^([A-Z]{2})² = (\d+) and ([A-Z]{2})² = (\d+), so ABC is isosceles\.$/))) return m[2] === m[4];
    if ((m = c.match(/^AB² = (\d+), BC² = (\d+), CA² = (\d+): no two are equal, so ABC is not isosceles\.$/))) return new Set([m[1], m[2], m[3]]).size === 3;
    return false;
  });
};
F.claimProp = q => {
  const P = ptMap(q.prompt);
  const facts = [samePt(mid(P.A, P.C), mid(P.B, P.D)), perp(P.A, P.B, P.B, P.C), eqn(d2(P.A, P.B), d2(P.B, P.C))];
  return idx(q, c => (/bisect each other/.test(c) ? facts[0] : c === 'AB ⊥ BC' ? facts[1] : c === 'AB ≅ BC' ? facts[2] : /^None/.test(c) ? !facts.some(Boolean) : false));
};

// ---- perimeter and area ----
function polyOf(q) { return namedPts(q.board).map(x => x.p); }
F.perimExact = q => {
  const V = polyOf(q), map = new Map();
  V.forEach((p, i) => { const n = d2(p, V[(i + 1) % V.length]); const [k, r] = simpleRad(n); radd(map, k, r); });
  const want = radKey(map);
  return idx(q, c => radSumKey(c) === want);
};
const perim = V => V.reduce((s, p, i) => s + Math.sqrt(d2(p, V[(i + 1) % V.length])), 0);
F.perimRound = q => Math.round(perim(polyOf(q)) * 10) / 10;
F.areaBox = q => Math.abs(area2(polyOf(q))) / 2;
F.areaRect = q => Math.abs(area2(polyOf(q))) / 2;

// ---- check sets ----
F.checkSet = q => {
  const c0 = classWord(norm(q.prompt).match(/proves ABCD is an? (\w+)/)[1]);
  const preds = (q.choices ?? []).map(checkPred);
  if (preds.some(p => !p)) return -1;
  return idx(q, (_, i) => forces([preds[i]], c0) === true);
};
F.checkNeed = q => {
  const t = norm(q.prompt), m = t.match(/has shown that (.*?)(?: of ABCD)? (?:are|is) (\w+)\. What else .* ABCD is an? (\w+)\?/);
  const givenText = norm(t.match(/has shown that (.*)\. What else/)[1]).replace(/ of ABCD/, '');
  const given = checkPred(givenText), c0 = classWord(m[3]);
  if (!given) return -1;
  return idx(q, c => {
    if (/^nothing/.test(c)) return forces([given], c0) === true;
    const p = checkPred(c);
    return !!p && forces([given, p], c0) === true && forces([given], c0) !== true;
  });
};

// ---- prove or disprove a figure ----
function quadPts(q) { const P = ptMap(q.prompt); return { P, V: [P.A, P.B, P.C, P.D] }; }
F.classify = q => {
  const f = quad(quadPts(q).V);
  return idx(q, c => c.toLowerCase() === f.cls);
};
F.verdict = q => {
  const { P, V } = quadPts(q), f = quad(V), claim = classWord(norm(q.prompt).match(/Claim: ABCD is an? (\w+)/)[1]);
  return idx(q, c => {
    if (/look|horizontal and vertical|it is a square, so it is not/.test(c)) return false;
    const truth = isClass(f, claim);
    let m;
    if (/^True: both pairs of opposite sides are parallel$|^True: [A-Z]{2} is parallel to [A-Z]{2}$/.test(c)) return false;
    if (/^True: all four sides have squared length/.test(c)) return claim === 'rhombus' && factsTrue(c, P) && truth;
    if ((m = c.match(/^True: AC and BD share the midpoint \(\S+, \S+\), and AC² = BD² = \d+\.$/))) return claim === 'rectangle' && factsTrue(c, P) === true && f.simple;
    if (/^False: AC and BD share a midpoint, but AC² = \d+ and BD² = \d+, so it is a parallelogram that is not a rectangle\.$/.test(c)) {
      const s = statedSq(c);
      return (claim === 'rectangle' || claim === 'square') && factsTrue(c.replace(/, so .*/, ''), P) === true && s.AC !== s.BD && f.para;
    }
    if (/^False: AC² = \d+ and BD² = \d+, so the diagonals are not congruent and it is a rhombus that is not a square\.$/.test(c)) {
      const s = statedSq(c);
      return (claim === 'square' || claim === 'rectangle') && factsTrue(c.replace(/, so .*/, ''), P) === true && s.AC !== s.BD && f.rhom;
    }
    if (/^False: AB² = \d+ but BC² = \d+$/.test(c)) {
      const s = statedSq(c);
      return (claim === 'square' || claim === 'rhombus') && factsTrue(c.replace(/^False: /, ''), P) === true && s.AB !== s.BC;
    }
    return false;
  });
};

// ---- right angles, circles ----
F.converse = q => {
  const [A, B, C] = namedPts(q.prompt).map(x => x.p);
  const s = [d2(A, B), d2(B, C), d2(C, A)].sort((a, b) => a - b);
  const kind = eqn(s[0] + s[1], s[2]) ? 'right' : s[0] + s[1] > s[2] ? 'acute' : 'obtuse';
  return idx(q, c => c.toLowerCase().includes(kind));
};
F.rightWhere = q => {
  const P = ptMap(q.prompt), at = { A: perp(P.A, P.B, P.A, P.C), B: perp(P.B, P.A, P.B, P.C), C: perp(P.C, P.A, P.C, P.B) };
  return idx(q, c => (/No right angle/.test(c) ? !Object.values(at).some(Boolean) : at[c.slice(-1)] === true));
};
/** a coordinate with maybe a root: "−√7" → { r: rational, k: coefficient, n: radicand } */
function coordX(s) {
  const t = norm(s);
  const m = t.match(/^(-?)(\d*)√(\d+)$/);
  if (m) return { r: 0, k: (m[1] ? -1 : 1) * Number(m[2] || 1), n: Number(m[3]) };
  return { r: Number(t), k: 0, n: 0 };
}
F.onCircle = q => {
  const t = norm(q.prompt);
  const C = t.match(new RegExp(`center C\\((${NUMRE}), (${NUMRE})\\)`)).slice(1).map(Number);
  let r2;
  let m;
  if ((m = t.match(/radius (\d*)√(\d+)/))) r2 = Number(m[1] || 1) ** 2 * Number(m[2]);
  else if ((m = t.match(/radius (\d+(?:\.\d+)?)/))) r2 = Number(m[1]) ** 2;
  else if ((m = t.match(new RegExp(`passes through Q\\((${NUMRE}), (${NUMRE})\\)`)))) r2 = d2(C, [Number(m[1]), Number(m[2])]);
  const pm = t.match(/Where is P\(([^,]+), ([^)]+)\)/);
  const X = [coordX(pm[1]), coordX(pm[2])];
  // (r + k√n − c)² = (r − c)² + k²n + 2(r − c)k√n
  let rat = 0, irr = 0, num = 0;
  X.forEach((x, i) => { const a = x.r - C[i]; rat += a * a + x.k * x.k * x.n; irr += 2 * a * x.k; num += (a + x.k * Math.sqrt(x.n)) ** 2; });
  const where = eqn(irr, 0) && eqn(rat, r2) ? 'on' : num < r2 ? 'inside' : 'outside';
  return idx(q, c => (c === 'On the circle' ? where === 'on' : c === 'Inside the circle' ? where === 'inside' : c === 'Outside the circle' ? where === 'outside' : false));
};
F.whichOnCircle = q => {
  const P = ptMap(q.prompt), r2 = d2(P.C, P.Q);
  return idx(q, c => eqn(d2(barePts(c)[0], P.C), r2));
};

// ---- investigation, scope, counterexamples ----
F.varyEx = q => {
  const t = norm(q.prompt), L = cardLines(q).map(norm);
  if (/table shows the cases checked/.test(t)) {
    const kinds = L.filter(l => /^Checked:/.test(l)).map(l => classWord(l));
    if (!kinds.length || !kinds.every(k => k === 'square' || k === 'rectangle')) return -1;
    return idx(q, c => /^A parallelogram with no right angle$/.test(c));
  }
  return idx(q, c => /^Different shapes:/.test(c));
};
const HYP = { 'congruent diagonals': f => f.diagCong, 'four congruent sides': f => f.s.every(x => eqn(x, f.s[0])), 'perpendicular diagonals': f => f.diagPerp };
function claimParts(text) {
  const m = norm(text).match(/every quadrilateral with (.*?) is an? (\w+)/);
  return m && HYP[m[1]] ? { hyp: HYP[m[1]], concl: classWord(m[2]) } : null;
}
F.cxPick = q => {
  const C = claimParts(q.prompt);
  if (!C) return -1;
  return idx(q, c => { const P = ptMap(c), f = quad([P.A, P.B, P.C, P.D]); return f.simple && C.hyp(f) && !isClass(f, C.concl); });
};
F.cxCheck = q => {
  const L = cardLines(q), C = claimParts(L[0]);
  const line = L.find(l => /counterexample:/.test(l));
  if (!C || !line) return -1;
  const P = ptMap(line), f = quad([P.A, P.B, P.C, P.D]);
  if (!f.simple) return -1;
  const hyp = C.hyp(f), concl = isClass(f, C.concl);
  return idx(q, c => (/^Yes: it meets the hypothesis and fails the conclusion/.test(c) ? hyp && !concl : /^No: it does not meet the hypothesis/.test(c) ? !hyp : /^No: the conclusion holds/.test(c) ? concl : false));
};
F.scope = q => {
  const L = cardLines(q).map(norm), all = L.join(' ');
  if (/drew \d+ parallelograms/.test(all)) return idx(q, c => /^No: checked examples cannot prove a claim about every/.test(c));
  if (/measured .* with a ruler/.test(all)) return idx(q, c => /^No: measurements are approximate/.test(c));
  if (/^Place any parallelogram at/.test(L[1] ?? '')) {
    const pts = namedExprPts(L[1]);
    const Pl = ['O', 'A', 'B', 'C'].map(k => pts[k]);
    if (Pl.some(x => !x) || !generalFor(Pl, 'parallelogram')) return -1;
    const m = L[2].match(/Midpoint of OB = midpoint of AC = (.*)\.$/), e = exprPairs(m[1])[0];
    const letters = [...new Set(Pl.flatMap(p => [...lettersOf(p.a), ...lettersOf(p.b)]))];
    const midE = (X, Y, k) => env => ((k === 0 ? X.fa(env) + Y.fa(env) : X.fb(env) + Y.fb(env)) / 2);
    const ok = [0, 1].every(k => sameExpr(midE(pts.O, pts.B, k), k ? e.fb : e.fa, letters) && sameExpr(midE(pts.A, pts.C, k), k ? e.fb : e.fa, letters));
    return ok ? idx(q, c => /^Yes: the letters can stand for any parallelogram/.test(c)) : -1;
  }
  const P = ptMap(L[0]);
  if (P.A && P.B && P.C && /AB² = \d+ and AC² = \d+, so AB = AC/.test(L[1] ?? '')) {
    const ok = factsTrue(L[1].replace(/, so .*/, ''), P) === true && eqn(d2(P.A, P.B), d2(P.A, P.C));
    return ok ? idx(q, c => /^Yes: exact computation settles a claim about this one triangle/.test(c)) : -1;
  }
  return -1;
};

// ---- parameters and placements ----
function placementFrom(text) { return exprPairs(text).filter(p => !p.name || /[OABC]/.test(p.name)); }
F.paramFam = q => {
  const t = norm(q.prompt);
  const P = exprPairs(t.match(/The vertices (.*?), with/)[1]);
  return idx(q, c => { const cl = choiceClass(c); return !!cl && (P.length === 3) === (cl in TRI_DIM) && generalFor(P, cl); });
};
function condPred(c) {
  const m = norm(c).match(/^([a-z])\s*(≠|>)\s*([a-z]|-?\d+)$/);
  if (!m) return null;
  const val = (e, s) => (/^[a-z]$/.test(s) ? e[s] : Number(s));
  return e => (m[2] === '≠' ? val(e, m[1]) !== val(e, m[3]) : val(e, m[1]) > val(e, m[3]));
}
F.nondegen = q => {
  const t = norm(q.prompt);
  const m = t.match(/With ([a-z]) > 0, the points (.*) should be the vertices of an? (\w+)\./);
  const first = m[1], P = exprPairs(m[2]), kind = m[3];
  const letters = [...new Set(P.flatMap(p => [...lettersOf(p.a), ...lettersOf(p.b)]))].filter(l => l !== first);
  const vals = [-2, -1, 0, 1, 2, 3];
  const envs = [];
  const rec = (i, e) => { if (i === letters.length) { for (const v of [1, 2, 3]) envs.push({ ...e, [first]: v }); return; } for (const v of vals) rec(i + 1, { ...e, [letters[i]]: v }); };
  rec(0, {});
  const genuine = e => {
    const V = P.map(p => [p.fa(e), p.fb(e)]);
    if (V.length === 3) return !eqn(area2(V), 0);
    if (eqn(area2(V), 0)) return false;
    return figIs(V, kind === 'triangle' ? 'triangle' : kind);
  };
  return idx(q, c => {
    if (/^None/.test(c)) return envs.every(genuine);
    const p = condPred(c);
    return !!p && envs.every(e => p(e) === genuine(e));
  });
};
F.whyMove = q => idx(q, c => /^Moving it keeps every length and angle, so what is proved for the copy holds for the original$/.test(c));
F.preserved = q => {
  const t = norm(q.prompt);
  let m;
  if ((m = t.match(/rotated (\d+)° (?:counter)?clockwise/))) {
    const a = Number(m[1]) % 360;
    const slopeChanges = a % 180 !== 0, coordsChange = a !== 0;
    return idx(q, c => (/slope of AB/.test(c) ? slopeChanges : /coordinates of A/.test(c) ? coordsChange && !samePt(ptMap(t).A, [0, 0]) : false));
  }
  if ((m = t.match(/translated (right|left) (\d+) and (up|down) (\d+)/))) {
    const moved = Number(m[2]) !== 0 || Number(m[4]) !== 0;
    return idx(q, c => (/coordinates of A/.test(c) ? moved : false));
  }
  return -1;
};
F.placeGen = q => {
  const cls = classWord(q.prompt) ?? (/every triangle/.test(q.prompt) ? 'triangle' : null);
  if (!cls) return -1;
  return idx(q, c => { const P = exprPairs(c); return P.length === (cls === 'triangle' ? 3 : 4) && generalFor(P, cls); });
};
F.placeFourth = q => {
  const t = norm(q.prompt), pts = namedExprPts(t);
  if (/Parallelogram OABC/.test(t)) {
    // B = A + C − O
    const letters = [...new Set(Object.values(pts).flatMap(p => [...lettersOf(p.a), ...lettersOf(p.b)]))];
    const bx = e => pts.A.fa(e) + pts.C.fa(e) - pts.O.fa(e), by = e => pts.A.fb(e) + pts.C.fb(e) - pts.O.fb(e);
    return idx(q, c => { const e = exprPairs(c)[0]; return !!e && sameExpr(e.fa, bx, letters) && sameExpr(e.fb, by, letters); });
  }
  if (/^Triangle O/.test(t)) {
    const letters = [...new Set(Object.values(pts).flatMap(p => [...lettersOf(p.a), ...lettersOf(p.b)]))];
    const mx = e => (pts.A.fa(e) + pts.B.fa(e)) / 2, my = e => (pts.A.fb(e) + pts.B.fb(e)) / 2;
    return idx(q, c => { const e = exprPairs(c)[0]; return /^No fractions in the midpoints/.test(c) && !!e && sameExpr(e.fa, mx, letters) && sameExpr(e.fb, my, letters); });
  }
  return -1;
};

// ---- general proofs ----
F.genProofStep = q => {
  const L = cardLines(q).map(norm), t = norm(q.prompt), pts = namedExprPts(L[0]);
  const letters = [...new Set(Object.values(pts).flatMap(p => [...lettersOf(p.a), ...lettersOf(p.b)]))];
  const val = (c, f) => { const g = parseExpr(c); return !!g && sameExpr(g, f, letters); };
  if (/What is the slope of AB\?/.test(t)) return idx(q, c => val(c, e => (pts.B.fb(e) - pts.A.fb(e)) / (pts.B.fa(e) - pts.A.fa(e))));
  let m;
  if ((m = t.match(/What is ([A-Z])([A-Z])²\?/))) { const X = pts[m[1]], Y = pts[m[2]]; return idx(q, c => val(c, e => (X.fa(e) - Y.fa(e)) ** 2 + (X.fb(e) - Y.fb(e)) ** 2)); }
  if (/What is MN\?/.test(t)) {
    // M, N: the midpoints of OB and AB (the card states them; recompute from the vertices)
    const Mx = e => (pts.O.fa(e) + pts.B.fa(e)) / 2, My = e => (pts.O.fb(e) + pts.B.fb(e)) / 2, Nx = e => (pts.A.fa(e) + pts.B.fa(e)) / 2, Ny = e => (pts.A.fb(e) + pts.B.fb(e)) / 2;
    return idx(q, c => val(c, e => Math.hypot(Nx(e) - Mx(e), Ny(e) - My(e))));
  }
  if ((m = t.match(/What is the midpoint of ([A-Z])([A-Z])\?/))) {
    const X = pts[m[1]], Y = pts[m[2]];
    return idx(q, c => { const e = exprPairs(c)[0]; return !!e && exprPairs(c).length === 1 && sameExpr(e.fa, v => (X.fa(v) + Y.fa(v)) / 2, letters) && sameExpr(e.fb, v => (X.fb(v) + Y.fb(v)) / 2, letters); });
  }
  return -1;
};
function figOfCard(line) {
  const m = norm(line).match(/^(Parallelogram|Rectangle|Triangle) (.*)$/);
  if (!m) return null;
  const pts = namedExprPts(m[2]);
  const order = m[1] === 'Triangle' ? ['O', 'A', 'B'] : ['O', 'A', 'B', 'C'];
  const P = order.map(k => pts[k]);
  if (P.some(x => !x)) return null;
  const letters = [...new Set(P.flatMap(p => [...lettersOf(p.a), ...lettersOf(p.b)]))];
  return { kind: m[1].toLowerCase(), pts, P, letters };
}
F.genProofEnd = q => {
  const L = cardLines(q).map(norm), fig = figOfCard(L[0]);
  if (!fig) return -1;
  const { kind, pts, P, letters } = fig;
  const cls = kind === 'triangle' ? 'triangle' : kind;
  if (!generalFor(P, cls)) return -1;
  // re-do the stated computation
  let ok = false;
  if (kind === 'parallelogram') {
    const e = exprPairs(L[1]);
    const mOB = [v => (pts.O.fa(v) + pts.B.fa(v)) / 2, v => (pts.O.fb(v) + pts.B.fb(v)) / 2], mAC = [v => (pts.A.fa(v) + pts.C.fa(v)) / 2, v => (pts.A.fb(v) + pts.C.fb(v)) / 2];
    ok = e.length === 2 && sameExpr(e[0].fa, mOB[0], letters) && sameExpr(e[0].fb, mOB[1], letters) && sameExpr(e[1].fa, mAC[0], letters) && sameExpr(e[1].fb, mAC[1], letters);
  } else if (kind === 'rectangle') {
    const m = L[1].match(/OB² = (.*) and AC² = (.*)\.$/);
    const f1 = m && parseExpr(m[1]), f2 = m && parseExpr(m[2]);
    ok = !!f1 && !!f2 && sameExpr(f1, v => pts.B.fa(v) ** 2 + pts.B.fb(v) ** 2, letters) && sameExpr(f2, v => (pts.C.fa(v) - pts.A.fa(v)) ** 2 + (pts.C.fb(v) - pts.A.fb(v)) ** 2, letters) && sameExpr(f1, f2, letters);
  } else {
    const Mx = v => (pts.O.fa(v) + pts.B.fa(v)) / 2, My = v => (pts.O.fb(v) + pts.B.fb(v)) / 2, Nx = v => (pts.A.fa(v) + pts.B.fa(v)) / 2, Ny = v => (pts.A.fb(v) + pts.B.fb(v)) / 2;
    const MN = namedExprPts(L[0].replace(/^.*?;/, ''));
    const m = L[1].match(/and MN = (.*), OA = (.*)\.$/);
    const fMN = m && parseExpr(m[1]), fOA = m && parseExpr(m[2]);
    ok = !!MN.M && !!MN.N && sameExpr(MN.M.fa, Mx, letters) && sameExpr(MN.M.fb, My, letters) && sameExpr(MN.N.fa, Nx, letters) && sameExpr(MN.N.fb, Ny, letters)
      && sameExpr(v => My(v) - Ny(v), () => 0, letters) && pts.A.fb({ ...envFor(letters) }) === 0
      && !!fMN && !!fOA && sameExpr(fMN, v => Math.hypot(Nx(v) - Mx(v), Ny(v) - My(v)), letters) && sameExpr(fOA, v => Math.hypot(pts.A.fa(v), pts.A.fb(v)), letters) && sameExpr(fOA, v => 2 * fMN(v), letters);
  }
  if (!ok) return -1;
  const want = { parallelogram: /^Proved: the diagonals of every parallelogram bisect each other$/, rectangle: /^Proved: the diagonals of every rectangle are congruent$/, triangle: /^Proved: every midsegment is parallel to the third side and half as long$/ }[kind];
  return idx(q, c => want.test(c));
};
F.slopeProof = q => {
  const t = norm(q.prompt);
  if (/Where do they meet\?/.test(t)) {
    const m = t.match(/Lines y = (.*?) and y = (.*?) have/);
    const f1 = parseExpr(m[1]), f2 = parseExpr(m[2]);
    const letters = [...new Set([...lettersOf(m[1]), ...lettersOf(m[2])])].filter(l => l !== 'x');
    return idx(q, c => {
      const g = parseExpr(c.replace(/^x = /, ''));
      return !!g && sameExpr(e => f1({ ...e, x: g(e) }), e => f2({ ...e, x: g(e) }), letters);
    });
  }
  let m;
  if ((m = t.match(/vertical lines x = ([a-z]) and x = ([a-z])/))) return idx(q, c => c === `Separately: no point has x = ${m[1]} and x = ${m[2]}, so they are parallel`);
  if ((m = t.match(/Lines y = (\w+)x \+ ([\w₀-₉]+) and y = \1x \+ ([\w₀-₉]+) have \2 ≠ \3\. Why do they share no point\?/))) {
    return idx(q, c => c === `A common point would give ${m[1]}x + ${m[2]} = ${m[1]}x + ${m[3]}, so ${m[2]} = ${m[3]}, which is false`);
  }
  return -1;
};
F.perpProof = q => {
  const L = cardLines(q).map(norm), t = norm(q.prompt);
  const take = L.find(l => /^Take P/.test(l));
  const pts = namedExprPts(take);
  const P = pts.P, Qp = pts.Q, letters = ['m₁', 'm₂'];
  const OP2 = e => P.fa(e) ** 2 + P.fb(e) ** 2, OQ2 = e => Qp.fa(e) ** 2 + Qp.fb(e) ** 2, PQ2 = e => (P.fa(e) - Qp.fa(e)) ** 2 + (P.fb(e) - Qp.fb(e)) ** 2;
  if (/what is PQ²\?/.test(t)) return idx(q, c => { const g = parseExpr(c); return !!g && sameExpr(g, PQ2, letters); });
  if (/What does that equation simplify to\?/.test(t)) {
    const E = e => OP2(e) + OQ2(e) - PQ2(e);   // linear in m₂ for fixed m₁
    return idx(q, c => {
      const parts = c.split('=');
      if (parts.length !== 2) return false;
      const l = parseExpr(parts[0]), r = parseExpr(parts[1]);
      if (!l || !r) return false;
      for (let k = 0; k < 6; k++) {
        const m1 = 0.5 + rnd() * 3;
        const e0 = E({ 'm₁': m1, 'm₂': 0 }), e1 = E({ 'm₁': m1, 'm₂': 1 }), root = -e0 / (e1 - e0);
        const at = { 'm₁': m1, 'm₂': root };
        if (!eqn(l(at), r(at))) return false;
        const off = { 'm₁': m1, 'm₂': root + 0.7 };
        if (eqn(l(off), r(off))) return false;
      }
      return true;
    });
  }
  return -1;
};
F.iffBoth = q => {
  const t = norm(q.prompt);
  const m = t.match(/A proof shows: if (.*?)(?: \(and .*?\))?, then the lines are (\w+)\./);
  if (!m) return -1;
  const cond = m[1], rel = m[2];
  return idx(q, c => { const k = c.match(/^The other direction: if (.*), then (.*)$/); return !!k && k[1].includes(rel) && k[2] === cond; });
};
F.critique = q => {
  const L = cardLines(q).map(norm), all = L.join(' ');
  const claim = L[0];
  let m;
  if ((m = all.match(/Place the (parallelogram|rectangle) at (.*?)(?:, with [^.]*)?\./))) {
    const pts = namedExprPts(m[2]);
    const P = ['O', 'A', 'B', 'C'].map(k => pts[k]);
    if (P.some(x => !x)) return -1;
    const claimCls = classWord(claim);
    if (!generalFor(P, claimCls)) {
      // a placement that is always a special member of the class
      const inClass = (() => { for (let i = 0; i < 6; i++) { const e = envFor([...new Set(P.flatMap(p => [...lettersOf(p.a), ...lettersOf(p.b)]))]); if (!figIs(P.map(p => [p.fa(e), p.fb(e)]), claimCls)) return false; } return true; })();
      return inClass ? idx(q, c => /^No: its placement assumes a special case$/.test(c)) : -1;
    }
    return idx(q, c => /^Yes: the argument is valid$/.test(c));
  }
  if ((m = all.match(/Take (A\(.*?D\([^)]*\))\./))) {
    const P = ptMap(m[1]), f = quad([P.A, P.B, P.C, P.D]);
    if (/So the claim is false/.test(all)) {
      const C = claimParts(claim);
      const facts = factsTrue(L[2].replace(/, so .*/, ''), P);
      const notRightB = !perp(P.A, P.B, P.B, P.C);
      return C && facts === true && f.simple && C.hyp(f) && !isClass(f, C.concl) && notRightB ? idx(q, c => /^Yes: the argument is valid$/.test(c)) : -1;
    }
    if (/^So every/.test(L[L.length - 1])) return idx(q, c => /^No: it checks only one example$/.test(c));
  }
  return -1;
};
F.audit = q => {
  const L = cardLines(q).map(norm), all = L.join(' ');
  if (/consecutive sides are perpendicular/.test(all) && /\(slope of one side\) × \(slope of the next\) = -1/.test(all)) return idx(q, c => /^Rectangles with vertical sides, whose slopes are undefined$/.test(c));
  if (/slope PM = .*\(x_Q - x_P\)/.test(all)) return idx(q, c => /^Vertical segments, where x_Q - x_P = 0$/.test(c));
  let m;
  if ((m = all.match(/Triangle O\(0, 0\), A\(([a-z]), 0\), B\(([a-z]), ([a-z])\) with \1 > 0\. .* divides by ([a-z]) /))) {
    // dividing by the height letter: zero only for a collapsed triangle, so no allowed case is missed
    if (m[4] !== m[3]) return -1;
    return idx(q, c => c === `None: ${m[3]} ≠ 0 holds for every triangle`);
  }
  return -1;
};

/** why a polygon is not a proper simple polygon */
function polyFault(V) {
  const n = V.length;
  for (let i = 0; i < n; i++) if (eqn(cross(sub(V[(i + 1) % n], V[i]), sub(V[(i + 2) % n], V[i])), 0)) return 'three consecutive vertices lie on one line (a straight angle at vertex ' + 'ABCDE'[(i + 1) % n] + ')';
  return 'the polygon crosses itself';
}

// =====================================================================================================================
export function solve(q) {
  const f = F[q.family];
  if (!f) return undefined;
  return f(q);
}

// =====================================================================================================================
// sane: what the student sees must be fair
export function sane(q) {
  const out = [];
  const t = norm(q.prompt), pl = plane(q);
  // units
  if (/(^|[^\d.])0x\b/.test(t)) out.push('a 0x term in an equation');
  if (/\b1 fee\b|\bgrid unit is 1 (?:feet|yards|meters)\b/.test(t)) out.push(`unit word broken: "${t.match(/grid unit is [^)]*/)[0]}"`);
  if (/\b1 (?:units|feet|yards|meters)\b/.test(t + ' ' + q.unit)) out.push('plural after 1');
  // plotted points at their stated coordinates, inside the window
  if (pl) {
    const stated = { ...ptMap(q.board), ...ptMap(t) };
    for (const p of pl.pts ?? []) {
      if (p.name && stated[p.name] && !samePt(stated[p.name], p.at)) out.push(`${p.name} is plotted at (${p.at}) but stated as (${stated[p.name]})`);
      if (p.at[0] < pl.x[0] || p.at[0] > pl.x[1] || p.at[1] < pl.y[0] || p.at[1] > pl.y[1]) out.push(`${p.name || p.key} is outside the window`);
    }
    const byKey = {};
    for (const p of pl.pts ?? []) byKey[p.key.toLowerCase()] = p.at;
    for (const s of pl.segs ?? []) {
      if (s.key.length !== 2) continue;
      const a = byKey[s.key[0].toLowerCase()], b = byKey[s.key[1].toLowerCase()];
      if (a && b && !((samePt(a, s.a) && samePt(b, s.b)) || (samePt(a, s.b) && samePt(b, s.a)))) out.push(`segment ${s.key} is not drawn between its points`);
    }
    for (const poly of pl.polys ?? []) {
      const named = (pl.pts ?? []).filter(p => /^[A-Z]$/.test(p.name ?? '')).map(p => p.at);
      if (named.length === poly.pts.length && !poly.pts.every((v, i) => samePt(v, named[i]))) out.push('the polygon is not drawn through the named vertices in order');
      if (!simplePoly(poly.pts)) out.push(polyFault(poly.pts));
    }
    if (q.family === 'distTri' && !/lie on a/.test(t)) {
      const run = (pl.segs ?? []).find(s => s.key === 'run'), rise = (pl.segs ?? []).find(s => s.key === 'rise');
      const [A, B] = namedPts(q.board).map(x => x.p);
      if (!run || !rise || !samePt(run.a, A) || !samePt(run.b, [B[0], A[1]]) || !samePt(rise.b, B)) out.push('the dashed legs are not the run and rise of the segment');
    }
    if (q.family === 'sideDiag' || q.family === 'closing') {
      const V = cycleOf(q).map(n => (pl.pts ?? []).find(p => p.name === n)?.at);
      if (V.some(v => !v)) out.push('a named vertex is not plotted'); else if (!simplePoly(V)) out.push('the plotted vertices, in the named order: ' + polyFault(V));
    }
  }
  // the asked point is not on screen
  let want;
  try { want = solve(q); } catch { want = undefined; }
  if (pl && q.input === 'pair' && Array.isArray(want) && !q.pair?.op?.includes('√')) {
    const given = new Set(Object.keys({ ...ptMap(q.board), ...ptMap(t) }));
    const hit = (pl.pts ?? []).find(p => samePt(p.at, want) && !given.has(p.name));
    if (hit && !/^M is the midpoint/.test(t)) out.push(`the answer point is plotted (${hit.name || hit.key})`);
  }
  if ((q.family === 'wAvg' || q.family === 'centroid') && Array.isArray(want)) {
    const P = ptMap(t), hit = Object.keys(P).find(k => samePt(P[k], want));
    if (hit) out.push(`the balance point is the given point ${hit} itself`);
  }
  // rounding ties
  if (q.family === 'perimRound') {
    const v = perim(polyOf(q)) * 10;
    if (Math.abs(v - Math.floor(v) - 0.5) < 1e-6) out.push('nearest-tenth tie');
  }
  // the named figure is that figure
  if (q.family === 'areaRect') {
    const V = polyOf(q), f = quad(V);
    if (/^Square/.test(t) && !f.square) out.push('called a square, but it is not');
    if (/rectang/i.test(t) && !f.rect) out.push('called a rectangle, but it is not');
  }
  if (q.family === 'parFourth') {
    const P = ptMap(q.board), D = F.parFourth(q);
    if (!quad([P.A, P.B, P.C, D]).para) out.push('the four points do not make a parallelogram');
  }
  if (q.family === 'vocabBisect') {
    const P = ptMap(t);
    if (!segsCross(P.A, P.B, P.C, P.D)) out.push('the segments do not cross');
  }
  if (q.family === 'classify' || q.family === 'claimProp' || q.family === 'bisectEach' || q.family === 'verdict') {
    const P = ptMap(t);
    if (!quad([P.A, P.B, P.C, P.D]).simple) out.push('ABCD is not a simple quadrilateral');
  }
  if (['converse', 'rightWhere', 'claimArg', 'areaBox', 'centroid'].includes(q.family)) {
    const V = namedPts(q.family === 'claimArg' ? t : q.board).map(x => x.p).slice(0, 3);
    if (eqn(area2(V), 0)) out.push('the triangle collapses');
  }
  if (q.family === 'perpSlope' || q.family === 'perpTest') {
    const P = namedPts(q.board).map(x => x.p), m = slopeQ(P[0], P[1]);
    if (m && (m.eq(1) || m.eq(-1))) out.push('slope ±1: the opposite and the negative reciprocal coincide');
  }
  if (q.family === 'varyEx' && /Which (\w+) examples/.test(t)) {
    const N = { three: 3, four: 4, five: 5, two: 2, six: 6 }[t.match(/Which (\w+) examples/)[1]];
    const diff = (q.choices ?? []).find(c => /^Different shapes:/.test(c));
    const n = diff ? diff.replace(/^Different shapes: /, '').split(/, | and /).length : 0;
    if (diff && n !== N) out.push(`asks for ${N} examples, but the "different shapes" choice lists ${n}`);
  }
  if (q.family === 'audit' && /to find the slope of the altitude from B/.test(cardLines(q).join(' '))) {
    out.push('the altitude from B is perpendicular to OA on the x-axis: it is vertical, so no division gives its slope (the division by the height belongs to the altitude from A or O)');
  }
  if (q.family === 'cxCheck') {
    const L = cardLines(q), line = L.find(l => /counterexample:/.test(l));
    const P = line ? ptMap(line) : null;
    if (P && !quad([P.A, P.B, P.C, P.D]).simple) out.push('the counterexample is not a simple quadrilateral');
  }
  if (q.family === 'cxPick') {
    for (const c of q.choices ?? []) { const P = ptMap(c); if (!quad([P.A, P.B, P.C, P.D]).simple) out.push(`choice ${c} is not a simple quadrilateral`); }
  }
  return out.join('; ');
}

export default { solve, sane };
