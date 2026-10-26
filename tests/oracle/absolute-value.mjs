// Oracle for the lesson "absolute-value" (Algebra 1, secondary-t7-13: absolute value functions, equations and
// inequalities: evaluating bars, |x − a| as a distance, the two-piece definition, graphs y = a|mx + b| + k, solving
// |u| = c by splitting / isolating / on the graph, case conditions and completeness, distance and tolerance models,
// |u| < c and |u| > c, special targets, variable right sides, identities in a case, two absolute values).
// Written from what the student sees only (docs/lessons/QUALITY_LAYER.md, "O: the oracle"): the prompt, the board (TeX,
// read with texPlain), the choices and the drawn graphs (`data.picture.g` / `data.picture.opts`: pieces with fn
// {m, b} over lo..hi, points). Everything is worked out with one small engine: an expression reader that knows the
// bars (|u|), and a relation solver for piecewise-linear sides (the kinks are where an inside is 0; between kinks each
// side is linear, so every root is found and every interval tested). A set (an equation, an inequality, a choice such
// as "x ≤ −8 or x ≥ 4", "Only x = 3", "All real numbers except x = 5") is a membership test plus its critical numbers,
// and two sets are compared at every critical number, just beside it and between neighbours. Choice questions return
// the one choice that is true by the maths, -1 when not exactly one is.
// Students are 14-18: `sane` flags worlds that are impossible (a negative speed, a mile marker below 0), pair items
// that do not have exactly two answers, and context items with two or no answers in the allowed range.
import { texPlain, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- numbers and text
const norm = s => String(s ?? '').replace(/[−–]/g, '-').replace(/ /g, ' ');
const EPS = 1e-7;
const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const clean = v => (Number.isFinite(v) ? Math.round(v * 1e9) / 1e9 + 0 : v);
const uniq = arr => arr.reduce((o, v) => (o.some(w => near(w, v)) ? o : [...o, v]), []);
// relations are turned into symbols first (texPlain leaves "le" / "ge" behind)
const plain = t => norm(texPlain(String(t ?? '').replace(/\\leq?(?![a-zA-Z])/g, ' ≤ ').replace(/\\geq?(?![a-zA-Z])/g, ' ≥ ')
  .replace(/\\neq?(?![a-zA-Z])/g, ' ≠ ').replace(/\\lt(?![a-zA-Z])/g, ' < ').replace(/\\gt(?![a-zA-Z])/g, ' > '))).replace(/\s+/g, ' ').trim();
const NUM = '-?\\d+(?:\\.\\d+)?(?:/\\d+(?:\\.\\d+)?)?';
const numOf = s => { const t = norm(s).trim().replace(/[$,]/g, ''); const m = t.match(/^(-?)(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/); return m ? (m[1] ? -1 : 1) * Number(m[2]) / Number(m[3]) : Number(t); };

// ---------------------------------------------------------------- expressions with bars, one variable (any letter)
function compile(src) {
  const s = norm(src).replace(/[×·]/g, '*').replace(/\s+/g, '');
  let i = 0, depth = 0;
  const inners = [];
  const fail = () => { throw new Error(`cannot read "${src}"`); };
  function expr() {
    let a = term();
    for (;;) {
      if (s[i] === '+') { i++; const l = a, r = term(); a = x => l(x) + r(x); }
      else if (s[i] === '-') { i++; const l = a, r = term(); a = x => l(x) - r(x); }
      else return a;
    }
  }
  function term() {
    let a = unary();
    for (;;) {
      const c = s[i];
      if (c === '*') { i++; const l = a, r = unary(); a = x => l(x) * r(x); }
      else if (c === '/') { i++; const l = a, r = unary(); a = x => l(x) / r(x); }
      else if (c !== undefined && (/[0-9.a-zA-Z(]/.test(c) || (c === '|' && depth === 0))) { const l = a, r = power(); a = x => l(x) * r(x); }
      else return a;
    }
  }
  function unary() {
    if (s[i] === '-') { i++; const r = unary(); return x => -r(x); }
    if (s[i] === '+') { i++; return unary(); }
    return power();
  }
  function power() {
    const b = atom();
    if (s[i] === '^') { i++; const e = unary(); return x => b(x) ** e(x); }
    return b;
  }
  function atom() {
    const c = s[i];
    const m = s.slice(i).match(/^\d+(?:\.\d+)?|^\.\d+/);
    if (m) { i += m[0].length; const v = Number(m[0]); return () => v; }
    if (c !== undefined && /[a-zA-Z]/.test(c)) { i++; return x => x; }
    if (c === '(') { i++; const e = expr(); if (s[i] !== ')') fail(); i++; return e; }
    if (c === '|') { i++; depth++; const e = expr(); depth--; if (s[i] !== '|') fail(); i++; inners.push(e); return x => Math.abs(e(x)); }
    return fail();
  }
  const f = expr();
  if (i !== s.length || !s.length) fail();
  return { f, inners };
}
/** where a linear inside is 0 */
const zeroOf = e => { const b = e(0), m = e(1) - b; return Math.abs(m) < 1e-12 ? NaN : -b / m; };
const fnOf = src => compile(src).f;
const kinksOf = src => compile(src).inners.map(zeroOf).filter(Number.isFinite);

/** every root of a piecewise-linear h with kinks ks (identity stretches are not roots: membership tests find them) */
function rootsOf(h, ks) {
  const B = [-1e6, ...uniq(ks).sort((a, b) => a - b), 1e6], out = [];
  for (let j = 0; j + 1 < B.length; j++) {
    const a = B[j], b = B[j + 1];
    if (b - a < 1e-12) continue;
    const p = a + (b - a) / 3, q = a + 2 * (b - a) / 3, s = (h(q) - h(p)) / (q - p);
    if (Math.abs(s) < 1e-12) continue;
    let r = p - h(p) / s; r -= h(r) / s;
    if (r >= a - 1e-7 && r <= b + 1e-7 && Math.abs(h(r)) < 1e-6) out.push(r);
  }
  return uniq(out);
}
const CMP = {
  '=': v => Math.abs(v) <= EPS, '≠': v => Math.abs(v) > EPS,
  '≤': v => v <= EPS, '<': v => v < -EPS, '≥': v => v >= -EPS, '>': v => v > EPS,
};
/** a relation L op R as a set */
function relSet(L, op, R) {
  const A = compile(L), Bc = compile(R), h = x => A.f(x) - Bc.f(x);
  const ks = [...A.inners, ...Bc.inners].map(zeroOf).filter(Number.isFinite);
  const t = CMP[op];
  if (!t) throw new Error(`unknown relation ${op}`);
  return { test: x => t(h(x)), crit: uniq([...ks, ...rootsOf(h, ks)]), h, L, R, op, A, B: Bc };
}
const ALL = { test: () => true, crit: [] }, NONE = { test: () => false, crit: [] };
const union = ss => ({ test: x => ss.some(s => s.test(x)), crit: ss.flatMap(s => s.crit) });
const inter = ss => ({ test: x => ss.every(s => s.test(x)), crit: ss.flatMap(s => s.crit) });
const REL = /\s*(≤|≥|<|>|=|≠)\s*/;
/** a chain "a op b op c" (each side an expression) */
function chainSet(t) {
  const parts = norm(t).trim().split(REL);
  if (parts.length < 3 || parts.length % 2 === 0) throw new Error(`not a relation: "${t}"`);
  const rels = [];
  for (let j = 0; j + 2 < parts.length; j += 2) rels.push(relSet(parts[j], parts[j + 1], parts[j + 2]));
  return rels.length === 1 ? rels[0] : inter(rels);
}
/** a solution set as the student reads it */
function parseSet(text) {
  let t = norm(text).trim().replace(/\.$/, '').trim();
  let m;
  if (/^(no solution|none|no solutions)$/i.test(t)) return NONE;
  if (/^all real numbers$/i.test(t)) return ALL;
  if ((m = t.match(/^all real numbers except [a-z] = (.+)$/i))) { const v = numOf(m[1]); return { test: x => !near(x, v), crit: [v] }; }
  if ((m = t.match(/^only [a-z] = (.+)$/i))) { const v = numOf(m[1]); return { test: x => near(x, v), crit: [v] }; }
  t = t.replace(/\s+only$/i, '');
  return union(t.split(/\s+or\s+/).map(p => inter(p.split(/\s+and\s+/).map(chainSet))));
}
/** the probes that decide whether two sets are equal */
function probes(...sets) {
  const c = uniq(sets.flatMap(s => s.crit).filter(Number.isFinite)).sort((a, b) => a - b);
  const out = [-1e5, 1e5, 0];
  c.forEach((v, j) => { out.push(v, v - 1e-5, v + 1e-5); if (j + 1 < c.length) out.push((v + c[j + 1]) / 2); });
  if (c.length) out.push(c[0] - 7.3, c[c.length - 1] + 7.3);
  return out;
}
const sameSet = (A, B) => probes(A, B).every(x => A.test(x) === B.test(x));
/** the points of a set, or infinite when it holds an interval */
function pointsOf(S) {
  const c = uniq(S.crit.filter(Number.isFinite)).sort((a, b) => a - b);
  const mids = [-1e5, 1e5, ...(c.length ? [c[0] - 3.7, c[c.length - 1] + 3.7] : [0, 1.3])];
  c.forEach((v, j) => { mids.push(v - 1e-5, v + 1e-5); if (j + 1 < c.length) mids.push((v + c[j + 1]) / 2); });
  if (mids.some(x => S.test(x))) return { infinite: true, pts: [] };
  return { infinite: false, pts: c.filter(x => S.test(x)) };
}
const countOf = S => { const p = pointsOf(S); return p.infinite ? Infinity : p.pts.length; };
const pickSet = (q, S) => choiceWhere(q, c => { try { return sameSet(parseSet(c), S); } catch { return false; } });

// ---------------------------------------------------------------- reading the board
const boardPlain = q => plain(q.board);
/** "y = ..." / "d(t) = ..." → the right side */
const rhsOfDef = t => norm(t).replace(/^\s*(?:y|[a-z]\([a-z]\))\s*=\s*/i, '').trim();
const boardFn = q => rhsOfDef(boardPlain(q).split(',')[0]);
const boardSet = q => chainSet(boardPlain(q).split(',')[0]);
const sortedPts = S => pointsOf(S).pts.slice().sort((a, b) => a - b);
const slopeAt = (f, x) => clean((f(x + 1e-4) - f(x - 1e-4)) / 2e-4);
const vertexOf = src => { const f = fnOf(src), h = kinksOf(src)[0]; return { h, k: clean(f(h)), f, up: f(h + 1) > f(h) }; };

// ---------------------------------------------------------------- graphs
/** does a drawn plane show exactly the function f over its window? */
function graphIs(g, f) {
  const lo = g.x.min, hi = g.x.max;
  const pieces = (g.parts ?? []).filter(p => p.kind === 'piece');
  for (const p of pieces) {
    const a = Math.max(lo, p.lo ?? -Infinity), b = Math.min(hi, p.hi ?? Infinity);
    for (let j = 0; j <= 8; j++) { const x = a + (b - a) * j / 8; if (!near(p.fn.m * x + p.fn.b, f(x))) return false; }
  }
  for (const p of (g.parts ?? []).filter(p => p.kind === 'point')) if (!near(p.y, f(p.x))) return false;
  for (let j = 0; j <= 40; j++) {
    const x = lo + (hi - lo) * j / 40;
    if (!pieces.some(p => x >= (p.lo ?? -Infinity) - 1e-9 && x <= (p.hi ?? Infinity) + 1e-9)) return false;
  }
  return pieces.length > 0;
}
const graphIndex = (opts, f) => { const hits = opts.map((g, i) => (graphIs(g, f) ? i : -1)).filter(i => i >= 0); return hits.length === 1 ? hits[0] : -1; };
const sameFn = (f, g) => [-9.3, -5, -2.5, -1, 0, 0.7, 1, 2.5, 4, 6.1, 11].every(x => near(f(x), g(x)));

// ---------------------------------------------------------------- statements
/** a statement about the V on the board: true / false / null when unknown */
function featureTrue(c, src) {
  const t = norm(c).trim().replace(/\.$/, ''), f = fnOf(src), V = vertexOf(src);
  let m;
  const inc = (a, b) => { for (let j = 0; j < 12; j++) { const x = a + (b - a) * j / 12, y = a + (b - a) * (j + 1) / 12; if (!(f(y) > f(x))) return false; } return true; };
  const dec = (a, b) => { for (let j = 0; j < 12; j++) { const x = a + (b - a) * j / 12, y = a + (b - a) * (j + 1) / 12; if (!(f(y) < f(x))) return false; } return true; };
  if ((m = t.match(new RegExp(`^It decreases for x < (${NUM}) and increases for x > (${NUM})$`)))) return dec(numOf(m[1]) - 50, numOf(m[1])) && inc(numOf(m[2]), numOf(m[2]) + 50);
  if ((m = t.match(new RegExp(`^It increases for x < (${NUM})$`)))) return inc(numOf(m[1]) - 50, numOf(m[1]));
  if ((m = t.match(new RegExp(`^It decreases for x < (${NUM})$`)))) return dec(numOf(m[1]) - 50, numOf(m[1]));
  if ((m = t.match(new RegExp(`^It increases for x > (${NUM})$`)))) return inc(numOf(m[1]), numOf(m[1]) + 50);
  if ((m = t.match(new RegExp(`^It decreases for x > (${NUM})$`)))) return dec(numOf(m[1]), numOf(m[1]) + 50);
  if ((m = t.match(/^The range is (.+)$/))) { const R = { test: y => (V.up ? y >= V.k - EPS : y <= V.k + EPS), crit: [V.k] }; return sameSet(parseSet(m[1]), R); }
  if ((m = t.match(/^The domain is (.+)$/))) return sameSet(parseSet(m[1]), ALL);
  if ((m = t.match(new RegExp(`^The axis of symmetry is x = (${NUM})$`)))) { const a = numOf(m[1]); return [0.5, 1, 2, 3.5, 7].every(d => near(f(a + d), f(a - d))); }
  if ((m = t.match(new RegExp(`^\\((${NUM}), (${NUM})\\) is on the graph$`)))) return near(f(numOf(m[1])), numOf(m[2]));
  if ((m = t.match(new RegExp(`^The vertex is \\((${NUM}), (${NUM})\\)$`)))) return near(V.h, numOf(m[1])) && near(V.k, numOf(m[2]));
  if (/rounded U/.test(t)) return false;   // two straight pieces meet in a sharp corner
  if ((m = t.match(new RegExp(`^The (left|right) piece has slope (${NUM})$`)))) return near(slopeAt(f, V.h + (m[1] === 'left' ? -1 : 1)), numOf(m[2]));
  return null;
}

// ---------------------------------------------------------------- equivalence after isolating
/** is "|u| op' c" what you get from the original relation by +/− and one multiplication (op flipped for a negative factor)? */
function isolatedRight(choice, orig) {
  const t = norm(choice).trim().replace(/\.$/, '');
  const m = t.match(/^(\|[^|]+\|)\s*(≤|≥|<|>|=)\s*(\S+)(,\s*so no solution)?$/);
  if (!m) return false;
  const C = relSet(m[1], m[2], m[3]);
  const xs = [-7.3, -3.1, -1, 0.4, 2.2, 5.9, 9.7];
  const x0 = xs.find(x => Math.abs(C.h(x)) > 1e-6);
  if (x0 === undefined) return false;
  const k = orig.h(x0) / C.h(x0);
  if (!xs.every(x => near(orig.h(x), k * C.h(x))) || Math.abs(k) < 1e-12) return false;
  const FLIP = { '<': '>', '>': '<', '≤': '≥', '≥': '≤', '=': '=' };
  if ((k > 0 ? orig.op : FLIP[orig.op]) !== m[2]) return false;
  if (m[4] && countOf(orig) !== 0) return false;
  return true;
}

// ---------------------------------------------------------------- the families
const pairOfPts = (S) => { const p = sortedPts(S); return p.length === 2 ? p : p.length === 1 ? [p[0], p[0]] : undefined; };
function ends(S) {
  const r = rootsOf(S.h, S.crit).sort((a, b) => a - b);
  return r.length === 2 ? r : undefined;
}
const promptNum = (q, re) => { const m = norm(q.prompt).match(re); return m ? numOf(m[1]) : NaN; };

const SOLVE = {
  evalAbs: q => evalBoard(q),
  outsideMinus: q => evalBoard(q),
  distSolve: q => pairOfPts(boardSet(q)),
  distMeaning: q => {
    const S = boardSet(q);
    return choiceWhere(q, c => {
      const m = norm(c).match(new RegExp(`^x is (${NUM}) units? from (${NUM})$`));
      if (!m) return false;
      const d = numOf(m[1]), p = numOf(m[2]);
      return sameSet({ test: x => near(x, p - d) || near(x, p + d), crit: [p - d, p + d] }, S);
    });
  },
  pieceEval: q => {
    const v = promptNum(q, new RegExp(`gives \\|(${NUM})\\|`));
    return choiceWhere(q, c => {
      const t = norm(c);
      if (/^both/i.test(t)) return false;
      const first = /first piece/.test(t), second = /second piece/.test(t);
      if (first === second) return false;
      if (first !== (v >= 0)) return false;
      const since = t.match(/since (.+?):/);
      if (since) { try { if (!chainSet(since[1]).test(0)) return false; } catch { return false; } }
      const vals = t.split('=').slice(1);
      const last = vals[vals.length - 1];
      return last !== undefined && vals.every(e => near(fnOf(e)(0), Math.abs(v)));
    });
  },
  oppositeValue: q => -promptNum(q, new RegExp(`Take x = (${NUM})\\.`)),
  breakX: q => kinksOf(boardFn(q))[0],
  hShiftVertex: q => kinksOf(boardFn(q))[0],
  affineVertex: q => kinksOf(boardFn(q))[0],
  pieceForm: q => piecesPick(q),
  affineForm: q => piecesPick(q),
  parentSlope: q => {
    const m = norm(q.prompt).match(new RegExp(`through \\((${NUM}), (${NUM})\\)`));
    const f = fnOf(boardFn(q)), x = numOf(m[1]);
    if (!near(f(x), numOf(m[2])) || near(x, kinksOf(boardFn(q))[0])) return undefined;
    return slopeAt(f, x);
  },
  parentFeature: q => featurePick(q),
  hShiftPick: q => graphIndex(q.data.picture.opts, fnOf(boardFn(q))),
  negPick: q => graphIndex(q.data.picture.opts, fnOf(boardFn(q))),
  vertexHK: q => { const V = vertexOf(boardFn(q)); return [V.h, V.k]; },
  rangeK: q => { const V = vertexOf(boardFn(q)); return pickSet(q, { test: y => (V.up ? y >= V.k - EPS : y <= V.k + EPS), crit: [V.k] }); },
  branchSlope: q => sideSlope(q),
  affineSlope: q => sideSlope(q),
  stretchPoint: q => {
    const [def, at] = boardPlain(q).split(',');
    return clean(fnOf(rhsOfDef(def))(numOf(at.split('=')[1])));
  },
  sameGraph: q => {
    const f = fnOf(boardFn(q));
    return choiceWhere(q, c => sameFn(fnOf(rhsOfDef(c)), f));
  },
  affineCond: q => pickSet(q, boardSet(q)),
  splitSolve: q => pairOfPts(boardSet(q)),
  splitPick: q => pickSet(q, boardSet(q)),
  howManySol: q => count(q),
  whichOne: q => {
    const want = /exactly two/.test(q.prompt) ? 2 : /exactly one/.test(q.prompt) ? 1 : /no solution/.test(q.prompt) ? 0 : NaN;
    return choiceWhere(q, c => countOf(parseSet(c)) === want);
  },
  isolateSolve: q => pairOfPts(boardSet(q)),
  isolateLine: q => { const S = boardSet(q); return choiceWhere(q, c => isolatedRight(c, S)); },
  isolateCount: q => count(q),
  graphCount: q => count(q),
  graphSolve: q => pairOfPts(boardSet(q)),
  keepReject: q => {
    const m = norm(q.prompt).match(new RegExp(`the case (.+?) gives [a-z] = (${NUM})\\.`));
    const cond = chainSet(m[1]), v = numOf(m[2]), S = boardSet(q);
    const keep = cond.test(v);
    if (keep && !S.test(v)) return -1;
    return choiceWhere(q, c => (keep ? /^Keep it: it meets its own case condition/.test(c) : /^Reject it: it fails its own case condition/.test(c)));
  },
  branchCount: q => count(q),
  checkVsCases: q => {
    const v = promptNum(q, new RegExp(`finds x = (${NUM}) and`)), P = sortedPts(boardSet(q));
    if (!P.some(p => near(p, v))) return -1;
    return choiceWhere(q, c => {
      const t = norm(c);
      let m;
      if ((m = t.match(new RegExp(`^No: the other case gives x = (${NUM}), and it works too`)))) return !near(numOf(m[1]), v) && P.some(p => near(p, numOf(m[1])));
      if (/^Yes: x = .* checks, so it is the solution/.test(t)) return P.length === 1;
      if (/one solution for each target/.test(t)) return false;   // a general claim that is false (|u| = c > 0 has two)
      throw new Error(`unknown claim "${c}"`);
    });
  },
  completeWhy: q => choiceWhere(q, c => {
    if (/exactly one case/.test(c) && /equivalent to one linear equation/.test(c)) return true;
    if (/^Both answers check/.test(c) || /always has two solutions/.test(c)) return false;   // a check proves a root, not completeness; the count is not always two
    throw new Error(`unknown reason "${c}"`);
  }),
  modelEq: q => {
    const m = boardPlain(q).match(new RegExp(`target (${NUM}), exactly (${NUM}) away`));
    const t = numOf(m[1]), e = numOf(m[2]);
    return pickSet(q, { test: x => near(x, t - e) || near(x, t + e), crit: [t - e, t + e] });
  },
  exactlyAway: q => pairOfPts(boardSet(q)),
  domainReject: q => { const p = domainPts(q); return p.length === 1 ? p[0] : undefined; },
  rideRead: q => {
    const R = ride(q), p = norm(q.prompt);
    let m;
    if (/when she starts\?/.test(p)) return clean(R.f(R.lo));
    if (/At what time is she at the marker\?/.test(p)) { const r = rootsOf(R.f, R.ks).filter(t => t >= R.lo - EPS && t <= R.hi + EPS); return r.length === 1 ? r[0] : undefined; }
    if ((m = p.match(new RegExp(`(After passing|Before reaching) the marker, when is she (${NUM}) miles from it\\?`)))) {
      const D = numOf(m[2]), h = R.ks[0];
      const r = rootsOf(t => R.f(t) - D, R.ks).filter(t => (m[1] === 'After passing' ? t > h : t < h));
      return r.length === 1 ? r[0] : undefined;
    }
    throw new Error('unknown ride question');
  },
  rateUnits: q => {
    const R = ride(q), side = /The left piece/.test(q.prompt) ? 'left' : 'right';
    const s = slopeAt(R.f, R.ks[0] + (side === 'left' ? -0.25 : 0.25));
    return choiceWhere(q, c => {
      const t = norm(c);
      let m;
      if ((m = t.match(new RegExp(`distance (?:to|from) the marker shrinks by (${NUM}) miles each hour`)))) return near(-numOf(m[1]), s);
      if ((m = t.match(new RegExp(`distance (?:to|from) the marker grows by (${NUM}) miles each hour`)))) return near(numOf(m[1]), s);
      if (/^She is .* miles from the marker/.test(t) || /^Her distance from the marker is/.test(t)) return false;   // a slope is a rate, not a distance
      if (/mph faster after the marker/.test(t)) return false;   // her speed is the same on both pieces
      throw new Error(`unknown meaning "${c}"`);
    });
  },
  rideDomain: q => {
    const R = ride(q);
    if (/domain/.test(q.prompt)) return pickSet(q, { test: t => t >= R.lo - EPS && t <= R.hi + EPS, crit: [R.lo, R.hi] });
    const ys = [R.lo, R.hi, ...R.ks.filter(k => k > R.lo && k < R.hi)].map(R.f);
    const a = clean(Math.min(...ys)), b = clean(Math.max(...ys));
    return pickSet(q, { test: d => d >= a - EPS && d <= b + EPS, crit: [a, b] });
  },
  andSolve: q => ends(boardSet(q)),
  andPick: q => pickSet(q, boardSet(q)),
  orSolve: q => ends(boardSet(q)),
  orPick: q => pickSet(q, boardSet(q)),
  isoForm: q => { const S = boardSet(q); return choiceWhere(q, c => isolatedRight(c, S)); },
  isoSolve: q => pickSet(q, boardSet(q)),
  specialSet: q => pickSet(q, boardSet(q)),
  specialIsolate: q => pickSet(q, boardSet(q)),
  toleranceModel: q => { const S = toleranceSet(q); return S ? pickSet(q, S) : undefined; },
  toleranceEnds: q => ends(boardSet(q)),
  toleranceReverse: q => {
    const S = boardSet(q), m = norm(boardPlain(q)).match(new RegExp(`^(${NUM}) ≤ [a-z] ≤ (${NUM})$`));
    if (!m) return undefined;
    const a = numOf(m[1]), b = numOf(m[2]);
    void S;
    return [clean((a + b) / 2), clean((b - a) / 2)];
  },
  varRhsSolve: q => pickSet(q, boardSet(q)),
  varRhsBranch: q => {
    const [L, R] = boardPlain(q).split(/\s*=\s*/);
    const u = compile(L).inners[0];
    const cm = norm(q.prompt).match(/the case (.+) (<|≥) 0\?/);
    if (!cm || !sameFn(fnOf(cm[1]), u)) return -1;
    const neg = cm[2] === '<';
    const wantL = neg ? x => -u(x) : u, wantR = fnOf(R);
    return choiceWhere(q, c => {
      const [cl, cr] = norm(c).split(/\s*=\s*/);
      return sameFn(fnOf(cl), wantL) && sameFn(fnOf(cr), wantR);
    });
  },
  identitySet: q => pickSet(q, boardSet(q)),
  identityCount: q => {
    const S = boardSet(q), P = pointsOf(S);
    return choiceWhere(q, c => {
      const t = norm(c).trim();
      let m;
      if (/^None$/.test(t)) return !P.infinite && P.pts.length === 0;
      if (/^Two$/.test(t)) return !P.infinite && P.pts.length === 2;
      if ((m = t.match(new RegExp(`^One: x = (${NUM})$`)))) return !P.infinite && P.pts.length === 1 && near(P.pts[0], numOf(m[1]));
      if ((m = t.match(/^Infinitely many: every (.+)$/))) return sameSet(parseSet(m[1]), S);
      throw new Error(`unknown count "${c}"`);
    });
  },
  twoAbsSum: q => pickSet(q, boardSet(q)),
  twoAbsEqual: q => pairOfPts(boardSet(q)),
};

function evalBoard(q) {
  const [e, at] = boardPlain(q).split(/\s+for\s+/);
  const x = at ? numOf(at.split('=')[1]) : 0;
  return clean(fnOf(e)(x));
}
function count(q) { const n = countOf(boardSet(q)); return Number.isFinite(n) ? n : undefined; }
function sideSlope(q) {
  const src = boardFn(q), f = fnOf(src), h = kinksOf(src)[0];
  return slopeAt(f, h + (/left piece/i.test(q.prompt) ? -1 : 1));
}
function featurePick(q) {
  const src = boardFn(q);
  const v = (q.choices ?? []).map(c => featureTrue(c, src));
  if (v.some(x => x === null)) throw new Error(`unknown statement among ${JSON.stringify(q.choices)}`);
  const hits = v.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
/** "A for cond; B for cond" is right when every x falls in a piece and every piece it falls in gives the true value */
function piecesPick(q) {
  const src = boardPlain(q).replace(/=\s*\?\s*$/, '').trim(), f = fnOf(src), k = kinksOf(src);
  return choiceWhere(q, c => {
    const pieces = norm(c).split(/\s*;\s*/).map(p => { const [e, cond] = p.split(/\s+for\s+/); return { g: fnOf(e), C: chainSet(cond) }; });
    const xs = [...probes({ crit: [...k, ...pieces.flatMap(p => p.C.crit)] }), -20, -3.3, -0.4, 0.6, 2.7, 13];
    return xs.every(x => { const on = pieces.filter(p => p.C.test(x)); return on.length > 0 && on.every(p => Math.abs(p.g(x) - f(x)) <= 1e-6); });
  });
}
function domainPts(q) {
  const [eq, dom] = boardPlain(q).split(',');
  const D = chainSet(dom);
  return sortedPts(parseSet(eq)).filter(x => D.test(x));
}
function ride(q) {
  const [def, dom] = boardPlain(q).split(',');
  const src = rhsOfDef(def), f = fnOf(src), ks = kinksOf(src);
  const m = norm(dom).match(new RegExp(`(${NUM}) ≤ [a-z] ≤ (${NUM})`));
  return { f, ks, lo: numOf(m[1]), hi: numOf(m[2]), src };
}
/** the set a tolerance sentence describes, for the values the question asks about */
function toleranceSet(q) {
  const m = boardPlain(q).match(new RegExp(`target (${NUM}), tolerance (${NUM})`));
  if (!m) return undefined;
  const t = numOf(m[1]), e = numOf(m[2]), p = norm(q.prompt);
  let op;
  if (/at least/.test(p)) op = '≥';
  else if (/more than/.test(p)) op = '>';
  else if (/less than/.test(p)) op = '<';
  else if (/at most|ends included/.test(p)) op = '≤';
  else return undefined;
  const ruleIsFlag = /(flagged|rejected) if/.test(p), ruleIsPass = /(passes if|keeps|counts as|within)/.test(p) && !ruleIsFlag;
  if (!ruleIsFlag && !ruleIsPass) return undefined;
  const asksFlag = /values that are flagged/.test(p), asksPass = /values that pass/.test(p);
  if (asksFlag === asksPass) return undefined;
  const S = relSet(`|x - ${t}|`, op, String(e));
  return (asksFlag === ruleIsFlag) ? S : { test: x => !S.test(x), crit: S.crit };
}

// ---------------------------------------------------------------- the oracle
export default {
  solve(q) {
    const f = SOLVE[q.family];
    if (!f) return undefined;
    const r = f(q);
    if (typeof r === 'number' && !Number.isFinite(r)) return undefined;
    return Array.isArray(r) ? r.map(clean) : (q.input === 'choice' ? r : clean(r));
  },
  sane(q) {
    const fam = q.family, p = norm(q.prompt);
    // pair items asking for two solutions must have exactly two
    if (['distSolve', 'splitSolve', 'isolateSolve', 'graphSolve', 'twoAbsEqual', 'exactlyAway'].includes(fam)) {
      const P = pointsOf(boardSet(q));
      if (P.infinite || P.pts.length !== 2) return `the equation has ${P.infinite ? 'infinitely many' : P.pts.length} solution(s), the item asks for two`;
    }
    if (fam === 'andSolve' || fam === 'orSolve' || fam === 'toleranceEnds') {
      const S = boardSet(q), e = ends(S);
      if (!e) return 'the inequality does not have two ends';
      const [a, b] = e, inside = S.test((a + b) / 2), outside = S.test(a - 1) && S.test(b + 1);
      if (fam === 'orSolve' ? inside || !outside : !inside || S.test(a - 1) || S.test(b + 1)) return 'the set is not the shape the boxes describe';
      const shown = `${q.pair?.lead ?? ''} ${q.pair?.op ?? ''} ${q.pair?.tail ?? ''}`;
      const closed = /[≤≥]/.test(shown), open = /[<>]/.test(shown);
      if ((closed && !S.test(a)) || (open && S.test(a))) return 'the boxes\' signs do not match whether the ends belong to the set';
    }
    if (fam === 'modelEq' || fam === 'exactlyAway') {
      const m = boardPlain(q).match(new RegExp(`target (${NUM}), exactly (${NUM}) away`));
      const pts = m ? [numOf(m[1]) - numOf(m[2]), numOf(m[1]) + numOf(m[2])] : sortedPts(boardSet(q));
      if (/speed|mile marker|bolt|long/.test(p) && pts.some(x => x <= 0)) return `a value ${Math.min(...pts)} that cannot be a speed / marker / length`;
      if (/bolt/.test(p) && pts.some(x => x > 30)) return 'a bolt longer than 30 in.';
    }
    if (fam === 'domainReject') {
      const n = domainPts(q).length;
      if (n !== 1) return `${n} solutions lie in the allowed range (one asked)`;
    }
    if (fam === 'rideRead' || fam === 'rateUnits' || fam === 'rideDomain') {
      const R = ride(q), speed = promptNum(q, new RegExp(`rides at (${NUM}) mph`)), at = promptNum(q, new RegExp(`marker (${NUM}) h after`));
      if (!(speed > 0 && speed <= 30)) return `a cyclist at ${speed} mph`;
      if (!near(Math.abs(slopeAt(R.f, R.ks[0] + 0.25)), speed) || !near(R.ks[0], at)) return 'd(t) does not match the speed or the time at the marker';
      if (!(R.ks[0] > R.lo && R.ks[0] < R.hi)) return 'she never passes the marker on this ride';
      if (fam === 'rideRead' && SOLVE.rideRead(q) === undefined) return 'the asked time is not on the ride (or not one time)';
      if (fam === 'rideRead' && /when is she/.test(p)) { const t = SOLVE.rideRead(q); if (t < R.lo - EPS || t > R.hi + EPS) return 'the asked time is outside the ride'; }
      if (fam === 'rateUnits') {
        const claim = promptNum(q, new RegExp(`has slope (${NUM})\\.`)), side = /The left piece/.test(p) ? -0.25 : 0.25;
        if (!near(claim, slopeAt(R.f, R.ks[0] + side))) return `the prompt says slope ${claim}, the graph has ${slopeAt(R.f, R.ks[0] + side)}`;
      }
    }
    if (fam === 'toleranceModel') {
      const m = boardPlain(q).match(new RegExp(`target (${NUM}), tolerance (${NUM})`));
      if (m && !(numOf(m[2]) > 0 && numOf(m[2]) < numOf(m[1]))) return 'a tolerance as large as the target';
      if (!toleranceSet(q)) return 'cannot tell which relation the sentence means';
    }
    if (fam === 'toleranceReverse') {
      const m = norm(boardPlain(q)).match(new RegExp(`^(${NUM}) ≤ [a-z] ≤ (${NUM})$`));
      if (m && !(numOf(m[1]) < numOf(m[2]))) return 'an empty or one-point range';
    }
    if (fam === 'keepReject') {
      const m = p.match(new RegExp(`the case (.+?) gives [a-z] = (${NUM})\\.`));
      const v = numOf(m[2]);
      if (!chainSet(m[1]).test(v) && boardSet(q).test(v)) return `x = ${v} fails its case condition but does solve the equation (the other case gives it), so "reject" vs "it solves the equation" is unclear`;
    }
    if (['howManySol', 'isolateCount', 'graphCount', 'branchCount'].includes(fam) && countOf(boardSet(q)) === Infinity) return 'infinitely many solutions asked as a count';
    return '';
  },
};
