// Oracle for the lesson "triangle-centers" (Geometry: midsegments, special segments, the four centers, their
// equidistances, the 2 : 1 centroid, constructions of the circumscribed / inscribed circle, and the proofs).
// Written from what the student sees only: the prompt, the board, the choices, the drawn figure (named points,
// segments, tick marks, right-angle boxes, angle arcs, measure labels, the line ℓ), the construction data (which
// points exist and how many steps are drawn), the proof frame (givens, prove, the rows above and below the asked
// cell) and the cards. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
//
// How it decides:
// - A special segment is read from its MARKS only: a midpoint is a point with two equal tick groups on either side
//   along a side; a right angle is a box; a bisector is two equal arc groups at a vertex sharing the segment's ray.
//   Median = vertex to a marked midpoint of the opposite side; altitude = vertex + box on the opposite side's line;
//   angle bisector = equal arcs at the vertex; perpendicular bisector = box + marked midpoint; midsegment = both
//   endpoints marked midpoints. An unmarked point that happens to sit at the midpoint is NOT a midpoint.
// - Numbers: midsegment = half the third side; median halves the side; bisector halves the angle; the centroid sits
//   2/3 of the way along each median; a point on a perpendicular bisector is as far from both endpoints; a point on
//   an angle bisector is as far from both sides (perpendicular distance); a right triangle's circumcenter is the
//   hypotenuse midpoint; tangent / half-chord by Pythagoras. Algebra: the equal parts are set equal and solved.
// - Angle chains (altitude, bisector, exterior angle) are worked out by building the triangle from its given angles
//   and measuring the asked angle; midsegment angles are the given angle or its supplement (parallel lines), picked
//   by the drawing's structure.
// - Center locations from the angles (acute / right / obtuse); constructions from the step count; compass widths
//   are compared with the true radius computed from the construction's points.
// - Proofs: every reason is checked against the statement, the givens and the lines above it (CPCTC needs a
//   triangle congruence above with matching parts, SAS / ASA / AAS / HL / SSS are decided from the parts known above,
//   a theorem is never a reason inside its own proof, "two lines meet, so three do" is never a reason).
// - sane(q): the story world (relabelled words, impossible angle sums, nonpositive results, .x5 ties).

import { nums, round } from '../../tools/quality/oracle-kit.mjs';

// =====================================================================================================================
// text
const OV = /̅/g;
const SUBS = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4' };
const plain = s => String(s ?? '').replace(OV, '').replace(/[₀-₄]/g, c => SUBS[c]).replace(/−/g, '-').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const low = s => plain(s).toLowerCase();
const skey = n => n.split('').sort().join('');
/** TeX of a proof cell / board → plain */
function tex(t) {
  let s = String(t ?? '');
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\(?:overline|overleftrightarrow)\{([^{}]*)\}/g, '$1').replace(/\\overrightarrow\{([^{}]*)\}/g, 'ray $1')
      .replace(/\\text\{([^{}]*)\}/g, ' $1 ').replace(/\\t?frac\{?(\d)\}?\{?(\d)\}?/g, '$1/$2');
  }
  s = s.replace(/\\tfrac12|\\frac12/g, '1/2').replace(/\\tfrac23|\\frac23/g, '2/3').replace(/\\ell_?\{?(\d)\}?/g, 'ℓ$1').replace(/\\ell/g, 'ℓ')
    .replace(/\\angle\s*/g, '∠').replace(/\\triangle\s*/g, '△').replace(/\\cong/g, '≅').replace(/\\parallel/g, '∥').replace(/\\perp/g, '⊥')
    .replace(/\^\{?\\circ\}?/g, '°').replace(/\\[,;: !]|\\quad|\\qquad|~/g, ' ').replace(/[{}]/g, '').replace(/\\[a-zA-Z]+/g, ' ');
  return plain(s).replace(/½/g, '1/2').replace(/\s*,\s*/g, ', ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
}
const chText = s => plain(s).replace(/½\s*/g, '1/2 ').replace(/⅔\s*/g, '2/3 ').replace(/\s+/g, ' ').trim();

/** a linear expression "6x - 26", "(5x + 13)", "x", "-2" → [a, b] */
function lin(s) {
  const t = plain(s).replace(/[()°\s]/g, '');
  if (!t) return null;
  let a = 0, b = 0;
  for (const m of t.matchAll(/([+-]?)(\d*\.?\d*)(x?)/g)) {
    if (!m[0]) continue;
    const sg = m[1] === '-' ? -1 : 1;
    if (m[3]) a += sg * (m[2] === '' ? 1 : Number(m[2]));
    else if (m[2] !== '') b += sg * Number(m[2]);
  }
  return [a, b];
}
const linVal = (e, x) => e[0] * x + e[1];
let LASTX = null;
const solveEq = (e1, k1, e2, k2) => { // k1·e1 = k2·e2
  const a = k1 * e1[0] - k2 * e2[0], b = k2 * e2[1] - k1 * e1[1];
  LASTX = Math.abs(a) < 1e-12 ? NaN : b / a;
  return LASTX;
};

/** "AB = 12 cm" / "AB = 2x - 1" / "m∠ABC = (5x + 3)°" pairs from the prompt (segments by sorted name) */
function givensOf(p) {
  const t = plain(p), segs = {}, angs = {};
  for (const m of t.matchAll(/\bm∠([A-Z]{1,3}) = (\(?[-\dx.+ ]+\)?)°/g)) angs[m[1]] = m[2];
  for (const m of t.matchAll(/(?<![∠A-Za-z])([A-Z]'?[A-Z]'?) = ([-\dx.+ ]+?)(?= ?(?:cm|ft|in|m|mi)\b| and |\.(?:\s|$)|,|$)/g)) segs[m[1].replace(/'/g, '′')] = m[2].trim();
  return { segs, angs };
}
const segVal = (G, n) => { for (const [k, v] of Object.entries(G.segs)) if (skey(k) === skey(n)) return v; return undefined; };
const askedSeg = p => { const m = plain(p).match(/(?:Find|How long is|How far is) ([A-Z]'?[A-Z]'?)\b/); return m ? m[1] : null; };
const askedAng = p => { const m = plain(p).match(/Find m∠([A-Z]{1,3})/); return m ? m[1] : null; };
const choiceIdx = (q, pred) => { const h = (q.choices ?? []).map((c, i) => (pred(chText(c), i) ? i : -1)).filter(i => i >= 0); return h.length === 1 ? h[0] : -1; };

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
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const near = (a, b, e = 1.5) => !!a && !!b && Math.abs(a[0] - b[0]) < e && Math.abs(a[1] - b[1]) < e;
const angDeg = (d1, d2) => (Math.acos(Math.max(-1, Math.min(1, dot(unit(d1), unit(d2))))) * 180) / Math.PI;
const parallel = (d1, d2, tol = 0.8) => { const a = angDeg(d1, d2); return a < tol || a > 180 - tol; };
const perpTo = (d1, d2, tol = 0.8) => Math.abs(angDeg(d1, d2) - 90) < tol;
const onLine = (P, A, B, e = 1.5) => Math.abs(cross(sub(B, A), sub(P, A))) / (dist(A, B) || 1) < e;
const onSeg = (P, A, B, e = 1.5) => onLine(P, A, B, e) && dot(sub(P, A), sub(B, A)) >= -e * dist(A, B) && dot(sub(P, B), sub(A, B)) >= -e * dist(A, B);
const lineMeet = (A, B, C, D) => { const r = sub(B, A), s = sub(D, C), den = cross(r, s); if (Math.abs(den) < 1e-9) return null; return add(A, mul(r, cross(sub(C, A), s) / den)); };
const foot = (P, A, B) => { const d = unit(sub(B, A)); return add(A, mul(d, dot(sub(P, A), d))); };
const angAt = (V, P, Q) => angDeg(sub(P, V), sub(Q, V));
function circum(A, B, C) {
  const d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]));
  const a2 = dot(A, A), b2 = dot(B, B), c2 = dot(C, C);
  return [(a2 * (B[1] - C[1]) + b2 * (C[1] - A[1]) + c2 * (A[1] - B[1])) / d, (a2 * (C[0] - B[0]) + b2 * (A[0] - C[0]) + c2 * (B[0] - A[0])) / d];
}
function incenter(A, B, C) { const a = dist(B, C), b = dist(C, A), c = dist(A, B), s = a + b + c; return [(a * A[0] + b * B[0] + c * C[0]) / s, (a * A[1] + b * B[1] + c * C[1]) / s]; }
const inside = (P, A, B, C) => { const s1 = cross(sub(B, A), sub(P, A)), s2 = cross(sub(C, B), sub(P, B)), s3 = cross(sub(A, C), sub(P, C)); return (s1 > 0 && s2 > 0 && s3 > 0) || (s1 < 0 && s2 < 0 && s3 < 0); };

/** a triangle with named vertices from two or three of its angles (degrees) → { name: point } */
function triByAngles(names, ang) {
  const [P, Q, R] = names;
  const a = { ...ang };
  const known = names.filter(n => a[n] !== undefined);
  if (known.length < 2) return null;
  for (const n of names) if (a[n] === undefined) a[n] = 180 - names.filter(m => m !== n).reduce((s, m) => s + a[m], 0);
  const rad = d => (d * Math.PI) / 180;
  // P at origin, Q at (1, 0); R from the angle at P and side PR = sin(Q)/sin(R)
  const pr = Math.sin(rad(a[Q])) / Math.sin(rad(a[R]));
  return { [P]: [0, 0], [Q]: [1, 0], [R]: [pr * Math.cos(rad(a[P])), pr * Math.sin(rad(a[P]))], _ang: a };
}

