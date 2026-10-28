// Oracle for the lesson "factoring" (Algebra 1, factoring polynomials). Role O, docs/lessons/QUALITY_LAYER.md.
// Written from what the student sees only: the prompt HTML, the choice HTML, the board TeX and the box data the page
// draws. Every expression is parsed into an exact rational function of x (and y): numerator / denominator as
// polynomials with Q coefficients. "Equal" means equal after cross-multiplying and fully expanding, never equal as
// text. Where several options are equal in value, the question decides: "factor completely" / "prime" = no factor
// left that factors further over the integers (primitive, and degree 1 or an irreducible quadratic), "greatest common
// factor" = the bracket keeps no common factor, and a length takes a length unit, an area a square unit.
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ============================================================ text → expression string
const ENT = s => s.replace(/&#8202;|&#8201;|&thinsp;|&nbsp;|&#160;/g, ' ').replace(/&minus;/g, '-').replace(/&times;/g, '×')
  .replace(/&divide;/g, '÷').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&amp;/g, '&');
/** HTML → an expression string with explicit grouping: fractions ((a)/(b)), exponents ^(e) */
function fromHtml(h) {
  let s = String(h ?? '');
  for (let i = 0; i < 4; i++) {
    s = s.replace(/<span class="fr"><span>((?:(?!<\/?span)[\s\S])*)<\/span><span>((?:(?!<\/?span)[\s\S])*)<\/span><\/span>/g, '(($1)/($2))');
  }
  s = s.replace(/<sup>([^<]*)<\/sup>/g, '^($1)').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '');
  return ENT(s).replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
}
/** board TeX → the same kind of expression string (\square → □) */
function fromTex(t) {
  let s = String(t ?? '').replace(/\\overset\{\?\}\{=\}/g, ' ?= ').replace(/\\square/g, '□');
  for (let i = 0; i < 8; i++) {
    const b = s;
    s = s.replace(/\\cssId\{[^{}]*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1')
      .replace(/\\(?:text|mathrm|textbf)\{([^{}]*)\}/g, ' $1 ')
      .replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
      .replace(/\^\{([^{}]*)\}/g, '^($1)');
    if (s === b) break;
  }
  return s.replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\neq/g, '≠').replace(/\\left|\\right/g, '')
    .replace(/\\quad|\\qquad|\\[,;:! ]|~/g, ' ').replace(/\\[a-zA-Z]+/g, ' ').replace(/[{}]/g, '').replace(/[−–]/g, '-')
    .replace(/\s+/g, ' ').trim();
}

// ============================================================ exact polynomials in x, y (Laurent allowed)
class Poly {
  constructor(m = new Map()) { this.m = m; }
  static c(q) { const m = new Map(); q = q instanceof Object ? q : Q(q); if (q.n !== 0) m.set('0,0', q); return new Poly(m); }
  static mono(c, ex, ey = 0) { const m = new Map(); c = c instanceof Object ? c : Q(c); if (c.n !== 0) m.set(`${ex},${ey}`, c); return new Poly(m); }
  add(o) {
    const m = new Map(this.m);
    for (const [k, c] of o.m) { const v = (m.get(k) ?? Q(0)).add(c); if (v.n === 0) m.delete(k); else m.set(k, v); }
    return new Poly(m);
  }
  neg() { const m = new Map(); for (const [k, c] of this.m) m.set(k, c.neg()); return new Poly(m); }
  sub(o) { return this.add(o.neg()); }
  scale(q) { return this.mul(Poly.c(q)); }
  mul(o) {
    let r = new Poly();
    for (const [ka, ca] of this.m) for (const [kb, cb] of o.m) {
      const [ax, ay] = ka.split(',').map(Number), [bx, by] = kb.split(',').map(Number);
      r = r.add(Poly.mono(ca.mul(cb), ax + bx, ay + by));
    }
    return r;
  }
  isZero() { return this.m.size === 0; }
  isConst() { return [...this.m.keys()].every(k => k === '0,0'); }
  cval() { return this.m.get('0,0') ?? Q(0); }
  eq(o) { return this.sub(o).isZero(); }
  coef(ex, ey = 0) { return this.m.get(`${ex},${ey}`) ?? Q(0); }
  keys() { return [...this.m.keys()].map(k => k.split(',').map(Number)); }
  deg() { return this.m.size ? Math.max(...this.keys().map(([a]) => a)) : -1; }
  minDeg() { return this.m.size ? Math.min(...this.keys().map(([a]) => a)) : 0; }
  hasY() { return this.keys().some(([, b]) => b !== 0); }
  at(x, y = Q(0)) {
    let s = Q(0);
    for (const [k, c] of this.m) {
      const [ex, ey] = k.split(',').map(Number);
      let t = c;
      for (let i = 0; i < Math.abs(ex); i++) t = ex > 0 ? t.mul(x) : t.div(x);
      for (let i = 0; i < Math.abs(ey); i++) t = ey > 0 ? t.mul(y) : t.div(y);
      s = s.add(t);
    }
    return s;
  }
  /** a single term → its inverse (Laurent) */
  monoInv() { if (this.m.size !== 1) return null; const [[k, c]] = [...this.m]; const [ex, ey] = k.split(',').map(Number); return Poly.mono(Q(1).div(c), -ex, -ey); }
}
const X = Poly.mono(Q(1), 1), ONE = Poly.c(Q(1));

/** univariate (x) long division over Q: { q, r } */
function divmod(n, d) {
  if (d.isZero()) throw new Error('division by 0');
  let q = new Poly(), r = n;
  const dd = d.deg(), lc = d.coef(dd);
  for (let guard = 0; guard < 50 && !r.isZero() && r.deg() >= dd; guard++) {
    const k = r.deg(), t = Poly.mono(r.coef(k).div(lc), k - dd);
    q = q.add(t); r = r.sub(t.mul(d));
  }
  return { q, r };
}

// ============================================================ rational functions n / d
class RF {
  constructor(n, d = ONE) { this.n = n; this.d = d; }
  static p(p) { return new RF(p); }
  add(o) { return new RF(this.n.mul(o.d).add(o.n.mul(this.d)), this.d.mul(o.d)); }
  neg() { return new RF(this.n.neg(), this.d); }
  sub(o) { return this.add(o.neg()); }
  mul(o) { return new RF(this.n.mul(o.n), this.d.mul(o.d)); }
  div(o) { if (o.n.isZero()) throw new Error('division by 0'); return new RF(this.n.mul(o.d), this.d.mul(o.n)); }
  pow(e) {
    if (!e.isPolyConst()) throw new Error('variable exponent');
    const v = e.n.cval().div(e.d.cval());
    if (v.d !== 1 || v.n < 0) throw new Error('bad exponent');
    let r = RF.p(ONE);
    for (let i = 0; i < v.n; i++) r = r.mul(this);
    return r;
  }
  isPolyConst() { return this.n.isConst() && this.d.isConst(); }
  eq(o) { return this.n.mul(o.d).eq(o.n.mul(this.d)); }
  /** as a polynomial (Laurent if the denominator is one term), or null */
  poly() {
    if (this.d.isConst()) return this.n.scale(Q(1).div(this.d.cval()));
    const inv = this.d.monoInv();
    if (inv) return this.n.mul(inv);
    if (this.n.hasY() || this.d.hasY()) return null;
    const { q, r } = divmod(this.n, this.d);
    return r.isZero() ? q : null;
  }
  at(x, y) { return this.n.at(x, y).div(this.d.at(x, y)); }
}

// ============================================================ parser
function tokens(s) {
  const out = [];
  const re = /\s*(\d+(?:\.\d+)?|\.\d+|[xy]|[-+*·×÷/^()])/y;
  let i = 0;
  const str = String(s).replace(/−/g, '-');
  while (i < str.length) {
    if (/\s/.test(str[i])) { i++; continue; }
    re.lastIndex = i;
    const m = re.exec(str);
    if (!m) throw new Error(`cannot read "${str.slice(i)}" in "${str}"`);
    out.push(m[1]); i = re.lastIndex;
  }
  return out;
}
/** parse an expression: { v: RF, terms: RF[] (the top-level written summands, with sign) } */
function parse(s) {
  const T = tokens(s);
  let p = 0;
  const peek = () => T[p], next = () => T[p++];
  const startsAtom = t => t !== undefined && (/^[\d.]/.test(t) || t === 'x' || t === 'y' || t === '(');
  function sum() {
    const terms = [];
    let sign = 1;
    if (peek() === '+' || peek() === '-') sign = next() === '-' ? -1 : 1;
    terms.push(sign < 0 ? product().neg() : product());
    while (peek() === '+' || peek() === '-') {
      const sg = next() === '-' ? -1 : 1;
      const t = product();
      terms.push(sg < 0 ? t.neg() : t);
    }
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
  function power() {
    const b = atom();
    if (peek() === '^') { next(); return b.pow(atom()); }
    return b;
  }
  function atom() {
    const t = next();
    if (t === undefined) throw new Error(`unexpected end in "${s}"`);
    if (/^[\d.]/.test(t)) return RF.p(Poly.c(Q(Number(t))));
    if (t === 'x') return RF.p(X);
    if (t === 'y') return RF.p(Poly.mono(Q(1), 0, 1));
    if (t === '(') { const ts = sum(); if (next() !== ')') throw new Error(`missing ) in "${s}"`); return ts.reduce((a, b) => a.add(b)); }
    throw new Error(`unexpected "${t}" in "${s}"`);
  }
  const terms = sum();
  if (p !== T.length) throw new Error(`left over "${T.slice(p).join(' ')}" in "${s}"`);
  return { v: terms.reduce((a, b) => a.add(b)), terms };
}
const R = s => parse(s).v;
const tryR = s => { try { return R(s); } catch { return null; } };
const P = s => { const p = R(s).poly(); if (!p) throw new Error(`not a polynomial: ${s}`); return p; };
const tryP = s => { try { return P(s); } catch { return null; } };

// ============================================================ number theory / factoring facts
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const isqrt = n => { if (n < 0) return null; const r = Math.round(Math.sqrt(n)); return r * r === n ? r : null; };
/** integer content of a polynomial with integer coefficients (0 if not all integer) */
function content(p) {
  let g = 0;
  for (const c of p.m.values()) { if (c.d !== 1) return 0; g = gcd(g, c.n); }
  return g;
}
/** rational roots of a univariate polynomial (degree ≤ 2 exact; higher: rational root test) */
function ratRoots(p) {
  const d = p.deg();
  if (d <= 0) return [];
  if (p.minDeg() > 0) {
    const k = p.minDeg(), rest = p.mul(Poly.mono(Q(1), -k));
    return [Q(0), ...ratRoots(rest).filter(r => r.n !== 0)];
  }
  if (d === 1) return [p.coef(0).neg().div(p.coef(1))];
  if (d === 2) {
    const a = p.coef(2), b = p.coef(1), c = p.coef(0);
    const D = b.mul(b).sub(a.mul(c).mul(Q(4)));
    if (D.n < 0) return [];
    const rn = isqrt(D.n), rd = isqrt(D.d);
    if (rn === null || rd === null) return [];
    const s = Q(rn, rd), two = a.mul(Q(2));
    const r1 = b.neg().sub(s).div(two), r2 = b.neg().add(s).div(two);
    return r1.eq(r2) ? [r1] : [r1, r2];
  }
  // rational root test on an integer polynomial
  const L = [...p.m.values()].reduce((l, c) => (l * c.d) / gcd(l, c.d), 1);
  const ip = p.scale(Q(L));
  const a0 = Math.abs(ip.coef(0).n), an = Math.abs(ip.coef(d).n);
  const divs = n => { const o = []; for (let i = 1; i <= n; i++) if (n % i === 0) o.push(i); return o; };
  const out = [];
  for (const u of divs(a0)) for (const v of divs(an)) for (const sg of [1, -1]) {
    const r = Q(sg * u, v);
    if (ip.at(r).n === 0 && !out.some(o => o.eq(r))) out.push(r);
  }
  return out;
}
/** irreducible over the integers: primitive, and degree 1, or degree 2 without rational roots, or higher with no rational roots
 *  (degree-4 products of two quadratics do not occur in this lesson) */
function irreducible(p) {
  if (p.hasY()) return true;
  const d = p.deg();
  if (d < 1 || p.minDeg() < 0) return false;
  if (content(p) !== 1) return false;
  if (d === 1) return true;
  if (p.minDeg() > 0) return false;
  return ratRoots(p).length === 0;
}
/** the top-level factors of a written product "c·x(A)(B)^(2)": strings, or null if it is not one product */
function factorsOf(s) {
  s = s.trim();
  const out = [];
  let i = 0;
  if (s[0] === '-' && s[1] === '(') { out.push('-1'); i = 1; }
  while (i < s.length) {
    if (s[i] === ' ') { i++; continue; }
    if (s[i] === '(') {
      let d = 0, j = i;
      for (; j < s.length; j++) { if (s[j] === '(') d++; else if (s[j] === ')') { d--; if (d === 0) break; } }
      if (j >= s.length) return null;
      const inner = s.slice(i + 1, j);
      i = j + 1;
      const pw = s.slice(i).match(/^\^\((\d+)\)/);
      if (pw) { for (let k = 0; k < Number(pw[1]); k++) out.push(inner); i += pw[0].length; } else out.push(inner);
    } else {
      const m = s.slice(i).match(/^[-+]?\d*(?:[xy](?:\^\(\d+\))?)*/);
      if (!m || !m[0] || m[0] === '+') return null;
      out.push(m[0] === '-' ? '-1' : m[0]); i += m[0].length;
    }
  }
  return out;
}
/** a written product is complete: every factor with more than one term is primitive and irreducible */
function isComplete(s) {
  const fs = factorsOf(s);
  if (!fs) return false;
  for (const f of fs) {
    const p = tryP(f);
    if (!p) return false;
    if (p.m.size <= 1) continue;   // a number or a monomial in front
    if (!irreducible(p)) return false;
  }
  return true;
}
/** a polynomial (expanded) is prime over the integers: content 1 and irreducible */
const isPrimePoly = p => content(p) === 1 && irreducible(p);
/** (x + p)(x + q) = T / lead (monic quadratic): [p, q] smaller first, or null */
function monicPair(T) {
  if (T.deg() !== 2 || !T.coef(2).eq(Q(1))) return null;
  const rs = ratRoots(T);
  if (!rs.length) return null;
  const vals = (rs.length === 1 ? [rs[0], rs[0]] : rs).map(r => r.neg());
  if (vals.some(v => v.d !== 1)) return null;
  return vals.map(v => v.n).sort((a, b) => a - b);
}

// ============================================================ reading the item
const plainOf = q => fromHtml(q.promptHtml ?? q.prompt);
const choiceExprs = q => (q.choicesHtml ?? q.choices ?? []).map(fromHtml);
const boardExpr = q => fromTex(q.board);
const sides = s => s.split(/\?=|=/).map(t => t.trim());
const lhs = q => sides(boardExpr(q))[0];
const idxWhere = (q, pred) => { const hits = choiceExprs(q).map((c, i) => { try { return pred(c, i) ? i : -1; } catch { return -1; } }).filter(i => i >= 0); return hits.length === 1 ? hits[0] : -1; };
const idxRe = (q, re) => idxWhere(q, c => re.test(c));
const num = x => x.n / x.d;
const cst = s => { const p = tryP(s); return p && p.isConst() ? p.cval() : null; };
/** the number of terms after collecting is the number written (nothing left to simplify) */
const simplified = s => { const { terms } = parse(s); const p = R(s).poly(); return p ? p.m.size === terms.length : true; };

/** the choices equal by value to `target` (an RF), then narrowed by `prefer` when more than one is equal */
function equalChoice(q, target, prefer = []) {
  const cs = choiceExprs(q);
  let eqs = cs.map((c, i) => (tryR(c)?.eq(target) ? i : -1)).filter(i => i >= 0);
  for (const f of prefer) {
    if (eqs.length <= 1) break;
    const keep = eqs.filter(i => { try { return f(cs[i]); } catch { return false; } });
    if (keep.length) eqs = keep;
  }
  return eqs.length === 1 ? eqs[0] : -1;
}
const factorPrefs = [isComplete, simplified];

/** a written product m(I): the monomial m in front and the bracket I, or null */
function frontAndBracket(s) {
  const m = s.match(/^(-?\d*(?:x(?:\^\(\d+\))?)?)\((.*)\)$/);
  if (!m || /\)\s*\(/.test(m[2])) return null;
  return { front: m[1] === '' ? '1' : m[1] === '-' ? '-1' : m[1], inner: m[2] };
}
/** the GCF is out: the bracket keeps no common number and no common power of x */
function gcfOutScore(s) {
  const fb = frontAndBracket(s);
  if (!fb) return 0;
  const I = P(fb.inner);
  return (content(I) === 1 ? 1 : 0) + (I.minDeg() === 0 ? 1 : 0);
}
function gcfPick(q) {
  const T = R(lhs(q));
  const cs = choiceExprs(q);
  const eqs = cs.map((c, i) => (tryR(c)?.eq(T) ? i : -1)).filter(i => i >= 0);
  if (!eqs.length) return -1;
  const sc = eqs.map(i => { try { return gcfOutScore(cs[i]); } catch { return -1; } });
  const best = Math.max(...sc);
  const top = eqs.filter((_, k) => sc[k] === best);
  return top.length === 1 ? top[0] : -1;
}
/** greatest common factor of the terms of a polynomial: (gcd of coefficients) · x^(lowest power) */
function termGcf(p) { return Poly.mono(Q(content(p)), p.minDeg()); }

/** the top-level written expression is one product (no + or − outside brackets after the first sign) */
function isProduct(s) {
  let d = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') d++; else if (ch === ')') d--;
    else if (d === 0 && (ch === '+' || ch === '-') && s.slice(0, i).trim() !== '') return false;
  }
  return true;
}

