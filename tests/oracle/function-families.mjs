// Oracle for the lesson "function-families" (Algebra 1, lesson 19: linear, quadratic or exponential?; secondary-t6-34,
// 26 sub-goals). Role O of docs/lessons/QUALITY_LAYER.md: every item is worked out from what the student sees (the
// prompt, the board, the choices, the drawn table or graph). Students are 14-18, so sane() judges fairness for them:
// a classification table fits exactly one family, stories are believable, comparisons have one winner.
//
// Method
// - Tables are classified here by exact tests over EQUAL x-steps: 1st differences equal → linear; 2nd differences equal
//   and not 0 → quadratic; no zero output and equal ratios r > 0, r ≠ 1 → exponential (a constant table is linear
//   only). Values are compared with a relative tolerance of 1e-9 (tables carry decimals such as 1,464.1).
// - Rules the student reads (f(x) = 20x + 5, P(t) = 1,000 · 1.1^t, y = log_2(x) + 1, y = 2|x − 2|, ...) are parsed
//   into expression trees and evaluated in doubles; answers are cleaned of float noise (12 significant digits).
// - Graph data draws y = a·g(x − h) + k for the parent g named by s.p (lin x, quad x², cube x³, abs |x|, sqrt √x,
//   cbrt ∛x, exp bˣ, log log_b x, recip 1/x); the oracle evaluates exactly that curve and the marked points.
// - Choices that make a claim are tested claim by claim; the unique true one is returned.
import { round } from '../../tools/quality/oracle-kit.mjs';

