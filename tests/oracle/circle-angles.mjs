// Oracle for the lesson "circle-angles" (Geometry 12: arcs and angles in circles). Written from what the student sees
// only: the prompt, the board, the choices, the circle figure (points on the circle, chords, radii, tangent and secant
// lines, angle marks, highlighted arcs), the card and the proof frame. See docs/lessons/QUALITY_LAYER.md, "O: the
// oracle". Never reads the lesson's generators, maths or proofs.
//
// How it decides:
// - Numbers: the stated measures with the theorem the configuration calls for (central = arc, inscribed = half the
//   arc it intercepts, inside = half the sum, outside = half the difference, tangent-chord = half the arc inside it,
//   circumscribed = 180 - central, cyclic = supplementary, semicircle = 90, radii = isosceles). Where the text leaves
//   the configuration open (which side of a chord a point is on), the drawn POSITIONS decide, never a drawn measure.
// - Classification: computed from the drawing: where the vertex is (center, on, inside, outside), whether each side
//   is a chord, a radius or a line that meets the circle once (tangent) or twice (secant).
// - Proofs: each family's proof is rebuilt here from the givens (letters, variables, arcs) as a list of rows with the
//   statements and reasons a careful teacher accepts; the asked cell is the choice that fits, every shown row is
//   checked against it (a theorem is never a reason in its own proof).
// - sane(q): the figure agrees with the text (stated angles and arcs at their measure, tangents tangent, diameters
//   through the center, points on / inside / outside as stated, the asked quantity measures the answer), the text is
//   clean (double periods, a/an, relabelled words, raw TeX, "1 chords").

import { nums, round } from '../../tools/quality/oracle-kit.mjs';

// =====================================================================================================================
// text
const OVL = /\u0305/g;
const plain = s => String(s ?? '').replace(OVL, '').replace(/−/g, '-').replace(/\s+/g, ' ').trim();
const low = s => plain(s).toLowerCase();
const idxWhere = (q, pred) => { const h = (q.choices ?? []).map((c, i) => (pred(plain(c), i) ? i : -1)).filter(i => i >= 0); return h.length === 1 ? h[0] : -1; };
const N = s => Number(s);
const sortL = s => s.split('').sort().join('');
const angKey = n => (n[0] < n[2] ? n : n[2] + n[1] + n[0]);

/** a statement (TeX or plain) in one canonical form, for comparing proof rows with choices */
function nz(t) {
  let s = String(t ?? '');
  s = s.replace(/\\tfrac([a-z])\s*\+\s*([a-z])(\d)/g, '($1+$2)/($3)');
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\overparen\{([^{}]*)\}/g, 'arc$1').replace(/\\overline\{([^{}]*)\}/g, '$1')
      .replace(/\\overleftrightarrow\{([^{}]*)\}/g, 'line$1').replace(/\\text\{([^{}]*)\}/g, '$1')
      .replace(/\\t?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
  }
  s = s.replace(/\\angle\s*/g, '∠').replace(/\^\{?\\circ\}?/g, '°').replace(/\\[,;: !]/g, ' ').replace(/\\to|\\rightarrow/g, '→')
    .replace(/\\[a-zA-Z]+/g, ' ').replace(/[{}]/g, '');
  s = s.replace(OVL, '').replace(/m\(arc ([A-Z]+)\)/g, 'marc$1').replace(/\barc ([A-Z]+)/g, 'arc$1').replace(/½/g, '(1)/(2)')
    .replace(/[−–]/g, '-').replace(/\s+/g, '');
  // a bracketed single term next to a fraction bar is the same as the bare term: (u+v)/(2) = (u+v)/2, (1)/(2) = 1/2
  s = s.replace(/\(([A-Za-z0-9.]+)\)\//g, '$1/').replace(/\/\(([A-Za-z0-9.]+)\)/g, '/$1');
  s = s.replace(/∠([A-Z])([A-Z])([A-Z])/g, (m, a, b, c) => '∠' + angKey(a + b + c));
  s = s.replace(/arc([A-Z]{2,3})(?![A-Z])/g, (m, n) => 'arc' + (n.length === 2 ? sortL(n) : angKey(n)));
  // "OJ=OW" and "m∠X=m∠Y" in either order
  let m = s.match(/^([A-Z]{2})=([A-Z]{2})$/);
  if (m) s = [sortL(m[1]), sortL(m[2])].sort().join('=');
  m = s.match(/^(m∠[A-Z]{3})=(m∠[A-Z]{3})$/);
  if (m) s = [m[1], m[2]].sort().join('=');
  m = s.match(/^([A-Z]{2})isadiameter$/);
  if (m) s = sortL(m[1]) + 'isadiameter';
  return s;
}
const rsn = s => low(s).replace(/[−–]/g, '-').replace(/\s+/g, ' ');

// =====================================================================================================================
// geometry
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = a => Math.hypot(a[0], a[1]);
const dist = (a, b) => len(sub(a, b));
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const nrm = d => ((d % 360) + 360) % 360;
const deg = r => (r * 180) / Math.PI;
const EPS = 0.6;

function figOf(q) {
  const c = q.data?.picture?.cfig;
  if (!c) return null;
  const C = c.circles[0];
  const pts = {};
  for (const p of c.fig.points) if (p.name) pts[p.name] = p.at;
  const F = { c, C, O: C.O, R: C.R, pts, segs: c.fig.segs ?? [], angles: c.fig.angles ?? [], arcs: c.arcs ?? [] };
  F.pt = n => pts[n] ?? (n === 'O' ? C.O : undefined);
  F.has = s => [...s].every(ch => F.pt(ch));
  F.polar = p => nrm(deg(Math.atan2(p[1] - F.O[1], p[0] - F.O[0])));
  F.on = p => Math.abs(dist(p, F.O) - F.R) < 0.5;
  F.inside = p => dist(p, F.O) < F.R - 0.5;
  F.outside = p => dist(p, F.O) > F.R + 0.5;
  F.isO = p => dist(p, F.O) < 0.5;
  F.lineD = (a, b) => Math.abs(cross(sub(b, a), sub(F.O, a))) / len(sub(b, a));
  F.meets = (a, b) => { const d = F.lineD(a, b); return d < F.R - 0.5 ? 2 : d <= F.R + 0.5 ? 1 : 0; };
  /** ccw span from point x to point y (degrees) */
  F.ccw = (x, y) => nrm(F.polar(F.pt(y)) - F.polar(F.pt(x)));
  /** is point m strictly on the ccw arc from x to y */
  F.within = (m, x, y) => { const a = F.ccw(x, m), b = F.ccw(x, y); return a > 1e-6 && a < b - 1e-6; };
  /** arc x..y through point m */
  F.arcVia = (x, m, y) => (F.within(m, x, y) ? F.ccw(x, y) : 360 - F.ccw(x, y));
  F.arcNot = (x, y, v) => (F.within(v, x, y) ? 360 - F.ccw(x, y) : F.ccw(x, y));
  F.minor = (x, y) => Math.min(F.ccw(x, y), 360 - F.ccw(x, y));
  F.meas = name => { const [a, v, b] = [...name].map(F.pt); return deg(Math.acos(Math.max(-1, Math.min(1, dot(sub(a, v), sub(b, v)) / (len(sub(a, v)) * len(sub(b, v))))))); };
  /** sign of the side of point p relative to line ab */
  F.side = (p, a, b) => Math.sign(cross(sub(F.pt(b), F.pt(a)), sub(F.pt(p), F.pt(a))));
  return F;
}
/** the measure of the arc named in the text (2 letters = minor, 3 letters = through the middle one) */
const arcM = (F, n) => (n.length === 3 ? F.arcVia(n[0], n[1], n[2]) : F.minor(n[0], n[1]));

