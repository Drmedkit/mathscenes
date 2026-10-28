// Oracle for the lesson "similarity" (Geometry: similar triangles; AA, SAS~, SSS~; correspondence; proportions;
// side-splitter; geometric means; proofs; indirect measurement). Written from what the student sees only: the prompt,
// the board, the choices, the drawn figure (named points, segments with their length labels and parallel chevrons,
// angle arcs, right-angle boxes, angle labels), the fact cards, the gallery and the proof frames.
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
//
// How it decides:
// - Lengths: a small solver over the labelled and stated lengths, the collinear sums the figure shows (a point on a
//   segment splits it), and the similarities in play (stated, or nested / hourglass from a parallel); unknowns in x
//   are carried as linear expressions and solved from the proportion (a quadratic at most), keeping positive lengths.
// - Criteria from facts: for every correspondence the angle pairs that are equal (measures, ≅, right angles, the
//   third angle) and the side ratios that are known; AA / SAS~ / SSS~ (and a right triangle's third side) establish
//   similarity, a contradiction in every correspondence disproves it, anything else is "not enough".
// - Correspondence: from the statement's order, from matching arc marks, from right-angle / shared-angle geometry on
//   the drawn points, or (hourglass) from the parallel: the vertices on one line through the crossing point pair up.
// - Proportions "that follow from a statement": each ratio pairs corresponding sides (or two sides of one triangle
//   with their partners). Side-splitter forms are tested on a symbolic nested figure (AT = u, AM = ku, TM = (k−1)u...).
// - Proof lines: a line is justified by its reason from the givens and the lines above it (geometry of the angles for
//   vertical / alternate interior / corresponding / reflexive / right angles; ratios of corresponding sides for SAS~ and
//   SSS~; a similarity line above for "corresponding sides are proportional").

import { Q, texPlain } from '../../tools/quality/oracle-kit.mjs';

// =====================================================================================================================
// text
const plain = s => String(s ?? '').replace(/̅/g, '').replace(/−/g, '-').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const sortedSeg = n => n.split('').sort().join('');
const idxWhere = (q, pred) => { const h = (q.choices ?? []).map((c, i) => (pred(plain(c), i) ? i : -1)).filter(i => i >= 0); return h.length === 1 ? h[0] : -1; };
const allWhere = (q, pred) => (q.choices ?? []).map((c, i) => (pred(plain(c), i) ? i : -1)).filter(i => i >= 0);
const num = s => Number(String(s).replace(/,/g, ''));
const close = (a, b, e = 1e-9) => Math.abs(a - b) <= e * Math.max(1, Math.abs(a), Math.abs(b));
/** "3/4", "2", "1 1/2" → number */
const fracVal = s => { const t = String(s).trim(); const m = t.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/); return m ? num(m[1]) / num(m[2]) : num(t); };
/** the value of a choice like "3", "4.5", "2√5", "√15" */
function radVal(s) {
  const t = plain(s);
  let m = t.match(/^(\d+(?:\.\d+)?)?√(\d+(?:\.\d+)?)$/);
  if (m) return (m[1] ? num(m[1]) : 1) * Math.sqrt(num(m[2]));
  m = t.match(/^\d+(?:\.\d+)?$/);
  return m ? num(t) : NaN;
}
const stmtOf = t => { const m = plain(t).match(/△([A-Z]{3}) ~ △([A-Z]{3})/); return m ? [m[1], m[2]] : null; };
const sideN = (T, i) => T.split('').filter((_, j) => j !== i).join('');
const corrMap = (A, B) => Object.fromEntries(A.split('').map((c, i) => [c, B[i]]));
const PERMS = ['012', '021', '102', '120', '201', '210'];
const permute = (T, p) => p.split('').map(i => T[Number(i)]).join('');

// =====================================================================================================================
// vectors
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = a => Math.hypot(a[0], a[1]);
const unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const near = (a, b, e = 0.05) => !!a && !!b && Math.abs(a[0] - b[0]) < e && Math.abs(a[1] - b[1]) < e;
const angDeg = (d1, d2) => (Math.acos(Math.max(-1, Math.min(1, dot(unit(d1), unit(d2))))) * 180) / Math.PI;
const sameDir = (d1, d2, tol = 0.3) => angDeg(d1, d2) < tol;
const oppDir = (d1, d2, tol = 0.3) => angDeg(d1, d2) > 180 - tol;
const dist = (a, b) => len(sub(a, b));
/** M strictly between A and B on segment AB */
const between = (A, M, B) => { const ab = sub(B, A), am = sub(M, A), L = len(ab); if (L < 1e-9) return false; const t = dot(am, ab) / (L * L); return t > 1e-6 && t < 1 - 1e-6 && Math.abs(cross(ab, am)) / L < 0.05 * Math.max(1, L / 100); };
const collinear = (A, B, C) => Math.abs(cross(sub(B, A), sub(C, A))) / Math.max(1, len(sub(B, A)), len(sub(C, A))) < 0.02;

// =====================================================================================================================
// the figure
function readFig(f) {
  if (!f) return null;
  const F = { P: {}, segs: [], angs: [], words: (f.words ?? []).map(w => w.text) };
  for (const p of f.points ?? []) if (p.name) F.P[p.name] = p.at;
  const nameAt = at => { for (const [n, p] of Object.entries(F.P)) if (near(p, at)) return n; return null; };
  F.nameAt = nameAt;
  for (const s of f.segs ?? []) F.segs.push({ ...s, pa: nameAt(s.a), pb: nameAt(s.b) });
  for (const a of f.angles ?? []) F.angs.push({ ...a, V: nameAt(a.v), pn: nameAt(a.p), qn: nameAt(a.q), d1: unit(sub(a.p, a.v)), d2: unit(sub(a.q, a.v)) });
  return F;
}
const figOf = q => readFig(q.data?.picture?.fig);
const segBy = (F, n) => F.segs.find(s => s.pa && s.pb && sortedSeg(s.pa + s.pb) === sortedSeg(n));
const glen = (F, n) => dist(F.P[n[0]], F.P[n[1]]);
/** the drawn angle at vertex V of triangle T (rays toward the other two vertices) */
function triAngle(F, T, V) {
  const o = T.split('').filter(c => c !== V);
  const v = F.P[V], d1 = unit(sub(F.P[o[0]], v)), d2 = unit(sub(F.P[o[1]], v));
  return F.angs.find(a => a.V === V && ((sameDir(a.d1, d1) && sameDir(a.d2, d2)) || (sameDir(a.d1, d2) && sameDir(a.d2, d1))));
}
const geoAngle = (F, T, V) => { const o = T.split('').filter(c => c !== V); return angDeg(sub(F.P[o[0]], F.P[V]), sub(F.P[o[1]], F.P[V])); };
const angLabel = a => (a && a.text && /^\d+(\.\d+)?°?$/.test(a.text) ? num(a.text.replace('°', '')) : NaN);
/** drawn angles match vertex by vertex */
const geoSimilar = (F, T1, T2, tol = 0.5) => [0, 1, 2].every(i => Math.abs(geoAngle(F, T1, T1[i]) - geoAngle(F, T2, T2[i])) < tol);
/** the segments marked parallel, by group */
function parSegs(F, prompt) {
  const out = [];
  const groups = {};
  for (const s of F.segs) if (s.par > 0 && s.pa && s.pb) (groups[s.par] ??= []).push(s.pa + s.pb);
  for (const g of Object.values(groups)) if (g.length >= 2) out.push(g.slice(0, 2));
  for (const m of plain(prompt).matchAll(/([A-Z]{2}) ∥ ([A-Z]{2})/g)) if (!out.some(([a, b]) => [sortedSeg(a), sortedSeg(b)].sort().join() === [sortedSeg(m[1]), sortedSeg(m[2])].sort().join())) out.push([m[1], m[2]]);
  return out;
}

// =====================================================================================================================
// linear expressions in x: [a, b] = a·x + b
const L = (a, b) => [a, b];
const isC = e => Math.abs(e[0]) < 1e-12;
const ladd = (p, r) => [p[0] + r[0], p[1] + r[1]];
const lsub = (p, r) => [p[0] - r[0], p[1] - r[1]];
const lscale = (p, k) => [p[0] * k, p[1] * k];
function parseLin(t) {
  const s = plain(t).replace(/\s*(ft|in|cm|m|yd|mi)$/, '').replace(/\s+/g, '');
  let m = s.match(/^(\d+(?:\.\d+)?)$/);
  if (m) return L(0, num(m[1]));
  m = s.match(/^(\d*(?:\.\d+)?)x(?:([+-])(\d+(?:\.\d+)?))?$/);
  if (m) return L(m[1] === '' ? 1 : num(m[1]), m[2] ? (m[2] === '-' ? -1 : 1) * num(m[3]) : 0);
  m = s.match(/^(\d+(?:\.\d+)?)\+(\d*(?:\.\d+)?)x$/);
  if (m) return L(m[2] === '' ? 1 : num(m[2]), num(m[1]));
  return null;
}

