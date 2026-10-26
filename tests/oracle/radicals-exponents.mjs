// radicals-exponents oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the
// student sees: the board TeX, the prompt HTML and the choices' HTML (the plain text loses grouping: 8^2/3, a
// numerator over a number), the ladder / tiles / chain picture only where the board does not say it all.
//
// Numbers are held EXACTLY as a sum of terms c · ∏ p^f (c a BigInt fraction, p prime, 0 < f < 1), so 2∛3, ⁶√72,
// (−8)^(1/3) and 1.08^(1/4) are all exact, like radicals are terms with the same ∏ p^f, and "rational" means only the
// plain part is left. A rational power of a negative base is read in lowest terms (the convention the prompts state):
// (−8)^(2/6) = (−8)^(1/3) = −2, an even denominator gives "not a real number". 0^0 and division by 0 are undefined.
// Expressions with a variable are compared exactly at several sample values (primes for x > 0; negatives and 0 too
// when x may be ANY real number); a domain is found by evaluating at many exact sample inputs around every boundary
// the item shows, then each choice's inequality is tested at the same inputs. Statements ("A = B = C", "X means Y",
// "… = 29, but … = 41") are judged by evaluating every link of the chain.

// ============================================================ BigInt rationals
const babs = a => (a < 0n ? -a : a);
const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
class R {
  constructor(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (d === 0n) throw new Undef('divzero');
    if (d < 0n) { n = -n; d = -d; }
    const g = bgcd(n, d) || 1n; this.n = n / g; this.d = d / g;
  }
  static of(x) {
    if (x instanceof R) return x;
    if (typeof x === 'bigint') return new R(x);
    const s = String(x);
    const m = s.match(/^(-?)(\d*)\.(\d+)$/);
    if (m) return new R(BigInt(m[1] + (m[2] || '0') + m[3]), 10n ** BigInt(m[3].length));
    return new R(BigInt(s));
  }
  add(o) { return new R(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new R(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new R(this.n * o.n, this.d * o.d); }
  div(o) { if (o.n === 0n) throw new Undef('divzero'); return new R(this.n * o.d, this.d * o.n); }
  neg() { return new R(-this.n, this.d); }
  eq(o) { return this.n === o.n && this.d === o.d; }
  sign() { return this.n > 0n ? 1 : this.n < 0n ? -1 : 0; }
  isInt() { return this.d === 1n; }
  floor() { let q = this.n / this.d; if (this.n < 0n && q * this.d !== this.n) q -= 1n; return q; }
  get value() { return Number(this.n) / Number(this.d); }
}
const R0 = new R(0n), R1 = new R(1n);
class Undef extends Error { constructor(kind) { super(kind); this.kind = kind; } }

// ---- prime factors of a positive BigInt
const FCACHE = new Map();
function factor(n) {
  const key = n.toString();
  if (FCACHE.has(key)) return FCACHE.get(key);
  const out = new Map();
  let m = n;
  for (let p = 2n; p * p <= m && p < 2000000n; p += (p === 2n ? 1n : 2n)) {
    while (m % p === 0n) { out.set(p, (out.get(p) ?? 0n) + 1n); m /= p; }
  }
  if (m > 1n) out.set(m, (out.get(m) ?? 0n) + 1n);
  FCACHE.set(key, out);
  return out;
}
const bpow = (b, k) => { let r = 1n; for (let i = 0n; i < k; i++) r *= b; return r; };

// ============================================================ exact values: Σ c · ∏ p^f
// a term: { c: R, fe: Map<bigint p, R f> } with 0 < f < 1; key = the radical part
const keyOf = fe => [...fe.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([p, f]) => `${p}:${f.n}/${f.d}`).join(',');
function mkTerm(c, exps) {   // c: R, exps: Map p → R (any rational) → normalised term
  const fe = new Map();
  for (const [p, e] of exps) {
    const k = e.floor(), f = e.sub(new R(k));
    if (k > 0n) c = c.mul(new R(bpow(p, k)));
    if (k < 0n) c = c.div(new R(bpow(p, -k)));
    if (f.n !== 0n) fe.set(p, f);
  }
  return { c, fe };
}
class S {
  constructor(m = new Map()) { this.m = m; }   // key → term
  static q(r) { const m = new Map(); if (r.n !== 0n) m.set('', { c: r, fe: new Map() }); return new S(m); }
  static t(t) { const m = new Map(); if (t.c.n !== 0n) m.set(keyOf(t.fe), t); return new S(m); }
  add(o) {
    const m = new Map(this.m);
    for (const [k, t] of o.m) {
      const c = (m.get(k)?.c ?? R0).add(t.c);
      if (c.n === 0n) m.delete(k); else m.set(k, { c, fe: t.fe });
    }
    return new S(m);
  }
  neg() { const m = new Map(); for (const [k, t] of this.m) m.set(k, { c: t.c.neg(), fe: t.fe }); return new S(m); }
  mul(o) {
    let r = new S();
    for (const a of this.m.values()) for (const b of o.m.values()) {
      const ex = new Map(a.fe);
      for (const [p, f] of b.fe) ex.set(p, (ex.get(p) ?? R0).add(f));
      r = r.add(S.t(mkTerm(a.c.mul(b.c), ex)));
    }
    return r;
  }
  isZero() { return this.m.size === 0; }
  isRational() { return this.m.size === 0 || (this.m.size === 1 && this.m.has('')); }
  rat() { return this.m.get('')?.c ?? R0; }
  single() { return this.m.size === 1 ? [...this.m.values()][0] : null; }
  eq(o) { return this.add(o.neg()).isZero(); }
  approx() {
    let s = 0;
    for (const t of this.m.values()) { let v = t.c.value; for (const [p, f] of t.fe) v *= Number(p) ** f.value; s += v; }
    return s;
  }
}
// a power of one term by a rational e (lowest terms: an even denominator of a negative base is not real)
function termPow(t, e) {
  let sg = 1;
  if (t.c.sign() < 0) {
    if (t.fe.size === 0 || true) { if (e.d % 2n === 0n) throw new Undef('notreal'); }
    if (e.n % 2n !== 0n) sg = -1;
  }
  const a = t.c.sign() < 0 ? t.c.neg() : t.c;
  const ex = new Map();
  for (const [p, k] of factor(a.n)) ex.set(p, new R(k).mul(e));
  for (const [p, k] of factor(a.d)) ex.set(p, (ex.get(p) ?? R0).sub(new R(k).mul(e)));
  for (const [p, f] of t.fe) ex.set(p, (ex.get(p) ?? R0).add(f.mul(e)));
  const r = mkTerm(R1, ex);
  return { c: sg < 0 ? r.c.neg() : r.c, fe: r.fe };
}

// ---- a value: exact s (or null when it cannot be held exactly) and its float v
const V = {
  q: r => ({ s: S.q(r), v: r.value }),
  add: (a, b) => ({ s: a.s && b.s ? a.s.add(b.s) : null, v: a.v + b.v }),
  neg: a => ({ s: a.s ? a.s.neg() : null, v: -a.v }),
  mul: (a, b) => ({ s: a.s && b.s ? a.s.mul(b.s) : null, v: a.v * b.v }),
  isZero: a => (a.s ? a.s.isZero() : Math.abs(a.v) < 1e-12),
  div(a, b) {
    if (V.isZero(b)) throw new Undef('divzero');
    const t = b.s?.single();
    if (t) return V.mul(a, { s: S.t(termPow(t, new R(-1n))), v: 1 / b.v });
    return { s: null, v: a.v / b.v };
  },
  pow(a, b, opt) {
    if (!(b.s && b.s.isRational())) {   // an irrational exponent: floats only (never needed by the lesson)
      if (a.v < 0) throw new Undef('notreal');
      return { s: null, v: a.v ** b.v };
    }
    const e = b.s.rat();
    if (V.isZero(a)) {
      if (e.sign() > 0) return V.q(R0);
      if (e.sign() < 0) throw new Undef('divzero');
      if (opt?.zz === 1) return V.q(R1);
      throw new Undef('zeropow');
    }
    if (a.s) {
      const t = a.s.single();
      if (t) { const r = termPow(t, e); return { s: S.t(r), v: S.t(r).approx() }; }
      if (e.isInt()) {   // a sum to a whole power
        let k = e.n < 0n ? -e.n : e.n, r = S.q(R1);
        while (k-- > 0n) r = r.mul(a.s);
        const out = { s: r, v: r.approx() };
        return e.n < 0n ? V.div(V.q(R1), out) : out;
      }
    }
    if (a.v < 0) {
      if (e.d % 2n === 0n) throw new Undef('notreal');
      const m = (-a.v) ** e.value;
      return { s: null, v: e.n % 2n ? -m : m };
    }
    return { s: null, v: a.v ** e.value };
  },
  abs: a => ((a.s ? a.s.approx() : a.v) < 0 ? V.neg(a) : a),
  eq(a, b) {
    if (a.s && b.s) return a.s.eq(b.s);
    return Math.abs(a.v - b.v) <= 1e-9 * Math.max(1, Math.abs(a.v), Math.abs(b.v));
  },
};

// ============================================================ HTML / TeX → one linear text → tokens → tree
// linear text: numbers, single-letter variables, π, ops + - * / ^ ( ), "#n(" an nth root, "@(" an absolute value,
// "±" kept (an expression with ± is never one value).
function decode(h) {
  return String(h).replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&nbsp;|&#160;|&thinsp;|&#8201;|&#8202;/g, ' ')
    .replace(/&minus;/g, '−').replace(/&times;/g, '×').replace(/&divide;/g, '÷').replace(/&le;/g, '≤').replace(/&ge;/g, '≥')
    .replace(/&ne;/g, '≠').replace(/&pi;/g, 'π').replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, '&');
}
function htmlLin(h) {
  let s = String(h);
  for (let i = 0; i < 8; i++) {
    const b = s;
    s = s.replace(/<span class="fr"><span>((?:(?!<\/?span)[\s\S])*)<\/span><span>((?:(?!<\/?span)[\s\S])*)<\/span><\/span>/g, '(($1)/($2))');
    if (s === b) break;
  }
  // a small index before a root sign: ⁵√ (after a variable or a bracket it would be an exponent: x²√(10x))
  s = s.replace(/(<\/i>|\))?<sup>(\d+)<\/sup>(√|∛|∜)<u class="rb">/g, (m, pre, n, r) =>
    (pre || Number(n) < 5 || r !== '√' ? m : `#${n}(`));
  s = s.replace(/√<u class="rb">/g, '#2(').replace(/∛<u class="rb">/g, '#3(').replace(/∜<u class="rb">/g, '#4(').replace(/<\/u>/g, ')');
  s = s.replace(/<sup>/g, '^(').replace(/<\/sup>/g, ')');
  s = s.replace(/<s class="pp">([()])<\/s>/g, '$1').replace(/<[^>]+>/g, '');
  return lin(decode(s));
}
function texLin(t) {
  let s = String(t).replace(/\\left|\\right/g, '').replace(/\\[,;:! ]|\\q?quad/g, ' ');
  s = s.replace(/\\[td]?frac(\d)(\d)/g, '{($1)/($2)}');
  for (let i = 0; i < 12; i++) {
    const b = s;
    s = s.replace(/\\sqrt\[(\d+)\]\{([^{}]*)\}/g, '#$1($2)').replace(/\\sqrt\{([^{}]*)\}/g, '#2($1)')
      .replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\^\{([^{}]*)\}/g, '^($1)')
      .replace(/\\text\{([^{}]*)\}/g, ' $1 ').replace(/(^|[^\\a-zA-Z\]}])\{([^{}]*)\}/g, '$1($2)');
    if (s === b) break;
  }
  s = s.replace(/\\cdot/g, '*').replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\\pi/g, 'π').replace(/\\pm/g, '±')
    .replace(/\\ge(q)?/g, '≥').replace(/\\le(q)?/g, '≤').replace(/\\ne(q)?/g, '≠').replace(/\\approx/g, '≈');
  return lin(s);
}
const lin = s => s.replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/\|([^|]+)\|/g, '@($1)').replace(/\s+/g, ' ').trim();

