// Oracle for the lesson "polynomial-identities" (Algebra 2, lesson 3: polynomial operations and identities). Role O,
// docs/lessons/QUALITY_LAYER.md. Written from what the student sees only: the prompt, the board TeX, the choices and
// the picture data the page draws (the area square's side parts and pieces, the product box's factor terms, the chain
// of lines on the slate). Every expression is parsed into an exact multivariate polynomial (any single letter is a
// variable, Q coefficients), quotients are kept as num/den and are a polynomial only when the division is exact.
// "Equal" always means equal after full expansion (never equal as text); an identity claim must expand to 0 = 0, a
// counterexample must really make the two sides differ, an audit points at the first line that is not equal to the
// line before it, and every choice is judged on its own: exactly one right choice, or -1 (the sweep reports it).
import { Q, nums } from '../../tools/quality/oracle-kit.mjs';

// ============================================================ text → expression string
/** board TeX → a plain expression string with explicit grouping */
function fromTex(t) {
  let s = String(t ?? '');
  for (let i = 0; i < 8; i++) {
    const b = s;
    s = s.replace(/\\cssId\{[^{}]*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1')
      .replace(/\\(?:text|mathrm|textbf)\{([^{}]*)\}/g, ' \u0001$1\u0002 ')
      .replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
      .replace(/\^\{([^{}]*)\}/g, '^($1)');
    if (s === b) break;
  }
  return s.replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\checkmark/g, ' ✓ ').replace(/\\left|\\right/g, '')
    .replace(/\\quad|\\qquad|\\[,;:! ]|~/g, ' ').replace(/\\[a-zA-Z]+/g, ' ').replace(/[{}]/g, '').replace(/[−–]/g, '-')
    .replace(/\s+/g, ' ').trim();
}
/** a chain line → its expression: drop "Left:" / "Right:", a leading "=", and any trailing \text{...} remark */
function lineExpr(t) {
  let s = fromTex(t).replace(/\u0001\s*(?:Left|Right):?\s*\u0002/g, ' ').trim();
  s = s.replace(/\u0001[\s\S]*$/, '').trim();
  return s.replace(/^=\s*/, '').trim();
}
const plain = s => String(s ?? '').replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();

// ============================================================ exact multivariate polynomials
// a monomial key: letters with exponents, sorted, e.g. "x2y1"; '' is the constant
const keyOf = m => Object.keys(m).filter(v => m[v] !== 0).sort().map(v => `${v}${m[v]}`).join('');
const monoOf = k => { const m = {}; for (const [, v, e] of k.matchAll(/([a-z])(-?\d+)/g)) m[v] = Number(e); return m; };
const degOfKey = k => Object.values(monoOf(k)).reduce((a, b) => a + b, 0);
class Poly {
  constructor(m = new Map()) { this.m = m; }
  static c(q) { q = typeof q === 'object' ? q : Q(q); const m = new Map(); if (q.n !== 0) m.set('', q); return new Poly(m); }
  static v(x) { return new Poly(new Map([[`${x}1`, Q(1)]])); }
  add(o) {
    const m = new Map(this.m);
    for (const [k, c] of o.m) { const v = (m.get(k) ?? Q(0)).add(c); if (v.n === 0) m.delete(k); else m.set(k, v); }
    return new Poly(m);
  }
  neg() { const m = new Map(); for (const [k, c] of this.m) m.set(k, c.neg()); return new Poly(m); }
  sub(o) { return this.add(o.neg()); }
  scale(q) { const m = new Map(); if (q.n !== 0) for (const [k, c] of this.m) m.set(k, c.mul(q)); return new Poly(m); }
  mul(o) {
    let r = new Poly();
    for (const [ka, ca] of this.m) for (const [kb, cb] of o.m) {
      const a = monoOf(ka), b = monoOf(kb);
      for (const [v, e] of Object.entries(b)) a[v] = (a[v] ?? 0) + e;
      r = r.add(new Poly(new Map([[keyOf(a), ca.mul(cb)]])));
    }
    return r;
  }
  pow(n) { let r = Poly.c(1); for (let i = 0; i < n; i++) r = r.mul(this); return r; }
  isZero() { return this.m.size === 0; }
  isConst() { return [...this.m.keys()].every(k => k === ''); }
  cval() { return this.m.get('') ?? Q(0); }
  eq(o) { return this.sub(o).isZero(); }
  coef(k) { return this.m.get(k) ?? Q(0); }
  deg() { return this.m.size ? Math.max(...[...this.m.keys()].map(degOfKey)) : null; }
  vars() { const s = new Set(); for (const k of this.m.keys()) for (const v of Object.keys(monoOf(k))) s.add(v); return [...s].sort(); }
  at(env) {
    let s = Q(0);
    for (const [k, c] of this.m) {
      let t = c;
      for (const [v, e] of Object.entries(monoOf(k))) { if (!(v in env)) throw new Error(`no value for ${v}`); for (let i = 0; i < e; i++) t = t.mul(env[v]); }
      s = s.add(t);
    }
    return s;
  }
  // leading term in lex order (letters a < b < ... compared by exponent)
  lt() {
    let best = null;
    for (const k of this.m.keys()) if (best === null || lexCmp(k, best) > 0) best = k;
    return best;
  }
}
function lexCmp(ka, kb) {
  const a = monoOf(ka), b = monoOf(kb);
  for (const v of 'abcdefghijklmnopqrstuvwxyz') { const d = (a[v] ?? 0) - (b[v] ?? 0); if (d) return d; }
  return 0;
}
/** exact division n ÷ d of polynomials: the quotient, or null when d does not divide n */
function exactDiv(n, d) {
  if (d.isZero()) throw new Error('division by 0');
  let r = n, quo = new Poly();
  const ld = d.lt(), cd = d.coef(ld), md = monoOf(ld);
  for (let guard = 0; !r.isZero() && guard < 500; guard++) {
    const lr = r.lt(), mr = monoOf(lr), t = {};
    for (const [v, e] of Object.entries(md)) { if ((mr[v] ?? 0) < e) return null; }
    for (const [v, e] of Object.entries(mr)) t[v] = e - (md[v] ?? 0);
    const term = new Poly(new Map([[keyOf(t), r.coef(lr).div(cd)]]));
    quo = quo.add(term); r = r.sub(term.mul(d));
  }
  return r.isZero() ? quo : null;
}
/** a quotient n/d; poly() is the polynomial when the division is exact, else null */
class Rat {
  constructor(n, d = Poly.c(1)) { this.n = n; this.d = d; }
  add(o) { return new Rat(this.n.mul(o.d).add(o.n.mul(this.d)), this.d.mul(o.d)); }
  neg() { return new Rat(this.n.neg(), this.d); }
  sub(o) { return this.add(o.neg()); }
  mul(o) { return new Rat(this.n.mul(o.n), this.d.mul(o.d)); }
  div(o) { if (o.n.isZero()) throw new Error('division by 0'); return new Rat(this.n.mul(o.d), this.d.mul(o.n)); }
  pow(e) {
    const p = e.poly();
    if (!p || !p.isConst() || p.cval().d !== 1 || p.cval().n < 0) throw new Error('bad exponent');
    const k = p.cval().n;
    return new Rat(this.n.pow(k), this.d.pow(k));
  }
  poly() { return exactDiv(this.n, this.d); }
}

// ============================================================ parser
function tokens(s) {
  const out = [];
  const str = plain(s);
  const re = /\s*(\d+(?:\.\d+)?|\.\d+|[a-z]|[-+*·×÷/^()])/y;
  let i = 0;
  while (i < str.length) {
    if (/\s/.test(str[i])) { i++; continue; }
    re.lastIndex = i;
    const m = re.exec(str);
    if (!m) throw new Error(`cannot read "${str.slice(i)}" in "${str}"`);
    out.push(m[1]); i = re.lastIndex;
  }
  return out;
}
/** parse an expression into { rat, terms } — terms = the written top-level summands (as Rat), each with its sign */
function parse(s) {
  const T = tokens(s);
  let p = 0;
  const peek = () => T[p], next = () => T[p++];
  const startsAtom = t => t !== undefined && (/^[\d.]/.test(t) || /^[a-z]$/.test(t) || t === '(');
  function sum() {
    const terms = [];
    let sign = 1;
    if (peek() === '+' || peek() === '-') sign = next() === '-' ? -1 : 1;
    terms.push(sign < 0 ? product().neg() : product());
    while (peek() === '+' || peek() === '-') { const sg = next() === '-' ? -1 : 1; const t = product(); terms.push(sg < 0 ? t.neg() : t); }
    return terms;
  }
  function unary() { if (peek() === '-') { next(); return unary().neg(); } if (peek() === '+') { next(); return unary(); } return power(); }
  function product() {
    let v = unary();
    for (;;) {
      const t = peek();
      if (t === '*' || t === '·' || t === '×') { next(); v = v.mul(unary()); }
      else if (t === '/' || t === '÷') { next(); v = v.div(unary()); }
      else if (startsAtom(t)) v = v.mul(power());
      else break;
    }
    return v;
  }
  function power() { const b = atom(); if (peek() === '^') { next(); return b.pow(atom()); } return b; }
  function atom() {
    const t = next();
    if (t === undefined) throw new Error(`unexpected end in "${s}"`);
    if (/^[\d.]/.test(t)) return new Rat(Poly.c(Q(Number(t))));
    if (/^[a-z]$/.test(t)) return new Rat(Poly.v(t));
    if (t === '(') { const ts = sum(); if (next() !== ')') throw new Error(`missing ) in "${s}"`); return ts.reduce((a, b) => a.add(b)); }
    throw new Error(`unexpected "${t}" in "${s}"`);
  }
  const terms = sum();
  if (p !== T.length) throw new Error(`left over "${T.slice(p).join(' ')}" in "${s}"`);
  return { rat: terms.reduce((a, b) => a.add(b)), terms };
}
/** a polynomial (throws when it is not one) */
const P = s => { const r = parse(s).rat.poly(); if (!r) throw new Error(`not a polynomial: ${s}`); return r; };
const tryP = s => { try { return P(s); } catch { return null; } };
const isId = (l, r) => { const a = tryP(l), b = tryP(r); return a && b ? a.eq(b) : null; };

// ============================================================ reading the item
const board = q => fromTex(q.board).replace(/\s*=\s*\?\s*$/, '').replace(/\s*\?\s*$/, '').trim();
const choices = q => (q.choices ?? []).map(plain);
const idxWhere = (q, pred) => { const hits = choices(q).map((c, i) => { try { return pred(c, i) ? i : -1; } catch { return -1; } }).filter(i => i >= 0); return hits.length === 1 ? hits[0] : -1; };
const idxRe = (q, re) => idxWhere(q, c => re.test(c));
const choiceEqual = (q, target) => idxWhere(q, c => tryP(c)?.eq(target) === true);
const num = f => f.n / f.d;
/** "coefficient of x^2 y?" → the monomial key */
function askedKey(prompt) {
  const m = plain(prompt).match(/coefficient of (.+?)\?/);
  if (!m) return null;
  const t = P(m[1]);
  if (t.m.size !== 1) return null;
  const [[k, c]] = [...t.m];
  return c.eq(Q(1)) ? k : null;
}
/** values like "u = 2, v = −3" → env */
function envOf(s) {
  const env = {};
  for (const m of plain(s).matchAll(/\b([a-z])\s*=\s*(-?\d+(?:\.\d+)?)/g)) env[m[1]] = Q(Number(m[2]));
  return env;
}
const sides = s => { const i = s.indexOf('='); return i < 0 ? null : [s.slice(0, i).trim(), s.slice(i + 1).trim()]; };
/** the top-level factors of a written product "(A)(B)^2 ..." as [inner string, power] */
function factorsOf(s) {
  s = s.trim(); const out = []; let i = 0;
  while (i < s.length) {
    if (s[i] === ' ') { i++; continue; }
    if (s[i] !== '(') return null;
    let d = 0, j = i;
    for (; j < s.length; j++) { if (s[j] === '(') d++; else if (s[j] === ')') { d--; if (d === 0) break; } }
    const inner = s.slice(i + 1, j); i = j + 1;
    const pw = s.slice(i).match(/^\s*\^\s*\(?(\d+)\)?/);
    if (pw) { out.push([inner, Number(pw[1])]); i += pw[0].length; } else out.push([inner, 1]);
  }
  return out;
}

// ============================================================ the families
const F = {};

// 1 identity-meaning
F.classify = q => {
  const sd = sides(board(q)); if (!sd) return -1;
  const d = P(sd[0]).sub(P(sd[1]));
  let kind;
  if (d.isZero()) kind = 'every';
  else if (d.isConst()) kind = 'none';
  else {
    const vs = d.vars(); if (vs.length !== 1) return -1;
    const v = vs[0], deg = d.deg();
    if (deg === 1) kind = 'some';
    else if (deg === 2) {
      const a = d.coef(`${v}2`), b = d.coef(`${v}1`), c = d.coef('');
      kind = b.mul(b).sub(a.mul(c).mul(4)).cmp(0) >= 0 ? 'some' : 'none';
    } else return -1;
  }
  return idxRe(q, kind === 'every' ? /^True for every/ : kind === 'some' ? /^True for some/ : /^True for no value/);
};
F.identityPick = q => idxWhere(q, c => { const sd = sides(c); return sd && isId(sd[0], sd[1]) === true; });

// 2 two-variable-terms
F.monoProd = q => choiceEqual(q, P(board(q)));
F.collect2 = q => { const k = askedKey(q.prompt); return k === null ? undefined : num(P(board(q)).coef(k)); };
F.likeTwo = q => {
  const t = P(board(q)); if (t.m.size !== 1) return -1;
  const k = [...t.m.keys()][0];
  return idxWhere(q, c => { const p = P(c); return p.m.size === 1 && p.m.has(k); });
};

// 3 square-of-sum-structure
F.sumSquareNum = q => {
  const m = board(q).match(/^\((\d+) \+ (\d+)\)\^\(2\)$/); if (!m) return undefined;
  const a = Number(m[1]), b = Number(m[2]);
  if (/two rectangles/.test(q.prompt)) return 2 * a * b;
  if (/whole/.test(q.prompt)) return (a + b) ** 2;
  return undefined;
};
F.sumSquareSym = q => {
  if (/^Expand/.test(q.prompt)) return choiceEqual(q, P(board(q)));
  // "Where does the 2uv come from?": only the cross-product reading is true (2 times u plus v is 2u + v, not 2uv;
  // (u + v)^2 = u^2 + v^2 is no identity; squaring u + v does not give 2uv)
  if (/Where does/.test(q.prompt)) {
    const sd = sides(board(q));
    if (!sd || !isId(sd[0], sd[1])) return -1;
    return idxRe(q, /^Two cross products, (\w) · (\w) and \2 · \1, which are like terms$/);
  }
  return undefined;
};

// 4 / 5 / 6 / 7 / 8: expand and pick
F.diffSquare = q => choiceEqual(q, P(board(q)));
F.lastTerm = q => {
  // the box multiplies (A − B)(A − B); the asked cell is row term × column term (the written terms, in order)
  const ask = q.data?.picture?.box?.ask?.[0]; if (!ask) return undefined;
  const fs = factorsOf(board(q)); if (!fs || fs.length !== 1 || fs[0][1] !== 2) return -1;
  const terms = parse(fs[0][0]).terms.map(t => t.poly());
  const cell = terms[ask[0]].mul(terms[ask[1]]);
  return choiceEqual(q, cell);
};
F.conjExpand = q => choiceEqual(q, P(board(q)));
F.conjCancel = q => { const k = askedKey(q.prompt); return k === null ? undefined : num(P(board(q)).coef(k)); };
F.triple = q => choiceEqual(q, P(board(q)));
F.bigCoef = F.conjCancel;
F.cubes = q => choiceEqual(q, P(board(q)));
F.whichPattern = q => {
  const fs = factorsOf(board(q)); if (!fs) return -1;
  const binom = s => { const t = parse(s).terms.map(x => x.poly()); return t.length === 2 && t.every(x => x && x.m.size === 1) ? t : null; };
  const negs = t => t.filter(x => [...x.m.values()][0].n < 0).length;
  let kind = 'none';
  const sq = t => (negs(t) === 1 ? 'diff' : 'sum');
  if (fs.length === 1 && fs[0][1] === 2) { const t = binom(fs[0][0]); kind = t ? sq(t) : 'none'; }
  else if (fs.length === 2 && fs[0][1] === 1 && fs[1][1] === 1) {
    const a = binom(fs[0][0]), b = binom(fs[1][0]);
    if (a && b) {
      if (P(fs[0][0]).eq(P(fs[1][0]))) kind = sq(a);
      else {
        // one term the same, the other its opposite
        const same = (x, y) => x.eq(y), opp = (x, y) => x.add(y).isZero();
        if ((same(a[0], b[0]) && opp(a[1], b[1])) || (same(a[0], b[1]) && opp(a[1], b[0])) ||
            (same(a[1], b[1]) && opp(a[0], b[0])) || (same(a[1], b[0]) && opp(a[0], b[1]))) kind = 'conj';
      }
    }
  }
  return idxRe(q, kind === 'sum' ? /^Square of a sum/ : kind === 'diff' ? /^Square of a difference/ : kind === 'conj' ? /^Sum times difference/ : /^None/);
};
F.oneStep = q => choiceEqual(q, P(board(q)));
F.middleCoef = F.conjCancel;
F.chunkExpand = q => choiceEqual(q, P(board(q)));
F.chunkName = q => {
  const target = P(board(q));
  return idxWhere(q, c => {
    const m = c.match(/^a = (.+), b = (.+)$/); if (!m) return false;
    const a = P(m[1]), b = P(m[2]);
    return a.mul(a).sub(b.mul(b)).eq(target);
  });
};

// 9 reverse-special-products
F.factorChunk = q => choiceEqual(q, P(board(q)));
F.nearMatch = q => {
  const e = P(board(q));
  const yes = choices(q).map((c, i) => [c, i]).filter(([c]) => /^Yes/.test(c));
  const exprOf = c => c.replace(/^Yes:\s*(it is\s*)?/, '');
  if (/perfect-square trinomial/.test(q.prompt)) {
    // yes only when the claimed square (P)^2 really is the board's polynomial
    const hits = yes.filter(([c]) => { const f = factorsOf(exprOf(c)); return f && f.length === 1 && f[0][1] === 2 && tryP(exprOf(c))?.eq(e); });
    if (hits.length === 1) return hits[0][1];
    if (hits.length > 1) return -1;
    // independently: a perfect square in one letter has three terms with b^2 = 4ac and a, c squares
    const vs = e.vars();
    if (vs.length === 1 && e.deg() === 2 && e.m.size === 3) {
      const v = vs[0], a = e.coef(`${v}2`), b = e.coef(`${v}1`), c = e.coef('');
      const sqr = f => { const r = Math.round(Math.sqrt(f.n)); const s = Math.round(Math.sqrt(f.d)); return f.n >= 0 && r * r === f.n && s * s === f.d; };
      if (b.mul(b).eq(a.mul(c).mul(4)) && sqr(a) && sqr(c)) return -1;   // a perfect square, but no right Yes choice
    }
    return idxRe(q, /^No/);
  }
  if (/difference of squares/.test(q.prompt)) {
    const hits = yes.filter(([c]) => {
      const f = factorsOf(exprOf(c));
      if (!f || f.length !== 2 || f[0][1] !== 1 || f[1][1] !== 1) return false;
      // (A − B)(A + B): the two factors add to 2A and differ by 2B, both nonzero
      const x = P(f[0][0]), y = P(f[1][0]);
      return !x.eq(y) && x.mul(y).eq(e);
    });
    if (hits.length === 1) return hits[0][1];
    if (hits.length > 1) return -1;
    // no: then there must be no A^2 − B^2 with whole-number coefficients (one letter, quadratic): search
    // A = αv + r, B = βv + k (B ≠ 0) with α² − β² = a, 2(αr − βk) = b, r² − k² = c
    const vs = e.vars();
    if (vs.length === 1 && e.deg() === 2 && e.m.size >= 1) {
      const v = vs[0], [a, b, c] = [e.coef(`${v}2`), e.coef(`${v}1`), e.coef('')];
      if ([a, b, c].some(f => f.d !== 1)) return -1;
      for (let al = 0; al <= 40; al++) for (let be = 0; be <= 40; be++) {
        if (al * al - be * be !== a.n) continue;
        for (let r = -60; r <= 60; r++) for (let k = -60; k <= 60; k++) {
          if (be === 0 && k === 0) continue;
          if (2 * (al * r - be * k) === b.n && r * r - k * k === c.n) return -1;   // it IS one, and no Yes choice shows it
        }
      }
      return idxRe(q, /^No/);
    }
    return -1;
  }
  return undefined;
};

// 10 closure
F.closureWhich = q => {
  const r = parse(board(q)).rat, p = r.poly();
  if (!p) return idxRe(q, /^No/);
  if (p.isZero()) return -1;
  return idxWhere(q, c => { const m = c.match(/^Yes: degree (\d+)$/); return !!m && Number(m[1]) === p.deg(); });
};
F.degProduct = q => P(board(q)).deg();

// 11 prove-by-expansion
F.proofStep = q => {
  const lines = q.data?.picture?.chain?.lines; if (!lines) return undefined;
  const i = lines.findIndex(l => /^\s*=\s*\\?\s*\\?,?\s*\?\s*$/.test(fromTex(l)) || lineExpr(l) === '?');
  if (i < 1) return -1;
  const before = P(lineExpr(lines[i - 1]));
  const after = i + 1 < lines.length ? tryP(lineExpr(lines[i + 1])) : null;
  if (after && !after.eq(before)) return -1;   // the proof itself is broken around the gap
  return choiceEqual(q, before);
};
F.proofLogic = q => {
  const m = plain(q.prompt).match(/^Which argument proves (.+) for every real/);
  if (!m) return undefined;
  const sd = sides(m[1]); if (!sd) return -1;
  const L = P(sd[0]), R = P(sd[1]);
  if (!L.eq(R)) return idxRe(q, /^None/);
  // only rewriting each side on its own to the same polynomial proves it; checking values, appealing to "a known
  // identity" without showing it fits, or working both sides at once down to 0 = 0 do not
  return idxWhere(q, c => {
    const k = c.match(/^Rewrite each side on its own: both become (.+?)\. So the two sides are equal for every real/);
    return !!k && P(k[1]).eq(L);
  });
};

// 12 counterexample-refute
F.counterPick = q => {
  const s = plain(q.prompt);
  let m = s.match(/^Sam claims (.+?) for every value\. At (.+?) both sides are equal\. At (.+?) the left side is (-?\d+) and the right side is (-?\d+)\. What follows\?$/);
  if (m) {
    const sd = sides(m[1]); const L = P(sd[0]), R = P(sd[1]);
    const env = envOf(m[3]);
    const l = L.at(env), r = R.at(env);
    if (!l.eq(Q(Number(m[4]))) || !r.eq(Q(Number(m[5])))) return -1;   // the stated values are wrong
    return l.eq(r) ? -1 : idxRe(q, /^The claim is false: one counterexample is enough$/);
  }
  m = s.match(/^Which values show that (.+?) is NOT true for every value\?$/);
  if (m) {
    const sd = sides(m[1]); const L = P(sd[0]), R = P(sd[1]);
    if (L.eq(R)) return idxRe(q, /^None/);
    return idxWhere(q, c => { if (/^None/.test(c)) return false; const env = envOf(c); return !L.at(env).eq(R.at(env)); });
  }
  return undefined;
};
F.counterValues = q => {
  const m = plain(q.prompt).match(/^Is (.+?) an identity\? Test it at (.+?): work out/);
  if (!m) return undefined;
  const sd = sides(m[1]); const env = envOf(m[2]);
  return [num(P(sd[0]).at(env)), num(P(sd[1]).at(env))];
};

// 13 error-locate-repair
/** index of the first chain line (1 = Step 1) not equal to the line before it, or 0 when every line holds */
function firstWrong(lines) {
  let prev = P(lineExpr(lines[0]));
  for (let k = 1; k < lines.length; k++) {
    const cur = tryP(lineExpr(lines[k]));
    if (!cur || !cur.eq(prev)) return k;
    prev = cur;
  }
  return 0;
}
F.firstBad = q => {
  const ch = q.data?.picture?.chain; if (!ch) return undefined;
  const k = firstWrong(ch.lines);
  if (k === 0) return idxRe(q, /^No step is wrong$/);
  const label = ch.labels?.[k] ?? `Step ${k}`;
  return idxWhere(q, c => c === label);
};
F.repairStep = q => {
  const ch = q.data?.picture?.chain; if (!ch) return undefined;
  const m = q.prompt.match(/^Step (\d+) is the first wrong line/); if (!m) return undefined;
  const k = Number(m[1]);
  if (firstWrong(ch.lines) !== k) return -1;
  return choiceEqual(q, P(lineExpr(ch.lines[k - 1])));
};
F.auditLogic = q => {
  const ch = q.data?.picture?.chain; if (!ch) return undefined;
  const m = plain(q.prompt).match(/argument about (.+?)\. What is it\?$/); if (!m) return undefined;
  const sd = sides(m[1]); const R = P(sd[1]);
  const L0 = fromTex(ch.lines[0]);
  if (/^\s*[a-z] = -?\d/.test(L0)) return idxRe(q, /only checks some values/);          // value checks only
  if (/\u0001\s*Left/.test(L0)) {
    const k = firstWrong(ch.lines);
    if (k) return idxRe(q, /a step has an algebra error/);
    const last = P(lineExpr(ch.lines[ch.lines.length - 1]));
    return last.eq(R) ? idxRe(q, /^A valid proof/) : -1;
  }
  if (sides(lineExpr(ch.lines[0]))) return idxRe(q, /starts from the claim and ends at a true statement/);  // works on the claim itself
  return -1;
};

// 14 numerical-relationships
F.mentalProduct = q => { const n = nums(fromTex(q.board)); return n.length === 2 ? n[0] * n[1] : undefined; };
F.squareMental = q => { const m = fromTex(q.board).match(/^(\d+)\^\(2\)/); return m ? Number(m[1]) ** 2 : undefined; };
F.consecutive = q => { const m = fromTex(q.board).match(/^(\d+)\^\(2\) - (\d+)\^\(2\)$/); return m ? Number(m[1]) ** 2 - Number(m[2]) ** 2 : undefined; };
F.pyTriple = q => {
  const env = envOf(fromTex(q.board)); const x = num(env.x ?? Q(NaN)), y = num(env.y ?? Q(NaN));
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  const l1 = Math.abs(x * x - y * y), l2 = 2 * x * y, h = x * x + y * y;
  return idxWhere(q, c => {
    const k = c.match(/^legs (\d+) and (\d+), hypotenuse (\d+)$/); if (!k) return false;
    const a = Number(k[1]), b = Number(k[2]), hh = Number(k[3]);
    return hh === h && ((a === l1 && b === l2) || (a === l2 && b === l1));
  });
};

function solve(q) {
  const f = F[q.family];
  if (!f) return undefined;
  return f(q);
}

// ============================================================ sane: what is impossible or unfair for the student
function sane(q) {
  const out = [];
  const cs = choices(q);
  if (new Set(cs).size !== cs.length) out.push('two choices read the same');
  try {
    const pic = q.data?.picture;
    // the prompt restates the board expression: they must agree
    const RESTATE = {
      collect2: /^Collect like terms in (.+?)\. What/, bigCoef: /^Multiply (.+?) with a box/, middleCoef: /^Expand (.+?) in one step/,
      conjCancel: /partial product of (.+?)\. After/, degProduct: /the degree of (.+?)\?$/, closureWhich: /^Simplify (.+?) in your head/,
    };
    const pm = RESTATE[q.family] && plain(q.prompt).match(RESTATE[q.family]);
    if (pm) {
      const a = parse(pm[1]).rat, b = parse(board(q)).rat;
      if (!a.n.mul(b.d).eq(b.n.mul(a.d))) out.push(`prompt says ${pm[1]} but the board shows ${board(q)}`);
    }
    if (pic?.area) {
      const { a, b, cells, ask = [] } = pic.area;
      const m = plain(q.prompt).match(/is (\d+) ft on each side\. Cut each side into (\d+) ft and (\d+) ft/);
      if (m && Number(m[1]) !== Number(m[2]) + Number(m[3])) out.push(`side ${m[1]} is not ${m[2]} + ${m[3]}`);
      if (m && (Number(m[1]) > 120 || Number(m[3]) < 1)) out.push(`odd size ${m[1]} ft`);
      if (m && (String(a) !== m[2] || String(b) !== m[3])) out.push('the picture parts differ from the prompt');
      const want = [P(`(${a})^2`), P(`(${a})(${b})`), P(`(${b})(${a})`), P(`(${b})^2`)];
      cells?.forEach((c, i) => { if (!ask.includes(i) && !P(fromTex(c)).eq(want[i])) out.push(`area piece ${i} shows ${c}`); });
    }
    if (pic?.box) {
      const LET = 'abcdmnpqstuvxy';
      const side = arr => arr.map(t => { let p = Poly.c(Q(t.c.p, t.c.q)); t.e.forEach((e, i) => { if (e) p = p.mul(Poly.v(LET[i]).pow(e)); }); return p; }).reduce((x, y) => x.add(y));
      const prod = side(pic.box.a).mul(side(pic.box.b));
      const target = P(board(q));
      if (!pic.box.pre && !prod.eq(target)) out.push('the box does not multiply out to the board');
      if (pic.box.pre) {
        for (const l of pic.box.pre) { const sd = sides(fromTex(l)); if (sd && !isId(sd[0], sd[1])) out.push(`the given first product ${l} is wrong`); }
        if (!prod.eq(target)) out.push('the box does not multiply out to the board');
      }
    }
    if (q.family === 'counterPick') {
      const m = plain(q.prompt).match(/^Sam claims (.+?) for every value\. At (.+?) both sides are equal\./);
      if (m) { const sd = sides(m[1]); const env = envOf(m[2]); if (!P(sd[0]).at(env).eq(P(sd[1]).at(env))) out.push(`at ${m[2]} the two sides are not equal`); }
    }
    if (q.family === 'auditLogic' && pic?.chain) {
      for (const l of pic.chain.lines) {
        const t = plain(fromTex(l));
        const m = t.match(/^((?:[a-z] = -?\d+,?\s*)+):\s*(-?\d+) - (-?\d+) = (-?\d+)/);
        if (!m) continue;
        const env = envOf(m[1]);
        const pr = plain(q.prompt).match(/argument about (.+?) - (.+?) = (.+?)\. What is it/);
        if (!pr) continue;
        const [l1, l2, r] = [pr[1], pr[2], pr[3]].map(s => num(P(s).at(env)));
        if (l1 !== Number(m[2]) || l2 !== Number(m[3]) || r !== Number(m[4]) || l1 - l2 !== r) out.push(`value check "${t}" is wrong`);
      }
    }
    if (q.family === 'pyTriple') {
      const env = envOf(fromTex(q.board));
      if (env.x && env.y && (num(env.x) <= num(env.y) || num(env.y) <= 0)) out.push('x must be larger than y > 0 for positive legs');
    }
    if (q.family === 'proofStep' || q.family === 'proofLogic') {
      const m = plain(q.prompt).match(/(?:proof that|proves) (.+?) for every real/);
      if (m) { const sd = sides(m[1]); if (!isId(sd[0], sd[1])) out.push('the claim to prove is no identity'); }
    }
  } catch (e) { out.push(`cannot read: ${e.message}`); }
  return out.join('; ');
}

export default { solve, sane };