// ---- units
const UNIT_RE = /^(.*?)\s+(sq ft|sq m|sq in|cu in|cu ft|ft|m|in|dollars)$/;
function withUnit(s) { const m = s.trim().match(UNIT_RE); return m ? { e: m[1].trim(), u: m[2] } : null; }

// ============================================================ the families
const F = {};

F.formPick = q => idxWhere(q, c => isProduct(c));
F.formKind = q => (isProduct(boardExpr(q)) ? idxRe(q, /^Factored form/) : idxRe(q, /^Sum form/));

F.numGcfSum = q => {
  const m = plainOf(q).match(/Write (\d+) \+ (\d+) as one product: .*= □ × \((\d+) \+ (\d+)\)/);
  return m ? Number(m[1]) / Number(m[3]) : undefined;
};
F.distBack = q => equalChoice(q, R(lhs(q)), [isProduct]);
F.sameValue = q => {
  const [l, r] = sides(boardExpr(q));
  const xm = plainOf(q).match(/At x = (-?\d+)/);
  if (!xm) return undefined;
  const L = P(l), Rr = P(r), x = Q(Number(xm[1]));
  if (L.eq(Rr)) return idxWhere(q, c => { const m = c.match(/^Both are (-?\d+): a factored form has the same value for every x$/); return m && L.at(x).eq(Q(Number(m[1]))); });
  return idxRe(q, /^They match at x = /);
};

