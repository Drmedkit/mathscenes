// Oracle for the lesson "triangle-inequalities" (Geometry: isosceles triangles and side-angle order).
// Written from what the student sees only: the prompt, the board, the choices, the drawn figure (named points,
// segments, tick marks, arcs, right-angle boxes, measure labels), the cards and the proof frames.
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
//
// How it decides:
// - Equal parts come from marks and givens only: a tick group, an arc group, equal measure labels, the givens in
//   words. Solution marks (angles whose id starts with "sol", drawn only in the solve) and the range strip's lo / hi
//   (drawn only in the solve) are never read.
// - Isosceles theorem and converse: equal sides face equal angles and back. Angle sum 180°, exterior angles (one per
//   vertex) 360°. The larger angle faces the longer side, both ways; side lengths from angles by the law of sines only
//   to test a "half the angle, half the side" claim.
// - Triangle inequality: a + b > c for every pair; a + b = c is collinear (no triangle); ranges are strict.
// - Proofs: every line is checked against the lines above it (and the givens) by what it states: Given, Reflexive,
//   Symmetric, SAS / ASA from the parts known congruent under the stated correspondence, CPCTC only after a triangle
//   congruence, the angle-sum lines by the drawn parallel (alternate interior vs corresponding read off the figure),
//   the triangle-inequality chain line by line.
// - Concept questions are decided per choice by what the choice claims (a counterexample is checked numerically).

import { nums, round } from '../../tools/quality/oracle-kit.mjs';

