// Oracle for the lesson "triangle-congruence" (Geometry: SSS, SAS, ASA, AAS, HL; CPCTC; why AAA and SSA fail).
// Written from what the student sees only: the prompt, the board, the choices, the drawn figure (named points,
// segments, tick marks, arcs, right-angle boxes, parallel chevrons, measure labels), the statement cards and the
// proof frames. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
//
// How it decides:
// - Congruent parts come from marks and givens only: a tick group, an arc group, right-angle boxes (all right angles
//   are congruent), equal measure labels, the givens in words, plus the facts a figure carries by itself: a part both
//   triangles share (reflexive), vertical angles (opposite rays at one vertex) and alternate interior angles between
//   segments marked or given parallel. Parts are matched by geometry (the same vertex and the same two rays), never by
//   how long or wide they look.
// - A criterion is decided per correspondence: the corresponding parts known congruent are read off; the third angle
//   follows from two angles, a right triangle's third side from two sides; then SSS / SAS / ASA / AAS / HL either hold
//   or not. AAA and SSA (acute or unknown angle) never prove congruence; SSA with a right angle opposite a given side
//   is HL. For proof lines and "which pattern" questions the pattern is read directly (no derived parts).
// - Proofs: a checker decides whether a line follows from the lines above it (and the givens) by the reason it cites.
// - Concept questions (what a criterion means, if-then parts, counterexamples, rigid-motion steps) are decided per
//   choice by what the choice claims, with the names in it checked against the correspondence.

// =====================================================================================================================
// text helpers
const OV = /̅/g;
const plain = s => String(s ?? '').replace(OV, '').replace(/−/g, '-').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const low = s => plain(s).toLowerCase();
const numOf = s => Number(String(s).replace(/−/g, '-').replace(/[^\d.\-]/g, ''));
const isNumLabel = s => /^\s*\d+(\.\d+)?\s*(°|in|cm|ft)?\s*$/.test(String(s ?? ''));
/** proof / board TeX → plain statement text */
function texSt(t) {
  let s = String(t ?? '');
  for (let i = 0; i < 3; i++) s = s.replace(/\\(?:overline|overrightarrow)\{([^{}]*)\}/g, '$1').replace(/\\text\{([^{}]*)\}/g, ' $1 ');
  s = s.replace(/\\angle\s*/g, '∠').replace(/\\triangle\s*/g, '△').replace(/\\cong/g, '≅').replace(/\\parallel/g, '∥').replace(/\\perp/g, '⊥')
    .replace(/\^\{?\\circ\}?/g, '°').replace(/\\[,;: ]|\\quad|\\qquad|~/g, ' ').replace(/[{}]/g, '').replace(/\\[a-zA-Z]+/g, ' ');
  return plain(s).replace(/\s*,\s*/g, ', ');
}

// =====================================================================================================================
// vectors
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = a => Math.hypot(a[0], a[1]);
const unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const near = (a, b, e = 1.5) => !!a && !!b && Math.abs(a[0] - b[0]) < e && Math.abs(a[1] - b[1]) < e;
const angDeg = (d1, d2) => (Math.acos(Math.max(-1, Math.min(1, dot(unit(d1), unit(d2))))) * 180) / Math.PI;
const sameDir = (d1, d2, tol = 0.8) => angDeg(d1, d2) < tol;
const oppDir = (d1, d2, tol = 0.8) => angDeg(d1, d2) > 180 - tol;
const reflectPt = (P, A, B) => { const d = unit(sub(B, A)), v = sub(P, A), proj = mul(d, dot(v, d)); return add(A, sub(mul(proj, 2), v)); };
const onSegment = (P, A, B, e = 1.5) => { const ab = sub(B, A), ap = sub(P, A), L = len(ab); if (L < 1e-9) return false; const t = dot(ap, ab) / (L * L); return t > -0.001 && t < 1.001 && Math.abs(cross(ab, ap)) / L < e; };
function lineMeet(A, B, C, D) { const r = sub(B, A), s = sub(D, C), den = cross(r, s); if (Math.abs(den) < 1e-9) return null; const t = cross(sub(C, A), s) / den; return add(A, mul(r, t)); }

// =====================================================================================================================
// the figure
function readFig(q) {
  const f = q.data?.picture?.fig;
  if (!f) return null;
  const F = { pts: {}, dup: [], segs: [], angs: [], raw: f };
  for (const p of f.points ?? []) {
    if (!p.name) continue;
    if (F.pts[p.name] && !near(F.pts[p.name], p.at)) F.dup.push(p.name);
    F.pts[p.name] = p.at;
  }
  const nameAt = at => { for (const [n, p] of Object.entries(F.pts)) if (near(p, at)) return n; return null; };
  F.nameAt = nameAt;
  for (const s of f.segs ?? []) F.segs.push({ ...s, pa: nameAt(s.a), pb: nameAt(s.b) });
  for (const a of f.angles ?? []) F.angs.push({ ...a, V: nameAt(a.v), d1: unit(sub(a.p, a.v)), d2: unit(sub(a.q, a.v)) });
  return F;
}
/** every named point that lies on the drawn segments, by name */
const P = (F, n) => F?.pts?.[n];
const geoSeg = (F, n) => (P(F, n[0]) && P(F, n[1]) ? { t: 's', a: P(F, n[0]), b: P(F, n[1]) } : null);
const geoAng = (F, v, p, q) => (P(F, v) && P(F, p) && P(F, q) ? { t: 'a', v: P(F, v), d1: unit(sub(P(F, p), P(F, v))), d2: unit(sub(P(F, q), P(F, v))) } : null);
function sameGeo(x, y) {
  if (!x || !y || x.t !== y.t) return false;
  if (x.t === 's') return (near(x.a, y.a) && near(x.b, y.b)) || (near(x.a, y.b) && near(x.b, y.a));
  if (x.t === 'a') return near(x.v, y.v) && ((sameDir(x.d1, y.d1) && sameDir(x.d2, y.d2)) || (sameDir(x.d1, y.d2) && sameDir(x.d2, y.d1)));
  return x.k === y.k;
}
const verticalGeo = (x, y) => x?.t === 'a' && y?.t === 'a' && near(x.v, y.v) && ((oppDir(x.d1, y.d1) && oppDir(x.d2, y.d2)) || (oppDir(x.d1, y.d2) && oppDir(x.d2, y.d1)));
const angMeasure = g => angDeg(g.d1, g.d2);

// =====================================================================================================================
// parts by name (a triangle context resolves a single-letter angle)
/** a part named in text: 'AB' segment, '∠B' / '∠ABC' angle, given the triangles in play */
function partOf(txt, tris, side = 0) {
  const t = plain(txt).replace(/^m/, '');
  let m = t.match(/^∠([A-Z])([A-Z])([A-Z])$/);
  if (m) return { t: 'a', v: m[2], p: m[1], q: m[3] };
  m = t.match(/^∠([A-Z])$/);
  if (m) {
    const order = side === 1 ? [...tris].reverse() : tris;
    const tri = order.find(T => T.includes(m[1]));
    if (!tri) return { t: 'a', v: m[1], p: null, q: null };
    const o = tri.split('').filter(c => c !== m[1]);
    return { t: 'a', v: m[1], p: o[0], q: o[1] };
  }
  m = t.match(/^([A-Z])([A-Z])$/);
  if (m) return { t: 's', n: m[1] + m[2] };
  return null;
}
const partName = p => (p.t === 's' ? p.n : `∠${p.p}${p.v}${p.q}`);
/** a pair "X ≅ Y" in plain text → [part, part] */
function pairOf(txt, tris) {
  const m = plain(txt).match(/^(∠?[A-Z]{1,3})\s*≅\s*(∠?[A-Z]{1,3})$/);
  if (!m) return null;
  const a = partOf(m[1], tris, 0), b = partOf(m[2], tris, 1);
  return a && b ? [a, b] : null;
}

// =====================================================================================================================
// what is known congruent: a union-find over parts (geometric when a figure is drawn, by name otherwise)
class Know {
  constructor(F) { this.F = F; this.items = []; this.parent = []; this.par = []; this.right = this.node({ t: 'k', k: 'RIGHT' }); }
  geo(part) {
    if (part.t === 'k' || part.t === 'a' && part.d1 || part.t === 's' && part.a && typeof part.a !== 'string') return part;
    if (this.F) {
      if (part.t === 's') { const g = geoSeg(this.F, part.n); if (g) return g; }
      if (part.t === 'a' && part.p) { const g = geoAng(this.F, part.v, part.p, part.q); if (g) return g; }
    }
    if (part.t === 's') return { t: 'k', k: 'S' + part.n.split('').sort().join('') };
    return { t: 'k', k: 'A' + part.v + [part.p, part.q].sort().join('') };
  }
  node(part) {
    const g = this.geo(part);
    for (let i = 0; i < this.items.length; i++) if (sameGeo(this.items[i], g)) return i;
    this.items.push(g); this.parent.push(this.items.length - 1);
    return this.items.length - 1;
  }
  find(i) { while (this.parent[i] !== i) i = this.parent[i] = this.parent[this.parent[i]]; return i; }
  union(a, b) { const x = this.find(this.node(a)), y = this.find(this.node(b)); if (x !== y) this.parent[x] = y; }
  same(a, b) { return this.find(this.node(a)) === this.find(this.node(b)); }
  isRight(a) { return this.find(this.node(a)) === this.find(this.right); }
  setRight(a) { const x = this.find(this.node(a)), y = this.find(this.right); if (x !== y) this.parent[x] = y; }
}

/** the marks and labels of a figure into a Know */
function knowFromFig(F, k = new Know(F)) {
  if (!F) return k;
  const groups = new Map();
  const put = (key, part) => { if (!groups.has(key)) groups.set(key, []); groups.get(key).push(part); };
  for (const s of F.segs) {
    const g = { t: 's', a: s.a, b: s.b };
    if (s.ticks > 0) put('t' + s.ticks, g);
    if (s.text && isNumLabel(s.text) && !s.dash) put('L' + numOf(s.text), g);
    if (s.par > 0) k.par.push({ a: s.a, b: s.b, grp: s.par });
  }
  for (const a of F.angs) {
    const g = { t: 'a', v: a.v, d1: a.d1, d2: a.d2 };
    if (a.arcs > 0) put('a' + a.arcs, g);
    if (a.box) k.setRight(g);
    if (a.text && isNumLabel(a.text)) { put('D' + numOf(a.text), g); if (numOf(a.text) === 90) k.setRight(g); }
  }
  for (const list of groups.values()) for (let i = 1; i < list.length; i++) k.union(list[0], list[i]);
  return k;
}
/** givens in words ("Given: A̅B̅ ≅ C̅D̅, ∠A ≅ ∠D. ...", "H̅K̅ ∥ R̅P̅.") into a Know */
function givenStatements(prompt) {
  const t = plain(prompt);
  const out = [];
  const g = t.match(/Given:\s*(.*?)(?:\.\s+(?=[A-Z△∠])|\.$|$)/);
  if (g) out.push(...splitGiven(g[1]));
  const par = t.match(/^([A-Z]{2}) ∥ ([A-Z]{2})\./);
  if (par) out.push(`${par[1]} ∥ ${par[2]}`);
  return out;
}
function splitGiven(s) {
  const parts = [];
  for (const raw of String(s).split(/,\s*|;\s*/)) {
    const x = raw.trim();
    if (!x) continue;
    let m = x.match(/^(.*?) and (.*)$/);
    if (m && /bisects|midpoint/.test(x) && !/≅/.test(x)) {
      // "VY bisects ∠MVX and ∠MYX" / "Z is the midpoint of CM and DW"
      const head = m[1].match(/^(.*(?:bisects|midpoint of))\s+(.*)$/);
      if (head) { parts.push(`${head[1]} ${head[2]}`); parts.push(`${head[1]} ${m[2]}`); continue; }
    }
    if (m && /≅/.test(m[1]) && /≅/.test(m[2])) { parts.push(m[1].trim(), m[2].trim()); continue; }
    parts.push(x);
  }
  return parts;
}

