// Oracle for the lesson "complex-numbers" (Algebra 2, complex numbers). Role O, docs/lessons/QUALITY_LAYER.md.
// Written from what the student sees only: the prompt, the board TeX, the choices and the picture data (plane points,
// worked lines). Every expression is parsed and evaluated EXACTLY: a complex number is a real part + an imaginary part,
// each a sum of q·√r (q an exact fraction, r a square-free whole number), so √−99 = 3i√11, √−4 · √−9 = (2i)(3i) = −6
// (principal roots: √(−a) = i√a for a > 0, never √a·√b = √(ab) for two negatives), i^n by repeated multiplication,
// conjugates (the board's overline) and division by w through w·w̄ = c² + d². Values are compared as numbers, never as
// text. Statements (why no real root, which property, which line is invalid, always/sometimes/never, why the conjugate
// works) are judged by computing what they claim: the line whose value differs from the product, the rule that the
// changed terms break (read with i as a formal letter), the claim tested on many z = a + bi.
import { texPlain, Q } from '../../tools/quality/oracle-kit.mjs';

// ============================================================ exact reals: Σ q·√r
const sqFree = n => { let k = 1, r = n; for (let p = 2; p * p <= r; p++) while (r % (p * p) === 0) { r /= p * p; k *= p; } return [k, r]; };
class Re {
  constructor(m = new Map()) { this.m = m; }   // radicand r (square-free) → Frac
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
    for (const [r1, c1] of this.m) for (const [r2, c2] of o.m) {
      const [k, t] = sqFree(r1 * r2);
      out = out.add(Re.surd(c1.mul(c2).mul(k), t));
    }
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
// √ of a non-negative fraction n/d = √(n·d)/d
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
    const ni = n.inv();
    return this.mul(o.conj()).mul(new C(ni, new Re()));
  }
  pow(k) {
    let b = this, n = k;
    if (n < 0) { b = C.of(1).div(this); n = -n; }
    let r = C.of(1);
    for (let j = 0; j < n; j++) r = r.mul(b);
    return r;
  }
  isZero() { return this.re.isZero() && this.im.isZero(); }
  isReal() { return this.im.isZero(); }
  eq(o) { return this.sub(o).isZero(); }
  pair() { return [this.re.rat().value, this.im.rat().value]; }
}
const I = C.of(0, 1);
function sqrtC(z) {
  if (!z.isReal() || !z.re.isRat()) throw new Error('root of a non-real or irrational number');
  const q = z.re.rat();
  return q.n >= 0 ? new C(surdOf(q), new Re()) : new C(new Re(), surdOf(q.neg()));
}