// =====================================================================================================================
// the figure
function readFig(q) {
  const f = q.data?.picture?.fig;
  if (!f) return null;
  const F = { pts: {}, segs: f.segs ?? [], angs: (f.angles ?? []).map(a => ({ ...a, d1: sub(a.p, a.v), d2: sub(a.q, a.v) })) };
  for (const p of f.points ?? []) if (p.name) F.pts[p.name] = p.at;
  F.ell = F.segs.find(s => s.name === 'ℓ');
  F.ticks = F.segs.filter(s => s.ticks > 0);
  return F;
}
/** M (a point) is a marked midpoint of U-V: two tick segments of one group, M-U and M-V */
function markedMid(F, M, U, V) {
  if (!M || !U || !V || !onSeg(M, U, V) || near(M, U) || near(M, V)) return false;
  for (const s of F.ticks) {
    const o1 = near(s.a, M) ? s.b : near(s.b, M) ? s.a : null;
    if (!o1 || !(near(o1, U) || near(o1, V))) continue;
    const other = near(o1, U) ? V : U;
    for (const t of F.ticks) {
      if (t === s || t.ticks !== s.ticks) continue;
      const o2 = near(t.a, M) ? t.b : near(t.b, M) ? t.a : null;
      if (o2 && near(o2, other)) return true;
    }
  }
  return false;
}
/** a right-angle box at P with one ray along direction d and the other along direction e */
function boxAt(F, P, d, e) {
  return F.angs.some(a => (a.box || /^90/.test(String(a.text ?? ''))) && near(a.v, P) && ((parallel(a.d1, d) && parallel(a.d2, e)) || (parallel(a.d1, e) && parallel(a.d2, d))));
}
/** equal arcs at V, two angles sharing a ray along d, their other rays along the two sides e1, e2 */
function arcsBisect(F, V, d, e1, e2) {
  const at = F.angs.filter(a => a.arcs > 0 && near(a.v, V));
  for (const a of at) for (const b of at) {
    if (a === b || a.arcs !== b.arcs) continue;
    const ra = parallel(a.d1, d) && dot(a.d1, d) > 0 ? a.d2 : parallel(a.d2, d) && dot(a.d2, d) > 0 ? a.d1 : null;
    const rb = parallel(b.d1, d) && dot(b.d1, d) > 0 ? b.d2 : parallel(b.d2, d) && dot(b.d2, d) > 0 ? b.d1 : null;
    if (!ra || !rb) continue;
    if ((parallel(ra, e1) && parallel(rb, e2)) || (parallel(ra, e2) && parallel(rb, e1))) return true;
  }
  return false;
}
const triOf = p => { const m = plain(p).match(/△([A-Z]{3})/); return m ? m[1] : null; };

/** what a segment or line is, read from the marks: a set of kinds */
function kindsOf(F, T, A, B, isLine) {
  const K = new Set(), V = T.split('').map(n => F.pts[n]);
  if (V.some(v => !v)) return K;
  const d = sub(B, A);
  const sides = [[0, 1], [1, 2], [2, 0]];
  // midsegment: a segment whose two endpoints are marked midpoints of two sides
  if (!isLine) {
    const midOf = P => sides.findIndex(([i, j]) => markedMid(F, P, V[i], V[j]));
    const ma = midOf(A), mb = midOf(B);
    if (ma >= 0 && mb >= 0 && ma !== mb) K.add('midsegment');
  }
  for (let k = 0; k < 3; k++) {
    const [i, j] = sides[k];
    const S = [V[i], V[j]], o = 3 - i - j, opp = V[o];
    const P = lineMeet(A, B, S[0], S[1]);
    if (!P) continue;
    const onObj = isLine || onSeg(P, A, B);
    const through = onLine(opp, A, B) && (isLine || near(opp, A) || near(opp, B));
    const perp = onObj && boxAt(F, P, d, sub(S[1], S[0]));
    const mm = onObj && markedMid(F, P, S[0], S[1]);
    if (perp && mm) K.add('perpendicular bisector');
    if (through) {
      if (perp) K.add('altitude');
      if (mm && (isLine || near(P, A) || near(P, B))) K.add('median');
      const dir = near(opp, A) ? sub(B, A) : near(opp, B) ? sub(A, B) : sub(P, opp);
      if (arcsBisect(F, opp, dir, sub(S[0], opp), sub(S[1], opp))) K.add('angle bisector');
    }
  }
  return K;
}
const KIND_RE = [['perpendicular bisector', /perpendicular bisector/], ['angle bisector', /angle bisector/], ['median', /\bmedian/], ['altitude', /altitude/], ['midsegment', /midsegment/]];
const kindOfChoice = c => (KIND_RE.find(([, re]) => re.test(c)) ?? [null])[0];
function objOf(F, q) {
  const p = plain(q.prompt);
  if (/line ℓ/.test(p) && F.ell) return { A: F.ell.a, B: F.ell.b, line: true };
  const m = p.match(/What is ([A-Z]{2})\b/);
  if (m && F.pts[m[1][0]] && F.pts[m[1][1]]) return { A: F.pts[m[1][0]], B: F.pts[m[1][1]], line: false };
  return null;
}

// =====================================================================================================================
// numeric questions, recognised by their wording (the same patterns serve mixedNum)
function numSolve(q) {
  const p = plain(q.prompt), G = givensOf(q.prompt);
  let m;
  // medians concurrence: two thirds of the median from the vertex
  if ((m = p.match(/^([A-Z])([A-Z]) is a median of △([A-Z]{3}) and \1\2 = ([\d.]+) \w+\. The median .* crosses it at ([A-Z]), and the median .* crosses it at \5′\. How far is \5′ from \1\?/))) return (Number(m[4]) * 2) / 3;
  // midsegment: angles
  if ((m = p.match(/^([A-Z]) and ([A-Z]) are the midpoints of ([A-Z]{2}) and ([A-Z]{2})\. m∠([A-Z]{3}) = (\d+)°\. Find m∠([A-Z]{3})/))) return midsegAngle(q, m);
  // midsegment: lengths / algebra
  if ((m = p.match(/^([A-Z]) and ([A-Z]) are the midpoints of ([A-Z]{2}) and ([A-Z]{2})\./))) {
    const [, U, W, s1, s2] = m;
    const common = s1.split('').find(c => s2.includes(c));
    if (!common) return undefined;
    const X = s1.replace(common, ''), Y = s2.replace(common, '');
    const ms = U + W, third = X + Y;
    const vm = segVal(G, ms), vt = segVal(G, third), ask = askedSeg(p);
    if (!ask) return undefined;
    const em = vm !== undefined ? lin(vm) : null, et = vt !== undefined ? lin(vt) : null;
    if (em && et && (em[0] || et[0])) { // 2·midseg = third
      const x = solveEq(em, 2, et, 1);
      if (skey(ask) === skey(ms)) return linVal(em, x);
      if (skey(ask) === skey(third)) return linVal(et, x);
      return undefined;
    }
    if (skey(ask) === skey(ms) && et) return et[1] / 2;
    if (skey(ask) === skey(third) && em) return em[1] * 2;
    return undefined;
  }
  // medial triangle perimeter
  if ((m = p.match(/^([A-Z]), ([A-Z]) and ([A-Z]) are the midpoints of the sides of △([A-Z]{3}): (.*?)\. Find the perimeter of △([A-Z]{3})/))) {
    const v = Object.values(G.segs).map(Number);
    if (v.length !== 3) return undefined;
    return (v[0] + v[1] + v[2]) / 2;
  }
  // median halves the side
  if ((m = p.match(/^([A-Z])([A-Z]) is a median of △([A-Z]{3})/))) {
    const [, Vx, Mx, T] = m;
    const [S1, S2] = T.replace(Vx, '').split('');
    if (!S1 || !S2) return undefined;
    const ask = askedSeg(p);
    const h1 = S1 + Mx, h2 = Mx + S2, whole = S1 + S2;
    const e1 = segVal(G, h1), e2 = segVal(G, h2), ew = segVal(G, whole);
    if (e1 !== undefined && e2 !== undefined) {
      const a = lin(e1), b = lin(e2), x = solveEq(a, 1, b, 1), half = linVal(a, x);
      if (skey(ask) === skey(whole)) return 2 * half;
      return half;
    }
    const half = e1 ?? e2;
    if (half !== undefined) return skey(ask) === skey(whole) ? 2 * Number(half) : Number(half);
    if (ew !== undefined) return skey(ask) === skey(whole) ? Number(ew) : Number(ew) / 2;
    return undefined;
  }
  // centroid 2 : 1
  if ((m = p.match(/^([A-Z]) is the centroid of △([A-Z]{3}) and ([A-Z])([A-Z]) is a median\./))) {
    const [, Gc, , Vx, Mx] = m;
    const vg = Vx + Gc, gm = Gc + Mx, vm = Vx + Mx, ask = askedSeg(p);
    const share = n => (skey(n) === skey(vg) ? 2 : skey(n) === skey(gm) ? 1 : skey(n) === skey(vm) ? 3 : null);
    const known = Object.entries(G.segs).filter(([k]) => share(k));
    if (known.length >= 2) { // algebra: VG = 2·GM
      const a = lin(segVal(G, vg)), b = lin(segVal(G, gm));
      if (!a || !b) return undefined;
      const x = solveEq(a, 1, b, 2), unitV = linVal(b, x);
      return unitV * share(ask);
    }
    if (known.length === 1) { const [k, v] = known[0]; return (Number(v) / share(k)) * share(ask); }
    return undefined;
  }
  // angle bisector halves the angle
  if ((m = p.match(/^([A-Z])([A-Z]) bisects ∠([A-Z]{3})(?: and |\. )/)) && !/m∠[A-Z]{3} = \d+° and m∠/.test(p)) {
    const whole = m[3], ask = askedAng(p);
    const ents = Object.entries(G.angs);
    const isWhole = n => n === whole || n === whole.split('').reverse().join('');
    if (ents.length === 2) {
      const [[n1, e1], [n2, e2]] = ents;
      const a = lin(e1), b = lin(e2);
      let x, half;
      if (!isWhole(n1) && !isWhole(n2)) { x = solveEq(a, 1, b, 1); half = linVal(a, x); }
      else if (isWhole(n1)) { x = solveEq(a, 1, b, 2); half = linVal(b, x); }
      else { x = solveEq(b, 1, a, 2); half = linVal(a, x); }
      return isWhole(ask) ? 2 * half : half;
    }
    if (ents.length === 1) { const [n, v] = ents[0]; const val = Number(lin(v)[1]); return isWhole(n) ? (isWhole(ask) ? val : val / 2) : isWhole(ask) ? 2 * val : val; }
    return undefined;
  }
  // altitude angle chain
  if ((m = p.match(/^([A-Z])([A-Z]) is an altitude of △([A-Z]{3})/))) {
    const [, Ax, Ft, T] = m, ask = askedAng(p);
    const ang = {};
    for (const [n, v] of Object.entries(G.angs)) { if (n.length === 3) ang[n[1]] = Number(lin(v)[1]); else ang[n] = Number(lin(v)[1]); }
    const others = T.replace(Ax, '').split('');
    if (Object.keys(ang).length === 1) { // one base angle: the right triangle at the foot
      const b = Number(Object.values(ang)[0]);
      return Math.abs(90 - b);
    }
    const tri = triByAngles([Ax, ...others], ang);
    if (!tri) return undefined;
    tri[Ft] = foot(tri[Ax], tri[others[0]], tri[others[1]]);
    return angleByName(tri, ask);
  }
  // altitude + bisector
  if ((m = p.match(/^In △([A-Z]{3}), ([A-Z])([A-Z]) is an altitude and ([A-Z])([A-Z]) bisects ∠([A-Z]{3})/))) {
    const [, T, Ax, Ft, , Bt] = m, ask = askedAng(p);
    const ang = {};
    for (const [n, v] of Object.entries(G.angs)) if (n.length === 1) ang[n] = Number(lin(v)[1]);
    const others = T.replace(Ax, '').split('');
    const tri = triByAngles([Ax, ...others], ang);
    if (!tri) return undefined;
    tri[Ft] = foot(tri[Ax], tri[others[0]], tri[others[1]]);
    tri[Bt] = bisectorFoot(tri[Ax], tri[others[0]], tri[others[1]]);
    return angleByName(tri, ask);
  }
  // bisector + exterior angle
  if ((m = p.match(/^([A-Z])([A-Z]) bisects ∠([A-Z]{3}), m∠([A-Z]{3}) = (\d+)° and m∠([A-Z]{3}) = (\d+)°\. Find m∠([A-Z]{3})/))) {
    const [, Ax, Xx, whole, n1, v1, n2, v2, ask] = m;
    const ang = { [n1[1]]: Number(v1), [n2[1]]: Number(v2) };
    const T = [...new Set((whole + n2).split(''))];
    if (T.length !== 3) return undefined;
    const others = T.filter(c => c !== Ax);
    const tri = triByAngles([Ax, ...others], ang);
    if (!tri) return undefined;
    tri[Xx] = bisectorFoot(tri[Ax], tri[others[0]], tri[others[1]]);
    return angleByName(tri, ask);
  }
  // equal distances (perpendicular bisector / angle bisector), algebra or numbers
  if (/is on ℓ\.|is on the bisector of ∠/.test(p) && /x/.test(Object.values(G.segs).join(' '))) {
    const ents = Object.entries(G.segs);
    if (ents.length !== 2) return undefined;
    const a = lin(ents[0][1]), b = lin(ents[1][1]), x = solveEq(a, 1, b, 1), ask = askedSeg(p);
    return linVal(skey(ask) === skey(ents[1][0]) ? b : a, x);
  }
  if ((m = p.match(/^Line ℓ is the perpendicular bisector of ([A-Z]{2}), and ([A-Z]) is on ℓ\./))) {
    const [, S, Z] = m, ask = askedSeg(p);
    const other = S.split('').find(c => c !== ask.replace(Z, ''));
    return Number(segVal(G, Z + other));
  }
  if ((m = p.match(/^([A-Z]) is on the bisector of ∠([A-Z]{3}), ([A-Z]{2}) ⊥ ([A-Z]{2}) and ([A-Z]{2}) ⊥ ([A-Z]{2})\./))) {
    const [, , , p1, , p2] = m;
    const v1 = segVal(G, p1), v2 = segVal(G, p2);
    return Number(v1 ?? v2);
  }
  // incenter radius
  if ((m = p.match(/^([A-Z]) is the incenter of △([A-Z]{3}) and the circle is its inscribed circle\. ([A-Z]{2}) ⊥ ([A-Z]{2})/))) return Number(segVal(G, m[3]));
  // centers: distances
  if ((m = p.match(/^△([A-Z]{3}) has a right angle at ([A-Z]) and hypotenuse ([A-Z]{2}) = ([\d.]+) \w+\. ([A-Z]) is its circumcenter/))) return Number(m[4]) / 2;
  if ((m = p.match(/^([A-Z]) is the incenter of △([A-Z]{3})\. ([A-Z]{2}) ⊥ ([A-Z]{2}), ([A-Z]{2}) ⊥ ([A-Z]{2}),/))) {
    const ask = askedSeg(p), [, , , pa, , pb] = m;
    const known = skey(ask) === skey(pa) ? pb : pa;
    return Number(segVal(G, known));
  }
  if ((m = p.match(/^([A-Z]) is the circumcenter of △([A-Z]{3}) and ([A-Z]) is the midpoint of ([A-Z]{2})\./))) {
    const [, Z, T] = m;
    for (const c of T) { const v = segVal(G, Z + c); if (v !== undefined) return Number(v); }
    return undefined;
  }
  // Pythagoras: tangent segment
  if ((m = p.match(/^([A-Z]) is the incenter of △([A-Z]{3}); the inscribed circle touches ([A-Z]{2}) at ([A-Z])\. The radius is ([\d.]+) \w+ and ([A-Z]{2}) = ([\d.]+)/))) {
    const r = Number(m[5]), h = Number(m[7]), v = Math.sqrt(h * h - r * r);
    return /nearest tenth/.test(p) ? round(v, 1) : v;
  }
  // Pythagoras: half chord
  if ((m = p.match(/^([A-Z]) is the circumcenter of △([A-Z]{3}), so the circle through .*? has radius ([A-Z]{2}) = ([\d.]+) \w+\. ([A-Z])([A-Z]) ⊥ ([A-Z]{2}) and ([A-Z]{2}) = ([\d.]+)/))) {
    const R = Number(m[4]), d = Number(m[9]), Ft = m[6], chord = m[7], ask = askedSeg(p);
    const half = Math.sqrt(R * R - d * d);
    const v = ask.includes(Ft) ? half : skey(ask) === skey(chord) ? 2 * half : NaN;
    return /nearest tenth/.test(p) ? round(v, 1) : v;
  }
  // context: brace between measured midpoints; right-triangle towns
  if ((m = p.match(/two ([\d.]+)-inch rafters on a ([\d.]+)-inch beam\. .*brace is nailed between the measured midpoints/))) return Number(m[2]) / 2;
  if ((m = p.match(/meet at a right angle, and .* is ([\d.]+) miles from .* in a straight line\./))) return Number(m[1]) / 2;
  return undefined;
}
function bisectorFoot(A, B, C) { const ab = dist(A, B), ac = dist(A, C); return add(B, mul(sub(C, B), ab / (ab + ac))); }
function angleByName(pts, n) {
  if (!n || n.length !== 3) return undefined;
  const [P, V, Q] = n.split('').map(c => pts[c]);
  if (!P || !V || !Q) return undefined;
  return Math.round(angAt(V, P, Q) * 1e6) / 1e6;
}
/** "R and Z are the midpoints of BJ and BM. m∠BJM = 50°. Find m∠JRZ.": the asked angle is formed by a side line
 *  and the midsegment (∥ the third side), so it equals the given angle or its supplement; which one is read from the
 *  structure: the rays of both angles, compared direction by direction */