// ---- the area box
const sidesChoice = (q, T, unitOk = () => true) => idxWhere(q, c => {
  const parts = c.split(' by ').length === 2 ? c.split(' by ') : c.split(' and ');
  if (parts.length !== 2) return false;
  let prod = RF.p(ONE);
  for (const part of parts) {
    const wu = withUnit(part);
    if (wu) { if (!unitOk(wu.u)) return false; prod = prod.mul(R(wu.e)); } else prod = prod.mul(R(part));
  }
  return prod.eq(RF.p(T));
});
F.areaSides = q => sidesChoice(q, P(lhs(q)));
F.areaPair = q => monicPair(P(lhs(q))) ?? -1;
F.areaParallel = q => {
  const m = plainOf(q).match(/Fill in (\d+) = □ × (\d+)/);
  return m ? Number(m[1]) / Number(m[2]) : undefined;
};

// ---- checking by expansion
F.verifyJudge = q => {
  const [l, r] = sides(boardExpr(q));
  const L = P(l), Rr = P(r);
  if (L.eq(Rr)) return idxRe(q, /^Right/);
  const midDiff = !L.coef(1).eq(Rr.coef(1)), cDiff = !L.coef(0).eq(Rr.coef(0));
  if (midDiff && !cDiff) return idxRe(q, /^Wrong: the middle coefficient/);
  if (cDiff && !midDiff) return idxRe(q, /^Wrong: the constant term/);
  return -1;   // both differ (or the x² term): no single statement is the reason
};
F.verifyMid = q => num(P(sides(boardExpr(q))[0]).coef(1));