function tokenize(str) {
  const s = str, out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    const rest = s.slice(i);
    let m = rest.match(/^\d+(\.\d+)?|^\.\d+/);
    if (m) { out.push({ t: 'n', v: R.of(m[0].startsWith('.') ? '0' + m[0] : m[0]) }); i += m[0].length; continue; }
    m = rest.match(/^#(\d+)\(/);
    if (m) { out.push({ t: 'root', n: Number(m[1]) }); i += m[0].length - 1; continue; }
    if (c === '@') { out.push({ t: 'abs' }); i++; continue; }
    if (/[a-zA-Z]/.test(c)) { out.push({ t: 'v', name: c }); i++; continue; }
    if (c === 'π') { out.push({ t: 'pi' }); i++; continue; }
    if (c === '±') { out.push({ t: 'pm' }); i++; continue; }
    if ('+-*/^()'.includes(c)) { out.push({ t: 'o', o: c }); i++; continue; }
    throw new Error(`cannot read "${c}" in ${str}`);
  }
  return out;
}
function parse(str) {
  const T = tokenize(str);
  let p = 0;
  const isO = o => T[p]?.t === 'o' && T[p].o === o;
  const startsAtom = tk => tk && (tk.t === 'v' || tk.t === 'pi' || tk.t === 'root' || tk.t === 'abs' || tk.t === 'n' || (tk.t === 'o' && tk.o === '('));
  function expr() {
    let a = term();
    while (isO('+') || isO('-') || T[p]?.t === 'pm') {
      if (T[p].t === 'pm') throw new Error('±');
      const o = T[p++].o; a = { t: 'op', op: o, l: a, r: term() };
    }
    return a;
  }
  function term() {
    let a = unary();
    for (;;) {
      if (isO('*') || isO('/')) { const o = T[p++].o; a = { t: 'op', op: o, l: a, r: unary() }; continue; }
      if (startsAtom(T[p])) { a = { t: 'op', op: '*', l: a, r: power() }; continue; }
      break;
    }
    return a;
  }
  function unary() {
    if (isO('-')) { p++; return { t: 'neg', a: unary() }; }
    if (isO('+')) { p++; return unary(); }
    if (T[p]?.t === 'pm') throw new Error('±');
    return power();
  }
  function power() {
    const b = atom();
    if (isO('^')) { p++; const e = isO('-') ? (p++, { t: 'neg', a: power() }) : power(); return { t: 'pow', b, e }; }
    return b;
  }
  function atom() {
    const tk = T[p++];
    if (!tk) throw new Error(`unexpected end in ${str}`);
    if (tk.t === 'n') return { t: 'num', v: tk.v };
    if (tk.t === 'v') return { t: 'var', name: tk.name };
    if (tk.t === 'pi') return { t: 'pi' };
    if (tk.t === 'root') { const a = atom(); return { t: 'root', n: tk.n, a }; }
    if (tk.t === 'abs') { const a = atom(); return { t: 'abs', a }; }
    if (tk.t === 'o' && tk.o === '(') { const e = expr(); if (!isO(')')) throw new Error(`missing ) in ${str}`); p++; return e; }
    throw new Error(`unexpected ${JSON.stringify(tk)} in ${str}`);
  }
  const e = expr();
  if (p !== T.length) throw new Error(`left over in ${str}`);
  return e;
}
function ev(n, env = {}, opt = {}) {
  switch (n.t) {
    case 'num': return V.q(n.v);
    case 'pi': return { s: null, v: Math.PI };
    case 'var': { if (!(n.name in env)) throw new Error(`no value for ${n.name}`); return env[n.name]; }
    case 'neg': return V.neg(ev(n.a, env, opt));
    case 'abs': return V.abs(ev(n.a, env, opt));
    case 'root': return V.pow(ev(n.a, env, opt), V.q(new R(1n, BigInt(n.n))), opt);
    case 'pow': return V.pow(ev(n.b, env, opt), ev(n.e, env, opt), opt);
    case 'op': {
      const a = ev(n.l, env, opt), b = ev(n.r, env, opt);
      return n.op === '+' ? V.add(a, b) : n.op === '-' ? V.add(a, V.neg(b)) : n.op === '*' ? V.mul(a, b) : V.div(a, b);
    }
  }
  throw new Error(`bad node ${n.t}`);
}
const vars = (n, set = new Set()) => {
  if (!n) return set;
  if (n.t === 'var') set.add(n.name);
  for (const k of ['a', 'b', 'e', 'l', 'r']) if (n[k]) vars(n[k], set);
  return set;
};
const tryEv = (n, env, opt) => { try { return ev(n, env, opt); } catch (e) { if (e instanceof Undef) return null; throw e; } };
const tryParse = s => { try { return parse(s); } catch { return null; } };
const valOf = x => V.q(R.of(x));
const rq = (n, d = 1) => V.q(new R(BigInt(n), BigInt(d)));