function midsegAngle(q, m) {
  const F = readFig(q);
  const [, , , , , gName, gVal, aName] = m;
  const g = Number(gVal);
  if (!F) return undefined;
  const P = n => F.pts[n];
  const rays = n => { const [a, v, b] = n.split('').map(P); return a && v && b ? [unit(sub(a, v)), unit(sub(b, v))] : null; };
  const gr = rays(gName), ar = rays(aName);
  if (!gr || !ar) return undefined;
  // pair each ray of the asked angle with a parallel ray of the given angle; the count of reversed pairs decides
  const tries = [[0, 1], [1, 0]];
  for (const [i, j] of tries) {
    if (parallel(ar[0], gr[i], 2) && parallel(ar[1], gr[j], 2)) {
      const flips = (dot(ar[0], gr[i]) < 0 ? 1 : 0) + (dot(ar[1], gr[j]) < 0 ? 1 : 0);
      return flips === 1 ? 180 - g : g;
    }
  }
  return undefined;
}

// =====================================================================================================================
// choice questions about the figure
function solveSegKind(q) {
  const F = readFig(q), T = triOf(q.prompt);
  if (!F || !T) return undefined;
  const o = objOf(F, q);
  if (!o) return undefined;
  const K = kindsOf(F, T, o.A, o.B, o.line);
  if (/both an altitude and a median/.test((q.choices ?? []).join(' '))) {
    const both = K.has('altitude') && K.has('median');
    return choiceIdx(q, c => (both ? /^both/.test(c) : K.has('altitude') && !K.has('median') ? /^only an altitude/.test(c) : K.has('median') && !K.has('altitude') ? /^only a median/.test(c) : false));
  }
  if (K.size !== 1) return -1;
  return choiceIdx(q, c => K.has(kindOfChoice(c)));
}
function solveMidsegId(q) {
  const F = readFig(q), p = plain(q.prompt);
  const m = p.match(/^([A-Z]) is on ([A-Z]{2}) and ([A-Z]) is on ([A-Z]{2})\./);
  if (!F || !m) return undefined;
  const P = n => F.pts[n];
  const k = (markedMid(F, P(m[1]), P(m[2][0]), P(m[2][1])) ? 1 : 0) + (markedMid(F, P(m[3]), P(m[4][0]), P(m[4][1])) ? 1 : 0);
  return choiceIdx(q, c => (k === 2 ? /^Yes: both endpoints/.test(c) : k === 1 ? /^No: only one endpoint/.test(c) : /^No: no endpoint/.test(c)));
}
function solveMedianWhich(q) {
  const F = readFig(q), T = triOf(q.prompt);
  if (!F || !T) return undefined;
  return choiceIdx(q, c => { const n = c.replace(/[^A-Z]/g, ''); return n.length === 2 && F.pts[n[0]] && F.pts[n[1]] && kindsOf(F, T, F.pts[n[0]], F.pts[n[1]], false).has('median'); });
}
function solveAltitudeCase(q) {
  const p = plain(q.prompt), F = readFig(q);
  let m;
  if ((m = p.match(/^△([A-Z]{3}) has an obtuse angle at ([A-Z])\. Where is the altitude from ([A-Z])\?/))) {
    const [, T, O, Fr] = m, other = T.replace(O, '').replace(Fr, '');
    if (!F) return undefined;
    const A = F.pts[Fr], B = F.pts[O], C = F.pts[other];
    const ft = foot(A, B, C), t = dot(sub(ft, B), sub(C, B)) / dot(sub(C, B), sub(C, B));
    const out = t < -1e-6 || t > 1 + 1e-6;
    return choiceIdx(q, c => (out ? /perpendicular to line .* extended, meeting it outside/.test(c) : /^From [A-Z] perpendicular to [A-Z]{2}$/.test(c)));
  }
  if ((m = p.match(/^△([A-Z]{3}) has a right angle at ([A-Z])\. Which segment is the altitude from ([A-Z])\?/))) {
    const [, , R, Fr] = m;
    if (Fr === R) return undefined;
    return choiceIdx(q, c => new RegExp(`^the leg (${Fr}${R}|${R}${Fr})$`).test(c));
  }
  if (/^Read only the marks\. What is/.test(p)) {
    if (!F) return undefined;
    const n = p.match(/What is ([A-Z]{2})/)[1];
    // the triangle: the three named points that are not the segment's foot (the figure's fill)
    const fill = q.data.picture.fig.fills?.[0]?.pts;
    const names = fill ? fill.map(at => Object.keys(F.pts).find(k => near(F.pts[k], at))).filter(Boolean) : [];
    if (names.length !== 3) return undefined;
    const K = kindsOf(F, names.join(''), F.pts[n[0]], F.pts[n[1]], false);
    const both = K.has('altitude') && K.has('median');
    return choiceIdx(q, c => (both ? /^both/.test(c) : K.has('altitude') ? /^only an altitude/.test(c) : K.has('median') ? /^only a median/.test(c) : false));
  }
  return undefined;
}
function solveBisectorMid(q) {
  const p = plain(q.prompt), F = readFig(q);
  const m = p.match(/^The arcs show that ([A-Z])([A-Z]) bisects ∠([A-Z])([A-Z])([A-Z])\./);
  if (!m || !F) return undefined;
  const [, V, X, P1, , P2] = m;
  return choiceIdx(q, c => {
    let k;
    if ((k = c.match(/^∠([A-Z]{3}) ≅ ∠([A-Z]{3})$/))) {
      const halves = [new Set([P1, V, X]), new Set([X, V, P2])];
      const s1 = new Set(k[1]), s2 = new Set(k[2]);
      const eq = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
      return k[1][1] === V && k[2][1] === V && ((eq(s1, halves[0]) && eq(s2, halves[1])) || (eq(s1, halves[1]) && eq(s2, halves[0])));
    }
    if ((k = c.match(/^([A-Z]{2}) ⊥ ([A-Z]{2})$/))) return boxAt(F, lineMeet(F.pts[k[1][0]], F.pts[k[1][1]], F.pts[k[2][0]], F.pts[k[2][1]]) ?? [1e9, 1e9], sub(F.pts[k[1][1]], F.pts[k[1][0]]), sub(F.pts[k[2][1]], F.pts[k[2][0]]));
    if ((k = c.match(/^([A-Z]{2}) ≅ ([A-Z]{2})$/))) return markedMid(F, F.pts[X], F.pts[P1], F.pts[P2]);
    if (/median/.test(c)) return markedMid(F, F.pts[X], F.pts[P1], F.pts[P2]);
    return false;
  });
}
function solvePerpBisCheck(q) {
  const p = plain(q.prompt), F = readFig(q);
  const m = p.match(/perpendicular bisector of ([A-Z]{2})\?/);
  if (!m || !F || !F.ell) return undefined;
  const A = F.pts[m[1][0]], B = F.pts[m[1][1]];
  const P = lineMeet(F.ell.a, F.ell.b, A, B);
  if (!P) return undefined;
  const perp = boxAt(F, P, sub(F.ell.b, F.ell.a), sub(B, A)), mm = markedMid(F, P, A, B);
  return choiceIdx(q, c => (perp && mm ? /^Yes/.test(c) : perp ? /^No: it is perpendicular .* but .* not marked as the midpoint/.test(c) : mm ? /^No: [A-Z] is the midpoint, but ℓ is not marked perpendicular/.test(c) : false));
}
function solvePbEquiWhich(q) {
  const p = plain(q.prompt), F = readFig(q);
  const m = p.match(/same distance from ([A-Z]) and from ([A-Z])\?/);
  if (!m || !F) return undefined;
  const A = F.pts[m[1]], B = F.pts[m[2]];
  // must be: on the line ℓ, which the marks show is the perpendicular bisector (the prompt says so too)
  return choiceIdx(q, c => { const X = F.pts[c.trim()]; return !!X && F.ell && onLine(X, F.ell.a, F.ell.b) && Math.abs(dist(X, A) - dist(X, B)) < 1; });
}
function solveAbEquiWhich(q) {
  const p = plain(q.prompt), F = readFig(q);
  const m = p.match(/distance from ([A-Z]) to ray ([A-Z])([A-Z])\?/);
  if (!m || !F) return undefined;
  const Y = F.pts[m[1]], V = F.pts[m[2]], R = F.pts[m[3]];
  return choiceIdx(q, c => {
    const n = c.replace(/[^A-Z]/g, '');
    if (n.length !== 2 || !n.includes(m[1])) return false;
    const X = F.pts[n.replace(m[1], '')];
    if (!X) return false;
    const onRay = onLine(X, V, R) && dot(sub(X, V), sub(R, V)) > 0;
    return onRay && perpTo(sub(Y, X), sub(R, V)) && boxAt(F, X, sub(Y, X), sub(R, V));
  });
}
function whereByAngles(q, center) {
  const a = nums(tex(q.board)).filter(x => x > 0);
  if (a.length !== 3) return undefined;
  const mx = Math.max(...a);
  return choiceIdx(q, c => {
    if (mx > 90) return /^outside/.test(c);
    if (mx === 90) return center === 'circ' ? /midpoint of the longest side/.test(c) : /vertex of the right angle/.test(c);
    return /^inside/.test(c);
  });
}
/** the three marked lines of a figure → which center */
function centerOfMarks(F) {
  const arcs = F.angs.some(a => a.arcs > 0);
  const boxes = F.angs.filter(a => a.box).length;
  const ticks = F.ticks.length;
  if (arcs && !boxes) return 'incenter';
  if (boxes >= 3 && ticks >= 6) return 'circumcenter';
  if (boxes >= 3 && !ticks) return 'orthocenter';
  if (!boxes && ticks >= 6) return 'centroid';
  return null;
}
function solveCenterMatch(q) {
  const t = low(q.prompt).replace(/^which center is /, '');
  const rules = [
    [/no equal-distance/, 'orthocenter'], [/right-angle vertex/, 'orthocenter'], [/midpoint of the hypotenuse/, 'circumcenter'],
    [/perpendicular bisectors/, 'circumcenter'], [/(same distance from|equidistant from) (all three |the )?vertices/, 'circumcenter'],
    [/circle through/, 'circumcenter'], [/(same distance from|equidistant from) (all three |the )?sides/, 'incenter'],
    [/circle inside|inscribed circle|touches all three sides/, 'incenter'], [/angle bisectors/, 'incenter'], [/balance point|center of mass|center of gravity/, 'centroid'],
    [/medians|midpoint of the opposite side|two thirds of the way/, 'centroid'], [/altitudes|perpendiculars from each vertex/, 'orthocenter'],
  ];
  const hit = rules.find(([re]) => re.test(t));
  if (!hit) return undefined;
  return choiceIdx(q, c => c === 'the ' + hit[1]);
}
function solveMidsegParallel(q) {
  const p = plain(q.prompt), F = readFig(q);
  const m = p.match(/^([A-Z]), ([A-Z]) and ([A-Z]) are the midpoints of the sides\. ([A-Z])([A-Z]) is parallel to which side of △([A-Z]{3})\?/);
  if (!m || !F) return undefined;
  const [, , , , Z, W, T] = m;
  const sides = [T[0] + T[1], T[1] + T[2], T[2] + T[0]];
  const which = n => sides.findIndex(s => markedMid(F, F.pts[n], F.pts[s[0]], F.pts[s[1]]));
  const i = which(Z), j = which(W);
  if (i < 0 || j < 0 || i === j) return -1;
  const third = sides[3 - i - j];
  return choiceIdx(q, c => skey(c.replace(/[^A-Z]/g, '')) === skey(third));
}
/** "Use only the marks and the givens": is the asked length / angle determined? */
function solveEnoughInfo(q) {
  const p = plain(q.prompt), F = readFig(q), G = givensOf(q.prompt);
  if (!F) return undefined;
  const P = n => F.pts[n];
  let val = null;
  const ask = askedSeg(p), aa = askedAng(p);
  if (ask) {
    const [gName, gv] = Object.entries(G.segs).find(([k]) => skey(k) !== skey(ask)) ?? [];
    if (!gName) return undefined;
    const g = Number(gv);
    const A = P(ask[0]), B = P(ask[1]), C = P(gName[0]), D = P(gName[1]);
    if (!A || !B || !C || !D) return undefined;
    // a part of the given segment (shares an endpoint, lies on it)
    const sharedA = gName.includes(ask[0]) ? ask[0] : gName.includes(ask[1]) ? ask[1] : null;
    if (sharedA) {
      const other = ask.replace(sharedA, ''), farEnd = gName.replace(sharedA, '');
      if (onSeg(P(other), P(sharedA), P(farEnd)) && markedMid(F, P(other), P(sharedA), P(farEnd))) val = g / 2;
      else if (onSeg(P(farEnd), P(sharedA), P(other)) && markedMid(F, P(farEnd), P(sharedA), P(other))) val = g * 2;
    } else {
      // a midsegment: both endpoints marked midpoints of two segments from one vertex to the given side's ends
      for (const V of Object.keys(F.pts)) {
        if (gName.includes(V) || ask.includes(V)) continue;
        const ok1 = (markedMid(F, A, P(V), C) && markedMid(F, B, P(V), D)) || (markedMid(F, A, P(V), D) && markedMid(F, B, P(V), C));
        if (ok1) { val = g / 2; break; }
        // the reverse: the given is the midsegment, the asked the third side
        const ok2 = (markedMid(F, C, P(V), A) && markedMid(F, D, P(V), B)) || (markedMid(F, C, P(V), B) && markedMid(F, D, P(V), A));
        if (ok2) { val = g * 2; break; }
      }
    }
    if (val === null) return choiceIdx(q, c => /not enough information/.test(c));
    return choiceIdx(q, c => !/not enough/.test(c) && Math.abs(nums(c)[0] - val) < 1e-9);
  }
  if (aa) {
    const [gName, gv] = Object.entries(G.angs)[0] ?? [];
    if (!gName) return undefined;
    const g = Number(lin(gv)[1]);
    const V = gName[1];
    if (aa[1] !== V) return undefined;
    // the asked angle is half of the given one when the arcs mark the ray that splits it (or the reverse)
    const inner = (big, small) => { const s = new Set(big); return small[1] === big[1] && (s.has(small[0]) || s.has(small[2])); };
    const dirOf = n => sub(P(n), P(V));
    let half = null;
    if (inner(gName, aa)) { const ray = [aa[0], aa[2]].find(c => !gName.includes(c)); if (ray && arcsBisect(F, P(V), dirOf(ray), dirOf(gName[0]), dirOf(gName[2]))) half = g / 2; }
    else if (inner(aa, gName)) { const ray = [gName[0], gName[2]].find(c => !aa.includes(c)); if (ray && arcsBisect(F, P(V), dirOf(ray), dirOf(aa[0]), dirOf(aa[2]))) half = g * 2; }
    if (half === null) return choiceIdx(q, c => /not enough information/.test(c));
    return choiceIdx(q, c => !/not enough/.test(c) && Math.abs(nums(c)[0] - half) < 1e-9);
  }
  return undefined;
}