// =====================================================================================================================
// reading the prompt
const angGiven = t => Object.fromEntries([...plain(t).matchAll(/m∠([A-Z]{3}) = (\d+(?:\.\d+)?)°(?! -)/g)].map(m => [m[1], N(m[2])]));
const arcGiven = t => Object.fromEntries([...plain(t).matchAll(/m\(arc ([A-Z]{2,3})\) = (\d+(?:\.\d+)?)°/g)].map(m => [m[1], N(m[2])]));
const askAng = t => plain(t).match(/What is m∠([A-Z]{3})\b/)?.[1];
const askArc = t => plain(t).match(/What is m\(arc ([A-Z]{2,3})\)/)?.[1];
const first = o => Object.entries(o)[0];
/** the vertex letter of an angle named ∠ABC, or the point letter for ∠A */
const vx = n => (n.length === 3 ? n[1] : n);

// =====================================================================================================================
// angle classification from the drawing
function kindOf(F, name) {
  const [p, v, q] = name;
  const V = F.pt(v), P = F.pt(p), Qp = F.pt(q);
  if (!V || !P || !Qp) return null;
  if (F.isO(V)) return F.on(P) && F.on(Qp) ? 'central' : 'none';
  if (F.on(V)) return F.on(P) && F.on(Qp) ? 'inscribed' : 'none';
  if (F.outside(V)) {
    return F.meets(V, P) === 1 && F.meets(V, Qp) === 1 ? 'circumscribed' : 'none';
  }
  return 'none';
}
const KIND_RE = { central: /^a central angle/, inscribed: /^an inscribed angle/, circumscribed: /^a circumscribed angle/, none: /^none of these/ };

