// Oracle for the lesson "quadratic-functions" (Algebra 1, quadratic functions and their graphs). Role O,
// docs/lessons/QUALITY_LAYER.md. Written from what the student sees only: the prompt (HTML, my own tag stripper, so a
// literal "<" in "−4 < x < 0" survives), the choice HTML, the board TeX and the picture the page draws (curves are
// drawn from standard coefficients s = [a, b, c]; points, vertical / horizontal lines at their x / y).
//
// Tools:
//  - one small parser (plain text, HTML or TeX → AST): numbers, the variables x / X / t / d, the parameter a, f(...)
//    calls, √, implicit multiplication, powers (−x^2 is −(x²), as on paper and on a calculator).
//  - the AST evaluates EXACTLY to a polynomial with rational coefficients (oracle-kit Q), so functions are compared by
//    their coefficients, never as text; or numerically (floats) for answers with √.
//  - every feature (vertex, axis, zeros, y-intercept, range, intervals) is computed from the coefficients the way a
//    careful teacher does: h = −b/(2a), k = f(h), zeros by the discriminant, a from a point, ...
//  - statements in choices are TESTED: a claimed factorisation is expanded, a claimed zero is substituted, a claimed
//    interval is compared point by point with the sign of f, a written argument is checked line by line. A choice
//    list must have exactly one true option (sane() names the item otherwise).
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ============================================================ text → expression string
const ENT = s => String(s ?? '').replace(/&#8202;|&#8201;|&thinsp;|&nbsp;|&#160;/g, ' ').replace(/&minus;/g, '−')
  .replace(/&times;/g, '×').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&le;/g, '≤').replace(/&ge;/g, '≥')
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, '&');
/** HTML → plain: fractions a/b in brackets, <sup>2</sup> → ^2, only real tags removed (a "<" before a space stays) */
function plain(h) {
  let s = String(h ?? '');
  for (let i = 0; i < 3; i++) {
    s = s.replace(/<span class="fr"><span>((?:(?!<\/?span)[\s\S])*)<\/span><span>((?:(?!<\/?span)[\s\S])*)<\/span><\/span>/g, '(($1)/($2))');
  }
  s = s.replace(/<sup>([^<]*)<\/sup>/g, '^($1)').replace(/<br\s*\/?>/g, ' ').replace(/<\/?[a-zA-Z][^>]*>/g, '');
  return ENT(s).replace(/\s+/g, ' ').trim();
}
/** TeX → plain expression text */
function tex(t) {
  let s = String(t ?? '').replace(/\\overset\{\?\}\{=\}/g, ' ?= ');
  for (let i = 0; i < 8; i++) {
    const b = s;
    s = s.replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, ' $1 ').replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
      .replace(/\^\{([^{}]*)\}/g, '^($1)').replace(/\\sqrt\{([^{}]*)\}/g, '√($1)');
    if (s === b) break;
  }
  return s.replace(/\\cdot/g, '*').replace(/\\times/g, '*').replace(/\\left|\\right/g, '').replace(/\\le(q)?(?![a-zA-Z])/g, '≤')
    .replace(/\\ge(q)?(?![a-zA-Z])/g, '≥').replace(/\\quad|\\qquad/g, ' ;; ').replace(/\\[,;:! ]|~/g, ' ').replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}
/** expression text normalised for the parser */
const norm = s => String(s).replace(/[−–]/g, '-').replace(/²/g, '^2').replace(/[×·]/g, '*').replace(/(\d),(\d{3})(?!\d)/g, '$1$2')
  .replace(/\s+/g, ' ').trim();

// ============================================================ parser → AST
function tokens(s) {
  const out = []; let i = 0; s = norm(s);
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    const m = s.slice(i).match(/^(\d+(?:\.\d+)?|\.\d+)/);
    if (m) { out.push({ t: 'n', v: m[1] }); i += m[1].length; continue; }
    if (/[a-zA-Z]/.test(c)) {
      // a function call f( / g( / h( / A( / P( when a letter is directly followed by "(" and is not a variable
      if (/[fghAP]/.test(c) && s[i + 1] === '(' ) { out.push({ t: 'f', v: c }); i++; continue; }
      out.push({ t: 'v', v: c }); i++; continue;
    }
    if ('+-*/^()√'.includes(c)) { out.push({ t: c }); i++; continue; }
    throw new Error(`cannot read "${c}" in "${s}"`);
  }
  return out;
}
function parse(s) {
  const T = tokens(s); let p = 0;
  const peek = () => T[p], eat = t => { if (T[p]?.t !== t) throw new Error(`expected ${t} in "${s}"`); return T[p++]; };
  const startsAtom = k => k && (k.t === 'n' || k.t === 'v' || k.t === 'f' || k.t === '(' || k.t === '√');
  function expr() {
    let a = term();
    while (peek() && (peek().t === '+' || peek().t === '-')) { const op = T[p++].t; a = { op, a, b: term() }; }
    return a;
  }
  function term() {
    let a = unary();
    for (;;) {
      const k = peek();
      if (k && (k.t === '*' || k.t === '/')) { p++; a = { op: k.t, a, b: unary() }; }
      else if (startsAtom(k)) a = { op: '*', a, b: power() };
      else return a;
    }
  }
  function unary() {
    if (peek()?.t === '-') { p++; return { neg: unary() }; }
    if (peek()?.t === '+') { p++; return unary(); }
    return power();
  }
  function power() {
    const base = atom();
    if (peek()?.t === '^') { p++; const e = peek()?.t === '(' ? (p++, (() => { const x = expr(); eat(')'); return x; })()) : atom(); return { pow: base, e }; }
    return base;
  }
  function atom() {
    const k = T[p++];
    if (!k) throw new Error(`unexpected end of "${s}"`);
    if (k.t === 'n') return { n: k.v };
    if (k.t === 'v') return { v: k.v };
    if (k.t === '√') return { sqrt: power() };
    if (k.t === 'f') { eat('('); const arg = expr(); eat(')'); return { call: k.v, arg }; }
    if (k.t === '(') { const x = expr(); eat(')'); return x; }
    throw new Error(`unexpected ${k.t} in "${s}"`);
  }
  const r = expr();
  if (p !== T.length) throw new Error(`trailing text in "${s}"`);
  return r;
}