// =====================================================================================================================
// text
const OV = /̅/g;
const plain = s => String(s ?? '').replace(OV, '').replace(/−/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const low = s => plain(s).toLowerCase();
const EPS = 1e-9;
const eq = (a, b, e = 1e-7) => Math.abs(a - b) < e;
const clean = v => round(v, 6);
/** the one index whose choice passes pred; -1 when none or several */
function pick(q, pred) {
  const hits = (q.choices ?? []).map((c, i) => (pred(plain(c), i) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
const sortStr = s => s.split('').sort().join('');
/** the triangle's three letters from the board or prompt */
function triOf(q) {
  const m = plain(q.prompt).match(/△([A-Z]{3})/) || String(q.board ?? '').match(/\\triangle\s*([A-Z]{3})/);
  return m ? m[1] : null;
}
/** the vertex opposite a side, in triangle T */
const opp = (T, side) => T.split('').find(c => !side.includes(c));
/** the side opposite a vertex */
const sideOpp = (T, v) => T.split('').filter(c => c !== v).join('');
/** a linear expression in x: "(5x + 28)°" → [5, 28]; "4x" → [4, 0]; "12.5" → [0, 12.5] */
function linear(s) {
  const t = plain(s).replace(/[()°]/g, '').replace(/\s*(cm|in|ft|mi)\b/g, '').replace(/\s+/g, '');
  const m = t.match(/^([+-]?\d*\.?\d*)x([+-]\d+(?:\.\d+)?)?$/);
  if (m) { const a = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : Number(m[1]); return [a, m[2] ? Number(m[2]) : 0]; }
  if (/^[+-]?\d+(\.\d+)?$/.test(t)) return [0, Number(t)];
  return null;
}
/** solve a·x + b = c·x + d */
const solveLin = (L, R) => (eq(L[0], R[0]) ? undefined : (R[1] - L[1]) / (L[0] - R[0]));
const evalL = (L, x) => L[0] * (x ?? 0) + L[1];

// =====================================================================================================================
// vectors and the figure
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = a => Math.hypot(a[0], a[1]);
const unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const near = (a, b, e = 1.5) => !!a && !!b && Math.abs(a[0] - b[0]) < e && Math.abs(a[1] - b[1]) < e;
const angDeg = (d1, d2) => (Math.acos(Math.max(-1, Math.min(1, dot(unit(d1), unit(d2))))) * 180) / Math.PI;
const isNum = s => /^\s*\d+(\.\d+)?\s*(°|in|cm|ft|mi)?\s*$/.test(String(s ?? ''));
const numOf = s => Number(String(s).replace(/[^\d.]/g, ''));

function readFig(q) {
  const f = q.data?.picture?.fig;
  if (!f) return null;
  const F = { pts: {}, segs: [], angs: [] };
  for (const p of f.points ?? []) if (p.name) F.pts[p.name] = p.at;
  const nameAt = at => { for (const [n, p] of Object.entries(F.pts)) if (near(p, at)) return n; return null; };
  F.nameAt = nameAt;
  for (const s of f.segs ?? []) F.segs.push({ ...s, pa: nameAt(s.a), pb: nameAt(s.b) });
  for (const a of f.angles ?? []) {
    if (String(a.id ?? '').startsWith('sol')) continue; // drawn only in the solve
    F.angs.push({ ...a, V: nameAt(a.v), P: nameAt(a.p), Q: nameAt(a.q), meas: angDeg(sub(a.p, a.v), sub(a.q, a.v)) });
  }
  return F;
}
/** the drawn segment between two named points */
const segOf = (F, n) => F.segs.find(s => s.pa && s.pb && sortStr(s.pa + s.pb) === sortStr(n));
/** the interior angle of triangle T drawn at vertex v (its rays toward the other two vertices) */
function angAt(F, T, v) {
  const o = T.split('').filter(c => c !== v);
  return F.angs.find(a => a.V === v && ((a.P === o[0] && a.Q === o[1]) || (a.P === o[1] && a.Q === o[0])));
}
/** the true measure of the interior angle at v from the drawing */
function drawnAngle(F, T, v) {
  const o = T.split('').filter(c => c !== v);
  const V = F.pts[v], A = F.pts[o[0]], B = F.pts[o[1]];
  return V && A && B ? angDeg(sub(A, V), sub(B, V)) : NaN;
}

// =====================================================================================================================
// marks → equal classes
/** groups of sides of T that are marked equal (ticks), as arrays of side names */
function tickGroups(F, T) {
  const g = new Map();
  for (const side of [T[0] + T[1], T[1] + T[2], T[2] + T[0]]) {
    const s = segOf(F, side);
    if (s && s.ticks > 0) { if (!g.has(s.ticks)) g.set(s.ticks, []); g.get(s.ticks).push(side); }
  }
  return [...g.values()].filter(x => x.length > 1);
}
/** angle measures known at each vertex (labels, right-angle boxes, the third by the sum) */
function angleValues(F, T) {
  const val = {};
  for (const v of T) {
    const a = angAt(F, T, v);
    if (!a) continue;
    if (a.box) val[v] = 90;
    else if (isNum(a.text)) val[v] = numOf(a.text);
  }
  const known = T.split('').filter(v => val[v] !== undefined);
  if (known.length === 2) { const v = T.split('').find(c => val[c] === undefined); val[v] = 180 - val[known[0]] - val[known[1]]; }
  return val;
}
/** classes of vertices whose angles are equal (arcs groups + equal values) */
function equalAngleSets(F, T) {
  const parent = {}; for (const v of T) parent[v] = v;
  const find = v => (parent[v] === v ? v : (parent[v] = find(parent[v])));
  const join = (a, b) => { parent[find(a)] = find(b); };
  const arcs = {};
  for (const v of T) { const a = angAt(F, T, v); if (a && a.arcs > 0) arcs[v] = a.arcs; }
  const val = angleValues(F, T);
  for (const a of T) for (const b of T) if (a < b) {
    if (arcs[a] && arcs[a] === arcs[b]) join(a, b);
    if (val[a] !== undefined && val[b] !== undefined && eq(val[a], val[b])) join(a, b);
  }
  const cls = {}; for (const v of T) (cls[find(v)] ??= []).push(v);
  return Object.values(cls).filter(c => c.length > 1);
}

// =====================================================================================================================
// choice parsing
const angNames = c => [...plain(c).matchAll(/∠([A-Z]{1,3})/g)].map(m => (m[1].length === 3 ? m[1][1] : m[1]));
const segNames = c => [...plain(c).matchAll(/\b([A-Z]{2})\b/g)].map(m => sortStr(m[1]));
const sameSet = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

// =====================================================================================================================
// families
const S = {};

// ---- s1: isosceles base angles ----
S.baseAnglePick = q => {
  const F = readFig(q), T = triOf(q);
  const groups = tickGroups(F, T);
  if (groups.some(g => g.length === 3)) return pick(q, c => /^All three angles/.test(c));
  if (groups.length === 1) {
    const want = groups[0].map(s => opp(T, s));
    return pick(q, c => !/^All|^None/.test(c) && sameSet(angNames(c), want));
  }
  return pick(q, c => /^None/.test(c));
};
S.isoStatement = q => {
  const t = plain(q.prompt);
  if (q.input === 'num') {
    // three sides marked congruent in words: equilateral, every angle 60°
    const m = t.match(/([A-Z]{2}) ≅ ([A-Z]{2}) ≅ ([A-Z]{2})/);
    if (m) return 60;
    return undefined;
  }
  const T = triOf(q);
  return pick(q, c => {
    const m = c.match(/^If ([A-Z]{2}) ≅ ([A-Z]{2}), then ∠([A-Z]) ≅ ∠([A-Z])\.?$/);
    if (!m) return false;
    const [s1, s2] = [m[1], m[2]];
    const shared = s1.split('').filter(x => s2.includes(x));
    if (shared.length !== 1 || sortStr(s1) === sortStr(s2)) return false;
    return sameSet([m[3], m[4]], [opp(T, s1), opp(T, s2)]) && T.includes(m[3]) && T.includes(m[4]);
  });
};

// ---- s1: converse ----
S.converseSides = q => {
  const F = readFig(q), T = triOf(q);
  const sets = equalAngleSets(F, T);
  if (sets.some(s => s.length === 3)) return pick(q, c => /^All three sides/.test(c));
  if (sets.length === 1) {
    const want = sets[0].map(v => sortStr(sideOpp(T, v)));
    return pick(q, c => !/^All|^None/.test(c) && sameSet(segNames(c), want));
  }
  // no two angles known equal
  return pick(q, c => /^None/.test(c) && (!/labelled angles are not equal/.test(c) || labelledUnequal(F, T)));
};
function labelledUnequal(F, T) {
  const val = angleValues(F, T);
  const ks = T.split('').filter(v => val[v] !== undefined);
  return ks.length >= 2;
}
/** a counterexample "angles a°, b°, c°" to the converse of a stated conditional */
S.converseClaim = q => {
  const t = low(q.prompt);
  if (/two sides of a triangle are congruent, then the angles opposite them are congruent/.test(t)) {
    // the converse (equal angles face equal sides) is a true theorem, proved separately (ASA)
    return pick(q, c => /converse is true, but it needs its own proof/i.test(c));
  }
  let isCounter = null;
  if (/has a right angle, then its other two angles are acute/.test(t)) {
    // converse: two acute angles ⇒ a right angle. A counterexample: a triangle, ≥ 2 acute angles, no 90°
    isCounter = a => a.filter(x => x < 90).length >= 2 && !a.some(x => x === 90);
  } else if (/is equilateral, then it is isosceles/.test(t)) {
    // converse: isosceles ⇒ equilateral. A counterexample: two equal angles, not all three
    isCounter = a => (a[0] === a[1] || a[1] === a[2] || a[0] === a[2]) && !(a[0] === a[1] && a[1] === a[2]);
  }
  if (!isCounter) return undefined;
  return pick(q, c => {
    if (!/^No:/.test(c)) return false;
    const a = nums(c.replace(/°/g, ''));
    return a.length === 3 && a.every(x => x > 0) && eq(a[0] + a[1] + a[2], 180) && isCounter(a);
  });
};

// ---- s1: side-angle order ----
function sideValues(F, T) {
  const val = {};
  for (const side of [T[0] + T[1], T[1] + T[2], T[2] + T[0]]) { const s = segOf(F, side); if (s && isNum(s.text)) val[sortStr(side)] = numOf(s.text); }
  return val;
}
/** an order chain "∠A < ∠B < ∠C" against values (by name) */
function chainOk(c, val, re) {
  const toks = plain(c).split(/\s*(<|=)\s*/);
  if (toks.length !== 5) return false;
  const names = [toks[0], toks[2], toks[4]].map(re);
  if (names.some(n => val[n] === undefined)) return false;
  for (let i = 0; i < 2; i++) {
    const a = val[names[i]], b = val[names[i + 1]], op = toks[2 * i + 1];
    if (op === '<' && !(a < b - EPS)) return false;
    if (op === '=' && !eq(a, b)) return false;
  }
  return new Set(names).size === 3;
}
S.orderAngles = q => {
  const F = readFig(q), T = triOf(q), t = low(q.prompt);
  const sv = sideValues(F, T);
  const av = {}; for (const v of T) av[v] = sv[sortStr(sideOpp(T, v))];
  if (Object.values(av).some(x => x === undefined)) return undefined;
  if (/order its angles from smallest to largest/.test(t)) return pick(q, c => chainOk(c, av, s => s.replace('∠', '')));
  const ext = /smallest/.test(t) ? Math.min(...Object.values(av)) : Math.max(...Object.values(av));
  const want = T.split('').filter(v => eq(av[v], ext));
  return pick(q, c => !/Cannot tell/.test(c) && sameSet(angNames(c), want));
};
S.orderSides = q => {
  const F = readFig(q), T = triOf(q), t = low(q.prompt);
  const av = angleValues(F, T);
  if (T.split('').some(v => av[v] === undefined)) return undefined;
  const sv = {}; for (const v of T) sv[sortStr(sideOpp(T, v))] = av[v];
  if (/order the sides/.test(t)) return pick(q, c => chainOk(c, sv, s => sortStr(s)));
  const ext = /shortest/.test(t) ? Math.min(...Object.values(sv)) : Math.max(...Object.values(sv));
  const want = Object.keys(sv).filter(k => eq(sv[k], ext));
  return pick(q, c => !/Cannot tell/.test(c) && sameSet(segNames(c), want));
};
S.orderRatio = q => {
  const t = plain(q.prompt);
  const m = t.match(/m∠([A-Z]) = (\d+(?:\.\d+)?)°, m∠([A-Z]) = (\d+(?:\.\d+)?)°, and the side facing ∠([A-Z]) is (\d+(?:\.\d+)?) (\w+)\. \w+ says the side facing ∠([A-Z]) must be (\d+(?:\.\d+)?) /);
  if (!m) return undefined;
  const ang = { [m[1]]: Number(m[2]), [m[3]]: Number(m[4]) };
  const known = m[5], given = Number(m[6]), asked = m[8], claim = Number(m[9]);
  if (ang[known] === undefined || ang[asked] === undefined) return undefined;
  const rad = d => (d * Math.PI) / 180;
  const truth = (given * Math.sin(rad(ang[asked]))) / Math.sin(rad(ang[known]));
  if (eq(truth, claim, 1e-6)) return pick(q, c => /^Yes/.test(c));
  if (truth < given) return pick(q, c => /^No: the smaller angle faces the shorter side/.test(c) && ang[asked] < ang[known]);
  return pick(q, c => /^No: the side facing ∠[A-Z] is longer than/.test(c) && ang[asked] > ang[known]);
};

// ---- s1: compass check ----
S.arcsCheck = q => {
  const t = plain(q.prompt);
  const L = t.match(/the (\d+(?:\.\d+)?) \w+ length as the base/);
  const r = [...t.matchAll(/an arc of radius (\d+(?:\.\d+)?) \w+ about [A-Z]/g)].map(m => Number(m[1]));
  if (!L || r.length !== 2) return undefined;
  const c = Number(L[1]), [a, b] = r;
  if (a + b > c + EPS && Math.abs(a - b) < c - EPS) return pick(q, x => /cross above the base/.test(x));
  if (eq(a + b, c) || eq(Math.abs(a - b), c)) return pick(q, x => /meet only on the base/.test(x));
  return pick(q, x => /never meet/.test(x));
};
S.arcsSetup = q => {
  const t = plain(q.prompt);
  let m = t.match(/compass is set to (\d+(?:\.\d+)?) (\w+) and swung about ([A-Z])/);
  if (m) return pick(q, c => c === `Every point ${m[1]} ${m[2]} from ${m[3]}`);
  m = t.match(/test whether (\d+(?:\.\d+)?) \w+, (\d+(?:\.\d+)?) \w+ and (\d+(?:\.\d+)?) \w+ make a triangle/);
  if (!m) return undefined;
  const L = [m[1], m[2], m[3]].map(Number);
  return pick(q, c => {
    const k = c.match(/^Base (\d+(?:\.\d+)?) \w+; arcs of (\d+(?:\.\d+)?) \w+ and (\d+(?:\.\d+)?) \w+ about its two ends$/);
    return !!k && sameSet([k[1], k[2], k[3]].map(Number), L);
  });
};

// ---- s1: triangle existence ----
const triKind = s => { const [a, b, c] = [...s].sort((x, y) => x - y); return a + b > c + EPS ? 'yes' : eq(a + b, c) ? 'flat' : 'no'; };
S.existCheck = q => {
  const m = plain(q.prompt).match(/Can (\d+(?:\.\d+)?) \w+, (\d+(?:\.\d+)?) \w+ and (\d+(?:\.\d+)?) \w+ be/);
  if (!m) return undefined;
  const k = triKind([m[1], m[2], m[3]].map(Number));
  return pick(q, c => (k === 'yes' ? /^Yes/.test(c) : k === 'flat' ? /^No: .*exactly/.test(c) : /^No: .*less than/.test(c)));
};
function setsOf(q) {
  return [...plain(q.prompt).matchAll(/Set ([A-Z]): ([\d., ]+?)\.(?:\s|$)/g)].map(m => ({ name: m[1], v: nums(m[2]) }));
}
S.whichSet = q => {
  const sets = setsOf(q);
  if (sets.length < 2) return undefined;
  const ok = sets.filter(s => s.v.length === 3 && triKind(s.v) === 'yes').map(s => s.name);
  if (ok.length !== 1) return -1;
  return pick(q, c => c === `Set ${ok[0]}`);
};
S.oneCheck = q => {
  const m = plain(q.prompt).match(/whether (\d+(?:\.\d+)?) \w+, (\d+(?:\.\d+)?) \w+ and (\d+(?:\.\d+)?) \w+ make/);
  if (!m) return undefined;
  const v = [m[1], m[2], m[3]].map(Number), mx = Math.max(...v);
  const rest = [...v]; rest.splice(rest.indexOf(mx), 1);
  return pick(q, c => {
    const k = c.match(/^Is (\d+(?:\.\d+)?) \+ (\d+(?:\.\d+)?) > (\d+(?:\.\d+)?)\?$/);
    return !!k && Number(k[3]) === mx && sameSet([Number(k[1]), Number(k[2])], rest);
  });
};

// ---- s2: isosceles unknowns ----
/** "X̅H̅ ≅ H̅R̅" → { apex: 'H', base: ['X','R'] } */
function apexOf(t) {
  const m = plain(t).match(/\b([A-Z]{2}) ≅ ([A-Z]{2})\b(?! ≅)/);
  if (!m) return null;
  const sh = m[1].split('').filter(c => m[2].includes(c));
  if (sh.length !== 1) return null;
  const apex = sh[0];
  return { apex, base: [m[1].replace(apex, ''), m[2].replace(apex, '')] };
}
S.isoAngle = q => {
  const t = plain(q.prompt);
  const A = apexOf(t);
  const g = t.match(/m∠([A-Z]) = (\d+(?:\.\d+)?)°/), f = t.match(/Find m∠([A-Z])/);
  if (!A || !g || !f) return undefined;
  const gv = g[1], v = Number(g[2]), tv = f[1];
  if (gv === tv) return v;
  if (gv === A.apex) return clean((180 - v) / 2);
  if (tv === A.apex) return clean(180 - 2 * v);
  return v; // both base angles
};
S.isoSides = q => {
  const t = plain(q.prompt), T = triOf(q);
  const m = t.match(/∠([A-Z]) ≅ ∠([A-Z])/);
  if (!m || !T) return undefined;
  const eqSides = [sortStr(sideOpp(T, m[1])), sortStr(sideOpp(T, m[2]))];
  const vals = {};
  for (const k of t.matchAll(/\b([A-Z]{2}) = (\([^)]*\)|\d+(?:\.\d+)?)/g)) { const L = linear(k[2]); if (L) vals[sortStr(k[1])] = L; }
  let x;
  if (vals[eqSides[0]] && vals[eqSides[1]] && (vals[eqSides[0]][0] || vals[eqSides[1]][0])) x = solveLin(vals[eqSides[0]], vals[eqSides[1]]);
  const f = t.match(/Find ([A-Z]{2}|x)\b/);
  if (!f) return undefined;
  if (f[1] === 'x') return x === undefined ? undefined : clean(x);
  const tgt = sortStr(f[1]);
  if (vals[tgt] && (vals[tgt][0] === 0 || x !== undefined)) return clean(evalL(vals[tgt], x));
  const partner = eqSides[0] === tgt ? eqSides[1] : eqSides[1] === tgt ? eqSides[0] : null;
  if (partner && vals[partner]) return clean(evalL(vals[partner], x));
  return undefined;
};
/** the system of an isosceles triangle with angle expressions: x and every angle */
function isoSystem(t) {
  const A = apexOf(t);
  if (!A) return null;
  const ex = {};
  for (const k of t.matchAll(/m∠([A-Z]) = (\([^)]*\)|\d+(?:\.\d+)?)°/g)) { const L = linear(k[2]); if (L) ex[k[1]] = L; }
  const [b1, b2] = A.base;
  let x;
  if (ex[b1] && ex[b2]) x = solveLin(ex[b1], ex[b2]);
  else {
    const b = ex[b1] ?? ex[b2], a = ex[A.apex];
    if (b && a) x = solveLin([2 * b[0] + a[0], 2 * b[1] + a[1]], [0, 180]);
  }
  if (x === undefined) return null;
  const base = ex[b1] ? evalL(ex[b1], x) : ex[b2] ? evalL(ex[b2], x) : (180 - evalL(ex[A.apex], x)) / 2;
  const apex = ex[A.apex] ? evalL(ex[A.apex], x) : 180 - 2 * base;
  return { x, ang: { [A.apex]: apex, [b1]: base, [b2]: base } };
}
S.isoAlgebra = q => {
  const t = plain(q.prompt), sys = isoSystem(t);
  const f = t.match(/Find (x|m∠([A-Z]))\b/);
  if (!sys || !f) return undefined;
  return clean(f[1] === 'x' ? sys.x : sys.ang[f[2]]);
};

// ---- s2: range of the third side ----
function twoSides(t) {
  const m = plain(t).match(/sides of a triangle are (\d+(?:\.\d+)?) \w+ and (\d+(?:\.\d+)?) \w+/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}
S.rangePair = q => {
  const s = twoSides(q.prompt);
  return s ? [clean(Math.abs(s[0] - s[1])), clean(s[0] + s[1])] : undefined;
};
S.rangeCount = q => {
  const s = twoSides(q.prompt);
  if (!s) return undefined;
  const lo = Math.abs(s[0] - s[1]), hi = s[0] + s[1];
  let n = 0;
  for (let k = Math.floor(lo) - 1; k <= Math.ceil(hi) + 1; k++) if (k > 0 && k > lo + EPS && k < hi - EPS) n++;
  return n;
};
S.rangePick = q => {
  const s = twoSides(q.prompt);
  if (!s) return undefined;
  const lo = Math.abs(s[0] - s[1]), hi = s[0] + s[1];
  if (/every possible length/.test(q.prompt)) {
    return pick(q, c => {
      const m = c.match(/^(\d+(?:\.\d+)?) < x < (\d+(?:\.\d+)?)$/);
      return !!m && eq(Number(m[1]), lo) && eq(Number(m[2]), hi);
    });
  }
  return pick(q, c => { const v = nums(c); return v.length === 1 && v[0] > lo + EPS && v[0] < hi - EPS; });
};

// =====================================================================================================================
// proofs
/** a proof statement (TeX) → plain text */
function texSt(t) {
  let s = String(t ?? '');
  for (let i = 0; i < 3; i++) s = s.replace(/\\(?:overline|overrightarrow)\{([^{}]*)\}/g, '$1').replace(/\\text\{([^{}]*)\}/g, ' $1 ');
  s = s.replace(/\\angle\s*/g, '∠').replace(/\\triangle\s*/g, '△').replace(/\\cong/g, '≅').replace(/\\parallel/g, '∥').replace(/\\ell/g, 'ℓ')
    .replace(/\^\{?\\circ\}?/g, '°').replace(/\\[,;: ]|\\quad|\\qquad|~/g, ' ').replace(/[{}]/g, '').replace(/\\[a-zA-Z]+/g, ' ');
  return plain(s);
}
/** a part named in a statement, within the proof's triangle T: { t:'s', k } | { t:'a', k } (k = a canonical key) */
function partKey(txt, T) {
  const s = plain(txt);
  let m = s.match(/^∠([A-Z])([A-Z])([A-Z])$/);
  if (m) return { t: 'a', v: m[2], k: 'a' + m[2] + sortStr(m[1] + m[3]) };
  m = s.match(/^∠([A-Z])$/);
  if (m) { const o = T ? sideOpp(T, m[1]) : ''; return { t: 'a', v: m[1], k: 'a' + m[1] + sortStr(o) }; }
  m = s.match(/^([A-Z]{2})$/);
  if (m) return { t: 's', k: 's' + sortStr(m[1]) };
  return null;
}
function parseSt(st, T) {
  const s = texSt(st);
  let m = s.match(/^△([A-Z]{3}) ≅ △([A-Z]{3})$/);
  if (m) return { kind: 'tri', a: m[1], b: m[2], s };
  m = s.match(/^(∠?[A-Z]{1,3}) ≅ (∠?[A-Z]{1,3})$/);
  if (m) { const a = partKey(m[1], T), b = partKey(m[2], T); if (a && b) return { kind: 'cong', a, b, raw: [m[1], m[2]], s }; }
  return { kind: 'other', s };
}
/** the criteria (SSS, SAS, ASA, AAS) that the known congruences give for △A ≅ △B. `implicit`: a part matched with
 *  itself counts without a line (a shared side or angle); in a proof it must be a stated line (Reflexive). */
function criteria(A, B, known, implicit = false) {
  const same = (x, y) => (implicit && x.k === y.k) || known.some(([p, r]) => (p.k === x.k && r.k === y.k) || (p.k === y.k && r.k === x.k));
  const side = (X, i) => ({ k: 's' + sortStr(X[i] + X[(i + 1) % 3]) });
  const ang = (X, i) => ({ k: 'a' + X[i] + sortStr(sideOpp(X, X[i])) });
  const S3 = [0, 1, 2].map(i => same(side(A, i), side(B, i)));      // side i joins vertex i and i+1
  const A3 = [0, 1, 2].map(i => same(ang(A, i), ang(B, i)));
  const nS = S3.filter(Boolean).length;
  const out = [];
  if (nS === 3) out.push('SSS');
  if ([0, 1, 2].some(v => A3[v] && S3[(v + 2) % 3] && S3[v])) out.push('SAS');   // angle v between sides v-1 and v
  if ([0, 1, 2].some(s => S3[s] && A3[s] && A3[(s + 1) % 3])) out.push('ASA');
  // two angles (at u, w) and a side not between them
  for (let u = 0; u < 3; u++) for (let w = u + 1; w < 3; w++) if (A3[u] && A3[w]) {
    const between = (u + 1) % 3 === w ? u : w; // side index joining u and w
    if ([0, 1, 2].some(sd => sd !== between && S3[sd]) && !out.includes('AAS')) out.push('AAS');
  }
  return out;
}
/** the corresponding pair of parts under △A ≅ △B (by letters) */
function corresponds(A, B, p, r) {
  const map = {}; for (let i = 0; i < 3; i++) map[A[i]] = B[i];
  const img = x => {
    if (x.t === 's') return 's' + sortStr(x.k.slice(1).split('').map(c => map[c] ?? '?').join(''));
    return 'a' + (map[x.v] ?? '?') + sortStr(x.k.slice(2).split('').map(c => map[c] ?? '?').join(''));
  };
  return img(p) === r.k || img(r) === p.k;
}
/** the reason a line of the isosceles / converse proof needs, or a flaw */
function reasonOf(rows, i, given, T) {
  const P = rows.map(r => parseSt(r.st, T));
  const G = given.map(g => parseSt(g, T));
  const L = P[i];
  const before = P.slice(0, i);
  if (L.kind === 'cong') {
    if (G.some(g => g.kind === 'cong' && g.s === L.s)) return 'Given';
    if (L.a.k === L.b.k) return 'Reflexive Property of Congruence';
    if (before.some(b => b.kind === 'cong' && b.a.k === L.b.k && b.b.k === L.a.k)) return 'Symmetric Property of Congruence';
    const tri = before.find(b => b.kind === 'tri' && corresponds(b.a, b.b, L.a, L.b));
    if (tri) return 'CPCTC';
    return 'FLAW';
  }
  if (L.kind === 'tri') {
    const known = [...G, ...before].filter(b => b.kind === 'cong').map(b => [b.a, b.b]);
    const c = criteria(L.a, L.b, known);
    return c.length ? c : 'FLAW';
  }
  return null;
}
const reasonPick = (q, r) => pick(q, c => (Array.isArray(r) ? r : [r]).some(x => c.toLowerCase() === String(x).toLowerCase()));
const askedRow = q => q.data?.picture?.proof?.ask?.[0]?.i;

S.isoProofReason = q => {
  const pr = q.data?.picture?.proof, T = triOf(q) ?? pr?.rows?.map(r => texSt(r.st).match(/△([A-Z]{3})/)?.[1]).find(Boolean);
  const i = askedRow(q);
  if (!pr || i === undefined) return undefined;
  const r = reasonOf(pr.rows, i, pr.given, T);
  return r && r !== 'FLAW' ? reasonPick(q, r) : -1;
};
S.convProofReason = S.isoProofReason;
S.isoProofCorr = q => {
  const t = plain(q.prompt), T = triOf(q), A = apexOf(t);
  if (!T || !A) return undefined;
  const swap = { [A.base[0]]: A.base[1], [A.base[1]]: A.base[0], [A.apex]: A.apex };
  const img = T.split('').map(c => swap[c]).join('');
  return pick(q, c => c === '△' + img);
};
S.isoProofEarly = q => {
  const pr = q.data?.picture?.proof, t = plain(q.prompt);
  if (!pr) return undefined;
  const T = pr.rows.map(r => texSt(r.st).match(/△([A-Z]{3})/)?.[1]).find(Boolean) ?? (t.match(/([A-Z]{2}) ≅ ([A-Z]{2})/) ? null : null);
  const tri = T ?? (() => { const A = apexOf(t); return A ? A.apex + A.base.join('') : null; })();
  for (let i = 0; i < pr.rows.length; i++) {
    const cited = String(pr.rows[i].rs ?? '');
    if (/Isosceles Triangle Theorem/i.test(cited)) return pick(q, c => new RegExp(`^Line ${i + 1} cites the theorem it is trying to prove`).test(c));
    const need = reasonOf(pr.rows, i, pr.given, tri);
    if (/CPCTC/.test(cited) && need !== 'CPCTC') return pick(q, c => new RegExp(`^Line ${i + 1} uses CPCTC before the triangles are proved congruent`).test(c));
    if (need === 'FLAW') return -1;
    if (need && !(Array.isArray(need) ? need : [need]).some(x => x.toLowerCase() === cited.toLowerCase())) return -1; // another flaw: not covered by the choices
  }
  return pick(q, c => /^Nothing/.test(c));
};
S.convProofWhy = q => {
  const t = plain(q.prompt), T = triOf(q);
  if (/Is the argument valid\?/.test(t)) return pick(q, c => /^Not valid: the converse needs its own proof/.test(c));
  const m = t.match(/if ∠([A-Z]) ≅ ∠([A-Z]), then ([A-Z]{2}) ≅ ([A-Z]{2})/);
  if (!m || !T) return undefined;
  return pick(q, c => {
    const k = c.match(/^△([A-Z]{3}) ≅ △([A-Z]{3}) by (\w+)$/);
    if (!k) return false;
    const known = [[partKey('∠' + m[1], k[1]), partKey('∠' + m[2], k[1])], [partKey('∠' + m[2], k[1]), partKey('∠' + m[1], k[1])]];
    return criteria(k[1], k[2], known, true).includes(k[3]) && k[1] !== k[2];
  });
};

// ---- s3: angle sum ----
/** is the numbered angle k (at the apex, between ℓ and a side) alternate interior (or corresponding) with the base angle at V? */
function parallelPair(F, k, V) {
  const a = F.angs.find(x => String(x.text) === String(k) && x.nameOnly);
  const apex = a ? F.nameAt(a.v) : null;
  if (!a || !apex || !F.pts[V]) return null;
  const toV = unit(sub(F.pts[V], a.v));
  const d1 = unit(sub(a.p, a.v)), d2 = unit(sub(a.q, a.v));
  let lineRay;
  if (angDeg(d1, toV) < 0.8) lineRay = d2; else if (angDeg(d2, toV) < 0.8) lineRay = d1; else return null;
  // the base: the side from V to the third vertex (not the apex), drawn parallel to ℓ
  const W = Object.keys(F.pts).find(n => n !== apex && n !== V);
  const base = unit(sub(F.pts[W], F.pts[V]));
  if (Math.abs(cross(base, lineRay)) > 0.02) return null; // not parallel
  return dot(base, lineRay) < 0 ? 'alt' : 'corr';
}
function sumReasonOf(q, st) {
  const F = readFig(q);
  const s = texSt(st);
  if (/ℓ ∥/.test(s)) return pick(q, c => /^Parallel Postulate$/.test(c));
  let m = s.match(/^m∠(\d) = m∠([A-Z])$/);
  if (m) {
    const kind = parallelPair(F, m[1], m[2]);
    if (kind === 'alt') return pick(q, c => /^Alternate Interior Angles Theorem$/.test(c));
    if (kind === 'corr') return pick(q, c => /^Corresponding Angles Postulate$/.test(c));
    return -1;
  }
  if (/^m∠1 \+ m∠2 \+ m∠3 = 180°$/.test(s)) {
    // the three angles at the apex lie along ℓ: a straight angle split in three
    const a = ['1', '2', '3'].map(k => F.angs.find(x => String(x.text) === k));
    if (a.some(x => !x) || !eq(a[0].meas + a[1].meas + a[2].meas, 180, 0.5)) return -1;
    return pick(q, c => /^Angle Addition Postulate$/.test(c));
  }
  m = s.match(/^m∠([A-Z]) \+ m∠2 \+ m∠([A-Z]) = 180°$/);
  if (m) return pick(q, c => /^Substitution Property of Equality$/.test(c));
  return undefined;
}
S.sumReason = q => {
  const pr = q.data?.picture?.proof, i = askedRow(q);
  if (!pr || i === undefined) return undefined;
  return sumReasonOf(q, pr.rows[i].st);
};
S.sumAux = q => {
  const t = plain(q.prompt), T = triOf(q);
  if (/which line do you draw first/.test(t)) {
    return pick(q, c => {
      const m = c.match(/^The line through ([A-Z]) parallel to ([A-Z]{2})$/);
      return !!m && T.includes(m[1]) && !m[2].includes(m[1]) && m[2].split('').every(x => T.includes(x));
    });
  }
  const m = t.match(/Why is m∠(\d) = m∠([A-Z])\?/);
  if (m) {
    const kind = parallelPair(readFig(q), m[1], m[2]);
    if (kind === 'alt') return pick(q, c => /^They are alternate interior angles/.test(c));
    if (kind === 'corr') return pick(q, c => /^They are corresponding angles/.test(c));
    return -1;
  }
  return undefined;
};
S.sumWhy = q => pick(q, c => /^No: measured cases are evidence; a proof must cover every triangle$/.test(c));

// ---- s3: exterior angles ----
S.extMissing = q => {
  const t = plain(q.prompt);
  const m = t.match(/(?:measure|are) (\d+(?:\.\d+)?)° and (\d+(?:\.\d+)?)°/);
  return m ? clean(360 - Number(m[1]) - Number(m[2])) : undefined;
};
function extSystem(t) {
  const ex = {};
  for (const k of plain(t).matchAll(/(\([^)]*\))° at ([A-Z])/g)) { const L = linear(k[1]); if (L) ex[k[2]] = L; }
  const Ls = Object.values(ex);
  if (Ls.length !== 3) return null;
  const sum = Ls.reduce((s, L) => [s[0] + L[0], s[1] + L[1]], [0, 0]);
  const x = solveLin(sum, [0, 360]);
  return x === undefined ? null : { x, ex };
}
S.extAlgebra = q => {
  const t = plain(q.prompt), sys = extSystem(t);
  const f = t.match(/Find (x|the exterior angle at ([A-Z]))\b/);
  if (!sys || !f) return undefined;
  return clean(f[1] === 'x' ? sys.x : evalL(sys.ex[f[2]], sys.x));
};
S.extProof = q => {
  const t = plain(q.prompt);
  if (q.input === 'num') {
    const m = t.match(/the (three|two|\d+) linear pairs together total/);
    if (!m) return undefined;
    const n = { two: 2, three: 3 }[m[1]] ?? Number(m[1]);
    return n * 180;
  }
  if (/always add to 360°/.test(t)) {
    return pick(q, c => {
      const m = c.match(/^Three linear pairs make (\d+)°; the interior angles take (\d+)°; (\d+)° - (\d+)° = (\d+)°$/);
      return !!m && Number(m[1]) === 3 * 180 && Number(m[2]) === 180 && Number(m[3]) === Number(m[1]) && Number(m[4]) === Number(m[2]) && Number(m[5]) === 360;
    });
  }
  if (/two exterior angles/.test(t) && /only one per vertex/.test(t)) {
    return pick(q, c => /^The two are vertical angles of equal size; counting both would double the total to 720°$/.test(c));
  }
  return undefined;
};

// ---- s3: triangle-inequality proof ----
/** the reason a line of the BA-extended proof needs: decided by what the line states, checked on the figure */
function ineqReason(q, rows, i) {
  const s = texSt(rows[i].st);
  const pr = q.data.picture.proof;
  const giv = texSt(pr.given.join(' ')).match(/([A-Z]{2}) = ([A-Z]{2})/);
  let m;
  if (giv && s === `${giv[1]} = ${giv[2]}`) return 'Construction';
  m = s.match(/^m∠([A-Z]{3}) = m∠([A-Z]{3})$/);
  if (m && giv) {
    // two angles of one triangle facing the two constructed-equal sides
    const tri = new Set(m[1] + m[2]);
    const a = m[1], b = m[2];
    const facing = x => sortStr(x[0] + x[2]);
    if (tri.size === 3 && a[1] !== b[1] && sameSet([facing(a), facing(b)], [sortStr(giv[1]), sortStr(giv[2])])) return 'Isosceles Triangle Theorem';
    return 'FLAW';
  }
  m = s.match(/^m∠([A-Z]{3}) > m∠([A-Z]{3})$/);
  if (m) {
    const [a, b] = [m[1], m[2]];
    if (a[1] === b[1] && a[2] === b[2] && a[0] !== b[0]) return 'Angle Addition Postulate'; // a part of the angle is smaller than the whole
    // the previous line with an equal angle replaced (∠JUT is ∠NUT: J lies on NU)
    return 'Substitution Property of Equality';
  }
  m = s.match(/^([A-Z]{2}) > ([A-Z]{2})$/);
  if (m) return 'Larger angle faces longer side';
  m = s.match(/^([A-Z]{2}) = ([A-Z]{2}) \+ ([A-Z]{2})$/);
  if (m && m[1][0] === m[2][0] && m[2][1] === m[3][0] && m[3][1] === m[1][1]) return 'Segment Addition Postulate';
  m = s.match(/^([A-Z]{2}) \+ ([A-Z]{2}) > ([A-Z]{2})$/);
  if (m) return 'Substitution Property of Equality';
  return null;
}
S.ineqProofReason = q => {
  const pr = q.data?.picture?.proof, i = askedRow(q);
  if (!pr || i === undefined) return undefined;
  const r = ineqReason(q, pr.rows, i);
  if (!r || r === 'FLAW') return -1;
  return reasonPick(q, r);
};
S.ineqBoundary = q => {
  const t = plain(q.prompt);
  const m = t.match(/from (\w+) to (\w+) is (\d+(?:\.\d+)?) mi\. The straight road from (\w+) to (\w+) is (\d+(?:\.\d+)?) mi, and from (\w+) to (\w+) is (\d+(?:\.\d+)?) mi/);
  if (!m) return undefined;
  const D = Number(m[3]), a = Number(m[6]), b = Number(m[9]), mid = m[5];
  const k = triKind([D, a, b]);
  if (k === 'yes') return pick(q, c => new RegExp(`^${mid} lies off the road: the towns form a triangle`).test(c));
  if (k === 'flat' && eq(a + b, D)) return pick(q, c => new RegExp(`^${mid} lies on the straight road`).test(c));
  return pick(q, c => /^These distances are impossible/.test(c));
};
S.ineqAlgebra = q => {
  const t = plain(q.prompt);
  const m = t.match(/sides (\d+(?:\.\d+)?) \w+, (\d+(?:\.\d+)?) \w+ and \(([^)]*)\)/);
  if (!m) return undefined;
  const a = Number(m[1]), b = Number(m[2]), L = linear(m[3]);
  if (!L || !(L[0] > 0)) return undefined;
  const lo = Math.abs(a - b), hi = a + b;
  return [clean((lo - L[1]) / L[0]), clean((hi - L[1]) / L[0])];
};

// =====================================================================================================================
// sane
function sane(q) {
  const t = plain(q.prompt), F = readFig(q), T = triOf(q);
  const out = [];
  // labelled angles drawn at their measure; labelled sides drawn in proportion; labels make a triangle
  if (F && T && F.pts[T[0]]) {
    for (const v of T) {
      const a = angAt(F, T, v);
      if (a && isNum(a.text) && Math.abs(drawnAngle(F, T, v) - numOf(a.text)) > 1.5) out.push(`∠${v} is labelled ${a.text} but drawn ${drawnAngle(F, T, v).toFixed(1)}°`);
    }
    const sv = sideValues(F, T), ks = Object.keys(sv);
    if (ks.length === 3 && triKind(Object.values(sv)) !== 'yes') out.push(`sides ${Object.values(sv).join(', ')}: no triangle`);
    if (ks.length >= 2) {
      const ratio = ks.map(k => len(sub(F.pts[k[0]], F.pts[k[1]])) / sv[k]);
      if (Math.max(...ratio) / Math.min(...ratio) > 1.06) out.push('labelled sides not drawn in proportion');
    }
    const av = angleValues(F, T), ka = T.split('').filter(v => av[v] !== undefined);
    if (ka.length === 3 && ka.some(v => !(av[v] > 0))) out.push('the labelled angles leave no room for a third');
  }
  switch (q.family) {
    case 'orderAngles': {
      const sv = sideValues(F, T);
      if (/smallest|largest/.test(t) && !/Order/.test(t)) {
        const vs = Object.values(sv), ext = /smallest/.test(t) ? Math.min(...vs) : Math.max(...vs);
        if (vs.filter(v => eq(v, ext)).length > 1) out.push('two angles tie for the extreme, only single angles to pick');
      }
      break;
    }
    case 'orderSides': case 'orderRatio': {
      const a = nums(t.replace(/°/g, '° ').match(/m∠[A-Z] = \d+(?:\.\d+)?°/g)?.join(' ') ?? '');
      if (a.length >= 2 && !(a[0] + a[1] < 180)) out.push(`two angles add to ${a[0] + a[1]}°`);
      break;
    }
    case 'isoAngle': {
      const A = apexOf(t), g = t.match(/m∠([A-Z]) = (\d+(?:\.\d+)?)°/);
      if (A && g) {
        const v = Number(g[2]);
        if (g[1] === A.apex && !(v < 180)) out.push('apex angle of 180° or more');
        if (g[1] !== A.apex && !(v < 90)) out.push('a base angle of 90° or more');
      }
      break;
    }
    case 'isoAlgebra': {
      const sys = isoSystem(t);
      if (sys && Object.values(sys.ang).some(v => !(v > 0))) out.push('an angle comes out 0° or negative');
      if (sys) for (const k of t.matchAll(/m∠([A-Z]) = (\([^)]*\))°/g)) { const L = linear(k[2]); if (L && !(evalL(L, sys.x) > 0)) out.push(`${k[2]} is not positive at x = ${sys.x}`); }
      break;
    }
    case 'isoSides': {
      const vals = [...t.matchAll(/\b([A-Z]{2}) = (\([^)]*\)|\d+(?:\.\d+)?)/g)];
      const x = (() => { const m = t.match(/∠([A-Z]) ≅ ∠([A-Z])/); if (!m) return undefined; const e = vals.map(v => linear(v[2])); return e.length === 2 && (e[0][0] || e[1][0]) ? solveLin(e[0], e[1]) : undefined; })();
      for (const v of vals) { const L = linear(v[2]); if (L && !(evalL(L, x) > 0)) out.push(`${v[1]} is not positive`); }
      // two equal legs s and a base b: b < 2s
      const m = t.match(/∠([A-Z]) ≅ ∠([A-Z])/);
      if (m && T && x === undefined) {
        const val = {}; for (const v of vals) val[sortStr(v[1])] = Number(v[2]);
        const leg = val[sortStr(sideOpp(T, m[1]))] ?? val[sortStr(sideOpp(T, m[2]))], base = val[sortStr(m[1] + m[2])];
        if (leg !== undefined && base !== undefined && !(base < 2 * leg)) out.push('the legs are too short for the base');
      }
      break;
    }
    case 'extMissing': {
      const v = S.extMissing(q), m = t.match(/(?:measure|are) (\d+(?:\.\d+)?)° and (\d+(?:\.\d+)?)°/);
      if (m && [Number(m[1]), Number(m[2]), v].some(a => !(a > 0 && a < 180))) out.push('an exterior angle outside 0°-180°');
      break;
    }
    case 'extAlgebra': {
      const sys = extSystem(t);
      if (!sys) break;
      for (const L of Object.values(sys.ex)) { const v = evalL(L, sys.x); if (!(v > 0 && v < 180)) out.push(`an exterior angle of ${v}°`); }
      break;
    }
    case 'rangePick': case 'rangePair': case 'rangeCount': case 'ineqAlgebra': {
      const s = twoSides(t) ?? (t.match(/sides (\d+(?:\.\d+)?) \w+, (\d+(?:\.\d+)?)/) ? nums(t).slice(0, 2) : null);
      if (s && s.some(v => !(v > 0))) out.push('a side of 0');
      if (q.family === 'rangeCount' && S.rangeCount(q) === 0) out.push('no whole length fits');
      if (q.family === 'ineqAlgebra') { const r = S.ineqAlgebra(q); if (r && !(r[1] > 0)) out.push('x has no positive values'); }
      break;
    }
    case 'whichSet': {
      const ok = setsOf(q).filter(s => triKind(s.v) === 'yes');
      if (ok.length !== 1) out.push(`${ok.length} sets make a triangle`);
      break;
    }
    default:
  }
  return out.join('; ');
}

// =====================================================================================================================
export default {
  solve(q) {
    const f = S[q.family];
    return f ? f(q) : undefined;
  },
  sane,
};
