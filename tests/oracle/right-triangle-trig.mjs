// Oracle for the lesson "right-triangle-trig" (Geometry 10: right triangle trigonometry). Written from what the student
// sees only: the prompt, the board, the choices, the drawn figure (named vertices, side labels, the right-angle box,
// angle arcs and their measures), the cards (a student's work, a table, a calculator display). See
// docs/lessons/QUALITY_LAYER.md, "O: the oracle".
//
// How it decides:
// - Sides are named from the drawing: the right angle is the box, the hypotenuse is the side across from it, the
//   opposite leg of an angle is the side that does not touch its vertex, the adjacent leg is the other leg. Unknown
//   sides and angles are solved from those roles (unit triangle hyp 1, opp sin θ, adj cos θ), at full precision, and
//   rounded once, to the places the prompt states.
// - Choices are decided by value: ratios and equations from the roles, exact radicals by their numeric value (one
//   choice must have it), calculator displays by computing the function in DEG / RAD / GRAD.
// - Stories (ladder, kite, shadow, ramp, elevation / depression, polygons, stop signs) are solved from the prompt's
//   numbers; the drawing is checked against them in sane().
// - Report precision: the prompt's rule, "match the least precise measurement given": the fewest places stated.
// - sane(q): the drawing agrees with its labels (box = 90°, marked angles, side lengths to one scale), rounded answers
//   are not near a .x5 tie, stories are realistic (ladders 60°-80°, sun 10°-80°, ADA ramps at most 1 : 12), exact
//   answers are in simplest radical form, card values are right, and the board equation agrees with the drawing.

import { nums, round } from '../../tools/quality/oracle-kit.mjs';