// ============================================================ exact polynomials (one variable, Q coefficients)
const MAIN = new Set(['x', 'X', 't', 'd']);
const pz = () => [];
const trim = a => { while (a.length && a[a.length - 1].n === 0) a.pop(); return a; };
const qq = v => (v && typeof v === 'object' && 'n' in v ? v : Q(v));
const P = {
  c: v => trim([qq(v)]),
  x: () => [Q(0), Q(1)],
  add(a, b) { const r = []; for (let i = 0; i < Math.max(a.length, b.length); i++) r.push((a[i] ?? Q(0)).add(b[i] ?? Q(0))); return trim(r); },
  neg: a => a.map(c => c.neg()),
  sub(a, b) { return P.add(a, P.neg(b)); },
  mul(a, b) { const r = []; a.forEach((x, i) => b.forEach((y, j) => { r[i + j] = (r[i + j] ?? Q(0)).add(x.mul(y)); })); for (let i = 0; i < r.length; i++) r[i] ??= Q(0); return trim(r); },
  pow(a, e) { let r = P.c(1); for (let i = 0; i < e; i++) r = P.mul(r, a); return r; },
  compose(a, u) { let r = pz(); for (let i = a.length - 1; i >= 0; i--) r = P.add(P.mul(r, u), P.c(a[i])); return r; },
  at(a, v) { v = qq(v); let r = Q(0); for (let i = a.length - 1; i >= 0; i--) r = r.mul(v).add(a[i]); return r; },
  atF(a, v) { let r = 0; for (let i = a.length - 1; i >= 0; i--) r = r * v + a[i].value; return r; },
  eq(a, b) { return P.sub(a, b).length === 0; },
  deg: a => a.length - 1,
  co: (a, i) => a[i] ?? Q(0),
};
const PARENT = u => P.mul(u, u);  // f(x) = x²
/** AST → exact polynomial; env: { a: value of the parameter a, fns: { f: poly → poly } } */
function poly(ast, env = {}) {
  if (typeof ast === 'string') ast = parse(ast);
  const go = n => {
    if (n.n !== undefined) return P.c(Q(n.n));
    if (n.v !== undefined) {
      if (MAIN.has(n.v)) return P.x();
      if (env.vals && n.v in env.vals) return P.c(env.vals[n.v]);
      throw new Error(`unknown letter ${n.v}`);
    }
    if (n.neg) return P.neg(go(n.neg));
    if (n.sqrt) throw new Error('√ in an exact polynomial');
    if (n.call) { const fn = env.fns?.[n.call]; if (!fn) throw new Error(`unknown function ${n.call}`); return fn(go(n.arg)); }
    if (n.pow) {
      const e = go(n.e); if (e.length > 1 || (e[0] && e[0].d !== 1) || (e[0]?.n ?? 0) < 0) throw new Error('bad exponent');
      return P.pow(go(n.pow), e[0]?.n ?? 0);
    }
    const a = go(n.a), b = go(n.b);
    if (n.op === '+') return P.add(a, b);
    if (n.op === '-') return P.sub(a, b);
    if (n.op === '*') return P.mul(a, b);
    if (n.op === '/') { if (b.length !== 1) throw new Error('division by a non-constant'); return a.map(c => c.div(b[0])); }
    throw new Error('bad node');
  };
  return go(ast);
}
/** AST → float (√ allowed); the main variable gets the value xv */
function fval(ast, xv = 0) {
  if (typeof ast === 'string') ast = parse(ast);
  const go = n => {
    if (n.n !== undefined) return Number(n.n);
    if (n.v !== undefined) { if (MAIN.has(n.v)) return xv; throw new Error(`unknown letter ${n.v}`); }
    if (n.neg) return -go(n.neg);
    if (n.sqrt) return Math.sqrt(go(n.sqrt));
    if (n.pow) return go(n.pow) ** go(n.e);
    if (n.call) throw new Error('call in a number');
    const a = go(n.a), b = go(n.b);
    return n.op === '+' ? a + b : n.op === '-' ? a - b : n.op === '*' ? a * b : a / b;
  };
  return go(ast);
}
const num = s => { const p = poly(s); if (p.length > 1) throw new Error(`not a number: ${s}`); return p[0] ?? Q(0); };

// ============================================================ quadratic features
const A = f => P.co(f, 2), B = f => P.co(f, 1), C = f => P.co(f, 0);
const axisOf = f => B(f).neg().div(A(f).mul(2));
const vertexOf = f => { const h = axisOf(f); return [h, P.at(f, h)]; };
const disc = f => B(f).mul(B(f)).sub(A(f).mul(C(f)).mul(4));
function qsqrt(q) {  // exact square root of a rational, or null
  if (q.n < 0) return null;
  const rn = Math.round(Math.sqrt(q.n)), rd = Math.round(Math.sqrt(q.d));
  return rn * rn === q.n && rd * rd === q.d ? Q(rn, rd) : null;
}
/** real zeros: { exact: [Q...] | null, approx: [numbers] } (sorted ascending) */
function zerosOf(f) {
  if (P.deg(f) === 1) { const r = C(f).neg().div(B(f)); return { exact: [r], approx: [r.value] }; }
  const D = disc(f), a2 = A(f).mul(2);
  if (D.n < 0) return { exact: [], approx: [] };
  const s = qsqrt(D), h = B(f).neg().div(a2);
  const ap = [h.value - Math.sqrt(D.value) / Math.abs(a2.value), h.value + Math.sqrt(D.value) / Math.abs(a2.value)];
  if (!s) return { exact: null, approx: ap };
  const r1 = h.sub(s.div(a2)), r2 = h.add(s.div(a2));
  const ex = r1.cmp(r2) <= 0 ? [r1, r2] : [r2, r1];
  return { exact: ex, approx: ex.map(r => r.value) };
}
const zeroCount = f => Math.sign(disc(f).n) + 1;   // 0, 1 or 2

// ============================================================ reading the item
const choicesOf = q => (q.choicesHtml ?? q.choices ?? []).map(plain);
const promptOf = q => plain(q.promptHtml ?? q.prompt);
const g = q => q.data?.picture?.g ?? {};
const shown = q => g(q).show ?? [];
const item = (q, key) => shown(q).find(s => s.key === key);
const curveOf = s => trim(s.s.map(v => Q(v)).reverse());     // s = [a, b, c] → [c, b, a]
const pts = (q, re = /./) => shown(q).filter(s => s.kind === 'point' && re.test(s.key));
const LABEL = /^\s*(?:[a-zA-Z](?:_\d+)?\s*\(\s*[a-zA-Z]\s*\)|[yY](?:_\d+)?)\s*$/;   // f(x), h(t), y, Y_1 (never a bare x)
/** the first board part (before \quad) split on "=" */
function boardSides(q) { return tex(q.board).split(';;')[0].split('=').map(s => s.trim().replace(/,\s*$/, '')); }
/** the function on the board: "f(x) = RHS" → RHS; "LHS = RHS" → LHS − RHS; null when the board holds no function */
function boardFn(q, env) {
  const s = boardSides(q);
  if (s.length < 2) return null;
  try {
    if (LABEL.test(s[0])) return poly(s[1], env);
    const f = P.sub(poly(s[0], env), poly(s[1], env));
    return P.deg(f) === 2 ? f : null;     // "x = −3" is an axis, not a function
  } catch { return null; }
}
/** "f(x) = ..." in a plain prompt, up to the given stop word */
function promptFn(q, stop) {
  const m = promptOf(q).match(new RegExp(`f\\(x\\) = (.+?)${stop}`));
  return m ? poly(m[1]) : null;
}
const numsIn = s => [...norm(s).matchAll(/-?\d+(?:\.\d+)?/g)].map(m => Number(m[0]));
const qn = v => (typeof v === 'number' ? v : v.value);
const near = (a, b) => Math.abs(qn(a) - qn(b)) < 1e-9;

/** one right choice: the index of the only true one; -1 when none or more than one is true */
function one(flags) { const hits = flags.map((f, i) => (f ? i : -1)).filter(i => i >= 0); return hits.length === 1 ? hits[0] : -1; }
const count = flags => flags.filter(Boolean).length;