// ============================================================ parsing
const norm = s => String(s ?? '').replace(/[−–]/g, '-').replace(/z̄/g, 'w').replace(/\s+/g, ' ').trim();
function tokens(s) {
  const out = [];
  const re = /\s*(\d+(?:\.\d+)?|[a-zA-Z]|√|§|[()+\-·×*÷\/^])\s*/y;
  let m, pos = 0;
  s = norm(s);
  while (pos < s.length) {
    re.lastIndex = pos;
    m = re.exec(s);
    if (!m) throw new Error(`cannot read "${s.slice(pos)}" in "${s}"`);
    out.push(m[1]); pos = re.lastIndex;
  }
  return out;
}
const isNum = t => /^\d/.test(t ?? '');
const startsAtom = t => t !== undefined && (isNum(t) || /^[a-zA-Z]$/.test(t) || t === '(' || t === '√' || t === '§');
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
      let sg = 1;
      if (T[p] === '-') { p++; sg = -1; }
      const e = atom();
      if (!e.isReal() || !e.re.isRat() || e.re.rat().d !== 1) throw new Error('exponent must be a whole number');
      return b.pow(sg * e.re.rat().n);
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
    if (t === '§') { p++; return atom().conj(); }
    throw new Error(`unexpected ${t} in "${s}"`);
  }
  const v = expr();
  if (p !== T.length) throw new Error(`left over "${T.slice(p).join('')}" in "${s}"`);
  return v;
}
const tryEv = (s, env) => { try { return ev(s, env); } catch { return null; } };
/** board TeX → plain expression text (overline → §( ) conjugate) */
function boardText(tex) {
  let s = String(tex ?? '').replace(/\\overset\{\?\}\{=\}/g, ' ?= ').replace(/\\mathbb\{(\w)\}/g, '$1');
  for (let k = 0; k < 6; k++) {   // keep a fraction's grouping: \dfrac{9i}{3i} is (9i)/(3i), not 9i/3·i
    s = s.replace(/\\overline\{([^{}]*)\}/g, '§($1)').replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
  }
  return norm(texPlain(s));
}
const lhs = tex => boardText(tex).split('=')[0].replace(/\?/g, '').trim();
const P = q => norm(q.prompt);
const choiceVals = q => (q.choices ?? []).map(c => tryEv(c));
const pickVal = (q, want) => {
  const hits = choiceVals(q).map((v, i) => (v && v.eq(want) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
};
/** index of the one choice whose statement is true (judge returns true / false / null = unknown statement) */
function pickTrue(q, judge) {
  const res = (q.choices ?? []).map(c => judge(norm(c)));
  if (res.some(r => r === null || r === undefined)) return -1;
  const hits = res.map((r, i) => (r ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
// a set of numbers written in a choice: "None: …", "9i and −9i", "9i only", "x = 11i or x = −11i"
function setOf(text) {
  const t = norm(text);
  if (/^(none|no number)\b/i.test(t)) return [];
  const parts = t.replace(/\bonly\b/, '').split(/\band\b|\bor\b/).map(x => x.replace(/^\s*x\s*=\s*/, '').trim());
  const vals = parts.map(x => tryEv(x));
  return vals.some(v => !v) ? null : vals;
}
const sameSet = (a, b) => a && b && a.length === b.length && a.every(x => b.some(y => y.eq(x))) && b.every(x => a.some(y => y.eq(x)));
const pickSet = (q, want) => {
  const hits = (q.choices ?? []).map((c, i) => (sameSet(setOf(c), want) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
};
const pairOf = z => z.pair();
const point = (q, name) => {
  const g = q.data?.picture?.plane?.given ?? [];
  return g.find(x => x.name === name) ?? (name === 'z' ? g.find(x => x.key === 'z') : undefined);
};
const pickPoint = (q, at) => {
  const g = q.data?.picture?.plane?.given ?? [];
  const hits = (q.choices ?? []).map((c, i) => {
    const m = norm(c).match(/^Point (\w)$/);
    const pt = m && g.find(x => x.name === m[1]);
    return pt && pt.at[0] === at[0] && pt.at[1] === at[1] ? i : -1;
  }).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
};

// ---- formal reading of a worked line: i as a letter t, coefficients of t^0, t^1, t^2
function formal(s) {
  const f = t => ev(s, { i: C.of(t) }).re.rat();
  const f0 = f(0), f1 = f(1), fm = f(-1);
  return [f0, f1.sub(fm).div(2), f1.add(fm).div(2).sub(f0)];
}
const termCount = s => {
  const t = norm(s).replace(/^=\s*/, '').replace(/^[-+]\s*/, '');
  let depth = 0, n = 1;
  for (let k = 0; k < t.length; k++) {
    const ch = t[k];
    if (ch === '(') depth++; else if (ch === ')') depth--;
    else if ((ch === '+' || ch === '-') && depth === 0 && k > 0 && t[k - 1] === ' ') n++;
  }
  return n;
};
const linesOf = q => (q.data?.picture?.lines?.lines ?? []).map(l => norm(texPlain(l)).replace(/^=\s*/, ''));
/** the first line (1, 2, …) whose value is not the value of the product; 0 = none */
function firstBad(lines) {
  const v0 = ev(lines[0]);
  for (let k = 1; k < lines.length; k++) if (!ev(lines[k]).eq(v0)) return k;
  return 0;
}
/** which rule line k breaks */
function brokenRule(lines, k) {
  const prev = lines[k - 1], cur = lines[k];
  const fp = formal(prev), fc = formal(cur);
  if (k === 1) {
    if (termCount(cur) < 4) return 'dist';
    // four partial products, but a value is off: the signs
    const same = [0, 1, 2].every(j => fp[j].eq(fc[j]));
    return same ? null : 'sign';
  }
  if (fp[2].eq(fc[2]) && fp[0].eq(fc[0]) && !fp[1].eq(fc[1])) return 'like';
  if (fc[2].n === 0 && fp[2].n !== 0 && fp[1].eq(fc[1])) return 'isq';
  return null;
}
const ruleOf = c => (/^i\^2 = -1/.test(c) ? 'isq' : /^The distributive/.test(c) ? 'dist' : /^The sign rule/.test(c) ? 'sign' : /^Combining like terms/.test(c) ? 'like' : null);

// ---- always / sometimes / never: test a claim about z on many z = a + bi
const SAMPLE_Z = [[0, 0], [3, 0], [-2, 0], [0, 2], [0, -3], [1, 2], [-2, 5], [3, -4], [-1, -1], [Q(1, 2), Q(3, 2)]].map(([a, b]) => C.of(a, b));
function claimOn(claim, z) {
  const env = { z, w: z.conj() };
  let m = claim.match(/^(.+?) is a (real|positive|negative) number$/);
  if (m) {
    const v = ev(m[1], env);
    if (m[2] === 'real') return v.isReal();
    if (!v.isReal()) return false;
    const x = v.re.value;
    return m[2] === 'positive' ? x > 0 : x < 0;
  }
  m = claim.match(/^(.+?)=(.+)$/);
  if (m) return ev(m[1].replace(/²/g, '^2'), env).eq(ev(m[2].replace(/²/g, '^2'), env));
  return null;
}

// ---- statements
const evEq = (a, b) => { const x = tryEv(a), y = tryEv(b); return x && y ? x.eq(y) : false; };
function judgeWhyNoReal(c, q) {
  let m;
  if (/^It has one: i = -1/.test(c)) return C.of(-1).pow(2).eq(C.of(-1));                         // (−1)² = 1, not −1
  if ((m = c.match(/^It has one: x = (.+), since \((.+)\)\^2 = (.+)\.$/))) return evEq(`(${m[2]})^2`, m[3]) && evEq(m[1], m[2]);
  if (/too big to find/.test(c)) return false;
  if (/^A real number squared is never negative/.test(c)) return true;
  const k = Number((P(q).match(/x\^2 \+ (\d+)/) ?? [])[1]);
  const at0 = x => { const v = tryEv(x); return v ? v.mul(v).add(C.of(k)).isZero() : false; };
  if ((m = c.match(/^The graph is wrong: x = (.+) gives 0\.$/))) return at0(m[1]);
  if (/^It has no solutions of any kind/.test(c)) return !(k > 0) ? null : at0(`${Math.sqrt(k)}i`) ? false : null;
  if ((m = c.match(/^No real number solves it, because x\^2 \+ (\d+) is always at least (\d+)\.$/))) return Number(m[1]) === k && Number(m[2]) === k && k > 0;
  if ((m = c.match(/^It has the real solutions x = (.+) and x = (.+)\.$/))) return at0(m[1]) && at0(m[2]);
  if (/^i is not a real number: no real number has a square of -1/.test(c)) return true;
  if (/^i is a real number between 0 and 1/.test(c)) return false;          // every real square is ≥ 0, so no real i
  if (/^i is a variable/.test(c)) return false;
  if (/^i = -1\.?$/.test(c)) return false;
  return null;
}

// ============================================================ solve
function solve(q) {
  const f = q.family, p = P(q);
  let m;
  switch (f) {
    case 'squareSign': return ev(lhs(q.board)).re.rat().value;
    case 'whyNoReal': return pickTrue(q, c => judgeWhyNoReal(c, q));
    case 'sqrtNeg': return pairOf(ev(lhs(q.board)));
    case 'rootContrast': {
      if ((m = p.match(/Which numbers have a square of (-?\d+)\?/))) { const r = sqrtC(C.of(Number(m[1]))); return pickSet(q, [r, r.neg()]); }
      if ((m = p.match(/Which number does (.+) name\?/))) return pickSet(q, [ev(m[1])]);
      return undefined;
    }
    case 'sqrtNonPerfect': return pickVal(q, ev(lhs(q.board)));
    case 'nonPerfectCoef': {   // √−99 = □ i√11: the box is the left side ÷ i√11
      const [l, r] = boardText(q.board).split('=');
      const unit = ev(r.replace('□', '').trim());
      return ev(l).div(unit).re.rat().value;
    }
    case 'readParts': return pairOf(ev(boardText(q.board).replace(/^z\s*=\s*/, '')));
    case 'planeRead': {
      const name = (p.match(/at point (\w)\?/) ?? [])[1];
      const pt = point(q, name);
      return pt ? [pt.at[0], pt.at[1]] : undefined;
    }
    case 'stdFormPick': {
      if ((m = p.match(/^What is the imaginary part of (.+)\?$/))) return pickVal(q, new C(ev(m[1]).im, new Re()));
      if ((m = p.match(/^What is the real part of (.+)\?$/))) return pickVal(q, new C(ev(m[1]).re, new Re()));
      if ((m = p.match(/real part (.+) and imaginary part (.+)\?$/))) return pickVal(q, ev(m[1]).add(ev(m[2]).mul(I)));
      return undefined;
    }
    case 'classify': {
      const z = ev(boardText(q.board));
      const kind = z.isReal() ? 'Real' : z.re.isZero() ? 'Purely' : 'Neither';
      return pickTrue(q, c => c.startsWith(kind));
    }
    case 'setTruth': {
      if ((m = p.match(/^Is (.+) a complex number\?$/))) {
        const z = ev(m[1]);   // anything we can write as a + bi is complex
        return pickTrue(q, c => (/^Yes: it is a \+ bi with b = 0\.$/.test(c) ? z.isReal()
          : /^Yes/.test(c) ? null : /^No/.test(c) ? false : null));
      }
      if ((m = p.match(/^Solve x\^2 = (-?\d+) in the complex numbers/))) { const r = sqrtC(C.of(Number(m[1]))); return pickSet(q, [r, r.neg()]); }
      if (/^Which statement is true\?/.test(p)) return pickTrue(q, c => {
        if (c === 'Every real number is a complex number.') return true;      // x = x + 0i
        if (c === 'No real number is a complex number.') return false;
        if (c === 'Every complex number is a real number.') return I.isReal();
        if (c === '0 is purely imaginary.') return false;                     // 0 = 0 + 0i: b = 0
        return null;
      });
      return undefined;
    }
    case 'whichEqual': return pickVal(q, ev(boardText(q.board)));
    case 'solveEqual': {   // a x + b y + c = 0 in both parts
      const [l, r] = boardText(q.board).split('=');
      const F = (x, y) => ev(l, { x: C.of(x), y: C.of(y) }).sub(ev(r, { x: C.of(x), y: C.of(y) }));
      const f0 = F(0, 0), fx = F(1, 0).sub(f0), fy = F(0, 1).sub(f0);
      const [a1, b1, c1] = [fx.re.rat(), fy.re.rat(), f0.re.rat()], [a2, b2, c2] = [fx.im.rat(), fy.im.rat(), f0.im.rat()];
      const D = a1.mul(b2).sub(a2.mul(b1));
      const x = c1.neg().mul(b2).sub(c2.neg().mul(b1)).div(D), y = a1.mul(c2.neg()).sub(a2.mul(c1.neg())).div(D);
      return [x.value, y.value];
    }
    case 'addPair': case 'subPair': case 'monoProduct': case 'scaleDistribute': case 'rotateByI': case 'binProduct':
    case 'squareComplex': case 'radProduct': case 'iPowerSum': case 'conjPair': case 'conjProduct': case 'divReal':
    case 'divI': case 'divComplex': case 'checkProduct':
      return pairOf(ev(lhs(q.board)));
    case 'fracAddSub': case 'divRealFrac': case 'iPower': return pickVal(q, ev(lhs(q.board)));
    case 'propertyName': {
      const [l, r] = boardText(q.board).split('=').map(x => x.trim());
      if (!ev(l).eq(ev(r))) return -1;
      let kind = null;
      if (/^\([^()]*\) \+ \([^()]*\)$/.test(l) && /^\([^()]*\) \+ \([^()]*\)$/.test(r)) kind = /addition/;           // regroup a sum
      else if (/^\([^()]*\)\([^()]*\)$/.test(l) && /^[^()]+\([^()]*\) \+ [^()]+\([^()]*\)$/.test(r)) kind = /^the distributive/;
      else if ((m = l.match(/^i · (\d+)$/)) && r === `${m[1]}i`) kind = /commutative property of multiplication/;
      return kind ? pickTrue(q, c => kind.test(c)) : -1;
    }
    case 'radTrapChoice': {
      if ((m = p.match(/^Which number equals (.+)\?$/))) return pickVal(q, ev(m[1]));
      if ((m = p.match(/^Sam writes: (.+?) = √\(\((.+)\)\((.+)\)\) = (.+?) = (.+)\. Which statement is right\?$/))) {
        const prod = ev(m[1]), samFirst = sqrtC(ev(`(${m[2]})(${m[3]})`));
        return pickTrue(q, c => {
          let k;
          if (/^Sam is right/.test(c)) return prod.eq(ev(m[5]));
          if ((k = c.match(/^The last step is wrong: (.+) = (.+)\.$/))) return !ev(k[1]).eq(ev(m[5])) && ev(k[1]).eq(ev(k[2]));
          if ((k = c.match(/^The first step is wrong: .*The product is (.+)\.$/))) return !prod.eq(samFirst) && prod.eq(ev(k[1]));
          if (/^Both roots are not defined/.test(c)) return false;
          return null;
        });
      }
      return undefined;
    }
    case 'conjPlane': {
      const z = point(q, 'z');
      return z ? pickPoint(q, [z.at[0], -z.at[1]]) : -1;
    }
    case 'divIRotate': {   // z ÷ i = −i z: (x, y) → (y, −x)
      const z = point(q, 'z');
      return z ? pickPoint(q, [z.at[1], -z.at[0]]) : -1;
    }
    case 'sumSquaresPick': {
      const n = Number((p.match(/equals (-?\d+)\?/) ?? [])[1]);
      return pickVal(q, C.of(n));
    }
    case 'distance': {
      const z = ev(boardText(q.board).replace(/^z\s*=\s*/, ''));
      const n = z.norm().rat().value, r = Math.round(Math.sqrt(n));
      return r * r === n ? r : Math.sqrt(n);
    }
    case 'divSteps': {
      if ((m = p.match(/^What is (.+) ÷ (.+)\?$/))) {
        const top = ev(m[1]), bot = ev(m[2]);
        if (bot.isZero()) return pickTrue(q, c => (/^Not defined/.test(c) ? !top.isZero() : /^Multiply top and bottom/.test(c) ? false : tryEv(c) ? false : null));
        return pickVal(q, top.div(bot));
      }
      if ((m = p.match(/^To write \((.+)\)\/\((.+)\) in a \+ bi form, what should you multiply it by\?$/))) {
        const bot = ev(m[2]);
        return pickTrue(q, c => {
          if (/on the bottom only$/.test(c)) return false;                      // changes the value
          const k = c.match(/^\((.+)\)\/\((.+)\)$/);
          if (!k) return null;
          const x = ev(k[1]), y = ev(k[2]);
          return x.eq(y) && !x.isZero() && bot.mul(x).isReal();                 // a form of 1 that makes the bottom real
        });
      }
      return undefined;
    }
    case 'findError': {
      const L = linesOf(q), k = firstBad(L), last = L[L.length - 1];
      const unfinished = formal(last)[2].n !== 0 || termCount(last) > 2;   // an i² left, or i terms not collected
      return pickTrue(q, c => (/^No invalid step/.test(c) ? k === 0 && (!/not finished/.test(c) || unfinished)
        : (m = c.match(/^Line (\d+)$/)) ? Number(m[1]) === k : null));
    }
    case 'nameRule': {
      const L = linesOf(q), k = firstBad(L);
      if (!k) return -1;
      const rule = brokenRule(L, k);
      return rule ? pickTrue(q, c => ruleOf(c) === rule) : -1;
    }
    case 'finishWork': return pairOf(ev(linesOf(q)[0]));
    case 'conjProofStep': {
      if (/What does the whole product simplify to\?/.test(p)) {
        const target = (a, b) => ev('(a + bi)(a - bi)', { a: C.of(a), b: C.of(b) });
        return pickTrue(q, c => {
          const S = [[2, 3], [-1, 5], [4, -7]];
          const ok = S.map(([a, b]) => { const v = tryEv(c, { a: C.of(a), b: C.of(b) }); return v ? v.eq(target(a, b)) : false; });
          return ok.every(Boolean);
        });
      }
      if (/When is it equal to 0\?/.test(p)) return pickTrue(q, c => {
        const zero = (a, b) => C.of(a * a + b * b).isZero();
        if (/^Never/.test(c)) return !zero(0, 0);
        if (c === 'When a = b.') return zero(1, 1);
        if (c === 'When a = -b.') return zero(1, -1);
        if (/^Only when a = 0 and b = 0/.test(c)) return zero(0, 0) && !zero(1, 0) && !zero(0, 1);
        return null;
      });
      if (/Why is a\^2 \+ b\^2 ≥ 0/.test(p)) return pickTrue(q, c => {
        if (/^a and b are real, real squares are never negative/.test(c)) return true;
        if (/worked for every z we tried/.test(c)) return false;              // examples are not a proof
        if (/^Because i\^2 = -1/.test(c)) return false;                        // a² + b² has no i in it
        if (/^Because a and b are positive/.test(c)) return false;            // a = −7 is allowed
        return null;
      });
      if (/the middle terms are/.test(p)) return pickTrue(q, c => {
        const k = c.match(/^(.+?), because/);
        if (!k) return null;
        const v = tryEv(k[1], { a: C.of(3), b: C.of(5) });
        return !!v && v.isZero();                                              // −abi + abi = 0
      });
      if (/Does that prove/.test(p)) return pickTrue(q, c => (/^No: examples check some numbers/.test(c) ? true : /^Yes/.test(c) ? false : null));
      return undefined;
    }
    case 'alwaysSometimes': {
      const claim = (p.match(/Always, sometimes, or never true\? (.+?)\. \(Try/) ?? [])[1];
      if (!claim) return undefined;
      const res = SAMPLE_Z.map(z => claimOn(claim, z));
      if (res.some(r => r === null)) return -1;
      const kind = res.every(Boolean) ? 'Always' : res.some(Boolean) ? 'Sometimes' : 'Never';
      return pickTrue(q, c => c.startsWith(kind));
    }
    case 'verifyQuot': {
      if ((m = p.match(/^Ana says (.+?) ÷ (.+?) = (.+?)\. Multiplying back: /))) {
        const top = ev(m[1]), bot = ev(m[2]), ana = ev(m[3]);
        const checks = ana.mul(bot).eq(top);
        return pickTrue(q, c => {
          let k;
          if ((k = c.match(/^It checks: the product is (.+)\.$/))) return checks && ev(k[1]).eq(top);
          if ((k = c.match(/^It does not check: the product is not (.+)\.$/))) return !checks && ev(k[1]).eq(top);
          if (/^To be sure, divide again/.test(c)) return false;
          return null;
        });
      }
      if ((m = p.match(/^Ben says (.+?) ÷ (.+?) = (.+?)\. Multiplying back: /))) {
        const quot = ev(m[1]).div(ev(m[2])), ben = ev(m[3]);
        const equal = ben.eq(quot), finished = !/\//.test(m[3]);
        return pickTrue(q, c => {
          let k;
          if (c === 'Equal and finished.') return equal && finished;
          if ((k = c.match(/^Equal, but not finished: it is (.+) in a \+ bi form\.$/))) return equal && !finished && ev(k[1]).eq(quot);
          if (/^Wrong, because it is not in a \+ bi form/.test(c)) return false;   // a value is not wrong for its form
          return null;
        });
      }
      return undefined;
    }
    case 'whyConj': {
      if ((m = p.match(/^Why is it allowed to multiply \((.+?)\)\/\((.+?)\) by \((.+?)\)\/\((.+?)\)\?$/))) {
        const x = ev(m[3]), y = ev(m[4]);
        return pickTrue(q, c => {
          if (/equals 1, so the value does not change\.$/.test(c)) return x.eq(y) && !x.isZero();
          if (/^It changes the value/.test(c)) return !(x.eq(y) && !x.isZero());
          if (/^It divides the quotient by/.test(c)) return false;             // ×(x/x) = ×1
          return null;
        });
      }
      if ((m = p.match(/^Lee rewrites/))) return pickTrue(q, c => (/^No: a real bottom does not show/.test(c) ? true : /^Yes/.test(c) ? false : null));
      if (/Why can c\^2 \+ d\^2 never be 0/.test(p)) return pickTrue(q, c => {
        if (/^Dividing needs c \+ di ≠ 0/.test(c)) return true;
        if (/^It can be 0, when c = d/.test(c)) return C.of(1 + 1).isZero();     // c = d = 1 gives 2
        if (/^Because i\^2 = -1/.test(c)) return false;
        return null;
      });
      if ((m = p.match(/^Why multiply \((.+?)\)\/\((.+?)\) by \((.+?)\)\/\((.+?)\) and not by \((.+?)\)\/\((.+?)\)\?$/))) {
        const bot = ev(m[2]), conj = ev(m[3]), same = ev(m[5]);
        return pickTrue(q, c => {
          let k;
          if ((k = c.match(/^(.+?) = (.+?) is real; (.+?) = (.+?) is not\.$/))) {
            const a = ev(k[1]), av = ev(k[2]), b = ev(k[3]), bv = ev(k[4]);
            return a.eq(bot.mul(conj)) && a.eq(av) && av.isReal() && b.eq(bot.mul(same)) && b.eq(bv) && !bv.isReal();
          }
          if ((k = c.match(/^\((.+)\)\/\((.+)\) is not equal to 1\.$/))) return !ev(k[1]).div(ev(k[2])).eq(C.of(1));
          if (/^Multiplying by .+ divides by/.test(c)) return false;
          return null;
        });
      }
      return undefined;
    }
    case 'newDenominator': return ev(lhs(q.board)).re.rat().value;
    default: return undefined;
  }
}

// ============================================================ sane
const terminating = v => { let d = v.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
function sane(q) {
  const p = P(q);
  let m;
  try {
    if (q.input === 'pair') {
      const fams = ['addPair', 'subPair', 'monoProduct', 'scaleDistribute', 'rotateByI', 'binProduct', 'squareComplex', 'radProduct',
        'iPowerSum', 'conjPair', 'conjProduct', 'divReal', 'divI', 'divComplex', 'checkProduct', 'sqrtNeg'];
      if (fams.includes(q.family)) {
        const z = ev(lhs(q.board));
        if (!z.re.isRat() || !z.im.isRat()) return 'the answer has a root in it but the boxes take numbers';
        if (!terminating(z.re.rat()) || !terminating(z.im.rat())) return 'a part of the answer is not a terminating decimal';
      }
    }
    if (q.family === 'distance') {
      const z = ev(boardText(q.board).replace(/^z\s*=\s*/, ''));
      const n = z.norm().rat().value;
      if (Math.round(Math.sqrt(n)) ** 2 !== n) return `the distance √${n} is not a whole number and no rounding is asked`;
    }
    if (q.family === 'verifyQuot' && (m = p.match(/Multiplying back: (.+) = (.+?)\. What is true\?$/))) {
      if (!ev(m[1]).eq(ev(m[2]))) return `the stated product ${m[1]} = ${m[2]} is wrong`;
    }
    if (q.family === 'nameRule' && (m = p.match(/line (\d+) is the first invalid step/))) {
      const k = firstBad(linesOf(q));
      if (k !== Number(m[1])) return `the prompt says line ${m[1]} is the first invalid step, but it is line ${k}`;
    }
    if (q.family === 'finishWork') {
      const k = firstBad(linesOf(q));
      if (/has no invalid step/.test(p) && k) return `the work says "no invalid step" but line ${k} is invalid`;
      if ((m = p.match(/goes wrong in line (\d+)/)) && k !== Number(m[1])) return `the prompt says line ${m[1]} goes wrong, but the first invalid line is ${k || 'none'}`;
    }
    if (q.family === 'conjProofStep' && (m = p.match(/for z = (.+?): (.+?)\)/))) {
      const z = ev(m[1]), a = z.re.rat(), b = z.im.rat(), shown = m[2];
      let want;
      if (/last term/.test(p)) want = ev(shown.replace(/i\^2/, '(i^2)')).eq(C.of(b.mul(b).neg()).mul(I).mul(I));
      else if (/middle terms/.test(p)) { const k = shown.match(/^(.+?) \+ (.+)$/); want = k && ev(k[2]).eq(C.of(a.mul(b)).mul(I)) && ev(k[1]).eq(C.of(a.mul(b)).mul(I).neg()); }
      else { const k = shown.match(/^(.+) \+ (.+)$/); want = k && ev(k[1]).eq(C.of(a.mul(a))) && ev(k[2]).eq(C.of(b.mul(b))); }
      if (!want) return `the worked example "${shown}" does not match z = ${m[1]}`;
    }
    if (q.family === 'whyConj' && (m = p.match(/^After multiplying by \((.+?)\)\/.+the bottom is c\^2 \+ d\^2 = (\d+)\./))) {
      const b = ev(texPlain((String(q.board).match(/\\dfrac\{[^{}]*\}\{([^{}]*)\}/) ?? [])[1] ?? ''));
      if (!b.norm().eq(Re.q(Number(m[2])))) return `c^2 + d^2 = ${m[2]} is not the bottom's value`;
    }
  } catch (e) { return `cannot read the item: ${e.message}`; }
  return '';
}

export default { solve, sane };
