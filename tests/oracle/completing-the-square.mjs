// completing-the-square oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the
// student sees: the board TeX (equations, formulas), the prompt / choice HTML (superscripts and the radical bar kept),
// and the picture data (the parabola the Plane draws).
//
// Tools:
//  - one small parser for plain / TeX / HTML maths: numbers, single-letter variables, π, √ (binds to the next atom:
//    √97/6 = (√97)/6), ±, implicit multiplication, powers. Values are evaluated numerically with ± giving branches;
//    polynomials in one variable are evaluated EXACTLY with rational coefficients (oracle-kit Q).
//  - quadratics: exact discriminant, rational roots exactly, irrational roots compared numerically to each choice
//    (a choice must give exactly the root set; "≈" choices are never exact; ties between equal values go to the
//    simplest radical form).
//  - letters (derivation, letter fractions, rearranging formulas): every candidate is evaluated at several random
//    letter values; a "next line" must keep exactly the same solution set (and, when two do, the one that completes
//    the square wins); a rearranged formula must give exactly the solutions of the original (non-negative when the
//    question says t ≥ 0 / c > 0 or asks for a radius, side, speed or time).
//  - inequalities: each choice is tested against the inequality at the roots, just beside them, between and far out.
import { Q, round, nums, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ============================================================ text → expression string
function braceArg(s, i) {           // s[i] === '{' → [content, indexAfter]
  let d = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') d++;
    else if (s[j] === '}') { d--; if (d === 0) return [s.slice(i + 1, j), j + 1]; }
  }
  return [s.slice(i + 1), s.length];
}
function texExpr(tex) {
  let s = String(tex);
  s = s.replace(/\\cssId\{[^{}]*\}/g, '').replace(/\\(?:text|mathrm|operatorname)\{([^{}]*)\}/g, ' $1 ');
  // \frac{A}{B} and \sqrt{A} with nested braces
  for (let guard = 0; guard < 50; guard++) {
    const m = s.match(/\\[td]?frac\s*\{|\\sqrt\s*\{/);
    if (!m) break;
    const i = m.index, open = i + m[0].length - 1;
    if (m[0].includes('frac')) {
      const [a, j] = braceArg(s, open);
      let k = j; while (s[k] === ' ') k++;
      const [b, j2] = braceArg(s, k);
      s = s.slice(0, i) + `((${a})/(${b}))` + s.slice(j2);
    } else {
      const [a, j] = braceArg(s, open);
      s = s.slice(0, i) + `√(${a})` + s.slice(j);
    }
  }
  s = s.replace(/\^\{([^{}]*)\}/g, '^($1)')
    .replace(/\\left|\\right/g, '').replace(/\\pm/g, '±').replace(/\\pi/g, 'π').replace(/\\cdot|\\times/g, '*')
    .replace(/\\le(q)?(?![a-zA-Z])/g, '≤').replace(/\\ge(q)?(?![a-zA-Z])/g, '≥').replace(/\\ne(q)?(?![a-zA-Z])/g, '≠')
    .replace(/\\lt/g, '<').replace(/\\gt/g, '>').replace(/\\approx/g, '≈').replace(/\\square/g, '#')
    .replace(/\\qquad|\\quad/g, ' ; ').replace(/\\[,;:! ]/g, ' ').replace(/\\[a-zA-Z]+/g, ' ').replace(/[{}]/g, ' ');
  return norm(s);
}
function htmlExpr(h) {
  let s = String(h ?? '');
  for (let i = 0; i < 6; i++) {
    const b = s;
    s = s.replace(/<span class="fr"><span>((?:(?!<\/?span)[\s\S])*)<\/span><span>((?:(?!<\/?span)[\s\S])*)<\/span><\/span>/g, '(($1)/($2))');
    if (s === b) break;
  }
  s = s.replace(/<sup>([\s\S]*?)<\/sup>/g, '^($1)').replace(/<u class="rb">([\s\S]*?)<\/u>/g, '($1)')
    .replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')
    .replace(/&#8202;|&#8201;|&thinsp;|&nbsp;|&#160;/g, ' ').replace(/&minus;/g, '−').replace(/&times;/g, '×')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&le;/g, '≤').replace(/&ge;/g, '≥').replace(/&pi;/g, 'π')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, '&');
  return norm(s);
}
function norm(s) {
  return String(s).replace(/[−–]/g, '-').replace(/²/g, '^2').replace(/³/g, '^3').replace(/½/g, '(1/2)')
    .replace(/[×·]/g, '*').replace(/(\d),(\d{3})(?!\d)/g, '$1$2').replace(/[▢□]/g, '#').replace(/\s+/g, ' ').trim();
}
const choiceExpr = q => (q.choicesHtml ?? q.choices).map(c => (q.choicesHtml ? htmlExpr(c) : norm(c)));

// ============================================================ parser
function tokenize(s) {
  const t = [];
  const re = /\s*(\d+(?:\.\d+)?|\.\d+|[A-Za-z]|π|√|±|[-+*/^()#])/y;
  let m; re.lastIndex = 0;
  while (re.lastIndex < s.length) {
    const at = re.lastIndex;
    m = re.exec(s);
    if (!m) { if (/^\s*$/.test(s.slice(at))) break; throw new Error(`cannot read "${s.slice(at)}" in "${s}"`); }
    t.push(m[1]);
  }
  return t;
}
function parse(s) {
  const t = tokenize(s); let i = 0;
  const peek = () => t[i], next = () => t[i++];
  const startsAtom = x => x !== undefined && (/^[\d.A-Za-z(]/.test(x) || x === 'π' || x === '√');
  function sum() {
    let a;
    if (peek() === '±') { next(); a = ['upm', prod()]; }
    else if (peek() === '-') { next(); a = ['neg', prod()]; }
    else { if (peek() === '+') next(); a = prod(); }
    while (peek() === '+' || peek() === '-' || peek() === '±') {
      const op = next(); const b = prod();
      a = [op === '+' ? '+' : op === '-' ? '-' : 'pm', a, b];
    }
    return a;
  }
  function prod() {
    let a = unary();
    for (;;) {
      if (peek() === '*' || peek() === '/') { const op = next(); a = [op, a, unary()]; }
      else if (startsAtom(peek())) a = ['*', a, unary()];
      else return a;
    }
  }
  function unary() {
    if (peek() === '-') { next(); return ['neg', unary()]; }
    if (peek() === '±') { next(); return ['upm', unary()]; }
    return power();
  }
  function power() {
    const a = atom();
    if (peek() === '^') { next(); let neg = false; if (peek() === '-') { next(); neg = true; } const e = atom(); return ['^', a, neg ? ['neg', e] : e]; }
    return a;
  }
  function atom() {
    const x = next();
    if (x === undefined) throw new Error(`unexpected end in "${s}"`);
    if (x === '(') { const a = sum(); if (next() !== ')') throw new Error(`missing ) in "${s}"`); return a; }
    if (x === '√') return ['sqrt', power()];
    if (x === 'π') return ['n', Math.PI, 'pi'];
    if (x === '#') return ['box'];
    if (/^[\d.]/.test(x)) return ['n', Number(x), x];
    if (/^[A-Za-z]$/.test(x)) return ['v', x];
    throw new Error(`unexpected "${x}" in "${s}"`);
  }
  const r = sum();
  if (i < t.length) throw new Error(`left over "${t.slice(i).join(' ')}" in "${s}"`);
  return r;
}
const vars = (ast, out = new Set()) => { if (ast[0] === 'v') out.add(ast[1]); else for (const k of ast.slice(1)) if (Array.isArray(k)) vars(k, out); return out; };

// numeric evaluation with ± branches (array of values)
function ev(ast, env) {
  const cross = (A, B, f) => { const r = []; for (const a of A) for (const b of B) r.push(f(a, b)); return r; };
  switch (ast[0]) {
    case 'n': return [ast[1]];
    case 'v': { if (!(ast[1] in env)) throw new Error(`no value for ${ast[1]}`); return [env[ast[1]]]; }
    case 'box': throw new Error('box');
    case '+': return cross(ev(ast[1], env), ev(ast[2], env), (a, b) => a + b);
    case '-': return cross(ev(ast[1], env), ev(ast[2], env), (a, b) => a - b);
    case 'pm': { const A = ev(ast[1], env), B = ev(ast[2], env); return [...cross(A, B, (a, b) => a + b), ...cross(A, B, (a, b) => a - b)]; }
    case 'upm': { const A = ev(ast[1], env); return [...A, ...A.map(a => -a)]; }
    case 'neg': return ev(ast[1], env).map(a => -a);
    case '*': return cross(ev(ast[1], env), ev(ast[2], env), (a, b) => a * b);
    case '/': return cross(ev(ast[1], env), ev(ast[2], env), (a, b) => a / b);
    case '^': return cross(ev(ast[1], env), ev(ast[2], env), (a, b) => a ** b);
    case 'sqrt': return ev(ast[1], env).map(a => (a < -1e-12 ? NaN : Math.sqrt(Math.max(0, a))));
  }
  throw new Error(`node ${ast[0]}`);
}
const ev1 = (ast, env = {}) => { const r = ev(ast, env); if (r.length !== 1) throw new Error('branches'); return r[0]; };

// exact polynomial in one variable v: array of Q coefficients, index = power
function poly(ast, v) {
  const add = (A, B) => { const r = []; for (let k = 0; k < Math.max(A.length, B.length); k++) r.push((A[k] ?? Q(0)).add(B[k] ?? Q(0))); return r; };
  const mul = (A, B) => { const r = []; A.forEach((a, i) => B.forEach((b, j) => { r[i + j] = (r[i + j] ?? Q(0)).add(a.mul(b)); })); for (let k = 0; k < r.length; k++) r[k] ??= Q(0); return r; };
  const neg = A => A.map(a => a.neg());
  switch (ast[0]) {
    case 'n': if (ast[2] === 'pi') throw new Error('π in polynomial'); return [Q(String(ast[2]))];
    case 'v': if (ast[1] !== v) throw new Error(`letter ${ast[1]}`); return [Q(0), Q(1)];
    case '+': return add(poly(ast[1], v), poly(ast[2], v));
    case '-': return add(poly(ast[1], v), neg(poly(ast[2], v)));
    case 'neg': return neg(poly(ast[1], v));
    case '*': return mul(poly(ast[1], v), poly(ast[2], v));
    case '/': { const B = trim(poly(ast[2], v)); if (B.length !== 1) throw new Error('divide by polynomial'); return poly(ast[1], v).map(a => a.div(B[0])); }
    case '^': { const e = trim(poly(ast[2], v)); if (e.length > 1 || e[0].d !== 1 || e[0].n < 0) throw new Error('power'); let r = [Q(1)]; const A = poly(ast[1], v); for (let k = 0; k < e[0].n; k++) r = mul(r, A); return r; }
  }
  throw new Error(`not a polynomial (${ast[0]})`);
}
function trim(A) { const r = A.slice(); while (r.length > 1 && r[r.length - 1].n === 0) r.pop(); if (!r.length) r.push(Q(0)); return r; }
const coef = (P, k) => P[k] ?? Q(0);

// a relation "L op R" (op = < > ≤ ≥ = ≠)
function splitRel(s) {
  const m = s.match(/^(.*?)\s*(<=|>=|≤|≥|<|>|=)\s*(.*)$/);
  if (!m) return null;
  const op = { '<=': '≤', '>=': '≥' }[m[2]] ?? m[2];
  return { L: m[1], op, R: m[3] };
}
function eqPoly(s, v = 'x') {         // L − R as an exact polynomial
  const r = splitRel(s);
  const P = trim(poly(['-', parse(r.L), parse(r.R)], v));
  return { P, op: r.op, a: coef(P, 2), b: coef(P, 1), c: coef(P, 0) };
}
const boardMain = q => texExpr(q.board).split(';')[0].trim();
const mainVar = s => (/(?<![A-Za-z])t(?![A-Za-z])/.test(s) && !/(?<![A-Za-z])x(?![A-Za-z])/.test(s) ? 't' : 'x');

// ============================================================ quadratics
function sqrtQ(f) {                 // exact square root of a non-negative fraction, or null
  if (f.n < 0) return null;
  const rn = Math.round(Math.sqrt(f.n)), rd = Math.round(Math.sqrt(f.d));
  return rn * rn === f.n && rd * rd === f.d ? Q(rn, rd) : null;
}
function quad(a, b, c) {
  const D = b.mul(b).sub(a.mul(c).mul(4));
  if (a.n === 0) { const r = c.neg().div(b); return { D, lin: true, exact: [r], approx: [r.value] }; }
  const s = D.n < 0 ? null : sqrtQ(D);
  const ds = D.n < 0 ? [] : D.n === 0 ? [0] : [1, -1];
  const approx = ds.map(sg => (-b.value + sg * Math.sqrt(Math.max(0, D.value))) / (2 * a.value)).sort((x, y) => x - y);
  const plusFirst = s ? ds.map(sg => b.neg().add(s.mul(sg)).div(a.mul(2))) : null;
  const exact = plusFirst ? plusFirst.slice().sort((x, y) => x.cmp(y)) : null;
  return { D, exact, approx, plusFirst };
}
const close = (x, y) => Math.abs(x - y) <= 1e-7 * Math.max(1, Math.abs(x), Math.abs(y));
const uniq = A => { const r = []; for (const x of [...A].sort((p, q) => p - q)) if (!r.some(y => close(x, y))) r.push(x); return r; };
const sameSet = (A, B) => { const a = uniq(A), b = uniq(B); return a.length === b.length && a.every((x, i) => close(x, b[i])); };

// the root set a choice states ("x = …", "x = … or x = …", "… only", "no real solutions"); null = not exact
function choiceRoots(expr) {
  if (/no real/i.test(expr)) return [];
  if (/≈/.test(expr)) return null;
  const parts = expr.replace(/\bonly\b/g, '').split(/\bor\b/);
  const out = [];
  for (const p of parts) {
    const r = splitRel(p.trim());
    if (!r || r.op !== '=') return null;
    out.push(...ev(parse(r.R), {}));
  }
  return out.some(Number.isNaN) ? null : out;
}
// simplest radical form: every radicand square-free; (P ± K√m)/Q reduced
function simplest(expr) {
  for (const m of expr.matchAll(/√\(?(\d+)\)?/g)) {
    const n = Number(m[1]);
    for (let k = 2; k * k <= n; k++) if (n % (k * k) === 0) return false;
  }
  const g = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  for (const m of expr.matchAll(/\(\s*(-?\d+)\s*±\s*(\d*)\s*√\(?\d+\)?\s*\)\s*\/\s*\(?(\d+)\)?/g)) {
    if (g(g(Number(m[1]), Number(m[2] || 1)), Number(m[3])) !== 1) return false;
  }
  for (const m of expr.matchAll(/(\d+)\s*\/\s*(\d+)/g)) if (g(Number(m[1]), Number(m[2])) !== 1) return false;
  return true;
}
function pickRoots(q, roots) {
  const C = choiceExpr(q);
  let hits = C.map((c, i) => { const r = choiceRoots(c); return r && sameSet(r, roots) ? i : -1; }).filter(i => i >= 0);
  if (hits.length > 1) { const s = hits.filter(i => simplest(C[i])); if (s.length) hits = s; }
  return hits.length === 1 ? hits[0] : -1;
}
const numOf = f => f.value;
// two boxes "x = [ ] or x = [ ]", either order is right; given in the order ± reads: (−b + √D)/(2a) first
const rootsPair = r => {
  if (!r.exact) return undefined;
  if (r.exact.length === 1) return [numOf(r.exact[0]), numOf(r.exact[0])];
  return r.plusFirst.map(numOf);
};

// ============================================================ letters: random environments
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; }
// the solution set (in unknown u) of a relation "L = R" for one environment: every ± branch, each at most quadratic
function solSet(rel, u, env) {
  const r = splitRel(rel);
  const A = parse(r.L), B = parse(r.R);
  const f = x => { const e = { ...env, [u]: x }; const L = ev(A, e), R = ev(B, e); const out = []; for (const l of L) for (const rr of R) out.push(l - rr); return out; };
  const f0 = f(0), f1 = f(1), fm = f(-1), f2 = f(2), f3 = f(3);
  const out = [];
  for (let k = 0; k < f0.length; k++) {
    const c = f0[k], b = (f1[k] - fm[k]) / 2, a = (f1[k] + fm[k]) / 2 - c;
    if ([a, b, c].some(Number.isNaN)) return null;
    if (!close(4 * a + 2 * b + c, f2[k]) || !close(9 * a + 3 * b + c, f3[k])) return null;   // not quadratic
    const sc = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), 1e-300);
    if (Math.abs(a) < 1e-9 * sc) { if (Math.abs(b) < 1e-9 * sc) { if (Math.abs(c) > 1e-12) continue; return null; } out.push(-c / b); continue; }
    const D = b * b - 4 * a * c;
    if (D < -1e-9) continue;
    const s = Math.sqrt(Math.max(0, D));
    out.push((-b + s) / (2 * a), (-b - s) / (2 * a));
  }
  return uniq(out);
}
function quadCoefs(rel, u, env) {   // the x-polynomial of L − R (no ±), numerically
  const r = splitRel(rel);
  const A = parse(r.L), B = parse(r.R);
  const f = x => ev1(A, { ...env, [u]: x }) - ev1(B, { ...env, [u]: x });
  const c = f(0), b = (f(1) - f(-1)) / 2, a = (f(1) + f(-1)) / 2 - c;
  return { a, b, c, L: x => ev1(A, { ...env, [u]: x }) };
}
const isPerfectSquareSide = (rel, u, env) => {   // the left side is (x + h)² as a polynomial in x
  const r = splitRel(rel); const A = parse(r.L);
  const f = x => ev1(A, { ...env, [u]: x });
  const c = f(0), b = (f(1) - f(-1)) / 2, a = (f(1) + f(-1)) / 2 - c;
  return Math.abs(a) > 1e-9 && close(b * b, 4 * a * c);
};
// envs where every letter has a value (non-zero ints by default) and `ok(env)` holds
function envs(letters, ok, n = 4, seed = 7, pos = false) {
  const R = rng(seed), out = [];
  for (let tries = 0; tries < 4000 && out.length < n; tries++) {
    const e = {};
    for (const L of letters) e[L] = pos ? 0.5 + R() * 3 : (R() < 0.5 ? -1 : 1) * (1 + Math.floor(R() * 9)) + (R() < 0.3 ? 0.5 : 0);
    try { if (ok(e)) out.push(e); } catch { /* resample */ }
  }
  return out;
}

// next line of a derivation: same solution set (for every environment); ties → the one that completes the square
function nextLine(q, current) {
  const C = choiceExpr(q);
  const letters = new Set([...vars(parse(splitRel(current).L)), ...vars(parse(splitRel(current).R))]);
  for (const c of C) { const r = splitRel(c); if (r) for (const s of [r.L, r.R]) for (const v of vars(parse(s))) letters.add(v); }
  letters.delete('x');
  const E = envs([...letters], e => { const s = solSet(current, 'x', e); return s && s.length > 0; });
  if (!E.length) return -1;
  let hits = C.map((c, i) => (E.every(e => { const s = solSet(c, 'x', e), t = solSet(current, 'x', e); return s && sameSet(s, t); }) ? i : -1)).filter(i => i >= 0);
  if (hits.length > 1) { const sq = hits.filter(i => E.every(e => isPerfectSquareSide(C[i], 'x', e))); if (sq.length) hits = sq; }
  return hits.length === 1 ? hits[0] : -1;
}

// ============================================================ inequalities
function relHolds(op, d) {          // d = L − R
  const z = Math.abs(d) < 1e-9;
  switch (op) {
    case '<': return !z && d < 0; case '>': return !z && d > 0; case '≤': return z || d < 0; case '≥': return z || d > 0;
    case '=': return z; case '≠': return !z;
  }
  throw new Error(op);
}
// a choice describing a set of x: "a < x < b", "x ≤ a or x ≥ b", "x = a or x = b", "all real numbers (except x = h)", "only x = h", "no real numbers"
function setPred(text, u) {
  const t = text.trim();
  if (/^no real/i.test(t)) return () => false;
  let m = t.match(/^all real numbers except (.*)$/i);
  if (m) { const p = setPred(m[1], u); return p && (x => !p(x)); }
  if (/^all real numbers/i.test(t)) return () => true;
  m = t.match(/^only (.*)$/i);
  if (m) return setPred(m[1], u);
  const parts = t.split(/\bor\b/).map(s => s.trim());
  const preds = [];
  for (const p of parts) {
    const toks = p.split(/\s*(<=|>=|≤|≥|<|>|=)\s*/);
    if (toks.length === 3) {
      const [A, op, B] = toks; const op2 = { '<=': '≤', '>=': '≥' }[op] ?? op;
      if (A.trim() === u) { const v = ev(parse(B), {}); if (v.length !== 1) return null; preds.push(x => relHolds(op2, x - v[0])); }
      else if (B.trim() === u) { const v = ev(parse(A), {}); if (v.length !== 1) return null; preds.push(x => relHolds(op2, v[0] - x)); }
      else return null;
    } else if (toks.length === 5 && toks[2].trim() === u) {
      const lo = ev(parse(toks[0]), {}), hi = ev(parse(toks[4]), {});
      if (lo.length !== 1 || hi.length !== 1) return null;
      const o1 = { '<=': '≤', '>=': '≥' }[toks[1]] ?? toks[1], o2 = { '<=': '≤', '>=': '≥' }[toks[3]] ?? toks[3];
      preds.push(x => relHolds(o1, lo[0] - x) && relHolds(o2, x - hi[0]));
    } else return null;
  }
  return x => preds.some(f => f(x));
}
function pickSet(q, truth, roots, u) {
  const pts = [-1000, 1000, 0];
  const rs = uniq(roots);
  for (const r of rs) pts.push(r, r - 1e-4, r + 1e-4, r - 1, r + 1);
  for (let i = 0; i + 1 < rs.length; i++) pts.push((rs[i] + rs[i + 1]) / 2);
  const C = q.choicesHtml ? q.choicesHtml.map(htmlExpr) : q.choices.map(norm);
  // every number a choice names is a test point too (an "except x = h" needs x = h itself)
  for (const c of C) for (const n of nums(c)) pts.push(n, n - 1e-4, n + 1e-4);
  // keep the words; htmlExpr only normalised symbols
  return choiceWhere({ choices: C }, c => {
    let p; try { p = setPred(c, u); } catch { return false; }
    return !!p && pts.every(x => {
      // at the exact roots, evaluate the choice's endpoints with the same root (both computed numerically)
      return p(x) === truth(x);
    });
  });
}

// ============================================================ families
const F = {};

// ---- 1 perfect-square trinomials
F.pstSpot = q => {
  const u = (q.board.match(/\((\w) \+ h\)/) ?? [])[1] ?? 'x';
  return choiceWhere({ choices: choiceExpr(q) }, c => {
    const P = trim(poly(parse(c), u));
    return P.length === 3 && coef(P, 2).eq(1) && coef(P, 1).n !== 0 && coef(P, 1).mul(coef(P, 1)).eq(coef(P, 0).mul(4));
  });
};
F.pstWrite = q => {
  const r = splitRel(boardMain(q));
  const P = trim(poly(parse(r.L), 'x'));
  return coef(P, 1).div(2).value;
};
F.pstMiddle = q => {
  const r = splitRel(boardMain(q));
  return coef(trim(poly(parse(r.R), 'x')), 1).value;
};

// ---- 2 the completing term
const leftBeforeBox = q => boardMain(q).split('=')[0].replace(/\+\s*#\s*$/, '').trim();
F.fillTerm = q => { const P = poly(parse(leftBeforeBox(q)), 'x'); return coef(P, 1).div(2).mul(coef(P, 1).div(2)).value; };
F.fillPair = q => {
  const P = poly(parse(leftBeforeBox(q)), 'x'); const h = coef(P, 1).div(2);
  const minus = /\(x\s*-\s*#\)/.test(boardMain(q));
  return [h.mul(h).value, (minus ? h.neg() : h).value];
};

// ---- 3-5 completing the square
const rhsAfterSquare = q => {      // (x + b/2)² = (b/2)² − c for the monic (or divided) equation
  const E = eqPoly(boardMain(q)); const a = E.a.n === 0 ? Q(1) : E.a;
  const b = E.b.div(a), c = E.c.div(a);
  return b.div(2).mul(b.div(2)).sub(c);
};
F.csRhs = q => rhsAfterSquare(q).value;
F.oddRhs = q => rhsAfterSquare(q).pair;
F.csSolve = q => { const E = eqPoly(boardMain(q)); return rootsPair(quad(E.a, E.b, E.c)); };
const exactChoice = q => { const E = eqPoly(boardMain(q)); return pickRoots(q, quad(E.a, E.b, E.c).approx); };
F.csExact = exactChoice;
F.oddSolve = exactChoice;
F.nmSolve = exactChoice;
F.formulaExact = exactChoice;
F.oddTerm = q => { const b = coef(poly(parse(leftBeforeBox(q)), 'x'), 1).div(2); return b.mul(b).pair; };
F.nmDivide = q => {
  const E = eqPoly(boardMain(q));
  return choiceWhere({ choices: choiceExpr(q) }, c => {
    const C = eqPoly(c);
    return C.P.length === E.P.length && C.P.every((k, i) => k.eq(E.P[i].div(E.a)));
  });
};
F.nmTerm = q => { const E = eqPoly(boardMain(q)); const h = E.b.div(E.a).div(2); return h.mul(h).pair; };

// ---- 6 the quadratic formula
F.readABC = q => { const E = eqPoly(boardMain(q)); return [E.b.value, E.c.value]; };
F.discVal = q => { const E = eqPoly(boardMain(q)); return E.b.mul(E.b).sub(E.a.mul(E.c).mul(4)).value; };
F.formulaSolve = q => { const E = eqPoly(boardMain(q)); return rootsPair(quad(E.a, E.b, E.c)); };
F.formulaRound = q => {
  const E = eqPoly(boardMain(q)); const r = quad(E.a, E.b, E.c).approx;
  return round(/larger/.test(q.prompt) ? r[r.length - 1] : r[0], 2);
};

// ---- 7 choose the method
F.pickMethod = q => {
  const s = boardMain(q); const r = splitRel(s);
  const E = eqPoly(s);
  let want;
  if (/^\(x [-+] \d+\)\s*\(\d*x [-+] \d+\)$/.test(r.L.replace(/\s+/g, ' ').replace(/\) \(/, ')(')) && E.c !== undefined && r.R.trim() === '0') want = /Zero product/;
  else if (/^\d*\s*\(x [-+] \d+\)\^2$/.test(r.L.trim()) && !/x/.test(r.R)) want = /Square roots/;
  else if (E.b.n === 0) want = /Square roots/;
  else if (E.a.eq(1) && E.b.d === 1 && E.b.n % 2 === 0) want = /Completing the square/;
  else want = /Quadratic formula/;
  return choiceWhere(q, c => want.test(c));
};
F.sqrtSolve = q => { const E = eqPoly(boardMain(q)); return rootsPair(quad(E.a, E.b, E.c)); };

// ---- 8 fractions with letters
F.twinFrac = q => {
  const parts = texExpr(q.board).replace(/;/g, ',').split(/\s*,\s*/).filter(Boolean);
  const env = {};
  for (const p of parts.slice(1)) { const m = p.match(/^([a-z])\s*=\s*(-?[\d.]+)$/); if (m) env[m[1]] = Number(m[2]); }
  const sub = s => s.replace(/[a-z]/g, L => (L in env ? `(${env[L]})` : L));
  const P = poly(parse(sub(parts[0])), 'x');
  return trim(P)[0].pair;
};
F.letterFrac = q => {
  const target = parse(boardMain(q));
  const C = choiceExpr(q).map(parse);
  const L = [...vars(target)];
  const E = envs(L, () => true, 4, 11);
  return choiceWhere({ choices: C }, c => E.every(e => close(ev1(c, e), ev1(target, e))));
};
F.whyNonzero = q => {
  const p = norm(q.prompt);
  const m = p.match(/\bby (?:4\s*)?([A-Za-z])(?:\^2)?\b/) ?? p.match(/\/\((?:2|4)\s*([A-Za-z])(?:\^2)?\)/);
  if (!m) return -1;
  return choiceWhere(q, c => c.trim() === `${m[1]} ≠ 0`);
};

// ---- 9 completing the square with letters
F.literalTerm = q => {
  const left = parse(leftBeforeBox(q));
  const L = [...vars(left)].filter(v => v !== 'x');
  const C = choiceExpr(q).map(parse);
  const E = envs(L, () => true, 4, 13);
  return choiceWhere({ choices: C }, c => E.every(e => {
    const f = x => ev1(left, { ...e, x });
    const b = (f(1) - f(-1)) / 2;
    return close(ev1(c, e), (b / 2) ** 2);
  }));
};
F.literalNext = q => {
  const m = q.prompt.match(/The line so far is (.*?)\. Which line/);
  const cur = m ? htmlExpr(q.promptHtml.match(/The line so far is (.*?)\. Which line/)?.[1] ?? m[1]) : boardMain(q);
  return nextLine(q, cur);
};
F.deriveNext = q => nextLine(q, boardMain(q));

// ---- 10 why each step holds
F.deriveWhy = q => {
  const p = q.prompt;
  if (/multiplied by 4a/.test(p)) return choiceWhere(q, c => /^4a² is not 0, because a ≠ 0/.test(c));
  if (/have ± in front/.test(p)) return choiceWhere(q, c => /^Both √/.test(c));
  if (/lose one of the two solutions/.test(p)) return choiceWhere(q, c => /^No: ± already covers both/.test(c));
  if (/What does the formula give/.test(p)) {
    const E = eqPoly(boardMain(q)); const D = E.b.mul(E.b).sub(E.a.mul(E.c).mul(4));
    if (D.n < 0) return choiceWhere(q, c => /^No real solutions/.test(c));
    if (D.n === 0) return choiceWhere(q, c => /^One solution/.test(c));
    return choiceWhere(q, c => (sqrtQ(D) ? /^Two rational/ : /^Two irrational/).test(c));
  }
  return undefined;   // a new kind of question: not covered
};

// ---- 11 the discriminant
const discOf = q => { const E = eqPoly(boardMain(q)); return E.b.mul(E.b).sub(E.a.mul(E.c).mul(4)); };
const countClass = c => (/no real/i.test(c) ? -1 : /one real|exactly one|is 0/i.test(c) ? 0 : /two/i.test(c) ? 1 : null);
F.discCount = q => { const s = Math.sign(discOf(q).n); return choiceWhere(q, c => countClass(c) === s); };
F.discKind = q => {
  const D = discOf(q);
  const want = D.n < 0 ? /^no real/ : D.n === 0 ? /^one rational/ : sqrtQ(D) ? /^two rational/ : /^two irrational/;
  return choiceWhere(q, c => want.test(c));
};

// ---- 12 on the graph (the drawn parabola)
const planeQuad = q => { const p = q.data.picture.plane; return quad(Q(p.a), Q(p.b), Q(p.c)); };
F.graphMatch = q => { const s = Math.sign(planeQuad(q).D.n); return choiceWhere(q, c => countClass(c) === s); };
F.graphRead = q => {   // read off the graph left to right
  const r = planeQuad(q);
  if (!r.exact) return undefined;
  return r.exact.length === 1 ? [numOf(r.exact[0]), numOf(r.exact[0])] : r.exact.map(numOf);
};

// ---- 13 checks
// p + q√s with exact rationals
function evalSurd(P, p, qq, s) {
  let re = Q(0), im = Q(0), xr = Q(1), xi = Q(0);   // x^k = xr + xi√s
  for (let k = 0; k < P.length; k++) {
    re = re.add(P[k].mul(xr)); im = im.add(P[k].mul(xi));
    [xr, xi] = [xr.mul(p).add(xi.mul(qq).mul(s)), xr.mul(qq).add(xi.mul(p))];
  }
  return { re, im };
}
const surdOf = s => { const m = s.match(/^(-?\d+) ([+-]) √\(?(\d+)\)?$/); return m && { p: Q(Number(m[1])), q: Q(m[2] === '-' ? -1 : 1), s: Number(m[3]) }; };
function exactCheckParts(q) {
  const t = norm(q.prompt);
  const m = t.match(/x = (-?\d+ [+-] √\d+) into (.*?)\. What/) ?? t.match(/x = (-?\d+ [+-] √\d+) in (.*?) = 0 with/);
  if (!m) return null;
  const x = surdOf(m[1]);
  const P = trim(poly(parse(m[2]), 'x'));
  return { x, P, val: evalSurd(P, x.p, x.q, x.s) };
}
F.exactCheck = q => { const r = exactCheckParts(q); return r && r.val.im.n === 0 ? r.val.re.value : undefined; };
F.roundCheck = q => {
  const r = exactCheckParts(q);
  if (!r) return -1;
  const isRoot = r.val.re.n === 0 && r.val.im.n === 0;
  return choiceWhere(q, c => (isRoot ? /^It is a solution/ : /is not a solution/).test(c));
};

// ---- 14 stories
function storyModel(q) {   // L − R of the right equation, and its letter
  const p = norm(q.prompt);
  let m;
  if ((m = p.match(/height after t seconds is h = (.*?)\. Which equation finds when it is (\d+(?:\.\d+)?) ft high/)))
    return { u: 't', P: trim(poly(['-', parse(m[1]), ['n', Number(m[2]), m[2]]], 't')) };
  if ((m = p.match(/\$(\d+) ticket sells (\d+) seats\. Each \$1 increase in price loses (\d+) sales.*Revenue is \$(\d+)/)))
    return { u: 'x', P: trim(poly(parse(`(${m[1]} + x)(${m[2]} - ${m[3]}x) - ${m[4]}`), 'x')) };
  if ((m = p.match(/rectangle is (\d+) ft (longer|shorter) than it is wide, and its area is (\d+)/)))
    return { u: 'x', P: trim(poly(parse(`x(x ${m[2] === 'longer' ? '+' : '-'} ${m[1]}) - ${m[3]}`), 'x')) };
  if ((m = p.match(/consecutive( even| odd)? integers have product (-?\d+)/)))
    return { u: 'x', P: trim(poly(parse(`x(x + ${m[1] ? 2 : 1}) - ${m[2]}`), 'x')) };
  if ((m = p.match(/A (\d+) in by (\d+) in picture has a frame .*?cover (\d+) sq in/)))
    return { u: 'x', P: trim(poly(parse(`(${m[1]} + 2x)(${m[2]} + 2x) - ${m[3]}`), 'x')) };
  return null;
}
F.ctxModel = q => {
  const M = storyModel(q);
  if (!M) return undefined;   // a story kind this oracle does not know
  return choiceWhere({ choices: choiceExpr(q) }, c => {
    let P; try { P = eqPoly(c, M.u).P; } catch { return false; }
    if (P.length !== M.P.length) return false;
    const k = M.P.findIndex(x => x.n !== 0); if (P[k].n === 0) return false;
    const f = P[k].div(M.P[k]);
    return P.every((x, i) => x.eq(M.P[i].mul(f)));
  });
};
F.ctxSolve = q => {
  const s = boardMain(q); const u = mainVar(s);
  const E = eqPoly(s, u); const r = quad(E.a, E.b, E.c);
  const pos = r.approx.filter(x => x > 1e-12);
  const pick = /first|on the way up/.test(q.prompt) ? Math.min(...pos) : pos.length === 1 ? pos[0] : NaN;
  return Number.isFinite(pick) ? (r.exact ? r.exact.find(x => close(x.value, pick)).value : pick) : undefined;
};
function ctxRootsInfo(q) {
  const p = norm(q.prompt);
  const m = p.match(/\b([a-z]) = (-?\d+(?:\.\d+)?) and \1 = (-?\d+(?:\.\d+)?)/);
  return m && { u: m[1], roots: [Number(m[2]), Number(m[3])] };
}
F.ctxRoots = q => {
  const p = q.prompt;
  if (/has no real solutions/.test(p)) {
    const E = eqPoly(boardMain(q), 't'); const D = E.b.mul(E.b).sub(E.a.mul(E.c).mul(4));
    return D.n < 0 ? choiceWhere(q, c => /never reaches/.test(c)) : -1;
  }
  const I = ctxRootsInfo(q);
  if (!I) return undefined;
  let valid;
  if (/consecutive integers/.test(p)) valid = I.roots.filter(Number.isInteger);
  else if (/land/.test(p)) valid = I.roots.filter(t => t > 0);
  else if (/ball|height/.test(p)) valid = I.roots.filter(t => t >= 0);
  else if (/width|wide|length|side/.test(p)) valid = I.roots.filter(t => t > 0);
  else return undefined;
  return choiceWhere(q, c => {
    if (/neither|never|no answer/i.test(c)) return valid.length === 0;
    const said = I.roots.filter(r => nums(c).some(n => close(n, r)));
    return sameSet(said, valid) && said.length > 0;
  });
};

// ---- 15 formulas with a square root
F.rearrange = q => {
  const p = norm(q.prompt);
  let m = p.match(/divides by ([^.]+?)\. Which condition/);
  if (m) {
    const need = [...new Set(m[1].match(/[A-Za-z]/g) ?? [])].sort().join(',');
    return choiceWhere(q, c => {
      if (/^none/.test(c)) return need === '';
      if (!/≠ 0/.test(c)) return false;
      return [...c.matchAll(/([A-Za-z]) ≠ 0/g)].map(x => x[1]).sort().join(',') === need;
    });
  }
  const promptH = htmlExpr(q.promptHtml ?? q.prompt);
  m = promptH.match(/^Solve (.*?) for (?:the [a-z]+ )?([A-Za-z])\b/);
  if (!m) return undefined;
  const formula = m[1], u = m[2];
  const nonneg = /for the (time|radius|speed|side|length|width)/.test(p) || new RegExp(`\\(${u} (≥|>) 0`).test(p);
  const C = choiceExpr(q);
  const letters = new Set(vars(parse(splitRel(formula).L))); for (const v of vars(parse(splitRel(formula).R))) letters.add(v);
  letters.delete(u);
  const truthSet = e => { const s = solSet(formula, u, e); return s && (nonneg ? s.filter(x => x >= -1e-12) : s); };
  const E = envs([...letters], e => { const s = truthSet(e); return s && s.length > 0 && s.some(x => Math.abs(x) > 1e-6); }, 5, 17, true);
  if (!E.length) return -1;
  return choiceWhere({ choices: C }, c => {
    const r = splitRel(c); if (!r || r.L.trim() !== u) return false;
    return E.every(e => { let v; try { v = ev(parse(r.R), e); } catch { return false; } return !v.some(Number.isNaN) && sameSet(v, truthSet(e)); });
  });
};
F.rearrangeEval = q => {
  const parts = boardMain(q).split(/\s*,\s*/);
  const env = {};
  for (const s of parts.slice(1)) { const m = s.match(/^([A-Za-z])\s*=\s*(-?[\d.]+)$/); if (m) env[m[1]] = Number(m[2]); }
  const r = splitRel(parts[0]);
  return round(ev1(parse(r.R), env), 2);
};

// ---- 16 inequalities
function ineq(q) {
  const s = boardMain(q); const u = mainVar(s);
  const E = eqPoly(s, u);
  const f = x => E.P.reduce((acc, k, i) => acc + k.value * x ** i, 0);
  const roots = E.a.n === 0 ? [] : quad(E.a, E.b, E.c).approx;
  return { u, op: E.op, f, roots, E };
}
const ineqChoice = q => { const I = ineq(q); return pickSet(q, x => relHolds(I.op, I.f(x)), I.roots, I.u); };
F.ineqSet = ineqChoice;
F.ineqSpecial = ineqChoice;

// ============================================================ sane
function sane(q) {
  const f = q.family, p = q.prompt;
  try {
    const tie2 = v => Math.abs(Math.abs(v * 100) % 1 - 0.5) < 1e-6;
    if (f === 'formulaRound') {
      const E = eqPoly(boardMain(q)); const r = quad(E.a, E.b, E.c).approx;
      if (r.length < 2) return 'asks for the smaller solution, but there are not two';
      if (r.some(tie2)) return 'a solution is a hundredths tie';
    }
    if (f === 'rearrangeEval') {
      const parts = boardMain(q).split(/\s*,\s*/); const env = {};
      for (const s of parts.slice(1)) { const m = s.match(/^([A-Za-z])\s*=\s*(-?[\d.]+)$/); if (m) env[m[1]] = Number(m[2]); }
      const v = ev1(parse(splitRel(parts[0]).R), env);
      if (Math.abs(Math.abs(v * 100) % 1 - 0.5) < 0.0025) return `${v} is (almost) a hundredths tie`;
      for (const n of nums(p)) if (!Object.values(env).includes(n) && !/kg|cu in|sq in|ft/.test(p)) { /* the prompt numbers are the board's */ }
    }
    if (f === 'csRhs' || f === 'oddRhs') {
      const E = eqPoly(boardMain(q)); const h = E.b.div(E.a).div(2);
      const m = norm(q.promptHtml ?? p).match(/becomes \(x ([+-]) (.*?)\)\^2/) ?? htmlExpr(q.promptHtml).match(/becomes \(x ([+-]) (.*?)\)\^2/);
      if (m) { const v = ev1(parse(m[2])) * (m[1] === '-' ? -1 : 1); if (!close(v, h.value)) return `the prompt's (x ${m[1]} ${m[2]})² does not complete this equation (h = ${h})`; }
    }
    if (f === 'pstMiddle') {
      const r = splitRel(boardMain(q));
      const R = trim(poly(parse(r.R), 'x'));
      const Lc = Number((r.L.match(/(\d+)\s*$/) ?? [])[1]);
      if (!coef(R, 0).eq(Lc)) return `the constant ${Lc} does not match the square ${r.R}`;
    }
    if (f === 'pstWrite') {
      const P = trim(poly(parse(splitRel(boardMain(q)).L), 'x'));
      if (!coef(P, 1).mul(coef(P, 1)).eq(coef(P, 0).mul(4))) return 'the trinomial is not a perfect square';
    }
    if (['fillTerm', 'fillPair', 'csRhs', 'csSolve', 'csExact', 'oddTerm', 'oddRhs', 'oddSolve', 'nmTerm', 'pstMiddle'].includes(f) && q.data?.picture?.sq?.hT) {
      // the drawn square's side must belong to this question
      const sq = q.data.picture.sq; const hv = ev1(parse(texExpr(sq.hT)));
      let h;
      if (f === 'pstMiddle') h = coef(trim(poly(parse(splitRel(boardMain(q)).R), 'x')), 1).value / 2;
      else if (f === 'fillTerm' || f === 'fillPair' || f === 'oddTerm') h = coef(poly(parse(leftBeforeBox(q)), 'x'), 1).value / 2;
      else { const E = eqPoly(boardMain(q)); h = E.b.div(E.a).value / 2; }
      if (!close(hv, h)) return `the area picture shows a side x + ${sq.hT}, the question needs x + ${h}`;
      if (f === 'pstMiddle' && sq.stripT && !/\?/.test(sq.stripT)) return `the strip label ${sq.stripT} shows the missing middle coefficient`;
    }
    if (f === 'graphMatch' || f === 'graphRead' || f === 'ineqSet' || f === 'ineqSpecial') {
      const pl = q.data?.picture?.plane;
      if (pl) {
        const E = eqPoly(f.startsWith('ineq') ? boardMain(q) : boardMain(q).replace(/^y\s*=\s*/, '0 = '), mainVar(boardMain(q)));
        const P2 = [pl.c, pl.b, pl.a];
        const eqv = (s) => [0, 1, 2].every(k => close(s * coef(E.P, k).value, P2[k]));
        const want = f.startsWith('ineq') ? 1 : -1;      // board y = f → E.P = −f
        if (!eqv(want)) return `the graph draws y = ${pl.a}x² + ${pl.b}x + ${pl.c}, not the board's ${boardMain(q)}`;
        const r = quad(Q(pl.a), Q(pl.b), Q(pl.c)).approx;
        if (r.some(x => x < pl.x[0] || x > pl.x[1])) return 'an x-intercept lies outside the drawn window';
        if (f === 'graphRead' && r.some(x => !Number.isInteger(Math.round(x * 1e9) / 1e9))) return 'an intercept is not a whole number, hard to read off a graph';
      }
    }
    if (f === 'deriveWhy') {
      const E = eqPoly(boardMain(q)); const D = E.b.mul(E.b).sub(E.a.mul(E.c).mul(4));
      let m = p.match(/that is (\d+)\./); if (m && Number(m[1]) !== 4 * E.a.value ** 2) return `4a² is ${4 * E.a.value ** 2}, not ${m[1]}`;
      m = norm(p).match(/b\^2 - 4ac = (-?\d+)/); if (m && Number(m[1]) !== D.value) return `b² − 4ac is ${D}, not ${m[1]}`;
      m = norm(p).match(/a = (-?\d+) is negative/); if (m && Number(m[1]) !== E.a.value) return `a is ${E.a}, not ${m[1]}`;
      if (/a = -\d/.test(p)) return 'a hyphen "-" is used as the minus sign in the prompt (a = -1), elsewhere it is "−"';
    }
    if (f === 'roundCheck') {
      const r = exactCheckParts(q);
      const m = norm(p).match(/x ≈ (-?[\d.]+) and gets (-?[\d.]+) instead/);
      if (r && m) {
        const x = Number(m[1]), got = Number(m[2]);
        const exact = r.x.p.value + r.x.q.value * Math.sqrt(r.x.s);
        if (!close(round(exact, 2), x)) return `${exact.toFixed(4)} rounds to ${round(exact, 2)}, not ${x}`;
        const val = r.P.reduce((a, k, i) => a + k.value * x ** i, 0);
        if (Math.abs(val - got) > 1e-9) return `putting ${x} in gives ${val.toFixed(6)}, not ${got}`;
      }
    }
    if (f === 'ctxRoots') {
      const I = ctxRootsInfo(q);
      if (I) {
        const E = eqPoly(boardMain(q), I.u);
        for (const r of I.roots) if (Math.abs(E.P.reduce((a, k, i) => a + k.value * r ** i, 0)) > 1e-9) return `${I.u} = ${r} does not solve ${boardMain(q)}`;
      }
    }
    if (f === 'ctxSolve' || f === 'csSolve' || f === 'formulaSolve' || f === 'sqrtSolve' || f === 'graphRead') {
      const s = f === 'graphRead' ? null : boardMain(q);
      if (s) {
        const E = eqPoly(s, mainVar(s)); const r = quad(E.a, E.b, E.c);
        if (!r.exact) return 'the solutions are irrational, but the answer is typed without a rounding instruction';
        if (f !== 'ctxSolve' && r.exact.some(x => ![1, 2, 4, 5, 10].includes(x.d) )) return `a solution ${r.exact.find(x => ![1, 2, 4, 5, 10].includes(x.d))} has no finite decimal to type`;
        if (f === 'ctxSolve' && r.exact.filter(x => x.value > 0).length > 1 && !/first|on the way up/.test(p)) return 'two positive solutions, the question does not say which';
      }
    }
    if (f === 'exactCheck') { const r = exactCheckParts(q); if (r && r.val.im.n !== 0) return 'the check leaves a √ part: not a number to type'; }
  } catch (e) { return `oracle could not read the item: ${e.message}`; }
  return '';
}

function solve(q) {
  const g = F[q.family];
  if (!g) return undefined;
  return g(q);
}
export default { solve, sane };
