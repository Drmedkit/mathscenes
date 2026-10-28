// Oracle for the lesson "quadratics-complex" (Algebra 2, quadratics with complex solutions). Role O,
// docs/lessons/QUALITY_LAYER.md. Written from what the student sees only: the prompt, the board TeX, the choices and the
// picture data. Every expression is parsed and evaluated EXACTLY: a complex number is a real part + an imaginary part,
// each a sum of q·√r (q an exact fraction, r square-free), so √−48 = 4i√3 and (−1 ± √−31)/−2 is two exact numbers.
// An equation is read as a polynomial by evaluating (left − right) at x = 0, 1, −1, 2 (degree ≤ 2 is checked), which
// gives a, b, c (possibly complex); the roots come from the formula with the principal root √D (D rational). A choice
// that names solutions is read as a SET ("x = p ± q" is two numbers, "x = A or x = B", "only", "no solution") and
// compared with the root set as numbers. Statements are judged by computing what they claim (substitution residuals,
// left/right sides, which parts change sign, whether a pair can be the roots of a real quadratic, the top of a model).
import { texPlain, Q } from '../../tools/quality/oracle-kit.mjs';

// ============================================================ exact reals: Σ q·√r
const sqFree = n => { let k = 1, r = n; for (let p = 2; p * p <= r; p++) while (r % (p * p) === 0) { r /= p * p; k *= p; } return [k, r]; };
class Re {
  constructor(m = new Map()) { this.m = m; }
  static q(f) { f = typeof f === 'number' ? Q(f) : f; const m = new Map(); if (f.n !== 0) m.set(1, f); return new Re(m); }
  static surd(f, r) { const m = new Map(); if (f.n !== 0) m.set(r, f); return new Re(m); }
  add(o) {
    const m = new Map(this.m);
    for (const [r, c] of o.m) { const v = (m.get(r) ?? Q(0)).add(c); if (v.n === 0) m.delete(r); else m.set(r, v); }
    return new Re(m);
  }
  neg() { const m = new Map(); for (const [r, c] of this.m) m.set(r, c.neg()); return new Re(m); }
  sub(o) { return this.add(o.neg()); }
  mul(o) {
    let out = new Re();
    for (const [r1, c1] of this.m) for (const [r2, c2] of o.m) { const [k, t] = sqFree(r1 * r2); out = out.add(Re.surd(c1.mul(c2).mul(k), t)); }
    return out;
  }
  inv() {
    if (this.m.size !== 1) throw new Error(this.m.size ? 'cannot invert a sum of roots' : 'division by 0');
    const [[r, c]] = [...this.m];
    return Re.surd(Q(1).div(c.mul(r)), r);
  }
  isZero() { return this.m.size === 0; }
  isRat() { return [...this.m.keys()].every(r => r === 1); }
  rat() { if (!this.isRat()) throw new Error('not rational'); return this.m.get(1) ?? Q(0); }
  eq(o) { return this.sub(o).isZero(); }
  get value() { let s = 0; for (const [r, c] of this.m) s += c.value * Math.sqrt(r); return s; }
}
const surdOf = f => { if (f.n === 0) return new Re(); const [k, r] = sqFree(f.n * f.d); return Re.surd(Q(k, f.d), r); };

// ============================================================ exact complex numbers
class C {
  constructor(re = new Re(), im = new Re()) { this.re = re; this.im = im; }
  static of(a, b = 0) { return new C(a instanceof Re ? a : Re.q(a), b instanceof Re ? b : Re.q(b)); }
  add(o) { return new C(this.re.add(o.re), this.im.add(o.im)); }
  sub(o) { return new C(this.re.sub(o.re), this.im.sub(o.im)); }
  neg() { return new C(this.re.neg(), this.im.neg()); }
  conj() { return new C(this.re, this.im.neg()); }
  mul(o) { return new C(this.re.mul(o.re).sub(this.im.mul(o.im)), this.re.mul(o.im).add(this.im.mul(o.re))); }
  norm() { return this.re.mul(this.re).add(this.im.mul(this.im)); }
  div(o) {
    const n = o.norm();
    if (n.isZero()) throw new Error('division by 0');
    return this.mul(o.conj()).mul(new C(n.inv(), new Re()));
  }
  pow(k) { let r = C.of(1); for (let j = 0; j < k; j++) r = r.mul(this); return r; }
  isZero() { return this.re.isZero() && this.im.isZero(); }
  isReal() { return this.im.isZero(); }
  eq(o) { return this.sub(o).isZero(); }
  pair() { return [this.re.rat().value, this.im.rat().value]; }
  get approx() { return [this.re.value, this.im.value]; }
}
const I = C.of(0, 1);
function sqrtC(z) {
  if (!z.isReal() || !z.re.isRat()) throw new Error('root of a non-real or irrational number');
  const q = z.re.rat();
  return q.n >= 0 ? new C(surdOf(q), new Re()) : new C(new Re(), surdOf(q.neg()));
}