// =====================================================================================================================
// constructions
function consOf(q) {
  const c = q.data?.picture?.cons;
  if (!c) return null;
  const pts = {};
  for (const p of c.c.pts ?? []) pts[p.name] = { at: p.at, deps: p.deps ?? [] };
  const verts = Object.keys(pts).filter(n => !pts[n].deps.length);
  const ctr = Object.keys(pts).find(n => pts[n].deps.includes('ctr'));
  const ft = Object.keys(pts).find(n => pts[n].deps.includes('perp'));
  return { kind: c.c.kind, upto: c.upto, pts, verts, ctr, ft };
}
function solveNext(q) {
  const C = consOf(q);
  if (!C) return undefined;
  const k = C.upto, isSide = n => n.length === 2 && C.verts.includes(n[0]) && C.verts.includes(n[1]);
  if (C.kind === 'perpBis') {
    return choiceIdx(q, c => {
      let m;
      if ((m = c.match(/^Construct the perpendicular bisector of ([A-Z]{2})$/))) return k <= 1 && isSide(m[1]);
      if ((m = c.match(/^Mark ([A-Z]) where the two perpendicular bisectors meet$/))) return k === 2;
      if ((m = c.match(/^Put the needle on ([A-Z]) and the pencil on ([A-Z]); draw the circle$/))) return k === 3 && m[1] === C.ctr && C.verts.includes(m[2]);
      return false;
    });
  }
  if (C.kind === 'angleBis') {
    return choiceIdx(q, c => {
      let m;
      if ((m = c.match(/^Bisect ∠([A-Z])$/))) return k <= 1 && C.verts.includes(m[1]);
      if ((m = c.match(/^Mark ([A-Z]) where the two angle bisectors meet$/))) return k === 2;
      if ((m = c.match(/^Construct the perpendicular from ([A-Z]) to ([A-Z]{2}) and mark its foot ([A-Z])$/))) return k === 3 && m[1] === C.ctr && isSide(m[2]);
      if ((m = c.match(/^Put the needle on ([A-Z]) and the pencil on ([A-Z]); draw the circle$/))) return k === 4 && m[1] === C.ctr && m[2] === C.ft;
      return false;
    });
  }
  return undefined;
}
/** a compass width: compare the length each choice names with the true radius */
function solveRadius(q, inscribed) {
  const C = consOf(q), p = plain(q.prompt);
  if (/Do you need the third one/.test(p)) return choiceIdx(q, c => /^no: two locate the center/.test(c));
  if (!C) return undefined;
  const m = p.match(/^([A-Z]) is (?:the center of the circumscribed circle|the incenter) of △([A-Z]{3})/);
  if (!m) return undefined;
  const at = n => C.pts[n]?.at;
  const [A, B, D] = m[2].split('').map(at);
  if (!A || !B || !D) return undefined;
  const O = at(m[1]) ?? (inscribed ? incenter(A, B, D) : circum(A, B, D));
  const R = inscribed ? Math.abs(cross(sub(B, A), sub(O, A))) / dist(A, B) : dist(O, A);
  // a foot named in the prompt ("B is the foot of the perpendicular from X to NH")
  const fm = p.match(/([A-Z]) is the foot of the perpendicular from ([A-Z]) to ([A-Z]{2})/);
  const named = n => { if (at(n)) return at(n); if (fm && n === fm[1]) { const s = fm[3]; return foot(O, at(s[0]), at(s[1])); } return null; };
  return choiceIdx(q, c => {
    let k, L = null;
    if ((k = c.match(/^from ([A-Z]) to the midpoint of ([A-Z]{2})$/))) L = dist(named(k[1]), mid(at(k[2][0]), at(k[2][1])));
    else if ((k = c.match(/^half of ([A-Z]{2})$/))) L = dist(at(k[1][0]), at(k[1][1])) / 2;
    else if ((k = c.match(/^([A-Z])([A-Z]),/))) { const X = named(k[1]), Y = named(k[2]); if (X && Y) L = dist(X, Y); }
    return L !== null && Math.abs(L - R) < 0.5;
  });
}