// ---- GCFs
F.gcfNum = q => content(P(boardExpr(q)));
F.gcfOut = gcfPick;
F.gcfMonoOut = gcfPick;
F.gcfMonoPick = q => { const g = termGcf(P(boardExpr(q))); return equalChoice(q, RF.p(g)); };

F.missingMono = q => {
  const s = boardExpr(q);
  let m = s.match(/^(.*?) · □ = (.*)$/);
  if (m) return equalChoice(q, R(m[2]).div(R(m[1])));
  return equalChoice(q, R(s));
};
F.zeroCond = q => {
  const [l, r] = sides(boardExpr(q));
  const L = P(l), Rr = P(r);
  const holds = L.eq(Rr), holds0 = L.at(Q(0)).eq(Rr.at(Q(0)));
  return idxWhere(q, c => {
    if (/^Neither holds at x = 0$/.test(c)) return !holds0;
    // the division in the statement: "A ÷ D = C"
    const dc = choiceExprs(q).find(t => /you need x ≠ 0$/.test(t));
    const dm = dc && dc.match(/but for (.+?) ÷ (.+?) = (.+?) you need x ≠ 0$/);
    if (!dm) return false;
    const D = P(dm[2]), divOk = P(dm[1]).eq(P(dm[3]).mul(D));
    const D0 = D.at(Q(0)).n === 0;
    if (/^Both hold for every x, even x = 0$/.test(c)) return holds && divOk && !D0;
    const mm = c.match(/^(.+?) is true for every x, but for (.+?) ÷ (.+?) = (.+?) you need x ≠ 0$/);
    if (mm) { const [A, B] = sides(mm[1]); return P(A).eq(P(B)) && divOk && D0; }
    return false;
  });
};
F.negOut = q => equalChoice(q, R(lhs(q)));
F.negOne = q => equalChoice(q, R(lhs(q)));
F.divTerms = q => equalChoice(q, R(boardExpr(q)), [simplified]);
F.divSigned = F.divTerms;

