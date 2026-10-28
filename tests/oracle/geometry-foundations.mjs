// Oracle for the lesson "geometry-foundations" (Geometry: definitions, postulates and first proofs). Written from what
// the student sees only: the prompt, the board, the choices and the drawn figure (points, rays, lines, tick marks,
// right-angle boxes, arcs, parallel chevrons, measure labels), the statement cards and the proof frames.
//
// How it decides:
// - Figures: angle pairs are classified from the drawn rays (same vertex: vertical / linear pair / adjacent; two
//   vertices on one transversal: corresponding / alternate interior / alternate exterior / consecutive interior).
//   Sizes are read only from marks and labels, never from how the drawing looks.
// - Proofs: a small checker decides whether a line follows from the lines above it (and the givens) by the reason
//   it cites: Given, the definitions (midpoint, angle bisector, congruent, supplementary, complementary,
//   perpendicular), the postulates (Segment / Angle Addition, Linear Pair, Corresponding Angles), the theorems
//   (Vertical Angles, Alternate Interior / Exterior, Consecutive Interior, Congruent Supplements; never inside its own
//   proof), and the properties of equality by their structure (reflexive, symmetric, transitive, substitution,
//   addition, subtraction).
// - Truth of a statement about a figure: a linear model of the measures (rays as direction variables, points on a line
//   as coordinates, givens as equations) says whether the givens and the diagram's incidence force it.
// - Conceptual items (undefined terms, kinds of statements, conjecture vs theorem, scope of a claim, evidence vs
//   proof, the sphere) follow standard US high school geometry, decided per choice by what the choice says.
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".

// =====================================================================================================================
// text helpers
const OV = /̅/g;
const plain = s => String(s ?? '').replace(OV, '').replace(/−/g, '-').replace(/\s+/g, ' ').trim();
const low = s => plain(s).toLowerCase();
const num = s => parseFloat(String(s).replace(/−/g, '-'));
/** proof-frame TeX → the plain text the choices use (overlines kept as combining marks) */
function texSt(t) {
  let s = String(t ?? '');
  s = s.replace(/\\overrightarrow\{([^{}]*)\}/g, 'ray $1')
    .replace(/\\overline\{([^{}]*)\}/g, (_, x) => x.split('').map(c => c + '̅').join(''))
    .replace(/\\text\{([^{}]*)\}/g, '$1').replace(/\\angle\s*/g, '∠').replace(/\^\{?\\circ\}?/g, '°')
    .replace(/\\parallel/g, '∥').replace(/\\perp/g, '⊥').replace(/\\cong/g, '≅').replace(/\\ell/g, 'ℓ')
    .replace(/\\quad|\\qquad|\\[,;: ]/g, ' ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  return s;
}
const idxOf = (q, pred) => { const h = (q.choices ?? []).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0); return h; };

// =====================================================================================================================
// vectors
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = a => Math.hypot(a[0], a[1]);
const unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const near = (a, b, e = 1.5) => Math.abs(a[0] - b[0]) < e && Math.abs(a[1] - b[1]) < e;
const angDeg = (d1, d2) => (Math.acos(Math.max(-1, Math.min(1, dot(unit(d1), unit(d2))))) * 180) / Math.PI;
const sameDir = (d1, d2, tol = 1) => angDeg(d1, d2) < tol;
const oppDir = (d1, d2, tol = 1) => angDeg(d1, d2) > 180 - tol;

// =====================================================================================================================
// the figure: named points, labelled angles, lines
const DEFAULT_TRANSVERSAL = (() => { // the course's textbook slots 1-8 (used only when a proof frame has no figure)
  const vl = [-40, 150], vm = [40, -150], up = unit([-26, 97]), right = [1, 0];
  const A = (v, p, q, t) => ({ v, p: [v[0] + 100 * p[0], v[1] + 100 * p[1]], q: [v[0] + 100 * q[0], v[1] + 100 * q[1]], text: t });
  const L = [-1, 0], dn = [-up[0], -up[1]];
  return { segs: [{ kind: 'line', name: 'ℓ', a: [-400, 150], b: [400, 150] }, { kind: 'line', name: 'm', a: [-400, -150], b: [400, -150] }, { kind: 'line', name: 't', a: [80, -300], b: [-80, 300] }],
    angles: [A(vl, up, L, '1'), A(vl, right, up, '2'), A(vl, L, dn, '3'), A(vl, dn, right, '4'), A(vm, up, L, '5'), A(vm, right, up, '6'), A(vm, L, dn, '7'), A(vm, dn, right, '8')], points: [] };
})();
const DEFAULT_BISECTOR = names => { // ray VB bisects ∠AVC with ∠1 = ∠AVB, ∠2 = ∠BVC (no figure drawn)
  const [a, v, c, b] = names;
  const P = { [v]: [0, 0], [a]: [300, 0], [b]: [212, 212], [c]: [0, 300] };
  return { segs: [], points: Object.entries(P).map(([name, at]) => ({ name, at })), angles: [{ v: [0, 0], p: P[a], q: P[b], text: '1' }, { v: [0, 0], p: P[b], q: P[c], text: '2' }] };
};

function makeCtx(fig, extraOrder) {
  const ctx = { fig, pts: {}, ang: {}, order: [] };
  for (const p of fig?.points ?? []) if (p.name) ctx.pts[p.name] = p.at;
  for (const a of fig?.angles ?? []) if (a.text && /^\d+$/.test(a.text)) ctx.ang[a.text] = a;
  // an angle drawn with its value (or '?') instead of its number: the prompt names it (m∠3 = 67°, find m∠5)
  for (const a of fig?.angles ?? []) { const m = String(a.id ?? '').match(/^a(\d)$/); if (m && !ctx.ang[m[1]] && a.text && !/^\d+$/.test(a.text)) ctx.ang[m[1]] = a; }
  for (const o of extraOrder ?? []) {
    ctx.order.push(o);
    o.forEach((n, i) => { if (!ctx.pts[n]) ctx.pts[n] = [i * 100, 0]; });
  }
  return ctx;
}
/** an angle reference ('1' or 'ABC') → { v, d1, d2 } */
function angGeom(ref, ctx) {
  if (/^\d+$/.test(ref)) {
    const a = ctx.ang[ref]; if (!a) return null;
    return { v: a.v, d1: unit(sub(a.p, a.v)), d2: unit(sub(a.q, a.v)) };
  }
  const m = ref.match(/^([A-Z])([A-Z])([A-Z])$/); if (!m) return null;
  const A = ctx.pts[m[1]], B = ctx.pts[m[2]], C = ctx.pts[m[3]];
  if (!A || !B || !C) return null;
  return { v: B, d1: unit(sub(A, B)), d2: unit(sub(C, B)) };
}
const measOf = g => angDeg(g.d1, g.d2);
function angKey(ref, ctx) {
  const g = angGeom(ref, ctx);
  if (!g) return 'ang:' + (/^\d+$/.test(ref) ? ref : ref[1] + [ref[0], ref[2]].sort().join(''));
  const dirs = [g.d1, g.d2].map(d => ((Math.round((Math.atan2(d[1], d[0]) * 180) / Math.PI) % 360) + 360) % 360).sort((a, b) => a - b);
  return `ang@${Math.round(g.v[0])},${Math.round(g.v[1])}|${dirs.join(',')}`;
}
const segKey = ab => 'seg:' + ab.split('').sort().join('');

/** relation of two angles drawn in the figure */
function relation(r1, r2, ctx) {
  const A = angGeom(r1, ctx), B = angGeom(r2, ctx);
  if (!A || !B) return null;
  if (near(A.v, B.v)) {
    const sh = [];
    for (const a of [A.d1, A.d2]) for (const b of [B.d1, B.d2]) if (sameDir(a, b)) sh.push([a, b]);
    if (sh.length === 2) return { kind: 'same', cls: 'eq' };
    if (sh.length === 1) {
      const ao = sameDir(A.d1, sh[0][0]) ? A.d2 : A.d1, bo = sameDir(B.d1, sh[0][1]) ? B.d2 : B.d1;
      if (oppDir(ao, bo)) return { kind: 'lp', cls: 'sup' };
      const s = sameDir(A.d1, sh[0][0]) ? A.d1 : A.d2;
      if (Math.sign(cross(s, ao)) !== Math.sign(cross(s, bo))) return { kind: 'adj', cls: null };
      return { kind: 'overlap', cls: null };
    }
    const vert = (oppDir(A.d1, B.d1) && oppDir(A.d2, B.d2)) || (oppDir(A.d1, B.d2) && oppDir(A.d2, B.d1));
    if (vert) return { kind: 'vert', cls: 'eq' };
    return { kind: 'other', cls: null };
  }
  // two vertices: one ray of each must lie along the line through both vertices (the transversal)
  const T = unit(sub(B.v, A.v));
  const tray = g => [g.d1, g.d2].find(d => sameDir(d, T, 2) || oppDir(d, T, 2));
  const ta = tray(A), tb = tray(B);
  if (!ta || !tb) return { kind: 'none', cls: null };
  const la = ta === A.d1 ? A.d2 : A.d1, lb = tb === B.d1 ? B.d2 : B.d1;
  const sideA = Math.sign(cross(T, la)), sideB = Math.sign(cross(T, lb));
  const inA = dot(ta, T) > 0, inB = dot(tb, sub(A.v, B.v)) > 0; // the t-ray points toward the other line
  let kind;
  if (sideA === sideB && sameDir(ta, tb, 2)) kind = 'corr';
  else if (inA && inB && sideA !== sideB) kind = 'altint';
  else if (!inA && !inB && sideA !== sideB) kind = 'altext';
  else if (inA && inB && sideA === sideB) kind = 'consint';
  else if (!inA && !inB && sideA === sideB) kind = 'consext';
  else kind = 'other';
  // with the two lines parallel: equal when the line-rays point the same way relative to the t-rays
  const s1 = Math.sign(dot(la, lb)) * Math.sign(dot(ta, tb));
  return { kind, cls: s1 > 0 ? 'eq' : 'sup', needPar: true };
}
const KIND_NAME = { corr: 'corresponding angles', altint: 'alternate interior angles', altext: 'alternate exterior angles', consint: 'consecutive interior angles', vert: 'vertical angles', lp: 'a linear pair' };
const markedPar = fig => (fig?.segs ?? []).filter(s => s.kind === 'line' && s.par).length >= 2;