// =====================================================================================================================
// proofs
/** a statement → structure */
function parseSt(s) {
  const t = chText(s);
  let m;
  if ((m = t.match(/^△([A-Z]{3}) ≅ △([A-Z]{3})$/))) return { k: 'tri', a: m[1], b: m[2] };
  if ((m = t.match(/^∠([A-Z]{3}) ≅ ∠([A-Z]{3})$/))) return { k: 'ang', a: m[1], b: m[2] };
  if ((m = t.match(/^([A-Z]{2}) ≅ ([A-Z]{2})$/))) return { k: 'seg', a: m[1], b: m[2] };
  if ((m = t.match(/^([A-Z]{2}) = ([A-Z]{2})$/))) return { k: 'seg', a: m[1], b: m[2] };
  if ((m = t.match(/^([A-Z]{2}) = ([A-Z]{2}) \(so ([A-Z]{2}) = 2 ([A-Z]{2})\)$/))) return { k: 'seg', a: m[1], b: m[2], so: true };
  if ((m = t.match(/^([A-Z]{2}) = 2 ([A-Z]{2}) \(centroid\)$/))) return { k: 'centroid', a: m[1], b: m[2] };
  if ((m = t.match(/^([A-Z]'?[A-Z]'?) = 2\/3 ([A-Z]{2})$/))) return { k: 'twothirds', a: m[1].replace(/'/g, '′'), b: m[2] };
  if ((m = t.match(/^([A-Z]{2}) ∥ ([A-Z]{2}), \1 = 1\/2 \2$/))) return { k: 'midseg', a: m[1], b: m[2] };
  if ((m = t.match(/^([A-Z]{2}) = 1\/2 ([A-Z]{2})$/))) return { k: 'half', a: m[1], b: m[2] };
  if ((m = t.match(/^([A-Z]{2}) ∥ ([A-Z]{2}), \1 = \2$/))) return { k: 'pareq', a: m[1], b: m[2] };
  if ((m = t.match(/^([A-Z]{2}) ∥ ([A-Z]{2})$/))) return { k: 'par', a: m[1], b: m[2] };
  if ((m = t.match(/^([A-Z]{2}) ⊥ ([A-Z]{2})$/))) return { k: 'perp', a: m[1], b: m[2] };
  if ((m = t.match(/^∠([A-Z]{3}), ∠([A-Z]{3}) are right angles$/))) return { k: 'rights', a: m[1], b: m[2] };
  if ((m = t.match(/^([A-Z]) is on ℓ(\d)$/))) return { k: 'onl', p: m[1], l: m[2] };
  if ((m = t.match(/^([A-Z]) (?:is )?on the bisector of ∠([A-Z])$/))) return { k: 'onbis', p: m[1], v: m[2] };
  if ((m = t.match(/^([A-Z]) is inside ∠([A-Z])$/))) return { k: 'inside', p: m[1], v: m[2] };
  if ((m = t.match(/^([A-Z])'? = ([A-Z])'$/))) return { k: 'same', a: m[1], b: m[2] };
  return { k: 'other', t };
}
/** the givens of a proof frame → facts */
function parseGivens(list) {
  const G = { mids: [], par: [], cong: [], perpAt: [], onl: {}, lines: {}, bis: [], medians: [], inside: [], perps: [], ptOnEll: [], ellPB: null, raw: list.map(tex) };
  for (const raw of G.raw) for (const part0 of raw.split(/;\s*|\s\|\s/)) {
    const part = part0.trim();
    let m;
    if ((m = part.match(/^ℓ ⊥ ([A-Z]{2}) at its midpoint ([A-Z])$/))) { G.ellPB = { s: m[1], m: m[2] }; G.mids.push({ m: m[2], s: m[1] }); }
    else if ((m = part.match(/^([A-Z]) on ℓ$/))) G.ptOnEll.push(m[1]);
    else if ((m = part.match(/^([A-Z]) (?:is the )?midpoint of ([A-Z]{2})$/))) G.mids.push({ m: m[1], s: m[2] });
    else if ((m = part.match(/^([A-Z]), ([A-Z]) ?:? (?:the )?midpoints of ([A-Z]{2}), ([A-Z]{2})$/))) { G.mids.push({ m: m[1], s: m[3] }, { m: m[2], s: m[4] }); }
    else if ((m = part.match(/^medians ([A-Z]{2}), ([A-Z]{2}) meet at ([A-Z])$/))) G.medians.push(m[1], m[2]);
    else if ((m = part.match(/^([A-Z]{2}), ([A-Z]{2}), ([A-Z]{2}) medians$/))) G.medians.push(m[1], m[2], m[3]);
    else if ((m = part.match(/^ℓ1, ℓ2, ℓ3 ?: the perpendicular bisectors of ([A-Z]{2}), ([A-Z]{2}), ([A-Z]{2})$/))) { G.lines[1] = m[1]; G.lines[2] = m[2]; G.lines[3] = m[3]; }
    else if ((m = part.match(/^([A-Z]) is on ℓ1 and ℓ2$/))) { G.onl[m[1]] = [1, 2]; }
    else if ((m = part.match(/^bisectors of ∠([A-Z]), ∠([A-Z]) meet at ([A-Z])$/))) G.bis.push({ p: m[3], v: [m[1], m[2]] });
    else if ((m = part.match(/^ray ([A-Z]{2}) bisects ∠([A-Z]{3})$/))) G.bis.push({ p: null, ray: m[1], ang: m[2] });
    else if ((m = part.match(/^([A-Z]) inside ∠([A-Z]{3})$/))) G.inside.push({ p: m[1], ang: m[2] });
    else if ((m = part.match(/^([A-Z]{2}), ([A-Z]{2}), ([A-Z]{2}) ⊥ the sides$/))) G.perps.push(m[1], m[2], m[3]);
    else if (/⊥ ray/.test(part)) { for (const x of part.split(/,\s*/)) { const k = x.match(/^([A-Z]{2}) ⊥ ray ([A-Z]{2})$/); if (k) G.perpAt.push({ s: k[1], ray: k[2] }); } }
    else if (/∥|≅/.test(part)) {
      for (const x of part.split(/,\s*/)) {
        let k;
        if ((k = x.match(/^([A-Z]{2}) ∥ ([A-Z]{2})$/))) G.par.push([k[1], k[2]]);
        else if ((k = x.match(/^([A-Z]{2}) ≅ ([A-Z]{2})$/))) G.cong.push([k[1], k[2]]);
      }
    } else if ((m = part.match(/^([A-Z]{2}) meets ([A-Z]{2}) at ([A-Z]), ([A-Z]{2}) at ([A-Z])′$/))) G.meet = m;
  }
  return G;
}
const sameSeg = (a, b) => skey(a) === skey(b);
const samePair = (x, y) => (sameSeg(x[0], y[0]) && sameSeg(x[1], y[1])) || (sameSeg(x[0], y[1]) && sameSeg(x[1], y[0]));

/** one context for judging proof lines */
function proofCtx(q) {
  const pr = q.data.picture.proof, F = readFig(q);
  const G = parseGivens(pr.given ?? []);
  return { F, G, prove: parseSt(tex(pr.prove)), proveText: tex(pr.prove), rows: pr.rows.map(r => ({ st: tex(r.st), rs: tex(r.rs), S: parseSt(tex(r.st)) })) };
}
/** angle name → geometric angle (vertex, two ray directions) in the figure */
function angGeo(F, n) {
  const [a, v, b] = n.split('').map(c => F?.pts?.[c]);
  return a && v && b ? { v, d1: unit(sub(a, v)), d2: unit(sub(b, v)) } : null;
}
function sameAng(F, x, y) {
  if (x === y || (x[1] === y[1] && new Set([x[0], x[2]]).has(y[0]) && new Set([x[0], x[2]]).has(y[2]))) return true;
  const g = angGeo(F, x), h = angGeo(F, y);
  if (!g || !h || !near(g.v, h.v)) return false;
  const sd = (a, b) => angDeg(a, b) < 0.8;
  return (sd(g.d1, h.d1) && sd(g.d2, h.d2)) || (sd(g.d1, h.d2) && sd(g.d2, h.d1));
}
const isMidOf = (G, m, s) => G.mids.some(x => x.m === m && sameSeg(x.s, s));
/** a right angle by the givens: ℓ ⊥ AB at M with the point on ℓ, or a perpendicular to a ray */
function rightByGiven(C, n) {
  const G = C.G, [a, v, b] = n.split('');
  if (G.ellPB && v === G.ellPB.m) { const s = G.ellPB.s; return (G.ptOnEll.includes(a) && s.includes(b)) || (G.ptOnEll.includes(b) && s.includes(a)); }
  for (const x of G.perpAt) {
    // segment PF ⊥ ray EG: the right angle is at the foot (the endpoint on the ray's line), between F→P and F→E
    const Fg = C.F, onRayLine = c => Fg && Fg.pts[c] && Fg.pts[x.ray[0]] && Fg.pts[x.ray[1]] && onLine(Fg.pts[c], Fg.pts[x.ray[0]], Fg.pts[x.ray[1]]);
    const ft = x.s.split('').find(c => onRayLine(c)) ?? x.s[1];
    if (ft !== v) continue;
    const other = x.s.replace(v, '');
    const alongRay = c => x.ray.includes(c) || onRayLine(c);
    if ((a === other && alongRay(b) && b !== v) || (b === other && alongRay(a) && a !== v)) return true;
  }
  return false;
}
function vertical(F, x, y) {
  const g = angGeo(F, x), h = angGeo(F, y);
  if (!g || !h || !near(g.v, h.v)) return false;
  const op = (a, b) => angDeg(a, b) > 179.2;
  return (op(g.d1, h.d1) && op(g.d2, h.d2)) || (op(g.d1, h.d2) && op(g.d2, h.d1));
}
/** alternate interior angles: vertices V1 ≠ V2, one ray of each along V1V2 toward the other, the other two rays
 *  antiparallel; the lines of those rays known parallel (given or a line above) */
function altInterior(C, x, y, before) {
  const F = C.F, g = angGeo(F, x), h = angGeo(F, y);
  if (!g || !h || near(g.v, h.v)) return false;
  const t = unit(sub(h.v, g.v));
  const sd = (a, b) => angDeg(a, b) < 0.8;
  const gr = sd(g.d1, t) ? g.d2 : sd(g.d2, t) ? g.d1 : null;
  const hr = sd(h.d1, mul(t, -1)) ? h.d2 : sd(h.d2, mul(t, -1)) ? h.d1 : null;
  if (!gr || !hr || angDeg(gr, hr) < 179.2) return false;
  // the parallel lines: through g.v along gr and through h.v along hr; known parallel?
  const lineOf = n => [F.pts[n[0]], F.pts[n[1]]];
  const pars = [...C.G.par, ...before.filter(r => r.S.k === 'par' || r.S.k === 'pareq' || r.S.k === 'midseg').map(r => [r.S.a, r.S.b])];
  // parallels through a common segment: UV ∥ FG and NS ∥ FG give UV ∥ NS
  const all = [...pars];
  for (const p1 of pars) for (const p2 of pars) if (p1 !== p2) for (const a of p1) for (const b of p2) if (sameSeg(a, b)) all.push([p1.find(z => z !== a), p2.find(z => z !== b)]);
  const fits = (n, P, d) => { const [A, B] = lineOf(n); return A && B && onLine(P, A, B) && parallel(d, sub(B, A)); };
  return all.some(([s1, s2]) => (fits(s1, g.v, gr) && fits(s2, h.v, hr)) || (fits(s2, g.v, gr) && fits(s1, h.v, hr)));
}
/** knowledge from the givens and the lines above: equal segments (union-find), equal angles, right angles */
function knowledge(C, before) {
  const par = {};
  const f = x => { while (par[x] && par[x] !== x) x = par[x]; return x; };
  const u = (a, b) => { const x = f(skey(a)), y = f(skey(b)); if (x !== y) par[x] = y; };
  const segEq = [], angEq = [], rights = new Set();
  for (const [a, b] of C.G.cong) { u(a, b); segEq.push([a, b]); }
  for (const r of before) {
    const S = r.S;
    if (S.k === 'seg' || S.k === 'pareq') { u(S.a, S.b); segEq.push([S.a, S.b]); }
    if (S.k === 'ang') angEq.push([S.a, S.b]);
    if (S.k === 'rights') { rights.add(S.a); rights.add(S.b); }
  }
  // a side shared by both triangles counts only once the Reflexive line is written above
  const same = (a, b) => (sameSeg(a, b) ? segEq.some(([x, y]) => sameSeg(x, a) && sameSeg(y, a)) : f(skey(a)) === f(skey(b)));
  return { same, segEq, angEq, rights, u, f };
}
/** the triangle-congruence criteria that hold for △T1 ≅ △T2 from the knowledge above (no derived parts) */
function criteria(C, T1, T2, before) {
  const K = knowledge(C, before);
  const S = [], A = [];
  const side = (T, i) => T.split('').filter((_, j) => j !== i).join('');
  const angN = (T, i) => { const o = T.split('').filter((_, j) => j !== i); return o[0] + T[i] + o[1]; };
  const angKnown = (x, y) => K.angEq.some(([a, b]) => (sameAng(C.F, a, x) && sameAng(C.F, b, y)) || (sameAng(C.F, a, y) && sameAng(C.F, b, x)));
  const isRight = n => [...K.rights].some(r => sameAng(C.F, r, n)) || rightByGiven(C, n);
  let right = -1;
  for (let i = 0; i < 3; i++) {
    if (K.same(side(T1, i), side(T2, i))) S.push(i);
    if (angKnown(angN(T1, i), angN(T2, i))) A.push(i);
    if (isRight(angN(T1, i)) && isRight(angN(T2, i))) right = i;
  }
  const w = new Set();
  if (S.length === 3) w.add('SSS');
  for (const a of A) { const inc = [0, 1, 2].filter(i => i !== a); if (inc.every(i => S.includes(i))) w.add('SAS'); }
  if (A.length >= 2) {
    for (let x = 0; x < A.length; x++) for (let y = x + 1; y < A.length; y++) {
      const third = 3 - A[x] - A[y];
      if (S.includes(third)) w.add('ASA');
      if (S.includes(A[x]) || S.includes(A[y])) w.add('AAS');
    }
  }
  if (right >= 0 && S.includes(right) && S.some(i => i !== right)) w.add('HL');
  // a right angle known only through the givens / "are right angles" also gives the A of SAS / ASA / AAS
  if (right >= 0 && !A.includes(right)) {
    const inc = [0, 1, 2].filter(i => i !== right);
    if (inc.every(i => S.includes(i))) w.add('SAS');
    for (const a of A) {
      const third = 3 - a - right;
      if (S.includes(third)) w.add('ASA');
      if (S.includes(a) || S.includes(right)) w.add('AAS');
    }
  }
  return w;
}
/** the correspondence of a triangle congruence line: maps letters */
function corr(T1, T2) { const m = {}; for (let i = 0; i < 3; i++) m[T1[i]] = T2[i]; return m; }
function cpctc(C, S, before) {
  for (const r of before) {
    if (r.S.k !== 'tri') continue;
    for (const [T1, T2] of [[r.S.a, r.S.b], [r.S.b, r.S.a]]) {
      const m = corr(T1, T2), inT1 = n => n.split('').every(c => T1.includes(c));
      const mapSeg = n => n.split('').map(c => m[c]).join('');
      if (S.k === 'seg' || S.k === 'pareq') {
        if ((inT1(S.a) && sameSeg(mapSeg(S.a), S.b)) || (inT1(S.b) && sameSeg(mapSeg(S.b), S.a))) return true;
      }
      if (S.k === 'ang') {
        const mapA = n => n.split('').map(c => m[c]).join('');
        if ((inT1(S.a) && sameAng(C.F, mapA(S.a), S.b)) || (inT1(S.b) && sameAng(C.F, mapA(S.b), S.a))) return true;
        // the statement may name an angle by other points on the same rays
        for (const x of [S.a, S.b]) {
          const y = x === S.a ? S.b : S.a;
          for (const perm of anglesOf(T1)) if (sameAng(C.F, perm, x) && sameAng(C.F, mapA(perm), y)) return true;
        }
      }
    }
  }
  return false;
}
const anglesOf = T => [0, 1, 2].map(i => { const o = T.split('').filter((_, j) => j !== i); return o[0] + T[i] + o[1]; });

const R = s => low(s).replace(/\bangles?\b/g, m => m).replace(/∠s/g, 'angles').replace(/\s+/g, ' ').trim();
/** is `reason` a valid justification of statement `st` (row index i) given the rows `before` */
function reasonValid(C, st, reason, before) {
  const S = typeof st === 'string' ? parseSt(st) : st, r = R(reason).replace(/tri∠/g, 'triangle');
  const G = C.G, F = C.F;
  const provingPB = !!G.ellPB && C.prove.k === 'seg';
  const provingPBconv = C.prove.k === 'perp' && G.mids.length && G.cong.length;
  const provingAB = G.bis.some(b => b.ray) && C.prove.k === 'seg';
  const provingABconv = G.inside.length > 0 && C.prove.k === 'ang';
  const provingTwoThirds = G.medians.length === 2 && C.prove.k === 'seg';
  const provingMidseg = (C.prove.k === 'pareq' || C.prove.k === 'par') && !!G.mids.length;
  if (r === 'given') {
    if (S.k === 'seg') return G.cong.some(p => samePair(p, [S.a, S.b]));
    if (S.k === 'par') return G.par.some(p => samePair(p, [S.a, S.b]));
    return false;
  }
  if (r === 'given (inside the triangle)') return S.k === 'inside' && G.bis.some(b => b.p === S.p);
  if (r === 'reflexive property of congruence' || r === 'reflexive property') return S.k === 'seg' && sameSeg(S.a, S.b);
  if (r === 'definition of midpoint') {
    if (S.k !== 'seg' || sameSeg(S.a, S.b)) return false;
    const c = S.a.split('').find(x => S.b.includes(x));
    if (!c) return false;
    return isMidOf(G, c, S.a.replace(c, '') + S.b.replace(c, ''));
  }
  if (r === 'definition of perpendicular lines') {
    if (S.k === 'ang') return rightByGiven(C, S.a) && rightByGiven(C, S.b) && S.a[1] === S.b[1];
    if (S.k === 'rights') return rightByGiven(C, S.a) && rightByGiven(C, S.b);
    return false;
  }
  if (r === 'all right angles are congruent') return S.k === 'ang' && rightByGiven(C, S.a) && rightByGiven(C, S.b);
  if (r === 'definition of angle bisector') {
    if (S.k !== 'ang') return false;
    return G.bis.some(b => b.ray && S.a[1] === b.ray[0] && S.b[1] === b.ray[0] && [S.a, S.b].every(x => x.includes(b.ray[1])) && F && halvesOf(F, b, S.a, S.b));
  }
  if (r === 'vertical angles theorem') return S.k === 'ang' && !!F && vertical(F, S.a, S.b);
  if (r === 'alternate interior angles theorem') return S.k === 'ang' && !!F && altInterior(C, S.a, S.b, before);
  if (r === 'converse of the alternate interior angles theorem') {
    if (S.k !== 'par') return false;
    // a line above: two angles congruent that are alternate interior for these two lines
    return before.some(x => x.S.k === 'ang' && !!F && altInterior({ ...C, G: { ...G, par: [[S.a, S.b]] } }, x.S.a, x.S.b, []) && !G.par.some(p => samePair(p, [S.a, S.b])));
  }
  if (r === 'cpctc') return (S.k === 'seg' || S.k === 'ang') && cpctc(C, S, before);
  if (['sas', 'sss', 'asa', 'aas', 'hl', 'ssa'].includes(r)) return S.k === 'tri' && r !== 'ssa' && criteria(C, S.a, S.b, before).has(r.toUpperCase());
  if (r === 'transitive property') {
    if (S.k === 'pareq') { // both ∥ and = ½ of one segment
      const halves = before.filter(x => x.S.k === 'midseg');
      return halves.some(h1 => halves.some(h2 => h1 !== h2 && sameSeg(h1.S.b, h2.S.b) && ((sameSeg(h1.S.a, S.a) && sameSeg(h2.S.a, S.b)) || (sameSeg(h1.S.a, S.b) && sameSeg(h2.S.a, S.a)))));
    }
    if (S.k !== 'seg' || sameSeg(S.a, S.b)) return false;
    // a chain of two or more known equalities (givens, lines above, midpoint halves)
    const K = knowledge(C, before);
    for (const x of G.mids) K.u(x.m + x.s[0], x.m + x.s[1]);
    const direct = K.segEq.some(p => samePair(p, [S.a, S.b]));
    return !direct && K.same(S.a, S.b);
  }
  if (r === 'perpendicular bisector theorem') {
    if (S.k !== 'seg' || provingPB) return false;
    const c = S.a.split('').find(x => S.b.includes(x));
    if (!c) return false;
    const seg = S.a.replace(c, '') + S.b.replace(c, '');
    return Object.entries(G.lines).some(([l, s]) => sameSeg(s, seg) && ((G.onl[c] ?? []).includes(Number(l)) || before.some(x => x.S.k === 'onl' && x.S.p === c && x.S.l === l)));
  }
  if (r === 'converse of the perpendicular bisector theorem') {
    if (provingPBconv) return false;
    if (S.k !== 'onl') return false;
    const s = G.lines[S.l];
    if (!s) return false;
    const K = knowledge(C, before);
    return K.same(S.p + s[0], S.p + s[1]);
  }
  if (r === 'angle bisector theorem') {
    if (provingAB || S.k !== 'seg') return false;
    const c = S.a.split('').find(x => S.b.includes(x));
    if (!c || !G.perps.length) return false;
    // both are perpendiculars from the point to two sides of one bisected angle (the figure tells which sides)
    if (!G.perps.some(p => sameSeg(p, S.a)) || !G.perps.some(p => sameSeg(p, S.b))) return false;
    return G.bis.some(b => b.p === c && b.v.some(V => feetOnSidesOf(F, V, S.a.replace(c, ''), S.b.replace(c, ''))));
  }
  if (r === 'converse of the angle bisector theorem') {
    if (provingABconv || S.k !== 'onbis') return false;
    const inside = before.some(x => x.S.k === 'inside' && x.S.p === S.p && x.S.v === S.v);
    const K = knowledge(C, before);
    // equal distances to the two sides of that angle: two perpendicular feet on its sides, known equal
    const feet = G.perps.filter(p => p.includes(S.p)).map(p => p.replace(S.p, ''));
    let eq = false;
    for (const a of feet) for (const b of feet) if (a < b && feetOnSidesOf(F, S.v, a, b) && K.same(S.p + a, S.p + b)) eq = true;
    return inside && eq;
  }
  if (r === 'midsegment theorem') {
    if (S.k !== 'midseg' || provingMidseg) return false;
    return midsegOK(C, S.a, S.b);
  }
  if (r === 'two-thirds point of a median (proved)') {
    if (provingTwoThirds) return false;
    if (S.k !== 'twothirds') return false;
    return G.medians.some(md => sameSeg(md, S.b)) && S.a[0] === S.b[0];
  }
  if (r === 'only one point of a segment is two thirds of the way along it') {
    if (S.k !== 'same') return false;
    const tt = before.filter(x => x.S.k === 'twothirds');
    return tt.length >= 2 && tt.every(x => sameSeg(x.S.b, tt[0].S.b));
  }
  if (r === 'congruent angles in a linear pair are right angles') {
    if (S.k !== 'perp') return false;
    return before.some(x => x.S.k === 'ang' && x.S.a[1] === x.S.b[1] && S.a.includes(x.S.a[1]) && !!F && (() => { const g = angGeo(F, x.S.a), h = angGeo(F, x.S.b); return g && h && sameRay(g.d1, h.d1) && angDeg(g.d2, h.d2) > 179.2 || g && h && sameRay(g.d2, h.d2) && angDeg(g.d1, h.d1) > 179.2 || g && h && sameRay(g.d1, h.d2) && angDeg(g.d2, h.d1) > 179.2 || g && h && sameRay(g.d2, h.d1) && angDeg(g.d1, h.d2) > 179.2; })());
  }
  return false; // "two lines meet, so all three do" and the like
}
const sameRay = (a, b) => angDeg(a, b) < 0.8;
function halvesOf(F, b, x, y) {
  const V = F.pts[b.ray[0]], Rr = F.pts[b.ray[1]], s1 = F.pts[b.ang[0]], s2 = F.pts[b.ang[2]];
  if (!V || !Rr || !s1 || !s2) return true;
  const other = n => { const o = [n[0], n[2]].find(c => c !== b.ray[1]); return F.pts[o]; };
  const ox = other(x), oy = other(y);
  if (!ox || !oy) return false;
  const on1 = P => sameRay(sub(P, V), sub(s1, V)), on2 = P => sameRay(sub(P, V), sub(s2, V));
  return (on1(ox) && on2(oy)) || (on2(ox) && on1(oy));
}
/** two feet a, b lie on the two sides (lines) through vertex V of the triangle */
function feetOnSidesOf(F, V, a, b) {
  if (!F) return true;
  const Vp = F.pts[V], A = F.pts[a], B = F.pts[b];
  if (!Vp || !A || !B) return false;
  // the sides through V: drawn segments from V
  const dirs = F.segs.filter(s => near(s.a, Vp) || near(s.b, Vp)).map(s => (near(s.a, Vp) ? sub(s.b, s.a) : sub(s.a, s.b)));
  const onSide = P => dirs.some(d => onLine(P, Vp, add(Vp, d)) && dot(sub(P, Vp), d) > 0);
  return onSide(A) && onSide(B) && !parallel(sub(A, Vp), sub(B, Vp));
}
/** UV ∥ FG, UV = ½ FG: U and V midpoints of two segments from one point to F and G */
function midsegOK(C, ms, side) {
  const F = C.F;
  if (!F) return false;
  const P = n => F.pts[n];
  const isMid = (m, a, b) => { const M = P(m), A = P(a), B = P(b); return M && A && B && near(M, mid(A, B), 2); };
  const knownMid = (m, a, b) => isMidOf(C.G, m, a + b) || C.G.medians.some(md => md[1] === m) && isMid(m, a, b);
  for (const Vx of Object.keys(F.pts)) {
    if (side.includes(Vx)) continue;
    for (const [u, v] of [[ms[0], ms[1]], [ms[1], ms[0]]]) {
      if (isMid(u, Vx, side[0]) && isMid(v, Vx, side[1]) && knownMid(u, Vx, side[0]) && knownMid(v, Vx, side[1])) return true;
    }
  }
  return false;
}
/** the rows above row i, given a statement override */
function solveProofCell(q) {
  const C = proofCtx(q), pr = q.data.picture.proof, a = pr.ask?.[0];
  if (!a) return undefined;
  const before = C.rows.slice(0, a.i);
  if (a.cell === 'rs') {
    const st = C.rows[a.i].st;
    return choiceIdx(q, c => reasonValid(C, st, c, before));
  }
  const reason = (plain(q.prompt).match(/\(reason: (.*)\)\?$/) ?? [])[1] ?? C.rows[a.i].rs;
  if (!reason) return undefined;
  const ok = (q.choices ?? []).map(c => reasonValid(C, chText(c), reason, before));
  if (ok.filter(Boolean).length === 1) return ok.indexOf(true);
  // more than one statement follows by this reason: the one the lines below use
  const after = C.rows.slice(a.i + 1);
  const used = ok.map((v, i) => v && after.some((r, j) => {
    const without = C.rows.slice(0, a.i + 1 + j).map((x, k) => (k === a.i ? { ...x, st: chText(q.choices[i]), S: parseSt(q.choices[i]) } : x));
    const withOther = C.rows.slice(0, a.i + 1 + j).filter((_, k) => k !== a.i);
    return r.rs && reasonValid(C, r.st, r.rs, without) && !reasonValid(C, r.st, r.rs, withOther);
  }));
  return used.filter(Boolean).length === 1 ? used.indexOf(true) : -1;
}
function solveProofOrder(q) {
  const C = proofCtx(q);
  return choiceIdx(q, c => {
    const order = c.split(/,\s*/).map(x => x.charCodeAt(0) - 65);
    if (order.some(i => !C.rows[i])) return false;
    const seq = order.map(i => C.rows[i]);
    for (let k = 0; k < seq.length; k++) if (!seq[k].rs || !reasonValid(C, seq[k].S, seq[k].rs, seq.slice(0, k))) return false;
    return seq[seq.length - 1].st === C.proveText;
  });
}

// =====================================================================================================================
// concept questions
function solveConcept(q) {
  const p = plain(q.prompt);
  if (/What if [A-Z] is the midpoint [A-Z] itself\?/.test(p)) return choiceIdx(q, c => /by the definition of midpoint/.test(c));
  if (/What if [A-Z] lies on [A-Z]{2} itself\?/.test(p)) return choiceIdx(q, c => /^then [A-Z] is the midpoint [A-Z], which is on the bisector/.test(c));
  if (/But [A-Z] is not on the bisector of ∠[A-Z]{3}\. What does [A-Z] show\?/.test(p)) {
    // W is equidistant from the two LINES but outside the angle's interior: the converse needs the interior
    return choiceIdx(q, c => /needs the point to be in the interior/.test(c));
  }
  if (/^Theorem: if a point is on the perpendicular bisector/.test(p)) return choiceIdx(q, c => /^if a point is the same distance from .*, then it is on the perpendicular bisector; it needs its own proof$/.test(c));
  if (/^Theorem: if a point is on the bisector of ∠.*TRUE converse/.test(p)) return choiceIdx(q, c => /^if a point in the interior of ∠[A-Z]{3} is the same distance from its two sides, then it is on the bisector$/.test(c));
  if (/used coordinates instead/.test(p)) return choiceIdx(q, c => /^both proofs are valid/.test(c));
  if (/joined the midpoints of two sides, and measured/.test(p)) return choiceIdx(q, c => /^no: examples are not a proof/.test(c));
  if (/extended DE to F .* Midsegment Theorem is now proved/.test(p)) return choiceIdx(q, c => /^no: both conclusions/.test(c));
  if (/roughly halfway/.test(p)) return choiceIdx(q, c => /^no: the theorem needs exact midpoints/.test(c));
  if (/want a water tower exactly the same distance from all three town halls/.test(p)) return choiceIdx(q, c => /where the perpendicular bisectors of/.test(c));
  let m;
  if (/form a triangle with an obtuse angle at .*Where will it be\?/.test(p)) {
    const all = [...p.matchAll(/\(([A-Z])\)/g)].map(x => x[1]);
    const ob = (tex(q.board).match(/obtuse angle at ([A-Z])/) ?? [])[1];
    if (!ob || all.length < 3) return undefined;
    const opp = all.slice(0, 3).filter(c => c !== ob).join('');
    return choiceIdx(q, c => { const k = c.match(/^outside the triangle, beyond the side ([A-Z]{2})$/); return !!k && sameSeg(k[1], opp); });
  }
  if (/^Which center is/.test(p)) return solveCenterMatch(q);
  return undefined;
}
function solveCritique(q) {
  const L = q.data?.picture?.card?.lines ?? [];
  // the first bad step, read line by line
  for (let i = 0; i < L.length; i++) {
    const t = plain(L[i]);
    if (/divides every median 2 : 1/.test(t) && /two-thirds point/.test(plain(L.join(' ')))) return choiceIdx(q, c => c === `step ${i + 1}`); // circular
    if (/so P is the same distance from A on both sides/.test(t)) return choiceIdx(q, c => c === `step ${i + 1}`); // slanted distance, not perpendicular
    if (/Two lines always meet/.test(t)) return choiceIdx(q, c => c === `step ${i + 1}`); // two meet ≠ three meet
    if (/\(SSA\)/.test(t)) return choiceIdx(q, c => c === `step ${i + 1}`); // SSA proves nothing
    if (/is the midpoint of/.test(t) && !/\((marked|given)\)/.test(t)) return choiceIdx(q, c => c === `step ${i + 1}`); // unmarked midpoint
    if (/^\d+\. So in every triangle/.test(t)) return choiceIdx(q, c => c === `step ${i + 1}`); // examples → all triangles
  }
  return undefined;
}

// =====================================================================================================================
// dispatch
const FIXED = {
  thirdMedian: q => choiceIdx(q, c => /^through [A-Z], in every triangle$/.test(c)),
  medianLength: q => choiceIdx(q, c => /cannot be found/.test(c)),
};
function solveCircum(q) {
  const p = plain(q.prompt), F = readFig(q);
  if (/^Where is the circumcenter/.test(p)) return whereByAngles(q, 'circ');
  if (/^Where is the orthocenter/.test(p)) return whereByAngles(q, 'ortho');
  if (/Which center is [A-Z]\?/.test(p)) {
    const c0 = F && centerOfMarks(F);
    return c0 ? choiceIdx(q, c => c === 'the ' + c0) : undefined;
  }
  if (/meet at [A-Z]\. [A-Z] is the same distance from/.test(p)) {
    const c0 = F && centerOfMarks(F);
    const what = c0 === 'circumcenter' ? 'the three vertices' : c0 === 'incenter' ? 'the three sides' : null;
    return what ? choiceIdx(q, c => c === what) : undefined;
  }
  if (/is the centroid of this .* triangle\. Where does it lie\?/.test(p)) return choiceIdx(q, c => /^inside the triangle/.test(c));
  if (/is the centroid of △[A-Z]{3}\. Which lines must pass through/.test(p)) return choiceIdx(q, c => c === 'the three medians');
  return undefined;
}

function solve(q) {
  const f = q.family;
  if (FIXED[f]) return FIXED[f](q);
  if (f === 'midsegId') return solveMidsegId(q);
  if (f === 'segKind') return solveSegKind(q);
  if (f === 'medianWhich') return solveMedianWhich(q);
  if (f === 'altitudeCase') return solveAltitudeCase(q);
  if (f === 'bisectorMid') return solveBisectorMid(q);
  if (f === 'perpBisCheck') return solvePerpBisCheck(q);
  if (f === 'pbEquiWhich') return solvePbEquiWhich(q);
  if (f === 'abEquiWhich') return solveAbEquiWhich(q);
  if (f === 'midsegParallel') return solveMidsegParallel(q);
  if (f === 'enoughInfo') return solveEnoughInfo(q);
  if (f === 'circNext' || f === 'inNext') return solveNext(q);
  if (f === 'circRadius') return solveRadius(q, false);
  if (f === 'inRadiusCons') return solveRadius(q, true);
  if (f === 'critique') return solveCritique(q);
  if (f === 'pbProofOrder') return solveProofOrder(q);
  if (q.input === 'choice') {
    const pr = q.data?.picture?.proof;
    if (pr?.ask?.length) return solveProofCell(q);
    const c = solveCircum(q);
    if (c !== undefined) return c;
    return solveConcept(q);
  }
  return numSolve(q);
}

// =====================================================================================================================
// the item's world
function sane(q) {
  const p = plain(q.prompt);
  // a sentence that starts with a lone point letter before a noun: the article "A" relabelled as a vertex
  const art = p.match(/(?:^|[.?!]\s+)([B-Z]) (water tower|roof truss|brace|truss|tower)\b/);
  if (art) return `the article "A" was relabelled as a point letter: "${art[1]} ${art[2]}"`;
  // a statement question whose board shows a wrong choice as if it were the asked line
  const pr = q.data?.picture?.proof;
  if (pr?.ask?.[0]?.cell === 'st' && q.choices) {
    const bt = tex(q.board), ans = solve(q);
    const hit = q.choices.findIndex(c => chText(c).replace(/\s+/g, '') === bt.replace(/\s+/g, ''));
    if (hit >= 0 && hit !== ans) return `the board shows "${bt}" (the Prove), which is a wrong choice for line ${pr.ask[0].i + 1}`;
  }
  const fair = figureFair(q);
  if (fair) return fair;
  const b = tex(q.board);
  // three angles of one triangle on the board must make 180°
  const angs = [...b.matchAll(/m∠([A-Z]) = (\d+)°/g)].map(m => Number(m[2]));
  if (angs.length === 3 && angs.reduce((s, x) => s + x, 0) !== 180) return `the angles ${angs.join(', ')} do not make 180°`;
  if (q.input === 'num') {
    let v;
    LASTX = null;
    try { v = numSolve(q); } catch { v = undefined; }
    const x = LASTX;
    if (typeof v === 'number') {
      if (!(v > 0)) return `the answer is ${v}`;
      if (/m∠/.test(p) && v >= 180) return `an angle of ${v}°`;
    }
    // algebra: every expression must be a positive length / angle at the solution
    const G = givensOf(q.prompt);
    const exprs = [...Object.values(G.segs), ...Object.values(G.angs)].filter(e => /x/.test(e)).map(lin);
    if (exprs.length && x !== null) {
      if (!Number.isFinite(x)) return 'the equation has no single solution';
      for (const e of exprs) if (!(linVal(e, x) > 0)) return `an expression is ${linVal(e, x)} at x = ${x}`;
    }
    // Pythagoras needs the hypotenuse longer than the leg
    let k;
    if ((k = p.match(/The radius is ([\d.]+) \w+ and [A-Z]{2} = ([\d.]+)/)) && !(Number(k[2]) > Number(k[1]))) return 'the vertex is not farther than the radius';
    if ((k = p.match(/has radius [A-Z]{2} = ([\d.]+) \w+\. [A-Z]{2} ⊥ [A-Z]{2} and [A-Z]{2} = ([\d.]+)/)) && !(Number(k[1]) > Number(k[2]))) return 'the center is not inside the circle';
    // a nearest-tenth answer whose exact value is a .x5 tie
    if (/nearest tenth/.test(p)) {
      const raw = rawTenth(q);
      if (raw !== null && Math.abs(Math.abs(raw * 10 - Math.trunc(raw * 10)) - 0.5) < 1e-6) return `a .x5 tie when rounding ${raw}`;
    }
    // chains: the triangle must exist (angles positive)
    const m2 = p.match(/m∠[A-Z]{1,3} = (\d+)°(?:,| and) m∠[A-Z]{1,3} = (\d+)°/);
    if (m2 && Number(m2[1]) + Number(m2[2]) >= 180) return 'two angles of the triangle already make 180°';
  }
  return '';
}
/** the drawing must show what it labels: lengths to one scale, angles at their measure, boxes at 90°, ticks equal */
function figureFair(q) {
  const F = readFig(q);
  if (!F) return '';
  const ratios = [];
  for (const sg of F.segs) {
    const t = String(sg.text ?? '');
    const m = t.match(/^([\d.]+) ?(cm|m|ft|in|mi)$/);
    if (m) ratios.push([dist(sg.a, sg.b) / Number(m[1]), t]);
  }
  for (const [r, t] of ratios) if (Math.abs(r / ratios[0][0] - 1) > 0.03) return `the length ${t} is not drawn to the same scale as ${ratios[0][1]}`;
  for (const a of F.angs) {
    const m = String(a.text ?? '').match(/^(\d+)°$/);
    if (m && Math.abs(angDeg(a.d1, a.d2) - Number(m[1])) > 1.5) return `the angle labelled ${m[1]}° is drawn at ${angDeg(a.d1, a.d2).toFixed(1)}°`;
    if (a.box && Math.abs(angDeg(a.d1, a.d2) - 90) > 1.5) return `a right-angle box drawn on a ${angDeg(a.d1, a.d2).toFixed(1)}° angle`;
  }
  const groups = {};
  for (const t of F.ticks) (groups[t.ticks] ??= []).push(dist(t.a, t.b));
  for (const [k, L] of Object.entries(groups)) if (Math.max(...L) / Math.min(...L) > 1.03) return `the segments with ${k} tick(s) are drawn at different lengths`;
  return '';
}
function rawTenth(q) {
  const p = plain(q.prompt);
  let m;
  if ((m = p.match(/The radius is ([\d.]+) \w+ and [A-Z]{2} = ([\d.]+)/))) return Math.sqrt(m[2] ** 2 - m[1] ** 2);
  if ((m = p.match(/has radius [A-Z]{2} = ([\d.]+) \w+\. [A-Z]{2} ⊥ ([A-Z]{2}) and [A-Z]{2} = ([\d.]+)/))) {
    const half = Math.sqrt(m[1] ** 2 - m[3] ** 2), ask = askedSeg(p);
    return skey(ask) === skey(m[2]) ? 2 * half : half;
  }
  return null;
}

export default { solve, sane };