// ============================================================ parsing
const norm = s => String(s ?? '').replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
function tokens(s) {
  const out = [];
  const re = /\s*(\d+(?:\.\d+)?|[a-zA-Z]|√|[()+\-·×*÷\/^])\s*/y;
  let pos = 0;
  s = norm(s);
  while (pos < s.length) {
    re.lastIndex = pos;
    const m = re.exec(s);
    if (!m) throw new Error(`cannot read "${s.slice(pos)}" in "${s}"`);
    out.push(m[1]); pos = re.lastIndex;
  }
  return out;
}
const isNum = t => /^\d/.test(t ?? '');
const startsAtom = t => t !== undefined && (isNum(t) || /^[a-zA-Z]$/.test(t) || t === '(' || t === '√');
function ev(s, env = {}) {
  const T = tokens(s);
  let p = 0;
  const E = { i: I, ...env };
  const need = t => { if (T[p] !== t) throw new Error(`expected ${t} in "${s}"`); p++; };
  function expr() {
    let v = unary();
    while (T[p] === '+' || T[p] === '-') { const op = T[p++]; const w = unary(); v = op === '+' ? v.add(w) : v.sub(w); }
    return v;
  }
  function unary() {
    if (T[p] === '-') { p++; return unary().neg(); }
    if (T[p] === '+') { p++; return unary(); }
    return term();
  }
  function term() {
    let v = power();
    for (;;) {
      const t = T[p];
      if (t === '·' || t === '×' || t === '*') { p++; v = v.mul(signed()); }
      else if (t === '÷' || t === '/') { p++; v = v.div(signed()); }
      else if (startsAtom(t)) v = v.mul(power());
      else return v;
    }
  }
  function signed() { if (T[p] === '-') { p++; return signed().neg(); } return power(); }
  function power() {
    const b = atom();
    if (T[p] === '^') {
      p++;
      const e = atom();
      if (!e.isReal() || !e.re.isRat() || e.re.rat().d !== 1 || e.re.rat().n < 0) throw new Error('exponent must be a whole number');
      return b.pow(e.re.rat().n);
    }
    return b;
  }
  function atom() {
    const t = T[p];
    if (t === undefined) throw new Error(`unexpected end of "${s}"`);
    if (isNum(t)) { p++; return C.of(Q(t)); }
    if (/^[a-zA-Z]$/.test(t)) { p++; if (!E[t]) throw new Error(`unknown letter ${t}`); return E[t]; }
    if (t === '(') { p++; const v = expr(); need(')'); return v; }
    if (t === '√') { p++; let sg = 1; if (T[p] === '-') { p++; sg = -1; } const a = atom(); return sqrtC(sg < 0 ? a.neg() : a); }
    throw new Error(`unexpected ${t} in "${s}"`);
  }
  const v = expr();
  if (p !== T.length) throw new Error(`left over "${T.slice(p).join('')}" in "${s}"`);
  return v;
}
const tryEv = (s, env) => { try { return ev(s, env); } catch { return null; } };
/** board TeX → plain text (fractions keep their grouping) */
function boardText(tex) {
  let s = String(tex ?? '').replace(/\\pm(?![a-zA-Z])/g, ' ± ').replace(/\\\\/g, ' ; ');
  for (let k = 0; k < 6; k++) s = s.replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
  return norm(texPlain(s));
}
const P = q => norm(q.prompt);