// sample environments: every variable positive (distinct primes, then other fractions), or any real (negatives, 0)
const POS = [[2, 1], [3, 1], [5, 1], [7, 1], [11, 1], [13, 3], [7, 2], [5, 3]];
function envs(names, anyReal) {
  const ns = [...names], out = [];
  const sets = anyReal ? [...POS, [-2, 1], [-3, 1], [-5, 2], [0, 1], [-7, 3], [1, 1], [-1, 1]] : POS;
  for (let i = 0; i < sets.length; i++) {
    const e = {};
    ns.forEach((nm, j) => { const [a, b] = sets[(i + j) % sets.length]; e[nm] = rq(a, b); });
    out.push(e);
  }
  if (!ns.length) out.splice(1);
  return out;
}
// do two trees give the same value everywhere they are asked (both defined)?
function sameFn(a, b, anyReal, opt) {
  const names = new Set([...vars(a), ...vars(b)]);
  for (const e of envs(names, anyReal)) {
    const x = tryEv(a, e, opt), y = tryEv(b, e, opt);
    if (!x || !y) { if (x || y) return false; continue; }
    if (!V.eq(x, y)) return false;
  }
  return true;
}

// ============================================================ helpers on the item
const boardExpr = q => texLin(String(q.board).replace(/=\s*\\,\?\s*$/, '').replace(/\\approx\s*\\,\?\s*$/, '').replace(/\\overset\{\?\}\{=\}/g, '='));
const isNotReal = h => /not a real number/i.test(h);
const isNoCombine = h => /already in simplest form|cannot be combined/i.test(h);
const answerOf = (q, v) => {
  if (!v.s || !v.s.isRational()) return Number(v.v.toFixed(10));
  const r = v.s.rat();
  if (q.input === 'frac') return [Number(r.n), Number(r.d)];
  return Number(r.n) / Number(r.d);
};
const opts = q => ({ zz: /0\^0 is (defined|1)|0<sup>0<\/sup> = 1/.test(q.promptHtml) ? 1 : 0 });