// =====================================================================================================================
// statements
/** a side 'm∠1 + m∠2' / 'DM + MG' / '180°' → linear combination { key: coef } ('1' = constant) */
function parseLin(side, ctx) {
  const lin = {};
  const terms = plain(side).replace(/\s*-\s*/g, ' + -').split(/\s*\+\s*/).filter(Boolean);
  for (let t of terms) {
    let sgn = 1; t = t.trim(); if (t.startsWith('-')) { sgn = -1; t = t.slice(1).trim(); }
    let m;
    if ((m = t.match(/^(\d+(?:\.\d+)?)°?$/))) lin['1'] = (lin['1'] ?? 0) + sgn * num(m[1]);
    else if ((m = t.match(/^m∠\s*(\d+|[A-Z]{3})$/))) { const k = angKey(m[1], ctx); lin[k] = (lin[k] ?? 0) + sgn; }
    else if ((m = t.match(/^([A-Z])([A-Z])$/))) { const k = segKey(m[1] + m[2]); lin[k] = (lin[k] ?? 0) + sgn; }
    else if ((m = t.match(/^(\d+)\s*·?\s*(m∠\s*(?:\d+|[A-Z]{3})|[A-Z]{2})$/))) { const l2 = parseLin(m[2], ctx); if (!l2) return null; for (const [k, v] of Object.entries(l2)) lin[k] = (lin[k] ?? 0) + sgn * num(m[1]) * v; }
    else return null;
  }
  return lin;
}
const figRef = (s, ctx) => {
  let m; s = plain(s);
  if ((m = s.match(/^∠\s*(\d+|[A-Z]{3})$/))) return angKey(m[1], ctx);
  if ((m = s.match(/^([A-Z])([A-Z])$/))) return segKey(m[1] + m[2]);
  return null;
};
/** one statement → { t: 'eq', L, R } | { t: 'cong', a, b } | facts; null when not understood */
function parseSt(text, ctx) {
  const s = plain(text).replace(/\.$/, '');
  let m;
  if ((m = s.match(/^([A-Z]) is the midpoint of ([A-Z])([A-Z])$/))) return { t: 'mid', m: m[1], a: m[2], b: m[3] };
  if ((m = s.match(/^ray ([A-Z])([A-Z]) bisects ∠([A-Z])([A-Z])([A-Z])$/))) return { t: 'bis', v: m[1], r: m[2], a: m[3], c: m[5] };
  if ((m = s.match(/^([a-zℓ]) ∥ ([a-zℓ])$/))) return { t: 'par', a: m[1], b: m[2] };
  if ((m = s.match(/^([a-zℓ]) ⊥ ([a-zℓ])$/))) return { t: 'perp', a: m[1], b: m[2] };
  if ((m = s.match(/^∠(\d+|[A-Z]{3}),? (?:and )?∠(\d+|[A-Z]{3}) (form a linear pair|are supplementary|are complementary|are vertical angles)$/))) {
    const t = { 'form a linear pair': 'lp', 'are supplementary': 'supp', 'are complementary': 'comp', 'are vertical angles': 'vertf' }[m[3]];
    return { t, a: angKey(m[1], ctx), b: angKey(m[2], ctx) };
  }
  if ((m = s.match(/^∠(\d+|[A-Z]{3}) is a right angle$/))) return { t: 'eq', L: { [angKey(m[1], ctx)]: 1 }, R: { 1: 90 } };
  if ((m = s.match(/^([A-Z](?:, [A-Z])+) in order on a line$/))) return { t: 'order', pts: m[1].split(', ') };
  if (/≅/.test(s)) {
    const [a, b] = s.split('≅').map(x => figRef(x, ctx));
    if (!a || !b) return null;
    return { t: 'cong', a, b };
  }
  if (/=/.test(s)) {
    const parts = s.split('=');
    if (parts.length !== 2) return null;
    const L = parseLin(parts[0], ctx), R = parseLin(parts[1], ctx);
    if (!L || !R) return null;
    return { t: 'eq', L, R };
  }
  return null;
}
// linear combinations
const clean = l => { const o = {}; for (const [k, v] of Object.entries(l)) if (Math.abs(v) > 1e-9) o[k] = v; return o; };
const addL = (a, b, s = 1) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = (o[k] ?? 0) + s * v; return clean(o); };
const eqL = (a, b) => { const d = addL(a, b, -1); return Object.keys(d).length === 0; };
const isZero = a => Object.keys(clean(a)).length === 0;
const within = (x, b) => Object.entries(clean(x)).every(([k, v]) => (b[k] ?? 0) * v > 0 && Math.abs(b[k]) >= Math.abs(v) - 1e-9);
const singleKey = l => { const c = clean(l), k = Object.keys(c); return k.length === 1 && c[k[0]] === 1 ? k[0] : null; };
function sameSt(a, b) {
  if (!a || !b || a.t !== b.t) return false;
  if (a.t === 'eq') return (eqL(a.L, b.L) && eqL(a.R, b.R)) || (eqL(a.L, b.R) && eqL(a.R, b.L));
  if (a.t === 'cong' || a.t === 'lp' || a.t === 'supp' || a.t === 'comp' || a.t === 'par' || a.t === 'perp') return (a.a === b.a && a.b === b.b) || (a.a === b.b && a.b === b.a);
  if (a.t === 'mid') return a.m === b.m && [a.a, a.b].sort().join() === [b.a, b.b].sort().join();
  if (a.t === 'bis') return a.v === b.v && a.r === b.r && [a.a, a.c].sort().join() === [b.a, b.c].sort().join();
  if (a.t === 'order') return a.pts.join() === b.pts.join() || a.pts.join() === [...b.pts].reverse().join();
  return false;
}
/** an equation or congruence as a pair of sides */
const sidesOf = st => (st?.t === 'eq' ? [st.L, st.R] : st?.t === 'cong' ? [{ [st.a]: 1 }, { [st.b]: 1 }] : null);

// =====================================================================================================================
// properties of equality, by structure
function orient(st) { const s = sidesOf(st); return s ? [s, [s[1], s[0]]] : []; }
const PROPS = {
  refl: (st) => { const s = sidesOf(st); return !!s && eqL(s[0], s[1]); },
  sym: (st, K) => K.some(p => { const a = sidesOf(p), b = sidesOf(st); return a && b && p.t === st.t && eqL(a[0], b[1]) && eqL(a[1], b[0]) && !eqL(a[0], a[1]); }),
  trans: (st, K) => {
    const [x, z] = sidesOf(st) ?? []; if (!x) return false;
    for (const p of K) for (const r of K) {
      if (p === r) continue;
      for (const [a, b] of orient(p)) for (const [c, d] of orient(r)) if (eqL(b, c) && ((eqL(a, x) && eqL(d, z)) || (eqL(a, z) && eqL(d, x)))) return true;
    }
    return false;
  },
  subst: (st, K) => {
    if (st.t !== 'eq') return false;
    // each side of an earlier equation P either stays or has one part replaced by an equal expression (another line)
    const swap = (P, B, B2) => eqL(B, B2) || K.some(E => E !== P && orient(E).some(([X, Y]) => within(X, B) && eqL(addL(addL(B, X, -1), Y), B2)));
    for (const P of K) { if (P.t !== 'eq') continue;
      for (const [A, B] of orient(P)) for (const [A2, B2] of orient(st)) {
        if (eqL(A, A2) && eqL(B, B2)) continue;
        if (swap(P, A, A2) && swap(P, B, B2)) return true;
      }
    }
    return false;
  },
  add: (st, K) => {
    if (st.t !== 'eq') return false;
    for (const P of K) { if (P.t !== 'eq') continue;
      for (const [A, B] of orient(P)) { const dL = addL(st.L, A, -1), dR = addL(st.R, B, -1); if (!isZero(dL) && eqL(dL, dR) && Object.values(dL).every(v => v > 0)) return true; }
      for (const P2 of K) { if (P2.t !== 'eq' || P2 === P) continue;
        for (const [A, B] of orient(P)) for (const [C, D] of orient(P2)) if (eqL(addL(A, C), st.L) && eqL(addL(B, D), st.R)) return true; }
    }
    return false;
  },
  subtr: (st, K) => {
    if (st.t !== 'eq') return false;
    for (const P of K) { if (P.t !== 'eq') continue;
      for (const [A, B] of orient(P)) { const dL = addL(A, st.L, -1), dR = addL(B, st.R, -1); if (!isZero(dL) && eqL(dL, dR) && Object.values(dL).every(v => v > 0)) return true; }
      for (const P2 of K) { if (P2.t !== 'eq' || P2 === P) continue;
        for (const [A, B] of orient(P)) for (const [C, D] of orient(P2)) if (eqL(addL(A, C, -1), st.L) && eqL(addL(B, D, -1), st.R)) return true; }
    }
    return false;
  },
};

// =====================================================================================================================
// reasons
function reasonCode(r) {
  const s = low(r).replace(/^(by )?the /, '');
  const T = [
    [/^given$/, 'given'], [/^definition of midpoint/, 'def-mid'], [/^definition of angle bisector/, 'def-bis'],
    [/^definition of congruent segments/, 'def-congseg'], [/^definition of congruent angles/, 'def-congang'],
    [/^definition of supplementary/, 'def-supp'], [/^definition of complementary/, 'def-comp'], [/^definition of perpendicular/, 'def-perp'],
    [/^segment addition postulate/, 'sap'], [/^angle addition postulate/, 'aap'], [/^linear pair postulate/, 'lpp'],
    [/^corresponding angles postulate/, 'cap'], [/^vertical angles theorem/, 'vat'], [/^alternate interior angles theorem/, 'aia'],
    [/^alternate exterior angles theorem/, 'aea'], [/^consecutive interior angles theorem/, 'cia'], [/^congruent supplements theorem/, 'cst'],
    [/^reflexive property/, 'refl'], [/^symmetric property/, 'sym'], [/^transitive property/, 'trans'], [/^substitution( property)?/, 'subst'],
    [/^addition property/, 'add'], [/^subtraction( property)?/, 'subtr'], [/looks that way/, 'looks'],
  ];
  for (const [re, c] of T) if (re.test(s)) return c;
  return null;
}
const REASON_TYPE = c => (c === 'given' ? 'given' : /^def-/.test(c) ? 'definition' : ['sap', 'aap', 'lpp', 'cap'].includes(c) ? 'postulate'
  : ['vat', 'aia', 'aea', 'cia', 'cst'].includes(c) ? 'theorem' : ['refl', 'sym', 'trans', 'subst', 'add', 'subtr'].includes(c) ? 'property' : null);
const THM_CODE = { 'vertical angles theorem': 'vat', 'alternate interior angles theorem': 'aia', 'alternate exterior angles theorem': 'aea', 'consecutive interior angles theorem': 'cia', 'congruent supplements theorem': 'cst' };

/** is X between P and Q (figure positions or a stated order) */
function between(P, X, Q, ctx) {
  const a = ctx.pts[P], b = ctx.pts[X], c = ctx.pts[Q];
  if (!a || !b || !c) return false;
  const u = sub(c, a), w = sub(b, a);
  if (Math.abs(cross(unit(u), w)) > 2) return false;
  const t = dot(w, u) / dot(u, u);
  return t > 0.01 && t < 0.99;
}
/** angle keys back to geometry */
function keyGeom(k) {
  const m = k.match(/^ang@(-?\d+),(-?\d+)\|(\d+),(\d+)$/); if (!m) return null;
  const d = x => [Math.cos((num(x) * Math.PI) / 180), Math.sin((num(x) * Math.PI) / 180)];
  return { v: [num(m[1]), num(m[2])], d1: d(m[3]), d2: d(m[4]) };
}
function relK(k1, k2, ctx) {
  const A = keyGeom(k1), B = keyGeom(k2); if (!A || !B) return null;
  const mk = g => ({ v: g.v, p: [g.v[0] + 100 * g.d1[0], g.v[1] + 100 * g.d1[1]], q: [g.v[0] + 100 * g.d2[0], g.v[1] + 100 * g.d2[1]] });
  return relation('1', '2', { ...ctx, ang: { 1: mk(A), 2: mk(B) } }) ?? null;
}
/** a two-angle claim: eq a = b (single terms) or a + b = c (constant); returns [k1, k2, 'eq'|'sum', value] */
function pairClaim(st) {
  if (st?.t === 'cong') return [st.a, st.b, 'eq'];
  if (st?.t !== 'eq') return null;
  const a = singleKey(st.L), b = singleKey(st.R);
  if (a && b) return [a, b, 'eq'];
  for (const [X, Y] of [[st.L, st.R], [st.R, st.L]]) {
    const ks = Object.keys(clean(X)), c = clean(Y);
    if (ks.length === 2 && ks.every(k => X[k] === 1) && Object.keys(c).length === 1 && c['1'] !== undefined) return [ks[0], ks[1], 'sum', c['1']];
  }
  return null;
}
const hasPar = K => K.some(s => s.t === 'par');