// =====================================================================================================================
// statements (words or proof lines)
function parseSt(s) {
  const t = plain(s);
  let m;
  if ((m = t.match(/^△([A-Z]{3}) ≅ △([A-Z]{3})$/))) return { k: 'tri', a: m[1], b: m[2] };
  if ((m = t.match(/^(∠?[A-Z]{1,3}) ≅ (∠?[A-Z]{1,3})$/))) return { k: 'cong', a: m[1], b: m[2] };
  if ((m = t.match(/^([A-Z]{2}) ∥ ([A-Z]{2})$/))) return { k: 'par', a: m[1], b: m[2] };
  if ((m = t.match(/^([A-Z]{2}) ⊥ ([A-Z]{2})$/))) return { k: 'perp', a: m[1], b: m[2] };
  if ((m = t.match(/^([A-Z]) is the midpoint of ([A-Z]{2})$/))) return { k: 'mid', m: m[1], s: m[2] };
  if ((m = t.match(/^([A-Z]{2}) bisects ∠([A-Z]{3})$/))) return { k: 'bisA', r: m[1], ang: m[2] };
  if ((m = t.match(/^([A-Z]{2}) bisects ([A-Z]{2}) at ([A-Z])$/))) return { k: 'bisS', r: m[1], s: m[2], m: m[3] };
  if ((m = t.match(/^m?∠([A-Z]{1,3}) = 90°$/))) return { k: 'right', a: '∠' + m[1] };
  return { k: 'other', t };
}
const sortedSeg = n => n.split('').sort().join('');

// =====================================================================================================================
// two triangles: what corresponds, what is known, which criteria hold
const CRITS = ['SSS', 'SAS', 'ASA', 'AAS', 'HL'];
const sideN = (T, i) => T.split('').filter((_, j) => j !== i).join('');           // side opposite vertex i
const angP = (T, i) => { const o = T.split('').filter((_, j) => j !== i); return { t: 'a', v: T[i], p: o[0], q: o[1] }; };
const segP = (T, i) => ({ t: 's', n: sideN(T, i) });

/** the facts a figure carries itself between the two triangles' parts: vertical and alternate interior angles */
function addHidden(k, F, T1, T2) {
  if (!F) return;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const a = k.geo(angP(T1, i)), b = k.geo(angP(T2, j));
    if (a.t !== 'a' || b.t !== 'a') continue;
    if (verticalGeo(a, b) || altInterior(k, a, b)) k.union(a, b);
  }
}
/** a at V1, b at V2: one ray of each along V1V2 toward the other vertex, the other rays antiparallel along two
 *  segments marked or given parallel */
function altInterior(k, a, b) {
  if (!k.par.length || near(a.v, b.v)) return false;
  const t = unit(sub(b.v, a.v));
  const aT = sameDir(a.d1, t) ? a.d2 : sameDir(a.d2, t) ? a.d1 : null;
  const bT = sameDir(b.d1, mul(t, -1)) ? b.d2 : sameDir(b.d2, mul(t, -1)) ? b.d1 : null;
  if (!aT || !bT || !oppDir(aT, bT)) return false;
  // a's other ray lies on one parallel segment's line, b's on another of the same group
  const onLine = (V, d, s) => { const sd = unit(sub(s.b, s.a)); return (sameDir(d, sd) || oppDir(d, sd)) && Math.abs(cross(sd, sub(V, s.a))) < 1.5; };
  for (const s1 of k.par) for (const s2 of k.par) {
    if (s1 === s2 || s1.grp !== s2.grp) continue;
    if (onLine(a.v, aT, s1) && onLine(b.v, bT, s2)) return true;
  }
  return false;
}
function triFacts(k, T1, T2) {
  const S = new Set(), A = new Set();
  let r = -1;
  for (let i = 0; i < 3; i++) {
    if (k.same(segP(T1, i), segP(T2, i))) S.add(i);
    if (k.same(angP(T1, i), angP(T2, i))) A.add(i);
    if (k.isRight(angP(T1, i)) && k.isRight(angP(T2, i))) r = i;
  }
  return { S, A, r };
}
/** criteria that hold once the third angle and a right triangle's third side are derived */
function worksOf({ S, A, r }) {
  const s = new Set(S), a = new Set(A);
  if (r >= 0) a.add(r);
  if (a.size >= 2) [0, 1, 2].forEach(i => a.add(i));
  if (r >= 0 && s.size >= 2) [0, 1, 2].forEach(i => s.add(i));
  const w = new Set();
  if (s.size === 3) w.add('SSS');
  for (let k = 0; k < 3; k++) if (a.has(k) && [0, 1, 2].filter(i => i !== k).every(i => s.has(i))) w.add('SAS');
  if (a.size === 3 && s.size >= 1) { w.add('ASA'); w.add('AAS'); }
  if (r >= 0 && s.has(r) && s.size >= 2) w.add('HL');
  return w;
}
/** patterns read directly (no derived parts): the names a proof line or a "which pattern" question means */
function patternsOf({ S, A, r }) {
  const p = new Set();
  if (S.size === 3) p.add('SSS');
  for (let k = 0; k < 3; k++) {
    const o = [0, 1, 2].filter(i => i !== k);
    if (A.has(k) && o.every(i => S.has(i))) p.add('SAS');
    if (S.has(k) && o.every(i => A.has(i))) p.add('ASA');
    if (S.has(k) && A.has(k) && o.some(i => A.has(i))) p.add('AAS');
    // two sides and an angle not between them
    if (A.has(k) && S.has(k) && o.some(i => S.has(i))) p.add('SSA');
  }
  if (A.size === 3) p.add('AAA');
  if (r >= 0 && S.has(r) && S.size >= 2) p.add('HL');
  return p;
}
const PERMS = ['012', '021', '102', '120', '201', '210'];
const permute = (T, p) => p.split('').map(i => T[Number(i)]).join('');

/** the two triangles of a figure drawn as two separate triangles (6 points, each joined to 2 others) */
function twoTriangles(F) {
  const names = Object.keys(F.pts);
  const adj = Object.fromEntries(names.map(n => [n, new Set()]));
  for (const s of F.segs) if (s.pa && s.pb && !s.kind) { adj[s.pa].add(s.pb); adj[s.pb].add(s.pa); }
  const seen = new Set(), comps = [];
  for (const n of names) {
    if (seen.has(n)) continue;
    const c = [], st = [n]; seen.add(n);
    while (st.length) { const x = st.pop(); c.push(x); for (const y of adj[x]) if (!seen.has(y)) { seen.add(y); st.push(y); } }
    comps.push(c);
  }
  const tris = comps.filter(c => c.length === 3);
  return tris.length === 2 ? tris.map(c => c.join('')) : null;
}
/** the triangle names a prompt or board states: "△ABC ≅ △DEF", "△ABC and △DEF", "△ABC, △DEF" */
function namedTris(q) {
  const t = plain(q.prompt) + ' ' + texSt(q.board);
  const m = [...t.matchAll(/△\s*([A-Z]{3})/g)].map(x => x[1]);
  return [...new Set(m)];
}

// =====================================================================================================================
// proofs
function proofOf(q) {
  const pr = q.data?.picture?.proof;
  if (!pr) return null;
  const givens = (pr.given ?? []).flatMap(g => splitGiven(texSt(g)));
  const prove = texSt(pr.prove);
  const rows = pr.rows.map(r => ({ st: texSt(r.st), rs: plain(r.rs) }));
  return { givens, prove, rows, ask: pr.ask ?? [], pool: !!pr.pool, first: pr.first ?? 1 };
}
function proveTris(pf) { const m = plain(pf.prove).match(/△([A-Z]{3}) ≅ △([A-Z]{3})/); return m ? [m[1], m[2]] : []; }

/** do two statements say the same thing (a given, a listed pair)? */
function sameStatement(F, s1, s2, tris) {
  const a = parseSt(s1), b = parseSt(s2);
  if (a.k !== b.k) return false;
  const k = new Know(F);
  const eqPart = (x, y, sx = 0, sy = 0) => { const px = partOf(x, tris, sx), py = partOf(y, tris, sy); return !!px && !!py && px.t === py.t && sameGeo(k.geo(px), k.geo(py)); };
  switch (a.k) {
    case 'cong': return (eqPart(a.a, b.a, 0, 0) && eqPart(a.b, b.b, 1, 1)) || (eqPart(a.a, b.b, 0, 1) && eqPart(a.b, b.a, 1, 0));
    case 'tri': return sameCorr(a.a, a.b, b.a, b.b);
    case 'par': case 'perp': return (sortedSeg(a.a) === sortedSeg(b.a) && sortedSeg(a.b) === sortedSeg(b.b)) || (sortedSeg(a.a) === sortedSeg(b.b) && sortedSeg(a.b) === sortedSeg(b.a));
    case 'mid': return a.m === b.m && sortedSeg(a.s) === sortedSeg(b.s);
    case 'bisA': return sortedSeg(a.r) === sortedSeg(b.r) && eqPart('∠' + a.ang, '∠' + b.ang);
    case 'bisS': return sortedSeg(a.r) === sortedSeg(b.r) && sortedSeg(a.s) === sortedSeg(b.s) && a.m === b.m;
    default: return plain(s1) === plain(s2);
  }
}
const corrMap = (A, B) => Object.fromEntries(A.split('').map((c, i) => [c, B[i]]));
function sameCorr(a1, b1, a2, b2) {
  const pairs = x => new Set(x[0].split('').map((c, i) => c + x[1][i]));
  const p1 = pairs([a1, b1]), p2 = pairs([a2, b2]), p2r = pairs([b2, a2]);
  const eq = (x, y) => x.size === y.size && [...x].every(v => y.has(v));
  return eq(p1, p2) || eq(p1, p2r);
}