// ---- trinomials
const pairOfLhs = q => monicPair(P(lhs(q))) ?? -1;
F.monicPair = pairOfLhs;
F.monicNegPair = pairOfLhs;
F.monicOppPair = pairOfLhs;
const factorPick = q => {
  const T = P(lhs(q));
  const i = equalChoice(q, RF.p(T), factorPrefs);
  if (i >= 0) return i;
  // no product equals it: right only if it is prime over the integers
  return isPrimePoly(T) ? idxRe(q, /^(Cannot be factored|Prime over the integers: no pair)/) : -1;
};
for (const f of ['monicPick', 'monicNegPick', 'monicMixed', 'dosPick', 'pstPick', 'groupPick', 'acPick', 'completePick']) F[f] = factorPick;
F.dosFill = q => {
  const s = boardExpr(q);
  const [l, r] = sides(s);
  const L = P(l);
  // try every whole number in the boxes
  for (let k = 0; k <= 40; k++) { const t = tryP(r.replace(/□/g, String(k))); if (t && t.eq(L)) return k; }
  return -1;
};
F.pstMid = q => {
  const s = boardExpr(q);
  for (let k = 1; k <= 400; k++) {
    const t = tryP(s.replace(/□/g, String(k)));
    if (t && t.deg() === 2 && ratRoots(t).length === 1) return k;
  }
  return -1;
};
F.groupStep = q => equalChoice(q, R(lhs(q)));
F.acSplit = q => {
  const T = P(lhs(q));
  const a = T.coef(2), b = T.coef(1), c = T.coef(0);
  const ac = a.mul(c), D = b.mul(b).sub(ac.mul(Q(4)));
  const s = isqrt(D.n);
  if (s === null || D.d !== 1) return -1;
  const m = (num(b) - s) / 2, n = (num(b) + s) / 2;
  return [m, n];
};