// simplest radical form: every radicand a whole number with no nth-power factor (variables: exponents < n),
// no root under a fraction bar, no fraction under a root
function simplest(n, under = false) {
  if (!n) return true;
  if (n.t === 'root') {
    const env = {}; let k = 101;
    for (const v of vars(n.a)) env[v] = rq(k += 2);
    const x = tryEv(n.a, env);
    if (!x || !x.s) return false;
    const t = x.s.single();
    if (!t) return true;   // a sum under the root: nothing to check here
    if (!t.c.isInt() || t.fe.size) return false;
    for (const [, e] of factor(babs(t.c.n))) if (e >= BigInt(n.n)) return false;
    return !under && simplest(n.a, false);
  }
  if (n.t === 'op' && n.op === '/') return simplest(n.l, under) && !hasRoot(n.r) && simplest(n.r, under);
  for (const k of ['a', 'b', 'e', 'l', 'r']) if (n[k] && !simplest(n[k], under)) return false;
  return true;
}
const hasRoot = n => !!n && (n.t === 'root' || (n.t === 'pow' && n.e.t !== 'num' && !(n.e.t === 'neg' && n.e.a.t === 'num')) ||
  ['a', 'b', 'l', 'r'].some(k => n[k] && hasRoot(n[k])));

// the one choice equal to the board; ties broken by simplest form; text choices ("not a real number",
// "already in simplest form") as the item asks
function choiceEqual(q, target, { anyReal = false, opt = {} } = {}) {
  const hs = q.choicesHtml ?? q.choices;
  const tv = (() => { try { return target ? (vars(target).size ? 'fn' : ev(target, {}, opt)) : null; } catch (e) { if (e instanceof Undef) return e; throw e; } })();
  if (tv instanceof Undef) {
    const i = hs.findIndex(h => (tv.kind === 'notreal' ? isNotReal(h) : /undefined|no value/i.test(h)));
    return i >= 0 ? [i] : [];
  }
  const eqs = [];
  hs.forEach((h, i) => {
    if (isNotReal(h) || isNoCombine(h)) return;
    const a = tryParse(htmlLin(h));
    if (!a) return;
    if (sameFn(target, a, anyReal, opt) && envsDefined(a, target, anyReal, opt)) eqs.push({ i, a });
  });
  if (eqs.length > 1 && /simplif|simplest|rational denominator|rationalize/i.test(q.promptHtml)) {   // the item asks for the simplest form
    const s = eqs.filter(x => simplest(x.a));
    if (s.length >= 1) return s.map(x => x.i);
  }
  if (eqs.length) return eqs.map(x => x.i);
  const nc = hs.findIndex(isNoCombine);
  return nc >= 0 ? [nc] : [];
}
// a choice must have a value wherever the board has one
function envsDefined(a, target, anyReal, opt) {
  const names = new Set([...vars(a), ...vars(target)]);
  for (const e of envs(names, anyReal)) if (!!tryEv(a, e, opt) !== !!tryEv(target, e, opt)) return false;
  return true;
}