/** a length solver: values, collinear sums, similarities */
class Lens {
  constructor() { this.v = new Map(); this.sums = []; this.sims = []; this.x = undefined; this.amb = false; }
  k(s) { return sortedSeg(s); }
  get(s) { return this.v.get(this.k(s)); }
  has(s) { return this.v.has(this.k(s)); }
  set(s, e) { const k = this.k(s); if (this.v.has(k)) return false; this.v.set(k, e); return true; }
  val(s) { const e = this.get(s); return e && isC(e) ? e[1] : undefined; }
  addFig(F, sums = true) {
    for (const s of F.segs) if (s.pa && s.pb && s.text && !s.dash) { const e = parseLin(s.text); if (e) this.set(s.pa + s.pb, e); }
    if (sums) {
      const N = Object.keys(F.P);
      for (const a of N) for (const b of N) for (const m of N) if (a < b && m !== a && m !== b && between(F.P[a], F.P[m], F.P[b])) this.sums.push([a + b, a + m, m + b]);
    }
    return this;
  }
  addText(t) { for (const m of plain(t).matchAll(/\b([A-Z]{2}) = (\d+(?:\.\d+)?)\b(?! ?°)/g)) this.set(m[1], L(0, num(m[2]))); return this; }
  substitute(x) {
    this.x = x;
    for (const [k, e] of this.v) this.v.set(k, L(0, e[0] * x + e[1]));
  }
  /** solve A x² + B x + C = 0 keeping the root that leaves every length positive */
  solveQ(A, B, C) {
    let roots;
    if (Math.abs(A) < 1e-12) roots = Math.abs(B) < 1e-12 ? [] : [-C / B];
    else { const D = B * B - 4 * A * C; if (D < -1e-9) return false; const r = Math.sqrt(Math.max(0, D)); roots = [(-B + r) / (2 * A), (-B - r) / (2 * A)]; }
    const ok = [...new Set(roots.map(r => Math.round(r * 1e9) / 1e9))].filter(x => [...this.v.values()].every(e => e[0] * x + e[1] > 1e-9));
    if (ok.length !== 1) { if (ok.length > 1) this.amb = true; return false; }
    this.substitute(ok[0]);
    return true;
  }
  run() {
    for (let it = 0; it < 40; it++) {
      let ch = false;
      for (const [w, p, r] of this.sums) {
        const W = this.get(w), A = this.get(p), B = this.get(r);
        if (W && A && !B) ch = this.set(r, lsub(W, A)) || ch;
        else if (W && B && !A) ch = this.set(p, lsub(W, B)) || ch;
        else if (A && B && !W) ch = this.set(w, ladd(A, B)) || ch;
      }
      for (const [T1, T2] of this.sims) {
        const s1 = [0, 1, 2].map(i => this.get(sideN(T1, i))), s2 = [0, 1, 2].map(i => this.get(sideN(T2, i)));
        let k;
        for (let i = 0; i < 3; i++) if (s1[i] && s2[i] && isC(s1[i]) && isC(s2[i]) && s1[i][1] > 0) { k = s2[i][1] / s1[i][1]; break; }
        if (k !== undefined) {
          for (let i = 0; i < 3; i++) {
            if (s1[i] && !s2[i]) ch = this.set(sideN(T2, i), lscale(s1[i], k)) || ch;
            else if (s2[i] && !s1[i]) ch = this.set(sideN(T1, i), lscale(s2[i], 1 / k)) || ch;
            else if (s1[i] && s2[i] && (!isC(s1[i]) || !isC(s2[i]))) { const e = lsub(s2[i], lscale(s1[i], k)); if (this.solveQ(0, e[0], e[1])) ch = true; }
          }
        } else if (this.x === undefined) {
          // two pairs known with x: s2_i s1_j = s2_j s1_i
          for (let i = 0; i < 3 && !ch; i++) for (let j = i + 1; j < 3 && !ch; j++) {
            if (!(s1[i] && s2[i] && s1[j] && s2[j])) continue;
            const pr = (u, v) => [u[0] * v[0], u[0] * v[1] + u[1] * v[0], u[1] * v[1]];
            const a = pr(s2[i], s1[j]), b = pr(s2[j], s1[i]);
            if (this.solveQ(a[0] - b[0], a[1] - b[1], a[2] - b[2])) ch = true;
          }
        }
      }
      if (!ch) break;
    }
    return this;
  }
}

/** the nested / hourglass similarity a pair of parallel segments makes: [△(apex, small ends), △(apex, big ends)] */
function parallelSim(F, s, S) {
  for (const A of Object.keys(F.P)) {
    if (s.includes(A) || S.includes(A)) continue;
    for (const [x, y] of [[s[0], s[1]], [s[1], s[0]]]) {
      if (collinear(F.P[A], F.P[x], F.P[S[0]]) && collinear(F.P[A], F.P[y], F.P[S[1]])) return [A + x + y, A + S[0] + S[1]];
    }
  }
  return null;
}
function parallelSims(F, prompt) {
  const out = [];
  for (const [a, b] of parSegs(F, prompt)) { const r = parallelSim(F, a, b); if (r) out.push(r); }
  return out;
}

// =====================================================================================================================
// proportions
/** the roles of a segment name in T1 / T2: [t, i] = side opposite vertex i of triangle t */
function roles(T1, T2, seg) {
  const r = [];
  [T1, T2].forEach((T, t) => { for (let i = 0; i < 3; i++) if (sortedSeg(sideN(T, i)) === sortedSeg(seg)) r.push([t, i]); });
  return r;
}
/** does P/Q = R/S follow from T1 ~ T2 (corresponding sides)? */
function propFollows(T1, T2, P, Qs, R, S) {
  for (const p of roles(T1, T2, P)) for (const q of roles(T1, T2, Qs)) for (const r of roles(T1, T2, R)) for (const s of roles(T1, T2, S)) {
    if (p[0] === r[0] && q[0] === s[0] && p[0] !== q[0] && p[1] === q[1] && r[1] === s[1] && p[1] !== r[1]) return true;
    if (p[0] === q[0] && r[0] === s[0] && p[0] !== r[0] && p[1] === r[1] && q[1] === s[1] && p[1] !== q[1]) return true;
  }
  return false;
}
const propParts = c => { const m = plain(c).match(/^([A-Z]{2})\/([A-Z]{2}) = ([A-Z]{2})\/([A-Z]{2})$/); return m ? m.slice(1, 5) : null; };
/** symbolic nested figure: apex A, T on AM, Z on AR, TZ ∥ MR → monomials over u, v, w, k, k1 = k − 1 */
function nestedMono(T1, T2) {
  const [A, t, z] = T1, [, M, R] = T2;
  const mono = {};
  const put = (a, b, m) => { mono[sortedSeg(a + b)] = m; };
  put(A, t, { u: 1 }); put(A, M, { u: 1, k: 1 }); put(t, M, { u: 1, k1: 1 });
  put(A, z, { v: 1 }); put(A, R, { v: 1, k: 1 }); put(z, R, { v: 1, k1: 1 });
  put(t, z, { w: 1 }); put(M, R, { w: 1, k: 1 });
  return s => mono[sortedSeg(s)];
}
function monoEq(P, Qs, R, S, mono) {
  const a = [mono(P), mono(S)], b = [mono(Qs), mono(R)];
  if (a.some(x => !x) || b.some(x => !x)) return null;
  const sum = l => { const o = {}; for (const m of l) for (const [k, e] of Object.entries(m)) o[k] = (o[k] ?? 0) + e; return o; };
  const x = sum(a), y = sum(b), keys = new Set([...Object.keys(x), ...Object.keys(y)]);
  return [...keys].every(k => (x[k] ?? 0) === (y[k] ?? 0));
}

// =====================================================================================================================
// facts → established / not enough / disproved (evidence, classify5, critName)
function parseFacts(text) {
  let t = plain(text).replace(/Nothing else is known\.?/g, '');
  const F = { tris: [], meas: {}, len: {}, eq: [], right: new Set(), sides: {} };
  for (const m of t.matchAll(/△([A-Z]{3})/g)) if (!F.tris.includes(m[1])) F.tris.push(m[1]);
  // "△FJQ: sides 4, 6, 8"
  t = t.replace(/△([A-Z]{3}): sides (\d+(?:\.\d+)?), (\d+(?:\.\d+)?), (\d+(?:\.\d+)?)/g, (_, T, a, b, c) => { F.sides[T] = [num(a), num(b), num(c)]; return ' '; });
  t = t.replace(/∠([A-Z]) and ∠([A-Z]) are right angles/g, (_, a, b) => { F.right.add(a); F.right.add(b); F.eq.push([a, b]); return ' '; });
  t = t.replace(/m∠([A-Z]) = m∠([A-Z]) = (\d+(?:\.\d+)?)°/g, (_, a, b, v) => { F.meas[a] = num(v); F.meas[b] = num(v); F.eq.push([a, b]); return ' '; });
  t = t.replace(/m∠([A-Z]) = (\d+(?:\.\d+)?)°/g, (_, a, v) => { F.meas[a] = num(v); return ' '; });
  t = t.replace(/∠([A-Z]) ≅ ∠([A-Z])/g, (_, a, b) => { F.eq.push([a, b]); return ' '; });
  t = t.replace(/\b([A-Z]{2}) = ([A-Z]{2}) = (\d+(?:\.\d+)?)/g, (_, a, b, v) => { F.len[sortedSeg(a)] = num(v); F.len[sortedSeg(b)] = num(v); F.eq.push([a, b]); return ' '; });
  t = t.replace(/\b([A-Z]{2}) = (\d+(?:\.\d+)?)/g, (_, a, v) => { F.len[sortedSeg(a)] = num(v); return ' '; });
  return F;
}
/** the two triangles (letters) of a fact set: named, or read off the equalities (left side first triangle, in order) */
function factTris(F, given) {
  if (given) return given;
  if (F.tris.length >= 2) return F.tris.slice(0, 2);
  const T = ['', ''];
  const put = (a, b) => { for (let i = 0; i < a.length; i++) if (!T[0].includes(a[i]) && !T[1].includes(b[i])) { T[0] += a[i]; T[1] += b[i]; } };
  for (const [a, b] of F.eq) put(a, b);
  const pad = (s, fill) => (s + fill).slice(0, 3);
  return [pad(T[0], '123'), pad(T[1], '456')];
}
/** judge two triangles from facts: for every correspondence, equal angles, known ratios, contradictions */
function judgeFacts(F, T1, T2, onlyIdentity = false) {
  // measures per letter, with angle equalities, right angles, third angles
  const meas = { ...F.meas };
  for (const r of F.right) meas[r] = 90;
  const angEq = F.eq.filter(([a, b]) => a.length === 1);
  const lens = { ...F.len };
  // unnamed side lists: put them on the sides in sorted order (any order is tried by the correspondences)
  for (const [T, arr] of Object.entries(F.sides)) arr.forEach((v, i) => { lens[sortedSeg(sideN(T, i))] = v; });
  for (let it = 0; it < 6; it++) {
    for (const [a, b] of angEq) { if (meas[a] !== undefined && meas[b] === undefined) meas[b] = meas[a]; if (meas[b] !== undefined && meas[a] === undefined) meas[a] = meas[b]; }
    for (const T of [T1, T2]) {
      const k = T.split('').filter(c => meas[c] !== undefined);
      if (k.length === 2) { const u = T.split('').find(c => meas[c] === undefined); meas[u] = 180 - meas[k[0]] - meas[k[1]]; }
    }
  }
  // a right triangle with two known sides: the third side (Pythagoras)
  for (const T of [T1, T2]) for (let r = 0; r < 3; r++) {
    if (meas[T[r]] !== 90) continue;
    const hyp = sortedSeg(sideN(T, r)), legs = [0, 1, 2].filter(i => i !== r).map(i => sortedSeg(sideN(T, i)));
    const h = lens[hyp], a = lens[legs[0]], b = lens[legs[1]];
    if (h !== undefined && a !== undefined && b === undefined && h > a) lens[legs[1]] = Math.sqrt(h * h - a * a);
    if (h !== undefined && b !== undefined && a === undefined && h > b) lens[legs[0]] = Math.sqrt(h * h - b * b);
    if (a !== undefined && b !== undefined && h === undefined) lens[hyp] = Math.hypot(a, b);
  }
  // symbolic angle classes (≅ without measures)
  const cls = {}; const find = x => (cls[x] === undefined || cls[x] === x ? x : (cls[x] = find(cls[x])));
  for (const [a, b] of angEq) { const x = find(a), y = find(b); if (x !== y) cls[x] = y; }
  const out = [];
  for (const p of onlyIdentity ? ['012'] : PERMS) {
    const U = permute(T2, p);
    const eqA = [], ratio = [];
    let contra = false;
    const comb = [];
    for (let i = 0; i < 3; i++) {
      const a = meas[T1[i]], b = meas[U[i]];
      if (a !== undefined && b !== undefined) { eqA.push(Math.abs(a - b) < 1e-9); if (Math.abs(a - b) >= 1e-9) contra = true; }
      else eqA.push(find(T1[i]) === find(U[i]));
      comb.push(a ?? b);
      const s1 = lens[sortedSeg(sideN(T1, i))], s2 = lens[sortedSeg(sideN(U, i))];
      ratio.push(s1 !== undefined && s2 !== undefined ? s2 / s1 : undefined);
    }
    // the classes of a two-angle match fix the third
    if (eqA.filter(Boolean).length === 2) for (let i = 0; i < 3; i++) eqA[i] = true;
    const known = comb.filter(v => v !== undefined);
    if (known.length === 3 && Math.abs(known[0] + known[1] + known[2] - 180) > 1e-6) contra = true;
    if (known.length < 3 && known.reduce((s, v) => s + v, 0) >= 180 - 1e-9) contra = true;
    const rs = ratio.filter(v => v !== undefined);
    if (rs.some(r => !close(r, rs[0]))) contra = true;
    const crit = new Set();
    if (!contra) {
      if (eqA.filter(Boolean).length >= 2) crit.add('AA');
      if (rs.length === 3) crit.add('SSS~');
      for (let i = 0; i < 3; i++) if (eqA[i] && [0, 1, 2].filter(j => j !== i).every(j => ratio[j] !== undefined)) crit.add('SAS~');
      // two sides and an angle not between them fix the triangle when the angle is right or obtuse, or lies
      // opposite the longer of the two sides (no second triangle swings in)
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        if (j === i || !eqA[i] || ratio[i] === undefined || ratio[j] === undefined) continue;
        const opp = lens[sortedSeg(sideN(T1, i))], adj = lens[sortedSeg(sideN(T1, j))], m = comb[i];
        if ((m !== undefined && m >= 90) || opp >= adj) crit.add('SSA');
      }
    }
    out.push({ p, U, contra, crit, k: rs.length ? rs[0] : undefined });
  }
  const sims = out.filter(o => o.crit.size);
  if (sims.length) {
    const ks = sims.map(o => o.k);
    const kn = sims.map(o => o.k).filter(v => v !== undefined);
    const k = !kn.length ? null : kn.every(v => close(v, kn[0])) ? kn[0] : 'mixed';
    return { status: 'similar', k, sims, all: out };
  }
  if (out.every(o => o.contra)) return { status: 'not', all: out };
  return { status: 'notenough', all: out };
}

