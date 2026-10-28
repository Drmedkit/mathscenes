// Oracle for the lesson "polynomials" (Algebra 1, polynomial expressions). Role O, docs/lessons/QUALITY_LAYER.md.
// Written from what the student sees only: the prompt HTML, the choice HTML, the board TeX (the plain text loses
// exponent and fraction grouping) and the chain / box data the page draws. Every expression is parsed into an exact
// Laurent polynomial in x and y (Q coefficients, integer exponents; a negative exponent, √x or a variable exponent
// marks it as NOT a polynomial), so "equal" means equal after full expansion, never equal as text. Standard form,
// written terms, degree and names are read from the parsed terms; statements (tests, errors, closure, context
// meanings) are judged by computing what they claim.
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
/** board TeX → the same kind of expression string */
function fromTex(t) {
  let s = String(t ?? '').replace(/\\overset\{\?\}\{=\}/g, ' ?= ');
  for (let i = 0; i < 8; i++) {
    const b = s;
    s = s.replace(/\\cssId\{[^{}]*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1')
      .replace(/\\(?:text|mathrm|textbf)\{([^{}]*)\}/g, ' $1 ')
      .replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
      .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
      .replace(/\^\{([^{}]*)\}/g, '^($1)');
    if (s === b) break;
  }
  return s.replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\left|\\right/g, '')
    .replace(/\\quad|\\qquad|\\[,;:! ]|~/g, ' ').replace(/\\[a-zA-Z]+/g, ' ').replace(/[{}]/g, '').replace(/[−–]/g, '-')
    .replace(/\s+/g, ' ').trim();
}

// ============================================================ exact Laurent polynomials in x, y
// Map 'ex,ey' → Q (no zero entries); opaque = not a Laurent polynomial at all (√x, 2^x, ÷ by a sum)
class Poly {
  constructor(m = new Map(), opaque = false) { this.m = m; this.opaque = opaque; }
  static c(q) { const m = new Map(); q = q instanceof Object ? q : Q(q); if (q.n !== 0) m.set('0,0', q); return new Poly(m); }
  static mono(c, ex, ey = 0) { const m = new Map(); if (c.n !== 0) m.set(`${ex},${ey}`, c); return new Poly(m); }
  static op() { return new Poly(new Map(), true); }
  add(o) {
    if (this.opaque || o.opaque) return Poly.op();
    const m = new Map(this.m);
    for (const [k, c] of o.m) { const v = (m.get(k) ?? Q(0)).add(c); if (v.n === 0) m.delete(k); else m.set(k, v); }
    return new Poly(m);
  }
  neg() { if (this.opaque) return Poly.op(); const m = new Map(); for (const [k, c] of this.m) m.set(k, c.neg()); return new Poly(m); }
  sub(o) { return this.add(o.neg()); }
  mul(o) {
    if (this.opaque || o.opaque) return Poly.op();
    let r = new Poly();
    for (const [ka, ca] of this.m) for (const [kb, cb] of o.m) {
      const [ax, ay] = ka.split(',').map(Number), [bx, by] = kb.split(',').map(Number);
      r = r.add(Poly.mono(ca.mul(cb), ax + bx, ay + by));
    }
    return r;
  }
  inv() {   // only a single term has a Laurent inverse
    if (this.opaque || this.m.size !== 1) return Poly.op();
    const [[k, c]] = [...this.m];
    const [ex, ey] = k.split(',').map(Number);
    return Poly.mono(Q(1).div(c), -ex, -ey);
  }
  div(o) { if (!o.opaque && o.m.size === 0) throw new Error('division by 0'); return this.mul(o.inv()); }
  isConst() { return !this.opaque && [...this.m.keys()].every(k => k === '0,0'); }
  cval() { return this.m.get('0,0') ?? Q(0); }
  pow(e) {
    if (this.opaque || e.opaque || !e.isConst()) return Poly.op();
    const v = e.cval();
    if (v.d !== 1) return Poly.op();
    let n = v.n, b = this;
    if (n < 0) { b = this.inv(); n = -n; }
    let r = Poly.c(Q(1));
    for (let i = 0; i < n; i++) r = r.mul(b);
    return r;
  }
  isPoly() { return !this.opaque && [...this.m.keys()].every(k => k.split(',').every(e => Number(e) >= 0)); }
  isZero() { return !this.opaque && this.m.size === 0; }
  eq(o) { return !this.opaque && !o.opaque && this.m.size === o.m.size && [...this.m].every(([k, c]) => o.m.has(k) && o.m.get(k).eq(c)); }
  coef(ex, ey = 0) { return this.m.get(`${ex},${ey}`) ?? Q(0); }
  keys() { return [...this.m.keys()].map(k => k.split(',').map(Number)); }
  deg() { return this.m.size ? Math.max(...this.keys().map(([a, b]) => a + b)) : null; }
  at(x, y = 0) {
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
  lead() { const d = this.deg(); const ks = this.keys().filter(([a, b]) => a + b === d); return ks.length === 1 ? this.coef(...ks[0]) : null; }
}

// ============================================================ parser
function tokens(s) {
  const out = [];
  const re = /\s*(\d+(?:\.\d+)?|\.\d+|[xy]|[-+*·×÷/^()√])/y;
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
/** parse an expression: { poly, terms } — terms = the top-level written summands, each with its sign */
function parse(s) {
  const T = tokens(s);
  let p = 0;
  const peek = () => T[p], next = () => T[p++];
  const startsAtom = t => t !== undefined && (/^[\d.]/.test(t) || t === 'x' || t === 'y' || t === '(' || t === '√');
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
    if (peek() === '^') {
      next();
      let neg = false;
      if (peek() === '-') { next(); neg = true; }
      const e = atom();
      return b.pow(neg ? e.neg() : e);
    }
    return b;
  }
  function atom() {
    const t = next();
    if (t === undefined) throw new Error(`unexpected end in "${s}"`);
    if (/^[\d.]/.test(t)) return Poly.c(Q(Number(t)));
    if (t === 'x') return Poly.mono(Q(1), 1, 0);
    if (t === 'y') return Poly.mono(Q(1), 0, 1);
    if (t === '(') { const ts = sum(); if (next() !== ')') throw new Error(`missing ) in "${s}"`); return ts.reduce((a, b) => a.add(b)); }
    if (t === '√') {
      const a = atom();
      if (a.isConst() && a.cval().n >= 0) {
        const c = a.cval(), rn = Math.round(Math.sqrt(c.n)), rd = Math.round(Math.sqrt(c.d));
        if (rn * rn === c.n && rd * rd === c.d) return Poly.c(Q(rn, rd));
      }
      return Poly.op();
    }
    throw new Error(`unexpected "${t}" in "${s}"`);
  }
  const terms = sum();
  if (p !== T.length) throw new Error(`left over "${T.slice(p).join(' ')}" in "${s}"`);
  return { poly: terms.reduce((a, b) => a.add(b)), terms };
}
const P = s => parse(s).poly;
const tryP = s => { try { return P(s); } catch { return null; } };

// ============================================================ reading the item
const plainOf = q => fromHtml(q.promptHtml ?? q.prompt);
const choiceExprs = q => (q.choicesHtml ?? q.choices ?? []).map(fromHtml);
const boardExpr = q => fromTex(q.board);
const sides = s => s.split(/\?=|=/).map(t => t.trim());
const NAMES_DEG = ['constant', 'linear', 'quadratic', 'cubic', 'quartic', 'quintic'];
const countName = n => (n === 1 ? 'monomial' : n === 2 ? 'binomial' : n === 3 ? 'trinomial' : 'polynomial');
const sameText = (a, b) => a.replace(/\s+/g, ' ').trim().toLowerCase() === b.replace(/\s+/g, ' ').trim().toLowerCase();
const idxWhere = (q, pred) => { const hits = choiceExprs(q).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0); return hits.length === 1 ? hits[0] : -1; };
const idxRe = (q, re) => idxWhere(q, c => re.test(c));
const num = q => Number(q.n) / Number(q.d);
const frac = s => { const p = tryP(s); return p && p.isConst() ? p.cval() : null; };

/** written terms are in standard form: single x-monomials, nonzero, x exponents strictly falling, nothing to collect */
function isStandard(s) {
  const { terms } = parse(s);
  let last = Infinity;
  for (const t of terms) {
    if (t.opaque || t.m.size !== 1) return false;
    const [[ex, ey]] = t.keys();
    if (ey !== 0 || ex >= last) return false;
    last = ex;
  }
  return true;
}
/** the choice equal to `target` by expansion (a standard-form one first when two are equal) */
function choiceEqual(q, target, wantStd = true) {
  const cs = choiceExprs(q);
  const eqs = cs.map((c, i) => (tryP(c)?.eq(target) ? i : -1)).filter(i => i >= 0);
  if (eqs.length <= 1) return eqs.length ? eqs[0] : -1;
  const std = wantStd ? eqs.filter(i => { try { return isStandard(cs[i]); } catch { return false; } }) : [];
  return std.length === 1 ? std[0] : -1;
}
/** which coefficient the prompt asks for: [ex, ey] */
function asked(s) {
  let m = s.match(/coefficient of x(?:\^\((\d+)\))?(?![\w(^])/);
  if (/constant term/.test(s)) return [0, 0];
  if (m) return [Number(m[1] ?? 1), 0];
  m = s.match(/x(?:\^\((\d+)\))? coefficient/);
  if (m) return [Number(m[1] ?? 1), 0];
  return null;
}
/** the top-level factors of "(A)(B)" or "(A)^(2)" or "m(A)": list of factor strings, or null */
function factorsOf(s) {
  s = s.trim();
  const out = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] === ' ') { i++; continue; }
    if (s[i] === '(') {
      let d = 0, j = i;
      for (; j < s.length; j++) { if (s[j] === '(') d++; else if (s[j] === ')') { d--; if (d === 0) break; } }
      const inner = s.slice(i + 1, j);
      i = j + 1;
      const pw = s.slice(i).match(/^\^\((\d+)\)/);
      if (pw) { for (let k = 0; k < Number(pw[1]); k++) out.push(inner); i += pw[0].length; } else out.push(inner);
    } else {
      // a leading monomial factor like -3x^(2)
      const m = s.slice(i).match(/^[-+]?[\d./]*(?:\(\(\d+\)\/\(\d+\)\))?(?:[xy](?:\^\(\d+\))?)*/);
      if (!m || !m[0]) return null;
      if (/[+]/.test(m[0].slice(1))) return null;
      out.push(m[0]); i += m[0].length;
    }
  }
  return out;
}