// ---- polynomials: (left − right) as a·v² + b·v + c, coefficients complex
function poly(text) {
  const parts = norm(text).split('=');
  if (parts.length > 2) throw new Error(`two = in "${text}"`);
  const [L, R = '0'] = parts;
  const F = v => { const env = { x: C.of(v), t: C.of(v) }; return ev(L, env).sub(ev(R, env)); };
  const f0 = F(0), f1 = F(1), fm = F(-1), f2 = F(2);
  const half = new C(Re.q(Q(1, 2)), new Re());
  const b = f1.sub(fm).mul(half), a = f1.add(fm).mul(half).sub(f0), c = f0;
  if (!a.mul(C.of(4)).add(b.mul(C.of(2))).add(c).eq(f2)) throw new Error(`not a quadratic: ${text}`);
  const at = z => a.mul(z).mul(z).add(b.mul(z)).add(c);
  const real = a.isReal() && b.isReal() && c.isReal() && a.re.isRat() && b.re.isRat() && c.re.isRat();
  const out = { a, b, c, at, real, L, R };
  out.side = (z, side) => { const env = { x: z, t: z }; return ev(side === 'L' ? L : R, env); };
  if (real) {
    const [A, B, Cc] = [a.re.rat(), b.re.rat(), c.re.rat()];
    out.A = A; out.B = B; out.C = Cc;
    if (A.n !== 0) {
      out.D = B.mul(B).sub(A.mul(Cc).mul(4));
      const sq = sqrtC(C.of(out.D)), twoA = C.of(A.mul(2));
      out.roots = [b.neg().add(sq).div(twoA), b.neg().sub(sq).div(twoA)];
      out.h = B.neg().div(A.mul(2));
      out.k = Cc.sub(B.mul(B).div(A.mul(4)));
    }
  }
  return out;
}
/** distinct members */
const uniq = xs => xs.filter((x, i) => xs.findIndex(y => y.eq(x)) === i);
const sameSet = (a, b) => !!a && !!b && a.every(x => b.some(y => y.eq(x))) && b.every(x => a.some(y => y.eq(x)));