/** is row i justified by its reason, from the givens and the rows before it (in this order)? */
function lineOk(F, pf, rows, i) {
  const { st, rs } = rows[i];
  const S = parseSt(st);
  const before = rows.slice(0, i).map(r => r.st);
  // a definition or a theorem may cite a given from the Given header directly, unless the proof writes that given as
  // a line of its own: then the line must come first (the order of the lines is what is being checked)
  const asRow = gv => rows.some(r => r.rs === 'Given' && sameStatement(F, gv, r.st, proveTris(pf)));
  const known = [...pf.givens.filter(gv => !asRow(gv)), ...before];
  const tris = proveTris(pf);
  const k = new Know(F);
  const g = p => k.geo(p);
  const P1 = x => partOf(x, tris, 0), P2 = x => partOf(x, tris, 1);
  switch (rs) {
    case 'Given': return pf.givens.some(gv => sameStatement(F, gv, st, tris));
    case 'Reflexive Property of Congruence': return S.k === 'cong' && !!P1(S.a) && !!P2(S.b) && sameGeo(g(P1(S.a)), g(P2(S.b)));
    case 'Vertical Angles Theorem': return S.k === 'cong' && P1(S.a)?.t === 'a' && verticalGeo(g(P1(S.a)), g(P2(S.b)));
    case 'Alternate Interior Angles Theorem': {
      if (S.k !== 'cong' || P1(S.a)?.t !== 'a') return false;
      const pars = known.map(parseSt).filter(x => x.k === 'par');
      for (const p of pars) {
        const kk = new Know(F);
        const sa = geoSeg(F, p.a), sb = geoSeg(F, p.b);
        if (!sa || !sb) continue;
        kk.par.push({ a: sa.a, b: sa.b, grp: 1 }, { a: sb.a, b: sb.b, grp: 1 });
        if (altInterior(kk, g(P1(S.a)), g(P2(S.b)))) return true;
      }
      return false;
    }
    case 'Definition of midpoint': {
      if (S.k !== 'cong' || P1(S.a)?.t !== 's') return false;
      for (const x of known.map(parseSt)) {
        const mids = x.k === 'mid' ? [[x.m, x.s]] : x.k === 'bisS' ? [[x.m, x.s]] : [];
        for (const [M, s] of mids) {
          const want = [M + s[0], M + s[1]].map(sortedSeg).sort().join(), got = [S.a, S.b].map(n => sortedSeg(n.replace('∠', ''))).sort().join();
          if (want === got) return true;
        }
      }
      return false;
    }
    case 'Definition of angle bisector': {
      if (S.k !== 'cong' || P1(S.a)?.t !== 'a') return false;
      for (const x of known.map(parseSt)) {
        if (x.k !== 'bisA') continue;
        const V = x.ang[1], other = x.r.replace(V, '');
        if (other.length !== 1 || !x.r.includes(V)) continue;
        const a1 = { t: 'a', v: V, p: x.ang[0], q: other }, a2 = { t: 'a', v: V, p: x.ang[2], q: other };
        const s1 = g(P1(S.a)), s2 = g(P2(S.b));
        if ((sameGeo(g(a1), s1) && sameGeo(g(a2), s2)) || (sameGeo(g(a1), s2) && sameGeo(g(a2), s1))) return true;
      }
      return false;
    }
    case 'Definition of perpendicular lines': {
      if (S.k !== 'cong' || P1(S.a)?.t !== 'a' || !F) return false;
      for (const x of known.map(parseSt)) {
        if (x.k !== 'perp') continue;
        const l1 = geoSeg(F, x.a), l2 = geoSeg(F, x.b);
        if (!l1 || !l2) continue;
        const foot = lineMeet(l1.a, l1.b, l2.a, l2.b);
        const d1 = unit(sub(l1.b, l1.a)), d2 = unit(sub(l2.b, l2.a));
        const ok = gg => gg.t === 'a' && near(gg.v, foot, 2) && ((sameDir(gg.d1, d1) || oppDir(gg.d1, d1)) && (sameDir(gg.d2, d2) || oppDir(gg.d2, d2)) || (sameDir(gg.d1, d2) || oppDir(gg.d1, d2)) && (sameDir(gg.d2, d1) || oppDir(gg.d2, d1)));
        if (Math.abs(dot(d1, d2)) < 0.02 && ok(g(P1(S.a))) && ok(g(P2(S.b)))) return true;
      }
      return false;
    }
    case 'CPCTC': {
      if (S.k !== 'cong') return false;
      for (const x of before.map(parseSt)) {
        if (x.k !== 'tri') continue;
        const ok = (L, R) => { const pa = partOf(L, [x.a, x.b], 0), pb = partOf(R, [x.a, x.b], 1); return pa && pb && corresponds(F, x.a, x.b, pa, pb); };
        if (ok(S.a, S.b) || ok(S.b, S.a)) return true;
      }
      return false;
    }
    default: {
      if (!CRITS.includes(rs) || S.k !== 'tri') return false;
      const kk = new Know(F);
      for (const x of before.map(parseSt)) {
        if (x.k === 'cong') { const pa = partOf(x.a, [S.a, S.b], 0), pb = partOf(x.b, [S.a, S.b], 1); if (pa && pb) kk.union(pa, pb); }
        if (x.k === 'right') kk.setRight(partOf(x.a, [S.a, S.b], 0));
      }
      return patternsOf(triFacts(kk, S.a, S.b)).has(rs);
    }
  }
}
/** do parts a (of T1) and b (of T2) correspond under T1 ≅ T2? (a part of T1 named in T1's letters) */
function corresponds(F, T1, T2, a, b) {
  const k = new Know(F);
  for (let i = 0; i < 3; i++) {
    const x = a.t === 's' ? segP(T1, i) : angP(T1, i), y = b.t === 's' ? segP(T2, i) : angP(T2, i);
    if (a.t === b.t && sameGeo(k.geo(a), k.geo(x)) && sameGeo(k.geo(b), k.geo(y))) return true;
  }
  return false;
}
function proofValid(F, pf, rows) {
  for (let i = 0; i < rows.length; i++) if (!lineOk(F, pf, rows, i)) return false;
  return sameStatement(F, rows[rows.length - 1].st, pf.prove, proveTris(pf));
}

// =====================================================================================================================
// small helpers for choice items
const idxWhere = (q, pred) => { const h = (q.choices ?? []).map((c, i) => (pred(plain(c), i) ? i : -1)).filter(i => i >= 0); return h.length === 1 ? h[0] : -1; };
const allWhere = (q, pred) => (q.choices ?? []).map((c, i) => (pred(plain(c), i) ? i : -1)).filter(i => i >= 0);
function linear(expr) { // "2x + 2", "x + 13", "3x − 9", "(2x + 33)°" → [a, b]
  const e = plain(expr).replace(/[()°]/g, '').replace(/\s+/g, '');
  const m = e.match(/^(\d*)x([+-]\d+)?$/);
  if (!m) return null;
  return [m[1] === '' ? 1 : Number(m[1]), m[2] ? Number(m[2]) : 0];
}
function knownPairsFromText(q, tris) { // the givens in words, as part pairs
  return givenStatements(q.prompt).map(s => parseSt(s)).filter(s => s.k === 'cong').map(s => [partOf(s.a, tris, 0), partOf(s.b, tris, 1)]).filter(p => p[0] && p[1]);
}

// =====================================================================================================================
// the stated pairs of a two-triangle figure (marks + givens), as canonical keys
function statedPairs(q, F, tris) {
  const out = new Map();
  const k = new Know(F);
  const keyOf = (x, y) => { const a = k.node(x), b = k.node(y); return a < b ? `${a}|${b}` : `${b}|${a}`; };
  const addP = (x, y) => { const key = keyOf(x, y); if (!out.has(key)) out.set(key, [x, y]); };
  const groups = new Map();
  const put = (g, p) => { if (!groups.has(g)) groups.set(g, []); groups.get(g).push(p); };
  for (const s of F.segs) if (s.ticks > 0) put('t' + s.ticks, { t: 's', a: s.a, b: s.b });
  for (const a of F.angs) { if (a.arcs > 0) put('a' + a.arcs, { t: 'a', v: a.v, d1: a.d1, d2: a.d2 }); if (a.box) put('box', { t: 'a', v: a.v, d1: a.d1, d2: a.d2 }); }
  for (const list of groups.values()) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) addP(list[i], list[j]);
  for (const [a, b] of knownPairsFromText(q, tris)) addP(k.geo(a), k.geo(b));
  return { pairs: out, keyOf, k };
}