/** does `st` follow from the statements K (givens + lines above) by reason `code`? */
function validStep(st, code, K, ctx, G) {
  if (!st || !code) return false;
  if (ctx.proving && code === ctx.proving) return false;
  const pc = pairClaim(st);
  const rel = pc && pc[0].startsWith('ang') && pc[1].startsWith('ang') ? relK(pc[0], pc[1], ctx) : null;
  switch (code) {
    case 'given': return G.some(g => sameSt(g, st));
    case 'looks': return false;
    case 'def-mid': {
      if (st.t === 'mid') return K.some(p => { const s = sidesOf(p); return p.t === 'eq' && s && eqL(clean(s[0]), { [segKey(st.a + st.m)]: 1 }) && eqL(clean(s[1]), { [segKey(st.m + st.b)]: 1 }) || (s && eqL(clean(s[1]), { [segKey(st.a + st.m)]: 1 }) && eqL(clean(s[0]), { [segKey(st.m + st.b)]: 1 })); }) && between(st.a, st.m, st.b, ctx);
      const s = sidesOf(st); if (!s) return false;
      return K.some(p => p.t === 'mid' && ((eqL(s[0], { [segKey(p.a + p.m)]: 1 }) && eqL(s[1], { [segKey(p.m + p.b)]: 1 })) || (eqL(s[1], { [segKey(p.a + p.m)]: 1 }) && eqL(s[0], { [segKey(p.m + p.b)]: 1 }))));
    }
    case 'def-bis': {
      const s = sidesOf(st); if (!s) return false;
      return K.some(p => { if (p.t !== 'bis') return false; const x = { [angKey(p.a + p.v + p.r, ctx)]: 1 }, y = { [angKey(p.r + p.v + p.c, ctx)]: 1 };
        return (eqL(s[0], x) && eqL(s[1], y)) || (eqL(s[0], y) && eqL(s[1], x)); });
    }
    case 'def-congseg': case 'def-congang': {
      const want = code === 'def-congseg' ? 'seg' : 'ang';
      if (st.t === 'cong') return st.a.startsWith(want) && K.some(p => p.t === 'eq' && pairClaim(p)?.[2] === 'eq' && sameSt({ t: 'cong', a: pairClaim(p)[0], b: pairClaim(p)[1] }, st));
      if (st.t === 'eq' && pc && pc[2] === 'eq' && pc[0].startsWith(want)) return K.some(p => p.t === 'cong' && sameSt(p, { t: 'cong', a: pc[0], b: pc[1] }));
      return false;
    }
    case 'def-supp': case 'def-comp': {
      const v = code === 'def-supp' ? 180 : 90, f = code === 'def-supp' ? 'supp' : 'comp';
      if (st.t === f) return K.some(p => { const c = pairClaim(p); return c && c[2] === 'sum' && c[3] === v && sameSt({ t: f, a: c[0], b: c[1] }, st); });
      return !!pc && pc[2] === 'sum' && pc[3] === v && K.some(p => p.t === f && sameSt(p, { t: f, a: pc[0], b: pc[1] }));
    }
    case 'def-perp': {
      const s = sidesOf(st);
      return K.some(p => p.t === 'perp') && !!s && Object.keys(clean(s[1])).length === 1 && clean(s[1])['1'] === 90;
    }
    case 'sap': {
      if (st.t !== 'eq') return false;
      for (const [W, P] of [[st.L, st.R], [st.R, st.L]]) {
        const w = singleKey(W), parts = Object.entries(clean(P));
        if (!w || !w.startsWith('seg:') || parts.length !== 2 || parts.some(([k, c]) => c !== 1 || !k.startsWith('seg:'))) continue;
        const [x, y] = [w.slice(4, 5), w.slice(5, 6)], a = parts[0][0].slice(4), b = parts[1][0].slice(4);
        const mid = [...a].find(ch => b.includes(ch));
        if (!mid) continue;
        const ends = [...(a + b)].filter(ch => ch !== mid).sort().join('');
        if (ends === [x, y].sort().join('') && between(x, mid, y, ctx)) return true;
      }
      return false;
    }
    case 'aap': {
      if (st.t !== 'eq') return false;
      for (const [W, P] of [[st.L, st.R], [st.R, st.L]]) {
        const w = singleKey(W), parts = Object.entries(clean(P));
        if (!w || !w.startsWith('ang') || parts.length !== 2 || parts.some(([k, c]) => c !== 1 || !k.startsWith('ang'))) continue;
        const g = [w, parts[0][0], parts[1][0]].map(keyGeom);
        if (g.some(x => !x) || !near(g[0].v, g[1].v) || !near(g[0].v, g[2].v)) continue;
        const r = relK(parts[0][0], parts[1][0], ctx);
        if (r?.kind === 'adj' && Math.abs(measOf(g[1]) + measOf(g[2]) - measOf(g[0])) < 1) return true;
      }
      return false;
    }
    case 'lpp': return (!!pc && ((pc[2] === 'sum' && pc[3] === 180) ) && (rel?.kind === 'lp' || K.some(p => p.t === 'lp' && sameSt(p, { t: 'lp', a: pc[0], b: pc[1] }))))
      || (st.t === 'supp' && (relK(st.a, st.b, ctx)?.kind === 'lp' || K.some(p => p.t === 'lp' && sameSt(p, { ...st, t: 'lp' }))));
    case 'vat': return !!pc && pc[2] === 'eq' && rel?.kind === 'vert';
    case 'cap': return !!pc && pc[2] === 'eq' && rel?.kind === 'corr' && hasPar(K);
    case 'aia': return !!pc && pc[2] === 'eq' && rel?.kind === 'altint' && hasPar(K);
    case 'aea': return !!pc && pc[2] === 'eq' && rel?.kind === 'altext' && hasPar(K);
    case 'cia': return !!pc && pc[2] === 'sum' && pc[3] === 180 && rel?.kind === 'consint' && hasPar(K);
    case 'cst': {
      if (!pc || pc[2] !== 'eq') return false;
      const sup = K.map(p => (p.t === 'supp' ? [p.a, p.b] : (() => { const c = pairClaim(p); return c && c[2] === 'sum' && c[3] === 180 ? [c[0], c[1]] : null; })())).filter(Boolean);
      for (const s1 of sup) for (const s2 of sup) {
        if (s1 === s2) continue;
        const common = s1.find(x => s2.includes(x));
        if (!common) continue;
        const o1 = s1.find(x => x !== common), o2 = s2.find(x => x !== common);
        if ([o1, o2].sort().join() === [pc[0], pc[1]].sort().join()) return true;
      }
      return false;
    }
    case 'refl': return PROPS.refl(st);
    case 'sym': return PROPS.sym(st, K);
    case 'trans': return PROPS.trans(st, K);
    case 'subst': return PROPS.subst(st, K);
    case 'add': return PROPS.add(st, K);
    case 'subtr': return PROPS.subtr(st, K);
  }
  return false;
}

/** the proof frame of an item → { ctx, givens, prove, rows: [{ st, rs, text }] } */
function proofOf(q, fig) {
  const pr = q.data.picture.proof;
  const gTexts = pr.given.flatMap(g => texSt(g).split(/\s*;\s*/)).filter(Boolean);
  const orders = gTexts.map(g => g.match(/^([A-Z](?:, [A-Z])+) in order on a line$/)).filter(Boolean).map(m => m[1].split(', '));
  let f = fig ?? q.data.picture.fig;
  if (!f) {
    const all = [...gTexts, texSt(pr.prove), ...pr.rows.map(r => texSt(r.st))].join(' ');
    const bis = gTexts.map(g => g.match(/^ray ([A-Z])([A-Z]) bisects ∠([A-Z])([A-Z])([A-Z])$/)).find(Boolean);
    if (bis) f = DEFAULT_BISECTOR([bis[3], bis[1], bis[5], bis[2]]);
    else if (/∠\d/.test(all)) f = DEFAULT_TRANSVERSAL;
  }
  const ctx = makeCtx(f, orders);
  const givens = gTexts.map(g => parseSt(g, ctx));
  const prove = parseSt(texSt(pr.prove), ctx);
  const rows = pr.rows.map(r => ({ text: texSt(r.st), st: r.st ? parseSt(texSt(r.st), ctx) : null, rs: r.rs, code: r.rs ? reasonCode(r.rs) : null }));
  ctx.proving = provingOf(q, givens, prove, ctx);
  return { ctx, givens, prove, rows, pr };
}
/** the theorem a proof proves (citing it inside the proof is circular) */
function provingOf(q, givens, prove, ctx) {
  const m = q.prompt.match(/meant to prove the ([A-Z][A-Za-z ]+?(?:Theorem|Postulate))/);
  if (m) return THM_CODE[m[1].toLowerCase()] ?? null;
  const pc = pairClaim(prove);
  if (!pc || !pc[0].startsWith('ang')) return null;
  const rel = relK(pc[0], pc[1], ctx);
  if (givens.length === 1 && givens[0]?.t === 'par' && rel) {
    if (pc[2] === 'eq') return { altint: 'aia', altext: 'aea' }[rel.kind] ?? null;
    if (pc[2] === 'sum' && rel.kind === 'consint') return 'cia';
  }
  if (givens.length === 2 && givens.every(g => g?.t === 'lp') && pc[2] === 'eq' && rel?.kind === 'vert') return 'vat';
  if (givens.length === 2 && givens.every(g => g?.t === 'supp') && pc[2] === 'eq') return 'cst';
  return null;
}
/** check a whole proof (rows in order); returns the index of the first bad row, or -1 */
function checkRows(rows, P) {
  // a given that the proof writes as a line may be used only after that line
  const K = P.givens.filter(g => !rows.some(r => sameSt(r.st, g)) && !P.rows.some(r => sameSt(r.st, g)));
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r.st || !validStep(r.st, r.code, K, P.ctx, P.givens)) return i;
    K.push(r.st);
  }
  return sameSt(rows[rows.length - 1]?.st, P.prove) ? -1 : rows.length;
}

// =====================================================================================================================
// a linear model of a figure: is a statement forced by the givens and the diagram's incidence?
class Model {
  constructor(ctx, facts) {
    this.ctx = ctx; this.vars = new Map(); this.rows = [];
    const par = facts.some(f => f?.t === 'par');
    // rays at each vertex; union along one line (same direction) and, with ℓ ∥ m given, along the parallel lines
    this.rays = []; // { v, d, id }
    this.parent = [];
    const angs = Object.values(ctx.ang);
    for (const a of angs) for (const d of [unit(sub(a.p, a.v)), unit(sub(a.q, a.v))]) this.ray(a.v, d);
    const n = this.rays.length;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const A = this.rays[i], B = this.rays[j];
      if (near(A.v, B.v) || !sameDir(A.d, B.d, 1)) continue;
      const onLine = Math.abs(cross(A.d, sub(B.v, A.v))) < 2;
      if (onLine || par) this.union(i, j);
    }
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const A = this.rays[i], B = this.rays[j];
      if (near(A.v, B.v) && oppDir(A.d, B.d, 1)) this.addRow({ [this.rv(j)]: 1, [this.rv(i)]: -1 }, -(this.rep(j) - this.rep(i)));
    }
    for (const f of facts) this.addFact(f);
  }
  ray(v, d) { let i = this.rays.findIndex(r => near(r.v, v) && sameDir(r.d, d, 0.5)); if (i < 0) { i = this.rays.length; this.rays.push({ v, d }); this.parent.push(i); } return i; }
  find(i) { while (this.parent[i] !== i) i = this.parent[i]; return i; }
  union(i, j) { this.parent[this.find(i)] = this.find(j); }
  rv(i) { return 'θ' + this.find(i); }
  rep(i) { const d = this.rays[this.find(i)].d; return (Math.atan2(d[1], d[0]) * 180) / Math.PI; }
  /** expression of a key: { var: coef, '1': const } */
  expr(k) {
    if (k === '1') return { 1: 1 };
    const g = keyGeom(k);
    if (g && this.rays.length) {
      const i = this.ray(g.v, g.d1), j = this.ray(g.v, g.d2);
      if (i >= this.parent.length || j >= this.parent.length) return { [k]: 1 };
      // measure = θj - θi (+ wrap), oriented so that the drawn value is positive
      const drawn = measOf(g);
      let e = { [this.rv(j)]: 1, [this.rv(i)]: -1 }, base = this.rep(j) - this.rep(i);
      if (cross(g.d1, g.d2) < 0) { e = { [this.rv(i)]: 1, [this.rv(j)]: -1 }; base = -base; }
      const c = Math.round((drawn - base) / 360) * 360;
      e = clean(e); e['1'] = c;
      return e;
    }
    const s = k.match(/^seg:([A-Z])([A-Z])$/);
    if (s) {
      const A = this.ctx.pts[s[1]], B = this.ctx.pts[s[2]];
      if (A && B) {
        const on = Object.keys(this.ctx.pts).filter(n => Math.abs(cross(unit(sub(B, A)), sub(this.ctx.pts[n], A))) < 2).sort();
        const line = on.join(''), O = this.ctx.pts[on[0]], D = sub(this.ctx.pts[on[1]], O); // one direction per line
        const t = n => dot(sub(this.ctx.pts[n], O), D);
        const [p, q] = t(s[1]) < t(s[2]) ? [s[1], s[2]] : [s[2], s[1]];
        return { [`x${line}.${q}`]: 1, [`x${line}.${p}`]: -1 };
      }
    }
    return { [k]: 1 };
  }
  lin(l) { let o = {}; for (const [k, v] of Object.entries(l)) { const e = this.expr(k); for (const [kk, vv] of Object.entries(e)) o[kk] = (o[kk] ?? 0) + v * vv; } return o; }
  addRow(e, c = 0) { const r = { ...e }; r['1'] = (r['1'] ?? 0) + c; this.rows.push(clean(r)); }
  eqOf(f) {
    const ctx = this.ctx;
    if (!f) return [];
    if (f.t === 'eq') return [addL(this.lin(f.L), this.lin(f.R), -1)];
    if (f.t === 'cong') return [addL(this.lin({ [f.a]: 1 }), this.lin({ [f.b]: 1 }), -1)];
    if (f.t === 'mid') return [addL(this.lin({ [segKey(f.a + f.m)]: 1 }), this.lin({ [segKey(f.m + f.b)]: 1 }), -1)];
    if (f.t === 'bis') return [addL(this.lin({ [angKey(f.a + f.v + f.r, ctx)]: 1 }), this.lin({ [angKey(f.r + f.v + f.c, ctx)]: 1 }), -1)];
    if (f.t === 'supp' || f.t === 'lp') return [addL(this.lin({ [f.a]: 1, [f.b]: 1 }), { 1: 180 }, -1)];
    if (f.t === 'comp') return [addL(this.lin({ [f.a]: 1, [f.b]: 1 }), { 1: 90 }, -1)];
    return [];
  }
  addFact(f) { for (const e of this.eqOf(f)) this.rows.push(clean(e)); }
  /** 1 = forced true, -1 = forced false, 0 = open */
  implies(f) {
    const es = this.eqOf(f); if (!es.length) return 0;
    const red = reduce(this.rows, es[0]);
    const vars = Object.keys(red).filter(k => k !== '1');
    if (!vars.length) return Math.abs(red['1'] ?? 0) < 1e-6 ? 1 : -1;
    return 0;
  }
}
function reduce(rows, target) {
  // Gaussian elimination (rows are sparse maps), then reduce target
  const R = [];
  for (const r0 of rows) {
    let r = { ...r0 };
    for (const p of R) if (Math.abs(r[p.piv] ?? 0) > 1e-12) r = clean(addL(r, p.row, -(r[p.piv] / p.row[p.piv])));
    const piv = Object.keys(r).find(k => k !== '1' && Math.abs(r[k]) > 1e-9);
    if (piv) R.push({ piv, row: r });
  }
  let t = { ...target };
  for (let pass = 0; pass < 2; pass++) for (const p of R) if (Math.abs(t[p.piv] ?? 0) > 1e-12) t = clean(addL(t, p.row, -(t[p.piv] / p.row[p.piv])));
  for (const k of Object.keys(t)) if (Math.abs(t[k]) < 1e-6) delete t[k];
  return t;
}