// =====================================================================================================================
// text
const plain = s => String(s ?? '').replace(/̅/g, '').replace(/−/g, '-').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const D = Math.PI / 180;
const sinD = a => Math.sin(a * D), cosD = a => Math.cos(a * D), tanD = a => Math.tan(a * D);
const FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
const fnDeg = (f, a) => FN[f](a * D);
const fullName = { sine: 'sin', cosine: 'cos', tangent: 'tan' };
const near = (a, b, e = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= e;
const idx = (q, pred) => { const h = (q.choices ?? []).map((c, i) => (pred(plain(c), i) ? i : -1)).filter(i => i >= 0); return h.length === 1 ? h[0] : -1; };
const skey = s => s.split('').sort().join('');
const labVal = s => { const t = String(s ?? '').trim().replace(/\s*(ft|in|cm|m|mi|yd)$/, ''); if (/√/.test(t)) return radValRaw(t); return /^-?\d+(?:\.\d+)?$/.test(t) ? Number(t) : NaN; };
const radValRaw = s => { const m = s.replace(/\s/g, '').match(/^(\d+(?:\.\d+)?)?√(\d+)$/); return m ? (m[1] ? Number(m[1]) : 1) * Math.sqrt(Number(m[2])) : NaN; };
const num = s => { const m = String(s ?? '').match(/-?\d+(?:\.\d+)?/); return m ? Number(m[0]) : NaN; };

/** the places a prompt asks for (null = exact) */
function placesOf(p) {
  const t = plain(p);
  if (/four decimal places/.test(t)) return 4;
  if (/three decimal places/.test(t)) return 3;
  if (/two decimal places|hundredth/.test(t)) return 2;
  if (/tenth/.test(t)) return 1;
  if (/nearest (whole|foot|inch|degree|square inch|square foot|meter|centimeter|yard)/.test(t)) return 0;
  return null;
}
const rd = (v, p) => (p === null || p === undefined ? v : round(v, p));

/** an exact radical text "8√2", "√3/3", "1/2", "4" → its value (NaN if not one) */
function radVal(s) {
  const t = plain(s).replace(/\s/g, '');
  const m = t.match(/^(\d+(?:\.\d+)?)?(?:√(\d+))?(?:\/(\d+))?$/);
  if (!m || (!m[1] && !m[2])) return NaN;
  const c = m[1] ? Number(m[1]) : 1, r = m[2] ? Math.sqrt(Number(m[2])) : 1, d = m[3] ? Number(m[3]) : 1;
  return (c * r) / d;
}
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
/** '' or why an exact radical text is not in simplest form */
function radForm(s) {
  const t = plain(s).replace(/\s/g, '');
  const m = t.match(/^(\d+)?(?:√(\d+))?(?:\/(\d+))?$/);
  if (!m) return '';
  const c = m[1] ? Number(m[1]) : 1, r = m[2] ? Number(m[2]) : 1, d = m[3] ? Number(m[3]) : 1;
  for (let k = 2; k * k <= r; k++) if (r % (k * k) === 0) return `√${r} is not simplified`;
  if (m[2] && r === 1) return '√1';
  if (d > 1 && gcd(c, d) > 1) return `${t} is not reduced`;
  if (m[1] && c === 1 && m[2]) return `1√${r}`;
  return '';
}

// =====================================================================================================================
// the figure
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = a => Math.hypot(a[0], a[1]);
const dist = (a, b) => len(sub(a, b));
const angAt = (V, P, Q) => { const u = sub(P, V), w = sub(Q, V); return Math.acos(Math.max(-1, Math.min(1, (u[0] * w[0] + u[1] * w[1]) / (len(u) * len(w))))) / D; };

function figOf(q) { return q.data?.picture?.fig ?? null; }
function ptsOf(f) {
  const P = {};
  for (const p of f.points ?? []) P[p.name] = p.at;
  for (const s of f.segs ?? []) if (/^[A-Z]{2}$/.test(s.id)) { P[s.id[0]] ??= s.a; P[s.id[1]] ??= s.b; }
  for (const a of f.angles ?? []) if (/^[A-Z]{3}$/.test(a.id)) { P[a.id[1]] ??= a.v; P[a.id[0]] ??= a.p; P[a.id[2]] ??= a.q; }
  return P;
}
const segOf = (f, X, Y) => (f.segs ?? []).find(s => /^[A-Z]{2}$/.test(s.id) && skey(s.id) === skey(X + Y));
/** right triangles drawn: [{ R, A, B }] (R = the box vertex) */
function trisOf(f) {
  return (f.angles ?? []).filter(a => a.box && /^[A-Z]{3}$/.test(a.id)).map(a => ({ R: a.id[1], A: a.id[0], B: a.id[2], set: a.id }));
}
function triWith(f, V) { return trisOf(f).find(t => t.set.includes(V)); }
/** the roles of the sides of triangle t from its acute vertex V: { opp, adj, hyp } as two-letter names */
function roles(t, V) {
  const W = [t.A, t.B].find(x => x !== V);
  return { opp: t.R + W, adj: V + t.R, hyp: V + W, W };
}
const roleOf = (r, side) => (['opp', 'adj', 'hyp'].find(k => skey(r[k]) === skey(side)));
const unitSide = (role, th) => (role === 'hyp' ? 1 : role === 'opp' ? sinD(th) : cosD(th));
const fnOfRoles = (a, b) => { const s = new Set([a, b]); return s.has('hyp') ? (s.has('opp') ? 'sin' : 'cos') : 'tan'; };
const ratioRoles = { sin: ['opp', 'hyp'], cos: ['adj', 'hyp'], tan: ['opp', 'adj'] };
/** labelled sides of a figure: [{ side, text, v }] */
function labels(f) { return (f.segs ?? []).filter(s => /^[A-Z]{2}$/.test(s.id) && s.text).map(s => ({ side: s.id, text: s.text.trim(), v: labVal(s.text) })); }
/** marked angles with a text: [{ V, text, v }] */
function angTexts(f) { return (f.angles ?? []).filter(a => !a.box && a.text && /^[A-Z]{3}$/.test(a.id)).map(a => ({ V: a.id[1], text: a.text, v: num(a.text) })); }
/** the numeric length of every side of triangle t (labels, then Pythagoras) */
function sideVals(f, t) {
  const S = {}, names = [t.R + t.A, t.R + t.B, t.A + t.B];
  for (const n of names) { const s = segOf(f, n[0], n[1]); const v = s?.text ? labVal(s.text) : NaN; if (Number.isFinite(v)) S[skey(n)] = v; }
  const [l1, l2, h] = names.map(skey);
  if (S[l1] !== undefined && S[l2] !== undefined && S[h] === undefined) S[h] = Math.hypot(S[l1], S[l2]);
  if (S[h] !== undefined && S[l1] !== undefined && S[l2] === undefined) S[l2] = Math.sqrt(S[h] ** 2 - S[l1] ** 2);
  if (S[h] !== undefined && S[l2] !== undefined && S[l1] === undefined) S[l1] = Math.sqrt(S[h] ** 2 - S[l2] ** 2);
  return S;
}
/** a figure with one marked angle (number or unknown) and two labelled sides → what the student solves */
function figProblem(f) {
  const t = trisOf(f)[0];
  if (!t) return null;
  const at = angTexts(f).filter(a => a.V !== t.R)[0];
  if (!at) return null;
  const r = roles(t, at.V);
  const L = labels(f).filter(l => [t.R + t.A, t.R + t.B, t.A + t.B].some(n => skey(n) === skey(l.side)));
  const known = L.filter(l => Number.isFinite(l.v)).map(l => ({ role: roleOf(r, l.side), v: l.v, side: l.side, text: l.text }));
  const unk = L.filter(l => !Number.isFinite(l.v)).map(l => ({ role: roleOf(r, l.side), side: l.side, name: l.text }));
  return { t, V: at.V, angle: Number.isFinite(at.v) ? at.v : null, angleText: at.text, r, known, unk };
}
/** solve a figProblem: the unknown side (angle given) or the angle (two sides given) */
function solveFig(pr) {
  if (!pr) return NaN;
  if (pr.angle !== null) {
    const k = pr.known[0], u = pr.unk.find(x => x.role);
    if (!k || !u) return NaN;
    return (k.v * unitSide(u.role, pr.angle)) / unitSide(k.role, pr.angle);
  }
  if (pr.known.length < 2) return NaN;
  const by = {}; for (const k of pr.known) by[k.role] = k.v;
  if (by.opp !== undefined && by.adj !== undefined) return Math.atan(by.opp / by.adj) / D;
  if (by.opp !== undefined && by.hyp !== undefined) return Math.asin(by.opp / by.hyp) / D;
  if (by.adj !== undefined && by.hyp !== undefined) return Math.acos(by.adj / by.hyp) / D;
  return NaN;
}

/** a trig equation "cos 33.5° = x/22.5", "sin x = 4/13" (plain or TeX) → { f, ang, num, den } (strings / numbers) */
function eqOf(text) {
  const t = plain(String(text).replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2').replace(/\^\\circ|\^\{\\circ\}/g, '°').replace(/\\(sin|cos|tan)/g, '$1').replace(/\\[,;: ]/g, ' ').replace(/[{}]/g, ''));
  const m = t.match(/(sin|cos|tan) ?(x|\d+(?:\.\d+)?°?) ?= ?(\w+(?:\.\d+)?) ?\/ ?(\w+(?:\.\d+)?)/);
  if (!m) return null;
  return { f: m[1], ang: m[2] === 'x' ? 'x' : num(m[2]), num: m[3], den: m[4] };
}
/** solve an equation from eqOf for its unknown */
function solveEq(e) {
  if (!e) return NaN;
  const isN = s => /^\d/.test(s);
  if (e.ang === 'x') { const r = Number(e.num) / Number(e.den); return e.f === 'sin' ? Math.asin(r) / D : e.f === 'cos' ? Math.acos(r) / D : Math.atan(r) / D; }
  const k = fnDeg(e.f, e.ang);
  if (!isN(e.num) && isN(e.den)) return k * Number(e.den);
  if (isN(e.num) && !isN(e.den)) return Number(e.num) / k;
  return NaN;
}

// =====================================================================================================================
// families
const POLY = { triangle: 3, square: 4, pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8, nonagon: 9, decagon: 10, dodecagon: 12 };
function polyN(t) { const m = t.match(/(\d+)-gon/); if (m) return Number(m[1]); for (const [k, n] of Object.entries(POLY)) if (new RegExp(`\\b${k}\\b(?! (?:foot|feet|inch|inches|units?|meters?|centimeters?)\\b)`).test(t)) return n; return NaN; }
const apothemOf = (n, s) => s / (2 * tanD(180 / n));

function sideNameChoice(q, side) { return idx(q, c => /^[A-Z]{2}$/.test(c.replace(/\s/g, '')) && skey(c.replace(/\s/g, '')) === skey(side)); }

const SOLVE = {
  nameSide(q) {
    const t = plain(q.prompt), m = t.match(/right triangle ([A-Z]{3}) \(right angle at ([A-Z])\), which side is the (hypotenuse|adjacent leg|opposite leg) relative to ∠([A-Z])/);
    if (!m) return undefined;
    const tri = { R: m[2], A: m[1].replace(m[2], '')[0], B: m[1].replace(m[2], '')[1], set: m[1] };
    const r = roles(tri, m[4]);
    return sideNameChoice(q, r[m[3] === 'hypotenuse' ? 'hyp' : m[3] === 'adjacent leg' ? 'adj' : 'opp']);
  },
  swapAngle(q) {
    const f = figOf(q), m = plain(q.prompt).match(/What is ([A-Z]{2}) relative to ∠([A-Z])/);
    if (!f || !m) return undefined;
    const r = roles(triWith(f, m[2]), m[2]), k = roleOf(r, m[1]);
    return idx(q, c => c === { hyp: 'the hypotenuse', opp: 'the opposite leg', adj: 'the adjacent leg' }[k]);
  },
  compositeSide(q) {
    const m = plain(q.prompt).match(/with the diagonal ([A-Z]{2})\. In right triangle ([A-Z]{3}), which side is the (hypotenuse|adjacent leg|opposite leg) relative to the marked angle ∠([A-Z]{3})/);
    if (!m) return undefined;
    const R = m[2].split('').find(x => !m[1].includes(x)), [A, B] = m[2].split('').filter(x => x !== R);
    const r = roles({ R, A, B, set: m[2] }, m[4][1]);
    return sideNameChoice(q, r[m[3] === 'hypotenuse' ? 'hyp' : m[3] === 'adjacent leg' ? 'adj' : 'opp']);
  },
  scaleRatio(q) {
    const f = figOf(q), t = plain(q.prompt), m = t.match(/What is (sin|cos|tan) ([A-Z])\?/), c = t.match(/∠([A-Z]) ≅ ∠([A-Z])/);
    if (!f || !m || !c) return undefined;
    for (const V of [m[2], c[1] === m[2] ? c[2] : c[1]]) {
      const tri = triWith(f, V), S = sideVals(f, tri), r = roles(tri, V), [a, b] = ratioRoles[m[1]].map(k => S[skey(r[k])]);
      if (Number.isFinite(a) && Number.isFinite(b)) return a / b;
    }
    return undefined;
  },
  invClaim(q) {
    const t = plain(q.prompt);
    const m = t.match(/What is (sin|cos|tan) [A-Z] in the copy/);
    if (m) return idx(q, c => c === { sin: 'o/h', cos: 'a/h', tan: 'o/a' }[m[1]]);
    if (/proves every right triangle/.test(t)) return idx(q, c => /^No: examples are not a proof/.test(c));
    if (/has a bigger (sin|cos|tan)/.test(t)) return idx(q, c => /^No:.*similar.*stays the same/.test(c));
    return undefined;
  },
  sameAngle(q) {
    const m = plain(q.prompt).match(/tangent (\d+)\/(\d+)/);
    if (!m) return undefined;
    const want = Number(m[1]) / Number(m[2]);
    return idx(q, c => { const n = nums(c); if (n.length !== 3) return false; const [a, b, h] = n; return near(a * a + b * b, h * h, 1e-6 * h * h) && near(Math.min(a, b) / Math.max(a, b), want, 1e-9); });
  },
  ratioFromFig(q) {
    const f = figOf(q), m = plain(q.prompt).match(/What is (sin|cos|tan) ([A-Z])\?/);
    if (!f || !m) return undefined;
    const tri = triWith(f, m[2]), S = sideVals(f, tri), r = roles(tri, m[2]), [a, b] = ratioRoles[m[1]].map(k => S[skey(r[k])]);
    return a / b;
  },
  sinVar(q) {
    const f = figOf(q), m = plain(q.prompt).match(/Which ratio is (sin|cos|tan) ([A-Z])\?/);
    if (!f || !m) return undefined;
    const tri = triWith(f, m[2]), r = roles(tri, m[2]);
    const lab = k => segOf(f, r[k][0], r[k][1])?.text;
    const [a, b] = ratioRoles[m[1]].map(lab);
    return idx(q, c => c === `${a}/${b}`);
  },
  sohMix(q) {
    const f = figOf(q), m = plain(q.prompt).match(/equals (\d+)\/(\d+)/);
    if (!f || !m) return undefined;
    const want = Number(m[1]) / Number(m[2]), tri = trisOf(f)[0], S = sideVals(f, tri);
    return idx(q, c => { const k = c.match(/^(sin|cos|tan) ([A-Z])$/); if (!k || ![tri.A, tri.B].includes(k[2])) return false; const r = roles(tri, k[2]); const [a, b] = ratioRoles[k[1]].map(x => S[skey(r[x])]); return near(a / b, want, 1e-9); });
  },
  possible(q) {
    const m = plain(q.prompt).match(/reports (sin|cos|tan) A = (-?\d+(?:\.\d+)?)/);
    if (!m) return undefined;
    const v = Number(m[2]), ok = m[1] === 'tan' ? v > 0 : v > 0 && v < 1;
    const cands = (q.choices ?? []).map((c, i) => [plain(c), i]).filter(([c]) => (ok ? /^Possible/.test(c) : /^Impossible/.test(c)));
    const good = cands.filter(([c]) => !/big enough|large enough|whole number|only a big|at most 1|must be above|cannot have two equal/.test(c)
      && !(/legs are equal/.test(c) && !(m[1] === 'tan' && v === 1)) && !(/close to (\d+)°/.test(c)));
    return good.length === 1 ? good[0][1] : -1;
  },
  whichPossible(q) {
    const m = plain(q.prompt).match(/could be (sin|cos|tan) [A-Z]/);
    if (!m) return undefined;
    return idx(q, c => { if (!/^-?\d+(?:\.\d+)?$/.test(c)) return false; const v = Number(c); return m[1] === 'tan' ? v > 0 : v > 0 && v < 1; });
  },
  compareRatio(q) {
    const m = plain(q.prompt).match(/greater, (sin|cos|tan) (\d+(?:\.\d+)?)° or (sin|cos|tan) (\d+(?:\.\d+)?)°/);
    if (!m) return undefined;
    const a = fnDeg(m[1], Number(m[2])), b = fnDeg(m[3], Number(m[4]));
    if (near(a, b, 1e-12)) return idx(q, c => /equal/.test(c));
    const w = a > b ? `${m[1]} ${m[2]}°` : `${m[3]} ${m[4]}°`;
    return idx(q, c => c === w);
  },
  doubleClaim(q) {
    const m = plain(q.prompt).match(/Use the values: (sin|cos|tan) (\d+(?:\.\d+)?)° ≈ \d+(?:\.\d+)? and (?:sin|cos|tan) (\d+(?:\.\d+)?)°/);
    if (!m) return undefined;
    const a = fnDeg(m[1], Number(m[2])), b = fnDeg(m[1], Number(m[3]));
    const k = near(b, 2 * a, 1e-12) ? 'exactly double' : b < 2 * a ? 'less than double' : 'more than double';
    return idx(q, c => c.includes(k));
  },
  cofMissing(q) {
    const m = plain(q.prompt).match(/(sin|cos) x = (sin|cos) (\d+(?:\.\d+)?)°/);
    if (!m) return undefined;
    return m[1] === m[2] ? Number(m[3]) : 90 - Number(m[3]);
  },
  cofMatch(q) {
    const m = plain(q.prompt).match(/which equals (sin|cos|tan) (\d+(?:\.\d+)?)°/);
    if (!m) return undefined;
    const v = fnDeg(m[1], Number(m[2]));
    return idx(q, c => { const k = c.match(/^(sin|cos|tan) (\d+(?:\.\d+)?)°$/); return !!k && near(fnDeg(k[1], Number(k[2])), v, 1e-12); });
  },
  cofTri(q) {
    const m = plain(q.prompt).match(/right angle is at ([A-Z])\. (sin|cos) ([A-Z]) = (\d+(?:\.\d+)?)\. What is (sin|cos) ([A-Z])\?/);
    if (!m) return undefined;
    const v = Number(m[4]);
    const same = m[3] === m[6];
    // sin A = cos B for the two acute angles; same angle: sin² + cos² = 1
    if (same) return m[2] === m[5] ? v : Math.sqrt(1 - v * v);
    return m[2] !== m[5] ? v : Math.sqrt(1 - v * v);
  },
  modeRead(q) {
    const m = plain(q.prompt).match(/shows (sin|cos|tan)\((-?\d+(?:\.\d+)?)\) = (-?\d+(?:\.\d+)?)/);
    if (!m) return undefined;
    const x = Number(m[2]), v = Number(m[3]), ok = r => near(FN[m[1]](r), v, 6e-6);
    const modes = [ok(x * D) && 'Degree', ok(x) && 'Radian', ok((x * Math.PI) / 200) && 'Gradian'].filter(Boolean);
    return modes.length === 1 ? idx(q, c => c.startsWith(modes[0])) : -1;
  },
  modeCheck(q) {
    return idx(q, c => {
      const k = c.match(/^(sin|cos|tan)\((-?\d+(?:\.\d+)?)\) shows (.+)$/);
      if (!k) return false;
      const x = Number(k[2]), test = /positive/.test(k[3]) ? v => v > 0 : (w => v => near(v, w, 5e-5))(Number(k[3]));
      return test(FN[k[1]](x * D)) && !test(FN[k[1]](x)) && !test(FN[k[1]]((x * Math.PI) / 200));
    });
  },
  evalTrig(q) {
    const m = plain(q.prompt).match(/Find (sin|cos|tan) (\d+(?:\.\d+)?)°/);
    return m ? rd(fnDeg(m[1], Number(m[2])), placesOf(q.prompt)) : undefined;
  },
  estimateTrig(q) {
    const m = plain(q.prompt).match(/closest to (sin|cos|tan) (\d+(?:\.\d+)?)°/);
    if (!m) return undefined;
    const v = fnDeg(m[1], Number(m[2])), d = (q.choices ?? []).map(c => Math.abs(Number(plain(c)) - v)), best = Math.min(...d);
    return d.filter(x => near(x, best, 1e-12)).length === 1 ? d.indexOf(best) : -1;
  },
  carry(q) {
    const m = plain(q.prompt).match(/An? (\d+(?:\.\d+)?) ft ladder leans at (\d+(?:\.\d+)?)° .* at (\d+(?:\.\d+)?)°, so/);
    return m ? rd((Number(m[1]) * sinD(Number(m[2]))) / sinD(Number(m[3])), placesOf(q.prompt)) : undefined;
  },
  roundCompare(q) {
    const m = plain(q.prompt).match(/Find (\d+(?:\.\d+)?) (sin|cos|tan) (\d+(?:\.\d+)?)° to the nearest tenth\. (\w+) rounds .* gets (\d+(?:\.\d+)?)\. (\w+) keeps the full display and gets (\d+(?:\.\d+)?)\./);
    if (!m) return undefined;
    const tr = round(Number(m[1]) * fnDeg(m[2], Number(m[3])), 1), a = Number(m[5]) === tr, b = Number(m[7]) === tr;
    if (a && b) return idx(q, c => /^Both/.test(c));
    const who = a ? m[4] : b ? m[6] : null;
    return who ? idx(q, c => c.startsWith(`${who}: round only the final answer`) || (c.startsWith(`${who}:`) && !/two decimals/.test(c))) : -1;
  },
  chooseEq(q) {
    const f = figOf(q), pr = f && figProblem(f);
    if (!pr || pr.angle === null || !pr.known[0] || !pr.unk[0]) return undefined;
    const k = pr.known[0], u = pr.unk[0], fn = fnOfRoles(k.role, u.role), [nr] = ratioRoles[fn];
    const top = k.role === nr ? String(k.v) : u.name, bot = k.role === nr ? u.name : String(k.v);
    return idx(q, c => c.replace(/\s/g, '') === `${fn}${pr.angle}°=${top}/${bot}`);
  },
  chooseFn(q) {
    const f = figOf(q), pr = f && figProblem(f);
    if (!pr) return undefined;
    if (pr.angle === null) { if (pr.known.length !== 2) return -1; const fn = fnOfRoles(pr.known[0].role, pr.known[1].role); return idx(q, c => c === `${fn}⁻¹`); }
    if (!pr.known[0] || !pr.unk[0]) return -1;
    const fn = fnOfRoles(pr.known[0].role, pr.unk[0].role);
    return idx(q, c => fullName[c] === fn);
  },
  figSolve(q) {
    const f = figOf(q);
    if (!f) return undefined;
    return rd(solveFig(figProblem(f)), placesOf(q.prompt));
  },
  eqSolve(q) {
    const e = eqOf(q.board) ?? eqOf(q.prompt);
    return e ? rd(solveEq(e), placesOf(q.prompt)) : undefined;
  },
  invTable(q) {
    const m = plain(q.prompt).match(/What is (sin|cos|tan)⁻¹\((\d+(?:\.\d+)?)\)/);
    if (!m) return undefined;
    const v = Number(m[2]), a = (m[1] === 'sin' ? Math.asin(v) : m[1] === 'cos' ? Math.acos(v) : Math.atan(v)) / D;
    return idx(q, c => /°$/.test(c) && near(num(c), a, 0.05));
  },
  invMeaning(q) {
    const t = plain(q.prompt);
    if (/NO acute angle/.test(t)) return idx(q, c => { const k = c.match(/^(sin|cos|tan)⁻¹\((-?\d+(?:\.\d+)?)\)$/); if (!k) return false; const v = Number(k[2]); return !(k[1] === 'tan' ? v > 0 : v > 0 && v < 1); });
    const m = t.match(/What does (sin|cos|tan)⁻¹\((\d+(?:\.\d+)?)\) mean/);
    if (!m) return undefined;
    const w = { sin: 'sine', cos: 'cosine', tan: 'tangent' }[m[1]];
    return idx(q, c => c === `The acute angle whose ${w} is ${m[2]}`);
  },
  solveAll(q) {
    const m = plain(q.prompt).match(/Right angle at ([A-Z]), ∠([A-Z]) = (\d+(?:\.\d+)?)°, hypotenuse ([A-Z]{2}) = (\d+(?:\.\d+)?) \w+\. Find ∠([A-Z]) and ([A-Z]{2}) = [ab]/);
    if (!m) return undefined;
    const th = Number(m[3]), H = Number(m[5]), leg = m[7];
    const v = leg.includes(m[2]) ? H * cosD(th) : H * sinD(th);
    return [90 - th, rd(v, placesOf(q.prompt))];
  },
  solvePlan(q) {
    const t = plain(q.prompt);
    if (/No side is known/.test(t)) return idx(q, c => /^No: the angles fix the shape/.test(c));
    if (/legs [A-Z]{2} = \d+(?:\.\d+)? and [A-Z]{2} = \d+(?:\.\d+)?\. What is the most direct way to the hypotenuse/.test(t)) return idx(q, c => /^The Pythagorean theorem/.test(c));
    const m = t.match(/∠([A-Z]) = 90°, ∠([A-Z]) = (\d+(?:\.\d+)?)°, .* direct way to ∠([A-Z])/);
    if (m) return idx(q, c => c.startsWith('The angle sum') && (!/:/.test(c) || c.replace(/\s/g, '') === `Theanglesum:90°-${m[3]}°`));
    return undefined;
  },
  specialDerive(q) {
    const t = plain(q.prompt);
    let m = t.match(/equilateral triangle with side (\d+(?:\.\d+)?) .* altitude, exactly/);
    if (m) return byValue(q, (Number(m[1]) / 2) * Math.sqrt(3));
    m = t.match(/square with side (\d+(?:\.\d+)?) .* diagonal, exactly/);
    if (m) return byValue(q, Number(m[1]) * Math.SQRT2);
    return undefined;
  },
  specialFwd(q) {
    const t = plain(q.prompt);
    let m = t.match(/45-45-90 triangle has legs ([\d.√]+)\. How long is the hypotenuse/);
    if (m) return byValue(q, radVal(m[1]) * Math.SQRT2);
    m = t.match(/30-60-90 triangle the short leg \(opposite 30°\) is ([\d.√]+)\. How long is the (long leg|hypotenuse)/);
    if (m) return byValue(q, radVal(m[1]) * (m[2] === 'hypotenuse' ? 2 : Math.sqrt(3)));
    return undefined;
  },
  specialRev(q) {
    const t = plain(q.prompt);
    let m = t.match(/45-45-90 triangle has hypotenuse ([\d.√]+)\. How long is each leg/);
    if (m) return byValue(q, radVal(m[1]) / Math.SQRT2);
    m = t.match(/30-60-90 triangle has (long leg|hypotenuse) ([\d.√]+)\. How long is the (short leg|long leg|hypotenuse)/);
    if (!m) return undefined;
    const g = radVal(m[2]), s = m[1] === 'hypotenuse' ? g / 2 : g / Math.sqrt(3);
    return byValue(q, m[3] === 'short leg' ? s : m[3] === 'long leg' ? s * Math.sqrt(3) : 2 * s);
  },
  specialRevNum(q) {
    const t = plain(q.prompt);
    let m = t.match(/equilateral .* is (\d+(?:\.\d+)?) \w+ tall \(its altitude\)\. How long is each side/);
    if (m) return rd((2 * Number(m[1])) / Math.sqrt(3), placesOf(t));
    m = t.match(/square .* measures (\d+(?:\.\d+)?) \w+ along its diagonal\. How long is its side/);
    if (m) return rd(Number(m[1]) / Math.SQRT2, placesOf(t));
    return undefined;
  },
  exactVal(q) {
    const t = plain(q.prompt);
    let m = t.match(/what is (sin|cos|tan) (\d+(?:\.\d+)?)° exactly/);
    if (m) return byValue(q, fnDeg(m[1], Number(m[2])));
    m = t.match(/∠([A-Z]) = (\d+(?:\.\d+)?)°\. What is (sin|cos|tan) ([A-Z]) exactly/);
    if (m) {
      const R = (t.match(/right angle at ([A-Z])/) ?? [])[1];
      if (m[4] === R) return -1;
      const a = m[4] === m[1] ? Number(m[2]) : 90 - Number(m[2]);
      return byValue(q, fnDeg(m[3], a));
    }
    return undefined;
  },
  exactSolve(q) {
    const f = figOf(q);
    return f ? byValue(q, solveFig(figProblem(f))) : undefined;
  },
  tripleSpot(q) {
    return idx(q, c => { const n = nums(c).sort((a, b) => a - b); return n.length === 3 && near(n[0] ** 2 + n[1] ** 2, n[2] ** 2, 1e-9); });
  },
  tripleMissing(q) {
    const t = plain(q.prompt);
    let m = t.match(/legs (\d+(?:\.\d+)?) \w+ and (\d+(?:\.\d+)?) \w+\. Find/);
    if (m) return Math.hypot(Number(m[1]), Number(m[2]));
    m = t.match(/a leg of (\d+(?:\.\d+)?) \w+ and hypotenuse (\d+(?:\.\d+)?) \w+\. Find/);
    if (m) return Math.sqrt(Number(m[2]) ** 2 - Number(m[1]) ** 2);
    return undefined;
  },
  methodPick(q) {
    const t = plain(q.prompt);
    let m = t.match(/has a (\d+(?:\.\d+)?)° angle and hypotenuse (\d+(?:\.\d+)?)\. Which method (?:gives|finds) the (?:side|leg) opposite (\d+(?:\.\d+)?)°/);
    if (m) {
      const a = Number(m[1]), H = Number(m[2]);
      return idx(q, c => {
        if (/^30-60-90: the short leg is half the hypotenuse/.test(c)) return a === 30 && Number(m[3]) === 30;
        const k = c.match(/^Trig: x = (\d+(?:\.\d+)?) (sin|cos|tan) (\d+(?:\.\d+)?)°$/);
        if (k) return near(Number(k[1]) * fnDeg(k[2], Number(k[3])), H * sinD(Number(m[3])), 1e-9);
        return false; // Pythagoras needs two sides; a triple has no named angle
      });
    }
    m = t.match(/has legs (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?)\. Which (?:shortcut|method) gives the (?:exact )?hypotenuse/);
    if (m) {
      const a = Number(m[1]), b = Number(m[2]), H = Math.hypot(a, b);
      const triple = c => { const k = c.match(/^The (\d+)-(\d+)-(\d+) triple(?: (?:times|scaled by) (\d+))?$/); if (!k) return null; const s = Number(k[4] ?? 1); return [Number(k[1]) * s, Number(k[2]) * s, Number(k[3]) * s]; };
      const goodTriple = c => { const tr = triple(c); return !!tr && ((tr[0] === a && tr[1] === b) || (tr[0] === b && tr[1] === a)) && near(tr[2], H, 1e-9); };
      const pyth = c => { const k = c.match(/^The Pythagorean theorem(?:: √(\d+))?$/); return !!k && (!k[1] || near(Math.sqrt(Number(k[1])), H, 1e-9)); };
      const anyTriple = (q.choices ?? []).some(c => goodTriple(plain(c)));
      if (anyTriple) return idx(q, c => goodTriple(c));
      return idx(q, c => pyth(c) || (c === 'A Pythagorean triple' && Number.isInteger(H)));
    }
    return undefined;
  },
  polyArea(q) {
    const t = plain(q.prompt), m = t.match(/has side (\d+(?:\.\d+)?) (\w+)\. Find its area/), n = polyN(t);
    if (!m || !n) return undefined;
    const s = Number(m[1]);
    return rd(0.5 * apothemOf(n, s) * n * s, placesOf(t));
  },
  apothem(q) {
    const t = plain(q.prompt), m = t.match(/has side (\d+(?:\.\d+)?) \w+\. Find its apothem/), n = polyN(t);
    return m && n ? rd(apothemOf(n, Number(m[1])), placesOf(t)) : undefined;
  },
  polyDerive(q) {
    const n = polyN(plain(q.prompt));
    return idx(q, c => c === `${n} triangles, each ½·s·a; and ${n}·s = P`);
  },
  polyContext(q) {
    const t = plain(q.prompt), n = polyN(t);
    let m = t.match(/regular octagon (\d+(?:\.\d+)?) in across, measured between opposite sides\. Find its area (in square feet|to the nearest square inch)/);
    if (m) {
      const W = Number(m[1]), a = W / 2, s = 2 * a * tanD(22.5), A = 0.5 * a * 8 * s;
      return m[2] === 'in square feet' ? rd(A / 144, placesOf(t)) : rd(A, placesOf(t));
    }
    m = t.match(/with side (\d+(?:\.\d+)?) (ft|in|m|cm)\. Find its area/);
    if (m && n) { const s = Number(m[1]); return rd(0.5 * apothemOf(n, s) * n * s, placesOf(t)); }
    return undefined;
  },
  polyUnits(q) {
    const t = plain(q.prompt);
    let m = t.match(/area is (\d+(?:\.\d+)?) ft²\. What is it in square inches/);
    if (m) { const v = Number(m[1]) * 144; return idx(q, c => / in²$/.test(c) && near(Number(c.replace(/ in²$/, '')), v, 1e-6)); }
    m = t.match(/area is (\d+(?:\.\d+)?) in²\. What is it in square feet, to the nearest tenth/);
    if (m) { const v = round(Number(m[1]) / 144, 1); return idx(q, c => / ft²$/.test(c) && near(Number(c.replace(/ ft²$/, '')), v, 1e-9)); }
    return undefined;
  },
  auditAngle(q) {
    const f = figOf(q), pr = f && figProblem(f), lines = q.data?.picture?.card?.lines ?? [];
    if (!pr || pr.angle === null) return undefined;
    const w = eqOf(lines.join(' ')), xr = num((lines.find(l => /x ≈/.test(l)) ?? '').replace(/^.*≈/, ''));
    if (!w) return undefined;
    const roleOfTok = (r, tok) => { const l = labels(f).find(x => x.text === tok || String(x.v) === tok); return l ? roleOf(r, l.side) : null; };
    const fits = r => { const [a, b] = ratioRoles[w.f]; return roleOfTok(r, w.num) === a && roleOfTok(r, w.den) === b; };
    const rV = pr.r, rW = roles(pr.t, rV.W);
    if (fits(rV)) {
      const xd = round(solveEq(w), 1);
      if (near(xd, xr, 1e-9)) return idx(q, c => c === 'The work is right');
      const k = FN[w.f](w.ang), isN = s => /^\d/.test(s);
      const xrad = round(!isN(w.num) ? k * Number(w.den) : Number(w.num) / k, 1);
      return near(xrad, xr, 1e-9) ? idx(q, c => /radian mode/.test(c)) : -1;
    }
    if (fits(rW)) return idx(q, c => c.startsWith('Wrong angle') && num(c) === 90 - pr.angle);
    return -1;
  },
  auditSetup(q) {
    const f = figOf(q), pr = f && figProblem(f), lines = q.data?.picture?.card?.lines ?? [];
    if (!pr) return undefined;
    const work = lines.join(' '), xr = (() => { const l = lines.find(x => /^x ≈/.test(x)); return l ? num(l.replace(/^x ≈/, '')) : NaN; })();
    const S = sideVals(f, pr.t), r = pr.r, val = k => S[skey(r[k])];
    const checks = {
      leg: pr.unk.some(u => u.role === 'opp' || u.role === 'adj') && Number.isFinite(xr) && Number.isFinite(val('hyp')) && xr > val('hyp'),
      hyp: pr.unk.some(u => u.role === 'hyp') && Number.isFinite(xr) && [val('opp'), val('adj')].some(v => Number.isFinite(v) && xr < v),
      above1: (() => { const k = work.match(/(sin|cos) x = (\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/); return !!k && Number(k[2]) / Number(k[3]) > 1; })(),
      angle: pr.angle === null && Number.isFinite(xr) && /°/.test(lines.find(x => /^x ≈/.test(x)) ?? '') && val('opp') < val('adj') && xr > 45,
    };
    const want = Object.entries(checks).filter(([, v]) => v).map(([k]) => k);
    if (want.length !== 1) return want.length ? -1 : idx(q, c => /^Nothing/.test(c));
    const re = { leg: /^x is a leg, yet/, hyp: /^x is the hypotenuse, yet/, above1: /sine \(or cosine\) above 1/, angle: /^x is across from the shorter leg/ }[want[0]];
    return idx(q, c => re.test(c));
  },
  auditFix(q) {
    const f = figOf(q);
    return f ? rd(solveFig(figProblem(f)), placesOf(q.prompt)) : undefined;
  },
  modeDiag(q) {
    const t = plain(q.prompt);
    let m = t.match(/with (sin|cos|tan)⁻¹\((\d+)\/(\d+)\) and the display shows (\d+(?:\.\d+)?)/);
    if (m) {
      const r = Number(m[2]) / Number(m[3]), inv = { sin: Math.asin, cos: Math.acos, tan: Math.atan }[m[1]](r);
      if (!near(inv, Number(m[4]), 6e-5)) return -1;
      return idx(q, c => /^No: radian mode; in degrees it is about/.test(c) && near(num(c.replace(/^.*about/, '')), round(inv / D, 1), 1e-9));
    }
    m = t.match(/calculator shows (sin|cos|tan)\((\d+)\) = (-?\d+(?:\.\d+)?)\. What does that tell you/);
    if (m) {
      const x = Number(m[2]), v = Number(m[3]);
      const rad = near(FN[m[1]](x), v, 6e-5), deg = near(fnDeg(m[1], x), v, 6e-5);
      return rad && !deg ? idx(q, c => /radian mode/.test(c)) : -1;
    }
    m = t.match(/calculator shows (sin|cos|tan)\((\d+)\) = (-?\d+(?:\.\d+)?)\. \w+ says it must be in degree mode/);
    if (m) {
      const x = Number(m[2]), v = Number(m[3]);
      const rad = near(FN[m[1]](x), v, 6e-5), deg = near(fnDeg(m[1], x), v, 6e-5);
      if (!rad || deg) return -1;
      return idx(q, c => { const k = c.match(/benchmark \((sin|cos|tan) (\d+(?:\.\d+)?)° = (\d+(?:\.\d+)?)\) shows it is in radian mode/); return !!k && near(fnDeg(k[1], Number(k[2])), Number(k[3]), 5e-5); });
    }
    return undefined;
  },
  modeFix(q) {
    const t = plain(q.prompt);
    let m = t.match(/What is (sin|cos|tan) (\d+(?:\.\d+)?)°, to four decimal places/);
    if (m) return rd(fnDeg(m[1], Number(m[2])), 4);
    m = t.match(/got (sin|cos|tan)⁻¹\((\d+)\/(\d+)\) = \d+(?:\.\d+)?\. What is the angle in degrees/);
    if (m) { const r = Number(m[2]) / Number(m[3]); return rd({ sin: Math.asin, cos: Math.acos, tan: Math.atan }[m[1]](r) / D, placesOf(t)); }
    return undefined;
  },
  ladder(q) {
    const t = plain(q.prompt), p = placesOf(t);
    let m = t.match(/stand at (\d+(?:\.\d+)?)° with the level ground, its foot (\d+(?:\.\d+)?) ft from the wall\. How long/);
    if (m) return rd(Number(m[2]) / cosD(Number(m[1])), p);
    m = t.match(/An? (\d+(?:\.\d+)?) ft ladder makes a (\d+(?:\.\d+)?)° angle with the level ground\. How far is its foot/);
    if (m) return rd(Number(m[1]) * cosD(Number(m[2])), p);
    m = t.match(/An? (\d+(?:\.\d+)?) ft ladder leans against a wall and makes a (\d+(?:\.\d+)?)° angle with the level ground\. How high/);
    if (m) return rd(Number(m[1]) * sinD(Number(m[2])), p);
    return undefined;
  },
  kite(q) {
    const m = plain(q.prompt).match(/string is (\d+(?:\.\d+)?) ft long, .* makes a (\d+(?:\.\d+)?)° angle with the horizontal/);
    return m ? rd(Number(m[1]) * sinD(Number(m[2])), placesOf(q.prompt)) : undefined;
  },
  shadowTrig(q) {
    const t = plain(q.prompt), p = placesOf(t);
    let m = t.match(/casts an? (\d+(?:\.\d+)?) ft shadow on level ground when the sun is (\d+(?:\.\d+)?)° above the horizon\. How tall/);
    if (m) return rd(Number(m[1]) * tanD(Number(m[2])), p);
    m = t.match(/An? (\d+(?:\.\d+)?) ft [\w ]+ stands on level ground\. The sun is (\d+(?:\.\d+)?)° above the horizon\. How long is its shadow/);
    if (m) return rd(Number(m[1]) / tanD(Number(m[2])), p);
    return undefined;
  },
  adaRamp(q) {
    const t = plain(q.prompt), p = placesOf(t);
    let m = t.match(/rise (\d+(?:\.\d+)?) ft at an angle of (\d+(?:\.\d+)?)° with the ground\. How long is the ramp surface/);
    if (m) return rd(Number(m[1]) / sinD(Number(m[2])), p);
    m = t.match(/rises (\d+(?:\.\d+)?) ft over a horizontal run of (\d+(?:\.\d+)?) ft\. What angle/);
    if (m) return rd(Math.atan(Number(m[1]) / Number(m[2])) / D, p);
    return undefined;
  },
  precision(q) {
    const r = report(q);
    return r ? idx(q, c => c === `${r.text} ft`) : undefined;
  },
  precisionCritique(q) {
    const r = report(q), m = plain(q.prompt).match(/\w+ reports (\d+(?:\.\d+)?) ft/);
    if (!r || !m) return undefined;
    const dp = (m[1].split('.')[1] ?? '').length;
    if (dp > r.places) return idx(q, c => c === `Too precise: report ${r.text} ft`);
    if (dp === r.places && m[1] === r.text) return idx(q, c => /^Fine/.test(c));
    return idx(q, c => c.startsWith('Not precise enough') && c.includes(` ${r.text} ft`));
  },
  elevation(q) {
    const t = plain(q.prompt), p = placesOf(t);
    let m = t.match(/stands (\d+(?:\.\d+)?) ft from an? [\w ]+ on level ground\. From \w+'s eyes, (\d+(?:\.\d+)?) ft above the ground, the angle of elevation to the top is (\d+(?:\.\d+)?)°/);
    if (m) return rd(Number(m[1]) * tanD(Number(m[3])) + Number(m[2]), p);
    m = t.match(/level ground (\d+(?:\.\d+)?) ft from an? [\w ]+, the angle of elevation to its top is (\d+(?:\.\d+)?)°/);
    if (m) return rd(Number(m[1]) * tanD(Number(m[2])), p);
    return undefined;
  },
  depression(q) {
    const m = plain(q.prompt).match(/(?:top of an? (\d+(?:\.\d+)?) ft [\w ]+?|From an? [\w ]+? (\d+(?:\.\d+)?) ft above level ground), the angle of depression to an? \w+ is (\d+(?:\.\d+)?)°/);
    return m ? rd(Number(m[1] ?? m[2]) / tanD(Number(m[3])), placesOf(q.prompt)) : undefined;
  },
  depWhere(q) {
    const t = plain(q.prompt);
    const m = t.match(/angle of depression to the \w+ is (\d+(?:\.\d+)?)°\. What is the angle of elevation/);
    if (m) return Number(m[1]); // alternate interior angles: the horizontal at the top ∥ the level ground
    if (/Where is the angle of depression/.test(t)) return idx(q, c => c === 'At the top: between the horizontal and the line of sight');
    return undefined;
  },
};
SOLVE.writeSin = SOLVE.writeCos = SOLVE.writeTan = SOLVE.cosDec = q => {
  const v = SOLVE.ratioFromFig(q);
  if (v === undefined) return undefined;
  if (q.input === 'num') return v;
  try { return fracOf(v); } catch { return v; }
};
SOLVE.sideNum = SOLVE.sideDen = SOLVE.invCalc = SOLVE.figSolve;
SOLVE.sideNumEq = SOLVE.sideDenEq = SOLVE.invEq = SOLVE.eqSolve;

/** a clean decimal / fraction value → [n, d] */
function fracOf(v) {
  for (let d = 1; d <= 100000; d++) { const n = Math.round(v * d); if (Math.abs(n / d - v) < 1e-9) return [n, d]; }
  throw new Error('not a fraction');
}
/** the one choice whose exact radical value is v */
function byValue(q, v) { return idx(q, c => near(radVal(c), v, 1e-9 * Math.max(1, v))); }

/** report-precision: { places, text, value } from the prompt's stated measurement precisions */
function report(q) {
  const t = plain(q.prompt);
  const m = t.match(/(\d+(?:\.\d+)?) (sin|cos|tan) (\d+(?:\.\d+)?)°/);
  if (!m) return null;
  const precs = [...t.matchAll(/\(to the nearest (tenth|hundredth|foot|degree|inch|meter)[^)]*\)/g)].map(k => ({ tenth: 1, hundredth: 2 }[k[1]] ?? 0));
  if (!precs.length) return null;
  const places = Math.min(...precs), value = Number(m[1]) * fnDeg(m[2], Number(m[3]));
  return { places, value, text: round(value, places).toFixed(places) };
}

function solve(q) {
  const f = SOLVE[q.family];
  return f ? f(q) : undefined;
}

// =====================================================================================================================
// sane
const ROUNDED_NEAR_TIE = 0.04;
function tieNear(v, p) {
  if (!Number.isFinite(v) || p === null || p === undefined) return false;
  const x = Math.abs(v) * 10 ** p, fr = x - Math.floor(x);
  return Math.abs(fr - 0.5) < ROUNDED_NEAR_TIE;
}
/** the full-precision value behind a rounded num answer */
function fullValue(q) {
  if (q.input !== 'num' && q.input !== 'pair') return NaN;
  const keep = round;
  try {
    // re-run the solver with rounding switched off
    const P = placesOf; // eslint-disable-line no-unused-vars
    const t = { ...q, prompt: String(q.prompt).replace(/to the nearest (tenth|hundredth|foot|degree|square inch|square foot)( of an? \w+( \w+)?)?|rounded to four decimal places|to four decimal places|\(nearest tenth\)|Give x to the nearest tenth\.|to the nearest tenth/g, '') };
    const v = solve(t);
    return Array.isArray(v) ? v[1] : typeof v === 'number' ? v : NaN;
  } finally { void keep; }
}

function figIssues(q) {
  const f = figOf(q);
  if (!f) return '';
  const P = ptsOf(f);
  for (const a of f.angles ?? []) {
    if (!/^[A-Z0-9]{3}$/.test(a.id)) continue;
    const drawn = angAt(a.v, a.p, a.q);
    if (a.box && Math.abs(drawn - 90) > 0.5) return `the right-angle box at ${a.id[1]} is drawn at ${drawn.toFixed(1)}°`;
    const v = num(a.text);
    if (!a.box && a.text && /^\d/.test(a.text) && Math.abs(drawn - v) > 0.6) return `∠${a.id} is labelled ${a.text} but drawn at ${drawn.toFixed(1)}°`;
  }
  // numeric side labels: one scale for the whole figure
  const L = (f.segs ?? []).filter(s => s.text && Number.isFinite(labVal(s.text))).map(s => ({ id: s.id, k: dist(s.a, s.b) / labVal(s.text) }));
  if (L.length >= 2) { const k0 = L[0].k; for (const l of L) if (Math.abs(l.k / k0 - 1) > 0.03) return `side ${l.id} is not drawn to the same scale as ${L[0].id}`; }
  // a right triangle with three numeric sides obeys Pythagoras
  for (const t of trisOf(f)) {
    const lab = [t.R + t.A, t.R + t.B, t.A + t.B].map(n => segOf(f, n[0], n[1])?.text).map(s => labVal(s));
    if (lab.every(Number.isFinite) && !near(lab[0] ** 2 + lab[1] ** 2, lab[2] ** 2, 1e-6 * lab[2] ** 2)) return `triangle ${t.set}: ${lab.join(', ')} is not a right triangle`;
  }
  void P;
  return '';
}

function storyIssues(q) {
  const t = plain(q.prompt), fam = q.family;
  const angs = [...t.matchAll(/(\d+(?:\.\d+)?)°/g)].map(m => Number(m[1]));
  if (/ladder/.test(t) && /ground/.test(t)) for (const a of angs) if (a < 60 || a > 80) return `a ladder at ${a}° to the ground`;
  if (/sun is (\d+(?:\.\d+)?)° above/.test(t)) { const a = Number(t.match(/sun is (\d+(?:\.\d+)?)° above/)[1]); if (a < 10 || a > 80) return `the sun at ${a}°`; }
  if (fam === 'kite') { const a = angs[0]; if (a < 15 || a > 80) return `a kite string at ${a}°`; }
  if (/ramp/.test(t) && fam === 'adaRamp') {
    const m = t.match(/rise (\d+(?:\.\d+)?) ft at an angle of (\d+(?:\.\d+)?)°/) ?? null, k = t.match(/rises (\d+(?:\.\d+)?) ft over a horizontal run of (\d+(?:\.\d+)?) ft/);
    if (m && Number(m[2]) > Math.atan(1 / 12) / D + 1e-9) return `a wheelchair ramp at ${m[2]}° is steeper than 1 : 12`;
    if (k && Number(k[1]) / Number(k[2]) > 1 / 12 + 1e-12) return `a wheelchair ramp ${k[1]} : ${k[2]} is steeper than 1 : 12`;
  }
  if (fam === 'modeDiag') { // the reported angle is the mistake; the real angle must be realistic
    const k = t.match(/(sin|cos|tan)⁻¹\((\d+)\/(\d+)\)/);
    const st = t.match(/rises (\d+(?:\.\d+)?) (ft|in) for every (\d+(?:\.\d+)?) (ft|in) (along its surface|of run)/);
    if (k && st) { // the inverse key matches the story: along the surface → sin, per run → tan, same rise / length
      const want = st[5] === 'of run' ? 'tan' : 'sin';
      if (k[1] !== want || !near(Number(k[2]) / Number(k[3]), Number(st[1]) / Number(st[3]), 1e-12)) return `the story (rises ${st[1]} ${st[2]} for every ${st[3]} ${st[2]} ${st[5]}) does not match ${k[1]}⁻¹(${k[2]}/${k[3]})`;
    }
    if (k) { const a ={ sin: Math.asin, cos: Math.acos, tan: Math.atan }[k[1]](Number(k[2]) / Number(k[3])) / D; if (/roof/.test(t) && (a < 5 || a > 60)) return `a roof at ${a.toFixed(1)}°`; if (/ramp/.test(t) && a > 15) return `a ramp at ${a.toFixed(1)}°`; }
  } else if (/roof|rafter/.test(t)) for (const a of angs) if (a < 5 || a > 60) return `a roof at ${a}°`;
  if (/stop sign/.test(t)) { const w = num(t.match(/octagon (\d+(?:\.\d+)?) in across/)?.[1]); if (![30, 36, 48].includes(w)) return `a ${w} in stop sign`; }
  return '';
}

function textIssues(q) {
  const all = [q.prompt, ...(q.choices ?? []), ...((q.data?.picture?.card?.lines) ?? [])].map(plain).join(' | ');
  // "an" before a number read with a vowel sound: 8, 11, 18, 80-89, 800-899 (not 110 "a hundred ten", 118)
  const m = all.match(/\b[Aa] ((?:8\d{0,2}|11|18)(?:\.\d+)?)(?![\d,])/);
  if (m) return `"a ${m[1]}" should be "an ${m[1]}"`;
  const an = all.match(/\b[Aa]n (\d+(?:\.\d+)?)(?![\d,])/);
  if (an && !/^(8\d{0,2}|11|18)(\.\d+)?$/.test(an[1])) return `"an ${an[1]}" should be "a ${an[1]}"`;
  const vw = all.match(/\b[Aa]n (?![aeiouAEIOU])([a-z]+)/);
  if (vw && !/^(hour|honest)/.test(vw[1])) return `"an ${vw[1]}" should be "a ${vw[1]}"`;
  const v = all.match(/\b[Aa] (equilateral|isosceles|octagon|octagonal|apothem|angle|acute|obtuse|inch|eight|eleven)\b/);
  if (v) return `"a ${v[1]}" should be "an ${v[1]}"`;
  if (/\.\./.test(all.replace(/…/g, ''))) return 'double period';
  if (/\b1 (feet|inches|degrees|meters|centimeters|units)\b/.test(all)) return 'plural after 1';
  if (/\(a length in in\)/.test(all)) return '"a length in in"';
  if (/top of an? [\d.]+ ft drone/.test(all)) return '"the top of a 110 ft drone": a drone hovering 110 ft up is not 110 ft tall';
  return '';
}

function sane(q) {
  const fam = q.family;
  const fi = figIssues(q); if (fi) return fi;
  const st = storyIssues(q); if (st) return st;
  const tx = textIssues(q); if (tx) return tx;
  // rounded answers: not near a .x5 tie
  const p = placesOf(q.prompt);
  if (p !== null && (q.input === 'num' || q.input === 'pair') && !['precision', 'precisionCritique'].includes(fam)) {
    const v = fullValue(q);
    if (tieNear(v, p)) return `${v} is within ${ROUNDED_NEAR_TIE} of a rounding tie at ${p} places`;
  }
  if (fam === 'precision' || fam === 'precisionCritique') {
    const r = report(q);
    if (r && tieNear(r.value, r.places)) return `${r.value} is near a rounding tie`;
    const shown = plain(q.prompt).match(/calculator shows (\d+(?:\.\d+)?)…/);
    if (shown && r) { const dp = shown[1].split('.')[1].length; if (Math.floor(r.value * 10 ** dp + 1e-9) / 10 ** dp !== Number(shown[1]) && round(r.value, dp) !== Number(shown[1])) return `the calculator display ${shown[1]}… is not ${r.value}`; }
    const tm = plain(q.prompt).match(/as (\d+(?:\.\d+)?) ft \(to the nearest (tenth|foot)/);
    if (tm && tm[2] === 'tenth' && !tm[1].includes('.')) return `"${tm[1]} ft (to the nearest tenth of a foot)" should be written ${tm[1]}.0`;
    const ta = plain(q.prompt).match(/at (\d+(?:\.\d+)?)° to the ground \(to the nearest tenth/) ?? plain(q.prompt).match(/angle as (\d+(?:\.\d+)?)° \(to the nearest tenth/);
    if (ta && !ta[1].includes('.')) return `"${ta[1]}° (to the nearest tenth of a degree)" should be written ${ta[1]}.0°`;
  }
  // exact answers: the right choice is in simplest form
  if (['specialDerive', 'specialFwd', 'specialRev', 'exactVal', 'exactSolve'].includes(fam)) {
    const i = solve(q);
    if (typeof i === 'number' && i >= 0) { const why = radForm(q.choices[i]); if (why) return `the right choice ${plain(q.choices[i])}: ${why}`; }
  }
  // the board equation agrees with the drawing
  if (['sideNum', 'sideDen', 'invCalc', 'ladder', 'kite', 'shadowTrig', 'depression', 'apothem', 'adaRamp'].includes(fam)) {
    const e = eqOf(q.board), v = fullValue(q);
    if (e && Number.isFinite(v)) { const b = solveEq(e); if (Number.isFinite(b) && Math.abs(b - v) > 1e-6 * Math.max(1, v)) return `the board ${plain(q.board)} gives ${b.toFixed(3)}, the question ${v.toFixed(3)}`; }
  }
  // stories: the drawn angle matches the stated angle
  // cards with values: check them
  const lines = q.data?.picture?.card?.lines ?? [];
  for (const l of lines) {
    const k = plain(l).match(/^(sin|cos|tan) (\d+(?:\.\d+)?)° ≈ (\d+(?:\.\d+)?)$/);
    if (k) { const dp = k[3].split('.')[1]?.length ?? 0; if (round(fnDeg(k[1], Number(k[2])), dp) !== Number(k[3])) return `card: ${plain(l)} is wrong`; }
  }
  {
    const k = plain(q.prompt).match(/Use the values: (sin|cos|tan) (\d+(?:\.\d+)?)° ≈ (\d+(?:\.\d+)?) and (?:sin|cos|tan) (\d+(?:\.\d+)?)° ≈ (\d+(?:\.\d+)?)/);
    if (k) for (const [a, v] of [[k[2], k[3]], [k[4], k[5]]]) if (round(fnDeg(k[1], Number(a)), 4) !== Number(v)) return `${k[1]} ${a}° ≈ ${v} is wrong`;
  }
  if (fam === 'scaleRatio') { const k = plain(q.prompt).match(/is (\d+(?:\.\d+)?) times/); if (k && /\.\d{2}$/.test(k[1]) && !/\.(25|75|5)0?$/.test(k[1])) return `scale factor "${k[1]} times" is a rounded value`; }
  if (fam === 'roundCompare') {
    const m = plain(q.prompt).match(/Find (\d+(?:\.\d+)?) (sin|cos|tan) (\d+(?:\.\d+)?)° .* rounds (?:sin|cos|tan) \d+(?:\.\d+)?° to (\d+(?:\.\d+)?) first and gets (\d+(?:\.\d+)?)\./);
    if (m) { const r = round(fnDeg(m[2], Number(m[3])), 2); if (r !== Number(m[4])) return `${m[2]} ${m[3]}° rounds to ${r}, not ${m[4]}`; if (round(Number(m[1]) * r, 1) !== Number(m[5])) return `${m[1]} × ${r} is not ${m[5]}`; }
  }
  if (fam === 'auditAngle' || fam === 'auditSetup' || fam === 'auditFix') {
    // the student's arithmetic matches their own equation (the setup is the only mistake)
    const w = eqOf(lines.join(' ')), xr = lines.find(l => /^x ≈/.test(plain(l)));
    const so = plain(lines.join(' ')).match(/so x = (\d+(?:\.\d+)?) (sin|cos|tan) (\d+(?:\.\d+)?)°/);
    if (w && xr && w.ang !== 'x') {
      const x = num(plain(xr).replace(/^x ≈/, '')), v = so ? Number(so[1]) * fnDeg(so[2], Number(so[3])) : solveEq(w);
      if (Number.isFinite(v) && round(v, 1) !== x && fam !== 'auditAngle') return `the card's x ≈ ${x} does not follow from its own work (${v.toFixed(3)})`;
    }
  }
  return '';
}

export default { solve, sane };