// =====================================================================================================================
// families
const SOLVERS = {
  // ---- read-markings ----
  listPairs(q) {
    const F = readFig(q), tris = twoTriangles(F);
    const { pairs, keyOf, k } = statedPairs(q, F, tris);
    const want = new Set(pairs.keys());
    return idxWhere(q, c => {
      const got = new Set();
      for (const t of c.split(';')) { const p = pairOf(t.trim(), tris); if (!p) return false; got.add(keyOf(k.geo(p[0]), k.geo(p[1]))); }
      return got.size === want.size && [...got].every(x => want.has(x));
    });
  },
  countPairs(q) { const F = readFig(q); return statedPairs(q, F, twoTriangles(F)).pairs.size; },
  whyNotList(q) {
    const F = readFig(q), tris = twoTriangles(F);
    const m = plain(q.prompt).match(/^([A-Z]{2}) and ([A-Z]{2}) look/);
    const { pairs, keyOf, k } = statedPairs(q, F, tris);
    const key = keyOf(k.geo({ t: 's', n: m[1] }), k.geo({ t: 's', n: m[2] }));
    if (pairs.has(key)) return undefined;
    return idxWhere(q, c => /^No: it is not marked and not given/.test(c));
  },

  // ---- read-correspondence ----
  corrPart(q) {
    const m = plain(q.prompt).match(/△([A-Z]{3}) ≅ △([A-Z]{3})\. Which part of △([A-Z]{3}) corresponds to (∠?[A-Z]{1,2})\?/);
    const [T1, T2] = m[3] === m[2] ? [m[1], m[2]] : [m[2], m[1]];
    const map = corrMap(T1, T2);
    const tgt = m[4].replace('∠', '').split('').map(c => map[c]).join('');
    const isAng = m[4].startsWith('∠');
    return idxWhere(q, c => (isAng ? c === '∠' + tgt : /^[A-Z]{2}$/.test(c) && sortedSeg(c) === sortedSeg(tgt)));
  },
  corrPick(q) {
    const m = plain(q.prompt).match(/△([A-Z]{3}) ≅ △([A-Z]{3})/);
    const map = corrMap(m[1], m[2]);
    return idxWhere(q, c => {
      const p = c.match(/^(∠?)([A-Z]{1,2}) ≅ (∠?)([A-Z]{1,2})$/);
      if (!p) return false;
      const img = p[2].split('').map(x => map[x]).join('');
      return p[1] ? img === p[4] : sortedSeg(img) === sortedSeg(p[4]);
    });
  },

  // ---- sufficiency-meaning ----
  fixOne(q) {
    const t = plain(q.prompt);
    const m = t.match(/tried ([A-Z]{3}) on one pair/);
    if (m && !['AAA', 'SSA'].includes(m[1])) return undefined;
    return idxWhere(q, c => /^No: a criterion must work for every pair/.test(c) || /^Every triangle with those three parts is a copy of every other/.test(c) || /^Any two triangles with those parts can be carried onto each other by a rigid motion/.test(c));
  },
  mirrorCopy(q) {
    const F = readFig(q);
    const m = plain(q.prompt).match(/△([A-Z]{3}) and △([A-Z]{3}) share ([A-Z]{2})/);
    const [T1, T2, sh] = [m[1], m[2], m[3]];
    const k = knowFromFig(F);
    const congruent = PERMS.some(p => worksOf(triFacts(k, T1, permute(T2, p))).size > 0);
    // the third vertex of one is the mirror image of the other's across the shared side
    const x1 = T1.split('').find(c => !sh.includes(c)), x2 = T2.split('').find(c => !sh.includes(c));
    const mirror = near(reflectPt(P(F, x1), P(F, sh[0]), P(F, sh[1])), P(F, x2), 3);
    if (!congruent) return idxWhere(q, c => /^Can.t tell/.test(c));
    if (!mirror) return undefined;
    return idxWhere(q, c => { const r = c.match(/reflection across (?:line )?([A-Z]{2})/); return !!r && sortedSeg(r[1]) === sortedSeg(sh) && !/^No|^None/.test(c); });
  },

  // ---- included-parts ----
  includedPart(q) {
    const t = plain(q.prompt);
    let m = t.match(/Which angle is included between ([A-Z]{2}) and ([A-Z]{2})\?/);
    if (m) { const v = m[1].split('').find(c => m[2].includes(c)); return idxWhere(q, c => c === '∠' + v); }
    m = t.match(/Which side is included between ∠([A-Z]) and ∠([A-Z])\?/);
    return idxWhere(q, c => /^[A-Z]{2}$/.test(c) && sortedSeg(c) === sortedSeg(m[1] + m[2]));
  },
  patternName(q) {
    const t = plain(q.prompt);
    const m = t.match(/The given pairs are (.*)\. Read them around △([A-Z]{3})/);
    const T = m[2];
    const S = new Set(), A = new Set();
    for (const pr of m[1].split(/,\s*/)) {
      const p = plain(pr).match(/^(∠?)([A-Z]{1,2}) ≅/);
      if (!p) return undefined;
      if (p[1]) A.add(T.indexOf(p[2]));
      else S.add(T.indexOf(T.split('').find(c => !p[2].includes(c))));
    }
    const pats = patternsOf({ S, A, r: -1 });
    return idxWhere(q, c => pats.has(c));
  },

  // ---- hypotenuse-legs ----
  findHyp(q) {
    const t = plain(q.prompt);
    const m = t.match(/△([A-Z]{3}) has a right angle at ([A-Z])/);
    const T = m[1], v = m[2], hyp = T.replace(v, '');
    if (/hypotenuse\?/.test(t)) return idxWhere(q, c => /^[A-Z]{2}$/.test(c) && sortedSeg(c) === sortedSeg(hyp));
    return idxWhere(q, c => { const p = c.match(/^([A-Z]{2}) and ([A-Z]{2})$/); return !!p && [p[1], p[2]].every(s => s.includes(v)) && sortedSeg(p[1]) !== sortedSeg(p[2]); });
  },
  isRight(q) {
    const F = readFig(q);
    const T = plain(q.prompt).match(/△([A-Z]{3})/)[1];
    const k = knowFromFig(F);
    const r = [0, 1, 2].filter(i => k.isRight(angP(T, i)));
    if (!r.length) return idxWhere(q, c => /^None/.test(c));
    if (r.length > 1) return undefined;
    return idxWhere(q, c => /^[A-Z]{2}$/.test(c) && sortedSeg(c) === sortedSeg(sideN(T, r[0])));
  },

  // ---- the criteria ----
  classify(q) { return classifyFig(q); },
  sssNum(q) {
    const F = readFig(q);
    const [T1, T2] = namedTris(q);
    const lens = T => [0, 1, 2].map(i => { const s = F.segs.find(x => x.pa && x.pb && sortedSeg(x.pa + x.pb) === sortedSeg(sideN(T, i))); return s && isNumLabel(s.text) ? numOf(s.text) : NaN; }).sort((a, b) => a - b);
    const a = lens(T1), b = lens(T2);
    if ([...a, ...b].some(Number.isNaN)) return undefined;
    const same = a.every((x, i) => x === b[i]);
    return idxWhere(q, c => (same ? /^Yes, by SSS/.test(c) : /^No: one side length has no partner/.test(c)));
  },
  missingPair(q) {
    const F = readFig(q);
    const m = plain(q.prompt).match(/so that (SSS|SAS|ASA|AAS|HL) proves △([A-Z]{3}) ≅ △([A-Z]{3})/);
    const [crit, T1, T2] = [m[1], m[2], m[3]];
    return idxWhere(q, c => {
      const p = pairOf(c, [T1, T2]);
      if (!p) return false;
      const k = knowFromFig(F); addHidden(k, F, T1, T2);
      k.union(p[0], p[1]);
      return worksOf(triFacts(k, T1, T2)).has(crit) && !worksOf(triFacts(knowFromFig(F), T1, T2)).has(crit);
    });
  },
  aasThird(q) {
    const F = readFig(q);
    const want = plain(q.prompt).match(/What is m∠([A-Z])\?/)[1];
    const tris = twoTriangles(F);
    const k = knowFromFig(F);
    const T = tris.find(x => x.includes(want));
    const val = part => { // a measure label on this angle or on one known congruent to it
      for (const a of F.angs) if (a.text && isNumLabel(a.text) && k.same({ t: 'a', v: a.v, d1: a.d1, d2: a.d2 }, part)) return numOf(a.text);
      return NaN;
    };
    const others = T.split('').filter(c => c !== want).map(c => val(angP(T, T.indexOf(c))));
    if (others.some(Number.isNaN)) return undefined;
    return 180 - others[0] - others[1];
  },
  aasSide(q) {
    const F = readFig(q);
    const [T1, T2] = namedTris(q);
    const base = knowFromFig(F);
    const f0 = triFacts(base, T1, T2);
    if (f0.A.size !== 2) return undefined;
    const right = allWhere(q, c => {
      const p = pairOf(c, [T1, T2]);
      if (!p || p[0].t !== 's') return false;
      const k = knowFromFig(F); k.union(p[0], p[1]);
      const pats = patternsOf(triFacts(k, T1, T2));
      return pats.has('AAS') && !pats.has('ASA');
    });
    if (right.length === 1) return right[0];
    if (right.length === 0) return idxWhere(q, c => /^None/.test(c));
    return -1;
  },
  hlCheck(q) {
    const F = readFig(q);
    const [T1, T2] = namedTris(q);
    const k = knowFromFig(F);
    const r1 = [0, 1, 2].filter(i => k.isRight(angP(T1, i))), r2 = [0, 1, 2].filter(i => k.isRight(angP(T2, i)));
    if (r1.length !== 1 || r2.length !== 1) return idxWhere(q, c => /^No: only one triangle is marked right/.test(c));
    // the tick pairs: is each a hypotenuse with a hypotenuse, a leg with a leg?
    const hyp1 = sortedSeg(sideN(T1, r1[0])), hyp2 = sortedSeg(sideN(T2, r2[0]));
    let mixed = false;
    for (const s1 of F.segs) for (const s2 of F.segs) {
      if (s1 === s2 || !(s1.ticks > 0) || s1.ticks !== s2.ticks || !s1.pa || !s2.pa) continue;
      const n1 = sortedSeg(s1.pa + s1.pb), n2 = sortedSeg(s2.pa + s2.pb);
      if (!T1.includes(n1[0]) || !T1.includes(n1[1]) || !T2.includes(n2[0]) || !T2.includes(n2[1])) continue;
      if ((n1 === hyp1) !== (n2 === hyp2)) mixed = true;
    }
    if (mixed) return idxWhere(q, c => /^No: a hypotenuse is paired with a leg/.test(c));
    return idxWhere(q, c => (worksOf(triFacts(k, T1, T2)).has('HL') ? /^Yes, by HL/.test(c) : false));
  },
  classifyList(q) {
    const [T1, T2] = namedTris(q).length >= 2 ? namedTris(q).slice(-2) : [];
    const k = new Know(null);
    for (const [a, b] of knownPairsFromText(q, [T1, T2])) k.union(a, b);
    return pickCrit(q, worksOf(triFacts(k, T1, T2)));
  },

  // ---- rigid motions ----
  motionWhy(q) { return motionWhy(q); },
  motionNext(q) { return motionNext(q); },
  circlesMeet(q) {
    const n = plain(q.prompt).match(/radius (\d+(?:\.\d+)?) in, a circle about [A-Z] has radius (\d+(?:\.\d+)?) in, and [A-Z]{2} = (\d+(?:\.\d+)?) in/);
    const [r1, r2, d] = [Number(n[1]), Number(n[2]), Number(n[3])];
    const e = 1e-9;
    if (d > r1 + r2 + e) return 0;
    if (Math.abs(d - (r1 + r2)) < e) return 1;
    if (d < Math.abs(r1 - r2) - e) return 0;
    if (Math.abs(d - Math.abs(r1 - r2)) < e) return r1 === r2 ? undefined : 1;
    return 2;
  },
  mirrorPoint(q) {
    const m = plain(q.prompt).match(/The circles about ([A-Z]) \(radius [\d.]+ in\) and ([A-Z]) \(radius [\d.]+ in\) meet at ([A-Z]) and ([A-Z])\. How is \4 placed compared with \3\?/);
    return idxWhere(q, c => { const r = c.match(/^([A-Z]) is the reflection of ([A-Z]) across line ([A-Z]{2})$/); return !!r && r[1] === m[4] && r[2] === m[3] && sortedSeg(r[3]) === sortedSeg(m[1] + m[2]); });
  },

  // ---- statements ----
  writeStmt(q) {
    const F = readFig(q);
    const tris = twoTriangles(F) ?? sharedVertexTris(F);
    const T1 = plain(q.board).length ? texSt(q.board).match(/△([A-Z]{3})/)[1] : tris[0];
    return idxWhere(q, c => { const m = c.match(/^△([A-Z]{3}) ≅ △([A-Z]{3})$/); return !!m && m[1] === T1 && marksFit(F, m[1], m[2]); });
  },
  stmtAndCrit(q) {
    const F = readFig(q);
    const ok = allWhere(q, c => {
      const m = c.match(/^△([A-Z]{3}) ≅ △([A-Z]{3}) by (SSS|SAS|ASA|AAS|HL)$/);
      if (!m) return false;
      const k = knowFromFig(F); addHidden(k, F, m[1], m[2]);
      return worksOf(triFacts(k, m[1], m[2])).has(m[3]);
    });
    if (ok.length === 1) return ok[0];
    if (ok.length === 0) return idxWhere(q, c => /^Not enough information/.test(c));
    return -1;
  },
  stmtFromList(q) {
    const tris0 = (q.choices ?? []).map(c => plain(c).match(/△([A-Z]{3}) ≅ △([A-Z]{3})/)).filter(Boolean);
    const T1 = tris0[0][1];
    const pairs = givenStatements(q.prompt).map(parseSt).filter(s => s.k === 'cong');
    return idxWhere(q, c => {
      const m = c.match(/^△([A-Z]{3}) ≅ △([A-Z]{3})$/);
      if (!m || m[1] !== T1) return false;
      const map = corrMap(m[1], m[2]);
      return pairs.every(s => {
        const a = s.a.replace('∠', ''), b = s.b.replace('∠', '');
        const [x, y] = a.split('').every(ch => m[1].includes(ch)) ? [a, b] : [b, a];
        const img = x.split('').map(ch => map[ch]).join('');
        return s.a.startsWith('∠') ? img === y : sortedSeg(img) === sortedSeg(y);
      });
    });
  },

  // ---- hidden pairs ----
  sharedPart(q) {
    const F = readFig(q);
    const m = plain(q.prompt).match(/proves △([A-Z]{3}) ≅ △([A-Z]{3}) by (SSS|SAS|ASA|AAS|HL)/);
    const [T1, T2, crit] = [m[1], m[2], m[3]];
    const base = () => { const k = knowFromFig(F); for (const [a, b] of knownPairsFromText(q, [T1, T2])) k.union(a, b); return k; };
    return idxWhere(q, c => {
      if (/look|^None/.test(c)) return false;
      const p = pairOf(c, [T1, T2]);
      if (!p) return false;
      const k0 = base();
      if (!k0.same(p[0], p[1])) return false;               // the pair must be true: marked, given, or one shared part
      const pats = patternsOf(triFacts(k0, T1, T2));
      return pats.has(crit) && usesPair(F, T1, T2, p);
    });
  },
  reflexReason(q) { return proofReason(q); },
  hiddenAngle(q) {
    const F = readFig(q);
    const [T1, T2] = namedTris(q);
    const k = knowFromFig(F);
    const t = plain(q.prompt);
    const par = t.match(/^([A-Z]{2}) ∥ ([A-Z]{2})\./);
    if (par) { const a = geoSeg(F, par[1]), b = geoSeg(F, par[2]); k.par.push({ a: a.a, b: a.b, grp: 99 }, { a: b.a, b: b.b, grp: 99 }); }
    const truth = c => {
      const m = c.match(/^(∠[A-Z]{1,3}) ≅ (∠[A-Z]{1,3}), (vertical angles|alternate interior angles|they look equal)$/);
      if (!m) return null;
      if (m[3] === 'they look equal') return false;
      const a = k.geo(partOf(m[1], [T1, T2], 0)), b = k.geo(partOf(m[2], [T1, T2], 1));
      return m[3] === 'vertical angles' ? verticalGeo(a, b) : altInterior(k, a, b);
    };
    const yes = allWhere(q, c => truth(c) === true);
    if (yes.length === 1) return yes[0];
    if (yes.length === 0) return idxWhere(q, c => /^None/.test(c));
    return -1;
  },
  hiddenCrit(q) { return classifyFig(q); },

  // ---- bisectors and definitions ----
  bisectDef(q) {
    const F = readFig(q);
    const t = plain(q.prompt);
    const k = knowFromFig(F);
    let m = t.match(/^Is ([A-Z]) the midpoint of ([A-Z]{2})\?/);
    if (m) {
      const [M, s] = [m[1], m[2]];
      const yes = k.same({ t: 's', n: s[0] + M }, { t: 's', n: M + s[1] }) || givenStatements(q.prompt).some(g => sameStatement(F, g, `${s[0]}${M} ≅ ${M}${s[1]}`, []));
      return idxWhere(q, c => (yes ? /^Yes: the ticks mark/.test(c) : /^Not shown/.test(c)));
    }
    m = t.match(/^Does ray ([A-Z])([A-Z]) bisect ∠([A-Z])([A-Z])([A-Z])\?/);
    if (m) {
      const [V, Y, A, B] = [m[1], m[2], m[3], m[5]];
      const a1 = { t: 'a', v: V, p: A, q: Y }, a2 = { t: 'a', v: V, p: Y, q: B };
      const lab = part => { for (const a of F.angs) if (a.text && isNumLabel(a.text) && sameGeo({ t: 'a', v: a.v, d1: a.d1, d2: a.d2 }, k.geo(part))) return numOf(a.text); return NaN; };
      const x = lab(a1), y = lab(a2);
      const yes = k.same(a1, a2), no = !Number.isNaN(x) && !Number.isNaN(y) && x !== y;
      if (yes) return idxWhere(q, c => /^Yes: the two angles are marked congruent/.test(c));
      if (no) return idxWhere(q, c => /^No: the two parts are not congruent/.test(c));
      return undefined;
    }
    return undefined;
  },
  bisectNum(q) {
    const t = plain(q.prompt);
    let m = t.match(/^([A-Z]) is the midpoint of ([A-Z]{2}), and ([A-Z]{2}) = (\d+(?:\.\d+)?) cm\. How long is ([A-Z]{2})\?/);
    if (m) {
      const [M, s, known, v, ask] = [m[1], m[2], m[3], Number(m[4]), m[5]];
      const isWhole = n => sortedSeg(n) === sortedSeg(s), isHalf = n => n.includes(M) && !isWhole(n);
      if (isHalf(known) && isWhole(ask)) return 2 * v;
      if (isWhole(known) && isHalf(ask)) return v / 2;
      if (isHalf(known) && isHalf(ask)) return v;
      return undefined;
    }
    m = t.match(/^Ray ([A-Z])([A-Z]) bisects ∠([A-Z]{3}), and m∠([A-Z]{3}) = (\d+(?:\.\d+)?)°\. Find m∠([A-Z]{3})\./);
    if (m) {
      const [V, Y, whole, known, v, ask] = [m[1], m[2], m[3], m[4], Number(m[5]), m[6]];
      const isWhole = n => n[1] === V && sortedSeg(n[0] + n[2]) === sortedSeg(whole[0] + whole[2]);
      const isHalf = n => n[1] === V && (n[0] === Y || n[2] === Y);
      if (isWhole(known) && isHalf(ask)) return v / 2;
      if (isHalf(known) && isWhole(ask)) return 2 * v;
      if (isHalf(known) && isHalf(ask)) return v;
    }
    return undefined;
  },
  defToPair(q) {
    const F = readFig(q);
    const st = parseSt(givenStatements(q.prompt)[0] ?? '');
    const k = new Know(F);
    let want = null;
    if (st.k === 'mid') want = [{ t: 's', n: st.s[0] + st.m }, { t: 's', n: st.m + st.s[1] }];
    if (st.k === 'bisS') want = [{ t: 's', n: st.s[0] + st.m }, { t: 's', n: st.m + st.s[1] }];
    if (st.k === 'bisA') { const V = st.ang[1], o = st.r.replace(V, ''); want = [{ t: 'a', v: V, p: st.ang[0], q: o }, { t: 'a', v: V, p: o, q: st.ang[2] }]; }
    if (st.k === 'perp') {
      // the foot: the point both segments pass through (by the drawing)
      const l1 = geoSeg(F, st.a), l2 = geoSeg(F, st.b);
      const foot = lineMeet(l1.a, l1.b, l2.a, l2.b), Fn = F.nameAt(foot);
      if (!Fn) return undefined;
      const up = st.a.replace(Fn, '').length === 1 ? st.a.replace(Fn, '') : st.b.replace(Fn, '');
      const base = st.a.includes(up) ? st.b : st.a;
      if (up.length !== 1) return undefined;
      want = [{ t: 'a', v: Fn, p: base[0], q: up }, { t: 'a', v: Fn, p: base[1], q: up }];
    }
    if (!want) return undefined;
    const w = want.map(p => k.geo(p));
    return idxWhere(q, c => {
      const p = pairOf(c, []);
      if (!p || p.some(x => x.t === 'a' && !x.p)) return false;
      const g = p.map(x => k.geo(x));
      return (sameGeo(g[0], w[0]) && sameGeo(g[1], w[1])) || (sameGeo(g[0], w[1]) && sameGeo(g[1], w[0]));
    });
  },
  defReason(q) { return proofReason(q); },

  // ---- overlapping triangles ----
  overlapShare(q) {
    const F = readFig(q);
    const [T1, T2] = namedTris(q);
    const k = new Know(F);
    const sides = [0, 1, 2].flatMap(i => [0, 1, 2].filter(j => sameGeo(k.geo(segP(T1, i)), k.geo(segP(T2, j)))).map(() => sideN(T1, i)));
    const angs = [0, 1, 2].flatMap(i => [0, 1, 2].filter(j => sameGeo(k.geo(angP(T1, i)), k.geo(angP(T2, j)))).map(() => T1[i]));
    return idxWhere(q, c => {
      if (/^Nothing/.test(c)) return !sides.length && !angs.length;
      if (/^∠[A-Z]$/.test(c)) return angs.includes(c[1]);
      if (/^[A-Z]{2}$/.test(c)) return sides.some(s => sortedSeg(s) === sortedSeg(c));
      return false;
    });
  },
  overlapCrit(q) { return classifyFig(q); },

  // ---- proofs ----
  proofParsons(q) {
    const F = readFig(q), pf = proofOf(q);
    return idxWhere(q, c => {
      const letters = c.split(/,\s*/);
      if (letters.length !== pf.rows.length - 1 || new Set(letters).size !== letters.length) return false;
      const rows = letters.map(L => pf.rows[L.charCodeAt(0) - 65]);
      if (rows.some(r => !r)) return false;
      return proofValid(F, pf, rows);
    });
  },
  proofReason(q) { return proofReason(q); },
  proofGap(q) {
    const F = readFig(q), pf = proofOf(q);
    const i = pf.ask[0].i;
    return idxWhere(q, c => {
      const rows = pf.rows.map((r, j) => (j === i ? { st: c, rs: r.rs } : r));
      return proofValid(F, pf, rows);
    });
  },

  // ---- CPCTC ----
  cpctcNext(q) {
    const F = readFig(q), pf = proofOf(q);
    const rows = pf.rows;
    if (!proofValid(F, pf, rows)) return undefined;
    const tri = parseSt(rows[rows.length - 1].st);
    const given = new Set();
    return idxWhere(q, c => {
      const s = parseSt(c);
      if (s.k !== 'cong') return false;
      const ext = [...rows, { st: c, rs: 'CPCTC' }];
      return lineOk(F, pf, ext, ext.length - 1) && !given.has(c) && !!tri;
    });
  },
  cpctcNum(q) {
    const F = readFig(q);
    const m = plain(q.prompt).match(/△([A-Z]{3}) ≅ △([A-Z]{3})\. The lengths of △([A-Z]{3}) are in \w+\. How long is ([A-Z]{2})\?/);
    const [T1, T2, ask] = [m[1], m[2], m[4]];
    const [Ta, Tb] = T2.includes(ask[0]) && T2.includes(ask[1]) ? [T2, T1] : [T1, T2];
    const map = corrMap(Ta, Tb);
    const img = ask.split('').map(c => map[c]).join('');
    const s = F.segs.find(x => x.pa && x.pb && sortedSeg(x.pa + x.pb) === sortedSeg(img));
    return s && isNumLabel(s.text) ? numOf(s.text) : undefined;
  },
  cpctcEarly(q) {
    const F = readFig(q), pf = proofOf(q);
    const bad = pf.rows.map((_, i) => i).filter(i => !lineOk(F, pf, pf.rows, i));
    if (bad.length !== 1) return -1;
    const ln = bad[0] + pf.first;
    return idxWhere(q, c => c === `Line ${ln}`);
  },

  // ---- if-then claims ----
  critIfThen(q) {
    const t = plain(q.prompt);
    const claim = t.match(/“Two triangles are congruent when (.*?)\.”/)[1];
    const kind = kindOf(claim);
    if (/conclusion/.test(t)) return idxWhere(q, c => c === 'the two triangles are congruent');
    return idxWhere(q, c => !/the two triangles are congruent|drawing/.test(c) && kindOf(c) === kind);
  },
  claimAbout(q) { return idxWhere(q, c => /^Every pair of triangles that meets the hypothesis/.test(c)); },

  // ---- counterexamples ----
  cxCheck(q) {
    const F = readFig(q);
    const [T1, T2] = namedTris(q).slice(-2);
    const t = plain(q.prompt);
    const ang = (T, i) => { const g = geoAng(F, T[i], ...T.split('').filter((_, j) => j !== i)); for (const a of F.angs) if (a.text && isNumLabel(a.text) && sameGeo({ t: 'a', v: a.v, d1: a.d1, d2: a.d2 }, g)) return numOf(a.text); return NaN; };
    const side = (T, i) => { const s = F.segs.find(x => x.pa && x.pb && sortedSeg(x.pa + x.pb) === sortedSeg(sideN(T, i))); return s && isNumLabel(s.text) ? numOf(s.text) : NaN; };
    if (/Claim \(AAA\)/.test(t)) {
      const a1 = [0, 1, 2].map(i => ang(T1, i)), a2 = [0, 1, 2].map(i => ang(T2, i));
      if ([...a1, ...a2].some(Number.isNaN)) return undefined;
      const meets = a1.every((x, i) => x === a2[i]) || [...a1].sort().join() === [...a2].sort().join() && PERMS.some(p => a1.every((x, i) => x === a2[Number(p[i])]));
      if (!meets) return idxWhere(q, c => /^No: it breaks one of the conditions/.test(c));
      // the angles and one side fix each triangle (law of sines): compare all three sides
      const sides = (T, A) => { const i = [0, 1, 2].find(j => !Number.isNaN(side(T, j))); if (i === undefined) return null; const k = side(T, i) / Math.sin(A[i] * Math.PI / 180); return A.map(x => k * Math.sin(x * Math.PI / 180)).sort((a, b) => a - b); };
      const s1 = sides(T1, a1), s2 = sides(T2, a2);
      if (!s1 || !s2) return undefined;
      const cong = s1.every((x, i) => Math.abs(x - s2[i]) < 1e-6);
      return idxWhere(q, c => (cong ? /^No: the triangles are congruent/.test(c) : /^Yes: it meets every condition/.test(c)));
    }
    if (/Claim \(SSA\)/.test(t)) {
      // the SSA parts: the angle with a label in each, the side next to it and the side opposite it
      const iA = [0, 1, 2].filter(i => !Number.isNaN(ang(T1, i)));
      if (iA.length !== 1 || Number.isNaN(ang(T2, iA[0]))) return undefined;
      const a = iA[0], opp = a, adj = [0, 1, 2].filter(i => i !== a);
      const known = [opp, ...adj].filter(i => !Number.isNaN(side(T1, i)) && !Number.isNaN(side(T2, i)));
      const eq = i => side(T1, i) === side(T2, i);
      // the SSA condition: the angle, the side opposite it and one side next to it
      const ssaSide = adj.find(i => !Number.isNaN(side(T1, i)) && !Number.isNaN(side(T2, i)) && eq(i));
      const meets = ang(T1, a) === ang(T2, a) && !Number.isNaN(side(T1, opp)) && eq(opp) && ssaSide !== undefined;
      if (!meets) return idxWhere(q, c => /^No: it breaks one of the conditions/.test(c));
      const third = adj.find(i => i !== ssaSide);
      if (Number.isNaN(side(T1, third)) || Number.isNaN(side(T2, third))) return undefined;
      void known;
      return idxWhere(q, c => (eq(third) ? /^No: the triangles are congruent/.test(c) : /^Yes: it meets every condition/.test(c)));
    }
    return undefined;
  },
  cxWhich(q) {
    const t = plain(q.prompt);
    const cards = q.data.picture.cards ?? [];
    const isCx = card => {
      const x = plain(card.text);
      if (/Claim \(AAA\)/.test(t)) {
        const m = x.match(/^△[A-Z]{3}: (\d+)°, (\d+)°, (\d+)°, [A-Z]{2} = (\d+(?:\.\d+)?) in\. △[A-Z]{3}: (\d+)°, (\d+)°, (\d+)°, [A-Z]{2} = (\d+(?:\.\d+)?) in\.$/);
        if (!m) return null;
        const a1 = [m[1], m[2], m[3]].map(Number), a2 = [m[5], m[6], m[7]].map(Number);
        const meets = a1.every((v, i) => v === a2[i]);
        return meets && Number(m[4]) !== Number(m[8]);
      }
      if (/Claim \(SSA\)/.test(t)) {
        const facts = [...x.matchAll(/([∠A-Z]+) = (?:([∠A-Z]+) = )?(\d+(?:\.\d+)?) ?(in|°)/g)];
        const vals = {};
        for (const f of facts) { vals[f[1]] = Number(f[3]); if (f[2]) vals[f[2]] = Number(f[3]); }
        const keys = Object.keys(vals);
        const sides = keys.filter(k => /^[A-Z]{2}$/.test(k)), angs = keys.filter(k => /^∠/.test(k));
        // first triangle's names come first in each "X = Y" pair
        const pairsEq = [...x.matchAll(/([∠A-Z]+) = ([∠A-Z]+) = /g)].length;
        const unequal = [...x.matchAll(/([A-Z]{2}) = (\d+(?:\.\d+)?) in, ([A-Z]{2}) = (\d+(?:\.\d+)?) in/g)];
        void sides; void angs;
        // meets the SSA conditions: two side pairs and the angle pair equal (3 "X = Y = v" facts)
        const meets = pairsEq >= 3 && !unequal.some(u => !/^(?:[A-Z]{2})$/.test(u[1]) || false) && pairsEq >= 3;
        const ssaBroken = unequal.some(u => { const before = x.indexOf(u[0]); return x.slice(0, before).split(',').length <= 3; });
        if (!meets || ssaBroken) return false;
        // different third sides → not congruent
        return unequal.length === 1 && Number(unequal[0][2]) !== Number(unequal[0][4]);
      }
      return null;
    };
    const hits = cards.map((c, i) => (isCx(c) ? i : -1)).filter(i => i >= 0);
    if (hits.length !== 1) return -1;
    return idxWhere(q, c => c === plain(cards[hits[0]].head));
  },
  aaaBuild(q) { return idxWhere(q, c => /^(Double|Triple|Halve) every side/.test(c)); },
  aaaSize(q) {
    const t = plain(q.prompt);
    const m = t.match(/△([A-Z]{3}) has the same three angles as △([A-Z]{3}) and is (\d+(?:\.\d+)?) times as large\. ([A-Z]{2}) = (\d+(?:\.\d+)?) in\. How long is ([A-Z]{2})\?/);
    const [Tn, To, k, kn, v, ask] = [m[1], m[2], Number(m[3]), m[4], Number(m[5]), m[6]];
    const map = corrMap(Tn, To);
    const img = ask.split('').map(c => map[c]).join('');
    if (sortedSeg(img) !== sortedSeg(kn)) return undefined;
    return Math.round(k * v * 1e9) / 1e9;
  },

  // ---- SSA ----
  ssaVerify(q) {
    const t = plain(q.prompt);
    const m = t.match(/([A-Z]{2}) = (\d+) in, ([A-Z]{2}) = ([A-Z]{2}) = (\d+) in, m∠([A-Z]) = (\d+)°, ([A-Z]{2}) = (\d+) in and ([A-Z]{2}) = (\d+) in/);
    if (!m) return undefined;
    const [b, a, A, x1, x2] = [Number(m[2]), Number(m[5]), Number(m[7]), Number(m[9]), Number(m[11])];
    const fits = x => Math.abs(a * a - (b * b + x * x - 2 * b * x * Math.cos(A * Math.PI / 180))) < 1e-6;
    if (!fits(x1) || !fits(x2) || x1 === x2) return undefined;
    return idxWhere(q, c => /^Same SSA parts, different third sides/.test(c));
  },
  ssaWhich(q) {
    const F = readFig(q);
    const t = plain(q.prompt);
    const m = t.match(/^([A-Z]) and ([A-Z]) lie on the same ray from ([A-Z]), and ([A-Z]{2}) = (\d+) in\./);
    const [W, Z, R] = [m[1], m[2], m[3]];
    const len = n => { if (sortedSeg(n) === sortedSeg(m[4])) return Number(m[5]); const s = F.segs.find(x => x.pa && x.pb && sortedSeg(x.pa + x.pb) === sortedSeg(n)); return s && isNumLabel(s.text) ? numOf(s.text) : NaN; };
    const k = knowFromFig(F);
    const cong = c => {
      let p = c.match(/^([A-Z]{2}) in each$/);
      if (p) return true;
      p = c.match(/^∠([A-Z]{3}) and ∠([A-Z]{3})$/);
      if (p) return sameGeo(k.geo(partOf('∠' + p[1], [])), k.geo(partOf('∠' + p[2], []))) || k.same(partOf('∠' + p[1], []), partOf('∠' + p[2], []));
      p = c.match(/^([A-Z]{2}) and ([A-Z]{2})$/);
      if (p) { if (k.same({ t: 's', n: p[1] }, { t: 's', n: p[2] })) return true; const x = len(p[1]), y = len(p[2]); return Number.isNaN(x) || Number.isNaN(y) ? null : x === y; }
      return null;
    };
    void W; void Z; void R;
    return idxWhere(q, c => cong(c) === false);
  },
  ssaSwing(q) {
    const t = plain(q.prompt);
    const m = t.match(/m∠([A-Z]) = (\d+)° and ([A-Z]{2}) = (\d+(?:\.\d+)?) in\. The side opposite ∠\1 must be (\d+(?:\.\d+)?) in.*The dashed distance from [A-Z] to the ray is (\d+(?:\.\d+)?) in/);
    const [A, c, r, d] = [Number(m[2]), Number(m[4]), Number(m[5]), Number(m[6])];
    void A;
    if (r < d) return 0;
    if (r === d) return 1;
    if (r < c) return 2;
    return 1;
  },
  ssaArc(q) {
    const t = plain(q.prompt);
    const m = t.match(/m∠([A-Z]) = (\d+)°, ([A-Z]{2}) = (\d+(?:\.\d+)?) in, and the dashed distance from [A-Z] to the ray is (\d+(?:\.\d+)?) in/);
    const [c, d] = [Number(m[4]), Number(m[5])];
    return idxWhere(q, ch => { const v = numOf(ch); return v > d && v < c; });
  },
  scopeJudge(q) { return idxWhere(q, c => /^Wrong:|^Not allowed:/.test(c)); },
  hlSwing(q) {
    const F = readFig(q);
    const t = plain(q.prompt);
    const m = t.match(/a right angle at ([A-Z]), leg ([A-Z]{2}) = (\d+) in, hypotenuse (\d+) in\. The hypotenuse swings about ([A-Z]) and meets the line of the other leg at ([A-Z]) and ([A-Z])/);
    const [E, , leg, hyp, , G, K] = [m[1], m[2], Number(m[3]), Number(m[4]), m[5], m[6], m[7]];
    if (!(hyp > leg)) return idxWhere(q, c => /^None/.test(c));
    const ray = F.segs.find(s => s.kind === 'ray' && s.pa === E);
    if (!ray) return undefined;
    const dir = unit(sub(ray.b, ray.a));
    const on = n => dot(sub(P(F, n), P(F, E)), dir) > 1;
    const onRay = [G, K].filter(on);
    if (onRay.length !== 1) return undefined;
    return idxWhere(q, c => { const r = c.match(/^One: ([A-Z]) and ([A-Z]) are mirror images across ([A-Z]{2}), and only ([A-Z]) is on the ray/); return !!r && r[4] === onRay[0] && sortedSeg(r[3]) === sortedSeg(m[2]); });
  },

  // ---- critique and repair ----
  critique(q) {
    const t = plain(q.prompt);
    let m = t.match(/^\w+: “(.*?), so △([A-Z]{3}) ≅ △([A-Z]{3})\.”/);
    if (m) {
      const [T1, T2] = [m[2], m[3]];
      const k = new Know(null);
      for (const s of m[1].split(/,\s*|\s+and\s+/)) { const p = pairOf(s.trim(), [T1, T2]); if (p) k.union(p[0], p[1]); }
      const f = triFacts(k, T1, T2);
      const pats = patternsOf(f);
      if (worksOf(f).size) return idxWhere(q, c => /^Valid/.test(c));
      if (pats.has('AAA')) return idxWhere(q, c => { const r = c.match(/^Invalid \(AAA\); it becomes valid with one pair of corresponding sides, such as ([A-Z]{2}) ≅ ([A-Z]{2})$/); return !!r && corresponds(null, T1, T2, { t: 's', n: r[1] }, { t: 's', n: r[2] }); });
      if (pats.has('SSA')) {
        return idxWhere(q, c => {
          const r = c.match(/^Invalid \(SSA\); it becomes valid if ∠([A-Z]) and ∠([A-Z]) are right angles \(HL\)$/);
          if (!r) return false;
          const i = T1.indexOf(r[1]);
          if (i < 0 || T2[i] !== r[2]) return false;
          const kk = new Know(null); for (const s of m[1].split(/,\s*|\s+and\s+/)) { const p = pairOf(s.trim(), [T1, T2]); if (p) kk.union(p[0], p[1]); }
          kk.setRight(angP(T1, i)); kk.setRight(angP(T2, i));
          return worksOf(triFacts(kk, T1, T2)).has('HL');
        });
      }
      return undefined;
    }
    m = t.match(/^\w+: “(.*?)\. That proves nothing, because the side is not between the angles\.”/);
    if (m) {
      const k = new Know(null);
      const T1 = 'ABC', T2 = 'DEF';
      for (const s of m[1].split(/,\s*|\s+and\s+/)) { const p = pairOf(s.trim().replace(/^and /, ''), [T1, T2]); if (p) k.union(p[0], p[1]); }
      const pats = patternsOf(triFacts(k, T1, T2));
      if (pats.has('AAS')) return idxWhere(q, c => /is wrong: AAS is valid/.test(c));
      return undefined;
    }
    if (/checked an SSA counterexample/.test(t) && /just an exception/.test(t)) return idxWhere(q, c => /is wrong: one checked counterexample is enough/.test(c));
    return undefined;
  },
  repairPick(q) {
    const F = readFig(q);
    const [T1, T2] = namedTris(q);
    if (worksOf(triFacts(knowFromFig(F), T1, T2)).size) return undefined;
    return idxWhere(q, c => {
      let p = pairOf(c, [T1, T2]);
      const mm = c.match(/^m∠([A-Z]) = m∠([A-Z]) = (\d+)°$/);
      if (mm) p = [partOf('∠' + mm[1], [T1, T2], 0), partOf('∠' + mm[2], [T1, T2], 1)];
      if (!p) return false;
      const k = knowFromFig(F); k.union(p[0], p[1]);
      return worksOf(triFacts(k, T1, T2)).size > 0;
    });
  },

  // ---- CPCTC algebra ----
  solveX(q) {
    const t = plain(q.prompt);
    const m = t.match(/△([A-Z]{3}) ≅ △([A-Z]{3})\. (m∠[A-Z]|[A-Z]{2}) = (.*?)(?: cm)? and (m∠[A-Z]|[A-Z]{2}) = (\d+(?:\.\d+)?)°?(?: cm)?\. Find x\./);
    if (!m) return undefined;
    const [T1, T2] = [m[1], m[2]];
    const a = partOf(m[3], [T1, T2], 0), b = partOf(m[5], [T1, T2], 1);
    if (!corresponds(null, T1, T2, a, b) && !corresponds(null, T1, T2, b, a)) return undefined;
    const L = linear(m[4]);
    if (!L) return undefined;
    return (Number(m[6]) - L[1]) / L[0];
  },
  solvePart(q) {
    const r = solvePartOf(q);
    if (!r) return undefined;
    return r.value;
  },
};