// =====================================================================================================================
// families
function solveNumeric(q) {
  const t = plain(q.prompt), F = figOf(q), fam = q.family;
  const A = angGiven(t), Ar = arcGiven(t), aA = askAng(t), aR = askArc(t);
  switch (fam) {
    case 'simScale': {
      const r = nums(t.match(/radius ([\d.]+)[^;]*; circle \w has radius ([\d.]+)/).slice(1).join(' '));
      return r[1] / r[0];
    }
    case 'chordCount': return F.segs.filter(s => F.on(s.a) && F.on(s.b)).length;
    case 'arcMeasure': {
      if (/is a diameter/.test(t)) return 180;
      const ag = first(A);
      if (ag) { // central angle -> arc
        const [n, v] = ag, x = n[0], y = n[2];
        if (aR.length === 2) return v;
        return F.within(aR[1], x, y) === (F.ccw(x, y) <= 180) ? v : 360 - v;
      }
      return Object.values(Ar).reduce((s, v) => s + v, 0);
    }
    case 'halveArc': {
      const [n, v] = first(Ar), whole = /midpoint of arc ([A-Z]+)/.exec(t)[1];
      return n === whole ? v / 2 : 2 * v;
    }
    case 'inscribedArc': case 'inscribedMajor': case 'inscribedCentral': case 'semicircle': case 'cyclicQuad':
    case 'tangentRadius': case 'circumValue': case 'chordChord': case 'exteriorAngle':
    case 'radiusIso': case 'sameArc': case 'chase2': case 'chase3': case 'realWorld':
      return numFam[fam](q, t, F, A, Ar, aA, aR);
    case 'algebra': return algebra(t);
    case 'tangentChord': if (/What is x\?|\(\d*x/.test(t)) return algebra(t); return numFam.tangentChord(q, t, F, A, Ar, aA, aR);
    default: return undefined;
  }
}

const numFam = {
  inscribedArc(q, t, F, A, Ar, aA, aR) {
    if (aR) return 2 * first(A)[1];
    return first(Ar)[1] / 2;
  },
  inscribedMajor(q, t, F, A, Ar, aA, aR) {
    if (aR) return 360 - 2 * first(A)[1];
    return (360 - first(Ar)[1]) / 2;
  },
  inscribedCentral(q, t, F, A, Ar, aA) {
    const [n, v] = first(A);
    const central = n[1] === 'O';
    const ins = central ? aA : n, cen = central ? n : aA;
    // the inscribed vertex on the minor arc of the central angle sees the major arc
    const far = !F.within(ins[1], cen[0], cen[2]) === (F.ccw(cen[0], cen[2]) <= 180);
    if (central) return far ? v / 2 : (360 - v) / 2;
    return far ? 2 * v : 360 - 2 * v;
  },
  semicircle(q, t, F, A, Ar, aA) {
    const ag = first(A);
    if (!ag) return 90;
    return 90 - ag[1];
  },
  cyclicQuad(q, t, F, A, Ar, aA) {
    const quad = t.match(/Quadrilateral ([A-Z]{4})/)[1];
    const i = quad.indexOf(aA[1]), opp = quad[(i + 2) % 4];
    const g = Object.entries(A).find(([n]) => n[1] === opp);
    return g ? 180 - g[1] : NaN;
  },
  tangentRadius(q, t, F, A, Ar, aA) {
    const tp = t.match(/tangent to circle O at ([A-Z])/)[1];
    if (aA[1] === tp) return 90;
    const [, v] = first(A);
    return 90 - v;
  },
  circumValue(q, t, F, A, Ar, aA, aR) {
    if (aR) return 180 - first(A)[1];
    const g = first(A) ?? first(Ar);
    return 180 - g[1];
  },
  tangentChord(q, t, F, A, Ar, aA, aR) {
    if (aR) return 2 * first(A)[1];
    const [, v] = first(Ar);
    const inside = t.match(/the arc inside ∠([A-Z]{3})/)[1];
    return sortL(inside) === sortL(aA) ? v / 2 : (360 - v) / 2;
  },
  chordChord(q, t, F, A, Ar, aA, aR) {
    const ch = [...t.matchAll(/Chords ([A-Z]{2}) and ([A-Z]{2})/g)][0];
    const c1 = ch[1], c2 = ch[2];
    const partner = x => (c1.includes(x) ? c1.replace(x, '') : c2.replace(x, ''));
    const pairOf = n => sortL(n[0] + n[2]);
    const vert = n => sortL(partner(n[0]) + partner(n[2]));
    if (aR) { // angle + one arc -> the other arc
      const [an, v] = first(A), [rn, r] = first(Ar);
      const arcs = [pairOf(an), vert(an)];
      if (!arcs.includes(sortL(rn)) || !arcs.includes(sortL(aR))) return NaN;
      return 2 * v - r;
    }
    const s = Object.values(Ar).reduce((x, y) => x + y, 0) / 2;
    const names = Object.keys(Ar).map(sortL).sort().join();
    const mine = [pairOf(aA), vert(aA)].sort().join();
    return names === mine ? s : 180 - s;
  },
  exteriorAngle(q, t, F, A, Ar, aA, aR) {
    if (/tangent to the circle at [A-Z] and [A-Z]/.test(t)) { const [, v] = first(Ar); return ((360 - v) - v) / 2; }
    if (aR) { const [, v] = first(A), [, near] = first(Ar); return 2 * v + near; }
    const vals = Object.values(Ar);
    return Math.abs(vals[0] - vals[1]) / 2;
  },
  radiusIso(q, t, F, A, Ar, aA) {
    const [n, v] = first(A);
    return n[1] === 'O' ? (180 - v) / 2 : 180 - 2 * v;
  },
  sameArc(q, t, F, A, Ar, aA) {
    const [n, v] = first(A);
    const same = F.side(n[1], n[0], n[2]) === F.side(aA[1], n[0], n[2]);
    return same ? v : 180 - v;
  },
  chase2(q, t, F, A, Ar, aA, aR) {
    const [n, v] = first(A);
    if (/is a diameter/.test(t)) { // inscribed angle at an end of the diameter, the other inscribed angle is 90 - v
      const third = [...n].find(ch => !aR.includes(ch));
      return third === n[1] ? 2 * v : 2 * (90 - v);
    }
    if (/tangent/.test(t)) return v <= 90 ? 2 * v : 360 - 2 * v;
    // O center: base angle -> central -> inscribed
    const [x, y] = [...n].filter(ch => ch !== 'O' && n.indexOf(ch) !== 1 || ch === n[1]).filter(ch => ch !== 'O');
    const cen = 180 - 2 * v;
    const far = !F.within(aA[1], x, y) === (F.ccw(x, y) <= 180);
    return far ? cen / 2 : (360 - cen) / 2;
  },
  chase3(q, t, F, A, Ar, aA) {
    const [n, v] = first(A);
    if (/is a diameter/.test(t)) {
      const H = n[1], [K, J] = [n[0], n[2]], S = aA[2] === K || aA[2] === J ? aA[0] : aA[2];
      // ∠KJS = half the arc KJ on S's side; ∠KHJ = half the arc KJ away from H
      return F.side(S, K, J) !== F.side(H, K, J) ? v : 180 - v;
    }
    if (/tangent/.test(t)) return Math.abs(90 - v);
    const cen = 180 - 2 * v;
    const onMinor = /with ([A-Z]) on the minor arc/.exec(t)[1] === aA[1];
    return onMinor ? (360 - cen) / 2 : cen / 2;
  },
  realWorld(q, t, F, A, Ar, aA, aR) {
    if (/paths cross/.test(t)) return numFam.chordChord(q, t.replace(/path ([A-Z]{2}) and path ([A-Z]{2}) meet at/, 'Chords $1 and $2 meet at'), F, A, Ar, aA, aR);
    if (/camera/.test(t)) { const v = Object.values(Ar); return Math.abs(v[0] - v[1]) / 2; }
    if (/near arc .* measures (\d+)/.test(t)) return 180 - N(t.match(/measures (\d+(?:\.\d+)?)°/)[1]);
    return 180 - N(t.match(/is (\d+(?:\.\d+)?)°/)[1]);
  },
};

function linExpr(s) { // "(2x − 2)" -> [a, b]
  const m = plain(s).match(/\(?(\d*)x(?:\s*([+-])\s*(\d+(?:\.\d+)?))?\)?/);
  return [m[1] === '' ? 1 : N(m[1]), m[2] ? (m[2] === '-' ? -1 : 1) * N(m[3]) : 0];
}
function algebra(t) {
  const ex = [...t.matchAll(/m∠([A-Z]{3}) = (\([^)]*\))°/g)].map(m => [m[1], linExpr(m[2])]);
  if (/is inscribed in a circle|is a diameter/.test(t)) {
    const total = /is a diameter/.test(t) ? 90 : 180;
    const [[n1, [a1, b1]], [n2, [a2, b2]]] = ex;
    const x = (total - b1 - b2) / (a1 + a2);
    const ask = askAng(t);
    const [a, b] = ask === n1 ? [a1, b1] : [a2, b2];
    return a * x + b;
  }
  const [[, [a, b]]] = ex;
  if (/tangent/.test(t) && !Object.keys(arcGiven(t)).length) { const [, c] = first(angGiven(t)); return (180 - c - b) / a; }
  const [, arc] = first(arcGiven(t));
  return (arc / 2 - b) / a;
}