// ============================================================ the families
const F = {};

F.powerRead = q => {
  const s = plainOf(q), b = boardExpr(q);
  let m = s.match(/exponent of x in (.+)\?$/);
  if (m) { const t = P(m[1]); if (t.m.size !== 1) return undefined; const [[ex]] = t.keys(); return idxWhere(q, c => frac(c)?.eq(Q(ex))); }
  if (/equal to|means/.test(s)) return choiceEqual(q, P(b), false);
  m = s.match(/^In (.+), what is squared\?$/);
  if (m) {
    const whole = /^\(.*\)\^\(2\)$/.test(b) || /^\(.*\)\^2$/.test(b);
    return whole ? idxRe(q, /the whole term/) : idxRe(q, /^only x$/);
  }
  return undefined;
};
F.powerEval = q => {
  const m = boardExpr(q).match(/^(.*) at x = (-?[\d.]+)$/);
  if (!m) return undefined;
  return num(P(m[1]).at(Q(Number(m[2]))));
};
F.isPoly = q => idxWhere(q, c => tryP(c)?.isPoly() === true);
F.notPoly = q => idxWhere(q, c => { const p = tryP(c); return !p || !p.isPoly(); });
F.countTerms = q => parse(boardExpr(q)).terms.length;
F.whichTerms = q => {
  const w = parse(boardExpr(q)).terms;
  return idxWhere(q, c => {
    const items = c.split(',').map(t => tryP(t));
    return items.length === w.length && items.every((t, i) => t && t.eq(w[i]));
  });
};
F.coefOf = q => { const a = asked(plainOf(q)); return a ? num(P(boardExpr(q)).coef(...a)) : undefined; };
F.coefPick = q => { const a = asked(plainOf(q)); if (!a) return undefined; const c = P(boardExpr(q)).coef(...a); return idxWhere(q, x => frac(x)?.eq(c)); };
F.termDegree = q => P(boardExpr(q)).deg();
const highest = q => {
  const ds = choiceExprs(q).map(c => P(c).deg());
  const mx = Math.max(...ds);
  return ds.filter(d => d === mx).length === 1 ? ds.indexOf(mx) : -1;
};
F.degreeHigh = highest;
F.mvHigh = highest;
F.polyDegree = q => P(boardExpr(q)).deg();
F.degreeCh = q => {
  const p = P(boardExpr(q));
  if (p.isZero()) return idxRe(q, /no degree/);
  return idxWhere(q, c => frac(c)?.eq(Q(p.deg())));
};
const nameIdx = (q, p) => {
  if (p.isZero()) return -1;
  const want = `${NAMES_DEG[p.deg()]} ${countName(p.m.size)}`;
  return idxWhere(q, c => sameText(c, want));
};
F.termName = q => { const n = P(boardExpr(q)).m.size; return idxWhere(q, c => c.split(' ')[0] === countName(n)); };
F.degreeName = q => { const p = P(boardExpr(q)); return p.isZero() ? -1 : idxWhere(q, c => sameText(c, NAMES_DEG[p.deg()])); };
F.fullName = q => nameIdx(q, P(boardExpr(q)));
F.collectName = q => nameIdx(q, P(boardExpr(q)));
F.stdForm = q => { const t = P(boardExpr(q)); return idxWhere(q, c => tryP(c)?.eq(t) && isStandard(c) && parse(c).terms.length === t.m.size); };
F.leadCoef = q => num(P(boardExpr(q)).lead());
F.mvDegree = q => P(boardExpr(q)).deg();
const likeOf = (a, b) => a.m.size === 1 && b.m.size === 1 && [...a.m.keys()][0] === [...b.m.keys()][0];
F.likePick = q => { const t = P(boardExpr(q)); return idxWhere(q, c => likeOf(P(c), t)); };
F.mvLike = F.likePick;
F.likeCount = q => {
  const m = plainOf(q).match(/like terms of (.+?)\?/);
  if (!m) return undefined;
  const t = P(m[1]);
  return boardExpr(q).split(',').map(s => P(s)).filter(p => likeOf(p, t)).length;
};
F.mvPair = q => {
  const s = plainOf(q);
  let m = s.match(/^Are (.+) and (.+) like terms\?$/);
  if (m) return likeOf(P(m[1]), P(m[2])) ? idxRe(q, /^Yes/) : -1;
  if (/Which pair are like terms/.test(s)) return idxWhere(q, c => { const [a, b] = c.split(' and '); return likeOf(P(a), P(b)); });
  return undefined;
};
// a choice equal to the board expression
const eqBoard = q => choiceEqual(q, P(boardExpr(q)));
for (const f of ['collect', 'addPoly', 'opposite', 'subPoly', 'monoMul', 'monoPoly', 'binBin', 'squareBin', 'conj', 'multiTerm', 'conjMatch']) F[f] = eqBoard;
const coefBoard = q => { const a = asked(plainOf(q)); return a ? num(P(boardExpr(q)).coef(...a)) : undefined; };
for (const f of ['collectCoef', 'addVertical', 'oppositeCoef', 'subCoef', 'monoPolyCoef', 'multiCoef']) F[f] = coefBoard;
F.squareMid = q => num(P(boardExpr(q)).coef(1));
F.monoMulPair = q => {
  const p = P(boardExpr(q));
  if (p.m.size !== 1) return undefined;
  const [[ex, ey]] = p.keys();
  return ey === 0 ? [num(p.coef(ex)), ex] : undefined;
};
F.binBinCoef = q => { const p = P(boardExpr(q)); return [num(p.coef(1)), num(p.coef(0))]; };
F.cellCount = q => {
  const s = plainOf(q), b = boardExpr(q);
  if (/partial products/.test(s)) {
    const fs = factorsOf(b);
    return fs ? fs.reduce((n, f) => n * parse(f).terms.length, 1) : undefined;
  }
  if (/How many terms/.test(s)) return P(b).m.size;
  return undefined;
};