/** a choice that names solutions → the set of numbers, 'NOREAL' for "no real solutions", null if unreadable */
function setOf(text) {
  let t = norm(text).replace(/\.$/, '');
  if (/^no real solutions?$/i.test(t)) return 'NOREAL';
  if (/^(no solutions?|no solutions at all)$/i.test(t)) return [];
  const only = /\bonly$/.test(t);
  t = t.replace(/\s*\bonly$/, '');
  const parts = t.split(/\bor\b/).map(x => x.replace(/^\s*[xt]\s*=\s*/, '').trim());
  const out = [];
  for (const x of parts) {
    const n = (x.match(/±/g) ?? []).length;
    if (n > 1) return null;
    const vs = n ? [x.replace('±', '+'), x.replace('±', '-')] : [x];
    for (const v of vs) { const z = tryEv(v); if (!z) return null; out.push(z); }
  }
  if (only && out.length !== 1) return null;
  return uniq(out);
}
const pickSet = (q, want) => {
  const hits = (q.choices ?? []).map((c, i) => { const s = setOf(c); return Array.isArray(s) && sameSet(s, want) ? i : -1; }).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
};
/** index of the one choice whose statement is true (judge: true / false / null = unknown statement) */
function pickTrue(q, judge) {
  const res = (q.choices ?? []).map(c => judge(norm(c)));
  if (res.some(r => r === null || r === undefined)) return -1;
  const hits = res.map((r, i) => (r ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
const evEq = (s, z) => { const v = tryEv(s); return !!v && v.eq(z); };
const nonReal = z => !z.isReal();
const boardEq = q => boardText(q.board);
/** the root pair as the boxes x = [p] ± [q] i want it */
const pmPair = roots => { const [p, qq] = roots[0].pair(); return [p, Math.abs(qq)]; };

// ============================================================ solve
function solve(q) {
  const f = q.family, p = P(q);
  let m;
  switch (f) {
    case 'rootNeg': {
      const z = ev(boardEq(q).split('=')[0]);
      return pickSet(q, [z]);
    }
    case 'rootNegCoef': {
      const [l, r] = boardEq(q).split('=').map(s => s.trim());
      if (/□/.test(r)) { const unit = ev(r.replace('□', '').trim()); return ev(l).div(unit).re.rat().value; }
      return ev(l).re.rat().value;
    }
    case 'discCount': {
      const E = poly(boardEq(q)), D = E.D.value;
      return pickTrue(q, c => {
        if (/^two non-real complex solutions/.test(c)) return D < 0;
        if (/^exactly one real solution/.test(c)) return D === 0;
        if (/^two different real solutions/.test(c)) return D > 0;
        if (/^exactly one non-real solution/.test(c)) return false;   // non-real roots of a real quadratic come in pairs
        if (/^no solutions at all/.test(c)) return false;             // a quadratic always has two solutions in C
        return null;
      });
    }
    case 'discValue': return poly(boardEq(q)).D.value;
    case 'complexTruth': {
      if ((m = p.match(/^Ana finds b\^2 - 4ac = (-?\d+) for (.+?) and writes "no solution"\./))) {
        const E = poly(m[2]);
        return pickTrue(q, c => {
          if (/^"No solution" is right/.test(c)) return false;
          if (/^"There is a mistake": a quadratic always has real solutions/.test(c)) return false;
          if (/^One non-real solution/.test(c)) return false;
          if (/^No real solution; there are two non-real complex solutions/.test(c)) return E.D.value < 0;
          return null;
        });
      }
      let eqText = (p.match(/^Is it right to say that (.+?) has no complex solutions\?$/) ?? [])[1];
      const which = (p.match(/^Which statement about (.+?) is true\?$/) ?? [])[1];
      const E = poly(eqText ?? which), R = uniq(E.roots);
      const setPM = s => { const z = tryEv(s.replace('±', '')); return z ? uniq([z, z.neg()]) : null; };
      return pickTrue(q, c => {
        let k;
        if (/^Yes:/.test(c)) return false;                                         // every quadratic has complex solutions
        if ((k = c.match(/^No: it has two non-real solutions, (±\S+)\.$/))) { const s = setPM(k[1]); return sameSet(s, R) && R.length === 2 && R.every(nonReal); }
        if ((k = c.match(/^No: its solutions (±\S+) are real, and every real number is also a complex number \((.+) = (.+)\)\.$/))) {
          const s = setPM(k[1]); return sameSet(s, R) && R.every(z => z.isReal()) && evEq(k[2], ev(k[3]));
        }
        if (/^It has no solutions\.$/.test(c)) return false;
        if (/don't count: the equation is unsolvable/.test(c)) return false;
        if ((k = c.match(/^It has no real solutions, but two non-real solutions: (±\S+)\.$/))) { const s = setPM(k[1]); return sameSet(s, R) && R.length === 2 && R.every(nonReal); }
        if (/^It has one complex solution/.test(c)) return R.length === 1;
        return null;
      });
    }
    case 'sqrtSolve': case 'formulaInt': case 'partsA': case 'mixedSolve':
      return pmPair(poly(boardEq(q)).roots);
    case 'sqrtSolvePick': case 'formulaRad': case 'formulaA': case 'splitPick':
      return pickSet(q, uniq(poly(f === 'splitPick' ? p.match(/^For (.+?) the formula gives/)[1] : boardEq(q)).roots));
    case 'contrastSolve': {
      const R = uniq(poly(boardEq(q)).roots);
      return pickSet(q, R);
    }
    case 'radCoef': {
      const eqText = p.match(/solutions of (.+?) are x = /)[1];
      const E = poly(eqText), im = E.roots[0].im;
      if ((m = p.match(/□i√(\d+)\. What number goes in the box\?$/))) {
        const unit = Re.surd(Q(1), Number(m[1]));
        return Math.abs(im.mul(unit.inv()).rat().value);
      }
      return im.mul(im).rat().value;                                              // i√□: □ = (imaginary part)²
    }
    case 'completeQ': {
      const E = poly(boardEq(q).split(';')[0]);
      return E.B.mul(E.B).div(E.A.mul(E.A).mul(4)).sub(E.C.div(E.A)).value;   // (x + b/2a)² = b²/4a² − c/a
    }
    case 'residual': case 'coefResidual': {
      m = p.match(/^Substitute x = (.+?) into (.+?)\. What number do you get\?/);
      return ev(m[2], { x: ev(m[1]) }).pair();
    }
    case 'verifyVerdict': {
      if ((m = p.match(/^Is x = (.+?) a solution of (.+?)\?( Substitute into both sides\.)?$/))) {
        const z = ev(m[1]), E = poly(m[2]), Lv = E.side(z, 'L'), Rv = E.side(z, 'R'), r = Lv.sub(Rv), ok = r.isZero();
        return pickTrue(q, c => {
          let k;
          if (/^Yes: substituting gives 0\.$/.test(c)) return ok;
          if ((k = c.match(/^No: substituting gives (.+), not 0\.$/))) return !ok && evEq(k[1], r);
          if (/^It can't be checked/.test(c)) return false;                        // substitution works for any number
          if (/^Yes: the real part of the result is 0/.test(c)) return false;     // both parts must be 0
          if (/^Yes: its conjugate .+ is a solution, so it is too/.test(c)) return false;   // assumes what is asked
          if (/^No: a non-real number can't make a real expression 0/.test(c)) return false;
          if (/^Yes: both sides have an i in them/.test(c)) return false;
          if ((k = c.match(/^Yes: both sides equal (.+)\.$/))) return ok && evEq(k[1], Lv);
          if ((k = c.match(/^No: the left side is (.+), the right side is (.+)\.$/))) return !ok && evEq(k[1], Lv) && evEq(k[2], Rv);
          if (/^No: the right side has i in it and the left side does not/.test(c)) return !ok && Lv.isReal() && !Rv.isReal();
          return null;
        });
      }
      if ((m = p.match(/^Lee says (.+?) solves (.+?) "because/))) {
        const z = ev(m[1]), E = poly(m[2]), r = E.at(z), ok = r.isZero();
        return pickTrue(q, c => {
          let k;
          if (/^Neither: Lee's reason proves nothing, but substituting gives 0/.test(c)) return ok;
          if ((k = c.match(/^Kim: substituting gives (.+), not 0\.$/))) return !ok && evEq(k[1], r);
          if (/^Kim: a wrong reason means a wrong claim/.test(c)) return false;
          if (/^Lee: a conjugate pair always solves the equation/.test(c)) return false;
          return null;
        });
      }
      return undefined;
    }
    case 'conjProofStep': {
      if ((m = p.match(/^For (.+?) the formula gives x = .+ What do the two solutions have in common\?$/))) {
        const [r1, r2] = poly(m[1]).roots;
        return pickTrue(q, c => {
          let k;
          if ((k = c.match(/^The same real part, -b\/\(2a\) = (.+)\.$/))) return r1.re.eq(r2.re) && evEq(k[1], new C(r1.re, new Re()));
          if (/^Nothing: each solution is the opposite/.test(c)) return r1.eq(r2.neg()) && !r1.re.eq(r2.re);
          if (/^They are the same number/.test(c)) return r1.eq(r2);
          if (/^The same imaginary part/.test(c)) return r1.im.eq(r2.im);
          return null;
        });
      }
      if ((m = p.match(/^Kim solved \d+ quadratics with real coefficients and negative discriminants, (.+?) among them\./))) {
        const E = poly(m[1]);
        return pickTrue(q, c => {
          let k;
          if (/^No: examples can't cover every a, b, c\. The general formula argument proves it\.$/.test(c)) return true;
          if (/^Yes/.test(c)) return false;                                        // examples never prove "always"
          if ((k = c.match(/^No: it is false, the roots are opposites, like (.+) and its negative\.$/))) { const z = ev(k[1]); return E.at(z).isZero() && E.at(z.neg()).isZero(); }
          return null;
        });
      }
      if ((m = p.match(/^The roots of (.+?) are (.+?) and (.+?)\. Going from one root to the other, what changes\?$/))) {
        const z1 = ev(m[2]), z2 = ev(m[3]);
        const reSame = z1.re.eq(z2.re), imSame = z1.im.eq(z2.im);
        const reFlip = !z1.re.isZero() && z1.re.eq(z2.re.neg()), imFlip = !z1.im.isZero() && z1.im.eq(z2.im.neg());
        return pickTrue(q, c => {
          if (/^Nothing/.test(c)) return reSame && imSame;
          if (/^Only the sign of the real part/.test(c)) return reFlip && imSame;
          if (/^Only the sign of the imaginary part/.test(c)) return reSame && imFlip;
          if (/^The signs of both parts/.test(c)) return reFlip && imFlip;
          return null;
        });
      }
      if ((m = p.match(/^Write the roots of (.+?) as .+ Why is √\(4ac - b\^2\) \/ \(2a\) a real number\?$/))) {
        const E = poly(m[1]), neg = E.D.neg();
        return pickTrue(q, c => {
          if (/^4ac - b\^2 is positive, so its square root is real; and 2a is real\.$/.test(c)) return neg.value > 0;
          if (/^Because i\^2 = -1 cancels the root/.test(c)) return false;
          if (/^It worked for this equation/.test(c)) return false;
          if (/^It is not real/.test(c)) return false;
          return null;
        });
      }
      return undefined;
    }
    case 'secondRoot': {
      if ((m = p.match(/^(.+?) has the root (.+?)\. What is the other root\?/))) {
        const E = poly(m[1]), z = ev(m[2]);
        return E.b.neg().div(E.a).sub(z).pair();                                  // r1 + r2 = −b/a
      }
      if ((m = p.match(/has the non-real root (.+?)\. What is its other root\?/))) return ev(m[1]).conj().pair();
      return undefined;
    }
    case 'pairCheck': {
      m = p.match(/are (.+?) and (.+?)\. What does the conjugate-pair test tell you\?$/);
      const z1 = ev(m[1]), z2 = ev(m[2]);
      // a real quadratic: two real roots, or a non-real pair z, z̄ (a non-real double root is impossible)
      const possible = (z1.isReal() && z2.isReal()) || (nonReal(z1) && z2.eq(z1.conj()));
      return pickTrue(q, c => {
        if (/^Impossible/.test(c)) return !possible;
        if (/^Not ruled out by conjugacy/.test(c)) return possible;                 // no equation is given: only substitution decides
        if (/^They must be the roots/.test(c)) return false;
        return null;
      });
    }
    case 'whichPair': {
      const z = ev(p.match(/has the root (.+?)\. Which pair/)[1]);
      return pickTrue(q, c => {
        const k = c.match(/^(.+) and (.+)$/);
        if (!k) return null;
        const a = ev(k[1]), b = ev(k[2]);
        if (!a.eq(z)) return null;
        return z.isReal() ? b.isReal() : b.eq(z.conj()) && !b.eq(z);
      });
    }
    case 'conjEnough': {
      m = p.match(/^Lee says (.+?) and (.+?) are the roots of (.+?) "because/);
      const z1 = ev(m[1]), z2 = ev(m[2]), E = poly(m[3]), r = E.at(z1), both = r.isZero() && E.at(z2).isZero();
      return pickTrue(q, c => {
        let k;
        if ((k = c.match(/^Conjugacy doesn't prove it, but substituting (.+) gives 0: they are the roots\.$/))) return evEq(k[1], z1) && both;
        if ((k = c.match(/^Conjugacy doesn't prove it, and substituting (.+) gives (.+): they are not the roots\.$/))) return evEq(k[1], z1) && !r.isZero() && evEq(k[2], r);
        if (/^Lee is right/.test(c)) return false;
        if (/^They can't be roots: the roots of a real quadratic are opposites/.test(c)) return false;
        return null;
      });
    }
    case 'whichEquation': {
      m = p.match(/^Which equation has the roots (.+?) and (.+?)\?$/);
      const z1 = ev(m[1]), z2 = ev(m[2]);
      return pickTrue(q, c => { const E = tryPoly(c); return E ? E.at(z1).isZero() && E.at(z2).isZero() && !E.a.isZero() : null; });
    }
    case 'complexCoef': {
      m = p.match(/^(.+?) has the root (.+?)(?: \(substituting gives 0\))?\. Must (.+?) be a root too\?$/);
      const E = poly(m[1]), z = ev(m[2]), w = ev(m[3]);
      const other = E.b.neg().div(E.a).sub(z);
      return pickTrue(q, c => {
        let k;
        if (/^Yes: the coefficients are real, so the non-real roots are a conjugate pair\.$/.test(c)) return E.real && nonReal(z) && w.eq(z.conj()) && E.at(z).isZero();
        if ((k = c.match(/^No: the other root is (.+), the opposite\.$/))) return evEq(k[1], other) && other.eq(z.neg()) && !other.eq(w);
        if (/^You can't tell without solving/.test(c)) return false;
        if (/^No: only equations with complex coefficients/.test(c)) return false;
        if ((k = c.match(/^No: substituting (.+) gives (.+), not 0\. The pair rule needs real coefficients\.$/))) return evEq(k[1], w) && !E.at(w).isZero() && evEq(k[2], E.at(w)) && !E.real;
        if ((k = c.match(/^Yes: the other root is the opposite of (.+)\.$/))) return evEq(k[1], z) && other.eq(z.neg()) && other.eq(w);
        if ((k = c.match(/^Yes: (.+) is the conjugate of (.+), and the conjugate of a root is a root\.$/))) return E.real && evEq(k[1], w) && evEq(k[2], z) && w.eq(z.conj());
        if (/^Yes: non-real roots always come in conjugate pairs/.test(c)) return false;   // only with real coefficients
        return null;
      });
    }
    case 'buildQuad': {
      const z = ev(p.match(/has the root (.+?)\. Fill in/)[1]);
      const lead = (p.match(/Fill in (-?\d*)x\^2/) ?? [])[1];
      const k = lead === '' ? 1 : lead === '-' ? -1 : Number(lead);
      const s = z.add(z.conj()).re.rat(), pr = z.mul(z.conj()).re.rat();      // x² − (z + z̄)x + z z̄
      return [s.neg().mul(k).value, pr.mul(k).value];
    }
    case 'buildPick': {
      const z = ev(p.match(/that has (.+?) as a root\?$/)[1]);
      return pickTrue(q, c => {
        const E = tryPoly(c);
        if (!E) return null;
        return E.real && !E.a.isZero() && E.at(z).isZero();
      });
    }
    case 'modelInterp': {
      const E = poly(boardEq(q));
      const fun = poly(boardEq(q).split('=')[0]);                                  // the model itself
      const top = fun.k, T = Number(norm(q.board).split('=')[1]);
      const R = uniq(E.roots);
      const hit = R.every(z => z.isReal());
      return pickTrue(q, c => {
        let k;
        if ((k = c.match(/^Never: the solutions are not real, so no time works\. The ball tops out at (.+) feet\.$/))) return !hit && Number(k[1]) === top.value;
        if ((k = c.match(/^No: the solutions are not real, so no side length works\. The most area is (.+) square feet\.$/))) return !hit && Number(k[1]) === top.value;
        if (/^The algebra must be wrong/.test(c)) return false;
        if ((k = c.match(/^At t = (.+) seconds\.$/))) { const s = setOf(k[1]); return Array.isArray(s) && sameSet(s, R) && hit; }
        if ((k = c.match(/^At t = (.+) seconds, the top of its path\.$/))) return R.length === 1 && evEq(k[1], R[0]);
        if ((k = c.match(/^Yes, with an? (\d+)-by-(\d+) square\.$/))) { const sd = C.of(Number(k[1])); return k[1] === k[2] && fun.at(sd).eq(C.of(T)); }
        if ((k = c.match(/^Yes, with sides x = (.+) feet\.$/))) { const s = setOf(k[1]); return Array.isArray(s) && sameSet(s, R) && hit; }
        return null;
      });
    }
    case 'modelMax': {
      const fx = p.match(/(?:h\(t\)|A\(x\)) = (.+?) (?:feet|square feet), for/)[1];
      return poly(fx).k.value;
    }
    default: return undefined;
  }
}
function tryPoly(s) { try { return poly(s); } catch { return null; } }

// ============================================================ sane
const terminating = v => { let d = v.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
function sane(q) {
  const p = P(q), f = q.family;
  let m;
  try {
    // picture points: the drawn name must be the number at that spot
    for (const g of q.data?.picture?.roots?.given ?? []) {
      if (g.name === undefined) continue;
      const z = tryEv(g.name);
      if (!z) return `a point on the plane is labeled "${g.name}", which is not a number`;
      const [x, y] = z.approx;
      if (Math.abs(x - g.at[0]) > 1e-9 || Math.abs(y - g.at[1]) > 1e-9) return `the point at (${g.at.join(', ')}) is labeled "${g.name}"`;
    }
    if (q.input === 'pair') {
      const a = solve(q);
      if (Array.isArray(a) && a.some(v => !Number.isFinite(v) || !terminating(Q(v)))) return `the boxes take numbers but a part is ${a.join(', ')}`;
    }
    if (['sqrtSolve', 'formulaInt', 'partsA', 'mixedSolve'].includes(f)) {
      const R = poly(boardEq(q)).roots;
      if (R.every(z => z.isReal())) return 'the equation has real solutions, but the boxes ask for a ± bi';
    }
    if (f === 'complexTruth' && (m = p.match(/^Ana finds b\^2 - 4ac = (-?\d+) for (.+?) and writes/))) {
      const D = poly(m[2]).D.value;
      if (D !== Number(m[1])) return `the prompt says b^2 − 4ac = ${m[1]}, but it is ${D}`;
    }
    if (f === 'formulaInt' && (m = p.match(/\(Here b\^2 - 4ac = (-?\d+)\.\)/))) {
      const D = poly(boardEq(q)).D.value;
      if (D !== Number(m[1])) return `the prompt says b^2 − 4ac = ${m[1]}, but it is ${D}`;
    }
    if (f === 'splitPick') {
      const E = poly(p.match(/^For (.+?) the formula gives/)[1]);
      const shown = setOf(p.match(/the formula gives x = (.+?)\. Which/)[1]);
      const board = setOf(boardEq(q));
      if (!sameSet(shown, uniq(E.roots))) return 'the formula result in the prompt is not the roots';
      if (!sameSet(board, uniq(E.roots))) return 'the formula on the board is not the roots';
    }
    if (f === 'radCoef') {
      const E = poly(p.match(/solutions of (.+?) are x = /)[1]);
      const re = (p.match(/are x = (-?[\d/]+) ±/) ?? [])[1];
      if (re !== undefined && !evEq(re, new C(E.roots[0].re, new Re()))) return `the real part ${re} is not −b/(2a)`;
      if (re === undefined && !E.roots[0].re.isZero()) return 'the real part is left out but it is not 0';
    }
    if (f === 'completeQ') {
      const [eq, sq] = boardEq(q).split(';');
      const E = poly(eq);
      const hh = sq.match(/\(x ([+-]) (\d+(?:\/\d+)?)\)\^2/);
      const shown = hh ? Q(hh[2]).mul(hh[1] === '-' ? -1 : 1) : null;
      if (!shown || !shown.eq(E.B.div(E.A.mul(2)))) return `the square ${sq.trim()} does not match b/(2a) = ${E.B.div(E.A.mul(2))}`;
    }
    if (f === 'conjProofStep') {
      if ((m = p.match(/^For (.+?) the formula gives x = \((.+?) ± √-(\d+)\) \/ (-?\d+)\./))) {
        const E = poly(m[1]);
        if (!E.B.neg().eq(Q(m[2])) || !E.D.eq(Q(-Number(m[3]))) || !E.A.mul(2).eq(Q(m[4]))) return 'the formula in the prompt does not match the equation';
      }
      if ((m = p.match(/^The roots of (.+?) are (.+?) and (.+?)\. Going/))) {
        const E = poly(m[1]);
        if (!sameSet(uniq([ev(m[2]), ev(m[3])]), uniq(E.roots))) return 'the roots in the prompt are not the roots of the equation';
      }
      if ((m = p.match(/^Write the roots of (.+?) as .+ Here 4ac - b\^2 = (-?\d+)\./))) {
        if (poly(m[1]).D.neg().value !== Number(m[2])) return `4ac − b^2 is not ${m[2]}`;
      }
      if ((m = p.match(/negative discriminants, (.+?) among them/)) && poly(m[1]).D.value >= 0) return 'the example equation does not have a negative discriminant';
    }
    if (f === 'secondRoot' && (m = p.match(/^(.+?) has the root (.+?)\. What is the other root\?/))) {
      if (!poly(m[1]).at(ev(m[2])).isZero()) return `${m[2]} is not a root of ${m[1]}`;
    }
    if (f === 'complexCoef' && (m = p.match(/^(.+?) has the root (.+?)(?: \(substituting gives 0\))?\. Must/))) {
      if (!poly(m[1]).at(ev(m[2])).isZero()) return `${m[2]} is not a root of ${m[1]}`;
    }
    if (f === 'verifyVerdict' && (m = p.match(/^Lee says (.+?) solves (.+?) "because (.+?) and (.+?) are conjugates"/))) {
      if (!ev(m[4]).eq(ev(m[3]).conj())) return 'the pair Lee names is not a conjugate pair';
    }
    if (f === 'modelInterp' || f === 'modelMax') {
      let fun, T;
      if (f === 'modelInterp') { fun = poly(boardEq(q).split('=')[0]); T = Number(norm(q.board).split('=')[1]); }
      else { fun = poly(p.match(/(?:h\(t\)|A\(x\)) = (.+?) (?:feet|square feet), for/)[1]); T = Number(p.match(/solves (?:h\(t\)|A\(x\)) = (\d+)/)[1]); }
      if ((m = p.match(/pen uses (\d+) feet of fence\. With one side x feet, its area is A\(x\) = x\((\d+) - x\)/))) {
        if (Number(m[1]) !== 2 * Number(m[2])) return `${m[1]} ft of fence does not give A = x(${m[2]} − x)`;
      }
      if (/ball is thrown up/.test(p)) {
        if (fun.A.value !== -16) return 'a ball in feet should have −16t^2';
        if (fun.C.value < 0) return 'the ball starts below the ground';
        if (fun.B.value <= 0 || fun.B.value > 100) return `launch speed ${fun.B.value} ft/s is not realistic`;
      }
      if (f === 'modelMax' && (m = p.match(/gets [tx] = (.+?)\. He says/))) {
        const R = poly(`${fun.L} = ${T}`).roots;
        if (!sameSet(setOf(m[1]), uniq(R))) return `Jay's solutions ${m[1]} are not the roots`;
      }
      if (fun.k.value >= T && f === 'modelMax') return 'the target is reachable, so Jay\'s non-real roots cannot happen';
    }
  } catch (e) { return `cannot read the item: ${e.message}`; }
  return '';
}

export default { solve, sane };