// =====================================================================================================================
// small algebra: linear expressions in x ('4x − 9', '(3x + 15)°')
function linX(s) {
  const t = plain(s).replace(/[()°]/g, '').replace(/\s+/g, '');
  let a = 0, b = 0;
  for (const m of t.replace(/-/g, '+-').split('+').filter(Boolean)) {
    const mm = m.match(/^(-?\d*(?:\.\d+)?)x$/);
    if (mm) a += mm[1] === '' ? 1 : mm[1] === '-' ? -1 : num(mm[1]);
    else if (/^-?\d+(?:\.\d+)?$/.test(m)) b += num(m);
    else return null;
  }
  return [a, b];
}
const solve1 = (e1, e2) => (e1[0] - e2[0] === 0 ? null : (e2[1] - e1[1]) / (e1[0] - e2[0])); // e1 = e2
const at = (e, x) => e[0] * x + e[1];

// =====================================================================================================================
// family solvers: each returns { a: answer, why: [] (world problems) }
const R = (a, why = []) => ({ a, why });
const pick = (q, pred, what) => { const h = idxOf(q, pred); return h.length === 1 ? R(h[0]) : R(h[0], [`${h.length} choices fit (${what})`]); };
const UNDEF = ['point', 'line', 'plane'];

const F = {};

F.undefTerm = q => {
  if (/defined from the others/.test(q.prompt)) return pick(q, c => !UNDEF.includes(low(c)), 'defined term');
  return pick(q, c => UNDEF.includes(low(c)), 'undefined term');
};
F.markVsObject = q => {
  const p = q.prompt;
  if (/leave “point” undefined/.test(p)) return pick(q, c => /chain of definitions has to start somewhere/.test(c), 'why undefined');
  if (/How wide is point/.test(p)) return pick(q, c => /^It has no width/.test(c), 'width of a point');
  if (/How many points do the two lines share/.test(p)) return pick(q, c => /^Exactly one point$/.test(c), 'lines share one point');
  if (/How long is line/.test(p)) return pick(q, c => /^It has no length/.test(c), 'length of a line');
  return R(undefined, ['unknown markVsObject prompt']);
};

/** marks of an angle drawn at the figure: 90 (box), the measure text, or null */
const angMark = a => (a.box ? 90 : a.text && /^\d+°$/.test(a.text) ? num(a.text) : null);
F.tiltedDef = q => {
  const fig = q.data.picture.fig, p = q.prompt;
  if (/right angle\. Is ∠|perpendicular\?$/.test(p) || /Are lines ℓ and m perpendicular/.test(p) || /Is ∠[A-Z]{3} a right angle/.test(p)) {
    const marks = (fig.angles ?? []).map(angMark).filter(v => v !== null);
    const isRight = marks.length > 0 && marks.every(v => v === 90);
    if (isRight) return pick(q, c => /^Yes: it meets every condition/.test(c), 'meets the definition');
    const v = marks[0];
    return pick(q, c => new RegExp(`^No: they meet at ${v}°`).test(c) || new RegExp(`^No: .*${v}°`).test(c), 'not right');
  }
  const m = p.match(/Is ([A-Z]) the midpoint of ([A-Z])̅?([A-Z])̅?\?/);
  if (m) {
    const ctx = makeCtx(fig);
    const on = between(m[2], m[1], m[3], ctx);
    const tk = segTicks(fig, ctx);
    const eq = on && tk[segKey(m[2] + m[1])] && tk[segKey(m[2] + m[1])] === tk[segKey(m[1] + m[3])];
    if (eq) return pick(q, c => /^Yes: it meets every condition/.test(c), 'meets the definition');
    return R(undefined, ['midpoint not marked']);
  }
  return R(undefined, ['unknown tiltedDef prompt']);
};
/** tick counts per segment key (segments drawn between named points) */
function segTicks(fig, ctx) {
  const o = {};
  const nameAt = pt => Object.keys(ctx.pts).find(n => near(ctx.pts[n], pt, 3));
  for (const s of fig?.segs ?? []) if (s.ticks) { const a = nameAt(s.a), b = nameAt(s.b); if (a && b) o[segKey(a + b)] = s.ticks; }
  return o;
}

F.pickDef = q => {
  const p = q.prompt;
  if (/says the definition of .* is not finished until/.test(p)) return pick(q, c => /^No: a definition needs just enough/.test(c), 'definition need not list every property');
  let m;
  if ((m = p.match(/defines the midpoint of ([A-Z])̅?([A-Z])̅?\?/))) return pick(q, c => new RegExp(`^the point ([A-Z]) on ${m[1]}̅?${m[2]}̅? with ${m[1]}\\1 = \\1${m[2]}$`).test(c), 'midpoint');
  if (/defines congruent segments/.test(p)) return pick(q, c => /^segments that have equal lengths$/.test(c), 'congruent segments');
  if (/defines parallel lines/.test(p)) return pick(q, c => /^lines in the same plane that never meet$/.test(c), 'parallel lines');
  if ((m = p.match(/defines a circle with center ([A-Z])/))) return pick(q, c => c === `all the points in a plane at one given distance from ${m[1]}`, 'circle');
  if ((m = p.match(/defines a bisector of ∠([A-Z])([A-Z])([A-Z])/))) return pick(q, c => c === `a ray from ${m[2]} that splits ∠${m[1]}${m[2]}${m[3]} into two angles of equal measure`, 'angle bisector');
  if (/defines perpendicular lines/.test(p)) return pick(q, c => /^two lines that meet to form right angles$/.test(c), 'perpendicular');
  return R(undefined, ['unknown pickDef prompt']);
};

// ---- testing a definition on gallery figures
function defOf(text) {
  const t = low(text);
  if (/parallel lines are lines that never meet/.test(t)) return 'never-meet';
  if (/perpendicular lines are lines that cross/.test(t)) return 'cross';
  if (/perpendicular lines are a vertical line and a horizontal line/.test(t)) return 'vh-lines';
  if (/the midpoint of .* is the point m on .* with/.test(t)) return 'midpoint';
  if (/bisector of ∠.* is a ray from .* that splits it into two angles of equal measure/.test(t)) return 'bisector';
  if (/right angle is an angle with one horizontal side and one vertical side/.test(t)) return 'vh-angle';
  if (/square is a quadrilateral with four equal sides/.test(t)) return 'four-equal';
  return null;
}
const horiz = d => Math.abs(unit(d)[1]) < 0.01, vert = d => Math.abs(unit(d)[0]) < 0.01;
/** does the definition let this figure in? */
function defIncludes(kind, f) {
  const lines = (f.segs ?? []).filter(s => s.kind === 'line');
  const segDir = s => sub(s.b, s.a);
  const ctx = makeCtx(f);
  switch (kind) {
    case 'never-meet': {
      if ((f.segs ?? []).some(s => s.dash)) return true; // the box: the two highlighted edges are skew, they never meet
      if (lines.length === 2) return !!(lines[0].par && lines[1].par) || Math.abs(cross(unit(segDir(lines[0])), unit(segDir(lines[1])))) < 1e-6;
      return null;
    }
    case 'cross': return lines.length === 2 && Math.abs(cross(unit(segDir(lines[0])), unit(segDir(lines[1])))) > 1e-6;
    case 'vh-lines': return lines.length === 2 && ((horiz(segDir(lines[0])) && vert(segDir(lines[1]))) || (vert(segDir(lines[0])) && horiz(segDir(lines[1]))));
    case 'vh-angle': {
      const rays = (f.segs ?? []).filter(s => s.kind === 'ray');
      return rays.length === 2 && ((horiz(segDir(rays[0])) && vert(segDir(rays[1]))) || (vert(segDir(rays[0])) && horiz(segDir(rays[1]))));
    }
    case 'four-equal': {
      const sides = (f.segs ?? []).filter(s => /^s\d$/.test(s.id));
      return sides.length === 4 && sides.every(s => s.ticks && s.ticks === sides[0].ticks);
    }
    case 'midpoint': {
      const tk = segTicks(f, ctx), names = Object.keys(ctx.pts);
      // the candidate point is the one that is not an endpoint of the long segment: the middle of three
      for (const m of names) {
        const others = names.filter(n => n !== m);
        if (others.length !== 2) continue;
        const [a, b] = others;
        const e1 = tk[segKey(a + m)], e2 = tk[segKey(m + b)];
        if (e1 && e1 === e2) return between(a, m, b, ctx);
      }
      return false;
    }
    case 'bisector': {
      const angs = (f.angles ?? []).filter(a => !a.box);
      if (angs.length === 2) {
        const v1 = angMark(angs[0]), v2 = angMark(angs[1]);
        const shareV = near(angs[0].v, angs[1].v);
        const same = v1 !== null && v2 !== null ? v1 === v2 : (angs[0].arcs ?? 1) === (angs[1].arcs ?? 1);
        return shareV && same;
      }
      return null;
    }
  }
  return null;
}
const isExample = cap => /^(?:[a-z]: )?example/.test(low(cap)) ? true : /non-example/.test(low(cap)) ? false : null;
function defResults(q) {
  const m = q.prompt.match(/“(.+?)”/);
  const kind = m && defOf(m[1]);
  const g = q.data.picture.gallery;
  return { kind, res: g.figs.map((f, i) => ({ inc: kind ? defIncludes(kind, f) : null, ex: isExample(g.caps[i]) })) };
}
F.defVerdict = q => {
  const { kind, res } = defResults(q);
  if (!kind || res.some(r => r.inc === null || r.ex === null)) return R(undefined, ['definition or figure not read']);
  const broad = res.some(r => !r.ex && r.inc), narrow = res.some(r => r.ex && !r.inc);
  if (broad && narrow) return R(undefined, ['too broad and too narrow at once']);
  return pick(q, c => (broad ? /^Too broad/ : narrow ? /^Too narrow/ : /^It works/).test(c), 'verdict');
};
F.whichBreaks = q => {
  const { kind, res } = defResults(q);
  if (!kind || res.some(r => r.inc === null || r.ex === null)) return R(undefined, ['definition or figure not read']);
  const bad = res.map((r, i) => (r.inc !== r.ex ? i : -1)).filter(i => i >= 0);
  if (bad.length > 1) return R(undefined, ['more than one figure is wrong']);
  const tags = q.data.picture.gallery.tags ?? [];
  if (!bad.length) return pick(q, c => /^None/.test(c), 'none');
  return pick(q, c => c === `Figure ${tags[bad[0]]}`, 'figure');
};