// =====================================================================================================================
// shared pieces of the families
function pickCrit(q, works) {
  const hits = allWhere(q, c => works.has(c));
  if (hits.length === 1) return hits[0];
  if (hits.length === 0 && works.size === 0) return idxWhere(q, c => /^Not enough information/.test(c));
  return -1;
}
/** "which criterion proves it": from the marks, the givens and what the figure carries itself */
function classifyFig(q) {
  const F = readFig(q);
  let named = namedTris(q);
  const pairs = [];
  if (named.length >= 2) pairs.push([named[named.length - 2], named[named.length - 1]]);
  else {
    const tris = twoTriangles(F);
    if (!tris) return undefined;
    for (const p of PERMS) pairs.push([tris[0], permute(tris[1], p)]);
    named = tris;
  }
  const works = new Set();
  for (const [T1, T2] of pairs) {
    const k = knowFromFig(F);
    for (const [a, b] of knownPairsFromText(q, [T1, T2])) k.union(a, b);
    const par = plain(q.prompt).match(/([A-Z]{2}) ∥ ([A-Z]{2})/);
    if (par) { const a = geoSeg(F, par[1]), b = geoSeg(F, par[2]); if (a && b) k.par.push({ a: a.a, b: a.b, grp: 99 }, { a: b.a, b: b.b, grp: 99 }); }
    addHidden(k, F, T1, T2);
    for (const w of worksOf(triFacts(k, T1, T2))) works.add(w);
  }
  return pickCrit(q, works);
}
/** for a statement T1 ≅ T2: does every marked pair between the two triangles correspond? */
function marksFit(F, T1, T2) {
  const k = new Know(F);
  const groups = new Map();
  const put = (g, p) => { if (!groups.has(g)) groups.set(g, []); groups.get(g).push(p); };
  for (const s of F.segs) if (s.ticks > 0 && s.pa && s.pb) put('t' + s.ticks, { t: 's', n: s.pa + s.pb });
  for (const a of F.angs) if (a.arcs > 0 && a.V) put('a' + a.arcs, a);
  const inT = (T, n) => n.split('').every(c => T.includes(c));
  let used = 0;
  for (const list of groups.values()) {
    for (const x of list) for (const y of list) {
      if (x === y) continue;
      if (x.t === 's' && y.t === 's') {
        if (!(inT(T1, x.n) && inT(T2, y.n))) continue;
        if (inT(T2, x.n) && inT(T1, y.n) && inT(T1, x.n) && inT(T2, y.n) && sortedSeg(x.n) === sortedSeg(y.n)) continue;
        used++;
        if (!corresponds(F, T1, T2, { t: 's', n: x.n }, { t: 's', n: y.n })) return false;
      }
    }
  }
  void k;
  return used > 0;
}
function sharedVertexTris(F) {
  // two triangles with one common vertex: the five points, the segments joined
  const names = Object.keys(F.pts);
  const has = (a, b) => F.segs.some(s => (s.pa === a && s.pb === b) || (s.pa === b && s.pb === a));
  const tris = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) for (let l = j + 1; l < names.length; l++) {
    const [a, b, c] = [names[i], names[j], names[l]];
    if (has(a, b) && has(b, c) && has(a, c)) tris.push(a + b + c);
  }
  return tris;
}
/** the chosen pair is one of the three corresponding pairs (not an extra fact) */
function usesPair(F, T1, T2, p) {
  const [a, b] = p;
  return corresponds(F, T1, T2, a, b) || corresponds(F, T1, T2, b, a);
}
function proofReason(q) {
  const F = readFig(q), pf = proofOf(q);
  const i = pf.ask[0].i;
  return idxWhere(q, c => {
    const rows = pf.rows.map((r, j) => (j === i ? { st: r.st, rs: c } : r));
    return lineOk(F, pf, rows, i);
  });
}
function kindOf(s) {
  const t = low(s);
  if (/three angles/.test(t)) return 'AAA';
  if (/three sides/.test(t)) return 'SSS';
  if (/non-included angle/.test(t)) return 'SSA';
  if (/two sides and the included angle/.test(t)) return 'SAS';
  if (/two angles and the included side/.test(t)) return 'ASA';
  if (/two angles and a non-included side/.test(t)) return 'AAS';
  if (/hypotenuse/.test(t)) return 'HL';
  return '?';
}