// ---- prime over the integers
F.primeJudge = q => {
  const T = P(lhs(q));
  const prime = isPrimePoly(T);
  if (!prime) return equalChoice(q, RF.p(T), factorPrefs);
  return idxRe(q, /^Prime over the integers: no pair of integers works$/);
};
F.primeGcf = q => {
  const T = P(boardExpr(q));
  return idxWhere(q, c => {
    if (/^Prime over the integers/.test(c)) return isPrimePoly(T);
    let m = c.match(/^Not prime: (.+), and (.+) is prime over the integers$/);
    if (m) return R(m[1]).eq(RF.p(T)) && isPrimePoly(P(m[2])) && isComplete(m[1]);
    m = c.match(/^Not prime: (.+)$/);
    if (m) return R(m[1]).eq(RF.p(T)) && isComplete(m[1]);
    return false;
  });
};

// ---- complete
F.completeFill = q => {
  const [l, r] = sides(boardExpr(q));
  const front = r.slice(0, r.indexOf('('));
  const T = RF.p(P(l)).div(R(front)).poly();
  return (T && monicPair(T)) ?? -1;
};
F.judgeWhich = q => equalChoice(q, R(boardExpr(q)), [isComplete]) ;
F.judgeYes = q => {
  const s = boardExpr(q);
  const fs = factorsOf(s);
  if (!fs) return -1;
  if (isComplete(s)) return idxRe(q, /^Complete: every factor is prime over the integers$/);
  return idxRe(q, /^Not complete: a (factor|bracket) still factors/);
};

// ---- dividing
const splitCond = c => { const k = c.lastIndexOf(', for '); return k < 0 ? null : [c.slice(0, k), c.slice(k + 6)]; };
F.cancelPick = q => {
  const N = R(boardExpr(q));
  const den = N.d.isConst() ? null : N.d;   // the divisor as written (the board's denominator)
  const bad = den ? ratRoots(den) : [];
  return idxWhere(q, c => {
    const sc = splitCond(c);
    if (!sc) return false;
    if (!R(sc[0]).eq(N)) return false;
    if (sc[1] === 'every x') return bad.length === 0;
    const vals = sc[1].split(' and ').map(t => { const m = t.match(/^x ≠ (.+)$/); return m ? cst(m[1]) : null; });
    if (vals.some(v => !v)) return false;
    return vals.length === bad.length && bad.every(b => vals.some(v => v.eq(b)));
  });
};
F.cancelExcl = q => {
  const s = boardExpr(q);
  const fr = R(sides(s)[0]);
  const rs = ratRoots(fr.d);
  return rs.length === 1 ? num(rs[0]) : -1;
};
F.longPick = q => {
  const N = R(boardExpr(q));
  return idxWhere(q, c => {
    if (/^Not finished/.test(c)) return false;
    if (!R(c).eq(N)) return false;
    // a finished answer: Q + r/D with deg r < deg D (or no remainder term)
    const { terms } = parse(c);
    return terms.every(t => t.d.isConst() || t.n.deg() < t.d.deg());
  });
};
F.longRem = q => {
  const s = boardExpr(q);
  const [l, r] = sides(s);
  const N = R(l);
  const m = r.match(/^(.*?) \+ \(\(□\)\/\((.*)\)\)$/);
  if (!m) return undefined;
  const Qt = P(m[1]), D = P(m[2]);
  const rem = N.sub(RF.p(Qt)).mul(RF.p(D)).poly();
  return rem && rem.isConst() ? num(rem.cval()) : -1;
};