// =====================================================================================================================
// angles named in text, as geometry
/** ∠ABC → { v, d1, d2 } on the figure; ∠B with a triangle context */
function angGeo(F, name, tris = []) {
  const n = name.replace('∠', '');
  if (n.length === 3) { const [p, v, r] = n; if (!F.P[p] || !F.P[v] || !F.P[r]) return null; return { V: v, v: F.P[v], d1: unit(sub(F.P[p], F.P[v])), d2: unit(sub(F.P[r], F.P[v])) }; }
  const T = tris.find(t => t.includes(n));
  if (!T || !F.P[n]) return null;
  const o = T.split('').filter(c => c !== n);
  return { V: n, v: F.P[n], d1: unit(sub(F.P[o[0]], F.P[n])), d2: unit(sub(F.P[o[1]], F.P[n])) };
}
const sameAng = (a, b) => !!a && !!b && near(a.v, b.v) && ((sameDir(a.d1, b.d1) && sameDir(a.d2, b.d2)) || (sameDir(a.d1, b.d2) && sameDir(a.d2, b.d1)));
const vertAng = (a, b) => !!a && !!b && near(a.v, b.v) && ((oppDir(a.d1, b.d1) && oppDir(a.d2, b.d2)) || (oppDir(a.d1, b.d2) && oppDir(a.d2, b.d1)));
const measOf = a => angDeg(a.d1, a.d2);
/** a box on this angle, or an angle stated right / formed by perpendicular lines */
function isRightAng(F, a, prompt = '') {
  if (!a) return false;
  for (const b of F.angs) if (b.box && sameAng({ v: b.v, d1: b.d1, d2: b.d2 }, a)) return Math.abs(measOf(a) - 90) < 0.5;
  const t = plain(prompt);
  for (const m of t.matchAll(/∠([A-Z]{3}) is a right angle/g)) if (sameAng(angGeo(F, m[1]), a)) return true;
  for (const m of t.matchAll(/([A-Z]{2}) ⊥ ([A-Z]{2})/g)) {
    const l1 = unit(sub(F.P[m[1][1]], F.P[m[1][0]])), l2 = unit(sub(F.P[m[2][1]], F.P[m[2][0]]));
    const along = (d, l) => sameDir(d, l) || oppDir(d, l);
    if (((along(a.d1, l1) && along(a.d2, l2)) || (along(a.d1, l2) && along(a.d2, l1))) && Math.abs(measOf(a) - 90) < 0.5) return true;
  }
  return false;
}
/** corresponding (same side, transversal rays the same way) or alternate interior angles between parallel lines */
function transversalKind(F, a, b, pars) {
  if (near(a.v, b.v)) return null;
  const t = unit(sub(b.v, a.v));
  const along = d => sameDir(d, t) ? 1 : oppDir(d, t) ? -1 : 0;
  for (const [ta, oa] of [[a.d1, a.d2], [a.d2, a.d1]]) for (const [tb, ob] of [[b.d1, b.d2], [b.d2, b.d1]]) {
    const sa = along(ta), sb = along(tb);
    if (!sa || !sb) continue;
    // the other rays lie on two lines given parallel
    const onPar = pars.some(([s1, s2]) => {
      const line = (V, d, s) => { const sd = unit(sub(F.P[s[1]], F.P[s[0]])); return (sameDir(d, sd) || oppDir(d, sd)) && collinear(V, F.P[s[0]], F.P[s[1]]); };
      return (line(a.v, oa, s1) && line(b.v, ob, s2)) || (line(a.v, oa, s2) && line(b.v, ob, s1));
    });
    if (!onPar) continue;
    if (sa === sb && dot(oa, ob) > 0) return 'Corresponding Angles Theorem';
    if (sa === 1 && sb === -1 && dot(oa, ob) < 0) return 'Alternate Interior Angles Theorem';
  }
  return null;
}
/** the reason that makes angle a ≅ angle b */
function angReason(F, a, b, prompt, pars) {
  if (!a || !b) return null;
  if (sameAng(a, b)) return 'Reflexive Property of Congruence';
  if (vertAng(a, b)) return 'Vertical Angles Theorem';
  if (isRightAng(F, a, prompt) && isRightAng(F, b, prompt)) return 'All right angles are congruent';
  return transversalKind(F, a, b, pars);
}

// =====================================================================================================================
// proofs
const texSt = t => plain(texPlain(String(t ?? '').replace(/\\overline\{([A-Z]+)\}/g, '$1').replace(/\\triangle\s*/g, '△').replace(/\\angle\s*/g, '∠')
  .replace(/\\sim(?![a-z])/g, '∼').replace(/\\cong(?![a-z])/g, '≅').replace(/\\parallel(?![a-z])/g, '∥').replace(/\\perp(?![a-z])/g, '⊥'))).replace(/∼/g, '~');
function stParse(st) {
  const s = plain(st).replace(/\\sim/g, '~').replace(/\\cong/g, '≅').replace(/\\parallel/g, '∥').replace(/\\perp/g, '⊥');
  let m;
  if ((m = s.match(/^△\s*([A-Z]{3}) ~ △\s*([A-Z]{3})$/))) return { k: 'sim', a: m[1], b: m[2] };
  if ((m = s.match(/^△\s*([A-Z]{3}) ≅ △\s*([A-Z]{3})$/))) return { k: 'tcong', a: m[1], b: m[2] };
  if ((m = s.match(/^∠\s*([A-Z]{1,3}) ≅ ∠\s*([A-Z]{1,3})$/))) return { k: 'ang', a: m[1], b: m[2] };
  if ((m = s.match(/^([A-Z]{2}) ≅ ([A-Z]{2})$/))) return { k: 'seg', a: m[1], b: m[2] };
  const fr = [...s.matchAll(/([A-Z]{2})\/([A-Z]{2})/g)].map(x => [x[1], x[2]]);
  if (fr.length >= 2 && /^[A-Z/ =]+(= [\d/ ]+)?$/.test(s.replace(/\(|\)/g, ''))) { const v = s.match(/= ([\d.]+(?:\/[\d.]+)?)$/); return { k: 'ratio', fr, v: v ? fracVal(v[1]) : undefined }; }
  if ((m = s.match(/^([A-Z]{2}) = (\d+(?:\.\d+)?)(?:, ([A-Z]{2}) = (\d+(?:\.\d+)?))?$/))) return { k: 'lens', l: [[m[1], num(m[2])], ...(m[3] ? [[m[3], num(m[4])]] : [])] };
  return { k: 'other', s };
}
const rowSt = r => texSt(String(r.st).replace(/\\overline\{([A-Z]+)\}/g, '$1'));
function proofOf(q) {
  const pr = q.data?.picture?.proof;
  if (!pr) return null;
  const givens = (pr.given ?? []).map(g => texSt(String(g).replace(/\\overline\{([A-Z]+)\}/g, '$1')));
  return { givens, prove: texSt(String(pr.prove ?? '').replace(/\\overline\{([A-Z]+)\}/g, '$1')), rows: pr.rows.map(r => ({ st: rowSt(r), rs: plain(r.rs) })), ask: pr.ask ?? [], strike: pr.strike ?? [] };
}
const givenPars = pf => pf.givens.flatMap(g => [...plain(g).matchAll(/([A-Z]{2}) ∥ ([A-Z]{2})/g)].map(m => [m[1], m[2]]));
const givenText = pf => pf.givens.join('. ');