// ---- statements: "A = B = C", "X means Y", ", but" joins two chains
function statementTrue(h, everyX = false) {
  const t = decode(String(h));
  if (/calculator|No exponent law/i.test(t.replace(/<[^>]+>/g, ''))) return false;
  const segs = t.split(/,\s*but\s+|:\s|,\s*so\s|,\s*which\s/).map(x => x.replace(/\bmeans\b/g, '=')).filter(x => x.includes('='));
  if (!segs.length) return false;
  for (const sg of segs) {
    const parts = htmlLin(sg.replace(/\.\s*$/, '')).split('=').map(x => x.trim()).filter(Boolean);
    if (parts.length < 2) return false;
    const trees = parts.map(tryParse);
    if (trees.some(x => !x)) return false;
    for (let i = 1; i < trees.length; i++) {
      if (!sameFn(trees[i - 1], trees[i], everyX)) return false;
      if (everyX) {   // true for EVERY real x: both sides must have a value everywhere
        for (const e of envs(new Set([...vars(trees[i - 1]), ...vars(trees[i])]), true)) if (!tryEv(trees[i - 1], e) || !tryEv(trees[i], e)) return false;
      }
    }
  }
  return true;
}

// ---- sets of numbers: "x ≥ −4", "0 ≤ t < 100", "x ≠ 3", "all real numbers"
function setPred(text) {
  const t = lin(decode(String(text).replace(/<[^>]+>/g, ''))).replace(/&/g, '');
  if (/all real/i.test(t)) return () => true;
  const parts = t.split(/\s*(≤|≥|<|>|≠|=)\s*/);
  if (parts.length < 3) return null;
  const conds = [];
  for (let i = 1; i < parts.length; i += 2) {
    const a = parts[i - 1], op = parts[i], b = parts[i + 1];
    const num = s => (/^-?\d+(\.\d+)?$/.test(s) ? R.of(s) : null);
    let L = num(a), Rr = num(b);
    if (L === null && Rr === null) return null;
    conds.push(x => {
      const l = L ?? x, r = Rr ?? x, c = l.sub(r).sign();
      return op === '≤' ? c <= 0 : op === '≥' ? c >= 0 : op === '<' ? c < 0 : op === '>' ? c > 0 : op === '≠' ? c !== 0 : c === 0;
    });
  }
  return x => conds.every(f => f(x));
}
function samplePoints(texts) {
  const pts = new Map();
  const add = r => pts.set(`${r.n}/${r.d}`, r);
  for (let k = -120; k <= 220; k++) { add(new R(BigInt(k))); add(new R(BigInt(2 * k + 1), 2n)); }
  for (const t of texts) for (const m of String(t).replace(/[−–]/g, '-').matchAll(/-?\d+(\.\d+)?/g)) {
    const r = R.of(m[0]);
    for (const d of [R0, new R(1n, 1000n), new R(-1n, 1000n)]) { add(r.add(d)); add(r.neg().add(d)); }
  }
  for (const big of [1000n, -1000n, 100000n, -100000n]) add(new R(big));
  return [...pts.values()];
}
function pickSet(q, target) {
  const hs = q.choicesHtml ?? q.choices;
  const pts = samplePoints([q.promptHtml, q.board, ...hs]);
  const want = pts.map(target);
  const hits = [];
  hs.forEach((h, i) => { const p = setPred(h); if (p && pts.every((x, j) => p(x) === want[j])) hits.push(i); });
  return hits;
}
const defined = (tree, name, opt) => x => !!tryEv(tree, { [name]: V.q(x) }, opt);
const oneVar = tree => { const v = [...vars(tree)]; return v.length === 1 ? v[0] : 'x'; };
// split a TeX line on top-level "=" / "," (outside brackets)
function splitTop(s, chars) {
  const out = []; let d = 0, cur = '';
  for (const c of s) {
    if ('({['.includes(c)) d++;
    if (')}]'.includes(c)) d--;
    if (d === 0 && chars.includes(c)) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur);
  return out.map(x => x.trim());
}
const rhsOf = s => { const p = splitTop(s, '='); return p[p.length - 1]; };