// ============================================================ choice readers
/** "x = 2 ± √3", "x = −2 only", "x = 0 and x = 5", "no real zeros" → sorted numbers */
function zeroSetOf(text) {
  const t = norm(text).replace(/\.$/, '');
  if (/^no real zeros?$/.test(t)) return [];
  const parts = t.replace(/ only$/, '').split(/ and | or /).map(s => s.replace(/^x = /, '').trim());
  const vals = [];
  for (const part of parts) {
    if (part.includes('±')) { vals.push(fval(part.replace('±', '+')), fval(part.replace('±', '-'))); }
    else vals.push(fval(part));
  }
  return vals.sort((a, b) => a - b);
}
const sameSet = (a, b) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-9);
/** a choice that is a function: "f(x) = …", "y = …", "g(x) = f(2x)", "2(x − 4)² − 37" → polynomial (null if not one) */
function choiceFn(text, env = { fns: { f: PARENT } }) {
  const t = norm(text).replace(/\.$/, '');
  const m = t.match(/^(?:[a-zA-Z]\(x\)|y) = (.+)$/);
  try { return poly(m ? m[1] : t, env); } catch { return null; }
}

// ============================================================ solve
function solve(q) {
  const fam = q.family, ch = choicesOf(q), pr = promptOf(q);
  switch (fam) {
    case 'tableY': {
      const parts = tex(q.board).split(';;');
      const f = poly(parts[0].split('=')[1].replace(/,\s*$/, '')), x0 = num(parts[1].split('=')[1]);
      return P.at(f, x0).value;
    }
    case 'linVsQuad': {
      const ps = pts(q, /^t\d/);
      return one(ch.map(c => { const f = choiceFn(c); return !!f && ps.every(p => P.at(f, Q(p.x)).eq(Q(p.y))); }));
    }
    case 'vertexRead': case 'vfVertex': case 'facVertex': {
      const [h, k] = vertexOf(boardFn(q)); return [h.value, k.value];
    }
    case 'extremeVal': {
      const f = boardFn(q) ?? curveOf(item(q, 'f'));
      const [, k] = vertexOf(f), kind = A(f).n > 0 ? 'minimum' : 'maximum';
      return one(ch.map(c => { const m = norm(c).match(/^an? (maximum|minimum) value of (-?\d+(?:\.\d+)?)$/); return !!m && m[1] === kind && Q(Number(m[2])).eq(k); }));
    }
    case 'axisRead': {
      const h = axisOf(boardFn(q));
      return one(ch.map(c => { const m = norm(c).match(/^x = (-?\d+(?:\.\d+)?)$/); return !!m && Q(Number(m[1])).eq(h); }));
    }
    case 'axisTable': return axisOf(fitTable(q)).value;
    case 'zeroCount': case 'countZeros': case 'hiddenZero': {
      const n = zeroCount(boardFn(q));
      return one(ch.map(c => (n === 2 ? /^two/ : n === 1 ? /^one/ : /^no/).test(c)));
    }
    case 'zerosRead': case 'sqrtZeros': case 'facZeros': case 'factorZeros': {
      const z = zerosOf(boardFn(q));
      if (!z.approx.length) return undefined;   // no real zeros: sane() names it
      return z.exact ? (z.exact.length === 1 ? [z.exact[0].value, z.exact[0].value] : z.exact.map(r => r.value)) : z.approx;
    }
    case 'sqrtExact': case 'facRepeat': {
      const z = zerosOf(boardFn(q)).approx;
      return one(ch.map(c => { try { return sameSet(dedupe(zeroSetOf(c)), dedupe(z)); } catch { return false; } }));
    }
    case 'mirrorPt': {
      const f = boardFn(q), P0 = item(q, 'P');
      const h = f ? axisOf(f) : num(boardSides(q)[1]);
      return [h.mul(2).sub(Q(P0.x)).value, P0.y];
    }
    case 'axisMid': {
      const f = boardFn(q);
      if (f) return axisOf(f).value;
      const [z0, z1] = pts(q, /^z/); return Q(z0.x).add(Q(z1.x)).div(2).value;
    }
    case 'openDir': {
      const up = A(boardFn(q)).n > 0;
      return one(ch.map(c => { const m = c.match(/opens (up|down): the vertex is a (maximum|minimum)/); return !!m && (m[1] === 'up') === up && (m[2] === 'minimum') === up; }));
    }
    case 'offsetY': {
      const parts = tex(q.board).split(';;'), f = poly(parts[0].split('=')[1].replace(/,\s*$/, ''));
      const x0 = num(parts[1].match(/f\s*\(([^)]*)\)/)[1]);
      return P.at(f, x0).value;
    }
    case 'narrowest': {
      const as = tex(q.board).split(/,(?=\s*y\s*=)/).map(s => A(poly(s.split('=')[1])).value).map(Math.abs);
      const want = /widest/.test(pr) ? Math.min(...as) : Math.max(...as);
      return one(ch.map(c => { const f = choiceFn(c); return !!f && Math.abs(A(f).value) === want; }));
    }
    case 'transformName': {
      const g0 = boardFn(q, { fns: { f: PARENT } });
      return one(ch.map(c => { const t = transformOf(c); return !!t && P.eq(t, g0); }));
    }
    case 'mapPoint': case 'fbxPoint': {
      const tr = structOf(boardSides(q)[1]), p0 = item(q, 'P');
      const x1 = Q(p0.x).sub(tr.e).div(tr.b), y1 = tr.A.mul(Q(p0.y)).add(tr.d);
      return [x1.value, y1.value];
    }
    case 'fbxSame': {
      const g0 = boardFn(q, { fns: { f: PARENT } });
      return one(ch.map(c => { const f = choiceFn(c); return !!f && P.eq(f, g0); }));
    }
    case 'yInt': return C(boardFn(q)).value;
    case 'cMeaning': return cMeaningPick(q).pick;
    case 'stdAxis': return axisOf(boardFn(q)).value;
    case 'stdPair': {
      const z = zerosOf(boardFn(q)).exact ?? [];
      const other = z.filter(r => r.n !== 0);
      return other.length === 1 ? other[0].value : undefined;
    }
    case 'techWindow': {
      const f = boardFn(q), [h, k] = vertexOf(f), z = zerosOf(f).approx;
      const need = [[h.value, k.value], [0, C(f).value], ...z.map(r => [r, 0])];
      return one(ch.map(c => {
        const n = numsIn(c); if (n.length !== 4) return false;
        return need.every(([x, y]) => x >= n[0] - 1e-9 && x <= n[1] + 1e-9 && y >= n[2] - 1e-9 && y <= n[3] + 1e-9);
      }));
    }
    case 'techTrace': {
      const f = boardFn(q), x0 = Number(norm(pr).match(/at x = (-?\d+(?:\.\d+)?)\?/)[1]);
      return P.at(f, Q(x0)).value;
    }
    case 'whichGraph': {
      const f = boardFn(q);
      return one(ch.map(c => { const m = c.match(/^Graph ([A-Z])$/); const cv = m && shown(q).find(s => s.kind === 'curve' && s.name === m[1]); return !!cv && P.eq(curveOf(cv), f); }));
    }
    case 'rangeOf': {
      const f = boardFn(q), [, k] = vertexOf(f), want = /domain/.test(pr) ? { all: true } : { v: 'y', rel: A(f).n > 0 ? '≥' : '≤', k };
      return one(ch.map(c => {
        if (/^all real numbers$/.test(c)) return !!want.all;
        const m = norm(c).match(/^([xy]) ([≤≥<>]) (-?\d+(?:\.\d+)?)$/);
        return !!m && !want.all && m[1] === want.v && m[2] === want.rel && Q(Number(m[3])).eq(want.k);
      }));
    }
    case 'riseFall': {
      const r = riseOf(q);
      return one(ch.map(c => new RegExp('^' + r).test(c)));
    }
    case 'incInterval': {
      const f = boardFn(q), h = axisOf(f), up = A(f).n > 0, inc = /increasing/.test(pr);
      const rel = (inc === up) ? '>' : '<';
      return one(ch.map(c => { const m = norm(c).match(/^x ([<>]) (-?\d+(?:\.\d+)?)$/); return !!m && m[1] === rel && Q(Number(m[2])).eq(h); }));
    }
    case 'posNeg': {
      const f = promptFn(q, ' (?:positive|negative)\\?'), pos = /positive\?/.test(pr);
      return one(ch.map(c => intervalMatches(c, f, pos)));
    }
    case 'expandVF': case 'csVertexForm': {
      const f = boardFn(q);
      return one(ch.map(c => { const p = choiceFn(c); return !!p && P.eq(p, f); }));
    }
    case 'proofOrCheck': return one(proofFlags(q));
    case 'findA': case 'findACtx': case 'zerosToA': return findA(q).a?.value;
    case 'zerosToForm': {
      const zs = pts(q, /^z/).map(p => Q(p.x)), c0 = item(q, 'C');
      return one(ch.map(c => {
        const p = choiceFn(c); if (!p || P.deg(p) !== 2) return false;
        const z = zerosOf(p).exact; if (!z) return false;
        const want = (zs.length === 1 ? [zs[0], zs[0]] : zs).map(r => r.value).sort((a, b) => a - b);
        return sameSet(z.length === 1 ? [z[0].value, z[0].value] : z.map(r => r.value), want) && P.at(p, 0).eq(Q(c0.y));
      }));
    }
    case 'methodPick': return one(methodFlags(q));
    case 'csMin': return vertexOf(boardFn(q))[1].value;
    case 'chooseForm': return one(chooseFlags(q));
    case 'bestFormValue': {
      const f = boardFn(q), [h, k] = vertexOf(f), z = zerosOf(f);
      if (/y-intercept/.test(pr)) return C(f).value;
      if (/larger zero/.test(pr)) return Math.max(...z.approx);
      if (/smaller zero/.test(pr)) return Math.min(...z.approx);
      if (/axis of symmetry/.test(pr)) return h.value;
      if (/(maximum|minimum) value/.test(pr)) return k.value;
      return undefined;   // a question this oracle does not know: reported as not covered
    }
    case 'zeroProd': return one(zeroProdFlags(q));
    case 'boundWhy': return one(boundFlags(q));
    case 'symProof': return one(symFlags(q));
    case 'projectile': {
      const f = boardFn(q), [h, k] = vertexOf(f);
      if (/hit the ground/.test(pr)) { const z = zerosOf(f).approx.filter(t => t > 0); return z.length === 1 ? z[0] : undefined; }
      if (/highest point/.test(pr)) return h.value;
      if (/How high/.test(pr)) return k.value;
      return undefined;
    }
    case 'penMax': return penOf(q).max.value;
    case 'compareMax': {
      const r = compareOf(q);
      return one(ch.map(c => {
        if (/^they have the same/.test(c)) return r.cmp === 0;
        const m = c.match(/^([fg]) has the (greater|smaller)/); if (!m) return false;
        return r.cmp !== 0 && (m[1] === r.winner);
      }));
    }
    default: return undefined;
  }
}
const dedupe = a => a.filter((v, i) => i === 0 || Math.abs(v - a[i - 1]) > 1e-9);