// ---- justifying
F.agreeProof = q => {
  const [l, r] = sides(boardExpr(q));
  const L = P(l), Rr = P(r);
  return idxWhere(q, c => {
    const m = c.match(/^Not equivalent: at x = (-?\d+) the sides are (-?\d+) and (-?\d+)$/);
    if (m) { const x = Q(Number(m[1])); return !L.eq(Rr) && L.at(x).eq(Q(Number(m[2]))) && Rr.at(x).eq(Q(Number(m[3]))); }
    return false;   // "Equivalent: ..." claims rest on one value or on the end terms: never a valid reason
  });
};
F.whyExpand = q => {
  const [l, r] = sides(boardExpr(q));
  return P(l).eq(P(r)) ? idxRe(q, /^Each step is an allowed rewrite, so the two forms are equal for every x$/) : -1;
};

// ---- context
const LEN = { 'sq ft': 'ft', 'sq m': 'm', 'sq in': 'in' };
F.roomSides = q => {
  const m = plainOf(q).match(/area (.+?) (sq ft|sq m) \(x > 0\)/);
  if (!m) return undefined;
  return sidesChoice(q, P(m[1]), u => u === LEN[m[2]]);
};
F.roomAt = q => {
  const s = plainOf(q);
  const m = s.match(/floor area (.+?) sq ft, with sides \((.+?)\) ft and \((.+?)\) ft\. For x = (-?\d+)/);
  if (!m) return undefined;
  const x = Q(Number(m[4]));
  return [num(P(m[2]).at(x)), num(P(m[3]).at(x))].sort((a, b) => a - b);
};
F.roomWidth = q => {
  const m = plainOf(q).match(/area (.+?) (sq ft|sq m)\. Its width is \((.+?)\) (ft|m)\. What is its length\?/);
  if (!m) return undefined;
  const L = R(m[1]).div(R(m[3]));
  return idxWhere(q, c => { const wu = withUnit(c); return wu && wu.u === LEN[m[2]] && R(wu.e).eq(L); });
};
/** the quantity a context prompt asks for: { v: RF, u: unit } */
function ctxQuantity(s) {
  let m = s.match(/A room is \((.+?)\) ft by \((.+?)\) ft\. A rug \((.+?)\) ft by \((.+?)\) ft lies on it\. Write the floor area the rug does not cover/);
  if (m) return { v: R(`(${m[1]})(${m[2]}) - (${m[3]})(${m[4]})`), u: 'sq ft' };
  m = s.match(/A box is (.+?) in long, (.+?) in wide and (.+?) in tall\. Write its volume/);
  if (m) return { v: R(`(${m[1]})(${m[2]})(${m[3]})`), u: 'cu in' };
  m = s.match(/A rectangle has area (.+?) sq ft and one side \((.+?)\) ft\. Write the other side/);
  if (m) return { v: R(`(${m[1]})/(${m[2]})`), u: 'ft' };
  m = s.match(/A rectangular deck is \((.+?)\) ft by \((.+?)\) ft\. Write its area/);
  if (m) return { v: R(`(${m[1]})(${m[2]})`), u: 'sq ft' };
  m = s.match(/A rectangular deck is \((.+?)\) ft by \((.+?)\) ft\. Write its perimeter/);
  if (m) return { v: R(`2(${m[1]}) + 2(${m[2]})`), u: 'ft' };
  m = s.match(/A box has volume (.+?) cu in and a base of area (.+?) sq in\. Write its height/);
  if (m) return { v: R(`(${m[1]})/(${m[2]})`), u: 'in' };
  m = s.match(/revenue is R\(x\) = (.+?) dollars and its cost is C\(x\) = (.+?) dollars\. Write its profit/);
  if (m) return { v: R(`(${m[1]}) - (${m[2]})`), u: 'dollars' };
  return null;
}
F.ctxOp = q => {
  const k = ctxQuantity(plainOf(q));
  if (!k) return undefined;
  return idxWhere(q, c => { const wu = withUnit(c); return wu && wu.u === k.u && R(wu.e).eq(k.v); });
};
F.ctxValue = q => {
  const s = plainOf(q);
  const k = ctxQuantity(s), xm = s.match(/find its value for x = (-?\d+)/);
  if (!k || !xm) return undefined;
  return num(k.v.at(Q(Number(xm[1]))));
};