// ---- tests of a claimed rewrite
const claimOf = q => { const [l, r] = sides(boardExpr(q)); return [P(l), P(r)]; };
F.testValue = q => {
  const [L, R] = claimOf(q);
  if (L.eq(R)) return idxRe(q, /^none/);
  return idxWhere(q, c => { const m = c.match(/^x = (-?[\d.]+)$/); return m && !L.at(Q(Number(m[1]))).eq(R.at(Q(Number(m[1])))); });
};
F.testVerdict = q => {
  const [L, R] = claimOf(q);
  const s = plainOf(q);
  // the tested values follow "at x =" / "and x =" (not "5x = 20x" inside the claim)
  const xs = [...s.matchAll(/(?:at|and) x = (-?[\d.]+)/gi)].map(m => Q(Number(m[1])));
  if (!xs.length) return undefined;
  const differ = xs.some(x => !L.at(x).eq(R.at(x)));
  return differ ? idxRe(q, /^(The rewrite is wrong|They prove the rewrite is wrong)/) : idxRe(q, /^Nothing|never prove/);
};

// ---- chains: the first step that changes the value
function chainLines(q) { return (q.data?.picture?.chain?.lines ?? []).map(l => fromTex(l).replace(/^=\s*/, '')); }
const badStep = q => {
  const L = chainLines(q).map(P);
  if (L.length < 2) return undefined;
  for (let k = 1; k < L.length; k++) if (!L[k].eq(L[k - 1])) return idxWhere(q, c => c.trim() === `Step ${k}`);
  return idxRe(q, /^No step/);
};
F.badStep = badStep;
F.badStepSub = badStep;