F.kindOf = q => {
  const p = q.prompt;
  let k = null;
  if (/accepts it (?:as a starting statement, )?without proof/.test(p)) k = 'Postulate';
  else if (/says what the word|gives the name/.test(p)) k = 'Definition';
  else if (/was proved from/.test(p)) k = 'Theorem';
  else if (/Nobody has proved|No proof yet/.test(p)) k = 'Conjecture';
  return k ? pick(q, c => c === k, 'kind') : R(undefined, ['unknown kindOf prompt']);
};

/** "A is between B and C" + lengths / "D is in the interior of ∠EFG" + measures */
function addParts(q) {
  const p = plain(q.prompt);
  let m, whole, parts;
  if ((m = p.match(/^([A-Z]) is between ([A-Z]) and ([A-Z])\./))) { whole = m[2] + m[3]; parts = [m[2] + m[1], m[1] + m[3]]; }
  else if ((m = p.match(/^([A-Z]) is in the interior of ∠([A-Z])([A-Z])([A-Z])\./))) { whole = 'm∠' + m[2] + m[3] + m[4]; parts = ['m∠' + m[2] + m[3] + m[1], 'm∠' + m[1] + m[3] + m[4]]; }
  else return null;
  return { whole, parts, p };
}
const normName = (n, isAng) => (isAng ? 'm∠' + n.slice(2)[1] + [n.slice(2)[0], n.slice(2)[2]].sort().join('') : n.split('').sort().join(''));
function readValues(p, isAng) {
  const vals = {};
  const re = isAng ? /m∠([A-Z]{3}) = \(?([^,()]+?)\)?°/g : /\b([A-Z]{2}) = ([0-9x+\- .]+?)(?: units| cm| in\.)?(?=,| and |\. |\.$)/g;
  for (const m of p.matchAll(re)) { const e = linX(m[2]); if (e) vals[normName(isAng ? 'm∠' + m[1] : m[1], isAng)] = e; }
  return vals;
}
function solveAdd(q) {
  const A = addParts(q); if (!A) return R(undefined, ['not read']);
  const isAng = A.whole.startsWith('m∠');
  const vals = readValues(A.p, isAng);
  const W = normName(A.whole, isAng), P1 = normName(A.parts[0], isAng), P2 = normName(A.parts[1], isAng);
  const ask = A.p.match(/Find (x|m∠[A-Z]{3}|[A-Z]{2})\.$/)?.[1];
  if (!ask) return R(undefined, ['no question']);
  const known = [W, P1, P2].filter(k => vals[k]);
  let x = null;
  if (known.length === 3) {
    const lhs = [vals[P1][0] + vals[P2][0], vals[P1][1] + vals[P2][1]];
    x = solve1(lhs, vals[W]);
  }
  const val = k => (vals[k] ? at(vals[k], x ?? 0) : k === W ? at(vals[P1], x ?? 0) + at(vals[P2], x ?? 0) : k === P1 ? at(vals[W], x ?? 0) - at(vals[P2], x ?? 0) : at(vals[W], x ?? 0) - at(vals[P1], x ?? 0));
  const why = [];
  for (const k of [W, P1, P2]) { const v = val(k); if (!(v > 0)) why.push(`${k} = ${v}`); if (isAng && v >= 180) why.push(`${k} = ${v}° is not an angle of a figure`); }
  if (isAng && val(W) >= 180) why.push('whole angle ≥ 180°');
  if (ask === 'x') return R(x, why);
  return R(val(normName(ask, isAng)), why);
}
F.segAdd = solveAdd;
F.angleAdd = solveAdd;

F.sphereLine = q => {
  const paths = q.data.picture.globe.paths;
  const isGreat = p => p.kind === 'great' || (p.kind === 'lat' && p.lat === 0);
  const want = /is not a line/.test(q.prompt) ? false : true;
  const hits = paths.filter(p => isGreat(p) === want);
  if (hits.length !== 1) return R(undefined, [`${hits.length} paths fit`]);
  return pick(q, c => c === `path ${hits[0].name}`, 'path');
};
F.sphereTriangle = q => {
  const d = num(q.prompt.match(/(\d+)° apart/)[1]);
  const why = d <= 0 || d >= 180 ? ['meridians not a triangle'] : [];
  if (/more than 180°/.test(q.prompt)) return R(d, why);
  return R(180 + d, why);
};
F.holdsOnSphere = q => {
  const s = low(q.prompt.match(/“(.+?)”/)[1]);
  const T = [
    [/angles of a triangle add up to 180/, false], [/exactly one line parallel/, false], [/vertical angles are congruent/, true],
    [/two different lines meet in at most one point/, false], [/through any two points there is exactly one line/, false],
    [/angle is formed by two rays/, true], [/linear pair, they are supplementary/, true], [/circle is the set of points at one given distance/, true],
  ];
  const hit = T.find(([re]) => re.test(s));
  if (!hit) return R(undefined, ['unknown sphere statement']);
  return pick(q, c => (hit[1] ? /^It still holds/ : /^It changes/).test(c), 'sphere');
};

/** "If P, then Q." or "Q if P." → [P, Q] */
function ifThen(s) {
  s = plain(s).replace(/\.$/, '');
  let m = s.match(/^If (.+?), then (.+)$/); if (m) return [m[1], m[2]];
  m = s.match(/^(.+?) if (.+)$/); if (m) return [m[2], m[1]];
  return null;
}
const capFirst = s => s.charAt(0).toLowerCase() + s.slice(1);
F.hypConc = q => {
  const p = q.prompt;
  const st = p.match(/“(.+?)”/)[1];
  const hc = ifThen(st);
  if (!hc) return R(undefined, ['statement not read']);
  const [H, C] = hc.map(x => plain(x));
  let m;
  if ((m = p.match(/what job does “(.+?)” do\?/))) {
    const part = plain(m[1]);
    if (low(part) === low(H)) return pick(q, c => /^It must already be known/.test(c), 'job of hypothesis');
    if (low(part) === low(C)) return pick(q, c => /^It is the answer/.test(c), 'job of conclusion');
    return R(undefined, ['part not in the statement']);
  }
  const want = /What is its hypothesis/.test(p) ? H : C;
  return pick(q, c => low(c) === low(want), 'hypothesis/conclusion');
};
F.toIfThen = q => {
  const s = low(q.prompt.match(/“(.+?)”/)[1]);
  const hypKey = [[/midpoint splits/, /is the midpoint of/], [/parts of a segment add up/, /is between/], [/every right angle measures/, /is a right angle/],
    [/vertical angles are congruent/, /are vertical angles/], [/form a linear pair are supplementary/, /form a linear pair/], [/parallel lines cut by a transversal/, /ℓ ∥ m and t crosses both/]].find(([re]) => re.test(s));
  if (!hypKey) return R(undefined, ['unknown general statement']);
  return pick(q, c => { const hc = ifThen(c); return !!hc && /^If /.test(c) && hypKey[1].test(hc[0]); }, 'if-then form');
};
F.conjOrThm = q => {
  const p = q.prompt;
  const proved = /wrote a chain of steps, each with a definition, postulate or earlier theorem as its reason|proved it from postulates/.test(p);
  return pick(q, c => c === (proved ? 'Theorem' : 'Conjecture'), 'status');
};
F.whatMakesThm = q => pick(q, c => /^A proof from definitions, postulates and earlier theorems$/.test(c), 'what makes a theorem');

/** an argument card: given hypothesis, then the conclusion by a definition (not by the claim itself) */
function isProofText(text, claim) {
  const hc = ifThen(claim); if (!hc) return false;
  const t = plain(text);
  const m = t.match(/^We are given(?: that)? (.+?)\. By the (definition of [a-z ]+), (.+?)\.$/);
  if (!m) return false;
  if (low(m[1]) !== low(hc[0]) || low(m[3]) !== low(hc[1])) return false;
  const ctx = makeCtx(null);
  const g = parseSt(m[1], ctx), st = parseSt(m[3], ctx);
  return validStep(st, reasonCode(m[2]), [g], ctx, [g]);
}
F.whichIsProof = q => {
  const claim = q.prompt.match(/“(.+?)”/)[1];
  const cards = q.data.picture.cards;
  const ok = cards.map(c => isProofText(c.text, claim));
  if (ok.filter(Boolean).length !== 1) return R(undefined, [`${ok.filter(Boolean).length} cards are proofs`]);
  const letter = cards[ok.indexOf(true)].head.match(/^([A-D]):/)[1];
  return pick(q, c => c === `Card ${letter}`, 'card');
};
F.proofOf = q => {
  const t = plain(q.data.picture.cards[0].text);
  let k;
  if (/\(accepted without proof\)$/.test(t)) k = 'A postulate';
  else if (/^We are given/.test(t)) k = isProofText(t, ifThenFromArg(t)) ? 'A proof' : null;
  else if (/^If .+, then .+\.$/.test(t)) k = 'A theorem';
  else if (/^(a|an|congruent) [a-z ]+ (splits|are) /.test(t)) k = 'A definition';
  return k ? pick(q, c => c === k, 'card kind') : R(undefined, ['card not read']);
};
const ifThenFromArg = t => { const m = plain(t).match(/^We are given(?: that)? (.+?)\. By the definition of [a-z ]+, (.+?)\.$/); return m ? `If ${m[1]}, then ${m[2]}.` : ''; };

F.givenOrProve = q => {
  const hc = ifThen(q.prompt.match(/“(.+?)”/)[1]);
  const want = /after Given:/.test(q.prompt) ? hc[0] : hc[1];
  return pick(q, c => low(c) === low(want), 'given/prove');
};
F.readGiven = q => {
  const p = plain(q.prompt);
  let m;
  if ((m = p.match(/^Problem: Given: (.+?)\. Prove: (.+?)\. Which line is a given/))) return pick(q, c => plain(c) === m[1], 'given');
  if ((m = q.prompt.match(/^Given: ([A-Z])(̅?)([A-Z])̅? (=|≅) ([A-Z])̅?([A-Z])̅?\. How do you read it\?/))) {
    const [a, b, c, d] = [m[1] + m[3], m[5] + m[6]].join('').split('');
    if (m[4] === '=') return pick(q, ch => plain(ch) === `The length of ${a}${b} equals the length of ${c}${d}`, 'reading =');
    return pick(q, ch => plain(ch) === `Segment ${a}${b} is congruent to segment ${c}${d}`, 'reading ≅');
  }
  return R(undefined, ['unknown readGiven prompt']);
};

const TYPE_WORD = { given: /^A given$/, definition: /^A definition$/, postulate: /^A postulate$/, theorem: /^An earlier theorem$/, property: /^A property of equality$/ };
F.reasonType = q => {
  const P = proofOf(q), i = P.pr.ring;
  const row = P.rows[i];
  const ty = REASON_TYPE(row.code);
  const why = [];
  const bad = checkRows(P.rows, P);
  if (bad >= 0) why.push(`the proof breaks at line ${bad + 1}`);
  return ty ? pick(q, c => TYPE_WORD[ty].test(c), 'reason type') : R(undefined, ['reason not read']);
};
F.findLine = q => {
  const P = proofOf(q);
  const nums0 = (q.choices ?? []).map(c => num(c.match(/\d+/)[0]));
  if (/circular/.test(q.prompt)) {
    // the line that uses what is being proved: cites the theorem itself, or calls the target "Given"
    const circ = P.rows.map((r, i) => ((r.code && r.code === P.ctx.proving) || (r.code === 'given' && !P.givens.some(g => sameSt(g, r.st))) ? i : -1)).filter(i => i >= 0);
    if (circ.length !== 1) return R(undefined, [`${circ.length} circular lines`]);
    // and every other line is fine
    const K = [...P.givens], why = [];
    P.rows.forEach((r, i) => { if (i !== circ[0] && !validStep(r.st, r.code, K, P.ctx, P.givens)) why.push(`line ${i + 1} also fails`); K.push(r.st); });
    return R(nums0.indexOf(circ[0] + 1), why);
  }
  const ty = Object.entries({ 'a property of equality': 'property', 'an earlier theorem': 'theorem', 'a definition': 'definition', 'a postulate': 'postulate', 'a given': 'given' }).find(([w]) => q.prompt.includes(w))?.[1];
  const hits = P.rows.map((r, i) => (REASON_TYPE(r.code) === ty ? i + 1 : -1)).filter(i => i > 0 && nums0.includes(i));
  const why = [];
  if (checkRows(P.rows, P) >= 0) why.push(`the proof breaks at line ${checkRows(P.rows, P) + 1}`);
  if (hits.length !== 1) return R(undefined, [`${hits.length} lines of that type among the choices`]);
  return R(nums0.indexOf(hits[0]), why);
};