/** which index pairs of T1 ~ T2 an angle line ∠X ≅ ∠Y covers */
function angRowIdx(F, T1, T2, S) {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const g1 = angGeo(F, '∠' + T1[i], [T1]), g2 = angGeo(F, '∠' + T2[i], [T2]);
    const x = angGeo(F, S.a, [T1, T2]), y = angGeo(F, S.b, [T2, T1]);
    if ((sameAng(x, g1) && sameAng(y, g2)) || (sameAng(x, g2) && sameAng(y, g1))) out.push(i);
  }
  return out;
}
/** a ratio line's fractions that pair corresponding sides of T1 ~ T2: the side indices */
function ratioIdx(T1, T2, fr) {
  const idx = [];
  for (const [a, b] of fr) {
    const r = [...roles(T1, T2, a)].flatMap(ra => roles(T1, T2, b).filter(rb => rb[0] !== ra[0] && rb[1] === ra[1]).map(() => ra[1]));
    if (!r.length) return null;
    idx.push(r[0]);
  }
  return idx;
}
/** criteria a similarity line T1 ~ T2 gets from the lines above it */
function critFromRows(F, T1, T2, before) {
  const A = new Set(), crit = new Set();
  for (const r of before) {
    const S = stParse(r.st);
    if (S.k === 'ang') for (const i of angRowIdx(F, T1, T2, S)) A.add(i);
  }
  if (A.size >= 2) crit.add('AA');
  for (const r of before) {
    const S = stParse(r.st);
    if (S.k !== 'ratio') continue;
    const idx = ratioIdx(T1, T2, S.fr);
    if (!idx) continue;
    const set = new Set(idx);
    if (set.size === 3) crit.add('SSS~');
    if (set.size === 2) { const inc = [0, 1, 2].find(i => !set.has(i)); if (A.has(inc)) crit.add('SAS~'); }
  }
  return crit;
}
/** the lengths a proof may use: labelled in the figure, and lines above that state lengths */
function proofLens(F, before) {
  const S = new Lens().addFig(F, false);
  for (const r of before) { const x = stParse(r.st); if (x.k === 'lens') for (const [n, v] of x.l) S.set(n, L(0, v)); }
  return S;
}
/** is row i justified by its reason (givens + the rows before it)? */
function rowOk(F, pf, rows, i) {
  const { st, rs } = rows[i];
  const S = stParse(st);
  const before = rows.slice(0, i);
  const pars = givenPars(pf);
  const gt = givenText(pf);
  switch (rs) {
    case '': return false;
    case 'Given': return pf.givens.some(g => plain(g) === plain(st));
    case 'Reflexive Property of Congruence': case 'Vertical Angles Theorem': case 'All right angles are congruent':
    case 'Corresponding Angles Theorem': case 'Alternate Interior Angles Theorem': {
      if (S.k !== 'ang') return false;
      const tris = [...new Set([...before, ...rows.slice(i)].map(r => stParse(r.st)).filter(x => x.k === 'sim').flatMap(x => [x.a, x.b]))];
      return angReason(F, angGeo(F, S.a, tris), angGeo(F, S.b, tris.slice().reverse()), gt, pars) === rs;
    }
    case 'Definition of congruent angles': case 'Triangle Angle Sum Theorem': {
      // angle measures from the givens and the lines above
      const meas = {};
      for (const s of [...pf.givens, ...before.map(r => r.st)]) for (const m of plain(s).matchAll(/m∠([A-Z]) = (\d+(?:\.\d+)?)°/g)) meas[m[1]] = num(m[2]);
      if (rs === 'Definition of congruent angles') return S.k === 'ang' && S.a.length === 1 && S.b.length === 1 && meas[S.a] !== undefined && meas[S.a] === meas[S.b];
      const m = plain(st).match(/^m∠([A-Z]) = (\d+(?:\.\d+)?)°$/);
      if (!m) return false;
      const tris = [stParse(pf.prove)].filter(x => x.k === 'sim').flatMap(x => [x.a, x.b]);
      return tris.some(T => T.includes(m[1]) && T.split('').filter(c => c !== m[1]).every(c => meas[c] !== undefined) && close(180 - T.split('').filter(c => c !== m[1]).reduce((s, c) => s + meas[c], 0), num(m[2])));
    }
    case 'Segment Addition Postulate': {
      if (S.k !== 'lens') return false;
      const Ls = new Lens().addFig(F); Ls.run();
      return S.l.every(([n, v]) => Ls.val(n) !== undefined && close(Ls.val(n), v) && !segBy(F, n)?.text);
    }
    case 'Division of the given lengths': {
      if (S.k !== 'ratio') return false;
      const Ls = proofLens(F, before);
      const vals = S.fr.map(([a, b]) => (Ls.val(a) !== undefined && Ls.val(b) !== undefined ? Ls.val(a) / Ls.val(b) : NaN));
      if (vals.some(Number.isNaN) || vals.some(v => !close(v, vals[0]))) return false;
      return S.v === undefined || close(S.v, vals[0]);
    }
    case 'Corresponding sides of similar triangles are proportional': {
      if (S.k !== 'ratio') return false;
      for (const r of before) {
        const x = stParse(r.st);
        if (x.k !== 'sim') continue;
        if (S.fr.length >= 2 && ratioIdx(x.a, x.b, S.fr)) return true;
        // "a/b = c/d" with both of a pair in one triangle
        if (S.fr.length === 2 && propFollows(x.a, x.b, S.fr[0][0], S.fr[0][1], S.fr[1][0], S.fr[1][1])) return true;
      }
      return false;
    }
    case 'AA': case 'SAS~': case 'SSS~': {
      if (S.k !== 'sim') return false;
      return critFromRows(F, S.a, S.b, before).has(rs) && geoSimilar(F, S.a, S.b, 1);
    }
    default: return null;
  }
}

// =====================================================================================================================
// right triangle with the altitude to the hypotenuse
function altitudeParts(F) {
  // the foot: a boxed angle whose vertex lies between two named points; the apex: the other end of that ray
  for (const b of F.angs) {
    if (!b.box || !b.V) continue;
    const V = b.V;
    const ends = Object.keys(F.P).filter(n => n !== V);
    for (const e1 of ends) for (const e2 of ends) {
      if (e1 >= e2 || !between(F.P[e1], F.P[V], F.P[e2])) continue;
      const apex = ends.find(n => n !== e1 && n !== e2);
      if (apex && Math.abs(angDeg(sub(F.P[apex], F.P[V]), sub(F.P[e1], F.P[V])) - 90) < 0.5) return { foot: V, apex, e1, e2 };
    }
  }
  return null;
}
/** p, q, h, l1, l2, c from whatever is known */
function altSolve(known) {
  const v = { ...known };
  const R = [
    ['c', ['p', 'q'], ({ p, q }) => p + q], ['p', ['c', 'q'], ({ c, q }) => c - q], ['q', ['c', 'p'], ({ c, p }) => c - p],
    ['h', ['p', 'q'], ({ p, q }) => Math.sqrt(p * q)], ['p', ['h', 'q'], ({ h, q }) => (h * h) / q], ['q', ['h', 'p'], ({ h, p }) => (h * h) / p],
    ['l1', ['p', 'c'], ({ p, c }) => Math.sqrt(p * c)], ['p', ['l1', 'c'], ({ l1, c }) => (l1 * l1) / c], ['c', ['l1', 'p'], ({ l1, p }) => (l1 * l1) / p],
    ['l2', ['q', 'c'], ({ q, c }) => Math.sqrt(q * c)], ['q', ['l2', 'c'], ({ l2, c }) => (l2 * l2) / c], ['c', ['l2', 'q'], ({ l2, q }) => (l2 * l2) / q],
    ['c', ['l1', 'l2'], ({ l1, l2 }) => Math.hypot(l1, l2)], ['l1', ['c', 'l2'], ({ c, l2 }) => Math.sqrt(c * c - l2 * l2)], ['l2', ['c', 'l1'], ({ c, l1 }) => Math.sqrt(c * c - l1 * l1)],
    ['l1', ['h', 'p'], ({ h, p }) => Math.hypot(h, p)], ['h', ['l1', 'p'], ({ l1, p }) => Math.sqrt(l1 * l1 - p * p)], ['p', ['l1', 'h'], ({ l1, h }) => Math.sqrt(l1 * l1 - h * h)],
    ['l2', ['h', 'q'], ({ h, q }) => Math.hypot(h, q)], ['h', ['l2', 'q'], ({ l2, q }) => Math.sqrt(l2 * l2 - q * q)], ['q', ['l2', 'h'], ({ l2, h }) => Math.sqrt(l2 * l2 - h * h)],
  ];
  for (let it = 0; it < 10; it++) for (const [t, need, f] of R) if (v[t] === undefined && need.every(n => v[n] !== undefined)) v[t] = f(v);
  return v;
}
function altValues(q, F) {
  const A = altitudeParts(F);
  if (!A) return null;
  const { foot, apex, e1, e2 } = A;
  const name = { p: e1 + foot, q: foot + e2, h: apex + foot, l1: e1 + apex, l2: e2 + apex, c: e1 + e2 };
  const Ls = new Lens().addFig(F, false).addText(q.prompt);
  const known = {};
  for (const [k, n] of Object.entries(name)) { const v = Ls.val(n); if (v !== undefined) known[k] = v; }
  return { v: altSolve(known), name, A };
}