// ---- naming the error: test which rule actually describes Sam's slip
function slipRules(q) {
  const [ls, rs] = sides(boardExpr(q));
  const R = P(rs), L = P(ls);
  const ok = {};
  if (L.eq(R)) return ok;   // no error at all
  const fs = factorsOf(ls);
  const sub = ls.match(/^\((.*)\) - \((.*)\)$/);
  if (sub && !/\)\s*\(/.test(ls)) {
    const A = P(sub[1]), bt = parse(sub[2]).terms;
    const firstOnly = bt.slice(1).reduce((s, t) => s.add(t), A.sub(bt[0]));
    ok.minusFirst = firstOnly.eq(R);
  } else if (fs && fs.length === 2 && /^\(/.test(ls)) {
    const a = parse(fs[0]).terms, b = parse(fs[1]).terms;
    const cells = a.flatMap(x => b.map(y => x.mul(y)));
    const square = /\^\(2\)$/.test(ls);
    if (square) ok.power = a.reduce((s, t) => s.add(t.mul(t)), new Poly()).eq(R);
    else if (cells.length === 4) {
      let two = false;
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (cells[i].add(cells[j]).eq(R)) two = true;
      ok.partial = two;
    }
  } else {
    const t = parse(ls).terms;
    if (t.length >= 2 && t.every(x => x.m.size === 1) && R.m.size === 1) {
      const like = t.every(x => likeOf(x, t[0]));
      const coefSum = t.reduce((s, x) => s.add(Poly.c([...x.m.values()][0])), new Poly()).cval();
      if (like) ok.likeExp = [...R.m.values()][0].eq(coefSum) && [...R.m.keys()][0] !== [...t[0].m.keys()][0];
      else ok.unlike = { terms: t };
    }
  }
  return ok;
}
F.nameError = q => {
  const ok = slipRules(q);
  return idxWhere(q, c => {
    if (/^It should be/.test(c)) return false;   // an answer, not a rule
    if (/minus sign was applied to the first term/.test(c)) return !!ok.minusFirst;
    if (/partial products were used/.test(c)) return !!ok.partial;
    if (/exponent does not distribute/.test(c)) return !!ok.power;
    if (/exponent stays the same/.test(c)) return !!ok.likeExp;
    const m = c.match(/^(.+?) and (.+?) are unlike terms/);
    if (m) {
      if (!ok.unlike) return false;
      const a = tryP(m[1]), b = tryP(m[2]), t = ok.unlike.terms;
      return t.length === 2 && a && b && ((a.eq(t[0]) && b.eq(t[1])) || (a.eq(t[1]) && b.eq(t[0])));
    }
    return false;
  });
};
F.repair = q => { const [ls] = sides(boardExpr(q)); return choiceEqual(q, P(ls)); };

// ---- closure
F.closure = q => {
  const s = plainOf(q);
  const m = s.match(/Is the (sum|difference|product|quotient) of two polynomials always a polynomial/);
  if (m) return m[1] === 'quotient' ? idxRe(q, /^Sometimes/) : idxRe(q, /^Yes, always/);
  if (/Is the result a polynomial/.test(s)) {
    const [, rs] = sides(boardExpr(q));
    const R = P(rs);
    return R.isPoly() ? idxWhere(q, c => /^Yes/.test(c) && (!R.isConst() || !/constant/.test(c) || /degree 0/.test(c) || R.isZero())) : idxRe(q, /^No/);
  }
  return undefined;
};
F.closureEx = q => {
  const s = plainOf(q);
  const not = /not a polynomial/.test(s);
  return idxWhere(q, c => { const [, r] = sides(c); const p = tryP(r); const isP = !!p && p.isPoly(); return not ? !isP : isP; });
};

// ---- context
const dims = s => { const m = s.match(/\(x \+ (\d+)\) ft by \(x \+ (\d+)\) ft/); return m ? [Number(m[1]), Number(m[2])] : null; };
F.ctxMeaning = q => {
  const s = plainOf(q);
  let m = s.match(/What does the factor \(x \+ (\d+)\) stand for/);
  if (m) { const d = dims(s); return d && d.includes(Number(m[1])) ? idxRe(q, /^one side length/) : -1; }
  m = s.match(/Its area is .* What does the (\d+) mean\?/);
  if (m) {
    const d = dims(s), n = Number(m[1]);
    if (!d || d[0] * d[1] !== n) return -1;
    return idxWhere(q, c => { const k = c.match(/the area of the (\d+) ft by (\d+) ft corner piece/); return k && [Number(k[1]), Number(k[2])].sort().join() === [...d].sort().join(); });
  }
  m = s.match(/Revenue: (\d+)x dollars\. Cost: (.+?) dollars\..*What does the (\d+) stand for/);
  if (m) {
    const rev = Number(m[1]), cost = P(m[2]), n = Q(Number(m[3]));
    if (cost.coef(0).eq(n)) return idxRe(q, /^a fixed weekly cost/);
    if (Q(rev).sub(cost.coef(1)).eq(n)) return idxRe(q, /^the profit on each sandwich/);
    return -1;
  }
  m = s.match(/square base x in\. on each side .*What does the x\^\(2\) in x\^\(2\)\(x \+ \d+\) stand for/);
  if (m) return idxRe(q, /^the area of the square base/);
  return undefined;
};
function ctxPoly(s) {
  let m = s.match(/x ft on a side, is made (\d+) ft longer and (\d+) ft wider/);
  if (m) return P(`(x + ${m[1]})(x + ${m[2]})`);
  m = s.match(/square base x in\. on a side and is (\d+) in\. taller than it is wide/);
  if (m) return P(`x·x·(x + ${m[1]})`);
  m = s.match(/x in\. on a side, has a frame (\d+(?:\.\d+)?) in\. wide all around/);
  if (m) return P(`(x + 2·${m[1]})^(2) - x^(2)`);
  m = s.match(/sells x sandwiches a week for \$(\d+(?:\.\d+)?) each\. Its weekly cost is (.+?) dollars/);
  if (m) return P(`${m[1]}x - (${m[2]})`);
  return null;
}
F.ctxWrite = q => { const p = ctxPoly(plainOf(q)); return p ? choiceEqual(q, p) : undefined; };
F.ctxValue = q => {
  const s = plainOf(q);
  const xm = s.match(/when x = (-?[\d.]+)/);
  if (!xm) return undefined;
  const x = Q(Number(xm[1]));
  let m = s.match(/square base x in\. on a side and height \(x \+ (\d+)\) in\./);
  if (m) return num(P(`x^(2)(x + ${m[1]})`).at(x));
  const d = dims(s);
  if (d) return num(P(`(x + ${d[0]})(x + ${d[1]})`).at(x));
  return undefined;
};

// ============================================================ sane
function sane(q) {
  const out = [];
  try {
    const s = plainOf(q), b = boardExpr(q);
    // a fill-in line must show the right fixed terms
    if (q.family === 'squareMid') {
      const m = s.match(/= (.+?)□x(.*?)\. What/);
      const p = P(b);
      if (m) {
        const lead = P(m[1].replace(/\+\s*$/, '')), tail = P(m[2] || '0');
        if (!lead.eq(Poly.mono(p.coef(2), 2))) out.push('the shown x² term is wrong');
        if (!tail.eq(Poly.c(p.coef(0)))) out.push('the shown constant is wrong');
      }
    }
    if (q.family === 'binBinCoef') {
      const p = P(b), lead = tryP((q.pair?.lead ?? '').replace(/−/g, '-').replace(/\+\s*$/, '').replace(/\^(\d+)/g, '^($1)'));
      if (lead && !lead.eq(Poly.mono(p.coef(2), 2))) out.push('the shown x² term of the fill-in is wrong');
      if (p.deg() !== 2) out.push('the product is not quadratic');
    }
    if (q.family === 'countTerms' || q.family === 'termName') {
      const w = parse(b).terms;
      if (w.length !== P(b).m.size) out.push('written terms can still be collected: the term count is ambiguous');
    }
    if (q.family === 'collectName' && P(b).isZero()) out.push('the collected result is 0: it has no degree name');
    if (q.family === 'badStepSub') {
      const ch = q.data?.picture?.chain;
      const at = Q(Number(ch?.at));
      chainLines(q).forEach((l, i) => { const v = ch?.vals?.[i]; if (v != null && !P(l).at(at).eq(Q(Number(String(v).replace('−', '-'))))) out.push(`line ${i} value at x = ${ch.at} is shown as ${v}`); });
    }
    if (q.family === 'testVerdict') {
      const [L, R] = claimOf(q);
      if (/Both sides match each time/.test(s)) {
        const xs = [...s.matchAll(/(?:at|and) x = (-?[\d.]+)/gi)].map(m => Q(Number(m[1])));
        if (xs.some(x => !L.at(x).eq(R.at(x)))) out.push('"both sides match" is not true');
      }
      const m1 = s.match(/At x = (-?[\d.]+) both sides are (-?[\d.]+)/);
      if (m1 && !(L.at(Q(Number(m1[1]))).eq(Q(Number(m1[2]))) && R.at(Q(Number(m1[1]))).eq(Q(Number(m1[2]))))) out.push('the shown matching value is wrong');
      const m2 = s.match(/At x = (-?[\d.]+) the left side is (-?[\d.]+) and the right side is (-?[\d.]+)/);
      if (m2) {
        const x = Q(Number(m2[1]));
        if (!L.at(x).eq(Q(Number(m2[2]))) || !R.at(x).eq(Q(Number(m2[3])))) out.push('the shown side values are wrong');
      }
    }
    if (q.family === 'testValue') {
      const [L, R] = claimOf(q);
      if (!L.eq(R)) {
        const bad = choiceExprs(q).filter(c => { const m = c.match(/^x = (-?[\d.]+)$/); return m && !L.at(Q(Number(m[1]))).eq(R.at(Q(Number(m[1])))); });
        if (bad.length > 1) out.push('two test values both disprove the claim');
      }
    }
    if (q.family === 'closure' && /Is the result a polynomial/.test(s)) {
      const [l, r] = sides(b);
      if (!P(l).eq(P(r))) out.push('the shown sum is wrong');
    }
    if (q.family === 'closureEx') {
      for (const c of choiceExprs(q)) { const [l, r] = sides(c); const L = tryP(l), R = tryP(r); if (L && R && !L.eq(R)) out.push(`the shown result is wrong: ${c}`); }
    }
    if (q.family === 'ctxMeaning') {
      const m = s.match(/Profit = (.+?) = (.+?) dollars/);
      if (m && !P(m[1]).eq(P(m[2]))) out.push('the shown profit is wrong');
      const a = s.match(/Its area is (.+?) square feet/), d = dims(s);
      if (a && d && !P(a[1]).eq(P(`(x + ${d[0]})(x + ${d[1]})`))) out.push('the shown area is wrong');
      const v = s.match(/Its volume is (.+?) = (.+?) cubic/);
      if (v && !P(v[1]).eq(P(v[2]))) out.push('the shown volume is wrong');
    }
    if (q.family === 'nameError' || q.family === 'repair') {
      const [l, r] = sides(b);
      if (P(l).eq(P(r))) out.push('Sam\'s line is not wrong');
    }
    if (q.family === 'mvPair' && /^Are/.test(s)) {
      const m = s.match(/^Are (.+) and (.+) like terms\?$/);
      if (m && !likeOf(P(m[1]), P(m[2]))) out.push('the pair is not like, but no choice gives the true reason');
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