F.nameAngle = q => {
  const fig = q.data.picture.fig, ctx = makeCtx(fig);
  const a = fig.angles.find(x => x.col === 'pick') ?? fig.angles[0];
  const vName = Object.keys(ctx.pts).find(n => near(ctx.pts[n], a.v));
  const onRay = pt => Object.keys(ctx.pts).find(n => n !== vName && sameDir(sub(ctx.pts[n], a.v), sub(pt, a.v), 0.5));
  const e1 = onRay(a.p), e2 = onRay(a.q);
  if (!vName || !e1 || !e2) return R(undefined, ['angle not read']);
  return pick(q, c => c === `∠${e1}${vName}${e2}` || c === `∠${e2}${vName}${e1}`, 'angle name');
};

// ---- notation: ≅ between figures, = between measures
function notationOk(s) {
  const m = String(s).match(/^(.+?) (=|≅) (.+)$/); if (!m) return null;
  const kind = x => { x = x.trim();
    if (/^line /.test(x)) return 'line';
    if (/^∠(\d+|[A-Z]{3})$/.test(x)) return 'fig';
    if (/^[A-Z]̅[A-Z]̅$/.test(x)) return 'fig';
    if (/^m∠(\d+|[A-Z]{3})$/.test(x)) return 'meas';
    if (/^[A-Z]{2}$/.test(x)) return 'meas';
    if (/^\d+(?:\.\d+)?°?$/.test(x)) return 'meas';
    return null; };
  const a = kind(m[1]), b = kind(m[3]);
  if (!a || !b) return null;
  return m[2] === '≅' ? a === 'fig' && b === 'fig' : a === 'meas' && b === 'meas';
}
F.figVsMeasure = q => {
  const p = q.prompt, fig = q.data.picture.fig, ctx = makeCtx(fig);
  let m;
  if ((m = p.match(/^Segment ([A-Z])([A-Z]) is (\d+) units long/))) return pick(q, c => notationOk(c) && plain(c).split(' = ').every(x => [m[1] + m[2], m[2] + m[1], m[3]].includes(x)), 'segment length');
  if (/statement about the angle/.test(p)) {
    const a = fig.angles.find(x => x.text && /°$/.test(x.text));
    const vName = Object.keys(ctx.pts).find(n => near(ctx.pts[n], a.v));
    const onRay = pt => Object.keys(ctx.pts).find(n => n !== vName && sameDir(sub(ctx.pts[n], a.v), sub(pt, a.v), 0.5));
    const e1 = onRay(a.p), e2 = onRay(a.q), v = num(a.text);
    return pick(q, c => notationOk(c) && (c === `m∠${e1}${vName}${e2} = ${v}°` || c === `m∠${e2}${vName}${e1} = ${v}°`), 'angle measure');
  }
  if ((m = p.match(/arcs say ∠(\d+) and ∠(\d+) are congruent/))) {
    const [x, y] = [m[1], m[2]];
    return pick(q, c => notationOk(c) && new Set(plain(c).replace(/m?∠/g, '').split(/ [=≅] /)).size === 2 && plain(c).replace(/m?∠/g, '').split(/ [=≅] /).every(t => t === x || t === y), 'congruent angles');
  }
  if ((m = p.match(/segment from ([A-Z]) to ([A-Z]) and the segment from ([A-Z]) to ([A-Z]) are congruent/))) {
    const S = [m[1] + m[2], m[3] + m[4]].map(s => s.split('').sort().join(''));
    return pick(q, c => notationOk(c) && plain(c).split(/ [=≅] /).map(s => s.split('').sort().join('')).sort().join() === [...S].sort().join(), 'congruent segments');
  }
  return R(undefined, ['unknown figVsMeasure prompt']);
};
F.defSwitch = q => {
  const m = q.prompt.match(/^Given: (.+?)\. Which statement follows by the definition of congruent (segments|angles)\?/);
  const ctx = makeCtx(null);
  const g = parseSt(m[1], ctx);
  const code = m[2] === 'segments' ? 'def-congseg' : 'def-congang';
  return pick(q, c => notationOk(c) === true && validStep(parseSt(c, ctx), code, [g], ctx, [g]) && (g.t === 'cong' ? /=/.test(c) : /≅/.test(c)), 'definition switch');
};

// ---- markings
/** every given the marks of a figure code, as parsed statements */
function marksOf(fig, ctx) {
  const out = [];
  const tk = segTicks(fig, ctx), byT = {};
  for (const [k, t] of Object.entries(tk)) (byT[t] ??= []).push(k);
  for (const ks of Object.values(byT)) for (let i = 1; i < ks.length; i++) out.push({ t: 'eq', L: { [ks[0]]: 1 }, R: { [ks[i]]: 1 } });
  const names = Object.keys(ctx.pts);
  const nameOn = (v, d) => names.find(n => !near(ctx.pts[n], v) && sameDir(sub(ctx.pts[n], v), d, 0.6));
  const angRef = a => { const vn = names.find(n => near(ctx.pts[n], a.v)); const p = nameOn(a.v, sub(a.p, a.v)), r = nameOn(a.v, sub(a.q, a.v)); return vn && p && r ? angKey(p + vn + r, ctx) : null; };
  for (const a of fig.angles ?? []) if (a.box) { const k = angRef(a); if (k) out.push({ t: 'eq', L: { [k]: 1 }, R: { 1: 90 } }); }
  const arcs = (fig.angles ?? []).filter(a => !a.box && !a.text && !a.nameOnly);
  const byA = {};
  for (const a of arcs) (byA[a.arcs ?? 1] ??= []).push(a);
  for (const g of Object.values(byA)) for (let i = 1; i < g.length; i++) { const k0 = angRef(g[0]), k1 = angRef(g[i]); if (k0 && k1) out.push({ t: 'eq', L: { [k0]: 1 }, R: { [k1]: 1 } }); }
  const par = (fig.segs ?? []).filter(s => s.kind === 'line' && s.par);
  if (par.length === 2) out.push({ t: 'par', a: par[0].name, b: par[1].name });
  return out;
}
F.readMark = q => {
  const fig = q.data.picture.fig, ctx = makeCtx(fig), mk = marksOf(fig, ctx);
  const has = st => !!st && mk.some(x => sameSt(x, st));
  if (/lists everything/.test(q.prompt)) {
    return pick(q, c => {
      const parts = plain(c).replace(/ only$/, '').split(' and ').map(x => parseSt(x, ctx));
      return parts.every(has) && parts.length === mk.length;
    }, 'everything marked');
  }
  return pick(q, c => { const s = parseSt(c, ctx); return has(s); }, 'coded given');
};
F.boxSplit = q => {
  const fig = q.data.picture.fig, ctx = makeCtx(fig);
  const names = Object.keys(ctx.pts);
  const vName = names.find(n => near(ctx.pts[n], fig.angles[0].v));
  const facts = [];
  const nameOn = d => names.find(n => n !== vName && sameDir(sub(ctx.pts[n], ctx.pts[vName]), d, 0.6));
  for (const a of fig.angles) {
    const ref = nameOn(sub(a.p, a.v)) + vName + nameOn(sub(a.q, a.v));
    const v = angMark(a);
    if (v !== null) facts.push(parseSt(`m∠${ref} = ${v}°`, ctx));
  }
  for (const w of [...(fig.words ?? []).map(x => x.text), q.prompt]) for (const m of plain(w).matchAll(/m∠([A-Z]{3}) = (\d+)°/g)) facts.push(parseSt(`m∠${m[1]} = ${m[2]}°`, ctx));
  const target = q.prompt.match(/Find m∠([A-Z]{3})/)[1];
  const val = valueOf(`m∠${target}`, facts, ctx);
  return R(val, val > 0 && val < 180 ? [] : ['impossible angle']);
};
/** the value a model forces for a quantity, or undefined */
function valueOf(term, facts, ctx) {
  // build the model with a stand-in figure: every named ray at the vertex
  const fig = ctx.fig, names = Object.keys(ctx.pts);
  const v = (fig.angles?.[0]?.v) ?? [0, 0];
  const rays = names.filter(n => !near(ctx.pts[n], v));
  const vn = names.find(n => near(ctx.pts[n], v));
  const fake = { ...ctx, ang: Object.fromEntries(rays.map((r, i) => [`r${i}`, { v, p: ctx.pts[r], q: ctx.pts[rays[(i + 1) % rays.length]] }])) };
  const M = new Model(fake, facts);
  const e = M.lin(parseLin(term, ctx));
  const red = reduce(M.rows, e);
  const vars = Object.keys(red).filter(k => k !== '1');
  if (vars.length) return undefined;
  return Math.round((red['1'] ?? 0) * 1e6) / 1e6;
}

// ---- what a diagram licenses
const LICENSED = /are adjacent$| lies between |lie on one line$/;
function drawnTrue(s, fig, ctx) {
  let m;
  if ((m = s.match(/^([A-Z]) lies between ([A-Z]) and ([A-Z])$/))) return between(m[2], m[1], m[3], ctx);
  if ((m = s.match(/^([A-Z]), ([A-Z]) and ([A-Z]) lie on one line$/))) { const [a, b, c] = [m[1], m[2], m[3]].map(n => ctx.pts[n]); return !!(a && b && c) && Math.abs(cross(unit(sub(b, a)), sub(c, a))) < 2; }
  if ((m = s.match(/^∠(\d+|[A-Z]{3}) and ∠(\d+|[A-Z]{3}) are adjacent$/))) return relation(m[1], m[2], ctx)?.kind === 'adj' || relation(m[1], m[2], ctx)?.kind === 'lp';
  return null;
}
F.mayConclude = q => {
  const fig = q.data.picture.fig, ctx = makeCtx(fig);
  return pick(q, c => LICENSED.test(plain(c)) && drawnTrue(plain(c), fig, ctx) === true, 'licensed and true');
};
F.canAssume = q => {
  const fig = q.data.picture.fig, ctx = makeCtx(fig), mk = marksOf(fig, ctx);
  const s = plain(q.prompt.match(/use “(.+?)”/)[1]);
  if (LICENSED.test(s)) {
    if (drawnTrue(s, fig, ctx) !== true) return R(undefined, ['the incidence claim is not what is drawn']);
    return pick(q, c => /^Yes: a diagram may be read for how points lie/.test(c), 'incidence');
  }
  const st = parseSt(s, ctx);
  if (st && mk.some(x => sameSt(x, st))) return pick(q, c => /^Yes: it is marked/.test(c), 'marked');
  return pick(q, c => /^No: it only looks that way/.test(c), 'only looks');
};

F.matchReason = q => {
  const fig = q.data.picture.fig, ctx = makeCtx(fig);
  const m = plain(q.prompt).match(/^Given: (.+?)\. Which reason justifies the step “(.+?)”\?/);
  let givens;
  const g = m[1];
  let mm;
  if ((mm = g.match(/^line ([A-Z]{2}) and line ([A-Z]{2}) meet at ([A-Z])$/))) givens = [];
  else if ((mm = g.match(/^([A-Z])([A-Z])̅? ≅ ([A-Z])([A-Z])$/))) givens = [{ t: 'cong', a: segKey(mm[1] + mm[2]), b: segKey(mm[3] + mm[4]) }];
  else if ((mm = g.match(/^([A-Z]) is in the interior of ∠([A-Z]{3})$/))) givens = [];
  else givens = g.split(/; /).map(x => parseSt(x, ctx));
  const st = parseSt(m[2], ctx);
  return pick(q, c => validStep(st, reasonCode(c), givens, ctx, givens), 'reason');
};
F.midAlg = q => {
  const p = plain(q.prompt);
  let m, e1, e2, n1, n2, whole;
  if ((m = p.match(/^([A-Z]) is the midpoint of ([A-Z])([A-Z])\. ([A-Z]{2}) = (.+?) and ([A-Z]{2}) = (.+?)\. Find (x|[A-Z]{2})\.$/))) {
    e1 = linX(m[5]); e2 = linX(m[7]); n1 = m[4]; n2 = m[6]; whole = m[2] + m[3];
    const x = solve1(e1, e2);
    const half = at(e1, x);
    const why = half > 0 ? [] : ['a length ≤ 0'];
    if (m[8] === 'x') return R(x, why);
    const t = m[8].split('').sort().join('');
    if (t === whole.split('').sort().join('')) return R(2 * half, why);
    return R(half, why);
  }
  if ((m = p.match(/^ray ([A-Z])([A-Z]) bisects ∠([A-Z])([A-Z])([A-Z])\. m∠([A-Z]{3}) = \((.+?)\)° and m∠([A-Z]{3}) = \((.+?)\)°\. Find (x|m∠[A-Z]{3})\.$/))) {
    e1 = linX(m[7]); e2 = linX(m[9]);
    const x = solve1(e1, e2), half = at(e1, x);
    const why = half > 0 && half < 90 ? [] : ['half-angle out of range'];
    if (m[10] === 'x') return R(x, why);
    const t = m[10].slice(2);
    if (normName('m∠' + t, true) === normName('m∠' + m[3] + m[4] + m[5], true)) return R(2 * half, why);
    return R(half, why);
  }
  return R(undefined, ['not read']);
};