// ---------------------------------------------------------------------------------------------------------------------
// choice families
function solveChoice(q) {
  const t = plain(q.prompt), F = figOf(q), fam = q.family;
  switch (fam) {
    case 'simProof': {
      if (/SAME center/.test(t)) {
        const [a, b] = nums(t.match(/radii ([\d.]+) cm and ([\d.]+) cm/).slice(1).join(' '));
        const k = Math.max(a, b) / Math.min(a, b);
        return idxWhere(q, c => /^a dilation centered at/.test(c) && Math.abs(nums(c)[0] - k) < 0.006);
      }
      if (/same radius/.test(t)) return idxWhere(q, c => /^the translation from [A-Z] to [A-Z] alone/.test(c));
      if (/Each has an arc/.test(t)) {
        const [r1, r2] = nums(t.match(/radius ([\d.]+) cm; circle \w has radius ([\d.]+)/).slice(1).join(' '));
        return idxWhere(q, c => (r1 === r2 ? /same length/ : /lengths differ/).test(c) && !/measures \d/.test(c));
      }
      if (/What else must the proof show/.test(t)) {
        const rA = nums(t.match(/circle \w \(radius ([\d.]+) cm\)/)[1])[0];
        return idxWhere(q, c => /every point of circle \w is reached/.test(c) && nums(c)[0] === rA);
      }
      return -1;
    }
    case 'segKind': {
      const s = F.segs.find(x => x.col === 'pick');
      const k = F.on(s.a) && F.on(s.b) ? (F.lineD(s.a, s.b) < 0.5 ? 'diam' : 'chord') : (F.isO(s.a) && F.on(s.b)) || (F.isO(s.b) && F.on(s.a)) ? 'radius' : 'none';
      return idxWhere(q, c => ({ diam: /^a diameter/, chord: /^a chord that is not/, radius: /^a radius/, none: /^none of these/ })[k].test(c));
    }
    case 'lineKind': {
      const s = F.segs.find(x => x.col === 'pick');
      let k;
      if (s.kind === 'line') k = ['neither', 'tangent', 'secant'][F.meets(s.a, s.b)];
      else k = F.on(s.a) && F.on(s.b) ? 'chord' : 'other';
      return idxWhere(q, c => ({ neither: /^neither/, tangent: /^a tangent/, secant: /^a secant/, chord: /^a chord/ })[k]?.test(c));
    }
    case 'tangentPoint': {
      if (/What is its point of tangency/.test(t)) {
        const ln = t.match(/Line ([A-Z]{2}) is tangent/)[1];
        const a = F.pt(ln[0]), b = F.pt(ln[1]);
        if (F.meets(a, b) !== 1) return -1;
        return idxWhere(q, c => /^[A-Z]$/.test(c) && F.pt(c) && F.on(F.pt(c)) && Math.abs(cross(sub(b, a), sub(F.pt(c), a))) / len(sub(b, a)) < 0.5);
      }
      if (/How many points does line/.test(t)) {
        const ln = t.match(/line ([A-Z]{2}) share/)[1];
        const k = F.meets(F.pt(ln[0]), F.pt(ln[1]));
        return idxWhere(q, c => c === String(k));
      }
      if (/Which line is tangent/.test(t)) return idxWhere(q, c => { const m = c.match(/^line ([A-Z])([A-Z])$/); return !!m && F.has(m[1] + m[2]) && F.meets(F.pt(m[1]), F.pt(m[2])) === 1; });
      return -1;
    }
    case 'angleKind': {
      const n = t.match(/marked ∠([A-Z]{3})/)[1];
      const k = kindOf(F, n);
      return idxWhere(q, c => KIND_RE[k].test(c));
    }
    case 'whichAngle': {
      const want = t.match(/Which angle is (central|inscribed|circumscribed)/)[1];
      return idxWhere(q, c => { const m = c.match(/^∠([A-Z]{3})$/); return !!m && kindOf(F, m[1]) === want; });
    }
    case 'arcName': {
      const a = F.arcs.find(x => x.col === 'pick') ?? F.arcs[0];
      return idxWhere(q, c => arcNameFits(F, c, a));
    }
    case 'interceptPick': {
      const n = t.match(/does ∠([A-Z]{3}) intercept/)[1];
      const [x, v, y] = n;
      if (F.isO(F.pt(v))) { // a central angle intercepts the arc inside it (the minor arc)
        const arc = F.ccw(x, y) <= 180 ? { a: F.polar(F.pt(x)), b: F.polar(F.pt(y)) } : { a: F.polar(F.pt(y)), b: F.polar(F.pt(x)) };
        return idxWhere(q, c => arcNameFits(F, c, arc));
      }
      // the arc x..y away from v, as a CArc-like {a, b} ccw
      const ccwXY = F.within(v, x, y);
      const arc = ccwXY ? { a: F.polar(F.pt(y)), b: F.polar(F.pt(x)) } : { a: F.polar(F.pt(x)), b: F.polar(F.pt(y)) };
      return idxWhere(q, c => arcNameFits(F, c, arc));
    }
    case 'circumTangency': {
      return idxWhere(q, c => {
        const m = c.match(/^∠([A-Z]{3}), with points of tangency ([A-Z]) and ([A-Z])$/);
        if (!m || !F.has(m[1] + m[2] + m[3])) return false;
        if (kindOf(F, m[1]) !== 'circumscribed') return false;
        const V = F.pt(m[1][1]);
        const touch = X => F.on(F.pt(X)) && F.meets(V, F.pt(X)) === 1;
        return sortL(m[2] + m[3]) === sortL(m[1][0] + m[1][2]) && touch(m[2]) && touch(m[3]);
      });
    }
    case 'sameOrOpposite': {
      const [a1, a2] = [...t.matchAll(/∠([A-Z]{3})/g)].map(m => m[1]).slice(1, 3);
      const same = F.side(a1[1], a1[0], a1[2]) === F.side(a2[1], a1[0], a1[2]);
      return idxWhere(q, c => (same ? /^congruent/ : /^supplementary/).test(c));
    }
    case 'diameterGiven': {
      if (/is a diameter of circle/.test(t)) return idxWhere(q, c => /^Yes: [A-Z]{2} is a diameter/.test(c));
      if (/nothing is given about where its center/.test(t)) return idxWhere(q, c => /^Not from the givens/.test(c));
      const [, v] = first(arcGiven(t));
      return idxWhere(q, c => /^No: m∠[A-Z]{3} = ½\(/.test(c) && nums(c).at(-1) === v / 2 && v !== 180);
    }
    case 'cyclicApplies': {
      const ag = first(angGiven(t)), ask = t.match(/conclude m∠([A-Z]{3})/)[1];
      if (/is (outside|inside) it/.test(t)) { const X = t.match(/([A-Z]) is (?:outside|inside) it/)[1]; return idxWhere(q, c => c.startsWith(`No: ${X} is not on the circle`)); }
      // the two angles must be opposite in the quadrilateral the four points make
      const isOpp = ask[1] !== ag[0][1] && sortL(ask[0] + ask[2]) === sortL(ag[0][0] + ag[0][2]);
      if (!isOpp) return idxWhere(q, c => /^No/.test(c));
      return idxWhere(q, c => /^Yes: opposite angles of an inscribed quadrilateral are supplementary/.test(c) && nums(c).at(-1) === 180 - ag[1]);
    }
    case 'hypCheck': {
      if (/semicircle theorem/.test(t)) return idxWhere(q, c => /is given to pass through the center O, and [A-Z] is on the circle$/.test(c));
      if (/Inscribed Angle Theorem/.test(t)) return idxWhere(q, c => /^[A-Z] is on the circle, and [A-Z]{2} and [A-Z]{2} are chords$/.test(c));
      if (/circumscribed angle theorem/.test(t)) return idxWhere(q, c => /are both given tangent to the circle$/.test(c));
      if (/tangent ⊥ radius/.test(t)) return idxWhere(q, c => /is given tangent at [A-Z], and O[A-Z] is the radius to [A-Z]$/.test(c));
      if (/inscribed quadrilateral theorem/.test(t)) return idxWhere(q, c => /^all four vertices/.test(c));
      return -1;
    }
    case 'hypMatch': {
      const step = t.match(/One step of a solution says (.*?)\. Which/)[1];
      let re;
      if (/\+ m∠[A-Z] = 180°/.test(step)) re = /all lie on one circle/;
      else if (/m∠O[A-Z]{2} = 90°/.test(step)) re = /is tangent to the circle at/;
      else re = /passes through the center/;
      return idxWhere(q, c => /^given \d/.test(c) && re.test(c));
    }
    case 'rejectVerdict': return rejectVerdict(q, t);
    case 'converseClass': {
      if (/two inscribed angles are congruent, then they intercept the same arc/.test(t)) return idxWhere(q, c => /^The converse is false: a counterexample/.test(c) && counterOk(c));
      if (/Pythagorean|a² \+ b² = c²/.test(t) && q.choices.some(c => /own proof \(the Converse of the Pythagorean/.test(c))) return idxWhere(q, c => /^The converse is true: it has its own proof/.test(c));
      return idxWhere(q, c => /^The converse is not yet established: it needs its own proof/.test(c));
    }
    case 'contraForm': return contraForm(q, t);
    case 'contraUse': {
      const concl = t.match(/Conclusion: (.*?)\. Which/)[1];
      if (/\bnot\b|cannot/.test(concl)) return idxWhere(q, c => /^its contrapositive/.test(c));
      if (/is a diameter/.test(concl)) return idxWhere(q, c => /^its converse/.test(c));
      return idxWhere(q, c => /^the theorem itself/.test(c));
    }
    case 'rightDiameter': {
      if (/Why must/.test(t)) return idxWhere(q, c => /intercepts an arc of 2 × 90° = 180°, so [A-Z] and [A-Z] split the circle into two semicircles/.test(c));
      return idxWhere(q, c => /^the vertex [A-Z] is on the circle, both sides are chords, and m∠[A-Z]{3} = 90°$/.test(c));
    }
    case 'findCenter': {
      const rights = [...t.matchAll(/∠([A-Z]{3})/g)].map(m => sortL(m[1][0] + m[1][2]));
      return idxWhere(q, c => {
        const m = c.match(/^([A-Z]), where chords ([A-Z]{2}) and ([A-Z]{2}) cross$/);
        return !!m && [sortL(m[2]), sortL(m[3])].sort().join() === [...rights].sort().join();
      });
    }
    case 'proofDiff':
      if (/three cases/.test(t)) return idxWhere(q, c => /no other place, and each case is proved/.test(c));
      return proofChoice(q);
    case 'proofCyclic':
      if (/One student measures/.test(t)) return idxWhere(q, c => /^no: it shows one quadrilateral/.test(c));
      return proofChoice(q);
    case 'chainReason': case 'proofBase': case 'proofSum': case 'proofChord': return proofChoice(q);
    default: return undefined;
  }
}

/** does choice text c name arc {a, b} (ccw from a to b, degrees) correctly */
function arcNameFits(F, c, arc) {
  const m = c.match(/^arc ([A-Z])([A-Z])?([A-Z])$/);
  if (!m) return false;
  const span = nrm(arc.b - arc.a) || 360;
  const ends = [m[1], m[3]].map(n => F.pt(n));
  if (ends.some(p => !p)) return false;
  const pa = [F.polar(ends[0]), F.polar(ends[1])];
  const close = (x, y) => Math.abs(nrm(x - y + 180) - 180) < 0.01;
  const endsOk = (close(pa[0], arc.a) && close(pa[1], arc.b)) || (close(pa[0], arc.b) && close(pa[1], arc.a));
  if (!endsOk) return false;
  if (!m[2]) return span < 180 - 1e-6;
  const M = F.pt(m[2]);
  if (!M || !F.on(M)) return false;
  const d = nrm(F.polar(M) - arc.a);
  return d > 1e-6 && d < span - 1e-6;
}
function counterOk(c) { const [a, b] = nums(c); return b === 2 * a; }

function rejectVerdict(q, t) {
  const g = t.match(/Givens: (.*?)\. A student writes: (.*?) \((.*?)\)\. Use/);
  if (!g) return -1;
  const [, givens, step, thm] = g;
  if (/semicircle/.test(thm)) {
    const ch = step.match(/m∠([A-Z])([A-Z])([A-Z])/);
    const d = ch[1] + ch[3];
    const ok = new RegExp(`(${d}|${d[1] + d[0]}) passes through the center|(${d}|${d[1] + d[0]}) is a diameter`).test(givens) && new RegExp(`\\b${ch[2]}\\b`).test(givens.split(/[;.]/)[0]);
    return idxWhere(q, c => (ok ? /^justified/ : /^not justified: nothing says/).test(c));
  }
  if (/tangent ⊥ radius/.test(thm)) {
    const ok = /is tangent to the circle at/.test(givens) && /O is the center/.test(givens);
    return idxWhere(q, c => (ok ? /^justified/ : /^not justified: nothing says line [A-Z]{2} is tangent/).test(c));
  }
  if (/inscribed quadrilateral/.test(thm)) {
    const on = (givens.match(/^(.*?) lie on (?:a|one) circle/)?.[1] ?? '').match(/[A-Z]/g) ?? [];
    const [gn, gv] = first(angGiven(givens));
    const [sn, sv] = first(angGiven(step));
    const four = new Set([...gn, ...sn]);
    const allOn = [...four].every(ch => on.includes(ch));
    if (!allOn) { const miss = [...four].find(ch => !on.includes(ch)); return idxWhere(q, c => c === `not justified: nothing says ${miss} is on the circle`); }
    const opp = gn[1] !== sn[1] && sortL(gn[0] + gn[2]) === sortL(sn[0] + sn[2]);
    const right = opp && sv === 180 - gv;
    return idxWhere(q, c => (right ? /^justified/ : /^false/).test(c));
  }
  return -1;
}

function contraForm(q, t) {
  const m = t.match(/Theorem: If (.*?), then (.*?)\. Which/);
  if (!m) return -1;
  const words = s => new Set(low(s).replace(/[^a-z ]/g, ' ').split(' ').filter(w => w.length > 3 && !['then', 'that', 'there', 'cannot', 'does', 'they', 'their', 'with', 'this'].includes(w)).map(w => w.replace(/s$/, '')));
  const P0 = words(m[1]), Q0 = words(m[2]);
  const P = new Set([...P0].filter(w => !Q0.has(w))), Qw = new Set([...Q0].filter(w => !P0.has(w)));
  const overlap = (a, B) => [...a].filter(w => B.has(w)).length;
  return idxWhere(q, c => {
    const k = c.match(/^If (.*?), then (.*?)\. \((.*?)\)$/);
    if (!k || !/^true, like the theorem$/.test(k[3])) return false;
    const neg = s => /\bnot\b|cannot|n't/.test(s);
    const A = words(k[1]), B = words(k[2]);
    return neg(k[1]) && neg(k[2]) && overlap(A, Qw) - overlap(A, P) > overlap(B, Qw) - overlap(B, P);
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// proofs: each family's proof rebuilt from the givens
const R = {
  radii: 'All radii of a circle are congruent', iso: 'Isosceles base angles are congruent', ext: 'Exterior Angle Theorem',
  arcdef: 'Definition of arc measure', central: 'Central angle = its arc', div: 'Division Property of Equality', mult: 'Multiplication Property of Equality',
  base: 'Base case (center on a side)', angadd: 'Angle Addition Postulate', arcadd: 'Arc Addition Postulate', subst: 'Substitution Property',
  iat: 'Inscribed Angle Theorem', addeq: 'Addition Property of Equality', tanrad: 'Tangent ⊥ radius at point of tangency',
  semi: 'Diameter cuts off a semicircle (180°)', conv: 'Converse: right inscribed angle → diameter', tch: 'Tangent-chord angle = ½ its arc',
  tri: 'Triangle Angle Sum Theorem', defpoly: 'Definition of inscribed polygon', quad: 'Inscribed quadrilateral theorem',
};
const row = (st, rs) => ({ st: [st].flat().map(nz), rs: [rs].flat().map(rsn) });
const fmt = v => String(round(v, 1));

function proofRows(q) {
  const p = q.data?.picture?.proof;
  if (!p) return null;
  const G = p.given.map(nz), Pv = nz(p.prove), fam = q.family;
  const gAll = p.given.join(' ; ');
  if (fam === 'proofBase') {
    const m = gAll.match(/x = m\\angle ([A-Z])([A-Z])([A-Z])/);
    const [, P, V, E] = m;
    return [
      row(`O${P}=O${V}`, R.radii), row([`m∠O${P}${V}=x`, `m∠O${P}${V}=m∠O${V}${P}`], R.iso), row(`m∠${P}O${E}=2x`, R.ext),
      row(`marc${P}${E}=2x`, [R.arcdef, R.central]), row(`x=(1)/(2)marc${P}${E}`, [R.div, R.mult]),
    ];
  }
  if (fam === 'proofSum' || fam === 'proofDiff') {
    const arcN = Pv.match(/marc([A-Z]+)$/)[1];
    const sg = fam === 'proofSum' ? '+' : '-';
    const ang = gAll.match(/w = m\\angle ([A-Z]{3})/)[1];
    return [
      row('x=(1)/(2)a', R.base), row('y=(1)/(2)b', R.base), row(`w=x${sg}y`, R.angadd), row(`marc${arcN}=a${sg}b`, R.arcadd),
      row(`w=(1)/(2)(a${sg}b)`, R.subst), row([`w=(1)/(2)marc${arcN}`, `m∠${ang}=(1)/(2)marc${arcN}`], R.subst),
    ];
  }
  if (fam === 'proofCyclic') {
    const quad = gAll.match(/([A-Z]{4}) \\text\{ is inscribed/)[1];
    const um = gAll.match(/u = m\\overparen\{([A-Z]{3})\}/)[1], vm = gAll.match(/v = m\\overparen\{([A-Z]{3})\}/)[1];
    const [X, Y] = [...p.prove.matchAll(/\\angle ([A-Z])/g)].map(m => m[1]);
    const nb = Z => { const i = quad.indexOf(Z); return sortL(quad[(i + 1) % 4] + quad[(i + 3) % 4]); };
    const inter = (Z, arc) => sortL(arc[0] + arc[2]) === nb(Z) && !arc.includes(Z);
    const vX = inter(X, um) ? 'u' : inter(X, vm) ? 'v' : '?', vY = inter(Y, um) ? 'u' : inter(Y, vm) ? 'v' : '?';
    return [
      row('u+v=360°', R.arcadd), row(`m∠${X}=(1)/(2)${vX}`, R.iat), row(`m∠${Y}=(1)/(2)${vY}`, R.iat),
      row(`m∠${X}+m∠${Y}=(u+v)/(2)`, R.addeq), row(`m∠${X}+m∠${Y}=180°`, R.subst),
    ];
  }
  if (fam === 'proofChord') {
    if (/tangent at/.test(gAll)) {
      const [, X, S] = gAll.match(/overleftrightarrow\{([A-Z])([A-Z])\}/);
      const Nn = gAll.match(/overline\{[A-Z]([A-Z])\} \\text\{ a diameter/)[1];
      const A = gAll.match(/t = m\\overparen\{[A-Z]([A-Z])\}/)[1];
      return [
        row(`m∠${Nn}${X}${S}=90°`, R.tanrad), row(`y=(1)/(2)marc${A}${Nn}`, R.iat), row(`marc${A}${Nn}=180°-t`, [R.semi, R.arcadd]),
        row(`m∠${A}${X}${S}=90°-y`, R.angadd), row(`m∠${A}${X}${S}=(1)/(2)t`, R.subst),
      ];
    }
    const arcs = Object.fromEntries([...gAll.matchAll(/([a-d]) = m\\overparen\{([A-Z]{2})\}/g)].map(m => [sortL(m[2]), m[1]]));
    const angs = Object.fromEntries([...gAll.matchAll(/([xy]) = m\\angle ([A-Z]{3})/g)].map(m => [m[1], m[2]]));
    const goal = p.prove.match(/m\\angle ([A-Z]{3})/)[1];
    if (/chords/.test(gAll)) {
      const ch = [...gAll.matchAll(/overline\{([A-Z]{2})\}/g)].map(m => m[1]).slice(0, 2);
      const circ = new Set(ch.join(''));
      const intercept = n => arcs[sortL(n[0] + n[2])] ?? '?';
      void circ;
      return [
        row(`x=(1)/(2)${intercept(angs.x)}`, R.iat), row(`y=(1)/(2)${intercept(angs.y)}`, R.iat), row(`m∠${goal}=x+y`, R.ext),
        row([`m∠${goal}=(1)/(2)(${Object.values(arcs).join('+')})`, `m∠${goal}=(1)/(2)(${Object.values(arcs).reverse().join('+')})`], R.subst),
      ];
    }
    // secants UFP, UHM: the exterior point is not on the circle, its ray passes the near point
    const sec = [...gAll.matchAll(/secants \}? ?([A-Z]{3}),\\? ?([A-Z]{3})/g)][0];
    const lines = [sec[1], sec[2]];
    const onCircle = ch => !lines.some(l => l[0] === ch);
    const toCircle = (v, ch) => { if (onCircle(ch)) return ch; const l = lines.find(L => L.includes(v)); return l[1] === v ? l[2] : l[1]; };
    const intercept = n => arcs[sortL(toCircle(n[1], n[0]) + toCircle(n[1], n[2]))] ?? '?';
    return [
      row(`x=(1)/(2)${intercept(angs.x)}`, R.iat), row(`y=(1)/(2)${intercept(angs.y)}`, R.iat), row(`x=m∠${goal}+y`, R.ext),
      row(`m∠${goal}=(1)/(2)(d-a)`, R.subst),
    ];
  }
  if (fam === 'chainReason') {
    const pv = p.prove;
    let m;
    if (/^m\\angle/.test(pv) && (m = gAll.match(/m\\angle ([A-Z])([A-Z])([A-Z]) = 90\^\\circ/))) {
      const [, E, Y, M] = m;
      const Z = pv.match(/m\\angle [A-Z]([A-Z])[A-Z]/)[1];
      return [row(`${E}${M}isadiameter`, R.conv), row(`marc${E}${Y}${M}=180°`, R.semi), row(`m∠${E}${Z}${M}=90°`, R.iat)];
    }
    if ((m = gAll.match(/overleftrightarrow\{([A-Z])([A-Z])\} \\text\{ tangent to circle/))) {
      const [, Cc, Rr] = m;
      const am = gAll.match(/m\\angle ([A-Z])([A-Z])([A-Z]) = (\d+)/);
      const Pp = am[1] === Rr ? am[3] : am[1], v = N(am[4]);
      return [
        row(`marc${Cc}${Pp}=${fmt(2 * v)}°`, R.tch), row(`m∠${Cc}O${Pp}=${fmt(2 * v)}°`, R.central), row(`O${Cc}=O${Pp}`, R.radii),
        row(`m∠O${Pp}${Cc}=m∠O${Cc}${Pp}`, R.iso), row(`m∠O${Pp}${Cc}=${fmt(90 - v)}°`, R.tri),
      ];
    }
    if ((m = gAll.match(/m\\angle ([A-Z])([A-Z])([A-Z]) = (\d+)\^\\circ/))) {
      const [, a, b, c] = m, v = N(m[4]);
      const pts = gAll.match(/([A-Z]), ([A-Z]), ([A-Z]), ([A-Z]) \\text\{ on one circle/).slice(1);
      const d = pts.find(ch => ![a, b, c].includes(ch));
      const quad = a + b + c + d;
      const quadAlts = [0, 1, 2, 3].flatMap(i => [quad.slice(i) + quad.slice(0, i), (quad.slice(i) + quad.slice(0, i)).split('').reverse().join('')]);
      return [
        row(quadAlts.map(x => `${x}isinscribed`), R.defpoly), row(`m∠${c}${d}${a}=${fmt(180 - v)}°`, R.quad), row(`marc${a}${b}${c}=${fmt(360 - 2 * v)}°`, R.iat),
      ];
    }
  }
  void G;
  return null;
}
function proofChoice(q) {
  const p = q.data?.picture?.proof;
  if (!p) return -1;
  const rows = proofRows(q);
  if (!rows) return -1;
  const ask = p.ask?.[0];
  if (!ask) return -1;
  const want = rows[ask.i];
  if (!want) return -1;
  if (ask.cell === 'rs') return idxWhere(q, c => want.rs.includes(rsn(c)));
  return idxWhere(q, c => want.st.includes(nz(c)));
}
function proofProblems(q) {
  const p = q.data?.picture?.proof;
  if (!p) return [];
  const rows = proofRows(q);
  if (!rows) return ['proof not read'];
  const out = [];
  if (rows.length !== p.rows.length) out.push(`proof has ${p.rows.length} lines, expected ${rows.length}`);
  const asked = new Set((p.ask ?? []).map(a => `${a.i}${a.cell}`));
  p.rows.forEach((r, i) => {
    const w = rows[i];
    if (!w) return;
    if (!asked.has(`${i}st`) && !w.st.includes(nz(r.st))) out.push(`line ${i + 1} statement "${plain(r.st)}"`);
    if (!asked.has(`${i}rs`) && !w.rs.includes(rsn(r.rs))) out.push(`line ${i + 1} reason "${r.rs}" for "${plain(r.st)}"`);
  });
  // the prove line is the last row
  const last = rows.at(-1);
  if (q.family !== 'chainReason' && !last.st.includes(nz(p.prove)) && !/m∠[A-Z]{3}=1\/2marc/.test(nz(p.prove))) out.push(`prove "${plain(p.prove)}" is not the last line`);
  return out;
}

// =====================================================================================================================
function solve(q) {
  if (q.input === 'choice') { const i = solveChoice(q); return i; }
  const v = solveNumeric(q);
  return v === undefined ? undefined : round(v, 6);
}

// =====================================================================================================================
// sane
const VOWEL_LETTER = /^[AEFHILMNORSX]$/;
function textProblems(q) {
  const out = [];
  const texts = [q.prompt, ...(q.choices ?? []), ...(q.data?.picture?.card?.lines ?? [])].map(String);
  for (const s of texts) {
    if (/[^.]\.\.(?!\.)/.test(s)) out.push(`double period: "${s.match(/.{0,20}\.\./)[0]}"`);
    // "a" / "an": lower case anywhere; a capital "A" / "An" only at a sentence start before a lower-case word
    for (const m of s.matchAll(/(^|[\s(]|[.:;] )(a|an|A|An) ([^\s,;:]+)/g)) {
      const art = m[2], w = m[3].replace(/[.)]$/, '').replace(OVL, '');
      if (/^A/.test(art) && !(m[1] === '' || /[.:;]/.test(m[1]))) continue;
      if (/^A/.test(art) && !/^[a-z0-9]/.test(w)) continue;
      if (art === 'A' && /^(is|and|lie|lies|on|onto|to|of|in|at|has)$/.test(w)) continue;
      if (art === 'a' && /^(and|b|with|=)$/.test(w)) continue; // the variable a
      const vowel = /^\d/.test(w) ? /^(8|11|18)(\D|$)|^8\d(\D|$)|^8\d\d(\D|$)/.test(w) : /^[A-Z]$/.test(w) ? VOWEL_LETTER.test(w) : /^[aeiou]/i.test(w) && !/^(one|uni|use|eu)/i.test(w);
      if (/^a$/i.test(art) && vowel) out.push(`"${art} ${w}"`);
      if (/^an$/i.test(art) && !vowel) out.push(`"${art} ${w}"`);
    }
    if (/\\[a-z]+|[{}]/.test(s)) out.push(`raw TeX in text: "${s.slice(0, 60)}"`);
    const rel = s.match(/(?:^|[.;:] )([B-Z]) (coach|satellite|camera|student|proof|translation|dilation|single|line through)\b/);
    if (rel) out.push(`relabelled article: "${rel[0].trim()}"`);
    if (/[a-z][A-Z]{1}[a-z]|\b[A-Z][a-z]*[A-Z][a-z]+/.test(s.replace(/[A-Z]{2,}/g, ''))) out.push(`mangled word in "${s.slice(0, 60)}"`);
  }
  return out;
}

function figProblems(q, ans) {
  const F = figOf(q);
  if (!F) return [];
  const t = plain(q.prompt), out = [];
  // stated angles and arcs at their measure
  for (const [n, v] of Object.entries(angGiven(t))) if (F.has(n) && Math.abs(F.meas(n) - v) > EPS) out.push(`m∠${n} = ${v}° drawn ${F.meas(n).toFixed(1)}°`);
  for (const [n, v] of Object.entries(arcGiven(t))) {
    if (!F.has(n)) continue;
    let d = arcM(F, n);
    const inside = new RegExp(`m\\(arc ${n}\\) = [\\d.]+° \\(the arc inside ∠([A-Z]{3})\\)`).exec(t);
    if (inside) { const Rp = inside[1][2] === n[0] || inside[1][2] === n[1] ? inside[1][0] : inside[1][2]; d = arcOnSide(F, n[0], n[1], Rp); }
    else if (n.length === 2 && v > 180 + 1e-9) out.push(`two-letter name for the major arc ${n} = ${v}°`);
    if (Math.abs(d - v) > EPS && !(n.length === 2 && v > 180)) out.push(`m(arc ${n}) = ${v}° drawn ${d.toFixed(1)}°`);
  }
  // tangents, diameters, on / inside / outside
  for (const m of t.matchAll(/(?:[Ll]ines? |^|; |\. )([A-Z]{2})(?: and ([A-Z]{2}))? (?:is|are) tangent to (?:the )?circle(?: O)?(?: at ([A-Z])(?: and ([A-Z]))?)?/g)) {
    for (const [ln, at] of [[m[1], m[3]], [m[2], m[4]]]) {
      if (!ln || !F.has(ln)) continue;
      if (F.meets(F.pt(ln[0]), F.pt(ln[1])) !== 1) out.push(`line ${ln} is not tangent in the figure`);
      if (at && F.pt(at) && !(F.on(F.pt(at)) && F.lineD(F.pt(ln[0]), F.pt(ln[1])) <= F.R + 0.5 && Math.abs(cross(sub(F.pt(ln[1]), F.pt(ln[0])), sub(F.pt(at), F.pt(ln[0])))) / dist(F.pt(ln[1]), F.pt(ln[0])) < 0.5)) out.push(`line ${ln} does not touch at ${at}`);
    }
  }
  for (const m of t.matchAll(/([A-Z]{2}) is a diameter/g)) if (F.has(m[1])) { const [a, b] = [...m[1]].map(F.pt); if (!(F.on(a) && F.on(b) && F.lineD(a, b) < 0.5 && dot(sub(a, F.O), sub(b, F.O)) < 0)) out.push(`${m[1]} is not a diameter in the figure`); }
  for (const m of t.matchAll(/((?:[A-Z], )*[A-Z],? and [A-Z]|Points (?:[A-Z], )+(?:and )?[A-Z]) (?:all )?lie on (?:the |a |one )?circle/g)) {
    for (const ch of m[1].replace(/Points /, '').match(/\b[A-Z]\b/g)) if (F.pt(ch) && !F.on(F.pt(ch))) out.push(`${ch} is not on the circle`);
  }
  for (const m of t.matchAll(/\b([A-Z]) is (inside|outside) it/g)) if (F.pt(m[1]) && !(m[2] === 'inside' ? F.inside : F.outside)(F.pt(m[1]))) out.push(`${m[1]} is not ${m[2]} the circle`);
  for (const m of t.matchAll(/\b([A-Z]) is on the (?:minor )?arc ([A-Z]{2})/g)) if (F.has(m[1] + m[2]) && (F.ccw(m[2][0], m[2][1]) <= 180) !== F.within(m[1], m[2][0], m[2][1])) out.push(`${m[1]} is not on the minor arc ${m[2]}`);
  for (const m of t.matchAll(/with ([A-Z]) not on arc ([A-Z]{2})/g)) if (F.has(m[1] + m[2]) && (F.ccw(m[2][0], m[2][1]) <= 180) === F.within(m[1], m[2][0], m[2][1])) out.push(`${m[1]} is on the minor arc ${m[2]}`);
  // labelled angle marks at their measure
  for (const a of F.angles) { const v = /^(\d+(?:\.\d+)?)°$/.exec(a.text ?? ''); if (v && F.has(a.id) && Math.abs(F.meas(a.id) - N(v[1])) > EPS) out.push(`angle mark ${a.id} "${a.text}" drawn ${F.meas(a.id).toFixed(1)}°`); }
  // the asked quantity measures the answer
  if (typeof ans === 'number' && Number.isFinite(ans) && q.unit === '°') {
    const aA = askAng(t), aR = askArc(t);
    if (aA && F.has(aA) && Math.abs(F.meas(aA) - ans) > EPS) out.push(`asked m∠${aA}: answer ${ans}°, drawn ${F.meas(aA).toFixed(1)}°`);
    if (aR && F.has(aR)) {
      let d = arcM(F, aR);
      const inside = new RegExp(`m\\(arc ${aR}\\), the arc inside ∠([A-Z]{3})`).exec(t);
      if (inside) { const Rp = inside[1][2] === aR[0] || inside[1][2] === aR[1] ? inside[1][0] : inside[1][2]; d = arcOnSide(F, aR[0], aR[1], Rp); }
      if (aR.length === 2 && ans > 180 + 1e-9 && !inside) out.push(`asked two-letter arc ${aR} is a major arc (${ans}°)`);
      else if (Math.abs(d - ans) > EPS) out.push(`asked m(arc ${aR}): answer ${ans}°, drawn ${d.toFixed(1)}°`);
    }
  }
  return out;
}
/** the arc x..y on the side of chord xy where point s is */
function arcOnSide(F, x, y, s) {
  const a = F.polar(F.pt(x)), span = F.ccw(x, y), mid = (a + span / 2) * Math.PI / 180;
  const M = [F.O[0] + F.R * Math.cos(mid), F.O[1] + F.R * Math.sin(mid)];
  const sx = Math.sign(cross(sub(F.pt(y), F.pt(x)), sub(M, F.pt(x)))), ss = F.side(s, x, y);
  return sx === ss ? span : 360 - span;
}

function worldProblems(q, ans) {
  const t = plain(q.prompt), out = [];
  if (q.family === 'simProof' && /SAME center/.test(t)) {
    const c = (q.choices ?? []).find(x => /^a dilation centered at/.test(plain(x)) && /\d\.\d{2}\b/.test(x));
    const [a, b] = nums(t.match(/radii ([\d.]+) cm and ([\d.]+) cm/).slice(1).join(' '));
    const k = Math.max(a, b) / Math.min(a, b);
    if (c && Math.abs(nums(c)[0] - k) > 1e-9) out.push(`the right choice "${plain(c)}" is a rounded scale factor (exact ${Math.max(a, b)}/${Math.min(a, b)})`);
    if (/circle B/.test(q.board) && !/\bB\b/.test(t)) out.push('board names a circle B that the item does not have');
  }
  if (q.family === 'tangentPoint') {
    const bl = q.board.match(/overleftrightarrow\{([A-Z]{2})\}/)?.[1];
    const askL = t.match(/line ([A-Z]{2}) share/)?.[1];
    if (askL && bl && sortL(bl) !== sortL(askL)) out.push(`board shows line ${bl}, the prompt asks about line ${askL}`);
    if (/Which line is tangent/.test(t) && bl && typeof ans === 'number' && ans >= 0 && sortL(plain(q.choices[ans]).slice(5)) === sortL(bl)) out.push(`board shows the answer (line ${bl})`);
  }
  if (q.unit && /s$/.test(q.unit) && ans === 1) out.push(`"1 ${q.unit}"`);
  if (q.input === 'num' && typeof ans === 'number' && (ans <= 0 || ans >= 360) && q.unit === '°') out.push(`answer ${ans}°`);
  if (q.input === 'num' && typeof ans === 'number' && !Number.isInteger(round(ans * 1000, 6))) out.push(`answer ${ans} is not a clean decimal`);
  return out;
}

function sane(q) {
  let ans;
  try { ans = solve(q); } catch { ans = undefined; }
  const probs = [...textProblems(q), ...figProblems(q, ans), ...proofProblems(q), ...worldProblems(q, ans)];
  return [...new Set(probs)].join('; ');
}

export default { solve, sane };