// ============================================================ the families
const PAIR_ROOT = { '√': 2, '∛': 3, '∜': 4 };
function solvePair(q) {
  const lead = q.pair.lead, op = q.pair.op, tail = q.pair.tail;
  const lhs = parse(texLin(splitTop(String(q.board).replace(/\\left|\\right/g, ''), '=')[0]));
  // x^? : one power of x, the exponent as a fraction
  if (/x\^\{\\,\?\}\s*$/.test(q.board) || /x\^\{?\\,?\?/.test(q.board)) {
    const v = ev(lhs, { x: rq(2) }).s.single();
    return expOf2(v);
  }
  // a^p · ⁿ√(a^q)
  const mv = op.match(/(√|∛|∜)\s*([a-z])\s*\^/);
  if (/\^\s*$/.test(lead) && mv) {
    const n = PAIR_ROOT[mv[1]], name = mv[2];
    const e = expOf2(ev(lhs, { [name]: rq(2) }).s.single());
    const er = new R(BigInt(e[0]), BigInt(e[1]));
    const p = er.floor(), rest = er.sub(new R(p)).mul(new R(BigInt(n)));
    if (!rest.isInt()) return undefined;
    return [Number(p), Number(rest.n)];
  }
  const val = ev(lhs, {}).s;
  // c · ⁿ√r
  if (lead === '' && PAIR_ROOT[op.trim()]) {
    const n = BigInt(PAIR_ROOT[op.trim()]);
    if (val.isZero()) return [0, 1];
    const t = val.single();
    if (!t) return undefined;
    let r = 1n;
    for (const [p, f] of t.fe) { const k = f.mul(new R(n)); if (!k.isInt()) return undefined; r *= bpow(p, k.n); }
    if (!t.c.isInt()) return undefined;
    return [Number(t.c.n), Number(r)];
  }
  // a + b√k
  const mk = tail.match(/^(√|∛|∜)\s*(\d+)$/);
  if (op.trim() === '+' && mk) {
    const kt = ev(parse(`#${PAIR_ROOT[mk[1]]}(${mk[2]})`)).s.single();
    const key = keyOf(kt.fe);
    let a = R0, b = R0;
    for (const [k, t] of val.m) {
      if (k === '') a = t.c;
      else if (k === key) b = t.c.div(kt.c);
      else return undefined;
    }
    return [a.value, b.value];
  }
  return undefined;
}
function expOf2(t) {   // t = 2^e exactly → [num, den] of e
  if (!t) return undefined;
  for (const p of t.fe.keys()) if (p !== 2n) return undefined;
  let k = 0n, c = t.c;
  if (c.sign() <= 0) return undefined;
  let n = c.n, d = c.d;
  while (n % 2n === 0n) { n /= 2n; k++; }
  while (d % 2n === 0n) { d /= 2n; k--; }
  if (n !== 1n || d !== 1n) return undefined;
  const e = new R(k).add(t.fe.get(2n) ?? R0);
  return [Number(e.n), Number(e.d)];
}

function firstFr(html) {
  const m = String(html).match(/<span class="fr"><span>((?:(?!<\/?span)[\s\S])*)<\/span><span>((?:(?!<\/?span)[\s\S])*)<\/span><\/span>/);
  return m ? { top: m[1], bot: m[2] } : null;
}

const CHOICE = {
  // a form of 1 that makes the denominator rational
  formOfOne(q) {
    const den = parse(htmlLin(firstFr(q.promptHtml).bot));
    const d = ev(den);
    const hits = [];
    q.choicesHtml.forEach((h, i) => {
      if (/bottom only/.test(h)) return;
      const f = firstFr(h);
      if (!f || htmlLin(f.top) !== htmlLin(f.bot) || h.replace(/<span class="fr">.*<\/span><\/span>/, '').trim()) return;
      const m = ev(parse(htmlLin(f.top)));
      if (V.isZero(m)) return;
      const pr = V.mul(d, m);
      if (pr.s && pr.s.isRational()) hits.push(i);
    });
    return hits;
  },
  radQuotForm(q) {
    const hits = [];
    q.choicesHtml.forEach((h, i) => {
      const f = firstFr(h);
      if (!f) return;
      const a = tryParse(htmlLin(f.top)), b = tryParse(htmlLin(f.bot));
      if (!a || !b || a.t !== 'root' || b.t !== 'root' || a.n !== b.n) return;
      const x = tryEv(a), y = tryEv(b);
      if (!x || !y || V.isZero(y)) return;
      hits.push(i);
    });
    return hits;
  },
  statements(q, everyX) { return (q.choicesHtml).map((h, i) => (statementTrue(h, everyX) ? i : -1)).filter(i => i >= 0); },
  calcKeys(q) {
    const t = ev(parse(boardExpr(q)));
    return q.choices.map((c, i) => { const a = tryParse(lin(c)); const v = a && tryEv(a); return v && Math.abs(v.v - t.v) < 1e-9 * Math.max(1, Math.abs(t.v)) ? i : -1; }).filter(i => i >= 0);
  },
  estimate(q) {
    const t = ev(parse(boardExpr(q))).v;
    return q.choices.map((c, i) => {
      let m = c.match(/between\s+(-?[\d.]+)\s+and\s+(-?[\d.]+)/);
      if (m) return Number(m[1]) < t && t < Number(m[2]) ? i : -1;
      m = c.replace(/[−]/g, '-').match(/about\s+(-?\d+(?:\.(\d+))?)/);
      if (m) { const dp = (m[2] ?? '').length; return Math.abs(Number(m[1]) - t) <= 0.5 * 10 ** -dp + 1e-12 ? i : -1; }
      return -1;
    }).filter(i => i >= 0);
  },
  flawStep(q) {
    const lines = q.data?.picture?.chain?.lines ?? [String(q.board)];
    const exprs = [];
    for (const l of lines) for (const p of splitTop(l.replace(/\\left|\\right/g, ''), '=')) if (p) exprs.push(parse(texLin(p)));
    const vals = exprs.map(e => tryEv(e));
    const bad = [];
    for (let k = 1; k < vals.length; k++) if (!vals[k - 1] || !vals[k] || !V.eq(vals[k - 1], vals[k])) bad.push(k);
    return q.choices.map((c, i) => { const m = c.match(/Step\s+(\d+)/); return m && bad.length === 1 && Number(m[1]) === bad[0] ? i : -1; }).filter(i => i >= 0);
  },
  // the set of inputs: defined (domain), or as a context / two conditions ask
  domain(q, opt) {
    const f = parse(texLin(rhsOf(String(q.board))));
    const name = oneVar(f);
    return pickSet(q, defined(f, name, opt));
  },
  domKind(q, opt) {
    const pts = samplePoints([...q.choicesHtml]);
    return q.choicesHtml.map((h, i) => { const f = tryParse(htmlLin(h)); if (!f) return -1; const nm = oneVar(f); return pts.every(defined(f, nm, opt)) ? i : -1; }).filter(i => i >= 0);
  },
  keepDomain(q, opt) {
    const [l, r] = splitTop(String(q.board).replace(/\\,\?\s*$/, '').replace(/\\left|\\right/g, ''), '=').map(x => parse(texLin(x)));
    const name = oneVar(l);
    return pickSet(q, x => { const a = tryEv(l, { [name]: V.q(x) }, opt), b = tryEv(r, { [name]: V.q(x) }, opt); return !!a && !!b && V.eq(a, b); });
  },
  ctxDomain(q, opt) {
    const f = parse(texLin(rhsOf(String(q.board))));
    const name = oneVar(f);
    const P = decode(String(q.promptHtml).replace(/<[^>]+>/g, ''));
    const conds = [defined(f, name, opt)];
    if (/from noon on|after noon|from the start/i.test(P)) conds.push(x => x.sign() >= 0);
    if (/longer than 0|still exists|bigger than 0|more than 0/i.test(P)) conds.push(x => { const v = tryEv(f, { [name]: V.q(x) }, opt); return !!v && v.v > 0; });
    if (/positive length|positive/i.test(P)) conds.push(x => x.sign() > 0);
    const m = P.match(/no longer than (\d+(?:\.\d+)?)|at most (\d+(?:\.\d+)?)/i);
    if (m) { const lim = R.of(m[1] ?? m[2]); conds.push(x => x.sub(lim).sign() <= 0); }
    return pickSet(q, x => conds.every(c => c(x)));
  },
  ctxOverlap(q) {
    const parts = String(q.board).split(/\\;?\\text\{\s*and\s*\}\\;?/).map(texLin);
    const ps = parts.map(setPred);
    if (ps.some(p => !p)) return [];
    return pickSet(q, x => ps.every(p => p(x)));
  },
  inputs(q, opt, wantAgree) {
    const sides = splitTop(String(q.board).replace(/\\left|\\right/g, '').replace(/\\q?quad/g, ' '), ',').map(s => parse(texLin(rhsOf(s))));
    return q.choices.map((c, i) => {
      const m = lin(c).match(/^([a-z])\s*=\s*(-?\d+(?:\.\d+)?)$/);
      if (!m) return -1;
      const env = { [m[1]]: V.q(R.of(m[2])) };
      if (wantAgree === 'defined') return tryEv(sides[0], env, opt) ? i : -1;
      const a = tryEv(sides[0], env, opt), b = tryEv(sides[1], env, opt);
      const agree = !!a && !!b && V.eq(a, b);
      return agree ? -1 : i;
    }).filter(i => i >= 0);
  },
};

function candidates(q) {
  const f = q.family, opt = opts(q);
  if (q.input === 'pair') return null;
  if (q.input === 'num' || q.input === 'frac') return null;
  switch (f) {
    case 'unitWhy': case 'sumVsProd': return CHOICE.statements(q, false);
    case 'lawHolds': return CHOICE.statements(q, true);
    case 'radQuotForm': if (/ONE root/.test(q.promptHtml)) return CHOICE.radQuotForm(q); break;
    case 'ratFactor': case 'conjPick': return CHOICE.formOfOne(q);
    case 'calcKeys': return CHOICE.calcKeys(q);
    case 'estimate': return CHOICE.estimate(q);
    case 'flawStep': return CHOICE.flawStep(q);
    case 'domLin': case 'domDen': case 'domPow': case 'domPowLin': return CHOICE.domain(q, opt);
    case 'domKind': return /Which function/.test(q.promptHtml) ? CHOICE.domKind(q, opt) : CHOICE.domain(q, opt);
    case 'keepDomain': return CHOICE.keepDomain(q, opt);
    case 'ctxDomain': return CHOICE.ctxDomain(q, opt);
    case 'ctxOverlap': return CHOICE.ctxOverlap(q);
    case 'allowedInput': return CHOICE.inputs(q, opt, 'defined');
    case 'samePair': return CHOICE.inputs(q, opt, 'disagree');
  }
  // "which form equals …": the board is the expression
  const anyReal = /ANY real/i.test(q.promptHtml);
  return choiceEqual(q, parse(boardExpr(q)), { anyReal, opt });
}

export default {
  solve(q) {
    if (q.input === 'pair') return solvePair(q);
    if (q.input === 'num' || q.input === 'frac') {
      const b = String(q.board);
      const at = b.match(/^(.*)\\;?\\text\{\s*at\s*\}\\;?\s*([a-z])\s*=\s*(-?[\d.]+)\s*$/);
      if (at) return answerOf(q, ev(parse(texLin(at[1])), { [at[2]]: valOf(at[3]) }, opts(q)));
      return answerOf(q, ev(parse(boardExpr(q)), {}, opts(q)));
    }
    const c = candidates(q);
    if (!c || !c.length) throw new Error('no choice fits');
    return c[0];
  },
  sane(q) {
    if (q.input === 'choice') {
      const c = candidates(q);
      if (c && c.length > 1) return `${c.length} choices are right: ${c.map(i => q.choices[i]).join(' | ')}`;
    }
    if (q.input === 'pair' && q.pair?.op && PAIR_ROOT[q.pair.op.trim()] && q.pair.lead === '') {
      const a = solvePair(q);
      if (a && a[0] === 0) return 'the answer is 0: the radicand box has no single right value';
    }
    if (/^\s*[\d.]+<sup>/.test(q.promptHtml)) return 'the prompt starts with a bare expression (a context sentence is missing)';
    return '';
  },
};