F.validUse = q => {
  const p = q.prompt, fig = q.data.picture.fig, ctx = makeCtx(fig);
  if (/form a linear pair\. May you conclude that they are supplementary/.test(p)) {
    const r = relation('1', '2', ctx);
    return R(pick(q, c => /^Yes, by the Linear Pair Postulate/.test(c), 'LPP forward').a, r?.kind === 'lp' ? [] : ['the angles drawn are not a linear pair']);
  }
  if (/May you conclude that ∠\d+ and ∠\d+ are vertical angles/.test(p)) return pick(q, c => /^No: congruent angles do not have to be vertical/.test(c), 'converse of VAT');
  if (/so they are supplementary\. May you conclude that ∠\d+ and ∠\d+ form a linear pair/.test(p)) {
    const vs = [...p.matchAll(/m∠\d+ = (\d+)°/g)].map(x => num(x[1]));
    return R(pick(q, c => /^No: that would use the postulate backward/.test(c), 'converse of LPP').a, vs[0] + vs[1] === 180 ? [] : ['the measures do not add to 180°']);
  }
  let m;
  if ((m = p.match(/([A-Z]) lies on ([A-Z])̅?([A-Z])̅? and the ticks say ([A-Z]{2}) = ([A-Z]{2})\. May you conclude that \1 is the midpoint\?/))) {
    const tk = segTicks(fig, ctx);
    const ok = between(m[2], m[1], m[3], ctx) && tk[segKey(m[4])] && tk[segKey(m[4])] === tk[segKey(m[5])];
    return R(pick(q, c => /^Yes: a definition may be used in both directions/.test(c), 'definition backward').a, ok ? [] : ['the figure does not show it']);
  }
  return R(undefined, ['unknown validUse prompt']);
};
F.bothWays = q => {
  const p = q.prompt;
  if (/Which of these may you use in both directions/.test(p)) return pick(q, c => /^The definition of /.test(c), 'definitions work both ways');
  const m = p.match(/The (Alternate Interior|Alternate Exterior) Angles Theorem and its converse have both been proved\. In a figure, ∠(\d) ≅ ∠(\d)\./);
  const ctx = makeCtx(q.data.picture.fig);
  const r = relation(m[2], m[3], ctx);
  const want = m[1] === 'Alternate Interior' ? 'altint' : 'altext';
  return R(pick(q, c => /^ℓ ∥ m, by the converse/.test(c), 'converse').a, r?.kind === want ? [] : [`∠${m[2]} and ∠${m[3]} are ${r?.kind}, not ${want}`]);
};
F.partialDef = q => {
  const fig = q.data.picture.fig, ctx = makeCtx(fig);
  const m = q.prompt.match(/The ticks say ([A-Z])([A-Z]) = \1([A-Z])\. Is \1 the midpoint of/);
  const on = between(m[2], m[1], m[3], ctx);
  const tk = segTicks(fig, ctx);
  const marked = tk[segKey(m[1] + m[2])] && tk[segKey(m[1] + m[2])] === tk[segKey(m[1] + m[3])];
  if (!marked) return R(undefined, ['the ticks are not drawn']);
  if (on) return pick(q, c => new RegExp(`^Yes: ${m[1]} is on ${m[2]}̅?${m[3]}̅? and`).test(c), 'midpoint');
  return pick(q, c => new RegExp(`^No: ${m[1]} is not on`).test(c), 'not on the segment');
};

// ---- properties of equality
const PROP_NAME = { refl: 'Reflexive', sym: 'Symmetric', trans: 'Transitive', subst: 'Substitution', add: 'Addition', subtr: 'Subtraction' };
F.propName = q => {
  const s = plain(q.prompt.match(/“(.+?)”/)[1]);
  const ctx = makeCtx(null);
  let K = [], st;
  const m = s.match(/^(.+), so (.+)$/);
  if (m) { K = m[1].split(' and ').map(x => parseSt(x, ctx)); st = parseSt(m[2], ctx); } else st = parseSt(s, ctx);
  if (!st || K.some(x => !x)) return R(undefined, ['step not read']);
  const fits = Object.keys(PROP_NAME).filter(k => PROPS[k](st, K));
  // the most specific property: substitution also covers transitive steps
  const best = fits.includes('trans') ? ['trans'] : fits;
  const hits = idxOf(q, c => best.some(k => c === `${PROP_NAME[k]} Property of Equality`));
  const why = hits.length === 1 ? [] : [`${hits.length} property choices fit`];
  if (fits.includes('trans') && idxOf(q, c => /^Substitution Property/.test(c)).length) why.push('Substitution also justifies this transitive step');
  return R(hits[0], why);
};
F.propApply = q => {
  const p = plain(q.prompt);
  const ctx = makeCtx(q.data.picture?.fig ?? null);
  let m, K, code;
  if ((m = p.match(/^Known: “(.+?)”(?: and (.+?))?\. Which statement follows by (?:the )?(transitive|symmetric|addition|subtraction|substitution)/))) {
    K = m[1].split(' and ').map(x => parseSt(x, ctx));
    if (m[2]) K.push(parseSt(m[2], ctx));
    code = { transitive: 'trans', symmetric: 'sym', addition: 'add', subtraction: 'subtr', substitution: 'subst' }[m[3]];
  } else return R(undefined, ['not read']);
  return pick(q, c => { const st = parseSt(c, ctx); return !!st && PROPS[code](st, K) && (code !== 'subst' || !PROPS.add(st, K)); }, code);
};

// ---- proofs
F.proofFill = q => {
  const P = proofOf(q);
  const ask = P.pr.ask[0];
  const i = ask.i;
  const tryRows = rows => { const K = [...P.givens]; for (let j = 0; j < rows.length; j++) { if (!rows[j].st || !validStep(rows[j].st, rows[j].code, K, P.ctx, P.givens)) return false; K.push(rows[j].st); } return sameSt(rows[rows.length - 1].st, P.prove); };
  return pick(q, c => {
    if (/^Nothing: line \d+ is not needed/.test(c)) return tryRows(P.rows.filter((_, j) => j !== i));
    const rows = P.rows.map((r, j) => (j !== i ? r : ask.cell === 'st' ? { ...r, st: parseSt(c, P.ctx), text: c } : { ...r, code: reasonCode(c) }));
    return tryRows(rows);
  }, 'proof line');
};
F.chainNum = q => {
  const p = plain(q.prompt);
  const m = p.match(/^([A-Z]), ([A-Z]), ([A-Z]), ([A-Z]) lie on a line in that order, and ([A-Z]{2}) = ([A-Z]{2})\. ([A-Z]{2}) = (.+?) and ([A-Z]{2}) = (.+?)\. Find ([A-Z]{2})\.$/);
  if (!m) return R(undefined, ['not read']);
  const pts = m.slice(1, 5);
  // gaps g0 (p0p1), g1 (p1p2), g2 (p2p3) and x: unknowns [g0, g1, g2, x, 1]
  const seg = s => { const [i, j] = s.split('').map(c => pts.indexOf(c)).sort((a, b) => a - b); const v = [0, 0, 0, 0, 0]; for (let k = i; k < j; k++) v[k] = 1; return v; };
  const rows = [];
  rows.push(seg(m[5]).map((v, k) => v - seg(m[6])[k]));
  for (const [s, e] of [[m[7], m[8]], [m[9], m[10]]]) { const l = linX(e); const v = seg(s); v[3] -= l[0]; v[4] -= l[1]; rows.push(v); }
  const sol = solveLin(rows, seg(m[11]));
  const why = [];
  if (sol === undefined) return R(undefined, ['not determined']);
  return R(sol, why);
};
/** rows: linear forms in [g0, g1, g2, x, 1] that equal 0; returns the value of target (no constant) if forced */
function solveLin(rows, target) {
  const toMap = v => Object.fromEntries(v.map((c, k) => [k === 4 ? '1' : 'v' + k, c]).filter(([, c]) => Math.abs(c) > 1e-12));
  const red = reduce(rows.map(toMap), toMap(target));
  const vars = Object.keys(red).filter(k => k !== '1');
  if (vars.length) return undefined;
  return Math.round((red['1'] ?? 0) * 1e9) / 1e9;
}
F.congSuppNum = q => {
  const fig = q.data.picture.fig, ctx = makeCtx(fig);
  const m = plain(q.prompt).match(/m∠(\d) = \((.+?)\)° and m∠(\d) = \((.+?)\)°\. Find m∠(\d)\./);
  const e1 = linX(m[2]), e2 = linX(m[4]);
  const r = relation(m[1], m[3], ctx);
  let x;
  if (r?.cls === 'eq') x = solve1(e1, e2);
  else if (r?.cls === 'sup') x = solve1([e1[0] + e2[0], e1[1] + e2[1]], [0, 180]);
  else return R(undefined, ['angles not related']);
  const a1 = at(e1, x);
  const r2 = relation(m[1], m[5], ctx);
  const val = m[5] === m[1] ? a1 : m[5] === m[3] ? at(e2, x) : r2?.cls === 'eq' ? a1 : r2?.cls === 'sup' ? 180 - a1 : undefined;
  const why = a1 > 0 && a1 < 180 ? [] : ['impossible angle'];
  return R(val, why);
};
F.formatJudge = q => {
  const P = proofOf(q);
  const col = checkRows(P.rows, P) < 0;
  const para = plain(q.data.picture.card.lines.join(' '));
  const sents = para.split(/(?<=\.)\s+(?=[A-Z])/).map(s => s.replace(/\.$/, ''));
  const rows = [];
  for (const s of sents) {
    let m;
    if ((m = s.match(/^We are (?:also )?given (?:that )?(.+)$/))) rows.push({ st: parseSt(m[1], P.ctx), code: 'given' });
    else if ((m = s.match(/^By the (.+?), (.+)$/))) rows.push({ st: parseSt(m[2], P.ctx), code: reasonCode(m[1]) });
    else return R(undefined, ['paragraph not read']);
  }
  const par = checkRows(rows, P) < 0;
  const k = col && par ? /^Both/ : col ? /^Only the two-column/ : par ? /^Only the paragraph/ : /^Neither/;
  return pick(q, c => k.test(c), 'which proof is valid');
};
F.repairCircular = q => {
  const P = proofOf(q);
  const i = P.pr.strike[0];
  return pick(q, c => { const code = reasonCode(c); const rows = P.rows.map((r, j) => (j === i ? { ...r, code } : r)); return checkRows(rows, P) < 0; }, 'repair');
};
F.parsons = q => {
  const P = proofOf(q);
  const letters = P.rows.map((_, i) => String.fromCharCode(65 + i));
  return pick(q, c => { const rows = c.split(/,\s*/).map(L => P.rows[letters.indexOf(L)]); return rows.every(Boolean) && checkRows(rows, P) < 0; }, 'order');
};
F.planBack = q => {
  const P = proofOf(q);
  const m = plain(q.prompt).match(/will end with “(.+?)” by the (.+?)\. Which statement/);
  const code = reasonCode(m[2]);
  const target = parseSt(m[1], P.ctx);
  const M = new Model(P.ctx, P.givens);
  const ok = q.choices.map(c => { const st = parseSt(c, P.ctx); return !!st && !sameSt(st, target) && M.implies(st) === 1; });
  const hits = ok.map((v, i) => (v ? i : -1)).filter(i => i >= 0);
  const why = [];
  // the chosen statement must be able to serve the final step
  if (hits.length === 1) {
    const st = parseSt(q.choices[hits[0]], P.ctx);
    const others = [st, ...P.givens, ...helperFacts(P, M, q.choices.map(c => parseSt(c, P.ctx))).filter(h => !sameSt(h, target))];
    if (!validStep(target, code, others, P.ctx, P.givens)) why.push('the final step does not use it');
  } else why.push(`${hits.length} true statements among the choices`);
  return R(hits[0], why);
};
/** one-step facts the planner may assume exist above (the bank's other lines are true statements of the model) */
function helperFacts(P, M, extra = []) {
  const out = [];
  const keys = new Set();
  for (const s of [...P.rows.map(r => r.st), P.prove, ...P.givens, ...extra]) for (const side of sidesOf(s) ?? []) for (const k of Object.keys(side)) if (k !== '1') keys.add(k);
  const ks = [...keys];
  for (const a of ks) for (const b of ks) if (a < b) { const st = { t: 'eq', L: { [a]: 1 }, R: { [b]: 1 } }; if (M.implies(st) === 1) out.push(st); }
  for (const a of ks) for (const b of ks) if (a < b) for (const v of [90, 180]) { const st = { t: 'eq', L: { [a]: 1, [b]: 1 }, R: { 1: v } }; if (M.implies(st) === 1) out.push(st); }
  for (const a of ks) for (const b of ks) for (const c of ks) if (a < b && c !== a && c !== b) { const st = { t: 'eq', L: { [a]: 1, [b]: 1 }, R: { [c]: 1 } }; if (M.implies(st) === 1) out.push(st); }
  return out;
}