/** a CPCTC "find the part" item: { x, value, exprs } (sides or angles) */
function solvePartOf(q) {
  const t = plain(q.prompt);
  const PART = '(m∠[A-Z]|[A-Z]{2})';
  const m = t.match(new RegExp(`△([A-Z]{3}) ≅ △([A-Z]{3})\\. ${PART} = (.*?), ${PART} = (.*?) and ${PART} = (\\d+(?:\\.\\d+)?)(?:°| cm)?\\. Find ${PART}\\.`));
  if (!m) return null;
  const [T1, T2] = [m[1], m[2]];
  const exprs = [[m[3], m[4]], [m[5], m[6]]];
  const known = partOf(m[7], [T1, T2], 1), v = Number(m[8]);
  const src = exprs.find(([n]) => { const p = partOf(n, [T1, T2], 0); return p && (corresponds(null, T1, T2, p, known) || corresponds(null, T1, T2, known, p)); });
  if (!src) return null;
  const L = linear(src[1]);
  if (!L) return null;
  const x = (v - L[1]) / L[0];
  const ask = exprs.find(([n]) => n === m[9] || (n.length === 2 && sortedSeg(n) === sortedSeg(m[9])));
  const A = ask && linear(ask[1]);
  if (!A) return null;
  return { x, value: A[0] * x + A[1], exprs, angles: m[9].startsWith('m∠'), vals: exprs.map(([, e]) => { const l = linear(e); return l ? l[0] * x + l[1] : NaN; }) };
}
/** x in a CPCTC algebra item (the value the corresponding parts force) */
function solveForX(q) {
  if (q.family === 'solveX') return SOLVERS.solveX(q);
  return solvePartOf(q)?.x;
}