// =====================================================================================================================
// mini algebra for the side-splitter steps (a, b, c, d; implicit products)
function evalAlg(expr, env) {
  const s = plain(expr).replace(/\s+/g, '');
  let i = 0;
  const peek = () => s[i];
  function prim() {
    const c = peek();
    if (c === '(') { i++; const v = sum(); i++; return v; }
    if (/[a-z]/.test(c)) { i++; return env[c]; }
    let m = s.slice(i).match(/^\d+(\.\d+)?/);
    if (m) { i += m[0].length; return num(m[0]); }
    throw new Error('bad ' + s);
  }
  function prod() {
    let v = prim();
    for (;;) {
      const c = peek();
      if (c === '/') { i++; v /= prim(); } else if (c === '*' || c === '·') { i++; v *= prim(); } else if (c && (/[a-z(]/.test(c) || /\d/.test(c))) v *= prim(); else return v;
    }
  }
  function sum() { let v = prod(); for (;;) { const c = peek(); if (c === '+') { i++; v += prod(); } else if (c === '-') { i++; v -= prod(); } else return v; } }
  const v = sum();
  if (i !== s.length) throw new Error('trailing ' + s);
  return v;
}
function eqHolds(eq, env) {
  const parts = plain(eq).split('=');
  if (parts.length < 2) return null;
  try { const v = parts.map(p => evalAlg(p, env)); return v.every(x => close(x, v[0], 1e-7)); } catch { return null; }
}
const normEq = e => plain(e).replace(/\s+/g, '');

// =====================================================================================================================
// units for the indirect measurement stories
const toFt = (v, u) => (/^in/.test(u) ? v / 12 : /^yd/.test(u) ? v * 3 : v);
const fromFt = (v, u) => (/^in/.test(u) ? v * 12 : /^yd/.test(u) ? v / 3 : v);

// =====================================================================================================================
// families
function lensFor(q, F, extra = []) {
  const Ls = new Lens().addFig(F).addText(q.prompt);
  const st = stmtOf(q.prompt);
  if (st) Ls.sims.push(st);
  for (const s of extra) Ls.sims.push(s);
  return Ls.run();
}
const askSeg = t => { const m = plain(t).match(/(?:Find|How long is|How long must) ([A-Z]{2})\b/); return m ? m[1] : null; };

const SOLVERS = {
  // ---- congruence-as-scale-factor-1 ----
  k1Classify(q) {
    const F = figOf(q), [T1, T2] = stmtOf(q.prompt);
    const Ls = new Lens().addFig(F, false);
    const r = [0, 1, 2].map(i => Ls.val(sideN(T2, i)) / Ls.val(sideN(T1, i)));
    if (r.some(x => !Number.isFinite(x)) || r.some(x => !close(x, r[0]))) return -1;
    const k = r[0];
    if (close(k, 1)) return idxWhere(q, c => /^Congruent, and also similar with k = 1$/.test(c));
    return idxWhere(q, c => { if (!/^Similar/.test(c) || !/not congruent/.test(c)) return false; const m = c.match(/k = ([\d/.]+)/); return !m || close(fracVal(m[1]), k); });
  },
  k1Claim(q) {
    const t = plain(q.prompt).replace(/^Always, sometimes or never\? /, '');
    let ans, m;
    if (/^Similar triangles with one pair of equal corresponding sides are congruent\.$/.test(t)) ans = 'Always';
    else if (/^Similar triangles are congruent\.$/.test(t)) ans = 'Sometimes';
    else if (/^If two triangles are similar, they are not congruent\.$/.test(t)) ans = 'Sometimes';
    else if (/^Congruent triangles are similar\.$/.test(t)) ans = 'Always';
    else if ((m = t.match(/^A triangle and its image under a dilation with k = ([\d/.]+) are (congruent|similar)\.$/))) ans = m[2] === 'similar' ? 'Always' : close(fracVal(m[1]), 1) ? 'Always' : 'Never';
    else if ((m = t.match(/^Two triangles with scale factor ([\d/.]+) are congruent\.$/))) ans = close(fracVal(m[1]), 1) ? 'Always' : 'Never';
    else if ((m = t.match(/^If △([A-Z]{3}) ~ △([A-Z]{3}), then △([A-Z]{3}) ≅ △([A-Z]{3})\.$/))) ans = m[1] === m[3] && m[2] === m[4] ? 'Sometimes' : undefined;
    else if ((m = t.match(/^If △([A-Z]{3}) ≅ △([A-Z]{3}), then △([A-Z]{3}) ~ △([A-Z]{3})\.$/))) ans = m[1] === m[3] && m[2] === m[4] ? 'Always' : undefined;
    if (!ans) return undefined;
    return idxWhere(q, c => c === ans);
  },

  // ---- aa-criterion ----
  aaThird(q) {
    const F = figOf(q), m = plain(q.prompt).match(/Are △([A-Z]{3}) and △([A-Z]{3}) similar/);
    const sets = [m[1], m[2]].map(T => {
      const a = T.split('').map(V => angLabel(triAngle(F, T, V)));
      const k = a.filter(x => !Number.isNaN(x));
      if (k.length === 2) a[a.findIndex(Number.isNaN)] = 180 - k[0] - k[1];
      return a.sort((x, y) => x - y);
    });
    if (sets.flat().some(Number.isNaN)) return undefined;
    const same = sets[0].every((x, i) => close(x, sets[1][i]));
    return idxWhere(q, c => (same ? /^Similar by AA$/.test(c) : /^Not similar: the angle sets cannot be matched/.test(c)));
  },
  aaMissing(q) {
    const F = figOf(q), [T1, T2] = stmtOf(q.prompt), want = plain(q.prompt).match(/What is m∠([A-Z])\?/)[1];
    const meas = {};
    for (const T of [T1, T2]) for (const V of T) { const v = angLabel(triAngle(F, T, V)); if (!Number.isNaN(v)) meas[V] = v; }
    for (let it = 0; it < 5; it++) {
      for (let i = 0; i < 3; i++) { if (meas[T1[i]] !== undefined && meas[T2[i]] === undefined) meas[T2[i]] = meas[T1[i]]; if (meas[T2[i]] !== undefined && meas[T1[i]] === undefined) meas[T1[i]] = meas[T2[i]]; }
      for (const T of [T1, T2]) { const k = T.split('').filter(c => meas[c] !== undefined); if (k.length === 2) meas[T.split('').find(c => meas[c] === undefined)] = 180 - meas[k[0]] - meas[k[1]]; }
    }
    return meas[want];
  },

  // ---- sss-similarity ----
  sssCheck(q) {
    const F = figOf(q), m = plain(q.prompt).match(/Are △([A-Z]{3}) and △([A-Z]{3}) similar/);
    const Ls = new Lens().addFig(F, false);
    const s = [m[1], m[2]].map(T => [0, 1, 2].map(i => Ls.val(sideN(T, i))).sort((a, b) => a - b));
    if (s.flat().some(v => v === undefined)) return undefined;
    const r = s[0].map((v, i) => s[1][i] / v);
    const same = r.every(x => close(x, r[0]));
    return idxWhere(q, c => (same ? /^Similar by SSS~/.test(c) : /^Not similar: the three side ratios are not all equal/.test(c)));
  },
  sssRatio(q) {
    const m = plain(q.prompt).match(/△([A-Z]{3}) has sides ([\d.]+), ([\d.]+), ([\d.]+); △([A-Z]{3}) has sides ([\d.]+), ([\d.]+), ([\d.]+)\. What is the scale factor from △([A-Z]{3}) to △([A-Z]{3})\?/);
    const S = { [m[1]]: [m[2], m[3], m[4]].map(num).sort((a, b) => a - b), [m[5]]: [m[6], m[7], m[8]].map(num).sort((a, b) => a - b) };
    const from = S[m[9]], to = S[m[10]];
    const r = to.map((v, i) => Q(v).div(from[i]));
    if (!r.every(x => x.eq(r[0]))) return undefined;
    return r[0].pair;
  },

  // ---- sas-similarity ----
  sasCheck(q) {
    const F = figOf(q), m = plain(q.prompt).match(/about △([A-Z]{3}) and △([A-Z]{3})/);
    const Ls = new Lens().addFig(F, false);
    const info = [m[1], m[2]].map(T => {
      const V = T.split('').find(v => { const a = triAngle(F, T, v); return a && a.arcs > 0; });
      const sides = [0, 1, 2].map(i => sideN(T, i)).filter(s => Ls.val(s) !== undefined);
      return { V, sides, inc: !!V && sides.length === 2 && sides.every(s => s.includes(V)) };
    });
    if (info.some(x => !x.V || x.sides.length !== 2)) return undefined;
    if (!info[0].inc || !info[1].inc) return idxWhere(q, c => /^Not enough information/.test(c));
    const a = info[0].sides.map(s => Ls.val(s)), b = info[1].sides.map(s => Ls.val(s));
    const ok = close(b[0] / a[0], b[1] / a[1]) || close(b[1] / a[0], b[0] / a[1]);
    return ok ? idxWhere(q, c => /^Similar by SAS~$/.test(c)) : -1;
  },
  sasLen(q) {
    const F = figOf(q);
    const m = plain(q.prompt).match(/so that △([A-Z]{3}) ~ △([A-Z]{3}) by SAS~/);
    const Ls = new Lens().addFig(F).addText(q.prompt);
    Ls.sims.push([m[1], m[2]]);
    Ls.run();
    return Ls.val(askSeg(q.prompt));
  },

  // ---- aa-from-similarity-transformations ----
  dilateWhy(q) {
    const t = plain(q.prompt);
    if (/What finishes the proof/.test(t)) return idxWhere(q, c => /^A rigid motion carries △[A-Z]{3} onto △[A-Z]{3}, so the dilation and then that motion carry/.test(c));
    const k = fracVal(t.match(/by k = ([\d/]+)/)[1]);
    const G = q.data.picture.gallery.figs.map(readFig);
    const names = G.map(g => Object.keys(g.P).join(''));
    // the dilation really multiplies by k: labelled sides of the image over the original
    const Ls0 = new Lens().addFig(G[0], false), Ls1 = new Lens().addFig(G[1], false), Ls2 = new Lens().addFig(G[2], false);
    for (let i = 0; i < 3; i++) { const a = Ls0.val(sideN(names[0], i)), b = Ls1.val(sideN(names[1], i)); if (a !== undefined && b !== undefined && !close(b / a, k)) return -1; }
    // which parts of the image and DEF are marked equal
    const S = new Set(), A = new Set();
    for (let i = 0; i < 3; i++) {
      const a = Ls1.val(sideN(names[1], i)), b = Ls2.val(sideN(names[2], i));
      if (a !== undefined && b !== undefined && close(a, b)) S.add(i);
      const x = triAngle(G[1], names[1], names[1][i]), y = triAngle(G[2], names[2], names[2][i]);
      if (x && y && x.arcs > 0 && x.arcs === y.arcs) A.add(i);
    }
    let crit = null;
    if (S.size === 3) crit = 'SSS';
    else if (S.size === 2 && A.has([0, 1, 2].find(i => !S.has(i)))) crit = 'SAS';
    else if (A.size >= 2 && S.size >= 1) { const s = [...S][0]; crit = [...A].filter(i => i !== s).length >= 2 ? 'ASA' : 'AAS'; }
    if (!crit) return undefined;
    return idxWhere(q, c => { const r = c.match(/^(SSS|SAS|ASA|AAS): the dilation keeps the angles and multiplies every side by ([\d/]+)$/); return !!r && r[1] === crit && close(fracVal(r[2]), k); });
  },
  dilateK(q) {
    const F = figOf(q), m = plain(q.prompt).match(/show △([A-Z]{3}) ~ △([A-Z]{3}) by AA/);
    const [T1, T2] = [m[1], m[2]];
    const arcs = (T, V) => triAngle(F, T, V)?.arcs ?? 0;
    // match vertices by their arcs, the unmarked one by elimination
    const U = T1.split('').map(V => { const a = arcs(T1, V); return a ? T2.split('').filter(W => arcs(T2, W) === a) : null; });
    if (U.some(u => u && u.length !== 1)) return undefined;
    const used = U.filter(Boolean).map(u => u[0]);
    const rest = T2.split('').filter(W => !used.includes(W));
    if (rest.length !== 1) return undefined;
    const T2o = U.map(u => (u ? u[0] : rest[0])).join('');
    const Ls = new Lens().addFig(F, false);
    for (let i = 0; i < 3; i++) { const a = Ls.val(sideN(T1, i)), b = Ls.val(sideN(T2o, i)); if (a !== undefined && b !== undefined) return Q(b).div(a).pair; }
    return undefined;
  },

  // ---- insufficient-vs-not-similar ----
  evidence(q) {
    const Fc = parseFacts(q.data.picture.card.lines.join('. '));
    const [T1, T2] = factTris(Fc);
    const r = judgeFacts(Fc, T1, T2);
    return idxWhere(q, c => (r.status === 'similar' ? /^Similar/.test(c) : r.status === 'not' ? /^Not similar/.test(c) : /^Not enough information/.test(c)));
  },
  evidenceJudge(q) {
    const t = plain(q.prompt);
    if (/The only fact is m∠[A-Z] = m∠[A-Z] = \d+°\. No similarity criterion fits, so the triangles are not similar/.test(t)) return idxWhere(q, c => /^No: no criterion only means not enough information/.test(c));
    let m = t.match(/m∠([A-Z]) = (\d+)° and m∠([A-Z]) = (\d+)°, but m∠([A-Z]) = (\d+)° and m∠([A-Z]) = (\d+)°/);
    if (m) {
      const meas = { [m[1]]: num(m[2]), [m[3]]: num(m[4]), [m[5]]: num(m[6]), [m[7]]: num(m[8]) };
      const s1 = [num(m[2]), num(m[4])], s2 = [num(m[6]), num(m[8])];
      const full = s => [...s, 180 - s[0] - s[1]].sort((a, b) => a - b);
      const same = full(s1).every((v, i) => v === full(s2)[i]);
      if (!same) return -1;
      return idxWhere(q, c => { const r = c.match(/^No: matching ([A-Z]) with ([A-Z]) and ([A-Z]) with ([A-Z]) gives AA, so they are similar$/); return !!r && meas[r[1]] === meas[r[2]] && meas[r[3]] === meas[r[4]] && [m[1], m[3]].includes(r[1]) && [m[1], m[3]].includes(r[3]) && r[1] !== r[3]; });
    }
    m = t.match(/△[A-Z]{3} has sides ([\d.]+), ([\d.]+), ([\d.]+) and △[A-Z]{3} has sides ([\d.]+), ([\d.]+), ([\d.]+)\. Sorted, the ratios are ([\d./]+), ([\d./]+), ([\d./]+): not all equal/);
    if (m) {
      const a = [m[1], m[2], m[3]].map(num).sort((x, y) => x - y), b = [m[4], m[5], m[6]].map(num).sort((x, y) => x - y);
      const r = a.map((v, i) => b[i] / v);
      const stated = [m[7], m[8], m[9]].map(fracVal);
      if (!stated.every((v, i) => close(v, r[i]))) return -1;
      const equal = r.every(x => close(x, r[0]));
      return equal ? -1 : idxWhere(q, c => /^Yes: sorting is the only pairing that could work, and it fails/.test(c));
    }
    return undefined;
  },

  // ---- classify-congruent-similar-neither ----
  classify5(q) {
    const Fc = parseFacts(q.data.picture.card.lines.join('. '));
    const [T1, T2] = factTris(Fc);
    const r = judgeFacts(Fc, T1, T2);
    if (r.status === 'not') return idxWhere(q, c => /^Not similar$/.test(c));
    if (r.status === 'notenough') return idxWhere(q, c => /^Not enough information$/.test(c));
    if (r.k === 'mixed') return -1;
    if (r.k === null) return idxWhere(q, c => /^Similar; congruence not determined$/.test(c));
    return close(r.k, 1) ? idxWhere(q, c => /^Congruent \(so similar, k = 1\)$/.test(c)) : idxWhere(q, c => /^Similar and not congruent/.test(c));
  },
  critName(q) {
    const [T1, T2] = stmtOf(q.prompt);
    const Fc = parseFacts(q.data.picture.card.lines.join('. '));
    const r = judgeFacts(Fc, T1, T2, true).all[0];
    const crit = [...r.crit].filter(c => c !== 'SSA');
    if (!crit.length && r.crit.has('SSA')) return -1;
    if (crit.length === 0) return idxWhere(q, c => /^None/.test(c));
    if (crit.length > 1) return -1;
    return idxWhere(q, c => c === crit[0]);
  },

  // ---- triangle-criteria-scope ----
  polyScope(q) {
    const t = plain(q.prompt);
    let m = t.match(/Rhombus ABCD has sides ([\d.]+) and an angle of (\d+)°; rhombus EFGH has sides ([\d.]+) and an angle of (\d+)°/);
    if (m) {
      const a = num(m[2]), b = num(m[4]);
      const sim = a === b || a + b === 180;
      if (sim) return -1;
      return idxWhere(q, c => { const r = c.match(/^No: the angles (\d+)° and (\d+)° differ$/); return !!r && num(r[1]) === a && num(r[2]) === b; });
    }
    m = t.match(/Rectangle ABCD is ([\d.]+) by ([\d.]+); rectangle EFGH is ([\d.]+) by ([\d.]+)/);
    if (m) {
      const [a, b, c2, d] = [m[1], m[2], m[3], m[4]].map(num);
      const sim = close(c2 / a, d / b) || close(d / a, c2 / b);
      if (sim) return -1;
      return idxWhere(q, c => { const r = c.match(/^No: the lengths are in ratio ([\d/.]+), the widths in ratio ([\d/.]+)$/); return !!r && close(fracVal(r[1]), c2 / a) && close(fracVal(r[2]), d / b); });
    }
    m = t.match(/These triangles both have angles of (\d+)° and (\d+)°\. Are they similar\?/);
    if (m) return num(m[1]) + num(m[2]) < 180 ? idxWhere(q, c => /^Similar by AA/.test(c)) : -1;
    return undefined;
  },
  polyWhy(q) {
    const t = plain(q.prompt);
    if (/^Rectangles/.test(t)) return idxWhere(q, c => /^A rectangle can stretch one way and keep its right angles; a triangle's angles fix its shape$/.test(c));
    if (/^Rhombi/.test(t)) return idxWhere(q, c => /^A rhombus can lean, changing its angles while every side stays the same$/.test(c));
    return undefined;
  },

  // ---- correspondence-from-statement ----
  corrSide(q) {
    const m = plain(q.prompt).match(/△([A-Z]{3}) ~ △([A-Z]{3})\. Which part of △([A-Z]{3}) corresponds to (∠?)([A-Z]{1,2})\?/);
    const [T1, T2] = m[3] === m[2] ? [m[1], m[2]] : [m[2], m[1]];
    const map = corrMap(T1, T2);
    const tgt = m[5].split('').map(c => map[c]).join('');
    return idxWhere(q, c => (m[4] ? c === '∠' + tgt : /^[A-Z]{2}$/.test(c) && sortedSeg(c) === sortedSeg(tgt)));
  },
  corrRatio(q) {
    const [T1, T2] = stmtOf(q.prompt);
    return idxWhere(q, c => { const p = propParts(c); return !!p && propFollows(T1, T2, ...p); });
  },

  // ---- correspondence-from-angle-marks ----
  stmtMarks(q) {
    const F = figOf(q);
    return idxWhere(q, c => {
      const s = stmtOf(c);
      if (!s) return false;
      return [0, 1, 2].every(i => { const a = triAngle(F, s[0], s[0][i]), b = triAngle(F, s[1], s[1][i]); return a && b && a.arcs > 0 && a.arcs === b.arcs; });
    });
  },
  altStmt(q) {
    const F = figOf(q);
    return idxWhere(q, c => { const s = stmtOf(c); return !!s && geoSimilar(F, s[0], s[1]); });
  },

  // ---- directed-scale-factor ----
  kDirected(q) { return kFrom(q); },
  kFromStmt(q) { return kFrom(q); },

  // ---- missing-length-separated ----
  missSep(q) { return lensFor(q, figOf(q)).val(askSeg(q.prompt)); },
  missStory(q) { return lensFor(q, figOf(q)).val(askSeg(q.prompt)); },

  // ---- nested-triangles-whole-vs-part ----
  nestPart(q) { const F = figOf(q); return lensFor(q, F).val(askSeg(q.prompt)); },
  nestWhole(q) {
    const F = figOf(q);
    const Ls = new Lens().addFig(F).addText(q.prompt);
    Ls.sims.push(...parallelSims(F, q.prompt));
    Ls.run();
    return Ls.val(askSeg(q.prompt));
  },

  // ---- altitude-similar-triangles ----
  altWhich(q) {
    const F = figOf(q);
    const tris = [...plain(q.prompt).matchAll(/△([A-Z]{3})/g)].map(m => m[1]).slice(1);
    if (tris.length !== 3) return undefined;
    const angs = T => T.split('').map(V => geoAngle(F, T, V)).sort((a, b) => a - b);
    const sim = (a, b) => angs(a).every((v, i) => Math.abs(v - angs(b)[i]) < 0.3);
    const [s1, s2, big] = tris;
    const small = sim(s1, s2), all = small && sim(s1, big);
    if (all) return idxWhere(q, c => /^All three triangles are similar to each other$/.test(c));
    if (small) {
      const sides = T => [0, 1, 2].map(i => glen(F, sideN(T, i))).sort((a, b) => a - b);
      const cong = sides(s1).every((v, i) => Math.abs(v - sides(s2)[i]) < 0.5);
      return idxWhere(q, c => (cong ? /^Only the two small triangles, and they are congruent$/.test(c) : /^Only the two small triangles are similar$/.test(c)));
    }
    return -1;
  },

  // ---- geometric-mean-relations ----
  gmAlt(q) { return gmSolve(q); },
  gmLeg(q) { return gmSolve(q); },
  gmDerive(q) {
    const [T1, T2] = stmtOf(q.prompt);
    return idxWhere(q, c => { const p = propParts(c); return !!p && propFollows(T1, T2, ...p); });
  },

  // ---- hourglass-figures ----
  hourStmt(q) {
    const F = figOf(q);
    const t = plain(q.prompt);
    const X = t.match(/cross at ([A-Z])/)[1];
    const pars = parSegs(F, q.prompt);
    if (!pars.length) return idxWhere(q, c => /^Not justified: only the vertical angles are known$/.test(c));
    return idxWhere(q, c => { const m = c.match(/^△([A-Z]{3}) ~ △([A-Z]{3}), by AA$/); return !!m && markedPairs(F, m[1], m[2], pars, q.prompt).length >= 2; });
  },
  hourLen(q) { return lensFor(q, figOf(q)).val(askSeg(q.prompt)); },

  // ---- algebraic-side-lengths ----
  algNest(q) {
    const F = figOf(q);
    const Ls = new Lens().addFig(F).addText(q.prompt);
    Ls.sims.push(...parallelSims(F, q.prompt));
    Ls.run();
    if (Ls.amb || Ls.x === undefined) return undefined;
    return /Solve for x/.test(q.prompt) ? round9(Ls.x) : Ls.val(askSeg(q.prompt));
  },
  algSep(q) {
    const Ls = lensFor(q, figOf(q));
    if (Ls.amb || Ls.x === undefined) return undefined;
    return /Solve for x/.test(q.prompt) ? round9(Ls.x) : Ls.val(askSeg(q.prompt));
  },

  // ---- justify-criterion-conditions ----
  reasonPick(q) {
    const F = figOf(q), t = plain(q.prompt);
    const m = t.match(/justifies ∠([A-Z]{1,3}) ≅ ∠([A-Z]{1,3})\?/);
    let r;
    if (m[1] === m[2]) r = 'Reflexive Property of Congruence';
    else r = angReason(F, angGeo(F, m[1]), angGeo(F, m[2]), t, parSegs(F, q.prompt));
    if (!r) return undefined;
    return idxWhere(q, c => c === r);
  },
  lookAlike(q) {
    const F = figOf(q);
    const [T1, T2] = plain(q.prompt).match(/about △([A-Z]{3}) and △([A-Z]{3})/).slice(1);
    const pars = parSegs(F, q.prompt);
    const n = markedPairs(F, T1, T2, pars, q.prompt).length;
    if (n === 1) return idxWhere(q, c => /^Not enough information: only one angle pair is known$/.test(c));
    if (n < 2) return undefined;
    return idxWhere(q, c => { const m = c.match(/^△([A-Z]{3}) ~ △([A-Z]{3}) by AA$/); return !!m && markedPairs(F, m[1], m[2], pars, q.prompt).length >= 2; });
  },
  proofReasonS(q) { return proofReason(q); },

  // ---- write-similarity-proof ----
  proofOrder(q) {
    const F = figOf(q), pf = proofOf(q);
    return idxWhere(q, c => {
      const letters = c.split(/,\s*/);
      if (!letters.every(x => /^[A-Z]$/.test(x))) return false;
      const rows = letters.map(x => pf.rows[x.charCodeAt(0) - 65]);
      if (rows.some(r => !r) || new Set(letters).size !== letters.length) return false;
      for (let i = 0; i < rows.length; i++) if (rowOk(F, pf, rows, i) !== true) return false;
      return plain(rows[rows.length - 1].st) === plain(pf.prove);
    });
  },
  proofEnd(q) {
    const F = figOf(q), pf = proofOf(q);
    return idxWhere(q, c => {
      const m = c.match(/^△([A-Z]{3}) (~|≅) △([A-Z]{3}), (AA|SAS~|SSS~|ASA|SAS|SSS|AAS)$/);
      if (!m || m[2] !== '~') return false;
      const rows = [...pf.rows, { st: `△${m[1]} ~ △${m[3]}`, rs: m[4] }];
      for (let i = 0; i < rows.length; i++) if (rowOk(F, pf, rows, i) !== true) return false;
      return true;
    });
  },

  // ---- deduce-proportion-from-similarity ----
  deduceProp(q) {
    const [T1, T2] = stmtOf(q.prompt);
    return idxWhere(q, c => { const p = propParts(c); return !!p && propFollows(T1, T2, ...p); });
  },
  deduceCross(q) {
    const [T1, T2] = stmtOf(q.prompt);
    return idxWhere(q, c => {
      const m = c.match(/^([A-Z]{2}) · ([A-Z]{2}) = ([A-Z]{2}) · ([A-Z]{2})$/);
      if (!m) return false;
      const [A, B, C, D] = m.slice(1, 5);
      return propFollows(T1, T2, A, C, D, B) || propFollows(T1, T2, A, D, C, B);
    });
  },
  angleK(q) {
    const [T1, T2] = stmtOf(q.prompt);
    const Ls = new Lens().addText(q.data.picture.card.lines.join('. '));
    for (let i = 0; i < 3; i++) { const a = Ls.val(sideN(T1, i)), b = Ls.val(sideN(T2, i)); if (a !== undefined && b !== undefined) return -1; }
    return idxWhere(q, c => /^It cannot be found: no side of the second triangle is known$/.test(c));
  },

  // ---- pythagorean-proof-by-similarity ----
  pythGap(q) { return pythAsk(q, 'st'); },
  pythReason(q) { return pythAsk(q, 'rs'); },

  // ---- side-splitter-theorem ----
  ssAlgebra(q) {
    const lines = q.data.picture.card.lines.map(l => plain(l).replace(/^\d+\.\s*/, ''));
    const miss = lines.indexOf('?');
    const target = 'a/b = c/d';
    const env = { a: 3.7, b: 5.3, c: 2.9 }; env.d = (env.b * env.c) / env.a;
    const env2 = { a: 6.1, b: 1.7, c: 4.4 }; env2.d = (env2.b * env2.c) / env2.a;
    const ok = allWhere(q, c => {
      if (eqHolds(c, env) !== true || eqHolds(c, env2) !== true) return false;
      const n = normEq(c);
      if (miss !== lines.length - 1 && n === normEq(target)) return false;
      if (miss === lines.length - 1 && n !== normEq(target)) return false;
      return !lines.some(l => l !== '?' && normEq(l) === n);
    });
    return ok.length === 1 ? ok[0] : -1;
  },
  ssNum(q) {
    const F = figOf(q);
    const Ls = new Lens().addFig(F).addText(q.prompt);
    Ls.sims.push(...parallelSims(F, q.prompt));
    Ls.run();
    return Ls.val(askSeg(q.prompt));
  },
  ssForm(q) {
    const F = figOf(q);
    const sims = parallelSims(F, q.prompt);
    if (sims.length !== 1) return undefined;
    const mono = nestedMono(...sims[0]);
    return idxWhere(q, c => { const p = propParts(c); return !!p && monoEq(...p, mono) === true; });
  },

  // ---- side-splitter-converse ----
  convWhich(q) {
    const t = plain(q.prompt);
    if (/Corresponding Angles Converse\?/.test(t)) return idxWhere(q, c => c === 'If corresponding angles are congruent, then the lines are parallel');
    if (/Corresponding Angles Theorem \(the forward direction\)\?/.test(t)) return idxWhere(q, c => c === 'If two parallel lines are cut by a transversal, then corresponding angles are congruent');
    return undefined;
  },
  convCheck(q) {
    const F = figOf(q);
    const m = plain(q.prompt).match(/Is ([A-Z])([A-Z]) ∥ ([A-Z])([A-Z])\?/);
    const [n, w, j, k] = m.slice(1, 5);
    const apex = Object.keys(F.P).find(p => ![n, w, j, k].includes(p));
    // which cut point lies on which side
    let [x, y] = [n, w];
    if (!(between(F.P[apex], F.P[x], F.P[j]) && between(F.P[apex], F.P[y], F.P[k]))) [x, y] = [w, n];
    if (!(between(F.P[apex], F.P[x], F.P[j]) && between(F.P[apex], F.P[y], F.P[k]))) return undefined;
    const Ls = new Lens().addFig(F).addText(q.prompt).run();
    const r1 = Ls.val(apex + x) / Ls.val(apex + j), r2 = Ls.val(apex + y) / Ls.val(apex + k);
    if (!Number.isFinite(r1) || !Number.isFinite(r2)) return undefined;
    return idxWhere(q, c => (close(r1, r2) ? /^Yes: the parts are in one ratio, so SAS~ and then the converse give the parallel$/.test(c) : /^No: the parts are not in one ratio$/.test(c)));
  },

  // ---- repair-circular-argument ----
  circFind(q) {
    const pf = proofOf(q);
    let line = -1;
    for (let i = 0; i < pf.rows.length; i++) {
      const r = pf.rows[i];
      if (r.rs !== 'Corresponding sides of similar triangles are proportional') continue;
      if (pf.rows.slice(0, i).some(x => stParse(x.st).k === 'sim')) continue;
      line = i + 1; break;
    }
    if (line < 0) return idxWhere(q, c => /^None/.test(c));
    return idxWhere(q, c => c === `Line ${line}`);
  },
  circRepair(q) {
    const F = figOf(q), pf = proofOf(q);
    const struck = (pf.strike[0] ?? -1) + 1;
    const simRow = pf.rows.map(r => stParse(r.st)).find(x => x.k === 'sim');
    const pars = givenPars(pf);
    return idxWhere(q, c => {
      const m = c.match(/^Replace line (\d) with (.*?)(?:, then use| and use) AA$/);
      if (!m || num(m[1]) !== struck || !simRow) return false;
      // every angle pair named is congruent for its stated reason (or by the figure) and corresponds in the similarity
      const pairs = [...m[2].matchAll(/∠([A-Z]{1,3}) ≅ ∠([A-Z]{1,3})(?: \(([^)]*)\))?/g)];
      if (!pairs.length) return false;
      const idx = new Set();
      // the rows that stay
      for (const r of pf.rows.filter((_, i) => i + 1 !== struck)) { const S = stParse(r.st); if (S.k === 'ang') angRowIdx(F, simRow.a, simRow.b, S).forEach(i => idx.add(i)); }
      for (const p of pairs) {
        const a = angGeo(F, p[1], [simRow.a, simRow.b]), b = angGeo(F, p[2], [simRow.b, simRow.a]);
        const why = angReason(F, a, b, givenText(pf), pars);
        if (!why || (p[3] && p[3] !== why)) return false;
        const ii = angRowIdx(F, simRow.a, simRow.b, { a: p[1], b: p[2] });
        if (!ii.length) return false;
        ii.forEach(i => idx.add(i));
      }
      return idx.size >= 2;
    });
  },

  // ---- indirect-measurement ----
  shadow(q) {
    const t = plain(q.prompt);
    const m = t.match(/is ([\d.]+) (ft|feet|inches|in) tall and casts a ([\d.]+) (ft|feet|inches|in) shadow\. At the same moment an? [a-z ]+ casts a ([\d.]+) (ft|feet|inches|in) shadow/);
    if (!m) return undefined;
    const H = toFt(num(m[1]), m[2]), S = toFt(num(m[3]), m[4]), O = toFt(num(m[5]), m[6]);
    return round9(fromFt((O * H) / S, q.unit || 'ft'));
  },
  mirror(q) {
    const t = plain(q.prompt);
    const m = t.match(/([\d.]+) (ft|in) in front of [A-Za-z]+'s feet and ([\d.]+) (ft|in) from an? [a-z ]+\. .*eyes ([\d.]+) (ft|in) above the ground/);
    if (!m) return undefined;
    const dP = toFt(num(m[1]), m[2]), dB = toFt(num(m[3]), m[4]), e = toFt(num(m[5]), m[6]);
    return round9(fromFt((e * dB) / dP, q.unit || 'ft'));
  },
  river(q) {
    const t = plain(q.prompt);
    const m = t.match(/walks ([\d.]+) ft along the bank to ([A-Z]), and also steps ([\d.]+) ft straight back from ([A-Z]) to ([A-Z])\..*: ([A-Z]{2}) = ([\d.]+) ft/);
    if (!m) return undefined;
    const bc = num(m[1]), bd = num(m[3]), de = num(m[7]);
    // △TBC ~ △TDE: w / (w + BD) = BC / DE
    if (!(de > bc)) return undefined;
    return round9((bc * bd) / (de - bc));
  },
};
const round9 = v => Math.round(v * 1e9) / 1e9;

/** the angle pairs of T1 ~ T2 (vertex by vertex) the marks justify: shared, vertical, right, corresponding, alternate
 *  interior between lines marked or given parallel, equal arcs */
function markedPairs(F, T1, T2, pars, prompt) {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const a = angGeo(F, '∠' + T1[i], [T1]), b = angGeo(F, '∠' + T2[i], [T2]);
    if (!a || !b) continue;
    const ma = F.angs.find(x => sameAng({ v: x.v, d1: x.d1, d2: x.d2 }, a)), mb = F.angs.find(x => sameAng({ v: x.v, d1: x.d1, d2: x.d2 }, b));
    if (angReason(F, a, b, prompt, pars) || (ma && mb && ma.arcs > 0 && ma.arcs === mb.arcs)) out.push(i);
  }
  return out;
}
/** hourglass through X: a correspondence pairs X with X and the other vertices along one line through X each */
function hourCorr(F, X, T1, T2, pars) {
  const i1 = T1.indexOf(X), i2 = T2.indexOf(X);
  if (i1 < 0 || i1 !== i2) return false;
  for (let i = 0; i < 3; i++) {
    if (i === i1) continue;
    const a = T1[i], b = T2[i];
    if (!(a && b && a !== b && between(F.P[a], F.P[X], F.P[b]))) return false;
  }
  // the two non-X sides are the parallel pair
  const s1 = sortedSeg(T1.replace(X, '')), s2 = sortedSeg(T2.replace(X, ''));
  return pars.some(([p, r]) => (sortedSeg(p) === s1 && sortedSeg(r) === s2) || (sortedSeg(p) === s2 && sortedSeg(r) === s1));
}

function kFrom(q) {
  const t = plain(q.prompt);
  const [T1, T2] = stmtOf(t);
  const m = t.match(/scale factor from △([A-Z]{3}) to △([A-Z]{3})/);
  const Ls = new Lens().addFig(figOf(q), false);
  let k = null;
  for (let i = 0; i < 3; i++) {
    const a = Ls.val(sideN(T1, i)), b = Ls.val(sideN(T2, i));
    if (a === undefined || b === undefined) continue;
    const r = Q(b).div(a);
    if (k && !k.eq(r)) return undefined;
    k = r;
  }
  if (!k) return undefined;
  return (m[1] === T1 ? k : Q(1).div(k)).pair;
}

function gmSolve(q) {
  const F = figOf(q);
  const R = altValues(q, F);
  if (!R) return undefined;
  const t = plain(q.prompt);
  const m = t.match(/Find (?:h = |the leg )([A-Z]{2})/);
  const key = Object.entries(R.name).find(([, n]) => sortedSeg(n) === sortedSeg(m[1]))?.[0];
  const v = key && R.v[key];
  if (v === undefined || !Number.isFinite(v)) return undefined;
  if (q.input === 'num') return round9(v);
  return idxWhere(q, c => close(radVal(c), v, 1e-9));
}

/** the reason a proof line needs */
function proofReason(q) {
  const F = figOf(q), pf = proofOf(q);
  const a = pf.ask.find(x => x.cell === 'rs');
  if (!a) return undefined;
  const ok = allWhere(q, c => rowOk(F, pf, pf.rows.map((r, i) => (i === a.i ? { st: r.st, rs: c } : r)), a.i) === true);
  if (ok.length === 1) return ok[0];
  return -1;
}

/** the Pythagorean proof by similarity: a missing statement or reason */
function pythAsk(q, cell) {
  const F = figOf(q), pf = proofOf(q);
  const a = pf.ask.find(x => x.cell === cell);
  if (!a) return undefined;
  // a, b, x, y from the labels; c is the whole hypotenuse (x + y)
  const lab = {};
  for (const s of F.segs) if (s.pa && s.pb && /^[abxy]$/.test(s.text ?? '')) lab[s.text] = glen(F, s.pa + s.pb);
  lab.c = lab.x + lab.y;
  const vars = { ...lab };
  const row = pf.rows[a.i];
  const sqEq = s => { const m = plain(s).match(/^([abc])\^?2? ?= ?([abcxy])([abcxy])$/) ?? plain(s).match(/^([abc])² = ([abcxy])([abcxy])$/); return m ? { p: m[1], r: [m[2], m[3]] } : null; };
  const stOf = s => plain(s).replace(/\^2/g, '²');
  const ratioOk = (p, qq, r, s) => close(vars[p] / vars[qq], vars[r] / vars[s], 1e-6);
  if (cell === 'st') {
    const rs = row.rs;
    let m = rs.match(/^Similar sides: ([a-z])\/([a-z]) = ([a-z])\/([a-z])$/);
    if (m) {
      if (!(m[1] === m[4] && ratioOk(m[1], m[2], m[3], m[4]))) return -1;
      return idxWhere(q, c => { const e = sqEq(c); return !!e && e.p === m[1] && sortedSeg(e.r.join('')) === sortedSeg(m[2] + m[3]); });
    }
    if (/^Add lines/.test(rs)) {
      return idxWhere(q, c => { if (/Pythagorean/.test(c)) return false; return chainTrue(c, vars); });
    }
    m = rs.match(/^AA: right angle, shared angle ([A-Z])$/);
    if (m) return idxWhere(q, c => { const s = stmtOf(c); return !!s && geoSimilar(F, s[0], s[1]); });
    return undefined;
  }
  // a reason
  const st = stParse(row.st);
  if (st.k === 'sim') {
    const sh = st.a.split('').find(c => st.b.includes(c) && st.a.indexOf(c) === st.b.indexOf(c));
    const right = [0, 1, 2].some(i => Math.abs(geoAngle(F, st.a, st.a[i]) - 90) < 0.5 && Math.abs(geoAngle(F, st.b, st.b[i]) - 90) < 0.5);
    if (!geoSimilar(F, st.a, st.b) || !right) return -1;
    return idxWhere(q, c => c === `AA: right angle, shared angle ${sh}`);
  }
  const e = sqEq(stOf(row.st));
  if (e) {
    return idxWhere(q, c => { const m = c.match(/^Similar sides: ([a-z])\/([a-z]) = ([a-z])\/([a-z])$/); return !!m && m[1] === e.p && m[4] === e.p && sortedSeg(m[2] + m[3]) === sortedSeg(e.r.join('')) && ratioOk(m[1], m[2], m[3], m[4]); });
  }
  if (/= c\(x \+ y\) = c/.test(stOf(row.st))) return idxWhere(q, c => /^Add lines 2 and 4; x \+ y = c$/.test(c));
  return undefined;
}
/** "a² + b² = cx + cy = c(x + y) = c²": every part equal on the drawn lengths */
function chainTrue(s, v) {
  const parts = plain(s).split('=').map(p => p.trim());
  try {
    const vals = parts.map(p => evalAlg(p.replace(/([a-z\)])²/g, '$1*$1').replace(/\(([^()]*)\)\*\(\1\)/g, '($1)*($1)').replace(/·/g, '*'), v));
    return vals.every(x => close(x, vals[0], 1e-7));
  } catch { return false; }
}