// ============================================================ sane
function sane(q) {
  const out = [];
  try {
    const s = plainOf(q), f = q.family;
    // the box picture: its cells must add up to the polynomial on the board (when every cell is shown)
    const cells = q.data?.picture?.box?.cells;
    if (cells && cells.flat().every(c => c !== '' && c !== '?') && !['divTerms', 'divSigned'].includes(f)) {
      const sum = cells.flat().map(c => P(fromTex(c))).reduce((a, b) => a.add(b));
      const b = boardExpr(q), left = sides(b)[0];
      const T = tryP(left);
      if (T && !sum.eq(T)) out.push('the box cells do not add up to the polynomial');
    }
    if (f === 'numGcfSum') {
      const m = s.match(/Write (\d+) \+ (\d+) as one product: .*= □ × \((\d+) \+ (\d+)\)/);
      if (m && Number(m[1]) * Number(m[4]) !== Number(m[2]) * Number(m[3])) out.push('the two parts do not share the same factor');
    }
    if (f === 'areaParallel') {
      const m = s.match(/^(.+?) = (.+?)\. Put in x = (\d+): the area is (\d+)\. Fill in (\d+) = □ × (\d+)/);
      if (m) {
        const T = P(m[1]), x = Q(Number(m[3]));
        if (!T.eq(P(m[2]))) out.push('the shown factorization is wrong');
        if (!T.at(x).eq(Q(Number(m[4])))) out.push('the shown area is wrong');
        const fs = factorsOf(m[2]) ?? [];
        if (!fs.some(t => P(t).at(x).eq(Q(Number(m[6]))))) out.push('the shown factor value is not a side');
        if (Number(m[5]) % Number(m[6]) !== 0) out.push('the division is not exact');
      }
    }
    if (f === 'verifyJudge') {
      const [l, r] = sides(boardExpr(q)); const L = P(l), Rr = P(r);
      if (!L.coef(1).eq(Rr.coef(1)) && !L.coef(0).eq(Rr.coef(0))) out.push('both the middle and the constant differ: two "wrong" statements are true');
    }
    if (f === 'primeJudge') {
      const T = P(lhs(q));
      const D = T.coef(1).mul(T.coef(1)).sub(T.coef(2).mul(T.coef(0)).mul(Q(4)));
      if (isPrimePoly(T) && D.n < 0 && choiceExprs(q).some(c => /no real solutions/.test(c))) out.push('prime with no real zeros: the "no real solutions" option is true as well');
    }
    if (f === 'cancelExcl') {
      const [l, r] = sides(boardExpr(q));
      const fr = R(l), E = r.split(',')[0];
      if (!fr.eq(R(E))) out.push('the shown quotient is wrong');
      if (ratRoots(fr.d).length !== 1) out.push(`the divisor is 0 at ${ratRoots(fr.d).length} values, the question says one`);
    }
    if (f === 'longRem') {
      const [l, r] = sides(boardExpr(q));
      const m = r.match(/^(.*?) \+ \(\(□\)\/\((.*)\)\)$/);
      if (m) { const rem = R(l).sub(R(m[1])).mul(R(m[2])).poly(); if (!rem || !rem.isConst()) out.push('the shown quotient is wrong: the remainder is not a number'); }
    }
    if (f === 'agreeProof') {
      const m = s.match(/because both sides are (-?\d+) at x = (-?\d+)/), [l, r] = sides(boardExpr(q));
      if (m) { const x = Q(Number(m[2])); if (!P(l).at(x).eq(Q(Number(m[1]))) || !P(r).at(x).eq(Q(Number(m[1])))) out.push('the shown agreeing value is wrong'); }
      if (P(l).eq(P(r))) out.push('the claim is actually right');
    }
    if (f === 'roomAt') {
      const m = s.match(/floor area (.+?) sq ft, with sides \((.+?)\) ft and \((.+?)\) ft\. For x = (-?\d+)/);
      if (m) {
        if (!P(m[1]).eq(P(`(${m[2]})(${m[3]})`))) out.push('the shown sides do not multiply to the area');
        const bm = boardExpr(q).match(/= (\d+) sq ft/);
        if (bm && !P(m[1]).at(Q(Number(m[4]))).eq(Q(Number(bm[1])))) out.push('the board area is wrong');
      }
    }
    if (f === 'sameValue') {
      const [l, r] = sides(boardExpr(q));
      if (!P(l).eq(P(r))) out.push('Mia\'s rewrite is wrong');
    }
    if (f === 'whyExpand') {
      const [l, r] = sides(boardExpr(q));
      if (!P(l).eq(P(r))) out.push('the shown expansion is wrong');
    }
    if (f === 'roomWidth' || f === 'ctxOp' || f === 'ctxValue') {
      const k = f === 'roomWidth' ? null : ctxQuantity(s);
      if (k && !k.v.poly()) out.push('the asked quantity is not a polynomial');
      if (f === 'ctxValue' && k) { const xm = s.match(/for x = (-?\d+)/); if (xm && k.v.at(Q(Number(xm[1]))).cmp(Q(0)) <= 0) out.push('the value is 0 or negative'); }
    }
  } catch (e) { out.push(`oracle could not read the item: ${e.message}`); }
  return out.join('; ');
}

function solve(q) {
  const f = F[q.family];
  if (!f) return undefined;
  return f(q);
}

export default { solve, sane };