F.scopeOf = q => pick(q, c => /^Every (?:pair of vertical angles|linear pair|midpoint of a segment), whatever its size or position$|^Every figure that meets the givens$/.test(c), 'every figure');
F.everySome = q => {
  const s = q.prompt.match(/“(.+?)”/)[1];
  let k;
  if (/^(At least one|Some|There is)/.test(s)) k = /^At least one figure/;
  else if (/^In the figure|drawn on this page|in this sketch/.test(s)) k = /^One particular figure/;
  else k = /^Every figure that meets its conditions/;
  return pick(q, c => k.test(c), 'scope');
};
F.evidenceVerdict = q => {
  const p = plain(q.prompt);
  let k, why = [];
  let m;
  if ((m = p.match(/every angle in this list is acute: ([\d°, ]+)\. .* checked all (\w+)\./))) {
    const vs = m[1].split(',').map(x => num(x.replace('°', '')));
    k = vs.every(v => v > 0 && v < 90) ? 'Proved' : 'Shown false';
    const n = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 }[m[2]];
    if (n !== vs.length) why.push('the count does not match the list');
  } else if (/proved it from .* a reason for every line/.test(p)) k = 'Proved';
  else if (/tried to prove it but got stuck|dragged|measured \d+ pairs/.test(p)) k = 'Not proved yet';
  else if ((m = p.match(/if two angles are supplementary, they form a linear pair\. .* drew two separate angles of (\d+)° and (\d+)°/))) k = num(m[1]) + num(m[2]) === 180 ? 'Shown false' : 'Not proved yet';
  if (!k) return R(undefined, ['unknown evidence prompt']);
  return pick(q, c => c === k, 'status');
};
F.tearCorners = q => {
  const why = [];
  for (const c of q.choices) { const m = plain(c).match(/(\d+)° \+ (\d+)° \+ (\d+)° = (\d+)°/); if (m && num(m[1]) + num(m[2]) + num(m[3]) !== num(m[4])) why.push('a measured sum is miscomputed'); }
  return R(pick(q, c => /^Draw the line through one vertex parallel to the opposite side/.test(c), 'deductive').a, why);
};

/** a gallery figure meets the hypothesis / the conclusion of a claim */
function claimOnFig(claim, f) {
  const ctx = makeCtx(f);
  const angs = (f.angles ?? []).filter(a => a.text || a.arcs || (!a.box && !a.nameOnly));
  const vals = angs.map(a => (a.text && /°$/.test(a.text) ? num(a.text) : null));
  const adjacent = () => { if (angs.length !== 2 || !near(angs[0].v, angs[1].v)) return false; const g = x => ({ v: x.v, p: x.p, q: x.q }); const c2 = { ...ctx, ang: { 1: g(angs[0]), 2: g(angs[1]) } }; const r = relation('1', '2', c2)?.kind; return r === 'adj' || r === 'lp'; };
  const rel = () => { if (angs.length !== 2) return null; const c2 = { ...ctx, ang: { 1: angs[0], 2: angs[1] } }; return relation('1', '2', c2)?.kind; };
  let m;
  if ((m = claim.match(/^If ([A-Z])([A-Z]) = \1([A-Z]), then \1 is the midpoint of /))) {
    const tk = segTicks(f, ctx);
    const texts = {}; const nameAt = pt => Object.keys(ctx.pts).find(n => near(ctx.pts[n], pt, 3));
    for (const s of f.segs ?? []) if (s.text) { const a = nameAt(s.a), b = nameAt(s.b); if (a && b) texts[segKey(a + b)] = num(s.text); }
    const k1 = segKey(m[1] + m[2]), k2 = segKey(m[1] + m[3]);
    const hyp = (tk[k1] && tk[k1] === tk[k2]) || (texts[k1] !== undefined && texts[k1] === texts[k2]);
    const conc = hyp && between(m[2], m[1], m[3], ctx);
    return [!!hyp, !!conc];
  }
  if (/^If two angles are complementary, then they are adjacent/.test(claim)) return [vals.length === 2 && vals[0] + vals[1] === 90, adjacent()];
  if (/^If two angles are supplementary, then they form a linear pair/.test(claim)) return [vals.length === 2 && vals[0] + vals[1] === 180, rel() === 'lp'];
  if (/^If two angles are congruent, then they are vertical angles/.test(claim)) {
    const eq = vals.every(v => v !== null) ? vals.length === 2 && vals[0] === vals[1] : angs.length === 2 && (angs[0].arcs ?? 1) === (angs[1].arcs ?? 1);
    return [eq, rel() === 'vert'];
  }
  return [null, null];
}
F.pickCounter = q => {
  const claim = plain(q.prompt.match(/“(.+?)”/)[1]);
  const g = q.data.picture.gallery;
  const res = g.figs.map(f => claimOnFig(claim, f));
  if (res.some(r => r[0] === null)) return R(undefined, ['claim not read']);
  const hits = res.map((r, i) => (r[0] && !r[1] ? i : -1)).filter(i => i >= 0);
  if (hits.length !== 1) return R(undefined, [`${hits.length} counterexamples drawn`]);
  return pick(q, c => c === `Figure ${g.tags[hits[0]]}`, 'counterexample');
};
F.afterCounter = q => {
  if (/meets the hypothesis but not the conclusion/.test(q.prompt)) return pick(q, c => /^The claim is false: one counterexample is enough/.test(c), 'refuted');
  if (/hypothesis is false and the conclusion is false/.test(q.prompt)) return pick(q, c => /^Nothing about the claim/.test(c), 'says nothing');
  return R(undefined, ['unknown afterCounter prompt']);
};
F.redraw = q => {
  // the proof's reasons: Given, Linear Pair Postulate, Substitution, Subtraction: none reads drawing 1
  const reasons = [...plain(q.prompt).matchAll(/\(([A-Za-z ]+)\)/g)].map(m => reasonCode(m[1]));
  if (reasons.some(c => !c || c === 'looks')) return R(undefined, ['proof reasons not read']);
  return pick(q, c => /^Yes: no step depends on drawing/.test(c), 'general proof');
};

// ---- parallel lines
F.pairName = q => {
  const m = q.prompt.match(/∠(\d) and ∠(\d)/);
  const r = relation(m[1], m[2], makeCtx(q.data.picture.fig));
  const name = KIND_NAME[r?.kind];
  if (!name) return R(undefined, [`pair is ${r?.kind}`]);
  return pick(q, c => c === name, 'pair name');
};
F.notParallel = q => {
  const fig = q.data.picture.fig, ctx = makeCtx(fig);
  const m = plain(q.prompt).match(/^m∠(\d) = (\d+)°\..*What is m∠(\d)\?/);
  const r = relation(m[1], m[3], ctx);
  const parOk = markedPar(fig);
  const why = [];
  if (/chevrons mark ℓ ∥ m/.test(q.prompt) && !parOk) why.push('the prompt names chevrons that are not drawn');
  if (r.needPar && !parOk) return pick(q, c => /^Can’t tell/.test(c), 'not marked parallel');
  if (!r.cls) return R(undefined, ['angles not related']);
  const v = r.cls === 'eq' ? num(m[2]) : 180 - num(m[2]);
  return R(pick(q, c => c === `${v}°`, 'value').a, why);
};
F.isParallel = q => {
  const ctx = makeCtx(q.data.picture.fig);
  const m = plain(q.prompt).match(/^m∠(\d) = (\d+)° and m∠(\d) = (\d+)°\. Are ℓ and m parallel\?/);
  const r = relation(m[1], m[3], ctx);
  const a = num(m[2]), b = num(m[4]);
  let k;
  if (!r.needPar) k = /^Can’t tell/;
  else if ((r.cls === 'eq' && a === b) || (r.cls === 'sup' && a + b === 180)) k = /^Yes: ℓ ∥ m/;
  else k = /^No: ℓ and m are not parallel/;
  return pick(q, c => k.test(c), 'parallel test');
};
F.converseOf = q => {
  const p = q.prompt;
  let m;
  if ((m = p.match(/^(.+?) (Theorem|Postulate): “If two parallel lines are cut by a transversal, then (.+?)\.” Which statement is its converse\?/))) {
    const concl = m[3];
    return pick(q, c => c === `If two lines are cut by a transversal so that ${concl}, then the lines are parallel.`, 'converse');
  }
  if ((m = p.match(/cut by a transversal, and (corresponding angles are congruent|alternate interior angles are congruent|alternate exterior angles are congruent|consecutive interior angles are supplementary)\. Which statement lets you conclude/))) {
    const name = { 'corresponding angles are congruent': 'Corresponding Angles Postulate', 'alternate interior angles are congruent': 'Alternate Interior Angles Theorem', 'alternate exterior angles are congruent': 'Alternate Exterior Angles Theorem', 'consecutive interior angles are supplementary': 'Consecutive Interior Angles Theorem' }[m[1]];
    return pick(q, c => c === `The converse of the ${name}`, 'converse name');
  }
  return R(undefined, ['unknown converseOf prompt']);
};
F.algebraPar = q => {
  const fig = q.data.picture.fig, ctx = makeCtx(fig);
  const p = plain(q.prompt);
  const m = p.match(/m∠(\d) = \((.+?)\)° and m∠(\d) = \((.+?)\)°/);
  const e1 = linX(m[2]), e2 = linX(m[4]);
  const r = relation(m[1], m[3], ctx);
  const why = [];
  if (!r?.needPar) why.push('the two angles are at one vertex: parallel lines do not decide them');
  if (/^ℓ ∥ m\./.test(p) && !markedPar(fig)) why.push('ℓ ∥ m stated but not marked (fine: it is a given)');
  const x = r.cls === 'eq' ? solve1(e1, e2) : solve1([e1[0] + e2[0], e1[1] + e2[1]], [0, 180]);
  const a1 = at(e1, x), a2 = at(e2, x);
  if (!(a1 > 0 && a1 < 180 && a2 > 0 && a2 < 180)) why.push('impossible angle');
  const ask = p.match(/Find (x|m∠\d)\.?$/)?.[1] ?? 'x';
  if (/^Find x so that/.test(p) || ask === 'x') return R(x, why.filter(w => !/stated but not marked/.test(w)));
  return R(ask === 'm∠' + m[1] ? a1 : a2, why.filter(w => !/stated but not marked/.test(w)));
};
F.angleChain = q => {
  const ctx = makeCtx(q.data.picture.fig);
  const m = plain(q.prompt).match(/^ℓ ∥ m and m∠(\d) = (\d+)°\. Find m∠(\d)\./);
  const r = relation(m[1], m[3], ctx);
  if (!r?.cls) return R(undefined, ['not related']);
  return R(r.cls === 'eq' ? num(m[2]) : 180 - num(m[2]));
};

// =====================================================================================================================
const cache = new WeakMap();
function judge(q) {
  if (cache.has(q)) return cache.get(q);
  let out;
  try { out = F[q.family] ? F[q.family](q) : R(undefined, []); } catch (e) { out = R(undefined, [`oracle error: ${e.message}`]); }
  cache.set(q, out);
  return out;
}
export default {
  solve(q) { const a = judge(q).a; return a === -1 ? undefined : a; },
  sane(q) { return judge(q).why.join('; '); },
};