// ---- rigid-motion steps ----
function motionCtx(q) {
  const t = plain(q.prompt);
  const m = t.match(/Why does (SSS|SAS|ASA) always give congruence\? Look at step (\d) of the moves that carry △([A-Z]{3}) onto △([A-Z]{3})\. (.*)$/)
    ?? t.match(/^The moves carry △([A-Z]{3}) onto △([A-Z]{3}) using only the (SSS|SAS|ASA) pairs\./);
  if (!m) return null;
  if (m[1].length === 3 && /^[A-Z]{3}$/.test(m[1]) && m[3] && /^(SSS|SAS|ASA)$/.test(m[3])) return { crit: m[3], t: m[1], u: m[2], step: Number(texSt(q.board).match(/step (\d)/)?.[1] ?? 0), ask: '' };
  return { crit: m[1], step: Number(m[2]), t: m[3], u: m[4], ask: m[5] };
}
function stepTexts(crit, t, u, k, i) { // k: the angle vertex (SAS) / i,k: the side's ends (ASA, SSS); j: the third
  const j = [0, 1, 2].find(x => x !== i && x !== k);
  const T = c => t[c], U = c => u[c];
  if (crit === 'SAS') return [
    `Slide △${t} so that ${T(k)} lands on ${U(k)}.`,
    `Turn about ${U(k)} until ray ${T(k)}${T(i)} lies along ray ${U(k)}${U(i)}: ${T(i)} lands on ${U(i)}.`,
    `If ${T(j)} is on the other side of line ${U(i)}${U(k)} from ${U(j)}, reflect across line ${U(i)}${U(k)}.`,
    `Now ray ${T(k)}${T(j)} lies along ray ${U(k)}${U(j)}, and ${T(j)} lands on ${U(j)}.`,
  ];
  const move = `Move △${t} so that ${T(i)}${T(k)} lies on ${U(i)}${U(k)}: ${T(i)} on ${U(i)}, ${T(k)} on ${U(k)}.`;
  if (crit === 'ASA') return [
    move,
    `If ${T(j)} is on the other side of line ${U(i)}${U(k)} from ${U(j)}, reflect across line ${U(i)}${U(k)}.`,
    `Now ray ${T(i)}${T(j)} lies along ray ${U(i)}${U(j)}, and ray ${T(k)}${T(j)} along ray ${U(k)}${U(j)}.`,
    `${T(j)} lands on ${U(j)}.`,
  ];
  return [
    move,
    `${T(j)} keeps its distances: it lies on the circle about ${U(i)} with radius ${T(i)}${T(j)} and on the circle about ${U(k)} with radius ${T(k)}${T(j)}.`,
    `${U(j)} is on both circles too, since ${T(i)}${T(j)} ≅ ${U(i)}${U(j)} and ${T(k)}${T(j)} ≅ ${U(k)}${U(j)}.`,
    `If ${T(j)} is at the mirror point, reflect across line ${U(i)}${U(k)}: ${T(j)} lands on ${U(j)}.`,
  ];
}
const normStep = s => plain(s).replace(/^\d+\.\s*/, '').replace(/line ([A-Z])([A-Z])/g, (_, a, b) => `line ${[a, b].sort().join('')}`);
/** the step sequences the marks allow: the parameters (angle vertex / side) the figure marks */
function motionSeqs(q, ctx) {
  const F = readFig(q);
  const k = knowFromFig(F);
  const f = F ? triFacts(k, ctx.t, ctx.u) : { S: new Set([0, 1, 2]), A: new Set([0, 1, 2]) };
  const out = [];
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
    if (a === b) continue;
    if (ctx.crit === 'SAS') { const others = [0, 1, 2].filter(x => x !== b); if (!(f.A.has(b) && others.every(x => f.S.has(x)))) continue; }
    if (ctx.crit === 'ASA') { const side = [0, 1, 2].find(x => x !== a && x !== b); if (!(f.S.has(side) && f.A.has(a) && f.A.has(b))) continue; }
    if (ctx.crit === 'SSS' && f.S.size !== 3) continue;
    out.push({ i: a, k: b, j: [0, 1, 2].find(x => x !== a && x !== b), steps: stepTexts(ctx.crit, ctx.t, ctx.u, b, a) });
  }
  // keep the ones whose shown steps match the card
  const card = (q.data?.picture?.card?.lines ?? []).map(normStep);
  return out.filter(s => card.every((line, n) => line === '?' || line === normStep(s.steps[n])));
}
function motionNext(q) {
  const ctx = motionCtx(q);
  if (!ctx) return undefined;
  const seqs = motionSeqs(q, ctx);
  const n = ctx.step - 1;
  return idxWhere(q, c => seqs.some(s => normStep(c) === normStep(s.steps[n])));
}
function motionWhy(q) {
  const ctx = motionCtx(q);
  if (!ctx) return undefined;
  const seqs = motionSeqs(q, ctx);
  if (!seqs.length) return undefined;
  const { t, u, crit, ask } = ctx;
  const map = corrMap(t, u);
  const F = readFig(q), k = knowFromFig(F);
  const corrSeg = (a, b) => sortedSeg(a.split('').map(c => map[c]).join('')) === sortedSeg(b);
  const markedSeg = (a, b) => corrSeg(a, b) && (!F || k.same({ t: 's', n: a }, { t: 's', n: b }));
  const judge = c => seqs.some(s => {
    const T = x => t[x], U = x => u[x];
    const lineIK = sortedSeg(U(s.i) + U(s.k));
    let m;
    if ((m = ask.match(/^Why does ([A-Z]) land on ([A-Z])\?$/))) {
      if (crit === 'SAS') { const r = c.match(/^∠([A-Z]) ≅ ∠([A-Z]) puts ray ([A-Z]{2}) along ray ([A-Z]{2}), and ([A-Z]{2}) ≅ ([A-Z]{2}) fixes the point on it$/); return !!r && r[1] === T(s.k) && r[2] === U(s.k) && r[3] === T(s.k) + T(s.j) && r[4] === U(s.k) + U(s.j) && markedSeg(r[5], r[6]) && r[5].includes(T(s.j)); }
      if (crit === 'ASA') { const r = c.match(/^([A-Z]) lies on both rays, and the two rays meet in only one point: ([A-Z])$/); return !!r && r[1] === T(s.j) && r[2] === U(s.j); }
      return false;
    }
    if ((m = ask.match(/^Why does ([A-Z]) land exactly on ([A-Z])\?$/))) { const r = c.match(/^([A-Z]{2}) ≅ ([A-Z]{2}), and a rigid motion keeps lengths$/); return !!r && r[1].includes(m[1]) && markedSeg(r[1], r[2]) && r[2].includes(m[2]); }
    if (/^Why is a reflection allowed here\?$/.test(ask)) { const r = c.match(/^A reflection is a rigid motion, and it keeps the points on line ([A-Z]{2}) where they are$/); return !!r && sortedSeg(r[1]) === lineIK; }
    if (/^Why may we start by moving/.test(ask)) return /^A translation can carry any point onto any other point$/.test(c);
    if (/^Why reflect\?$/.test(ask)) { const r = c.match(/^So that ([A-Z]) and ([A-Z]) are on the same side of line ([A-Z]{2}); a reflection is a rigid motion$/); return !!r && r[1] === T(s.j) && r[2] === U(s.j) && sortedSeg(r[3]) === lineIK; }
    if (/^Why do the rays line up\?$/.test(ask)) {
      const r = c.match(/^∠([A-Z]) ≅ ∠([A-Z]) and ∠([A-Z]) ≅ ∠([A-Z]), on the same side of the shared side$/);
      return !!r && map[r[1]] === r[2] && map[r[3]] === r[4] && new Set([r[1], r[3]]).size === 2 && [r[1], r[3]].every(x => x === T(s.i) || x === T(s.k));
    }
    if (/^Why can [A-Z] land on [A-Z] and [A-Z] on [A-Z] at the same time\?$|^Why can both endpoints match\?$/.test(ask)) { const r = c.match(/^([A-Z]{2}) ≅ ([A-Z]{2}), and a rigid motion keeps lengths$/); return !!r && sortedSeg(r[1]) === sortedSeg(T(s.i) + T(s.k)) && markedSeg(r[1], r[2]); }
    if (/^Why does the reflection finish the job\?$/.test(ask)) { const r = c.match(/^It keeps ([A-Z]) and ([A-Z]) and swaps the two meeting points$/); return !!r && sortedSeg(r[1] + r[2]) === lineIK; }
    if ((m = ask.match(/^Where can the image of ([A-Z]) be\?$/))) { const r = c.match(/^Where the two circles meet: at most two points, mirror images across line ([A-Z]{2})$/); return !!r && sortedSeg(r[1]) === lineIK && m[1] === T(s.j); }
    if ((m = ask.match(/^So where is ([A-Z]) now\?$/))) { const r = c.match(/^On ([A-Z]), or on the mirror image of ([A-Z]) across line ([A-Z]{2})$/); return !!r && r[1] === U(s.j) && r[2] === U(s.j) && sortedSeg(r[3]) === lineIK && m[1] === T(s.j); }
    return false;
  });
  return idxWhere(q, c => judge(c));
}