// ------------------------------------------------------------------ text and numbers
const num = s => (s === null || s === undefined ? null : Number(String(s).replace(/[−–]/g, '-').replace(/[,$\s+×]/g, '')));
const clean = v => Number(Number(v).toPrecision(12));
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
const SUP = { 'ˣ': '^x', 'ʰ': '^h', 'ᵗ': '^t', '²': '^2', '³': '^3' };
/** plain text → normalized: '-' minus, '*' times, '/' divide, ^ powers, no thousands commas */
function norm(s) {
  return String(s ?? '')
    .replace(/[ˣʰᵗ²³]/g, c => SUP[c]).replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/÷/g, '/')
    .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...')
    .replace(/(\d),(\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d{3})(?!\d)/g, '$1$2')
    .replace(/\s+/g, ' ').trim();
}
const P = q => norm(q.prompt);
const C = q => (q.choices ?? []).map(norm);
/** index of the one choice passing pred (on normalized text), else -1 */
function pick(q, pred) {
  const hits = C(q).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
const numsIn = s => [...norm(s).matchAll(/(?<![\w.])(-?)(\d+(?:\.\d+)?)/g)].map(m => (m[1] ? -1 : 1) * Number(m[2]));

// ------------------------------------------------------------------ expressions
/**
 * Parse an expression at the start of s (normalized text). Variables: single letters in `vars`; function calls
 * name(...) for single letters in `fns`; √(...), ∛(...), |...|, log_b(...); implicit multiplication; ^ binds a primary.
 * Returns { f: env => number, end } for the longest prefix that is an expression, or null.
 */
function parseAt(s, vars = 'xtnphsmg', fns = '') {
  let i = 0;
  const ws = () => { while (s[i] === ' ') i++; };
  const peek = () => { ws(); return s[i]; };
  function group(open, close, wrap) {
    const save = i; i++;
    const e = expr();
    if (!e || peek() !== close) { i = save; return null; }
    i++;
    return wrap ? wrap(e) : e;
  }
  function primary() {
    ws();
    const c = s[i];
    if (c === undefined) return null;
    if (c === '(') return group('(', ')');
    if (c === '{') return group('{', '}');
    if (c === '|') return group('|', '|', e => env => Math.abs(e(env)));
    if (c === '√' || c === '∛') {
      const save = i; i++;
      if (s[i] !== '(') { i = save; return null; }
      const g = group('(', ')');
      if (!g) { i = save; return null; }
      return c === '√' ? env => Math.sqrt(g(env)) : env => Math.cbrt(g(env));
    }
    if (s.startsWith('log_', i)) {
      const m = s.slice(i).match(/^log_\{?(\d+(?:\.\d+)?)\}?/);
      if (!m) return null;
      const save = i; i += m[0].length;
      if (s[i] !== '(') { i = save; return null; }
      const g = group('(', ')');
      if (!g) { i = save; return null; }
      const b = Number(m[1]);
      return env => Math.log(g(env)) / Math.log(b);
    }
    if (/[0-9.]/.test(c)) {
      const m = s.slice(i).match(/^\d+(?:\.\d+)?|^\.\d+/);
      if (!m) return null;
      i += m[0].length;
      const v = Number(m[0]);
      return () => v;
    }
    if (/[A-Za-z]/.test(c) && !/[A-Za-z_]/.test(s[i + 1] ?? '')) {
      if (fns.includes(c) && s[i + 1] === '(') {
        const save = i; i++;
        const a = group('(', ')');
        if (!a) { i = save; return null; }
        return env => env.call(c, a(env));
      }
      if (vars.includes(c)) { i++; return env => env[c]; }
    }
    return null;
  }
  function power() {
    const b = primary();
    if (!b) return null;
    ws();
    if (s[i] === '^') {
      const save = i; i++;
      ws();
      let x;
      if (s[i] === '-') { i++; const y = primary(); x = y ? env => -y(env) : null; } else x = primary();
      if (!x) { i = save; return b; }
      return env => b(env) ** x(env);
    }
    return b;
  }
  function unary() {
    ws();
    if (s[i] === '-') { const save = i; i++; const g = unary(); if (!g) { i = save; return null; } return env => -g(env); }
    return power();
  }
  function term() {
    let f = unary();
    if (!f) return null;
    for (;;) {
      ws();
      const c = s[i];
      if (c === '*' || c === '/') {
        const save = i; i++;
        const g = unary();
        if (!g) { i = save; return f; }
        const a = f; f = c === '*' ? env => a(env) * g(env) : env => a(env) / g(env);
        continue;
      }
      if (c !== undefined && (c === '(' || c === '{' || c === '√' || c === '∛' || /[0-9A-Za-z]/.test(c) || (c === '|' && !inAbs))) {
        const save = i;
        const g = power();
        if (!g) { i = save; return f; }
        const a = f; f = env => a(env) * g(env);
        continue;
      }
      return f;
    }
  }
  let inAbs = false;
  function expr() {
    const wasAbs = inAbs;
    // inside |...| an implicit product must not swallow the closing bar
    if (s[i - 1] === '|') inAbs = true;
    let f = term();
    if (!f) { inAbs = wasAbs; return null; }
    for (;;) {
      const save = i;
      ws();
      const c = s[i];
      if (c === '+' || c === '-') {
        i++;
        const g = term();
        if (!g) { i = save; break; }
        const a = f; f = c === '+' ? env => a(env) + g(env) : env => a(env) - g(env);
        continue;
      }
      i = save;
      break;
    }
    inAbs = wasAbs;
    return f;
  }
  const f = expr();
  return f ? { f, end: i } : null;
}
const parseAll = (s, vars) => { const r = parseAt(s.trim(), vars); return r && s.trim().slice(r.end).trim() === '' ? r.f : null; };
const at = (f, v) => f({ x: v, t: v, n: v, p: v, h: v, s: v, m: v, g: v });
/** every definition NAME(var) = expr in a text: { name: fn(v) } */
function defs(s) {
  const out = {};
  for (const m of s.matchAll(/(?<![A-Za-z])([A-Za-z])\(([a-z])\) = /g)) {
    const r = parseAt(s.slice(m.index + m[0].length), m[2]);
    if (r) { const f = r.f, v = m[2]; out[m[1]] = x => f({ [v]: x }); }
  }
  return out;
}
/** the model after 'y = ' (k-th one) */
function yDefs(s) {
  const out = [];
  for (const m of s.matchAll(/(?<![A-Za-z])y = /g)) {
    const r = parseAt(s.slice(m.index + m[0].length), 'xt');
    if (r) { const f = r.f; out.push(x => f({ x, t: x })); }
  }
  return out;
}

// ------------------------------------------------------------------ tables
function table(q) {
  const t = q.data?.picture?.t;
  if (!t) return null;
  return { xName: t.xName, xs: t.xs.map(num), cols: t.cols.map(c => ({ name: c.name, vals: c.vals.map(v => (v === null || v === undefined ? null : num(v))) })) };
}
const diffs = a => a.slice(1).map((v, k) => v - a[k]);
const allEq = a => a.every(v => close(v, a[0]));
const equalSteps = xs => xs.length > 1 && allEq(diffs(xs));
/** families a table is consistent with (equal steps assumed): subset of ['lin','quad','exp'] */
function fitsOf(xs, ys) {
  const out = [];
  if (!equalSteps(xs) || ys.some(v => v === null)) return out;
  const d1 = diffs(ys), d2 = diffs(d1);
  const tol = (a, b) => close(a, b, 1e-9) || Math.abs(a - b) < 1e-9 * Math.max(...ys.map(Math.abs), 1);
  const eqT = a => a.every(v => tol(v, a[0]));
  if (eqT(d1)) out.push('lin');
  if (ys.length >= 3 && eqT(d2) && !tol(d2[0], 0)) out.push('quad');
  if (ys.every(v => v !== 0)) {
    const r = ys.slice(1).map((v, k) => v / ys[k]);
    if (allEq(r) && r[0] > 0 && !close(r[0], 1)) out.push('exp');
  }
  return out;
}
/** classification for an equal-step table with 4+ rows: 'lin' | 'quad' | 'exp' | 'none' | 'many' */
function classify(xs, ys) {
  const f = fitsOf(xs, ys);
  if (f.length === 0) return 'none';
  return f.length === 1 ? f[0] : 'many';
}
const FAM = { lin: 'Linear', quad: 'Quadratic', exp: 'Exponential', none: 'None' };
/** an exact model through a table of family fam → x => y */
function modelOf(fam, xs, ys) {
  if (fam === 'lin') { const m = (ys[1] - ys[0]) / (xs[1] - xs[0]); return x => ys[0] + m * (x - xs[0]); }
  if (fam === 'exp') { const r = (ys[1] / ys[0]) ** (1 / (xs[1] - xs[0])); return x => ys[0] * r ** (x - xs[0]); }
  if (fam === 'quad') return lagrange(xs.slice(0, 3), ys.slice(0, 3));
  return null;
}
function lagrange(xs, ys) {
  return x => xs.reduce((s, xi, i) => s + ys[i] * xs.reduce((p, xj, j) => (j === i ? p : p * (x - xj) / (xi - xj)), 1), 0);
}

// ------------------------------------------------------------------ graphs
const PARENT = {
  lin: x => x, quad: x => x * x, cube: x => x ** 3, abs: Math.abs, sqrt: Math.sqrt, cbrt: Math.cbrt, recip: x => 1 / x,
};
function curve(s) {
  if (s.p === 'exp') return x => s.a * s.b ** (x - s.h) + s.k;
  if (s.p === 'log') return x => s.a * Math.log(x - s.h) / Math.log(s.b) + s.k;
  const g = PARENT[s.p];
  return g ? x => s.a * g(x - s.h) + s.k : null;
}
const gItems = q => q.data?.picture?.g?.items ?? [];
const GNAME = { lin: 'Linear', quad: 'Quadratic', exp: 'Exponential', cube: 'Cubic', abs: 'Absolute value', sqrt: 'Square root', cbrt: 'Cube root', log: 'Logarithmic', recip: 'Rational (reciprocal)' };

// ------------------------------------------------------------------ helpers for claims
/** sign word of a change */
const dir = (a, b) => (close(a, b) ? 'same' : b > a ? 'up' : 'down');
function seqDir(ys) {
  const d = diffs(ys);
  if (d.every(v => Math.abs(v) < 1e-12)) return 'same';
  if (d.every(v => v > 0)) return 'up';
  if (d.every(v => v < 0)) return 'down';
  return 'mixed';
}
const pctOf = r => clean((r - 1) * 100);

// ================================================================== the families
const S = {};

// ---- equal-spacing
S.spacingCheck = q => {
  const T = table(q), d = diffs(T.xs);
  if (allEq(d)) return pick(q, c => { const m = c.match(/^Equal steps of \+?(-?[\d.]+)/); return !!m && close(Number(m[1]), d[0]); });
  return pick(q, c => /^Unequal steps/.test(c));
};
S.unequalSlope = q => {
  const T = table(q), m = P(q).match(/from x = (-?[\d.]+) to x = (-?[\d.]+)/);
  const a = Number(m[1]), b = Number(m[2]);
  const ia = T.xs.findIndex(x => close(x, a)), ib = T.xs.findIndex(x => close(x, b));
  const ys = T.cols[0].vals;
  return clean((ys[ib] - ys[ia]) / (b - a));
};
function slopes(T) {
  const ys = T.cols[0].vals;
  return T.xs.slice(1).map((x, k) => (ys[k + 1] - ys[k]) / (x - T.xs[k]));
}
S.unequalVerdict = q => {
  const sl = slopes(table(q)), lin = allEq(sl);
  return pick(q, c => {
    if (/^Linear/.test(c)) { if (!lin) return false; const m = c.match(/= (-?[\d.]+) on every/); return !m || close(Number(m[1]), sl[0]); }
    if (/^Not linear \(Δy\/Δx changes\)/.test(c)) return !lin;   // the per-unit rate test is valid with unequal steps
    return false; // "raw 1st differences" (invalid with unequal steps), "nothing can be decided", "none of the three"
  });
};

// ---- first-differences
S.slopeFromDiff = q => { const T = table(q), ys = T.cols[0].vals; return clean((ys[1] - ys[0]) / (T.xs[1] - T.xs[0])); };
S.isLinear = q => {
  const T = table(q), ys = T.cols[0].vals, d1 = diffs(ys);
  const lin = equalSteps(T.xs) && allEq(d1);
  return pick(q, c => {
    if (/^Consistent with a linear/.test(c)) { const k = numsIn(c.split('is ')[1] ?? '')[0]; return lin && close(k, d1[0]); }
    if (/^Not linear/.test(c)) return !lin;
    return false; // "Proved linear for every x": a finite table never proves it
  });
};

// ---- second-differences
S.secondDiffClassify = q => {
  const T = table(q), ys = T.cols[0].vals;
  if (!equalSteps(T.xs)) return undefined;
  const d2 = diffs(diffs(ys));
  const zero = d2.every(v => Math.abs(v) < 1e-9), cst = allEq(d2) || zero;
  const want = zero ? 'All 0: linear, not quadratic' : cst ? 'Constant and not 0: consistent with a quadratic function' : 'Not constant: not quadratic';
  return pick(q, c => c === want);
};
S.nextValue = q => {
  const T = table(q), ys = T.cols[0].vals;
  const known = T.xs.map((x, k) => [x, ys[k]]).filter(([, y]) => y !== null);
  const miss = T.xs[ys.findIndex(y => y === null)];
  const f = lagrange(known.slice(0, 3).map(r => r[0]), known.slice(0, 3).map(r => r[1]));
  return clean(f(miss));
};

// ---- ratio-test
function ratioFacts(T) {
  const ys = T.cols[0].vals;
  const nz = ys.every(v => v !== 0);
  const r = nz ? ys.slice(1).map((v, k) => v / ys[k]) : [];
  return { ys, nz, r, exp: nz && allEq(r) && r[0] > 0 && !close(r[0], 1) };
}
S.ratioClassify = q => {
  const F = ratioFacts(table(q));
  return pick(q, c => {
    if (/^Consistent with exponential: every ratio is \*([\d.]+)$/.test(c)) return F.exp && close(Number(c.match(/\*([\d.]+)$/)[1]), F.r[0]);
    if (/^Not exponential: the ratios are not all equal/.test(c)) return !F.exp && F.nz && !allEq(F.r);
    return false; // reasons that do not decide the ratio test (differences, direction)
  });
};
S.ratioDirection = q => {
  const d = seqDir(table(q).cols[0].vals);
  return pick(q, c => (d === 'up' && /increase/.test(c)) || (d === 'down' && /decrease/.test(c)) || (d === 'same' && /stay the same/.test(c)));
};
S.ratioValue = q => { const F = ratioFacts(table(q)); return allEq(F.r) ? clean(F.r[0]) : undefined; };

// ---- explain-signatures
S.genericStep = q => {
  const p = P(q), f = Object.values(defs(p))[0];
  const ratio = /÷/.test(q.prompt);
  const tests = [[0.3, 1.7], [2, 0.5], [-1.2, 3.1], [1, 2]];
  const truth = tests.map(([x, h]) => (ratio ? f(x + h) / f(x) : f(x + h) - f(x)));
  return pick(q, c => {
    const e = parseAll(c, 'hx');
    return !!e && tests.every(([x, h], k) => close(e({ h, x }), truth[k], 1e-9));
  });
};
S.directionImplication = q => pick(q, c => {
  // the rule → the pattern direction is true; the converse, examples-as-proof and swapped patterns are not
  if (/^If f\(x\) = a \* b\^x, every x-step of size h multiplies f by the same factor, b\^h$/.test(c)) return true;
  if (/^If f\(x\) = mx \+ c, every x-step of size h changes f by the same amount, mh$/.test(c)) return true;
  return false;
});

// ---- factor-to-percent
S.factorToPercent = q => pctOf(Number(P(q).match(/multiplied by ([\d.]+)/)[1]));
S.tableToPercent = q => {
  const T = table(q), ys = T.cols[0].vals, step = T.xs[1] - T.xs[0];
  const r = ys[1] / ys[0];
  const perStep = /per (\d+)-year step/.test(P(q));
  return pctOf(perStep ? r : r ** (1 / step));
};
S.negativeContrast = q => {
  const T = table(q), ys = T.cols[0].vals, r = ys[1] / ys[0], d = seqDir(ys);
  const shrinkPct = clean((1 - r) * 100), growPct = clean((r - 1) * 100);
  return pick(q, c => {
    const km = c.match(/([\d.]+)%|amount, ([\d.]+)/), k = km ? Number(km[1] ?? km[2]) : NaN;
    if (/same amount/.test(c)) return allEq(diffs(ys)) && ((/go up/.test(c) && d === 'up') || (/go down/.test(c) && d === 'down')) && close(k, Math.abs(diffs(ys)[0]));
    if (/^The values go up \(toward 0\); only their size shrinks by/.test(c)) return d === 'up' && ys[0] < 0 && r < 1 && close(k, shrinkPct);
    if (/^The values go down; only their size grows by/.test(c)) return d === 'down' && ys[0] < 0 && r > 1 && close(k, growPct);
    if (/^The values decay: they go down by/.test(c)) return d === 'down' && r < 1 && close(k, shrinkPct);
    if (/^The values grow by/.test(c)) return d === 'up' && r > 1 && close(k, growPct);
    return false;
  });
};

// ---- degenerate-cases
S.constantTable = q => {
  const ys = table(q).cols[0].vals;
  if (!allEq(ys)) return undefined;
  return pick(q, c => /^Linear only/.test(c)); // b = 1 is not an exponential; 2nd differences 0 are not quadratic
};
S.zeroOutput = q => {
  const T = table(q), ys = T.cols[0].vals, fam = classify(T.xs, ys);
  const d1 = diffs(ys), d2 = diffs(d1);
  return pick(q, c => {
    const k = numsIn(c.split('all ')[1] ?? '')[0];
    if (/1st differences are all .* linear function$/.test(c)) return fam === 'lin' && close(k, d1[0]);
    if (/2nd differences are all .* quadratic function$/.test(c)) return fam === 'quad' && close(k, d2[0]);
    return false; // a·bˣ is never 0; 0 ÷ y = 0 has a value; the difference tests still work
  });
};

// ---- mixed-classification
S.classifyMixed = q => {
  const T = table(q), fam = classify(T.xs, T.cols[0].vals);
  if (fam === 'many') return undefined;
  return pick(q, c => c === (fam === 'none' ? 'None of these' : FAM[fam]));
};
S.whichTable = q => {
  const T = table(q), want = P(q).match(/with a[n]? (linear|quadratic|exponential)/)[1].slice(0, 3).replace('exp', 'exp').replace('lin', 'lin').replace('qua', 'quad');
  const hits = T.cols.filter(c => classify(T.xs, c.vals) === want);
  if (hits.length !== 1) return -1;
  return pick(q, c => c === `Column ${hits[0].name}`);
};

// ---- compare-outputs
function maxName(vals) {
  const best = Math.max(...Object.values(vals));
  const names = Object.keys(vals).filter(k => close(vals[k], best));
  return names.length === 1 ? names[0] : null;
}
S.compareAt = q => {
  const p = P(q), D = defs(p), x = Number(p.match(/largest at x = (-?[\d.]+)/)[1]);
  const w = maxName(Object.fromEntries(Object.entries(D).map(([k, f]) => [k, f(x)])));
  return w ? pick(q, c => c.startsWith(w + ' ')) : -1;
};
S.compareTableAt = q => {
  const T = table(q), x = Number(P(q).match(/largest at x = (-?[\d.]+)/)[1]);
  const vals = {};
  for (const c of T.cols) { const fam = classify(T.xs, c.vals); if (!['lin', 'quad', 'exp'].includes(fam)) return undefined; vals[c.name] = modelOf(fam, T.xs, c.vals)(x); }
  const w = maxName(vals);
  return w ? pick(q, c => c === w) : -1;
};

// ---- avg-rate-nonlinear
function rateOf(p) {
  const f = Object.values(defs(p))[0], m = p.match(/from t = (-?[\d.]+) to t = (-?[\d.]+)/);
  const a = Number(m[1]), b = Number(m[2]);
  return { f, a, b, r: clean((f(b) - f(a)) / (b - a)) };
}
S.avgRateFormula = q => rateOf(P(q)).r;
S.avgRateGraph = q => {
  const pts = gItems(q).filter(i => i.kind === 'point');
  const [p0, p1] = pts;
  return clean((p1.y - p0.y) / (p1.x - p0.x));
};
S.avgRateMeaning = q => {
  const { f, a, b, r } = rateOf(P(q));
  return pick(q, c => {
    const m = c.match(/^On average the (\w+) (rose|fell) ([\d.]+) .* between t = (-?[\d.]+) and t = (-?[\d.]+)$/);
    if (m) return ((m[2] === 'rose' && r > 0) || (m[2] === 'fell' && r < 0)) && close(Number(m[3]), Math.abs(r)) && close(Number(m[4]), a) && close(Number(m[5]), b);
    const v = c.match(/^The \w+ at t = (-?[\d.]+) is (-?[\d.]+)/);
    if (v) return close(f(Number(v[1])), Number(v[2]));
    return false; // "takes r years for each person" (inverted), "exactly r in every moment" (average ≠ constant)
  });
};

// ---- compare-rate-patterns
S.ratePattern = q => {
  const p = P(q);
  let f;
  const D = Object.values(defs(p));
  if (D.length) f = D[0];
  else { const T = table(q), ys = T.cols[0].vals; f = x => ys[T.xs.findIndex(v => close(v, x))]; }
  const r = [0, 1, 2].map(i => f(i + 1) - f(i));
  const d = diffs(r);
  return pick(q, c => {
    if (/^It stays the same/.test(c)) return allEq(r);
    if (/^It changes by the same nonzero amount/.test(c)) return allEq(d) && !close(d[0], 0);
    if (/^It is multiplied by the same factor/.test(c)) return r.every(v => v !== 0) && close(r[1] / r[0], r[2] / r[1]) && !close(r[1] / r[0], 1);
    if (/^The rate on each interval equals the value of f at its end/.test(c)) return r.every((v, i) => close(v, f(i + 1)));
    return false;
  });
};
S.rateRace = q => {
  const p = P(q), D = defs(p), m = p.match(/on \[(-?[\d.]+), (-?[\d.]+)\]/);
  const a = Number(m[1]), b = Number(m[2]);
  const rf = (D.f(b) - D.f(a)) / (b - a), rg = (D.g(b) - D.g(a)) / (b - a);
  if (close(rf, rg)) return pick(q, c => /equal/.test(c));
  return pick(q, c => c.startsWith(rf > rg ? 'f,' : 'g,'));
};

// ---- family-graph-signatures
const fnItems = q => gItems(q).filter(i => i.kind === 'fn');
S.graphFamily = q => pick(q, c => c === GNAME[fnItems(q)[0].s.p]);
S.graphFeature = q => {
  const s = fnItems(q)[0].s;
  if (s.p === 'exp') return pick(q, c => { const m = c.match(/^It flattens out toward (?:the line y = (-?[\d.]+)|a horizontal line)/); return !!m && (m[1] === undefined || close(Number(m[1]), s.k)); });
  if (s.p === 'quad') return pick(q, c => /turns around at a vertex and is symmetric about a vertical line/.test(c));
  return undefined;
};

// ---- parent-function-gallery
function typeOfRule(r) {
  // r: normalized right-hand side
  if (/log_/.test(r)) return 'Logarithmic';
  if (/\^\{?\(?[a-z]/.test(r)) return 'Exponential';
  if (/√/.test(r)) return 'Square root';
  if (/∛/.test(r)) return 'Cube root';
  if (/\|/.test(r)) return 'Absolute value';
  if (/\/\(?[^)]*x/.test(r)) return 'Rational (reciprocal)';
  if (/\^3/.test(r)) return 'Cubic';
  if (/\^2/.test(r)) return 'Quadratic';
  if (/x/.test(r)) return 'Linear';
  return null;
}
S.equationFamily = q => {
  const r = P(q).match(/y = (.*)\?$/)[1];
  return pick(q, c => c === typeOfRule(r)); // "None of these: the shift makes a new type" is never true
};
S.graphGallery = q => pick(q, c => c === GNAME[fnItems(q)[0].s.p]);
S.asymptoteShift = q => {
  const r = P(q).match(/^y = (.*?) is a translated/)[1];
  const f = parseAll(r, 'x');
  // the end where bˣ dies: the value settles there
  const lo = f({ x: -400 }), hi = f({ x: 400 });
  const v = Number.isFinite(lo) && close(lo, f({ x: -401 })) ? lo : hi;
  return clean(round(v, 9));
};

// ---- parent-function-gallery-extended
S.extendedGraph = q => {
  const p = P(q);
  const items = fnItems(q);
  let want;
  if (/^f\(x\) = .* for x [<≤]/.test(p) || items.length > 1) want = 'Piecewise';
  else {
    const r = p.match(/^y = (.*?)\. Use the rule/)[1];
    want = typeOfRule(r);
    if (want === 'Exponential') {
      const f = parseAll(r, 'x');
      want = f({ x: 1 }) < f({ x: 0 }) ? 'Exponential decay' : 'Exponential growth';
    }
    // the drawn curve must be the same kind
    const g = { log: 'Logarithmic', sqrt: 'Square root', recip: 'Rational (reciprocal)', exp: want }[items[0]?.s.p];
    if (g !== want) return -1;
  }
  return pick(q, c => c === want);
};
S.tableCandidates = q => {
  const T = table(q), ys = T.cols[0].vals;
  return pick(q, c => {
    const m = c.match(/^y = (.*)$/);
    const f = m && parseAll(m[1], 'x');
    return !!f && T.xs.every((x, k) => close(f({ x }), ys[k]));
  });
};

// ---- compare-linear-pair
function linG(q) {
  const p = P(q), T = table(q);
  if (T) {
    const ys = T.cols[0].vals, xs = T.xs;
    if (!allEq(slopes(T))) return null;
    const m = (ys[1] - ys[0]) / (xs[1] - xs[0]);
    return { m, c: ys[0] - m * xs[0] };
  }
  const s = p.match(/g starts at (-?[\d.]+) when x = 0 and (rises|falls) ([\d.]+) for every 1 unit of x/);
  return { c: Number(s[1]), m: (s[2] === 'rises' ? 1 : -1) * Number(s[3]) };
}
function linF(p) {
  const f = defs(p).f;
  return { c: f(0), m: f(1) - f(0) };
}
const xInt = L => { if (L.m === 0) return Infinity; const x0 = -L.c / L.m; return x0 > 0 ? x0 : Infinity; };
S.linearPair = q => {
  const p = P(q), F = linF(p), G = linG(q);
  if (!G) return -1;
  let vf, vg, smaller = false;
  if (/greater y-intercept/.test(p)) { vf = F.c; vg = G.c; }
  else if (/greater slope/.test(p)) { vf = F.m; vg = G.m; }
  else if (/reaches y = 0 first/.test(p)) { vf = xInt(F); vg = xInt(G); smaller = true; }
  else return undefined;
  if (vf === vg || close(vf, vg)) return pick(q, c => /same/.test(c));
  const w = (smaller ? vf < vg : vf > vg) ? 'f' : 'g';
  return pick(q, c => c === w);
};
S.rangeFromTable = q => pick(q, c => /^Not settled/.test(c)); // a table of some inputs never fixes the range

// ---- cross-representation
S.linVsNonlin = q => {
  const p = P(q), f = defs(p).f, g = curve(fnItems(q)[0].s);
  let vf, vg, m;
  if (/greater y-intercept/.test(p)) { vf = f(0); vg = g(0); }
  else if ((m = p.match(/greater value at x = (-?[\d.]+)/))) { const x = Number(m[1]); vf = f(x); vg = g(x); }
  else if ((m = p.match(/greater average rate of change on \[(-?[\d.]+), (-?[\d.]+)\]/))) {
    const a = Number(m[1]), b = Number(m[2]);
    vf = (f(b) - f(a)) / (b - a); vg = (g(b) - g(a)) / (b - a);
  } else return undefined;
  if (close(vf, vg)) return pick(q, c => /equal/.test(c));
  return pick(q, c => c === (vf > vg ? 'f' : 'g'));
};
S.maxFromTable = q => {
  const p = P(q), h = defs(p).h;
  const c = h(0), b = (h(1) - h(-1)) / 2, a = (h(1) + h(-1)) / 2 - c;
  return clean(c - b * b / (4 * a));
};

// ---- eventual-dominance
function minDiff(f, g, x0 = 0, x1 = 400, step = 0.01) {
  let mn = Infinity;
  for (let i = Math.round(x0 / step); i * step <= x1; i++) { const x = i * step, d = f(x) - g(x); if (d < mn) mn = d; }
  return mn;
}
function longRun(f, g) {
  const big = [1000, 2000, 3000].map(x => Math.sign(f(x) - g(x)));
  return big.every(s => s === big[0]) ? (big[0] > 0 ? 'f' : big[0] < 0 ? 'g' : null) : null;
}
S.whoWinsLongRun = q => {
  const D = defs(P(q)), w = longRun(D.f, D.g);
  const fAll = minDiff(D.f, D.g) > 0;
  return pick(q, c => {
    { const m = c.match(/^From some x on, (\w) is larger for good$/); if (m) return m[1] === w; }
    if (/^f is larger for every x ≥ 0$/.test(c)) return fAll;
    if (/^g is larger for every x ≥ 0$/.test(c)) return minDiff(D.g, D.f) > 0;
    return false;
  });
};
S.tableOrder = q => {
  const T = table(q), D = defs(P(q));
  const F = T.cols.find(c => c.name === 'f').vals, G = T.cols.find(c => c.name === 'g').vals, xs = T.xs;
  return pick(q, c => {
    let m;
    if (/^f is larger at every x in the table$/.test(c)) return F.every((v, k) => v > G[k]);
    if ((m = c.match(/^g is larger from x = (-?[\d.]+) on, so g stays ahead$/))) {
      // "stays ahead" is a claim beyond the table: test the rules themselves
      return longRun(D.g, D.f) === 'g' && minDiff(D.g, D.f, Number(m[1]), 400) > 0;
    }
    if ((m = c.match(/^From x = (-?[\d.]+) on f is larger, and its lead grows every row$/))) {
      const a = Number(m[1]), k0 = xs.findIndex(x => close(x, a));
      if (k0 < 0) return false;
      const lead = F.map((v, k) => v - G[k]).slice(k0);
      const before = k0 === 0 || F[k0 - 1] <= G[k0 - 1];
      return before && lead.every(v => v > 0) && diffs(lead).every(v => v > 0);
    }
    return false;
  });
};

// ---- crossover-estimate
function rootsOf(f, g, x1 = 1000) {
  const h = x => f(x) - g(x), out = [];
  const N = Math.round(x1 * 100);
  let prev = h(0);
  if (Math.abs(prev) < 1e-12) out.push({ at: 0 });
  for (let i = 1; i <= N; i++) {
    const x = i / 100, v = h(x);
    if (!Number.isFinite(v)) break; // past the doubles: f has long since pulled away
    const tiny = Math.abs(v) <= 1e-9 * Math.max(1, Math.abs(f(x)));
    if (tiny) { if (!out.length || out[out.length - 1].at !== (i - 1) / 100) out.push({ at: x }); }
    else if (Math.abs(prev) > 1e-9 * Math.max(1, Math.abs(f(x - 0.01))) && Math.sign(v) !== Math.sign(prev)) {
      let a = x - 0.01, b = x;
      for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (Math.sign(h(m)) === Math.sign(prev)) a = m; else b = m; }
      out.push({ x: (a + b) / 2 });
    }
    prev = v;
  }
  return out;
}
function lastCrossover(q) {
  const D = defs(P(q));
  const rs = rootsOf(D.f, D.g);
  const last = rs[rs.length - 1];
  return pick(q, c => {
    let m;
    if (/^There is no crossover/.test(c)) return rs.length === 0;
    if (!last) return false;
    if ((m = c.match(/^At x = (-?[\d.]+)$/))) return last.at !== undefined ? close(last.at, Number(m[1])) : close(last.x, Number(m[1]), 1e-7);
    if ((m = c.match(/^Between x = (-?[\d.]+) and x = (-?[\d.]+)$/))) {
      const x = last.at ?? last.x;
      return x > Number(m[1]) && x < Number(m[2]);
    }
    return false;
  });
}
S.lastCrossoverTable = lastCrossover;
S.lastCrossoverGraph = lastCrossover;

// ---- context-linear
function linStory(p) {
  let m;
  if ((m = p.match(/holds (\d+(?:\.\d+)?) gallons and drains at a steady (\d+(?:\.\d+)?) gallons per minute/))) return { b: +m[1], m: -m[2] };
  if ((m = p.match(/\$(\d+(?:\.\d+)?) call-out fee plus \$(\d+(?:\.\d+)?) per hour/))) return { b: +m[1], m: +m[2] };
  if ((m = p.match(/A (\d+(?:\.\d+)?)-inch candle burns down (\d+(?:\.\d+)?) inch(?:es)? per hour/))) return { b: +m[1], m: -m[2] };
  if ((m = p.match(/costs \$(\d+(?:\.\d+)?) a month plus \$(\d+(?:\.\d+)?) for each gigabyte/))) return { b: +m[1], m: +m[2] };
  return null;
}
S.contextLinModel = q => {
  const L = linStory(P(q));
  if (!L) return undefined;
  return pick(q, c => {
    const m = c.match(/^([A-Z]) = (.*)$/);
    const f = m && parseAll(m[2]);
    return !!f && [0, 1, 2, 5, 7.5].every(v => close(at(f, v), L.b + L.m * v));
  });
};
S.contextLinValue = q => {
  const p = P(q), L = linStory(p);
  const n = Number(p.match(/What do (\d+(?:\.\d+)?) \w+ cost/)[1]);
  return clean(L.b + L.m * n);
};

// ---- context-exponential
S.contextWhichFamily = q => {
  const p = P(q);
  let want = null;
  if (/grow faster and faster/.test(p)) want = 'Not enough information'; // quadratic growth also speeds up
  else if (/% (?:interest per year )?(?:on|of) (?:its|the) current|of its current value|grows by [\d.]+% every/.test(p)) want = 'Exponential';
  else if (/ORIGINAL deposit|goes up \$[\d.]+ every|gets \$[\d.]+ added every|sales tax once/.test(p)) want = 'Linear';
  return want ? pick(q, c => c === want) : undefined;
};
S.contextExpValue = q => {
  const p = P(q), m = p.match(/\$([\d.]+) is invested at ([\d.]+)% interest per year, compounded yearly\. What is the balance after (\d+) years/);
  return round(Number(m[1]) * (1 + Number(m[2]) / 100) ** Number(m[3]), 2);
};

// ---- context-quadratic-product
function productRule(p) {
  let m;
  if ((m = p.match(/sells (\d+) - (\d+(?:\.\d+)?)p (?:tickets|shirts)/))) return v => v * (+m[1] - m[2] * v);
  if ((m = p.match(/length x \+ (\d+)(?: cm)? and width (\d+) - x/))) return v => (v + +m[1]) * (+m[2] - v);
  if ((m = p.match(/fixed width of (\d+(?:\.\d+)?) \w+ and length x \+ (\d+)/))) return v => +m[1] * (v + +m[2]);
  if ((m = p.match(/cost a fixed \$(\d+(?:\.\d+)?) each/))) return v => +m[1] * v;
  if (/square .* side length s/.test(p)) return v => v * v;
  if ((m = p.match(/x ft long and (\d+(?:\.\d+)?) times as wide as it is long/))) return v => v * (+m[1] * v);
  return null;
}
const famOfRule = f => classify([0, 1, 2, 3, 4], [0, 1, 2, 3, 4].map(f));
S.productFamily = q => {
  const f = productRule(P(q));
  if (!f) return undefined;
  return pick(q, c => c === FAM[famOfRule(f)]);
};
S.productModel = q => {
  const f = productRule(P(q));
  if (!f) return undefined;
  return pick(q, c => {
    const e = parseAll(c.replace(/^R = /, ''), 'xp');
    return !!e && [0, 1, 2.5, 4, 7].every(v => close(at(e, v), f(v)));
  });
};

// ---- context-quadratic-rate
function rateStory(p) {
  let m;
  const ns = [1, 2, 3, 4, 5, 6];
  if ((m = p.match(/saves \$(\d+(?:\.\d+)?) in week 1, and each week she saves \$(\d+(?:\.\d+)?) more than the week before/))) {
    const a = +m[1], d = +m[2], week = n => a + d * (n - 1);
    if (/TOTAL/.test(p)) return ns.map(n => ns.slice(0, n).reduce((s, k) => s + week(k), 0));
    if (/IN a given week/.test(p)) return ns.map(week);
  }
  if ((m = p.match(/saves (\d+(?:\.\d+)?)% more than he saved the week before/)) && /IN a given week/.test(p)) return ns.map(n => 10 * (1 + m[1] / 100) ** (n - 1));
  if ((m = p.match(/rides at a steady (\d+(?:\.\d+)?) mi\/h/))) return ns.map(t => +m[1] * t);
  if ((m = p.match(/speed grows by (\d+(?:\.\d+)?) [\w/]+ every second/))) {
    const g = +m[1];
    if (/SPEED/.test(p)) return ns.map(t => g * t);
    if (/DISTANCE|distance it has rolled/.test(p)) return ns.map(t => g * t * t / 2); // from rest
  }
  return null;
}
S.rateChangeFamily = q => {
  const ys = rateStory(P(q));
  if (!ys) return undefined;
  return pick(q, c => c === FAM[classify([1, 2, 3, 4, 5, 6], ys)]);
};
S.savingsTotal = q => {
  const p = P(q), m = p.match(/saves \$(\d+(?:\.\d+)?) in week 1 and each week \$(\d+(?:\.\d+)?) more than the week before\..* after (\d+) weeks/);
  const a = +m[1], d = +m[2], n = +m[3];
  return clean(n * a + d * n * (n - 1) / 2);
};

// ---- finite-data-nonunique
S.twoModelsAgree = q => {
  const p = P(q), [f, g] = yDefs(p);
  return pick(q, c => {
    const m = c.match(/^Measure y at x = (-?[\d.]+)( again)?$/);
    if (!m) return false; // models that agree on a few points need not agree everywhere
    const x = Number(m[1]);
    return !close(f(x), g(x));
  });
};
S.enoughData = q => {
  const T = table(q), ys = T.cols[0].vals;
  return pick(q, c => {
    const m = c.match(/^Not settled: y = (.*) fits all three points too$/);
    if (!m) return false; // "for sure" claims from three points are never settled
    const f = parseAll(m[1], 'x');
    return !!f && T.xs.every((x, k) => close(f({ x }), ys[k]));
  });
};

// ---- noisy-data
const tolOf = p => Number(p.match(/±\s?([\d.]+)/)[1]);
function goodModels(meas, models, tol) {
  return Object.entries(models).filter(([, pred]) => meas.every((v, k) => Math.abs(pred[k] - v) <= tol + 1e-9)).map(([n]) => n);
}
S.noisyChoose = q => {
  const T = table(q), col = n => T.cols.find(c => c.name === n).vals;
  const ok = goodModels(col('measured'), { A: col('A'), B: col('B') }, tolOf(P(q)));
  return ok.length === 1 ? pick(q, c => c === `Model ${ok[0]}`) : -1;
};
S.noisyFormula = q => {
  const p = P(q), T = table(q), meas = T.cols[0].vals;
  const fa = parseAt(p.slice(p.indexOf('Model A: y = ') + 13), 't').f, fb = parseAt(p.slice(p.indexOf('Model B: y = ') + 13), 't').f;
  const ok = goodModels(meas, { A: T.xs.map(t => fa({ t })), B: T.xs.map(t => fb({ t })) }, tolOf(p));
  return ok.length === 1 ? pick(q, c => c === `Model ${ok[0]}`) : -1;
};

// ---- model-domain
S.domainChoice = q => {
  const p = P(q);
  let m;
  const range = (v, lo, hi) => c => { const r = c.match(new RegExp(`^(-?[\\d.]+) ≤ ${v} ≤ (-?[\\d.]+)$`)); return !!r && close(+r[1], lo) && close(+r[2], hi); };
  const list = (v, hi) => c => c === `${v} = 0, 1, 2, ..., ${hi}`;
  if (/ball is kicked up from the ground/.test(p)) {
    const h = defs(p).h, b = h(1) - h(0) + 16, T = b / 16; // −16t² + bt = 0 at t = b/16
    return pick(q, range('t', 0, T));
  }
  if ((m = p.match(/A (\d+)-gallon tank drains at (\d+(?:\.\d+)?) gallons per minute/))) return pick(q, range('t', 0, m[1] / m[2]));
  if (/adds \$[\d.]+ at the end of each month for one year/.test(p) && /whole months/.test(p)) return pick(q, list('m', 12));
  if ((m = p.match(/the hall has (\d+) seats/))) return pick(q, list('n', +m[1]));
  return undefined;
};
S.extrapolate = q => pick(q, c => /^No: that is far outside the measured range/.test(c));

// ---- justify-choice
function storyMechanism(p) {
  let m;
  if ((m = p.match(/\$(\d+(?:\.\d+)?) more each week than the week before/))) return { fam: 'quad', d2: +m[1], reason: r => new RegExp(`the weekly amount \\(the rate\\) grows by the same \\$${m[1]} each week`).test(r) };
  if ((m = p.match(/drained by a pump at (\d+(?:\.\d+)?) gallons per minute/))) {
    const V = Number(p.match(/holds (\d+) gallons/)[1]);
    return { fam: 'lin', d1: -m[1], limit: V / m[1], reason: r => new RegExp(`the pump removes the same ${m[1]} gallons every minute`).test(r) };
  }
  if ((m = p.match(/earns (\d+(?:\.\d+)?)% per year on the current balance/))) return { fam: 'exp', r: 1 + m[1] / 100, reason: r => new RegExp(`each year adds ${m[1]}% of the CURRENT balance`).test(r) };
  return null;
}
S.justification = q => {
  const p = P(q), T = table(q), ys = T.cols[0].vals, fam = classify(T.xs, ys), M = storyMechanism(p);
  if (!M || M.fam !== fam) return -1;
  const d1 = diffs(ys), d2 = diffs(d1);
  return pick(q, c => {
    const m = c.match(/^(\w+): (.*?), because (.*?); (.*)$/);
    if (!m || m[1] !== FAM[fam]) return false;
    const pat = m[2];
    let patOk = false;
    if (fam === 'quad') { const k = pat.match(/^the 2nd differences are all ([+-]?[\d.]+)$/); patOk = !!k && close(num(k[1]), d2[0]); }
    if (fam === 'lin') { const k = pat.match(/^the 1st differences are all ([+-]?[\d.]+)$/); patOk = !!k && close(num(k[1]), d1[0]); }
    if (fam === 'exp') { const k = pat.match(/^the ratios are all \*([\d.]+)$/); patOk = !!k && close(Number(k[1]), ys[1] / ys[0]); }
    let limOk = true;
    const lim = m[4].match(/t ≤ ([\d.]+)\)$/);
    if (lim) limOk = close(Number(lim[1]), M.limit);
    return patOk && M.reason(m[3]) && limOk;
  });
};
S.insufficientOrNone = q => {
  const T = table(q), ys = T.cols[0].vals;
  if (ys.length < 4) return pick(q, c => /^Not enough data/.test(c)); // 3 points always fit some quadratic
  const fam = classify(T.xs, ys);
  if (fam === 'many') return -1;
  return pick(q, c => (fam === 'none' ? /^None of the three/.test(c) : c === `Consistent with ${FAM[fam].toLowerCase()} only`));
};

// ================================================================== solve / sane
function solve(q) {
  const f = S[q.family];
  if (!f) return undefined;
  return f(q);
}

const issues = [];
function sane(q) {
  const out = [];
  const p = P(q), T = table(q);
  try {
    // tables asked to be classified: exactly one family (or none on purpose)
    if (['classifyMixed', 'isLinear', 'ratioClassify', 'secondDiffClassify', 'zeroOutput', 'insufficientOrNone', 'justification'].includes(q.family) && T && T.cols[0].vals.length >= 4) {
      const f = fitsOf(T.xs, T.cols[0].vals);
      if (f.length > 1) out.push(`the table fits ${f.join(' and ')}`);
    }
    if (q.family === 'whichTable') {
      const want = p.match(/with a[n]? (\w+)/)[1];
      const n = T.cols.filter(c => FAM[classify(T.xs, c.vals)]?.toLowerCase() === want).length;
      if (n !== 1) out.push(`${n} columns are ${want}`);
    }
    if (q.family === 'compareTableAt') {
      const kinds = T.cols.map(c => classify(T.xs, c.vals)).sort().join(',');
      if (kinds !== 'exp,lin,quad') out.push(`columns classify as ${kinds}`);
    }
    if (q.family === 'nextValue') {
      const ys = T.cols[0].vals, known = T.xs.map((x, k) => [x, ys[k]]).filter(([, y]) => y !== null);
      if (!equalSteps(T.xs)) out.push('unequal x-steps');
      if (known.length < 4) out.push('only 3 known rows: a constant 2nd difference cannot be seen');
      const f = lagrange(known.slice(0, 3).map(r => r[0]), known.slice(0, 3).map(r => r[1]));
      if (!known.every(([x, y]) => close(f(x), y))) out.push('the known rows are not quadratic');
    }
    if (q.family === 'tableToPercent') {
      const ys = T.cols[0].vals, r = ys.slice(1).map((v, k) => v / ys[k]);
      if (!allEq(r)) out.push('ratios not equal');
      const yearly = /each year/.test(p) ? r[0] : r[0] ** (1 / (T.xs[1] - T.xs[0]));
      if (/deer/.test(p) && (yearly > 1.6 || yearly < 0.6)) out.push(`a deer population ×${clean(yearly)} a year`);
      if (/investment/.test(p) && (yearly > 1.5 || yearly < 0.6)) out.push(`an investment ×${clean(round(yearly, 3))} a year`);
      if (/investment/.test(p) && ys[0] < 10) out.push(`an investment of $${ys[0]}`);
      if (/fish|deer/.test(p) && ys[0] < 10) out.push(`a population of ${ys[0]} animals`);
    }
    if (q.family === 'factorToPercent') {
      const b = Number(p.match(/multiplied by ([\d.]+)/)[1]);
      if (/savings account/.test(p) && b > 1.12) out.push(`a savings account growing ${pctOf(b)}% a year`);
      if (/town's population/.test(p) && b > 1.12) out.push(`a town growing ${pctOf(b)}% a year`);
      if (/used car's value/.test(p) && b < 0.7) out.push(`a used car losing ${clean((1 - b) * 100)}% of its value every year`);
    }
    if (q.family === 'avgRateMeaning') {
      const { r } = rateOf(p);
      const said = Number(p.match(/is (-?[\d.]+) (?:people|ft)/)[1]);
      if (!close(said, r)) out.push(`the stated rate ${said} is not the rate ${r}`);
    }
    if (q.family === 'avgRateGraph') {
      const f = curve(fnItems(q)[0].s);
      for (const pt of gItems(q).filter(i => i.kind === 'point')) if (!close(f(pt.x), pt.y)) out.push(`marked point (${pt.x}, ${pt.y}) is off the curve`);
      const m = p.match(/from x = (-?[\d.]+) to x = (-?[\d.]+)/);
      const pts = gItems(q).filter(i => i.kind === 'point');
      if (m && (!close(pts[0].x, +m[1]) || !close(pts[1].x, +m[2]))) out.push('the marked points are not the asked interval');
      if (/height/.test(q.data.picture.g.yName ?? '') && pts.some(pt => pt.y < 0)) out.push('a negative height');
    }
    if (q.family === 'linVsNonlin') {
      const g = curve(fnItems(q)[0].s);
      for (const pt of gItems(q).filter(i => i.kind === 'point')) if (!close(g(pt.x), pt.y)) out.push(`labelled point (${pt.x}, ${pt.y}) is off g`);
    }
    if (q.family === 'maxFromTable') {
      const h = defs(p).h, ys = T.cols[0].vals;
      T.xs.forEach((t, k) => { if (!close(h(t), ys[k])) out.push(`table row t = ${t} is not h(${t})`); });
      const listed = Math.max(...ys), said = Number(p.match(/greatest listed height is ([\d.]+)/)[1]);
      if (!close(listed, said)) out.push('the stated greatest listed height is not the table maximum');
      if (ys.some(y => y < 0)) out.push('a negative height in the table');
    }
    if (q.family === 'compareAt') {
      const D = defs(p), x = Number(p.match(/largest at x = (-?[\d.]+)/)[1]);
      if (!maxName(Object.fromEntries(Object.entries(D).map(([k, f]) => [k, f(x)])))) out.push('a tie for the largest value');
    }
    if (q.family === 'whoWinsLongRun') {
      const D = defs(p);
      if (minDiff(D.f, D.g) > 0 && longRun(D.f, D.g) === 'f') out.push('f leads everywhere: "for good" and "for every x" are both true');
    }
    if (q.family === 'lastCrossoverGraph') {
      const D = defs(p), rs = rootsOf(D.f, D.g), xmax = q.data.picture.g.x[1];
      const last = rs[rs.length - 1];
      if (last && (last.at ?? last.x) > xmax) out.push('the last crossover is outside the drawn window');
    }
    if (q.family === 'linearPair' && /reaches y = 0 first/.test(p)) {
      const F = linF(p), G = linG(q);
      if (G && xInt(F) === Infinity && xInt(G) === Infinity) out.push('neither line reaches y = 0 for x > 0');
      else if (G && (xInt(F) === Infinity || xInt(G) === Infinity)) out.push('one line never reaches y = 0 for x > 0 ("first" compares with never)');
    }
    if (q.family === 'contextLinValue') {
      const L = linStory(p), m = p.match(/(\d+(?:\.\d+)?) (?:hours?|gigabytes?) costs? \$(\d+(?:\.\d+)?) in all/);
      if (m && !close(L.b + L.m * m[1], +m[2])) out.push('the worked example cost does not match the story');
    }
    if (q.family === 'savingsTotal') {
      const m = p.match(/saves \$(\d+(?:\.\d+)?) in week 1 and each week \$(\d+(?:\.\d+)?) more/), a = +m[1], d = +m[2];
      T.xs.forEach((n, k) => { if (!close(n * a + d * n * (n - 1) / 2, T.cols[0].vals[k])) out.push(`table total at week ${n} is wrong`); });
    }
    if (q.family === 'enoughData') {
      const ys = T.cols[0].vals, r = ys.slice(1).map((v, k) => v / ys[k]), said = Number(p.match(/ratio is \*([\d.]+)/)[1]);
      if (!r.every(v => close(v, said))) out.push('the stated ratio is not the table ratio');
    }
    if (q.family === 'twoModelsAgree') {
      const [f, g] = yDefs(p);
      for (const m of p.matchAll(/\((-?[\d.]+), (-?[\d.]+)\)/g)) if (!close(f(+m[1]), +m[2]) || !close(g(+m[1]), +m[2])) out.push(`a model misses (${m[1]}, ${m[2]})`);
    }
    if (q.family === 'domainChoice' && /school play/.test(p)) { /* revenue story */ }
    if (q.family === 'extrapolate') {
      // the far point must really be far outside the data
      let m;
      // a battery that drops 8%/h for 12 h still has a possible charge (4% from full) and drains about linearly:
      // "No: far outside, cannot go on forever" is then not clearly right
      if ((m = p.match(/dropped about (\d+)% per hour.* after (\d+) hours/)) && 100 - m[1] * m[2] >= 0) out.push(`the line still gives a possible charge after ${m[2]} h (${100 - m[1] * m[2]}% from full), so "No" is not clearly right`);
    }
    if (q.family === 'contextExpValue') {
      const m = p.match(/at ([\d.]+)% interest/);
      if (m && +m[1] > 12) out.push(`${m[1]}% a year on savings`);
    }
  } catch (e) {
    out.push(`oracle could not read the item: ${e.message}`);
  }
  return out.join('; ');
}

export default { solve, sane };