// =====================================================================================================================
export default {
  solve(q) {
    const f = SOLVERS[q.family];
    if (!f) return undefined;
    const r = f(q);
    return r;
  },
  sane(q) {
    const t = plain(q.prompt);
    const F = q.data?.picture?.fig ? figOf(q) : null;
    // labelled sides of a triangle make a triangle; labelled angles fit in 180°
    if (F) {
      const Ls = new Lens().addFig(F, false);
      for (const T of [...new Set([...t.matchAll(/△([A-Z]{3})/g)].map(m => m[1]))]) {
        if (!T.split('').every(c => F.P[c])) continue;
        const s = [0, 1, 2].map(i => Ls.val(sideN(T, i)));
        if (s.every(v => v !== undefined) && !(s[0] + s[1] > s[2] && s[1] + s[2] > s[0] && s[0] + s[2] > s[1])) return `△${T} has sides ${s.join(', ')}: no triangle`;
        const a = T.split('').map(V => angLabel(triAngle(F, T, V))).filter(v => !Number.isNaN(v));
        if (a.length >= 2 && a.reduce((x, y) => x + y, 0) >= 180) return `△${T}: labelled angles ${a.join(', ')} leave nothing for the rest`;
      }
    }
    if (q.family === 'evidence') {
      // SSA facts that are not ambiguous decide more than "not enough"
      const Fc = parseFacts(q.data.picture.card.lines.join('. '));
      const [T1, T2] = factTris(Fc);
      for (const T of [T1, T2]) {
        const V = T.split('').find(c => Fc.meas[c] !== undefined);
        const sides = Object.keys(Fc.len).filter(s => s.split('').every(c => T.includes(c)));
        if (!V || sides.length !== 2 || sides.every(s => s.includes(V)) || T.split('').filter(c => Fc.meas[c] !== undefined).length !== 1) continue;
        const opp = sides.find(s => !s.includes(V)), adj = sides.find(s => s.includes(V));
        const th = Fc.meas[V] * Math.PI / 180, o = Fc.len[opp], d = Fc.len[adj];
        if (!(th < Math.PI / 2 && o < d && o > d * Math.sin(th) + 1e-9)) return `SSA in △${T} is not ambiguous: the triangle is fixed`;
      }
    }
    if (q.family === 'shadow') {
      const m = t.match(/is ([\d.]+) (ft|inches|in) tall/);
      if (m) { const h = toFt(num(m[1]), m[2]); if (h < 4 || h > 7) return `a person ${h} ft tall`; }
    }
    if ((q.family === 'algNest' || q.family === 'algSep') && SOLVERS[q.family](q) === undefined) return 'the proportion in x has no single positive solution';
    return '';
  },
};