// =====================================================================================================================
// the oracle
export default {
  solve(q) {
    const f = SOLVERS[q.family];
    if (!f) return undefined;
    return f(q);
  },
  sane(q) {
    const F = readFig(q);
    const t = plain(q.prompt);
    if (F?.dup.length) return `two points share the label ${F.dup.join(', ')} in the figure`;
    // every triangle the prompt names must be in the figure, with its labels
    if (F && Object.keys(F.pts).length >= 3) {
      for (const T of [...t.matchAll(/△([A-Z]{3})/g)].map(m => m[1])) {
        if (!['proofParsons', 'proofGap', 'cpctcNext', 'stmtAndCrit', 'writeStmt', 'stmtFromList'].includes(q.family) && !T.split('').every(c => F.pts[c])) return `△${T} is named but not labelled in the figure`;
      }
      // a measure label on a drawn angle should match the drawing (labelled measures are drawn at their measure)
      for (const a of F.angs) {
        if (a.text && isNumLabel(a.text) && !/not drawn to scale/.test(t)) {
          const g = angMeasure(a);
          if (Math.abs(g - numOf(a.text)) > 1.5 && Math.abs(360 - g - numOf(a.text)) > 1.5) return `∠ labelled ${a.text} is drawn at ${g.toFixed(1)}°`;
        }
        if (a.box && Math.abs(angMeasure(a) - 90) > 1) return `a right-angle box on a ${angMeasure(a).toFixed(1)}° angle`;
      }
    }
    // a choice item with more than one right criterion offered
    if (['classify', 'hiddenCrit', 'overlapCrit', 'classifyList'].includes(q.family)) {
      const r = SOLVERS[q.family](q);
      if (r === -1) return 'no single right criterion among the choices (two that work, or none)';
    }
    // lengths and angles that come out of the algebra: every expression is a positive measure at the solution
    if (q.family === 'solveX' || q.family === 'solvePart') {
      const x = solveForX(q);
      if (x !== undefined) {
        for (const e of [...t.matchAll(/= (\(?[\d]*x[^,]*?\)?°?)(?: cm)?(?:,| and |\.)/g)].map(m => m[1])) {
          const L = linear(e);
          if (L && !(L[0] * x + L[1] > 0)) return `${e} is ${L[0] * x + L[1]} at x = ${x}: not a positive measure`;
          if (L && /°/.test(e) && !(L[0] * x + L[1] < 180)) return `${e} is ${L[0] * x + L[1]}°: too large for a triangle`;
        }
      }
    }
    if (q.family === 'solvePart') {
      const r = solvePartOf(q);
      if (r?.angles && !(r.vals[0] + r.vals[1] < 180)) return `two angles of one triangle add to ${r.vals[0] + r.vals[1]}°`;
    }
    // a triangle's labelled sides must make a triangle
    if (F) {
      for (const T of twoTriangles(F) ?? []) {
        const s = [0, 1, 2].map(i => { const x = F.segs.find(g => g.pa && g.pb && sortedSeg(g.pa + g.pb) === sortedSeg(sideN(T, i))); return x && isNumLabel(x.text) ? numOf(x.text) : NaN; });
        if (s.every(v => !Number.isNaN(v)) && !(s[0] + s[1] > s[2] && s[1] + s[2] > s[0] && s[0] + s[2] > s[1])) return `△${T} has sides ${s.join(', ')}: no triangle`;
        const a = [0, 1, 2].map(i => { const g = geoAng(F, T[i], ...T.split('').filter((_, j) => j !== i)); const x = F.angs.find(h => h.text && isNumLabel(h.text) && sameGeo({ t: 'a', v: h.v, d1: h.d1, d2: h.d2 }, g)); return x ? numOf(x.text) : NaN; });
        if (a.every(v => !Number.isNaN(v)) && a[0] + a[1] + a[2] !== 180) return `△${T} has angles ${a.join(', ')}: not 180°`;
      }
    }
    // SSA swing: the dashed distance must be the true distance (PT · sin ∠P)
    if (q.family === 'ssaSwing' || q.family === 'ssaArc') {
      const m = t.match(/m∠[A-Z] = (\d+)°(?: and|,) [A-Z]{2} = (\d+(?:\.\d+)?) in.*distance from [A-Z] to the ray is (\d+(?:\.\d+)?) in/);
      if (m && Math.abs(Number(m[2]) * Math.sin(Number(m[1]) * Math.PI / 180) - Number(m[3])) > 1e-6) return `the distance to the ray should be ${Number(m[2]) * Math.sin(Number(m[1]) * Math.PI / 180)}, not ${m[3]}`;
    }
    if (q.family === 'hlSwing') {
      const m = t.match(/leg [A-Z]{2} = (\d+) in, hypotenuse (\d+) in/);
      if (m && !(Number(m[2]) > Number(m[1]))) return 'the hypotenuse is not longer than the leg';
    }
    if (q.family === 'ssaVerify' && SOLVERS.ssaVerify(q) === undefined) return 'the SSA numbers do not fit the law of cosines (or the two triangles are the same)';
    return '';
  },
};