// ---- helpers per family
/** a quadratic through the table points (first three, exact), null when they are collinear */
function fitTable(q) {
  const ps = pts(q, /^t\d/).map(p => [Q(p.x), Q(p.y)]);
  const [[x0, y0], [x1, y1], [x2, y2]] = ps;
  // Lagrange
  let f = pz();
  for (const [xi, yi, xj, xk] of [[x0, y0, x1, x2], [x1, y1, x0, x2], [x2, y2, x0, x1]]) {
    const num_ = P.mul(P.sub(P.x(), P.c(xj)), P.sub(P.x(), P.c(xk)));
    const den = xi.sub(xj).mul(xi.sub(xk));
    f = P.add(f, num_.map(c => c.mul(yi).div(den)));
  }
  return f;
}
/** a choice naming moves of y = x² → the polynomial they give */
function transformOf(text) {
  let f = PARENT(P.x());
  for (const part of norm(text).split(' and ')) {
    let m;
    if ((m = part.match(/^an? shift (up|down|left|right) (.+)$/))) {
      const n = num(m[2]);
      if (m[1] === 'up') f = P.add(f, P.c(n)); else if (m[1] === 'down') f = P.sub(f, P.c(n));
      else f = P.compose(f, P.sub(P.x(), P.c(m[1] === 'right' ? n : n.neg())));
    } else if (/^an? reflection across the x-axis$/.test(part)) f = P.neg(f);
    else if (/^an? reflection across the y-axis$/.test(part)) f = P.compose(f, P.neg(P.x()));
    else if ((m = part.match(/^an? vertical stretch by (.+)$/))) f = f.map(c => c.mul(num(m[1])));
    else if ((m = part.match(/^an? vertical (?:compression|shrink) by (.+)$/))) { const n = num(m[1]); f = f.map(c => c.mul(n.cmp(1) > 0 ? Q(1).div(n) : n)); }
    else return null;
  }
  return f;
}
/** "A f(b x + e) + d" on the board → { A, b, e, d } */
function structOf(rhs) {
  const s = norm(rhs), i = s.indexOf('f(');
  let depth = 0, j = i + 1;
  for (; j < s.length; j++) { if (s[j] === '(') depth++; else if (s[j] === ')' && --depth === 0) break; }
  const pre = s.slice(0, i).trim(), inner = poly(s.slice(i + 2, j)), suf = s.slice(j + 1).trim();
  const Aq = pre === '' ? Q(1) : pre === '-' ? Q(-1) : num(pre.replace(/\*$/, ''));
  return { A: Aq, b: P.co(inner, 1), e: P.co(inner, 0), d: suf ? num('0 ' + suf) : Q(0) };
}
/** the claims of a cMeaning choice, each tested */
function cMeaningPick(q) {
  const f = boardFn(q), [h, k] = vertexOf(f), ch = choicesOf(q);
  const truth = ch.map(c => {
    const t = norm(c); let m;
    if ((m = t.match(/^the y-intercept: the graph passes through \((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\)$/))) return Number(m[1]) === 0 && Q(Number(m[2])).eq(C(f));
    if ((m = t.match(/^the axis of symmetry: x = (-?\d+(?:\.\d+)?)$/))) return Q(Number(m[1])).eq(h);
    if ((m = t.match(/^the vertex height: the (minimum|maximum) value of f is (-?\d+(?:\.\d+)?)$/))) return (m[1] === 'minimum') === (A(f).n > 0) && Q(Number(m[2])).eq(k);
    if ((m = t.match(/^a zero: the graph crosses the x-axis at \((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\)$/))) return Number(m[2]) === 0 && P.at(f, Q(Number(m[1]))).n === 0;
    return false;
  });
  // the number at the end is c, the y-intercept: that is what it tells you (another claim that happens to be true too
  // does not come from c; sane() names such an item)
  const yi = ch.findIndex((c, i) => truth[i] && /^the y-intercept/.test(c));
  return { pick: yi, truth };
}
/** rising / falling / level between the two marked x */
function riseOf(q) {
  const f = curveOf(item(q, 'f')), xs = shown(q).filter(s => s.kind === 'vline').map(s => s.x).sort((a, b) => a - b);
  const slope = x => 2 * A(f).value * x + B(f).value;
  const s1 = slope(xs[0]), s2 = slope(xs[1]);
  if (Math.abs(s1) < 1e-12 && Math.abs(s2) < 1e-12) return 'level';
  if (s1 >= -1e-12 && s2 >= -1e-12) return 'rising';
  if (s1 <= 1e-12 && s2 <= 1e-12) return 'falling';
  return 'both';
}
/** does the interval in a choice equal { x : f(x) > 0 } (pos) or { x : f(x) < 0 }? */
function intervalPred(text) {
  const t = norm(text); let m;
  const N = s => Number(s);
  if (/^every x$/.test(t)) return () => true;
  if (/^no x$/.test(t)) return () => false;
  if ((m = t.match(/^every x except (-?\d+(?:\.\d+)?)$/))) return x => x !== N(m[1]);
  if ((m = t.match(/^(-?\d+(?:\.\d+)?) (<|≤) x (<|≤) (-?\d+(?:\.\d+)?)$/))) return x => (m[2] === '<' ? x > N(m[1]) : x >= N(m[1])) && (m[3] === '<' ? x < N(m[4]) : x <= N(m[4]));
  if ((m = t.match(/^x (<|≤) (-?\d+(?:\.\d+)?) or x (>|≥) (-?\d+(?:\.\d+)?)$/))) return x => (m[1] === '<' ? x < N(m[2]) : x <= N(m[2])) || (m[3] === '>' ? x > N(m[4]) : x >= N(m[4]));
  if ((m = t.match(/^x (<|≤|>|≥) (-?\d+(?:\.\d+)?)$/))) { const v = N(m[2]); return x => ({ '<': x < v, '≤': x <= v, '>': x > v, '≥': x >= v })[m[1]]; }
  return null;
}
function intervalMatches(text, f, pos) {
  const pred = intervalPred(text); if (!pred) return false;
  const z = zerosOf(f), marks = [...z.approx, ...numsIn(text)];
  const test = new Set([-1000, 1000]);
  for (const v of marks) for (const dx of [0, -0.25, 0.25, -0.001, 0.001]) test.add(v + dx);
  for (let i = 0; i < marks.length; i++) for (let j = 0; j < marks.length; j++) test.add((marks[i] + marks[j]) / 2);
  for (const x of test) {
    const exactZero = z.exact?.some(r => Math.abs(r.value - x) < 1e-12);
    const y = exactZero ? 0 : P.atF(f, x);
    const want = pos ? y > 1e-12 : y < -1e-12;
    if (pred(x) !== want) return false;
  }
  return true;
}
/** proofOrCheck: each choice tested */
function proofFlags(q) {
  const [L, R] = tex(q.board).split('?=').map(s => poly(s));
  return choicesOf(q).map(c => {
    const t = norm(c); let m;
    if (/^Proven/.test(t)) return false;
    if ((m = t.match(/Expanding (.+?) gives (.+?), the same expression, so they agree for every x\.$/))) {
      return P.eq(poly(m[1]), L) && P.eq(poly(m[2]), L) && P.eq(L, R);
    }
    if ((m = t.match(/Expanding (.+?) gives (.+?), which is not (.+?): they are different functions\.$/))) {
      return P.eq(poly(m[1]), L) && P.eq(poly(m[2]), L) && P.eq(poly(m[3]), R) && !P.eq(L, R);
    }
    throw new Error(`proofOrCheck: unknown choice "${c}"`);
  });
}
/** a in "a(...)" from a point the student sees: { a, pts, f0, f1 } */
function findA(q) {
  const rhs = boardSides(q)[1];
  const f0 = poly(rhs, { vals: { a: Q(0) } }), f1 = poly(rhs, { vals: { a: Q(1) } }), unit = P.sub(f1, f0);
  let use = item(q, 'P') ? [item(q, 'P')] : pts(q, /^t\d/);
  use = use.filter(p => P.at(unit, Q(p.x)).n !== 0);
  if (!use.length) return { a: undefined };
  const aOf = p => Q(p.y).sub(P.at(f0, Q(p.x))).div(P.at(unit, Q(p.x)));
  const a = aOf(use[0]);
  return { a, all: use.map(aOf), f: P.add(f0, unit.map(c => c.mul(a))) };
}
/** methodPick: each way tested */
function methodFlags(q) {
  const f = boardFn(q), z = zerosOf(f).approx;
  return choicesOf(q).map(c => {
    const t = norm(c); let m;
    if ((m = t.match(/^Factor it: (.+), so x = (-?\d+(?:\.\d+)?) or x = (-?\d+(?:\.\d+)?)\.$/))) {
      return P.eq(poly(m[1]), f) && sameSet([Number(m[2]), Number(m[3])].sort((a, b) => a - b), z);
    }
    if ((m = t.match(/^Complete the square: (.+) = (-?\d+(?:\.\d+)?), so (.+)\.$/))) {
      if (!P.eq(P.sub(poly(m[1]), P.c(Q(Number(m[2])))).map(c2 => c2.mul(A(f))), f)) return false;
      try { return sameSet(zeroSetOf(m[3]), z); } catch { return false; }
    }
    if (/^It does not factor, so f has no zeros\.$/.test(t)) return z.length === 0;
    throw new Error(`methodPick: unknown choice "${c}"`);
  });
}
/** chooseForm: the form that shows the asked feature with no work */
/** what a written form shows with no work: a(x − h)² + k the vertex, a(x − r)(x − s) the zeros, ax² + bx + c the
 *  y-intercept (and ax² + k, which is a(x − 0)² + k, shows the vertex too) */
function formShows(text) {
  const t = norm(text), s = new Set();
  if (/\)\^2/.test(t)) s.add('vertex');
  else if (/\)\s*\(|x\s*\(/.test(t)) s.add('factored');
  else { s.add('standard'); const p = choiceFn(text); if (p && B(p).n === 0) s.add('vertex'); }
  return s;
}
function chooseFlags(q) {
  const pr = promptOf(q);
  const want = /zeros/.test(pr) ? 'factored' : /y-intercept/.test(pr) ? 'standard' : /(maximum|minimum) value|vertex|axis/.test(pr) ? 'vertex' : null;
  if (!want) throw new Error('chooseForm: unknown feature');
  return choicesOf(q).map(c => formShows(c).has(want));
}
/** zeroProd: the argument must be the zero-product property with the right facts */
function zeroProdFlags(q) {
  const f = boardFn(q);
  return choicesOf(q).map(c => {
    const t = norm(c); let m;
    if ((m = t.match(/^A product is 0 exactly when one of its factors is 0\. (-?[\d./()]+) is never 0; (.+?) = 0 only at x = (-?[\d./()]+); (.+?) = 0 only at x = (-?[\d./()]+)\. Any other x multiplies nonzero numbers\.$/))) {
      const K = num(m[1]), F1 = poly(m[2]), F2 = poly(m[4]), r1 = num(m[3]), r2 = num(m[5]);
      return K.n !== 0 && P.deg(F1) === 1 && P.deg(F2) === 1 && P.at(F1, r1).n === 0 && P.at(F2, r2).n === 0
        && P.eq(P.mul(P.c(K), P.mul(F1, F2)), f);
    }
    if (/is a zero too, because it is one of the factors\.$/.test(t)) return false;            // a constant factor is never 0
    if (/^Both factors have to be 0 at the same x/.test(t)) return false;                        // one factor 0 is enough
    if (/^It is the rule: flip the signs/.test(t)) return false;                                  // a rule, not a reason
    throw new Error(`zeroProd: unknown choice "${c}"`);
  });
}
/** boundWhy: only a complete argument (the square is ≥ 0, the sign of a, the bound, and that it is reached) proves it */
function boundFlags(q) {
  const f = boardFn(q), [h, k] = vertexOf(f), a = A(f), up = a.n > 0;
  return choicesOf(q).map(c => {
    const t = norm(c); let m;
    if ((m = t.match(/^\((.+?)\)\^2 ≥ 0 for every x, and a = (-?[\d./]+) is (positive|negative), so (.+?) (≥|≤) 0 and f\(x\) (≥|≤) (-?[\d./]+)\. At x = (-?[\d./]+), f = (-?[\d./]+): so (-?[\d./]+) is the (minimum|maximum)\.$/))) {
      const inner = poly(m[1]), aS = num(m[2]), term = poly(m[4]);
      const sq = P.mul(inner, inner);
      return P.deg(inner) === 1 && P.co(inner, 1).eq(1) && P.at(inner, h).n === 0 && aS.eq(a) && (m[3] === 'positive') === up
        && P.eq(term, sq.map(x => x.mul(a))) && P.eq(P.add(term, P.c(k)), f)
        && (m[5] === '≥') === up && (m[6] === '≥') === up && num(m[7]).eq(k) && num(m[8]).eq(h) && num(m[9]).eq(k)
        && num(m[10]).eq(k) && (m[11] === 'minimum') === up;
    }
    if (/^\(.+?\)\^2 ≥ 0, so f\(x\) [≥≤] /.test(t)) return false;   // leaves out a and never shows the value is reached
    if (/^f\(.+?\) and f\(.+?\) are both /.test(t)) return false;     // two checks are not a bound for every x
    throw new Error(`boundWhy: unknown choice "${c}"`);
  });
}
/** symProof: the general computation with d, checked */
function symFlags(q) {
  const f = promptFn(q, ' is symmetric'), h = axisOf(f);
  return choicesOf(q).map(c => {
    const t = norm(c); let m;
    if ((m = t.match(/^For every number d: f\((-?\d+(?:\.\d+)?) \+ d\) = (.+?) and f\((-?\d+(?:\.\d+)?) - d\) = (.+?) = (.+?)\. Equal outputs at equal distances from x = (-?\d+(?:\.\d+)?)\.$/))) {
      const h1 = num(m[1]), h2 = num(m[3]), h3 = num(m[6]);
      if (!h1.eq(h) || !h2.eq(h) || !h3.eq(h)) return false;
      const fp = P.compose(f, P.add(P.c(h), P.x())), fm = P.compose(f, P.sub(P.c(h), P.x()));
      return P.eq(poly(m[2]), fp) && P.eq(poly(m[4]), fm) && P.eq(poly(m[5]), fm);
    }
    if (/^f\(.+?\) = f\(.+?\) \+ f\(d\)/.test(t)) return false;        // f(h + d) = f(h) + f(d) is false for a quadratic
    if (/^f\(.+?\) = f\(.+?\) = .+?, so the graph is symmetric/.test(t)) return false;   // one pair is a check
    if (/^\(-d\)\^2 = -d\^2/.test(t)) return false;                    // (−d)² = d²
    throw new Error(`symProof: unknown choice "${c}"`);
  });
}
/** penMax: the largest area on the allowed x */
function penOf(q) {
  const f = boardFn(q), pr = norm(promptOf(q));
  const fence = Number(pr.match(/has (\d+(?:\.\d+)?) ft of fence/)[1]);
  let lo = Q(0); const hi = Q(fence).div(2);
  const w = pr.match(/barn wall is only (\d+(?:\.\d+)?) ft long/);
  if (w) lo = Q(fence).sub(Q(Number(w[1]))).div(2);
  let x = axisOf(f);
  if (x.cmp(lo) < 0) x = lo; if (x.cmp(hi) > 0) x = hi;
  return { f, fence, lo, hi, x, max: P.at(f, x), wall: w ? Number(w[1]) : null };
}
/** compareMax */
function compareOf(q) {
  const f = boardFn(q), gg = curveOf(item(q, 'g')), kf = vertexOf(f)[1], kg = vertexOf(gg)[1];
  const higher = /higher/.test(promptOf(q));
  const cmp = kf.cmp(kg);
  const winner = cmp === 0 ? null : higher ? (cmp > 0 ? 'f' : 'g') : (cmp < 0 ? 'f' : 'g');
  return { f, g: gg, kf, kg, cmp, winner, higher };
}

// ============================================================ sane
const inWin = (q, x, y) => { const w = g(q); return !w.x || (x >= w.x[0] - 1e-9 && x <= w.x[1] + 1e-9 && y >= w.y[0] - 1e-9 && y <= w.y[1] + 1e-9); };
const onGrid = v => Math.abs(v * 2 - Math.round(v * 2)) < 1e-9;   // a whole number or a half: readable on a grid
function sane(q) {
  const fam = q.family, ch = choicesOf(q), pr = promptOf(q), bad = [];
  let want;
  try { want = solve(q); } catch (e) { return `cannot read the item: ${e.message}`; }
  if (q.input === 'choice') {
    const flags = choiceFlags(q);
    if (flags && count(flags) !== 1) bad.push(`${count(flags)} choices are true`);
    else if (!flags && want === -1) bad.push('no single right choice');
  }
  // the drawn curve f is the function on the board
  const bf = (() => { try { return boardFn(q); } catch { return null; } })(), cf = item(q, 'f');
  if (bf && cf && cf.kind === 'curve' && !['riseFall', 'posNeg', 'proofOrCheck'].includes(fam) && !P.eq(curveOf(cf), bf)) bad.push('the graph is not the function on the board');
  switch (fam) {
    case 'vertexRead': { const [h, k] = vertexOf(bf); if (!inWin(q, h.value, k.value) || !onGrid(h.value) || !onGrid(k.value)) bad.push('the vertex cannot be read off the graph'); break; }
    case 'zerosRead': {
      const z = zerosOf(bf);
      if (!z.approx.length) bad.push('no real zeros to read');
      else if (!z.exact || z.exact.some(r => !inWin(q, r.value, 0) || !onGrid(r.value))) bad.push('a zero cannot be read off the graph');
      if (z.exact?.length === 1) bad.push('one double zero asked as two');
      break;
    }
    case 'sqrtZeros': case 'facZeros': case 'factorZeros': {
      const z = zerosOf(bf);
      if (!z.approx.length) bad.push('no real zeros but two boxes');
      else if (!z.exact) bad.push('irrational zeros asked as typed numbers');
      else if (z.exact.length === 1) bad.push('one double zero asked as two');
      break;
    }
    case 'extremeVal': {
      const vb = norm(tex(q.board)).match(/vertex \((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\)/);
      if (vb) { const [h, k] = vertexOf(curveOf(cf)); if (!h.eq(Q(Number(vb[1]))) || !k.eq(Q(Number(vb[2])))) bad.push('the marked vertex is not the vertex of the graph'); }
      break;
    }
    case 'axisTable': {
      const f = fitTable(q);
      if (P.deg(f) !== 2) bad.push('the table is not a parabola');
      else if (!pts(q, /^t\d/).every(p => P.at(f, Q(p.x)).eq(Q(p.y)))) bad.push('the table is not one quadratic');
      break;
    }
    case 'mirrorPt': {
      const p0 = item(q, 'P'), ax = item(q, 'axis');
      if (cf && !P.at(curveOf(cf), Q(p0.x)).eq(Q(p0.y))) bad.push('the given point is not on the parabola');
      if (cf && ax && !axisOf(curveOf(cf)).eq(Q(ax.x))) bad.push('the drawn axis is not the axis of the parabola');
      const said = norm(pr).match(/(?:axis of symmetry is|symmetric about) x = (-?\d+(?:\.\d+)?)/);
      if (said && cf && !axisOf(curveOf(cf)).eq(Q(Number(said[1])))) bad.push('the stated axis is wrong');
      if (Array.isArray(want) && near(want[0], p0.x)) bad.push('the point is on the axis: it is its own mirror');
      break;
    }
    case 'axisMid': {
      const z = pts(q, /^z/).map(p => p.x);
      if (bf) { const zz = zerosOf(bf).exact; if (!zz || !sameSet(zz.map(r => r.value), [...z].sort((a, b) => a - b))) bad.push('the marked zeros are not the zeros of f'); }
      const said = numsIn(pr.replace(/f\(x\) = [^.]*\./, '').replace(/x = \?.*/, ''));
      if (said.length >= 2 && !sameSet(said.slice(-2).sort((a, b) => a - b), [...z].sort((a, b) => a - b))) bad.push('the zeros in the text and the picture differ');
      break;
    }
    case 'offsetY': {
      const m = norm(pr).match(/vertex at \((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\)/), [h, k] = vertexOf(bf);
      if (m && (!h.eq(Q(Number(m[1]))) || !k.eq(Q(Number(m[2]))))) bad.push('the stated vertex is wrong');
      const d = norm(pr).match(/f\((-?\d+(?:\.\d+)?)\), (\d+) units? (right|left) of the vertex/);
      if (d && !Q(Number(d[1])).sub(h).eq(Q(Number(d[2]) * (d[3] === 'right' ? 1 : -1)))) bad.push('the distance from the vertex is wrong');
      break;
    }
    case 'narrowest': {
      const as = tex(q.board).split(/,(?=\s*y\s*=)/).map(s => Math.abs(A(poly(s.split('=')[1])).value));
      const t = /widest/.test(pr) ? Math.min(...as) : Math.max(...as);
      if (as.filter(v => v === t).length > 1) bad.push('two parabolas are equally narrow / wide');
      break;
    }
    case 'countZeros': {
      const m = norm(pr).match(/axis of symmetry is x = (-?\d+(?:\.\d+)?)/);
      if (m && !axisOf(bf).eq(Q(Number(m[1])))) bad.push('the stated axis is wrong');
      break;
    }
    case 'stdPair': {
      const m = norm(pr).match(/has f\(0\) = (-?\d+(?:\.\d+)?)/), parts = boardSides(q);
      if (m && !num(parts[1]).eq(Q(Number(m[1])))) bad.push('the level is not f(0)');
      const fullF = promptFn(q, ' has f');
      if (fullF && m && !C(fullF).eq(Q(Number(m[1])))) bad.push('f(0) is stated wrong');
      if (want === undefined) bad.push('no other x with the same output (b = 0)');
      break;
    }
    case 'techWindow': {
      const m = norm(pr).match(/factors as (.+?)\. A calculator/);
      if (m && !P.eq(poly(m[1]), bf)) bad.push('the stated factorisation is wrong');
      break;
    }
    case 'techTrace': {
      const fP = promptFn(q, ', Sam types');
      if (fP && !P.eq(fP, bf)) bad.push('Sam typed a different function');
      break;
    }
    case 'whichGraph': {
      const m = norm(pr).match(/It factors as (.+?)\.\)/);
      if (m && !P.eq(poly(m[1]), bf)) bad.push('the stated factorisation is wrong');
      const [h, k] = vertexOf(bf); if (!inWin(q, h.value, k.value)) bad.push("the right graph's vertex is off the screen");
      break;
    }
    case 'riseFall': if (riseOf(q) === 'both') bad.push('the graph rises and falls between the marks'); break;
    case 'posNeg': {
      const f = promptFn(q, ' (?:positive|negative)\\?');
      if (cf && !P.eq(curveOf(cf), f)) bad.push('the graph is not the function in the question');
      break;
    }
    case 'proofOrCheck': {
      const [L, R] = tex(q.board).split('?=').map(s => poly(s));
      if (cf && !P.eq(curveOf(cf), L)) bad.push('the graph is not f');
      const m = norm(pr).match(/both give (-?\d+(?:\.\d+)?) at x = (-?\d+(?:\.\d+)?) and (-?\d+(?:\.\d+)?) at x = (-?\d+(?:\.\d+)?)/);
      if (m) for (const [y, x] of [[m[1], m[2]], [m[3], m[4]]]) if (!P.at(L, Q(Number(x))).eq(Q(Number(y))) || !P.at(R, Q(Number(x))).eq(Q(Number(y)))) bad.push(`the check at x = ${x} is not true`);
      break;
    }
    case 'findA': case 'findACtx': case 'zerosToA': {
      const r = findA(q);
      if (r.a === undefined) { bad.push('no point to find a from'); break; }
      if (r.a.n === 0) bad.push('a = 0: not a parabola');
      if (r.all.some(x => !x.eq(r.a))) bad.push('the points do not fit one parabola');
      for (const z of pts(q, /^z/)) if (P.at(r.f, Q(z.x)).n !== 0) bad.push('a marked zero is not a zero');
      const V = item(q, 'V'); if (V && !(P.at(r.f, Q(V.x)).eq(Q(V.y)) && axisOf(r.f).eq(Q(V.x)))) bad.push('the marked vertex is not the vertex');
      if (fam === 'findACtx') bad.push(...ctxA(q, r));
      break;
    }
    case 'zerosToForm': {
      const m = norm(tex(q.board)).match(/zeros (-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?);.*?f\(0\) = (-?\d+(?:\.\d+)?)/), z = pts(q, /^z/), C0 = item(q, 'C');
      if (m && (!sameSet([Number(m[1]), Number(m[2])].sort((a, b) => a - b), z.map(p => p.x).sort((a, b) => a - b)) || Number(m[3]) !== C0.y)) bad.push('the board and the picture differ');
      if (z.some(p => p.x === 0) && C0.y !== 0) bad.push('a zero at 0 but a y-intercept that is not 0');
      break;
    }
    case 'csMin': case 'bestFormValue': {
      const isMax = /maximum value/.test(pr), isMin = /minimum value/.test(pr);
      if ((isMax && A(bf).n > 0) || (isMin && A(bf).n < 0)) bad.push('asks for a maximum of an upward parabola (or a minimum of a downward one)');
      if (fam === 'bestFormValue') {
        const forms = tex(q.board).split('=').slice(1).map(s => poly(s));
        if (forms.some(p => !P.eq(p, forms[0]))) bad.push('the forms on the board are not the same function');
        if (/zero/.test(pr) && !zerosOf(bf).exact) bad.push('irrational zeros asked as a typed number');
      }
      break;
    }
    case 'chooseForm': {
      const forms = tex(q.board).split('=').slice(1).map(s => poly(s));
      if (forms.some(p => !P.eq(p, forms[0]))) bad.push('the forms on the board are not the same function');
      for (const c of ch) { const p = choiceFn(c); if (!p || !P.eq(p, forms[0])) bad.push(`"${c}" is not the same function`); }
      break;
    }
    case 'zeroProd': {
      const m = norm(pr).match(/^Why are (-?[\d./]+) and (-?[\d./]+) the zeros/), z = zerosOf(bf).exact;
      if (m && (!z || !sameSet([num(m[1]).value, num(m[2]).value].sort((a, b) => a - b), z.map(r => r.value)))) bad.push('the stated zeros are wrong');
      break;
    }
    case 'symProof': {
      const f = promptFn(q, ' is symmetric'), m = norm(pr).match(/symmetric about x = (-?\d+(?:\.\d+)?)/);
      if (!axisOf(f).eq(Q(Number(m[1])))) bad.push('the stated axis is wrong');
      if (cf && !P.eq(curveOf(cf), f)) bad.push('the graph is not f');
      break;
    }
    case 'projectile': bad.push(...ctxProjectile(q)); break;
    case 'penMax': {
      const r = penOf(q), pr2 = norm(pr);
      const am = pr2.match(/A\(x\) = x\((\d+) - 2x\)/);
      if (!am || Number(am[1]) !== r.fence) bad.push('the area formula does not match the fence');
      const st = pr2.match(/x ≥ (\d+(?:\.\d+)?)/);
      if (r.wall !== null && (!st || !Q(Number(st[1])).eq(r.lo))) bad.push('the stated bound on x is wrong');
      if (r.wall !== null && r.wall >= r.fence) bad.push('the barn wall is longer than the fence');
      if (r.fence > 2000) bad.push('an unrealistic amount of fence');
      break;
    }
    case 'compareMax': {
      const r = compareOf(q), [hg, kg] = vertexOf(r.g);
      if (!inWin(q, hg.value, kg.value)) bad.push("g's vertex is off the graph");
      if (!onGrid(hg.value) || !onGrid(kg.value)) bad.push("g's vertex cannot be read off the graph");
      const wantUp = !r.higher;
      if ((A(r.f).n > 0) !== wantUp || (A(r.g).n > 0) !== wantUp) bad.push('the question asks for an extreme one of the parabolas does not have');
      break;
    }
    case 'cMeaning': {
      const { truth, pick } = cMeaningPick(q);
      if (pick < 0) bad.push('no choice says what c means');
      else if (count(truth) > 1) bad.push('another claim is true too');
      const m = norm(pr).match(/What does the (-?\d+(?:\.\d+)?) at the end/);
      if (m && !Q(Number(m[1])).eq(C(bf))) bad.push('the number named is not c');
      break;
    }
    case 'mapPoint': case 'fbxPoint': {
      const p0 = item(q, 'P'); if (p0.y !== p0.x * p0.x) bad.push('the point is not on y = x²');
      if (fam === 'fbxPoint') { const m = norm(pr).match(/same output, (-?\d+(?:\.\d+)?)/); if (m && Number(m[1]) !== p0.y) bad.push('the stated output is not the point\'s'); }
      break;
    }
    default: break;
  }
  if (q.input === 'num' && typeof want === 'number' && !Number.isFinite(want)) bad.push('no answer');
  if (q.input === 'num' && typeof want === 'number' && Math.abs(want * 1e6 - Math.round(want * 1e6)) > 1e-6 && !/nearest/.test(pr)) bad.push(`the answer ${want} cannot be typed exactly`);
  if (q.input === 'pair' && Array.isArray(want) && want.some(v => Math.abs(v * 1e6 - Math.round(v * 1e6)) > 1e-6)) bad.push('an answer cannot be typed exactly');
  return [...new Set(bad)].join('; ');
}
/** truth flags of every choice family (for "exactly one true") */
function choiceFlags(q) {
  const fam = q.family, ch = choicesOf(q);
  try {
    switch (fam) {
      case 'proofOrCheck': return proofFlags(q);
      case 'methodPick': return methodFlags(q);
      case 'chooseForm': return chooseFlags(q);
      case 'zeroProd': return zeroProdFlags(q);
      case 'boundWhy': return boundFlags(q);
      case 'symProof': return symFlags(q);
      case 'cMeaning': return null;   // checked on its own
      default: return null;   // solve() already demands exactly one
    }
  } catch { return null; }
}
/** findACtx: a world that makes sense */
function ctxA(q, r) {
  const pr = norm(promptOf(q)), bad = [], V = item(q, 'V'), p0 = item(q, 'P');
  if (r.a.n >= 0) bad.push('the top is not a highest point (a ≥ 0)');
  if (/bridge arch/.test(pr)) {
    if (V.y > 300 || V.y <= 0) bad.push('an arch height nobody builds');
    if (p0.y !== 0) bad.push('the arch does not start on the road');
  } else if (/ball leaves/.test(pr)) {
    const m = pr.match(/leaves a player's hand (\d+(?:\.\d+)?) ft above the ground and reaches its highest point, (\d+(?:\.\d+)?) ft up, (\d+(?:\.\d+)?) ft away/);
    if (m) {
      if (Number(m[1]) > 9 || Number(m[1]) < 3) bad.push('a hand height no player has');
      if (Number(m[2]) > 60) bad.push('a ball thrown higher than a player can');
      if (Number(m[2]) <= Number(m[1])) bad.push('the highest point is below the hand');
      if (p0.x !== 0 || p0.y !== Number(m[1]) || V.x !== Number(m[3]) || V.y !== Number(m[2])) bad.push('the picture does not match the story');
    }
  } else if (/profit/.test(pr)) {
    const m = pr.match(/At \$(\d+(?:\.\d+)?) a ticket the profit is \$(-?\d+(?:\.\d+)?)/);
    if (m && (Number(m[1]) !== p0.x || Number(m[2]) !== p0.y)) bad.push('the picture does not match the story');
    if (V.x <= 0 || V.x > 100 || p0.x <= 0 || p0.x > 100) bad.push('a ticket price nobody pays for a school play');
    if (V.y > 50000) bad.push('an unrealistic school-play profit');
  }
  return bad;
}
/** projectile: the story and the formula agree, and the numbers are possible */
function ctxProjectile(q) {
  const pr = norm(promptOf(q)), f = boardFn(q), bad = [];
  const m = pr.match(/(?:roof|platform) (\d+(?:\.\d+)?) ft high at (\d+(?:\.\d+)?) ft\/s/);
  if (!A(f).eq(-16)) bad.push('not −16t² (feet and seconds)');
  if (m && (!C(f).eq(Q(Number(m[1]))) || !B(f).eq(Q(Number(m[2]))))) bad.push('the formula does not match the story');
  if (m && (Number(m[1]) > 400 || Number(m[2]) > 250)) bad.push('an unrealistic roof or launch speed');
  const fac = pr.match(/feet = (.+?)\. When/);
  if (fac && !P.eq(poly(fac[1].replace(/t/g, 'x')), f)) bad.push('the stated factorisation is wrong');
  const z = zerosOf(f).approx.filter(t => t > 0);
  if (z.length !== 1) bad.push('no single landing time');
  if (/hit the ground/.test(pr) && !(zerosOf(f).exact) && !/nearest/.test(pr)) bad.push('the landing time is irrational');
  return bad;
}

export default { solve, sane };
